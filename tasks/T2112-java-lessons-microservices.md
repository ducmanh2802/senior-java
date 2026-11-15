# T2112 — 2 bài học (microservices) vào lessons-microservices.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-microservices.js`
After: T2027

Thêm **2 bài học mới** (track `microservices`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: circuit breaker từ gốc: trạng thái CLOSED/OPEN/HALF_OPEN, ngưỡng lỗi, thời gian chờ; bài tập Java thuần: tự cài circuit breaker với Clock giả lập và test xác định chuyển trạng thái.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-microservices.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 bài (append cuối file, không sửa mục cũ):
- `lesson-microservices-016` (order 16, senior, 30'): circuit breaker nâng cao — cửa sổ trượt count-based, failureRateThreshold, minimumNumberOfCalls, HALF_OPEN giới hạn probe. 1 bài tập `RateBreaker` (Clock giả, 6 test deterministic): reference pass 6/6, starter biên dịch được và không pass hết.
- `lesson-microservices-017` (order 17, senior, 30'): breaker registry theo dependency + fallback + metrics. 1 bài tập `BreakerRegistry` (Clock giả, 6 test deterministic, có test cô lập dependency): reference pass 6/6, starter biên dịch được và không pass hết.

Nghiệm thu: `node --check` OK; `node scripts/build-light-index.js` OK; `node scripts/test-lessons.js lesson-microservices-016/017` reference pass hết, starter không pass hết; `node scripts/validate.js` → OK — không có lỗi. KHÔNG commit.
Lưu ý: 2 bài 016/017 đi sâu hơn bài 015 (đã có sẵn circuit breaker đếm liên tiếp); không trùng nội dung. `related` dùng id câu hỏi có thật (microservices-025/060/061).
Reviewed-by: kilo (T2112R)
