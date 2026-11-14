# T2066R — Fact-check nội dung mới của T2066

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2066 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 5 câu hỏi mới (sql-070 đến sql-074) của T2066:
- sql-070: Row lock PostgreSQL (4 mức FOR KEY SHARE/SHARE/NO KEY UPDATE/UPDATE, bảng xung đột, trigger RI_FKey_check_ins, FOR KEY SHARE trên cha, FK index, FOR UPDATE không dùng được với GROUP BY/DISTINCT, SKIP LOCKED + LIMIT behavior) — chính xác.
- sql-071: Advisory lock (session vs transaction, pg_try_advisory_lock vs pg_advisory_xact_lock, rollback không nhả session lock, re-entrant, HikariCP leak, key bigint/cặp int, deadlock detection, shared memory limit, khi không nên dùng) — chính xác.
- sql-072: Transaction REPEATABLE READ chặn VACUUM (snapshot horizon, backend_xmin, OldestXmin, idle in transaction, statement_timeout, idle_in_transaction_session_timeout, transaction_timeout PG17, SERIALIZABLE READ ONLY DEFERRABLE, read replica) — chính xác.
- sql-073: Retry strategy (chỉ retry tầng mở transaction, Spring exception mapping 40001/40P01/55P03, retry trong @Transactional vô ích do 25P02, retry amplification, TransactionTemplate, budget/deadline/jitter/idempotency key, 4 metric theo dõi) — chính xác.
- sql-074: Double-booking & flash sale (race condition SELECT-INSERT, FOR UPDATE không khóa dòng chưa tồn tại, 3 lớp phòng thủ: unique/exclusion constraint, row lock, SERIALIZABLE, bucket sharding, reservation TTL, oversell buffer) — chính xác.

Không có lỗi kỹ thuật, markup, hay thuật ngữ sai. Validate OK.
