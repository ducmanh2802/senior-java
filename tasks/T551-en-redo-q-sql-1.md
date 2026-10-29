# T551 — Dịch lại (nội dung đã sửa): q-sql-1 (8 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/q-sql-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-sql-1.en.js` đã cũ: **sql-001, sql-002, sql-003, sql-004, sql-005, sql-006, sql-007, sql-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-sql-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-sql-1 → OK; node scripts/validate.js → OK.

## Notes
