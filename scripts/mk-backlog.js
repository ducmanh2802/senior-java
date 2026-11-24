#!/usr/bin/env node
/*
 * Auto backlog generator (user 2026-11-23: "hết task tự thêm task mới").
 * scripts/refill.sh calls this when the TODO queue is low and tasks/backlog/ has nothing movable.
 * Writes the next BATCH task files (default 8) into tasks/backlog/ from the THEMES pool below, rotating through it
 * (position kept in logs/mk-backlog-state.json). Tasks for the same data file are chained with `After:` so two agents
 * never write one file at once.
 *   node scripts/mk-backlog.js            # write next batch
 *   node scripts/mk-backlog.js --dry      # print what would be written
 *   BATCH=4 node scripts/mk-backlog.js
 * Add themes to THEMES when the pool runs out of fresh ideas (it wraps around and asks for an uncovered angle).
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TASKS = path.join(ROOT, 'tasks');
const BACKLOG = path.join(TASKS, 'backlog');
const STATE = path.join(ROOT, 'logs', 'mk-backlog-state.json');
const BATCH = Number(process.env.BATCH || 8);
const DRY = process.argv.includes('--dry');

// topic → question file (mirrors js/data/topics.js)
const QFILE = {
  core: 'q-java.js', collections: 'q-java.js', modern: 'q-java.js', kotlin: 'q-kotlin.js',
  concurrency: 'q-concurrency-jvm.js', jvm: 'q-concurrency-jvm.js', spring: 'q-spring-data.js', jpa: 'q-spring-data.js',
  db: 'q-spring-data.js', sql: 'q-sql.js', frontend: 'q-frontend.js', api: 'q-api.js', security: 'q-security.js',
  microservices: 'q-microservices.js', design: 'q-system-design.js', architecture: 'q-system-design.js',
  scenario: 'q-scenario.js', banking: 'q-banking.js', aws: 'q-aws.js', ai: 'q-ai.js', devops: 'q-devops.js',
  testing: 'q-soft.js', behavioral: 'q-soft.js', english: 'q-english.js', autotest: 'q-autotest.js',
};

// quiz topic → quiz file: one file per group so quiz tasks of different groups run in parallel
// (all quiz tasks used to own quiz.js → 23 tasks in one serial After: chain starved the queue, 2026-11-24)
const QUIZ_FILE = {
  core: 'quiz-java.js', collections: 'quiz-java.js', modern: 'quiz-java.js', kotlin: 'quiz-java.js', concurrency: 'quiz-java.js', jvm: 'quiz-java.js',
  spring: 'quiz-spring.js', jpa: 'quiz-spring.js', db: 'quiz-spring.js', sql: 'quiz-spring.js', testing: 'quiz-spring.js', api: 'quiz-spring.js', security: 'quiz-spring.js',
  design: 'quiz-design.js', architecture: 'quiz-design.js', microservices: 'quiz-design.js', scenario: 'quiz-design.js', banking: 'quiz-design.js',
  devops: 'quiz-ops.js', aws: 'quiz-ops.js', ai: 'quiz-ops.js',
  frontend: 'quiz-gaps.js', behavioral: 'quiz-gaps.js', autotest: 'quiz-autotest.js',
};

// kind: q (questions) | quiz | lesson | lab | bug
const THEMES = [
  { kind: 'q', topic: 'testing', n: 4, desc: 'Testcontainers cho PostgreSQL/Kafka trong CI (thời gian chạy, reuse container), test slice @WebMvcTest/@DataJpaTest vs @SpringBootTest, contract test (Spring Cloud Contract / Pact) giữa 2 team, flaky test do thời gian và thứ tự: cách tìm và sửa' },
  { kind: 'lesson', track: 'modern', file: 'lessons-modern.js', desc: '(1) record + sealed interface + pattern matching cho switch (Java 21) để mô hình hoá kết quả nghiệp vụ thay cho exception; (2) Stream nâng cao: Collectors.groupingBy/partitioningBy/teeing, khi nào stream chậm hơn vòng for' },
  { kind: 'lab', category: 'thread', desc: '(1) **CompletableFuture chạy trên ForkJoinPool.commonPool bị chặn bởi I/O**: jstack cho thấy toàn bộ worker của commonPool đang WAITING trong HTTP client, API khác dùng parallelStream cũng treo; sửa bằng executor riêng có bound. (2) **synchronized quanh gọi DB làm 200 thread BLOCKED**: jstack nhiều thread BLOCKED chờ cùng monitor <0x...>, 1 thread RUNNABLE trong socketRead; sửa bằng thu hẹp critical section / lock theo key' },
  { kind: 'q', topic: 'banking', n: 4, desc: 'đối soát (reconciliation) giao dịch với NAPAS/ngân hàng đối tác cuối ngày, xử lý giao dịch treo (pending) quá timeout, hạn mức giao dịch theo ngày chính xác khi nhiều request song song, sổ cái kép (double-entry ledger) và cách đảm bảo tổng nợ = tổng có' },
  { kind: 'quiz', topic: 'testing', desc: 'JUnit 5 (@ParameterizedTest, @Nested, assertThrows), Mockito (when/thenReturn vs doReturn, verify, ArgumentCaptor, mock static), Testcontainers, test slice Spring Boot, mức độ coverage hợp lý, test pyramid' },
  { kind: 'bug', desc: '(1) **@Transactional gọi nội bộ không có tác dụng**: method public gọi this.save() có @Transactional(propagation = REQUIRES_NEW) để ghi audit, khi rollback thì audit cũng mất — mô phỏng proxy bằng java.lang.reflect.Proxy, sửa bằng tách bean / gọi qua proxy. (2) **Cache @Cacheable trả object mutable bị caller sửa**: caller A sửa list trả về từ cache, caller B thấy dữ liệu sai — sửa bằng trả bản copy bất biến (List.copyOf) hoặc cache value object bất biến' },
  { kind: 'q', topic: 'kotlin', n: 3, desc: 'null safety khi gọi Java API (platform type), coroutines vs virtual threads trong Spring Boot 3, data class làm JPA entity: cạm bẫy (equals/hashCode, no-arg constructor, open class với plugin kotlin-spring/kotlin-jpa)' },
  { kind: 'quiz', topic: 'scenario', desc: 'tình huống production: API chậm đột ngột, pool connection cạn, consumer Kafka lag tăng, OOM sau deploy, cache stampede, retry storm — chọn bước điều tra/ xử lý đúng đầu tiên' },
  { kind: 'lesson', track: 'aws', file: 'lessons-aws.js', desc: '(1) SQS: visibility timeout, DLQ, idempotent consumer — bài tập mô phỏng hàng đợi có visibility timeout bằng Java thuần; (2) S3 presigned URL và multipart upload — bài tập mô phỏng ghép part và kiểm tra ETag' },
  { kind: 'q', topic: 'frontend', n: 3, desc: 'quản lý state Vue (Pinia) vs props/emit khi app lớn, tối ưu bảng 10.000 dòng (virtual scroll, phân trang server), xử lý form phức tạp với validate đồng bộ cả client và server (Bean Validation trả lỗi theo field)' },
  { kind: 'lab', category: 'gc', desc: '(1) **Humongous allocation trên G1**: GC log JDK 17 có nhiều "Pause Young (Concurrent Start) (G1 Humongous Allocation)", region size 4M, mảng byte 3MB từ export Excel; sửa: stream export, tăng G1HeapRegionSize. (2) **Metaspace tăng mãi do tạo class động**: log "Metaspace" tăng sau mỗi lần reload script/Groovy, Full GC (Metadata GC Threshold); sửa cache class/classloader' },
  { kind: 'quiz', topic: 'security', desc: 'Spring Security 6 SecurityFilterChain, JWT (ký, hết hạn, refresh token rotation), CSRF khi dùng cookie, OAuth2 Authorization Code + PKCE, lưu mật khẩu (BCrypt/Argon2), SQL injection qua ORDER BY động, IDOR' },
  { kind: 'q', topic: 'architecture', n: 3, desc: 'chọn modular monolith vs microservices cho team 8 người, tách dần monolith bằng strangler fig có số liệu, ADR (Architecture Decision Record) — cách viết và ví dụ' },
  { kind: 'lesson', track: 'design', file: 'lessons-design.js', desc: '(1) Strategy + Factory thay cho chuỗi if/else theo loại sản phẩm (phí giao dịch theo kênh); (2) Outbox pattern — bài tập mô phỏng ghi đơn hàng + outbox trong cùng "transaction" giả và relay gửi event đúng 1 lần theo id' },
  { kind: 'quiz', topic: 'kotlin', desc: 'null safety, data class, extension function, scope function (let/apply/also/run), sealed class + when, coroutines suspend/launch/async, gọi qua lại với Java (@JvmStatic, @JvmOverloads)' },
  { kind: 'q', topic: 'behavioral', n: 3, desc: 'bất đồng kỹ thuật với tech lead về kiến trúc, nhận một hệ thống legacy không có test và phải giao tính năng trong 2 tuần, mentor junior viết code chậm/lỗi nhiều — trả lời theo STAR có số liệu' },
  { kind: 'lab', category: 'sql', desc: '(1) **Index không được dùng do ép kiểu ngầm**: cột phone varchar so với tham số numeric, EXPLAIN PostgreSQL Seq Scan + Filter ((phone)::numeric = ...); sửa đúng kiểu tham số. (2) **Deadlock giữa 2 transaction cập nhật số dư theo thứ tự khác nhau**: log PostgreSQL "deadlock detected" có Process/transaction id; sửa: khoá theo thứ tự id cố định' },
  { kind: 'quiz', topic: 'architecture', desc: 'Hexagonal/Clean architecture, modular monolith, strangler fig, CQRS khi nào đáng, event sourcing trade-off, saga orchestration vs choreography, ADR' },
  { kind: 'q', topic: 'jvm', n: 3, desc: 'chọn GC cho service latency thấp (G1 vs ZGC generational JDK 21) có số liệu, container memory: -XX:MaxRAMPercentage và vì sao pod bị OOMKilled dù heap chưa đầy (native memory, thread stack, direct buffer), đọc JFR để tìm allocation hotspot' },
  { kind: 'bug', desc: '(1) **Kafka consumer xử lý trùng sau rebalance**: commit offset sau khi xử lý xong cả batch, rebalance giữa chừng làm batch chạy lại, khách bị trừ điểm 2 lần — mô phỏng consumer + broker giả bằng Java thuần, sửa bằng idempotency key lưu bảng processed_event. (2) **Retry không backoff gây retry storm**: 3 tầng service mỗi tầng retry 3 lần → 27 lần gọi xuống DB khi DB chậm — mô phỏng với đồng hồ giả, sửa bằng retry ở một tầng + exponential backoff + jitter + budget' },
  { kind: 'quiz', topic: 'modern', desc: 'record, sealed class, pattern matching instanceof/switch (Java 21), text block, var, Stream API (Collectors, teeing, toList bất biến), Optional dùng đúng/sai, virtual threads cơ bản' },
  { kind: 'lesson', track: 'testing', file: 'lessons-testing.js', desc: '(1) Test double: stub vs mock vs fake vs spy — bài tập tự viết fake repository và đếm lời gọi; (2) Test code phụ thuộc thời gian bằng Clock cố định — bài tập tính phí trễ hạn theo ngày với Clock.fixed' },
  { kind: 'q', topic: 'aws', n: 3, desc: 'thiết kế VPC cho hệ thống ngân hàng (subnet private, NAT, VPC endpoint cho S3/Secrets Manager), RDS PostgreSQL Multi-AZ vs read replica vs Aurora — failover mất bao lâu và ứng dụng Java cần làm gì (DNS TTL, Hikari), chi phí: tìm và cắt 30% hoá đơn AWS' },
  { kind: 'lab', category: 'incident', desc: '(1) **Chứng chỉ TLS hết hạn ở service nội bộ**: log Spring Boot "PKIX path validation failed: CertificateExpiredException" lúc 07:00, tỉ lệ lỗi thanh toán 100% ở 1 luồng; sửa + cảnh báo hết hạn trước 30 ngày. (2) **DNS cache của JVM giữ IP cũ sau failover RDS**: log "Connection refused" tới IP cũ 5 phút sau failover; sửa networkaddress.cache.ttl, Hikari maxLifetime' },
  { kind: 'quiz', topic: 'collections', desc: 'HashMap (resize, treeify, key mutable), ConcurrentHashMap (computeIfAbsent, không cho null), ArrayList vs LinkedList thực tế, TreeMap/NavigableMap, List.of bất biến, fail-fast iterator, PriorityQueue' },
  { kind: 'q', topic: 'security', n: 3, desc: 'quản lý secret trong Spring Boot trên Kubernetes/AWS (Secrets Manager, xoay vòng mật khẩu DB không downtime), chống brute force OTP/login (rate limit theo user + IP, lockout), audit log không thể sửa cho hệ thống tài chính' },
  { kind: 'quiz', topic: 'aws', desc: 'SQS vs SNS vs EventBridge vs Kinesis, Lambda cold start với Java (SnapStart), RDS Multi-AZ vs read replica, S3 consistency và storage class, IAM role cho ECS/EKS, VPC endpoint, CloudWatch alarm' },
  { kind: 'lesson', track: 'concurrency', file: 'lessons-concurrency.js', desc: '(1) Semaphore và rate limit đồng thời gọi đối tác (tối đa 20 request song song) — bài tập tự chấm với CountDownLatch; (2) Structured concurrency về mặt khái niệm và cách làm tương đương trên Java 17 bằng ExecutorService + Future có timeout, huỷ các tác vụ còn lại khi một tác vụ lỗi' },
  { kind: 'q', topic: 'english', n: 4, desc: 'phỏng vấn tiếng Anh: walk me through a production incident you led, explain eventual consistency to a product manager, how do you estimate a feature with unclear requirements, describe a time you pushed back on a deadline — đáp án có bản trả lời mẫu tiếng Anh tự nhiên và từ vựng nên dùng' },
  { kind: 'bug', desc: '(1) **BigDecimal so sánh bằng equals**: 10.0 và 10.00 bị coi là khác nhau, giao dịch đối soát báo lệch 1.200 bản ghi — sửa bằng compareTo / chuẩn hoá scale. (2) **Làm tròn tiền sai khi chia phí cho nhiều phần**: chia 100.000đ cho 3 phần bằng HALF_UP bị lệch 1đ tổng — sửa bằng phân bổ phần dư cho phần cuối, test tổng luôn bằng gốc' },
  { kind: 'quiz', topic: 'db', desc: 'isolation level PostgreSQL (Read Committed vs Repeatable Read vs Serializable thực tế), MVCC và VACUUM, index B-tree vs GIN vs BRIN, partial/covering index, lock row vs advisory lock, connection pool sizing' },
  { kind: 'q', topic: 'devops', n: 3, desc: 'rollout an toàn trên Kubernetes cho service Java (readinessProbe vs livenessProbe vs startupProbe, graceful shutdown, preStop), canary với số liệu SLO và tự rollback, quản lý cấu hình nhiều môi trường không lộ secret' },
  { kind: 'quiz', topic: 'jpa', desc: 'dirty checking và flush mode, LazyInitializationException ngoài transaction, N+1 với fetch join vs @EntityGraph vs batch size, orphanRemoval vs CascadeType.REMOVE, optimistic lock @Version, equals/hashCode của entity' },
  { kind: 'quiz', topic: 'frontend', desc: 'Vue 3: ref vs reactive, computed vs watch, key trong v-for, lifecycle onMounted/onUnmounted, axios interceptor refresh token, CORS preflight với Spring Security, SPA fallback index.html khi deploy cùng Spring Boot' },
  // ---- batch 2 (2026-11-23): 2-day unattended run; interleaved across files so chains run in parallel ----
  { kind: 'q', topic: 'concurrency', n: 3, desc: 'virtual threads trên Spring Boot 3.2+ (spring.threads.virtual.enabled): pinning với synchronized trên JDK 21, ThreadLocal và MDC, khi nào KHÔNG nên bật; CompletableFuture timeout + fallback (orTimeout, completeOnTimeout); thiết kế bulkhead khi gọi 3 đối tác chậm' },
  { kind: 'lab', category: 'sql', desc: '(1) **Báo cáo chậm do thống kê lỗi thời**: EXPLAIN ANALYZE PostgreSQL rows ước lượng 120 nhưng thực tế 1.800.000, chọn Nested Loop; sửa ANALYZE, autovacuum_analyze_scale_factor theo bảng. (2) **Bảng bị bloat do transaction mở lâu**: pg_stat_activity có session "idle in transaction" 6 giờ, n_dead_tup tăng, query chậm dần; sửa idle_in_transaction_session_timeout, sửa code giữ transaction' },
  { kind: 'quiz', topic: 'concurrency', desc: 'volatile vs synchronized vs Atomic*, happens-before, ExecutorService sizing, CompletableFuture (thenApply vs thenCompose, exceptionally, thread chạy callback), ConcurrentHashMap.compute, điều kiện deadlock, virtual threads pinning' },
  { kind: 'lesson', track: 'jpa', file: 'lessons-jpa.js', desc: '(1) Persistence context và dirty checking — bài tập tự viết "persistence context" nhỏ lưu snapshot và sinh UPDATE chỉ cho field đổi; (2) Optimistic locking với @Version — bài tập mô phỏng 2 transaction cập nhật cùng bản ghi, phát hiện xung đột và retry' },
  { kind: 'bug', desc: '(1) **Đếm hạn mức sai khi nhiều request song song**: check-then-act đọc số đã dùng rồi cộng, 2 request cùng lúc vượt hạn mức 50 triệu/ngày — mô phỏng bằng CountDownLatch, sửa bằng cập nhật nguyên tử có điều kiện (mô phỏng UPDATE ... WHERE used + x <= limit bằng compare-and-set). (2) **SimpleDateFormat dùng chung giữa các thread**: parse ngày sai ngẫu nhiên trong batch import — sửa bằng DateTimeFormatter bất biến; test nhiều thread có latch' },
  { kind: 'q', topic: 'microservices', n: 3, desc: 'API gateway vs BFF cho app mobile + web của ngân hàng, service mesh (Istio) có đáng với 15 service không, distributed tracing với OpenTelemetry + Micrometer Tracing trên Spring Boot 3: propagate trace qua Kafka' },
  { kind: 'sd', desc: '(1) **Hệ thống trả góp / BNPL**: duyệt hạn mức trong 3 giây, lịch trả nợ, nhắc nợ, phạt trễ hạn, đối soát với đối tác bán hàng. (2) **Hệ thống eKYC mở tài khoản online**: chụp CCCD + selfie, đọc chip NFC, hàng đợi duyệt thủ công, lưu ảnh an toàn, 50.000 hồ sơ/ngày' },
  { kind: 'quiz', topic: 'jvm', desc: 'heap vs metaspace vs stack vs direct memory, G1 vs ZGC, đọc GC log JDK 17, jcmd/jstack/jmap/JFR dùng khi nào, các loại OOM, -XX:MaxRAMPercentage trong container, JIT warm-up, class loading' },
  { kind: 'q', topic: 'sql', n: 3, desc: 'window function cho báo cáo (ROW_NUMBER lấy giao dịch mới nhất mỗi tài khoản, SUM OVER số dư luỹ kế), phân trang keyset vs OFFSET có số liệu trên 50 triệu dòng, partition bảng giao dịch theo tháng trong PostgreSQL: lợi ích, cạm bẫy (unique key, query không có điều kiện partition)' },
  { kind: 'lesson', track: 'spring', file: 'lessons-spring.js', desc: '(1) Vòng đời bean và BeanPostProcessor — bài tập tự viết container nhỏ gọi init/destroy và một post-processor bọc proxy log thời gian; (2) @Async và thread pool — bài tập mô phỏng proxy chạy method trên executor riêng, lỗi khi gọi nội bộ' },
  { kind: 'lab', category: 'thread', desc: '(1) **Scheduled job trễ dần và dồn việc**: @Scheduled(fixedRate = 60000) nhưng job mất 90s, TaskScheduler mặc định 1 thread nên các lần chạy nối tiếp và trễ dần, job khác cùng scheduler bị chặn (thread dump chỉ thấy scheduling-1 bận); sửa pool size, fixedDelay, ShedLock khi nhiều instance. (2) **Log ghi đồng bộ làm chậm request**: jstack nhiều thread http-nio BLOCKED tại ch.qos.logback.core.OutputStreamAppender chờ cùng lock; sửa AsyncAppender, giảm log' },
  { kind: 'quiz', topic: 'microservices', desc: 'circuit breaker (Resilience4j: CLOSED/OPEN/HALF_OPEN, sliding window), retry + idempotency, saga, outbox, service discovery, API gateway, distributed tracing, consumer group Kafka và thứ tự message theo key' },
  { kind: 'q', topic: 'ai', n: 3, desc: 'đánh giá chất lượng RAG trước khi lên production (bộ câu hỏi vàng, recall@k, faithfulness, LLM-as-judge và cạm bẫy), chống prompt injection qua tài liệu được truy xuất, kiểm soát chi phí LLM theo team (quota, cache, chọn model nhỏ cho tác vụ đơn giản)' },
  { kind: 'bug', desc: '(1) **Memory leak do listener không gỡ**: service đăng ký listener vào event bus mỗi request, sau 2 ngày heap đầy — mô phỏng event bus giữ strong reference, test đếm listener sau N request; sửa gỡ listener / đăng ký một lần. (2) **hashCode đổi sau khi add vào HashSet**: entity đổi field dùng trong hashCode, remove không được, đối soát đếm sai — sửa hashCode dựa trên id bất biến' },
  { kind: 'lesson', track: 'microservices', file: 'lessons-microservices.js', desc: '(1) Circuit breaker từ bên trong — bài tập tự viết circuit breaker 3 trạng thái với Clock giả và sliding window đếm lỗi; (2) Idempotency key cho API thanh toán — bài tập lưu kết quả theo key, request lặp trả cùng kết quả, request khác payload cùng key bị từ chối' },
  { kind: 'q', topic: 'api', n: 3, desc: 'versioning API khi có 40 client mobile không update kịp, thiết kế lỗi chuẩn RFC 9457 (ProblemDetail trong Spring 6), webhook gửi cho đối tác: ký HMAC, retry, thứ tự, chống replay' },
  { kind: 'quiz', topic: 'api', desc: 'REST status code đúng tình huống (409 vs 422 vs 400, 202 cho tác vụ dài), idempotency PUT/POST/PATCH, ETag + If-Match, phân trang cursor, ProblemDetail, HTTP caching header, gRPC vs REST' },
  { kind: 'lab', category: 'incident', desc: '(1) **Consumer Kafka lag tăng do rebalance liên tục**: log "consumer poll timeout has expired" / rời group vì xử lý 500 bản ghi mất 6 phút > max.poll.interval.ms 300000; sửa max.poll.records, xử lý nhanh hơn, cooperative rebalancing. (2) **Redis hết bộ nhớ làm cache lỗi**: log "OOM command not allowed when used memory > \'maxmemory\'", key không có TTL; sửa TTL, maxmemory-policy allkeys-lru, giám sát' },
  { kind: 'q', topic: 'jpa', n: 3, desc: 'batch insert 1 triệu bản ghi với Hibernate 6 (hibernate.jdbc.batch_size, IDENTITY làm tắt batch insert, SEQUENCE + pooled optimizer, clear persistence context), projection DTO vs entity cho màn hình danh sách, second-level cache: khi nào nên/không nên' },
  { kind: 'sd', desc: '(1) **Hệ thống tích điểm loyalty cho chuỗi bán lẻ 3.000 cửa hàng**: cộng/trừ điểm, hết hạn điểm theo lô, đổi quà, chống gian lận, báo cáo. (2) **Hệ thống thu hộ / thanh toán hoá đơn (điện, nước, học phí)**: tra cứu hoá đơn từ nhà cung cấp, gạch nợ, đối soát cuối ngày, xử lý timeout khi đối tác chậm' },
  { kind: 'lesson', track: 'db', file: 'lessons-db.js', desc: '(1) Isolation level và các hiện tượng (dirty read, non-repeatable read, phantom, lost update) — bài tập mô phỏng 2 transaction trên bảng giả để thấy lost update và cách sửa bằng khoá/compare-and-set; (2) Index B-tree hoạt động thế nào — bài tập tìm kiếm khoảng trên mảng đã sắp xếp và so sánh số bước với quét toàn bộ' },
  { kind: 'quiz', topic: 'sql', desc: 'JOIN và NULL, GROUP BY + HAVING, window function, EXISTS vs IN vs JOIN, index composite và thứ tự cột, đọc EXPLAIN (Seq Scan/Index Scan/Bitmap), NOT IN với NULL, UPSERT ON CONFLICT' },
  { kind: 'q', topic: 'design', n: 3, desc: 'thiết kế hệ thống đặt lịch khám cho chuỗi 50 phòng khám (giữ slot, hết hạn giữ chỗ, lịch bác sĩ), import file Excel 500.000 dòng không làm treo app, xuất hoá đơn điện tử gửi cơ quan thuế với retry và đối soát' },
  { kind: 'bug', desc: '(1) **Phân trang OFFSET bỏ sót bản ghi khi job vừa đọc vừa cập nhật**: job lấy 1000 bản ghi status=PENDING, cập nhật DONE, trang sau OFFSET 1000 bỏ qua 1000 bản ghi — mô phỏng list giả, sửa luôn lấy trang đầu hoặc keyset theo id. (2) **Thứ tự sự kiện bị đảo khi publish bất đồng bộ**: event UPDATED đến trước CREATED vì gửi qua executor nhiều thread — sửa gửi theo key trên cùng hàng đợi / version và bỏ event cũ' },
  { kind: 'lab', category: 'gc', desc: '(1) **Pause dài với Parallel GC trên heap lớn**: GC log JDK 17 "Pause Full (Ergonomics)" 4.2s trên heap 24G, p99 API 5s; sửa chuyển G1/ZGC, MaxGCPauseMillis. (2) **Allocation rate cao do ghép chuỗi log**: GC log Pause Young mỗi 300ms, JFR allocation top là StringBuilder từ log.debug ghép chuỗi; sửa placeholder {} và isDebugEnabled' },
  { kind: 'q', topic: 'aws', n: 3, desc: 'chạy Spring Boot trên ECS Fargate vs EKS vs Lambda: chi phí và vận hành cho team 6 người, DynamoDB thiết kế partition key cho bảng giao dịch tránh hot partition, multi-region active-passive cho hệ thống thanh toán: RPO/RTO và chi phí' },
  { kind: 'quiz', topic: 'devops', desc: 'Dockerfile multi-stage cho Spring Boot (layered jar), Kubernetes probe, requests/limits và CPU throttling, rolling update vs blue-green vs canary, Helm values, cache trong GitHub Actions, Prometheus metric types (counter/gauge/histogram)' },
  { kind: 'lesson', track: 'security', file: 'lessons-security.js', desc: '(1) JWT từ bên trong — bài tập tự ký và kiểm tra HMAC-SHA256 bằng javax.crypto.Mac, kiểm tra exp và từ chối alg sai; (2) Lưu mật khẩu đúng cách — bài tập PBKDF2 (SecretKeyFactory PBKDF2WithHmacSHA256) với salt, so sánh hằng thời gian (MessageDigest.isEqual)' },
  { kind: 'q', topic: 'core', n: 3, desc: 'String immutability và string pool trong thực tế (intern, String deduplication của G1), xử lý exception ở tầng service: checked vs unchecked, wrap và giữ cause, generic wildcard (PECS) với ví dụ API thật' },
  { kind: 'sd', desc: '(1) **Đặt phòng khách sạn nhiều kênh (website + OTA)**: chống overbooking, giữ phòng tạm, đồng bộ tồn phòng với các OTA, huỷ và hoàn tiền. (2) **Quản lý kho và giao hàng chặng cuối**: tồn kho nhiều kho, giữ hàng khi đặt, phân tuyến shipper, theo dõi trạng thái đơn realtime' },
  { kind: 'lab', category: 'sql', desc: '(1) **ALTER TABLE giờ cao điểm làm treo API**: pg_locks có AccessExclusiveLock đang chờ, hàng trăm query xếp hàng sau nó; sửa lock_timeout, migration an toàn (cột nullable, CREATE INDEX CONCURRENTLY). (2) **Query chậm do OR giữa 2 cột**: EXPLAIN Seq Scan với Filter (a = x OR b = y) dù có 2 index; sửa UNION ALL hoặc để planner dùng BitmapOr, đo lại' },
  { kind: 'quiz', topic: 'core', desc: 'equals/hashCode contract, String immutability, autoboxing và Integer cache (== giữa Integer), checked/unchecked exception, try-with-resources, generics erasure và PECS, final/static, pass-by-value' },
  { kind: 'q', topic: 'remote', n: 3, desc: 'làm remote cho công ty nước ngoài: viết design doc bất đồng bộ để team khác múi giờ review, báo cáo tiến độ khi bị chặn bởi team khác, xử lý sự cố production lúc 2 giờ sáng giờ Việt Nam khi on-call' },
  { kind: 'lesson', track: 'devops', file: 'lessons-devops.js', desc: '(1) Graceful shutdown — bài tập mô phỏng server nhận tín hiệu dừng: ngừng nhận request mới, chờ request đang chạy xong trong timeout, đóng pool; (2) Readiness vs liveness — bài tập mô phỏng probe với DB chậm và giải thích vì sao liveness không nên kiểm tra DB' },
  { kind: 'bug', desc: '(1) **Rò rỉ connection khi exception**: không đóng Connection trong nhánh lỗi, sau 300 lỗi parse pool 10 connection cạn, mọi request chờ 30s — mô phỏng pool giả đếm connection đang mượn, sửa try-with-resources. (2) **Gọi đối tác không có timeout**: đối tác treo làm 200 thread kẹt — mô phỏng với executor và future giả, sửa timeout + bulkhead' },
  { kind: 'q', topic: 'spring', n: 3, desc: 'Spring Boot auto-configuration hoạt động thế nào và cách viết starter nội bộ cho 20 service, @ConfigurationProperties + validation, observability với Micrometer: đặt tên metric và tag tránh high cardinality' },
  { kind: 'quiz', topic: 'banking', desc: 'double-entry ledger, idempotency trong chuyển tiền, đối soát, giao dịch treo, ISO 8583 vs ISO 20022 ở mức khái niệm, PCI DSS cơ bản (không lưu CVV), làm tròn tiền với BigDecimal, giờ cut-off' },
  { kind: 'lab', category: 'incident', desc: '(1) **Đĩa đầy vì log không xoay vòng**: log "No space left on device", ứng dụng không ghi được file upload, logback không có RollingPolicy/totalSizeCap; sửa + cảnh báo đĩa. (2) **Đổi package của event làm consumer cũ không deserialize được message Kafka**: log lỗi không tìm thấy type sau deploy; sửa schema tương thích ngược, type mapping, rollback an toàn' },
  { kind: 'q', topic: 'collections', n: 3, desc: 'cache LRU trong bộ nhớ (LinkedHashMap accessOrder + removeEldestEntry) và giới hạn khi đa luồng, đếm top-K sản phẩm bán chạy trong luồng sự kiện (HashMap + PriorityQueue), Collections.unmodifiableList vs List.copyOf vs List.of khi trả về từ API' },
  { kind: 'lesson', track: 'jvm', file: 'lessons-jvm.js', desc: '(1) Đọc thread dump — bài tập phân tích chuỗi thread dump dạng text (cho sẵn trong code) để tìm deadlock và lock bị chờ nhiều nhất; (2) Memory leak điển hình — bài tập mô phỏng cache static không giới hạn, đo kích thước và sửa bằng giới hạn + LRU' },
  { kind: 'sd', desc: '(1) **Chấm công cho 20.000 công nhân nhà máy**: máy chấm công gửi dữ liệu offline/online, tính công theo ca, ca đêm qua ngày, khiếu nại. (2) **QR thanh toán cho merchant (VietQR)**: sinh QR tĩnh/động, nhận thông báo biến động số dư, khớp đơn, xử lý chuyển thiếu/thừa' },
  { kind: 'quiz', topic: 'ai', desc: 'RAG pipeline (chunking, embedding, top-k, rerank), hallucination và cách giảm, temperature, context window và chi phí token, prompt injection, tool calling, đánh giá LLM, vector index HNSW trade-off' },
  { kind: 'q', topic: 'testing', n: 3, desc: 'chiến lược test cho hệ thống chuyển tiền (unit, integration, contract, E2E: tỉ lệ và thứ tự), test idempotency và retry với WireMock giả lỗi, mutation testing (PIT) có đáng chạy không và đọc kết quả thế nào' },
  { kind: 'bug', desc: '(1) **Cache key thiếu tham số trả dữ liệu sai người**: @Cacheable key chỉ theo productId nhưng giá phụ thuộc hạng thành viên, khách thường thấy giá VIP — mô phỏng cache Map, sửa key gồm tier. (2) **Tràn số int khi cộng tiền theo đồng**: tổng doanh thu tháng vượt 2.147.483.647 thành số âm — sửa long/BigDecimal, Math.addExact để phát hiện' },
  { kind: 'lesson', track: 'api', file: 'lessons-api.js', desc: '(1) Rate limiting token bucket — bài tập tự cài token bucket với Clock giả, nhiều client độc lập; (2) Phân trang cursor — bài tập mã hoá cursor (id + createdAt) Base64, trang kế tiếp ổn định khi có bản ghi mới chèn vào' },
  { kind: 'q', topic: 'scenario', n: 3, desc: 'tình huống: bảng production bị xoá nhầm lúc 15:00 — các bước khôi phục (PITR) và giao tiếp; sau deploy CPU tăng từ 30% lên 90% — điều tra bằng JFR/async-profiler; đối tác báo nhận webhook trùng 3 lần — tìm nguyên nhân và sửa' },
  { kind: 'quiz', topic: 'design', desc: 'ước lượng tải (QPS, dung lượng), cache-aside vs write-through, consistent hashing, sharding theo key, replication đồng bộ/bất đồng bộ, CAP/PACELC thực tế, idempotency, queue vs stream, CDN' },
  { kind: 'lab', category: 'thread', desc: '(1) **parallelStream cho I/O làm nghẽn cả service**: jstack thấy ForkJoinPool.commonPool-worker-* bận gọi HTTP từ nhiều request, request khác chờ; sửa bỏ parallelStream cho I/O, executor riêng. (2) **Deadlock khi chuyển tiền 2 chiều**: jstack "Found one Java-level deadlock" giữa transfer-1 và transfer-2 trên 2 monitor Account; sửa khoá theo thứ tự id' },
  { kind: 'q', topic: 'banking', n: 3, desc: 'tính lãi tiền gửi/tiền vay theo ngày (actual/365, làm tròn, ngày nghỉ), giờ cut-off giao dịch liên ngân hàng và ngày làm việc kế tiếp, tích hợp với core banking cũ qua lớp middleware/ESB: timeout, đối soát, giới hạn throughput' },
  { kind: 'lesson', track: 'banking', file: 'lessons-banking.js', desc: '(1) Sổ cái double-entry — bài tập ghi bút toán nợ/có, kiểm tra cân bằng, không cho số dư âm; (2) Đối soát — bài tập so khớp 2 danh sách giao dịch (nội bộ vs đối tác) theo mã tham chiếu, phân loại khớp / lệch số tiền / chỉ có một bên' },
  { kind: 'sd', desc: '(1) **Nền tảng form/khảo sát trực tuyến 1 triệu lượt trả lời mỗi ngày**: form động, chống spam, xuất báo cáo, webhook. (2) **Log tập trung cho 200 service**: thu thập, lưu nóng/lạnh, tìm kiếm, cảnh báo, chi phí lưu 30 ngày' },
  { kind: 'quiz', topic: 'spring', desc: 'proxy và @Transactional (self-invocation, private method, REQUIRES_NEW, rollback với checked exception), bean scope, @Async, auto-configuration và @ConditionalOnMissingBean, profile, bảo vệ Actuator' },
  { kind: 'q', topic: 'english', n: 4, desc: 'phỏng vấn tiếng Anh vòng technical: explain how a HashMap works, describe your current system architecture in 2 minutes, what would you do if a deployment breaks production, tell me about a time you improved performance — có bản trả lời mẫu tiếng Anh tự nhiên, từ vựng và lỗi người Việt hay mắc' },
  { kind: 'bug', desc: '(1) **Sai múi giờ khi tính hạn chót cuối ngày**: so sánh LocalDateTime.now() trên server UTC với hạn 23:59 giờ Việt Nam, khách bị phạt trễ hạn sai 7 giờ — test với Clock cố định và ZoneId, sửa theo Asia/Ho_Chi_Minh. (2) **Double-checked locking thiếu volatile**: giải thích rủi ro và sửa bằng holder idiom / enum; test xác định số instance được tạo' },
  { kind: 'lesson', track: 'architecture', file: 'lessons-architecture.js', desc: '(1) Hexagonal architecture — bài tập tách domain khỏi adapter: port + adapter giả, test domain không cần DB; (2) Event sourcing cơ bản — bài tập dựng lại số dư từ chuỗi event, snapshot mỗi N event' },
  { kind: 'q', topic: 'devops', n: 3, desc: 'giảm thời gian CI từ 25 phút xuống dưới 10 phút cho monorepo Java (cache Maven/Gradle, test song song, chỉ build module đổi), image container nhỏ và an toàn (distroless, non-root, quét CVE), chọn 4 golden signals và viết alert không gây mệt mỏi' },
  { kind: 'quiz', topic: 'behavioral', desc: 'tình huống hành vi: ưu tiên khi bị giao 3 việc gấp, nhận lỗi production do mình gây ra, phản hồi code review khó chịu, đàm phán deadline, onboard người mới — chọn cách xử lý thể hiện tư duy senior' },
  { kind: 'lab', category: 'incident', desc: '(1) **Thundering herd khi cache key nóng hết hạn**: log 3.000 query giống nhau xuống DB trong 2 giây lúc 09:00:00, CPU DB 100%; sửa single-flight/lock, TTL ngẫu nhiên, refresh trước hạn. (2) **Client mobile retry tạo đơn trùng**: log cùng orderRequestId xuất hiện 3 lần cách 5s khi mạng chậm; sửa idempotency key + unique constraint' },
  { kind: 'q', topic: 'security', n: 3, desc: 'phân quyền RBAC vs ABAC cho back-office ngân hàng (maker-checker), bảo vệ dữ liệu cá nhân ở mức kỹ thuật (mã hoá cột, masking log, quyền truy cập theo vai trò), xử lý khi phát hiện lộ API key trên GitHub' },
  { kind: 'lesson', track: 'collections', file: 'lessons-collections.js', desc: '(1) TreeMap và NavigableMap — bài tập tra biểu phí theo bậc (floorEntry) và tìm khung giờ trống; (2) Iterator fail-fast và ConcurrentModificationException — bài tập xoá phần tử đúng cách (removeIf, iterator.remove) và giải thích modCount' },
  { kind: 'sd', desc: '(1) **Chấm điểm tín dụng cho khoản vay tiêu dùng**: thu thập dữ liệu, chạy luật + model, giải thích kết quả, audit, phản hồi dưới 5 giây. (2) **Livestream bán hàng có giỏ hàng và mã giảm giá trong phiên**: 100.000 người xem, đặt hàng đồng thời khi chốt deal, chống oversell' },
  { kind: 'quiz', topic: 'autotest', desc: 'Selenium/Playwright: locator ổn định, explicit wait vs implicit wait, Page Object Model, test API bằng RestAssured, chạy song song, flaky test, báo cáo Allure, tích hợp CI' },
  { kind: 'q', topic: 'modern', n: 3, desc: 'record cho DTO và JPA projection (vì sao không dùng record làm entity), sealed interface + switch pattern xử lý kết quả thanh toán (Java 21), SequencedCollection và các API mới Java 21 hữu ích trong code nghiệp vụ' },
];

function readState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch { return { next: 0, round: 0 }; } }

function allTaskFiles() {
  const list = d => (fs.existsSync(d) ? fs.readdirSync(d).filter(f => /^T\d+.*\.md$/.test(f)).map(f => path.join(d, f)) : []);
  return [...list(TASKS), ...list(BACKLOG)];
}
const num = f => Number(path.basename(f).match(/^T(\d+)/)[1]);

const files = allTaskFiles();
let nextId = Math.max(0, ...files.map(num)) + 1;
// last task (highest number) owning each data file → chain new tasks after it
const lastOwner = {};
for (const f of files.sort((a, b) => num(a) - num(b))) {
  const m = fs.readFileSync(f, 'utf8').match(/^Owns:(.*)$/m);
  if (!m) continue;
  for (const o of m[1].match(/`[^`]+`/g) || []) lastOwner[o.replace(/`/g, '')] = 'T' + num(f);
}

const RULES = file => `## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng \`);\` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không \`\${\` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, Kafka 3.x, AWS hiện hành, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.
- Nếu một ý trong chủ đề đã có trong file thì chọn góc khác gần nhất chưa có, ghi vào Notes.`;

const ACCEPT = (file, extra) => `## Nghiệm thu
\`node --check js/data/${file}\`; \`node scripts/build-light-index.js\`; \`node scripts/validate.js\` → \`OK — không có lỗi.\`${extra || ''} KHÔNG commit.
Xong: sửa dòng \`Status:\` đầu file thành \`Status: DONE\`, Notes ghi id đã thêm.`;

function build(t, round) {
  const again = round > 0 ? `\n\n> Vòng ${round + 1} của chủ đề này: các ý trên có thể đã được viết ở vòng trước — đọc file và chọn góc **chưa có** (tình huống khác, mức sâu hơn, lỗi production khác).` : '';
  let file, title, body, extra = '', slug;
  if (t.kind === 'q') {
    file = QFILE[t.topic]; slug = 'auto-q-' + t.topic;
    title = `${t.n} câu hỏi Senior Java (${t.topic}) vào ${file}`;
    body = `Thêm **${t.n} câu hỏi phỏng vấn mới** (topic: ${t.topic}) vào \`js/data/${file}\`. Id nối tiếp id lớn nhất của topic (\`node scripts/qtool.js list js/data/${file}\`); đọc danh sách để **không trùng ý**.

Chủ đề: ${t.desc}.${again}

Mỗi câu theo AGENTS.md mục 4 và 6: \`**Tóm tắt:**\` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment hoặc ~~~seq cho luồng nhiều bên → bảng trade-off / khi nào dùng → pitfall production → \`### Ví dụ đời thực\` có số liệu → \`### Trả lời mẫu khi phỏng vấn\` (150–220 từ) → \`> Senior tip:\`; \`follow\` 2–3 câu. Level: chủ yếu senior, 1 câu lead.${t.topic === 'english' ? ' Câu hỏi topic english có `lang: \'en\'`.' : ''}`;
  } else if (t.kind === 'quiz') {
    file = QUIZ_FILE[t.topic] || 'quiz-gaps.js'; slug = 'auto-quiz-' + t.topic;
    title = `10 câu trắc nghiệm (${t.topic}) vào ${file}`;
    body = `Thêm **10 câu trắc nghiệm** vào \`js/data/${file}\` (topic \`${t.topic}\`; id \`qz-${t.topic}-NNN\` nối tiếp số lớn nhất của topic trong mọi file quiz: \`grep -ho "qz-${t.topic}-[0-9]*" js/data/quiz*.js | sort -V | tail -1\`).

Chủ đề: ${t.desc}. Chỉ hỏi kiến thức chắc chắn đúng; khác với các câu qz-${t.topic} đã có.${again}

Theo AGENTS.md mục "Câu trắc nghiệm": dạng tình huống/đoạn code thật, không hỏi định nghĩa suông; khoảng 1/4 là \`multi: true\` (Chọn 2); đáp án đúng rải đều vị trí; \`explain\` giải thích vì sao đúng **và vì sao từng phương án sai** là sai.`;
  } else if (t.kind === 'lesson') {
    file = t.file; slug = 'auto-lessons-' + t.track;
    title = `2 bài học (${t.track}) vào ${file}`;
    body = `Thêm **2 bài học mới** (track \`${t.track}\`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu \`lesson-collections-001\`** (\`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001\`) và các bài đã có trong file để không trùng.

Nội dung: ${t.desc}.${again}

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm (chỉ JDK chuẩn, Java 17, không class public ngoài Main), tests ≥ 3 case deterministic, reference pass 100%, starter biên dịch được và không pass hết; 2–4 câu check; related là id câu hỏi có thật.`;
    extra = ' `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết).';
  } else if (t.kind === 'lab') {
    file = `labs-${t.category}.js`; slug = 'auto-labs-' + t.category;
    title = `2 debug lab (${t.category}) vào ${file}`;
    body = `Đọc AGENTS.md mục 10 (Debug lab) và HẾT các lab trong \`js/data/${file}\` để không trùng tình huống. id \`lab-${t.category}-NNN\` nối tiếp số lớn nhất. Thêm **2 lab** level senior:

${t.desc}.${again}

Artifact phải giống THẬT (đúng định dạng jstack / GC log JDK 17+ / EXPLAIN PostgreSQL / log Spring Boot) và **tự nhất quán**: tên thread, lock id \`<0x...>\`, timestamp, số liệu khớp nhau và khớp \`answer\`. \`answer\` có ### Nguyên nhân gốc / ### Dẫn chứng (trích dòng cụ thể) / ### Cách sửa / ### Phòng ngừa; rubric ≥ 3 ý; hints ≥ 2.`;
  } else if (t.kind === 'bug') {
    file = 'bugs.js'; slug = 'auto-bugs';
    title = '2 bài sửa bug production Java vào bugs.js';
    body = `Thêm **2 bài** (bug-NNN nối tiếp) theo AGENTS.md mục 17, **đọc kỹ bug-001** và danh sách bài có sẵn để không trùng: ${t.desc}.${again}

Test phải **tái hiện bug một cách xác định** (latch/barrier, fake repository đếm query, Clock cố định…), reference pass 100% (≥ 3 test), starter biên dịch được và KHÔNG pass hết. Chỉ JDK chuẩn, không class public ngoài Main, Java 17. \`related\` là id câu hỏi có thật (dùng để hiện bài trên lộ trình).`;
    extra = ' `node scripts/test-bugs.js` (reference pass hết, starter biên dịch được và không pass hết).';
  } else if (t.kind === 'sd') {
    file = 'sd-problems.js'; slug = 'auto-sd';
    title = 'System design: 2 đề mới vào sd-problems.js';
    body = `Thêm **2 đề system design mới** vào \`js/data/sd-problems.js\` (id \`sd-NNN\` nối tiếp đề cuối). **Đọc kỹ 2–3 đề có sẵn** và giữ đúng schema (id, title, kind, level, prompt, phases, rubric, reference, followups, related) cùng độ sâu: yêu cầu chức năng/phi chức năng, ước lượng tải có phép tính, API, data model, kiến trúc (~~~seq cho luồng chính), deep dive điểm khó, trade-off, sự cố hay gặp. Đọc danh sách tiêu đề đề cũ để **không trùng**.

Đề: ${t.desc}.${again}`;
  }
  const id = 'T' + nextId++;
  const after = lastOwner['js/data/' + file];
  lastOwner['js/data/' + file] = id;
  const text = `# ${id} — ${title}

Status: TODO
Agent: kilo
Owns: \`js/data/${file}\`
${after ? 'After: ' + after + '\n' : ''}
${body}

${RULES(file)}

${ACCEPT(file, extra)}

## Notes
`;
  return { id, name: `${id}-${slug}.md`, text };
}

// SKIP_BUSY=1 (used by scripts/refill.sh): only themes whose data file has no open (TODO/DOING) or backlog owner,
// one task per file — so every generated task can start at once instead of queueing behind an After: chain.
const SKIP_BUSY = process.env.SKIP_BUSY === '1';
const fileOf = t => 'js/data/' + (t.kind === 'q' ? QFILE[t.topic] : t.kind === 'quiz' ? (QUIZ_FILE[t.topic] || 'quiz-gaps.js')
  : t.kind === 'lesson' ? t.file : t.kind === 'lab' ? `labs-${t.category}.js` : t.kind === 'sd' ? 'sd-problems.js' : 'bugs.js');
const busy = new Set();
if (SKIP_BUSY) {
  for (const f of files) {
    const s = fs.readFileSync(f, 'utf8');
    if (!f.startsWith(BACKLOG) && !/^Status: (TODO|DOING)/m.test(s)) continue;
    const m = s.match(/^Owns:(.*)$/m);
    for (const o of (m && m[1].match(/`[^`]+`/g)) || []) busy.add(o.replace(/`/g, ''));
  }
}

const st = readState();
const out = [];
for (let tries = 0; out.length < BATCH && tries < THEMES.length; tries++) {
  const t = THEMES[st.next % THEMES.length];
  const round = st.round + Math.floor(st.next / THEMES.length);
  st.next++;
  if (SKIP_BUSY) { const f = fileOf(t); if (busy.has(f)) continue; busy.add(f); }
  out.push(build(t, round));
}
if (!out.length) { console.log('mk-backlog: every theme file is busy — nothing written'); process.exit(0); }
if (st.next >= THEMES.length) { st.round += Math.floor(st.next / THEMES.length); st.next %= THEMES.length; }

for (const t of out) {
  if (DRY) { console.log('--- ' + t.name + '\n' + t.text.split('\n').slice(0, 6).join('\n')); continue; }
  fs.mkdirSync(BACKLOG, { recursive: true });
  fs.writeFileSync(path.join(BACKLOG, t.name), t.text);
}
if (!DRY) {
  fs.mkdirSync(path.dirname(STATE), { recursive: true });
  fs.writeFileSync(STATE, JSON.stringify(st));
  console.log('mk-backlog: wrote ' + out.map(t => t.id).join(' ') + ' → tasks/backlog/');
}
