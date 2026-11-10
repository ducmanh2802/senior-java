# T1067 — Dịch lại (nội dung đã sửa): lessons-ai-3 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-ai-3.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-ai.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-ai-3.en.js` đã cũ: **lesson-ai-005**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-ai.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-ai-3.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-ai-3 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ entry lesson-ai-005 (title, goals, body, exercises[2].{prompt,hints,explain}, check[4]) sang tiếng Anh, giữ nguyên id/track/order/level/minutes và các liên kết (related, tags) trong file dữ liệu. Loại bỏ field starter/tests/reference khỏi exercises theo quy tắc chỉ dịch field có trong ALLOWED của check-i18n.js. Cả hai validate đã OK.
Reviewed-by: check-i18n (translation, no LLM review)
