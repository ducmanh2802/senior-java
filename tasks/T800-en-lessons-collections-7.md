# T800 — Dịch sang tiếng Anh: lessons-collections (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-collections-7.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-collections.js`: **lesson-collections-007**.

Viết vào `js/i18n/lessons-collections-7.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-collections-7.en.js` và `node scripts/check-i18n.js lessons-collections-7` → OK, rồi `Status: DONE`.

## Notes
Dịch đủ `lesson-collections-007`: title, 4 goals, body (8 mục, giữ nguyên bảng, `~~~java`, `~~~text`, `~~~seq`, 2 code block), 2 exercises (title/prompt/3 hints/explain cho mỗi bài) và 3 câu check (q/options/explain). Không chép `starter`/`tests`/`reference`. Comment trong code block đã dịch sang tiếng Anh; tên class, constant, số liệu và id giữ nguyên.
Gate: `node scripts/check-i18n.js lessons-collections-7` → OK — 1 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi (chỉ còn các cảnh báo cũ của file khác).
Reviewed-by: check-i18n (translation, no LLM review)
