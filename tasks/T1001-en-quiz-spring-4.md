# T1001 — Dịch sang tiếng Anh: quiz-spring (30 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-spring-4.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-spring.js`: **qz-spring-021, qz-spring-022, qz-spring-023, qz-spring-024, qz-jpa-021, qz-jpa-022, qz-jpa-023, qz-jpa-024, qz-db-021, qz-db-022, qz-db-023, qz-db-024, qz-api-023, qz-api-024, qz-api-025, qz-spring-025, qz-spring-026, qz-spring-027, qz-spring-028, qz-spring-029, qz-jpa-025, qz-jpa-026, qz-jpa-027, qz-jpa-028, qz-jpa-029, qz-db-025, qz-db-026, qz-db-027, qz-db-028, qz-db-029**.

Viết vào `js/i18n/quiz-spring-4.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-spring-4.en.js` và `node scripts/check-i18n.js quiz-spring-4` → OK, rồi `Status: DONE`.

## Notes
Đã dịch đầy đủ 30 mục (qz-spring-021→024, qz-jpa-021→024, qz-db-021→024, qz-api-023→025, qz-spring-025→029, qz-jpa-025→029, qz-db-025→029) vào `js/i18n/quiz-spring-4.en.js`. Chỉ dịch 3 field q/options/explain, giữ nguyên `multi`, `answer`, `topic`, `id`. Giữ nguyên markup, code block, thuật ngữ chuyên ngành. Đã chạy: `node --check` OK, `node scripts/check-i18n.js quiz-spring-4` OK (30 mục), `node scripts/build-light-index.js` OK, `node scripts/validate.js` OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
