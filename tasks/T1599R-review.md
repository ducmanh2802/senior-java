# T1599R — Fact-check nội dung mới của T1599

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1599 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Đã review diff (nội dung mới) trong `js/data/q-spring-data.js`: `spring-061`..`spring-065`, `jpa-051`, `db-057`, `db-058`.
- Kiểm tra kỹ thuật theo Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x: `spring.threads.virtual.enabled` (Boot 3.2+/Java 21), tác động virtual thread lên HikariCP/pinning, `RestClient` (Spring 6.1/Boot 3.2+) vs `WebClient`/`RestTemplate` (maintenance), `ProblemDetail`/RFC 9457 & `spring.mvc.problemdetails.enabled`, Micrometer Observation/Tracing + propagation, `@Transactional(readOnly=true)` với Hibernate `FlushMode.MANUAL`, `Page`/`Slice`/keyset pagination, Flyway/Liquibase + expand/contract, graceful shutdown K8s (`server.shutdown=graceful`, `preStop`, `terminationGracePeriodSeconds`) — không phát hiện lỗi kiến thức, API bịa, mặc định sai, hay cơ chế nói ngược cần sửa.
- Kiểm tra markup/template: không có backtick, không có `${` chưa escape trong phần mới; `node --check js/data/q-spring-data.js` OK.
- `node scripts/validate.js` → OK (không có lỗi). Không chạy `node scripts/test-lessons.js` vì task không thuộc bài học. Không thay đổi nội dung data.
