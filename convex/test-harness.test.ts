import { describe, expect, it } from "vitest";
import { createConvexTest } from "./test.setup";

describe("Convex test harness", () => {
  it("validates the schema and commits isolated database transactions", async () => {
    const t = createConvexTest();

    const vendorId = await t.run(async (ctx) => {
      return await ctx.db.insert("vendors", {
        name: "Harness Vendor",
        supportLevel: "business_hours",
        riskScore: 10,
      });
    });

    const vendor = await t.run(async (ctx) => await ctx.db.get(vendorId));

    expect(vendor).toMatchObject({
      name: "Harness Vendor",
      supportLevel: "business_hours",
      riskScore: 10,
    });
  });
});
