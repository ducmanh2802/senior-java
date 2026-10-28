# T317 — CCDV-F câu hỏi tự luận (phần 2): Agents, Tools & MCP, Prompt/Context, Security, Claude Code, Evals

Status: DONE
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

- Done (Claude subagent): 22 câu claude-021..042 (6 mid, 12 senior, 4 lead; 3.2–4.4K ký tự/câu), chỉ append. Agents: vòng lặp tool_use/tool_result (021), điều kiện dừng + budget (022), lỗi tool + is_error + idempotency (023), orchestrator–subagent (024), human-in-the-loop (025). Tools & MCP: định nghĩa tool (026), tool_choice + 400 trên Opus/Sonnet 5.5, Fable 5.1 (027), parallel tool use (028), MCP + MCP connector (029). Prompt/context: system vs user + XML (030), few-shot + bỏ prefill (031), chaining + tài liệu dài (032), compaction/context editing/memory tool (033). Security: indirect injection (034), least privilege (035), secret/PII (036). Claude Code: CLAUDE.md/permission modes/hooks (037), headless CI/GitHub Actions/subagents/MCP (038). Eval: golden set + regression (039), debug tool không được gọi / JSON hỏng (040). Tổng hợp (theo note integrator): eval + LLM-as-judge cho agent CSKH (041), sự cố agent lặp vô hạn/gọi sai tool (042).
- Nguồn: các trang docs trong repo root (how-tool-use-works, define-tools, handle-tool-calls, parallel-tool-use, mcp-connector, remote-mcp-servers, prompt-best-practices, context-windows, mitigate-jailbreaks, develop-tests, memory, permission-modes, hooks-guide, headless, github-actions) + tải thêm compaction, context-editing, memory-tool, strict-tool-use, tool-runner, handling-stop-reasons (platform.claude.com) và sub-agents, mcp (code.claude.com).
- refs: 47 link platform.claude.com / code.claude.com / owasp.org / modelcontextprotocol.io; check-links 47 OK, 0 hỏng. validate OK.
- Ghi chú độ chính xác: các nhận định về "hạn chế của LLM-as-judge" (thiên vị độ dài/vị trí/self-preference) ở 041 là kiến thức chung, không lấy từ docs Claude; số liệu ví dụ (ngưỡng 85–90%, MAX_STEPS…) là gợi ý thực hành.
Reviewed-by: claude (subagent, grounded in docs.claude.com pages; validate OK, check-links 47/47)
