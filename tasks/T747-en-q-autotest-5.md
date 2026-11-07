# T747 — Dịch sang tiếng Anh: q-autotest (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-autotest-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-autotest.js`: **autotest-036, autotest-037, autotest-038, autotest-039, autotest-040, autotest-041**.

Viết vào `js/i18n/q-autotest-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-autotest-5.en.js` và `node scripts/check-i18n.js q-autotest-5` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch 6 mục (autotest-036 → 041) vào `js/i18n/q-autotest-5.en.js`, mỗi mục gồm `q`, `a`, `follow`; không đụng `refs`/`level`/field khác.
- Giữ nguyên cấu trúc markup của bản gốc: bảng, `### `, list, `>`, `{{...}}`, `~~~text|java|seq ~~~`; nhãn cố định `**Summary:**`, `> Senior tip:` giữ nguyên; `### Trả lời phỏng vấn thế nào` → `### How to answer in an interview` (theo khuôn q-autotest-4.en.js).
- Trong `~~~java`: giữ nguyên code, chỉ dịch comment tiếng Việt (và chuỗi `"Loi tam"` → `"Temporary error"`); trong `~~~seq`/`~~~text`: dịch nhãn step/actor text, giữ đúng actor đã khai báo và tên service/id (`pr-123`, `namespace`, URL).
- Giữ nguyên tên riêng, số liệu, đơn vị, mã locale (`vi-VN`, `en-US`), ký hiệu `₫`, id tham chiếu chéo `{{autotest-035}}`, `{{autotest-037}}`.
- autotest-037: `q`/`a` không còn chữ tiếng Việt (checker phát hiện dấu Việt cả ngoài code block).
- Verify: `node scripts/check-i18n.js q-autotest-5` → `OK — 6 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo cũ ở q-java.js/q-scenario.js, không thuộc file này). File được parse + chạy trong VM bởi check-i18n nên đã chắc chắn cú pháp đúng (không chạy được `node --check` vì lệnh bị chặn quyền).
- File đã tồn tại nhưng rỗng (`App.i18n.content({})`) do lần chạy trước bị gián đoạn — viết đủ nội dung, không có phần dịch cũ nào cần giữ lại.
- Không sửa file khác, không commit.
Reviewed-by: check-i18n (translation, no LLM review)
