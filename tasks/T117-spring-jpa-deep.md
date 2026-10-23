# T117 — Spring Boot 3 / Hibernate 6: câu hỏi xoáy mức Senior

Status: TODO
Agent: codex
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn (không trùng). Thêm **~6 câu topic `spring`** và **~6 câu topic `jpa`**: @Transactional self-invocation + proxy JDK vs CGLIB, propagation REQUIRES_NEW giữ 2 connection (cạn pool), Boot 3 auto-configuration (AutoConfiguration.imports, @ConditionalOn…), observability Micrometer Tracing, virtual threads với spring.threads.virtual.enabled, graceful shutdown; JPA: persistence context & dirty checking flush order, LazyInitializationException và open-in-view, @Version optimistic lock + retry, batch insert (hibernate.jdbc.batch_size, IDENTITY phá batching), @EntityGraph vs JOIN FETCH vs pagination (HHH000104), second-level cache khi nào không nên. Có `refs` nếu chắc link. `node scripts/validate.js` + `node scripts/check-links.mjs q-spring-data.js` → OK.

## Notes
