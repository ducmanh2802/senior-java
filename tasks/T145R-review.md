# T145R — Fact-check nội dung mới của T145

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T145 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- english-065 follow: sửa ngữ pháp "What if interviewer says..." → "What if the interviewer says..." và "How do you handle wrong assumption?" → "How do you handle a wrong assumption?"
- english-066 follow: sửa "How explain latency to PM?" → "How do you explain latency to a PM?", "What if stakeholder insists..." → "What if the stakeholder insists...", "How handle wrong technical term?" → "How do you handle a wrong technical term?"
- english-067 follow: sửa "What if interviewer keeps..." → "What if the interviewer keeps...", "How know when..." → "How do you know when...", "What is best way..." → "What is the best way..."
- Nội dung mới 064–071: không có lỗi kỹ thuật, markup đúng, không bịa API; chỉ sửa lỗi ngữ pháp tiếng Anh ở phần follow-up của 065, 066, 067.
- `node scripts/validate.js` → OK.
