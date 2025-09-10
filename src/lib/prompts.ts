/**
 * AI Assistant Prompts and Instructions
 * 
 * This file contains all the system messages, prompts, and instructions
 * used by the AI assistant in the chat API.
 */

export const SYSTEM_MESSAGE = `You are a DevOps assistant that helps manage logs, metrics, and deployments by calling MCP endpoints when needed.

You have access to the following MCP tools:
- deploy_service: Deploy a service to a specific environment (development, staging, production)
  Required parameters: service_name, version, environment
- rollback_deployment: Rollback a deployment to previous version
  Required parameters: deployment_id, reason, environment (staging or production)
- authenticate_user: Authenticate user and get permissions
  Required parameters: session_token
- getMcpResourcesLogs: Get system logs with optional filtering
  Optional parameters: level (DEBUG, INFO, WARN, ERROR), limit, since
- getMcpResourcesMetrics: Get performance metrics with optional filtering
  Optional parameters: limit, service, metric_type

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

If required parameters are missing, ask follow-up questions instead of making the tool call.
Otherwise, provide a helpful response based on the conversation.`;

/**
 * Tool call response format for the AI assistant
 */
export const TOOL_CALL_FORMAT = {
  toolCalls: [
    {
      name: "tool_name",
      arguments: {
        param1: "value1",
        param2: "value2"
      }
    }
  ]
} as const;

/**
 * Available MCP tools configuration
 */
export const MCP_TOOLS = {
  deploy_service: {
    description: "Deploy a service to a specific environment (development, staging, production)",
    requiredParameters: ["service_name", "version", "environment"]
  },
  rollback_deployment: {
    description: "Rollback a deployment to previous version",
    requiredParameters: ["deployment_id", "reason", "environment"]
  },
  authenticate_user: {
    description: "Authenticate user and get permissions",
    requiredParameters: ["session_token"]
  },
  getMcpResourcesLogs: {
    description: "Get system logs with optional filtering",
    requiredParameters: [],
    optionalParameters: ["level", "limit", "since"]
  },
  getMcpResourcesMetrics: {
    description: "Get performance metrics with optional filtering",
    requiredParameters: [],
    optionalParameters: ["limit", "service", "metric_type"]
  }
} as const;

/**
 * Parameter validation rules and follow-up questions
 */
export const VALIDATION_RULES = {
  deploy_service: {
    missingQuestions: {
      service_name: "What service name?",
      version: "What version?",
      environment: "Which environment?"
    }
  },
  rollback_deployment: {
    missingQuestions: {
      deployment_id: "What deployment ID?",
      reason: "What's the reason?",
      environment: "Which environment?"
    }
  },
  authenticate_user: {
    missingQuestions: {
      session_token: "Please provide your session token"
    }
  }
} as const;
