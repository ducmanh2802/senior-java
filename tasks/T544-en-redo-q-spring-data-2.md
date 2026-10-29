# T544 — Dịch lại (nội dung đã sửa): q-spring-data-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-spring-data-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-spring-data.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-spring-data-2.en.js` đã cũ: **spring-013**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-spring-data.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-spring-data-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-spring-data-2 → OK; node scripts/validate.js → OK.

## Notes

- Dịch lại toàn bộ entry `spring-013` trong `js/i18n/q-spring-data-2.en.js` theo bản tiếng Việt hiện tại.
  Cập nhật chính: mục 404 nay giải thích đầy đủ hành vi từ Spring Framework 6.1 / Boot 3.2
  (`NoResourceFoundException` do static resource handler ném, lớp cha map thành ProblemDetail 404,
  override `handleNoResourceFoundException` nếu cần format riêng; bản cũ hơn đi thẳng tới `/error`),
  cùng các câu chữ đã làm rõ ở phần bẫy và Senior tip. Giữ nguyên key, field (`q`, `a`, `follow`),
  code block, id và refs không đụng tới. Các mục khác trong file không thay đổi.
- `node scripts/check-i18n.js q-spring-data-2` → OK (11 mục); `node scripts/validate.js` → OK.
Reviewed-by: check-i18n (translation, no LLM review)
