import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useSimpleAuth } from "@/components/providers/simple-auth.tsx";
import { useLanguage } from "@/components/providers/language.tsx";
import { cn } from "@/lib/utils.ts";
import { resolveGoogleClientId } from "@/lib/google-auth.ts";

function buildAuthUrlCandidates(path: string) {
  const candidates: string[] = [];

  const convexUrl = import.meta.env.VITE_CONVEX_URL?.replace(/\/$/, "");
  const convexSite = import.meta.env.VITE_CONVEX_SITE_URL?.replace(/\/$/, "");

  // Prefer explicit VITE_CONVEX_URL when present
  if (convexUrl) candidates.push(`${convexUrl}${path}`);
  // Fallback to a site URL if provided (useful for Convex hosted endpoint)
  if (convexSite) candidates.push(`${convexSite}${path}`);

  // Always include a relative path as last resort (same origin)
  candidates.push(path);

  return candidates;
}

export interface SignInButtonProps extends React.ComponentProps<"div"> {
  className?: string;
  signInText?: string;
}

export function SignInButton({ className, signInText, ...props }: SignInButtonProps) {
  const { isLoading, login } = useSimpleAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const resolvedSignInText = signInText ?? t("auth.signIn");

  const googleClientId = resolveGoogleClientId(import.meta.env as Record<string, string | undefined>);
  const AUTH_STORAGE_KEY = "techgov-simple-auth";
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!googleClientId) return;
    const win = window as any;
    if (!win.google || !win.google.accounts) return;

    async function handleCredentialResponse(response: any) {
      const idToken = response.credential;
      if (!idToken) {
        console.error("Google login callback did not include an idToken", response);
        return;
      }

      const candidates = buildAuthUrlCandidates("/api/auth/google");
      console.log("Google login received idToken, trying auth endpoints", candidates);

      let lastError: any = null;
      for (const candidate of candidates) {
        try {
          console.log("Attempting auth POST to", candidate);
          const r = await fetch(candidate, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
          });

          const text = await r.text();
          let body: any = null;
          if (text) {
            try {
              body = JSON.parse(text);
            } catch (parseError) {
              throw new Error(`Invalid JSON response from auth endpoint: ${text}`);
            }
          }

          if (!r.ok) {
            // If not found, try next candidate; otherwise surface error
            const err = new Error(body?.error || `Auth request failed with status ${r.status}: ${r.statusText} ${text}`);
            if (r.status === 404) {
              console.warn("Auth endpoint returned 404, trying next candidate", candidate);
              lastError = err;
              continue;
            }
            throw err;
          }

          if (!body || body.error) {
            throw new Error(body?.error || `Unexpected auth response (status ${r.status})`);
          }

          const user = body.user;
          if (!user || !user.email || !user.role) {
            throw new Error(`Invalid user data returned from auth endpoint: ${JSON.stringify(body)}`);
          }

          const nextUser = { username: (user.email || "").split("@")[0], role: user.role };
          console.log("Google login succeeded, setting authenticated user", nextUser);
          login(nextUser);
          navigate("/", { replace: true });
          return;
        } catch (err) {
          console.error("Auth attempt failed for", candidate, err);
          lastError = err;
          // try next candidate
        }
      }

      console.error("Google login failed — all auth endpoints exhausted", lastError);
    }

    try {
      if (googleButtonRef.current) {
        googleButtonRef.current.innerHTML = "";
      }
      win.google.accounts.id.initialize({ client_id: googleClientId, callback: handleCredentialResponse });
      if (googleButtonRef.current) {
        win.google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: "signin_with",
        });
      }
    } catch (e) {
      console.error("Failed to initialize Google login button", e);
    }
  }, [googleClientId, login, navigate]);

  return (
    <div className={cn("w-full max-w-sm space-y-4", className)} {...props}>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
          className="gap-2"
        >
          <Languages className="h-4 w-4" />
          {language === "vi" ? "English" : "Tiếng Việt"}
        </Button>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-center">
        <p className="text-sm font-medium text-foreground">{resolvedSignInText}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {language === "vi" ? "Đăng nhập bằng tài khoản Google của bạn" : "Sign in with your Google account"}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      {googleClientId ? (
        <div className="rounded-xl border border-border/70 bg-background/80 p-2 shadow-sm">
          <div ref={googleButtonRef} className="w-full min-h-[44px] flex justify-center" />
        </div>
      ) : (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full h-11 rounded-xl border-border/70 bg-background/80 shadow-sm hover:bg-accent/70"
            onClick={() => {
              const url = resolveConvexApiUrl("/api/auth/signin/google");
              window.location.href = url;
            }}
          >
            <img src="/google-logo.svg" alt="Google" className="mr-2 h-4 w-4" />
            {t("auth.google")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Google login needs a configured client ID in the environment.
          </p>
        </div>
      )}
    </div>
  );
}
