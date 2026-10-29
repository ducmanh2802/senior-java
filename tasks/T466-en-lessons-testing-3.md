# T466 — Dịch sang tiếng Anh: lessons-testing (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-testing-3.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-testing.js`: **lesson-testing-004**.

Viết vào `js/i18n/lessons-testing-3.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-testing-3.en.js` và `node scripts/check-i18n.js lessons-testing-3` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đầy đủ `lesson-testing-004` (1 bài học, 1 exercise, 3 câu check) sang tiếng Anh trong `js/i18n/lessons-testing-3.en.js`: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain. Không chép starter/tests/reference.
- Giữ nguyên markup (`**`, `{{...}}`, `###`, bảng, `~~~java`), code block chỉ dịch comment; "**Tóm tắt:**" → "**Summary:**", "### Liên hệ phỏng vấn" → "### Interview notes", "> Senior tip:" giữ nguyên. Không có backtick trong nội dung và không có `${`.
- Kiểm tra: `node scripts/check-i18n.js lessons-testing-3` → `OK — 1 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`. Lưu ý: `node --check` bị chặn bởi quy tắc quyền của môi trường (lệnh bị từ chối), nên cú pháp được xác nhận gián tiếp qua `check-i18n.js` (script này `vm.runInNewContext` toàn bộ file, lỗi cú pháp sẽ làm script báo "không chạy được").
- Manifest `js/i18n/manifest.js` đã có sẵn `lessons-testing-3`, không cần sửa (integrator sở hữu).
Reviewed-by: check-i18n (translation, no LLM review)
