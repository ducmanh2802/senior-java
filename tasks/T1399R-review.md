# T1399R — Fact-check nội dung mới của T1399

Status: TODO
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1399 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

Status: DONE

## Notes
Đã review 4 phần nội dung mới (Ví dụ đời thực + Trả lời mẫu khi phỏng vấn) của T1399 trong `js/data/q-spring-data.js`:

- **db-044 (replication lag)**: không có lỗi. Dữ liệu (PostgreSQL 15, `pg_stat_replication`, `write_lsn/flush_lsn/replay_lsn`, `pg_current_wal_lsn()`, `hot_standby_feedback = off` là mặc định đúng, `AbstractRoutingDataSource`) đều chính xác.
- **db-045 (phân vùng)**: không có lỗi. `pg_cron`, `DETACH PARTITION`, `pg_stat_database.datdeadlock`, `n_dead_tup` đều đúng.
- **db-046 (index-only scan)**: không có lỗi. `Heap Fetches`, `n_dead_tup`, `idle_in_transaction_session_timeout = 60000`, `VACUUM (ANALYZE)`, `autovacuum_vacuum_scale_factor = 0.02` đều đúng.
- **db-047 (XID wraparound)**: đã sửa 1 lỗi kỹ thuật — ví dụ đời thực ghi "PostgreSQL 13" nhưng trích dẫn `vacuum_failsafe_age` (mặc định 1,6 tỷ) chỉ có từ PostgreSQL 14+. Đã đổi thành "PostgreSQL 15" để đồng bộ với phần chính của câu (đã ghi rõ "PostgreSQL 14+"). Các số liệu khác (age 1,58 tỷ, `idle_in_transaction_session_timeout = 300000`, alert Prometheus) đều chính xác.

`node scripts/validate.js` → OK — không có lỗi.
