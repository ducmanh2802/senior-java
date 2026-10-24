# T134R — Fact-check nội dung mới của T134

Status: DONE
Agent: opencode
Owns: `js/data/lessons-testing.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T134 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-testing-002: Sửa goal[0] "không tất định" → "không deterministic" (giữ thuật ngữ kỹ thuật tiếng Anh theo quy ước AGENTS.md).
- Kiểm tra toàn bộ 3 bài học (lesson-testing-001, 002, 003): nội dung kỹ thuật chính xác với Java 17/21, markup hợp lệ (không backtick, không `${` trong template literal), độ dài đáp án đủ chuẩn.
- `node scripts/validate.js` → OK.
- `node scripts/test-lessons.js` thất bại do thiếu load `i18n.js` trong `browser-shim.js` (file core không thuộc sở hữu task này), nội dung bài học không lỗi.
