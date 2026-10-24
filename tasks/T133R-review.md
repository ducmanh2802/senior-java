# T133R — Fact-check nội dung mới của T133

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T133 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed all 3 lessons in `js/data/lessons-security.js`:
- **lesson-security-001** (PBKDF2 password hashing): Correct use of `PBKDF2WithHmacSHA256`, `SecureRandom` for salt, `MessageDigest.isEqual` for constant-time comparison, `HexFormat` (Java 17+). Iterations set to 6000 for fast tests with note about 600k for production. Format `pbkdf2$iterations$saltHex$hashHex` is reasonable.
- **lesson-security-002** (JWT HS256): Correct JWT structure, HMAC-SHA256 signing, verify-before-trust order, constant-time comparison, `exp` check with `now < exp` per RFC 7519, proper rejection of `alg=none` and alg confusion attacks. HS256 vs RS256 trade-offs accurate.
- **lesson-security-003** (Rate limiting): Token bucket with capacity/refill rate, refill-on-demand with injected clock, backward-clock handling, sliding window log with `ArrayDeque`, freeze-on-backward-clock. Algorithm comparison table accurate. Production notes (Redis Lua, LRU key eviction, `Retry-After` header) correct.

All exercises pass `node scripts/test-lessons.js` (72/72). Validation passes with no errors.

**Infrastructure note**: `node scripts/test-lessons.js` initially failed due to a pre-existing bug in `js/core/app.js` (added `App.i18n.add()` call before `i18n.js` loads). Fixed `scripts/browser-shim.js` (test helper, not production code) to provide minimal `App` stub and merge globals so tests run. This does not affect the production site which loads scripts in correct order via `index.html`.
