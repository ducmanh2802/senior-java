# T1710 — 2 bài học (sql) vào lessons-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`
After: T1529

Thêm **2 bài học mới** (track `sql`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: đọc EXPLAIN ANALYZE: seq scan, index scan, nested loop vs hash join (bài tập mô phỏng chọn plan theo chi phí đơn giản); keyset pagination (bài tập: cài phân trang keyset trên danh sách đã sắp xếp, so sánh với offset).

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-sql.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Added: `lesson-sql-012` (order 12, "Đọc EXPLAIN ANALYZE: Seq Scan, Index Scan, Bitmap và chọn plan theo chi phí", 1 exercise `PlanChooser`, 3 check, related: sql-015, sql-017, db-001, sql-005) and `lesson-sql-013` (order 13, "Keyset pagination: cursor trên danh sách đã sắp xếp, so sánh với OFFSET", 1 exercise `Paginator` with offset/keyset + scan counts, 3 check, related: db-005, api-017, sql-002, sql-011). IDs/orders nối tiếp bài cuối (trước đó tới lesson-sql-011/order 11).
- Each: goals, body ≥ 2500 chars (ends "### Liên hệ phỏng vấn"), Java thuần exercise with starter (compiles, throws TODO) + deterministic tests (≥3 cases) + reference passes all, hints, explain, 2–4 check, related ids có thật.
- Checks run: `node --check js/data/lessons-sql.js` OK; `node scripts/build-light-index.js` OK; `node scripts/test-lessons.js` reports `lesson-sql-012#1` and `lesson-sql-013#1` OK (259 cached) but still shows pre-existing `lesson-sql-010#1: reference 7/8 pass` (Row helper mismatch in that entry's own tests/reference, not introduced by this task); `node scripts/validate.js` → `OK — không có lỗi.` (after fixing pre-existing validation blocker in lesson-sql-010 body: replaced `equi-join (={{}})` with `equi-join (so sánh bằng {{=}})` to remove nested `{{}}`).
- Not modified functionally: existing lessons (010 body text minimally adjusted only to satisfy validator nested-brace rule). No other files changed. No git commit. No browser/npm install/process kills. No temp helper files left in repo.
Reviewed-by: kilo (T1710R)
