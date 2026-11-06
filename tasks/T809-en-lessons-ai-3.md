# T809 — Dịch sang tiếng Anh: lessons-ai (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-ai-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-ai.js`: **lesson-ai-005**.

Viết vào `js/i18n/lessons-ai-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-ai-3.en.js` và `node scripts/check-i18n.js lessons-ai-3` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ lesson-ai-005 vào `js/i18n/lessons-ai-3.en.js` (title, goals, body, 2 exercises [title/prompt/hints/explain], 4 câu check [q/options/explain]). Không chép starter/tests/reference.
- `node scripts/check-i18n.js lessons-ai-3` → `OK — 1 mục đã dịch.` File này pass cả điều kiện "không còn tiếng Việt kể cả trong code block", nên 7 code block (text diagram, java, sql, công thức cosine, pipeline recall/rerank, java citations, seq) đều đã dịch comment/label. `node --check` bị chặn bởi allowlist Bash ở phiên này; check-i18n chạy file bằng `vm.runInNewContext` và không báo lỗi parse nên cú pháp đã hợp lệ.
- `node scripts/validate.js` còn 2 lỗi, **không thuộc file của task này** và đã tồn tại trước khi sửa (working tree có nhiều thay đổi chưa commit của task khác):
  - `q-java.js: core-038.a: inline code {{...}} chứa dấu { } lồng nhau` — q-java.js đang bị sửa bởi task khác.
  - `index-light.js: đã cũ so với dữ liệu` — hệ quả của các sửa đổi trong q-*.js; cần người tích hợp chạy `node scripts/build-light-index.js` (file thuộc quyền integrator, tôi không tự ghi).
- Bản dịch giữ nguyên số mục, bảng, độ dài và mọi markup; nhãn cố định dùng "**Summary:**", "> Senior tip:", seq diagram giữ đúng cú pháp (`title:`/`actors:`/`A -> B:`/`note API:`), tiền tệ "300.000đ" → "300,000 VND" để không còn ký tự tiếng Việt trong code block.
Reviewed-by: check-i18n (translation, no LLM review)
