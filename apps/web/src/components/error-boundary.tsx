import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { logError } from '@/lib/error-logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary for catching React errors
 * 
 * Usage:
 * <ErrorBoundary fallback={<ErrorFallback />}>
 *   <YourComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Log to localStorage for debugging
    logError({
      type: 'react_error',
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    });

    // Call optional handler
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return <DefaultErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error }: { error?: Error }) {
  const [showDetails, setShowDetails] = React.useState(false);
  
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-8">
          <h1 className="text-2xl font-bold text-red-800 mb-2">
            Something went wrong
          </h1>
          
          <p className="text-red-600 mb-4">
            The app encountered an unexpected error. Try refreshing the page.
          </p>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Refresh Page
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="ml-3 text-red-600 underline hover:text-red-800"
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
          
          {showDetails && error && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg text-left overflow-auto">
              <pre className="text-xs text-red-800 whitespace-pre-wrap">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-500">
          If this keeps happening, check the browser console for more details.
        </p>
      </div>
    </div>
  );
}
