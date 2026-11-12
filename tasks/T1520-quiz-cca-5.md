# T1520 — Ôn CCA-F: 23 câu trắc nghiệm domain "Context Management"

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-5.js`

Người học chuẩn bị thi **Claude Certified Architect – Foundations (CCA-F)** của Anthropic: 60 câu, phần lớn là **tình huống production** (đọc bối cảnh hệ thống dùng Claude rồi chọn quyết định kiến trúc đúng), 120 phút, đậu 720/1000. Domain của task này: **Context Management**.

Thêm **23 câu** vào `js/data/quiz-cca-5.js` (đang rỗng), id `qz-cca5-001` … `qz-cca5-023`, `topic: 'claude'`. **Mọi câu bắt đầu `q` bằng tag `[Context Management]`** (đề thi thử bốc câu theo tag này).

Nội dung domain: giới hạn context window; hiện tượng lost-in-the-middle; tỉa bớt, tóm tắt, compaction; giao việc cho subagent để giữ context chính gọn; memory (CLAUDE.md, /memory); prompt caching; truyền lỗi có cấu trúc; khi nào chuyển cho người (escalation); ghi nguồn gốc thông tin (provenance).

## Yêu cầu
- Schema AGENTS.md mục 4: khoảng 17 câu một đáp án (4 options) và phần còn lại `multi: true` "(Chọn 2)". Đáp án đúng rải đều vị trí.
- Dạng câu: **tình huống quyết định** ("Một team xây agent hỗ trợ khách hàng… agent hay gọi sai tool X. Cách sửa hiệu quả nhất?"), không hỏi định nghĩa suông. Các phương án sai phải hợp lý (lỗi người làm thật hay mắc).
- `q` và `options` bằng tiếng Anh (giống đề thật); `explain` tiếng Việt: vì sao đúng và vì sao TỪNG phương án sai.
- **Chỉ dùng tính năng có thật** của Claude API, Claude Agent SDK, Claude Code và MCP. Trước khi viết, đọc tài liệu chính thức (docs.claude.com / docs.anthropic.com, modelcontextprotocol.io) bằng công cụ đọc web nếu có; tên flag, field, tên file cấu hình phải đúng. Không chắc thì viết câu về nguyên lý, không viết chi tiết.
- Xem `js/data/quiz-claude.js` để không trùng tình huống.

## Luật
- Chỉ sửa `js/data/quiz-cca-5.js`. Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-5.js logs/tmp-T1520.js` (viết object vào file tạm trước). Không backtick, không `${`.
- Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi số câu và vài chủ đề chính.

## Notes

- Đã hoàn thiện 23 câu về context window, compaction, subagent, CLAUDE.md/auto memory, prompt caching, xử lý lỗi, escalation và provenance.
- Dùng ID `qz-ccafive-NNN` thay cho `qz-cca5-NNN`: validator chỉ chấp nhận chữ cái ở phần topic của ID và ID `qz-ccaf-NNN` đã được các task CCA khác dùng.
- Không đọc được tài liệu web chính thức do quyền truy cập web bị chặn trong phiên non-interactive; tránh thêm chi tiết beta/phiên bản không cần thiết.
Reviewed-by: kilo (T1520R)
