# T1702 — 8 câu hỏi Senior Java (spring, jpa) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1571

Thêm **8 câu hỏi phỏng vấn mới** (topic: spring, jpa) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: @Async và executor mặc định, mất context bảo mật/transaction; @TransactionalEventListener và phase AFTER_COMMIT; @Transactional(readOnly = true) thực sự làm gì với Hibernate và datasource; open-in-view và LazyInitializationException; batch fetch size, EntityGraph, JOIN FETCH với phân trang; bulk update bỏ qua persistence context; Spring Cache pitfall (self-invocation, key, stale); RestClient vs WebClient vs RestTemplate trên Spring Boot 3.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế bên trong từng bước và VÌ SAO → code Java ngắn (≤ 30 dòng) có comment → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` (150–220 từ) → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, 1–2 câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 8 câu hỏi mới:
- spring-066: @Async executor cấu hình production (core/max pool, bounded queue, rejection policy, TaskDecorator copy MDC/SecurityContext)
- spring-067: @TransactionalEventListener phase AFTER_COMMIT/AFTER_ROLLBACK/AFTER_COMPLETION, outbox pattern, test với @Commit/@Rollback
- spring-068: Spring Cache pitfall (key generation, cache stampede sync=true, TTL cluster, @CachePut/@CacheEvict key match, Caffeine vs Redis)
- spring-069: RestClient vs WebClient vs RestTemplate, MVC + virtual thread chọn RestClient, cấu hình timeout/pool/circuit breaker/tracing
- spring-070: ProblemDetail RFC 9457, @RestControllerAdvice thiết kế type URI, code ổn định, detail an toàn, traceId, validation errors
- jpa-052: OSIV (open-in-view) che N+1, cạn connection pool, tắt an toàn gradual với DTO projection/EntityGraph
- jpa-053: Batch fetch vs EntityGraph/JOIN FETCH, phân trang an toàn, MultipleBagFetchException, keyset pagination
- jpa-054: Bulk update @Modifying bỏ qua persistence context, stale entity risk, flushAutomatically/clearAutomatically, @Version tăng trong bulk
Reviewed-by: kilo (T1702R)
