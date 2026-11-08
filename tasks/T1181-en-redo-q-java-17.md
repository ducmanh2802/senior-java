# T1181 — Dịch lại (nội dung đã sửa): q-java-17 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-java-17.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-java-17.en.js` đã cũ: **modern-044**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-java-17.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-java-17 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `modern-044` in `js/i18n/q-java-17.en.js` to match current Vietnamese (`js/data/q-java.js` lines ~6982-7038): kept key/fields (`q`, `a`, `follow`), translated content fully to English, preserved code/ids, kept `{{...}}`/`~~~` markup (no backticks, no `${`). Added `### Real-world example` and `### Sample interview answer` sections consistent with current VN structure.
- `node --check js/i18n/q-java-17.en.js` OK.
- `node scripts/check-i18n.js q-java-17` → `OK — 4 mục đã dịch.`
- `node scripts/validate.js` reports pre-existing errors in files I do not own (`lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js` referencing missing `api-*` ids) and unrelated warnings; I did not modify those files (per AGENTS.md rule 3). No changes outside owned file.
Reviewed-by: check-i18n (translation, no LLM review)
