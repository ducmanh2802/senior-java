# T836R — Fact-check nội dung mới của T836

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T836 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi review: chỉ phần MỚI trong `git diff HEAD -- js/data/q-security.js` = `security-033`..`security-040` (8 câu; 32 id cũ `security-001`..`032` giữ nguyên). Không sửa nội dung đã có ở HEAD, không thêm/xoá mục/câu.
- Kiểm tra thực hiện: đọc diff + rà soát kỹ thuật (Spring Security 6/Boot 3.x, JWT/JWS/JWKS, OAuth2/OIDC/PKCE/token exchange, bcrypt/Argon2/DelegatingPasswordEncoder, SSRF, TLS/mTLS/PKI, XXE/Java XML parsers, JEP 290/ObjectInputFilter/deserialization), quét markup (không backtick/`${` không escape trong template literal; inline code dùng `{{}}`), quét số liệu/flag bịa và chữ nước ngoài lẫn không cần thiết. `node --check js/data/q-security.js` OK.
- `security-033` (Spring Security internals): **không sửa thêm** (nội dung đúng với Boot 3.x/Security 6: `DelegatingFilterProxy`→`FilterChainProxy`→`SecurityFilterChain` theo `@Order`/`RequestMatcher`, nhiều chain, thứ tự filter, `OncePerRequestFilter`). Class names/APIs có thật; ví dụ `SecurityFilterChain`/`@Order`/`requestMatchers` chuẩn Boot 3.
- `security-034` (JWT RS256/HS256, alg confusion, kid+JWKS, revocation): **không sửa thêm**. Cơ chế đúng (từ chối `alg=none`, khóa verify theo thuật toán kỳ vọng/tách key type, `kid` tra JWKS + cache, refresh rotation/reuse detection). Không bịa flag.
- `security-035` (OAuth2 Authorization Code+PKCE, implicit deprecated, token exchange RFC 8693): **không sửa thêm**. Luồng + tham số PKCE S256, `state`, token exchange `grant_type`/`subject_token`/`audience`/`scope` đúng RFC 7636/8693. Sơ đồ `~~~seq` hợp lệ.
- `security-036` (bcrypt/Argon2id, salt/pepper, DelegatingPasswordEncoder, rehash on login): **không sửa thêm**. Đã khớp các fix sẵn có trong diff (dùng `{{bcrypt}}` prefix thay inline code ngoặc lồng gây validator lỗi; `\$2b\$12\$...` escape `${`-like an toàn trong template). Kiểm tra chữ ký `Argon2PasswordEncoder(saltLength, hashLength, parallelism, memory, iterations)` đúng với Spring Security 6.x; ví dụ rehash dùng `matches`/`upgradeEncoding`/`encode` đúng.
- `security-037` (SSRF): **không sửa thêm**. Cơ chế/biến thể bypass đúng; ví dụ Java chặn `scheme` + allowlist host + resolve/chặn IP private/link-local/loopback + tắt auto-redirect là thực tế (ghi chú TOCTOU/DNS rebinding). IMDSv2 là lớp bổ sung đúng.
- `security-038` (TLS/mTLS, handshake 1.3 rút gọn, chain, rotation, keyStore/trustStore Boot): **không sửa thêm**. Đã khớp fix sẵn có (`\${KEYSTORE_PASS/...}` escape). Thuộc tính `server.ssl.*` và Spring Boot 3.1+ SSL bundle (`spring.ssl.bundle...`) là cấu hình có thật; lưu ý reload/SSL bundle nêu thận trọng. Tên lỗi PKIX/SAN/bad_certificate đúng.
- `security-039` (XXE, harden parsers): **không sửa thêm**. Feature/property dùng đúng tên thực (`http://apache.org/xml/features/disallow-doctype-decl`, `http://xml.org/sax/features/external-*-entities`, `XMLInputFactory.SUPPORT_DTD/IS_SUPPORTING_EXTERNAL_ENTITIES`, `ACCESS_EXTERNAL_DTD/STYLESHEET` rỗng). Khuyến nghị set cờ rõ ràng thay vì tin default — đúng thực tế.
- `security-040` (Java deserialization, gadget chain, ObjectInputFilter JEP 290): **không sửa thêm**. Mô tả hook/filter timing (`ALLOWED/REJECTED/UNDECIDED`, set trước `readObject`), pattern filter + `max*`, `jdk.serialFilter`, và cảnh báo `enableDefaultTyping`/polymorphic Jackson là đúng; magic bytes `0xAC 0xED` đúng.
- Lệnh chạy: `node --check js/data/q-security.js` OK; `node scripts/build-light-index.js` → `js/data/index-light.js` (144.3 KB); `node scripts/validate.js` → `OK — không có lỗi.` (các cảnh báo còn lại thuộc file khác, không do `q-security.js`). Không commit (theo luật). ملف
