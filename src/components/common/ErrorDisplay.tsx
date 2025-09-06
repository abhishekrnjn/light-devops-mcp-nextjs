'use client';

import { parseError, isAuthError } from '@/utils/errorHandler';

interface ErrorDisplayProps {
  error: string | null;
  onRetry?: () => void;
  onLogout?: () => void;
  className?: string;
}

export const ErrorDisplay = ({ error, onRetry, onLogout, className = '' }: ErrorDisplayProps) => {
  if (!error) return null;

  const isAuth = isAuthError(error);
  const formattedError = parseError(error);

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <div className="text-red-400 text-xl">
            {isAuth ? '🔐' : '⚠️'}
          </div>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {isAuth ? 'Authentication Error' : 'Error'}
          </h3>
          <div className="mt-2 text-sm text-red-700">
            <p>{formattedError}</p>
          </div>
          <div className="mt-4 flex space-x-3">
            {onRetry && !isAuth && (
              <button
                onClick={onRetry}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Try Again
              </button>
            )}
            {isAuth && onLogout && (
              <button
                onClick={onLogout}
                className="text-sm font-medium text-red-800 hover:text-red-900 underline"
              >
                Log In Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
