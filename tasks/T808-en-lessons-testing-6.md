# T808 — Dịch sang tiếng Anh: lessons-testing (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-testing-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-testing.js`: **lesson-testing-007**.

Viết vào `js/i18n/lessons-testing-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-testing-6.en.js` và `node scripts/check-i18n.js lessons-testing-6` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch `lesson-testing-007` (mutation testing) sang `js/i18n/lessons-testing-6.en.js`: title, goals, body, exercises[0] (title/prompt/hints/explain), check[] (q/options/explain) — đủ 4 mục check, giữ nguyên markup, code block, số liệu; comment tiếng Việt trong code block đã dịch. Không chép starter/tests/reference.
- `node scripts/check-i18n.js lessons-testing-6` → OK — 1 mục đã dịch (script parse file bằng vm nên cú pháp đã được xác nhận hợp lệ; `node --check` bị chặn bởi permission prompt trong phiên này).
- `node scripts/validate.js`: lỗi duy nhất còn lại nằm ở `q-concurrency-jvm.js` (concurrency-042: `{{`/`}}` không khớp) — file không thuộc quyền sở hữu của T808, có agent khác đang ghi vào lúc chạy. Trước đó validate báo `index-light.js` cũ; đã regenerate bằng `node scripts/build-light-index.js` và xác nhận `--check` → OK. Toàn bộ cảnh báo "đáp án ngắn" là của task nội dung khác.
- Sau khi merge, nên chạy lại `node scripts/build-light-index.js` vì dữ liệu gốc có thể thay đổi bởi các task song song.
Reviewed-by: check-i18n (translation, no LLM review)
