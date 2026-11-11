# T1209 — Dịch lại (nội dung đã sửa): q-soft-11 (1 mục)

Status: DONE

Notes: behavioral-044 English entry already in sync with Vietnamese source; check-i18n OK. Pre-existing validate errors unrelated (path.js/api refs).
Agent: opencode
Owns: `js/i18n/q-soft-11.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-11.en.js` đã cũ: **behavioral-044**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-11.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-11 → OK; node scripts/validate.js → OK.

## Notes
