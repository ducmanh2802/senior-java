# T1131 — Dịch lại (nội dung đã sửa): lessons-sql-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-sql-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-sql-2.en.js` đã cũ: **lesson-sql-003**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-sql-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-sql-2 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại entry cho lesson-sql-003 trong `js/i18n/lessons-sql-2.en.js` theo nội dung tiếng Việt mới nhất trong `js/data/lessons-sql.js`.
Đã chạy node scripts/check-i18n.js lessons-sql-2 và node scripts/validate.js, kết quả OK.
Reviewed-by: check-i18n (translation, no LLM review)
