import { ConvexProvider } from "./convex.tsx";
import { QueryClientProvider } from "./query-client.tsx";
import { SimpleAuthProvider } from "./simple-auth.tsx";
import { ThemeProvider } from "./theme.tsx";
import { LanguageProvider } from "./language.tsx";
import { Toaster } from "../ui/sonner.tsx";
import { TooltipProvider } from "../ui/tooltip.tsx";

export function DefaultProviders({ children }: { children: React.ReactNode }) {
  return (
    <SimpleAuthProvider>
      <ConvexProvider>
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
      </ConvexProvider>
    </SimpleAuthProvider>
  );
}
