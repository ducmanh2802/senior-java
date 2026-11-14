# T2065 — 6 câu hỏi Senior Java (core) vào q-java.js

Status: DONE
Agent: kilo
Owns: `js/data/q-java.js`
After: T2048

Thêm **6 câu hỏi phỏng vấn mới** (topic: core) vào `js/data/q-java.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-java.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: String và bộ nhớ trong Java 17/21: String pool và intern, compact strings (Latin-1 vs UTF-16), StringBuilder vs nối chuỗi trong vòng lặp (invokedynamic StringConcatFactory), equals/hashCode của String, Unicode/surrogate pair khi cắt chuỗi tiếng Việt, Charset khi đọc file và lỗi mojibake trên production.

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
- Đã thêm 6 câu hỏi (topic core) nối tiếp core-057 (id lớn nhất trước đó trong HEAD):
  - `core-058` (senior): String.equals/hashCode bên trong, cache hash, khi nào `==` true.
  - `core-059` (senior): Compact Strings (Latin-1 vs UTF-16), coder, phân tích heap dump, String dedup.
  - `core-060` (senior): Nối chuỗi trong vòng lặp — invokedynamic StringConcatFactory vs StringBuilder.
  - `core-061` (senior): Unicode/surrogate pair, codePoints, Normalizer NFC/NFD khi cắt chuỗi tiếng Việt.
  - `core-062` (lead): Charset, BOM, mojibake khi đọc file.
  - `core-063` (senior): So sánh String/StringBuilder/StringBuffer/StringJoiner/Collectors.joining.
  - Chủ đề "String pool/intern" KHÔNG trùng lặp: đã có câu riêng trong `q-concurrency-jvm.js` (String.intern() + pool ở heap).
- Ghi chú lần chạy trước bị gián đoạn: 6 object đã có nhưng 4 chỗ đóng template `a:` bằng dấu `"` thay vì backtick (core-060/061/062/063) gây SyntaxError — đã sửa; đồng thời sửa vài chi tiết inline code có `{ }` lồng nhau (validator báo) và bỏ flag không tồn tại `-XX:+PrintStringConcat` (đã kiểm chứng bằng `java -XX:+PrintFlagsFinal`; dùng `javap -c` thay thế).
- Đã kiểm chứng bằng JDK 17: `Files.readString` KHÔNG tự bỏ BOM UTF-8 (ký tự đầu U+FEFF) → đã sửa nội dung core-062 cho đúng.
- `node --check js/data/q-java.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js có sẵn từ trước).
- Không commit (đúng luật).
Reviewed-by: kilo (T2065R)
