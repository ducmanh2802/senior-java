/*
 * 26-week plan toward Senior Java interviews at Vietnamese banks / big tech.
 * Written by the integrator; rendered by js/views/roadmap.js (T17).
 * Week ids are stable keys for progress tracking: 'w01'..'w26', task key = '<weekId>-<index>'.
 */
window.ROADMAP = {
  goal: 'Pass phỏng vấn Senior Java tại ngân hàng hoặc big tech Việt Nam trong 6 tháng',
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
        { id: 'w05', title: 'Java Memory Model, lock, atomic', topics: ['concurrency'], algo: '8 bài: Binary Search',
          tasks: ['Viết demo race condition + sửa bằng 3 cách (synchronized, Lock, Atomic)', 'Dự án: chuyển tiền giữa 2 ví an toàn khi chạy song song (optimistic vs pessimistic)'] },
        { id: 'w06', title: 'Thread pool, CompletableFuture, virtual threads', topics: ['concurrency'], algo: '8 bài: Linked List',
          tasks: ['Benchmark platform thread vs virtual thread cho API gọi IO', 'Trả lời to (nói thành tiếng) 5 câu concurrency, bấm giờ 3 phút/câu'] },
        { id: 'w07', title: 'JVM memory & GC', topics: ['jvm'], algo: '8 bài: Tree DFS/BFS',
          tasks: ['Tạo memory leak cố ý, lấy heap dump, phân tích bằng Eclipse MAT', 'Đọc GC log G1, thử ZGC trên Java 21'] },
        { id: 'w08', title: 'Troubleshooting production', topics: ['jvm', 'scenario'], algo: '6 bài: Tree + ôn bài sai',
          tasks: ['Luyện quy trình "CPU 100%" và "OOM trên Kubernetes" (câu Tình huống)', 'Phỏng vấn thử Java Backend Senior 8 câu, mục tiêu điểm TB ≥ 3.5'] },
      ],
    },
    {
      name: 'Giai đoạn 3 — Spring, JPA, Database (trọng tâm ngân hàng)', weeks: [
        { id: 'w09', title: 'Spring core, @Transactional, AOP', topics: ['spring'], algo: '8 bài: Heap / Priority Queue',
          tasks: ['Tự chứng minh lỗi self-invocation @Transactional bằng test', 'Dự án: API chuyển tiền với idempotency key + ProblemDetail'] },
        { id: 'w10', title: 'JPA/Hibernate & hiệu năng', topics: ['jpa'], algo: '8 bài: Graph BFS/DFS',
          tasks: ['Bật SQL log, tìm và sửa N+1 trong dự án', 'Batch insert 1 triệu dòng: so sánh IDENTITY vs SEQUENCE'] },
        { id: 'w11', title: 'SQL, index, isolation, locking', topics: ['db'], algo: '8 bài: Graph (topo sort, union-find)',
          tasks: ['Đọc EXPLAIN ANALYZE 10 query, tối ưu bằng index phù hợp', 'Tái hiện deadlock + lost update trên PostgreSQL, rồi sửa', 'Ôn thêm Oracle (ngân hàng dùng nhiều): sequence, partition, execution plan'] },
        { id: 'w12', title: 'Tình huống DB & file lớn', topics: ['scenario', 'db'], algo: '6 bài: ôn lại bài sai',
          tasks: ['Dự án: import CSV sao kê 1 triệu dòng (streaming + batch + báo lỗi theo dòng)', 'Phỏng vấn thử preset "Tình huống thực tế"'] },
      ],
    },
    {
      name: 'Giai đoạn 4 — Microservices & hệ thống phân tán', weeks: [
        { id: 'w13', title: 'Kiến trúc microservices, giao tiếp, resilience', topics: ['microservices'], algo: '8 bài: Dynamic Programming 1D',
          tasks: ['Thêm Resilience4j (timeout, retry, circuit breaker) khi gọi dịch vụ ngoài', 'Vẽ kiến trúc dự án, viết ADR đầu tiên'] },
        { id: 'w14', title: 'Kafka, Outbox, Saga, idempotency', topics: ['microservices'], algo: '8 bài: DP 2D',
          tasks: ['Dự án: Transactional Outbox → Kafka → notification service', 'Xử lý message trùng & sai thứ tự (consumer idempotent)'] },
        { id: 'w15', title: 'Observability, security, deploy', topics: ['microservices', 'spring'], algo: '8 bài: Backtracking',
          tasks: ['Thêm Micrometer + OpenTelemetry tracing, dashboard p95/p99', 'Spring Security OAuth2 resource server + JWT'] },
        { id: 'w16', title: 'Design patterns & Clean Architecture', topics: ['architecture'], algo: '6 bài: Greedy / Intervals',
          tasks: ['Refactor dự án theo hexagonal (ports & adapters)', 'Phỏng vấn thử "Microservices & System Design"'] },
      ],
    },
    {
      name: 'Giai đoạn 5 — System Design & Cloud', weeks: [
        { id: 'w17', title: 'Framework system design + caching', topics: ['design'], algo: '8 bài medium trộn',
          tasks: ['Luyện khung 45 phút: yêu cầu → ước lượng → API → data → kiến trúc → deep dive', 'Thiết kế URL shortener & rate limiter trên giấy, tự nói thành tiếng'] },
        { id: 'w18', title: 'System design đặc thù ngân hàng/fintech', topics: ['design', 'scenario'], algo: '8 bài medium trộn',
          tasks: ['Thiết kế ví điện tử / thanh toán: ledger, idempotency, đối soát', 'Thiết kế flash sale chống oversell'] },
        { id: 'w19', title: 'AWS cho backend', topics: ['aws'], algo: '8 bài medium trộn',
          tasks: ['Deploy dự án lên AWS (ECS Fargate hoặc EC2 + RDS), dùng Secrets Manager', 'Vẽ kiến trúc multi-AZ, nêu RTO/RPO'] },
        { id: 'w20', title: 'Ôn system design tổng hợp', topics: ['design', 'aws'], algo: '6 bài hard chọn lọc',
          tasks: ['3 đề system design, mỗi đề 45 phút, ghi âm rồi tự review', 'Phỏng vấn thử "Full loop"'] },
      ],
    },
    {
      name: 'Giai đoạn 6 — AI, testing, soft skills & tiếng Anh', weeks: [
        { id: 'w21', title: 'AI/LLM cho Java dev', topics: ['ai'], algo: '8 bài ôn theo pattern yếu',
          tasks: ['Dự án: thêm tính năng hỏi đáp sao kê bằng Spring AI + RAG (pgvector)', 'Chuẩn bị câu chuyện "bạn dùng AI tool trong công việc thế nào"'] },
        { id: 'w22', title: 'Testing & chất lượng', topics: ['testing'], algo: '8 bài ôn theo pattern yếu',
          tasks: ['Testcontainers cho PostgreSQL + Kafka trong dự án', 'Viết checklist code review của riêng bạn'] },
        { id: 'w23', title: 'Behavioral & leadership (STAR)', topics: ['behavioral'], algo: '8 bài: Coding round mock',
          tasks: ['Viết sẵn 8 câu chuyện STAR có số liệu (sự cố, bất đồng, mentoring, quyết định sai…)', 'Chuẩn bị câu hỏi hỏi lại interviewer & chiến lược đàm phán lương'] },
        { id: 'w24', title: 'Phỏng vấn tiếng Anh', topics: ['english'], algo: '6 bài: Coding round mock',
          tasks: ['Luyện "Tell me about yourself" bản 2 phút, ghi âm 5 lần', 'Phỏng vấn thử preset "English Interview" ×2'] },
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
