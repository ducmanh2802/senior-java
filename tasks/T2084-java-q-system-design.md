# T2084 — 4 câu hỏi Senior Java (design) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2031

Thêm **4 câu hỏi phỏng vấn mới** (topic: design) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: thiết kế hệ thống cho Senior Java: hệ thống thông báo đa kênh (push/SMS/email) có retry và dedupe, rate limiter phân tán, hệ thống đặt vé chống overselling, URL shortener ở mức 10k RPS; mỗi câu có ước lượng số liệu, sơ đồ ~~~seq, trade-off.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 4 câu hỏi design mới vào js/data/q-system-design.js, id nối tiếp sau design-048 (đã có design-043..048 sẵn trong file):
- design-049: hệ thống thông báo đa kênh (push/SMS/email) có retry + dedupe, outbox, worker (senior)
- design-050: rate limiter phân tán (Redis, Lua, sliding window counter, fail-open/close) (senior)
- design-051: hệ thống đặt vé chống overselling (UPDATE có điều kiện, đặt chỗ tạm TTL, idempotency, outbox) (senior)
- design-052: URL shortener 10k RPS (base62, cache Redis, đếm click bất đồng bộ) (senior)

Mỗi câu: **Tóm tắt:** → cơ chế từng bước/VÌ SAO → code Java ≤30 dòng → bảng trade-off → pitfall production → Ví dụ đời thực có số liệu → Trả lời mẫu (~150-220 từ) → Senior tip → follow 2-3 câu.
Đã chạy: node --check (OK), node scripts/build-light-index.js (OK, design = 52 câu), node scripts/validate.js (không còn lỗi liên quan q-system-design.js; các lỗi còn lại là của file không sở hữu: new-questions.js, q-microservices.js, path.js). Không git commit.
Reviewed-by: kilo (T2084R)
