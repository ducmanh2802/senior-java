# T1580R — Fact-check nội dung mới của T1580

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1580 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Đã review nội dung mới của lesson-db-012 và lesson-db-013 (2 bài học track `db`, order 12 và 13).

- **lesson-db-012** (Index composite, leftmost prefix, selectivity, chi phí ghi): kiến thức đúng — leftmost prefix, equality-before-range, selectivity, covering index/INCLUDE, chi phí ghi (WAL, bloat, pg_stat_user_indexes), cơ chế planner B-tree + MVCC visibility. Markup hợp lệ (không backtick, không `${`). Exercise `CompositeIndex` reference pass 7/7 test, starter không pass. Check 4 câu, 4 option, answer 0..3, explain giải thích đúng và sai. `related` db-001/db-022/db-023 đều tồn tại.
- **lesson-db-013** (Non-repeatable read, phantom, snapshot, isolation levels): kiến thức đúng — định nghĩa hai anomaly, READ COMMITTED vs REPEATABLE READ (PostgreSQL snapshot + 40001), bảng so sánh, lost update/write skew, InnoDB so sánh, ví dụ đời thực, cách phòng ngừa. Markup hợp lệ. Exercise `IsolationSim` reference pass 7/7 test, starter không pass. Check 4 câu, answer 0..3, explain đúng. `related` db-002/db-033/db-034 đều tồn tại.

**Không có lỗi kỹ thuật, markup hay chữ nước ngoài lẫn vào.** Không cần sửa nội dung đã có ở HEAD; không thêm/xoá mục.

Kiểm tra:
- `node scripts/validate.js` → `OK — không có lỗi.`
- `node scripts/test-lessons.js lesson-db-012` → 7/7 PASS
- `node scripts/test-lessons.js lesson-db-013` → 7/7 PASS
