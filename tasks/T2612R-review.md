# T2612R — Fact-check nội dung mới của T2612

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2612 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa quiz-design.js: xoá trường `level` không hợp lệ khỏi 10 câu hỏi quiz microservices mới (qz-microservices-043 đến qz-microservices-052). Theo AGENTS.md mục 4, quiz question chỉ cho phép các field: id, topic, q, options, answer, explain, multi (tuỳ chọn). Trường `level` chỉ dành cho câu hỏi tự luận (q-*.js).

Lưu ý: validate.js vẫn báo lỗi ở sd-problems.js (lỗi cú pháp), quiz-java.js (id trùng/options trùng), và index-light.js (cũ) — nhưng các file này KHÔNG thuộc sở hữu của task này (task chỉ sở hữu quiz-design.js).
