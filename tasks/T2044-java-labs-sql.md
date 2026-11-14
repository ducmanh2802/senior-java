# T2044 — 2 debug lab (sql) vào labs-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/labs-sql.js`
After: T1714

Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong `js/data/labs-sql.js` để không trùng tình huống. id `lab-sql-NNN` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

1. **N+1 query làm API danh sách đơn hàng chậm 4 giây**: log Hibernate (show_sql) với 1 query đơn hàng + 200 query order_items, pg_stat_statements số calls cao; cách sửa (JOIN FETCH/EntityGraph/batch size, DTO projection).
2. **Connection pool cạn do transaction dài giữ connection khi gọi API ngoài**: log HikariCP "Connection is not available", pg_stat_activity nhiều "idle in transaction"; cách sửa (tách transaction, idle_in_transaction_session_timeout).

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
Đã thêm 2 lab mới: `lab-sql-021` (N+1 query danh sách sản phẩm với reviews, ORDER BY + LIMIT trong câu con) và `lab-sql-022` (Connection pool cạn do @Transactional trên @Scheduled job xử lý file CSV 500k dòng). Đã sửa lỗi cú pháp có sẵn trong file: hoàn thiện lab-sql-019 (answer bị cắt), bổ sung answer/rubric/tags cho lab-sql-020, thay ký tự Trung "争夺" bằng "tranh giành", xoá bản trùng lặp lab-sql-021/022 từ lần chỉnh trước. Validate OK.
Reviewed-by: kilo (T2044R)
