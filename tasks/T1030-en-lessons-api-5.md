# T1030 — Dịch sang tiếng Anh: lessons-api (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-api-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-api.js`: **lesson-api-007**.

Viết vào `js/i18n/lessons-api-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-api-5.en.js` và `node scripts/check-i18n.js lessons-api-5` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-api-007` ("Evolving an API without breaking clients…") with full fidelity: title, 4 goals, full body, 1 exercise (title/prompt/3 hints/explain; no starter/tests/reference copied), 4 check items (q/options/explain). Preserved all markup (`**`, `{{}}`, `###`, lists, table, `~~~java`, `~~~seq`), fixed labels ("**Summary:**", "### Interview notes", "> **Senior tip:**"), kept code intact, and escaped template literal content (`\\n`, `\\r\\n` as in source).
- `node --check js/i18n/lessons-api-5.en.js` passed (no output). `node scripts/check-i18n.js lessons-api-5` → "OK — 1 mục đã dịch".
- `node scripts/validate.js` reports a pre-existing `q-banking.js banking-014.a` ~~~seq actor-count error (8 actors) unrelated to owned files; no errors in `js/i18n/lessons-api-5.en.js`.
Reviewed-by: check-i18n (translation, no LLM review)
