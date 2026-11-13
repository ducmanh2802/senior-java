# T2018 — 8 câu hỏi Senior Java (spring, jpa) vào q-spring-data.js

Status: DONE
Agent: kilo
Owns: `js/data/q-spring-data.js`
After: T1702

Thêm **8 câu hỏi phỏng vấn mới** (topic: spring, jpa) vào `js/data/q-spring-data.js`. Id nối tiếp id lớn nhất của topic (`node scripts/qtool.js list js/data/q-spring-data.js`); đọc danh sách để **không trùng ý** (góc nào đã có thì chọn góc khác).

Chủ đề: Spring Security filter chain và thứ tự filter, JWT stateless vs session, @Transactional isolation và timeout, retry với @Retryable và idempotency, Hibernate ID generation (IDENTITY làm tắt batch insert, SEQUENCE + pooled optimizer), @OneToMany owning side và mappedBy, cascade + orphanRemoval pitfall, Spring Boot Actuator health group và readiness cho K8s.

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
Đã thêm 8 câu (id nối tiếp max cũ: spring-068, jpa-054), dùng `node scripts/qtool.js append` nên không sửa mục cũ:

- `spring-069` (lead) — filter tùy biến trong Spring Security: FilterChainProxy, `FilterOrderRegistration`, `springSecurityFilterChain` order -100, addFilterBefore/After, nhiều `SecurityFilterChain` theo `@Order`, bẫy `SecurityContext` bị clear.
- `spring-070` (senior) — session vs JWT stateless: cơ chế, bảng trade-off, logout/thu hồi, refresh token rotation + reuse detection, deny-list `jti`, version claim, opaque token.
- `spring-071` (senior) — `@Transactional(isolation, timeout)`: chỉ áp dụng khi mở transaction mới, timeout thành query timeout ở JDBC/pgjdbc cancel, 40001, chia lô.
- `spring-072` (senior) — `@Retryable` + idempotency: retryFor/noRetryFor, backoff + jitter, `@Recover`, retry budget/circuit breaker, idempotency key + `ON CONFLICT`, không retry trong cùng transaction.
- `jpa-055` (senior) — SEQUENCE + pooled vs pooled-lo, `allocationSize` phải khớp `INCREMENT BY`, cách phát hiện duplicate/nhảy id (`pg_sequences`), bảng chọn.
- `jpa-056` (senior) — `@OneToMany` owning/inverse side, helper đồng bộ hai phía, thứ tự INSERT/UPDATE (bidirectional vs unidirectional + `@JoinColumn`), khi nào bỏ collection.
- `jpa-057` (lead) — cascade vs orphanRemoval: điều kiện chạy, 8 lỗi hay gặp (setter thay collection, detached, bulk delete, `@ManyToMany`, `CascadeType.ALL`, soft delete), code đúng.
- `spring-073` (senior) — Actuator health group: liveness/readiness/startup, `management.endpoint.health.group.*`, custom `HealthIndicator`, probe K8s, có nên đưa DB/Kafka vào readiness.

Nghiệm thu: `node --check js/data/q-spring-data.js` OK; `node scripts/qtool.js check js/data/q-spring-data.js` OK; `node scripts/build-light-index.js` (281.5 KB); `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo còn lại là của `path.js`/bài học, không thuộc file này). Không commit. `git diff --numstat` của file sở hữu: 634 dòng thêm, 0 dòng xoá. Độ dài đáp án mới 5.282–6.294 ký tự, đủ `**Tóm tắt:**`, `### Ví dụ đời thực`, `### Trả lời mẫu khi phỏng vấn`, `> Senior tip:` và 2 follow mỗi câu.

Ghi chú kỹ thuật khi rà lại: ví dụ `TokenVersionFilter` trong `spring-070` được sửa để **không** để `@Component` (nếu để, Boot đăng ký như servlet filter, chạy sau chain khi `SecurityContext` đã bị clear) – phải chèn bằng `http.addFilterAfter(..., BearerTokenAuthenticationFilter.class)`, nhất quán với `spring-069`. `spring-071` nói rõ timeout áp cho **từng câu SQL**, không phải toàn bộ transaction.
Reviewed-by: kilo (T2018R)
