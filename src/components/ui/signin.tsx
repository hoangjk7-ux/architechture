import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "@/components/ui/button.tsx";
import { useLanguage } from "@/components/providers/language.tsx";
import { cn } from "@/lib/utils.ts";

export interface SignInButtonProps extends React.ComponentProps<"div"> {
  className?: string;
  signInText?: string;
}

export function SignInButton({
  className,
  signInText,
  ...props
}: SignInButtonProps) {
  const { signIn } = useAuthActions();
  const { language, t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const beginGoogleSignIn = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("google", { redirectTo: "/auth/callback" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Sign-in failed");
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("w-full space-y-4", className)} {...props}>
      <div className="space-y-5 rounded-2xl border border-border/70 bg-card/80 p-6 shadow-xl shadow-black/20 backdrop-blur-sm">
        <div className="space-y-1 text-center">
          <p className="text-base font-semibold text-foreground">
            {signInText ?? t("auth.signIn")}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === "vi"
              ? "Đăng nhập bằng tài khoản Google của bạn"
              : "Sign in with your Google account"}
          </p>
        </div>
        {error && (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={isSubmitting}
          onClick={beginGoogleSignIn}
        >
          {isSubmitting
            ? "…"
            : language === "vi"
              ? "Tiếp tục với Google"
              : "Continue with Google"}
        </Button>
      </div>
    </div>
  );
}
