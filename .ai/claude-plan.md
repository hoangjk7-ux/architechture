# TechGov — Kế hoạch nâng cấp hợp nhất v3 (5 giai đoạn, sau 2 vòng Codex review)

Ngày: 2026-08-08. v3 tích hợp phản biện lần 2 của Codex (`.ai/codex-review.md`,
mục "Codex review #2") vào bản v2. Thay đổi chính so với v2: mở rộng bước audit
Giai đoạn 0 thành audit hành vi/semantic (không chỉ provenance), sửa số liệu
baseline, tách PR audit/pagination/seed làm 3, chèn PR characterization test
trước khi refactor Architecture, và thêm bảng ownership `OPS` cho Giai đoạn 4.

Thời lượng ước tính: 4–6 tuần. Không nâng dependency hàng loạt trước — dựng lại
quality gate và xử lý rủi ro dữ liệu trước.

## Baseline tại HEAD (đã sửa theo Codex review #2 — ghi rõ công cụ đo)

- TypeScript/Lint/Test: đạt qua lần chạy trực tiếp tại HEAD ngày 2026-08-08
  (không phải xác minh độc lập bởi review sandbox, vì Codex không build lại
  được trong `read-only` — Vite ghi `node_modules/.vite-temp` → `EROFS`).
  Lint: 1 cảnh báo Fast Refresh (`language.tsx:518`).
- Test: 45/45 đạt (13 file).
- Coverage (vitest v8, `pnpm run test:coverage`): 63.54% statements, 65.61%
  lines, 56.12% branches, 56.21% functions. **`convex/domain` (validators
  thuần) = 95.45% stmt / 98.33% line — đây KHÔNG phải "domain+security"
  gộp.** Chưa có coverage riêng cho security/RBAC/auth helper module; cần đo
  tách biệt trước khi đặt threshold ≥95% cho nhóm đó.
- Bundle (đo 2 cách, ghi cả hai vì lệch nhau do công cụ khác nhau):
  - Vite build report tại HEAD (build trực tiếp, `pnpm run build`): main
    552.86 kB minified / **168.40 kB gzip**; Architecture chunk 258.58 kB
    minified / **67.97 kB gzip**.
  - Đo byte thô trên artifact `dist/` bằng gzip khác (Codex, không rebuild
    được): main 552,861 B minified / **167,934 B (~167.93 kB) gzip**;
    Architecture 258,578 B / **67,738 B (~67.74 kB) gzip**.
  - Kết luận: minified khớp tuyệt đối; gzip lệch ~0.3–0.5 kB do phương pháp đo
    khác nhau. **Từ Giai đoạn 0 trở đi, chỉ dùng số do `vite build` tự báo cáo
    làm nguồn baseline chính thức**, ghi kèm ngày đo.
- `pnpm run check`: **thất bại** — Prettier báo 54 đường dẫn lệch format,
  nhưng danh sách này gồm cả `.ai/claude-plan.md`, `.claude/skills/**`,
  `.convex/local/**`, `AGENTS.md`, `CLAUDE.md` — **chưa lọc theo scope sản
  phẩm**. Số file thật cần format sau khi thu hẹp scope sẽ khác 54 — không cam
  kết trước con số này (xem Giai đoạn 0).
- CI: **không có quality workflow**, chỉ có `.github/workflows/seed.yml`.
- Điểm nóng độ dài file: `architecture/page.tsx` 2,972 dòng, `seed.ts` 1,106
  dòng, `systems/page.tsx` 735 dòng, `vendors/page.tsx` 586 dòng,
  `language.tsx` 526 dòng.
- Working tree tại thời điểm lập kế hoạch: chỉ `.ai/*.md` dirty (file kế hoạch
  của phiên này); **source tree sạch**. Danh sách "dirty-file protection" cũ
  trong `orchestration.md` là snapshot lịch sử, không còn phản ánh working
  tree hiện tại — cần tách 2 khái niệm (xem Giai đoạn 0, Bước 0).

### Provenance 3 commit sau Wave 3 (đã xác nhận file bị đổi trong từng commit)

| Commit | File đổi | Provenance | Vấn đề |
|---|---|---|---|
| `563fd38` | `language.tsx`, `Index.tsx`, `settings/page.tsx` | Trên nhánh `agent-system-performance-auth-hardening` (bằng chứng hỗ trợ, chưa chứng minh đã review) | — |
| `c611489` | `convex/domain/mutations.integration.test.ts`, `convex/schema.ts`, `convex/system_change_logs.ts`, `convex/system_modules.ts`, `language.tsx`, `GanttChart.tsx`, `systems/page.tsx` | `Co-Authored-By: Claude Sonnet 5` | **Trộn 3 vùng ownership** (DATA: schema/audit/mutation; FE: Gantt/Systems/i18n; ảnh hưởng Security vì actor lấy qua authentication) — vi phạm "một task ID/một commit". Audit log hiện chỉ lưu `systemId, systemName, action, changes, actorName, actorEmail` — thiếu actor ID bất biến, entity model tổng quát, cursor pagination, retention/redaction; `limit` chưa bound/validate (`.take(args.limit ?? 100)`) |
| `9daed39` | `language.tsx`, `architecture/page.tsx` | Không đủ metadata | Provenance "chưa xác định" — cần behavioral baseline trước khi refactor |

## Giai đoạn 0 — Chuẩn hoá baseline, audit hành vi và CI

Thời gian: 3–4 ngày (tăng từ 2–3 ngày do mở rộng phạm vi audit) · Ưu tiên: P0
Owner: `quality-engineer` (Bước 0 do Claude/orchestrator làm, documentation-only)

**Bước 0 — Provenance + semantic/behavior audit (mở rộng theo Codex, KHÔNG chỉ
xác nhận tác giả).** Bắt buộc trước Giai đoạn 1 và trước PR
`refactor/architecture-modules` ở Giai đoạn 2:

1. Đọc **diff đầy đủ** của `563fd38`, `c611489`, `9daed39` (không chỉ
   `--stat`).
2. Map từng thay đổi sang task ID/acceptance criterion trong `orchestration.md`.
3. Kiểm tra guard, validation, schema migration, transaction boundary trong
   phần `c611489` chạm backend/schema.
4. Xác định test nào **thật sự chứng minh** hành vi mới (không chỉ tồn tại).
5. Với `9daed39`: lập **behavioral baseline** cho `architecture/page.tsx`
   trước khi refactor — screenshot các tab, interaction matrix, cách tính
   score (đặc biệt `score = 0`), loading/error/empty state, hành vi
   keyboard/mobile. Baseline này là oracle cho PR
   `test/architecture-characterization` ở Giai đoạn 2.
6. Ghi quyết định cho từng phần: accept / cần sửa / cần revert có kiểm soát /
   cần thêm test — không để mơ hồ "ngoài luồng agent" hay "an toàn" chung
   chung.
7. Đánh dấu audit log hiện tại trong `c611489` là **nợ kỹ thuật cần migration**
   (không chỉ vi phạm ownership) — feed thẳng vào DATA-05 ở Giai đoạn 1.
8. Cập nhật `orchestration.md`, tách rõ 2 khái niệm: **current dirty files**
   (sinh lại từ `git status` tại thời điểm bắt đầu — hiện tại chỉ `.ai/`) và
   **historical/high-conflict files** (từng bị nhiều luồng sửa, cần ownership
   review, ví dụ các file trong `c611489`).
9. Ghi checkpoint ngắn vào `final-report.md`.

PR cho bước này: `chore/provenance-semantic-audit`. **Sửa mô tả so với v2** —
KHÔNG gọi là "read-only, không đổi code" (vì có sửa `orchestration.md`/
`final-report.md`), mà ghi: *"Documentation-only; không thay đổi
application/runtime code."*

**Sau Bước 0:**
- Xác định phạm vi Prettier vào mã nguồn/cấu hình sản phẩm; loại
  `.convex/local`, tài liệu skill, artefact máy cục bộ, `.ai/**` khỏi gate.
  **Đo lại** số file lệch format sau khi thu hẹp scope — không dùng số "54"
  làm cam kết cứng.
- Format tập file trong scope, trong **một commit riêng**
  (`chore/quality-baseline`), tách khỏi mọi thay đổi logic.
- Tạo `.github/workflows/quality.yml`: `pnpm install --frozen-lockfile` →
  prettier → lint → typecheck → test+coverage → production build. **Chạy
  coverage một lần** (thay thế bước `test` thường trong gate đầy đủ, hoặc tách
  `check:fast` không coverage / `check` có coverage) — tránh chạy suite 2 lần
  như v2 vô tình gây ra. Có cache pnpm, timeout, concurrency cancellation.
- Ngưỡng coverage CI ở giai đoạn này đặt **đúng bằng số đo được** (statements
  63.54%, branches 56.12% — không làm tròn "≈63/55") để chặn thụt lùi; ratchet
  thật lên Mốc 1/2 diễn ra ở Giai đoạn 3. Đặt threshold/glob **riêng** cho
  `convex/domain/**` (giữ ≥95%, đã đạt) và một glob riêng khi có
  security/RBAC helper module rõ ràng — không gộp chung "domain/security".
  Bật `include`/`all: true` trong config coverage để tránh file mới không
  được tính vào tổng.
- Ghi rõ: "PR không merge khi gate fail" cần **branch protection/ruleset ở
  GitHub repo settings**, không chỉ định nghĩa trong YAML — đây là việc ngoài
  phạm vi sửa code, cần bạn (chủ repo) bật thủ công.
- Ghi bundle/coverage baseline tự động trong CI (artifact hoặc job summary);
  xác định retention, không upload dữ liệu/config nhạy cảm.
- Thêm `README.md` tối thiểu ở root — không phải blocker P0, có thể làm sau
  nếu thời gian hạn chế.

Tiêu chí hoàn thành:
- `pnpm run check` xanh tại local và CI (coverage chạy đúng 1 lần trong gate).
- Không auto-format thư mục ngoài phạm vi ứng dụng.
- Kết luận provenance + behavioral baseline được ghi rõ ràng, có quyết định
  từng phần, không còn mơ hồ.
- Bảng dirty-file trong `orchestration.md` phản ánh đúng `git status` hiện tại.

## Giai đoạn 1 — Toàn vẹn dữ liệu và vận hành an toàn

Thời gian: 5–7 ngày (tăng nhẹ do tách PR) · Ưu tiên: P0
Owner: `data-integrity-engineer` (+ `security-engineer` review riêng phần audit
log vì actor lấy qua authentication, và phần CTO concurrency)

Tách PR `data/audit-pagination-seed` (v2) thành 3, theo đề nghị Codex vì gộp 3
thay đổi lớn rủi ro review/rollback cao:

**PR `data/generalized-audit` (DATA-05):**
- Actor **ID bất biến** (không chỉ name/email mutable) + snapshot display
  field nếu cần hiển thị lịch sử; entity type/entity ID tổng quát; action;
  changed fields qua **allowlist/redaction**, không dump object tuỳ ý.
- Audit write **cùng transaction** với business mutation (atomic).
- Cursor pagination dùng **index**, không dùng timestamp đơn (tránh sai thứ tự
  khi nhiều record cùng giờ).
- Validate `limit`: integer hữu hạn, dương, có max — từ chối input âm/vượt/
  sai kiểu.
- Phân quyền đọc audit log theo role + test chống enumeration.
- Retention/redaction cho dữ liệu nhạy cảm; xử lý rõ khi actor/user bị xoá
  (compliance hold).
- Schema migration: additive/backfill trước khi enforce required field.

**PR `data/query-pagination` (DATA-06):**
- Index cho systems/vendors/integrations/roadmap.
- Thay full-scan bằng indexed/paginated list/detail query.
- Cursor pagination cho list contract hiện tại cần **migration/hỗ trợ tạm
  thời** thay vì đổi đồng loạt (tránh vỡ frontend contract).

**PR `data/idempotent-seed` (DATA-07):**
- Idempotency dùng **key tự nhiên/version**, không chỉ "find by display name".
- Định nghĩa rõ semantics khi seed lỗi giữa chừng (retry an toàn, không tạo
  bản ghi trùng/nửa vời).
- Giữ nguyên guard xác nhận deployment đã có (Wave 2).

**PR `fix/mutation-reliability` (FE-03 hoàn tất):**
- Xác nhận trực tiếp 2 lỗi: `Integrations.removeIntegration(...)` và
  `Roadmap.removeItem(...)` không `await`, toast success ngay dù chưa có phản
  hồi server.
- Sửa: confirm dialog → await mutation → disable trong lúc pending → toast chỉ
  sau khi resolve → giữ dialog mở khi lỗi.
- Bổ sung xử lý: double-click khi response đầu bị mất, dialog unmount/navigate
  giữa lúc mutation pending, xoá parent làm danh sách hiện tại thành trang
  rỗng.

**Roadmap tree lớn:** giới hạn transaction trước khi xoá đệ quy, hoặc dùng
resumable job có trạng thái rõ ràng (tránh partial-delete semantics không xác
định).

**CTO/auth concurrency (mới, từ Codex review #2):**
- Test 2 mutation demote/delete CTO cạnh tranh (race condition thật, không chỉ
  giả định Convex serialization là đủ).
- Audit định nghĩa "active CTO" hiện tại: logic phụ thuộc `isManuallyAdded`
  trong khi CTO bootstrap tạo user với `isManuallyAdded: true` — cần xác nhận
  CTO bootstrap **không bị loại khỏi** last-CTO protection ngoài dự kiến do
  cách check này.
- Edge case cần thêm: invitation trùng email khác casing/Unicode normalization;
  session revoke/expiry khi mutation dialog đang mở; user bị demote ở tab này
  nhưng tab khác vẫn hiển thị UI cũ; OAuth callback/retry tạo duplicate user;
  bootstrap retry/concurrent bootstrap; sign-out khi mất mạng với cached
  protected data còn trong client.

Tiêu chí hoàn thành:
- Seed chạy lại không tạo bản ghi trùng, kể cả khi thất bại giữa chừng lần
  trước.
- Pagination input âm/quá lớn/sai kiểu bị từ chối ổn định.
- Không thể mất CTO cuối cùng trong mutation đồng thời (có test race thật).
- Mọi thay đổi đặc quyền có audit atomic + test authorization + anti-enumeration.
- Không còn mutation fire-and-forget ở Integrations/Roadmap.

## Giai đoạn 2 — Tái cấu trúc frontend

Thời gian: 6–9 ngày (tăng do thêm characterization test) · Ưu tiên: P1
Owner: `frontend-engineer`

**PR `test/architecture-characterization` (MỚI, bắt buộc trước
`refactor/architecture-modules`)** — dùng behavioral baseline từ Giai đoạn 0
Bước 0.5 để khoá hành vi hiện tại của `architecture/page.tsx` (2,972 dòng, vừa
redesign ở `9daed39`, provenance chưa xác định): test/screenshot cho score
tính đúng kể cả `score = 0`, tab switching, mobile/keyboard, loading/error/
empty. Không có oracle này thì "không đổi hành vi nghiệp vụ" ở PR sau chỉ là
khẳng định suông.

**PR `refactor/architecture-modules`:**
```text
architecture/
├── page.tsx
├── components/
├── dialogs/
├── tabs/
├── hooks/
├── model/
└── utils/
```
- Tách department view, scoring, diagram, editor, dialog thành module độc lập.
- Lazy-load React Flow, Gantt, editor theo tab.
- Cẩn thận **circular import** và tái render lớn nếu state boundary không được
  thiết kế trước khi tách.

**PR `refactor/lists-and-i18n`:**
- Tách `systems/vendors` thành list, form, dialog, hooks.
- Dictionary ra khỏi `language.tsx`; type-safe translation keys; dọn nốt cảnh
  báo Fast Refresh còn lại.
- Chuẩn hoá loading/empty/error/mutation states còn sót.
- Đồng bộ search/filter/sort/page với URL — xử lý case pagination trỏ tới
  trang vượt range sau filter/delete.
- Error UI + reload/retry khi lazy chunk load thất bại (kể cả do deploy mới
  xoá asset hash cũ).
- Xử lý `score = 0`, chuỗi rỗng, `cost = 0`, `order = 0` — không được coi là
  "missing"/falsy.
- Accessibility: 320px viewport, zoom 200%, keyboard-only, reduced motion,
  focus restoration sau khi đóng dialog.
- i18n: nhãn tiếng Việt/Anh dài, timezone/date boundary, currency locale.

**Định nghĩa lại mục tiêu bundle** (Codex chỉ ra "<150 kB gzip" chưa đủ rõ để
làm gate, dễ bị "pass giả" nếu bundler dồn code sang shared chunk):
- Đo **tổng initial JS route-aware** (entry + mọi chunk cần cho lần tải đầu ở
  route mặc định), không chỉ tên file `index-*.js`.
- Ghi rõ có tính shared vendor chunk không, đo bằng gzip hay brotli, và dùng
  đúng công cụ đo đã chốt ở Giai đoạn 0 (`vite build` report).

Mục tiêu:
- Không page nghiệp vụ nào vượt 500 dòng.
- Initial JS route-aware dưới 150 kB gzip (đo theo định nghĩa trên).
- Architecture chỉ tải thư viện nặng khi người dùng cần.
- Không đổi hành vi nghiệp vụ — verify bằng PR characterization test ở trên,
  không chỉ bằng lời khẳng định trong PR description.

## Giai đoạn 3 — Nâng chất lượng kiểm thử

Thời gian: 5–7 ngày · Ưu tiên: P1 · Owner: `quality-engineer` (phối hợp
`data-integrity-engineer`/`security-engineer` cho test theo domain)

Ratchet coverage (không ép thẳng 80% toàn repo), số chính xác thay vì làm tròn:
- Mốc 1: lines ≥70%, branches ≥60%.
- Mốc 2: lines ≥80%, branches ≥70%.
- `convex/domain`: giữ ≥95% (đã đạt 95.45%, không để tụt).
- Security/RBAC/auth helper: đo và đặt threshold **riêng** sau khi Giai đoạn 0
  xác định đúng glob — không suy diễn từ số domain.

Ưu tiên test cho module coverage thấp hiện tại: `integrations.ts` (31%),
`vendors.ts` (33%), `software_systems.ts` (45%), `config.ts` (49%),
routing/lazy loading (`routeModules.ts` 15%).

Thêm test (đã hợp nhất cả 2 vòng review Codex): session expiry/revocation;
concurrent last-CTO update; audit authorization + atomicity + anti-enumeration;
mutation failure/double-click; `score = 0`; roadmap tree lớn; code-split
network failure; invitation email casing/Unicode; OAuth retry/duplicate user;
concurrent bootstrap; sign-out khi mất mạng với cached data.

E2E (Playwright): login/logout, CRUD, RBAC, cascade/restrict, mobile nav,
language switch. Accessibility scan: keyboard-only, axe, viewport 320px, zoom
200%.

Tiêu chí hoàn thành:
- Threshold coverage enforce trong CI, đo đúng 1 lần trong gate, `include`
  đầy đủ file.
- Có E2E cho hành trình P0.
- Viewer không thể thao tác quản trị ở cả UI và backend.

## Giai đoạn 4 — Dependency, hiệu năng và production readiness

Thời gian: 5–7 ngày · Ưu tiên: P1 trước go-live
**Owner: workstream mới `OPS`** (không giao trọn `quality-engineer` như v2 —
phạm vi bao trùm dependency, security, frontend performance, observability,
deployment config, operational rollout). Cần bổ sung `OPS` vào
`orchestration.md` với owned files (deployment config, runbook, observability
config, smoke script), quy tắc không tự deploy/dùng production credentials,
dependency vào Giai đoạn 0–3, handoff rõ khi cần staging access/secrets.

| Hạng mục | Accountable | Reviewer/phối hợp |
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

Nội dung:
- Audit dependency theo nhóm, PR riêng từng nhóm. **Major upgrade cần
  compatibility matrix**, không chỉ đọc changelog.
- Convex/Auth upgrade cần canary/staging + kiểm tra session compatibility — có
  thể buộc toàn bộ user đăng nhập lại, phải có kế hoạch thông báo.
- Khoá rõ runtime version (CI hiện dùng Node 20; dependency mới có thể đổi
  yêu cầu).
- Bundle budget route-aware vào CI (theo định nghĩa đã chốt ở Giai đoạn 2).
- Error tracking cần PII scrubbing, sampling, tách môi trường; structured
  logging cần correlation/request ID và quy ước stable error code.
- Security headers cần CSP thực tế cho Convex, Google OAuth, Vercel và
  error-tracking endpoint.
- Runtime smoke trên non-production: Google login, refresh session, protected
  query, role guard, sign-out, CTO bootstrap, seed — dùng dataset cô lập, có
  cleanup/retry plan.
- **Rollback không phải lúc nào cũng khả thi cho schema** — cần kế hoạch
  forward-fix/expand-contract thay vì giả định rollback thẳng.
- Cần health/operational signal: auth failure rate, mutation error rate,
  latency, rate limiting/abuse, alert ownership. Hiện **chưa có kế hoạch rate
  limiting** cho auth/invite/bootstrap — cần bổ sung.
- Backup/restore rehearsal hoặc tối thiểu xác nhận khả năng phục hồi dữ liệu
  trước go-live.

Tiêu chí hoàn thành:
- Không còn dependency critical/high **chưa có quyết định xử lý** (chấp nhận
  rủi ro có owner/lý do/expiry cũng là một quyết định hợp lệ — không bắt buộc
  phải nâng mọi dependency).
- Production smoke checklist đạt trên staging — đây là **human/credential
  gate**, không thể hoàn tất chỉ bằng thay đổi trong repository.
- Có dashboard lỗi và quy trình rollback (forward-fix) được ghi lại.

## Thứ tự pull request đề xuất (v3, theo khuyến nghị Codex review #2)

```text
0.  chore/provenance-semantic-audit   (documentation-only)
1.  chore/quality-baseline            (scope Prettier xác định trước, không cam kết 54 file)
2.  ci/quality-gates                  (coverage baseline đúng số đo, chạy 1 lần)
3.  data/generalized-audit            (DATA-05)
4.  data/query-pagination             (DATA-06)
5.  data/idempotent-seed              (DATA-07)
6.  fix/mutation-reliability          (FE-03)
7.  test/architecture-characterization (MỚI — khoá hành vi trước khi refactor)
8.  refactor/architecture-modules     (FE-05)
9.  refactor/lists-and-i18n           (FE-04/06/07)
10. test/coverage-ratchet             (QLT-04)
11. test/critical-e2e-a11y            (QLT-05)
12. perf/bundle-budget                (FE-08, định nghĩa route-aware)
13. chore/dependency-upgrades         (theo bảng owner OPS/QLT/FE/SEC)
14. ops/production-readiness          (OPS, cần credential gate riêng)
```

Sau mỗi PR chạy `pnpm run check`; không trộn format toàn repo, refactor và
thay đổi nghiệp vụ vào cùng một commit. Giai đoạn 0 và 1 là điều kiện bắt buộc
trước khi mở rộng tính năng — khớp release constraint đã ghi trong
`orchestration.md` (không ship fail-closed auth tách rời khỏi migration
frontend).

## Rủi ro tổng hợp (hợp nhất 2 vòng Codex review)

- Bỏ qua audit hành vi (không chỉ provenance) có thể khiến Giai đoạn 1/2 sửa
  chồng lên logic ẩn hoặc phá vỡ hành vi chưa được ghi nhận trong `c611489`/
  `9daed39`.
- Đặt coverage threshold bằng số làm tròn hoặc quá cao ngay từ đầu sẽ hoặc che
  giấu regression nhỏ hoặc chặn CI ngay lập tức — phải dùng số đo chính xác và
  ratchet có mốc.
- Giai đoạn 4 không có owner rõ nếu không tạo workstream `OPS` — task sẽ không
  được agent nào nhận khi chạy `/improve-techgov`.
- Tách `architecture/page.tsx` là rủi ro hồi quy UI cao nhất — bắt buộc có
  characterization test làm oracle trước khi refactor, không dựa vào review
  thủ công đơn thuần.
- CI mới có thể vô tình chạy seed/deploy nếu copy sai template — review kỹ
  workflow trước khi merge.
- "PR không merge khi gate fail" cần hành động ngoài code (branch protection
  trên GitHub) — nếu bỏ qua, gate CI chỉ mang tính tham khảo.
- Production readiness (Giai đoạn 4) phụ thuộc credential/staging access thật
  — không thể tự động hoá hoàn toàn bằng agent, cần điểm chốt con người rõ
  ràng trước go-live.
- Định nghĩa "active CTO" hiện tại (`isManuallyAdded`) có thể khiến CTO
  bootstrap vô tình nằm ngoài last-CTO protection — cần audit trước khi coi
  SEC-05 là đóng hoàn toàn.
