import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api.js";
import { Spinner } from "@/components/ui/spinner.tsx";
import { Button } from "@/components/ui/button.tsx";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const updateCurrentUser = useMutation(api.users.updateCurrentUser);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      setError("Authentication did not complete.");
      return;
    }

    let cancelled = false;
    void updateCurrentUser()
      .then(() => {
        if (!cancelled) navigate("/", { replace: true });
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to provision user access.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, navigate, updateCurrentUser]);

  if (error) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-6 px-4 text-center">
        <div>
          <p className="font-medium text-destructive">Something went wrong</p>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => navigate("/", { replace: true })}>
          Return home
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-svh flex-col items-center justify-center gap-4">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Completing sign-in…</p>
    </div>
  );
}
