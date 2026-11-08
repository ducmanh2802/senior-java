# T848R — Fact-check nội dung mới của T848

Status: DONE
Agent: opencode
Owns: `js/data/lessons-microservices.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T848 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff mới (so với HEAD) chỉ gồm `lesson-microservices-010`, `lesson-microservices-011`. Không sửa nội dung đã có ở HEAD.
- Kiểm tra: không backtick, không `${`, dùng `{{}}` cho inline code; seq diagram đúng cú pháp (2–4 actor, text ngắn); body/exercise/reference/hints/explain/check đầy đủ; thuật ngữ giải thích lần đầu; Kafka 3.x/Java client mới đúng; level/track/order/minutes hợp lệ.
- `node --check js/data/lessons-microservices.js` OK. `node scripts/validate.js` → OK. `node scripts/test-lessons.js`: lỗi compile còn lại thuộc `lesson-spring-012/013` và 1 fail reference `lesson-jpa-008` (file không thuộc sở hữu T848R); không có lỗi cho `lesson-microservices-010/011`.

### Sửa theo từng id
- `lesson-microservices-010`:
  - Làm rõ `PartitionAssignor` và cơ chế gán partition: `RangeAssignor` gán partition liên tiếp **theo từng topic** (có thể lệch tải khi nhiều topic); `RoundRobinAssignor` xoay vòng **tất cả partition của mọi topic** (cân bằng hơn). Nhấn mạnh `CooperativeStickyAssignor` giảm gián đoạn (incremental/cooperative). Giữ đúng ý task về range vs round-robin, tránh diễn giải dễ hiểu sai là "partition liên tiếp theo topic" áp dụng cho round-robin.
- `lesson-microservices-011`:
  - Chuẩn hoá phần cấu hình idempotent producer: nêu `acks=all`, `retries` bị chặn thực tế bởi `delivery.timeout.ms`, `max.in.flight.requests.per.connection <= 5` (mặc định 5) để giữ thứ tự; làm rõ client mới thường tự đảm bảo/từ chối cấu hình xung đột khi bật idempotence (thay vì diễn đạt mơ hồ "thường 5" hoặc "max.in.flight quá lớn không tương thích").
  - Bổ sung ý fencing phiên cũ qua `transactional.id` (giữ mức mô tả đúng, không bịa API chi tiết).
