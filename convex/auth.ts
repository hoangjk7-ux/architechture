import { convexAuth } from "@convex-dev/auth/server";
import Google from "@auth/core/providers/google";

declare const process: {
  env: {
    AUTH_GOOGLE_ID?: string;
    AUTH_GOOGLE_SECRET?: string;
  };
};

const googleClientId = process.env.AUTH_GOOGLE_ID;
const googleClientSecret = process.env.AUTH_GOOGLE_SECRET;

if (!googleClientId || !googleClientSecret) {
  throw new Error(
    "Google OAuth is not configured. Set AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET in the Convex deployment environment.",
  );
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google({ clientId: googleClientId, clientSecret: googleClientSecret }),
  ],
});
