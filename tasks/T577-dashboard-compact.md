# T577 — Trang chủ gọn, ít DOM, nhanh

Status: TODO
Agent: qoder
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`

Trang chủ (`#/`) hiện dựng 7 khối liền nhau: today-card (pomodoro), hero, interviewPlanCard (form), todayCard (kế hoạch hôm nay), stat-grid, lưới TẤT CẢ chủ đề, lịch sử. Quá dài, phải cuộn nhiều, và dựng HTML lưới chủ đề dù người dùng ít xem.

Hạ tầng đã xong (view nạp lười, xem docs/PERFORMANCE.md); task này chỉ làm **bố cục + DOM** trong 2 file trên.

## Yêu cầu
1. Thứ tự mới: (a) **dải đầu gọn** gộp hero + 4 stat (ring tiến độ nhỏ, 4 số known/review/unknown/unseen, 2 nút chính: Phỏng vấn thử, Flashcard): 1 hàng trên desktop, tối đa 2 hàng ở 360px; (b) **todayCard** (kế hoạch hôm nay) ngay dưới; (c) pomodoro thu nhỏ thành 1 hàng (giờ + nút start/reset) đặt trong header todayCard; (d) các khối còn lại bỏ vào `<details class="dash-more">`: "Kế hoạch phỏng vấn", "Tất cả chủ đề", "Lịch sử".
2. Nội dung trong `<details>` **chỉ dựng HTML lần đầu mở** (sự kiện `toggle`). Nhớ trạng thái mở/đóng từng khối trong `localStorage` (bọc try/catch), mặc định đóng. Nếu kế hoạch phỏng vấn đã có ngày thì hiện 1 dòng "còn N ngày" ở dải đầu.
3. Giữ nguyên mọi chức năng, phím tắt, i18n (thêm key mới vào `App.i18n.add` cả vi và en), cleanup interval.
4. CSS: mọi selector bắt đầu `.view-dashboard`, chỉ dùng biến màu, responsive 360px không cuộn ngang, dark mode.
5. Mục tiêu: chiều cao trang lần đầu khoảng 1.5 màn hình desktop.

## Nghiệm thu
`node --check js/views/dashboard.js`, `node scripts/check-budget.js` → OK, `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + id mới vào Notes.

## Notes
