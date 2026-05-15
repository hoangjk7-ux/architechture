import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

// Called from the frontend after login to ensure the user has a role assigned.
export const updateCurrentUser = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user) return null;

    // If already has a role, nothing to do
    if (user.role) return userId;

    // Assign cto to the very first user, viewer to everyone else
    const allUsers = await ctx.db.query("users").collect();
    const usersWithRole = allUsers.filter((u) => u.role !== undefined);
    const role = usersWithRole.length === 0 ? "cto" : "viewer";

    await ctx.db.patch(userId, { role });
    return userId;
  },
});

export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const me = await ctx.db.get(userId);
    if (!me || (me.role !== "cto" && me.role !== "it_manager")) {
      throw new ConvexError({ message: "Insufficient permissions", code: "FORBIDDEN" });
    }
    return await ctx.db.query("users").collect();
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
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const me = await ctx.db.get(callerId);
    if (!me || me.role !== "cto") {
      throw new ConvexError({ message: "Only CTO can update roles", code: "FORBIDDEN" });
    }
    await ctx.db.patch(args.userId, { role: args.role });
  },
});
