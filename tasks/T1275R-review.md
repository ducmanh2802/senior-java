# T1275R — Fact-check nội dung mới của T1275

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đã review toàn bộ nội dung mới của T1275 trong `js/data/q-sql.js` (git diff HEAD): 6 mục "Ví dụ đời thực" mới (sql-013 anomaly detection, sql-014 khoảng nửa mở/múi giờ, sql-015 đọc EXPLAIN plan, sql-016 đối soát FULL OUTER JOIN, sql-017 thống kê planner/CREATE STATISTICS, sql-018 partial index) và 1 sửa kỹ thuật (sql-035 skip scan: MySQL 8.0.13+ có, PostgreSQL chưa có).

Lỗi đã sửa:
- sql-013: reverted yêu 주장 sai "MySQL 8.0+ chỉ hỗ trợ ROWS, không hỗ trợ RANGE INTERVAL". Theo MySQL 8.0 Reference Manual, frame bound có thể là `INTERVAL val unit` và dùng với RANGE khi ORDER BY là cột thời gian/số → khôi phục nguyên văn "MySQL 8.0+ hỗ trợ RANGE với offset interval". Các phần còn lại (SQL Server không hỗ trợ RANGE INTERVAL) giữ nguyên.

Khác:
- 6 ví dụ đời thực mới đã kiểm tra kỹ thuật (index, frame, timezone, EXPLAIN/ANALYZE/BUFFERS, partial index, generic plan, CREATE STATISTICS dependencies/mcv), markup (không backtick, `${`, HTML, bảng `|...|` hay ~~~ mới), chữ ngoài anglophone chỉ là thuật ngữ trong `{{}}`. Không sửa nội dung đã có ở HEAD, không thêm/xoá mục.
- Không chạy test-lessons (không phải bài học).
- `node --check js/data/q-sql.js`: OK. `node scripts/validate.js`: js/data/q-sql.js sạch (không báo lỗi index-light stales); các LỖI còn lại nằm trong q-claude.js, lessons-testing.js và Cảnh báo path.js — không sở hữu file này, không sửa theo quy tắc AGENTS.md mục 3.

## Notes
