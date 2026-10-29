# T472 — Dịch sang tiếng Anh: lessons-architecture (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-architecture-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-architecture.js`: **lesson-architecture-001, lesson-architecture-002, lesson-architecture-003**.

Viết vào `js/i18n/lessons-architecture-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-architecture-1.en.js` và `node scripts/check-i18n.js lessons-architecture-1` → OK, rồi `Status: DONE`.

## Notes

- Dịch đủ 3 mục `lesson-architecture-001..003`: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain. Không chép starter/tests/reference, không dịch code block (chỉ dịch nhãn chú thích trong sơ đồ `~~~text`, giữ nguyên tên class).
- Nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Liên hệ phỏng vấn" → "### Interview relevance", giữ toàn bộ markup (`**`, `{{}}`, `###`, bảng, `~~~text`).
- Kiểm tra: `node scripts/check-i18n.js lessons-architecture-1` → OK (3 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
