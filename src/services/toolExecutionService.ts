import { mcpService } from './mcpService';
import { toolDiscoveryService, ToolMetadata } from './toolDiscoveryService';
import { errorHandlingService, ErrorContext, createToolError, createPermissionError, createValidationError } from './errorHandlingService';
import { conversationStateService } from './conversationStateService';

export interface ToolExecutionRequest {
  toolName: string;
  parameters: Record<string, unknown>;
  userId?: string;
  conversationId?: string;
  requestId?: string;
}

export interface ToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
    userMessage: string;
    retryable: boolean;
    retryAfter?: number;
  };
  executionTime: number;
  toolName: string;
  parameters: Record<string, unknown>;
}

export interface ToolExecutionContext {
  userId?: string;
  conversationId?: string;
  requestId?: string;
  timestamp: number;
}

export class ToolExecutionService {
  private executionQueue: Map<string, Promise<ToolExecutionResult>> = new Map();
  private executionHistory: ToolExecutionResult[] = [];
  private readonly MAX_HISTORY_SIZE = 1000;

  // Execute a single tool
  async executeTool(request: ToolExecutionRequest): Promise<ToolExecutionResult> {
    const startTime = Date.now();
    const context: ToolExecutionContext = {
      userId: request.userId,
      conversationId: request.conversationId,
      requestId: request.requestId,
      timestamp: Date.now()
    };

    // Check if tool is already being executed
    const executionKey = `${request.toolName}_${JSON.stringify(request.parameters)}`;
    if (this.executionQueue.has(executionKey)) {
      return this.executionQueue.get(executionKey)!;
    }

    // Create execution promise
    const executionPromise = this._executeToolInternal(request, context, startTime);
    this.executionQueue.set(executionKey, executionPromise);

    try {
      const result = await executionPromise;
      this.addToHistory(result);
      return result;
    } finally {
      this.executionQueue.delete(executionKey);
    }
  }

  // Internal tool execution
  private async _executeToolInternal(
    request: ToolExecutionRequest,
    context: ToolExecutionContext,
    startTime: number
  ): Promise<ToolExecutionResult> {
    const executionTime = Date.now() - startTime;

    try {
      // Get tool metadata
      const toolMetadata = toolDiscoveryService.getToolMetadata(request.toolName);
      if (!toolMetadata) {
        const error = createToolError('TOOL_NOT_FOUND', {
          toolName: request.toolName,
          parameters: request.parameters,
          ...context
        });
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            userMessage: error.userMessage,
            retryable: error.retryable,
            retryAfter: error.retryAfter
          },
          executionTime,
          toolName: request.toolName,
          parameters: request.parameters
        };
      }

      // Validate parameters
      const validation = toolDiscoveryService.validateToolParameters(request.toolName, request.parameters);
      if (!validation.valid) {
        const error = createValidationError('VALIDATION_INVALID_PARAMETER', {
          toolName: request.toolName,
          parameters: request.parameters,
          ...context
        }, validation.errors.join(', '));
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            userMessage: error.userMessage,
            retryable: error.retryable,
            retryAfter: error.retryAfter
          },
          executionTime,
          toolName: request.toolName,
          parameters: request.parameters
        };
      }

      // Execute the tool
      const result = await this._executeToolCall(request.toolName, request.parameters, context);
      
      return {
        success: true,
        result,
        executionTime: Date.now() - startTime,
        toolName: request.toolName,
        parameters: request.parameters
      };

    } catch (error) {
      const chatError = createToolError('TOOL_EXECUTION_FAILED', {
        toolName: request.toolName,
        parameters: request.parameters,
        ...context
      }, error);

      return {
        success: false,
        error: {
          code: chatError.code,
          message: chatError.message,
          userMessage: chatError.userMessage,
          retryable: chatError.retryable,
          retryAfter: chatError.retryAfter
        },
        executionTime: Date.now() - startTime,
        toolName: request.toolName,
        parameters: request.parameters
      };
    }
  }

  // Execute tool call based on tool name
  private async _executeToolCall(
    toolName: string,
    parameters: Record<string, unknown>,
    context: ToolExecutionContext
  ): Promise<unknown> {
    // Get token from context (this would need to be passed in)
    const token = context.userId; // This is a placeholder - you'd need to get the actual token
    
    if (!token) {
      throw new Error('Authentication token is required');
    }

    switch (toolName) {
      case 'get_logs':
        return await mcpService.getLogs(
          token,
          parameters.level as string,
          parameters.limit as number
        );

      case 'get_metrics':
        return await mcpService.getMetrics(
          token,
          parameters.limit as number
        );

      case 'deploy_service':
        return await mcpService.deployService(
          token,
          parameters.service_name as string,
          parameters.version as string,
          parameters.environment as string
        );

      case 'rollback_staging':
        return await mcpService.rollbackDeployment(
          token,
          parameters.deployment_id as string,
          parameters.reason as string,
          'staging'
        );

      case 'rollback_production':
        return await mcpService.rollbackDeployment(
          token,
          parameters.deployment_id as string,
          parameters.reason as string,
          'production'
        );

      case 'authenticate_user':
        return await mcpService.authenticateUser(
          token
        );

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  // Execute multiple tools in parallel
  async executeTools(requests: ToolExecutionRequest[]): Promise<ToolExecutionResult[]> {
    const promises = requests.map(request => this.executeTool(request));
    return Promise.all(promises);
  }

  // Execute tools sequentially
  async executeToolsSequentially(requests: ToolExecutionRequest[]): Promise<ToolExecutionResult[]> {
    const results: ToolExecutionResult[] = [];
    
    for (const request of requests) {
      const result = await this.executeTool(request);
      results.push(result);
      
      // Stop execution if a critical tool fails
      if (!result.success && result.error && !result.error.retryable) {
        break;
      }
    }
    
    return results;
  }

  // Check if user has permission for tool
  checkToolPermission(toolName: string, userPermissions: Record<string, boolean>): boolean {
    const toolMetadata = toolDiscoveryService.getToolMetadata(toolName);
    if (!toolMetadata) return false;

    return userPermissions[toolMetadata.requiredPermission] === true;
  }

  // Get tools available to user
  getAvailableToolsForUser(userPermissions: Record<string, boolean>): ToolMetadata[] {
    const allTools = Array.from(toolDiscoveryService['tools'].values());
    return allTools.filter(tool => 
      userPermissions[tool.requiredPermission] === true
    );
  }

  // Generate follow-up questions for missing parameters
  generateFollowUpQuestions(toolName: string, providedParameters: Record<string, unknown>): string[] {
    return toolDiscoveryService.generateFollowUpQuestions(toolName, providedParameters);
  }

  // Add result to execution history
  private addToHistory(result: ToolExecutionResult): void {
    this.executionHistory.push(result);
    
    // Keep only recent history
    if (this.executionHistory.length > this.MAX_HISTORY_SIZE) {
      this.executionHistory = this.executionHistory.slice(-this.MAX_HISTORY_SIZE);
    }
  }

  // Get execution history
  getExecutionHistory(limit = 100): ToolExecutionResult[] {
    return this.executionHistory.slice(-limit);
  }

  // Get execution statistics
  getExecutionStatistics(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    toolUsage: Record<string, number>;
    errorCount: Record<string, number>;
  } {
    const stats = {
      totalExecutions: this.executionHistory.length,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      toolUsage: {} as Record<string, number>,
      errorCount: {} as Record<string, number>
    };

    let totalExecutionTime = 0;

    this.executionHistory.forEach(result => {
      if (result.success) {
        stats.successfulExecutions++;
      } else {
        stats.failedExecutions++;
        if (result.error) {
          stats.errorCount[result.error.code] = (stats.errorCount[result.error.code] || 0) + 1;
        }
      }

      totalExecutionTime += result.executionTime;
      stats.toolUsage[result.toolName] = (stats.toolUsage[result.toolName] || 0) + 1;
    });

    stats.averageExecutionTime = stats.totalExecutions > 0 ? totalExecutionTime / stats.totalExecutions : 0;

    return stats;
  }

  // Clear execution history
  clearHistory(): void {
    this.executionHistory = [];
  }

  // Get currently executing tools
  getCurrentlyExecuting(): string[] {
    return Array.from(this.executionQueue.keys());
  }

  // Cancel execution (if possible)
  cancelExecution(executionKey: string): boolean {
    return this.executionQueue.delete(executionKey);
  }

  // Get tool execution suggestions
  getToolSuggestions(userInput: string, availableTools: ToolMetadata[]): ToolMetadata[] {
    const input = userInput.toLowerCase();
    
    return availableTools.filter(tool => {
      const nameMatch = tool.name.toLowerCase().includes(input);
      const descriptionMatch = tool.description.toLowerCase().includes(input);
      const categoryMatch = tool.category.toLowerCase().includes(input);
      
      return nameMatch || descriptionMatch || categoryMatch;
    }).slice(0, 5); // Return top 5 matches
  }
}

// Export singleton instance
export const toolExecutionService = new ToolExecutionService();
