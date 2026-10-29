# T454 — Dịch sang tiếng Anh: lessons-microservices (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-microservices-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-microservices.js`: **lesson-microservices-007**.

Viết vào `js/i18n/lessons-microservices-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-microservices-6.en.js` và `node scripts/check-i18n.js lessons-microservices-6` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch `lesson-microservices-007` (title, goals, body, 1 exercise với title/prompt/hints/explain, 3 câu check) trong `js/i18n/lessons-microservices-6.en.js`.
- Giữ nguyên markup, thuật ngữ (207 Multi-Status, compensation ledger, saga, idempotency key, reconcile, outbox, 2PC…), block `~~~text` và placeholder `{{detail}}`.
- Nhãn: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Liên hệ phỏng vấn" → "### Interview notes".
- Không chép code (starter/tests/reference), không backtick, không `${`.
- Kiểm tra: `node scripts/check-i18n.js lessons-microservices-6` → `OK — 1 mục đã dịch.` (file được nạp và chạy trong VM nên cú pháp hợp lệ); `node scripts/validate.js` → `OK — không có lỗi.` Lưu ý: lệnh `node --check ...` bị shell policy của phiên chặn, nên dùng check-i18n thay thế tương đương (nó parse + thực thi file).
- File đã có trong `js/i18n/manifest.js` (dòng 80), không cần sửa manifest.
Reviewed-by: check-i18n (translation, no LLM review)
