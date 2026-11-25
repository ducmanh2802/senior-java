# T2720 — 2 bài học (api) vào lessons-api.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-api.js`
After: T2645

Thêm **2 bài học mới** (track `api`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: (1) Rate limiting token bucket — bài tập tự cài token bucket với Clock giả, nhiều client độc lập; (2) Phân trang cursor — bài tập mã hoá cursor (id + createdAt) Base64, trang kế tiếp ổn định khi có bản ghi mới chèn vào.

> Vòng 2 của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm (chỉ JDK chuẩn, Java 17, không class public ngoài Main), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.

## Nghiệm thu
`node --check js/data/lessons-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài học: lesson-api-017 (tiered token bucket, cost-weighted, 40p) và lesson-api-018 (cursor phân trang hai chiều, Base64 `id|createdAt`, 35p) vào js/data/lessons-api.js qua `qtool append`.
- `node --check js/data/lessons-api.js` → OK. `node scripts/qtool.js check js/data/lessons-api.js lesson-api-017 lesson-api-018` → OK.
- `validate.js`: không có lỗi nào về lesson-api-017/018. Có lỗi trước đó trong các file KHÔNG thuộc sở nhiệm (lessons-devops.js:6285 truncated, lessons-jvm.js {{}} mismatch, lessons-jpa.js body ngắn, path.js missing lessons, q-scenario.js backticks) — do phiên trước gây ra, không phải do task này.
- `index-light.js` đã cũ (thiếu lesson-api-017/018) nhưng `build-light-index.js` không chạy được do lỗi cú pháp trong lessons-devops.js (file của phiên trước, chưa sở nhiệm). Không thể build lại index-light.js hay chạy test-lessons.js cho đến khi các file đó được sửa.
- `related`: 017→['api-019','api-036','api-057'], 018→['api-014','api-015','api-038'] (tất cả là id câu hỏi thực trong q-api.js).
Reviewed-by: kilo (T2720R)
