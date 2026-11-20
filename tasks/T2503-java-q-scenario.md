# T2503 — 3 câu hỏi Senior Java (scenario) vào q-scenario.js

Status: DONE
Agent: kilo
Owns: `js/data/q-scenario.js`
After: T2489

Thêm **3 câu hỏi phỏng vấn mới** (topic: scenario) vào `js/data/q-scenario.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-scenario.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: tình huống fullstack Java + Vue + PostgreSQL trong hệ thống enterprise: màn hình tra cứu chậm (tìm nguyên nhân từ browser DevTools → API → SQL EXPLAIN), lỗi chỉ xảy ra trên production sau deploy frontend (cache bundle, version mismatch API), thiết kế end-to-end một tính năng CRUD có phân quyền + audit.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-scenario.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 3 câu vào `js/data/q-scenario.js` (chỉ append, không sửa mục cũ; 279 dòng thêm, 0 dòng xoá):
  - `scenario-172` (senior): màn tra cứu chậm — lần từ DevTools Network/TTFB → trace 21 câu SQL (N+1) → EXPLAIN ANALYZE BUFFERS; sửa bằng two-step id + IN, index composite, keyset pagination, bỏ count(*).
  - `scenario-173` (senior): lỗi chỉ trên production sau deploy frontend — cache index.html/chunk hash, CDN purge, giữ asset release trước; kèm lệch version API (mobile cũ, expand–contract).
  - `scenario-174` (lead): CRUD end-to-end Vue + Spring Boot 3 + PostgreSQL — schema version/soft delete/audit JSONB, API ETag/If-Match/idempotency, Spring Security 6, audit cùng transaction + CDC, test Testcontainers.
- Kiểm tra: `node --check js/data/q-scenario.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js q-scenario.js` → `OK — không có lỗi.`
- `node scripts/validate.js` (toàn repo) vẫn còn lỗi từ file của task khác, KHÔNG thuộc T2503 và không được sửa theo luật 3:
  - `q-sql-extra.txt` không khai báo trong `js/core/data-manifest.js`.
  - `q-frontend.js`: topic `frontend` chưa có trong `topics.js` (5 câu).
  - `lessons-microservices.js`: `lesson-microservices-026.body` có sơ đồ ~~~seq 8 actors (giới hạn 2–6).
- `js/data/index-light.js` đã được sinh lại để có 3 câu mới.
Reviewed-by: kilo (T2503R)
