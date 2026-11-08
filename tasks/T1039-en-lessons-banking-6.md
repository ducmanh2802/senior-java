# T1039 — Dịch sang tiếng Anh: lessons-banking (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-banking-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-banking.js`: **lesson-banking-009**.

Viết vào `js/i18n/lessons-banking-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-banking-6.en.js` và `node scripts/check-i18n.js lessons-banking-6` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đầy đủ `lesson-banking-009` (title, 4 goals, body, 1 exercise: title/prompt/4 hints/explain, 4 check items: q/options/explain). Giữ nguyên toàn bộ markup, bảng, `~~~seq`/`~~~java` code blocks (chỉ dịch comment), `{{code}}`, "> Senior tip:", "### Interview notes". Không có backtick/`${` trong template literals; escape giữ nguyên như bản gốc.
- Kiểm tra: `node --check js/i18n/lessons-banking-6.en.js` (OK), `node scripts/check-i18n.js lessons-banking-6` → "OK — 1 mục đã dịch."
- `node scripts/validate.js` cho repo còn lỗi ngoài phạm vi sở hữu (không thuộc file task): `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. Không sửa vì vi phạm luật 3 (chỉ sửa file sở hữu). Cần integrator xử lý `q-banking.js` để validate toàn repo OK.
Reviewed-by: check-i18n (translation, no LLM review)
