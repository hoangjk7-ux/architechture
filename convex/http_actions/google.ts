import { httpAction } from "../_generated/server";

export const googleAuth = httpAction(async (ctx: any, request: Request) => {
    try {
      const body = await request.json();
      const idToken = body.idToken as string | undefined;
      if (!idToken) return new Response(JSON.stringify({ error: "Missing idToken" }), { status: 400 });

      const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!res.ok) return new Response(JSON.stringify({ error: "Invalid token" }), { status: 400 });
      const data = await res.json();
      const email = data.email as string | undefined;
      const emailVerified = data.email_verified === "true" || data.email_verified === true;
      if (!email || !emailVerified) return new Response(JSON.stringify({ error: "Email not verified" }), { status: 400 });

      const users = await ctx.db.query("users").withIndex("email", (q: any) => q.eq("email", email)).collect();
      if (users.length > 0) {
        const user = users[0];
        await ctx.db.patch(user._id, { name: data.name, image: data.picture });
        return new Response(JSON.stringify({ user: { _id: user._id, email: user.email, role: user.role, name: data.name, image: data.picture } }), { status: 200 });
      }

      const role = email === "hoangjk7@gmail.com" ? "cto" : "viewer";
      const id = await ctx.db.insert("users", { email, name: data.name, image: data.picture, role, isManuallyAdded: false });
      return new Response(JSON.stringify({ user: { _id: id, email, role, name: data.name, image: data.picture } }), { status: 200 });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500 });
    }
  });
