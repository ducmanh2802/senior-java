# T2750R — Fact-check nội dung mới của T2750

Status: DONE
Agent: opencode
Owns: `js/data/q-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2750 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi kiến thức đã sửa trong nội dung mới của T2750 (q-microservices.js), mỗi id 1 lần:
- microservices-132: "Circuit breaker mở sau N lỗi liên tiếp" → "mở khi tỉ lệ lỗi vượt ngưỡng" (Resilience4j đánh giá failure rate trong sliding window, không phải lỗi liên tiếp). Sửa 2 lần (tóm tắt và trả lời miệng).
- microservices-133: "mTLS (L7)" → "mTLS (L4/TLS)" (mTLS của Istio vận hành lớp truyền tải/TLS, không phải L7).
- microservices-134: "Micrometer ContextPropagatingTaskDecorator" → "ContextPropagatingTaskDecorator (Spring Framework)" (lớp này thuộc Spring Framework, không phải Micrometer).

Không chỉnh văn phong, độ dài, bố cục; không thêm/xoá mục; không sửa nội dung đã có ở HEAD.
node --check q-microservices.js: OK. node scripts/validate.js: không báo lỗi đối với q-microservices.js. Các lỗi còn lại của validate.js (lessons-testing.js, quiz-ops.js, path.js, index-light.js cũ) nằm ở file ngoài quyền sở hữu task này, chưa động vào.
