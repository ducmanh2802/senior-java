# T1072 — Dịch lại (nội dung đã sửa): lessons-autotest-1 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-autotest-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-autotest.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-autotest-1.en.js` đã cũ: **lesson-autotest-001, lesson-autotest-002**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-autotest.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-autotest-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-autotest-1 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ 2 entry (lesson-autotest-001, lesson-autotest-002) trong js/i18n/lessons-autotest-1.en.js từ bản tiếng Việt hiện tại của js/data/lessons-autotest.js. Giữ nguyên key và tập field (title, goals, body, exercises[{title, prompt, hints, explain}], check[{q, options, explain}]); code/id/url giữ nguyên; chuỗi tiếng Việt trong code mẫu (comment, string literal) trong các field dịch đã sang tiếng Anh. Không backtick, không `${` trong template literal. node --check OK; node scripts/check-i18n.js lessons-autotest-1 → OK; node scripts/validate.js → OK.Reviewed-by: check-i18n (translation, no LLM review)
