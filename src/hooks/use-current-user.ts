import type { Id } from "@/convex/_generated/dataModel.d.ts";
import { useSimpleAuth } from "@/components/providers/simple-auth.tsx";

export function useCurrentUser() {
  const { user, isAuthenticated } = useSimpleAuth();

  const currentUser = isAuthenticated && user
    ? {
        _id: "local-admin" as Id<"users">,
        name: user.name ?? user.username,
        email: user.email ?? `${user.username}@local`,
        role: user.role === "admin" ? "cto" : user.role,
      }
    : null;

  return {
    user: currentUser,
    isCTO: currentUser?.role === "cto",
    isITManager: currentUser?.role === "it_manager",
    isBusinessOwner: currentUser?.role === "business_owner",
    isViewer: currentUser?.role === "viewer",
    canWrite: currentUser?.role === "cto" || currentUser?.role === "it_manager",
  };
}
