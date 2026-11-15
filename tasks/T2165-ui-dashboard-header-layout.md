# T2165 — [GẤP] Dashboard: phần đầu trang bị lệch (hero bị bóp hẹp, khoảng trống lớn bên phải)

Status: DONE
Agent: kilo
Owns: `css/views/dashboard.css`, `js/views/dashboard.js`

## Lỗi người dùng báo (ảnh chụp desktop ~1190px, dark mode)
- Thẻ hero ("Chào buổi sáng" + câu quote + đếm ngược phỏng vấn) bị dồn vào **cột trái hẹp ~360px**: chữ quote xuống 4 dòng, khối đếm ngược "104 ngày… GoTymeX" bị ép thành cột chữ dọc, số "104" bị cắt, hình minh hoạ (.db-hero-art) đè ra mép.
- 3 thẻ số liệu (🔥 chuỗi, ⏱️ phút, ✅ câu đã thuộc) chiếm **cả phần bên phải**, bên dưới là khoảng trống đen lớn.

## Nguyên nhân khả nghi
`css/views/dashboard.css` dòng 6: `.view-dashboard .db-compact-header { display: grid; grid-template-columns: 1fr auto; … }` — cột `auto` chứa `.db-metrics` (grid 3 cột `1fr`) giãn theo max-content nên ăn hết chiều ngang, cột hero `1fr` chỉ còn phần thừa. Hero bên trong lại là grid `1fr auto auto` nên càng bị ép.

## Việc cần làm
1. Sửa bố cục header: hero chiếm **toàn bộ chiều ngang** ở hàng trên, 3 thẻ số liệu thành **một hàng 3 cột bên dưới** (hoặc hero ~2/3 + metrics xếp dọc ~1/3, miễn là cân đối, không còn khoảng trống). Ví dụ: `grid-template-columns: 1fr` cho `.db-compact-header`, `.db-metrics` giữ `repeat(3, minmax(0, 1fr))`.
2. Trong hero: khối đếm ngược (số ngày + dòng mô tả + nút Sửa) không bị ép thành cột chữ dọc; số ngày không bị cắt; `.db-hero-art` không tràn ra ngoài thẻ (ẩn ở màn hình hẹp như media query hiện có).
3. Kiểm tra cả 3 mức: desktop 1200px+, tablet ~800px, mobile 360px (không tràn ngang). Light + dark.
4. Chỉ sửa CSS là chính; chỉ đụng `js/views/dashboard.js` nếu markup thật sự cần đổi class. Selector bắt đầu bằng `.view-dashboard`, chỉ dùng biến màu.

## Luật
- Đọc AGENTS.md mục 2, 3, 7. Không sửa css/base.css, js/core/*. Không mở trình duyệt. Không commit.

## Nghiệm thu
`node --check js/views/dashboard.js`; `node scripts/validate.js` → `OK — không có lỗi.` Xong: `Status: DONE`, Notes mô tả bố cục mới cho từng breakpoint.

## Notes

Sửa chỉ trong `css/views/dashboard.css` (`js/views/dashboard.js` không cần đổi — markup giữ nguyên).
- `.view-dashboard .db-compact-header`: `grid-template-columns: 1fr` (bỏ `1fr auto` khiến `.db-metrics` giãn max-content bóp hero). Hero chiếm toàn bộ chiều ngang hàng trên; `.db-metrics` nằm hàng dưới, giữ `repeat(3, minmax(0, 1fr))` → 3 thẻ số liệu cân đối, không còn khoảng trống bên phải.
- `.view-dashboard .db-hero`: `grid-template-columns: minmax(0, 1fr) auto auto` cho phép khối hero chính co lại thay vì bị ép; `.db-hero-ring` thêm `justify-self: center`; `.db-goal` thêm `flex-wrap: wrap` để số ngày + mô tả + nút Sửa không thành cột chữ dọc, số ngày không bị cắt.
- `.view-dashboard .db-metric`: thêm `min-width: 0` để co an toàn theo cột cha.
- Breakpoints: desktop 1200px+ — hero đầy rộng (chủ trích + minh hoạ + vòng độ sẵn sàng cùng hàng), 3 thẻ số liệu dưới dạng hàng 3 cột; tablet ~800px (≤980px) — hero xếp dọc `1fr`, ẩn `.db-hero-art`, vòng đếm ngược căn giữa trong ô rộng, 3 thẻ số liệu vẫn 3 cột; mobile 360px (≤760px) — header và metrics đều `1fr` stacking, không tràn ngang. Light + dark dùng biến màu cơ sở, không hard-code màu.
Reviewed-by: verify-only (code/UI task)
