# T1132 — Dịch lại (nội dung đã sửa): lessons-sql-3 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-sql-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-sql-3.en.js` đã cũ: **lesson-sql-004, lesson-sql-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-sql-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-sql-3 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ 2 entry (lesson-sql-004: window function; lesson-sql-005: JOIN algorithms + EXPLAIN) trong js/i18n/lessons-sql-3.en.js từ bản tiếng Việt hiện tại của js/data/lessons-sql.js. Giữ nguyên key, id, code mẫu (~~~sql/~text); chỉ dịch trường dịch (title/goals/body/exercises/check), theo quy ước field của lessons-sql-1.en.js (không có starter/tests/reference/answer trong check). So sánh git: nội dung 2 mục này không thay đổi kể commit b708ef4 (T695), chỉ khôi phục dấu tiếng Việt trong comment code của reference (không thuộc overlay i18n), nên bản dịch đã gần như đồng bộ; đã viết lại cho khớp chính xác bản hiện tại.
check-i18n lessons-sql-3 → OK; validate.js → OK.
