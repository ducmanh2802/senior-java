# T43 — Nội dung: Debug lab — SQL & database (PostgreSQL ưu tiên, có 1 bài MySQL)

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

> **Ghi theo lô nhỏ:** viết **1 lab mỗi lần edit** (artifact dài). Sau mỗi lab chạy `node --check js/data/labs-sql.js` và `node scripts/validate.js labs-sql.js`.

Đọc `AGENTS.md` mục 4–6 và **mục 10** (schema LABS) trước khi bắt đầu.

## Mục tiêu
Viết **5 lab** với `category: 'sql'`, ID từ `lab-sql-001`, mỗi lab một tình huống:
- EXPLAIN ANALYZE: seq scan vì gọi hàm trên cột hoặc lệch kiểu dữ liệu (varchar vs bigint)
- Composite index sai thứ tự cột so với điều kiện WHERE / ORDER BY
- N+1 query nhìn từ log SQL của Hibernate (show_sql + statistics)
- Deadlock log PostgreSQL: 2 transaction cập nhật số dư theo thứ tự ngược nhau
- pg_stat_activity + chuỗi lock wait do một transaction 'idle in transaction' (MySQL: SHOW ENGINE INNODB STATUS cho 1 bài)

## Yêu cầu chất lượng (quan trọng nhất)
- Artifact phải trông **như thật**: đúng định dạng output của công cụ thật (jstack / GC log unified JDK 17 / EXPLAIN (ANALYZE, BUFFERS) PostgreSQL 15 / log JSON của Spring Boot…), có cả nhiễu (thread, dòng log không liên quan) để người học phải tự lọc.
- **Nhất quán tuyệt đối**: id, địa chỉ lock, timestamp, số liệu trong artifact phải khớp nhau và khớp với `answer`. `answer` phải trích dẫn dòng cụ thể làm bằng chứng.
- `answer` giải thích chi tiết (≥ 1500 ký tự): nguyên nhân gốc, dẫn chứng, cách sửa ngắn hạn và dài hạn, cách phòng ngừa (monitoring/alert), và những ý một Senior sẽ nói thêm.
- Bối cảnh gần với hệ thống ngân hàng, fintech, e-commerce Việt Nam (thanh toán, ví, đối soát, flash sale…).

## Nghiệm thu
`node scripts/validate.js` → OK với 5 lab. Sau đó integrator sẽ review fact-check.

## Notes

Đã xong 5 lab (`category: 'sql'`, `lab-sql-001` … `lab-sql-005`), viết trong `js/data/labs-sql.js`:

| Lab | Chủ đề | Level | Artifact |
|---|---|---|---|
| 001 | PG: `date_trunc` bọc cột + cast `::bigint` → Seq Scan 42 triệu dòng | senior | 3 file (EXPLAIN ANALYZE ×2, `\d` schema) |
| 002 | MySQL 8.0: composite index `(created_at, status)` sai thứ tự → đọc 318.204 dòng | mid | 3 file (EXPLAIN, EXPLAIN ANALYZE, SHOW INDEX, slow log) |
| 003 | Hibernate N+1: 101 câu SQL / request (log show_sql + `pg_stat_statements` + actuator) | senior | 3 file |
| 004 | PG deadlock: 2 đơn mua chéo cập nhật 2 dòng `wallet_balance` ngược thứ tự | lead | 3 file (log server, `pg_locks` snapshot, log app) |
| 005 | PG `idle in transaction` giữ khoá → chuỗi chờ 46 phiên (flash sale) | senior | 4 file (`pg_stat_activity`, `pg_blocking_pids`, `pg_settings`, log app) |

- Đáp án dài 5.8k–7.4 ký tự, có đủ: nguyên nhân gốc → dẫn chứng (trích dòng cụ thể trong artifact) → sửa ngắn hạn → sửa dài hạn → phòng ngừa/monitoring → `> Senior tip:`.
- Số liệu trong artifact tự nhất quán (PID, xid, tuple/page, số dòng, timestamp, epoch của slow log) và khớp với phần `answer`.
- Bài MySQL là lab 002; lab 005 trong `answer` có nêu tương đương MySQL (`SHOW ENGINE INNODB STATUS`, `performance_schema.data_lock_waits`, `innodb_lock_wait_timeout`).
- Inline code dùng `{{...}}`, code block dùng `~~~sql` / `~~~java`; trong artifact dùng ký tự `{}` tự do (artifact không phải markup).
- Đã chạy `node --check js/data/labs-sql.js` và `node scripts/validate.js labs-sql.js` → `OK — không có lỗi.` (`validate` toàn repo đang báo lỗi ở `js/data/labs-gc.js` của T42 — dấu backtick chưa escape trong template literal quanh `toByteArray()`; không thuộc file của task này nên không tự sửa).
