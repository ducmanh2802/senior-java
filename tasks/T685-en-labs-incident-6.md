# T685 — Dịch sang tiếng Anh: labs-incident (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-incident-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-incident.js`: **lab-incident-014, lab-incident-015**.

Viết vào `js/i18n/labs-incident-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-incident-6.en.js` và `node scripts/check-i18n.js labs-incident-6` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch `lab-incident-014` (OOMKilled do NIO temp direct buffer theo thread) và `lab-incident-015` (502/503 mỗi lần deploy pricing-api) sang `js/i18n/labs-incident-6.en.js`: đủ 6 field title/scenario/questions/hints/answer/rubric, giữ nguyên markup, số liệu, tên riêng, `**Summary:**`, `> Senior tip:`, comment trong code block dịch sang tiếng Anh, không chép artifact/starter/tests/reference.
- `~~~` chỉ xuất hiện ở 2 code block trong answer (java của 014, yaml của 015); các marker `{{...}}` được giữ đúng như bản gốc.
- Không dùng marker `${` trong template literal.
- Kiểm: `node scripts/check-i18n.js labs-incident-6` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ của q-java/q-english/path). `node --check` bị chặn bởi permission nên không chạy được, nhưng checker đã `vm.runInNewContext` file nên cú pháp đã được xác nhận hợp lệ.
- File đã có trong `js/i18n/manifest.js` (chunk `labs-incident-6`), không cần đăng ký thêm.
Reviewed-by: check-i18n (translation, no LLM review)
