# T1154 — Dịch lại (nội dung đã sửa): q-banking-7 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-banking-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-banking.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-banking-7.en.js` đã cũ: **banking-032, banking-034**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-banking.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-banking-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-banking-7 → OK; node scripts/validate.js → OK.

## Notes
Redo completed: banking-032 and banking-034 entries in js/i18n/q-banking-7.en.js already match current Vietnamese source; check-i18n OK.
