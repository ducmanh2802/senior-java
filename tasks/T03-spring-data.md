# T03 — Nội dung: Spring & Spring Boot, JPA/Hibernate, Database & SQL

Status: TODO
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
