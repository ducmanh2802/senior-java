# T2118R — Fact-check nội dung mới của T2118

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2118 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Không có lỗi.

- `git diff HEAD -- js/data/q-sql.js` của T2118 **chỉ** gồm 25 dòng `tags` (thêm `'core'`), không sửa `q`/`a`/`follow`, không sửa markup, không thêm/xoá câu. Không có nội dung kiến thức mới để fact-check.
- 25 câu được gắn: sql-001, 002, 003, 004, 005, 006, 010, 011, 012, 013, 014, 015, 018, 023, 024, 025, 028, 031, 032, 033, 034, 035, 036, 047, 048 — đúng như T2118 khai báo.
- Kiểm tra: `node --check js/data/q-sql.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`; không câu nào có `'core'` trùng lặp trong mảng tags (25/25, mỗi câu 1 lần); `js/data/index-light.js` hiện đã chứa đúng 25 id `sql-*` trong danh sách `core` nên không cần build lại.
- Không sửa file nào khác, không commit.
