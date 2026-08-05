import { ConvexProvider } from "./convex.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { ThemeProvider } from "./theme.tsx";
import { LanguageProvider } from "./language.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";
import { CurrentUserProvider } from "@/hooks/use-current-user.ts";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProvider>
      <CurrentUserProvider>
        <QueryClientProvider>
          <TooltipProvider>
            <ThemeProvider>
              <LanguageProvider>
                <Toaster />
                {children}
              </LanguageProvider>
            </ThemeProvider>
          </TooltipProvider>
        </QueryClientProvider>
      </CurrentUserProvider>
    </ConvexProvider>
  );
}
