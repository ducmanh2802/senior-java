# T2196 — Rà soát chất lượng 15 câu KHÔNG có tag core, id lớn nhất trong q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T2135

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu KHÔNG có tag core, id lớn nhất (`node scripts/qtool.js list js/data/q-spring-data.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật Java 17/21, Spring Boot 3, Hibernate 6, PostgreSQL 15+, Kafka 3.x; không bịa API/flag/giá trị mặc định; câu không có tag core cũng phải đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; ghi vào Notes nếu trùng ý câu khác.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-spring-data.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Danh sách 15 câu (không có tag `core`, id số lớn nhất): spring-093, spring-092, spring-091, spring-090, spring-089, spring-088, spring-087, spring-086, spring-084, spring-083, spring-082, spring-073, spring-072, spring-070, spring-069.
(`spring-085`, `spring-049`, `spring-050`, `spring-051` không thuộc nhóm vì còn tag `core`.)

Kiểm chứng kỹ thuật bằng tài liệu chính thức + websearch trước khi sửa: Health group mặc định (`livenessState`/`readinessState`), `probes.enabled`, HikariCP defaults, `BindValidationException`, `DurationStyle` (số trần = mili giây), `percentiles-histogram` là map theo tên meter, `management.observations.annotations.enabled=false` (mặc định), `org.hibernate.orm.jdbc.bind` (Hibernate 6), `ContextPropagatingTaskDecorator` (Spring 6.1), graceful shutdown mặc định từ Boot 3.4, `management.tracing.mdc.*-key` (Boot 4.2).

| id | lỗi tìm thấy | đã sửa gì |
|---|---|---|
| spring-082 | `q` và `a` toàn ASCII (thiếu dấu), `**Tom tat:**` / `### Tra loi mau khi phong van` sai chính tả; **sai kỹ thuật**: nói HealthIndicator "tự được gom vào group readiness nếu đặt tên kết thúc `HealthIndicator`"; thiếu `management.endpoint.health.probes.enabled`; thiếu `show-details`, `additional-path`, `startupProbe` | Viết lại `q` + `a` có dấu đầy đủ; sửa quy tắc: indicator chỉ vào group khi tên bean được liệt kê trong `include`; thêm `probes.enabled`, `show-details: never`, `additional-path`, `startupProbe`, `successThreshold`, bảng rủi ro `exposure.include=*`, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn` |
| spring-083 | Toàn ASCII; thiếu mặc định HikariCP; gộp `SHOW PROCESSLIST` (MySQL) với PostgreSQL; gợi ý `minimumIdle` 5–10 trái khuyến nghị fixed-size pool | Viết lại có dấu; thêm bảng mặc định (maximumPoolSize 10, connectionTimeout 30s, idleTimeout 10m, maxLifetime 30m, leakDetectionThreshold 0, validationTimeout 5s, keepaliveTime 0) và điều kiện áp dụng của `idleTimeout`; tách `pg_stat_activity` (PostgreSQL) vs `SHOW PROCESSLIST` (MySQL), thêm dấu hiệu `idle in transaction`; `minimumIdle = maximumPoolSize` |
| spring-084 | Toàn ASCII; trình bày `@ConstructorBinding` như bắt buộc (Boot 3 là mặc định với record/1 constructor); **sai**: nói `Duration` dạng số trần `2` sẽ fail (thực tế = 2 **mili giây**); bịa log `Validation failed: payment.read-timeout must not be null`; thiếu `ignoreUnknownFields=false`, `@DurationUnit` | Viết lại có dấu; sửa constructor binding (chỉ cần khi có nhiều constructor); sửa `Duration` (số trần = ms, `PT30S`, `10s`, `@DurationUnit`); nêu đúng `BindValidationException` được bọc trong `BindException` + banner `Binding to target ... failed` + cách test bằng `ApplicationContextRunner`; thêm `ignoreUnknownFields = false` |
| spring-086 | Toàn ASCII; YAML `percentiles-histogram` để dạng list `[a, b]` (sai — là map theo tên meter); **bịa** property `management.metrics.exemplars.enabled`; gọi `observation.context().addHighCardinality(...)` (không tồn tại); thiếu `management.observations.annotations.enabled` và `ObservedAspect` | Viết lại có dấu; YAML đúng dạng map + `minimum-expected-value`/`maximum-expected-value`; bỏ property exemplars (bật histogram + có bridge tracing là đủ); sửa `addHighCardinalityKeyValue`; thêm mục `@Observed` + `management.observations.annotations.enabled=true` (mặc định false) |
| spring-087 | Toàn ASCII; **thiếu cả `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn`**; **bịa** property `spring.micrometer.tracing.mdc.enabled` (MDC mặc định đã có, Boot 4.2 mới có `management.tracing.mdc.*-key` để đổi tên); logger bind Hibernate 5 `BasicBinder` (Hibernate 6 là `org.hibernate.orm.jdbc.bind`); `LogstashEncoder` không cần khai báo `traceId`/`spanId` trong `fieldNames` (MDC tự nhúng) | Viết lại `q` + `a` có dấu; sửa phần MDC/correlation ID (mặc định hoạt động, `logging.pattern.correlation`, `management.tracing.mdc.*-key` từ Boot 4.2); sửa logger Hibernate 6; thêm cách Boot 3.4 `logging.structured.format.console=logstash`; thêm `### Ví dụ đời thực` + `### Trả lời mẫu khi phỏng vấn` |
| spring-089 | Thiếu cảnh báo: exception trong listener `AFTER_COMMIT` nổi lên caller dù dữ liệu đã commit (client nhận 500 nhưng đơn đã lưu); thiếu cách thay thế `TransactionSynchronizationManager.registerSynchronization` | Thêm mục `### Hai chi tiết hay bị bỏ qua` (bắt lỗi trong listener; dùng `registerSynchronization` + `afterCommit()`) |
| spring-090 | Ví dụ gọi `this.luuKiemTra(don)` — self-invocation bỏ qua proxy AOP nên `REQUIRES_NEW` không có tác dụng, mâu thuẫn với câu chuyện pool cạn | Thêm lưu ý + cách gọi qua bean khác hoặc `AopContext.currentProxy()` với `@EnableAspectJAutoProxy(exposeProxy = true)` |
| spring-091 | Chỉ có `TaskDecorator` tự viết; thiếu cách hiện đại `ContextPropagatingTaskDecorator` (Spring 6.1) copy mọi `ThreadLocal` qua `ThreadLocalAccessor` | Thêm mục `### Cách gọn hơn từ Spring Framework 6.1` |
| spring-092 | Không nói graceful shutdown là **mặc định từ Boot 3.4** (`immediate` là mặc định cũ); không nói hành vi khi request vượt `timeout-per-shutdown-phase`; thiếu công thức `terminationGracePeriodSeconds` | Thêm mục `### Hai chi tiết cần biết` (mặc định Boot 3.4; request vượt timeout bị đóng kết nối; grace period ≥ preStop + timeout + đệm, hết giờ bị SIGKILL) |
| spring-093 | Quá ngắn (1975 ký tự, dưới chuẩn 3000–5000 của AGENTS mục 6); thiếu giải thích vì sao tách probe, thiếu `startupProbe`, thiếu cấu hình đầy đủ | Thêm 4 mục: `### Vì sao không dùng một probe duy nhất`, `### Startup probe`, `### Cấu hình đầy đủ`, `### Kiểm chứng` (1975 → 3619 ký tự) |
| spring-088 | Không tìm thấy lỗi kỹ thuật (health group, `probes.enabled`, `show-details`, `preStop`, `terminationGracePeriodSeconds`, `AbstractHealthIndicator`, shutdown → `REFUSING_TRAFFIC` đều đúng) | Không sửa (chỉ xác nhận) |
| spring-073 | Không tìm thấy lỗi kỹ thuật (`probes.enabled` tự bật trên Kubernetes, không có group `startup` mặc định, `additional-path`, phân tích Kafka/DB trong readiness đều đúng) | Không sửa (chỉ xác nhận) |
| spring-069 | Không tìm thấy lỗi kỹ thuật (`SecurityProperties.DEFAULT_FILTER_ORDER = -100`, thứ tự filter Spring Security 6, `addFilterBefore/After`, `OncePerRequestFilter`, nhiều `SecurityFilterChain` theo `@Order`) | Không sửa (chỉ xác nhận) |
| spring-070 | Không tìm thấy lỗi kỹ thuật (session vs JWT, `JwtAuthenticationToken`, refresh rotation, deny-list `jti`, claim version) | Không sửa (chỉ xác nhận) |
| spring-072 | Không tìm thấy lỗi kỹ thuật (`retryFor`/`noRetryFor`, `@Backoff` jitter, `@Recover`, tách retry khỏi `@Transactional`, idempotency key + `ON CONFLICT`) | Không sửa (chỉ xác nhận) |

Ghi chú thêm:
- Trùng ý (không xoá mục theo luật): `spring-082` / `spring-073` / `spring-088` cùng chủ đề health group nhưng khác góc độ (Actuator + exposure / thiết kế probe / shutdown); `spring-089` / `spring-016` / `spring-067` cùng chủ đề `AFTER_COMMIT`; `spring-091` / `spring-047` cùng chủ đề MDC trong `@Async`; `spring-083` / `spring-049` cùng chủ đề HikariCP sizing.
- Còn 3 câu non-core **ngoài phạm vi 15 câu** vẫn không dấu: `spring-047`, `spring-048`, `spring-052` → đề xuất task rà soát riêng.
- Nghiệm thu: `node --check js/data/q-spring-data.js` OK; số mục trước/sau đều **209**; `node scripts/build-light-index.js` đã chạy; `node scripts/validate.js` không báo lỗi/cảnh báo nào cho `q-spring-data.js` (0 dòng). Validate vẫn báo lỗi ở `quiz-ccao-2.js` và `quiz-ccdv-1.js` do agent khác đang sửa đồng thời (không thuộc sở hữu T2196).
- Không commit.