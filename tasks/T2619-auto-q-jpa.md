# T2619 — 3 câu hỏi Senior Java (jpa) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2553

Thêm **3 câu hỏi phỏng vấn mới** (topic: jpa) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý**.

Chủ đề: batch insert 1 triệu bản ghi với Hibernate 6 (hibernate.jdbc.batch_size, IDENTITY làm tắt batch insert, SEQUENCE + pooled optimizer, clear persistence context), projection DTO vs entity cho màn hình danh sách, second-level cache: khi nào nên/không nên.

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
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu hỏi: jpa-087 (lead, batch insert 1 triệu bản ghi: IDENTITY tắt batch, SEQUENCE pooled, flush/clear, tắt 2LC), jpa-088 (senior, projection DTO vs entity cho màn hình danh sách: heap memory, constructor expression, interface projection), jpa-089 (senior, second-level cache: khi nào bật/tắt, ví dụ currency vs số dư tài khoản, local cache nhiều instance). Không trùng ý với câu đã có (jpa-005, jpa-030, jpa-069, jpa-072, jpa-033, jpa-007, jpa-031, jpa-058 có chủ đề gần nhưng góc khác: IDENTITY+pooled optimizer+2LC tắt cho bulk load 1M; DTO heap/pagination trên màn hình danh sách; quyết định bật/tắt 2LC với ví dụ số dư tài khoản và local cache nhiều instance).
Reviewed-by: kilo (T2619R)
