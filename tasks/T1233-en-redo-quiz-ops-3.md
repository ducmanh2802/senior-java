# T1233 — Dịch lại (nội dung đã sửa): quiz-ops-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz-ops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-ops-3.en.js` đã cũ: **qz-primer-010**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz-ops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-ops-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-ops-3 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `qz-primer-010` in `js/i18n/quiz-ops-3.en.js` from current Vietnamese source (`js/data/quiz-ops.js:1730-1757`), keeping key/fields (`q`, `options`, `explain`) aligned with overlay format; translated Vietnamese strings in the diagram text (e.g. `[duyệt tay]`, `tự động`) to English; no backticks or `${` used.
- Checks: `node --check js/i18n/quiz-ops-3.en.js` OK; `node scripts/check-i18n.js quiz-ops-3` → "OK — 7 mục đã dịch."; `node scripts/validate.js` still reports pre-existing errors unrelated to owned file (broken `api-*` related/question refs in `lessons-sql.js`, `lessons-api.js`, `projects.js`, `path.js`; 2 PATH warnings). No files outside ownership changed.
Reviewed-by: check-i18n (translation, no LLM review)
