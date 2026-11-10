# T1142 — Dịch lại (nội dung đã sửa): q-autotest-1 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-autotest-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-autotest.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-autotest-1.en.js` đã cũ: **autotest-003, autotest-004**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-autotest.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-autotest-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-autotest-1 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ entry `autotest-003` và `autotest-004` trong `js/i18n/q-autotest-1.en.js` theo bản tiếng Việt mới (thêm phần **Ví dụ đời thực** và **Trả lời mẫu khi phỏng vấn**, dịch comment code sang tiếng Anh). Giữ nguyên key, field, id, url, code block. Kiểm tra: `node scripts/check-i18n.js q-autotest-1` → OK; `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
