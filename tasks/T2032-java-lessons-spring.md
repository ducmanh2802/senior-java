# T2032 — 2 bài học (spring) vào lessons-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`
After: T1708

Thêm **2 bài học mới** (track `spring`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: Spring Boot auto-configuration: @Conditional, thứ tự và cách ghi đè (bài tập: mini auto-config chọn bean theo điều kiện classpath/property giả); transaction propagation REQUIRED vs REQUIRES_NEW vs NESTED (bài tập: transaction manager giả ghi log commit/rollback, test rollback-only).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-spring.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài (chỉ THÊM, không sửa mục cũ; id/order nối tiếp bài cuối):
  - `lesson-spring-016` (order 16, senior, 40') — Auto-configuration: thứ tự nạp, @Conditional (OnClass/OnMissingClass/OnProperty/OnPropertyValue/OnMissingBean) và cách ghi đè. Góc nhìn khác `lesson-spring-008`: đi sâu .imports → thứ tự @AutoConfigureBefore/After + @AutoConfigureOrder, năm cách ghi đè, pitfall. Bài tập: `AutoConfigLoader` chọn bean theo classpath/property giả + sắp topo before/after (10 test).
  - `lesson-spring-017` (order 17, senior, 40') — Propagation REQUIRED vs REQUIRES_NEW vs NESTED (savepoint), khác `lesson-spring-003`/`010` ở cơ chế connection + savepoint. Bài tập: `TxManager` mô phỏng transaction manager, đếm begin/join/suspend/resume/commit/rollback/savepoint và cạn pool (7 test).
- `related` dùng id có thật: 016 → spring-007, spring-002; 017 → spring-005, spring-003.
- Nghiệm thu: `node --check js/data/lessons-spring.js` OK; `node scripts/build-light-index.js` (regenerate index-light.js); `node scripts/test-lessons.js` → 276/276 (reference pass 100%, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` (exit 0). Cảnh báo "bài học không nằm trong PATH" là có sẵn từ trước (PATH do integrator sở hữu, không sửa).
- Không commit.
Reviewed-by: kilo (T2032R)
