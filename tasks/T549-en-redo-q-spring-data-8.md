# T549 — Dịch lại (nội dung đã sửa): q-spring-data-8 (11 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-8.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-8.en.js` đã cũ: **db-020, db-021, db-022, db-023, db-024, db-025, db-026, db-027, db-028, db-029, db-030**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-8.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-8 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ 11 mục db-020..db-030 theo bản tiếng Việt hiện tại trong `js/data/q-spring-data.js`, giữ cùng tập field `q/a/follow` như các entry khác. Nội dung tiếng Anh bám cấu trúc mới của bản Việt (Tóm tắt, Hiểu nhanh, Thuật ngữ, từng bước, trade-off, pitfall production, lỗi hay gặp, trả lời miệng 1 phút, Senior tip), thuật ngữ được giải thích ở lần đầu xuất hiện kèm ví dụ; chuỗi/comment tiếng Việt trong code mẫu đã dịch sang tiếng Anh. Giữ nguyên spring-027 và dòng `ids` trong header.

Kiểm tra: `node scripts/check-i18n.js q-spring-data-8` → `OK — 12 mục đã dịch.`; `node scripts/validate.js` → `OK — không có lỗi.`
