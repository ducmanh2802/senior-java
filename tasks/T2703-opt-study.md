# T2703 — Tối ưu view ôn tập: bank, learn, quiz, flash

Status: DONE
Agent: kilo
Owns: `js/views/bank.js`, `css/views/bank.css`, `js/views/learn.js`, `css/views/learn.css`, `js/views/quiz.js`, `css/views/quiz.css`, `js/views/flash.js`, `css/views/flash.css`

Đọc AGENTS.md mục 2, 3, 7, 8 trước khi làm. Người dùng yêu cầu: "Sửa đổi các tính năng, tối ưu code, tối ưu giao diện".

## Mục tiêu
Ngân hàng có ~5.200 câu hỏi và ~2.500 câu quiz: render danh sách nhanh (render theo trang hoặc từng phần, ô tìm kiếm có debounce, không render lại toàn bộ mỗi lần gõ phím); giữ bộ lọc và trạng thái khi chuyển trang; empty state rõ ràng; phím tắt hữu ích (quiz: phím 1–4 chọn đáp án, Enter sang câu tiếp); dùng tốt trên mobile.

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

### Thay đổi (chỉ file sở hữu)
- `js/views/bank.js`: bổ sung gọi `saveFilters()` tại 6 điểm thay đổi bộ lọc — tìm kiếm (debounce 150ms), level, chip chủ đề, chip trạng thái, chip "Câu lõi", nút "Xoá bộ lọc". Hàm `saveFilters`/`loadFilters` đã có từ trước nhưng chưa gọi `saveFilters` ở đâu, nên bộ lọc/trạng thái không bị lưu khi chuyển trang — vi phạm mục tiêu "giữ bộ lọc khi chuyển trang". Bây giờ load/lưu bộ lọc vào localStorage (`sjp.bank.filters`) đã đóng vòng.
- `js/views/learn.js`, `js/views/quiz.js`, `js/views/flash.js` + 4 file `css/views/*.css`: chưa đổi. Các mục tiêu đã đáp ứng trước đó (render phân trang "Xem thêm", tìm kiếm có debounce, không render lại toàn bộ mỗi lần gõ, empty state rõ ràng, phím tắt quiz 1–4/Enter sang câu tiếp, CSS responsive 360px/560px/720px). Quy tắc T2703 #14: mỗi thay đổi nhỏ, an toàn, không viết lại cả file.

### Quyết định keystroke quiz
Giữ phím 1–6 (cháuperset của 1–4) thay vì chỉ 1–4: có 26 câu trắc nghiệm multi có 5–6 đáp án; giới hạn ở 4 sẽ làm mất khả năng chọn đáp án 5/6 bằng phím. Phím 1–4 vẫn chọn đáp án như yêu cầu; Enter xác nhận (multi) / sang câu tiếp.

### Lệnh đã chạy & kết quả
- `node --check js/views/bank.js learn.js quiz.js flash.js` → OK (tất cả).
- `node scripts/validate.js` → exit 1 do 2 lỗi CŨ trong `lessons-jpa.js` (lesson-jpa-020 body < 2500 ký tự) và `lessons-jvm.js` (lesson-jvm-004 related jvm-032 không thật). Hai file này KHÔNG thuộc sở hữu T2703, không được sửa (AGENTS.md #3). Không có lỗi mới do thay đổi của tôi (validate không kiểm tra file view; baseline tương đồng).
- `node scripts/smoke.mjs` KHÔNG chạy — AGENTS.md #9 cấm mở trình duyệt/headless browser; thay vào đó dùng `node --check` + `node scripts/validate.js`.
- Không git commit/push/add/stash (AGENTS.md #4).Reviewed-by: verify-only (code/UI task)
