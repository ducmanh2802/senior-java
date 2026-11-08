# T1070 — Dịch lại (nội dung đã sửa): lessons-api-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-api-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-api.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-api-3.en.js` đã cũ: **lesson-api-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-api.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-api-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-api-3 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-api-005` in `js/i18n/lessons-api-3.en.js` from current VI content in `js/data/lessons-api.js` (same fields/key; code/ids unchanged; no other entries touched).
- Kept markup rules (no backticks, no `${`, used `{{...}}`/`~~~` as in source).
- Ran: `node --check js/i18n/lessons-api-3.en.js`, `node scripts/check-i18n.js lessons-api-3` (OK — 2 mục đã dịch), `node scripts/build-light-index.js`, `node scripts/validate.js` (OK — no errors; only pre-existing warnings for modern-033 length and path lessons).
Reviewed-by: check-i18n (translation, no LLM review)
