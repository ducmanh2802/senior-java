# T506 — Dịch lại (nội dung đã sửa): lessons-testing-1 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-testing-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-testing.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-testing-1.en.js` đã cũ: **lesson-testing-001, lesson-testing-002**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-testing.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-testing-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-testing-1 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ entry `lesson-testing-001` và `lesson-testing-002` từ bản tiếng Việt hiện tại (sau commit review 07eabf1), gồm các phần đã sửa: bẫy "mock trả giá trị rỗng" + `UnnecessaryStubbingException`, "don't mock what you don't own", đoạn Spring Boot `@TestConfiguration`/`@Primary`/`mockStatic`, bẫy `equals` sau round-trip database, lời giải thích `!isAfter` và `Thread.sleep`, cùng các phương án/explain trắc nghiệm mới. Giữ nguyên key, chỉ chép field dịch (title, goals, body, exercises[title/prompt/hints/explain], check[q/options/answer/explain]); không có backtick hay `${`; comment tiếng Việt trong code mẫu của body đã dịch sang tiếng Anh; thêm newline cuối file.

Kiểm tra: `node scripts/check-i18n.js lessons-testing-1` → OK (2 mục); `node scripts/validate.js` → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
