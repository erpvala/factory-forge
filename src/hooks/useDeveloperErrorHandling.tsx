// @ts-nocheck
'use client';

import { useState, useCallback, useEffect, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Error types
enum ErrorType {
  RUNTIME_ERROR = 'RUNTIME_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  API_ERROR = 'API_ERROR',
  NULL_UNDEFINED_ERROR = 'NULL_UNDEFINED_ERROR',
  PIPELINE_ERROR = 'PIPELINE_ERROR',
  DEPLOYMENT_ERROR = 'DEPLOYMENT_ERROR'
}

// Error severity levels
enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Error interface
interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  stackTrace?: string;
  context?: string;
  timestamp: string;
  userId?: string;
  sessionId?: string;
  resolved: boolean;
}

// Error handling configuration
interface ErrorHandlingConfig {
  enableGlobalBoundary: boolean;
  enableErrorLogging: boolean;
  enableUserNotifications: boolean;
  enableAutoRetry: boolean;
  maxRetries: number;
  retryDelay: number;
  fallbackComponent?: ReactNode;
}

const defaultConfig: ErrorHandlingConfig = {
  enableGlobalBoundary: true,
  enableErrorLogging: true,
  enableUserNotifications: true,
  enableAutoRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  fallbackComponent: null
};

// Error boundary component
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: any) => void;
}

const DeveloperErrorBoundary: React.FC<ErrorBoundaryProps> = ({ 
  children, 
  fallback, 
  onError 
}) => {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Global error caught:', event.error);
      setHasError(true);
      setError(event.error);
      
      if (onError) {
        onError(event.error, { errorInfo: event.error?.stack });
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      setHasError(true);
      setError(new Error(event.reason));
      
      if (onError) {
        onError(new Error(event.reason), { errorInfo: 'Unhandled promise rejection' });
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [onError]);

  if (hasError) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-600">
              Something went wrong
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              An unexpected error occurred. Our team has been notified.
            </p>
            
            {error?.message && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800 font-mono">
                  {error.message}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Button 
                onClick={() => {
                  setHasError(false);
                  setError(null);
                }} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reload Page
              </Button>
              
              <Button 
                onClick={() => navigate('/developer/dashboard')} 
                className="w-full"
                variant="outline"
              >
                <Home className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

// Error handling hook
const useDeveloperErrorHandling = (config: Partial<ErrorHandlingConfig> = {}) => {
  const [errors, setErrors] = useState<AppError[]>([]);
  const [currentError, setCurrentError] = useState<AppError | null>(null);
  const [retryCount, setRetryCount] = useState<Record<string, number>>({});
  
  const finalConfig = { ...defaultConfig, ...config };

  // Generate unique error ID
  const generateErrorId = (): string => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Get user and session info
  const getUserInfo = () => {
    try {
      const session = localStorage.getItem('developer_session');
      if (session) {
        const parsed = JSON.parse(session);
        return {
          userId: parsed.id,
          sessionId: parsed.id
        };
      }
    } catch (error) {
      console.error('Failed to get user info:', error);
    }
    return { userId: undefined, sessionId: undefined };
  };

  // Categorize error type
  const categorizeError = (error: Error | string): ErrorType => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    
    if (errorMessage.includes('Network') || errorMessage.includes('fetch')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (errorMessage.includes('Authentication') || errorMessage.includes('Unauthorized')) {
      return ErrorType.AUTHENTICATION_ERROR;
    }
    if (errorMessage.includes('Permission') || errorMessage.includes('Forbidden')) {
      return ErrorType.PERMISSION_ERROR;
    }
    if (errorMessage.includes('Validation') || errorMessage.includes('required')) {
      return ErrorType.VALIDATION_ERROR;
    }
    if (errorMessage.includes('null') || errorMessage.includes('undefined')) {
      return ErrorType.NULL_UNDEFINED_ERROR;
    }
    if (errorMessage.includes('pipeline') || errorMessage.includes('build')) {
      return ErrorType.PIPELINE_ERROR;
    }
    if (errorMessage.includes('deployment') || errorMessage.includes('deploy')) {
      return ErrorType.DEPLOYMENT_ERROR;
    }
    if (errorMessage.includes('API') || errorMessage.includes('endpoint')) {
      return ErrorType.API_ERROR;
    }
    
    return ErrorType.RUNTIME_ERROR;
  };

  // Determine error severity
  const getErrorSeverity = (errorType: ErrorType): ErrorSeverity => {
    switch (errorType) {
      case ErrorType.AUTHENTICATION_ERROR:
      case ErrorType.PERMISSION_ERROR:
      case ErrorType.CRITICAL:
        return ErrorSeverity.CRITICAL;
      case ErrorType.NETWORK_ERROR:
      case ErrorType.API_ERROR:
      case ErrorType.PIPELINE_ERROR:
      case ErrorType.DEPLOYMENT_ERROR:
        return ErrorSeverity.HIGH;
      case ErrorType.VALIDATION_ERROR:
        return ErrorSeverity.MEDIUM;
      case ErrorType.NULL_UNDEFINED_ERROR:
      case ErrorType.RUNTIME_ERROR:
      default:
        return ErrorSeverity.LOW;
    }
  };

  // Log error to console and external service
  const logError = useCallback((error: AppError) => {
    if (!finalConfig.enableErrorLogging) return;

    // Log to console
    console.error('Application Error:', error);

    // In production, this would send to an error tracking service
    // For now, we'll store in localStorage for demo purposes
    try {
      const existingErrors = JSON.parse(localStorage.getItem('error_logs') || '[]');
      existingErrors.push(error);
      
      // Keep only last 100 errors
      if (existingErrors.length > 100) {
        existingErrors.splice(0, existingErrors.length - 100);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(existingErrors));
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }, [finalConfig.enableErrorLogging]);

  // Create and handle error
  const handleError = useCallback((error: Error | string, context?: string): AppError => {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const stackTrace = typeof error === 'string' ? undefined : error.stack;
    const userInfo = getUserInfo();
    
    const appError: AppError = {
      id: generateErrorId(),
      type: categorizeError(error),
      severity: getErrorSeverity(categorizeError(error)),
      message: errorMessage,
      stackTrace,
      context,
      timestamp: new Date().toISOString(),
      userId: userInfo.userId,
      sessionId: userInfo.sessionId,
      resolved: false
    };

    // Add to errors list
    setErrors(prev => [appError, ...prev]);
    setCurrentError(appError);

    // Log error
    logError(appError);

    // Show user notification for critical errors
    if (finalConfig.enableUserNotifications && appError.severity === ErrorSeverity.CRITICAL) {
      // In a real app, this would show a toast notification
      console.warn('Critical error detected:', appError.message);
    }

    return appError;
  }, [logError, finalConfig.enableUserNotifications]);

  // Safe async function wrapper
  const safeAsync = useCallback(async <T,>(
    asyncFn: () => Promise<T>,
    context?: string,
    retryKey?: string
  ): Promise<{ success: boolean; data?: T; error?: AppError }> => {
    const currentRetryCount = retryKey ? retryCount[retryKey] || 0 : 0;
    
    try {
      const result = await asyncFn();
      
      // Reset retry count on success
      if (retryKey && currentRetryCount > 0) {
        setRetryCount(prev => ({ ...prev, [retryKey]: 0 }));
      }
      
      return { success: true, data: result };
    } catch (error) {
      const appError = handleError(error as Error, context);
      
      // Auto-retry logic
      if (finalConfig.enableAutoRetry && 
          retryKey && 
          currentRetryCount < finalConfig.maxRetries &&
          appError.type === ErrorType.NETWORK_ERROR) {
        
        setRetryCount(prev => ({ ...prev, [retryKey]: currentRetryCount + 1 }));
        
        console.log(`Retrying operation (${currentRetryCount + 1}/${finalConfig.maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, finalConfig.retryDelay));
        
        return safeAsync(asyncFn, context, retryKey);
      }
      
      return { success: false, error: appError };
    }
  }, [handleError, finalConfig.enableAutoRetry, finalConfig.maxRetries, finalConfig.retryDelay, retryCount]);

  // Safe function wrapper for synchronous operations
  const safeSync = useCallback(<T,>(
    fn: () => T,
    context?: string
  ): { success: boolean; data?: T; error?: AppError } => {
    try {
      const result = fn();
      return { success: true, data: result };
    } catch (error) {
      const appError = handleError(error as Error, context);
      return { success: false, error: appError };
    }
  }, [handleError]);

  // Handle null/undefined data safely
  const safeData = useCallback(<T>(
    data: T | null | undefined,
    fallback: T,
    context?: string
  ): T => {
    if (data === null || data === undefined) {
      handleError(`Null/undefined data encountered`, context);
      return fallback;
    }
    return data;
  }, [handleError]);

  // Resolve error
  const resolveError = useCallback((errorId: string) => {
    setErrors(prev => prev.map(error => 
      error.id === errorId ? { ...error, resolved: true } : error
    ));
    
    if (currentError?.id === errorId) {
      setCurrentError(null);
    }
  }, [currentError]);

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors([]);
    setCurrentError(null);
  }, []);

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity: ErrorSeverity): AppError[] => {
    return errors.filter(error => error.severity === severity && !error.resolved);
  }, [errors]);

  // Get errors by type
  const getErrorsByType = useCallback((type: ErrorType): AppError[] => {
    return errors.filter(error => error.type === type && !error.resolved);
  }, [errors]);

  // Get unresolved errors
  const getUnresolvedErrors = useCallback((): AppError[] => {
    return errors.filter(error => !error.resolved);
  }, [errors]);

  // Error recovery suggestions
  const getErrorSuggestion = useCallback((error: AppError): string => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Check your internet connection and try again.';
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Please log in again to continue.';
      case ErrorType.PERMISSION_ERROR:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorType.NULL_UNDEFINED_ERROR:
        return 'Data is missing. Please refresh the page and try again.';
      case ErrorType.PIPELINE_ERROR:
        return 'Check pipeline configuration and try running it again.';
      case ErrorType.DEPLOYMENT_ERROR:
        return 'Check deployment settings and server connectivity.';
      case ErrorType.API_ERROR:
        return 'Server error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }, []);

  // Monitor for specific error patterns
  useEffect(() => {
    const criticalErrors = getErrorsBySeverity(ErrorSeverity.CRITICAL);
    if (criticalErrors.length > 0) {
      console.warn('Critical errors detected:', criticalErrors);
    }
  }, [errors, getErrorsBySeverity]);

  return {
    errors,
    currentError,
    handleError,
    safeAsync,
    safeSync,
    safeData,
    resolveError,
    clearErrors,
    getErrorsBySeverity,
    getErrorsByType,
    getUnresolvedErrors,
    getErrorSuggestion
  };
};

// Error recovery component
interface ErrorRecoveryProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({ error, onRetry, onDismiss }) => {
  const getSuggestion = () => {
    switch (error.type) {
      case ErrorType.NETWORK_ERROR:
        return 'Check your internet connection and try again.';
      case ErrorType.AUTHENTICATION_ERROR:
        return 'Please log in again to continue.';
      case ErrorType.PERMISSION_ERROR:
        return 'You don\'t have permission to perform this action.';
      case ErrorType.VALIDATION_ERROR:
        return 'Please check your input and try again.';
      case ErrorType.NULL_UNDEFINED_ERROR:
        return 'Data is missing. Please refresh the page and try again.';
      case ErrorType.PIPELINE_ERROR:
        return 'Check pipeline configuration and try running it again.';
      case ErrorType.DEPLOYMENT_ERROR:
        return 'Check deployment settings and server connectivity.';
      case ErrorType.API_ERROR:
        return 'Server error occurred. Please try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const getSeverityColor = () => {
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        return 'bg-red-100 border-red-200 text-red-800';
      case ErrorSeverity.HIGH:
        return 'bg-orange-100 border-orange-200 text-orange-800';
      case ErrorSeverity.MEDIUM:
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      case ErrorSeverity.LOW:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  return (
    <Card className={`border-2 ${getSeverityColor()}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <Bug className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium mb-1">
              {error.type.replace('_', ' ')}
            </h4>
            <p className="text-sm mb-2">{error.message}</p>
            <p className="text-xs opacity-75 mb-3">{getSuggestion()}</p>
            <div className="flex items-center space-x-2">
              {onRetry && (
                <Button size="sm" variant="outline" onClick={onRetry}>
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Retry
                </Button>
              )}
              {onDismiss && (
                <Button size="sm" variant="ghost" onClick={onDismiss}>
                  Dismiss
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export {
  useDeveloperErrorHandling,
  DeveloperErrorBoundary,
  ErrorRecovery,
  ErrorType,
  ErrorSeverity,
  type AppError,
  type ErrorHandlingConfig,
  type ErrorBoundaryProps
};

export default useDeveloperErrorHandling;
