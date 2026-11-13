# T1493 — UI/UX: cải thiện màn hình Phỏng vấn thử (#/mock)

Status: DONE
Agent: kilo
Owns: `js/views/mock.js`, `css/views/mock.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/mock.js` và `css/views/mock.css` trước khi sửa.

## Trọng tâm
các bước của buổi mock rõ ràng, đồng hồ dễ thấy, tổng kết cuối buổi dễ đọc.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-mock`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/mock.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes

Cải tiến đã làm (chỉ 2 file sở hữu: js/views/mock.js, css/views/mock.css; không đụng dữ liệu, không đổi API App.*):
1. Bước trình bày rõ hơn: thêm huy hiệu bước (#mockStep) trong đầu phiên ("Câu hỏi" → "Đang chấm điểm" sau khi có kết quả AI).
2. Đồng hồ dễ thấy hơn: đồng hồ còn lại to hơn (2rem), thêm dòng "Đã dùng X:XX" (#mockElapsed) kèm theo, vẫn đổi màu khi <30s và quá giờ.
3. Tổng kết dễ đọc hơn: thêm thẻ phán xét tổng thể (#mock-verdict, màu theo điểm) ngay dưới tiêu đề; nút "Phỏng vấn lại các câu yếu" làm nổi bật (primary) khi có chủ đề dưới 3 điểm.
4. Phím tắt có gợi ý <kbd>: <kbd>1</kbd>–<kbd>5</kbd> để chấm nhanh (#mockRateHelp, thô không escape vì chuỗi tin cậy), <kbd>S</kbd> xem/ẩn đáp án (#mock-keyhint), nút có aria-label.
5. Responsive 360px + mục chạm ≥44px: media query 380px thiết lập min-height 44px cho nút, xếp dọc đồng hồ, giảm cỡ chữ; min-width:0 cho flex đầu/trang trị để không tràn ngang; :focus-visible rõ ràng; mọi màu qua biến CSS, selector bắt đầu .view-mock.
6. Sửa nhỏ: nhãn preset "Tình huống thực tế" gọi App.t('mock.presetScenario') đã có key.

Không thay đổi file core, css/base.css, index.html. validate.js → OK. Không commit.

Đề xuất cho file core (nếu có): chưa có — mọi thay đổi nằm trong scope 2 file sở hữu.
Reviewed-by: verify-only (code/UI task)
