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

# Wave 2 integrity and mobile checkpoint

Date: 2026-08-04

## Completed

- SEC-05: normalized invitation/claim email, safe default Viewer, stable errors,
  self-delete prevention and transactional last-active-CTO protection.
- DATA-02: backend normalization, range/date/reference validation and stable errors
  across create/update mutations.
- DATA-03: enforced roadmap hierarchy and cycle detection; recursive descendant
  deletion policy with integration coverage.
- DATA-04: vendor/config restrict policies and verified system cascade/unlink.
- FE-02: accessible mobile primary navigation + More sheet, all role-allowed routes
  reachable, safe-area spacing and desktop collapsed tooltips.
- Seed workflow now requires exact deployment confirmation, uses least permissions,
  pinned pnpm, timeout/concurrency, and the script refuses an empty deployment.

## Verification

- Tests: 13 files / 43 tests pass.
- Typecheck: pass.
- Lint: pass with 22 existing frontend warnings, zero errors.
- Build: pass; main JS 549 kB minified / 167 kB gzip.
- Empty-deployment seed safety test: refused execution as expected.
- Coverage after including all mutation modules: lines 62.69%, domain validators
  98.33%. The lower aggregate is real uncovered CRUD surface, not a regression hidden
  by exclusions; QLT-04 must add tests before enforcing the overall threshold.

## Follow-ups

- DATA-05 generalized audit is needed before persisting role-change audit events.
- DATA-06 should optimize config reference scans and list/stat queries.
- Very large roadmap trees may need a bulk job beyond one Convex transaction.
- Seed data insertion is still non-idempotent even though execution is now guarded.
- FE-03/05 should remove the remaining memo/Fast Refresh warnings.

# Wave 3 performance checkpoint

Date: 2026-08-05

## Completed

- Route loading now keeps the app shell mounted while page chunks load.
- Navigation preloads route chunks on desktop hover/focus and mobile focus/touch.
- Current user state is centralized in `CurrentUserProvider` to avoid duplicate
  page/layout role queries.
- Core list pages now distinguish query loading from true empty data, so route
  switches show skeletons instead of briefly rendering empty states.
- `vendors.list` now counts referenced systems with a single map pass instead of
  filtering all systems once per vendor.
- Flow Diagram memo dependencies are stable and its loading skeleton is reachable.

## Verification

- `pnpm run typecheck`: pass.
- `pnpm run test`: pass, 13 files / 44 tests.
- `pnpm run lint`: pass with 1 existing Fast Refresh warning in language provider.
- `pnpm run build`: pass; main JS about 550 kB minified / 168 kB gzip.
- Architecture route remains about 254 kB minified / 67 kB gzip and should be the
  next split target.

## Follow-ups

- Split Architecture tab/content modules so React Flow/Gantt/editor code loads
  only when needed.
- Finish DATA-06 with backend pagination/indexed query contracts.
- Production auth still needs a browser smoke after the JWT rotation.
