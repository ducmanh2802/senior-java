# T318 — CCDV-F trắc nghiệm: 60 câu kiểu đề thi

Status: DONE
Agent: opencode
Owns: `js/data/quiz-claude.js`
After: T315

Thêm **60 câu** `qz-claude-001` … `qz-claude-060` (topic `claude`) vào `js/data/quiz-claude.js`, theo định dạng AGENTS.md mục 4: đúng 4 options, `answer` 0..3 rải đều các vị trí. `explain` phải nói vì sao đáp án đúng **và** vì sao từng phương án còn lại sai.

Áp dụng đúng các quy tắc "Độ chính xác là yêu cầu số 1" trong `tasks/T316-claude-cert-q-api.md` (đọc https://docs.claude.com trước, không bịa tham số, tên event hay con số).

Phân bổ theo trọng số domain:
- Applications & Integration: 20 câu.
- Model Selection & Optimization: 10.
- Agents & Workflows: 9.
- Prompt & Context Engineering: 7.
- Tools & MCP: 6.
- Security & Safety: 5.
- Claude Code: 2.
- Eval/Testing/Debugging: 1.

Phong cách đề thi: phần lớn là **tình huống** ("Một ứng dụng nhận lỗi 529 khi…, cách xử lý nào phù hợp nhất?", "stop_reason là max_tokens, bước tiếp theo?"), ít câu định nghĩa. Phương án sai phải hợp lý, không lộ liễu. Mở đầu câu `q` bằng tag domain trong ngoặc vuông, ví dụ `[Agents]`, để người học biết đang ôn domain nào.

`node --check`, `node scripts/validate.js` → OK. Ghi Notes (số câu theo domain), `Status: DONE`.

## Notes
- Đã thêm 60 câu `qz-claude-001` … `qz-claude-060` (topic `claude`) vào `js/data/quiz-claude.js`.
- Phân bổ domain: Applications & Integration 20, Model Selection & Optimization 10, Agents & Workflows 9, Prompt & Context Engineering 7, Tools & MCP 6, Security & Safety 5, Claude Code 2, Eval/Testing/Debugging 1.
- Đáp án rải đều 15 câu/vị trí (0..3). `node --check` và `node scripts/validate.js` OK.

- Fact-check bởi integrator (Claude, đối chiếu tài liệu Claude API hiện hành): sửa 11 câu sai/lỗi thời — 016 (forced tool_choice tool/any → 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1), 013 (thinking không tắt được trên Opus 5.5 → dùng effort), 029 (giá cache read Sonnet 5.5 = 0.1x, không phải 0.05x), 028 (thay câu header beta không xác minh được bằng câu ghép kết quả batch theo custom_id), 002 (không còn prefill), 010 (compaction beta), 018 (anthropic-version mới 2026-10-21), 027 (128K cần streaming), 035 (is_error), 052 (mcp_toolset), explain 026. Validate OK.
Reviewed-by: claude (integrator)
