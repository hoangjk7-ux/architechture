import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LanguageProvider, useLanguage } from "./language.tsx";

function TestComponent() {
  const { language, t } = useLanguage();

  return (
    <div>
      <span>{language}</span>
      <span>{t("auth.signIn")}</span>
    </div>
  );
}

describe("LanguageProvider", () => {
  it("defaults to Vietnamese and provides Vietnamese text", () => {
    const html = renderToStaticMarkup(
      <LanguageProvider>
        <TestComponent />
      </LanguageProvider>
    );

    expect(html).toContain("vi");
    expect(html).toContain("Đăng nhập");
  });
});
