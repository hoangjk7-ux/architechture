import { useState, useEffect, useRef } from "react";
import { Loader2, LogIn, Languages } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useSimpleAuth } from "@/components/providers/simple-auth.tsx";
import { useLanguage } from "@/components/providers/language.tsx";
import { cn } from "@/lib/utils.ts";
import { resolveGoogleClientId } from "@/lib/google-auth.ts";

export interface SignInButtonProps extends React.ComponentProps<"form"> {
  className?: string;
  signInText?: string;
}

export function SignInButton({ className, signInText, ...props }: SignInButtonProps) {
  const { signIn, isLoading, error } = useSimpleAuth();
  const { language, setLanguage, t } = useLanguage();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456789");
  const [formError, setFormError] = useState<string | null>(null);

  const resolvedSignInText = signInText ?? t("auth.signIn");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await signIn(username, password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : language === "vi" ? "Đăng nhập thất bại" : "Sign-in failed");
    }
  };

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
      win.google.accounts.id.initialize({ client_id: googleClientId, callback: handleCredentialResponse });
      if (googleButtonRef.current) {
        win.google.accounts.id.renderButton(googleButtonRef.current, { theme: "outline", size: "large" });
      }
    } catch (e) {
      // ignore
    }
  }, [googleClientId]);

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-sm space-y-4", className)} {...props}>
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

      <div className="space-y-2">
        <Label htmlFor="username">{t("auth.username")}</Label>
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          placeholder="admin"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          placeholder="123456789"
        />
      </div>

      {(error || formError) && (
        <p className="text-sm text-destructive">{formError ?? error}</p>
      )}

      <p className="text-sm text-muted-foreground">{t("auth.adminHint")}</p>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        {resolvedSignInText}
      </Button>

      <div className="flex items-center gap-2">
        <span className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">{t("auth.or")}</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      {googleClientId ? (
        <div ref={googleButtonRef} />
      ) : (
        <div className="space-y-2">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              const base = import.meta.env.VITE_CONVEX_URL ?? "";
              window.location.href = `${base.replace(/\/$/, "")}/api/auth/signin/google`;
            }}
          >
            <img src="/google-logo.svg" alt="Google" className="h-4 w-4 mr-2" />
            {t("auth.google")}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Google login needs a configured client ID in the environment.
          </p>
        </div>
      )}
    </form>
  );
}
