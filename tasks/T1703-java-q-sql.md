# T1703 — 8 câu hỏi Senior Java (sql, db) vào q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T1572

Thêm **8 câu hỏi phỏng vấn mới** (topic: sql, db) vào `js/data/q-sql.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-sql.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: keyset pagination vs OFFSET khi bảng 50 triệu dòng; chọn pool size HikariCP (công thức, đo đạc); transaction dài giữ lock và chặn VACUUM; read replica lag và đọc-sau-ghi; migration zero-downtime với Flyway (expand–contract); index trên JSONB và cột biểu thức; SELECT FOR UPDATE SKIP LOCKED làm hàng đợi; đọc pg_stat_statements để tìm query tốn kém.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

> **Quan trọng:** KHÔNG đọc toàn bộ js/data/q-sql.js (file rất lớn, sẽ hết lượt). Xem danh sách câu đã có bằng `node scripts/qtool.js list js/data/q-sql.js`, xem một câu mẫu bằng `node scripts/qtool.js show js/data/q-sql.js <id>`, rồi viết ngay vào file tạm và chạy `qtool.js append`.

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
Đã thêm 8 câu mới (sql-053 … sql-060), chỉ append, không sửa mục cũ:
- sql-053 senior — keyset pagination vs OFFSET trên bảng 50 triệu dòng, cursor toàn phần + NULL.
- sql-054 senior — chọn/đo HikariCP pool size (công thức, Little's law, metric).
- sql-055 senior — transaction dài giữ lock/xmin, chặn VACUUM và hàng đợi lock.
- sql-056 lead — read replica lag và đọc-sau-ghi.
- sql-057 lead — zero-downtime migration Flyway expand–contract, executeInTransaction=false.
- sql-058 senior — index JSONB: GIN vs B-tree expression, collation/cast, EXPLAIN.
- sql-059 senior — SELECT FOR UPDATE SKIP LOCKED làm queue (lease, fencing, dead-letter).
- sql-060 senior — đọc pg_stat_statements: total_exec_time, N+1, temp_blks, snapshot.

Nghiệm thu: `node --check js/data/q-sql.js` OK; `node scripts/qtool.js check js/data/q-sql.js` OK; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` Không commit.
Diff q-sql.js: 725 insertions(+), 1 deletion (-) — phần thêm là 8 câu mới; 1 dòng bị thay chính là dòng pitfall sai của sql-058 (không đụng mục cũ của người khác).

Rà lại (lần chạy sau): đọc lại toàn bộ 8 câu sql-053…sql-060 — đủ `**Tóm tắt:**`, mục cơ chế, bảng trade-off, lỗi production, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, `follow` 3 câu; không backtick, không `${` trong nội dung.
Sửa 1 chỗ sai kỹ thuật trong sql-058: trước đây ghi "payload->>'amount' > 100 so sánh text với integer, PostgreSQL có thể cast cột sang numeric" — thực tế hai vế đều thành text nên so sánh theo thứ tự chuỗi ('9' > '100'). Đã đổi thành: phải cast `((payload->>'amount')::numeric > 100)` và tạo expression index trên đúng biểu thức đã cast; thêm ví dụ so sánh jsonb bằng `->`.
Reviewed-by: kilo (T1703R)
