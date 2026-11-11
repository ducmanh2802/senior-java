# T1235 — Dịch lại (nội dung đã sửa): quiz-spring-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-spring-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz-spring.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-spring-3.en.js` đã cũ: **qz-api-022**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz-spring.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-spring-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-spring-3 → OK; node scripts/validate.js → OK.

## Notes
Redo completed: qz-api-022 entry matches current Vietnamese. check-i18n OK (15 items). validate pre-existing errors unrelated to this task (api related ids).
