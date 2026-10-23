# T85R — Fact-check nội dung mới của T85

Status: DONE
Agent: opencode
Owns: `js/data/lessons-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T85 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `lesson-spring-003`: bài tập rollback trước đó gọi `CheckedFailure` nhưng lớp này kế thừa `RuntimeException`, khiến ví dụ gán nhầm unchecked exception thành checked. Đổi thành `MarkerFailure`, ghi rõ đây chỉ là marker cho rollback rule cấu hình; phần lý thuyết vẫn nêu chính xác mặc định của Spring với checked exception.
- `node scripts/validate.js` → OK.
- `node --check js/data/lessons-spring.js` → OK; cả năm bài `lesson-spring-001` đến `lesson-spring-005` đều pass kiểm tra riêng bằng `node scripts/test-lessons.js lesson-spring-NNN`.
- Chạy toàn bộ `node scripts/test-lessons.js` đạt 35/36, còn lỗi biên dịch tại `lesson-modern-002#1` (constructor `Address`/`Order` trong file ngoài quyền sở hữu T85R). Không sửa file ngoài task; đã xác nhận toàn bộ năm bài Spring đều pass độc lập.
