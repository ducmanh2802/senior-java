# T954 — Dịch sang tiếng Anh: q-concurrency-jvm (7 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-13.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-concurrency-jvm.js`: **concurrency-052, concurrency-053, jvm-037, jvm-038, jvm-039, jvm-040, jvm-041**.

Viết vào `js/i18n/q-concurrency-jvm-13.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-concurrency-jvm-13.en.js` và `node scripts/check-i18n.js q-concurrency-jvm-13` → OK, rồi `Status: DONE`.

## Notes
- Translated 7 items to English in `js/i18n/q-concurrency-jvm-13.en.js` (`concurrency-052`, `concurrency-053`, `jvm-037`, `jvm-038`, `jvm-039`, `jvm-040`, `jvm-041`), covering `q`, `a`, `follow` with full detail preserved (Summary labels, Senior tip kept, markup intact, no backticks/`${`, code kept with Vietnamese comments translated).
- Checks (owned file): `node --check js/i18n/q-concurrency-jvm-13.en.js` → OK; `node scripts/check-i18n.js q-concurrency-jvm-13` → `OK — 7 mục đã dịch.`; `node scripts/build-light-index.js` run (index rebuilt).
- `node scripts/validate.js` still reports a pre-existing unrelated error (not in files I own): `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. Warnings also pre-existing (`q-java.js modern-033` short answer; `path.js` lessons not in PATH). No changes made outside owned files.
Reviewed-by: check-i18n (translation, no LLM review)
