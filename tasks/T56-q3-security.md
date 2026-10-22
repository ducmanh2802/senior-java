# T56 — Nội dung: Bảo mật ứng dụng

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

> **Ghi theo lô nhỏ:** thêm **2 câu mỗi lần edit** (đáp án dài). Sau mỗi lô chạy `node --check <file>` và `node scripts/validate.js <file>`.


> **Đợt 3 — câu HAY GẶP NHẤT** khi phỏng vấn ngân hàng (Techcombank, VPBank, MB, BIDV, VIB…) và big tech VN (Shopee, Grab, MoMo, ZaloPay, VNG…). Nhiều câu ở mức cơ bản/kinh điển: đáp án phải giúp người học **trả lời gọn, đúng trọng tâm như ứng viên giỏi** (mở bằng câu trả lời 30 giây), sau đó mới đào sâu những gì interviewer Senior hay vặn tiếp. Ghi rõ các **câu trả lời sai phổ biến** của ứng viên.

Đọc kỹ `AGENTS.md` mục 4–6 (schema, markup, **chuẩn chất lượng**) trước khi viết.

## Mục tiêu
Ngân hàng câu hỏi đã có sẵn câu ở các topic dưới đây. **Chỉ THÊM câu mới vào cuối mảng**, không sửa/xoá câu cũ.
File đang rỗng: ID bắt đầu từ `security-001`.
**Đọc lướt câu hỏi đã có trong file trước** để không viết trùng ý.

### topic `security`: thêm 14 câu (đang có ~0 → mục tiêu ≥ 14)
- OWASP Top 10 áp vào backend Java: mỗi mục một ví dụ lỗ hổng thật và cách chặn
- SQL injection trong Java: PreparedStatement, JPQL/HQL nối chuỗi, ORDER BY động; vì sao ORM không tự an toàn
- JWT: cấu trúc, HS256 vs RS256, validate những gì, thu hồi token, refresh token rotation
- OAuth2/OIDC: authorization code + PKCE, client credentials; chọn flow cho SPA, mobile, service-to-service
- Lưu mật khẩu: bcrypt/argon2, salt, cost factor; vì sao không dùng SHA-256 hay mã hoá hai chiều
- CSRF và SameSite cookie: khi nào API cần chống CSRF, khi nào không
- XSS: stored/reflected/DOM, output encoding, Content-Security-Policy; API JSON có bị ảnh hưởng không
- Broken access control / IDOR: kiểm tra quyền theo từng object trong Spring (ví dụ xem sao kê tài khoản người khác)
- Mật mã cơ bản cho dev: hashing vs encryption vs encoding, AES-GCM, RSA, khi nào dùng cái nào, quản lý key
- TLS và mTLS: handshake, chuỗi chứng chỉ, keystore vs truststore trong Java
- Ký request giữa ngân hàng và đối tác (HMAC/chữ ký số): chống giả mạo, replay (timestamp + nonce), non-repudiation
- SSRF, XXE và insecure deserialization trong Java: cấu hình parser XML an toàn, chặn gọi URL nội bộ
- Chống brute force đăng nhập: rate limit theo user/IP, khoá tạm, captcha, phát hiện credential stuffing
- Lỗ hổng thư viện (Log4Shell): SCA, SBOM, quy trình vá khẩn trong ngân hàng

## Yêu cầu chất lượng (quan trọng nhất)
- Mỗi đáp án **1500–4000 ký tự**: `**Tóm tắt:**` trả lời miệng 30 giây, rồi các mục `###` giải thích cơ chế **và vì sao**, ví dụ code ngắn có comment, bảng trade-off, pitfall production, kết bằng `> Senior tip:`.
- Câu hỏi theo kiểu phỏng vấn thật (tình huống, so sánh, "bạn sẽ làm gì"), không hỏi định nghĩa suông. Bối cảnh ưu tiên ngân hàng, fintech, e-commerce Việt Nam.
- Đúng kỹ thuật với Java 17/21, Spring Boot 3.x, Hibernate 6. **Không bịa API, flag hay số liệu**; không chắc thì viết ít lại nhưng đúng.
- `follow`: 2–3 câu hỏi đào sâu. Level xen kẽ: khoảng 25% mid, 55% senior, 20% lead.

## Nghiệm thu
`node scripts/validate.js` → OK và số câu mỗi topic đạt mục tiêu. Integrator sẽ fact-check sau.

## Notes
Đã thêm 14 câu hỏi cho topic `security` (security-001 đến security-014). Tất cả pass validation (`node scripts/validate.js q-security.js` → OK). Các câu hỏi bao gồm: OWASP Top 10, SQL Injection, JWT/Refresh Token Rotation, OAuth2/OIDC/PKCE, Password Hashing (bcrypt/Argon2id), CSRF/SameSite, XSS/CSP, IDOR/Ownership Check, Cryptography (AES-GCM/RSA/Key Management), TLS/mTLS, Request Signing (HMAC/Digital Signature), SSRF/XXE/Deserialization, Brute Force Protection, Log4Shell/SCA/SBOM. Level distribution: 3 mid, 8 senior, 3 lead (gần đúng tỷ lệ 25/55/20).
