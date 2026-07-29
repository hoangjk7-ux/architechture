import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const authWithGoogle = mutation({
  args: { idToken: v.string() },
  handler: async (ctx, args) => {
    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${args.idToken}`);
    if (!res.ok) throw new Error("Invalid token");
    const data = await res.json();
    const email = data.email as string | undefined;
    const emailVerified = data.email_verified === "true" || data.email_verified === true;
    if (!email || !emailVerified) {
      throw new Error("Email not verified");
    }

    const users = await ctx.db.query("users").withIndex("email", (q) => q.eq("email", email)).collect();
    if (users.length > 0) {
      const user = users[0];
      await ctx.db.patch(user._id, { name: data.name, image: data.picture });
      return user._id;
    }

    const role = email === "hoangjk7@gmail.com" ? "cto" : "viewer";
    const id = await ctx.db.insert("users", { email, name: data.name, image: data.picture, role, isManuallyAdded: false });
    return id;
  },
});
