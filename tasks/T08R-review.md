# T08R — Fact-check nội dung mới của T08

Status: DONE
Agent: opencode
Owns: `js/data/q-english.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T08 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- english-032 to english-051: replaced repeated generic samples with question-specific English answers; removed Vietnamese text from English practice sections and added relevant examples and phrases.
- english-032 to english-051: expanded answer structure and follow-up practice to meet the required length; reviewed delivery guarantees, asynchronous processing, tense and article usage, and avoided unsupported claims or invented metrics.
- Ran node --check js/data/q-english.js and node scripts/validate.js; validator printed OK.
