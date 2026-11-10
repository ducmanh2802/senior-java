# T1230 — Dịch lại (nội dung đã sửa): quiz-java-6 (1 mục)

Status: DONE
Agent: opencode
Owns: `js/i18n/quiz-java-6.en.js`

Nội dung tiếng Việt của các mục sau trong `js/data/quiz-java.js` đã được sửa SAU khi dịch, nên bản tiếng Anh trong `js/i18n/quiz-java-6.en.js` đã cũ: **qz-jvm-024**.

Với MỖI mục trên: đọc bản tiếng Việt hiện tại trong `js/data/quiz-java.js` và DỊCH LẠI toàn bộ entry của nó trong `js/i18n/quiz-java-6.en.js` (thay entry cũ, giữ nguyên key, cùng tập field như các entry khác). Không đụng các mục khác. Code, id, url giữ nguyên; chuỗi tiếng Việt trong code mẫu cũng dịch sang tiếng Anh.
Đọc AGENTS.md mục 5 (markup: không backtick, không `${`).

## Nghiệm thu
node scripts/check-i18n.js quiz-java-6 → OK; node scripts/validate.js → OK.

## Notes
- Re-translated `qz-jvm-024` in `js/i18n/quiz-java-6.en.js` to match current Vietnamese source (`js/data/quiz-java.js` ~2879), keeping key/fields identical (`q`, `options`, `explain`). Explained terms for 4-year-dev/new-to-ops audience (OOM, RSS, GC, JIT, HotSpot, cache line, compressed oops, off-heap/ZGC/MAT) step-by-step (what → why → mechanism/table → verify/fix → wrong options → senior tip). Preserved `{{...}}` markup and `~~~text` block; no backticks, no `${`.
- `node scripts/check-i18n.js quiz-java-6` → OK (6 mục đã dịch). `node scripts/validate.js` still reports pre-existing errors unrelated to this file (missing `api-*` IDs in `lessons-sql/api.js`, `projects.js`, `path.js`); no errors from `quiz-java-6.en.js`.
Reviewed-by: check-i18n (translation, no LLM review)
