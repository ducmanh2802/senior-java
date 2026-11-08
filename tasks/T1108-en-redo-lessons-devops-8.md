# T1108 — Dịch lại (nội dung đã sửa): lessons-devops-8 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/lessons-devops-8.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/lessons-devops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/lessons-devops-8.en.js` đã cũ: **lesson-devops-011**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/lessons-devops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/lessons-devops-8.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js lessons-devops-8 → OK; node scripts/validate.js → OK.

## Notes
Đã dịch lại toàn bộ entry lesson-devops-011 (title, goals, body, exercises, check) sang tiếng Anh dựa trên bản tiếng Việt hiện tại trong js/data/lessons-devops.js. Giữ nguyên key, id, url; code và chuỗi trong code mẫu đã dịch sang tiếng Anh. check-i18n và validate đều OK. Không sửa file nào ngoài js/i18n/lessons-devops-8.en.js.
Reviewed-by: check-i18n (translation, no LLM review)
