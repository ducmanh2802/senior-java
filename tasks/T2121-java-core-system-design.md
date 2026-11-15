# T2121 — Gắn tag 'core' cho ~30 câu lõi trong q-system-design.js

Status: DONE

Notes: Đã gắn tag 'core' cho 30 câu lõi trong js/data/q-system-design.js (28 câu đã có sẵn + 2 câu thêm: architecture-023 Kafka vs RabbitMQ, architecture-027 Event sourcing). Tổng cộng 30 câu có tag 'core', không câu nào bị xoá, không sửa q/a/follow. Đã chạy node scripts/build-light-index.js → node scripts/validate.js → OK — không có lỗi.
Agent: kilo
Owns: `js/data/q-system-design.js`
After: T2084

Người học chỉ có 6 tháng, không thể học hết ~2000 câu. Cần **bộ câu lõi khoảng 400 câu** toàn ngân hàng. Việc của task này: trong `js/data/q-system-design.js` (topic: design, architecture), chọn **khoảng 30 câu** mà phỏng vấn Senior Java ở Việt Nam (ngân hàng, fintech, outsource lớn) **hay hỏi nhất**, rồi thêm chuỗi `'core'` vào mảng `tags` của câu đó (chưa có `tags` thì thêm `tags: ['core']`).

Tiêu chí chọn: URL shortener, rate limiter, notification, thiết kế hệ thống thanh toán/đặt hàng, caching, scale DB (replica, sharding), SOLID, design pattern hay dùng (Strategy, Factory, Builder, Observer), clean architecture. Ưu tiên level mid/senior, câu có đáp án đầy đủ (có Tóm tắt + Trả lời mẫu); **không chọn 2 câu trùng ý** (nếu trùng chọn câu đáp án tốt hơn). Câu lead chỉ chọn khi thật kinh điển.

Cách làm: `node scripts/qtool.js list js/data/q-system-design.js` để xem danh sách id + câu hỏi, chọn trên danh sách đó (KHÔNG đọc cả file). Chỉ sửa đúng dòng `tags` (hoặc thêm dòng tags) của câu được chọn; **KHÔNG sửa nội dung q/a/follow, không xoá câu nào**. Đếm số câu trước/sau phải bằng nhau. Notes: liệt kê id đã gắn 'core'.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- Task này **chỉ sửa mảng tags** của các câu được chọn (ngoại lệ cho luật "chỉ thêm"); không sửa q/a/follow, không xoá câu, không sửa file khác. Đếm số câu trước/sau phải bằng nhau.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-system-design.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Reviewed-by: kilo (T2121R)
