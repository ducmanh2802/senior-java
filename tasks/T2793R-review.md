# T2793R — Fact-check nội dung mới của T2793

Status: DONE
Agent: opencode
Owns: `js/data/quiz-gaps.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2793 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed nội dung mới của T2793 trong `js/data/quiz-gaps.js`: 10 câu trắc nghiệm `qz-behavioral-020` → `qz-behavioral-029` (topic `behavioral`).
- Không có lỗi kỹ thuật: câu hỏi hành vi/mềm, không có API/flag/cơ chế kỹ thuật bịa, số liệu hoặc mặc định sai.
- Không lỗi markup: không có backtick `` ` `` hay `${` chưa escape bên trong nội dung template literal; dùng đúng `**…**`, `###`, `-`, `>`.
- Không chèn chữ nước ngoài ngoài thuật ngữ kỹ thuật (hotfix, deadline, sprint, stakeholder, rollback, mitigate, postmortem, MTTR, SRE, blocking/non-blocking, push back, no Friday deploys) — hợp lệ theo quy ước AGENTS.md.
- Câu `multi: true` (022, 025, 027) đều ghi `(Chọn 2)`, `answer` là mảng 2 index khác nhau, tăng dần, trong phạm vi options.
- `node scripts/validate.js`: không báo lỗi nào cho `quiz-gaps.js` / `qz-behavioral-*`.

Chặn (không do task này sở hữu, không được sửa theo quy tắc 3 AGENTS.md):
- `node scripts/build-light-index.js` bị crash do lỗi cú pháp trước đó ở `lessons-collections.js:3725` (`Unexpected identifier 'now'`) → không thể sinh lại `index-light.js`, validate báo `index-light.js` đã cũ.
- Các lỗi còn lại của `validate.js` nằm ở `quiz-ops.js` (qz-ai-051…060), `lessons-*.js`, `path.js` — file khác, không thuộc quyền sở nhiệm T2793R.