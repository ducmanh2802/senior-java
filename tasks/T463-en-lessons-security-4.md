# T463 — Dịch sang tiếng Anh: lessons-security (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-security.js`: **lesson-security-004, lesson-security-005**.

Viết vào `js/i18n/lessons-security-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-security-4.en.js` và `node scripts/check-i18n.js lessons-security-4` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 2 bài: `lesson-security-004` (server-side session: sid cookie, CSRF, session fixation, phiên anonymous) và `lesson-security-005` (RBAC role × domain × action, deny-by-default, tách GRANT, IDOR/BOLA). Mỗi mục gồm đúng các field được dịch: title, goals, body, exercises[].{title,prompt,hints,explain}, check[].{q,options,explain}; không chép starter/tests/reference.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, bảng, `~~~java`), nhãn "**Summary:**", "> Senior tip:", "### Interview relevance" (đồng bộ các bài lessons-security trước). Trong code block chỉ dịch comment; chuỗi `" tren "` trong assert giữ nguyên vì là code.
- Kiểm tra: `node scripts/check-i18n.js lessons-security-4` → `OK — 2 mục đã dịch.` (script này biên dịch file bằng vm nên cũng xác nhận cú pháp); `node scripts/validate.js` → `OK — không có lỗi.`
- Ghi chú môi trường: shell phiên này chỉ cho chạy các lệnh `node scripts/*.js`; `node --check js/i18n/lessons-security-4.en.js` bị sandbox chặn nên không chạy trực tiếp được — cú pháp đã được xác nhận qua `check-i18n.js` (vm.runInNewContext).
