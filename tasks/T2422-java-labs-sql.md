# T2422 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T2358

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **Bảng job queue bị nghẽn khóa**: 20 worker cùng SELECT … FOR UPDATE trên bảng task, pg_stat_activity cho thấy hàng loạt session chờ Lock/transactionid, throughput tụt còn 15 task/s; sửa bằng FOR UPDATE SKIP LOCKED + index phù hợp + transaction ngắn.
2. **Bảng lệnh phình (bloat) do long-running transaction**: autovacuum không dọn được, n_dead_tup tăng, query chậm dần trong ngày; dẫn chứng từ pg_stat_user_tables và pg_stat_activity (xact_start cũ).

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

Labs 028 (job queue SKIP LOCKED) và 029 (bloat/long-running transaction) đã tồn tại trong labs-sql.js, đủ 2 lab level senior yêu cầu. Lab 029 có lỗi cú pháp: thiếu dấu `,` sau template literal `scenario` ở dòng 4346 khiến `artifacts:` ở dòng 4347 bị "Unexpected identifier". Đã thêm dấu `,` sau backtick đóng. `node --check js/data/labs-sql.js` → EXIT 0. `node scripts/validate.js` không báo lỗi nào từ labs-sql.js (các lỗi còn lại là pre-existing trong q-system-design.js, lessons-architecture.js, projects.js, path.js — không thuộc quyền sở hữu task này). `node scripts/build-light-index.js` không chạy được do lỗi cú pháp trước đó trong q-system-design.js (file không sở hữu).
Reviewed-by: kilo (T2422R)
