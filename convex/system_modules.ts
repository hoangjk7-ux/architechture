import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.d.ts";

export const listBySystem = query({
  args: { systemId: v.id("software_systems") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("system_modules")
      .withIndex("by_system", (q) => q.eq("systemId", args.systemId))
      .collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("system_modules").collect();
  },
});

export const create = mutation({
  args: {
    systemId: v.id("software_systems"),
    name: v.string(),
    description: v.optional(v.string()),
    lifecycle: v.union(
      v.literal("in_use"),
      v.literal("in_development"),
      v.literal("planned"),
      v.literal("deprecated"),
      v.literal("retired")
    ),
    health: v.union(
      v.literal("healthy"),
      v.literal("degraded"),
      v.literal("down"),
      v.literal("unknown")
    ),
    usedBy: v.array(v.string()),
    version: v.optional(v.string()),
    plannedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("system_modules", args);
  },
});

export const update = mutation({
  args: {
    id: v.id("system_modules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    lifecycle: v.optional(v.union(
      v.literal("in_use"),
      v.literal("in_development"),
      v.literal("planned"),
      v.literal("deprecated"),
      v.literal("retired")
    )),
    health: v.optional(v.union(
      v.literal("healthy"),
      v.literal("degraded"),
      v.literal("down"),
      v.literal("unknown")
    )),
    usedBy: v.optional(v.array(v.string())),
    version: v.optional(v.string()),
    plannedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...patch } = args;
    await ctx.db.patch(id, patch);
  },
});

export const remove = mutation({
  args: { id: v.id("system_modules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
