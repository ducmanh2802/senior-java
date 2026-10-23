# T102R — Fact-check nội dung mới của T102

Status: DONE
Agent: opencode
Owns: `js/data/projects.js`, `js/views/projects.js`, `css/views/projects.css`, `index.html`, `scripts/validate.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T102 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã rà soát đủ 6 dự án, view, CSS, khai báo asset/route và validator. Sửa `proj-wallet`: PostgreSQL `CHECK` không thể áp invariant debit/credit giữa nhiều dòng; tiêu chí nay yêu cầu kiểm tra trong transaction hoặc deferred constraint trigger. Sửa `proj-flash-sale`: PostgreSQL là nguồn chuẩn duy nhất cho stock/reservation; Redis chỉ làm admission/rate limit, tránh mô tả hai nguồn reservation mâu thuẫn. Validator PROJECTS giờ không crash khi `challenges`, `interview.questions` hoặc `related` sai kiểu mà vẫn báo lỗi schema. Không phát hiện lỗi kỹ thuật/markup khác cần sửa.

Kiểm tra: `node --check` cho `js/data/projects.js`, `js/views/projects.js`, `scripts/validate.js` đều đạt; `node scripts/test-lessons.js` đạt 36/36 bài tập; `node scripts/validate.js` in `Pet project: 6 dự án` và `OK — không có lỗi.` Không mở browser, không cài package, không commit.
