import { httpAction } from "../_generated/server";

function jsonResponse(obj: any, status = 200) {
  const allowedOrigin = process.env.CONVEX_ALLOWED_ORIGIN || process.env.VITE_CONVEX_URL || process.env.CONVEX_SITE_URL || "*";
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": allowedOrigin,
      "Access-Control-Allow-Credentials": "true",
    },
  });
}

export const googleAuth = httpAction(async (ctx: any, request: Request) => {
  try {
    const body = await request.json();
    const idToken = body.idToken as string | undefined;
    if (!idToken) return jsonResponse({ error: "Missing idToken" }, 400);

    const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!res.ok) return jsonResponse({ error: "Invalid token" }, 400);
    const data = await res.json();
    const email = data.email as string | undefined;
    const emailVerified = data.email_verified === "true" || data.email_verified === true;
    if (!email || !emailVerified) return jsonResponse({ error: "Email not verified" }, 400);

    const users = await ctx.db.query("users").withIndex("email", (q: any) => q.eq("email", email)).collect();
    if (users.length > 0) {
      const user = users[0];
      await ctx.db.patch(user._id, { name: data.name, image: data.picture });
      return jsonResponse({ user: { _id: user._id, email: user.email, role: user.role, name: data.name, image: data.picture } }, 200);
    }

    const role = email === "hoangjk7@gmail.com" ? "cto" : "viewer";
    const id = await ctx.db.insert("users", { email, name: data.name, image: data.picture, role, isManuallyAdded: false });
    return jsonResponse({ user: { _id: id, email, role, name: data.name, image: data.picture } }, 200);
  } catch (e: any) {
    return jsonResponse({ error: String(e?.message ?? e) }, 500);
  }
});
