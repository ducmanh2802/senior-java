# T1149 — Dịch lại (nội dung đã sửa): q-banking-2 (6 mục)

Status: DONE

Note: Updated banking-009, 010, 011, 013, 014, 015 in js/i18n/q-banking-2.en.js with new translations from js/data/q-banking.js. Checked with node scripts/check-i18n.js q-banking-2 OK.
Agent: opencode
Owns: `js/i18n/q-banking-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-banking.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-banking-2.en.js` đã cũ: **banking-009, banking-010, banking-011, banking-013, banking-014, banking-015**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-banking.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-banking-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-banking-2 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
