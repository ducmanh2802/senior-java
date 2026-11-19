# T2449 — 4 câu hỏi Senior Java (sql) vào q-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/q-sql.js`
After: T2413

Thêm **4 câu hỏi phỏng vấn mới** (topic: sql) vào `js/data/q-sql.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-sql.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tối ưu SQL cho bảng lệnh/giao dịch hàng trăm triệu dòng: composite index và thứ tự cột, covering index, keyset pagination thay OFFSET, batch update an toàn không khóa lâu, migration online (thêm cột/index không downtime, Flyway).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-sql.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 4 câu vào js/data/q-sql.js, chèn trước dòng `);` cuối file: sql-090 (senior, composite index: lọc theo tháng vs sắp xếp theo tổng tiền, trade-off index lọc + Sort so với index sắp xếp + lọc từng dòng), sql-091 (senior, covering index INCLUDE, Index Only Scan, visibility map/Heap Fetches, autovacuum), sql-092 (senior, keyset pagination thay OFFSET, cursor base64 mã hóa đủ cột ORDER BY + PK tie-break, row constructor), sql-093 (lead, batch update staging UNLOGGED + MERGE theo batch_token, commit mỗi 5.000 dòng, idempotent, tránh transaction 40 phút chặn VACUUM).
- Id nối tiếp id lớn nhất cũ sql-089 (qtool list xác nhận); sql topic lên 93 câu.
- node --check js/data/q-sql.js: OK; node scripts/build-light-index.js: OK; node scripts/validate.js: q-sql.js không lỗi (cảnh báo sql-087 ngắn là câu cũ không liên quan; lỗi lessons-spring.js là file của tác viên khác, không sửa theo quy tắc sở hữu). KHÔNG commit.
Reviewed-by: kilo (T2449R)
