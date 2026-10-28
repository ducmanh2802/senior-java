# T323 — Đưa bài nháp lesson-ai-001 vào lessons-ai.js

Status: TODO
Agent: opencode
Owns: `js/data/lessons-ai.js`, `docs/drafts/lesson-ai-001.js.txt`
After: T302

`docs/drafts/lesson-ai-001.js.txt` là một bài học viết tay (AI Engineering Foundations) chưa từng được nạp vì 2 lỗi:
- Hỏng cú pháp: có ký tự backtick nằm trong template literal (ví dụ `Authorization: Bearer <key>` ở khoảng dòng 40, và lỗi ở khoảng dòng 54).
- Sai quy ước: bài thuộc track `ai` phải nằm trong `js/data/lessons-ai.js`.

1. Đọc AGENTS.md mục 5 và 12. Chuyển bài này vào `push(...)` của `js/data/lessons-ai.js`:
   - `id` mới không trùng: `lesson-ai-NNN` với NNN tiếp số lớn nhất trong file; `order` tiếp số lớn nhất.
   - Thay mọi inline code dạng backtick bằng `{{code}}`. Không để `${` không escape.
   - Giữ nguyên nội dung chuyên môn, chỉ sửa định dạng và lỗi kỹ thuật rõ ràng.
2. Bài tập phải chạy được: `node scripts/test-lessons.js` (reference pass 100%, starter không pass hết). Bài tập không đạt mà không sửa được thì bỏ bài tập đó và ghi vào Notes.
3. Sau khi chuyển xong, xoá `docs/drafts/lesson-ai-001.js.txt`. Giữ lại `docs/drafts/lesson-ai-001.en.js.txt` cho task dịch sau và ghi id mới vào Notes.
4. `node scripts/validate.js` → OK. Ghi Notes, `Status: DONE`.

## Notes

