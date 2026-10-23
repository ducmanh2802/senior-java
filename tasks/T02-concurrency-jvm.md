# T02 — Nội dung: Concurrency, JVM & GC

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

## Mục tiêu
Viết câu hỏi kèm đáp án mẫu cho topic `concurrency` và `jvm` theo `AGENTS.md` mục 4–6. ID bắt đầu từ `concurrency-001` và `jvm-001`.
Xem `js/data/q-java.js` (`core-001`) để biết văn phong và format mẫu.

## Danh sách câu hỏi (bắt buộc bao phủ)
### concurrency (≥ 12 câu)
- Java Memory Model: happens-before, {{volatile}} đảm bảo gì / không đảm bảo gì
- {{synchronized}} vs {{ReentrantLock}} vs {{ReadWriteLock}} vs {{StampedLock}}
- ThreadPoolExecutor: core/max/queue/keepAlive, thứ tự tạo thread, rejection policy, sizing CPU-bound vs IO-bound
- Vì sao không nên dùng {{Executors.newFixedThreadPool}}/{{newCachedThreadPool}} mặc định trên production
- {{CompletableFuture}}: thenApply/thenCompose/allOf, xử lý exception, executor mặc định
- Deadlock: điều kiện, phát hiện bằng thread dump, cách phòng tránh; livelock & starvation
- Virtual threads (Java 21): cơ chế, pinning, khi nào không nên dùng, ảnh hưởng tới ThreadLocal & connection pool
- {{ThreadLocal}}: use case, memory leak trong thread pool
- CAS, {{AtomicInteger}}, vấn đề ABA, {{LongAdder}} vs {{AtomicLong}}
- Double-checked locking singleton & vì sao cần volatile
- {{CountDownLatch}}, {{CyclicBarrier}}, {{Semaphore}}, {{Phaser}}: so sánh use case
- Thiết kế cơ chế xử lý song song 1 triệu record có giới hạn tốc độ & đảm bảo không mất dữ liệu
- Structured concurrency / scoped values (Java 21 preview): ý tưởng chính
### jvm (≥ 10 câu)
- Các vùng nhớ JVM: heap (young/old), metaspace, stack, code cache, direct memory
- Các GC: Serial, Parallel, G1, ZGC, Shenandoah: cơ chế & cách chọn; G1 region, mixed GC
- Tuning heap trong container (Kubernetes): {{-XX:MaxRAMPercentage}}, vì sao không set Xmx = limit
- Các loại OutOfMemoryError & cách chẩn đoán (heap dump, MAT)
- Memory leak trong Java: ví dụ thực tế & cách tìm
- CPU 100% trên production: quy trình điều tra (top -H, jstack, async-profiler, JFR)
- Class loading: parent delegation, ClassLoader leak khi redeploy
- JIT: C1/C2, tiered compilation, escape analysis, warm-up; GraalVM native image trade-off
- Stop-the-world, safepoint, đọc GC log để phát hiện vấn đề
- String deduplication, compressed oops, object header layout (ước lượng size object)

## Notes
- DONE: đã viết 13 câu `concurrency-001..013` (đủ 100% danh mục bắt buộc: JMM/volatile, locks, ThreadPoolExecutor, Executors pitfall, CompletableFuture, deadlock/livelock, virtual threads/pinning, ThreadLocal leak, CAS/ABA/LongAdder, DCL, latch/barrier/semaphore/phaser, thiết kế 1 triệu record có rate limit + không mất data, structured concurrency/scoped values).
- Đã viết 11 câu `jvm-001..011` (memory areas, GC so sánh + G1 region/mixed GC, container tuning MaxRAMPercentage, OOME types + MAT, memory leak, CPU 100% điều tra, classloader + leak redeploy, JIT + GraalVM trade-off, STW/safepoint/GC log, compressed oops/object header/String dedup, chiến lược ZGC generational cho p99 < 10 ms).
- Level mix: 5 mid / 15 senior / 4 lead (~22/65/17), gần guideline 25/55/20.
- Mỗi đáp án theo format: Tóm tắt + mục ### + code block ~~~java/~~~bash/~~~text ngắn + Senior tip; theo park 1200–2500 ký tự, không dùng backtick, không `${`, markup chỉ kiểu AGENTS.md mục 5.
- `node scripts/validate.js` → OK — không có lỗi; topic của task này có đủ 13 + 11 = 24 câu.
- Không git commit; chỉ thay đổi 1 file sở hữu: `js/data/q-concurrency-jvm.js`.
Reviewed-by: codex (T02R)
Verify-failed: legacy — đã commit từ trước, autopilot bỏ qua
