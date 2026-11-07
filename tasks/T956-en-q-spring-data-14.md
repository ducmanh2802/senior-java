# T956 — Dịch sang tiếng Anh: q-spring-data (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-14.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-spring-data.js`: **spring-039, spring-040, spring-041, spring-042, spring-043, spring-044, spring-045, spring-046**.

Viết vào `js/i18n/q-spring-data-14.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-spring-data-14.en.js` và `node scripts/check-i18n.js q-spring-data-14` → OK, rồi `Status: DONE`.

## Notes
- Translated `spring-039`–`spring-046` (q, a, follow) with full detail preserved; kept markup, kept `\${` escapes, no backticks/`${`. Replaced "Tóm tắt"→"Summary", "Ví dụ đời thực"→"Real-world example", "Trả lời mẫu khi phỏng vấn"→"Model interview answer", kept "Senior tip:" label.
- `node --check js/i18n/q-spring-data-14.en.js` → OK; `node scripts/check-i18n.js q-spring-data-14` → OK (8 items).
- Ran `node scripts/build-light-index.js` (per rule 6) → regenerated `js/data/index-light.js`.
- `node scripts/validate.js` currently fails on a **pre-existing** issue outside T956 ownership: `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. I did not modify `q-banking.js` (not owned). T956-owned checks all pass.
Reviewed-by: check-i18n (translation, no LLM review)
