# T1265R — Fact-check nội dung mới của T1265

Status: DONE
Agent: opencode
Owns: `js/data/q-soft.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1265 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỉ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check nội dung mới (6 đoạn thêm vào behavioral-001, behavioral-002, behavioral-003, behavioral-004, behavioral-005, behavioral-006) — tìm thấy 1 lỗi số liệu:

- **behavioral-006** (`technical-debt`): phần "Ví dụ đời thực" viết `Tôi trình bày PM: '4,2s chờ × 240 người × 50 lần/ngày ≈ 11h công mất/ngày'`. 4,2 × 240 × 50 = 50.400 giây ≈ 14h, không phải 11h. Đã sửa thành `3,3s chờ thừa × 240 × 50 ≈ 11h công mất/ngày` (3,3 × 240 × 50 = 39.600 giây ≈ 11h), đồng bộ với phần "Trả lời mẫu khi phỏng vấn" cùng câu hỏi đã dùng 3,3s. Phần `Senior tip` bên dưới cũng đã dùng 3,3s nên tự động đồng bộ.

Các đoạn còn lại (behavioral-001, 002, 003, 004, 005) kiểm tra kỹ thuật: markup hợp lệ, không backtick, không `${`, các thuật ngữ (N+1, pg_stat_activity, Hikari pool, composite index, pg_stat_statements, replication lag, ADR, materialized view, load test, circuit breaker) dùng đúng ngữ cảnh, số liệu trong các ví dụ đời thực tự洽 (p99, error rate, pool size, oversell 0,7%, 1.900 đơn, 4 giây lag, 12 ngày, 21 story points, velocity 13/2 tuần… đều tính được). Không phát hiện lỗi kiến thức.