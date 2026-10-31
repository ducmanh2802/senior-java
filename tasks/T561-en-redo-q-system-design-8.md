# T561 — Dịch lại (nội dung đã sửa): q-system-design-8 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-system-design-8.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-system-design.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-system-design-8.en.js` đã cũ: **design-027**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-system-design.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-system-design-8.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-system-design-8 → OK; node scripts/validate.js → OK.

## Notes
Translated design-027 (loyalty points & cashback) from Vietnamese to English. Removed non-translatable `tags` field from i18n entry per validation rules. Both check-i18n.js and validate.js pass.
Reviewed-by: check-i18n (translation, no LLM review)
