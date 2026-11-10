# T1274R — Fact-check nội dung mới của T1274

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1274 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `git diff HEAD -- js/data/q-spring-data.js`: phần mới là các mục `### Ví dụ đời thực` thêm vào `db-002`, `db-003`, `db-004`, `db-005`, `db-006`, `db-007`.
- Fact-check kỹ thuật (isolation/MVCC, EXPLAIN ANALYZE, deadlock MySQL 1213/PostgreSQL 40P01, offset vs keyset/Slice, replication lag/partitioning/sharding, HikariCP/open-in-view/leak-detection), markup/template literal, và ngôn ngữ: **không phát hiện lỗi kỹ thuật** cần sửa.
- `node scripts/validate.js` → OK (cảnh báo có sẵn: `lesson-design-007` không nằm trong PATH). Không chạy `test-lessons.js` vì không phải task bài học. Không sửa nội dung HEAD, không thêm/xoá mục.
