# T1187 — Dịch lại (nội dung đã sửa): q-kotlin-2 (2 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-kotlin-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-kotlin.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-kotlin-2.en.js` đã cũ: **kotlin-016, kotlin-018**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-kotlin.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-kotlin-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-kotlin-2 → OK; node scripts/validate.js → OK.

## Notes

Đã dịch lại kotlin-016 và kotlin-018 theo bản tiếng Việt hiện tại trong js/data/q-kotlin.js.
- kotlin-016: bổ sung phần "Real-world example" và "Sample interview answer" (thiếu trong bản cũ), sửa @DslMarker→@RouteDsl trong code block DSL.
- kotlin-018: làm mới bản dịch theo nội dung hiện tại (đã gần đúng, căn lại một số cụm).
check-i18n.js q-kotlin-2 → OK (8 mục). validate.js không có lỗi mới liên quan kotlin (các lỗi còn lại nằm trong lessons-api.js, projects.js, path.js — không sở hữu bởi task này).Reviewed-by: check-i18n (translation, no LLM review)
