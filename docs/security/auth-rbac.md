# Authentication and RBAC contract

Status: Accepted for implementation (SEC-00)  
Scope: TechGov application and its Convex backend  
Last updated: 2026-08-04

## Purpose

This document is the security contract for the authentication and authorization
workstream. Backend policy is authoritative. Route guards, hidden controls and
navigation filtering are user-experience measures only and must not grant access.

## Decisions

### One authoritative session system

TechGov will use `@convex-dev/auth` as its only session system. A successful sign-in
must create a Convex Auth session whose identity is available to backend functions
through `getAuthUserId(ctx)`. The `users` document associated with that identity is
the only authoritative source for the application role.

Password and Google may be offered as credential providers, but both must terminate
in the same Convex Auth session lifecycle:

```text
credential provider -> Convex Auth session -> getAuthUserId(ctx) -> users.role
```

The current Google HTTP action verifies an ID token, upserts a user and returns JSON.
That response is not a session and must not be treated as one. Google sign-in must be
migrated to a provider flow supported by Convex Auth. The custom token-to-JSON route
must then be removed unless it is retained as a non-authenticated profile endpoint;
it must never be able to establish client-side authentication by returning a role.

The following are explicitly prohibited in every environment that can access shared
or production-like data:

- An authoritative user, role or authenticated flag stored in browser storage.
- A hard-coded username, password, privileged email address or fake user ID.
- Treating a successful profile/upsert response as proof of a session.
- Falling back to a local CTO when `getAuthUserId(ctx)` is absent or throws an
  unauthenticated error.
- Accepting a role from the browser, an OAuth profile payload or mutation arguments
  controlled by the signing-in user.

A local developer login, if one remains necessary, must still use the same Convex
Auth session system. Test identities and credentials belong in isolated test/dev
configuration and must not be included in the application bundle or seed defaults.

### Authentication state and errors

`getCurrentUser` may return a real user record or `null`; it must never synthesize a
user. Protected backend functions use these stable outcomes:

- No valid session: `UNAUTHENTICATED`.
- Valid session but no provisioned user record or role: `FORBIDDEN` until provisioning
  completes. The UI may show a pending-access screen.
- Valid user with a role outside the endpoint policy: `FORBIDDEN`.

Sign-out must invalidate the real Convex Auth session. Clearing UI state alone is not
sign-out. Session restoration after refresh must come from Convex Auth, not local
application storage.

### Roles

Roles are intentionally non-hierarchical scopes even though CTO has the broadest
access:

- `cto`: full product and user/role administration.
- `it_manager`: read and write operational technology data, but no user or role
  administration.
- `business_owner`: read business-facing systems, vendors, architecture and roadmap.
  It cannot view integration operations, configuration administration or actor audit
  details.
- `viewer`: read-only access to technology domains, including integrations, but no
  user administration or actor audit details.

Business Owner **may read Vendors**. This resolves the previous contradiction in
favor of the role description and the business need to understand suppliers attached
to owned systems. Navigation and route policy must be updated to match this decision.
Business Owner may not create, update or delete vendors.

## Backend endpoint policy

Legend: `R` read, `W` create/update/delete, `A` administrative operation, `-` denied.
Every listed endpoint also requires a valid session.

| Convex endpoint | CTO | IT Manager | Business Owner | Viewer |
| --- | ---: | ---: | ---: | ---: |
| `software_systems.list` | R | R | R | R |
| `software_systems.get` | R | R | R | R |
| `software_systems.getStats` | R | R | R | R |
| `software_systems.create` | W | W | - | - |
| `software_systems.update` | W | W | - | - |
| `software_systems.remove` | W | W | - | - |
| `system_modules.list` | R | R | R | R |
| `system_modules.listBySystem` | R | R | R | R |
| `system_modules.create` | W | W | - | - |
| `system_modules.update` | W | W | - | - |
| `system_modules.remove` | W | W | - | - |
| `vendors.list` | R | R | R | R |
| `vendors.get` | R | R | R | R |
| `vendors.getExpiringContracts` | R | R | R | R |
| `vendors.create` | W | W | - | - |
| `vendors.update` | W | W | - | - |
| `vendors.remove` | W | W | - | - |
| `integrations.list` | R | R | - | R |
| `integrations.getStats` | R | R | - | R |
| `integrations.create` | W | W | - | - |
| `integrations.update` | W | W | - | - |
| `integrations.remove` | W | W | - | - |
| `roadmap.list` | R | R | R | R |
| `roadmap.getStats` | R | R | R | R |
| `roadmap.create` | W | W | - | - |
| `roadmap.update` | W | W | - | - |
| `roadmap.remove` | W | W | - | - |
| `config.listAll` | R | R | R | R |
| `config.add` | W | W | - | - |
| `config.update` | W | W | - | - |
| `config.remove` | W | W | - | - |
| `system_change_logs.list` | R | R | - | - |
| `users.getCurrentUser` | R | R | R | R |
| `users.updateCurrentUser` (provision/sync self) | R | R | R | R |
| `users.listUsers` | A | - | - | - |
| `users.inviteUser` | A | - | - | - |
| `users.removeUser` | A | - | - | - |
| `users.updateUserRole` | A | - | - | - |

`users.updateCurrentUser` may only synchronize the authenticated identity with an
existing invitation or assign the default `viewer` role. It must not accept role
input, transfer an elevated role merely because another account has the same email,
or promote a user because no writer currently exists.

Internal mutations and deployment-only bootstrap operations are not public API.
They must remain unreachable by browser clients and validate their own invariants.

### Dashboard consequence

The current dashboard calls integration statistics for every user. Because Business
Owner is not permitted to read integration operations, the frontend must skip that
query and omit the integration section for that role, or a later security-reviewed
aggregate endpoint may expose explicitly non-sensitive metrics. A frontend need is
not grounds to weaken an existing backend rule.

## Frontend route policy

All routes require a valid Convex Auth session. A denied deep link must render a 403
state and must not mount the protected page or start its data queries.

| Route | CTO | IT Manager | Business Owner | Viewer |
| --- | ---: | ---: | ---: | ---: |
| `/` dashboard | Allow | Allow | Allow, role-filtered content | Allow |
| `/systems` | Allow | Allow | Allow | Allow |
| `/vendors` | Allow | Allow | Allow | Allow |
| `/architecture` | Allow | Allow | Allow | Allow |
| `/integrations` | Allow | Allow | Deny | Allow |
| `/roadmap` | Allow | Allow | Allow | Allow |
| `/users` | Allow | Deny | Deny | Deny |
| `/settings` | Allow | Allow | Deny | Deny |
| `/flow-diagram` | Same as `/architecture` | Same | Same | Same |

The authentication callback route is reachable without an application session only
to complete the provider protocol. It must validate provider state through the auth
library and redirect safely; it is not an application-data route.

## CTO bootstrap

CTO bootstrap is an explicit deployment operation, not runtime role inference.

1. A deployment operator runs an idempotent, server-side bootstrap command against
   the intended deployment. It is internal/deployment-only and accepts a normalized
   email supplied at execution time; no privileged email is committed to source.
2. The command refuses empty/invalid email, records a pending manually provisioned
   CTO invitation, and records an audit event. Re-running it for the same identity is
   harmless.
3. On first successful Convex Auth sign-in, the normalized, verified provider email
   may claim exactly one matching pending invitation. The session identity becomes
   associated with that user record and the invitation is consumed atomically.
4. Once an active CTO exists, normal CTO-only user administration provisions further
   roles. The bootstrap command refuses to add another CTO unless an explicit
   break-glass mode is invoked by the deployment operator and audited.

Bootstrap must never use “first person to sign in”, “no current writer”, a bundled
seed record, a browser request or a hard-coded allowlist. Production bootstrap and
break-glass steps must be documented in an operator runbook before deployment.

## Last-CTO and role-change invariants

The following checks are server-side and transactional:

- There must always be at least one active, non-placeholder CTO after a successful
  user removal or role update.
- A CTO cannot remove their own active account.
- A CTO cannot demote themselves if they are the last active CTO.
- No caller can remove or demote any last active CTO, including through invitation
  replacement, account merge, provider relinking or cleanup jobs.
- Updating or removing a missing target returns `NOT_FOUND`; it must not silently
  succeed.
- Role changes accept only the role union defined by the schema and are audited with
  actor, target, previous role and next role.
- Email normalization is `trim()` followed by lowercase before invitation lookup and
  uniqueness comparison. Role transfer based only on an unverified email is forbidden.

Convex mutations are serialized with optimistic concurrency control. The invariant
must be checked in the same mutation that writes the role/removal so concurrent CTO
changes cannot both commit against stale state.

## Required verification contract

Security implementation is incomplete until automated tests cover:

- Anonymous access for every public query and mutation.
- At least one allowed and every materially different denied role per domain.
- Browser-storage role tampering has no effect on backend authorization.
- Password/Google sign-in, refresh restoration, authenticated query and real sign-out.
- User without a provisioned record/role.
- Invitation claim with whitespace/case variants and duplicate invitation attempts.
- Concurrent attempts to demote or remove the last CTO.
- Direct deep links to denied routes.
- The Business Owner Vendors allow rule and Integrations deny rule.

Before merging an implementation wave, run the repository quality gate specified in
`.ai/orchestration.md` plus a secret/default scan:

```bash
pnpm run prettier-check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
grep -RInE '123456789|local-admin|admin@local|hoangjk7@gmail.com|techgov-simple-auth' src convex
```

Missing scripts are owned by QLT-01. A missing script or pre-existing dirty-file
failure must be reported, not bypassed with a broad ignore.

## Implementation sequencing

The backend fail-closed change must not be deployed alone. Real session migration,
current-user frontend migration, core provisioning and fail-closed backend identity
must ship as one release unit. Endpoint guards and role hardening follow this contract.
Data validators may integrate into shared domain mutation files only after the first
security guard-only pass has merged.
