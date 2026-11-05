# T654 — Dịch sang tiếng Anh: q-concurrency-jvm (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-concurrency-jvm.js`: **jvm-028, jvm-029, jvm-030, jvm-031, jvm-032, concurrency-030, concurrency-031**.

Viết vào `js/i18n/q-concurrency-jvm-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-concurrency-jvm-8.en.js` và `node scripts/check-i18n.js q-concurrency-jvm-8` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đủ 7/7 mục (jvm-028, jvm-029, jvm-030, jvm-031, jvm-032, concurrency-030, concurrency-031), mỗi mục gồm `q`, `a`, `follow`; giữ nguyên 12 code block (`~~~` count = 24 fence lines, khớp bản gốc), dịch comment trong code block, giữ nguyên markup (`**`, `{{code}}`, `###`, bảng, `>`, `> Senior tip:`), nhãn `**Tóm tắt:**` → `**Summary:**`.
- `node scripts/check-i18n.js q-concurrency-jvm-8` → `OK — 7 mục đã dịch.` File này đã được vm chạy thành công trong check-i18n nên cú pháp hợp lệ; `node --check <file>` bị chặn bởi quyền thực thi Bash nên không chạy được trực tiếp (đề xuất: cho phép pattern `node --check` nếu muốn đúng lệnh trong task).
- `node scripts/validate.js` **đỏ vì lý do không liên quan tới task này**: `index-light.js: đã cũ so với dữ liệu`. Nguyên nhân là các sửa đổi đang chạy của agent khác trong working tree (`js/data/q-microservices.js`, `js/data/companies.js`, `js/data/lessons-autotest.js`, `js/data/q-autotest.js` mới…). Task chỉ sở hữu `js/i18n/q-concurrency-jvm-8.en.js` nên theo luật 3 tôi **không** chạy `node scripts/build-light-index.js` (file thuộc integrator, sinh lại sẽ đóng băng trạng thái dở của người khác). Người tích hợp chạy build-light-index sau khi gộp các task dữ liệu là hết lỗi.
- `js/i18n/manifest.js` đã có sẵn `'q-concurrency-jvm-8'` nên không cần đăng ký thêm.
Reviewed-by: check-i18n (translation, no LLM review)
