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

    // Check if this email was pre-configured by a CTO invite
    if (user.email) {
      const preConfigured = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", user.email!))
        .collect();
      const invite = preConfigured.find((u) => u._id !== userId && u.isManuallyAdded && u.role);
      if (invite) {
        await ctx.db.patch(userId, { role: invite.role });
        await ctx.db.delete(invite._id);
        return userId;
      }
    }

    // Assign cto if no write-capable user exists yet, otherwise viewer
    const allUsers = await ctx.db.query("users").collect();
    const hasWriteRole = allUsers.some((u) => u.role === "cto" || u.role === "it_manager");
    const role = !hasWriteRole ? "cto" : "viewer";

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
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const me = await ctx.db.get(callerId);
    if (!me || me.role !== "cto") {
      throw new ConvexError({ message: "Only CTO can invite users", code: "FORBIDDEN" });
    }
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
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });
    const me = await ctx.db.get(callerId);
    if (!me || me.role !== "cto") {
      throw new ConvexError({ message: "Only CTO can remove users", code: "FORBIDDEN" });
    }
    if (args.userId === callerId) {
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
    const callerId = await getAuthUserId(ctx);
    if (!callerId) throw new ConvexError({ message: "Not authenticated", code: "UNAUTHENTICATED" });

    const me = await ctx.db.get(callerId);
    if (!me || me.role !== "cto") {
      throw new ConvexError({ message: "Only CTO can update roles", code: "FORBIDDEN" });
    }
    await ctx.db.patch(args.userId, { role: args.role });
  },
});
