# T1162 — Dịch lại (nội dung đã sửa): q-english-11 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-11.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-11.en.js` đã cũ: **english-103, english-104, english-105**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-11.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-11 → OK; node scripts/validate.js → OK.

## Notes

## Notes
Redone translations for english-103/104/105 matching current Vietnamese; check-i18n OK. Remaining validate errors are pre-existing unrelated (api topic).
Reviewed-by: check-i18n (translation, no LLM review)
