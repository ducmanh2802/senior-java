# T854R — Fact-check nội dung mới của T854

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T854 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- Phạm vi (chỉ nội dung mới so với HEAD, không sửa lesson-sql-001→005): `lesson-sql-006`, `lesson-sql-007`.
- Kiểm tra kỹ thuật (PostgreSQL 15, SQL/MVCC/isolation): không phát hiện API/flag bịa, SQLSTATE sai, hay cơ chế nói ngược nghiêm trọng. `40001 serialization_failure` và `40P01 deadlock_detected` đúng; mặc định READ COMMITTED, hành vi REPEATABLE READ (snapshot cố định, snapshot không thấy phantom; nhắc serialization anomaly/write skew) phù hợp PostgreSQL. Index types (B-tree/Hash/GiN/GiST/BRIN), INCLUDE, index-only scan + visibility map/VACUUM đúng ý.
- `lesson-sql-006` (MVCC, isolation, deadlock):
  - Viết lại `body` chi tiết, dễ hiểu cho dev ~4 năm chưa quen: giải thích transaction/isolation/snapshot/commit/rollback/non-repeatable read/phantom/read skew/write skew (serialization anomaly) bằng ngôn ngữ đơn giản + ví dụ đời thường; nêu rõ MVCC reader/writer không chặn nhau và cái giá (bloat/VACUUM); bảng so sánh READ COMMITTED/REPEATABLE READ/SERIALIZABLE cho PostgreSQL 15.
  - Bổ sung ví dụ Java retry chỉ cho lỗi transient (`40001`, `40P01`) với backoff (minh hoạ) và lưu ý không retry bừa bãi.
  - Sửa bài tập để semantics rõ, bám isolation: đổi `txStartIndex`→`statementIndex` cho READ COMMITTED (mỗi câu lệnh có thể thấy commit mới) và giữ `snapshotIndex` cố định cho REPEATABLE READ; cập nhật `starter`/`tests`/`reference`/`hints`/`explain` tương ứng. Thêm test "read committed at statement 2 sees newer commit", "repeatable read same snapshot again", và deadlock 3 node. `reference` pass 100%; `starter` biên dịch được và không pass hết (tests deterministic, JDK chuẩn).
  - Dọn chữ lẫn/thuật ngữ trong nội dung mới: thay "Analog..." bằng giải thích tiếng Việt rõ, giữ thuật ngữ kỹ thuật tiếng Anh có chú thích.
- `lesson-sql-007` (B-tree, covering index):
  - Viết lại `body` chi tiết: index/Seq Scan/I-O, B-tree/fanout/O(log n), leaf→heap/TID/random I/O, covering index/index-only scan + `INCLUDE` + điều kiện visibility map/VACUUM, khi index không giúp (selectivity thấp như heuristic, hàm/biểu thức→functional/expression index, cast kiểu, bảng nhỏ, write-heavy), so sánh ngắn B-tree/Hash/GiN/GiST/BRIN cho PG15.
  - Làm rõ heuristic selectivity 5% chỉ là minh hoạ; quyết định thật thuộc planner + `EXPLAIN (ANALYZE, BUFFERS)`/thống kê.
  - Sửa bài tập `Idx`: làm rõ mô phỏng khái niệm; `reference`/`starter` cập nhật; thêm test "covering empty query" (queryCols rỗng → true theo spec) và xử lý null an toàn trong reference. Tests deterministic, JDK chuẩn.
- Markup: không dùng backtick, không có `${` trong template literal; dùng `{{...}}` cho inline code. Code block Java/SQL hợp lệ.
- Kiểm chứng: `node --check js/data/lessons-sql.js` OK. `node scripts/test-lessons.js` → `Lesson exercises OK: 212/212 (189 bài học, 210 từ cache)` (2 bài lesson-sql-006/007 được biên dịch lại và pass). `node scripts/build-light-index.js` đã chạy. `node scripts/validate.js` → `OK — không có lỗi.` (chỉ còn warnings cũ ngoài phạm vi).
- Không git commit/push, không mở trình duyệt, không kill tiến trình theo tên, không npm install. Chỉ chỉnh `js/data/lessons-sql.js` và `tasks/T854R-review.md`.
