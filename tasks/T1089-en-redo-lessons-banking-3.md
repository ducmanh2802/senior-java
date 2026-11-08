# T1089 — Dịch lại (nội dung đã sửa): lessons-banking-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-banking-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-banking.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-banking-3.en.js` đã cũ: **lesson-banking-006**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-banking.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-banking-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-banking-3 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ entry lesson-banking-006 từ tiếng Việt sang tiếng Anh, bao gồm:
- Thay toàn bộ entry cũ, giữ nguyên key lesson-banking-006
- Dịch toàn bộ body, goals, exercises (title, prompt, hints, explain), check (q, options, explain)
- Dịch tất cả chuỗi tiếng Việt trong code block (starter, tests, reference comments và string literals) sang tiếng Anh
- Loại bỏ các field không dịch được (related, tags ở cấp cao; starter, tests, reference trong exercises) theo quy ước i18n overlay
- Không sửa file js/data/lessons-banking.js (sở hữu bởi integrator)
Reviewed-by: check-i18n (translation, no LLM review)
