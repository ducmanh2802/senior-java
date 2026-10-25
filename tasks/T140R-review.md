# T140R — Fact-check nội dung mới của T140

Status: DONE
Agent: opencode
Owns: `js/views/path.js`, `css/views/path.css`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T140 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Reviewed `js/views/path.js` and `css/views/path.css` (full learning path view implementation)
- No technical errors found: i18n integration correct, stage unlock logic (requires + 70% questions known) matches spec, progress calculations deduplicate IDs across stages, keyboard shortcut 'c' for continue, state persistence for open/closed/peeked stages across re-renders
- No markup issues (view generates UI HTML directly, not content markup)
- No foreign language mixing: all user-facing strings go through `App.t()` with proper vi/en translations
- CSS selectors all scoped to `.view-path`, uses CSS custom properties for dark mode, responsive at 640px
- `node scripts/validate.js` → OK
- `node scripts/test-lessons.js` → 72/72 exercises pass
- `node --check js/views/path.js` → no syntax errors
