# T126R — Fact-check nội dung mới của T126

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T126 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Review 8 câu mới (security-015..022, diff +508 dòng). Cú pháp + markup sạch ngay từ đầu, không có lỗi lạ/broken literal; đã sửa 7 lỗi kỹ thuật/nội dung:

- **security-015**: claim sai "6.0 đã xoá authorizeRequests()/antMatchers()" — thực tế 6.0 chỉ **deprecated** authorizeRequests() và xoá antMatchers()/mvcMatchers()/regexMatchers() (thay bằng requestMatchers()); cả authorizeRequests() và and() bị xoá ở 7.0; lambda DSL có từ 5.2 (đối chiếu docs.spring.io).
- **security-016**: sửa claim sai về @JsonIgnore ("quên setter thì Jackson vẫn bind") — @JsonIgnore áp cho cả logical property nên tắt luôn chiều deserialize; chỉ chặn deserialize đúng cách bằng @JsonProperty(access = READ_ONLY).
- **security-017**: chỉnh bullet leak token rõ hơn (query URL lọt access log/referer).
- **security-018**: bullet "/error dispatch bị bảo vệ sai cách" tối nghĩa, viết lại đúng cơ chế: từ chuỗi 6.x AuthorizationFilter áp cho cả ERROR dispatch, phải permitAll cho /error hoặc dispatcherTypeMatchers(...ERROR...).permitAll() (đối chiếu docs.spring.io + issue #14481 spring-projects/spring-security).
- **security-019**: "bật validationTimeout" sai cơ chế (nó luôn chạy, mặc định 5 giây) — viết lại hướng dẫn maxLifetime/validationTimeout đúng.
- **security-020**: ví dụ SpEL so sánh #account.ownerId (số) với authentication.name (chuỗi) lệch kiểu — đổi thành so sánh String với String.
- **security-021**: hai dòng GRANT/REVOKE trong SQL không chính xác với Postgres (PUBLIC không có quyền mặc định; revoke từ app_role là no-op) — sửa thành GRANT INSERT/SELECT + REVOKE ALL FROM PUBLIC, thêm lưu ý partition theo tháng (PK phải gồm cả cột phân khoá).

Các claim còn lại đã spot-check với tài liệu chính thức và đều đúng: NimbusJwtDecoder clock skew 60s, JWKS cache TTL 5 phút, prefix SCOPE_, JwtIssuerAuthenticationManagerResolver chống SSRF, issuer-uri fail lúc khởi động, RDS IAM token 15 phút, rotation alternating users (AWSPENDING/AWSCURRENT/AWSPREVIOUS), CloudTrail data events cho GetSecretValue, RFC 7662/8693, S3 Object Lock compliance mode, AuthorizationManager check(Supplier<Authentication>). Nội dung HEAD (security-001..014) không đụng đến. `node scripts/validate.js` → OK (cảnh báo đáp án ngắn còn lại là của q-english.js — file task khác).
