# T110 — Thêm Debug lab: incident + sql

Status: TODO
Agent: opencode
Owns: `js/data/labs-incident.js`, `js/data/labs-sql.js`

Đọc AGENTS.md mục **10** (Debug lab) và các bài có sẵn trong 2 file (không trùng kịch bản). Thêm **4 bài incident** (id tiếp theo): HikariCP pool cạn do transaction giữ connection khi gọi HTTP ngoài; Kafka consumer lag + rebalance liên tục (max.poll.interval.ms); memory leak do ThreadLocal/MDC trong thread pool; retry storm làm sập service downstream. Và **3 bài sql** (PostgreSQL 15): index không được dùng do implicit cast/function trên cột; deadlock giữa 2 transaction cập nhật theo thứ tự ngược (log deadlock thật của PostgreSQL); bảng phình do autovacuum không theo kịp (n_dead_tup, pg_stat_user_tables).
Artifact giống thật, tự nhất quán (timestamp, thread name, số liệu khớp answer). `node scripts/validate.js` → OK.

## Notes
