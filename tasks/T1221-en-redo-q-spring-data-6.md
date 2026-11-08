# T1221 — Dịch lại (nội dung đã sửa): q-spring-data-6 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-6.en.js` đã cũ: **jpa-018, jpa-019, db-014**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-6 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `jpa-018`, `jpa-019`, `db-014` in `js/i18n/q-spring-data-6.en.js` to match current VN source (`js/data/q-spring-data.js` lines ~3363, ~3411, ~3789). Added missing sections (Real-world example, Sample interview answer) for jpa-018/jpa-019 and fully aligned db-014 content (terms, step-by-step ops, MySQL note, expanded pitfalls/examples). Keys/fields preserved; code/ids kept; Vietnamese strings in code comments translated.
- `node --check js/i18n/q-spring-data-6.en.js` OK. `node scripts/check-i18n.js q-spring-data-6` → `OK — 8 mục đã dịch.` (acceptance for owned file).
- `node scripts/validate.js` reports 31 pre-existing errors + 1 warning unrelated to owned files (lessons-api/sql, projects.js, path.js referencing missing `api-*` question IDs; `path.js` missing lesson-design-006/007 in PATH). No files outside ownership were modified.
Reviewed-by: check-i18n (translation, no LLM review)
