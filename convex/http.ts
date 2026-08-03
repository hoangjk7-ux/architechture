import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { googleAuth } from "./http_actions/google";

const http = httpRouter();
auth.addHttpRoutes(http);

// CORS preflight support for the Google auth endpoint
http.route({
	method: "OPTIONS",
	path: "/api/auth/google",
	handler: async (_ctx: any, request: Request) => {
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
	},
});

http.route({ method: "POST", path: "/api/auth/google", handler: googleAuth });

export default http;
