# T416 — Dịch sang tiếng Anh: quiz-claude (28 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-claude-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-claude.js`: **qz-claude-122, qz-claude-123, qz-claude-124, qz-claude-125, qz-claude-126, qz-claude-127, qz-claude-128, qz-claude-129, qz-claude-130, qz-claude-131, qz-claude-132, qz-claude-133, qz-claude-134, qz-claude-135, qz-claude-136, qz-claude-137, qz-claude-138, qz-claude-139, qz-claude-140, qz-claude-141, qz-claude-142, qz-claude-143, qz-claude-144, qz-claude-145, qz-claude-146, qz-claude-147, qz-claude-148, qz-claude-149**.

Viết vào `js/i18n/quiz-claude-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-claude-4.en.js` và `node scripts/check-i18n.js quiz-claude-4` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 28 mục `qz-claude-122` … `qz-claude-149` vào `js/i18n/quiz-claude-4.en.js`, mỗi mục chỉ gồm `q`, `options`, `explain` (không chép `answer`, `multi`, `topic`).
- Giữ nguyên markup (`**`, `{{code}}`, `###`, danh sách, `>` tip, bảng, code block `~~~java/json/python`); chỉ dịch comment trong code block.
- `(Chọn 3)` → `(Choose 3)`, `(Chọn 2)` → `(Choose 2)` cho các mục multi; thứ tự và số lượng `options` khớp bản gốc.
- Chuỗi `\\n` trong `qz-claude-126` giữ nguyên escape như bản gốc; không có backtick, không có `${`.
- Kiểm tra: `node scripts/check-i18n.js quiz-claude-4` → `OK — 28 mục đã dịch.` (checker biên dịch + chạy file nên cũng xác nhận cú pháp); `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check` bị permission rule của môi trường chặn nên dùng checker ở trên để xác nhận cú pháp.
Reviewed-by: check-i18n (translation, no LLM review)
