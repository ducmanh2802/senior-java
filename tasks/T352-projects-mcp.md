# T352 — Pet project MCP: DB Inspector, Prep Coach, Ops Assistant

Status: DONE
Agent: opencode
Owns: `js/data/projects.js`
After: T328

Người dùng muốn **thực hành viết MCP server** (Model Context Protocol). Thêm 3 dự án vào cuối mảng `window.PROJECTS`. Dùng định dạng đầy đủ mà T326/T327 đã thiết lập: `design`, `interview.answers`, milestone có các bước đánh số và code mẫu. Áp dụng toàn bộ yêu cầu chất lượng trong `tasks/T327-projects-deep-a.md` và hồ sơ người đọc (dev 4 năm, giải thích từ gốc).

**Độ chính xác:**
- Đọc tài liệu chính thức trước khi viết: https://modelcontextprotocol.io (spec, khái niệm tools/resources/prompts, transport stdio và Streamable HTTP), MCP Java SDK, Spring AI MCP Server.
- Tên artifact, class, annotation **phải** lấy từ tài liệu. Không chắc thì mô tả bằng lời và ghi "xem tài liệu SDK", **không bịa API**.
- Kết nối thử bằng Claude Code (lệnh `claude mcp add`, xem docs Claude Code) hoặc MCP Inspector.

1. **`proj-mcp-db-inspector`**: MCP server chỉ-đọc cho PostgreSQL (level senior, ~4 tuần, Java 21 + Spring Boot).
   - Tools:
     - `list_tables`, `describe_table`;
     - `explain_query` (EXPLAIN ANALYZE BUFFERS trong transaction READ ONLY rồi rollback);
     - `sample_rows` (limit ≤ 50, che cột PII);
     - `slow_queries` (pg_stat_statements).
   - Bảo mật (trọng tâm phỏng vấn):
     - DB user chỉ có SELECT;
     - `SET TRANSACTION READ ONLY` + `statement_timeout`;
     - chặn nhiều statement;
     - giới hạn kích thước kết quả;
     - audit log;
     - phòng prompt injection từ dữ liệu trong bảng.
   - Test bằng Testcontainers.
2. **`proj-mcp-prep-coach`**: MCP server cho chính site ôn tập này (level mid, ~2 tuần).
   - Tools: `search_questions(topic, level)`, `get_due_reviews`, `random_quiz(topic)`, `record_result(id, status)`.
   - Resources: đáp án mẫu theo id.
   - Phân biệt tool và resource; transport stdio để dùng với Claude Code / Claude Desktop.
   - Ngôn ngữ: Java, hoặc Node nếu muốn đọc trực tiếp dữ liệu `js/data` (ghi rõ trade-off).
3. **`proj-mcp-ops-assistant`**: MCP server cho Spring Boot Actuator + log (level senior, ~3 tuần).
   - Tools: `health`, `metrics(name)`, `thread_dump` (kèm gợi ý đọc deadlock), `search_logs(query, since, limit)`.
   - Tool chỉ-đọc; hành động ghi (restart, đổi log level) cần xác nhận của con người.
   - Rút gọn output (không trả 10MB log).

Mỗi dự án có:
- mục `### Thiết kế tool cho AI` (tên, description nói rõ khi nào dùng, input_schema chặt, output gọn, lỗi rõ ràng);
- mục "Demo trong 5 phút";
- 8 câu phỏng vấn đào sâu kèm đáp án.

`related` trỏ tới `claude-018`, `claude-020` và câu `db-*` liên quan (có thật). Ghi file theo từng dự án; sau mỗi dự án chạy `node --check js/data/projects.js` + `node scripts/validate.js`. Ghi Notes, `Status: DONE`.

## Notes

- Added proj-mcp-db-inspector (senior, 4w), proj-mcp-prep-coach (mid, 2w), proj-mcp-ops-assistant (senior, 3w) at the end of window.PROJECTS; existing projects untouched.
- Each: requirements (user stories + acceptance, NFR, out-of-scope), architecture, design 4.1k–5.9k chars with "### Thiết kế tool cho AI" table (+ tools/list JSON example), ASCII flow, error/security table, test strategy; 4–5 milestones with numbered steps + commented code; 4–5 challenges; STAR + "### Demo trong 5 phút"; 8 questions + answers (560–690 chars).
- Sources checked (Oct 2026): modelcontextprotocol.io spec 2026-07-28 (tools/resources/prompts, stdio + Streamable HTTP, security best practices, -32602 for missing resource, token passthrough forbidden), MCP Inspector docs (npx @modelcontextprotocol/inspector, --cli, --server-url/--transport http), Java SDK repo/docs, Spring AI 1.1 docs (spring-ai-bom 1.1.x for Boot 3.4/3.5; starters spring-ai-starter-mcp-server / -webmvc; spring.ai.mcp.server.stdio/name/version/instructions/protocol=STREAMABLE; @McpTool, @McpToolParam, @McpTool.McpAnnotations, @McpResource, @McpPrompt/@McpArg, ReadResourceResult, TextResourceContents, GetPromptResult, PromptMessage), Claude Code MCP docs (claude mcp add --transport stdio/http, --env, --header, list/get, /mcp, @server:uri resources, /mcp__server__prompt, MAX_MCP_OUTPUT_TOKENS 10k warn/25k default, MCP_TIMEOUT).
- Not fully verified (worded cautiously in content / "xem tài liệu SDK"): how a thrown exception from @McpTool maps to isError (left to SDK docs + Inspector check); Spring AI 1.1 default Streamable HTTP path /mcp (confirmed only in 2.0 docs); Spring docs show annotations = McpTool.McpAnnotations(...) without @ — content uses the valid Java form @McpTool.McpAnnotations(...); readOnlyHint/destructiveHint/idempotentHint names confirmed via Spring AI docs, openWorldHint only in the JSON example; Spring Boot ECS log field names (told learner to check real log file); Node TS SDK API not described (pointed to docs).
- Verification: node --check OK. Working-tree validate fails only due to other agents' in-progress q-microservices.js / q-devops.js; validate on a git archive HEAD copy + this projects.js → "OK — không có lỗi." No refs added, so check-links not needed.
Reviewed-by: claude (subagent; MCP APIs from official docs, unverified items in Notes; validate OK on HEAD+projects.js)
