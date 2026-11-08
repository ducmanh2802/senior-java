# T1024 — Dịch sang tiếng Anh: lessons-jvm (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-jvm-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-jvm.js`: **lesson-jvm-008**.

Viết vào `js/i18n/lessons-jvm-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-jvm-7.en.js` và `node scripts/check-i18n.js lessons-jvm-7` → OK, rồi `Status: DONE`.

## Notes

Dịch đầy đủ `lesson-jvm-008` (GC thế hệ thu nhỏ: Eden, Survivor, tuổi object, premature promotion) sang tiếng Anh vào `js/i18n/lessons-jvm-7.en.js` qua `App.i18n.content({ 'lesson-jvm-008': { title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain } })`. Giữ nguyên markup (`**`, `{{code}}`, `###`, `- `, `>`, bảng, `~~~text`), thuật ngữ cố định (`**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên, `### Liên hệ phỏng vấn` → `### Interview connection`), không dịch starter/tests/reference. Không có backtick, `${`, hay tiếng Việt trong file (bao gồm cả code block).

Xác thực: `node --check js/i18n/lessons-jvm-7.en.js` OK; `node scripts/check-i18n.js lessons-jvm-7` → "OK — 1 mục đã dịch."; `node scripts/validate.js` → có LỖI cũ tại `q-banking.js: banking-014.a` (sơ đồ ~~~seq 8 actors) thuộc file của tác giả khác, không liên quan đến task này và không được sửa theo luật sở hữu file.
Reviewed-by: check-i18n (translation, no LLM review)
