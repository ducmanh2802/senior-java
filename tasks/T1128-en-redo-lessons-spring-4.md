# T1128 — Dịch lại (nội dung đã sửa): lessons-spring-4 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-spring-4.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-spring.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-spring-4.en.js` đã cũ: **lesson-spring-009**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-spring.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-spring-4.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-spring-4 → OK; node scripts/validate.js → OK.

## Notes
- lesson-spring-009 re-translated; check-i18n and validate OK.
