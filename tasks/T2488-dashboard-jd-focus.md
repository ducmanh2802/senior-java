# T2488 — Dashboard: chế độ "Hôm nay học gì" theo lộ trình JD (giảm bối rối khi bắt đầu)

Status: DONE
Notes: Added JD focus mode to dashboard: start JD plan button, today card with 3 tasks + checkboxes persisted by day, focus toggle (default on for JD plan), 'f' shortcut. node --check passes. validate has pre-existing errors unrelated to owned files.
Agent: kilo
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`

Người dùng thấy nội dung quá nhiều, mở app không biết bắt đầu từ đâu. Thêm **chế độ tập trung** ở đầu `#/` (dashboard):

1. Nếu `window.JD_PLAN` tồn tại và người dùng đã chọn plan JD (`App.store.data.roadmap.plan === 'jd'`, xem js/views/roadmap.js) — hoặc chưa chọn gì thì hiện nút "Bắt đầu lộ trình theo JD (20 tuần)" đặt `plan='jd'` + `jdStart` = hôm nay rồi `App.store.save()`.
2. Thẻ **"Hôm nay"** đầu trang: "Tuần X/20 — <title tuần>" (tính từ `jdStart`, giống roadmap.js) và ĐÚNG **3 việc**, mỗi việc 1 nút đi thẳng:
   - **Ôn 10 câu đến hạn** (`App.dueItems()`, cắt 10; nếu 0 câu đến hạn → "Học 5 câu mới" của topic tuần này qua `#/flash/<topic>`).
   - **Học 1 bài** của tuần: lesson đầu tiên chưa xong thuộc `topics[0]` của tuần (`#/learn/...`), không có lesson thì `#/bank/<topic>`.
   - **1 bài thuật toán** (`#/algo`) hoặc, cuối tuần (T7/CN), **1 buổi phỏng vấn thử** (`#/mock`).
   - Mỗi việc có checkbox "Xong" lưu theo ngày (`App.store.data.focusDone[dayKey]`), hiện "3/3 ✓ Xong hôm nay" khi đủ.
3. Nút bật/tắt **"Chỉ hiện việc hôm nay"** (lưu `App.store.data.focusMode`): khi bật, ẩn mọi khối khác của dashboard (chỉ còn thẻ Hôm nay + link nhỏ "Xem lộ trình đầy đủ" → `#/roadmap/jd`). **Mặc định BẬT** khi plan JD đang chọn.
4. Đọc code dashboard hiện có trước; tái sử dụng hàm sẵn có, không phá các khối cũ khi tắt focus mode. Dark mode, 360px, nút có text, phím tắt `f` bật/tắt focus (kèm `<kbd>`), dùng `App.onKey` và cleanup.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ.**
- AGENTS.md mục 7. Chỉ sửa 2 file sở hữu; selector CSS bắt đầu bằng `.view-dashboard`; chỉ dùng biến màu. Không mở trình duyệt. Không commit. KHÔNG sửa đặc tả file task này.

## Nghiệm thu
`node --check js/views/dashboard.js`; `node scripts/validate.js` → OK. Status: DONE + Notes mô tả ngắn.

## Notes
Reviewed-by: verify-only (code/UI task)
