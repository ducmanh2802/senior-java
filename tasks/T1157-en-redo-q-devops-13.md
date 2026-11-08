# T1157 — Dịch lại (nội dung đã sửa): q-devops-13 (9 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/q-devops-13.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/q-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/q-devops-13.en.js` đã cũ: **devops-065, devops-066, devops-067, devops-068, devops-069, devops-070, devops-071, devops-072, devops-073**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/q-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/q-devops-13.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js q-devops-13 → OK; node scripts/validate.js → OK.

## Notes
Reviewed-by: check-i18n (translation, no LLM review)
