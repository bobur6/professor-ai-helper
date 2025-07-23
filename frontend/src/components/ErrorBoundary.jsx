import React, { Component } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
          <div className="w-full max-w-md p-6 space-y-4 bg-white rounded-lg shadow-md">
            <div className="flex items-center justify-center text-red-500">
              <FiAlertTriangle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-center text-gray-800">
              Something went wrong
            </h2>
            <p className="text-center text-gray-600">
              We're sorry, but an unexpected error occurred. Our team has been notified.
            </p>
            {process.env.NODE_ENV === 'development' && (
              <details className="p-3 mt-4 text-sm text-red-600 bg-red-50 rounded-md overflow-auto max-h-60">
                <summary className="font-medium cursor-pointer">Error details</summary>
                <pre className="mt-2 whitespace-pre-wrap">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            <div className="flex justify-center mt-6">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const withErrorBoundary = (WrappedComponent) => {
  return class extends Component {
    render() {
      return (
        <ErrorBoundary>
          <WrappedComponent {...this.props} />
        </ErrorBoundary>
      );
    }
  };
};

export default ErrorBoundary;
