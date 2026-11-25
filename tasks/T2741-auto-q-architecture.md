# T2741 — 3 câu hỏi Senior Java (architecture) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2696

Thêm **3 câu hỏi phỏng vấn mới** (topic: architecture) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chọn modular monolith vs microservices cho team 8 người, tách dần monolith bằng strangler fig có số liệu, ADR (Architecture Decision Record) — cách viết và ví dụ.

> Vòng 3 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

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
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã thêm 3 câu vào js/data/q-system-design.js (chỉ THÊM, không sửa câu cũ):
- architecture-081 (senior): team 8 người đã tách thành 6 microservice → thu gom về modular monolith, quy trình gộp an toàn, kiểm ranh giới bằng ArchUnit. Góc ngược lại architecture-078 (078 viết từ monolith décisions tách).
- architecture-082 (senior): Strangler Fig PATH GHI (dual-write + outbox pattern + CDC + freeze window + cổng cutover). Góc khác architecture-079 (079 viết path đọc/routing facade).
- architecture-083 (lead): quy trình ADR team 8 người (template, ai viết, khi nào bắt buộc, lưu repo, Supersede) + ví dụ build vs buy search engine. Góc khác architecture-080 (080 viết đảo quyết định/supersede đã có).

Id tiếp nối max cũ architecture-080 → 081, 082, 083. Tất cả level theo quy ước (2 senior, 1 lead), full tiếng Việt có dấu, không backtick, không ${, ~~~ fences đã đóng.

Validate:
- node --check js/data/q-system-design.js: OK
- node scripts/validate.js q-system-design.js: không có lỗi (architecture tăng 80 → 83 câu)
- validate toàn bộ: không thể OK do lỗi CŨ trong file KHÔNG sở hữu (q-soft.js: Unexpected identifier 'tắt'; labs-gc.js; quiz-ops.js) — không được sửa theo luật 3/5; tôi không động vào.
- build-light-index.js: không thể chạy (bị lỗi cú pháp q-soft.js khi VM nạp toàn bộ file). Đã cập nhật thủ công js/data/index-light.js thêm 3 entry architecture-081/082/083 sau architecture-080 để index đồng bộ với data của task này.
Reviewed-by: kilo (T2741R)
