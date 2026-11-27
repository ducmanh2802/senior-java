# T2875R — Fact-check nội dung mới của T2875

Status: DONE
Agent: opencode
Owns: `js/data/labs-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2875 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Reviewed 2 new labs added in T2875:
- **lab-sql-060**: Partitioned table stale statistics causing Nested Loop (estimated 120 rows, actual 1.8M). Technically correct — parent partition stats stale after bulk load, planner uses parent stats for Append node estimation. Solution: ANALYZE parent partition, lower autovacuum_analyze_scale_factor, pg_stat_clear_snapshot. Markup follows conventions.
- **lab-sql-061**: Prepared transaction (2PC) forgetting to commit holding xmin blocking vacuum. Technically correct — prepared xacts hold xmin, vacuum cannot remove tuples with xmin >= oldest prepared_xact_xmin. Solution: ROLLBACK PREPARED, app-level timeout auto-rollback, monitor pg_prepared_xacts. Markup follows conventions.

No technical errors, markup issues, or foreign language mixing found in the new content. `node scripts/validate.js` passes for labs-sql.js. `node scripts/build-light-index.js` completed successfully.
