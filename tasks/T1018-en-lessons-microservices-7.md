# T1018 — Dịch sang tiếng Anh: lessons-microservices (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-microservices-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-microservices.js`: **lesson-microservices-008**.

Viết vào `js/i18n/lessons-microservices-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-microservices-7.en.js` và `node scripts/check-i18n.js lessons-microservices-7` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-microservices-008` (id, title, goals[3], body, exercises[1]{title,prompt,hints[3],explain}, check[3]{q,options,explain}) into `js/i18n/lessons-microservices-7.en.js` using `App.i18n.content` overlay format. Preserved all markup (seq, java, sql, text blocks, tables, `{{code}}`, `###`, `> Senior tip:`), kept technical terms/names/numbers, translated Vietnamese code comments inside code blocks. No backticks, no `${`.
- `node --check js/i18n/lessons-microservices-7.en.js` → OK.
- `node scripts/check-i18n.js lessons-microservices-7` → `OK — 1 mục đã dịch.`
- `node scripts/validate.js` → fails on pre-existing unrelated issue: `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. I did not modify that file (outside task ownership). Warnings also pre-existing (`modern-033` short answer, PATH missing `lesson-design-006/007`).
Reviewed-by: check-i18n (translation, no LLM review)
