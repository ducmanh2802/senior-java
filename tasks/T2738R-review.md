# T2738R — Fact-check nội dung mới của T2738

Status: DONE
Agent: opencode
Owns: `js/data/quiz-design.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2738 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã sửa 3 lỗi markup trong quiz-design.js (sai cú pháp inline code `{@...}` → `{{...}}`):
- qz-scenario-034: Spring annotations `@RequestContextHolder`, `@LocaleContextHolder`, `@ThreadLocal`, `@Map<Class,...>`
- qz-scenario-035: `@Executor`
- qz-scenario-037: Redisson `@RLock.tryLock()`, `@unlock()`, `@RLock`

Tất cả 10 câu hỏi scenario mới (qz-scenario-031 đến qz-scenario-040) đúng kỹ thuật về: virtual thread pinning, PostgreSQL deadlock, G1GC allocation rate/promotion, Metaspace classloader leak, Kafka consumer rebalance (max.poll.interval.ms + heartbeat), WebFlux + boundedElastic + HikariCP, cache stampede lock release, Resilience4j slow call rate + TimeLimiter, Tomcat thread pool + S3 presigned URL, Flyway/Liquibase K8s Job pattern.
