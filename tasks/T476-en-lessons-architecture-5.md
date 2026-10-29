# T476 — Dịch sang tiếng Anh: lessons-architecture (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-architecture-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-architecture.js`: **lesson-architecture-007, lesson-architecture-008**.

Viết vào `js/i18n/lessons-architecture-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-architecture-5.en.js` và `node scripts/check-i18n.js lessons-architecture-5` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đầy đủ 2 mục `lesson-architecture-007`, `lesson-architecture-008` trong `js/i18n/lessons-architecture-5.en.js`: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain. Không chép starter/tests/reference, giữ nguyên markup, bảng, code block và số liệu.
- `node scripts/check-i18n.js lessons-architecture-5` → `OK — 2 mục đã dịch.` (script nạp file bằng vm nên cũng xác nhận file parse được).
- `node scripts/validate.js` → `OK — không có lỗi.`
- Lưu ý môi trường: lệnh `node --check` bị sandbox từ chối quyền chạy, nên kiểm cú pháp thực hiện qua `check-i18n.js` (vm.runInNewContext báo lỗi nếu file không parse được).
- Không sửa file nào khác; manifest đã có sẵn `lessons-architecture-5`.
Reviewed-by: check-i18n (translation, no LLM review)
