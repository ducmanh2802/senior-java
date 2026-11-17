# T2337 — Dashboard: thẻ "Đang ôn cho job …" (lộ trình theo JD hôm nay)

Status: DONE
Agent: kilo
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`
After: T2336

## Bối cảnh
T2336 thêm trang `#/jobs/prep/<jobId>`: mỗi job trong `App.store.data.jobs` có thể có `prepDays`, `prepDone` và lộ trình ôn theo JD. Đọc phần đó trong `js/views/jobs.js` trước.

## Việc cần làm
Trên dashboard, nếu có job đang theo dõi có `prepDays` (hoặc có `deadline` trong 30 ngày tới và trạng thái chưa đóng): hiện 1 thẻ nhỏ "🎯 Đang ôn cho: <title> @ <company> — còn N ngày", hôm nay là ngày X/Y của lộ trình, tiến độ % (đếm câu đã known trong kế hoạch nếu dễ lấy; nếu cần dữ liệu câu hỏi mà route dashboard chỉ có light index thì chỉ hiện ngày + số ngày còn lại), nút "Ôn hôm nay" → `#/jobs/prep/<id>`. Nhiều job → job deadline gần nhất, kèm link "xem tất cả" → `#/jobs/mine`.
Không làm vỡ layout hiện có (T2165 đã sửa header). i18n vi/en, escape, CSS prefix `.view-dashboard`, biến màu, 360px.

## Nghiệm thu
`node --check js/views/dashboard.js`, `node scripts/validate.js`, `node scripts/check-budget.js` → OK. Không commit. Status: DONE + Notes.

## Notes

- Thêm thẻ `db-job-prep` vào dashboard (`js/views/dashboard.js` + `css/views/dashboard.css`), chèn sau header (hero + metrics), trước missione hôm nay.
- Job đủ điều kiện hiện thẻ: `prepDays` tồn tại, hoặc `deadline` hợp lệ trong khoảng [0, 30] ngày và `status` không phải `offer`/`rejected`. Nhiều job → sắp xếp theo `daysUntil(deadline)` tăng dần (job không có hạn xếp sau), lấy job gần nhất; hiển thị thêm link "Xem tất cả ({n})" → `#/jobs/mine`.
- Thẻ hiển thị: "🎯 Đang ôn cho: <title> @ <company> — còn N ngày" (nếu không có hạn: "Còn N ngày trong lộ trình"), "Hôm nay là ngày X/Y của lộ trình ôn" (x = ngày đã làm + 1, y = prepDays), progress bar + "% · known/total câu đã thuộc" (tính từ `App.lite('questions')` của light index + `store.getStatus`; nếu không tính được thì "% · done/y ngày đã làm"), nút "Ôn hôm nay" → `#/jobs/prep/<id>`.
- Tất cả chuỗi hiển thị thêm vào `App.i18n.add` (vi/en), dữ liệu gán vào HTML qua `App.esc()`, selector CSS đều bắt đầu bằng `.view-dashboard`, màu dùng biến CSS (`--surface`, `--accent`, `--muted`…), media `@media (max-width: 360px)` cho nút coott full width; tiêu đề thẻ font-size nhỏ hơn trên 360px.
- Kết quả kiểm tra: `node --check js/views/dashboard.js` → OK; `node scripts/validate.js` → "OK — không có lỗi."; `node scripts/check-budget.js` → "OK — không có lỗi." (dashboard tổng 633 KB ≤ budget 1000 KB).
- Không commit, không tạo branch (luật 3-4 AGENTS.md).
- **Deps ngoài quyền sở hữu (ghi nhận cho integrator/T2336):** `js/views/jobs.js` gọi `buildPlan(j)` / `prepProgress(j)` trong `renderPrep` (jobs.js:732-734) nhưng hàm này không tồn tại trong repo (cũng không có ở HEAD), nên nút "Ôn hôm nay" → `#/jobs/prep/<id>` sẽ ném render error được shell bắt và hiển thị thẻ lỗi. Thẻ dashboard tự đứngalone được (tính ngày/tiến độ tự tính từ `j.prepDays`/`j.prepDone`/`j.analysis`), không cần sửa jobs.js để hiển thị thẻ; cần T2336 bổ sung `buildPlan`/`prepProgress` để trang prep chạy sau khi bấm nút.
Reviewed-by: verify-only (code/UI task)
