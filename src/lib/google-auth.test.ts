import { describe, expect, it } from "vitest";
import { resolveGoogleClientId } from "./google-auth";

describe("resolveGoogleClientId", () => {
  it("prefers the Vite-prefixed Google client ID when present", () => {
    const env = {
      VITE_GOOGLE_CLIENT_ID: "client-from-vite.env",
      GOOGLE_CLIENT_ID: "client-from-legacy.env",
    };

    expect(resolveGoogleClientId(env)).toBe("client-from-vite.env");
  });

  it("falls back to the legacy Google client ID name", () => {
    const env = {
      GOOGLE_CLIENT_ID: "client-from-legacy.env",
    };

    expect(resolveGoogleClientId(env)).toBe("client-from-legacy.env");
  });

  it("returns undefined when no Google client ID is configured", () => {
    expect(resolveGoogleClientId({})).toBeUndefined();
  });
});
