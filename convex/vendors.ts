import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireWriteAccess } from "./helpers.ts";

const vendorArgs = {
  name: v.string(),
  contactEmail: v.optional(v.string()),
  contactName: v.optional(v.string()),
  supportLevel: v.union(v.literal("24/7"), v.literal("business_hours"), v.literal("email_only")),
  sla: v.optional(v.string()),
  costPerYear: v.optional(v.number()),
  contractEndDate: v.optional(v.string()),
  riskScore: v.number(),
  notes: v.optional(v.string()),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const vendors = await ctx.db.query("vendors").collect();
    const systems = await ctx.db.query("software_systems").collect();
    return vendors.map((vendor) => ({
      ...vendor,
      systemCount: systems.filter((s) => s.vendorId === vendor._id).length,
    }));
  },
});

export const get = query({
  args: { id: v.id("vendors") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
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
    return await ctx.db.insert("vendors", args);
  },
});

export const update = mutation({
  args: { id: v.id("vendors"), ...vendorArgs },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("vendors") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    await ctx.db.delete(args.id);
  },
});

export const getExpiringContracts = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const vendors = await ctx.db.query("vendors").collect();
    const now = new Date().toISOString().split("T")[0];
    const ninetyDaysFromNow = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return vendors.filter(
      (v) => v.contractEndDate && v.contractEndDate >= now && v.contractEndDate <= ninetyDaysFromNow
    );
  },
});
