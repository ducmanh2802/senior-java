# T1711 — 2 bài học (testing) vào lessons-testing.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-testing.js`
After: T1413

Thêm **2 bài học mới** (track `testing`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: test code phụ thuộc thời gian bằng Clock (bài tập: dịch vụ hết hạn token test được); test double: stub vs mock vs fake (bài tập: viết fake repository đếm số lần gọi để phát hiện N+1).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-testing.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài: `lesson-testing-010` (order 10, "Clock trong test: kiểm soát thời gian để kiểm thử dịch vụ hết hạn token", 1 bài tập TokenService dùng `java.time.Clock`/Clock.fixed/offset, 3 check, related: testing-001, testing-005) và `lesson-testing-011` (order 11, "Test double: stub, mock, fake và phát hiện N+1 bằng fake repository đếm truy vấn", 1 bài tập CountingFakeOrderRepository + buildReportBatch chống N+1, 3 check, related: testing-002, testing-003, testing-009). Trước khi thêm: 9 bài (001–009); sau khi thêm: 11 bài.
- Đã chạy: `node --check js/data/lessons-testing.js` (OK), `node scripts/build-light-index.js` (OK), `node scripts/qtool.js check js/data/lessons-testing.js` (OK for lessons-testing.js). 
- `node scripts/test-lessons.js` EXIT 1 do lỗi compile không thuộc file sở hữu: `lesson-sql-010#1: reference + tests COMPILE ERROR` (Main.java: cannot find symbol Row) trong `js/data/lessons-sql.js`; tổng "Lesson exercises OK: 259/258 (233 bài học, 257 từ cache)".
- `node scripts/validate.js` EXIT 1 do lỗi có sẵn ngoài phạm vi: `js/data/lessons-sql.js` (`lesson-sql-010.body` inline code `{{}}` / nested `{ }` trong EXPLAIN) và warning path.js (bài học không nằm trong PATH). Không sửa file khác theo luật task. Chỉ sửa `js/data/lessons-testing.js` và file task này. No git commit.
Reviewed-by: kilo (T1711R)
