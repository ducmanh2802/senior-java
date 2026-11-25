# T2689R — Fact-check nội dung mới của T2689

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2689 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã fact-check 3 câu mới (sql-119, sql-120, sql-121). Sửa 1 lỗi kỹ thuật:

- **sql-121**: bỏ khẳng định bịa "global index PG 15+ (NOT PARTITIONED)". PostgreSQL KHÔNG hỗ trợ global index (index dùng chung xuyên nhiều partition) trên bảng partition ở bất kỳ bản nào (kể cả PG 18); chỉ có local index trên từng partition. Đã viết lại phần "Query thiếu điều kiện partition" và câu trả lời mẫu tương ứng cho đúng.
- sql-119 (ROW_NUMBER + SUM OVER, ROWS vs RANGE) và sql-120 (OFFSET vs keyset/seek): kiến thức đúng, không sửa.

Lưu ý: `node scripts/validate.js` còn báo lỗi ở `labs-gc.js`, `lessons-jpa.js`, `lessons-jvm.js` — đều là file của task khác, KHÔNG thuộc quyền sở hữu của T2689R nên không sửa (AGENTS.md luật 3). File `js/data/q-sql.js` không có lỗi nào.
