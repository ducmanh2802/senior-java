# T1146 — Dịch lại (nội dung đã sửa): q-aws-6 (10 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-aws-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-aws.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-aws-6.en.js` đã cũ: **aws-031, aws-032, aws-033, aws-034, aws-035, aws-036, aws-037, aws-038, aws-039, aws-040**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-aws.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-aws-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-aws-6 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
