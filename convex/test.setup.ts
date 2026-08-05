/// <reference types="vite/client" />

import { convexTest } from "convex-test";
import schema from "./schema";

const modules = import.meta.glob("./**/!(*.*.*)*.*s");

export function createConvexTest() {
  return convexTest(schema, modules);
}

export async function createAuthorizedConvexTest(
  role: "cto" | "it_manager" | "business_owner" | "viewer" = "cto",
) {
  const t = createConvexTest();
  const userId = await t.run(async (ctx) =>
    ctx.db.insert("users", {
      email: `${role}@example.test`,
      name: `Test ${role}`,
      role,
      isManuallyAdded: false,
    }),
  );

  return t.withIdentity({
    subject: userId,
    issuer: "https://test.local",
    tokenIdentifier: `test|${userId}`,
  });
}
