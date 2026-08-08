import { describe, expect, it } from "vitest";
import { api } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { createConvexTest } from "../test.setup";

type Role = "cto" | "it_manager" | "business_owner" | "viewer";

async function insertUser(
  t: ReturnType<typeof createConvexTest>,
  user: { email: string; role?: Role; isManuallyAdded?: boolean },
) {
  return await t.run(async (ctx) => await ctx.db.insert("users", user));
}

function asUser(t: ReturnType<typeof createConvexTest>, userId: Id<"users">) {
  return t.withIdentity({ subject: `${userId}|test-session` });
}

describe("SEC-05 user and role hardening", () => {
  it("normalizes invitation email before lookup and storage", async () => {
    const t = createConvexTest();
    const ctoId = await insertUser(t, {
      email: "cto@example.com",
      role: "cto",
    });

    const invitedId = await asUser(t, ctoId).mutation(api.users.inviteUser, {
      name: "Invited User",
      email: "  PERSON@Example.COM ",
      role: "business_owner",
    });

    const invited = await t.run(async (ctx) => await ctx.db.get(invitedId));
    expect(invited).toMatchObject({
      email: "person@example.com",
      role: "business_owner",
      isManuallyAdded: true,
    });
  });

  it("atomically claims one normalized invitation and otherwise defaults to viewer", async () => {
    const t = createConvexTest();
    await insertUser(t, {
      email: "owner@example.com",
      role: "business_owner",
      isManuallyAdded: true,
    });
    const ownerId = await insertUser(t, { email: "owner@example.com" });
    const viewerId = await insertUser(t, { email: "viewer@example.com" });

    await asUser(t, ownerId).mutation(api.users.updateCurrentUser, {});
    await asUser(t, viewerId).mutation(api.users.updateCurrentUser, {});

    const [owner, viewer, ownerEmailRecords] = await t.run(async (ctx) => [
      await ctx.db.get(ownerId),
      await ctx.db.get(viewerId),
      await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", "owner@example.com"))
        .collect(),
    ]);
    expect(owner?.role).toBe("business_owner");
    expect(viewer?.role).toBe("viewer");
    expect(ownerEmailRecords).toHaveLength(1);
  });

  it("returns NOT_FOUND for missing role-update and removal targets", async () => {
    const t = createConvexTest();
    const ctoId = await insertUser(t, {
      email: "cto@example.com",
      role: "cto",
    });
    const deletedId = await insertUser(t, {
      email: "gone@example.com",
      role: "viewer",
    });
    await t.run(async (ctx) => await ctx.db.delete(deletedId));

    await expect(
      asUser(t, ctoId).mutation(api.users.updateUserRole, {
        userId: deletedId,
        role: "viewer",
      }),
    ).rejects.toMatchObject({ data: { code: "NOT_FOUND" } });
    await expect(
      asUser(t, ctoId).mutation(api.users.removeUser, { userId: deletedId }),
    ).rejects.toMatchObject({ data: { code: "NOT_FOUND" } });
  });

  it("blocks self-removal", async () => {
    const t = createConvexTest();
    const ctoId = await insertUser(t, {
      email: "cto@example.com",
      role: "cto",
    });

    await expect(
      asUser(t, ctoId).mutation(api.users.removeUser, { userId: ctoId }),
    ).rejects.toMatchObject({ data: { code: "FORBIDDEN" } });
  });

  it("blocks demoting the last active CTO", async () => {
    const t = createConvexTest();
    const ctoId = await insertUser(t, {
      email: "cto@example.com",
      role: "cto",
    });

    await expect(
      asUser(t, ctoId).mutation(api.users.updateUserRole, {
        userId: ctoId,
        role: "viewer",
      }),
    ).rejects.toMatchObject({ data: { code: "CONFLICT" } });
  });

  it("blocks deleting the last active CTO even when a pending CTO invokes it", async () => {
    const t = createConvexTest();
    const activeCtoId = await insertUser(t, {
      email: "active@example.com",
      role: "cto",
    });
    const pendingCtoId = await insertUser(t, {
      email: "pending@example.com",
      role: "cto",
      isManuallyAdded: true,
    });

    await expect(
      asUser(t, pendingCtoId).mutation(api.users.removeUser, {
        userId: activeCtoId,
      }),
    ).rejects.toMatchObject({ data: { code: "CONFLICT" } });
  });

  it("allows a CTO transition when another active CTO remains", async () => {
    const t = createConvexTest();
    const firstCtoId = await insertUser(t, {
      email: "first@example.com",
      role: "cto",
    });
    const secondCtoId = await insertUser(t, {
      email: "second@example.com",
      role: "cto",
    });

    await asUser(t, firstCtoId).mutation(api.users.updateUserRole, {
      userId: firstCtoId,
      role: "it_manager",
    });

    const [first, second] = await t.run(async (ctx) => [
      await ctx.db.get(firstCtoId),
      await ctx.db.get(secondCtoId),
    ]);
    expect(first?.role).toBe("it_manager");
    expect(second?.role).toBe("cto");
  });
});
