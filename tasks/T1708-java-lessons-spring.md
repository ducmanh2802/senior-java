# T1708 — 2 bài học (spring) vào lessons-spring.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-spring.js`
After: T1428

Thêm **2 bài học mới** (track `spring`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: AOP proxy và vì sao self-invocation làm mất @Transactional (bài tập: tự viết proxy bằng java.lang.reflect.Proxy bọc transaction giả, test gọi nội bộ); vòng đời bean và BeanPostProcessor (bài tập: container DI mini có post-processor).

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
- Đã thêm `lesson-spring-014` (order 14, senior, 50'): AOP proxy, advisor/pointcut/advice, thứ tự `@Order`, JDK proxy vs CGLIB, self-invocation. Bài tập `MiniAop` bằng `java.lang.reflect.Proxy`: 10 test deterministic (transaction giả, order, pointcut, self-invocation, join, rollback, short-circuit, đổi kết quả, cast JDK proxy).
- Đã thêm `lesson-spring-015` (order 15, senior, 45'): vòng đời bean và BeanPostProcessor, phân biệt BeanFactoryPostProcessor, thứ tự before/init/after, lý do BPP tạo sớm. Bài tập `MiniContainer`: 8 test deterministic (thứ tự BPP, thay thế bean ở before/after, dependency order, prototype, circular dependency, init lỗi, close idempotent).
- Không trùng `lesson-spring-002`/`010` (AOP/self-invocation) và `004` (lifecycle): 014 tập trung vào cơ chế tạo proxy/chuỗi advisor/thứ tự, 015 tập trung vào BPP và container DI mini.
- Nghiệm thu: `node --check js/data/lessons-spring.js` OK; `node scripts/test-lessons.js lesson-spring-014` 10/10; `lesson-spring-015` 8/8; `node scripts/test-lessons.js` 254/254; `node scripts/build-light-index.js` + `node scripts/validate.js` → `OK — không có lỗi.`
- Chỉ sửa `js/data/lessons-spring.js` (thêm 2 object, giữ nguyên 13 bài cũ) và `tasks/T1708-java-lessons-spring.md`; `js/data/index-light.js` được sinh lại bởi script build theo yêu cầu nghiệm thu. Không commit.
Reviewed-by: kilo (T1708R)
