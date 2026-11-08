# T1014 — Dịch sang tiếng Anh: lessons-spring (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-spring-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-spring.js`: **lesson-spring-010**.

Viết vào `js/i18n/lessons-spring-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-spring-5.en.js` và `node scripts/check-i18n.js lessons-spring-5` → OK, rồi `Status: DONE`.

## Notes

Đã dịch lesson-spring-010 (@Transactional không chạy khi gọi nội bộ: bản đồ proxy và cách sửa) sang tiếng Anh vào js/i18n/lessons-spring-5.en.js (title, goals, body, exercises[0].title/prompt/hints/explain, 4 check questions q/options/explain; không chép starter/tests/reference). Giữ nguyên markup, "### Liên hệ phỏng vấn" → "### Interview notes", "> Senior tip:" giữ nguyên, code comment trong ~~~java đã dịch. node --check OK; node scripts/check-i18n.js lessons-spring-5 → "OK — 1 mục đã dịch.". node scripts/validate.js lỗi còn lại nằm ở các file không sở hữu (q-banking.js banking-014 ~~~seq, q-java.js modern-033, path.js) và đã tồn tại trước task này, không sửa theo quy tắc chỉ sở hữu file T1014.Reviewed-by: check-i18n (translation, no LLM review)
