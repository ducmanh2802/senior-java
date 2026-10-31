# T553 — Dịch lại (nội dung đã sửa): q-sql-3 (6 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-sql-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-sql-3.en.js` đã cũ: **sql-017, sql-018, sql-019, sql-020, sql-021, sql-022**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-sql-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-sql-3 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại đủ 6 mục sql-017…sql-022 theo bản tiếng Việt hiện tại trong `js/data/q-sql.js`. Mỗi entry giữ nguyên key và cùng tập field (`q`, `a`, `follow`), giữ nguyên id/code/DDL/SQL; bám đủ cấu trúc mới của bản Việt: Summary → Quick understanding → Terms → từng bước cơ chế → sơ đồ ASCII/code → edge cases/performance → Common mistakes (kèm symptom + prevention) → 1-minute verbal answer → Senior tip. Thuật ngữ được giải thích kèm ví dụ đời thường cho người chưa quen (planner như điều phối giao hàng, partial index như sổ chỉ ghi thư chưa đọc, CTE như nồi nước dùng, parallel như thuê người kiểm thùng hàng). Chuỗi tiếng Việt trong code mẫu đã dịch ('All', 'Shirt', 'Pants'), decimal dùng dấu chấm.

Kiểm tra: `node scripts/check-i18n.js q-sql-3` → OK — 6 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
