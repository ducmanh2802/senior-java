# T2540 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2514

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

Lab 1: PostgreSQL — job dọn dữ liệu xoá 50% bảng orders (40 triệu dòng), sau đó SELECT … ORDER BY id LIMIT 1 mất 60 giây: artifact EXPLAIN (ANALYZE, BUFFERS) cho thấy đọc qua hàng triệu dead tuple, pg_stat_user_tables (n_dead_tup, last_autovacuum), log autovacuum; nguyên nhân: MVCC dead tuple + autovacuum bị chặn bởi long transaction (pg_stat_activity idle in transaction 6 giờ). Lab 2: MySQL InnoDB — 4 worker cập nhật các nhóm dòng không giao nhau vẫn deadlock: artifact SHOW ENGINE INNODB STATUS (LATEST DETECTED DEADLOCK với lock_mode X locks gap before rec / next-key), DDL bảng thiếu index trên cột WHERE, isolation REPEATABLE READ; nguyên nhân: khoá theo đường quét index chứ không theo WHERE.

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm lab-sql-034 (PostgreSQL dead tuple + autovacuum bị chặn bởi idle in transaction) và lab-sql-035 (MySQL InnoDB deadlock do thiếu composite index).
- node --check OK; build-light-index OK.
- validate.js còn lỗi pre-existing ở bugs.js (bug-047, bug-048) không thuộc phạm vi task này; labs-sql.js không có lỗi.
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2514

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

Lab 1: PostgreSQL — job dọn dữ liệu xoá 50% bảng orders (40 triệu dòng), sau đó SELECT … ORDER BY id LIMIT 1 mất 60 giây: artifact EXPLAIN (ANALYZE, BUFFERS) cho thấy đọc qua hàng triệu dead tuple, pg_stat_user_tables (n_dead_tup, last_autovacuum), log autovacuum; nguyên nhân: MVCC dead tuple + autovacuum bị chặn bởi long transaction (pg_stat_activity idle in transaction 6 giờ). Lab 2: MySQL InnoDB — 4 worker cập nhật các nhóm dòng không giao nhau vẫn deadlock: artifact SHOW ENGINE INNODB STATUS (LATEST DETECTED DEADLOCK với lock_mode X locks gap before rec / next-key), DDL bảng thiếu index trên cột WHERE, isolation REPEATABLE READ; nguyên nhân: khoá theo đường quét index chứ không theo WHERE.

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id `<0x...>`, timestamp, số liệu khớp nhau và khớp `answer`. `answer` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/labs-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: kilo (T2540R)
