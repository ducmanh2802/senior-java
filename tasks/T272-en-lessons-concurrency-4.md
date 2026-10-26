# T272 — Dịch sang tiếng Anh: lessons-concurrency (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-concurrency-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-concurrency.js`: **lesson-concurrency-004, lesson-concurrency-005**.

Viết vào `js/i18n/lessons-concurrency-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-concurrency-4.en.js` và `node scripts/check-i18n.js lessons-concurrency-4` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đầy đủ lesson-concurrency-004 (CompletableFuture) và lesson-concurrency-005 (virtual threads) vào `js/i18n/lessons-concurrency-4.en.js`; giữ nguyên markup, code block, chỉ dịch comment tiếng Việt trong code.
- `node --check js/i18n/lessons-concurrency-4.en.js` OK; `node scripts/check-i18n.js lessons-concurrency-4` → OK — 2 mục đã dịch.
- `node scripts/validate.js` hiện còn lỗi ở file của task khác (q-spring-data.js, lessons-devops.js, algo.js, lessons-spring.js, lessons-sql.js, path.js) — không thuộc quyền sở hữu của T272, không sửa.
