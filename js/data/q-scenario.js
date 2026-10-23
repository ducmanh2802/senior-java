/* Topics: scenario — owner: task T16. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'scenario-001',
  topic: 'scenario',
  level: 'senior',
  q: 'API list của bạn đang chạy 5 giây. Trace cho thấy nguyên nhân là một query chậm trên bảng 50 triệu dòng. Bạn xử lý thế nào, từng bước ra sao?',
  a: `**Tóm tắt:** đo trước khi sửa — chạy {{EXPLAIN (ANALYZE)}} trên plan thật để tìm loại bước chậm (Seq Scan trên 50 triệu dòng, Sort spill ra disk, nested loop nhân số dòng), rồi sửa nguyên nhân gốc; thực tế 80–90% trường hợp chỉ cần thêm đúng 1–2 index hoặc viết lại query cho khớp index.

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
},
{
  id: 'scenario-002',
  topic: 'scenario',
  level: 'mid',
  q: 'Phân trang trang thứ 10.000 tải rất chậm, mỗi request dùng {{OFFSET}} 300.000 dòng. Bạn xử lý thế nào?',
  a: `**Tóm tắt:** {{OFFSET}} lớn buộc DB đọc và vứt toàn bộ các dòng trước đó nên càng về sau càng chậm — chuyển sang keyset pagination ({{WHERE id < :last_id ORDER BY id DESC LIMIT 20}}), mỗi trang đều O(log n) thay vì O(offset).

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

> Senior tip: khoảng 90% deadlock tôi gặp do transaction giữ lock khi gọi HTTP. Quy tắc thiết kế: mọi cuộc gọi mạng phải nằm ngoài khối BEGIN/COMMIT; bên trong transaction chỉ có đọc và ghi DB. Thêm retry với jitter giúp hệ thống sống sót giờ cao điểm.`,
  follow: [
    'Deadlock với lock wait timeout: phân biệt và xử lý hai loại này khác nhau thế nào?',
    'Khi nào bạn chọn Serializable isolation thay vì sửa thứ tự khóa mà chấp nhận chi phí?'
  ],
  tags: ['deadlock', 'locking', 'transaction', 'InnoDB']
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
- Pool size theo công thức Hikari (brettwooldridge): {{connections = cores * 2 + effective_spindle_count}} — chỉ vài chục connection; tăng size chỉ che triệu chứng.
- Tách pool cho batch/report so với OLTP để một nguồn không đè chết hai nguồn còn lại.
- Giảm {{connectionTimeout}} còn 3–5s để fail fast, tầng trên retry hoặc queue thay vì ôm chờ 30s.

### Trade-off & pitfall
- Tăng pool size vô tội vạ làm DB overload và lock contention tăng — nhiều connection không có nghĩa là nhanh hơn.
- {{maxLifetime}} phải ngắn hơn {{wait_timeout}} MySQL và idle timeout của LB/proxy, nếu không connection trong pool chết bên dưới gây lỗi lẻ khó debug.
- Không thu thập metrics Hikari là mù mát — sự cố như thế thường đã có sóng cảnh báo nhỏ cả tuần trước đó.

> Senior tip: khi pool cạn, câu hỏi đầu tiên là 'connection đang đi đâu': dùng pg_stat_activity để thấy query nào đang chạy và stack-dump Java từ PID để biết luồng kẹt ở đoạn code nào. Khoảng 90% trường hợp là một endpoint mới chậm 3s chiếm hết kết nối — sửa endpoint đó chứ không tăng pool.`,
  follow: [
    'HikariCP report apparent connection leak là sao, cấu hình nào giúp phát hiện?',
    'Khi nào nên tách connection pool cho consumer batch so với API online?'
  ],
  tags: ['HikariCP', 'connection-pool', 'troubleshooting']
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

> Senior tip: với retention 5 năm theo NHNN, tôi thiết kế ba tầng storage: hot (3 tháng gần nhất trong DB), warm (12 tháng bảng archive), cold (5 năm S3 Glacier + Athena). Truy vấn thường xuyên chỉ trên hot, hiếm khi xuyên suốt — không để cả 5 năm trong DB chính tiếp tục phình ra.`,
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
},
{
  id: 'scenario-011',
  topic: 'scenario',
  level: 'senior',
  q: 'User cần upload file 2GB lên hệ thống. Thiết kế luồng upload thế nào cho ổn định và có thể upload lại khi lỗi mạng?',
  a: `**Tóm tắt:** không cho file 2GB đi qua JVM (multipart tốn RAM/disk, dễ bị cắt timeout) — client upload thẳng S3 bằng presigned URL với multipart upload; mỗi part 100–200MB, tải song song, part lỗi retry riêng (resumable); sau khi complete, dùng S3 event để quét virus (Lambda + ClamAV) trước khi file vào bucket chính.

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

> Senior tip: chuyển upload thẳng S3 giảm tới 90% CPU/RAM của service khi xử lý file lớn. Kinh nghiệm chọn part: 100–200MB mỗi part, 4–6 luồng song song là tối ưu cho hầu hết mạng ở VN; từng part retry riêng quyết định thành bại — retry cả file là trải nghiệm tệ nhất cho người dùng 4G.`,
  follow: [
    'Client mất mạng khi đã upload 5 trên 12 part — luồng resume thiết kế thế nào?',
    'Dùng S3 ListParts để biết client đã xong part nào và bắt đầu retry từ đâu ra sao?'
  ],
  tags: ['S3', 'multipart-upload', 'presigned-url', 'virus-scan']
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

> Senior tip: 90% heap leak chỉ ra đúng một collection trong Dominator Tree; khó nhất là leak ~10MB/ngày nên soak test ≥1 tuần luôn là bước bắt buộc tôi làm trước khi release. Trước đó, đặt scheduled restart pod mỗi Tuesday là giải pháp tạm chấp nhận được trong khi chờ fix.`,
  follow: [
    'Phân biệt heap leak với native/off-heap leak thế nào để tránh đi nhầm hướng?',
    'Caffeine cache nên đặt ttl và max size sao cho vừa xài được mà không leak?'
  ],
  tags: ['memory-leak', 'heap-dump', 'MAT', 'jcmd']
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

> Senior tip: câu hỏi tôi luôn hỏi khi thiết kế audit: "khi kiểm toán viên đến, bạn trả lời trong bao lâu?" — thiết kế query theo entity + user + thời gian với index tương ứng; NHNN VN đòi lưu 5 năm, tôi luôn snapshot hash theo ngày vào vault để chứng minh dữ liệu không bị chỉnh sửa.
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
}
);
