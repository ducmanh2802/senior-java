# T133 — Track bài học `security`: Bảo mật backend, cơ chế bằng Java thuần

Status: TODO
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-security.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. **3 bài** `lesson-security-001..003` (track `security`, order 1..3): (1) hash password: salt + PBKDF2 (javax.crypto SecretKeyFactory PBKDF2WithHmacSHA256) và so sánh constant-time (MessageDigest.isEqual); (2) tự ký/kiểm tra token kiểu JWT HS256 bằng javax.crypto.Mac + Base64 URL (header.payload.signature, kiểm tra exp); (3) rate limiter token bucket với thời gian giả lập (clock truyền vào, không dùng thời gian thật).
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes
