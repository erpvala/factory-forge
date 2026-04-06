// @ts-nocheck
import React from "react";
import { RefreshCw, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** Optional label shown in the fallback header (e.g. "Marketplace") */
  label?: string;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

/**
 * AppErrorBoundary — universal class-based error boundary.
 *
 * Catches React render / lifecycle errors anywhere in its subtree and
 * renders a clean recovery UI instead of a blank / crashed screen.
 *
 * Usage:
 *   <AppErrorBoundary label="Dashboard">
 *     <HeavyDashboard />
 *   </AppErrorBoundary>
 *
 * The boundary auto-resets on route change (via a key prop on the wrapping
 * <Route>) so navigating away always gives a fresh render.
 */
export class AppErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, errorMessage: "" };

  static getDerivedStateFromError(error: unknown): State {
    const msg =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Unexpected error";
    return { hasError: true, errorMessage: msg };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    // Log to console – replace with your observability service if needed
    console.error("[AppErrorBoundary]", error, info?.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: "" });
  };

  handleGoHome = () => {
    // Use SPA navigation to avoid full page reload in fallback UI.
    this.handleReset();
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const section = this.props.label ?? "This section";

    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full rounded-2xl border border-destructive/30 bg-destructive/5 p-8 space-y-5 text-center shadow-lg">
          {/* Icon */}
          <div className="flex justify-center">
            <span className="inline-flex p-4 rounded-full bg-destructive/10">
              <AlertTriangle className="w-10 h-10 text-destructive" />
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {section} ran into an issue
            </h2>
            <p className="text-sm text-muted-foreground">
              Something went wrong while loading this section. Your session and
              data are safe.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 pt-2">
            <Button
              onClick={this.handleReset}
              className="w-full gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </Button>
            <Button
              variant="outline"
              onClick={this.handleGoHome}
              className="w-full gap-2"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default AppErrorBoundary;
