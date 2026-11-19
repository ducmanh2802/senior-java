# T2429 — 4 câu hỏi Senior Java (jpa) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2428

Thêm **4 câu hỏi phỏng vấn mới** (topic: jpa) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: JPA/Hibernate 6 trên bảng giao dịch lớn: N+1 và cách đo, batch insert/update (hibernate.jdbc.batch_size, sequence allocationSize), optimistic vs pessimistic lock (@Version, LockModeType), projection/DTO cho báo cáo, first-level cache phình khi xử lý batch.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 4 câu hỏi mới (topic `jpa`) vào cuối `js/data/q-spring-data.js`, id nối tiếp từ `jpa-078`:
  - `jpa-079` (senior) — SEQUENCE + `allocationSize`/`INCREMENT BY`, optimizer `pooled`, lỗi trùng khoá chính sau restore/rolling deploy.
  - `jpa-080` (senior) — `StatelessSession` cho job ghi 3 triệu dòng: khác biệt, được/mất, khi nào chọn.
  - `jpa-081` (lead) — optimistic lock (`@Version`) dưới tranh chấp cao: retry storm, 3 tầng giảm tranh chấp, sharding.
  - `jpa-082` (senior) — `Stream<T>`/cursor cho 8 triệu dòng: điều kiện stream thật (PostgreSQL autocommit=false + fetch_size), bẫy rò connection.
- Mỗi câu: `**Tóm tắt:**` → cơ chế từng bước → code ≤ 30 dòng có comment → bảng trade-off → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (159–179 từ) → `> Senior tip:`; `follow` 3 câu. Không backtick, không `${`.
- Kiểm tra: `node --check js/data/q-spring-data.js` OK; `node scripts/qtool.js check js/data/q-spring-data.js jpa-079 jpa-080 jpa-081 jpa-082` → `OK for q-spring-data.js`; `node scripts/build-light-index.js` đã chạy (lần chạy lại bị chặn bởi file khác đang lỗi cú pháp).
- `node scripts/validate.js` hiện KHÔNG đạt `OK` vì các file của agent khác đang dở dang (không thuộc task này): `js/data/q-scenario.js` lỗi cú pháp (template literal chưa đóng, `Unexpected identifier 'tắt'`), và `js/data/quiz_backup.js` chưa khai báo trong `js/core/data-manifest.js`. Đây là file của agent/task khác, không sửa theo luật 3 (chỉ sửa file sở hữu). Khi các file đó hoàn tất, validate sẽ chạy trên toàn repo; phần của task này đã sạch.
- Không commit (theo luật 4).
Reviewed-by: kilo (T2429R)
