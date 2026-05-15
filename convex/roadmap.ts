import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, requireWriteAccess } from "./helpers.ts";

const roadmapArgs = {
  title: v.string(),
  level: v.union(v.literal("initiative"), v.literal("program"), v.literal("project"), v.literal("epic")),
  parentId: v.optional(v.id("roadmap_items")),
  status: v.union(
    v.literal("not_started"), v.literal("in_progress"),
    v.literal("blocked"), v.literal("done"), v.literal("cancelled")
  ),
  owner: v.optional(v.string()),
  startDate: v.optional(v.string()),
  dueDate: v.optional(v.string()),
  architectureAlignmentScore: v.number(),
  relatedSystemIds: v.array(v.id("software_systems")),
  description: v.optional(v.string()),
  priority: v.union(v.literal("high"), v.literal("medium"), v.literal("low")),
};

export const list = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.db.query("roadmap_items").collect();
  },
});

export const create = mutation({
  args: roadmapArgs,
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    return await ctx.db.insert("roadmap_items", args);
  },
});

export const update = mutation({
  args: { id: v.id("roadmap_items"), ...roadmapArgs },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { id: v.id("roadmap_items") },
  handler: async (ctx, args) => {
    await requireWriteAccess(ctx);
    await ctx.db.delete(args.id);
  },
});

export const getStats = query({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    const items = await ctx.db.query("roadmap_items").collect();
    const projects = items.filter((i) => i.level === "project");
    const now = new Date().toISOString().split("T")[0];
    return {
      total: items.length,
      inProgress: items.filter((i) => i.status === "in_progress").length,
      blocked: items.filter((i) => i.status === "blocked").length,
      done: items.filter((i) => i.status === "done").length,
      overdue: projects.filter((i) => i.dueDate && i.dueDate < now && i.status !== "done").length,
      completionRate: projects.length
        ? Math.round((projects.filter((i) => i.status === "done").length / projects.length) * 100)
        : 0,
      avgAlignmentScore: items.length
        ? Math.round(items.reduce((sum, i) => sum + i.architectureAlignmentScore, 0) / items.length)
        : 0,
    };
  },
});
