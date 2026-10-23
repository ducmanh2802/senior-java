# T71R — Fact-check nội dung mới của T71

Status: DONE
Agent: opencode
Owns: `js/views/interview.js`, `css/views/interview.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T71 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `js/views/interview.js`: fact-check API JD/interview against `App.ai.jd` and contract; valid fields, level enum, topic mapping, and seed shape match. Fixed stale-analysis behavior so editing a JD invalidates its stored result and disables starting until re-analysis; also guard the 200-character API minimum and prevent empty JD mode from starting a regular topic interview.
- `css/views/interview.css`: selectors use view scope and CSS variables; no technical or markup issue found.
- Verification: `node --check js/views/interview.js` and `node scripts/validate.js` both pass.
