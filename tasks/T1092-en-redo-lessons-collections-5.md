# T1092 — Dịch lại (nội dung đã sửa): lessons-collections-5 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-collections-5.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-collections.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-collections-5.en.js` đã cũ: **lesson-collections-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-collections.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-collections-5.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-collections-5 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại toàn bộ entry lesson-collections-005 trong js/i18n/lessons-collections-5.en.js theo bản tiếng Việt hiện tại của js/data/lessons-collections.js (giữ key, id, code, url; dịch chuỗi tiếng Việt trong code/comment sang tiếng Anh; các field code starter/tests/reference không được dịch theo quy ước i18n). node --check OK; node scripts/check-i18n.js lessons-collections-5 → OK; node scripts/validate.js → OK — không có lỗi.
Reviewed-by: check-i18n (translation, no LLM review)
