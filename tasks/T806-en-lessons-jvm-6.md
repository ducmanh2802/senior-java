# T806 — Dịch sang tiếng Anh: lessons-jvm (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-jvm-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-jvm.js`: **lesson-jvm-007**.

Viết vào `js/i18n/lessons-jvm-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-jvm-6.en.js` và `node scripts/check-i18n.js lessons-jvm-6` → OK, rồi `Status: DONE`.

## Notes
- Dịch xong `lesson-jvm-007` (thread dump) vào `js/i18n/lessons-jvm-6.en.js`: title, goals, body (đủ 6 mục `###`, 2 bảng, 3 code block `bash`/`text`, 1 `seq`, 1 `java`, 1 `text` deadlock report, `> Senior tip:` giữ nguyên nhãn), 1 exercise (title/prompt/hints/explain) và 4 câu `check` (q/options/explain — không chép `answer`, không chép starter/tests/reference).
- Nhãn dịch theo khuôn các task trước: "**Tóm tắt:**" → "**Summary:**" (không xuất hiện trong bài này), "### Liên hệ phỏng vấn" → "### Interview connection"; comment trong code block `bash`/`java` và text trong block `seq` đã dịch hết tiếng Việt.
- `node scripts/check-i18n.js lessons-jvm-6` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn các cảnh báo cũ không thuộc task).
- `node --check js/i18n/lessons-jvm-6.en.js` bị chặn theo danh lệnh được phép của phiên này; file đã được parse & thực thi thật trong `vm` bởi check-i18n.js nên cú pháp đã được xác nhận hợp lệ.

Reviewed-by: check-i18n (translation, no LLM review)
