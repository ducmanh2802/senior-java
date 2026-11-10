# T1136 — Dịch lại (nội dung đã sửa): lessons-testing-5 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-testing-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-testing.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-testing-5.en.js` đã cũ: **lesson-testing-006**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-testing.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-testing-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-testing-5 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ entry `lesson-testing-006` từ `js/data/lessons-testing.js` sang `js/i18n/lessons-testing-5.en.js` (title, goals, body, exercises, check; giữ nguyên key, các field code/starter/tests/reference không dịch vì không nằm trong overlay dịch). Dịch đầy đủ chuỗi tiếng Việt trong code samples (comment và string literal) bên trong các block `~~~java`/`~~~text` của body và prompt. Không đụng các mục khác.
`node scripts/check-i18n.js lessons-testing-5` → OK; `node scripts/validate.js` → OK.