# T1313R — Fact-check nội dung mới của T1313

Status: DONE
Agent: opencode
Owns: `js/data/q-aws.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1313 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

aws-028 (Lambda + SQS, ví dụ đời thực): sửa "xác nhận_duplicate" → "xác nhận trùng lặp" (chữ nước ngoài lẫn vào, gạch dưới kỳ cục).

6 ví dụ đời thực mới (aws-026..031) đã review: kiến thức chính xác (regional ACM cert, wildcard không khớp tên gốc, PITR tạo instance mới, partial batch response, visibility timeout ≥ 6× function timeout, EventBridge Scheduler + múi giờ, Snowball + DMS CDC, circuit breaker ECS, readiness vs liveness health check). Không có lỗi kỹ thuật, markup, hay backtick/${} nào khác.
