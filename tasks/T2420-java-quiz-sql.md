# T2420 — 12 câu trắc nghiệm (sql) vào quiz.js

Status: DONE
Agent: kilo
Owns: `js/data/quiz.js`
After: T2379

Thêm **12 câu trắc nghiệm** vào `js/data/quiz.js` (topic `sql`; id `qz-sql-NNN` nối tiếp số lớn nhất của topic trong mọi file quiz: `grep -ho "qz-sql-[0-9]*" js/data/quiz*.js | sort -V | tail -1`).

Chủ đề: tình huống Oracle/PostgreSQL: MVCC, lock (FOR UPDATE, SKIP LOCKED, NOWAIT), deadlock, index composite và thứ tự cột, EXPLAIN, isolation anomaly, VACUUM/bloat.

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là `multi: true` (Chọn 2); đáp án đúng rải đều vị trí; `explain` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/quiz.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 12 câu hỏi SQL quiz với id: qz-sql-045 đến qz-sql-056.
Chủ đề bao gồm: MVCC (045), FOR UPDATE behavior (046), deadlock phòng tránh (047 - multi), composite index column order (048), EXPLAIN external merge sort (049), READ COMMITTED isolation anomalies (050), VACUUM/bloat (051 - multi), REPEATABLE READ snapshot (052), index design for keyset pagination (053), FOR UPDATE SKIP LOCKED (054 - multi), batch UPDATE large dataset (055), jsonb expression index (056).
Validation passed: `node --check`, `build-light-index`, `validate.js` → OK.
Reviewed-by: kilo (T2420R)
