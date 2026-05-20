import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireWriteAccess } from "./helpers.ts";

const CONFIG_TYPES = ["category", "department", "campus"] as const;
type ConfigType = typeof CONFIG_TYPES[number];

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const items = await ctx.db.query("config_items").collect();
    const result: Record<ConfigType, typeof items> = { category: [], department: [], campus: [] };
    for (const item of items) {
      result[item.type].push(item);
    }
    for (const type of CONFIG_TYPES) {
      result[type].sort((a, b) => a.order - b.order);
    }
    return result;
  },
});

export const add = mutation({
  args: {
    type: v.union(v.literal("category"), v.literal("department"), v.literal("campus")),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const existing = await ctx.db
      .query("config_items")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
    return await ctx.db.insert("config_items", {
      type: args.type,
      name: args.name,
      color: args.color,
      order: existing.length,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("config_items"),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("config_items") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    await ctx.db.delete(args.id);
  },
});
