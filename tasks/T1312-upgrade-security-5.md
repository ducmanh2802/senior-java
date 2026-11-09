# T1312 — Nâng cấp đáp án q-security: security-033 … security-038

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`
After: T1297

Nâng cấp 6 đáp án (field `a`) dưới đây cho đủ chuẩn AGENTS.md mục 6. Người học tự ôn, không có ai giảng thêm, nên phần bổ sung phải **cụ thể, đúng kỹ thuật, dễ hiểu**.

- `security-033` (8188 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-034` (7767 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-035` (6917 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-036` (8048 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-037` (7351 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu
- `security-038` (7348 ký tự): thiếu Ví dụ đời thực, thiếu Trả lời mẫu

Với MỖI id ở trên:
1. **Thiếu Ví dụ đời thực** → thêm mục `### Ví dụ đời thực` (700–1200 ký tự): một tình huống production cụ thể, có số liệu, đi theo mạch **triệu chứng → điều tra (lệnh/metric/log cụ thể) → nguyên nhân gốc → cách xử lý → kết quả đo được**. Phải khớp với cơ chế mà đáp án đã giải thích; không bịa API, flag, tham số cấu hình hay tên metric. Không chắc thì viết ít lại nhưng đúng.
2. **Thiếu Trả lời mẫu** → thêm mục `### Trả lời mẫu khi phỏng vấn`: một đoạn văn nói tự nhiên 150–220 từ, ngôi thứ nhất, đặt trong dấu ngoặc kép, như ứng viên Senior trả lời thật (ý chính → cơ chế → trade-off → kinh nghiệm thực tế). Nếu đáp án đã có mục tương đương (ví dụ "Trả lời miệng 1 phút") thì KHÔNG thêm.
3. **Ngắn** (< 3000 ký tự) → bổ sung thêm phần giải thích cơ chế (`### Cơ chế từng bước` hoặc bảng so sánh, pitfall production) để đáp án đạt 3000–5000 ký tự.
4. Chèn các mục mới **ngay trước** dòng `> Senior tip:` (Senior tip luôn ở cuối). Viết tiếng Việt **có dấu đầy đủ**; thuật ngữ kỹ thuật giữ tiếng Anh.
5. **Thiếu follow** → thêm field `follow: [...]` gồm 2–3 câu hỏi đào sâu mà interviewer hay hỏi tiếp.

Luật:
- **Chỉ thêm**, không xoá/viết lại nội dung đã có, không đụng câu hỏi khác ngoài danh sách.
- File rất lớn: **sửa bằng công cụ edit theo từng đoạn nhỏ** (tìm đúng dòng `> Senior tip:` của id đó). **TUYỆT ĐỐI KHÔNG ghi lại toàn bộ file**, không sửa file nào khác (có cơ chế tự khôi phục file không thuộc task).
- Markup: dùng `{{code}}` cho inline code (không lồng dấu ngoặc nhọn bên trong), `~~~java` cho code block. KHÔNG dùng backtick và `${` trong đáp án.

Nghiệm thu:
- `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit.
- Ghi `Status: DONE` (sửa dòng Status ở đầu file) + Notes ngắn: id nào thêm mục gì.

## Notes
- `security-033` (Spring Security internals): thêm `### Ví dụ đời thực` (triệu chứng 18% 401/~2400 lỗi/giờ → điều tra TRACE `FilterChainProxy`/Micrometer → root cause chain `/**` `@Order(1)` nuốt `/api/**` → sửa `securityMatcher`+`@Order`, thêm MockMvc 200/401/302; 401 về 0). Thêm `### Trả lời mẫu khi phỏng vấn` (ngôi thứ nhất, luồng `DelegatingFilterProxy`→`FilterChainProxy`→chain→filter order, case thật).
- `security-034` (JWT/RS256-HS256/JWKS/thu hồi): thêm `### Ví dụ đời thực` (rotation 02:00, 35% 401/~1900 lỗi/phút, JWKS CDN cache 15 phút + gỡ key sớm → overlap key/công bố chồng, TTL cache 5 phút, test `exp/aud/alg=none/HS256`; lần sau 0 lỗi). Thêm `### Trả lời mẫu khi phỏng vấn` (fix `alg` server-side, `kid`/JWKS overlap, case thật).
- `security-035` (OAuth2 Auth Code+PKCE/token exchange): thêm `### Ví dụ đời thực` (SPA thiếu `state`/PKCE, 27 tài khoản bị chiếm, code lộ front-channel → PKCE S256+`state`+`redirect_uri` exact, `invalid_grant` 100% khi tái hiện, 30 ngày 0 sự cố). Thêm `### Trả lời mẫu khi phỏng vấn` (flow, `state`/PKCE, không implicit, RFC 8693, case thật).
- `security-036` (bcrypt/Argon2id/salt/pepper/DelegatingPasswordEncoder): thêm `### Ví dụ đời thực` (2,1M hash bcrypt cost 10 từ 2019, benchmark ~28k/s GPU → `DelegatingPasswordEncoder` `idForEncode=argon2id`, `upgradeEncoding()` rehash on login, `VARCHAR(255)`, rate limit; 30 ngày 72% nâng cấp, p95 340 ms). Thêm `### Trả lời mẫu khi phỏng vấn` (salt/pepper, upgrade dần, chọn tham số ~300 ms).
- `security-037` (SSRF): thêm `### Ví dụ đời thực` (avatar URL fetch trả credential IMDS 169.254.169.254, 12 request S3 lạ/48h → allowlist host+https, resolve chặn loopback/link-local/private, tắt follow redirect, IMDSv2 required+hop limit 1, network policy; 25 payload bị chặn, 14 ngày không egress metadata). Thêm `### Trả lời mẫu khi phỏng vấn` (allowlist over blocklist, DNS/rebinding/redirect, phòng thủ nhiều lớp).
- `security-038` (TLS/mTLS handshake/cert chain/rotation): thêm `### Ví dụ đời thực` (9 microservice, 03:17 cert hết hạn + thiếu intermediate, PKIX path building failed, 62%/~3800 lỗi/phút → full chain + reload, chuyển cert-manager, metric `x509_cert_not_after` cảnh báo 14/7/1 ngày; 11 phút về 0, 60 ngày 6 renew 0 downtime). Thêm `### Trả lời mẫu khi phỏng vấn` (handshake ECDHE, chain verify, keyStore/trustStore, rotation overlap+reload, case thật).
- Các câu đều đã có `follow` (2–3 câu) nên không thêm field mới. Chèn 2 mục mới ngay trước `> Senior tip:` của từng câu; không dùng backtick/`${`/inline code có `{}` lồng.
- Chạy: `node --check js/data/q-security.js` OK; `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.` (cảnh báo `path.js` 2 lesson không đổi, ngoài phạm vi). Không commit.
Reviewed-by: kilo (T1312R)
