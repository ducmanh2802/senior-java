# T811 — Dịch sang tiếng Anh: lessons-aws (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-aws-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-aws.js`: **lesson-aws-005**.

Viết vào `js/i18n/lessons-aws-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-aws-4.en.js` và `node scripts/check-i18n.js lessons-aws-4` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-aws-005` ("VPC for Java developers: CIDR, subnet, route table, security group vs NACL, and VPC endpoints") into `js/i18n/lessons-aws-4.en.js` under `App.i18n.content(...)`. Covered title, goals, body, exercises (title/prompt/hints/explain only; starter/tests/reference left in source), and all 4 check items. Preserved markup (`**`, `{{code}}`, `###`, lists, `>`, table, `~~~text`/`~~~seq`/`~~~java` blocks), kept "### Interview notes" / "> Senior tip:" labels, and translated Vietnamese code comments. No backticks or `${` inside template literals.
- Verified: `node --check js/i18n/lessons-aws-4.en.js` OK; `node scripts/check-i18n.js lessons-aws-4` → "OK — 1 mục đã dịch."; `node scripts/validate.js` → OK (no errors; warnings are pre-existing). No git actions taken.
Reviewed-by: check-i18n (translation, no LLM review)
