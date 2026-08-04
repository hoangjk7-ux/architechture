import { describe, expect, it } from "vitest";
import {
  isoDate,
  normalizeEmail,
  numberInRange,
  orderedDates,
  requiredText,
  uniqueTexts,
} from "./common";

describe("domain common validators", () => {
  it("normalizes required text and email", () => {
    expect(requiredText("  TechGov  ", "name")).toBe("TechGov");
    expect(normalizeEmail("  Admin@Example.COM ")).toBe("admin@example.com");
  });

  it("rejects blank text, invalid ranges and invalid calendar dates", () => {
    expect(() => requiredText("   ", "name")).toThrow();
    expect(() => numberInRange(101, 0, 100, "score")).toThrow();
    expect(() => isoDate("2026-02-30", "date")).toThrow();
  });

  it("validates date ordering", () => {
    expect(orderedDates("2026-01-01", "2026-01-31")).toEqual({
      start: "2026-01-01",
      end: "2026-01-31",
    });
    expect(() => orderedDates("2026-02-01", "2026-01-31")).toThrow();
  });

  it("deduplicates normalized text while retaining first spelling", () => {
    expect(uniqueTexts([" IT ", "it", "Finance"], "departments")).toEqual([
      "IT",
      "Finance",
    ]);
  });
});
