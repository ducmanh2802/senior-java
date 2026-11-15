# T2077R — Fact-check nội dung mới của T2077

Status: DONE
Agent: opencode
Owns: `js/data/quiz.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2077 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- `qz-microservices-028` (multi): `explain` ghi "Đáp án đúng: 0 và 1" và gán nhãn phương án sai lệch 1 so với `answer: [1, 2]` (mô tả "0 — orchestration"/"1 — choreography" thực ra là index 1/2 của mảng, còn index 0 bị gán nhầm). Sửa thành "Đáp án đúng: 1 và 2.", relabel đúng: "- 1 — orchestration", "- 2 — choreography", "- 0 — choreography có coordinator trung tâm".
- `index-light.js` báo cũ sau khi thêm câu hỏi quiz → chạy `node scripts/build-light-index.js`; validate không còn báo stale.
- Các lỗi validate còn lại nằm ở file khác (`q-concurrency-jvm.js`, `bugs.js`, `lessons-banking.js`, `toeic.js`, `path.js`, `new-questions.js`) — không thuộc quyền sở hữu T2077R, không sửa theo luật 3.
- Không phát hiện lỗi kỹ thuật khác trong 12 câu quiz mới của T2077 (Resilience4j HALF_OPEN, Saga compensation/outbox/idempotency key/optimistic locking… đều chính xác). `node --check js/data/quiz.js` OK.
