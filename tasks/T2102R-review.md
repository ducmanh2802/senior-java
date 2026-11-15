# T2102R — Fact-check nội dung mới của T2102

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2102 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **lab-sql-023**: Sửa hint #3 — `lower()` **LÀ** IMMUTABLE trong PostgreSQL (có thể dùng trong expression index), không phải "không IMMUTABLE". Nội dung answer đã đúng (nêu `lower()` là IMMUTABLE với collation C), hint bị sai ngược. Đã sửa hint phù hợp.
- **lab-sql-024**: Không phát hiện lỗi kỹ thuật, markup, hay từ nước ngoài lẫn vào. Nội dung đúng chuẩn PostgreSQL 15 (pg_trgm GIN, tsvector, sargable).
- `node scripts/validate.js` chạy OK cho labs-sql.js (các lỗi hiển thị đều thuộc q-devops.js, lessons-devops.js, path.js — không phải file sở hữu).
