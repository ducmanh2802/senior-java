# T1227 — Dịch lại (nội dung đã sửa): q-system-design-9 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-9.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-system-design.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-system-design-9.en.js` đã cũ: **design-029**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-system-design.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-system-design-9.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-system-design-9 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `design-029` in `js/i18n/q-system-design-9.en.js` (kept key `design-029`, fields `q`/`a`; preserved code/IDs/commands and translated all Vietnamese text). Did not modify `design-028` or any other file.
- Verified: `node --check js/i18n/q-system-design-9.en.js` (syntax OK), `node scripts/check-i18n.js q-system-design-9` → `OK — 2 mục đã dịch`.
- `node scripts/validate.js` reports pre-existing errors unrelated to this task (missing `api-*` question IDs referenced by `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`; warning about `lesson-design-006/007` not in PATH). No errors in owned files.
Reviewed-by: check-i18n (translation, no LLM review)
