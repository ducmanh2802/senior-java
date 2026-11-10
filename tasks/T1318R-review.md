# T1318R — Fact-check nội dung mới của T1318

Status: DONE
Agent: opencode
Owns: `js/data/q-claude.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1318 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Review `git diff HEAD -- js/data/q-claude.js`: nội dung mới là 6 block bổ sung ("### Ví dụ đời thực" + "### Trả lời mẫu khi phỏng vấn") cho `claude-025`..`claude-030` (tool use / HITL, tool definition, tool_choice, parallel tool use, MCP, system prompt). Không sửa nội dung HEAD, không xoá/thêm mục ngoài phần mới đã có trong diff.
- Kiểm tra markup/cú pháp: `node --check js/data/q-claude.js` OK; không có backtick hay `${` chưa escape trong file.
- Fact-check kỹ thuật (đối chiếu docs Anthropic qua web search 2026): `claude-027` đúng — `tool_choice` `any`/`tool` trả 400 trên Opus 5.5/Sonnet 5.5 (kể cả token counting), migrate bằng `auto` + strict tool use hoặc structured outputs (`output_config.format` json_schema); `claude-028` đúng — parallel tool use mặc định, trả đủ tool_result trong **một** user message khớp `tool_use_id`, `disable_parallel_tool_use` nằm trong `tool_choice`, tool có side effect/dependency chạy tuần tự; `claude-029` đúng — MCP connector beta (`mcp-client-2025-11-20`/`mcp-client-2026-09-15`), server HTTP công khai (stdio không kết nối trực tiếp qua connector), connector xử lý tool calls (mcp_tool_use/mcp_tool_result), resources/prompts cần MCP client riêng; `claude-025/026/030` không có API/flag bịa, cơ chế đúng.
- Không phát hiện lỗi kỹ thuật, số liệu vô căn cứ, hay chữ nước ngoài lẫn trong phần mới của `q-claude.js` → không chỉnh sửa nội dung.
- `node scripts/validate.js` (toàn repo): file sở hữu `q-claude.js` không còn lỗi; validator vẫn FAIL do lỗi **ngoài phạm vi sở hữu**: `q-remote.js` (`remote-026.a`/`remote-028.a` có ký tự lạ Trung/Nhật/Nga). `index-light.js` đã được validator/baseline xử lý ở trạng thái khác nhau giữa các lần chạy; không tự sửa file ngoài ownership. Cần integrator/owner `q-remote.js` xử lý để đạt OK toàn cục.
