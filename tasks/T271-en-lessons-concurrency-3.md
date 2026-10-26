# T271 — Dịch sang tiếng Anh: lessons-concurrency (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-concurrency-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-concurrency.js`: **lesson-concurrency-003**.

Viết vào `js/i18n/lessons-concurrency-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-concurrency-3.en.js` và `node scripts/check-i18n.js lessons-concurrency-3` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đầy đủ lesson-concurrency-003 (title, goals, body, 2 exercises với title/prompt/hints/explain, 3 câu check với q/options/explain) vào `js/i18n/lessons-concurrency-3.en.js`. Không chép starter/tests/reference.
- Giữ nguyên markup (`{{code}}`, `###`, bảng, `~~~java`), comment tiếng Việt trong code block body đã dịch sang tiếng Anh. "### Liên hệ phỏng vấn" → "### Interview relevance" (khớp quy ước các file i18n lesson đã có).
- `node --check` OK; `node scripts/check-i18n.js lessons-concurrency-3` → OK (1 mục đã dịch).
- LƯU Ý cho integrator: `node scripts/validate.js` hiện FAIL vì lỗi cú pháp có sẵn trong `js/data/lessons-devops.js` dòng 514 (placeholder `... exercises ...` chưa được thay bằng dữ liệu thật — thuộc task khác, không phải file của task này). Lỗi này tồn tại trước khi task T271 chạy và không liên quan tới bản dịch.
