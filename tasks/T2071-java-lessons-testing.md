# T2071 — 2 bài học (testing) vào lessons-testing.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-testing.js`
After: T1711

Thêm **2 bài học mới** (track `testing`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: test tích hợp đúng cách cho Spring Boot 3: test pyramid, khi nào @SpringBootTest vs @WebMvcTest/@DataJpaTest, Testcontainers PostgreSQL với @ServiceConnection, dọn dữ liệu giữa các test, test flaky và cách loại bỏ (thời gian, thứ tự, dữ liệu dùng chung); bài tập Java thuần: viết fake repository + Clock cố định để test service xác định.

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
Đã thêm 2 bài mới (chỉ APPEND vào `js/data/lessons-testing.js`, không sửa mục cũ). Trước: 11 bài (order 1–11); sau: 13 bài.

- `lesson-testing-012` — order 12, senior, 40': "Test tích hợp đúng cách cho Spring Boot 3: test pyramid, slice test, Testcontainers và dọn dữ liệu". Body 8523 ký tự. 1 bài tập Java thuần `SliceTestSimulator` (quét annotation → chọn hạ tầng, đếm truy vấn, dọn dữ liệu), 10 test case deterministic. 3 câu check.
- `lesson-testing-013` — order 13, senior, 35': "Test xác định cho service: fake repository + Clock cố định, diệt flaky do thời gian và thứ tự". Body 6809 ký tự. 1 bài tập `WithdrawalService` (fake repository + `Clock.fixed`), 9 test case deterministic. 3 câu check.

Nội dung bám sát yêu cầu: test pyramid, `@SpringBootTest` vs `@WebMvcTest`/`@DataJpaTest`, Testcontainers + `@ServiceConnection` trên PostgreSQL thật, dọn dữ liệu (`@Transactional` rollback / `@Sql` / truncate `RESTART IDENTITY CASCADE`), test flaky do thời gian & thứ tự & shared state; bài tập mô phỏng cơ chế bằng Java thuần (fake repo + Clock cố định).

related đều là id câu hỏi có thật (testing-001/002/050/005/010). Không dùng backtick/`${` trong template literal.

Nghiệm thu (đã chạy):
- `node --check js/data/lessons-testing.js` → OK
- `node scripts/build-light-index.js` → ghi `js/data/index-light.js` (do thêm bài học nên index đổi; validate yêu cầu file này mới)
- `node scripts/test-lessons.js` → 282/282 (reference pass hết, starter biên dịch được và không pass hết; 2 bài mới đều OK)
- `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn cảnh báo path.js về bài học không nằm trong PATH — không phải lỗi)

Không commit. Chỉ đổi file sở hữu (`js/data/lessons-testing.js`) + file sinh tự động `js/data/index-light.js`.
