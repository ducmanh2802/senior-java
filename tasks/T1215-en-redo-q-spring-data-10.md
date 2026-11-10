# T1215 — Dịch lại (nội dung đã sửa): q-spring-data-10 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-10.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-10.en.js` đã cũ: **spring-035, jpa-028**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-10.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-10 → OK; node scripts/validate.js → OK.

## Notes
- 2026-11-08: Re-translated `spring-035` and `jpa-028` in `js/i18n/q-spring-data-10.en.js` to match current Vietnamese source (`js/data/q-spring-data.js` @ spring-035:5902, jpa-028:6244). Preserved all keys/fields and left other entries unchanged. Updated markup to match source (added "Real-world example" and "Sample interview answer" sections for both); no backticks or `${` introduced.
- `node --check js/i18n/q-spring-data-10.en.js` passed. `node scripts/check-i18n.js q-spring-data-10` → `OK — 8 mục đã dịch.`.
- `node scripts/validate.js` still reports 5 pre-existing errors unrelated to this task (projects.js `proj-auth-sso` refs `api-008`; path.js `path-05` refs missing `api-005..008`). No changes made outside owned file.
Reviewed-by: check-i18n (translation, no LLM review)
