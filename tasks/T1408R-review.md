# T1408R — Fact-check nội dung mới của T1408

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1408 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Không có lỗi kiến thức, markup, hay chữ nước ngoài trong nội dung mới của lessons-jpa.js (lesson-jpa-003, lesson-jpa-004).
- Kiểm tra: `node --check js/data/lessons-jpa.js` → OK; `node scripts/validate.js` không báo lỗi cho lessons-jpa.js.
- `node scripts/test-lessons.js` không thể chạy do `lessons-db.js` có lỗi cú pháp (ngoài phạm vi task này).
- `node scripts/build-light-index.js` cũng bị chặn bởi lỗi trong `q-microservices.js` (ngoài phạm vi).
