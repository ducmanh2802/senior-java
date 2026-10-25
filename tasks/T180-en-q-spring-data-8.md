# T180 — Dịch sang tiếng Anh: q-spring-data (12 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-spring-data.js`: **spring-027, db-020, db-021, db-022, db-023, db-024, db-025, db-026, db-027, db-028, db-029, db-030**.

Viết vào `js/i18n/q-spring-data-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-spring-data-8.en.js` và `node scripts/check-i18n.js q-spring-data-8` → OK, rồi `Status: DONE`.

## Notes

Done 2026-10-25: đã viết `js/i18n/q-spring-data-8.en.js` với 12 mục dịch; `node --check` OK; `node scripts/check-i18n.js q-spring-data-8` → OK 12 mục; `node scripts/validate.js` → OK (không lỗi). Không sửa file khác ngoài task; không git commit; không kill tiến trình; không mở trình duyệt.
Reviewed-by: check-i18n (translation, no LLM review)
