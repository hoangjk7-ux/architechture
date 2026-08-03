import { useEffect, useRef } from "react";
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { useSimpleAuth } from "@/components/providers/simple-auth.tsx";
import { useLanguage } from "@/components/providers/language.tsx";
import { cn } from "@/lib/utils.ts";
import { resolveGoogleClientId } from "@/lib/google-auth.ts";

export interface SignInButtonProps extends React.ComponentProps<"div"> {
  className?: string;
  signInText?: string;
}

export function SignInButton({ className, signInText, ...props }: SignInButtonProps) {
  const { isLoading } = useSimpleAuth();
  const { language, setLanguage, t } = useLanguage();

  const resolvedSignInText = signInText ?? t("auth.signIn");

  const googleClientId = resolveGoogleClientId(import.meta.env as Record<string, string | undefined>);
  const AUTH_STORAGE_KEY = "techgov-simple-auth";
  const googleButtonRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!googleClientId) return;
    const win = window as any;
    if (!win.google || !win.google.accounts) return;

    function handleCredentialResponse(response: any) {
      const idToken = response.credential;
      // Send idToken to Convex HTTP action to upsert/verify user
      const base = import.meta.env.VITE_CONVEX_URL ?? "";
      fetch(`${base.replace(/\/$/, "")}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data?.error) throw new Error(data.error);
          const user = data.user;
          const nextUser = { username: (user.email || "").split("@")[0], role: user.role };
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: nextUser }));
          window.location.href = "/";
        })
        .catch(() => {
          // ignore
        });
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
      // ignore
    }
  }, [googleClientId]);

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
              const base = import.meta.env.VITE_CONVEX_URL ?? "";
              window.location.href = `${base.replace(/\/$/, "")}/api/auth/signin/google`;
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
