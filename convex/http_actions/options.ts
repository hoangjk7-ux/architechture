import { httpAction } from "../_generated/server";

export const optionsAuth = httpAction(async (_ctx: any, request: Request) => {
  const allowedOrigin = process.env.CONVEX_ALLOWED_ORIGIN || process.env.VITE_CONVEX_URL || process.env.CONVEX_SITE_URL || "*";
  const originHeader = request.headers.get("Origin") ?? undefined;
  const accessOrigin = originHeader ?? allowedOrigin;

  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": accessOrigin,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    },
  });
});
