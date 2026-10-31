# T572 — Dịch lại (nội dung đã sửa): q-system-design-3 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-system-design.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-system-design-3.en.js` đã cũ: **architecture-004, architecture-005, architecture-006**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-system-design.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-system-design-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-system-design-3 → OK; node scripts/validate.js → OK.

## Notes
Translated architecture-004 (flash sale), architecture-005 (payment/e-wallet), architecture-006 (notification service) from Vietnamese design-004/005/006. Removed non-translatable tags fields. Both check-i18n.js and validate.js pass.
Reviewed-by: check-i18n (translation, no LLM review)
