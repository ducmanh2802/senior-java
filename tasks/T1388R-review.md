# T1388R — Fact-check nội dung mới của T1388

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1388 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 4 lỗi tiếng Việt/Markup trong nội dung mới (không có lỗi kiến thức kỹ thuật):
- db-039 (export 5M lines): "mac dinh cua tôi" → "mặc định của tôi" (2 lần, dòng 7632 và 7638), "l/keyset lô ngắn" → "và keyset lô ngắn" (typo)
- db-038 (bulk insert 2M): "one câu" → "một câu" (dòng 7558)
- spring-039, spring-040, db-036, db-037: không có lỗi
