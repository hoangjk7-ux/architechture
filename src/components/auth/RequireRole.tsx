import type { ReactNode } from "react";
import { useCurrentUser } from "@/hooks/use-current-user.ts";
import type { UserRole } from "@/lib/permissions.ts";
import { Skeleton } from "@/components/ui/skeleton.tsx";

export function RequireRole({ roles, children }: { roles: readonly UserRole[]; children: ReactNode }) {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return <div className="p-6"><Skeleton className="h-8 w-48" /></div>;
  }
  if (!user?.role || !roles.includes(user.role)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">403</h1>
          <p className="mt-2 text-sm text-muted-foreground">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }
  return children;
}
