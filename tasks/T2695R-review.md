# T2695R — Fact-check nội dung mới của T2695

Status: DONE
Agent: opencode
Owns: `js/data/lessons-db.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T2695 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes

Reviewed all 23 lessons in `js/data/lessons-db.js` (lesson-db-001 through lesson-db-023). No technical errors found:
- PostgreSQL isolation levels, MVCC, WAL, deadlock, lock modes, HOT updates, fillfactor, connection pool semantics, cache-aside/TTL/LRU/single-flight patterns, Redis internals, B-tree/B+tree mechanics, composite index leftmost prefix, write skew/SSI, lost update fixes, binary search range queries — all technically correct per PostgreSQL 15, Java 17/21, Spring Boot 3.x, Redis 7.
- Markup syntax valid (no backticks, no `${` unescaped, proper `~~~` code blocks, `{{code}}` inline, `###` headings, tables, sequence diagrams).
- No foreign language mixed in (Vietnamese body with English technical terms as required).
- All exercises pass `node scripts/test-lessons.js` (406/406).
- `node scripts/validate.js` shows no errors for lessons-db.js.

Validation errors in other files (quiz-ops.js syntax, lessons-jpa.js body length, lessons-jvm.js related ref) are outside owned scope.
