# T1135 — Dịch lại (nội dung đã sửa): lessons-testing-4 (1 mục)

Status: DONE
Agent: opencode

Đã dịch lại lesson-testing-005 trong js/i18n/lessons-testing-4.en.js. Đã kiểm tra validate và OK.
Owns: `js/i18n/lessons-testing-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-testing.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-testing-4.en.js` đã cũ: **lesson-testing-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-testing.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-testing-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-testing-4 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
