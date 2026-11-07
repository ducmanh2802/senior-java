# T679 — Dịch sang tiếng Anh: quiz (20 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-16.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz.js`: **qz-english-009, qz-english-010, qz-english-011, qz-english-012, qz-english-013, qz-english-014, qz-english-015, qz-english-016, qz-english-017, qz-english-018, qz-english-019, qz-english-020, qz-english-021, qz-english-022, qz-behavioral-009, qz-behavioral-010, qz-behavioral-011, qz-behavioral-012, qz-behavioral-013, qz-behavioral-014**.

Viết vào `js/i18n/quiz-16.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-16.en.js` và `node scripts/check-i18n.js quiz-16` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 20/20 mục (`qz-english-009…022`, `qz-behavioral-009…014`) vào `js/i18n/quiz-16.en.js`, mỗi mục chỉ có `q`, `options`, `explain`; giữ nguyên số lượng phương án và thứ tự, giữ nguyên markup (`**`, `{{code}}`, `###`, `- `, `>`, `> Senior tip:`), không backtick, không `${`.
- `node scripts/check-i18n.js quiz-16` → `OK — 20 mục đã dịch.` (file được chạy thật trong vm của checker nên cú pháp JS đã được xác minh; không mở trình duyệt, không chạy `node --check` vì Bash từ chối lệnh đó).
- `quiz-16` đã có sẵn trong `js/i18n/manifest.js` (dòng 265), không cần sửa.
- `node scripts/validate.js` **đang đỏ vì lỗi của task khác trong working tree dùng chung**, không liên quan file này:
  - `js/data/q-autotest.js` (autotest-036.a) và `js/data/lessons-autotest.js` (lesson-autotest-014/015): inline code `{{…}}` chứa `{ }` lồng nhau.
  - `js/data/index-light.js` báo cũ (do dữ liệu của các task khác vừa thêm/sửa) — nên để task sở hữu dữ liệu đó chạy `node scripts/build-light-index.js`, tôi không tự chạy để tránh ghi đè sản phẩm của agent khác.
  - Cảnh báo `path.js: 29 bài học không nằm trong PATH` là có từ trước.
- Nhãn dịch thống nhất với quiz-15: `**Đáp án đúng:**` → `**Correct answer:**`, `### Vì sao đúng` → `### Why this is correct`, `### Vì sao các phương án còn lại sai` → `### Why the other options are wrong`, `câu số N` → `option N`.
Reviewed-by: check-i18n (translation, no LLM review)
