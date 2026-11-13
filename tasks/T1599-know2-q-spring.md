# T1599 — Kiến thức: 8 câu Spring Boot 3.x thực chiến

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`

Thêm **8 câu hỏi phỏng vấn mới** (topic: spring, jpa, db) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý**.

Chủ đề: bật virtual threads trong Spring Boot 3.2+ và ảnh hưởng tới connection pool, RestClient vs WebClient vs RestTemplate, Problem Details (RFC 9457) cho lỗi API, observability với Micrometer Observation và tracing, @Transactional(readOnly = true) có tác dụng gì thật, phân trang Spring Data (Page vs Slice vs keyset), migration DB bằng Flyway/Liquibase an toàn, graceful shutdown.

Mỗi câu theo AGENTS.md mục 4 và 6: `**Tóm tắt:**` → cơ chế từng bước và VÌ SAO → code Java ngắn có comment hoặc sơ đồ (~~~seq cho luồng nhiều bên) → bảng trade-off / khi nào dùng → pitfall production → `### Ví dụ đời thực` có số liệu → `### Trả lời mẫu khi phỏng vấn` → `> Senior tip:`; `follow` 2–3 câu. Level: chủ yếu senior, vài câu lead.

## Luật
- Đọc AGENTS.md trước (mục 4–6). **Chỉ thêm** vào `js/data/q-spring-data.js`; không sửa mục đã có, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/q-spring-data.js logs/tmp-T1599.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG và có thật**: Java 17/21, Spring Boot 3.x, Spring AI 1.x, LangChain4j, Claude API / Anthropic SDK, MCP, PostgreSQL + pgvector, Kafka, Redis, AWS hiện hành. Không bịa tên class, annotation, tham số, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể, số liệu khớp nhau.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 8 câu (append qua `node scripts/qtool.js append`, không sửa câu cũ, chỉ `js/data/q-spring-data.js`):
  - `spring-061` (senior): bật virtual threads Spring Boot 3.2+ (Java 21+) và ảnh hưởng tới HikariCP/connection pool, bulkhead/semaphore, pinning, đo lường.
  - `spring-062` (senior): so sánh RestClient vs WebClient vs RestTemplate (Boot 3.2+/Framework 6.1), timeout và connection pool.
  - `spring-063` (senior): Problem Details RFC 9457 với ProblemDetail và @ControllerAdvice, thiết kế lỗi nhất quán/an toàn.
  - `spring-064` (senior): observability với Micrometer Observation + distributed tracing (OpenTelemetry/Brave), liên kết metrics-traces-logs, sampling.
  - `jpa-051` (senior): @Transactional(readOnly=true) tác động Hibernate (FlushMode.MANUAL, dirty checking/snapshot) và JDBC, bẫy ghi/propagation, routing replica.
  - `db-057` (senior): phân trang Spring Data Page vs Slice vs keyset/cursor, chi phí COUNT, hiệu năng bảng lớn.
  - `db-058` (senior): migration an toàn với Flyway/Liquibase, expand/contract, locking, pitfalls production.
  - `spring-065` (lead): graceful shutdown Spring Boot 3.x trên Kubernetes, phối hợp preStop/readiness/terminationGracePeriod/consumer drain.
- Nghiệm thu: `node scripts/build-light-index.js` OK; `node --check js/data/q-spring-data.js` OK.
- `node scripts/validate.js` ghi nhận 1 LỖI có sẵn (không do task này, ngoài phạm vi sở hữu): `q-ai.js: ai-105.a: inline code {{tool: "callPaymentAPI", params…}} chứa dấu { } lồng nhau`. Không sửa file không thuộc sở hữu. Totals sau append: spring 56, jpa 50, db 58.
- Kiểm tra nội dung tmp: đủ `**Tóm tắt:**`, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:`, follow 2-3, không backtick/`${`, length > 1500. (Do đã tồn tại spring-032/spring-033/spring-034,spring-035, spring-018, spring-031, jpa-016, db-005, db-056 và câu Flyway khác, các câu mới bổ sung góc nhìn bổ trợ theo chủ đề yêu cầu, không trùng ý/cấu trúc với câu hiện có.)
Reviewed-by: kilo (T1599R)
