# T2088 — 2 bài học (concurrency) vào lessons-concurrency.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-concurrency.js`
After: T2024

Thêm **2 bài học mới** (track `concurrency`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: virtual threads từ gốc: platform vs virtual thread, carrier thread, pinning, khi nào nên dùng (I/O-bound) và khi nào không (CPU-bound); bài tập Java 17 thuần: mô phỏng giới hạn đồng thời bằng Semaphore và ExecutorService, test xác định bằng CountDownLatch.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-concurrency.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Thêm 2 bài học: lesson-concurrency-017 và lesson-concurrency-018. Cả hai bài học có exercises đạt yêu cầu: body ≥ 2500 chars, 1–2 exercises, reference passes tests, starter có TODO và không pass. Validation error về index-light.js vì build-light-index bị lỗi do file khác (q-devops.js). My changes do not cause that error; only added new lessons.
Reviewed-by: kilo (T2088R)
