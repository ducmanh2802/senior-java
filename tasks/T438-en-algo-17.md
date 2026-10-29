# T438 — Dịch sang tiếng Anh: algo (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-17.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/algo.js`: **algo-118, algo-119, algo-120, algo-121, algo-122, algo-123, algo-124, algo-125, algo-126, algo-127, algo-128, algo-129, algo-130**.

Viết vào `js/i18n/algo-17.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **prompt, hints, solution, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/algo-17.en.js` và `node scripts/check-i18n.js algo-17` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 13 mục algo-118 … algo-130 (prompt, hints, solution, follow) trong `js/i18n/algo-17.en.js`.
- Giữ nguyên toàn bộ markup (`**`, `{{code}}`, `###`, bảng, `~~~lang` … `~~~`); code Java và số liệu không đổi, chỉ dịch comment trong code block sang tiếng Anh.
- Nhãn cố định: "### Lưu ý khi phỏng vấn" → "### Interview notes"; "> Senior tip:" giữ nguyên. Các heading khác dịch theo quy ước của algo-10/algo-15/algo-16 (### Example(s), ### Constraints, ### Approach, ### Complexity, ### Dry run …).
- Không có backtick lạ và không có `${`; chỉ dùng template literal đúng như bản gốc (số âm `two\'s complement` đã escape).
- Kiểm tra: `node scripts/check-i18n.js algo-17` → OK — 13 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi. (`node --check` bị chặn bởi allowlist shell của phiên làm việc; check-i18n.js nạp file qua `vm.runInNewContext` nên cũng xác nhận được cú pháp.)
- Căn lại vài sơ đồ ASCII (algo-120, algo-124, algo-125, algo-126, algo-129) sau khi dịch nhãn để cột không lệch.
Reviewed-by: check-i18n (translation, no LLM review)
