# Wave 0 report

Date: 2026-08-04

## Completed

- SEC-00: accepted authentication/RBAC ADR with endpoint and route matrices.
- QLT-01: quality scripts and tooling now target TechGov instead of `OpenHands/`.
- DATA-01: pure domain validation contracts added under `convex/domain/`.
- FE-01: page routes lazy-loaded with suspense/error boundaries.

## Verification

- `pnpm run typecheck`: pass.
- `pnpm run test`: pass, 4 files / 11 tests.
- `pnpm run build`: pass.
- Main JS reduced from about 1,056 kB to 583 kB minified; gzip from about 286 kB
  to 176 kB. Architecture route is 253 kB minified / 67 kB gzip.
- `pnpm run lint`: correctly scoped but fails on 12 existing TechGov errors and
  reports 25 warnings. No `OpenHands/` findings remain.
- `pnpm run prettier-check`: baseline remains red across existing/dirty files; no
  unrelated or user-owned file was auto-formatted.
- `test:coverage`: deferred until QLT-03 coordinates `@vitest/coverage-v8`.

## Preserved user work

No wave task overwrote or bulk-formatted the existing changes in language,
architecture, integrations, systems or vendors pages.

## Next safe wave

1. SEC-01: failing identity/session tests.
2. QLT-03: test harness/dependency decision, coordinated with Security.
3. FE-02 only after Security assigns `AppLayout.tsx` ownership.
4. DATA validators remain unintegrated until the security guard-only pass merges.

Release remains blocked by SimpleAuth, anonymous CTO fallback and missing module
guards. The backend fail-closed change must not ship without the real session and
frontend current-user migration.

# Wave 1 security checkpoint

Date: 2026-08-04

## Completed

- Replaced SimpleAuth and custom Google JSON endpoint with official Convex Auth
  Google provider/session flow.
- Removed local credential, fake user ID, browser role authority and anonymous CTO
  fallback.
- Added fail-closed authentication and explicit role guards to public domain APIs.
- Added backend-sourced current user, true session sign-out and deep-link 403 guards.
- Business Owner policy now allows Vendors and denies Integrations as defined by ADR.
- Added Convex Edge Runtime test harness, coverage provider and route-boundary tests.
- Removed privileged email from seed and added internal, operator-supplied CTO
  bootstrap mutation.
- Aligned `@auth/core` to the peer range required by `@convex-dev/auth`.

## Verification

- Tests: 8 files / 24 tests pass, no expected-fail contracts remain.
- Typecheck: pass.
- Lint: pass with 22 existing memo/Fast Refresh warnings, zero errors.
- Coverage: lines 82.69%, statements 78.07%, branches 71.42%.
- Build: pass; main JS 515 kB minified / 157 kB gzip.
- Secret/default scan for old local credentials and privileged emails: clean.

## Runtime gates before deployment

- Configure Google client ID/secret and Convex Auth environment values.
- Explicitly run CTO bootstrap against the intended non-production deployment first.
- Smoke login → refresh → protected query → sign-out.
- Complete SEC-05 last-CTO and role-change audit/invariants.
- Harden the manual seed workflow; it still defaults to a production deployment.
