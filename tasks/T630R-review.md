# T630R — Fact-check nội dung mới của T630

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T630 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff HEAD của `js/data/lessons-sql.js` (thêm `lesson-sql-004`, `lesson-sql-005`; nội dung cũ ở HEAD không chỉnh).
- Kiểm tra kỹ thuật (PG 15, SQL chuẩn): ROW_NUMBER/RANK/DENSE_RANK behavior + tie/skip đúng; frame mặc định `RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW` khi có ORDER BY không ghi frame — đúng; khuyến nghị `ROWS ... UNBOUNDED PRECEDING AND CURRENT ROW` + tie-breaker cho running total — đúng; LAG(expr,offset,default) đúng; `WindowAgg` + sort một lần, index `(customer_id, tx_date, tx_id)` có thể bỏ sort — đúng; PG 15 `Run Condition` cho top-N per group — đúng (ghi đúng “PG 15+”). Hash/Nested loop/Merge join: chi phí (n×m, n×log m, n+m), điều kiện `=` cho hash/merge, nested loop cho phi-đẳng thức — đúng; `work_mem`/`Batches > 1` tràn đĩa, `EXPLAIN (ANALYZE, BUFFERS)`, `enable_nestloop=off` chẩn đoán — đúng; `NULL = NULL` → UNKNOWN, equi-join không khớp, `IS NOT DISTINCT FROM` coi NULL bằng nhau (phải viết rõ) — đúng. Không phát hiện API/flag bịa, mặc định sai, cơ chế ngược, hay số liệu vô căn cứ.
- Kiểm tra markup/syntax: không có backtick, không có `${` interpolation; `node --check` OK. Schema/độ dài body/exercise/check/rubric phù hợp.
- Kiểm thử: `node scripts/test-lessons.js lesson-sql-004` → 8/8; `node scripts/test-lessons.js lesson-sql-005` → 8/8 (reference pass, starter compile/không pass hết theo harness). `node scripts/validate.js` → `OK — không có lỗi.` (còn cảnh báo PATH có 6 bài chưa nằm trong path.js, bao gồm lesson-sql-004/005 — do file ngoài phạm vi sở hữu, không chỉnh).
- Không sửa lỗi kỹ thuật nào (không tìm thấy lỗi). No git actions.
