# T872R — Fact-check nội dung mới của T872

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T872 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lab-incident-019 (Kafka consumer đá group): sửa lỗi kỹ thuật "cơ chế nói ngược" — heartbeat không chạy trên thread xử lý chính, mà gửi bởi luồng mạng nền của Kafka client chỉ khi còn gọi poll(); session.timeout.ms (broker theo dõi heartbeat) khác max.poll.interval.ms (giới hạn khoảng cách giữa hai lần poll, vượt quota → coi member chết → rebalance). Cập nhật cả điểm 2 trong "Cơ chế bên trong" và rubric tương ứng.
- lab-incident-020/021/022/023/024: kỹ thuật đúng, số liệu tự nhất quán, markup OK, không có backtick/`${` vỡ template, không cần sửa.
- Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
- node scripts/validate.js → OK.
