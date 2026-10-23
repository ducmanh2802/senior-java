# T15 — View: Luyện thuật toán (algo)

Status: DONE
Agent: cline
Owns: `js/views/algo.js`, `css/views/algo.css`

Đọc `AGENTS.md` mục 4 (schema `ALGOS`) và mục 7, cùng `js/core/app.js` và `css/base.css` trước khi bắt đầu.
Dữ liệu lấy từ `App.algos()`. Lúc bạn làm có thể chỉ có 1 bài mẫu (`algo-001`), vì agent khác đang viết thêm.
Tiến độ của từng bài lưu bằng `App.store.setStatus(algo.id, …)`. ID dạng `algo-NNN` nên không đụng với câu hỏi.

> **Quan trọng — giới hạn output:** model của bạn có giới hạn token cho mỗi lượt trả lời. KHÔNG viết cả file trong một lần.
> Hãy tạo file với khung tối thiểu trước, rồi thêm từng hàm/phần bằng nhiều lần edit nhỏ (mỗi lần ≤ 120 dòng).

## `#/algo` — danh sách bài
- `.page-head` hiển thị số bài đã giải / tổng, kèm thanh `.progress`.
- Bộ lọc: tìm kiếm theo tên/tag, chips độ khó (Easy/Medium/Hard, màu ok/warn/bad), chips pattern (sinh từ dữ liệu),
  chips trạng thái (Chưa làm / Đã giải / Cần làm lại).
- Bảng/list: trạng thái, tên, độ khó, pattern. Click mở `#/algo/<id>`. Nút "Bài ngẫu nhiên" chọn ngẫu nhiên trong các bài chưa giải đang lọc.

## `#/algo/<id>` — màn luyện
Layout 2 cột trên desktop (≥ 960px), 1 cột trên mobile:
- **Trái**: tên, badge độ khó + pattern, `App.md(prompt)`.
  Mục **Gợi ý**: mở từng hint một ("Gợi ý 1/3" → bấm để hiện hint tiếp theo).
- **Phải**: editor code
  - `<textarea>` font mono, `spellcheck="false"`. Phím `Tab` chèn 4 space (không làm mất focus).
    Tự thụt dòng khi Enter (giữ indent của dòng trước). Có số dòng nếu làm được gọn, không bắt buộc.
  - Template khởi đầu: `class Solution {\n    \n}`.
  - Code nháp lưu theo từng bài trong `localStorage` key `sjp.algo.<id>` (bọc try/catch).
  - Đồng hồ bấm giờ (start/pause/reset) và chọn mục tiêu 15/25/45 phút. Quá mục tiêu thì đổi màu.
  - Nút "Xem lời giải" có confirm nếu chưa dùng hết gợi ý. Lời giải hiện `App.md(solution)`, `complexity` và `follow`.
  - Đánh dấu: "Đã giải" (`known`), "Giải được nhưng cần ôn" (`review`), "Chưa giải được" (`unknown`). Đồng thời gọi `App.store.log('algo')`.
    `setStatus` tự lên lịch giải lại (spaced repetition). Danh sách có thêm chip trạng thái "Đến hạn giải lại" (`App.store.isDue`).
  - Nút "Sao chép code" ra clipboard.
- Điều hướng bài trước/sau trong danh sách đang lọc; phím tắt `H` (gợi ý tiếp), `S` (lời giải) khi không gõ trong editor.
- Không chạy được Java trong trình duyệt. Ghi rõ dòng nhỏ: "Viết ra giấy/editor như phỏng vấn thật, sau đó so với lời giải".
- Cleanup interval/key handler khi rời view.

## Notes
(agent ghi chú ở đây)

- [integrator] Agent Cline dừng do hết hạn mức free trước khi tự đánh dấu. View đã được kiểm tra bằng trình duyệt headless (render đủ route, không lỗi console) và chấp nhận; phần còn thiếu do integrator hoàn thiện.
Reviewed-by: codex (T15R)
