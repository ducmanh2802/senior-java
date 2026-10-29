# T434 — Dịch sang tiếng Anh: algo (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/algo.js`: **algo-085, algo-086, algo-087, algo-088, algo-089, algo-090, algo-091, algo-092**.

Viết vào `js/i18n/algo-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **prompt, hints, solution, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/algo-13.en.js` và `node scripts/check-i18n.js algo-13` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 8 mục algo-085 … algo-092 (prompt, hints, solution, follow); không chép starter/tests.
- Giữ nguyên markup (`**`, `{{code}}`, `###`, `~~~java`/`~~~text`, bảng, `PriorityQueue{{<Integer>}}`); chỉ dịch comment tiếng Việt trong code block và các dòng "Giải thích:" → "Explanation:".
- Nhãn chuẩn: "### Lưu ý khi phỏng vấn" → "### Interview notes", "> Senior tip:" giữ nguyên.
- Câu trong `~~~text` (Input/Output/Explanation) đã dịch; tên hàm/biến và số liệu giữ nguyên.
- `node scripts/validate.js` → OK. `node scripts/check-i18n.js algo-13` → OK — 8 mục đã dịch.
- Lưu ý: lệnh `node --check` bị chặn bởi chính sách quyền của shell trong phiên này; cú pháp đã được kiểm chứng gián tiếp vì `check-i18n.js` nạp file qua `vm.runInNewContext` và chạy không lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
