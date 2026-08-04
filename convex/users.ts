import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { requireAuthenticated, requireCTO } from "./helpers";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return await requireAuthenticated(ctx);
  },
});

// Called from the frontend after login to ensure the user has a role assigned.
export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuthenticated(ctx);

    const userId = user._id;

    // Preserve intentionally assigned non-viewer roles
    if (user.role && user.role !== "viewer") return userId;

    // Check if this email was pre-configured by a CTO invite (isManuallyAdded)
    if (user.email) {
      const sameEmail = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", user.email!))
        .collect();

      const invite = sameEmail.find((u) => u._id !== userId && u.isManuallyAdded && u.role);
      if (invite) {
        await ctx.db.patch(userId, { role: invite.role });
        await ctx.db.delete(invite._id);
        return userId;
      }

    }

    if (user.role !== "viewer") {
      await ctx.db.patch(userId, { role: "viewer" });
    }
    return userId;
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireCTO(ctx);
    return await ctx.db.query("users").collect();
  },
});

export const inviteUser = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    role: v.union(
      v.literal("cto"),
      v.literal("it_manager"),
      v.literal("business_owner"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    await requireCTO(ctx);
    // Check if user with this email already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))
      .first();
    if (existing) {
      // Update role of existing user
      await ctx.db.patch(existing._id, { role: args.role });
      return existing._id;
    }
    return await ctx.db.insert("users", {
      name: args.name || undefined,
      email: args.email,
      role: args.role,
      isManuallyAdded: true,
    });
  },
});

export const removeUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const me = await requireCTO(ctx);
    if (args.userId === me._id) {
      throw new ConvexError({ message: "Cannot remove yourself", code: "FORBIDDEN" });
    }
    await ctx.db.delete(args.userId);
  },
});

export const updateUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("cto"),
      v.literal("it_manager"),
      v.literal("business_owner"),
      v.literal("viewer")
    ),
  },
  handler: async (ctx, args) => {
    await requireCTO(ctx);
    await ctx.db.patch(args.userId, { role: args.role });
  },
});
