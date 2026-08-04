# TechGov production hardening and 10/10 improvement

Mục tiêu: nâng TechGov lên production-ready theo bốn trục Security, Data
Integrity, Frontend/UX và Quality/CI. Claude Code phải điều phối công việc theo
`.ai/orchestration.md`, không sửa chồng lên thay đổi chưa commit và không coi việc
ẩn UI là authorization.

Ưu tiên bắt buộc:

1. Thiết lập một session authentication thật cho Convex; Google callback trả JSON
   hiện tại không được xem là một phiên đăng nhập.
2. Xóa cơ chế unauthenticated fallback thành CTO và bảo vệ mọi public Convex
   function bằng policy phía server.
3. Thêm validation và deletion/reference policy để không tạo dangling data.
4. Chuẩn hóa loading/error/empty, mutation UX, mobile navigation, accessibility,
   i18n và lazy route.
5. Bắt buộc lint, typecheck, test và build trong CI.

Không nằm trong phạm vi:

- Deploy production, dùng credential thật hoặc chạy seed trên deployment thật.
- Tự ý sửa hoặc format project `OpenHands/`.
- Ghi đè các thay đổi chưa commit của người dùng.

Definition of Done tổng thể:

- Không thể đọc/ghi dữ liệu protected khi chưa xác thực.
- Permission matrix được kiểm thử ở backend.
- Không mutation nào tạo reference sai hoặc dữ liệu ngoài constraint.
- Mọi destructive UI action đều confirm, await, pending và xử lý lỗi.
- Tất cả route hợp lệ truy cập được trên mobile và các luồng chính đạt WCAG AA.
- Initial bundle được code-split và không còn chunk ứng dụng trên 1 MB.
- `pnpm run check` xanh; CI dùng đúng command này.
