# T2820R — Fact-check nội dung mới của T2820

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2820 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed toàn bộ 20 câu mới của T2820 trong `js/data/quiz-design.js` (qz-scenario-041 → qz-scenario-060, round 4, topic `scenario` — trùng quy ước topic đã có trong file này ở HEAD, id 3 chữ số tăng dần, không trùng qz-scenario-040).

Kết quả kiểm tra kỹ thuật (chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x): PostgreSQL (ANALYZE/REINDEX, EXPLAIN (ANALYZE,BUFFERS), max_connections=100, pg_stat_activity/pg_locks, idle_in_transaction_session_timeout/statement_timeout), HikariCP (maximumPoolSize/connectionTimeout/leakDetectionThreshold/maxLifetime/keepaliveTime, pool cạn do query chậm + leak), Kafka 3.x (poison pill, DefaultErrorHandler/BackOff maxAttempts, DeadLetterPublishingRecoverer, ErrorHandlingDeserializer, max.poll.records vs max.poll.interval.ms, trần partition, message.max.bytes/max.request.size, object storage cho payload lớn), Redis (DEL O(N) chặn luồng, UNLINK, SCAN/HSCAN, blocked_clients), JVM (OOMKilled exit 137 vs SIGTERM 143, RSS > heap, -XX:MaxRAMPercentage, -XX:MaxDirectMemorySize, NMT, System.gc/DisableExplicitGC, -Xlog:gc*safepoint), Spring Boot 3.x (@Async SimpleAsyncTaskExecutor không giới hạn, ThreadPoolTaskExecutor + CallerRunsPolicy, Resilience4j @CircuitBreaker/@Bulkhead/@Retry), Hibernate 6 (N+1, @EntityGraph/JOIN FETCH, @BatchFetchSize, @Transactional(readOnly) không khử N+1), Logback/Log4j2 Async appender, HashMap không thread-safe (vòng lặp khi resize). Tất cả đáp án/lý giải đúng, không có API/flag bịa, số liệu vô căn cứ, hay cơ chế ngược.

Markup: không có backtick / `${` bên trong nội dung template literal; multi có "(Chọn 2)" và answer tăng dần (ví dụ [0,3], [0,2]); single answer 0..3; không trùng id.

Không lỗi kiến thức → **không sửa nội dung** `js/data/quiz-design.js` ("không có lỗi").

`node scripts/validate.js`: không báo lỗi nào cho `quiz-design.js` / qz-scenario-041..060.

BLOCKER (không sở hữu, không sửa theo AGENTS.md #3): `node scripts/build-light-index.js` dừng tại `js/data/labs-gc.js:7581` (SyntaxError "Unexpected identifier 'cảnh'") — lỗi cũ, trước khi tác vụ này tác động, file không thuộc T2820R. Do đó không thể sinh lại `js/data/index-light.js` (validate báo "đã cũ" vì quiz-design.js đã thêm 20 câu scenario). Các lỗi còn lại của validate (`labs-gc.js`, `q-frontend.js`, `quiz-ops.js`, `lessons-*`) cũng nằm trong file không sở hữu. Cần integrator / chủ respective file sửa labs-gc.js rồi chạy build-light-index + validate lại.