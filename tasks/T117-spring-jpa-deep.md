# T117 — Spring Boot 3 / Hibernate 6: câu hỏi xoáy mức Senior

Status: DONE
Agent: codex
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 và mọi `q:` có sẵn (không trùng). Thêm **~6 câu topic `spring`** và **~6 câu topic `jpa`**: @Transactional self-invocation + proxy JDK vs CGLIB, propagation REQUIRES_NEW giữ 2 connection (cạn pool), Boot 3 auto-configuration (AutoConfiguration.imports, @ConditionalOn…), observability Micrometer Tracing, virtual threads với spring.threads.virtual.enabled, graceful shutdown; JPA: persistence context & dirty checking flush order, LazyInitializationException và open-in-view, @Version optimistic lock + retry, batch insert (hibernate.jdbc.batch_size, IDENTITY phá batching), @EntityGraph vs JOIN FETCH vs pagination (HHH000104), second-level cache khi nào không nên. Có `refs` nếu chắc link. `node scripts/validate.js` + `node scripts/check-links.mjs q-spring-data.js` → OK.

## Notes
Đã bổ sung spring-028–033 và jpa-022–027 (12 câu về các chủ đề yêu cầu). `node --check js/data/q-spring-data.js` và `node scripts/validate.js` đều OK. `node scripts/check-links.mjs q-spring-data.js` chạy nhưng các link sẵn có ở spring-013 báo EACCES; câu mới không thêm refs.
