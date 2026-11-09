# T1312R — Fact-check nội dung mới của T1312

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1312 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Diff so với HEAD: chỉ `js/data/q-security.js` (+84 dòng), thêm 2 mục mới `### Ví dụ đời thực` và `### Trả lời mẫu khi phỏng vấn` cho `security-033`…`security-038` (6 câu). `security-039` không thay đổi so với HEAD — không đụng.
- Kiểm tra cú pháp: `node --check js/data/q-security.js` OK. Không có backtick hoặc `${` không escape trong vùng sửa.
- Fact-check kỹ thuật (Java 17/21, Spring Boot 3.x, chuẩn bảo mật hiện hành): `DelegatingFilterProxy`/`FilterChainProxy`/`@Order`/`securityMatcher` (033); NimbusJwtDecoder + JWKS cache/CDN, JWKS rotation overlap, `alg=none`/algorithm confusion, `jwkSetCache` cấu hình (034); Authorization Code + PKCE S256, `state`, `redirect_uri` exact match, `sessionStorage`, RFC 8693 token exchange (035); bcrypt cost/Argon2id `m=64MiB,t=3,p=1`, `DelegatingPasswordEncoder` + `upgradeEncoding()` + prefix `$2a$10$`, `VARCHAR(255)`, benchmark hashcat có ghi chú "dữ liệu kiểm thử được phép" (036); SSRF AWS metadata `169.254.169.254`, IMDSv2 `HttpTokens=required`/`HttpPutResponseHopLimit=1`, CloudTrail/VPC Flow Logs, allowlist + chặn IP private/link-local/loopback + tắt follow redirect (037); TLS cert chain `openssl s_client -showcerts`, `keytool -list -v`, `openssl verify -CAfile/-untrusted`, `x509_cert_not_after`, cert-manager/mesh/overlap/hot reload (038). Không phát hiện API/flag bịa, mặc định sai, cơ chế nói ngược, hay số liệu vô căn cứ.
- Markup đúng chuẩn (heading `###`, `{{inline code}}`, không HTML/backtick). Không chữ nước ngoài lẫn sai ngữ cảnh.
- `node scripts/validate.js` → OK (có warning sẵn `path.js: có 2 bài học không nằm trong PATH: lesson-design-006, lesson-design-007`, không thuộc phạm vi task). `node scripts/build-light-index.js` đã chạy lại (index-light 189.8 KB). Không chạy `test-lessons.js` vì không phải bài học.
- **Lỗi đã sửa:** 0 (không phát hiện lỗi kỹ thuật/markup cần sửa trong nội dung mới).
