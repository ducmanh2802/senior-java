# T17 — View: Lộ trình 6 tháng + nhật ký học hằng ngày

Status: TODO
Agent: cline
Owns: `js/views/roadmap.js`, `css/views/roadmap.css`

Đọc `AGENTS.md` mục 7 (đặc biệt các API SRS và nhật ký), `js/core/app.js`, `css/base.css` và **`js/data/roadmap.js`** (dữ liệu `window.ROADMAP`).
Mục tiêu người dùng: phỏng vấn đậu Senior Java ở ngân hàng / big tech Việt Nam sau 6 tháng.

## `#/roadmap`
1. **Header**: `ROADMAP.goal`. Nếu `App.store.data.roadmap.start` chưa có, hiển thị ô chọn ngày (`<input type="date">`, mặc định hôm nay)
   và nút "Bắt đầu lộ trình". Đã có thì hiển thị "Tuần X / 26", số ngày còn lại tới mốc 6 tháng, kèm nút nhỏ "Đổi ngày bắt đầu".
   Tuần hiện tại = `floor((startOfDay(now) - start) / (7 * DAY)) + 1`, giới hạn trong khoảng 1..26.
2. **Hôm nay** (card nổi bật):
   - Số câu/bài đến hạn ôn lại (`App.dueItems()`), tách theo câu hỏi và bài thuật toán (`id` bắt đầu `algo-`).
     Kèm nút "Ôn câu hỏi" → `#/flash/due` và "Giải lại bài" → `#/algo`.
     Kèm một dòng giải thích ngắn về **lặp lại ngắt quãng**: chấm "Chưa biết" thì câu quay lại ngày mai, "Cần ôn" sau 2+ ngày,
     "Đã thuộc" thì giãn dần 3 → 8 → 20+ ngày, nên câu chưa vững sẽ được lặp lại cho tới khi vững.
   - Việc của tuần hiện tại (checklist, xem mục 4) và mục tiêu thuật toán của tuần (`week.algo`).
   - Hôm nay đã làm (`App.store.day()`): câu đã ôn, đã thuộc, quiz, mock, bài thuật toán, phút học. Kèm 🔥 streak (`App.store.streak()`).
3. **Nhật ký học (heatmap)**: lưới kiểu GitHub cho 26 tuần gần nhất (hoặc kể từ ngày bắt đầu). Mỗi ô là một ngày, màu đậm dần theo
   `review + 3*quiz + 5*mock + 3*algo` (dùng `color-mix` với `--accent`). Hover/tap hiển thị chi tiết ngày đó.
   Bên dưới là bảng 14 ngày gần nhất: ngày, câu ôn, đã thuộc, quiz, mock, thuật toán, phút.
   Thêm ô "Ghi chú hôm nay" (textarea): lưu vào `App.store.data.daily[dayKey].note` rồi gọi `App.store.save()`, và hiện lại trong bảng.
4. **Lộ trình**: `ROADMAP.phases` → các tuần. Mỗi tuần là một card có thể thu gọn, gồm: số tuần, tiêu đề, chips topic
   (link `#/bank/<topic>`, tên từ `App.topic`), mục tiêu thuật toán, checklist `tasks`
   (checkbox lưu `App.store.data.roadmap.done['<weekId>-<i>'] = true`, rồi `App.store.save()`), và % hoàn thành.
   Tuần hiện tại được mở sẵn và highlight; tuần đã qua mà chưa xong 100% thì gắn badge "còn nợ".
   Thanh tiến độ tổng của từng giai đoạn.
5. **Mục tiêu & dự án**: card hiển thị `ROADMAP.targets` (ngân hàng vs big tech: ví dụ công ty + trọng tâm) và `ROADMAP.project`.
6. Responsive tới 360px; heatmap cuộn ngang được trên mobile.

## Notes
(agent ghi chú ở đây)
