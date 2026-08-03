import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Language = "vi" | "en";

type TranslationKey =
  | "auth.signIn"
  | "auth.signOut"
  | "auth.username"
  | "auth.password"
  | "auth.adminHint"
  | "auth.google"
  | "auth.or"
  | "nav.dashboard"
  | "nav.systems"
  | "nav.vendors"
  | "nav.architecture"
  | "nav.integrations"
  | "nav.roadmap"
  | "nav.users"
  | "nav.settings"
  | "app.title"
  | "app.subtitle";

type TranslationMap = Record<TranslationKey, Record<Language, string>>;

const translations: TranslationMap = {
  "auth.signIn": { vi: "Đăng nhập", en: "Sign in" },
  "auth.signOut": { vi: "Đăng xuất", en: "Sign out" },
  "auth.username": { vi: "Tài khoản", en: "Username" },
  "auth.password": { vi: "Mật khẩu", en: "Password" },
  "auth.adminHint": { vi: "Sử dụng tài khoản admin / 123456789", en: "Use the admin account / 123456789" },
  "auth.google": { vi: "Đăng nhập bằng Google", en: "Sign in with Google" },
  "auth.or": { vi: "hoặc", en: "or" },
  "nav.dashboard": { vi: "Bảng điều khiển", en: "Dashboard" },
  "nav.systems": { vi: "Kho hệ thống", en: "System inventory" },
  "nav.vendors": { vi: "Nhà cung cấp", en: "Vendors" },
  "nav.architecture": { vi: "Bản đồ kiến trúc", en: "Architecture map" },
  "nav.integrations": { vi: "Tích hợp", en: "Integrations" },
  "nav.roadmap": { vi: "Lộ trình", en: "Roadmap" },
  "nav.users": { vi: "Người dùng & vai trò", en: "Users & roles" },
  "nav.settings": { vi: "Cấu hình", en: "Settings" },
  "app.title": { vi: "Nền tảng TechGov", en: "TechGov Platform" },
  "app.subtitle": { vi: "Quản trị công nghệ cho CTO trường quốc tế", en: "Technology governance for the international school CTO" },
};

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

function getInitialLanguage(): Language {
  if (typeof window === "undefined") return "vi";
  const stored = window.localStorage.getItem("techgov-language");
  return stored === "en" ? "en" : "vi";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  const value = useMemo(() => {
    const updateLanguage = (nextLanguage: Language) => {
      setLanguage(nextLanguage);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("techgov-language", nextLanguage);
      }
    };

    return {
      language,
      setLanguage: updateLanguage,
      t: (key: TranslationKey) => translations[key][language],
    };
  }, [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }

  return context;
}
