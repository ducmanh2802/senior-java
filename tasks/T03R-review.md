# T03R — Fact-check nội dung mới của T03

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T03 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `spring-013`: bỏ `refs` bị chèn nhầm trong code sample; tránh khai báo `@ExceptionHandler` trùng xử lý validation của `ResponseEntityExceptionHandler`; sửa mô tả về 404 và cách override hook.
- `spring-012`: chỉnh mô tả thread pinning Java 21, bỏ khuyến nghị thay mọi `synchronized` bằng `ReentrantLock`; ghi rõ JEP 491 áp dụng từ Java 24.
- Các ID có bộ refs Spring/Hibernate chung chung: gỡ các link không trực tiếp hỗ trợ nội dung câu hỏi; giữ refs RFC 9457 và Spring REST Exceptions tại `spring-013`.
- Kiểm tra `node --check js/data/q-spring-data.js`, `git diff --check` và `node scripts/validate.js` đều đạt.