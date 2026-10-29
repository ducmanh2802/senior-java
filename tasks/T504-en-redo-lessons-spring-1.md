# T504 — Dịch lại (nội dung đã sửa): lessons-spring-1 (5 mục)

Status: TODO
Agent: opencode
Owns: `js/i18n/lessons-spring-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-spring.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-spring-1.en.js` đã cũ: **lesson-spring-001, lesson-spring-002, lesson-spring-003, lesson-spring-004, lesson-spring-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-spring.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-spring-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-spring-1 → OK; node scripts/validate.js → OK.

## Notes
