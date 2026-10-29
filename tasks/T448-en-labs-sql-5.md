# T448 — Dịch sang tiếng Anh: labs-sql (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-sql-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/labs-sql.js`: **lab-sql-009, lab-sql-010**.

Viết vào `js/i18n/labs-sql-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, scenario, questions, hints, answer, rubric**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/labs-sql-5.en.js` và `node scripts/check-i18n.js labs-sql-5` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đầy đủ `lab-sql-009` và `lab-sql-010` vào `js/i18n/labs-sql-5.en.js` (title, scenario, questions, hints, answer, rubric).
- Giữ nguyên markup (`**`, `{{...}}`, `###`, bảng, `~~~text`/`~~~sql`), số liệu và tên riêng; chỉ dịch comment tiếng Việt trong code block; `artifacts` không chép (không phải field dịch).
- Đã kiểm tra: `node scripts/check-i18n.js labs-sql-5` → `OK — 2 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
- `js/i18n/manifest.js` đã có sẵn `labs-sql-5`, không cần sửa file của integrator.
- Lưu ý: lệnh `node --check` bị chặn quyền trong phiên này; file đã được parse thành công qua `vm.runInNewContext` trong `check-i18n.js` nên cú pháp hợp lệ.
Reviewed-by: check-i18n (translation, no LLM review)
