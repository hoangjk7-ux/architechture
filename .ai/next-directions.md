# Định hướng phát triển tiếp theo (sau Wave 3) — SUPERSEDED

> **Đã thay thế bởi `.ai/claude-plan.md` (2026-08-08).** Codex phản biện
> (`.ai/codex-review.md`) đã bác bỏ giả định "3 commit ngoài luồng agent" ở mục 0
> bên dưới và chỉ ra số liệu coverage/bundle ở đây là artefact cũ, chưa đo tại
> HEAD. Dùng `.ai/claude-plan.md` làm nguồn kế hoạch chính thức; file này giữ lại
> chỉ để tham chiếu lịch sử.

Ngày ghi: 2026-08-08
Căn cứ: `.ai/final-report.md` (Wave 0–3), `.ai/orchestration.md` (backlog SEC/DATA/FE/QLT),
`git log` (các commit sau Wave 3 chưa được log vào final-report).

## 0. Việc cần đối soát trước khi mở wave mới

Ba commit sau ngày Wave 3 (2026-08-05) chưa có checkpoint tương ứng trong
`.ai/final-report.md`:

- `563fd38` Localize dashboard and settings
- `c611489` Log module feature changes and fix Gantt timeline text sizing
- `9daed39` Redesign department architecture view

~~Đây đều chạm vào file thuộc vùng sở hữu FE (`src/pages/architecture/**`,
`src/i18n/**`) nhưng có vẻ được làm ngoài luồng agent.~~ **Sai — xem
`.ai/codex-review.md`:** `563fd38` nằm trên nhánh
`agent-system-performance-auth-hardening`; `c611489` có
`Co-Authored-By: Claude Sonnet 5` và còn sửa cả schema/backend, không chỉ FE;
`9daed39` chưa đủ metadata để kết luận provenance. Trước khi giao Wave 4, cần:
(a) xác nhận các thay đổi này đã qua `pnpm run check`, (b) cập nhật lại
"dirty-file protection" list trong `orchestration.md` nếu các file đó nay đã
sạch, (c) ghi bổ sung một checkpoint ngắn vào `final-report.md` để không mất
dấu vết audit.

## 1. Wave 4 — theo đúng dependency graph đã định nghĩa

`SEC-04 + DATA-04 + FE-03 + QLT-03 → QLT-04 → QLT-05 → final hardening` đã đủ
điều kiện tiên quyết (tất cả 4 nhánh đã merge ở Wave 1–3). Ưu tiên theo thứ tự:

1. **QLT-04 – Coverage gates.** Wave 2 ghi nhận coverage tụt còn ~62.69%
   aggregate (domain validators 98.33%) sau khi tính cả mutation modules. Cần
   thêm test cho CRUD surface trước khi ratchet threshold tổng thể lên ≥80%;
   domain/security giữ ≥95%.
2. **QLT-05 – Critical E2E.** Login/logout thật (không còn SimpleAuth), CTO
   CRUD, viewer bị từ chối, cascade/restrict, roadmap hierarchy, mobile nav,
   language switch — đúng như acceptance đã định nghĩa.
3. **FE-08 – Bundle budget.** Follow-up Wave 3 nêu rõ: route Architecture vẫn
   ~254 kB minified / 67 kB gzip, cần tách ReactFlow/Gantt/editor thành chunk
   riêng, target gzip ban đầu <150 kB.
4. **DATA-05 / DATA-06.** Audit model tổng quát hoá (entity/actor/action/changed
   fields + index + pagination) và tối ưu index/pagination cho list/detail
   query — cả hai đều được Wave 2/3 note là còn nợ.
5. **FE-05 / FE-06 / FE-07.** Tách trang Architecture (đã redesign ở commit
   `9daed39`, nên review lại độ dài file trước khi tách tiếp), chuẩn hoá i18n
   có type-safe key union, thêm URL-synced search/filter/sort/pagination cho
   các list lớn (systems/vendors/integrations).

## 2. Nợ kỹ thuật / rủi ro còn mở (trích từ các checkpoint trước)

- **Runtime/deploy gate chưa chạy:** cấu hình Google client ID/secret + Convex
  Auth env, chạy CTO bootstrap mutation trên deployment không phải production,
  smoke test login → refresh → protected query → sign-out. Chưa có bằng chứng
  các bước này đã thực hiện thật (ngoài phạm vi seed/deploy của agent).
- **Seed vẫn non-idempotent** dù đã có guard xác nhận deployment — cần DATA-07.
- **Lint còn cảnh báo** (Fast Refresh/memo) — dọn nốt trong FE-03/FE-05 thay vì
  để tồn đọng qua nhiều wave.
- **Roadmap tree lớn** có thể vượt quá một Convex transaction khi xoá đệ quy —
  cần đánh giá bulk job nếu dữ liệu thật tăng quy mô.

## 3. Định hướng ngoài phạm vi 4 trục hiện tại (đề xuất mở, cần bạn quyết định)

- **Quan sát & vận hành:** chưa thấy structured logging/error tracking (Sentry
  hay tương đương) hay metrics cho Convex functions — nên cân nhắc trước khi
  go-live thật.
- **Feature flag / rollout:** vì auth fail-closed là thay đổi phá vỡ tương
  thích ngược (mọi user hiện tại bị đăng xuất), nên có kế hoạch thông báo/migrate
  người dùng thay vì chỉ dựa vào "release constraint" ghi trong orchestration.
- **CI thực thi thật:** kiểm tra `.github/workflows/quality.yml` (QLT-02) đã
  chạy xanh trên nhánh `main` gần nhất chưa — final-report chỉ ghi lại kết quả
  local.

## 4. Cách khởi động

Theo entrypoint chuẩn đã định nghĩa trong `CLAUDE.md`:

```text
/improve-techgov status   # xem wave hiện tại và task còn lại
/improve-techgov next     # để orchestrator tự chọn task kế tiếp theo dependency graph
/improve-techgov wave-4   # nếu muốn ép chạy thẳng Wave 4
```

Khuyến nghị chạy `status` trước để xác nhận danh sách dirty-file protection
còn hợp lệ, tránh agent Frontend bị chặn nhầm bởi các file đã được người dùng
tự merge xong (mục 0).
