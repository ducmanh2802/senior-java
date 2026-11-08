# T1034 — Dịch sang tiếng Anh: lessons-devops (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-12.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-018, lesson-devops-019, lesson-devops-020**.

Viết vào `js/i18n/lessons-devops-12.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-12.en.js` và `node scripts/check-i18n.js lessons-devops-12` → OK, rồi `Status: DONE`.

## Notes
- Translated 3 lessons in `js/i18n/lessons-devops-12.en.js` (overlays for `lesson-devops-018`, `lesson-devops-019`, `lesson-devops-020`).
- Covered all required translatable fields: `title`, `goals`, `body`, `exercises[].title/prompt/hints/explain`, `check[].q/options/explain`. Code (starter/tests/reference) not copied, as specified. Markup preserved (`**`, `{{code}}`, `###`, lists, blockquotes, tables, `~~~` blocks); terminology kept; "> Senior tip:" kept; "### Liên hệ phỏng vấn" → "### Interview notes".
- Checks: `node --check js/i18n/lessons-devops-12.en.js` OK; `node scripts/check-i18n.js lessons-devops-12` → "OK — 3 mục đã dịch".
- `node scripts/validate.js` still reports a pre-existing ERROR in an unowned file (`q-banking.js: banking-014.a: ~~~seq needs 2–6 actors, has 8`) plus unrelated warnings. I did not modify `q-banking.js` (not owned by this task) per AGENTS.md rule 3. My owned file passes syntax/i18n checks.
Reviewed-by: check-i18n (translation, no LLM review)
