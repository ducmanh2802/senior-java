# T2653 — 4 câu hỏi Senior Java (english) vào q-english.js

Status: DONE
Agent: kilo
Owns: `js/data/q-english.js`
After: T2595

Thêm **4 câu hỏi phỏng vấn mới** (topic: english) vào `js/data/q-english.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-english.js`); đọc danh sách để **không trùng ý**.

Chủ đề: phỏng vấn tiếng Anh vòng technical: explain how a HashMap works, describe your current system architecture in 2 minutes, what would you do if a deployment breaks production, tell me about a time you improved performance — có bản trả lời mẫu tiếng Anh tự nhiên, từ vựng và lỗi người Việt hay mắc.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead. Câu hỏi topic english có `lang: 'en'`.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-english.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu hỏi topic english vào js/data/q-english.js:
- english-243 (senior): HashMap internals + khi KHÔNG nên dùng HashMap / chọn Map nào thay (LinkedHashMap, TreeMap, ConcurrentHashMap) — góc chọn công cụ, khác english-011 (nào trình bày nội dung HashMap sâu).
- english-244 (lead): mô tả kiến trúc hệ thống trong 2 phút dành cho người không kỹ thuật (phép so sánh, con số, khuyến nghị) — khác english-002 (dành cho kỹ thuật, sâu hơn).
- english-245 (senior): nếu deployment làm hỏng production — xử lý sự cố ngay (rollback/feature flag, giao tiếp, điều tra an toàn, phòng ngừa) — khác english-194 (kể sự cố rollback đã qua).
- english-246 (senior): tối ưu query SQL chậm (EXPLAIN ANALYZE, index composite, kết quả trước/sau) — khác english-175 (tối ưu hệ thống chung).

Mỗi câu: `**Tóm tắt:**` → cơ chế/VÌ SAO → bảng trade-off/code Java ngắn (`~~~java`/`~~~sql`) → pitfall production → `### Ví dụ đời thực` có số liệu → `### Sample answer` (tiếng Anh, 150–220 từ) → `### Useful phrases` → `### Lỗi người Việt hay mắc` → `> Senior tip:` → `follow` 2–3 câu → `lang: 'en'`.

Chạy `node --check js/data/q-english.js`, `node scripts/build-light-index.js`, `node scripts/validate.js` → OK. Không commit.
Reviewed-by: kilo (T2653R)
