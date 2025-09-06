export interface ErrorResponse {
  detail?: string;
  error?: string;
  message?: string;
  status_code?: number;
  error_type?: string;
  error_message?: string;
}

export const parseError = (error: unknown): string => {
  // Handle string errors
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error) as ErrorResponse;
      return formatError(parsed);
    } catch {
      return error;
    }
  }

  // Handle Error objects
  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as ErrorResponse;
      return formatError(parsed);
    } catch {
      return error.message;
    }
  }

  // Handle response objects
  if (error && typeof error === 'object' && 'detail' in error) {
    return formatError(error as ErrorResponse);
  }

  return 'An unexpected error occurred';
};

const formatError = (error: ErrorResponse): string => {
  // Handle Descope authentication errors
  if (error.error_type === 'invalid token' || error.status_code === 401) {
    if (error.error_message?.includes('expired token')) {
      return 'Your session has expired. Please log in again to continue.';
    }
    if (error.error_message?.includes('invalid token')) {
      return 'Invalid authentication token. Please log in again.';
    }
    return 'Authentication failed. Please log in again.';
  }

  // Handle permission errors
  if (error.status_code === 403) {
    return 'You do not have permission to perform this action.';
  }

  // Handle server errors
  if (error.status_code === 500) {
    return 'Server error occurred. Please try again later.';
  }

  // Handle network errors
  if (error.status_code === 0 || !error.status_code) {
    return 'Unable to connect to the server. Please check your connection.';
  }

  // Handle specific network error messages
  if (error.error?.includes('fetch') || error.error?.includes('network')) {
    return 'Unable to connect to the MCP server. Please check if the server is running.';
  }

  // Handle specific error messages
  if (error.error_message) {
    return error.error_message;
  }

  if (error.detail) {
    return error.detail;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error) {
    return error.error;
  }

  return 'An unexpected error occurred';
};

export const isAuthError = (error: unknown): boolean => {
  if (typeof error === 'string') {
    try {
      const parsed = JSON.parse(error) as ErrorResponse;
      return parsed.error_type === 'invalid token' || parsed.status_code === 401;
    } catch {
      return false;
    }
  }

  if (error instanceof Error) {
    try {
      const parsed = JSON.parse(error.message) as ErrorResponse;
      return parsed.error_type === 'invalid token' || parsed.status_code === 401;
    } catch {
      return false;
    }
  }

  if (error && typeof error === 'object' && 'error_type' in error) {
    return (error as ErrorResponse).error_type === 'invalid token' || (error as ErrorResponse).status_code === 401;
  }

  return false;
};
