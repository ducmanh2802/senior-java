# T2120 — Gắn tag 'core' cho ~40 câu lõi trong q-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/q-microservices.js`
After: T2108

Người học chỉ có 6 tháng, không thể học hết ~2000 câu. Cần **bộ câu lõi khoảng 400 câu** toàn ngân hàng. Việc của task này: trong `js/data/q-microservices.js` (topic: microservices), chọn **khoảng 40 câu** mà phỏng vấn Senior Java ở Việt Nam (ngân hàng, fintech, outsource lớn) **hay hỏi nhất**, rồi thêm chuỗi `'core'` vào mảng `tags` của câu đó (chưa có `tags` thì thêm `tags: ['core']`).

Tiêu chí chọn: chia service, giao tiếp sync/async, Kafka cơ bản (partition, consumer group, offset, thứ tự), saga, outbox, circuit breaker, retry/timeout, distributed tracing, cache Redis. Ưu tiên level mid/senior, câu có đáp án đầy đủ (có Tóm tắt + Trả lời mẫu); **không chọn 2 câu trùng ý** (nếu trùng chọn câu đáp án tốt hơn). Câu lead chỉ chọn khi thật kinh điển.

Cách làm: `node scripts/qtool.js list js/data/q-microservices.js` để xem danh sách id + câu hỏi, chọn trên danh sách đó (KHÔNG đọc cả file). Chỉ sửa đúng dòng `tags` (hoặc thêm dòng tags) của câu được chọn; **KHÔNG sửa nội dung q/a/follow, không xoá câu nào**. Đếm số câu trước/sau phải bằng nhau. Notes: liệt kê id đã gắn 'core'.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- Task này **chỉ sửa mảng tags** của các câu được chọn (ngoại lệ cho luật "chỉ thêm"); không sửa q/a/follow, không xoá câu, không sửa file khác. Đếm số câu trước/sau phải bằng nhau.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-microservices.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

Đã gắn `'core'` vào `tags` cho 40 câu (số câu trước/sau đều = 92; chỉ sửa dòng `tags`, không đổi q/a/follow):

microservices-001, 002, 003, 004, 005, 006, 007, 008, 009, 010, 011, 012, 014, 016, 018, 019, 020, 021, 024, 025, 026, 027, 028, 031, 033, 035, 041, 043, 047, 052, 053, 057, 060, 061, 064, 065, 067, 077, 078, 081

Phân bổ theo tiêu chí: chia service (001, 002, 027, 028), sync/async + gateway/BFF (003, 010, 011, 064), Kafka cơ bản (009, 019, 033, 035, 047, 052, 053), saga/outbox (004, 005, 043), idempotency/exactly-once (006, 031, 057, 081), resilience/timeout (007, 008, 025, 026, 060, 061), observability/tracing (012, 065), Redis (041), vận hành/API khác (014, 016, 018, 020, 021, 024, 067, 077, 078).

Nghiệm thu: `node --check js/data/q-microservices.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js có sẵn từ trước). Không commit.
Reviewed-by: kilo (T2120R)
