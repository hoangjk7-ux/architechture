# TechGov

Technology governance platform: software system inventory, vendor/contract
tracking, integration mapping, department architecture views and a roadmap
across systems. Frontend is React + TypeScript + Vite; backend is Convex
(database, functions, auth).

## Getting started

```bash
pnpm install
pnpm run dev
```

Requires a Convex deployment (`npx convex dev` for local development) and
Google OAuth credentials for sign-in — see `docs/security/auth-rbac.md` and
`docs/security/google-oauth-setup.md`.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm run dev` | Start the Vite dev server |
| `pnpm run build` | Typecheck + production build |
| `pnpm run test` | Run the test suite once |
| `pnpm run test:coverage` | Run tests with coverage (v8, `all: true`) |
| `pnpm run lint` | ESLint over `src` and `convex` |
| `pnpm run typecheck` | `tsc -b` project-wide |
| `pnpm run check` | The full local/CI gate: prettier → lint → typecheck → test+coverage → build |
| `pnpm run seed` | Seed a Convex deployment (requires explicit `CONVEX_DEPLOYMENT`; see script for safety guards) |

`pnpm run check` is the single gate used both locally and in CI
(`.github/workflows/quality.yml`) — if it's green, the PR is green.

## Project process

This repository is developed under an orchestration process described in
`CLAUDE.md`, with the live plan, ownership map and audit trail in `.ai/`:

- `.ai/task.md` — the standing objective and definition of done.
- `.ai/orchestration.md` — workstream ownership (SEC/DATA/FE/QLT/OPS),
  dependency graph and merge-wave rules.
- `.ai/claude-plan.md` — the current execution plan (phased, versioned).
- `.ai/final-report.md` — checkpoint log of what shipped in each wave.

## Documentation

- `docs/security/auth-rbac.md` — authentication/RBAC decision record.
- `docs/security/google-oauth-setup.md` — Google OAuth provider setup.
