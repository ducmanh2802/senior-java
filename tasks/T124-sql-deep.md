# T124 — SQL nâng cao cho Senior

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn trong mọi file q-*.js (không trùng). Thêm **~8 câu** topic `sql` (id tiếp nối số lớn nhất hiện có, ~2 mid / 4 senior / 2 lead, đáp án 2500–4000 ký tự, kết bằng `> Senior tip:`): window function (ROW_NUMBER/LAG, running total, top-N per group), CTE đệ quy, keyset pagination vs OFFSET, anti-join NOT EXISTS vs NOT IN với NULL, upsert ON CONFLICT, đọc EXPLAIN ANALYZE (Seq Scan vs Index Only Scan, rows ước lượng sai), partial/covering index, gap-and-island. Chỉ dùng API/hành vi bạn chắc chắn đúng (Java 17/21, Spring Boot 3.x, PostgreSQL 16). Không thêm `refs` nếu không chắc link tồn tại. Chạy `node scripts/validate.js` → OK, rồi ghi `Status: DONE` + ghi chú ngắn.

## Notes

- Thêm 8 câu `sql-015`…`sql-022` (2 mid / 4 senior / 2 lead, đáp án 3.094–3.985 ký tự, mọi câu kết `> Senior tip:`, không thêm `refs`):
  `sql-015` đọc EXPLAIN cụ thể (Seq Scan / Index Scan / Index Only Scan, Rows Removed by Filter, visibility map) ·
  `sql-016` FULL OUTER JOIN đối soát 4 nhóm ·
  `sql-017` rows estimate sai (pg_stats: MCV/histogram/n_distinct, correlated columns, extended statistics, generic plan) ·
  `sql-018` partial + covering index (INCLUDE, vì sao bind parameter bỏ lỡ partial index, Heap Fetches) ·
  `sql-019` sessionization — gộp khoảng thời gian chồng lấp (island marker bằng MAX tích luỹ, frame `AND 1 PRECEDING`) ·
  `sql-020` ROLLUP / GROUPING SETS / CUBE + `GROUPING()` ·
  `sql-021` CTE optimization fence, inline từ PG 12, `MATERIALIZED`/`NOT MATERIALIZED` ·
  `sql-022` parallel query (cost model, `Gather`, điều kiện cấm parallel, khi **không** nên ép).
- Các chủ đề còn lại trong brief đã có sẵn nên **không viết trùng** (đã đối chiếu mọi `q:` trong mọi `q-*.js`): window/running total/top-N per group (`sql-001/005/006/013` + `db-017` ở q-spring-data), CTE đệ quy (`sql-009`), anti-join NOT EXISTS vs NOT IN với NULL (`sql-003`), upsert ON CONFLICT (`sql-010`), gap-and-island chuỗi ngày liên tiếp (`sql-007`); keyset vs OFFSET và quy trình đọc EXPLAIN ANALYZE đã có ở `q-spring-data` (`db-003`, keyset) cùng `q-scenario` — nên `sql-015/017` đi theo góc **đọc plan/ước lượng số liệu cụ thể**, không lặp lại câu workflow.
- Đã kiểm tra lại API/syntax viết tay theo tài liệu PostgreSQL: `CREATE STATISTICS name (dependencies) ON a, b FROM t`, điều kiện inline của CTE, danh sách node parallel-aware và điều kiện cấm parallel.
- Chạy `node scripts/validate.js` → `OK — không có lỗi.` (exit 0) và `node --check js/data/q-sql.js` → không lỗi cú pháp. Chỉ sửa `js/data/q-sql.js`.
Reviewed-by: opencode (T124R)
