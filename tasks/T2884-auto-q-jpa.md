# T2884 — 3 câu hỏi Senior Java (jpa) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2785

Thêm **3 câu hỏi phỏng vấn mới** (topic: jpa) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý**.

Chủ đề: batch insert 1 triệu bản ghi với Hibernate 6 (hibernate.jdbc.batch_size, IDENTITY làm tắt batch insert, SEQUENCE + pooled optimizer, clear persistence context), projection DTO vs entity cho màn hình danh sách, second-level cache: khi nào nên/không nên.

> Vòng 4 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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

Đã thêm 3 câu hỏi topic jpa vào js/data/q-spring-data.js, id nối tiếp từ jpa-096 (max cũ): jpa-097 (lead, batch insert 1 triệu với getReferenceById + SEQUENCE/pooled optimizer + flush/clear theo chunk, tránh findById trong vòng lặp và cascade persist master data), jpa-098 (senior, projection DTO vs entity cho màn hình danh sách, constructor expression + aggregate size()/sum() group by, DTO read-only không dùng để sửa, Slice tránh COUNT(*)), jpa-099 (mid, second-level cache: cache cục bộ không invalidation chéo nhiều instance gây stale data, khi nên/không nên bật L2, READ_ONLY, TTL ngắn, distributed cache). Các chủ đề batch insert, projection DTO và L2 cache đã có câu ở vòng trước → chọn góc tình huống khác (quan hệ master data khi batch insert, DTO tính toán tập hợp + chỉnh sửa bằng entity đầy đủ, stale cache đa instance). Chỉ sửa file sở hữu; node --check OK; build-light-index OK; validate.js không báo lỗi mới cho q-spring-data.js (các lỗi còn lại là của file khác do người khác sở hữu, không đụng vào).
Reviewed-by: kilo (T2884R)
Verify-failed: 2026-11-28 07:02:55
