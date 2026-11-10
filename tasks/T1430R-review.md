# T1430R — Fact-check nội dung mới của T1430

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1430 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fixed technical inaccuracy in lesson-microservices-011 (Idempotent producer): production error bullet #1 incorrectly stated that `delivery.timeout.ms` causes broker to invalidate PID/sequence. Corrected to: PID expiration is due to `transactional.id.expiration.ms` (default 7 days inactivity) or broker restart losing state, or new producer with same `transactional.id` fencing old epoch. The `delivery.timeout.ms` is a client-side send timeout, not a broker-side PID expiration trigger.
- Pre-existing validation error in `q-remote.js` (userId not defined) unrelated to this task; noted but not fixed per ownership rules.
- All lesson exercises pass (219/219).
