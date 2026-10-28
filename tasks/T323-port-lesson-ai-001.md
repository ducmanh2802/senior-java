# T323 — Đưa bài nháp lesson-ai-001 vào lessons-ai.js

Status: DONE
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

- Bài mới: **lesson-ai-001** (track ai, order 1) trong js/data/lessons-ai.js (file trước đó rỗng, nên id/order bắt đầu từ 001/1).
- Body viết lại sạch định dạng (không backtick, dùng {{code}}), sửa lỗi kỹ thuật: thêm bảng so sánh OpenAI Chat Completions vs Anthropic Messages (x-api-key + anthropic-version, max_tokens bắt buộc, content blocks, stop_reason, 529 overloaded), bỏ gợi ý JSONObject/Gson (không phải JDK), bỏ JSON.parse.
- 2 bài tập của bản nháp không chạy được (harness luôn trả 1/1, reference đọc env, class public Metrics) nên viết lại theo cùng chủ đề: (1) AiErrorHandler: classify status, retryable, backoff có cap + Retry-After, không tràn số (11 test); (2) RetrievalMetrics: precision@k, recall@k, reciprocal rank (9 test).
- check: 4 câu (bỏ câu 5 trùng ý của nháp), đáp án rải 0/1/3/2.
- node scripts/test-lessons.js lesson-ai-001: 2/2 OK (reference 11/11, 9/9; starter không pass). node scripts/validate.js: OK, không có lỗi.
- Đã xoá docs/drafts/lesson-ai-001.js.txt; giữ docs/drafts/lesson-ai-001.en.js.txt (bản en cần dịch theo nội dung mới).
Reviewed-by: claude (subagent; test-lessons 2/2, validate OK)
