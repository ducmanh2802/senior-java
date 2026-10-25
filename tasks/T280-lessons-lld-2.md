# T280 — Track `architecture`: LLD / OOP design bằng Java tự chấm (phần 2)

Status: TODO
Agent: opencode
After: T279
Owns: `js/data/lessons-architecture.js`

Phỏng vấn Senior hay có vòng **LLD (low-level design)**: thiết kế class, interface, pattern cho một bài toán đời thực rồi code. Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` thật kỹ. File `js/data/lessons-architecture.js` đã gắn index.html — thêm vào trong `push(...)`, KHÔNG xoá bài đã có. Không trùng với `lessons-design.js` (đã có rate limiter, LRU, consistent hashing, circuit breaker, idempotency).

**4 bài** (track `architecture`, id/order tiếp nối số lớn nhất trong file, level mid/senior): (5) **Movie Ticket Booking** — giữ ghế tạm (hold có hạn, clock truyền vào), chống đặt trùng khi nhiều thread, huỷ và nhả ghế; (6) **Splitwise / chia tiền nhóm** — ledger nợ, chia đều/theo %/theo số, rút gọn số giao dịch thanh toán; (7) **Logging framework** — Chain of Responsibility theo level + Decorator (timestamp, mask PII) + nhiều appender; (8) **Text editor Undo/Redo** — Command pattern, giới hạn lịch sử, gộp thao tác gõ liên tiếp.

Mỗi bài:
- `body` ≥ 2500 ký tự: cách trình bày LLD trong phỏng vấn (hỏi làm rõ yêu cầu → entity → quan hệ và interface → pattern và vì sao → concurrency/edge case → mở rộng), sơ đồ class ASCII trong `~~~text`, SOLID áp dụng ở đâu, bảng trade-off, kết bằng `### Liên hệ phỏng vấn`.
- 1–2 bài tập Java 17 chỉ JDK chuẩn: starter là khung class/interface biên dịch được, phần cần làm `throw new UnsupportedOperationException("TODO")`; tests kiểm tra **hành vi** (không ép tên private), ≥ 4 case gồm edge case và mở rộng (vd thêm loại mới mà không sửa class cũ); reference pass 100%; không class public ngoài `Main`.
- 2–4 câu `check`; `related` trỏ câu hỏi có thật topic `architecture`/`design` nếu hợp.
- `node scripts/test-lessons.js` (reference pass, starter không pass) và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
