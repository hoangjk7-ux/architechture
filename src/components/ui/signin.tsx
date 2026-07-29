import { useState } from "react";
import { Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { useSimpleAuth } from "@/components/providers/simple-auth.tsx";
import { cn } from "@/lib/utils.ts";

export interface SignInButtonProps extends React.ComponentProps<"form"> {
  className?: string;
  signInText?: string;
}

export function SignInButton({ className, signInText = "Đăng nhập", ...props }: SignInButtonProps) {
  const { signIn, isLoading, error } = useSimpleAuth();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("123456789");
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    try {
      await signIn(username, password);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Đăng nhập thất bại");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("w-full max-w-sm space-y-4", className)} {...props}>
      <div className="space-y-2">
        <Label htmlFor="username">Tài khoản</Label>
        <Input
          id="username"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          placeholder="admin"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mật khẩu</Label>
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

      <p className="text-sm text-muted-foreground">Sử dụng tài khoản admin / 123456789</p>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
        {signInText}
      </Button>

      <div className="flex items-center gap-2">
        <span className="flex-1 h-px bg-border" />
        <span className="text-xs text-muted-foreground">or</span>
        <span className="flex-1 h-px bg-border" />
      </div>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => {
          const base = import.meta.env.VITE_CONVEX_URL ?? "";
          // Redirect to Convex auth Google sign-in endpoint
          window.location.href = `${base.replace(/\/$/, "")}/api/auth/signin/google`;
        }}
      >
        <img src="/google-logo.svg" alt="Google" className="h-4 w-4 mr-2" />
        Đăng nhập bằng Google
      </Button>
    </form>
  );
}
