# T315 — Khung cho chủ đề Claude Certified Developer – Foundations (CCDV-F)

Status: DONE
Agent: opencode
Owns: `js/data/topics.js`, `index.html`, `js/data/q-claude.js`, `js/data/quiz-claude.js`, `js/data/lessons-claude.js`
After: T299

Integrator cho phép sửa đúng các file trong `Owns`. Chỉ dựng khung, chưa viết nội dung (nội dung do T316–T319 làm).

1. `js/data/topics.js`: thêm topic ngay sau `ai`:
   `{ id: 'claude', name: 'Claude Developer (CCDV-F)', icon: '🟠', group: 'Cloud & AI', file: 'q-claude.js' }`
2. Tạo 3 file data, mỗi file có header comment ghi task sở hữu và một lệnh `push(` rỗng, theo đúng mẫu của file cùng loại:
   - `js/data/q-claude.js`: `(window.QUESTIONS = window.QUESTIONS || []).push(\n);`
   - `js/data/quiz-claude.js`: tương tự với `window.QUIZ`.
   - `js/data/lessons-claude.js`: tương tự với `window.LESSONS`.
3. `index.html`: thêm 3 thẻ script:
   - `q-claude.js` ngay sau `js/data/q-ai.js`.
   - `quiz-claude.js` ngay sau `js/data/quiz.js`.
   - `lessons-claude.js` ngay sau `js/data/lesson-ai-001.js`.
4. Nếu `sw.js` có danh sách precache file data thì ghi đề xuất vào Notes, không sửa.
5. `node scripts/validate.js` → `OK — không có lỗi.` (topic rỗng câu hỏi chỉ được phép là cảnh báo). Ghi Notes, `Status: DONE`.

## Notes
Validation passed: `OK — không có lỗi.` The claude topic shows 0 questions and 0 quiz items (expected warning for empty topic). No changes needed to sw.js (it uses network-first caching, no precache list for data files). All owned files updated successfully.

- Integrator: bỏ dòng scratch-multi.js (file thử của T320) khỏi index.html, sửa comment lỗi mã hoá; validate HEAD+T315 OK.
Reviewed-by: claude (integrator)
