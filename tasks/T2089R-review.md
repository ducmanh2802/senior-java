# T2089R — Fact-check nội dung mới của T2089

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2089 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 6 câu hỏi mới (spring-089 .. spring-094) trong `js/data/q-spring-data.js` (git diff HEAD).

### spring-089 — @TransactionalEventListener / @EventListener
- **Lỗi 1 (kiến thức)**: "rollback tx cha sẽ làm listener fail" — không chính xác. `@EventListener` chạy **đồng bộ trong cùng thread và cùng transaction** với caller; nếu listener ném exception thì transaction cha mới rollback. Đã sửa thành: listener ném exception → transaction cha rollback.
- **Lỗi 2 (kiến thức)**: "chạy trong thread của transaction cha, nên tác vụ nặng sẽ làm chậm commit" — sai, vì `AFTER_COMMIT` chỉ chạy **sau khi commit đã xong**. Đã sửa thành: không làm chậm commit, nhưng giữ thread request → làm chậm response; dùng `@Async` để tách biệt.
- **Lỗi 3 (kiến thức)**: "Một thư viện mail lỗi có thể treo luôn transaction của DB, dẫn tới deadlock pool DB" — không chính xác, vì với AFTER_COMMIT transaction đã commit rồi, không deadlock DB. Đã sửa thành: mail bị treo sẽ giữ thread request và cạn web thread pool; khi cần giao hàng/email dùng Outbox pattern.

### spring-091 — @Async / TaskDecorator / ThreadLocal
- **Lỗi 1 (kiến thức)**: "{{SecurityContextHolder}} là InheritableThreadLocal (có thể kế thừa)" — sai. `SecurityContextHolderStrategy` mặc định là `MODE_THREADLOCAL` (ThreadLocal thường); chỉ khi cấu hình `MODE_INHERITABLETHREADLOCAL` mới là InheritableThreadLocal. Đã sửa thành: SecurityContextHolder mặc định dùng MODE_THREADLOCAL, chỉ khi cấu hình MODE_INHERITABLETHREADLOCAL mới là InheritableThreadLocal.
- **Lỗi 2 (kiến thức)**: "vì nó thường được đặt là InheritableThreadLocal" — sai, đã sửa thành "mặc định là ThreadLocal".
- **Lỗi 3 (kiến thức)**: "luôn kiểm tra xem context đó có phải InheritableThreadLocal không" — không cần thiết, vì thread pool tái sử dụng thread, cơ chế kế thừa không hoạt động. Đã sửa thành: dù có là InheritableThreadLocal cũng vẫn phải copy thủ công vì thread pool tái sử dụng thread.

### spring-090, spring-092, spring-093, spring-094
- spring-090 (REQUIRES_NEW trong vòng lặp): nội dung đúng kỹ thuật, không sửa.
- spring-092 (Graceful Shutdown + K8s): đúng, không sửa.
- spring-093 (Liveness/Readiness probe + Actuator): đúng, không sửa.
- spring-094 (record cho ConfigurationProperties): đúng, không sửa.

### Kiểm tra
- `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo pre-existing: lessons không nằm trong PATH, T2093_append.js chưa khai báo — không phải của task này).
- `node scripts/build-light-index.js` → đã sinh lại `js/data/index-light.js` (297 KB).
- `node --check js/data/q-spring-data.js` → không lỗi cú pháp.
