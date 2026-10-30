# T547 — Dịch lại (nội dung đã sửa): q-spring-data-6 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-6.en.js` đã cũ: **db-012, db-013, db-014, db-015**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-6 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại toàn bộ 4 entry db-012, db-013, db-014, db-015 sang tiếng Anh theo bản tiếng Việt hiện tại, bổ sung các mục mới mà bản cũ thiếu: Hiểu nhanh (Quick intuition), Thuật ngữ (Terms), các khối "từng bước" (lifecycle UPDATE / chọn index / vận hành partition / optimizer chọn sai), Lỗi hay gặp (Common mistakes) và Trả lời miệng 1 phút (One-minute spoken answer).
- db-014: sửa lại bullet ATTACH cho khớp nội dung mới (PostgreSQL tự tạo index khớp trong lúc attach nếu thiếu; nên tạo trước).
- Giữ nguyên key, tập field (q/a/follow), code mẫu; comment tiếng Việt trong code đã dịch sang tiếng Anh.
- Chỉ sửa `js/i18n/q-spring-data-6.en.js` và file task này.
- `node scripts/check-i18n.js q-spring-data-6` → OK (8 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
