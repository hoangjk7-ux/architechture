import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { domainError, normalizeEmail, optionalText } from "./domain/common";

// Deployment-only operation. Invoke explicitly with the intended deployment and
// operator-supplied email; it is intentionally not reachable from browser clients.
export const bootstrapCto = internalMutation({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const users = await ctx.db.query("users").collect();
    const existing = users.find((user) => user.email?.trim().toLowerCase() === email);

    if (existing?.role === "cto") return existing._id;

    const activeCto = users.find((user) => user.role === "cto" && !user.isManuallyAdded);
    if (activeCto) {
      domainError("CONFLICT", "An active CTO already exists; use audited role administration");
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        name: optionalText(args.name) ?? existing.name,
        role: "cto",
        isManuallyAdded: existing.isManuallyAdded ?? true,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      email,
      name: optionalText(args.name),
      role: "cto",
      isManuallyAdded: true,
    });
  },
});
