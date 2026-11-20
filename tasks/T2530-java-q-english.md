# T2530 — 4 câu hỏi Senior Java (english) vào q-english.js

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T2523

Thêm **4 câu hỏi phỏng vấn mới** (topic: english) vào `js/data/q-english.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-english.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tiếng Anh giao tiếp hằng ngày trong dự án outsource/FDI (lang: en): daily stand-up update, clarifying unclear requirements by email, reporting a delay with a recovery plan, explaining a bug root cause to a non-technical client.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-english.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.

Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Added 4 new English interview questions with ids: english-227 (daily stand-up in outsource context), english-228 (clarifying unclear requirements by email), english-229 (reporting delay with recovery plan), english-230 (explaining bug root cause to non-technical client). File validated successfully with `node scripts/validate.js → OK — không có lỗi.`
Reviewed-by: kilo (T2530R)
