# T432 — Dịch sang tiếng Anh: algo (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/algo.js`: **algo-001, algo-002, algo-003, algo-004, algo-005, algo-006, algo-007**.

Viết vào `js/i18n/algo-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **prompt, hints, solution, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/algo-11.en.js` và `node scripts/check-i18n.js algo-11` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 7 mục algo-001…algo-007 với các field prompt / hints / solution / follow; giữ nguyên markup
  (`**`, `{{code}}`, `###`, danh sách, `>` tip, bảng, `~~~text`/`~~~java`) và dịch cả comment tiếng Việt trong code block.
  Tiêu đề mục dùng "### Example", "### Constraints", "### Approach", "### Interview notes"; "> Senior tip:" giữ nguyên.
- `node scripts/check-i18n.js algo-11` → OK (7 mục). `node scripts/validate.js` → OK. Không còn ký tự tiếng Việt trong file
  (đã grep cả nội dung code block).
- Lưu ý (không sửa, chỉ báo): `js/i18n/algo-1.en.js` (task khác) cũng đang phủ algo-001…007 bằng bản dịch rút gọn trước đó.
  `manifest.js` nạp `algo-1` trước `algo-11` nên bản đầy đủ này ghi đè (Object.assign), kết quả hiển thị là bản mới; nếu muốn
  dọn trùng thì integrator xoá các key trùng trong `algo-1.en.js`.
Reviewed-by: check-i18n (translation, no LLM review)
