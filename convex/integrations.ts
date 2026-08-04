import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireWriteAccess } from "./helpers.ts";

const integrationArgs = {
  name: v.string(),
  sourceSystemId: v.id("software_systems"),
  destinationSystemId: v.id("software_systems"),
  protocol: v.union(
    v.literal("REST"), v.literal("GraphQL"), v.literal("SOAP"),
    v.literal("Webhook"), v.literal("DB"), v.literal("ETL"),
    v.literal("Queue"), v.literal("Other")
  ),
  method: v.union(v.literal("realtime"), v.literal("batch"), v.literal("event_driven"), v.literal("manual")),
  healthStatus: v.union(v.literal("healthy"), v.literal("degraded"), v.literal("down"), v.literal("unknown")),
  criticalLevel: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
  owner: v.optional(v.string()),
  errorRate: v.optional(v.number()),
  lastSync: v.optional(v.string()),
  description: v.optional(v.string()),
  isArchitectureCompliant: v.boolean(),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["cto", "it_manager", "viewer"]);
    const integrations = await ctx.db.query("integrations").collect();
    const systems = await ctx.db.query("software_systems").collect();
    const systemMap = new Map(systems.map((s) => [s._id, s]));
    // Defensively drop any integration left dangling by a system that was
    // deleted before cascade cleanup existed, so it never resurfaces in the UI.
    return integrations
      .filter((i) => systemMap.has(i.sourceSystemId) && systemMap.has(i.destinationSystemId))
      .map((i) => ({
        ...i,
        sourceSystem: systemMap.get(i.sourceSystemId),
        destinationSystem: systemMap.get(i.destinationSystemId),
      }));
  },
});

export const create = mutation({
  args: integrationArgs,
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    return await ctx.db.insert("integrations", args);
  },
});

export const update = mutation({
  args: { id: v.id("integrations"), ...integrationArgs },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await requireRole(ctx, ["cto", "it_manager", "viewer"]);
    const [allIntegrations, systems] = await Promise.all([
      ctx.db.query("integrations").collect(),
      ctx.db.query("software_systems").collect(),
    ]);
    const systemIds = new Set(systems.map((s) => s._id));
    const integrations = allIntegrations.filter(
      (i) => systemIds.has(i.sourceSystemId) && systemIds.has(i.destinationSystemId)
    );
    return {
      total: integrations.length,
      healthy: integrations.filter((i) => i.healthStatus === "healthy").length,
      degraded: integrations.filter((i) => i.healthStatus === "degraded").length,
      down: integrations.filter((i) => i.healthStatus === "down").length,
      nonCompliant: integrations.filter((i) => !i.isArchitectureCompliant).length,
    };
  },
});
