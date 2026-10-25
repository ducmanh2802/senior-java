# T173 — Dịch sang tiếng Anh: q-spring-data (11 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-1.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-spring-data.js`: **spring-001, spring-002, spring-003, spring-004, spring-005, spring-006, spring-007, spring-008, spring-009, spring-010, spring-011**.

Viết vào `js/i18n/q-spring-data-1.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-spring-data-1.en.js` và `node scripts/check-i18n.js q-spring-data-1` → OK, rồi `Status: DONE`.

## Notes
Đã dịch đủ 11 mục (spring-001 đến spring-011) vào `js/i18n/q-spring-data-1.en.js`. Giữ nguyên markup, dịch `**Tóm tắt:**` → `**Summary:**`, giữ `> Senior tip:` và `### Lưu ý khi phỏng vấn` (nếu có). Đã chạy `node --check`, `node scripts/check-i18n.js q-spring-data-1` và `node scripts/validate.js` → OK. Không dùng trình duyệt, không kill tiến trình, không git commit.
Reviewed-by: check-i18n (translation, no LLM review)
