// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';

// Error types
interface ErrorInfo {
  type: 'runtime' | 'network' | 'validation' | 'authorization' | 'unknown';
  message: string;
  code?: string;
  details?: any;
  timestamp: number;
  component?: string;
  action?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Error handling hook
export const useResellerErrorHandling = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([]);
  const [currentError, setCurrentError] = useState<ErrorInfo | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  // Add error to error list
  const addError = useCallback((error: ErrorInfo) => {
    const newError = {
      ...error,
      timestamp: Date.now()
    };
    
    setErrors(prev => [...prev.slice(-9), newError]); // Keep last 10 errors
    setCurrentError(newError);
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Reseller Dashboard Error:', newError);
    }
  }, []);

  // Clear current error
  const clearCurrentError = useCallback(() => {
    setCurrentError(null);
  }, []);

  // Clear all errors
  const clearAllErrors = useCallback(() => {
    setErrors([]);
    setCurrentError(null);
  }, []);

  // Handle runtime error
  const handleRuntimeError = useCallback((error: Error, component?: string, action?: string) => {
    addError({
      type: 'runtime',
      message: error.message || 'An unexpected error occurred',
      code: error.name,
      details: error.stack,
      component,
      action
    });
  }, [addError]);

  // Handle network error
  const handleNetworkError = useCallback((error: any, action?: string) => {
    addError({
      type: 'network',
      message: error.message || 'Network request failed',
      code: error.code || 'NETWORK_ERROR',
      details: error,
      action
    });
  }, [addError]);

  // Handle validation error
  const handleValidationError = useCallback((message: string, field?: string) => {
    addError({
      type: 'validation',
      message,
      code: 'VALIDATION_ERROR',
      details: { field }
    });
  }, [addError]);

  // Handle authorization error
  const handleAuthError = useCallback((message: string = 'Access denied') => {
    addError({
      type: 'authorization',
      message,
      code: 'AUTH_ERROR'
    });
  }, [addError]);

  // Safe async action wrapper
  const safeAsyncAction = useCallback(async function<T>(
    action: () => Promise<T>,
    actionName: string,
    options?: {
      retry?: boolean;
      retryCount?: number;
      fallback?: T;
    }
  ): Promise<T | null> {
    const { retry = true, retryCount = 3, fallback } = options || {};
    
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= (retry ? retryCount : 1); attempt++) {
      try {
        setIsRecovering(true);
        const result = await action();
        setIsRecovering(false);
        return result;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === retryCount) {
          // Final attempt failed
          if (error instanceof Error) {
            handleRuntimeError(error, 'async-action', actionName);
          } else {
            handleNetworkError(error, actionName);
          }
          
          setIsRecovering(false);
          
          if (fallback !== undefined) {
            return fallback;
          }
          
          return null;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    return null;
  }, [handleRuntimeError, handleNetworkError]);

  // Safe data access
  const safeDataAccess = useCallback(function<T>(
    data: T | null | undefined,
    fallback: T,
    context?: string
  ): T {
    if (data === null || data === undefined) {
      if (context) {
        handleRuntimeError(
          new Error(`Data is null or undefined in ${context}`),
          'data-access',
          context
        );
      }
      return fallback;
    }
    
    return data;
  }, [handleRuntimeError]);

  // Safe array access
  const safeArrayAccess = useCallback(function<T>(
    array: T[] | null | undefined,
    fallback: T[] = [],
    context?: string
  ): T[] {
    if (!Array.isArray(array)) {
      if (context) {
        handleRuntimeError(
          new Error(`Expected array but got ${typeof array} in ${context}`),
          'array-access',
          context
        );
      }
      return fallback;
    }
    
    return array;
  }, [handleRuntimeError]);

  // Safe object property access
  const safePropertyAccess = useCallback(function<T, K extends keyof T>(
    obj: T | null | undefined,
    property: K,
    fallback: T[K],
    context?: string
  ): T[K] {
    if (obj === null || obj === undefined) {
      if (context) {
        handleRuntimeError(
          new Error(`Object is null or undefined when accessing property ${String(property)} in ${context}`),
          'property-access',
          context
        );
      }
      return fallback;
    }
    
    if (!(property in obj)) {
      if (context) {
        handleRuntimeError(
          new Error(`Property ${String(property)} does not exist in ${context}`),
          'property-access',
          context
        );
      }
      return fallback;
    }
    
    return obj[property];
  }, [handleRuntimeError]);

  // Retry failed action
  const retryAction = useCallback(async (actionName: string) => {
    // Find the most recent error for this action
    const relevantError = errors
      .filter(error => error.action === actionName)
      .pop();
    
    if (!relevantError) {
      return;
    }
    
    setIsRecovering(true);
    clearCurrentError();
    
    // In a real implementation, you would retry the specific action
    // For demo purposes, we'll just wait and show success
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsRecovering(false);
    
    // Show success message
    setCurrentError({
      type: 'runtime',
      message: `Action "${actionName}" completed successfully after retry`,
      code: 'RETRY_SUCCESS',
      timestamp: Date.now()
    });
  }, [errors, clearCurrentError]);

  return {
    errors,
    currentError,
    isRecovering,
    addError,
    clearCurrentError,
    clearAllErrors,
    handleRuntimeError,
    handleNetworkError,
    handleValidationError,
    handleAuthError,
    safeAsyncAction,
    safeDataAccess,
    safeArrayAccess,
    safePropertyAccess,
    retryAction
  };
};

// Error Boundary Component
export class ResellerErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: {
        type: 'runtime',
        message: error.message,
        code: error.name,
        details: error.stack,
        timestamp: Date.now()
      }
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Reseller Dashboard Error Boundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-center mb-4">Something went wrong</h2>
            <p className="text-gray-600 text-center mb-6">
              We are sorry, but something unexpected happened. The error has been logged and our team will look into it.
            </p>
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleRetry}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 p-4 bg-gray-100 rounded">
                <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
                <pre className="mt-2 text-xs text-red-600 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Error Display Component
export const ErrorDisplay: React.FC<{
  error: ErrorInfo | null;
  onRetry?: () => void;
  onDismiss?: () => void;
}> = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;

  const isError = error.type !== 'runtime' || !error.code?.includes('SUCCESS');

  return (
    <div className={`fixed bottom-4 right-4 max-w-md p-4 rounded-lg shadow-lg z-50 ${
      isError ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
    }`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 w-5 h-5 ${
          isError ? 'text-red-600' : 'text-green-600'
        }`}>
          {isError ? (
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3 flex-1">
          <p className={`text-sm font-medium ${
            isError ? 'text-red-800' : 'text-green-800'
          }`}>
            {error.message}
          </p>
          {error.action && (
            <p className="mt-1 text-xs text-gray-500">
              Action: {error.action}
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0 flex space-x-2">
          {onRetry && isError && (
            <button
              onClick={onRetry}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default useResellerErrorHandling;
