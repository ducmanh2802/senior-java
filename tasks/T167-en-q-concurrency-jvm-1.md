# T167 — Dịch sang tiếng Anh: q-concurrency-jvm (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-1.en.js`
Notes: Đã dịch đủ 13 mục (concurrency-001..013) từ `js/data/q-concurrency-jvm.js`. Giữ nguyên markup (`**`, `{{code}}`, `###`, `- `, bảng, `~~~java`…), thuật ngữ chuyên ngành không dịch, `> Senior tip:` giữ nguyên. `node --check`, `node scripts/check-i18n.js q-concurrency-jvm-1` và `node scripts/validate.js` đều OK. Không git commit, không kill process, không mở trình duyệt.

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-concurrency-jvm.js`: **concurrency-001, concurrency-002, concurrency-003, concurrency-004, concurrency-005, concurrency-006, concurrency-007, concurrency-008, concurrency-009, concurrency-010, concurrency-011, concurrency-012, concurrency-013**.

Viết vào `js/i18n/q-concurrency-jvm-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-concurrency-jvm-1.en.js` và `node scripts/check-i18n.js q-concurrency-jvm-1` → OK, rồi `Status: DONE`.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
