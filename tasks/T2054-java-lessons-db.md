# T2054 — 2 bài học (db) vào lessons-db.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-db.js`
After: T2033

Thêm **2 bài học mới** (track `db`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: index trong PostgreSQL từ gốc: B-tree hoạt động thế nào, composite index và quy tắc cột trái nhất, covering index (INCLUDE), partial index, khi nào index không được dùng (hàm trên cột, LIKE %x, kiểu dữ liệu lệch); bài tập Java mô phỏng tra cứu bằng TreeMap như B-tree và đếm số bước so với quét tuần tự.

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
- Đã thêm 2 bài mới (append, không sửa bài cũ) vào `js/data/lessons-db.js`:
  - `lesson-db-014` (order 14, senior, 30 phút): "B-tree, covering index (INCLUDE) và partial index: tra cứu đúng chỗ, đọc ít dữ liệu" — B-tree/page/fanout/leaf chain/heap fetch/MVCC visibility, index-only scan + visibility map, partial index & predicate implication; 1 bài tập Java thuần `IndexSim` (sequential scan vs binary search, đếm bước), 4 câu check; related: `db-001, db-022, db-023, db-024`.
  - `lesson-db-015` (order 15, senior, 30 phút): "Composite index, leftmost prefix và khi nào index không được dùng" — leftmost prefix, thứ tự cột equality/range/selectivity, các trường hợp index không dùng (hàm trên cột, LIKE '%x'/tiền tố, implicit cast/kiểu lệch, planner cost); 1 bài tập Java thuần `PrefixIndexSim` (lower bound theo tenant + dừng sớm theo day, so với quét toàn bộ), 4 câu check; related: `db-001, db-003, db-022, db-023`.
- Kiểm tra:
  - `node --check js/data/lessons-db.js` → OK.
  - `node scripts/test-lessons.js` → `Lesson exercises OK: 280/280 (250 bài học, 278 từ cache)` (bao gồm reference pass 100%, starter biên dịch được và không pass hết cho bài mới).
  - `node scripts/build-light-index.js` → **FAIL** do lỗi cú pháp có sẵn ngoài phạm vi sở hữu: `q-spring-data.js:13360 SyntaxError: Unexpected token '{'` (không sửa file khác theo luật 3).
  - `node scripts/validate.js` → **không đạt `OK` toàn cục** do nhiều lỗi có sẵn/ngoài phạm vi (không thuộc `lessons-db.js`): lỗi cú pháp `q-spring-data.js`, inline code lồng `{}` trong `q-java.js`, và hàng loạt `related`/question id không hợp lệ trong `bugs.js`, `lessons-spring.js`, `lessons-jpa.js`, `lessons-sql.js`, `projects.js`, `path.js`, `index-light.js` cũ; cùng các cảnh báo `related` db-* cho một số bài lessons-db cũ (008–013) mà tôi không chỉnh sửa. Không phát hiện lỗi cú pháp/markup do 2 bài mới thêm gây ra.
- Không chạy git commit/push, không mở trình duyệt, không kill process theo tên. Task file này là file duy nhất khác `js/data/lessons-db.js` được cập nhật (ghi trạng thái).
Reviewed-by: kilo (T2054R)
