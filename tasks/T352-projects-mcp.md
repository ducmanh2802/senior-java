# T352 — Pet project MCP: DB Inspector, Prep Coach, Ops Assistant

Status: TODO
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

