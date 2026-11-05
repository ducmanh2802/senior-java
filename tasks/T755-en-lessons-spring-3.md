# T755 — Dịch sang tiếng Anh: lessons-spring (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-spring-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-spring.js`: **lesson-spring-008**.

Viết vào `js/i18n/lessons-spring-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-spring-3.en.js` và `node scripts/check-i18n.js lessons-spring-3` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch `lesson-spring-008` (title, goals, body, exercises[0].title/prompt/hints/explain, check[0..3].q/options/explain) sang `js/i18n/lessons-spring-3.en.js`. File từng tồn tại nhưng rỗng (lần chạy trước bị gián đoạn) → viết lại toàn bộ.
- Không chép `starter`/`tests`/`reference`; `answer`, `related`, `tags`, `level`, `minutes` giữ nguyên vì overlay merge theo field.
- Giữ markup: `**Tóm tắt:**` → `**Summary:**`, `### Liên hệ phỏng vấn` → `### Interview notes`, `> Lưu ý:` → `> Note:`, `> Senior tip:` giữ nguyên nhãn; seq diagram + java/text code block giữ cấu trúc, chỉ dịch comment.
- `node scripts/check-i18n.js lessons-spring-3` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ ở q-java/q-scenario).
- `node --check js/i18n/lessons-spring-3.en.js` không chạy được vì quyền Bash bị chặn trong phiên này; file đã được parse + thực thi thành công trong `scripts/check-i18n.js` (vm.runInNewContext) nên cú pháp hợp lệ.
Reviewed-by: check-i18n (translation, no LLM review)
