# T301R — Fact-check nội dung mới của T301

Status: DONE
Agent: opencode
Owns: `js/data/lessons-architecture.js`, `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T301 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- Reviewed `js/data/lessons-architecture.js` and `js/data/lessons-microservices.js`. The uncommitted change added `**Tóm tắt:**` lines to the 8 architecture lessons; content technically sound (Strategy+Factory, State, Observer, hold/confirm, net balance, filter chain, Command).
- No backticks, `${`, unbalanced `{{}}`, stray CJK chars, or HTML tags found. Check questions include per-option explanations.
- `node --check` OK; `node scripts/validate.js` → OK; `node scripts/test-lessons.js` → 91/91 pass.
