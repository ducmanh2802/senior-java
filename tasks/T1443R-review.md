# T1443R — Fact-check nội dung mới của T1443

Status: DONE
Agent: opencode
Owns: `js/data/q-api.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1443 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review toàn bộ nội dung mới (git diff) cho 6 câu hỏi: api-011 (webhook), api-012 (Tomcat embedded), api-013 (REST/gRPC/GraphQL), api-014 (API-first OpenAPI), api-015 (Idempotency-Key), api-016 (API versioning deprecation). Tất cả đều **đúng kỹ thuật** theo chuẩn Java 17/21, Spring Boot 3.x, PostgreSQL 15:
- Outbox pattern + HMAC-SHA256 + exponential backoff + DLQ + sequence ordering cho webhook (api-011) — đúng production-grade
- Thread dump analysis (SocketInputStream.read), missing index, HikariCP pool exhaustion, virtual threads (spring.threads.virtual.enabled=true), leakDetectionThreshold, access log %{ms}T (api-012) — đúng chẩn đoán và fix
- Hybrid protocol: GraphQL BFF cho mobile, gRPC cho internal, REST+OpenAPI cho partner; tooling cost (springdoc/buf/graphql-codegen) (api-013) — đúng architecture
- Code-first crash (optional field + strict deserialization, status code 200→201), API-first flow với oasdiff CI gate, delegate pattern, contract test (api-014) — đúng quy trình
- Idempotency-Key reserve-first (INSERT ON CONFLICT DO NOTHING), request_hash, IN_PROGRESS/COMPLETED/FAILED, PSP timeout xoá reserve, TTL 7 ngày partition (api-015) — đúng pattern
- Breaking change (required field, rename, semantic), 14 tháng deprecation, Deprecation/Sunset/Link headers, parity test, brownout 503, 410 Gone, thin adapter controllers (api-016) — đúng RFC 8594/9745

Không có lỗi kiến thức, không có lỗi markup, không có chữ nước ngoài lẫn vào. Validate OK.
