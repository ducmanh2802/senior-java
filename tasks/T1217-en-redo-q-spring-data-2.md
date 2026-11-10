# T1217 — Dịch lại (nội dung đã sửa): q-spring-data-2 (5 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-2.en.js` đã cũ: **spring-012, jpa-002, jpa-003, jpa-004, jpa-006**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-2 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated 5 entries in `js/i18n/q-spring-data-2.en.js` to match current VI content in `js/data/q-spring-data.js`: `spring-012`, `jpa-002`, `jpa-003`, `jpa-004`, `jpa-006`. Kept keys and field sets consistent with surrounding entries; did not touch other entries.
- Preserved code blocks/markup (`{{ }}`, `~~~`, tables, headings); no backticks or `${` introduced. Kept VI sample in spring-012 follow-up text? (none; translated interview/sample prose to EN, preserved code tokens).
- Ran `node --check js/i18n/q-spring-data-2.en.js` (OK), `node scripts/check-i18n.js q-spring-data-2` (OK — 11 mục đã dịch), `node scripts/build-light-index.js` (wrote `js/data/index-light.js`), `node scripts/validate.js` (exit 1 due to pre-existing unrelated errors in lessons-sql/api/projects/path referencing missing `api-*` IDs; grep shows no errors in `q-spring-data-2`). No files outside task ownership modified. No git commands, no browser, no process kills.
Reviewed-by: check-i18n (translation, no LLM review)
