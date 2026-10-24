# T133 — Track bài học `security`: Bảo mật backend, cơ chế bằng Java thuần

Status: DONE
Agent: opencode
Owns: `js/data/lessons-security.js`

Đọc AGENTS.md mục **12** và bài mẫu `lesson-collections-001` (js/data/lessons-collections.js) thật kỹ. File `lessons-security.js` đã có sẵn (rỗng, đã gắn vào index.html) — thêm vào trong `push(...)`. **3 bài** `lesson-security-001..003` (track `security`, order 1..3): (1) hash password: salt + PBKDF2 (javax.crypto SecretKeyFactory PBKDF2WithHmacSHA256) và so sánh constant-time (MessageDigest.isEqual); (2) tự ký/kiểm tra token kiểu JWT HS256 bằng javax.crypto.Mac + Base64 URL (header.payload.signature, kiểm tra exp); (3) rate limiter token bucket với thời gian giả lập (clock truyền vào, không dùng thời gian thật).
Mỗi bài: body ≥ 2500 ký tự kết bằng `### Liên hệ phỏng vấn`, 1–2 bài tập Java 17 chỉ dùng JDK chuẩn (starter biên dịch được + `throw new UnsupportedOperationException("TODO")`, tests deterministic ≥ 3 case in PASS/FAIL/RESULT, reference pass 100%), 2–4 câu `check`. Chạy `node scripts/test-lessons.js` và `node scripts/validate.js` → OK, rồi `Status: DONE`.

## Notes

- Đã thêm **3 bài** vào `js/data/lessons-security.js`: `lesson-security-001` (mid — salt ngẫu nhiên + `SecretKeyFactory`/`PBKDF2WithHmacSHA256` + so bằng `MessageDigest.isEqual`), `lesson-security-002` (senior — JWT HS256 tự ký/verify bằng `javax.crypto.Mac` + `Base64` URL, kiểm `exp`, bẫy `alg`), `lesson-security-003` (lead — token bucket với clock truyền vào + sliding window log, bảng so sánh thuật toán, Redis Lua).
- Mỗi bài: body 3.700–6.000 ký tự, kết bằng `### Liên hệ phỏng vấn`, 3 goals, 3 câu `check`; tổng **5 bài tập** (1+2+2) với **33 case** in PASS/FAIL/RESULT. Starter nào cũng biên dịch được bằng `javac --release 17` và **không** pass hết; reference pass **100%**.
- Kiểm chứng: `node scripts/validate.js lessons-security.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js` (toàn repo) → `Lesson exercises OK: 66/66 (57 bài học)`; `node scripts/validate.js` lần cuối → `OK — không có lỗi.` (lúc giữa chừng vướng lỗi cú pháp `algo.js` của task khác đang sửa dở, đã tự hết).
- Không sửa file ngoài phạm vi sở hữu; không commit. Lưu ý môi trường: lần chạy `test-lessons.js` toàn repo có thể lỗi `EPERM` ở bước `fs.rmSync` thư mục tạm trên Windows (file bị khoá tạm thời) — đó là lỗi dọn dẹp, không phải lỗi test; chạy lại là qua.
Reviewed-by: opencode (T133R)
