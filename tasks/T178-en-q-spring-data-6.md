# T178 — Dịch sang tiếng Anh: q-spring-data (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-6.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-spring-data.js`: **jpa-018, jpa-019, jpa-020, jpa-021, db-012, db-013, db-014, db-015**.

Viết vào `js/i18n/q-spring-data-6.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-spring-data-6.en.js` và `node scripts/check-i18n.js q-spring-data-6` → OK, rồi `Status: DONE`.

## Notes
Translated 8 questions (jpa-018..jpa-021, db-012..db-015): JPA/Hibernate/Spring Data JPA layering, save vs persist/merge/findById/getReferenceById, CascadeType and FetchType defaults with the ManyToMany REMOVE trap, derived queries vs @Query vs native SQL with Pageable count query, PostgreSQL MVCC/VACUUM/bloat/wraparound, index types (B-tree, partial, expression, GIN, BRIN), partitioning with pruning and constraints, and the three join algorithms. Kept all markup ({{code}}, tables, ###, > Senior tip), translated SQL/Java comments only. Checks pass: node --check, check-i18n q-spring-data-6 → OK (8/8), validate.js → OK.
Reviewed-by: check-i18n (translation, no LLM review)
