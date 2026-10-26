# T269 — Dịch sang tiếng Anh: lessons-concurrency (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-concurrency-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-concurrency.js`: **lesson-concurrency-001**.

Viết vào `js/i18n/lessons-concurrency-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-concurrency-1.en.js` và `node scripts/check-i18n.js lessons-concurrency-1` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ `lesson-concurrency-001` (title, goals, body, 2 exercises [title/prompt/hints/explain], 3 câu check [q/options/explain]) vào `js/i18n/lessons-concurrency-1.en.js`. Không chép `starter`/`tests`/`reference`; giữ nguyên markup, code block (chỉ dịch comment tiếng Việt), số liệu, tên thuật ngữ; nhãn `**Tóm tắt:**` → `**Summary:**`, `### Liên hệ phỏng vấn` → `### Interview relevance`.
- Kiểm tra: `node --check js/i18n/lessons-concurrency-1.en.js` OK; `node scripts/check-i18n.js lessons-concurrency-1` → `OK — 1 mục đã dịch.`; `node scripts/check-i18n.js` (toàn repo) → `OK — 905 mục đã dịch.`
- `node scripts/validate.js` chưa về OK vì lỗi ở file của task khác đang được agent khác sửa song song: `js/data/lessons-devops.js` (lỗi cú pháp `...`), `js/data/algo.js` (`algo-098` inline code lồng `{ }`), `js/data/path.js` (path-09 trỏ lesson devops chưa có). `validate.js` **không** kiểm tra thư mục `js/i18n` (không có chuỗi "i18n" trong script) nên không có lỗi nào đến từ file của T269 — không tự sửa file không thuộc quyền sở hữu (luật 3).
