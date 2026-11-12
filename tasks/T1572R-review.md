# T1572R — Fact-check nội dung mới của T1572

Status: DONE
Agent: opencode
Owns: `js/data/q-sql.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1572 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
- `sql-047`: rà soát kỹ thuật (READ COMMITTED/REPEATABLE READ/SERIALIZABLE, anomaly table, lost update tuyệt đối vs {{balance = balance - 100}}, write skew, 40001/40P01 retry), markup/backtick/`${` — không phát hiện lỗi kiến thức.
- `sql-048`: sửa bảng lock modes PostgreSQL (cột "Chặn ai"): liệt kê chính xác các mode xung đột theo ma trận conflict (vd {{ROW SHARE}} conflict với {{EXCLUSIVE}} và {{ACCESS EXCLUSIVE}}, không conflict với {{SHARE}}; {{ROW EXCLUSIVE}} conflict với {{SHARE}}, {{SHARE ROW EXCLUSIVE}}, {{EXCLUSIVE}}, {{ACCESS EXCLUSIVE}}; {{SHARE ROW EXCLUSIVE}} tự conflict với chính nó). Các phần deadlock detection 40P01, SKIP LOCKED, thứ tự lock, retry — không phát hiện lỗi.
- `sql-049`: rà soát EXPLAIN (ANALYZE, BUFFERS), sargable, cost vs actual, extended statistics, {{random_page_cost}}/{{work_mem}} — không phát hiện lỗi kiến thức.
- `sql-050`: rà soát range partition, pruning, unique key phải chứa partition key, local index, DETACH/DROP, default partition/attach, autovacuum per-partition — không phát hiện lỗi kiến thức.
- `sql-051`: rà soát ON CONFLICT speculative insertion, DO NOTHING/DO UPDATE, xmax trick (ghi chú không phải API chính thức), partial index predicate, batch cùng khóa, trigger/sequence — không phát hiện lỗi kiến thức.
- `sql-052`: sửa ngưỡng autovacuum analyze từ {{10 + 0,1 × reltuples}} thành công thức đầy đủ {{autovacuum_analyze_threshold + autovacuum_analyze_scale_factor * reltuples}} (mặc định 50 + 0,1 × số dòng); bổ sung mặc định {{autovacuum_vacuum_insert_threshold}} = 1000 (PG 13+). Phần MVCC tuple/xmin/xmax, vacuum/FSM/visibility map, xmin horizon, wraparound — không phát hiện lỗi khác.

`node scripts/build-light-index.js` → OK. `node scripts/validate.js` → OK (chỉ warnings có sẵn, không lỗi). `node --check js/data/q-sql.js` → OK. Chỉ sửa `js/data/q-sql.js` và file task. Không git commit.
