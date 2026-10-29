# T479 — Dịch sang tiếng Anh: lessons-claude (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-claude-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-claude.js`: **lesson-claude-002, lesson-claude-003**.

Viết vào `js/i18n/lessons-claude-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-claude-2.en.js` và `node scripts/check-i18n.js lessons-claude-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 2 mục `lesson-claude-002`, `lesson-claude-003` vào `js/i18n/lessons-claude-2.en.js` (chỉ field dịch: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain; không chép starter/tests/reference). Giữ nguyên markup (bảng, `~~~json/text/java`, blockquote, danh sách lồng), giữ `> Senior tip:`/thuật ngữ, đổi `### Liên hệ phỏng vấn` → `### Interview notes`, dịch comment tiếng Việt trong code block, số liệu giữ nguyên giá trị (20.000 → 20,000).
- Kiểm tra: `node scripts/check-i18n.js lessons-claude-2` → `OK — 2 mục đã dịch.` (script chạy file trong `vm` nên cũng xác nhận file parse/execute được, không lỗi cú pháp); `node scripts/validate.js` → `OK — không có lỗi.`
- Ghi chú môi trường: lệnh `node --check` bị cổng phân quyền của phiên chặn (yêu cầu approve từng lệnh), nên dùng kết quả `check-i18n` làm bằng chứng cú pháp; đã soát thêm bằng grep: không có backtick trong nội dung dịch, không có `${`, không có `\`, không còn ký tự tiếng Việt ngoài code block.
Reviewed-by: check-i18n (translation, no LLM review)
