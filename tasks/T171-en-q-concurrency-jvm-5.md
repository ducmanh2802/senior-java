# T171 — Dịch sang tiếng Anh: q-concurrency-jvm (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-5.en.js`

Notes: Đã dịch đủ 7 mục (concurrency-024/025/026/027, jvm-019/020/021) vào `App.i18n.content`. Giữ nguyên markup, dịch comment trong code block, không thêm/bớt ý. `node --check` và `node scripts/check-i18n.js q-concurrency-jvm-5` OK; `node scripts/validate.js` OK. Không git commit, không mở trình duyệt, không kill tiến trình.

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-concurrency-jvm.js`: **concurrency-024, concurrency-025, concurrency-026, concurrency-027, jvm-019, jvm-020, jvm-021**.

Viết vào `js/i18n/q-concurrency-jvm-5.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-concurrency-jvm-5.en.js` và `node scripts/check-i18n.js q-concurrency-jvm-5` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
