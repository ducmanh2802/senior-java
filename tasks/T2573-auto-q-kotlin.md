# T2573 — 3 câu hỏi Senior Java (kotlin) vào q-kotlin.js

Status: DONE
Agent: kilo
Owns: `js/data/q-kotlin.js`
After: T2248

Thêm **3 câu hỏi phỏng vấn mới** (topic: kotlin) vào `js/data/q-kotlin.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-kotlin.js`); đọc danh sách để **không trùng ý**.

Chủ đề: null safety khi gọi Java API (platform type), coroutines vs virtual threads trong Spring Boot 3, data class làm JPA entity: cạm bẫy (equals/hashCode, no-arg constructor, open class với plugin kotlin-spring/kotlin-jpa).

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/q-kotlin.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm 3 câu hỏi: kotlin-036 (senior: null safety phần tử generic Java, List<@Nullable String> vs @Nullable List<String>), kotlin-037 (lead: virtual thread vs coroutine suspend — ThreadLocal/@Transactional/SecurityContext/MDC), kotlin-038 (senior: kotlin-jpa constructor no-arg không chạy init/initializer, thuộc tính non-null tạm thời null).
- Góc chọn tránh trùng câu đã có trong file: kotlin-036 tập trung phần tử generic (khác platform type container của kotlin-001/021), kotlin-037 tập trung virtual thread giữ ThreadLocal/transaction (khác kotlin-012 mất ngữ cảnh coroutine), kotlin-038 tập trung constructor no-arg/init (khác kotlin-014/022 về equals/hashCode).
- q-kotlin.js: node --check OK, qtool check OK (0 lỗi của file này; kotlin topic 35 → 38 câu).
- Chặn Nghiệm thu: validate.js/build-light-index.js không đạt "OK — không có lỗi." do lỗi cú pháp SẴN CÓ trong working-tree của js/data/q-banking.js (line 6700, backtick thô trong template literal; bản HEAD hợp lệ; thay đổi không do task này sở hữu, AGENTS.md mục 3 → không sửa file khác, ghi Notes). Lỗi cascade sang bugs.js, lessons-banking.js, path.js và khiến index-light.js cũ; không liên quan đến kotlin-036/037/038.
Reviewed-by: kilo (T2573R)
