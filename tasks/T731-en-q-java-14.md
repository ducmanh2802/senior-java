# T731 — Dịch sang tiếng Anh: q-java (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-14.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-java.js`: **modern-031, modern-032, modern-033, modern-034, modern-035, core-035, modern-037, modern-038**.

Viết vào `js/i18n/q-java-14.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-java-14.en.js` và `node scripts/check-i18n.js q-java-14` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 8/8 mục (`modern-031, modern-032, modern-033, modern-034, modern-035, core-035, modern-037, modern-038`) vào `js/i18n/q-java-14.en.js`, mỗi mục chỉ có field `q`, `a`, `follow`.
- `node scripts/check-i18n.js q-java-14` → `OK — 8 mục đã dịch.` (exit 0). Script này chạy file qua `vm.runInNewContext`, nên cú pháp đã được xác nhận hợp lệ; `node --check js/i18n/q-java-14.en.js` không tự chạy được trong phiên này vì permission của Bash chặn cờ `--check`/`-e` (chỉ cho phép `node scripts/...`), vì vậy dùng kết quả của check-i18n thay thế.
- `node scripts/validate.js` → `OK — không có lỗi.` Không sửa file nào khác (`js/data/q-java.js` giữ nguyên).
- Giữ nguyên markup (`**`, `{{code}}`, `###`, `- `, `>`, `> Senior tip:`), các escape của bản gốc (`\\"`, `\\s`, `\\\\`) và nhãn `**Tóm tắt:**` → `**Summary:**`. Không backtick, không `${`.
- Cảnh báo "đáp án ngắn (< 1500 ký tự)" mà validate in ra đến từ nội dung tiếng Việt gốc trong `js/data/q-java.js`, không phải từ file dịch này — file dịch giữ đúng độ dài/độ chi tiết của bản gốc theo yêu cầu task. Nếu muốn xoá cảnh báo thì cần một task nội dung viết dài `a` gốc (file đó thuộc task khác).
Reviewed-by: check-i18n (translation, no LLM review)
