# T551 — Dịch lại (nội dung đã sửa): q-sql-1 (8 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-sql-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-sql.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-sql-1.en.js` đã cũ: **sql-001, sql-002, sql-003, sql-004, sql-005, sql-006, sql-007, sql-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-sql.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-sql-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-sql-1 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ 8 entry sql-001…sql-008 trong `js/i18n/q-sql-1.en.js` theo bản tiếng Việt hiện tại của `js/data/q-sql.js`.
- Bám đủ cấu trúc mục mới của bản VI: Summary, Quick intuition, Glossary (giải thích thuật ngữ ngay lần đầu), cơ chế từng bước kèm sơ đồ `~~~text`, SQL mẫu (comment trong code đã dịch sang tiếng Anh), lỗi hay gặp dạng symptom/fix, One-minute spoken answer, Senior tip.
- Giữ nguyên key, thứ tự id, id/tag/url; chỉ gồm `q`, `a`, `follow` — đúng tập field của các entry khác. Không backtick, không `${`, không còn chữ tiếng Việt ngoài code block.
- Nghiệm thu: `node scripts/check-i18n.js q-sql-1` → OK — 8 mục đã dịch; `node scripts/validate.js` → OK — không có lỗi.
- Đã xoá 2 file nháp tạo trong lúc soạn (`js/i18n/q-sql-1.en.tmp.js`, `js/i18n/_t551.tmp.js`); không còn file tạm.
Reviewed-by: check-i18n (translation, no LLM review)
