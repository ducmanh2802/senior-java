# T1232 — Dịch lại (nội dung đã sửa): quiz-ops-1 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-ops-1.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz-ops.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-ops-1.en.js` đã cũ: **qz-devops-022**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz-ops.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-ops-1.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-ops-1 → OK; node scripts/validate.js → OK.

## Notes
Done: re-translated qz-devops-022 in js/i18n/quiz-ops-1.en.js; check-i18n OK. Validate has pre-existing errors in api/lessons/path (not owned).
