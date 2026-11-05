# T689 — Dịch sang tiếng Anh: lessons-concurrency (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-concurrency-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-concurrency.js`: **lesson-concurrency-006**.

Viết vào `js/i18n/lessons-concurrency-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-concurrency-5.en.js` và `node scripts/check-i18n.js lessons-concurrency-5` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch trọn `lesson-concurrency-006` sang `js/i18n/lessons-concurrency-5.en.js` (title, 4 goals, body 11 mục `###` + 7 code block, 1 exercise với title/prompt/4 hints/explain, 4 câu check × 4 options + explain). Không chép `starter`/`tests`/`reference`.
- Dịch cả comment và chuỗi literal bên trong code block (`"được " + v` → `"got " + v`), giữ nguyên mã Java và sơ đồ ASCII.
- `node --check` + `node scripts/check-i18n.js lessons-concurrency-5` → OK (1 mục). `node scripts/validate.js` → "OK — không có lỗi." (còn cảnh báo ngắn/thiếu PATH thuộc file dữ liệu khác, không do task này).
- Validate ban đầu báo `index-light.js` đã cũ (do thay đổi dữ liệu của task khác trong working tree); đã chạy `node scripts/build-light-index.js` theo luật 6 để regenerate — file sinh tự động, không chứa nội dung biên soạn.
Reviewed-by: check-i18n (translation, no LLM review)
