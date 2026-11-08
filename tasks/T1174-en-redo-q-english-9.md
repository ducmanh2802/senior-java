# T1174 — Dịch lại (nội dung đã sửa): q-english-9 (13 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-english-9.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-9.en.js` đã cũ: **english-081, english-082, english-083, english-084, english-085, english-086, english-087, english-088, english-089, english-090, english-091, english-092, english-093**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-9.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-9 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 13 mục english-081…093 trong js/i18n/q-english-9.en.js từ bản tiếng Việt hiện tại của js/data/q-english.js (giữ nguyên key, id, code, follow; dịch toàn bộ phần giải thích tiếng Việt sang tiếng Anh và bổ sung 3 mục mới: ### Full sample answer, ### Vocabulary and phrases to reuse, ### Delivery tips for Vietnamese speakers). node scripts/check-i18n.js q-english-9 → OK (13 mục đã dịch). node scripts/validate.js: các lỗi còn lại là lỗi cũ trong file dữ liệu của các task khác (lessons-api, lessons-sql, projects, path, index-light), không liên quan và không do file của task này sửa.
Reviewed-by: check-i18n (translation, no LLM review)
