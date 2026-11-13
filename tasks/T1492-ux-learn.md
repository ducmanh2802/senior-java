# T1492 — UI/UX: cải thiện màn hình Bài học (#/learn)

Status: DONE
Agent: kilo
Owns: `js/views/learn.js`, `css/views/learn.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/learn.js` và `css/views/learn.css` trước khi sửa.

## Trọng tâm
đọc bài dài dễ chịu (độ rộng dòng, mục lục, đánh dấu đã đọc), bài tập và câu kiểm tra dễ tìm.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-learn`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/learn.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes

Đã làm (chỉ 2 file được sở hữu):

1. **Mục lục bài học** (`ln-toc`): sinh từ các heading `### ` của `body`, đánh `id="ln-sec-N"` lên `<h4>` render ra (hàm `addHeadingIds`), bấm là cuộn tới đúng mục (không đổi hash nên không đụng router). Mở sẵn ở màn hình rộng, thu gọn ở mobile; mục đang đọc được tô đậm (`is-current` + `aria-current="location"`).
2. **Thanh tiến độ đọc** (`ln-read`): `role="progressbar"` + phần trăm, cập nhật theo `requestAnimationFrame` khi cuộn; tự nhớ vị trí đọc (`sjp.learn.pos.<lessonId>`) và hiện nút **👇 Đọc tiếp · x%** khi quay lại (xoá khi bấm "Hoàn thành bài").
3. **Thanh điều hướng nhanh** (`ln-jump`): chip **📖 Lý thuyết / 💻 Bài tập (n) / ✅ Kiểm tra nhanh (n) / ❓ Liên quan**, dính (sticky) dưới topbar ở desktop, tĩnh ở ≤ 900px; có `scroll-margin-top` cho mọi đích để topbar không che.
4. **Phím tắt** `T` / `E` / `C` (dùng `App.onKey`, có cleanup) + gợi ý `<kbd>`; `Ctrl+Enter` trong editor giữ nguyên.
5. **Đọc dễ chịu hơn**: giới hạn bề rộng dòng nội dung (`max-width: 78ch` cho `p/ul/ol/h4/blockquote`, bảng và code vẫn rộng hết khung).
6. **Trạng thái rỗng/lỗi**: `#/learn` khi chưa có bài học có nút sang Ngân hàng câu hỏi; route bài không tồn tại có tiêu đề + gợi ý + nút "Về mục lục".
7. **Responsive ≤ 640/380px**: nút ≥ 40–44px, chip giãn hết hàng, mục lục 1 cột, `ln-list` gọn lại; `aria-live="polite"` cho vùng chấm AI / kết quả test / giải thích; `aria-label` cho nút ↺ reset.

Kiểm tra: `node --check js/views/learn.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`; render thử cả 3 nhánh (mục lục / bài học / không tìm thấy) bằng stub DOM trong Node (không mở trình duyệt), số `id="ln-sec-N"` khớp số heading ở cả 196 bài.

Đề xuất cho file core (không tự sửa):
- `App.md()` không sinh `id` cho heading; nếu nhiều view cần mục lục thì nên thêm tuỳ chọn `App.md(src, { headingIds: 'prefix-' })` để `bank.js`/`learn.js` không phải tự `replace(/<h4>/g)`.
- `css/base.css` nên có token chiều cao topbar (ví dụ `--topbar-h`) để các view sticky (`learn`, `quiz`, `exam`, `interview`, `mock`) không phải hard-code `top: 52/62/64px`.
- `js/core/app.js` `renderView()` luôn `window.scrollTo(0, 0)`; nếu muốn "đọc tiếp" mượt hơn thì cần API cho view báo giữ vị trí cuộn.
Reviewed-by: verify-only (code/UI task)
