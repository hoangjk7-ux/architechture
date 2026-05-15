import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api.js";

export function useCurrentUser() {
  const user = useQuery(api.users.getCurrentUser);
  return {
    user,
    isCTO: user?.role === "cto",
    isITManager: user?.role === "it_manager",
    isBusinessOwner: user?.role === "business_owner",
    isViewer: user?.role === "viewer",
    canWrite: user?.role === "cto" || user?.role === "it_manager",
  };
}
