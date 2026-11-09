# T1387R — Fact-check nội dung mới của T1387

Status: DONE
Agent: opencode
Owns: `js/data/q-concurrency-jvm.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1387 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 6 mục `### Ví dụ đời thực` mới thêm cho các câu hỏi concurrency-045 đến concurrency-050:

- **concurrency-045**: Service Java 17 trên ARM Graviton2, log DEBUG in object.toString() → identityHashCode ép inflate lock → contention nhảy vọt. Kỹ thuật đúng: identityHashCode chiếm mark word buộc JVM inflate thin lock thành ObjectMonitor. Công cụ: jcmd Thread.print, async-profiler -e lock, JFR jdk.JavaMonitorEnter.

- **concurrency-046**: Game server 10M gói/giây, AtomicLong CAS cache line bouncing 30% CPU. Chuyển VarHandle release/acquire cho pattern publish-subscribe → throughput +22%, p99 -22%. Nhưng release/acquire KHÔNG đủ cho thuật toán Dekker-style (cần volatile/setVolatile). Kỹ thuật đúng: release/acquire thiếu thứ tự toàn cục (StoreLoad) cần cho Dekker.

- **concurrency-047**: Hệ thống định giá 500k mã, cần range query + 100k writes/s. ConcurrentHashMap + TreeMap snapshot → O(n) query. Chuyển ConcurrentSkipListMap: subMap O(log n+k), 50 writer CAS node riêng → 120k ops/s write, p99 query 2ms. Iterator yếu bỏ qua 0.3% phần tử mới → snapshot ArrayList. Kỹ thuật đúng.

- **concurrency-048**: Spring Boot event-driven 200 listener, 50k req/s. Config reload addListener 50 lần liên tiếp → mỗi add copy mảng 250 phần tử → GC minor 2→45/s, p99 0.8→12ms. Sửa batch addAll 1 lần copy. Kỹ thuật đúng: CopyOnWriteArrayList phù hợp ghi hiếm, không phù hợp ghi dồn.

- **concurrency-049**: Batch job 1M record/ngày dùng newCachedThreadPool (SynchronousQueue). Burst 50k task/10 phút → 8000 native thread → OOM "unable to create native thread". Sửa ThreadPoolExecutor core 50, max 200, ArrayBlockingQueue(5000), CallerRunsPolicy → backpressure tự nhiên, job xong 45 phút. Kỹ thuật đúng.

- **concurrency-050**: API tìm khách sạn gọi 3 provider (80/120/300ms). CompletableFuture.allOf p99 320ms (đợi hết). ExecutorCompletionService take() progressive: first-result 95ms, fail-fast cancel task lỗi, CPU -15%. Kỹ thuật đúng.

Tất cả 6 ví dụ: kiến thức đúng, markup chuẩn ({{code}}, ~~~java, ###, >), không có backtick/${}, tiếng Việt có dấu, thuật ngữ tiếng Anh. Không cần sửa lỗi nào.
Validation: node scripts/validate.js → OK cho q-concurrency-jvm.js (lỗi khác file là pre-existing).
