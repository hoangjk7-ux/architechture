import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { googleAuth } from "./http_actions/google";

const http = httpRouter();
auth.addHttpRoutes(http);

// CORS preflight support for the Google auth endpoint
http.route({
	method: "OPTIONS",
	path: "/api/auth/google",
	handler: async () => {
		return new Response(null, {
			status: 204,
			headers: {
				"Access-Control-Allow-Origin": process.env.CONVEX_ALLOWED_ORIGIN || process.env.VITE_CONVEX_URL || process.env.CONVEX_SITE_URL || "*",
				"Access-Control-Allow-Methods": "POST, OPTIONS",
				"Access-Control-Allow-Headers": "Content-Type",
				"Access-Control-Allow-Credentials": "true",
			},
		});
	},
});

http.route({ method: "POST", path: "/api/auth/google", handler: googleAuth });

export default http;
