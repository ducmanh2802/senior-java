# T2092R — Fact-check nội dung mới của T2092

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2092 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã diff HEAD với `js/data/q-scenario.js`: nội dung mới gồm 5 câu `scenario-155` → `scenario-159`.
- Fact-check kỹ thuật (PostgreSQL 15, Kafka 3.x, JDK 17/21, HikariCP/Spring Boot 3.x, Hibernate 6): cơ chế EXPLAIN (ANALYZE, BUFFERS)/ANALYZE/autovacuum, Metaspace/classloader/thread leak và `MaxMetaspaceSize`, Kafka consumer lag/poison message/DLQ/rebalance/`max.poll.*`, Hikari `idle in transaction`/`leakDetectionThreshold`/`@Transactional` + `parallelStream`, race condition đọc-ghi số dư và idempotency (`UPDATE ... WHERE balance >= ?`, unique `(account_id, request_id)`) — **không phát hiện lỗi kỹ thuật**.
- Kiểm tra markup/syntax: không có backtick, không có `${` không escape, `node --check js/data/q-scenario.js` OK. Không chỉnh văn phong/bố cục.
- `node scripts/validate.js` → OK (chỉ có cảnh báo pre-existing `path.js` bài học không nằm trong PATH; có lỗi pre-existing `new-questions.js` chưa khai báo trong `js/core/data-manifest.js`, không thuộc file task sở hữu, không sửa).
