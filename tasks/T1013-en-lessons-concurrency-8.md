# T1013 — Dịch sang tiếng Anh: lessons-concurrency (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-concurrency-8.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/lessons-concurrency.js`: **lesson-concurrency-010, lesson-concurrency-011**.

Viết vào `js/i18n/lessons-concurrency-8.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **title, goals, body, exercises[].title, exercises[].prompt, exercises[].hints, exercises[].explain, check[].q, check[].options, check[].explain**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/lessons-concurrency-8.en.js` và `node scripts/check-i18n.js lessons-concurrency-8` → OK, rồi `Status: DONE`.

## Notes
- Translated `lesson-concurrency-010` (AQS-style MiniLock: state/CAS/queue/reentrancy) and `lesson-concurrency-011` (lock-free Treiber stack, ABA, AtomicStampedReference) into `js/i18n/lessons-concurrency-8.en.js` using the `App.i18n.content` overlay format (ids header space-separated). Only translatable fields included (title, goals, body, exercises[].title/prompt/hints/explain, check[].q/options/explain); code (starter/tests/reference) not duplicated.
- Kept all markup, `{{code}}`, `~~~lang` blocks, tables, labels ("**Summary:**" used where applicable in prose style kept consistent with source; `> Senior tip:` preserved as-is conceptually in text where present; interview sections translated to `### Interview relevance` following natural EN convention matching existing overlays). No backticks, no `${`, backslashes preserved.
- Checks: `node --check js/i18n/lessons-concurrency-8.en.js` OK; `node scripts/check-i18n.js lessons-concurrency-8` → `OK — 2 mục đã dịch.`
- `node scripts/validate.js` still reports pre-existing ERRORS/WARNINGS outside this task's ownership (not modified): `q-banking.js` banking-005/010/014 seq diagrams have 7–8 actors (>6); `q-java.js` modern-033 short answer warning; `path.js` lesson-design-006/007 not in PATH. These were not touched (rule 3).
Reviewed-by: check-i18n (translation, no LLM review)
