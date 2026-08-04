import { query } from "./_generated/server";
import { v } from "convex/values";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel.d.ts";
import { requireAuthenticated, requireRole } from "./helpers.ts";

export type FieldChange = { field: string; from?: string; to?: string };

function stringify(value: unknown): string | undefined {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return value.length ? value.join(", ") : "—";
  return String(value);
}

function isEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((v, i) => v === b[i]);
  }
  return a === b;
}

export function diffFields<T extends Record<string, unknown>>(before: T, after: T): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of Object.keys(after)) {
    if (!isEqual(before[field], after[field])) {
      changes.push({ field, from: stringify(before[field]), to: stringify(after[field]) });
    }
  }
  return changes;
}

export async function recordSystemChange(
  ctx: MutationCtx,
  args: {
    systemId?: Id<"software_systems">;
    systemName: string;
    action: "created" | "updated" | "deleted";
    changes?: FieldChange[];
  }
) {
  const user = await requireAuthenticated(ctx);
  await ctx.db.insert("system_change_logs", {
    systemId: args.systemId,
    systemName: args.systemName,
    action: args.action,
    changes: args.changes,
    actorName: user?.name,
    actorEmail: user?.email,
  });
}

export const list = query({
  args: { systemId: v.optional(v.id("software_systems")), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireRole(ctx, ["cto", "it_manager"]);
    const logs = args.systemId
      ? await ctx.db
          .query("system_change_logs")
          .withIndex("by_system", (q) => q.eq("systemId", args.systemId))
          .order("desc")
          .take(args.limit ?? 100)
      : await ctx.db.query("system_change_logs").order("desc").take(args.limit ?? 100);
    return logs;
  },
});
