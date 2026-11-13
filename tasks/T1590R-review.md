# T1590R — Fact-check nội dung mới của T1590

Status: DONE
Agent: opencode
Owns: `js/data/quiz-cca-1.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1590 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Reviewed new items added by T1590 in `js/data/quiz-cca-1.js`: `qz-cca-066`..`qz-cca-077` (agentic architecture: parallel write race condition, approval gate for costly actions, subagent brief, context summarization, cache+TTL, circuit breaker, 429/backoff, schema+confidence validation, checkpoint persistence, tool descriptions, clarification, human handoff). Nội dung kỹ thuật/markup hợp lý, không phát hiện API/flag bịa hay cơ chế sai.
- `qz-cca-067`: sửa lỗi chính tả/lẫn từ trong explain (`chol phí` → `gây chi phí`).
- `qz-cca-077`: sửa từ nước ngoài/lỗi chính tả trong explain (`narks nộ` → `bức xúc`).
- `node scripts/validate.js` → OK (có cảnh báo cũ `path.js` về bài học chưa nằm trong PATH, không thuộc file sở hữu). Không chạy `test-lessons.js` vì task không sửa bài học.
