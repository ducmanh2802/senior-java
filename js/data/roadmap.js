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
  goal: 'Phỏng vấn IT nhà máy / FDI & Senior Fullstack — 20 tuần',
  targets: [
    { name: 'IT nhà máy / FDI (Samsung vendor, LG, Nhật/Hàn outsource)', examples: 'LG CNS, Samsung SDS / vendor Samsung, Naver Vietnam, Money Forward, GFT, TMA, NCS, outsource Nhật (Brillantez, Plus Prime)',
      focus: ['MES: lệnh sản xuất, traceability serial/lot, máy quét offline, in tem', 'Tích hợp ERP (SAP) qua interface/batch, dữ liệu chạy 24/7 không dừng xưởng', 'MyBatis + Oracle/MSSQL + PostgreSQL, báo cáo/export dữ liệu lớn', 'Kafka/outbox, idempotency, xử lý offline-first', 'Giao tiếp & tài liệu outsource Hàn/Nhật, tiếng Anh cơ bản'] },
    { name: 'Senior Fullstack Java + Vue (LG CNS…)', examples: 'LG CNS, Samsung SDS, Naver, các công ty outsource Hàn–Nhật, product company',
      focus: ['Vue 3 Composition API, Vue Router, Pinia', 'axios + interceptor JWT, CORS, deploy SPA cùng Spring Boot', 'Spring Boot REST API, OpenAPI contract, validation', 'PostgreSQL/MyBatis/JPA, tối ưu truy vấn', 'Docker/K8s cơ bản, CI/CD, observability'] },
    { name: 'VPBank Securities (VPBankS)', examples: 'Backend Java Spring Boot, PostgreSQL/Oracle, Kafka, SOLID, CTDL&GT, CI/CD',
      focus: ['Hệ thống giao dịch chứng khoán: đặt lệnh, khớp lệnh, T+2', 'Idempotency, transaction isolation & locking (Oracle vs PostgreSQL)', 'Kafka ordering, consumer group, retry/DLQ'] },
    { name: 'VinSmart Future', examples: 'Senior Software Developer Java/Python, event processing, workflow orchestration, AI inference',
      focus: ['Event processing, workflow orchestration, task lifecycle', 'Kafka/RabbitMQ: async, retry, fault-tolerant, DLQ', 'RDBMS + NoSQL/cache, observability, AI/ML inference integration'] },
  ],
  project: {
    name: 'MES mini: Production Order & Traceability',
    desc: 'Dự án portfolio xuyên suốt 20 tuần: Spring Boot 3 + MyBatis/JPA + PostgreSQL + Kafka + Vue 3. Quản lý lệnh sản xuất, traceability serial/lot, máy quét offline, in tem, tích hợp ERP (SAP) qua batch, deploy 24/7 không dừng xưởng. Dùng để demo trong phỏng vấn IT nhà máy/FDI & Senior Fullstack.',
  },
  phases: [
    {
      name: 'Giai đoạn 1 — Nền tảng Java & đánh giá đầu vào (tuần 1–4)',
      weeks: [
        { id: 'j01', title: 'Core Java & Collections, đánh giá đầu vào', topics: ['core', 'collections'], algo: '3 bài Easy: Array, Hash Map, Two Pointers',
          tasks: ['Làm 1 phiên Phỏng vấn thử "Full loop" để biết điểm xuất phát (Java, Spring, SQL, design)', 'Ôn câu Core Java & Collections trong Ngân hàng câu hỏi, chấm trạng thái trung thực', 'Tự vẽ lại cấu trúc HashMap từ trí nhớ, đọc source putVal/resize', 'Viết CV bản nháp theo format STAR cho từng dự án (kèm số liệu)'] },
        { id: 'j02', title: 'Java 8 → 21 hiện đại & Collections internals', topics: ['modern', 'collections'], algo: '3 bài: Sliding Window, Hash Map internals',
          tasks: ['Refactor 1 module cũ sang record, switch pattern matching, Stream, Optional đúng chỗ', 'Giải thích String Pool, == vs equals, intern bằng ví dụ code chạy được', 'Thiết kế domain ProductionOrder / WorkOrder / MaterialLot cho dự án MES mini', 'Đọc java.util.HashMap resize + ConcurrentHashMap putVal, vẽ lại phân đoạn'] },
        { id: 'j03', title: 'Concurrency cơ bản & JVM memory', topics: ['concurrency', 'jvm'], algo: '4 bài: Stack, Heap, Interval, TopK',
          tasks: ['Viết demo race condition + sửa bằng synchronized, Lock, Atomic, so sánh throughput', 'Benchmark platform thread vs virtual thread cho API gọi IO, ghi lại số liệu', 'Tạo memory leak cố ý, lấy heap dump, phân tích bằng Eclipse MAT', 'Giải thích happens-before + JMM bằng ví dụ visibility bug cụ thể'] },
        { id: 'j04', title: 'Spring core, IoC, AOP, @Transactional', topics: ['spring'], algo: '4 bài: DP Knapsack, DP Fibonacci',
          tasks: ['Tự chứng minh lỗi self-invocation @Transactional bằng test, viết cách sửa', 'Dự án MES mini: API tạo Production Order với idempotency key + ProblemDetail', 'Giải thích vòng đời bean, proxy JDK vs CGLIB, khi nào AOP không kích hoạt', 'Viết @Transactional đúng ranh giới: propagation, rollbackFor, readOnly'] },
      ],
    },
    {
      name: 'Giai đoạn 2 — Spring Security, Database & MyBatis enterprise (tuần 5–8)',
      weeks: [
        { id: 'j05', title: 'Spring Security/JWT & JPA/Hibernate', topics: ['spring', 'security', 'jpa'], algo: '4 bài: DP Palindromes, Greedy',
          tasks: ['Cấu hình JWT authentication/authorization + phân quyền theo role (operator, supervisor, admin)', 'Bật SQL log, tìm và sửa N+1 trong dự án MES mini', 'Giải thích entity lifecycle (new/managed/detached), dirty checking, flush timing', 'So sánh IDENTITY vs SEQUENCE batch insert, đo thời gian'] },
        { id: 'j06', title: 'SQL, index, EXPLAIN, isolation, locking', topics: ['db', 'sql'], algo: '4 bài: Backtracking, Graph',
          tasks: ['Đọc EXPLAIN ANALYZE 10 query, tối ưu bằng index phù hợp, đo trước/sau', 'Tái hiện deadlock + lost update trên PostgreSQL rồi sửa bằng isolation/lock', 'Ôn Oracle vs MSSQL cho FDI: sequence, partition, execution plan khác gì', 'Thiết kế index cho bảng traceability serial/lot, giải thích chọn thứ tự cột'] },
        { id: 'j07', title: 'MyBatis + SQL enterprise', topics: ['db', 'sql', 'jpa'], algo: '4 bài: Topological Sort, Trie',
          tasks: ['Viết mapper MyBatis có dynamic SQL (if/choose/foreach) cho màn hình tra cứu lot', 'Dùng resultMap map join 3 bảng, viết test cho mapper', 'So sánh MyBatis vs JPA: khi nào chọn cái nào cho hệ thống báo cáo nhà máy', 'Dự án MES mini: báo cáo/export lớn 1 triệu dòng bằng streaming ResultSet'] },
        { id: 'j08', title: 'Tổng ôn Spring + DB + MyBatis', topics: ['spring', 'jpa', 'db'], algo: '3 bài ôn theo pattern yếu',
          tasks: ['Flashcard chế độ "Chỉ câu chưa thuộc" đến khi ≥ 70% Đã thuộc', 'Phỏng vấn thử preset "Java Backend Senior" (8 câu), mục tiêu TB ≥ 4.0', 'Tự viết lại 1 mapper MyBatis từ đầu không nhìn tài liệu', 'Review lại toàn bộ ADR dự án MES mini đã có'] },
      ],
    },
    {
      name: 'Giai đoạn 3 — Frontend Vue & tích hợp Backend (tuần 9–10)',
      weeks: [
        { id: 'j09', title: 'Frontend: JS/TypeScript cơ bản + Vue 3 Composition API', topics: ['frontend', 'api'], algo: '4 bài: Union Find, Bit Manipulation',
          tasks: ['Học JS/TS: scope, closure, Promise, async/await, destructuring bằng ví dụ', 'Viết component Vue 3 Composition API (ref, reactive, computed, watch) cho màn hình nhập lệnh sản xuất', 'Hiểu vòng đời component + v-for/v-if, gọi API bằng fetch tạm thời', 'Dự án MES mini: dựng trang danh sách Work Order hiển thị trạng thái'] },
        { id: 'j10', title: 'Vue Router, Pinia, axios + interceptor JWT, CORS, deploy SPA', topics: ['frontend', 'api'], algo: '4 bài: Math/Geometry, Array/String CTCI',
          tasks: ['Cấu hình axios + interceptor gắn JWT, xử lý 401 refresh token', 'Thiết lập CORS phía Spring Boot, giải thích preflight OPTIONS', 'Deploy SPA (Vue build) cùng Spring Boot static hoặc Nginx, chạy trên 1 domain', 'Dự án MES mini: tích hợp màn hình nhập lệnh + tra cứu lot gọi API thật'] },
      ],
    },
    {
      name: 'Giai đoạn 4 — Kafka, MES & tích hợp ERP 24/7 (tuần 11–14)',
      weeks: [
        { id: 'j11', title: 'Kafka cơ bản, ordering, consumer group, outbox', topics: ['microservices'], algo: '4 bài: Linked List, Stack/Queue CTCI',
          tasks: ['Tìm hiểu Kafka: partition, replication, consumer group, offset', 'Dự án MES mini: Transactional Outbox → Kafka → notification/monitoring service', 'Xử lý message trùng & sai thứ tự bằng idempotent consumer', 'Cài retry exponential backoff + DLQ cho event sản xuất'] },
        { id: 'j12', title: 'MES: lệnh sản xuất & traceability serial/lot', topics: ['scenario', 'design'], algo: '4 bài: Tree, Graph CTCI',
          tasks: ['Thiết kế luồng Production Order: nhận lệnh → phân công → chạy → hoàn tất', 'Thiết kế traceability serial/lot: truy xuất ngược từ thành phẩm về nguyên liệu', 'Thiết kế state machine cho Work Order (created → released → in_progress → done/hold)', 'Mốc #/sd: 1 đề design tuần này: MES traceability'] },
        { id: 'j13', title: 'MES: máy quét offline, in tem, tích hợp ERP/SAP', topics: ['scenario', 'microservices'], algo: '4 bài: Heap, Sliding Window',
          tasks: ['Thiết kế cơ chế máy quét offline (offline-first, đồng bộ khi có mạng, chống trùng quét)', 'Tích hợp in tem nhãn (barcode/QR) qua service in, xử lý hàng đợi in', 'Thiết kế interface/batch đồng bộ dữ liệu với ERP (SAP) qua file/CSV hoặc API', 'Xử lý xung đột dữ liệu & idempotency khi đồng bộ ERP ↔ MES'] },
        { id: 'j14', title: 'MES 24/7 & system design', topics: ['design', 'microservices'], algo: '4 bài: Two Pointers, DP',
          tasks: ['Thiết kế deploy không dừng xưởng (rolling/blue-green), migration DB an toàn', 'Thiết kế giám sát 24/7: health check, alerting, on-call', 'Mốc #/sd: 1 đề design tuần này: hệ thống MES end-to-end', 'Viết 1 bài RCA mẫu cho sự cố dừng chuyền'] },
      ],
    },
    {
      name: 'Giai đoạn 5 — AI hands-on, DevOps, STAR, mock & phỏng vấn thật (tuần 15–20)',
      weeks: [
        { id: 'j15', title: 'AI hands-on: RAG, tool calling, Spring AI', topics: ['ai'], algo: '3 bài: Greedy, Backtracking',
          tasks: ['Dự án MES mini: thêm tính năng hỏi đáp hướng dẫn vận hành bằng Spring AI + RAG (pgvector)', 'Thực hành tool calling: cho AI gọi tool tra cứu lot/lệnh sản xuất', 'Viết eval nhỏ (5–10 câu) đo chất lượng trả lời trước/sau khi tuning', 'Đọc lessons-ai, hoàn thành các bài học AI còn thiếu'] },
        { id: 'j16', title: 'DevOps & Observability: Docker, CI/CD, OpenTelemetry', topics: ['devops', 'aws'], algo: '3 bài: Tree, Heap',
          tasks: ['Containerize dự án: Docker multi-stage build, docker-compose local dev', 'CI/CD pipeline: GitHub Actions → build, test, scan, deploy', 'Thêm OpenTelemetry tracing, dashboard p95/p99, alert rule', 'Vẽ kiến trúc multi-AZ, nêu RTO/RPO, deploy lên AWS (ECS/EC2 + RDS)'] },
        { id: 'j17', title: 'STAR, tiếng Anh, nghiệp vụ nhà máy', topics: ['behavioral', 'english', 'scenario'], algo: '3 bài: Union Find, Trie',
          tasks: ['Viết sẵn 5 câu chuyện STAR có số liệu (sự cố dừng chuyền, mentoring, quyết định sai)', 'Luyện "Tell me about yourself" bản 2 phút, ghi âm 5 lần', 'Học nghiệp vụ nhà máy: lệnh sản xuất, BOM, lot/serial, OEE, MES vs ERP vs SCADA', 'Luyện nói tiếng Anh 30 phút/ngày (coding + behavioral + system design)'] },
        { id: 'j18', title: 'Mock interview cường độ cao', topics: ['english', 'scenario', 'design', 'concurrency'], algo: '4 bài: Graph, DP Hard',
          tasks: ['Mỗi ngày 1 phiên Phỏng vấn thử (xoay vòng preset), mục tiêu TB ≥ 4.0', 'Phỏng vấn thử preset "English Interview" × 3', 'Nhờ bạn bè/đồng nghiệp mock 1 buổi thật (coding + design + behavioral)', 'Tổng ôn flashcard, hoàn thiện README dự án MES mini'] },
        { id: 'j19', title: 'Mock theo công ty 2–3 buổi/tuần + tiếng Anh', topics: ['english', 'scenario', 'design'], algo: '3 bài: Graph, DP',
          tasks: ['Mock IT nhà máy/FDI: focus MES, traceability, ERP/SAP, MyBatis, 24/7 deploy', 'Mock Senior Fullstack: focus Vue 3, axios+JWT, CORS, deploy SPA, Spring Boot', 'Review lại 5 câu chuyện STAR, luyện hỏi lại interviewer & đàm phán lương', 'Chuẩn bị CV & LinkedIn tailor cho 2 nhóm JD'] },
        { id: 'j20', title: 'Tuần phỏng vấn thật', topics: [], algo: 'Duy trì 3–5 bài/tuần',
          tasks: ['Phỏng vấn thật IT nhà máy/FDI & Senior Fullstack Java + Vue', 'Sau mỗi vòng: ghi lại câu hỏi, thêm vào ôn tập, tự chấm', 'Đàm phán offer: so sánh tổng thu nhập, lộ trình, công nghệ, culture'] },
      ],
    },
  ],
};
