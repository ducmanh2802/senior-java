# T450 — Dịch sang tiếng Anh: labs-incident (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-incident-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-incident.js`: **lab-incident-012, lab-incident-013**.

Viết vào `js/i18n/labs-incident-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-incident-5.en.js` và `node scripts/check-i18n.js labs-incident-5` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 2 mục `lab-incident-012`, `lab-incident-013` vào `js/i18n/labs-incident-5.en.js` với các field title, scenario, questions, hints, answer, rubric; giữ nguyên markup, code block (chỉ dịch comment tiếng Việt), số liệu và thuật ngữ (Hikari, cache-aside, stampede, bulkhead, liveness/readiness…).
- `node scripts/check-i18n.js labs-incident-5` → `OK — 2 mục đã dịch.` (script nạp file bằng `vm`, xác nhận file parse được; lệnh `node --check` bị chặn bởi quyền shell trên máy nên dùng check-i18n làm cổng kiểm cú pháp).
- `node scripts/validate.js` → `OK — không có lỗi.`
- Số khối `###`, `>`, `~~~` khớp bản gốc (24/24 cho 2 mục), bảng probe và sơ đồ ASCII giữ nguyên cấu trúc.
Reviewed-by: check-i18n (translation, no LLM review)
