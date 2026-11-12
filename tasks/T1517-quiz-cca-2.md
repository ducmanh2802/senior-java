# T1517 — Ôn CCA-F: 30 câu trắc nghiệm domain "Claude Code Configuration"

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-2.js`

Người học chuẩn bị thi **Claude Certified Architect – Foundations (CCA-F)** của Anthropic: 60 câu, phần lớn là **tình huống production** (đọc bối cảnh hệ thống dùng Claude rồi chọn quyết định kiến trúc đúng), 120 phút, đậu 720/1000. Domain của task này: **Claude Code Configuration**.

Thêm **30 câu** vào `js/data/quiz-cca-2.js` (đang rỗng), id `qz-cca2-001` … `qz-cca2-030`, `topic: 'claude'`. **Mọi câu bắt đầu `q` bằng tag `[Claude Code Configuration]`** (đề thi thử bốc câu theo tag này).

Nội dung domain: thứ bậc CLAUDE.md (enterprise/managed, project, user) và CLAUDE.local.md; rules theo đường dẫn trong .claude/rules/; settings.json (permissions allow/deny, hooks); slash command, skills, plan mode; chạy headless trong CI/CD với -p và --output-format json; tách session để review code; giảm false positive khi tự động review.

## Yêu cầu
- Schema AGENTS.md mục 4: khoảng 23 câu một đáp án (4 options) và phần còn lại `multi: true` "(Chọn 2)". Đáp án đúng rải đều vị trí.
- Dạng câu: **tình huống quyết định** ("Một team xây agent hỗ trợ khách hàng… agent hay gọi sai tool X. Cách sửa hiệu quả nhất?"), không hỏi định nghĩa suông. Các phương án sai phải hợp lý (lỗi người làm thật hay mắc).
- `q` và `options` bằng tiếng Anh (giống đề thật); `explain` tiếng Việt: vì sao đúng và vì sao TỪNG phương án sai.
- **Chỉ dùng tính năng có thật** của Claude API, Claude Agent SDK, Claude Code và MCP. Trước khi viết, đọc tài liệu chính thức (docs.claude.com / docs.anthropic.com, modelcontextprotocol.io) bằng công cụ đọc web nếu có; tên flag, field, tên file cấu hình phải đúng. Không chắc thì viết câu về nguyên lý, không viết chi tiết.
- Xem `js/data/quiz-claude.js` để không trùng tình huống.

## Luật
- Chỉ sửa `js/data/quiz-cca-2.js`. Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-2.js logs/tmp-T1517.js` (viết object vào file tạm trước). Không backtick, không `${`.
- Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi số câu và vài chủ đề chính.

## Notes
- Added 30 English scenario questions covering instruction hierarchy and scoped rules, settings/permissions/hooks, commands/skills/plan mode, CI, and review quality.
- `scripts/validate.js` only accepts `qz-<letters>-NNN`; used `qz-ccaf-001` through `qz-ccaf-030` because the requested `qz-cca2-*` IDs fail that schema.
- Rebuilt `js/data/index-light.js`; `qtool check` and `node --check` pass for the owned quiz file. A full validation initially passed, but the latest full run is blocked by invalid IDs and mixed-language text in the unowned `quiz-cca-1.js`; left that file untouched.
Reviewed-by: kilo (T1517R)
