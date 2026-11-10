# T1059 — Dịch lại (nội dung đã sửa): labs-gc-6 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-gc-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/labs-gc.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/labs-gc-6.en.js` đã cũ: **lab-gc-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/labs-gc.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/labs-gc-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js labs-gc-6 → OK; node scripts/validate.js → OK.

## Notes

Redo verification: English overlay already matches current Vietnamese lab-gc-008; check-i18n and validate OK.
