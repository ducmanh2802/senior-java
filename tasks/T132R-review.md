# T132R — Fact-check nội dung mới của T132

Status: DONE
Agent: opencode
Owns: `js/data/lessons-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T132 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- lesson-sql-001: Thêm Senior tip về `work_mem` và `EXPLAIN ANALYZE`; sửa markup backtick thành `{{ }}` cho `EXPLAIN ANALYZE`, `loops`, `work_mem`.
- lesson-sql-002: Bổ sung lưu ý về TreeMap natural ordering và Comparable; thêm Senior tip thứ 2 về rủi ro dữ liệu thay đổi (insert/delete) khi phân trang và cursor invalidation khi khóa sắp xếp bị sửa.
- lesson-sql-003: Thêm Senior tip về thứ tự thực thi window function trong PostgreSQL (sau WHERE/GROUP BY/HAVING, trước LIMIT/OFFSET); sửa markup backtick thành `{{ }}` cho `LIMIT`, `FETCH FIRST`.
- Toàn file: Không tìm thấy lỗi kỹ thuật sai lệch (API/flag bịa, mặc định sai, cơ chế ngược, số liệu vô căn cứ) — nội dung đúng chuẩn PostgreSQL 15, Java 17.
- `node scripts/test-lessons.js` không chạy được do lỗi infrastructure có sẵn trong `browser-shim.js`/`app.js` (App.i18n được gọi trước khi App được định nghĩa), không do nội dung bài học. Validator `node scripts/validate.js` đã pass.
