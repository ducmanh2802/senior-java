# T2622R — Fact-check nội dung mới của T2622

Status: DONE
Agent: opencode
Owns: `js/data/quiz-spring.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2622 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Đã review 10 câu trắc nghiệm SQL mới (qz-sql-057 đến qz-sql-066). Tất cả đều đúng kỹ thuật theo chuẩn PostgreSQL 15:
- qz-sql-057: HAVING vs WHERE, thứ tự logic SELECT
- qz-sql-058: Window functions ROW_NUMBER/RANK/DENSE_RANK, PARTITION BY, ORDER BY tùy chọn
- qz-sql-059: EXISTS vs IN vs JOIN, an toàn với NULL
- qz-sql-060: NOT IN với NULL trả về tập rỗng, fix bằng NOT EXISTS
- qz-sql-061: Composite index leftmost prefix, equality trước, ORDER BY sau tránh Sort
- qz-sql-062: EXPLAIN ANALYZE: Bitmap Heap Scan, Seq Scan vs Index Scan, index-only scan điều kiện
- qz-sql-063: ON CONFLICT EXCLUDED là proposed row
- qz-sql-064: LEFT JOIN COUNT(*) vs COUNT(cột) xử lý NULL
- qz-sql-065: GROUP BY gộp dòng vs window function giữ dòng, nhiều OVER cùng SELECT
- qz-sql-066: JOIN nhân đôi dòng, EXISTS cho kiểm tra tồn tại

Không có lỗi markup (không backtick trong template literal, không ${ không escape, cú pháp ~~~/###/**/>/| đúng). Không có từ ngữ nước ngoài lẫn vào. node scripts/validate.js → OK cho các câu này.
