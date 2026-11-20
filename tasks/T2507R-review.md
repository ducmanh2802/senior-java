# T2507R — Fact-check nội dung mới của T2507

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2507 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- sql-087 (Sequence vs IDENTITY):
  * Đổi mọi ký tự backtick trong `a` thành `{{code}}` (id BIGINT..., Statement.RETURN_GENERATED_KEYS, hibernate.jdbc.batch_size=100 x3, @SequenceGenerator, @GeneratedValue x2, ORA-02714, SELECT sequence_name..., application.properties) — backtick làm vỡ template literal và vi phạm quy tắc markup.
  * Đổi fence ``` thành `~~~java` / `~~~text` theo quy tắc markup.
  * Sửa cờ Spring Boot sai: `spring.hibernate.order_inserts = true` → `spring.jpa.properties.hibernate.order_inserts = true` (prefix `spring.hibernate.` không tồn tại).
  * Xoá block `### Follow-up` trùng lặp nằm bên trong `a` (giữ nguyên trường `follow`).
  * Sửa từ lạ/chính tả: `設置` → `cài đặt`, `affected` → `ảnh hưởng`, `Lộ mếu` → `Lở mước`, `habt` → `hết`, `một 分` → `một phần`, văn bản hỏng `"chấp nhận có thể có lở mước nếu rollback"`.
- sql-094: sửa `"cay chi sau 3-4 muc"` → `"cay chi 3-4 muc"`.
- sql-095/096/097/098: không có lỗi kiến thức (sql-097 về MySQL ICP mô tả đúng, nội dung HEAD của file này đã có MySQL).
- validate.js: không còn lỗi nào thuộc `js/data/q-sql.js`. LỖI còn lại của validate (path.js, bugs.js, lessons-*.js, projects.js, q-frontend.js, cú pháp q-concurrency-jvm.js/q-spring-data.js/q-microservices.js/q-system-design.js, index-light đã cũ) là lỗi trước đó trong các file KHÔNG do task này sở hữu — lỗi cú pháp q-concurrency-jvm.js làm build-light-index crash nên index-light không thể sinh lại đầy đủ. Theo quy tắc quyền sở hữu (AGENTS.md mục 3) không được sửa các file đó.
