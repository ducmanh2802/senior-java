# T111R — Fact-check nội dung mới của T111

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T111 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `qz-devops-001`: Không thấy lỗi kỹ thuật; phân biệt đúng artifact bất biến với cấu hình runtime và migration schema.
- `qz-devops-002`: Không thấy lỗi kỹ thuật; `startupProbe` trì hoãn liveness/readiness cho đến khi startup thành công.
- `qz-kotlin-001`: Sửa backtick quanh `var` thành markup `{{var}}`, theo cú pháp inline code của ứng dụng.
- `qz-kotlin-002`: Không thấy lỗi kỹ thuật; làm rõ Java caller không bị compiler bắt buộc kiểm tra null dù Kotlin khai báo nullable.
