# T552 — Dịch lại (nội dung đã sửa): q-sql-2 (8 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/q-sql-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-sql-2.en.js` đã cũ: **sql-009, sql-010, sql-011, sql-012, sql-013, sql-014, sql-015, sql-016**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-sql-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-sql-2 → OK; node scripts/validate.js → OK.

## Notes
