# T805 — Dịch sang tiếng Anh: lessons-jvm (1 mục)

Status: DONE
Agent: qoder
Owns: `js/i18n/lessons-jvm-5.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-jvm.js`: **lesson-jvm-006**.

Viết vào `js/i18n/lessons-jvm-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-jvm-5.en.js` và `node scripts/check-i18n.js lessons-jvm-5` → OK, rồi `Status: DONE`.

## Notes
- Đã dịch trọn `lesson-jvm-006` vào `js/i18n/lessons-jvm-5.en.js`: title, goals, body (7 mục + bash/text/java block, bảng, ASCII chart), `exercises[0]` (title, prompt, 4 hints, explain) và 3 mục `check` (q, options, explain). Không chép `starter/tests/reference`, không đổi `answer` (deep-merge giữ bản gốc).
- Nhãn cố định: `> Senior tip:` giữ nguyên, `### Liên hệ phỏng vấn` → `### Interview relevance` (theo khuôn các file lessons-*.en.js đã có); comment trong code block và nhãn trong ASCII chart đều đã dịch nên `check-i18n` không báo Việt trong code.
- Escape giữ đúng như bản gốc: `{{\\r}}` trong prompt/hint, `{{split("\\n")}}` trong hint.
- `node scripts/check-i18n.js lessons-jvm-5` → OK — 1 mục đã dịch (file được chạy trong vm nên cú pháp đã được kiểm); `node scripts/validate.js` → OK — không có lỗi (chỉ còn cảnh báo cũ của các file q-*.js).
- Không sửa file nào khác, không commit.
Reviewed-by: check-i18n (translation, no LLM review)
