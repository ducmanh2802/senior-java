# T737 — Dịch sang tiếng Anh: q-devops (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-15.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-devops.js`: **devops-079**.

Viết vào `js/i18n/q-devops-15.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-devops-15.en.js` và `node scripts/check-i18n.js q-devops-15` → OK, rồi `Status: DONE`.

## Notes
- Translated `devops-079` (lead: phased migration of 40 on-prem apps to AWS, 7R, wave planning, dependency mapping, weekend cutover, go/no-go) into `js/i18n/q-devops-15.en.js` (`q`, `a`, `follow`). Preserved markup/tables/ASCII diagram/code block comments translated to English; kept technical terms, IDs (aws-030, devops-078), numbers, and `> Senior tip:`. No backticks or `${` inside template literals.
- `node --check js/i18n/q-devops-15.en.js` → OK. `node scripts/check-i18n.js q-devops-15` → `OK — 1 mục đã dịch`. `node scripts/validate.js` → `OK — không có lỗi.` (16 pre-existing short-answer warnings unchanged). No git actions.
Reviewed-by: check-i18n (translation, no LLM review)
