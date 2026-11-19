# T2447R — Fact-check nội dung mới của T2447

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2447 (xem `git diff HEAD -- <file>`) do model free viết, ĐÃ review.

Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
KẾT QUẢ: file `js/data/q-microservices.js` chứa 112 câu hỏi microservices, validate.js không báo lỗi/sửa đổi nào cho file này.
Tất cả question có định dạng `<topic>-NNN`, level hợp lệ (mid/senior/lead), answer ≥ 1000 ký tự, follow-up hợp lệ, no field lạ.
Mới thêm: microservices-108 đến microservices-112 (5 câu hỏi level senior/lead), nội dung Kafka/RabbitMQ đúng với Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không có lỗi markup, no backtick, no `${` lẫn trong template literal, no ký tự Trung/Nhật/Hàn/Nga lạ.

CHÍ KANH KIẾN THỨC: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. File đã review xong, không có lỗi kiến thức.

## Notes
file `js/data/q-microservices.js` – validate OK, 112 câu hỏi microservices, kiểm tra xong microservices-108 to -112, no technical errors, no markup errors, no foreign language mixing. Giữ nguyên nội dung đã có, chỉ verify đúng chuẩn.
