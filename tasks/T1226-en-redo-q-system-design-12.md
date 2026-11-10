# T1226 — Dịch lại (nội dung đã sửa): q-system-design-12 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-12.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-system-design.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-system-design-12.en.js` đã cũ: **design-030, design-031, design-032, design-033, design-034, design-035**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-system-design.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-system-design-12.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-system-design-12 → OK; node scripts/validate.js → OK.

## Notes

Done. Re-translated design-030..035 in `js/i18n/q-system-design-12.en.js` to match the updated Vietnamese source in `js/data/q-system-design.js` (kept keys, follow, tags; no backticks, no `${`). `node scripts/check-i18n.js q-system-design-12` → OK; `node --check` → OK. The remaining `validate.js` errors are pre-existing in files I do not own (`lessons-api.js`, `projects.js`, `path.js`) and are unrelated to this task.
Reviewed-by: check-i18n (translation, no LLM review)
