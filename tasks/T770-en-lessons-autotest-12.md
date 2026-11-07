# T770 — Dịch sang tiếng Anh: lessons-autotest (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-12.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-autotest.js`: **lesson-autotest-014**.

Viết vào `js/i18n/lessons-autotest-12.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-autotest-12.en.js` và `node scripts/check-i18n.js lessons-autotest-12` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-autotest-014` ("Visual regression: screenshot comparison with a baseline, pixel diff, thresholds, mask regions, and sources of flakiness") into `js/i18n/lessons-autotest-12.en.js` via `App.i18n.content` overlay (id header `lesson-autotest-014`).
- Covered all translatable fields: `title`, `goals` (5), `body` (full, same structure/detail; kept `**Summary:**`, `> Senior tip:`, `### Interview notes`, all `~~~` fences/`{{code}}`/tables/seq diagram; only code comments translated inside fences), `exercises[0].{title,prompt,hints,explain}` (starter/tests/reference not copied), `check[4].{q,options,explain}`. No backticks, no `${`, no Vietnamese left in prose or code comments.
- Verification: `node --check js/i18n/lessons-autotest-12.en.js` OK; `node scripts/check-i18n.js lessons-autotest-12` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (16 pre-existing short-answer warnings only). No other files modified; no git commit; no browser/server/named-process kills.
Reviewed-by: check-i18n (translation, no LLM review)
