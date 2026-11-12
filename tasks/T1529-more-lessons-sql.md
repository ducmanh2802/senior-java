# T1529 — Thêm 2 bài học (sql) vào lessons-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`

Thêm **2 bài học mới** vào `js/data/lessons-sql.js` (track `sql`, id và `order` nối tiếp bài cuối của track). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: window function từ cơ bản đến bài toán xếp hạng/running total (bài tập mô phỏng bằng Java Streams để tính đúng kết quả); keyset pagination (bài tập cài phân trang trên List đã sắp xếp).

Mỗi bài theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập Java tự chấm (starter biên dịch được, tests ≥ 3 case deterministic, reference pass 100%), 2–4 câu check, related là id câu hỏi có thật.

## Luật
- Đọc AGENTS.md (mục 4–6, 12) trước. **Chỉ thêm** vào `js/data/lessons-sql.js`, không sửa mục khác, không sửa file khác.
- Thêm bằng `node scripts/qtool.js append js/data/lessons-sql.js logs/tmp-T1529.js` (viết object vào file tạm trước). Không backtick, không `${` trong nội dung.
- **Kiến thức phải ĐÚNG** (Java 17/21, Spring Boot 3.x, PostgreSQL hiện hành). Người đọc là dev Java ~4 năm, hổng nền tảng: giải thích từng bước, có ví dụ cụ thể.
- Nghiệm thu: `node scripts/build-light-index.js`; `node scripts/validate.js` → `OK — không có lỗi.` và `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết). KHÔNG commit.
- Xong: `Status: DONE`, Notes ghi id đã thêm.

## Notes
- Đã thêm 2 bài: `lesson-sql-008` (Window function với Java Streams: xếp hạng và running total đúng kết quả, order 8, senior, 30 phút, 1 exercise, 3 check, related sql-005/sql-006) và `lesson-sql-009` (Keyset pagination trên danh sách đã sắp xếp: cursor, tie-breaker và binary search, order 9, senior, 30 phút, 1 exercise, 3 check, related sql-034).
- Mỗi bài body > 2500 ký tự, có mục "### Liên hệ phỏng vấn", giải thích chi tiết cho dev ~4 năm hổng nền tảng; exercise dùng Java thuần (Streams, List/Map/Comparator), starter biên dịch được, tests deterministic (≥3 case), reference pass 100%.
- `node scripts/build-light-index.js` OK; `node scripts/validate.js` → `OK — không có lỗi.`; `node scripts/test-lessons.js` → `Lesson exercises OK: 223/223 (200 bài học, 221 từ cache)`.
- Cảnh báo validate (sẵn có/ngoài scope): `path.js` báo một số bài không nằm trong PATH (gồm lesson-sql-008, lesson-sql-009, lesson-claude-004, lesson-claude-005, lesson-design-007) — không thuộc file sở hữu, không sửa. Không git commit.
Reviewed-by: kilo (T1529R)
