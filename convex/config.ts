import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireReadAccess, requireWriteAccess } from "./helpers.ts";
import { domainError, normalizedKey } from "./domain/common.ts";
import { normalizeConfigItem } from "./domain/config.ts";

const CONFIG_TYPES = ["category", "department", "campus"] as const;
type ConfigType = (typeof CONFIG_TYPES)[number];

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireReadAccess(ctx);
    const items = await ctx.db.query("config_items").collect();
    const result: Record<ConfigType, typeof items> = {
      category: [],
      department: [],
      campus: [],
    };
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
    type: v.union(
      v.literal("category"),
      v.literal("department"),
      v.literal("campus"),
    ),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const existing = await ctx.db
      .query("config_items")
      .withIndex("by_type", (q) => q.eq("type", args.type))
      .collect();
    const normalized = normalizeConfigItem(args);
    if (
      existing.some(
        (item) => normalizedKey(item.name) === normalized.normalizedName,
      )
    ) {
      domainError(
        "CONFLICT",
        "A config item with this name already exists",
        "name",
      );
    }
    return await ctx.db.insert("config_items", {
      type: args.type,
      name: normalized.name,
      color: normalized.color,
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
    const existingItem = await ctx.db.get(id);
    if (!existingItem) domainError("NOT_FOUND", "Config item not found", "id");
    const normalized = normalizeConfigItem(data);
    const siblings = await ctx.db
      .query("config_items")
      .withIndex("by_type", (q) => q.eq("type", existingItem.type))
      .collect();
    if (
      siblings.some(
        (item) =>
          item._id !== id &&
          normalizedKey(item.name) === normalized.normalizedName,
      )
    ) {
      domainError(
        "CONFLICT",
        "A config item with this name already exists",
        "name",
      );
    }
    await ctx.db.patch(id, { name: normalized.name, color: normalized.color });
  },
});

export const remove = mutation({
  args: { id: v.id("config_items") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const item = await ctx.db.get(args.id);
    if (!item) domainError("NOT_FOUND", "Config item not found", "id");
    const itemKey = normalizedKey(item.name);
    const systems = await ctx.db.query("software_systems").collect();
    const referenced = systems.some((system) => {
      if (item.type === "category")
        return normalizedKey(system.category) === itemKey;
      const values =
        item.type === "department" ? system.departments : system.campuses;
      return values.some((value) => normalizedKey(value) === itemKey);
    });
    if (referenced) {
      domainError(
        "REFERENCE_IN_USE",
        "Config item is referenced by a software system",
        "id",
      );
    }
    await ctx.db.delete(args.id);
  },
});
