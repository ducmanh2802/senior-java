# T1116 — Dịch lại (nội dung đã sửa): lessons-microservices-7 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-microservices-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-microservices.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-microservices-7.en.js` đã cũ: **lesson-microservices-008**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-microservices.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-microservices-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-microservices-7 → OK; node scripts/validate.js → OK.

## Notes
- Đã dịch lại lesson-microservices-008, sửa các comment/chuỗi tiếng Việt còn sót trong code mẫu. Validated OK.
Reviewed-by: check-i18n (translation, no LLM review)
