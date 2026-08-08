# SEC-01 implementation delta

This note records the exact production changes required after the failing identity
and session contracts were added. SEC-01 intentionally does not apply these changes.

## Installed API capabilities

The installed `@convex-dev/auth` version is `0.0.94`.

- `@convex-dev/auth/react` exposes `useAuthActions().signIn(provider, params)` and
  asynchronous `signOut()`. The documented sign-out invalidates the server session
  and removes the local JWT and refresh token.
- `@convex-dev/auth/server` exposes `getAuthUserId(ctx)`, which returns `null` when
  `ctx.auth.getUserIdentity()` is null and otherwise derives the user ID from the
  authenticated identity subject.
- `convexAuth({ providers })` accepts Auth.js providers. The installed dependency
  contains `@auth/core/providers/google`, so Google can participate in the same
  Convex Auth session lifecycle as the existing Password provider.
- Convex Auth supports a `createOrUpdateUser` callback for associating OAuth identity
  with the application user/provisioning policy.

## Current gaps and exact implementation targets

| Gap                                   | Current evidence                                                                        | Required implementation                                                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Anonymous becomes CTO                 | `convex/helpers.ts` returns `local-admin` when `getAuthUserId` is null                  | SEC-03: return null and make shared guards throw `UNAUTHENTICATED`                                                                                                         |
| Anonymous write passes                | `requireWriteAccess` receives the synthetic CTO                                         | SEC-03/04: fail closed, then apply guards to every endpoint                                                                                                                |
| Google response is not a session      | `convex/http_actions/google.ts` verifies a token, upserts a user and returns `{ user }` | SEC-02: configure the Auth.js Google provider in `convex/auth.ts` and initiate it through `useAuthActions().signIn("google", ...)`                                         |
| Two client auth authorities           | `SimpleAuthProvider` wraps `ConvexAuthProvider` and persists user/role                  | SEC-02: remove SimpleAuth authority; use `useConvexAuth` for session state and query `users.getCurrentUser` for role                                                       |
| Sign-out is local only                | SimpleAuth sign-out only clears component/storage state                                 | SEC-02: await `useAuthActions().signOut()`                                                                                                                                 |
| Password bypass                       | `admin / 123456789` was checked in bundled client code                                  | SEC-02: remove the local credential branch. The unverified Password provider is not exposed; it may return only with an invitation/verification policy and dedicated tests |
| OAuth role assignment bypasses policy | `upsertGoogleUser` hard-codes a CTO email and returns role to the browser               | SEC-02/05: provision in the Convex Auth user callback using normalized verified email and the ADR invitation/bootstrap rules                                               |
| CORS trusts request origin            | custom Google action reflects the request `Origin`                                      | Remove the custom route with the migration; if retained for a non-auth purpose, validate against an explicit allowlist                                                     |

## Migration boundary

SEC-02 should own the real session path (`convex/auth.ts`, HTTP auth wiring,
providers, sign-in and callback). SEC-03 should own fail-closed helpers. These may be
separate reviewable commits, but the fail-closed backend must not deploy before the
real session and current-user frontend are ready, as required by the ADR.

The SEC-02/03 core migration closed the original expected failures. The contracts now
run as ordinary passing tests and protect the fail-closed identity, official Google
provider and browser-storage boundaries.
