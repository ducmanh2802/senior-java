# T952 — Dịch sang tiếng Anh: q-concurrency-jvm (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-concurrency-jvm-11.en.js`

Người dùng bấm EN thì **cả trang** chuyển sang tiếng Anh: file này phủ bản dịch lên dữ liệu gốc theo `id` (đọc comment "content translation" trong `js/core/i18n.js`). Đọc AGENTS.md mục 5 (markup) và các mục sau trong `js/data/q-concurrency-jvm.js`: **concurrency-042, concurrency-043, concurrency-044, concurrency-045**.

Viết vào `js/i18n/q-concurrency-jvm-11.en.js`, trong `App.i18n.content({ ... })`, mỗi mục một key là id, giá trị là object chỉ gồm các field dịch: **q, a, follow**. Mảng object (vd `exercises`, `check`) viết đủ phần tử theo đúng thứ tự, mỗi phần tử chỉ chứa field dịch (code như starter/tests/reference KHÔNG chép vào).

Yêu cầu dịch:
- Tiếng Anh kỹ thuật tự nhiên, chính xác như tài liệu của một senior engineer; giữ nguyên ý, độ dài và độ chi tiết (KHÔNG tóm tắt, không bỏ đoạn, không thêm ý mới).
- **Thuật ngữ chuyên ngành giữ nguyên** (HashMap, idempotency key, isolation level…); tên riêng, số liệu, đơn vị giữ nguyên. Các nhãn cố định: "**Tóm tắt:**" → "**Summary:**", "> Senior tip:" giữ nguyên, "### Lưu ý khi phỏng vấn" → "### Interview notes".
- Giữ NGUYÊN markup (`**`, `{{code}}`, `###`, `- `, `1. `, `>`, bảng `|`, `~~~lang` … `~~~`). Trong code block: giữ code, chỉ dịch comment tiếng Việt.
- Dùng template literal cho chuỗi dài; KHÔNG có ký tự backtick bên trong, KHÔNG viết `${` (nếu bản gốc có `\${` thì giữ nguyên), `\` phải escape như bản gốc.
- `node --check js/i18n/q-concurrency-jvm-11.en.js` và `node scripts/check-i18n.js q-concurrency-jvm-11` → OK, rồi `Status: DONE`.

## Notes


## Completion notes (2026-11-08)
- Translated 4 items in `js/i18n/q-concurrency-jvm-11.en.js` (overlay format via `App.i18n.content`):
  - `concurrency-042` (senior): CompletableFuture internals — q, a, follow
  - `concurrency-043` (senior): Reordering (store buffer/invalidate queue/JIT, barriers, x86 TSO vs ARM) — q, a, follow
  - `concurrency-044` (lead): Virtual threads internals (continuation/stack chunks, mount/unmount, scheduler, pinning, JEP 491) — q, a, follow
  - `concurrency-045` (lead): `synchronized` internals (mark word, thin lock/ObjectMonitor, inflation, biased locking removal JDK 18) — q, a, follow
- Kept all markup (`**`, `{{code}}`, `###`, lists, `>`, tables, `~~~seq`/`~~~text`/`~~~java` fences) intact. No backticks, no `${`. Translated Vietnamese comments in code/diagram blocks; kept code/identifiers/URLs/refs.
- Labels preserved: `**Tóm tắt:**` → `**Summary:**`, `> Senior tip:` kept.
- Checks: `node --check js/i18n/q-concurrency-jvm-11.en.js` OK; `node scripts/check-i18n.js q-concurrency-jvm-11` → `OK — 4 mục đã dịch`.
- `node scripts/validate.js` reports a pre-existing unrelated error outside owned files: `q-banking.js: banking-014.a: sơ đồ ~~~seq lỗi: cần 2–6 actors (đang có 8)`. No errors/warnings attributable to `q-concurrency-jvm-11.en.js` or concurrency-042..045.

Reviewed-by: check-i18n (translation, no LLM review)
