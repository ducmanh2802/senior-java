# T2033 — 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T1580

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: connection pool từ gốc: vì sao cần pool, pool size, timeout chờ, leak (bài tập: tự cài pool có giới hạn với Semaphore và phát hiện connection không trả); deadlock trong DB: phát hiện bằng đồ thị chờ (bài tập: wait-for graph phát hiện chu trình).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-db.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- **Kết luận: nội dung T2033 yêu cầu đã có sẵn trong `js/data/lessons-db.js` từ trước, không thêm bản trùng** (AGENTS.md §6 cấm trùng nội dung; file chỉ được thêm, không ghi đè). Hai bài tương ứng:
  - `lesson-db-006` (order 6, senior, 30') — "Bên trong connection pool: borrow, timeout khi chờ và phát hiện leak". Body 7070 ký tự, kết bằng "### Liên hệ phỏng vấn". Giải thích **từ gốc**: vì sao mở connection tốn kém (TCP, TLS, SCRAM-SHA-256, process backend riêng của PostgreSQL, trạng thái phiên), pool size (`cores * 2 + spindles`, Little's Law, vì sao pool nhỏ thường nhanh hơn), 5 loại timeout (`connectionTimeout`/`socketTimeout`/`statement_timeout`/`lock_timeout`/`idle_in_transaction_session_timeout`), leak + `leakDetectionThreshold`, `idleTimeout`/`maxLifetime`. Bài tập `MiniPool` dùng `java.util.concurrent.Semaphore` + `java.time.Clock` (mô phỏng borrow có timeout, release idempotent, `leakedOver` phát hiện connection không trả) — 10/10 test pass.
  - `lesson-db-007` (order 7, senior, 30') — "Deadlock: hai giao dịch khoá ngược chiều và cách database phá vòng chờ". Body 6307 ký tự, kết bằng "### Liên hệ phỏng vấn". Giải thích row lock/two-phase locking, **wait-for graph** + định nghĩa chu trình, `deadlock_timeout` (1000 ms), SQLSTATE `40P01`, cách chọn victim, phòng bằng thứ tự khoá cố định + retry có giới hạn. Bài tập `WaitForGraph` (`addWait`, `findCycle` DFS xác định, `victim`) + `TransferLocks.order` — 11/11 test pass.
- Kiểm tra cấu trúc cả hai bài: đủ field bắt buộc (id, track, order, title, level, minutes, goals, body, exercises, check, tags); mỗi bài 1 bài tập Java thuần có đủ title/prompt/starter/tests/reference/hints/explain; tests ≥ 3 case deterministic; 4 câu check; body ≥ 2500 ký tự.
- Nghiệm thu đã chạy:
  - `node --check js/data/lessons-db.js` → OK
  - `node scripts/build-light-index.js` → đã ghi `js/data/index-light.js`
  - `node scripts/test-lessons.js lesson-db-006` → 10/10; `lesson-db-007` → 11/11; toàn repo `node scripts/test-lessons.js` → `Lesson exercises OK: 276/276` (reference pass hết, starter biên dịch được và không pass hết)
  - `node scripts/validate.js lessons-db.js` → `OK — không có lỗi.`
- `node scripts/validate.js` (toàn repo) còn **1 lỗi ngoài phạm vi sở hữu**: `q-devops-part.js: file không được khai báo trong js/core/data-manifest.js`. Đây là file untracked đang được task khác (T2034 — q-devops) tạo dở, không thuộc `lessons-db.js`; theo luật chỉ-sở-hữu-file nên không sửa.
- Không sửa `js/data/lessons-db.js` (đã đầy đủ và đúng), không chạy git commit.
