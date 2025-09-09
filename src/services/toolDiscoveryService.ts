import { MCPTool, MCPResource } from '@/types/mcp';
import { mcpService } from './mcpService';

// Enhanced tool interface for OpenAI function calling
export interface OpenAIToolFunction {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
        minimum?: number;
        maximum?: number;
      }>;
      required: string[];
    };
  };
}

// Tool metadata for enhanced functionality
export interface ToolMetadata {
  name: string;
  description: string;
  category: 'logs' | 'metrics' | 'deployment' | 'rollback' | 'authentication' | 'other';
  requiredPermission: string;
  parameters: ToolParameter[];
  examples: ToolExample[];
  errorCodes: Record<string, string>;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array';
  description: string;
  required: boolean;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  pattern?: string;
  example?: string;
}

export interface ToolExample {
  description: string;
  input: Record<string, unknown>;
  expectedOutput: string;
}

// Tool discovery service class
export class ToolDiscoveryService {
  private tools: Map<string, ToolMetadata> = new Map();
  private resources: Map<string, MCPResource> = new Map();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Tool definitions with enhanced metadata
  private readonly toolDefinitions: Record<string, ToolMetadata> = {
    get_logs: {
      name: 'get_logs',
      description: 'Fetch system logs with optional filtering by level and limit',
      category: 'logs',
      requiredPermission: 'read_logs',
      parameters: [
        {
          name: 'level',
          type: 'string',
          description: 'Log level filter (error, warning, info, debug)',
          required: false,
          enum: ['error', 'warning', 'info', 'debug'],
          example: 'error'
        },
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of log entries to return',
          required: false,
          minimum: 1,
          maximum: 1000,
          example: '50'
        }
      ],
      examples: [
        {
          description: 'Get recent error logs',
          input: { level: 'error', limit: 10 },
          expectedOutput: 'Returns the 10 most recent error log entries'
        },
        {
          description: 'Get all recent logs',
          input: { limit: 100 },
          expectedOutput: 'Returns the 100 most recent log entries from all levels'
        }
      ],
      errorCodes: {
        'PERMISSION_DENIED': 'You do not have permission to read logs',
        'INVALID_LEVEL': 'Invalid log level specified',
        'INVALID_LIMIT': 'Limit must be between 1 and 1000',
        'SERVER_ERROR': 'Failed to fetch logs from server'
      }
    },
    get_metrics: {
      name: 'get_metrics',
      description: 'Fetch system metrics with optional limit',
      category: 'metrics',
      requiredPermission: 'read_metrics',
      parameters: [
        {
          name: 'limit',
          type: 'number',
          description: 'Maximum number of metric entries to return',
          required: false,
          minimum: 1,
          maximum: 1000,
          example: '50'
        }
      ],
      examples: [
        {
          description: 'Get recent metrics',
          input: { limit: 20 },
          expectedOutput: 'Returns the 20 most recent metric entries'
        },
        {
          description: 'Get all available metrics',
          input: {},
          expectedOutput: 'Returns all available metric entries'
        }
      ],
      errorCodes: {
        'PERMISSION_DENIED': 'You do not have permission to read metrics',
        'INVALID_LIMIT': 'Limit must be between 1 and 1000',
        'SERVER_ERROR': 'Failed to fetch metrics from server'
      }
    },
    deploy_service: {
      name: 'deploy_service',
      description: 'Deploy a service to staging or production environment',
      category: 'deployment',
      requiredPermission: 'deploy_staging', // Will be checked based on environment
      parameters: [
        {
          name: 'service_name',
          type: 'string',
          description: 'Name of the service to deploy',
          required: true,
          pattern: '^[a-zA-Z0-9-_]+$',
          example: 'user-service'
        },
        {
          name: 'version',
          type: 'string',
          description: 'Version of the service to deploy',
          required: true,
          pattern: '^[0-9]+\\.[0-9]+\\.[0-9]+$',
          example: '1.2.3'
        },
        {
          name: 'environment',
          type: 'string',
          description: 'Target environment for deployment',
          required: true,
          enum: ['staging', 'production'],
          example: 'staging'
        }
      ],
      examples: [
        {
          description: 'Deploy to staging',
          input: { service_name: 'user-service', version: '1.2.3', environment: 'staging' },
          expectedOutput: 'Deploys user-service version 1.2.3 to staging environment'
        },
        {
          description: 'Deploy to production',
          input: { service_name: 'api-gateway', version: '2.1.0', environment: 'production' },
          expectedOutput: 'Deploys api-gateway version 2.1.0 to production environment'
        }
      ],
      errorCodes: {
        'PERMISSION_DENIED': 'You do not have permission to deploy to this environment',
        'INVALID_SERVICE': 'Invalid service name format',
        'INVALID_VERSION': 'Invalid version format (use semantic versioning)',
        'INVALID_ENVIRONMENT': 'Environment must be staging or production',
        'DEPLOYMENT_FAILED': 'Deployment failed due to server error',
        'SERVICE_NOT_FOUND': 'Service not found or not available for deployment'
      }
    },
    rollback_staging: {
      name: 'rollback_staging',
      description: 'Rollback a deployment in staging environment',
      category: 'rollback',
      requiredPermission: 'rollback_staging',
      parameters: [
        {
          name: 'deployment_id',
          type: 'string',
          description: 'ID of the deployment to rollback',
          required: true,
          pattern: '^[a-zA-Z0-9-_]+$',
          example: 'deploy-123'
        },
        {
          name: 'reason',
          type: 'string',
          description: 'Reason for the rollback',
          required: true,
          example: 'Critical bug found in production'
        }
      ],
      examples: [
        {
          description: 'Rollback staging deployment',
          input: { deployment_id: 'deploy-123', reason: 'Critical bug found' },
          expectedOutput: 'Rolls back deployment deploy-123 in staging environment'
        }
      ],
      errorCodes: {
        'PERMISSION_DENIED': 'You do not have permission to rollback staging deployments',
        'INVALID_DEPLOYMENT': 'Invalid deployment ID format',
        'DEPLOYMENT_NOT_FOUND': 'Deployment not found or already rolled back',
        'ROLLBACK_FAILED': 'Rollback failed due to server error'
      }
    },
    rollback_production: {
      name: 'rollback_production',
      description: 'Rollback a deployment in production environment',
      category: 'rollback',
      requiredPermission: 'rollback_production',
      parameters: [
        {
          name: 'deployment_id',
          type: 'string',
          description: 'ID of the deployment to rollback',
          required: true,
          pattern: '^[a-zA-Z0-9-_]+$',
          example: 'deploy-456'
        },
        {
          name: 'reason',
          type: 'string',
          description: 'Reason for the rollback',
          required: true,
          example: 'Critical performance issue'
        }
      ],
      examples: [
        {
          description: 'Rollback production deployment',
          input: { deployment_id: 'deploy-456', reason: 'Critical performance issue' },
          expectedOutput: 'Rolls back deployment deploy-456 in production environment'
        }
      ],
      errorCodes: {
        'PERMISSION_DENIED': 'You do not have permission to rollback production deployments',
        'INVALID_DEPLOYMENT': 'Invalid deployment ID format',
        'DEPLOYMENT_NOT_FOUND': 'Deployment not found or already rolled back',
        'ROLLBACK_FAILED': 'Rollback failed due to server error'
      }
    },
    authenticate_user: {
      name: 'authenticate_user',
      description: 'Authenticate user with session token',
      category: 'authentication',
      requiredPermission: 'authenticate_user',
      parameters: [
        {
          name: 'session_token',
          type: 'string',
          description: 'User session token for authentication',
          required: true,
          example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
        }
      ],
      examples: [
        {
          description: 'Authenticate user',
          input: { session_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
          expectedOutput: 'Authenticates user and returns authentication status'
        }
      ],
      errorCodes: {
        'PERMISSION_DENIED': 'You do not have permission to authenticate users',
        'INVALID_TOKEN': 'Invalid or expired session token',
        'AUTHENTICATION_FAILED': 'Authentication failed due to server error'
      }
    }
  };

  // Fetch tools from MCP server
  async fetchToolsFromServer(token: string): Promise<{ success: boolean; tools: MCPTool[]; resources: MCPResource[]; error?: string }> {
    try {
      const [toolsResponse, resourcesResponse] = await Promise.all([
        mcpService.getTools(token),
        mcpService.getResources(token)
      ]);

      return {
        success: toolsResponse.success && resourcesResponse.success,
        tools: toolsResponse.data || [],
        resources: resourcesResponse.data || [],
        error: toolsResponse.error || resourcesResponse.error
      };
    } catch (error) {
      return {
        success: false,
        tools: [],
        resources: [],
        error: error instanceof Error ? error.message : 'Failed to fetch tools from server'
      };
    }
  }

  // Get all available tools with metadata
  async getAvailableTools(token: string, forceRefresh = false): Promise<{ success: boolean; tools: ToolMetadata[]; error?: string }> {
    const now = Date.now();
    
    // Check if we need to refresh the cache
    if (!forceRefresh && this.tools.size > 0 && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      return {
        success: true,
        tools: Array.from(this.tools.values())
      };
    }

    // Fetch from server
    const serverResult = await this.fetchToolsFromServer(token);
    
    if (!serverResult.success) {
      return {
        success: false,
        tools: [],
        error: serverResult.error
      };
    }

    // Update cache with server data
    this.resources.clear();
    serverResult.resources.forEach(resource => {
      this.resources.set(resource.name, resource);
    });

    // Update tools with server data (merge with our enhanced definitions)
    this.tools.clear();
    serverResult.tools.forEach(serverTool => {
      const enhancedTool = this.toolDefinitions[serverTool.name];
      if (enhancedTool) {
        this.tools.set(serverTool.name, enhancedTool);
      } else {
        // Create basic tool metadata for unknown tools
        this.tools.set(serverTool.name, {
          name: serverTool.name,
          description: serverTool.description,
          category: 'other',
          requiredPermission: 'unknown',
          parameters: serverTool.requiredParameters.map(param => ({
            name: param,
            type: 'string',
            description: `Parameter: ${param}`,
            required: true
          })),
          examples: [],
          errorCodes: {}
        });
      }
    });

    this.lastFetchTime = now;

    return {
      success: true,
      tools: Array.from(this.tools.values())
    };
  }

  // Get tools filtered by user permissions
  getToolsForUser(tools: ToolMetadata[], userPermissions: Record<string, boolean>): ToolMetadata[] {
    return tools.filter(tool => {
      // Check if user has the required permission
      return userPermissions[tool.requiredPermission] === true;
    });
  }

  // Convert tool metadata to OpenAI function calling format
  convertToOpenAIFunctions(tools: ToolMetadata[]): OpenAIToolFunction[] {
    return tools.map(tool => {
      const properties: Record<string, {
        type: string;
        description: string;
        enum?: string[];
        minimum?: number;
        maximum?: number;
        pattern?: string;
      }> = {};
      
      tool.parameters.forEach(param => {
        properties[param.name] = {
          type: param.type,
          description: param.description
        };

        if (param.enum) {
          properties[param.name].enum = param.enum;
        }
        if (param.minimum !== undefined) {
          properties[param.name].minimum = param.minimum;
        }
        if (param.maximum !== undefined) {
          properties[param.name].maximum = param.maximum;
        }
        if (param.pattern) {
          properties[param.name].pattern = param.pattern;
        }
      });

      return {
        type: 'function',
        function: {
          name: tool.name,
          description: tool.description,
          parameters: {
            type: 'object',
            properties,
            required: tool.parameters.filter(p => p.required).map(p => p.name)
          }
        }
      };
    });
  }

  // Get tool metadata by name
  getToolMetadata(toolName: string): ToolMetadata | undefined {
    return this.tools.get(toolName);
  }

  // Validate tool parameters
  validateToolParameters(toolName: string, parameters: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const tool = this.getToolMetadata(toolName);
    if (!tool) {
      return { valid: false, errors: [`Unknown tool: ${toolName}`] };
    }

    const errors: string[] = [];

    // Check required parameters
    tool.parameters.forEach(param => {
      if (param.required && !(param.name in parameters)) {
        errors.push(`Missing required parameter: ${param.name}`);
      }
    });

    // Validate parameter values
    Object.entries(parameters).forEach(([key, value]) => {
      const param = tool.parameters.find(p => p.name === key);
      if (!param) {
        errors.push(`Unknown parameter: ${key}`);
        return;
      }

      // Type validation
      if (param.type === 'string' && typeof value !== 'string') {
        errors.push(`Parameter ${key} must be a string`);
      } else if (param.type === 'number' && typeof value !== 'number') {
        errors.push(`Parameter ${key} must be a number`);
      } else if (param.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Parameter ${key} must be a boolean`);
      } else if (param.type === 'array' && !Array.isArray(value)) {
        errors.push(`Parameter ${key} must be an array`);
      }

      // Enum validation
      if (param.enum && !param.enum.includes(String(value))) {
        errors.push(`Parameter ${key} must be one of: ${param.enum.join(', ')}`);
      }

      // Range validation
      if (param.type === 'number' && typeof value === 'number') {
        if (param.minimum !== undefined && value < param.minimum) {
          errors.push(`Parameter ${key} must be at least ${param.minimum}`);
        }
        if (param.maximum !== undefined && value > param.maximum) {
          errors.push(`Parameter ${key} must be at most ${param.maximum}`);
        }
      }

      // Pattern validation
      if (param.pattern && typeof value === 'string') {
        const regex = new RegExp(param.pattern);
        if (!regex.test(value)) {
          errors.push(`Parameter ${key} format is invalid`);
        }
      }
    });

    return { valid: errors.length === 0, errors };
  }

  // Generate follow-up questions for missing parameters
  generateFollowUpQuestions(toolName: string, providedParameters: Record<string, unknown>): string[] {
    const tool = this.getToolMetadata(toolName);
    if (!tool) return [];

    const questions: string[] = [];
    const missingRequired = tool.parameters.filter(param => 
      param.required && !(param.name in providedParameters)
    );

    missingRequired.forEach(param => {
      let question = `What ${param.name} would you like to use?`;
      
      if (param.enum) {
        question += ` (Options: ${param.enum.join(', ')})`;
      }
      
      if (param.example) {
        question += ` (Example: ${param.example})`;
      }

      questions.push(question);
    });

    return questions;
  }

  // Get error message for a specific error code
  getErrorMessage(toolName: string, errorCode: string): string {
    const tool = this.getToolMetadata(toolName);
    if (!tool) return 'Unknown tool error';

    return tool.errorCodes[errorCode] || 'An unexpected error occurred';
  }

  // Clear cache
  clearCache(): void {
    this.tools.clear();
    this.resources.clear();
    this.lastFetchTime = 0;
  }
}

// Export singleton instance
export const toolDiscoveryService = new ToolDiscoveryService();
