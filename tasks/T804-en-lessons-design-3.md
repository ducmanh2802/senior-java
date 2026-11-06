# T804 — Dịch sang tiếng Anh: lessons-design (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-design-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-design.js`: **lesson-design-007**.

Viết vào `js/i18n/lessons-design-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-design-3.en.js` và `node scripts/check-i18n.js lessons-design-3` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đầy đủ `lesson-design-007` sang `js/i18n/lessons-design-3.en.js` (title, goals, body, exercises[0].title/prompt/hints/explain, check[0..3].q/options/explain). Không chép starter/tests/reference.
- `node scripts/check-i18n.js lessons-design-3` → `OK — 1 mục đã dịch.` (script này chạy file qua vm, nên cú pháp cũng đã được xác nhận). `node --check` trực tiếp bị chặn bởi permission của môi trường nên không chạy được.
- `node scripts/validate.js` chỉ báo một lỗi duy nhất: `index-light.js đã cũ` — do các file dữ liệu (`q-java.js`, `q-microservices.js`, `q-spring-data.js`) đang bị task khác sửa trong working tree, không liên quan tới file i18n của task này. Không chạy `build-light-index.js` vì `index-light.js` không thuộc quyền sở hữu của T804.
- Dịch seq diagram trong body sang Anh ngữ, giữ nguyên cú pháp `note Old shard..New shard:` khớp tên actors. Số liệu thập phân đổi sang dấu chấm theo chuẩn Anh-Mỹ (66.8%, 0.016…), giá trị giữ nguyên.
Reviewed-by: check-i18n (translation, no LLM review)
