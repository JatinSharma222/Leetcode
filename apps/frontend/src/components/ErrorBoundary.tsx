import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  override state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled application error:", error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-surface-base px-4 text-center font-sans">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-status-error/30 bg-status-error/10">
            <AlertTriangle className="h-5 w-5 text-status-error" />
          </div>
          <div className="space-y-1">
            <h1 className="font-display text-lg font-semibold text-text-primary">
              Something went wrong
            </h1>
            <p className="max-w-sm text-sm text-text-muted">
              The page hit an unexpected error. Reload to try again.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-md bg-primary-container px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-wine-deep"
            >
              Reload page
            </button>
            <a
              href="/"
              className="rounded-md border border-border-hairline px-3 py-1.5 text-xs font-medium text-text-primary hover:bg-surface-hover"
            >
              Go to problems
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
