# T491 — Dịch lại (nội dung đã sửa): labs-incident-3 (1 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/labs-incident-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/labs-incident.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/labs-incident-3.en.js` đã cũ: **lab-incident-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/labs-incident.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/labs-incident-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js labs-incident-3 → OK; node scripts/validate.js → OK.

## Notes
