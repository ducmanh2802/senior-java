# T1224 — Dịch lại (nội dung đã sửa): q-sql-6 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-sql-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-sql-6.en.js` đã cũ: **sql-030**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-sql-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.

Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-sql-6 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại `sql-030` trong `js/i18n/q-sql-6.en.js` (q, a, follow) theo bản VI hiện tại trong `js/data/q-sql.js` (effective-dated price/fee, valid_from/valid_to, tstzrange/exclusion constraint, MySQL FOR UPDATE overlap check). Giữ nguyên key/field; code/SQL không đổi; không dùng backtick hoặc `${`.
- `node scripts/check-i18n.js q-sql-6` → `OK — 2 mục đã dịch.`
- `node scripts/validate.js` → vẫn còn 31 lỗi + 1 cảnh báo **pre-existing, không liên quan** (lessons-api/sql/projects/path tham chiếu `api-*`/question id không tồn tại; path thiếu lesson-design-006/007). Không sửa vì nằm ngoài file được sở hữu.Reviewed-by: check-i18n (translation, no LLM review)
