# T1130 — Dịch lại (nội dung đã sửa): lessons-sql-1 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-sql-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-sql-1.en.js` đã cũ: **lesson-sql-001**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-sql-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-sql-1 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `lesson-sql-001` (joins: nested loop, hash join, merge join) from current `js/data/lessons-sql.js`. Replaced only that entry in `js/i18n/lessons-sql-1.en.js`; `lesson-sql-002` unchanged.
- Preserved key and translatable fields (`title`, `goals`, `body`, `exercises[].title/prompt/hints/explain`, `check[].q/options/explain`). Did not copy `starter`/`tests`/`reference`/code artifacts (per i18n rules). Translated Vietnamese strings in code examples/comments to English.
- No backticks, no `${`. `node --check js/i18n/lessons-sql-1.en.js` OK.
- `node scripts/check-i18n.js lessons-sql-1` → `OK — 2 mục đã dịch.` `node scripts/validate.js` → `OK — không có lỗi.` (pre-existing warnings unchanged).
