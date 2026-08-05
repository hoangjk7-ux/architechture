import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { MobileNavigation } from "./MobileNavigation.tsx";
import { visibleNavigationForRole } from "./navigation.ts";

const labels: Record<string, string> = {
  "nav.dashboard": "Dashboard",
  "nav.systems": "System Inventory",
  "nav.vendors": "Vendor Management",
  "nav.architecture": "Architecture Map",
  "detail.more": "More",
  "app.subtitle": "Technology governance",
};

describe("MobileNavigation", () => {
  it("preserves complete translated labels and marks the active route", () => {
    const html = renderToStaticMarkup(
      <MemoryRouter initialEntries={["/systems"]}>
        <MobileNavigation
          items={visibleNavigationForRole("business_owner")}
          translate={(key) => labels[key] ?? key}
        />
      </MemoryRouter>,
    );

    expect(html).toContain("System Inventory");
    expect(html).toContain("Vendor Management");
    expect(html).toContain("Architecture Map");
    expect(html).toContain('aria-current="page"');
    expect(html).toContain('aria-label="More"');
  });
});
