# Codex review — phản biện .ai/next-directions.md (Wave 4 draft)

Ngày: 2026-08-08
Cách chạy: `codex exec --sandbox read-only` (Codex không thể ghi file trong sandbox
này — `apply_patch` bị từ chối bởi read-only mount; Claude ghi lại nguyên văn kết
luận của Codex vào file này sau khi nhận output).

## Kết luận chính

1. **Nhận định "3 commit ngoài luồng agent" trong next-directions.md mục 0 là SAI,
   cần sửa:**
   - `563fd38` (Localize dashboard and settings) nằm trên nhánh
     `agent-system-performance-auth-hardening` — có dấu hiệu rõ thuộc luồng agent.
   - `c611489` (Log module feature changes and fix Gantt timeline text sizing) có
     `Co-Authored-By: Claude Sonnet 5` trong message — chắc chắn có agent tham gia.
   - `9daed39` (Redesign department architecture view) không có metadata đủ để kết
     luận; provenance chỉ nên ghi là "chưa xác định", không phải "ngoài luồng".
   - Thêm vấn đề ownership: `c611489` không chỉ sửa FE mà còn sửa schema, backend
     và integration test — cắt ngang ranh giới sở hữu DATA/FE quy định trong
     `orchestration.md`.

2. **Coverage/bundle claim trong final-report.md và next-directions.md là STALE,
   chưa xác minh tại HEAD:**
   - Artefact `coverage/` có timestamp 2026-08-04, cũ hơn cả ba commit trên.
   - `vitest.config.ts` không cấu hình coverage threshold nào — con số ≥80%/≥95%
     trong Definition of Done chưa từng được enforce tự động.
   - `pnpm run check` không chạy `test:coverage` — coverage gate không nằm trong
     gate CI/local chuẩn.
   - `dist/` build lúc 03:52 ngày 2026-08-06 — sau `c611489` nhưng **trước**
     `9daed39` (04:15). Số liệu main 552,861 B / 167,934 B gzip và Architecture
     258,578 B / 67,738 B gzip đại diện cho trạng thái trước redesign cuối cùng,
     không phải HEAD hiện tại.
   - (Claude đã build lại tại HEAD sau review này — xem `.ai/claude-plan.md` mục
     Hiện trạng để lấy số liệu mới.)

3. **Wave 4 dependency chưa thực sự đủ điều kiện** như next-directions.md giả định:
   - `.github/workflows/quality.yml` **không tồn tại** — QLT-02 (CI) chưa hoàn
     thành, dù final-report.md Wave nào đó ngụ ý đã có gate.
   - `prettier-check` hiện fail trên 54 file — bao gồm cả các trang vừa sửa.
   - FE-03 (mutation UX) **chưa đạt**: Integrations và Roadmap vẫn xoá theo kiểu
     fire-and-forget rồi toast thành công ngay, không await/rollback khi lỗi.
   - DATA-05 (audit tổng quát), DATA-06 (query optimization), DATA-07 (seed
     idempotent) vẫn còn thiếu như next-directions.md đã ghi, nhưng đây là
     **blocker cho QLT-04/QLT-05**, không phải việc có thể làm song song tuỳ ý.

4. **Acceptance FE khác cũng chưa đạt** ("No page remains over 500 lines"):
   - `architecture/page.tsx`: 2,972 dòng (tăng gần gấp đôi so với 1,556 dòng ghi
     trong orchestration.md — do commit `9daed39`).
   - `systems/page.tsx`: 735 dòng.
   - `vendors/page.tsx`: 586 dòng.

5. **Audit model (DATA-05) cần thêm ràng buộc** ngoài "generalize" chung chung:
   actor ID bất biến, cursor-based pagination, bound cho `limit`, chính sách
   retention/redaction, và một entity model thực sự tổng quát (không riêng cho
   role-change).

6. **Test còn thiếu**, nên bổ sung trước khi coi Wave 3 là ổn định:
   - Concurrent last-CTO role change (race condition).
   - Session expiry/revocation.
   - Audit: authorization để đọc audit log + atomicity khi ghi.
   - Invalid/negative pagination limits.
   - Mutation failure + double-click / double-submit.
   - Xoá roadmap tree rất lớn (giới hạn transaction).
   - Accessibility: 320px viewport, 200% zoom, keyboard-only, axe scan.
   - Lazy chunk load failure (network lỗi khi code-split).
   - Architecture view với score = 0 (falsy-but-valid edge case).

## Khuyến nghị thứ tự (khác với next-directions.md gốc)

Chèn thêm **Wave 3.5** trước khi vào Wave 4:

1. Audit provenance + nội dung thật của 3 commit sau Wave 3 (đặc biệt `c611489`
   vì đã sửa chéo sang DATA/backend).
2. Khôi phục/khởi tạo CI thật (QLT-02) — hiện không tồn tại.
3. Đo lại coverage và bundle size tại HEAD, không dùng artefact cũ.

Sau đó mới hoàn tất FE-03 (mutation UX) + DATA-05/06/07, rồi mới tới QLT-04
(coverage gate), FE-05–08 (extraction/i18n/bundle), và cuối cùng QLT-05 (E2E).

## Giới hạn của review này

Chạy trong sandbox `read-only`: Codex không build lại được (Vite cần ghi
`node_modules/.vite-temp`, bị `EROFS`), nên không tự đo số liệu HEAD — phần đó do
Claude bổ sung bằng cách build/test trực tiếp (có quyền ghi) ngay sau khi nhận
review.

---

# Codex review #2 — phản biện .ai/claude-plan.md (kế hoạch hợp nhất 5 giai đoạn)

Ngày: 2026-08-08. Cách chạy: `codex exec --sandbox read-only` (không ghi file
được, Claude lưu lại nguyên văn kết luận sau khi nhận output).

## Kết luận chính

Kế hoạch 5 giai đoạn hợp lý và đã khắc phục phần lớn vấn đề trong bản trước,
nhưng **chưa nên thực thi nguyên trạng**. Bốn chỉnh sửa quan trọng:

1. Baseline bundle gzip ghi sai nhẹ; một số baseline chỉ xác nhận qua artifact,
   không tự chạy lại được trong sandbox read-only.
2. Bước "audit provenance" ở Giai đoạn 0 chưa đủ sâu để bảo vệ Giai đoạn 1–2.
3. Giai đoạn 4 không nên giao trọn cho `quality-engineer`; cần workstream `OPS`
   với ownership/dependency rõ ràng.
4. Coverage, PR ordering, phạm vi Prettier và tiêu chí production readiness còn
   vài mâu thuẫn nội bộ.

## 1. Baseline — số liệu cần sửa

- Gzip thực đo trên artifact: main **167,934 B** (~167.93 kB), Architecture
  **67,738 B** (~67.74 kB) — khác với số vite tự báo trong lần build của Claude
  (168.40 kB / 67.97 kB). Chênh lệch nhỏ nhưng có thật (đo bằng công cụ/level
  gzip khác nhau) — kế hoạch nên ghi rõ **công cụ đo** để tránh nhiều baseline
  khác nhau, không chỉ ghi một con số.
- `45/45 test` Codex không tự chạy lại được (Vite ghi `node_modules/.vite-temp`
  → `EROFS` trong sandbox) — nên ghi là "xác minh bởi lần chạy tại HEAD ngày
  2026-08-08", không phải "xác minh độc lập bởi review này".
- **"Domain/security lines ≥95%" bị diễn giải sai**: 95.45% là coverage của
  `convex/domain` (validators thuần), không phải coverage gộp domain+security.
  Cần đặt threshold/glob riêng cho `convex/domain/**`, `convex/security/**` và
  các helper auth/RBAC, đo từng nhóm riêng — không suy diễn security coverage
  từ domain coverage.
- **54 file Prettier gồm cả `.ai/claude-plan.md`, `.claude/skills/**`,
  `.convex/local/**`, `AGENTS.md`, `CLAUDE.md`** — sau khi thu hẹp đúng scope
  (chỉ file sản phẩm), con số 54 gần như chắc chắn sẽ đổi. Không nên cam kết
  trước "format 54 file"; nên: xác định scope → đo lại → chỉ format tập nằm
  trong gate sản phẩm.

## 2. Audit provenance ở Giai đoạn 0 — chưa đủ

Xác nhận file bị đổi trong từng commit:

- `563fd38`: `language.tsx`, `Index.tsx`, `settings/page.tsx` — trên nhánh
  `agent-system-performance-auth-hardening` (bằng chứng hỗ trợ, không chứng
  minh nội dung đã được review).
- `c611489`: `convex/domain/mutations.integration.test.ts`, `convex/schema.ts`,
  `convex/system_change_logs.ts`, `convex/system_modules.ts`,
  `language.tsx`, `GanttChart.tsx`, `systems/page.tsx` — trộn **3 vùng ownership**
  (DATA: schema/audit/mutation; FE: Gantt/Systems/i18n; ảnh hưởng Security vì
  actor lấy qua authentication). Vi phạm nguyên tắc "một task ID/một commit".
  Audit log hiện tại trong commit này **chỉ lưu** `systemId, systemName, action,
  changes, actorName, actorEmail` — chưa có actor ID bất biến, entity model
  tổng quát, cursor pagination hay retention/redaction; query nhận `limit`
  chưa bound/validate (`.take(args.limit ?? 100)`). Đây là nợ kỹ thuật cần
  migration, không chỉ là vi phạm ownership.
- `9daed39`: `language.tsx`, `architecture/page.tsx` — không đủ metadata, giữ
  nguyên "chưa xác định".

**Vì sao chưa đủ:** chỉ xác nhận file + vi phạm ownership không phát hiện được
logic ẩn/hồi quy hành vi. Cần bổ sung: đọc diff đầy đủ (không chỉ `--stat`), map
từng thay đổi sang acceptance criterion, kiểm tra guard/validation/transaction
boundary, xác định test nào thật sự chứng minh hành vi mới, lập behavioral
baseline cho `9daed39` (screenshot, tab/interaction matrix, score calculation,
loading/error/empty, keyboard/mobile) trước khi refactor.

**2 mâu thuẫn trong PR `chore/provenance-audit`:**
- Gọi là "read-only, không đổi code" nhưng lại yêu cầu sửa `orchestration.md`/
  `final-report.md` → nên đổi thành "Documentation-only; không thay đổi
  application/runtime code".
- Không nên "cập nhật dirty-file protection" bằng cách giữ nguyên snapshot cũ —
  tách 2 khái niệm: *current dirty files* (sinh lại từ `git status` tại lúc bắt
  đầu task — hiện tại chỉ `.ai/` dirty, source tree sạch) vs *historical/
  high-conflict files* (từng bị nhiều luồng sửa, cần review ownership).

## 3. Owner Giai đoạn 4 — đề xuất bảng ownership `OPS`

Không giao trọn cho `quality-engineer`. Đề xuất:

| Hạng mục | Accountable | Reviewer/phối hợp |
|---|---|---|
| Dependency inventory, vulnerability decision log | OPS | QLT + owner package |
| Vite/TS/Vitest, CI bundle gate | QLT | OPS |
| React/Router, Radix/Tailwind, diagram/chart | FE | QLT |
| Convex/Auth upgrade | SEC | DATA, OPS |
| Security headers, Vercel config | OPS | SEC |
| Structured logging, error tracking, alert policy | OPS | SEC/DATA/FE |
| Staging smoke và runbook | OPS | SEC/DATA/FE |
| Auth rollback | SEC | OPS |
| Schema/data migration rollback | DATA | OPS |
| Bundle/performance regression | FE | QLT |

`OPS` cần thêm vào `orchestration.md`: owned files (deployment config, runbook,
observability config, smoke script), quy tắc không tự deploy/dùng production
credentials, dependency vào Giai đoạn 0–3, handoff khi cần staging
access/secrets, acceptance + evidence sau smoke. Production readiness không
thể hoàn tất chỉ bằng repo — cần explicit human/credential gate, đúng phạm vi
gốc "không deploy production, không dùng credential thật". "Không còn
critical/high dependency chưa có quyết định xử lý" là tiêu chí hợp lý hơn "phải
nâng mọi dependency" — chấp nhận rủi ro có owner/lý do/expiry cũng hợp lệ.

## 4. Rủi ro/thiếu sót còn lại (tóm tắt theo nhóm)

**Quality/CI:** `check` chạy `test` rồi lại `test:coverage` sẽ chạy suite 2
lần — nên để coverage thay thế test trong full gate, hoặc tách `check:fast` /
`check`. "PR không merge được khi gate fail" cần branch protection ngoài repo,
không chỉ YAML. Ratchet coverage cần `include`/`all: true` rõ ràng để tránh bị
thao túng bởi file mới không được tính.

**PR ordering:** E2E/characterization đặt sau frontend extraction là rủi ro —
cần thêm PR `test/architecture-characterization` (khóa hành vi `9daed39`: score
0, tab switching, mobile/keyboard, screenshot) **trước**
`refactor/architecture-modules`. PR `data/audit-pagination-seed` nên tách 3:
`data/generalized-audit`, `data/query-pagination`, `data/idempotent-seed`.

**Audit/dữ liệu:** actor cần ID bất biến (không chỉ name/email mutable); audit
write phải cùng transaction với business change; cần allowlist/redaction cho
`changedFields`; cursor ổn định (dùng index, không dùng timestamp đơn khi trùng
giờ); validate `limit` là integer dương có max; test audit visibility theo
role + chống enumeration; seed idempotency cần key tự nhiên/version, không chỉ
"find by display name"; roadmap deletion đệ quy cần bound trước hoặc resumable
job có trạng thái.

**CTO/auth concurrency:** cần test 2 mutation demote/delete CTO cạnh tranh.
Định nghĩa "active CTO" hiện phụ thuộc `isManuallyAdded`, trong khi bootstrap
tạo CTO với `isManuallyAdded: true` — cần audit state transition
invitation/bootstrap → authenticated user để CTO bootstrap không bị loại khỏi
last-CTO protection ngoài dự kiến. Thiếu edge case: invitation trùng
email khác casing/Unicode, session revoke giữa lúc mutation pending, demote ở
tab khác không đồng bộ UI, OAuth retry tạo duplicate user, concurrent bootstrap,
sign-out khi mất mạng với cached protected data.

**Frontend:** xác nhận trực tiếp 2 lỗi FE-03 — `Integrations.removeIntegration`
và `Roadmap.removeItem` không await, toast success ngay. Thiếu edge case:
double-click khi response bị mất, dialog unmount giữa mutation pending, xoá
parent làm trang hiện tại rỗng, pagination trỏ ngoài range sau filter/delete,
lazy-chunk lỗi do deploy xoá asset hash cũ, `score=0`/chuỗi rỗng/cost=0 bị xử lý
như "missing", circular import khi tách Architecture. Mục tiêu "<150 kB gzip"
cần định nghĩa rõ: entry hay tổng initial JS, có tính shared vendor chunk
không, đo ở route nào, gzip hay brotli — nếu không, bundler có thể "pass giả"
bằng cách dồn code sang shared chunk.

**Dependency/production:** major upgrade cần compatibility matrix chứ không chỉ
đọc changelog; Convex/Auth upgrade cần canary/staging vì có thể buộc toàn bộ
user đăng nhập lại; cần lock runtime version rõ (CI dùng Node 20); cần
PII scrubbing/sampling cho error tracking; CSP thực tế cho Convex/Google
OAuth/Vercel; rollback schema cần forward-fix/expand-contract plan thay vì
rollback thẳng; cần health signal (auth failure rate, mutation error rate,
latency, rate limiting) và chưa thấy kế hoạch rate limiting cho
auth/invite/bootstrap.

## Thứ tự điều chỉnh đề xuất

```text
0. Provenance + semantic diff audit + behavior inventory
1. Prettier scope và quality baseline
2. CI + exact coverage baseline/ratchet
3. Audit model migration
4. Pagination/index migration
5. Idempotent seed
6. Mutation reliability
7. Architecture characterization tests/screenshots
8. Frontend extraction/i18n
9. Coverage expansion
10. Critical E2E/a11y
11. Route-aware bundle budget
12. Dependency PRs theo owner
13. OPS staging readiness, observability và rollback rehearsal
```

---

# Codex review #3 — phản biện .ai/provenance-audit.md + orchestration.md + patch avg=0

Ngày: 2026-08-08. Chạy sau khi Bước 0 (Giai đoạn 0) hoàn thành lần đầu.

## Kết luận chính

Patch `avg=0` đúng, có thể commit riêng. Nhưng audit/orchestration ban đầu có
vài kết luận **quá mạnh** so với bằng chứng thật — đã sửa trực tiếp vào
`.ai/provenance-audit.md` và `.ai/orchestration.md` (không lặp lại toàn văn ở
đây, xem 2 file đó để có bản đã sửa). Tóm tắt các điểm sai/thiếu quan trọng
nhất mà Codex tìm ra:

1. **Bug avg=0 không phải bug falsy-zero duy nhất trong file.** Tìm thêm 4 vị
   trí cùng lớp liên quan `costPerYear`/`totalCost`: dòng ~1576
   (`{system.costPerYear && (...)}` ẩn cả block), dòng ~2178 (cùng lớp avg=0),
   và dòng ~1801/~2031 (`totalCost > 0 ? ... : "—"`, nhưng đây là tổng cộng
   dồn nên cần quyết định sản phẩm chứ không chỉ là bug hiển thị). → Đã sửa 2
   vị trí đầu, 2 vị trí sau được xác nhận là quyết định UX có chủ đích (giữ
   nguyên, không sửa).
2. **Câu "guard/test đầy đủ" cho `c611489` quá mạnh.** Test mới đọc log qua
   `ctx.db` trực tiếp, không qua query có guard `requireRole` — không chứng
   minh authorization. Thiếu test anonymous/viewer bị từ chối, no-op update,
   audit-write-failure rollback. `create` chỉ log 2 field, `remove` không log
   field nào — audit coverage chưa đầy đủ, cần liệt kê tường minh trong
   DATA-05.
3. **`provenance-audit.md` tự mâu thuẫn** giữa "documentation-only" và việc
   ghi lại đã sửa runtime code — cần làm rõ trình tự (audit tìm bug →
   quyết định → fix riêng).
4. **Historical/high-conflict file list thiếu 2 file**:
   `convex/domain/mutations.integration.test.ts` và
   `src/pages/flow-diagram/_components/GanttChart.tsx` — cũng bị `c611489`
   trộn ownership nhưng bản đầu bỏ sót.
5. **GanttChart `minWidth: svgWidth` (~1004px)** có nguy cơ horizontal
   overflow trên viewport hẹp — bản đầu kết luận "rủi ro thấp, không cần test"
   là quá sớm khi chưa xác minh trên viewport thật.
6. **Dependency graph chưa có OPS**, dù OPS đã được thêm vào workstream list.
7. **FE-05 (1,556 dòng) và QLT-04 (overall ≥80%, domain/security ≥95% như một
   gate)** trong `orchestration.md` đã lỗi thời so với baseline/ratchet trong
   `claude-plan.md` v3 — cần đánh dấu superseded, không xoá (giữ lịch sử).
8. **Quy tắc "1 PR chỉ chạm file của đúng 1 owner"** quá cứng so với model
   accountable+reviewer của bảng OPS — nên là "1 task/commit có owner rõ và
   review đúng vùng", không phải cấm tuyệt đối chạm chéo vùng.
9. **"Current dirty files" tự lỗi thời trong vài phút** — ngay sau khi audit
   ghi "chỉ `.ai/*.md` dirty", việc sửa bug avg=0 đã khiến
   `src/pages/architecture/page.tsx` dirty trở lại. Nhấn mạnh: đây luôn là
   snapshot tại thời điểm task bắt đầu, phải sinh lại bằng `git status`, không
   bao giờ dùng làm sự thật cố định.

## Readiness

Không có blocker để tiếp tục phần scoping/read-only còn lại của Giai đoạn 0.
Có blocker (đã xử lý) đối với việc coi Bước 0 là "hoàn tất cuối cùng" trước
khi các điểm trên được sửa trong tài liệu.
