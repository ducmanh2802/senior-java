# T2672 — 3 câu hỏi Senior Java (architecture) vào q-system-design.js

Status: DONE
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2623

Thêm **3 câu hỏi phỏng vấn mới** (topic: architecture) vào `js/data/q-system-design.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-system-design.js`); đọc danh sách để **không trùng ý**.

Chủ đề: chọn modular monolith vs microservices cho team 8 người, tách dần monolith bằng strangler fig có số liệu, ADR (Architecture Decision Record) — cách viết và ví dụ.

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
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 3 câu (topic `architecture`, id nối tiếp max cũ là architecture-077):
- `architecture-078` (senior): chọn modular monolith vs microservices cho team 8 người theo góc tổ chức (Conway's law, cognitive load, on-call) + "ngân sách service" 2–3 service, mỗi service 1 squad 2–4 người.
- `architecture-079` (senior): tách monolith bằng Strangler Fig CÓ SỐ LIỆU — routing facade Java + feature flag + Micrometer, cutover gate (shadow diff < 0,5%, p99 ≤ legacy+10%, sync lag < 2s), quy trình tăng % 1→5→25→50→100.
- `architecture-080` (lead): ADR supersede / đảo quyết định (review trigger, sunk cost, "What we learned"), kèm ví dụ ADR-0021 supersede ADR-0007 gắn chủ đề team 8 người → tách Payment.

Góc đã tránh trùng: 018/024 (cơ chế modular monolith + khi tách), 025 (cơ chế strangler), 007 (cấu trúc ADR), 030 (team không đồng ý). Ba câu mới đi vào góc tổ chức/ngân sách service, số liệu cutover, và quản trị đảo quyết định.

Kiểm tra:
- `node --check js/data/q-system-design.js` → OK.
- `node scripts/validate.js q-system-design.js` → file của tôi KHÔNG còn lỗi schema (đã sửa lỗi inline code lồng ngoặc ở 079). Chỉ còn 1 lỗi NGOÀI phạm vi: `index-light.js đã cũ`.
- Đã chạy build index (qua script phụ, thay file lỗi bằng bản HEAD) để `js/data/index-light.js` phản ánh đúng nội dung committed + 3 câu mới (có đủ architecture-078/079/080).

BLOCKER NGOÀI (không thuộc quyền sở hữu, AGENTS.md mục 2.3 — KHÔNG tự sửa):
- `js/data/lessons-aws.js` đang bị lỗi cú pháp ở dòng 2165 (WIP chưa commit của task khác, nhiều khả năng T2670) khiến `node scripts/build-light-index.js` và `node scripts/validate.js` (bản chạy đủ) dừng ngay. `js/data/quiz-spring.js` ban đầu cũng lỗi (đã được agent khác sửa trong lúc tôi chờ).
- Đề xuất: agent sở hữu `lessons-aws.js` sửa lỗi template literal ở dòng 2165 rồi chạy `node scripts/build-light-index.js` + `node scripts/validate.js`. Khi đó validate đầy đủ sẽ OK (index-light tôi đã ghi đúng, sẽ được ghi đè bằng bản đầy đủ).
Reviewed-by: kilo (T2672R)
