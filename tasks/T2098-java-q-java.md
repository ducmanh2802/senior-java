# T2098 — 5 câu hỏi Senior Java (modern) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2097

Thêm **5 câu hỏi phỏng vấn mới** (topic: modern) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Java 17–21 trong dự án thật: sealed interface + switch pattern matching để mô hình hoá trạng thái, record pattern, virtual threads khi migrate từ thread pool, Stream API bẫy hiệu năng, Optional dùng đúng và sai.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-java.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 5 câu hỏi topic `modern` vào `js/data/q-java.js`: `modern-064` (senior, sealed interface + switch pattern matching mô hình hoá trạng thái), `modern-065` (senior, record pattern/deconstruction), `modern-066` (lead, migrate sang virtual threads Project Loom), `modern-067` (senior, Stream API bẫy hiệu năng), `modern-068` (senior, Optional đúng/sai). Mỗi câu có `**Tóm tắt:**`, giải thích thuật ngữ/cơ chế từng bước, code Java ngắn có comment, bảng so sánh, pitfall production, `### Ví dụ đời thực` có số liệu, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, và `follow`.
- Kiểm tra: `node --check js/data/q-java.js` → OK. Đã sửa các inline code có dấu `{ }` lồng nhau trong phần mới để tránh hiển thị sai theo validator.
- `node scripts/build-light-index.js` và `node scripts/validate.js` hiện không đạt `OK — không có lỗi.` do lỗi/cảnh báo có sẵn ngoài phạm vi sở hữu (ví dụ `lessons-ai.js` lỗi cú pháp, `q-sql.js` trùng id, `projects.js`/`path.js` tham chiếu lesson-ai không tồn tại, index-light cũ). Không sửa file ngoài `js/data/q-java.js` theo luật 3. Đề xuất integrator sửa `lessons-ai.js` và các lỗi liên quan rồi chạy lại `node scripts/build-light-index.js` và `node scripts/validate.js`.
Reviewed-by: kilo (T2098R)
