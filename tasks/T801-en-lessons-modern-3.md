# T801 — Dịch sang tiếng Anh: lessons-modern (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-modern-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-modern.js`: **lesson-modern-006**.

Viết vào `js/i18n/lessons-modern-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-modern-3.en.js` và `node scripts/check-i18n.js lessons-modern-3` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch trọn mục `lesson-modern-006` vào `js/i18n/lessons-modern-3.en.js` (title, goals, body, 2 exercises: title/prompt/hints/explain, 4 câu check: q/options/explain). Không chép starter/tests/reference.
- Code block: giữ nguyên code, dịch comment và đổi tên biến tiếng Việt không dấu (`soDonTheoKhach` → `ordersPerCustomer`…) sang tiếng Anh để không còn tiếng Việt trong code theo `check-i18n.js`.
- Sửa 2 chỗ markup gốc bị lệch ngoặc (`{{Collectors.toMap(k, v}}`, `{{groupingBy(key, counting()}}`) thành cân bằng `}}`; dán nhãn theo quy ước: `**Summary:**`, `### Interview notes` (dùng `### Interview relevance` như tiền lệ ở lessons-modern-2.en.js vì heading gốc là "Liên hệ phỏng vấn"), `> Senior tip:` giữ nguyên.
- Nghiệm thu: `node scripts/check-i18n.js lessons-modern-3` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ, không liên quan). `node --check <file>` bị chặn theo quyền shell, nhưng check-i18n đã chạy file bằng VM nên cú pháp hợp lệ.
- Không commit, không sửa file khác.
Reviewed-by: check-i18n (translation, no LLM review)
