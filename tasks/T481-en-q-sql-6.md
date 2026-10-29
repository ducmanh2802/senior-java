# T481 — Dịch sang tiếng Anh: q-sql (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-sql-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-sql.js`: **sql-029, sql-030**.

Viết vào `js/i18n/q-sql-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-sql-6.en.js` và `node scripts/check-i18n.js q-sql-6` → OK, rồi `Status: DONE`.

## Notes
- Đã tạo `js/i18n/q-sql-6.en.js` với bản dịch đầy đủ cho sql-029 (sequence gap / bảng bộ đếm) và sql-030 (bảng giá hiệu lực / exclusion constraint), chỉ gồm field `q`, `a`, `follow`.
- Giữ nguyên toàn bộ markup, bảng, code block (chỉ dịch comment trong SQL) và các nhãn cố định (`**Summary:**`, `> Senior tip:`); không có backtick hay `${` trong nội dung.
- `node scripts/check-i18n.js q-sql-6` → `OK — 2 mục đã dịch.`; file cũng được `vm.runInNewContext` trong checker nạp thành công nên cú pháp hợp lệ (lệnh `node --check` bị chính sách quyền của shell chặn, không chạy được).
- `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý cho người review: sql-029/sql-030 đã từng được dịch ở `q-sql-5.en.js` (T379); file mới `q-sql-6` nạp sau trong `js/i18n/manifest.js` nên sẽ phủ lên bản cũ — đúng như đặc tả task.
Reviewed-by: check-i18n (translation, no LLM review)
