# AGENTS.md — Guidance for AI coding agents

Purpose
---
This file gives concise, actionable guidance to AI coding agents working in this repository. Follow the "link, don't embed" principle: point agents to source files and short commands rather than duplicating long docs.

Quick commands
---
- Development server: `pnpm run dev` (runs `vite`). See [package.json](package.json).
- Preview build: `pnpm run preview`.
- Build: `pnpm run build` (runs `tsc -b && vite build`).
- Seed Convex data: `pnpm run seed` — uses `CONVEX_DEPLOYMENT` env var (see [package.json](package.json)).
- Lint: `pnpm run lint`.
- Format: `pnpm run prettier-fix` / check with `pnpm run prettier-check`.

Key files & locations (quick links)
---
- Source app: [src/](src/)
- Pages: [src/pages/](src/pages/)
- Frontend layout: [src/components/layout/AppLayout.tsx](src/components/layout/AppLayout.tsx)
- UI components: [src/components/ui/](src/components/ui/)
- Convex backend & functions: [convex/](convex/)
- Vite config: [vite.config.ts](vite.config.ts)
- Project manifest: [package.json](package.json)

Conventions & notes
---
- Package manager: `pnpm` (pnpm workspace present). Use `pnpm` commands in examples and scripts.
- Build system: Vite + TypeScript. Keep `tsconfig.*` and Vite settings in sync.
- Backend: Convex is used for server/data functions — code lives under `convex/`. Do not commit secrets; use env vars.
- Generated code: `convex/_generated/` contains generated client/server artifacts — avoid manual edits.
- Code style: Follow ESLint + Prettier scripts defined in `package.json`.

How AI agents should behave
---
- Make small, focused edits. Run `pnpm run build` and `pnpm run lint` locally (or in CI) if changing build/runtime code.
- Prefer updating or adding tests/docs rather than large refactors without a clear plan.
- If a task needs credentials, deployments, or secret access, ask the human instead of trying to run them.
- When adding files, update `package.json` scripts or README links only if necessary and keep changes minimal.

When to prefer `.github/copilot-instructions.md`
---
Use `.github/copilot-instructions.md` only for repository-wide policies that must be surfaced by GitHub Copilot specifically. Prefer this `AGENTS.md` for general agent guidance.

Suggested next customizations
---
- Create a small `/.github/copilot-instructions.md` that links to this file and documents PR/branch rules, if desired.
- Add per-area agent instructions under `.agents/` or top-level `AGENTS.frontend.md` for complex subprojects.

If something is missing or you'd like a different focus (tests, CI, deployment), tell me which area to expand.
