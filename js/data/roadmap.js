/*
 * 26-week plan toward Senior Java interviews at Vietnamese banks / big tech.
 * Written by the integrator; rendered by js/views/roadmap.js (T17).
 * Week ids are stable keys for progress tracking: 'w01'..'w26', task key = '<weekId>-<index>'.
 */
window.ROADMAP = {
  goal: 'Senior Java Interview Prep — Big Tech & Banking, 26 tuần',
  targets: [
    { name: 'Ngân hàng / Fintech', examples: 'Techcombank, VPBank, MB, VIB, TPBank, ACB, MoMo, VNPay, ZaloPay',
      focus: ['Transaction & consistency, locking, isolation level', 'Bảo mật, audit log, compliance (PCI DSS, NHNN)', 'Oracle/PostgreSQL, tối ưu SQL, batch & đối soát', 'Kafka, idempotency, Saga/Outbox', 'Tình huống production & ổn định hệ thống'] },
    { name: 'Big tech / Product', examples: 'VNG, Zalo, Shopee, Grab, Axon, Employment Hero, FPT Software (offshore lớn), Viettel',
      focus: ['Thuật toán LeetCode easy–medium (~150 bài)', 'System design có ước lượng tải', 'Concurrency & JVM sâu', 'Phỏng vấn tiếng Anh (với công ty nước ngoài)', 'Behavioral theo STAR, ownership'] },
  ],
  project: {
    name: 'Dự án portfolio: Mini Payment / Wallet Service',
    desc: 'Xây xuyên suốt 6 tháng để có câu chuyện thực tế khi phỏng vấn: Spring Boot 3 + PostgreSQL + Redis + Kafka, ledger kế toán kép, idempotency key, Outbox, import CSV sao kê đối soát, observability, deploy AWS/Vercel cho frontend. Đưa lên GitHub kèm README kiến trúc + ADR.',
  },
  phases: [
    {
      name: 'Giai đoạn 1 — Nền tảng Java vững', weeks: [
        { id: 'w01', title: 'Core Java & đánh giá đầu vào', topics: ['core'], algo: '8 bài Easy: Array, Hash Map',
          tasks: ['Làm 1 phiên Phỏng vấn thử "Full loop" để biết điểm xuất phát', 'Ôn hết câu Core Java trong Ngân hàng câu hỏi, chấm trạng thái trung thực', 'Viết CV bản nháp theo format STAR cho từng dự án', 'Khởi tạo repo dự án portfolio (Spring Boot 3, Java 21)'] },
        { id: 'w02', title: 'Collections & HashMap internals', topics: ['collections'], algo: '8 bài: Two Pointers, Hash Map',
          tasks: ['Tự vẽ lại cấu trúc HashMap / ConcurrentHashMap từ trí nhớ', 'Đọc source java.util.HashMap (putVal, resize)', 'Làm Trắc nghiệm Collections ≥ 80%'] },
        { id: 'w03', title: 'Java 8 → 21 hiện đại', topics: ['modern'], algo: '8 bài: Sliding Window',
          tasks: ['Refactor 1 module cũ sang record, switch pattern matching, Stream', 'Dự án: thiết kế domain Account / Transaction / LedgerEntry'] },
        { id: 'w04', title: 'Tổng ôn Java + tuần đệm', topics: ['core', 'collections', 'modern'], algo: '6 bài: Stack, ôn lại bài sai',
          tasks: ['Flashcard chế độ "Chỉ câu chưa thuộc" đến khi ≥ 70% Đã thuộc', 'Phỏng vấn thử preset "Java Backend Senior" (5 câu)'] },
      ],
    },
    {
      name: 'Giai đoạn 2 — Concurrency & JVM (điểm phân loại Senior)', weeks: [
        { id: 'w05', title: 'Java Memory Model, lock, atomic', topics: ['concurrency'], algo: '4 bài ByteByteGo chương 8 (Stacks) — luyện ở #/algo, lọc theo pattern Stack',
          tasks: ['Viết demo race condition + sửa bằng 3 cách (synchronized, Lock, Atomic)', 'Dự án: chuyển tiền giữa 2 ví an toàn khi chạy song song (optimistic vs pessimistic)', 'LLD: Parking Lot (luyện ở #/learn, track architecture)'] },
        { id: 'w06', title: 'Thread pool, CompletableFuture, virtual threads', topics: ['concurrency'], algo: '4 bài ByteByteGo chương 9 (Heaps) — luyện ở #/algo, lọc theo pattern Heap',
          tasks: ['Benchmark platform thread vs virtual thread cho API gọi IO', 'Trả lời to (nói thành tiếng) 5 câu concurrency, bấm giờ 3 phút/câu', 'LLD: Elevator (luyện ở #/learn, track architecture)'] },
        { id: 'w07', title: 'JVM memory & GC', topics: ['jvm'], algo: '4 bài ByteByteGo chương 10 (Merge Intervals) — luyện ở #/algo, lọc theo pattern Interval',
          tasks: ['Tạo memory leak cố ý, lấy heap dump, phân tích bằng Eclipse MAT', 'Đọc GC log G1, thử ZGC trên Java 21', 'LLD: Notification service (luyện ở #/learn, track architecture)'] },
        { id: 'w08', title: 'Troubleshooting production', topics: ['jvm', 'scenario'], algo: '4 bài ByteByteGo chương 11 (Top K) — luyện ở #/algo, lọc theo pattern TopK',
          tasks: ['Mốc: giải medium trong 30 phút, giải thích happens-before + GC', 'LLD: Vending Machine (luyện ở #/learn, track architecture)', 'Phỏng vấn thử Java Backend Senior 8 câu, mục tiêu điểm TB ≥ 3.5'] },
      ],
    },
    {
      name: 'Giai đoạn 3 — Spring, JPA, Database (trọng tâm ngân hàng)', weeks: [
        { id: 'w09', title: 'Spring core, @Transactional, AOP', topics: ['spring'], algo: '5 bài ByteByteGo chương 12 (DP Knapsack) — luyện ở #/algo, lọc theo pattern DP',
          tasks: ['Tự chứng minh lỗi self-invocation @Transactional bằng test', 'Dự án: API chuyển tiền với idempotency key + ProblemDetail', 'LLD: Movie Booking (luyện ở #/learn, track architecture)', 'Mốc #/sd: 1 đề design tuần này (big tech): Rate limiter'] },
        { id: 'w10', title: 'JPA/Hibernate & hiệu năng', topics: ['jpa'], algo: '4 bài ByteByteGo chương 13 (DP Fibonacci) — luyện ở #/algo, lọc theo pattern DP',
          tasks: ['Bật SQL log, tìm và sửa N+1 trong dự án', 'Batch insert 1 triệu dòng: so sánh IDENTITY vs SEQUENCE', 'LLD: Splitwise (luyện ở #/learn, track architecture)', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Flash sale chống oversell'] },
        { id: 'w11', title: 'SQL, index, isolation, locking', topics: ['db'], algo: '5 bài ByteByteGo chương 14 (DP Palindromes) — luyện ở #/algo, lọc theo pattern DP',
          tasks: ['Đọc EXPLAIN ANALYZE 10 query, tối ưu bằng index phù hợp', 'Tái hiện deadlock + lost update trên PostgreSQL, rồi sửa', 'Ôn thêm Oracle (ngân hàng dùng nhiều): sequence, partition, execution plan', 'LLD: Logging framework (luyện ở #/learn, track architecture)', 'Mốc #/sd: 1 đề design tuần này (big tech): URL shortener'] },
        { id: 'w12', title: 'Tình huống DB & file lớn', topics: ['scenario', 'db'], algo: '4 bài ByteByteGo chương 15 (Greedy) — luyện ở #/algo, lọc theo pattern Greedy',
          tasks: ['Dự án: import CSV sao kê 1 triệu dòng (streaming + batch + báo lỗi theo dòng)', 'Phỏng vấn thử preset "Tình huống thực tế"', 'LLD: Undo/Redo (luyện ở #/learn, track architecture)', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Streaming payment dashboard'] },
      ],
    },
    {
      name: 'Giai đoạn 4 — Microservices & hệ thống phân tán', weeks: [
        { id: 'w13', title: 'Kiến trúc microservices, giao tiếp, resilience', topics: ['microservices'], algo: '5 bài ByteByteGo chương 16 (Backtracking) — luyện ở #/algo, lọc theo pattern Backtracking',
          tasks: ['Thêm Resilience4j (timeout, retry, circuit breaker) khi gọi dịch vụ ngoài', 'Vẽ kiến trúc dự án, viết ADR đầu tiên', 'Mốc #/sd: 1 đề design tuần này (big tech): Distributed file storage', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w14', title: 'Kafka, Outbox, Saga, idempotency', topics: ['microservices'], algo: '5 bài ByteByteGo chương 17 (Graphs) — luyện ở #/algo, lọc theo pattern Graph',
          tasks: ['Dự án: Transactional Outbox → Kafka → notification service', 'Xử lý message trùng & sai thứ tự (consumer idempotent)', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Core banking ledger reconciliation', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w15', title: 'Observability, security, deploy', topics: ['microservices', 'spring'], algo: '4 bài ByteByteGo chương 18 (Topological Sort) — luyện ở #/algo, lọc theo pattern Topo',
          tasks: ['Thêm Micrometer + OpenTelemetry tracing, dashboard p95/p99', 'Spring Security OAuth2 resource server + JWT', 'Mốc #/sd: 1 đề design tuần này (big tech): Design chat app', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w16', title: 'Design patterns & Clean Architecture', topics: ['architecture'], algo: '4 bài ByteByteGo chương 19 (Tries) — luyện ở #/algo, lọc theo pattern Trie',
          tasks: ['Mốc: tự trình bày 1 thiết kế 45 phút có trade-off', 'Refactor dự án theo hexagonal (ports & adapters)', 'Phỏng vấn thử "Microservices & System Design"', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Money transfer / wallet', '1 mock coding 45 phút + 1 mock SD'] },
      ],
    },
    {
      name: 'Giai đoạn 5 — System Design & Cloud', weeks: [
        { id: 'w17', title: 'Framework system design + caching', topics: ['design'], algo: '4 bài ByteByteGo chương 20 (Union Find) — luyện ở #/algo, lọc theo pattern UnionFind',
          tasks: ['Luyện khung 45 phút: yêu cầu → ước lượng → API → data → kiến trúc → deep dive', 'Thiết kế URL shortener & rate limiter trên giấy, tự nói thành tiếng', 'Mốc #/sd: 1 đề design tuần này (big tech): Cloud infrastructure / S3', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w18', title: 'System design đặc thù ngân hàng/fintech', topics: ['design', 'scenario'], algo: '5 bài ByteByteGo chương 21 (Bit Manipulation) — luyện ở #/algo, lọc theo pattern Bit',
          tasks: ['Thiết kế ví điện tử / thanh toán: ledger, idempotency, đối soát', 'Thiết kế flash sale chống oversell', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Alerting / monitoring banking', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w19', title: 'AWS cho backend', topics: ['aws'], algo: '4 bài ByteByteGo chương 22 (Math/Geometry) — luyện ở #/algo, lọc theo pattern Math',
          tasks: ['Deploy dự án lên AWS (ECS Fargate hoặc EC2 + RDS), dùng Secrets Manager', 'Vẽ kiến trúc multi-AZ, nêu RTO/RPO', 'Mốc #/sd: 1 đề design tuần này (big tech): Design top-K queries', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w20', title: 'Ôn system design tổng hợp', topics: ['design', 'aws'], algo: '4 bài ôn theo pattern yếu (CTCI Moderate chọn lọc, big tech)',
          tasks: ['3 đề system design, mỗi đề 45 phút, ghi âm rồi tự review', 'Phỏng vấn thử "Full loop"', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Loan origination', '1 mock coding 45 phút + 1 mock SD'] },
      ],
    },
    {
      name: 'Giai đoạn 6 — AI, testing, soft skills & tiếng Anh', weeks: [
        { id: 'w21', title: 'AI/LLM cho Java dev', topics: ['ai'], algo: '4 bài CTCI Moderate chọn lọc (Array/String) + ôn bài làm sai',
          tasks: ['Dự án: thêm tính năng hỏi đáp sao kê bằng Spring AI + RAG (pgvector)', 'Chuẩn bị câu chuyện "bạn dùng AI tool trong công việc thế nào"', 'Chuẩn bị 2 câu chuyện STAR + luyện nói #/speak 15 phút/ngày', 'Mốc #/sd: 1 đề design tuần này (big tech): Ride share (Uber)', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w22', title: 'Testing & chất lượng', topics: ['testing'], algo: '4 bài CTCI Moderate/Hard chọn lọc (Linked List, Stack/Queue) + ôn bài làm sai',
          tasks: ['Testcontainers cho PostgreSQL + Kafka trong dự án', 'Viết checklist code review của riêng bạn', 'Chuẩn bị 2 câu chuyện STAR + luyện nói #/speak 15 phút/ngày', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Fraud detection', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w23', title: 'Behavioral & leadership (STAR)', topics: ['behavioral'], algo: '3 bài CTCI Hard chọn lọc + 2 bài Coding round mock',
          tasks: ['Viết sẵn 8 câu chuyện STAR có số liệu (sự cố, bất đồng, mentoring, quyết định sai…)', 'Chuẩn bị câu hỏi hỏi lại interviewer & chiến lược đàm phán lương', 'Chuẩn bị 2 câu chuyện STAR + luyện nói #/speak 15 phút/ngày', '1 mock coding 45 phút + 1 mock SD'] },
        { id: 'w24', title: 'Phỏng vấn tiếng Anh', topics: ['english'], algo: '3 bài CTCI Hard chọn lọc + 2 bài Coding round mock',
          tasks: ['Mốc: mock đạt 4/5 cả coding, design, behavioral', 'Luyện "Tell me about yourself" bản 2 phút, ghi âm 5 lần', 'Phỏng vấn thử preset "English Interview" ×2', 'Chuẩn bị 2 câu chuyện STAR + luyện nói #/speak 15 phút/ngày', '1 mock coding 45 phút + 1 mock SD'] },
      ],
    },
    {
      name: 'Giai đoạn 7 — Nước rút & ứng tuyển', weeks: [
        { id: 'w25', title: 'Mock interview cường độ cao', topics: ['scenario', 'design', 'concurrency'], algo: '10 bài trộn, bấm giờ 25 phút/bài',
          tasks: ['Mỗi ngày 1 phiên Phỏng vấn thử (xoay vòng preset)', 'Nhờ bạn bè/đồng nghiệp mock 1 buổi thật', 'Hoàn thiện CV + LinkedIn + README dự án; bắt đầu nộp đơn công ty "tập dượt" trước'] },
        { id: 'w26', title: 'Phỏng vấn thật & rút kinh nghiệm', topics: [], algo: 'Duy trì 3–5 bài/tuần',
          tasks: ['Sau mỗi vòng phỏng vấn: ghi lại câu hỏi, thêm vào ôn tập, tự chấm', 'Ôn Flashcard "Chỉ câu chưa thuộc" mỗi ngày 20 phút', 'Đàm phán offer: so sánh tổng thu nhập, lộ trình, công nghệ'] },
      ],
    },
  ],
};

window.JD_PLAN = {
  goal: 'Phỏng vấn VPBankS & VinSmart Future — 20 tuần tập trung JD',
  targets: [
    { name: 'VPBank Securities (VPBankS)', examples: 'Backend Java Spring Boot, PostgreSQL/Oracle, Kafka, SOLID, CTDL&GT, CI/CD/Docker/K8s',
      focus: ['Hệ thống giao dịch chứng khoán: đặt lệnh, khớp lệnh, T+2, sổ lệnh', 'Idempotency, transaction isolation & locking (Oracle vs PostgreSQL)', 'Kafka ordering, consumer group, retry/DLQ', 'CTDL & giải thuật, Design pattern, SOLID', 'Spring internals: IoC, AOP, @Transactional, Spring Security/JWT'] },
    { name: 'VinSmart Future', examples: 'Senior Software Developer Java/Python, event processing, workflow orchestration, AI inference',
      focus: ['Event processing, workflow orchestration, task lifecycle (routing, prioritization, assignment, escalation)', 'Kafka/RabbitMQ: async processing, retry, fault-tolerant error handling, DLQ', 'RDBMS + NoSQL/cache, data model, caching, transaction', 'Observability: logging, audit trail, distributed tracing, monitoring/alerting', 'Incident response + RCA, security (authn/authz, audit), AI/ML inference integration', 'Mentor junior, API data contract, webhook/push notification/3rd-party'] },
  ],
  project: {
    name: 'Task/Order Workflow Service',
    desc: 'Dự án portfolio xuyên suốt 20 tuần: Spring Boot 3 + PostgreSQL + Kafka + Redis. State machine quản lý task/order lifecycle, Transactional Outbox cho event publishing, retry/DLQ pattern, OpenTelemetry tracing + metrics. Dùng để demo trong phỏng vấn 2 JD.',
  },
  phases: [
    {
      name: 'Giai đoạn 1 — Nền tảng Java vững (tuần 1–3)',
      weeks: [
        { id: 'j01', title: 'Core Java & đánh giá đầu vào', topics: ['core', 'collections'], algo: '3 bài Easy: Array, Hash Map, Two Pointers',
          tasks: ['Làm 1 phiên Phỏng vấn thử "Full loop" để biết điểm xuất phát', 'Ôn câu Core Java & Collections trong Ngân hàng câu hỏi, chấm trạng thái trung thực', 'Viết CV bản nháp theo format STAR cho từng dự án'] },
        { id: 'j02', title: 'Java 8 → 21 hiện đại & Collections internals', topics: ['modern', 'collections'], algo: '3 bài: Sliding Window, Hash Map internals',
          tasks: ['Tự vẽ lại cấu trúc HashMap / ConcurrentHashMap từ trí nhớ, đọc source putVal/resize', 'Refactor 1 module cũ sang record, switch pattern matching, Stream', 'Thiết kế domain Account / Transaction / LedgerEntry cho dự án portfolio'] },
        { id: 'j03', title: 'Concurrency cơ bản & JVM memory', topics: ['concurrency', 'jvm'], algo: '4 bài: Stack, Heap, Interval, TopK',
          tasks: ['Viết demo race condition + sửa bằng synchronized, Lock, Atomic', 'Benchmark platform thread vs virtual thread cho API gọi IO', 'Tạo memory leak cố ý, lấy heap dump, phân tích Eclipse MAT'] },
      ],
    },
    {
      name: 'Giai đoạn 2 — Spring, Security, Database (tuần 4–8)',
      weeks: [
        { id: 'j04', title: 'Spring core, IoC, AOP, @Transactional', topics: ['spring'], algo: '4 bài: DP Knapsack, DP Fibonacci',
          tasks: ['Tự chứng minh lỗi self-invocation @Transactional bằng test', 'Dự án: API chuyển tiền với idempotency key + ProblemDetail', 'Học Spring Security OAuth2 resource server + JWT cơ bản'] },
        { id: 'j05', title: 'Spring Security/JWT & JPA/Hibernate', topics: ['spring', 'security', 'jpa'], algo: '4 bài: DP Palindromes, Greedy',
          tasks: ['Cấu hình JWT authentication/authorization cho API', 'Bật SQL log, tìm và sửa N+1 trong dự án', 'Batch insert 1 triệu dòng: so sánh IDENTITY vs SEQUENCE'] },
        { id: 'j06', title: 'SQL, index, EXPLAIN, isolation, locking', topics: ['db', 'sql'], algo: '4 bài: Backtracking, Graph',
          tasks: ['Đọc EXPLAIN ANALYZE 10 query, tối ưu bằng index phù hợp', 'Tái hiện deadlock + lost update trên PostgreSQL, rồi sửa', 'Ôn thêm Oracle: sequence, partition, execution plan (VPBankS dùng Oracle)'] },
        { id: 'j07', title: 'MVCC, partitioning, file lớn, tình huống DB', topics: ['db', 'scenario'], algo: '4 bài: Topological Sort, Trie',
          tasks: ['Dự án: import CSV sao kê 1 triệu dòng (streaming + batch + báo lỗi theo dòng)', 'Phỏng vấn thử preset "Tình huống thực tế"', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Flash sale chống oversell'] },
        { id: 'j08', title: 'Tổng ôn Spring + DB + tuần đệm', topics: ['spring', 'jpa', 'db', 'security'], algo: '3 bài ôn theo pattern yếu',
          tasks: ['Flashcard chế độ "Chỉ câu chưa thuộc" đến khi ≥ 70% Đã thuộc', 'Phỏng vấn thử preset "Java Backend Senior" (8 câu)', 'Mốc #/sd: 1 đề design tuần này (big tech): Rate limiter'] },
      ],
    },
    {
      name: 'Giai đoạn 3 — Kafka, Microservices, Outbox (tuần 9–12)',
      weeks: [
        { id: 'j09', title: 'Kafka cơ bản, ordering, consumer group', topics: ['microservices'], algo: '4 bài: Union Find, Bit Manipulation',
          tasks: ['Tìm hiểu Kafka: partition, replication, consumer group, offset management', 'Dự án: Transactional Outbox → Kafka → notification service', 'Xử lý message trùng & sai thứ tự (consumer idempotent)'] },
        { id: 'j10', title: 'Retry, DLQ, idempotent consumer, outbox pattern', topics: ['microservices'], algo: '4 bài: Math/Geometry, Array/String CTCI',
          tasks: ['Cài đặt retry với exponential backoff + Dead Letter Queue', 'Dự án: triển khai idempotent consumer cho order processing', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Core banking ledger reconciliation'] },
        { id: 'j11', title: 'Saga, circuit breaker, API contract, workflow orchestration', topics: ['microservices', 'design'], algo: '4 bài: Linked List, Stack/Queue CTCI',
          tasks: ['Triển khai Saga pattern cho distributed transaction (order → payment → inventory)', 'Thêm Resilience4j: timeout, retry, circuit breaker khi gọi dịch vụ ngoài', 'Thiết kế API contract (OpenAPI) cho task workflow service'] },
        { id: 'j12', title: 'Task lifecycle: routing, prioritization, assignment, escalation', topics: ['microservices', 'scenario'], algo: '4 bài: Tree, Graph CTCI',
          tasks: ['Xây dựng state machine quản lý task lifecycle (created → assigned → in_progress → done/escalated)', 'Cơ chế routing task theo priority/skill, escalation tự động theo SLA', 'Mốc #/sd: 1 đề design tuần này (ngân hàng): Money transfer / wallet'] },
      ],
    },
    {
      name: 'Giai đoạn 4 — System Design đặc thù (tuần 13–15)',
      weeks: [
        { id: 'j13', title: 'System design: Đặt lệnh chứng khoán, khớp lệnh, T+2', topics: ['design', 'banking'], algo: '4 bài: Heap, Sliding Window',
          tasks: ['Thiết kế order matching engine: price-time priority, order book, trade execution', 'Xử lý T+2 settlement, corporate action, dividend', 'Tham khảo: https://designed-to-scale.vercel.app/#/hld-lld/1'] },
        { id: 'j14', title: 'System design: Notification/webhook, task routing', topics: ['design', 'microservices'], algo: '4 bài: Two Pointers, DP',
          tasks: ['Thiết kế notification service: email, SMS, push, webhook, retry policy', 'Thiết kế task routing service: priority queue, worker pool, dead letter', 'Mốc #/sd: 1 đề design tuần này (big tech): Distributed file storage'] },
        { id: 'j15', title: 'DevOps & Observability: Docker, K8s, CI/CD, OpenTelemetry, RCA', topics: ['devops', 'aws', 'microservices'], algo: '3 bài: Greedy, Backtracking',
          tasks: ['Containerize dự án: Docker multi-stage build, docker-compose local dev', 'CI/CD pipeline: GitHub Actions → build, test, scan, deploy K8s', 'Thêm OpenTelemetry tracing, dashboard p95/p99, alert rule', 'Viết 1 bài RCA mẫu theo format: incident → timeline → root cause → action items'] },
      ],
    },
    {
      name: 'Giai đoạn 5 — Ôn tập & Chuẩn bị phỏng vấn (tuần 16–17)',
      weeks: [
        { id: 'j16', title: 'Ôn SRS, 5 câu chuyện STAR, CV theo 2 JD, nghiệp vụ chứng khoán', topics: ['behavioral', 'banking', 'scenario'], algo: '3 bài: Union Find, Trie',
          tasks: ['Ôn Flashcard "Chỉ câu chưa thuộc" mỗi ngày 20 phút (SRS)', 'Viết sẵn 5 câu chuyện STAR có số liệu (sự cố, bất đồng, mentoring, quyết định sai, thành tựu)', 'Chuẩn bị CV & LinkedIn tailor cho VPBankS và VinSmart Future', 'Học nghiệp vụ chứng khoán: loại lệnh, khớp lệnh, sổ lệnh, đối soát, rủi ro'] },
        { id: 'j17', title: 'Mock interview cường độ cao, phỏng vấn tiếng Anh', topics: ['english', 'scenario', 'design', 'concurrency'], algo: '4 bài: Graph, DP Hard',
          tasks: ['Mỗi ngày 1 phiên Phỏng vấn thử (xoay vòng preset), mục tiêu điểm TB ≥ 4.0', 'Luyện "Tell me about yourself" bản 2 phút, ghi âm 5 lần', 'Phỏng vấn thử preset "English Interview" × 3', 'Nhờ bạn bè/đồng nghiệp mock 1 buổi thật (coding + design + behavioral)'] },
      ],
    },
    {
      name: 'Giai đoạn 6 — Tuần phỏng vấn thật (tuần 18–20)',
      weeks: [
        { id: 'j18', title: 'Mock theo công ty 2–3 buổi/tuần + tiếng Anh', topics: ['english', 'scenario', 'design'], algo: '3 bài: Tree, Heap',
          tasks: ['Mock VPBankS: focus transaction, locking, Oracle, Kafka ordering, securities domain', 'Mock VinSmart Future: focus workflow orchestration, task lifecycle, retry/DLQ, tracing, AI inference', 'Luyện nói tiếng Anh 30 phút/ngày (coding + behavioral + system design)'] },
        { id: 'j19', title: 'Mock theo công ty 2–3 buổi/tuần + tiếng Anh', topics: ['english', 'scenario', 'design'], algo: '3 bài: Graph, DP',
          tasks: ['Mock VPBankS: focus system design securities, outbox, saga, observability', 'Mock VinSmart Future: focus event processing, cache, NoSQL, security, RCA', 'Review lại 5 câu chuyện STAR, luyện hỏi lại interviewer & đàm phán lương'] },
        { id: 'j20', title: 'Tuần phỏng vấn thật', topics: [], algo: 'Duy trì 3–5 bài/tuần',
          tasks: ['Phỏng vấn thật VPBankS & VinSmart Future', 'Sau mỗi vòng: ghi lại câu hỏi, thêm vào ôn tập, tự chấm', 'Đàm phán offer: so sánh tổng thu nhập, lộ trình, công nghệ, culture'] },
      ],
    },
  ],
};
