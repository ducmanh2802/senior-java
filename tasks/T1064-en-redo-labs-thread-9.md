# T1064 — Dịch lại (nội dung đã sửa): labs-thread-9 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-thread-9.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/labs-thread.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/labs-thread-9.en.js` đã cũ: **lab-thread-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/labs-thread.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/labs-thread-9.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js labs-thread-9 → OK; node scripts/validate.js → OK.

## Notes
Verified content of `lab-thread-008` and re-validated i18n checks. Everything is up to date and correct. Status set to DONE.
