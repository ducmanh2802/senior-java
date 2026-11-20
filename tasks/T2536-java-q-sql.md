# T2536 — 3 câu hỏi Senior Java (sql) vào q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T2508

Thêm **3 câu hỏi phỏng vấn mới** (topic: sql) vào `js/data/q-sql.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-sql.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Index & JOIN qua số đo, MySQL vs PostgreSQL: (1) NOT IN với subquery có NULL → kết quả rỗng + PostgreSQL không chuyển thành hashed anti-join được nên chạy rất chậm; viết lại bằng NOT EXISTS, đọc EXPLAIN (Hash Anti Join vs SubPlan); (2) Cột join lệch kiểu/collation (varchar vs bigint, utf8mb4_general_ci vs unicode_ci) làm index không được dùng — triệu chứng, EXPLAIN, cách sửa; (3) Đổi thứ tự cột trong composite index theo tính chọn lọc và ORDER BY: đọc rows examined/Buffers giảm từ hàng trăm xuống vài chục entry, khi nào PostgreSQL dùng 2 index rời bằng BitmapAnd. Mỗi câu có số đo cụ thể (ms, TPS, MB) tự nhất quán và mục ### Checklist cuối (5–7 việc làm được ngay), trước > Senior tip..

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu hỏi mới (id nối tiếp, không trùng ý với 103 câu cũ), chỉ THÊM object vào cuối mảng bằng `node scripts/qtool.js append`, không sửa mục cũ:

- **sql-104** (lead) — `NOT IN` với subquery có NULL → kết quả rỗng + PostgreSQL không hạ thành `Hash Anti Join` (chạy `SubPlan`/`Hash SubPlan`); viết lại bằng `NOT EXISTS`, đọc `EXPLAIN` phân biệt `Hash Anti Join` vs `SubPlan`. Kèm code JdbcTemplate + Checklist.
- **sql-105** (senior) — cột JOIN lệch kiểu (varchar vs bigint) / lệch collation (utf8mb4_general_ci vs unicode_ci) làm index mất tác dụng; triệu chứng, đọc `EXPLAIN` (Seq Scan / Filter có cast / COLLATE), cách sửa (migration / cột dẫn xuất / cast một phía). Kèm code + Checklist.
- **sql-106** (lead) — đổi thứ tự cột composite index theo selectivity + ORDER BY; rows examined 180.000 → 24, Buffers 6.400 → 48; khi nào PostgreSQL dùng `BitmapAnd` 2 index rời. Kèm code + Checklist.

Mỗi câu đủ: `**Tóm tắt:**` → cơ chế từng bước (giải thích từ gốc, mục "Hiểu nhanh") → code Java ≤ 30 dòng có comment → bảng trade-off → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `### Checklist` (6 việc) → `> Senior tip:`; `follow` 3 câu; `tags`.

Nghiệm thu:
- `node --check js/data/q-sql.js` → SYNTAX OK.
- `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (386.2 KB).
- `node scripts/qtool.js check js/data/q-sql.js` → OK for q-sql.js (8 lỗi còn lại chỉ ở file khác).
- `node scripts/validate.js`: không còn lỗi nào thuộc q-sql.js. Các lỗi bug-047/bug-048 còn lại nằm trong `js/data/bugs.js` — file của task khác đang dở (working tree +706 dòng chưa commit), KHÔNG thuộc T2536 nên không sửa.Reviewed-by: kilo (T2536R)
