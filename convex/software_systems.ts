import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireWriteAccess } from "./helpers.ts";

const systemArgs = {
  name: v.string(),
  type: v.union(v.literal("core"), v.literal("supporting"), v.literal("legacy"), v.literal("pilot")),
  category: v.string(),
  status: v.union(v.literal("active"), v.literal("sunset"), v.literal("pilot"), v.literal("inactive")),
  criticality: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  owner: v.optional(v.string()),
  vendorId: v.optional(v.id("vendors")),
  departments: v.array(v.string()),
  campuses: v.array(v.string()),
  technology: v.optional(v.string()),
  database: v.optional(v.string()),
  hosting: v.optional(v.string()),
  sla: v.optional(v.string()),
  licenseType: v.optional(v.string()),
  costPerYear: v.optional(v.number()),
  contractEndDate: v.optional(v.string()),
  riskLevel: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  technicalDebtScore: v.number(),
  architectureScore: v.number(),
  description: v.optional(v.string()),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const systems = await ctx.db.query("software_systems").collect();
    const vendors = await ctx.db.query("vendors").collect();
    const vendorMap = new Map(vendors.map((v) => [v._id, v]));
    return systems.map((s) => ({
      ...s,
      vendor: s.vendorId ? vendorMap.get(s.vendorId) : undefined,
    }));
  },
});

export const get = query({
  args: { id: v.id("software_systems") },
  handler: async (ctx, args) => {
    await getCurrentUser(ctx);
    const system = await ctx.db.get(args.id);
    if (!system) return null;
    const vendor = system.vendorId ? await ctx.db.get(system.vendorId) : undefined;
    return { ...system, vendor };
  },
});

export const create = mutation({
  args: systemArgs,
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    return await ctx.db.insert("software_systems", args);
  },
});

export const update = mutation({
  args: { id: v.id("software_systems"), ...systemArgs },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("software_systems") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const systems = await ctx.db.query("software_systems").collect();
    const now = new Date().toISOString().split("T")[0];
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    return {
      total: systems.length,
      active: systems.filter((s) => s.status === "active").length,
      legacy: systems.filter((s) => s.type === "legacy").length,
      critical: systems.filter((s) => s.criticality === "high").length,
      noOwner: systems.filter((s) => !s.owner).length,
      highRisk: systems.filter((s) => s.riskLevel === "high").length,
      expiringContracts: systems.filter(
        (s) => s.contractEndDate && s.contractEndDate >= now && s.contractEndDate <= thirtyDaysFromNow
      ).length,
      avgArchitectureScore: systems.length
        ? Math.round(systems.reduce((sum, s) => sum + s.architectureScore, 0) / systems.length)
        : 0,
      avgTechnicalDebt: systems.length
        ? Math.round(systems.reduce((sum, s) => sum + s.technicalDebtScore, 0) / systems.length)
        : 0,
    };
  },
});
