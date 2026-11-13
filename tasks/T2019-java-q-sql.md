# T2019 — 8 câu hỏi Senior Java (sql, db) vào q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T1703

Thêm **8 câu hỏi phỏng vấn mới** (topic: sql, db) vào `js/data/q-sql.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-sql.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: window function (ROW_NUMBER, LAG, running total) giải bài thực tế, CTE và recursive CTE, chống deadlock khi cập nhật nhiều dòng (sắp xếp thứ tự khóa), soft delete và unique index có điều kiện (partial index), đếm nhanh trên bảng lớn, phân trang có sort nhiều cột, connection timeout vs statement timeout vs lock_timeout, chọn kiểu dữ liệu tiền tệ và thời gian (timestamptz).

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
Đã thêm 8 câu hỏi: sql-061 (window function LAG/FIRST_VALUE sessionization funnel), sql-062 (CTE optimization fence, recursive CTE graph traversal), sql-063 (deadlock prevention 3-layer: DB lock ordering + SKIP LOCKED/NOWAIT, app retry with backoff, advisory lock), sql-064 (soft delete + partial unique index, MySQL generated column alternative, migration), sql-065 (fast COUNT on large table: reltuples, trigger counter, HyperLogLog), sql-066 (keyset pagination multi-column sort, cursor encoding, concurrent insert stability), sql-067 (statement_timeout vs lock_timeout vs idle_in_transaction_session_timeout, SET LOCAL, HikariCP), sql-068 (DECIMAL precision/scale cho VND/USD/crypto, TIMESTAMPTZ vs TIMESTAMP, BigDecimal/OffsetDateTime pitfalls). Tất cả đáp án ≥ 1500 ký tự, có Tóm tắt, cơ chế từng bước, code SQL, trade-off, lỗi hay gặp, ví dụ đời thực, trả lời phỏng vấn, Senior tip.
Reviewed-by: kilo (T2019R)
