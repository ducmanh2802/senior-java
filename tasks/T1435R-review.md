# T1435R — Fact-check nội dung mới của T1435

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1435 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- **english-026**: Sửa lỗi chữ nước ngoài/đánh máy sai trong mục "Useful phrases": `đườngritical path` → `đường găng / chuỗi công việc quyết định tiến độ (làm chậm một việc trong critical path sẽ làm trễ toàn bộ deadline)`. Giữ nguyên phần tiếng Anh `critical path` và giải thích đúng nghĩa.
- **english-019, 025, 026, 028, 033, 035** (nội dung mới T1435): Đã rà soát kỹ thuật/markup (không backtick, không `${`, `{{...}}` đúng); các khái niệm (notice period, gross/net, DLQ, retention, exponential backoff, idempotency, unique constraint, soak test, proactive communication, root cause vs blame/fault, BLUF, STAR) đều đúng và phù hợp ngữ cảnh phỏng vấn. Không phát hiện lỗi kỹ thuật/API bịa hay số liệu vô căn cứ cần sửa thêm.
- Đã chạy `node scripts/build-light-index.js` (bắt buộc sau khi sửa q-*.js) và `node scripts/validate.js` → OK (chỉ còn cảnh báo có sẵn: `lesson-design-007` không nằm trong PATH).
