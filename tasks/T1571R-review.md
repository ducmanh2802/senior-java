# T1571R — Fact-check nội dung mới của T1571

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1571 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 8 câu hỏi mới (spring-056 đến spring-060, jpa-049, jpa-050, db-056). Tất cả đúng kỹ thuật theo chuẩn Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15. Không có lỗi markup (không backtick, không `${` chưa escape). Không cần sửa nội dung.
- spring-056: BFPP vs BPP, static @Bean registration, "not eligible" warning, proxy preservation — đúng
- spring-057: proxyBeanMethods full vs lite mode, method parameter DI — đúng
- spring-058: self-invocation bypasses proxy, JDK/CGLIB limitations, solutions — đúng
- spring-059: REQUIRES_NEW for audit attempt vs success, connection pool risk, outbox pattern — đúng
- jpa-049: first-level cache, flush/clear/refresh, bulk SQL bypasses context — đúng
- jpa-050: @Version optimistic locking, rollback-only transaction, HTTP 409, retry with new transaction — đúng
- db-056: HikariCP leakDetectionThreshold measures borrow time, stack trace shows borrow point, real leak vs long query — đúng
- spring-060: Spring Boot 3 AutoConfiguration.imports, @AutoConfiguration, conditions, ApplicationContextRunner — đúng
Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
