# T2664 — 4 câu hỏi Senior Java (testing) vào q-soft.js

Status: DONE
Agent: kilo
Owns: `js/data/q-soft.js`
After: T2643

Thêm **4 câu hỏi phỏng vấn mới** (topic: testing) vào `js/data/q-soft.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-soft.js`); đọc danh sách để **không trùng ý**.

Chủ đề: Testcontainers cho PostgreSQL/Kafka trong CI (thời gian chạy, reuse container), test slice @WebMvcTest/@DataJpaTest vs @SpringBootTest, contract test (Spring Cloud Contract / Pact) giữa 2 team, flaky test do thời gian và thứ tự: cách tìm và sửa.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/q-soft.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 4 câu hỏi topic testing vào js/data/q-soft.js: testing-069 (senior, Testcontainers PostgreSQL+Kafka trong CI, singleton/reuse), testing-070 (senior, @WebMvcTest/@DataJpaTest vs @SpringBootTest và khoảng trống slice→production), testing-071 (senior, contract testing Pact giữa 2 team kèm ~~~seq), testing-072 (lead, flaky test do thời gian/thứ tự: cách tìm và sửa). Id nối tiếp testing-068 (largest id trước đó). Chạy node --check, node scripts/build-light-index.js, node scripts/validate.js: không còn lỗi nào thuộc q-soft.js (lỗi còn lại của validate nằm ở file khác, không do task này sở hữu).
Reviewed-by: kilo (T2664R)
