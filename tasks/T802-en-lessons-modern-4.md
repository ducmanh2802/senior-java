# T802 — Dịch sang tiếng Anh: lessons-modern (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-modern-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-modern.js`: **lesson-modern-007**.

Viết vào `js/i18n/lessons-modern-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-modern-4.en.js` và `node scripts/check-i18n.js lessons-modern-4` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch trọn `lesson-modern-007` (title, goals, body, 2 exercises: title/prompt/hints/explain, 4 câu check: q/options/explain) sang `js/i18n/lessons-modern-4.en.js`. Không chép starter/tests/reference; chỉ comment tiếng Việt trong code block của `body` được dịch (kể cả block `~~~seq`).
- Giữ markup: bảng, `~~~java/seq`, `{{code}}`, `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` giữ nguyên, "### Liên hệ phỏng vấn" → "### Interview relevance". Không backtick, không `${`.
- `node scripts/check-i18n.js lessons-modern-4` → `OK — 1 mục đã dịch.` (check này compile + chạy thật file trong vm nên cú pháp đã được xác minh; lệnh `node --check` bị chặn bởi permission nên không chạy trực tiếp được).
- `node scripts/validate.js` vẫn báo LỖI nhưng **không liên quan file này**: `q-spring-data.js` lỗi cú pháp và các topic spring/jpa/db thiếu câu hỏi — do work-in-progress của agent khác trong working tree chung (`git status` cho thấy `js/data/q-spring-data.js`, `q-ai.js`, `q-microservices.js` đang modified). File duy nhất tôi tạo/sửa: `js/i18n/lessons-modern-4.en.js` + file task này. Không chạy `build-light-index.js` (không sở hữu file, và không thêm/sửa dữ liệu câu hỏi).
Reviewed-by: check-i18n (translation, no LLM review)
