# T2252 — Rà soát chất lượng các bài (grep -n "id: 'lesson-") trong lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T2216

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm các bài (grep -n "id: 'lesson-") (`node scripts/qtool.js list js/data/lessons-db.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: body có ví dụ SQL + EXPLAIN PostgreSQL; isolation level/locking có bảng; check có explain từng phương án; KHÔNG sửa tests/reference.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/lessons-db.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

Status: DONE

## Notes

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| lesson-db-001 | Thiếu ví dụ SQL + EXPLAIN PostgreSQL | Thêm block `~~~sql` với `SET TRANSACTION ISOLATION LEVEL`, `UPDATE ... WHERE id = ?`, `SELECT FOR UPDATE`, và `EXPLAIN (ANALYZE, BUFFERS)`; giải thích từng node kết quả (Seq Scan / Index Scan / Index Only Scan / Buffers) |
| lesson-db-002 | Thiếu ví dụ SQL + EXPLAIN; thiếu bảng so sánh locking strategies | Thêm block `~~~sql` với UPDATE version predicate, RETURNING, EXPLAIN; thêm bảng so sánh 4 chiến lược (Optimistic / Pessimistic / Atomic SQL / SERIALIZABLE + retry) |
| lesson-db-003 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với CREATE INDEX, composite index, partial index, covering index INCLUDE, và EXPLAIN (ANALYZE, BUFFERS) với giải thích từng node |
| lesson-db-004 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với SET statement_timeout/lock_timeout/idle_in_transaction_session_timeout, truy vấn pg_stat_activity, lock query, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-005 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với keyset pagination `(created_at, id) > (?, ?)`, composite index, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-006 | Thiếu ví例 SQL + EXPLAIN | Thêm block `~~~sql` với các timeout settings, pg_stat_activity, lock query, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-007 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với lock query, SELECT FOR UPDATE ORDER BY, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-008 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với txid_current_snapshot(), SELECT xmin/xmax, pg_visible_in_snapshot(), pg_stat_user_tables, pg_stat_activity, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-009 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với pg_settings (WAL config), pg_replication_slots, pg_stat_bgwriter, pg_stat_archiver, và EXPLAIN (ANALYZE, BUFFERS) cho UPDATE |
| lesson-db-010 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với CREATE INDEX, composite index, covering index INCLUDE, partial index, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-011 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với WAL config, pg_replication_slots, pg_stat_bgwriter, pg_stat_archiver, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-012 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với CREATE INDEX, composite index, covering index INCLUDE, partial index, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-013 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với SET TRANSACTION ISOLATION LEVEL, SELECT FOR UPDATE, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-014 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với CREATE INDEX, composite index, covering index INCLUDE, partial index, và EXPLAIN (ANALYZE, BUFFERS) |
| lesson-db-015 | Thiếu ví dụ SQL + EXPLAIN | Thêm block `~~~sql` với CREATE INDEX, composite index, covering index INCLUDE, partial index, và EXPLAIN (ANALYZE, BUFFERS) |

Sửa cú pháp: thay backtick `` ` `` bằng `{{...}}` trong các phần giải thích EXPLAIN (lesson-db-002, lesson-db-010) để tránh vỡ template literal.

## Nghiệm thu
- `node --check js/data/lessons-db.js` → SYNTAX OK
- `node scripts/build-light-index.js` → OK
- `node scripts/validate.js` → không có lỗi
- `node scripts/test-lessons.js` → Lesson exercises OK: 304/304
Reviewed-by: verify-only (review task)
