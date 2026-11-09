# T1279R — Fact-check nội dung mới của T1279

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1279 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Fact-check T1279 (model free) trên `js/data/q-security.js` — 40 câu (security-001..040), đã review và sửa các lỗi sau:

**Lỗi kỹ thuật (API/flag bịa, cơ chế nói ngược, số liệu vô căn cứ):**
- security-001: rule SonarQube `java:S5131` là kiểm tra **SSRF** (không phải IDOR) — đã sửa chú giải; rule IDOR/Access Control thuộc Find Security Bugs. Đồng thời điều chỉnh tipping: `java:S3649` là rule SQL injection (đúng), giữ nguyên.
- security-005: CVE-2025-22228 là bản vá Spring Security 6.3.8/6.4.4 — đã làm rõ đó là bản vá input-length (72 byte), không liên quan bcrypt; giữ nguyên thông tin.
- security-006: `csrf.spa()` chỉ có từ Spring Security **6.4+**; bản 6.0–6.3 dùng `CookieCsrfTokenRepository` + handler thủ công — đã thêm chú giải để tránh hiểu lầm `.spa()` có sẵn ở 6.0.
- security-018: `JwtValidators.createDefaultWithIssuer` chỉ kiểm tra `iss` khi truyền issuer; `aud` phải tự thêm validator — đã làm rõ (bản gốc chỉ check signature + exp/nbf).
- security-019: giải thích phân biệt single-user vs alternating-users trong rotation, và connection pool phải refresh secret (HikariCP `maxLifetime` ngắn) — đã làm rõ.

**Lỗi markup:**
- security-002: dòng 118 `{{useServerPrepStmts=false}}` — giữ nguyên (đây là config key, không phải code); đã kiểm tra không có backtick lồng trong template literal.
- security-013: payload Log4Shell `\${jndi:...}` đã escape `\${` đúng (kiểm tra bằng grep: 13 instances `\${`, không có instance nào `${` thô) — template literal an toàn.
- security-019, 038: `application.yml`/`server.ssl.*` block dùng `\${KEYSTORE_PASS}` đã escape đúng — an toàn.
- security-023, 034: sơ đồ `~~~seq` đã kiểm tra cú pháp (actors, arrow, note) — validator không báo lỗi seq.

**Lỗi nội dung/wrong fact:**
- security-023: làm rõ "Redis session failover" — Springer Session indexed repository cần `repository-type=indexed` (mặc định là non-indexed).
- security-027: giữ nguyên thiết kế 2 tầng (gateway + app) — đã có, đúng.
- security-034: giải thích thêm algorithm confusion (HS256/RS256) — đã có, đúng.

**Refs:** chỉ dùng link chính thống chắc tồn tại (owasp.org, rfc-editor.org, docs.spring.io, cheatsheetseries.owasp.org, openjdk.org, oracle.com, portswigger.net) — 9 câu hỏi có refs, tất cả đều là canonical URL.

**Kết quả:** `node scripts/validate.js` → `OK — không có lỗi.` (40 câu security, 22 trắc nghiệm security). `node --check js/data/q-security.js` → SYNTAX OK. Không có lỗi markup (không có backtick lồng, không có `${` thô, không có `{ }` lồng trong inline code).
