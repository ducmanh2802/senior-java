# T1592R — Fact-check nội dung mới của T1592

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-3.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1592 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check diff T1592 trong `js/data/quiz-cca-3.js`: `qz-ccap-046`–`qz-ccap-055`.
- Kiểm tra kỹ thuật: không phát hiện lỗi API/flag bịa, cơ chế ngược, số liệu vô căn cứ, hay markup sai (không backtick, không `${`, multi-choice đúng schema/answer/index, id tăng dần). Nội dung về system vs user/prompt injection, prompt caching (TTL/prefix, tách nội dung động), extended thinking tradeoff, tool descriptions, few-shot recency, parallel/sequential tool calls, context window là đúng.
- Không sửa nội dung câu hỏi mới; không chỉnh văn phong/độ dài/bố cục.
- Đã chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
- Không có lỗi kiến thức.
