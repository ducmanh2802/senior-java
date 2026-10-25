# T148R — Fact-check nội dung mới của T148

Status: DONE
Agent: opencode
Owns: `js/data/glossary-java.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T148 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK (35 entry, không lỗi).
node scripts/check-links.mjs glossary-java.js → 36 link, 0 hỏng.
Chỉnh sử file chỉ nằm ở T148 side: `js/data/glossary-java.js` (35 entry, mặt sau `Status: DONE`).

## Notes
- Kiểm tra chi tiết từng entry (happens-before → type-erasure): cơ chế, ví dụ, mệnh đề, ký hiệu kỹ thuật đều đúng; không có flag bịa, API bịa, mặc định sai, cơ chế nói ngược, hay số liệu vô căn cứ.
- Không tìm thấy chữ nước ngoài lẫn vào văn bản chính; chỉ có ký hiệu kỹ thuật (SQL, flag, tiêu chuẩn) trong `~~~text` phù hợp nghĩa.
- Comment đầu file (10 dòng schema) ở HEAD, ko chỉnh; không thêm/xoá mục.
- `node scripts/test-lessons.js` nội dung này ko liên quan, không chạy (nó kiểm tra lessons-architecture, lesson-… trên T130/T115, ngoài scope T148R).
- Không sửa file nào khác; không git commit.
