# T1084 — Dịch lại (nội dung đã sửa): lessons-autotest-9 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-9.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-autotest.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-autotest-9.en.js` đã cũ: **lesson-autotest-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-autotest.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-autotest-9.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`}).

## Nghiệm thu
node scripts/check-i18n.js lessons-autotest-9 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ lesson-autotest-011 theo nội dung tiếng Việt hiện tại trong js/data/lessons-autotest.js, giữ key/field, code/id/url không đổi, tránh backtick và `${}`.
Reviewed-by: check-i18n (translation, no LLM review)
