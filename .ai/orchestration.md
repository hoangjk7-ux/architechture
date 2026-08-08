# Claude Code execution map

## Operating rules

1. Đọc `AGENTS.md`, `CLAUDE.md`, `.ai/task.md` và `git status --short` trước khi làm.
2. Không reset, checkout, xóa hoặc auto-format thay đổi chưa commit.
3. Mỗi task chạy trên branch/worktree riêng nếu Claude Code hỗ trợ; mỗi commit chỉ
   chứa một task ID.
4. Chỉ một agent được sở hữu một file tại cùng thời điểm. Nếu cần file ngoài vùng
   sở hữu, dừng và báo orchestrator thay vì tự sửa.
5. Security contract phải merge trước Data mutation integration. Quality baseline
   và Frontend read-only/refactor vùng sạch có thể chạy song song.
6. Không deploy, không chạy seed thật và không dùng secret production.
7. Sau mỗi task, ghi command đã chạy, kết quả, file thay đổi và rủi ro còn lại vào
   `.ai/codex-result.md` hoặc báo cáo task tương đương.

## Current dirty-file protection

Cập nhật 2026-08-08 sau audit provenance (`.ai/provenance-audit.md`, đã qua 3
vòng phản biện Codex): danh sách 5 file cũ (snapshot lúc lập kế hoạch ban đầu)
đã được commit qua `563fd38`/`c611489`/`9daed39` và **không còn ở trạng thái
chưa commit**. **Danh sách "dirty file" là một snapshot tại thời điểm task bắt
đầu, không phải sự thật cố định** — phải sinh lại bằng `git status --short`
mỗi lần một agent bắt đầu việc; kể cả dòng ghi chú này cũng có thể lỗi thời
ngay sau khi được viết (ví dụ: audit Bước 0 ngày 2026-08-08 dẫn tới việc sửa
`src/pages/architecture/page.tsx`, khiến working tree đổi lại chỉ vài phút sau
khi ghi "chỉ `.ai/*.md` dirty").

**Historical/high-conflict files** — không phải "đang dirty", nhưng từng bị
nhiều luồng ownership sửa trong cùng một commit (`c611489` trộn DATA+FE+test),
nên agent nào chạm vào các file này phải đọc `git log -p` gần nhất trước khi
sửa, không giả định mình là chủ sở hữu duy nhất của lịch sử file. Quy tắc là
**một task/commit có accountable owner rõ và review đúng vùng chạm**, không
phải tuyệt đối "1 PR chỉ được chạm file của đúng 1 owner" — thay đổi xuyên
vùng vẫn được phép nếu có sign-off từ owner liên quan (xem bảng accountability
của workstream `OPS` bên dưới làm mẫu):

- `convex/schema.ts`
- `convex/system_change_logs.ts`
- `convex/system_modules.ts`
- `convex/domain/mutations.integration.test.ts`
- `src/pages/flow-diagram/_components/GanttChart.tsx`
- `src/pages/systems/page.tsx`
- `src/components/providers/language.tsx`

Agent Frontend/Data phải đọc diff gần nhất trước khi chạm các file này và chỉ
tiếp tục khi có worktree/commit nền rõ ràng hoặc orchestrator xác nhận thay đổi
đã được bảo toàn.

## Workstreams and ownership

### SEC — Security and identity

Owner: `security-engineer`

Owned files:

- `convex/auth.ts`, `convex/auth.config.ts`, `convex/helpers.ts`
- `convex/users.ts`, `convex/http.ts`, `convex/http_actions/**`
- `src/components/providers/*auth*`, `src/components/ui/signin.tsx`
- `src/hooks/use-auth.ts`, `src/hooks/use-current-user.ts`
- `src/pages/auth/**`
- New security tests

Tasks:

- **SEC-00 – Auth/RBAC ADR.** Create `docs/security/auth-rbac.md`; choose one real
  Convex session mechanism, define endpoint × role and route × role matrices, resolve
  whether Business Owner may access Vendors, define CTO bootstrap without hard-coded
  email/first-writer promotion, and define last-CTO protection. No source edits.
- **SEC-01 – Identity failing tests.** Trace Password and Google flows. Add tests
  proving anonymous requests cannot write and JSON returned by the current Google
  HTTP action is not treated as a session.
- **SEC-02 – Real session migration.** Connect sign-in, callback, session restore and
  sign-out to the selected Convex Auth flow. Remove hard-coded admin credential and
  authoritative localStorage role.
- **SEC-03 – Server guards.** Make anonymous identity fail with `UNAUTHENTICATED`;
  introduce `requireAuthenticated`, `requireRole`, `requireWriteAccess`, `requireCTO`.
- **SEC-04 – Permission matrix.** Protect every public query/mutation. Security owns
  the first guard-only pass over `convex/system_modules.ts`; Data integrates its
  validators only after SEC-04 merges.
- **SEC-05 – Role hardening.** Prevent self-escalation, deletion/demotion of the last
  CTO, normalize invite email and audit role changes.

Acceptance:

- Browser storage changes cannot grant backend permission.
- Anonymous/viewer/manager/CTO cases are tested for every domain.
- Sign-out invalidates the actual session.
- No production path contains default credentials or anonymous CTO fallback.

### DATA — Validation and integrity

Owner: `data-integrity-engineer`

Owned files after SEC-04:

- `convex/domain/**` (new)
- `convex/schema.ts`
- `convex/software_systems.ts`, `vendors.ts`, `integrations.ts`, `roadmap.ts`
- `convex/system_modules.ts`, `config.ts`, `system_change_logs.ts`, `seed.ts`
- Domain/integrity tests

Tasks:

- **DATA-01 – Pure domain validators.** Non-empty trimmed text, finite range 0–100,
  non-negative money/order, valid ISO calendar date, ordered dates, normalized
  email and unique normalized strings.
- **DATA-02 – Mutation validation.** Validate references, source != destination,
  related IDs, score/cost/date constraints and missing entity `NOT_FOUND` cases.
- **DATA-03 – Roadmap invariants.** Enforce level hierarchy, reject self-parent and
  cycles, and define tested descendant deletion behavior.
- **DATA-04 – Delete policies.** Vendor/config use RESTRICT while referenced; system
  cascades integrations/modules and unlinks roadmap; no successful mutation leaves
  dangling IDs.
- **DATA-05 – Audit model.** Generalize audit records for entity, actor, action and
  changed fields; add indexes and pagination.
- **DATA-06 – Query/index optimization.** Replace avoidable full-table joins/scans,
  add indexed/paginated list/detail queries, using additive migrations where needed.
- **DATA-07 – Seed hardening.** Idempotent isolated seed; refuse accidental production
  execution and reuse domain validation.

Acceptance:

- Invalid input is rejected server-side with stable error codes.
- Destructive policy tests assert before/after database state.
- Schema changes are additive/backfilled before required-field enforcement.

### FE — Frontend structure, UX and performance

Owner: `frontend-engineer`

Owned files:

- `src/App.tsx`, `src/components/layout/**`
- `src/features/**` and `src/shared/**` (new)
- `src/pages/**` after dirty-file protection is resolved
- `src/i18n/**` after dirty-file protection is resolved
- Frontend component tests

Tasks:

- **FE-01 – Route split and state boundaries.** Lazy-load page routes, add route-level
  suspense/error boundaries and distinguish loading/error/empty/content.
- **FE-02 – Mobile navigation and accessibility.** Provide all permitted routes via
  More/drawer, make Settings actionable, add bottom safe spacing, tooltip collapsed
  nav, aria-labels, focus and keyboard support.
- **FE-03 – Shared async mutation UX.** Confirm destructive actions; await mutations;
  disable while pending; only toast after success; retain dialogs on failure.
- **FE-04 – Systems/Vendors/Integrations feature extraction.** Split page, form,
  table/card, detail and pure filter functions without changing behavior.
- **FE-05 – Architecture extraction.** Split the 1,556-line page into graph, toolbar,
  panels, module UI and pure graph-layout hooks; preserve current user diff.
- **FE-06 – Typed i18n.** Move dictionaries to `src/i18n/{vi,en}.ts`, restore a typed
  key union, replace literal strings and use `Intl` for date/number/currency.
- **FE-07 – List scalability.** URL-synced search/filter/sort/pagination, debounced
  search and responsive table/card patterns.
- **FE-08 – Bundle budget.** Isolate ReactFlow/Recharts/Gantt chunks and measure initial
  JS; target initial gzip <150 KB and no route chunk >500 KB minified without waiver.

Acceptance:

- No page remains over 500 lines; common components target <150 lines.
- All mobile-authorized routes remain reachable at 320 px.
- User-facing text is translated and icon actions are accessible.
- No fire-and-forget mutation or loading-as-empty behavior remains.

### QLT — Quality, tests and CI

Owner: `quality-engineer`

Owned files:

- `package.json`, ESLint/Prettier/Vitest/Vite quality configuration
- `.github/workflows/quality.yml`
- New test setup/helpers and quality documentation
- Never application business files during baseline task

Tasks:

- **QLT-01 – Baseline.** Scope lint to TechGov (`src`, `convex`) and exclude
  `OpenHands`, generated output and local Convex data. Add `typecheck`, `test`,
  `test:coverage` and `check` scripts.
- **QLT-02 – CI.** Frozen pnpm install, prettier check, lint, typecheck, test and build;
  least permissions, concurrency cancellation and timeout.
- **QLT-03 – Test harness.** Add pure unit and Convex integration setup. Coordinate
  any new dependency before installing it.
- **QLT-04 – Coverage gates.** Domain/security >=95% where practical, overall >=80%
  after test suite exists; ratchet threshold, do not fake coverage exclusions.
- **QLT-05 – Critical E2E.** Login/logout, CTO CRUD, viewer denial, cascade/restrict,
  roadmap hierarchy, mobile nav and language switch.

Acceptance:

- `pnpm run check` is the single local/CI gate.
- Lint does not scan `OpenHands/` and no application error is hidden by ignores.
- CI never deploys or seeds production.

### OPS — Dependency, observability and production readiness

Added 2026-08-08 (`.ai/claude-plan.md` v3, Giai đoạn 4) — not owned by
`quality-engineer` alone; scope spans dependency, security, frontend
performance, deployment config and operational rollout.

Owner: `OPS` (no dedicated agent defined yet — orchestrator must assign or
create one before dispatching Giai đoạn 4 tasks)

Owned files:

- Dependency manifests (`package.json` dependency bumps, coordinated with the
  owner of the affected area — see accountability table below)
- Deployment config (`vercel.json`, CI workflow beyond QLT-02's baseline)
- Runbooks, observability config, smoke-test scripts (new)

Accountability (Accountable → Reviewer):

| Hạng mục | Accountable | Reviewer |
|---|---|---|
| Dependency inventory, vulnerability decision log | OPS | QLT + owner package tương ứng |
| Vite/TypeScript/Vitest, CI bundle gate | QLT | OPS |
| React/React Router, Radix/Tailwind, chart/diagram libs | FE | QLT |
| Convex/Auth upgrade | SEC | DATA, OPS |
| Security headers, cấu hình Vercel | OPS | SEC |
| Structured logging, error tracking, alert policy | OPS | SEC/DATA/FE |
| Staging smoke và runbook | OPS | SEC/DATA/FE |
| Auth rollback | SEC | OPS |
| Schema/data migration rollback | DATA | OPS |
| Bundle/performance regression | FE | QLT |

Rules: no self-deploy, no production credentials; depends on Giai đoạn 0–3
closing first; must hand off explicitly when staging access/secrets are
needed; production readiness requires an explicit human/credential gate and
cannot be marked complete by repository changes alone.

Acceptance:

- No critical/high dependency without a documented decision (upgrade, or
  accepted risk with owner/reason/expiry).
- Production smoke checklist passes on staging (evidence retained).
- Error dashboard and rollback (forward-fix/expand-contract) procedure documented.

## Dependency graph

```text
QLT-01 ──> QLT-02 ───────────────┐
   │                              │
   └──> QLT-03                    │
                                  v
SEC-00 -> SEC-01 -> SEC-02 -> SEC-03 -> SEC-04 -> SEC-05
                                  │
                                  v
DATA-01 -> DATA-02 -> DATA-03 -> DATA-04 -> DATA-05 -> DATA-06
              │                   │
              └──────────────> DATA-07

FE-01 -> FE-02 -> FE-03 -> FE-04 -> FE-05 -> FE-06 -> FE-07 -> FE-08

SEC-04 + DATA-04 + FE-03 + QLT-03 -> QLT-04 -> QLT-05 -> final hardening

QLT-01 + SEC-04 + DATA-04 + FE-03 -> OPS (Giai đoạn 4, .ai/claude-plan.md v3)
```

**Superseded items (đã bị `.ai/claude-plan.md` v3 thay thế một phần, giữ ở
đây chỉ để tham chiếu lịch sử — không dùng làm nguồn số liệu hiện tại):**

- FE-05 mô tả Architecture là "1,556-line page"; số thật tại HEAD 2026-08-08
  là **2,972 dòng** (xem baseline trong `claude-plan.md` v3).
- QLT-04 ghi "overall >=80%... domain/security >=95%" như một gate chung; v3
  yêu cầu ratchet theo 2 mốc (70/60 rồi 80/70) và **tách threshold domain
  khỏi security** — không suy diễn coverage security từ coverage
  `convex/domain`.

Safe initial concurrency:

- Lane A: `SEC-00`, then `SEC-01`.
- Lane B: `DATA-01` pure new files only; do not integrate mutations yet.
- Lane C: `FE-01`, avoiding current dirty page files.
- Lane D: `QLT-01`.

## Verification after every merge wave

```bash
pnpm run prettier-check
pnpm run lint
pnpm run typecheck
pnpm run test
pnpm run build
git diff --check
```

If a script does not exist yet, QLT-01 owns adding it. A failure caused by an
existing dirty file must be reported, not silently formatted.

## Merge waves

Waves 0–3 below are closed (see `.ai/final-report.md`). For work after Wave 3,
`.ai/claude-plan.md` v3 ("Giai đoạn 0–4") is the authoritative execution plan —
it supersedes the "Wave 4" line item below with a more detailed sequence
(provenance/behavior audit, split PRs, `OPS` workstream, characterization
tests before Architecture refactor). Do not plan against "Wave 4" as written
here without cross-checking `claude-plan.md` v3 first.

1. **Wave 0:** SEC-00, QLT-01 and failing security tests from SEC-01.
2. **Wave 1:** SEC-02/03; FE-01/02 on non-dirty files; DATA-01 pure validators.
3. **Wave 2:** SEC-04/05, then DATA-02/03/04; FE-03.
4. **Wave 3:** Feature extraction, typed i18n, audit and query optimization.
5. **Wave 4:** Coverage, E2E, bundle budgets, accessibility and final hardening.

Orchestrator may only advance a wave when its acceptance criteria and verification
commands pass or the remaining failure is explicitly documented and approved.

Release constraint: do not deploy the backend fail-closed change by itself. The real
session flow, current-user frontend migration and core provisioning must ship in the
same release unit, otherwise every current user will be locked out.
