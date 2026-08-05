import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireReadAccess, requireWriteAccess } from "./helpers.ts";
import { domainError } from "./domain/common.ts";
import { normalizeVendor } from "./domain/vendors.ts";

const vendorArgs = {
  name: v.string(),
  contactEmail: v.optional(v.string()),
  contactName: v.optional(v.string()),
  supportLevel: v.union(
    v.literal("24/7"),
    v.literal("business_hours"),
    v.literal("email_only"),
  ),
  sla: v.optional(v.string()),
  costPerYear: v.optional(v.number()),
  contractEndDate: v.optional(v.string()),
  riskScore: v.number(),
  notes: v.optional(v.string()),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireReadAccess(ctx);
    const vendors = await ctx.db.query("vendors").collect();
    const systems = await ctx.db.query("software_systems").collect();
    const systemCountByVendor = new Map<string, number>();
    for (const system of systems) {
      if (!system.vendorId) continue;
      systemCountByVendor.set(
        system.vendorId,
        (systemCountByVendor.get(system.vendorId) ?? 0) + 1,
      );
    }
    return vendors.map((vendor) => ({
      ...vendor,
      systemCount: systemCountByVendor.get(vendor._id) ?? 0,
    }));
  },
});

export const get = query({
  args: { id: v.id("vendors") },
  handler: async (ctx, args) => {
    await requireReadAccess(ctx);
    const vendor = await ctx.db.get(args.id);
    if (!vendor) return null;
    const systems = await ctx.db
      .query("software_systems")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.id))
      .collect();
    return { ...vendor, systems };
  },
});

export const create = mutation({
  args: vendorArgs,
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    return await ctx.db.insert("vendors", normalizeVendor(args));
  },
});

export const update = mutation({
  args: { id: v.id("vendors"), ...vendorArgs },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...data } = args;
    if (!(await ctx.db.get(id)))
      domainError("NOT_FOUND", "Vendor not found", "id");
    await ctx.db.patch(id, normalizeVendor(data));
  },
});

export const remove = mutation({
  args: { id: v.id("vendors") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    if (!(await ctx.db.get(args.id)))
      domainError("NOT_FOUND", "Vendor not found", "id");
    const referencedSystem = await ctx.db
      .query("software_systems")
      .withIndex("by_vendor", (q) => q.eq("vendorId", args.id))
      .first();
    if (referencedSystem) {
      domainError(
        "REFERENCE_IN_USE",
        "Vendor is referenced by a software system",
        "id",
      );
    }
    await ctx.db.delete(args.id);
  },
});

export const getExpiringContracts = query({
  args: {},
  handler: async (ctx) => {
    await requireReadAccess(ctx);
    const vendors = await ctx.db.query("vendors").collect();
    const now = new Date().toISOString().split("T")[0];
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
    return vendors.filter(
      (v) =>
        v.contractEndDate &&
        v.contractEndDate >= now &&
        v.contractEndDate <= ninetyDaysFromNow,
    );
  },
});
