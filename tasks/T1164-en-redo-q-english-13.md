# T1164 — Dịch lại (nội dung đã sửa): q-english-13 (9 mục)

Status: DONE
Note: Dịch lại các mục english-114 đến english-122. Node scripts/check-i18n.js pass.
Agent: opencode
Owns: `js/i18n/q-english-13.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-13.en.js` đã cũ: **english-114, english-115, english-116, english-117, english-118, english-119, english-120, english-121, english-122**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-13.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-13 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
