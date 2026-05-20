import { HerculesAuthProvider } from "@usehercules/auth/react";
import { ConvexProvider } from "./convex.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <HerculesAuthProvider
      authority={import.meta.env.VITE_HERCULES_OIDC_AUTHORITY as string}
      client_id={import.meta.env.VITE_HERCULES_OIDC_CLIENT_ID as string}
    >
      <ConvexProvider>
        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>
              <Toaster />
              {children}
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </ConvexProvider>
    </HerculesAuthProvider>
  );
}
