# T276 — Dịch sang tiếng Anh: lessons-microservices (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-microservices-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-microservices.js`: **lesson-microservices-001, lesson-microservices-002, lesson-microservices-003, lesson-microservices-004**.

Viết vào `js/i18n/lessons-microservices-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-microservices-1.en.js` và `node scripts/check-i18n.js lessons-microservices-1` → OK, rồi `Status: DONE`.

## Notes

- Bản dịch đã có sẵn trong commit `14026a6` (task còn để TODO); đã đọc lại và đối chiếu từng đoạn với `js/data/lessons-microservices.js`, giữ nguyên cấu trúc 4 bài.
- Sửa 3 chỗ bám sát bản gốc hơn: khôi phục ý "command khác id" (lesson-002), "non-blocking retry" với `@RetryableTopic` (lesson-004), và căn lại sơ đồ ASCII compensation (lesson-003).
- `node --check js/i18n/lessons-microservices-1.en.js` OK; `node scripts/check-i18n.js lessons-microservices-1` → `OK — 4 mục đã dịch.`
- `node scripts/validate.js` hiện báo lỗi cú pháp ở `js/data/lesson-ai-001.js` (file đang được task khác sửa, không thuộc quyền sở hữu của T276): template literal bị đóng sớm trước dòng `### Bài tập minh họa...`. Đã kiểm tra lại sau vài phút nhưng file vẫn lỗi và không thay đổi; không tự sửa file của task khác. Phần dữ liệu của T276 không gây lỗi validate.
Reviewed-by: check-i18n (translation, no LLM review)
