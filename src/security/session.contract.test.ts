import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function repositoryFile(relativePath: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../${relativePath}`, import.meta.url)),
    "utf8",
  );
}

describe("SEC-01 session architecture contract", () => {
  it("uses a Convex Auth Google provider instead of treating JSON as a session", () => {
    const authSource = repositoryFile("convex/auth.ts");
    const httpSource = repositoryFile("convex/http.ts");

    expect(authSource).toMatch(/@auth\/core\/providers\/google/);
    expect(authSource).toMatch(/providers\s*:\s*\[[^\]]*Google/s);
    expect(httpSource).not.toMatch(/api\/auth\/google|googleAuth/);
  });

  it("does not persist authoritative authentication or role in localStorage", () => {
    const authClientSources = [
      repositoryFile("src/components/providers/default.tsx"),
      repositoryFile("src/components/ui/signin.tsx"),
      repositoryFile("src/hooks/use-current-user.ts"),
      repositoryFile("src/components/layout/AppLayout.tsx"),
    ].join("\n");

    expect(authClientSources).not.toMatch(/localStorage|SimpleAuth/);
    expect(authClientSources).not.toMatch(/role:\s*"admin"/);
  });
});
