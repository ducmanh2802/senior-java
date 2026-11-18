# T2372 — 1 bài học Claude: viết MCP server nhỏ bằng Java (mô phỏng JSON-RPC)

Status: DONE

## Notes
- Đã thêm bài `lesson-claude-014` (id lớn nhất, order 14) trong `js/data/lessons-claude.js`: "Viết MCP server nhỏ bằng Java: tools/list, tools/call, kiểm quyền và audit log". Bài tập AccountToolServer xử lý request JSON-RPC dạng Map (tools/list, tools/call), từ chối truy cập tài khoản người khác, cắt kết quả quá dài (MAX_RESULT_CHARS=200 + "... [truncated]"), lỗi có ích cho model, audit log (ok/denied/error).
- Sửa prompt của bài học: thay vì `{{ {isError: ...} }}` (lồng `{}` trong `{{ }}`) thì dùng code block ~~~json để tránh validator báo lỗi.
- Sửa dữ liệu mẫu TXNS của user-1: thêm 10 giao dịch (T11–T20) để test truncate thực sự hoạt động (trước đó chuỗi chỉ 113 ký tự < 200 nên test "truncated" luôn fail).
- Kiểm tra: `node --check js/data/lessons-claude.js` OK; `node scripts/test-lessons.js lesson-claude-014` → 10/10 (reference pass, starter không pass); `node scripts/validate.js` → OK.
- Id đã thêm: `lesson-claude-014` (trước 013, là bài cuối file).
Agent: kilo
Owns: `js/data/lessons-claude.js`
After: T2307

Đọc AGENTS.md mục 12 + bài mẫu lesson-collections-001; grep title: trong file để không trùng (đã có bài MCP khái niệm + McpServer). Thêm ĐÚNG 1 bài (id lesson-claude-NNN tiếp số lớn nhất, order tiếp theo): biến một service Java sẵn có (tra số dư, lịch sử giao dịch) thành MCP tool an toàn: thiết kế tool description, JSON schema input, kiểm quyền theo user, giới hạn dữ liệu trả về, lỗi có ích cho model, audit log. Bài tập: AccountToolServer xử lý request JSON-RPC dạng Map (tools/list, tools/call), từ chối truy cập tài khoản người khác, cắt kết quả quá dài; test ≥ 4 case. Chỉ khái niệm MCP công khai (modelcontextprotocol.io), không bịa SDK.

## Luật
AGENTS.md (đọc mục liên quan). Chỉ THÊM trước dòng `);` cuối file, không sửa/xoá mục cũ, id tiếp số LỚN NHẤT, không backtick, không ký hiệu đô-la + ngoặc nhọn. KHÔNG sửa phần đặc tả của file task này. Không commit. Ghi số id trước/sau vào Notes (phải tăng đúng số đã thêm).

## Nghiệm thu
`node --check js/data/lessons-claude.js`, `node scripts/build-light-index.js`, `node scripts/test-lessons.js` (reference pass hết, starter không pass hết), `node scripts/validate.js` → OK. Status: DONE + id mới vào Notes.

## Notes
