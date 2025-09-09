import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { ToolValidator } from '@/lib/tool-validator';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

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

    // Build system message for first interaction or continue conversation
    const systemMessage = `You are a DevOps assistant that helps manage logs, metrics, and deployments by calling MCP endpoints when needed.

You have access to the following MCP tools:
- deploy_service: Deploy a service to a specific environment (development, staging, production)
  Required parameters: service_name (NOT "service"), version, environment
- rollback_deployment: Rollback a deployment to previous version
  Required parameters: deployment_id, reason, environment (staging or production)
- authenticate_user: Authenticate user and get permissions
  Required parameters: session_token
- getMcpResourcesLogs: Get system logs with optional filtering
  Optional parameters: level (DEBUG, INFO, WARN, ERROR), limit, since
- getMcpResourcesMetrics: Get performance metrics with optional filtering
  Optional parameters: limit, service, metric_type

CRITICAL: Use EXACT parameter names as specified above. For deploy_service, use "service_name" not "service".

IMPORTANT PARAMETER VALIDATION RULES:
1. ALWAYS ask follow-up questions for missing required parameters before making tool calls
2. For deploy_service: Ask "What service name?", "What version?", "Which environment?"
3. For rollback_deployment: Ask "What deployment ID?", "What's the reason?", "Which environment?"
4. For authenticate_user: Ask "Please provide your session token"
5. For logs/metrics: Ask about optional parameters only if the user wants specific filtering

When users ask about logs, metrics, deployments, or rollbacks, you should call the appropriate MCP tool.
Always provide helpful and accurate information based on the tool responses.

If you need to call a tool, respond with a JSON object containing:
{
  "toolCalls": [
    {
      "name": "tool_name",
      "arguments": {
        "param1": "value1",
        "param2": "value2"
      }
    }
  ]
}

EXAMPLES:
For deploy_service:
{
  "toolCalls": [
    {
      "name": "deploy_service",
      "arguments": {
        "service_name": "payment-service",
        "version": "v1.2.3",
        "environment": "staging"
      }
    }
  ]
}

For rollback_deployment:
{
  "toolCalls": [
    {
      "name": "rollback_deployment",
      "arguments": {
        "deployment_id": "deploy-12345",
        "reason": "Critical bug found",
        "environment": "production"
      }
    }
  ]
}

If required parameters are missing, ask follow-up questions instead of making the tool call.
Otherwise, provide a helpful response based on the conversation.`;

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

    let reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Check if the response contains tool calls
    let toolCalls = [];
    const validationResults = [];
    
    try {
      const parsedReply = JSON.parse(reply);
      if (parsedReply.toolCalls && Array.isArray(parsedReply.toolCalls)) {
        // Validate each tool call
        for (const toolCall of parsedReply.toolCalls) {
          // Fix common parameter name mismatches
          if (toolCall.name === 'deploy_service' && toolCall.arguments) {
            if (toolCall.arguments.service && !toolCall.arguments.service_name) {
              toolCall.arguments.service_name = toolCall.arguments.service;
              delete toolCall.arguments.service;
            }
          }
          
          const validation = ToolValidator.validateToolCall(toolCall);
          validationResults.push(validation);
          
          if (validation.isValid) {
            toolCalls.push(toolCall);
          } else {
            // Generate follow-up questions for invalid tool calls
            const followUpMessage = ToolValidator.generateFollowUpMessage(
              toolCall.name, 
              validation.missingParameters
            );
            
            if (followUpMessage) {
              // Override the reply with follow-up questions
              reply = followUpMessage;
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
      content: reply,
      toolCalls,
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
