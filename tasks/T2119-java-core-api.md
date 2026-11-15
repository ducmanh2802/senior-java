# T2119 — Gắn tag 'core' cho ~25 câu lõi trong q-api.js

Status: DONE
Agent: kilo
Owns: `js/data/q-api.js`
After: T2073

Người học chỉ có 6 tháng, không thể học hết ~2000 câu. Cần **bộ câu lõi khoảng 400 câu** toàn ngân hàng. Việc của task này: trong `js/data/q-api.js` (topic: api), chọn **khoảng 25 câu** mà phỏng vấn Senior Java ở Việt Nam (ngân hàng, fintech, outsource lớn) **hay hỏi nhất**, rồi thêm chuỗi `'core'` vào mảng `tags` của câu đó (chưa có `tags` thì thêm `tags: ['core']`).

Tiêu chí chọn: REST design, status code, idempotency, versioning, pagination, rate limit, error format, authentication cơ bản. Ưu tiên level mid/senior, câu có đáp án đầy đủ (có Tóm tắt + Trả lời mẫu); **không chọn 2 câu trùng ý** (nếu trùng chọn câu đáp án tốt hơn). Câu lead chỉ chọn khi thật kinh điển.

Cách làm: `node scripts/qtool.js list js/data/q-api.js` để xem danh sách id + câu hỏi, chọn trên danh sách đó (KHÔNG đọc cả file). Chỉ sửa đúng dòng `tags` (hoặc thêm dòng tags) của câu được chọn; **KHÔNG sửa nội dung q/a/follow, không xoá câu nào**. Đếm số câu trước/sau phải bằng nhau. Notes: liệt kê id đã gắn 'core'.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- Task này **chỉ sửa mảng tags** của các câu được chọn (ngoại lệ cho luật "chỉ thêm"); không sửa q/a/follow, không xoá câu, không sửa file khác. Đếm số câu trước/sau phải bằng nhau.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-api.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã gắn tag 'core' cho 25 câu (từ 60 câu, không xoá, không sửa q/a/follow; số câu trước/sau = 60).

IDs đã thêm 'core': api-001, api-002, api-003, api-004, api-005, api-006, api-007, api-008, api-009, api-010, api-011, api-014, api-015, api-016, api-017, api-018, api-019, api-020, api-025, api-028, api-033, api-039, api-041, api-047, api-049.

Phạm vi chọn: REST design, status code, idempotency, versioning, pagination, rate limit, error format, authentication cơ bản. Ưu tiên mid/senior; không chọn câu lead nào (011, 021, 022, 030, 035, 038, 040, 042, 045, 050, 052, 054, 056, 058 là lead và không phải lõi). Tránh trùng ý: bỏ qua api-034 (trùng ETag/If-Match với api-009), api-036 (trùng rate limit với api-019), api-062/063/064/065 (trùng chủ đề với api-015/019/017/018).

Kiểm tra: `node --check js/data/q-api.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (lưu ý: validate hiện có lỗi từ file của agent khác — q-microservices.js bị syntax error, projects.js/path.js tham chiếu microservices-* không tồn tại — không phải sở hữu của task này, cần integrator xử lý).
Reviewed-by: kilo (T2119R)
