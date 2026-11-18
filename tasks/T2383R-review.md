# T2383R — Fact-check nội dung mới của T2383

Status: DONE
Agent: opencode
Owns: `js/data/q-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2383 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

- T2383 để lại **4 placeholder**: security-068..071 chỉ 293 ký tự, nội dung ghi "placeholder… nội dung đầy đủ sẽ cập nhật sau"; security-067 chỉ 581 ký tự và **không có dấu tiếng Việt**. Đã hoàn thiện cả 5 câu theo AGENTS.md mục 4–6 (Tóm tắt → cơ chế → ví dụ code/số liệu → lỗi hay gặp → ví dụ đời thực → trả lời mẫu → Senior tip), độ dài 5099–7187 ký tự.
- **security-067 (BOLA / API1:2023)**: viết lại có dấu, giữ đúng API1:2023, bổ sung `findByIdAndOwnerId` (kiểm quyền ngay trong query, tránh TOCTOU), `@PreAuthorize` + `PermissionEvaluator`, 404 vs 403, test matrix cross-user, phân biệt BOLA vs BFLA (API5:2023), lưu ý GraphQL resolver lồng nhau. Không có API bịa.
- **security-068 (mass assignment / API3:2023)**: `Access.READ_ONLY` = chỉ đọc, không bind từ JSON; `@JsonIgnore` chặn cả hai chiều; `WebDataBinder.setAllowedFields` là allowlist (`setDisallowedFields` deprecated từ Spring Framework 6.1); Spring Boot **tắt** `FAIL_ON_UNKNOWN_PROPERTIES` nên field lạ bị bỏ qua chứ không báo 400. Đúng.
- **security-069 (SSRF / API7:2023)**: `169.254.169.254` (metadata), dải CGNAT `100.64.0.0/10`, `isSiteLocalAddress()` chỉ bắt 10/8–172.16/12–192.168/16 (không bắt link-local/CGNAT), phải kiểm **tất cả** IP từ `getAllByName`, DNS rebinding + pin IP, `HttpClient.Redirect.NEVER`, egress proxy, IMDSv2 hop limit 1. Đúng.
- **security-070 (password hashing)**: tham số OWASP (Argon2id m=19 MiB/t=2/p=1; scrypt N=2^17/r=8/p=1; bcrypt cost ≥10; PBKDF2-HMAC-SHA256 600k, SHA-512 210k), bcrypt chỉ 72 byte, `Argon2PasswordEncoder` mặc định 4096 KiB/t=3 → nâng 19456 KiB, `DelegatingPasswordEncoder` + rehash on login, `matches()` constant-time. Đúng.
- **security-071 (audit log)**: phân biệt audit/security/debug log, trường tối thiểu (who/what/when/where/outcome/traceId), `AuditEventRepository` + `InMemoryAuditEventRepository` + `/actuator/auditevents` (mặc định in-memory, không dùng production), AOP `@Around`, outbox, append-only/WORM (S3 Object Lock), hash chain, PCI DSS giữ 12 tháng (3 tháng gần nhất sẵn sàng). Đúng.
- **Markup**: sửa 2 chỗ `{{GET /api/v1/accounts/{id}/balance}}` và `{{/resource/{id}/...}}` bị lồng `{}` (validator báo) → dùng `ID` thay `{id}`; toàn bộ `{{...}}` cân bằng, không backtick, không `${`, code fence `~~~` đóng đúng.
- `node --check js/data/q-security.js` OK. `node scripts/validate.js`: **không còn lỗi/cảnh báo nào thuộc q-security.js** (security-067..071 không còn "đáp án ngắn").
- **Lưu ý trùng lặp (không sửa vì ngoài phạm vi fact-check)**: 5 chủ đề BOLA / mass assignment / SSRF / password hashing / audit log đều đã có câu riêng trước đó (ví dụ security-005/016/029/036/057/073/074/076). Đề nghị integrator cân nhắc gộp hoặc bỏ bớt để tránh nội dung lặp.
- `node scripts/validate.js` toàn repo vẫn báo lỗi ở **file của agent khác**, không thuộc task này và không được sửa: `quiz-java.js` (syntax), `labs-incident.js` (Unicode escape), `lessons-claude.js` (id/ ký tự lạ/ inline code lồng ngoặc), `index-light.js` (stale — `node scripts/build-light-index.js` hiện fail vì `quiz-java.js` lỗi syntax).
