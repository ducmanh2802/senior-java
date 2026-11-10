# T1066 — Dịch lại (nội dung đã sửa): lessons-ai-2 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-ai-2.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-ai.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-ai-2.en.js` đã cũ: **lesson-ai-004**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-ai.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-ai-2.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-ai-2 → OK; node scripts/validate.js → OK.

## Notes

Redo hoàn tất: lesson-ai-004 đã được dịch lại khớp bản tiếng Việt hiện tại. check-i18n và validate OK.
