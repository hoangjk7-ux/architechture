import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.d.ts";
import { requireReadAccess, requireWriteAccess } from "./helpers.ts";
import { domainError } from "./domain/common.ts";
import { normalizeSystemModule } from "./domain/systemModules.ts";

export const listBySystem = query({
  args: { systemId: v.id("software_systems") },
  handler: async (ctx, args) => {
    await requireReadAccess(ctx);
    return await ctx.db
      .query("system_modules")
      .withIndex("by_system", (q) => q.eq("systemId", args.systemId))
      .collect();
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireReadAccess(ctx);
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
      v.literal("retired"),
    ),
    health: v.union(
      v.literal("healthy"),
      v.literal("degraded"),
      v.literal("down"),
      v.literal("unknown"),
    ),
    usedBy: v.array(v.string()),
    version: v.optional(v.string()),
    plannedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
    sortOrder: v.number(),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    if (!(await ctx.db.get(args.systemId))) {
      domainError("NOT_FOUND", "Software system not found", "systemId");
    }
    return await ctx.db.insert("system_modules", normalizeSystemModule(args));
  },
});

export const update = mutation({
  args: {
    id: v.id("system_modules"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    lifecycle: v.optional(
      v.union(
        v.literal("in_use"),
        v.literal("in_development"),
        v.literal("planned"),
        v.literal("deprecated"),
        v.literal("retired"),
      ),
    ),
    health: v.optional(
      v.union(
        v.literal("healthy"),
        v.literal("degraded"),
        v.literal("down"),
        v.literal("unknown"),
      ),
    ),
    usedBy: v.optional(v.array(v.string())),
    version: v.optional(v.string()),
    plannedDate: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...patch } = args;
    const existing = await ctx.db.get(id);
    if (!existing) domainError("NOT_FOUND", "System module not found", "id");
    const normalized = normalizeSystemModule({ ...existing, ...patch });
    await ctx.db.patch(id, {
      ...patch,
      name: normalized.name,
      description: normalized.description,
      usedBy: normalized.usedBy,
      version: normalized.version,
      plannedDate: normalized.plannedDate,
      notes: normalized.notes,
    });
  },
});

export const remove = mutation({
  args: { id: v.id("system_modules") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    if (!(await ctx.db.get(args.id)))
      domainError("NOT_FOUND", "System module not found", "id");
    await ctx.db.delete(args.id);
  },
});
