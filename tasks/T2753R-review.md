# T2753R — Fact-check nội dung mới của T2753

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2753 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review 2 bài mới (lesson-microservices-031 circuit breaker time-based sliding-window, lesson-microservices-032 idempotency payment). Không tìm thấy lỗi kỹ thuật, markup, hay chữ nước ngoài ngoài convention. State machine, bucket evict, minimumCalls, half-open probe, decline-là-DONE, fingerprint→422, scope theo account, PENDING→409 đều đúng và trùng khớp với reference implementation. node --check OK. validate.js không báo lỗi trên file sở hữu (các lỗi còn lại nằm trong quiz-ops.js, lessons-modern.js, lessons-jpa.js — không sở hữu, không được sửa). test-lessons.js: 444/453 OK, 9 thất bại đều ở bài khác, không liên quan.
