# T492 — Dịch lại (nội dung đã sửa): labs-sql-4 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/labs-sql-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/labs-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/labs-sql-4.en.js` đã cũ: **lab-sql-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/labs-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/labs-sql-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js labs-sql-4 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ entry `lab-sql-005` trong `js/i18n/labs-sql-4.en.js` theo bản tiếng Việt hiện tại (`js/data/labs-sql.js` dòng 832–1061): sửa ngày flash sale 15/03/2026, scenario, hints (bỏ chi tiết `xmax` không có trong bản Việt), answer, rubric.
- Sửa lỗi escape cũ (`\\'` in ra dấu `\` thừa) trong hint và answer; không còn backtick / `${` trong chuỗi.
- Giữ nguyên key, tập field (title, scenario, questions, hints, answer, rubric), code/id/url; không đụng lab-sql-006..008.
- `node scripts/check-i18n.js labs-sql-4` → `OK — 4 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
Reviewed-by: check-i18n (translation, no LLM review)
