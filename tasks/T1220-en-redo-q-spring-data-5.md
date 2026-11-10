# T1220 — Dịch lại (nội dung đã sửa): q-spring-data-5 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-5.en.js` đã cũ: **jpa-013, jpa-015, jpa-016**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-5 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `jpa-013`, `jpa-015`, `jpa-016` in `js/i18n/q-spring-data-5.en.js` from the current Vietnamese entries in `js/data/q-spring-data.js`.
- Translated Vietnamese code comments in examples to English (e.g., "bo dong header" → "skip header row", "streaming tung dong..." → "stream line by line...").
- Kept keys/structure identical to other entries in the file; no changes to other items.
- Markup rules respected (no backticks, no `${`).
- Verification:
  - `node --check js/i18n/q-spring-data-5.en.js` → OK
  - `node scripts/check-i18n.js q-spring-data-5` → `OK — 8 mục đã dịch.`
  - `node scripts/build-light-index.js` → rewrote `js/data/index-light.js`
  - `node scripts/validate.js` → reports 31 pre-existing errors and 1 warning unrelated to `q-spring-data-5.en.js` (missing `api-*` references in `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`; PATH warning for `lesson-design-006/007`). No errors in owned file.
Reviewed-by: check-i18n (translation, no LLM review)
