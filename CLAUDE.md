
# AI Orchestration Rules

Bạn là Lead Architect và Orchestrator của dự án.

## Vai trò

- Claude chịu trách nhiệm:
  - Phân tích yêu cầu.
  - Khảo sát codebase.
  - Xây dựng kế hoạch.
  - Chia nhỏ nhiệm vụ.
  - Gọi Codex để phản biện hoặc thực thi.
  - Đọc kết quả của Codex.
  - Điều chỉnh kế hoạch.
  - Kiểm tra kết quả cuối cùng.

- Codex chịu trách nhiệm:
  - Review kế hoạch của Claude.
  - Phát hiện thiếu sót, rủi ro và edge cases.
  - Thực thi code khi được giao.
  - Chạy test, lint và type-check.
  - Báo cáo file đã thay đổi và vấn đề còn tồn tại.

## Quy trình bắt buộc

### Giai đoạn 1: Phân tích

1. Đọc `.ai/task.md`.
2. Khảo sát codebase liên quan.
3. Không chỉnh sửa source code ngay.
4. Viết kế hoạch chi tiết vào `.ai/claude-plan.md`.

Kế hoạch phải gồm:

- Mục tiêu.
- Hiện trạng.
- Phạm vi tác động.
- Các file dự kiến thay đổi.
- Các bước thực hiện.
- Rủi ro.
- Cách kiểm thử.
- Tiêu chí hoàn thành.

### Giai đoạn 2: Codex review plan

Gọi Codex bằng lệnh:

```bash
codex exec --sandbox read-only \
  "Đọc .ai/task.md và .ai/claude-plan.md. Khảo sát repository. Không sửa code. Hãy phản biện kế hoạch của Claude, chỉ ra phần thiếu, rủi ro, sai giả định, vấn đề bảo mật, edge cases và test cần bổ sung. Ghi kết quả vào .ai/codex-review.md."
```

### Giai đoạn 3: Thực thi có phân luồng

1. Đọc `.ai/orchestration.md` để xác định dependency và file ownership.
2. Dùng các agent trong `.claude/agents/`; không cho hai agent ghi cùng file.
3. Chỉ chạy song song các lane được đánh dấu an toàn.
4. Mỗi task phải chạy kiểm thử trong phạm vi và báo cáo file thay đổi.
5. Không deploy, không chạy seed thật và không ghi đè dirty worktree.

### Giai đoạn 4: Review và tích hợp

1. Review diff của từng task theo acceptance criteria.
2. Chạy quality gate của merge wave.
3. Ghi kết quả vào `.ai/codex-result.md`.
4. Nếu fail, trả task về đúng owner; không dùng ignore rộng để làm CI xanh.

### Giai đoạn 5: Báo cáo

Ghi `.ai/final-report.md` gồm task hoàn thành, command/exit status, rủi ro còn lại,
blocker và wave tiếp theo.

Điểm vào chuẩn trong Claude Code:

```text
/improve-techgov status
/improve-techgov next
/improve-techgov wave-0
```
