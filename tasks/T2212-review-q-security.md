# T2212 — Rà soát chất lượng 15 câu id NHỎ nhất trong q-security.js

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T2144

## Bối cảnh
Giai đoạn ưu tiên **chất lượng**: nội dung do model free viết cần kiểm tra chéo trước khi người học (dev Java ~4 năm, hổng nền tảng) dùng đi phỏng vấn thật.

## Việc cần làm
1. Tìm 15 câu id NHỎ nhất (`node scripts/qtool.js list js/data/q-security.js` nếu là câu hỏi; file khác dùng grep -n theo id). KHÔNG đọc cả file một lần.
2. Kiểm tra từng mục: đúng kỹ thuật hiện hành (Java 17/21, Spring Boot 3, AWS/K8s 2026); không bịa API/flag/giá/giới hạn; đủ **Tóm tắt:**, ### Trả lời mẫu khi phỏng vấn, > Senior tip:; Notes ghi câu trùng ý.
3. **Sửa đúng** chỗ sai/thiếu; không chắc thì viết ở mức nguyên lý, bỏ chi tiết bịa. Không xoá mục, không đổi id.

## Luật
- Đọc AGENTS.md (schema; mục 5 markup: không backtick, không ký hiệu đô-la + ngoặc nhọn trong template literal).
- Ngoại lệ cho luật "chỉ thêm": task rà soát được sửa nội dung có sẵn. Đếm số mục trước/sau phải bằng nhau.
- Không commit.

## Nghiệm thu
`node --check js/data/q-security.js`; `node scripts/build-light-index.js`; `node scripts/validate.js` (bài học thêm `node scripts/test-lessons.js`, bug thêm `node scripts/test-bugs.js`) → OK.
Xong: `Status: DONE`. Notes: bảng `id | lỗi tìm thấy | đã sửa gì`.

## Notes

Kết quả rà soát 15 câu id nhỏ nhất trong js/data/q-security.js (security-001 → security-015):

| id | lỗi tìm thấy | đã sửa gì |
|----|--------------|-----------|
| security-001 | Không lỗi. Đủ Tóm tắt / ### Trả lời mẫu / > Senior tip. Kỹ thuật đúng (OWASP A01/A02/A03:2021, BCrypt cost 12, AES-GCM IV 12 byte, kiểm tra ownership service layer). | Không cần sửa. |
| security-002 | Không lỗi. PreparedStatement an toàn, JPQL nối chuỗi bị injection, ORDER BY whitelist, native query ?1 an toàn. | Không cần sửa. |
| security-003 | Không lỗi. JWT cấu trúc 3 phần, HS256/RS256, validate exp/nbf/iss/aud, denylist jti (Redis TTL=exp-now), RFC 9700 refresh rotation. | Không cần sửa. |
| security-004 | Không lỗi. Auth Code + PKCE (RFC 7636) cho SPA/mobile, Client Credentials cho service-to-service, Implicit đã deprecated, OIDC id_token/nonce. | Không cần sửa. |
| security-005 | Không lỗi. Bcrypt vs Argon2id đúng (OWASP min m=19 MiB,t=2,p=1 — đối chiếu OWASP cheat sheet), SHA-256/AES không dùng lưu pass, bcrypt limit 72 byte. | Không cần sửa. |
| security-006 | Không lỗi. CSRF/SameSite, Spring Security 6.4 csrf().spa(), API stateless JWT không cần CSRF. | Không cần sửa. |
| security-007 | Không lỗi. Stored/Reflected/DOM XSS, output encoding theo ngữ cảnh, CSP, JSONP cấm, X-Content-Type-Options nosniff. | Không cần sửa. |
| security-008 | Không lỗi. IDOR ownership check ở service layer, @PreAuthorize/PermissionEvaluator, trả 404 thay 403, EXISTS với composite index. | Không cần sửa. |
| security-009 | Không lỗi. Phân biệt Hashing/Encryption/Encoding, AES-GCM nonce 12 byte, RSA-OAEP ~190 byte (RSA-2048), quản lý key Vault/KMS/HSM. | Không cần sửa. |
| security-010 | Không lỗi. TLS 1.3 handshake, mTLS, keystore/truststore, SC-081 hạn hiệu cert (200 ngày 3/2026 → 47 ngày 2029 — đối chiếu CA/B Forum). | Không cần sửa. |
| security-011 | Không lỗi. HMAC-SHA256 + MessageDigest.isEqual so sánh đều đặn, RSA-PSS, timestamp ±5 phút + nonce Redis, non-repudiation. | Không cần sửa. |
| security-012 | Không lỗi. SSRF metadata 169.254.169.254/IMDSv2, XXE disallow-doctype-decl, ObjectInputFilter JEP 290, Jackson polymorphic allowlist. | Không cần sửa. |
| security-013 | Không lỗi. Log4Shell root cause JNDI, SCA/SBOM SPDX/CycloneDX, quy trình vá T+0→T+72h, Log4j 2.12.4 (Java 7)/2.3.2 (Java 6)/2.17.1+ (Java 8 — đối chiếu Apache). | Không cần sửa. |
| security-014 | Không lỗi. Rate limiting per user + IP, khóa tăng dần (exponential backoff), CAPTCHA, PwnedPasswords k-anonymity. | Không cần sửa. |
| security-015 | Không lỗi. Spring Security 6 lambda DSL, @Order, securityMatcher, CORS trước bộ lọc xác thực, ERROR dispatcher permitAll. | Không cần sửa. |

Kết luận: 15/15 câu đúng kỹ thuật hiện hành (Java 17/21, Spring Boot 3, AWS/K8s 2026), không bịa API/flag/giới hạn, đủ cả 3 mục bắt buộc (Tóm tắt, Trả lời mẫu, Senior tip). Không có câu trùng ý chính xác nhau trong 15 câu (có một số liên quan: 001↔008 kiểm soát truy cập, 001↔009 mã hóa, 003↔004 OAuth2/JWT nhưng phạm vi khác nhau nên giữ nguyên). Không xoá mục, không đổi id, số mục trước/sau không thay đổi, không commit.

Các事实 đã đối chiếu nguồn chính thức: OWASP Password Storage Cheat Sheet, Apache Log4j release notes, CA/B Forum Ballot SC-081v3.
