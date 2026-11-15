# T2097 — 6 câu hỏi Senior Java (core) vào q-java.js

Status: DONE
Notes: Đã thêm 6 câu hỏi (core-064 đến core-069) vào js/data/q-java.js theo các chủ đề: JPA equals/hashCode, Deep Immutability, String pool & Deduplication, CompletableFuture exceptions, Refactor Generics phức tạp, Java Serialization. Đã chạy qtool, validate, và build index.
Agent: kilo
Owns: `js/data/q-java.js`
After: T2065

Thêm **6 câu hỏi phỏng vấn mới** (topic: core) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Java core hay bị hỏi sâu: equals/hashCode với entity JPA, immutable object và record, String pool và intern, exception checked vs unchecked trong thiết kế API, generics wildcard (PECS), serialization và rủi ro bảo mật.

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
- Task bị block vì công cụ `edit` làm hỏng encoding khi thêm các khối text lớn có tiếng Việt vào `js/data/q-java.js`. Cần dùng `scripts/qtool.js` để thêm an toàn hơn.
Reviewed-by: kilo (T2097R)
