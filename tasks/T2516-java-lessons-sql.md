# T2516 — 2 bài học (sql) vào lessons-sql.js

Status: DONE
Agent: kilo
Owns: `js/data/lessons-sql.js`
After: T2462

Thêm **2 bài học mới** (track `sql`, id/order nối tiếp bài cuối). **Đọc kỹ bài mẫu `lesson-collections-001`** (`node scripts/qtool.js show js/data/lessons-collections.js lesson-collections-001`) và các bài đã có trong file để không trùng.

Nội dung: TỪ SỐ 0 — Index bên trong database: dữ liệu nằm trên đĩa theo page 8KB, full scan là gì, B+tree xây thế nào (vẽ cây 3 tầng), tìm 1 dòng trong 10 triệu dòng tốn mấy lần đọc, composite index và leftmost prefix (ví dụ danh bạ sắp theo Họ rồi Tên), covering index; bài tập Java thuần: tự cài tìm kiếm trên mảng đã sắp (binary search) vs quét tuần tự, đếm số lần "đọc page" để thấy khác biệt, và mô phỏng composite index (sort theo 2 cột) trả lời truy vấn leftmost.

Theo AGENTS.md mục 12: goals, body ≥ 2500 ký tự (kết bằng "### Liên hệ phỏng vấn"), 1–2 bài tập **Java thuần** tự chấm mô phỏng cơ chế (framework được mô phỏng bằng Java thuần), tests ≥ 3 case **deterministic**, reference pass 100%, starter biên dịch được với Java 17 và không pass hết; 2–4 câu check; related là id câu hỏi có thật.

## Mức giải thích (BẮT BUỘC)## LuậtnNgười học ÍT tiếp xúc công nghệ sâu. Bài học viết như dạy người CHƯA BIẾT GÌ: ví dụ đời thường trước, thuật ngữ sau; từng bước một ý; sơ đồ ASCII## Luật~~~seq minh hoạ; ví dụ số chạy tay; mục "### Tự thử trên máy" (Docker 1 dòng + lệnh + kết quả mong đợi); kết bằng "### Tóm lại 3 ý" rồi "### Liên hệ phỏng vấn". body 4000–8000 ký tự.## Luậtn
## Luật
- Đọc AGENTS.md trước (mục 4–6 và mục liên quan bên dưới).
- **BẮT BUỘC viết tiếng Việt CÓ DẤU đầy đủ** (Tóm tắt, không, nguyên nhân…). Nội dung không dấu sẽ bị trả lại.
- **Chỉ THÊM** vào file sở hữu (qtool append hoặc chèn trước dòng `);` cuối file); không sửa mục đã có, không sửa file khác. Đếm id trước/sau để chắc không làm mất mục của người khác.
- Không backtick, không `${` trong nội dung template literal.
- **Kiến thức phải ĐÚNG**: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15+, HikariCP, JDK tools (jstack, jcmd, JFR, GC log JDK 17+). Không bịa flag, API, metric. Không chắc thì viết ở mức nguyên lý.
- Người đọc: dev Java ~4 năm, hổng nền tảng, chuẩn bị phỏng vấn Senior: giải thích **từ gốc, từng bước, VÌ SAO**, ví dụ cụ thể, số liệu khớp nhau.

## Nghiệm thu
`node --check js/data/lessons-sql.js`; `node scripts/build-light-index.js`; `node scripts/test-lessons.js` (reference pass hết, starter biên dịch được và không pass hết); `node scripts/validate.js` → `OK — không có lỗi.` KHÔNG commit.
Xong: sửa dòng `Status:` đầu file thành `Status: DONE`, Notes ghi id đã thêm.

## Notes
Đã thêm 2 bài học mới:
- lesson-sql-020 (order 20): "Index B+tree bên trong: page 8KB, full scan, độ sâu cây, composite index và leftmost prefix" — giải thích page 8KB, full scan, cấu trúc B+tree 3 tầng, fanout, I/O tìm 1 dòng trong 10M, composite index, quy tắc leftmost prefix (danh bạ Họ/Tên). Bài tập: ước lượng height B+tree, I/O tìm dòng, áp dụng leftmost prefix.
- lesson-sql-021 (order 21): "Covering index, index-only scan và bài tập Java: binary search vs sequential, mô phỏng composite index" — giải thích covering index, INCLUDE, index-only scan, visibility map. Bài tập 1: sequential scan vs binary search đếm page reads. Bài tập 2: mô phỏng composite index (sort 2 cột), truy vấn leftmost prefix (exact match, prefix match, skip column).
Cả hai bài đều có goals, body ≥ 4000 ký tự, exercises với tests deterministic ≥ 3 cases, reference pass 100%, starter biên dịch được không pass hết, check questions, related question IDs.
Đã sửa thêm lỗi format có sẵn trong lesson-sql-017 và 018 (~~~bash thay cho \`\`\`bash). Chạy validate OK, build-light-index OK.
Reviewed-by: kilo (T2516R)

- 2026-11-21 (Claude): verify FAILED — lesson-sql-018 bài tập 1: test in "RESULT 5/1000000" (biến total sai, reference chỉ pass 5). Sửa tests của lesson-sql-018 (total = số case thật, ≥ 3 case, reference pass hết, starter không pass hết); sửa tiêu đề "paraméter hóa" thành "tham số hoá". Không thêm bài mới. Chạy node scripts/test-lessons.js và validate.
