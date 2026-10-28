# T301 — Review lessons T279/T280 (architecture) + T292 (microservices)

Status: DONE
Agent: opencode
Owns: `js/data/lessons-architecture.js`, `js/data/lessons-microservices.js`

Commit: `4460947` và các commit trước đó của `lessons-architecture.js` (`git log --oneline -- js/data/lessons-architecture.js`).

Đây là task **review + sửa tại chỗ** cho nội dung đã commit nhưng CHƯA được ai kiểm tra chất lượng (xem AGENTS.md mục 4–6, 12). Integrator cho phép sửa đúng các file trong `Owns`.

Cách làm:
1. Tìm các mục được thêm trong commit nêu dưới: `git show <commit> -- <file>` (chỉ review phần mới thêm, không viết lại câu cũ).
2. Với từng mục, kiểm tra và **sửa trực tiếp**:
   - Sai kỹ thuật so với Java 17/21, Spring Boot 3.x, Hibernate 6, AWS hiện hành; API bịa → sửa cho đúng hoặc viết ít lại nhưng đúng.
   - Chữ bị lỗi/rác (ký tự Trung/Hàn lạc vào, câu cụt, từ vô nghĩa, `[sic]`), lặp ý, markup sai (backtick, `${`, bảng vỡ, code block thiếu ngôn ngữ).
   - Thiếu chuẩn: `**Tóm tắt:**` mở đầu, các mục `###`, `> Senior tip:` cuối; lesson phải có `### Liên hệ phỏng vấn`, `explain` của check nói vì sao từng phương án sai.
   - Không xoá mục, không đổi `id`, không thêm field lạ.
3. Kiểm chứng: `node --check <file>`, `node scripts/validate.js` → `OK — không có lỗi.` (nếu chỉ còn lỗi ở file ngoài Owns thì ghi lại); file lessons: `node scripts/test-lessons.js` phải pass hết (reference pass 100%, starter không pass hết).
4. Ghi vào `## Notes`: danh sách id đã sửa + sửa gì (1 dòng/id), id đã ổn. Rồi `Status: DONE`.

## Notes

- lesson-architecture-001 (Parking Lot): thêm `**Tóm tắt:**` vào đầu body. Nội dung kỹ thuật đã đúng (Strategy + Factory, OCP, fine-grained lock).
- lesson-architecture-002 (Elevator): thêm `**Tóm tắt:**`. Đúng State pattern, SCAN/LOOK, mô phỏng tick.
- lesson-architecture-003 (Notification Service): thêm `**Tóm tắt:**`. Đúng Observer, OCP, tách retry/template.
- lesson-architecture-004 (Vending Machine): thêm `**Tóm tắt:**`. Đúng State pattern, DP tiền thừa, kiểm tra đủ điều kiện trước khi nhả hàng.
- lesson-architecture-005 (Movie Ticket Booking): thêm `**Tóm tắt:**`. Đúng hold/confirm, LongSupplier clock, synchronized check-then-act.
- lesson-architecture-006 (Splitwise): thêm `**Tóm tắt:**`. Đúng Strategy, net balance, greedy settle, long cent.
- lesson-architecture-007 (Logging framework): thêm `**Tóm tắt:**`. Đúng filter chain, Decorator appender, record bất biến.
- lesson-architecture-008 (Text editor): thêm `**Tóm tắt:**`. Đúng Command pattern, gộp gõ, deque giới hạn lịch sử.
- lesson-microservices-006 (Idempotency store): đã có `**Tóm tắt:**`, không sửa. Đúng state machine, ConcurrentHashMap.compute, TTL phantom.
- lesson-microservices-007 (Partial success deletion): đã có `**Tóm tắt:**`, không sửa. Đúng 207, tiến độ từng id, compensation ledger, reconcile.
- Markup kiểm tra: không có backtick, không có ${, {{ }} cân bằng, không có thẻ HTML, không ký tự lạ — trong cả 2 file.
- Các check question đều có explain nói rõ vì sao từng đáp án sai là sai.
- `node scripts/validate.js` → OK — không có lỗi. (Cảnh báo PATH cho 17 bài học là tiền tồn, không liên quan task này.)
- `node scripts/test-lessons.js` → 91/91 bài tập pass (reference pass 100%, starter compile được và không pass hết).
- Lỗi algo.js (syntax) là của T14, nằm ngoài Owns, không phải do task này.

Reviewed-by: kilo (T301R)
