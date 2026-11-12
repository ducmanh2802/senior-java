# T1487 — UI/UX: cải thiện màn hình Ngân hàng câu hỏi (#/bank)

Status: DONE
Agent: kilo
Owns: `js/views/bank.js`, `css/views/bank.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/bank.js` và `css/views/bank.css` trước khi sửa.

## Trọng tâm
đọc đáp án dài dễ chịu (mục lục nhảy tới các ### trong đáp án, nút thu gọn/mở rộng, nhớ vị trí đang đọc), bộ lọc gọn trên mobile.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-bank`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/bank.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes
- Cải tiến đã làm (`js/views/bank.js`, `css/views/bank.css`):
  1. **Mục lục (TOC) cho đáp án dài:** trích các mục `###` từ markup, render nav nhảy tới từng mục; gắn id ổn định cho heading `<h4>` trong đáp án đã render để cuộn mượt.
  2. **Thu gọn/mở rộng thân đáp án:** nút toggle (mặc định mở), trạng thái thu gọn có hiệu ứng mờ cuối để đọc dài dễ chịu hơn, không mất nội dung.
  3. **Nhớ vị trí đang đọc/tiếp tục đọc:** lưu câu hỏi đang mở vào localStorage (`sjp.bank.readPos`), hiển thị banner "Tiếp tục đọc" với nút Mở lại/Ẩn; mở lại sẽ tự bung phân trang và cuộn tới câu.
  4. **Bộ lọc gọn trên mobile:** nhóm chip chủ đề/trạng thái thu gọn sau nút "Bộ lọc" (≤720px) kèm badge "đang lọc"; trên desktop vẫn hiển thị đầy đủ.
  5. **Trạng thái rỗng + hành động:** empty state có nút "Xoá bộ lọc" để reset nhanh về mặc định.
  6. **Phím tắt + accessibility + responsive:** `App.onKey` với `<kbd>` gợi ý (`/` tìm kiếm, `E` mở/thu gọn tất cả, `F` bộ lọc), cleanup khi rời view; focus-visible rõ, aria-label/aria-expanded giữ đúng; target chạm ≥40px, bảng/code trong đáp án cuộn ngang trong khung, bố cục ổn tới 360px. Selector CSS đều bắt đầu `.view-bank`, chỉ dùng biến CSS.
- Kiểm tra: `node --check js/views/bank.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (còn warning sẵn có: `path.js: có 1 bài học không nằm trong PATH: lesson-design-007`).
- Không đổi dữ liệu/API `App.*`, không xoá tính năng hiện có. Không git commit.
- Đề xuất (core, **không tự sửa**): `App.md()` hiện render `###` thành `<h4>` không có id; nếu core hỗ trợ sinh id/anchor cho heading thì TOC sẽ bền hơn và tái dùng được cho các view khác. Có thể cân nhắc expose helper cuộn/restore scroll vị trí đọc dùng chung nếu nhiều view cần.
Reviewed-by: verify-only (code/UI task)
