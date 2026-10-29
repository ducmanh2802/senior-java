# T439 — Dịch sang tiếng Anh: algo (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-18.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/algo.js`: **algo-131, algo-132, algo-133, algo-134, algo-135, algo-136, algo-137**.

Viết vào `js/i18n/algo-18.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **prompt, hints, solution, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/algo-18.en.js` và `node scripts/check-i18n.js algo-18` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 7 mục algo-131 → algo-137, chỉ gồm field prompt, hints, solution, follow; markup, bảng, code block và số liệu giữ nguyên, comment tiếng Việt trong code đã dịch.
- Kiểm tra: `node scripts/check-i18n.js algo-18` → `OK — 7 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- `node --check` bị chặn bởi quyền shell của môi trường; file đã được check-i18n nạp và thực thi qua vm nên cú pháp hợp lệ.
- Lưu ý ngoài phạm vi task: `js/i18n/algo-17.en.js` (T438) hiện vẫn là file rỗng, manifest đã khai báo `algo-17`.
Reviewed-by: check-i18n (translation, no LLM review)
