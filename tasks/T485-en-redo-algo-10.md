# T485 — Dịch lại (nội dung đã sửa): algo-10 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/algo-10.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/algo.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/algo-10.en.js` đã cũ: **algo-081, algo-082, algo-083**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/algo.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/algo-10.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js algo-10 → OK; node scripts/validate.js → OK.

## Notes
- Dịch lại toàn bộ 3 entry (prompt, hints, solution, follow) theo bản tiếng Việt hiện tại: algo-081 thêm phần "Why is j always valid?", code dùng sentinel và ép long; algo-082 đổi sang ArrayDeque + quy tắc từng bước + chạy tay "1-(-2)"; algo-083 thêm giải thích invariant "vật cản", alternative O(1) bộ nhớ và trace ")()())".
- Code mẫu giữ nguyên logic, chỉ dịch comment và các dòng trace tiếng Việt trong khối ~~~text; không có backtick hay `${` trong file.
- Đã chạy: `node scripts/check-i18n.js algo-10` → OK (3 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
