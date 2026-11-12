# T1490 — UI/UX: cải thiện màn hình Luyện nói tiếng Anh (#/speak)

Status: DONE
Agent: kilo
Owns: `js/views/speak.js`, `css/views/speak.css`

Người dùng là dev Java tự ôn phỏng vấn mỗi ngày, trên laptop và điện thoại. Nội dung đã nhiều; giờ cần **dùng sướng hơn**. Đọc AGENTS.md (mục 2, 7, 9) rồi đọc kỹ `js/views/speak.js` và `css/views/speak.css` trước khi sửa.

## Trọng tâm
luồng tập nói rõ ràng từng bước (nghe mẫu → nói → xem kết quả), trạng thái ghi âm dễ thấy, cỡ chữ đọc thoải mái khi shadowing.

## Checklist chung (làm những mục còn thiếu, mục nào đã tốt thì bỏ qua)
- Responsive tới 360px: không tràn ngang, nút đủ lớn để chạm (≥ 40px), bảng/code cuộn ngang trong khung riêng.
- Trạng thái rỗng (empty), đang tải, lỗi: có thông báo thân thiện và hành động tiếp theo.
- Phím tắt có gợi ý `<kbd>`; nút có text hoặc `aria-label`; focus nhìn thấy được.
- Chỉ dùng màu qua biến CSS (dark mode); selector CSS bắt đầu bằng `.view-speak`.
- Không đổi dữ liệu, không đổi API `App.*`, không xoá tính năng đang có.

## Luật
- Chỉ sửa 2 file của task. Cần sửa `js/core/*`, `css/base.css`, `index.html` thì **ghi đề xuất vào ## Notes**, không tự sửa.
- Không mở trình duyệt. Kiểm tra: `node --check js/views/speak.js` và `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Thay đổi vừa phải (ưu tiên 3–6 cải tiến rõ ràng), không viết lại cả màn hình.
- Xong: `Status: TODO` → `Status: DONE`; ghi Notes: danh sách cải tiến đã làm + đề xuất cho file core (nếu có).

## Notes

### Cải tiến đã thực hiện (js/views/speak.js):
1. **Phím tắt mở rộng**: Thêm `P` (câu trước), `A` (bật/tắt Auto mode) vào gợi ý `<kbd>` và handler `onKey`.
2. **aria-label cho mọi nút**: Tất cả nút bấm đều có `aria-label` phù hợp (listen, record, stop, next, prev, auto, voice preview, toggle text, filters).
3. **Clear filter button**: Nút "Bỏ bộ lọc" xuất hiện ngay trong khu vực filter khi có bộ lọc đang áp dụng (thay vì chỉ ở trạng thái rỗng).
4. **Loading state term audio**: Dùng class `.sp-loading` với spinner CSS thay vì text đơn giản.
5. **Error state thống nhất**: Dùng class `.sp-error` cho lỗi ghi âm/thời gian chờ, có màu sắc rõ ràng.
6. **Empty state đẹp hơn**: Thêm icon 🎙️, căn giữa, padding lớn hơn.
7. **Interim transcript style**: Khung nhập giọng nói có viền nét đứt, nền phân biệt, màu chữ chuyển từ muted sang text khi có nội dung.
8. **Phrases chips**: Badge "used/not used" có màu xanh/đỏ, flex wrap tốt trên mobile.
9. **Assess buttons**: Min-width 72px, flex wrap, aria-pressed cho trạng thái đã chọn.

### Cải tiến đã thực hiện (css/views/speak.css):
1. **Touch targets ≥40px**: Tất cả `.btn`, `.chip`, `.select`, `[data-act]`, `[data-tab]`, `[data-assess]`, `.sp-filter select` có `min-height: 40px; min-width: 40px`.
2. **Focus visible**: Outline 2px accent cho mọi element tương tác khi `:focus-visible`.
3. **Recording state nổi bật**: `.mic-btn.recording` có background `--bad`, chữ trắng, animation pulse 1s; `.sp-rec` có chấm nhấp nháy.
4. **Auto mode indicator**: Chip Auto khi active có background `--accent`, chữ `--accent-contrast`.
5. **Loading spinner**: `.sp-loading::before` animation spin 0.8s.
6. **Error banner**: `.sp-error` với nền `--bad-soft`, viền `--bad`, có nút hành động bên phải.
7. **Voice selector mobile**: `.sp-voice .select` width 100%.
8. **Nav buttons**: Min-width 80px, trên 360px flex 50% mỗi nút.
9. **Assess buttons responsive**: Trên 360px flex 50% mỗi nút.
10. **QA hidden question**: Flex center, height 100%.
11. **Sp-interim styling**: Padding, border dashed, background surface-2, màu chữ tự động.
12. **Responsive 360px**: Controls listen buttons full width, nav/assess buttons 50% width, rate select 100% width.

### Không cần đề xuất cho file core
Reviewed-by: verify-only (code/UI task)
