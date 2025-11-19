import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ErrorBoundaryState = {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
};

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("UI Error:", error, errorInfo);
    this.setState({ error, errorInfo });
    
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} onReset={() => this.setState({ hasError: false })} />;
    }

    return this.props.children;
  }
}

function ErrorFallback({ error, onReset }: { error?: Error; onReset: () => void }) {

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-2xl space-y-6 rounded-2xl border-2 border-red-200 bg-red-50/50 p-8 dark:border-red-800 dark:bg-red-950/20">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 p-3 dark:bg-red-900/40">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-red-900 dark:text-red-100">
              Something went wrong
            </h1>
            <p className="text-sm text-red-700 dark:text-red-300">
              We encountered an unexpected error. Please try again.
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-white p-4 dark:border-red-800 dark:bg-red-950/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-red-600 dark:text-red-400">
              Error Details
            </p>
            <p className="mt-2 font-mono text-sm text-red-800 dark:text-red-200">
              {error.message || "Unknown error"}
            </p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() => {
              onReset();
              window.location.reload();
            }}
            className="bg-gradient-to-r from-indigo-600 to-cyan-500 text-white hover:from-indigo-700 hover:to-cyan-600"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload Page
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              onReset();
              window.location.href = "/";
            }}
          >
            <Home className="mr-2 h-4 w-4" />
            Go Home
          </Button>
        </div>

        <p className="text-xs text-red-600 dark:text-red-400">
          If this problem persists, please contact support.
        </p>
      </Card>
    </div>
  );
}
