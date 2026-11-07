# T702 — Dịch sang tiếng Anh: lessons-devops (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-008, lesson-devops-009**.

Viết vào `js/i18n/lessons-devops-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-6.en.js` và `node scripts/check-i18n.js lessons-devops-6` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch `lesson-devops-008` và `lesson-devops-009` vào `js/i18n/lessons-devops-6.en.js` (chỉ các field dịch được: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain; không chép starter/tests/reference).
- `node scripts/check-i18n.js lessons-devops-6` → "OK — 2 mục đã dịch." ; `node scripts/validate.js` → "OK — không có lỗi." (các cảnh báo ngắn/dài là có sẵn từ trước, không liên quan file này). `lessons-devops-6` đã có trong manifest từ trước.
- `node --check` bị chặn bởi permission rules trên máy này; file đã được kiểm cú pháp tương đương vì check-i18n chạy nó trong VM (lỗi parse sẽ báo "không chạy được").
- Dọn dẹp giúp integrator: `scripts/t702-gen.js` và `.t702-gen.js` là 2 file tạm của agent (đã rỗng hoá, chỉ còn 1 dòng comment) — có thể xoá, vì lệnh rm bị chính sách chặn nên agent không tự xoá được.
- Body gốc hai lesson có đoạn padding lặp "Thêm nữa để đủ độ dài…" (~41 câu/lesson) để đủ 2500 ký tự; bản dịch giữ cấu trúc tương ứng, không bỏ đoạn nào.
Reviewed-by: check-i18n (translation, no LLM review)
