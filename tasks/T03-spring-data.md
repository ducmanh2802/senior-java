# T03 — Nội dung: Spring & Spring Boot, JPA/Hibernate, Database & SQL

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

## Mục tiêu
Viết câu hỏi kèm đáp án mẫu cho topic `spring`, `jpa`, `db` theo `AGENTS.md` mục 4–6 (Spring Boot 3.x, Hibernate 6).
ID bắt đầu từ `spring-001`, `jpa-001`, `db-001`. Văn phong theo mẫu `core-001` trong `js/data/q-java.js`.

## Danh sách câu hỏi (bắt buộc bao phủ)
### spring (≥ 12 câu)
- IoC/DI, constructor vs field injection; bean lifecycle (BeanPostProcessor, @PostConstruct, SmartLifecycle)
- Bean scope; inject prototype vào singleton ({{ObjectProvider}}, lookup method)
- {{@Transactional}}: proxy, self-invocation, propagation (REQUIRED, REQUIRES_NEW, NESTED), rollback rule với checked exception
- AOP: JDK dynamic proxy vs CGLIB, hạn chế với final/private method
- Spring Boot auto-configuration: {{@Conditional*}}, {{AutoConfiguration.imports}}, cách debug ({{--debug}}, actuator conditions)
- Circular dependency: vì sao Boot 2.6+ cấm mặc định, cách refactor
- Spring Security: filter chain, xác thực JWT stateless, OAuth2 resource server
- {{@Async}} / {{@Scheduled}} pitfalls (executor mặc định, exception bị nuốt, chạy nhiều instance)
- Spring MVC vs WebFlux: khi nào chọn reactive; so với virtual threads
- Exception handling toàn cục ({{@ControllerAdvice}}, ProblemDetail RFC 7807)
- Configuration properties, profiles, externalized config & secret management
- Observability: Actuator, Micrometer, tracing; graceful shutdown
### jpa (≥ 8 câu)
- N+1 problem: phát hiện & cách xử lý (fetch join, EntityGraph, batch size, DTO projection)
- Persistence context, entity states, dirty checking, flush mode
- Lazy loading, {{LazyInitializationException}}, Open Session In View có nên bật?
- Optimistic ({{@Version}}) vs pessimistic locking, xử lý {{OptimisticLockException}}
- Batch insert/update: vì sao {{GenerationType.IDENTITY}} tắt JDBC batching; sequence + pooled optimizer
- Mapping quan hệ: bidirectional, owning side, {{orphanRemoval}}, cascade nguy hiểm
- First-level vs second-level cache; khi nào nên dùng 2nd-level cache
- Khi nào bỏ JPA để dùng JDBC/jOOQ/native query
### db (≥ 10 câu)
- B-tree index, composite index & leftmost prefix, covering index, khi nào index không được dùng
- Transaction isolation levels & các hiện tượng dirty read / non-repeatable read / phantom; MVCC (PostgreSQL vs MySQL InnoDB)
- Đọc {{EXPLAIN ANALYZE}} & tối ưu một query chậm (quy trình)
- Deadlock trong DB: nguyên nhân & cách phòng tránh
- Pagination offset vs keyset (seek) cho bảng lớn
- Replication (read replica, replication lag) vs partitioning vs sharding; chọn shard key
- Connection pool HikariCP: sizing, timeout, leak detection
- Migration schema zero-downtime (expand/contract, Flyway/Liquibase) cho bảng hàng trăm triệu dòng
- SQL vs NoSQL: chọn thế nào; khi nào dùng Redis, MongoDB, Cassandra, Elasticsearch
- {{SELECT ... FOR UPDATE SKIP LOCKED}} để làm job queue
- Oracle vs PostgreSQL (ngân hàng VN dùng Oracle nhiều): sequence, partitioning, execution plan, những khác biệt dev Java cần biết

## Notes
(agent ghi chú ở đây)

### Đã làm
- Ghi đè `js/data/q-spring-data.js` (file duy nhất task này sở hữu) với **35 câu hỏi**:
  - `spring` (15 câu, ≥ 12 yêu cầu): spring-001 IoC/DI + constructor vs field injection, spring-002 vòng đời bean (BeanPostProcessor/@PostConstruct/InitializingBean/SmartLifecycle), spring-003 scope + prototype trong singleton (ObjectProvider/@Lookup/scoped proxy), spring-004 @Transactional: proxy, self-invocation, quy tắc rollback với checked exception, spring-005 propagation (REQUIRED/REQUIRES_NEW/NESTED/...), spring-006 AOP: JDK proxy vs CGLIB + hạn chế final/private/self-invocation, spring-007 auto-configuration (@Conditional*, AutoConfiguration.imports, --debug, actuator/conditions), spring-008 circular dependency (vì sao Boot 2.6+ cấm + 5 cách refactor), spring-009 Spring Security: filter chain + JWT stateless + OAuth2 Resource Server, spring-010 @Async (nuốt exception, executor mặc định, thread-local/transaction), spring-011 @Scheduled (timezone, multi-instance, task dài, exception), spring-012 MVC vs WebFlux + virtual threads, spring-013 @ControllerAdvice + ProblemDetail (RFC 7807/9457), spring-014 @ConfigurationProperties/profile/externalized config/secret, spring-015 Actuator + Micrometer + tracing + graceful shutdown.
  - `jpa` (9 câu, ≥ 8 yêu cầu): jpa-001 N+1 + cách phát hiện/xử lý, jpa-002 persistence context + entity states + dirty checking + flush mode, jpa-003 lazy loading/LazyInitializationException/OSIV, jpa-004 optimistic vs pessimistic lock + xử lý OptimisticLockException, jpa-005 batch insert/update + vì sao IDENTITY tắt JDBC batching + sequence/pooled optimizer, jpa-006 owning side/inverse side + orphanRemoval + cascade, jpa-007 L1 vs L2 cache + Spring Cache, jpa-008 khi nào bỏ JPA (jOOQ/JdbcTemplate/native) + rủi ro trộn JPA & SQL, jpa-009 equals/hashCode/toString của entity + rủi ro Lombok @Data.
  - `db` (11 câu, ≥ 10 yêu cầu): db-001 B-tree + composite/leftmost prefix + covering index + khi nào index không dùng, db-002 isolation levels + dirty/non-repeatable/phantom + MVCC (PostgreSQL vs InnoDB), db-003 EXPLAIN ANALYZE + quy trình tối ưu query, db-004 deadlock (nguyên nhân, tránh, retry), db-005 offset vs keyset pagination, db-006 replication vs partitioning vs sharding + chọn shard key, db-007 HikariCP sizing/timeout/leak detection, db-008 migration zero-downtime (expand/contract, Flyway/Liquibase), db-009 SQL vs NoSQL + Redis/MongoDB/Cassandra/Elasticsearch, db-010 SELECT ... FOR UPDATE SKIP LOCKED làm job queue, db-011 Oracle vs PostgreSQL (những khác biệt dev Java cần biết).
- Mỗi câu: `**Tóm tắt:**` ở đầu, ≥ 3 mục `###`, bảng/cụm so sánh, ví dụ code ≤ 30 dòng, "Pitfall production", kết thúc bằng `> Senior tip:`; 2 câu hỏi đào sâu trong `follow`.
- Phân bố level: mid 9 / senior 18 / lead 8 (≈ 26% / 51% / 23%). Độ dài đáp án 2.2k–4.4k ký tự.
- `node --check js/data/q-spring-data.js` OK; `node scripts/validate.js` → **OK — không có lỗi.** (lần chạy cuối cùng toàn repo cũng in OK).
- Đã render thử toàn bộ 35 đáp án qua `App.md()`: không rò rỉ HTML thô, `<pre>/<table>/<blockquote>` cân bằng, không có `undefined/NaN`.

### Lưu ý cho integrator
- Trong lúc chạy, `scripts/validate.js` có được bổ sung luật mới "inline code `{{...}}` không được chứa `{`/`}` bên trong". Một chỗ trong `spring-014` đã dùng `{{application-{profile}.yml}}` → đã đổi thành `application-*.yml` để không vi phạm luật này.
- Trong lúc task này chạy, validator toàn repo có lúc báo lỗi ở `q-concurrency-jvm.js` (T02) và `q-aws.js`/`q-ai.js` (T06) do các agent đó đang ghi dở; các lỗi này **không** thuộc file của T03 và đã tự hết sau khi agent tương ứng sửa. File `q-spring-data.js` luôn sạch.
- `db-011` dài ~4.4k ký tự (hơn mốc 4000 của `AGENTS.md`) vì là câu so sánh Oracle/PostgreSQL có bảng + 7 khác biệt "gây bug" — chấp nhận để đáp án đủ sâu; có thể cắt nếu muốn đồng đều.
- Không sửa file nào ngoài `js/data/q-spring-data.js` và file task này; không commit/push.
