# T2197R — Fact-check nội dung mới của T2197

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2197 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Không có lỗi kiến thức. Đã rà soát toàn bộ nội dung mới trong `git diff HEAD -- js/data/q-sql.js`: đáp án viết lại của sql-061, sql-062, sql-063, sql-064, sql-065, sql-066, sql-067, sql-068 và sửa câu hỏi sql-069 ("mất 200" → "mất 600", đúng vì 1000 − 600 − 600 = −200, ghi đè tuyệt đối ra 400 nên mất 600).
- Kiểm tra theo chuẩn PostgreSQL 15 / Java 17 / Spring Boot 3.x / Hibernate 6, tất cả đều đúng: cửa sổ ROWS vs RANGE và CASE với UNKNOWN; điều kiện inline CTE từ PG 12 (không đệ quy, không side-effect, tham chiếu đúng một lần) + MATERIALIZED/NOT MATERIALIZED; deadlock_timeout mặc định 1s, victim 40P01, NOWAIT 55P03, 25P02 khi retry trong transaction, CannotAcquireLockException/CannotSerializeTransactionException; partial unique index và MySQL generated column (nhiều NULL); reltuples = -1 khi chưa ANALYZE, API hll (hll_cardinality/hll_add_agg/hll_hash_bigint); tuple comparison keyset + LIMIT 21 + REPEATABLE READ; statement_timeout 57014, lock_timeout 55P03, idle_in_transaction_session_timeout 25P03, SET LOCAL, HikariCP connectionInitSql; NUMERIC precision/scale (wei cần NUMERIC(60,0)), HALF_UP/HALF_EVEN, BigDecimal.divide không scale gây ArithmeticException, TIMESTAMPTZ lưu UTC; EPQ ở READ COMMITTED và 40001 ở REPEATABLE READ.
- Markup hợp lệ (không backtick, không ${ chưa escape), không lẫn chữ nước ngoài ngoài thuật ngữ.
- `node scripts/validate.js` → `OK — không có lỗi.` Không sửa file nào ngoài file task; thay đổi trong `js/data/index-light.js` thuộc task khác, giữ nguyên.
