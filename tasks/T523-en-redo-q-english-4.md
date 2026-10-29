# T523 — Dịch lại (nội dung đã sửa): q-english-4 (18 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-4.en.js` đã cũ: **english-040, english-041, english-042, english-043, english-044, english-045, english-046, english-047, english-048, english-049, english-050, english-051, english-052, english-053, english-054, english-055, english-056, english-057**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-4 → OK; node scripts/validate.js → OK.

## Notes
Translated all 18 English questions (english-040 through english-057) from Vietnamese in js/data/q-english.js to English in js/i18n/q-english-4.en.js. Both validation scripts pass: check-i18n and validate.
Reviewed-by: check-i18n (translation, no LLM review)
