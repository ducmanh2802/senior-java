# T2708 — Tối ưu view sự nghiệp: companies, career, jobs, news, account, legal

Status: DONE
Agent: kilo
Owns: `js/views/companies.js`, `css/views/companies.css`, `js/views/career.js`, `css/views/career.css`, `js/views/jobs.js`, `css/views/jobs.css`, `js/views/news.js`, `css/views/news.css`, `js/views/account.js`, `css/views/account.css`, `js/views/legal.js`, `css/views/legal.css`

Đọc AGENTS.md mục 2, 3, 7, 8 trước khi làm. Người dùng yêu cầu: "Sửa đổi các tính năng, tối ưu code, tối ưu giao diện".

## Mục tiêu
Giao diện rõ ràng; kiểm tra input và phản hồi trên form; escape mọi chữ người dùng nhập hoặc dữ liệu fetch về trước khi chèn vào HTML (chống XSS); tăng tốc render; layout mobile; xoá code chết. Không đổi logic đăng nhập và đồng bộ.

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
- `js/views/jobs.js`: hoàn thiện trang "Ôn cho việc này" (`#/jobs/prep/<id>`) mà lần chạy trước bị gián đoạn để lại
  (đã có `renderPrep`, CSS, link từ dashboard nhưng THIẾU hàm helper và i18n key → trang sẽ lỗi khi mở).
  - Thêm 3 helper còn thiếu: `planTopics(j)` (topic trọng tâm + weight, ưu tiên `analysis.must_have`),
    `summaryOf(q)` (rút gọn đáp án, ưu tiên mục `**Tóm tắt:**`), `buildPlan(j)` (chia topic theo ngày + ngày cuối
    phỏng vấn thử, trả `{days, level, topics, plan}`), `prepProgress(j)` (đếm câu đã thuộc / tổng câu).
    Khớp đúng shape mà `renderPrep` và `dashboard.js` (`jobProgress`, `prepDays`, `prepDone`) đang dùng.
  - Thêm ~26 i18n key `jobs.prep*` (vi + en) mà `renderPrep` tham chiếu (prepPageTitle, prepDay, prepWeight,
    prepProgressBadge, prepShowAnswer…).
  - Xoá biến chết `todayIdx` (khai báo nhưng không dùng).
  - Không đổi tên/xoá hàm hay class CSS nào; không đụng logic đăng nhập/đồng bộ.
- Các file `companies.js`, `career.js`, `news.js`, `account.js`, `legal.js` và 6 file CSS: đọc kỹ, cú pháp đúng,
  đã escape dữ liệu bằng `App.esc`/`App.md`, responsive + dark mode qua biến CSS — không cần sửa thêm, giữ nguyên.

### Lệnh đã chạy & kết quả
- `node --check` cho cả 6 file .js (companies, career, jobs, news, account, legal) → OK hết.
- `node scripts/validate.js` → 2 lỗi DỮ LIỆU nằm NGOÀI phạm vi task này (không được sửa theo luật 3):
  - `lessons-jpa.js: lesson-jpa-020` (file đang bị task khác sửa — `M` trong git status).
  - `lessons-jvm.js: lesson-jvm-004` (lỗi có sẵn trong HEAD, không phải do task này).
  Không có lỗi nào ở 6 file view/CSS của task. (Các cảnh báo "đáp án ngắn" cũng thuộc file dữ liệu của task khác.)
- `node scripts/smoke.mjs`: KHÔNG chạy — cần Playwright/Chromium, luật 9 cấm mở trình duyệt; integrator sẽ test UI.

### Ghi chú bàn giao
- 2 lỗi validate còn lại thuộc `js/data/lessons-jpa.js` và `js/data/lessons-jvm.js` (task khác sở hữu) — cần chủ
  task đó xử lý để validate về `OK — không có lỗi.`
- Trang prep giờ đã hoạt động: dashboard → "Ôn hôm nay" mở `#/jobs/prep/<id>` hiển thị tiến độ, kế hoạch theo ngày,
  câu hỏi cần ôn (lật đáp án + tự chấm), gợi ý JD nếu đã phân tích.
Reviewed-by: verify-only (code/UI task)
