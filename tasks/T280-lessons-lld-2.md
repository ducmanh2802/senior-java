# T280 — Track `architecture`: LLD / OOP design bằng Java tự chấm (phần 2)

Status: DONE
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

Đã thêm 4 bài vào `js/data/lessons-architecture.js` (giữ nguyên 4 bài 001–004, splice trước `);`):

- `lesson-architecture-005` (senior, 40'): Movie Ticket Booking — BookingService hold/confirm/cancel, hold có hạn với clock tiêm vào `LongSupplier`, lazy sweep + `synchronized` check-then-act, test race 16 thread (`CountDownLatch`, `ExecutorService` có timeout). 1 bài tập, 21 PASS.
- `lesson-architecture-006` (mid, 35'): Splitwise — 2 bài tập: (1) SplitStrategy với EqualSplit/PercentSplit (floor + phân phát phần dư từng cent, dùng long cent không dùng double) và ExactSplit cho sẵn; (2) Ledger net balance + settle greedy (sort deterministic, tie theo id; settle không mutate net). 9 + 9 PASS, có test custom strategy (Open/Closed).
- `lesson-architecture-007` (senior, 35'): Logging framework — LogRecord bất biến, filter chain kiểu phủ quyết (mọi filter phải accept), Decorator bọc Appender (PiiMask che chữ số, TimestampDecorator), nhiều appender; test thêm CountingAppender/OnlyOtp tự viết. 10 PASS.
- `lesson-architecture-008` (mid, 30'): Text editor Undo/Redo — Command pattern với Cmd/InsertCmd/DeleteCmd cho sẵn, Editor gộp gõ liên tiếp (điều kiện: top là InsertCmd, cursor cuối text của nó, redoStack rỗng), history giới hạn (ArrayDeque addFirst/removeLast), run(Cmd) cho command mở rộng; test UpperCmd tự thêm. 21 PASS.

Đã chạy: `node scripts/test-lessons.js lesson-architecture-005..008` (reference pass 100%, starter không pass, biên dịch JDK 17 `--release`) và `node scripts/validate.js` → **OK — không có lỗi.** (Cảnh báo về bài học chưa được liệt kê trong PATH vẫn còn như cũ, không thuộc phạm vi file này.)

