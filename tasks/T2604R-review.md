# T2604R — Fact-check nội dung mới của T2604

Status: DONE
Agent: opencode
Owns: `js/data/lessons-jpa.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2604 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi kiến thức. Đã fact-check 2 bài mới của T2604 (phần `git diff HEAD -- js/data/lessons-jpa.js`):

- **lesson-jpa-017 (Persistence context + dirty checking):** đúng — persistence context = EntityManager/Session; entity managed + snapshot để dirty checking; `flush()` gửi INSERT/UPDATE trong transaction hiện tại (chưa commit, vẫn rollback được); `clear()` xoá identity map + snapshot → entity thành detached; thứ tự `persist → flush → clear` chính xác; chunk size = `hibernate.jdbc.batch_size` là lời khuyên hợp lệ; `@Transactional(readOnly = true)` cho phần chỉ đọc đúng.
- **lesson-jpa-018 (Optimistic locking @Version):** đúng — lost update; `@Version` thêm `WHERE version=?`, 0 hàng → OptimisticLockException; retry phải ở lớp ngoài `@Transactional` (tx cũ rollback-only); bulk JPQL UPDATE không tự tăng version (phải `SET version = version + 1` hoặc HQL `UPDATE VERSIONED`); `ObjectOptimisticLockingFailureException` → HTTP 409; bảng so sánh optimistic vs pessimistic chính xác.

Bài tập: đã trace test với reference (Cả hai reference pass hết, starter biên dịch được). `related` của cả hai bài (jpa-022/024/025) đều tồn tại trong q-spring-data.js.

Không sửa gì (không có lỗi để sửa).

Kiểm chứng:
- `node scripts/validate.js` → `OK — không có lỗi.`
- `node scripts/test-lessons.js` → `Lesson exercises OK: 365/365`
