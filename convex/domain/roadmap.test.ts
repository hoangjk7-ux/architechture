import { describe, expect, it } from "vitest";
import { assertNoRoadmapCycle, assertRoadmapParent, normalizeRoadmapItem } from "./roadmap";

describe("roadmap domain rules", () => {
  it("enforces the roadmap level hierarchy", () => {
    expect(() => assertRoadmapParent("initiative", null)).not.toThrow();
    expect(() => assertRoadmapParent("project", "program")).not.toThrow();
    expect(() => assertRoadmapParent("epic", "initiative")).toThrow();
  });

  it("rejects cycles", () => {
    expect(() => assertNoRoadmapCycle("item-a", ["item-b", "item-a"])).toThrow();
  });

  it("normalizes text, dates and alignment score", () => {
    expect(
      normalizeRoadmapItem({
        title: "  ERP migration ",
        level: "project",
        startDate: "2026-01-01",
        dueDate: "2026-06-30",
        architectureAlignmentScore: 80,
      }),
    ).toMatchObject({ title: "ERP migration", architectureAlignmentScore: 80 });
  });
});
