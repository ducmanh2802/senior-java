# T2066 — 6 câu hỏi Senior Java (sql) vào q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T2019

Thêm **6 câu hỏi phỏng vấn mới** (topic: sql) vào `js/data/q-sql.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-sql.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: PostgreSQL transaction isolation thực chiến: READ COMMITTED vs REPEATABLE READ vs SERIALIZABLE trong Postgres (MVCC, snapshot), lost update và write skew với ví dụ đặt phòng/trừ kho, SELECT ... FOR UPDATE / SKIP LOCKED làm hàng đợi job, advisory lock, xử lý serialization_failure (SQLSTATE 40001) bằng retry trong Spring.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 6 câu (id nối tiếp từ sql-068, chèn bằng `node scripts/qtool.js append` nên không sửa mục cũ):
  - `sql-069` senior — EvalPlanQual: vì sao UPDATE tương đối không mất cập nhật, còn đọc-rồi-ghi đè giá trị tuyệt đối thì mất; vì sao RR báo 40001. Có code `UPDATE ... WHERE qty >= ?` + kiểm tra affected rows, bảng trade-off, pitfall Hibernate dirty checking.
  - `sql-070` senior — 4 mức row lock (FOR UPDATE / NO KEY UPDATE / SHARE / KEY SHARE) + bảng xung đột, khóa KEY SHARE khi INSERT bảng con và index khóa ngoại, giới hạn của FOR UPDATE (GROUP BY/DISTINCT/UNION), bẫy SKIP LOCKED + LIMIT (vòng lặp claim).
  - `sql-071` senior — advisory lock: session vs transaction, re-entrant, rò rỉ trên HikariCP, key 2 int (namespace + id), phạm vi theo database, deadlock detection, giới hạn shared memory; code cron `pg_try_advisory_lock` + finally unlock.
  - `sql-072` lead — snapshot horizon: transaction REPEATABLE READ chỉ đọc cũng chặn VACUUM (`backend_xmin`, OldestXmin, prepared xacts, replication slot), SQL phát hiện, `statement_timeout` vs `idle_in_transaction_session_timeout` vs `transaction_timeout` (PG 17), `SERIALIZABLE READ ONLY DEFERRABLE`.
  - `sql-073` senior — retry 40001/40P01/55P03: Spring exception mapping, retry amplification, retry phải ở ngoài transaction, `TransactionTemplate` + ngân sách + deadline + jitter, idempotency key, 4 metric.
  - `sql-074` lead — đặt phòng chống double-booking (unique / exclusion constraint `tstzrange` + `btree_gist`, `ON CONFLICT DO NOTHING`, FOR UPDATE không khóa dòng chưa tồn tại) và trừ kho flash sale (UPDATE có điều kiện, chia bucket, reservation TTL, oversell buffer).
- Tránh trùng: các câu này đào sâu góc khác với `sql-047` (so sánh isolation), `sql-048` (deadlock), `sql-052` (MVCC), `sql-059` (queue SKIP LOCKED), `sql-063` (deadlock/advisory/retry bản ngắn).
- Nghiệm thu: `node --check js/data/q-sql.js` OK; `node scripts/qtool.js check js/data/q-sql.js` → OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`
- Không commit. Chỉ đổi `js/data/q-sql.js` (và `js/data/index-light.js` được script sinh lại).
Reviewed-by: kilo (T2066R)
