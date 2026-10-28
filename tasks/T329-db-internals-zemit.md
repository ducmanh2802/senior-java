# T329 — Database internals: ID, B-tree, lock, WAL, online DDL, export lớn

Status: DONE
Agent: opencode
Owns: `js/data/q-spring-data.js`

Thêm câu hỏi topic `db` (id tiếp số lớn nhất `db-NNN` trong file). Tuân thủ AGENTS.md mục 4–6 và 13.

### Nguồn tham khảo và bản quyền
Danh sách chủ đề lấy từ series *Backend Internal* của ZemIT (https://zemit.substack.com/p/backend-internal-kien-thuc-phong). Phần lớn bài trong series là nội dung trả phí:
- **KHÔNG chép, KHÔNG diễn đạt lại** nội dung các bài đó.
- Tự viết từ kiến thức đúng và tài liệu chính thức (postgresql.org/docs, dev.mysql.com/doc, redis.io/docs).
- Chỉ được gắn làm `refs` (type `article`) 3 bài đọc miễn phí sau, khi câu hỏi đúng chủ đề:
  - https://zemit.substack.com/p/chon-kieu-id-cho-he-thong-hien-ai (chọn kiểu ID)
  - https://zemit.substack.com/p/phan-lon-dev-chi-anh-index-en-dau (đánh index cho query thực tế)
  - https://zemit.substack.com/p/export-5-trieu-dong-ma-khong-giet (export dữ liệu lớn)
- Ưu tiên thêm `refs` tới docs chính thức. Chạy `node scripts/check-links.mjs js/data/q-spring-data.js`.

### Bước 1: chống trùng
Grep các câu `db-*` hiện có. Chủ đề nào đã có câu tương đương thì **bỏ qua**, ghi vào Notes. Chỉ viết chủ đề còn thiếu.

### Chủ đề (tối đa 14 câu, phong cách tình huống phỏng vấn)
- Chọn kiểu ID: auto-increment vs UUIDv4 vs Snowflake vs ULID/UUIDv7; ảnh hưởng tới clustered index InnoDB (page split, phân mảnh do ghi ngẫu nhiên, kích thước secondary index).
- B-tree và clustered index InnoDB: page 16KB, buffer pool, page split; so với heap + CTID + VACUUM/HOT update của PostgreSQL.
- Đánh index cho query thật: đọc EXPLAIN / EXPLAIN ANALYZE, leftmost prefix, index cho ORDER BY + LIMIT, covering index; PostgreSQL bitmap scan, INCLUDE, Index Only Scan và visibility map.
- MySQL: gap lock / next-key lock và deadlock dưới REPEATABLE READ; đọc SHOW ENGINE INNODB STATUS.
- Khoá: optimistic (version) vs pessimistic (SELECT … FOR UPDATE / SKIP LOCKED), PostgreSQL advisory lock, Redis lock (SET NX PX + token, vì sao Lua để unlock an toàn, giới hạn của Redlock).
- PostgreSQL row lock: READ COMMITTED re-check (EvalPlanQual), SERIALIZABLE (SSI) và retry lỗi serialization.
- WAL và replication: replica lag và read-your-writes, replication slot giữ WAL làm đầy đĩa.
- Long transaction: hậu quả (bloat, giữ lock, MDL lock trong MySQL chặn cả bảng); KILL QUERY vs KILL CONNECTION; timeout nên đặt.
- Online DDL: MySQL ALGORITHM=INPLACE/INSTANT và LOCK=NONE; gh-ost / pt-online-schema-change; PostgreSQL CREATE INDEX CONCURRENTLY, thêm cột có default.
- Tối ưu sau khi đã có index đúng: hash join vs nested loop, N+1, bulk insert / batch, ON DUPLICATE KEY UPDATE / ON CONFLICT.
- Export hàng triệu dòng: vì sao LIMIT OFFSET chậm, keyset pagination, streaming cursor (JDBC fetchSize, Hibernate ScrollableResults), checkpoint + resume, đọc từ replica.

Level: khoảng 20% mid, 60% senior, 20% lead. Mỗi đáp án 1500–4000 ký tự, mở đầu `**Tóm tắt:**`, có ví dụ SQL / EXPLAIN / số liệu, kết thúc `> Senior tip:`. Ghi file theo đợt 4–5 câu, sau mỗi đợt chạy `node --check` + `node scripts/validate.js`. Ghi Notes, `Status: DONE`.

## Notes

- Thêm 8 câu db-032..db-039 (1 mid, 5 senior, 2 lead): ID & clustered index InnoDB (gộp ý B-tree/page 16KB/buffer pool), gap/next-key deadlock + INNODB STATUS, PG READ COMMITTED re-check/RR/SSI + retry, WAL + replication slot đầy đĩa, MDL/long transaction/KILL/timeout, index cho WHERE+ORDER BY+LIMIT, bulk write (batch rewrite, COPY, upsert), export lớn (OFFSET vs keyset, cursor, checkpoint, replica).
- Bỏ qua vì đã có câu tương đương: B-tree/clustered vs heap/HOT (db-022, db-012), covering/INCLUDE/Index Only Scan/bitmap (db-001, sql-015, sql-018, db-023), optimistic/pessimistic/SKIP LOCKED/advisory (jpa-004, jpa-024, db-010, db-031), Redis lock SET NX + Lua + Redlock (design-010), replica lag/read-your-writes (db-016), online DDL INSTANT/gh-ost/CONCURRENTLY (db-008, scenario-003), hash join vs nested loop (db-015), N+1 (jpa).
- Viết từ docs chính thức, không dùng nội dung bài trả phí; 3 bài miễn phí ZemIT gắn refs cho db-032, db-037, db-039. check-links: 33 link, 0 hỏng. validate OK.
Reviewed-by: claude (subagent; validate OK, check-links 33/33; PG17/18 facts spot-checked)
