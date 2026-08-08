import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel.d.ts";
import { requireReadAccess, requireWriteAccess } from "./helpers.ts";
import { domainError } from "./domain/common.ts";
import { normalizeSystemModule } from "./domain/systemModules.ts";
import { diffFields, recordSystemChange } from "./system_change_logs.ts";

function moduleLogSnapshot(module: Doc<"system_modules">) {
  return {
    name: module.name,
    description: module.description,
    lifecycle: module.lifecycle,
    health: module.health,
    usedBy: module.usedBy,
    version: module.version,
    plannedDate: module.plannedDate,
    notes: module.notes,
  };
}

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
    const system = await ctx.db.get(args.systemId);
    if (!system) {
      domainError("NOT_FOUND", "Software system not found", "systemId");
    }
    const data = normalizeSystemModule(args);
    const id = await ctx.db.insert("system_modules", data);
    await recordSystemChange(ctx, {
      systemId: args.systemId,
      systemName: `${system.name} · ${data.name}`,
      action: "feature_created",
      changes: [
        { field: "lifecycle", to: data.lifecycle },
        { field: "health", to: data.health },
      ],
    });
    return id;
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
    const system = await ctx.db.get(existing.systemId);
    const normalized = normalizeSystemModule({ ...existing, ...patch });
    const updatePatch = {
      ...patch,
      name: normalized.name,
      description: normalized.description,
      usedBy: normalized.usedBy,
      version: normalized.version,
      plannedDate: normalized.plannedDate,
      notes: normalized.notes,
    };
    await ctx.db.patch(id, updatePatch);

    const updated = { ...existing, ...updatePatch };
    const changes = diffFields(
      moduleLogSnapshot(existing),
      moduleLogSnapshot(updated),
    );
    if (changes.length > 0) {
      await recordSystemChange(ctx, {
        systemId: existing.systemId,
        systemName: `${system?.name ?? "Unknown system"} · ${normalized.name}`,
        action: "feature_updated",
        changes,
      });
    }
  },
});

export const remove = mutation({
  args: { id: v.id("system_modules") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const existing = await ctx.db.get(args.id);
    if (!existing) domainError("NOT_FOUND", "System module not found", "id");
    const system = await ctx.db.get(existing.systemId);
    await ctx.db.delete(args.id);
    await recordSystemChange(ctx, {
      systemId: existing.systemId,
      systemName: `${system?.name ?? "Unknown system"} · ${existing.name}`,
      action: "feature_deleted",
    });
  },
});
