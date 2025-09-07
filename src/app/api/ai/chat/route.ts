import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

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
- get_logs: Fetch system logs with optional level and limit filters
- get_metrics: Fetch system metrics with optional limit
- deploy_service: Deploy services to staging or production environments
- rollback_staging: Rollback deployments in staging environment
- rollback_production: Rollback deployments in production environment
- authenticate_user: Authenticate users

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

    const reply = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    // Check if the response contains tool calls
    let toolCalls = [];
    try {
      const parsedReply = JSON.parse(reply);
      if (parsedReply.toolCalls && Array.isArray(parsedReply.toolCalls)) {
        toolCalls = parsedReply.toolCalls;
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
      conversationHistory: updatedHistory // Return the full conversation history
    });
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
