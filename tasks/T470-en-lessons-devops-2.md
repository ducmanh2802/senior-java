# T470 — Dịch sang tiếng Anh: lessons-devops (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-2.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-devops.js`: **lesson-devops-003, lesson-devops-004**.

Viết vào `js/i18n/lessons-devops-2.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-devops-2.en.js` và `node scripts/check-i18n.js lessons-devops-2` → OK, rồi `Status: DONE`.

## Notes

- Đã dịch đầy đủ `lesson-devops-003` (rolling/blue-green/canary, hash ổn định, auto-rollback) và `lesson-devops-004` (phân loại FINAL/RETRY, exponential backoff có cap, jitter, Retry-After, idempotency) sang `js/i18n/lessons-devops-2.en.js`.
- Chỉ chép các field dịch: title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain; không chép starter/tests/reference, không chép `answer` của check.
- Giữ nguyên markup (bảng, danh sách, `{{code}}`, `~~~lang`), giữ nhãn "> Senior tip:", đổi "### Liên hệ phỏng vấn" → "### Interview notes"; đã dịch comment tiếng Việt trong code block của `body`.
- `node scripts/check-i18n.js lessons-devops-2` → OK — 2 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi.
