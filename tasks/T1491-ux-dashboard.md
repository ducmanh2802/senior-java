# T1491 — UI/UX: cải thiện màn hình Dashboard (#/dashboard)

Status: DONE
Agent: kilo
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/dashboard.js` và `css/views/dashboard.css` trước khi sửa.

## Trọng tâm
 người mở app biết ngay hôm nay cần làm gì (1 nút hành động chính), thống kê gọn, không quá tải thông tin trên mobile.

## Checklist chung (làm những mục cònmissing, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-dashboard`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/dashboard.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes
- Đã thực hiện 6 cải tiến UI/UX:
  1. Thêm `db-quick` tiles (4 lối vào nhanh: Ôn đến limit, Phỏng vấn AI, SDLC, Roadmap) — CSS đã có nhưng JS chưa render; giờ render đầy đủ.
  2. Thêm loading/empty/error states: `db-empty` (khi `App.stats()` throw), `db-loading` spinner, và hint `<kbd>N</kbd>` cho nút "Bắt đầu".
  3. Cải tiến responsive: breakpoint 420px thêm `db-quick` 1 cột, `db-sec` padding giảm, `db-days` chỉ 7 ngày trên mobile; `.db-table-wrap` cuộn ngang riêng.
  4. Touch targets: tất cả nút `.btn` trong dashboard có `min-height: 36px`, checkbox `.db-check` `min-block-size: 28px`.
  5. Focus-visible: `.db-tile`, `.db-sec`, `.db-day` có outline rõ; `.db-task-body` `scroll-margin` để focus không bị che.
  6. Section cards phân biệt màu theo group: learn (ok/info), practice (warn/accent-2), interview (accent-2/accent), career (info/ok) — thay vì dùng chung `--accent`.
- `node --check js/views/dashboard.js` → OK.
- `node scripts/validate.js` → `OK — không có lỗi.`
- Đề xuất cho core: không cần đổi file core nào. Nếu sau này thêm view khác, nên chuẩn hóa error boundary chung (hiện tại mỗi view tự bọc try/catch).
Reviewed-by: verify-only (code/UI task)
