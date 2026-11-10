# T1140 — Dịch lại (nội dung đã sửa): q-api-1 (4 mục)

Status: DONE
Ghi chú: Đã dịch lại 4 câu hỏi api-001, api-002, api-003, api-004 trong `js/i18n/q-api-1.en.js` khớp với nội dung đã sửa trong `js/data/q-api.js`. Chạy validate OK (trừ các lỗi related id cũ không thuộc scope task).
Agent: opencode
Owns: `js/i18n/q-api-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-api.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-api-1.en.js` đã cũ: **api-001, api-002, api-003, api-004**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-api.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-api-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-api-1 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
