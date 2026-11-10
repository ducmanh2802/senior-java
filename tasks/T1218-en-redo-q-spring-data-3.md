# T1218 — Dịch lại (nội dung đã sửa): q-spring-data-3 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-3.en.js` đã cũ: **jpa-008, jpa-009**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-3 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `jpa-008` and `jpa-009` in `js/i18n/q-spring-data-3.en.js` to match the current Vietnamese content in `js/data/q-spring-data.js` (added "Key terms", expanded "How it works", "Real-world example", "Model interview answer"; kept code/ids intact, translated code comments to English).
- Preserved all other entries (db-001..db-009) unchanged; kept key set/field shape identical.
- Markup compliant (no backticks, no `${`); `node --check` OK.
- `node scripts/check-i18n.js q-spring-data-3` → `OK — 11 mục đã dịch.`
- `node scripts/validate.js` reports 31 pre-existing errors unrelated to this task (missing `api-*` refs in `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`); no new errors introduced by this change.
Reviewed-by: check-i18n (translation, no LLM review)
