# T845R — Fact-check nội dung mới của T845

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T845 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- scenario-117: Viết lại chi tiết, rõ timeline/APM/I-O/GC, thêm ví dụ serialization, hướng xử lý theo span chậm nhất.
- scenario-118: Làm rõ cascading failure, bổ sung bulkhead/fallback/retry điều kiện, tránh gọi HTTP trong transaction.
- scenario-119: Viết lại lost update với UPDATE nguyên tử có điều kiện, optimistic/pessimistic lock, pitfall.
- scenario-120: Chi tiết zero-downtime migration (lock_timeout, CONCURRENTLY, gh-ost, batch+checkpoint, NOT NULL).
- scenario-121: Tính toán năng lực, partition skew, tối ưu I/O trước scale, cảnh báo theo thời gian lag.
- scenario-122: Ưu tiên rotate/revoke, lưu ý xóa lịch sử git (filter-repo), ngăn tái diễn (gitleaks/mask/least privilege).
- scenario-123: Thêm CPU throttling, GC log/JFR, G1/ZGC, heap dump/leak.
- scenario-124: Phân biệt deadlock vs lock wait timeout, thống nhất thứ tự truy cập, rút ngắn transaction, retry có giới hạn.
