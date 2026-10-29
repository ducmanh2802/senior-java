# T480 — Dịch sang tiếng Anh: q-java (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-10.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-java.js`: **modern-018, modern-019, modern-020, modern-021, modern-022, modern-023, modern-024**.

Viết vào `js/i18n/q-java-10.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-java-10.en.js` và `node scripts/check-i18n.js q-java-10` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch đủ 7 mục (modern-018 … modern-024) trong `js/i18n/q-java-10.en.js`, đúng field `q, a, follow`, giữ nguyên markup, code block chỉ dịch comment.
- `node scripts/check-i18n.js q-java-10` → OK (7 mục); `node scripts/validate.js` → OK. Môi trường shell chặn `node --check`, nhưng `check-i18n.js` nạp/compile file bằng `vm` nên cú pháp đã được kiểm chứng; file cũng đã có trong `js/i18n/manifest.js`.
- Trùng nội dung: `js/i18n/q-java-9.en.js` (task T372, Status DONE) đã dịch cùng 7 id này. Hai overlay trùng key là vô hại (cùng giá trị) nhưng dư thừa; integrator có thể cân nhắc bỏ một bản. Bản trong T480 sửa thêm vài câu bị thiếu so với bản gốc (bước DST ở modern-020, "vì sao cần nhớ" ở modern-021) và sửa lỗi "9,99x" thành "9.99x" ở modern-023.
- Lưu ý môi trường: các lệnh chứa `;` hoặc `node --check` bị shell guard của phiên chặn, không phải lỗi file.
Reviewed-by: check-i18n (translation, no LLM review)
