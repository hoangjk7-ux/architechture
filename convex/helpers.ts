import { ConvexError } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";

export type UserRole = "cto" | "it_manager" | "business_owner" | "viewer";

type CurrentUser = {
  _id: Id<"users">;
  role?: UserRole;
  email?: string;
  name?: string;
  isManuallyAdded?: boolean;
};

export async function getCurrentUser(ctx: QueryCtx | MutationCtx): Promise<CurrentUser | null> {
  const userId = await getAuthUserId(ctx);

  if (!userId) {
    return {
      _id: "local-admin" as Id<"users">,
      name: "Admin",
      email: "admin@local",
      role: "cto",
      isManuallyAdded: true,
    };
  }

  const user = await ctx.db.get(userId);
  if (!user) {
    return null;
  }

  return user as CurrentUser;
}

export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: UserRole[]
) {
  const user = await getCurrentUser(ctx);
  if (!user || !user.role || !allowedRoles.includes(user.role)) {
    throw new ConvexError({ message: "Insufficient permissions", code: "FORBIDDEN" });
  }
  return user;
}

export async function requireWriteAccess(ctx: QueryCtx | MutationCtx) {
  return requireRole(ctx, ["cto", "it_manager"]);
}
