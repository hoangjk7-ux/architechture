import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { googleAuth } from "./http_actions/google";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({ method: "POST", path: "/api/auth/google", handler: googleAuth });

export default http;
