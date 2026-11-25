# T2691R — Fact-check nội dung mới của T2691

Status: DONE
Agent: opencode
Owns: `js/data/q-ai.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2691 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- ai-156.a: Sửa lỗi markup — inline code dùng backtick (`\`<retrieved_document>\``) thay vì `{{code}}`. Đã đổi thành `{{<retrieved_document source="...">}}` và `{{</retrieved_document>}}`.
- ai-155, ai-156, ai-157: Kiểm tra kỹ thuật — nội dung đúng theo chuẩn RAG evaluation, prompt injection defense, LLM cost estimation. Không có lỗi kiến thức.
- validate.js còn báo lỗi ở file khác (q-sql.js, q-devops.js, quiz-java.js, labs-sql.js, lessons-*.js, path.js) — đây là lỗi sẵn có ở HEAD, không thuộc phạm vi task này.
