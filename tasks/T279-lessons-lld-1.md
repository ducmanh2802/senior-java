# T279 — Track `architecture`: LLD / OOP design bằng Java tự chấm (phần 1)

Status: TODO
Agent: opencode
Owns: `js/data/lessons-architecture.js`

Phỏng vấn Senior hay có vòng **LLD (low-level design)**: thiết kế class, interface, pattern cho một bài toán đời thực rồi code. Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` thật kỹ. File `js/data/lessons-architecture.js` đã gắn index.html — thêm vào trong `push(...)`, KHÔNG xoá bài đã có. Không trùng với `lessons-design.js` (đã có rate limiter, LRU, consistent hashing, circuit breaker, idempotency).

**4 bài** (track `architecture`, id/order tiếp nối số lớn nhất trong file, level mid/senior): (1) **Parking Lot** — nhiều tầng, nhiều loại xe/chỗ, tính phí theo giờ (Strategy cho pricing, Factory cho vehicle); (2) **Elevator** — nhiều thang, State pattern (IDLE/MOVING_UP/MOVING_DOWN/DOOR_OPEN) + chiến lược điều phối, mô phỏng theo tick xác định; (3) **Notification Service** — Email/SMS/Push qua interface, Observer cho subscriber, retry + template, thêm kênh mới không sửa code cũ (Open/Closed); (4) **Vending Machine** — State pattern, trả tiền thừa ít đồng nhất, hết hàng/hết tiền lẻ.

Mỗi bài:
- `body` ≥ 2500 ký tự: cách trình bày LLD trong phỏng vấn (hỏi làm rõ yêu cầu → entity → quan hệ và interface → pattern và vì sao → concurrency/edge case → mở rộng), sơ đồ class ASCII trong `~~~text`, SOLID áp dụng ở đâu, bảng trade-off, kết bằng `### Liên hệ phỏng vấn`.
- 1–2 bài tập Java 17 chỉ JDK chuẩn: starter là khung class/interface biên dịch được, phần cần làm `throw new UnsupportedOperationException("TODO")`; tests kiểm tra **hành vi** (không ép tên private), ≥ 4 case gồm edge case và mở rộng (vd thêm loại mới mà không sửa class cũ); reference pass 100%; không class public ngoài `Main`.
- 2–4 câu `check`; `related` trỏ câu hỏi có thật topic `architecture`/`design` nếu hợp.
- `node scripts/test-lessons.js` (reference pass, starter không pass) và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
