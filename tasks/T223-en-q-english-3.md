# T223 — Dịch sang tiếng Anh: q-english (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-3.en.js`

Đã dịch xong 13 mục (english-027 → english-039) vào `js/i18n/q-english-3.en.js`. Giữ nguyên markup, thuật ngữ kỹ thuật, dịch đúng `**Summary:**`/`> Senior tip:`/`### Interview notes` và các nhãn cố định. `node scripts/check-i18n.js q-english-3` → OK; `node --check` → OK. Không sửa file khác, không git commit.

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-english.js`: **english-027, english-028, english-029, english-030, english-031, english-032, english-033, english-034, english-035, english-036, english-037, english-038, english-039**.

Viết vào `js/i18n/q-english-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-english-3.en.js` và `node scripts/check-i18n.js q-english-3` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
