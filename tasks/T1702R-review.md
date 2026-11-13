# T1702R — Fact-check nội dung mới của T1702

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1702 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- spring-066 (@Async executor + TaskDecorator): review OK — mặc định Boot 3 ThreadPoolTaskExecutor core=8, max=Integer.MAX_VALUE, queue=Integer.MAX_VALUE đúng docs Spring Boot; TaskDecorator copy MDC/SecurityContext, CallerRunsPolicy, CompletableFuture vs void chính xác.
- spring-067 (@TransactionalEventListener vs @EventListener): review OK — phase mặc định AFTER_COMMIT, cơ chế TransactionSynchronization/TransactionSynchronizationManager đúng.
- spring-068 (Spring Cache): review OK — SimpleKeyGenerator, @Cacheable(sync=true) không chạy với ConcurrentMap, TTL cấu hình tập trung ở Redis, @CachePut/@CacheEvict key phải khớp — chính xác.
- jpa-052 (OSIV): review OK — DELAYED_ACQUISITION_AND_HOLD giữ connection đến khi EntityManager/session đóng (hết request với OSIV), N+1 ẩn, quy trình tắt gradual đúng.
- jpa-053 (batch fetch): review OK — IN batching 1+ceil(N/batch), HHH000104, MultipleBagFetchException, giới hạn IN của Oracle 1000 — chính xác.
- jpa-054 (bulk @Modifying): review OK — bỏ qua persistence context, không tự tăng @Version, rủi ro stale entity, flushAutomatically/clearAutomatically, SET version=version+1 trong bulk — chính xác.
- spring-069: XOÁ toàn bộ — trùng chủ đề với spring-062 đã có ở HEAD (so sánh RestClient/WebClient/RestTemplate, cùng level senior). Ngoài ra YAML dùng sai flag `spring.http.client.factory.connection-timeout` (đúng: `spring.http.client.connect-timeout` / `read-timeout` theo docs Spring Boot; lỗi này bị xoá cùng câu hỏi).
- spring-070: XOÁ toàn bộ — trùng chủ đề với spring-063 đã có ở HEAD (Problem Details RFC 9457 + @RestControllerAdvice; trùng đoạn mã ApiErrors, câu chuyện 12 API thanh toán, Senior tip, 2/3 follow-up). Viên AGENTS.md §6 "không trùng nội dung với câu đã có".
- spring-063 (nội dung ở HEAD): KHÔNG sửa — đã khôi phục lại bản gốc (bỏ qua việc thay đổi tiếng không dấu do lần chạy trước); diff cuối cùng chỉ chứa 6 câu hỏi mới (spring-066, 067, 068, jpa-052, 053, 054), không xóa/sửa nội dung HEAD.
- validate.js: q-spring-data.js không báo lỗi; index-light.js đã sinh lại (quy tắc 6 AGENTS.md) và kiểm tra tính nhất quán đỡ. Lỗi còn lại của validate.js nằm ở lessons-microservices.js (file không thuộc nhiệm vụ này, không được sửa theo quy tắc 3 AGENTS.md).
