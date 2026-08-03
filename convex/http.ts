import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { googleAuth } from "./http_actions/google";
import { optionsAuth } from "./http_actions/options";

const http = httpRouter();
auth.addHttpRoutes(http);

// CORS preflight support for the Google auth endpoint
http.route({ method: "OPTIONS", path: "/api/auth/google", handler: optionsAuth });

http.route({ method: "POST", path: "/api/auth/google", handler: googleAuth });

export default http;
