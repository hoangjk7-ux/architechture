import { lazy } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  RouteBoundaryFrame,
  RouteErrorBoundary,
  RouteErrorFallback,
  RouteLoadingFallback,
} from "./RouteBoundary.tsx";

describe("RouteBoundary", () => {
  it("renders children after they are available", () => {
    const html = renderToStaticMarkup(
      <RouteBoundaryFrame resetKey="/systems">
        <main>Systems</main>
      </RouteBoundaryFrame>,
    );

    expect(html).toContain("<main>Systems</main>");
    expect(html).not.toContain('role="status"');
  });

  it("renders an accessible status while a lazy route is pending", () => {
    const PendingRoute = lazy(() => new Promise<never>(() => undefined));
    const html = renderToStaticMarkup(
      <RouteBoundaryFrame resetKey="/architecture">
        <PendingRoute />
      </RouteBoundaryFrame>,
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain("Loading page");
  });

  it("provides an accessible error with a working recovery action", () => {
    const onReload = vi.fn();
    const html = renderToStaticMarkup(
      <RouteErrorFallback onReload={onReload} />,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain('aria-labelledby="route-error-title"');
    expect(html).toContain('aria-describedby="route-error-description"');

    RouteErrorFallback({
      onReload,
    }).props.children.props.children[2].props.onClick();
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("derives the error state and renders the error fallback", () => {
    const error = new Error("route failed");
    const state = RouteErrorBoundary.getDerivedStateFromError(error);
    const boundary = new RouteErrorBoundary({
      children: <main>Content</main>,
      resetKey: "/systems",
    });
    boundary.state = state;

    expect(state).toEqual({ error });
    expect(renderToStaticMarkup(boundary.render())).toContain('role="alert"');
  });

  it("uses the pathname as the remount key to reset captured errors", () => {
    const systemsFrame = RouteBoundaryFrame({
      children: <main />,
      resetKey: "/systems",
    });
    const vendorsFrame = RouteBoundaryFrame({
      children: <main />,
      resetKey: "/vendors",
    });

    expect(systemsFrame.key).toBe("/systems");
    expect(vendorsFrame.key).toBe("/vendors");
  });

  it("keeps decorative loading placeholders hidden from assistive technology", () => {
    const html = renderToStaticMarkup(<RouteLoadingFallback />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="sr-only"');
  });
});
