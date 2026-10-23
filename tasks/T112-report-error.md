# T112 — Nút "Báo sai nội dung" trên câu hỏi, quiz, bài học

Status: DONE
Agent: opencode
Owns: `js/views/bank.js`, `js/views/quiz.js`, `js/views/learn.js`

Đọc AGENTS.md mục 7. Thêm một link nhỏ "🚩 Báo sai" ở cuối đáp án câu hỏi (bank), phần giải thích quiz và cuối bài học. Link mở tab mới tới
`https://github.com/ducmanh2802/senior-java/issues/new?title=<encodeURIComponent('Sai nội dung: ' + id)>&body=<encodeURIComponent('ID: ' + id + '\nTrang: ' + location.href + '\n\nSai ở đâu / nên sửa thế nào:\n')>&labels=content`
(`target="_blank" rel="noopener noreferrer"`, class `btn sm`). Không gọi fetch, không đổi logic khác. Escape bằng App.esc. `node --check` từng file + `node scripts/validate.js` → OK.

## Notes
- Added 🚩 Báo sai link in bank.js answer, quiz.js explain (question + wrong result), learn.js lesson body.
- node --check passed for all 3 files. validate.js reports a pre-existing unrelated error: quiz.js qz-kotlin-001 has backtick (data file not owned by this task).
Reviewed-by: codex (T112R)
