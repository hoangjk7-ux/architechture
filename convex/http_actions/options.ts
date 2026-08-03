import { httpAction } from "../_generated/server";

declare const process: {
  env: {
    CONVEX_ALLOWED_ORIGIN?: string;
    CONVEX_SITE_URL?: string;
  };
};

function getAllowedOrigin(request: Request) {
  const originHeader = request.headers.get("origin") ?? undefined;
  return originHeader || process.env.CONVEX_ALLOWED_ORIGIN || process.env.CONVEX_SITE_URL;
}

export const optionsAuth = httpAction(async (_ctx: any, request: Request) => {
  const allowedOrigin = getAllowedOrigin(request);
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Credentials": "true",
  };

  if (allowedOrigin) {
    headers["Access-Control-Allow-Origin"] = allowedOrigin;
  }

  return new Response(null, {
    status: 204,
    headers,
  });
});
