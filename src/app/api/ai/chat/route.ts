import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ToolValidator } from '@/lib/tool-validator';
import { mcpService } from '@/services/mcpService';
import { SYSTEM_MESSAGE } from '@/lib/prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

// Helper function to execute tool calls through MCP service
async function executeToolCall(toolCall: { name: string; arguments: Record<string, unknown> }, token: string): Promise<unknown> {
  const { name, arguments: args } = toolCall;
  
  switch (name) {
    case 'deploy_service':
      return await mcpService.deployService(
        token,
        args.service_name as string,
        args.version as string,
        args.environment as string
      );
      
    case 'rollback_deployment':
      return await mcpService.rollbackDeployment(
        token,
        args.deployment_id as string,
        args.reason as string,
        args.environment as string
      );
      
    case 'getMcpResourcesLogs':
      return await mcpService.getLogs(
        token,
        args.level as string,
        args.limit as number
      );
      
    case 'getMcpResourcesMetrics':
      return await mcpService.getMetrics(
        token,
        args.limit as number
      );
      
    case 'authenticate_user':
      return await mcpService.authenticateUser(
        token
      );
      
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your environment variables.' 
      }, { status: 500 });
    }

    const { message, context, previousResponseId } = await request.json();
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
    }

    // Extract token from authorization header
    const token = authHeader.replace('Bearer ', '');

    // Build system message for first interaction or continue conversation
    const systemMessage = SYSTEM_MESSAGE;

    // Build conversation history
    let conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content: systemMessage
      }
    ];

    // Add previous conversation history if available
    if (previousResponseId && context?.conversationHistory) {
      conversationHistory = [...conversationHistory, ...context.conversationHistory];
    }

    // Add current user message
    conversationHistory.push({
      role: "user",
      content: message
    });

    // Call OpenAI chat completions API
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: conversationHistory,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Check if the response contains tool calls
    let toolCalls = [];
    const toolResults = [];
    const validationResults = [];
    let finalReply = reply;
    
    try {
      const parsedReply = JSON.parse(reply);
      if (parsedReply.toolCalls && Array.isArray(parsedReply.toolCalls)) {
        // Validate each tool call
        for (const toolCall of parsedReply.toolCalls) {
          const validation = ToolValidator.validateToolCall(toolCall);
          validationResults.push(validation);
          
          if (validation.isValid) {
            // Execute the tool call through MCP service
            try {
              const result = await executeToolCall(toolCall, token);
              toolCalls.push(toolCall);
              toolResults.push(result);
            } catch (error) {
              const executionError = {
                toolName: toolCall.name,
                error: error instanceof Error ? error.message : 'Tool execution failed',
                details: error
              };
              toolResults.push(executionError);
            }
          } else {
            // Generate follow-up questions for invalid tool calls
            const followUpMessage = ToolValidator.generateFollowUpMessage(
              toolCall.name, 
              validation.missingParameters
            );
            
            if (followUpMessage) {
              // Override the reply with follow-up questions
              finalReply = followUpMessage;
              toolCalls = []; // Clear tool calls since we need more info
            }
          }
        }
      }
    } catch {
      // Not a JSON response, treat as regular text
    }

    // Build updated conversation history for client
    const updatedHistory = [
      ...conversationHistory,
      {
        role: "assistant",
        content: reply
      }
    ];

    return NextResponse.json({ 
      content: finalReply,
      toolCalls,
      toolResults,
      validationResults,
      conversationHistory: updatedHistory // Return the full conversation history
    });
  } catch (error: unknown) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
