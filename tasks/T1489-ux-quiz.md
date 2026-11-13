# T1489 — UI/UX: cải thiện màn hình Trắc nghiệm (#/quiz)

Status: DONE
Agent: kilo
Owns: `js/views/quiz.js`, `css/views/quiz.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/quiz.js` và `css/views/quiz.css` trước khi sửa.

## Trọng tâm
phản hồi đúng/sai rõ ràng, giải thích dễ đọc, xem lại các câu sai cuối bài, phím tắt 1–4 / Enter.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-quiz`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/quiz.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes

Cải tiến đã làm:
1. **Phản hồi đúng/sai rõ ràng** (quiz.js:questionHtml + quiz.css): thêm banner `quiz-feedback` với màu ok/bad, biểu tượng ✓/✗ và chữ in đậm ngay dưới câu hỏi khi người dùng đã chọn đáp án, ngoài các badge trên từng lựa chọn.
2. **Trạng thái lỗi** (quiz.js:render): bọc render trong try/catch, hiện card thông báo lỗi kèm nút "Tải lại trang" thay để trắng màn hình.
3. **Responsive 360px** (quiz.css): media query mới cho màn hình ≤360px — card padding nhỏ hơn, options font-size 0.95rem, quiz-head xếp dọc, nút actions rộng toàn bộ, result-score nhỏ hơn, bar-row gộp cột.
4. **Nút chạm dễ hơn** (quiz.css): `min-height: 48px` (44px trên 360px) cho `.quiz-opt`, padding lớn hơn, vùng nhấn rõ rệt.
5. **Giải thích dễ đọc** (quiz.css): `.quiz-explain` h4 có margin nền rõ, `.md` trong explain cách trên 6px.

Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng. Selector CSS đều bắt đầu bằng `.view-quiz`, màu chỉ qua biến CSS. `node --check js/views/quiz.js` OK, `node scripts/validate.js` → OK.
Reviewed-by: verify-only (code/UI task)
