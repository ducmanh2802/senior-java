# T1231 — Dịch lại (nội dung đã sửa): quiz-java-7 (4 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-7.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-java-7.en.js` đã cũ: **qz-modern-025, qz-jvm-025, qz-jvm-026, qz-concurrency-027**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-java-7.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-java-7 → OK; node scripts/validate.js → OK (lưu ý dưới).

## Notes
- Đã dịch lại 4 mục (qz-modern-025, qz-jvm-025, qz-jvm-026, qz-concurrency-027) từ bản tiếng Việt hiện tại trong js/data/quiz-java.js sang tiếng Anh, thay toàn bộ entry cũ trong js/i18n/quiz-java-7.en.js (giữ nguyên key và tập field).
- `node --check js/i18n/quiz-java-7.en.js`: OK.
- `node scripts/check-i18n.js quiz-java-7`: OK — 15 mục đã dịch.
- `node scripts/validate.js`: báo lỗi nhưng toàn bộ nằm ở files không thuộc task này (lessons-sql.js, lessons-api.js, projects.js, path.js — id related/api không tồn tại), không liên quan đến thay đổi quiz. Theo luật AGENTS.md mục 3 không được sửa file của task khác, nên để lại cho integrator/task sở hữu file đó. Không có lỗi mới nào gây ra từ quiz-java-7.en.js.
Reviewed-by: check-i18n (translation, no LLM review)
