# T2540R — Fact-check nội dung mới của T2540

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2540 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Review nội dung mới của T2540 trong `js/data/labs-sql.js` (lab-sql-034 PostgreSQL dead-tuple/vacuum, lab-sql-035 MySQL InnoDB deadlock):
- Không có lỗi kiến thức kỹ thuật: cơ chế MVCC/dead tuple, autovacuum chặn bởi idle-in-transaction snapshot, Heap Fetches trong EXPLAIN (PG 15) đúng; các setting/ệnh đề tham chiếu (idle_in_transaction_session_timeout, pg_terminate_backend, VACUUM FULL, DETACH/DROP PARTITION, autovacuum_vacuum_scale_factor/max_workers) đều thực.
- lab-sql-035: cơ chế deadlock InnoDB do thiếu index hỗ trợ → quét toàn bảng theo clustered index → next-key/gap lock theo thứ tự quét chứ không theo WHERE, SQLState 40001, ALGORITHM=INPLACE/LOCK=NONE, composite index (warehouse_id, sku), retry deadlock đều đúng. MySQL đã có lab-sql-002 ở HEAD nên engine phù hợp quy ước file.
- Markup: không backtick, không `${` trong template literal; validate schema pass.
- Không sửa gì (không có lỗi kiến thức để sửa). `node scripts/validate.js` trong lab-sql.js không báo lỗi; các LỖO còn lại (bugs.js bug-047/048) là nội dung khác người sở hữu trước đó để lại, không nằm trong quyền sở hữu T2540R, không được sửa theo luật AGENTS.md.
