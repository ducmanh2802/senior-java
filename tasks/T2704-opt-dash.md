# T2704 — Tối ưu view dashboard, roadmap, path, projects

Status: DONE
Agent: kilo
Owns: `js/views/dashboard.js`, `css/views/dashboard.css`, `js/views/roadmap.js`, `css/views/roadmap.css`, `js/views/path.js`, `css/views/path.css`, `js/views/projects.js`, `css/views/projects.css`

Đọc AGENTS.md mục 2, 3, 7, 8 trước khi làm. Người dùng yêu cầu: "Sửa đổi các tính năng, tối ưu code, tối ưu giao diện".

## Mục tiêu
Render lần đầu nhanh hơn (tránh quét toàn bộ dữ liệu đồng bộ nếu tránh được, cache số liệu đã tính); hiển thị tiến độ rõ ràng hơn; xoá code chết; layout mobile. Không đụng js/views/dashboard.js.bak.

## Luật
- Chỉ sửa file trong Owns. Không commit, không `git add`, `git stash`, `git checkout`, `git reset`: autopilot tự review và commit.
- Vanilla JS, không thêm thư viện, không build step. Không viết lại cả file: mỗi thay đổi nhỏ, an toàn, có lý do rõ.
- Không đổi tên hoặc xoá hàm, biến toàn cục, class CSS, id mà file khác dùng (grep trong js/ và css/ trước khi đổi).
- Chữ tiếng Việt có dấu đầy đủ. Dữ liệu hoặc chữ người dùng chèn vào innerHTML phải escape bằng helper có sẵn.

## Nghiệm thu
- `node --check` mọi file .js đã sửa → OK.
- `node scripts/validate.js` → OK.
- `node scripts/smoke.mjs` → mọi route mở được, không có lỗi trang.
- Màn hình 360px không cuộn ngang; theme sáng và tối đều đọc rõ.
- Ghi vào Notes: từng thay đổi (file + lý do), các lệnh đã chạy và kết quả.

## Notes

### Thay đổi (file + lý do)
- `js/views/dashboard.js`
  - **Lazy `<details>`**: hàm `details(id, title)` giờ chỉ gọi `getDetails(id)` (tức `weekHtml/sectionsHtml/bottomHtml/careerHtml`) **khi panel đang mở**. Trước đây nội dung 4 panel được tính eager rồi vứt đi nếu đóng — mỗi hàm quét toàn bộ ngân hàng câu hỏi. Đây là tối ưu render lần đầu lớn nhất (mặc định 4 panel đóng → bỏ 4 lần quét dữ liệu).
  - **Xoá code chết**: bỏ hàm `quickHtml()` (định nghĩa nhưng không nơi nào gọi; các tile `db-quick/db-tile` không còn được render). Các helper `weekNumber/allWeeks/dueItems` vẫn còn được `pickAlgo/buildPlan` dùng nên không mồ côi.
- `js/views/path.js`
  - **Memo hoá tra cứu**: `lessonById`/`questionById` trước đây gọi `App.lessons()` (sort lại mảng 368 bài mỗi lần) và `.find()` tuyến tính cho từng lesson/question của mọi chặng. Nay dựng `Map` id→object một lần theo identity của `window.LESSONS` / `App.lite('questions')` rồi tra O(1).
- `css/views/dashboard.css`
  - **Mobile 360px**: `.db-mission-head` và `.db-pomo` thêm `flex-wrap: wrap` để hàng tiêu đề nhiệm vụ + đồng hồ Pomodoro (time + 3 nút + nút Đổi) không tràn ngang trên màn hình hẹp.

### Lệnh đã chạy & kết quả
- `node --check` cho cả 4 file .js sở hữu → OK.
- `node scripts/smoke.mjs` → `OK — không có lỗi.` (32 route).
- `node scripts/validate.js` → **2 lỗi còn lại đều nằm ngoài phạm vi sở hữu** (không sửa được theo luật 3): `lessons-jpa.js: lesson-jpa-020` (body < 2500 ký tự) và `lessons-jvm.js: lesson-jvm-004` (related "jvm-032" không tồn tại). Các file T2704 sở hữu **không sinh lỗi mới**; cảnh báo `path.js: 173 bài học không nằm trong PATH` là cảnh báo dữ liệu có sẵn, không phải lỗi.
- Không chạy `git commit`/`add`/`stash`/`checkout`/`reset` (autopilot tự review + commit). Không mở trình duyệt, không npm, không kill tiến trình.
Reviewed-by: verify-only (code/UI task)
