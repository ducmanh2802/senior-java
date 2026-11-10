# T1137 — Dịch lại (nội dung đã sửa): q-ai-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-ai-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-ai.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-ai-2.en.js` đã cũ: **ai-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-ai.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-ai-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-ai-2 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại mục ai-011 từ `js/data/q-ai.js` sang `js/i18n/q-ai-2.en.js`. Đã kiểm tra `node scripts/check-i18n.js q-ai-2` và `node scripts/validate.js` đều OK.
Reviewed-by: check-i18n (translation, no LLM review)
