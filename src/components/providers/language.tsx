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
  | "app.subtitle"
  | "detail.status"
  | "detail.criticality"
  | "detail.riskLevel"
  | "detail.hosting"
  | "detail.owner"
  | "detail.technology"
  | "detail.database"
  | "detail.sla"
  | "detail.license"
  | "detail.contractEnd"
  | "detail.contractEndDate"
  | "detail.departments"
  | "detail.campuses"
  | "detail.architectureScore"
  | "detail.technicalDebt"
  | "detail.annualCost"
  | "detail.modules"
  | "detail.active"
  | "detail.upcoming"
  | "detail.deprecated"
  | "detail.more"
  | "detail.overview"
  | "detail.integrations"
  | "detail.outbound"
  | "detail.inbound"
  | "detail.noIntegrations"
  | "detail.nonCompliant"
  | "detail.lastSync"
  | "detail.unknown"
  | "detail.error"
  | "toast.moduleAdded"
  | "toast.moduleUpdated"
  | "toast.moduleDeleted"
  | "vendor.contractExpiringSoon"
  | "vendor.contractRenewalNeeded"
  | "vendor.alreadyExpired"
  | "vendor.contact"
  | "vendor.linkedSystems"
  | "vendor.noLinkedSystems"
  | "modal.addModule"
  | "modal.editModule";

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
  "detail.status": { vi: "Trạng thái", en: "Status" },
  "detail.criticality": { vi: "Mức độ trọng yếu", en: "Criticality" },
  "detail.riskLevel": { vi: "Mức rủi ro", en: "Risk Level" },
  "detail.hosting": { vi: "Lưu trữ", en: "Hosting" },
  "detail.owner": { vi: "Chủ sở hữu", en: "Owner" },
  "detail.technology": { vi: "Công nghệ", en: "Technology" },
  "detail.database": { vi: "Cơ sở dữ liệu", en: "Database" },
  "detail.sla": { vi: "SLA", en: "SLA" },
  "detail.license": { vi: "Giấy phép", en: "License" },
  "detail.contractEnd": { vi: "Hết hạn HĐ", en: "Contract End" },
  "detail.contractEndDate": { vi: "Ngày hết hạn hợp đồng", en: "Contract End Date" },
  "detail.departments": { vi: "Phòng ban", en: "Departments" },
  "detail.campuses": { vi: "Cơ sở", en: "Campuses" },
  "detail.architectureScore": { vi: "Điểm kiến trúc", en: "Architecture Score" },
  "detail.technicalDebt": { vi: "Nợ kỹ thuật", en: "Technical Debt" },
  "detail.annualCost": { vi: "Chi phí/năm", en: "Annual Cost" },
  "detail.modules": { vi: "Module", en: "Modules" },
  "detail.active": { vi: "đang dùng", en: "active" },
  "detail.upcoming": { vi: "sắp triển khai", en: "upcoming" },
  "detail.deprecated": { vi: "ngừng dùng", en: "deprecated" },
  "detail.more": { vi: "thêm", en: "more" },
  "detail.overview": { vi: "Tổng quan", en: "Overview" },
  "detail.integrations": { vi: "Tích hợp", en: "Integrations" },
  "detail.outbound": { vi: "Đi ra", en: "Outbound" },
  "detail.inbound": { vi: "Đi vào", en: "Inbound" },
  "detail.noIntegrations": { vi: "Chưa ghi nhận tích hợp nào", en: "No integrations recorded" },
  "detail.nonCompliant": { vi: "Không tuân thủ", en: "Non-compliant" },
  "detail.lastSync": { vi: "Đồng bộ lần cuối", en: "Last sync" },
  "detail.unknown": { vi: "Không xác định", en: "Unknown" },
  "detail.error": { vi: "Lỗi", en: "Err" },
  "toast.moduleAdded": { vi: "Đã thêm module", en: "Module added" },
  "toast.moduleUpdated": { vi: "Đã cập nhật module", en: "Module updated" },
  "toast.moduleDeleted": { vi: "Đã xoá module", en: "Module deleted" },
  "vendor.contractExpiringSoon": { vi: "Hợp đồng sắp hết hạn!", en: "Contract expiring soon!" },
  "vendor.contractRenewalNeeded": { vi: "Cần gia hạn hợp đồng", en: "Contract renewal needed" },
  "vendor.alreadyExpired": { vi: "Đã hết hạn", en: "Already expired" },
  "vendor.contact": { vi: "Liên hệ", en: "Contact" },
  "vendor.linkedSystems": { vi: "Hệ thống liên kết", en: "Linked Systems" },
  "vendor.noLinkedSystems": { vi: "Chưa có hệ thống nào liên kết với nhà cung cấp này.", en: "No systems linked to this vendor." },
  "modal.addModule": { vi: "Thêm module", en: "Add Module" },
  "modal.editModule": { vi: "Sửa module", en: "Edit Module" },
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
