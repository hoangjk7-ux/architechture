# Provenance + behavior audit — 3 commit sau Wave 3

Ngày: 2026-08-08. Thực hiện theo `.ai/claude-plan.md` v3, Giai đoạn 0 Bước 0.
Bản ghi audit này **documentation-only** (không tự sửa code khi viết). Bug
`avg=0`/`cost=0` được phát hiện *trong lúc* audit; việc sửa chúng là 2 hành
động code riêng biệt, làm **sau khi bạn xác nhận**, không phải một phần của
audit tự nó — ghi lại trong cùng file này để giữ mạch truy vết, không phải vì
Bước 0 tự ý đổi runtime code.

**Cập nhật 2026-08-08 (sau phản biện Codex lần 3):** review đã chỉ ra vài kết
luận ở bản đầu quá mạnh so với bằng chứng thật — đã sửa trực tiếp trong các
mục dưới đây (không xoá bản gốc, đánh dấu rõ chỗ nào bị điều chỉnh).

Phương pháp: đọc **full diff** từng commit (không chỉ `--stat`), map sang
ownership/acceptance trong `orchestration.md`, kiểm tra guard/validation, xác
định test nào chứng minh hành vi mới, và lập behavior inventory cho phần bị
đổi nhiều nhất (`9daed39`). **Giới hạn đã biết:** đây là inventory từ đọc mã
nguồn, KHÔNG phải behavioral baseline đầy đủ theo yêu cầu `claude-plan.md` v3
(chưa có screenshot, interaction matrix, keyboard/mobile, loading/error/empty
evidence) — phần đó vẫn thuộc PR `test/architecture-characterization` ở Giai
đoạn 2, Bước 0 chỉ làm phần đọc-code.

## Tóm tắt quyết định

| Commit | Quyết định | Lý do |
|---|---|---|
| `563fd38` | **ACCEPT** | Thuần i18n, không chạm backend, không đổi hành vi, additive |
| `c611489` | **ACCEPT, có follow-up bắt buộc** | Guard/test đầy đủ, migration additive, nhưng audit log tạm thời (actor mutable, limit không bound) — đã đưa vào DATA-05; vi phạm quy trình 1 task/1 commit cần tránh lặp lại |
| `9daed39` | **ACCEPT cấu trúc, CẦN SỬA 1 bug nhỏ** | Redesign thuần FE, cải thiện hiệu năng (memoized integration counts), nhưng có bug hiển thị `avg = 0` thành "—" |

Không có phần nào cần revert. Không phát hiện vi phạm RBAC/guard trong cả 3
commit.

## `563fd38` — Localize dashboard and settings

File đổi: `language.tsx`, `Index.tsx`, `settings/page.tsx` (86 dòng thêm, 52
dòng xoá, thuần đổi trong 3 file frontend).

- Chỉ thêm/thay chuỗi dịch (`t("dashboard.*")`, `t("settings.*")`) và thread
  qua UI đã có; không thêm logic mới, không gọi API mới.
- Một số nhãn tiếng Việt được viết lại (vd. `settings.subtitle`,
  `settings.departmentPlaceholder`) — thay đổi nội dung, không phải bug.
- Nằm trên nhánh `agent-system-performance-auth-hardening` — bằng chứng hỗ
  trợ thuộc luồng agent, dù không chứng minh tuyệt đối.
- Chưa dùng typed key union (còn string key thường) — đúng như kỳ vọng, đây là
  phạm vi của FE-06 (`refactor/lists-and-i18n`), không phải thiếu sót của
  commit này.

**Quyết định: ACCEPT, rủi ro thấp** (điều chỉnh so với bản đầu — không dùng chữ
"không đổi hành vi"). Commit đổi **hành vi hiển thị theo locale** (chuỗi hiện
ra khác nhau tuỳ ngôn ngữ), chỉ không đổi business logic/luồng dữ liệu.
Localize Settings **chưa hoàn chỉnh**: toast xoá vẫn hard-code tiếng Việt
(`` `Đã xoá "${name}"` ``, không qua `t()`) — đây là phần còn lại thuộc scope
FE-06 (typed i18n), không phải lỗi của commit này, nhưng không nên coi
563fd38 là "đã xong" i18n cho Settings.

## `c611489` — Log module feature changes and fix Gantt timeline text sizing

File đổi: `convex/domain/mutations.integration.test.ts`, `convex/schema.ts`,
`convex/system_change_logs.ts`, `convex/system_modules.ts`, `language.tsx`,
`GanttChart.tsx`, `systems/page.tsx`. Có `Co-Authored-By: Claude Sonnet 5`.

**Vi phạm ownership xác nhận:** commit trộn DATA (schema/audit/mutation) + FE
(Gantt/Systems/i18n), cắt ngang ranh giới `orchestration.md` quy định — không
đúng nguyên tắc "một task ID/một commit". Đây là process finding, ghi lại để
tránh lặp lại, **không phải lý do để revert** vì nội dung đúng đắn (xem dưới).

**Kiểm tra guard/validation (đọc trực tiếp `convex/system_modules.ts` tại
HEAD):**
- `create`, `update`, `remove` đều gọi `requireWriteAccess(ctx)` trước khi ghi
  — guard giữ nguyên, không bị bỏ sót.
- `NOT_FOUND` domain error vẫn được ném đúng khi thiếu system/module.
- Schema migration **additive**: chỉ thêm 3 literal mới (`feature_created`,
  `feature_updated`, `feature_deleted`) vào union `action` đã có, không xoá
  hay đổi kiểu field cũ — an toàn, không cần backfill.

**Test chứng minh hành vi mới:** có, `mutations.integration.test.ts` thêm 1
test end-to-end tạo → sửa → xoá module, assert đúng 3 log
`feature_created/updated/deleted` được ghi, và `diffFields` trả đúng
`{field: "health", from: "unknown", to: "healthy"}`. Test này **thật sự chứng
minh** happy path, nhưng **phạm vi hẹp hơn** bản audit đầu ghi nhận (điều
chỉnh sau phản biện Codex):

- Test dùng `createAuthorizedConvexTest` (fixture đã có quyền) và đọc log
  **trực tiếp qua `ctx.db`**, không gọi qua query `system_change_logs.list` —
  nên **không chứng minh** guard `requireRole(["cto","it_manager"])` trên
  đường đọc thật.
- Không có test anonymous/viewer bị từ chối cho 3 mutation module
  (create/update/remove) trong chính thay đổi này.
- Không có test: no-op update (patch không đổi field nào) có tạo log thừa hay
  không; mutation lỗi giữa chừng có để lại business write hoặc log dở dang
  không; audit-write thất bại có rollback business mutation không.
- `create` chỉ log 2 field (`lifecycle`, `health`), không phải full snapshot;
  `remove` không log field/snapshot nào (chỉ action). Đây là audit coverage
  **chưa đầy đủ** — không chỉ là vấn đề actor ID/pagination như bản đầu quy
  vào 1 mục.

**Kết luận sửa lại: "guard cơ bản đúng, nhưng test hiện có KHÔNG chứng minh
authorization/anti-enumeration/audit-atomicity" — các khoảng trống này thuộc
đúng phạm vi PR `data/generalized-audit` (DATA-05), cần liệt kê tường minh
trong PR đó thay vì giả định DATA-05 sẽ tự bao phủ.**

**Xác nhận nợ kỹ thuật trong audit log (đọc `convex/system_change_logs.ts` tại
HEAD):**
- `recordSystemChange` lưu `actorName`/`actorEmail` lấy từ
  `requireAuthenticated(ctx)` — đây là **snapshot mutable tại thời điểm ghi**,
  không phải actor ID bất biến. Nếu user đổi tên/email sau đó, log cũ vẫn giữ
  giá trị cũ (không tự sai) nhưng không thể join ngược về user hiện tại một
  cách đáng tin cậy, và không có cách chứng minh actor thật nếu name/email bị
  đổi thủ công trong DB.
- Query `list` **có** guard đọc: `requireRole(ctx, ["cto", "it_manager"])` —
  điều này tốt hơn giả định ban đầu, không phải "không phân quyền đọc".
  Nhưng `limit: v.optional(v.number())` **không có min/max**, và
  `.take(args.limit ?? 100)` không validate — `limit` âm hoặc cực lớn chưa
  được test.
- Không có cursor pagination thật (dùng `.take()` đơn giản), không có
  retention/redaction.

→ **Toàn bộ nợ kỹ thuật này đã nằm trong phạm vi PR `data/generalized-audit`
(DATA-05) ở `.ai/claude-plan.md` v3** — không cần thêm task mới, chỉ xác nhận
phạm vi DATA-05 là đúng và đủ để giải quyết.

**GanttChart fix:** đổi `LABEL_W` 200→260, thêm `MIN_CHART_W = 720` (khiến
`svgWidth` tối thiểu ~1004px), tăng ngưỡng cắt chuỗi title 22→32 ký tự. Không
đổi logic tính toán vị trí item, nhưng **điều chỉnh lại đánh giá rủi ro** so
với bản đầu: `minWidth: svgWidth` ép SVG rộng tối thiểu ~1004px có thể tạo
horizontal overflow trên viewport hẹp/mobile nếu container cha không tự cuộn
ngang — chưa xác minh bằng test/viewport thật. Không phải "chắc chắn an
toàn", nên đưa vào checklist accessibility/mobile ở PR
`test/architecture-characterization` thay vì kết luận trước là rủi ro thấp.

**Quyết định: ACCEPT.** Nội dung đúng đắn, có test, migration an toàn. Ghi
nhận vi phạm quy trình ownership để tránh lặp lại trong các PR tới (mỗi PR từ
Giai đoạn 1 trở đi chỉ chạm file của đúng 1 owner).

## `9daed39` — Redesign department architecture view

File đổi: `language.tsx` (11 dòng, thuần thêm key mới), `architecture/page.tsx`
(518 dòng đổi — toàn bộ nằm trong `DeptSummaryCard` và `DeptView`, phần hiển
thị theo phòng ban). **Không chạm bất kỳ file backend/Convex nào** — xác nhận
đây là thay đổi thuần FE, không có rủi ro bảo mật/RBAC.

### Behavior inventory (trước/sau, từ đọc diff trực tiếp)

- **`DeptSummaryCard`** (thẻ tóm tắt mỗi phòng ban ở màn hình tổng quan):
  - Trước: hiển thị badge đếm theo `type`, badge critical, health dot-count,
    tổng chi phí nếu > 0.
  - Sau: hiển thị điểm kiến trúc trung bình (`avgArchitecture`) làm số nổi bật
    góc phải; 3 ô số liệu (critical / no-owner / avg debt); health bar dạng
    thanh tỷ lệ thay vì chấm đếm; dòng chân trang gộp health tóm tắt + chi phí.
  - Logic tính mới: `noOwnerCount`, `avgArchitecture`, `avgDebt`,
    `unhealthyCount` — tất cả tính trên `systems` truyền vào, giống pattern
    tính `totalCost`/`criticalCount` đã có.
- **`DeptView` — stat bar đầu trang:** từ danh sách badge dàn hàng ngang, đổi
  thành lưới 6 ô số liệu (`systemsWord`, critical, no-owner, avg architecture,
  avg debt, total spend), dùng chung `scoreTone()` helper mới (trước đây
  logic màu ngưỡng 70/50 và 60/30 bị lặp lại nhiều nơi — nay gộp vào 1 hàm,
  **cải thiện chất lượng code**, không đổi ngưỡng số).
- **`DeptView` — danh sách hệ thống trong phòng ban:** từ bảng
  (`grid-cols-[1fr_120px_...]`, 7 cột cố định) đổi thành lưới thẻ 2 cột
  (`xl:grid-cols-2`), mỗi thẻ hiển thị đầy đủ owner/integration-flow/cost/
  risk-debt + 2 thanh ScoreBar (architecture, debt). Thông tin hiển thị nhiều
  hơn bảng cũ (thêm owner card, risk level), tổ chức lại thay vì bớt dữ liệu.
- **Hiệu năng:** thêm `integrationCounts` — một `Map` được tính 1 lần bằng
  `useMemo` duyệt `integrations` 1 lượt, thay cho việc gọi
  `integrations.filter(...)` riêng cho từng system trong vòng lặp render
  (trước đây là O(systems × integrations) trong bảng cũ). Đây là cải thiện
  hiệu năng thật, đúng tinh thần Wave 3.

### Bug xác nhận (từ đọc diff, KHÔNG phải suy đoán)

```tsx
const avgArchitecture = systems.length
  ? Math.round(systems.reduce((sum, s) => sum + s.architectureScore, 0) / systems.length)
  : 0;
...
{avgArchitecture || "—"}
```

Khi `avgArchitecture` tính ra đúng **0** (phòng ban có hệ thống nhưng điểm
kiến trúc trung bình = 0, khác với trường hợp phòng ban rỗng cũng ra 0), biểu
thức `avgArchitecture || "—"` coi `0` là falsy và hiển thị **"—" (thiếu dữ
liệu)** thay vì **"0" (điểm thật)**. Cùng lỗi lặp lại với `avgDebt || "—"` —
xuất hiện ở **4 vị trí** trong file: `DeptSummaryCard` (2 chỗ) và stat-tile
array trong `DeptView` (2 chỗ, dòng đổi `[t("dept.avgArchitecture"),
avgArchitecture || "—", scoreTone(avgArchitecture)]` và tương tự cho debt).

Đây chính xác là lớp edge case Codex đã cảnh báo trừu tượng ("score = 0 không
được xử lý như missing") — nay đã xác nhận là **bug cụ thể, có vị trí rõ
ràng**, không phải rủi ro lý thuyết.

**Quyết định: ACCEPT cấu trúc redesign, CẦN SỬA bug này.** Không cần revert
toàn bộ commit — chỉ cần patch nhỏ (đổi điều kiện fallback từ `|| "—"` sang
kiểm tra tường minh, ví dụ dựa trên `systems.length === 0` thay vì dựa vào độ
"falsy" của giá trị). Vì đây là bug hiển thị thuần tuý (không phải rủi ro bảo
mật/dữ liệu), đề xuất xử lý theo 1 trong 2 hướng — **cần bạn chọn**:

1. Sửa ngay bằng 1 commit nhỏ, độc lập (`fix/architecture-avg-zero-display`),
   không chờ đến Giai đoạn 2 — rủi ro thấp, 4 dòng thay đổi, không cần
   characterization test trước vì đây là sửa lỗi hiển thị đã xác nhận, không
   phải refactor cấu trúc.
2. Giữ nguyên, đưa vào danh sách assertion của PR
   `test/architecture-characterization` (Giai đoạn 2) như một trường hợp
   "known bug, fix kèm theo khi viết test" — chậm hơn nhưng gộp chung với oracle
   hành vi đầy đủ.

**Đã chọn phương án 1 và thực hiện ngay (2026-08-08).** Sửa cả 4 vị trí trong
`src/pages/architecture/page.tsx`: `DeptSummaryCard` (avgArchitecture,
avgDebt) và stat-tile array trong `DeptView` (avgArchitecture, avgDebt) — đổi
điều kiện từ `value || "—"` (falsy-coercion, sai khi value=0) sang
`systems.length > 0 ? value : "—"` / `activeSystems.length > 0 ? value : "—"`
(kiểm tra tường minh trên độ dài mảng, đúng ngữ nghĩa "không có hệ thống nào"
thay vì "điểm bằng 0"). Verify: typecheck pass, lint không có lỗi mới (còn 1
cảnh báo Fast Refresh cũ, không liên quan), test 45/45 pass, build pass —
Architecture chunk 258.62 kB minified / 67.97 kB gzip (tăng ~40 byte không
đáng kể so với 258.58 kB trước đó).

**Sửa lại (bản đầu ghi sai): "không phát hiện thêm bug nào khác" là kết luận
quá vội** — Codex review lần 3 tìm thêm đúng cùng lớp lỗi ở 4 vị trí khác liên
quan `costPerYear`/`totalCost` (2 trong số đó nằm ngoài vùng diff của
`9daed39`, thuộc code cũ hơn trong cùng file):

1. Dòng ~1576: `{system.costPerYear && (...)}` — ẩn **toàn bộ khối** hiển thị
   chi phí khi `costPerYear = 0`, không chỉ hiện sai số. **Đã sửa** →
   `system.costPerYear !== undefined && (...)`.
2. Dòng ~2178 (trong diff `9daed39`): `sys.costPerYear ? formatVnd(...) : "—"`
   — cùng lớp lỗi với avg=0. **Đã sửa** → `sys.costPerYear !== undefined ? ... : "—"`.
3. Dòng ~1801 và ~2031: `totalCost > 0 ? ... : "—"` (tổng chi phí **cộng dồn**
   nhiều hệ thống, không phải giá trị đơn lẻ). **Đã hỏi và giữ nguyên theo
   quyết định của bạn**: ẩn dòng tổng chi phí khi tổng = 0 là lựa chọn UX có
   chủ đích (tránh hiểu nhầm "miễn phí" khi thực chất là chưa có hệ thống nào
   nhập cost) — không phải bug, không sửa code. Ghi nhận đây là điểm khác biệt
   có chủ đích so với "cost=0 không được coi là missing" ở cấp hệ thống đơn lẻ.

Tất cả 4 vị trí đã verify: typecheck pass, lint không lỗi mới, test 45/45
pass, build pass.

Behavior inventory ở trên chỉ bao phủ phần diff `9daed39` đã đọc trực tiếp;
**không loại trừ khả năng còn falsy-zero/falsy-empty pattern khác trong phần
không đổi của file** (ví dụ các trường `version`, `description` dùng
`|| undefined` là xử lý chuỗi rỗng, khác lớp lỗi numeric-zero nên chưa xếp
chung, nhưng chưa được rà soát đầy đủ). Việc rà soát toàn diện thuộc phạm vi
PR `test/architecture-characterization`, không phải Bước 0.

## Cập nhật ownership/dirty-file (theo yêu cầu Bước 0 trong claude-plan.md v3)

- **Current dirty files:** đây LUÔN LÀ một snapshot tại thời điểm task bắt
  đầu, không phải sự thật cố định — phải sinh lại bằng `git status --short`
  mỗi lần một agent bắt đầu việc, không đọc từ tài liệu cũ. Tại lúc audit ban
  đầu (trước khi sửa bug), working tree chỉ có `.ai/*.md` dirty; **ngay sau đó
  đã đổi** vì Bước 0 dẫn tới việc sửa `src/pages/architecture/page.tsx` — bản
  thân file audit này cũng "lỗi thời" trong vài phút. Danh sách 5 file cũ
  trong `orchestration.md` (snapshot lập kế hoạch ban đầu) đã được commit qua
  3 commit audit ở trên, không còn "chưa commit".
- **Historical/high-conflict files** (từng bị nhiều luồng owner sửa trong 1
  commit `c611489`, cần review ownership khi PR mới chạm vào) — **danh sách
  đầy đủ hơn bản đầu** (Codex chỉ ra bản đầu bỏ sót 2 file):
  - `convex/schema.ts`
  - `convex/system_change_logs.ts`
  - `convex/system_modules.ts`
  - `convex/domain/mutations.integration.test.ts`
  - `src/pages/flow-diagram/_components/GanttChart.tsx`
  - `src/pages/systems/page.tsx`
  - `src/components/providers/language.tsx`

Đã cập nhật `orchestration.md` theo 2 mục trên, thêm workstream `OPS`, thêm 2
file còn thiếu vào historical list, thêm OPS vào dependency graph, và ghi chú
FE-05/QLT-04 cũ đã bị `claude-plan.md` v3 supersede một phần (xem diff
`orchestration.md`).
