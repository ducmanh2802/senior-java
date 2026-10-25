# T288 — Dashboard: "Hôm nay học gì" (kế hoạch 60–90 phút)

Status: TODO
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
