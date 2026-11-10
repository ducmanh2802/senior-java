# T1397R — Fact-check nội dung mới của T1397

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Đọc AGENTS.md mục 4–6 (và 10/12 nếu là lab/bài học). Nội dung MỚI của task T1397 (xem `git diff HEAD -- <file>`) do model free viết, CHƯA review.
Sửa trực tiếp mọi lỗi kỹ thuật (API/flag bịa, mặc định sai, cơ chế nói ngược, số liệu vô căn cứ), lỗi markup, chữ nước ngoài lẫn vào.
CHỈ cần kiến thức ĐÚNG: không chỉnh văn phong, độ dài, bố cục hay thêm nội dung. Không có lỗi kiến thức thì ghi Notes "không có lỗi" và xong ngay.
Chuẩn: Java 17/21, Spring Boot 3.x, Hibernate 6, PostgreSQL 15, Kafka 3.x. Không sửa nội dung đã có ở HEAD. Không thêm/xoá mục.
Bài học: chạy thêm node scripts/test-lessons.js tới khi pass.

## Nghiệm thu
node scripts/validate.js → OK. Ghi vào Notes các lỗi đã sửa theo từng id.

## Notes
Không có lỗi. Đã review 10 câu hỏi mới/được bổ sung (jpa-039, jpa-040, db-040 đến db-047):
- ActionQueue + unique constraint (orphanRemoval, clear()+add pattern, DEFERRABLE, partial index) — đúng kỹ thuật
- MultipleBagFetchException + batch fetching strategies (BatchSize, SUBSELECT, EntityGraph) — đúng kỹ thuật
- B-tree internals, UUID v4 vs v7, page split, index bloat — đúng kỹ thuật
- WAL, fsync, synchronous_commit, full_page_writes, checkpoint spikes — đúng kỹ thuật
- InnoDB clustered index, gap/next-key lock, deadlock 1213, SHOW ENGINE INNODB STATUS — đúng kỹ thuật
- HikariCP sizing (Little's Law), maxLifetime, OSIV, leak detection — đúng kỹ thuật
- Replication lag, read-your-writes (primary read, sticky routing, LSN gate), synchronous replication — đúng kỹ thuật
- Range partitioning, partition pruning, DROP/DETACH partition, PK constraints — đúng kỹ thuật
- Index-only scan, visibility map, VACUUM, index bloat, pg_repack, REINDEX CONCURRENTLY — đúng kỹ thuật
- XID wraparound, freeze, vacuum_failsafe_age, MySQL purge lag — đúng kỹ thuật

Tất cả markup đúng ({{code}}, ~~~java/sql/text, ###, >, tables). Không có backtick hay ${ trong template literal. Ngôn ngữ tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh. Chạy `node scripts/build-light-index.js` và `node scripts/validate.js` → OK.
