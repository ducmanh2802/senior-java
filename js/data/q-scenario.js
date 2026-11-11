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

### Ví dụ đời thực
API "lịch sử đơn hàng của khách" chạy 5,1 giây trên bảng {{orders}} 50 triệu dòng. {{EXPLAIN (ANALYZE, BUFFERS)}}: Seq Scan, lọc {{customer_id = 812331}} bỏ 49,99 triệu dòng, rồi sort theo {{created_at}}. Có index trên {{customer_id}} nhưng câu lệnh viết {{WHERE customer_id::text = :id}} (ORM map tham số sai kiểu) nên index không dùng được. Các bước xử lý: (1) sửa kiểu tham số → Index Scan nhưng vẫn sort 18.000 dòng của khách lớn (180ms); (2) tạo {{CREATE INDEX CONCURRENTLY ON orders (customer_id, created_at DESC)}} → đọc thẳng 20 dòng đầu, 3ms; (3) API đổi sang keyset pagination; (4) thêm cảnh báo slow query > 500ms từ {{pg_stat_statements}}. p95 của API: 5,1 giây → 25ms; CPU DB giảm 35% vì truy vấn này chạy rất thường xuyên.

### Trả lời mẫu khi phỏng vấn
"Trước hết tôi xác nhận phạm vi: query nào, chạy bao nhiêu lần, ảnh hưởng bao nhiêu người, có cần giảm thiệt hại ngay không, ví dụ tạm giới hạn khoảng thời gian tra cứu. Sau đó tôi lấy đúng câu SQL thật, kèm tham số, và chạy EXPLAIN ANALYZE với BUFFERS trên bản sao production. Tôi xem node nào tốn thời gian, ước lượng số dòng so với thực tế, có seq scan hay sort lớn không. Nguyên nhân hay gặp là thiếu index phù hợp, điều kiện làm mất index như hàm hay ép kiểu, thống kê cũ, hoặc OFFSET sâu. Cách sửa theo thứ tự rủi ro: sửa câu truy vấn, tạo index composite khớp cả điều kiện lọc lẫn sắp xếp bằng CREATE INDEX CONCURRENTLY, đổi sang keyset pagination, và nếu là truy vấn báo cáo thì chuyển sang replica. Cuối cùng là cảnh báo slow query để phát hiện sớm lần sau."

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

### Cơ chế từng bước

OFFSET 300.000 LIMIT 20 làm gì:
1. DB quét từ dòng đầu tiên của bảng (theo thứ tự index nếu có, không thì quét toàn bảng).
2. Bỏ qua 300.000 dòng đầu (không trả về cho ứng dụng, nhưng đã đọc từ đĩa hoặc bộ nhớ đệm).
3. Chỉ giữ 20 dòng sau đó làm kết quả.

Chi phí tăng tuyến tính theo offset, nên trang thứ 10.000 chậm hơn trang thứ 1 rất nhiều. Nếu câu lệnh còn ORDER BY, DB phải sắp xếp toàn bộ tập kết quả trước khi cắt — gấp đôi chi phí.

Keyset pagination (con trỏ phân trang):
- Trang đầu: {{SELECT id, ... FROM t ORDER BY id DESC LIMIT 20}}
- Trang sau: {{WHERE id < :last_id ORDER BY id DESC LIMIT 20}}
- DB dùng index trên id giảm dần để nhảy trực tiếp đến vị trí cuối trang trước, đọc thêm 20 dòng, không quét những dòng đã qua.

Chi phí: {{O(log n + pageSize)}} thay vì {{O(offset + pageSize)}}. Với cột sắp xếp không duy nhất (ví dụ created_at nhiều dòng trùng), ghép thêm cột duy nhất làm phần curb của cursor: {{WHERE (created_at, id) < (:last_ts, :last_id) ORDER BY created_at DESC, id DESC}}.

### Ví dụ đời thực

Feed tin tức trên bảng posts 200 triệu dòng. Trang đầu load 120ms, nhưng khi khách hàng cuốn tới trang 5.000 (OFFSET 100.000) API mất 4,2 giây, p95 toàn hệ thống bị kéo lên. Điều tra bằng EXPLAIN (ANALYZE) cho thấy node Seq Scan quét hơn 100 triệu dòng rồi loại bỏ, CPU DB tăng 40% vào giờ cao điểm vì nhiều khách cùng cuốn feed. Cách xử lý: (1) đổi UI từ bảng số trang sang nút Xem thêm / cuộn vô hạn; (2) triển khai keyset pagination với cursor là (created_at, id) của bài cuối trang trước; (3) tạo index CREATE INDEX idx_posts_created_id ON posts (created_at DESC, id DESC); (4) giữ fallback OFFSET chỉ cho trang nhỏ hơn 100. Kết quả: trang cuối còn 18ms, CPU DB từ 40% xuống 12%, số báo lỗi timeout từ khách giảm hơn 90% trong tuần sau.

### Trả lời mẫu khi phỏng vấn

"OFFSET lớn buộc cơ sở dữ liệu đọc và loại bỏ hàng trăm nghìn dòng trước mỗi trang, nên càng cuốn sâu càng chậm. Tôi chuyển sang keyset pagination: lấy 20 bản ghi đầu theo id giảm dần, rồi mỗi trang tiếp theo dùng WHERE id nhỏ hơn id bản ghi cuối trang trước, cùng LIMIT. Vì cơ sở dữ liệu dùng index nhảy trực tiếp đến vị trí cần lấy, chi phí không phụ thuộc số trang đã qua, chỉ O(log n + pageSize). Nếu sắp xếp theo cột không duy nhất, tôi ghép thêm cột id vào cursor để không bị bỏ hoặc trùng dòng. Một điểm trade-off là keyset chỉ hỗ trợ tiếp theo / trước, không nhảy trang tùy ý, nên phải phù hợp với UX feed cuộn. Trước khi triển khai, tôi đo bằng EXPLAIN ANALYZE để xác nhận index được dùng và không còn node Sort lớn."

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

### Ví dụ đời thực
Cần thêm cột {{risk_score}} và index trên bảng {{transactions}} 200 triệu dòng (PostgreSQL 15). Lần thử đầu trên staging: {{ALTER TABLE ... ADD COLUMN risk_score int NOT NULL DEFAULT 0}} — chạy ngay vì từ PostgreSQL 11 default hằng số chỉ ghi vào metadata; nhưng lệnh vẫn cần khoá ACCESS EXCLUSIVE trong chốc lát, và trên production nó **xếp hàng sau một truy vấn báo cáo dài 6 phút**, kéo theo mọi truy vấn khác xếp sau nó → API giao dịch đứng 40 giây. Làm lại đúng cách: {{SET lock_timeout = '3s'}} + retry tự động cho DDL; chạy vào giờ thấp điểm sau khi kiểm tra không có transaction dài ({{pg_stat_activity}}); index tạo bằng {{CREATE INDEX CONCURRENTLY}} (chạy 25 phút, không chặn ghi; kiểm tra index không ở trạng thái INVALID sau khi xong). Ứng dụng phát hành theo thứ tự: migration thêm cột trước, code dùng cột sau.

### Trả lời mẫu khi phỏng vấn
"Tôi phân loại thao tác. Thêm cột nullable hoặc có default hằng số trên PostgreSQL 11 trở lên chỉ đổi metadata nên rất nhanh; nhưng mọi ALTER TABLE vẫn cần khoá độc quyền trong chốc lát, và nguy hiểm nhất là lệnh DDL xếp hàng sau một transaction dài rồi chặn mọi truy vấn phía sau. Nên tôi luôn đặt lock_timeout vài giây kèm retry, và kiểm tra không có transaction dài trước khi chạy. Index thì tạo bằng CREATE INDEX CONCURRENTLY, không chặn ghi, chạy ngoài transaction, và kiểm tra không bị INVALID nếu lỗi giữa chừng. Ràng buộc NOT NULL hay khoá ngoại thì thêm dạng NOT VALID rồi VALIDATE sau. Phía ứng dụng, tôi theo expand và contract: thêm cột trước, code mới dùng cột sau, và không bao giờ đổi tên hay xoá cột trong cùng release với code dùng nó."

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

### Ví dụ đời thực
Báo cáo cuối ngày (tổng hợp 30 triệu giao dịch theo merchant, kênh, giờ) chạy lúc 18:00 trên DB chính, mất 25 phút, đẩy CPU DB lên 95% và p99 API thanh toán từ 120ms lên 2,8 giây trong suốt thời gian đó. Thêm vào đó, transaction dài của báo cáo làm autovacuum không dọn được dead tuple, bảng phình 15%. Giải pháp theo bước: (1) chuyển báo cáo sang **read replica** riêng cho báo cáo, đặt {{hot_standby_feedback}} cân nhắc kỹ và {{max_standby_streaming_delay}} hợp lý để truy vấn dài không bị huỷ; (2) thay vì quét lại cả ngày, duy trì bảng **tổng hợp tăng dần** mỗi 15 phút (chỉ xử lý giao dịch mới); (3) về lâu dài đẩy dữ liệu sang kho phân tích (ClickHouse/BigQuery) bằng CDC. API thanh toán không còn bị ảnh hưởng; báo cáo cuối ngày còn 40 giây vì phần lớn đã được tổng hợp trước.

### Trả lời mẫu khi phỏng vấn
"Báo cáo nặng và giao dịch không nên tranh tài nguyên trên cùng một DB. Việc đầu tiên là đo: báo cáo tốn CPU, IO hay khoá, chạy bao lâu, ảnh hưởng p99 của API bao nhiêu. Ngắn hạn, tôi chuyển báo cáo sang read replica dành riêng, chấp nhận dữ liệu trễ vài giây, cấu hình để truy vấn dài trên replica không bị huỷ và không làm phình bảng trên primary. Trung hạn, tôi tối ưu bản thân báo cáo: index phù hợp, và quan trọng hơn là tổng hợp tăng dần, chỉ xử lý dữ liệu mới mỗi vài phút thay vì quét lại cả ngày. Dài hạn, nếu nhu cầu phân tích tăng, tôi đưa dữ liệu sang kho phân tích chuyên dụng qua CDC. Nếu buộc phải chạy trên primary, tôi giới hạn tài nguyên, chạy giờ thấp điểm và chia nhỏ theo khoảng thời gian."

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

### Ví dụ đời thực
Hệ thống kho có deadlock 5–10 lần mỗi giờ cao điểm. Log PostgreSQL cho thấy hai loại câu lệnh luôn đi cặp: {{UPDATE inventory ... WHERE sku = ?}} từ luồng **đặt hàng** (giỏ hàng nhiều SKU, cập nhật theo thứ tự khách thêm vào giỏ) và từ luồng **nhập kho** (cập nhật theo thứ tự trong phiếu nhập). Hai luồng khoá cùng tập SKU theo thứ tự khác nhau. Sửa: sắp danh sách SKU theo mã trước khi cập nhật ở **cả hai** luồng; giảm thời gian giữ khoá bằng cách đưa lời gọi tính phí vận chuyển ra khỏi transaction; thêm retry 2 lần cho lỗi deadlock (SQLState 40P01). Deadlock giảm về 0–1 lần mỗi ngày. Bài học: tìm **các cặp câu lệnh** trong log deadlock, không chỉ một câu.

### Trả lời mẫu khi phỏng vấn
"Deadlock là vòng chờ khoá giữa các transaction; DB tự phát hiện và huỷ một bên, nên triệu chứng là một tỉ lệ nhỏ request lỗi lúc cao điểm. Tôi bắt đầu từ log deadlock của DB, PostgreSQL ghi chi tiết các process và câu lệnh liên quan, để tìm cặp câu lệnh tạo vòng. Nguyên nhân hay gặp nhất là hai luồng khoá cùng một tập dòng theo thứ tự khác nhau, như chuyển tiền hai chiều hay cập nhật nhiều SKU theo thứ tự khác nhau. Cách sửa gốc là khoá theo một thứ tự nhất quán, ví dụ sắp theo id; giữ transaction ngắn, không gọi dịch vụ ngoài bên trong; đảm bảo có index để không khoá thừa dòng. Retry có giới hạn cho lỗi deadlock là lưới an toàn. Tôi theo dõi số deadlock theo giờ để biết sửa đã hiệu quả chưa."

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

### Ví dụ đời thực
Lúc 20:00 mỗi tối (giờ chạy khuyến mãi), API lỗi {{Connection is not available, request timed out after 30000ms}}. Metric Hikari: {{active=20/20}}, {{pending=180}}, nhưng DB CPU chỉ 30% và số truy vấn đang chạy thấp. Thread dump cho thấy 20 thread đang giữ connection và **chờ HTTP** tới dịch vụ khuyến mãi (mất 4–8 giây lúc tải cao) — lời gọi nằm **bên trong** method {{@Transactional}}. Mỗi request giữ connection gấp 40 lần thời gian cần thiết. Sửa: tách lời gọi HTTP ra trước transaction, đặt timeout 800ms + circuit breaker cho dịch vụ khuyến mãi, bật {{leakDetectionThreshold}} trên staging để bắt các chỗ tương tự (tìm thêm 2 chỗ). Không tăng pool size. Lỗi biến mất; thời gian giữ connection trung bình từ 3,2 giây xuống 40ms.

### Trả lời mẫu khi phỏng vấn
"Lỗi này nghĩa là thread chờ quá 30 giây mà không lấy được connection từ pool Hikari, tức mọi connection đang bị dùng. Tôi xem metric active, idle, pending của pool và so với tải DB: nếu DB đang quá tải thì vấn đề ở query chậm; nếu DB rảnh mà pool vẫn đầy thì connection đang bị giữ lâu vì lý do khác. Nguyên nhân hay gặp là gọi HTTP hay xử lý nặng bên trong transaction, transaction quá dài, rò rỉ connection không đóng trên nhánh lỗi, hoặc REQUIRES_NEW cần hai connection mỗi luồng. Tôi dùng thread dump để xem các thread giữ connection đang làm gì, bật leakDetectionThreshold để tìm chỗ không trả connection. Tăng pool size chỉ là giải pháp cuối, vì DB có giới hạn connection và thường chỉ dời điểm nghẽn sang DB."

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

### Ví dụ đời thực
Bảng {{audit_events}} 300 triệu dòng (1,1TB), chỉ cần giữ 13 tháng. Lần thử đầu: {{DELETE FROM audit_events WHERE created_at < ...}} một câu → chạy 3 giờ, sinh 400GB WAL, replica tụt 2 giờ, bảng không nhỏ đi (DELETE chỉ đánh dấu dead tuple), phải huỷ. Làm lại: (1) xuất dữ liệu cũ ra S3 dạng Parquet theo tháng (để còn tra cứu khi kiểm toán), kiểm tra số dòng khớp; (2) xoá theo lô 10.000 dòng theo khoá chính, nghỉ giữa các lô, tự dừng khi replica lag > 10 giây; (3) chuyển bảng sang **partition theo tháng** cho dữ liệu mới — từ đó việc dọn dữ liệu chỉ là {{DETACH PARTITION}} + {{DROP TABLE}} trong vài giây, không sinh WAL lớn; (4) {{pg_repack}} để thu hồi dung lượng cho phần cũ không cần khoá lâu. Đĩa giảm từ 1,1TB còn 380GB, không ảnh hưởng người dùng.

### Trả lời mẫu khi phỏng vấn
"Một câu DELETE khổng lồ là cách nhanh nhất làm sập DB: transaction dài, sinh lượng WAL rất lớn làm replica tụt lại, khoá và bloat, mà bảng cũng không nhỏ đi vì DELETE chỉ đánh dấu dòng chết. Tôi làm theo bước: xác nhận yêu cầu lưu trữ và kiểm toán, xuất dữ liệu cũ ra kho rẻ như S3 dạng Parquet và kiểm tra số dòng, rồi xoá theo lô nhỏ theo khoá chính, có nghỉ giữa các lô và tự dừng khi replica lag cao. Sau đó thu hồi dung lượng bằng pg_repack hoặc VACUUM FULL vào lúc phù hợp. Về lâu dài, tôi chuyển bảng sang partition theo thời gian, vì khi đó dọn dữ liệu cũ chỉ là detach rồi drop một partition, mất vài giây và gần như không sinh WAL. Dữ liệu dạng log hay sự kiện nên được thiết kế partition từ đầu."

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

### Ví dụ đời thực
Hệ thống điểm thưởng: hai sự kiện "cộng điểm" cho cùng một khách đến từ hai consumer Kafka khác nhau (mua hàng và đánh giá sản phẩm) gần như cùng lúc. Code {{Wallet w = repo.findById(id); w.setPoints(w.getPoints() + delta); repo.save(w);}} → khoảng 0,3% lần cộng điểm bị mất, khách khiếu nại "thiếu điểm". Vì phép tính chỉ là cộng, team đổi thành câu lệnh nguyên tử {{UPDATE wallet SET points = points + :delta WHERE id = :id}} (repository {{@Modifying}} query). Với màn hình nhân viên CSKH chỉnh điểm thủ công (form có nhiều trường), dùng {{@Version}} và trả 409 khi xung đột. Đối soát điểm với bảng lịch sử sự kiện phát hiện và bù 2.400 lần cộng bị mất trước đó.

### Trả lời mẫu khi phỏng vấn
"Lost update xảy ra khi hai bên cùng đọc giá trị, cùng tính ở ứng dụng rồi cùng ghi, lần ghi sau đè mất lần ghi trước; ở mức isolation mặc định DB không báo lỗi. Tôi chọn cách sửa theo loại thao tác. Nếu phép tính biểu diễn được bằng SQL như cộng trừ số lượng, tôi đẩy nó vào một câu UPDATE nguyên tử, có điều kiện nếu cần như không cho âm. Nếu là chỉnh sửa nhiều trường qua form, tôi dùng optimistic locking với cột version, trả 409 để người dùng tải lại. Nếu xung đột thường xuyên và logic phức tạp, tôi dùng SELECT FOR UPDATE với transaction ngắn và thứ tự khoá cố định. Ngoài ra, khi phát hiện lost update trên production, tôi đối soát với nguồn sự kiện gốc để bù dữ liệu đã sai."

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

### Ví dụ đời thực
Import danh sách 1,2 triệu khách hàng từ Excel của đối tác. Bản đầu đọc cả file bằng Apache POI kiểu DOM (heap 6GB, OOM), rồi {{save()}} từng dòng qua JPA (ước tính 9 giờ). Làm lại: (1) đọc **streaming** (SAX/{{XSSF}} event API hoặc chuyển đối tác sang CSV); (2) validate từng dòng, dòng lỗi ghi vào file lỗi kèm số dòng và lý do thay vì dừng cả job; (3) ghi vào **bảng staging** bằng {{COPY}}/JDBC batch 5.000 dòng (khoảng 3 phút); (4) một câu {{INSERT ... SELECT ... ON CONFLICT (external_id) DO UPDATE}} từ staging sang bảng chính, theo lô, để chạy lại an toàn (idempotent theo mã khách của đối tác); (5) lưu trạng thái job (đã đọc tới dòng nào, bao nhiêu lỗi). Tổng thời gian 7 phút, 1.830 dòng lỗi được trả lại cho đối tác sửa, chạy lại lần hai không tạo bản ghi trùng.

### Trả lời mẫu khi phỏng vấn
"Với file một triệu dòng, tôi thiết kế ba yêu cầu: không tải cả file vào bộ nhớ, ghi nhanh, và chạy lại được an toàn. Tôi đọc streaming, với Excel dùng event API thay vì đọc cả workbook. Mỗi dòng được validate, dòng lỗi ghi vào báo cáo lỗi kèm số dòng và lý do thay vì làm hỏng cả job. Dữ liệu hợp lệ ghi vào bảng staging bằng COPY hoặc JDBC batch, nhanh hơn rất nhiều so với save từng entity. Sau đó chuyển từ staging sang bảng chính bằng INSERT SELECT với ON CONFLICT theo khoá nghiệp vụ, nên chạy lại không tạo trùng. Job lưu trạng thái tiến độ để tiếp tục khi lỗi, chạy bất đồng bộ, người dùng xem tiến độ và tải file lỗi. Với nhu cầu lặp lại, Spring Batch cung cấp sẵn chunk, skip, restart."

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

### Ví dụ đời thực
Nút "Xuất CSV" cho 5 triệu dòng giao dịch: bản đầu {{findAll()}} vào List rồi dựng chuỗi CSV trong bộ nhớ → OOM, pod restart, mọi người dùng khác bị ảnh hưởng. Thiết kế lại thành **job bất đồng bộ**: API trả {{202 Accepted}} kèm id job; worker đọc bằng cursor ({{fetchSize=5000}}, hoặc JdbcTemplate với RowCallbackHandler) và ghi thẳng ra luồng nén gzip **upload multipart lên S3** (không qua đĩa local); xong thì tạo **presigned URL** hết hạn sau 24 giờ và gửi thông báo cho người dùng. Giới hạn: mỗi người tối đa 2 job đồng thời; truy vấn chạy trên read replica. Bộ nhớ worker ổn định khoảng 200MB; xuất 5 triệu dòng mất khoảng 3 phút, file nén 420MB. Lưu ý bảo mật: cột chứa giá trị bắt đầu bằng {{=}}, {{+}}, {{-}}, {{@}} được thêm dấu nháy để tránh **CSV injection** khi mở bằng Excel.

### Trả lời mẫu khi phỏng vấn
"Xuất năm triệu dòng không thể làm đồng bộ trong một request rồi dựng cả file trong bộ nhớ. Tôi biến nó thành job bất đồng bộ: API trả 202 kèm id để theo dõi, một worker đọc dữ liệu bằng cursor hoặc streaming với fetch size hợp lý trên read replica, ghi từng dòng thẳng vào luồng nén rồi upload multipart lên S3, nên bộ nhớ không phụ thuộc kích thước dữ liệu. Xong thì tạo presigned URL có hạn và thông báo cho người dùng. Tôi giới hạn số job đồng thời mỗi người, có tiến độ và khả năng huỷ, và xử lý CSV injection cho các ô bắt đầu bằng dấu bằng hay cộng trừ. Nếu dữ liệu nhỏ hơn và cần tải ngay, có thể stream trực tiếp qua StreamingResponseBody, nhưng vẫn phải đọc bằng cursor."

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

### Luồng upload trực tiếp lên S3 (multipart)
~~~seq
title: Upload file 2GB có thể tiếp tục khi lỗi mạng
actors: Browser | Backend | S3
Browser -> Backend: POST /uploads (tên, kích thước, hash)
Backend -> S3: CreateMultipartUpload
Backend --> Browser: uploadId + presigned URL cho từng phần 10MB
Browser -> S3: PUT phần 1..200 (song song 4 phần)
S3 --> Browser: ETag của từng phần
Browser -> Backend: POST /uploads/id/complete (danh sách ETag)
Backend -> S3: CompleteMultipartUpload
Backend -> Backend: quét virus, kiểm tra hash, đánh dấu READY
~~~

### Ví dụ đời thực
Hệ thống hồ sơ bảo hiểm cho đại lý tải lên video và hồ sơ scan tới 2GB. Bản đầu upload qua backend (Spring {{MultipartFile}}): mỗi file chiếm thread và đĩa tạm của pod trong 10–20 phút, mất mạng ở 95% là phải tải lại từ đầu; 4G yếu ở tỉnh khiến 30% lần tải thất bại. Chuyển sang luồng trên: trình duyệt tải trực tiếp lên S3 bằng presigned URL theo phần 10MB, phần lỗi được tải lại riêng, có thể tiếp tục sau khi tắt trình duyệt (lưu uploadId). Backend chỉ điều phối. Lifecycle rule tự huỷ multipart upload dang dở sau 3 ngày (tránh tính tiền phần rác). Tỉ lệ thất bại còn khoảng 2%, backend không còn bị chiếm thread.

### Trả lời mẫu khi phỏng vấn
"Với file lớn, tôi không cho dữ liệu đi qua backend. Backend chỉ điều phối: tạo multipart upload trên S3 và cấp presigned URL cho từng phần, ví dụ mỗi phần mười megabyte; trình duyệt tải trực tiếp các phần lên S3, song song vài phần, phần nào lỗi thì tải lại riêng phần đó, và lưu uploadId để tiếp tục sau khi mất mạng hay tắt trình duyệt. Khi đủ phần, client gửi danh sách ETag để backend hoàn tất upload. Sau đó file được xử lý bất đồng bộ: kiểm tra hash, quét virus, kiểm tra định dạng, rồi mới đánh dấu sẵn sàng. Tôi giới hạn kích thước và loại file, presigned URL có hạn ngắn và gắn với đúng object key, và đặt lifecycle rule để dọn các multipart upload dang dở."

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

### Ví dụ đời thực
Job tính lãi tiết kiệm hằng đêm chạy trên 3 pod với {{@Scheduled}}. Sau khi tăng replica từ 1 lên 3, một đêm **lãi được cộng 3 lần** cho khoảng 41.000 tài khoản (tổng chênh 1,9 tỷ đồng, phải đảo bút toán). Một đêm khác job crash ở 70% vì DB failover và chạy lại **từ đầu** — các tài khoản đã cộng lãi bị cộng lần nữa. Thiết kế lại: (1) chỉ một instance chạy nhờ **ShedLock** (khoá trong bảng DB, có {{lockAtMostFor}}); (2) job xử lý theo lô 1.000 tài khoản, mỗi lô một transaction, ghi **checkpoint** (id tài khoản cuối của lô) trong bảng {{job_progress}}; (3) mỗi bút toán lãi có **khoá idempotent** {{(account_id, interest_date)}} với unique constraint, nên chạy lại không bao giờ cộng hai lần; (4) cảnh báo nếu job không hoàn tất trước 05:00. Spring Batch cung cấp sẵn (2) qua JobRepository nếu muốn dùng framework.

### Trả lời mẫu khi phỏng vấn
"Hai vấn đề cần giải riêng. Chạy trùng: khi có nhiều instance, mỗi instance đều kích hoạt scheduler, nên tôi đảm bảo chỉ một nơi chạy, bằng distributed lock như ShedLock với bảng khoá trong DB và thời hạn khoá tối đa, hoặc chuyển job sang Kubernetes CronJob với concurrencyPolicy Forbid. Nhưng khoá có thể hết hạn hoặc lỗi, nên job vẫn phải idempotent: mỗi kết quả ghi ra có khoá nghiệp vụ duy nhất, như tài khoản cộng ngày tính lãi, với unique constraint để chạy lại không tạo trùng. Mất tiến độ: xử lý theo lô, mỗi lô một transaction, ghi checkpoint sau mỗi lô để restart tiếp từ chỗ dừng; Spring Batch có sẵn cơ chế này. Cuối cùng là giám sát: cảnh báo khi job không hoàn tất đúng hạn, và đối soát kết quả."

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

### Ví dụ đời thực
Chiến dịch thông báo khuyến mãi tới 1,2 triệu khách: bản đầu một vòng lặp gọi API của nhà cung cấp email (ESP) với 200 thread → trong 3 phút đầu bắn 60.000 email, ESP trả 429 rồi **tạm khoá tài khoản** vì vượt hạn mức và tỉ lệ bounce cao (danh sách cũ có 8% địa chỉ chết) — kéo theo email OTP giao dịch (dùng chung tài khoản ESP) cũng không gửi được trong 2 giờ. Thiết kế lại: tách **tài khoản/IP gửi riêng** cho email giao dịch và email marketing; đưa yêu cầu gửi vào hàng đợi (SQS/Kafka), worker gửi theo **token bucket** khớp hạn mức ESP (ví dụ 100 email/giây), tôn trọng {{Retry-After}}; làm sạch danh sách trước (loại bounce cứng, người đã huỷ đăng ký); mỗi thông báo có khoá idempotent {{(campaign_id, user_id)}} để retry không gửi trùng; theo dõi tỉ lệ bounce và khiếu nại spam, tự dừng chiến dịch nếu vượt ngưỡng. Chiến dịch tiếp theo gửi xong 1,2 triệu email trong khoảng 3,5 giờ, không bị khoá, email OTP không bị ảnh hưởng.

### Trả lời mẫu khi phỏng vấn
"Gửi một triệu thông báo là bài toán xếp hàng và giới hạn tốc độ. Tôi đưa yêu cầu gửi vào hàng đợi, worker lấy ra và gửi theo token bucket khớp với hạn mức của nhà cung cấp, tôn trọng 429 và Retry-After, có retry với backoff. Mỗi thông báo có khoá idempotent theo chiến dịch và người nhận, để retry hay chạy lại không gửi trùng. Rất quan trọng là tách luồng: email giao dịch như OTP dùng tài khoản hoặc IP gửi riêng, ưu tiên cao, để chiến dịch marketing có sự cố cũng không làm hỏng OTP. Trước khi gửi, tôi làm sạch danh sách để giữ uy tín tên miền gửi, và theo dõi tỉ lệ bounce, khiếu nại spam để tự dừng khi vượt ngưỡng. Lịch gửi có thể chia theo múi giờ hoặc theo đợt để không dồn tải về hệ thống của mình khi người dùng bấm vào link."

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

### Ví dụ đời thực
Deploy phiên bản mới lúc 14:00, p99 từ 200ms lên 2 giây sau 10 phút, CPU tăng từ 40% lên 85%. Quyết định trong 5 phút đầu: SLO bị vi phạm, chưa có giả thuyết → **rollback** (Argo CD revert, 4 phút), p99 trở về bình thường. Điều tra sau trên staging với tải ghi lại: profiler cho thấy 45% CPU nằm trong {{Pattern.compile}} — một dev chuyển validation sang dùng {{String.matches(regex)}} trong vòng lặp nóng (mỗi lần gọi biên dịch lại regex). Sửa thành {{static final Pattern}}, thêm benchmark cho hàm validate vào CI. Quy trình được bổ sung: **canary 5%** trong 15 phút với ngưỡng tự động rollback (p99 tăng > 30% hoặc lỗi > 1%), so sánh CPU/allocation giữa canary và bản cũ trên dashboard.

### Trả lời mẫu khi phỏng vấn
"Quy tắc đầu tiên: nếu đang vi phạm SLO và ảnh hưởng người dùng mà chưa có giả thuyết rõ trong vài phút, tôi rollback trước, điều tra sau, vì thời gian ảnh hưởng quan trọng hơn việc tìm ra nguyên nhân ngay. Điều tra tôi làm theo thứ tự: khoanh thời điểm so với lúc deploy; xem p50 so với p99 và tài nguyên: CPU tăng thì có thể là code tốn CPU hơn, CPU bình thường thì là chờ I/O hay lock; so trace trước và sau để tìm span phình ra; xem diff của bản deploy gồm code, cấu hình, thư viện, migration; tái hiện trên staging với tải giống thật và dùng profiler. Để lần sau phát hiện sớm hơn, tôi dùng canary với ngưỡng tự động rollback dựa trên p99 và tỉ lệ lỗi, và có benchmark cho đường nóng trong CI."

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

### Ví dụ đời thực
Pod Java bị restart vài giờ một lần với lý do **OOMKilled** (exit code 137), nhưng log ứng dụng **không có** {{OutOfMemoryError}} và heap chỉ dùng 60% của {{-Xmx}}. Phân biệt hai loại: OOMKilled là **kernel/cgroup giết** process vì tổng bộ nhớ container vượt limit; {{OutOfMemoryError}} là JVM hết heap. Ở đây limit 2GB, {{-Xmx1800m}} cố định → heap 1,8GB cộng metaspace, thread stack (300 thread × 1MB), code cache, direct buffer của Netty (khoảng 300MB) vượt 2GB. Bật Native Memory Tracking ({{-XX:NativeMemoryTracking=summary}} + {{jcmd VM.native_memory}}) xác nhận phần ngoài heap khoảng 650MB. Sửa: bỏ {{-Xmx}} cố định, dùng {{-XX:MaxRAMPercentage=70}}, giới hạn {{-XX:MaxDirectMemorySize}}, giảm số thread; thêm {{-XX:+HeapDumpOnOutOfMemoryError}} ghi vào volume để trường hợp OOM heap thật có bằng chứng. Không còn OOMKilled trong 2 tháng.

### Trả lời mẫu khi phỏng vấn
"Đầu tiên tôi phân biệt hai loại. OOMKilled, exit code 137, là container vượt memory limit và bị kernel giết, thường không để lại dấu vết gì trong log Java. OutOfMemoryError là JVM hết một vùng nhớ như heap hay metaspace, có stack trace và có thể lấy heap dump. Với OOMKilled, tôi nhớ rằng bộ nhớ của JVM không chỉ là heap: còn metaspace, stack của mỗi thread, code cache, direct buffer, bộ nhớ native của thư viện. Nếu Xmx đặt sát limit thì phần còn lại không có chỗ. Tôi dùng Native Memory Tracking để đo, chuyển sang MaxRAMPercentage khoảng 70 đến 75%, giới hạn direct memory. Với OutOfMemoryError heap, tôi bật HeapDumpOnOutOfMemoryError ghi vào volume bền, phân tích bằng MAT để tìm leak hoặc đối tượng chiếm nhiều nhất."

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

### Ví dụ đời thực
Service gợi ý tăng khoảng 200MB heap mỗi ngày, Old Gen sau mỗi Full GC cao dần, phải restart mỗi tuần. Lấy **hai heap dump cách nhau 6 giờ** ({{jcmd <pid> GC.heap_dump}}) và so trong Eclipse MAT: lớp tăng nhiều nhất là {{ConcurrentHashMap$Node}} trong một {{static Map<String, List<Recommendation>>}} dùng làm cache "tạm" — khoá là {{userId + ":" + sessionId}}, không bao giờ bị xoá. Dominator tree: map đó giữ 2,3GB. Sửa: thay bằng Caffeine với {{maximumSize(200_000)}} và {{expireAfterAccess(30 phút)}}, thêm metric kích thước cache. Một lỗi phụ tìm được trong cùng dump: {{ThreadLocal}} chứa đối tượng người dùng không được {{remove()}} sau request trong thread pool — dữ liệu sống mãi theo thread và có nguy cơ rò sang request của người khác; sửa bằng {{try/finally remove()}}. Heap ổn định quanh 1,1GB.

### Trả lời mẫu khi phỏng vấn
"Bộ nhớ tăng đều theo ngày gần như chắc chắn là có thứ được giữ lại mãi. Tôi xác nhận bằng GC log hoặc metric: heap sau mỗi lần GC lớn tăng dần chứ không chỉ heap đang dùng. Sau đó lấy hai heap dump cách nhau vài giờ, mở bằng Eclipse MAT, so sánh xem lớp nào tăng nhiều nhất, dùng dominator tree để thấy đối tượng nào giữ nhiều bộ nhớ nhất và đường tới GC root để biết ai đang giữ nó. Thủ phạm hay gặp: cache tự viết bằng map static không có giới hạn hay hết hạn, ThreadLocal không remove trong thread pool, listener hoặc callback đăng ký mà không gỡ, collection tích luỹ trong singleton. Cách sửa là dùng cache có giới hạn như Caffeine, luôn remove ThreadLocal trong finally, và thêm metric kích thước cho mọi cấu trúc tích luỹ."

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

### Ví dụ đời thực
Dịch vụ tra cứu mã số thuế của bên thứ ba (dùng khi khách doanh nghiệp đăng ký) thỉnh thoảng chậm 20–30 giây. Service đăng ký gọi đồng bộ với timeout mặc định của RestTemplate (vô hạn) → thread Tomcat bị giữ, cạn pool, và cả các API **không liên quan** (đăng nhập, xem hồ sơ) trong cùng service cũng lỗi. Bảo vệ nhiều lớp: timeout 2 giây; Resilience4j circuit breaker + bulkhead riêng cho dịch vụ này (tối đa 20 lời gọi đồng thời); **fallback có nghiệp vụ**: cho phép tạo tài khoản ở trạng thái "chờ xác minh mã số thuế", job nền xác minh lại sau; cache kết quả tra cứu 24 giờ (mã số thuế ít thay đổi). Kèm dashboard riêng cho từng nhà cung cấp và SLA trong hợp đồng. Lần nhà cung cấp gặp sự cố 3 giờ sau đó, việc đăng ký vẫn hoạt động, 1.100 tài khoản được xác minh bù trong 20 phút sau khi họ phục hồi.

### Trả lời mẫu khi phỏng vấn
"Tôi coi mọi dịch vụ bên thứ ba là sẽ chậm và sẽ lỗi, và bảo vệ theo lớp. Timeout ngắn và rõ ràng cho cả kết nối lẫn đọc, không bao giờ để mặc định vô hạn. Bulkhead, tức giới hạn số lời gọi đồng thời riêng cho mỗi nhà cung cấp, để một bên chậm không chiếm hết thread của cả service. Circuit breaker để thất bại nhanh khi họ đang hỏng và cho họ thời gian hồi phục. Retry có giới hạn với backoff, chỉ cho lỗi tạm thời và thao tác idempotent. Quan trọng nhất là fallback có ý nghĩa nghiệp vụ: chuyển sang trạng thái chờ và xử lý bù bằng job nền, dùng dữ liệu cache, hoặc nhà cung cấp dự phòng, thay vì báo lỗi cho người dùng. Những gì không cần ngay thì chuyển sang bất đồng bộ qua hàng đợi. Và có dashboard, cảnh báo riêng cho từng nhà cung cấp."

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

### Ví dụ đời thực
Trang chủ thương mại điện tử cache danh sách "sản phẩm nổi bật" trong Redis với TTL 10 phút. Đúng 20:00 khi khuyến mãi bắt đầu, key hết hạn, **3.000 request đồng thời** thấy cache miss và cùng chạy truy vấn nặng (1,2 giây) → DB CPU 100%, mọi API khác chậm theo, cửa hàng gần như đứng 4 phút (cache stampede). Sửa: (1) chỉ **một** request được nạp lại ({{SET key:lock NX PX 5000}} trên Redis, request khác trả bản cũ hoặc chờ ngắn); (2) **làm mới trước khi hết hạn** — giữ bản cũ thêm 5 phút, nạp lại nền khi còn 1 phút (Caffeine {{refreshAfterWrite}} cho cache tầng ứng dụng); (3) TTL có **jitter ngẫu nhiên** ±20% để các key không hết hạn cùng lúc; (4) cache 2 tầng: Caffeine trong JVM (30 giây) trước Redis. Khi Redis bị sự cố 15 phút sau đó, tầng Caffeine cùng giới hạn đồng thời vào DB (semaphore) giữ cho trang chủ vẫn chạy với dữ liệu hơi cũ.

### Trả lời mẫu khi phỏng vấn
"Cache stampede là khi một key nóng hết hạn và hàng nghìn request cùng lúc thấy miss, cùng đi vào DB tính lại một kết quả đắt, làm DB quá tải. Tôi chống bằng nhiều cách kết hợp. Chỉ cho một request nạp lại, các request khác dùng bản cũ hoặc chờ ngắn, bằng khoá trên Redis với SET NX có hạn, hoặc cơ chế gộp request của cache trong JVM. Làm mới trước khi hết hạn: giữ bản cũ thêm một khoảng và nạp lại nền, như refreshAfterWrite của Caffeine. Thêm jitter ngẫu nhiên vào TTL để các key không cùng hết hạn. Về Redis down: ứng dụng phải chịu được, timeout ngắn khi gọi Redis, circuit breaker, có cache tầng hai trong JVM cho dữ liệu nóng, và giới hạn số request đồng thời được phép đi thẳng vào DB, chấp nhận dữ liệu hơi cũ thay vì làm sập DB."

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

### Ví dụ đời thực
Sàn thương mại điện tử chuẩn bị ngày 11/11 với dự báo tải gấp 10 lần (từ 800 lên 8.000 request/giây vào giờ mở bán). Kế hoạch 6 tuần:
- **Tuần 1–2**: liệt kê hành trình quan trọng (xem sản phẩm, giỏ hàng, thanh toán); load test từng hành trình ở 12.000 rps → tìm ra 3 điểm gãy: pool DB (tổng pool các pod vượt {{max_connections}}), một truy vấn tồn kho thiếu index, giới hạn API của cổng thanh toán (2.000 giao dịch/phút — phải đàm phán nâng).
- **Tuần 3–4**: sửa, thêm PgBouncer, cache danh mục ở CDN, hàng đợi cho xử lý sau thanh toán (email, điểm thưởng), feature flag tắt được tính năng không thiết yếu (gợi ý, đánh giá).
- **Tuần 5**: tăng trước số node và replica (không trông chờ autoscaling phản ứng kịp lúc 0 giờ), diễn tập sự cố (tắt một replica DB, làm chậm cổng thanh toán).
- **Ngày sự kiện**: đóng băng deploy, phòng trực có runbook và kênh liên lạc với đối tác.
Kết quả: đỉnh thực tế 9.400 rps, p99 thanh toán 420ms; khi cổng thanh toán chậm lúc 0:07, hàng đợi đặt hàng và trạng thái "đang xử lý" giữ trải nghiệm ổn định.

### Trả lời mẫu khi phỏng vấn
"Tôi bắt đầu từ con số: tải dự kiến theo từng hành trình quan trọng, nhân hệ số an toàn, và mục tiêu p99, tỉ lệ lỗi. Sau đó load test từng hành trình trên môi trường giống production để tìm điểm gãy đầu tiên, thường là connection DB, một truy vấn thiếu index, hay giới hạn của đối tác như cổng thanh toán, rồi sửa và test lại. Các biện pháp tôi hay dùng: cache và CDN cho dữ liệu đọc nhiều, đưa xử lý không cần ngay sang hàng đợi, feature flag để tắt tính năng không thiết yếu, rate limit và hàng chờ ảo ở cửa vào để bảo vệ hệ thống. Tôi scale trước thay vì trông chờ autoscaling phản ứng kịp, diễn tập sự cố, và trao đổi trước với đối tác về hạn mức. Ngày sự kiện thì đóng băng thay đổi, có phòng trực với runbook và dashboard theo hành trình."

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

### Ví dụ đời thực
App bán vé: trên mạng 3G, request thanh toán mất 12 giây, app hiển thị spinner rồi timeout ở 10 giây và **tự retry**; người dùng còn bấm lại lần nữa. Server nhận 3 request, mỗi cái tạo một lệnh trừ tiền thẻ → khoảng 0,4% đơn bị trừ tiền 2–3 lần, chi phí hoàn tiền và khiếu nại lớn. Sửa theo nhiều lớp: (1) client sinh **Idempotency-Key** (UUID) **một lần cho mỗi ý định thanh toán**, gửi lại cùng key khi retry; (2) server lưu {{(idempotency_key, request_hash, status, response)}} với unique constraint — request trùng key đang xử lý thì trả 409/202, đã xong thì trả lại **đúng response cũ**, cùng key mà nội dung khác thì 422; (3) gửi key này sang cổng thanh toán (đa số cổng hỗ trợ idempotency key) để chính cổng cũng không trừ hai lần; (4) UI khoá nút sau lần bấm đầu. Tỉ lệ trừ tiền trùng về 0; đối soát hằng ngày xác nhận.

### Trả lời mẫu khi phỏng vấn
"Bấm hai lần và retry sau timeout là chuyện chắc chắn xảy ra, nên API thanh toán phải idempotent. Client sinh một idempotency key cho mỗi ý định thanh toán và gửi lại đúng key đó mỗi lần retry. Server lưu key cùng hash của nội dung request, trạng thái và response trong bảng có unique constraint, ghi cùng transaction với việc tạo giao dịch. Request đến với key đã hoàn tất thì trả lại đúng response cũ; key đang xử lý thì trả 409 hoặc 202 để client hỏi lại sau; cùng key mà nội dung khác thì báo lỗi. Tôi truyền key tiếp sang cổng thanh toán vì đa số cổng hỗ trợ, để không trừ hai lần ở phía họ. UI khoá nút chỉ là lớp phụ, không thay thế được idempotency phía server. Cuối cùng là đối soát hằng ngày với cổng thanh toán."

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

### Ví dụ đời thực
Consumer cập nhật trạng thái đơn hàng từ topic {{order-events}}. Hai lỗi cùng lúc: (1) **trùng**: sau mỗi lần rebalance (deploy, scale), khoảng vài trăm sự kiện được xử lý lại vì offset chưa kịp commit → email "đơn đã giao" gửi hai lần; (2) **sai thứ tự**: producer dùng key ngẫu nhiên, các sự kiện của cùng một đơn rơi vào partition khác nhau → "DELIVERED" được xử lý trước "SHIPPED", trạng thái cuối cùng sai là SHIPPED cho khoảng 0,2% đơn. Sửa: key message = {{orderId}} (cùng đơn → cùng partition → giữ thứ tự); consumer lưu {{eventId}} đã xử lý (bảng processed_events với unique constraint, cùng transaction với cập nhật đơn); mỗi sự kiện mang **version/sequence** của đơn, consumer bỏ qua sự kiện có version cũ hơn trạng thái hiện tại; commit offset sau khi xử lý xong. Producer bật idempotence (mặc định từ Kafka 3.0) để không tạo bản trùng khi retry.

### Trả lời mẫu khi phỏng vấn
"Kafka đảm bảo at-least-once theo mặc định, nên trùng lặp là chuyện bình thường: consumer xử lý xong nhưng chưa commit offset thì gặp rebalance hay crash, message được giao lại. Tôi chống trùng bằng consumer idempotent: lưu eventId đã xử lý với unique constraint trong cùng transaction với thay đổi nghiệp vụ, hoặc thiết kế thao tác tự nó idempotent như ghi đè trạng thái theo version. Về thứ tự, Kafka chỉ đảm bảo thứ tự trong một partition, nên các sự kiện của cùng một thực thể phải có cùng key, ví dụ orderId. Thêm vào đó, sự kiện mang version hoặc sequence để consumer bỏ qua sự kiện cũ hơn trạng thái hiện tại, phòng khi producer gửi lại hoặc xử lý song song. Producer bật idempotence, và nếu cần xử lý song song trong partition thì phải song song theo key."

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

### Ví dụ đời thực
Chuyển hệ thống quản lý khách hàng từ Oracle legacy sang service mới trên PostgreSQL, chạy song song 4 tháng. Phương án đầu là **ghi kép từ ứng dụng** (ghi legacy rồi ghi hệ mới): khi hệ mới lỗi giữa chừng, hai bên lệch nhau mà không ai biết; sau 3 tuần lệch 1,8% bản ghi. Làm lại: legacy vẫn là **nguồn sự thật** duy nhất trong giai đoạn đầu; thay đổi được bắt bằng **CDC** (Debezium đọc redo log/LogMiner) đẩy qua Kafka sang hệ mới, consumer idempotent theo khoá chính + version; job **đối soát** hằng đêm so checksum theo từng khoảng id (đếm dòng, hash các cột chính) và tự đẩy lại bản ghi lệch. Khi lệch < 0,001% trong 3 tuần liên tiếp, chuyển hướng đọc dần sang hệ mới (feature flag theo % người dùng), rồi mới đảo chiều nguồn sự thật. Không có sự cố dữ liệu lúc cắt chuyển.

### Trả lời mẫu khi phỏng vấn
"Điều đầu tiên tôi chốt là tại mỗi giai đoạn chỉ có một nguồn sự thật cho mỗi loại dữ liệu, thường là hệ legacy lúc đầu. Tôi tránh ghi kép từ ứng dụng vì không có transaction chung giữa hai hệ: ghi bên này thành công, bên kia lỗi là lệch mà khó phát hiện. Thay vào đó tôi dùng CDC như Debezium đọc log thay đổi của DB legacy, đẩy qua Kafka sang hệ mới, consumer idempotent theo khoá chính và version, giữ thứ tự theo khoá. Kèm theo là đối soát định kỳ so số dòng và checksum theo từng khoảng, tự đồng bộ lại phần lệch và cảnh báo khi vượt ngưỡng. Khi đối soát ổn định đủ lâu, tôi chuyển dần phần đọc sang hệ mới theo tỉ lệ, rồi mới đảo nguồn sự thật, luôn có đường quay lại."

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

### Ví dụ đời thực
Ví điện tử đối soát với một ngân hàng đối tác: mỗi ngày lệch khoảng 40–60 giao dịch, đội vận hành xử lý tay mất 3 giờ. Phân loại các khoản lệch trong 2 tuần: 55% do **ranh giới ngày** (giao dịch lúc 23:59:58 bên mình, 00:00:03 bên đối tác), 30% do **timeout không rõ kết quả** (bên mình đánh dấu thất bại, đối tác đã trừ tiền), 10% do **hoàn tiền một phần** đối tác ghi thành giao dịch riêng, 5% còn lại cần người xem. Quy trình mới: so khớp theo **mã tham chiếu chung** (không theo số tiền + thời gian), cửa sổ thời gian ±5 phút quanh ranh giới ngày, tự động xử lý các nhóm đã biết (cập nhật trạng thái giao dịch timeout theo dữ liệu đối tác, gộp hoàn tiền một phần), chỉ đẩy phần "không giải thích được" sang hàng chờ người duyệt kèm đủ bằng chứng. Thời gian xử lý tay còn khoảng 20 phút mỗi ngày.

### Trả lời mẫu khi phỏng vấn
"Đối soát tốt cần một khoá chung giữa hai bên, thường là mã tham chiếu giao dịch mình gửi sang đối tác, chứ không khớp theo số tiền và thời gian. Quy trình của tôi: nhận file hoặc API đối soát của đối tác, chuẩn hoá về cùng định dạng, so khớp theo khoá, rồi phân loại kết quả thành khớp, chỉ có ở bên mình, chỉ có ở bên đối tác, và lệch số tiền hay trạng thái. Sau đó tôi thống kê nguyên nhân lệch để tự động hoá những nhóm phổ biến: lệch ranh giới ngày xử lý bằng cửa sổ thời gian, giao dịch timeout thì cập nhật theo kết quả của đối tác, hoàn tiền một phần thì gộp. Phần còn lại đưa vào hàng chờ cho người duyệt kèm bằng chứng, có hạn xử lý và lưu vết. Mọi điều chỉnh đều là bút toán mới, không sửa giao dịch gốc."

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

### Ví dụ đời thực
Một dev commit file {{application-prod.yml}} có mật khẩu DB lên repo GitHub **công khai** của một dự án demo lúc 22:10; công cụ quét của GitHub (secret scanning) gửi cảnh báo lúc 22:12, nhưng bot dò secret của kẻ xấu cũng thường thấy trong vài phút. Xử lý: 22:20 đổi mật khẩu DB và giới hạn security group chỉ cho IP ứng dụng; 22:40 kiểm tra log kết nối DB từ 22:10 — có 3 lần thử đăng nhập từ IP lạ, đều thất bại vì đã đổi mật khẩu; sau đó xoá file khỏi lịch sử bằng {{git filter-repo}} và force push (chỉ để giảm phát tán, **không** thay cho việc rotate). Phòng ngừa: bật pre-commit hook gitleaks, push protection của GitHub, chuyển secret sang Secrets Manager, repo demo không được dùng cấu hình thật. Postmortem không đổ lỗi; điểm mấu chốt được ghi lại: **rotate trong vài phút đầu** quan trọng hơn mọi bước dọn dẹp.

### Trả lời mẫu khi phỏng vấn
"Tôi xử lý như một sự cố bảo mật với thứ tự ưu tiên rõ ràng. Với secret đã lên Git, coi như đã lộ, kể cả repo private: việc đầu tiên trong vài phút là thu hồi và xoay vòng secret, rồi thu hẹp quyền truy cập mạng nếu được. Sau đó kiểm tra log truy cập từ thời điểm lộ để biết có bị dùng không. Xoá khỏi lịch sử Git bằng git filter-repo chỉ giảm phát tán, không thay cho việc rotate. Với dữ liệu khách hàng trong log: chặn nguồn ghi log, khoá quyền truy cập hệ thống log, xác định phạm vi và ai đã đọc, xoá ở mọi nơi log đã chảy tới, phối hợp pháp chế về nghĩa vụ thông báo. Phòng ngừa: secret scanning và push protection, pre-commit hook, secret manager, masking tập trung trong logging, và postmortem không đổ lỗi."

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

### Ví dụ đời thực

Hệ thống ví thanh toán có hai triệu ví, mỗi ngày năm trăm nghìn giao dịch nạp, rút và chuyển khoản. Lỗi ban đầu: mã cập nhật số dư trực tiếp bằng câu lệnh {{UPDATE accounts SET balance = balance + :amt WHERE id = :id}}, nên khi kiểm toán viên hỏi "ví A hôm qua có bao nhiêu đồng", đội phát triển không trả lời được vì giá trị cũ đã bị ghi đè. Thiết kế lại theo kế toán kép: mỗi giao dịch là một nhóm giao dịch có mã tham chiếu duy nhất, sinh hai dòng nhập xuất (một dòng nợ cho tài khoản gửi, một dòng có cho tài khoản nhận, số tiền lưu nguyên đơn vị nhỏ nhất như đồng VND hoặc cent USD, không dùng số thực float). Sai số được sửa bằng dòng đảo (reversal entry) kèm lý do, không bao giờ cập nhật hay xóa dòng cũ. Job đối soát chạy mỗi ngày kiểm tra tổng nợ bằng tổng credit trong mỗi nhóm, và tổng các dòng nhập xuất khớp số dư của mỗi tài khoản. Sau khi triển khai, kiểm toán viên truy vết được mọi biến động số dư về ngày gốc, sai số phát hiện sớm và chênh lệch số dư giảm từ hàng trăm trường hợp xuống không.

### Trả lời mẫu khi phỏng vấn

"Kế toán kép lưu mỗi giao dịch thành hai dòng: một dòng nợ và một dòng có cùng mã giao dịch, nên tổng nợ bằng tổng credit luôn. Số dư không được cập nhật trực tiếp trên bảng tài khoản vì mỗi lần cập nhật mất lịch sử trước đó, không biết ai sửa khi nào và không dựng lại số dư quá khứ được. Thay vào đó, số dư là tổng của các dòng nhập xuất, tính từ bảng chi tiết. Lỗi được sửa bằng dòng đảo kèm lý do, không xóa hay ghi đè. Để tra cứu nhanh, có thể giữ bảng số dư làm bộ nhớ đệm và chạy job đối soát theo ngày so với tổng các dòng nhập xuất. Mọi dữ liệu dùng số nguyên đơn vị nhỏ nhất, không dùng số thực, và mỗi giao dịch có mã tham chiếu duy nhất để chống gửi trùng khi mạng gián đoạn."

> Senior tip: quy tắc của tôi cho ledger: "append-only, có đối soát, balance là derived cache". Job đối soát chạy một lần/ngày kiểm tổng SUM(entries) khớp accounts.balance cho từng account đã cứu tôi khỏi nhiều bug luồng kỳ lạ; nhiều case số dư sai do bug không nằm ở ledger mà ở luồng gọi trước đó.
`,
  follow: [
    'Query point-in-time balance từ dữ kiện entries: cách làm nào hiệu năng tốt với bảng lớn?',
    'Khi hai chuyển khoản ngược chiều cùng tài khoản, tránh deadlock bằng cách nào khi cập nhật hai số dư trong cùng một giao dịch?'
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

### Ví dụ đời thực
Ngân hàng nhận file đối soát cuối ngày của NAPAS cho giao dịch chuyển tiền nhanh 24/7: mỗi ngày khoảng 1,2 triệu giao dịch, trong đó vài trăm ở trạng thái **treo** (bên mình "đang xử lý", bên NAPAS đã thành công hoặc ngược lại). Trước đây job chạy một lần lúc 1 giờ sáng, lỗi file là cả quy trình dừng, đội vận hành xử lý tay tới trưa. Thiết kế lại: nhận file qua SFTP → kiểm tra chữ ký/checksum và số dòng ở footer → nạp vào bảng staging → so khớp theo mã tham chiếu → tự động **hoàn tất** các giao dịch treo mà NAPAS báo thành công (ghi có cho người nhận), tạo yêu cầu **tra soát** với các giao dịch bên mình thành công mà NAPAS không có; mọi điều chỉnh là bút toán mới có duyệt hai người với số tiền lớn. Báo cáo kết quả gửi lúc 6 giờ; số giao dịch phải xử lý tay giảm khoảng 85%.

### Trả lời mẫu khi phỏng vấn
"Quy trình đối soát cuối ngày của tôi có năm bước. Nhận file an toàn và kiểm tra tính toàn vẹn: chữ ký hoặc checksum, số dòng, tổng tiền ở phần cuối file; file lỗi thì cảnh báo và yêu cầu gửi lại, không xử lý một phần. Nạp vào bảng staging và so khớp với giao dịch bên mình theo mã tham chiếu chung. Phân loại: khớp, bên mình treo mà đối tác thành công, bên mình thành công mà đối tác không có, lệch số tiền. Tự động xử lý các nhóm có quy tắc rõ, như hoàn tất giao dịch treo đã được đối tác xác nhận, còn các trường hợp khác tạo yêu cầu tra soát theo quy trình với đối tác. Mọi điều chỉnh là bút toán mới, có duyệt hai người với số tiền lớn, có audit. Job phải chạy lại được an toàn và có báo cáo kết quả, cảnh báo khi số lệch vượt mức bình thường."

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

### Luồng xử lý trạng thái chưa xác định
~~~seq
title: Chuyển tiền qua đối tác bị timeout
actors: App | Transfer | Partner | Recon
App -> Transfer: POST /transfers (idempotency key)
Transfer -> Transfer: trừ tạm (hold) tiền, trạng thái PENDING
Transfer -> Partner: gửi lệnh, ref=TRF-9921
note Transfer..Partner: timeout 30s, không có phản hồi
Transfer --> App: 202 đang xử lý (không báo thất bại)
Transfer -> Partner: hỏi trạng thái TRF-9921 (sau 1, 5, 15 phút)
Partner --> Transfer: SUCCESS -> hoàn tất, ghi nợ chính thức
Recon -> Transfer: cuối ngày: còn PENDING thì tra soát
~~~

### Ví dụ đời thực
Một ví đánh dấu **thất bại và hoàn tiền ngay** khi gọi ngân hàng đối tác bị timeout. Thực tế khoảng 60% các lệnh timeout đó **đã thành công** ở phía ngân hàng → người nhận đã nhận tiền, người gửi lại được hoàn tiền: thất thoát khoảng 300 triệu đồng mỗi tháng trước khi đối soát phát hiện. Sửa theo luồng trên: timeout → trạng thái **UNKNOWN/PENDING**, giữ nguyên khoản tạm giữ; job hỏi trạng thái theo mã tham chiếu với backoff; chỉ hoàn tiền khi đối tác xác nhận **thất bại** hoặc khi tra soát cuối ngày kết luận không có giao dịch; gửi lại lệnh chỉ khi đối tác hỗ trợ idempotency theo mã tham chiếu. Thất thoát về 0; khiếu nại "tiền bị trừ mà không đến" giảm nhờ app hiển thị rõ trạng thái "đang xử lý".

### Trả lời mẫu khi phỏng vấn
"Timeout không có nghĩa là thất bại, chỉ có nghĩa là không biết. Nên tôi không bao giờ hoàn tiền ngay khi timeout: giao dịch chuyển sang trạng thái chưa xác định, khoản tiền vẫn được tạm giữ, và người dùng thấy đang xử lý. Mỗi lệnh gửi sang đối tác có mã tham chiếu duy nhất do mình sinh ra, để có thể hỏi trạng thái và để đối tác chống trùng nếu cần gửi lại. Một job hỏi trạng thái theo mã tham chiếu với backoff; chỉ khi đối tác xác nhận thành công thì hoàn tất, xác nhận thất bại thì mới hoàn tiền. Nếu hết thời gian hỏi mà vẫn chưa rõ, giao dịch đi vào quy trình đối soát cuối ngày và tra soát. Tôi chỉ gửi lại lệnh khi đối tác đảm bảo idempotency theo mã tham chiếu, nếu không thì có nguy cơ chuyển hai lần."

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

### Ví dụ đời thực

Hệ thống quản lý khách hàng của một công ty bảo hiểm có ba triệu hồ sơ. Nhân viên hỗ trợ trực tiếp sửa số điện thoại và địa chỉ trong bảng khách hàng bằng câu SQL chạy thủ công trên production khi khách gọi yêu cầu. Một tháng sau, kiểm toán viên yêu cầu xem "ai thay đổi số điện thoại của khách hàng X, lúc nào, và từ giá trị cũ thành giá trị mới". Đội phát triển không trả lời được vì không có bản ghi trước và sau, và không biết đó là nhân viên hỗ trợ hay một script chạy nhầm. Thiết kế lại: bảng audit_log ghi người dùng, loại người dùng, địa chỉ IP, loại thực thể, ID thực thể, hành động (CREATE/UPDATE/DELETE), giá trị trước và sau dưới dạng JSON có cấu trúc, thời gian theo UTC, và mã yêu cầu để liên kết với nhật ký API. Bắt thay đổi bằng interceptor của Hibernate cho cập nhật qua ứng dụng, kết hợp CDC đọc nhật ký ghi trước (WAL) của cơ sở dữ liệu để không bỏ sót cập nhật trực tiếp từ công cụ quản trị cơ sở dữ liệu. Chuỗi băm (băm của dòng hiện tại phụ thuộc vào băm dòng trước và nội dung) giúp phát hiện nếu ai chỉnh sửa bản ghi audit sau này, và công việc verify hàng ngày kiểm tra chuỗi băm. Kết quả: kiểm toán viên truy vết được bất kỳ thay đổi nào trong vài giây qua truy vấn theo thực thể và thời gian, và cập nhật không được phép từ công cụ quản trị cơ sở dữ liệu được phát hiện ngay.

### Trả lời mẫu khi phỏng vấn

"Nhật ký kiểm toán cần trả lời ba câu: ai làm, sửa gì, khi nào. Tôi thiết kế bảng lưu mỗi sự kiện thay đổi thành một dòng không được sửa hay xóa, ghi rõ người dùng, địa chỉ IP, loại thực thể, ID thực thể, hành động, giá trị trước và sau dưới dạng JSON, và thời gian theo UTC. Để bắt được mọi thay đổi, kể cả khi quản trị viên sửa trực tiếp trên cơ sở dữ liệu, tôi kết hợp interceptor ở cấp ứng dụng với CDC đọc nhật ký ghi trước của cơ sở dữ liệu. Để ngăn chặn việc bản ghi kiểm toán bị chỉnh sửa sau này, tôi dùng chuỗi băm: băm của dòng hiện tại phụ thuộc vào băm dòng trước, và chạy công việc kiểm tra chuỗi băm mỗi ngày. Dữ liệu giữ nóng sáu tháng trong cơ sở dữ liệu, phần cũ đẩy sang lưu trữ rẻ theo quy định. Truy vấn theo thực thể, người dùng và thời gian với chỉ mục thích hợp để kiểm toán viên trả lời nhanh."

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

### Ví dụ đời thực
Một ngân hàng số chuẩn bị đánh giá PCI DSS cho tính năng thẻ. Rà soát phát hiện số thẻ đầy đủ (PAN) nằm ở **7 nơi**: bảng giao dịch, log ứng dụng, bản sao DB cho đội phân tích, file xuất cho đối tác, cache Redis, ticket hỗ trợ và môi trường test (dữ liệu sao chép từ production). Thiết kế lại theo hướng **thu hẹp phạm vi**: số thẻ chỉ đi vào một **vault tokenization** riêng (mạng tách biệt, khoá trong HSM), mọi hệ thống khác chỉ giữ **token** và 4 số cuối; log có masking tập trung; môi trường test dùng dữ liệu giả; truy cập dữ liệu nhạy cảm qua quyền tạm thời có phê duyệt, mọi lần xem đều audit. Phạm vi hệ thống phải đánh giá PCI giảm từ khoảng 40 service còn 3; đợt đánh giá vượt qua lần đầu.

### Trả lời mẫu khi phỏng vấn
"Tôi thiết kế theo nguyên tắc giảm thiểu: dữ liệu nhạy cảm càng ít nơi giữ càng tốt. Với số thẻ, tôi dùng tokenization: chỉ một vault được tách biệt lưu số thẻ thật, khoá mã hoá nằm trong HSM hoặc KMS, các hệ thống khác chỉ giữ token và bốn số cuối, nên phạm vi PCI DSS nhỏ lại. Mã hoá in-transit bằng TLS ở mọi nơi, mTLS giữa các service nhạy cảm; mã hoá at-rest ở tầng đĩa và DB, thêm mã hoá cấp trường cho dữ liệu rất nhạy cảm như số giấy tờ. Hiển thị và log đều được che. Phân quyền theo nguyên tắc tối thiểu, truy cập dữ liệu nhạy cảm là quyền tạm thời có phê duyệt và audit. Xác thực người dùng có 2FA, OTP với giới hạn thử. Môi trường test không dùng dữ liệu thật. Và tuân thủ các quy định như Nghị định 13 về dữ liệu cá nhân."

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

### Ví dụ đời thực
Batch tính lãi cho 6 triệu tài khoản tiết kiệm, mỗi đêm khoảng 50 phút. Một lần DB failover ở phút 31, job được chạy lại thủ công **từ đầu** → 3,6 triệu tài khoản đã cộng lãi bị cộng **lần hai**, phải đảo bút toán cả buổi sáng. Thiết kế lại: (1) mỗi kết quả lãi ghi vào bảng {{interest_postings}} với **unique constraint** {{(account_id, value_date)}} — chạy lại thì INSERT trùng bị từ chối hoặc bỏ qua ({{ON CONFLICT DO NOTHING}}); (2) xử lý theo **partition** tài khoản (ví dụ 64 nhóm theo hash id), mỗi nhóm có trạng thái riêng trong bảng {{batch_partition_status}}, chạy song song có giới hạn; (3) mỗi lô 1.000 tài khoản một transaction, ghi checkpoint; (4) kết thúc bằng **kiểm tra tổng**: số tài khoản đã tính = số tài khoản đủ điều kiện, tổng lãi khớp với tổng tính độc lập bằng một truy vấn SQL. Lần sự cố sau, job tự tiếp tục từ 41 nhóm còn lại, không trùng một đồng nào.

### Trả lời mẫu khi phỏng vấn
"Batch tính lãi phải đúng, chạy lại được và không trùng. Đúng: logic tính lãi được test kỹ với các trường hợp biên như ngày cuối tháng, năm nhuận, số dư thay đổi trong ngày, làm tròn theo quy định, và có một phép kiểm tra tổng độc lập ở cuối. Không trùng: mỗi kết quả có khoá nghiệp vụ duy nhất, ví dụ tài khoản cộng ngày giá trị, với unique constraint, nên dù chạy lại bao nhiêu lần cũng chỉ ghi một lần. Chạy lại được: chia tài khoản thành các nhóm, mỗi nhóm có trạng thái riêng, xử lý theo lô nhỏ với checkpoint, nên khi lỗi chỉ chạy tiếp phần chưa xong. Song song có giới hạn để không làm quá tải DB, chạy trên dữ liệu đã chốt tại thời điểm cut-off. Cuối cùng là cảnh báo nếu job không hoàn tất đúng hạn và báo cáo đối soát cho nghiệp vụ."

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

### Ví dụ đời thực
Ngày 25 hằng tháng (ngày lương), lượng chuyển tiền tăng 8 lần từ 8:00 đến 10:00, trong khi API chuyển tiền liên ngân hàng của đối tác giới hạn **300 lệnh/giây**. Năm trước, hệ thống gửi thẳng mọi lệnh → đối tác trả lỗi 429 và một phần timeout, khách thấy "giao dịch thất bại" rồi chuyển lại → trùng giao dịch và khiếu nại. Năm nay: lệnh chuyển được ghi nhận ngay (trừ tạm tiền, trạng thái "đang xử lý"), đưa vào **hàng đợi**; một bộ gửi duy nhất điều tốc bằng token bucket 280 lệnh/giây (chừa biên an toàn), ưu tiên lệnh giá trị nhỏ và khách cá nhân, retry có backoff khi gặp 429; app hiển thị thời gian dự kiến. Đàm phán trước với đối tác nâng hạn mức tạm thời lên 450 lệnh/giây trong khung giờ đó. Hàng đợi đỉnh 42.000 lệnh, xử lý hết trong 12 phút, không có giao dịch trùng.

### Trả lời mẫu khi phỏng vấn
"Khi đối tác có giới hạn cứng, tôi không để tải đột biến đi thẳng tới họ. Chuẩn bị trước: dự báo tải từ dữ liệu các tháng trước, load test luồng chuyển tiền, đàm phán hạn mức tạm thời với đối tác. Kiến trúc: lệnh chuyển được nhận và ghi nhận ngay, tạm giữ tiền, trạng thái đang xử lý, rồi đưa vào hàng đợi; một bộ gửi điều tốc theo hạn mức của đối tác với biên an toàn, retry có backoff khi gặp 429, và idempotency theo mã tham chiếu để retry không chuyển hai lần. Có thể ưu tiên theo loại lệnh. Phía người dùng, app hiển thị rõ trạng thái và thời gian dự kiến để họ không chuyển lại. Ngày diễn ra, tôi theo dõi độ dài hàng đợi, tỉ lệ lỗi từ đối tác, và có kênh liên lạc trực tiếp với đội của họ."

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

### Cơ chế chi tiết sau failover

Khi cơ sở dữ liệu chính lỗi và hệ thống chuyển sang bản dự phòng (failover), địa chỉ IP của primary thường thay đổi (ví dụ qua tên miền hoặc thiết bị phân tải). Ứ dụng Java có hai nơi có thể "lưu lại" thông tin cũ dẫn đến lỗi kết nối vài phút:

1. Bộ nhớ đệm phân giải tên miền của Java: Java lưu kết quả phân giải tên miền (ví dụ db-prod.internal → 10.0.1.5) theo thuộc tính bảo mật {{networkaddress.cache.ttl}}. Sau failover, tên miền đã trỏ về IP mới (10.0.1.6) nhưng Java vẫn giữ IP cũ cho đến khi hết hạn bộ nhớ đệm, nên kết nối mới vẫn gửi về máy chủ cũ đã chết.
2. Connection pool giữ kết nối chết: HikariCP (pool kết nối JDBC phổ biến) lưu các kết nối đã mở để tái sử dụng. Sau failover, kết nối cũ tới primary cũ bị đóng tại phía cơ sở dữ liệu, nhưng pool không biết và vẫn cho ứng dụng mượn. Lúc ứng dụng gửi lệnh SQL, mới nhận lỗi "kết nối bị reset" hoặc "kết nối bị ngắt". Pool mới loại kết nối đó ra và tạo kết nối mới — quá trình này lặp lại cho mỗi kết nối chết, nên mất vài phút để hết tất cả kết nối cũ.

Pool chỉ kiểm tra kết nối còn sống khi mượn (truy vấn kiểm tra hoặc {{Connection.isValid}}) nếu được cấu hình, không kiểm tra mỗi request. Vì vậy những request đầu tiên sau failover thất bại trước khi pool làm sạch.

### Ví dụ đời thực

Hệ thống đặt vé chạy trên PostgreSQL primary-replica với failover tự động. Lúc 14:32 primary mất điện, bản dự phòng nâng cấp thành primary mới và đổi IP qua tên miền. Sau đó ba phút, mười tám phần trăm request đặt vé lỗi {{org.postgresql.util.PSQLException: Connection refused}} hoặc {{Connection reset by peer}}. Điều tra: Tomcat chưa đặt {{networkaddress.cache.ttl}} nên Java giữ tên miền cũ hàng giờ; HikariCP có hai mươi lăm kết nối đang mở tới IP cũ, mỗi kết nối chỉ được phát hiện chết khi ứng dụng mượn và gửi lệnh đầu tiên. Cách xử lý: (1) đặt {{networkaddress.cache.ttl}} thành ba mươi giây để tên miền refresh nhanh; (2) cấu hình HikariCP {{validationTimeout}} ngắn hơn {{connectionTimeout}} và bật truy vấn kiểm tra kết nối (hoặc để driver tự kiểm tra qua JDBC4) để pool phát hiện kết nối chết sớm khi mượn; (3) đặt {{maxLifetime}} ngắn hơn thời gian ngừng hoạt động idle của thiết bị phân tải / proxy trước nó; (4) thêm điểm kiểm tra sức khỏe /health truy vấn SELECT 1, trả 503 nếu lỗi để thiết bị phân tải ngừng gửi traffic tới instance đang fail. Sau khi áp dụng, thời gian khôi phục từ ba phút xuống dưới ba mươi giây, và không còn khách hàng bị lỗi đặt vé sau failover.

### Trả lời mẫu khi phỏng vấn

"Sau khi cơ sở dữ liệu chuyển sang bản dự phòng, ứng dụng có thể vẫn liên lạc với địa chỉ cũ vì Java lưu kết quả phân giải tên miền và connection pool giữ kết nối đã mở. Tôi xử lý theo hai hướng. Thứ nhất, cấu hình thời gian hết hạn của bộ nhớ đệm DNS ngắn hơn (ví dụ ba mươi giây) cho đến khi tên miền đã trỏ về địa chỉ mới. Thứ hai, cấu hình connection pool để kiểm tra kết nối còn khả dụng trước khi cho ứng dụng dùng, ví dụ truy vấn kiểm tra hoặc phương thức isValid của JDBC, và thiết lập thời gian sống tối đa ngắn hơn thời gian ngừng hoạt động của thiết bị giữa để kết nối cũ được loại bỏ sớm. Thêm điểm kiểm tra sức khỏe truy vấn cơ sở dữ liệu đơn giản, trả về lỗi nếu không kết nối được, để thiết bị phân tải ngừng gửi yêu cầu đến máy chủ đang gặp sự cố. Nếu cần khôi phục ngay lập tức, tôi có thể xoá toàn bộ pool kết nối để buộc tạo kết nối mới, nhưng chỉ làm khi thực sự cần vì đây là thao tác tốn tài nguyên."

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

### Cơ chế chi tiết từng nguyên nhân

RSS (Resident Set Size) là lượng bộ nhớ thực tế của tiến trình đang chiếm RAM, bao gồm cả heap (bộ nhớ Java quản lý) và phần ngoài heap.

1. glibc malloc arenas: Thư viện C chuẩn glibc quản lý bộ nhớ qua nhiều "arena" (vùng bộ nhớ riêng) để giảm tranh chấp giữa các luồng khi cấp phát cùng lúc. Mỗi arena giữ bộ nhớ đã giải phóng để tái sử dụng thay vì trả ngay cho hệ điều hành, nên RSS có thể không giảm ngay sau khi ứng dụng giải phóng, và bộ nhớ có thể bị chia mảnh. Số arena phụ thuộc cấu hình và kiến trúc, thường căn cứ theo số lõi CPU, không phải hằng số 8 nhân số lõi.
2. Direct memory (bộ nhớ trực tiếp): {{ByteBuffer.allocateDirect}}, Netty, NIO đệm nằm ngoài heap Java, không bị garbage collection quản lý theo cách thông thường. Giới hạn được thiết lập bởi {{MaxDirectMemorySize}}.
3. Thread stack: Mỗi luồng có một vùng stack được đặt trước và phần đã cam kết. {{-Xss}} không chính xác là RSS tăng đúng một megabyte cho mỗi luồng.
4. Metaspace: Lưu thông tin lớp đã nạp, thường tăng theo thời gian khi ứng dụng chạy lâu.

### Ví dụ đời thực

Ứ dụng Spring Boot chạy trong container giới hạn hai gigabyte RAM. Heap Java chỉ dùng sáu trăm megabyte và ổn định, nhưng RSS tăng từ bảy trăm megabyte lên một gigabyte tám trăm megabyte sau vài ngày, container bị hệ điều hành chấm dứt do hết RAM. Điều tra bằng {{jcmd <pid> VM.native_memory summary}} thấy heap bình thường, nhưng phần native tăng. Xem {{/proc/<pid>/smaps}} thấy rất nhiều vùng mmap từ thư viện glibc malloc do ứng dụng tạo hàng nghìn luồng xử lý tệp song song, mỗi luồng giữ một arena riêng. Cách xử lý: (1) đặt {{MALLOC_ARENA_MAX=2}} để giới hạn số arena glibc; (2) giới hạn số luồng trong pool xử lý tệp và dùng {{virtual threads}} (Java 21) cho tác vụ chờ I/O; (3) đối chiếu {{MaxDirectMemorySize}} với nhu cầu bộ nhớ đệm trực tiếp của Netty; (4) giám sát liên tục bằng NMT và smaps. Sau khi áp dụng, RSS ổn định khoảng chín trăm megabyte, container không còn bị chấm dứt do hết RAM.

### Trả lời mẫu khi phỏng vấn

"RSS tăng trong khi heap ổn định thường liên quan đến bộ nhớ ngoài heap: glibc malloc giữ nhiều arena để phục vụ các luồng, bộ nhớ trực tiếp như ByteBuffer, ngăn xếp luồng và Metaspace. Tôi chẩn đoán theo thứ tự: dùng jcmd xem báo cáo bộ nhớ native của JVM, xem /proc/<pid>/smaps để biết từng vùng bộ nhớ, và đếm số luồng. Nếu glibc malloc arena là nguyên nhân, tôi đặt MALLOC_ARENA_MAX nhỏ hơn (hai hoặc bốn) và kiểm tra hiệu năng vì giảm arena có thể làm tăng tranh chấp. Nếu là direct memory, tôi đối chiếu MaxDirectMemorySize với bộ nhớ đệm trực tiếp thực tế. Với ứng dụng xử lý I/O nhiều luồng, tôi giới hạn số luồng và cân nhắc virtual threads Java 21. Cuối cùng, tôi giám sát liên tục thay vì đoán, vì RSS cao không nhất thiết là rò rỉ bộ nhớ Java."

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

### Cơ chế chi tiết

TOCTOU (time-of-check to time-of-use) là khoảng thời gian giữa hai bước: (1) kiểm tra xem khóa đã tồn tại chưa, (2) chèn bản ghi mới. Hai luồng cùng chạy bước kiểm tra, cả hai thấy "chưa tồn tại", cả hai cùng chèn → cơ sở dữ liệu từ chối bản ghi thứ hai vì vi phạm ràng buộc duy nhất (unique constraint), ném lỗi {{DataIntegrityViolationException}} (Spring) hoặc SQLException.

Ràng buộc duy nhất ở cơ sở dữ liệu là "lưới an toàn" cuối cùng: bất kể ứng dụng kiểm tra thế nào, cơ sở dữ liệu luôn đảm bảo sự duy nhất của khóa. Kiểm tra ở cấp ứng dụng (SELECT rồi INSERT) không đủ vì có khoảng trống giữa hai bước.

### Ví dụ đời thực

Hệ thống đăng ký sự kiện cho một triệu khách hàng. Form đăng ký có nút "Đăng ký ngay", khách nhấn nhanh hai lần hoặc chạy lại trang khi mạng chậm, sinh hai request cùng email. Mã kiểm tra {{SELECT count(*) FROM event_registration WHERE email = ?}} rồi chèn nếu bằng 0. Hai request cùng xem count = 0, cùng chèn, bảng có hai dòng cùng email. Việc nhập batch từ file CSV cũng gặp trùng khi hai công nhân xử lý dòng cùng mã đối tác cùng lúc. Cách xử lý: (1) tạo chỉ mục duy nhất trên cột email (và mã đối tác cho nhập batch); (2) dùng {{INSERT ... ON CONFLICT (email) DO NOTHING}} (PostgreSQL) hoặc {{INSERT IGNORE}} / ON DUPLICATE KEY UPDATE (MySQL), nên chèn trùng bị từ chối an toàn thay vì lỗi toàn bộ giao dịch; (3) nếu nghiệp vụ cần cập nhật khi trùng, chỉ cập nhật trường cần thiết bằng {{DO UPDATE SET}}, không ghi đè toàn bộ; (4) cho API nhập, dùng mã idempotency (khóa duy nhất do khách sinh) và kiểm tra trước khi chèn; (5) nếu nội dung khác nhau cùng khóa, quyết định trước quy tắc: ghi lần đầu thắng, ghi lần sau thắng, hay từ chối. Kết quả: không còn bản ghi trùng sau khi triển khai chỉ mục duy nhất + upsert.

### Trả lời mẫu khi phỏng vấn

"Hai request cùng kiểm tra xem mã khách hàng đã tồn tại rồi cùng chèn sẽ gây bản ghi trùng, vì khoảng thời gian giữa bước kiểm tra và bước chèn để lại hở. Đây gọi là TOCTOU. Cách xử lý đúng là để cơ sở dữ liệu đảm bảo: tạo ràng buộc duy nhất trên khóa nghiệp vụ, ví dụ email hoặc mã đối tác. Khi chèn, dùng lệnh upsert như INSERT ON CONFLICT DO NOTHING của PostgreSQL, nên bản ghi trùng bị từ chối an toàn thay vì làm thất bại toàn bộ giao dịch. Nếu cần cập nhật khi trùng, chỉ cập nhật những trường cần thiết. Không nên dựa vào kiểm tra ở ứng dụng rồi mới chèn vì có khoảng hở. Với API nhập, tôi dùng mã idempotency do khách sinh để duy nhất mỗi yêu cầu. Nếu hai yêu cầu cùng khóa nhưng nội dung khác, tôi xác định quy tắc trước: ghi lần đầu thắng, ghi lần sau thắng, hay từ chối, và upsert thực thi chính xác quy tắc đó."

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

### Ví dụ đời thực
Hệ thống quỹ tiết kiệm chia lãi theo 3 kỳ (1, 3, 6 tháng) cho 1,2 triệu tài khoản. Lần đầu triển khai, mỗi kỳ được round HALF_UP xuống 2 chữ số thập phân riêng biệt: 100.000 đồng chia 3 kỳ → 33.333, 33.333, 33.333 → tổng 99.999, mất 1 đồng. Với 1,2 triệu tài khoản, tổng hệ thống mất khoảng 1,2 triệu đồng so với số tiền gốc — phát hiện khi đối chiếu với ledger. Điều tra: code dùng {{BigDecimal.valueOf(100000).divide(BigDecimal.valueOf(3), 2, RoundingMode.HALF_UP)}} cho từng kỳ riêng biệt, không biết tổng. Sửa: tính tổng trước, mỗi kỳ = total.divide(N, 2, HALF_DOWN), phần dư = total.subtract(sum các kỳ đã tính), cộng vào kỳ cuối. Với 100.000 chia 3: kỳ 1 = 33.333, kỳ 2 = 33.333, kỳ 3 = 33.334 → tổng = 100.000. Lưu input (100.000, N=3) và rule version (HALF_UP, scale=2) vào bảng audit để reconcile. Sau fix, job đối chiếu tổng phân bổ = tổng nguồn cho 1,2 triệu tài khoản, lệch về 0.

### Trả lời mẫu khi phỏng vấn
"Khi chia tiền cho nhiều kỳ, làm tròn từng kỳ riêng lẻ sẽ sinh phần dư — mỗi kỳ round xuống thì tổng bao giờ nhỏ hơn hoặc bằng nguồn, và nếu có kỳ round lên thì có thể vượt. Tôi luôn tính tổng trước: chia total cho N với quy tắc round đã chọn, sau đó tính phần dư bằng total trừ tổng các kỳ đã tính, và phân bổ phần dư vào kỳ cuối (hoặc round-robin nếu cần công bằng). Dùng BigDecimal khởi tạo từ chuỗi hoặc long theo minor unit, không bao giờ double. Quy tắc HALF_UP hay HALF_EVEN phải được ghi rõ trong hợp đồng hoặc quy định nghiệp vụ, và tôi lưu input cùng rule version để audit có thể reconcile. Kiểm tra quan trọng là tổng các kỳ phải bằng chính xác tổng nguồn — đó là invariant tôi đặt vào cuối job."

### Cơ chế từng bước
1. **Vấn đề:** Khi chia một số tiền S cho N kỳ bằng cách round từng kỳ xuống đơn vị nhỏ nhất (ví dụ 0.01), tổng các kỳ sau round thường ≠ S. Ví dụ 100.000 / 3 → 33.333 × 3 = 99.999, mất 0.001.
2. **Nguyên nhân gốc:** Mỗi kỳ round một cách độc lập, không biết tổng. Round DOWN thì tổng ≤ S, round UP thì tổng ≥ S.
3. **Cách đúng:** Tính từng kỳ bằng round, sau đó điều chỉnh kỳ cuối bằng chính phần dư: kỳ cuối = S − sum(các kỳ trước). Hoặc phân bổ round-robin: thêm 1 đơn vị nhỏ nhất vào các kỳ theo thứ tự cho đến khi tổng bằng S.
4. **Vì sao BigDecimal:** double có thể sinh sai số thập phân (0.1 + 0.2 = 0.30000000000000004). BigDecimal với scale cố định và RoundingMode cho phép kiểm soát hoàn toàn.
5. **Pitfall:** Quy tắc round (HALF_UP vs HALF_EVEN) khác nhau ở trường hợp .5 — HALF_EVEN (banker's) làm tròn về số chẵn gần nhất, thường dùng trong ngân hàng để trung lập, còn HALF_UP làm tròn lên. Chọn theo quy định nghiệp vụ, không tự ý chọn.
6. **Audit:** Lưu input, rule version và kết quả để reconcile; tổng các kỳ phải bằng tổng nguồn theo cùng đơn vị.

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

### Ví dụ đời thực
Hệ thống tích hợp với đối tác thanh toán qua HTTPS, dùng Java keystore/truststore chuẩn (cacerts + truststore riêng). Một buổi sáng, mọi call đến đối tác trả về {{SSLHandshakeException: certificate has expired}}. Điều tra: leaf cert của đối tác hết hạn từ ngày trước (hết hạn 30 ngày, không ai cảnh báo vì monitoring chỉ check 7 ngày). Đội vận hành phải upload cert mới vào truststore trên 12 pod, restart toàn bộ để JVM load truststore mới — mất 20 phút, các giao dịch bị treo. Sửa: (1) script check expiry bằng {{openssl s_client -connect host:443 -showcerts}} chạy mỗi ngày, alert khi còn 30/14/7 ngày; (2) truststore được quản lý tập trung — thay vì embedded trong image, mount từ Secret/ConfigMap và reload bằng rolling restart có kiểm soát; (3) trên staging, diễn tập rotation: đổi CA test, upload trust anchor mới, verify handshake; (4) dev profile dùng trust-all (ignore SSL) chỉ ở local. Sau đó, đối tác thông báo đổi CA trước 2 tuần — team thay trust anchor mới, restart theo lịch, không downtime.

### Trả lời mẫu khi phỏng vấn
"Chứng chỉ SSL hết hạn hoặc đổi CA là một trong những nguyên nhân làm sập tích hợp phổ biến và dễ bỏ sót vì không có ai cảnh báo. Tôi thiết kế giám sát expiry tự động: script check bằng openssl hoặc library, alert khi còn 30, 14 và 7 ngày — không chỉ check leaf cert mà cả chuỗi (intermediate, root) và hostname/SAN. Truststore được quản lý tập trung: không embed trong image, mà mount từ secret store và reload bằng rolling restart có kiểm soát, không restart cùng lúc mọi pod. Trước khi đối tác đổi CA, tôi diễn tập rotation trên staging: upload trust anchor mới, verify handshake, sau đó áp dụng production theo lịch. Trong dev/test profile, trust-all chỉ dùng để debug, không bao giờ dùng trên production. Nếu client hỗ trợ, reload SSLContext runtime là lựa chọn tốt hơn restart, nhưng không phải client nào cũng hỗ trợ — kiểm tra trước."

### Cơ chế từng bước
1. **Cái gì:** Truststore là kho chứa CA cert được JVM tin tưởng. Khi server certificate chain không match truststore (hết hạn, đổi CA, sai hostname), TLS handshake fail → {{SSLHandshakeException}}.
2. **Vì sao cần:** Không có giám sát, cert hết hạn là sự cố im lặng — ứng dụng chỉ hỏng khi có lưu lượng truy cập. Tích hợp ngắt kết nối vào giờ cao điểm (ví dụ cổng thanh toán).
3. **Hoạt động:** JVM nạp truststore khi khởi động, không tự refresh lại. Cert có notBefore/notAfter. Khi server trình bày cert, JVM kiểm tra chuỗi cert theo truststore.
4. **Ví dụ:** {{openssl s_client -connect api.partner.com:443 -showcerts | openssl x509 -noout -dates}} → notAfter = 2026-10-01 (hết hạn).
5. **Lỗi hay gặp:** Chỉ check leaf cert, bỏ sót intermediate/root; truststore embedded trong Docker image (phải rebuild image để rotate); bật trust-all trên production nhầm lẫn.
6. **Trả lời phỏng vấn:** Nói trong phỏng vấn: script kiểm tra expiry, truststore tập trung, diễn tập rotation trên staging, trust-all chỉ dùng trong dev, rolling restart ưu tiên hơn reload runtime.

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

### Ví dụ đời thực
Hệ thống xác thực dùng JWT access token (hạn 15 phút) và refresh token. Sau khi deploy 2 instance mới vào cùng cụm, một số request bị reject với {{JwtSignatureException}}/{{JWT expired}} ngẫu nhiên — chỉ xảy ra ở một phần requests, không đều theo thời gian. Điều tra: so sánh {{date}} trên 3 instance, thấy instance mới chạy lệch 45 giây so với instance cũ (chưa đồng bộ NTP, dùng clock hệ điều hành thay vì chrony). Với token 15 phút, lệch 45s → token tạo trên instance cũ bị coi là "chưa có hiệu lực" (nbf) hoặc "đã hết hạn" (exp) trên instance mới. Sửa: (1) bật chrony/systemd-timesyncd trên mọi instance, monitor offset < 100ms; (2) thêm leeway 60s trong validator — Auth0 java-jwt: {{JWTVerifier verifier = JWT.require(algorithm).build()}} → dùng {{JWTVerifier.Builder}} với {{acceptNotBefore()}} và {{acceptExpiresAt()}} để điều chỉnh leeway; Spring Security: {{JwtTimestampValidator(Duration.ofSeconds(60))}}; (3) ghi log lý do từ chối (exp/nbf/signature) để debug; (4) token lifetime 15 phút + refresh 7 ngày. Sau fix, không còn reject ngẫu nhiên; offset NTP luôn < 50ms.

### Trả lời mẫu khi phỏng vấn
"JWT bị từ chối ngẫu nhiên do lệch đồng hồ là một lỗi phổ biến và khó debug vì nó không cố định ở một endpoint hay một user nào. Nguyên nhân là JWT có claim exp (hết hạn) và nbf (hiệu lực), và nếu server A tạo token, server B validate thì đồng hồ lệch nhau → token bị coi là chưa có hiệu lực hoặc đã hết hạn. Cách sửa: thứ nhất, đồng bộ đồng hồ trên mọi server bằng NTP (chrony hoặc systemd-timesyncd) và monitor offset; thứ hai, thêm leeway (clock skew) vào validator — JJWT dùng clockSkewSeconds, Spring Security dùng JwtTimestampValidator(Duration.ofSeconds(...)) — leeway nới cửa sổ chấp nhận token; thứ ba, ghi log lý do từ chối để debug; thứ tư, dùng short-lived token với refresh token để leeway không cần quá lớn. Leeway quá lớn giảm security, nên chọn theo sai số đo được, không chọn đại 60s cho mọi hệ thống."

### Cơ chế từng bước
1. **Cái gì:** JWT có exp (expiry time), nbf (not before), iat (issued at). Validator kiểm tra: now ≥ nbf và now ≤ exp.
2. **Vì sao cần:** Server tạo token và server validate token có thể lệch đồng hồ → token hợp lệ bị reject.
3. **Hoạt động:** Clock skew → token tạo ở server A (clock +45s) bị server B (clock chuẩn) coi là "chưa hiệu lực" (nbf) hoặc "đã hết hạn" (exp).
4. **Ví dụ:** Token 15 phút, exp = now + 900s. Server A tạo token, server B lệch −45s → B coi token đã hết hạn 45s trước đó.
5. **Lỗi hay gặp:** Leeway quá lớn (token hết hạn vẫn chấp nhận thêm N giây); không monitor NTP status; log rejection reason → debug chậm; dùng token lifetime quá dài (1 giờ) → leeway không đủ.
6. **Trả lời phỏng vấn:** Nói trong phỏng vấn: đồng bộ NTP, leeway trong validator (JJWT vs Spring Security), log lý do từ chối, token ngắn hạn + refresh.

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
  a: `**Tóm tắt:** Redis (kho dữ liệu key-value trong RAM, rất nhanh) khi chạm {{maxmemory}} sẽ áp dụng {{maxmemory-policy}} (chính sách trục xuất key). Nếu dùng chung một Redis cho **cache** (dữ liệu tính lại được), **session** (phiên đăng nhập) và **distributed lock** (khóa phân tán, giúp nhiều tiến trình không tranh chấp cùng tài nguyên), eviction có thể xóa nhầm session/lock → người dùng bị đăng xuất, lock mất dẫn đến xử lý trùng. Cách đúng: tách workload theo yêu cầu mất dữ liệu/độ tin cậy, chọn policy phù hợp từng loại, đặt TTL (time to live, thời gian sống) có chủ đích, giám sát memory/eviction, và thiết kế lock có fencing (chống lock cũ thắng lock mới).

### Cơ chế Redis eviction (giải thích dễ hiểu)
- **{{maxmemory}}:** giới hạn RAM Redis được dùng cho dataset. Khi cần thêm bộ nhớ cho ghi mới, Redis xem policy.
- **Policy phổ biến:**
  - {{noeviction}}: không xóa key; lệnh ghi gây lỗi khi đầy (ứng dụng sẽ nhận lỗi) — an toàn cho dữ liệu không được mất ngầm, nhưng caller phải xử lý lỗi.
  - {{allkeys-lru/lfu/random}}: chọn trong **mọi** key để xóa theo LRU (ít dùng gần đây), LFU (ít dùng thường xuyên), hoặc ngẫu nhiên.
  - {{volatile-lru/lfu/random/ttl}}: chỉ chọn key **có TTL**. Nếu không có key có TTL phù hợp, hành vi có thể dẫn tới không evict được như mong đợi → vẫn rủi ro.
- **Vì sao session/lock nguy hiểm khi bị evict:**
  - Session mất → user phải đăng nhập lại, giỏ hàng/ trạng thái tạm mất.
  - Lock key mất → hai worker cùng nghĩ mình giữ lock → chạy trùng nghiệp vụ (gửi mail 2 lần, trừ tiền 2 lần nếu không có bảo vệ khác).

### Cách xử lý từng bước
1. **Phân loại dữ liệu:** cái gì tái tạo được (cache HTTP, computed result) vs cái gì mất sẽ gây sự cố (session, lock, idempotency key tùy thiết kế).
2. **Tách theo mục đích:** ít nhất tách **cache** khỏi **session/lock**. Có thể là instance/cluster riêng, hoặc managed service tách biệt. Redis Cluster chỉ hỗ trợ database 0; "logical DB" hay key prefix **không** tạo chính sách eviction/memory riêng — không dùng prefix để thay cho tách hạ tầng.
3. **Chọn policy:**
   - Cache thuần: {{allkeys-lru}} hoặc {{allkeys-lfu}} thường hợp; chấp nhận miss.
   - Session/lock: cần thiết kế để key quan trọng không bị evict ngầm; {{volatile-*}} chỉ an toàn nếu **mọi** key cần giữ đều không thuộc nhóm bị evict sai và dung lượng được quản lý — thực tế thường cần tách instance + giám sát. {{noeviction}} buộc xử lý lỗi ghi rõ ràng.
4. **TTL có chủ đích:** session có TTL (vd 30 phút idle, theo nghiệp vụ); lock **bắt buộc** có TTL để tránh deadlock khi process chết, nhưng TTL không đủ chống mất lock do eviction — vẫn cần tách/thiết kế an toàn.
5. **Lock an toàn hơn:** dùng thuật toán/thư viện được kiểm chứng (vd Redisson lock, hoặc pattern có fencing token tùy yêu cầu). Tránh tự viết {{SETNX}} không có TTL/không có cơ chế chống chủ cũ.
6. **Giám sát:** {{used_memory}}, {{maxmemory}}, {{evicted_keys}}, {{rejected_connections}}/lỗi OOM, hit rate cache. Đặt ngưỡng theo tốc độ tăng và headroom (vd cảnh báo khi tiến gần giới hạn và eviction tăng), không coi "80%" là con số đúng cho mọi hệ thống.
7. **Session persistence:** nếu session quan trọng, dùng replication/HA và cân nhắc persistence (RDB/AOF) theo RPO/RTO; persistence **không thay thế backup**.

~~~text
Kiến trúc gợi ý (ví dụ)
  App
   ├── Redis A (cache): allkeys-lru, có thể evict, chấp nhận miss
   └── Redis B (session + lock/idempotency): tách instance, policy/dung lượng riêng,
       giám sát eviction=0 cho key quan trọng, lock có TTL + fencing/thiết kế an toàn
~~~

### Ví dụ đời thực
- **Bối cảnh (giả định hợp lý):** ứng dụng thương mại điện tử dùng 1 cụm Redis 8GB cho cả cache sản phẩm, session người dùng (~120.000 session active), và distributed lock khi trừ tồn kho. TTL session 24h, lock TTL 10s.
- **Sự cố:** chiến dịch sale làm cache key tăng mạnh; Redis chạm {{maxmemory}} với {{allkeys-lru}}. Trong 18 phút, {{evicted_keys}} tăng ~45.000; ~3.200 phiên đăng nhập bị xóa → user báo "bị thoát"; một số lock key bị evict khiến 27 đơn hàng ghi nhận xử lý trùng ở bước downstream (phát hiện qua idempotency check muộn).
- **Điều tra:** metric cho thấy memory đầy, eviction tăng đúng thời điểm cache bùng nổ; session key không được phân biệt với cache key trong cùng instance.
- **Xử lý:** tách Redis cache (4GB, {{allkeys-lru}}) và Redis session/lock (4GB, dung lượng theo dõi, cảnh báo eviction > 0); rà soát lock dùng thư viện có TTL và cơ chế an toàn hơn; bổ sung idempotency key cho bước trừ kho/đặt đơn; dashboard cảnh báo {{evicted_keys}} và {{used_memory/maxmemory}}.
- **Kết quả:** đợt sale sau, cache vẫn evict bình thường khi đầy nhưng không ảnh hưởng session; không còn logout hàng loạt; không ghi nhận trùng đơn do mất lock.

### Pitfall thực tế
- **{{volatile-lru}} tưởng an toàn tuyệt đối:** chỉ xét key có TTL; session/lock có TTL vẫn có thể nằm trong nhóm bị evict nếu cùng instance và policy/áp lực bộ nhớ cho phép.
- **Key prefix không cách ly eviction:** {{sess:*}} và {{cache:*}} trên cùng instance vẫn tranh cùng {{maxmemory}}.
- **{{noeviction}} mà app không xử lý lỗi:** ghi thất bại có thể gây lỗi dây chuyền.
- **Lock không fencing:** chỉ TTL không đủ cho mọi kịch bản phân tán; cần token/version/fencing tùy mức độ nghiêm trọng.

### Trả lời mẫu khi phỏng vấn
"Nếu Redis đầy bộ nhớ và eviction xóa mất session hoặc lock, em xem đây là lỗi thiết kế vận hành: cùng một Redis đang gánh cả dữ liệu có thể mất như cache và dữ liệu nhạy cảm như phiên đăng nhập hay khóa phân tán. Em sẽ phân loại dữ liệu theo hậu quả khi mất, rồi tách workload — ít nhất tách cache ra khỏi session và lock — vì logical database hay key prefix không tạo ranh giới eviction riêng. Với cache, em có thể dùng allkeys-lru hoặc allkeys-lfu và chấp nhận cache miss. Với session và lock, em cần dung lượng, chính sách và giám sát phù hợp để không bị xóa ngầm; đồng thời lock phải có TTL và cơ chế an toàn như fencing hoặc thư viện được kiểm chứng, vì eviction hoặc trễ mạng đều có thể làm hai tiến trình cùng tiến vào vùng nguy hiểm. Em cũng đặt TTL có chủ đích, theo dõi used_memory, evicted_keys và lỗi ghi, cảnh báo sớm theo tốc độ tăng thay vì dựa vào một con số phần trăm cố định. Với session quan trọng, em cân nhắc replication và persistence theo RPO/RTO, nhưng không coi persistence là thay thế backup. Mục tiêu là cache có thể hy sinh, còn session và lock thì không bị mất trong im lặng." 

> Senior tip: đặt alert {{evicted_keys > 0}} trên Redis dùng cho session/lock là "chuông báo cháy". Nếu workload đó thực sự không được evict, bất kỳ eviction nào cũng là sự cố cần điều tra, không phải chuyện bình thường.`,

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

### Ví dụ đời thực
Hệ thống tìm kiếm sản phẩm dùng Elasticsearch (ES) để phục vụ trang danh sách. Ban đầu, app ghi DB (PostgreSQL) rồi ghi ES bằng REST API trong cùng request — dual write. Khi ES cluster reboot (rolling update), một phần product bị mất trong ES nhưng vẫn có trong DB → người dùng không thấy sản phẩm. Điều tra: so sánh count DB vs ES theo category, thấy lệch khoảng 3% product. Sửa: (1) loại bỏ dual write — app chỉ write DB; (2) Debezium capture WAL → Kafka → ES sink connector, document id = DB primary key → idempotent upsert; (3) reindex không downtime: tạo index mới {{products_v2}} với mapping mới, backfill bằng CDC offset/checkpoint, khi đủ dữ liệu → {{_aliases}} request chuyển {{products}} alias từ index cũ sang index mới atomically; (4) xóa index cũ sau rollback window 24h; (5) xử lý delete: Debezium phát delete event → Kafka tombstone → sink xóa document (nếu không, dữ liệu đã xóa trong DB vẫn sót trong ES). Sau fix, lệch về 0; CDC lag thường < 5s.

### Trả lời mẫu khi phỏng vấn
"Khi Elasticsearch lệch DB, nguyên nhân thường là dual write — app ghi DB rồi ghi ES, và một trong hai bước fail → lệch. Cách đúng là chọn một nguồn sự thật: DB. App chỉ write DB, còn việc đồng bộ sang ES dùng CDC (Debezium) đọc transaction log (WAL/binlog) → Kafka → ES sink connector, document id = primary key → idempotent upsert. Reindex không downtime: tạo index mới với mapping mới, backfill bằng CDC offset/checkpoint, khi đủ dữ liệu chuyển alias atomically qua _aliases request — client không bị downtime. Xử lý delete: Debezium phát delete event và Kafka tombstone, sink phải map thành xóa document, nếu không dữ liệu đã xóa vẫn còn trong ES. CDC giúp giảm rủi ro dual write nhưng không loại bỏ — vẫn cần reconciliation định kỳ, rebuild procedure, monitoring lag và kế hoạch chuyển alias khi có thay đổi đồng thời."

### Cơ chế từng bước
1. **Cái gì:** Dual write = app ghi DB và ES trong cùng request; nếu một bước fail → lệch. CDC = Debezium đọc DB transaction log → Kafka → ES sink.
2. **Vì sao cần:** Dual write không atomic — hai hệ thống, không có transaction chung. CDC một chiều, DB là nguồn sự thật.
3. **Hoạt động:** Debezium capture WAL → Kafka → ES sink connector → ES. Document id = DB primary key → idempotent upsert.
4. **Ví dụ:** Dual write → ES fail → product lost in ES. CDC → WAL → Kafka → ES, document id = product_id → upsert.
5. **Lỗi hay gặp:** CDC lag → ES eventual consistent; schema evolution → mapping change → reindex; Debezium connector failure → lag tăng; delete event không được map → document sót.
6. **Trả lời phỏng vấn:** Nói trong phỏng vấn: nguồn sự thật duy nhất (DB), CDC (Debezium), reindex bằng hoán đổi alias, xử lý xóa, reconciliation + giám sát.

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

### Ví dụ đời thực
Sau một release thêm tính năng "log mọi request body để debug", chi phí log tăng từ 50GB/ngày lên 600GB/ngày — chi phí ELK tăng 12 lần. Điều tra: (1) logback level vẫn DEBUG trên prod (profile không được apply); (2) health check endpoint log mỗi request → 20k request/giây × 1KB = 20MB/giây; (3) một endpoint log full response object (List/Product) → mỗi request 50KB. Sửa: (1) profile-based level — prod INFO, dev DEBUG; (2) structured JSON logging (Logstash encoder) để parse dễ; (3) sampling cho high-volume endpoint — log 1/10 request, full log khi status ≥ 500; (4) PII redaction — mask email/phone/card, không log password/token; (5) retention — hot 7 ngày trong ELK, warm 30 ngày, cold 90 ngày S3 Glacier. Sau fix: log volume về 60GB/ngày, chi phí giảm 10 lần, vẫn giữ full log khi error.

### Trả lời mẫu khi phỏng vấn
"Chi phí log tăng vọt sau release thường do debug level còn bật, log mọi request, hoặc log object lớn. Tôi xử lý theo nhiều lớp. Log level theo environment: prod INFO, dev DEBUG — profile-based, không hardcode. Structured logging (JSON) giúp parse dễ và truy vấn theo field, nhưng cần đo overhead serialize/ingest. Sampling cho high-volume endpoint: log 1/N request, nhưng giữ full log khi status ≥ 500 để không mất rare errors. PII redaction: mask email/phone/card, không log password/token — dùng allowlist field thay vì ghi rồi che. Retention: hot/warm/cold theo nhu cầu điều tra, quy định và ngân sách. Đo bytes/ngày và chi phí theo service trước/sau thay đổi để có số liệu."

### Cơ chế từng bước
1. **Cái gì:** Log level (TRACE < DEBUG < INFO < WARN < ERROR), structured logging (JSON), sampling (log 1/N request), PII redaction, retention.
2. **Vì sao cần:** Log volume tăng → chi phí storage, ingest, và slow query. PII trong log → compliance risk (Nghị định 13, GDPR).
3. **Hoạt động:** Logback/Log4j2 profile-based level; Logstash encoder → JSON; sampling filter; PII redaction appender; retention policy.
4. **Ví dụ:** DEBUG + log body → 600GB/ngày → INFO + sampling + redaction → 60GB/ngày.
5. **Lỗi hay gặp:** Sampling miss rare errors → giữ full log khi status ≥ 500; structured logging overhead → avoid large body; PII regex miss → test với dataset thật.
6. **Trả lời phỏng vấn:** Nói trong phỏng vấn: level theo môi trường, JSON có cấu trúc, sampling (1/N + toàn bộ khi lỗi), che PII (danh sách cho phép), lớp lưu giữ, đo trước/sau.

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

### Ví dụ đời thực
Hệ thống đặt vé dùng Tomcat (default 200 worker threads) và gọi service đối tác xác thực bằng RestTemplate (timeout không cấu hình → vô hạn). Khi đối tác chậm 30s, mọi worker thread bị giữ, pool cạn → mọi request mới bị reject (503). Điều tra: thread dump thấy 200 thread cùng block ở {{socket read}} tới đối tác; metrics hàng đợi request tăng vọt. Sửa: (1) timeout 2s (connect 500ms, read 2s) trên RestTemplate; (2) Resilience4j circuit breaker (failure rate > 50% trong 10s → mở 30s); (3) bulkhead giới hạn 50 concurrent calls cho dependency này; (4) retry 2 lần backoff 500ms; (5) sau đó chuyển sang WebClient non-blocking. Sau fix, khi đối tác chậm 30s, tối đa 50 thread bị giữ, còn 150 thread xử lý request khác → không 503.

### Trả lời mẫu khi phỏng vấn
"Khi request thread bị giữ trong lời gọi downstream chậm, Tomcat có thể hết worker để xử lý request mới — hiện tượng pool exhaustion. Chẩn đoán bằng thread dump (xem worker đang chờ ở đâu: socket read, lock, queue) và metrics hàng đợi/latency theo route. Cách cô lập: thứ nhất, giới hạn timeout rõ ràng cho connect/read — không để default vô hạn; thứ hai, circuit breaker fail-fast khi dependency đang lỗi; thứ ba, bulkhead giới hạn concurrency mỗi dependency (thread-pool bulkhead tách pool riêng, semaphore bulkhead chỉ giới hạn số lượng); thứ tư, retry có backoff + jitter với idempotency. Spring Boot 3.2+ hỗ trợ virtual threads với JDK 21 — giảm chi phí thread chờ I/O nhưng không tăng năng lực downstream, vẫn cần timeout + CB. Chọn thread-pool hay semaphore bulkhead tùy loại lời gọi và giới hạn queue để tránh tích request."

### Cơ chế từng bước
1. **Cái gì:** Tomcat mỗi request một thread; thread block trên I/O (HTTP call, DB) → pool cạn → request mới reject.
2. **Vì sao cần:** Một dependency chậm có thể chiếm hết pool → toàn bộ service không phản hồi (cascade failure).
3. **Hoạt động:** Thread dump → worker RUNNABLE ở native socket read → xác nhận đang chờ downstream. Metrics: active/max threads, request queue, latency theo route.
4. **Ví dụ:** 200 thread, 180 đang chờ RestTemplate (timeout vô hạn) → 20 thread còn → request mới reject.
5. **Lỗi hay gặp:** Virtual threads không giải quyết downstream chậm; thread-pool bulkhead tiêu thụ worker; semaphore bulkhead không cách ly thread đang block; timeout default 2s/5s không phù hợp mọi hệ thống.
6. **Trả lời phỏng vấn:** Nói trong phỏng vấn: thread dump + metrics, timeout per dependency, circuit breaker, bulkhead (thread-pool vs semaphore), retry với backoff, giới hạn virtual threads.

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

### Cơ chế từng bước
1. **Ranh giới tích hợp:** ứng dụng nội bộ không gọi trực tiếp API core banking và không dùng model của core banking. Đặt một lớp adapter ở ranh giới, bắt mọi lệnh ra ngoài và mọi phản hồi quay lại.
2. **Adapter chuyển đổi:** adapter nhận {{TransferCommand}} (lệnh nội bộ), gọi core banking qua {{T24Client}}, rồi chuyển phản hồi của core banking thành {{TransferResult}} (model nội bộ). Chi tiết giao thức, mã lỗi, trường dữ liệu của core banking được giữ trong adapter, không rò ra business logic.
3. **Ánh xạ mã lỗi và trạng thái:** core banking có thể trả "accepted" hoặc "pending" thay vì success/fail. Adapter ánh xạ mã lỗi vendor sang nhóm lỗi nội bộ (lỗi nghiệp vụ, lỗi xác thực, lỗi tạm thời, kết quả chưa xác định) và giữ trạng thái pending thay vì ép thành boolean.
4. **Correlation ID và timeout:** mỗi lệnh gắn mã liên kết duy nhất (correlation ID) để theo dõi. Đặt timeout theo ngân sách latency. Nếu timeout sau khi gửi, không tự khẳng định thất bại — phải tra cứu trạng thái theo reference trước khi retry, tránh xử lý hai lần.
5. **Circuit breaker và reconciliation:** circuit breaker bảo vệ luồng xử lý khi core banking bị chậm/hết hạn. Có job đối soát định kỳ xử lý lệnh còn trạng thái pending.

### Ví dụ đời thực
Ngân hàng gửi lệnh rút tiền qua core banking T24. Lúc đầu dev dùng DTO của T24 toàn hệ thống, nên khi T24 thêm trường, nhiều màn hình nội bộ cũng bị ảnh hưởng. Sau đó chuyển sang ACL: adapter nhận {{TransferCommand}}, gọi T24, trả về {{TransferResult}}. Một sáng, core banking trả mã lỗi "99" (chưa xác định) và client timeout. Nhờ correlation ID, đội vận hành tra cứu trạng thái theo mã tham chiếu và thấy lệnh đã ghi nợ thành công ở core, chỉ phản hồi bị mất. Họ khôi phục thành "completed" thay vì retry và gây nợ hai lần. Số lần lệnh xử lý lại sai giảm từ nhiều trường hợp mỗi tuần xuống 0 trong tháng sau.

### Trả lời mẫu khi phỏng vấn
"Em sẽ đặt một lớp adapter ở ranh giới tích hợp, nhận lệnh nội bộ và chuyển sang định dạng của core banking, sau đó chuyển phản hồi quay lại thành model nội bộ. Mọi chi tiết giao thức và mã lỗi của core banking được giữ trong adapter, không để rò ra business logic. Nếu core trả accepted hoặc pending thay vì success, domain giữ trạng thái pending thay vì ép thành boolean. Mỗi lệnh gắn correlation ID, đặt timeout, và sau timeout tra cứu trạng thái theo reference trước khi retry, tránh nợ hai lần. Kèm theo circuit breaker và job đối soát định kỳ để xử lý lệnh pending."

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

### Cơ chế từng bước
1. **Timeout là kết quả chưa biết, không phải thất bại:** khi ứng dụng gửi lệnh chuyển tiền và client timeout, ứng dụng không biết core banking đã ghi nợ hay chưa. Không được tự chuyển trạng thái thành FAILED hay tự retry ngay.
2. **Idempotency key / tham chiếu duy nhất:** mỗi lệnh mang một tham chiếu duy nhất (reference/idempotency key) xuyên suốt, gắn với hash nội dung. Nếu cùng key gửi lại với nội dung khác, core từ chối. Điều này ngăn xử lý hai lần.
3. **Lưu trạng thái cục bộ trước khi gọi:** ứng dụng ghi bản ghi lệnh với trạng thái {{CREATED}}, rồi chuyển sang {{SENT}} sau khi gửi, trong cùng transaction hoặc outbox. Không giữ transaction DB mở trong khi gọi mạng.
4. **Sau timeout:** truy vấn trạng thái của core banking cùng tham chiếu cũ, hoặc chờ callback/reconciliation. Không sinh tham chiếu mới. Chỉ retry nếu core cam kết idempotent theo hợp đồng.
5. **Job đối soát:** tìm các lệnh {{UNKNOWN}} quá ngưỡng và đưa vào xử lý có kiểm soát, kiểm tra xem cuối cùng có trạng thái kết thúc (terminal) hay chưa.

### Ví dụ đời thực
Ứng dụng chuyển tiền cho khách hàng, client timeout sau 10 giây. Nếu dev mặc định timeout = thất bại và cho retry, lệnh có thể được gửi lần hai và khách bị ghi nợ hai lần. Thiết kế đúng: trước khi gọi, ghi bảng lệnh với mã tham chiếu duy nhất và trạng thái {{SENT}}. Sau timeout, ứng dụng gọi API truy vấn trạng thái của core banking cùng mã tham chiếu. Core trả "đang xử lý" (pending) → ứng dụng giữ trạng thái {{UNKNOWN}} và thông báo khách hàng tra cứu sau. Core trả "thành công" → ứng dụng ghi {{FINAL}} thành công, không retry. Trong tháng, có 3 trường hợp lệnh {{UNKNOWN}}, toàn bộ được giải quyết qua đối soát, không phát sinh giao dịch trùng.

### Trả lời mẫu khi phỏng vấn
"Em coi timeout là kết quả chưa biết, chứ không phải thất bại. Mỗi lệnh có tham chiếu duy nhất gắn với nội dung, lưu trạng thái cục bộ trước khi gọi, và không giữ transaction DB mở khi gọi mạng. Sau timeout, em truy vấn trạng thái của core banking cùng tham chiếu cũ thay vì sinh tham chiếu mới. Chỉ retry nếu core cam kết idempotent. Nếu không rõ, giữ trạng thái {{UNKNOWN}} và để job đối soát xử lý sau. Bên cạnh đó, thời gian giữ idempotency key ở core phải dài hơn cửa sổ retry và đối soát."

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

### Cơ chế từng bước
1. **Khác biệt cơ bản:** ISO 8583 là họ thông điệp giao dịch thẻ/tài chính, thường dùng bitmap (mã bit cho biết trường nào có dữ liệu) và data element (trường dữ liệu), cùng processing code và mã phản hồi, tùy theo profile (bản thỏa thuận hai bên). ISO 20022 định nghĩa mô hình thông điệp và schema, thường triển khai bằng XML, còn JSON là biểu diễn riêng của API/đối tác.
2. **Không suy ý nghĩa từ tên trường:** cùng tên "amount" ở hai chuẩn có thể khác ý nghĩa. Phải theo profile, phiên bản và quy ước của đối tác, không tự đoán từ tiêu chuẩn chung.
3. **Số tiền (amount):** phân biệt đơn vị nhỏ (minor, ví dụ cents) và đơn vị lớn (major, ví dụ dollars), số mũ của đơn vị tiền tệ (currency exponent), dấu và làm tròn. Không dùng số thực (floating point) để xử lý tiền, dùng loại số chính xác (ví dụ {{BigDecimal}} trong Java).
4. **Trạng thái giao dịch:** authorization (xét duyệt), clearing (dọn dẹp), settlement (quyết toán), reversal/return (hoàn/lưu ý) là các giai đoạn khác nhau. Phản hồi thành công không đồng nghĩa tiền đã quyết toán cuối cùng.
5. **Thiết kế mapping:** tạo lệnh/kết quả chuẩn nội bộ chỉ chứa khái niệm cần thiết. Adapter giữ dữ liệu thô có kiểm soát, xác thực schema/độ dài, ánh xạ bảng mã và lưu mã liên kết. Kiểm tra bằng fixture: thông điệp mẫu, trường tùy chọn vắng mặt, mã không biết, bản sao và payload hỏng.

### Ví dụ đời thực
Một ứng dụng thanh toán cần sửa bản tin ISO 8583 và API ISO 20022. Ban đầu dev mapping trường "amount" theo tên, được 100 (hiểu là 100 đồng) nhưng đối tác dùng đơn vị nhỏ nên thực ra là 1.000.000 đồng → khách bị trừ sai. Sau đó đội ngũ tạo lớp mapping chuẩn nội bộ, chuyển amount sang {{BigDecimal}}, kiểm tra currency exponent và profile của đối tác, rồi viết test với thông điệp mẫu đã ẩn danh (anonymize). Lần sau đối tác nâng phiên bản schema, đội phát hiện qua test vector trước khi ảnh hưởng production.

### Trả lời mẫu khi phỏng vấn
"Em khuyên không suy ý nghĩa chỉ từ tên trường hay tiêu chuẩn chung, mà phải theo profile, phiên bản và quy ước của đối tác. ISO 8583 dùng bitmap và data element, còn ISO 20022 định nghĩa mô hình thông điệp và schema thường là XML. Với số tiền, em phân biệt đơn vị nhỏ/lớn, số mũ tiền tệ và dùng {{BigDecimal}} thay vì số thực để tránh sai làm tròn. Trạng thái như authorization, clearing, settlement là các giai đoạn khác nhau, phản hồi thành công chưa chắc tiền đã quyết toán. Em cũng viết test vector từ sample đã ẩn danh để kiểm tra khi đối tác nâng phiên bản."

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

### Cơ chế từng bước
1. **Không dual-write:** không ghi vào DB và gửi event vào broker trong cùng đoạn code rồi hy vọng cả hai thành công. Nếu DB ghi xong mà broker gửi thất bại (hoặc ngược lại), dữ liệu sẽ không nhất quán.
2. **Outbox pattern:** trong một transaction DB, ghi bản ghi nghiệp vụ (ví dụ cộng trừ tiền) và bảng outbox (chứa sự kiện) cùng lúc, rồi commit. Nếu crash, cả hai cùng thành công hoặc cùng hủy.
3. **Publisher gửi lặp có thể xảy ra:** publisher lấy các hàng outbox chưa gửi, gửi sự kiện, rồi đánh dấu đã gửi. Nếu crash giữa khi gửi và đánh dấu, sự kiện có thể được gửi lại → consumer phải idempotent (xử lý trùng không gây sai) theo ID sự kiện.
4. **Consumer ghi mã deduplication và cập nhật nghiệp vụ trong cùng transaction.**
5. **Theo dõi:** backlog (số sự kiện chờ), tuổi sự kiện, retry/dead-letter, và có quy trình replay lại sự kiện khi cần.

### Ví dụ đời thực
Hệ thống thanh toán ghi giao dịch vào DB rồi cần gửi thông báo vào {{IBM MQ}}. Ban đầu code ghi DB rồi gọi {{mq.send()}} ngay sau, nhưng nếu máy chủ bị mất điện giữa chừng, DB có giao dịch còn MQ không có event → khách hàng không nhận thông báo. Sau khi áp dụng outbox: mỗi lần ghi giao dịch cũng ghi hàng outbox trong cùng transaction, một trình phát tán đọc hàng outbox và gửi event, sau đó đánh dấu đã gửi. Trong quý, có 2 lần publisher gửi lại sự kiện nhưng consumer dùng ID sự kiện để deduplicate, không gửi thông báo trùng. Số sự kiện thất bại giảm xuống 0.

### Trả lời mẫu khi phỏng vấn
"Em không ghi DB và gửi event broker trong cùng đoạn code vì nếu một bên thành công một bên thất bại thì dữ liệu không nhất quán. Thay vào đó, em dùng outbox pattern: ghi bản ghi nghiệp vụ và sự kiện vào bảng outbox trong cùng transaction DB, rồi một publisher đọc hàng outbox và gửi event, sau đó đánh dấu đã gửi. Vì publisher có thể gửi lại, consumer phải xử lý trùng theo ID sự kiện (idempotent). Em cũng theo dõi backlog, tuổi sự kiện và dead-letter, cùng có quy trình replay khi cần. Chọn {{IBM MQ}} hay Kafka tùy hệ sinh thái và năng lực vận hành của tổ chức, không theo khẩu hiệu."

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

### Ví dụ đời thực
Job EOD áp biểu phí duy trì tài khoản mới cho 4 triệu tài khoản, phải xong trước cut-off 23:30. Đêm đầu tiên, job chạy chậm hơn dự kiến và tới 23:30 mới xong 65%; theo quy tắc cut-off, job phải dừng để hệ thống chuyển sang ngày giao dịch mới. Sáng hôm sau, chạy lại thủ công áp phí với **ngày giá trị của hôm nay** cho cả 4 triệu tài khoản → 2,6 triệu tài khoản bị thu phí hai lần (một lần ngày cũ, một lần ngày mới). Thiết kế lại: mỗi lần chạy có **run_id** gắn với **ngày nghiệp vụ** cố định (không lấy ngày hệ thống lúc chạy); bản ghi phí có khoá duy nhất {{(account_id, fee_type, business_date)}}; tiến độ ghi theo lô; khi chạy lại, job đọc run_id cũ và chỉ xử lý tài khoản chưa có bản ghi; khoá nghiệp vụ trên bảng {{batch_run}} ngăn hai lần chạy cùng ngày nghiệp vụ đồng thời. Thêm dự báo thời gian chạy dựa trên tốc độ thực tế để cảnh báo trước cut-off 1 giờ.

### Trả lời mẫu khi phỏng vấn
"Điểm mấu chốt là mỗi lần chạy gắn với một ngày nghiệp vụ cố định, không phải ngày hệ thống lúc job chạy, nên chạy lại vào sáng hôm sau vẫn áp phí cho đúng ngày cũ. Mỗi bản ghi phí có khoá duy nhất gồm tài khoản, loại phí và ngày nghiệp vụ, nên chạy lại không thể tính hai lần. Job xử lý theo lô với checkpoint, khi tiếp tục chỉ xử lý những tài khoản chưa có bản ghi. Một khoá nghiệp vụ trên bảng quản lý lần chạy đảm bảo không có hai lần chạy cùng ngày nghiệp vụ song song. Với cut-off, job phải dừng an toàn ở ranh giới lô, ghi lại trạng thái, và cảnh báo sớm nếu dự báo không kịp. Cuối cùng là kiểm tra tổng sau khi hoàn tất: số tài khoản và tổng phí khớp với kỳ vọng."

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

### Cơ chế từng bước
1. **Tách quyền tạo và quyền duyệt:** người lập giao dịch (maker) không được là người duyệt (checker) của chính mình. Checker phải độc lập.
2. **Trạng thái workflow:** giao dịch đi qua {{DRAFT}} → {{PENDING_APPROVAL}} → {{APPROVED}}/{{REJECTED}} → {{EXECUTED}}. Chỉ chuyển trạng thái qua quy trình được phân quyền, không gọi trực tiếp DB.
3. **Lưu quyết định bất biến:** mỗi quyết định duyệt lưu người duyệt, thời gian, lý do, phiên bản (version) và nội dung giao dịch lúc duyệt (snapshot hoặc hash). Nếu maker sửa số tiền hoặc người nhận sau khi duyệt, phải hủy duyệt và duyệt lại.
4. **Kiểm soát ở server:** separation-of-duty (phân chia nhiệm vụ) thực thi ở phía server, không chỉ ẩn nút trên UI.
5. **Audit và DB đặc quyền:** audit ghi ai, làm gì, đối tượng, trước/sau, mã liên kết, thời gian, nguồn xác thực, cùng transaction với quyết định nghiệp vụ. Quyền DB đặc quyền (DBA) được tách, xuất sang lưu trình tự kiểm soát riêng, có break-glass với ticket và thời hạn.

### Ví dụ đời thực
Một hệ thống thanh toán cho phép nhân viên lập giao dịch lớn (maker) và một nhân viên khác duyệt (checker). Một ngày, operator có quyền DB muốn đổi trạng thái giao dịch trực tiếp trên bảng để "vượt quá quy trình". Do audit chỉ ghi ở ứng dụng và DBA có quyền sửa bảng, sự can thiệp không được ghi lại. Sau sự cố, đội ngũ thêm kiểm soát: mọi thay đổi trạng thái phải qua API có maker-checker, audit ghi cùng transaction và xuất sang hệ thống log độc lập, quyền DBA được hạn chế và có break-glass với ticket. Số trường hợp can thiệp trực tiếp DB giảm xuống 0 sau ba tháng.

### Trả lời mẫu khi phỏng vấn
"Em sẽ tách quyền tạo và quyền duyệt, bắt buộc người duyệt phải khác người lập. Giao dịch đi qua trạng thái {{DRAFT}}, {{PENDING_APPROVAL}}, {{APPROVED}}/{{REJECTED}} rồi {{EXECUTED}}, và chỉ chuyển trạng thái qua quy trình phân quyền. Mỗi quyết định duyệt lưu người duyệt, thời gian, lý do, phiên bản và nội dung lúc duyệt; nếu người lập sửa sau khi duyệt thì hủy duyệt và duyệt lại. Kiểm soát được thực hiện ở server, không chỉ ẩn nút trên UI. Audit ghi cùng transaction với quyết định nghiệp vụ và xuất sang hệ thống log độc lập để DBA không thể xóa hoặc sửa giấu audit. Can thiệp trực tiếp DB phải qua break-glass có ticket và thời hạn."

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
  a: `**Tóm tắt:** Chỉ ghi log những gì tối thiểu để vận hành và tra soát, loại bỏ credential (thông tin đăng nhập như token, mật khẩu) và PII (Personally Identifiable Information — dữ liệu nhận diện cá nhân như tên, số tài khoản, số điện thoại), che/mã hóa định danh trước khi ghi, và dùng correlation ID (mã định danh chuỗi request — giống mã vận đơn để theo dõi một giao dịch qua nhiều service) không chứa bí mật để nối các bước. Coi log là kho dữ liệu nhạy cảm: phân quyền, mã hóa, đặt thời gian lưu (retention), và kiểm tra tự động để phát hiện rò rỉ.

### Tại sao phải thiết kế log cẩn thận
Trong hệ thống nhiều service (microservices — ứng dụng chia thành nhiều dịch vụ nhỏ gọi nhau), một giao dịch chuyển tiền có thể đi qua API Gateway, service xác thực, service giao dịch, service thông báo. Khi sự cố xảy ra (ví dụ khách báo "tiền bị trừ nhưng chưa nhận"), đội vận hành cần tìm lại đúng chuỗi xử lý. Nếu log ghi nguyên request/response, token xác thực hoặc số tài khoản đầy đủ sẽ nằm rải rác ở nhiều nơi (file log, hệ thống thu thập log như ELK/CloudWatch, APM trace). Chỉ cần một quyền truy cập sai hoặc một lần xuất log để debug là có thể lộ dữ liệu.

### Cơ chế hoạt động từng bước
1. **Allowlist field (danh sách cho phép):** Thay vì "ghi hết rồi che", chỉ định rõ các field được phép log: {{event_type}}, {{status}}, {{latency_ms}}, {{partner_code}}, {{trace_id}}, {{transaction_ref}}, {{account_token}} (mã thay thế). Field mới mặc định không được log cho đến khi có lý do vận hành và chủ sở hữu dữ liệu.
2. **Masking/Tokenization trước khi ghi:**
   - Masking (che): {{123456789012}} → {{******9012}} (chỉ giữ vài số cuối để tra soát).
   - Tokenization (mã hóa thay thế): dùng HMAC (Hash-based Message Authentication Code — hàm băm có khóa bí mật) để tạo {{account_token}} ổn định cho cùng tài khoản nhưng không thể đoán ngược nếu không có key. Không dùng hash thường (như SHA-256 thuần) cho giá trị có không gian nhỏ (số tài khoản 10-12 chữ số dễ bị dò ngược bằng bảng tra).
3. **Correlation ID:** Sinh {{trace_id}} (UUID) ở điểm vào, truyền qua header (ví dụ {{X-Request-Id}}) sang các service. {{trace_id}} không mang ý nghĩa nghiệp vụ hay bí mật, chỉ dùng để nối log.
4. **Tách audit log (log kiểm toán nghiệp vụ):** Log "ai làm gì, khi nào, kết quả" (ví dụ phê duyệt giao dịch) lưu riêng schema, quyền truy cập chặt hơn, retention dài hơn. Diagnostic log (log kỹ thuật để debug) có thể retention ngắn hơn.

~~~text
Không log: Authorization, OTP, password, PAN đầy đủ, raw payload
Cho phép: trace_id, transaction_ref, account_token(HMAC), outcome, latency_ms, error_code
Ví dụ: event=transfer status=FAILED trace_id=8f3a... account_token=tok_a91... latency_ms=420
~~~

### Ví dụ đời thực
Hệ thống thanh toán nội bộ, ~800 QPS giờ cao điểm, 6 service, log đẩy về ELK (Elasticsearch/Logstash/Kibana — bộ công cụ thu thập/tìm kiếm log). Trước đây dev log {{requestBody}} để debug, vô tình ghi {{Authorization}} header. Sau audit: 0.3% dòng log (khoảng 2.4 dòng/giây, ~200k dòng/ngày) chứa chuỗi nhạy cảm. Xử lý: chuyển sang allowlist logger, mask tại appender boundary (điểm xuất log cuối cùng), thêm canary test (gửi payload chứa {{SECRET_CANARY}} và quét log). Sau 2 tuần: 0 lần phát hiện canary, thời gian tra soát giao dịch nhờ {{trace_id}} giảm từ ~25 phút xuống ~6 phút vì log có cấu trúc.

### Khi nào dùng / không dùng
- Masking một phần: đủ cho tra soát nghiệp vụ, vẫn là dữ liệu nhạy cảm theo chính sách nội bộ.
- Tokenization HMAC: khi cần tìm "tất cả giao dịch của cùng khách hàng" mà không lưu định danh thô.
- Không serialize nguyên object: annotation {{@Mask}} dễ bị bỏ sót ở log khác (exception message, APM trace, access log của gateway).

### Pitfall production
- MDC (Mapped Diagnostic Context — nơi lưu {{trace_id}} theo thread) rò rỉ giữa thread khi dùng thread pool/async executor nếu không truyền và xóa đúng cách.
- Regex masking dễ sai với JSON lồng, encoding khác nhau, hoặc field mới; allowlist theo schema an toàn hơn.
- Exception message, stack trace, APM trace, access log đều là đường rò rỉ, không chỉ application log.

### Trả lời mẫu khi phỏng vấn
"Em sẽ coi log là dữ liệu nhạy cảm. Trước hết em dùng allowlist: chỉ log các field cần cho vận hành như trace_id, transaction_ref, trạng thái, latency, và mã thay thế cho tài khoản; tuyệt đối không log credential hay raw payload. Định danh được tokenize bằng HMAC có key quản lý riêng để tra soát cùng khách hàng mà không lưu số tài khoản thô. Ở hệ thống nhiều service, em sinh correlation ID tại gateway và truyền qua header để nối chuỗi xử lý. Em tách audit log nghiệp vụ khỏi diagnostic log vì retention và phân quyền khác nhau. Về kiểm soát, em mask ở appender boundary, chạy canary test tự động quét log, đặt retention và phân quyền truy cập, đồng thời nhớ cả exception message và APM trace cũng có thể rò rỉ."

> Senior tip: Chạy quét tự động trên log (pattern cấm như {{Authorization}}, chuỗi số 16 chữ số) trong CI và định kỳ trên production; mỗi field log mới phải có chủ sở hữu và lý do vận hành, nếu không allowlist sẽ lại phình to.`,
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

### Ví dụ đời thực
Flash sale 30 vé concert: Redis {{DECR}} trừ tồn kho (nhanh, nguyên tử), rồi gửi lệnh đặt vào Kafka, consumer tạo đơn trong PostgreSQL. Kết quả: Redis báo hết vé, nhưng DB chỉ có 27 đơn — 3 lệnh bị mất vì consumer lỗi validate và **không trả lại tồn kho Redis**; 3 khách bị báo "hết vé" trong khi vé vẫn còn. Ở một lần khác, Redis restart mất dữ liệu (không bật AOF) và **bán vượt** 12 vé. Sửa: DB là nguồn sự thật cho tồn kho cuối cùng (UPDATE có điều kiện {{remaining >= 1}}); Redis chỉ là **cổng lọc** để chặn bớt traffic (tồn kho Redis = tồn kho DB + biên nhỏ, được đồng bộ lại định kỳ); mỗi lệnh có trạng thái (RESERVED → CONFIRMED/RELEASED) và thời hạn giữ chỗ; consumer lỗi thì phát sự kiện **hoàn trả** chỗ; job đối soát mỗi phút so số lượng đã bán trong DB với Redis và sửa chênh lệch. Không còn bán vượt hay "mất vé".

### Trả lời mẫu khi phỏng vấn
"Khi có nhiều nơi giữ trạng thái tồn kho như Redis, Kafka và DB, tôi chốt một nguồn sự thật, thường là DB với câu UPDATE có điều kiện còn hàng, vì nó bền và nguyên tử. Redis dùng làm lớp chặn nhanh phía trước để giảm tải, chứ không phải nơi quyết định cuối cùng; nếu Redis mất dữ liệu hay lệch thì DB vẫn chặn bán vượt. Mỗi lượt đặt có vòng đời rõ ràng: giữ chỗ có thời hạn, xác nhận hoặc nhả ra, và mọi đường lỗi trong consumer đều phải phát sự kiện trả lại chỗ, xử lý idempotent. Một job đối soát chạy thường xuyên so sánh số đã bán trong DB với số trong Redis và sửa chênh lệch, đồng thời cảnh báo khi lệch vượt ngưỡng. Như vậy không bán vượt, và chỗ bị giữ do lỗi sẽ được trả lại."

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

### Ví dụ đời thực
Chương trình "mỗi tài khoản 1 coupon 100k": bot tạo hàng nghìn tài khoản mới qua số điện thoại ảo và gọi API cấp coupon 3.000 lần/giây từ dải IP của nhà cung cấp cloud. Giới hạn 10 request/phút theo IP chặn nhầm cả toà văn phòng 800 nhân viên dùng chung một IP NAT (khiếu nại từ khách doanh nghiệp), còn giới hạn theo user thì vô dụng vì mỗi bot là một user mới. Thiết kế nhiều tín hiệu: giới hạn theo **thiết bị** (fingerprint ký từ app), theo **tuổi tài khoản** (tài khoản dưới 24 giờ cần thêm xác minh), theo **ASN/dải IP cloud**, CAPTCHA khi điểm rủi ro cao, và giới hạn **tổng ngân sách** coupon theo phút để thiệt hại tối đa có trần. Coupon chỉ "kích hoạt" khi có giao dịch thật. Tỉ lệ coupon bị bot lấy giảm từ khoảng 60% xuống dưới 5%; văn phòng dùng chung NAT không còn bị chặn.

### Trả lời mẫu khi phỏng vấn
"Một khoá giới hạn duy nhất luôn có điểm mù: theo IP thì chặn nhầm người dùng chung NAT, theo user thì bot tạo user mới là lọt. Tôi kết hợp nhiều tín hiệu thành điểm rủi ro: thiết bị qua fingerprint có ký, tuổi và lịch sử tài khoản, IP và ASN, đặc biệt là dải IP của nhà cung cấp cloud, hành vi như tốc độ thao tác. Rủi ro thấp thì cho qua, trung bình thì thêm thử thách như CAPTCHA hay OTP, cao thì chặn. Tôi đặt thêm một trần ngân sách toàn cục theo phút để thiệt hại tối đa luôn có giới hạn, và thiết kế phần thưởng chỉ có giá trị khi có giao dịch thật. Đo lường bằng tỉ lệ coupon được dùng bởi tài khoản đáng tin, tỉ lệ chặn nhầm, và có cơ chế mở chặn nhanh cho khách hàng hợp lệ."

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

### Ví dụ đời thực
Campaign iPhone giá sốc: 5.000 request/giây tranh **một** key tồn kho. Team bọc "đọc tồn kho → kiểm tra → trừ" bằng Redisson lock: mỗi thao tác mất 3 round-trip (lấy khoá, thao tác, nhả khoá) và **tuần tự hoá** mọi request → throughput tối đa khoảng 800 lần/giây, hàng nghìn request timeout, trong khi khoá cũng không giúp gì thêm vì Redis vốn xử lý lệnh đơn luồng. Đổi sang **một script Lua** (hoặc lệnh {{DECRBY}} rồi kiểm tra kết quả âm thì {{INCRBY}} trả lại): kiểm tra và trừ trong một lệnh nguyên tử, khoảng 50.000 lần/giây trên một instance Redis. Key nóng còn được **chia nhỏ** thành 10 key con (mỗi key giữ một phần tồn kho, request chọn ngẫu nhiên, hết thì thử key khác) để giảm tranh chấp trên một shard Redis Cluster. DB vẫn xác nhận cuối cùng bằng UPDATE có điều kiện.

### Trả lời mẫu khi phỏng vấn
"Với thao tác đọc, kiểm tra, trừ trên một key Redis, khoá phân tán là thừa và còn làm chậm: Redis thực thi mỗi lệnh và mỗi script Lua một cách nguyên tử, nên tôi gói logic vào một script Lua hoặc dùng DECRBY rồi xử lý kết quả âm, một round-trip thay vì ba, không tuần tự hoá qua khoá. Khoá phân tán như Redisson chỉ cần khi phải phối hợp nhiều tài nguyên hoặc một đoạn logic dài không gói được vào Redis, và khi đó phải chịu chi phí và rủi ro của khoá: hết hạn giữa chừng, cần fencing token. Với key cực nóng, tôi chia tồn kho thành nhiều key con để phân tán tải trên cluster. Và Redis chỉ là lớp nhanh phía trước; nguồn sự thật cuối cùng vẫn là DB với cập nhật có điều kiện."

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

### Ví dụ đời thực
Giỏ hàng lưu dạng một chuỗi JSON trong key {{cart:<userId>}}. App gửi song song hai request (đổi số lượng áo, thêm quần): mỗi request {{GET}} chuỗi, sửa trong Java, {{SET}} lại → request ghi sau đè mất thay đổi của request trước. Khoảng 1,5% lượt thêm vào giỏ trên app bị "mất". Đổi mô hình sang **Redis Hash**: {{HSET cart:<userId> sku-123 2}} — mỗi sản phẩm là một field, mỗi lệnh chỉ chạm field của nó, các thay đổi khác nhau không còn đè nhau; tăng số lượng dùng {{HINCRBY}} nguyên tử; TTL đặt trên cả key. Với thao tác cần kiểm tra nhiều field cùng lúc (giới hạn tối đa 50 sản phẩm), dùng script Lua. Lỗi mất sản phẩm về 0; payload mạng mỗi lần sửa cũng nhỏ hơn nhiều vì không phải gửi cả giỏ.

### Trả lời mẫu khi phỏng vấn
"Lưu cả giỏ hàng thành một chuỗi JSON nghĩa là mọi thay đổi đều phải đọc cả chuỗi, sửa trong ứng dụng rồi ghi đè cả chuỗi, nên hai request đồng thời sửa hai sản phẩm khác nhau vẫn đè mất nhau, đó là lost update. Tôi đổi mô hình dữ liệu cho khớp với cách cập nhật: dùng Redis Hash, mỗi sản phẩm là một field, HSET hay HINCRBY chỉ chạm đúng field đó và nguyên tử, nên các thay đổi độc lập không còn xung đột, payload cũng nhỏ hơn. Với ràng buộc trên toàn giỏ như số sản phẩm tối đa, tôi dùng script Lua để kiểm tra và ghi trong một bước. Nếu buộc phải giữ dạng JSON, có thể dùng WATCH với MULTI EXEC để làm optimistic locking và thử lại, nhưng thay đổi cấu trúc dữ liệu thường là giải pháp gọn hơn."

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

### Ví dụ đời thực
Service sản phẩm theo mẫu "cập nhật DB rồi ghi cache mới". Hai admin sửa giá gần như cùng lúc trên hai instance: instance A ghi DB giá 100, instance B ghi DB giá 120, nhưng B ghi cache **trước** A → cache giữ 100 trong khi DB là 120 suốt 1 giờ (TTL). Đổi sang **"cập nhật DB rồi xoá cache"** (cache-aside): lần đọc sau nạp lại từ DB. Vẫn còn race hiếm: một request đọc đang nạp giá cũ vào cache đúng lúc vừa xoá → dùng **xoá trễ lần hai** sau 500ms, và TTL ngắn hơn (5 phút) làm lưới an toàn. Cuối cùng chuyển sang **CDC**: Debezium đọc binlog MySQL, phát sự kiện thay đổi, một consumer xoá/cập nhật cache theo thứ tự binlog — cache không còn lệch quá vài trăm mili giây, và không phụ thuộc vào việc mọi chỗ ghi DB đều nhớ xoá cache.

### Trả lời mẫu khi phỏng vấn
"Cập nhật DB rồi ghi giá trị mới vào cache dễ sai khi có nhiều instance: thứ tự ghi DB và thứ tự ghi cache có thể khác nhau, nên cache giữ giá trị cũ. Mẫu an toàn hơn là cache-aside: cập nhật DB rồi xoá cache, lần đọc sau nạp lại từ DB. Vẫn có race hiếm khi một request đọc nạp giá trị cũ ngay sau lúc xoá, nên tôi thêm xoá trễ lần hai và TTL hợp lý làm lưới an toàn. Với hệ thống cần nhất quán tốt hơn, tôi dùng CDC: đọc binlog hoặc WAL và cập nhật hoặc xoá cache theo đúng thứ tự thay đổi trong DB, không phụ thuộc mọi đoạn code ghi DB đều nhớ xử lý cache. Và tôi luôn xác định dữ liệu nào chấp nhận cũ bao lâu; dữ liệu như số dư thì không đọc từ cache để ra quyết định."

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

### Ví dụ đời thực
Consumer đơn hàng dùng 1 partition-consumer nhưng xử lý **song song bằng thread pool 16 luồng** để tăng tốc. Các sự kiện CREATED và PAID của cùng một đơn đến liên tiếp và chạy trên hai luồng khác nhau → PAID ghi trước, CREATED ghi sau đè trạng thái về CREATED; khoảng 0,1% đơn "kẹt" ở trạng thái chưa thanh toán dù khách đã trả tiền. Sửa: (1) producer dùng key = {{orderId}}; (2) trong consumer, phân luồng theo **hash(orderId) % 16** — cùng một đơn luôn vào cùng một luồng (hàng đợi riêng), khác đơn vẫn song song; (3) commit offset chỉ tới vị trí mà mọi message phía trước đã xử lý xong (theo dõi offset hoàn thành theo partition); (4) DB chặn chuyển trạng thái lùi bằng điều kiện {{WHERE status_version < :newVersion}}. Thư viện Confluent Parallel Consumer làm sẵn (2) và (3) theo chế độ KEY ordering.

### Trả lời mẫu khi phỏng vấn
"Kafka chỉ đảm bảo thứ tự trong một partition, và chỉ khi consumer xử lý tuần tự. Để giữ thứ tự theo aggregate mà vẫn mở rộng, tôi làm ba việc. Producer dùng id của aggregate, như orderId, làm key, nên mọi sự kiện của một đơn vào cùng partition. Nếu cần song song trong một partition, tôi phân luồng theo hash của key, để cùng một đơn luôn đi vào cùng một hàng đợi và luồng, còn các đơn khác chạy song song; offset chỉ được commit tới vị trí mà mọi message trước đó đã xử lý xong. Cuối cùng, phía DB có lớp bảo vệ: mỗi sự kiện mang version, cập nhật kèm điều kiện version mới lớn hơn version hiện tại, nên sự kiện đến muộn không làm trạng thái lùi lại. Tăng số partition cũng giúp mở rộng mà vẫn giữ thứ tự theo key."

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

### Ví dụ đời thực
API upload video bảo hành (tới 1GB) dùng Spring {{MultipartFile}} với cấu hình giữ file trong bộ nhớ: 5 người upload cùng lúc là pod 2GB bị OOMKilled; người dùng ở vùng mạng yếu phải tải lại từ đầu sau mỗi lần mất kết nối. Thiết kế lại theo giao thức **tus** (upload có thể tiếp tục): {{POST}} tạo phiên upload trả về URL; client gửi các khúc 5MB bằng {{PATCH}} kèm {{Upload-Offset}}; mất mạng thì {{HEAD}} để hỏi server đã nhận tới đâu rồi gửi tiếp. Server **stream** từng khúc thẳng sang S3 multipart, không giữ trong heap ({{spring.servlet.multipart}} chỉ dùng cho file nhỏ). Giới hạn kích thước tổng, loại file, số phiên đồng thời mỗi người; phiên dở dang hết hạn sau 24 giờ. Bộ nhớ mỗi upload còn khoảng 5MB thay vì 1GB; tỉ lệ upload thành công ở vùng mạng yếu từ 70% lên 98%.

### Trả lời mẫu khi phỏng vấn
"Giữ cả file trong heap là sai từ gốc: bộ nhớ tỉ lệ với kích thước file nhân số người upload đồng thời. Tôi thiết kế upload theo khúc có thể tiếp tục: client tạo một phiên upload, gửi từng khúc vài megabyte kèm vị trí offset, server stream mỗi khúc thẳng xuống storage như S3 multipart mà không giữ trong bộ nhớ, và khi mất mạng client hỏi server đã nhận tới đâu để gửi tiếp. Giao thức tus là chuẩn mở cho việc này; hoặc tốt hơn với S3 là cho client tải trực tiếp bằng presigned URL từng phần, backend chỉ điều phối. Bảo vệ: giới hạn kích thước, loại file, số phiên mỗi người, phiên dở dang có hạn và được dọn, kiểm tra hash và quét virus sau khi hoàn tất. Trạng thái phiên lưu ở chỗ dùng chung để mọi instance đều tiếp tục được."

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

### Ví dụ đời thực
Đợt phát 1 triệu coupon toàn cầu ở 3 region. Bản đầu dùng một bộ đếm trung tâm ở us-east: mỗi lần cấp coupon từ châu Á phải gọi liên vùng (~200ms), và khi mạng liên vùng chập chờn 6 phút thì châu Á **không cấp được gì**. Đổi sang **escrow quota**: tổng 1 triệu được chia trước theo dự báo (Mỹ 400k, châu Âu 300k, châu Á 300k); mỗi region cấp từ phần của mình bằng Redis cục bộ (nhanh, không cần liên vùng); một bộ điều phối định kỳ (mỗi 30 giây, khi mạng ổn) **cân bằng lại** phần dư giữa các region; khi bị chia cắt, mỗi region chỉ tiêu tối đa phần đã được giao — **không bao giờ vượt tổng**. Đánh đổi: có thể còn dư vài nghìn coupon ở region ít nhu cầu khi đợt kết thúc. Kết quả: không cấp vượt tổng, độ trễ cấp coupon ở châu Á từ 220ms còn 15ms.

### Trả lời mẫu khi phỏng vấn
"Một bộ đếm toàn cục duy nhất buộc mọi lần cấp phải liên vùng, chậm, và khi mạng chia cắt thì các region ở xa ngừng hoạt động; còn để mỗi region tự đếm không phối hợp thì có thể cấp vượt tổng. Tôi dùng cách chia quota trước, giống escrow: tổng hạn mức chia thành phần cho từng region theo dự báo nhu cầu, mỗi region cấp từ phần của mình bằng bộ đếm cục bộ, nhanh và không cần liên vùng. Một bộ điều phối định kỳ cân bằng lại phần dư khi mạng ổn định. Khi mạng bị chia cắt, mỗi region chỉ tiêu tối đa phần đã giữ, nên tổng không bao giờ vượt; cái giá là có thể dư một ít ở region ít nhu cầu. Đây là cách chọn tính sẵn sàng mà vẫn giữ được bất biến quan trọng nhất là không vượt tổng."

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

### Ví dụ đời thực
Hệ thống thanh toán có 12.000 đơn mỗi 3 ngày, trong đó 37 đơn có trạng thái PAID nhưng bảng stock_movement không có dòng trừ hàng. Log cùng lúc ném {{InsufficientStockException}} (lỗi khai báo, extends Exception). Nguyên nhân: method {{checkout()}} gọi {{placeOrder()}} qua {{this}} nên không qua proxy, và {{InsufficientStockException}} là checked nên Spring commit dù có lỗi. Đội ngũ sửa bằng chuyển exception thành unchecked, đặt {{@Transactional}} ở method public được gọi từ controller, viết test tích hợp nhánh lỗi và thêm job đối soát hàng ngày: đơn PAID phải có stock_movement, lệch thì cảnh báo. Sau khi sửa, số đơn PAID thiếu stock giảm từ 37 xuống 0.

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

### Ví dụ đời thực
Hệ thống duyệt khoản vay: khi nhân viên nhấn duyệt, service gọi {{@Async}} để ghi audit log không chặn giao diện. Sau kiểm toán, thấy hàng chục bản ghi audit có actor là {{anonymousUser}} hoặc NULL, không liên kết được request nào. Điều tra: log tên thread và authentication thấy thread HTTP là {{http-nio-8080-exec-7}} mang user "hoang", còn thread async là {{task-2}} có authentication null và log không có traceId. Nguyên nhân gốc: {{SecurityContext}} và MDC được lưu trong ThreadLocal, gắn với một thread; pool async chạy trên thread khác nên không thấy user và mã theo dõi của request gốc. Sửa: viết TaskDecorator chụp context ở thread gọi, khôi phục ở thread worker, luôn clear trong {{finally}}; thêm tham số actorId tường minh vào method ghi audit. Kết quả: actor audit đúng 100%, log async có traceId để nối với request trên Kibana.

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

### Ví dụ đời thực
API danh sách đơn hàng {{GET /orders?size=50}}: ở dev chạy 40ms vì chỉ 3 đơn, nhưng production p95 900ms và HikariCP báo hết connection lúc cao điểm. Điều tra: bật Hibernate statistics, gọi API một lần, thấy 101 query (1 lấy đơn + 50 lấy khách hàng + 50 lấy danh mục), stack trace của câu SQL nằm trong Jackson khi serialize response. Nguyên nhân gốc: OSIV giữ EntityManager mở hết request, khi Jackson chạm quan hệ lazy ngoài transaction thì Hibernate bắn thêm query mỗi lần. Sửa: tắt {{spring.jpa.open-in-view=false}}, dùng {{@EntityGraph}} load kèm khách hàng, {{@BatchSize}} cho danh mục, map sang DTO trong transaction read-only. Kết quả: p95 xuống 85ms, pending connection về 0, số query mỗi request giảm từ 101 xuống 3.

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

### Ví dụ đời thực
Chức năng tải PDF hoá đơn: khoảng 1 hoá đơn mỗi 20.000 lại in tên và số tiền của khách khác, chỉ xảy ra khi hơn 50 request đồng thời, máy dev không bao giờ tái hiện. Điều tra: kiểm tra code thấy {{InvoiceService}} là bean singleton có field {{currentInvoice}} và {{SimpleDateFormat}} có thể thay đổi. Viết test 32 thread gọi song song 2.000 lần, thấy khoảng 0,3% kết quả sai người. Nguyên nhân gốc: tất cả request dùng chung một đối tượng service, field nằm trên heap bị ghi đè xen kẽ giữa các thread; {{SimpleDateFormat}} giữ một Calendar chung bên trong nên cũng bị race. Sửa: đưa state vào biến cục bộ, thay {{SimpleDateFormat}} bằng {{DateTimeFormatter}} bất biến. Kết quả: test đồng thời 0 sai, không còn khiếu nại hoá đơn sai người.

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

### Ví dụ đời thực
Pod order-service khởi động mất 92 giây vì warm-up cache lớn, nhưng liveness probe bắt đầu sau 30 giây, thất bại 3 lần mỗi 10 giây nên kubelet kill container ở khoảng 60 giây, trước khi ứng dụng sẵn sàng. Kết quả: CrashLoopBackOff, RESTARTS tăng đều, không có OOMKilled. Điều tra: {{kubectl describe pod}} hiển thị sự kiện "Liveness probe failed", xem log lần chạy trước bằng {{kubectl logs --previous}}. Nguyên nhân gốc: liveness kiểm tra quá sớm trong giai đoạn khởi động, và GC pause dài làm probe timeout liên tiếp. Sửa: thêm {{startupProbe}} cho tối đa 150 giây khởi động, liveness nhẹ chỉ kiểm tra process còn sống với {{timeoutSeconds: 3}} và {{failureThreshold: 6}}, readiness riêng cho traffic. Kết quả: pod không còn restart, ứng dụng nhận traffic sau khi sẵn sàng thật.

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

### Ví dụ đời thực
Rolling deploy service thanh toán (10 pod): mỗi lần deploy, client nhận 200–400 lỗi 502/503 và "connection reset" trong 1–2 phút. Điều tra: access log ingress cho thấy 502 tới IP của pod cũ sau khi pod đã nhận SIGTERM; log pod cũ tắt trong dưới 1 giây sau SIGTERM, không chờ request đang chạy. Nguyên nhân gốc: Kubernetes gửi SIGTERM và gỡ endpoint song song, ingress cần vài giây cập nhật nên vẫn đổ traffic vào JVM đang tắt. Sửa: preStop sleep 10 giây chờ endpoint bị gỡ, {{server.shutdown: graceful}} chờ request chạy xong, {{terminationGracePeriodSeconds: 60}}, {{maxUnavailable: 0}}. Kết quả: 0 lỗi 5xx trong cửa sổ deploy, team tự tin deploy giữa giờ hành chính.

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

### Ví dụ đời thực
HPA service catalog dao động 4 → 12 → 4 cứ 6–7 phút khi traffic phẳng. Điều tra: {{kubectl describe hpa}} sự kiện "cpu resource utilization above target" rồi "All metrics below target"; pod mới dùng 1.5–2 core trong 30–60 giây đầu (class loading, JIT, warm-up), tức 300–400% so với request 500m. Nguyên nhân gốc: CPU khởi động của pod mới kéo trung bình lên, HPA scale up; vài phút sau CPU về thấp, hết cửa sổ ổn định 5 phút thì scale down, lặp lại. Sửa: {{behavior}} stabilization 60 giây khi tăng, 600 giây khi giảm, giới hạn +50% mỗi phút; đặt CPU request theo p95 thực tế; readiness chỉ UP sau warm-up. Kết quả: replica ổn định ở 6–8, không còn dao động, latency không còn tăng do pod chưa warm.

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

### Ví dụ đời thực
Tình huống: service pricing chạy trên node 8 core, pod limit 1 core, request 500m, Tomcat với nhiều thread xử lý đồng thời. Triệu chứng: p99 latency tăng từ 80ms lên 600ms khi traffic nhẹ nhàng tăng, trong khi trung bình CPU theo phút chỉ 35%. Điều tra: lệnh {{kubectl top pod pricing-abc}} thấy CPU thấp; vào container chạy {{cat /sys/fs/cgroup/cpu.stat}} (cgroup v2), {{nr_throttled}} tăng nhanh so với {{nr_periods}}, tỉ lệ khoảng 45%; log GC cho thấy pause "Pause Young" 120–250ms. Nguyên nhân gốc: CFS quota 100ms mỗi chu kỳ 100ms, 4 thread chạy song song trên 4 core tiêu hết 100ms sau 25ms, tất cả thread bị đóng băng 75ms; JVM thấy chỉ 1 CPU nên chọn Serial GC, pause GC dài thêm. Cách xử lý: bỏ CPU limit, giữ request theo mức sử dụng thực (khoảng 1 core), chỉ định {{-XX:+UseG1GC}} và {{-XX:ActiveProcessorCount=2}}. Kết quả: tỉ lệ chu kỳ bị throttle gần 0, p99 giảm từ 600ms xuống khoảng 90–100ms mà không đổi code ứng dụng.

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

### Ví dụ đời thực
Tình huống: nhóm consumer {{invoice-sync}} (6 instance, topic 12 partition) xử lý hóa đơn, mỗi message gọi API bên ngoài 0,5–1 giây. Triệu chứng: vài phút lại rebalance một lần, lag nhảy từ 0 lên 2 triệu, log đầy {{CommitFailedException}}. Điều tra: chạy {{kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group invoice-sync}}, cột CONSUMER-ID thay liên tục, LAG tăng theo bậc thang; log consumer có dòng "consumer poll timeout has expired". Nguyên nhân gốc: mỗi {{poll()}} lấy tối đa 500 bản ghi, xử lý 500 × 1 giây = 500 giây, vượt mặc định {{max.poll.interval.ms}} là 300 giây, client tự rời nhóm, coordinator rebalance, offset của lô không commit được và lô bị giao lại từ đầu, tạo vòng lặp. Cách xử lý: giảm {{max.poll.records}} xuống 50 (xử lý 50 giây, xa dưới 300 giây), đặt timeout API ngoài (connect 2 giây, đọc 5 giây) kèm circuit breaker, tăng concurrency listener lên số partition (12), gắn idempotency key là invoiceId cho gọi API, dùng CooperativeStickyAssignor và static membership. Kết quả: số rebalance từ 15–20 lần/giờ xuống gần 0, lag về 0, API bên ngoài không bị gọi trùng nữa.

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

### Ví dụ đời thực
Tình huống: topic {{orders}}, partition 3 đứng yên ở offset 18.234 trong 2 giờ, lag nhảy lên 400 nghìn, các partition khác bình thường. Log consumer lặp lại cùng lỗi parse JSON mỗi giây. Điều tra: chạy {{kafka-consumer-groups.sh --bootstrap-server kafka:9092 --describe --group order-svc}} thấy chỉ partition 3 CURRENT-OFFSET không nhích; đọc đúng message bằng {{kafka-console-consumer.sh --bootstrap-server kafka:9092 --topic orders --partition 3 --offset 18234 --max-messages 1}} thấy payload bị cắt, trường {{amount}} gửi dưới dạng chuỗi "1,000" thay vì số. Nguyên nhân gốc: lỗi deserialize xảy ra trong {{poll()}} trước khi đến listener, nên listener bắt không được; offset không commit, lần poll sau lại đọc 18234, Kafka không cho nhảy cóc trong partition nên 18235… bị kẹt theo. Cách xử lý: bọc deserializer bằng {{ErrorHandlingDeserializer}}, {{DefaultErrorHandler}} retry tối đa 3 lần cách nhau 1 giây rồi đẩy sang {{orders.DLT}} bằng {{DeadLetterPublishingRecoverer}}, đánh dấu lỗi dữ liệu ({{ConstraintViolationException}}) là không retry; topic DLT phải có số partition bằng topic gốc. Nếu khẩn cấp: dừng group, lưu nội dung message hỏng, rồi dùng {{kafka-consumer-groups.sh --reset-offsets --to-offset 18235 --topic orders:3 --group order-svc --execute}} để bỏ qua chính xác một message. Kết quả: partition 3 chuyển động trở lại, lag giảm dần, message hỏng cô lập ở DLT để xem và replay sau khi sửa.

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

### Ví dụ đời thực
Tình huống: topic {{payment-events}} lag tăng đều mỗi giờ cao điểm (từ 0 lên 700 nghìn), tối về 0, tuần sau đỉnh cao hơn; không lỗi, không rebalance. Team đề xuất thêm pod consumer. Điều tra: producer giờ cao điểm 800 msg/s; topic 12 partition, group có 12 consumer thread (concurrency 4 × 3 pod); thời gian xử lý trung bình mỗi message 20ms (đọc 1 bản ghi, ghi 2 bản ghi, mỗi câu một vòng đi về DB). Năng lực group: 12 × (1000/20) = 600 msg/s, thiếu 200 msg/s đúng bằng tốc độ lag tăng. Chạy {{kafka-consumer-groups.sh --describe}} thấy lag phân bố trên mọi partition (không dồn 1–2 partition nên không phải key nóng); latency DB trong giờ cao điểm 85% CPU. Nguyên nhân gốc: vào lớn hơn ra, thêm pod khi consumer đã bằng số partition không tăng throughput. Cách xử lý theo thứ tự rẻ: gom 3 câu SQL thành 1 batch (20ms xuống khoảng 8ms, khoảng 1.500 msg/s), dùng batch listener 100 record, sau cùng mới tăng partition 12 lên 24 (lưu ý đổi mapping key). Kết quả: năng lực xử lý gấp hai đỉnh hiện tại, lag trong giờ cao điểm về 0 trong vài phút, đặt alert theo thời gian chờ (message cũ nhất > 5 phút) thay vì số lượng cố định.

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

### Ví dụ đời thực
Tình huống: công ty có 40 service chạy Java 8 và Java 11, lên Java 21 trong 2 quý để kịp hạn hỗ trợ và chuẩn bị Spring Boot 3. Điều tra: chạy {{jdeps --jdk-internals --multi-release 21 -cp 'libs/*' app.jar}} liệt kê dùng {{sun.misc}}, {{sun.security}}; chạy {{jdeprscan --release 21 app.jar}} liệt kê API bị gỡ; kiểm tra flag JVM trong Dockerfile/Helm. Nguyên nhân hay gặp: JAXB bị gỡ từ Java 11 gây {{NoClassDefFoundError: javax/xml/bind/...}}; strong encapsulation từ Java 16 chặn reflection nội bộ JDK gây {{InaccessibleObjectException}}; thư viện bytecode cũ (Lombok, Mockito, ByteBuddy, ASM, JaCoCo) lỗi biên dịch; flag GC cũ như {{-XX:+PrintGCDateStamps}} khiến JVM không khởi động; charset UTF-8 mặc định từ Java 18 làm sai dấu đọc/ghi file trên Windows. Cách xử lý: hai bước — chạy JAR cũ trên JDK 21 trước, rồi mới biên dịch với {{--release 21}}; thêm Jakarta XML Binding, nâng thư viện bytecode, đổi flag JVM sang {{-Xlog:gc*}}, chỉ định charset tường minh khi đọc/ghi file. Chọn 2–3 service ít rủi ro làm bản thước, canary 5% rồi 100%, so sánh p99, GC pause, RSS trước/sau, rollback nếu lỗi tăng > X% trong 30 phút. Kết quả: nâng cấp 40 service trong 2 quý không có sự cố production; hơn nửa lỗi từ agent APM và flag JVM trong Helm, không phải code Java.

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

### Ví dụ đời thực
Tình huống: monolith Spring Boot 2.7 (Hibernate 5, Spring Security 5, Sleuth) nâng lên Spring Boot 3. Build đầu hơn 800 lỗi biên dịch; sau khi sửa, staging bị 404 lạ, ID trùng, mất trace. Điều tra: chạy recipe OpenRewrite nâng Boot 3 đổi namespace và API phổ biến; thêm tạm {{spring-boot-properties-migrator}} để tìm property đổi tên. Nguyên nhân: Spring MVC 6 tắt khớp dấu gạch chéo cuối URL nên {{GET /orders/}} trả 404; Hibernate 6 đổi đặt tên sequence (mỗi entity sequence riêng thay cho {{hibernate_sequence}} dùng chung) dẫn trùng khoá chính hoặc thiếu sequence; Sleuth không hỗ trợ Boot 3 nên traceId mất; springfox cũ không tương thích, thay bằng springdoc-openapi bản 2.x. Cách xử lý: lên 2.7.x mới nhất sửa hết deprecation trước, lên Java 17/21, chạy OpenRewrite, dùng properties migrator tạm rồi gỡ, không find-replace mù toàn bộ {{javax.}} (gói JDK như {{javax.sql.DataSource}}, {{javax.crypto}}, {{javax.net.ssl}} giữ nguyên), Spring Security 6 chuyển sang bean {{SecurityFilterChain}} thay {{WebSecurityConfigurerAdapter}}, khai báo sequence tường minh và kiểm tra {{allocationSize}} khớp INCREMENT trong DB, thay Sleuth bằng Micrometer Tracing. Xác minh: replay request production vào hai bản so sánh status và body, bật {{spring.jpa.hibernate.ddl-auto=validate}} trên staging, so sánh số câu SQL mỗi request. Kết quả: staging không còn 404 do dấu "/" cuối, ID không trùng, trace nối giữa service, canary 5% với tiêu chí rollback rõ.

> Senior tip: hãy lập **checklist thay đổi hành vi** từ migration guide chính thức trước khi viết dòng code nào, và gán mỗi mục một cách kiểm chứng tự động. Ở một dự án, chỉ riêng việc replay 50 nghìn request thật vào staging đã bắt được 3 endpoint 404 do dấu "/" cuối URL từ app mobile cũ, những lỗi mà unit test không bao giờ thấy.`,
  follow: [
    'Bạn xử lý thế nào khi một thư viện nội bộ vẫn phụ thuộc {{javax.servlet}}?',
    'Làm sao để DB migration tương thích với cả bản Boot 2 và Boot 3 trong lúc canary?',
    'Hibernate 6 đổi chiến lược sequence ảnh hưởng gì tới {{allocationSize}}?'
  ],
  tags: ['Spring Boot 3', 'migration', 'Jakarta EE', 'Hibernate 6', 'Spring Security 6', 'Micrometer Tracing'],
  refs: [
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

### Ví dụ đời thực
Tháng 3/2024, team mobile phát hành bản 4.1. Backend release ngày 10/3 đổi field {{fullName}} → {{name}} và thêm enum {{PARTIALLY_SHIPPED}}. App bản 3.2 (chiếm 28% DAU) crash rate nhảy từ 0,08% lên 14% trong 5 phút. Crashlytics: {{JsonDataException: Required value 'fullName' missing}}. Backend không rollback được vì migration DB đã chạy. Hotfix: thêm {{X-App-Version}} header, trong controller map {{PARTIALLY_SHIPPED}} → {{SHIPPING}} cho version ≤ 3.2. Crash rate giảm về 0,1% sau 12 phút. Dự án sau: contract test (Pact) cho mọi bản app > 1% traffic, dashboard theo dõi % request theo version, gate PR: không merge nếu phá hợp đồng bản cũ. Kết quả: 6 tháng sau không còn sự cố breaking change nào.

### Trả lời mẫu khi phỏng vấn
"Khi crash rate app cũ nhảy vọt sau release backend, việc đầu tiên tôi làm là xác nhận tương quan qua Crashlytics và log API theo version. Backend là bên duy nhất hotfix được trong vài phút, nên tôi trả thêm field cũ {{fullName}} và map enum mới về giá trị cũ dựa trên header version của app. Crash rate giảm từ 14% về mức nền trong 12 phút. Sau đó tôi thiết lập quy trình expand–contract: chỉ thêm field mới, giữ field cũ cho đến khi traffic bản cũ dưới 1–2%, client đọc tolerant (bỏ qua field lạ, enum lạ thành UNKNOWN), contract test cho mọi bản app còn đáng kể, và versioning khi buộc phải phá vỡ. Điều quan trọng nhất là coi mỗi bản app như một khách hàng riêng không bao giờ biến mất."

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

### Ví dụ đời thực
Tháng 11/2023, service order lên Java 21 + Spring Boot 3.2, bật {{spring.threads.virtual.enabled=true}}. Trước: Tomcat 200 thread, p99 180ms. Sau deploy: p99 250ms, mỗi vài tiếng treo 30s rồi tự hồi phục. HikariCP báo {{hikaricp_connections_pending}} vọt 3.000, 4 pod 4 core (4 carrier thread). JFR {{jdk.VirtualThreadPinned}} cho thấy 4 carrier đều kẹt trong {{synchronized(cache)}} đang gọi {{priceClient.fetch()}} (HTTP client bên trong synchronized). Semaphore 40 permit + {{ReentrantLock}} thay {{synchronized}} → p99 190ms, không còn treo. Nâng Spring Boot 3.3 (thư viện đã sửa pinning) + JDK 21.0.2 → ổn định hoàn toàn.

### Trả lời mẫu khi phỏng vấn
"Khi bật virtual thread, Tomcat không còn giới hạn 200 thread nên hàng nghìn request cùng tranh 20 connection Hikari → timeout. Việc treo hẳn là do pinning trên Java 21: virtual thread chặn trong synchronized không unmount được, giữ chặt carrier thread. Với 4 core chỉ có 4 carrier, 4 request cùng pin là cả service đứng. Tôi chẩn đoán bằng JFR event VirtualThreadPinned và thread dump JSON. Giải pháp: Semaphore giới hạn đồng thời theo sức chứa DB (40 permit), đổi synchronized quanh I/O sang ReentrantLock để cho unmount, nâng thư viện, và lên JDK 24 nếu có thể vì JEP 491 bỏ pinning do synchronized. Quan trọng: virtual thread tháo giới hạn ngầm của thread pool cũ, nên phải thêm backpressure tường minh ở tài nguyên khan hiếm."

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

### Ví dụ đời thực
Tháng 6/2023, 22h thứ 7: login {{/api/auth/login}} tăng từ 50 → 3.200 req/s, 98% trả 401, CPU pod auth 95%. Sáng chủ nhật 40 khách báo số điện thoại bị đổi. Log: 3.100 username khác nhau, 28.000 IP (residential proxy), mỗi IP 1–2 request, success rate 0,8%. Bcrypt cost 12: 3.000 × 120ms = 360 core → tự DoS. Xử lý: 1) WAF rate-based + Bot Control challenge login toàn bộ. 2) Redis pre-check trước bcrypt: đếm IP + HyperLogLog đếm user khác nhau/IP, >20 req/IP hoặc >5 user/IP → challenge. 3) Lọc login thành công từ IP/ASN proxy, revoke session, force reset password, khoá đổi SĐT 24h. Kết quả: tấn công chặn được, 12 tài khoản bị chiếm khôi phục, 0 tài khoản bị đổi SĐT sau đó. Dài hạn: MFA (passkey), Pwned Passwords k-anonymity, step-up cho thao tác nhạy cảm.

### Trả lời mẫu khi phỏng vấn
"Tấn công này là credential stuffing: kẻ dùng danh sách email/mật khẩu bị lộ từ site khác, mỗi tài khoản chỉ thử 1 lần, xoay hàng chục nghìn IP proxy. Brute force thì thử nhiều lần một tài khoản. Tôi nhận ra ngay vì username gần như không lặp, success rate ~1%. Việc đầu tiên: bật WAF rate-based rule và Bot Control challenge cho login, chặn ở biên. Trong app, thêm Redis pre-check trước bcrypt: đếm request/IP và HyperLogLog đếm user khác nhau/IP, vượt ngưỡng thì trả challenge (429/CAPTCHA) không gọi bcrypt — vì 3.000 bcrypt/s đã tự gây DoS CPU. Song song lọc các login thành công từ IP proxy đáng ngờ, thu hồi session, buộc reset mật khẩu, khoá đổi số điện thoại 24h. Dài hạn: MFA ưu tiên passkey, kiểm tra Pwned Passwords khi đăng ký, step-up authentication cho thao tác nhạy cảm."

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

### Ví dụ đời thực
Tháng 8/2023, tính năng "đổi avatar bằng URL" cho phép user nhập link ảnh. Pentester báo: nhập {{http://169.254.169.254/latest/meta-data/iam/security-credentials/}} trả về tên IAM role {{ecs-task-role-payment}}. Instance chạy IMDSv1 ({{HttpTokens=optional}}). CloudTrail: không có API call lạ từ IP ngoài (phát hiện sớm). Xử lý: 1) Tắt tính năng ngay. 2) Bật IMDSv2 {{required}} + hop limit 1 qua AWS CLI. 3) Code fix: chỉ cho https, resolve DNS → kiểm tra mọi IP (loopback, link-local 169.254.0.0/16, site-local, unique-local fc00::/7, 100.64.0.0/10), không follow redirect, timeout 3s, limit 5MB, decode ảnh rồi mới lưu. 4) Vì DNS rebinding, bắt request đi qua egress proxy Squid allowlist chỉ IP công khai. 5) Thay thiết kế: client upload thẳng S3 qua presigned URL, server không bao giờ fetch URL ngoài. Kết quả: pentest lại không bypass được, không rủi ro metadata leak.

### Trả lời mẫu khi phỏng vấn
"Đây là SSRF mức cao vì trên EC2 với IMDSv1, bước tiếp theo kẻ tấn công lấy được access key tạm thời của IAM role. Tôi xử lý theo 4 lớp: ngay lập tức tắt tính năng, bật IMDSv2 bắt buộc (yêu cầu PUT lấy token rồi đính header) và hop limit 1 để container không truy cập metadata. Lớp code: chỉ chấp nhận https, phân giải DNS rồi chặn mọi IP nội bộ (loopback, link-local 169.254.x, site-local, IPv6 unique-local fc00::/7, carrier-grade NAT 100.64.0.0/10), không follow redirect, timeout 3s, limit 5MB, decode thử ảnh. Lớp mạng: vì DNS rebinding (DNS trả IP công khai lúc check, IP nội bộ lúc connect), tôi bắt mọi request ra ngoài đi qua egress proxy có allowlist IP công khai. Lớp thiết kế: nếu được, đổi sang client upload thẳng S3 qua presigned URL — server không bao giờ gọi URL lạ. Kết hợp 4 lớp này mới chắc chắn."

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

### Ví dụ đời thực
Tháng 1/2024, GitHub secret scanning cảnh báo AWS access key {{AKIA...}} trong {{application-dev.yml}} commit 3 tuần trước. Dev đã commit xoá dòng đó. Xử lý: 1) 5 phút đầu: AWS Console → IAM → deactivate key cũ, tạo key mới, cập nhật ECS task environment, deploy rolling. 2) CloudTrail lọc {{AccessKeyId=AKIA...}}: 0 API call lạ (may mắn chưa bị dùng). 3) Dọn lịch sử: {{git clone --mirror}}, {{git filter-repo --replace-text replacements.txt}} (chứa {{AKIA...==>***REMOVED***}}), {{git push --force --mirror}}. 4) Yêu cầu 12 dev clone lại, 3 PR đóng mở lại. 5) GitHub Support ticket xoá cache PR cũ. 6) Bật push protection, cài pre-commit {{gitleaks}}, migration sang AWS Secrets Manager + IRSA cho EKS. Kết quả: 0 rủi ro sau 24h, quy trình chặn tái phát áp dụng cho 35 repo.

### Trả lời mẫu khi phỏng vấn
"Commit xoá chỉ làm key biến mất khỏi HEAD; lịch sử Git, mọi clone, fork, PR cũ và CI cache vẫn giữ nguyên key. Bot quét GitHub tìm AWS key chạy liên tục, 3 tuần là quá đủ để bị khai thác. Vì vậy thứ tự đúng là: Bước 1: xoay key ngay trong IAM — deactivate key cũ, tạo key mới, cập nhật env, deploy. Bước 2: tra CloudTrail xem key đã bị dùng chưa (tạo EC2, đọc S3...). Bước 3: dọn lịch sử bằng git filter-repo hoặc BFG trên mirror clone, force push, yêu cầu team clone lại, nhờ GitHub Support xoá cache PR cũ. Bước 4: bật push protection trên GitHub, pre-commit hook gitleaks, và quan trọng nhất: chuyển hẳn sang IAM role (IRSA/EKS Pod Identity) và Secrets Manager để không còn access key dài hạn nào trong code. Mục tiêu không phải là dọn lịch sử sạch, là không có secret để lộ."

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

### Ví dụ đời thực
Tháng 12/2021, CVE-2021-44228 (Log4Shell) công bố, CVSS 10, mã khai thác công khai. Công ty có 38 service Java, không ai chắc dùng log4j-core hay không. Điều phối viên chia làm hai nhóm: nhóm A chạy {{mvn dependency:tree -Dincludes=org.apache.logging.log4j}} trên 38 repo và {{trivy image}} trên registry, nhóm B theo dõi WAF log. Kết quả: 6 service dùng log4j-core qua spring-boot-starter-log4j2, 2 service shade log4j vào jar riêng, 4 service chỉ có log4j-to-slf4j (không lỗi). WAF chặn mẫu jndi:ldap:// từ sáng hôm sau. Xử lý: gỡ {{JndiLookup.class}} khỏi jar, ghi đè {{log4j2.version=2.17.1}} trong BOM, rebuild, xác minh bằng {{unzip -l app.jar | grep log4j-core}}. 48 giờ sau 8 service đã vá. Áp SBOM vào mọi build và quét dependency trong CI; CVE sau kiểm kê trong 30 phút thay vì 4 tiếng.

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

### Ví dụ đời thực
Triệu chứng: hoá đơn AWS tháng 4 là 36.000 USD (tháng trước 12.000 USD) trong khi request chỉ tăng khoảng 15%. CFO yêu cầu giải trình trong 2 ngày.
Điều tra: mở Cost Explorer, granularity Daily, group by Service thấy EC2-Other tăng mạnh từ ngày 8 (từ ~120 USD/ngày lên ~420 USD/ngày). Group by Usage type trong EC2-Other cho thấy {{NatGateway-Bytes}} ~200 TB và {{DataTransfer-Regional-Bytes}} tăng. Song song CloudWatch {{DataProcessing-Bytes}} tăng rõ. Đối chiếu lịch deploy ngày 8: service ảnh tải ảnh gốc từ S3 để resize và deploy có bật log DEBUG cho luồng upload.
Nguyên nhân gốc: (1) tải ảnh S3 đi qua NAT Gateway (~200 TB x 0,045 USD/GB) vì subnet private chưa có S3 Gateway VPC Endpoint; (2) log DEBUG sinh khoảng 15 TB ingestion; (3) consumer đọc chéo AZ tăng transfer nội vùng.
Cách xử lý: tạo S3 Gateway VPC Endpoint và cập nhật route table; hạ log về INFO, bật sampling request thành công, đặt retention 14 ngày; cấu hình ứng dụng ưu tiên endpoint cùng AZ (AZ affinity) để giảm cross-AZ transfer; dọn EBS unattached và snapshot cũ.
Kết quả đo được: sau 10 ngày, NatGateway-Bytes giảm hơn 95%, CloudWatch ingestion giảm ~80%, hoá đơn ước tính cuối tháng giảm còn ~14.500 USD. Bật AWS Budgets và Cost Anomaly Detection để cảnh báo trong 24 giờ nếu usage type tăng bất thường.

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

### Ví dụ đời thực
Triệu chứng: pipeline CI của service order đỏ ~25% (khoảng 20/80 build mỗi tuần), bấm "Re-run" thường xanh. Một tuần trước, bug tính phí thực bị merge vì người review nghĩ "lại flaky".
Điều tra: bật {{mvn test -Dsurefire.rerunFailingTestsCount=2}} và tổng hợp JUnit XML 2 tuần, thấy {{OrderServiceTest.shouldExpireAtMidnight}} fail 12 lần và {{OrderAsyncTest.shouldMarkPaid}} fail 9 lần. Chạy lặp {{OrderServiceTest}} 50 lần thấy fail ~8% vào khoảng cuối ngày; chạy {{mvn test -Dsurefire.runOrder=random}} thấy {{OrderAsyncTest}} fail khi chạy sau test khác ghi cùng bảng DB.
Nguyên nhân gốc: (1) test dùng {{LocalDate.now()}} và so sánh ngày hết hạn nên lệch khi chạy sát mốc 00:00 theo timezone CI; (2) test async dùng {{Thread.sleep(500)}} trong khi publish event trên CI chậm có lúc 1,2 giây; (3) dữ liệu DB không được dọn giữa test nên trạng thái rò rỉ.
Cách xử lý: inject {{Clock}} và dùng {{Clock.fixed(...)}} trong test; thay sleep bằng Awaitility {{await().atMost(Duration.ofSeconds(5)).untilAsserted(...)}}; dọn bảng liên quan trong {{@BeforeEach}} và dùng dữ liệu riêng cho mỗi test. Test chưa sửa kịp được gắn {{@Tag("quarantine")}} có ticket, owner và hạn 2 tuần.
Kết quả đo được: sau 1 sprint, tỉ lệ build đỏ do flaky giảm từ ~25% xuống ~2%, thời gian trung bình chờ merge giảm ~18 phút/build, và không còn bug thật bị bỏ qua vì "quen re-run".

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

### Ví dụ đời thực
Triệu chứng: đội on-call nhận ~300 alert/tuần, >90% không cần làm gì, nhiều người tắt thông báo ban đêm. Tuần trước, API thanh toán lỗi 40 phút nhưng không ai phản ứng vì alert thật chìm giữa alert rác.
Điều tra: xuất lịch sử alert 4 tuần từ Alertmanager/Prometheus. "CPU > 80%" kêu 85 lần/tuần, 0 lần hành động; "Pod restart" 60 lần/tuần nhưng đa số tự hồi phục; "Disk > 70%" kêu sớm nhưng không dự báo tốc độ đầy. Alert "Payment error rate" kêu 2 lần và cả 2 lần đều cần xử lý nhưng bị trôi trong kênh chung.
Nguyên nhân gốc: alert tập trung vào nguyên nhân hạ tầng (CPU, heap, restart) thay vì triệu chứng người dùng; ngưỡng tĩnh không có cửa sổ thời gian; thiếu gom nhóm/inhibit nên một sự cố sinh hàng chục thông báo; page không có runbook rõ.
Cách xử lý: xoá/hạ cấp alert không hành động được (CPU cao thành dashboard), đổi disk alert sang dự báo đầy trong 4 giờ bằng {{predict_linear}}; tạo alert SLO burn rate cho payment (page khi burn rate > 14,4 trong 1h và 5m); cấu hình {{group_by}} và {{inhibit_rules}} trong Alertmanager; thêm {{runbook_url}} cho mọi page; review alert mỗi tuần.
Kết quả đo được: sau 6 tuần, số page giảm từ ~300 xuống ~18/tuần, tỉ lệ page có hành động tăng lên ~92%, và sự cố lỗi thanh toán mô phỏng 30% được phát hiện trong ~4 phút thay vì bị bỏ lỡ.

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

### Ví dụ đời thực
Triệu chứng: 02:00 sáng, service report trên VM báo {{java.io.IOException: No space left on device}}, không ghi được file tạm và trả lỗi cho request. On-call đã {{rm}} file log 40 GB nhưng {{df -h}} vẫn 100%.
Điều tra: {{df -h}} cho thấy {{/var}} đầy; {{df -i}} còn inode; {{lsof +L1}} hiện {{java (pid 4121)}} giữ {{/var/log/report/app.log (deleted)}} khoảng 40 GB. Đọc cuối log (qua fd hoặc bản rotate gần nhất) thấy stack trace lỗi kết nối DB lặp ~3.000 dòng/giây do retry không backoff. Kiểm tra cấu hình Logback: có {{max-history}} nhưng {{total-size-cap}} để mặc định (0, không giới hạn).
Nguyên nhân gốc: vòng retry lỗi DB in full stack trace liên tục + rolling policy không giới hạn tổng dung lượng + {{rm}} file đang mở nên dung lượng không được trả lại.
Cách xử lý: giải phóng ngay bằng {{: > /proc/4121/fd/7}}, xác nhận {{df -h}} giảm xuống ~55%; restart service để chắc chắn trạng thái sạch. Sau đó cấu hình {{max-file-size: 100MB}}, {{max-history: 7}}, {{total-size-cap: 2GB}} trong Spring Boot, thêm backoff cho retry và giảm log trùng lặp. Đặt alert "đầy trong 4 giờ" bằng {{predict_linear}} trên metric filesystem.
Kết quả đo được: dung lượng {{/var}} ổn định dưới 60% trong các tuần tiếp theo, không còn sự cố đầy đĩa ban đêm; khi DB lỗi thử nghiệm, log tăng nhưng bị chặn trong giới hạn 2 GB thay vì phình vô hạn.

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

### Ví dụ đời thực
Triệu chứng: 20:00 thứ Sáu, tỉ lệ thanh toán thành công giảm từ 99% xuống 60%. Trong 15 phút có 9 kỹ sư vào kênh, mỗi người debug một hướng; một người restart DB replica không báo ai; CSKH không biết trả lời khách; CEO nhắn riêng hỏi.
Điều tra/điều phối: tôi nhận vai IC, tuyên bố SEV1, tạo kênh #inc-0412-payment và gọi điện cầu nối. Giao Nam lead kỹ thuật, Lan phụ trách comms, Huy ghi timeline. Tôi yêu cầu dừng thay đổi tự phát và chỉ làm thao tác được Nam đồng ý trong kênh. Timeline cho thấy deploy payment-service 19:40; metric lỗi tăng từ 19:52; restart replica lúc 20:05 không cải thiện.
Nguyên nhân gốc (xác định sau): thay đổi cấu hình timeout trong bản deploy 19:40 làm request sang đối tác hết hạn sớm và retry dồn. Trong lúc sự cố, ưu tiên giảm tác động thay vì chứng minh nguyên nhân.
Cách xử lý: 20:31 rollback payment-service về bản 3.18 (chưa hồi phục đủ vì đối tác đang nghẽn), 20:44 chuyển 50% traffic sang đối tác dự phòng, 20:58 chuyển 100%. Lan cập nhật CSKH/status page mỗi 30 phút theo mẫu. 21:20 tỉ lệ thành công về 98,8% và ổn định.
Kết quả đo được: tác động giảm còn ~28 phút ở mức lỗi nặng sau khi có IC và quyết định rollback/chuyển traffic; không có thay đổi xung đột thêm; đối soát giao dịch dở dang hoàn tất trong đêm. Postmortem họp sau 2 ngày với action item có owner.

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

### Ví dụ đời thực
Triệu chứng: 10:02 sáng, deploy chạy migration {{CREATE INDEX}} trên bảng {{orders}} (80 triệu dòng). Từ 10:05 không tạo được đơn hàng, checkout lỗi tăng vọt trong 40 phút. Trưởng phòng yêu cầu ghi tên người chạy migration trong postmortem.
Điều tra: timeline cho thấy 09:58 merge PR #1842, 10:02 Flyway chạy khi deploy, 10:05 alert lỗi tạo đơn, 10:21 phát hiện khoá ghi trên {{orders}}, 10:43 index tạo xong và hệ thống hồi phục. Kiểm tra DB thấy câu lệnh {{CREATE INDEX}} không dùng {{CONCURRENTLY}} và không đặt {{lock_timeout}}. Trên staging (50 nghìn dòng) migration chạy ~1 giây nên reviewer không thấy rủi ro.
Nguyên nhân gốc: DDL tạo index thông thường chặn ghi trên bảng lớn; migration chạy tự động vào giờ cao điểm.
Yếu tố góp phần: CI không lint migration nguy hiểm, thiếu {{lock_timeout}} (nếu có thể fail nhanh sau 5 giây), thiếu checklist review về khoá bảng, và kiến thức DDL lock chỉ nằm ở vài người.
Cách xử lý: sau sự cố thêm rule CI chặn {{CREATE INDEX}} không {{CONCURRENTLY}} trên bảng lớn, đặt {{SET lock_timeout = '5s'}} cho user migration, tách migration nguy hiểm chạy ngoài giờ cao điểm, và cập nhật tài liệu/chạy hướng dẫn cho team.
Kết quả đo được: ~3.100 đơn thất bại được đối soát và xử lý; trong 2 quý tiếp theo, 3 migration nguy hiểm bị CI chặn trước khi merge và không còn sự cố khoá bảng production tương tự.

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

### Ví dụ đời thực
Một team ngân hàng digital tranh luận 2 tuần về luồng hoàn tiền: một bên muốn mỗi đơn hoàn tiền là một sự kiện trên Kafka (hệ thống nhiều máy truyền sự kiện giữa các dịch vụ), bên kia muốn gọi API đối tác đồng bộ và ghi vào bảng outbox (bảng chứa sự kiện cần gửi sau khi lưu dữ liệu). PR bị comment hơn 40 lần, hai luồng hoàn tiền đang chờ triển khai.

Triệu chứng: đơn hoàn tiền từ khách hàng mất hơn 24 giờ mới về số dư, và trong 1 tháng có ít nhất 3 đơn "biến mất" giữa hệ thống bán hàng và hệ thống chủ sở hữu tài khoản.

Điều tra: kiểm tra log dịch vụ hoàn tiền, thấy mỗi đơn gửi đi 2–3 lần vì không có khóa duy nhất (mã duy nhất chặn xử lý lặp); bảng outbox trống do chưa thiết kế; Kafka cluster chưa có trong team nên không ai biết vận hành (consumer là chương trình tiêu thụ sự kiện).

Nguyên nhân gốc: hai bên tối ưu tiêu chí khác nhau — bên A quan trọng "các team khác nghe sự kiện", bên B quan trọng "khách thấy kết quả ngay và không mất tiền". Không có tiêu chí thống nhất nên tranh luận vô tận.

Cách xử lý: lead dừng tranh luận trên PR, hẹn họp 45 phút, yêu cầu mỗi bên viết tiêu chí và trọng số trước. Sau khi chấm, chọn REST + outbox vì Correctness (không mất/trùng) trọng số cao nhất và team chưa vận hành Kafka. Ghi ADR (tài liệu quyết định kiến trúc) kèm điều kiện xem xét lại khi có thêm 3 consumer cần sự kiện hoàn tiền.

Kết quả: sau khi triển khai, hoàn tiền xử lý trong vòng 5 phút, 0 đơn biến mất trong 3 tháng sau, và team đã có tài liệu vận hành outbox để mở rộng sau.

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

### Ví dụ đời thực
Team 5 người còn 4 tuần ra mắt tính năng vay trả góp theo cam kết với ngân hàng đối tác, nhưng chỉ xong gần 60%; theo tốc độ thực tế còn cần khoảng 10 tuần. PM đề nghị cả team làm thêm giờ đến cuối tháng.

Triệu chứng: sprint gần nhất chỉ hoàn thành 18 điểm, còn lại khoảng 100 điểm cần làm; nếu tiếp tục như cũ, tính năng sẽ trễ ít nhất 4 tuần, vỡ cam kết đối tác và phí quảng cáo đã bỏ tiền ra.

Điều tra: theo dõi velocity (tốc độ làm việc) 4 sprint cuối (18, 22, 19, 21 điểm/2 tuần ≈ 20 điểm), liệt kê scope và phân loại MoSCoW (Must/Should/Could/Won't: phải có/nên có/có được thì tốt/không làm đợt này) cùng PO. Thêm người mới vào giai đoạn cuối theo định luật Brooks (thêm người vào nhóm muộn thường làm chậm hơn vì phải hướng dẫn và phối hợp); làm thêm giờ 2 tuần đầu có thể nhanh 10–20% nhưng sau đó lỗi tăng, người mệt.

Nguyên nhân gốc: scope quá lớn so với thời gian còn lại, và không có phân loại "phải có" versus "có được thì tốt".

Cách xử lý: đề xuất giữ ngày ra mắt, cắt phần Should/Could (trả góp 24 tháng, trang quản trị tự cấu hình) sang đợt 2 sau 4–5 tuần; giữ đăng ký trả góp 3/6/12 tháng, đối soát và audit log (bản ghi hành vi); ẩn phần chưa xong sau feature flag (cờ bật/tắt tính năng); báo định kỳ mỗi tuần.

Kết quả: ra mắt đúng hạn với luồng đăng ký và đối soát đầy đủ; đợt 2 hoàn thành sau 4 tuần; không xảy ra sự cố liên quan tiền trong tuần đầu ra mắt.

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

### Ví dụ đời thực
Một team nhận 2 kỹ sư mới vào monolith (ứng dụng lớn gộp chung một khối) 400 nghìn dòng chạy Spring 4, Java 8, test bao phủ khoảng 15%. Hai người trước đó mất hơn 3 tháng mới có PR đáng kể đầu tiên, một người đã nghỉ.

Triệu chứng: tuần đầu cả hai mất 3 ngày mới chạy được app trên máy cá nhân vì cấu hình rải rác và phụ thuộc vào DB dùng chung; tuần thứ 3 vẫn chưa tự sửa được bug nhỏ vì sợ chạm "vùng nguy hiểm" ít test. Dữ liệu đo: thời gian đến PR đầu tiên trung bình 24 ngày, đến PR thứ 10 là 70 ngày.

Điều tra: hỏi người mới điều gì làm chậm nhất, ghi lại từng chỗ bị kẹt. Phát hiện 3 nguyên nhân gốc: (1) môi trường local không có script dựng một lệnh, phải làm tay nhiều bước; (2) không có bản đồ hệ thống và từ điển nghiệp vụ, nên không biết đọc code từ đâu; (3) buddy không được giảm tải, chỉ hỗ trợ "khi rảnh".

Cách xử lý: chuẩn bị {{docker compose up}} cùng dữ liệu mẫu để ngày đầu chạy được app; vẽ sơ đồ C4 (sơ đồ ngữ cảnh và container của hệ thống) và luồng một request "đặt hàng" từ controller tới DB, kèm từ điển nghiệp vụ; chọn buddy và giảm 25% khối lượng sprint của buddy trong tháng đầu; tuần đầu có PR nhỏ (thêm log/sửa thông báo lỗi) và dạy viết characterization test (test ghi lại hành vi hiện tại trước khi sửa) cho module legacy; người mới sửa tài liệu ngay khi thấy sai.

Kết quả: sau 4 tuần, thời gian đến PR đầu tiên giảm còn 3 ngày, đến PR thứ 10 còn 28 ngày; cả hai tự xử lý được bug nhỏ ở một module và tham gia shadow on-call (trực xử lý sự cố cùng người có kinh nghiệm) ở tuần thứ 6. Tài liệu onboarding được cập nhật 12 chỗ dựa trên ghi chú kẹt của hai người mới.

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

### Ví dụ đời thực
Một PR 4.200 dòng thay đổi logic retry thanh toán, đồng thời refactor package và thêm migration DB. Tác giả muốn merge vào bản phát hành chiều thứ Sáu.

Triệu chứng: reviewer đọc cả ngày vẫn cảm thấy "lướt qua", và team đã từng có sự cố: retry thanh toán (gửi lại yêu cầu khi lỗi) trừ tiền hai lần vì không có khóa duy nhất.

Điều tra: chạy git diff --stat thấy khoảng 3.300 dòng là di chuyển package/đổi tên (rủi ro thấp), chỉ 600 dòng là logic retry (rủi ro cao) và 300 dòng migration (thay đổi cấu trúc bảng dữ liệu) + test. Xem từng vùng theo rủi ro: retry có idempotency key (mã duy nhất chặn xử lý lặp) không? Gọi HTTP bên trong @Transactional (gom thao tác DB thành một đơn vị thành công hết hoặc thất bại hết) không? Migration có khóa bảng lớn và tương thích ngược với code cũ đang chạy trong lúc rolling deploy không?

Nguyên nhân gốc: trộn nhiều loại thay đổi trong một PR làm giảm hiệu quả review; lỗi idempotency dễ bị lọt khi đọc hàng nghìn dòng.

Cách xử lý: đề nghị tách thành PR1 refactor thuần, PR2 migration, PR3 logic retry; PR1 và PR2 có thể lên bản thứ Sáu, PR3 chỉ chạy sau feature flag (cờ bật/tắt tính năng). Chạy test cố ý làm hỏng một dòng quan trọng để kiểm tra test có bắt không. Kết nối payment mới bật cho 5% giao dịch, theo dõi tỉ lệ thành công và số lần retry.

Kết quả: phát hiện thiếu idempotency key trước khi merge, sửa kịp; bản phát hành thứ Sáu không chứa logic tiền rủi ro, và rollback plan (kế hoạch hoán ngược) đã được viết sẵn.

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

### Ví dụ đời thực
Kỹ sư duy nhất hiểu module đối soát thanh toán (chạy batch mỗi đêm, mỗi tháng 2–3 lần lệch số phải xử lý tay) báo nghỉ việc, còn 4 tuần.

Triệu chứng: trước đó khi anh ấy nghỉ phép, một ca lệch số chờ 5 ngày mới xử lý vì không ai biết chạy script hay liên hệ đối tác nào.

Điều tra: kiểm kê mọi thứ module làm: job nào, chạy lúc nào, đọc/ghi bảng nào, gọi đối tác nào, cấu hình ở đâu, quyền truy cập gì. Lịch sử 6 tháng các ca lệch: loại lệch, nguyên nhân, cách xử lý, script đã chạy; xếp hạng 5 loại sự cố hay gặp nhất. Phát hiện cron (lệnh hẹn giờ chạy tự động) chạy trên máy riêng và key SFTP đối tác nằm trong thư mục home của anh ấy.

Nguyên nhân gốc: kiến thức ngầm (biết nhưng không ghi lại) chỉ nằm ở một người (bus factor = 1), và tài sản truy cập không thuộc team.

Cách xử lý: chuyển ngay quyền, key, cron sang tài khoản team tuần 1; chọn hai người nhận (một chính, một phụ). Tuần 2 người cũ làm và nói to, người nhận ghi runbook (hướng dẫn từng bước xử lý sự cố) cho 5 loại lệch; tuần 3 đảo vai (người nhận làm, người cũ chỉ can thiệp khi sắp sai); tuần 4 người nhận tự xử lý, kể cả trực đêm batch, người cũ chỉ dự phòng. Nếu không có ca lệch thật, dựng lại ca trên staging (môi trường mô phỏng) với dữ liệu mẫu.

Kết quả: runbook 5 loại lệch được hoàn thành; người nhận tự xử lý một ca lệch thật độc lập; sau khi kỹ sư nghỉ, module vẫn vận hành ổn định, không có sự cố do thiếu kiến thức.

> Senior tip: thời điểm rẻ nhất để xử lý bus factor là **trước** khi có người nghỉ. Tôi rà định kỳ mỗi quý: module nào chỉ một người từng deploy, từng trực sự cố hoặc từng review? Rồi luân chuyển on-call và review chéo cho đúng những module đó. Câu hỏi "nếu người này nghỉ phép 3 tuần thì sao?" nên có câu trả lời trước khi nó thành "nghỉ việc".`,
  follow: [
    'Bạn đo bus factor của team thế nào bằng dữ liệu có sẵn (Git, on-call)?',
    'Nếu người sắp nghỉ không hợp tác, bạn làm gì?',
    'Runbook tốt cho một ca lệch đối soát gồm những phần nào?'
  ],
  tags: ['lead', 'bus factor', 'knowledge transfer', 'runbook', 'handover', 'risk']
},
{
  id: 'scenario-087',
  topic: 'scenario',
  level: 'senior',
  q: 'Review PR này (code do AI sinh). Đoạn dưới dùng ConcurrentHashMap để đếm lượt truy cập theo userId. Tìm lỗi và cách sửa.\n~~~java\npublic class AccessCounter {\n    private final ConcurrentHashMap<String, Integer> counts = new ConcurrentHashMap<>();\n    public void hit(String userId) {\n        if (!counts.containsKey(userId)) {\n            counts.put(userId, 1);\n        } else {\n            counts.put(userId, counts.get(userId) + 1);\n        }\n    }\n    public int get(String userId) {\n        return counts.getOrDefault(userId, 0);\n    }\n}\n~~~',
  a: `**Tóm tắt:** đoạn code có hai lỗi thật: check-then-act trên ConcurrentHashMap không atomic (hai thread cùng userId có thể ghi đè nhau, mất lượt đếm), và dùng {{Integer}} + {{get+put}} thay vì {{AtomicInteger}}/{{LongAdder}} nên mỗi lần tăng là allocate object mới và vẫn không nguyên tử. Sửa bằng {{merge}} hoặc {{compute}} với {{LongAdder}}; nếu chỉ cần tổng toàn cục thì {{LongAdder}} riêng.

### Lỗi theo mức nghiêm trọng

**1. Critical — mất đếm do race condition (check-then-act).**
Hai thread cùng userId: cả hai thấy {{containsKey == false}} hoặc cùng {{get}} rồi {{put}}, một lượt bị ghi đè. Trên traffic cao, số đếm thấp hơn thực tế — sai silently, khó phát hiện.

**2. Major — dùng Integer immutable + get/put thay vì counter nguyên tử.**
{{counts.get(userId) + 1}} tạo Integer mới mỗi lần; dưới tải cao gây GC pressure. Đồng thời không giải quyết race.

**3. Minor — API get có thể trả null nếu không dùng getOrDefault (đã OK ở đây), và không có snapshot an toàn cho report.**

### Cách sửa
~~~java
public class AccessCounter {
    private final ConcurrentHashMap<String, LongAdder> counts = new ConcurrentHashMap<>();
    public void hit(String userId) {
        counts.computeIfAbsent(userId, k -> new LongAdder()).increment();
    }
    public long get(String userId) {
        LongAdder a = counts.get(userId);
        return a == null ? 0 : a.sum();
    }
}
~~~
{{computeIfAbsent}} + {{LongAdder}}: atomic, contention thấp (LongAdder tách cell theo thread), không allocate per-increment.

### Cách nói khi review
"Logic này chạy đúng single-thread, nhưng production có nhiều thread. Hai chỗ: check-then-act không atomic, và Integer immutable nên mỗi increment allocate. Em đề xuất LongAdder + computeIfAbsent — vừa đúng vừa nhanh. Nếu chỉ cần tổng toàn cục, dùng một LongAdder chung đơn giản hơn."

### Khi nào dùng gì
- Đếm per-key nhiều thread: {{ConcurrentHashMap<String, LongAdder>}}.
- Chỉ tổng toàn cục: một {{LongAdder}}.
- Cần snapshot nhất quán nhiều key: copy map rồi tổng, hoặc dùng {{AtomicLongMap}} (Guava).

### Ví dụ đời thực
Đoạn đếm lượt truy cập kiểu "get rồi put" trên {{ConcurrentHashMap}} được AI sinh và merge vào service thống kê. Dưới 2.000 request/giây, số lượt đếm **thấp hơn** log truy cập khoảng 7% — vì {{ConcurrentHashMap}} chỉ an toàn cho **từng** thao tác, còn chuỗi "đọc → cộng → ghi" vẫn là hai thao tác riêng có thể bị chen giữa. Sửa bằng {{counts.merge(userId, 1L, Long::sum)}} (nguyên tử trên từng key), hoặc {{computeIfAbsent(userId, k -> new LongAdder()).increment()}} khi một key rất nóng (LongAdder chia bộ đếm thành nhiều ô để giảm tranh chấp). Map còn **không bao giờ bị xoá** → với 3 triệu user/ngày, heap tăng dần; chuyển sang Caffeine có hết hạn hoặc đẩy số đếm sang Redis {{INCR}}. Test mới: 16 luồng × 100.000 lần tăng, kiểm tra tổng đúng tuyệt đối.

### Trả lời mẫu khi phỏng vấn
"Lỗi chính là race condition dù dùng ConcurrentHashMap: map chỉ đảm bảo an toàn cho từng thao tác riêng lẻ, còn chuỗi get, cộng một, put là ba bước tách rời, hai luồng có thể cùng đọc một giá trị và ghi đè nhau, nên số đếm bị thiếu. Cách sửa là dùng thao tác nguyên tử trên map như merge với Long sum, hoặc computeIfAbsent tạo LongAdder rồi increment khi có key rất nóng. Lỗi thứ hai là map tăng mãi không có giới hạn hay hết hạn, sẽ thành memory leak với nhiều user; nên dùng cache có giới hạn hoặc đưa bộ đếm ra Redis nếu nhiều instance cần chung số liệu. Khi review code do AI sinh, tôi đặc biệt kiểm tra các chuỗi thao tác kiểm tra rồi hành động trên cấu trúc dùng chung, và yêu cầu test đồng thời chứng minh tổng đúng."

> Senior tip: khi review code AI sinh ra, tôi luôn hỏi "đoạn này có thể chạy concurrent không?" — AI hay viết code đúng single-thread. ConcurrentHashMap chỉ bảo vệ chính map, không bảo vệ logic check-then-act của bạn; phải dùng compute/merge/Atomic* mới an toàn.`,
  follow: [
    'LongAdder khác AtomicLong thế nào, khi nào chọn cái nào?',
    'Nếu cần reset counter theo ngày thì thiết kế thế nào để không mất dữ liệu?'
  ],
  tags: ['code-review', 'concurrency', 'ConcurrentHashMap', 'LongAdder', 'atomic']
},

{
  id: 'scenario-088',
  topic: 'scenario',
  level: 'senior',
  q: 'Review PR này (code do AI sinh). Service tạo đơn hàng và gọi payment gateway trong @Transactional. Tìm lỗi.\n~~~java\n@Service\npublic class OrderService {\n    @Transactional\n    public Order createOrder(Cart cart) {\n        Order order = orderRepo.save(new Order(cart));\n        paymentClient.charge(order.getId(), cart.total());\n        order.setStatus(PAID);\n        return orderRepo.save(order);\n    }\n}\n~~~',
  a: `**Tóm tắt:** Đoạn code có hai lỗi nghiêm trọng ở production: (1) gọi HTTP tới payment gateway (cổng thanh toán — dịch vụ bên ngoài xử lý trừ tiền) bên trong {{@Transactional}} (transaction DB — nhóm thao tác DB "thành công hết hoặc thất bại hết") giữ connection DB (kết nối tới cơ sở dữ liệu, lấy từ pool — bể kết nối giới hạn) quá lâu, dễ cạn pool; (2) nếu payment đã trừ tiền nhưng bước lưu DB sau đó lỗi, transaction rollback (hoàn tác) làm đơn biến mất trong khi tiền đã trừ — dữ liệu không nhất quán. Ngoài ra còn thiếu idempotency key (khóa chống xử lý lặp). Cách sửa chuẩn: ghi đơn {{PENDING}} + outbox event trong một transaction, sau commit mới gọi payment bất đồng bộ với idempotency key.

### Cơ chế bên trong — vì sao sai
**1. HTTP trong transaction giữ connection DB.** Khi method có {{@Transactional}}, Spring lấy một connection từ pool, mở transaction, giữ connection đó cho đến khi method kết thúc (commit/rollback). {{paymentClient.charge()}} là HTTP call có thể mất 200ms–3s (hoặc treo nếu gateway chậm). Trong thời gian đó connection DB bị "ngồi chơi", không phục vụ request khác. Với pool 20 connection và 50 request/giây, chỉ cần vài chục request đồng thời là pool cạn → request mới chờ → timeout dây chuyền.

**2. Không nhất quán tiền/đơn.** Thứ tự: {{save(order)}} (OK) → {{charge()}} (tiền trừ, OK) → {{save(order, PAID)}} (lỗi, ví dụ DB tạm thời lỗi) → Spring rollback transaction. Rollback hoàn tác các thay đổi DB trong transaction, nhưng **không hoàn tác HTTP call** đã gửi đi. Kết quả: khách bị trừ tiền, hệ thống không có đơn {{PAID}}.

**3. Không idempotent.** Nếu client timeout và gọi lại {{createOrder}}, {{charge}} chạy lại → trừ tiền hai lần. Payment gateway thường hỗ trợ idempotency key (gửi cùng một key thì chỉ xử lý một lần).

**4. Rollback mặc định.** {{@Transactional}} mặc định chỉ rollback với {{RuntimeException}}/{{Error}}; nếu {{charge}} ném checked exception, transaction có thể không rollback như mong đợi (tùy cấu hình), gây trạng thái khó đoán.

### Cách sửa (outbox pattern)
Outbox pattern (mẫu hộp thư đi): ghi dữ liệu nghiệp vụ và một "sự kiện cần gửi" vào cùng DB transaction; một worker đọc outbox sau commit để gọi hệ thống ngoài. Nhờ cùng transaction nên không mất sự kiện.

~~~java
@Transactional
public Order createOrder(Cart cart, String idempotencyKey) {
    // unique constraint trên idempotencyKey chặn tạo lặp
    Order order = orderRepo.save(new Order(cart, OrderStatus.PENDING, idempotencyKey));
    outboxRepo.save(new OutboxEvent("OrderCreated", order.getId(), idempotencyKey));
    return order; // commit nhanh, trả connection về pool
}

// Listener AFTER_COMMIT (hoặc relay đọc bảng outbox) gọi payment
public void onOrderCreated(OrderCreatedEvent e) {
    // idempotency key = orderId để gateway dedup
    PaymentResult r = paymentClient.charge(e.orderId(), e.amount(), e.orderId());
    orderRepo.updateStatus(e.orderId(), r.isOk() ? PAID : PAYMENT_FAILED);
}
~~~

### Ví dụ đời thực
Ứng dụng đặt hàng, pool HikariCP 20 connection, ~120 request/phút giờ cao điểm, gateway payment p95 = 800ms. Khi chạy code cũ: mỗi request giữ connection ~850ms (DB + HTTP), 120 req/phút × 0.85s ≈ 1.7 connection-giây/giây, thêm biến động → pool chờ xuất hiện, p99 API tăng từ 300ms lên 4s, thỉnh thoảng {{Connection is not available}}. Sau khi chuyển sang outbox (transaction chỉ ~15ms): p99 API còn ~120ms, không còn lỗi cạn pool. Một sự cố "trừ tiền nhưng không có đơn" (do save thứ hai lỗi) được loại bỏ vì payment chỉ chạy sau commit.

### Pitfall production
- {{@TransactionalEventListener(AFTER_COMMIT)}} đơn giản nhưng nếu app crash sau commit trước khi listener chạy, event có thể mất; bảng outbox + relay an toàn hơn.
- Cập nhật trạng thái {{PAID}} phải idempotent (chỉ chuyển từ {{PENDING}}) vì relay có thể gửi lặp.
- Cần job đối soát (reconciliation) giữa giao dịch gateway và đơn hàng.

### Trả lời mẫu khi phỏng vấn
"Em review thấy hai lỗi critical. Thứ nhất, gọi HTTP payment bên trong @Transactional giữ connection DB suốt thời gian gateway phản hồi, dưới tải sẽ cạn pool và làm tăng latency dây chuyền. Thứ hai, nếu charge thành công nhưng save sau đó fail, transaction rollback DB nhưng HTTP không rollback, nên khách bị trừ tiền mà đơn không thành PAID. Em cũng thấy thiếu idempotency key nên retry có thể trừ tiền hai lần. Cách em đề xuất là outbox pattern: trong một transaction chỉ lưu đơn trạng thái PENDING và một outbox event, commit trả connection ngay; sau commit một worker gọi payment với idempotency key bằng orderId và cập nhật trạng thái. Cần thêm unique constraint cho idempotency key và cơ chế đối soát định kỳ."

> Senior tip: Khi review code AI sinh ra có DB + transaction, em luôn tìm "có network call, sleep, hay xử lý nặng nào trong @Transactional không?" — AI hay gộp mọi thứ vào một method transactional cho đơn giản, đó là nguồn cạn pool và lệch dữ liệu kinh điển.`,
  follow: [
    'Outbox pattern hoạt động thế nào, tại sao không dùng @TransactionalEventListener trực tiếp?',
    'Idempotency key cho payment gateway thiết kế ra sao?'
  ],
  tags: ['code-review', 'transaction', 'outbox', 'idempotency', 'Spring']
},

{
  id: 'scenario-089',
  topic: 'scenario',
  level: 'senior',
  q: 'Review PR này (code do AI sinh). Đọc file config và gọi HTTP, exception bị nuốt. Tìm lỗi.\n~~~java\npublic String loadConfig(String url) {\n    InputStream in = null;\n    HttpURLConnection c = null;\n    try {\n        c = (HttpURLConnection) new URL(url).openConnection();\n        in = c.getInputStream();\n        return new String(in.readAllBytes(), UTF_8);\n    } catch (Exception e) {\n        log.warn("load failed");\n        return null;\n    }\n}\n~~~',
  a: `**Tóm tắt:** Đoạn code có ba lỗi chính: (1) không đóng {{InputStream}} và {{HttpURLConnection}} → rò rỉ connection (connection leak — tài nguyên mạng/FD không được trả lại), lâu dần cạn tài nguyên; (2) nuốt exception (catch tất cả, chỉ log {{warn}}, trả {{null}}) khiến caller không phân biệt "không có dữ liệu" với "lỗi mạng" và mất stack trace; (3) {{readAllBytes()}} đọc toàn bộ response vào RAM, không timeout, có thể treo vô hạn hoặc OOM (Out Of Memory) nếu response lớn. Sửa bằng try-with-resources, đặt timeout, giới hạn kích thước đọc, và ném exception có ngữ cảnh.

### Cơ chế bên trong — vì sao sai
**1. Resource leak (rò rỉ tài nguyên).** {{HttpURLConnection.getInputStream()}} mở một luồng đọc từ socket mạng. Nếu không {{close()}}, socket/file descriptor (định danh tài nguyên của OS) không được trả lại. Mỗi lần gọi leak một ít; sau vài nghìn lần (hoặc nhanh hơn nếu OS giới hạn FD), ứng dụng không mở thêm connection được → lỗi "Too many open files" hoặc request treo. {{HttpURLConnection}} cũng cần {{disconnect()}} để trả connection về pool nội bộ.

**2. Nuốt exception che mất nguyên nhân.** {{catch (Exception e)}} bắt mọi lỗi (DNS, timeout, 500, parse…). Chỉ {{log.warn("load failed")}} không ghi {{e}} → stack trace mất. Trả {{null}} buộc caller phải đoán: null là "chưa cấu hình" hay "mạng lỗi"? Caller có thể dùng giá trị mặc định sai hoặc NPE (NullPointerException) ở chỗ khác, khiến root cause (nguyên nhân gốc) rất khó tìm.

**3. Đọc không giới hạn + không timeout.** {{readAllBytes()}} cấp bộ nhớ bằng đúng kích thước response; nếu endpoint trả 200MB (do lỗi hoặc bị tấn công), JVM có thể OOM. Không set {{connectTimeout}}/{{readTimeout}} nghĩa là thread có thể chờ vô hạn khi mạng treo, chiếm thread worker.

### Cách sửa
~~~java
public String loadConfig(String url) throws IOException {
    HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
    c.setConnectTimeout(5_000); // ms: tối đa chờ nối
    c.setReadTimeout(5_000);    // ms: tối đa chờ đọc
    try (InputStream in = c.getInputStream()) { // tự đóng
        byte[] buf = in.readNBytes(1 << 20);     // giới hạn 1MB
        if (buf.length == (1 << 20) && in.read() != -1) {
            throw new IOException("response too large: " + url);
        }
        return new String(buf, StandardCharsets.UTF_8);
    } finally {
        c.disconnect();
    }
}
~~~
{{try-with-resources}} (Java 7+) đảm bảo {{close()}} được gọi kể cả khi có exception.

### Ví dụ đời thực
Service đọc config từ endpoint nội bộ mỗi 60 giây (1.440 lần/ngày/instance, 10 instance = 14.400 lần/ngày). Code cũ không đóng stream: sau ~18 giờ, một instance bắt đầu lỗi mở socket gián đoạn; lệnh kiểm tra FD cho thấy hàng nghìn socket {{CLOSE_WAIT}}. Cùng lúc, endpoint config bị lỗi trả HTML trang lỗi 2MB thay vì JSON 2KB → {{readAllBytes}} tạo áp lực GC. Xử lý: thêm try-with-resources, timeout 5s, giới hạn 256KB. Kết quả: FD ổn định quanh mức vài chục, lỗi mạng được log kèm stack trace và URL, thời gian phát hiện sự cố giảm từ ~40 phút (do chỉ thấy "load failed") xuống ~3 phút.

### Pitfall production
- Chỉ {{disconnect()}} mà quên đóng stream (hoặc ngược lại) vẫn có thể giữ tài nguyên; dùng try-with-resources cho stream.
- Log exception phải kèm context (URL, status code nếu đọc được) nhưng không kèm secret (query param token).
- Với HTTP client hiện đại (Java 11+ {{HttpClient}}), vẫn phải đặt timeout và giới hạn body.

### Trả lời mẫu khi phỏng vấn
"Em thấy ba vấn đề. Một là leak tài nguyên: InputStream và HttpURLConnection không được đóng, mỗi lần gọi giữ socket, lâu dần cạn file descriptor. Hai là nuốt exception: catch Exception chỉ log warn không kèm stack trace và trả null, nên caller không biết lỗi do đâu và dễ dùng giá trị sai. Ba là không an toàn về tài nguyên: readAllBytes đọc hết vào RAM và không có timeout, nên response lớn gây OOM, mạng treo làm thread chờ vô hạn. Em sửa bằng try-with-resources để tự đóng stream, set connect và read timeout, giới hạn số byte đọc, và ném IOException có ngữ cảnh như URL. Nếu caller có thể xử lý, em để propagate; nếu cần fallback, em log đầy đủ exception và metric để vận hành biết."

> Senior tip: Khi review code AI có I/O (file, HTTP, DB stream), em luôn kiểm ba thứ: resource có được đóng tự động không, có timeout và giới hạn kích thước không, exception có được xử lý có ngữ cảnh hay bị nuốt không.`,
  follow: [
    'Khi nào nên retry và khi nào nên fail fast cho HTTP client?',
    'Làm sao giới hạn kích thước response để chống OOM?'
  ],
  tags: ['code-review', 'resource-leak', 'exception-handling', 'HTTP', 'try-with-resources']
},

{
  id: 'scenario-090',
  topic: 'scenario',
  level: 'senior',
  q: 'Review PR này (code do AI sinh). Dùng object làm key trong HashSet. Tìm lỗi.\n~~~java\npublic class UserKey {\n    private String name;\n    public UserKey(String name) { this.name = name; }\n    public String getName() { return name; }\n    public void setName(String name) { this.name = name; }\n    @Override\n    public boolean equals(Object o) {\n        return o instanceof UserKey && ((UserKey)o).name.equals(name);\n    }\n}\nSet<UserKey> set = new HashSet<>();\nset.add(new UserKey("a"));\nSystem.out.println(set.contains(new UserKey("a")));\n~~~',
  a: `**Tóm tắt:** Đoạn code vi phạm contract (hợp đồng) giữa {{equals}} và {{hashCode}} và dùng key có thể thay đổi (mutable) trong {{HashSet}}. {{equals}} được override nhưng {{hashCode}} không → hai object "bằng nhau" có thể nằm khác bucket (ngăn) nên {{contains}} trả {{false}}. Thêm nữa, {{setName}} cho phép đổi {{name}} sau khi đã {{add}} → hashCode thay đổi, object bị "mất" trong set vì tìm sai bucket. Cách sửa: override cả {{equals}} và {{hashCode}} (dùng cùng các field), và làm key immutable (không đổi được, ví dụ {{final}} field, không có setter).

### Cơ chế bên trong — vì sao sai
**HashSet/HashMap hoạt động thế nào (đơn giản):** Khi {{add}} hoặc {{contains}}, HashSet gọi {{hashCode()}} để tính "số ngăn" (bucket), rồi vào ngăn đó mới dùng {{equals()}} để so sánh thật sự. Đây là tối ưu: thay vì so sánh với mọi phần tử (O(n)), chỉ so sánh trong một ngăn nhỏ (gần O(1)).

**1. Override equals mà không hashCode.** {{Object.hashCode()}} mặc định thường dựa trên địa chỉ/định danh object. {{new UserKey("a")}} ở {{add}} và {{new UserKey("a")}} ở {{contains}} là hai object khác nhau → hashCode mặc định thường khác → rơi vào hai bucket khác. HashSet vào bucket của object thứ hai, không thấy object thứ nhất, nên trả {{false}} dù {{equals}} trả {{true}}. Contract Java: nếu {{a.equals(b)}} thì {{a.hashCode() == b.hashCode()}} bắt buộc phải đúng.

**2. Key mutable.** Bucket được chọn tại thời điểm {{add}} theo {{name}} lúc đó. Nếu sau đó gọi {{setName("b")}}, hashCode mới (theo "b") khác hashCode cũ (theo "a"), nhưng object vẫn đang nằm ở bucket cũ. {{contains(new UserKey("b"))}} sẽ tìm ở bucket của "b" → không thấy → object coi như "mất". Đây là lỗi rất khó debug.

~~~java
public final class UserKey {
    private final String name; // immutable
    public UserKey(String name) { this.name = Objects.requireNonNull(name); }
    public String getName() { return name; }
    @Override public boolean equals(Object o) {
        return o instanceof UserKey uk && Objects.equals(name, uk.name);
    }
    @Override public int hashCode() { return Objects.hash(name); }
}
Set<UserKey> set = new HashSet<>();
set.add(new UserKey("a"));
System.out.println(set.contains(new UserKey("a"))); // true
~~~

### Ví dụ đời thực
Module phân quyền cache danh sách {{UserKey}} đã xử lý trong một batch (HashSet để dedup), ~50k user/batch. Một đoạn code khác vô tình giữ reference và gọi setter (trước khi sửa immutable) → khoảng 0,1% user bị xử lý lặp vì {{contains}} trả sai, gây gửi thông báo trùng. Ở case không override {{hashCode}}, test đơn giản đôi khi "qua" nếu hash mặc định tình cờ trùng, nhưng production với nhiều object thì fail ngẫu nhiên. Sau khi chuyển sang class immutable với {{equals}}/{{hashCode}} đúng: dedup ổn định 100%, thời gian xử lý batch không đổi (vẫn ~4 giây).

### Khi nào dùng / không dùng
- Dùng class immutable (hoặc Java 16+ {{record}} — tự sinh {{equals}}/{{hashCode}}/constructor cho các thành phần) làm key Map/Set.
- Nếu bắt buộc phải thay đổi dữ liệu, đừng đổi field dùng trong {{equals}}/{{hashCode}} khi object đang nằm trong HashMap/HashSet; an toàn hơn là xóa key cũ rồi thêm key mới.

### Pitfall production
- {{equals}} không null-safe ({{name}} null → NPE) và dùng {{instanceof}}/ép kiểu cẩn thận; {{Objects.equals}} an toàn hơn.
- Dùng field mutable (ví dụ {{List}}) trong {{hashCode}} cũng gây "mất" key nếu list thay đổi.
- {{HashMap}}/concurrent collection đều phụ thuộc contract này.

### Trả lời mẫu khi phỏng vấn
"Đoạn code sai ở hai điểm kinh điển. Thứ nhất, nó override equals nhưng không override hashCode, nên vi phạm contract của Java: hai object bằng nhau phải có cùng hashCode. HashSet dùng hashCode để chọn bucket rồi mới dùng equals, nên hai UserKey cùng tên nhưng khác object có thể rơi vào bucket khác và contains trả false. Thứ hai, key là mutable vì có setName; nếu đổi name sau khi add, hashCode thay đổi nhưng object vẫn nằm ở bucket cũ, nên lookup sẽ không tìm thấy, object bị mất trong collection. Em sẽ sửa bằng cách làm UserKey immutable với field final, bỏ setter, override cả equals và hashCode dựa trên cùng field, dùng Objects.equals và Objects.hash; với Java 16 trở lên em ưu tiên dùng record để tránh lỗi này."

> Senior tip: Khi review bất kỳ object nào dùng làm key của HashMap/HashSet, em luôn hỏi: có override cả equals và hashCode không, chúng dùng cùng field không, và key có immutable không? AI hay quên hashCode hoặc để setter.`,
  follow: [
    'Vì sao record Java 16+ giải quyết vấn đề này tự động?',
    'Nếu bắt buộc key mutable, xử lý thế nào?'
  ],
  tags: ['code-review', 'equals', 'hashCode', 'HashSet', 'immutable']
},
{
  id: 'scenario-091',
  topic: 'scenario',
  level: 'senior',
  q: 'Review PR này (code do AI sinh). Retry khi gọi payment gateway. Tìm lỗi.\n~~~java\npublic PaymentResult charge(String orderId, BigDecimal amount) {\n    int attempts = 0;\n    while (attempts < 3) {\n        try {\n            return gateway.charge(orderId, amount);\n        } catch (Exception e) {\n            attempts++;\n            if (attempts == 3) throw e;\n        }\n    }\n    throw new IllegalStateException("unreachable");\n}\n~~~',
  a: `**Tóm tắt:** Đoạn retry (thử lại) gọi payment gateway có ba lỗi production nghiêm trọng: (1) không idempotent (không chống xử lý lặp) — nếu lần đầu gateway đã trừ tiền nhưng response bị timeout, retry sẽ trừ tiền lần hai; (2) retry mọi exception, kể cả lỗi nghiệp vụ như "không đủ tiền" (thường không nên retry) → vừa vô ích vừa có thể gây side effect; (3) không có backoff (chờ tăng dần) và jitter (ngẫu nhiên lệch) → khi gateway chậm, tất cả client retry cùng lúc gây thundering herd (hiệu ứng bầy đàn làm hệ thống quá tải nặng hơn). Cách sửa: gửi idempotency key (thường là {{orderId}}), chỉ retry lỗi tạm thời (timeout, 5xx, 429), dùng exponential backoff + jitter.

### Cơ chế bên trong — vì sao sai
**Retry là gì:** Khi một call thất bại, thử gọi lại. Nghe đơn giản nhưng với thao tác "có tác dụng phụ" như trừ tiền, retry sai còn nguy hiểm hơn không retry.

**1. Không idempotent — trừ tiền hai lần.** Kịch bản: client gửi {{charge}} → gateway xử lý thành công, trừ tiền → response về bị timeout do mạng. Client thấy exception, retry → gateway xử lý lại → trừ tiền lần hai. Đây là sự cố tài chính thực tế. Idempotency key là một mã duy nhất cho "ý định" giao dịch; gateway lưu key và nếu nhận lại cùng key thì trả kết quả cũ thay vì xử lý lại.

**2. Retry mọi exception.** {{catch (Exception e)}} bắt cả lỗi nghiệp vụ (sai tham số, số dư không đủ, thẻ bị khóa — thường trả 4xx). Những lỗi này retry bao nhiêu lần cũng fail, lãng phí tài nguyên, tăng latency, và trong một số API không idempotent có thể gây hành vi lặp. Chỉ nên retry lỗi tạm thời (transient): timeout, lỗi kết nối, HTTP 5xx (lỗi server), 429 (bị giới hạn tốc độ — rate limit).

**3. Không backoff/jitter — thundering herd.** Khi gateway chậm/lỗi, hàng nghìn request cùng fail và retry ngay lập tức, đồng loạt dồn vào gateway đang yếu → quá tải nặng hơn. Exponential backoff (chờ 100ms, 200ms, 400ms…) giãn tải; jitter (thêm ngẫu nhiên) tránh các client "nhịp lại" cùng lúc.

~~~java
public PaymentResult charge(String orderId, BigDecimal amount) {
    for (int i = 0; i < 3; i++) {
        try {
            // idempotency key = orderId: gateway dedup giao dịch lặp
            return gateway.charge(orderId, amount, orderId);
        } catch (TransientPaymentException e) { // chỉ lỗi tạm thời
            if (i == 2) throw e; // hết lượt thì ném ra
            long base = (long) (Math.pow(2, i) * 100); // 100,200,400ms
            sleep(base + (long) (Math.random() * 100)); // + jitter
        } catch (BusinessPaymentException e) {
            throw e; // 4xx/nghiệp vụ: không retry
        }
    }
    throw new IllegalStateException("unreachable");
}
~~~

### Ví dụ đời thực
Hệ thống thanh toán, ~2.000 giao dịch/phút giờ cao điểm, gọi gateway ngoài. Sự cố: gateway bị chậm 20 giây (p99 tăng đột biến). Code cũ retry ngay 3 lần cho mọi lỗi → lưu lượng thực tế lên ~6.000 call/phút vào gateway, gateway quá tải nặng hơn, tỷ lệ timeout tăng từ 2% lên 18%. Một số giao dịch timeout ở lần đầu nhưng gateway đã xử lý → retry gây 37 giao dịch bị nghi ngờ trừ lặp, phải đối soát thủ công. Sau sửa: idempotency key, chỉ retry timeout/5xx, backoff 200ms/500ms/1s + jitter, timeout tổng 4s → khi gateway chậm, lỗi ổn định ~3% và không có giao dịch trừ lặp.

### Pitfall production
- Idempotency key phải ổn định theo "ý định" (orderId), không sinh UUID mới mỗi lần retry.
- Cần timeout tổng cho cả quá trình retry, không chỉ từng call.
- Ghi log attempt, mã lỗi, và metric (retry count) để biết gateway đang bất ổn.

### Trả lời mẫu khi phỏng vấn
"Em thấy retry này nguy hiểm cho payment. Lỗi lớn nhất là không idempotent: nếu lần đầu gateway đã trừ tiền nhưng response timeout, retry sẽ trừ lần hai, nên bắt buộc phải gửi idempotency key, thường dùng orderId, để gateway tự khử trùng. Thứ hai, code retry mọi exception, nhưng lỗi nghiệp vụ như không đủ tiền hay sai tham số thì retry vô ích; em chỉ retry lỗi tạm thời như timeout, lỗi kết nối, 5xx hoặc 429. Thứ ba, không có exponential backoff và jitter nên khi gateway chậm, các client retry cùng lúc tạo thundering herd làm sự cố nặng hơn. Em cũng sẽ đặt timeout tổng, log từng attempt và theo dõi metric retry để phát hiện gateway bất ổn."

> Senior tip: Với payment, em luôn hỏi ba câu: retry có idempotent key không, retry đúng loại lỗi không, và có backoff + jitter + timeout tổng không? Thiếu một trong ba là rủi ro production.`,
  follow: [
    'Idempotency key cho payment gateway thiết kế thế nào?',
    'Exponential backoff với jitter: full jitter vs decorrelated jitter?'
  ],
  tags: ['code-review', 'retry', 'idempotency', 'backoff', 'payment']
},
{
  id: 'scenario-092',
  topic: 'scenario',
  level: 'senior',
  q: 'Review PR này (code do AI sinh). Cache static và format ngày. Tìm lỗi.\n~~~java\npublic class UserCache {\n    private static final Map<String, User> cache = new HashMap<>();\n    private static final SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");\n    public User get(String id) {\n        return cache.computeIfAbsent(id, k -> loadFromDb(k));\n    }\n    public String formatDate(Date d) {\n        return sdf.format(d);\n    }\n}\n~~~',
  a: `**Tóm tắt:** ba lỗi: (1) static HashMap không thread-safe + không giới hạn kích thước → race condition và memory leak (cache lớn dần); (2) SimpleDateFormat không thread-safe và dùng chung static → corruption dữ liệu ngày khi nhiều thread; (3) cache không có TTL/eviction → stale data và OOM lâu dài. Sửa: ConcurrentHashMap + Caffeine (size + TTL), và DateTimeFormatter (immutable, thread-safe) thay SimpleDateFormat.

### Lỗi theo mức nghiêm trọng

**1. Critical — SimpleDateFormat dùng chung giữa thread.**
SimpleDateFormat không thread-safe. Nhiều thread cùng format → kết quả sai/không xác định, thậm chí ArrayIndexOutOfBounds. Đây là bug production kinh điển.

**2. Critical — static HashMap không thread-safe.**
{{computeIfAbsent}} trên HashMap không atomic → race condition, mất entry, hoặc infinite loop (Java 7) / corruption. Phải dùng ConcurrentHashMap.

**3. Major — cache không giới hạn + không TTL.**
cache lớn dần theo số user → memory leak; dữ liệu stale (user đổi tên nhưng cache cũ). Cần size limit + TTL + eviction.

**4. Minor — loadFromDb chạy trong computeIfAbsent giữ lock map → nếu DB chậm, block mọi thread khác cùng map (với CHM lock stripe).**

### Cách sửa
~~~java
public class UserCache {
    private static final Cache<String, User> cache = Caffeine.newBuilder()
        .maximumSize(10_000).expireAfterWrite(5, java.util.concurrent.TimeUnit.MINUTES).build();
    private static final DateTimeFormatter FMT =
        DateTimeFormatter.ofPattern("yyyy-MM-dd");
    public User get(String id) { return cache.get(id, k -> loadFromDb(k)); }
    public String formatDate(LocalDate d) { return FMT.format(d); }
}
~~~

### Cách nói khi review
"Em thấy ba vấn đề: SimpleDateFormat không thread-safe dùng chung static (corrupt ngày), HashMap không thread-safe, và cache không giới hạn/TTL (leak + stale). Em đề xuất Caffeine (size+TTL) và DateTimeFormatter immutable. Nếu không thêm lib, dùng ConcurrentHashMap + manual eviction."

### Ví dụ đời thực
Đoạn code có {{static final SimpleDateFormat}} dùng chung và cache {{static HashMap}} không giới hạn được merge vào service báo cáo. Triệu chứng sau 2 tuần: thỉnh thoảng báo cáo có ngày lạ như "2026-00-31" hoặc {{NumberFormatException}}/{{ArrayIndexOutOfBoundsException}} trong {{SimpleDateFormat.parse}} — vì lớp này giữ trạng thái nội bộ ({{Calendar}}) và **không thread-safe**; hai request parse cùng lúc làm hỏng trạng thái của nhau. Đồng thời {{HashMap}} static bị nhiều luồng ghi đồng thời làm hỏng cấu trúc và heap tăng không ngừng. Sửa: {{DateTimeFormatter}} (bất biến, thread-safe) với {{LocalDate}}; cache thay bằng Caffeine có giới hạn và hết hạn (hoặc {{ConcurrentHashMap}} nếu thật sự chỉ là bảng tra nhỏ cố định). Thêm detekt/SpotBugs rule bắt {{SimpleDateFormat}} trong field static (STCAL_STATIC_SIMPLE_DATE_FORMAT_INSTANCE).

### Trả lời mẫu khi phỏng vấn
"Tôi xếp lỗi theo mức nghiêm trọng. Nghiêm trọng nhất là SimpleDateFormat static dùng chung: lớp này giữ trạng thái nội bộ khi parse và format nên không thread-safe, dưới tải sẽ cho ra ngày sai hoặc exception lạ, rất khó tái hiện. Sửa bằng DateTimeFormatter của java.time, bất biến và an toàn cho nhiều luồng. Thứ hai là cache static dùng HashMap: ghi đồng thời làm hỏng cấu trúc map, và không có giới hạn hay hết hạn nên thành memory leak, dữ liệu cũ không bao giờ được làm mới. Sửa bằng Caffeine có maximumSize và thời gian hết hạn. Khi góp ý trong review, tôi giải thích rõ hậu quả trên production và đưa đoạn code sửa, đồng thời đề xuất rule static analysis để bắt lỗi này tự động, thay vì chỉ trông vào người review."

> Senior tip: khi review code AI sinh ra có cache/static field, tôi luôn hỏi "thread-safe không, có giới hạn kích thước không, có TTL không, có stale không?" — bốn câu này bắt được phần lớn bug cache production.`,
  follow: [
    'Caffeine khác Guava Cache thế nào?',
    'Khi nào nên cache local vs distributed (Redis)?'
  ],
  tags: ['code-review', 'cache', 'thread-safety', 'SimpleDateFormat', 'Caffeine']
},
{
  id: 'scenario-093',
  topic: 'scenario',
  level: 'senior',
  q: 'Tuần đầu bạn nhận một hệ thống monolith Java 8, Struts/Spring cũ, Oracle, không có test, người viết đã nghỉ. Bạn bắt đầu thế nào để không phá hỏng gì?',
  a: `**Tóm tắt:** Tuần đầu nhận monolith (ứng dụng một khối lớn, tất cả chức năng nằm chung) Java 8 cũ, không test, người viết đã nghỉ: mục tiêu không phải "sửa ngay" hay "hiểu hết", mà là **quan sát an toàn, dựng môi trường, vẽ bản đồ hệ thống, và ghi chép** để mọi thay đổi sau đó có kiểm soát. Ưu tiên theo luồng nghiệp vụ quan trọng, tìm "vùng nguy hiểm", và thiết lập cách rollback/kiểm chứng trước khi chạm vào code.

### Cơ chế tiếp cận — vì sao phải đi chậm mà chắc
Hệ thống legacy (hệ thống cũ, còn chạy production) thường có "kiến thức ngầm": một cấu hình tưởng vô hại lại ảnh hưởng batch đêm, một bảng dùng chung, một stored procedure (thủ tục lưu trong DB) không ai nhớ. Khi không có test tự động, mỗi thay đổi là một canh bạc. Vì vậy tuần đầu là giảm rủi ro: hiểu bối cảnh, có môi trường để thử, biết luồng nào quan trọng, và biết ai/cái gì còn giúp được.

### Điều tra từng bước
1. **Làm rõ bối cảnh (ngày 1):** Hệ thống phục vụ nghiệp vụ gì, giờ cao điểm, SLA (cam kết mức dịch vụ, ví dụ uptime/độ trễ)? Môi trường dev/test/staging/prod khác nhau ra sao? Bạn có quyền gì (đọc code, đọc log, DB read-only)? Ai còn biết: PM/BA cũ, DBA, support, ops?
2. **Vẽ bản đồ nhanh:** Tìm entry point (điểm vào: {{web.xml}}, Struts Action, Spring XML config cũ), module chính, dependency (thư viện), tích hợp ngoài (DB Oracle, file, service khác, job/batch). Vẽ sơ đồ thô: luồng 1–2 nghiệp vụ quan trọng nhất.
3. **Dựng môi trường an toàn:** Tìm {{pom.xml}}/{{build.xml}}, script start, config mẫu. Mục tiêu là chạy được local hoặc staging gần production; nếu không dựng ngay, **không đoán**, ưu tiên đọc code + log. Chuẩn bị cách xem log và DB read-only.
4. **Quan sát production (chỉ đọc):** Log gần đây, lỗi hay gặp, job/cron đêm, bảng/procedure được gọi nhiều. Hỏi support: "module nào đừng động", "sự cố hay lặp".
5. **Ghi chép "runbook" ngắn:** Cách start/stop, config quan trọng, luồng chính, điểm nhạy cảm, người liên hệ. Đây là tài sản cho chính bạn và team.

### Ví dụ đời thực
Monolith ngân hàng nội bộ, 12 năm tuổi, Java 8 + Struts 1 + Spring XML + Oracle, ~180k dòng, 0 unit test tự động, người viết chính nghỉ 6 tháng. Tuần đầu: bạn không sửa bug. Bạn dựng được môi trường dev sau 2 ngày (thiếu 3 biến config, được DBA/support chỉ), vẽ được 4 luồng chính (đăng nhập, tra cứu, chuyển khoản nội bộ, batch đối soát đêm 02:00). Bạn phát hiện batch đêm gọi 6 stored procedure và có 2 bảng khóa chung với luồng online — ghi vào "vùng nguy hiểm". Kết quả: khi tuần 2 nhận ticket sửa tra cứu, bạn biết phải test thêm ảnh hưởng lên report và tránh chạm batch; thời gian điều tra giảm từ ước tính ~3 ngày xuống ~1 ngày vì đã có bản đồ.

~~~text
[Browser] -> [Struts Action] -> [Service (Spring XML)] -> [DAO/JDBC] -> [Oracle + Stored Proc]
                                \-> [Batch/Cron 02:00] -> [Bảng chung / File đối soát]
Ghi chú: transaction boundary nằm ở đâu? proc nào commit/rollback?
~~~

### Pitfall production
- **Đọc code từ đầu đến cuối:** Không hiệu quả với 180k dòng. Đi theo luồng nghiệp vụ cần sửa.
- **Tin comment cũ:** Comment có thể sai hơn code; tin vào hành vi thực tế (log, trace, DB).
- **Thay đổi config "nhỏ":** Một flag timeout/pool có thể ảnh hưởng batch hoặc giờ cao điểm.
- **Sửa refactor sớm:** Chưa có test và chưa hiểu, refactor dễ tạo regression (lỗi hồi quy — thứ đang chạy bị hỏng).

### Trả lời mẫu khi phỏng vấn
"Nếu tuần đầu nhận một monolith Java 8 cũ không test và người viết đã nghỉ, em sẽ không sửa ngay. Ưu tiên đầu tiên là hiểu bối cảnh nghiệp vụ, SLA và các luồng quan trọng, đồng thời xác định mình có quyền truy cập nào và ai còn có thể hỗ trợ như DBA hay support. Em dựng môi trường dev hoặc staging an toàn để quan sát, vẽ bản đồ entry point, module, dependency và tích hợp ngoài, đặc biệt là batch đêm và stored procedure. Em chỉ điều tra production ở chế độ read-only qua log và dữ liệu, rồi ghi runbook ngắn: cách chạy, config quan trọng, vùng nguy hiểm, cách rollback. Mục tiêu của tuần đầu là có nền tảng thay đổi an toàn; khi có ticket sau đó, em sẽ thay đổi nhỏ, có bước kiểm chứng và rollback, rồi mới tính đến bổ sung test đặc trưng."

> Senior tip: Thành quả tuần đầu đáng giá nhất là "bản đồ đáng tin + danh sách đừng động". Trong legacy, biết mình chưa biết gì quan trọng hơn là sửa nhanh một chỗ.`,
  follow: [
    'Làm sao xác định module nào quan trọng nhất để ưu tiên đọc trước?',
    'Khi không có ai trả lời và không có test, bạn giảm rủi ro khi thay đổi thế nào?'
  ],
  tags: ['legacy', 'monolith', 'maintenance', 'onboarding']
},
{
  id: 'scenario-094',
  topic: 'scenario',
  level: 'senior',
  q: 'Nhận ticket production support: khách báo sai số dư/giao dịch. Theo quy trình ITIL bạn xử lý thế nào (incident → problem → change), chú trọng SLA P1-P4?',
  a: `**Tóm tắt:** phân loại mức độ (P1-P4) theo ảnh hưởng/khẩn cấp, xác nhận và hạn chế ảnh hưởng trước (containment), điều tra an toàn (không sửa production trực tiếp), tìm root cause, chuyển thành Problem nếu lặp lại, đề xuất Change có phê duyệt đúng quy trình.

### Làm rõ yêu cầu
- Mức ưu tiên: P1 (toàn hệ thống/ngân hàng quan trọng) cần phản hồi trong vài phút, P4 có thể xử lý theo lịch.
- Có quyền truy cập log/DB read-only production không? Ai được phép sửa?
- Có hotline/on-call và quy trình escalation?

### Quy trình từng bước
- **Incident** — ghi nhận: ticket ID, thời gian báo, người báo, triệu chứng, số giao dịch bị ảnh hưởng. Xác định P1-P4 theo SLA.
- **Containment (giảm thiểu)** — ưu tiên ngăn lan rộng: tạm vô hiệu hóa tính năng liên quan, hướng dẫn fallback, thông báo đúng người (on-call, DBA, security).
- **Investigation (an toàn)** — chỉ đọc: log (app/log server), trace, DB read-only, APM. Không chạy UPDATE/DELETE trên production khi chưa có phê duyệt.
- **Root cause & workaround** — tìm nguyên nhân gần đúng (thời gian, user, ref_no). Cung cấp workaround tạm thời nếu có, ghi rõ thời gian áp dụng.
- **Problem** — nếu sự cố lặp lại nhiều lần hoặc ảnh hưởng lớn, mở Problem ticket, gom evidence, đề xuất giải pháp dài hạn.
- **Change** — đề xuất Change Request (mô tả, impact, rollback plan, test plan), trình CAB (Change Advisory Board) nếu cần, chỉ thực hiện trong change window đã được duyệt.

### Ví dụ SLA
| Mức | Ảnh hưởng | Phản hồi | Mục tiêu khôi phục |
|---|---|---|---|
| P1 | Toàn bộ giao dịch quan trọng ngưng | Ngay (trong phút) | Rất nhanh, theo SLA đã cam kết |
| P2 | Nhiều user ảnh hưởng | Nhanh | Ưu tiên cao |
| P3 | Ít user/không quan trọng | Theo giờ làm việc | Theo lịch |
| P4 | Yêu cầu nhỏ | Theo lịch | Theo lịch |

### Pitfall
- **Sửa ngay mà không ghi** — phải ghi đầy đủ log điều tra (ai, khi nào, câu query).
- **Bỏ qua Problem** — fix thủ công mãi mà không khắc phục gốc sẽ tái diễn.
- **Thay đổi ngoài change window** — hầu hết công ty lớn cấm, trừ trường hợp P1 khẩn cấp có quy trình riêng.

### Ví dụ đời thực
8:15 sáng thứ Hai, 23 khách báo "số dư bị trừ nhưng giao dịch thất bại". **Incident** (P1 vì ảnh hưởng tiền của nhiều khách): mở kênh sự cố, chỉ định người chỉ huy, xác nhận phạm vi trong 15 phút (412 giao dịch từ 7:40, cùng một ngân hàng đối tác), giảm thiệt hại bằng cách **tạm chuyển** giao dịch sang trạng thái chờ thay vì báo thất bại, cập nhật cho CSKH mỗi 30 phút. Khôi phục lúc 9:30 khi đối tác sửa xong. **Problem**: phân tích nguyên nhân gốc — hệ thống coi timeout từ đối tác là thất bại nhưng không hoàn tiền tạm giữ; 412 khoản được hoàn trong ngày sau đối soát. **Change**: sửa logic xử lý timeout (trạng thái chưa xác định + hỏi lại), qua quy trình thay đổi có test, phê duyệt, deploy giờ thấp điểm, có kế hoạch rollback. Postmortem không đổ lỗi, 6 hành động khắc phục có người chịu trách nhiệm và hạn.

### Trả lời mẫu khi phỏng vấn
"Tôi tách ba quy trình. Incident là khôi phục dịch vụ nhanh nhất có thể: phân loại mức độ theo ảnh hưởng, với sai số dư của nhiều khách là P1; mở kênh sự cố, có người chỉ huy, xác định phạm vi, giảm thiệt hại trước, ví dụ chặn luồng lỗi hay chuyển giao dịch sang trạng thái chờ, và cập nhật định kỳ cho CSKH, quản lý theo SLA phản hồi và xử lý. Problem là tìm nguyên nhân gốc sau khi đã ổn định: phân tích log, dữ liệu, đối soát để sửa đúng từng tài khoản bị ảnh hưởng. Change là đưa bản sửa vào production qua quy trình có kiểm soát: test, phê duyệt, khung giờ deploy, kế hoạch rollback. Kết thúc bằng postmortem không đổ lỗi với hành động có người chịu trách nhiệm và hạn hoàn thành. Với lỗi liên quan tiền, mọi điều chỉnh số dư đều là bút toán mới có duyệt và audit."

> Senior tip: câu trả lời phỏng vấn mạnh là "tôi ưu tiên containment trước, điều tra read-only, ghi mọi bằng chứng, và chỉ sửa qua Change được duyệt (hoặc theo quy trình khẩn cấp)".`,
  follow: [
    'Sự khác biệt giữa Incident và Problem trong ITIL?',
    'Khi nào được phép hotfix khẩn cấp ngoài change window?'
  ],
  tags: ['ITIL', 'incident', 'problem', 'change', 'SLA']
},
{
  id: 'scenario-095',
  topic: 'scenario',
  level: 'senior',
  q: 'Phải sửa bug gấp (hotfix) trong code không có test. Bạn làm thế nào để an toàn nhất?',
  a: `**Tóm tắt:** Sửa bug gấp (hotfix) trên code không có test đòi hỏi ưu tiên **an toàn hơn hoàn hảo**: tái hiện lỗi, viết characterization test (test đặc trưng — ghi lại hành vi hiện tại để phát hiện bạn làm hỏng thứ khác), tìm nguyên nhân gốc, thực hiện thay đổi nhỏ nhất có thể, chuẩn bị rollback (khả năng quay lại nhanh), kiểm chứng kỹ, rồi mới thêm regression test (test chống tái diễn) cho đúng case đã lỗi. Mỗi bước đều nhằm giảm rủi ro vì không có lưới an toàn tự động.

### Cơ chế tiếp cận — vì sao phải "test trước, sửa nhỏ"
Khi không có test, bạn không biết một thay đổi nhỏ sẽ làm hỏng luồng nào khác. Characterization test không phải để chứng minh code "đúng", mà để "chụp ảnh" hành vi hiện tại ở các case quan trọng xung quanh vùng sửa. Nếu sau khi sửa, các test đó vẫn cho kết quả như cũ (trừ case bug), bạn tự tin hơn rằng chưa gây regression. Thay đổi nhỏ giúp review nhanh và rollback dễ.

### Quy trình từng bước
1. **Reproduce (tái hiện):** Lấy input, thời điểm, dữ liệu, user/tài khoản liên quan. Tái hiện trên local/staging nếu được; nếu chỉ có log production, trích xuất chính xác điều kiện.
2. **Khoanh vùng ảnh hưởng:** Bug nằm ở method/class nào, có gọi DB/bên ngoài không, có transaction không? Những luồng nào dùng chung code này?
3. **Viết characterization test:** Với case bug, ghi nhận hành vi sai hiện tại (để hiểu). Với 2–3 case lân cận "đang đúng", viết test khóa hành vi hiện tại. Dùng dữ liệu/giả lập tối thiểu.
4. **Sửa nhỏ nhất:** Chỉ chạm đúng nguyên nhân (ví dụ thiếu null check, sai điều kiện, sai format). Tránh refactor, đổi tên, tối ưu "tiện tay".
5. **Kiểm chứng:** Case bug phải đúng; characterization test lân cận vẫn pass; test thủ công luồng nghiệp vụ liên quan.
6. **Rollback plan:** Chuẩn bị cách quay lại trong vài phút: revert commit/tag cũ, tắt feature flag, hoặc script khôi phục config. Xác nhận ai có quyền deploy/revert.
7. **Regression test:** Sau hotfix, thêm test đúng cho case bug để lần sau không tái diễn.

~~~java
// Ví dụ tư duy: khóa hành vi lân cận, rồi sửa đúng chỗ
@Test void calcFee_normalCase_shouldKeepCurrentBehavior() {
    // characterization: ghi lại kết quả "đúng đang có"
    assertEquals(new BigDecimal("1000"), service.calcFee(amount, "VIP"));
}
@Test void calcFee_nullTier_shouldNotThrowNPE_afterFix() {
    // case bug: trước fix có thể NPE, sau fix trả phí mặc định (theo nghiệp vụ)
    assertEquals(new BigDecimal("1500"), service.calcFee(amount, null));
}
~~~

### Ví dụ đời thực
Hệ thống tính phí, không có unit test, bug: khách hạng {{null}} (dữ liệu cũ) gây {{NullPointerException}} → ước tính 120 lỗi/giờ, một phần giao dịch không hoàn tất. Bạn tái hiện với record có {{tier=null}}. Trước khi sửa, bạn viết 3 characterization test cho {{VIP}}, {{NORMAL}}, biên số tiền (đang đúng). Sửa một dòng: coi {{null}} như {{DEFAULT}} theo rule nghiệp vụ đã xác nhận với BA (15 phút trao đổi). Chạy test: 3 test cũ pass, test bug pass. Deploy kèm rollback tag; theo dõi 30 phút: lỗi NPE giảm về 0, không có metric bất thường khác. Tổng thời gian ~90 phút, không refactor.

### Pitfall production
- **Refactor trong hotfix:** Tăng diện tích rủi ro, khó review, khó rollback.
- **Chỉ test đúng case bug:** Bỏ sót side effect lên case khác.
- **Rollback mơ hồ:** "Lát nữa tính" là không chấp nhận; phải có bước cụ thể.
- **Sửa theo phỏng đoán:** Không reproduce/không xác nhận rule nghiệp vụ dễ tạo bug mới (đặc biệt tính tiền).

### Trả lời mẫu khi phỏng vấn
"Khi phải hotfix code không có test, em ưu tiên an toàn. Đầu tiên em tái hiện bug với dữ liệu sát nhất có thể và khoanh vùng ảnh hưởng. Trước khi sửa, em viết characterization test cho vài case lân cận đang đúng để khóa hành vi hiện tại, vì không có test sẵn. Sau đó em tìm nguyên nhân gốc và sửa nhỏ nhất, tránh refactor. Em kiểm chứng case bug, chạy lại các test đặc trưng, và test thủ công luồng liên quan. Em luôn chuẩn bị rollback plan cụ thể như revert tag hoặc feature flag để quay lại trong vài phút nếu có vấn đề. Sau khi ổn định, em bổ sung regression test cho đúng case đã lỗi. Với bug liên quan nghiệp vụ như tính phí, em cũng xác nhận rule với BA trước khi đổi hành vi."

> Senior tip: Trong hotfix, "thay đổi nhỏ + rollback sẵn + kiểm chứng được" quan trọng hơn code đẹp. Characterization test là lưới an toàn tạm thời khi legacy không có test.`,
  follow: [
    'Characterization test khác unit test thông thường thế nào?',
    'Làm sao đảm bảo rollback plan thực tế dùng được?'
  ],
  tags: ['hotfix', 'legacy', 'testing', 'rollback']
},
{
  id: 'scenario-096',
  topic: 'scenario',
  level: 'senior',
  q: 'Quy trình release ở công ty lớn: Change Request, CAB phê duyệt, release window ban đêm, freeze period cuối năm. Bạn chuẩn bị thế nào?',
  a: `**Tóm tắt:** Release ở công ty lớn thường đi theo quy trình quản lý thay đổi: tạo Change Request (CR — hồ sơ mô tả thay đổi), được CAB (Change Advisory Board — nhóm đánh giá tác động thay đổi) phê duyệt nếu cần, triển khai trong release window (khung giờ được phép, thường ban đêm) và tôn trọng freeze period (giai đoạn đóng băng, hạn chế release, ví dụ cuối năm). Chuẩn bị tốt nghĩa là CR rõ ràng, test/rollback cụ thể, thông báo đúng người, thực hiện theo checklist, verify sau deploy, và đóng change có bằng chứng.

### Cơ chế quy trình — vì sao "chậm" nhưng cần
Trong tổ chức lớn, một thay đổi nhỏ có thể ảnh hưởng nhiều hệ thống (tích hợp, batch, báo cáo, đối tác). CAB không kiểm tra từng dòng code; họ kiểm tra **tác động, rủi ro, thời điểm, và khả năng quay lại**. Release window giảm ảnh hưởng người dùng. Freeze period giảm rủi ro khi nhân sự mỏng hoặc giao dịch nhạy cảm. Bỏ quy trình có thể gây sự cố diện rộng và khó truy vết trách nhiệm.

### Chuẩn bị từng bước
1. **Soạn CR đầy đủ:** Mô tả thay đổi và lý do; phạm vi ảnh hưởng (module/user/hệ thống liên quan); rủi ro và cách giảm thiểu; thời gian dự kiến; người thực hiện và người duyệt.
2. **Bằng chứng kiểm thử:** Unit/integration/regression đã chạy; UAT (User Acceptance Test — nghiệp vụ nghiệm thu) nếu quy trình yêu cầu; môi trường đã test (staging gần prod).
3. **Deployment plan (kế hoạch triển khai):** Thứ tự bước (DB script? config? app?), điều kiện tiên quyết, thời gian từng bước, người giám sát.
4. **Rollback plan (bắt buộc, cụ thể):** Điều kiện kích hoạt rollback, bước quay lại (revert artifact version X, chạy script Y, khôi phục config Z), thời gian ước tính, ai quyết định. Phải thực tế, không chung chung.
5. **Communication:** Thông báo support/ops/BA/đội liên quan trước window; kênh liên lạc trong lúc deploy.
6. **Freeze period:** Nếu trùng freeze, thường chỉ change khẩn cấp/được phê duyệt đặc biệt mới đi; chuẩn bị lý do kinh doanh và rủi ro nếu không release.

### Ví dụ đời thực
Thay đổi API tính phí (có ảnh hưởng report), 1 service Java + 1 script DB thêm cột nullable. Release window: 01:00–03:00 thứ Bảy. Bạn nộp CR trước 5 ngày làm việc, kèm: kết quả 42 test pass, UAT ký bởi kế toán, script DB đã chạy trên staging (bảng 12 triệu dòng, {{ALTER}} thêm cột nullable ~40 giây, không lock dài), rollback = deploy lại version {{1.8.3}} và bỏ qua cột mới (code tương thích). CAB hỏi về ảnh hưởng report: bạn cung cấp danh sách job đêm đọc bảng đó. Trong window: deploy 01:10, smoke test 6 luồng chính 01:25, kiểm tra log/metric 01:40, xác nhận support 01:50, đóng CR 02:00. Không có sự cố.

~~~text
[Dev hoàn thành + test] -> [CR + tài liệu] -> [CAB/Phê duyệt]
  -> [Release window] -> [Deploy theo checklist] -> [Smoke test + monitor]
  -> [Đóng CR]  (nếu lỗi: kích hoạt rollback plan)
~~~

### Pitfall production
- **Rollback không thử:** Chưa từng chạy/diễn tập → lúc sự cố mới phát hiện không dùng được.
- **DB change không tương thích ngược:** Deploy app mới/cũ lẫn lộn trong lúc rollout có thể lỗi; ưu tiên thay đổi tương thích (expand/contract).
- **Bỏ qua đội liên quan:** Batch/đối tác/report bị ảnh hưởng mà không được báo.
- **Thay đổi ngoài CR:** "Tiện tay sửa thêm" trong window là nguồn sự cố và vi phạm quy trình.

### Trả lời mẫu khi phỏng vấn
"Khi chuẩn bị release ở công ty lớn, em bắt đầu từ Change Request rõ ràng: mô tả thay đổi, lý do, phạm vi ảnh hưởng, rủi ro, và bằng chứng test gồm cả UAT nếu cần. Em chuẩn bị deployment plan theo từng bước và rollback plan cụ thể, nêu rõ điều kiện rollback, ai quyết định, và mất bao lâu để quay lại. Em trình CAB đúng hạn để họ đánh giá tác động liên hệ thống, không phải để xem từng dòng code. Em tuân thủ release window và freeze period; nếu nằm trong freeze thì chỉ đề xuất đi tiếp khi có lý do khẩn cấp và phê duyệt phù hợp. Trong window em làm theo checklist, chỉ thực hiện phần đã được duyệt, có người giám sát, sau đó smoke test, kiểm tra log và metric, xác nhận với support, rồi đóng CR. Em tránh thay đổi ngoài phạm vi CR vì đó là rủi ro lớn."

> Senior tip: CR tốt là người không đọc code cũng hiểu "ảnh hưởng gì và quay lại thế nào". CAB thường từ chối vì rollback mơ hồ, không phải vì code.`,
  follow: [
    'Sự khác biệt giữa change normal/standard/emergency?',
    'Làm sao thuyết phục khi cần release trong freeze period?'
  ],
  tags: ['release', 'CAB', 'change-management', 'freeze', 'ITIL']
},
{
  id: 'scenario-097',
  topic: 'scenario',
  level: 'senior',
  q: 'Batch job/cron đêm (EOD, đối soát, báo cáo) chạy chậm dần theo năm. Bạn điều tra và tối ưu mà không làm hỏng dữ liệu?',
  a: `**Tóm tắt:** Batch chậm dần theo năm gần như luôn do **khối lượng dữ liệu tăng mà cách truy cập không đổi**: query quét cả bảng, một transaction khổng lồ, đọc hết vào RAM, xử lý tuần tự. Tôi đo từng step để tìm nút thắt, sửa theo thứ tự rủi ro thấp → cao (index, keyset + chunk commit, partition, song song có kiểm soát), và bắt buộc **đối soát số liệu trước/sau** để chứng minh không làm hỏng dữ liệu.

### Vì sao batch "chậm dần" chứ không chậm đột ngột
Một job EOD viết năm đầu cho 2 triệu giao dịch chạy 20 phút. Ba năm sau bảng có 60 triệu dòng. Các nguyên nhân điển hình:
- **Query quét toàn bảng**: điều kiện {{WHERE created_at::date = :day}} bọc cột trong hàm nên không dùng được index → mỗi đêm quét 60 triệu dòng để lấy 80 nghìn dòng.
- **OFFSET pagination**: {{LIMIT 1000 OFFSET 500000}} buộc DB đọc rồi bỏ 500 nghìn dòng; càng về cuối càng chậm (O(n²) tổng thể).
- **Một transaction cho cả job**: giữ lock lâu, sinh nhiều dead tuple, rollback ở phút 90 là mất trắng.
- **Đọc hết vào List**: heap phình, GC full liên tục.
- **Thống kê (statistics) cũ**: planner ước lượng sai số dòng, chọn nested loop thay hash join.

### Bước 1 — Đo trước khi sửa
- Log thời gian từng step (đọc, tính, ghi) và số dòng mỗi step; với Spring Batch đã có sẵn bảng {{BATCH_STEP_EXECUTION}} (read/write count, start/end time).
- Lấy top query theo tổng thời gian bằng {{pg_stat_statements}}, rồi {{EXPLAIN (ANALYZE, BUFFERS)}} trên bản sao dữ liệu production.
- Xem tài nguyên trong khung giờ chạy: CPU, IO wait, lock wait ({{pg_locks}}), GC log của JVM.

### Bước 2 — Sửa theo thứ tự rủi ro
~~~sql
-- Sai: hàm bọc cột -> Seq Scan
SELECT * FROM txn WHERE created_at::date = '2026-11-06';
-- Đúng: range trên cột gốc -> Index Scan
SELECT * FROM txn
WHERE created_at >= '2026-11-06' AND created_at < '2026-11-07'
  AND id > :lastId          -- keyset: nhớ id cuối của chunk trước
ORDER BY id LIMIT 5000;
~~~
- **Keyset + chunk commit**: mỗi chunk 1.000–10.000 dòng một transaction; lưu checkpoint (id cuối) để job chạy lại được từ giữa (restartable).
- **Streaming**: {{JdbcCursorItemReader}} hoặc {{fetchSize}} thay vì {{findAll()}}.
- **Ghi theo lô**: JDBC batch ({{reWriteBatchedInserts=true}} với PostgreSQL), tắt identity generation kiểu IDENTITY nếu dùng Hibernate batch.
- **Partition theo tháng** khi bảng quá lớn: job chỉ chạm partition hôm nay; dữ liệu cũ archive.
- **Song song có kiểm soát**: chia theo range id hoặc theo chi nhánh, 4–8 worker, không vượt pool connection; mỗi phần phải độc lập (không cập nhật cùng dòng).

### Bước 3 — Chứng minh không hỏng dữ liệu
- Chạy bản cũ và bản mới trên cùng snapshot, so **số dòng, tổng tiền, checksum theo chi nhánh**; lệch 1 đồng là chưa được release.
- Job phải **idempotent**: chạy lại một ngày không cộng tiền hai lần (upsert theo khoá nghiệp vụ, hoặc xoá-ghi lại trong cùng transaction của chunk).

### Ví dụ đời thực
Job đối soát EOD của một ví điện tử chạy từ 01:00, SLA xong trước 05:00. Năm thứ ba job mất 3 giờ 40 phút, có đêm vượt SLA. Đo thấy 70% thời gian nằm ở một query lọc {{DATE(created_at)}} (Seq Scan 58 triệu dòng) và OFFSET pagination. Sửa thành range + keyset, thêm index {{(created_at, id)}}, commit mỗi 5.000 dòng, ghi JDBC batch, chia 6 worker theo chi nhánh. Kết quả: **3h40 → 22 phút**, heap đỉnh từ 6GB xuống 900MB; đối soát song song 7 đêm khớp 100% tổng tiền trước khi tắt bản cũ.

### Pitfall
- Tối ưu thẳng trên production mà không có snapshot để so.
- Song song hoá khi các phần đụng cùng dòng → deadlock, sai số dư.
- Tạo index trên bảng lớn bằng {{CREATE INDEX}} thường (khoá ghi) thay vì {{CONCURRENTLY}}.
- Quên rằng job chạy cùng giờ backup/vacuum → tranh IO.

### Trả lời mẫu khi phỏng vấn
"Batch chậm dần theo năm thì tôi nghĩ ngay đến dữ liệu tăng mà cách truy cập vẫn như năm đầu. Tôi không đoán: tôi bật thời gian từng step, lấy top query từ pg_stat_statements và chạy EXPLAIN ANALYZE trên bản sao production. Thường thủ phạm là điều kiện bọc hàm làm mất index, OFFSET pagination, và một transaction khổng lồ. Tôi sửa theo thứ tự rủi ro: viết lại điều kiện theo range, chuyển sang keyset, commit theo chunk vài nghìn dòng có checkpoint để job restart được, đọc bằng cursor và ghi bằng JDBC batch. Nếu vẫn chưa đủ thì mới partition theo tháng hoặc chia worker theo range không chồng nhau. Quan trọng nhất là chứng minh không hỏng dữ liệu: chạy bản cũ và mới trên cùng snapshot, so số dòng, tổng tiền, checksum theo chi nhánh, và job phải idempotent. Ở dự án trước, cách này đưa job đối soát từ gần 4 tiếng xuống khoảng 20 phút."

> Senior tip: thêm cảnh báo "thời gian chạy job tăng > 20% so với trung bình 7 ngày" ngay khi job còn nhanh. Batch hiếm khi chết đột ngột — nó chậm dần cho đến một đêm vượt SLA, và lúc đó bạn sửa trong áp lực.`,
  follow: [
    'Khi nào nên dùng parallel vs sequential cho batch?',
    'Làm sao đảm bảo tính toàn vẹn dữ liệu sau tối ưu?'
  ],
  tags: ['batch', 'EOD', 'performance', 'partition', 'reconciliation']
},
{
  id: 'scenario-098',
  topic: 'scenario',
  level: 'senior',
  q: 'Nâng cấp thư viện có CVE (Log4Shell-style) trên hàng chục service cũ. Bạn tổ chức thế nào?',
  a: `**Tóm tắt:** Với CVE nghiêm trọng trên hàng chục service, tôi chạy nó như một sự cố: **inventory tự động** (SBOM + dependency tree, cả transitive và image), **phân loại theo khả năng bị khai thác**, áp **mitigation tạm** trong vài giờ cho service lộ ra Internet, rồi **nâng cấp tập trung** qua BOM/parent POM, kiểm thử hồi quy và deploy theo đợt, cuối cùng **scan lại để chứng minh** đã hết.

### Vì sao khó hơn "đổi một số version"
- **Transitive dependency**: service không khai báo log4j nhưng kéo vào qua một thư viện khác; nhìn pom.xml là không thấy.
- **Nhiều bản sao**: fat jar, shaded jar (class bị đổi package), base image Docker, agent APM, công cụ chạy cạnh (Logstash, Elasticsearch).
- **Service cũ**: Java 8, Spring Boot 1.x; nâng lên bản vá có khi kéo theo breaking change.
- **Áp lực thời gian**: exploit công khai nghĩa là bị quét trong vài giờ.

### Quy trình theo giờ
1. **0–2 giờ — Inventory**: chạy {{mvn dependency:tree -Dincludes=org.apache.logging.log4j}} hoặc {{gradle dependencyInsight}} trên mọi repo bằng script; tốt hơn là đã có SBOM (CycloneDX) cho mỗi build và tra một lần. Scan image registry bằng Trivy/Grype để bắt cả jar trong image.
2. **2–4 giờ — Đánh giá**: service nào public, service nào có code path bị khai thác (ví dụ log chuỗi do người dùng gửi lên), CVSS và có exploit công khai không.
3. **Mitigation tạm** cho nhóm nguy hiểm: rule WAF chặn payload, tắt tính năng bị lỗi bằng cấu hình nếu nhà cung cấp hướng dẫn, chặn egress ra Internet từ service.
4. **Nâng cấp tập trung**: bump version trong **BOM/parent POM chung** hoặc {{dependencyManagement}}, ép version cả transitive; service không dùng parent chung thì mở PR tự động (Renovate/Dependabot).
5. **Kiểm thử**: build + unit test + smoke test tự động; service quan trọng chạy regression.
6. **Deploy theo đợt**: public trước, internal sau; canary nếu có.
7. **Xác minh**: scan lại toàn bộ artifact và image; dashboard "số service còn vulnerable" về 0 mới đóng sự cố.

~~~xml
<!-- parent POM: ép mọi module dùng bản vá, kể cả transitive -->
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.apache.logging.log4j</groupId>
      <artifactId>log4j-bom</artifactId>
      <version>2.17.1</version>
      <type>pom</type><scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>
~~~

### Ví dụ đời thực
Tháng 12/2021 (Log4Shell), một công ty có 42 service Java. Script quét dependency tree tìm ra 17 service dính log4j-core 2.x, trong đó 6 service public; 4 service khác chỉ phát hiện qua scan image vì jar nằm trong agent và shaded jar. Trong 3 giờ đầu bật rule WAF cho 6 service public; trong 36 giờ nâng lên bản vá qua parent POM, 3 service Spring Boot 1.5 cần sửa cấu hình logging thủ công. Sau sự cố, team bắt buộc sinh SBOM mỗi build và gắn scan vào CI — lần CVE sau inventory chỉ mất 10 phút.

### Pitfall
- Chỉ sửa pom mà quên base image và agent.
- Nâng một service, service khác vẫn kéo bản cũ qua thư viện nội bộ chưa release lại.
- Tắt cảnh báo scan vì "nhiễu" — lần sau CVE thật bị chìm.
- Không có danh sách owner từng service → mất nửa ngày tìm người merge.

### Trả lời mẫu khi phỏng vấn
"Tôi xử lý CVE nghiêm trọng như một incident. Việc đầu tiên là inventory tự động chứ không hỏi từng team: quét dependency tree mọi repo và scan image registry, vì thư viện hay nằm ở transitive, shaded jar hoặc base image. Sau đó tôi phân loại theo khả năng bị khai thác: service public và có code path bị ảnh hưởng thì làm trước, và áp mitigation tạm trong vài giờ như rule WAF hoặc chặn egress. Phần nâng cấp tôi làm tập trung qua BOM hoặc parent POM để ép version cả transitive, service lẻ thì mở PR tự động. Mỗi service phải qua build, test, smoke test rồi deploy theo đợt. Sự cố chỉ đóng khi scan lại toàn bộ artifact cho kết quả bằng không. Bài học dài hạn là sinh SBOM mỗi build và có scan trong CI, để lần sau inventory mất vài phút chứ không phải một ngày."

> Senior tip: thứ quyết định tốc độ phản ứng CVE không phải lúc sự cố xảy ra mà là chuẩn bị trước: parent POM/BOM chung, SBOM mỗi build, Renovate bật sẵn và bảng owner của từng service. Đề xuất những thứ này khi chưa có cháy.`,
  follow: [
    'Làm sao tìm transitive dependency bị ảnh hưởng?',
    'Khi nâng version gây conflict, bạn xử lý thế nào?'
  ],
  tags: ['CVE', 'security', 'dependency', 'upgrade', 'Log4Shell']
},
{
  id: 'scenario-099',
  topic: 'scenario',
  level: 'senior',
  q: 'Thuyết phục quản lý trả nợ kỹ thuật (tech debt): đo lường, đề xuất từng bước thay vì viết lại toàn bộ. Bạn làm thế nào?',
  a: `**Tóm tắt:** Quản lý không mua "code sạch", họ mua **giảm rủi ro và tăng tốc độ giao tính năng**. Tôi đo chi phí của nợ kỹ thuật bằng số liệu kinh doanh (lead time, số sự cố, giờ on-call), chọn **một điểm đau lớn nhất**, đề xuất trả nợ **từng bước** (strangler fig, 15–20% capacity mỗi sprint) với một thử nghiệm nhỏ có đo trước/sau, rồi mới xin mở rộng.

### Vì sao "viết lại toàn bộ" hầu như luôn bị từ chối (và nên bị từ chối)
- Viết lại = nhiều tháng không có tính năng mới, trong khi hệ thống cũ vẫn phải bảo trì song song.
- Code cũ chứa hàng trăm quy tắc nghiệp vụ không có tài liệu; bản mới dễ bỏ sót và gây lỗi mà hệ cũ đã sửa từ lâu.
- Rủi ro dồn vào một lần chuyển đổi (big bang). Strangler fig rải rủi ro ra nhiều bước nhỏ có thể quay lui.

### Bước 1 — Đo chi phí bằng ngôn ngữ của quản lý
| Chỉ số | Lấy từ đâu | Ví dụ |
|---|---|---|
| Lead time thay đổi module X | Jira/Git (ticket mở → deploy) | 9 ngày so với 3 ngày ở module khác |
| Sự cố liên quan | Postmortem, incident tool | 7/12 sự cố P1–P2 năm nay |
| Giờ on-call | Lịch trực, PagerDuty | 30 giờ/tháng |
| Tỉ lệ bug quay lại | Bug tracker | 25% bug sửa xong lại mở |
Quy ra tiền: 30 giờ on-call × chi phí giờ công + thời gian tính năng ra chậm.

### Bước 2 — Chọn một điểm đau, không đưa danh sách 50 món nợ
Dùng ma trận **mức đau × tần suất thay đổi** (code xấu nhưng không ai sửa thì chưa đáng trả). Module vừa nhiều sự cố vừa thay đổi hằng tuần là ứng viên số một.

### Bước 3 — Đề xuất từng bước, có điểm dừng
1. Viết characterization test bao hành vi hiện tại của module.
2. Dựng facade/anti-corruption layer trước module cũ.
3. Chuyển từng luồng sang code mới sau feature flag, so kết quả hai bên (shadow/dual run).
4. Tắt dần luồng cũ khi số liệu ổn.
Xin **15–20% capacity mỗi sprint** thay vì một dự án riêng; mỗi bước có thể dừng mà không bỏ dở.

### Bước 4 — Chứng minh nhỏ trước
Pilot 2–3 tuần cho luồng đau nhất, báo cáo số trước/sau. Một con số thật thuyết phục hơn mười slide.

### Ví dụ đời thực
Module tính phí của một hệ thống cho vay: 1 file 4.000 dòng, thêm một loại phí mất trung bình 8 ngày, 5 sự cố tính sai phí trong 6 tháng (mỗi lần hoàn tiền và xử lý khiếu nại tốn khoảng 40 giờ công). Đề xuất "viết lại" bị từ chối năm trước. Lần này team trình bày số liệu trên, xin 20% capacity trong 2 sprint để tách "phí phạt trả chậm" ra sau feature flag, chạy song song so kết quả 2 tuần. Kết quả: thêm loại phí mới còn 2 ngày, 0 sự cố tính phí trong quý tiếp theo; quản lý tự đề nghị tiếp tục cho các loại phí còn lại.

### Pitfall
- Nói "vi phạm SOLID", "code bẩn" — người nghe không thấy tác động kinh doanh.
- Trả nợ ở module ít ai đụng tới: tốn công nhưng không ai thấy kết quả.
- Không đo baseline trước khi làm → không chứng minh được giá trị.
- Refactor không có test bao quanh → gây sự cố, mất luôn lòng tin.

### Trả lời mẫu khi phỏng vấn
"Tôi không bao giờ mở đầu bằng 'chúng ta cần viết lại'. Tôi đo trước: lead time để thay đổi module đó so với phần còn lại, số sự cố liên quan, giờ on-call và tỉ lệ bug quay lại, rồi quy ra thời gian và tiền. Sau đó tôi chọn đúng một điểm đau, là chỗ vừa hay hỏng vừa thay đổi thường xuyên, chứ không đưa ra danh sách năm mươi món nợ. Đề xuất của tôi luôn là từng bước: viết characterization test, dựng facade, chuyển từng luồng sang code mới sau feature flag, chạy song song để so kết quả, rồi tắt dần code cũ. Tôi xin một tỉ lệ capacity cố định, khoảng 15 đến 20%, và cam kết báo cáo số liệu sau một pilot hai, ba tuần. Ở dự án trước, cách này giúp thời gian thêm một loại phí giảm từ 8 ngày xuống 2 ngày, và chính quản lý đề nghị làm tiếp."

> Senior tip: ghi lại "thuế nợ kỹ thuật" ngay trong ước lượng hằng ngày, ví dụ "task này 3 ngày, trong đó 2 ngày vì module X". Sau vài sprint bạn có dữ liệu thật để thuyết phục mà không cần một cuộc họp riêng.`,
  follow: [
    'Strangler Fig khác Big Bang rewrite thế nào?',
    'Làm sao đo ROI của refactor một cách khách quan?'
  ],
  tags: ['tech-debt', 'strangler-fig', 'refactor', 'ROI']
},
{
  id: 'scenario-100',
  topic: 'scenario',
  level: 'senior',
  q: 'Làm việc với nhiều team/vendor (core banking hãng ngoài, DBA team, hạ tầng): ai chịu trách nhiệm gì, viết yêu cầu sao cho được xử lý?',
  a: `**Tóm tắt:** Làm việc với nhiều team/vendor hiệu quả dựa trên ba thứ: **rõ trách nhiệm** (RACI, ai sở hữu hệ thống nào và SLA của họ), **yêu cầu tự đứng được** (bối cảnh, việc cụ thể, bằng chứng, tác động, tiêu chí xong, hạn), và **theo dõi qua đúng kênh** kèm lộ trình escalate được thống nhất trước — không phải nhắn riêng và chờ.

### Vì sao yêu cầu thường bị "treo"
- Team nhận có hàng chục ticket; ticket thiếu thông tin bị đẩy xuống cuối hàng vì họ phải hỏi lại.
- Không ai biết ai là người quyết định (accountable), nên ticket trôi giữa các team.
- Yêu cầu gửi qua chat cá nhân → không có SLA, người nhận nghỉ phép là mất dấu.
- Vendor (core banking của hãng ngoài) làm theo hợp đồng: việc không ghi rõ trong phạm vi là "out of scope".

### RACI cho một thay đổi điển hình
| Việc | Dev team | DBA | Hạ tầng | Vendor core |
|---|---|---|---|---|
| Thêm index bảng giao dịch | R (viết script, đo) | A (duyệt, chạy) | I | — |
| Mở firewall tới API core | C | — | A/R | I |
| Đổi format message ISO 8583 | C | — | — | A/R (theo change request) |
Thống nhất bảng này ở đầu dự án và đặt trong wiki.

### Mẫu yêu cầu "tự đứng được"
~~~text
Tiêu đề: [PROD] Tạo index cho bảng TRANSACTIONS – API sao kê chậm 5s
Bối cảnh: API GET /statements p95 = 5,2s từ 01/11 (dashboard: link).
Việc cần làm: chạy script đính kèm (CREATE INDEX CONCURRENTLY ... ON transactions(account_id, created_at)).
Bằng chứng: EXPLAIN ANALYZE trước/sau trên staging (Seq Scan 48 triệu dòng -> Index Scan, 5,1s -> 40ms).
Tác động nếu chậm: 3% request timeout, ~200 khiếu nại/ngày.
Rủi ro & rollback: CONCURRENTLY không khoá ghi; rollback = DROP INDEX CONCURRENTLY.
Thời hạn: trong release window 22:00–02:00 thứ Năm.
Xong khi: index ở trạng thái valid, p95 < 500ms trong 24h.
~~~

### Theo dõi và escalate
- Một kênh chính thức (Jira/ServiceNow), chat chỉ để báo "đã tạo ticket X".
- Thống nhất trước **khi nào escalate**: ví dụ P1 không phản hồi sau 30 phút, P3 quá SLA 2 ngày → báo trưởng nhóm của họ, kèm ticket và tác động. Escalate là quy trình, không phải "mách".
- Với vendor: mọi yêu cầu ngoài phạm vi đi qua change request có ước lượng chi phí; ghi biên bản họp và gửi lại để hai bên xác nhận.

### Ví dụ đời thực
Dự án mở API cho ví điện tử tích hợp core banking của hãng nước ngoài: 4 tuần đầu trôi qua chỉ vì firewall và tài khoản test — mỗi ticket bị hỏi lại 2–3 vòng. Team lập RACI, dùng mẫu yêu cầu ở trên và họp đồng bộ 15 phút hai lần mỗi tuần với đại diện từng bên. Thời gian xử lý trung bình một yêu cầu liên team giảm từ **6 ngày xuống 1,5 ngày**; dự án kịp go-live đúng hạn ngân hàng nhà nước yêu cầu.

### Pitfall
- Viết "nhờ anh xem giúp hệ thống chậm" — không có việc cụ thể để làm.
- Gửi cùng một yêu cầu qua 3 kênh → trùng lặp, mất dấu.
- Escalate ngay lần đầu chậm → mất thiện chí lâu dài.
- Thoả thuận miệng với vendor không có biên bản → tranh cãi phạm vi lúc nghiệm thu.

### Trả lời mẫu khi phỏng vấn
"Với nhiều team và vendor, tôi làm rõ ba thứ từ sớm. Thứ nhất là trách nhiệm: tôi lập bảng RACI cho các loại việc thường gặp, như ai viết script, ai duyệt, ai chạy, và SLA phản hồi của mỗi bên. Thứ hai là chất lượng yêu cầu: mỗi ticket tôi gửi đều tự đứng được, có bối cảnh, việc cụ thể, bằng chứng như EXPLAIN hay trace ID, tác động kinh doanh, cách rollback, thời hạn và tiêu chí thế nào là xong. Người nhận không phải hỏi lại thì ticket được xử lý nhanh hơn hẳn. Thứ ba là theo dõi qua đúng kênh, và thống nhất trước khi nào thì escalate, để escalate thành quy trình chứ không thành xung đột. Với vendor, mọi thứ ngoài phạm vi đi qua change request có biên bản. Ở dự án tích hợp core banking, cách làm này giảm thời gian xử lý yêu cầu liên team từ khoảng 6 ngày xuống 1,5 ngày."

> Senior tip: ghi lại thời gian chờ team khác trong mỗi sprint. Khi chờ đợi chiếm 30–40% lead time, con số đó là lý lẽ mạnh nhất để xin một người đầu mối cố định, chứ không phải lời phàn nàn.`,
  follow: [
    'Khi nào nên escalate thay vì chờ?',
    'Làm sao xử lý khi vendor từ chối với lý do "out of scope"?'
  ],
  tags: ['cross-team', 'vendor', 'RACI', 'communication']
},
{
  id: 'scenario-101',
  topic: 'scenario',
  level: 'senior',
  q: 'Cần tài liệu hoá và chuyển giao hệ thống để không trở thành "người duy nhất biết". Bạn làm gì?',
  a: `**Tóm tắt:** Mục tiêu không phải "viết thật nhiều tài liệu" mà là **bus factor > 1**: người khác vận hành, sửa lỗi và ra quyết định được khi tôi vắng. Tôi ưu tiên những tài liệu dùng được lúc 2 giờ sáng (runbook, sơ đồ hệ thống một trang, ADR, bảng cấu hình/bí mật), rồi chuyển giao bằng **shadow → pair → reverse shadow** và kiểm chứng bằng một buổi diễn tập sự cố do người nhận tự xử lý.

### Vì sao "người duy nhất biết" là rủi ro tổ chức
- Mỗi sự cố phải gọi đúng một người → thời gian khắc phục (MTTR) phụ thuộc lịch nghỉ của họ.
- Kiến thức nằm trong đầu thì không được review: quyết định cũ không ai biết vì sao, nên không ai dám đổi.
- Chính bạn bị khoá lại: không được giao việc mới, không nghỉ phép yên được.

### Ưu tiên theo câu hỏi "nếu tôi vắng một tuần"
| Tài liệu | Trả lời câu hỏi | Độ dài hợp lý |
|---|---|---|
| Runbook | Hệ thống hỏng kiểu X thì làm gì, kiểm tra ở đâu, rollback thế nào | 1 trang / loại sự cố |
| Sơ đồ hệ thống | Có những thành phần nào, gọi nhau ra sao, dữ liệu nằm đâu | 1 sơ đồ + chú thích |
| ADR | Vì sao chọn A mà không chọn B | 1 trang / quyết định |
| Cấu hình & bí mật | Cấu hình ở đâu, ai có quyền, xoay vòng secret thế nào | bảng |
| Batch/cron | Lịch chạy, phụ thuộc, chạy lại an toàn thế nào | bảng |
| "Gotchas" | Những chỗ đừng đụng và lý do | danh sách ngắn |
Một mục runbook tốt có: triệu chứng, dashboard/log cần xem (link thật), lệnh kiểm tra, cách xử lý, khi nào escalate và gọi ai.

### Chuyển giao theo ba nấc
1. **Shadow** (1–2 tuần): người nhận ngồi cùng khi bạn xử lý ticket, deploy, sự cố; ghi lại câu hỏi.
2. **Pair**: hai người cùng làm, người nhận cầm bàn phím.
3. **Reverse shadow**: người nhận làm chính, bạn chỉ quan sát và chỉ lên tiếng khi sắp có rủi ro.
Kết thúc bằng **game day**: giả lập một sự cố (tắt replica, làm đầy queue) và người nhận xử lý chỉ bằng runbook. Chỗ nào họ bí là chỗ tài liệu còn thiếu.

### Giữ tài liệu sống
- Tài liệu nằm cạnh code (thư mục {{docs/}} trong repo, review cùng PR) thay vì wiki bị lãng quên.
- Sau mỗi sự cố, postmortem có một action "cập nhật runbook".
- Ghi ngày rà soát gần nhất ở đầu mỗi runbook.

### Ví dụ đời thực
Một dev là người duy nhất hiểu hệ thống đối soát với ngân hàng đối tác; 9/10 sự cố trong năm đều gọi người này, MTTR trung bình 95 phút (phần lớn là thời gian chờ liên lạc được). Trong 6 tuần, dev viết 8 runbook theo 8 loại sự cố đã gặp, một sơ đồ luồng file đối soát, 5 ADR cho các quyết định gây tranh cãi, rồi chuyển giao theo ba nấc cho 2 người. Game day đầu tiên lộ ra thiếu bước xin cấp lại file từ đối tác — bổ sung ngay. Quý sau: 6 sự cố đều do người khác xử lý, MTTR **95 → 30 phút**, và dev đó được chuyển sang dẫn dắt dự án mới.

### Pitfall
- Viết tài liệu mô tả code từng class — lỗi thời sau vài sprint và không ai đọc.
- Viết một lần cuối dự án rồi bỏ — tài liệu sai còn nguy hiểm hơn không có.
- Chỉ đưa link tài liệu mà không chuyển giao thực hành.
- Giữ lại "bí quyết" để thấy mình quan trọng — về lâu dài chính là thứ cản bạn được giao việc lớn hơn.

### Trả lời mẫu khi phỏng vấn
"Tôi coi việc là người duy nhất biết một hệ thống là rủi ro, cho cả công ty và cho chính tôi. Cách tôi làm là tự hỏi: nếu tôi vắng một tuần thì người khác cần gì để vận hành được. Câu trả lời thường là runbook cho từng loại sự cố đã gặp, một sơ đồ hệ thống một trang, vài ADR giải thích vì sao các quyết định quan trọng được đưa ra, và bảng cấu hình, quyền truy cập, lịch batch. Tôi để tài liệu trong repo để review cùng code. Rồi tôi chuyển giao theo ba nấc: người nhận ngồi xem tôi làm, sau đó hai người cùng làm, cuối cùng họ làm chính còn tôi quan sát. Kết thúc là một buổi diễn tập sự cố mà họ chỉ được dùng runbook. Lần gần nhất, cách này đưa thời gian xử lý sự cố từ khoảng 95 phút xuống 30 phút, vì không còn phải chờ gọi được tôi."

> Senior tip: đo bus factor bằng câu hỏi đơn giản trong retro: "sự cố nào tháng này chỉ một người xử lý được?". Danh sách đó chính là backlog chuyển giao, và nó thuyết phục quản lý dành thời gian hơn mọi lời giải thích.`,
  follow: [
    'Sự khác biệt giữa runbook và design doc?',
    'Làm sao đảm bảo tài liệu được dùng thật?'
  ],
  tags: ['documentation', 'knowledge-transfer', 'runbook', 'ADR', 'bus-factor']
},
{
  id: 'scenario-102',
  topic: 'scenario',
  level: 'senior',
  q: 'Phỏng vấn: "Hãy kể kinh nghiệm maintain hệ thống cũ" sao cho thể hiện năng lực Senior mà không nói xấu người khác?',
  a: `**Tóm tắt:** Kể theo **STAR** nhưng đặt trọng tâm vào **cách tôi giảm rủi ro khi thay đổi một hệ thống không ai dám đụng**: đo trước, viết test bao hành vi cũ, thay đổi nhỏ có đường lui, chia sẻ kiến thức — kết thúc bằng con số. Tôn trọng người viết trước ("hệ thống phục vụ tốt nhu cầu lúc đó, nay khối lượng đã khác"), không chê code.

### Interviewer thực sự muốn nghe gì
Câu hỏi về hệ thống cũ là bài kiểm tra **tính chín chắn**, không phải kỹ năng sửa bug:
- Bạn có làm việc an toàn trên production không (đo, test, rollback)?
- Bạn có tự đưa ra cải tiến hay chỉ làm theo ticket?
- Bạn có giúp team (tài liệu, chuyển giao) hay giữ kiến thức cho riêng mình?
- Bạn có thái độ tôn trọng với quyết định của người đi trước không?

### Khung câu chuyện
| Phần | Thời lượng | Nội dung |
|---|---|---|
| S — Situation | ~15 giây | Hệ thống gì, tuổi đời, quy mô, vấn đề đo được |
| T — Task | ~10 giây | Bạn chịu trách nhiệm gì |
| A — Action | ~60 giây | 3–4 hành động cụ thể, dùng "tôi" |
| R — Result | ~15 giây | Con số + điều team nhận được lâu dài |

Các hành động thể hiện level Senior: đo baseline trước khi sửa; viết **characterization test** (test ghi lại hành vi hiện tại, kể cả hành vi lạ) trước khi refactor; thay đổi sau feature flag và chạy song song; viết runbook; đề xuất cải tiến tiếp theo có số liệu.

### Cách nói về code cũ mà không chê
| Tránh | Nói thay bằng |
|---|---|
| "Code cũ rất tệ, không ai hiểu" | "Hệ thống được viết cho khối lượng 10 lần nhỏ hơn hiện nay" |
| "Người trước làm ẩu" | "Thiếu test nên mọi thay đổi đều rủi ro, tôi bắt đầu từ việc bao test" |
| "Tôi phải sửa hết" | "Tôi chọn phần gây nhiều sự cố nhất để cải tiến trước" |

### Ví dụ đời thực (câu trả lời mẫu dạng STAR)
S: hệ thống tính hoa hồng đại lý 8 năm tuổi, mỗi tháng 2–3 khiếu nại tính sai, mỗi lần sửa mất 3–4 ngày vì không có test. T: tôi được giao giảm sai sót và rút ngắn thời gian thay đổi. A: tôi lấy dữ liệu 6 tháng làm bộ characterization test (1.200 trường hợp đầu vào/đầu ra thật); tách phần tính toán ra khỏi phần truy vấn; mỗi thay đổi chạy song song với code cũ 2 tuần và so kết quả; viết tài liệu quy tắc hoa hồng cùng nghiệp vụ. R: khiếu nại tính sai **từ 2–3 xuống 0 trong 2 quý**, thời gian thêm một quy tắc mới **từ 4 ngày xuống 1 ngày**, và hai đồng nghiệp đã tự xử lý thay đổi mà không cần tôi.

### Pitfall
- Kể chung chung "tôi maintain và fix bug" — không có hành động hay kết quả.
- Dùng "chúng tôi" suốt câu chuyện — interviewer không biết phần của bạn.
- Kể quá dài phần bối cảnh, hết giờ trước khi tới phần hành động.
- Nói tiêu cực về team cũ — dấu hiệu đỏ rõ nhất với người phỏng vấn.

### Trả lời mẫu khi phỏng vấn
"Ở công ty trước, tôi nhận một hệ thống tính hoa hồng đại lý đã chạy tám năm. Nó phục vụ tốt lúc đầu, nhưng khối lượng tăng nhiều và không có test, nên mỗi tháng có hai, ba khiếu nại tính sai và mỗi lần sửa mất ba, bốn ngày. Tôi được giao giảm sai sót. Việc đầu tiên tôi làm không phải là sửa, mà là lấy dữ liệu sáu tháng làm bộ characterization test khoảng 1.200 trường hợp, để mọi thay đổi đều được so với hành vi cũ. Sau đó tôi tách phần tính toán khỏi phần truy vấn, và mỗi thay đổi đều chạy song song với code cũ hai tuần trước khi bật hẳn. Tôi cũng ngồi với bên nghiệp vụ để viết tài liệu quy tắc. Kết quả là hai quý liền không còn khiếu nại tính sai, thêm một quy tắc mới chỉ mất một ngày, và hai đồng nghiệp đã tự xử lý thay đổi mà không cần tôi."

> Senior tip: chuẩn bị sẵn 2 câu chuyện về hệ thống cũ — một về cải thiện hiệu năng/độ ổn định, một về chuyển giao kiến thức. Phần lớn câu hỏi behavioral về "legacy", "kỹ thuật nợ", "làm việc với code người khác" đều dùng lại được hai câu chuyện này.`,
  follow: [
    'Làm sao chuyển "sửa bug" thành câu chuyện có impact?',
    'Nên nhấn mạnh gì nhất khi kể kinh nghiệm maintain?'
  ],
  tags: ['interview', 'STAR', 'maintenance', 'experience']
},
{
  id: 'scenario-103',
  topic: 'scenario',
  level: 'senior',
  q: 'Tuần đầu tiên vào dự án mới: làm thế nào để nhanh chóng hiểu luồng nghiệp vụ thay vì chỉ đọc code?',
  a: `**Tóm tắt:** đừng đọc toàn bộ codebase ngay. Hãy đi theo một nghiệp vụ thực tế từ đầu đến cuối (end-to-end), kết hợp với tài liệu, người am hiểu và dữ liệu thật để xây bản đồ luồng trong đầu. Mục tiêu tuần đầu là hiểu được "vì sao" hơn là "toàn bộ how".

### Bối cảnh thực tế
Khi vào dự án ngân hàng về chuyển tiền, nhiều dev mới cố đọc hết service layer và bị ngợp. Cách hiệu quả hơn là chọn 1 luồng ví dụ: "chuyển tiền nội bộ" từ màn hình app mobile → API → validation → tài khoản nguồn → tài khoản đích → ghi sổ cái → thông báo. Từ đó hiểu cả nghiệp vụ lẫn kỹ thuật.

### Lộ trình 5 ngày
1. **Ngày 1 - Định hướng**: Đọc README, sơ đồ kiến trúc cao cấp, glossary nghiệp vụ (từ điển thuật ngữ). Tìm hiểu team, ai là BA/PO/nghiệp vụ chính.
2. **Ngày 2 - Quan sát người dùng**: Ngồi cùng BA/nghiệp vụ chạy thực tế trên môi trường UAT/staging với vai trò người dùng. Ghi lại từng màn hình, từng nút bấm, các tình huống lỗi.
3. **Ngày 3 - Trace end-to-end**: Chọn 1 request cụ thể (vd giao dịch chuyển tiền thành công). Lần theo log với {{traceId}} hoặc {{correlationId}} từ API Gateway → service → database → message broker. Vẽ sequence diagram đơn giản.
4. **Ngày 4 - Hiểu quy tắc nghiệp vụ**: Đọc bảng {{status}} và lịch sử trạng thái (audit/history table). Hỏi tại sao có các trạng thái như PENDING/APPROVED/REJECTED/CANCELLED. Tìm các rule validation, hạn mức, cut-off giờ.
5. **Ngày 5 - Tổng hợp**: Vẽ bản đồ nghiệp vụ (luồng chính + ngoại lệ), ghi glossary cá nhân, liệt kê câu hỏi còn chưa rõ để trao đổi.

### Ví dụ trace thực tế
~~~text
[User] App → POST /transfers {from, to, amount}
  → API Gateway (authN/Z) 
    → TransferService.validate() (hạn mức, số dư)
      → AccountService.checkBalance() (DB: accounts)
        → LedgerService.postEntries() (DB: ledger_entries + balance update)
          → NotificationService.publish(TransferCompleted)
            → SMS/Push
DB audit: transfer_id, status, actor, timestamp
~~~

### Lỗi hay gặp
- **Đọc code trước khi hiểu nghiệp vụ**: Dễ đi sai hướng, không biết tại sao phải code như vậy.
- **Hỏi quá chung chung**: "Hệ thống này làm gì?" khó trả lời. Thay vào đó "Tại sao giao dịch bị từ chối với mã lỗi này?" hiệu quả hơn nhiều.
- **Chỉ nhìn happy path**: Luồng ngoại lệ (không đủ số dư, vượt hạn mức, giờ cut-off) thường quan trọng nhất cho bảo trì.

### Cách trả lời phỏng vấn (English)
*"I focus on tracing one real business flow end-to-end first - from UI to DB. I shadow the BA, read the audit/history tables to understand state transitions, and map exceptions. That way I learn the business rules and the system together, not in isolation."*

### Trả lời mẫu khi phỏng vấn
"Tuần đầu tôi ưu tiên hiểu luồng nghiệp vụ hơn đọc code từ đầu tới cuối. Ngày đầu tôi hỏi tech lead ba luồng quan trọng nhất về doanh thu và rủi ro, ví dụ đặt hàng, thanh toán, hoàn tiền, và xin sơ đồ hệ thống nếu có. Sau đó tôi đi theo từng luồng từ đầu đến cuối: dùng thử sản phẩm trên staging, rồi theo một request thật qua trace hoặc log, từ API, qua service, xuống bảng DB và message Kafka. Tôi đọc schema các bảng chính, các trạng thái và chuyển trạng thái, và ghi lại câu hỏi để hỏi BA hoặc người viết code trong các buổi ngắn. Tôi cũng xem các sự cố gần đây và runbook, vì chúng cho thấy hệ thống hay hỏng ở đâu. Cuối tuần tôi viết lại tài liệu ngắn về các luồng đó và nhờ team sửa, vừa kiểm tra hiểu biết của mình vừa để lại giá trị cho người đến sau. Và tôi nhận một ticket nhỏ ngay tuần đầu để đi hết quy trình deploy."

### Ví dụ đời thực
Tuần đầu vào dự án ngân hàng về chuyển tiền, nhiều developer mới cố đọc toàn bộ service layer và bị ngợp vì không biết bắt đầu từ đâu.

Triệu chứng: đọc code 3 ngày vẫn chưa trả lời được câu hỏi "giao dịch chuyển tiền bị từ chối vì lý do gì, và tiền có bị khóa không?".

Điều tra: chọn một luồng thực tế: "chuyển tiền nội bộ" từ ứng dụng mobile → API Gateway (cổng vào quản lý yêu cầu) → validation → tài khoản nguồn → tài khoản đích → ghi sổ cái (hạch toán) → thông báo. Ngồi cùng BA chạy thử trên môi trường UAT (môi trường mô phỏng trước khi đưa ra khách), ghi từng màn hình và tình huống lỗi. Lần theo một request thành công bằng traceId (mã dùng để theo dõi một yêu cầu qua nhiều hệ thống) từ API Gateway qua service, xuống bảng ledger_entries và balance update, tới thông báo SMS. Vẽ sequence diagram đơn giản và đọc bảng trạng thái (PENDING/APPROVED/REJECTED/CANCELLED) plus bảng lịch sử thay đổi trạng thái.

Nguyên nhân gốc: đọc code trước khi hiểu nghiệp vụ dễ đi sai hướng và không biết tại sao code viết như vậy; chỉ nhìn happy path (luồng đi bình thường) thì bỏ qua luồng ngoại lệ quan trọng nhất cho bảo trì.

Cách xử lý: làm theo lộ trình 5 ngày (định hướng, quan sát người dùng, trace end-to-end theo một yêu cầu thật từ đầu đến cuối, hiểu quy tắc nghiệp vụ, tổng hợp); cuối tuần viết tài liệu ngắn về luồng và nhờ team sửa; nhận một ticket nhỏ ngay tuần đầu để đi hết quy trình deploy.

Kết quả: sau 1 tuần vẽ được bản đồ nghiệp vụ chính + ngoại lệ, hiểu được state machine (máy trạng thái) của giao dịch, và có thể tự xử lý ticket nhỏ từ yêu cầu đến deploy.

> Senior tip: Nguyên tắc vàng là "follow the data". Đừng theo call stack vô tội vạ - hãy theo 1 giao dịch thật trong DB (tìm 1 transfer_id) rồi lần ngược lại xem nó đi qua những service nào. Cách này nhanh gấp 3-5 lần so với đọc toàn bộ service.`,
  follow: [
    'Làm sao phân biệt luồng chính và luồng ngoại lệ khi trace?',
    'Khi nào nên hỏi BA, khi nào nên tự trace qua log/code?'
  ],
  tags: ['onboarding', 'business-flow', 'trace', 'domain-knowledge']
},
{
  id: 'scenario-104',
  topic: 'scenario',
  level: 'senior',
  q: 'Làm thế nào để đọc schema database để nhanh hiểu nghiệp vụ khi vào dự án mới?',
  a: `**Tóm tắt:** schema database thường chứa "ngôn ngữ" nghiệp vụ ẩn giấu bên trong. Thay vì đọc toàn bộ bảng, hãy tập trung vào bảng cốt lõi, quan hệ, trạng thái và bảng lịch sử để tái hiện quy trình kinh doanh mà không cần hỏi mọi thứ.

### Bối cảnh thực tế
Trong dự án bảo hiểm, bảng {{policies}} có cột {{status}} với giá trị PENDING/ACTIVE/LAPSED/CANCELLED/EXPIRED. Bảng {{policy_status_history}} cho thấy chính xác chuỗi chuyển trạng thái. Chỉ từ đó đã hiểu được quy trình phê duyệt hợp đồng mà không cần đọc 100 trang spec.

### Phương pháp đọc schema
1. **Tìm "entity" cốt lõi**: Tìm bảng có nhiều FK trỏ tới, hoặc bảng tên ngắn có ý nghĩa nghiệp vụ (orders, accounts, policies, claims). Thường là aggregate root.
2. **Đọc cột status**: Xem tất cả giá trị có thể có (enum/check constraint), sau đó xem bảng history/audit tương ứng. Đây là state machine ẩn.
3. **Tìm bảng lịch sử**: {{*_history}}, {{audit_*}}, {{*_logs}} cho thấy ai làm gì, khi nào, trạng thái thay đổi thế nào.
4. **Phân tích quan hệ**: FK cho biết business relationship (1:N, N:N). vd {{orders}} - {{order_items}} cho thấy giỏ hàng/đơn hàng.
5. **Đọc dữ liệu thật (chỉ đọc)**: Query vài row mẫu trên UAT/staging để thấy giá trị thực tế, format dữ liệu, có dữ liệu test không.

### Ví dụ trace qua DB (chuyển tiền ngân hàng)
~~~text
accounts (id, account_no, balance, status)
  └─ transfers (id, from_account_id, to_account_id, amount, status, ref_no)
       ├─ transfer_status_history (transfer_id, old_status, new_status, changed_at, changed_by)
       └─ ledger_entries (transfer_id, account_id, dc, amount, entry_group_id)

State machine: PENDING → PROCESSING → COMPLETED / FAILED / REVERSED
Rule: chỉ PENDING mới được cập nhật, COMPLETED là immutable
~~~

### Câu hỏi đặt ra khi đọc
- **Tại sao có cột này?** (vd {{effective_date}} vs {{created_at}})
- **Khi nào thay đổi?** (tìm trigger/log/history)
- **Có rule nào ngầm?** (CHECK constraint, unique, soft delete {{deleted_at}})
- **Dữ liệu có ý nghĩa gì?** (mã, enum mapping)

### Lỗi hay gặp
- **Chỉ đọc DDL**: DDL không cho biết quy trình thực tế. Luôn xem dữ liệu mẫu.
- **Bỏ qua history table**: Thường quan trọng hơn bảng chính để hiểu "cách vận hành".
- **Giả định relationship**: Phải verify bằng data (vd có orphan record không?) trước khi kết luận.

### Trả lời mẫu khi phỏng vấn
"Schema là tài liệu trung thực nhất về nghiệp vụ, vì code có thể nói dối nhưng dữ liệu thì không. Tôi bắt đầu từ các bảng lớn nhất và được ghi nhiều nhất, xem qua thống kê của DB, vì đó thường là thực thể cốt lõi như giao dịch hay đơn hàng. Tôi vẽ quan hệ qua khoá ngoại, hoặc qua các cột kiểu xxx_id nếu không có ràng buộc. Tôi đặc biệt chú ý các cột trạng thái và giá trị thực tế của chúng bằng câu GROUP BY, vì đó là máy trạng thái của nghiệp vụ; các ràng buộc unique, check cho biết quy tắc bất biến; các cột thời gian và cột version cho biết vòng đời và cách chống ghi đè. Tôi theo một bản ghi thật qua các bảng, ví dụ một lệnh chuyển tiền từ lúc tạo tới lúc hạch toán. Những chỗ lạ như cột không dùng, giá trị trạng thái không có trong code, tôi ghi lại thành câu hỏi cho người hiểu nghiệp vụ."

> Senior tip: Một kỹ thuật hiệu quả là "reverse engineer từ transaction". Tìm 1 giao dịch thành công gần nhất trong bảng transaction chính, truy vết tất cả bảng có liên quan qua FK/ref_no, vẽ mối quan hệ. Sau 2-3 giao dịch như vậy bạn sẽ hiểu 80% domain model.`,
  follow: [
    'Làm sao phân biệt bảng nghiệp vụ (master/transaction) và bảng cấu hình?',
    'Tại sao bảng audit/history lại quan trọng hơn nhiều so với tưởng tượng?'
  ],
  tags: ['database', 'schema', 'domain-model', 'state-machine']
},
{
  id: 'scenario-105',
  topic: 'scenario',
  level: 'senior',
  q: 'Event Storming và cách dùng để hiểu domain nhanh khi vào team mới?',
  a: `**Tóm tắt:** Event Storming (do Alberto Brandolini đề xuất) là kỹ thuật workshop để cùng BA/PO/Dev khám phá domain bằng các "domain event" (sự kiện quan trọng đã xảy ra). Khi vào team mới, bạn có thể tổ chức mini Event Storming 1-2 tiếng để nhanh chóng xây glossary chung và hiểu quy trình.

### Tại sao dùng Event Storming?
Thay vì đọc spec dài dòng, cả team cùng dán sticky note lên bảng: ai cũng nói theo ngôn ngữ nghiệp vụ. Kết quả là bản đồ domain mà cả kỹ thuật lẫn nghiệp vụ đều hiểu.

### Các khái niệm cơ bản
- **Domain Event** (màu cam): Sự kiện đã xảy ra trong quá khứ, vd {{PolicyIssued}}, {{ClaimSubmitted}}, {{PaymentAuthorized}}. Viết dạng động từ quá khứ.
- **Command** (màu xanh): Hành động người dùng/hệ thống muốn làm, vd {{SubmitClaim}}, {{ApprovePolicy}}.
- **Actor** (màu vàng): Ai thực hiện command, vd Customer, Underwriter, Admin.
- **Aggregate** (màu vàng nhạt): Nhóm entity xử lý command, vd Policy, Claim.
- **Policy/Rule** (màu tím): Quy tắc nghiệp vụ kích hoạt event, vd "Nếu hạn mức > X thì cần phê duyệt".
- **External System** (màu hồng): Hệ thống bên ngoài, vd Core Banking, SMS Gateway.

### Quy trình mini Event Storming (1-2 giờ)
1. **Chuẩn bị**: Sticky note nhiều màu, bút, bảng trắng/online board. Mời BA, PO, người am hiểu nghiệp vụ.
2. **Brain dump events**: Mỗi người viết domain event quan trọng theo trình tự thời gian. Dán lên bảng không tranh luận ngay.
3. **Sắp xếp timeline**: Sắp xếp theo thứ tự xảy ra thực tế (happy path trước, rồi ngoại lệ).
4. **Thêm commands/actors**: Với mỗi event, hỏi "Ai gây ra? Bằng command gì?" Thêm actors và commands.
5. **Tìm hotspots**: Các chỗ mơ hồ, tranh cãi, ngoại lệ phức tạp - đó là thứ cần đào sâu nhất.
6. **Kết quả**: Timeline domain events, glossary, danh sách câu hỏi cần làm rõ.

### Ví dụ áp dụng (bồi thường bảo hiểm)
~~~text
[Actor: Customer] Command: ReportClaim 
  → Policy (aggregate) check: policy active?
    → Domain Event: ClaimSubmitted
      → Policy: Underwriter review
        → Command: AssessDamage
          → Domain Event: ClaimAssessed (approved/rejected)
            → External: PaymentSystem
              → Domain Event: ClaimPaid
~~~

### Lỗi hay gặp
- **Viết event dạng tương lai**: Sai. Phải là "đã xảy ra" (Issued chứ không phải Issue).
- **Chỉ có dev tham gia**: Thiếu người nghiệp vụ thì kết quả vô dụng.
- **Tranh luận quá sớm**: Giai đoạn 1 chỉ brainstorm, sắp xếp sau.
- **Quá chi tiết kỹ thuật**: Tập trung nghiệp vụ, đừng nói về REST/queue ngay.

### Trả lời mẫu khi phỏng vấn
"Event Storming là một buổi làm việc chung giữa dev, BA, nghiệp vụ, trong đó mọi người viết các sự kiện nghiệp vụ đã xảy ra, ở thì quá khứ như 'đơn đã được đặt', 'thanh toán đã được xác nhận', lên giấy dán màu cam, rồi sắp theo dòng thời gian. Sau đó thêm lệnh gây ra sự kiện, tác nhân, các quy tắc và hệ thống bên ngoài, và đánh dấu những chỗ có tranh cãi hay câu hỏi. Khi vào team mới, tôi dùng một buổi mini một đến hai tiếng cho một luồng quan trọng: nó cho tôi bức tranh toàn cảnh nhanh hơn nhiều so với đọc tài liệu, và quan trọng hơn là làm lộ ra những chỗ mà chính các bên đang hiểu khác nhau. Kết quả là danh sách sự kiện, ranh giới nghiệp vụ có thể thành bounded context, và các câu hỏi mở. Tôi chụp lại và chuyển thành tài liệu ngắn để team cùng giữ."

> Senior tip: Bạn không cần tổ chức Event Storming đầy đủ. Chỉ cần mượn 30 phút của BA/PO, vẽ timeline trên giấy/board với 5-10 event quan trọng nhất của luồng bạn đang tìm hiểu. Thường nhanh hơn đọc cả tài liệu thiết kế.`,
  follow: [
    'Sự khác biệt giữa Event Storming và Sequence Diagram?',
    'Khi nào nên dùng Event Storming thay vì đọc code để hiểu domain?'
  ],
  tags: ['event-storming', 'domain-driven-design', 'workshop', 'business-analysis']
},
{
  id: 'scenario-106',
  topic: 'scenario',
  level: 'senior',
  q: 'Làm thế nào để đặt câu hỏi hiệu quả với BA/PO/nghiệp vụ khi chưa hiểu domain?',
  a: `**Tóm tắt:** Sai lầm lớn nhất là hỏi "Hệ thống này làm gì?". Thay vào đó hãy hỏi theo tình huống cụ thể, dựa trên dữ liệu thật hoặc trace bạn đã làm. Mục tiêu là lấy rule nghiệp vụ, không lấy mô tả chung chung.

### Nguyên tắc đặt câu hỏi
- **Cụ thể hơn chung chung**: Dùng số liệu, ref_no, trạng thái bạn thấy.
- **Hỏi về "tại sao" và "ngoại lệ"**: Nhiều thứ quan trọng nằm ở exception case.
- **Đề xuất trước, hỏi để xác nhận**: Hiệu quả hơn hỏi trống.
- **Ghi lại ngay**: Cập nhật glossary, runbook cá nhân.

### Các dạng câu hỏi hiệu quả
| Tình huống | Câu hỏi sai | Câu hỏi đúng |
|---|---|---|
| Đang trace | "Chuyển tiền hoạt động thế nào?" | "Tại sao transfer #TRF123 này đang ở trạng thái PENDING từ 2 tiếng trước?" |
| Thấy rule | "Có quy tắc gì không?" | "Tại sao giao dịch > 100 triệu VND cần duyệt bổ sung?" |
| Ngoại lệ | "Khi nào bị reject?" | "Trong trường hợp nào hệ thống từ chối chuyển tiền ngay dù số dư đủ?" |
| Cut-off | "Có giờ giới hạn không?" | "Nếu khách chuyển tiền lúc 23:58 có được xử lý ngày hôm đó không?" |
| Trách nhiệm | "Ai phê duyệt?" | "Ai có quyền hủy giao dịch đã PENDING sau khi đã gửi đi?" |

### Chiến lược theo thời gian
- **Tuần 1**: Tập trung "happy path + trạng thái chính". Hỏi BA/nghiệp vụ ngồi cùng.
- **Tuần 2**: Hỏi về ngoại lệ từ ticket production gần đây (incident/ticket). Thường tiết lộ rule quan trọng.
- **Sau đó**: Hỏi khi thực sự cần cho task đang làm, tránh hỏi lan man.

### Ví dụ conversation thực tế
**Bạn:** "Tôi thấy trong bảng transfers có trạng thái AWAITING_APPROVAL. Khi nào nó xuất hiện?"
**BA:** "Khi số tiền > hạn mức theo loại khách hàng. VD khách thường có hạn mức 50tr/ngày, vượt thì cần Approver phê duyệt."
**Bạn:** "Vậy ai là Approver? Có thời gian SLA phê duyệt không?"
**BA:** "Thường là Team Leader, SLA 30 phút trong giờ hành chính..."

### Lỗi hay gặp
- **Hỏi đồng thời quá nhiều**: Chọn 1-2 câu hỏi quan trọng nhất mỗi lần.
- **Không chuẩn bị context**: Luôn show log/DB row/screenshot trước khi hỏi.
- **Quên ghi chú**: Sau cuộc trò chuyện cập nhật ngay vào doc cá nhân/team.

### Ví dụ đời thực
Dev mới hỏi BA: "Logic hoàn tiền là gì?" — câu hỏi quá rộng, nhận lại 20 phút giải thích chung chung. Hỏi lại theo **ví dụ cụ thể**: "Khách mua 3 món tổng 500 nghìn, dùng coupon 50 nghìn, trả lại 1 món giá 200 nghìn — hoàn bao nhiêu và coupon xử lý thế nào?" → BA phải dừng lại kiểm tra và phát hiện chính đội nghiệp vụ có hai cách hiểu khác nhau (chia coupon theo tỉ lệ hay trừ hết vào món còn lại). Quy tắc được chốt bằng văn bản với 4 ví dụ số, thành test case. Sau đó dev dùng mẫu: "Tôi hiểu là … đúng không? Trường hợp … thì sao?" và gửi tóm tắt sau mỗi buổi.

### Trả lời mẫu khi phỏng vấn
"Khi chưa hiểu domain, tôi chuẩn bị trước thay vì hỏi những câu rộng như 'logic này là gì'. Tôi đọc tài liệu và dùng thử sản phẩm trước, rồi hỏi bằng ví dụ cụ thể có con số: trường hợp này thì kết quả là bao nhiêu, và trường hợp biên thì sao. Câu hỏi bằng ví dụ khiến người trả lời phải nghĩ kỹ, và thường làm lộ ra chỗ chính nghiệp vụ chưa thống nhất. Tôi hay nhắc lại cách hiểu của mình để họ xác nhận, hỏi về mục tiêu, vì sao có quy tắc này, ai bị ảnh hưởng nếu sai. Tôi gom câu hỏi lại để hỏi theo đợt, tôn trọng thời gian của họ, và sau mỗi buổi gửi bản tóm tắt kèm ví dụ để xác nhận bằng văn bản; những ví dụ đó sau thành test case."

> Senior tip: Quy tắc "show, don't ask". Thay vì hỏi "luồng thế nào?", hãy vẽ sơ đồ bạn đã trace được và hỏi "Sơ đồ này có đúng với thực tế không? Có gì thiếu sót không?". Cách này tiết kiệm thời gian cho cả hai bên rất nhiều.`,
  follow: [
    'Làm sao hỏi về rule phức tạp mà không làm phiền BA quá nhiều?',
    'Khi BA trả lời mơ hồ, làm thế nào để làm rõ?'
  ],
  tags: ['communication', 'business-analysis', 'questions', 'stakeholder-management']
},
{
  id: 'scenario-107',
  topic: 'scenario',
  level: 'senior',
  q: 'Trong phỏng vấn: "Bạn sẽ làm thế nào để nhanh chóng hiểu domain mới?" - trả lời thế nào để gây ấn tượng Senior?',
  a: `**Tóm tắt:** Trả lời bằng cấu trúc rõ ràng: phương pháp (trace end-to-end), công cụ (log/DB/schema), hợp tác (BA/ops), và kết quả mong muốn. Quan trọng nhất là đưa ví dụ cụ thể có số liệu, đồng thời thể hiện tư duy "học để vận hành được" chứ không chỉ "học để code".

### Cấu trúc trả lời hiệu quả
1. **Mở đầu ngắn**: Nêu quan điểm - hiểu nghiệp vụ quan trọng không kém hiểu kỹ thuật
2. **Phương pháp từng bước**: Trình bày quy trình thực tế
3. **Ví dụ minh họa**: Chọn 1 tình huống cụ thể
4. **Kết quả**: Nêu lợi ích (giảm lỗi, giao tiếp tốt hơn với BA)
5. **Kết luận**: Tóm lại ngắn gọn

### Ví dụ câu trả lời chi tiết
*"Trước hết, tôi không đọc hết codebase. Tôi chọn 1 luồng nghiệp vụ quan trọng nhất - ví dụ chuyển tiền - và lần theo nó từ UI đến DB để vẽ bản đồ. Tôi ngồi shadow BA chạy thực tế trên UAT, đọc bảng history để hiểu state machine. Đồng thời tôi trace log với traceId để xem từng bước. Từ đó tôi xây glossary riêng và liệt kê câu hỏi về ngoại lệ. Mục tiêu là sau tuần đầu, tôi có thể tự giải thích luồng đó cho người khác mà không nhìn code. Cách này giúp tôi hiểu cả 'vì sao' lẫn 'như thế nào', và tránh sửa sai do không hiểu nghiệp vụ."*

### Điểm gây ấn tượng
- **Thực tế**: Nói về trace, log, DB chứ không chỉ "đọc tài liệu"
- **Hợp tác**: Nhấn mạnh làm việc với BA/PO/nghiệp vụ
- **Tư duy Senior**: Quan tâm đến ngoại lệ, vận hành, bảo trì
- **Có ví dụ**: Nếu có kinh nghiệm thật thì kể ngắn gọn
- **English ngắn ở cuối**: Thể hiện khả năng giao tiếp quốc tế

### English version ngắn
*"I start by tracing one real transaction end-to-end - from UI to database. I shadow business users, read audit tables to understand state transitions, and ask targeted questions about edge cases. My goal is to build a mental map of the business rules first, so I can make safe changes later."*

### Lỗi hay gặp khi phỏng vấn
- **Chỉ nói "đọc tài liệu"**: Quá thụ động, không đủ với Senior
- **Chỉ nói "đọc code"**: Cho thấy tư duy kỹ thuật thuần túy
- **Không nhấn mạnh ngoại lệ**: Thiếu chiều sâu
- **Trả lời quá dài**: Giữ 1-2 phút là đủ

### Ví dụ đời thực
Hai ứng viên cùng được hỏi câu này. Ứng viên A: "Em sẽ đọc tài liệu và code thật kỹ" — interviewer ghi "thụ động". Ứng viên B kể một lần thật: vào dự án bảo hiểm, tuần đầu theo một hồ sơ bồi thường từ app tới DB qua trace, tổ chức một buổi Event Storming 2 giờ với nghiệp vụ, phát hiện 3 quy tắc ẩn trong stored procedure, và sau 3 tuần đã tự sửa được lỗi tính tiền bồi thường mà người cũ để lại; còn viết tài liệu luồng mà team dùng cho người mới. Interviewer hỏi tiếp về cách tìm quy tắc ẩn — đúng phần B chuẩn bị kỹ nhất. Bài học: câu trả lời Senior có **phương pháp + một câu chuyện có kết quả đo được + giá trị để lại cho team**.

> Senior tip: Nhà tuyển dụng muốn nghe "bạn có biết cách học nhanh domain mới mà không phụ thuộc vào người hướng dẫn mãi mãi không?". Câu trả lời trên chứng minh bạn chủ động, có phương pháp và quan tâm đến vận hành thực tế.`,
  follow: [
    'Làm sao điều chỉnh câu trả lời theo từng công ty (ngân hàng vs sản phẩm)?',
    'Nên thêm gì nếu chưa có kinh nghiệm vào dự án mới nhiều lần?'
  ],
  tags: ['interview', 'domain-knowledge', 'onboarding', 'communication']
},
{
  id: 'scenario-108',
  topic: 'scenario',
  level: 'senior',
  q: 'Khi join dự án mới, bạn cần hiểu nhanh "business rules" ẩn giấu - cách phát hiện chúng như thế nào?',
  a: `**Tóm tắt:** Business rules thường không nằm trong tài liệu mà ẩn trong validation, state machine, calculation, cut-off time, hạn mức. Để tìm chúng nhanh, bạn phải kết hợp trace code, đọc constraint DB, xem log lỗi thật và hỏi đúng người.

### Nguồn tìm business rule ẩn
1. **Validation trong code**: Nếu/else, annotation {{@Valid}}, custom validator. Đọc các service.validate() method.
2. **Database constraint**: CHECK, UNIQUE, trigger - thường enforce rule quan trọng.
3. **State machine**: Chuyển trạng thái cho thấy quy trình phê duyệt, điều kiện được phép.
4. **Lỗi thực tế**: Xem log production/staging với error code - mỗi error thường tương ứng 1 rule.
5. **Calculation logic**: Tính phí, lãi, tỷ giá thường chứa rule phức tạp.

### Phương pháp phát hiện
- **Trace validation**: Chọn 1 request bị reject (tìm log có ERROR/VALIDATION_FAILED). Lần ngược code xem kiểm tra gì.
- **Đọc constraint**: {{SELECT * FROM information_schema.check_constraints}} hoặc xem DDL file.
- **Phân tích history**: Xem {{*_history}} table với nhiều record để thấy pattern.
- **Hỏi về edge case**: "Khi nào giao dịch bị từ chối dù đủ điều kiện cơ bản?"

### Ví dụ thực tế (hạn mức chuyển tiền)
~~~text
Tìm thấy trong TransferService:
if (amount > dailyLimit && !customer.isVip) throw LimitExceeded
if (isAfterCutoff && !isSameDayAllowed) throw CutoffExceeded
if (toAccount.isFrozen) throw AccountFrozen

Rules:
- Hạn mức theo hạng khách hàng
- Cut-off 17:00 giờ hành chính
- Tài khoản đích bị phong tỏa không cho nhận
~~~

### Ghi chép business rules
Tạo glossary riêng với format: {{Rule ID}} | {{Mô tả}} | {{Điều kiện}} | {{Hành động}} | {{Nguồn}}. VD:
- BR-001: Chuyển tiền > 100tr cần duyệt (Nguồn: TransferService.java:45)
- BR-002: Sau 17:00 không xử lý ngay (Nguồn: config + code)

### Lỗi hay gặp
- **Tin hoàn toàn vào spec**: Thường spec đã cũ, code mới nhất là nguồn đúng hơn.
- **Chỉ đọc happy path**: Validation nằm rải rác, dễ bỏ sót.
- **Không ghi lại**: Sau 1 tháng quên mất rule đã tìm được.

### Trả lời mẫu khi phỏng vấn
"Quy tắc nghiệp vụ ẩn thường nằm ở những chỗ ít ai nhìn: điều kiện if lồng nhau trong code cũ, stored procedure và trigger trong DB, ràng buộc và giá trị mặc định của bảng, file cấu hình và bảng tham số, job batch chạy đêm, và cả trong đầu những người lâu năm. Tôi phát hiện chúng bằng vài cách. Đọc dữ liệu thật: phân phối giá trị của các cột trạng thái hay số tiền thường lộ ra quy tắc như hạn mức hay làm tròn. Đọc lịch sử sự cố và ticket bug, vì nhiều quy tắc sinh ra từ một sự cố trong quá khứ. Viết characterization test với dữ liệu thật để ghi lại hành vi hiện tại. Và hỏi người vận hành, CSKH những trường hợp đặc biệt họ hay xử lý tay. Mỗi quy tắc tìm được tôi ghi lại kèm nguồn, ví dụ và người xác nhận, trong một tài liệu chung của team."

> Senior tip: Rule vàng là "code là specification đang chạy". Nếu spec và code khác nhau, hãy tin code (sau khi xác nhận với BA). Và đừng quên ghi nguồn (file:line) để dễ tra sau này.`,
  follow: [
    'Làm sao phân biệt business rule cốt lõi vs validation kỹ thuật?',
    'Khi phát hiện rule mâu thuẫn giữa spec và code, xử lý thế nào?'
  ],
  tags: ['business-rules', 'validation', 'domain-discovery', 'onboarding']
},
  {
    id: 'scenario-109',
    topic: 'scenario',
    level: 'senior',
    q: 'Interviewer ở Ninjavan hỏi: thiết kế Feature Flags bật/tắt feature cho một tập user, tối ưu performance — bạn làm thế nào?',
    a: `**Tóm tắt:** Feature Flag (cờ tính năng — công tắc bật/tắt một tính năng trong code mà không cần deploy lại) cho phép rollout dần theo user/segment; thiết kế tối ưu bằng cách lưu cấu hình ở DB (nguồn sự thật), cache Redis + in-memory SDK để evaluate < 1ms, và dùng hash bucket để chia traffic ổn định.

### Bối cảnh thực tế
Hệ thống logistics (giống Ninjavan) có 50k RPS (request mỗi giây). Team muốn:
- Bật tính năng "tính phí mới" cho 5% user trước, sau đó tăng dần.
- A/B test (thử nghiệm so sánh 2 phiên bản) để đo conversion.
- Kill switch (công tắc tắt khẩn cấp) khi tính năng mới gây lỗi p99 latency (độ trễ ở mức 99% request) tăng vọt.

Yêu cầu: evaluate flag không được thêm quá 1–2ms vào mỗi request, và không được gọi DB mỗi lần.

### Cơ chế hoạt động từng bước
1. **Mô hình dữ liệu** (DB là source of truth — nguồn dữ liệu chính xác nhất):
   - {{flags(id, key, description, default_value, rollout_percent, rules_json, owner, expires_at, updated_at)}}
   - {{flag_overrides(flag_id, target_type, target_id, value)}} để ép bật/tắt cho user/segment cụ thể.
2. **Đọc cấu hình nhanh**: SDK (thư viện nhúng vào app) giữ cache in-memory (trong RAM của tiến trình). Mỗi 10–30s poll DB hoặc nhận invalidate qua Redis Pub/Sub (cơ chế publish/subscribe — kênh thông báo realtime). Không gọi DB trong request path.
3. **Evaluate (quyết định bật/tắt)**:
~~~java
// Hash ổn định: cùng userId luôn rơi vào cùng bucket
int bucket = Math.floorMod(userId.hashCode(), 100); // 0..99, hashCode ổn định cho String
boolean on = (bucket < flag.rolloutPercent());
if (override != null) on = override; // ép theo user/segment
~~~
4. **Segment rules** (nhóm người dùng): đánh giá theo thuộc tính (country, plan, appVersion). Thứ tự ưu tiên: override cụ thể > rule segment > rollout % > default.

### Luồng tổng quan
~~~seq
title: Evaluate Feature Flag (không chạm DB trong request)
actors: Client | App | SDK Cache | Redis
Client -> App: request (userId=U123)
App -> SDK Cache: isEnabled("new_fee", U123)
SDK Cache -> SDK Cache: hash bucket + rules (RAM)
SDK Cache --> App: true/false (<1ms)
App --> Client: response theo flag
note SDK Cache..Redis: refresh 30s hoặc pub/sub invalidate
~~~

### Bảng trade-off
| Phương án | Ưu | Nhược | Khi dùng |
| DB mỗi request | Luôn mới nhất | +5–20ms, DB quá tải | Không dùng ở scale lớn |
| Redis cache + TTL | Nhanh (~1ms), đơn giản | Trễ tối đa TTL khi đổi | Phổ biến nhất |
| In-memory SDK + pub/sub | <0.1ms, không hit Redis | Phức tạp hơn, eventual consistency (nhất quán sau một khoảng trễ) | High traffic, cần tối ưu |
| SaaS (LaunchDarkly/Unleash) | Đầy đủ UI, audit, targeting | Chi phí, phụ thuộc bên thứ 3 | Team muốn tốc độ triển khai |

### Pitfall thực tế trên production
- **Flag tích tụ thành nợ kỹ thuật**: hàng trăm flag cũ không ai dọn, code rẽ nhánh chằng chịt. Quy tắc: mỗi flag phải có {{owner}} và {{expires_at}}; job cảnh báo flag quá hạn.
- **Không audit**: ai bật/tắt lúc nào? Bắt buộc ghi audit log (flag_key, actor, old/new, time) để truy vết khi sự cố.
- **Hash không ổn định khi đổi thuật toán/seed**: user đang ở nhóm A bỗng nhảy sang B giữa phiên → trải nghiệm vỡ. Dùng hash ổn định (Murmur3) và không đổi seed.
- **Evaluate khác nhau giữa các service**: nếu mỗi service tự implement, kết quả lệch. Chuẩn hóa bằng SDK chung.

> Senior tip: Xem feature flag là "technical debt có chủ đích" — đặt expiry date và owner ngay khi tạo. Ở 50k RPS, in-memory cache + pub/sub invalidate giúp p99 evaluate < 0.5ms; dùng Redis làm lớp chia sẻ cấu hình, không đặt Redis trong hot path của từng request nếu có thể tránh.`,
    follow: ['Làm sao rollout an toàn 1% → 100%?', 'Kill switch khác feature flag thế nào?'],
    tags: ['feature-flag', 'system-design'],
    refs: [{ type: 'article', title: 'voz interview review Ninjavan', url: 'https://voz.vn/t/event-box-cntt-2023-chia-se-kinh-nghiem-phong-van.694369/page-1#post-22629633' }]
  },
  {
    id: 'scenario-110',
    topic: 'scenario',
    level: 'senior',
    q: 'Interviewer hỏi: API bị spam, làm sao rate limit hiệu quả ở scale lớn?',
    a: `**Tóm tắt:** Rate limiting (giới hạn tốc độ — chặn client gửi quá nhiều request trong một khoảng thời gian) nên đặt ở tầng gateway và dùng thuật toán Token Bucket hoặc Sliding Window trên Redis (kho key-value trong RAM, dùng làm bộ đếm chia sẻ giữa nhiều instance) để atomic (thao tác không bị xen ngang); trả HTTP 429 kèm {{Retry-After}} để client biết khi nào thử lại.

### Bối cảnh thực tế
API public nhận 20k RPS bình thường, nhưng một bot gửi 2k RPS vào endpoint {{/login}} và {{/otp}} → CPU tăng, DB connection pool cạn, user thật bị timeout. Mục tiêu: chặn abuse (lạm dụng) mà không ảnh hưởng user hợp lệ.

### Cơ chế thuật toán (từng bước)
1. **Token Bucket (xô token)**: tưởng tượng một xô chứa tối đa N token, mỗi giây nạp thêm R token. Mỗi request lấy 1 token; hết token → từ chối. Cho phép burst (bùng nổ ngắn) nhưng giới hạn tốc độ trung bình.
2. **Fixed Window (cửa sổ cố định)**: đếm request trong mỗi phút (vd 10:00:00–10:00:59). Đơn giản nhưng có lỗi burst ở biên: 100 req cuối phút 1 + 100 req đầu phút 2 = 200 req trong 2 giây.
3. **Sliding Window (cửa sổ trượt)**: tính theo khoảng thời gian trượt (vd 60 giây gần nhất) → mượt hơn, nhưng tốn bộ nhớ hơn (lưu timestamp từng request hoặc dùng 2 counter).

~~~java
// Fixed window đơn giản với Redis (atomic bằng Lua nếu cần chính xác)
String key = "rl:user:" + userId + ":" + (System.currentTimeMillis() / 60000);
Long count = redis.incr(key);              // tăng 1, atomic
if (count == 1) redis.expire(key, 60);     // đặt TTL 60s cho key mới
if (count > 100) throw new TooManyRequests(); // quá 100 req/phút
~~~

### Triển khai ở scale lớn
- **Đặt ở đâu**: API Gateway / reverse proxy (Nginx, Kong, Envoy) chặn sớm nhất, trước khi vào app/DB. App layer chỉ làm rate limit bổ sung theo business (vd giới hạn gửi OTP/user).
- **Key phân loại**: {{userId}} (đã đăng nhập), {{apiKey}} (đối tác), {{ip}} (chưa đăng nhập). Kết hợp nhiều tầng: global + per-user + per-endpoint.
- **Distributed (nhiều instance)**: dùng Redis chung + Lua script để {{INCR+EXPIRE}} atomic, tránh race (2 instance cùng đọc count cũ).

### Bảng trade-off
| Thuật toán | Ưu | Nhược | Phù hợp |
| Fixed window | Rất đơn giản, ít memory | Burst ở biên cửa sổ | Endpoint ít nhạy cảm |
| Sliding window log | Chính xác, mượt | Tốn memory (lưu từng req) | Traffic vừa |
| Sliding window counter | Mượt, tiết kiệm | Xấp xỉ | Phổ biến production |
| Token bucket | Cho phép burst có kiểm soát | Tune refill/rate phức tạp | API cần burst hợp lệ |

### Pitfall thực tế trên production
- **Rate limit chỉ ở app, nhiều instance**: mỗi instance tự đếm → tổng thực tế = limit × số instance. Phải centralize (tập trung) ở gateway/Redis.
- **Key theo IP sau NAT (mạng chia sẻ IP)**: cả văn phòng/công ty dùng chung 1 IP bị chặn nhầm. Với user đã login, ưu tiên key theo {{userId}}/{{apiKey}}.
- **Không trả {{Retry-After}}**: client retry ngay lập tức → tạo "retry storm" làm tệ hơn. Luôn trả 429 + header {{Retry-After}} (giây) và hỗ trợ exponential backoff (lùi thời gian thử lại theo cấp số nhân).
- **Quên whitelist**: health-check, partner quan trọng, webhook callback bị chặn → gián đoạn dịch vụ.

> Senior tip: Đặt limit khác nhau theo hành vi: read (GET) rộng hơn write (POST), endpoint nhạy cảm (login/OTP) chặt hơn (vd 5/phút/user). Ở 20k RPS, dùng Redis Cluster + Lua script; theo dõi metric {{rate_limit_rejected_total}} để tune — nếu user thật bị chặn nhiều, limit đang quá chặt.`,
    follow: ['Rate limit theo tier free/pro thế nào?', 'Throttling vs rate limiting?'],
    tags: ['rate-limit', 'redis', 'api']
  },
  {
    id: 'scenario-111',
    topic: 'scenario',
    level: 'senior',
    q: 'Interviewer hỏi: đặt vé concert, 2 user cùng lúc mua ghế cuối — xử lý concurrency thế nào?',
    a: `**Tóm tắt:** Khi 2 user cùng mua ghế cuối, phải đảm bảo chỉ 1 người thành công bằng lock ở mức DB (pessimistic {{SELECT FOR UPDATE}} hoặc optimistic lock bằng cột {{version}}) kết hợp trạng thái ghế có TTL (giữ chỗ tạm thời) và idempotency key (khóa chống gửi trùng request) để tránh trừ tiền 2 lần.

### Bối cảnh thực tế
Sự kiện concert mở bán 10:00, 50k user cùng vào, một ghế {{A1}} còn đúng 1. Hai request gần như đồng thời cùng đọc "AVAILABLE" rồi cùng ghi "SOLD" → bán trùng (oversell), hậu quả hoàn tiền + khiếu nại.

### Cơ chế bên trong và vì sao
Vấn đề gốc là **race condition** (đua tranh — kết quả phụ thuộc thứ tự thực thi không kiểm soát). Cần biến thao tác "kiểm tra còn trống → giữ ghế" thành một đơn vị an toàn.

1. **Pessimistic lock (khóa bi quan — khóa trước rồi làm)**:
~~~sql
BEGIN;
-- Khóa dòng ghế; transaction khác chạm dòng này sẽ CHỜ đến khi commit/rollback
SELECT status, version FROM seats WHERE id = 42 FOR UPDATE;
-- Kiểm tra: nếu vẫn AVAILABLE thì giữ
UPDATE seats SET status = 'HELD', hold_until = NOW() + INTERVAL '5 min', holder = :user
WHERE id = 42 AND status = 'AVAILABLE';
COMMIT;
~~~
{{FOR UPDATE}} lấy exclusive lock (khóa độc quyền) trên row. Request thứ 2 bị block; khi request 1 commit, request 2 đọc lại thấy {{HELD}} → trả "ghế đã có người giữ".
2. **Optimistic lock (khóa lạc quan — không khóa, kiểm tra khi ghi)**: thêm cột {{version}}. Không ai bị chờ; ai ghi trước thắng.
~~~sql
-- Đọc: status=AVAILABLE, version=7
UPDATE seats SET status='HELD', version=version+1, holder=:user
WHERE id=42 AND status='AVAILABLE' AND version=7;
-- affected rows = 1 → thành công; = 0 → có người khác đổi trước, báo conflict
~~~
3. **Hold với TTL (time-to-live — thời gian sống)**: chuyển {{AVAILABLE → HELD}} (giữ chỗ 5 phút) thay vì bán thẳng. Job định kỳ hoặc check {{hold_until}} để trả ghế về {{AVAILABLE}} nếu không thanh toán kịp.

### Luồng tổng quan
~~~seq
title: Giữ ghế cuối (pessimistic lock)
actors: UserA | API | DB | UserB
UserA -> API: chọn ghế A1
API -> DB: SELECT FOR UPDATE (lock row A1)
DB --> API: AVAILABLE
UserB -> API: chọn ghế A1
API -> DB: SELECT FOR UPDATE (chờ lock)
API -> DB: UPDATE A1 = HELD (UserA)
API --> UserA: giữ chỗ 5 phút
DB --> API: trả lock, thấy HELD
API --> UserB: ghế đã có người giữ
~~~

### Bảng trade-off
| Cách | Ưu | Nhược | Khi dùng |
| Pessimistic (FOR UPDATE) | An toàn tuyệt đối, logic đơn giản | Throughput thấp, có thể deadlock/timeout khi hot row | Ghế cuối, số lượng rất ít, cần chắc chắn |
| Optimistic (version) | Không block, throughput cao | Conflict nhiều khi tranh chấp cao → retry storm | Tranh chấp vừa phải |
| Distributed lock (Redis SETNX) | Giảm tải DB | Phức tạp, cần xử lý lock hết hạn giữa chừng | Kết hợp, không thay thế DB truth |
| Queue tuần tự hóa | Không race | Độ trễ cao, UX chờ | Flash sale cực lớn |

### Pitfall thực tế trên production
- **Deadlock khi giữ nhiều ghế**: user chọn A1,A2; user khác chọn A2,A1 → mỗi bên giữ 1 lock chờ lock kia. Cách tránh: luôn lock theo thứ tự {{id}} tăng dần trong cùng transaction.
- **Ghế "ma" (HELD mãi)**: user giữ chỗ rồi thoát app, không thanh toán. Bắt buộc có TTL + job release ({{WHERE status='HELD' AND hold_until < NOW()}}) và release khi payment fail/timeout.
- **Double charge (trừ tiền 2 lần)**: client retry vì mạng chậm. Dùng {{idempotency key}} (client gửi key duy nhất cho mỗi lần checkout; server lưu kết quả, request trùng trả kết quả cũ) ở bước thanh toán.
- **Tin cache "còn ghế"**: UI hiển thị từ cache → user bấm mua mới phát hiện hết. Cache chỉ để hiển thị, quyết định cuối cùng luôn dựa trên DB trong transaction.

> Senior tip: Với ghế cuối (tranh chấp cực cao trên đúng 1 row), pessimistic {{FOR UPDATE}} + TTL hold đơn giản và an toàn nhất. Đo conflict/lock-wait time; nếu p99 lock-wait > 500ms thì cân nhắc queue. Luôn thêm idempotency key ở payment và ghi audit log (ai giữ/mua ghế nào, lúc nào) để đối soát.`,
    follow: ['Idempotency key thiết kế thế nào?', 'Làm sao tránh double charge?'],
    tags: ['concurrency', 'locking', 'booking']
  },
  {
    id: 'scenario-112',
    topic: 'scenario',
    level: 'mid',
    q: 'Interviewer hỏi: giải thích index trong DB, B-Tree vs Binary Tree, kiểm tra cột đã index chưa?',
    a: `**Tóm tắt:** Index (chỉ mục — cấu trúc dữ liệu phụ giúp DB tìm dòng nhanh mà không quét cả bảng, giống mục lục sách) thường dùng B-Tree vì nó cân bằng và hỗ trợ cả tìm bằng (=) lẫn khoảng (<, >, BETWEEN, ORDER BY). Kiểm tra index bằng {{EXPLAIN (ANALYZE)}} và tra catalog hệ thống ({{pg_indexes}}, {{SHOW INDEX}}).

### Vì sao cần index (cơ chế từng bước)
Bảng {{orders}} có 10 triệu dòng, query {{WHERE user_id = 123}}:
- **Không index**: DB phải sequential scan (quét tuần tự) 10 triệu dòng → đọc rất nhiều trang đĩa, chậm (giây).
- **Có index B-Tree trên {{user_id}}**: DB đi từ gốc cây xuống lá theo giá trị 123 (vài bước, vì cây nông), lấy con trỏ (row pointer/ctid) tới đúng dòng → chỉ đọc vài trang (ms).

### B-Tree là gì, khác Binary Tree (cây nhị phân) thế nào
- **B-Tree (Balanced Tree — cây cân bằng bậc cao)**: mỗi node chứa **nhiều key** và nhiều con; mọi lá ở cùng độ sâu (cân bằng). Vì dữ liệu DB nằm trên đĩa (I/O theo trang 4KB/8KB), một node chứa nhiều key giúp **giảm số lần đọc đĩa**. Tìm kiếm O(log_m N) với m lớn → cây rất nông (hàng chục triệu dòng chỉ ~3–4 tầng).
- **Binary Tree (cây nhị phân, mỗi node 2 con)**: nếu dữ liệu vào tăng dần có thể lệch thành một đường thẳng (degenerate) → O(N). Cây cân bằng (AVL/Red-Black) tốt trong RAM, nhưng mỗi node ít key → quá nhiều lần đọc đĩa khi dữ liệu lớn.

~~~text
B-Tree (đơn giản hóa, bậc 3) trên user_id:
            [ 50 | 100 ]
           /     |      \
     [10|30]   [60|80]  [110|150]   <- node lá trỏ tới row
Tìm user_id=80: 50?100? -> giữa -> 60?80? -> tới row (3 bước)
~~~

### Kiểm tra cột đã index chưa
~~~sql
-- PostgreSQL: xem kế hoạch thực thi (có dùng index không, tốn bao lâu)
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 123 AND status = 'PAID';

-- Liệt kê index trên bảng
SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders';
~~~
~~~sql
-- MySQL
EXPLAIN SELECT * FROM orders WHERE user_id = 123;
SHOW INDEX FROM orders;
~~~
Trong {{EXPLAIN}}, thấy {{Index Scan}} / {{Bitmap Index Scan}} (PG) hoặc {{ref/range}} dùng key (MySQL) là index đang hoạt động; thấy {{Seq Scan}} / {{ALL}} là đang quét hết bảng.

### Bảng trade-off: khi nào nên / không nên tạo index
| Tình huống | Nên index? | Vì sao |
| Cột hay lọc/join/sort (WHERE, JOIN, ORDER BY) | Có | Giảm dòng phải đọc |
| Bảng nhỏ (vài nghìn dòng) | Thường không | Seq scan trong RAM còn nhanh, index thêm chi phí |
| Cột cardinality thấp (ít giá trị phân biệt, vd boolean, gender) | Thường không | Trả về quá nhiều dòng, planner bỏ qua index |
| Bảng ghi rất nhiều (INSERT/UPDATE liên tục) | Cân nhắc | Mỗi lần ghi phải cập nhật mọi index → chậm write |
| Cột hay bọc hàm {{WHERE lower(email)=...}} | Cần index hàm | Index trên {{email}} thường không dùng được |

### Pitfall thực tế trên production
- **Index "có" nhưng không được dùng**: do implicit cast ({{WHERE user_id = '123'}} khi cột là int), bọc hàm lên cột, hoặc so sánh không khớp kiểu collation. Luôn xác minh bằng {{EXPLAIN ANALYZE}}.
- **Tạo quá nhiều index**: query read nhanh hơn nhưng {{INSERT/UPDATE/DELETE}} chậm rõ rệt, tốn dung lượng. Nguyên tắc: chỉ index cột phục vụ query thật, theo dõi index không ai dùng ({{pg_stat_user_indexes}}).
- **Composite index (chỉ mục nhiều cột) sai thứ tự**: index {{(a,b)}} giúp {{WHERE a=?}} và {{WHERE a=? AND b=?}}, nhưng **không** giúp {{WHERE b=?}} đứng một mình (quy tắc leftmost prefix — tiền tố trái).
- **Quên {{ANALYZE}}**: thống kê cũ khiến planner chọn nhầm plan (bỏ index). Sau import dữ liệu lớn, chạy {{ANALYZE}}.

> Senior tip: Index là đánh đổi read/write — đừng tạo theo cảm giác. Quy trình: lấy query chậm từ slow log/pg_stat_statements → {{EXPLAIN (ANALYZE, BUFFERS)}} → thêm đúng 1 index phục vụ query đó → đo lại. Trên bảng chục triệu dòng, một index đúng có thể đưa query từ ~3s xuống < 20ms.`,
    follow: ['Composite index thứ tự cột?', 'Index covering là gì?'],
    tags: ['index', 'database', 'btree']
  },
  {
    id: 'scenario-113',
    topic: 'scenario',
    level: 'senior',
    q: 'Interviewer hỏi: isolation levels khác nhau thế nào, locking level ra sao?',
    a: `**Tóm tắt:** Isolation level (mức cô lập — quy tắc kiểm soát transaction này nhìn thấy thay đổi của transaction khác như thế nào) gồm 4 mức từ thấp đến cao (Read Uncommitted, Read Committed, Repeatable Read, Serializable), đánh đổi giữa tính đúng và hiệu năng. Locking (cơ chế khóa — giữ tài nguyên để tránh ghi đè nhau) là cách DB hiện thực hóa mức cô lập, gồm shared/exclusive lock ở mức row hoặc table.

### Bối cảnh thực tế
Hệ thống chuyển tiền: transaction T1 đọc số dư 10 triệu, T2 cũng đọc 10 triệu và rút 8 triệu rồi commit, T1 trừ 5 triệu dựa trên số dư cũ → số dư âm. Đây là hậu quả của cô lập không đủ.

### Ba hiện tượng bất thường (vì sao cần isolation)
- **Dirty read (đọc bẩn)**: đọc dữ liệu mà transaction khác vừa ghi nhưng **chưa commit** (có thể bị rollback).
- **Non-repeatable read (đọc không lặp lại)**: cùng 1 query trong 1 transaction, chạy 2 lần cho kết quả khác vì transaction khác đã {{UPDATE/DELETE}} và commit giữa chừng.
- **Phantom read (đọc bóng ma)**: cùng 1 query khoảng ({{WHERE amount > 100}}), lần 2 thấy thêm **dòng mới** vì transaction khác {{INSERT}} và commit.

### Bảng isolation level
| Level | Dirty read | Non-repeatable | Phantom | Hiệu năng |
| Read Uncommitted | Có thể | Có thể | Có thể | Cao nhất (hiếm dùng) |
| Read Committed (mặc định PostgreSQL) | Không | Có thể | Có thể | Tốt, phổ biến |
| Repeatable Read (mặc định MySQL/InnoDB) | Không | Không | Có thể* | Trung bình |
| Serializable | Không | Không | Không | Thấp nhất, an toàn nhất |

*MySQL InnoDB ở Repeatable Read dùng MVCC (đa phiên bản — mỗi transaction thấy snapshot riêng) + gap lock (khóa khoảng trống giữa các key) nên thực tế chặn được nhiều trường hợp phantom; PostgreSQL RR cũng dùng snapshot nhưng phantom theo chuẩn SQL vẫn có thể bàn luận tùy kịch bản.

### Locking level (cơ chế khóa)
- **Shared lock (S, khóa chia sẻ)**: cho phép đọc, chặn ghi. Nhiều transaction có thể cùng giữ S.
- **Exclusive lock (X, khóa độc quyền)**: cho ghi; chặn cả S và X khác. {{UPDATE/DELETE}} và {{SELECT ... FOR UPDATE}} lấy X.
- **Mức row vs table**: row-level lock (khóa từng dòng) cho phép concurrency cao; table-level khóa cả bảng, an toàn nhưng gây nghẽn. DB hiện đại (PostgreSQL, InnoDB) ưu tiên row-level.
- **Deadlock (khóa vòng)**: T1 giữ lock A chờ B, T2 giữ lock B chờ A. DB tự phát hiện (sau ~1s tùy cấu hình) và abort một transaction (trả lỗi). Tránh bằng cách khóa theo thứ tự cố định và giữ transaction ngắn.

~~~sql
-- Lấy exclusive lock tường minh khi cần "đọc rồi ghi" an toàn
BEGIN;
SELECT balance FROM accounts WHERE id = 1 FOR UPDATE; -- khóa row id=1
UPDATE accounts SET balance = balance - 500000 WHERE id = 1;
COMMIT;
~~~

### Bảng trade-off: chọn mức nào
| Nhu cầu | Mức gợi ý | Ghi chú |
| API đọc thông thường, báo cáo gần đúng | Read Committed | Mặc định tốt, ít contention |
| Đọc rồi ghi dựa trên giá trị vừa đọc (chuyển tiền) | Read Committed + {{FOR UPDATE}} | Rõ ràng, hiệu quả |
| Cần snapshot nhất quán trong suốt transaction dài | Repeatable Read | Tránh non-repeatable read |
| Nghiệp vụ cực kỳ nhạy cảm (sổ cái) | Serializable hoặc kiểm tra ràng buộc ở DB | Chậm, chỉ dùng khi cần |

### Pitfall thực tế trên production
- **"Mặc định là an toàn"**: Read Committed vẫn cho phép non-repeatable read; logic "đọc số dư → trừ" không có {{FOR UPDATE}} vẫn bị race condition.
- **Nâng Serializable cho mọi thứ**: throughput giảm mạnh, lỗi serialization failure (PG) buộc retry → phức tạp. Chỉ nâng đúng chỗ cần.
- **Transaction dài giữ lock**: mở transaction, gọi API ngoài, rồi mới commit → giữ row lock hàng chục giây, request khác xếp hàng, p99 tăng vọt. Quy tắc: transaction càng ngắn càng tốt, không gọi mạng bên trong transaction.
- **Nhầm isolation với atomicity**: isolation là giữa các transaction song song; atomicity (A trong ACID) là tất-cả-hoặc-không trong 1 transaction.

> Senior tip: Thực dụng nhất là giữ Read Committed và dùng {{SELECT ... FOR UPDATE}} / ràng buộc {{UNIQUE}} / {{CHECK}} đúng chỗ "đọc-rồi-ghi". Theo dõi {{pg_stat_activity}} (lock chờ) và deadlock count; nếu lock-wait p99 > 200ms, rà lại transaction dài và thứ tự khóa.`,
    follow: ['MVCC hoạt động thế nào?', 'Gap lock là gì?'],
    tags: ['isolation', 'transaction', 'locking']
  },
  {
    id: 'scenario-114',
    topic: 'scenario',
    level: 'senior',
    q: 'Interviewer hỏi: khi nào dùng Kafka thay vì REST/RPC, trade-off ra sao?',
    a: `**Tóm tắt:** Kafka (nền tảng event streaming — hàng đợi/nhật ký sự kiện phân tán, lưu message theo thứ tự và cho đọc lại) phù hợp khi cần xử lý bất đồng bộ, tách rời producer/consumer, chịu tải lớn và replay (đọc lại) sự kiện; REST/RPC (gọi hàm/HTTP đồng bộ — gửi request và chờ response ngay) phù hợp khi cần kết quả tức thì và luồng đơn giản.

### Bối cảnh thực tế
Đơn hàng vừa tạo cần: trừ kho, gửi email, cộng điểm loyalty, đẩy analytics. Nếu service Order gọi lần lượt Inventory, Email, Loyalty, Analytics bằng REST: (1) Order phải chờ tất cả → chậm; (2) Email lỗi làm cả đơn hàng thất bại dù đơn đã hợp lệ; (3) thêm consumer mới phải sửa Order. Kafka giải quyết bằng cách Order chỉ phát 1 event {{OrderCreated}}.

### Cơ chế hoạt động (từng bước, dễ hiểu)
- **Producer** (bên gửi) ghi message vào một **topic** (chủ đề/kênh). Topic chia thành nhiều **partition** (phân vùng) để song song hóa.
- Kafka lưu message tuần tự trên đĩa theo offset (vị trí). Khác hàng đợi truyền thống: message **không bị xóa ngay sau khi đọc** (giữ theo retention, vd 7 ngày) → consumer có thể đọc lại.
- **Consumer group**: nhiều instance cùng group chia nhau các partition → scale ngang. Mỗi partition chỉ có 1 consumer trong group xử lý tại 1 thời điểm → đảm bảo **thứ tự trong 1 partition** (thường chọn key = {{orderId}} để event cùng đơn đi cùng partition).

~~~seq
title: Order tạo xong, các bên xử lý bất đồng bộ
actors: Client | OrderSvc | Kafka | Inventory | Email
Client -> OrderSvc: POST /orders
OrderSvc -> Kafka: publish OrderCreated (key=orderId)
OrderSvc --> Client: 201 Created (nhanh)
Kafka -> Inventory: consume OrderCreated
Inventory -> Inventory: trừ kho
Kafka -> Email: consume OrderCreated
Email -> Email: gửi xác nhận
~~~

### Bảng trade-off
| Tiêu chí | Kafka (event/async) | REST/RPC (sync) |
| Phản hồi cho client | Không có kết quả nghiệp vụ ngay (chấp nhận sau) | Có response ngay |
| Coupling (phụ thuộc) | Lỏng: producer không biết consumer | Chặt: caller phải biết callee |
| Độ trễ end-to-end | Thường cao hơn (ms–giây) | Thấp cho 1 hop (ms) |
| Chịu lỗi | Consumer chết, sống lại đọc tiếp từ offset | Callee chết → caller lỗi (cần retry/circuit breaker) |
| Thứ tự | Chỉ đảm bảo trong 1 partition | Không có khái niệm stream |
| Replay/ audit | Có (đọc lại offset cũ) | Không |
| Vận hành | Phức tạp (cluster, schema, monitoring) | Đơn giản hơn |

### Khi nào dùng Kafka, khi nào dùng REST/RPC
- **Dùng Kafka**: sự kiện nghiệp vụ cần nhiều bên tiêu thụ (OrderCreated), pipeline dữ liệu/analytics, audit log, tích hợp service cần tách rời, tải đột biến muốn "đệm" (buffer), cần replay.
- **Dùng REST/RPC**: cần câu trả lời ngay để tiếp tục (login trả token, kiểm tra số dư trước khi cho rút), thao tác CRUD đơn giản, 1–1 request/response, team nhỏ chưa có năng lực vận hành Kafka.
- **Kết hợp**: REST để nhận request + trả ack nhanh, phía sau phát event Kafka cho xử lý nặng.

### Pitfall thực tế trên production
- **Dùng Kafka cho mọi thứ**: gọi kiểu request/response bắt buộc kết quả ngay qua Kafka (request-reply topic) phức tạp, khó debug. Giữ REST cho sync.
- **Consumer không idempotent (chạy lại cho cùng kết quả)**: Kafka đảm bảo at-least-once (có thể giao trùng). Nếu trừ kho 2 lần cho cùng event → sai nghiệp vụ. Xử lý bằng idempotency key (lưu {{eventId}} đã xử lý) hoặc thao tác upsert.
- **Sai partition key**: key null/random → event cùng {{orderId}} rơi khác partition → mất thứ tự. Chọn key theo thực thể cần giữ thứ tự.
- **Không quản lý schema**: producer đổi format message làm consumer vỡ. Dùng Schema Registry (Avro/Protobuf/JSON Schema) và quy tắc tương thích.
- **Consumer lag (tụt lại)**: consumer xử lý chậm, backlog tăng. Monitor {{consumer lag}}; scale consumer (tối đa bằng số partition) hoặc tối ưu xử lý.

> Senior tip: Quyết định theo câu hỏi "caller có cần kết quả ngay để trả user không?" — có thì REST/gRPC, không thì cân nhắc Kafka. Bắt đầu đơn giản, chuyển sang Kafka khi thấy nhu cầu thật về decoupling/replay/buffer. Luôn làm consumer idempotent và theo dõi consumer lag (cảnh báo nếu lag > ngưỡng, vd 10k message hoặc > 60s).`,
    follow: ['Consumer group là gì?', 'Exactly-once semantics?'],
    tags: ['kafka', 'messaging', 'architecture']
  },
  {
    id: 'scenario-115',
    topic: 'scenario',
    level: 'mid',
    q: 'Interviewer hỏi: Redis cache, cache cái gì, xử lý cache hit/miss thế nào?',
    a: `**Tóm tắt:** Redis cache (bộ nhớ đệm trong RAM — lưu tạm bản sao dữ liệu để đọc nhanh, tránh gọi DB lặp lại) dùng cho dữ liệu đọc nhiều, ít thay đổi (cấu hình, profile, danh mục). Mẫu phổ biến là cache-aside: hit (có trong cache) thì trả ngay, miss (không có) thì đọc DB, ghi vào cache kèm TTL (thời gian sống), rồi trả; đồng thời phải xử lý invalidation (xóa cache khi dữ liệu đổi) và các lỗi cache stampede/penetration.

### Bối cảnh thực tế
Trang chi tiết sản phẩm gọi 6 query DB, 5k RPS giờ cao điểm → DB CPU 90%, p99 800ms. 95% request đọc cùng bộ sản phẩm hot, dữ liệu chỉ đổi khi seller cập nhật (vài lần/giờ). Cache giúp trả phần lớn từ RAM (sub-millisecond).

### Cache cái gì (tiêu chí)
- **Đọc nhiều, ghi ít**: tỉ lệ read:write cao (vd 100:1). Dữ liệu ghi liên tục, cần chính xác tuyệt đối (số dư tài khoản) → không cache hoặc cache rất cẩn thận.
- **Tính được lại**: mất cache không mất dữ liệu gốc (DB vẫn là source of truth).
- **Dung lượng vừa**: object không quá lớn; key có quy ước rõ ({{product:42}}, {{user:42:profile}}).

### Cơ chế cache hit/miss (cache-aside, từng bước)
~~~java
String key = "product:" + id;
Product p = redis.get(key);            // 1) thử đọc cache
if (p != null) return p;               // 2) HIT: trả ngay (nhanh)
p = db.findProduct(id);                // 3) MISS: đọc DB (nguồn thật)
if (p != null) {
    redis.setex(key, 300, serialize(p)); // 4) ghi cache, TTL 300s
} else {
    redis.setex(key, 60, "__NULL__");    // 4b) cache giá trị rỗng ngắn (chống penetration)
}
return p;
~~~
- **Write-through**: ghi DB và cập nhật cache cùng lúc (dữ liệu mới hơn, code phức tạp hơn).
- **Invalidation khi ghi**: khi seller cập nhật sản phẩm → xóa key {{product:42}} (lệnh {{DEL}}) để lần đọc sau miss và lấy dữ liệu mới. "Xóa" an toàn hơn "cập nhật cache" vì tránh ghi giá trị cũ do race.

~~~seq
title: Cache-aside hit/miss
actors: Client | App | Redis | DB
Client -> App: GET /products/42
App -> Redis: GET product:42
Redis --> App: MISS
App -> DB: SELECT product 42
DB --> App: row
App -> Redis: SETEX product:42 300s
App --> Client: product
~~~

### Bảng trade-off chiến lược
| Chiến lược | Ưu | Nhược | Khi dùng |
| Cache-aside | Đơn giản, chỉ cache dữ liệu được đọc | Lần đầu miss chậm, có thể stale | Phổ biến nhất |
| Write-through | Cache luôn tươi sau ghi | Ghi chậm hơn (2 nơi), cache dữ liệu ít đọc | Cần đọc ngay sau ghi |
| Write-behind (ghi DB async) | Ghi rất nhanh | Rủi ro mất dữ liệu nếu cache chết trước khi flush | Chấp nhận rủi ro, throughput ghi cực cao |
| TTL only (không invalidate chủ động) | Đơn giản | Dữ liệu cũ tối đa = TTL | Dữ liệu chấp nhận trễ |

### Pitfall thực tế trên production
- **Cache stampede (đàn thú dồn dập)**: key hot hết TTL đúng lúc, hàng nghìn request cùng miss → đồng loạt đánh DB, DB sập. Cách giảm: jitter TTL (thêm ngẫu nhiên ±10%), mutex/lock chỉ 1 request rebuild cache, hoặc soft-TTL (trả cũ trong lúc refresh nền).
- **Cache avalanche (sập tuyết lở)**: nhiều key hết TTL cùng thời điểm (vd deploy set cùng TTL). Thêm jitter và tránh set TTL giống hệt nhau.
- **Stale data (dữ liệu cũ)**: cập nhật DB nhưng quên xóa cache → user thấy dữ liệu cũ. Quy tắc: mọi đường ghi phải invalidate key liên quan; chấp nhận eventual consistency trong TTL nếu dùng TTL-only.
- **Cache penetration (xuyên thủng)**: query id không tồn tại → luôn miss → luôn chọc DB. Cache giá trị null ngắn (30–60s) hoặc dùng Bloom filter (bộ lọc xác suất) để chặn key chắc chắn không có.
- **Object lớn/serialization chậm**: cache cả entity nặng tốn RAM và CPU. Chỉ cache field cần thiết, chọn format gọn (JSON/protobuf).

> Senior tip: Cache là lớp tối ưu, **DB vẫn là nguồn sự thật** — mọi luồng phải chạy đúng khi Redis rỗng hoặc chết (fallback DB, có thể chậm hơn nhưng không lỗi). Đặt TTL mọi key (tránh key sống mãi rò rỉ RAM), theo dõi hit ratio (mục tiêu thường > 90% cho key hot) và memory {{used/max}}; p99 đọc cache Redis nội mạng thường < 2ms.`,
    follow: ['Cache avalanche là gì?', 'Write-behind cache?'],
    tags: ['redis', 'cache', 'performance']
  },
  {
    id: 'scenario-116',
    topic: 'scenario',
    level: 'senior',
    q: 'Interviewer hỏi: tối ưu query trên bảng tỷ bản ghi đã có index đầy đủ nhưng vẫn chậm — bạn làm gì?',
    a: `**Tóm tắt:** "Đã có index" không có nghĩa planner (bộ chọn kế hoạch thực thi của DB) sẽ dùng. Phải kiểm chứng bằng {{EXPLAIN (ANALYZE, BUFFERS)}} để xem DB thực sự quét gì, tốn bao lâu, đọc bao nhiêu trang; sau đó tối ưu theo nguyên nhân: index không khớp query, dữ liệu quá lớn cần partition (phân vùng bảng), statistics cũ, query viết tệ, hoặc I/O/sort tràn bộ nhớ.

### Bối cảnh thực tế
Bảng {{events}} 1,2 tỷ bản ghi (log hành vi 18 tháng). Query "lấy 100 event của user trong 7 ngày" có index {{(user_id, created_at)}} nhưng p99 vẫn 4–6 giây, DB I/O chờ cao giờ cao điểm.

### Điều tra từng bước (triệu chứng → kiểm tra → nguyên nhân)
1. **Xem kế hoạch thật** (đừng đoán):
~~~sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id, type, created_at
FROM events
WHERE user_id = 42
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC
LIMIT 100;
~~~
2. **Đọc các dấu hiệu trong plan**:
   - {{Seq Scan}} trên bảng lớn → index không được dùng.
   - {{Index Scan}} nhưng {{actual time}} cao, {{buffers read}} lớn → index dùng nhưng vẫn đọc quá nhiều dòng/trang (selectivity kém, hoặc phải "lọc lại" nhiều).
   - {{Sort Method: external merge Disk}} → bộ nhớ {{work_mem}} không đủ, sort tràn ra đĩa.
   - {{rows estimated}} lệch xa {{actual rows}} → statistics (thống kê phân bố dữ liệu) cũ, planner chọn sai plan.
3. **Vì sao index "đầy đủ" vẫn không dùng/không nhanh**:
   - Bọc hàm lên cột: {{WHERE DATE(created_at)=...}} làm index {{(created_at)}} vô dụng → viết lại {{created_at >= ... AND created_at < ...}}.
   - Implicit cast kiểu: {{WHERE user_id = '42'}} khi cột {{bigint}}.
   - Thứ tự composite index sai (leftmost prefix): index {{(created_at, user_id)}} không giúp {{WHERE user_id = 42}}.
   - Planner ước tính trả về quá nhiều dòng → quyết định Seq Scan rẻ hơn (đôi khi đúng, đôi khi do stats cũ).

### Giải pháp (ngắn hạn → dài hạn)
- **Sửa query/index cho khớp**: đúng thứ tự {{(user_id, created_at)}}, bỏ hàm/cast trên cột lọc, chỉ {{SELECT}} cột cần (tránh {{SELECT *}}). Dùng **covering index** (chỉ mục chứa luôn cột trả về, vd {{(user_id, created_at) INCLUDE (id, type)}} ở PostgreSQL) để Index Only Scan, không phải đọc bảng.
- **Cập nhật statistics**: {{ANALYZE events;}} (hoặc tăng autovacuum/analyze). Nếu planner vẫn chọn sai sau khi stats đúng, mới cân nhắc gợi ý ({{pg_hint_plan}}) như biện pháp tạm.
- **Partition (phân vùng) theo thời gian**: bảng 1,2 tỷ dòng, truy vấn chủ yếu 7–30 ngày gần nhất → partition RANGE theo tháng/tuần. Planner dùng **partition pruning** (bỏ qua các phân vùng không liên quan) nên chỉ quét vài partition thay vì cả bảng. Kết hợp index cục bộ trên mỗi partition.
~~~sql
-- Ví dụ ý tưởng (PostgreSQL declarative partitioning)
CREATE TABLE events (id bigint, user_id bigint, created_at timestamptz, type text)
PARTITION BY RANGE (created_at);
CREATE TABLE events_2026_05 PARTITION OF events
  FOR VALUES FROM ('2026-05-01') TO ('2026-06-01');
CREATE INDEX ON events_2026_05 (user_id, created_at);
~~~
- **Giảm dữ liệu phải xử lý**: keyset/cursor pagination thay vì {{OFFSET}} lớn; pre-aggregate (bảng tổng hợp) hoặc materialized view (view lưu vật lý kết quả) cho báo cáo; archive dữ liệu cũ sang bảng/kho lạnh.

### Bảng trade-off
| Giải pháp | Ưu | Nhược | Khi dùng |
| Sửa index/query | Nhanh, ít rủi ro | Không cứu nổi nếu scan quá nhiều dữ liệu | Luôn thử đầu tiên |
| Covering index | Giảm đọc bảng (heap fetch) | Tốn dung lượng, chậm write | Query hot, cột trả về ít |
| Partition theo thời gian | Pruning mạnh, dễ drop dữ liệu cũ | Migrate bảng lớn phức tạp, cần khóa partition key | Bảng tỷ dòng, query theo thời gian |
| Read replica (bản sao chỉ đọc) | Tách tải đọc khỏi primary | Replication lag (trễ sao chép) | List/báo cáo nặng |
| Sharding (chia ngang nhiều DB) | Scale vượt 1 máy | Rất phức tạp (join, transaction xuyên shard) | Cực lớn, giải pháp cuối |

### Pitfall thực tế trên production
- **Tin "đã có index" mà không kiểm chứng**: luôn tin {{EXPLAIN ANALYZE}} thực tế, không tin giả định.
- **Partition mà quên partition key trong WHERE**: query {{WHERE user_id=42}} (không lọc {{created_at}}) trên bảng partition theo thời gian → quét mọi partition, không pruning. Thiết kế query và partition key phải đi cùng nhau.
- **Migrate sang partition trên bảng live tỷ dòng**: lock lâu, downtime. Cần kế hoạch (tạo bảng mới partitioned, backfill theo batch, dual-write/cutover) và đo trên staging.
- **{{OFFSET 1000000}}**: DB vẫn phải đọc & bỏ qua 1 triệu dòng. Dùng keyset pagination ({{WHERE (created_at,id) < (:c,:i) ORDER BY created_at DESC, id DESC LIMIT 100}}).

> Senior tip: Quy trình cố định: (1) {{EXPLAIN (ANALYZE, BUFFERS)}} + so estimated vs actual, (2) sửa query/index cho sargable (lọc dùng được index), (3) {{ANALYZE}} cập nhật stats, (4) nếu vẫn phải chạm quá nhiều dòng → partition/prune dữ liệu. Trên bảng ~1 tỷ dòng partition đúng theo tháng, query 7 ngày thường giảm từ quét cả bảng xuống < 2% dữ liệu và p99 từ giây về vài chục ms.`,
    follow: ['Partition pruning là gì?', 'Khi nào dùng materialized view?'],
    tags: ['database', 'partition', 'performance']
  }

,
{
  id: 'scenario-117',
  topic: 'scenario',
  level: 'senior',
  q: 'p99 latency của API tăng gấp 5 sau deploy mới, nhưng CPU và RAM của pod vẫn bình thường. Bạn điều tra từng bước thế nào?',
  a: `**Tóm tắt:** CPU và RAM bình thường mà p99 tăng gấp 5 nghĩa là request đang **chờ** chứ không phải **tính**: chờ DB, chờ connection pool, chờ service downstream, chờ lock hoặc GC pause. Tôi khoanh thời điểm, so trace trước/sau deploy để tìm span phình ra, kiểm tra pool và lock, rồi đối chiếu diff của bản deploy. Nếu vi phạm SLA, **rollback trước, điều tra sau**.

### Vì sao CPU bình thường vẫn chậm được
Thread đang chờ I/O hoặc chờ lock không tốn CPU. Một service 200 thread, nếu mỗi request phải chờ thêm 400ms cho một connection DB, CPU vẫn chỉ 20% nhưng p99 nhảy vọt. p99 đặc biệt nhạy với hàng đợi: khi pool gần đầy, một phần nhỏ request xếp hàng lâu trong khi p50 gần như không đổi — đó là dấu hiệu kinh điển của tranh chấp tài nguyên.

### Điều tra từng bước
1. **Khoanh thời điểm**: overlay p50/p99/error rate với mốc deploy. p50 không đổi mà p99 tăng → nghi hàng đợi/lock; cả p50 tăng → mỗi request đều làm thêm việc.
2. **So trace**: lấy 20 trace chậm nhất trước và sau deploy (Jaeger/Tempo/Datadog). Span nào phình ra? Số span DB mỗi request có tăng không (dấu hiệu N+1 mới)?
3. **Connection pool**: metric Hikari {{hikaricp_connections_pending}}, {{hikaricp_connections_acquire_seconds}}. Pending > 0 kéo dài → pool cạn (transaction dài hơn, hoặc gọi HTTP trong transaction).
4. **Downstream**: latency và timeout của từng client HTTP; bản mới có gọi thêm service nào không?
5. **JVM**: GC pause p99 (GC log, JFR); thread dump vài lần cách nhau 5 giây — nhiều thread {{BLOCKED}} cùng một monitor là lock contention; với virtual thread kiểm tra pinning bằng sự kiện JFR {{jdk.VirtualThreadPinned}}.
6. **Diff deploy**: code, cấu hình (timeout, pool size), phiên bản thư viện, migration (index bị xoá?), feature flag.

~~~seq
title: p99 tăng nhưng CPU thấp
actors: Client | API | Hikari | DB
Client -> API: GET /orders
API -> Hikari: getConnection()
note Hikari: pool 10/10 đang bận, chờ 380ms
Hikari --> API: connection
API -> DB: SELECT (20ms)
DB --> API: rows
API --> Client: 200 sau 420ms
~~~

### Ví dụ đời thực
Sau một deploy, p99 của API đặt hàng từ 180ms lên 950ms, p50 gần như giữ nguyên 60ms, CPU 25%. Trace cho thấy span DB không đổi nhưng xuất hiện khoảng chờ trước span đầu tiên; metric Hikari pending lên 30–40. Diff deploy: một dev thêm lời gọi API chấm điểm gian lận (khoảng 300ms) **bên trong** method {{@Transactional}}, nên mỗi request giữ connection lâu gấp 5 lần, pool 10 connection cạn. Rollback trong 8 phút; bản sửa chuyển lời gọi ra ngoài transaction, p99 về 190ms. Sau đó team thêm cảnh báo khi {{connections_pending > 0}} quá 2 phút.

### Khi nào rollback ngay
- Vi phạm SLO và đang ảnh hưởng người dùng thật.
- Không có giả thuyết rõ trong 10–15 phút đầu.
Rollback trước giúp thời gian ảnh hưởng ngắn; bản lỗi vẫn điều tra được trên staging với cùng tải hoặc bằng trace đã thu.

### Pitfall
- Tăng pool size để "chữa" — DB nhận thêm tải, vấn đề dời sang chỗ khác.
- Chỉ nhìn trung bình (avg) — che mất đuôi p99.
- Bắt đầu từ heap dump trong khi triệu chứng là chờ I/O.
- Không có trace/metric pool từ trước → mất nhiều giờ đoán.

### Trả lời mẫu khi phỏng vấn
"CPU và RAM bình thường mà p99 tăng thì tôi nghĩ request đang chờ chứ không phải đang tính. Việc đầu tiên tôi xem là đã vi phạm SLO chưa: nếu đang ảnh hưởng người dùng mà chưa có giả thuyết rõ thì tôi rollback trước. Song song, tôi so p50 với p99: p50 giữ nguyên còn p99 tăng thường là hàng đợi, như pool cạn hoặc lock. Tôi so trace chậm nhất trước và sau deploy để xem span nào phình ra hoặc có thêm span DB, xem metric pending của Hikari, latency của từng downstream, GC pause và vài thread dump liên tiếp để tìm thread BLOCKED. Cuối cùng tôi đối chiếu diff: code, cấu hình timeout, pool, thư viện, migration. Một lần tôi gặp đúng trường hợp này: ai đó thêm một lời gọi HTTP 300ms bên trong transaction, pool cạn, p99 từ 180 lên gần 1 giây. Chuyển lời gọi ra ngoài transaction là p99 về bình thường."

> Senior tip: dashboard của mỗi service nên có sẵn ba biểu đồ cạnh nhau — p50/p99, pool pending và GC pause — kèm vạch đánh dấu deploy. Với ba biểu đồ đó, 80% sự cố "chậm mà CPU thấp" được khoanh vùng trong vài phút.`,
  follow: ['Làm sao phát hiện I/O wait trong JVM bằng công cụ gì?', 'Khi nào nên rollback thay vì tiếp tục debug?'],
  tags: ['p99', 'latency', 'troubleshooting', 'APM']
},
{
  id: 'scenario-118',
  topic: 'scenario',
  level: 'senior',
  q: 'Một service downstream chậm kéo sập toàn hệ thống (cascading failure): dấu hiệu và cách cắt lan truyền thế nào?',
  a: `**Tóm tắt:** Cascading failure xảy ra khi một dependency chậm làm thread và connection của bên gọi bị giữ lại, pool cạn, và bên gọi cũng chậm theo — lan dần lên tới gateway. Cắt lan truyền bằng **timeout ngắn có ngân sách**, **circuit breaker** để thất bại nhanh, **bulkhead** để cô lập tài nguyên theo dependency, **fallback** có chủ đích, **retry có giới hạn** và **load shedding** ở cửa vào.

### Cơ chế lan truyền, từng bước
1. Service Payment chậm từ 100ms lên 5s.
2. Order Service gọi Payment không có timeout hợp lý: mỗi request giữ một thread Tomcat (mặc định tối đa 200) trong 5s.
3. Với 100 request/giây, sau khoảng 2 giây cả 200 thread đều đang chờ → Order không phục vụ được cả những API **không liên quan** đến Payment.
4. Gateway và các service gọi Order cũng bắt đầu chờ → toàn hệ thống chậm.
5. Retry ở mỗi tầng nhân tải lên Payment đang yếu → nó không thể hồi phục (retry storm).

### Dấu hiệu nhận biết
- Thread pool/connection pool của nhiều service gần max cùng lúc; hàng đợi tăng.
- Latency tăng lan dần theo chiều gọi, bắt nguồn từ một dependency.
- Lỗi timeout tăng trong khi CPU các service vẫn thấp.

### Các lớp phòng vệ
| Cơ chế | Chặn được gì | Cấu hình gợi ý |
|---|---|---|
| Timeout | Thread bị giữ vô hạn | connect 1s, read ≈ p99 bình thường × 2–3 |
| Circuit breaker | Tiếp tục gọi vào service đang hỏng | mở khi lỗi/chậm > 50% trong 20–50 lời gọi |
| Bulkhead | Một dependency chiếm hết thread | giới hạn số lời gọi đồng thời theo dependency |
| Fallback | Người dùng nhận lỗi trắng | dữ liệu cache cũ, giá trị mặc định, xử lý sau |
| Retry giới hạn | Lỗi mạng thoáng qua | tối đa 2 lần, backoff + jitter, chỉ cho lời gọi idempotent |
| Load shedding | Quá tải ở cửa vào | trả 503 sớm khi hàng đợi vượt ngưỡng |

~~~java
// Resilience4j (Spring Boot 3): thứ tự áp dụng mặc định Retry(CircuitBreaker(Bulkhead(call)))
@CircuitBreaker(name = "payment", fallbackMethod = "paymentPending")
@Bulkhead(name = "payment")                 // tối đa N lời gọi đồng thời tới Payment
public PaymentResult charge(Order o) {
    return paymentClient.charge(o);         // client đã đặt read timeout 2s
}
PaymentResult paymentPending(Order o, Throwable t) {
    // không giả vờ thành công: ghi nhận PENDING, xử lý lại bằng job/queue
    return PaymentResult.pending(o.id());
}
~~~
**Ngân sách timeout**: nếu gateway cho tổng cộng 3s, các tầng bên dưới phải có timeout nhỏ hơn (ví dụ 2s, rồi 1s); tầng dưới timeout dài hơn tầng trên thì vô nghĩa vì bên gọi đã bỏ đi.

### Ví dụ đời thực
Ngày khuyến mãi, nhà cung cấp gợi ý sản phẩm chậm lên 8s. Trang chi tiết sản phẩm gọi nó đồng bộ, không timeout; trong 4 phút toàn bộ thread của Product Service bị giữ, trang thanh toán (cùng service) lỗi 503, doanh thu giờ đó giảm khoảng 35%. Sau sự cố: timeout 300ms cho gợi ý, bulkhead 20 lời gọi đồng thời, fallback trả danh sách "bán chạy" đã cache. Lần nhà cung cấp chậm tiếp theo, trang vẫn tải trong 400ms, chỉ phần gợi ý là dữ liệu cache; không ai bị ảnh hưởng thanh toán.

### Pitfall
- Retry ở mọi tầng: 3 tầng × 3 lần = 27 lời gọi vào service đang yếu.
- Fallback "giả thành công" cho thao tác tiền → sai dữ liệu.
- Circuit breaker cấu hình nhưng không có metric/cảnh báo khi mở → không ai biết.
- Gọi HTTP bên trong transaction DB → giữ cả connection DB, lan sang DB.

### Trả lời mẫu khi phỏng vấn
"Cascading failure là khi một dependency chậm làm bên gọi giữ thread và connection, pool cạn, và bên gọi cũng chậm theo, kể cả những API không liên quan. Dấu hiệu là pool của nhiều service cùng gần max, latency lan dần theo chiều gọi, CPU vẫn thấp. Để cắt lan truyền tôi dùng nhiều lớp. Timeout ngắn và theo ngân sách: tầng dưới luôn nhỏ hơn tầng trên. Circuit breaker để thất bại nhanh khi dependency đang hỏng, cho nó thời gian hồi phục. Bulkhead để một dependency không chiếm hết thread. Fallback có chủ đích, ví dụ dữ liệu cache hoặc trạng thái pending, không giả vờ thành công với thao tác tiền. Retry chỉ vài lần, có backoff và jitter, và chỉ ở một tầng để tránh retry storm. Ở cửa vào thì load shedding. Một lần nhà cung cấp gợi ý sản phẩm chậm 8 giây làm sập cả trang thanh toán; sau khi thêm timeout 300ms, bulkhead và fallback, lần sau nó chậm thì người dùng gần như không nhận ra."

> Senior tip: diễn tập bằng cách tiêm độ trễ (Toxiproxy, chaos experiment) vào từng dependency trên staging mỗi quý. Cấu hình resilience không được thử thì thường sai đúng vào ngày nó cần chạy.`,
  follow: ['Timeout bao nhiêu là hợp lý cho từng trường hợp?', 'Khi circuit breaker mở, traffic có vẫn được gửi không?'],
  tags: ['cascading-failure', 'resilience', 'circuit-breaker', 'bulkhead']
},
{
  id: 'scenario-119',
  topic: 'scenario',
  level: 'senior',
  q: 'Dữ liệu bị ghi đè do hai người sửa cùng lúc (lost update) trên production: tìm và xử lý thế nào?',
  a: `**Tóm tắt:** Lost update là khi hai request cùng **đọc** một giá trị, cùng **tính** trong ứng dụng rồi cùng **ghi**, và lần ghi sau xoá mất lần ghi trước — DB không báo lỗi gì. Tôi xác nhận bằng log/audit và tái hiện bằng test đồng thời, rồi sửa theo thứ tự ưu tiên: **UPDATE nguyên tử có điều kiện** → **optimistic locking ({{@Version}})** → **pessimistic lock ({{SELECT ... FOR UPDATE}})**, và dọn dữ liệu đã sai bằng đối soát.

### Cơ chế, từng bước
~~~text
t1  A: SELECT qty FROM inventory WHERE sku='X'   -> 10
t2  B: SELECT qty FROM inventory WHERE sku='X'   -> 10
t3  A: (ứng dụng tính 10 - 3 = 7)  UPDATE ... SET qty = 7
t4  B: (ứng dụng tính 10 - 5 = 5)  UPDATE ... SET qty = 5   <- mất 3 sản phẩm của A
~~~
Ở mức READ COMMITTED (mặc định PostgreSQL và nhiều cấu hình MySQL), cả hai câu UPDATE đều hợp lệ: B chờ A commit rồi ghi đè. Lỗi nằm ở chỗ phép tính diễn ra **ngoài DB**. Với JPA rất dễ gặp: {{findById}} → sửa field → {{save}} chính là read-modify-write.

### Điều tra trên production
- So **audit log / bảng lịch sử** với giá trị hiện tại: tổng xuất kho theo đơn hàng ≠ chênh lệch tồn kho.
- Tìm trong code các đoạn "đọc → tính trong Java → ghi" trên dữ liệu có nhiều người cùng sửa (tồn kho, số dư, điểm thưởng, trạng thái đơn).
- Tái hiện: test bắn 50 request đồng thời cùng một khoá (CountDownLatch hoặc k6), so kết quả với giá trị kỳ vọng.

### Ba cách sửa
**1. UPDATE nguyên tử có điều kiện** — tốt nhất khi phép tính diễn đạt được bằng SQL:
~~~sql
UPDATE inventory SET qty = qty - :take, updated_at = now()
WHERE sku = :sku AND qty >= :take;   -- 0 dòng bị ảnh hưởng = không đủ hàng
~~~
DB khoá dòng trong lúc tính, nên hai lệnh không thể giẫm lên nhau.

**2. Optimistic locking** — khi logic phức tạp, xung đột hiếm:
~~~java
@Entity class Account {
  @Id Long id;
  BigDecimal balance;
  @Version long version;   // Hibernate thêm "AND version = ?" vào UPDATE
}
// Nếu 0 dòng bị cập nhật -> ObjectOptimisticLockingFailureException (Spring)
// -> đọc lại và thử lại tối đa 3 lần, hoặc báo người dùng "dữ liệu đã thay đổi"
~~~
Với form chỉnh sửa trên web, gửi {{version}} xuống client và trả 409 Conflict khi khác.

**3. Pessimistic lock** — khi xung đột thường xuyên và retry tốn kém:
{{@Lock(LockModeType.PESSIMISTIC_WRITE)}} sinh {{SELECT ... FOR UPDATE}}. Giữ transaction thật ngắn, đặt lock timeout, khoá theo thứ tự cố định để tránh deadlock.

| Cách | Hợp với | Rủi ro |
|---|---|---|
| UPDATE nguyên tử | Cộng/trừ, đổi trạng thái có điều kiện | Logic phức tạp khó viết bằng SQL |
| Optimistic | Xung đột hiếm, form chỉnh sửa | Hot key → retry liên tục |
| Pessimistic | Xung đột cao, thao tác ngắn | Chờ khoá, deadlock |

### Ví dụ đời thực
Shop thời trang chạy flash sale: tồn kho hiển thị còn 0 nhưng kho thực tế còn 47 sản phẩm, và có 12 đơn bán vượt tồn ở mã khác. Audit cho thấy code {{findBySku → setQty(qty - n) → save}}. Ở 300 request/giây trên vài mã hot, lost update xảy ra hàng trăm lần. Đổi sang UPDATE nguyên tử có điều kiện {{qty >= :take}}; chạy job đối soát tồn kho với phiếu xuất để sửa dữ liệu cũ. Flash sale tiếp theo: 0 chênh lệch tồn kho, p99 của API đặt hàng còn giảm 30% vì bỏ được một lần SELECT.

### Pitfall
- Tin rằng {{@Transactional}} tự chống lost update — không, ở READ COMMITTED vẫn xảy ra.
- Thêm {{@Version}} nhưng merge DTO từ client mà không mang version cũ → kiểm tra vô nghĩa.
- Retry optimistic vô hạn trên hot key → tải DB tăng vọt.
- Sửa code nhưng quên đối soát dữ liệu đã sai trước đó.

### Trả lời mẫu khi phỏng vấn
"Lost update xảy ra khi hai request cùng đọc một giá trị, cùng tính trong ứng dụng rồi cùng ghi, và lần ghi sau xoá mất lần ghi trước. Ở READ COMMITTED thì DB không báo lỗi, nên @Transactional thôi là không đủ. Trên production tôi phát hiện bằng cách so audit log với giá trị hiện tại, và tái hiện bằng test bắn nhiều request đồng thời vào cùng một khoá. Cách sửa tôi ưu tiên là đẩy phép tính vào một câu UPDATE nguyên tử có điều kiện, ví dụ trừ tồn kho với điều kiện còn đủ hàng; nếu không có dòng nào được cập nhật thì báo hết hàng. Khi logic phức tạp và xung đột hiếm, tôi dùng optimistic locking với @Version và retry có giới hạn, hoặc trả 409 cho form chỉnh sửa. Khi xung đột rất cao thì mới dùng SELECT FOR UPDATE với transaction ngắn. Và luôn có bước đối soát để sửa dữ liệu đã sai."

> Senior tip: grep toàn codebase pattern "find → set → save" trên các bảng có cột số lượng hoặc số dư. Đây là nguồn lost update phổ biến nhất trong ứng dụng Spring Data, và thường tìm ra vài chỗ ngay trong buổi đầu tiên.`,
  follow: ['Điều gì xảy ra bên trong DB engine với UPDATE nguyên tử?', 'Optimistic lock vs pessimistic lock: khi nào chọn cái nào?'],
  tags: ['lost-update', 'race-condition', 'optimistic-lock', 'pessimistic-lock']
},
{
  id: 'scenario-120',
  topic: 'scenario',
  level: 'lead',
  q: 'Migration dữ liệu 500 triệu dòng không downtime: thiết kế thế nào?',
  a: `**Tóm tắt:** Không có "một lệnh" nào migrate 500 triệu dòng an toàn. Tôi dùng mô hình **expand → migrate → contract**: thêm cấu trúc mới theo cách không khoá (expand), **ghi kép + backfill theo lô có checkpoint và giới hạn tốc độ**, kiểm tra dữ liệu, chuyển đọc sang cấu trúc mới, rồi mới xoá cấu trúc cũ (contract). Mọi DDL đều có {{lock_timeout}} ngắn và retry; mỗi bước có đường lui.

### Vì sao DDL trên bảng lớn nguy hiểm
Ở PostgreSQL, hầu hết {{ALTER TABLE}} cần khoá {{ACCESS EXCLUSIVE}}. Điểm nguy hiểm không chỉ là thời gian lệnh chạy: lệnh **xếp hàng chờ** sau một transaction dài, và mọi câu SELECT/UPDATE đến sau lại xếp hàng sau nó → cả bảng đứng hình dù lệnh DDL chỉ cần 10ms. Vì vậy luôn đặt {{SET lock_timeout = '3s'}} và retry thay vì chờ vô hạn.

### Phân loại thao tác (PostgreSQL 11+)
| Thao tác | Mức an toàn |
|---|---|
| {{ADD COLUMN}} nullable hoặc có default hằng | Chỉ đổi metadata, nhanh |
| {{CREATE INDEX CONCURRENTLY}} | Không khoá ghi; chạy ngoài transaction; kiểm tra index INVALID nếu lỗi |
| {{ALTER COLUMN TYPE}} (đổi kiểu cần viết lại) | Viết lại cả bảng — tránh, dùng cột mới + backfill |
| {{SET NOT NULL}} | Quét cả bảng — thay bằng {{CHECK (...) NOT VALID}} rồi {{VALIDATE CONSTRAINT}} |
| Thêm foreign key | {{NOT VALID}} trước, {{VALIDATE}} sau (không khoá ghi lâu) |
MySQL 8: ưu tiên {{ALGORITHM=INSTANT}}/{{INPLACE, LOCK=NONE}}; thay đổi nặng dùng gh-ost hoặc pt-online-schema-change.

### Kế hoạch ví dụ: đổi {{amount}} từ INT sang NUMERIC(19,4)
1. **Expand**: thêm cột {{amount_v2 NUMERIC(19,4)}} (metadata-only).
2. **Ghi kép**: release ứng dụng ghi cả hai cột (hoặc trigger).
3. **Backfill theo lô**:
~~~sql
UPDATE payments SET amount_v2 = amount
WHERE id > :last AND id <= :last + 10000 AND amount_v2 IS NULL;
-- lưu :last vào bảng checkpoint; nghỉ 50–100ms giữa các lô;
-- tự giảm tốc khi replication lag > 5s hoặc CPU DB > 70%
~~~
4. **Kiểm tra**: đếm dòng còn NULL, so {{sum(amount)}} với {{sum(amount_v2)}} theo từng khoảng id.
5. **Chuyển đọc** sang cột mới sau feature flag; theo dõi vài ngày.
6. **Contract**: ngừng ghi cột cũ, rồi xoá cột cũ ở một release sau.

### Ví dụ đời thực
Bảng giao dịch 520 triệu dòng, 1,8TB, cần đổi kiểu cột tiền. Lần thử đầu bằng {{ALTER COLUMN TYPE}} trên staging ước tính khoá bảng 6–7 giờ — không thể. Làm theo expand/contract: backfill 52.000 lô × 10.000 dòng, tốc độ khoảng 4.000 dòng/giây ngoài giờ cao điểm, tự dừng khi replica lag vượt 5 giây; tổng cộng 5 ngày. WAL tăng thêm khoảng 900GB nên phải tăng dung lượng lưu WAL và theo dõi chặt. Kết quả: không có phút downtime nào, kiểm tra tổng tiền khớp tuyệt đối trên 5.200 khoảng id trước khi chuyển đọc.

### Pitfall
- Một câu UPDATE cho cả bảng: transaction khổng lồ, bloat, replica tụt lại hàng giờ.
- Quên ghi kép → dữ liệu mới phát sinh trong lúc backfill bị thiếu.
- Xoá cột cũ cùng release chuyển đọc → không còn đường lui.
- {{CREATE INDEX CONCURRENTLY}} lỗi giữa chừng để lại index INVALID mà không ai xoá.

### Trả lời mẫu khi phỏng vấn
"Với 500 triệu dòng, tôi không tìm một lệnh nào đó chạy cho nhanh mà chia thành expand, migrate, contract. Đầu tiên tôi phân loại DDL: thao tác nào chỉ đổi metadata, thao tác nào viết lại cả bảng. Thao tác viết lại thì thay bằng thêm cột mới. Mọi DDL đều đặt lock_timeout vài giây và có retry, vì nguy hiểm nhất là lệnh DDL xếp hàng sau một transaction dài rồi chặn mọi truy vấn phía sau. Sau đó ứng dụng ghi kép vào cả cũ lẫn mới, và tôi backfill theo lô khoảng mười nghìn dòng theo khoá chính, có checkpoint để chạy lại được, có giới hạn tốc độ và tự dừng khi replication lag cao. Xong thì kiểm tra số dòng và tổng theo từng khoảng, chuyển đọc sang cấu trúc mới sau feature flag, và chỉ xoá cấu trúc cũ ở một release sau. Tôi từng làm vậy cho bảng giao dịch hơn 500 triệu dòng, chạy năm ngày mà không có phút downtime nào."

> Senior tip: diễn tập toàn bộ kế hoạch trên một bản sao production có kích thước thật trước, và đo ba con số: tốc độ backfill, lượng WAL sinh ra, replication lag. Ba con số này quyết định lịch chạy và dung lượng cần chuẩn bị — đoán sai một trong ba là sự cố.`,
  follow: ['Làm sao thêm constraint NOT NULL an toàn trên PostgreSQL?', 'gh-ost hoạt động thế nào so với online DDL native?'],
  tags: ['DDL', 'online-migration', 'postgresql', 'mysql']
},
{
  id: 'scenario-121',
  topic: 'scenario',
  level: 'senior',
  q: 'Kafka consumer lag tăng không ngừng vào giờ cao điểm: nguyên nhân và cách xử lý?',
  a: `**Tóm tắt:** Lag tăng không ngừng nghĩa là **tốc độ vào lớn hơn tổng năng lực xử lý** của consumer group. Tôi đo năng lực thật của một consumer (message/giây và thời gian xử lý từng bước), kiểm tra phân bố partition (skew), rebalance và nút thắt phía sau (thường là DB). Cách sửa theo thứ tự: **giảm thời gian xử lý mỗi message** (batch, bỏ I/O thừa) → **tăng song song đúng chỗ** → **thêm partition/consumer** khi thật cần.

### Toán năng lực
Năng lực một consumer ≈ 1000 / (thời gian xử lý một message tính bằng ms). Mỗi partition chỉ được một consumer trong group đọc, nên:
~~~text
Năng lực group = min(số consumer, số partition) × năng lực 1 consumer
Ví dụ: 12 partition, 12 consumer, mỗi message 25ms -> 12 × 40 = 480 msg/s
Giờ cao điểm vào 900 msg/s -> lag tăng 420 msg/s, sau 1 giờ ~1,5 triệu message
~~~
Thêm consumer thứ 13 không giúp gì nếu chỉ có 12 partition.

### Điều tra
1. **Lag theo partition** ({{kafka-consumer-groups --describe}}, Burrow, metric {{records-lag-max}}): lag đều trên mọi partition → thiếu năng lực; dồn vào vài partition → **skew** do key nóng (ví dụ một merchant lớn).
2. **Thời gian xử lý từng bước**: span trace hoặc timer quanh DB call, HTTP call, serialize. Thường 80% là I/O.
3. **Rebalance**: log "Revoking partitions" lặp lại → consumer bị đá khỏi group vì xử lý một lần {{poll}} lâu hơn {{max.poll.interval.ms}} (mặc định 5 phút), dẫn đến xử lý lại và lag càng tăng.
4. **Nút thắt phía sau**: DB CPU, pool connection, rate limit của API đối tác.

### Cách xử lý
- **Batch**: listener nhận lô, ghi DB bằng một câu bulk thay vì 500 câu riêng.
~~~java
@KafkaListener(topics = "payments", batch = "true", concurrency = "6")
void onBatch(List<ConsumerRecord<String, PaymentEvent>> records) {
    // gom theo khoá, 1 câu INSERT ... ON CONFLICT cho cả lô
    repo.upsertAll(records.stream().map(r -> toRow(r.value())).toList());
}   // offset commit sau khi cả lô xong (AckMode BATCH)
~~~
- **Cắt I/O thừa**: cache dữ liệu tra cứu, bỏ lời gọi đồng bộ không cần thiết.
- **Song song trong partition giữ thứ tự theo key**: ví dụ Confluent Parallel Consumer, hoặc hàng đợi nội bộ theo hash(key).
- **Thêm partition**: chỉ khi số consumer đã bằng số partition; lưu ý message cùng key sau khi thêm partition có thể sang partition khác → mất thứ tự trong giai đoạn chuyển.
- **Skew**: đổi key (thêm hậu tố cho key nóng nếu nghiệp vụ cho phép), hoặc tách luồng riêng cho khách lớn.

### Ví dụ đời thực
Consumer ghi lịch sử giao dịch vào PostgreSQL: lag lên 2 triệu message mỗi tối, tới 2 giờ sáng mới hết. Đo: 18ms/message, trong đó 15ms là INSERT từng dòng; 12 partition, 12 pod. Chuyển sang batch 500 message + một câu INSERT nhiều dòng: còn 1,2ms/message tính bình quân, năng lực tăng khoảng 15 lần với cùng số pod; lag giờ cao điểm không vượt 5 giây. Không cần thêm partition nào.

### Pitfall
- Tăng pod quá số partition — pod thừa ngồi không.
- Tăng consumer khi nút thắt là DB → DB nghẽn nặng hơn.
- Xử lý bất đồng bộ rồi commit offset trước khi xong → mất message khi crash.
- Cảnh báo theo số message lag thay vì theo **thời gian trễ** ({{lag / tốc độ xử lý}}).

### Trả lời mẫu khi phỏng vấn
"Lag tăng không ngừng nghĩa là tốc độ vào lớn hơn năng lực xử lý của cả group, nên tôi bắt đầu bằng phép tính. Một consumer xử lý mỗi message mất bao nhiêu mili giây, nhân với số consumer, nhưng không vượt quá số partition, vì mỗi partition chỉ một consumer đọc. Sau đó tôi xem lag theo từng partition: đều nhau là thiếu năng lực, dồn vào vài partition là skew do key nóng. Tôi kiểm tra log rebalance, vì xử lý một lần poll quá max.poll.interval là bị đá khỏi group và xử lý lại. Rồi tôi đo thời gian từng bước, và thường thấy phần lớn là I/O vào DB. Cách sửa hiệu quả nhất thường là batch: nhận một lô message và ghi bằng một câu bulk. Lần tôi làm, thời gian xử lý giảm khoảng mười lăm lần mà không cần thêm partition hay pod nào. Chỉ khi đã tối ưu xử lý và consumer đã bằng số partition thì tôi mới thêm partition, và phải lưu ý thứ tự theo key."

> Senior tip: đặt SLO cho consumer bằng **độ trễ thời gian** (ví dụ "sự kiện được xử lý trong 30 giây"), không bằng số message lag. Một triệu message lag có thể là 10 giây với consumer nhanh, hoặc 3 giờ với consumer chậm.`,
  follow: ['Làm sao xử lý partition skew?', 'Tăng số partition có ảnh hưởng gì khi đang chạy?'],
  tags: ['kafka', 'consumer-lag', 'capacity-planning', 'scaling']
},
{
  id: 'scenario-122',
  topic: 'scenario',
  level: 'senior',
  q: 'Rò rỉ dữ liệu cá nhân qua log: phát hiện, xử lý, ngăn tái diễn thế nào?',
  a: `**Tóm tắt:** Phát hiện PII hoặc secret trong log thì coi như **đã lộ**. Thứ tự: **chặn nguồn** (hotfix tắt/mask dòng log) → **thu hẹp phạm vi** (khoá quyền truy cập log, xác định ai đã đọc) → **thu hồi/xoay vòng** mọi secret bị lộ → **xoá hoặc làm mờ** dữ liệu trong mọi nơi log đã chảy tới → **đánh giá nghĩa vụ thông báo** theo Nghị định 13/2023 về bảo vệ dữ liệu cá nhân hoặc GDPR → **ngăn tái diễn** bằng masking tập trung và kiểm tra tự động.

### Vì sao log là nơi rò rỉ phổ biến
- Dev log nguyên request/response để debug: {{log.info(request)}} kéo theo số CMND, số thẻ, token.
- {{toString()}} do Lombok sinh ra in mọi field, kể cả field nhạy cảm.
- Exception message chứa giá trị đầu vào.
- Log được copy sang nhiều nơi: file trên node, Elasticsearch, S3 archive, công cụ APM, ticket hỗ trợ — xoá một nơi là chưa đủ.

### Xử lý theo thứ tự
1. **Chặn nguồn (giờ đầu)**: hotfix bỏ dòng log hoặc mask; nếu chưa deploy kịp, hạ log level của logger đó qua Actuator {{/actuator/loggers}}.
2. **Thu hẹp truy cập**: tạm khoá index/bucket chứa log nhạy cảm, chỉ để nhóm điều tra; xuất audit log của hệ thống log để biết ai đã truy vấn.
3. **Secret**: thu hồi và xoay vòng **ngay** (API key, token, mật khẩu DB) — xoá log không làm secret hết hiệu lực. Kiểm tra secret có bị dùng bất thường (CloudTrail, access log).
4. **Dọn dữ liệu**: xoá hoặc reindex có lọc trong Elasticsearch, xoá object S3 archive (lưu ý versioning và bản sao lưu), xoá trong APM và ticket.
5. **Đánh giá và thông báo**: loại dữ liệu, số chủ thể bị ảnh hưởng, ai đã truy cập; phối hợp pháp chế/DPO về nghĩa vụ thông báo theo quy định.
6. **Postmortem** không đổ lỗi, có action cụ thể.

### Ngăn tái diễn
~~~java
// Ẩn field nhạy cảm khỏi toString và JSON log
public record CustomerDto(
    String id,
    @JsonIgnore String nationalId,          // không bao giờ serialize ra log JSON
    String phone) {
  @Override public String toString() {      // không để record in nguyên field
    return "CustomerDto[id=" + id + ", phone=" + mask(phone) + "]";
  }
  static String mask(String p) { return p == null ? null : "*******" + p.substring(Math.max(0, p.length() - 3)); }
}
~~~
- Masking tập trung ở tầng logging (mẫu regex cho số thẻ, CMND/CCCD, email trong layout/encoder) làm lưới an toàn cuối.
- Quy ước log: chỉ log id và mã lỗi, không log body; review checklist có mục PII.
- Quét tự động: job tìm mẫu PII trong log mỗi ngày, gitleaks trong CI cho secret.
- Thời gian lưu log ngắn nhất có thể, phân quyền theo vai trò.

### Ví dụ đời thực
Một ví điện tử phát hiện qua job quét: log của API eKYC ghi nguyên body chứa số CCCD và ảnh dạng base64 trong 9 ngày, khoảng 41.000 bản ghi, chảy vào Elasticsearch và S3 archive. Trong 2 giờ: hotfix bỏ log body, khoá index, audit cho thấy 6 tài khoản nội bộ đã truy vấn. Trong 2 ngày: xoá dữ liệu ở Elasticsearch, S3 (cả version cũ) và APM; pháp chế đánh giá nghĩa vụ báo cáo. Sau đó thêm masking tập trung và job quét hằng ngày — 3 tháng tiếp theo phát hiện thêm 2 chỗ log số điện thoại trước khi lên production.

### Pitfall
- Chỉ xoá log mà không xoay vòng secret.
- Quên các bản sao: archive, backup, công cụ APM, ảnh chụp màn hình trong ticket.
- Mask ở từng chỗ log thủ công — chỗ mới viết sẽ quên.
- Giấu sự cố — vi phạm quy định và mất lòng tin khi bị phát hiện sau.

### Trả lời mẫu khi phỏng vấn
"Khi phát hiện dữ liệu cá nhân hoặc secret trong log, tôi coi như nó đã lộ và xử lý như một sự cố bảo mật. Giờ đầu tiên tôi chặn nguồn: hotfix bỏ hoặc mask dòng log đó, tạm thời thì hạ log level qua Actuator. Đồng thời khoá quyền truy cập vào index và bucket chứa log, và lấy audit xem ai đã truy vấn. Nếu là secret thì thu hồi và xoay vòng ngay, vì xoá log không làm secret hết hiệu lực. Sau đó dọn dữ liệu ở mọi nơi log đã chảy tới, gồm Elasticsearch, archive S3 kể cả version cũ, công cụ APM. Rồi phối hợp pháp chế đánh giá nghĩa vụ thông báo theo Nghị định 13. Để không tái diễn, tôi đặt masking tập trung ở tầng logging làm lưới an toàn, quy ước chỉ log id và mã lỗi, không log body, và một job quét PII trong log mỗi ngày cùng gitleaks trong CI."

> Senior tip: thêm một bài test tự động gửi request có số thẻ và CCCD giả qua các API chính rồi assert rằng log đầu ra không chứa chuỗi đó. Test này rẻ, chạy trong CI, và bắt được phần lớn lỗi log nhạy cảm trước khi lên production.`,
  follow: ['Làm sao phát hiện sớm secret bị commit?', 'Nên mask PII ở lớp nào trong ứng dụng?'],
  tags: ['security-incident', 'pii', 'secrets', 'git', 'logging']
},
{
  id: 'scenario-123',
  topic: 'scenario',
  level: 'lead',
  q: 'GC pause dài bất thường dưới tải: chẩn đoán và xử lý thế nào?',
  a: `**Tóm tắt:** GC pause dài dưới tải có bốn nhóm nguyên nhân chính: **heap gần đầy/leak** (Full GC), **allocation rate quá cao** (GC chạy không kịp), **GC thread bị bóp CPU** (container bị throttle, quá ít CPU), và **cấu hình sai** (heap sát giới hạn container, chọn GC không hợp). Tôi đọc GC log + JFR, kiểm tra CPU throttling, rồi xử lý theo nguyên nhân: sửa leak/giảm allocation trước, sau đó mới sizing và đổi GC.

### Cơ chế cần hiểu
- **G1** (mặc định từ Java 9): chia heap thành region; Young GC dừng toàn bộ (stop-the-world) để copy object còn sống; mục tiêu pause theo {{-XX:MaxGCPauseMillis}} (mặc định 200ms). Nếu marking đồng thời không kịp dọn Old Gen → **Full GC** (Java 10+ đã song song nhưng vẫn dừng lâu với heap lớn).
- **Pause tỉ lệ với số object còn sống**, không tỉ lệ với rác. Cache lớn trong heap làm mỗi lần GC phải copy nhiều hơn.
- **Generational ZGC** (Java 21, bật bằng {{-XX:+UseZGC -XX:+ZGenerational}}; từ Java 23 là mặc định của ZGC): pause dưới 1ms bất kể kích thước heap, đổi lại tốn thêm CPU và bộ nhớ.

### Chẩn đoán
1. **GC log**: {{-Xlog:gc*,safepoint:file=gc.log:time,uptime,level,tags}}. Tìm: "Pause Full", "To-space exhausted", tỉ lệ heap sau GC tăng dần qua các chu kỳ (leak).
2. **Allocation rate**: JFR ({{jcmd <pid> JFR.start duration=120s filename=app.jfr}}) → mục Allocation, xem method nào cấp phát nhiều nhất.
3. **CPU throttling** trong Kubernetes: {{container_cpu_cfs_throttled_periods_total}} / {{container_cpu_cfs_periods_total}}. Throttling 30% nghĩa là GC thread cũng bị dừng giữa chừng → pause kéo dài gấp nhiều lần.
4. **Safepoint**: pause dài nhưng GC log báo thời gian GC ngắn → thời gian chờ thread về safepoint (vòng lặp đếm dài, sự kiện deoptimize).
5. **Leak**: heap sau Full GC vẫn cao và tăng dần → heap dump ({{jcmd <pid> GC.heap_dump}}), phân tích bằng Eclipse MAT (dominator tree).

### Xử lý theo nguyên nhân
| Nguyên nhân | Cách xử lý |
|---|---|
| Leak / cache không giới hạn | Sửa code, cache có giới hạn (Caffeine maximumSize, TTL) |
| Allocation rate cao | Bỏ tạo object thừa trong vòng lặp nóng, stream lớn, log chuỗi không cần |
| CPU throttling | Tăng CPU limit hoặc bỏ limit chỉ giữ request; kiểm tra {{ActiveProcessorCount}} |
| Heap sát giới hạn container | {{-XX:MaxRAMPercentage=70}}, chừa chỗ cho metaspace, thread stack, direct buffer |
| Cần pause thấp với heap lớn | Thử Generational ZGC, đo lại p99 và CPU |

### Ví dụ đời thực
Service tính giá chạy trên Kubernetes: p99 tăng từ 120ms lên 1,4s mỗi giờ cao điểm. GC log có Young GC 600–900ms, nhưng heap sau GC ổn định (không leak). Metric cho thấy CPU throttling 45%: container limit 1 CPU, JVM thấy 1 CPU nên chỉ chạy 1 GC thread, lại còn bị bóp. Đồng thời JFR chỉ ra một hàm build chuỗi JSON log cấp phát 1,2GB/giây. Tăng limit lên 2 CPU, bỏ log chuỗi lớn: allocation rate còn 350MB/giây, Young GC còn 25–40ms, p99 về 140ms. Không cần đổi GC.

### Pitfall
- Tăng heap để "giảm GC" → mỗi lần pause copy nhiều hơn, Full GC còn dài hơn.
- Copy cờ tuning trên mạng mà không đo trước/sau.
- Quên rằng heap chỉ là một phần bộ nhớ của JVM → bị OOMKilled bởi container.
- Đổi sang ZGC mà không tăng CPU → GC đồng thời ăn CPU của ứng dụng.

### Trả lời mẫu khi phỏng vấn
"GC pause dài thì tôi không đoán mà bật GC log và JFR. Tôi phân loại theo bốn nhóm. Một là heap gần đầy hoặc leak: nhìn heap sau mỗi chu kỳ có tăng dần không, có Full GC không; nếu có thì lấy heap dump phân tích bằng MAT. Hai là allocation rate quá cao: JFR chỉ ra method nào cấp phát nhiều nhất. Ba là GC bị bóp CPU, rất hay gặp trên Kubernetes: tôi xem metric CPU throttling, vì GC thread bị dừng giữa chừng thì pause dài gấp nhiều lần. Bốn là cấu hình: heap sát giới hạn container, hoặc chọn GC không hợp. Tôi sửa nguyên nhân trước, như leak, cache không giới hạn hay cấp phát thừa, rồi mới chỉnh sizing và cân nhắc Generational ZGC nếu cần pause thấp với heap lớn. Lần gần nhất, nguyên nhân thật là container 1 CPU bị throttle 45% cộng với một hàm log cấp phát hơn 1GB mỗi giây; sửa hai chỗ đó thì Young GC từ gần 1 giây xuống dưới 40ms."

> Senior tip: luôn đặt biểu đồ **CPU throttling** cạnh biểu đồ GC pause trên dashboard. Trong môi trường container, một nửa số ca "GC chậm" thực chất là "GC không được chạy".`,
  follow: ['ZGC vs G1: khi nào chọn?', 'Làm sao đọc GC log hiệu quả cho người mới?'],
  tags: ['gc', 'jvm', 'performance', 'kubernetes']
},{
  id: 'scenario-124',
  topic: 'scenario',
  level: 'lead',
  q: 'Database deadlock tăng vọt giờ cao điểm: điều tra và khắc phục thế nào?',
  a: `**Tóm tắt:** Deadlock là vòng chờ: transaction A giữ khoá X chờ Y, B giữ Y chờ X; DB phát hiện và **huỷ một bên**. Tăng vọt giờ cao điểm vì nhiều transaction chồng lên nhau hơn. Tôi lấy chi tiết deadlock từ log DB để biết **câu lệnh và dòng nào** tạo vòng, rồi sửa gốc: **khoá theo thứ tự cố định**, **transaction ngắn**, đúng index để không khoá thừa, và **retry có giới hạn** cho bên bị huỷ.

### Cơ chế, từng bước
~~~text
T1: UPDATE account SET ... WHERE id = 1   -- khoá dòng 1
T2: UPDATE account SET ... WHERE id = 2   -- khoá dòng 2
T1: UPDATE account SET ... WHERE id = 2   -- chờ T2
T2: UPDATE account SET ... WHERE id = 1   -- chờ T1  => vòng chờ
DB phát hiện (PostgreSQL kiểm tra sau deadlock_timeout = 1s) và huỷ một transaction
~~~
Chuyển tiền A→B và B→A cùng lúc là ví dụ kinh điển: mỗi transaction khoá tài khoản nguồn trước.

### Lấy bằng chứng
- **PostgreSQL**: log tự ghi "ERROR: deadlock detected" kèm DETAIL các process, loại khoá, câu lệnh của từng bên. Bật thêm {{log_lock_waits = on}} để thấy cả các lần chờ khoá lâu hơn {{deadlock_timeout}} (dấu hiệu sắp deadlock).
- **MySQL InnoDB**: {{SHOW ENGINE INNODB STATUS}} mục LATEST DETECTED DEADLOCK; bật {{innodb_print_all_deadlocks}} để ghi mọi deadlock vào error log.
- Ứng dụng: đếm exception theo câu lệnh (Spring dịch thành {{CannotAcquireLockException}}/{{DeadlockLoserDataAccessException}} tuỳ phiên bản và driver).

### Nguyên nhân hay gặp và cách sửa
| Nguyên nhân | Cách sửa |
|---|---|
| Hai luồng khoá cùng tập dòng theo thứ tự khác nhau | Luôn khoá theo thứ tự id tăng dần |
| Transaction dài (gọi HTTP, xử lý nặng bên trong) | Đưa I/O ra ngoài, transaction chỉ chứa thao tác DB |
| UPDATE thiếu index → khoá nhiều dòng hơn cần (MySQL khoá gap/next-key) | Thêm index đúng cho điều kiện WHERE |
| Foreign key: insert con khoá dòng cha ở chế độ share | Thứ tự thao tác nhất quán, hoặc cập nhật cha trước |
| Batch lớn cập nhật hàng nghìn dòng theo thứ tự ngẫu nhiên | Sắp xếp theo khoá trước khi ghi, chia lô nhỏ |

~~~java
@Transactional
public void transfer(long from, long to, BigDecimal amt) {
    long first = Math.min(from, to), second = Math.max(from, to);
    // khoá theo thứ tự id cố định -> không thể tạo vòng chờ
    Account a = repo.lockById(first);    // SELECT ... FOR UPDATE
    Account b = repo.lockById(second);
    // ... trừ/cộng tiền
}
~~~
Retry: bên bị huỷ được thử lại tối đa 2–3 lần với backoff ngẫu nhiên (Spring Retry), chỉ cho thao tác idempotent. Retry là lưới an toàn, không phải cách sửa.

### Deadlock khác lock wait timeout
- **Deadlock**: có vòng chờ, DB huỷ ngay một bên sau khi phát hiện.
- **Lock wait timeout**: chỉ chờ quá lâu một transaction đang giữ khoá (ví dụ transaction treo), không có vòng.

### Ví dụ đời thực
Hệ thống ví: ngày lương về, deadlock từ 2–3 lên 400 lần/giờ, 1,5% giao dịch chuyển tiền lỗi. Log PostgreSQL cho thấy hai câu UPDATE trên bảng {{wallet}} với cặp id ngược nhau — chuyển tiền qua lại giữa các ví gia đình. Code khoá ví nguồn trước, ví đích sau. Sửa thành khoá theo id tăng dần và thêm retry 2 lần: deadlock còn 0–1 lần/giờ, giao dịch lỗi dưới 0,01%.

### Pitfall
- Chỉ thêm retry và để nguyên thiết kế — tải tăng thì retry cũng deadlock tiếp.
- Nâng isolation lên SERIALIZABLE để "an toàn" → lỗi serialization và xung đột tăng.
- Khoá cả bảng để tránh deadlock → throughput sụp.
- Không giám sát số deadlock theo thời gian → chỉ biết khi khách hàng phàn nàn.

### Trả lời mẫu khi phỏng vấn
"Deadlock là vòng chờ giữa các transaction, và DB sẽ phát hiện rồi huỷ một bên. Nó tăng vọt giờ cao điểm vì có nhiều transaction chồng nhau hơn, chứ nguyên nhân thì đã có sẵn trong thiết kế. Tôi bắt đầu từ bằng chứng: PostgreSQL tự ghi chi tiết deadlock vào log, gồm câu lệnh của từng bên; MySQL thì xem LATEST DETECTED DEADLOCK hoặc bật innodb_print_all_deadlocks. Từ đó tôi biết những câu lệnh và dòng nào tạo vòng. Nguyên nhân hay gặp nhất là khoá cùng tập dòng theo thứ tự khác nhau, như chuyển tiền A sang B và B sang A cùng lúc. Cách sửa là luôn khoá theo thứ tự id tăng dần. Ngoài ra tôi giữ transaction ngắn, không gọi HTTP bên trong, và đảm bảo có index đúng để không khoá thừa dòng. Retry có giới hạn chỉ là lưới an toàn. Một lần ngày lương về, deadlock lên 400 lần mỗi giờ; đổi sang khoá theo thứ tự id thì gần như về 0."

> Senior tip: vẽ biểu đồ số deadlock theo giờ và đặt cảnh báo khi vượt mức nền. Deadlock hiếm khi tự biến mất — nó tăng theo tải, nên bắt được xu hướng sớm là có thời gian sửa thiết kế trước ngày cao điểm tiếp theo.`,
  follow: ['Deadlock vs lock wait timeout khác nhau thế nào?', 'Khi nào có lý do dùng SERIALIZABLE?'],
  tags: ['deadlock', 'locking', 'transaction', 'concurrency']
},
{
  id: 'scenario-125',
  topic: 'scenario',
  level: 'senior',
  q: '(Case study – nghiệp vụ) PO giao ticket một dòng: "Cho phép khách tự huỷ đơn hàng trên app". Bạn làm rõ yêu cầu thế nào trước khi code, và những quy tắc nghiệp vụ ẩn nào bạn phải tìm ra?',
  a: `**Tóm tắt:** Ticket một dòng che giấu cả một **máy trạng thái** và nhiều hệ thống liên quan. Trước khi code, tôi (1) vẽ **vòng đời đơn hàng** và hỏi "được huỷ ở trạng thái nào", (2) đi theo **tiền, hàng, điểm, khuyến mãi** khi huỷ, (3) hỏi **ai bị ảnh hưởng** (kho, vận chuyển, kế toán, CSKH, người bán), (4) chốt bằng **ví dụ cụ thể có số liệu** và tiêu chí nghiệm thu. AI viết được hàm {{cancelOrder()}}; nó không biết rằng đơn đã bàn giao cho đơn vị vận chuyển thì huỷ sẽ tốn phí hoàn hàng 25.000đ mà công ty phải chịu.

### Bước 1 — Vẽ vòng đời và hỏi theo từng trạng thái
~~~text
CREATED → PAID → CONFIRMED → PACKED → HANDED_TO_CARRIER → DELIVERED
                    ↘ CANCELLED (ở đâu được phép? ai được phép?)
~~~
Câu hỏi cho PO: huỷ được tới trạng thái nào? Sau khi đóng gói thì sao? Đơn có nhiều người bán thì huỷ một phần được không? Có giới hạn thời gian (ví dụ trong 30 phút sau khi đặt) không?

### Bước 2 — Đi theo dòng tiền, hàng, quyền lợi
| Khía cạnh | Câu hỏi ẩn |
|---|---|
| Tiền | Hoàn qua kênh nào (thẻ, ví, COD chưa thu)? Mất bao lâu? Phí cổng thanh toán đã mất ai chịu? |
| Khuyến mãi | Voucher đã dùng có được trả lại không? Đơn dùng "mua 2 tặng 1" huỷ một món thì tính lại thế nào? |
| Điểm thưởng | Điểm đã cộng có bị trừ lại? Điểm đã dùng có được hoàn? |
| Kho | Tồn kho được trả lại ngay hay sau khi kiểm hàng hoàn? |
| Vận chuyển | Đã bàn giao thì phải gọi API huỷ vận đơn, có thể mất phí |
| Kế toán | Hoá đơn điện tử đã xuất thì phải xuất hoá đơn điều chỉnh/huỷ theo quy định |
| Gian lận | Khách đặt rồi huỷ liên tục để giữ hàng khuyến mãi? Cần giới hạn số lần huỷ |

### Bước 3 — Hỏi các bên liên quan
Kho, vận chuyển, kế toán, CSKH, đội người bán — mỗi bên 15 phút. Phần lớn quy tắc ẩn nằm ở đây, không nằm trong tài liệu.

### Bước 4 — Chốt bằng ví dụ
~~~text
Ví dụ 3: Đơn 2 món (A 300k, B 200k), voucher giảm 50k toàn đơn, thanh toán thẻ 450k,
trạng thái CONFIRMED. Khách huỷ món B.
→ Hoàn: 200k − 50k × (200/500) = 180k về thẻ trong 5–7 ngày làm việc; voucher không hoàn
  vì đơn vẫn còn hiệu lực; trả tồn kho B ngay; điểm thưởng trừ tương ứng 180k.
~~~
Mỗi ví dụ được PO và kế toán xác nhận, trở thành test case tự động.

### Ví dụ đời thực
Ở một sàn thương mại điện tử, phiên bản đầu của tính năng huỷ đơn được làm trong 3 ngày theo đúng ticket. Sau 2 tuần: 1.300 đơn huỷ sau khi đã bàn giao vận chuyển (phí hoàn hàng khoảng 30 triệu đồng), voucher bị hoàn cho cả đơn huỷ một phần (lỗ khoảng 45 triệu), kế toán phát hiện 400 hoá đơn điện tử chưa được điều chỉnh. Lần làm lại bắt đầu bằng 2 buổi làm rõ yêu cầu với 5 bên, ra 14 quy tắc và 22 ví dụ; mất 2 tuần nhưng không có sự cố nào sau ra mắt.

### Vì sao đây là kỹ năng AI khó thay thế
Thông tin cần thiết **không có trong prompt hay trong code**: nó nằm trong đầu các phòng ban, trong hợp đồng với đơn vị vận chuyển, trong quy định hoá đơn. Người làm được việc này phải biết **hỏi ai, hỏi gì, và nhận ra chỗ các bên hiểu khác nhau**.

### Trả lời mẫu khi phỏng vấn
"Với một ticket một dòng như cho phép khách huỷ đơn, tôi không code ngay. Tôi vẽ vòng đời đơn hàng và hỏi được huỷ ở những trạng thái nào, ai được huỷ, có giới hạn thời gian không. Sau đó tôi đi theo dòng tiền, hàng và quyền lợi: hoàn tiền qua kênh nào và ai chịu phí, voucher và điểm thưởng xử lý ra sao, tồn kho trả lại lúc nào, đơn đã bàn giao vận chuyển thì sao, hoá đơn điện tử cần điều chỉnh thế nào. Tôi gặp ngắn từng bên liên quan như kho, vận chuyển, kế toán, CSKH vì phần lớn quy tắc ẩn nằm ở họ. Cuối cùng tôi chốt bằng các ví dụ có số liệu cụ thể, được PO và kế toán xác nhận, và biến chúng thành test tự động. Ở dự án trước, bỏ qua bước này khiến bản đầu tiên gây lỗ gần trăm triệu trong hai tuần."

> Senior tip: với mọi tính năng chạm vào tiền, hỏi một câu cố định: "Nếu thao tác này bị đảo ngược (huỷ, hoàn, sửa), những con số nào trong hệ thống phải thay đổi theo?". Danh sách trả lời chính là phạm vi thật của ticket.`,
  follow: [
    'Bạn làm gì khi PO và kế toán đưa ra hai quy tắc mâu thuẫn nhau?',
    'Bạn ước lượng ticket này thế nào khi chưa rõ hết yêu cầu?',
    'Làm sao biến các ví dụ nghiệp vụ thành test tự động dễ bảo trì?'
  ],
  tags: ['requirements', 'business rules', 'state machine', 'ai-proof', 'case study']
},
{
  id: 'scenario-126',
  topic: 'scenario',
  level: 'lead',
  q: '(Case study – quyết định kiến trúc) Ban giám đốc muốn ra mắt tính năng "mua trước trả sau" trong 6 tuần để kịp đối thủ. Hệ thống hiện tại không có phân hệ tín dụng. Bạn đưa ra các phương án, phân tích rủi ro và khuyến nghị thế nào — và chịu trách nhiệm cho khuyến nghị đó ra sao?',
  a: `**Tóm tắt:** Nhiệm vụ của Lead không phải nói "không kịp" hay "được", mà là **đưa ra 2–3 phương án có thể thực hiện**, mỗi phương án nêu rõ **phạm vi, rủi ro, chi phí, cái giá phải trả về sau**, rồi **khuyến nghị một phương án** kèm điều kiện thành công và điểm dừng. Quyết định được ghi thành **ADR**, có người duyệt, và tôi theo dõi các rủi ro đã nêu sau khi ra mắt. AI có thể liệt kê phương án; nó không biết đối tác nào đã ký hợp đồng, đội nào đang quá tải, và không chịu trách nhiệm khi khuyến nghị sai.

### Bước 1 — Làm rõ "thành công" nghĩa là gì
- Mục tiêu kinh doanh: có mặt trên thị trường trước Tết? bao nhiêu khách? hạn mức tối đa mỗi khách?
- Ràng buộc không thương lượng: giấy phép cho vay (công ty có được phép không, hay phải qua công ty tài chính đối tác?), quy định về thông tin khách hàng, đối soát.

### Bước 2 — Ba phương án
| | A. Tích hợp đối tác BNPL (đối tác cấp tín dụng) | B. Làm phiên bản tối thiểu trên nền hiện có | C. Xây phân hệ tín dụng đầy đủ |
|---|---|---|---|
| Phạm vi 6 tuần | Checkout gọi đối tác, nhận kết quả, đối soát | Hạn mức cố định cho nhóm khách tin cậy, kỳ trả 1 lần | Chấm điểm, nhiều kỳ, nhắc nợ, thu hồi |
| Rủi ro pháp lý | Thấp (đối tác có giấy phép) | Cao nếu không có giấy phép cho vay | Cao |
| Rủi ro nợ xấu | Đối tác chịu | Công ty chịu | Công ty chịu |
| Doanh thu | Phí hoa hồng thấp | Cao hơn | Cao nhất về lâu dài |
| Kịp 6 tuần | Có (nếu đối tác sẵn API) | Sát nút, nợ kỹ thuật lớn | Không |
| Cái giá về sau | Phụ thuộc đối tác | Phải viết lại | — |

### Bước 3 — Khuyến nghị có điều kiện
"Khuyến nghị **A** để kịp ra mắt, đồng thời bắt đầu khảo sát pháp lý và thiết kế cho **C** chạy song song trong 6 tháng. Không chọn B vì rủi ro pháp lý và nợ xấu do công ty tự gánh mà không có năng lực chấm điểm." Kèm theo: **điều kiện thành công** (đối tác xác nhận API và môi trường thử trong tuần 1), **điểm dừng** (nếu tuần 2 chưa có môi trường thử, lùi ngày ra mắt hoặc giảm phạm vi), **chỉ số theo dõi** (tỉ lệ duyệt, tỉ lệ hoàn tất thanh toán, khiếu nại).

### Bước 4 — Ghi và chịu trách nhiệm
- ADR: bối cảnh, phương án, quyết định, hệ quả, ngày xem lại; người duyệt (CTO, pháp chế, rủi ro).
- Sau ra mắt, báo cáo định kỳ các rủi ro đã nêu; nếu giả định sai, tôi là người đề xuất điều chỉnh trước tiên.

### Ví dụ đời thực
Một sàn thương mại điện tử đứng trước đúng yêu cầu này. Đội kỹ thuật ban đầu đề xuất tự xây (phương án C, 5 tháng); ban giám đốc ép làm B trong 6 tuần. Lead trình bày bảng trên kèm ý kiến pháp chế: công ty không có giấy phép cho vay, nên B có rủi ro bị xử phạt. Ban giám đốc chọn A với một công ty tài chính đối tác; ra mắt sau 5 tuần, tỉ lệ chuyển đổi ở checkout tăng 9% với nhóm đơn trên 2 triệu. Sau 8 tháng, dựa trên dữ liệu hành vi trả nợ thu được qua đối tác, công ty mới xây phân hệ riêng với rủi ro thấp hơn nhiều.

### Vì sao đây là kỹ năng AI khó thay thế
Quyết định phụ thuộc vào **thông tin không công khai** (hợp đồng, giấy phép, năng lực đội, khẩu vị rủi ro của lãnh đạo) và cần **một người chịu trách nhiệm** trước ban giám đốc và cơ quan quản lý.

### Trả lời mẫu khi phỏng vấn
"Khi bị ép một mốc thời gian, tôi không trả lời được hay không được, mà đưa ra hai ba phương án khả thi. Trước hết tôi làm rõ thành công là gì và các ràng buộc không thương lượng, như giấy phép cho vay. Với mua trước trả sau, tôi so ba hướng: tích hợp đối tác có giấy phép, làm bản tối thiểu tự gánh rủi ro, hoặc xây phân hệ đầy đủ; mỗi hướng có phạm vi, rủi ro pháp lý, rủi ro nợ xấu, doanh thu, khả năng kịp hạn và cái giá về sau. Tôi khuyến nghị một phương án kèm điều kiện thành công, điểm dừng và chỉ số theo dõi, ghi thành ADR có người duyệt từ pháp chế và rủi ro. Sau ra mắt, tôi theo dõi các giả định đã nêu và chủ động đề xuất điều chỉnh nếu chúng sai."

> Senior tip: luôn kèm một **"điểm dừng"** trong khuyến nghị: điều kiện cụ thể mà nếu không đạt vào ngày X thì sẽ cắt phạm vi hoặc lùi hạn. Nó biến cuộc tranh luận "có kịp không" thành một kế hoạch có kiểm soát mà lãnh đạo dễ đồng ý.`,
  follow: [
    'Bạn trình bày rủi ro kỹ thuật cho ban giám đốc không có nền tảng kỹ thuật thế nào?',
    'Nếu ban giám đốc vẫn chọn phương án bạn không khuyến nghị, bạn làm gì?',
    'ADR của bạn gồm những mục nào và lưu ở đâu?'
  ],
  tags: ['architecture decision', 'trade-off', 'ADR', 'leadership', 'ai-proof', 'case study']
},
{
  id: 'scenario-127',
  topic: 'scenario',
  level: 'lead',
  q: '(Case study – chỉ huy sự cố) 21:05 tối thứ Sáu, tỉ lệ thanh toán thất bại tăng từ 0,5% lên 30%. Có ba giả thuyết: bản deploy lúc 20:30, cổng thanh toán đối tác đang chậm, và DB đang chạy job bảo trì. Bạn là người chỉ huy sự cố. Bạn điều phối, ra quyết định và giao tiếp thế nào trong 60 phút đầu?',
  a: `**Tóm tắt:** Người chỉ huy sự cố (incident commander) **không tự đi debug** — họ **điều phối**: chia vai trò, cho các giả thuyết được kiểm tra **song song**, ưu tiên **giảm thiệt hại** trước khi tìm nguyên nhân, ra quyết định khi thông tin chưa đầy đủ (rollback là hành động có thể đảo ngược, rẻ), và **giao tiếp đều đặn** với các bên. AI có thể gợi ý giả thuyết; nó không gọi được đối tác lúc 9 giờ tối, không quyết định được việc dừng một job của DBA, và không chịu trách nhiệm cho quyết định.

### 0–10 phút: tổ chức
- Mở kênh sự cố, tuyên bố mức độ (P1: ảnh hưởng doanh thu trực tiếp), nhận vai **chỉ huy**.
- Chia vai: **người điều tra kỹ thuật** (2 người, mỗi người một giả thuyết), **người liên lạc** (cập nhật CSKH, quản lý, đối tác), **người ghi chép** (dòng thời gian).
- Kiểm tra nhanh "điều gì thay đổi gần đây": deploy 20:30, job bảo trì DB 20:45 (ai bật?), dashboard cổng thanh toán.

### 10–25 phút: kiểm tra song song, giảm thiệt hại sớm
| Giả thuyết | Kiểm tra nhanh | Hành động giảm thiệt hại |
|---|---|---|
| Deploy 20:30 | Lỗi bắt đầu lúc nào so với 20:30? Lỗi có tập trung ở pod phiên bản mới? | Rollback (5 phút, đảo ngược được) |
| Cổng thanh toán chậm | Latency và mã lỗi từ đối tác; trang trạng thái của họ | Chuyển một phần traffic sang cổng dự phòng nếu có |
| Job bảo trì DB | Lock wait, CPU DB, query chậm từ 20:45 | Tạm dừng job (cần DBA đồng ý) |
Nguyên tắc: hành động **rẻ và đảo ngược được** thì làm ngay khi có dấu hiệu, không chờ chắc chắn 100%.

### 25–60 phút: quyết định và xác nhận
Trong ví dụ này: lỗi tăng từ 20:47 (không khớp 20:30) và chỉ ở bước ghi giao dịch; lock wait tăng mạnh; job "VACUUM FULL" bảng giao dịch được một DBA bật nhầm thay cho bảng log. Quyết định: dừng job (DBA xác nhận an toàn), không rollback deploy. 21:31 tỉ lệ lỗi về 0,6%. Tiếp tục theo dõi 30 phút trước khi đóng sự cố; giao dịch thất bại trong khung giờ được liệt kê để CSKH chủ động liên hệ.

### Giao tiếp
- Cập nhật mỗi 15 phút theo mẫu: **ảnh hưởng — đang làm gì — lần cập nhật tiếp theo lúc mấy giờ**. Không đoán nguyên nhân khi chưa xác nhận.
- CSKH nhận câu trả lời mẫu cho khách; quản lý nhận ước lượng ảnh hưởng (số giao dịch, số tiền).

### Sau sự cố
Postmortem không đổ lỗi trong 3 ngày: tại sao lệnh nặng có thể chạy trên bảng giao dịch giờ cao điểm mà không có cảnh báo? Hành động: lịch bảo trì phải qua phê duyệt, chặn lệnh khoá bảng lớn bằng quyền, cảnh báo lock wait.

### Vì sao đây là kỹ năng AI khó thay thế
Thông tin rời rạc giữa con người và hệ thống, cần **quyết định dưới áp lực khi chưa đủ dữ liệu**, cần **thẩm quyền** để dừng việc của đội khác, và cần **giao tiếp** với khách hàng, đối tác, lãnh đạo.

### Trả lời mẫu khi phỏng vấn
"Là người chỉ huy, việc đầu tiên tôi làm là tổ chức chứ không tự debug: mở kênh sự cố, tuyên bố mức độ, chia vai gồm người điều tra cho từng giả thuyết, người liên lạc và người ghi dòng thời gian. Các giả thuyết được kiểm tra song song bằng những câu hỏi nhanh: lỗi bắt đầu lúc nào so với thời điểm deploy, lỗi nằm ở đâu, đối tác có báo sự cố không, DB có lock wait không. Tôi ưu tiên giảm thiệt hại: hành động rẻ và đảo ngược được như rollback hay dừng một job thì làm ngay khi có dấu hiệu. Tôi cập nhật mỗi 15 phút theo mẫu ảnh hưởng, đang làm gì, lần cập nhật tiếp theo, và không đoán nguyên nhân khi chưa xác nhận. Sau đó là postmortem không đổ lỗi với hành động cụ thể để không lặp lại."

> Senior tip: hỏi **"điều gì đã thay đổi trong 2 giờ qua?"** ngay phút đầu, và hỏi cả con người (ai vừa chạy gì, bật gì) chứ không chỉ xem lịch deploy. Rất nhiều sự cố lớn bắt nguồn từ một thao tác tay không nằm trong bất kỳ hệ thống theo dõi nào.`,
  follow: [
    'Khi nào bạn chọn rollback, khi nào chọn sửa nóng (fix forward)?',
    'Bạn viết postmortem không đổ lỗi thế nào khi lỗi rõ ràng do một người?',
    'Làm sao giảm thời gian phát hiện sự cố (MTTD) cho luồng thanh toán?'
  ],
  tags: ['incident command', 'production', 'communication', 'decision making', 'ai-proof', 'case study']
},
{
  id: 'scenario-128',
  topic: 'scenario',
  level: 'senior',
  q: '(Case study – tiền và tuân thủ) Kiểm toán nội bộ phát hiện tổng số dư ví của khách lệch 38 triệu đồng so với sổ cái kế toán (0,02%). Bạn tìm nguyên nhân và điều chỉnh dữ liệu thế nào để vừa đúng vừa được kiểm toán chấp nhận?',
  a: `**Tóm tắt:** Với tiền, **cách sửa quan trọng như kết quả**: không bao giờ chạy {{UPDATE}} số dư trực tiếp. Tôi (1) **khoanh vùng** lệch theo ngày/loại giao dịch/ví bằng đối soát, (2) tìm **nguyên nhân gốc** bằng dữ liệu (log, sự kiện, bút toán), (3) **sửa nguyên nhân** trong code, (4) điều chỉnh số liệu bằng **bút toán điều chỉnh** có lý do, bằng chứng và **maker-checker**, (5) chứng minh với kiểm toán bằng **báo cáo đối soát trước/sau** và quy trình phòng ngừa.

### Bước 1 — Khoanh vùng
Bất biến cần đúng: với mỗi ví, **số dư = tổng các bút toán** của ví đó. Chạy đối soát:
~~~sql
SELECT w.id, w.balance, coalesce(sum(e.amount), 0) AS ledger_sum,
       w.balance - coalesce(sum(e.amount), 0) AS diff
FROM wallet w LEFT JOIN ledger_entry e ON e.wallet_id = w.id
GROUP BY w.id, w.balance
HAVING w.balance <> coalesce(sum(e.amount), 0);
~~~
Kết quả: 412 ví lệch; nhóm theo ngày phát sinh bút toán cuối → tập trung từ ngày 14/10; nhóm theo loại giao dịch → gần như toàn bộ là **hoàn tiền một phần**.

### Bước 2 — Nguyên nhân gốc
Từ 14/10, một bản sửa đổi hoàn tiền một phần **cập nhật số dư** nhưng ghi **bút toán theo số tiền gốc** của giao dịch thay vì số tiền hoàn (hoặc ngược lại) khi đơn có voucher. Tái hiện bằng test với dữ liệu của 3 ví lệch. Kiểm tra thêm: không có dấu hiệu gian lận (không có ví nào rút tiền bất thường sau khi được cộng thừa).

### Bước 3 — Sửa nguyên nhân
Bản sửa code, thêm test với các ví dụ có voucher, thêm **kiểm tra bất biến** trong code: mọi thay đổi số dư phải đi kèm bút toán cùng số tiền trong cùng transaction (hoặc tốt hơn: số dư được **tính từ** sổ cái/ cập nhật bởi một nơi duy nhất).

### Bước 4 — Điều chỉnh có kiểm soát
- Không sửa giao dịch gốc, không {{UPDATE}} số dư tay. Tạo **bút toán điều chỉnh** cho từng ví: số tiền, lý do ("điều chỉnh lỗi hoàn tiền một phần 14/10–02/11, ticket INC-2291"), liên kết tới giao dịch gốc.
- **Maker** (kỹ sư/ vận hành) tạo lô điều chỉnh từ script đã review; **checker** (kế toán/kiểm soát) duyệt; hệ thống áp dụng và ghi audit.
- Với ví bị **cộng thừa** mà khách đã tiêu: theo chính sách và pháp chế (thu hồi, hay công ty chịu) — đây là quyết định nghiệp vụ, không phải của kỹ sư.

### Bước 5 — Chứng minh
Chạy lại đối soát: 0 ví lệch. Gửi kiểm toán: mô tả nguyên nhân, phạm vi (số ví, số tiền, khoảng thời gian), danh sách bút toán điều chỉnh có phê duyệt, bằng chứng đối soát trước/sau, hành động phòng ngừa (đối soát tự động hằng ngày với cảnh báo).

### Ví dụ đời thực
Lần trước công ty gặp lệch tương tự, một kỹ sư sửa trực tiếp số dư bằng script trong đêm "cho nhanh". Kiểm toán không chấp nhận vì không có dấu vết và không ai duyệt; công ty phải dựng lại toàn bộ lịch sử từ log mất 3 tuần. Lần này, theo quy trình trên, từ lúc phát hiện tới khi kiểm toán đóng hồ sơ mất 6 ngày; đối soát tự động hằng ngày được bật, lần lệch sau (2 tháng sau, do một lỗi khác) được phát hiện trong 18 giờ với 3 ví.

### Vì sao đây là kỹ năng AI khó thay thế
Cần hiểu **kế toán kép, quy định kiểm toán, phân quyền phê duyệt**, cân nhắc **chính sách với khách hàng** và chịu **trách nhiệm pháp lý** cho dữ liệu tài chính.

### Trả lời mẫu khi phỏng vấn
"Với lệch số dư, cách sửa quan trọng như kết quả, nên tôi không bao giờ update số dư trực tiếp. Đầu tiên tôi khoanh vùng bằng đối soát bất biến: số dư mỗi ví phải bằng tổng bút toán của nó; nhóm các ví lệch theo ngày và loại giao dịch để tìm điểm bắt đầu, ở đây là hoàn tiền một phần từ một ngày cụ thể. Sau đó tái hiện bằng test và sửa nguyên nhân trong code, thêm kiểm tra bất biến. Dữ liệu được điều chỉnh bằng bút toán điều chỉnh có lý do, liên kết giao dịch gốc, qua maker-checker: người tạo khác người duyệt, có audit. Trường hợp khách đã tiêu số tiền cộng thừa là quyết định của nghiệp vụ và pháp chế. Cuối cùng tôi chứng minh với kiểm toán bằng đối soát trước và sau, và bật đối soát tự động hằng ngày."

> Senior tip: thiết kế để **lệch không thể xảy ra im lặng**: số dư chỉ được thay đổi ở một chỗ duy nhất trong code, cùng transaction với bút toán, và một job đối soát chạy hằng ngày cảnh báo khi có dù chỉ một đồng chênh lệch.`,
  follow: [
    'Vì sao không được sửa trực tiếp giao dịch gốc dù biết nó sai?',
    'Bạn thiết kế để số dư và sổ cái không bao giờ lệch nhau thế nào?',
    'Khi khách đã tiêu số tiền được cộng thừa, các lựa chọn xử lý là gì?'
  ],
  tags: ['ledger', 'reconciliation', 'audit', 'maker-checker', 'fintech', 'ai-proof', 'case study']
},
{
  id: 'scenario-129',
  topic: 'scenario',
  level: 'senior',
  q: '(Case study – kiểm soát code AI viết) Team dùng AI coding assistant, tốc độ ra PR tăng gấp đôi nhưng 3 tháng gần đây số sự cố production tăng 40%. Bạn được giao "giữ tốc độ nhưng giảm lỗi". Bạn phân tích và thiết kế quy trình thế nào?',
  a: `**Tóm tắt:** AI làm **tăng lượng code** nhanh hơn khả năng **hiểu và kiểm soát** của team. Tôi phân tích **loại lỗi** nào lọt lên production (thường không phải lỗi cú pháp mà là lỗi ở **ranh giới**: đồng thời, transaction, retry, bảo mật, dữ liệu thật), rồi đặt **lưới an toàn tự động** cho đúng các loại đó (test, static analysis, kiểm tra quy tắc kiến trúc), thay đổi **cách review** (review theo rủi ro, tác giả phải giải thích được code), và giữ **PR nhỏ**. Mục tiêu không phải cấm AI mà là để con người tập trung review đúng chỗ AI hay sai.

### Bước 1 — Phân tích dữ liệu sự cố
Gắn nhãn 31 sự cố 3 tháng theo nguyên nhân:
| Loại lỗi | Số sự cố | Ví dụ |
|---|---|---|
| Đồng thời / race | 8 | "get rồi put" trên map dùng chung, check-then-act trên số dư |
| Transaction / proxy | 6 | Gọi {{@Transactional}} nội bộ, gọi HTTP trong transaction |
| Retry / idempotency | 5 | Retry thao tác không idempotent → trùng giao dịch |
| Bảo mật / dữ liệu | 4 | Log toàn bộ request có số điện thoại, thiếu kiểm tra quyền sở hữu (BOLA) |
| Hiệu năng | 5 | N+1, tải cả bảng vào bộ nhớ |
| Khác | 3 | |
Nhận xét: 90% là lỗi mà **code "trông đúng"** và test đơn vị với mock vẫn xanh.

### Bước 2 — Lưới an toàn tự động cho đúng các loại lỗi
- **Test tích hợp thật** (Testcontainers) cho repository và luồng tiền; test đồng thời cho các thao tác trên số dư/tồn kho.
- **Static analysis** có rule cho lỗi hay gặp (SpotBugs, Error Prone, Sonar): {{SimpleDateFormat}} static, so sánh wrapper bằng {{==}}, tài nguyên không đóng.
- **ArchUnit**: cấm gọi HTTP client bên trong class có {{@Transactional}}, cấm {{@Data}} trên entity, cấm log trực tiếp object request.
- **Test bảo mật tự động**: user A truy cập tài nguyên của user B phải nhận 404.
- **Đếm query** trong test cho API danh sách.

### Bước 3 — Thay đổi review
- PR tối đa khoảng 400 dòng; PR do AI sinh phần lớn phải ghi rõ trong mô tả.
- **Checklist theo rủi ro**: PR chạm tiền, quyền, dữ liệu cá nhân, đồng thời → bắt buộc reviewer senior và câu hỏi "hai request cùng lúc thì sao? retry thì sao? lỗi giữa chừng thì sao?".
- **Tác giả phải giải thích** được mọi dòng: nếu không giải thích được vì sao dùng {{REQUIRES_NEW}} ở đây, PR chưa sẵn sàng.

### Bước 4 — Đo lại
Theo dõi tỉ lệ sự cố trên số deploy, thời gian từ commit tới production, tỉ lệ PR bị trả lại vì lỗi rủi ro cao.

### Ví dụ đời thực
Sau 3 tháng áp dụng: số sự cố giảm 55% so với đỉnh (thấp hơn cả trước khi dùng AI), tốc độ ra PR chỉ giảm khoảng 10% so với lúc cao nhất. Lưới tự động chặn trung bình 6 lỗi thuộc nhóm rủi ro cao mỗi tuần trước khi tới reviewer. Hai junior chia sẻ rằng việc phải giải thích code AI sinh ra giúp họ học nhanh hơn thay vì chỉ "chấp nhận gợi ý".

### Vì sao đây là kỹ năng AI khó thay thế
AI làm tăng lượng code cần kiểm soát; người có kinh nghiệm production biết **chỗ nào code trông đúng mà sai** và thiết kế được hệ thống kiểm soát cho cả team.

### Trả lời mẫu khi phỏng vấn
"Tôi không cấm AI mà bắt đầu từ dữ liệu: gắn nhãn các sự cố theo loại lỗi. Thường phần lớn là lỗi code trông đúng nhưng sai ở ranh giới: race condition, transaction qua proxy, retry không idempotent, thiếu kiểm tra quyền sở hữu, log dữ liệu nhạy cảm, N+1. Rồi tôi đặt lưới an toàn tự động cho đúng các loại đó: test tích hợp thật và test đồng thời, static analysis, ArchUnit cấm các mẫu nguy hiểm, test bảo mật kiểu user A truy cập dữ liệu user B, đếm query. Review được làm theo rủi ro: PR nhỏ, PR chạm tiền, quyền hay dữ liệu cá nhân cần reviewer senior với checklist, và tác giả phải giải thích được mọi dòng. Rồi đo lại tỉ lệ sự cố trên số deploy để biết quy trình có hiệu quả không."

> Senior tip: thêm vào template PR ba câu hỏi bắt buộc cho thay đổi có trạng thái: "Hai request cùng lúc thì sao? Retry thì sao? Lỗi ở giữa thì sao?". Ba câu này bắt được phần lớn lỗi mà cả người lẫn AI hay bỏ sót.`,
  follow: [
    'Làm sao đo hiệu quả thật của AI coding assistant với team?',
    'Quy tắc nào bạn đưa vào ArchUnit đầu tiên, và vì sao?',
    'Bạn hướng dẫn junior dùng AI mà vẫn học được kỹ năng nền tảng thế nào?'
  ],
  tags: ['AI coding', 'code review', 'quality', 'ArchUnit', 'ai-proof', 'case study']
},
{
  id: 'scenario-130',
  topic: 'scenario',
  level: 'senior',
  q: '(Case study – vận hành hạ tầng) Một thay đổi Terraform nhỏ (đổi tên một tham số của RDS do AI gợi ý "cho chuẩn") được merge; terraform plan có dòng "must be replaced" nhưng không ai đọc kỹ. Pipeline apply suýt xoá và tạo lại DB production. Bạn xử lý và thiết kế lại quy trình thay đổi hạ tầng thế nào?',
  a: `**Tóm tắt:** Thay đổi hạ tầng có **phạm vi ảnh hưởng lớn** và nhiều thao tác **không đảo ngược được** (xoá DB, đổi mạng, đổi IAM). Quy trình an toàn cần nhiều lớp: **bảo vệ tài nguyên quan trọng ngay trong code** ({{prevent_destroy}}, deletion protection), **plan được kiểm tra tự động** bằng policy-as-code (chặn mọi hành động destroy/replace trên tài nguyên quan trọng), **người duyệt đọc plan** chứ không chỉ đọc diff code, **tách state và quyền** theo môi trường, và **backup đã kiểm chứng**. Lần này may nhờ deletion protection; quy trình không được phụ thuộc vào may mắn.

### Điều gì đã xảy ra
Đổi một thuộc tính mà provider coi là **ForceNew** (ví dụ tên định danh của instance) khiến Terraform lên kế hoạch **xoá rồi tạo mới**. Diff code chỉ là một dòng đổi tên — reviewer đọc code và duyệt. Plan có dòng {{-/+ resource ... must be replaced}} nằm giữa 300 dòng output. Apply bị chặn lại vì RDS có {{deletion_protection = true}} — nếu không, DB sẽ bị xoá (snapshot cuối tuỳ cấu hình) và hệ thống ngừng nhiều giờ.

### Xử lý ngay
1. Dừng pipeline, khoá state, xác nhận không có tài nguyên nào đã bị thay đổi một phần.
2. Revert thay đổi; nếu thật sự cần đổi tên, dùng cách không tạo lại (khối {{moved}} hoặc {{terraform state mv}} khi chỉ đổi địa chỉ trong code; hoặc chấp nhận giữ tên cũ).
3. Postmortem không đổ lỗi: vì sao một thay đổi có "replace" trên DB production đi được tới bước apply?

### Thiết kế lại quy trình
| Lớp | Biện pháp |
|---|---|
| Trong code | {{prevent_destroy = true}} (trong khối lifecycle) cho DB, bucket dữ liệu, KMS key; deletion protection của dịch vụ bật sẵn |
| Kiểm tra plan tự động | Xuất plan dạng JSON, kiểm tra bằng OPA/Conftest (hoặc Sentinel): chặn mọi action delete/replace trên loại tài nguyên quan trọng ở prod trừ khi có nhãn phê duyệt đặc biệt |
| Hiển thị cho reviewer | Bot comment tóm tắt plan lên PR: số tạo/sửa/xoá, liệt kê nổi bật mọi "replace"/"destroy" |
| Quyền và phạm vi | State tách theo môi trường và theo lớp (mạng, dữ liệu, ứng dụng); role apply của prod chỉ chạy từ pipeline, cần phê duyệt thủ công |
| Bảo hiểm cuối | AWS Backup có Vault Lock, khôi phục thử định kỳ; SCP chặn xoá tài nguyên có tag quan trọng ngoài quy trình |
| Thay đổi do AI gợi ý | Được đối xử như mọi thay đổi khác: không có ngoại lệ "chỉ là đổi tên cho chuẩn" |

### Ví dụ đời thực
Sau sự cố, team bật policy-as-code trong pipeline: tháng đầu tiên nó chặn 3 thay đổi có "replace" trên tài nguyên quan trọng (một subnet, một security group dùng chung, một Aurora cluster), cả ba đều do thay đổi tưởng vô hại. Thời gian review PR hạ tầng giảm vì bot tóm tắt plan, reviewer chỉ tập trung vào phần nổi bật. Không có sự cố hạ tầng nghiêm trọng nào trong 9 tháng tiếp theo.

### Vì sao đây là kỹ năng AI khó thay thế
AI viết được Terraform; nó không chịu trách nhiệm cho **phạm vi ảnh hưởng** của một lệnh apply trên production và không thiết kế được hệ thống kiểm soát phù hợp với rủi ro của tổ chức. Người vận hành phải hiểu **thao tác nào đảo ngược được, thao tác nào không**.

### Trả lời mẫu khi phỏng vấn
"Thay đổi hạ tầng nguy hiểm vì phạm vi ảnh hưởng lớn và nhiều thao tác không đảo ngược được, nên tôi không để an toàn phụ thuộc vào việc reviewer đọc kỹ plan dài. Tôi đặt nhiều lớp: tài nguyên quan trọng có prevent_destroy và deletion protection ngay trong code; plan được xuất JSON và kiểm tra tự động bằng OPA hoặc Conftest để chặn mọi hành động xoá hay tạo lại trên tài nguyên quan trọng ở production; bot tóm tắt plan lên PR và làm nổi bật mọi replace; state tách theo môi trường và theo lớp; apply production chỉ chạy từ pipeline với phê duyệt; và backup có Vault Lock đã được khôi phục thử. Khi chỉ đổi tên trong code, tôi dùng khối moved thay vì để Terraform tạo lại tài nguyên. Thay đổi do AI gợi ý cũng đi qua đúng quy trình đó, không có ngoại lệ."

> Senior tip: thêm vào pipeline một bước **đếm "destroy" và "replace" trong plan**; nếu khác 0 ở production thì pipeline dừng và yêu cầu một phê duyệt riêng có ghi lý do. Một dòng script đơn giản này chặn được loại sự cố tốn kém nhất của Infrastructure as Code.`,
  follow: [
    'Khối moved trong Terraform giải quyết vấn đề gì?',
    'Bạn viết policy OPA/Conftest chặn destroy trên tài nguyên quan trọng thế nào?',
    'Tách state Terraform theo môi trường và theo lớp có lợi gì?'
  ],
  tags: ['Terraform', 'infrastructure as code', 'policy as code', 'change management', 'ai-proof', 'case study']
},
);
