# T459 — Dịch sang tiếng Anh: lessons-sql (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-sql-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-sql.js`: **lesson-sql-003**.

Viết vào `js/i18n/lessons-sql-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-sql-2.en.js` và `node scripts/check-i18n.js lessons-sql-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đầy đủ `lesson-sql-003`: title, 3 goals, toàn bộ body (5 mục `###`, giữ nguyên 1 block `~~~sql`, 1 block `~~~text`, bảng so sánh ROW_NUMBER/RANK/DENSE_RANK, 2 block `>`), exercise (title, prompt, 3 hints, explain 3 mục) và 3 câu check (q, options, explain; `answer` giữ ở bản gốc nên thứ tự option phải khớp — đã khớp).
- Thuật ngữ giữ nguyên (PARTITION BY, ROW_NUMBER, WindowAgg, work_mem, LATERAL…); nhãn cố định theo yêu cầu ("### Lưu ý khi phỏng vấn"/"### Liên hệ phỏng vấn" → "### Interview notes", "> Senior tip:" giữ nguyên).
- Nhãn tiếng Việt trong block `~~~text` ("SUM mặc định (RANGE)", "SUM với ROWS") đã dịch sang tiếng Anh; code SQL trong block giữ nguyên.
- Kiểm tra: `node scripts/check-i18n.js lessons-sql-2` → `OK — 1 mục đã dịch.` (script này `vm.runInNewContext` toàn bộ file nên cũng xác nhận file parse được). `node --check` bị chặn bởi chính sách quyền của môi trường nên không chạy trực tiếp được.
- `node scripts/validate.js` → `OK — không có lỗi.`; `lessons-sql-2` đã có sẵn trong `js/i18n/manifest.js` (dòng 90).
Reviewed-by: check-i18n (translation, no LLM review)
