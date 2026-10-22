# T10 — View: Flashcard (flash) + Trắc nghiệm (quiz)

Status: TODO
Agent: cline
Owns: `js/views/flash.js`, `js/views/quiz.js`, `css/views/flash.css`, `css/views/quiz.css`

Đọc `AGENTS.md` mục 7 và `js/core/app.js`, `css/base.css` trước khi bắt đầu.
Dữ liệu có thể đang rất ít (agent khác viết song song), nên phải xử lý tốt trường hợp 0 hoặc 1 câu.

## flash (`#/flash` và `#/flash/<topicId>`)
1. **Thiết lập** (ở đầu trang, gọn): select topic (Tất cả + từng topic; mặc định lấy từ param), chế độ bộ bài:
   - "Đến hạn ôn (lặp lại ngắt quãng)": chỉ câu có `App.store.isDue(id)`, quá hạn lâu nhất trước. Đây là chế độ mặc định khi route là `#/flash/due`
     hoặc khi có câu đến hạn. Hiển thị dòng giải thích: câu chưa vững sẽ quay lại sau 1–2 ngày, câu đã thuộc giãn dần 3 → 8 → 20+ ngày
   - "Thông minh": Đến hạn → Chưa biết → Chưa học → Cần ôn → Đã thuộc, xáo trộn trong từng nhóm
   - "Chỉ câu chưa thuộc" (unknown + review + unseen), "Đã đánh dấu", "Tất cả (ngẫu nhiên)"
2. **Thẻ**: mặt trước hiển thị topic, level và câu hỏi (cỡ chữ lớn). Bấm "Lật thẻ" (`Space`) để hiện đáp án `App.md(q.a)`
   và danh sách `follow`. Có hiệu ứng lật hoặc fade nhẹ, tôn trọng `prefers-reduced-motion`.
3. **Chấm**: `1` Chưa biết, `2` Cần ôn, `3` Đã thuộc. Mỗi lần chấm gọi `setStatus` (tự lên lịch ôn lại), hiện toast nhỏ "Ôn lại sau N ngày" rồi sang thẻ tiếp. `←`/`→` để điều hướng, `B` để bookmark.
   Hiển thị gợi ý `<kbd>`.
4. **Thanh tiến độ** của phiên (x / N) + đếm số lần chấm từng loại trong phiên.
5. **Hết bộ bài**: tóm tắt phiên và các nút "Ôn lại câu chưa thuộc" / "Bộ bài mới".
6. Thẻ có `lang: 'en'` thì gắn `lang="en"`. Trên mobile, nút chấm phải đủ to để bấm.

## quiz (`#/quiz`)
Dữ liệu: `App.quiz()` (schema ở `AGENTS.md` mục 4).
1. **Màn thiết lập**: chips chọn nhiều topic (mặc định tất cả topic có câu), số câu (10 / 20 / 30 / Tất cả, giới hạn theo số câu hiện có),
   nút Bắt đầu. Hiển thị điểm cao nhất gần đây từ `App.store.data.quizHistory`.
2. **Làm bài**: một câu mỗi màn hình; render `q` bằng `App.md` (vì có thể chứa code block), còn options render bằng `App.md` dạng inline. Options được **xáo trộn** (nhớ map lại index đúng). Phím `1`–`4` để chọn, `Enter` để sang câu tiếp.
   Chọn xong thì khoá lựa chọn, tô đúng/sai (`--ok`/`--bad`) và hiện `App.md(explain)`.
   Header có tiến độ, điểm hiện tại và đồng hồ đếm lên.
3. **Kết quả**: điểm (x/N, %), thời gian, bảng điểm theo topic, danh sách câu sai (câu hỏi, đáp án đúng, giải thích; có thể mở rộng),
   các nút "Làm lại câu sai" / "Bài mới". Gọi `App.store.addQuizResult({ total, correct, topics, seconds })`.
4. Cleanup: dừng interval khi rời view.

## Notes
(agent ghi chú ở đây)
