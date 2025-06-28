import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

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
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-pixel-gray-100 flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center" variant="elevated">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-16 h-16 bg-pixel-error rounded-pixel flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-white" />
              </div>
              
              <div>
                <h2 className="text-xl font-pixel text-pixel-gray-900 mb-2">
                  Oops! Something went wrong
                </h2>
                <p className="text-pixel-gray-600 font-pixel-sans">
                  The application encountered an unexpected error. Please try refreshing the page.
                </p>
              </div>
              
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="w-full text-left">
                  <summary className="cursor-pointer text-sm text-pixel-gray-500 font-pixel-sans">
                    Error Details
                  </summary>
                  <pre className="mt-2 text-xs text-pixel-gray-700 bg-pixel-gray-100 p-2 rounded overflow-auto">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}
              
              <div className="flex space-x-2">
                <Button
                  variant="primary"
                  icon={RefreshCw}
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => window.location.reload()}
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}