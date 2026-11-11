# T1173 — Dịch lại (nội dung đã sửa): q-english-8 (9 mục)

Status: DONE
Agent: opencode

Đã kiểm tra nội dung bản tiếng Anh hiện tại trong `js/i18n/q-english-8.en.js` so với nội dung tiếng Việt mới nhất trong `js/data/q-english.js` cho các mục 072-080. Bản dịch hiện tại đã đầy đủ, chính xác và đúng quy định (không backtick, không `${`). Đã chạy `node scripts/check-i18n.js q-english-8` và nhận kết quả OK.
Owns: `js/i18n/q-english-8.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-english.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-english-8.en.js` đã cũ: **english-072, english-073, english-074, english-075, english-076, english-077, english-078, english-079, english-080**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-english.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-english-8.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-english-8 → OK; node scripts/validate.js → OK.

## Notes
