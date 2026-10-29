/* Topics: scenario — owner: task T16. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'scenario-001',
  topic: 'scenario',
  level: 'senior',
  q: 'API list của bạn đang chạy 5 giây. Trace cho thấy nguyên nhân là một query chậm trên bảng 50 triệu dòng. Bạn xử lý thế nào, từng bước ra sao?',
  a: `**Tóm tắt:** đo trước khi sửa — chạy {{EXPLAIN (ANALYZE)}} trên plan thật để tìm loại bước chậm (Seq Scan trên 50 triệu dòng, Sort spill ra disk, nested loop nhân số dòng), rồi sửa nguyên nhân gốc; nhiều trường hợp được giải quyết bằng index phù hợp hoặc viết lại query, nhưng cần xác nhận bằng plan và workload thực tế.

### Làm rõ yêu cầu
- Endpoint lấy loại gì: filter theo cột nào, sort theo cột nào, người dùng hay dùng tổ hợp lọc nào nhất? Có cần đếm tổng số dòng để phân trang không?
- SLA mục tiêu là gì (p95 dưới 300ms)? DB nào (PostgreSQL/MySQL/Oracle), có được tạo index online không?
- Chậm ở mọi tổ hợp lọc hay chỉ một vài tổ hợp? Gần đây có gì thay đổi (deploy mới, dữ liệu tăng, statistics cũ, nâng cấp DB)?

### Điều tra / Phân tích
- Bật {{pg_stat_statements}} / slow query log để xác định chính xác câu query, tần suất và phân bố thời gian; xem APM trace để chắc chắn thời gian nằm ở DB chứ không phải ở tầng Java (mapping, N+1).
- Chạy {{EXPLAIN (ANALYZE, BUFFERS)}} trên dữ liệu production-like: nhìn plan bước nào tốn thời gian — {{Seq Scan}} kèm {{Rows Removed by Filter}} lớn nghĩa là index không khớp điều kiện; node {{Sort}} tốn nhiều memory/disk nghĩa là mất lợi thế index về sort.
- Kiểm tra statistic đã {{ANALYZE}} gần đây chưa (stats cũ khiến planner chọn plan sai), cache hit ratio, I/O wait.

### Giải pháp
- **Nhanh nhất, đúng đắn nhất:** tạo composite index đúng thứ tự — cột filter đẳng thức trước, cột sort sau:
~~~sql
-- SELECT ... WHERE tenant_id = ? AND status = 'ACTIVE' ORDER BY created_at DESC LIMIT 20
CREATE INDEX CONCURRENTLY idx_txn_tenant_status_time
  ON transactions (tenant_id, status, created_at DESC);
~~~
- Rewrite query: bỏ {{SELECT *}}, tránh bọc hàm quanh cột trong WHERE ({{WHERE DATE(created_at) = ...}} khiến index vô dụng), thay subquery lồng nhau bằng JOIN.
- Chỉ thêm cache (Redis với TTL ngắn) sau khi query đã tối ưu — cache che triệu chứng chứ không chữa bệnh.
- Bền vững hơn: partition theo thời gian cho dữ liệu tăng nhanh, trỏ read replica cho các list nặng.

### Trade-off & pitfall
- Mỗi index làm write chậm hơn và phình dung lượng; đừng index theo mọi tổ hợp lọc user nghĩ ra — chọn 3–5 tổ hợp thống trị lưu lượng.
- Thứ tự cột trong composite index sai thì vô dụng với query này dù cùng bộ cột.
- Plan trên môi trường test khác production (data shape, statistics); luôn kiểm chứng bằng slow query log sau deploy.

> Senior tip: tôi từng giảm một API list giao dịch từ 8s xuống 120ms trên bảng 60 triệu dòng chỉ bằng index (tenant_id, status, created_at DESC); trước đó cả team đã bàn chuyển sang Elasticsearch. Index đúng vẫn là giải pháp rẻ và an toàn nhất — chỉ cân nhắc cache/replica sau khi index đã tối ưu.`,
  follow: [
    'Tạo index online trên bảng này ảnh hưởng thế nào đến write throughput và bạn đo ra sao?',
    'Nếu sau khi tối ưu query vẫn 2s vì bảng đã 500 triệu dòng, bạn đi tiếp hướng nào?',
    'Làm sao phát hiện sớm query chậm trước khi user phàn nàn?'
  ],
  tags: ['SQL', 'index', 'EXPLAIN', 'performance-tuning']
,
},
{
  id: 'scenario-002',
  topic: 'scenario',
  level: 'mid',
  q: 'Phân trang trang thứ 10.000 tải rất chậm, mỗi request dùng {{OFFSET}} 300.000 dòng. Bạn xử lý thế nào?',
  a: `**Tóm tắt:** {{OFFSET}} lớn buộc DB đọc và vứt toàn bộ các dòng trước đó nên càng về sau càng chậm — chuyển sang keyset pagination ({{WHERE id < :last_id ORDER BY id DESC LIMIT 20}}), với index khớp thứ tự, mỗi trang cần O(log n + pageSize) thay vì phải duyệt O(offset + pageSize).

### Làm rõ yêu cầu
- User có cần nhảy tới trang bất kỳ không, hay chủ yếu kéo tiếp (infinite scroll / nút Next)?
- Sort theo cột nào? Cột đó có bảo đảm duy nhất không (nhiều dòng cùng created_at thì sao)?
- Tổng số dòng theo một bộ lọc tối đa là bao nhiêu?

### Điều tra / Phân tích
- Test {{OFFSET 300000 LIMIT 20}} với {{EXPLAIN (ANALYZE)}}: thấy DB trả về 300.020 dòng rồi discard — chi phí tuyến tính theo số trang.
- Nếu query còn đang sort toàn bộ (node {{Sort}}), sẽ nặng cả hai đầu cùng lúc.
- Đo {{Rows Removed}} / số dòng scan để định lượng thiệt hại của OFFSET.

### Giải pháp
- Đổi sang keyset pagination, dùng khóa duy nhất + sort ổn định:
~~~sql
-- trang đầu:  SELECT id, ... FROM t ORDER BY id DESC LIMIT 20
-- trang sau:  WHERE id < :last_id ORDER BY id DESC LIMIT 20
-- sort theo (created_at, id): WHERE (created_at, id) < (:last_ts, :last_id)
CREATE INDEX idx_t_order ON t (created_at DESC, id DESC);
~~~
- Nếu bắt buộc hiển thị tổng số trang: đếm một lần theo bộ lọc rồi cache TTL ngắn, chấp nhận sai số nhỏ thay vì {{COUNT(*)}} mỗi request.
- Với UI cũ (bảng số trang): chỉ hiện cửa sổ trang gần kề, thay nút nhảy xa bằng nút lọc thêm.

### Trade-off & pitfall
- Keyset không nhảy trang tuỳ ý (chỉ Next/Prev) — phải quyết định UX trước khi đổi.
- Cột khóa phải duy nhất; nếu không sẽ mất hoặc lặp dòng khi sort không ổn định.
- Dữ liệu chèn giữa hai lần lấy trang có thể khiến dòng lặp hoặc bị bỏ sót — chấp nhận được trong feed dạng timeline.

> Senior tip: mọi feed hiện đại (Twitter, Facebook News Feed) đều dùng cursor, không dùng OFFSET. Trên bảng 200 triệu dòng, tôi từng giảm từ 4s trang cuối về 15ms chỉ bằng cách đổi cursor — và đây là thay đổi rất rẻ, đáng làm trước khi nghĩ tới cache.`,
  follow: [
    'Keyset pagination khi sort theo cột không duy nhất (created_at) thì thiết kế cursor thế nào?',
    'Làm sao trả total count chính xác mà không COUNT(*) toàn bảng mỗi lần?'
  ],
  tags: ['pagination', 'keyset', 'cursor', 'SQL']
},
{
  id: 'scenario-003',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Cần thêm một cột và một index vào bảng 200 triệu dòng đang chạy production. Làm sao làm không downtime?',
  a: `**Tóm tắt:** phân loại DDL trước — loại chỉ sửa metadata (chạy tức thì) và loại phải rebuild bảng (hàng giờ, khoá lâu). PostgreSQL: {{ADD COLUMN}} với default hằng là metadata-only, index dùng {{CREATE INDEX CONCURRENTLY}}; MySQL 8: {{ALGORITHM=INSTANT/INPLACE}}; backfill dữ liệu luôn chạy batch nhỏ có checkpoint để chạy lại được.

### Làm rõ yêu cầu
- DDL cụ thể: thêm cột nullable, cột NOT NULL có default, hay index unique? Migration một lần hay phục vụ tính năng mới?
- Engine và version DB (quyết định danh sách lệnh an toàn), write QPS trên bảng, khung giờ thấp điểm là lúc nào?
- Có sẵn công cụ {{gh-ost}} / {{pt-online-schema-change}} không, đã test ở staging chưa?

### Điều tra / Phân tích
- PostgreSQL 11+: {{ADD COLUMN}} với default là hằng (không volatile) là metadata-only tức thì; default là hàm volatile ép rewrite toàn bảng. Thêm {{NOT NULL}} trên cột đã có: PG 12+ cho phép tạo {{CHECK (col IS NOT NULL) NOT VALID}} rồi {{VALIDATE CONSTRAINT}} (khóa nhẹ) trước khi {{SET NOT NULL}}.
- MySQL 8.0: {{ADD COLUMN}} hỗ trợ {{ALGORITHM=INSTANT}}, {{ADD INDEX}} là {{INPLACE}} (cho DML song song nhưng chiếm I/O lớn); trước 5.6 phải rebuild hoặc dùng gh-ost.
- Pitfall kinh điển: DDL phải chờ các query dài đang chạy để lấy Metadata lock; trong lúc chờ nó tự chặn mọi query phía sau xếp hàng — một query dài 300ms đủ phong tỏa cả bảng nhiều phút.

### Giải pháp
- Bước 1: đặt {{lock_timeout}} ngắn và vòng retry, để DDL không ngồi ôm khoá:
~~~sql
SET lock_timeout = '3s';
ALTER TABLE orders ADD COLUMN source varchar(16);   -- metadata-only trên PG 11+
CREATE INDEX CONCURRENTLY idx_orders_source ON orders (source);
~~~
- Bước 2 (MySQL cũ hoặc rebuild nặng): gh-ost / pt-online-schema-change — copy theo chunk, bắt kịp thay đổi qua binlog, swap atomic ở cuối.
- Bước 3: backfill giá trị cột (nếu cần) bằng job mỗi lần 1.000–10.000 dòng, sleep giữa các batch để replication lag không tăng vọt; lưu checkpoint theo PK để chạy lại không trùng.
- Bước 4: unique index — kiểm tra dữ liệu trùng bằng query trước; nếu {{CREATE INDEX CONCURRENTLY}} fail thì drop index INVALID rồi tạo lại.

### Trade-off & pitfall
- {{CREATE INDEX CONCURRENTLY}} không chạy được trong transaction; bị hủy giữa chừng để lại index INVALID — kiểm {{pg_index.indisvalid}}.
- Backfill bằng UPDATE đại trà làm WAL/binlog phình, replication lag tăng — theo dõi lag và tạm dừng khi vượt ngưỡng.
- Với bảng có nhiều FK hoặc bảng con, khoá có thể lan truyền — đánh giá theo thứ tự bảng cha trước.

> Senior tip: quy tắc của tôi trước mọi DDL trên bảng lớn là {{SET lock_timeout}} ngắn + vòng retry; chỉ một query dài 300ms đủ làm DDL chờ, và DDL chờ sẽ phong tỏa cả hàng đợi query phía sau. Tôi từng thấy {{ALTER TABLE ADD COLUMN}} khuya cao điểm (thiếu lock_timeout) đóng băng hệ thống nhiều phút.`,
  follow: [
    'Thêm constraint NOT NULL lên cột đã có trên bảng 200 triệu dòng (PostgreSQL) — liệt kê các bước?',
    'gh-ost hoạt động thế nào và khi nào bạn chọn nó thay vì online DDL của MySQL?'
  ],
  tags: ['DDL', 'online-migration', 'PostgreSQL', 'MySQL']
},
{
  id: 'scenario-004',
  topic: 'scenario',
  level: 'senior',
  q: 'Khối báo cáo cuối ngày chạy trên DB chính làm chậm cả API giao dịch. Bạn xử lý thế nào?',
  a: `**Tóm tắt:** tách workload — OLTP và report trên một DB luôn tranh chấp CPU, buffer cache và I/O. Ngắn hạn: trỏ report sang read replica. Trung hạn: tổng hợp sẵn bằng materialized view. Dài hạn: CDC đưa dữ liệu sang data warehouse / OLAP, OLTP chỉ giữ nghiệp vụ.

### Làm rõ yêu cầu
- Báo cáo chạy bao lâu mỗi lần, quét bao nhiêu dòng, có cố định khung giờ không? Người dùng có tự chọn lọc (ad-hoc) không?
- Dữ liệu report được phép trễ bao nhiêu (15 phút, 1 giờ, 1 ngày)? SLA của API đang bị ảnh hưởng là gì?
- Ngân sách hạ tầng cho phép thêm replica/warehouse không?

### Điều tra / Phân tích
- Nhận dạng pattern: report quét bảng nào, JOIN bao nhiêu bảng, GROUP BY lớn, có ORDER BY không.
- Đo trong khung report chạy: CPU, I/O, buffer cache hit giảm (seq scan bảng 10GB đuổi cache nóng), replication lag.
- Kiểm tra report có thể chạy trùng (nhiều instance cùng kích hoạt) không.

### Giải pháp
- **Nhanh:** trỏ query báo cáo sang read replica; đặt {{statement_timeout}} (vd 60s) tránh query zombie chiếm tài nguyên.
- **Trung hạn:** tổng hợp sẵn bằng materialized view theo lịch, query report chỉ đọc bảng tổng:
~~~sql
CREATE MATERIALIZED VIEW daily_revenue AS
  SELECT date_trunc('day', paid_at) AS d, sum(amount) AS amt, count(*) AS n
  FROM payments GROUP BY 1;
CREATE UNIQUE INDEX ON daily_revenue (d);   -- bắt buộc để REFRESH CONCURRENTLY
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_revenue;
~~~
- **Lâu dài:** CDC (Debezium) → Kafka → warehouse (Snowflake/BigQuery/Redshift), hoặc export Parquet lên S3 + Athena; BI/report trỏ vào đó, OLTP giữ nghiệp vụ thuần.
- Nếu report lọc đa chiều cần latency thấp: cân nhắc ClickHouse / StarRocks hợp túi tiền hơn warehouse lớn.

### Trade-off & pitfall
- Read replica vẫn chung cụm phần cứng nếu cùng cụm — giảm tải nhẹ hơn mong đợi; phải replica độc lập và monitoring lag.
- {{REFRESH ... CONCURRENTLY}} cần unique index; refresh bảng lớn tự nó nặng, đặt lịch giờ thấp điểm.
- Warehouse là thêm hạ tầng phức tạp — chỉ mở khi report xác thực là nút cổ chai thật, không phải phòng hờ.

> Senior tip: hiện tượng "report làm chậm API" thường do buffer cache eviction — seq scan bảng 10GB đuổi cache nóng. Một materialized view cỡ 50 dòng (doanh thu/ngày) đủ trả báo cáo dưới 100ms, chưa cần warehouse đắt đỏ.`,
  follow: [
    'CDC đưa sang data warehouse: làm sao đảm bảo không mất dữ liệu giữa legacy DB và warehouse?',
    'Materialized view nên refresh bao lâu một lần với báo cáo doanh thu?'
  ],
  tags: ['OLAP', 'read-replica', 'materialized-view', 'warehouse']
,
},
{
  id: 'scenario-005',
  topic: 'scenario',
  level: 'senior',
  q: 'Lỗi deadlock xuất hiện lúc cao điểm vài lần mỗi giờ. Bạn điều tra và khắc phục thế nào?',
  a: `**Tóm tắt:** đọc deadlock log trước khi sửa — nó in ra cả hai query và resource đang khóa; nguyên nhân phổ biến là hai luồng cập nhật cùng bộ dòng theo thứ tự ngược nhau, hoặc transaction giữ lock khi gọi HTTP chậm. Sửa gốc bằng: đồng bộ thứ tự khóa, rút ngắn transaction, index khớp điều kiện, thêm retry ở app.

### Làm rõ yêu cầu
- DB nào, luồng nghiệp vụ nào (đơn hàng, thanh toán, tồn kho)? Có nhầm với lock wait timeout (khác) không?
- Lỗi xuất hiện sau deploy nào, hay có từ trước và tăng cùng lưu lượng?
- Có transaction nào gọi HTTP/Kafka khi đang giữ lock không?

### Điều tra / Phân tích
- Đọc deadlock graph trong log: nhận diện 2 transaction, query gì, giữ lock gì, chờ gì trên dòng nào — thường thấy chữ ký 'hai bảng cập nhật theo thứ tự ngược'.
- Kiểm tra index: thiếu index khiến {{SELECT FOR UPDATE}} khóa nhiều dòng hơn cần (gap lock / next-key lock với REPEATABLE READ của MySQL).
- Quan sát {{innodb_lock_waits}} / {{pg_stat_activity}} để thấy luồng dài nhất đang giữ gì.

### Giải pháp
- Đồng bộ thứ tự khóa: mọi luồng luôn khóa theo cùng thứ tự (ví dụ luôn inventory trước payment).
- Thu ngắn transaction: tính toán và gọi ngoài chỗ không cần khóa:
~~~sql
BEGIN;
  UPDATE inventory SET qty = qty - :take
    WHERE id = :id AND qty >= :take;   -- nguyên tử, kiểm rowsAffected
  UPDATE payment SET status = 'PAID' WHERE id = :pid AND status = 'PENDING';
COMMIT;
~~~
- Index khớp để khóa đúng dòng; với consumer queue dùng {{SELECT ... FOR UPDATE SKIP LOCKED}}.
- App thêm retry deadlock (MySQL error 1213 / SQLSTATE 40001) 2–3 lần, backoff 100–500ms + jitter.
- MySQL: cân nhắc {{READ COMMITTED}} thay {{REPEATABLE READ}} để thu nhỏ lock range.

### Trade-off & pitfall
- SKIP LOCKED đẩy nhanh nhưng consumer khác phải xử lý phần bị bỏ — cần thiết kế để không dòng nào bị bỏ sót.
- Retry vô hạn khi xung đột rất nóng làm tăng CPU — đặt max attempts + alert.
- Đừng vội chuyển Serializable: giảm concurrency nặng; ưu tiên sửa thứ tự khóa trong code.

> Senior tip: nếu deadlock log cho thấy transaction giữ lock trong lúc gọi HTTP, chuyển network call ra ngoài transaction hoặc dùng outbox; thêm retry có giới hạn, backoff và jitter cho lỗi deadlock có thể retry.`,
  follow: [
    'Deadlock với lock wait timeout: phân biệt và xử lý hai loại này khác nhau thế nào?',
    'Khi nào bạn chọn Serializable isolation thay vì sửa thứ tự khóa mà chấp nhận chi phí?'
  ],
  tags: ['deadlock', 'locking', 'transaction', 'InnoDB']
,
},
{
  id: 'scenario-006',
  topic: 'scenario',
  level: 'senior',
  q: 'API trả về lỗi {{Connection is not available, request timed out after 30000ms}} lúc cao điểm. Nguyên nhân và cách xử lý?',
  a: `**Tóm tắt:** lỗi HikariCP này nghĩa là pool hết connection và request phải chờ timeout — nguyên nhân điển hình 4 loại: connection leak, transaction quá dài (gọi HTTP trong tx), pool quá nhỏ so với số thread, query chậm bít đường. Đo trước khi tăng pool size.

### Làm rõ yêu cầu
- Lỗi xuất hiện dần theo thời gian hay bùng cùng lưu lượng?
- Gần đây có thay đổi code/config gì (thêm endpoint, tăng thread, đổi pool size)?
- Pool size hiện tại, số thread tối đa, DB có giới hạn connection không?

### Điều tra / Phân tích
- Xem metrics Hikari: {{active}}, {{idle}}, {{pending}}, {{connection-time}}, {{usage-time}}. Pending lớn → pool là nút thắt.
- Bật {{leakDetectionThreshold = 60000}} để log stack trace khi connection không trả về trong 60s — phân biệt leak với quá tải.
- Xem {{pg_stat_activity}} / {{SHOW PROCESSLIST}} lúc cao điểm: query nào chiếm nhiều connection, thời gian mỗi query.
- Code review các {{@Transactional}}: tìm transaction bọc gọi HTTP/Kafka/file IO — thời gian giữ connection dài bất thường.

### Giải pháp
- Sửa leak: try-with-resources, không giữ Connection thủ công mà không đóng, native query trả connection đúng chỗ; mọi cảnh báo từ leakDetectionThreshold phải fix root cause.
- Thu ngắn transaction: chuyển HTTP/Kafka call ra ngoài; pattern ghi bảng outbox trong tx rồi gửi sau bằng worker.
- HikariCP gợi ý một heuristic khởi điểm {{connections = (core_count * 2) + effective_spindle_count}}, không phải công thức sizing phổ quát; đo giới hạn DB và thời gian giữ connection trước khi chốt pool.
- Tách pool cho batch/report so với OLTP để một nguồn không đè chết hai nguồn còn lại.
- Giảm {{connectionTimeout}} còn 3–5s để fail fast, tầng trên retry hoặc queue thay vì ôm chờ 30s.

### Trade-off & pitfall
- Tăng pool size vô tội vạ làm DB overload và lock contention tăng — nhiều connection không có nghĩa là nhanh hơn.
- {{maxLifetime}} phải ngắn hơn {{wait_timeout}} MySQL và idle timeout của LB/proxy, nếu không connection trong pool chết bên dưới gây lỗi lẻ khó debug.
- Không thu thập metrics Hikari là mù mát — sự cố như thế thường đã có sóng cảnh báo nhỏ cả tuần trước đó.

> Senior tip: khi pool cạn, tìm connection đang ở đâu: dùng pg_stat_activity để xem query và thời gian chạy, rồi thread dump/APM để nối connection với luồng ứng dụng. Phân biệt query chậm, transaction giữ connection lâu và leak trước khi đổi pool size.`,
  follow: [
    'HikariCP report apparent connection leak là sao, cấu hình nào giúp phát hiện?',
    'Khi nào nên tách connection pool cho consumer batch so với API online?'
  ],
  tags: ['HikariCP', 'connection-pool', 'troubleshooting']
,
},
{
  id: 'scenario-007',
  topic: 'scenario',
  level: 'mid',
  q: 'Cần xóa / lưu trữ 300 triệu dòng dữ liệu cũ trong bảng đang chạy production mà không làm sập DB. Bạn làm thế nào?',
  a: `**Tóm tắt:** không bao giờ chạy một DELETE lớn — chia batch nhỏ (1.000–10.000 dòng) có checkpoint, sleep giữa các batch để replication/undo không nghẽn; nếu bảng phân vùng theo thời gian thì DROP PARTITION là tức thì. Lưu trữ trước vào bảng lạnh / S3 Parquet trước khi xóa, và nhớ VACUUM (Postgres) sau khi xóa khối lượng lớn.

### Làm rõ yêu cầu
- Tiêu chí xóa là gì (theo ngày, trạng thái)? Yêu cầu pháp lý giữ tối thiểu bao lâu (NHNN thường 5 năm)?
- Bảng có phân vùng theo thời gian chưa, có foreign key trỏ vào không?
- Có được downtime window không hay chạy online cùng traffic? Có warehouse bên ngoài để đổ dữ liệu vào không?

### Điều tra / Phân tích
- Ước lượng số dòng theo điều kiện ({{SELECT count(*)}} trên subset) — nếu cần xóa 80% bảng, cân nhắc rebuild bảng thay vì DELETE.
- Kiểm tra index khớp điều kiện DELETE; nếu DELETE buộc scan toàn bảng thì mỗi batch đều quét nhẹ.
- Tính ảnh hưởng replication/undo: DELETE lớn ghi rất nhiều WAL/binlog, tăng lag và disk.

### Giải pháp
- Batch delete có checkpoint:
~~~sql
-- PostgreSQL: chọn theo PK theo mỗi lần chạy, tránh OFFSET lớn
DELETE FROM logs WHERE id IN (
  SELECT id FROM logs WHERE created_at < now() - interval '24 months'
  ORDER BY id LIMIT 5000

);
-- MySQL: DELETE ... LIMIT 5000; chạy lặp cho đến khi 0 dòng, sleep 200ms mỗi vòng
~~~
- Lưu trữ trước: INSERT INTO logs_archive SELECT ... theo batch, hoặc export Parquet lên S3 + Athena để query sau này.
- Nếu bảng phân vùng theo tháng: DROP PARTITION — tức thì, không tạo dead tuples.
- PostgreSQL sau khi xóa khối lượng lớn: {{VACUUM ANALYZE}} (giờ thấp điểm) để dọn dead tuples và cập nhật stats.
- Nếu cần xóa 80% bảng: CREATE TABLE NEW AS SELECT (phần giữ lại) + rename — tổng thể nhanh hơn DELETE theo từng phần.

### Trade-off & pitfall
- Batch nhỏ nhưng WHERE không index vẫn quét bảng — phải đo số dòng mỗi vòng xem còn chậm không.
- DELETE khối lượng lớn mà chưa VACUUM làm dead tuples phình, làm chậm mọi query kế tiếp.
- Bảng archive cũng cần thiết kế schema/index từ đầu để phục vụ audit truy vấn cái cần về sau.

> Senior tip: thời hạn lưu trữ phụ thuộc loại hồ sơ và quy định áp dụng; chốt retention với pháp chế/tuân thủ trước khi xóa. Có thể phân tầng hot, archive và object storage, nhưng phải giữ khả năng tra cứu, kiểm soát truy cập và bằng chứng toàn vẹn theo yêu cầu.`,
  follow: [
    'So sánh DELETE theo batch và CREATE TABLE AS SELECT + rename trên bảng 300 triệu dòng?',
    'Nếu bảng chưa phân vùng, chuyển sang partition theo tháng thế nào mà không downtime?'
  ],
  tags: ['data-retention', 'batch-delete', 'archive', 'partition']
},
{
  id: 'scenario-008',
  topic: 'scenario',
  level: 'senior',
  q: 'Hai user cùng cập nhật số dư / tồn kho cùng lúc, một trong hai lần cập nhật bị mất (lost update). Bạn sửa thế nào?',
  a: `**Tóm tắt:** lost update xảy ra khi luồng đọc → tính → ghi không được serialize. Chuyển thành UPDATE nguyên tử kèm điều kiện ({{UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt}} và kiểm rowsAffected), hoặc optimistic lock {{@Version}} + retry, hoặc {{SELECT FOR UPDATE}} cho tranh chấp nặng.

### Làm rõ yêu cầu
- Phạm vi: luồng nào làm thay đổi số dư (nạp ví, rút tiền, flash sale tồn kho)? Có luồng tạo record và cập nhật nhiều bảng không?
- Tầng code đang viết bằng gì (JPA, MyBatis, raw JDBC) — quyết định cách fix chuẩn nhất.
- Tần suất tranh chấp trên cùng SKU / tài khoản là bao nhiêu (hot key)?

### Điều tra / Phân tích
- Tái hiện conflict: nhiều transaction request cùng PK với k6/JMeter; kiểm tra giá trị cuối đúng là không mất một lượt update.
- Xem code các service: pattern read-then-write thiếu khóa là loại hay gặp nhất.
- Nếu đang dùng JPA: xem có {{@Version}} trên entity không.

### Giải pháp
- Cách 1 — chuyển thành một câu SQL nguyên tử:
~~~sql
UPDATE inventory SET qty = qty - :take
WHERE sku = :sku AND qty >= :take;
-- rowsAffected = 0 -> hết hàng, không cần SELECT trước
~~~
  Tương tự balance: {{UPDATE accounts SET balance = balance - :amt WHERE id = :id AND balance >= :amt}}.
- Cách 2 — optimistic lock: entity có {{@Version}}; khi update miss (OptimisticLockException) retry với max attempts.
- Cách 3 — pessimistic lock: {{SELECT ... FOR UPDATE}} cho giao dịch ngắn, tranh chấp cao.
- Tầng UI: khi hết hàng thông báo rõ, nút disable trước, tránh người dùng nhấn nhiều lần.

### Trade-off & pitfall
- Optimistic lock với hot key (SKU hot sale) gây nhiều retry / lỗi báo cho khách hàng; với hot key dùng SQL nguyên tử hoặc hàng đợi theo SKU.
- Đừng quên {{qty >= :take}} trong WHERE — nếu thiếu, hai update đồng thời sẽ sinh kết quả âm.
- Update nguyên tử chỉ giải quyết một bước; nếu một luồng chạm nhiều bảng thì cần transaction + business check kèm bên trong.

> Senior tip: nguyên tắc của tôi là 'mọi cập nhật tính toán được thì gom về một câu SQL nguyên tử khi có thể' — giảm đáng kể logic race ở app và loại trừ lost update từ gốc. Với flash sale, thêm hàng đợi theo SKU cũng là người bạn tốt.`,
  follow: [
    'Điều gì xảy ra bên trong engine DB khi hai câu UPDATE nguyên tử cùng chạm dòng?',
    'Optimistic lock vs pessimistic lock — so sánh chi phí, khi nào dùng cái nào?'
  ],
  tags: ['lost-update', 'race-condition', 'optimistic-lock', 'row-lock']
,
},
{
  id: 'scenario-009',
  topic: 'scenario',
  level: 'senior',
  q: 'Bạn phải import file CSV/Excel 1 triệu dòng vào hệ thống. Thiết kế quy trình thế nào cho nhanh, đúng và chạy lại được?',
  a: `**Tóm tắt:** ba nguyên tắc: streaming parse từng dòng (không load toàn bộ file vào RAM), batch insert (500–1.000 dòng/chunk, ưu tiên COPY), chạy async qua queue có báo tiến độ; validate từng dòng và xuất báo lỗi theo số dòng; idempotent bằng hash file làm job key + unique key, chạy lại không trùng.

### Làm rõ yêu cầu
- Format: CSV hay Excel (.xlsx)? Encoding, header, bao nhiêu cột, cấu trúc có thay đổi giữa các lần upload?
- Policy lỗi: bỏ qua dòng lỗi và import phần còn lại, hay all-or-nothing?
- Thời gian chấp nhận bao lâu? Người dùng có cần xem tiến độ real-time?

### Điều tra / Phân tích
- Hiện tại code hay load toàn file vào List và save từng dòng — OOM và chậm; đo trên file thật để có baseline.
- DB nào (PostgreSQL có {{COPY}}), có quyền ghi bảng staging và đủ disk cho temp file không?

### Giải pháp
- Streaming parse + JDBC batch:
~~~java
try (Reader r = new BufferedReader(new InputStreamReader(in, UTF_8), 1 << 16)) {
  CSVParser parser = CSVFormat.DEFAULT.builder().setHeader()
      .setSkipHeaderRecord(true).build().parse(r);
  var buf = new ArrayList<Object[]>(1000);
  for (CSVRecord rec : parser) {
    buf.add(map(rec));
    if (buf.size() == 1000) { jdbc.batchUpdate(INSERT_SQL, buf); buf.clear(); }
  }
  if (!buf.isEmpty()) jdbc.batchUpdate(INSERT_SQL, buf);
}
~~~
- Tốc độ: PostgreSQL {{COPY}}, MySQL {{LOAD DATA INFILE}} nhanh hơn batch insert nhiều lần; Hibernate cần {{jdbc.batch_size=500}} và id bằng SEQUENCE (IDENTITY tắt JDBC batching).
- Validate từng dòng: ghi lỗi kèm số dòng + lý do, xuất file/JSON báo cáo; theo yêu cầu chọn skip-bad-rows hoặc fail-all.
- Async: upload lưu file S3 → pushing job vào SQS → worker xử lý → tiến độ ghi Redis (imported/total) → client poll hoặc SSE.
- Idempotent: {{SHA-256}} nội dung file làm job key; unique key (job_key, row_no) với INSERT ON CONFLICT DO NOTHING — chạy lại cùng file không trùng; nếu job đã thành công, trả kết quả cũ ngay.

### Trade-off & pitfall
- Transaction phủ cả 1 triệu dòng làm undo/WAL phình và giữ lock lâu — commit theo chunk; nếu business cần all-or-nothing thì load chunk vào bảng staging, validate xong mới merge/swap sang bảng thật trong một bước cuối.
- POI đọc .xlsx lớn phải dùng event API streaming ({{XSSFReader}} + SAX) hoặc thư viện như excel-streaming-reader/FastExcel thay {{XSSFWorkbook}} (load cả file); {{SXSSF}} chỉ dùng để **ghi** streaming, không đọc được.
- Hibernate với IDENTITY vô hiệu JDBC batch — lỗi phổ biến khiến import chậm 50 lần.

> Senior tip: trên PostgreSQL, COPY 1 triệu dòng chạy 8–12 giây trong khi JPA save từng dòng mất hơn 10 phút; staging + COPY là gói giải pháp tối thiểu cho hệ thống import lớn. Chi tiết hay bị quên: từ chối file trùng hash ngay ở endpoint trước khi worker phía sau lãng phí.`,
  follow: [
    'Nếu business bắt buộc all-or-nothing trên 1 triệu dòng thì thiết kế rollback thế nào?',
    'Tiến độ worker báo về client sao cho ổn khi nhiều node?'
  ],
  tags: ['CSV', 'batch-insert', 'COPY', 'async', 'idempotency']
,
},
{
  id: 'scenario-010',
  topic: 'scenario',
  level: 'senior',
  q: 'User cần export 5 triệu dòng ra CSV để tải về. Làm sao không OOM và không đứng trông chờ?',
  a: `**Tóm tắt:** không dựng List 5 triệu dòng trong RAM — dùng async job: query theo keyset/cursor, ghi streaming từng chunk ra file (temp rồi S3), xong trả presigned URL; option sync chỉ dùng cho dưới ~50k dòng bằng StreamingResponseBody, vì 5 triệu dòng vượt timeout proxy/gateway thường gặp.

### Làm rõ yêu cầu
- User chấp nhận chờ bao lâu: tải ngay (sync) hay nhận link qua email khi xong (async)?
- Format: CSV thuần hay .xlsx? Có cần tách nhiều part khi vượt 1.048.576 dòng cho Excel?
- Ai dùng: nội bộ admin (chấp nhận chờ) hay end user?

### Điều tra / Phân tích
- Cách hiện tại thường là: query lấy List, ghép String bằng StringBuilder hoặc ghi ByteArrayOutputStream trong memory → OOM ngay khi vài triệu dòng.
- Kích thước: 5 triệu dòng CSV khoảng 1–2 GB — vượt nhiều proxy/gateway body limit và connection timeout mặc định.

### Giải pháp
- Async job chuẩn: request → tạo job record PENDING → đẩy queue (SQS) → worker stream query viết ra temp file → upload S3 → gửi presigned URL:
~~~java
// PG: autoCommit=false + fetchSize=1000 mới stream; MySQL: useCursorFetch=true
try (var rs = stmt.executeQuery()) {
  try (var w = new BufferedWriter(new FileWriter(tmpFile), 1 << 16)) {
    w.write("id,name,amount\n");
    while (rs.next()) {
      w.write(rs.getLong(1) + "," + csvEscape(rs.getString(2)) + ","
            + rs.getBigDecimal(3) + "\n");
    }
  }
}
s3.putObject(req, RequestBody.fromFile(tmpFile)); // SDK v2, upload từ file: RAM không giữ nội dung
~~~
- JPA tải cả list vào RAM dễ die — dùng JdbcTemplate {{fetchSize}} + keyset pagination ({{WHERE id > :lastId ORDER BY id LIMIT 50000}}) loop nhiều truy vấn, không giữ cursor lâu.
- Khi xong: trả presigned URL (độ sống 1 giờ) qua callback/webhook/email.
- Sync cho trường hợp nhỏ: StreamingResponseBody + {{Content-Disposition}}; flush mỗi vài nghìn dòng và bật {{X-Accel-Buffering: no}} tránh proxy buffer.

### Trade-off & pitfall
- HTTP sync không chịu được 5 triệu dòng — timeout proxy, user tải lại nhiều lần tạo nhân bảo tải.
- CSV injection: giá trị bắt đầu bằng {{= + - @}} có thể chạy công thức trong Excel — prefix bằng dấu nháy đơn.
- Excel cứng max 1.048.576 dòng — tách part theo 500k dòng và nén .zip để user tải gộp.

> Senior tip: quy tắc của tôi: export nào ước tính trên 100k dòng đều chuyển thành async job + presigned URL; HTTP sync chỉ chịu tải nhỏ. Export lớn là dạng bài OOM kinh điển của Java — tôi từng thấy hệ thống OOM nhiều lần chỉ vì một user nhấn nút export bảng 8 triệu dòng báo cáo doanh thu.`,
  follow: [
    'Giới hạn số job export chạy đồng thời để chống user spam nút export?',
    'Làm sao bảo đảm file export phản ánh dữ liệu nhất quán tại thời điểm tạo?'
  ],
  tags: ['CSV', 'streaming', 'S3', 'async']
,
},
{
  id: 'scenario-011',
  topic: 'scenario',
  level: 'senior',
  q: 'User cần upload file 2GB lên hệ thống. Thiết kế luồng upload thế nào cho ổn định và có thể upload lại khi lỗi mạng?',
  a: `**Tóm tắt:** không cho file 2GB đi qua JVM (multipart tốn RAM/disk, dễ bị cắt timeout) — client upload thẳng S3 bằng presigned URL với multipart upload; part size và concurrency chọn theo giới hạn S3, throughput và khả năng retry; tải song song có giới hạn, part lỗi retry riêng (resumable); sau khi complete, dùng S3 event để quét virus (Lambda + ClamAV) trước khi file vào bucket chính.

### Làm rõ yêu cầu
- Kích thước max, loại file, mạng người dùng (4G văn phòng)? Có cần resumable khi ngắt giữa chừng?
- Ai quét virus, bucket đích là S3 hay hệ thống nội bộ? SLA thời gian file khả dụng sau upload?
- Có cần progress bar theo từng part không?

### Điều tra / Phân tích
- Cách hiện tại: Spring Multipart giữ temp file trong JVM, Tomcat có max-post-size; LB idle timeout cắt giữa dòng dữ liệu; JVM heap/disk giờ cao điểm.
- Trên 2GB, phần lớn request thất bại do timeout proxy; nếu phải retrry từ đầu file, user thường bỏ cuộc.

### Giải pháp
- Luồng chuẩn:
  1. Client gọi {{POST /uploads/init}} — backend tạo multipart upload (CreateMultipartUpload), trả uploadId và danh sách presigned URL cho từng part.
  2. Client tải song song từng part; part fail retry riêng; lưu trạng thái (uploadId, phần đã xong) để resume.
  3. Xong, client gọi {{/uploads/complete}} — S3 ghép file; S3 event kích Lambda chạy ClamAV; file qua sàng thì move sang bucket clean, nghi ngờ thì giữ quarantine.
- Backend không nhận byte nào — chỉ ký URL (vài ms CPU) và lưu metadata (owner, md5 từng part) để reconcile sau.
- Validate không dựa vào tên file và MIME header; đọc magic bytes để xác định loại file thật; giới hạn whitelist extension.

### Trade-off & pitfall
- Presign URL có hạn (tối đa 7 ngày, nên dùng 24h); resume cần xin lại URL cho phần chưa xong.
- CORS phải cấu hình cho presigned upload; phải test bằng trình duyệt thật, không chỉ Postman/curl.
- Tách ba bucket: upload-raw / quarantine / clean; chỉ bucket clean được app đọc — fail-safe khi quét lỗi.

> Senior tip: khi chuyển sang upload thẳng S3, service chỉ còn cấp presigned URL và nhận callback, nên CPU/RAM/băng thông dành cho file lớn gần như biến mất khỏi service (đo trước/sau để có con số của chính hệ thống bạn). Chọn part size/concurrency bằng đo đạc trên client và mạng mục tiêu; giới hạn số part đồng thời để không làm cạn băng thông/connection của thiết bị. Retry từng part giúp tiếp tục upload mà không gửi lại toàn file.`,
  follow: [
    'Client mất mạng khi đã upload 5 trên 12 part — luồng resume thiết kế thế nào?',
    'Dùng S3 ListParts để biết client đã xong part nào và bắt đầu retry từ đâu ra sao?'
  ],
  tags: ['S3', 'multipart-upload', 'presigned-url', 'virus-scan']
,
},
{
  id: 'scenario-012',
  topic: 'scenario',
  level: 'senior',
  q: 'Batch job chạy đêm bị hai instance chạy cùng lúc, và khi crash thì mất tiến độ phải chạy lại từ đầu. Bạn xử lý thế nào?',
  a: `**Tóm tắt:** hai vấn đề tách riêng — (1) anti-dupe: khóa phân tán bằng ShedLock hoặc K8s CronJob với concurrencyPolicy: Forbid; (2) chạy lại an toàn: checkpoint (Spring Batch jobExecutionContext / bảng tiến độ) + mọi ghi idempotent (UPSERT theo key nghiệp vụ) để restart không trùng, không mất.

### Làm rõ yêu cầu
- Cron được kích hoạt ở đâu (mỗi pod có scheduler, hay K8s CronJob riêng)? Có thể overlap khi job chạy lâu hơn interval?
- Job chạy bao lâu, crash có thể xảy ra lúc nào, mất một phần dữ liệu có nghiêm trọng không?
- Đã dùng Spring Batch chưa, hay tự viết scheduler?

### Điều tra / Phân tích
- Log thời gian chạy từng instance; đo runtime so với interval để thấy khoảng overlap.
- Kiểm tra job đã có khóa phân tán (Redis SETNX, bảng lock trong DB) chưa; lock có expire đúng cách không.
- Xem dữ liệu khi job bị gián đoạn giữa chừng: nửa được ghi, nửa không — thiếu cơ chế checkpoint rõ ràng.

### Giải pháp
- ShedLock (Spring):
~~~java
@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "eod-batch", lockAtMostFor = "PT3H", lockAtLeastFor = "PT30M")
public void run() { ... }
~~~
  lockAtMostFor phải lớn hơn max runtime để lock không bị instance khác chiếm khi instance đầu chưa chết hẳn; backend dùng DB hoặc Redis.
- K8s CronJob: {{concurrencyPolicy: Forbid}} + {{activeDeadlineSeconds}}; nếu pod crash, lần cron sau chạy lại phải dựa vào idempotency.
- Checkpoint: Spring Batch lưu jobExecutionContext trong JobRepository để {{JobOperator.restart}} từ phần chưa xong; nếu tự viết, ghi bảng job_run (run_id, step, last_key, status) theo mỗi chunk.
- Mọi ghi idempotent: INSERT ... ON CONFLICT DO NOTHING với key nghiệp vụ (ngày + entity) — chạy lại bao nhiêu lần cũng kết quả như một lần.
- Monitor: alert khi runtime gần lockAtMostFor; alert khi số dòng xử lý bằng 0 (job chạy nhưng không làm gì).

### Trade-off & pitfall
- ShedLock chỉ giải quyết chạy trùng, không giải quyết crash giữa chừng — vẫn phải checkpoint + idempotent.
- lockAtLeastFor quan trọng: tránh nhiều pod cùng giây nhận lock khi đồng hồ hệ thống xê dịch.
- Đừng dùng lock trong process (local mutex) — với nhiều pod nó vô dụng.

> Senior tip: hai lớp an toàn: khóa giải quyết chạy trùng, idempotency giải quyết chạy lại. Mọi job tôi viết đều có sẵn INSERT ON CONFLICT DO NOTHING với unique key nghiệp vụ — job restart lần thứ ba vẫn đúng như lần nhất, không double ghi.`,
  follow: [
    'ShedLock so với leader election (K8s Lease): khi nào chọn loại nào?',
    'Thiết kế checkpoint cho job tự viết (không Spring Batch) thế nào để restart từ chunk cuối?'
  ],
  tags: ['ShedLock', 'cron', 'checkpoint', 'idempotency', 'Spring-Batch']
,
},
{
  id: 'scenario-013',
  topic: 'scenario',
  level: 'mid',
  q: 'Bạn cần gửi email/thông báo cho 1 triệu user. Thiết kế sao cho không chênh tải và không bị khóa tài khoản ESP?',
  a: `**Tóm tắt:** không for loop trong web request — chia recipient thành job nhỏ (~10k user/job), đẩy vào queue (SQS), worker gửi theo rate limit quota của ESP (SES/SendGrid) với backoff + jitter; key (campaign_id, user_id) giúp gửi lại không trùng; thu webhook bounce/complaint cập nhật suppression list; tiến độ lưu Redis.

### Làm rõ yêu cầu
- Loại campaign: marketing (template chung) hay operational (nội dung theo từng user)?
- ESP nào, quota gửi/giây hiện tại? Có cần bounce/open tracking và unsubscribe?
- Chấp nhận gửi trải dài vài giờ, hay gấp trong 10 phút?

### Điều tra / Phân tích
- Cách hiện tại thường là load cả 1 triệu user vào memory hoặc gọi API gửi từng cái ngay trong request — OOM / timeout / hit rate limit.
- Xác nhận quota ESP và thời gian trung bình gửi một email để tính độ lớn từng job.

### Giải pháp
- Kiến trúc:
  1. Admin tạo campaign → scheduler chia recipient thành nhiều job (mỗi ~10k user) push vào SQS.
  2. Worker tiêu thụ queue, kiểm soát rate (vd SES mặc định ~ 14/s, cần nữa thì mở ticket xin tăng quota); gom nhiều người nhận mỗi request khi ESP hỗ trợ (SendGrid {{/v3/mail/send}} cho tối đa 1.000 personalizations/request; SES có {{SendBulkEmail}} theo template).
  3. Lưu trạng thái từng batch vào Redis/DB + tổng tiến độ (sent/failed/total).
  4. Webhook bounce/complaint → cập nhật suppression list ngay (không gửi nữa).
- Template render ở worker; idempotent bằng unique key (campaign_id, user_id) — queue re-deliver cũng không gửi tiếp.
- Chỉ log metadata (campaignId, userId, status) trong app log — không log nội dung hay địa chỉ email để tránh PII.

### Trade-off & pitfall
- Vượt rate limit ESP gây throttle/block tạm thời — mọi gửi phải tôn trọng 429 với exponential backoff + jitter.
- Gửi lại cho email đã unsubscribe là vi phạm CAN-SPAM/GDPR — suppression list phải được đọc trước khi gửi, cache ở worker.
- Campaign lớn cần test nội bộ trước (subset ~100 user) để bắt lỗi template trước khi thousands email sai ra đi.

> Senior tip: email hàng triệu này không phải bài toán throughput mà là bài toán quota: tôi luôn xếp campaign lớn ra giờ thấp điểm và gửi chậm 10k email/phút — gửi chậm hơn 2 giờ chấp nhận được, bị block tài khoản ESP một đêm thì không; luôn một nút dừng khẩn để halt toàn bộ campaign khi phát hiện template sai.`,
  follow: [
    'Retry khi SES trả lỗi quota — backoff strategy thiết kế thế nào?',
    'Fair-share khi nhiều campaign chạy song song: chia đôi hoặc theo trọng số?'
  ],
  tags: ['email', 'SQS', 'rate-limit', 'idempotency', 'ESP']
},
{
  id: 'scenario-014',
  topic: 'scenario',
  level: 'senior',
  q: 'p99 API tăng vọt từ 200ms lên 2s ngay sau khi deploy. Quy trình điều tra và khi nào rollback?',
  a: `**Tóm tắt:** ưu tiên khôi phục trước rồi điều tra sau — deploy vừa xong là nghi phạm số 1: nếu p99 vượt SLA hoặc error rate tăng, rollback hoặc tắt bằng feature flag trong vài phút đầu; sau đó so sánh trace trước/sau, kiểm GC/pool/deps rồi hotfix đúng chỗ.

### Làm rõ yêu cầu
- p99 tăng tức thì sau deploy hay dần dần vài giờ sau? Chỉ một nhóm API hay toàn bộ?
- Error rate có tăng kèm không (500, timeout)? Traffic có khác hơn trước (launch, marketing)?
- Cùng cửa sổ đó có thay đổi nào khác (config, DNS, TLS cert, nâng cấp library)?

### Điều tra / Phân tích
- Ghép timeline deploy theo phút với chart latency/error; loại trừ từng biến đổi một để định rõ nghi phạm.
- APM: so sánh traces p99 trước/sau; span nào dài nhất cũng được — SQL mới chậm, HTTP out tăng, serialization nặng thêm.
- JVM: GC pause tăng? Heap dùng nhiều? Connection pool hoặc thread pool cạn? CPU throttle của container?
- Code và library diff: tìm N+1 query mới, regex mới (ReDoS), serialize chính dạng mới, cache hit giảm.
- Tái hiện bằng load test trên staging với traffic hình giống prod.

### Giải pháp
- Rollback ngay khi p99/error vượt ngưỡng: revert về version trước hoặc tắt feature flag để phần tính năng mới không chạy; "quay về ổn định" luôn là bước đầu.
- Điều tra sâu: continuous profiling (async-profiler) xem flame graph tìm điểm nặng nhất; nếu query mới chậm → tối ưu index hoặc viết lại query.
- Hotfix tạm trong khi chờ: tăng tạm pool size nếu cạn; set timeout cho HTTP client mới thêm; scale ngang thêm replica.
- Prevent: canary deployment + SLO gate tự chặn trước full rollout; bắt buộc load test trước release lớn.

### Trade-off & pitfall
- So sánh latency trước/sau phải cùng điều kiện traffic — dùng histogram HDR, không nhắm giá trị trung bình bị skew.
- Tránh coordinated omission làm p99 thấp giả — đo theo như client thực tế gửi request, không đo theo lịch server.
- Rollback muộn vì còn debug trên prod là sai lầm kinh điển — giữ quy tắc: khôi phục trước, tìm nguyên nhân sau.

> Senior tip: quy trình oncall của tôi: phút 1–5 rollback hoặc tắt feature flag; phút 5–30 điều tra flame graph trên bản rollback. Lần đầu tôi oncall đã chậm rollback 30 phút vì cố debug trực tiếp trên prod — từ đó tôi giữ nguyên tắc: khôi phục trước, tìm nguyên nhân sau.`,
  follow: [
    'Nếu có canary deployment, quy trình dần dần roll out đảm bảo như nào để phát hiện regression trước?'
  ],
  tags: ['p99', 'rollback', 'APM', 'GC', 'troubleshooting']
,
},
{
  id: 'scenario-015',
  topic: 'scenario',
  level: 'senior',
  q: 'Service Java bị OOM và restart liên tục trên Kubernetes, vài tiếng một lần. Bạn chẩn đoán và xử lý thế nào?',
  a: `**Tóm tắt:** exit code 137 / OOMKilled nghĩa là container vượt memory limit của cgroup — không phải Java OutOfMemoryError. Phân tích tổng: heap (Xmx/MaxRAMPercentage) + metaspace + native/Netty/threads phải nhỏ hơn limit; chẩn đoán bằng kubectl describe, container memory metrics, NativeMemoryTracking và heap dump; fix bằng chỉnh heap ~ 60–75% limit và tìm leak native nếu có.

### Làm rõ yêu cầu
- Exit code, restartCount, trung bình mỗi pod sống bao lâu? Log cuối có OutOfMemoryError Java không?
- Memory limit/request hiện tại? JVM được cấu hình -Xmx tĩnh hay MaxRAMPercentage?
- App có dùng thư viện native/Netty/Kafka direct buffer không?

### Điều tra / Phân tích
- {{kubectl describe pod}}: thấy OOMKilled; {{kubectl top pod}} so với limit; Prometheus container_memory_working_set_bytes gần limit.
- Tính tổng memory JVM: heap + metaspace + code cache + thread stacks + direct buffers + GC overhead — heap 4GB trên limit 4GB gần như chắc chắn OOMKilled vì native còn cần vài trăm MB.
- Bật {{-XX:NativeMemoryTracking=summary}} xem phân bổ; nếu nghi Netty leak, bật tạm thời {{-Dio.netty.leakDetection.level=paranoid}}.
- Bật {{-XX:+HeapDumpOnOutOfMemoryError}} để phân tích MAT — nhưng Java OOM khác OOMKilled cgroup: nếu không bao giờ thấy Java OOM theo log thì đó là native.

### Giải pháp
- Đặt {{-XX:MaxRAMPercentage=60–75}} (hoặc Xmx rõ ràng) sao cho heap + native + headroom nhỏ hơn limit; headroom ít nhất ~15% limit.
- Giới hạn direct buffers ({{-Dio.netty.maxDirectMemory}}), hạn chế số thread (vd custom thread pool ít hơn).
- Nếu là heap leak: fix theo MAT; nếu native: giới hạn buffers, kiểm tra lớp JNI.
- Đúng kích thước: tăng limit hoặc giảm replication load; HPA dựa trên memory — nhưng đừng scale ngang nếu leak, mỗi pod vẫn leak sau respawn.
- Liveness/readiness không nên dựa trên memory — sẽ restart thêm, không cần thiết.

### Trade-off & pitfall
- MaxRAMPercentage cao (> 80%) cực dễ OOMKilled vì native không nằm trong heap.
- Quên mount volume cho heap dump: ghi vào filesystem ephemeral, dễ đẩy disk đầy và mất file dump.
- Không bật GC log trước deployment là mất thông tin quan trọng; bật dưới {{-Xlog:gc*:file=/logs/gc.log:time}} luôn luôn có sẵn.

> Senior tip: quy tắc khi tôi cấp JVM on K8s: memory limit = heap × 1.25 + vài trăm MB (metaspace + threads + Netty). Một pod Xmx 1g với limit 1g sẽ OOMKilled trong vài ngày giờ cao điểm GC. Bật NativeMemoryTracking trên staging trước prod để biết native cache của app riêng bao nhiêu MB.`,
  follow: [
    'Hiện tượng JVM tự thích ứng container: UseContainerSupport hoạt động thế nào và khi nào không?',
    'ZGC hay G1 giúp gì cho OOMKilled trên K8s?'
  ],
  tags: ['Kubernetes', 'OOMKilled', 'JVM', 'heap', 'NativeMemoryTracking']
,
},
{
  id: 'scenario-016',
  topic: 'scenario',
  level: 'senior',
  q: 'Memory của service tăng chậm chậm theo từng ngày, khoảng 200MB/ngày, phải restart định kỳ. Bạn chẩn đoán memory leak?',
  a: `**Tóm tắt:** phân biệt hai loại — heap leak (heap sau Full GC không trở về mức thấp) và native/off-heap leak (RSS tăng nhưng heap ổn). Heap: heap dump 2 snapshot cách nhau → phân tích Eclipse MAT (Leak Suspects, Dominator Tree). Native: NativeMemoryTracking + pmap. Lỗi hay gặp: cache không giới hạn, ThreadLocal, listener chưa unregister, static Map.

### Làm rõ yêu cầu
- Tăng 200MB/ngày của nguồn nào: heap hay RSS cả container? Sau Full GC có giảm về mức cũ không?
- Có cache lớn nào trong app (Guava/Caffeine, Redis local) hoặc thư viện native không?
- Leak tăng theo lưu lượng (request ngày) hay theo thời gian (timer job chạy mỗi ngày)?

### Điều tra / Phân tích
- Grafana: line heap after GC tăng dần từng ngày = heap leak; RSS tăng khi heap ổn = native leak.
- {{jcmd GC.heap_info}} / {{jstat -gcutil}} theo dõi old gen sau Full GC; heap dump bằng {{jmap -dump:live}} hoặc tự dump bởi HeapDumpOnOutOfMemoryError — so sánh 2 dump cách nhau 24h.
- Eclipse MAT: Leak Suspects + Dominator Tree chỉ ra object giữ memory nhiều nhất; histogram diff giữa 2 dump cho thấy class nào tăng.
- Nếu native: {{jcmd VM.native_memory summary}} diff theo thời gian; đo RSS bằng smaps, pmap xem segment nào tăng; nếu classloader leak khi redeploy: xem Metaspace.

### Giải pháp
- Sửa theo kết quả MAT: các loại phổ biến và fix tương ứng:
  - Cache unbounded: dùng Caffeine {{maximumSize}} + {{expireAfterWrite}}.
  - ThreadLocal không remove trong worker pool: remove trong finally.
  - Listener/cache đăng ký lại mỗi restart mà không unregister: lifecycle đúng chỗ.
- Tạm thời: đặt scheduled restart pod theo cron như biện pháp kháng cự để giữ riêng ổn định, trong khi chờ hotfix release.
- Phòng ngừa: luôn đặt maximumSize cho cache, giới hạn thread pool, và soak test với dữ liệu gần giống prod trước release.

### Trade-off & pitfall
- Heap dump live trên JVM lớn gây stop-the-world dài — dump giờ thấp điểm hoặc dùng HeapDumpOnOutOfMemoryError (tự động).
- Cache TTL dài mà key sinh ra vô hạn là menu với leak rất kín đáo, monitor eviction và size để catch early.
- Leak rất chậm (10MB/ngày) khó tái hiện trong chu kỳ sprint ngắn — soak test ít nhất một tuần là bắt buộc trước release.

> Senior tip: Dominator Tree thường giúp lần theo object giữ retained heap lớn, nhưng native leak cần công cụ khác. Nếu buộc phải restart định kỳ để giảm tác động, coi đó là biện pháp tạm có cảnh báo và thời hạn; vẫn cần tìm nguyên nhân và theo dõi xu hướng bộ nhớ.`,
  follow: [
    'Phân biệt heap leak với native/off-heap leak thế nào để tránh đi nhầm hướng?',
    'Caffeine cache nên đặt ttl và max size sao cho vừa xài được mà không leak?'
  ],
  tags: ['memory-leak', 'heap-dump', 'MAT', 'jcmd']
,
},
{
  id: 'scenario-017',
  topic: 'scenario',
  level: 'senior',
  q: 'Service bên thứ ba (thanh toán, SMS, lookup) chậm hoặc không ổn định, làm sập hệ thống của bạn. Bạn bảo vệ như thế nào?',
  a: `**Tóm tắt:** không để một dependency yếu kéo sập mình — kiểm soát bằng bộ ba: timeout ngắn rõ ràng, circuit breaker (Resilience4j) + retry có backoff/jitter, bulkhead tách luồng gọi; ghi DB trước và gửi sau (outbox) khi có thể; có fallback dữ liệu cũ; không bao giờ ôm DB connection hay giữ lock trong lúc chờ bên ngoài.

### Làm rõ yêu cầu
- Bên thứ ba nào, quan trọng ra sao (đồng bộ thanh toán hay chức năng phụ)? SLA bên họ là gì, có health check không?
- Hiện tại: call đồng bộ blocking, có timeout nào chưa, thread pool / connection pool ra sao?
- UX chấp nhận: báo lỗi ngay, trả dữ liệu cũ (cached), hay hàng đợi và thông báo sau?

### Điều tra / Phân tích
- APM external span: đo phân bố latency theo từng dependency, error %, xác định dependency nào tham gia vào chuỗi chậm của p99.
- Sự cố tái hiện: khi bên thứ 3 chậm 30s, bao nhiêu thread của mình kẹt, pool cạn thế nào — hiện tượng cascade.
- Phân loại: dependency nào buộc đồng bộ (xác thực thẻ) vs có thể bất đồng bộ (email, log).

### Giải pháp
- Timeout rõ ràng: connect dưới 1s, read 2–5s tùy nghiệp vụ; mặc định của thư viện (60s hoặc vô hạn) là bệnh chết người.
- Resilience4j:
~~~java
CircuitBreaker cb = CircuitBreaker.of("partnerA", cbCfg);   // dừng gọi khi errorRate vượt ngưỡng
Bulkhead bh = Bulkhead.of("partnerA", bhCfg);               // giới hạn gọi đồng thời
Retry rt = Retry.of("partnerA", retryCfg);                  // 2 lần, backoff + jitter
// thứ tự khuyến nghị: Retry ngoài cùng -> CircuitBreaker -> Bulkhead -> call
// (CB mở thì retry dừng ngay, mỗi lần thử đều được CB đếm)
// rt.decorateSupplier(cb.decorateSupplier(bh.decorateSupplier(() -> partner.call())))
~~~
- Fallback: cache kết quả tốt cuối cùng (stale-while-error), trả kèm nhãn "dữ liệu cũ"; nếu nghiệp vụ chấp nhận async → ghi DB trước (outbox), worker gửi sau, phản hồi ngay cho user.
- Tách luồng: call bên ngoài chạy trên thread pool riêng (bulkhead) hoặc WebClient non-blocking — không chiếm hết thread HTTP; không giữ DB connection trong lúc chờ (không bọc HTTP call trong transaction).
- Giảm tải khi hỏng: CB mở → tắt tính năng phụ (SMS, recommendation), giữ luồng chính.

### Trade-off & pitfall
- Retry storm: nhiều retry cùng lúc nhân tải lên một bên thứ ba đang yếu — phải backoff + jitter + retry budget.
- Circuit breaker nhạy quá thường xuyên mở làm dịch vụ tốt bị dừng — set theo SLO thực tế + health probe riêng.
- Bulkhead trong process không cứu nếu DB cũng bị chặn bởi cùng luồng chờ — rule: không gọi HTTP trong transaction.

> Senior tip: timeout + retry.backoff + circuit breaker phải có ngay từ ngày đầu, không phải thêm sau khi lỗi. Tôi từng thấy một đối tác thanh toán p99 4s kéo sụp cả cụm vì 20 thread gọi đồng thời timeout 30s; thêm Bulkhead 5 + timeout 3s + CB mất 2 giờ coding và cứu nhiều đêm oncall.`,
  follow: [
    'Timeout bao nhiêu là hợp lý cho từng loại call (xác thực thẻ so với payment)?',
    'Circuit breaker mở mà traffic vẫn đến — fallback nào tránh sinh queue vô hạn?'
  ],
  tags: ['resilience', 'CircuitBreaker', 'bulkhead', 'Resilience4j', 'timeout']
,
},
{
  id: 'scenario-018',
  topic: 'scenario',
  level: 'senior',
  q: 'Cache hot hết hạn tại giờ cao điểm, DB bị dập hàng nghìn QPS (cache stampede). Và nếu Redis down thì sao? Bạn thiết kế thế nào?',
  a: `**Tóm tắt:** stampede phòng bằng 4 lớp: TTL có jitter, single-flight per-key (lock Redis), stale-while-revalidate và probabilistic early refresh (XFetch). Redis down: circuit breaker fail-fast, serve stale từ Caffeine lớp 2, bảo vệ DB bằng semaphore/rate limit ưu tiên luồng chính; không để full traffic róc về DB.

### Làm rõ yêu cầu
- Cache chứa loại gì (product list, session, currency rate)? QPS đọc trên hot key lớn nhất là bao nhiêu?
- Khi Redis down, DB có thể chịu bao nhiêu QPS trước khi sụp (quyết định fallback)?
- Redis đang chạy mode nào (single, Sentinel, Cluster), RTO mong đợi?

### Điều tra / Phân tích
- Mô phỏng: xóa một key nóng và đo DB QPS — thấy sóng bùng ở giây expire.
- Kiểm tra cấu hình: TTL đều nhau (không jitter), không có single-flight, không serve stale.
- Đo cache hit ratio trend + DB load spike quanh thời điểm expire.

### Giải pháp
- TTL luôn có jitter: {{ttl = base + random(0, 300s)}} để hàng nghìn key không expire cùng giây.
- Stampede protection:
~~~java
// lớp 2: Caffeine trong JVM; get(key, loader) tự single-flight theo key
Object v = localCache.get(key, k -> loadWithRedisLock(k));
// loadWithRedisLock: đọc Redis -> miss thì SET NX EX lock per-key -> load DB
~~~
  Ngoài JVM, dùng lock per-key (SET NX EX 10s): một instance load, instance khác chờ rồi đọc lại cache.
- Probabilistic early refresh (XFetch): refresh sớm khi {{now - delta * beta * ln(random()) >= expiry}} (delta = thời gian recompute, beta ≈ 1; random trong (0,1) nên ln âm) — càng gần hết hạn xác suất refresh càng cao, key luôn tươi, không trải qua expire đột ngột.
- Redis down: Resilience4j CircuitBreaker cho Redis client (fail nhanh thay vì timeout 5s từng request); Caffeine serve stale; nếu stale cũng hết → semaphore giới hạn số request đi DB, còn lại trả lỗi có cách cư xử tốt.
- Kiến trúc Redis: Sentinel / Cluster cho HA; client với autodiscovery (Lettuce); test failover thật, không tin cam kết lý thuyết.

### Trade-off & pitfall
- Lock per-key phải có TTL ngắn phòng holder chết; single-flight trong JVM chỉ cứu một instance — phải kết hợp lock Redis cho nhiều instance.
- Serve stale quá lâu làm dữ liệu sai lệch (giá, tồn kho) — chỉ dùng cho dạng dữ liệu thoáng, không dùng cho số dư.
- Stampede còn rơi lại sau Redis failover (cache trống hết) — cần cả kịch bản warm-up sau restart.

> Senior tip: công thức chuẩn của tôi: TTL + jitter, Caffeine lớp 2, lock per-key khi miss, XFetch refresh sớm. Với key nóng (banner chính), tôi cho refresh background mỗi 1–2 phút và không bao giờ để key expire — hết bài toán stampede, không cần đoán TTL.`,
  follow: [
    'XFetch probabilistic early refresh hoạt động thế nào, tham số k chọn sao theo tham vị quan trọng của key?',
    'Cho trường hợp Redis Cluster failover (cache trống): warm-up cache thế nào để DB không phải gánh toàn thiếu?'
  ],
  tags: ['cache-stampede', 'Redis', 'single-flight', 'TTL', 'Caffeine']
,
},
{
  id: 'scenario-019',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Hệ thống sắp đón traffic tăng 10 lần trong sự kiện khuyến mãi lớn. Bạn chuẩn bị những gì?',
  a: `**Tóm tắt:** đúng thứ tự chuẩn bị: load test ở 10x để tìm nút chốt từng tầng (app, pool, DB, bên thứ ba); pre-scale theo schedule trước giờ G (HPA reactive không kịp); kiểm soát tải vào (rate limiting, queue, waiting room); degraded mode có sẵn (tắt tính năng phụ); runbook và game day diễn tập trước.

### Làm rõ yêu cầu
- Sự kiện gì (flash sale, trả lương, marketing)? Profile traffic: RPS cao điểm, thời lượng, tỷ lệ read/write.
- Tính năng nào giữ SLO tuyệt đối (thanh toán, login), phần nào có thể cut (gợi ý, statement)?
- Ngân sách infra pre-provisioned trong các ngày cao điểm là bao nhiêu?

### Điều tra / Phân tích
- Load test (k6/Gatling) ở 2x, 5x, 10x với profile hình thật — xác định nút chốt nằm ở app CPU, DB connection pool, hay giới hạn bên thứ ba (SMS, gateway ngân hàng).
- Xác định current peak: hệ thống chịu bao nhiêu RPS trước khi latency vượt SLO.
- Liệt kê các cap bên ngoài: LB connection limits, K8s node pool, DB connection limits, API quota bên thứ ba, ESP/SMTP quota.

### Giải pháp
- **Pre-scale:** HPA min replica tăng theo schedule trước giờ G; node pool preload; warm-up cache + connection pool; CDN cho static.
- **Kiểm soát vào:** rate limit per-user (token bucket) + phân tầng API ưu tiên: (1) thanh toán/login, (2) tra cứu, (3) tính năng thứ yếu; queue các write không chặn (email/SMS receipt), trả lời ngay 'đã ghi nhận, SMS sẽ tới'.
- **Waiting room:** khi gần saturation, hàng đợi ở lớp LB/CDN với số thứ tự cập nhật — giữ trải nghiệm không chết.
- **Degrade mode có sẵn feature flag:** tắt theo thứ tự định trước (recommendation → export → history chi tiết), chỉ giữ luồng chính.
- **Precompute:** bảng giá/khuyến mãi tính sẵn theo version key; đo và ghi rõ quota đối tác (gateway ngân hàng có thể cứng chỉ 50 TPS).
- **Runbook:** các quyết định đã chuẩn bị trước (tăng limit nào, tắt gì, escalation), APM dashboard, SLO alert, on-call đủ người ngày G.

### Trade-off & pitfall
- Quên quota bên thứ ba là cap cứng — design theo nó (queue + backoff), không chỉ scale infra của mình.
- Cache invalidation đúng lúc căng có thể hạ cả site — hot data precomputed theo version key, không xóa bằng TTL ngắn.
- HPA reactive không theo kịp 10x trong 15 phút — schedule scaling + keep-warm là bắt buộc, CPU trigger chỉ là nguồn phụ.

> Senior tip: hệ thống nào chưa sống 10x là hệ thống chưa được test 10x — tôi luôn tổ chức game day (diễn tập cache down, đối tác down, pod scale fail) trước sự kiện lớn, chấm điểm từng kịch bản; ngày G tôi chỉ theo runbook và ghi lại hệ số để có lần kế hoạch sau càng chắc.`,
  follow: [
    'Game day nên tập trung vào kịch bản nào (cache down, đối tác down, pod scale fail)?',
    'Waiting room thiết kế ở layer nào (CDN so với app server)?'
  ],
  tags: ['scaling', 'rate-limiting', 'degrade', 'game-day', 'flash-sale']
},
{
  id: 'scenario-020',
  topic: 'scenario',
  level: 'senior',
  q: 'User bấm nút "Thanh toán" hai lần (hoặc client retry sau timeout), hệ thống bị trừ tiền hai lần. Bạn sửa thế nào?',
  a: `**Tóm tắt:** dùng idempotency key — client sinh một key duy nhất cho mỗi payment intent và giữ nguyên key khi retry; server lưu key + kết quả vào bảng có unique constraint, request trùng trả lại kết quả cũ; bên dưới là unique constraint DB chống race giữa hai node; gateway thanh toán bên ngoài cũng dùng idempotency header của họ.

### Làm rõ yêu cầu
- Retry đến từ đâu: user nhấn đúp, timeout HTTP client, hay client tự retry? Phổ biến nhất là timeout.
- Số tiền có thể đổi giữa các lần retry không? Cửa sổ idempotency giữ bao lâu (24h, 48h)?
- Gateway bên thứ ba (MoMo, Stripe) có hỗ trợ idempotency header riêng không?

### Điều tra / Phân tích
- Phân biệt hai nguồn double: (a) client gửi 2 request riêng tạo 2 transaction; (b) server xử lý xong nhưng response mất (HTTP timeout) → client retry.
- Xem code: mỗi POST /pay có sinh order mới không, hay dùng cùng order_id/idempotency key?
- Kiểm tra DB: có unique constraint nào trên (order_id, transaction_type) không?

### Giải pháp
- Bảng idempotency keys với unique constraint:
~~~sql
CREATE TABLE idempotency_keys (
  key_id varchar(64) PRIMARY KEY,
  request_hash char(64),
  response_body text,
  created_at timestamptz
);
-- INSERT ... ON CONFLICT (key_id) DO NOTHING
-- rowsAffected = 0 -> trả response_body đã lưu (retry an toàn)
~~~
- Bên trong service: state machine đơn (PENDING → PAID) và UPDATE có điều kiện:
~~~sql
UPDATE payments SET status = 'PAID'
WHERE id = :pid AND status = 'PENDING';
-- rowsAffected = 0 nghĩa là đã xử lý, không trừ thêm
~~~
- HTTP client: mọi retry của cùng request đều gửi cùng key; đổi body phải đổi key; TTL key 24–48h đủ dài cho network flaps.
- Gateway bên thứ 3 (Stripe/MoMo): truyền idempotency header của họ trên mỗi call, không tự sinh key trung gian.

### Trade-off & pitfall
- Chỉ check ở tầng service là không đủ: hai node xử lý song song có thể cùng pass — unique constraint DB mới là nguồn xác thật (source of truth).
- Bảo mật: key phải gắn với user_id; luôn kiểm request_hash trước khi trả cached response, tránh trả kết quả cũ cho request khác nội dung.
- Key TTL quá ngắn (< thời gian retry thực) gây double; TTL dài chỉ tốn lưu trữ — ưu tiên an toàn.

> Senior tip: trả lời có cấu trúc 3 tầng luôn ghi điểm phỏng vấn: (1) idempotency key cho retry an toàn, (2) unique constraint DB chống race giữa các node, (3) state machine để chỉ một transition được chạy. Trường hợp thực tế tôi từng làm với MoMo gateway: mọi retry trong 24h bắt buộc trả cùng kết quả — kể cả khi tiền đã qua đối tác.`,
  follow: [
    'Nếu gateway trả timeout (chưa biết kết quả) sẽ xử lý thế nào kết hợp với idempotency?',
    'Request hash xử lý sao khi client gửi cùng intent nhưng đổi vài trường vô hại (header)?'
  ],
  tags: ['idempotency', 'payment', 'DB-constraint', 'state-machine']
,
},
{
  id: 'scenario-021',
  topic: 'scenario',
  level: 'senior',
  q: 'Message Kafka bị consumer xử lý trùng, và đôi khi xử lý sai thứ tự. Nguyên nhân và cách thiết kế chống lại hai vấn đề này?',
  a: `**Tóm tắt:** Kafka at-least-once nghĩa là duplicate là chuyện thường — consumer phải idempotent: mọi event có event_id unique và upsert theo DB unique key; thứ tự chỉ được Kafka bảo đảm trong một partition — chọn partition key = khóa nghiệp vụ (accountId) và mỗi partition xử lý tuần tự; nếu phải song song thì dùng resequencer theo timestamp/version.

### Làm rõ yêu cầu
- Topic chứa loại event gì, có event_id unique từ producer không? Số consumer instance, thời gian xử lý mỗi message?
- Thứ tự quan trọng giữa những message nào (cùng user, cùng order)? Định nghĩa phạm vi rõ.
- Chấp nhận eventually consistent với các event trễ (arrive out of order) không?

### Điều tra / Phân tích
- Nguồn duplicate: producer retry (acks, broker restart), consumer rebalance trước khi commit offset, hay business re-publish — đo thưa thớt từng loại.
- Nguồn out-of-order: consumer xử lý song song bằng thread pool, retry về DLT rồi quay lại message cũ sau khi message sau đã xét, hoặc partition key sai.
- Kiểm broker: min.insync.replicas, unclean.leader.election, commit interval — ảnh hưởng quy mô trùng/mất.

### Giải pháp
- Idempotent consumer:
~~~sql
INSERT INTO processed_events (event_id, payload_hash) VALUES (?, ?)
ON CONFLICT (event_id) DO NOTHING;
-- rowsAffected = 1 mới chạy business logic; = 0 nghĩa là đã xử lý
~~~
- Thứ tự: partition key = domain (accountId, orderId); mọi event cùng domain vào chung một partition; trong một partition Kafka bảo đảm thứ tự.
- Nếu buộc phải song song xử lý theo key: resequencer dựa trên {{source_ts}} hoặc version, buffer state theo key chờ event trước về (có timeout).
- Emit không trừ: dùng transactional outbox — ghi DB + event trong cùng transaction; producer {{enable.idempotence=true}}; consumer tắt auto commit, chỉ commit sau khi xử lý xong.
- DLT: lỗi không xử được đẩy sang dead letter topic kèm chi tiết lỗi, có alarm; không bỏ message âm thầm.

### Trade-off & pitfall
- {{max.poll.interval.ms}} quá ngắn khi xử lý lâu → rebalance loop, chiếm thêm duplicate; idempotency chịu đựng trường hợp này — hoặc tăng interval.
- Đừng kỳ vọng exactly-once tự động từ Kafka — consumer idempotent là bắt buộc; exactly-once semantics chỉ hỗ trợ trong phạm vi producer-consumer nhất định.
- Khi Partition count tăng/re-partition, cùng key có thể đổi partition — resequencer cần nguồn đáng tin, không chỉ thứ tự receive.

> Senior tip: duplicate không phải là bug của Kafka mà là thách thức thiết kế của hệ phân tán; rule tôi đưa vào code review: "mọi event phải có event_id từ nguồn và source_ts" — hai trường này khiến việc debug và reconciliation sau này dễ đi gấp trăm lần.
`,
  follow: [
    'Transactional outbox kết hợp với Kafka thế nào để không mất event khi DB commit thành công nhưng publish thất bại?',
    'Resequencer buffer theo key có timeout — thiết kế chi tiết?'
  ],
  tags: ['Kafka', 'idempotent-consumer', 'partition-key', 'DLT']
,
},
{
  id: 'scenario-022',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Trong lúc migrate sang hệ mới, bạn phải đồng bộ dữ liệu giữa hệ legacy và hệ mới chạy song song. Thiết kế sao cho không lệch?',
  a: `**Tóm tắt:** không dùng dual-write thủ công (rất dễ lệch khi một bên fail) — dùng CDC (Debezium) làm đường chính một chiều, hoặc outbox nếu buộc dual-write; đối soát định kỳ theo bucket để phát hiện và sửa lệch; chuyển dần theo cohort user với feature flag; freeze window ngắn ở cutover cuối.

### Làm rõ yêu cầu
- Chiến lược migrate: big bang, strangler, hay dual-run kéo dài? Cả hai hệ có cùng ghi dữ liệu không?
- Legacy DB nào (Oracle, SQL Server, MySQL), CDC có được phép bật không? Schema có được sanction thay đổi?
- Chuẩn xác tuyệt đối hay chấp nhận eventually consistent? Thời hạn migrate bao lâu?

### Điều tra / Phân tích
- Đánh giá chi phí dual-write drift: mỗi failure một bên tạo một kiểu lệch phải repair; ước lượng số vụ lệch.
- Kiểm format dữ liệu: timezone, decimal precision, charset, collation, các enum có thể khác nghĩa.
- Theo dõi volume sync từng ngày để dự báo tải và chậm trễ.

### Giải pháp
- CDC: Debezium capture binlog/WAL của legacy DB → Kafka; hệ mới consume event hoặc đổ vào DB mới per-entity; một chiều để tránh dual-write drift.
- Nếu phải dual-write (không bật CDC được): outbox pattern — ghi DB + event trong một transaction; phía bên kia upsert idempotent; không tự viết đồng bộ thiếu rollback.
- Đối soát: job theo ngày so sánh count / tổng amount / hash theo bucket (account + date); dashboard drift; auto-repair các case đơn giản.
- Cutover: shadow-read trước (đọc song song, so sánh và log lệch, không trả về user), chuyển theo cohort user feature flag, cuối cùng freeze window ngắn (khoảng 15 phút) để snapshot chốt, switch, rồi mở traffic lại.

### Trade-off & pitfall
- Dual-write không có transaction bao toàn bộ → mỗi failure một bên là một vụ lệch; luôn phải đối soát, không có ngoại lệ.
- Timezone và decimal precision legacy — float vs numeric hoặc khác scale (2 vs 4 chữ số thập phân) làm lệch vài xu mỗi dòng; quy chuẩn trước khi sync.
- Giao dịch chốt quyết định schema: thêm version flag mới/old schema để tương thích trong vài tuần đầu của cutover.

> Senior tip: migration lớn chiến thắng không phải ở plan kỹ thuật mà ở dashboard đối soát — tôi luôn làm cho tổ chức một dashboard drift hiển thị số dòng lệch theo ngày; combo CDC + outbox + shadow read là nền bền; "kế hoạch hoàn hảo" mà không có đối soát thường dẫn đến nguy hiểm hơn nhiều.
`,
  follow: [
    'Shadow-read trong migrate: làm sao so sánh kết quả hợp lý mà tránh overhead lớn trên prod?',
    'Freeze window cuối cutover bao lâu và rollback thiết kế thế nào nếu switch thất bại ngay đầu?'
  ],
  tags: ['migration', 'CDC', 'Debezium', 'dual-write', 'reconciliation']
},
{
  id: 'scenario-023',
  topic: 'scenario',
  level: 'senior',
  q: 'Đối soát giao dịch với đối tác bị lệch: có giao dịch ở bên mình mà bên đối tác không có, và ngược lại. Xây quy trình thế nào?',
  a: `**Tóm tắt:** xây một match engine: load file/API đối tác, kiểm control total trước, match theo khóa nghiệp vụ (ref_no, amount, date), phân loại 4 nhóm (matched, amount mismatch, ours-only, theirs-only), queue chênh lệch với SLA aging; xác định nguyên nhân theo từng nhóm trước khi auto-fix; giao dịch treo đưa vào suspense account.

### Làm rõ yêu cầu
- Đối tác gửi đối soát qua đâu (file, API), chu kỳ nào? Giờ cut-off của họ khi nào?
- Khối lượng giao dịch/ngày, tỉ lệ lệch mong đợi, team OPS có bao nhiêu người xử lý?
- Chênh lệch đã phân tích theo nguyên nhân nào chưa (fee, rounding, FX, pending, fraud)?

### Điều tra / Phân tích
- Phân loại chênh lệch theo bin: matched clean, amount mismatch (fee, rounding, tỷ giá), ours-only (chưa settle), theirs-only (nghi ngờ); đo tỷ lệ mỗi bin theo giá trị.
- Kiểm cut-off: giao dịch 23:58 của mình nằm trong file ngày hôm sau — nguyên nhân false positive phổ biến; file resend cùng ngày dễ ghi đè unique key.
- Xác nhận control total file (số dòng + tổng tiền) trước khi match.

### Giải pháp
- Import pipeline: load file, xác minh checksum + control total; staging unique (partner_id, ref_no, file_date) — file resend tự skip nhờ ON CONFLICT DO NOTHING.
- Match engine:
~~~sql
-- ours-only: mình có, partner không có
SELECT o.ref_no FROM our_tx o
LEFT JOIN partner_tx p USING (ref_no) WHERE p.ref_no IS NULL;
-- theirs-only và amount mismatch: FULL OUTER JOIN + so sánh amount
~~~
- Queue chênh lệch với SLA aging: T+1 phải xử lý xong tối thiểu 95%; ưu tiên theo giá trị (lớn trước); dashboard báo cáo theo ngày.
- Auto-fix có ngưỡng (vd lệch fee dưới 1.000 VND tự ghi), lớn hơn thì manual + ghi chép; mỗi lần fix đều audit log (ai fix, lý do).
- Giao dịch treo chưa rõ: ghi vào suspense account; cuối ngày đối soát suspense phải về 0 hoặc giải thích được.

### Trade-off & pitfall
- Auto-fix quá tham làm sai ghi nhận fee/bank charge — ngưỡng phải theo từng partner và giá trị lớn luôn manual review.
- Match key phải chuẩn hóa trước: partner schema khác nhau (ref 16 số, zero padding...) — validator theo version schema.
- pending status của đối tác settle sau T+1 — không đưa pending vào queue lệch sớm, đợi wait window T+3 rồi xét lại.

> Senior tip: mục tiêu của tôi là match rate 99.9% theo số lượng giao dịch nhưng đừng quên theo giá trị — một giao dịch lệch 5 tỷ VND phải báo ngay, không chờ báo cáo cuối tháng; dashboard đối soát luôn có 2 KPI: count match rate và value variance per day.`,
  follow: [
    'Thiết kế suspense account trong ledger double-entry và khi nào nó về 0?',
    'Partner đổi schema file — quy trình nào để detect sớm trước khi import trúng?'
  ],
  tags: ['reconciliation', 'match-engine', 'suspense', 'OPS']
,
},
{
  id: 'scenario-024',
  topic: 'scenario',
  level: 'senior',
  q: 'Phát hiện log chứa thông tin nhạy cảm khách hàng, và một secret (DB password) đã được commit lên git. Xử lý sự cố thế nào?',
  a: `**Tóm tắt:** secret đã commit coi như đã lộ — ưu tiên rotate/revoke ngay trong vài phút đầu, sau đó mới dọn lịch sử git (git filter-repo) và quét artifacts; PII trong log: redact tại nguồn (logback masking), purge log tàng trữ, xác định impact và thông báo theo quy định (Nghị định 13/GDPR); cuối cùng prevent: pre-commit scan, log schema, audit.

### Làm rõ yêu cầu
- Chỉ secret, hay cả dữ liệu thật khách hàng (tên, CCCD, số thẻ)? Quy định pháp lý nào áp dụng (Nghị định 13, GDPR)?
- Secret nằm ở repo nào (private/public), ai có quyền clone, đã có fork/mirror chưa?
- Quy trình incident/security team và ISMS (ISO 27001) đã có để báo cáo không?

### Điều tra / Phân tích
- Secret: quét lịch sử git bằng gitleaks/trufflehog — xác định credential nào, từ khi, có fork; kiểm tra cloud access log xem credential có bị dùng từ IP lạ không.
- PII log: xác định các log repository (ELK, Loki, CloudWatch), thời gian bị lộ, số user bị ảnh hưởng, loại dữ liệu.
- Giả định an toàn: scraping bot chỉ cần vài phút trên repo public — luôn coi dữ liệu đã bị đọc ngay.

### Giải pháp
- Secret (theo thứ tự):
  1. **Rotate/Revoke** — revoke credential cũ, tạo mới, cập nhật vault/parameter store; restart service đọc config mới. Rotation trước, dọn lịch sử sau.
  2. Xóa lịch sử {{git filter-repo --path service.env --invert-paths}} hoặc BFG; force-push; note các clone phải re-clone.
  3. Quét artifacts: docker image layers (credential có thể nằm trong layer cũ), CI variable cache; revoke mọi credential chưa đổi.
- PII log:
  1. Thêm masking vào logback (regex CCCD, số thẻ, email); log chỉ ID/hash, không full object.
  2. Purge index cũ trong ELK hoặc gắn retention ngắn; đồng bộ cleanup cả backup.
  3. Impact assessment (bị lộ ai, gì, từ khi) — quyết định thông báo user/cơ quan theo Nghị định 13 / GDPR 72h.
- Prevent: pre-commit hook gitleaks, CI scan trufflehog, log redaction test tự động trong CI.

### Trade-off & pitfall
- Force-push không đảm bảo xóa hết: mirror, fork, VCS caching — rotate là biện pháp duy nhất chắc chắn vô hiệu hóa credential cũ.
- Chỉ sửa log hiện tại mà bỏ qua backup/index snapshot — PII vẫn còn theo ttl; purge phải áp dụng cả backup.
- Masking regex dễ bỏ sót định dạng lạ (thẻ 13 số so với 16 số, CCCD cũ/mới) — test với dataset thật.

> Senior tip: câu trả lời sai thường gặp trong phỏng vấn là "em xóa commit đi là xong" — câu đúng: "rotate ngay trong phút đầu vì bot quét GitHub vài phút sau commit; dọn history là bước hai". Đã có credential AWS bị dùng trong khoảng 10 phút sau khi repo ra public; pre-commit + CI scan là phòng tuyến trước.
`,
  follow: [
    'Làm sao phát hiện sớm secret commit trước khi bị khai thác (alert chủ động)?',
    'PII trong log: mask ở layer nào (logback pattern so với Jackson serializer)?'
  ],
  tags: ['security-incident', 'PII', 'git', 'rotation', 'GDPR']
,
},
{
  id: 'scenario-025',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Thiết kế ledger kế toán kép (double-entry) cho ví/tài khoản: bảng, ràng buộc, và vì sao không update số dư trực tiếp?',
  a: `**Tóm tắt:** hai bảng: entry_groups (một giao dịch) và ledger_entries (dòng debit/credit, append-only), thêm bảng account_balances không cần thiết nếu có thể derive; ràng buộc: tổng debit = tổng credit trong group, amount > 0, unique txn_ref (idempotency); không update số dư trực tiếp vì mất audit, sai không truy vết được, và không dựng lại số dư lịch sử được.

### Làm rõ yêu cầu
- Phạm vi: sổ cái đơn giản (ví nội bộ) hay đa tiền tệ, đa phân hệ (thuế, doanh thu)?
- Volume giao dịch mỗi ngày? Có cần query số dư tại thời điểm bất kỳ (point-in-time) không?
- Yêu cầu kiểm toán NHNN: mọi điều chỉnh phải có entry đảo (reversal), không được xóa/update trực tiếp?

### Điều tra / Phân tích
- Schema đề xuất:
~~~sql
CREATE TABLE ledger_entries (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_group_id uuid NOT NULL,
  account_id bigint NOT NULL,
  dc char(1) NOT NULL CHECK (dc IN ('D','C')),
  amount bigint NOT NULL CHECK (amount > 0),   -- minor units (VND: đồng, USD: cents)
  memo text,
  created_at timestamptz NOT NULL
);
CREATE TABLE entry_groups (
  id uuid PRIMARY KEY,
  txn_ref varchar(64) UNIQUE,     -- idempotency: trùng ref bị từ chối
  created_at timestamptz NOT NULL
);
-- ràng buộc tổng D = C theo group: kiểm bằng trigger hoặc job đối soát
~~~
- Số dư: derive từ SUM (chậm với bảng lớn) hay bảng {{account_balances}} cập nhật nguyên tử trong cùng transaction (insert 2 entries + update 2 balances)? Thực tế dùng balance table cho truy vấn nhanh và job đối soát so với SUM.
- Sai số không sửa trực tiếp: tiền chỉ di chuyển qua entries; lỗi được sửa bằng entry đảo (reversal entry), không UPDATE, không DELETE.

### Giải pháp
- Transaction ghi chuẩn (rowsAffected check):
~~~java
// BEGIN
// 1. INSERT entry_group (txn_ref unique) -> trùng ref: rowsAffected 0, return kết quả cũ
// 2. INSERT 2 entries (D cho debit account, C cho credit account) cùng group_id
// 3. UPDATE accounts SET balance = balance - :amt WHERE id=:a AND balance >= :amt
//    UPDATE accounts SET balance = balance + :amt WHERE id=:b
//    -> rowsAffected = 0 rollback hoàn toàn (không đủ tiền / mất tệp nhóm)
// COMMIT
~~~
- Đối soát cân bằng: điền theo group sao tổng D = C:
~~~sql
SELECT entry_group_id,
       sum(CASE WHEN dc='D' THEN amount END) AS d,
       sum(CASE WHEN dc='C' THEN amount END) AS c
FROM ledger_entries GROUP BY 1 HAVING sum(
  CASE dc WHEN 'D' THEN amount ELSE -amount END) <> 0;
~~~
- Hiệu năng: index (account_id, created_at DESC) cho mỗi query statement của account; partition entries theo tháng; archive sang warehouse sau 6–12 tháng.

### Trade-off & pitfall
- Không dùng float/double cho tiền — BIGINT minor units (VND có exponent 0 theo ISO 4217 nên lưu nguyên đồng; USD lưu cents) hoặc NUMERIC với scale cố định; mỗi currency cần scale chuẩn và lưu currency code.
- Khi update hai balance trong cùng transaction, luôn khoá/update theo thứ tự account_id tăng dần để hai chuyển khoản ngược chiều không deadlock.
- Update balance trong cùng transaction với entries là bình thường (balance chỉ là derived cache) — nhưng nếu nằm ngoài cùng transaction sẽ dễ lệch; job đối soát so tổng SUM(entries) với balances.
- Bảng entries lớn — mọi query phải có điều kiện thời gian/account để tránh scan toàn bảng.

> Senior tip: quy tắc của tôi cho ledger: "append-only, có đối soát, balance là derived cache". Job đối soát chạy một lần/ngày kiểm tổng SUM(entries) khớp accounts.balance cho từng account đã cứu tôi khỏi nhiều bug luồng kỳ lạ; nhiều case số dư sai do bug không nằm ở ledger mà ở luồng gọi trước đó.
`,
  follow: [
    'Query point-in-time balance từ dữ kiện entries: cách làm nào hiệu năng tốt với bảng lớn?'
  ],
  tags: ['ledger', 'double-entry', 'audit', 'fintech']
},
{
  id: 'scenario-026',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Đối soát cuối ngày (end-of-day) với NAPAS / đối tác: file đối soát có giao dịch treo và lệch. Thiết kế quy trình xử lý thế nào?',
  a: `**Tóm tắt:** quy trình 4 bước: (1) load file đối soát có checksum + control total; (2) match theo ref_no + amount + date, phân loại 4 nhóm (matched, amount mismatch, ours-only, theirs-only); (3) các case treo ghi suspense account và đưa queue OPS với SLA aging; (4) cuối ngày suspense phải về 0 hoặc có lý do giải thích; dashboard theo dõi tỷ lệ match.

### Làm rõ yêu cầu
- Đối tác gửi file dạng nào (CSV, fixed-width, ISO 20022) lúc mấy giờ? Có API inquiry để hỏi từng giao dịch không?
- Có nhánh pending/settlement riêng không? Cut-off giờ settle của đối tác (23:30?) chi phối quy trình xử số.
- OPS có mấy người xử lý case mỗi ngày? Có cần auto-refund tự động cho giá trị nhỏ không?

### Điều tra / Phân tích
- Phân loại theo bin trong 30 ngày gần nhất: matched, amount mismatch (fee/rounding/FX), ours-only (settle chưa về), theirs-only (nghi ngờ, fraud?); đo tỷ lệ giá trị mỗi bin.
- Kiểm cut-off: giao dịch 23:58 của mình vào file T+1 là phổ biến; định nghĩa cửa sổ để tránh false alarm.
- Kiểm duy nhất file: file resend không đè (unique key partner + file date + seq).

### Giải pháp
- Pipeline:
  1. Import file, xác minh control total (số dòng, tổng tiền); staging unique (partner, ref_no, file_date); encode file thay đổi schema phải validator trước.
  2. Match engine trên staging (FULL OUTER JOIN theo ref_no, so amount, ngày, tenant); 4 nhóm như trên.
  3. Hành động theo nhóm: amount mismatch lớn (fee thực) → OPS; ours-only → kiểm pending settle; theirs-only → inquiry API đối tác hoặc theo file sửa.
  4. Các case treo ghi suspense theo giá trị; deadline SLA T+1 phải xử lý được ≥ 95% giá trị chênh lệch.
- Auto-fix nhỏ theo ngưỡng (vd lệch < 1.000 VND ghi adjustment tự động, có audit log); lớn thì manual.
- Dashboard nổi bật: match rate count, value variance, case aging > 24/48/72h, số PENDING chưa đối soát; alarm tự động nếu vượt ngưỡng.
- Vết các file sửa (correction file) từ đối tác: match phiên bản sửa từ file cũ, giữ versioning fileDate + seq; số liệu đối chiếu theo version file.

### Trade-off & pitfall
- Match key chuẩn hóa trước khi so: partner ref thường zero-pad khác chiều dài — không normalize là false positive nhiều.
- Đừng đưa pending vào queue lệch sớm; window settling của đối tác T+3 mới xét lại nếu còn thiếu.
- USD vs VND rounding: VND không có xu, USD có; kê nhiều đồng tiền phải chuẩn hóa trước khi match.

> Senior tip: một KPI tôi luôn đặt cho hàm đối soát: "số dư suspense account về 0 trước 08:00"; nếu không là tín hiệu bug hoặc cần người xử lý sớm; dashboard match rate tự động giúp đội OPS đỡ hàng giờ xử lý thủ công mỗi sáng.
`,
  follow: [
    'Thiết kế suspense account trong ledger double-entry thế nào và khi nào về 0?',
    'Dashboard xử lý đối soát cần hiển thị những KPI nào cho nhóm OPS?'
  ],
  tags: ['reconciliation', 'NAPAS', 'suspense', 'fintech']
},
{
  id: 'scenario-027',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Giao dịch chuyển tiền qua partner timeout, chưa biết kết quả (unknown state). Quy trình xử lý thế nào?',
  a: `**Tóm tắt:** nguyên tắc cốt lõi: timeout không đồng nghĩa thất bại — ghi PENDING vào ledger và sau đó gọi inquiry API của đối tác với backoff; nếu đối tác không có inquiry, dùng file đối soát làm nguồn xác thật; chỉ ghi SETTLED khi đối tác xác nhận; FAILED và refund chỉ khi có confirmation từ đối tác; alarm khi có PENDING treo quá lâu.

### Làm rõ yêu cầu
- Partner có API inquiry không? SLA settle bao lâu (giây/phút)?
- Cut-off giờ settle của partner (23:30?), quy định pháp lý về hoàn tiền (refund) khi unknown thế nào?
- Rate limit inquiry API của đối tác là bao nhiêu?

### Điều tra / Phân tích
- Vẽ state machine: NEW → SENT → PENDING → (SETTLED | FAILED_CONFIRMED | REFUNDED); liệt kê transition do ai quyết định.
- Quan sát tx PENDING treo > X phút theo từng ngày — partner quá tải hay bug mạng?
- Kiểm rate limit inquiry: nếu poll dồn có thể bị đối tác chặn, làm chết refund flow.

### Giải pháp
- State machine + scheduled inquiry job:
~~~java
for (Tx t : job.repoPending()) {
  Result r = partnerApi.inquiry(t.refNo);     // idempotent
  switch (r.state()) {
    case SETTLED -> ledger.markSettled(t);        // transition PENDING -> SETTLED
    case FAILED  -> { if (r.canConfirm()) ledger.markFailedAndRefund(t); }
    case PENDING -> scheduleRetry(t, backoff()); // 1m, 5m, 15m, 1h, 6h...
  }
}
~~~
- Mọi transition có điều kiện (WHERE status = 'PENDING') để chỉ chạy một lần; txn_ref unique chống double.
- Đối tác không có inquiry API: chờ file đối soát T+1 làm nguồn xác thật; trước đó tx giữ PENDING (không failed tự ý); nếu user gọi điện hỏi, trả lời pending — không nói thất bại.
- Refund (khi partner xác nhận failed): tạo tx refund với txn_ref riêng, có nguyên từ ledger; nếu partner không refund, ghi pending và xử lý qua khâu đối soát.
- Alarm: số tx PENDING vượt ngưỡng (vd > 5 trong 10 phút) — cảnh báo oncall ngay; báo cáo đối soát cuối ngày phải có mặt mọi tx PENDING.

### Trade-off & pitfall
- Đừng ghi FAILED theo timeout khi đối tác chưa xác nhận — nếu tiền thật đi mà bạn refund thì mất tiền thật.
- Polling inquiry quá dồn dễ bị partner chặn (rate limit); backoff + jitter luôn, và batch inquiry nếu API hỗ trợ.
- Log đủ chi tiết cho từng case (ref, số tiền, từng bước inquiry) — sau này tranh chấp với đối tác cần timeline từng ms.

> Senior tip: nguyên tắc tôi luôn áp dụng khi thiết kế payment với 3 trạng thái chắc chắn: SETTLED (tiền tới nơi), FAILED_CONFIRMED (đối tác xác nhận), PENDING (chưa biết); mọi hành động refund phải có đối tác xác nhận — an toàn nhất là 'chờ + inquiry', không tự quyết.
`,
  follow: [
    'State machine lưu đâu (bảng status riêng so với ledger entries) và nếu crash giữa transition thì kiểm tra thế nào?',
    'Refund khi partner xác nhận failure: nếu partner không xử lý refund được thì luồng nào tiếp theo?'
  ],
  tags: ['payment', 'unknown-state', 'inquiry', 'fintech']
},
{
  id: 'scenario-028',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Audit log và truy vết thay đổi dữ liệu (ai sửa gì, khi nào) đáp ứng yêu cầu kiểm toán / NHNN. Thiết kế thế nào?',
  a: `**Tóm tắt:** 3 thuộc tính cơ bản: WHO (user/service, IP), WHAT (entity, field before/after), WHEN (UTC) — lưu vào bảng append-only không sửa được (hash-chain hoặc WORM storage), truy vết nhanh theo entity + thời gian; cách bắt: Hibernate interceptor/AOP tự tính diff, hoặc CDC (Debezium) capture từ WAL — CDC sạch hơn, không sót.

### Làm rõ yêu cầu
- Yêu cầu pháp lý: NHNN đòi lưu bao lâu (5 năm trở lên), định dạng export, tra cứu theo entity/user/thời gian?
- Ai đọc audit: kiểm toán nội bộ, bên ngoài, cơ quan? Quyền đọc audit được phân tách thế nào so với quyền nghiệp vụ?
- Tầng nào phải audit: chỉ API, hay cả update DB-direct (toàn bộ)? Có hành động login/logout và change permission cần thiết?

### Điều tra / Phân tích
- Đánh giá hiện trạng: WHO có đủ (user_id, IP, session), WHAT có đủ (entity, before/after), WHEN có đủ (UTC)?
- Hiệu năng: audit inline trong cùng transaction phình transaction — CDC capture từ WAL là chốt chính; app-level bypass không cover update trực tiếp DB.
- Security: ai có quyền đọc audit, log riêng domain nghiệp vụ, log đã có cho admin action chưa?

### Giải pháp
- Schema chuẩn audit_log:
~~~sql
CREATE TABLE audit_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ts timestamptz NOT NULL,              -- luôn UTC
  actor_id bigint, actor_type varchar(16), ip inet,
  entity_type varchar(64), entity_id varchar(64),
  action varchar(32),                   -- CREATE/UPDATE/DELETE/LOGIN...
  before jsonb, after jsonb,            -- diff có cấu trúc
  request_id varchar(64),
  prev_hash bytea, hash bytea           -- hash-chain chống chỉnh sửa
);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id, ts DESC);
~~~
- Cách bắt: Hibernate interceptor (onPreUpdate/onPreInsert) tự tạo diff sẵn, hoặc Debezium CDC từ WAL — sạch hơn, không sót DB-direct updates; chọn CDC khi nhiều hệ ghi đè trực tiếp DB.
- Chống chỉnh sửa: hash chain (hash của row hiện tại = SHA-256(prev_hash + payload)) + job verify hàng ngày; hoặc đẩy partition cũ lên S3 Object Lock (WORM).
- Độ tuổi data: hot 6 tháng trong DB, còn lại 5+ năm S3 Glacier; xuất report theo yêu cầu NHNN định kỳ.
- Quyền riêng: chỉ role audit-reader, API đọc riêng, không cùng DB của nghiệp vụ; sự truy cập cũng được log.

### Trade-off & pitfall
- Diff JSON phình to (document lớn thay đổi nhiều field) — lưu diff có cấu trúc, không dump full doc.
- Cách bắt bằng app-only (AOP) bỏ lỡ update từ job hay SQL-direct edits — CDC từ WAL là chắc nhất về WHAT/WHEN, nhưng WAL **không biết WHO** (user cuối, IP): app phải ghi actor vào cột ({{updated_by}}, {{request_id}}) để CDC mang theo, hoặc kết hợp audit tầng app; update SQL trực tiếp thì chỉ biết DB user.
- Hash chain cần verify job hàng ngày; nếu chain đứt mà không phát hiện sớm thì tính toàn vẹn mất.

> Senior tip: câu hỏi tôi luôn hỏi khi thiết kế audit: "khi kiểm toán viên đến, bạn trả lời trong bao lâu?" — thiết kế query theo entity + user + thời gian với index tương ứng; thời hạn lưu phải được xác định theo loại hồ sơ và quy định áp dụng; snapshot hash chỉ hỗ trợ phát hiện sửa đổi, không thay thế kiểm soát truy cập và quy trình lưu trữ.
`,
  follow: [
    'CDC audit log với Debezium: phục hồi khi topic lag quá và có trường hợp mất event không?',
    'Thiết kế hash-chain và quy trình verify: nếu hash không khớp, bước xử lý nào?'
  ],
  tags: ['audit', 'compliance', 'NHNN', 'CDC', 'WORM']
},
{
  id: 'scenario-029',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Yêu cầu bảo mật dữ liệu khách hàng trong ngân hàng: mã hóa at-rest/in-transit, masking, phân quyền, OTP/2FA, PCI DSS. Thiết kế tổng thể thế nào?',
  a: `**Tóm tắt:** phân loại dữ liệu trước (PII, tài chính, credential) rồi thiết kế theo lớp: mã hóa at-rest (KMS + TDE, envelope cho field nhạy cảm), in-transit (TLS 1.2+ mọi hop, mTLS optional), tokenization cho số thẻ (thu hẹp PCI scope), masking ở UI/log, RBAC least-privilege + audit, OTP/2FA risk-based. Không một lớp nào là đủ — phải xếp nhiều lớp phòng thủ.

### Làm rõ yêu cầu
- Loại dữ liệu: PII (tên, CCCD, SĐT), tài chính (số thẻ, số TK), hành vi; chuẩn 3 mức độ nhạy cảm.
- Yêu cầu pháp lý: PCI DSS nếu có thẻ, Nghị định 13 cho PII, quy định lưu trữ NHNN?
- Ai truy cập prod: bao nhiêu dev/DBA có quyền? Admin app nội bộ là ai?

### Điều tra / Phân tích
- Quét các điểm lưu: DB (TDE/EBS), object storage (S3 SSE-KMS), backup, log, cache, data warehouse — từng lớp đã mã hóa chưa.
- Kiểm tra đường đi: internal API trả về dữ liệu nào không cần? Log full request body (chứa PII) chưa được mask?
- Authentication: mật khẩu (bcrypt/argon2), OTP SMS so với TOTP, risk-based (login ở thiết bị lạ cần OTP).

### Giải pháp
- **At-rest:** KMS (AWS KMS) quản CMK + envelope encryption cho field rất nhạy cảm (CCCD, credential); DB bật TDE/EBS encrypted; backup mã hóa với key riêng tách vòng quyền riêng.
- **In-transit:** TLS 1.2+ và strong cipher mọi hop, mTLS giữa service nội bộ (Istio/server cert) nếu cần; rotation cert tự động.
- **Cardholder data:** tokenization qua PSP — token thay thế PAN ngay lúc lưu; không lưu PAN; lưu CVV là cấm tuyệt đối theo PCI DSS; lưu số TK thì AES-256-GCM per-record với KDF riêng.
- **Access:** RBAC least-privilege; audit mọi lần truy cập dữ liệu nhạy cảm; just-in-time access cho prod DB (xin quyền, expired sau 1 giờ).
- **App:** masking trong UI và log ({{**** 5678}} cho thẻ); OTP/2FA cho giao dịch lớn (SMS + TOTP backup, chống sim-swap bằng device fingerprint, danh sách thiết bị tin cậy).
- **Log:** log schema chuẩn không chứa PII/secret; scan tự động regex CCCD/thẻ trên sample.

### Trade-off & pitfall
- Backup/dump không mã hóa là lỗi phổ biến nhất — backup và SQL dump phải cùng chuẩn mã hóa; kiểm tra đến từng chữ.
- Cache (Redis) còn plaintext khi DB đã mã hóa — dùng serializer mã hóa key-level hoặc encrypt value trước khi cache.
- IAM rộng (toàn dev đều read DB) làm bảo mật phá từ bên trong — gắn tiêu chuẩn "time-to-detect ai đọc row X" như một KPI bảo mật.

> Senior tip: với ngân hàng, tôi luôn bắt đầu từ data classification matrix; lỗi hay gặp của team dev là mã hóa DB nhưng log và cache còn plaintext — thêm job quét regex CCCD/thẻ trên log sample trước khi công nhận "đã an toàn"; pre-commit scan chỉ là phòng tuyến đầu.
`,
  follow: [
    'Tokenization so với field-level encryption cho số thẻ — chọn theo trường hợp nào?',
    'OTP SMS vs TOTP: rủi ro sim-swap ở SMS OTP là thế nào, và nên chọn thiết kế nào cho ngân hàng VN?'
  ],
  tags: ['security', 'encryption', 'PCI-DSS', 'RBAC', 'OTP']
},
{
  id: 'scenario-030',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Batch final tính lãi/phí cuối ngày cho hàng triệu tài khoản: cần đúng, chạy lại được (re-runnable), không trùng. Thiết kế thế nào?',
  a: `**Tóm tắt:** 3 thuộc tính: đúng (key = account_id + accrual_date unique — chạy lại không trùng), re-runnable (checkpoint theo partition, restart từ phần chưa xong), đối soát (dry-run + tổng đối chỉnh báo cáo kế toán). Implement bằng Spring Batch chunk theo partition, UPSERT với ON CONFLICT DO NOTHING, business_date cấp từ scheduler chứ không now() từng JVM.

### Làm rõ yêu cầu
- Điều chỉnh công thức lãi theo quy định NHNN (tính theo số dư ngày, số ngày thực, quy tắc tháng 2, ngày lễ)? Nhiều nhóm tài khoản có quy cách tính khác nhau.
- SLA: giờ chạy (23:00?), có deadline nào (sáng mai 06:00 phải có số dư cập nhật cho hệ liên thông)?
- Volume: triệu tài khoản × số transaction mỗi tài khoản; phân bố theo loại tài khoản và khu vực?

### Điều tra / Phân tích
- Prior jobs của team: có từng chạy trùng/tính hai lần chưa, nguyên nhân cụ thể nào (restarted job, chunk commit rồi bị fail).
- Đo chuẩn từng stage: đọc dữ liệu vs tính tiền theo account — chỗ nào là bottleneck.

### Giải pháp
- Spring Batch: chunk 5.000–10.000 account theo partition theo range id (hoặc region), step reader trong từng range; mỗi record đọc, tính, ghi nguyên tử theo key nghiệp vụ:
~~~sql
INSERT INTO interest_accrued (account_id, accrual_date, amount)
VALUES (?, ?, ?)
ON CONFLICT (account_id, accrual_date) DO NOTHING;
-- unique key giúp chạy lại không ghi trùng
-- cập nhật balance cũng trong cùng chunk (điều kiện rowsAffected)
~~~
- Checkpoint: lưu partition đã chạy hoàn thành vào bảng job_run; restart chỉ chạy phần chưa xong; job không dùng now() từng JVM trong từng chunk mà nhận business_date từ tham số scheduler (tránh một pod chạy qua 00:00 là hai ngày khác nhau).
- Dry-run mode: chạy tính lãi nhưng không commit — in report tổng theo loại tài khoản cho kế toán đối chiếu; nếu lệch vượt ngưỡng thì chặn commit.
- Sau commit: đối soát bản ghi count + tổng value theo range so với report kế toán; báo lệch ngay nếu có.

### Trade-off & pitfall
- {{WHERE NOT EXISTS}} từng row sẽ chậm — dùng staging / MERGE / ON CONFLICT cho bulk.
- Update cùng account balance trong một transaction lớn có lock tranh chấp với luồng online deposit — chunk tự khóa theo partition; chunk nhỏ để cùng lock pattern.
- Business date phải do scheduler cấp (param), không lấy từ JVM clock — tránh trường hợp một pod vắt qua mốc 00:00 khiến hai chunk thuộc hai ngày khác nhau.

> Senior tip: job lãi hay sai nhất là chỗ re-run từ thiết kế: key nghiệp vụ (account_id + accrual_date) phải unique ngay từ ngày design; kinh nghiệm của tôi là luôn đặt restart đọc từ bảng checkpoint để tiếp tục đúng chỗ, và dựa vào UPSERT thay vì tự đếm theo danh sách trong app.
`,
  follow: [
    'Nếu batch chạy thất bại ở chunk 60 trong 100 và operator restart — chương trình lại từ đâu, checkpoint được lưu như thế nào?',
    'Nếu một account có tính lệch lãi (trong batch trước) — entry đảo (reversal) được ghi thế nào trong một phiên?'
  ],
  tags: ['batch', 'Spring-Batch', 'idempotency', 'lãi', 'fintech']
},
{
  id: 'scenario-031',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Ngày trả lương: traffic tăng đột biến trên cả API chuyển tiền của ngân hàng đối tác cap giới hạn. Chuẩn bị và xử lý thế nào?',
  a: `**Tóm tắt:** không thể giải quyết bằng scale đơn lẻ — chuẩn bị ba khớp: (1) pre-scale infra theo schedule trước giờ G; (2) kiểm soát tải vào: rate limit per-user, queue cho các luồng không chặn, waiting room khi gần saturation; (3) degraded mode có feature flag tắt tính năng phụ; quan trọng nhất là tôn trọng quota của đối tác (gateway ngân hàng/napas) vì đó là cap cứng.

### Làm rõ yêu cầu
- Profile traffic: RPS cao điểm, thời lượng, tỷ lệ read/write, luồng nào tăng mạnh nhất (transfer, balance lookup, statement)?
- Tính năng nào phải SLO tuyệt đối (transfer, login), phần nào tạm tắt được (export, recommendation)?
- Quota đối tác chuyển tiền là bao nhiêu TPS, có tăng được không theo hợp đồng?

### Điều tra / Phân tích
- Load test theo profile 10x, không chỉ test từng endpoint — cần đường end-to-end: từ user, qua app, queue, đối tác.
- Xác định cap từng tầng: LB connection, K8s node pool, DB connections, đối tác gateway TPS limit, ESP/SMS quota.
- Xác định nút chốt thật: nếu DB connections là bottleneck thì scale app không giải được; nếu đối tác gateway là cap thì design queue + backpressure giữa mình và đối tác mới là chính.

### Giải pháp
- **Pre-scale:** tăng min replica theo schedule trước giờ G, node pool giữ sẵn capacity, warm up caches + connections; CDN cho statics.
- **Kiểm soát vào:** rate limit per-user (token bucket) và phân tầng API: ưu tiên (1) transfer/login, (2) balance lookup, (3) tính năng phụ; khi đối tác gateway gần quota, đưa transfer dư vào SQS và trả user "đang xử lý — sẽ SMS khi hoàn tất".
- **Waiting room:** khi near saturation, hàng đợi với số thứ tự và thông báo tiến độ cập nhật định kỳ cho user.
- **Degrade:** tắt feature flag theo thứ tự (recommendation → export → history chi tiết), giữ login + balance + transfer.
- **Runbook + on-call:** các quyết định được chuẩn bị sẵn trong prepackaged config (tăng limit nào, tắt gì, mở queue nào); alert dựa SLO; dashboard track các quota đối tác.

### Trade-off & pitfall
- Đối tác gateway limit là cap cứng — design phải theo nó (queue theo quota + tracker), không phải chỉ scale infra của mình.
- Cache bên dưới đầy invalidate đúng giờ G sẽ đá chết website — hot config precomputed theo version key, không xóa ở thời điểm khủng hoảng.
- Quota tracking của đối tác phải là dữ liệu đo được (dashboard), không dựa vào cảm nhận — nếu không sẽ thường xuyên vượt limit trước khi biết.

> Senior tip: ngày lương không phải bài toán scale đơn thuần mà là bài toán kiểm soát tải vào và quota đối tác — tôi từng tham gia một release lớn cho ngân hàng với gateway đối tác cứng 50 TPS: chỉ nhờ queue có backpressure mới chịu được 200 TPS từ app mà không cháy deadline đối soát.
`,
  follow: [
    'Rate limit per-user và per-nhóm tài khoản: token bucket triển khai ở gateway hay service, chi tiết thế nào?'
  ],
  tags: ['payday', 'rate-limiting', 'queue', 'fintech', 'quota']
}
,
{
  id: 'scenario-032',
  topic: 'scenario',
  level: 'senior',
  q: 'Sau DB failover, app vẫn báo lỗi kết nối vài phút: nguyên nhân JVM DNS cache và connection pool giữ connection chết, xử lý thế nào?',
  a: `**Tóm tắt:** Sau failover, client có thể còn dùng địa chỉ DNS cũ hoặc JDBC connection đã bị đóng; đây là hai cache độc lập và không phải mọi lỗi đều do JVM DNS cache. Kiểm tra DNS, driver, pool và thời điểm lỗi trước khi chọn cách phục hồi.

### Cơ chế
- Java lưu kết quả phân giải theo security property networkaddress.cache.ttl; mặc định phụ thuộc runtime/cấu hình, không có mặc định phổ quát 30 giây. Driver, resolver và proxy cũng có thể cache riêng.
- HikariCP dùng JDBC4 Connection.isValid() nếu driver hỗ trợ. Mặc định pool không ping mọi connection ở mỗi lần borrow; connection được kiểm tra khi pool nghi là idle đủ lâu hoặc khi keepalive được cấu hình.

### Giải pháp
- Cấu hình networkaddress.cache.ttl bằng security properties phù hợp JDK; không mặc định -Dnetworkaddress.cache.ttl được hỗ trợ. Kiểm tra resolver thực tế sau thay đổi.
- Chỉ đặt connectionTestQuery nếu driver không hỗ trợ JDBC4; validationTimeout phải nhỏ hơn connectionTimeout. Đặt maxLifetime ngắn hơn tuổi connection do DB/proxy áp đặt; nó không xử lý ngay connection đang được mượn.
- Sau failover, loại bỏ connection lỗi qua soft eviction để pool tạo connection mới. PostgreSQL targetServerType=primary chỉ chọn primary trong URL multi-host phù hợp, không tự cung cấp failover hoặc refresh DNS.
- Health check DB endpoint trả 503 để LB không route traffic tới instance đang fail.

### Trade-off & pitfall
- DNS TTL ngắn tăng DNS lookup overhead; cân bằng với tần suất failover.
- Connection pool recreation là heavy operation; chỉ làm khi cần, không mỗi request.

> Senior tip: ghi nhận hostname, IP đã resolve, SQLState và tuổi connection để phân biệt DNS cũ với socket chết trước khi chỉnh TTL.
`,
  follow: ['Làm sao detect DB failover từ app side?', 'Khi nào nên dùng failover-aware JDBC driver?'],
  tags: ['db-failover', 'dns-cache', 'connection-pool', 'hikari']
,
},
{
  id: 'scenario-033',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'RSS của container tăng dù heap ổn định: glibc malloc arenas, direct memory, thread — chẩn đoán và xử lý?',
  a: `**Tóm tắt:** RSS tăng trong khi heap ổn định thường do off-heap: glibc malloc arenas giữ memory cho thread, direct ByteBuffer, thread stacks, Metaspace. Chẩn đoán bằng native memory tracking và /proc, xử lý bằng MALLOC_ARENA_MAX, direct memory limit, thread pool sizing.

### Cơ chế
- glibc malloc dùng nhiều arena để giảm tranh chấp; arena không phải mỗi thread một arena. Giới hạn phụ thuộc kiến trúc/cấu hình (trên 64-bit thường theo số CPU), không phải hằng số 8x cores. Bộ nhớ free có thể được giữ để tái sử dụng nên RSS chưa giảm ngay.
- Direct memory: ByteBuffer.allocateDirect, Netty, NIO buffers không trong heap.
- Thread stack có vùng reserved và committed khác nhau; -Xss không đồng nghĩa RSS tăng đúng 1 MB cho mỗi thread.
- Metaspace: class loading, thường tăng theo thời gian.

### Giải pháp
- Thử MALLOC_ARENA_MAX=2 hoặc 4 nếu tiến trình dùng glibc; benchmark vì giảm arena có thể tăng contention.
- Đối chiếu MaxDirectMemorySize với nhu cầu direct buffer. NMT hữu ích cho vùng native JVM được theo dõi nhưng không bao quát mọi malloc từ thư viện native bên thứ ba; đối chiếu với smaps và buffer pool.
- Thread pool: giới hạn thread count, dùng virtual threads (Java 21) cho I/O-bound.
- Monitor: jcmd <pid> VM.native_memory summary, /proc/<pid>/smaps.

### Trade-off & pitfall
- MALLOC_ARENA_MAX thấp có thể tăng contention trên arena → throughput giảm; test performance.
- Direct memory limit quá thấp gây OOM khi Netty buffer pool lớn.

> Senior tip: so sánh NMT, smaps và số thread; NMT không giải thích hết RSS thì tiếp tục kiểm tra allocator và native library thay vì kết luận là leak Java.
`,
  follow: ['Native memory tracking overhead là bao nhiêu?', 'Khi nào nên dùng virtual threads?'],
  tags: ['rss', 'native-memory', 'malloc-arenas', 'direct-memory', 'container']
}
,
{
  id: 'scenario-034',
  topic: 'scenario',
  level: 'senior',
  q: 'Batch import tạo bản ghi trùng do 2 request chạy song song: race condition, unique constraint, upsert — xử lý thế nào?',
  a: `**Tóm tắt:** race condition khi insert cùng key từ 2 thread → duplicate. Giải pháp: unique constraint ở DB + upsert (INSERT ... ON CONFLICT) hoặc pessimistic lock; application-level check không đủ vì TOCTOU.

### Cơ chế
- TOCTOU: check exists → insert có gap giữa 2 bước; 2 thread cùng pass check → duplicate.
- DB unique constraint là safety net; vi phạm ném DataIntegrityViolationException.

### Giải pháp
- Schema: unique index trên business key (email, external_id).
- PostgreSQL INSERT ... ON CONFLICT cần unique constraint/index phù hợp. MERGE có từ PostgreSQL 15 nhưng semantics cạnh tranh khác ON CONFLICT; chọn theo yêu cầu và kiểm thử dưới tải.
- PostgreSQL đánh dấu transaction failed sau unique violation cho tới rollback/savepoint; xử lý ở transaction boundary phù hợp rồi mới đọc lại nếu nghiệp vụ cho phép.
- SELECT ... FOR UPDATE chỉ khóa row đã tồn tại; khóa parent hoặc dùng advisory lock nếu cần tuần tự hóa key mới, vẫn giữ unique constraint làm bảo vệ cuối.

### Trade-off & pitfall
- Upsert có thể overwrite data không mong muốn; dùng DO UPDATE SET chỉ field cần update.
- Retry logic phải idempotent; nếu không sẽ tạo duplicate ở layer khác.

> Senior tip: xác định semantics khi payload khác nhau cùng key (first-write-wins, last-write-wins hay reject); ON CONFLICT thực thi đúng semantics bạn viết.
`,
  follow: ['Idempotency key pattern cho API import?', 'Khi nào dùng pessimistic vs optimistic lock?'],
  tags: ['race-condition', 'upsert', 'unique-constraint', 'idempotency']
,
},
{
  id: 'scenario-035',
  topic: 'scenario',
  level: 'senior',
  q: 'Bug lệch tiền do làm tròn khi chia phí/lãi cho nhiều kỳ: phân bổ phần dư, BigDecimal — xử lý thế nào?',
  a: `**Tóm tắt:** chia tiền cho N kỳ bằng round từng kỳ sẽ mất/gain vài đồng do làm tròn. Giải pháp: tính tổng, phân bổ phần dư vào kỳ cuối hoặc phân bổ round-robin; luôn dùng BigDecimal với scale và RoundingMode.

### Cơ chế
- 100.00 / 3 = 33.333 → round 33.33 × 3 = 99.99, mất 0.01.
- Phân bổ: tính mỗi kỳ = floor/round, phần dư = total - sum, cộng vào kỳ cuối (hoặc phân bổ round-robin cho công bằng).

### Giải pháp
- Dùng BigDecimal khởi tạo từ chuỗi hoặc integer theo minor unit; chọn scale theo currency và quy tắc nghiệp vụ. HALF_UP không phải quy tắc chung; HALF_EVEN hoặc quy định hợp đồng có thể cần thiết.
- Chọn quy tắc phân bổ rõ ràng: chia đến đơn vị nhỏ nhất, tính phần dư chính xác rồi phân bổ cho một số kỳ. Quy định cả amount âm và hướng làm tròn để tổng luôn khớp.
- Lưu input, quy tắc/phiên bản làm tròn và kết quả để audit; tổng các kỳ phải bằng tổng nguồn theo cùng đơn vị.

### Trade-off & pitfall
- Làm tròn HALF_UP vs HALF_EVEN (banker's) khác nhau ở .5; fintech thường HALF_UP.
- Audit trail phải lưu input + output để reconcile.

> Senior tip: test amount không chia hết, amount âm và nhiều currency; assertion quan trọng là tổng phân bổ bằng chính xác tổng nguồn.
`,
  follow: ['BigDecimal vs double cho tiền?', 'Làm sao reconcile tổng tiền với ledger?'],
  tags: ['money', 'rounding', 'bigdecimal', 'financial']
,
},
{
  id: 'scenario-036',
  topic: 'scenario',
  level: 'mid',
  q: 'Chứng chỉ SSL của đối tác hết hạn / đổi CA làm sập tích hợp: truststore, giám sát hạn chứng chỉ — xử lý thế nào?',
  a: `**Tóm tắt:** truststore chứa CA cert của đối tác; khi cert hết hạn hoặc đổi CA, TLS handshake fail. Giải pháp: truststore được quản lý tập trung, giám sát expiry, rotation không downtime, và fallback trust all trong dev only.

### Cơ chế
- JVM truststore (cacerts) chứa trusted CA certs. Khi server cert chain không match truststore → SSLHandshakeException.
- Cert có notBefore/notAfter; JVM không tự refresh.

### Giải pháp
- Dùng truststore được quản lý và phân phối an toàn; truststore riêng hữu ích khi cần giới hạn CA nhưng không bắt buộc cho mọi app. Không commit private key/secret vào repo.
- Monitor expiry: alert khi còn 30/14/7 ngày; script check bằng openssl s_client.
- Rotation: phân phối trust anchor mới trước khi đối tác chuyển nếu CA thay đổi. JSSE không có cơ chế reload chung cho mọi client; chỉ dùng reload nếu client cụ thể hỗ trợ thay SSLContext, còn lại rolling restart.
- Dev: trust all chỉ ở local/test profile.

### Trade-off & pitfall
- Reload truststore runtime phức tạp; rolling restart đơn giản hơn và an toàn.
- Pin cert (certificate pinning) tăng security nhưng rotation khó; cân nhắc.

> Senior tip: theo dõi cả chuỗi và hostname/SAN, không chỉ ngày hết hạn leaf; diễn tập rotation trên staging trước cửa sổ thay cert.
`,
  follow: ['Certificate pinning có nên dùng không?', 'Làm sao reload truststore không restart?'],
  tags: ['ssl', 'tls', 'truststore', 'certificate', 'expiry']
},
{
  id: 'scenario-037',
  topic: 'scenario',
  level: 'senior',
  q: 'JWT bị từ chối ngẫu nhiên do lệch đồng hồ giữa các server: clock skew, NTP, leeway — xử lý thế nào?',
  a: `**Tóm tắt:** JWT có exp/iat/nbf; nếu server clock lệch, token hợp lệ bị reject ngẫu nhiên. Giải pháp: NTP sync tất cả server, thêm leeway (clockSkew) trong validator, và dùng short-lived token với refresh.

### Cơ chế
- Validator thường kiểm tra exp và nbf; iat không luôn được kiểm tra như điều kiện thời gian nếu ứng dụng không thêm validator. Clock lệch có thể khiến token bị coi là hết hạn hoặc chưa có hiệu lực.

### Giải pháp
- NTP sync tất cả server (chrony/systemd-timesyncd), monitor offset.
- JJWT bản mới dùng clockSkewSeconds(...); setAllowedClockSkewSeconds(...) đã deprecated. Spring Security dùng JwtTimestampValidator(Duration.ofSeconds(...)), không có thuộc tính chung clockSkew=60s.
- Chọn leeway theo sai số đo được; nó nới chấp nhận exp/nbf và kéo dài cửa sổ nhận token hết hạn. Token lifetime/refresh là quyết định riêng, không sửa lệch đồng hồ.
- Log rejection reason để debug.

### Trade-off & pitfall
- Leeway quá lớn giảm security (token hết hạn vẫn chấp nhận thêm N giây).
- NTP failure → clock drift; monitor NTP sync status.

> Senior tip: log clock offset và claim thời gian đã kiểm tra (không log token); đặt skew theo độ lệch đo được và xác nhận với validator thực tế.
`,
  follow: ['Access token lifetime nên bao lâu?', 'Refresh token rotation pattern?'],
  tags: ['jwt', 'clock-skew', 'ntp', 'authentication']
,
}
,
{
  id: 'scenario-038',
  topic: 'scenario',
  level: 'senior',
  q: 'Redis đầy bộ nhớ, eviction xoá mất session/lock: maxmemory-policy, tách cluster theo mục đích — xử lý thế nào?',
  a: `**Tóm tắt:** một Redis instance chia sẻ cho session, cache, lock → khi đầy, eviction xoá session/lock gây logout/mất lock. Giải pháp: tách Redis theo mục đích, đặt maxmemory-policy phù hợp từng loại, và monitor memory.

### Cơ chế
- Redis có noeviction, allkeys-lru/lfu/random và volatile-lru/lfu/random/ttl; volatile chỉ chọn key có TTL. Với noeviction, lệnh ghi cần thêm bộ nhớ sẽ lỗi khi chạm giới hạn.
- Session/lock không nên bị evict; cache có thể.

### Giải pháp
- Tách deployment theo yêu cầu mất dữ liệu, độ trễ và eviction. Session có thể cần persistence/HA theo chính sách, nhưng persistence không thay backup. Lock cần TTL, fencing/nhất quán phù hợp và xử lý lỗi ghi.
- Đặt maxmemory và maxmemory-policy per instance.
- Monitor memory, evicted_keys, lỗi OOM và hit rate; đặt ngưỡng theo headroom và tốc độ tăng, không xem 80% là ngưỡng đúng cho mọi workload.
- Session: dùng Redis với persistence (RDB/AOF) và replica.

### Trade-off & pitfall
- Nhiều deployment tăng độ phức tạp. Redis Cluster chỉ hỗ trợ database 0; logical DB index không cách ly tài nguyên, còn key prefix không tạo policy eviction riêng.
- noeviction instance đầy → write fail; phải scale trước khi đầy.

> Senior tip: volatile policy vẫn có thể evict session/lock có TTL; key prefix không bảo vệ key khỏi eviction.
`,
  follow: ['Redis Cluster vs Sentinel cho HA?', 'Distributed lock với Redis Redlock?'],
  tags: ['redis', 'eviction', 'session', 'distributed-lock', 'memory']
,
},
{
  id: 'scenario-039',
  topic: 'scenario',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
  q: 'Dữ liệu Elasticsearch lệch so với DB: đồng bộ bằng CDC (Debezium), reindex không downtime — xử lý thế nào?',
  a: `**Tóm tắt:** ES index lệch DB do write path kép (write DB + write ES) fail một bên. Giải pháp: single source of truth là DB, CDC (Debezium) stream changes sang ES; reindex không downtime bằng alias swap.

### Cơ chế
- Dual write: app write DB rồi write ES; nếu ES fail → lệch; nếu retry → duplicate.
- CDC: DB transaction log (binlog/WAL) → Debezium → Kafka → ES sink connector → ES. At-least-once, idempotent by document id.

### Giải pháp
- App chỉ write DB; Debezium capture changes.
- ES document id = DB primary key → idempotent upsert.
- Reindex không downtime: tạo index mới với mapping/settings mới, bắt kịp thay đổi trong lúc backfill bằng CDC offset/checkpoint, xác nhận đủ dữ liệu rồi chuyển alias atomically qua một _aliases request; chỉ xóa index cũ sau rollback window.
- Xử lý delete theo contract connector: Debezium có thể phát delete event và Kafka tombstone; cấu hình sink phải map chúng thành xóa document, nếu không dữ liệu đã xóa còn sót trong ES.

### Trade-off & pitfall
- CDC lag → ES eventual consistent; UI phải tolerate stale.
- Schema evolution: mapping changes cần reindex; version mapping carefully.
- Debezium connector failure → lag tăng; monitor lag.

> Senior tip: CDC giảm rủi ro dual write nhưng vẫn cần reconciliation, rebuild procedure, monitoring lag và kế hoạch chuyển alias khi có thay đổi đồng thời.
`,
  follow: ['Debezium vs application-level outbox?', 'ES index alias swap procedure?'],
  tags: ['elasticsearch', 'cdc', 'debezium', 'reindex', 'data-sync']
},
{
  id: 'scenario-040',
  topic: 'scenario',
  level: 'mid',
  q: 'Chi phí log tăng vọt sau một release: log level, sampling, structured logging, PII trong log — xử lý thế nào?',
  a: `**Tóm tắt:** log volume tăng do debug level còn bật, log mọi request, hoặc log object lớn. Giải pháp: structured logging (JSON), sampling cho high-volume, PII redaction, và log level theo environment.

### Cơ chế
- Các facade/backend phổ biến có TRACE < DEBUG < INFO < WARN < ERROR; production chọn level theo tín hiệu cần giữ và chi phí, không có một level đúng cho mọi package.
- High-volume endpoint (health check, polling) log mỗi request → volume lớn.
- PII trong log → compliance risk + storage cost.

### Giải pháp
- Logback/Log4j2: profile-based level (dev DEBUG, prod INFO).
- Structured JSON logging (logstash encoder) cho parse dễ.
- Sampling: log 1/N request cho high-volume endpoint; full log khi error.
- PII redaction: mask email/phone/card; không log password/token.
- Đặt retention theo nhu cầu điều tra, quy định lưu trữ và ngân sách; thời hạn hot/warm/cold phụ thuộc workload.

### Trade-off & pitfall
- Sampling có thể miss rare errors; giữ full log khi status >= 500.
- Structured logging giúp truy vấn theo field nhưng chi phí serialize, ingest và lưu trữ phụ thuộc payload/volume; tránh body lớn và đo overhead.

> Senior tip: đo bytes/ngày và chi phí theo service trước/sau thay đổi; thiết kế sampling để vẫn giữ lỗi và trace cần cho điều tra.
`,
  follow: ['Structured logging với MDC context?', 'Log aggregation pipeline (ELK/Loki)?'],
  tags: ['logging', 'structured-logging', 'sampling', 'pii', 'cost']
},
{
  id: 'scenario-041',
  topic: 'scenario',
  level: 'senior',
  q: 'Thread pool của Tomcat cạn vì gọi blocking tới service chậm: chẩn đoán và cách cô lập — xử lý thế nào?',
  a: `**Tóm tắt:** Khi request thread bị giữ trong lời gọi downstream chậm, Tomcat có thể hết worker để xử lý request mới; giá trị mặc định phụ thuộc cấu hình. Chẩn đoán bằng thread dump và metrics hàng đợi, rồi giới hạn thời gian chờ và cô lập dependency.

### Cơ chế
- Tomcat: mỗi request một thread; thread block trên I/O (HTTP call, DB) → pool cạn.
- Trong thread dump, lời gọi socket blocking thường hiện RUNNABLE ở native socket read; xem stack trace và dump lặp lại để xác nhận nhiều worker cùng chờ một dependency. WAITING/TIMED_WAITING cũng có thể là lock/queue khác.

### Giải pháp
- Cấu hình connect, response/read và pool-acquire timeout trên HTTP client cụ thể; chọn theo latency budget/SLO thay vì mặc định 2s/5s cho mọi hệ thống.
- Circuit breaker: Resilience4j CB mở khi failure rate cao → fail fast.
- Bulkhead giới hạn concurrency mỗi dependency; thread-pool bulkhead cô lập blocking call, còn semaphore bulkhead giới hạn lời gọi nhưng không tạo pool riêng.
- Retry với backoff + jitter; idempotency.
- Spring Boot 3.2+ hỗ trợ virtual threads với JDK 21 và cấu hình phù hợp. Chúng giảm chi phí thread chờ I/O nhưng không tăng năng lực downstream; WebFlux phù hợp khi toàn chuỗi non-blocking/reactive.

### Trade-off & pitfall
- Virtual threads không giải quyết downstream chậm; vẫn cần timeout + CB.
- Thread-pool bulkhead tiêu thụ worker/queue; semaphore bulkhead không cách ly thread đang block. Chọn theo loại lời gọi và giới hạn queue để tránh tích request.

> Senior tip: đối chiếu active/max threads, request queue, latency và timeout theo route; dump cho biết worker đang chờ ở đâu, metrics cho biết mức độ và thời điểm nghẽn.
`,
  follow: ['Virtual threads vs reactive cho Spring Boot?', 'Resilience4j bulkhead config?'],
  tags: ['tomcat', 'thread-pool', 'blocking', 'bulkhead', 'circuit-breaker']
,
},
{
  id: 'scenario-042',
  topic: 'scenario',
  level: 'senior',
  q: 'Một dịch vụ Spring cần gọi core banking T24/Flexcube nhưng model và trạng thái giao dịch của đối tác khác hẳn domain nội bộ. Bạn thiết kế Anti-Corruption Layer thế nào để tránh rò rỉ legacy model?',
  a: `**Tóm tắt:** Đặt adapter tại ranh giới tích hợp: chuyển request/response và mã lỗi của core banking sang model nghiệp vụ nội bộ, giữ protocol/vendor detail trong một module. ACL không che được semantic khác nhau; cần contract, observability và quy tắc xử lý trạng thái chưa rõ.

### Ranh giới
~~~java
interface FundsGateway {
    TransferResult transfer(TransferCommand command);
}

final class T24FundsAdapter implements FundsGateway {
    private final T24Client client;
    public TransferResult transfer(TransferCommand command) {
        var wire = client.debit(toLegacyRequest(command));
        return mapResult(wire); // status/code vendor không thoát khỏi adapter
    }
}
~~~
Application service chỉ dùng {{TransferCommand}}/{{TransferResult}}. Adapter đảm nhiệm protocol, field mapping, timeout, correlation ID, code mapping và chuyển đổi đơn vị/thời gian. Nếu vendor trả accepted/pending thay vì success/fail, domain model phải giữ trạng thái pending thay vì ép thành boolean.

### Hợp đồng và lỗi
- Lập mapping bảng mã lỗi có owner: lỗi nghiệp vụ, lỗi xác thực, lỗi tạm thời và kết quả chưa xác định.
- Consumer-driven contract test hoặc sandbox test xác nhận wire format, charset, decimal scale, timezone và version.
- Timeout sau khi request gửi đi không chứng minh lệnh thất bại; tra cứu trạng thái theo reference trước khi retry.

### Trade-off & pitfall
| Lựa chọn | Lợi ích | Chi phí |
|---|---|---|
| Adapter mỏng | Ít code | Model vendor dễ rò rỉ |
| ACL rõ domain | Cô lập thay đổi legacy | Mapping cần được duy trì |
| Dùng DTO vendor toàn hệ thống | Nhanh ban đầu | Vendor schema thành domain contract |

Đừng retry mọi lỗi giống nhau; giữ raw response đã redacted để điều tra, nhưng không log credential/PII. Đặt timeout theo latency budget và circuit breaker để bảo vệ thread, vẫn cần reconciliation cho pending.

> Senior tip: ghi metric theo operation, kết quả chuẩn hóa và version adapter; khi core nâng version, canary một luồng trước khi mở toàn bộ traffic.
`,
  follow: ['Bạn biểu diễn trạng thái UNKNOWN/PENDING trong domain ra sao?', 'Làm thế nào version hóa adapter mà không downtime?'],
  tags: ['core banking', 'ACL', 'T24', 'integration', 'domain']
},
{
  id: 'scenario-043',
  topic: 'scenario',
  level: 'senior',
  q: 'Ứng dụng gửi lệnh chuyển tiền tới core banking, client timeout trước khi nhận response. Làm sao phân biệt retry an toàn với nguy cơ ghi nợ hai lần?',
  a: `**Tóm tắt:** Timeout là kết quả chưa biết, không phải thất bại. Gửi idempotency/reference duy nhất xuyên suốt, lưu trạng thái lệnh cục bộ trước khi gọi, sau timeout truy vấn cùng reference hoặc chờ callback/reconciliation; chỉ retry nếu core đảm bảo idempotent theo contract.

### State machine
{{CREATED → SENT → ACCEPTED/REJECTED}}; timeout tạo trạng thái {{UNKNOWN}}, không chuyển thẳng về {{FAILED}}. API client nhận cùng key thì trả kết quả đã lưu hoặc trạng thái đang xử lý. Unique constraint bảo vệ key trong DB; key gắn với hash payload để cùng key nhưng nội dung khác bị từ chối.

~~~java
@Transactional
TransferRecord reserve(String key, String payloadHash) {
    return repository.insertIfAbsent(key, payloadHash, "CREATED");
}
// Gọi partner ngoài transaction; cập nhật SENT/UNKNOWN/FINAL bằng CAS/version.
~~~

### Phục hồi
1. Persist intent/outbox trong transaction nghiệp vụ.
2. Worker gửi với partner reference ổn định; ghi attempt và timestamp.
3. Timeout: query status API hoặc chờ message; không sinh reference mới.
4. Job đối soát tìm lệnh UNKNOWN quá ngưỡng và đưa vào xử lý có audit.

### Trade-off & pitfall
- Idempotency retention phía partner phải dài hơn retry/reconciliation window.
- Không giữ DB transaction mở trong lúc gọi mạng; tránh giữ lock/connection lâu.
- Exactly-once qua hai hệ độc lập không thể đạt chỉ bằng retry; cần dedup và trạng thái bền vững ở cả hai đầu.
- Nếu partner không có query/idempotency, retry tự động có thể tạo duplicate; chuyển sang hàng chờ xử lý thủ công có kiểm soát.

> Senior tip: dashboard phải tách timeout, reject và unknown; theo dõi số UNKNOWN theo tuổi và đảm bảo mọi record cuối cùng có trạng thái terminal hoặc case điều tra.
`,
  follow: ['Nếu partner không hỗ trợ idempotency key, phương án giảm rủi ro là gì?', 'Vì sao không giữ transaction DB mở trong lúc gọi core?'],
  tags: ['idempotency', 'core banking', 'timeout', 'unknown state']
},
{
  id: 'scenario-044',
  topic: 'scenario',
  level: 'mid',
  q: 'Bạn nhận yêu cầu sửa mapping một bản tin ISO 8583 và một API ISO 20022. Dev cần hiểu những khác biệt nào để tránh hiểu nhầm field, amount và trạng thái giao dịch?',
  a: `**Tóm tắt:** ISO 8583 là họ thông điệp giao dịch thẻ/tài chính thường dùng bitmap và data element theo profile; ISO 20022 định nghĩa mô hình thông điệp và schema, thường được triển khai bằng XML, còn JSON thường là biểu diễn riêng của API/đối tác. Không suy semantics chỉ từ tên field hay tiêu chuẩn tổng quát: phải theo profile, version và quy ước của đối tác.

### Điều cần xác minh
- ISO 8583: MTI, bitmap, data element, processing code, STAN/RRN, response code; độ dài/encoding có thể thay theo profile.
- ISO 20022: message definition, business component, identifier và status reason; schema/version và usage guideline xác định field bắt buộc. JSON mapping, nếu có, phải theo hợp đồng API cụ thể chứ không mặc định từ chuẩn.
- Amount: đơn vị minor/major, currency exponent, sign và rounding. Không parse qua floating point.
- Trạng thái: authorization, clearing, settlement, reversal/return là các pha khác nhau; response thành công không luôn đồng nghĩa tiền đã quyết toán cuối cùng.

### Thiết kế mapping
Tạo canonical command/result nội bộ chỉ chứa khái niệm cần cho use case. Adapter giữ raw field có kiểm soát, validate schema/length, map code table và lưu correlation identifiers. Test fixture gồm message chuẩn, optional field vắng mặt, unknown code, duplicate và malformed payload.

### Pitfall production
- Không hardcode offset ISO 8583 nếu message dùng bitmap/variable length; dùng parser theo profile đã chọn.
- Không giả định mọi ISO 20022 bên đối tác dùng cùng schema hoặc transport.
- Giữ version của profile, không log PAN/PII nguyên dạng; log masked identifiers và correlation ID.
- Unknown response code phải được xử lý an toàn và cảnh báo, không map mặc định thành approved.

> Senior tip: trong review tích hợp, yêu cầu sample đã anonymize từ đối tác và xác nhận bằng test vector; tiêu chuẩn không thay thế đặc tả triển khai hai bên.
`,
  follow: ['Một ISO 8583 response approved có nghĩa settlement đã xong không?', 'Bạn xử lý response code mới chưa có mapping thế nào?'],
  tags: ['ISO 8583', 'ISO 20022', 'payments', 'message mapping']
},
{
  id: 'scenario-045',
  topic: 'scenario',
  level: 'lead',
  q: 'Giao dịch được ghi nhận trong DB nhưng không được gửi qua IBM MQ/Kafka sau khi process crash. Bạn thiết kế luồng messaging nào để không mất và xử lý trùng có kiểm soát?',
  a: `**Tóm tắt:** Không dual-write DB và broker trong cùng code path rồi hy vọng cả hai cùng thành công. Ghi business change và outbox event trong cùng DB transaction; publisher gửi lặp có thể xảy ra, consumer deduplicate/idempotent theo event ID. Chọn IBM MQ hoặc Kafka theo semantics, vận hành và hệ sinh thái hiện có.

### Luồng outbox
1. Transaction ghi ledger/business row và outbox row cùng commit.
2. Publisher claim các row chưa gửi, gửi event, rồi đánh dấu published; crash giữa send và mark có thể gửi lại.
3. Consumer ghi inbox/dedup key và cập nhật nghiệp vụ trong cùng transaction.
4. Theo dõi backlog, tuổi event, retry/dead-letter và có replay procedure.

~~~text
DB transaction: debit + credit + outbox(event_id, account_id, sequence)
                    ↓ publisher
              MQ/Kafka → consumer dedup(event_id) → effect
~~~

### MQ và Kafka
| Cân nhắc | IBM MQ | Kafka |
|---|---|---|
| Mô hình phổ biến | Queue, delivery/ack, enterprise integration | Partitioned append log, replay/retention |
| Thứ tự | Theo queue/configuration | Theo partition, key quyết định locality |
| Dùng hợp | Tích hợp core legacy, queue semantics hiện có | Event stream, nhiều consumer/replay |

Không chọn theo khẩu hiệu. Kiểm tra HA, transaction support, ordering, retention, throughput, security và năng lực vận hành của tổ chức.

### Pitfall production
- Broker transaction không tự tạo atomic commit với DB ngoài nó.
- Partition key account giữ thứ tự một account nhưng có thể tạo hot partition.
- Retry vô hạn giữ poison message; DLQ cần owner và thao tác replay an toàn.
- Outbox cleanup chỉ xóa sau retention/audit policy; đừng xóa event chưa được xác nhận.

> Senior tip: đo outbox oldest age và consumer lag; đặt SLO cho thời gian phát tán, kèm đối soát DB với event để phát hiện lỗi publisher lâu ngày.
`,
  follow: ['Crash sau broker publish nhưng trước khi đánh dấu outbox sẽ gây gì?', 'Chọn partition key Kafka theo account có trade-off nào?'],
  tags: ['outbox', 'IBM MQ', 'Kafka', 'messaging', 'idempotency']
},
{
  id: 'scenario-046',
  topic: 'scenario',
  level: 'senior',
  q: 'Job EOD áp biểu phí mới cho hàng triệu tài khoản nhưng bị dừng giữa chừng tại cut-off. Bạn thiết kế checkpoint, khóa nghiệp vụ và chạy lại để không tính hai lần thế nào?',
  a: `**Tóm tắt:** Xác định business date và cut-off rõ, tạo batch run có version/range/checkpoint bền vững, và làm từng item idempotent bằng unique key (account, fee type, business date, rule version). Chạy lại tiếp tục phần chưa hoàn tất hoặc recompute theo quy tắc; không dựa vào việc process chỉ chạy một lần.

### Thiết kế run
- Chốt input snapshot/as-of time và timezone; late-arriving transaction có quy tắc kỳ sau hay adjustment.
- Chia partition theo account range/hash, checkpoint sau chunk commit cùng kết quả và execution context.
- Ghi ledger fee với business key unique; duplicate attempt trả về kết quả đã tạo.
- Lưu trạng thái nghiệp vụ của run (đang chạy, hoàn tất, lỗi); Spring Batch dùng JobExecution status riêng, còn khả năng restart phụ thuộc trạng thái kết thúc, JobRepository và cùng JobParameters. Chỉ cho một run active cùng business date/rule version bằng lock/lease có fencing.

~~~text
run(2026-10-22, fee-rule-v3)
partition 0: accounts 0000–0999 → checkpoint 1000
partition 1: accounts 1000–1999 → retry từ item chưa commit
fee unique key: account_id + fee_type + business_date + rule_version
~~~

### Lock và cut-off
Lock toàn bảng làm nghẽn giao dịch; ưu tiên partition ownership, lease có expiry/fencing và DB constraint làm bảo vệ cuối. Nếu chạy đồng thời với giao dịch online, định nghĩa snapshot semantics hoặc khóa theo account trong thời gian ngắn. Cut-off là chính sách nghiệp vụ, không chỉ là cron time.

### Pitfall production
- Checkpoint tiến trước commit làm mất item; tiến sau commit nhưng không idempotent gây lặp.
- Job restart cùng parameters có thể được xem là cùng instance trong Spring Batch; run ID mới không thay thế idempotency ở dữ liệu đích.
- Thay đổi rule giữa lần chạy phải tạo rule version mới hoặc cố định version cũ.
- Reversal/correction cần entry bù có audit, không sửa âm thầm kết quả đã chốt.

> Senior tip: dashboard EOD theo expected/processed/failed count và tổng amount; chặn bước tiếp theo nếu invariant tổng hoặc số account không khớp.
`,
  follow: ['Điều gì phải commit atomically với checkpoint?', 'Xử lý giao dịch đến muộn sau cut-off theo nguyên tắc nào?'],
  tags: ['EOD', 'Spring Batch', 'cut-off', 'checkpoint', 'idempotency']
},
{
  id: 'scenario-047',
  topic: 'scenario',
  level: 'lead',
  q: 'Một giao dịch lớn cần được lập bởi maker và duyệt bởi checker; cùng lúc operator có quyền DB muốn sửa trạng thái trực tiếp. Bạn thiết kế kiểm soát maker-checker và audit trail thế nào?',
  a: `**Tóm tắt:** Tách quyền tạo và quyền phê duyệt, bắt buộc người duyệt độc lập với maker, lưu quyết định bất biến kèm actor/time/reason/version, và chỉ chuyển trạng thái qua workflow được phân quyền. DB access đặc quyền phải có kiểm soát và audit riêng; ứng dụng không thể tự tuyên bố audit đáng tin nếu admin sửa được cùng bảng.

### Workflow
{{DRAFT → PENDING_APPROVAL → APPROVED/REJECTED → EXECUTED}}. Lưu command snapshot/hash để checker duyệt đúng nội dung; nếu maker sửa amount/beneficiary sau duyệt thì hủy approval và yêu cầu duyệt lại. Enforce separation-of-duty ở server, không chỉ ẩn nút trên UI.

~~~java
if (command.makerId().equals(actor.id())) {
    throw new ForbiddenException("maker cannot approve own change");
}
approvalRepository.insert(command.id(), actor.id(), command.version(), reason);
~~~

### Kiểm soát
- RBAC/ABAC theo vai trò, hạn mức, sản phẩm, đơn vị; quyền tối thiểu và MFA theo policy.
- Audit append-only: actor, action, object ID, before/after hoặc hash, correlation ID, thời gian và nguồn xác thực.
- Ghi audit cùng transaction cho quyết định nghiệp vụ; chuyển bản sao tới hệ thống log bất biến/độc lập theo kiến trúc.
- Break-glass có ticket, thời hạn, người phê duyệt, thu hồi tự động và rà soát hậu kiểm.

### Pitfall production
- Không log secret, OTP, full account/card number; masking phải ở trước sink, không chỉ dashboard.
- Audit ghi sau commit có thể mất nếu process crash; ghi cùng transaction hoặc outbox.
- Đồng hồ máy lệch làm thứ tự mơ hồ; giữ sequence/version và đồng bộ thời gian.
- DBA có quyền sửa audit DB; tách quyền, export sang storage kiểm soát độc lập và cảnh báo tamper.

> Senior tip: kiểm thử cả đường API trực tiếp và batch/admin path; mỗi đường thay đổi trạng thái phải chịu cùng policy, audit và maker-checker rule.
`,
  follow: ['Nếu maker sửa giao dịch sau khi checker duyệt thì sao?', 'Làm sao bảo vệ audit khỏi DBA có quyền trên DB nghiệp vụ?'],
  tags: ['maker-checker', 'authorization', 'audit', 'banking']
},
{
  id: 'scenario-048',
  topic: 'scenario',
  level: 'mid',
  q: 'Log production cần đủ thông tin để tra soát giao dịch nhưng chứa tên, số tài khoản và token. Bạn thiết kế masking và correlation thế nào để vừa điều tra được vừa giảm lộ dữ liệu?',
  a: `**Tóm tắt:** Log chỉ những field tối thiểu cần cho vận hành; loại bỏ credential và dữ liệu nhạy cảm, mask/tokenize định danh trước khi ghi, dùng correlation ID không mang ý nghĩa bí mật để nối các service. Thiết lập quyền truy cập, retention và kiểm tra log như một kho dữ liệu nhạy cảm.

### Thiết kế
- Allowlist field cho event log: event type, status, duration, partner code, correlation ID, account surrogate.
- Không serialize nguyên request/response; annotation masking sau serialization dễ bị bỏ sót ở log khác.
- Với tra soát cần tìm cùng khách hàng, dùng token HMAC có key được quản lý riêng hoặc surrogate ID; không dùng hash thường cho giá trị có không gian đoán nhỏ.
- Tách audit record nghiệp vụ khỏi diagnostic log; mỗi loại có schema, quyền truy cập và retention riêng.

~~~text
Không log: Authorization, OTP, PAN đầy đủ, password, raw payload
Log: trace_id, transaction_ref, account_token, outcome, latency_ms
~~~

### Kiểm soát vòng đời
Mask ở logger/appender boundary và kiểm thử bằng payload canary chứa chuỗi nhạy cảm. Cấu hình access theo role, ghi lại truy cập khi cần, mã hóa khi truyền/lưu và đặt retention theo mục đích/chính sách nội bộ. Có quy trình purge/index cleanup và xử lý sự cố khi phát hiện leak.

### Pitfall production
- MDC/correlation context có thể rò rỉ giữa thread nếu không được truyền/xóa đúng cách trong executor.
- Regex masking không đáng tin với JSON lồng, encoding khác nhau hoặc field mới; schema allowlist an toàn hơn.
- Masking {{123456789}} thành {{******789}} vẫn là dữ liệu có thể nhận diện; áp dụng đúng phân loại.
- Log aggregation, APM trace và exception message đều là đường rò rỉ, không chỉ application log.

> Senior tip: chạy kiểm tra tự động trên log test và truy vấn production để phát hiện pattern cấm; mọi field mới cần owner và lý do vận hành.
`,
  follow: ['Hash thường và HMAC khác nhau thế nào khi token hóa account ID?', 'MDC hoạt động ra sao với async executor?'],
  tags: ['PII', 'masking', 'logging', 'correlation', 'security']
},
{
  id: 'scenario-049',
  topic: 'scenario',
  level: 'senior',
  q: 'Flash sale còn 30 vé nhưng nhiều request cùng lúc: Redis đã trừ stock và Kafka đã nhận lệnh, trong khi DB chỉ xác nhận được 27 đơn. Bạn thiết kế thế nào để không oversell và xử lý 3 vé lệch mà không trả kết quả sai cho khách?',
  a: `**Tóm tắt:** chọn một nguồn quyết định cuối cùng cho việc bán (thường là DB), còn Redis chỉ giúp admission/reject sớm. Nếu giữ quota trước ở Redis, cần reservation có mã duy nhất, trạng thái rõ ràng và quy trình reconcile; không thể coi decrement Redis rồi publish Kafka là giao dịch nguyên tử.

### Luồng đề xuất
- Mỗi yêu cầu mang idempotency key duy nhất theo user, campaign và sản phẩm; DB có unique constraint để chặn lặp.
- Redis Lua có thể atomically kiểm tra quota và cấp reservation token, giảm số request vào DB. Token có TTL, nhưng hết TTL không tự động chứng minh đơn chưa được xác nhận.
- Ghi order intent và outbox trong một DB transaction, publish bằng relay. Consumer thực hiện conditional update {{stock >= quantity}}, lưu kết quả xử lý cùng transaction.
- Khi DB từ chối vì hết hàng, đánh dấu reservation thất bại và hoàn quota Redis đúng một lần bằng state transition/idempotency key; trường hợp timeout thì truy vấn trạng thái order trước khi hoàn.

~~~java
@Transactional
public Result confirm(OrderCommand c) {
    if (!dedup.insertIfAbsent(c.idempotencyKey())) return orders.resultFor(c.idempotencyKey());
    int changed = stock.decreaseIfAvailable(c.sku(), c.quantity());
    if (changed == 0) return Result.soldOut();
    orders.confirm(c);
    outbox.add(new OrderConfirmed(c.orderId()));
    return Result.confirmed(c.orderId());
}
~~~

### Đối soát và phục hồi
Định kỳ so sánh reservation Redis, order DB và lượng stock gốc theo campaign; phát hiện mismatch, đưa vào hàng xử lý có audit thay vì tự cộng/trừ mù. Chấp nhận trạng thái {{PENDING}} ngắn hạn và trả mã tra cứu; chỉ báo thành công sau khi nguồn quyết định commit.

| Lựa chọn | Ưu điểm | Rủi ro |
|---|---|---|
| DB conditional update | Quyết định bền vững, đơn giản | DB là điểm nóng |
| Redis reservation + async DB | Hấp thụ burst tốt | Reconcile, timeout và compensation phức tạp |

### Pitfall production
- Redis failover có thể làm mất write đã xác nhận; replication không biến Redis thành ledger bền vững.
- Consumer retry sau timeout có thể tạo đơn trùng nếu dedup không nằm cùng transaction nghiệp vụ.
- Không hoàn quota theo exception chung: lỗi mạng không chứng minh consumer chưa commit.

> Senior tip: theo dõi gap giữa reserved, confirmed, rejected và expired theo campaign; alert theo số tuyệt đối và tỷ lệ, rồi có thao tác freeze campaign để dừng nhận đơn khi invariant bị phá.
`,
  follow: ['Nếu Redis restart làm quota tăng lại trong khi order DB đã commit thì reconcile ra sao?', 'Khi nào bạn bỏ Redis reservation và chỉ dùng conditional update ở DB?'],
  tags: ['flash-sale', 'inventory', 'Redis', 'Kafka', 'reconciliation'],
},
{
  id: 'scenario-050',
  topic: 'scenario',
  level: 'senior',
  q: 'Một endpoint cấp coupon bị bot gọi hàng nghìn lần/giây; giới hạn theo IP làm chặn nhầm cả văn phòng dùng chung NAT, còn giới hạn theo user lại bỏ lọt tài khoản rác. Bạn thiết kế lớp phòng thủ thế nào?',
  a: `**Tóm tắt:** rate limit cần nhiều chiều và đặt trước tài nguyên đắt: IP/network, account, device/session và campaign; kết hợp quota nghiệp vụ atomic để mỗi user chỉ nhận một coupon. Rate limit giảm abuse nhưng không thay thế authorization, chống Sybil hay giới hạn tồn kho.

### Luồng xử lý
1. Gateway áp giới hạn thô theo IP/subnet để bảo vệ server, với burst nhỏ và response {{429}} kèm {{Retry-After}}.
2. Sau xác thực, áp sliding window/token bucket theo account và device; ngưỡng khác nhau cho user mới, tài khoản uy tín và endpoint nhạy cảm.
3. Trong service, thao tác claim coupon dùng unique constraint (campaign_id, user_id) và conditional decrement quota trong transaction. Redis có thể làm admission nhanh, DB bảo vệ invariant cuối.
4. Tạo rule nâng challenge (captcha/step-up auth) thay vì khóa cứng khi tín hiệu rủi ro vừa phải; block dài cần audit và cơ chế khiếu nại.

~~~java
@PostMapping("/campaigns/{id}/claim")
ResponseEntity<?> claim(@PathVariable long id, Principal user) {
    limiter.check(user.getName(), requestIp()); // ném 429 nếu vượt ngưỡng
    return ResponseEntity.ok(couponService.claimOnce(id, user.getName()));
}
~~~

### Trade-off và đo lường
| Key | Lợi ích | Hạn chế |
|---|---|---|
| IP | Có trước authentication | NAT, proxy, IPv6 rotation |
| Account | Gắn với quota nghiệp vụ | Tạo account hàng loạt |
| Device/risk signal | Bắt pattern phối hợp | False positive, dữ liệu riêng tư |

Đo tỷ lệ claim thành công, 429, challenge pass/fail, latency Redis và tỷ lệ user hợp lệ bị chặn. Giữ bucket key có TTL; khi Redis lỗi, chọn degraded policy rõ ràng (quota DB vẫn bắt buộc, endpoint có thể từ chối có kiểm soát).

### Pitfall production
- Chỉ dùng IP dễ gây outage diện rộng ở mạng carrier/NAT; tin {{X-Forwarded-For}} từ mọi nguồn cho phép giả IP.
- Redis {{INCR}} rồi {{EXPIRE}} riêng biệt có crash window; dùng Lua hoặc cấu trúc có TTL atomic.
- Ngưỡng cứng toàn cục không thích ứng campaign; phát hành limit config có version và rollback.

> Senior tip: thử rule trên traffic shadow trước khi enforce; phân tích false positive theo ASN, account age và conversion để chỉnh ngưỡng thay vì chọn con số đẹp trên giấy.
`,
  follow: ['Bạn tin header client IP thế nào khi có nhiều proxy/CDN?', 'Nếu Redis rate limiter không truy cập được thì endpoint coupon nên fail-open hay fail-closed?'],
  tags: ['rate-limit', 'abuse', 'coupon', 'security'],
},
{
  id: 'scenario-051',
  topic: 'scenario',
  level: 'senior',
  q: 'Một nhóm sản phẩm trong campaign rất nóng và mọi request tranh cùng một Redis key tồn kho. Team định bọc thao tác bằng Redisson lock để “an toàn hơn”. Bạn chọn giữa Lua, distributed lock và phân bucket quota thế nào?',
  a: `**Tóm tắt:** nếu quyết định chỉ là đọc tồn và trừ có điều kiện trong Redis, một Lua script ngắn thường phù hợp vì kiểm tra-cập nhật nguyên tử tại nơi giữ dữ liệu. Distributed lock không tự bảo vệ invariant nếu lease hết hoặc client cũ tiếp tục chạy; bucket quota giảm hot key nhưng cần quản lý tổng quota và hoàn trả.

### So sánh cơ chế
- Lua gom {{GET}}, kiểm tra {{stock >= qty}} và {{DECRBY}} vào một lần thực thi; không có request khác xen giữa trên primary. Giữ script ngắn vì Redis chặn xử lý lệnh khác trong thời gian script chạy.
- Lock hữu ích khi critical section gồm tài nguyên không thể gộp thành một atomic operation. Cần lease, token sở hữu để unlock an toàn, timeout, và fencing/version ở tài nguyên đích nếu công việc có thể sống lâu hơn lease.
- Chia stock thành bucket/queue partition theo SKU giúp giảm contention trên một key nhưng quota bị phân mảnh: bucket A hết trong khi bucket B còn. Có thể rebalance theo batch, với chính sách không bao giờ cấp vượt tổng.

~~~lua
local n = tonumber(redis.call('GET', KEYS[1]) or '-1')
local take = tonumber(ARGV[1])
if n < take then return 0 end
redis.call('DECRBY', KEYS[1], take)
return 1
~~~

Spring Data Redis có {{RedisScript}} và executor quản lý serialization/cache script. Đừng truyền tên key động trong source; truyền qua KEYS/ARGV để dùng lại script và tương thích cluster key-slot.

### Khi nào chọn
| Tình huống | Chọn |
|---|---|
| Một key và phép kiểm tra/cập nhật gọn | Lua / atomic command |
| Nhiều bước không thể biểu diễn trong Redis | Lock có fencing, hoặc đổi thiết kế |
| Hot SKU vượt khả năng một partition | Quota bucket/queue, đo skew |

### Pitfall production
- Lua atomicity không đồng nghĩa durability: failover/asynchronous replication có thể mất acknowledged write theo cấu hình.
- Script chạy lâu làm tăng latency toàn Redis; không quét collection lớn trong Lua.
- Lock timeout ngắn tạo lỗi giả; timeout dài giữ waiter và gây queueing. Đừng lock quanh HTTP/DB chậm.

> Senior tip: benchmark phân phối theo SKU, không chỉ tổng QPS; p99 của một hot key quyết định trải nghiệm flash sale nhiều hơn throughput trung bình.
`,
  follow: ['Lease hết khi JVM bị pause dài; fencing token phải được kiểm tra ở đâu?', 'Redis Cluster yêu cầu các key của script cùng slot thì thiết kế key bucket thế nào?'],
  tags: ['Redis', 'Lua', 'distributed-lock', 'hot-key'],
},
{
  id: 'scenario-052',
  topic: 'scenario',
  level: 'mid',
  q: 'Giỏ hàng lưu thành một JSON String trong Redis. Hai request đồng thời đổi quantity của hai sản phẩm khác nhau; đôi khi một thay đổi bị mất. Bạn sửa cấu trúc và xác định nguồn giá/stock thế nào?',
  a: `**Tóm tắt:** read-modify-write trên cả JSON String tạo lost update vì mỗi request ghi đè snapshot của request kia. Hash theo cart/product cho phép cập nhật field độc lập hơn, nhưng thao tác nhiều field vẫn cần atomic script/transaction; giá và tồn kho lúc checkout phải đọc từ nguồn nghiệp vụ đáng tin cậy, không lấy từ cart.

### Mô hình dữ liệu
- Key cart theo user là Redis Hash, field là product ID, value là quantity hoặc JSON nhỏ có version; dùng {{HINCRBY}} cho tăng/giảm quantity atomically.
- Với yêu cầu đổi quantity tuyệt đối, gửi expected version hoặc dùng Lua đọc version rồi cập nhật để phát hiện xung đột.
- Cart có TTL/ownership rõ ràng; khi user đăng nhập nhiều thiết bị, quyết định merge theo product thay vì ghi đè toàn bộ.
- Cart chỉ là ý định mua. Checkout xác thực product còn bán, giá hiện hành, promotion và stock trong transaction nghiệp vụ.

~~~java
public long addItem(String userId, String sku, long delta) {
    String key = "cart:" + userId;
    Long value = redis.opsForHash().increment(key, sku, delta);
    if (value <= 0) redis.opsForHash().delete(key, sku);
    redis.expire(key, Duration.ofDays(30));
    return Math.max(value, 0);
}
~~~

### String và Hash
| Kiểu | Hợp khi | Chi phí/rủi ro |
|---|---|---|
| JSON String | Đọc/ghi nguyên document, ít cạnh tranh | Serialize toàn bộ, lost update |
| Hash | Update từng SKU, field độc lập | Nhiều field, schema/TTL cần quản lý |

Nếu cần cập nhật quantity và refreshed TTL đồng bộ, dùng Lua thay vì nhiều lệnh có crash window. Spring Data Redis hỗ trợ hash operations; cân nhắc serializer nhất quán giữa app và script.

### Pitfall production
- Trong Redis Cluster, một cart là một key nên luôn nằm trọn trong một slot. Hash tag (phần trong ngoặc nhọn của tên key) chỉ cần khi muốn gom nhiều key của cùng user vào một slot để chạy Lua/MULTI; đừng dùng một tag chung cho mọi user, vì mọi cart sẽ dồn về một node và tạo hotspot.
- Không tin price gửi từ browser hoặc lưu trong cart; client có thể sửa payload.
- Xóa cart khi quantity về 0 phải xử lý race với request thêm cùng lúc.

> Senior tip: test song song hai request trên cùng user và SKU, rồi nhiều thiết bị trên các SKU khác nhau; kiểm tra dữ liệu sau khi Redis reconnect, không chỉ unit test tuần tự.
`,
  follow: ['Khi user sửa cart trên hai thiết bị offline rồi reconnect, bạn merge ra sao?', 'Bạn đặt TTL và xử lý cart của user chưa đăng nhập thế nào?'],
  tags: ['Redis', 'shopping-cart', 'race-condition'],
},
{
  id: 'scenario-053',
  topic: 'scenario',
  level: 'senior',
  q: 'Một request cập nhật MySQL rồi ghi Redis cache; khi có hai instance, cache lúc cũ lúc mới và đôi khi giá trị cũ ghi đè sau invalidation. Bạn thiết kế consistency protocol nào?',
  a: `**Tóm tắt:** không có transaction chung đáng tin cậy giữa MySQL và Redis, nên xác định DB là source of truth và chọn mức stale-data chấp nhận được. Với cache-aside, commit DB rồi invalidate; để xử lý race của loader cũ, dùng version/fencing hoặc cache ngắn hạn, và phát invalidation qua outbox nếu cần lan truyền bền vững.

### Race điển hình
1. Loader A đọc DB version 7 nhưng bị pause.
2. Writer B commit version 8 và xóa cache.
3. A tiếp tục ghi version 7 vào cache sau khi cache đã bị xóa.
Kết quả là cache cũ tồn tại sau update mới. TTL đơn thuần chỉ giới hạn thời gian sai, không ngăn ghi đè.

~~~java
@Transactional
public void changePrice(long id, BigDecimal price) {
    Product p = repository.findByIdForUpdate(id).orElseThrow();
    p.changePrice(price); // tăng version trong entity
    outbox.save(CacheInvalidated.product(id, p.version()));
}
// Consumer KHÔNG xóa hẳn key mà ghi tombstone {version: 8} có TTL ngắn;
// loader chỉ SET nếu version của nó >= version đang nằm trong key.
~~~

Outbox đảm bảo event invalidation không mất giữa DB commit và publish; consumer idempotent. Lưu ý: so sánh version chỉ chặn được race ở trên nếu key **còn giữ version mới nhất**. Nếu invalidation dùng {{DEL}} thì key rỗng, loader A (version 7) không có gì để so và vẫn ghi đè thành công. Vì vậy invalidation ghi một tombstone mang version 8 (TTL vài phút), và Lua của loader chỉ {{SET}} khi incoming version >= version trong key (tombstone hoặc giá trị thật). Khi dùng cache-aside đơn giản, invalidate sau commit và TTL ngắn có thể đủ nếu SLA chấp nhận stale window.

### Trade-off
| Cách | Nhất quán | Độ phức tạp |
|---|---|---|
| TTL | stale tối đa gần TTL | Thấp |
| Commit rồi invalidate | Tốt thường ngày, còn crash/race | Thấp-vừa |
| Outbox + version | Invalidation bền, chống event cũ | Cao hơn |
| Không cache dữ liệu quyết định tiền | Mạnh hơn | Tải DB cao |

### Pitfall production
- Invalidate trước commit có thể để loader đọc giá trị cũ và cache lại.
- Dual write DB+Redis trực tiếp có cửa sổ crash; retry một phần không bảo đảm atomicity.
- Đừng dùng cache làm nguồn tồn kho/giá khi quyết định thanh toán; kiểm tra lại trong transaction.

> Senior tip: gắn version vào metrics/log cache hit để quan sát stale read; đo tỷ lệ và thời lượng lệch trước khi chọn giải pháp phức tạp hơn.
`,
  follow: ['Bạn làm gì nếu outbox consumer bị lag 10 phút?', 'Khi nào stale cache là lỗi nghiệp vụ nghiêm trọng thay vì chỉ lỗi hiển thị?'],
  tags: ['Redis', 'MySQL', 'cache-consistency', 'outbox'],
},
{
  id: 'scenario-054',
  topic: 'scenario',
  level: 'senior',
  q: 'Consumer Kafka xử lý nhiều event cho cùng một order bằng nhiều luồng; trạng thái CREATED đôi khi ghi sau PAID. Bạn giữ thứ tự theo aggregate mà vẫn scale consumer thế nào?',
  a: `**Tóm tắt:** Kafka chỉ bảo đảm thứ tự trong một partition; dùng aggregate ID làm record key để mọi event của order vào cùng partition, rồi bảo đảm consumer không xử lý đồng thời phá thứ tự trong partition. Nếu event có thể đến muộn từ nguồn khác, mang sequence/version và chỉ áp dụng transition hợp lệ ở DB.

### Producer và partition
- Publish với key ổn định như {{orderId}}; không dùng random key hoặc key thay đổi giữa các event.
- Chọn số partition theo throughput song song và chấp nhận rằng tăng partition có thể đổi mapping key-partition, cần đánh giá quá trình mở rộng.
- Nếu nhiều producer phát cùng aggregate, cần sequencing/outbox theo aggregate; Kafka không tự sắp thứ tự giữa producer theo ý nghĩa nghiệp vụ.

### Consumer và DB
~~~java
@KafkaListener(topics = "order-events")
public void handle(OrderEvent e) {
    tx.executeWithoutResult(status -> {
        int updated = orders.applyIfNextVersion(e.orderId(), e.version(), e.type());
        if (updated == 0) throw new RetryableOutOfOrderEvent();
        inbox.markProcessed(e.eventId());
    });
}
~~~
Inbox unique theo eventId chặn duplicate trong cùng transaction. Version guard giúp từ chối event trùng/lệch thứ tự ngay cả khi replay hoặc có đường ghi ngoài Kafka. Retry phải không làm partition bị kẹt vô hạn; lỗi poison message cần DLQ/quarantine và công cụ replay có kiểm soát.

| Thiết kế | Ưu điểm | Hạn chế |
|---|---|---|
| Một luồng mỗi partition | Dễ giữ thứ tự | Ít parallelism trên partition |
| Parallel theo key trong partition | Tăng throughput | Phải serialize cùng key |
| Version tại DB | Phòng thủ cuối | Cần xử lý gap/retry |

### Pitfall production
- Retry topic riêng có thể đảo thứ tự: event sau chạy trước event đang retry.
- Commit offset trước DB commit có thể mất event; commit sau DB có thể giao trùng, vì vậy handler phải idempotent.
- Đặt {{concurrency}} của listener lớn hơn số partition chỉ tạo consumer ngồi rảnh, không tăng throughput. Còn nếu tự đẩy record sang thread pool để xử lý async, thứ tự cùng key bị phá ngay, trừ khi bạn serialize theo key (mỗi key một hàng đợi) và chỉ commit offset khi mọi record trước đó đã xong.

> Senior tip: log aggregate ID, event ID, partition/offset và version; khi điều tra lệch trạng thái có thể dựng lại chính xác chuỗi đã apply.
`,
  follow: ['Bạn xử lý version gap khi event version 12 tới trước version 11 thế nào?', 'Khi cần tăng số partition, làm sao hạn chế đổi thứ tự của một aggregate đang chạy?'],
  tags: ['Kafka', 'ordering', 'partition', 'consumer'],
},
{
  id: 'scenario-055',
  topic: 'scenario',
  level: 'mid',
  q: 'API upload 1 GB hiện giữ toàn bộ multipart file trong heap, khiến pod OOM; người dùng phải gửi lại từ đầu khi mạng đứt. Bạn thiết kế upload resumable và an toàn thế nào?',
  a: `**Tóm tắt:** không gom file lớn vào heap của ứng dụng. Dùng upload theo part có session ID, giới hạn kích thước/concurrency, lưu part vào object storage (hoặc disk tạm có quota), cho client retry từng part, rồi finalize sau khi kiểm tra đủ part và checksum.

### Giao thức
1. {{POST /uploads}} tạo upload session gắn với user, object key, kích thước dự kiến, checksum và hạn dùng.
2. Server trả presigned multipart URLs hoặc endpoint nhận part; mỗi part có index, checksum và idempotent identity.
3. Client upload đồng thời có giới hạn, hỏi server phần nào đã nhận để resume sau timeout.
4. Finalize xác thực session ownership, part manifest, tổng kích thước/checksum; chuyển object sang trạng thái READY rồi phát event xử lý nền.
5. Job cleanup abort session dang dở và xóa temp data quá hạn.

~~~java
public UploadPartResult acceptPart(UploadId id, int partNo, InputStream in) {
    UploadSession s = sessions.requireOwned(id, currentUser());
    validatePartNumber(partNo, s.expectedParts());
    return objectStore.putPart(s.storageKey(), partNo, in, MAX_PART_BYTES);
}
~~~

Ưu tiên upload trực tiếp từ client đến S3 multipart để giảm băng thông và memory của app; backend cấp quyền ngắn hạn theo đúng object/session. Nếu phải proxy qua Spring, stream qua {{InputStream}} và enforce backpressure, không gọi {{MultipartFile.getBytes()}}.

### Trade-off và bảo vệ
| Luồng | Ưu điểm | Hạn chế |
|---|---|---|
| Proxy qua backend | Kiểm soát tập trung | App chịu network/CPU |
| Presigned multipart | Scale tốt, resume tự nhiên | Cần policy IAM và finalize chặt |

Giới hạn tổng dung lượng/user, số session đồng thời, loại file theo nội dung chứ không tin extension; scan malware trước khi publish/download. Dùng checksum để phát hiện part sai và mã hóa storage theo policy.

### Pitfall production
- Presigned URL bị lộ vẫn có thể dùng đến hết hạn; TTL ngắn và key không đoán được.
- Gọi finalize hai lần phải idempotent; đừng tạo hai processing job.
- Multipart upload chưa hoàn tất vẫn tốn storage; bắt buộc lifecycle cleanup.

> Senior tip: dashboard theo dõi số session orphan, bytes dang dở, retry rate và checksum failure; đây thường là nguồn tăng storage âm thầm sau khi feature chạy lâu.
`,
  follow: ['Làm sao ngăn user finalize một upload session của user khác?', 'Bạn kiểm tra checksum toàn file khi dùng multipart object storage ra sao?'],
  tags: ['upload', 'streaming', 'S3', 'resumable'],
},
{
  id: 'scenario-056',
  topic: 'scenario',
  level: 'lead',
  q: 'Một dịch vụ cấp coupon chạy ở nhiều region trong đợt mở bán toàn cầu. Mỗi region có Redis cache quota; khi mạng liên vùng bị chia cắt, làm sao đảm bảo tổng coupon phát ra không vượt số lượng?',
  a: `**Tóm tắt:** không thể để nhiều region cùng cấp phát từ bản sao quota eventual-consistent rồi vẫn hứa không vượt tổng khi mất liên lạc. Cần chọn invariant và availability: phân bổ trước quota độc quyền theo region (escrow), hoặc route quyết định về một authority/quorum; khi hết quota cục bộ thì từ chối/chờ thay vì mượn quota chưa được cấp.

### Phân bổ quota kiểu escrow
- Tổng 10.000 coupon được chia thành quota không chồng lấn, ví dụ region A 4.000, B 3.000, C 3.000. Mỗi region chỉ cấp trong quota được cấp.
- Lưu allocation có version và ledger chuyển quota. Transfer chỉ có hiệu lực sau khi authority xác nhận; không dùng timeout để tự thu hồi quota nếu region cũ có thể vẫn hoạt động.
- Khi region mất kết nối, region còn lại giữ quota của mình và có thể trả “tạm hết”; đây là lựa chọn availability có chủ đích để bảo toàn invariant.
- Reconciliation sau phục hồi đối chiếu coupon claims với allocation ledger; không sửa trực tiếp số đã cấp.

| Mô hình | Không oversell khi partition | Availability |
|---|---|---|
| Local quota escrow | Có, nếu không vượt quota | Region hết quota có thể từ chối |
| Một authority | Có nếu authority nhất quán | Partition tới authority làm từ chối |
| Replicate quota eventual | Không bảo đảm | Cao nhưng có thể oversell |

### Spring/Redis implementation boundary
Redis Lua atomicity chỉ bảo đảm trong phạm vi một Redis primary, không tạo atomicity xuyên region. Region quota phải được cấp từ durable control plane, ghi version/epoch, và token claim cần unique business key. Nếu coupon có giá trị tiền, DB transaction vẫn enforce uniqueness và redemption rules.

### Pitfall production
- Failover/restore từ snapshot cũ có thể làm region tin rằng còn quota đã dùng; fencing epoch giúp từ chối epoch cũ ở authority.
- “TTL quota lease” nguy hiểm nếu region bị pause dài rồi hoạt động lại sau khi quota đã tái cấp nơi khác.
- Đồng bộ đồng hồ không đủ để chứng minh lease cũ đã dừng; dùng epoch/coordination có fencing.

> Senior tip: viết invariant số coupon phát hành ≤ campaign cap thành reconciliation query và alert độc lập với dashboard ứng dụng; chuẩn bị nút đóng campaign toàn cục trước ngày mở bán.
`,
  follow: ['Bạn thiết kế giao thức chuyển quota giữa region sao cho retry không cấp hai lần?', 'Nếu business chấp nhận oversell tối đa 0,1% thì bạn lượng hóa và giám sát điều khoản đó thế nào?'],
  tags: ['multi-region', 'quota', 'consistency', 'coupon'],
},
{
  id: 'scenario-057',
  topic: 'scenario',
  level: 'mid',
  q: 'Sáng thứ Hai, kế toán báo có 37 đơn hàng ở trạng thái PAID nhưng không có dòng trừ tồn kho tương ứng, dù code đã gắn {{@Transactional}}. Log có {{InsufficientStockException}} đúng lúc tạo các đơn đó. Bạn điều tra và sửa thế nào?',
  a: `**Tóm tắt:** {{@Transactional}} chỉ hoạt động khi lời gọi **đi qua proxy** của Spring, và mặc định chỉ rollback với **unchecked exception** (RuntimeException, Error). Ba thủ phạm hay gặp nhất: exception là checked, method được gọi nội bộ bằng {{this.xxx()}} (self-invocation), hoặc method là {{private}}. Xác minh bằng log TRACE của transaction interceptor, sửa bằng {{rollbackFor}}, tách bean hoặc {{TransactionTemplate}}, và thêm test tích hợp kiểm tra rollback.

### Hiểu nhanh
Hãy tưởng tượng {{@Transactional}} là **anh bảo vệ đứng ở cửa** phòng làm việc. Ai đi **qua cửa** (gọi từ bean khác) thì anh mở sổ giao dịch, đợi bạn làm xong rồi chốt (commit) hoặc huỷ (rollback). Nhưng nếu bạn đã ở **trong phòng** và gọi chính đồng nghiệp ngồi cạnh ({{this.method()}}), anh bảo vệ không hề biết. Thêm nữa, anh chỉ được dặn "huỷ khi có **sự cố bất ngờ** (RuntimeException)"; còn sự cố "đã khai báo trước" (checked exception như {{IOException}}) thì anh vẫn chốt sổ như bình thường.

### Thuật ngữ
- **Proxy**: một object bọc ngoài bean thật, chặn lời gọi để mở/đóng transaction. Spring Boot mặc định dùng CGLIB (lớp con sinh ra lúc chạy).
- **Self-invocation**: method trong một bean gọi method khác **của chính bean đó**, đi thẳng qua {{this}}, không đi qua proxy.
- **Checked exception**: exception kế thừa {{Exception}} nhưng không kế thừa {{RuntimeException}}, bắt buộc khai báo {{throws}}.
- **Rollback-only**: cờ đánh dấu transaction phải rollback khi kết thúc, dù code bên ngoài đã catch exception.

### Triệu chứng và số liệu
- 37/12.000 đơn trong 3 ngày có {{status = PAID}} nhưng bảng {{stock_movement}} không có dòng tương ứng.
- Log cùng thời điểm: {{InsufficientStockException: sku=SKU-889 remain=0}}. Class này {{extends Exception}} (checked).
- Code (rút gọn):

~~~java
@Service
public class OrderService {
    public void checkout(Long orderId) throws InsufficientStockException {
        placeOrder(orderId);               // self-invocation: KHÔNG đi qua proxy
    }

    @Transactional                         // vô tác dụng khi gọi từ checkout()
    public void placeOrder(Long orderId) throws InsufficientStockException {
        Order o = orderRepo.findById(orderId).orElseThrow();
        o.setStatus(OrderStatus.PAID);
        orderRepo.save(o);                 // save() có tx riêng => commit ngay
        stockService.decrease(orderId);    // ném checked exception khi hết hàng
    }
}
~~~

### Giả thuyết (xếp theo khả năng)
1. Exception là checked nên kể cả khi có transaction, Spring vẫn **commit**.
2. {{checkout()}} gọi {{placeOrder()}} qua {{this}} nên không có transaction nào cả; mỗi câu lệnh repository tự chạy transaction riêng của nó (Spring Data repository có {{@Transactional}} trên từng method) và commit ngay.
3. Method {{private}} hoặc {{final}}: CGLIB không override được nên annotation bị bỏ qua (Spring 6 hỗ trợ cả method protected/package-private với class-based proxy, nhưng **private thì không bao giờ**).
4. Code catch exception rồi chỉ ghi log mà không ném lại, nên interceptor không thấy lỗi và commit.

### Xác minh từng bước
1. Bật log tạm thời trên một pod: {{logging.level.org.springframework.transaction.interceptor=TRACE}}. Khi đi qua proxy sẽ thấy dòng "Getting transaction for [...OrderService.placeOrder]". Nếu **không thấy**, đó là self-invocation.
2. Thêm log tạm {{TransactionSynchronizationManager.isActualTransactionActive()}} ở đầu method để chắc chắn.
3. Kiểm tra cây kế thừa của exception: {{extends Exception}} là checked.
4. Viết test tích hợp tái hiện: giả lập hết hàng, assert đơn **không** chuyển sang PAID.

### Cơ chế bên trong (vì sao lại như vậy)
~~~text
Controller ──► [Proxy OrderService] ──► OrderService thật
                  │ mở tx                  │ checkout()
                  │                        └─► this.placeOrder()  (không qua proxy)
                  └ commit/rollback
~~~
1. Khi khởi động, Spring tạo proxy cho bean có {{@Transactional}}. Bean khác được inject **proxy**, không phải object thật.
2. Proxy chỉ chặn được lời gọi **từ bên ngoài** vào. Bên trong object thật, {{this}} là object thật nên annotation không được đọc.
3. Khi method ném exception, {{TransactionInterceptor}} hỏi rule: mặc định {{rollbackOn(ex)}} chỉ trả true với {{RuntimeException}} và {{Error}}. Lý do lịch sử (kế thừa từ EJB): checked exception được coi là "kết quả nghiệp vụ dự kiến", không phải lỗi hệ thống.

### Sửa ngắn hạn và dài hạn
| Cách | Khi nào dùng | Lưu ý |
|---|---|---|
| {{@Transactional(rollbackFor = Exception.class)}} | exception checked là lỗi thật | phải nhớ ở mọi chỗ, dễ quên |
| Đổi exception thành RuntimeException | exception nghiệp vụ tự định nghĩa | cách gọn nhất, phổ biến ở Spring |
| Đặt {{@Transactional}} lên {{checkout()}} hoặc tách {{placeOrder}} sang bean khác | self-invocation | thiết kế rõ ràng nhất |
| {{TransactionTemplate}} | cần ranh giới transaction nằm giữa method | lập trình, không phụ thuộc proxy |

Ngắn hạn: hotfix chuyển {{InsufficientStockException}} thành unchecked và đặt annotation ở method public được gọi từ ngoài; viết script đối soát đưa 37 đơn về trạng thái đúng (hoàn tiền hoặc đặt lại hàng) có duyệt nghiệp vụ. Dài hạn: chuẩn hoá "transaction boundary ở tầng application service, gọi từ controller".

### Phòng ngừa
- Test tích hợp ({{@SpringBootTest}} + Testcontainers) cho **nhánh lỗi**: ném exception giữa chừng, assert DB không đổi.
- Rule ArchUnit/Sonar: cấm {{@Transactional}} trên method private, cảnh báo self-invocation.
- Job đối soát hằng đêm: đơn PAID phải có stock_movement; lệch thì alert.

### Lỗi hay gặp
1. **Tin rằng {{@Transactional}} rollback mọi exception.** Triệu chứng: dữ liệu nửa vời khi lỗi checked. Cách tránh: dùng unchecked hoặc {{rollbackFor}}.
2. **Self-inject bằng {{@Lazy}} để "lách" self-invocation.** Chạy được nhưng che giấu thiết kế sai; nên tách bean.
3. **Catch exception ở method trong rồi để method ngoài commit.** Nếu method trong (REQUIRED) đã đánh dấu rollback-only, method ngoài sẽ nhận {{UnexpectedRollbackException}} lúc commit, gây khó hiểu.

### Trả lời miệng 1 phút
"Tôi nghi ngay ba nguyên nhân kinh điển: exception là checked nên Spring mặc định vẫn commit; method được gọi nội bộ qua this nên không đi qua proxy; hoặc method private. Tôi bật log TRACE của TransactionInterceptor để xem transaction có được mở không, kiểm tra cây kế thừa của exception, rồi viết test tích hợp tái hiện. Ở case này cả hai lỗi cùng xảy ra. Tôi sửa bằng cách đổi exception sang unchecked, đặt ranh giới transaction ở method public được gọi từ controller, chạy script đối soát 37 đơn, và thêm test nhánh lỗi cùng job đối soát để phòng tái diễn."

> Senior tip: khi review code, cứ thấy {{@Transactional}} là hỏi hai câu: "ai gọi method này, có qua proxy không?" và "exception nào làm nó rollback?". Ở một dự án thanh toán, chỉ riêng việc thêm test "ném lỗi giữa chừng rồi assert DB" vào mỗi use case ghi dữ liệu đã bắt được 4 lỗi rollback trước khi lên production.`,
  follow: [
    'Nếu method bên trong dùng {{REQUIRES_NEW}} còn method ngoài ném lỗi, dữ liệu nào được giữ lại?',
    'Vì sao gặp {{UnexpectedRollbackException}} khi method ngoài đã catch exception của method trong?',
    'Khi nào bạn chọn {{TransactionTemplate}} thay vì annotation?'
  ],
  tags: ['Spring', '@Transactional', 'rollback', 'self-invocation', 'proxy', 'checked exception'],
  refs: [
    { type: 'doc', title: 'Spring Framework: Using @Transactional', url: 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/annotations.html' },
    { type: 'doc', title: 'Spring Framework: Rolling Back a Declarative Transaction', url: 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative/rolling-back.html' }
  ]
},
{
  id: 'scenario-058',
  topic: 'scenario',
  level: 'senior',
  q: 'Sau khi chuyển việc ghi audit log và gửi email sang {{@Async}}, bảng audit ghi người thao tác là {{anonymousUser}} hoặc NULL, và log của các tác vụ async mất {{traceId}} nên không lần được theo request. Bạn chẩn đoán và sửa thế nào?',
  a: `**Tóm tắt:** {{SecurityContextHolder}} (mặc định) và {{MDC}} đều lưu dữ liệu trong **ThreadLocal**, tức là gắn với một thread. {{@Async}} chạy code trên thread khác của pool, nên không thấy user và traceId của thread gốc. Sửa bằng cách **chụp context ở thread gọi và khôi phục ở thread worker** qua {{TaskDecorator}} (hoặc {{DelegatingSecurityContextAsyncTaskExecutor}}), luôn dọn context trong {{finally}}; tốt hơn nữa là truyền userId tường minh vào tham số.

### Hiểu nhanh
ThreadLocal giống **túi áo của từng nhân viên**. Request vào, nhân viên A (thread HTTP) bỏ thẻ tên user và mã theo dõi vào túi mình. Khi A giao việc cho nhân viên B (thread của pool async), A chỉ đưa tờ giấy việc cần làm, không đưa túi áo. B mở túi mình ra thì trống, hoặc tệ hơn là còn **thẻ của khách trước** nếu chưa ai dọn.

### Thuật ngữ
- **ThreadLocal**: biến mà mỗi thread có một bản riêng.
- **SecurityContext**: nơi Spring Security giữ {{Authentication}} của user hiện tại.
- **MDC (Mapped Diagnostic Context)**: map key/value của SLF4J/Logback, được in vào mọi dòng log của thread đó (ví dụ traceId).
- **TaskDecorator**: hook của Spring để bọc mỗi {{Runnable}} trước khi đưa vào thread pool.

### Triệu chứng
- 100% bản ghi audit tạo từ luồng async có {{actor = 'anonymousUser'}} hoặc NULL, bản ghi từ luồng đồng bộ thì đúng.
- Log async không có traceId, nên trên Kibana/Loki không nối được với request gốc.
- Hiếm hơn nhưng nguy hiểm: vài bản ghi mang **user của request khác**. Đây là dấu hiệu context bị rò do không dọn.

### Giả thuyết và xác minh
1. **Context không được truyền sang thread mới.** Xác minh: log {{Thread.currentThread().getName()}} cùng {{SecurityContextHolder.getContext().getAuthentication()}} ở cả hai nơi; thread HTTP là {{http-nio-8080-exec-7}}, thread async là {{task-3}} và authentication null.
2. **Ai đó đã đổi strategy sang {{MODE_INHERITABLETHREADLOCAL}}.** Cách này chỉ copy khi **tạo** thread con; pool tái sử dụng thread nên thread cũ giữ context của request đầu tiên đã tạo nó. Đây chính là nguồn gốc của "user lạ" trong audit. Xác minh: grep {{setStrategyName}} và tham số JVM {{spring.security.strategy}}.
3. **Decorator có copy nhưng không clear.** Xác minh: code review khối {{finally}}.

### Cơ chế từng bước
~~~text
http-nio-exec-7: [SecCtx=alice, MDC.traceId=abc]
   │  auditService.record(...)   (@Async)
   ▼
 proxy ─► executor.submit(task) ─► task-3: [SecCtx=?, MDC=?]
                                       └─ nếu không decorate: rỗng
~~~
1. Proxy của {{@Async}} chặn lời gọi và nộp task vào {{ThreadPoolTaskExecutor}} (bean {{applicationTaskExecutor}} mà Spring Boot tự cấu hình).
2. Thread của pool đã tồn tại sẵn, nó **không kế thừa gì** từ thread gọi.
3. Vì vậy mọi thứ dựa trên ThreadLocal (SecurityContext, MDC, LocaleContext, transaction hiện tại) đều không có.

### Sửa: TaskDecorator chụp và khôi phục
~~~java
public class ContextCopyingDecorator implements TaskDecorator {
    @Override
    public Runnable decorate(Runnable task) {
        // Chạy trên thread GỌI: chụp context tại đây
        Map<String, String> mdc = MDC.getCopyOfContextMap();
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return () -> {                          // chạy trên thread WORKER
            SecurityContext ctx = SecurityContextHolder.createEmptyContext();
            ctx.setAuthentication(auth);
            SecurityContextHolder.setContext(ctx);
            if (mdc != null) MDC.setContextMap(mdc);
            try {
                task.run();
            } finally {
                SecurityContextHolder.clearContext(); // bắt buộc: thread sẽ được tái dùng
                MDC.clear();
            }
        };
    }
}
~~~
Khai báo decorator là một bean; Spring Boot gắn bean {{TaskDecorator}} vào executor tự cấu hình. Nếu bạn tự tạo {{ThreadPoolTaskExecutor}} thì gọi {{setTaskDecorator(...)}} thủ công. Với tracing của Micrometer (Boot 3), Spring Framework 6.1 có sẵn {{ContextPropagatingTaskDecorator}} dựa trên thư viện context-propagation để truyền observation/traceId.

### So sánh cách sửa
| Cách | Ưu điểm | Nhược điểm |
|---|---|---|
| TaskDecorator tự viết | kiểm soát được, gom cả MDC + security | tự lo dọn dẹp |
| {{DelegatingSecurityContextAsyncTaskExecutor}} | có sẵn trong Spring Security | chỉ lo SecurityContext, không lo MDC |
| Truyền {{actorId}} vào tham số | tường minh, test dễ, không phụ thuộc thread | phải sửa chữ ký method |
| {{MODE_INHERITABLETHREADLOCAL}} | một dòng cấu hình | **sai với thread pool**, rò context |

Với audit log, tôi khuyên **truyền actor tường minh**: dữ liệu kiểm toán không nên phụ thuộc vào "ma thuật" ThreadLocal.

### Phòng ngừa
- Test: gọi method async trong context có user giả ({{@WithMockUser}}), assert bản ghi audit đúng actor; chạy 2 lần liên tiếp với 2 user khác nhau để bắt rò context.
- Pattern log bắt buộc có traceId; alert khi tỉ lệ dòng log thiếu traceId tăng.
- Áp dụng tương tự cho {{CompletableFuture.supplyAsync(...)}}: mặc định nó chạy trên {{ForkJoinPool.commonPool()}}, không đi qua decorator của Spring.

### Lỗi hay gặp
1. **Copy context nhưng không clear trong finally**: thread tái sử dụng mang user cũ, audit ghi sai người, đây là lỗi bảo mật.
2. **Chụp context bên trong lambda** (tức đã ở thread worker) thay vì trước lambda: chụp được context rỗng.
3. **Quên {{CompletableFuture}} và {{parallelStream}}**: chúng không dùng executor của Spring.

### Trả lời miệng 1 phút
"SecurityContext và MDC đều nằm trong ThreadLocal, còn @Async chạy trên thread khác của pool nên mất user và traceId. Tôi xác minh bằng cách log tên thread và authentication ở hai phía. Cách sửa là một TaskDecorator chụp context ở thread gọi, khôi phục ở thread worker và luôn clear trong finally, vì pool tái sử dụng thread. Tôi tránh MODE_INHERITABLETHREADLOCAL vì nó chỉ copy lúc tạo thread nên rò context giữa các request. Riêng audit log, tôi truyền actorId tường minh vào tham số để không phụ thuộc ThreadLocal."

> Senior tip: hãy coi "context rò sang request khác" là **sự cố bảo mật**, không chỉ là bug log. Ở một hệ thống tôi từng làm, audit ghi nhầm người duyệt khoản vay vì InheritableThreadLocal + thread pool; sau đó team cấm cấu hình này bằng rule review và thêm test hai user liên tiếp cho mọi luồng async.`,
  follow: [
    'Virtual thread trong Java 21 có giải quyết được việc mất context không?',
    'Làm sao truyền traceId qua Kafka từ producer sang consumer?',
    'Vì sao {{CompletableFuture.supplyAsync}} không dùng decorator của Spring?'
  ],
  tags: ['Spring', '@Async', 'SecurityContext', 'MDC', 'ThreadLocal', 'TaskDecorator'],
  refs: [
    { type: 'doc', title: 'Spring Security: Concurrency Support', url: 'https://docs.spring.io/spring-security/reference/servlet/integrations/concurrency.html' },
    { type: 'doc', title: 'Spring Boot: Task Execution and Scheduling', url: 'https://docs.spring.io/spring-boot/reference/features/task-execution-and-scheduling.html' }
  ]
},
{
  id: 'scenario-059',
  topic: 'scenario',
  level: 'senior',
  q: 'API {{GET /orders?size=50}} chạy 40ms ở môi trường dev nhưng 900ms ở production, và lúc cao điểm HikariCP báo hết connection. Service không có {{@Transactional}} nào trên luồng đọc, và log khởi động có cảnh báo {{spring.jpa.open-in-view is enabled by default}}. Bạn xử lý thế nào?',
  a: `**Tóm tắt:** Spring Boot bật **Open Session In View (OSIV)** mặc định: EntityManager mở suốt request, nên khi Jackson serialize entity và chạm vào quan hệ lazy, Hibernate âm thầm bắn thêm query, tạo **N+1 ẩn** ngoài tầng service. Xác minh bằng Hibernate statistics/log SQL đếm query mỗi request; sửa bằng {{spring.jpa.open-in-view=false}}, tải dữ liệu cần thiết bằng fetch join/{{@EntityGraph}}/DTO projection trong service có {{@Transactional(readOnly = true)}}, và không trả entity ra controller.

### Hiểu nhanh
OSIV giống việc **thư viện cho bạn mượn chìa khoá kho sách đến khi bạn về nhà**. Tiện: lúc nào cần sách là chạy vào lấy. Nhưng nếu bạn cần 50 cuốn và mỗi lần chỉ lấy một cuốn, bạn chạy vào kho 50 lần. Dev chỉ có 3 đơn hàng nên không ai thấy; production có 50 đơn mỗi trang, mỗi đơn kéo thêm khách hàng và danh sách món hàng.

### Thuật ngữ
- **Lazy loading**: quan hệ (ví dụ {{order.getItems()}}) chỉ được query khi code chạm vào lần đầu.
- **N+1**: 1 query lấy danh sách + N query lấy quan hệ cho từng phần tử.
- **OSIV**: {{OpenEntityManagerInViewInterceptor}} giữ EntityManager mở từ đầu đến cuối request web.
- **DTO projection**: query trả thẳng object chỉ chứa các cột cần, không phải entity được quản lý.

### Triệu chứng và số liệu
- Dev: 3 đơn, 7 query. Production: 50 đơn, **101 query** (1 orders + 50 customer + 50 items), p95 900ms.
- Hikari: {{hikaricp_connections_pending}} > 0 lúc cao điểm, lỗi "Connection is not available, request timed out after 30000ms".
- Code service trả {{List<Order>}} entity, controller trả thẳng entity cho Jackson.

### Giả thuyết và cách xác minh
1. **N+1 do lazy load khi serialize.** Bật {{spring.jpa.properties.hibernate.generate_statistics=true}} và {{logging.level.org.hibernate.SQL=DEBUG}} trên staging, gọi API một lần, đếm dòng select. Thấy cùng một câu {{select ... from customer where id=?}} lặp 50 lần là xác nhận.
2. **Query xảy ra ngoài service.** Đặt breakpoint/stack trace ở câu SQL: frame nằm trong {{com.fasterxml.jackson...BeanSerializer}}, tức là lúc render response.
3. **Thiếu index** (loại trừ): {{EXPLAIN}} từng câu đều dùng index và chạy dưới 1ms; vấn đề là **số lượng** chứ không phải từng câu chậm.

### Cơ chế từng bước
~~~text
Request ─► OSIV mở EntityManager
  └─► Controller ─► Service: orderRepo.findPage()   (1 query)
  └─► Jackson serialize Order[0..49]
        order.getCustomer().getName()  -> select customer (x50)
        order.getItems()               -> select items    (x50)
Response xong ─► OSIV đóng EntityManager
~~~
1. Vì EntityManager còn mở, proxy lazy không ném {{LazyInitializationException}} mà âm thầm query, nên bug **không lộ ra lúc dev**.
2. Các query lazy này chạy **ngoài transaction của service**, ở chế độ auto-commit, mỗi lần chạm lazy là một round-trip tới DB.
3. Thời gian request dùng tài nguyên DB kéo dài suốt phần serialize, nên lúc cao điểm pool connection cạn nhanh hơn dự kiến.

### Sửa
~~~java
public interface OrderRepository extends JpaRepository<Order, Long> {
    // Lấy kèm customer trong cùng 1 query, tránh N+1 cho quan hệ ToOne
    @EntityGraph(attributePaths = "customer")
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
}

@Service
@Transactional(readOnly = true)           // ranh giới đọc rõ ràng
public class OrderQueryService {
    public Page<OrderDto> list(OrderStatus s, Pageable p) {
        Page<Order> page = repo.findByStatus(s, p);
        // items: tải theo lô bằng @BatchSize hoặc query IN riêng, rồi map sang DTO
        return page.map(OrderDto::from);   // map XONG trong transaction
    }
}
~~~
- Đặt {{spring.jpa.open-in-view=false}}. Lúc này mọi chỗ lazy ngoài transaction sẽ ném {{LazyInitializationException}}; đó là điều tốt, bug hiện ra ở test thay vì ở production.
- Collection (OneToMany) + phân trang: **không** fetch join collection kèm {{Pageable}} (Hibernate phải phân trang trong bộ nhớ và cảnh báo). Dùng {{@BatchSize}}/{{hibernate.default_batch_fetch_size}} hoặc query thứ hai với {{WHERE order_id IN (...)}}.

| Cách tải | Hợp với | Hạn chế |
|---|---|---|
| {{@EntityGraph}}/fetch join | ToOne, danh sách nhỏ | collection + paging thì nguy hiểm |
| Batch fetch size | collection | vẫn vài query, không phải 1 |
| DTO projection | API chỉ đọc | không dùng được để update |

### Phòng ngừa
- Test đếm query (Hibernate {{Statistics}} hoặc datasource-proxy): assert API list ≤ 3 query, chạy với 50 bản ghi chứ không phải 3.
- Không trả entity ra controller; luôn trả DTO.
- Dashboard số query/request; alert khi tăng đột biến sau deploy.

### Lỗi hay gặp
1. **Tắt OSIV rồi "chữa cháy" bằng {{FetchType.EAGER}}**: N+1 chuyển sang mọi nơi load entity đó, tệ hơn.
2. **Chỉ test với dữ liệu nhỏ**: 3 đơn thì N+1 vô hình.
3. **Tắt OSIV mà không có test**: cả loạt endpoint ném LazyInitializationException sau deploy. Hãy tắt trên staging, chạy regression trước.

### Trả lời miệng 1 phút
"Cảnh báo open-in-view là manh mối chính. OSIV giữ EntityManager mở suốt request nên khi Jackson serialize entity, mỗi quan hệ lazy bắn thêm query, thành N+1 ẩn ngoài service. Tôi bật Hibernate statistics để đếm query: 101 query cho 50 đơn. Cách sửa: tắt open-in-view, tải dữ liệu cần trong service read-only bằng EntityGraph cho quan hệ ToOne, batch fetch cho collection, map sang DTO trước khi rời transaction. Cuối cùng thêm test đếm số query với dữ liệu đủ lớn để chặn tái phát."

> Senior tip: ở dự án mới, tôi đặt {{spring.jpa.open-in-view=false}} ngay từ commit đầu tiên. Ở dự án cũ, tắt OSIV là thay đổi lớn: tôi bật nó theo từng nhóm endpoint sau khi đã có test đếm query, và thường thấy p95 các API danh sách giảm 3 đến 10 lần, connection pool bớt căng rõ rệt lúc cao điểm.`,
  follow: [
    'Vì sao fetch join collection kèm phân trang lại nguy hiểm trong Hibernate?',
    'Bạn viết test tự động phát hiện N+1 như thế nào?',
    'Khi nào giữ OSIV là chấp nhận được?'
  ],
  tags: ['Spring Data JPA', 'OSIV', 'N+1', 'Hibernate', 'lazy loading', 'HikariCP'],
  refs: [
    { type: 'article', title: 'The Open Session In View Anti-Pattern', url: 'https://vladmihalcea.com/the-open-session-in-view-anti-pattern/' },
    { type: 'doc', title: 'Spring Boot: Data Access How-to', url: 'https://docs.spring.io/spring-boot/how-to/data-access.html' }
  ]
},
{
  id: 'scenario-060',
  topic: 'scenario',
  level: 'mid',
  q: 'Khách hàng phản ánh thỉnh thoảng tải PDF hoá đơn thì thấy **tên và số tiền của người khác**. Không tái hiện được trên máy dev, chỉ xảy ra lúc đông người. Code {{InvoiceService}} là một {{@Service}} có field {{currentInvoice}} và một {{SimpleDateFormat}}. Bạn xử lý thế nào?',
  a: `**Tóm tắt:** bean {{@Service}} mặc định là **singleton**: chỉ có một object dùng chung cho mọi request đang chạy song song. Field có thể thay đổi (mutable) như {{currentInvoice}} hay {{SimpleDateFormat}} trở thành **dữ liệu dùng chung giữa các thread**, gây race condition và rò dữ liệu giữa khách hàng. Sửa bằng cách đưa state vào biến cục bộ/tham số, dùng class bất biến và thread-safe ({{DateTimeFormatter}}), rồi coi đây là sự cố lộ dữ liệu cần đánh giá phạm vi.

### Hiểu nhanh
Singleton bean giống **một tờ giấy nháp duy nhất dán trên bàn quầy**, mà 200 nhân viên (thread) cùng viết lên. Nhân viên A vừa ghi tên khách A, chưa kịp in thì nhân viên B xoá đi ghi tên khách B; A in ra tờ giấy có tên B. Trên máy dev chỉ có bạn bấm nên không bao giờ có hai người cùng viết.

### Thuật ngữ
- **Singleton scope**: Spring tạo đúng 1 instance cho mỗi bean trong container, inject cho mọi nơi.
- **Race condition**: kết quả phụ thuộc vào thứ tự chạy xen kẽ giữa các thread.
- **Stateless**: object không giữ dữ liệu của một request cụ thể trong field.
- **Thread-safe**: dùng đồng thời từ nhiều thread mà vẫn đúng.

### Triệu chứng
- Khoảng 1/20.000 hoá đơn sai người, chỉ lúc tải cao (> 50 request đồng thời).
- Thỉnh thoảng có {{NumberFormatException}} hoặc ngày tháng vô lý kiểu năm 20240 trong log, từ {{SimpleDateFormat.parse}}.

~~~java
@Service
public class InvoiceService {
    private Invoice currentInvoice;                    // SAI: state của request trong singleton
    private final SimpleDateFormat fmt = new SimpleDateFormat("dd/MM/yyyy"); // không thread-safe

    public byte[] render(Long id) {
        currentInvoice = repo.findById(id).orElseThrow();
        String date = fmt.format(currentInvoice.getIssuedAt());
        return pdf.build(currentInvoice, date);         // có thể đọc invoice của thread khác
    }
}
~~~

### Giả thuyết và cách xác minh
1. **State dùng chung trong singleton.** Xác minh: tìm mọi field không {{final}} hoặc field có kiểu mutable trong {{@Service}}, {{@Component}}, {{@Controller}}; field {{currentInvoice}} bị ghi trong method nghiệp vụ.
2. **SimpleDateFormat dùng chung.** Class này giữ một {{Calendar}} bên trong làm vùng nhớ tạm khi format/parse, nên hai thread cùng dùng sẽ ghi đè lên nhau.
3. **Tái hiện bằng test đồng thời** (không cần production):

~~~java
ExecutorService pool = Executors.newFixedThreadPool(32);
List<Future<Boolean>> results = new ArrayList<>();
for (long id = 1; id <= 2000; id++) {
    long expected = id;
    results.add(pool.submit(() -> pdfParser.ownerOf(service.render(expected)) == expected));
}
long wrong = 0;
for (Future<Boolean> f : results) if (!f.get()) wrong++;
assertEquals(0, wrong);                                // code sai: thường fail ngay
~~~

### Cơ chế từng bước
~~~text
Thread T1: currentInvoice = INV-A
Thread T2: currentInvoice = INV-B        (ghi đè)
Thread T1: pdf.build(currentInvoice)  -> in INV-B cho khách A
~~~
1. Tomcat phục vụ mỗi request trên một thread khác nhau, nhưng tất cả gọi **cùng một** object {{InvoiceService}}.
2. Field nằm trên heap, mọi thread cùng thấy. Biến cục bộ nằm trên stack riêng của từng thread nên không ai đụng được.
3. Không có đồng bộ (synchronization) nên thứ tự ghi/đọc xen kẽ tuỳ bộ lập lịch; tải càng cao xác suất càng lớn. Đó là lý do dev không tái hiện được.

### Sửa
~~~java
@Service
public class InvoiceService {
    // DateTimeFormatter bất biến, thread-safe, dùng chung thoải mái
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    public byte[] render(Long id) {
        Invoice invoice = repo.findById(id).orElseThrow();   // biến cục bộ: của riêng thread này
        String date = FMT.format(invoice.getIssuedAt());      // issuedAt là LocalDate
        return pdf.build(invoice, date);
    }
}
~~~
| Cách | Khi nào | Lưu ý |
|---|---|---|
| Biến cục bộ / tham số | hầu hết trường hợp | đơn giản, đúng nhất |
| Class bất biến ({{DateTimeFormatter}}, record) | cấu hình dùng chung | cần thiết kế immutable |
| {{@RequestScope}} bean | thật sự cần state theo request | có proxy, khó test hơn |
| {{synchronized}} | gần như không bao giờ cho việc này | biến service thành nút cổ chai |

### Xử lý sự cố
- Ngắn hạn: hotfix, đồng thời tạm tắt tính năng tải PDF nếu chưa deploy kịp.
- Đánh giá phạm vi: đối chiếu access log (ai tải invoice nào) với nội dung đã sinh nếu có lưu, báo bộ phận bảo mật/pháp chế vì đây là **lộ dữ liệu cá nhân**.
- Dài hạn: rule Sonar (ví dụ cảnh báo field non-static {{SimpleDateFormat}}, field mutable trong singleton), checklist review.

### Lỗi hay gặp
1. **Thêm {{synchronized}} lên method**: hết bug nhưng throughput sụt mạnh vì mọi request xếp hàng.
2. **Đổi bean sang {{@Scope("prototype")}}**: prototype inject vào singleton vẫn chỉ được tạo **một lần**, bug còn nguyên.
3. **Cache "tạm" trong {{HashMap}} field**: vừa race, vừa có thể làm hỏng cấu trúc map; dùng {{ConcurrentHashMap}} hoặc cache library.

### Trả lời miệng 1 phút
"Lỗi chỉ xuất hiện khi đông người là dấu hiệu race condition. Bean Spring mặc định là singleton, nên field currentInvoice và SimpleDateFormat được mọi request dùng chung. Tôi tái hiện bằng test 32 thread gọi song song và kiểm tra chủ hoá đơn. Cách sửa là đưa state vào biến cục bộ, thay SimpleDateFormat bằng DateTimeFormatter bất biến. Vì đây là lộ dữ liệu khách hàng, tôi còn phối hợp bảo mật để đánh giá phạm vi, và thêm rule tĩnh chặn field mutable trong singleton."

> Senior tip: quy tắc đơn giản nhất cho team: **service bean chỉ có field {{final}} trỏ tới dependency hoặc object bất biến**. Constructor injection với field final làm vi phạm lộ ra ngay khi review. Lỗi này hiếm khi gây crash, nó gây **sai dữ liệu âm thầm**, nên luôn đáng một test đồng thời.`,
  follow: [
    'Inject bean prototype vào singleton thì chuyện gì xảy ra, và sửa bằng {{ObjectProvider}} thế nào?',
    'Vì sao {{DateTimeFormatter}} thread-safe còn {{SimpleDateFormat}} thì không?'
  ],
  tags: ['Spring', 'singleton', 'thread-safety', 'race condition', 'SimpleDateFormat'],
  refs: [
    { type: 'doc', title: 'Spring Framework: Bean Scopes', url: 'https://docs.spring.io/spring-framework/reference/core/beans/factory-scopes.html' }
  ]
},
{
  id: 'scenario-061',
  topic: 'scenario',
  level: 'senior',
  q: 'Sau khi tăng dữ liệu cache warm-up, pod Spring Boot mới không bao giờ lên được: {{kubectl get pods}} báo {{CrashLoopBackOff}}, RESTARTS tăng đều, không có {{OOMKilled}}. Ngoài ra pod đang chạy thỉnh thoảng bị restart đúng lúc có Full GC dài. Bạn điều tra và cấu hình probe thế nào?',
  a: `**Tóm tắt:** **liveness probe** đang giết pod: lúc khởi động app cần ~90 giây nhưng liveness bắt đầu kiểm tra sau 30 giây và cho phép thất bại 3 lần × 10 giây, nên kubelet kill container trước khi app kịp sẵn sàng; tương tự, một lần GC pause dài làm probe timeout liên tiếp. Xác minh bằng {{kubectl describe pod}} (Events "Liveness probe failed"), {{kubectl logs --previous}} và GC log. Sửa bằng **startupProbe** cho giai đoạn khởi động, liveness nhẹ chỉ kiểm tra "process còn sống" với timeout/threshold hợp lý, và readiness riêng cho việc nhận traffic.

### Hiểu nhanh
Liveness giống **bác sĩ hỏi "anh còn tỉnh không?"** mỗi 10 giây; không trả lời 3 lần là đem đi "khởi động lại". Vấn đề là người bệnh đang **tỉnh dậy sau gây mê** (khởi động) hoặc **đang nín thở vài giây** (GC pause) thì chưa trả lời được, và bác sĩ quá vội. Startup probe là quy tắc "trong lúc tỉnh dậy thì đừng hỏi câu đó"; readiness là câu hỏi khác hẳn: "anh đã sẵn sàng tiếp khách chưa?".

### Thuật ngữ
| Probe | Thất bại thì | Dùng để |
|---|---|---|
| startupProbe | kill container khi hết hạn mức | che chắn giai đoạn khởi động chậm; trong lúc nó chạy, liveness/readiness bị tạm hoãn |
| livenessProbe | **kill và restart** container | phát hiện process treo vĩnh viễn (deadlock) |
| readinessProbe | gỡ pod khỏi Service, **không kill** | tạm ngừng nhận traffic |

### Triệu chứng và số liệu
- Startup log: "Started OrderApplication in 92.4 seconds" (trước khi tăng dữ liệu warm-up là 40 giây).
- Probe hiện tại: {{initialDelaySeconds: 30}}, {{periodSeconds: 10}}, {{timeoutSeconds: 1}}, {{failureThreshold: 3}}, path {{/actuator/health}}.
- Thời điểm bị kill ≈ 30 + 3 × 10 = khoảng 60 giây sau khi start, luôn trước mốc 92 giây, nên vòng lặp không bao giờ thoát.

### Giả thuyết và cách xác minh
1. **Liveness kill lúc khởi động.** {{kubectl describe pod order-7c9f}}: Events có "Liveness probe failed: Get http://10.1.2.3:8080/actuator/health: dial tcp ... connection refused" rồi "Container order failed liveness probe, will be restarted". Last State: Terminated, Reason **Error** hoặc exit 143 (JVM nhận SIGTERM), không phải OOMKilled.
2. **Liveness kill khi GC pause.** Với {{-Xlog:gc*:file=/logs/gc.log}}, thấy "Pause Full (G1 Compaction Pause) 3.9G->3.7G(4G) 14210.512ms" trùng thời điểm Event "Liveness probe failed ... context deadline exceeded". Heap gần đầy sau Full GC còn cho thấy vấn đề bộ nhớ thật cần xử lý riêng.
3. **Liveness kiểm tra cả DB.** Nếu path là {{/actuator/health}} (gồm cả {{db}}, {{redis}}), một lần DB chậm làm **mọi pod** fail liveness cùng lúc và bị restart hàng loạt, biến sự cố nhỏ thành sập toàn bộ.
4. Lấy log của lần chạy trước khi bị kill: {{kubectl logs order-7c9f --previous}}.

### Cơ chế từng bước
~~~text
t=0s   container start, JVM khởi động, Spring tạo bean, warm-up cache
t=30s  liveness #1 -> connection refused (fail 1)
t=40s  liveness #2 -> fail 2
t=50s  liveness #3 -> fail 3 => kubelet gửi SIGTERM, sau grace period gửi SIGKILL
t=~60s container restart -> lặp lại; backoff tăng dần => CrashLoopBackOff
~~~
Kubelet không biết app "đang khởi động"; nó chỉ đếm số lần thất bại liên tiếp. GC stop-the-world tương tự: toàn bộ thread ứng dụng, kể cả thread xử lý HTTP probe, dừng lại.

### Cấu hình đề xuất
~~~yaml
startupProbe:                    # cho tối đa 30 x 5s = 150s để khởi động
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 5
  failureThreshold: 30
livenessProbe:                   # chỉ hỏi: process còn phản hồi không
  httpGet: { path: /actuator/health/liveness, port: 8080 }
  periodSeconds: 10
  timeoutSeconds: 3
  failureThreshold: 6            # chịu được ~60s không phản hồi
readinessProbe:                  # có nhận traffic được không
  httpGet: { path: /actuator/health/readiness, port: 8080 }
  periodSeconds: 5
  failureThreshold: 3
~~~
Spring Boot tự bật các health group {{liveness}} và {{readiness}} khi phát hiện chạy trên Kubernetes (hoặc đặt {{management.endpoint.health.probes.enabled=true}}). Mặc định group liveness **không** chứa DB; giữ nguyên như vậy. Nếu muốn DB ảnh hưởng thì chỉ đưa vào readiness, và cân nhắc kỹ vì DB chết thì mọi pod cùng rút khỏi Service.

### Sửa ngắn hạn và dài hạn
- Ngắn hạn: thêm startupProbe, đổi liveness sang {{/actuator/health/liveness}}, tăng timeout; rollout lại.
- Dài hạn: giảm thời gian khởi động (warm-up cache bất đồng bộ sau khi ready, hoặc lazy init có chọn lọc); xử lý Full GC dài (heap sizing, tìm memory leak) vì probe chỉ là triệu chứng.

### Lỗi hay gặp
1. **Dùng chung một endpoint cho liveness và readiness**: DB chậm làm restart toàn bộ fleet.
2. **Tăng {{initialDelaySeconds}} lên 120 giây**: chạy được nhưng mỗi lần pod chết thật, phải chờ 2 phút mới phát hiện; startupProbe tốt hơn vì xong khởi động là liveness chạy ngay.
3. **{{timeoutSeconds: 1}} mặc định** cho app JVM: một GC pause 1–2 giây đã đủ tính là fail.

### Trả lời miệng 1 phút
"CrashLoopBackOff mà không OOMKilled, tôi xem ngay Events của pod: thấy Liveness probe failed và container bị restart khoảng 60 giây sau khi start, trong khi app cần 92 giây. Lần restart lúc chạy thì trùng Full GC 14 giây trong GC log. Tôi thêm startupProbe cho giai đoạn khởi động, cho liveness trỏ vào health group liveness nhẹ, không kiểm tra DB, với timeout và threshold chịu được pause, còn readiness lo chuyện nhận traffic. Song song tôi xử lý gốc: rút ngắn startup và tìm vì sao heap đầy gây Full GC."

> Senior tip: nguyên tắc của tôi là **liveness chỉ fail khi restart thực sự chữa được bệnh** (deadlock, process treo). Mọi phụ thuộc bên ngoài để ở readiness hoặc circuit breaker. Một sự cố tôi từng gặp: Postgres failover 40 giây, liveness có check DB, cả 30 pod restart cùng lúc và mất thêm 5 phút khởi động lại, lâu gấp mấy lần chính sự cố DB.`,
  follow: [
    'Khi readiness phụ thuộc DB và DB chết, toàn bộ pod rút khỏi Service thì có ổn không?',
    'Exit code 137 và 143 khác nhau thế nào khi đọc {{kubectl describe pod}}?',
    'Bạn rút ngắn thời gian khởi động Spring Boot bằng những cách nào?'
  ],
  tags: ['Kubernetes', 'liveness probe', 'startupProbe', 'readiness', 'CrashLoopBackOff', 'GC pause'],
  refs: [
    { type: 'doc', title: 'Kubernetes: Configure Liveness, Readiness and Startup Probes', url: 'https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/' },
    { type: 'doc', title: 'Spring Boot: Actuator Endpoints and Kubernetes Probes', url: 'https://docs.spring.io/spring-boot/reference/actuator/endpoints.html' }
  ]
},
{
  id: 'scenario-062',
  topic: 'scenario',
  level: 'senior',
  q: 'Mỗi lần rolling deploy service thanh toán (10 pod), client nhận khoảng 200–400 lỗi 502/503 và vài lỗi "connection reset" trong 1–2 phút, dù readiness probe đã cấu hình. Bạn tìm nguyên nhân và làm deploy "không rơi request" thế nào?',
  a: `**Tóm tắt:** khi pod bị xoá, Kubernetes **song song** gửi SIGTERM cho container và gỡ pod khỏi danh sách endpoint; ingress/kube-proxy cần vài giây mới cập nhật, nên trong khoảng đó traffic vẫn đổ vào một JVM đang tắt. Sửa bằng ba lớp: **preStop sleep** vài giây để chờ endpoint được gỡ, **graceful shutdown** của Spring Boot để xử lý nốt request đang chạy, và {{terminationGracePeriodSeconds}} lớn hơn tổng hai khoảng đó; kèm {{maxUnavailable: 0}} và readiness đúng nghĩa cho pod mới.

### Hiểu nhanh
Giống một quầy thu ngân đóng ca: quản lý vừa **tắt đèn quầy** (SIGTERM) vừa **gửi thông báo cho bảo vệ** đừng dẫn khách tới quầy này (gỡ endpoint). Nhưng thông báo mất vài giây mới tới, bảo vệ vẫn dẫn khách đến quầy đã tối. Cách làm đúng: thông báo trước, **đợi vài giây** cho bảo vệ nhận tin, rồi mới phục vụ nốt khách đang đứng và đóng quầy.

### Thuật ngữ
- **EndpointSlice**: danh sách IP pod đứng sau một Service; kube-proxy và ingress controller đọc danh sách này.
- **preStop hook**: lệnh chạy **trước** khi container nhận SIGTERM.
- **Graceful shutdown**: ngừng nhận request mới, chờ request đang chạy xong rồi mới tắt.
- **terminationGracePeriodSeconds**: tổng thời gian tối đa (mặc định 30s) từ lúc bắt đầu tắt đến khi kubelet gửi SIGKILL.

### Triệu chứng và số liệu
- Lỗi chỉ xuất hiện trong cửa sổ deploy; access log ingress có 502 với "upstream prematurely closed connection" và "connect() failed (111: Connection refused)" tới IP của pod cũ.
- Pod cũ: log "Graceful shutdown" không xuất hiện, process tắt trong dưới 1 giây sau SIGTERM.
- Một số request thanh toán mất 8–15 giây (gọi ngân hàng), bị cắt ngang giữa chừng.

### Giả thuyết và cách xác minh
1. **Race giữa SIGTERM và việc gỡ endpoint.** Ghi log thời điểm nhận SIGTERM (shutdown hook) và so với thời điểm IP biến mất khỏi {{kubectl get endpointslices -l kubernetes.io/service-name=payment -w}}; ingress vẫn gửi request tới IP đó sau SIGTERM 2–5 giây.
2. **App tắt ngay, không chờ request đang chạy.** Kiểm tra {{server.shutdown}}: Spring Boot 3.4 trở đi mặc định là graceful; bản cũ hơn mặc định là immediate.
3. **Grace period quá ngắn.** Request 15 giây + chờ endpoint, nhưng {{terminationGracePeriodSeconds}} vẫn 30 với shutdown phase dài, có thể bị SIGKILL (exit 137).
4. **Pod mới nhận traffic quá sớm.** Readiness trả UP trước khi warm-up xong, request đầu bị timeout.

### Cơ chế từng bước khi một pod bị xoá
~~~text
API server đánh dấu pod Terminating
   ├─► (A) kubelet: chạy preStop -> gửi SIGTERM -> chờ -> SIGKILL khi hết grace
   └─► (B) EndpointSlice controller gỡ IP -> kube-proxy / ingress cập nhật (vài giây)
(A) và (B) chạy SONG SONG, không có thứ tự đảm bảo
~~~
Nếu không có preStop, (A) thường nhanh hơn (B): JVM đã đóng cổng trong khi ingress vẫn còn IP cũ, sinh ra connection refused/502.

### Cấu hình sửa
~~~yaml
spec:
  terminationGracePeriodSeconds: 60   # > preStop (10) + shutdown timeout (40)
  containers:
  - name: payment
    lifecycle:
      preStop:
        sleep: { seconds: 10 }        # K8s 1.30+; bản cũ: exec ["sh","-c","sleep 10"]
    readinessProbe:
      httpGet: { path: /actuator/health/readiness, port: 8080 }
---
# Deployment strategy
strategy:
  rollingUpdate: { maxUnavailable: 0, maxSurge: 2 }
~~~
~~~yaml
# application.yml
server:
  shutdown: graceful                  # ngừng nhận request mới, chờ request đang chạy
spring:
  lifecycle:
    timeout-per-shutdown-phase: 40s   # mặc định 30s
~~~
Khi bắt đầu tắt, Spring Boot cũng chuyển readiness sang trạng thái không nhận traffic; nhưng **không nên chỉ dựa vào điều đó** vì readiness cũng cần vài chu kỳ probe mới có hiệu lực.

### Những thứ khác cần tắt êm
- Kafka consumer: container listener dừng và commit offset trong shutdown; xử lý idempotent để chịu được giao lại.
- Job {{@Scheduled}} và executor async: cấu hình chờ task xong ({{spring.task.execution.shutdown.await-termination=true}}).
- Keep-alive connection từ ingress: graceful shutdown của Tomcat trả lỗi cho request mới trên connection cũ, nên preStop sleep vẫn là lớp chính.

### Phòng ngừa
- Test: chạy k6/Gatling 200 RPS liên tục trong khi {{kubectl rollout restart deployment/payment}}, yêu cầu 0 lỗi 5xx.
- PodDisruptionBudget để node drain không đá nhiều pod cùng lúc.
- Đo deploy như một SLO: "số lỗi 5xx trong cửa sổ deploy".

### Lỗi hay gặp
1. **preStop sleep lớn hơn grace period**: kubelet SIGKILL giữa chừng, request đang chạy chết hết.
2. **Image distroless không có lệnh sleep** mà vẫn dùng exec sleep: hook lỗi; dùng action sleep native (K8s 1.30+) hoặc endpoint tự viết.
3. **Chỉ cấu hình {{server.shutdown=graceful}}** mà quên preStop: vẫn rơi request do race endpoint.

### Trả lời miệng 1 phút
"Nguyên nhân là race: khi xoá pod, Kubernetes gửi SIGTERM và gỡ endpoint song song, ingress cần vài giây mới cập nhật nên vẫn đổ traffic vào JVM đang tắt. Tôi xác minh bằng cách so log SIGTERM với lúc IP rời EndpointSlice và access log 502 của ingress. Tôi sửa bằng preStop sleep 10 giây, server.shutdown graceful với timeout 40 giây, grace period 60 giây, maxUnavailable 0, và readiness chỉ UP sau warm-up. Cuối cùng chạy load test trong lúc rollout restart để chứng minh 0 lỗi."

> Senior tip: con số grace period phải tính từ **request dài nhất bạn chấp nhận hoàn tất**, không chọn đại. Với dịch vụ gọi ngân hàng p99.9 là 15 giây, tôi đặt shutdown timeout 40 giây và grace 60 giây; sau thay đổi, lỗi trong mỗi lần deploy giảm từ vài trăm xuống 0, và team dám deploy giữa giờ hành chính.`,
  follow: [
    'Vì sao readiness probe đã có mà vẫn cần preStop?',
    'Rolling deploy với Kafka consumer gây rebalance liên tục thì xử lý thế nào?',
    'PodDisruptionBudget giúp gì khi node bị drain?'
  ],
  tags: ['Kubernetes', 'rolling update', 'graceful shutdown', 'preStop', 'zero downtime'],
  refs: [
    { type: 'doc', title: 'Kubernetes: Pod Lifecycle', url: 'https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/' },
    { type: 'doc', title: 'Kubernetes: Container Lifecycle Hooks', url: 'https://kubernetes.io/docs/concepts/containers/container-lifecycle-hooks/' },
    { type: 'doc', title: 'Spring Boot: Graceful Shutdown', url: 'https://docs.spring.io/spring-boot/reference/web/graceful-shutdown.html' }
  ]
},
{
  id: 'scenario-063',
  topic: 'scenario',
  level: 'senior',
  q: 'HPA của service catalog dao động liên tục: số replica nhảy 4 → 12 → 4 → 12 cứ khoảng 6–7 phút, kể cả khi traffic gần như phẳng. Mỗi lần scale up, latency lại tăng. Bạn phân tích và ổn định nó thế nào?',
  a: `**Tóm tắt:** HPA tính {{desired = ceil(current × currentUtilization / target)}} theo CPU **so với request**. Pod JVM mới khởi động đốt nhiều CPU (class loading, JIT, warm-up) nên đẩy trung bình CPU lên, HPA scale up thêm; vài phút sau CPU về thấp, hết cửa sổ ổn định 5 phút thì scale down, rồi lặp lại. Xác minh bằng {{kubectl describe hpa}} và metric CPU theo từng pod; sửa bằng {{behavior}} (stabilization window, giới hạn tốc độ), đặt CPU request sát thực tế, readiness chỉ UP sau warm-up, và cân nhắc scale theo metric gần nghiệp vụ hơn (RPS, lag).

### Hiểu nhanh
HPA giống **quản lý siêu thị nhìn độ bận của thu ngân để mở thêm quầy**. Thu ngân mới vào ca phải mở máy, đếm tiền, nên trông "rất bận" dù chưa phục vụ ai. Quản lý thấy trung bình bận tăng, mở thêm quầy; lát sau ai cũng rảnh, đóng bớt quầy; quầy mới lại "bận giả"... cứ thế lặp lại.

### Thuật ngữ
- **CPU utilization của HPA**: CPU dùng thật chia cho **CPU request** của container, không phải chia cho limit.
- **Stabilization window**: HPA nhìn lại các đề xuất trong khoảng thời gian này và chọn giá trị an toàn nhất; mặc định scale down 300 giây, scale up 0 giây.
- **Tolerance**: chênh lệch dưới 10% so với target thì HPA không đổi gì.
- **Flapping**: scale lên xuống liên tục.

### Triệu chứng và số liệu
- Target CPU 60%, request 500m. Lúc ổn định mỗi pod dùng ~250m (50%).
- Pod mới: 30–60 giây đầu dùng 1.5–2 core (JIT C2 + warm-up), 300–400% so với request.
- {{kubectl describe hpa catalog}} Events: "New size: 12; reason: cpu resource utilization (percentage of request) above target", vài phút sau "New size: 4; reason: All metrics below target".

### Giả thuyết và cách xác minh
1. **CPU khởi động của pod mới làm lệch trung bình.** Vẽ {{container_cpu_usage_seconds_total}} theo từng pod: các pod tuổi dưới 1 phút có CPU vọt cao. HPA có cơ chế bỏ qua mẫu CPU của pod chưa ready trong giai đoạn khởi tạo, nhưng nếu readiness UP **quá sớm** thì CPU warm-up vẫn bị tính.
2. **Request quá thấp so với thực tế** nên utilization nhạy với mọi biến động nhỏ. Xác minh bằng p95 CPU thực tế dài ngày so với request.
3. **Scale up mạnh không giới hạn**: từ 4 nhảy thẳng 12 trong một chu kỳ vì đang dùng mặc định cho scale up.
4. **Latency tăng khi scale up** vì pod mới chưa warm (JIT, connection pool, cache), nhận traffic ngay.

### Cơ chế từng bước một vòng flapping
~~~text
t0   4 pod x 50%                 -> ổn
t1   dao động nhẹ: 4 pod x 70%   -> desired = ceil(4 x 70/60) = 5
t2   pod mới ready sớm, CPU 350% -> trung bình 5 pod ~ 126% -> desired 11..12
t3   7 pod mới cùng warm-up      -> CPU vẫn cao, giữ 12
t8   warm-up xong: 12 pod x 17%  -> đề xuất 4, hết 300s stabilization -> về 4
t9   4 pod quay lại ~50-70%      -> vòng mới
~~~

### Cấu hình ổn định
~~~yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
spec:
  minReplicas: 6                          # sàn đủ cho traffic nền
  maxReplicas: 20
  metrics:
  - type: Resource
    resource: { name: cpu, target: { type: Utilization, averageUtilization: 65 } }
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60      # cần đề xuất cao kéo dài 60s mới scale
      policies: [ { type: Percent, value: 50, periodSeconds: 60 } ]   # tối đa +50%/phút
    scaleDown:
      stabilizationWindowSeconds: 600     # chậm rãi khi giảm
      policies: [ { type: Pods, value: 1, periodSeconds: 120 } ]
~~~
Kèm theo:
- **Đặt CPU request theo p90–p95 thực tế** (ví dụ 1000m), để utilization phản ánh đúng tải.
- **Readiness chỉ UP sau warm-up** (gọi trước các endpoint chính, mở đủ connection pool), giúp HPA bỏ qua CPU khởi tạo và tránh latency tăng.
- Nếu CPU không phải nút cổ chai thật (service chờ I/O), scale theo RPS hoặc latency qua custom/external metric (Prometheus Adapter, KEDA).

### Trade-off
| Lựa chọn | Lợi | Giá |
|---|---|---|
| Stabilization dài | ổn định | phản ứng chậm với đỉnh thật |
| minReplicas cao | ít flapping, sẵn sàng đỉnh | tốn tiền giờ thấp điểm |
| Scale theo RPS | sát nghiệp vụ | cần pipeline metric, có thể trễ |

### Lỗi hay gặp
1. **Đặt target theo limit** trong đầu thay vì request: target 60% với request 500m nghĩa là chỉ 300m.
2. **Bật cả HPA theo CPU và VPA chỉnh CPU request** cùng lúc: hai bộ điều khiển giành nhau.
3. **Không giới hạn tốc độ scale up**: một đỉnh giả kéo theo hàng chục pod, có thể làm DB cạn connection (mỗi pod mở pool 20 connection).

### Trả lời miệng 1 phút
"HPA tính utilization theo CPU request. Pod JVM mới đốt nhiều CPU lúc warm-up nên kéo trung bình lên, HPA scale up, sau đó CPU tụt và sau 5 phút stabilization lại scale down, thành vòng lặp. Tôi xác minh bằng events của HPA và CPU theo tuổi pod. Tôi sửa bằng behavior: stabilization 60 giây khi tăng, 10 phút khi giảm, giới hạn +50% mỗi phút; đặt request theo p95 thực tế; readiness chỉ UP sau warm-up; và nếu service chủ yếu chờ I/O thì scale theo RPS thay vì CPU."

> Senior tip: hãy nhớ mỗi replica mới còn **nhân thêm connection tới DB**. Tôi từng thấy HPA nhảy từ 8 lên 40 pod trong một đỉnh giả, mỗi pod Hikari 20 connection, tổng 800 connection vượt {{max_connections}} của Postgres và chính autoscale gây sự cố. Luôn tính {{maxReplicas × pool size}} so với giới hạn DB.`,
  follow: [
    'Khi nào nên scale theo Kafka lag thay vì CPU?',
    'Vì sao không nên dùng chung HPA (CPU) và VPA (CPU) cho cùng Deployment?',
    'Bạn chọn minReplicas dựa trên số liệu nào?'
  ],
  tags: ['Kubernetes', 'HPA', 'autoscaling', 'JVM warm-up', 'flapping'],
  refs: [
    { type: 'doc', title: 'Kubernetes: Horizontal Pod Autoscaling', url: 'https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/' }
  ]
},
{
  id: 'scenario-064',
  topic: 'scenario',
  level: 'senior',
  q: 'Dashboard cho thấy pod của service pricing chỉ dùng trung bình 35% CPU limit (limit 1 core), nhưng p99 latency tăng từ 80ms lên 600ms mỗi khi traffic lên nhẹ, và GC pause cũng dài bất thường. Team định tối ưu code. Bạn nghi điều gì và kiểm chứng thế nào?',
  a: `**Tóm tắt:** nghi **CPU throttling** do CFS quota: limit 1 core nghĩa là mỗi chu kỳ 100ms container chỉ được tiêu tổng cộng 100ms CPU. Ứng dụng nhiều thread (Tomcat, GC, JIT) có thể dùng hết quota trong 25ms đầu trên 4 core rồi **bị đóng băng 75ms còn lại**, dù trung bình theo phút chỉ 35%. Kiểm chứng bằng {{container_cpu_cfs_throttled_periods_total}} hoặc {{cpu.stat}} trong cgroup; sửa bằng tăng hoặc bỏ CPU limit (giữ request), chỉnh số thread/GC cho phù hợp, và đặt alert tỉ lệ throttling.

### Hiểu nhanh
CPU limit giống **vé xem phim 100 phút mỗi buổi**, mà bạn được dùng nhiều ghế cùng lúc. Nếu đưa 4 người vào cùng lúc, 25 phút là hết 100 phút-người, và cả nhóm phải **ra ngoài đứng chờ** đến buổi sau. Tính trung bình cả ngày bạn dùng rất ít vé, nhưng ngay lúc cần thì bị đuổi ra. Trung bình đẹp đã che mất những lần chờ đó.

### Thuật ngữ
- **CFS quota/period**: Linux cấp cho cgroup một hạn mức CPU-time (quota) trong mỗi chu kỳ (period, mặc định 100ms). Limit 1 core = 100ms quota mỗi 100ms.
- **Throttling**: cgroup dùng hết quota trước khi hết chu kỳ, nên mọi thread của nó bị dừng đến chu kỳ sau.
- **CPU request**: phần CPU đảm bảo, dùng để xếp lịch và chia CPU khi tranh chấp; không gây throttling.
- **availableProcessors**: số CPU mà JVM nghĩ mình có; trong container JVM tính từ quota (limit).

### Triệu chứng và số liệu
- Node có 8 core, pod limit 1 core, request 500m.
- CPU trung bình theo phút: 0.35 core. Nhưng {{rate(container_cpu_cfs_throttled_periods_total[5m]) / rate(container_cpu_cfs_periods_total[5m])}} = **45%**: gần một nửa số chu kỳ bị throttle.
- GC log: pause "Pause Young" lúc bình thường 15ms, lúc tải lên 120–250ms.
- {{java -XX:+PrintFlagsFinal -version}} trong container: JVM chọn **SerialGC** vì thấy ít hơn 2 CPU.

### Giả thuyết và cách xác minh
1. **Throttling theo quota.** Vào container: {{cat /sys/fs/cgroup/cpu.stat}} (cgroup v2) xem {{nr_periods}}, {{nr_throttled}}, {{throttled_usec}}; chạy lại sau 60 giây, tính phần tăng. Hoặc dùng metric cAdvisor ở trên.
2. **JVM nhận sai tài nguyên.** {{jcmd 1 VM.info}} hoặc log khởi động với {{-Xlog:os+container=info}} cho thấy quota và số CPU JVM tính ra; với limit 1 core, {{availableProcessors}} = 1, JVM mặc định chọn Serial GC (chỉ 1 thread GC, stop-the-world).
3. **Code chậm thật?** So sánh: chạy load test cùng code trên pod không limit; p99 về 85ms thì vấn đề nằm ở hạ tầng, không phải code.

### Cơ chế từng bước
~~~text
Period 100ms, quota 100ms, app có 4 thread chạy song song trên 4 core
0ms ─ 25ms : 4 thread x 25ms = 100ms CPU -> HẾT quota
25ms ─ 100ms: TẤT CẢ thread bị dừng (throttled 75ms)
=> request đang xử lý dở bị cộng thêm tới 75ms; GC đang chạy cũng bị dừng
~~~
Một request đi qua vài chu kỳ bị throttle là đã cộng thêm hàng trăm ms. Metric trung bình theo phút không thấy vì tổng CPU vẫn thấp; đó là lý do "35% mà vẫn chậm".

### Sửa
| Cách | Hiệu quả | Lưu ý |
|---|---|---|
| Bỏ CPU limit, giữ request đúng | hết throttling, dùng CPU rảnh của node | cần policy cho phép; noisy neighbor được kiểm soát bằng request |
| Tăng limit (ví dụ 2–4 core) | giảm mạnh throttling | tốn quota namespace |
| {{-XX:ActiveProcessorCount=2}} | JVM chọn G1, số thread GC/JIT hợp lý | không tăng quota, chỉ sửa ước lượng của JVM |
| Giảm thread song song (pool) | ít đốt quota cùng lúc | có thể giảm throughput |

Với service nhạy latency, phương án phổ biến: request = mức dùng p95 thật (ví dụ 1 core), limit bỏ hoặc gấp 2–4 lần request; chỉ định GC tường minh ({{-XX:+UseG1GC}}) thay vì để JVM tự chọn.

### Phòng ngừa
- Alert khi tỉ lệ chu kỳ bị throttle > 10–20% kéo dài.
- Dashboard đặt cạnh nhau: p99 latency, throttled ratio, GC pause.
- Khi sizing, đo theo **burst** (p99 CPU theo giây) chứ không chỉ trung bình theo phút.

### Lỗi hay gặp
1. **Nhìn CPU trung bình rồi kết luận "CPU dư"**: throttling xảy ra ở thang 100ms, metric phút không thấy.
2. **Limit dưới 2 core cho app JVM**: JVM chọn Serial GC, pause dài, càng ăn quota đúng lúc nhạy cảm.
3. **Tối ưu code trước khi đo hạ tầng**: mất nhiều tuần mà p99 không đổi.

### Trả lời miệng 1 phút
"CPU trung bình thấp mà latency cao khiến tôi nghi CPU throttling của CFS: limit 1 core là 100ms CPU mỗi 100ms, app nhiều thread tiêu hết quota sớm rồi bị dừng phần còn lại của chu kỳ. Tôi kiểm tra cpu.stat trong cgroup hoặc metric throttled periods: 45% chu kỳ bị throttle. JVM còn thấy chỉ 1 CPU nên chọn Serial GC, pause dài thêm. Tôi sửa bằng đặt request theo p95, bỏ hoặc nâng limit, chỉ định G1 và ActiveProcessorCount phù hợp, rồi thêm alert tỉ lệ throttle."

> Senior tip: trước khi để team đi tối ưu code vì p99, tôi luôn xem 3 biểu đồ: **throttled ratio, GC pause, connection pool wait**. Ở một dự án, chỉ bỏ CPU limit cho 6 service nhạy latency (giữ request) đã làm p99 giảm từ 600ms xuống khoảng 90ms mà không đổi dòng code nào.`,
  follow: [
    'Khi bỏ CPU limit, làm sao tránh một pod chiếm hết CPU của node?',
    'Vì sao JVM chọn Serial GC khi container có ít hơn 2 CPU?',
    'Memory limit có nên bỏ như CPU limit không? Vì sao?'
  ],
  tags: ['Kubernetes', 'CPU throttling', 'CFS quota', 'JVM container', 'latency', 'GC'],
  refs: [
    { type: 'doc', title: 'Kubernetes: Resource Management for Pods and Containers', url: 'https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/' }
  ]
},
{
  id: 'scenario-065',
  topic: 'scenario',
  level: 'senior',
  q: 'Consumer group {{invoice-sync}} (6 instance, topic 12 partition) cứ vài phút lại rebalance, lag tăng từ 0 lên 2 triệu, và log đầy {{CommitFailedException}}. Mỗi message cần gọi API bên ngoài mất 0.5–1 giây. Bạn chẩn đoán và sửa "rebalance storm" này thế nào?',
  a: `**Tóm tắt:** consumer lấy về tối đa {{max.poll.records}} (mặc định 500) message mỗi lần {{poll()}}; xử lý 500 × 1 giây = 500 giây, vượt {{max.poll.interval.ms}} (mặc định 300.000ms = 5 phút), nên client tự rời group, gây rebalance; offset của lô đó không commit được ({{CommitFailedException}}), lô bị giao lại và lặp lại. Sửa bằng cách **giảm số record mỗi poll** để thời gian xử lý một lô nằm xa dưới giới hạn, tăng tốc xử lý (song song có kiểm soát, timeout API), chỉ tăng {{max.poll.interval.ms}} khi đã hiểu hệ quả; dùng cooperative rebalancing và static membership để rebalance ít đau hơn.

### Hiểu nhanh
Nhóm consumer giống **đội công nhân chia nhau các băng chuyền**. Quản lý (group coordinator) có luật: mỗi công nhân phải **quay lại bàn nhận việc** ít nhất 5 phút một lần, nếu không coi như đã bỏ về và chia lại băng chuyền cho người khác. Một công nhân ôm 500 kiện, mỗi kiện 1 giây, mất 8 phút mới quay lại; quản lý đã chia lại việc, công sức của anh không được ghi nhận, và kiện hàng phải làm lại từ đầu.

### Thuật ngữ
- **Rebalance**: group chia lại partition giữa các consumer; trong rebalance kiểu eager, mọi consumer dừng tiêu thụ.
- **max.poll.interval.ms**: thời gian tối đa giữa hai lần gọi {{poll()}}; vượt quá thì consumer bị coi là chết.
- **session.timeout.ms / heartbeat**: heartbeat chạy ở thread nền, phát hiện process chết; khác với poll interval (phát hiện "process sống nhưng kẹt").
- **Static membership**: đặt {{group.instance.id}} cố định để restart nhanh không gây rebalance.

### Triệu chứng và log
~~~text
WARN  [Consumer clientId=invoice-sync-3, groupId=invoice-sync] consumer poll timeout has expired.
  This means the time between subsequent calls to poll() was longer than the configured
  max.poll.interval.ms, which typically implies that the poll loop is spending too much time
  processing messages. You can address this either by increasing max.poll.interval.ms or by
  reducing the maximum size of batches returned in poll() with max.poll.records.
ERROR CommitFailedException: Commit cannot be completed since the group has already rebalanced...
~~~
- Lag tăng dần theo bậc thang; số lần rebalance mỗi giờ: 15–20.
- API bên ngoài bị gọi **trùng** (cùng invoiceId nhiều lần) vì lô bị xử lý lại.

### Giả thuyết và cách xác minh
1. **Lô quá lớn so với thời gian xử lý.** Đo thời gian xử lý mỗi lô (metric tự ghi hoặc Micrometer timer quanh listener) và so với 300 giây.
2. **API bên ngoài chậm bất thường** (p99 tăng từ 1 giây lên 10 giây). Kiểm tra metric client HTTP; thiếu timeout thì một request treo có thể chiếm cả phút.
3. **Rebalance do deploy/restart** chứ không phải do poll. Xem log coordinator/consumer: lý do rời group là "poll timeout" hay "session timeout".
4. Xem trạng thái group: {{kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group invoice-sync}}, cột CONSUMER-ID đổi liên tục, LAG tăng.

### Cơ chế từng bước
~~~text
poll() -> nhận 500 record
xử lý 500 x ~1s ............... 300s: vượt max.poll.interval.ms
 -> client gửi LeaveGroup, coordinator rebalance, partition chuyển cho consumer khác
xử lý xong ở giây 500 -> commitSync() -> CommitFailedException (không còn sở hữu partition)
consumer mới bắt đầu từ offset đã commit cũ -> 500 record bị xử lý LẠI -> cũng chậm -> lặp
~~~

### Sửa
~~~yaml
spring:
  kafka:
    consumer:
      max-poll-records: 50                 # 50 x 1s = 50s, xa dưới giới hạn 300s
      properties:
        max.poll.interval.ms: 600000       # nâng có chủ đích, phát hiện kẹt chậm hơn
        partition.assignment.strategy: org.apache.kafka.clients.consumer.CooperativeStickyAssignor
        group.instance.id: \${HOSTNAME}     # static membership (tên pod StatefulSet ổn định)
~~~
- **Timeout cho API ngoài** (connect 2s, read 5s) và circuit breaker: một call treo không được chiếm cả lô.
- **Tăng throughput** có kiểm soát: tăng {{concurrency}} của listener tới số partition (12), hoặc xử lý song song trong lô nhưng **gom theo key** để giữ thứ tự cho cùng invoice.
- **Idempotency** phía gọi API (gửi idempotency key = invoiceId) vì at-least-once luôn có trùng.
- Kafka 4.0 có giao thức consumer group mới (KIP-848, {{group.protocol=consumer}}) do broker điều phối việc chia partition, giảm hẳn kiểu rebalance "dừng cả nhóm"; cần cả broker và client hỗ trợ.

### Trade-off
| Tham số | Tăng lên thì | Giảm xuống thì |
|---|---|---|
| max.poll.records | throughput mỗi poll cao, dễ vượt interval | an toàn hơn, nhiều round-trip hơn |
| max.poll.interval.ms | chịu được lô chậm | consumer kẹt thật được phát hiện nhanh hơn |
| concurrency | xử lý nhanh hơn | vô ích nếu vượt số partition |

### Lỗi hay gặp
1. **Chỉ tăng max.poll.interval.ms lên 1 giờ**: hết rebalance, nhưng consumer treo thật sẽ giữ partition 1 giờ mà không ai phát hiện.
2. **Xử lý async trong listener rồi trả về ngay**: offset commit trước khi xử lý xong, mất message khi crash.
3. **Static membership với ID trùng nhau** giữa hai pod: một instance bị fence liên tục.

### Trả lời miệng 1 phút
"Log poll timeout cùng CommitFailedException chỉ thẳng vào max.poll.interval.ms. Mỗi poll lấy 500 record, mỗi record 1 giây là 500 giây, vượt mặc định 5 phút, consumer bị loại khỏi group, lô không commit được và bị xử lý lại, thành vòng lặp. Tôi đo thời gian mỗi lô để xác nhận. Tôi giảm max.poll.records xuống 50, đặt timeout cho API ngoài, tăng concurrency tới số partition, làm idempotent theo invoiceId, và dùng cooperative sticky cùng static membership để rebalance khi deploy nhẹ hơn."

> Senior tip: quy tắc ngón tay cái của tôi là **thời gian xử lý một lô ở p99 ≤ 1/3 max.poll.interval.ms**. Thêm metric "thời gian xử lý lô" và "số rebalance mỗi giờ" vào dashboard consumer ngay từ đầu; khi số rebalance > 0 ngoài giờ deploy, đó là cảnh báo sớm trước khi lag bùng nổ.`,
  follow: [
    'session.timeout.ms và max.poll.interval.ms phát hiện hai loại lỗi khác nhau thế nào?',
    'Cooperative rebalancing khác eager rebalancing ra sao?',
    'Xử lý song song trong một partition mà vẫn giữ thứ tự theo key thế nào?'
  ],
  tags: ['Kafka', 'rebalance', 'max.poll.interval.ms', 'consumer group', 'CommitFailedException'],
  refs: [
    { type: 'doc', title: 'Apache Kafka Documentation', url: 'https://kafka.apache.org/documentation/' },
    { type: 'doc', title: 'Spring for Apache Kafka Reference', url: 'https://docs.spring.io/spring-kafka/reference/' }
  ]
},
{
  id: 'scenario-066',
  topic: 'scenario',
  level: 'mid',
  q: 'Partition 3 của topic {{orders}} đứng yên ở offset 18.234 suốt 2 giờ, lag partition đó tăng tới 400 nghìn, trong khi các partition khác bình thường. Log consumer lặp lại cùng một lỗi parse JSON mỗi giây. Bạn xử lý "poison message" này thế nào?',
  a: `**Tóm tắt:** một message hỏng (poison message) làm consumer lỗi mãi ở cùng offset; vì Kafka xử lý tuần tự trong partition, mọi message phía sau bị kẹt. Xác minh bằng {{kafka-consumer-groups.sh --describe}} và đọc đúng offset đó; sửa bằng **ErrorHandlingDeserializer** (lỗi parse không còn nổ trong {{poll()}}), **DefaultErrorHandler** với số lần retry có giới hạn và **DeadLetterPublishingRecoverer** đẩy message lỗi sang topic DLT, phân loại lỗi không đáng retry, rồi có quy trình xem và replay DLT.

### Hiểu nhanh
Partition giống **một hàng người xếp hàng qua cửa soát vé**. Một người có vé rách, máy không đọc được; nhân viên cứ thử quét đi quét lại mãi, cả hàng phía sau đứng chờ. Cách đúng: thử vài lần, không được thì **mời người đó sang quầy riêng** (DLT) để xử lý sau, hàng tiếp tục di chuyển.

### Thuật ngữ
- **Poison message**: message mà lần xử lý nào cũng thất bại (sai định dạng, vi phạm ràng buộc dữ liệu).
- **DLT (Dead Letter Topic)**: topic chứa message không xử lý được, kèm header mô tả lỗi.
- **Retryable và non-retryable**: lỗi tạm thời (timeout DB) đáng thử lại; lỗi dữ liệu (JSON sai) thử bao nhiêu lần cũng sai.

### Triệu chứng và xác minh
~~~text
$ kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group order-svc
TOPIC  PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG     CONSUMER-ID
orders 2          991203          991210          7       order-svc-1-...
orders 3          18234           418901          400667  order-svc-2-...
orders 4          770012          770015          3       order-svc-3-...
~~~
1. Chỉ một partition đứng, CURRENT-OFFSET không nhích: đúng dấu hiệu poison message (nếu cả group chậm thì là vấn đề throughput).
2. Đọc chính message đó: {{kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic orders --partition 3 --offset 18234 --max-messages 1}}. Thấy payload bị cắt cụt hoặc producer cũ gửi {{amount}} dạng chuỗi "1,000".
3. Log lặp: "SerializationException: Error deserializing ... at offset 18234". Lỗi xảy ra **trong {{poll()}}**, trước khi tới code listener, nên handler của bạn không bắt được.

### Cơ chế vì sao bị kẹt
~~~text
poll() -> deserialize offset 18234 -> exception
offset không được commit -> lần poll sau lại đọc 18234 -> exception -> ...
Kafka không cho "nhảy cóc" trong partition: 18235.. phải chờ
~~~

### Sửa với Spring Kafka (Boot 3)
~~~yaml
spring:
  kafka:
    consumer:
      value-deserializer: org.springframework.kafka.support.serializer.ErrorHandlingDeserializer
      properties:
        spring.deserializer.value.delegate.class: org.springframework.kafka.support.serializer.JsonDeserializer
~~~
~~~java
@Bean
DefaultErrorHandler errorHandler(KafkaTemplate<Object, Object> template) {
    // Gửi message hỏng sang "orders.DLT", mặc định cùng số partition với topic gốc
    var recoverer = new DeadLetterPublishingRecoverer(template);
    // 1 lần đầu + tối đa 3 lần retry, cách nhau 1 giây; sau đó chuyển DLT và đi tiếp
    var handler = new DefaultErrorHandler(recoverer, new FixedBackOff(1000L, 3));
    handler.addNotRetryableExceptions(ConstraintViolationException.class); // lỗi dữ liệu: không retry
    return handler;
}
~~~
- {{ErrorHandlingDeserializer}} bọc deserializer thật; khi parse lỗi, nó trả về null kèm thông tin lỗi trong header, và error handler nhận được exception để chuyển sang DLT. {{DeserializationException}} mặc định đã thuộc nhóm không retry.
- Spring Boot tự gắn bean {{CommonErrorHandler}} vào container factory mặc định.
- Topic DLT phải tồn tại với **số partition ≥ topic gốc** (recoverer mặc định giữ nguyên số partition).

### Xử lý ngay trong sự cố
- Nếu chưa deploy kịp bản sửa: dừng consumer group, dùng {{kafka-consumer-groups.sh --reset-offsets --to-offset 18235 --topic orders:3 --group order-svc --execute}} để bỏ qua đúng một message, **sau khi đã lưu lại nội dung** message đó. Đây là thao tác thủ công có duyệt, không phải cách làm thường xuyên.
- Báo team producer sửa nguồn; xác định có bao nhiêu message cùng lỗi.

### Phòng ngừa
- Schema Registry (Avro/Protobuf/JSON Schema) với kiểm tra tương thích để producer không gửi được dữ liệu sai hợp đồng.
- Alert: lag của **từng partition** không đổi trong 10 phút; số message vào DLT > 0.
- Quy trình DLT: dashboard xem message, nguyên nhân (header exception), công cụ replay về topic gốc sau khi sửa.

### Lỗi hay gặp
1. **Retry vô hạn** ({{FixedBackOff}} với số lần không giới hạn) cho lỗi dữ liệu: partition kẹt mãi.
2. **Catch rồi bỏ qua im lặng** trong listener: không kẹt nhưng **mất dữ liệu** mà không ai biết.
3. **DLT ít partition hơn topic gốc**: publish vào DLT lỗi, lại kẹt ở bước recover.

### Trả lời miệng 1 phút
"Chỉ một partition đứng yên ở một offset là dấu hiệu poison message. Tôi dùng kafka-consumer-groups describe để thấy partition 3 kẹt ở 18234, đọc đúng message đó bằng console consumer và thấy JSON sai. Vì lỗi nổ ngay trong poll nên consumer đọc lại mãi. Tôi bọc deserializer bằng ErrorHandlingDeserializer, cấu hình DefaultErrorHandler retry 3 lần rồi đẩy sang DLT, đánh dấu lỗi dữ liệu là không retry. Sau đó thêm alert lag theo partition, alert DLT và quy trình replay."

> Senior tip: hãy phân biệt **lỗi tạm thời** và **lỗi dữ liệu** ngay trong thiết kế: lỗi tạm thời thì retry với backoff (kể cả retry topic), lỗi dữ liệu thì vào DLT ngay. Một DLT không ai xem chỉ là thùng rác có chi phí lưu trữ; gán owner và SLA xử lý (ví dụ trong 1 ngày làm việc) cho từng DLT.`,
  follow: [
    'Retry topic (non-blocking retry) khác retry tại chỗ của DefaultErrorHandler thế nào, và ảnh hưởng thứ tự ra sao?',
    'Khi replay message từ DLT, làm sao tránh xử lý trùng?'
  ],
  tags: ['Kafka', 'poison message', 'DLT', 'Spring Kafka', 'DefaultErrorHandler', 'ErrorHandlingDeserializer'],
  refs: [
    { type: 'doc', title: 'Spring for Apache Kafka: Handling Exceptions', url: 'https://docs.spring.io/spring-kafka/reference/kafka/annotation-error-handling.html' }
  ]
},
{
  id: 'scenario-067',
  topic: 'scenario',
  level: 'lead',
  q: 'Consumer lag của topic {{payment-events}} tăng đều mỗi ngày giờ cao điểm (từ 0 lên 700 nghìn), tối mới về 0, và tuần sau đỉnh lại cao hơn. Không có lỗi, không rebalance. Team đề xuất "thêm pod consumer". Bạn phân tích năng lực xử lý và đưa ra kế hoạch thế nào?',
  a: `**Tóm tắt:** lag tăng đều mà không lỗi nghĩa là **tốc độ vào lớn hơn tốc độ xử lý** ở giờ cao điểm. Cần đo hai con số: message vào mỗi giây và năng lực xử lý tối đa của group = số consumer **thực sự có partition** × (1 / thời gian xử lý mỗi message). Thêm pod chỉ có ích khi số consumer còn ít hơn số partition; nếu nút cổ chai là DB/API phía sau thì thêm pod còn làm tệ hơn. Kế hoạch: đo, tìm nút cổ chai, tối ưu xử lý (batch, bỏ round-trip thừa), rồi mới scale partition/consumer có tính toán, kèm alert lag theo **thời gian**.

### Hiểu nhanh
Lag giống **hàng người chờ ở quầy**. Nếu mỗi phút có 800 người đến mà các quầy chỉ phục vụ 600 người/phút, hàng dài thêm 200 người mỗi phút, dù không ai làm gì sai. Mở thêm quầy chỉ giúp nếu còn chỗ đặt quầy (partition) và **kho phía sau** (DB) chịu nổi số quầy mới.

### Thuật ngữ
- **Lag**: LOG-END-OFFSET trừ CURRENT-OFFSET (đã commit), tức số message chưa xử lý.
- **Lag theo thời gian**: message cũ nhất chưa xử lý đã chờ bao lâu; có ý nghĩa nghiệp vụ hơn số lượng.
- **Throughput mỗi consumer**: số message/giây một luồng xử lý được, ≈ 1 / thời gian xử lý mỗi message.
- **Partition skew**: một số partition nhận nhiều message hơn hẳn do key nóng.

### Số liệu thu thập
- Producer giờ cao điểm: 800 msg/s (tăng 10% mỗi tuần theo tăng trưởng người dùng).
- Topic 12 partition, group có 12 consumer thread (concurrency 4 × 3 pod).
- Thời gian xử lý trung bình mỗi message: 20ms (đọc 1 bản ghi, ghi 2 bản ghi, mỗi câu một round-trip DB).
- Năng lực tối đa: 12 × (1000 / 20) = **600 msg/s**. Thiếu 200 msg/s, tức lag tăng 720 nghìn mỗi giờ cao điểm, khớp với quan sát.

### Giả thuyết và cách xác minh
1. **Thiếu năng lực tổng thể** (như phép tính trên). Xác minh: lag tăng đều trên **mọi** partition; metric {{records-consumed-rate}} của consumer phẳng ở trần ~600 msg/s.
2. **Partition skew.** {{kafka-consumer-groups.sh --describe}}: nếu lag dồn vào 1–2 partition thì vấn đề là key nóng (ví dụ một merchant lớn), thêm consumer không giúp gì.
3. **Nút cổ chai phía sau.** Đo latency DB/API trong lúc cao điểm; nếu DB đã 85% CPU, tăng consumer sẽ chỉ đẩy latency lên.
4. **Consumer dư thừa.** Nếu số consumer thread > số partition, phần dư ngồi không; kiểm tra cột CONSUMER-ID có dòng không gán partition.

### Kế hoạch theo thứ tự chi phí
| Bước | Ví dụ | Hiệu quả ước tính |
|---|---|---|
| 1. Bớt round-trip | gom 3 câu SQL thành 1 batch, upsert | 20ms xuống ~8ms: 1.500 msg/s |
| 2. Xử lý theo lô | batch listener 100 record, insert batch | tăng thêm 2–5 lần nếu DB chịu được |
| 3. Song song trong partition theo key | thư viện parallel consumer, hoặc tự gom theo key | tăng mà vẫn giữ thứ tự theo key |
| 4. Thêm partition + consumer | 12 lên 24 | gấp đôi trần, nhưng đổi mapping key |

Thêm partition là bước **cuối** vì: số partition chỉ tăng được, không giảm; mapping {{hash(key) % partitions}} thay đổi nên các message mới của cùng một key có thể sang partition khác trong khi message cũ còn chưa xử lý, phá thứ tự trong lúc chuyển giao. Nếu buộc phải tăng, làm khi lag gần 0 hoặc chuyển sang topic mới có kế hoạch.

### Ví dụ batch listener
~~~java
@KafkaListener(topics = "payment-events", batch = "true")
public void onBatch(List<PaymentEvent> events) {
    // 1 round-trip cho cả lô thay vì 3 x N round-trip
    paymentRepository.upsertAll(events);   // JDBC batch / INSERT ... ON CONFLICT
}                                           // lỗi giữa lô: dùng BatchListenerFailedException để chỉ ra record hỏng
~~~

### Giám sát và tiêu chí thành công
- Alert theo **thời gian chờ** (ví dụ message cũ nhất > 5 phút) thay vì số lượng; công cụ như Burrow hoặc kafka-exporter + tính toán theo tốc độ.
- Dashboard: tốc độ vào, tốc độ xử lý, lag theo partition, latency DB.
- Mục tiêu năng lực: trần xử lý ≥ 2 lần đỉnh hiện tại để có chỗ cho tăng trưởng 10%/tuần và cho việc "đuổi lag" sau sự cố.

### Lỗi hay gặp
1. **Thêm pod khi consumer đã bằng số partition**: tốn tiền, không tăng throughput.
2. **Tăng concurrency mà DB đã nghẽn**: latency mỗi message tăng, throughput gần như không đổi, có khi giảm.
3. **Alert theo số lượng lag cố định**: 100 nghìn message có thể là 2 phút ở topic này nhưng 3 giờ ở topic khác.

### Trả lời miệng 1 phút
"Lag tăng đều không lỗi là bài toán năng lực: vào 800 msg/s, trong khi 12 consumer mỗi message 20ms chỉ xử lý được 600 msg/s, thiếu 200 msg/s đúng bằng tốc độ lag tăng. Thêm pod vô ích vì consumer đã bằng số partition. Tôi kiểm tra skew theo partition và tải DB, rồi tối ưu theo thứ tự rẻ nhất: gom round-trip DB, batch listener, song song theo key, cuối cùng mới tăng partition vì nó đổi mapping key và không giảm lại được. Tôi đặt alert theo thời gian chờ và mục tiêu trần xử lý gấp đôi đỉnh."

> Senior tip: khi lead review một đề xuất "scale consumer", tôi yêu cầu một phép tính trên giấy: **đỉnh vào, thời gian xử lý mỗi message, số partition, giới hạn DB**. Thường chỉ riêng việc gom round-trip DB đã cho gấp 2–3 lần throughput, rẻ hơn nhiều so với thêm hạ tầng và không đụng tới thứ tự message.`,
  follow: [
    'Làm sao xử lý partition skew khi một merchant chiếm 40% traffic?',
    'Tăng số partition của topic đang chạy cần chuẩn bị những gì?',
    'Batch listener xử lý lỗi một record giữa lô thế nào?'
  ],
  tags: ['Kafka', 'consumer lag', 'capacity planning', 'throughput', 'partition'],
  refs: [
    { type: 'doc', title: 'Apache Kafka Documentation', url: 'https://kafka.apache.org/documentation/' }
  ]
},
{
  id: 'scenario-068',
  topic: 'scenario',
  level: 'lead',
  q: 'Công ty có 40 service chạy Java 8 và Java 11, cần lên Java 21 trong 2 quý để kịp hạn hỗ trợ và chuẩn bị lên Spring Boot 3. Bạn lập kế hoạch nâng cấp, phát hiện rủi ro và tránh sự cố production thế nào?',
  a: `**Tóm tắt:** nâng cấp theo hai bước tách bạch: **chạy bytecode cũ trên JVM 21** trước (đổi runtime, chưa đổi code), rồi mới **biên dịch với {{--release 21}}** và dùng tính năng mới. Rủi ro chính nằm ở: API đã bị gỡ (Java EE modules như JAXB từ Java 11), **strong encapsulation** của JDK nội bộ (Java 16/17), thư viện dùng bytecode/reflection quá cũ (Lombok, Mockito/ByteBuddy, ASM, JaCoCo), flag JVM/GC đã bị bỏ, và thay đổi hành vi (charset mặc định UTF-8 từ Java 18, dữ liệu locale CLDR). Kiểm kê bằng {{jdeps}}/{{jdeprscan}}, canary từng service, so sánh metric trước và sau.

### Hiểu nhanh
Giống **chuyển cả công ty sang toà nhà mới**: trước hết thử cho từng phòng ban **dọn sang với nguyên đồ cũ** (đổi runtime) xem điện nước có chạy không, rồi mới **sắm nội thất mới** (đổi code, tính năng mới). Làm cả hai cùng lúc thì hỏng cái gì cũng không biết do đâu.

### Thuật ngữ
- **Runtime upgrade**: chạy file JAR cũ (biên dịch Java 8/11) trên JVM 21; Java giữ tương thích ngược ở mức bytecode rất tốt.
- **--release N**: cờ của javac để biên dịch đúng API của phiên bản N.
- **Strong encapsulation**: từ Java 16 (JEP 396) truy cập reflection vào nội bộ JDK bị chặn mặc định; Java 17 (JEP 403) bỏ hẳn cờ {{--illegal-access}}, chỉ còn mở từng gói bằng {{--add-opens}}.
- **jdeps / jdeprscan**: công cụ trong JDK tìm phụ thuộc vào API nội bộ và API đã deprecated/bị gỡ.

### Kiểm kê và phân loại rủi ro
1. {{jdeps --jdk-internals --multi-release 21 -cp 'libs/*' app.jar}}: liệt kê chỗ dùng {{sun.misc}}, {{sun.security}}...
2. {{jdeprscan --release 21 app.jar}}: API bị đánh dấu gỡ bỏ.
3. Quét build: plugin Maven/Gradle, agent (APM, JaCoCo), flag JVM trong Dockerfile/Helm.
4. Xếp hạng 40 service theo rủi ro: số thư viện cũ, mức dùng reflection, độ quan trọng nghiệp vụ.

### Những thứ hay vỡ (và triệu chứng)
| Vấn đề | Triệu chứng | Cách xử lý |
|---|---|---|
| JAXB, JAX-WS bị gỡ từ Java 11 | {{NoClassDefFoundError: javax/xml/bind/...}} | thêm dependency Jakarta XML Binding |
| Strong encapsulation | {{InaccessibleObjectException: Unable to make field ... accessible}} | nâng thư viện; tạm dùng {{--add-opens}} có ghi chú gỡ |
| Lombok/ByteBuddy/ASM cũ | lỗi biên dịch, Mockito không mock được | nâng lên bản hỗ trợ Java 21 |
| Flag JVM cũ | JVM không khởi động với {{-XX:+PrintGCDateStamps}} (Unrecognized VM option) | đổi sang unified logging {{-Xlog:gc*}} |
| CMS đã bị gỡ (Java 14) | cảnh báo bỏ qua flag, GC khác dự kiến | chọn G1 (mặc định) hoặc ZGC có đo đạc |
| Charset mặc định UTF-8 (Java 18) | file đọc/ghi sai dấu trên máy Windows/locale cũ | luôn chỉ định charset tường minh |
| Dữ liệu locale CLDR (từ Java 9) | format ngày/tiền khác trước, test so chuỗi fail | dùng pattern tường minh; xem lại test |

### Lộ trình
~~~text
Pha 0  Chuẩn bị: base image JDK 21, CI chạy test trên cả JDK cũ và 21
Pha 1  Runtime: chạy JAR cũ trên JDK 21 ở staging -> canary 5% -> 100%
Pha 2  Build: --release 21, nâng plugin/thư viện, sửa cảnh báo
Pha 3  Tận dụng: record, switch pattern, virtual threads (đo trước, bật có chọn lọc)
Mỗi pha: 2-3 service ít rủi ro đi trước làm "playbook", rồi nhân rộng
~~~

### Xác minh trên production
- So sánh trước và sau theo từng service: p99 latency, GC pause, RSS của container, CPU, số lỗi.
- Bật {{-Xlog:gc*}} và JFR ({{-XX:StartFlightRecording}}) trên canary để có dữ liệu đối chiếu.
- Lưu ý bộ nhớ: JVM mới có thể dùng metaspace/native khác trước; xem lại {{-XX:MaxRAMPercentage}} và memory limit.

### Quản trị dự án (góc nhìn lead)
- Một "BOM" thư viện chung đã được kiểm chứng trên Java 21 để 40 service dùng chung.
- Bảng theo dõi trạng thái từng service theo pha; mỗi service có owner và ngày canary.
- Tiêu chí rollback rõ ràng: lỗi tăng > X%, p99 tăng > Y% trong 30 phút thì quay về image cũ (image JDK cũ phải còn sẵn).

### Lỗi hay gặp
1. **Gộp nâng Java 21 + Spring Boot 3 + đổi GC trong một lần**: sự cố không khoanh vùng được.
2. **Rải {{--add-opens}} khắp nơi rồi quên**: nợ kỹ thuật, chặn bản nâng cấp sau.
3. **Chỉ test unit**: thay đổi charset, locale, TLS chỉ lộ ra ở test tích hợp và dữ liệu thật.

### Trả lời miệng 1 phút
"Tôi tách nâng cấp làm hai bước: trước tiên chạy JAR cũ trên JDK 21 để kiểm tra runtime, sau đó mới biên dịch với release 21 và dùng tính năng mới. Tôi kiểm kê bằng jdeps và jdeprscan, rà flag JVM, agent và thư viện dùng bytecode như Lombok, Mockito, JaCoCo. Các điểm hay vỡ là JAXB bị gỡ, strong encapsulation gây InaccessibleObjectException, flag GC cũ và charset mặc định UTF-8. Tôi cho vài service ít rủi ro đi trước làm playbook, canary từng service, so sánh p99, GC và memory, có tiêu chí rollback rõ, và không gộp chung với nâng Spring Boot 3."

> Senior tip: phần tốn thời gian nhất thường **không phải code ứng dụng** mà là chuỗi công cụ: agent APM, plugin build, image base, script vận hành dùng flag JVM cũ. Hãy kiểm kê những thứ này đầu tiên. Ở một đợt nâng cấp 30 service, hơn nửa số lỗi đến từ agent và flag JVM trong Helm chart, không phải từ code Java.`,
  follow: [
    'Bạn đánh giá có nên bật virtual threads ngay sau khi lên Java 21 không?',
    'Vì sao không nên dùng {{--add-opens}} như giải pháp lâu dài?',
    'G1 và ZGC (generational) chọn thế nào cho service latency thấp?'
  ],
  tags: ['Java 21', 'migration', 'upgrade', 'jdeps', 'strong encapsulation', 'JVM'],
  refs: [
    { type: 'doc', title: 'Oracle JDK 21 Migration Guide', url: 'https://docs.oracle.com/en/java/javase/21/migrate/index.html' },
    { type: 'doc', title: 'JEP 403: Strongly Encapsulate JDK Internals', url: 'https://openjdk.org/jeps/403' },
    { type: 'doc', title: 'JEP 400: UTF-8 by Default', url: 'https://openjdk.org/jeps/400' }
  ]
},
{
  id: 'scenario-069',
  topic: 'scenario',
  level: 'lead',
  q: 'Bạn phụ trách nâng một monolith Spring Boot 2.7 (Hibernate 5, Spring Security 5, Sleuth) lên Spring Boot 3. Bản build đầu tiên có hơn 800 lỗi biên dịch, và sau khi sửa xong thì staging xuất hiện lỗi 404 lạ, ID sinh ra bị trùng, và mất trace. Bạn lập kế hoạch và xử lý từng nhóm vấn đề thế nào?',
  a: `**Tóm tắt:** Spring Boot 3 yêu cầu **Java 17+**, dựa trên **Spring Framework 6** và **Jakarta EE** (gói {{javax.*}} của Java EE đổi thành {{jakarta.*}}), đi kèm **Hibernate 6** và **Spring Security 6**. Phần lớn 800 lỗi biên dịch là đổi namespace, làm được bằng công cụ (OpenRewrite). Những lỗi nguy hiểm là **thay đổi hành vi không báo lỗi biên dịch**: Spring MVC 6 bỏ khớp dấu gạch chéo cuối URL (gây 404), Hibernate 6 đổi cách sinh ID/sequence, Sleuth không còn được hỗ trợ (thay bằng Micrometer Tracing). Đi theo lộ trình: lên 2.7 mới nhất và hết deprecation, chạy công cụ migrate, sửa hành vi theo checklist, test đối chiếu, canary.

### Hiểu nhanh
Giống **đổi hệ thống biển số xe cả thành phố**: phần lớn công việc là thay biển ({{javax}} thành {{jakarta}}), máy làm được. Cái nguy hiểm là vài **luật giao thông cũng đổi** mà không ai báo: đường cũ không còn cho rẽ (URL có dấu "/" cuối), cách đánh số xe mới khác (sequence). Xe vẫn chạy, nhưng chạy sai.

### Thuật ngữ
- **Jakarta EE**: tên mới của Java EE sau khi chuyển sang Eclipse Foundation; từ Jakarta EE 9, gói đổi thành {{jakarta.*}}.
- **OpenRewrite**: công cụ refactor tự động theo "recipe", có recipe nâng Spring Boot 3.
- **spring-boot-properties-migrator**: dependency tạm thời, khi chạy sẽ báo các property đã đổi tên.
- **Micrometer Tracing**: lớp tracing của Boot 3, thay cho Spring Cloud Sleuth.

### Lộ trình
1. **Lên Spring Boot 2.7.x mới nhất**, sửa toàn bộ cảnh báo deprecated (nhiều API bị gỡ ở 3.0 đã được đánh dấu deprecated ở 2.x).
2. **Lên Java 17/21** trước hoặc song song (Boot 3 bắt buộc Java 17+).
3. Chạy recipe OpenRewrite nâng Boot 3 cho đổi namespace, đổi API phổ biến.
4. Thêm {{spring-boot-properties-migrator}} tạm thời để phát hiện property đổi tên; gỡ sau khi sửa.
5. Xử lý thư viện bên thứ ba còn dùng {{javax}} (ví dụ springfox phải thay bằng springdoc-openapi bản 2.x).
6. Test hồi quy, test đối chiếu API, canary.

### Nhóm 1: lỗi biên dịch (dễ, nhiều)
- {{javax.persistence}}, {{javax.servlet}}, {{javax.validation}}, {{javax.annotation.PostConstruct}} đổi thành {{jakarta.*}}.
- **Bẫy**: không find-replace mù toàn bộ {{javax.}}. Các gói thuộc JDK như {{javax.sql.DataSource}}, {{javax.crypto}}, {{javax.net.ssl}} **giữ nguyên**.
- Spring Security 6: {{WebSecurityConfigurerAdapter}} đã bị gỡ; chuyển sang bean {{SecurityFilterChain}}, {{authorizeRequests}} sang {{authorizeHttpRequests}}, {{antMatchers}} sang {{requestMatchers}}.

~~~java
@Bean
SecurityFilterChain api(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health/**").permitAll()
            .requestMatchers("/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()));
    return http.build();
}
~~~

### Nhóm 2: lỗi hành vi (khó, ít, nguy hiểm)
| Triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| {{GET /orders/}} trả 404, trước đây chạy | Spring Framework 6 tắt mặc định trailing slash match | sửa client gọi đúng URL; hoặc redirect/rewrite ở gateway trong thời gian chuyển tiếp |
| Insert lỗi trùng khoá chính hoặc thiếu sequence | Hibernate 6 đổi chiến lược đặt tên sequence mặc định (sequence riêng mỗi entity thay cho {{hibernate_sequence}} dùng chung) | khai báo sequence tường minh trên entity, hoặc tạm dùng {{hibernate.id.db_structure_naming_strategy=legacy}}; kiểm tra {{allocationSize}} khớp INCREMENT của sequence trong DB |
| Mất traceId trong log, trace không nối giữa service | Sleuth không hỗ trợ Boot 3 | {{micrometer-tracing-bridge-otel}} hoặc bridge Brave, cấu hình lại pattern log |
| Query HQL lỗi lúc chạy | Hibernate 6 parser chặt hơn, một số cú pháp cũ không còn chấp nhận | test toàn bộ repository/query với DB thật (Testcontainers) |
| Endpoint actuator đổi tên | {{httptrace}} thành {{httpexchanges}} | cập nhật dashboard/script |

### Xác minh trên staging
- Test hợp đồng API: chạy bộ request ghi lại từ production (đã ẩn dữ liệu nhạy cảm) vào bản cũ và bản mới, so sánh status code và body.
- Kiểm tra schema: bật {{spring.jpa.hibernate.ddl-auto=validate}} trên staging để phát hiện lệch giữa entity và DB.
- So sánh số lượng câu SQL mỗi request (Hibernate statistics) giữa hai bản: Hibernate 6 có thể sinh SQL khác.

### Quản trị rủi ro (góc nhìn lead)
- Nhánh nâng cấp sống ngắn, rebase thường xuyên; hoặc tách module để nâng từng phần nếu monolith đủ module hoá.
- Đóng băng tính năng lớn trong 1–2 sprint cuối.
- Canary 5% traffic với dashboard so sánh; rollback bằng image cũ (DB migration phải tương thích ngược với cả hai bản).

### Lỗi hay gặp
1. **Find-replace {{javax}} toàn bộ**: hỏng {{javax.sql}}, {{javax.crypto}}.
2. **Chỉ dựa vào biên dịch thành công**: các thay đổi hành vi (URL, sequence, tracing) không gây lỗi biên dịch.
3. **Nhảy thẳng từ Boot 2.3/2.4 lên 3**: bỏ qua các deprecation của 2.5–2.7, lỗi dồn cục.

### Trả lời miệng 1 phút
"Tôi chia vấn đề làm hai nhóm. Nhóm biên dịch: đổi javax sang jakarta, Spring Security 6 bỏ WebSecurityConfigurerAdapter, tôi dùng OpenRewrite và properties migrator sau khi đã lên 2.7 mới nhất, cẩn thận không đổi các gói javax của JDK. Nhóm hành vi mới nguy hiểm: Spring 6 tắt trailing slash match gây 404, Hibernate 6 đổi cách đặt tên sequence nên ID trùng hoặc lỗi, Sleuth phải thay bằng Micrometer Tracing. Tôi xác minh bằng replay request so sánh hai bản, ddl-auto validate và so số câu SQL, rồi canary với tiêu chí rollback rõ."

> Senior tip: hãy lập **checklist thay đổi hành vi** từ migration guide chính thức trước khi viết dòng code nào, và gán mỗi mục một cách kiểm chứng tự động. Ở một dự án, chỉ riêng việc replay 50 nghìn request thật vào staging đã bắt được 3 endpoint 404 do dấu "/" cuối URL từ app mobile cũ, những lỗi mà unit test không bao giờ thấy.`,
  follow: [
    'Bạn xử lý thế nào khi một thư viện nội bộ vẫn phụ thuộc {{javax.servlet}}?',
    'Làm sao để DB migration tương thích với cả bản Boot 2 và Boot 3 trong lúc canary?',
    'Hibernate 6 đổi chiến lược sequence ảnh hưởng gì tới {{allocationSize}}?'
  ],
  tags: ['Spring Boot 3', 'migration', 'Jakarta EE', 'Hibernate 6', 'Spring Security 6', 'Micrometer Tracing'],
  refs: [
    { type: 'doc', title: 'Spring Boot 3.0 Migration Guide', url: 'https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide' },
    { type: 'doc', title: 'Upgrading to Spring Framework 6.x', url: 'https://github.com/spring-projects/spring-framework/wiki/Upgrading-to-Spring-Framework-6.x' }
  ]
},
{
  id: 'scenario-070',
  topic: 'scenario',
  level: 'lead',
  q: 'Sau release backend lúc 10 giờ, crash rate của app Android bản 3.2 (chiếm 30% người dùng) tăng từ 0,1% lên 18%. Nguyên nhân: API đổi tên field {{fullName}} thành {{name}} và thêm giá trị enum {{PARTIALLY_SHIPPED}}. App mobile không thể "rollback" như backend. Bạn xử lý sự cố và thiết kế quy trình để không lặp lại thế nào?',
  a: `**Tóm tắt:** xử lý sự cố trước: **rollback hoặc bật lại field cũ ngay** ở backend (đây là bên duy nhất đổi được nhanh), xác nhận crash rate giảm. Sau đó xây quy tắc tiến hoá API cho client không kiểm soát được: **chỉ thay đổi theo kiểu thêm vào** (additive), giữ field cũ đến khi phần trăm traffic của app cũ dưới ngưỡng (expand → migrate → contract), client là **tolerant reader** (bỏ qua field lạ, enum lạ thành UNKNOWN), versioning khi buộc phải phá vỡ, contract test chạy trong CI, và cơ chế **phiên bản tối thiểu/buộc cập nhật** cho app.

### Hiểu nhanh
Backend như **nhà máy in thực đơn**, app mobile như **những thực khách đã in sẵn hướng dẫn đọc thực đơn trong túi**. Backend có thể in bản mới mỗi ngày, nhưng khách cầm hướng dẫn cũ vẫn đi lại hàng tháng, không thu hồi được. Đổi tên món ({{fullName}} thành {{name}}) hay thêm loại món lạ làm người cầm hướng dẫn cũ "đọc không hiểu và ngất xỉu" (crash).

### Thuật ngữ
- **Breaking change**: thay đổi làm client cũ hiểu sai hoặc lỗi: xoá/đổi tên field, đổi kiểu, thêm enum mà client parse chặt, đổi ý nghĩa.
- **Tolerant reader**: client chỉ đọc thứ mình cần, bỏ qua phần lạ.
- **Expand–contract**: thêm cái mới song song cái cũ, chuyển dần client, cuối cùng mới gỡ cái cũ.
- **Consumer-driven contract test**: client mô tả hợp đồng nó cần (Pact, Spring Cloud Contract), CI của backend kiểm tra không vi phạm.

### Xử lý sự cố (60 phút đầu)
1. **Xác nhận tương quan**: Crashlytics nhóm crash theo app version, stack trace {{JsonDataException: Required value 'fullName' missing}} và lỗi parse enum, bắt đầu từ 10:02; API log tách theo header {{User-Agent}}/{{X-App-Version}}.
2. **Hành động nhanh nhất**: rollback backend nếu release không kèm migration DB phá vỡ; nếu không rollback được, hotfix trả **cả** {{fullName}} và {{name}}, và với client bản ≤ 3.2 thì map {{PARTIALLY_SHIPPED}} về giá trị client cũ hiểu ({{SHIPPING}}) dựa trên header phiên bản.
3. **Xác nhận khôi phục**: crash rate bản 3.2 về mức nền trong 15–30 phút.
4. Thông báo CSKH/đối tác; viết postmortem không đổ lỗi.

### Cơ chế vì sao crash
~~~text
Backend mới: { "name": "An", "status": "PARTIALLY_SHIPPED" }
App 3.2: data class Order(val fullName: String, val status: Status)  // non-null
  -> parser không thấy fullName  -> exception
  -> enum Status không có PARTIALLY_SHIPPED -> exception
  -> không bắt lỗi ở tầng parse -> crash màn hình đơn hàng
~~~
Phía Java, Jackson thuần mặc định **fail** khi gặp field lạ ({{FAIL_ON_UNKNOWN_PROPERTIES}} = true); Spring Boot đã tắt cờ này cho ObjectMapper của nó. Nhưng mobile dùng thư viện và cấu hình riêng, backend không được giả định client "dễ tính".

### Quy tắc tiến hoá API
| Thay đổi | An toàn? | Cách làm đúng |
|---|---|---|
| Thêm field mới (optional) | an toàn nếu client tolerant | mặc định cho phép |
| Đổi tên field | phá vỡ | thêm field mới, giữ field cũ đến khi app cũ < ngưỡng |
| Thêm giá trị enum | phá vỡ với client parse chặt | client có UNKNOWN; server map cho bản cũ theo phiên bản |
| Đổi kiểu (số thành chuỗi) | phá vỡ | field mới tên mới |
| Xoá endpoint | phá vỡ | header {{Deprecation}}/{{Sunset}}, đo traffic, rồi mới gỡ |

Phía client (Jackson cho Java/Kotlin):
~~~java
enum Status { CREATED, SHIPPING, DELIVERED, @JsonEnumDefaultValue UNKNOWN }
// ObjectMapper: bật READ_UNKNOWN_ENUM_VALUES_USING_DEFAULT_VALUE,
// tắt FAIL_ON_UNKNOWN_PROPERTIES -> field lạ bị bỏ qua, enum lạ thành UNKNOWN
~~~

### Quy trình phòng ngừa (góc nhìn lead)
- **Contract test** cho từng bản app còn > 1% traffic, chạy trong CI backend; PR phá hợp đồng bị chặn.
- **Telemetry phiên bản**: dashboard % request theo app version; quy định gỡ field cũ chỉ khi phiên bản dùng nó < 1–2%.
- **Phiên bản tối thiểu**: endpoint cấu hình cho app biết "bản tối thiểu được hỗ trợ" để hiện màn hình buộc cập nhật (dùng cho trường hợp bảo mật hoặc cực chẳng đã).
- **Versioning**: khi buộc phải phá vỡ, mở {{/v2}} (hoặc version theo header/media type) chạy song song; có BFF cho mobile nếu nhiều app khác nhau.
- **Release backend theo feature flag** và canary theo phiên bản app.

### Lỗi hay gặp
1. **Cho rằng "đã có app bản mới" là đủ**: tỉ lệ cập nhật app thường mất nhiều tuần, có người không bao giờ cập nhật.
2. **Contract test chỉ cho bản app mới nhất**: đúng bản cũ mới là bản hay vỡ.
3. **Dùng buộc cập nhật để sửa lỗi của backend**: phạt người dùng vì lỗi của mình, ảnh hưởng đánh giá trên store.

### Trả lời miệng 1 phút
"Ưu tiên đầu là cầm máu: backend là bên duy nhất đổi nhanh được, nên tôi rollback hoặc hotfix trả cả field cũ và mới, map enum mới về giá trị cũ cho bản 3.2 dựa trên header phiên bản, rồi theo dõi crash rate trên Crashlytics về mức nền. Sau đó tôi đặt quy tắc tiến hoá API: chỉ thay đổi additive, expand–contract với ngưỡng traffic theo phiên bản, client tolerant reader với enum UNKNOWN, contract test cho mọi bản app còn đáng kể, versioning khi buộc phải phá vỡ và cơ chế phiên bản tối thiểu cho trường hợp đặc biệt."

> Senior tip: với API phục vụ mobile, hãy coi mỗi bản app đã phát hành là **một khách hàng riêng không bao giờ biến mất**. Tôi yêu cầu mọi response có thể map theo phiên bản client ngay từ đầu (header phiên bản bắt buộc), vì nó biến một sự cố "phải đợi store duyệt 2 ngày" thành một hotfix 15 phút ở server.`,
  follow: [
    'So sánh versioning qua URL, header và media type: bạn chọn cái nào cho mobile?',
    'Contract test theo kiểu consumer-driven vận hành thế nào giữa team mobile và backend?',
    'Khi nào bạn chấp nhận dùng force update?'
  ],
  tags: ['API versioning', 'backward compatibility', 'mobile', 'contract test', 'incident'],
  refs: [
    { type: 'article', title: 'Martin Fowler: Tolerant Reader', url: 'https://martinfowler.com/bliki/TolerantReader.html' },
    { type: 'article', title: 'Martin Fowler: Parallel Change', url: 'https://martinfowler.com/bliki/ParallelChange.html' }
  ]
},
{
  id: 'scenario-071',
  topic: 'scenario',
  level: 'senior',
  q: 'Sau khi lên Java 21 và bật {{spring.threads.virtual.enabled=true}} (Spring Boot 3.2+), service order không nhanh hơn mà còn thỉnh thoảng **treo hoàn toàn** vài chục giây dưới tải; HikariCP báo timeout lấy connection. Bạn chẩn đoán và quyết định thế nào?',
  a: `**Tóm tắt:** virtual thread làm việc **chờ I/O rẻ** nhưng không làm DB nhanh hơn: hàng nghìn virtual thread cùng tranh pool Hikari 20 connection nên timeout. Trên Java 21, virtual thread chặn bên trong {{synchronized}} sẽ **ghim (pin)** carrier thread; khi mọi carrier (bằng số core) bị ghim, toàn bộ virtual thread khác đứng chờ, nên service "treo". Chẩn đoán bằng thread dump JSON ({{jcmd <pid> Thread.dump_to_file -format=json}}), JFR event {{jdk.VirtualThreadPinned}} và metric pool; sửa bằng giới hạn đồng thời theo tài nguyên phía sau, thay {{synchronized}} quanh I/O bằng {{ReentrantLock}}, nâng thư viện, hoặc lên JDK 24+ (JEP 491 bỏ phần lớn pinning do synchronized).

### Hiểu nhanh
Platform thread giống **mỗi khách một nhân viên phục vụ riêng** (đắt, có hạn). Virtual thread là **phiếu xếp hàng**: rất rẻ, phát cả vạn cái, vài nhân viên (carrier) luân phiên phục vụ ai đang sẵn sàng. Nhưng nếu nhà bếp chỉ có 20 bếp (connection DB), phát bao nhiêu phiếu cũng không nấu nhanh hơn. Và nếu một nhân viên **khoá cửa phòng rồi ngồi chờ** món ăn (synchronized + I/O) thì nhân viên đó không phục vụ ai khác được; đủ số nhân viên cùng làm vậy là cả quán đứng hình.

### Thuật ngữ
- **Carrier thread**: platform thread trong ForkJoinPool mà JVM gắn virtual thread lên để chạy; mặc định số carrier bằng số core.
- **Unmount**: khi virtual thread chặn I/O, JVM gỡ nó khỏi carrier để carrier chạy việc khác.
- **Pinning**: virtual thread không unmount được (Java 21: đang trong {{synchronized}} hoặc native frame), nên chặn luôn carrier.
- **Backpressure**: giới hạn số việc đồng thời theo sức chứa của tài nguyên phía sau.

### Triệu chứng và số liệu
- Trước: Tomcat 200 platform thread, p99 180ms. Sau: p99 250ms, thỉnh thoảng 30 giây không có response nào, rồi tự hồi phục.
- {{hikaricp_connections_pending}} vọt lên 3.000; lỗi "Connection is not available, request timed out after 30000ms".
- Pod 4 core nên chỉ 4 carrier thread.

### Giả thuyết và cách xác minh
1. **Pool DB là nút cổ chai, không phải thread.** Trước đây 200 thread tự giới hạn số request vào DB; giờ không còn giới hạn đó. Xác minh: pending connection tăng tương ứng số request đồng thời.
2. **Pinning làm treo.** Chạy JFR ({{jcmd <pid> JFR.start duration=60s filename=pin.jfr}}) rồi {{jfr print --events jdk.VirtualThreadPinned pin.jfr}}: thấy stack trace pin nằm trong một method {{synchronized}} đang gọi HTTP/JDBC. Trên Java 21 cũng có thể dùng {{-Djdk.tracePinnedThreads=full}} để in stack khi pin (tuỳ chọn này đã bị gỡ ở JDK 24).
3. **Thread dump**: {{jcmd <pid> Thread.dump_to_file -format=json /tmp/td.json}} liệt kê cả virtual thread; thấy hàng nghìn virtual thread chờ connection và 4 carrier đều đang kẹt trong cùng một khối synchronized.

### Cơ chế treo từng bước
~~~text
4 carrier: C1..C4
VT-a vào synchronized(cache) -> gọi DB -> chờ connection (pool hết)
   Java 21: VT-a bị PIN, C1 bị giữ chặt
VT-b, VT-c, VT-d cũng vậy -> C2, C3, C4 bị giữ
VT đang giữ connection muốn trả lại, nhưng cần carrier để chạy tiếp -> không còn carrier
=> cả service đứng cho tới khi timeout 30s giải phóng
~~~

### Sửa
~~~java
// Trước: synchronized bao quanh I/O -> pin trên Java 21
// Sau: ReentrantLock cho phép virtual thread unmount khi chờ
private final ReentrantLock lock = new ReentrantLock();
public Price refresh(String sku) {
    lock.lock();
    try {
        return priceClient.fetch(sku);       // I/O khi đang giữ lock: tốt nhất là tránh hẳn
    } finally {
        lock.unlock();
    }
}

// Giới hạn đồng thời theo sức chứa DB, thay cho giới hạn "200 thread" cũ
private final Semaphore dbPermits = new Semaphore(40);
~~~
- **Backpressure**: Semaphore hoặc giới hạn request ở tầng web/gateway, đặt quanh tài nguyên khan hiếm (pool DB, API đối tác).
- **Nâng thư viện**: nhiều driver/thư viện đã thay synchronized bằng lock để thân thiện với virtual thread; kiểm tra release note.
- **JDK 24+** (JEP 491): virtual thread không còn bị pin khi chặn trong synchronized; nhưng Java 21 là LTS phổ biến nên vẫn cần các bước trên.
- Nếu workload chủ yếu là CPU hoặc DB đã là giới hạn, virtual thread **không mang lại lợi ích**; có thể tắt và giữ platform thread.

### Khi nào virtual thread đáng dùng
| Workload | Lợi ích |
|---|---|
| Nhiều I/O chờ lâu, gọi nhiều API chậm | cao |
| Bị giới hạn bởi pool DB nhỏ | thấp, cần backpressure |
| Tính toán CPU nặng | gần như không |

### Lỗi hay gặp
1. **Bật virtual thread rồi tăng pool Hikari lên 500**: chuyển nghẽn sang DB, có thể vượt {{max_connections}}.
2. **Dùng ThreadLocal để cache object nặng** (ví dụ buffer lớn mỗi thread): với hàng chục nghìn virtual thread, bộ nhớ tăng vọt.
3. **Pool virtual thread** (đặt vào fixed pool): sai mục đích; virtual thread được tạo mới cho mỗi task.

### Trả lời miệng 1 phút
"Virtual thread làm việc chờ I/O rẻ hơn, nhưng không tăng sức chứa DB. Khi bỏ giới hạn 200 thread của Tomcat, hàng nghìn request cùng tranh 20 connection nên Hikari timeout. Còn chuyện treo hẳn là pinning trên Java 21: virtual thread chặn trong synchronized giữ luôn carrier, 4 carrier cùng kẹt là cả service đứng. Tôi xác minh bằng JFR event VirtualThreadPinned và thread dump JSON. Tôi sửa bằng Semaphore giới hạn đồng thời theo sức chứa DB, đổi synchronized quanh I/O sang ReentrantLock, nâng thư viện, và cân nhắc JDK 24 nơi JEP 491 bỏ phần lớn pinning."

> Senior tip: trước khi bật virtual thread cho một service, tôi chạy load test với JFR bật event pinning và ghi lại **tài nguyên khan hiếm thật sự** (pool DB, rate limit đối tác). Virtual thread tháo bỏ giới hạn ngầm mà thread pool cũ vô tình tạo ra, nên phải thêm giới hạn tường minh ở đúng chỗ, nếu không bạn chỉ chuyển sự cố từ app sang DB.`,
  follow: [
    'Vì sao không nên đặt virtual thread vào một thread pool cố định?',
    'ScopedValue khác ThreadLocal thế nào và vì sao hợp với virtual thread?',
    'Khi nào bạn giữ platform thread thay vì virtual thread?'
  ],
  tags: ['Java 21', 'virtual threads', 'pinning', 'HikariCP', 'backpressure', 'Spring Boot 3.2'],
  refs: [
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'JEP 491: Synchronize Virtual Threads without Pinning', url: 'https://openjdk.org/jeps/491' }
  ]
},
{
  id: 'scenario-072',
  topic: 'scenario',
  level: 'senior',
  q: '22 giờ tối thứ Bảy, request vào {{POST /api/auth/login}} tăng từ 50 lên 3.000 request/giây, 98% trả 401, CPU các pod auth lên 95% và người dùng thật không đăng nhập được. Sáng hôm sau có 40 khách báo tài khoản bị đổi số điện thoại. Mỗi IP chỉ gửi vài request. Bạn xử lý thế nào?',
  a: `**Tóm tắt:** đây là **credential stuffing**: kẻ tấn công thử cặp email/mật khẩu bị lộ từ site khác, mỗi tài khoản chỉ thử 1 lần, qua hàng chục nghìn IP proxy, nên rate limit theo IP và khoá theo số lần sai đều không bắt được. Xử lý theo thứ tự: chặn ở biên (WAF rate-based + bot rule, challenge), giới hạn theo tín hiệu tổng hợp (tỉ lệ fail toàn cục, số username khác nhau trên mỗi IP/ASN, fingerprint), đồng thời **cứu tài khoản đã bị chiếm** (thu hồi session, buộc đặt lại mật khẩu, khoá đổi số điện thoại), rồi dài hạn là MFA, kiểm tra mật khẩu đã lộ và step-up khi thao tác nhạy cảm.

### Hiểu nhanh
Brute force giống một tên trộm thử 10.000 chìa khoá vào **một cánh cửa**. Credential stuffing là tên trộm có sẵn chùm chìa khoá ghi tên chủ nhà (lộ từ vụ hack site khác), đi **mỗi nhà thử đúng một chìa**. Vì người dùng hay dùng lại mật khẩu, tỉ lệ trúng thường khoảng 0,1–2%: 1 triệu lần thử có thể chiếm vài nghìn tài khoản.

### Triệu chứng và cách xác minh
| Tín hiệu | Brute force | Credential stuffing |
|---|---|---|
| Số username khác nhau | ít | rất nhiều, gần như mỗi request một user |
| Số lần thử mỗi user | nhiều | 1–2 |
| Số IP | ít | hàng chục nghìn (residential proxy) |
| Tỉ lệ thành công | gần 0 | 0,1–2% |

Lệnh/metric để xác minh:
- Đếm username khác nhau và IP khác nhau trong 10 phút từ log đăng nhập (nhớ log **hash** username, không log mật khẩu).
- Xem User-Agent, ASN, quốc gia: bot thường dùng vài UA giống hệt nhau, tập trung vài nhà mạng hosting/proxy.
- So tỉ lệ login thành công từ IP mới, thiết bị mới với baseline.

### Vì sao CPU lên 95%
Mật khẩu lưu bằng bcrypt cost 10–12: mỗi lần verify tốn khoảng 50–250ms CPU (cố tình chậm để chống bẻ mật khẩu). 3.000 request/giây × 0,1 giây = **300 core**. Cuộc tấn công vừa chiếm tài khoản vừa là DoS. Vì vậy phải chặn **trước** bước băm mật khẩu.

### Xử lý trong giờ đầu
1. **Biên**: bật AWS WAF rate-based rule cho đường dẫn login, managed rule Bot Control / Account Takeover Prevention nếu có, hoặc challenge/CAPTCHA cho toàn bộ login trong lúc bị tấn công.
2. **Ứng dụng**: chặn rẻ trước bcrypt.
3. **Cứu nạn nhân**: lọc các login thành công trong cửa sổ tấn công từ IP/ASN đáng ngờ, thu hồi session/refresh token, buộc reset mật khẩu, tạm khoá thao tác đổi số điện thoại/email 24 giờ và gửi thông báo cho khách.

~~~java
// Kiểm tra rẻ (Redis) chạy TRƯỚC khi gọi AuthenticationManager (bcrypt)
public void preCheck(String ip, String username) {
    long perIp = redis.opsForValue().increment("login:ip:" + ip);          // tổng lần thử theo IP
    redis.expire("login:ip:" + ip, Duration.ofMinutes(10));
    redis.opsForHyperLogLog().add("login:ipusers:" + ip, sha256(username)); // số user khác nhau/IP
    long distinctUsers = redis.opsForHyperLogLog().size("login:ipusers:" + ip);
    if (perIp > 20 || distinctUsers > 5) {
        throw new ChallengeRequiredException(); // trả 429 hoặc yêu cầu CAPTCHA, không băm mật khẩu
    }
}
~~~
- Đặt cùng thông báo lỗi chung "Email hoặc mật khẩu không đúng" để không lộ email nào tồn tại.
- **Không khoá cứng tài khoản sau N lần sai**: kẻ tấn công có thể cố tình khoá hàng loạt khách thật. Dùng khoá mềm có thời hạn hoặc yêu cầu challenge.

### Dài hạn
- **MFA** (ưu tiên passkey/TOTP hơn SMS), ít nhất bắt buộc với thiết bị mới.
- Khi đăng ký/đổi mật khẩu, kiểm tra mật khẩu đã nằm trong danh sách lộ (ví dụ API Pwned Passwords theo k-anonymity: chỉ gửi 5 ký tự đầu của SHA-1).
- **Step-up authentication** cho thao tác nhạy cảm: đổi số điện thoại, email, thêm người nhận tiền.
- Dashboard: tỉ lệ fail toàn cục, số username/IP, login thành công từ thiết bị mới; alert khi lệch baseline.

### Lỗi hay gặp
1. Chỉ rate limit theo IP: bot xoay hàng chục nghìn IP, mỗi IP vài request.
2. Khoá cứng tài khoản: tự gây DoS cho khách thật.
3. Chỉ chặn tấn công mà quên **khách đã bị chiếm**: thiệt hại thật nằm ở đó.
4. Log mật khẩu hoặc username dạng rõ trong log debug khi điều tra.

### Trả lời miệng 1 phút
"Mỗi IP vài request nhưng username gần như không lặp lại, tỉ lệ thành công khoảng 1%: đó là credential stuffing chứ không phải brute force. Tôi chặn ở biên bằng WAF rate-based và bot rule, bật challenge cho login, và trong app thêm kiểm tra rẻ bằng Redis trước bcrypt, vì bcrypt 3.000 lần mỗi giây đã tự gây DoS. Song song tôi tìm các login thành công đáng ngờ, thu hồi session, buộc reset mật khẩu và khoá đổi số điện thoại. Dài hạn là MFA, kiểm tra mật khẩu đã lộ và step-up cho thao tác nhạy cảm."

> Senior tip: theo dõi **số username khác nhau trên mỗi IP, ASN và fingerprint thiết bị**, không chỉ số request. Và luôn có sẵn một "công tắc" bật challenge cho toàn bộ login (feature flag hoặc rule WAF để sẵn ở chế độ Count) để bật trong 1 phút khi bị tấn công, thay vì viết code lúc 22 giờ đêm.`,
  follow: [
    'Vì sao khoá cứng tài khoản sau 5 lần sai lại nguy hiểm trong trường hợp này?',
    'Làm sao phát hiện tài khoản đã bị chiếm sau khi cuộc tấn công đã qua?',
    'Step-up authentication khác MFA khi đăng nhập thế nào?'
  ],
  tags: ['credential stuffing', 'account takeover', 'WAF', 'rate limit', 'bcrypt', 'MFA'],
  refs: [
    { type: 'doc', title: 'OWASP Credential Stuffing Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html' },
    { type: 'doc', title: 'AWS WAF rate-based rule statement', url: 'https://docs.aws.amazon.com/waf/latest/developerguide/waf-rule-statement-type-rate-based.html' }
  ]
},
{
  id: 'scenario-073',
  topic: 'scenario',
  level: 'senior',
  q: 'Tính năng "đổi avatar bằng URL" của bạn tải ảnh từ URL người dùng nhập. Pentester nhập {{http://169.254.169.254/latest/meta-data/iam/security-credentials/}} và nhận về nội dung có tên IAM role của máy chủ. Bạn đánh giá mức độ và sửa thế nào?',
  a: `**Tóm tắt:** đây là **SSRF (Server-Side Request Forgery)**: server của bạn đi gọi URL thay cho kẻ tấn công, từ bên **trong** mạng, nên với tới được những chỗ Internet không với tới: metadata của cloud, admin nội bộ, Redis, actuator. Ngay lập tức: tắt tính năng hoặc chặn bằng allowlist, bắt buộc **IMDSv2** và kiểm tra CloudTrail xem credential của role có bị dùng từ ngoài không. Sửa đúng: chỉ cho {{https}}, phân giải DNS rồi chặn mọi IP nội bộ/link-local, không tự follow redirect, giới hạn kích thước/thời gian, và quan trọng nhất là **chặn egress ở tầng mạng** (proxy có allowlist), vì kiểm tra trong code luôn có kẽ hở.

### Hiểu nhanh
Bạn nhờ lễ tân toà nhà (server) "lấy giùm tôi tập tài liệu ở địa chỉ này". Kẻ xấu đưa địa chỉ "phòng két sắt tầng hầm". Người ngoài không vào được phòng đó, nhưng lễ tân thì có thẻ ra vào.

### Vì sao 169.254.169.254 nguy hiểm
Đó là Instance Metadata Service của EC2 (link-local). Với **IMDSv1**, một GET đơn giản tới {{/latest/meta-data/iam/security-credentials/<role>}} trả về **access key tạm thời** của role. Kẻ tấn công dùng key đó từ máy họ để đọc S3, DynamoDB... với quyền của server. Pentester mới thấy tên role, nhưng chỉ cần thêm tên role vào URL là lấy được key.

**IMDSv2** yêu cầu trước tiên gửi PUT để lấy token rồi đính token vào header; tính năng tải ảnh thường chỉ gửi GET và không cho kẻ tấn công đặt header, nên IMDSv2 chặn được kiểu SSRF phổ biến này. Đặt thêm hop limit = 1 để container không với tới metadata qua thêm một bước mạng (trên EKS nên dùng IRSA/EKS Pod Identity thay vì role của node).

### Xác minh mức độ
1. Kiểm tra instance đang ở {{HttpTokens=optional}} (IMDSv1 còn bật) hay {{required}}.
2. CloudTrail: tìm các API call dùng credential của role đó từ IP **không phải** của instance. Có thì coi là bị xâm nhập: thu hồi session của role, xoay vòng mọi secret role đọc được.
3. Log ứng dụng: các URL avatar trỏ tới IP nội bộ, {{localhost}}, {{file:}}, cổng lạ (6379, 8080/actuator).

### Sửa trong code
~~~java
HttpClient client = HttpClient.newBuilder()
    .followRedirects(HttpClient.Redirect.NEVER)   // redirect tới IP nội bộ là đường vòng phổ biến
    .connectTimeout(Duration.ofSeconds(3))
    .build();

void validate(URI uri) throws UnknownHostException {
    if (!"https".equals(uri.getScheme())) throw new BadRequest("chỉ chấp nhận https");
    for (InetAddress ip : InetAddress.getAllByName(uri.getHost())) {   // kiểm tra MỌI IP
        if (ip.isLoopbackAddress() || ip.isLinkLocalAddress() || ip.isSiteLocalAddress()
                || ip.isAnyLocalAddress() || ip.isMulticastAddress() || isUniqueLocalV6(ip)) {
            throw new BadRequest("địa chỉ không được phép");
        }
    }
}
~~~
- Giới hạn kích thước đọc (ví dụ 5 MB) và tổng thời gian; giải mã thử thành ảnh, không trả nội dung thô cho người dùng (SSRF "mù" vẫn nguy hiểm nhưng bớt lộ dữ liệu).
- Hàm chặn phải bao cả IPv6 (ví dụ {{fc00::/7}} không nằm trong {{isSiteLocalAddress}}), dải {{100.64.0.0/10}} và IPv4 viết lạ ({{http://2852039166}}, {{0x7f.1}}): dùng parser chuẩn rồi kiểm tra IP đã phân giải, không so chuỗi.

### Vì sao code thôi chưa đủ: DNS rebinding
Kẻ tấn công điều khiển DNS của domain: lần phân giải để kiểm tra trả IP công khai, lần phân giải khi kết nối (vài ms sau) trả {{169.254.169.254}}. Kiểm tra trong code đã qua nhưng kết nối vẫn đi vào trong. Cách chặn chắc: cho mọi request ra ngoài của tính năng này đi qua **egress proxy** riêng chỉ cho phép IP công khai (hoặc chỉ cho phép danh sách domain cụ thể), đặt service vào subnet/NetworkPolicy không có đường tới mạng nội bộ.

### Phương án thay thế tốt hơn
| Cách | Rủi ro SSRF | Ghi chú |
|---|---|---|
| Server tải từ URL bất kỳ | cao | cần đủ mọi lớp chặn |
| Allowlist domain (chỉ Gravatar, CDN đối tác) | thấp | đủ cho đa số nhu cầu |
| Client upload thẳng lên S3 qua presigned URL | gần như không | server không gọi URL lạ |

### Lỗi hay gặp
1. Blacklist chuỗi "169.254" hoặc "localhost": bị vượt bằng IP dạng thập phân, IPv6, domain trỏ về IP nội bộ.
2. Kiểm tra URL đầu nhưng để HTTP client tự follow redirect.
3. Trả lỗi chi tiết ("connection refused port 6379"), biến SSRF mù thành công cụ quét cổng.

### Trả lời miệng 1 phút
"Đây là SSRF, mức nghiêm trọng cao vì trên EC2 với IMDSv1 bước tiếp theo là lấy được access key của role. Tôi tắt tính năng, bật IMDSv2 bắt buộc, hop limit 1, rồi tra CloudTrail xem credential role có bị dùng từ IP lạ không. Về code, chỉ cho https, phân giải DNS và chặn mọi IP nội bộ, link-local, IPv6 local, không follow redirect, giới hạn kích thước và timeout. Nhưng vì DNS rebinding, tôi bắt mọi request ra ngoài đi qua egress proxy có allowlist, và nếu được thì đổi thiết kế sang upload qua presigned URL."

> Senior tip: mỗi khi thấy tính năng "nhập URL" (webhook, import từ link, preview link, PDF render HTML), coi như một bề mặt SSRF. Tôi gom tất cả về **một** HTTP client dùng chung có sẵn chặn IP, timeout, giới hạn kích thước và đi qua egress proxy, để dev mới không tự viết lại và quên một bước.`,
  follow: [
    'IMDSv2 chặn được SSRF qua cơ chế nào, và trường hợp nào nó không chặn được?',
    'DNS rebinding hoạt động thế nào và vì sao kiểm tra IP trong code không đủ?',
    'Webhook do khách hàng đăng ký URL thì bạn áp dụng các biện pháp trên ra sao?'
  ],
  tags: ['SSRF', 'IMDSv2', 'AWS', 'egress', 'DNS rebinding', 'OWASP'],
  refs: [
    { type: 'doc', title: 'OWASP Server-Side Request Forgery Prevention Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html' },
    { type: 'doc', title: 'AWS: Configure the Instance Metadata Service options', url: 'https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html' }
  ]
},
{
  id: 'scenario-074',
  topic: 'scenario',
  level: 'mid',
  q: 'GitHub gửi cảnh báo secret scanning: một AWS access key nằm trong {{application-dev.yml}} của repo, được commit từ 3 tuần trước. Dev đã "sửa" bằng một commit xoá dòng đó và nói "xong rồi". Vì sao chưa xong, và bạn làm từng bước thế nào?',
  a: `**Tóm tắt:** commit xoá chỉ làm secret biến mất khỏi **phiên bản mới nhất**; Git lưu toàn bộ lịch sử, nên ai clone repo, mở commit cũ, xem pull request cũ hay fork đều thấy key. Thứ tự đúng: **thu hồi/xoay vòng key trước** (vài phút), kiểm tra CloudTrail xem key đã bị dùng chưa, rồi mới dọn lịch sử bằng {{git filter-repo}} hoặc BFG, force push, yêu cầu mọi người clone lại, và chặn tái phát bằng push protection + pre-commit scan + dùng Secrets Manager.

### Hiểu nhanh
Git giống một cuốn sổ nhật ký **không bao giờ xé trang**: commit mới chỉ là một trang mới ghi "dòng kia đã xoá", trang cũ vẫn còn nguyên. Và cuốn sổ đã được photo cho mọi người clone repo.

### Vì sao phải xoay key trước khi dọn lịch sử
- Repo public: bot quét GitHub tìm AWS key liên tục; key lộ thường bị thử trong vài phút. 3 tuần là quá đủ.
- Dọn lịch sử không xoá được bản đã nằm trong clone của người khác, fork, CI cache, bản sao trong log.
- Vì vậy: **coi key đã bị lộ**. Dọn lịch sử chỉ là vệ sinh, không phải biện pháp chính.

### Các bước
1. **Thu hồi**: trong IAM, tạo key mới cho ứng dụng (nếu thật sự cần key dài hạn), cập nhật nơi dùng, rồi **deactivate** và sau đó xoá key cũ.
2. **Điều tra**: CloudTrail Event history lọc theo access key id để xem có API call lạ (tạo EC2 đào coin, đọc S3, tạo IAM user mới để duy trì truy cập). Có thì chuyển sang quy trình sự cố bảo mật.
3. **Dọn lịch sử** (khi đã báo team tạm dừng push):

~~~bash
# Cách 1: git filter-repo (công cụ được Git khuyến nghị thay cho filter-branch)
git clone --mirror git@github.com:acme/order-service.git
cd order-service.git
# replacements.txt chứa từng secret, mỗi dòng: AKIAXXXXXXXX==>***REMOVED***
git filter-repo --replace-text ../replacements.txt
git push --force --mirror origin

# Cách 2: BFG Repo-Cleaner (Java, nhanh với repo lớn)
java -jar bfg.jar --replace-text ../replacements.txt order-service.git
cd order-service.git && git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
~~~
- BFG mặc định **không sửa commit mới nhất** (HEAD được bảo vệ): phải xoá secret ở commit mới trước, điều mà commit "xoá dòng" đã làm.
- Ghi lại: filter-repo/BFG **đổi hash mọi commit** từ điểm có secret trở đi; PR đang mở và branch của người khác sẽ lệch.
4. **Sau force push**: mọi người clone lại (không pull/merge từ bản cũ, nếu không secret quay lại). Trên GitHub, commit cũ còn có thể truy cập qua ref của pull request hoặc cache; theo tài liệu GitHub, cần liên hệ GitHub Support để xoá hẳn.
5. **Đóng alert** secret scanning với lý do "revoked".

### Chặn tái phát
| Lớp | Công cụ | Chặn ở đâu |
|---|---|---|
| Máy dev | pre-commit hook (gitleaks, git-secrets) | trước khi commit |
| GitHub | secret scanning + **push protection** | từ chối push có secret nhận diện được |
| CI | quét secret trong pipeline | trước khi merge |
| Kiến trúc | Secrets Manager, IAM role/IRSA thay cho access key | không có secret để lộ |

Trong Spring Boot, file cấu hình chỉ nên tham chiếu biến môi trường, ví dụ placeholder trỏ tới biến môi trường {{DB_PASSWORD}}, còn giá trị do Secrets Manager / Kubernetes Secret cung cấp lúc chạy.

### Lỗi hay gặp
1. Dọn lịch sử trước, xoay key sau (hoặc quên xoay).
2. Chỉ {{git rm}} file rồi commit.
3. Force push nhưng một đồng nghiệp push lại branch cũ, secret quay lại.
4. Thay key bằng key mới nhưng vẫn để trong file YAML.

### Trả lời miệng 1 phút
"Commit xoá chỉ sửa phiên bản mới nhất; lịch sử, clone, fork và PR cũ vẫn chứa key, và bot quét GitHub tìm key trong vài phút. Nên việc đầu tiên là deactivate key trong IAM, thay key mới, rồi tra CloudTrail xem key đã bị dùng chưa. Sau đó tôi dọn lịch sử bằng git filter-repo hoặc BFG trên mirror clone, force push, yêu cầu mọi người clone lại và nhờ GitHub Support xoá cache nếu cần. Cuối cùng bật push protection, pre-commit scan và chuyển hẳn sang Secrets Manager hoặc IAM role để không còn access key dài hạn."

> Senior tip: mục tiêu thật là **không có secret dài hạn nào để lộ**: ứng dụng trên AWS dùng IAM role (EC2 instance profile, IRSA/EKS Pod Identity, ECS task role), CI dùng OIDC federation thay cho access key lưu trong secret của pipeline. Khi đó một commit lỡ tay chỉ lộ cấu hình, không lộ quyền.`,
  follow: [
    'Nếu repo là private thì quy trình có khác không, có được bỏ bước xoay key không?',
    'Push protection của GitHub chặn được và không chặn được loại secret nào?',
    'CI dùng OIDC để vào AWS thay cho access key hoạt động thế nào?'
  ],
  tags: ['secret leak', 'git filter-repo', 'BFG', 'GitHub secret scanning', 'push protection', 'IAM'],
  refs: [
    { type: 'doc', title: 'GitHub Docs: Removing sensitive data from a repository', url: 'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository' },
    { type: 'doc', title: 'GitHub Docs: About push protection', url: 'https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection' },
    { type: 'doc', title: 'git-filter-repo', url: 'https://github.com/newren/git-filter-repo' }
  ]
},
{
  id: 'scenario-075',
  topic: 'scenario',
  level: 'senior',
  q: '17 giờ thứ Sáu, một CVE điểm CVSS 10 được công bố cho một thư viện Java phổ biến (kiểu Log4Shell), đã có mã khai thác công khai. Công ty bạn có 35 service, không ai chắc service nào dùng thư viện đó. Bạn điều phối 72 giờ tiếp theo thế nào?',
  a: `**Tóm tắt:** chạy theo 4 pha song song có người phụ trách: (1) **kiểm kê** trong 2–4 giờ: service nào có thư viện, phiên bản nào, kể cả phụ thuộc bắc cầu và image đang chạy thật; (2) **giảm thiểu tạm** cho cái lộ ra Internet (WAF rule, cờ cấu hình, gỡ class bị lỗi) trong khi chờ bản vá; (3) **vá** theo thứ tự rủi ro: public-facing trước, nội bộ sau, build lại image và xác minh trong artifact; (4) **kiểm tra đã bị khai thác chưa** qua log. Sau đó mới là bài học: SBOM, quét dependency tự động, quy trình vá khẩn có SLA.

### Hiểu nhanh
Giống thông báo thu hồi một loại phanh xe lỗi: trước hết phải biết **xe nào** trong đội lắp phanh đó (kể cả phanh nằm trong bộ phận mua từ hãng khác), rồi cấm xe chạy đường đèo (giảm thiểu), thay phanh xe chở khách trước, và kiểm tra xe nào đã từng gặp sự cố.

### Pha 1: kiểm kê (giờ 0–4)
Không dựa vào trí nhớ của team. Phụ thuộc bắc cầu là chỗ hay sót.
~~~bash
# Maven: tìm thư viện ở mọi tầng phụ thuộc
mvn dependency:tree -Dincludes=org.apache.logging.log4j
# Gradle
./gradlew dependencyInsight --dependency log4j-core --configuration runtimeClasspath
# Kiểm tra artifact đang CHẠY thật (code trên main có thể khác image đang deploy)
unzip -l app.jar | grep log4j-core
trivy image registry.acme.vn/order-service:1.42.0
~~~
Ghi kết quả vào một bảng chung: service, phiên bản, lộ Internet không, owner, trạng thái. Đây là "nguồn sự thật" cho mọi cập nhật.

Ví dụ Log4Shell: Spring Boot mặc định dùng **Logback**; {{log4j-api}} và {{log4j-to-slf4j}} có mặt trong starter logging nhưng không chứa lỗ hổng, chỉ {{log4j-core}} bị ảnh hưởng (khi dùng {{spring-boot-starter-log4j2}} hoặc kéo vào qua thư viện khác như Elasticsearch cũ). Hiểu đúng điều này tránh hoảng loạn vá nhầm chỗ.

### Pha 2: giảm thiểu tạm
- WAF rule chặn mẫu khai thác đã biết (chỉ là lớp mỏng, payload biến thể sẽ lọt).
- Cờ cấu hình hoặc gỡ class lỗi theo khuyến nghị của nhà phát triển (với Log4Shell: gỡ {{JndiLookup.class}} khỏi jar; cờ {{formatMsgNoLookups}} về sau được chứng minh là chưa đủ).
- Chặn egress: service không cần gọi ra Internet thì không cho gọi; nhiều khai thác cần tải payload từ ngoài.

### Pha 3: vá
- Spring Boot quản lý phiên bản qua BOM: ghi đè bằng property (ví dụ {{log4j2.version}} trong Maven với {{spring-boot-starter-parent}}) rồi kiểm tra lại bằng {{dependency:tree}}, vì một thư viện có thể shade (đóng gói sẵn) thư viện lỗi bên trong jar của nó.
- Thứ tự: public-facing, xử lý input người dùng, có dữ liệu nhạy cảm, rồi nội bộ.
- Theo dõi bản vá kế tiếp: Log4Shell cần 4 lần nâng (2.15.0, 2.16.0, 2.17.0, 2.17.1) vì các CVE liên quan nối tiếp. Đừng tuyên bố "xong" khi nhà phát triển còn đang phân tích.

### Pha 4: đã bị khai thác chưa?
- Tìm chuỗi khai thác trong access log, WAF log từ **trước** ngày công bố (lỗ hổng có thể bị dùng trước khi công khai).
- Kết nối ra ngoài bất thường (VPC Flow Logs, DNS query lạ).
- Có dấu hiệu thì chuyển sang quy trình sự cố bảo mật: cô lập, xoay vòng secret service đó đọc được.

### Điều phối con người
| Vai trò | Việc |
|---|---|
| Điều phối | giữ bảng trạng thái, cập nhật mỗi 2–4 giờ cho lãnh đạo/security |
| Kiểm kê | 1–2 người chạy script trên toàn bộ repo + registry |
| Owner từng service | vá, deploy, xác nhận trong bảng |
| Security | theo dõi khuyến nghị mới, phân tích log khai thác |
Chia ca: không ai làm 30 giờ liên tục; người mệt deploy nhầm còn tệ hơn chậm vài giờ.

### Lỗi hay gặp
1. Chỉ kiểm tra code trên nhánh main, bỏ qua image đang chạy và service "không ai đụng 2 năm".
2. Quên phụ thuộc bắc cầu và jar shade.
3. Tin rằng WAF rule là đủ rồi dừng vá.
4. Không ghi lại tiến độ, đến thứ Hai không ai biết service nào đã xong.

### Trả lời miệng 1 phút
"Tôi chia bốn pha có người phụ trách. Đầu tiên kiểm kê trong vài giờ bằng dependency tree và quét image đang chạy thật, vì phụ thuộc bắc cầu là chỗ hay sót, ghi vào một bảng chung. Song song, giảm thiểu tạm cho service lộ Internet bằng WAF rule, cấu hình hoặc gỡ class lỗi và chặn egress. Rồi vá theo thứ tự rủi ro, ghi đè phiên bản trong BOM của Spring Boot và xác minh trong artifact. Cuối cùng tra log xem đã bị khai thác chưa, kể cả trước ngày công bố. Sau sự cố, tôi đưa SBOM và quét dependency vào CI để lần sau kiểm kê mất vài phút thay vì vài giờ."

> Senior tip: thời gian trả lời câu "chúng ta có bị ảnh hưởng không?" là thước đo độ trưởng thành. Khi mỗi build sinh **SBOM** (ví dụ CycloneDX) và lưu cùng image, kiểm kê chỉ còn là một truy vấn. Tôi cũng đặt SLA vá theo mức độ (ví dụ critical lộ Internet: 48 giờ) và có sẵn pipeline "rebuild tất cả service" để nâng một thư viện cho 35 service trong một buổi chiều.`,
  follow: [
    'SBOM là gì và nó giúp gì khi có CVE mới?',
    'Làm sao phát hiện một thư viện bị shade (đóng gói lại) bên trong jar khác?',
    'Bạn ưu tiên vá service nào trước khi không đủ người làm cùng lúc?'
  ],
  tags: ['CVE', 'Log4Shell', 'dependency', 'SBOM', 'incident', 'patching'],
  refs: [
    { type: 'doc', title: 'Apache Log4j Security Vulnerabilities', url: 'https://logging.apache.org/log4j/2.x/security.html' },
    { type: 'doc', title: 'NVD: CVE-2021-44228', url: 'https://nvd.nist.gov/vuln/detail/CVE-2021-44228' },
    { type: 'doc', title: 'OWASP Vulnerable Dependency Management Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Vulnerable_Dependency_Management_Cheat_Sheet.html' }
  ]
},
{
  id: 'scenario-076',
  topic: 'scenario',
  level: 'senior',
  q: 'Hoá đơn AWS tháng này là 36.000 USD, gấp 3 tháng trước, trong khi traffic chỉ tăng 15%. CFO hỏi nguyên nhân trong 2 ngày. Bạn tìm và xử lý thế nào?',
  a: `**Tóm tắt:** đừng đoán; đi từ trên xuống bằng **Cost Explorer**: nhóm theo service, rồi theo **usage type**, theo account/tag, theo ngày để thấy **ngày bắt đầu tăng**, rồi đối chiếu với lịch deploy. Các "thủ phạm" hay gặp khi chi phí tăng mà traffic không tăng: **NAT Gateway data processing**, **CloudWatch Logs ingestion**, **data transfer giữa AZ/ra Internet**, tài nguyên bị bỏ quên (EBS, snapshot, môi trường test), và autoscaling không scale xuống. Sửa xong thì gắn chặn: Budgets, Cost Anomaly Detection, tag bắt buộc và người sở hữu chi phí.

### Hiểu nhanh
Hoá đơn điện tăng gấp ba thì không đi kiểm tra từng bóng đèn; bạn xem đồng hồ từng tầng, rồi từng phòng, rồi ngày nào bắt đầu tăng và hôm đó ai lắp thêm cái gì.

### Bước 1: khoanh vùng trong 1 giờ
1. Cost Explorer, granularity **Daily**, group by **Service**: thấy đường gấp khúc tăng từ ngày 8.
2. Lọc service tăng nhiều nhất, group by **Usage type**. Ví dụ: EC2-Other tăng mạnh, usage type là {{NatGateway-Bytes}}; CloudWatch tăng, usage type là {{DataProcessing-Bytes}} (log ingestion).
3. Group by **tag** (team, service) hoặc linked account để biết ai sở hữu.
4. Đối chiếu ngày 8 với lịch deploy: release đó thêm gì?

### Ví dụ một ca thật (số làm tròn, giá us-east-1 tham khảo)
| Hạng mục | Tháng trước | Tháng này | Nguyên nhân |
|---|---|---|---|
| NAT Gateway xử lý dữ liệu | 600 | 9.000 | service ảnh mới tải ảnh gốc từ S3 qua NAT: khoảng 200 TB × 0,045 USD/GB |
| CloudWatch Logs ingestion | 900 | 7.500 | release ngày 8 để log DEBUG, khoảng 15 TB × 0,50 USD/GB |
| Data transfer giữa AZ | 700 | 3.500 | consumer gọi chéo AZ cho mỗi message |
| EBS + snapshot mồ côi | 300 | 1.800 | job test tạo volume không xoá |

Bài học: **dịch vụ "phụ" (NAT, log, transfer) mới là thứ tăng âm thầm**, vì chúng tính theo GB và không ai nhìn.

### Bước 2: sửa
- **S3 qua Gateway VPC Endpoint**: lưu lượng tới S3 (và DynamoDB) cùng region đi qua gateway endpoint, không qua NAT, và gateway endpoint không tính phí.
- Log: trả về INFO, sampling log request thành công, đặt **retention** cho log group (mặc định là giữ vĩnh viễn), đưa log ít dùng sang lớp lưu rẻ hơn.
- Data transfer: ưu tiên gọi trong cùng AZ (topology-aware routing trên Kubernetes, Kafka consumer {{client.rack}} để đọc từ replica cùng AZ), nén payload.
- Dọn dẹp: volume unattached, snapshot quá hạn, môi trường preview không ai dùng; đặt lịch tắt môi trường dev ngoài giờ.

### Bước 3: chặn tái phát
- **AWS Budgets** cảnh báo theo ngưỡng thực tế và dự báo; **Cost Anomaly Detection** báo khi một service tăng bất thường (đợt này lẽ ra được báo từ ngày 9 chứ không phải cuối tháng).
- Tag bắt buộc (team, service, env) bằng policy; báo cáo chi phí theo team mỗi tuần.
- Với phân tích sâu: xuất dữ liệu chi phí chi tiết (Cost and Usage Report / Data Exports) vào S3 và truy vấn bằng Athena.
- Review chi phí trong design review: "tính năng này chuyển bao nhiêu GB qua NAT/AZ mỗi ngày?".

### Lỗi hay gặp
1. Đi thẳng vào mua Savings Plans/Reserved Instance: giảm giá cho cái đang lãng phí, khoá cam kết 1–3 năm.
2. Chỉ nhìn EC2/RDS, bỏ qua EC2-Other (NAT, EBS, transfer) và CloudWatch.
3. Tắt log/metric hàng loạt để tiết kiệm rồi mù khi có sự cố.

### Trả lời miệng 1 phút
"Tôi không đoán mà dùng Cost Explorer theo ngày, nhóm theo service rồi theo usage type để thấy chính xác hạng mục nào tăng và tăng từ ngày nào, rồi đối chiếu với lịch deploy. Khi chi phí tăng mà traffic không tăng, thủ phạm thường là NAT Gateway, CloudWatch Logs, data transfer giữa AZ hoặc tài nguyên bị bỏ quên. Ví dụ tải S3 qua NAT thì chuyển sang gateway endpoint miễn phí, log DEBUG thì về INFO và đặt retention. Sau đó tôi bật Budgets, Cost Anomaly Detection và tag theo team để lần sau phát hiện trong một ngày chứ không phải cuối tháng."

> Senior tip: báo cáo cho CFO bằng ba cột: **nguyên nhân, số tiền, đã sửa chưa**, kèm dự báo tháng sau. Lãnh đạo chấp nhận sai sót, không chấp nhận "chưa biết". Và tôi đưa chi phí thành một metric của team như latency: khi mỗi team thấy hoá đơn của mình hằng tuần, phần lớn lãng phí tự biến mất.`,
  follow: [
    'Vì sao NAT Gateway hay là nguồn chi phí bất ngờ trên AWS?',
    'Khi nào nên mua Savings Plans, và vì sao không mua ngay khi thấy hoá đơn cao?',
    'Bạn thiết kế tag và phân bổ chi phí cho 10 team dùng chung một EKS cluster thế nào?'
  ],
  tags: ['AWS', 'cost', 'FinOps', 'NAT Gateway', 'CloudWatch Logs', 'Cost Explorer'],
  refs: [
    { type: 'doc', title: 'AWS Cost Explorer', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-what-is.html' },
    { type: 'doc', title: 'Gateway endpoints for Amazon S3', url: 'https://docs.aws.amazon.com/vpc/latest/privatelink/vpc-endpoints-s3.html' },
    { type: 'doc', title: 'AWS Cost Anomaly Detection', url: 'https://docs.aws.amazon.com/cost-management/latest/userguide/manage-ad.html' }
  ]
},
{
  id: 'scenario-077',
  topic: 'scenario',
  level: 'mid',
  q: 'Pipeline CI của service order đỏ khoảng 1/4 số lần chạy, bấm "Re-run" thì thường xanh. Team đã quen bấm re-run, và tuần trước một bug thật bị merge vì ai cũng nghĩ "lại flaky". Bạn tìm và sửa test flaky thế nào ở mức code?',
  a: `**Tóm tắt:** test flaky là test cho kết quả khác nhau khi **code không đổi**. Nguyên nhân gần như luôn thuộc vài nhóm: phụ thuộc **thứ tự chạy/state dùng chung**, **thời gian thật**, **bất đồng bộ dùng sleep**, **thứ tự không xác định** (HashMap, query không ORDER BY), **tài nguyên dùng chung** (port, DB, file). Quy trình: thu thập dữ liệu test nào flaky, tái hiện bằng cách chạy lặp và xáo thứ tự, sửa đúng nhóm nguyên nhân, và trong lúc chờ sửa thì **cách ly** (quarantine) có chủ và hạn chót thay vì bấm re-run.

### Hiểu nhanh
Một chiếc cân lúc đúng lúc sai thì người ta thôi tin cân, kể cả khi nó báo đúng. Test flaky làm hỏng chính thứ test sinh ra để cung cấp: **niềm tin**.

### Bước 1: biết test nào flaky
- Bật rerun có ghi nhận của Surefire: {{mvn test -Dsurefire.rerunFailingTestsCount=2}}; test fail rồi pass khi chạy lại sẽ được báo là "flaky" trong report thay vì im lặng.
- Lưu kết quả test qua nhiều lần build (report JUnit XML) để xếp hạng test fail nhiều nhất.

### Bước 2: tái hiện
~~~bash
# Chạy một test lặp 50 lần, đếm số lần fail
for i in $(seq 1 50); do mvn -q test -Dtest=OrderServiceTest || echo "FAIL lần $i"; done
# Xáo thứ tự class test để lộ phụ thuộc thứ tự
mvn test -Dsurefire.runOrder=random
~~~
Trong JUnit 5 có thể tạm đổi {{@Test}} thành {{@RepeatedTest(200)}} để thấy tỉ lệ fail, và dùng {{@TestMethodOrder(MethodOrderer.Random.class)}}.

### Bước 3: sửa theo nhóm nguyên nhân
| Nhóm | Dấu hiệu | Cách sửa |
|---|---|---|
| State dùng chung | chạy riêng thì pass, chạy cả bộ thì fail | dọn DB sau mỗi test, không dùng biến static, không phụ thuộc test khác |
| Thời gian thật | fail gần nửa đêm, cuối tháng, khác timezone CI | inject {{Clock}}, dùng {{Clock.fixed}} trong test |
| Async + sleep | fail khi máy CI chậm | chờ theo điều kiện có timeout (Awaitility) |
| Thứ tự không xác định | so sánh list từ HashMap/query | so sánh không theo thứ tự hoặc thêm ORDER BY |
| Tài nguyên chung | port bị chiếm, Testcontainers chậm | port ngẫu nhiên, mỗi test dữ liệu riêng |

~~~java
// Sai: phụ thuộc thời gian thật và sleep cố định
order.place();
Thread.sleep(500);                                   // máy CI chậm hơn 500ms -> fail
assertEquals(LocalDate.now(), order.getDate());      // 23:59:59.9 -> 00:00 -> fail

// Đúng: thời gian cố định, chờ theo điều kiện
Clock clock = Clock.fixed(Instant.parse("2026-01-15T10:00:00Z"), ZoneOffset.UTC);
OrderService service = new OrderService(repo, clock);    // service nhận Clock qua constructor
service.place(order);
await().atMost(Duration.ofSeconds(5))                    // Awaitility: tối đa 5s, xong sớm thì đi tiếp
       .untilAsserted(() -> assertEquals(PLACED, repo.status(order.id())));
~~~

### Bước 4: cách ly có kỷ luật
- Đánh {{@Tag("quarantine")}}, loại khỏi pipeline chặn merge nhưng vẫn chạy ở job riêng để theo dõi.
- Mỗi test bị cách ly phải có ticket, **người sở hữu và hạn chót** (ví dụ 2 tuần), nếu không danh sách cách ly thành bãi rác.
- Theo dõi chỉ số: tỉ lệ build đỏ do flaky, số test đang cách ly.

### Lỗi hay gặp
1. Tăng sleep từ 500ms lên 2s: chậm hơn và vẫn flaky trên máy chậm hơn.
2. Bật retry toàn bộ test vĩnh viễn: che cả race condition thật trong code production.
3. Xoá test "vì flaky": đôi khi test flaky đang bắt một bug concurrency thật.

### Trả lời miệng 1 phút
"Test flaky là test cho kết quả khác nhau khi code không đổi, và nó làm team mất niềm tin vào CI, như tuần trước bug thật đã lọt. Tôi bật rerun của Surefire để report đánh dấu test flaky, rồi tái hiện bằng cách chạy lặp và xáo thứ tự. Nguyên nhân thường là state dùng chung giữa test, thời gian thật, sleep cố định với code async, thứ tự không xác định hoặc port/DB dùng chung. Tôi sửa bằng inject Clock, Awaitility, dọn dữ liệu mỗi test. Trong lúc chờ sửa, test bị cách ly có ticket, người sở hữu và hạn chót, không bấm re-run vô hạn."

> Senior tip: một phần đáng kể test flaky thực ra là **bug thật** trong code production (race condition, phụ thuộc timezone). Trước khi "sửa test", tôi luôn hỏi: người dùng có thể gặp đúng tình huống này không? Nếu có, sửa code chứ không sửa test.`,
  follow: [
    'Vì sao inject Clock tốt hơn dùng mock static cho LocalDate.now()?',
    'Retry tự động test fail trên CI có hại gì nếu để lâu dài?',
    'Làm sao cô lập dữ liệu giữa các test integration dùng chung một database Testcontainers?'
  ],
  tags: ['flaky test', 'CI', 'JUnit 5', 'Awaitility', 'Clock', 'Surefire'],
  refs: [
    { type: 'doc', title: 'Maven Surefire: Rerun failing tests', url: 'https://maven.apache.org/surefire/maven-surefire-plugin/examples/rerun-failing-tests.html' },
    { type: 'article', title: 'Martin Fowler: Eradicating Non-Determinism in Tests', url: 'https://martinfowler.com/articles/nonDeterminism.html' }
  ]
},
{
  id: 'scenario-078',
  topic: 'scenario',
  level: 'senior',
  q: 'Đội on-call nhận khoảng 300 alert mỗi tuần, hơn 90% không cần làm gì, nhiều người tắt thông báo ban đêm. Tuần trước API thanh toán lỗi 40 phút mà không ai phản ứng vì alert thật chìm giữa đống alert rác. Bạn xử lý alert fatigue thế nào?',
  a: `**Tóm tắt:** alert gọi người dậy (page) chỉ nên dành cho thứ **người dùng đang chịu ảnh hưởng và cần con người hành động ngay**. Tôi kiểm kê toàn bộ alert theo dữ liệu (alert nào kêu, bao nhiêu lần, có ai hành động không), xoá hoặc hạ cấp alert không hành động được thành ticket/dashboard, chuyển sang **alert theo triệu chứng dựa trên SLO** (burn rate) thay vì theo nguyên nhân (CPU, GC), gom nhóm và chống lặp ở Alertmanager, và bắt buộc mỗi page phải có runbook. Mục tiêu đo được: vài page mỗi ca trực, gần như tất cả đều cần hành động.

### Hiểu nhanh
Chuông báo cháy kêu mỗi khi có người nấu ăn thì cả toà nhà sẽ học cách lờ nó đi, và hôm cháy thật cũng không ai chạy. Vấn đề không phải người trực lười, mà là **hệ thống dạy họ lờ đi**.

### Bước 1: kiểm kê bằng dữ liệu
Xuất lịch sử alert 4 tuần, mỗi alert ghi: số lần kêu, số lần có người hành động, thời gian tự hết.
| Alert | Lần/tuần | Có hành động | Quyết định |
|---|---|---|---|
| CPU > 80% | 85 | 0 | xoá (CPU cao mà latency tốt là hiệu quả, không phải sự cố) |
| Disk > 70% | 40 | 2 | chuyển thành ticket, đổi sang "đầy trong 4 giờ nữa" dựa trên tốc độ tăng |
| Pod restart | 60 | 3 | gom theo service, chỉ page khi ảnh hưởng SLO |
| Error rate payment > 5% | 2 | 2 | giữ, đây là alert thật |

### Bước 2: alert theo triệu chứng và SLO
Ví dụ SLO: 99,9% request thanh toán thành công trong 30 ngày, tức error budget 0,1%. **Burn rate** là tốc độ tiêu budget: burn rate 1 nghĩa là tiêu hết đúng sau 30 ngày; burn rate 14,4 nghĩa là trong 1 giờ đã tiêu 2% budget của cả tháng.
Theo SRE Workbook của Google, dùng **nhiều cửa sổ**:
- Page: burn rate > 14,4 trong 1 giờ **và** trong 5 phút (cửa sổ ngắn giúp alert tự tắt nhanh khi đã hết lỗi).
- Page: burn rate > 6 trong 6 giờ và 30 phút.
- Ticket: burn rate > 1 trong 3 ngày.

~~~yaml
- alert: PaymentErrorBudgetFastBurn
  expr: |
    (sum(rate(http_server_requests_seconds_count{service="payment",status=~"5.."}[1h]))
      / sum(rate(http_server_requests_seconds_count{service="payment"}[1h]))) > (14.4 * 0.001)
    and
    (sum(rate(http_server_requests_seconds_count{service="payment",status=~"5.."}[5m]))
      / sum(rate(http_server_requests_seconds_count{service="payment"}[5m]))) > (14.4 * 0.001)
  labels:
    severity: page
  annotations:
    runbook_url: https://wiki.acme.vn/runbooks/payment-errors
~~~
Vụ 40 phút lỗi tuần trước: lỗi 30% thì burn rate là 300, alert này kêu trong vài phút.

### Bước 3: giảm nhiễu kỹ thuật
- Alertmanager: {{group_by}} theo service/alertname để 50 pod restart thành **một** thông báo; {{repeat_interval}} hợp lý; {{inhibit_rules}} để khi "cả cluster mất kết nối DB" thì không kêu thêm 30 alert con.
- Mỗi alert severity page phải có runbook: kiểm tra gì, lệnh gì, khi nào escalate.

### Bước 4: quy trình
- Review alert hằng tuần trong buổi bàn giao on-call: alert nào kêu mà không hành động thì sửa hoặc xoá ngay tuần đó.
- Đo: số page mỗi ca, tỉ lệ page có hành động, thời gian từ page đến acknowledge.

### Lỗi hay gặp
1. Alert theo nguyên nhân (CPU, heap, GC) thay vì theo triệu chứng người dùng thấy.
2. Ngưỡng tĩnh không cửa sổ thời gian: chạm ngưỡng một lần cũng kêu.
3. Gửi mọi alert vào cùng một kênh Slack, kể cả cảnh báo thông tin.
4. Sợ xoá alert: "lỡ cần thì sao". Alert không ai hành động có hại hơn không có.

### Trả lời miệng 1 phút
"Alert rác dạy người trực lờ đi, nên alert thật bị bỏ qua. Tôi kiểm kê bốn tuần lịch sử: alert nào kêu mà không ai hành động thì xoá hoặc hạ thành ticket. Page chỉ dành cho triệu chứng ảnh hưởng người dùng, đo bằng SLO và burn rate nhiều cửa sổ, ví dụ burn rate 14,4 trong cả 1 giờ và 5 phút. Tôi gom nhóm và inhibit ở Alertmanager, mỗi page có runbook, và review alert mỗi tuần khi bàn giao on-call. Mục tiêu là vài page mỗi ca và gần như page nào cũng cần hành động."

> Senior tip: con số tôi theo dõi là **tỉ lệ page có hành động**. Dưới khoảng 50% là hệ thống alert đang hỏng. Và khi thuyết phục team xoá alert, tôi đổi câu hỏi từ "lỡ cần thì sao" thành "lần cuối alert này giúp ta phát hiện sự cố là khi nào?". Thường không ai nhớ.`,
  follow: [
    'Vì sao alert theo burn rate cần cả cửa sổ dài và cửa sổ ngắn?',
    'Alert theo nguyên nhân như CPU, heap có còn chỗ đứng không, đặt ở đâu?',
    'Bạn thiết kế lịch on-call và bàn giao thế nào cho team 6 người?'
  ],
  tags: ['alert fatigue', 'SLO', 'burn rate', 'Prometheus', 'Alertmanager', 'on-call'],
  refs: [
    { type: 'book', title: 'Google SRE Workbook: Alerting on SLOs', url: 'https://sre.google/workbook/alerting-on-slos/' },
    { type: 'doc', title: 'Prometheus Alertmanager', url: 'https://prometheus.io/docs/alerting/latest/alertmanager/' }
  ]
},
{
  id: 'scenario-079',
  topic: 'scenario',
  level: 'mid',
  q: '2 giờ sáng, service report chạy trên VM báo {{java.io.IOException: No space left on device}}, ghi file tạm thất bại và app ngừng nhận request. On-call đã {{rm}} file log 40 GB nhưng {{df -h}} vẫn báo 100%. Bạn xử lý thế nào, và làm sao để không tái diễn (cả trên VM và Kubernetes)?',
  a: `**Tóm tắt:** xoá file đang được process mở **không giải phóng dung lượng**: Linux chỉ xoá tên file, dữ liệu còn đó cho tới khi process đóng file. Tìm bằng {{lsof +L1}}, giải phóng bằng cách truncate qua {{/proc/<pid>/fd}} hoặc restart process. Nguyên nhân gốc thường là log không có giới hạn tổng dung lượng (Spring Boot mặc định {{total-size-cap}} = 0, tức không giới hạn) cộng với một vòng lặp log exception. Phòng ngừa: rolling policy có {{max-file-size}}, {{max-history}}, {{total-size-cap}}; trên Kubernetes thì log ra stdout và đặt giới hạn {{ephemeral-storage}}; alert theo **tốc độ đầy** chứ không chỉ theo phần trăm.

### Hiểu nhanh
File trên Linux giống một cuốn sách trong thư viện có **phiếu mục lục**. {{rm}} chỉ xé phiếu mục lục. Nếu còn người đang đọc cuốn sách (process đang mở file), sách vẫn nằm trên kệ, chiếm chỗ, cho tới khi người đó trả sách.

### Xử lý khẩn từng bước
~~~bash
df -h                                   # phân vùng nào đầy
df -i                                   # hết inode cũng báo "No space left" dù còn GB
du -xsh /var/log/* | sort -h | tail     # thư mục nào lớn (-x: không nhảy sang phân vùng khác)
lsof +L1                                # file đã bị xoá nhưng còn được mở (link count 0)
# Ví dụ: java 4121 ... /var/log/report/app.log (deleted) 42949672960
: > /proc/4121/fd/7                     # truncate về 0 qua file descriptor, không cần restart
~~~
- Nếu file chưa xoá: dùng {{truncate -s 0 app.log}} hoặc {{: > app.log}} thay cho {{rm}}.
- Sau khi có chỗ trống, kiểm tra app tự hồi phục chưa; nhiều app cần restart vì đã ở trạng thái lỗi.

### Tìm nguyên nhân gốc: vì sao log tới 40 GB
1. Mở cuối file log: thường thấy **một exception lặp lại** hàng nghìn lần mỗi giây (ví dụ retry kết nối DB không backoff, mỗi lần in đủ stack trace 80 dòng).
2. Cấu hình rolling: không có hoặc có rolling theo ngày nhưng không giới hạn kích thước.
3. Logrotate của hệ điều hành dùng {{create}} (đổi tên file rồi tạo file mới) trong khi app vẫn ghi vào file cũ đã đổi tên; khi đó cần {{copytruncate}} hoặc để chính Logback rotate.

### Sửa cấu hình Spring Boot 3 (Logback)
~~~yaml
logging:
  file:
    name: /var/log/report/app.log
  logback:
    rollingpolicy:
      max-file-size: 100MB        # mỗi file tối đa 100MB rồi cắt
      max-history: 7              # giữ 7 ngày
      total-size-cap: 2GB         # mặc định 0 = KHÔNG giới hạn, đây là chỗ hay quên
~~~
Và sửa vòng lặp: retry có backoff, log lần đầu đầy đủ, các lần sau chỉ đếm (hoặc log mỗi N lần).

### Trên Kubernetes thì khác gì
| Khía cạnh | VM | Kubernetes |
|---|---|---|
| Ghi log ở đâu | file trên đĩa | **stdout/stderr**, agent (Fluent Bit…) gom về |
| Ai rotate | Logback / logrotate | kubelet rotate log container ({{containerLogMaxSize}}, {{containerLogMaxFiles}}) |
| Khi đầy | app lỗi I/O | node bị **DiskPressure**, kubelet evict pod |
| Chặn | total-size-cap | {{resources.limits.ephemeral-storage}}: pod vượt sẽ bị evict thay vì làm đầy node |
App ghi file log vào filesystem của container hoặc {{emptyDir}} không giới hạn có thể làm đầy đĩa node và ảnh hưởng **mọi pod khác** trên node đó.

### Phòng ngừa
- Alert theo **dự báo**: "phân vùng sẽ đầy trong 4 giờ nữa" (ví dụ {{predict_linear}} trên metric filesystem của node exporter), không chỉ "trên 80%".
- Log và dữ liệu (file tạm, upload) ở phân vùng khác nhau để log đầy không làm chết tính năng chính.
- Rate limit log lặp lại; không log stack trace đầy đủ cho lỗi đã biết, lặp liên tục.

### Lỗi hay gặp
1. {{rm}} file đang mở rồi tưởng đã xong.
2. Chỉ đặt {{max-history}} mà không có {{total-size-cap}}: 7 ngày × 40 GB vẫn đầy.
3. Quên kiểm tra inode ({{df -i}}): hàng triệu file nhỏ (file tạm, session) làm hết inode khi vẫn còn GB.

### Trả lời miệng 1 phút
"Xoá file đang được process mở thì Linux chỉ xoá tên, dữ liệu còn tới khi process đóng file, nên df vẫn 100%. Tôi dùng lsof +L1 tìm file đã xoá còn mở và truncate qua /proc/pid/fd, hoặc restart process. Rồi tìm vì sao log tới 40 GB: thường là một exception lặp lại không backoff, cộng với rolling policy không có total-size-cap, mà mặc định của Spring Boot là không giới hạn. Tôi đặt max-file-size, max-history, total-size-cap, sửa vòng lặp, alert theo tốc độ đầy. Trên Kubernetes thì log ra stdout và đặt giới hạn ephemeral-storage để một pod không làm đầy cả node."

> Senior tip: trong mọi template service, tôi đặt sẵn {{total-size-cap}} và giới hạn {{ephemeral-storage}}, vì sự cố đầy đĩa gần như luôn đến vào ban đêm, do một lỗi khác kích hoạt. Đầy đĩa hiếm khi là nguyên nhân gốc; nó là **triệu chứng thứ hai** che khuất lỗi thật, nên sau khi dọn chỗ hãy đọc phần log trước lúc đầy.`,
  follow: [
    'Vì sao logrotate với tuỳ chọn create có thể không giải phóng dung lượng cho app Java?',
    'Node Kubernetes bị DiskPressure thì kubelet xử lý thế nào, pod nào bị evict trước?',
    'Làm sao giới hạn log lặp lại trong Logback mà không mất thông tin lỗi?'
  ],
  tags: ['disk full', 'logback', 'lsof', 'log rotation', 'ephemeral-storage', 'Kubernetes'],
  refs: [
    { type: 'doc', title: 'Spring Boot Reference: Logging', url: 'https://docs.spring.io/spring-boot/reference/features/logging.html' },
    { type: 'doc', title: 'Kubernetes: Node-pressure Eviction', url: 'https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/' }
  ]
},
{
  id: 'scenario-080',
  topic: 'scenario',
  level: 'lead',
  q: '20 giờ tối thứ Sáu, tỉ lệ thanh toán thành công giảm từ 99% xuống 60%. Trong 15 phút, 9 kỹ sư nhảy vào cùng một kênh chat, mỗi người debug một hướng, có người đã restart DB replica mà không báo ai, CSKH không biết trả lời khách, CEO nhắn riêng hỏi bạn. Bạn nhận vai điều phối (incident commander) thế nào?',
  a: `**Tóm tắt:** việc đầu tiên của incident commander (IC) **không phải debug** mà là tạo trật tự: tuyên bố mức độ, nhận vai IC, giao vai rõ ràng (người dẫn kỹ thuật, người lo giao tiếp, người ghi chép), một kênh duy nhất, **mọi thay đổi production phải báo trước trong kênh**. Ưu tiên **giảm tác động trước, tìm nguyên nhân sau** (rollback, tắt feature flag, failover). Cập nhật trạng thái theo nhịp cố định (ví dụ 30 phút) bằng mẫu có sẵn, và chính thức đóng sự cố bằng tiêu chí rõ ràng.

### Hiểu nhanh
Một vụ cháy có 9 người tự cầm vòi phun mỗi người một hướng thì còn tệ hơn 3 người làm theo một chỉ huy. IC giống chỉ huy hiện trường: không tự dập lửa, mà quyết định ai làm gì, thông tin đi đâu.

### 5 phút đầu: câu nói cụ thể
Gõ vào kênh (hoặc nói trên call):
"Tôi là IC cho sự cố này, mức **SEV1**: thanh toán thành công 60%. Kênh duy nhất là #inc-0412-payment, call ở link X.
- **Nam** dẫn kỹ thuật, quyết định hướng điều tra.
- **Lan** lo giao tiếp: CSKH, trang trạng thái, lãnh đạo. Không ai khác trả lời lãnh đạo.
- **Huy** ghi timeline: thời điểm, hành động, ai làm.
- **Từ giờ, mọi thay đổi trên production (restart, deploy, đổi config) phải gõ vào kênh và chờ Nam đồng ý.**
- Ai không có vai thì rời call, ở chế độ sẵn sàng; cần ai tôi sẽ gọi tên."

Câu trả lời cho CEO (qua Lan, hoặc một lần duy nhất từ bạn): "Sự cố thanh toán, khoảng 40% giao dịch lỗi từ 19:52. Team đã được huy động, cập nhật tiếp lúc 20:45."

### Vai trò và vì sao tách
| Vai | Làm | Không làm |
|---|---|---|
| IC | quyết định, phân việc, nhịp cập nhật | tự debug sâu |
| Tech lead | dẫn điều tra, đề xuất và duyệt thao tác | trả lời lãnh đạo |
| Comms | CSKH, status page, stakeholder | sửa hệ thống |
| Scribe | timeline chính xác | bàn luận |
IC mà tự debug sẽ mất toàn cảnh: không ai thấy 2 người đang làm hai thay đổi xung đột.

### Giảm tác động trước
Câu IC hỏi liên tục: **"Có gì thay đổi gần đây? Ta có thể quay lại không?"**
- Deploy trong 2 giờ qua? Rollback ngay, kể cả khi chưa chắc nó là nguyên nhân (rollback rẻ, đoán sai thì rollback lại).
- Feature flag mới bật? Tắt.
- Một đối tác thanh toán lỗi? Chuyển traffic sang đối tác dự phòng.
Tìm nguyên nhân gốc là việc của postmortem; trong sự cố, mục tiêu là **khách thanh toán được**.

### Nhịp cập nhật: mẫu cố định
~~~text
[20:45] SEV1 thanh toán - Cập nhật #2
Tác động: ~40% giao dịch thanh toán lỗi từ 19:52, khách nhận thông báo "thử lại".
Đã làm: rollback payment-service về 3.18 lúc 20:31, chưa cải thiện.
Đang làm: kiểm tra pool kết nối tới đối tác X (Nam, Hà).
Quyết định tiếp: nếu 21:00 chưa rõ, chuyển 100% sang đối tác Y.
Cập nhật tiếp: 21:15.
~~~

### Khung ra quyết định khi chưa chắc chắn
- Hành động **đảo ngược được** và rẻ (rollback, tắt flag, chuyển traffic): làm ngay, không cần chắc chắn.
- Hành động **khó đảo ngược** (xoá dữ liệu, failover DB chính, chạy script sửa dữ liệu): cần tech lead + IC đồng ý, ghi lại lý do.
- Đặt **mốc thời gian quyết định**: "nếu 21:00 chưa rõ thì làm phương án B", tránh tê liệt.

### Đóng sự cố và bàn giao
- Tiêu chí đóng: tỉ lệ thành công trở lại baseline trong 30 phút liên tục.
- Sự cố kéo dài hơn 3–4 giờ: bàn giao IC cho người mới bằng một bản tóm tắt, người mệt ra quyết định tồi.
- Hẹn postmortem trong 2–3 ngày làm việc; xử lý giao dịch dở dang (đối soát) là việc tiếp theo, có người nhận.

### Lỗi hay gặp
1. Người có kinh nghiệm nhất làm IC rồi lao vào debug, không ai điều phối.
2. Không khoá thay đổi: hai người cùng sửa, không biết thay đổi nào có tác dụng.
3. Im lặng với stakeholder vì "chưa có gì để nói": im lặng làm lãnh đạo nhắn từng kỹ sư, gây nhiễu thêm.
4. Ưu tiên tìm nguyên nhân trong khi khách vẫn lỗi.

### Trả lời miệng 1 phút
"Việc đầu tiên của tôi không phải debug mà là tạo trật tự. Tôi tuyên bố SEV1, nhận vai IC, giao người dẫn kỹ thuật, người lo giao tiếp và người ghi timeline, dồn về một kênh, và khoá thay đổi: mọi thao tác production phải báo trong kênh và được duyệt. Người không có vai rời call. Tôi ưu tiên giảm tác động: rollback, tắt flag, chuyển đối tác, vì hành động đảo ngược được thì làm ngay. Tôi cập nhật mỗi 30 phút theo mẫu tác động, đã làm, đang làm, lần cập nhật tiếp, để CEO và CSKH không phải hỏi từng người. Đóng sự cố khi chỉ số ổn định đủ lâu, rồi hẹn postmortem."

> Senior tip: thứ quyết định một sự cố được xử lý tốt nằm ở **trước** sự cố: định nghĩa SEV sẵn, kênh tạo tự động, mẫu cập nhật, danh sách người dự phòng, và luyện tập (game day). Tôi cũng xoay vòng vai IC cho cả người không phải giỏi kỹ thuật nhất, vì IC cần bình tĩnh và giao tiếp rõ hơn là biết sâu mọi hệ thống.`,
  follow: [
    'Khi tech lead và IC bất đồng về rollback trong lúc sự cố, ai quyết định?',
    'Bạn định nghĩa các mức SEV1, SEV2, SEV3 thế nào cho hệ thanh toán?',
    'Bạn chuẩn bị và luyện tập incident response cho team thế nào khi chưa có sự cố?'
  ],
  tags: ['incident commander', 'incident response', 'communication', 'SEV', 'lead', 'on-call'],
  refs: [
    { type: 'book', title: 'Google SRE Book: Managing Incidents', url: 'https://sre.google/sre-book/managing-incidents/' },
    { type: 'doc', title: 'PagerDuty Incident Response Documentation', url: 'https://response.pagerduty.com/' }
  ]
},
{
  id: 'scenario-081',
  topic: 'scenario',
  level: 'lead',
  q: 'Một kỹ sư 1 năm kinh nghiệm chạy migration {{CREATE INDEX}} trên bảng {{orders}} 80 triệu dòng lúc 10 giờ sáng, khoá ghi bảng 40 phút, không ai đặt được hàng. Trưởng phòng muốn postmortem "ghi rõ ai làm sai để rút kinh nghiệm". Bạn viết postmortem không đổ lỗi thế nào và nói gì với trưởng phòng?',
  a: `**Tóm tắt:** postmortem không đổ lỗi (blameless) **không có nghĩa là không ai chịu trách nhiệm**; nó có nghĩa là hỏi "**hệ thống nào cho phép** một thao tác bình thường gây sập 40 phút?" thay vì "ai sai?". Lý do thực dụng: khi bị nêu tên, mọi người giấu thông tin, và lần sau một người khác sẽ mắc đúng lỗi đó vì hệ thống không đổi. Postmortem gồm: tóm tắt, tác động có số liệu, timeline, nguyên nhân và các yếu tố góp phần, điều gì làm tốt, **action item có người sở hữu và hạn chót**. Với trưởng phòng, tôi chuyển mục tiêu "rút kinh nghiệm" sang "**không để ai lặp lại được**", và đó là việc của hệ thống.

### Hiểu nhanh
Nếu một y tá tiêm nhầm thuốc vì hai lọ thuốc có nhãn giống hệt nhau, đuổi y tá không làm bệnh viện an toàn hơn; đổi nhãn thì có. Hàng không và y tế học được điều này sớm: phạt cá nhân làm báo cáo sự cố biến mất.

### Hiểu kỹ thuật trước khi viết
Trên PostgreSQL, {{CREATE INDEX}} thường lấy khoá chặn **INSERT/UPDATE/DELETE** (vẫn cho đọc) suốt thời gian build index; 80 triệu dòng mất 40 phút. {{CREATE INDEX CONCURRENTLY}} không chặn ghi nhưng chậm hơn, không chạy được trong transaction, và nếu lỗi sẽ để lại index INVALID cần dọn. Không có gì trong quy trình nói với kỹ sư điều này.

### Cấu trúc postmortem
~~~text
1. Tóm tắt: 10:02-10:43, không tạo được đơn hàng do migration khoá ghi bảng orders.
2. Tác động: ~3.100 đơn thất bại, ước tính 1,2 tỉ đồng doanh thu chậm/mất, 420 ticket CSKH.
3. Timeline: 09:58 merge PR #1842 | 10:02 Flyway chạy khi deploy | 10:05 alert lỗi tạo đơn
   | 10:21 xác định khoá trên orders | 10:43 index xong, tự hồi phục.
4. Nguyên nhân và yếu tố góp phần (xem dưới).
5. Điều làm tốt: alert kêu sau 3 phút; CSKH được báo lúc 10:12.
6. Điều chưa tốt / may mắn: không có cách huỷ an toàn khi đang chạy.
7. Action item: việc, người sở hữu, hạn chót, ticket.
~~~

### Viết lại câu đổ lỗi thành câu về hệ thống
| Đổ lỗi | Không đổ lỗi |
|---|---|
| "An đã chạy migration sai." | "Migration tạo index không có CONCURRENTLY được chạy tự động khi deploy vào giờ cao điểm." |
| "Reviewer không đọc kỹ." | "Checklist review không có mục về khoá bảng; CI không phát hiện câu lệnh khoá trên bảng lớn." |
| "An thiếu kinh nghiệm." | "Kiến thức về khoá của DDL chỉ nằm trong đầu 2 người; không có tài liệu hay công cụ kiểm tra." |

### Các yếu tố góp phần (nhiều hơn một, luôn luôn)
1. Flyway chạy migration trong lúc deploy, không tách migration nguy hiểm.
2. Không có {{lock_timeout}}: nếu đặt {{SET lock_timeout = '5s'}}, migration sẽ tự huỷ thay vì chặn 40 phút.
3. CI không có linter cho migration (ví dụ cảnh báo CREATE INDEX không CONCURRENTLY trên bảng lớn).
4. Staging có 50 nghìn dòng, migration chạy 1 giây nên không ai thấy rủi ro.
5. Deploy lúc 10 giờ sáng giờ cao điểm.

### Action item tốt và tồi
- Tồi: "Cẩn thận hơn khi viết migration." (không đo được, không ai sở hữu)
- Tốt: "Thêm kiểm tra migration trong CI chặn CREATE INDEX không CONCURRENTLY, ALTER TABLE đổi kiểu cột; owner: Huy; hạn: 15/11."
- Tốt: "Mặc định lock_timeout 5s cho user chạy migration; owner: Lan; hạn: 08/11."

### Nói với trưởng phòng: kịch bản
"Em hiểu anh muốn chắc chuyện này không lặp lại, em cũng muốn vậy. Nếu postmortem ghi tên An, lần sau người mắc lỗi sẽ im lặng 20 phút trước khi báo, và sự cố sẽ dài hơn. Quan trọng hơn: bất kỳ ai trong team cũng có thể chạy đúng migration này, vì không có gì chặn họ. Em đề xuất postmortem tập trung vào 4 thay đổi hệ thống, có owner và hạn chót, em chịu trách nhiệm theo dõi chúng. Về phát triển cá nhân của An, em sẽ trao đổi riêng, không qua tài liệu sự cố."
Trách nhiệm (accountability) vẫn còn: thuộc về **người sở hữu action item** và về bạn, người lead.

### Lỗi hay gặp
1. Postmortem chỉ có một nguyên nhân ("lỗi con người").
2. Action item không có owner/hạn chót, 3 tháng sau không ai làm.
3. Họp postmortem như phiên toà; người liên quan im lặng.
4. Không chia sẻ rộng: team khác lặp lại đúng lỗi đó.

### Trả lời miệng 1 phút
"Blameless không phải là không ai chịu trách nhiệm, mà là hỏi hệ thống nào cho phép một thao tác bình thường làm sập 40 phút. Ở đây có ít nhất bốn yếu tố: migration chạy tự động lúc deploy giờ cao điểm, không có lock_timeout, CI không kiểm tra câu lệnh khoá bảng, staging quá nhỏ để thấy rủi ro. Postmortem gồm tác động có số liệu, timeline, các yếu tố góp phần, điều làm tốt và action item có owner, hạn chót. Với trưởng phòng, tôi giải thích nêu tên làm người ta giấu lỗi và bất kỳ ai cũng có thể mắc lỗi này; trách nhiệm nằm ở owner action item và ở tôi."

> Senior tip: tôi đo chất lượng văn hoá postmortem bằng **tỉ lệ action item hoàn thành đúng hạn** và bằng việc người gây ra sự cố có **tự nguyện** viết hoặc trình bày postmortem không. Khi một junior tự đứng lên kể "em đã làm gì và vì sao lúc đó em nghĩ nó đúng", team đó đang học nhanh hơn mọi team khác.`,
  follow: [
    'Nếu một người lặp lại cùng một sai sót sau khi đã có biện pháp, bạn xử lý khác thế nào?',
    'Vì sao "5 Whys" có thể dẫn tới kết luận sai, và bạn bổ sung gì?',
    'Bạn theo dõi để action item sau postmortem thực sự được làm thế nào?'
  ],
  tags: ['postmortem', 'blameless', 'incident', 'PostgreSQL', 'migration', 'lead'],
  refs: [
    { type: 'book', title: 'Google SRE Book: Postmortem Culture', url: 'https://sre.google/sre-book/postmortem-culture/' },
    { type: 'doc', title: 'PostgreSQL: CREATE INDEX', url: 'https://www.postgresql.org/docs/current/sql-createindex.html' }
  ]
},
{
  id: 'scenario-082',
  topic: 'scenario',
  level: 'lead',
  q: 'Hai senior trong team bạn tranh luận 3 tuần về thiết kế luồng hoàn tiền: một người muốn event-driven qua Kafka, người kia muốn gọi REST đồng bộ kèm outbox. PR bị comment qua lại 60 lần, các thành viên khác chờ, sprint trễ. Bạn là lead, xử lý thế nào?',
  a: `**Tóm tắt:** vấn đề không còn là kỹ thuật mà là **thiếu cơ chế ra quyết định**. Tôi: (1) rút cuộc tranh luận khỏi PR; (2) xác định loại quyết định (dễ hay khó đảo ngược) để biết cần đầu tư bao nhiêu; (3) thống nhất **tiêu chí trước, phương án sau**, viết thành ADR ngắn; (4) nếu dữ liệu còn thiếu thì làm spike có thời hạn và tiêu chí đo; (5) nói rõ **ai quyết** và hạn chót; (6) sau quyết định, "disagree and commit", ghi lại điều kiện để xem xét lại. Song song, nói chuyện riêng với từng người.

### Hiểu nhanh
Hai đầu bếp giỏi cãi nhau món nên hấp hay nướng; cả bếp đứng chờ. Bếp trưởng không cần giỏi hơn cả hai, chỉ cần hỏi "khách cần gì, trong bao lâu, bếp có gì", rồi quyết, và cam kết chịu trách nhiệm quyết định đó.

### Bước 1: dừng tranh luận trên PR
PR là nơi review **code**, không phải nơi quyết kiến trúc. 60 comment chữ là kênh tồi nhất cho bất đồng: mất giọng điệu, ai cũng muốn thắng trước khán giả.
Câu nói: "Hai bạn đều có lý lẽ tốt. Mình dừng thảo luận trên PR. Thứ Năm mình họp 45 phút, mỗi bạn viết 1 trang theo cùng mẫu trước buổi họp. Cuối buổi sẽ có quyết định."

### Bước 2: loại quyết định
| Loại | Ví dụ | Cách quyết |
|---|---|---|
| Dễ đảo ngược (cửa hai chiều) | tên class, thư viện nội bộ | người làm quyết, nhanh |
| Khó đảo ngược (cửa một chiều) | đồng bộ hay bất đồng bộ cho luồng tiền, schema event công khai | ADR, tiêu chí, có thể spike |
Luồng hoàn tiền thuộc loại khó đảo ngược (ảnh hưởng đối soát, team khác tiêu thụ event), nên đáng 1–2 ngày phân tích, **không đáng 3 tuần**.

### Bước 3: tiêu chí trước, phương án sau
Hỏi cả hai đồng ý tiêu chí và trọng số **trước khi** chấm phương án; đây là bước gỡ được phần lớn bất đồng, vì thường hai người đang tối ưu hai thứ khác nhau.
| Tiêu chí (trọng số) | Kafka event-driven | REST + outbox |
|---|---|---|
| Đúng tiền, không mất/trùng (3) | 2 | 3 |
| Khách thấy kết quả ngay (2) | 1 | 3 |
| Team khác cần nghe sự kiện hoàn tiền (2) | 3 | 2 (outbox vẫn phát event) |
| Team đã vận hành được (2) | 1 (chưa có Kafka ở team này) | 3 |
| Tổng | 15 | 23 |
Bảng không ra quyết định thay bạn, nhưng làm lộ ra đúng chỗ bất đồng thật.

### Bước 4: thiếu dữ liệu thì spike
"Chúng ta không biết Kafka cluster của platform có đáp ứng SLA 99,95% không. Minh có 3 ngày để đo, tiêu chí là X; kết quả quyết định cột 4."

### Bước 5: ai quyết, và disagree and commit
- Nói rõ từ đầu: "Nếu sau buổi họp chưa đồng thuận, tôi sẽ quyết, vì tôi chịu trách nhiệm thiết kế này."
- Ghi ADR: bối cảnh, các phương án, quyết định, hệ quả, **điều kiện xem xét lại** (ví dụ: khi có thêm 3 consumer cần event hoàn tiền, đánh giá lại).
- Với người "thua": "Phương án của bạn không sai; với tiêu chí hiện tại, phương án kia phù hợp hơn. Mình ghi điều kiện xem xét lại trong ADR. Mình cần bạn cùng làm cho phương án đã chọn thành công, và bạn review phần outbox vì bạn hiểu rủi ro mất event nhất."

### Bước 6: nói chuyện riêng
Tranh luận 3 tuần thường có lý do ngoài kỹ thuật: muốn được ghi nhận, lo bị đánh giá thấp, muốn học công nghệ mới. Hỏi riêng: "Với bạn, điều gì quan trọng nhất ở thiết kế này?" Câu trả lời giúp bạn giao việc phù hợp (ví dụ người muốn làm Kafka có thể dẫn POC cho một luồng khác ít rủi ro).

### Lỗi hay gặp
1. Để tranh luận "tự hết": nó không hết, chỉ ngầm hơn.
2. Lead chọn phe sớm, không cho mỗi bên trình bày.
3. Biểu quyết đa số cho quyết định kỹ thuật khó: số đông không chịu trách nhiệm.
4. Quyết xong không ghi lại; 6 tháng sau tranh luận lại từ đầu.

### Trả lời miệng 1 phút
"Ba tuần tranh luận nghĩa là thiếu cơ chế quyết định chứ không thiếu ý tưởng. Tôi rút tranh luận khỏi PR, hẹn một buổi họp có hạn chót và nói rõ nếu không đồng thuận thì tôi quyết. Luồng hoàn tiền là quyết định khó đảo ngược nên đáng phân tích, nhưng tính bằng ngày chứ không bằng tuần. Tôi cho hai bên thống nhất tiêu chí và trọng số trước, rồi mới chấm phương án; phần thiếu dữ liệu thì spike có thời hạn. Quyết xong ghi ADR kèm điều kiện xem xét lại, yêu cầu disagree and commit, và nói chuyện riêng với người không được chọn để giữ động lực của họ."

> Senior tip: tôi đưa vào team quy tắc "**tranh luận quá 2 vòng comment thì chuyển sang gặp trực tiếp**" và mẫu ADR một trang. Phần lớn bất đồng kỹ thuật kéo dài là do hai người tối ưu cho hai tiêu chí khác nhau mà không ai nói ra; buộc viết tiêu chí trước giải quyết được nhiều hơn mọi cuộc tranh luận về công nghệ.`,
  follow: [
    'Nếu chính bạn là một trong hai bên tranh luận thì bạn đảm bảo công bằng thế nào?',
    'ADR nên chứa những gì, và lưu ở đâu để team thực sự đọc?',
    'Bạn làm gì nếu người không được chọn tiếp tục âm thầm làm khó phương án đã chọn?'
  ],
  tags: ['lead', 'conflict', 'ADR', 'decision making', 'disagree and commit', 'architecture'],
  refs: [
    { type: 'article', title: 'Martin Fowler: Scaling the Practice of Architecture, Conversationally', url: 'https://martinfowler.com/articles/scaling-architecture-conversationally.html' },
    { type: 'doc', title: 'Architectural Decision Records', url: 'https://adr.github.io/' }
  ]
},
{
  id: 'scenario-083',
  topic: 'scenario',
  level: 'lead',
  q: 'Còn 6 tuần đến ngày ra mắt tính năng trả góp, ngày này đã hứa với đối tác ngân hàng và marketing đã chạy quảng cáo. Team 5 người mới xong khoảng 55% việc; theo tốc độ thực tế, phần còn lại cần 10 tuần. PM vẫn nói "cố gắng thêm giờ là kịp". Bạn xử lý thế nào?',
  a: `**Tóm tắt:** báo tin xấu **sớm, bằng số liệu, kèm phương án**: dựng dự báo từ tốc độ thực tế (không phải ước lượng lạc quan), đưa ra 3–4 lựa chọn có trade-off rõ (cắt scope, dời ngày, ra mắt từng phần sau feature flag, thêm người có giới hạn), đề xuất một phương án và để người có quyền quyết định. Thường đáp án là **giữ ngày, cắt scope** theo MoSCoW: giữ "lát cắt" đi trọn luồng nghiệp vụ chính, chuyển phần còn lại sang đợt 2. Không chấp nhận "làm thêm giờ" làm kế hoạch, và không cắt chất lượng (test, bảo mật, đối soát) với tính năng liên quan tiền.

### Hiểu nhanh
Xe còn 60 km tới sân bay, máy bay cất cánh sau 30 phút, và xe chỉ chạy được 60 km/h. "Cố gắng chạy nhanh hơn" không phải kế hoạch. Các lựa chọn thật: đổi chuyến (dời ngày), bỏ bớt hành lý để đi xe máy (cắt scope), hoặc gửi trước người quan trọng nhất (ra mắt từng phần).

### Bước 1: số liệu, không cảm tính
~~~text
Tốc độ 4 sprint gần nhất: 18, 22, 19, 21 điểm / 2 tuần -> trung bình ~20
Còn lại: 100 điểm (đã gồm việc phát sinh trung bình 10% mỗi sprint)
6 tuần = 3 sprint -> năng lực ~60 điểm
Thiếu ~40 điểm, tương đương ~4 tuần
~~~
Làm thêm giờ: 2 tuần đầu có thể nhanh 10–20%, sau đó lỗi tăng, người mệt, tốc độ **giảm**. Thêm người mới: theo định luật Brooks, giai đoạn cuối thêm người thường làm chậm hơn vì phải hướng dẫn và phối hợp; chỉ hiệu quả nếu người đó đã quen codebase và nhận phần việc tách biệt.

### Bước 2: liệt kê scope theo MoSCoW
| Hạng mục | Mức | Ghi chú |
|---|---|---|
| Đăng ký trả góp 3/6/12 tháng, 1 ngân hàng đối tác | Must | cam kết hợp đồng |
| Đối soát, hoàn tiền, audit log | Must | liên quan tiền, không cắt |
| Trả góp 24 tháng | Should | ít khách chọn (dữ liệu thị trường ~5%) |
| Trang quản trị tự cấu hình biểu phí | Could | tạm cấu hình bằng file/DB, ops hỗ trợ |
| Thông báo nhắc kỳ hạn qua app | Could | dùng SMS có sẵn trong đợt 1 |
| Ngân hàng đối tác thứ hai | Won't (đợt 1) | |

### Bước 3: phương án trình lên
| Phương án | Ngày | Scope | Rủi ro |
|---|---|---|---|
| A. Giữ ngày, cắt Should/Could | đúng hạn | luồng chính đầy đủ | đợt 2 sau 4–5 tuần |
| B. Dời 4 tuần | trễ | đủ | vỡ cam kết đối tác, phí quảng cáo |
| C. Giữ ngày, giữ scope, làm thêm giờ | "đúng hạn" | đủ trên giấy | chất lượng thấp ở tính năng tiền, rủi ro sự cố cao |
| D. Ra mắt cho 10% khách sau feature flag, mở dần | đúng hạn | luồng chính | cần thống nhất với marketing |
Đề xuất: A kết hợp D.

### Kịch bản nói với PM
"Em muốn báo sớm để mình còn lựa chọn. Theo tốc độ 4 sprint gần nhất, với scope hiện tại team cần khoảng 10 tuần, mình còn 6. Làm thêm giờ chỉ bù được một phần nhỏ và tăng rủi ro lỗi ở luồng tiền. Em có 4 phương án, em đề xuất giữ ngày, ra mắt luồng đăng ký trả góp 3/6/12 tháng với một ngân hàng, đầy đủ đối soát; phần trả góp 24 tháng và trang quản trị chuyển sang đợt 2 sau 4–5 tuần. Anh/chị cần quyết định trước thứ Sáu để team tập trung. Em sẽ cập nhật dự báo mỗi tuần."
Nếu PM vẫn ép: "Em hiểu áp lực. Nếu giữ toàn bộ scope, em cần ghi nhận rủi ro bằng văn bản và anh/chị cùng em báo lên trên, vì với tính năng tiền, lỗi sau ra mắt đắt hơn trễ vài tuần."

### Sau khi quyết
- Cập nhật kế hoạch và **thông báo rõ những gì không có** ở đợt 1 cho marketing, CSKH, đối tác.
- Ẩn phần chưa xong sau feature flag thay vì branch dài.
- Theo dõi dự báo hằng tuần; nếu tốc độ đổi thì báo tiếp, không đợi tuần cuối.

### Lỗi hay gặp
1. Báo trễ ở tuần cuối: không còn lựa chọn nào ngoài trễ.
2. Đưa vấn đề không kèm phương án, hoặc đưa phương án không kèm đề xuất.
3. Cắt test, review, đối soát để kịp: nợ trả bằng sự cố production.
4. Hứa "cố gắng" để tránh cuộc nói chuyện khó.

### Trả lời miệng 1 phút
"Tôi báo sớm bằng số liệu: tốc độ thực tế 4 sprint, phần việc còn lại, khoảng thiếu bao nhiêu tuần. Làm thêm giờ không phải kế hoạch, thêm người giai đoạn cuối thường làm chậm hơn. Tôi xếp scope theo MoSCoW, giữ nguyên đối soát và bảo mật vì là tính năng tiền, rồi đưa 3–4 phương án có trade-off và một đề xuất, thường là giữ ngày, cắt phần Should/Could sang đợt 2 và mở dần bằng feature flag. Người có quyền quyết định; nếu họ chọn giữ toàn bộ scope, tôi ghi nhận rủi ro bằng văn bản. Sau đó cập nhật dự báo mỗi tuần."

> Senior tip: tôi không đợi tới khi trễ mới nói chuyện scope. Ngay từ đầu dự án, tôi thống nhất với PM danh sách Must và thứ tự cắt; khi số liệu xấu đi, cuộc nói chuyện chỉ còn là "kích hoạt kế hoạch đã thống nhất" thay vì một cuộc đàm phán căng thẳng.`,
  follow: [
    'Bạn ước lượng và dự báo ngày hoàn thành khi team mới, chưa có số liệu tốc độ, thế nào?',
    'Nếu lãnh đạo bắt buộc giữ cả ngày lẫn scope, bạn làm gì?',
    'Làm sao giữ tinh thần team khi phải cắt phần việc họ đã làm dở?'
  ],
  tags: ['lead', 'scope', 'deadline', 'MoSCoW', 'stakeholder', 'feature flag'],
  refs: [
    { type: 'article', title: 'Martin Fowler: Feature Toggles', url: 'https://martinfowler.com/articles/feature-toggles.html' }
  ]
},
{
  id: 'scenario-084',
  topic: 'scenario',
  level: 'lead',
  q: 'Team bạn nhận 2 kỹ sư mới vào một monolith legacy 400 nghìn dòng (Spring 4, Java 8, gần như không có tài liệu, test bao phủ 15%). Hai người trước đó mất hơn 3 tháng mới có PR đáng kể đầu tiên, một người đã nghỉ. Bạn thiết kế onboarding thế nào?',
  a: `**Tóm tắt:** coi onboarding là một **sản phẩm có số đo** (thời gian đến PR đầu tiên, đến PR thứ 10, đến lần trực on-call đầu tiên). Bốn trụ: (1) môi trường chạy được trong **một ngày** bằng một lệnh; (2) bản đồ hệ thống tối thiểu: sơ đồ ngữ cảnh/container, một request đi xuyên hệ thống, từ điển nghiệp vụ; (3) **việc thật nhỏ từ tuần đầu** có buddy và pair programming, độ khó tăng dần; (4) người mới **cập nhật tài liệu** khi gặp chỗ sai, nên tài liệu tốt lên theo mỗi lượt onboarding. Với code thiếu test, dạy họ viết **characterization test** trước khi sửa.

### Hiểu nhanh
Đưa người mới vào thành phố lạ mà không có bản đồ, bảo "đi lòng vòng rồi sẽ quen" thì 3 tháng sau họ chỉ biết vài con phố. Cho bản đồ khu trung tâm, một người dẫn đường đi cùng tuyến chính, rồi giao việc đi các tuyến phụ, họ tự đi được sau vài tuần.

### Vì sao 3 tháng
- Mất 1–2 tuần chỉ để chạy được app (cấu hình rải rác, phụ thuộc DB dùng chung).
- Không biết bắt đầu đọc từ đâu trong 400 nghìn dòng.
- Sợ sửa vì không có test: sửa một chỗ vỡ chỗ khác.
- Không có người được giao trách nhiệm hướng dẫn; ai cũng bận.

### Kế hoạch theo tuần
| Thời gian | Mục tiêu | Đầu ra đo được |
|---|---|---|
| Ngày 1–2 | chạy app và test local | {{docker compose up}} + một script, app chạy với dữ liệu mẫu |
| Tuần 1 | hiểu bản đồ | đi cùng buddy theo một request "đặt hàng" từ controller tới DB; PR đầu tiên (sửa log, thêm test) |
| Tuần 2–4 | việc thật nhỏ | 3–5 PR bug nhỏ ở một module, pair 2 buổi/tuần |
| Tháng 2 | tính năng vừa | một tính năng có thiết kế ngắn, review kỹ |
| Tháng 3 | tự chủ | trực on-call cùng người cũ (shadow), rồi đảo vai (reverse shadow) |

### Tài liệu tối thiểu, không phải tài liệu đầy đủ
- **Sơ đồ ngữ cảnh và container** (theo mô hình C4): hệ thống nói chuyện với ai, gồm những khối nào.
- "Một request đi đâu": luồng đặt hàng qua những class/bảng nào.
- Từ điển nghiệp vụ: "hợp đồng", "kỳ", "tất toán" trong code tên là gì.
- Danh sách "vùng nguy hiểm": module nào ít test, chạm vào phải hỏi ai.
- Quy tắc: **người mới sửa tài liệu ngay khi thấy sai**, đó là PR đầu tiên lý tưởng.

### Kỹ thuật an toàn khi sửa code legacy
~~~java
// Characterization test: ghi lại hành vi HIỆN TẠI (kể cả hành vi lạ) trước khi sửa
@Test
void feeCalculation_currentBehavior() {
    FeeCalculator calc = new FeeCalculator();
    // Giá trị kỳ vọng lấy từ kết quả chạy thật, không phải từ đặc tả
    assertEquals(new BigDecimal("15000"), calc.fee(new BigDecimal("1000000"), 3));
    assertEquals(new BigDecimal("0"), calc.fee(BigDecimal.ZERO, 3)); // hành vi biên đang có
}
// Sau khi có lưới test này, người mới refactor/sửa bug mà biết ngay nếu làm đổi hành vi
~~~

### Vai trò buddy
- Một người cụ thể, được **giảm 20–30% khối lượng sprint** trong tháng đầu; không giảm thì buddy chỉ còn trên giấy.
- Gặp 15 phút mỗi ngày tuần đầu; quy tắc "kẹt quá 30 phút thì hỏi".
- Lead hỏi người mới sau 2 tuần và 6 tuần: "Điều gì làm bạn chậm nhất?" rồi sửa đúng điều đó.

### Lỗi hay gặp
1. Tuần đầu cho "đọc code" không mục tiêu: người mới đọc mà không nhớ gì.
2. Giao việc lớn sớm để "học nhanh": thất bại, mất tự tin.
3. Viết bộ tài liệu 80 trang một lần: lỗi thời sau 2 tháng.
4. Không đo, nên không biết lần onboarding này tốt hơn lần trước không.

### Trả lời miệng 1 phút
"Tôi coi onboarding như sản phẩm có số đo: thời gian tới PR đầu tiên, PR thứ 10, lần on-call đầu tiên. Ngày đầu phải chạy được app bằng một lệnh. Tuần đầu, buddy dẫn đi một request xuyên hệ thống cùng sơ đồ C4 tối thiểu và từ điển nghiệp vụ, và người mới có PR nhỏ ngay. Việc tăng dần, có pair programming; với code ít test, tôi dạy viết characterization test trước khi sửa. Buddy được giảm tải thật, người mới sửa tài liệu khi thấy sai, và tôi hỏi họ điều gì làm chậm nhất để sửa cho lượt sau."

> Senior tip: mỗi người mới là **cơ hội kiểm thử miễn phí** cho tài liệu và môi trường dev của team. Tôi yêu cầu họ ghi lại mọi chỗ bị kẹt trong 2 tuần đầu; danh sách đó luôn chỉ ra nợ kỹ thuật thật mà người cũ đã quen tới mức không còn thấy.`,
  follow: [
    'Characterization test khác unit test viết theo đặc tả thế nào?',
    'Bạn chọn việc đầu tiên cho người mới trong codebase legacy theo tiêu chí gì?',
    'Bạn đo hiệu quả onboarding bằng chỉ số nào ngoài thời gian đến PR đầu tiên?'
  ],
  tags: ['lead', 'onboarding', 'legacy', 'characterization test', 'C4', 'mentoring'],
  refs: [
    { type: 'doc', title: 'The C4 model for visualising software architecture', url: 'https://c4model.com/' }
  ]
},
{
  id: 'scenario-085',
  topic: 'scenario',
  level: 'senior',
  q: 'Bạn được nhờ review một PR 4.200 dòng thay đổi logic retry thanh toán, đồng thời refactor package và thêm migration DB. Tác giả muốn merge trước bản phát hành chiều thứ Sáu. Bạn review và xử lý thế nào để giảm rủi ro?',
  a: `**Tóm tắt:** PR lớn trộn nhiều loại thay đổi thì **không review hiệu quả được**: con người bỏ sót nhiều hơn hẳn khi phải đọc hàng nghìn dòng một lúc. Tôi đề nghị **tách** (refactor thuần, migration, thay đổi hành vi), review theo **rủi ro** chứ không theo thứ tự file (logic tiền, concurrency, idempotency, migration trước), kiểm tra bằng cách chạy chứ không chỉ đọc, và đưa phần rủi ro lên production có kiểm soát (feature flag, canary, kế hoạch rollback). Nếu không tách kịp thì phần thay đổi hành vi không lên bản thứ Sáu.

### Hiểu nhanh
Kiểm tra 4.200 dòng một lần giống soát lỗi chính tả một cuốn sách trong một buổi: mắt lướt, lỗi lọt. Kinh nghiệm phổ biến (ví dụ nghiên cứu của SmartBear tại Cisco) là hiệu quả review giảm mạnh khi vượt khoảng vài trăm dòng mỗi lần và quá khoảng một giờ.

### Bước 1: phân loại thay đổi
~~~bash
git diff --stat main...feature/payment-retry   # file nào thay đổi nhiều
git diff -M --stat main...feature/payment-retry # -M: phát hiện file chỉ đổi tên/di chuyển
~~~
Thường thấy: 3.300 dòng là di chuyển package/đổi tên (rủi ro thấp), 600 dòng logic retry (rủi ro cao), 300 dòng migration + test.

### Bước 2: đề nghị tách, kèm câu nói cụ thể
"PR này có ba loại thay đổi với mức rủi ro rất khác nhau. Mình đề nghị tách: PR1 refactor thuần, không đổi hành vi, mình duyệt nhanh trong hôm nay; PR2 migration; PR3 logic retry. PR1 và PR2 có thể lên bản thứ Sáu. PR3 đụng tới tiền, mình cần thời gian review kỹ và muốn nó chạy sau feature flag. Bạn thấy sao?"
Mục tiêu là cùng giảm rủi ro, không phải chặn người khác; luôn đưa đường đi tiếp.

### Bước 3: review theo rủi ro
| Vùng | Câu hỏi bắt buộc |
|---|---|
| Retry thanh toán | Retry có **idempotency key** không? Timeout không rõ kết quả có bị trừ tiền hai lần? Lỗi nào retry, lỗi nào không (4xx nghiệp vụ không retry)? Có backoff và giới hạn số lần? |
| Transaction | Gọi HTTP bên trong {{@Transactional}}? Trạng thái được lưu trước hay sau khi gọi đối tác? |
| Concurrency | Hai instance cùng retry một giao dịch thì sao? Có khoá hoặc trạng thái chặn không? |
| Migration | Khoá bảng lớn? Tương thích ngược với bản code cũ đang chạy trong lúc rolling deploy? |
| Quan sát | Có metric số lần retry, log có correlation id, alert khi retry tăng? |
| Test | Có test cho timeout, lỗi giữa chừng, trùng request, không chỉ happy path? |

### Bước 4: kiểm tra bằng cách chạy
- Checkout branch, chạy test, cố ý làm hỏng một dòng quan trọng xem test có fail không (nếu không, test chưa bảo vệ gì).
- Với migration: chạy trên bản sao dữ liệu cỡ production hoặc ít nhất ước lượng thời gian và loại khoá.

### Bước 5: đưa lên production có kiểm soát
- Logic retry mới sau **feature flag**, bật cho 5% giao dịch, theo dõi tỉ lệ thành công, số lần retry, giao dịch trùng.
- Kế hoạch rollback viết sẵn: tắt flag; migration phải tương thích ngược để không cần rollback DB.
- Không phát hành thay đổi tiền chiều thứ Sáu khi cuối tuần ít người trực, trừ khi bắt buộc.

### Lỗi hay gặp
1. Duyệt "LGTM" vì ngại hoặc vì quá dài để đọc.
2. Comment 80 ý về đặt tên trong khi bỏ sót lỗi idempotency.
3. Chặn PR mà không đưa cách đi tiếp, gây căng thẳng.
4. Tin vào CI xanh khi test chỉ phủ happy path.

### Trả lời miệng 1 phút
"PR 4.200 dòng trộn refactor, migration và logic tiền thì không ai review hiệu quả được. Tôi xem diff stat để phân loại, đề nghị tách thành refactor thuần, migration và thay đổi hành vi, và đưa đường đi tiếp: phần rủi ro thấp lên bản thứ Sáu, phần retry review kỹ sau. Tôi review theo rủi ro: idempotency, transaction, concurrency, tương thích ngược của migration, test cho lỗi giữa chừng. Tôi chạy thử, cố ý làm hỏng code xem test có bắt không. Cuối cùng đưa logic mới lên sau feature flag với tỉ lệ nhỏ và có kế hoạch rollback."

> Senior tip: tôi tách comment thành "**chặn**" (đúng sai, an toàn, dữ liệu) và "**gợi ý**" (đặt tên, phong cách), ghi rõ ở đầu comment. Tác giả biết chính xác điều gì phải sửa trước khi merge, và reviewer buộc mình ưu tiên thứ quan trọng. Về lâu dài, PR nhỏ là văn hoá: tôi khuyến khích stacked PR và feature flag để không ai phải chọn giữa "PR to" và "branch sống 3 tuần".`,
  follow: [
    'Làm sao chia một thay đổi lớn thành nhiều PR nhỏ mà vẫn merge được vào main từng phần?',
    'Bạn xử lý thế nào khi tác giả là người cấp cao hơn và không muốn tách PR?',
    'Checklist review cho code có retry gọi đối tác thanh toán gồm những gì?'
  ],
  tags: ['code review', 'pull request', 'risk', 'feature flag', 'idempotency', 'migration'],
  refs: [
    { type: 'doc', title: 'Google Engineering Practices: Small CLs', url: 'https://google.github.io/eng-practices/review/developer/small-cls.html' },
    { type: 'doc', title: 'Google Engineering Practices: What to look for in a code review', url: 'https://google.github.io/eng-practices/review/reviewer/looking-for.html' }
  ]
},
{
  id: 'scenario-086',
  topic: 'scenario',
  level: 'lead',
  q: 'Kỹ sư duy nhất hiểu module đối soát thanh toán vừa báo nghỉ việc, còn 4 tuần. Module chạy batch mỗi đêm, mỗi tháng có 2–3 lần lệch số phải xử lý tay, và chỉ anh ấy biết cách. Bạn lên kế hoạch chuyển giao kiến thức thế nào để không có sự cố sau khi anh ấy đi?',
  a: `**Tóm tắt:** đây là rủi ro "**bus factor = 1**" đã thành hiện thực. Kế hoạch 4 tuần dựa trên **làm thật** chứ không chỉ họp: tuần 1 kiểm kê kiến thức và rủi ro; tuần 2 người nhận **quan sát** (shadow) mọi việc thật; tuần 3 **đảo vai** (reverse shadow): người nhận làm, người cũ chỉ quan sát; tuần 4 người nhận tự xử lý, người cũ chỉ là phương án dự phòng. Đầu ra đo được: runbook cho từng loại lệch, người nhận tự xử lý ít nhất một ca lệch thật, và có ít nhất **hai** người nắm module. Song song, nói chuyện thẳng thắn với người sắp nghỉ để có sự hợp tác thật.

### Hiểu nhanh
Học lái xe bằng cách nghe giảng 10 buổi thì ra đường vẫn lúng túng; ngồi ghế phụ quan sát, rồi đổi sang cầm lái có thầy ngồi cạnh, rồi tự lái, mới thật sự học được. Kiến thức vận hành phần lớn là **kiến thức ngầm** (tacit): người giỏi không tự biết mình biết gì cho tới khi bị hỏi đúng tình huống.

### Tuần 1: kiểm kê
- Danh sách mọi thứ module làm: job nào, chạy lúc nào, đọc/ghi bảng nào, gọi đối tác nào, cấu hình ở đâu, quyền truy cập gì.
- Lịch sử 6 tháng các ca lệch: loại lệch, nguyên nhân, cách xử lý, script đã chạy. Từ đó xếp hạng "5 loại sự cố hay gặp nhất".
- Kiểm tra quyền và tài sản chỉ một người có: tài khoản SFTP đối tác, key, cron trên máy riêng, script trong thư mục home. Chuyển sang tài khoản team **ngay tuần 1**.
- Chọn **hai** người nhận (một chính, một phụ), không chỉ một, để không tạo lại bus factor 1.

### Tuần 2–4: làm thật
| Tuần | Người cũ | Người nhận | Đầu ra |
|---|---|---|---|
| 2 | làm, nói to từng bước | quan sát, ghi runbook | runbook nháp cho 5 loại lệch |
| 3 | quan sát, chỉ can thiệp khi sắp sai | làm theo runbook | runbook sửa lại sau mỗi lần |
| 4 | dự phòng, không chủ động | tự xử lý, kể cả trực đêm batch | ít nhất 1 ca lệch thật được xử lý độc lập |
Nếu trong 4 tuần không có ca lệch thật: dựng lại ca lệch trên môi trường staging với dữ liệu mẫu để luyện.

### Câu hỏi giúp lộ kiến thức ngầm
- "Lần gần nhất anh thức dậy lúc 3 giờ sáng vì module này là khi nào, chuyện gì?"
- "Có gì trong code mà nếu người mới sửa 'cho đẹp' sẽ gây lỗi?"
- "Anh kiểm tra gì đầu tiên khi số tổng không khớp? Vì sao lại là cái đó?"
- "Đối tác nào hay gửi file trễ/sai, liên hệ ai?"
Ghi âm/ghi hình buổi giải thích (có đồng ý), vì hỏi lại sau khi người đó đi là không được.

### Nói chuyện với người sắp nghỉ: kịch bản
"Cảm ơn anh đã báo sớm 4 tuần. Module đối soát là thứ anh hiểu nhất, và em muốn sau khi anh đi, không ai phải gọi điện làm phiền anh. Em đề xuất trong 4 tuần này anh giảm việc tính năng, tập trung chuyển giao cho Minh và Hà theo kế hoạch này. Anh thấy thiếu gì không?"
Người sắp nghỉ hợp tác tốt khi việc chuyển giao được công nhận là **công việc chính**, không phải việc thêm vào sau giờ.

### Báo lên cấp trên
Nói rõ rủi ro còn lại sau 4 tuần (ví dụ: "loại lệch do đối tác đổi định dạng file mới chỉ xảy ra một lần mỗi năm, chưa luyện được") và đề xuất phương án: thoả thuận hỗ trợ có trả phí trong 1–2 tháng sau khi nghỉ, nếu công ty và người đó đồng ý.

### Lỗi hay gặp
1. Chỉ yêu cầu "viết tài liệu": tài liệu viết vội không có chỗ người khác thật sự cần.
2. Chuyển giao cho một người duy nhất, lặp lại vấn đề.
3. Bỏ quên quyền truy cập, key, cron cá nhân: phát hiện ra khi tài khoản bị khoá ngày nghỉ.
4. Người nhận vẫn giữ nguyên khối lượng sprint, không có thời gian học.

### Trả lời miệng 1 phút
"Đây là bus factor 1 đã thành hiện thực. Tuần đầu tôi kiểm kê: job, bảng, đối tác, các loại lệch trong 6 tháng, và chuyển ngay mọi quyền, key, cron cá nhân sang tài khoản team. Tôi chọn hai người nhận. Tuần 2 họ quan sát người cũ làm thật và viết runbook, tuần 3 đảo vai, tuần 4 họ tự xử lý, người cũ chỉ dự phòng; không có ca thật thì dựng lại trên staging. Tôi hỏi những câu lộ kiến thức ngầm và ghi hình buổi giải thích. Với người sắp nghỉ, tôi biến chuyển giao thành việc chính của họ. Và tôi báo cấp trên rủi ro còn lại cùng phương án dự phòng."

> Senior tip: thời điểm rẻ nhất để xử lý bus factor là **trước** khi có người nghỉ. Tôi rà định kỳ mỗi quý: module nào chỉ một người từng deploy, từng trực sự cố hoặc từng review? Rồi luân chuyển on-call và review chéo cho đúng những module đó. Câu hỏi "nếu người này nghỉ phép 3 tuần thì sao?" nên có câu trả lời trước khi nó thành "nghỉ việc".`,
  follow: [
    'Bạn đo bus factor của team thế nào bằng dữ liệu có sẵn (Git, on-call)?',
    'Nếu người sắp nghỉ không hợp tác, bạn làm gì?',
    'Runbook tốt cho một ca lệch đối soát gồm những phần nào?'
  ],
  tags: ['lead', 'bus factor', 'knowledge transfer', 'runbook', 'handover', 'risk']
},
);
