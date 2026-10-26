# T288 — Dashboard: "Hôm nay học gì" (kế hoạch 60–90 phút)

Status: DONE
Agent: opencode
After: T150
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`

Đọc AGENTS.md mục 7 và `js/views/dashboard.js` hiện tại (đã song ngữ bởi T150 — giữ cách dùng `App.t`). Thêm khối **"Hôm nay học gì"** ở đầu dashboard, ổn định trong ngày (`App.store.data.todayPlan = { day: App.dayKey(), items, done: {} }`, `App.store.save()`):
1. **Ôn đến hạn** — tối đa 10 câu từ `App.dueItems()` (≈ 15') → `#/flash` hoặc `#/bank`.
2. **Bài học tiếp theo** — bài đầu tiên chưa `known` theo thứ tự `window.PATH` (rỗng thì theo `App.lessons()`) (≈ 25') → `#/learn/<id>`.
3. **1 bài thuật toán** — ưu tiên bài đến hạn ôn, không thì bài chưa làm thuộc pattern của tuần hiện tại trong `window.ROADMAP` (field `algo`; tuần tính từ `App.store.data.roadmap.start`, mặc định tuần 1) (≈ 30') → `#/algo/<id>`.
4. **Luyện nói 10'** → `#/speak` (nếu có `window.DRILLS`), không thì 1 câu `lang: 'en'` trong ngân hàng.
5. Thứ 7/CN: thay mục 3 bằng **1 đề system design** `#/sd/<id>` (nếu có `window.SD_PROBLEMS`) hoặc `#/mock`.
Mỗi mục: icon, tiêu đề, thời lượng, nút Bắt đầu, checkbox xong (lưu `done`). Thanh tiến độ hôm nay + tổng phút; nút "Đổi kế hoạch"; nút **▶ Bắt đầu buổi học** chạy đồng hồ 25' kiểu pomodoro (tạm dừng được). Ẩn mục không có dữ liệu.
- **Song ngữ** qua `App.t` + `App.i18n.add`. Escape dữ liệu, CSS chỉ dùng biến, selector `.view-dashboard`, responsive 360px, dark mode. Cleanup interval. `node --check` + `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm khối **"Hôm nay học gì"** ở đầu `dashboard.js`: ôn đến hạn (tối đa 10 câu), bài học tiếp theo theo `window.PATH` → `App.lessons()`, 1 bài thuật toán (ưu tiên due, sau đó theo pattern `algo` của tuần hiện tại), luyện nói 10' (`window.DRILLS`, fallback câu `lang: 'en'`), và thay bài thuật toán bằng system design/mock vào Thứ 7/CN.
- Kế hoạch lưu trong `App.store.data.todayPlan = { day, items, done }`, ổn định trong ngày; nút **Đổi kế hoạch** rebuild từ tiến độ hiện tại, giữ lại `done` của các mục không đổi.
- Có thanh tiến độ theo phút, tổng phút, checkbox xong từng mục, nút **▶ Bắt đầu buổi học** (pomodoro 25', tạm dừng/tiếp tục/đặt lại), cleanup interval khi rời view.
- Toàn bộ chuỗi song ngữ thêm qua `App.i18n.add` + `App.t`; dữ liệu escape bằng `App.esc`; CSS mới nằm trong `css/views/dashboard.css`, mọi selector đều bắt đầu `.view-dashboard`, chỉ dùng biến CSS, có responsive ≤ 520px (tới 360px) và dark mode tự động.
- **Lưu ý cho integrator:** `App.dayKey()` không có tham số trả về `NaN-NaN-NaN` (vì `new Date(undefined)` là Invalid Date), nên đã dùng `App.dayKey(Date.now())`. Nếu muốn API đúng như mô tả task, nên sửa `dayKey` trong `js/core/app.js` thành `function dayKey(ts) { const d = new Date(ts == null ? Date.now() : ts); … }` (file core do integrator sở hữu, không tự sửa).
- Đã kiểm tra: `node --check js/views/dashboard.js` OK, `node scripts/validate.js` → `OK — không có lỗi.`, `node scripts/check-i18n.js` → OK. Ngoài ra đã chạy smoke test logic bằng `scripts/browser-shim.js` (không dùng trình duyệt): plan đủ 4 mục, review cap 10, weekend thay bằng `sd`, fallback tiếng Anh khi không có `DRILLS`, next lesson đúng thứ tự, `done` giữ khi rebuild.
