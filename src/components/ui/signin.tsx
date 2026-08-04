import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { useSimpleAuth } from "@/components/providers/simple-auth.tsx";
import { useLanguage } from "@/components/providers/language.tsx";
import { cn } from "@/lib/utils.ts";
import { resolveGoogleClientId } from "@/lib/google-auth.ts";

function getConvexSiteUrl() {
  // Convex HTTP Actions are served from the `.convex.site` domain, not
  // `.convex.cloud` (which is the client/query API domain).
  const explicit = import.meta.env.VITE_CONVEX_SITE_URL?.replace(/\/$/, "");
  if (explicit && explicit.includes(".convex.site")) return explicit;

  const convexUrl = import.meta.env.VITE_CONVEX_URL?.replace(/\/$/, "");
  if (convexUrl?.includes(".convex.cloud")) {
    return convexUrl.replace(".convex.cloud", ".convex.site");
  }
  return convexUrl;
}

function buildAuthUrlCandidates(path: string) {
  const candidates: string[] = [];

  const convexSiteUrl = getConvexSiteUrl();

  // Only use the primary Convex deployment URL for auth requests.
  if (convexSiteUrl) {
    candidates.push(`${convexSiteUrl}${path}`);
  } else {
    // If no external Convex URL is configured, use same-origin route.
    candidates.push(path);
  }

  return candidates;
}

function chooseAuthUrlForNavigation(path: string) {
  const candidates = buildAuthUrlCandidates(path);
  if (typeof window === "undefined") return candidates[0];

  for (const c of candidates) {
    if (c.startsWith("/")) return c; // relative paths are same-origin
    try {
      const u = new URL(c);
      if (u.origin === window.location.origin) return c;
    } catch {
      // ignore
    }
  }

  return candidates[0];
}

export interface SignInButtonProps extends React.ComponentProps<"div"> {
  className?: string;
  signInText?: string;
}

export function SignInButton({ className, signInText, ...props }: SignInButtonProps) {
  const { isLoading, login, signIn } = useSimpleAuth();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resolvedSignInText = signInText ?? t("auth.signIn");

  const googleClientId = resolveGoogleClientId(import.meta.env as Record<string, string | undefined>);
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

          const nextUser = {
            username: (user.email || "").split("@")[0],
            role: user.role,
            name: user.name ?? user.email,
            email: user.email,
          };
          console.log("Google login succeeded, setting authenticated user", nextUser);
          login(nextUser);
          navigate("/", { replace: true });
          return;
        } catch (err) {
          console.error("Auth attempt failed for", candidate, err);
          lastError = err;
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

  const handlePasswordSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn(username, password);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Invalid credentials");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          {language === "vi" ? "Đăng nhập bằng tài khoản Google của bạn hoặc tài khoản local" : "Sign in with your Google account or local account"}
        </p>
      </div>

      <div className="rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm">
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="username">
              {t("auth.username")}
            </label>
            <Input
              id="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder={language === "vi" ? "Tên đăng nhập" : "Enter username"}
              className="mt-2"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="password">
              {t("auth.password")}
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={language === "vi" ? "Mật khẩu" : "Enter password"}
              className="mt-2"
            />
          </div>

          {error && <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          <Button
            type="button"
            className="w-full"
            onClick={handlePasswordSignIn}
            disabled={isSubmitting || !username || !password}
          >
            {isSubmitting ? (language === "vi" ? "Đang đăng nhập..." : "Signing in...") : resolvedSignInText}
          </Button>
        </div>
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
              const url = chooseAuthUrlForNavigation("/api/auth/signin/google");
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

