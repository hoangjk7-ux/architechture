export function resolveGoogleClientId(env: Record<string, string | undefined> | undefined) {
  if (!env) return undefined;
  return env.VITE_GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID;
}
