# T542 — Dịch lại (nội dung đã sửa): q-soft-2 (3 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-soft-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-soft.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-soft-2.en.js` đã cũ: **behavioral-002, behavioral-006, behavioral-007**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-soft.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-soft-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-soft-2 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại 3 mục behavioral-002, behavioral-006, behavioral-007 từ bản tiếng Việt mới nhất trong q-soft.js. Cả hai script validation đều pass.
Reviewed-by: check-i18n (translation, no LLM review)
