import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

export function RouteLoadingFallback() {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      lang="en"
    >
      <span className="sr-only">Loading page</span>
      <div className="w-full max-w-5xl space-y-4" aria-hidden="true">
        <div className="h-8 w-52 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
        <div className="grid gap-4 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-lg border border-border bg-muted/50"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

type RouteErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
};

type RouteErrorBoundaryState = {
  error: Error | null;
};

export function RouteErrorFallback({
  onReload = () => window.location.reload(),
}: {
  onReload?: () => void;
}) {
  return (
    <div
      className="flex min-h-[50vh] items-center justify-center p-6"
      lang="en"
    >
      <div
        className="w-full max-w-md space-y-3 rounded-lg border border-border bg-card p-6 text-center"
        role="alert"
        aria-labelledby="route-error-title"
        aria-describedby="route-error-description"
      >
        <h1
          id="route-error-title"
          className="text-lg font-semibold text-foreground"
        >
          Unable to load this page
        </h1>
        <p
          id="route-error-description"
          className="text-sm text-muted-foreground"
        >
          Please reload the application. If the problem continues, contact
          support.
        </p>
        <button
          type="button"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          onClick={onReload}
          autoFocus
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

export class RouteErrorBoundary extends Component<
  RouteErrorBoundaryProps,
  RouteErrorBoundaryState
> {
  state: RouteErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): RouteErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Route rendering failed", error, errorInfo);
  }

  render() {
    if (this.state.error) {
      return <RouteErrorFallback />;
    }

    return this.props.children;
  }
}

export function RouteBoundaryFrame({
  children,
  resetKey,
}: RouteErrorBoundaryProps) {
  return (
    <RouteErrorBoundary key={resetKey} resetKey={resetKey}>
      <Suspense fallback={<RouteLoadingFallback />}>{children}</Suspense>
    </RouteErrorBoundary>
  );
}

export function RouteBoundary({ children }: { children: ReactNode }) {
  const location = useLocation();

  return (
    <RouteBoundaryFrame resetKey={location.pathname}>
      {children}
    </RouteBoundaryFrame>
  );
}
