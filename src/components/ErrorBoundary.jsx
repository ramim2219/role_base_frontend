import { Component } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * ErrorBoundary — catches render errors in children.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <AppRoutes />
 *   </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught:", error, errorInfo);
  }

  handleReload = () => window.location.reload();

  render() {
    if (!this.state.hasError) return this.props.children;

    const message =
      this.state.error?.message || "An unexpected error occurred.";

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
        <div className="w-full max-w-lg text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 mb-5">
            <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            Oops! Something went wrong.
          </h1>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 break-words">
            {message}
          </p>

          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={this.handleReload}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Page
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;