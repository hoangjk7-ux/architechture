import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthUserIdMock } = vi.hoisted(() => ({
  getAuthUserIdMock: vi.fn(),
}));

vi.mock("@convex-dev/auth/server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@convex-dev/auth/server")>();
  return { ...actual, getAuthUserId: getAuthUserIdMock };
});

import {
  getCurrentUser,
  requireReadAccess,
  requireWriteAccess,
} from "../helpers.ts";

function contextWithUser(user: unknown = null) {
  return {
    db: {
      get: vi.fn().mockResolvedValue(user),
    },
  } as never;
}

describe("SEC-01 identity contract", () => {
  beforeEach(() => {
    getAuthUserIdMock.mockReset();
  });

  it("does not synthesize an identity for an anonymous request", async () => {
    getAuthUserIdMock.mockResolvedValue(null);

    await expect(getCurrentUser(contextWithUser())).resolves.toBeNull();
  });

  it("denies an anonymous request at the shared write guard", async () => {
    getAuthUserIdMock.mockResolvedValue(null);

    await expect(requireWriteAccess(contextWithUser())).rejects.toMatchObject({
      data: { code: "UNAUTHENTICATED" },
    });
  });

  it("loads role authority from the authenticated users document", async () => {
    const user = {
      _id: "user-1",
      email: "manager@example.com",
      role: "it_manager",
    };
    getAuthUserIdMock.mockResolvedValue(user._id);
    const ctx = contextWithUser(user);

    await expect(getCurrentUser(ctx)).resolves.toEqual(user);
    await expect(requireWriteAccess(ctx)).resolves.toEqual(user);
  });

  it("denies protected domain reads until an authenticated user has a role", async () => {
    const user = { _id: "user-pending", email: "pending@example.com" };
    getAuthUserIdMock.mockResolvedValue(user._id);

    await expect(
      requireReadAccess(contextWithUser(user)),
    ).rejects.toMatchObject({
      data: { code: "FORBIDDEN" },
    });
  });
});
