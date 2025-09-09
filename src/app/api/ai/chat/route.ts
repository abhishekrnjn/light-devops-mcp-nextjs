import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { toolDiscoveryService } from '@/services/toolDiscoveryService';
import { createAIError } from '@/services/errorHandlingService';
import { conversationStateService } from '@/services/conversationStateService';
import { toolExecutionService } from '@/services/toolExecutionService';
import { followUpQuestionService } from '@/services/followUpQuestionService';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let conversationId: string | null = null;

  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.' 
      }, { status: 500 });
    }

    const { message, context, conversationId: providedConversationId } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Extract token from authorization header
    const token = authHeader.replace('Bearer ', '');
    
    // Set up conversation
    if (providedConversationId) {
      conversationId = providedConversationId;
      conversationStateService.setCurrentConversation(conversationId!);
    } else {
      conversationId = conversationStateService.createConversation();
    }

    // Get available tools for user
    const toolsResult = await toolDiscoveryService.getAvailableTools(token);
    if (!toolsResult.success) {
      const error = createAIError('AI_RESPONSE_INVALID', {
        toolName: 'tool_discovery',
        timestamp: Date.now(),
        conversationId: conversationId || undefined
      }, new Error(toolsResult.error));
      
      return NextResponse.json({
        error: error.userMessage,
        errorCode: error.code,
        conversationId
      }, { status: 500 });
    }

    // Filter tools based on user permissions
    const userPermissions = context?.userPermissions || {};
    const availableTools = toolDiscoveryService.getToolsForUser(toolsResult.tools, userPermissions);
    
    // Convert tools to OpenAI function calling format
    const openAITools = toolDiscoveryService.convertToOpenAIFunctions(availableTools);

    // Build system message
    const systemMessage = `You are a DevOps assistant that helps manage logs, metrics, and deployments by calling MCP endpoints when needed.

You have access to the following MCP tools:
${availableTools.map(tool => `- ${tool.name}: ${tool.description}`).join('\n')}

When users ask about logs, metrics, deployments, or rollbacks, you should call the appropriate MCP tool.
Always provide helpful and accurate information based on the tool responses.

If you need to call a tool, use the function calling capability. The tool will be executed automatically and the results will be provided to you.

Always provide clear, helpful responses in natural language. If a tool execution fails, explain the error and suggest alternatives.`;

    // Get conversation history
    const conversationHistory = conversationStateService.getConversationHistoryWithSystem(
      systemMessage,
      conversationId!
    );

    // Add current user message
    conversationStateService.addUserMessage(message);

    // Prepare messages for OpenAI
    const messages = conversationHistory.map(msg => ({
      role: msg.role as 'system' | 'user' | 'assistant',
      content: msg.content
    }));

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI chat completions API with function calling
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      tools: openAITools.length > 0 ? openAITools : undefined,
      tool_choice: openAITools.length > 0 ? 'auto' : undefined,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message;
    if (!response) {
      const error = createAIError('AI_RESPONSE_EMPTY', {
        toolName: 'ai_response',
        timestamp: Date.now(),
        conversationId: conversationId || undefined
      });
      
      return NextResponse.json({
        error: error.userMessage,
        errorCode: error.code,
        conversationId
      }, { status: 500 });
    }

    let content = response.content || "I'm sorry, I couldn't generate a response.";
    let toolCalls: OpenAI.Chat.Completions.ChatCompletionMessageToolCall[] = [];
    const toolResults: Array<{ tool_call_id: string; role: 'tool'; content: string }> = [];

    // Handle tool calls
    if (response.tool_calls && response.tool_calls.length > 0) {
      toolCalls = response.tool_calls;
      
      // Execute tool calls
      const toolExecutionRequests = response.tool_calls.map(toolCall => {
        const func = 'function' in toolCall ? toolCall.function : null;
        if (!func) throw new Error('Invalid tool call format');
        return {
          toolName: func.name,
          parameters: JSON.parse(func.arguments),
          userId: context?.userId,
          conversationId: conversationId || undefined,
          requestId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        };
      });

      const toolExecutionResults = await toolExecutionService.executeTools(toolExecutionRequests);
      
      // Process tool results
      for (let i = 0; i < toolExecutionResults.length; i++) {
        const result = toolExecutionResults[i];
        const toolCall = response.tool_calls[i];
        
        if (result.success) {
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify(result.result)
          });
        } else {
          // Handle tool execution error
          const errorMessage = result.error?.userMessage || 'Tool execution failed';
          toolResults.push({
            tool_call_id: toolCall.id,
            role: 'tool',
            content: JSON.stringify({
              error: true,
              code: result.error?.code,
              message: errorMessage
            })
          });
        }
      }

      // Add tool results to conversation
      toolResults.forEach(toolResult => {
        conversationStateService.addMessage({
          role: 'assistant',
          content: toolResult.content,
          timestamp: Date.now()
        });
      });

      // Get final response from AI with tool results
      const finalMessages = [
        ...messages,
        {
          role: 'assistant' as const,
          content: response.content,
          tool_calls: response.tool_calls
        },
        ...toolResults
      ];

      const finalCompletion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: finalMessages,
        temperature: 0.7,
      });

      content = finalCompletion.choices[0]?.message?.content || content;
    }

    // Add assistant response to conversation
    conversationStateService.addAssistantMessage(content, toolCalls.map(tc => {
      const func = 'function' in tc ? tc.function : null;
      if (!func) throw new Error('Invalid tool call format');
      return {
        name: func.name,
        arguments: JSON.parse(func.arguments),
        result: toolResults.find(tr => tr.tool_call_id === tc.id)?.content
      };
    }));

    // Generate follow-up questions if needed
    let followUpQuestions: string[] = [];
    if (toolCalls.length === 0 && availableTools.length > 0) {
      const contextualQuestions = followUpQuestionService.generateContextualQuestions(
        message,
        availableTools
      );
      followUpQuestions = followUpQuestionService.formatQuestionsForDisplay(contextualQuestions);
    }

    // Get updated conversation history
    const updatedHistory = conversationStateService.getConversationHistory(conversationId!);

    return NextResponse.json({ 
      content,
      toolCalls: toolCalls.map(tc => {
        const func = 'function' in tc ? tc.function : null;
        if (!func) throw new Error('Invalid tool call format');
        return {
          name: func.name,
          arguments: JSON.parse(func.arguments)
        };
      }),
      toolResults,
      followUpQuestions,
      conversationHistory: updatedHistory,
      conversationId,
      executionTime: Date.now() - startTime
    });

  } catch (error: unknown) {
    console.error('AI Chat Error:', error);
    
    const chatError = createAIError('AI_RESPONSE_INVALID', {
      toolName: 'ai_chat',
      timestamp: Date.now(),
      conversationId: conversationId || undefined
    }, error);

    return NextResponse.json({
      error: chatError.userMessage,
      errorCode: chatError.code,
      conversationId,
      executionTime: Date.now() - startTime
    }, { status: 500 });
  }
}
