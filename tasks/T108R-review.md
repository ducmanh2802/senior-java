# T108R — Fact-check nội dung mới của T108

Status: DONE
Agent: opencode
Owns: `js/views/career.js`, `css/views/career.css`, `index.html`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T108 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Đã đối chiếu nội dung mới trong `js/views/career.js` với AGENTS.md mục 15 và contract `js/core/ai.js`: `coach.star`/`coach.cv`, ngưỡng đầu vào (80/300 ký tự), shape kết quả và lưu/xoá dạng tombstone đều khớp; không phát hiện API hoặc tuyên bố kỹ thuật sai cần sửa.
- Không có nội dung theo ID câu hỏi/bài học trong các file sở hữu của T108; do đó không thêm/xoá mục và không chỉnh nội dung đã có ở HEAD.
- Kiểm tra `node --check js/views/career.js` và `node scripts/validate.js`: đạt (`OK — không có lỗi.`).
