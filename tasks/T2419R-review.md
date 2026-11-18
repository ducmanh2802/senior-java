# T2419R — Fact-check nội dung mới của T2419

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2419 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. 5 câu hỏi mới (english-210..214) đều đúng kỹ thuật: cấu trúc giới thiệu 3 câu có impact metric, RCA timeline có GC pause/thread pool thực tế, bảng so sánh Kafka/RabbitMQ và SQL/NoSQL phản ánh đúng throughput/ordering/replay/trade-off, mentoring có kế hoạch 90 ngày đo lường được, 3 câu hỏi closure chiến lược. Markup hợp lệ, không có `${`/backtick, ID tuần tự, topic khớp file. Validate OK (lỗi hiển thị là file khác có sẵn từ trước).
