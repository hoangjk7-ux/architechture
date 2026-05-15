import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export type UserRole = "cto" | "it_manager" | "business_owner" | "viewer";

export async function getCurrentUser(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (!userId) {
    throw new ConvexError({ message: "User not logged in", code: "UNAUTHENTICATED" });
  }
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new ConvexError({ message: "User not found", code: "NOT_FOUND" });
  }
  return user;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: UserRole[]
) {
  const user = await getCurrentUser(ctx);
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new ConvexError({ message: "Insufficient permissions", code: "FORBIDDEN" });
  }
  return user;
}

export async function requireWriteAccess(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["cto", "it_manager"]);
}
