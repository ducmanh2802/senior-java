# T289 — Câu hỏi phỏng vấn liên quan hiện ngay tại chỗ (dùng chung mọi màn)

Status: TODO
Agent: opencode
Owns: `js/core/related.js`, `css/related.css`, `js/views/learn.js`, `js/views/path.js`, `js/views/labs.js`, `js/core/glossary.js`

Người học đang đọc bài học / thuật ngữ / lab muốn xem luôn câu phỏng vấn liên quan **mà không rời trang**. Đọc AGENTS.md mục 4, 5, 7 và stub `js/core/related.js` (đã gắn index.html sau `js/core/news.js`, css `css/related.css` sau glossary.css).

1. `js/core/related.js` — `App.ui.relatedQuestions({ ids, topic, tags, text, limit = 5, title })` trả HTML (`''` nếu không có câu nào):
   - Lấy câu theo `ids` (giữ thứ tự) trước; nếu thiếu tới `limit` thì gợi ý thêm từ `App.questions()`: cùng `topic` và trùng `tags` (không phân biệt hoa thường), hoặc `q`/`tags` chứa từ khoá trong `text` (cụm ≥ 4 ký tự). Không trùng, ưu tiên level mid/senior.
   - Mỗi câu là `<details class="rq-item">`: summary gồm `q` (App.md, bỏ thẻ p), badge level, chip trạng thái `App.STATUS`; mở ra: đáp án `App.md(a)`, `follow` (danh sách), nút **Đã thuộc / Cần ôn / Chưa biết** (`data-rq-status`, gọi `App.store.setStatus(id, …)` rồi cập nhật chip tại chỗ), ☆ bookmark (`App.store.toggleBookmark`), link nhỏ "Mở trong ngân hàng câu hỏi" `#/bank/<topic>`. Câu `lang: 'en'` gắn `lang="en"`.
   - Event delegation một lần trên `document` cho `[data-rq-status]`/`[data-rq-bookmark]`. Escape mọi dữ liệu. Chuỗi UI song ngữ qua `App.t` + `App.i18n.add({vi, en})` (key `rq.*`, mặc định title "Câu hỏi phỏng vấn liên quan" / "Related interview questions").
2. `css/related.css`: chỉ biến CSS, dark mode, 360px; mọi selector bắt đầu `.rq-`.
3. Dùng component (chỉ thêm, không đổi logic khác):
   - `learn.js`: thay danh sách link `related` hiện tại bằng `App.ui.relatedQuestions({ ids: l.related, topic: l.track, tags: l.tags, limit: 5 })`.
   - `path.js`: phần "câu chốt chặng" của chặng đang mở dùng component với `ids: stage.questions` (limit = số câu).
   - `labs.js`: cuối bài lab (sau đáp án/feedback) `App.ui.relatedQuestions({ topic theo category: thread→concurrency, gc→jvm, sql→sql, incident→microservices, tags: lab.tags, limit: 4 })`.
   - `glossary.js`: trong modal thêm tối đa 3 câu `App.ui.relatedQuestions({ text: entry.term + ' ' + entry.aliases.join(' '), limit: 3 })` (khi App.ui.relatedQuestions có).
4. `node --check` mọi file + `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
