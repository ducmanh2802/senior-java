# T1498 — UI/UX: cải thiện màn hình Thi thử (#/exam)

Status: DONE
Agent: kilo
Owns: `js/views/exam.js`, `css/views/exam.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/exam.js` và `css/views/exam.css` trước khi sửa.

## Trọng tâm
đồng hồ, tiến độ, đánh dấu câu để xem lại, màn hình kết quả có phân tích theo chủ đề.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-exam`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/exam.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes
Reviewed-by: verify-only (code/UI task)
