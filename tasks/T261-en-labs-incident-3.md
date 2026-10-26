# T261 — Dịch sang tiếng Anh: labs-incident (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-incident-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-incident.js`: **lab-incident-004, lab-incident-005, lab-incident-006, lab-incident-007, lab-incident-008, lab-incident-009**.

Viết vào `js/i18n/labs-incident-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-incident-3.en.js` và `node scripts/check-i18n.js labs-incident-3` → OK, rồi `Status: DONE`.

## Notes
Đã dịch đủ 6 lab (004–009) vào js/i18n/labs-incident-3.en.js: title, scenario, questions, hints, answer, rubric; giữ markup, số liệu, "> Senior tip:", "**Summary:**".
`node --check` OK, `node scripts/check-i18n.js labs-incident-3` OK (6 mục), `node scripts/validate.js` OK — không có lỗi.
Ghi chú: ban đầu có field `level` trong 006–009, check-i18n báo không được phép, đã bỏ (004/005 gốc cũng không cần).
