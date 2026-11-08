# T1195 — Dịch lại (nội dung đã sửa): q-scenario-11 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-scenario-11.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-scenario.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-scenario-11.en.js` đã cũ: **scenario-086**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-scenario.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-scenario-11.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-scenario-11 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `scenario-086` in `js/i18n/q-scenario-11.en.js` to align with current Vietnamese (`js/data/q-scenario.js:4709-4763`): updated `q` wording ("given notice"), clarified tacit knowledge in "Understand quickly", minor phrasing fixes, and translated names in the handover script (`Minh and Ha`).
- Kept same key/fields (`q`, `a`, `follow`), no code/backticks/`${` issues.
- Checks: `node scripts/check-i18n.js q-scenario-11` → `OK — 6 mục đã dịch`. `node scripts/validate.js` still reports pre-existing repo errors unrelated to this file (missing `api-*` references in `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`, plus warnings in `q-java.js`/`path.js`); I did not modify those files (ownership constraint).
Reviewed-by: check-i18n (translation, no LLM review)
