import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireRole, requireWriteAccess } from "./helpers.ts";
import { domainError, optionalText } from "./domain/common.ts";
import { normalizeIntegration } from "./domain/integrations.ts";

async function validateIntegrationReferences(
  ctx: Parameters<typeof requireWriteAccess>[0],
  sourceSystemId: typeof integrationArgs.sourceSystemId.type,
  destinationSystemId: typeof integrationArgs.destinationSystemId.type,
) {
  const [source, destination] = await Promise.all([
    ctx.db.get(sourceSystemId),
    ctx.db.get(destinationSystemId),
  ]);
  if (!source)
    domainError("NOT_FOUND", "Source system not found", "sourceSystemId");
  if (!destination)
    domainError(
      "NOT_FOUND",
      "Destination system not found",
      "destinationSystemId",
    );
}

const integrationArgs = {
  name: v.string(),
  sourceSystemId: v.id("software_systems"),
  destinationSystemId: v.id("software_systems"),
  protocol: v.union(
    v.literal("REST"),
    v.literal("GraphQL"),
    v.literal("SOAP"),
    v.literal("Webhook"),
    v.literal("DB"),
    v.literal("ETL"),
    v.literal("Queue"),
    v.literal("Other"),
  ),
  method: v.union(
    v.literal("realtime"),
    v.literal("batch"),
    v.literal("event_driven"),
    v.literal("manual"),
  ),
  healthStatus: v.union(
    v.literal("healthy"),
    v.literal("degraded"),
    v.literal("down"),
    v.literal("unknown"),
  ),
  criticalLevel: v.union(
    v.literal("high"),
    v.literal("medium"),
    v.literal("low"),
  ),
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
      .filter(
        (i) =>
          systemMap.has(i.sourceSystemId) &&
          systemMap.has(i.destinationSystemId),
      )
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
    const data = normalizeIntegration({
      ...args,
      lastSync: optionalText(args.lastSync),
    });
    await validateIntegrationReferences(
      ctx,
      data.sourceSystemId,
      data.destinationSystemId,
    );
    return await ctx.db.insert("integrations", data);
  },
});

export const update = mutation({
  args: { id: v.id("integrations"), ...integrationArgs },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...data } = args;
    if (!(await ctx.db.get(id)))
      domainError("NOT_FOUND", "Integration not found", "id");
    const normalized = normalizeIntegration({
      ...data,
      lastSync: optionalText(data.lastSync),
    });
    await validateIntegrationReferences(
      ctx,
      normalized.sourceSystemId,
      normalized.destinationSystemId,
    );
    await ctx.db.patch(id, normalized);
  },
});

export const remove = mutation({
  args: { id: v.id("integrations") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    if (!(await ctx.db.get(args.id)))
      domainError("NOT_FOUND", "Integration not found", "id");
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
      (i) =>
        systemIds.has(i.sourceSystemId) && systemIds.has(i.destinationSystemId),
    );
    return {
      total: integrations.length,
      healthy: integrations.filter((i) => i.healthStatus === "healthy").length,
      degraded: integrations.filter((i) => i.healthStatus === "degraded")
        .length,
      down: integrations.filter((i) => i.healthStatus === "down").length,
      nonCompliant: integrations.filter((i) => !i.isArchitectureCompliant)
        .length,
    };
  },
});
