# T2080 — 2 bài học (api) vào lessons-api.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-api.js`

Thêm **2 bài học mới** (track `api`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: idempotency key và rate limit từ gốc: vì sao POST cần idempotent khi có retry, token bucket hoạt động thế nào (bài tập Java thuần: tự cài token bucket với Clock cố định và kho idempotency key bằng ConcurrentHashMap, test xác định).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-api.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài (chỉ append vào `js/data/lessons-api.js`, không sửa mục cũ):
  - `lesson-api-010` (order 10): *Idempotency từ gốc: vì sao POST phải idempotent và kho ConcurrentHashMap chống request song song*. Bài tập `IdempotencyExecutor` (state machine IN_PROGRESS/DONE, TTL, stale takeover, fingerprint, 409/422) — 9 test deterministic (latch + đồng hồ truyền vào), reference 9/9, starter biên dịch được và không pass.
  - `lesson-api-011` (order 11): *Token bucket từ gốc: công thức nạp token, chi phí mỗi request và cài đặt thread-safe*. Bài tập `TokenBucket` + `KeyedRateLimiter` (cost, fake clock, synchronized, retryAfter thuần) — 9 test deterministic, reference 9/9, starter biên dịch được và không pass.
- Nghiệm thu: `node --check js/data/lessons-api.js` OK; `node scripts/test-lessons.js lesson-api-010` và `... lesson-api-011` đều `Lesson exercises OK: 1/1`; `node scripts/qtool.js check js/data/lessons-api.js` → OK; `node scripts/build-light-index.js` OK.
- `node scripts/validate.js` hiện còn 8 lỗi **không thuộc file này**: `bugs.js` (bug-023/030/031) và `lessons-banking.js` (banking-007/008/009) tham chiếu các id banking đang bị task khác viết lại trong `q-banking.js` (worktree đang là 13 câu, HEAD có 44 câu và có `banking-036`). Không sửa file người khác; chạy lại validate sau khi các task banking/bugs xong.
- Chưa commit.
Reviewed-by: kilo (T2080R)
