# T2035 — 6 câu hỏi Senior Java (security) vào q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T1573

Thêm **6 câu hỏi phỏng vấn mới** (topic: security) vào `js/data/q-security.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-security.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: lỗ hổng phổ biến trong code Java/Spring: SQL injection qua native query/JPQL nối chuỗi, SSRF khi RestClient gọi URL người dùng nhập, mass assignment khi bind DTO vào entity, lộ stack trace/Actuator endpoint, insecure deserialization (Jackson default typing), path traversal khi đọc file upload — mỗi câu có code lỗi và code sửa.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 6 câu hỏi vào js/data/q-security.js: security-055 (SQL injection native query/JPQL IN động, senior), security-056 (SSRF qua RestClient gọi URL người dùng nhập, lead), security-057 (mass assignment qua BeanUtils.copyProperties bind DTO→entity, mid), security-058 (lộ stack trace/Actuator endpoint, senior), security-059 (insecure deserialization Jackson default typing, senior), security-060 (path traversal đọc file upload, senior). Mỗi câu có code lỗi + code sửa, **Tóm tắt**, cơ chế từng bước, ví dụ đời thực có số liệu, trả lời mẫu, > Senior tip, follow 2–3 câu. Đã chạy node --check, node scripts/build-light-index.js, node scripts/validate.js → OK — không có lỗi.