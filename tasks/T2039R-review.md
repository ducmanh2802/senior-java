# T2039R — Fact-check nội dung mới của T2039

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2039 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check diff mới: `scenario-149`–`scenario-154`.
- `scenario-154`: sửa mô tả migration sai về hành vi PostgreSQL 15 — "thêm cột NOT NULL không có default sẽ khóa bảng 8 triệu dòng" → làm rõ `ALTER TABLE ADD COLUMN ... NOT NULL` không có giá trị mặc định sẽ thất bại trên bảng đã có dữ liệu; cần thêm với default an toàn hoặc cập nhật theo từng bước.
- `scenario-149,150,151,152,153`: không phát hiện lỗi kỹ thuật/markup (JDK/Spring/PG claims hợp lý, placeholder `\${DB_PASSWORD}` đã escape đúng, không có backtick thừa trong template).
- `node scripts/validate.js` → OK. (Không chạy `node scripts/test-lessons.js` vì task chỉ sở hữu `js/data/q-scenario.js`, không phải bài học.)
