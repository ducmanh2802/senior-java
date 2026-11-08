# T1122 — Dịch lại (nội dung đã sửa): lessons-security-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-security-3.en.js` đã cũ: **lesson-security-003**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-security-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-security-3 → OK; node scripts/validate.js → OK.

## Notes

Re-translated lesson-security-003 entry in js/i18n/lessons-security-3.en.js from the current Vietnamese source in js/data/lessons-security.js. All fields translated: title, goals, body (including ~~~java code comments), exercises (title, prompt, hints, explain), check (q, options, answer, explain). Code, id, and URLs kept unchanged. Verified with node scripts/check-i18n.js lessons-security-3 → OK and node scripts/validate.js → OK.Reviewed-by: check-i18n (translation, no LLM review)
