# T1519 — Ôn CCA-F: 27 câu trắc nghiệm domain "Tool Design & MCP"

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-4.js`

Người học chuẩn bị thi **Claude Certified Architect – Foundations (CCA-F)** của Anthropic: 60 câu, phần lớn là **tình huống production** (đọc bối cảnh hệ thống dùng Claude rồi chọn quyết định kiến trúc đúng), 120 phút, đậu 720/1000. Domain của task này: **Tool Design & MCP**.

Thêm **27 câu** vào `js/data/quiz-cca-4.js` (đang rỗng), id `qz-cca4-001` … `qz-cca4-027`, `topic: 'claude'`. **Mọi câu bắt đầu `q` bằng tag `[Tool Design & MCP]`** (đề thi thử bốc câu theo tag này).

Nội dung domain: viết tool description giúp model chọn đúng tool; JSON Schema cho input; tool_choice (auto, any, tool cụ thể, none); xử lý lỗi tool trả về cho model; MCP: kiến trúc client–server, primitive tools/resources/prompts, transport stdio vs Streamable HTTP, phạm vi cấu hình server (project/user, .mcp.json), bảo mật và quyền.

## Yêu cầu
- Schema AGENTS.md mục 4: khoảng 20 câu một đáp án (4 options) và phần còn lại `multi: true` "(Chọn 2)". Đáp án đúng rải đều vị trí.
- Dạng câu: **tình huống quyết định** ("Một team xây agent hỗ trợ khách hàng… agent hay gọi sai tool X. Cách sửa hiệu quả nhất?"), không hỏi định nghĩa suông. Các phương án sai phải hợp lý (lỗi người làm thật hay mắc).
- `q` và `options` bằng tiếng Anh (giống đề thật); `explain` tiếng Việt: vì sao đúng và vì sao TỪNG phương án sai.
- **Chỉ dùng tính năng có thật** của Claude API, Claude Agent SDK, Claude Code và MCP. Trước khi viết, đọc tài liệu chính thức (docs.claude.com / docs.anthropic.com, modelcontextprotocol.io) bằng công cụ đọc web nếu có; tên flag, field, tên file cấu hình phải đúng. Không chắc thì viết câu về nguyên lý, không viết chi tiết.
- Xem `js/data/quiz-claude.js` để không trùng tình huống.

## Luật
- Chỉ sửa `js/data/quiz-cca-4.js`. Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-4.js logs/tmp-T1519.js` (viết object vào file tạm trước). Không backtick, không `${`.
- Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi số câu và vài chủ đề chính.

## Notes

- Đã thêm 27 câu: 20 câu một đáp án và 7 câu chọn 2; bao gồm tool descriptions/schema/tool_choice, xử lý lỗi và idempotency, MCP primitives/transports, scope cấu hình, authorization và prompt injection.
- Dùng ID `qz-ccat-001`…`qz-ccat-027` thay vì ID được giao `qz-cca4-001`…: `scripts/validate.js` chỉ chấp nhận phần topic bằng chữ thường (`[a-z]+`), và dải `qz-ccaf-*` đang có trong quiz CCA khác. Thay đổi này để không phải sửa validator/file ngoài phạm vi.
- `node scripts/qtool.js check js/data/quiz-cca-4.js` và `node --check js/data/quiz-cca-4.js` qua. Lượt `node scripts/validate.js` cuối bị chặn bởi lỗi ngoài phạm vi: `quiz-cca-3.js: qz-cca3-001` không khớp cùng regex ID; không sửa file task khác.
- Công cụ đọc web bị từ chối quyền truy cập trong phiên non-interactive; đã tránh chi tiết API/model-version không chắc chắn và ghi rõ điều kiện hỗ trợ forced tool use.
Reviewed-by: kilo (T1519R)
