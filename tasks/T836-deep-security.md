# T836 — Đào sâu senior: security internals (8 câu)

Status: DONE
Agent: kilo
Owns: `js/data/q-security.js`

Topic **security** (file `js/data/q-security.js`) đã có 32 câu: đọc HẾT các câu hiện có của topic, không lặp ý. Mục tiêu: **đào sâu kiến thức senior/lead** — cơ chế bên trong (internals) mà interviewer dùng để phân biệt senior thật với người chỉ biết dùng API.

Thêm **8 câu**: 5 `senior` + 3 `lead`. Mỗi câu chọn 1 chủ đề dưới (chủ đề nào đã có câu tương đương thì chọn góc sâu hơn hoặc chủ đề khác cùng topic, ghi lý do vào Notes):

- Spring Security bên trong: DelegatingFilterProxy → FilterChainProxy → SecurityFilterChain, thứ tự filter, nhiều chain theo path.
- JWT: RS256 vs HS256, kid + JWKS rotation, alg=none / algorithm confusion, thu hồi token (TTL ngắn + refresh rotation + reuse detection).
- OAuth2/OIDC: authorization code + PKCE từng bước, vì sao implicit flow bị bỏ, token exchange giữa service.
- Lưu mật khẩu: bcrypt/argon2 cost factor, pepper, DelegatingPasswordEncoder và nâng cấp hash dần.
- TLS/mTLS giữa service: handshake, certificate chain, xoay vòng chứng chỉ không downtime.
- SSRF, deserialization (ObjectInputFilter), XXE — cách phòng trong Java.

Yêu cầu riêng cho các câu này:
- Giải thích cơ chế **từng bước, như dạy người chưa biết**: dữ liệu/cấu trúc bên trong trông thế nào, chuyện gì xảy ra theo thứ tự, VÌ SAO thiết kế như vậy (trade-off mà người viết JDK/framework/DB đã chọn).
- Có ít nhất 1 ví dụ cụ thể: code ngắn có comment, hoặc output thật (log, EXPLAIN, jcmd…), hoặc sơ đồ ASCII/`~~~seq`.
- Có mục "### Trên production" (triệu chứng thật, cách đo, flag/cấu hình tuning có thật) và bảng so sánh khi phù hợp.
- 3000–5000 ký tự. `follow` 3 câu đào sâu tiếp. Có thể thêm `refs` (≤ 3, chỉ link tài liệu chính thức chắc chắn tồn tại; chạy `node scripts/check-links.mjs js/data/q-security.js`).
- Không bịa flag/API. Không chắc thì viết ít lại nhưng đúng.

> **CẢNH BÁO GHI ĐÈ:** file này có thể đang chứa nội dung chưa commit của task khác. **Chỉ THÊM** bằng cách chèn object mới ngay trước dòng `);` cuối file, KHÔNG viết lại cả file, KHÔNG xoá/sửa object có sẵn. Trước khi đánh DONE: đếm số id trước và sau (`grep -c "id: '"`), số sau = số trước + số mục bạn thêm. Id luôn dùng nháy đơn.
> Đánh DONE bằng cách **sửa dòng `Status:` ở đầu file** (không thêm dòng Status mới ở cuối).
> Sơ đồ luồng nhiều bên (≥ 3 hệ thống): dùng khối `~~~seq` (cú pháp trong AGENTS.md mục 5).

## Quy tắc chung (bắt buộc)
- Đọc AGENTS.md mục 4, 5, 6. Người đọc: dev Java 4 năm, ít va chạm doanh nghiệp lớn, cần giải thích **từ gốc, rất chi tiết, có ví dụ đời thực**.
- **Chỉ THÊM** câu mới vào cuối mảng trong `js/data/q-security.js`; id tiếp nối số lớn nhất hiện có của topic (kiểm tra trùng id trước khi ghi). Không sửa câu cũ.
- TRƯỚC khi viết, đọc hết câu cùng topic để **không trùng ý**.
- Mỗi đáp án: `**Tóm tắt:**` → các mục ### (bối cảnh thật, cách làm từng bước, ví dụ số liệu/artifact, bảng trade-off, pitfall) → `> Senior tip:`. 2500–4500 ký tự. `follow` 2–3 câu.
- Không backtick, không `${` trong template literal. Không chạy file .js trực tiếp, luôn dùng `node`. Đúng kỹ thuật với Java 17/21, Spring Boot 3.x; không bịa API/flag; không chắc thì bỏ.

## Nghiệm thu
`node --check js/data/q-security.js`, `node scripts/build-light-index.js` rồi `node scripts/validate.js` → OK. KHÔNG commit. Ghi Status: DONE + danh sách id mới vào Notes.

## Notes
- Đếm id trước: 32 (security-001..032). Đếm id sau: 40 (security-033..040). Số sau = số trước + 8.
- Id mới thêm (8 câu): `security-033` (senior, Spring Security internals: DelegatingFilterProxy→FilterChainProxy→SecurityFilterChain, thứ tự filter, nhiều chain theo path/@Order), `security-034` (senior, JWT cơ chế: RS256 vs HS256, alg=none/algorithm confusion, kid+JWKS rotation, thu hồi qua access TTL ngắn + refresh rotation/reuse detection + denylist), `security-035` (lead, OAuth2 Authorization Code+PKCE từng bước với sơ đồ `~~~seq`, state/code_verifier, vì sao implicit bị bỏ, token exchange RFC 8693), `security-036` (senior, bcrypt/Argon2id internals, cost/memory/time/parallelism, salt vs pepper, DelegatingPasswordEncoder + rehash on login), `security-037` (senior, SSRF cơ chế + metadata cloud, bypass, phòng bằng allowlist/chặn IP private-đã-resolve/kiểm soát redirect/IMDSv2/network policy), `security-038` (lead, TLS/mTLS handshake TLS1.2/1.3, xác thực certificate chain, rotation overlap+hot reload, keyStore/trustStore Spring Boot, lỗi PKIX/SAN/expiry), `security-039` (senior, XXE cơ chế đọc file/SSRF, cấu hình an toàn DocumentBuilderFactory/SAXParserFactory/XMLInputFactory/TransformerFactory), `security-040` (lead, Java deserialization gadget chain, ObjectInputFilter JEP 290 allowlist/giới hạn, phòng thủ dài hạn: không deserialize input không tin, JSON/Protobuf DTO, tránh Jackson default typing).
- Góc sâu/chủ đề: security-033 đi sâu internals filter chain (khác 015/032 ở mức "dùng gì"; 021/022 là audit/threat modeling). 034 đào sâu ký/attack/rotation/revocation (bổ sung 003/023 về cửa sổ thu hồi). 035 khác 023 (chọn session/JWT) bằng luồng OAuth2/OIDC, PKCE, token exchange. 036 khác 001 (nêu bcrypt/AES) bằng cơ chế hash, tham số, salt/pepper, DelegatingPasswordEncoder migration. 037/039 bổ sung SSRF/XXE/deserialization (cơ chế phòng trong Java) — 001 có nhắc injection tổng quát nhưng chưa đào SSRF/XXE/deserialization internals. 038 đào sâu TLS handshake/chain/rotation/cấu hình Java (026 nói mTLS/mesh ở mức khái niệm).
- Mỗi câu: `**Tóm tắt:**` → thuật ngữ giải thích lần đầu → cơ chế từng bước/trade-off → code/sơ đồ/bảng → `### Trên production` (triệu chứng, đo, cấu hình/cờ có thật) → `> Senior tip:`. `follow` 3 câu, `refs` 2–3 link tài liệu chính thức (RFC/JEP/OWASP/Spring). 5 senior + 3 lead.
- Sửa lỗi khi validate: escape `\${KEYSTORE_PASS/CLIENT_KEYSTORE_PASS/TRUST_PASS}` trong template literal (038); bỏ inline code có ngoặc nhọn lồng nhau `{{ {bcrypt} ... }}` (036) theo yêu cầu validator; sửa ref URL XXE có dấu ngoặc.
- File khác chạm: `js/data/index-light.js` được cập nhật bắt buộc qua `node scripts/build-light-index.js` (theo AGENTS.md mục 2.6 / task nghiệm thu). Không sửa core/base/topics/lessons/projects/path.
- Kiểm tra: `node --check js/data/q-security.js` OK; `node scripts/build-light-index.js` OK (144.3 KB); `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo sẵn có ở q-java/q-system-design/q-scenario/q-devops và path lessons, không thuộc file sở hữu). Không commit.
Reviewed-by: kilo (T836R)
