# T09 — View: Tổng quan (dashboard) + Ngân hàng câu hỏi (bank)

Status: DONE
Agent: cline
Owns: `js/views/dashboard.js`, `js/views/bank.js`, `css/views/dashboard.css`, `css/views/bank.css`

Đọc `AGENTS.md` mục 7 (contract View + App API) và `js/core/app.js`, `css/base.css` trước khi bắt đầu.
Trong lúc bạn làm, dữ liệu câu hỏi có thể chỉ có 1–2 câu (các agent khác đang viết song song).
Code phải chạy được với bất kỳ số lượng câu nào, kể cả 0, và nên hiển thị trạng thái rỗng thân thiện.

> **Quan trọng — giới hạn output:** model của bạn có giới hạn token cho mỗi lượt trả lời. KHÔNG viết cả file trong một lần.
> Hãy tạo file với khung tối thiểu trước, rồi thêm từng hàm/phần bằng nhiều lần edit nhỏ (mỗi lần ≤ 120 dòng).

## dashboard (`#/`)
1. **Hero**: tiêu đề "Ôn luyện phỏng vấn Senior Java", 1 dòng mô tả, nút "Phỏng vấn thử" (primary → `#/mock`)
   và "Ôn flashcard" (→ `#/flash`). Bên phải là vòng tròn tiến độ SVG thể hiện % câu "Đã thuộc" trên tổng số câu.
2. **4 ô thống kê** (`.stat`): Đã thuộc / Cần ôn / Chưa biết / Chưa học, lấy từ `App.stats()`.
3. **Chủ đề theo nhóm** (`topic.group`): mỗi topic là một card gồm icon, tên, "x/y đã thuộc", thanh `.progress` nhiều màu
   (ok/warn/bad), và 2 link "Câu hỏi" (`#/bank/<id>`) + "Flashcard" (`#/flash/<id>`).
4. **Kế hoạch hôm nay** (đặt ngay dưới hero, nổi bật nhất):
   - "N câu/bài đến hạn ôn lại" từ `App.dueItems()` (spaced repetition), nút "Ôn ngay" → `#/flash/due`.
   - Tuần hiện tại của lộ trình (`window.ROADMAP` + `App.store.data.roadmap.start`): tiêu đề tuần, số việc đã xong, link `#/roadmap`.
     Nếu chưa đặt ngày bắt đầu thì hiện nút "Bắt đầu lộ trình 6 tháng" → `#/roadmap`.
   - Hôm nay đã làm: `App.store.day()` (số câu đã ôn, phút học) + 🔥 streak `App.store.streak()`.
   - Nếu không có gì đến hạn thì gợi ý topic có tiến độ thấp nhất.
5. **Lịch sử gần đây**: 5 lần gần nhất từ `App.store.data.mockHistory` và `quizHistory` (ngày, số câu, điểm).
   Nếu chưa có thì hiển thị trạng thái rỗng.

## bank (`#/bank` và `#/bank/<topicId>`)
1. `.page-head`: tiêu đề + số câu đang hiển thị.
2. **Thanh lọc**: ô tìm kiếm (debounce 150ms, phím `/` để focus), chips chọn topic ("Tất cả" + từng topic, đồng bộ với
   param URL qua `history.replaceState`, không re-render toàn trang), select level (`App.LEVELS`),
   chips trạng thái (Tất cả / Đến hạn ôn / Chưa học / Chưa biết / Cần ôn / Đã thuộc / Đã đánh dấu). Mỗi card hiển thị nhỏ "ôn lại: dd/mm" từ `getDue`.
   Khi đổi filter thì chỉ re-render danh sách, giữ nguyên focus ở ô search.
3. **Danh sách câu hỏi**: mỗi câu là một card thu gọn gồm số thứ tự, câu hỏi (render bằng `App.md` để `{{code}}` hiển thị đúng),
   badge topic, badge level, dot trạng thái và nút bookmark (★/☆, có `aria-label`).
   Click để mở rộng (accordion, có thể mở nhiều cái cùng lúc). Đáp án chỉ render (`App.md(q.a)`) khi mở lần đầu.
4. Phần mở rộng gồm: đáp án trong `.md`, mục "Interviewer có thể hỏi tiếp" (`follow`), và 3 nút tự đánh giá
   `.btn.ok/.warn/.bad` (Đã thuộc / Cần ôn / Chưa biết). Bấm nút sẽ gọi `App.store.setStatus` và cập nhật dot ngay, không re-render toàn bộ.
5. Nút "Mở tất cả / Thu gọn tất cả". Câu có `lang: 'en'` thì gắn `lang="en"`.
6. Danh sách > 150 câu: render theo trang ("Xem thêm") để giữ DOM nhẹ.

## Notes
(agent ghi chú ở đây)

- [integrator] Agent Cline dừng do hết hạn mức free trước khi tự đánh dấu. View đã được kiểm tra bằng trình duyệt headless (render đủ route, không lỗi console) và chấp nhận; phần còn thiếu do integrator hoàn thiện.
