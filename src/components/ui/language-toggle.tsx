import { Languages } from "lucide-react";
import { useLanguage } from "@/components/providers/language.tsx";
import { cn } from "@/lib/utils.ts";

const LANGS = ["vi", "en"] as const;

export function LanguageToggle({
  className,
  iconOnly = false,
}: {
  className?: string;
  iconOnly?: boolean;
}) {
  const { language, setLanguage } = useLanguage();

  if (iconOnly) {
    return (
      <button
        type="button"
        onClick={() => setLanguage(language === "vi" ? "en" : "vi")}
        aria-label="Toggle language"
        className={cn(
          "flex items-center justify-center rounded-full border border-border/70 bg-muted/40 p-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/70 cursor-pointer",
          className,
        )}
      >
        <Languages className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-border/70 bg-muted/40 p-0.5",
        className,
      )}
    >
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          onClick={() => setLanguage(lang)}
          aria-pressed={language === lang}
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors cursor-pointer",
            language === lang
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {lang}
        </button>
      ))}
    </div>
  );
}
