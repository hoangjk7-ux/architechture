import { useConvexAuth, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

export function useCurrentUser() {
  const { isAuthenticated, isLoading: isAuthLoading } = useConvexAuth();
  const currentUser = useQuery(api.users.getCurrentUser, isAuthenticated ? {} : "skip");
  const user = currentUser ?? null;

  return {
    user,
    isAuthenticated,
    isLoading: isAuthLoading || (isAuthenticated && currentUser === undefined),
    isCTO: user?.role === "cto",
    isITManager: user?.role === "it_manager",
    isBusinessOwner: user?.role === "business_owner",
    isViewer: user?.role === "viewer",
    canWrite: user?.role === "cto" || user?.role === "it_manager",
  };
}
