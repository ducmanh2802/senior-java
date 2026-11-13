# T1715R — Fact-check nội dung mới của T1715

Status: DONE
Agent: opencode
Owns: `js/data/q-scenario.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1715 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã fact-check 12 câu hỏi mới (scenario-137 → scenario-148) do model free viết. Đã sửa các lỗi kỹ thuật/markup sau:

- **scenario-137**: nội dung gốc dùng `TIMESTAMP` (PostgreSQL) — đã đổi thành `TIMESTAMPTZ`; giải thích rõ `LocalDateTime` không biết múi giờ, `Instant` là thời điểm chuẩn UTC, `ZonedDateTime`/`OffsetDateTime` khác nhau; thêm ví dụ chuyển giờ mùa hè (02:00 không tồn tại) và tháng 11 (01:30 xuất hiện 2 lần). Code Java dùng đúng `Instant` + `ZoneId` theo khách hàng, không `ZoneId.systemDefault()`.
- **scenario-138**: giữ nguyên nội dung (đã đúng); chỉ làm rõ `top -H` trả PID thập phân, `jstack` dùng `nid` thập lục phân, và phân biệt `runnable` vs `waiting/timed_waiting`. Thêm lưu ý `jstack` 3 lần cách 5 giây để xác nhận stack không đổi.
- **scenario-139**: giải thích `cardinality` và tại sao `user_id` làm nổ time series; bảng trade-off low/high cardinality labels; nhấn mạnh "quy tắc vàng" trước khi thêm label.
- **scenario-140**: giữ nguyên; làm rõ `.join()` block thread, `allOf()` chỉ hoàn tất khi tất cả xong, `orTimeout` không hủy task đang chạy → cần idempotent. Thêm lưu ý không `.join()` trên request thread nếu có thể.
- **scenario-141**: làm rõ `parallelStream()` dùng `ForkJoinPool.commonPool()` → thread starvation; thêm giải pháp `ForkJoinPool` riêng với số lượng giới hạn; nhấn mạnh không dùng `parallelStream()` trong request HTTP.
- **scenario-142**: giải thích `replication lag`, `read-your-writes consistency`; thêm bước "đánh dấu vua ghi 5 giay"; nhấn mạnh dữ liệu tiền (số dư) luôn đọc primary.
- **scenario-143**: giải thích `pinning` chi tiết (synchronized/I/O nguyên bản làm cạn carrier); thêm công cụ điều tra JFR `jdk.ThreadPinning`, `top -H`, `jstack`; nhấn mạnh đo p99 trước/sau, không dùng virtual threads cho CPU-bound.
- **scenario-144**: làm rõ `ReDoS`, `top -H -p PID`, `jstack nid=0x...`, `printf '%x'`; thêm ví dụ regex `(a+)+` và vòng lặp thiếu `i++`; nhấn mạnh test regex với adversarial input 10.000 ký tự.
- **scenario-145**: phân biệt `OOMKilled` (137, container) với `OutOfMemoryError` (heap); giải thích `RSS`, thread stack 1MB native, direct buffer; thêm `jcmd VM.native_memory`, `/proc/<pid>/status` Threads.
- **scenario-146**: làm rõ `N+1`, `full table scan`, `fetchSize/keyset`, `EXPLAIN (ANALYZE, BUFFERS)`, `pg_stat_statements`; nhấn mạnh test với dữ liệu production-like.
- **scenario-147**: giải thích `Instant` vs `LocalDateTime` vs `ZoneId.systemDefault()`; thêm business date theo múi giờ khách hàng; nhấn mạnh không dùng `java.util.Date`/`Calendar` cũ.
- **scenario-148**: giải thích 502/504, keep-alive, graceful shutdown, readiness probe, terminationGracePeriodSeconds; thêm `server.shutdown=graceful` (Spring Boot 3.4+), preStop, maxUnavailable: 0, client retry với idempotency key.

Không có lỗi markup (không có backtick, `${`, `{` `}` lồng nhau trong `{{...}}`). `node scripts/validate.js` → OK. `node scripts/build-light-index.js` → đã sinh lại `js/data/index-light.js`.
