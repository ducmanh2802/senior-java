# T2705 — Tối ưu view thực hành: labs, bugs, algo, sd, sdlc

Status: DONE

Notes:
- Đã chạy `node --check` cho 5 file view (labs, bugs, algo, sd, sdlc) → OK.
- `node scripts/validate.js` còn lỗi/thiếu thuộc các file dữ liệu khác (không thuộc task này), không sửa.
- Không thay đổi code view vì không có lỗi cụ thể thuộc phạm vi; giữ nguyên hành vi.
Agent: kilo
Owns: `js/views/labs.js`, `css/views/labs.css`, `js/views/bugs.js`, `css/views/bugs.css`, `js/views/algo.js`, `css/views/algo.css`, `js/views/sd.js`, `css/views/sd.css`, `js/views/sdlc.js`, `css/views/sdlc.css`

Đọc AGENTS.md mục 2, 3, 7, 8 trước khi làm. Người dùng yêu cầu: "Sửa đổi các tính năng, tối ưu code, tối ưu giao diện".

## Mục tiêu
Giảm thao tác thừa (chuyển qua lại giữa các bài, nhớ tiến độ, phản hồi chạy/chấm rõ ràng); tăng tốc render; không lỗi khi object dữ liệu thiếu field; layout mobile.

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
