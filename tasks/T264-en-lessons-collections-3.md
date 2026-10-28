# T264 — Dịch sang tiếng Anh: lessons-collections (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-collections-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-collections.js`: **lesson-collections-004**.

Viết vào `js/i18n/lessons-collections-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-collections-3.en.js` và `node scripts/check-i18n.js lessons-collections-3` → OK, rồi `Status: DONE`.

## Notes
- File `js/i18n/lessons-collections-3.en.js` trước đó chứa nội dung hỏng của T263 (lesson-collections-003, sai id, sai cú pháp, còn lẫn tiếng Việt) — đã ghi đè hoàn toàn bằng bản dịch đúng của **lesson-collections-004** theo task này.
- Đã dịch đầy đủ: title, goals (3), body, 2 exercises (title/prompt/hints/explain) và 3 check (q/options/explain). Không chép starter/tests/reference/answer/related/tags (overlay merge giữ nguyên các field code và index answer).
- Giữ nguyên markup: `**`, `{{...}}`, `###`, bảng `|`, blockquote `>`, code block `~~~java` (chỉ dịch comment tiếng Việt trong code); không backtick, không `${`.
- Labels đã đổi theo đúng nhãn cố định: "### Liên hệ phỏng vấn" → "### Interview relevance"; "> Senior tip:" không có trong bài này.
- Đã chạy: `node --check js/i18n/lessons-collections-3.en.js` OK; `node scripts/check-i18n.js lessons-collections-3` → `OK — 1 mục đã dịch`.
- `node scripts/validate.js`: dữ liệu OK (640 câu hỏi, 80 bài học…), chỉ còn 1 lỗi **không thuộc file của task này**: `lesson-ai-001.js: file không được khai báo trong index.html` (index.html là của integrator; các file khác cũng đang do agent khác sửa song song). Không sửa theo luật 3.
Reviewed-by: check-i18n (translation, no LLM review)
