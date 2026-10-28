# T317 — CCDV-F câu hỏi tự luận (phần 2): Agents, Tools & MCP, Prompt/Context, Security, Claude Code, Evals

Status: TODO
Agent: opencode
Owns: `js/data/q-claude.js`
After: T316

Thêm **22 câu** `claude-021` … `claude-042` vào `js/data/q-claude.js`. Chỉ thêm, không sửa câu của T316. Áp dụng đúng các quy tắc "Độ chính xác là yêu cầu số 1" trong `tasks/T316-claude-cert-q-api.md`: đọc https://docs.claude.com (tool use, MCP, agents/Agent SDK, prompt engineering, context windows, Claude Code docs, evals, guardrails), không bịa, có `refs`, chạy `check-links`.

Phân bổ theo domain:
- **Agents & Workflows (5):** vòng lặp agent (`tool_use` → chạy tool → `tool_result` → lặp đến `end_turn`); workflow cố định so với agent tự quyết; orchestrator–subagent; điều kiện dừng và giới hạn số bước; human-in-the-loop; xử lý lỗi tool.
- **Tools & MCP (4):** viết định nghĩa tool tốt (tên, mô tả, `input_schema`); `tool_choice`; nhiều tool chạy song song; MCP là gì (server/client, tools/resources/prompts), khi nào viết MCP server so với tool thường.
- **Prompt & Context Engineering (4):** system prompt so với user turn, XML tags, few-shot, prefill (chỉ viết nếu docs hiện hành còn hỗ trợ cho model đó), chia nhỏ tác vụ; quản lý context dài (tóm tắt, retrieval, context editing nếu docs có).
- **Security & Safety (3):** prompt injection từ dữ liệu tool/web, nguyên tắc least privilege cho tool, xác nhận trước hành động nguy hiểm, không đưa secret vào prompt, xử lý dữ liệu nhạy cảm.
- **Claude Code (2):** CLAUDE.md, permission modes, hooks, subagents, MCP trong Claude Code, dùng trong CI (headless).
- **Eval, Testing & Debugging (2):** xây golden set, LLM-as-judge và hạn chế của nó, regression khi đổi model hay prompt, debug khi tool không được gọi hoặc JSON hỏng.
- **Tổng hợp tình huống (2, level lead):** thiết kế trợ lý nội bộ dùng Claude cho công ty Java (kiến trúc, chi phí, bảo mật, eval); chuyển ứng dụng từ model cũ sang Claude 5.

Chuẩn đáp án như T316. `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes


> Integrator (cập nhật sau T316): **không viết trùng** các chủ đề đã có trong claude-001..020: migration lên model 5.x (claude-017), knowledge/RAG/MCP cho doanh nghiệp (claude-018), Agent Skills (claude-019), workflow vs agent + quản trị (claude-020), structured outputs (claude-009), refusal (claude-015). Mục "Tổng hợp tình huống" thay bằng 2 câu khác: (1) thiết kế eval + LLM-as-judge cho một agent hỗ trợ khách hàng; (2) debug một agent chạy vòng lặp vô hạn / gọi sai tool trên production. Lưu ý API hiện hành: forced tool_choice any/tool trả 400 trên Opus 5.5/Sonnet 5.5/Fable 5.1; không còn prefill; dùng effort thay budget_tokens.
