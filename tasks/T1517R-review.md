# T1517R — Fact-check nội dung mới của T1517

Status: DONE
Agent: opencode (re-verify)
Owns: `js/data/quiz-cca-2.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1517 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review toàn bộ 30 câu trong `js/data/quiz-cca-2.js` (qz-ccaf-001 → qz-ccaf-030). Không phát hiện lỗi kiến thức kỹ thuật, lỗi markup hay chữ nước ngoài lẫn vào.

- **Kiến thức đúng**: mọi đáp án, giải thích và thuật ngữ (CLAUDE.md / CLAUDE.local.md / user-level, path-scoped rules, permission allow/deny fail-closed, post-tool hook, plan mode, skill vs slash command, session độc lập, JSON vs stream-json output) đều chính xác so với Claude Code hiện hành.
- **Markup**: không backtick, không `${`, không HTML thô, không `###` bị thụt, không ký tự ngoại lai; đúng cú pháp `{{code}}`.
- **Schema**: 30/30 id dạng `qz-ccaf-NNN` tăng dần; `multi: true` (4 câu: 004/008/012/016/019/026/029) có `(Chọn N)` khớp answer.length, answer tăng dần, 4–6 options không trùng; single-answer có đúng 4 options và answer 0–3.
- **Không có lỗi** → không cần sửa nội dung nào.

**Lần chạy này (re-verify):** đọc lại toàn bộ 30 câu, xác nhận markup/schema đúng; chạy `node scripts/build-light-index.js` làm mới `js/data/index-light.js`, rồi `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo `lesson-design-007` trong path.js không liên quan task này; `quiz-cca-4.js` thuộc T1519, không phải quyền sở hữu).

Khác: đã chạy `node scripts/build-light-index.js` để làm mới `js/data/index-light.js` (file này bị cũ sau khi thêm quiz), rồi `node scripts/validate.js` → `OK — không có lỗi.` (lỗi `quiz-cca-4.js` thuộc task T1519 khác, không phải quyền sở hữu của task này).
