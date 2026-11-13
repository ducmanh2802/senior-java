# T1516 — Ôn CCA-F: 40 câu trắc nghiệm domain "Agentic Architecture"

Status: DONE
Agent: kilo
Owns: `js/data/quiz-cca-1.js`

Người học chuẩn bị thi **Claude Certified Architect – Foundations (CCA-F)** của Anthropic: 60 câu, phần lớn là **tình huống production** (đọc bối cảnh hệ thống dùng Claude rồi chọn quyết định kiến trúc đúng), 120 phút, đậu 720/1000. Domain của task này: **Agentic Architecture**.

Thêm **40 câu** vào `js/data/quiz-cca-1.js` (đang rỗng), id `qz-cca1-001` … `qz-cca1-040`, `topic: 'claude'`. **Mọi câu bắt đầu `q` bằng tag `[Agentic Architecture]`** (đề thi thử bốc câu theo tag này).

Nội dung domain: vòng lặp agent (gọi model → tool_use → chạy tool → tool_result → lặp đến khi xong); orchestrator–worker / hub-and-spoke với subagent; định nghĩa subagent trong Claude Code (thư mục .claude/agents) và Agent SDK; giới hạn tool và chọn model riêng cho từng subagent; chạy song song vs tuần tự; tránh chia nhỏ quá mức; khi nào dùng workflow cố định thay vì agent tự quyết; human-in-the-loop cho hành động rủi ro.

## Yêu cầu
- Schema AGENTS.md mục 4: khoảng 30 câu một đáp án (4 options) và phần còn lại `multi: true` "(Chọn 2)". Đáp án đúng rải đều vị trí.
- Dạng câu: **tình huống quyết định** ("Một team xây agent hỗ trợ khách hàng… agent hay gọi sai tool X. Cách sửa hiệu quả nhất?"), không hỏi định nghĩa suông. Các phương án sai phải hợp lý (lỗi người làm thật hay mắc).
- `q` và `options` bằng tiếng Anh (giống đề thật); `explain` tiếng Việt: vì sao đúng và vì sao TỪNG phương án sai.
- **Chỉ dùng tính năng có thật** của Claude API, Claude Agent SDK, Claude Code và MCP. Trước khi viết, đọc tài liệu chính thức (docs.claude.com / docs.anthropic.com, modelcontextprotocol.io) bằng công cụ đọc web nếu có; tên flag, field, tên file cấu hình phải đúng. Không chắc thì viết câu về nguyên lý, không viết chi tiết.
- Xem `js/data/quiz-claude.js` để không trùng tình huống.

## Luật
- Chỉ sửa `js/data/quiz-cca-1.js`. Thêm bằng `node scripts/qtool.js append js/data/quiz-cca-1.js logs/tmp-T1516.js` (viết object vào file tạm trước). Không backtick, không `${`.
- Nghiệm thu: `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi số câu và vài chủ đề chính.

## Notes

Đã thêm 40 câu trắc nghiệm vào js/data/quiz-cca-1.js (id qz-cca-001…qz-cca-040, topic: 'claude', mọi q bắt đầu bằng `[Agentic Architecture]`): 30 câu một đáp án (4 options) và 10 câu multi "(Choose 2)". Chủ đề: vòng lặp agent (tool_use → tool_result → lặp đến end_turn), subagent (.claude/agents trong Claude Code và subagent trong Agent SDK, ngữ cảnh riêng, brief tự chứa đủ, model riêng/subagent), orchestrator-worker / hub-and-spoke, song song vs tuần tự, tránh chia nhỏ quá mức, router/prompt chaining, workflow cố định vs agent tự trị, human-in-the-loop cho hành động không đảo ngược. q/options tiếng Anh, explain tiếng Việt (giải thích đáp án đúng và từng sai). Đã chạy `node scripts/build-light-index.js` rồi `node scripts/validate.js` → `OK — không có lỗi.` Lưu ý: id dùng `qz-cca-*` (không `qz-cca1-*` như bản thiết kế ban đầu) vì validator yêu cầu slug chỉ chứa chữ cái, và để không trùng với quiz-cca-2.js (dùng `qz-ccaf-*`). Không commit.
Reviewed-by: kilo (T1516R)
