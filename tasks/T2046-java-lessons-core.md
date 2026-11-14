# T2046 — 2 bài học (core) vào lessons-core.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-core.js`
After: T1577

Thêm **2 bài học mới** (track `core`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: exception handling đúng chuẩn: checked vs unchecked, wrap giữ cause, try-with-resources và suppressed exception (bài tập: đóng nhiều resource giả, kiểm tra suppressed); generics PECS (bài tập: viết copy(List<? super T>, List<? extends T>) và max với Comparator<? super T>).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-core.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm `lesson-core-012` (order 12, senior): Exception đúng chuẩn — checked vs unchecked, wrap giữ cause, try-with-resources và suppressed exception; 1 bài tập `TrackedRes`/`Runner` đóng nhiều resource giả và kiểm tra suppressed (4 case deterministic), 3 câu check, related `core-011, core-013, core-053`.
- Đã thêm `lesson-core-013` (order 13, senior): Generics PECS thực chiến — `copy(List<? super T>, List<? extends T>)` và `max` với `Comparator<? super T>`; 1 bài tập `Ops` (5 case deterministic), 4 câu check, related `core-001, core-012, core-056`.
- Đã chạy: `node --check js/data/lessons-core.js` (OK), `node scripts/build-light-index.js` (OK), `node scripts/test-lessons.js` (Lesson exercises OK: 278/278, 248 bài học), `node scripts/validate.js` → `OK — không có lỗi.`.
- Chỉ sửa file sở hữu `js/data/lessons-core.js` và file task này; không sửa `docs/path.js` (warning pre-existing về bài không nằm trong PATH). No git commit.
Reviewed-by: kilo (T2046R)
