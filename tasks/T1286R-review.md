# T1286R — Fact-check nội dung mới của T1286

Status: DONE
Agent: opencode
Owns: `js/data/q-remote.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1286 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fixed template literal syntax errors in `js/data/q-remote.js`:
  - Line 315: Reverted `npm install` and `npm start` from backticks to proper inline code markup `{{npm install}}` and `{{npm start}}` (original markup was correct; backticks inside template literal broke JS parsing)
  - Line 5262: Reverted `GET /users/:id` and `/invoices/:id` from backticks to proper inline code markup `{{GET /users/:id}}` and `{{/invoices/:id}}`
- Validation passes for q-remote.js (66 questions). Remaining validation errors are in lessons-testing.js (not owned by this task).
- Ran `node scripts/build-light-index.js` to rebuild search index.
