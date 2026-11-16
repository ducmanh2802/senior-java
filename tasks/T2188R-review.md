# T2188R — Fact-check nội dung mới của T2188

Status: DONE
Agent: opencode
Owns: `js/data/lessons-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2188 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Fact-check nội dung mới T2188 trong `js/data/lessons-claude.js` (HEAD → working copy): `lesson-claude-010`, `lesson-claude-011`.
- Kiểm tra kỹ thuật (Claude Code): 3 cấp CLAUDE.md (user `~/.claude/CLAUDE.md`, project `./CLAUDE.md`, local `.claude/CLAUDE.local.md` không commit) và 3 cấp settings (`~/.claude/settings.json`, `.claude/settings.json`, `.claude/settings.local.json`) đúng; precedence/merge và nguyên tắc deny thắng allow khi khớp phù hợp. Permissions pattern dạng `Bash(...)` với wildcard `*` ở cuối và `Bash` (không ngoặc) khớp mọi lệnh Bash đúng theo ví dụ/mô hình bài. Hooks `PreToolUse`/`PostToolUse` với `matcher` + command, script đọc JSON stdin, exit code 2 để chặn (lý do stderr) đúng. Slash command trong `.claude/commands/*.md`. Headless `claude -p ... --output-format json` đúng. Không phát hiện API/flag bịa, mặc định sai, cơ chế ngược, số liệu vô căn cứ trong phần mới.
- Kiểm tra markup/code: không backtick thô trong template literal, không `${` interpolation, code fence dùng `~~~`; cấu trúc lesson/exercise/check hợp lệ; `node --check js/data/lessons-claude.js` OK.
- Đã chạy `node scripts/build-light-index.js` (sau diff data) và `node scripts/validate.js`. Validate hiện **FAIL** do lỗi markup `{{}}` lồng `{ }` trong `js/data/lessons-testing.js` (lesson-testing-002..009) — file ngoài phạm vi sở hữu của task này, không sửa theo luật 3. Không có lỗi kiến thức cần sửa trong `lessons-claude.js`.
- Không chạy `node scripts/test-lessons.js` (cần JDK/javac, chưa xác nhận môi trường và validate đang bị chặn bởi file khác); đề xuất integrator chạy sau khi `lessons-testing.js` được sửa.
