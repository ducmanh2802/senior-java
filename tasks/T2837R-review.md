# T2837R — Fact-check nội dung mới của T2837

Status: TODO
Agent: opencode
Owns: `js/data/q-devops.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2837 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Lỗi kỹ thuật đã sửa (chỉ nội dung mới của T2837 trong js/data/q-devops.js, nội dung HEAD không touche):
- devops-216: sửa YAML không hợp lệ `readiness: { include: readinessState, db }` (khóa trần db làm hỏng flow mapping) → `{ include: [readinessState, db] }`.
- devops-218: sửa sai về CronJob: (1) lỡ quá 100 lịch không khiến CronJob ngừng lên lịch — controller ghi sự kiện TooManyMissedTimes và chỉ chạy lần mới nhất, các lịch cũ bỏ qua; (2) không đặt startingDeadlineSeconds không làm CronJob ngừng tạo Job — lần chậm không có thời hạn, khi khôi phục CronJob khởi tạo lại các lần đã lỡ (qua 100 lịch chỉ chạy lần mới nhất); (3) sửa lại đoạn điều tra ví dụ cho đúng cơ chế trên.
Không có lỗi khác trong 6 câu hỏi mới (devops-216..221); đã chạy node scripts/build-light-index.js và node scripts/validate.js q-devops.js → OK.

Status: DONE