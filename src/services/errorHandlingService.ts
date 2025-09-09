// Error types and codes
export enum ErrorType {
  NETWORK = 'NETWORK',
  AUTHENTICATION = 'AUTHENTICATION',
  PERMISSION = 'PERMISSION',
  VALIDATION = 'VALIDATION',
  TOOL_EXECUTION = 'TOOL_EXECUTION',
  AI_RESPONSE = 'AI_RESPONSE',
  CONVERSATION = 'CONVERSATION',
  UNKNOWN = 'UNKNOWN'
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface ErrorContext {
  toolName?: string;
  parameters?: Record<string, unknown>;
  userId?: string;
  timestamp: number;
  requestId?: string;
  conversationId?: string;
}

export interface ChatError {
  code: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  context: ErrorContext;
  retryable: boolean;
  retryAfter?: number; // seconds
  suggestions?: string[];
  originalError?: unknown;
}

// Error codes mapping
const ERROR_CODES = {
  // Network errors
  'NETWORK_TIMEOUT': {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.MEDIUM,
    message: 'Request timed out',
    userMessage: 'The request took too long to complete. Please try again.',
    retryable: true,
    retryAfter: 5
  },
  'NETWORK_OFFLINE': {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    message: 'Network connection lost',
    userMessage: 'Unable to connect to the server. Please check your internet connection.',
    retryable: true,
    retryAfter: 10
  },
  'NETWORK_SERVER_ERROR': {
    type: ErrorType.NETWORK,
    severity: ErrorSeverity.HIGH,
    message: 'Server error occurred',
    userMessage: 'The server encountered an error. Please try again later.',
    retryable: true,
    retryAfter: 30
  },

  // Authentication errors
  'AUTH_TOKEN_EXPIRED': {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    message: 'Authentication token expired',
    userMessage: 'Your session has expired. Please log in again.',
    retryable: false,
    suggestions: ['Please refresh the page and log in again']
  },
  'AUTH_TOKEN_INVALID': {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.HIGH,
    message: 'Invalid authentication token',
    userMessage: 'Your session is invalid. Please log in again.',
    retryable: false,
    suggestions: ['Please refresh the page and log in again']
  },
  'AUTH_PERMISSION_DENIED': {
    type: ErrorType.AUTHENTICATION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Permission denied',
    userMessage: 'You do not have permission to perform this action.',
    retryable: false,
    suggestions: ['Contact your administrator to request access']
  },

  // Permission errors
  'PERMISSION_READ_LOGS': {
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
    message: 'No permission to read logs',
    userMessage: 'You do not have permission to read logs. Error Code: PERM-001',
    retryable: false,
    suggestions: ['Contact your administrator to request log access']
  },
  'PERMISSION_READ_METRICS': {
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
    message: 'No permission to read metrics',
    userMessage: 'You do not have permission to read metrics. Error Code: PERM-002',
    retryable: false,
    suggestions: ['Contact your administrator to request metrics access']
  },
  'PERMISSION_DEPLOY_STAGING': {
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
    message: 'No permission to deploy to staging',
    userMessage: 'You do not have permission to deploy to staging. Error Code: PERM-003',
    retryable: false,
    suggestions: ['Contact your administrator to request staging deployment access']
  },
  'PERMISSION_DEPLOY_PRODUCTION': {
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.HIGH,
    message: 'No permission to deploy to production',
    userMessage: 'You do not have permission to deploy to production. Error Code: PERM-004',
    retryable: false,
    suggestions: ['Contact your administrator to request production deployment access']
  },
  'PERMISSION_ROLLBACK_STAGING': {
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.MEDIUM,
    message: 'No permission to rollback staging',
    userMessage: 'You do not have permission to rollback staging deployments. Error Code: PERM-005',
    retryable: false,
    suggestions: ['Contact your administrator to request staging rollback access']
  },
  'PERMISSION_ROLLBACK_PRODUCTION': {
    type: ErrorType.PERMISSION,
    severity: ErrorSeverity.HIGH,
    message: 'No permission to rollback production',
    userMessage: 'You do not have permission to rollback production deployments. Error Code: PERM-006',
    retryable: false,
    suggestions: ['Contact your administrator to request production rollback access']
  },

  // Validation errors
  'VALIDATION_MISSING_PARAMETER': {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Missing required parameter',
    userMessage: 'Some required information is missing. Please provide the missing details.',
    retryable: false,
    suggestions: ['Please provide all required parameters']
  },
  'VALIDATION_INVALID_PARAMETER': {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Invalid parameter value',
    userMessage: 'One or more parameters have invalid values. Please check and correct them.',
    retryable: false,
    suggestions: ['Please check the parameter values and try again']
  },
  'VALIDATION_INVALID_FORMAT': {
    type: ErrorType.VALIDATION,
    severity: ErrorSeverity.LOW,
    message: 'Invalid parameter format',
    userMessage: 'One or more parameters have invalid format. Please check the format requirements.',
    retryable: false,
    suggestions: ['Please check the parameter format and try again']
  },

  // Tool execution errors
  'TOOL_EXECUTION_FAILED': {
    type: ErrorType.TOOL_EXECUTION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Tool execution failed',
    userMessage: 'The requested operation failed. Please try again.',
    retryable: true,
    retryAfter: 5
  },
  'TOOL_TIMEOUT': {
    type: ErrorType.TOOL_EXECUTION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Tool execution timed out',
    userMessage: 'The operation took too long to complete. Please try again.',
    retryable: true,
    retryAfter: 10
  },
  'TOOL_NOT_FOUND': {
    type: ErrorType.TOOL_EXECUTION,
    severity: ErrorSeverity.MEDIUM,
    message: 'Tool not found',
    userMessage: 'The requested tool is not available.',
    retryable: false,
    suggestions: ['Please check if the tool is available in your environment']
  },

  // AI response errors
  'AI_RESPONSE_INVALID': {
    type: ErrorType.AI_RESPONSE,
    severity: ErrorSeverity.MEDIUM,
    message: 'Invalid AI response',
    userMessage: 'I received an invalid response. Please try rephrasing your question.',
    retryable: true,
    retryAfter: 3
  },
  'AI_RESPONSE_EMPTY': {
    type: ErrorType.AI_RESPONSE,
    severity: ErrorSeverity.MEDIUM,
    message: 'Empty AI response',
    userMessage: 'I could not generate a response. Please try rephrasing your question.',
    retryable: true,
    retryAfter: 3
  },
  'AI_RESPONSE_TOO_LONG': {
    type: ErrorType.AI_RESPONSE,
    severity: ErrorSeverity.LOW,
    message: 'AI response too long',
    userMessage: 'The response was too long to display. Please try a more specific question.',
    retryable: false,
    suggestions: ['Try asking a more specific question']
  },

  // Conversation errors
  'CONVERSATION_CONTEXT_LOST': {
    type: ErrorType.CONVERSATION,
    severity: ErrorSeverity.LOW,
    message: 'Conversation context lost',
    userMessage: 'I lost track of our conversation. Please provide more context.',
    retryable: false,
    suggestions: ['Please provide more context about what you need help with']
  },
  'CONVERSATION_TOO_LONG': {
    type: ErrorType.CONVERSATION,
    severity: ErrorSeverity.LOW,
    message: 'Conversation too long',
    userMessage: 'Our conversation is getting quite long. I may need to summarize previous messages.',
    retryable: false,
    suggestions: ['Consider starting a new conversation for a fresh start']
  }
};

export class ErrorHandlingService {
  private errorLog: ChatError[] = [];
  private maxLogSize = 100;

  // Create a new error
  createError(
    code: string,
    context: ErrorContext,
    originalError?: unknown,
    customMessage?: string
  ): ChatError {
    const errorDef = ERROR_CODES[code as keyof typeof ERROR_CODES];
    
    if (!errorDef) {
      // Unknown error
      return {
        code: 'UNKNOWN_ERROR',
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: 'Unknown error occurred',
        userMessage: customMessage || 'An unexpected error occurred. Please try again.',
        context,
        retryable: true,
        retryAfter: 5,
        originalError
      };
    }

    const error: ChatError = {
      code,
      type: errorDef.type,
      severity: errorDef.severity,
      message: errorDef.message,
      userMessage: customMessage || errorDef.userMessage,
      context,
      retryable: errorDef.retryable,
      retryAfter: 'retryAfter' in errorDef ? errorDef.retryAfter : undefined,
      suggestions: 'suggestions' in errorDef ? errorDef.suggestions : undefined,
      originalError
    };

    this.logError(error);
    return error;
  }

  // Log error
  private logError(error: ChatError): void {
    this.errorLog.push(error);
    
    // Keep only the most recent errors
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(-this.maxLogSize);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Chat Error:', {
        code: error.code,
        type: error.type,
        severity: error.severity,
        message: error.message,
        context: error.context,
        originalError: error.originalError
      });
    }
  }

  // Get error by code
  getErrorByCode(code: string): ChatError | undefined {
    return this.errorLog.find(error => error.code === code);
  }

  // Get errors by type
  getErrorsByType(type: ErrorType): ChatError[] {
    return this.errorLog.filter(error => error.type === type);
  }

  // Get errors by severity
  getErrorsBySeverity(severity: ErrorSeverity): ChatError[] {
    return this.errorLog.filter(error => error.severity === severity);
  }

  // Get recent errors
  getRecentErrors(limit = 10): ChatError[] {
    return this.errorLog.slice(-limit);
  }

  // Clear error log
  clearErrorLog(): void {
    this.errorLog = [];
  }

  // Get error statistics
  getErrorStatistics(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    retryable: number;
  } {
    const stats = {
      total: this.errorLog.length,
      byType: {} as Record<ErrorType, number>,
      bySeverity: {} as Record<ErrorSeverity, number>,
      retryable: 0
    };

    // Initialize counters
    Object.values(ErrorType).forEach(type => {
      stats.byType[type] = 0;
    });
    Object.values(ErrorSeverity).forEach(severity => {
      stats.bySeverity[severity] = 0;
    });

    // Count errors
    this.errorLog.forEach(error => {
      stats.byType[error.type]++;
      stats.bySeverity[error.severity]++;
      if (error.retryable) {
        stats.retryable++;
      }
    });

    return stats;
  }

  // Format error for display
  formatErrorForDisplay(error: ChatError): {
    title: string;
    message: string;
    suggestions: string[];
    retryable: boolean;
    retryAfter?: number;
  } {
    return {
      title: `${error.code} - ${error.severity}`,
      message: error.userMessage,
      suggestions: error.suggestions || [],
      retryable: error.retryable,
      retryAfter: error.retryAfter
    };
  }

  // Check if error should be retried
  shouldRetry(error: ChatError): boolean {
    return error.retryable && error.severity !== ErrorSeverity.CRITICAL;
  }

  // Get retry delay
  getRetryDelay(error: ChatError): number {
    if (!error.retryable) return 0;
    return (error.retryAfter || 5) * 1000; // Convert to milliseconds
  }
}

// Export singleton instance
export const errorHandlingService = new ErrorHandlingService();

// Helper functions
export const createNetworkError = (context: ErrorContext, originalError?: unknown) => {
  return errorHandlingService.createError('NETWORK_SERVER_ERROR', context, originalError);
};

export const createAuthError = (code: string, context: ErrorContext, originalError?: unknown) => {
  return errorHandlingService.createError(code, context, originalError);
};

export const createPermissionError = (permission: string, context: ErrorContext) => {
  const code = `PERMISSION_${permission.toUpperCase()}`;
  return errorHandlingService.createError(code, context);
};

export const createValidationError = (code: string, context: ErrorContext, customMessage?: string) => {
  return errorHandlingService.createError(code, context, undefined, customMessage);
};

export const createToolError = (code: string, context: ErrorContext, originalError?: unknown) => {
  return errorHandlingService.createError(code, context, originalError);
};

export const createAIError = (code: string, context: ErrorContext, originalError?: unknown) => {
  return errorHandlingService.createError(code, context, originalError);
};
