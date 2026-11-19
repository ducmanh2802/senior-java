# T2430R — Fact-check nội dung mới của T2430

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2430 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 5 câu hỏi mới của T2430 (concurrency-085 đến concurrency-089):
- concurrency-085: Tách thread pool CPU-bound vs I/O-bound (bulkhead), công thức sizing N = cores × (1 + W/C), ví dụ thực tế — **đúng kỹ thuật**.
- concurrency-086: Chọn BlockingQueue (ArrayBlockingQueue/LinkedBlockingQueue/SynchronousQueue/PriorityBlockingQueue/DelayQueue), backpressure với offer(timeout), drainTo — **đúng kỹ thuật**.
- concurrency-087: CompletableFuture fan-out 8 nhánh với allOf, Semaphore giới hạn đồng thời, 3 lớp timeout (client/overall/cancel), không dùng commonPool — **đúng kỹ thuật**.
- concurrency-088: ConcurrentHashMap compute/computeIfAbsent cho per-key locking & đếm, LongAdder tránh contention, lock striping, pitfalls (I/O trong mapping, null return, leak entry) — **đúng kỹ thuật**.
- concurrency-089: Chuyển Spring Boot 3.2 sang virtual thread, pinning JDK 21 (synchronized), JFR VirtualThreadPinned, JDK 24 JEP 491 fix, Semaphore giới hạn downstream, ThreadLocal bloat — **đúng kỹ thuật**.

Validation: `node scripts/validate.js` báo OK cho 5 câu hỏi mới (không lỗi, không cảnh báo). Các lỗi/cảnh báo khác là file cũ (devops, q-devops.js, lessons-devops.js, concurrency-081/083/084) — không thuộc phạm vi task này.
