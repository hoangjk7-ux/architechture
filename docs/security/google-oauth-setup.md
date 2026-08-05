# Google OAuth setup for Convex Auth

This project uses the Google provider from Auth.js through `@convex-dev/auth`.
OAuth credentials are server secrets and must be configured in the target Convex
deployment, not exposed through a `VITE_` variable or committed to the repository.

## Required variables

The installed Auth.js version uses these canonical names:

```text
AUTH_GOOGLE_ID
AUTH_GOOGLE_SECRET
SITE_URL
```

`AUTH_GOOGLE_ID` is the Google OAuth Web client ID. `AUTH_GOOGLE_SECRET` is its
client secret. `SITE_URL` is the deployed frontend origin to which Convex Auth may
redirect after completing OAuth, for example `https://techgov.example.com`.

`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `VITE_GOOGLE_CLIENT_ID` are not read
by the configured provider. `VITE_` values are bundled into browser code and must
never contain the client secret.

Set the values explicitly for each intended Convex deployment. The commands below
are templates; enter values through the operator's secure shell/history practices
and confirm the selected deployment before running them:

```bash
npx convex env set AUTH_GOOGLE_ID '<google-web-client-id>'
npx convex env set AUTH_GOOGLE_SECRET '<google-web-client-secret>'
npx convex env set SITE_URL 'https://<frontend-origin>'
```

Do not assume values in `.env.local` have been synchronized to the hosted Convex
deployment. Verify names without printing values:

```bash
npx convex env list | sed -E 's/=.*$/=<redacted>/'
```

## Google Cloud Console

Create or select an OAuth 2.0 Client ID whose application type is **Web
application**. Add this exact authorized redirect URI:

```text
https://quiet-impala-764.convex.site/api/auth/callback/google
```

The callback is hosted by the Convex HTTP Actions site, not the frontend origin and
not the `.convex.cloud` query URL. For another deployment, replace the hostname with
that deployment's `CONVEX_SITE_URL` and retain `/api/auth/callback/google`.

An `OAuth client was not found` response usually means the authorization request
contains a missing, deleted or wrong-project client ID. A `redirect_uri_mismatch`
response instead means the client exists but the exact callback above is absent from
its authorized redirect URIs.

After changing Google Console settings or Convex environment variables, allow the
provider configuration to propagate, restart the local Convex development process if
used, and test sign-in in a fresh private browser session.

## CTO bootstrap

Successful Google authentication creates an identity but does not hard-code a CTO
email in application source. After the OAuth flow works, a deployment operator may
explicitly provision the authorized initial CTO using the internal bootstrap
operation described in `docs/security/auth-rbac.md`:

```bash
npx convex run bootstrap:bootstrapCto '{"email":"hoangjk7@gmail.com"}'
```

Confirm the target deployment before running this command. It mutates remote data,
so it must not be run as part of local diagnosis or CI. The operation is idempotent
and refuses implicit privilege takeover once an active CTO exists.

## Smoke test

1. Start sign-in through the TechGov Google button.
2. Confirm Google's authorization request uses the expected Web client.
3. Confirm Google returns to the Convex `.site` callback.
4. Confirm the browser reaches `/auth/callback`, then the dashboard.
5. Refresh and verify the session is restored.
6. Sign out and verify a protected backend query returns `UNAUTHENTICATED`.
