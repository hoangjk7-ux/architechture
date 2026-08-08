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

# Giai đoạn 0 — Bước 0: provenance + behavior audit checkpoint

Date: 2026-08-08

## Completed

- Đọc full diff (không chỉ `--stat`) của 3 commit sau Wave 3: `563fd38`,
  `c611489`, `9daed39`. Kết quả đầy đủ tại `.ai/provenance-audit.md`.
- Quyết định: `563fd38` ACCEPT (thuần i18n); `c611489` ACCEPT có follow-up
  (guard/test đầy đủ, migration additive, nhưng audit log tạm thời — đã map
  vào DATA-05; vi phạm quy trình "1 task/1 commit" ghi nhận để tránh lặp lại);
  `9daed39` ACCEPT cấu trúc, **CẦN SỬA 1 bug xác nhận**.
- **Bug xác nhận (không phải suy đoán):** `avgArchitecture || "—"` và
  `avgDebt || "—"` trong `architecture/page.tsx` (`DeptSummaryCard` + stat bar
  của `DeptView`, 4 vị trí) hiển thị "—" thay vì "0" khi điểm trung bình đúng
  bằng 0 — coi giá trị falsy 0 là "thiếu dữ liệu". Cần quyết định: sửa ngay
  bằng patch nhỏ độc lập, hoặc gộp vào PR `test/architecture-characterization`
  ở Giai đoạn 2.
- Không phát hiện vi phạm guard/RBAC trong cả 3 commit; `c611489` vẫn giữ
  `requireWriteAccess`/`requireRole` đúng chỗ.
- Cập nhật `orchestration.md`: xoá snapshot "dirty-file protection" đã lỗi thời
  (5 file đó đã được commit), thay bằng danh sách "historical/high-conflict
  files" (file bị `c611489` trộn ownership) và thêm workstream `OPS` (bảng
  accountability cho Giai đoạn 4, theo `.ai/claude-plan.md` v3).
- Thêm ghi chú trong `orchestration.md` trỏ "Wave 4" cũ sang
  `.ai/claude-plan.md` v3 làm nguồn kế hoạch chính thức cho công việc sau Wave 3.

## Verification

- Đây là task documentation-only; không sửa `src/**` hay `convex/**`.
- `pnpm run check` chạy lại sau khi sửa `.ai/*.md`/`orchestration.md` để xác
  nhận không phá gì (xem log ngay dưới task này nếu có).

## Next

- Tiếp tục Giai đoạn 0: xác định phạm vi Prettier thật (không cam kết cứng số
  "54 file"), dựng `.github/workflows/quality.yml`, đặt coverage threshold
  đúng bằng baseline đo được.

# Fix nhanh: avg=0 hiển thị sai ở Architecture

Date: 2026-08-08

## Completed

- Sửa 4 vị trí trong `src/pages/architecture/page.tsx` (`DeptSummaryCard`,
  `DeptView` stat tiles) đổi `value || "—"` thành kiểm tra tường minh theo độ
  dài mảng systems — điểm trung bình = 0 nay hiển thị "0" thay vì "—".

## Verification

- `pnpm run typecheck`: pass.
- `pnpm run lint`: pass, 1 cảnh báo Fast Refresh cũ (không liên quan).
- `pnpm run test`: pass, 13 file / 45 test.
- `pnpm run build`: pass; Architecture chunk 258.62 kB minified / 67.97 kB
  gzip (không đổi đáng kể so với baseline 258.58 kB / 67.97 kB).

## Files changed

- `src/pages/architecture/page.tsx`

## Risk

Thấp — chỉ đổi điều kiện hiển thị, không đổi phép tính hay luồng dữ liệu.
Chưa commit; chờ xác nhận trước khi commit theo đúng quy trình.

# Codex review #3 + sửa lỗi falsy-zero còn sót + hiệu chỉnh audit

Date: 2026-08-08

## Completed

- Codex review lần 3 (read-only) phản biện `.ai/provenance-audit.md`,
  `.ai/orchestration.md` và patch avg=0 — tìm thêm đúng lớp bug ở 2 vị trí
  khác (`system.costPerYear && (...)` dòng ~1576, `sys.costPerYear ? ... : "—"`
  dòng ~2178). Đã sửa cả 2.
- Vị trí thứ 3 (`totalCost > 0 ? ... : "—"`, tổng chi phí cộng dồn, 2 chỗ) —
  hỏi người dùng, **quyết định giữ nguyên** làm UX có chủ đích (ẩn tổng khi
  bằng 0 để tránh hiểu nhầm "miễn phí"), không sửa code.
- Hiệu chỉnh `.ai/provenance-audit.md`: bỏ câu "guard/test đầy đủ" quá mạnh
  cho `c611489` (thay bằng liệt kê rõ khoảng trống: không chứng minh
  authorization, thiếu test anonymous/viewer/no-op/rollback); bỏ câu "không
  phát hiện thêm bug nào khác"; làm rõ audit là documentation-only, fix là
  hành động riêng sau quyết định người dùng; điều chỉnh đánh giá rủi ro
  GanttChart minWidth (không còn kết luận "rủi ro thấp" khi chưa xác minh
  viewport hẹp).
- Hiệu chỉnh `.ai/orchestration.md`: thêm 2 file bị thiếu vào historical/
  high-conflict list (`mutations.integration.test.ts`, `GanttChart.tsx`); làm
  mềm quy tắc "1 PR/1 owner" thành "owner rõ + review đúng vùng"; thêm OPS vào
  dependency graph; đánh dấu FE-05 (1,556 dòng) và QLT-04 (gate ≥80% chung) là
  superseded bởi `claude-plan.md` v3, không xoá để giữ lịch sử.

## Verification

- `pnpm run typecheck`: pass.
- `pnpm run lint`: pass, 1 cảnh báo cũ (Fast Refresh, không liên quan).
- `pnpm run test`: pass, 13 file / 45 test.
- `pnpm run build`: pass; Architecture chunk 258.64 kB / 67.97 kB gzip (không
  đổi đáng kể); main 552.86 kB / 168.39 kB gzip.

## Files changed (tổng cộng cả phiên Bước 0)

- `src/pages/architecture/page.tsx` (6 vị trí falsy-zero, tổng)
- `.ai/provenance-audit.md`, `.ai/orchestration.md`, `.ai/final-report.md`,
  `.ai/codex-review.md`, `.ai/claude-plan.md` (đã sửa trước đó)

## Risk còn lại

Thấp. Chưa commit. `pnpm run check` vẫn fail đúng lý do đã biết từ đầu Giai
đoạn 0 (Prettier scope chưa thu hẹp, không phải regression mới) — việc này là
bước tiếp theo của Giai đoạn 0, chưa làm trong phiên này.

# Giai đoạn 0 — hoàn tất (Prettier scope, CI, coverage baseline thật)

Date: 2026-08-08

## Completed

- **Prettier scope thu hẹp.** `.prettierignore` loại `.ai/**`, `.claude/**`,
  `.convex/local/**`, `AGENTS.md`, `CLAUDE.md` (lý do ghi trong file) — số
  file lệch format giảm từ 57 xuống 41, đúng "mã nguồn/cấu hình sản phẩm".
  Format 41 file trong 1 commit riêng (`fabf6db`), verify diff chỉ là
  whitespace/import-wrap/quote-style, không đổi logic.
- **CI thật lần đầu tiên.** `.github/workflows/quality.yml` chạy
  prettier→lint→typecheck→test+coverage→build, frozen lockfile, pnpm pinned
  qua corepack, concurrency cancel, timeout 15 phút. Trước đó chỉ có
  `seed.yml`.
- **Phát hiện quan trọng: coverage baseline cũ (63.54%/56.12%) là
  "imported-files coverage", không đại diện toàn ứng dụng.** `vitest.config.ts`
  chưa bật `coverage.all`, nên report chỉ tính file được test suite import —
  gần như toàn bộ `src/pages/**` (bao gồm `architecture/page.tsx` 2.972 dòng)
  vô hình trong report, không hiện cả ở mức 0%. Bật `all: true` +
  `include: src/**, convex/**` cho ra số thật: **14.26% statements / 6.48%
  branches / 14.66% lines**. Đã kiểm tra loại `src/components/ui/**` (shadcn)
  khỏi denominator — chỉ nâng lên ~17.76%/7.48%, xác nhận gap thật nằm ở
  business logic chưa test, không phải do UI boilerplate. Quyết định (đã hỏi
  Codex, xem `.ai/codex-review.md` review #4): không blanket-exclude
  `src/components/ui/**`.
- Threshold coverage đặt đúng số đo được **sau khi format xong** (số dòng đổi
  do reformat), có sub-threshold riêng cho `convex/domain/**`.
- `pnpm run check` sửa để chạy `test:coverage` một lần thay vì `test` rồi lại
  chạy coverage riêng — tránh chạy suite 2 lần.
- `.ai/claude-plan.md` Giai đoạn 3: ratchet 2 mốc cũ (70/60, 80/70) viết lại
  thành thang nhiều mốc gần hơn (25/15 → 40/30 → 55/45 → 70/60 → 80/70) vì
  khoảng cách từ baseline thật đến 70% là ~5 lần khối lượng test hiện có,
  không vừa trong một Giai đoạn 3 5–7 ngày như giả định cũ.
- README.md tối thiểu (trước đó không có) trỏ về `.ai/` làm nguồn kế hoạch.

## Verification

- `pnpm run check`: **xanh toàn bộ lần đầu tiên trong phiên này** (prettier,
  lint, typecheck, test+coverage 45/45, build).
- Build: main 552.86 kB / 168.40 kB gzip; Architecture chunk 258.64 kB /
  67.99 kB gzip — không đổi đáng kể so với trước format.

## Files changed (2 commit)

- `fabf6db` — 42 file, thuần format (`.prettierignore` + 41 file product code).
- `9a6985e` — `package.json`, `vitest.config.ts`, `.github/workflows/quality.yml`
  (mới), `README.md` (mới), `.ai/claude-plan.md`.

## Next

Giai đoạn 0 hoàn tất theo tiêu chí kế hoạch (trừ việc branch protection trên
GitHub — nằm ngoài phạm vi sửa code, cần bạn bật thủ công). Bước tiếp theo là
Giai đoạn 1 (DATA-05/06/07 tách 3 PR, FE-03 hoàn tất mutation reliability) theo
đúng thứ tự trong `.ai/claude-plan.md` v3.
