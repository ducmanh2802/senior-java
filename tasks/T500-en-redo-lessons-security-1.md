# T500 — Dịch lại (nội dung đã sửa): lessons-security-1 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-security-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-security.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-security-1.en.js` đã cũ: **lesson-security-001**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-security.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-security-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-security-1 → OK; node scripts/validate.js → OK.

## Notes
Re-translated lesson-security-001 (password storage: salt, PBKDF2, timing-safe comparison) to English. Only translatable fields included (title, goals, body, exercises.title/prompt/hints/explain, check.q/options/explain). Code fields (starter, tests, reference) and metadata (related, tags) omitted per i18n rules. Both check-i18n and validate pass.
Reviewed-by: check-i18n (translation, no LLM review)
