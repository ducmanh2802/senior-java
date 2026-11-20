# T2528R — Fact-check nội dung mới của T2528

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đã sửa 3 lỗi kỹ thuật trong file js/data/q-api.js (api-081–api-084):
1. **api-081**: Thêm `@Transactional(readOnly = true)` vào method export JPA stream (lưu ý trong text đã khuyến nghị nhưng code thiếu).
2. **api-082**: Sửa `PayloadTooLargeException` (không phải class Spring thật) → `MaxUploadSizeExceededException` (class hợp lệ). Sửa chuỗi "Tomcat swallow oversized request → 413" (Tomcat silently swallow, không trả 413; 413 đến từ Spring MaxUploadSizeExceededException).
3. **api-082**: Xem validate.js → OK, build-light-index.js → OK.

Không có lỗi markup, dữ liệu toàn bộ hợp lệ. Ghi chú: tất cả content api-081–api-084 đúng kỹ thuật (timezone UTC, chunked upload, async export, long-running report design), theo AGENTS.md mục 6 (3000–5000 ký tự cho câu system design/api không bị báo cảnh báo dưới 1500 ký tự), schema đúng (id format, topic, level, follow 2-3 item, no extra fields, refs tùy chọn).
