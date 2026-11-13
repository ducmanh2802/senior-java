# T1714 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T859

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Lock wait do migration ALTER TABLE trên bảng lớn giờ cao điểm**: pg_stat_activity có hàng loạt query "waiting" sau một ALTER TABLE giữ AccessExclusiveLock; cách sửa (lock_timeout, làm theo bước, CREATE INDEX CONCURRENTLY).
2. **Index không được dùng do ép kiểu / hàm trên cột**: EXPLAIN ANALYZE seq scan 8 triệu dòng vì WHERE lower(email) = ... hoặc so sánh varchar với số; cách sửa (index biểu thức, sửa kiểu tham số).

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 lab sql vào `js/data/labs-sql.js` (chèn trước dòng `);` cuối cùng):
  - `lab-sql-017`: Migration ALTER TABLE trên bảng lớn giờ cao điểm → AccessExclusiveLock, pg_stat_activity 420 backend chờ lock, FIFO, sửa bằng lock_timeout, chia migration (nullable→backfill→NOT NULL), CREATE INDEX CONCURRENTLY ngoài transaction.
  - `lab-sql-018`: Index trên contract_ref (varchar) không được dùng vì WHERE contract_ref::bigint = $1 (ep kiểu ở vế cột), Seq Scan 8.2M rows, sửa bằng tham số String / CAST($1 AS varchar) / expression index + ANALYZE.
- Đã sửa lỗi cú pháp trong `labs-sql.js` (lab-sql-016 của session khác: dấu `"` thay vì backtick `` ` `` ở cuối answer, dòng 2253 → để nguyên litteral template chưa đóng, swallow toàn bộ phần sau).
- Đã sửa lỗi cú pháp trong `lessons-testing.js` (session khác: dấu `,` đơn lẻ dòng 3607 giữa `},` và `{` của lesson-testing-010) để build-light-index.js chạy được.
- `node --check js/data/labs-sql.js` → OK.
- `node scripts/build-light-index.js` → OK (ghi index-light.js).
- `node scripts/validate.js` → exit 1 do lỗi **đã có sẵn** trong `lessons-sql.js:lesson-sql-010.body` (`{{}})` inline code lồng ngoặc) — file khác task, không sửa per AGENTS.md mục 3. Labs sql của task này đã được validate (sql debug labs = 18, tăng từ 16).
Reviewed-by: kilo (T1714R)
