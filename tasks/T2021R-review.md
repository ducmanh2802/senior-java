# T2021R — Fact-check nội dung mới của T2021

Status: DONE
Agent: opencode
Owns: `js/data/labs-incident.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2021 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- lab-incident-031: không có lỗi (kiểm tra kỹ thuật OK: max.poll.interval.ms mặc định 300.000 ms; 500×1,5s = 750s > 300s → rebalance; lag 216.000/1.800s = 120 msg/s khớp metric in_msg/s ~120).
- lab-incident-032: sửa mâu thuẫn TTL. Scenario và comment artifact ghi "TTL 24 giay ... het hang chinh xac luc 12:00 moi ngay" (24 giay không thể het theo lịch hàng ngày), nhưng `CacheConfig` dùng `.entryTtl(Duration.ofHours(24))` và Redis MONITOR dùng `PX 86400000` (= 24 giờ). Đã đổi "24 giay" → "24 gio" ở 3 chỗ: scenario (dòng 4120), comment artifact grafana-12h00.txt (dòng 4145), đáp án cách sửa ngắn hạn (dòng 4234).
- `node --check js/data/labs-incident.js` → OK. `node scripts/validate.js js/data/labs-incident.js` → OK — không có lỗi.
