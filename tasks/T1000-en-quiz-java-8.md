# T1000 — Dịch sang tiếng Anh: quiz-java (20 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/quiz-java.js`: **qz-core-028, qz-collections-027, qz-concurrency-028, qz-jvm-027, qz-modern-030, qz-collections-028, qz-concurrency-029, qz-concurrency-030, qz-concurrency-031, qz-concurrency-032, qz-jvm-028, qz-jvm-029, qz-jvm-030, qz-jvm-031, qz-core-029, qz-jvm-032, qz-concurrency-033, qz-collections-029, qz-jvm-033, qz-core-030**.

Viết vào `js/i18n/quiz-java-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, options, explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/quiz-java-8.en.js` và `node scripts/check-i18n.js quiz-java-8` → OK, rồi `Status: DONE`.

## Notes
- Translated 20 quiz items to English (q, options, explain only): `qz-core-028,029,030`, `qz-collections-027,028,029`, `qz-concurrency-028..033`, `qz-jvm-027..033`, `qz-modern-030`. Kept `{{code}}`, `~~~` blocks, tables, `> Senior tip:` labels, and technical terms; translated all Vietnamese prose and code comments; preserved meaning/detail.
- `js/i18n/quiz-java-8.en.js` already registered in `js/i18n/manifest.js` (entry present). `node --check` OK, `node scripts/check-i18n.js quiz-java-8` → `OK — 20 mục đã dịch`, `node scripts/build-light-index.js` ran, `node scripts/validate.js` → OK (2 pre-existing warnings unrelated). No git commit.
Reviewed-by: check-i18n (translation, no LLM review)
