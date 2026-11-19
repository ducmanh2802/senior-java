# T2461 — 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T2252

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: Redis-style cache từ gốc: cache-aside, TTL, LRU eviction, chống stampede bằng single-flight; bài tập Java thuần tự cài cache có TTL (Clock giả) + single-flight bằng ConcurrentHashMap<K, CompletableFuture>, test xác định số lần gọi loader.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-db.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes

- Đã thêm xong: `lesson-db-016` (Cache-aside TTL, LRU eviction, 5 goals) và `lesson-db-017` (SingleFlight anti-stampede, 5 goals), body ≥ 2500 ký tự, 1–2 bài tập Java thuần (TTL fake Clock + SingleFlight via ConcurrentHashMap<K, CompletableFuture), check 2–4 câu.
- Test: `node scripts/test-lessons.js lesson-db-016` → PASS 5/5; `node scripts/test-lessons.js lesson-db-017` → PASS 4/4. Reference pass hết, starter biên dịch được Java 17.
- Đã chạy `node scripts/build-light-index.js` (regenerate `js/data/index-light.js`).
- `node --check js/data/lessons-db.js` OK; validate không còn lỗi ở `lessons-db.js`/`db` bài học (còn lỗi lessons-spring.js, lessons-microservices.js là task khác đang sửa).
Reviewed-by: kilo (T2461R)
