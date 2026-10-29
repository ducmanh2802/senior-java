# T525 — Dịch lại (nội dung đã sửa): q-english-7 (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-7.en.js` đã cũ: **english-064, english-065, english-066, english-067, english-068, english-069, english-070, english-071**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-7 → OK; node scripts/validate.js → OK.

## Notes
Re-translated all 8 entries (english-064 through english-071) in q-english-7.en.js based on the updated Vietnamese content in q-english.js. Both validation scripts pass: `node scripts/check-i18n.js q-english-7` → OK, `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
