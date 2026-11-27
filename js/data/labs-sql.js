/* Debug labs — category sql. Format: AGENTS.md section 10 (LABS). */
(window.LABS = window.LABS || []).push(
{
  id: 'lab-sql-001',
  category: 'sql',
  title: 'Báo cáo giao dịch trong ngày quét 42 triệu dòng dù đã có index',
  level: 'senior',
  scenario: `**Bối cảnh.** Ngân hàng số VBank vận hành service {{payment-core}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM, storage gp3 500 GB). Bảng {{payment_transaction}} giữ toàn bộ giao dịch thanh toán của khách hàng lẻ và SME: sau 3 năm đã có **42.318.904 dòng** (~9,3 GB tính cả index, heap ~4,6 GB — nằm gọn trong RAM), trung bình khoảng 38 nghìn giao dịch mỗi ngày.

**Triệu chứng (14/03/2026).** Từ 09:40, màn hình "Doanh thu trong ngày" của khối Retail gọi {{GET /api/v1/reports/payment?date=2026-03-14}} bắt đầu **timeout 30 giây**, phát sinh khoảng 400 lỗi 504/phút. RDS báo {{CPUUtilization = 98%}} trong khi {{ReadIOPS}} gần như không đổi → tài nguyên cạn kiểu CPU, không phải I/O. {{pg_stat_activity}} cho thấy hàng chục câu query giống hệt nhau cùng quét một bảng.

**Những gì đã thử mà không ăn.** Tăng {{work_mem}} lên 256 MB, tăng {{max_connections}}, tạo read-replica cho báo cáo — thời gian chạy **không giảm**. Trên staging (bảng mới chỉ có 3,2 triệu dòng) câu query mất 1,9 giây nên vẫn pass test hiệu năng, không ai để ý.

**Việc bạn có.** Ba artifact dưới đây lấy từ production lúc 09:41–09:47 ngày 14/03. Hãy tìm nguyên nhân gốc, chứng minh bằng dòng lệnh cụ thể trong artifact, rồi đề xuất cách sửa ngắn hạn (trong ngày) và cách sửa dài hạn (quý tới).`,
  artifacts: [
    {
      name: 'explain-daily-report.txt',
      lang: 'text',
      content: `-- psql (PostgreSQL 15.6 (Debian 15.6-1.pgdg120+1))
-- artifact: chạy trên RDS vbank-payment-primary, 2026-03-14 09:41:12 +07
vbank=# \\timing on
Timing is on.

-- (1) CÂU QUERY THẬT ĐANG CHẠY TRONG PRODUCTION
vbank=# EXPLAIN (ANALYZE, BUFFERS)
SELECT p.status, count(*), sum(p.amount) AS total
FROM payment_transaction p
WHERE date_trunc('day', p.created_at) = '2026-03-14 00:00:00+07'::timestamptz
GROUP BY p.status;
                                                     QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=1241482.52..1241482.56 rows=4 width=48) (actual time=38744.498..38744.503 rows=4 loops=1)
   Group Key: status
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=598934 read=6178
   ->  Seq Scan on payment_transaction p  (cost=0.00..1239895.56 rows=211595 width=17) (actual time=37902.551..38741.902 rows=9876 loops=1)
         Filter: (date_trunc('day'::text, created_at) = '2026-03-14 00:00:00+07'::timestamp with time zone)
         Rows Removed by Filter: 42309028
         Buffers: shared hit=598934 read=6178
 Planning Time: 0.284 ms
 Execution Time: 38745.208 ms
(10 rows)

Time: 38745.512 ms
-- ghi chú: payment-core đặt max_parallel_workers_per_gather = 0 cho role ứng dụng nên plan không có Gather/Parallel Seq Scan

-- (2) CÙNG MỘT CÂU HỎI, CHỈ ĐỔI ĐIỀU KIỆN LẠI THÀNH KHOẢNG THỜI GIAN
vbank=# EXPLAIN (ANALYZE, BUFFERS)
SELECT p.status, count(*), sum(p.amount) AS total
FROM payment_transaction p
WHERE p.created_at >= '2026-03-14 00:00:00+07'::timestamptz
  AND p.created_at <  '2026-03-15 00:00:00+07'::timestamptz
GROUP BY p.status;
                                                     QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 HashAggregate  (cost=1062.44..1062.48 rows=4 width=48) (actual time=6.512..6.515 rows=4 loops=1)
   Group Key: status
   Batches: 1  Memory Usage: 24kB
   Buffers: shared hit=171 read=12
   ->  Index Scan using idx_payment_transaction_created_at on payment_transaction p  (cost=0.56..985.64 rows=10240 width=17) (actual time=0.031..4.204 rows=9876 loops=1)
         Index Cond: ((created_at >= '2026-03-14 00:00:00+07'::timestamp with time zone) AND (created_at < '2026-03-15 00:00:00+07'::timestamp with time zone))
         Buffers: shared hit=171 read=12
 Planning Time: 0.221 ms
 Execution Time: 6.598 ms
(9 rows)

Time: 6.871 ms

-- (3) GHI CHÚ THÊM TỪ OPS: 12 phiên bản của cùng câu (1) đang chạy song song
--     SELECT count(*) FROM pg_stat_activity WHERE query LIKE 'SELECT p.status, count(*)%';
--      count
--     -------
--         12`,
    },
    {
      name: 'explain-contract-ref.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:47:03 +07, RDS vbank-payment-primary
-- Endpoint GET /api/v1/payments?contractRef=8845123 (tham số từ Java là Long)
-- Query native trong PaymentRepository SAU khi dev "vá" lỗi operator does not exist:
vbank=# EXPLAIN (ANALYZE, BUFFERS)
SELECT p.id, p.amount, p.created_at
FROM payment_transaction p
WHERE p.contract_ref::bigint = 8845123;
                                                       QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 Seq Scan on payment_transaction p  (cost=0.00..1239895.56 rows=211595 width=32) (actual time=12188.507..12188.508 rows=0 loops=1)
   Filter: ((contract_ref)::bigint = 8845123)
   Rows Removed by Filter: 42318904
   Buffers: shared hit=601877 read=3235
 Planning Time: 0.198 ms
 Execution Time: 12189.771 ms
(6 rows)

Time: 12190.014 ms

-- Trích từ app.log ngày 12/03 (trước khi deploy bản vá, lúc 06:12:44):
--   ERROR:  operator does not exist: character varying = bigint
--   LINE 1: where p.contract_ref = ?
--                      ^
--   HINT:  No operator matches the given name and argument type. You might need to add explicit type casts.
-- Sau khi vá: HTTP 200 trả về [] (không có giao dịch nào khớp) nhưng mỗi request vẫn tiêu ~12 giây CPU của RDS.`,
    },
    {
      name: 'schema-payment-transaction.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:48:20 +07, RDS vbank-payment-primary
vbank=# \\d+ payment_transaction
                                          Table "public.payment_transaction"
    Column    |           Type           | Collation | Nullable |      Default      | Storage  | Stats target |                  Description
--------------+--------------------------+-----------+----------+-------------------+----------+--------------+------------------------------------------------
 id           | uuid                     |           | not null |                   | plain    |              |
 contract_ref | character varying(32)    |           |          |                   | extended |              | ma hop dong tu core-banking (chi chua chu so)
 account_id   | uuid                     |           | not null |                   | plain    |              |
 channel      | character varying(16)    |           | not null |                   | extended |              |
 amount       | numeric(20,2)            |           | not null |                   | main     |              |
 currency     | character(3)             |           | not null | 'VND'::bpchar     | extended |              |
 status       | character varying(16)    |           | not null |                   | extended |              |
 created_at   | timestamp with time zone |           | not null | now()             | plain    |              |
Indexes:
    "idx_payment_transaction_account_created" btree (account_id, created_at DESC)
    "idx_payment_transaction_contract_ref" btree (contract_ref)
    "idx_payment_transaction_created_at" btree (created_at) WITH (fillfactor=90)
    "payment_transaction_pkey" PRIMARY KEY, btree (id)

vbank=# SELECT reltuples::bigint AS est_rows,
               pg_size_pretty(pg_total_relation_size('payment_transaction')) AS total_size,
               pg_size_pretty(pg_relation_size('payment_transaction')) AS heap_only
FROM pg_class WHERE relname = 'payment_transaction';
 est_rows | total_size | heap_only
----------+-----------+-----------
 42318904 | 9527 MB    | 4727 MB

vbank=# SELECT indexrelname, idx_scan, idx_tup_read
FROM pg_stat_user_indexes WHERE relname = 'payment_transaction';
         indexrelname         | idx_scan | idx_tup_read
-----------------------------+----------+-------------
 idx_payment_transaction_account_created |  184022 |   9845113
 idx_payment_transaction_contract_ref    |      41 |         41
 idx_payment_transaction_created_at       |   91884 |   1204551
 payment_transaction_pkey                 | 9120044 |   9120044`,
    },
  ],
  questions: [
    'Vì sao câu (1) trong artifact đầu tiên phải quét 42 triệu dòng dù bảng đã có index idx_payment_transaction_created_at? Chỉ ra bằng dòng nào trong plan.',
    'Câu tra cứu contract_ref đã gặp lỗi gì trước đây và vì sao cách "vá" bằng cast lại khiến plan tệ hơn so với lúc đầu?',
    'Bạn xử lý tình huống này thế nào trong ngày 14/03 (giảm thiểu ngay), và thiết kế lại thế nào để không tái diễn vào quý sau (index, partitioning, báo cáo, monitoring)?',
  ],
  hints: [
    'Đọc kỹ dòng "Filter:" của cả ba EXPLAIN: filter nào là hằng số thuần, filter nào bọc hàm hoặc ép kiểu quanh cột?',
    'So sánh "Execution Time" của câu (1) với câu (2): cùng bảng, cùng index, chỉ khác cách viết điều kiện — chênh lệch bao nhiêu lần?',
    'Nguyên tắc "sargable": index chỉ dùng được khi vế so sánh là cột trần với hằng số. Với cột timestamptz, date_trunc còn phụ thuộc TimeZone nên không IMMUTABLE, tức là không tạo được functional index theo cách thông thường.',
  ],
  answer: `**Tóm tắt:** Cả hai endpoint đều vi phạm nguyên tắc "sargable" — cột trong điều kiện bị bọc hàm ({{date_trunc('day', p.created_at)}}) hoặc bị ép kiểu ({{contract_ref::bigint}}) — nên PostgreSQL không dùng index mà quét tuần tự toàn bộ 42.318.904 dòng. Mỗi lần gọi báo cáo tốn ~38 giây CPU; hàng chục lần gọi song song (cộng retry khi timeout) đốt cạn 8 vCPU của RDS. Sửa ngay bằng khoảng thời gian nửa mở trên cột thô và bỏ cast trên cột; sửa lâu dài bằng partitioning theo tháng, bảng tổng hợp cho báo cáo và chuẩn hoá kiểu dữ liệu.

### Nguyên nhân gốc
1. **Câu báo cáo.** Điều kiện {{date_trunc('day', p.created_at) = ...}} bọc hàm quanh cột. Planner chỉ dùng được index khi vế phải là hằng số và vế trái là cột trần; bọc hàm là biểu thức, không tương đương với {{created_at}}, nên index không dùng được → Seq Scan toàn bảng.
2. **Câu tra cứu hợp đồng.** Cột {{contract_ref}} kiểu {{varchar(32)}} nhưng Java truyền tham số {{Long}}. Ban đầu PostgreSQL báo lỗi "operator does not exist: character varying = bigint"; dev "vá" bằng cách ép kiểu ở **vế cột**: {{p.contract_ref::bigint = 8845123}}. Cast đặt ở vế cột lại phá index (index được build trên giá trị varchar của {{contract_ref}}, không phải trên {{contract_ref::bigint}}), nên thành Seq Scan — trước đó câu lỗi ngay lập tức, nay "chạy được" nhưng quét cả bảng (12 giây) cho một phép tìm điểm. Thêm rủi ro: chỉ cần một dòng có ký tự không phải số, cast sẽ ném lỗi {{invalid input syntax for type bigint}} cho mọi lần tra cứu.
3. **Hệ số khuếch đại.** Endpoint báo cáo không có cache, không có rate-limit; client timeout 30 giây rồi retry trong khi câu cũ vẫn chạy tiếp trên DB, nên số câu chạy song song cứ tăng (12 câu cùng lúc như artifact ghi lại). Mỗi lần quét 42 triệu dòng dù kết quả chỉ 9.876 dòng. CPU 98% là hệ quả của việc quét lãng phí, không phải của tải thật.

### Dẫn chứng
- Artifact 1, câu (1): dòng **"Filter: (date_trunc('day'::text, created_at) = '2026-03-14 00:00:00+07'::timestamp with time zone)"** cho thấy điều kiện là biểu thức, không phải cột trần; dòng **"Seq Scan on payment_transaction p"** xác nhận index không được dùng; **"Rows Removed by Filter: 42309028"** nghĩa là 42.309.028 dòng bị đọc rồi loại bỏ (tổng 42.318.904 − 9.876 dòng khớp); **"Buffers: shared hit=598934 read=6178"** — đọc toàn bộ ~605 nghìn page của heap, gần như hết từ RAM (khớp với ReadIOPS không đổi, CPU 98%); **"Execution Time: 38745.208 ms"**. Ước lượng {{rows=211595}} so với thực tế 9.876 cũng là dấu hiệu planner không có thống kê cho biểu thức {{date_trunc(...)}} nên dùng selectivity mặc định 0,5%.
- Artifact 1, câu (2): cùng bảng, cùng câu hỏi, chỉ đổi điều kiện sang khoảng thời gian → **"Index Scan using idx_payment_transaction_created_at"**, **"Buffers: shared hit=171 read=12"**, **"Execution Time: 6.598 ms"**. Chênh lệch 38745/6,6 ≈ **5.900 lần** chỉ vì cách viết điều kiện. Index đã có sẵn và hoạt động tốt — vấn đề không phải "thiếu index".
- Artifact 2: **"Filter: ((contract_ref)::bigint = 8845123)"**, **"Rows Removed by Filter: 42318904"**, kết quả **rows=0** — 12,19 giây CPU để trả về một danh sách rỗng.
- Artifact 3: index {{idx_payment_transaction_created_at}} (btree trên {{created_at}}) và {{idx_payment_transaction_contract_ref}} (btree trên {{contract_ref}}) **đều tồn tại**; thống kê cho thấy {{idx_payment_transaction_created_at}} có idx_scan = 91.884 lần (các câu viết đúng) còn {{idx_payment_transaction_contract_ref}} chỉ 41 lần — dấu hiệu câu có cast đang quét bảng.

### Cách sửa ngắn hạn (trong ngày 14/03)
- Sửa query báo cáo sang khoảng thời gian nửa mở trên cột thô, luôn bind parameter, và **chốt múi giờ nghiệp vụ một lần** ở tầng ứng dụng rồi truyền xuống dạng timestamptz UTC.
- Sửa câu tra cứu hợp đồng: truyền tham số dạng String ({{String.valueOf(contractRef)}}) để so sánh thẳng với cột {{varchar}} — hoặc nếu buộc giữ Long thì ép kiểu ở **vế tham số**: {{WHERE p.contract_ref = CAST(:ref AS varchar)}}; index {{idx_payment_transaction_contract_ref}} được dùng lại ngay.
- Dừng bão hoà: tắt tạm endpoint báo cáo, đặt rate-limit, hoặc trả cache 5 phút; đặt {{statement_timeout}} cho role báo cáo (ví dụ 30 giây, bằng timeout của client) để câu bị bỏ rơi không chạy tiếp trên DB.
- Dọn query đang chạy: dùng {{pg_cancel_backend}} cho các pid đang quét bảng, không để chúng chạy tiếp tới hết 30 giây timeout.

### Cách sửa dài hạn
- **Chuẩn hoá kiểu dữ liệu:** đổi {{contract_ref}} sang {{bigint}} (chỉ chứa chữ số) và sửa code truyền Long. Với bảng 42 triệu dòng phải theo mô hình expand/contract: thêm cột mới, backfill theo lô, dual-write, đổi index rồi mới drop cột cũ — tuyệt đối không {{ALTER TABLE ... TYPE}} trực tiếp trên bảng lớn.
- **Partitioning theo tháng** theo {{created_at}}: báo cáo ngày chỉ quét đúng 1 partition, vacuum và index nhỏ hơn nhiều, có thể bỏ dữ liệu cũ bằng {{ALTER TABLE ... DETACH PARTITION}} rồi {{DROP TABLE}} partition đó thay vì {{DELETE}} hàng chục triệu dòng. (Chuyển bảng 42 triệu dòng sang partitioned table cần migration riêng: tạo bảng partitioned mới rồi chuyển dữ liệu theo lô.)
- **Báo cáo không đọc bảng giao dịch gốc:** dựng bảng tổng hợp theo ngày ({{daily_payment_summary}}, cập nhật bằng batch job/CDC) và để dashboard đọc bảng này; đây là thay đổi có ROI cao nhất.
- **Index phù hợp với bảng append-only:** cân nhắc BRIN trên {{created_at}} (chỉ vài trăm KB, hợp với dữ liệu ghi tuần tự theo thời gian, đủ tốt cho truy vấn theo khoảng ngày) thay vì btree cỡ gần 1 GB; nếu cần theo ngày theo múi giờ cố định thì expression index trên {{date_trunc('day', created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')}} là hợp lệ vì biểu thức này IMMUTABLE.

### Phòng ngừa và monitoring
- Bật {{pg_stat_statements}} và dashboard theo dõi {{total_exec_time}} theo queryid; cảnh báo khi một query có {{mean_exec_time}} > 1 giây hoặc {{calls}} tăng đột biến.
- Bật {{auto_explain}} với {{auto_explain.log_min_duration = 500}} (trên RDS: thêm vào {{shared_preload_libraries}} qua parameter group) để log lại plan của câu chậm; cảnh báo khi plan đổi từ "Index Scan" sang "Seq Scan" trên bảng lớn.
- Theo dõi chỉ số **rows examined / rows returned** (PostgreSQL: {{Rows Removed by Filter}}); đây là KPI phát hiện "query quét cả bảng nhưng trả về vài chục dòng".
- Theo dõi {{pg_stat_user_indexes.idx_scan = 0}} — index không được dùng là tín hiệu truy vấn đã đi lệch khỏi khuôn mẫu.
- Quy tắc review bắt buộc: trong {{WHERE}} không bọc hàm/cast lên cột; mọi query báo cáo phải kèm {{EXPLAIN (ANALYZE, BUFFERS)}} trong PR; thêm bài test hiệu năng với dữ liệu tỉ lệ production trong CI.

> Senior tip: dấu hiệu "query nhanh trên staging, chậm trên production" gần như luôn là **sai lệch tuyến tính theo số dòng**, tức plan đã đổi từ Index Scan sang Seq Scan. Ở đây staging có 3,2 triệu dòng nên quét mất 1,9 giây mà vẫn lọt; lên 42,3 triệu dòng thì cùng cách quét đó là ~25 giây, và thực tế là 38 giây khi có tải cao. Nếu đo bằng {{EXPLAIN}} trên dữ liệu thật (không dùng {{LIMIT 100}} để "giả" plan), sẽ thấy ngay chỗ xấu. Kinh nghiệm ăn vào: đừng bao giờ để một dashboard quét bảng giao dịch gốc — tách bảng tổng hợp ra ngay từ đầu, chi phí nhỏ hơn nhiều so với cứu hỏa dữ liệu.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: điều kiện WHERE bọc hàm/cast quanh cột làm mất khả năng dùng index (non-sargable), PostgreSQL chuyển sang Seq Scan toàn bảng',
    'Dẫn chứng đúng các dòng số liệu trong artifact: Seq Scan + date_trunc trong Filter + Rows Removed by Filter 42.309.028 + Execution Time 38745 ms, và so sánh với câu dùng khoảng thời gian (Index Scan, 6,6 ms)',
    'Giải thích đúng vì sao câu contract_ref bị mất index (cast đặt ở vế cột, index build trên contract_ref) và vì sao đây là hậu quả của câu lỗi operator does not exist',
    'Đề xuất sửa đúng: khoảng thời gian nửa mở trên cột thô, bỏ cast ở vế cột / chuẩn hoá kiểu dữ liệu contract_ref, migration expand-contract an toàn',
    'Có chiến lược dài hạn và monitoring cụ thể: partitioning theo tháng hoặc bảng tổng hợp cho báo cáo, BRIN/expression index, pg_stat_statements + auto_explain + alert theo rows examined',
  ],
  tags: ['postgresql', 'explain', 'index', 'sargable', 'seq-scan'],
},
{
  id: 'lab-sql-002',
  category: 'sql',
  title: 'Đơn hàng seller console chậm dù optimizer đã dùng index',
  level: 'mid',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử MiniShop chạy MySQL 8.0.36 trên RDS (8 vCPU / 32 GB RAM, storage gp3 1 TB, có 1 read-replica phục vụ báo cáo). Bảng {{orders}} lưu đơn hàng của toàn bộ seller trên sàn: **28.412.905 dòng** (~4,1 GB dữ liệu + 2,8 GB index, tốc độ ghi ~ 900 dòng/giây vào giờ cao điểm 12:00).

**Triệu chứng (14/03/2026, 12:00–13:30).** Màn hình "Đơn cần xử lý" trong seller console gọi {{GET /api/v2/seller/orders?shopId=42&status=PENDING,CONFIRMED&from=2026-03-13&to=2026-03-14}}. Trước 11:45 API trả trong **180 ms**; từ 12:00 p95 nhảy lên **1,9 giây**, p99 lên **4,1 giây** và bắt đầu trả 504. CPU của RDS chạm 90–97% trong khi QPS toàn hệ thống chỉ tăng 40%.

**Điều đã thử, không ăn.** Chuyển endpoint báo cáo sang read-replica, tăng {{innodb_buffer_pool_size}} lên 24 GB, tăng pool kết nối của service — p95 vẫn 1,8 giây. DBA nghi ngờ "thiếu index" nên đã tạo thêm index {{orders(shop_id)}} — p95 vẫn không giảm.

**Việc bạn có.** Ba artifact dưới đây lấy từ primary lúc 12:04–12:11 ngày 14/03. Hãy chỉ ra vì sao optimizer **đã chọn index** mà câu query vẫn chậm, và đề xuất index cùng câu query đúng.`,
  artifacts: [
    {
      name: 'explain-orders-fulfillment.txt',
      lang: 'text',
      content: `-- 2026-03-14 12:06:31 +07, primary shop-mysql (MySQL 8.0.36)
mysql> EXPLAIN SELECT order_id, customer_id, total_amount, status, created_at
    -> FROM orders
    -> WHERE shop_id = 42
    ->   AND status IN ('PENDING','CONFIRMED')
    ->   AND created_at >= '2026-03-13 00:00:00'
    ->   AND created_at <  '2026-03-14 00:00:00'
    -> ORDER BY created_at DESC
    -> LIMIT 200;
+----+-------------+--------+------------+-------+---------------------------------------+-----------------------+---------+------+--------+----------+----------------------------------+
| id | select_type | table  | partitions | type  | possible_keys                         | key                   | key_len | ref  | rows   | filtered | Extra                            |
+----+-------------+--------+------------+-------+---------------------------------------+-----------------------+---------+------+--------+----------+----------------------------------+
|  1 | SIMPLE      | orders | NULL       | range | idx_orders_created_at,idx_orders_shop | idx_orders_created_at | 5       | NULL | 312988 |     0.06 | Using where; Backward index scan |
+----+-------------+--------+------------+-------+---------------------------------------+-----------------------+---------+------+--------+----------+----------------------------------+
1 row in set, 1 warning (0.00 sec)

-- EXPLAIN ANALYZE (MySQL 8.0.18+), chạy lại lúc 12:06:44
mysql> EXPLAIN ANALYZE SELECT order_id, customer_id, total_amount, status, created_at
    -> FROM orders
    -> WHERE shop_id = 42
    ->   AND status IN ('PENDING','CONFIRMED')
    ->   AND created_at >= '2026-03-13 00:00:00'
    ->   AND created_at <  '2026-03-14 00:00:00'
    -> ORDER BY created_at DESC
    -> LIMIT 200;
-> Limit: 200 row(s)  (cost=140844 rows=188) (actual time=2.214..1184.220 rows=187 loops=1)
    -> Filter: ((orders.shop_id = 42) and (orders.status in ('PENDING','CONFIRMED')))  (cost=140844 rows=188) (actual time=2.212..1184.171 rows=187 loops=1)
        -> Index range scan on orders using idx_orders_created_at over ('2026-03-13 00:00:00' <= created_at < '2026-03-14 00:00:00') (reverse)  (cost=140844 rows=312988) (actual time=0.044..1131.402 rows=318204 loops=1)

1 row in set (1.19 sec)

-- Handler status của chính session đó (FLUSH STATUS trước khi chạy câu query):
mysql> SHOW SESSION STATUS WHERE Variable_name IN ('Handler_read_key','Handler_read_next','Handler_read_prev','Handler_read_rnd_next','Sort_rows','Sort_scan');
+-----------------------+--------+
| Variable_name         | Value  |
+-----------------------+--------+
| Handler_read_key      | 1      |
| Handler_read_next     | 0      |
| Handler_read_prev     | 318204 |
| Handler_read_rnd_next | 0      |
| Sort_rows             | 0      |
| Sort_scan             | 0      |
+-----------------------+--------+
6 rows in set (0.00 sec)`,
    },
    {
      name: 'show-index-orders.txt',
      lang: 'text',
      content: `-- 2026-03-14 12:08:02 +07, primary shop-mysql
mysql> SHOW INDEX FROM orders;
+-------+------------+-----------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| Table | Non_unique | Key_name                     | Seq_in_index | Column_name | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment |
+-------+------------+-----------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| orders |          0 | PRIMARY                     |            1 | order_id    | A         |     28412905 |     NULL | NULL   |      | BTREE      |         |               |
| orders |          1 | idx_orders_created_at       |            1 | created_at  | A         |      1204551 |     NULL | NULL   |      | BTREE      |         |               |
| orders |          1 | idx_orders_customer_created |            1 | customer_id | A         |       812344 |     NULL | NULL   |      | BTREE      |         |               |
| orders |          1 | idx_orders_customer_created |            2 | created_at  | A         |     27120488 |     NULL | NULL   |      | BTREE      |         |               |
| orders |          1 | idx_orders_shop             |            1 | shop_id     | A         |        42188 |     NULL | NULL   |      | BTREE      |         |               |
+-------+------------+-----------------------------+--------------+-------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
5 rows in set (0.00 sec)

mysql> SHOW COLUMNS FROM orders;
+-------------+------------------+------+-----+---------+----------------+
| Field       | Type             | Null | Key | Default | Extra          |
+-------------+------------------+------+-----+---------+----------------+
| order_id    | bigint           | NO   | PRI | NULL    | auto_increment |
| shop_id     | bigint           | NO   | MUL | NULL    |                |
| customer_id | bigint           | NO   | MUL | NULL    |                |
| status      | varchar(16)      | NO   |     | NULL    |                |
| total_amount | decimal(16,2)   | NO   |     | NULL    |                |
| created_at  | datetime         | NO   | MUL | NULL    |                |
| updated_at  | datetime         | NO   |     | NULL    |                |
+-------------+------------------+------+-----+---------+----------------+
7 rows in set (0.00 sec)

-- Danh sách index đầy đủ theo thứ tự cột, đọc từ information_schema:
mysql> SELECT INDEX_NAME, SEQ_IN_INDEX, COLUMN_NAME, NON_UNIQUE
    -> FROM information_schema.STATISTICS
    -> WHERE TABLE_SCHEMA = 'shop' AND TABLE_NAME = 'orders'
    -> ORDER BY INDEX_NAME, SEQ_IN_INDEX;
+-----------------------------+--------------+-------------+-------------+
| INDEX_NAME                  | SEQ_IN_INDEX | COLUMN_NAME | NON_UNIQUE |
+-----------------------------+--------------+-------------+-------------+
| PRIMARY                     |            1 | order_id    |           0 |
| idx_orders_created_at       |            1 | created_at  |           1 |
| idx_orders_customer_created |            1 | customer_id |           1 |
| idx_orders_customer_created |            2 | created_at  |           1 |
| idx_orders_shop             |            1 | shop_id     |           1 |
+-----------------------------+--------------+-------------+-------------+

-- Kích thước bảng (số liệu ước lượng, cập nhật bởi ANALYZE TABLE / thống kê tự động của InnoDB):
mysql> SELECT TABLE_ROWS, DATA_LENGTH/1024/1024 AS data_mb, INDEX_LENGTH/1024/1024 AS index_mb
    -> FROM information_schema.TABLES WHERE TABLE_SCHEMA='shop' AND TABLE_NAME='orders';
+------------+----------+------------+
| TABLE_ROWS | data_mb  | index_mb   |
+------------+----------+------------+
|   28412905 | 4182.00  |    2864.06 |
+------------+----------+------------+`,
    },
    {
      name: 'slow-query.log',
      lang: 'text',
      content: `/usr/sbin/mysqld, Version: 8.0.36-0ubuntu0.22.04.1 ((Ubuntu)). started with:
Tcp port: 3306  Unix socket: /var/run/mysqld/mysqld.sock
Time                 Id Command    Argument
# Time: 2026-03-13T03:12:44.918273Z
# User@Host: reporting[reporting] @ [10.0.12.7]  Id:    77
# Query_time: 6.812344  Lock_time: 0.000118  Rows_sent: 1  Rows_examined: 28412905
SET timestamp=1773371564;
SELECT count(*) FROM orders WHERE total_amount > 50000000;

# Time: 2026-03-14T05:06:12.552901Z
# User@Host: app[app] @ seller-console [10.0.9.14]  Id:    41
# Query_time: 1.196417  Lock_time: 0.000112  Rows_sent: 187  Rows_examined: 318204
SET timestamp=1773464772;
SELECT order_id, customer_id, total_amount, status, created_at
FROM orders
WHERE shop_id = 42
  AND status IN ('PENDING','CONFIRMED')
  AND created_at >= '2026-03-13 00:00:00'
  AND created_at <  '2026-03-14 00:00:00'
ORDER BY created_at DESC
LIMIT 200;

# Time: 2026-03-14T05:06:58.104882Z
# User@Host: app[app] @ seller-console [10.0.9.14]  Id:    44
# Query_time: 1.203881  Lock_time: 0.000098  Rows_sent: 187  Rows_examined: 318204
SET timestamp=1773464818;
SELECT order_id, customer_id, total_amount, status, created_at
FROM orders
WHERE shop_id = 42
  AND status IN ('PENDING','CONFIRMED')
  AND created_at >= '2026-03-13 00:00:00'
  AND created_at <  '2026-03-14 00:00:00'
ORDER BY created_at DESC
LIMIT 200;

# Time: 2026-03-14T05:07:41.663017Z
# User@Host: app[app] @ catalogue [10.0.9.22]  Id:    58
# Query_time: 0.041882  Lock_time: 0.000004  Rows_sent: 20  Rows_examined: 20
SET timestamp=1773464861;
SELECT order_id, status FROM orders WHERE customer_id = 4412093 ORDER BY created_at DESC LIMIT 20;`,
    },
  ],
  questions: [
    'EXPLAIN cho thấy optimizer đã dùng index idx_orders_created_at. Vì sao câu query vẫn quét 318.204 dòng? Dẫn chứng từ artifact.',
    'Vì sao index trên shop_id mà DBA vừa tạo không giúp? Quy tắc nào quyết định thứ tự các cột trong một composite index?',
    'Hãy đề xuất index và câu query cụ thể để hạ p95 xuống dưới 100 ms, kèm cách tạo index trên bảng 28 triệu dòng mà không chặn ghi.',
  ],
  hints: [
    'Nhìn cột "filtered" trong EXPLAIN (0.06) và so "Rows_examined: 318204" với "Rows_sent: 187" trong slow query log.',
    'Áp dụng quy tắc "equality trước, range/sort sau": index hiện tại chỉ có created_at nên shop_id và status chỉ được lọc sau khi đã đọc (kèm tra bảng) từng dòng trong cả khoảng thời gian.',
    'Với điều kiện shop_id = 42 AND status IN (...) AND created_at trong một khoảng, index (shop_id, status, created_at) cho phép "nhảy" thẳng tới vùng dữ liệu cần đọc.',
  ],
  answer: `**Tóm tắt:** Optimizer có dùng index, nhưng **index không chứa các cột lọc chọn lọc nhất**. Index {{idx_orders_created_at}} chỉ có cột {{created_at}} nên MySQL chỉ khoanh được khoảng thời gian của **toàn sàn** (318.204 đơn ngày 13/03), rồi với từng entry phải tra ngược bảng (lookup theo primary key) để lọc {{shop_id}}/{{status}}: 318.204 dòng bị đọc để trả về 187. Index đúng là {{(shop_id, status, created_at)}} — cột equality đứng trước, cột range/sort đứng sau — có thể kèm cột phủ để khỏi đọc bảng.

### Nguyên nhân gốc
MySQL chỉ khai thác được phần **leftmost prefix** của một index để khoanh vùng quét. Với index {{(created_at)}}:
- điều kiện trên {{created_at}} là **range** nên dùng được để khoanh vùng — nhưng vùng đó chứa đơn của mọi shop;
- {{shop_id}} và {{status}} không có trong index, nên với **mỗi** entry InnoDB phải đọc bản ghi đầy đủ trong clustered index (random lookup) rồi mới lọc "Using where";
- vì {{LIMIT 200}} mà shop 42 chỉ có 187 đơn khớp, MySQL không bao giờ gom đủ 200 dòng để dừng sớm → quét **trọn** khoảng thời gian (backward scan từ cuối ngày về đầu ngày).

Quy tắc thiết kế index: **cột lọc bằng equality đứng trước, cột range/sort đứng sau**. Index {{(shop_id, status, created_at)}} khiến MySQL đi thẳng tới đúng nhóm dòng của shop 42 với từng trạng thái, rồi khoanh vùng thời gian ngay trên index.

### Dẫn chứng
- Artifact 1, EXPLAIN: **"type = range"**, **"key = idx_orders_created_at"**, **"rows = 312988"** (ước tính số entry trong *khoảng thời gian*, chưa lọc shop/status), **"filtered = 0.06"** (chỉ ~0,06% số đó dự kiến khớp, tức ~188 dòng) và **"Backward index scan"** cho ORDER BY DESC. Không có "Using filesort" vì thứ tự đã lấy từ index.
- Artifact 1, EXPLAIN ANALYZE: **"Index range scan on orders using idx_orders_created_at ... (reverse) ... rows=318204"** rồi **"Filter: ((orders.shop_id = 42) and ...) ... rows=187"** — đọc 318.204 dòng, giữ 187; node Limit cũng chỉ ra **rows=187** dù LIMIT là 200. Đây là bằng chứng "đã dùng index nhưng vẫn quét rác".
- Artifact 1, handler status: **Handler_read_prev = 318204** (số entry đọc ngược trên index, mỗi entry kéo theo một lookup vào bảng), **Sort_rows = 0** — chi phí nằm ở việc đọc, không phải sort.
- Artifact 3, slow query log: **"Query_time: 1.196417 ... Rows_sent: 187 Rows_examined: 318204"** — tỉ lệ rows examined / rows sent ≈ 1.700 : 1, dấu hiệu quét thừa kinh điển. Hai bản ghi lúc 05:06:12Z và 05:06:58Z (tức 12:06 giờ Việt Nam) cho thấy đây là hành vi lặp chứ không phải sự cố đơn lẻ.
- Artifact 2, SHOW INDEX: {{idx_orders_created_at}} chỉ có **created_at**; {{idx_orders_shop}} chỉ có **shop_id**; không có index nào kết hợp **shop_id + status + created_at**. Index {{idx_orders_shop}} mới tạo không được chọn vì shop 42 là shop lớn: dùng nó phải đọc toàn bộ đơn lịch sử của shop rồi mới lọc thời gian — optimizer ước lượng còn đắt hơn.

### Cách sửa
Tạo index mới theo đúng thứ tự, và **không xoá** index cũ ({{(created_at)}} vẫn phục vụ các báo cáo chỉ lọc theo thời gian):

~~~sql
ALTER TABLE orders ADD INDEX idx_orders_shop_status_created (shop_id, status, created_at),
  ALGORITHM=INPLACE, LOCK=NONE;
~~~

Kỳ vọng plan mới: {{key = idx_orders_shop_status_created}}, {{rows}} chỉ vài trăm. Nếu muốn **covering index** để khỏi đọc bảng (Extra có "Using index"), thêm các cột SELECT vào cuối (order_id là primary key nên đã nằm sẵn trong mọi secondary index của InnoDB):

~~~sql
ALTER TABLE orders ADD INDEX idx_orders_shop_status_created_cov (shop_id, status, created_at, customer_id, total_amount),
  ALGORITHM=INPLACE, LOCK=NONE;
~~~

Vài điểm cần biết:
- {{status IN ('PENDING','CONFIRMED')}} tạo ra **2 range** trên index (mỗi trạng thái một đoạn {{created_at}}). Mỗi đoạn có thứ tự theo {{created_at}}, nhưng gộp hai đoạn thì không còn thứ tự chung → MySQL phải **filesort** các dòng khớp. Với vài trăm dòng thì filesort không đáng kể; nếu một shop có hàng chục nghìn đơn khớp, cân nhắc index {{(shop_id, created_at)}} + lọc status, hoặc tách thành 2 câu (mỗi status một câu {{ORDER BY created_at DESC LIMIT 200}}) rồi trộn ở ứng dụng.
- Với phân trang nên dùng **keyset pagination** ({{WHERE (created_at, order_id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, order_id DESC}}) thay vì {{OFFSET}}, vì OFFSET phải đọc rồi vứt các dòng bị skip.

### Tạo index trên 28 triệu dòng mà không chặn ghi
- MySQL 8.0 hỗ trợ online DDL cho ADD INDEX ({{ALGORITHM=INPLACE, LOCK=NONE}}): ghi vẫn chạy trong lúc build, chỉ cần metadata lock ngắn lúc bắt đầu và kết thúc (coi chừng transaction dài đang giữ metadata lock làm DDL phải chờ và chặn luôn các query đến sau). Thay đổi trong lúc build được ghi vào online alter log: đặt {{innodb_online_alter_log_max_size}} đủ lớn cho lượng ghi trong thời gian build, nếu tràn thì DDL bị rollback. Chạy ngoài giờ cao điểm vì I/O lớn, và read-replica sẽ bị lag khi replay DDL.
- An toàn hơn cho bảng rất nóng: **gh-ost** hoặc **pt-online-schema-change** (copy bảng có throttle theo replica lag rồi hoán đổi).
- Sau khi tạo: {{idx_orders_shop}} trở thành thừa (là prefix của index mới) — có thể xoá sau khi kiểm chứng; còn {{idx_orders_created_at}} vẫn cần cho báo cáo theo ngày.

### Phòng ngừa và monitoring
- Bật {{slow_query_log}} với {{long_query_time=0.5}} (và {{log_queries_not_using_indexes=ON}} nếu chịu được lượng log); cảnh báo khi **Rows_examined / Rows_sent > 100**.
- Dùng {{performance_schema.events_statements_summary_by_digest}} ({{SUM_ROWS_EXAMINED}}, {{SUM_ROWS_SENT}}) để theo dõi digest của seller console và so sánh trước/sau khi thêm index.
- Bắt buộc trong review: kèm {{EXPLAIN}} khi thêm query/index, kiểm tra {{rows}} và {{filtered}}, nhớ quy tắc **equality → range → sort**.
- Dùng **invisible index** (MySQL 8.0) để thử bỏ một index cũ: {{ALTER TABLE orders ALTER INDEX idx_orders_shop INVISIBLE;}} rồi xem digest có tăng {{Rows_examined}} không — an toàn hơn xoá thẳng trên bảng 28 triệu dòng, vì bật lại chỉ là thao tác metadata.

> Senior tip: khi EXPLAIN nói {{type = range}} mà câu vẫn chậm, hãy nhớ **"rows" là số dòng ước tính trước khi lọc**, còn **"filtered"** là phần trăm dự kiến sống sót sau các điều kiện còn lại. Ở đây rows = 312.988 và filtered = 0,06% là bức tranh điển hình của một index thiếu cột. Mẹo thực chiến: khi thiết kế composite index, viết câu query mẫu ra, đánh dấu cột equality ({{=}}, và {{IN}} với ít giá trị — dùng được làm prefix nhưng phá thứ tự sort), cột range ({{>}}, {{<}}, {{BETWEEN}}) và cột sort, rồi xếp index theo thứ tự equality → range/sort.`,
  rubric: [
    'Chỉ đúng nguyên nhân: index idx_orders_created_at chỉ có created_at nên chỉ khoanh được khoảng thời gian toàn sàn, shop_id/status phải lọc sau từng lần tra bảng; nêu quy tắc equality trước, range/sort sau',
    'Dẫn chứng đúng số liệu: rows 312988 / filtered 0.06 trong EXPLAIN, Index range scan rows=318204 và Filter rows=187 trong EXPLAIN ANALYZE, Handler_read_prev 318204, Rows_examined 318204 so với Rows_sent 187 trong slow log',
    'Đề xuất index (shop_id, status, created_at) kèm khả năng covering index, biết IN trên status khiến cần filesort nhỏ, và giải thích vì sao không xoá idx_orders_created_at',
    'Nói tới cách tạo index an toàn trên bảng 28 triệu dòng (online DDL INPLACE/LOCK=NONE, metadata lock, innodb_online_alter_log_max_size, ngoài giờ cao điểm, gh-ost/pt-osc) và keyset pagination thay OFFSET',
    'Có phương án monitoring/phòng ngừa cụ thể: slow query log, performance_schema digest, cảnh báo Rows_examined/Rows_sent, invisible index để kiểm chứng',
  ],
  tags: ['mysql', 'index', 'composite-index', 'explain', 'slow-query'],
},
{
  id: 'lab-sql-003',
  category: 'sql',
  title: 'Lịch sử giao dịch ví: 101 câu SQL cho một request',
  level: 'senior',
  scenario: `**Bối cảnh.** Ví điện tử PayVN vận hành service {{wallet-ledger}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, HikariCP 20 connection, {{spring.jpa.open-in-view=true}} mặc định). App mobile gọi GET /api/v1/wallets/{walletId}/statements?limit=50 để vẽ màn hình "Lịch sử giao dịch": mỗi giao dịch cần hiện tên người nhận và tên chi nhánh thanh toán.

**Triệu chứng (14/03/2026, 08:00–09:00).** p95 của endpoint nhảy từ 340 ms lên **2,4 giây**, 200 thread Tomcat cạn sạch, gateway trả 504 cho ~8% request. Điểm đáng chú ý: **không có câu SQL nào chậm** — câu nào cũng dưới 25 ms — trong khi CPU của RDS leo từ 25% lên 78%.

**Điều đã thử, không ăn.** Tăng pool Hikari từ 20 lên 60 connection (tệ hơn, vì thêm tranh chấp ở DB), bật query cache của Hibernate (2nd-level cache vốn không bật), tăng timeout gateway (chỉ che triệu chứng).

**Việc bạn có.** Ba artifact dưới đây: log SQL của Hibernate lúc 08:41, số liệu {{pg_stat_statements}} gom trong đúng giờ cao điểm (ops đã chạy {{pg_stat_statements_reset()}} lúc 08:00 để lấy sạch), và metrics của actuator. Hãy tìm nguyên nhân gốc và đề xuất cách sửa.`,
  artifacts: [
    {
      name: 'app-hibernate-sql.log',
      lang: 'text',
      content: `2026-03-14 08:41:10.118 INFO  [http-nio-8080-exec-28] c.v.w.WalletStatementService   : GET /api/v1/wallets/9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041/statements?limit=50
2026-03-14 08:41:10.121 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select t1_0.id,t1_0.amount,t1_0.beneficiary_id,t1_0.cash_office_id,t1_0.created_at,t1_0.currency,t1_0.direction,t1_0.status,t1_0.wallet_id from wallet_transaction t1_0 where t1_0.wallet_id=? order by t1_0.created_at desc limit ?
2026-03-14 08:41:10.134 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select b1_0.id,b1_0.bank_code,b1_0.full_name,b1_0.status from beneficiary b1_0 where b1_0.id=?
2026-03-14 08:41:10.141 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select c1_0.id,c1_0.branch_code,c1_0.branch_name,c1_0.district from cash_office c1_0 where c1_0.id=?
2026-03-14 08:41:10.152 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select b1_0.id,b1_0.bank_code,b1_0.full_name,b1_0.status from beneficiary b1_0 where b1_0.id=?
2026-03-14 08:41:10.158 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select c1_0.id,c1_0.branch_code,c1_0.branch_name,c1_0.district from cash_office c1_0 where c1_0.id=?
2026-03-14 08:41:10.166 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select b1_0.id,b1_0.bank_code,b1_0.full_name,b1_0.status from beneficiary b1_0 where b1_0.id=?
2026-03-14 08:41:10.171 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select c1_0.id,c1_0.branch_code,c1_0.branch_name,c1_0.district from cash_office c1_0 where c1_0.id=?
2026-03-14 08:41:10.180 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select b1_0.id,b1_0.bank_code,b1_0.full_name,b1_0.status from beneficiary b1_0 where b1_0.id=?
2026-03-14 08:41:10.186 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select c1_0.id,c1_0.branch_code,c1_0.branch_name,c1_0.district from cash_office c1_0 where c1_0.id=?
2026-03-14 08:41:10.194 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select b1_0.id,b1_0.bank_code,b1_0.full_name,b1_0.status from beneficiary b1_0 where b1_0.id=?
2026-03-14 08:41:10.199 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select c1_0.id,c1_0.branch_code,c1_0.branch_name,c1_0.district from cash_office c1_0 where c1_0.id=?
... (còn 44 vòng lặp nữa, đúng 50 giao dịch, mỗi vòng 2 câu: 1 câu beneficiary + 1 câu cash_office)
2026-03-14 08:41:11.904 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select b1_0.id,b1_0.bank_code,b1_0.full_name,b1_0.status from beneficiary b1_0 where b1_0.id=?
2026-03-14 08:41:11.909 DEBUG [http-nio-8080-exec-28] o.h.SQL   : select c1_0.id,c1_0.branch_code,c1_0.branch_name,c1_0.district from cash_office c1_0 where c1_0.id=?
2026-03-14 08:41:11.930 INFO  [http-nio-8080-exec-28] c.v.w.WalletStatementController : GET /api/v1/wallets/9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041/statements?limit=50 -> 200 in 1812 ms (101 statements)
2026-03-14 08:41:11.944 DEBUG [http-nio-8080-exec-19] o.h.SQL   : select u1_0.id,u1_0.email,u1_0.full_name,u1_0.phone,u1_0.tier from app_user u1_0 where u1_0.id=?
2026-03-14 08:41:12.002 DEBUG [http-nio-8080-exec-31] o.h.SQL   : select l1_0.id,l1_0.limit_amount,l1_0.used_amount,l1_0.window_code from credit_limit l1_0 where l1_0.wallet_id=?
2026-03-14 08:41:12.077 DEBUG [http-nio-8080-exec-24] o.h.SQL   : select count(l1_0.id) from wallet_transaction l1_0 where l1_0.wallet_id=? and l1_0.created_at>=?
2026-03-14 08:41:12.101 INFO  [http-nio-8080-exec-7]  c.v.w.WalletController         : GET /api/v1/wallets/1d07b6e2-3c55-4f1e-8a90-2b4d6c8e0f13/balance -> 200 in 14 ms`,
    },
    {
      name: 'pg-stat-statements.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:03 +07, RDS wallet-ledger-primary (PostgreSQL 15.6)
-- pg_stat_statements_reset() đã chạy lúc 08:00:00 để lấy sạch giờ cao điểm
wallet=# SELECT queryid, calls,
       round(total_exec_time::numeric, 1)  AS total_ms,
       round(mean_exec_time::numeric, 3)   AS mean_ms,
       rows,
       shared_blks_hit, shared_blks_read
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY total_exec_time DESC
LIMIT 6;
       queryid       |  calls  | total_ms  | mean_ms |   rows   | shared_blks_hit | shared_blks_read
--------------------+---------+-----------+---------+----------+-----------------+----------------
 -520384771924401 | 6870600 | 2281153.2 |   0.332 |  6870600 |        27482400 |                0
  882744019335117 | 6870600 | 2255957.4 |   0.328 |  6870600 |        13741200 |                0
 -774411992038521 |  137412 | 2964901.2 |  21.578 |  6870600 |        31742172 |          218904
  112938475510392 |   41236 |  884112.6 |  21.442 |   41236 |           82472 |             2210
 -228471009334118 |   41236 |  418220.9 |  10.144 |  412360 |          82472 |                0
  771200984421883 |      12 |  182441.7 | 15203.5 |      12 |          14208 |          41022

-- Ba digest đầu là câu hỏi của endpoint trong câu chuyện (ba digest còn lại đến từ service khác dùng chung DB):
--  -520384771924401: select b1_0.id,b1_0.bank_code,b1_0.full_name,b1_0.status from beneficiary b1_0 where b1_0.id=$1
--   882744019335117: select c1_0.id,c1_0.branch_code,c1_0.branch_name,c1_0.district from cash_office c1_0 where c1_0.id=$1
--  -774411992038521: select t1_0.id,t1_0.amount,... from wallet_transaction t1_0 where t1_0.wallet_id=$1 order by t1_0.created_at desc limit $2
wallet=# SELECT calls, round(total_exec_time::numeric, 1) AS total_ms FROM pg_stat_statements WHERE query LIKE '%pg_stat_statements_reset%';
 calls | total_ms
-------+----------
     1 |    14.2`,
    },
    {
      name: 'actuator-metrics.json',
      lang: 'text',
      content: `-- 2026-03-14 09:05 +07, curl http://wallet-ledger.internal:8080/actuator/metrics
-- Cùng cửa sổ đo với pg_stat_statements: 08:00-09:00 ngày 14/03 (counter lũy kế đã trừ mốc 08:00, cộng mọi pod; app bật hibernate.generate_statistics=true)
{
  "name": "hibernate.statements",
  "description": "The number of statements prepared",
  "baseUnit": null,
  "measurements": [
    { "statistic": "COUNT", "value": 13878612 }
  ],
  "availableTags": [ { "tag": "status", "values": [ "prepared", "closed" ] } ]
}

{
  "name": "hibernate.query.executions",
  "description": "The number of executed queries",
  "baseUnit": null,
  "measurements": [
    { "statistic": "COUNT", "value": 137412 }
  ],
  "availableTags": []
}

{
  "name": "hibernate.entities.loads",
  "description": "The number of entity loads",
  "baseUnit": null,
  "measurements": [
    { "statistic": "COUNT", "value": 20611800 }
  ],
  "availableTags": []
}

{
  "name": "http.server.requests",
  "description": null,
  "baseUnit": "seconds",
  "measurements": [
    { "statistic": "COUNT", "value": 137412 },
    { "statistic": "TOTAL_TIME", "value": 168094.6 },
    { "statistic": "MAX", "value": 4.812 }
  ],
  "availableTags": [ { "tag": "status", "values": [ "200", "503" ] } ]
  -- (lọc bằng ?tag=uri:/api/v1/wallets/{walletId}/statements)
}`,
    },
  ],
  questions: [
    'Chuyện gì đang xảy ra với các câu SQL trong log Hibernate? Chứng minh bằng dòng nào và bằng tỉ lệ số liệu trong artifact 2 và 3.',
    'Vì sao tăng connection pool và bật query cache không cứu được hệ thống?',
    'Bạn sẽ sửa ở tầng code theo những cách nào (kể cả cách ít tốn công nhất), và bạn sẽ thêm chỉ số/guardrail gì để lần sau tự phát hiện N+1?',
  ],
  hints: [
    'Đếm số câu SQL nằm trên cùng một thread http-nio-8080-exec-28 và so với số câu của các thread khác.',
    'Tính tỉ lệ: 13.878.612 statement / 137.412 query execution = 101 câu SQL cho mỗi câu truy vấn JPQL; và 6.870.600 / 137.412 = 50 lần cho mỗi digest.',
    'Đây là N+1 do lazy loading: Hibernate nạp 50 giao dịch trong 1 câu, rồi với mỗi giao dịch lại nạp beneficiary và cash_office. Giải pháp: fetch join, @EntityGraph, @BatchSize hoặc DTO projection.',
  ],
  answer: `**Tóm tắt:** Đây là lỗi **N+1 query** do lazy loading: Hibernate lấy 50 giao dịch bằng **một** câu, rồi với từng giao dịch lại nạp thêm **2 câu** (beneficiary + cash_office) → **101 câu SQL cho một request**. Không câu nào chậm, nhưng 137.412 request/giờ biến thành 13,8 triệu câu SQL/giờ; thêm nữa OSIV giữ session mở nên connection bị giữ suốt request: theo định luật Little, ~38 request/giây × ~1,8 giây ≈ 69 request cùng cần connection trong khi pool chỉ có 20 → request xếp hàng chờ connection, thread Tomcat bị giữ và cạn theo.

### Nguyên nhân gốc
Entity {{WalletTransaction}} có hai quan hệ {{@ManyToOne(fetch = FetchType.LAZY)}} tới {{Beneficiary}} và {{CashOffice}} (mặc định của @ManyToOne là EAGER; team đã đặt LAZY đúng best practice nhưng sau đó không fetch có chủ đích). View trả về JSON có tên người nhận và tên chi nhánh nên quyền truy cập các thuộc tính đó kích hoạt lazy loading **bên trong vòng lặp render** — mỗi phần tử của {{List<WalletTransaction>}} là một phép truy vấn mới.

Vòng lặp: **1 câu lấy danh sách + 50 × (1 câu beneficiary + 1 câu cash_office) = 101 câu**. Đây là mẫu kinh điển của N+1: số câu **tăng tuyến tính theo số dòng trả về**, mỗi câu lại **rất nhanh** nên không ai thấy trong slow query log.

### Dẫn chứng
- Artifact 1: trên **cùng một thread {{http-nio-8080-exec-28}}**, sau câu {{select ... from wallet_transaction ...}} có các cặp câu {{select b1_0... from beneficiary b1_0 where b1_0.id=?}} và {{select c1_0... from cash_office c1_0 where c1_0.id=?}} lặp lại liên tiếp. Các câu của {{exec-19}}, {{exec-31}}, {{exec-24}}, {{exec-7}} xen kẽ là **nhiễu từ request khác** — phải lọc theo thread mới thấy vòng lặp. Dòng cuối của request: **"-> 200 in 1812 ms (101 statements)"**.
- Artifact 2: digest {{beneficiary}} có **calls = 6.870.600**, digest {{cash_office}} **calls = 6.870.600**, còn {{wallet_transaction}} chỉ **calls = 137.412**. Tỉ lệ đúng **50 : 50 : 1** — bằng chứng định lượng của N+1.
- Artifact 2: {{mean_exec_time}} của hai digest N+1 chỉ **0,332 ms** và **0,328 ms** (tra cứu PK), còn câu lấy danh sách là **21,578 ms**. Không câu nào chậm → vấn đề **không phải query chậm mà là quá nhiều query**.
- Artifact 3: **hibernate.statements COUNT = 13.878.612** trong khi **hibernate.query.executions COUNT = 137.412** → **101 câu SQL cho mỗi câu JPQL**; **hibernate.entities.loads = 20.611.800** ≈ 150 entity cho mỗi request.
- Tổng thời gian thực thi của 3 digest trong 1 giờ: 2.281.153 + 2.255.957 + 2.964.901 = 7.502.011 ms, tức khoảng **7.502 giây CPU DB** chỉ để phục vụ một endpoint. Lưu ý {{mean_exec_time}} **không tính** thời gian parse/plan — mỗi câu còn mất thêm ~0,1–0,2 ms CPU ở tầng DB, nên CPU thật còn cao hơn con số này.

### Vì sao các cách sửa "chữa triệu chứng" không ăn
- **Tăng pool Hikari lên 60:** giữ thêm nhiều connection hơn trong khi mỗi request vẫn gửi 101 câu → tổng lưu lượng câu lệnh không đổi, DB nóng hơn; với {{open-in-view=true}}, connection còn bị giữ suốt vòng đời request nên chỉ tăng áp lực.
- **Bật query cache Hibernate:** query cache chỉ lưu kết quả (danh sách id) của câu HQL/JPQL có cùng câu lệnh + tham số; 100 câu lazy-load theo khóa chính **không đi qua query cache** mà qua entity cache (second-level cache), vốn không bật. Hơn nữa query cache trả về id rồi vẫn phải load từng entity — không có L2 entity cache thì còn tệ hơn.
- **Tăng timeout gateway:** chỉ đẩy hậu quả (504) ra phía trước, DB vẫn bị ngốn.

### Cách sửa ở tầng code
1. **Fetch join trong JPQL** (bắt buộc đặt quan hệ cần dùng trong {{JOIN FETCH}}):
~~~java
@Query("select t from WalletTransaction t " +
       "left join fetch t.beneficiary b " +     // left: không làm mất giao dịch thiếu quan hệ
       "left join fetch t.cashOffice c " +      // cash_office_id có thể null
       "where t.wallet.id = :walletId " +
       "order by t.createdAt desc")
List<WalletTransaction> findStatement(UUID walletId, Pageable pageable);
~~~
→ 1 câu SQL. Dùng **left** join fetch: inner join sẽ âm thầm làm mất các giao dịch có {{cash_office_id}} null. Kèm index {{(wallet_id, created_at desc)}} để câu lấy danh sách không phải sort (mean 21,6 ms và ~230 buffer mỗi lần cho 50 dòng ở artifact 2 gợi ý index này đang thiếu).
2. **{{@EntityGraph}}** nếu muốn giữ {{findBy}}:
~~~java
@EntityGraph(attributePaths = { "beneficiary", "cashOffice" })
List<WalletTransaction> findByWalletId(UUID walletId, Pageable pageable);
~~~
3. **DTO projection** — chỉ lấy đúng cột cần, không hydrate entity, giảm băng thông và bộ nhớ:
~~~java
@Query("select new com.payvn.wallet.api.StatementRow(t.id, t.amount, t.createdAt, b.fullName, c.branchName) " +
       "from WalletTransaction t left join t.beneficiary b left join t.cashOffice c " +
       "where t.wallet.id = :walletId order by t.createdAt desc")
List<StatementRow> findStatementRows(UUID walletId, Pageable pageable);
~~~
4. **Batch fetching** khi không muốn đụng câu query: đặt {{hibernate.default_batch_fetch_size=50}} (toàn cục), hoặc {{@BatchSize(size = 50)}} trên **class** {{Beneficiary}} và {{CashOffice}} (với quan hệ to-one, @BatchSize đặt ở entity đích chứ không đặt trên field @ManyToOne) → Hibernate gom các proxy chưa load thành {{where id in (...)}}: 3 câu thay vì 101. Đây là cách ít tốn công nhất nhưng vẫn 3 round-trip. ({{@Fetch(FetchMode.SUBSELECT)}} chỉ áp dụng cho collection, không dùng được cho @ManyToOne.)
5. **Second-level cache** (Caffeine/Ehcache) cho {{Beneficiary}}, {{CashOffice}} — dữ liệu danh mục, đọc nhiều ghi ít; nhớ cấu hình invalidation.
6. **Tắt OSIV**: {{spring.jpa.open-in-view=false}}, mọi truy vấn chạy trong {{@Transactional(readOnly = true)}} → connection trả về pool sớm, không còn hiện tượng "lazy load ngoài transaction" và tránh giữ connection suốt request.
7. **Phân trang keyset** thay {{OFFSET}} cho các trang sâu.

### Cảnh báo bẫy
- {{JOIN FETCH}} **kết hợp với phân trang** chỉ an toàn khi quan hệ là {{@ManyToOne}}/{{@OneToOne}}. Nếu là {{@OneToMany}}/{{@ManyToMany}}, Hibernate cảnh báo và phân trang **in-memory** (Hibernate 5: HHH000104; Hibernate 6: HHH90003004 — đọc hết kết quả rồi mới cắt trong bộ nhớ) — khi đó dùng batch fetch, {{@Fetch(SUBSELECT)}} hoặc tách 2 câu query (câu 1 lấy id theo trang, câu 2 fetch theo danh sách id).
- Fetch quan hệ to-one không nhân số dòng (mỗi giao dịch vẫn là một dòng). Chỉ khi fetch **collection** thì số dòng SQL mới bị nhân lên; Hibernate 6 tự loại trùng entity gốc (không cần {{DISTINCT}} như Hibernate 5), nhưng lượng dữ liệu truyền về vẫn tăng.

### Phòng ngừa và monitoring
- Bật {{hibernate.generate_statistics=true}} + actuator metrics; **cảnh báo khi tỉ lệ hibernate.statements / hibernate.query.executions > 5** (ngưỡng này bắt được N+1 trước khi nó lên production).
- Bật {{logging.level.org.hibernate.SQL=DEBUG}} **chỉ ở staging/profile debug**, kèm {{generate_statistics}} để đếm.
- Dùng proxy đo số statement/request ({{datasource-proxy}}, {{p6spy}}) trong test và staging.
- Test hồi quy với {{@DataJpaTest}} + {{Statistics}}: assert số statement của một truy vấn không vượt quá hằng số, để N+1 bị chặn ở CI.
- Quy tắc review: mọi DTO trả về có quan hệ phải khai báo rõ fetch plan; không dùng {{@OneToMany}} mặc định {{LAZY}} rồi gọi {{getXxx()}} trong vòng lặp.

> Senior tip: khi điều tra hiệu năng, hãy nhớ hai trục: **"câu nào chậm"** và **"bao nhiêu câu"**. Ở đây không có câu nào chậm, nên nhìn {{pg_stat_statements}} theo {{calls}} sẽ ra ngay thủ phạm. Tỉ lệ hibernate.statements / hibernate.query.executions = 101 là thước đo đơn giản nhất và hiệu quả nhất để phát hiện N+1 trong CI — từ 1 câu lên 101 câu là dấu hiệu chuẩn, không cần đọc code. Kinh nghiệm xương máu: đừng tối ưu câu query trước khi đếm số câu; 90% sự cố hiệu năng ở tầng ORM là do **số lượng** round-trip chứ không phải độ trễ của từng câu.`,
  rubric: [
    'Nhận diện đúng lỗi N+1: 1 câu lấy danh sách 50 giao dịch + 50 lần lazy-load beneficiary + 50 lần lazy-load cash_office = 101 câu SQL mỗi request',
    'Dẫn chứng đúng bằng số liệu: tỉ lệ calls 6.870.600 : 6.870.600 : 137.412 (50:50:1) trong pg_stat_statements và hibernate.statements 13.878.612 / hibernate.query.executions 137.412 = 101',
    'Chỉ ra thêm yếu tố khuếch đại: open-in-view giữ session/connection, tác dụng thật của mean_exec_time không tính parse/plan, và vì sao tăng pool/bật query cache không giải quyết được',
    'Đề xuất fix đúng ở tầng code: join fetch / @EntityGraph / DTO projection (và nêu @BatchSize, @Fetch SUBSELECT, second-level cache như phương án bổ sung), tắt open-in-view, phân trang keyset',
    'Có guardrail cụ thể: cảnh báo tỉ lệ hibernate.statements/hibernate.query.executions, assert số statement trong test hồi quy, quy tắc review fetch plan, và nêu rủi ro HHH000104 khi join fetch kết hợp phân trang collection',
  ],
  tags: ['hibernate', 'n-plus-one', 'jpa', 'postgresql', 'pg-stat-statements'],
},
{
  id: 'lab-sql-004',
  category: 'sql',
  title: 'Deadlock khi giải phóng escrow hai đơn mua chéo',
  level: 'lead',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử MiniShop có tính năng "Đặt mua hàng của người khác" (mua chéo): người mua A đặt mua hàng của người bán B thì tiền của A bị **giữ escrow** trong ví A, khi đơn được xác nhận thì tiền chuyển từ ví A sang ví B. Service {{wallet-transfer}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6) xử lý việc giải phóng escrow trong một transaction duy nhất, cập nhật bảng {{wallet_ledger.wallet_balance}} (một dòng cho mỗi ví) rồi ghi {{escrow_order}}.

**Triệu chứng (14/03/2026, 10:22).** Đúng giờ cao điểm 10:22, hai đơn mua chéo được xác nhận gần như cùng lúc:
- Đơn {{ORD-2026-03-14-88213}}: A (ví {{9f3c1a44-…}}) mua hàng của B (ví {{b7f3c9e2-…}}) → trừ ví A, cộng ví B.
- Đơn {{ORD-2026-03-14-88214}}: B (ví {{b7f3c9e2-…}}) mua hàng của A (ví {{9f3c1a44-…}}) → trừ ví B, cộng ví A.

Một trong hai transaction bị PostgreSQL **abort vì deadlock**, đơn hàng kẹt ở trạng thái {{ESCROW_PENDING}}. Từ khi ra mắt tính năng mua chéo (6 tuần) đã tích luỹ **312 đơn** kẹt như vậy, mỗi đơn phải nhân viên vận hành xử lý tay. Đáng chú ý: tỉ lệ deadlock rất thấp (~50 lần/tuần trên hơn 1 triệu lệnh giải phóng escrow) nên không ai coi là sự cố hệ thống — nhưng mỗi lần đều là lỗi tiền thật.

**Việc bạn có.** Ba artifact: log server PostgreSQL lúc 10:22, ảnh chụp {{pg_locks}} lúc 10:22:29.200 (trước khi deadlock detector chạy), và log ứng dụng. Hãy dựng lại chu trình chờ, chỉ ra nguyên nhân gốc ở tầng thiết kế, và đề xuất cách sửa vừa ngắn hạn (hết kẹt đơn) vừa dài hạn (không còn deadlock lẫn retry sai).`,
  artifacts: [
    {
      name: 'postgres-deadlock.log',
      lang: 'text',
      content: `# log server PostgreSQL 15.6 (RDS wallet-ledger-primary), log_line_prefix = '%m [%p] ', timezone = Asia/Ho_Chi_Minh
# log_min_duration_statement = 0 (bật tạm trong giờ cao điểm), log_lock_waits = on, deadlock_timeout = 1s
# xid: TX1 (pid 24117, đơn 88213) = 918244731, TX2 (pid 24118, đơn 88214) = 918244735
2026-03-14 10:22:00.115 +07 [412] LOG:  checkpoint starting: time
2026-03-14 10:22:17.884 +07 [412] LOG:  checkpoint complete: wrote 418 buffers (2.6%); 0 WAL file(s) added, 0 removed, 3 recycled; write=17.612 s, sync=0.041 s, total=17.769 s
2026-03-14 10:22:19.402 +07 [24105] LOG:  automatic vacuum of table "wallet.wallet_ledger.escrow_order": index scans: 1
2026-03-14 10:22:28.417 +07 [24117] LOG:  duration: 0.031 ms  execute S_1: BEGIN
2026-03-14 10:22:28.423 +07 [24118] LOG:  duration: 0.029 ms  execute S_1: BEGIN
2026-03-14 10:22:28.470 +07 [24117] LOG:  duration: 0.912 ms  execute <unnamed>: UPDATE wallet_balance SET balance = balance - $1, updated_at = now() WHERE wallet_id = $2 AND currency = 'VND'
2026-03-14 10:22:28.470 +07 [24117] DETAIL:  parameters: $1 = '150000.00', $2 = '9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041'
2026-03-14 10:22:28.481 +07 [24118] LOG:  duration: 0.877 ms  execute <unnamed>: UPDATE wallet_balance SET balance = balance - $1, updated_at = now() WHERE wallet_id = $2 AND currency = 'VND'
2026-03-14 10:22:28.481 +07 [24118] DETAIL:  parameters: $1 = '150000.00', $2 = 'b7f3c9e2-5d41-4a08-9c6b-1e2f3a4b5c6d'
2026-03-14 10:22:29.489 +07 [24117] LOG:  process 24117 detected deadlock while waiting for ShareLock on transaction 918244735 after 1000.884 ms
2026-03-14 10:22:29.489 +07 [24117] DETAIL:  Process holding the lock: 24118. Wait queue: .
2026-03-14 10:22:29.489 +07 [24117] CONTEXT:  while updating tuple (41233,7) in relation "wallet_balance"
2026-03-14 10:22:29.489 +07 [24117] STATEMENT:  UPDATE wallet_balance SET balance = balance + $1, updated_at = now() WHERE wallet_id = $2 AND currency = 'VND'
2026-03-14 10:22:29.489 +07 [24117] ERROR:  deadlock detected
2026-03-14 10:22:29.489 +07 [24117] DETAIL:  Process 24117 waits for ShareLock on transaction 918244735; blocked by process 24118.
        Process 24118 waits for ShareLock on transaction 918244731; blocked by process 24117.
        Process 24117: UPDATE wallet_balance SET balance = balance + $1, updated_at = now() WHERE wallet_id = $2 AND currency = 'VND'
        Process 24118: UPDATE wallet_balance SET balance = balance + $1, updated_at = now() WHERE wallet_id = $2 AND currency = 'VND'
2026-03-14 10:22:29.489 +07 [24117] HINT:  See server log for query details.
2026-03-14 10:22:29.489 +07 [24117] CONTEXT:  while updating tuple (41233,7) in relation "wallet_balance"
2026-03-14 10:22:29.489 +07 [24117] STATEMENT:  UPDATE wallet_balance SET balance = balance + $1, updated_at = now() WHERE wallet_id = $2 AND currency = 'VND'
2026-03-14 10:22:29.490 +07 [24117] LOG:  duration: 0.044 ms  execute S_2: ROLLBACK
2026-03-14 10:22:29.491 +07 [24118] LOG:  duration: 997.214 ms  execute <unnamed>: UPDATE wallet_balance SET balance = balance + $1, updated_at = now() WHERE wallet_id = $2 AND currency = 'VND'
2026-03-14 10:22:29.491 +07 [24118] DETAIL:  parameters: $1 = '150000.00', $2 = '9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041'
2026-03-14 10:22:29.494 +07 [24118] LOG:  duration: 0.702 ms  execute <unnamed>: UPDATE escrow_order SET status = $1, released_at = now() WHERE order_id = $2
2026-03-14 10:22:29.494 +07 [24118] DETAIL:  parameters: $1 = 'RELEASED', $2 = 'ORD-2026-03-14-88214'
2026-03-14 10:22:29.497 +07 [24118] LOG:  duration: 1.902 ms  execute S_3: COMMIT`,
    },
    {
      name: 'pg-locks-snapshot.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:22:29.200 +07, chụp từ RDS wallet-ledger-primary (289 ms trước khi detector báo deadlock lúc 10:22:29.489)
wallet=# \\d wallet_ledger.wallet_balance
                   Table "wallet_ledger.wallet_balance"
   Column   |           Type           | Collation | Nullable |    Default
------------+--------------------------+-----------+----------+---------------
 wallet_id  | uuid                     |           | not null |
 currency   | character(3)             |           | not null | 'VND'::bpchar
 balance    | numeric(20,2)            |           | not null | 0.00
 updated_at | timestamp with time zone |           | not null | now()
Indexes:
    "wallet_balance_pkey" PRIMARY KEY, btree (wallet_id, currency)

wallet=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       left(query, 72) AS query
FROM pg_stat_activity
WHERE pid IN (24117, 24118);
  pid  | state  | wait_event_type |  wait_event   |    xact_age     |                                  query
-------+--------+-----------------+---------------+-----------------+--------------------------------------------------------------------------
 24117 | active | Lock            | transactionid | 00:00:00.783    | UPDATE wallet_balance SET balance = balance + $1, updated_at = now() WHE
 24118 | active | Lock            | transactionid | 00:00:00.777    | UPDATE wallet_balance SET balance = balance + $1, updated_at = now() WHE

wallet=# SELECT l.pid, l.locktype, l.relation::regclass AS relation, l.mode, l.granted,
       l.transactionid::text AS xid, l.page, l.tuple
FROM pg_locks l
WHERE l.pid IN (24117, 24118)
ORDER BY l.pid, l.granted, l.locktype;
  pid  |   locktype    |      relation       |       mode       | granted |    xid    | page  | tuple
-------+---------------+---------------------+------------------+---------+-----------+-------+-------
 24117 | transactionid |                     | ShareLock        | f       | 918244735 |       |
 24117 | relation      | wallet_balance_pkey | RowExclusiveLock | t       |           |       |
 24117 | relation      | wallet_balance      | RowExclusiveLock | t       |           |       |
 24117 | transactionid |                     | ExclusiveLock    | t       | 918244731 |       |
 24117 | tuple         | wallet_balance      | ExclusiveLock    | t       |           | 41233 |     7
 24117 | virtualxid    |                     | ExclusiveLock    | t       |           |       |
 24118 | transactionid |                     | ShareLock        | f       | 918244731 |       |
 24118 | relation      | wallet_balance_pkey | RowExclusiveLock | t       |           |       |
 24118 | relation      | wallet_balance      | RowExclusiveLock | t       |           |       |
 24118 | transactionid |                     | ExclusiveLock    | t       | 918244735 |       |
 24118 | tuple         | wallet_balance      | ExclusiveLock    | t       |           |  8821 |    44
 24118 | virtualxid    |                     | ExclusiveLock    | t       |           |       |

-- Đọc chú thích: row lock thật nằm trong header của tuple (xmax), KHÔNG hiện trong pg_locks.
-- Phiên đang chờ một dòng sẽ giữ "tuple" lock (ExclusiveLock, granted = t) để xếp hàng,
-- rồi chờ ShareLock trên transactionid của phiên đang giữ dòng đó (granted = f).
-- Tuple 41233/7 là dòng ví người bán b7f3c9e2 (TX2 đã UPDATE, TX1 đang chờ),
-- tuple 8821/44 là dòng ví người mua 9f3c1a44 (TX1 đã UPDATE, TX2 đang chờ).

wallet=# SELECT pg_blocking_pids(24117) AS blocks_24117, pg_blocking_pids(24118) AS blocks_24118;
 blocks_24117 | blocks_24118
--------------+--------------
 {24118}      | {24117}

-- Ghi chú của DBA: hai phiên đều chờ "transactionid" của nhau (918244735 và 918244731),
-- tức mỗi bên chờ transaction kia commit/rollback. Đây là vòng chờ (wait-for cycle)
-- chứ không phải tranh chấp một chiều.`,
    },
    {
      name: 'app-transfer-error.log',
      lang: 'text',
      content: `2026-03-14 10:22:28.402 INFO  [http-nio-8080-exec-14] c.v.m.escrow.EscrowService       : releaseEscrow start orderId=ORD-2026-03-14-88213 amount=150000.00 buyer=9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041 seller=b7f3c9e2-5d41-4a08-9c6b-1e2f3a4b5c6d
2026-03-14 10:22:28.405 INFO  [http-nio-8080-exec-25] c.v.m.escrow.EscrowService       : releaseEscrow start orderId=ORD-2026-03-14-88214 amount=150000.00 buyer=b7f3c9e2-5d41-4a08-9c6b-1e2f3a4b5c6d seller=9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041
2026-03-14 10:22:29.492 ERROR [http-nio-8080-exec-14] c.v.m.escrow.EscrowService       : releaseEscrow failed orderId=ORD-2026-03-14-88213
org.springframework.dao.CannotAcquireLockException: could not execute statement [ERROR: deadlock detected
  Detail: Process 24117 waits for ShareLock on transaction 918244735; blocked by process 24118.
Process 24118 waits for ShareLock on transaction 918244731; blocked by process 24117.
  Hint: See server log for query details.
  Where: while updating tuple (41233,7) in relation "wallet_balance"] [UPDATE wallet_balance SET balance = balance + ?, updated_at = now() WHERE wallet_id = ? AND currency = 'VND']; SQL [UPDATE wallet_balance SET balance = balance + ?, updated_at = now() WHERE wallet_id = ? AND currency = 'VND']
	at org.springframework.orm.jpa.vendor.HibernateJpaDialect.convertHibernateAccessException(HibernateJpaDialect.java:271)
	at org.springframework.orm.jpa.vendor.HibernateJpaDialect.translateExceptionIfPossible(HibernateJpaDialect.java:241)
	at org.springframework.orm.jpa.AbstractEntityManagerFactoryBean.translateExceptionIfPossible(AbstractEntityManagerFactoryBean.java:550)
	at org.springframework.dao.support.DataAccessUtils.translateIfNecessary(DataAccessUtils.java:335)
	at org.springframework.dao.support.PersistenceExceptionTranslationInterceptor.invoke(PersistenceExceptionTranslationInterceptor.java:160)
	...
	at jdk.proxy2/jdk.proxy2.$Proxy187.credit(Unknown Source)
	at com.vietpay.marketplace.escrow.EscrowService.releaseEscrow(EscrowService.java:184)
	...
Caused by: org.hibernate.exception.LockAcquisitionException: could not execute statement [ERROR: deadlock detected ...]
	at org.hibernate.dialect.PostgreSQLDialect.lambda$buildSQLExceptionConversionDelegate$3(PostgreSQLDialect.java:1170)
	at org.hibernate.exception.internal.StandardSQLExceptionConverter.convert(StandardSQLExceptionConverter.java:58)
	at org.hibernate.engine.jdbc.spi.SqlExceptionHelper.convert(SqlExceptionHelper.java:108)
	at org.hibernate.engine.jdbc.internal.ResultSetReturnImpl.executeUpdate(ResultSetReturnImpl.java:197)
	at org.hibernate.query.sql.internal.NativeNonSelectQueryPlanImpl.executeUpdate(NativeNonSelectQueryPlanImpl.java:78)
	... 41 more
Caused by: org.postgresql.util.PSQLException: ERROR: deadlock detected
  Detail: Process 24117 waits for ShareLock on transaction 918244735; blocked by process 24118.
Process 24118 waits for ShareLock on transaction 918244731; blocked by process 24117.
  Hint: See server log for query details.
  Where: while updating tuple (41233,7) in relation "wallet_balance"
	at org.postgresql.core.v3.QueryExecutorImpl.receiveErrorResponse(QueryExecutorImpl.java:2713)
	... 52 more

2026-03-14 10:22:29.493 WARN  [http-nio-8080-exec-14] c.v.m.escrow.EscrowService       : releaseEscrow aborted, order remains ESCROW_PENDING orderId=ORD-2026-03-14-88213
2026-03-14 10:22:29.494 WARN  [http-nio-8080-exec-14] c.v.m.escrow.EscrowRetryPolicy   : no retry for this failure (retry only on OptimisticLockingFailureException), orderId=ORD-2026-03-14-88213
2026-03-14 10:22:29.498 INFO  [http-nio-8080-exec-25] c.v.m.escrow.EscrowService       : releaseEscrow ok orderId=ORD-2026-03-14-88214 amount=150000.00 in 1093 ms
2026-03-14 10:22:29.901 INFO  [scheduling-1] c.v.m.job.EscrowReconcileJob        : escrow_orders stuck in ESCROW_PENDING = 1`,
    },
  ],
  questions: [
    'Dựng lại chu trình chờ giữa hai phiên (PID 24117 và 24118): mỗi bên đang giữ khoá gì và đang chờ khoá gì? Dẫn chứng từ artifact.',
    'Vì sao deadlock xảy ra đúng lúc 10:22 với đúng 2 đơn này? Vấn đề nằm ở tầng SQL hay tầng thiết kế nghiệp vụ?',
    'Bạn xử lý 312 đơn kẹt ngay hôm nay thế nào, và thiết kế lại để không còn deadlock (hoặc deadlock thì tự hồi phục) thế nào?',
  ],
  hints: [
    'Nhìn wait_event_type = Lock, wait_event = transactionid ở cả hai pid, cùng dòng ShareLock granted = f trong pg_locks: xid mà mỗi bên chờ chính là xid của bên kia.',
    'Hai đơn là mua chéo (A mua của B và B mua của A) nên thứ tự cập nhật hai dòng wallet_balance là ngược nhau — hãy vẽ wait-for graph.',
    'Deadlock là lỗi bình thường và chỉ nên được xử lý bằng cách: khoá theo thứ tự cố định + retry có backoff/jitter + idempotency key để retry không sinh giao dịch kép.',
  ],
  answer: `**Tóm tắt:** Hai transaction cập nhật **hai dòng** của {{wallet_balance}} theo **thứ tự ngược nhau** (đơn mua chéo), tạo ra một vòng chờ trong wait-for graph → PostgreSQL phát hiện deadlock sau {{deadlock_timeout}} (1 giây) và abort một bên. Cần hai lớp sửa: (1) **thứ tự khoá cố định** để không bao giờ có vòng chờ, (2) **retry có backoff + jitter + idempotency key** để nếu deadlock vẫn xảy ra thì tự hồi phục chứ không kẹt đơn.

### Dựng lại chu trình chờ
- {{TX1}} (PID 24117, xid 918244731, đơn ORD-…88213, A mua của B): {{UPDATE}} trừ 150.000đ ở ví A ({{9f3c1a44-…}}) lúc 10:22:28.470 → **giữ khoá row của ví A** (tuple 8821/44). Sau đó cần cộng 150.000đ vào ví B ({{b7f3c9e2-…}}) → bị chặn.
- {{TX2}} (PID 24118, xid 918244735, đơn ORD-…88214, B mua của A): {{UPDATE}} trừ 150.000đ ở ví B lúc 10:22:28.481 → **giữ khoá row của ví B** (tuple 41233/7). Sau đó cần cộng 150.000đ vào ví A → bị chặn.
- Vòng chờ: **TX1 chờ TX2** (cần khoá ví B) và **TX2 chờ TX1** (cần khoá ví A). Không bên nào nhả khoá → khi một phiên đã chờ quá {{deadlock_timeout}} (1.000 ms), chính phiên đó chạy deadlock check; TX1 bắt đầu chờ trước nên kiểm tra trước, phát hiện vòng và tự abort (phiên phát hiện deadlock là nạn nhân).

### Dẫn chứng
- Artifact 1 (log server): **"ERROR: deadlock detected"** ở PID 24117, kèm DETAIL **"Process 24117 waits for ShareLock on transaction 918244735; blocked by process 24118."** và **"Process 24118 waits for ShareLock on transaction 918244731; blocked by process 24117."** — đây là **hai cạnh của vòng chờ** nằm ngay trong log. Dòng **"process 24117 detected deadlock while waiting for ShareLock on transaction 918244735 after 1000.884 ms"** khớp {{deadlock_timeout = 1s}}. **"CONTEXT: while updating tuple (41233,7) in relation wallet_balance"** chỉ ra đúng dòng bị tranh chấp (ví B). Ngay sau đó TX2 chạy xong câu UPDATE đã chờ (**"duration: 997.214 ms"**, tham số ví A) rồi COMMIT.
- Artifact 2 (ảnh pg_locks lúc 10:22:29.200, **trước** khi detector chạy): cả hai pid đều có {{wait_event_type = Lock}}, {{wait_event = transactionid}}. Trong {{pg_locks}}, 24117 có {{ShareLock}} **granted = f** trên transactionid **918244735** (của 24118) và 24118 có {{ShareLock}} **granted = f** trên transactionid **918244731** (của 24117) — mỗi bên chờ transaction của bên kia. Tuple lock {{granted = t}} (24117 trên 41233/7, 24118 trên 8821/44) chỉ là vị trí xếp hàng cho dòng mà mỗi bên đang **chờ**; khoá row thật nằm trong header tuple nên không hiện trong pg_locks. {{pg_blocking_pids(24117)}} trả về 24118 và {{pg_blocking_pids(24118)}} trả về 24117 — vòng chờ 2 đỉnh.
- Artifact 3 (log ứng dụng): {{"Caused by: org.postgresql.util.PSQLException: ERROR: deadlock detected"}} tại {{EscrowService.releaseEscrow(EscrowService.java:184)}}; dòng {{"no retry for this failure (retry only on OptimisticLockingFailureException)"}} cho thấy lỗi deadlock **không được retry** nên đơn kẹt ở {{ESCROW_PENDING}}; đơn kia (88214, PID 24118) thành công sau ~1 giây chờ vì nó **không** phải nạn nhân: khi 24117 rollback, khoá ví A được nhả và 24118 chạy tiếp tới COMMIT.

### Nguyên nhân gốc
Ở tầng nghiệp vụ, code cập nhật hai ví **theo thứ tự nghiệp vụ** (trừ ví người mua trước, cộng ví người bán sau). Với tính năng mua chéo, hai request song song lại có thứ tự ngược nhau trên **cùng một cặp ví** → vòng chờ. Đây không phải lỗi của PostgreSQL: PostgreSQL phát hiện deadlock sớm nhất có thể và abort để bảo vệ tính toàn vẹn dữ liệu. Vấn đề nằm ở **thiết kế thứ tự khoá** và ở việc **coi deadlock là lỗi không thể xảy ra**.

### Cách sửa ngắn hạn (dọn 312 đơn kẹt)
- Chạy job đối soát cho các đơn {{ESCROW_PENDING}}: đọc lại số dư hai ví từ ledger, đánh dấu những đơn bị rollback rồi gọi lại {{releaseEscrow}} với **idempotency key** = {{orderId}} để không cộng trùng.
- Tạm thời **serialize** các lệnh giải phóng escrow theo cặp ví (ví dụ khoá phân tán Redis theo {{min(walletA,walletB)}}) để dừng tái diễn trong lúc sửa code.
- Giữ {{log_lock_waits = on}} để mọi lần chờ khoá quá {{deadlock_timeout}} đều được log; không cần giảm {{deadlock_timeout}} (giảm quá thấp làm tốn CPU cho deadlock check). Đặt {{log_min_duration_statement}} khoảng 200–500 ms thay vì 0 để vẫn thấy câu bị chờ mà không ngập log.

### Cách sửa dài hạn ở tầng code
1. **Thứ tự khoá cố định.** Hướng tiền (ai trừ, ai cộng) không đổi, chỉ **thứ tự lấy khoá** phải cố định: khoá cả hai dòng theo {{ORDER BY wallet_id}} trước khi cập nhật, rồi trừ/cộng theo nghiệp vụ:
~~~sql
SELECT wallet_id, balance FROM wallet_ledger.wallet_balance
WHERE wallet_id IN (:walletA, :walletB) AND currency = 'VND'
ORDER BY wallet_id
FOR UPDATE;
~~~
Vì mọi transaction đều khoá theo cùng một thứ tự (LockRows nằm trên Sort nên các dòng được khoá theo thứ tự đã sắp), chu trình chờ không thể xảy ra giữa các transaction tuân thủ quy tắc này.
2. **Retry đúng cách.** Deadlock là lỗi *tạm thời*, phải retry có kiểm soát: bắt lỗi có SQLState **40P01** (deadlock_detected, Spring dịch thành {{CannotAcquireLockException}} như artifact 3) hoặc **40001** (serialization_failure, thành {{CannotSerializeTransactionException}}) — cả hai đều là {{PessimisticLockingFailureException}} — rồi retry **toàn bộ transaction** (retry phải bọc bên ngoài @Transactional) với **exponential backoff + full jitter** (50 ms → 100 → 200, tối đa 3–5 lần). Dùng {{@Retryable}} của Spring Retry và **luôn kèm idempotency key** để retry không tạo giao dịch kép.
3. **Rút ngắn transaction.** Transaction chỉ nên gồm: khoá dòng, cập nhật số dư, ghi bảng ledger, cập nhật trạng thái đơn. Không gọi HTTP, không ghi Redis/queue, không gửi thông báo trong transaction; không mở transaction ở tầng service bao quanh cả luồng nghiệp vụ.
4. **Cập nhật atomic, không read-modify-write.** {{UPDATE … SET balance = balance - :amount WHERE wallet_id = :w AND currency = 'VND' AND balance >= :amount}} — vừa tránh đọc-sửa-ghi, vừa bảo đảm không âm số dư, vừa rút ngắn thời gian giữ khoá.
5. **Advisory lock** khi không thể sắp lại thứ tự UPDATE: lấy {{pg_advisory_xact_lock}} cho **từng ví** theo thứ tự id tăng dần (ví dụ khoá theo {{hashtextextended(wallet_id::text, 0)}} của ví nhỏ trước, ví lớn sau) ở đầu transaction. Một khoá chung cho "cặp ví" chỉ tuần tự hoá đúng cặp đó, không ngăn được vòng chờ giữa nhiều cặp (A→B, B→C, C→A).
6. **Ledger append-only + tối ưu lạc quan.** Bảng {{wallet_ledger}} chỉ ghi thêm dòng giao dịch, {{wallet_balance}} là projection cập nhật bằng {{version}} (optimistic locking) để tranh chấp được xử lý bằng retry chứ không bằng khoá dài; đồng thời dễ đối soát, dễ audit — đây cũng là hướng mà ngân hàng/fintech VN thường yêu cầu.
7. **Nếu nghiệp vụ cho phép thử lại sau:** {{SELECT … FOR UPDATE NOWAIT}} hoặc {{SET LOCAL lock_timeout = '2s'}} để không chờ lâu, rồi đưa đơn vào hàng đợi xử lý lại. ({{SKIP LOCKED}} không phù hợp ở đây vì ta cần đúng hai dòng ví cụ thể, không phải "dòng nào rảnh".)

### Phòng ngừa và monitoring
- {{pg_stat_database.deadlocks}} (có từ PostgreSQL 9.2) đếm số deadlock theo database: cảnh báo khi {{deadlocks}} tăng khác 0 theo giờ (và ghi kèm {{log_lock_waits}}, {{log_min_duration_statement}}).
- Theo dõi {{pg_stat_activity}} có {{wait_event_type = 'Lock'}} và {{pg_locks.granted = false}}; cảnh báo khi có phiên chờ lock quá 1 giây.
- Cảnh báo transaction sống quá 60 giây (cùng cảnh báo {{idle in transaction}}) vì transaction sống lâu làm tăng xác suất deadlock và giữ khoá lâu.
- Dashboard nghiệp vụ: số đơn {{ESCROW_PENDING}} > 0 phải cảnh báo; job đối soát chạy tự động mỗi 5 phút và tự retry các đơn kẹt.
- Quy tắc review: mọi transaction cập nhật nhiều hơn một dòng phải thống nhất thứ tự khoá và có retry + idempotency.

> Senior tip: **deadlock không phải sự cố, nó là một cơ chế bảo vệ dữ liệu**. Mục tiêu của bạn không phải "làm cho deadlock biến mất" (điều đó không khả thi trong hệ thống phân tán), mà là làm cho nó **rẻ và tự hồi phục**: thứ tự khoá cố định để không có vòng chờ, retry có backoff + jitter để lần sau thắng, idempotency key để retry không mất tiền, và cảnh báo {{deadlocks > 0}} để biết hệ thống có đang đi vào vùng tranh chấp hay không. Kinh nghiệm thực tế: vài chục deadlock/tuần trên hàng triệu giao dịch là **chấp nhận được nếu tự retry**; số deadlock tăng theo tải là **dấu hiệu kiến trúc**; còn đơn kẹt không tự retry thì mới là sự cố vận hành. Và nhớ: nếu bạn thêm retry mà chưa có idempotency key, bạn đang đổi lỗi deadlock thành lỗi mất tiền — đó là lỗi tệ hơn nhiều.`,
  rubric: [
    'Dựng đúng wait-for graph: TX1 (24117, xid 918244731) giữ dòng ví A chờ ví B, TX2 (24118, xid 918244735) giữ dòng ví B chờ ví A, kèm bằng chứng cụ thể (wait_event = transactionid, ShareLock granted = f trên xid của bên kia, pg_blocking_pids trả về chéo); 24117 là nạn nhân',
    'Chỉ đúng nguyên nhân gốc ở tầng thiết kế: hai đơn mua chéo cập nhật hai dòng wallet_balance theo thứ tự ngược nhau do code khoá theo thứ tự request',
    'Biết rằng deadlock là hệ quả của thứ tự khoá không cố định và phải sửa bằng khoá theo ORDER BY wallet_id / thứ tự cố định / advisory lock, kèm retry SQLState 40P01 có backoff + jitter và idempotency key',
    'Có phương án xử lý ngắn hạn 312 đơn kẹt (job đối soát, chạy lại có idempotency key, serialize tạm thời) và biết vì sao retry hiện tại không bắt được deadlock',
    'Có monitoring/phòng ngừa cụ thể: pg_stat_database.deadlocks, log_lock_waits, cảnh báo phiên chờ lock, cảnh báo đơn ESCROW_PENDING kẹt, quy tắc review thứ tự khoá và rút ngắn transaction',
  ],
  tags: ['postgresql', 'deadlock', 'locking', 'retry', 'idempotency'],
},
{
  id: 'lab-sql-005',
  category: 'sql',
  title: 'Flash sale treo vì một transaction "idle in transaction" giữ khoá',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử MiniShop tổ chức "Mega Sale 12:00" ngày 15/03/2026 trên **3.200 đơn/giây** trong 3 phút đầu. Service {{inventory-service}} (Spring Boot 3.3, HikariCP 20 connection, PostgreSQL 15.6) giữ chức năng đặt trước tồn kho: mỗi đơn chạy một transaction gồm {{INSERT orders}}, {{INSERT order_item}}, {{UPDATE inventory}} (trừ tồn kho), rồi gọi HTTP sang {{risk-scoring-service}} để chấm điểm rủi ro trước khi chốt đơn.

**Triệu chứng.** Từ **12:00:31** đến khoảng 12:02:10 (DBA terminate phiên gây treo lúc 12:01:55, hàng đợi xả hết sau ~15 giây), toàn bộ đơn hàng có SKU bán chạy {{IPH15-256GB}} đứng yên: p99 lên 30 giây rồi timeout, {{HikariPool-1}} báo hết connection. Điểm bất thường nhất: **CPU của RDS chỉ 5%** — database gần như rảnh mà mọi thứ vẫn treo, tức đây là triệu chứng **blocking**, không phải quá tải.

**Điều đã thử, không ăn.** Tăng {{max_connections}} lên 500 (tệ hơn: thêm phiên chờ vô ích), tăng pool Hikari lên 60, restart một pod {{inventory-service}} (10.0.31.9) — không giúp gì, vì phiên đang giữ khoá thuộc một pod khác và hàng đợi khoá vẫn nằm nguyên ở DB.

**Việc bạn có.** Bốn artifact: ảnh {{pg_stat_activity}}, chi tiết chuỗi khoá ({{pg_locks}} + {{pg_blocking_pids}}), cấu hình timeout của instance, và log ứng dụng. Hãy tìm phiên gây treo, dựng chuỗi chờ, và đề xuất cách xử lý ngay lẫn cách loại bỏ nguyên nhân gốc.`,
  artifacts: [
    {
      name: 'pg-stat-activity.txt',
      lang: 'text',
      content: `-- 2026-03-15 12:01:49.606 +07, chụp từ RDS shop-inventory-primary (PostgreSQL 15.6)
shop=# SELECT pid, usename, application_name, client_addr, state, xact_start, wait_event_type,
       wait_event, left(query, 60) AS query
FROM pg_stat_activity
WHERE datname = 'shop' AND backend_type = 'client backend'
ORDER BY xact_start NULLS LAST, pid
LIMIT 14;
  pid  |    usename    | application_name  | client_addr |        state        |         xact_start         | wait_event_type | wait_event    |                            query
-------+---------------+-------------------+-------------+---------------------+----------------------------+-----------------+---------------+--------------------------------------------------------------
 24117 | inventory_svc | inventory-service | 10.0.31.8   | idle in transaction | 2026-03-15 12:00:31.204+07 | Client          | ClientRead    | UPDATE inventory SET available = available - 1, reserved = r
 24831 | inventory_svc | inventory-service | 10.0.31.8   | active              | 2026-03-15 12:00:33.882+07 | Lock            | transactionid | UPDATE inventory SET available = available - 1, reserved = r
 24832 | inventory_svc | inventory-service | 10.0.31.9   | active              | 2026-03-15 12:00:34.115+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24833 | inventory_svc | inventory-service | 10.0.31.9   | active              | 2026-03-15 12:00:34.207+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24834 | inventory_svc | inventory-service | 10.0.31.10  | active              | 2026-03-15 12:00:34.288+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24835 | inventory_svc | inventory-service | 10.0.31.10  | active              | 2026-03-15 12:00:34.500+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24841 | inventory_svc | inventory-service | 10.0.31.11  | active              | 2026-03-15 12:00:41.220+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24844 | inventory_svc | inventory-service | 10.0.31.11  | active              | 2026-03-15 12:00:41.884+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24852 | inventory_svc | inventory-service | 10.0.31.12  | active              | 2026-03-15 12:00:48.551+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24860 | inventory_svc | inventory-service | 10.0.31.12  | active              | 2026-03-15 12:00:52.118+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24944 | inventory_svc | inventory-service | 10.0.31.13  | active              | 2026-03-15 12:01:41.902+07 | Lock            | tuple         | UPDATE inventory SET available = available - 1, reserved = r
 24901 | report_svc    | report-service    | 10.0.33.5   | active              | 2026-03-15 12:01:48.902+07 |                 |               | SELECT sku_id, sum(qty) FROM order_item WHERE created_at > n
 24790 | order_svc     | order-service     | 10.0.31.12  | active              | 2026-03-15 12:01:49.588+07 |                 |               | SELECT count(*) FROM orders WHERE created_at > now() - inter
 24118 | inventory_svc | inventory-service | 10.0.31.8   | idle                |                            | Client          | ClientRead    | SELECT 1
(14 rows)

shop=# SELECT state, wait_event_type, count(*) FROM pg_stat_activity
WHERE datname = 'shop' AND backend_type = 'client backend' GROUP BY 1, 2 ORDER BY 3 DESC;
        state        | wait_event_type | count
---------------------+-----------------+-------
 active              | Lock            |    46
 idle                | Client          |    12
 active              |                 |     9
 idle in transaction | Client          |     1
(4 rows)`,
    },
    {
      name: 'pg-locks-chain.txt',
      lang: 'text',
      content: `-- 2026-03-15 12:01:49.610 +07
shop=# SELECT a.pid, a.wait_event, pg_blocking_pids(a.pid) AS blocked_by, now() - a.xact_start AS xact_age
FROM pg_stat_activity a
WHERE a.datname = 'shop' AND a.wait_event_type = 'Lock'
ORDER BY a.xact_start
LIMIT 6;
  pid  |  wait_event   |     blocked_by      |    xact_age
-------+---------------+---------------------+-----------------
 24831 | transactionid | {24117}             | 00:01:15.728
 24832 | tuple         | {24831}             | 00:01:15.495
 24833 | tuple         | {24831,24832}       | 00:01:15.403
 24834 | tuple         | {24831,24832,24833} | 00:01:15.322
 24835 | tuple         | {24831,24832,24833,24834} | 00:01:15.110
 24841 | tuple         | {24831,24832,24833,24834,24835} | 00:01:08.390
(6 rows)

shop=# SELECT pid, state, wait_event, now() - xact_start AS xact_age, now() - state_change AS idle_for
FROM pg_stat_activity WHERE pid = 24117;
  pid  |        state        | wait_event |   xact_age   |   idle_for
-------+---------------------+------------+--------------+--------------
 24117 | idle in transaction | ClientRead | 00:01:18.406 | 00:01:18.398
(1 row)

shop=# SELECT l.pid, l.locktype, l.relation::regclass AS relation, l.mode, l.granted,
       l.page, l.tuple, l.transactionid::text AS xid
FROM pg_locks l
WHERE l.pid IN (24117, 24831, 24832)
ORDER BY l.pid, l.granted, l.locktype;
  pid  |   locktype    |    relation    |       mode       | granted | page | tuple |    xid
-------+---------------+----------------+------------------+---------+------+-------+-----------
 24117 | relation      | inventory_pkey | RowExclusiveLock | t       |      |       |
 24117 | relation      | inventory      | RowExclusiveLock | t       |      |       |
 24117 | relation      | order_item     | RowExclusiveLock | t       |      |       |
 24117 | relation      | orders         | RowExclusiveLock | t       |      |       |
 24117 | transactionid |                | ExclusiveLock    | t       |      |       | 884120917
 24117 | virtualxid    |                | ExclusiveLock    | t       |      |       |
 24831 | transactionid |                | ShareLock        | f       |      |       | 884120917
 24831 | relation      | inventory      | RowExclusiveLock | t       |      |       |
 24831 | transactionid |                | ExclusiveLock    | t       |      |       | 884121022
 24831 | tuple         | inventory      | ExclusiveLock    | t       | 8821 |    44 |
 24831 | virtualxid    |                | ExclusiveLock    | t       |      |       |
 24832 | tuple         | inventory      | ExclusiveLock    | f       | 8821 |    44 |
 24832 | relation      | inventory      | RowExclusiveLock | t       |      |       |
 24832 | transactionid |                | ExclusiveLock    | t       |      |       | 884121057
 24832 | virtualxid    |                | ExclusiveLock    | t       |      |       |
(15 rows)

-- Ghi chú: khoá row mà 24117 giữ trên dòng SKU IPH15-256GB (tuple 8821/44) nằm trong header của tuple
-- (xmax = 884120917), nên không hiện thành dòng "tuple" của 24117 trong pg_locks. Ta thấy nó gián tiếp:
-- 24831 chờ ShareLock trên transaction 884120917 của 24117; các phiên sau xếp hàng chờ tuple lock do 24831 giữ.`,
    },
    {
      name: 'pg-timeouts-config.txt',
      lang: 'text',
      content: `-- 2026-03-15 12:01:55 +07, cấu hình instance shop-inventory-primary (RDS, DB parameter group mặc định)
shop=# SELECT name, setting, unit, source, boot_val
FROM pg_settings
WHERE name IN ('idle_in_transaction_session_timeout','idle_session_timeout','statement_timeout','lock_timeout',
               'deadlock_timeout','max_connections','superuser_reserved_connections','log_lock_waits',
               'log_min_duration_statement','tcp_keepalives_idle')
ORDER BY name;
                name                 | setting | unit |       source       | boot_val
-------------------------------------+---------+------+--------------------+----------
 deadlock_timeout                    | 1000    | ms   | default            | 1000
 idle_in_transaction_session_timeout | 0       | ms   | default            | 0
 idle_session_timeout                | 0       | ms   | default            | 0
 lock_timeout                        | 0       | ms   | default            | 0
 log_lock_waits                      | off     |      | default            | off
 log_min_duration_statement          | -1      | ms   | default            | -1
 max_connections                     | 200     |      | configuration file | 100
 statement_timeout                   | 0       | ms   | default            | 0
 superuser_reserved_connections      | 3       |      | configuration file | 3
 tcp_keepalives_idle                 | 300     | s    | configuration file | 0
(10 rows)

-- Ghi chú của DBA: idle_in_transaction_session_timeout = 0 nghĩa là PostgreSQL KHÔNG BAO GIỜ
-- tự kết thúc một phiên treo ở trạng thái "idle in transaction". Phiên 24117 sẽ sống
-- cho tới khi client commit/rollback, tự ngắt kết nối, hoặc DBA terminate thủ công.
-- (SET idle_in_transaction_session_timeout trong phiên psql này chỉ có hiệu lực cho chính phiên psql,
--  không ảnh hưởng 24117; muốn áp dụng cho ứng dụng phải đổi parameter group hoặc ALTER ROLE.)
shop=# SELECT pg_terminate_backend(24117);
 pg_terminate_backend
----------------------
 t
(1 row)`,
    },
    {
      name: 'app-inventory-service.log',
      lang: 'text',
      content: `2026-03-15 12:00:31.204 INFO  [http-nio-8080-exec-31] c.v.m.inventory.InventoryService  : reserveStock start orderId=ORD-2026-03-15-00091233 sku=IPH15-256GB qty=1
2026-03-15 12:00:31.209 DEBUG [http-nio-8080-exec-31] o.h.SQL   : insert into orders (id, user_id, total_amount, status, created_at) values (?,?,?,?,?)
2026-03-15 12:00:31.211 DEBUG [http-nio-8080-exec-31] o.h.SQL   : insert into order_item (order_id, sku_id, qty, unit_price) values (?,?,?,?)
2026-03-15 12:00:31.212 DEBUG [http-nio-8080-exec-31] o.h.SQL   : update inventory set available=available-1,reserved=reserved+1,updated_at=now() where sku_id=? and available>=1
2026-03-15 12:00:31.214 INFO  [http-nio-8080-exec-31] c.v.m.risk.RiskClient           : POST http://risk-scoring.svc.internal:8080/v1/score body={"orderId":"ORD-2026-03-15-00091233","amount":29990000}
2026-03-15 12:01:01.219 WARN  [http-nio-8080-exec-31] c.v.m.risk.RiskClient           : risk-scoring read timeout after 30000ms, attempt=1/3
2026-03-15 12:01:01.884 INFO  [http-nio-8080-exec-31] c.v.m.risk.RiskClient           : POST http://risk-scoring.svc.internal:8080/v1/score body={"orderId":"ORD-2026-03-15-00091233","amount":29990000}
2026-03-15 12:01:31.890 WARN  [http-nio-8080-exec-31] c.v.m.risk.RiskClient           : risk-scoring read timeout after 30000ms, attempt=2/3
2026-03-15 12:01:32.402 INFO  [http-nio-8080-exec-31] c.v.m.risk.RiskClient           : POST http://risk-scoring.svc.internal:8080/v1/score body={"orderId":"ORD-2026-03-15-00091233","amount":29990000}
2026-03-15 12:01:52.118 WARN  [http-nio-8080-exec-42] c.z.h.pool.HikariPool           : HikariPool-1 - Connection is not available, request timed out after 3000ms (total=20, active=20, idle=0, waiting=37)
2026-03-15 12:01:52.119 ERROR [http-nio-8080-exec-42] c.v.m.inventory.InventoryService  : reserveStock failed orderId=ORD-2026-03-15-00091237 java.sql.SQLTransientConnectionException: HikariPool-1 - Connection is not available, request timed out after 3000ms
2026-03-15 12:01:58.220 WARN  [http-nio-8080-exec-45] c.z.h.pool.HikariPool           : HikariPool-1 - Connection is not available, request timed out after 3000ms (total=20, active=20, idle=0, waiting=29)
2026-03-15 12:02:02.408 WARN  [http-nio-8080-exec-31] c.v.m.risk.RiskClient           : risk-scoring read timeout after 30000ms, attempt=3/3
2026-03-15 12:02:02.411 WARN  [http-nio-8080-exec-31] c.z.h.pool.PoolBase             : HikariPool-1 - Failed to validate connection org.postgresql.jdbc.PgConnection@5b7a3f1e (This connection has been closed.)
2026-03-15 12:02:02.412 ERROR [http-nio-8080-exec-31] c.v.m.inventory.InventoryService  : reserveStock failed orderId=ORD-2026-03-15-00091233 org.springframework.transaction.TransactionSystemException: Could not roll back JPA transaction; nested exception: FATAL: terminating connection due to administrator command
2026-03-15 12:02:05.771 INFO  [scheduling-1] c.v.m.job.FlashSaleReconcileJob   : orders reserved but not confirmed = 4.182`,
    },
  ],
  questions: [
    'Phiên nào đang gây treo và tại sao nó giữ được khoá? Dẫn chứng từ pg_stat_activity và pg_locks.',
    'Hãy dựng chuỗi chờ (lock chain): ai chờ ai, và vì sao hệ thống treo khi CPU của DB chỉ 5%?',
    'Bạn xử lý ngay lúc 12:02 ra sao, và thay đổi gì để lần sau flash sale không bị treo như vậy?',
  ],
  hints: [
    'Tìm phiên có state = "idle in transaction": nó không chờ lock (wait_event_type = Client, wait_event = ClientRead) mà server đang chờ ứng dụng gửi lệnh tiếp theo (hoặc COMMIT) — trong khi khoá row vẫn còn nguyên.',
    'Đọc pg_blocking_pids: 24831 (chờ transactionid) bị 24117 chặn; các phiên còn lại chờ tuple lock do 24831 giữ và xếp hàng sau nhau — đó là hàng đợi khoá trên cùng một dòng.',
    'Kiểm tra pg_settings: idle_in_transaction_session_timeout = 0 nghĩa là PostgreSQL không bao giờ tự dọn phiên treo; và trong log ứng dụng có lời gọi HTTP 30 giây nằm ngay trong @Transactional.',
  ],
  answer: `**Tóm tắt:** Một transaction của {{inventory-service}} mở {{@Transactional}} bao trọn luồng nghiệp vụ, trong đó có lời gọi HTTP 30 giây (×3 retry) tới {{risk-scoring-service}}. Trong lúc chờ HTTP, connection **vẫn nằm trong transaction** ở trạng thái **idle in transaction** và vẫn **giữ khoá row** trên {{inventory}} của SKU flash sale → 46 phiên khác xếp hàng chờ cùng một dòng. Vì {{idle_in_transaction_session_timeout = 0}}, PostgreSQL **không bao giờ tự dọn** phiên treo này.

### Phiên gây treo và khoá nó giữ
- {{pid 24117}}, {{application_name = inventory-service}}, {{client_addr = 10.0.31.8}}, {{state = idle in transaction}}, {{xact_start = 12:00:31.204}}, {{xact_age = 00:01:18.402}}.
- {{wait_event_type = Client}}, {{wait_event = ClientRead}}: đây **không phải** đang chờ lock, mà server đang chờ **ứng dụng gửi lệnh tiếp theo** — transaction đã mở, câu lệnh cuối đã chạy xong, nhưng chưa có COMMIT/ROLLBACK. {{idle_for = 00:01:18.398}} cho thấy nó im lặng gần như suốt transaction.
- Câu lệnh cuối: {{UPDATE inventory SET available = available - 1 … WHERE sku_id = 'IPH15-256GB' AND available >= 1}}. Khoá row do UPDATE tạo ra nằm trong header tuple (xmax = transaction 884120917 của 24117) nên không hiện trực tiếp trong {{pg_locks}}; bằng chứng là 24831 có {{ShareLock}} **granted = f** trên transactionid **884120917** → **khoá row của SKU bán chạy vẫn nằm trong tay 24117**.
- Vì sao nó treo ở đó: log ứng dụng cho thấy sau câu {{UPDATE inventory}}, service gọi {{POST /v1/score}} tới {{risk-scoring-service}}, timeout 30 giây, retry 3 lần → **78 giây nằm im trong transaction**, trong khi vẫn giữ khoá.

### Chuỗi chờ
- {{24831}} là phiên đầu hàng đợi: đã lấy tuple lock trên 8821/44 và chờ {{ShareLock}} trên transaction của **24117** ({{wait_event = transactionid}}, {{blocked_by = 24117}}).
- {{24832}}, {{24833}}, {{24834}}, {{24835}}, {{24841}}… chờ **tuple lock** do 24831 giữ ({{wait_event = tuple}}); {{pg_blocking_pids}} của mỗi phiên liệt kê 24831 cùng các phiên xếp hàng trước nó ({{24833}} → 24831, 24832; {{24834}} → 24831, 24832, 24833…).
- Tổng {{46}} phiên có {{wait_event_type = 'Lock'}}, tất cả cùng UPDATE một dòng SKU {{IPH15-256GB}}. Một phiên idle đứng đầu kéo theo cả hàng đợi → toàn bộ SKU hot bị kẹt, và vì mỗi phiên chờ đang chiếm một connection Hikari nên pool các pod cũng cạn.
- **Vì sao CPU chỉ 5%?** Vì các phiên bị chặn đều **ngồi chờ**, không tính CPU; database rảnh nhưng không tiến được. Đây là triệu chứng blocking, không phải quá tải — thêm connection hay thêm CPU đều vô ích.

### Nguyên nhân gốc
Ba tầng lồng nhau:
1. **Transaction quá rộng:** {{@Transactional}} bao trọn cả luồng nghiệp vụ, bao gồm lời gọi HTTP ra ngoài. Bất kỳ lời gọi nào chậm đều biến thành thời gian giữ khoá row.
2. **Không có timeout ở tầng DB:** {{idle_in_transaction_session_timeout = 0}}, {{statement_timeout = 0}}, {{lock_timeout = 0}}, {{log_lock_waits = off}}. PostgreSQL sẽ không tự giết phiên treo; {{max_connections = 200}} cũng không cứu được vì 46 phiên đang chờ vẫn chiếm chỗ.
3. **Không có cơ chế fail-fast:** {{risk-scoring}} retry 3 lần × 30 giây nghĩa là tối đa **90 giây giữ khoá** (tại thời điểm chụp ảnh đã là 78 giây); {{HikariCP}} timeout 3 giây khiến request của các thread khác lỗi, nhưng **không** phá khoá nào cả.

### Xử lý ngay (12:02)
- {{SELECT pg_terminate_backend(24117);}} — kết thúc phiên treo, transaction của nó bị rollback, khoá row được nhả và hàng đợi chạy tiếp (artifact 3: DBA làm lúc 12:01:55, trả về t). ({{pg_cancel_backend}} chỉ huỷ câu lệnh đang chạy, vô dụng với phiên đang idle.) Đơn ORD-…00091233 của phiên đó bị rollback — log ứng dụng lúc 12:02:02 xác nhận.
- Tạm dừng bán SKU {{IPH15-256GB}} hoặc chuyển sang hàng đợi để dừng dồn thêm phiên chờ.
- Bật ngay (không cần restart): đổi {{idle_in_transaction_session_timeout = 30s}} trong DB parameter group của RDS (tham số dynamic), hoặc {{ALTER ROLE inventory_svc SET lock_timeout = '3s'}} — có hiệu lực với các connection **mới** của role, nên cần recycle pool. Lệnh {{SET}} trong psql chỉ áp dụng cho phiên psql đó.
- Sau khi dọn, chạy job đối soát {{orders}} đã reserve nhưng chưa confirm (log cho thấy **4.182 đơn** ở trạng thái đó) và hoàn tiền/đặt lại tồn kho cho các đơn bị treo.

### Cách sửa lâu dài
1. **Tách transaction khỏi I/O.** Mô hình đúng: (a) transaction ngắn ghi tồn kho và tạo đơn ở trạng thái {{PENDING_RISK}}; (b) **ngoài transaction** gọi {{risk-scoring}}; (c) transaction thứ hai chốt đơn / hoàn trả tồn kho. Nếu cần nhất quán chặt, dùng outbox + consumer hoặc saga thay vì giữ khoá trong lúc chờ mạng.
2. **Timeout mọi lời gọi ra ngoài:** connect timeout + read timeout ngắn (2–3 giây), **không retry trong lúc giữ khoá**, dùng circuit breaker (Resilience4j) để fail nhanh.
3. **Đặt timeout ở tầng DB theo role**, không chỉ ở instance:
~~~sql
ALTER ROLE inventory_svc SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE inventory_svc SET statement_timeout = '15s';
ALTER ROLE inventory_svc SET lock_timeout = '3s';
-- log_lock_waits = on: RDS không cho ALTER SYSTEM, đổi trong DB parameter group
~~~
4. **Giảm thời gian giữ khoá:** một câu {{UPDATE}} atomic duy nhất cho tồn kho, đặt ở **cuối** transaction ngắn, không đọc-rồi-ghi; với nghiệp vụ "hết hàng thì fail nhanh", dùng {{SELECT … FOR UPDATE SKIP LOCKED}} hoặc {{NOWAIT}} để **không xếp hàng** — mỗi đơn thử khoá một lần, thua thì trả "hết hàng" ngay thay vì xếp hàng 30 giây.
5. **Chống quá tải trước khi chạm DB:** đặt tồn kho flash sale trong Redis/atomic counter để chặn ngay ở tầng app, giảm tải hàng trăm lần; giới hạn số phiên chờ bằng rate-limit theo SKU.
6. **Tự dọn phiên treo:** job hệ thống quét {{pg_stat_activity}} mỗi 15–30 giây, {{terminate}} các phiên {{idle in transaction}} quá 60 giây, và gửi cảnh báo.
7. **Nếu dùng MySQL:** tương đương là {{SHOW ENGINE INNODB STATUS}} (mục {{TRANSACTIONS}} và {{LATEST DETECTED DEADLOCK}}), {{performance_schema.data_lock_waits}} + {{data_locks}}, {{information_schema.innodb_trx}}, và {{innodb_lock_wait_timeout}} (mặc định 50 giây). MySQL **không có** tham số riêng cho phiên idle trong transaction ({{wait_timeout}} áp dụng cho mọi connection idle, mặc định 8 giờ, quá dài), nên phải chặn ở tầng ứng dụng (transaction timeout, không gọi I/O trong transaction) kèm {{innodb_lock_wait_timeout}} ngắn cho phía chờ.

### Phòng ngừa và monitoring
- Cảnh báo: {{SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction'}} > 0 (hoặc > 5 phiên); cảnh báo theo {{xact_age > 60s}}.
- Cảnh báo: số phiên {{wait_event_type = 'Lock'}} > 20; {{pg_stat_activity}} có {{wait_event = 'transactionid'}} là dấu hiệu chuỗi chờ.
- Cảnh báo tầng app: {{hikaricp.connections.pending}} > 0, {{hikaricp.connections.acquire}} p95 tăng, latency của {{risk-scoring}}.
- Dashboard: đồ thị số phiên theo {{state}} và số phiên chờ lock theo SKU; bật {{log_lock_waits = on}} để có dấu vết cho phân tích sau.
- Quy tắc review: **transaction không được chứa lời gọi mạng**; bắt buộc có timeout cho mọi client ngoài; bắt buộc transaction có thời lượng giới hạn.
- Chạy diễn tập flash sale với giới hạn connection thấp để phát hiện sớm dạng treo kiểu này (nếu chịu được 3.200 đơn/giây thì DB cũng phải chịu được ít nhất vậy).

> Senior tip: trạng thái **"idle in transaction"** là trạng thái nguy hiểm nhất của PostgreSQL vì nó **không tốn CPU** — DB rảnh 5% mà dịch vụ vẫn treo, khiến team thường đi tìm vấn đề ở chỗ sai (thêm CPU, thêm connection, restart service). Quy tắc nhớ: **CPU thấp + latency cao = blocking**; hãy nhìn {{pg_stat_activity}} và {{pg_blocking_pids}} trước khi đụng tới cấu hình hiệu năng. Và bài học lớn nhất cho team Java: **transaction chỉ nên chứa SQL** — mọi lời gọi HTTP, message broker hay file I/O đều phải nằm ngoài transaction. Một setting đáng đầu tư nhất cho một shop dùng PostgreSQL là {{idle_in_transaction_session_timeout}}: nó biến một sự cố treo kéo dài 30 phút thành một sự cố tự hồi phục trong 30 giây.`,
  rubric: [
    'Chỉ đúng phiên gây treo (pid 24117, idle in transaction, wait_event ClientRead, xact_age 78 giây) và giải thích nó giữ khoá row inventory vì câu UPDATE đã chạy xong nhưng transaction chưa commit',
    'Dựng đúng hàng đợi khoá: 24831 chờ transactionid của 24117, các phiên còn lại chờ tuple lock do 24831 giữ (pg_blocking_pids liệt kê 24831 và các phiên xếp trước), tổng 46 phiên chờ Lock; và giải thích vì sao CPU 5% mà hệ thống vẫn treo (blocking chứ không phải quá tải)',
    'Chỉ ra nguyên nhân gốc ở tầng thiết kế: @Transactional bao trọn luồng nghiệp vụ có lời gọi HTTP risk-scoring timeout 30 giây × 3 retry, cộng với idle_in_transaction_session_timeout = 0 khiến PostgreSQL không tự dọn phiên treo',
    'Có phương án xử lý ngay: pg_terminate_backend(24117), bật idle_in_transaction_session_timeout/lock_timeout, dừng bán SKU và đối soát 4.182 đơn treo',
    'Đề xuất sửa lâu dài đúng: tách transaction khỏi lời gọi HTTP (2 transaction + outbox/saga), timeout + circuit breaker cho client ngoài, đặt timeout theo role trong PostgreSQL, giảm thời gian giữ khoá, chống quá tải bằng Redis/rate-limit, và nêu tương đương MySQL (SHOW ENGINE INNODB STATUS, performance_schema.data_lock_waits, innodb_lock_wait_timeout)',
    'Có monitoring cụ thể: cảnh báo số phiên idle in transaction, số phiên chờ Lock, xact_age, hikaricp.connections.pending, log_lock_waits, và quy tắc review transaction không chứa I/O',
  ],
  tags: ['postgresql', 'lock-wait', 'idle-in-transaction', 'blocking', 'flash-sale'],
}
,{id:'lab-sql-006',category:'sql',title:'PostgreSQL bỏ index do cast và function trên cột',level:'senior',scenario:`PostgreSQL 15 bảng orders có 8 triệu dòng và index B-tree trên customer_id (bigint). API nhận customer_id dưới dạng chuỗi; truy vấn cast cột thành text, latency tăng lên 4 giây.`,artifacts:[{name:'explain.txt',lang:'text',content:`EXPLAIN (ANALYZE, BUFFERS): SELECT * FROM orders WHERE customer_id::text = '42017'; Seq Scan on orders (actual time=0.04..3912.6 rows=18 loops=1); Rows Removed by Filter: 7999982; shared hit=14500 read=51800; Planning Time=0.4 ms; Execution Time=3913.1 ms. Index: CREATE INDEX orders_customer_id_idx ON orders(customer_id); customer_id type bigint.`}],questions:['Vì sao index không dùng và sửa theo hướng nào?','Khi nào functional index phù hợp?'],hints:['Predicate áp function/cast lên cột.','Ép kiểu đầu vào thành bigint thay vì biến đổi cột.'],answer:`**Tóm tắt:** Predicate {{customer_id::text}} biến đổi giá trị cột nên B-tree trên bigint không khớp biểu thức; planner quét tuần tự 8 triệu dòng. Chuyển input thành bigint và so sánh trực tiếp sẽ giữ predicate sargable.
### Bằng chứng và sửa
EXPLAIN cho thấy Seq Scan, gần 8 triệu rows removed, hơn 51.800 buffer read và 3.9 giây. Parse/validate input thành bigint ở ứng dụng rồi bind BIGINT cho predicate {{customer_id = $1}}. Nếu nghiệp vụ thực sự tìm theo biểu thức chuẩn hóa, expression index phải dùng đúng biểu thức truy vấn; mọi function trong index expression phải IMMUTABLE. Xác nhận bằng EXPLAIN ANALYZE.
Không tạo index tùy tiện trước khi sửa predicate; function phải immutable để dùng trong index. So sánh cardinality, statistics và buffers trước/sau.
> Senior tip: Đọc predicate thực thi và kiểu bind từ plan/log, không chỉ nhìn index đã tồn tại.`,rubric:['Nhận ra cast trên cột làm lệch index key','Dẫn Seq Scan/rows removed/buffers/time','Đề xuất tham số bigint và predicate trực tiếp','Nêu functional index chỉ khi cần, đúng expression/immutable','Xác nhận bằng EXPLAIN ANALYZE'],tags:['postgresql','index','implicit-cast']},
{id:'lab-sql-007',category:'sql',title:'Deadlock do cập nhật hai hàng theo thứ tự ngược',level:'senior',scenario:`Hai request chuyển tồn kho giữa SKU A và B trong PostgreSQL 15. Transaction T1 khóa A rồi B; T2 khóa B rồi A. Một transaction bị PostgreSQL hủy.`,artifacts:[{name:'postgresql-2026-10-22.log',lang:'text',content:`2026-10-22 10:12:01.004 +07 [18422] ERROR: deadlock detected
2026-10-22 10:12:01.004 +07 [18422] DETAIL: Process 18422 waits for ShareLock on transaction 99011; blocked by process 18439.
Process 18439 waits for ShareLock on transaction 99012; blocked by process 18422.
Process 18422: UPDATE inventory SET qty=qty-1 WHERE sku='B'
Process 18439: UPDATE inventory SET qty=qty-1 WHERE sku='A'
2026-10-22 10:12:01.004 +07 [18422] HINT: See server log for query details.
T1 pid=18422 first updated A; T2 pid=18439 first updated B; deadlock_timeout=1s.`}],questions:['Dựng wait-for cycle từ log.','Sửa thứ tự khóa và xử lý transaction bị abort thế nào?'],hints:['T1 giữ A chờ B, T2 giữ B chờ A.','PostgreSQL chọn victim; retry toàn transaction với backoff.'],answer:`**Tóm tắt:** T1 giữ khóa A và chờ B; T2 giữ B và chờ A, tạo chu trình deadlock. PostgreSQL phát hiện sau deadlock_timeout và hủy một transaction (SQLSTATE 40P01).
### Bằng chứng
Log nêu pid 18422 chờ transaction 99011 của 18439, còn 18439 chờ 99012 của 18422; câu UPDATE cho thấy hai tài nguyên ngược chiều.
### Khắc phục
- Mọi luồng cập nhật nhiều SKU khóa theo thứ tự ổn định (ví dụ sku tăng dần), trong một transaction.
- Bắt lỗi deadlock và retry toàn transaction giới hạn lần với backoff/jitter; không retry riêng câu lệnh giữa transaction đã aborted.
- Giữ transaction ngắn, index điều kiện UPDATE, theo dõi log_lock_waits/deadlock rate. Deadlock có thể xảy ra dù ứng dụng đúng; cần retry an toàn/idempotent.
> Senior tip: Thứ tự khóa toàn hệ thống là hợp đồng; một code path đảo thứ tự đủ tạo deadlock hiếm khó tái hiện.`,rubric:['Dựng đúng chu trình 18422↔18439 theo transaction IDs','Nêu deadlock detector hủy transaction với 40P01','Đề xuất thứ tự khóa nhất quán','Retry toàn transaction giới hạn và idempotent','Nêu monitoring và giảm transaction duration'],tags:['postgresql','deadlock','locking']},
{id:'lab-sql-008',category:'sql',title:'Bảng orders phình do autovacuum không theo kịp',level:'senior',scenario:`PostgreSQL 15 orders nhận 2.000 update/s từ trạng thái xử lý. Autovacuum chạy nhưng n_dead_tup tăng liên tục, index/table lớn và query chậm.`,artifacts:[{name:'pg_stat_user_tables.txt',lang:'text',content:`snapshot 2026-10-22 11:00 UTC, database=shop
relname | n_live_tup | n_dead_tup | last_autovacuum | autovacuum_count | n_mod_since_analyze
orders | 12000000 | 8400000 | 2026-10-22 10:52:01 | 144 | 2700000
pg_stat_activity: autovacuum worker active on orders since 10:52; wait_event=IO; query vacuum (to prevent wraparound) orders
long transaction xmin age=6400000 xid; oldest logical slot catalog_xmin age=6200000 xid; oldest replica slot restart_lsn lag=96GB (WAL retention metric)
table size=18GB; indexes=29GB; update rate=2000/s.`}],questions:['Nêu nguyên nhân khả năng cao và điều tra thêm.','Kế hoạch xử lý bloat an toàn, không làm mất dữ liệu.'],hints:['Dead tuples 8.4M; điều tra transaction xmin lâu và catalog_xmin của logical slot.','restart_lsn lag giữ WAL; chỉ xmin/catalog_xmin horizon mới trực tiếp giữ dead tuples.'],answer:`**Tóm tắt:** Bảng có 8.4 triệu dead tuples và vacuum có thể bị chặn bởi snapshot lâu hoặc catalog_xmin của logical replication slot. restart_lsn lag 96GB cho thấy WAL bị giữ lại, nhưng tự nó không chứng minh tuple bị giữ; cần kiểm tra xmin horizon.
### Đọc số liệu
pg_stat_user_tables báo 12M live, 8.4M dead; autovacuum vẫn active chờ IO. Transaction xmin age 6.4M xid và logical slot catalog_xmin age 6.2M xid là hai ứng viên giữ horizon cần xác minh. restart_lsn lag 96GB là vấn đề giữ WAL riêng, không đồng nghĩa với giữ dead tuples. VACUUM thường làm không gian tái sử dụng trong relation, không mặc định trả file về OS.
### Khắc phục
- Tìm transaction lâu và slot có catalog_xmin; xác nhận chủ sở hữu rồi kết thúc transaction hoặc khắc phục consumer an toàn. Xử lý restart_lsn/WAL lag riêng; tránh drop slot tùy tiện vì consumer có thể cần resync lớn.
- Giảm write amplification, tránh update cột indexed không cần thiết, batch update; đảm bảo autovacuum có I/O và worker phù hợp.
- Điều chỉnh per-table vacuum/analyze scale factor và cost limit theo tốc độ churn; kiểm tra n_dead_tup, vacuum progress, bloat và wraparound age.
- VACUUM thường không cần khóa độc quyền nhưng không compact file; cân nhắc pg_repack/maintenance window cho reclaim, có kiểm thử dung lượng và replica.
> Senior tip: Trước khi tuning autovacuum, kiểm tra xmin horizon và catalog_xmin của logical slots; restart_lsn lag chủ yếu giữ WAL, không tự nó chứng minh vacuum cleanup bị chặn.`,rubric:['Dẫn n_dead_tup 8.4M, autovacuum active/IO và table/index size','Nêu long xmin và catalog_xmin của slot logical có thể giữ dead tuple; phân biệt restart_lsn giữ WAL','Điều tra pg_stat_activity/slots trước khi xử lý','Tuning per-table theo churn, analyze, IO và giảm update amplification','Phân biệt vacuum reuse với reclaim OS; nêu pg_repack/maintenance thận trọng'],tags:['postgresql','autovacuum','bloat']},
{
  id: 'lab-sql-009',
  category: 'sql',
  title: 'Job đồng bộ đêm chạy 6,5 phút, chạy tay buổi sáng chỉ 3,5 giây: statistics cũ sau bulk load',
  level: 'senior',
  scenario: `**Bối cảnh.** Công ty giao vận **ShipNhanh** chạy {{shipment-sync}} (Spring Boot 3.3, JdbcTemplate) trên PostgreSQL **16.4** (RDS, 8 vCPU / 64 GB). Mỗi đêm lúc 01:00, job ETL dùng {{COPY}} nạp vận đơn mới của đối tác vào bảng {{shipment}} với {{status = 'PENDING_SYNC'}} và {{batch_id = yyyymmdd}}. Ngay khi ETL commit, {{shipment-sync}} chạy một câu SELECT join với bảng giá {{carrier_rate}} (2.140 dòng, chỉ có primary key trên {{id}}) để tính cước rồi đẩy sang hệ thống đối tác. SLA: phải xong trước **01:30**.

**Triệu chứng (đêm 28/10/2026).** Câu SELECT chạy **389 giây**, job xong lúc 01:31, trễ SLA, CPU RDS 100% một core suốt 6 phút. Sáng 08:12, DBA chạy lại đúng câu đó với cùng tham số: **3,5 giây**. Không ai đổi code hay index. Tuần trước cũng có 2 đêm bị như vậy, các đêm còn lại job xong trong 20 giây. Một bạn đề xuất "tăng {{work_mem}}", một bạn khác đề xuất "thêm {{pg_hint_plan}} ép Hash Join".

**Việc bạn có.** Log của PostgreSQL (có {{auto_explain}} với {{log_analyze = on}}, {{log_buffers = on}}), plan khi chạy lại buổi sáng, và các bảng thống kê. Hãy tìm nguyên nhân gốc và vì sao "chạy lại thì nhanh".`,
  artifacts: [
    {
      name: 'postgresql-2026-10-28.log',
      lang: 'text',
      content: `2026-10-28 01:00:03.118 +07 [40211] etl@shipnhanh LOG:  statement: COPY shipment (id, tracking_no, batch_id, carrier_id, zone_code, weight_g, status, created_at) FROM STDIN WITH (FORMAT csv)
2026-10-28 01:18:37.402 +07 [40211] etl@shipnhanh LOG:  duration: 1114284.117 ms  statement: COPY shipment ... (COPY 2398114)
2026-10-28 01:18:37.415 +07 [40211] etl@shipnhanh LOG:  statement: COMMIT
2026-10-28 01:18:41.006 +07 [41877] sync_app@shipnhanh LOG:  execute S_1: SELECT s.id, s.tracking_no, s.weight_g, r.price_per_kg FROM shipment s JOIN carrier_rate r ON r.carrier_id = s.carrier_id AND r.zone_code = s.zone_code WHERE s.batch_id = $1 AND s.status = $2
2026-10-28 01:18:41.006 +07 [41877] sync_app@shipnhanh DETAIL:  Parameters: $1 = '20261028', $2 = 'PENDING_SYNC'
2026-10-28 01:21:07.880 +07 [40533] LOG:  automatic analyze of table "shipnhanh.public.shipment"
        avg read rate: 41.204 MB/s, avg write rate: 0.000 MB/s
        buffer usage: 2210 hits, 27119 misses, 0 dirtied
        system usage: CPU: user: 1.84 s, system: 0.31 s, elapsed: 5.14 s
2026-10-28 01:25:10.617 +07 [41877] sync_app@shipnhanh LOG:  duration: 389611.442 ms  plan:
        Query Text: SELECT s.id, s.tracking_no, s.weight_g, r.price_per_kg FROM shipment s JOIN carrier_rate r ON r.carrier_id = s.carrier_id AND r.zone_code = s.zone_code WHERE s.batch_id = $1 AND s.status = $2
        Query Parameters: $1 = '20261028', $2 = 'PENDING_SYNC'
        Nested Loop  (cost=0.56..59.68 rows=1 width=52) (actual time=0.412..389204.877 rows=2398114 loops=1)
          Join Filter: ((s.carrier_id = r.carrier_id) AND ((s.zone_code)::text = (r.zone_code)::text))
          Rows Removed by Join Filter: 5129565846
          Buffers: shared hit=45707372 read=19842
          ->  Index Scan using idx_shipment_batch_status on shipment s  (cost=0.56..8.58 rows=1 width=44) (actual time=0.051..2930.774 rows=2398114 loops=1)
                Index Cond: ((batch_id = 20261028) AND ((status)::text = 'PENDING_SYNC'::text))
                Buffers: shared hit=2541320 read=19842
          ->  Seq Scan on carrier_rate r  (cost=0.00..39.40 rows=2140 width=16) (actual time=0.002..0.071 rows=2140 loops=2398114)
                Buffers: shared hit=43166052
2026-10-28 01:31:02.551 +07 [41877] sync_app@shipnhanh LOG:  statement: COMMIT`,
    },
    {
      name: 'explain-rerun-0812.txt',
      lang: 'text',
      content: `-- psql 16.4, chạy tay trên primary, 2026-10-28 08:12:30 +07 (cùng tham số với job đêm qua)
shipnhanh=> EXPLAIN (ANALYZE, BUFFERS)
SELECT s.id, s.tracking_no, s.weight_g, r.price_per_kg
FROM shipment s
JOIN carrier_rate r ON r.carrier_id = s.carrier_id AND r.zone_code = s.zone_code
WHERE s.batch_id = 20261028 AND s.status = 'PENDING_SYNC';
                                                          QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------------
 Hash Join  (cost=66.15..412873.40 rows=319412 width=52) (actual time=1.204..3412.580 rows=2398114 loops=1)
   Hash Cond: ((s.carrier_id = r.carrier_id) AND ((s.zone_code)::text = (r.zone_code)::text))
   Buffers: shared hit=2561180
   ->  Index Scan using idx_shipment_batch_status on shipment s  (cost=0.56..401987.12 rows=319412 width=44) (actual time=0.038..2101.733 rows=2398114 loops=1)
         Index Cond: ((batch_id = 20261028) AND ((status)::text = 'PENDING_SYNC'::text))
         Buffers: shared hit=2561162
   ->  Hash  (cost=39.40..39.40 rows=2140 width=16) (actual time=1.102..1.103 rows=2140 loops=1)
         Buckets: 4096  Batches: 1  Memory Usage: 133kB
         Buffers: shared hit=18
         ->  Seq Scan on carrier_rate r  (cost=0.00..39.40 rows=2140 width=16) (actual time=0.009..0.412 rows=2140 loops=1)
               Buffers: shared hit=18
 Planning:
   Buffers: shared hit=24
 Planning Time: 0.611 ms
 Execution Time: 3498.115 ms
(15 rows)

-- Ghi chú DBA: rows ước lượng 319412, thực tế 2398114 (vẫn lệch ~7,5 lần) nhưng plan đã hợp lý.`,
    },
    {
      name: 'stats-snapshot.txt',
      lang: 'text',
      content: `-- (A) cron giám sát chụp lúc 2026-10-28 01:18:50 +07 (13 giây sau khi ETL commit)
shipnhanh=> SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze
            FROM pg_stat_user_tables WHERE relname = 'shipment';
 relname  | n_live_tup | n_mod_since_analyze | last_analyze |       last_autoanalyze
----------+------------+---------------------+--------------+-------------------------------
 shipment |   18002334 |             2398114 |              | 2026-10-25 02:14:51.203+07

shipnhanh=> SELECT reltuples::bigint FROM pg_class WHERE relname = 'shipment';
 reltuples
-----------
  15604220

shipnhanh=> SELECT attname, n_distinct, most_common_vals, most_common_freqs
            FROM pg_stats WHERE tablename = 'shipment' AND attname = 'status';
 attname | n_distinct |          most_common_vals           |       most_common_freqs
---------+------------+-------------------------------------+-------------------------------
 status  |          4 | {SYNCED,DELIVERED,CANCELLED,RETURNED} | {0.7104,0.2512,0.0297,0.0087}

shipnhanh=> SELECT histogram_bounds FROM pg_stats WHERE tablename = 'shipment' AND attname = 'batch_id';
-- (rút gọn) {20230101, ..., 20261019, 20261022, 20261024}

-- (B) cấu hình liên quan
autovacuum_naptime = 1min
autovacuum_max_workers = 3
autovacuum_analyze_threshold = 50
autovacuum_analyze_scale_factor = 0.1
default_statistics_target = 100
-- 01:00-01:21 cả 3 autovacuum worker đang bận VACUUM shipment_event (410 GB) và tracking_log (95 GB)

-- (C) \\d carrier_rate
--   id bigint PK, carrier_id int, zone_code varchar(8), price_per_kg numeric(12,2)
--   Indexes: "carrier_rate_pkey" PRIMARY KEY, btree (id)    (không có index trên (carrier_id, zone_code))
-- (D) \\d shipment: "idx_shipment_batch_status" btree (batch_id, status)`,
    },
  ],
  questions: [
    'Vì sao planner chọn Nested Loop cho 2,4 triệu dòng? Chỉ ra con số ước lượng sai trong plan và giải thích nó đến từ đâu (dựa vào snapshot thống kê).',
    'Vì sao chạy lại lúc 08:12 lại nhanh? Vì sao ngay cả sau ANALYZE, ước lượng vẫn lệch 7,5 lần?',
    'Bạn sửa thế nào để đêm nào cũng ổn định? Đánh giá hai đề xuất tăng work_mem và pg_hint_plan.',
  ],
  hints: [
    'So sánh rows=1 (ước lượng) với rows=2398114 (thực tế) ở node Index Scan on shipment. Rồi nhìn loops=2398114 ở Seq Scan on carrier_rate.',
    'Trong snapshot (A): n_mod_since_analyze, last_autoanalyze, và most_common_vals của status có giá trị PENDING_SYNC không? Autoanalyze chạy lúc mấy giờ, câu SELECT bắt đầu lúc mấy giờ?',
    'Planner nhân selectivity của từng điều kiện như thể chúng độc lập. batch_id mới và status PENDING_SYNC có độc lập không? Tìm hiểu CREATE STATISTICS ... (dependencies).',
  ],
  answer: `**Tóm tắt:** ETL vừa nạp 2,4 triệu dòng mới nhưng câu SELECT bắt đầu chỉ 4 giây sau commit, khi statistics vẫn là của 3 ngày trước: trong statistics, {{status = 'PENDING_SYNC'}} gần như không tồn tại và {{batch_id = 20261028}} nằm ngoài histogram, nên planner ước lượng **1 dòng** và chọn Nested Loop với Seq Scan bảng giá ở vòng trong. Thực tế có 2.398.114 dòng nên bảng giá bị quét lại 2,4 triệu lần (5,1 tỉ phép so sánh). Sáng ra autoanalyze đã chạy nên plan đổi sang Hash Join. Sửa: chạy {{ANALYZE shipment}} ngay trong ETL trước khi commit/báo hiệu, thêm extended statistics cho cặp cột tương quan, và thêm index {{(carrier_id, zone_code)}} cho bảng giá làm lưới an toàn.

### Kiến thức nền: planner "đoán" số dòng như thế nào
PostgreSQL không đếm dữ liệu trước khi chạy. Nó dùng **cost-based optimizer**: với mỗi plan có thể (Nested Loop, Hash Join, Merge Join…), nó ước lượng chi phí dựa trên **số dòng dự kiến** của từng bước, rồi chọn plan rẻ nhất. Số dòng dự kiến lấy từ bảng thống kê {{pg_statistic}} (xem qua view {{pg_stats}}), do lệnh {{ANALYZE}} tạo ra bằng cách **lấy mẫu** 300 × {{default_statistics_target}} = 30.000 dòng.

Giống như đi chợ: bạn nhớ "tuần trước nhà có 4 người ăn" nên mua 1 kg thịt. Hôm nay có 30 khách đến mà bạn không cập nhật thông tin, bạn vẫn mua 1 kg. Plan cũng vậy: đúng với dữ liệu cũ, thảm họa với dữ liệu mới.

Các thống kê chính:
| Thống kê | Ý nghĩa | Dùng khi |
|---|---|---|
| {{reltuples}} | tổng số dòng ước lượng | mọi ước lượng |
| {{most_common_vals/freqs}} (MCV) | các giá trị phổ biến và tần suất | điều kiện {{=}} |
| {{histogram_bounds}} | phân bố các giá trị còn lại | điều kiện {{<}}, {{>}}, BETWEEN |
| {{n_distinct}} | số giá trị khác nhau | {{=}} với giá trị không trong MCV, GROUP BY |

### Nguyên nhân gốc, từng bước
1. **01:18:37** ETL commit 2.398.114 dòng mới, tất cả có {{status = 'PENDING_SYNC'}}, {{batch_id = 20261028}}.
2. **01:18:41** (4 giây sau) job chạy SELECT. Statistics lúc này vẫn của lần autoanalyze **25/10**: MCV của {{status}} chỉ có {{SYNCED, DELIVERED, CANCELLED, RETURNED}} với tần suất cộng lại = 1,0. Theo statistics, không còn chỗ cho giá trị nào khác, nên selectivity của {{PENDING_SYNC}} ≈ 0. {{batch_id = 20261028}} cũng lớn hơn biên trên histogram (20261024), nên cũng bị đoán rất nhỏ. Nhân hai selectivity nhỏ → ước lượng bị kẹp về mức tối thiểu **rows=1**.
3. Với "1 dòng" ở vòng ngoài, Nested Loop là rẻ nhất: "quét bảng giá 2.140 dòng một lần, so sánh, xong". Không cần dựng hash table. Chi phí ước lượng của cả câu chỉ **59,68**.
4. Thực tế vòng ngoài trả 2.398.114 dòng, nên vòng trong (Seq Scan carrier_rate) chạy **2.398.114 lần**, mỗi lần đọc 2.140 dòng và loại 2.139 dòng: 2.398.114 × 2.139 = **5.129.565.846** dòng bị Join Filter loại. Không có index trên {{(carrier_id, zone_code)}} nên mỗi vòng là quét toàn bảng.
5. **01:21:07** autoanalyze mới chạy (3 worker bận vacuum hai bảng lớn khác). Nhưng plan của câu đang chạy đã chốt từ 01:18:41: **plan không đổi giữa chừng**, nên câu vẫn chạy tiếp đến 01:25:10.
6. **08:12** chạy lại: statistics đã mới, ước lượng 319.412 dòng → planner chọn Hash Join: đọc bảng giá **1 lần**, dựng hash table 133 kB, rồi mỗi dòng shipment chỉ tra hash O(1). 3,5 giây.

~~~text
Nested Loop (statistics cũ)                Hash Join (statistics mới)
for s in shipment(2.398.114 dòng):         h = hash(carrier_rate)   -- 1 lần, 2.140 dòng
   for r in carrier_rate(2.140 dòng):      for s in shipment(2.398.114 dòng):
      if match: emit                          r = h.get(s.carrier_id, s.zone_code)
=> 5,13 tỉ phép so sánh, 389 s            => 2,4 triệu lần tra hash, 3,5 s
~~~

**Vì sao các đêm khác không bị?** Đó là "race": nếu autoanalyze kịp chạy trước khi job bắt đầu (worker rảnh), plan đúng. Đêm 28/10 cả 3 autovacuum worker đang bận, analyze trễ gần 3 phút. Ngưỡng tự analyze là 50 + 0,1 × 15.604.220 = 1.560.472 thay đổi, nên 2,4 triệu dòng mới **có** vượt ngưỡng, chỉ là autovacuum chạy **bất đồng bộ**, không đảm bảo "ngay sau commit".

### Vì sao sau ANALYZE vẫn lệch 7,5 lần
Planner giả định các điều kiện **độc lập** và nhân selectivity: sel(batch_id = 20261028) ≈ 2,4/18,0 = 0,133 và sel(status = PENDING_SYNC) ≈ 0,133 → 0,133 × 0,133 × 18.002.334 ≈ **319 nghìn**. Nhưng hai cột **tương quan hoàn toàn**: mọi dòng của batch mới đều PENDING_SYNC. Thực tế là 2,4 triệu. Đêm nay lệch 7,5 lần vẫn chọn đúng Hash Join, nhưng với bảng lớn hơn hoặc batch nhỏ hơn có thể lại lật plan. Cách báo cho planner biết:
~~~sql
-- Thống kê nhiều cột: planner học được "biết batch_id thì gần như biết status"
CREATE STATISTICS shipment_batch_status_dep (dependencies)
  ON batch_id, status FROM shipment;
ANALYZE shipment;   -- extended statistics chỉ có dữ liệu sau ANALYZE
~~~

### Dẫn chứng
- Log 01:25:10: **"Nested Loop (cost=0.56..59.68 rows=1 ...) (actual ... rows=2398114 loops=1)"**: ước lượng 1, thực tế 2,4 triệu.
- **"Seq Scan on carrier_rate r ... loops=2398114"** và **"Rows Removed by Join Filter: 5129565846"**: bảng giá bị quét lại 2,4 triệu lần. **"Buffers: shared hit=43166052"** = 18 page × 2.398.114 lần: toàn bộ từ RAM, nên vấn đề là CPU, không phải I/O (khớp CPU 100% một core).
- Timeline: COMMIT **01:18:37.415**, SELECT bắt đầu **01:18:41.006**, autoanalyze **01:21:07**, câu kết thúc **01:25:10** (01:18:41 + 389,6 s).
- Snapshot (A): {{n_mod_since_analyze = 2398114}}, {{last_autoanalyze = 2026-10-25}}, {{reltuples = 15604220}} trong khi {{n_live_tup = 18002334}}; MCV của status không có PENDING_SYNC; histogram batch_id dừng ở 20261024.
- Plan 08:12: **Hash Join**, Seq Scan carrier_rate **loops=1**, Execution Time **3498 ms**; rows ước lượng 319412 vs thực tế 2398114.

### Cách sửa
**Ngắn hạn (đêm nay):**
- Thêm bước {{ANALYZE shipment;}} vào cuối ETL, **trước** khi báo cho {{shipment-sync}} chạy. ANALYZE chỉ lấy mẫu 30.000 dòng, log cho thấy mất khoảng 5 giây: rẻ hơn rất nhiều so với 6 phút rủi ro.
- Thêm index cho bảng giá: {{CREATE INDEX CONCURRENTLY idx_carrier_rate_carrier_zone ON carrier_rate (carrier_id, zone_code);}}. Kể cả khi planner lại đoán sai và chọn Nested Loop, vòng trong sẽ là Index Scan (vài micro giây mỗi lần) thay vì quét 2.140 dòng. Đây là "giảm thiệt hại khi đoán sai".

**Dài hạn:**
- {{CREATE STATISTICS ... (dependencies)}} cho {{(batch_id, status)}} như trên.
- Tách bảng staging: COPY vào {{shipment_staging}} (hoặc partition theo {{batch_id}}/ngày), ANALYZE riêng bảng nhỏ đó, xử lý xong mới gộp. Với partition theo ngày, partition mới tinh luôn cần ANALYZE ngay sau khi nạp (autovacuum không tự analyze bảng cha partitioned).
- Tuning autovacuum cho bảng này: {{ALTER TABLE shipment SET (autovacuum_analyze_scale_factor = 0.02);}} và tăng {{autovacuum_max_workers}} nếu IO cho phép. Nhưng đừng dựa vào autovacuum cho luồng "nạp xong chạy ngay", vì nó luôn bất đồng bộ.

**Về hai đề xuất:**
- **Tăng work_mem:** vô ích. Plan xấu không do thiếu bộ nhớ (Hash chỉ cần 133 kB, không spill). Vấn đề là ước lượng sai.
- **pg_hint_plan ép Hash Join:** chữa triệu chứng, khoá cứng plan. Khi dữ liệu đổi (batch rất nhỏ), Hash Join có thể lại là lựa chọn kém, và extension phải cài, bảo trì. Sửa gốc (statistics đúng) tốt hơn.

### Phòng ngừa và monitoring
- Bật {{auto_explain}} với {{log_min_duration}} hợp lý (như ở đây, nhờ nó mới có plan đêm qua). Đặc biệt soi **tỉ lệ rows thực tế / rows ước lượng > 10 lần** ở mọi node.
- Alert khi {{n_mod_since_analyze / reltuples}} > 10% trên bảng nóng.
- {{statement_timeout}} cho role job (ví dụ 120 s) để plan xấu không chiếm DB 6 phút; job retry sau khi ANALYZE.

### Lỗi hay gặp
- Nghĩ "đã có autovacuum thì statistics luôn mới": autovacuum có độ trễ (naptime, số worker, bảng lớn khác).
- Chạy lại thấy nhanh rồi kết luận "do DB lúc đó bận": thực ra plan đã khác. Luôn so plan, không so thời gian.
- Chỉ tạo index cho bảng lớn, bỏ quên bảng nhỏ ở vòng trong Nested Loop.
- Tạo CREATE STATISTICS nhưng quên ANALYZE nên không có tác dụng.

### Trả lời miệng 1 phút
"Plan đêm qua là Nested Loop với ước lượng 1 dòng nhưng thực tế 2,4 triệu, nên bảng giá bị quét lại 2,4 triệu lần, 5 tỉ phép so sánh. Ước lượng sai vì job chạy 4 giây sau khi ETL nạp xong, statistics còn của 3 ngày trước: PENDING_SYNC không có trong MCV, batch_id mới nằm ngoài histogram. Autoanalyze chạy lúc 01:21, sau khi plan đã chốt, nên sáng chạy lại thì Hash Join, 3,5 giây. Tôi sẽ ANALYZE ngay trong ETL, thêm extended statistics cho cặp batch_id/status vì chúng tương quan, thêm index (carrier_id, zone_code) cho bảng giá để nếu đoán sai thì vẫn không thảm họa, và theo dõi tỉ lệ rows thực tế/ước lượng bằng auto_explain."

> Senior tip: Mẫu "job batch chạy ngay sau bulk load thì chậm, chạy lại thì nhanh" gặp rất nhiều trong data pipeline. Quy tắc của tôi: **mọi bước nạp dữ liệu lớn (> 10% bảng) phải kết thúc bằng ANALYZE tường minh**, giống như flush cache. Và khi đọc EXPLAIN ANALYZE, việc đầu tiên không phải là tìm Seq Scan mà là tìm node có **rows ước lượng lệch thực tế nhiều bậc**: gần như mọi plan tệ bắt nguồn từ đó.`,
  rubric: [
    'Chỉ ra ước lượng rows=1 so với thực tế 2.398.114 khiến planner chọn Nested Loop, vòng trong Seq Scan carrier_rate chạy 2.398.114 lần (Rows Removed by Join Filter 5,1 tỉ)',
    'Giải thích statistics cũ: autoanalyze cuối 25/10, PENDING_SYNC không có trong MCV, batch_id ngoài histogram; SELECT chạy 4 giây sau commit, autoanalyze 01:21 sau khi plan đã chốt',
    'Giải thích vì sao chạy lại nhanh (statistics mới → Hash Join) và vì sao vẫn lệch 7,5 lần (giả định độc lập, cột tương quan → CREATE STATISTICS dependencies)',
    'Đề xuất sửa: ANALYZE tường minh trong ETL, extended statistics, index (carrier_id, zone_code) làm lưới an toàn, statement_timeout',
    'Phản biện đúng work_mem và pg_hint_plan; nêu monitoring auto_explain/tỉ lệ estimate vs actual',
  ],
  tags: ['postgresql', 'explain', 'statistics', 'analyze', 'nested-loop', 'extended-statistics'],
},
{
  id: 'lab-sql-010',
  category: 'sql',
  title: 'Chỉ khách hàng lớn nhất bị chậm 11 giây, psql chạy lại thì 40 ms: generic plan của prepared statement',
  level: 'lead',
  scenario: `**Bối cảnh.** SaaS hoá đơn điện tử **EInvoice** (multi-tenant, một database chung) chạy {{invoice-api}} gồm 12 pod Spring Boot 3.3, Spring Data JPA (Hibernate 6.4), driver pgjdbc 42.7 (mặc định {{prepareThreshold=5}}), HikariCP 30 connection mỗi pod, PostgreSQL **16.3**. Bảng {{invoice}} có **60 triệu** dòng của khoảng 4.200 tenant. Dữ liệu **lệch rất mạnh**: tenant 7 (chuỗi siêu thị **MegaMart**) chiếm **35%** bảng (21 triệu dòng); 90% tenant có dưới 10 nghìn hoá đơn.

Màn hình "Hoá đơn chưa thanh toán" gọi:
~~~sql
SELECT id, number, amount, due_date FROM invoice
WHERE tenant_id = ? AND status = 'OPEN'
ORDER BY due_date LIMIT 50;
~~~

**Triệu chứng.** Sau mỗi lần deploy hoặc restart, mọi tenant đều nhanh. Khoảng 5–10 phút sau, **riêng MegaMart** bị chậm 9–12 giây (timeout gateway 10 s), các tenant khác vẫn dưới 50 ms. DBA copy câu SQL vào psql với {{tenant_id = 7}}: **38 ms**, không tái hiện được. Đội đã thử restart pod: đỡ được 10 phút rồi lại chậm.

**Việc bạn có.** Log auto_explain từ production, kết quả thử nghiệm của DBA trong psql, thống kê bảng và metric theo thời gian.`,
  artifacts: [
    {
      name: 'auto-explain-prod.log',
      lang: 'text',
      content: `2026-10-27 10:09:44.802 +07 [77120] invoice_app@einvoice LOG:  duration: 11842.309 ms  plan:
        Query Text: select i1_0.id,i1_0.number,i1_0.amount,i1_0.due_date from invoice i1_0 where i1_0.tenant_id=$1 and i1_0.status='OPEN' order by i1_0.due_date fetch first $2 rows only
        Query Parameters: $1 = '7', $2 = '50'
        Limit  (cost=6874.21..6874.33 rows=50 width=40) (actual time=11841.977..11841.990 rows=50 loops=1)
          Buffers: shared hit=402118 read=611904
          ->  Sort  (cost=6874.21..6878.50 rows=1716 width=40) (actual time=11841.975..11841.982 rows=50 loops=1)
                Sort Key: due_date
                Sort Method: top-N heapsort  Memory: 31kB
                Buffers: shared hit=402118 read=611904
                ->  Bitmap Heap Scan on invoice i1_0  (cost=161.14..6817.27 rows=1716 width=40) (actual time=902.418..11502.661 rows=2522117 loops=1)
                      Recheck Cond: (tenant_id = $1)
                      Rows Removed by Index Recheck: 6120488
                      Filter: ((status)::text = 'OPEN'::text)
                      Rows Removed by Filter: 18482260
                      Heap Blocks: exact=183301 lossy=812677
                      Buffers: shared hit=402118 read=611904
                      ->  Bitmap Index Scan on idx_invoice_tenant  (cost=0.00..160.71 rows=14286 width=0) (actual time=889.204..889.204 rows=21004377 loops=1)
                            Index Cond: (tenant_id = $1)
                            Buffers: shared read=18140
2026-10-27 10:09:45.113 +07 [77134] invoice_app@einvoice LOG:  duration: 512.004 ms  plan:
        Query Text: (cùng câu trên)
        Query Parameters: $1 = '7', $2 = '50'
        ... (cùng plan Bitmap Heap Scan, lần này phần lớn page đã nằm trong shared buffers)`,
    },
    {
      name: 'dba-psql-test.txt',
      lang: 'text',
      content: `-- psql 16.3, 2026-10-27 10:30 +07
-- (1) Literal: planner thấy giá trị 7 ngay lúc lập plan (custom plan)
einvoice=> EXPLAIN (ANALYZE, BUFFERS)
SELECT id, number, amount, due_date FROM invoice
WHERE tenant_id = 7 AND status = 'OPEN' ORDER BY due_date LIMIT 50;
 Limit  (cost=0.56..420.31 rows=50 width=40) (actual time=0.061..37.702 rows=50 loops=1)
   Buffers: shared hit=4180
   ->  Index Scan using idx_invoice_due_date on invoice  (cost=0.56..21180332.14 rows=2522994 width=40) (actual time=0.060..37.689 rows=50 loops=1)
         Filter: ((tenant_id = 7) AND ((status)::text = 'OPEN'::text))
         Rows Removed by Filter: 4127
         Buffers: shared hit=4180
 Planning Time: 0.402 ms
 Execution Time: 37.751 ms

-- (2) Mô phỏng prepared statement như JDBC, ép generic plan
einvoice=> PREPARE q(bigint) AS SELECT id, number, amount, due_date FROM invoice
           WHERE tenant_id = $1 AND status = 'OPEN' ORDER BY due_date LIMIT 50;
einvoice=> SET plan_cache_mode = force_generic_plan;
einvoice=> EXPLAIN EXECUTE q(7);
 Limit  (cost=6874.21..6874.33 rows=50 width=40)
   ->  Sort  (cost=6874.21..6878.50 rows=1716 width=40)
         Sort Key: due_date
         ->  Bitmap Heap Scan on invoice  (cost=161.14..6817.27 rows=1716 width=40)
               Recheck Cond: (tenant_id = $1)
               Filter: ((status)::text = 'OPEN'::text)
               ->  Bitmap Index Scan on idx_invoice_tenant  (cost=0.00..160.71 rows=14286 width=0)
                     Index Cond: (tenant_id = $1)
einvoice=> SET plan_cache_mode = force_custom_plan;
einvoice=> EXPLAIN EXECUTE q(7);
 Limit  (cost=0.56..420.31 rows=50 width=40)
   ->  Index Scan using idx_invoice_due_date on invoice  (cost=0.56..21180332.14 rows=2522994 width=40)
         Filter: ((tenant_id = 7) AND ((status)::text = 'OPEN'::text))

-- (3) Tenant nhỏ 3105 (6.200 hoá đơn) với generic plan: 1.9 ms. Với custom plan: 1.7 ms.`,
    },
    {
      name: 'stats-and-metrics.txt',
      lang: 'text',
      content: `-- pg_class / pg_stats (ANALYZE gần nhất 2026-10-27 03:10)
 reltuples = 60004118
 tenant_id: n_distinct = 4200 ; most_common_vals = {7,112,58,...} ; most_common_freqs = {0.3501,0.0212,0.0174,...}
 status:    most_common_vals = {PAID,OPEN,CANCELLED} ; most_common_freqs = {0.8612,0.1201,0.0187}
 Indexes:
   "invoice_pkey" PRIMARY KEY, btree (id)
   "idx_invoice_tenant" btree (tenant_id)
   "idx_invoice_due_date" btree (due_date)
 work_mem = 4MB

-- pgjdbc / Hikari
 prepareThreshold = 5 (mặc định), preparedStatementCacheQueries = 256 (mặc định)
 Hikari maximumPoolSize = 30, 12 pod  =>  360 connection

-- Prometheus: histogram_quantile(0.99, sum by (le, tenant) (rate(http_server_requests_seconds_bucket{uri="/api/invoices/open"}[1m])))
 time   | event                 | p99 tenant=7 | p99 tenant=112 | p99 các tenant khác
 10:02  | rolling restart xong  | 0.041 s      | 0.019 s        | 0.008 s
 10:05  |                       | 0.044 s      | 0.020 s        | 0.008 s
 10:07  |                       | 6.9 s        | 0.020 s        | 0.008 s
 10:09  |                       | 11.8 s       | 0.021 s        | 0.007 s
 10:15  |                       | 10.0 s (504) | 0.022 s        | 0.007 s
-- request rate: ~40 req/s toàn hệ thống trên endpoint này, tenant 7 chiếm 6 req/s`,
    },
  ],
  questions: [
    'Vì sao cùng một câu SQL và tham số 7, production chạy 11,8 giây còn psql chỉ 38 ms? Giải thích cơ chế custom plan / generic plan và vai trò của pgjdbc prepareThreshold.',
    'Vì sao generic plan được chọn dù nó rất tệ với tenant 7, và vì sao lỗi chỉ xuất hiện 5–10 phút sau restart?',
    'Đề xuất cách sửa (ngắn hạn và dài hạn) để mọi tenant, lớn hay nhỏ, đều nhanh. So sánh ít nhất 3 phương án.',
  ],
  hints: [
    'So plan trong auto_explain với plan (1) của DBA: điều kiện là "tenant_id = $1" hay "tenant_id = 7"? Index nào được dùng?',
    'Generic plan không biết giá trị $1 nên phải dùng một ước lượng "trung bình": 60.004.118 / n_distinct 4200 ≈ 14.286 dòng. Tenant 7 thật ra có 21 triệu.',
    'PostgreSQL lập custom plan cho 5 lần EXECUTE đầu, sau đó so chi phí generic với trung bình custom. pgjdbc chỉ dùng server-side prepared statement từ lần thứ 5 trên cùng connection. Index (tenant_id, status, due_date) làm cho cả hai loại plan đều tốt.',
  ],
  answer: `**Tóm tắt:** Production chạy câu dưới dạng **prepared statement**; sau vài lần thực thi trên mỗi connection, PostgreSQL chuyển sang **generic plan** (một plan dùng chung cho mọi giá trị {{$1}}), được tối ưu cho tenant "trung bình" ~14 nghìn dòng: lấy hết hoá đơn của tenant rồi sort. Với MegaMart (21 triệu dòng), plan này đọc 1 triệu page, mất 11,8 giây. psql dùng literal nên luôn có **custom plan** thấy giá trị 7 và chọn đi theo index {{due_date}}, 38 ms. Sửa gốc bằng index {{(tenant_id, status, due_date)}} (hoặc partial index {{WHERE status = 'OPEN'}}) để một plan duy nhất tốt cho mọi tenant; ngắn hạn có thể đặt {{plan_cache_mode = force_custom_plan}} cho role ứng dụng.

### Kiến thức nền: prepared statement, custom plan và generic plan
Mỗi câu SQL phải qua: parse → rewrite → **plan** (chọn cách chạy) → execute. Lập plan tốn thời gian (thường 0,1–5 ms), nên prepared statement cho phép **lập plan một lần, chạy nhiều lần**.

PostgreSQL có hai loại plan cho prepared statement:
| | Custom plan | Generic plan |
|---|---|---|
| Lập khi nào | mỗi lần EXECUTE, **biết** giá trị tham số | một lần, **không biết** giá trị |
| Ước lượng | dùng MCV: tenant 7 → 35% bảng | dùng trung bình: 1 / n_distinct |
| Chi phí lập plan | mỗi lần | được cache, gần như 0 |
| Rủi ro | tốn CPU planner | sai nặng khi dữ liệu lệch (skew) |

Thuật toán mặc định ({{plan_cache_mode = auto}}): **5 lần EXECUTE đầu** luôn dùng custom plan. Từ lần thứ 6, PostgreSQL lập generic plan và so **chi phí ước lượng** của nó với **chi phí trung bình của 5 custom plan** (cộng chi phí lập plan). Nếu generic không đắt hơn đáng kể, nó dùng generic **mãi mãi** cho prepared statement đó trên connection đó.

Lớp thứ hai là driver: pgjdbc mặc định {{prepareThreshold=5}}: 4 lần đầu một PreparedStatement chạy dưới dạng unnamed statement (luôn được lập plan lại như custom), từ lần thứ 5 mới tạo **server-side named prepared statement**. Ghép hai lớp lại: trên mỗi connection, khoảng lần thực thi thứ 10 trở đi câu này có thể chuyển sang generic plan.

### Nguyên nhân gốc, từng bước
1. Sau restart, 360 connection mới, mọi câu đều custom plan → tenant 7 dùng index {{due_date}}: duyệt theo thứ tự hạn thanh toán, lọc tenant 7 + OPEN, vì tenant 7 chiếm 35% bảng nên chỉ cần đọc ~4.177 dòng là đủ 50 dòng. Nhanh.
2. Đa số lần gọi là tenant nhỏ. Custom plan của tenant nhỏ: bitmap trên {{idx_invoice_tenant}} rồi sort vài nghìn dòng, chi phí thấp (~vài nghìn).
3. Sau ~10 lần trên một connection, PostgreSQL thử generic plan: {{tenant_id = $1}} được ước lượng **60.004.118 / 4200 ≈ 14.286** dòng (khớp {{rows=14286}} trong Bitmap Index Scan), nhân 0,12 của OPEN → **1.716** dòng. Chi phí 6.874, gần với trung bình custom plan của tenant nhỏ → PostgreSQL chọn generic.
4. Request tiếp theo của tenant 7 rơi vào connection đó: generic plan lấy toàn bộ **21.004.377** entry của tenant 7 từ index, bitmap vượt {{work_mem = 4MB}} nên thành **lossy** (812.677 block lossy, phải recheck 6.120.488 dòng), đọc ~1 triệu page (hit 402.118 + read 611.904), lọc bỏ 18.482.260 dòng không OPEN, còn 2.522.117 dòng rồi sort lấy 50. 11,8 giây.
5. Vì mỗi connection tự chuyển sang generic theo nhịp riêng, sau 5–10 phút hầu hết 360 connection đã "lật", nên MegaMart chậm gần như mọi request. Restart xoá plan cache → nhanh lại, rồi lặp.

~~~text
Generic plan cho tenant 7:
idx_invoice_tenant ──> 21.004.377 TID ──> bitmap (lossy, work_mem 4MB)
   ──> đọc ~1.000.000 page heap ──> filter OPEN ──> 2.522.117 dòng ──> top-N sort ──> 50
Custom plan cho tenant 7:
idx_invoice_due_date (đã sắp xếp) ──> đọc 4.177 dòng, lọc ──> đủ 50 dòng thì DỪNG (nhờ LIMIT)
~~~

### Dẫn chứng
- auto_explain: **"Recheck Cond: (tenant_id = $1)"** và **"Index Cond: (tenant_id = $1)"**: tham số chưa được thay vào lúc lập plan → generic plan. Ước lượng **rows=14286** so với thực tế **rows=21004377** (lệch 1.470 lần).
- **"Heap Blocks: exact=183301 lossy=812677"**, **"Rows Removed by Filter: 18482260"**, **"Buffers: shared hit=402118 read=611904"**, **"duration: 11842.309 ms"**.
- psql (1): literal 7 → **Index Scan using idx_invoice_due_date**, **Rows Removed by Filter: 4127**, **37.751 ms**. psql (2): {{force_generic_plan}} tái hiện **chính xác** plan production (cost 6874.21, rows=1716), còn {{force_custom_plan}} cho lại plan nhanh: chứng minh nguyên nhân là loại plan, không phải tải hay cache.
- Thống kê: tenant 7 có freq **0.3501** trong MCV, n_distinct **4200**; 60.004.118 / 4200 = 14.286.
- Metric: 10:02 restart, p99 tenant 7 là 41 ms; 10:07 nhảy lên 6,9 s; tenant khác không đổi.

### Cách sửa
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Index {{(tenant_id, status, due_date)}} | Một plan tốt cho mọi tenant, kể cả generic: Index Scan theo đúng thứ tự, đọc đúng 50 dòng | Tốn dung lượng, ghi chậm hơn một chút |
| Partial index {{(tenant_id, due_date) WHERE status = 'OPEN'}} | Nhỏ hơn nhiều (chỉ 12% dòng) | Chỉ phục vụ câu có {{status = 'OPEN'}} literal |
| {{ALTER ROLE invoice_app SET plan_cache_mode = force_custom_plan}} | Không cần deploy, hiệu lực cho connection mới | Mọi câu đều tốn planning mỗi lần, CPU tăng; che giấu thiếu index |
| pgjdbc {{prepareThreshold=0}} | Không bao giờ dùng named statement | Mất lợi ích prepared cho mọi câu; dễ quên vì sao |
| Tách tenant lớn (partition theo tenant, DB riêng) | Cô lập noisy neighbor | Lớn, thay đổi kiến trúc |

**Ngắn hạn (hôm nay):** {{CREATE INDEX CONCURRENTLY idx_invoice_tenant_open_due ON invoice (tenant_id, due_date) WHERE status = 'OPEN';}} (không khoá ghi). Trong lúc chờ index build, đặt {{plan_cache_mode = force_custom_plan}} cho role ứng dụng rồi rotate connection (Hikari {{softEvictConnections}} qua JMX, hoặc rolling restart) để áp dụng.

**Dài hạn:** quy tắc thiết kế index cho multi-tenant: **cột đầu tiên luôn là tenant_id, sau đó là cột filter bằng, cuối cùng là cột ORDER BY**. Với query có LIMIT, index đúng thứ tự giúp dừng sớm thay vì sort hàng triệu dòng. Theo dõi tenant lớn bằng metric gắn nhãn tenant (top-N tenant), test hiệu năng với dữ liệu lệch.

### Phòng ngừa
- auto_explain với {{log_parameter_max_length}} (PostgreSQL 16+) để thấy tham số; dấu hiệu nhận biết generic plan là {{$1}} trong Index Cond.
- Khi tái hiện trong psql, **luôn thử thêm PREPARE + force_generic_plan**, không chỉ literal.
- Dashboard p99 theo tenant: trung bình toàn hệ thống (8 ms) che mất một tenant 11 giây.

### Lỗi hay gặp
- "psql nhanh mà app chậm → do network/app": thật ra plan khác nhau.
- Restart để chữa: chỉ reset plan cache, lỗi quay lại sau vài phút.
- Tăng {{work_mem}}: bớt lossy, nhanh hơn chút nhưng vẫn đọc 21 triệu dòng.
- Nghĩ Hibernate tự "inline" tham số: Hibernate luôn bind tham số qua PreparedStatement.

### Trả lời miệng 1 phút
"Production dùng prepared statement. Sau khoảng 10 lần trên mỗi connection, PostgreSQL chuyển sang generic plan vì chi phí ước lượng tương đương custom plan của các tenant nhỏ. Generic plan không biết tenant_id nên đoán 14 nghìn dòng, chọn bitmap theo tenant rồi sort. Với MegaMart có 21 triệu dòng, plan đó đọc 1 triệu page, 11,8 giây. psql dùng literal nên có custom plan đi theo index due_date và dừng sớm sau 50 dòng. Tôi xác nhận bằng PREPARE với force_generic_plan, tái hiện đúng plan. Sửa gốc bằng index tenant_id, due_date where status OPEN để mọi plan đều tốt; tạm thời force_custom_plan cho role ứng dụng."

> Senior tip: Trong hệ thống multi-tenant, **data skew + prepared statement** là tổ hợp nguy hiểm kinh điển: "trung bình" không đại diện cho khách hàng lớn nhất, mà khách lớn nhất lại thường là khách trả tiền nhiều nhất. Tôi luôn kiểm tra {{most_common_freqs}} của cột tenant_id; nếu có tenant > 5% bảng thì mọi query theo tenant phải được thiết kế index sao cho plan **không phụ thuộc** vào việc biết giá trị tham số.`,
  rubric: [
    'Nhận ra plan production là generic plan (tenant_id = $1) còn psql với literal là custom plan; giải thích cơ chế 5 custom plan rồi so chi phí, và pgjdbc prepareThreshold=5',
    'Tính được ước lượng 60.004.118/4200 ≈ 14.286 dòng so với thực tế 21.004.377 của tenant 7 (skew 35%), dẫn chứng lossy blocks, Rows Removed by Filter, buffers, 11,8 s',
    'Giải thích vì sao chỉ tenant lớn bị và vì sao lỗi quay lại 5–10 phút sau restart (plan cache theo connection)',
    'Đề xuất sửa gốc bằng index (tenant_id, status/due_date) hoặc partial index, kèm phương án tạm force_custom_plan và đánh giá trade-off',
    'Nêu cách tái hiện đúng (PREPARE + plan_cache_mode) và monitoring theo tenant/auto_explain',
  ],
  tags: ['postgresql', 'prepared-statement', 'generic-plan', 'data-skew', 'multi-tenant', 'pgjdbc'],
},
{
  id: 'lab-sql-011',
  category: 'sql',
  title: 'Deploy thêm cột NOT NULL làm toàn bộ API treo: AccessExclusiveLock và hàng chờ lock',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử FlashSale chạy {{order-service}} (Spring Boot 3.3, Hibernate 6.4, HikariCP 40 connection, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB). Bảng {{orders}} có **18,4 triệu** dòng, là bảng nóng nhất hệ thống: mọi API đọc/ghi đơn hàng đều đi qua nó, khoảng 1.200 giao dịch/giây vào giờ cao điểm.

**Triệu chứng (15/03/2026, 14:02).** Deploy bản v2.14.0 chứa migration Flyway {{V47__add_payment_method_to_orders.sql}}. Trong vòng 90 giây, **toàn bộ** endpoint trả 504, CPU RDS vẫn 12% (không phải CPU), connection pool cạn sạch, log ứng dụng tràn {{HikariPool-1 - Connection is not available, request timed out after 30000ms}}. DBA kill migration thì hệ thống hồi phục trong 30 giây. Migration chạy lại lúc 02:00 cùng câu SQL mất **4 phút** và thành công. Không ai đổi code giữa hai lần.

**Việc bạn có.** Log Flyway, snapshot pg_stat_activity và pg_locks lúc 14:02:30, và cấu hình migration. Hãy tìm nguyên nhân gốc và cách chạy migration an toàn.`,
  artifacts: [
    {
      name: 'flyway-migration.log',
      lang: 'text',
      content: `2026-03-15 14:00:00.012 INFO  [main] o.f.core.internal.command.DbMigrate : Migrating schema "public" to version "47 - add payment method to orders"
2026-03-15 14:00:00.015 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: ALTER TABLE orders ADD COLUMN payment_method varchar(16) NOT NULL DEFAULT 'COD'
2026-03-15 14:00:00.016 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: CREATE INDEX CONCURRENTLY idx_orders_payment_method ON orders (payment_method)
2026-03-15 14:00:00.018 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: ALTER TABLE orders ALTER COLUMN payment_method DROP DEFAULT
2026-03-15 14:00:02.003 WARN  [main] o.f.core.internal.command.DbMigrate : Migration of schema "public" to version "47" failed! Please restore backups...
2026-03-15 14:00:02.004 ERROR [main] o.f.core.internal.command.DbMigrate : Unable to obtain exclusive lock on table "orders"`,
    },
    {
      name: 'pg-stat-activity-140230.txt',
      lang: 'text',
      content: `-- 2026-03-15 14:02:30 +07, RDS flashsale-primary
flashsale=# SELECT pid, state, wait_event_type, wait_event, left(query, 80) AS query
            FROM pg_stat_activity WHERE datname='flashsale' ORDER BY backend_start;
   pid   |        state        | wait_event_type | wait_event  |                                query
---------+---------------------+-----------------+-------------+------------------------------------------------------------------
  41120 | active              | Lock            | relation    | ALTER TABLE orders ADD COLUMN payment_method varchar(16) NOT NULL DEFAULT 'COD'
  41121 | idle in transaction | Client          | ClientRead  | BEGIN; SELECT ... FROM orders WHERE id = $1 FOR UPDATE
  41122 | active              | Lock            | relation    | SELECT count(*) FROM orders WHERE status = $1
  41123 | active              | Lock            | relation    | UPDATE orders SET status = $1 WHERE id = $2
  41124 | active              | Lock            | relation    | INSERT INTO orders (...) VALUES (...)
  41125 | active              | Lock            | relation    | SELECT id, amount FROM orders WHERE customer_id = $1
   ... (tổng 387 backend đang chờ lock trên cùng một relation)
-- Tổng: 1 migration + 1 transaction giữ lock + 385 query ứng dụng đang chờ AccessExclusiveLock`,
    },
    {
      name: 'pg-locks-140230.txt',
      lang: 'text',
      content: `-- 2026-03-15 14:02:30 +07
flashsale=# SELECT l.locktype, l.mode, l.granted, count(*) AS n, a.state
            FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid
            WHERE l.relation = 'orders'::regclass GROUP BY l.locktype, l.mode, l.granted, a.state;
  locktype |           mode           | granted |  n  |        state
-----------+--------------------------+---------+-----+---------------------
  relation  | AccessShareLock          | t       | 385 | active (chờ)
  relation  | RowExclusiveLock         | t       |   1 | idle in transaction
  relation  | AccessExclusiveLock      | f       |   1 | active (migration)
-- Migration xin AccessExclusiveLock nhưng bị chặn bởi RowExclusiveLock của transaction 41121.
-- 385 query ứng dụng xin AccessShareLock phải xếp hàng sau AccessExclusiveLock trong hàng đợi FIFO.`,
    },
  ],
  questions: [
    'Vì sao migration xin AccessExclusiveLock mà bị chặn, và vì sao 385 query ứng dụng vốn chỉ cần AccessShareLock cũng bị treo dù lock đó đang được cấp?',
    'Vì sao cùng câu SQL lúc 02:00 lại thành công trong 4 phút, còn lúc 14:00 treo toàn hệ thống?',
    'Bạn sẽ chạy migration này thế nào để không chặn hệ thống, và thêm guardrail gì để không tái diễn?',
  ],
  hints: [
    'PostgreSQL hàng đợi lock là FIFO: một AccessExclusiveLock đang chờ sẽ chặn mọi lock mới cùng relation, kể cả lock yếu hơn.',
    'ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT trong PostgreSQL 11+ không rewrite bảng (chỉ ghi metadata), nên bản thân nó nhanh; vấn đề là xin lock.',
    'Transaction 41121 đang idle in transaction giữ RowExclusiveLock: đó là thủ phạm giữ lock.',
  ],
  answer: `**Tóm tắt:** Migration {{ALTER TABLE orders ADD COLUMN ... NOT NULL DEFAULT}} cần **AccessExclusiveLock** trên bảng {{orders}}. Một transaction ứng dụng (41121) đang {{idle in transaction}} giữ **RowExclusiveLock** → migration phải chờ. PostgreSQL xếp hàng lock theo **FIFO**: mọi query ứng dụng xin AccessShareLock sau migration đều bị xếp hàng sau AccessExclusiveLock đang chờ, nên dù lock yếu hơn cũng bị chặn → toàn bộ hệ thống treo. Sửa ngay bằng lock_timeout ngắn và retry; dài hạn: chia migration nhỏ, chạy ngoài giờ cao điểm, theo dõi idle in transaction và statement_timeout.

### Kiến thức nền: lock trên bảng
PostgreSQL có nhiều mức lock trên relation (bảng):
- **AccessShareLock**: SELECT (yếu nhất).
- **RowExclusiveLock**: INSERT/UPDATE/DELETE.
- **AccessExclusiveLock**: ALTER TABLE, DROP TABLE, VACUUM FULL (mạnh nhất, không tương thích với bất kỳ lock nào khác).

Hai lock tương thích nếu cùng được cấp; AccessExclusiveLock **không tương thích** với bất kỳ lock nào → cần bảng trống lock.

### Nguyên nhân gốc, từng bước
1. 14:00:00 migration bắt đầu, xin AccessExclusiveLock trên {{orders}}.
2. Transaction 41121 ({{BEGIN; SELECT ... FOR UPDATE}}) đang giữ RowExclusiveLock và ở trạng thái {{idle in transaction}} (ứng dụng không commit/rollback, ví dụ connection leak hoặc chờ input người dùng).
3. Migration phải chờ RowExclusiveLock được giải phóng → AccessExclusiveLock ở trạng thái {{granted = f}}.
4. Hàng đợi lock của PostgreSQL là **FIFO**: các query ứng dụng đến sau migration xin AccessShareLock phải đứng sau AccessExclusiveLock đang chờ, dù AccessShareLock tương thích với RowExclusiveLock.
5. Vì vậy **385 query ứng dụng** bị chặn, connection pool cạn, toàn bộ API treo. CPU thấp vì không có gì chạy.

### Dẫn chứng
- pg_locks: AccessExclusiveLock {{granted = f}} của migration; RowExclusiveLock {{granted = t}} của transaction 41121; 385 AccessShareLock {{granted = t}} nhưng state active chờ (đang chờ trong hàng đợi).
- pg_stat_activity: 41121 {{idle in transaction}}, ClientRead.
- Flyway: "Unable to obtain exclusive lock on table orders".

### Vì sao 02:00 thành công
Ngoài giờ cao điểm, không có transaction giữ lock, migration xin AccessExclusiveLock và được cấp ngay. PostgreSQL 11+ làm {{ADD COLUMN ... NOT NULL DEFAULT}} chỉ ghi metadata (không rewrite bảng), nên mất vài giây. Vấn đề không phải câu SQL mà là **thời điểm** và **lock đang bị giữ**.

### Cách sửa
**Ngắn hạn:**
- Đặt {{lock_timeout}} cho role migration (ví dụ 5 s): migration fail nhanh thay vì chờ vô hạn; retry sau khi giải phóng lock.
- Tìm và kết thúc transaction giữ lock: {{SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' AND ...}}; hoặc fix code để commit/rollback kịp thời.
- Chạy migration ngoài giờ cao điểm; deploy không kèm migration nặng trong giờ cao điểm.

**Dài hạn:**
- Chia migration: thêm cột nullable trước (metadata, nhanh), backfill theo lô, rồi đặt NOT NULL + default sau. Tránh {{ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT}} trên bảng lớn trong giờ cao điểm dù nó không rewrite.
- Dùng {{CREATE INDEX CONCURRENTLY}} (đã có trong migration) và không bọc trong transaction (Flyway mặc định chạy mỗi migration trong transaction → CONCURRENTLY sẽ lỗi; cần {{spring.flyway...}} hoặc tách migration).
- Thêm {{statement_timeout}} và {{lock_timeout}} cho role ứng dụng; theo dõi {{pg_stat_activity}} state {{idle in transaction}} và connection leak.
- Theo dõi số lock chờ: alert khi {{pg_locks}} có AccessExclusiveLock granted=f.

### Lỗi hay gặp
- Nghĩ migration chậm vì rewrite bảng: PostgreSQL 11+ ADD COLUMN DEFAULT không rewrite.
- Kill migration rồi chạy lại ngay trong giờ cao điểm: lại treo.
- Bọc CREATE INDEX CONCURRENTLY trong transaction: lỗi "CREATE INDEX CONCURRENTLY cannot run inside a transaction block".

### Trả lời miệng 1 phút
"Migration ALTER TABLE cần AccessExclusiveLock. Một transaction ứng dụng idle in transaction giữ RowExclusiveLock nên migration chờ. Hàng đợi lock FIFO làm mọi query AccessShareLock đến sau cũng bị chặn dù lock yếu hơn, nên toàn bộ hệ thống treo. Ngoài giờ cao điểm không có transaction giữ lock nên migration nhanh. Tôi sẽ đặt lock_timeout ngắn, chia migration (thêm cột nullable → backfill → NOT NULL), chạy CONCURRENTLY ngoài transaction, và theo dõi idle in transaction."

> Senior tip: Trên PostgreSQL, **một AccessExclusiveLock đang chờ là "cổ chai" chặn mọi thứ**, kể cả SELECT. Vì vậy migration DDL trên bảng nóng phải luôn có {{lock_timeout}} và chạy ở thời điểm bảng ít lock nhất. Và {{idle in transaction}} là kẻ thù số một: một connection leak có thể làm cả hệ thống đứng.`,
  rubric: [
    'Nhận ra migration cần AccessExclusiveLock bị chặn bởi RowExclusiveLock của transaction idle in transaction',
    'Giải thích cơ chế hàng đợi lock FIFO khiến query AccessShareLock cũng bị chặn',
    'Giải thích vì sao ngoài giờ cao điểm thành công (không có lock giữ) và vì sao ADD COLUMN DEFAULT không rewrite bảng (PG 11+)',
    'Đề xuất sửa: lock_timeout, chia migration, CREATE INDEX CONCURRENTLY ngoài transaction, theo dõi idle in transaction',
  ],
  tags: ['postgresql', 'lock', 'migration', 'flyway', 'access-exclusive-lock', 'idle-in-transaction'],
},
{
  id: 'lab-sql-012',
  category: 'sql',
  title: 'Báo cáo theo tháng của một phòng ban lớn chậm 100 lần: generic plan và thống kê cũ',
  level: 'senior',
  scenario: `**Bối cảnh.** Hệ thống HRIS của công ty FinBank chạy {{payroll-report}} (Spring Boot 3.3, Spring Data JPA, pgjdbc, PostgreSQL 15.6). Bảng {{salary_payment}} có **24 triệu** dòng, phân bố theo phòng ban rất lệch: phòng ban "Bán lẻ" (department_id = 3) chiếm **62%** (14,9 triệu dòng), 80 phòng ban còn lại mỗi phòng dưới 2% (trung bình 115 nghìn dòng).

Màn hình "Báo cáo lương theo tháng" gọi câu SQL tham số hoá:
~~~sql
SELECT department_id, sum(amount) FROM salary_payment
WHERE department_id = $1 AND pay_month = $2
GROUP BY department_id;
~~~

**Triệu chứng.** Sau mỗi restart pod, mọi phòng ban đều nhanh (dưới 200 ms). Khoảng 5 phút sau, **chỉ phòng ban Bán lẻ** chậm 12–18 giây, còn các phòng ban khác vẫn dưới 200 ms. DBA copy câu SQL vào psql với department_id = 3: **180 ms**, không tái hiện. Restart pod thì đỡ 5 phút rồi lặp.

**Việc bạn có.** Log auto_explain, kết quả thử nghiệm psql, thống kê bảng và metric theo thời gian.`,
  artifacts: [
    {
      name: 'auto-explain-report.log',
      lang: 'text',
      content: `2026-03-20 09:14:02.118 +07 [66210] payroll@finbank LOG:  duration: 14821.309 ms  plan:
  Query Text: select d1_0.department_id,sum(d1_0.amount) from salary_payment d1_0 where d1_0.department_id=$1 and d1_0.pay_month=$2 group by d1_0.department_id
  Query Parameters: $1 = '3', $2 = '2026-03'
  HashAggregate  (cost=412.80..412.81 rows=1 width=40) (actual time=14820.99..14821.00 rows=1 loops=1)
    Group Key: department_id
    ->  Seq Scan on salary_payment  (cost=0.00..412.80 rows=9600 width=12) (actual time=0.002..14102.44 rows=14882312 loops=1)
          Filter: ((department_id = $1) AND ((pay_month)::text = $2))
          Rows Removed by Filter: 9117688
          Buffers: shared hit=184220 read=312440
2026-03-20 09:14:02.401 +07 [66212] payroll@finbank LOG:  duration: 178.221 ms  plan:
  Query Text: (cùng câu trên)
  Query Parameters: $1 = '42', $2 = '2026-03'
  Index Scan using idx_salary_dept_month on salary_payment  (cost=0.43..8.45 rows=1 width=12) (actual time=0.018..178.20 rows=112440 loops=1)`,
    },
    {
      name: 'dba-psql-test.txt',
      lang: 'text',
      content: `-- psql 15.6, 2026-03-20 09:30 +07
-- (1) Literal: planner thấy giá trị 3 ngay lúc lập plan
finbank=> EXPLAIN (ANALYZE, BUFFERS)
SELECT department_id, sum(amount) FROM salary_payment
WHERE department_id = 3 AND pay_month = '2026-03' GROUP BY department_id;
  HashAggregate  (cost=184220.50..184220.51 rows=1 width=40) (actual time=178.42..178.43 rows=1 loops=1)
    ->  Index Scan using idx_salary_dept_month on salary_payment  (cost=0.43..184220.50 rows=14882312 width=12) (actual time=0.019..142.11 rows=14882312 loops=1)
  Planning Time: 0.312 ms
  Execution Time: 178.91 ms
-- (2) Mô phỏng prepared statement, ép generic plan
finbank=> PREPARE q(int, text) AS SELECT department_id, sum(amount) FROM salary_payment
          WHERE department_id = $1 AND pay_month = $2 GROUP BY department_id;
finbank=> SET plan_cache_mode = force_generic_plan;
finbank=> EXPLAIN EXECUTE q(3, '2026-03');
  HashAggregate  (cost=412.80..412.81 rows=1 width=40)
    ->  Seq Scan on salary_payment  (cost=0.00..412.80 rows=9600 width=12)
          Filter: ((department_id = $1) AND ((pay_month)::text = $2))
finbank=> SET plan_cache_mode = force_custom_plan;
finbank=> EXPLAIN EXECUTE q(3, '2026-03');
  HashAggregate  (cost=184220.50..184220.51 rows=1 width=40)
    ->  Index Scan using idx_salary_dept_month ... rows=14882312`,
    },
    {
      name: 'stats-and-metrics.txt',
      lang: 'text',
      content: `-- pg_stats (ANALYZE gần nhất 2026-03-20 03:00)
  reltuples = 24000000
  department_id: n_distinct = 81 ; most_common_vals = {3, 7, 12, ...} ; most_common_freqs = {0.6201, 0.0184, 0.0172, ...}
  pay_month: n_distinct = 24 ; most_common_vals = {2026-03, 2026-02, ...}
  Indexes:
    "salary_payment_pkey" PRIMARY KEY, btree (id)
    "idx_salary_dept_month" btree (department_id, pay_month)
  -- pgjdbc / Hikari
  prepareThreshold = 5 ; Hikari maximumPoolSize = 20, 6 pod => 120 connection
  -- Prometheus: p99 theo department
  time   | event            | p99 dept=3 | p99 dept khác
  09:05  | rolling restart  | 0.18 s     | 0.12 s
  09:07  |                  | 0.19 s     | 0.12 s
  09:10  |                  | 8.2 s      | 0.13 s
  09:14  |                  | 14.8 s     | 0.13 s`,
    },
  ],
  questions: [
    'Vì sao production chậm 14,8 giây còn psql chỉ 179 ms với cùng department_id = 3? Giải thích custom plan / generic plan.',
    'Vì sao generic plan được chọn dù nó Seq Scan toàn bảng, và vì sao lỗi chỉ xuất hiện vài phút sau restart?',
    'Đề xuất cách sửa ngắn hạn và dài hạn; so sánh ít nhất 3 phương án.',
  ],
  hints: [
    'So plan production (Seq Scan, department_id = $1) với psql literal (Index Scan theo idx_salary_dept_month): plan khác vì tham số chưa được thay vào.',
    'Generic plan ước lượng trung bình: 24.000.000 / 81 ≈ 296.000 dòng mỗi phòng ban, trong khi phòng ban 3 có 14,9 triệu.',
    'PostgreSQL chuyển sang generic plan sau 5 lần EXECUTE trên mỗi connection khi chi phí generic không đắt hơn trung bình custom plan.',
  ],
  answer: `**Tóm tắt:** Production chạy câu dưới dạng prepared statement; sau vài lần thực thi trên mỗi connection, PostgreSQL chuyển sang **generic plan** (một plan dùng chung cho mọi giá trị {{$1}}), được tối ưu cho phòng ban "trung bình" ~296 nghìn dòng: Seq Scan toàn bảng. Với phòng ban Bán lẻ (14,9 triệu dòng), plan này đọc 496 nghìn page, mất 14,8 giây. psql dùng literal nên luôn có **custom plan** thấy giá trị 3 và chọn index {{idx_salary_dept_month}}, 179 ms. Sửa gốc bằng partial index hoặc index đúng thứ tự để một plan duy nhất tốt cho mọi phòng ban; ngắn hạn có thể đặt {{plan_cache_mode = force_custom_plan}} cho role ứng dụng.

### Kiến thức nền: prepared statement và hai loại plan
Mỗi câu SQL phải qua parse → rewrite → **plan** → execute. Lập plan tốn thời gian, nên prepared statement cho phép lập plan một lần, chạy nhiều lần.

PostgreSQL có hai loại plan:
| | Custom plan | Generic plan |
|---|---|---|
| Khi nào | mỗi lần EXECUTE, **biết** giá trị tham số | một lần, **không biết** giá trị |
| Ước lượng | dùng MCV: phòng ban 3 → 62% bảng | dùng trung bình: 1 / n_distinct |
| Chi phí lập plan | mỗi lần | được cache, gần như 0 |
| Rủi ro | tốn CPU planner | sai nặng khi dữ liệu lệch (skew) |

Thuật toán mặc định ({{plan_cache_mode = auto}}): **5 lần EXECUTE đầu** luôn dùng custom plan. Từ lần thứ 6, PostgreSQL lập generic plan và so chi phí ước lượng của nó với chi phí trung bình của 5 custom plan. Nếu generic không đắt hơn đáng kể, nó dùng generic mãi mãi cho prepared statement đó trên connection đó.

pgjdbc mặc định {{prepareThreshold=5}}: 4 lần đầu một PreparedStatement chạy dưới dạng unnamed statement (luôn được lập plan lại như custom), từ lần thứ 5 mới tạo server-side named prepared statement.

### Nguyên nhân gốc, từng bước
1. Sau restart, 120 connection mới, mọi câu đều custom plan → phòng ban 3 dùng index {{idx_salary_dept_month}}: đọc đúng các dòng của phòng ban + tháng, nhanh.
2. Đa số lần gọi là phòng ban nhỏ. Custom plan của phòng ban nhỏ: index scan vài nghìn dòng, chi phí thấp.
3. Sau ~10 lần trên một connection, PostgreSQL thử generic plan: {{department_id = $1}} được ước lượng **24.000.000 / 81 ≈ 296.000** dòng (khớp rows=9600 sau khi nhân selectivity pay_month). Chi phí 412, gần với trung bình custom plan của phòng ban nhỏ → PostgreSQL chọn generic.
4. Request tiếp theo của phòng ban Bán lẻ rơi vào connection đó: generic plan Seq Scan toàn bảng, đọc 14,9 triệu dòng, lọc pay_month, mất 14,8 giây.
5. Vì mỗi connection tự chuyển sang generic theo nhịp riêng, sau ~5 phút hầu hết 120 connection đã "lật", nên phòng ban Bán lẻ chậm gần như mọi request. Restart xoá plan cache → nhanh lại, rồi lặp.

### Dẫn chứng
- auto_explain: **"Filter: ((department_id = $1) AND ...)"** → tham số chưa được thay vào lúc lập plan → generic plan. Ước lượng **rows=9600** so với thực tế **rows=14882312** (lệch ~1500 lần).
- **"Buffers: shared hit=184220 read=312440"**, **"duration: 14821.309 ms"**.
- psql (1): literal 3 → **Index Scan using idx_salary_dept_month**, **178.91 ms**. psql (2): {{force_generic_plan}} tái hiện **chính xác** plan production (cost 412.80, Seq Scan), còn {{force_custom_plan}} cho lại plan nhanh.
- Thống kê: phòng ban 3 có freq **0.6201** trong MCV, n_distinct **81**; 24.000.000 / 81 = 296.296.
- Metric: 09:05 restart, p99 phòng ban 3 là 0,18 s; 09:10 nhảy lên 8,2 s; phòng ban khác không đổi.

### Cách sửa
| Phương án | Ưu điểm | Nhược điểm |
|---|---|---|
| Index {{(department_id, pay_month)}} (đã có) + partial index {{WHERE department_id = 3}} | Plan tốt cho phòng ban lớn | Index riêng cho tenant lớn, phải quản lý |
| {{ALTER ROLE payroll SET plan_cache_mode = force_custom_plan}} | Không cần deploy, hiệu lực connection mới | Mọi câu đều tốn planning mỗi lần, CPU tăng |
| pgjdbc {{prepareThreshold=0}} | Không bao giờ named statement | Mất lợi ích prepared cho mọi câu |
| Tách dữ liệu phòng ban lớn (partition theo department) | Cô lập noisy neighbor | Lớn, thay đổi kiến trúc |

**Ngắn hạn (hôm nay):** đặt {{plan_cache_mode = force_custom_plan}} cho role ứng dụng rồi rotate connection (Hikari softEvict hoặc rolling restart) để áp dụng. Đồng thời thêm {{CREATE INDEX CONCURRENTLY idx_salary_large_dept_month ON salary_payment (pay_month) WHERE department_id = 3;}} để phòng ban lớn có index riêng nhỏ.

**Dài hạn:** quy tắc thiết kế index cho dữ liệu lệch: **cột đầu tiên là cột filter bằng, sau đó là cột range/sort**; với phòng ban lớn, cân nhắc partial index. Theo dõi p99 theo department (không chỉ trung bình toàn hệ thống). Test hiệu năng với dữ liệu lệch.

### Phòng ngừa
- auto_explain với {{log_parameter_max_length}} (PostgreSQL 16+) để thấy tham số; dấu hiệu generic plan là {{$1}} trong Index Cond.
- Khi tái hiện trong psql, **luôn thử thêm PREPARE + force_generic_plan**, không chỉ literal.
- Dashboard p99 theo department: trung bình toàn hệ thống che mất phòng ban 3 chậm 14,8 giây.

### Lỗi hay gặp
- "psql nhanh mà app chậm → do network/app": thật ra plan khác nhau.
- Restart để chữa: chỉ reset plan cache, lỗi quay lại sau vài phút.
- Nghĩ Hibernate tự "inline" tham số: Hibernate luôn bind qua PreparedStatement.

### Trả lời miệng 1 phút
"Production dùng prepared statement. Sau khoảng 10 lần trên mỗi connection, PostgreSQL chuyển sang generic plan vì chi phí ước lượng tương đương custom plan của phòng ban nhỏ. Generic plan không biết department_id nên đoán 296 nghìn dòng, Seq Scan toàn bảng. Với phòng ban Bán lẻ có 14,9 triệu dòng, plan đó đọc 496 nghìn page, 14,8 giây. psql dùng literal nên có custom plan đi theo index và nhanh. Tôi xác nhận bằng PREPARE với force_generic_plan. Sửa gốc bằng partial index cho phòng ban lớn; tạm thời force_custom_plan cho role ứng dụng."

> Senior tip: Trong hệ thống có dữ liệu lệch, **"trung bình" không đại diện cho nhóm lớn nhất**, mà nhóm lớn nhất lại thường là nhóm quan trọng nhất (khách hàng lớn, phòng ban lớn). Tôi luôn kiểm tra {{most_common_freqs}} của cột filter; nếu có giá trị > 5% bảng thì mọi query theo cột đó phải được thiết kế sao cho plan **không phụ thuộc** vào việc biết giá trị tham số.`,
  rubric: [
    'Nhận ra plan production là generic plan (department_id = $1) còn psql với literal là custom plan; giải thích cơ chế 5 custom plan rồi so chi phí, và pgjdbc prepareThreshold=5',
    'Tính được ước lượng 24.000.000/81 ≈ 296.000 dòng so với thực tế 14.882.312 của phòng ban 3 (skew 62%), dẫn chứng Seq Scan, buffers, 14,8 s',
    'Giải thích vì sao chỉ phòng ban lớn bị và vì sao lỗi quay lại vài phút sau restart (plan cache theo connection)',
    'Đề xuất sửa gốc bằng partial index hoặc index phù hợp, kèm phương án tạm force_custom_plan và đánh giá trade-off',
    'Nêu cách tái hiện đúng (PREPARE + plan_cache_mode) và monitoring theo department',
  ],
  tags: ['postgresql', 'prepared-statement', 'generic-plan', 'data-skew', 'pgjdbc'],
},
{
  id: 'lab-sql-013',
  category: 'sql',
  title: 'Bảng phình to, query chậm dần vì transaction mở lâu chặn vacuum',
  level: 'senior',
  scenario: `**Bối cảnh.** Service {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 32 GB RAM) lưu đơn hàng trong bảng {{orders}}. Sau 18 tháng bảng có **12.400.000 dòng** (~3,2 GB heap, 1,1 GB index). Từ đầu tuần, p95 của các câu SELECT theo {{order_id}} tăng từ 4 ms lên **90 ms**, CPU RDS leo từ 20% lên 65%, dung lượng đĩa tăng 400 MB/ngày dù không có traffic mới. DBA nghi ngờ "thiếu index" và bắt đầu tạo index mới, nhưng p95 vẫn không giảm.

**Triệu chứng.** EXPLAIN cho thấy cùng plan, cùng index, nhưng số page đọc tăng gấp đôi. {{pg_stat_user_tables}} báo {{n_dead_tup}} tăng liên tục. Có một phiên {{idle in transaction}} đã mở từ 6 giờ trước.

**Việc bạn có.** Ba artifact dưới đây lấy từ production. Hãy chỉ ra vì sao autovacuum không dọn được dead tuple, vì sao điều đó làm bảng phình to và query chậm, và đề xuất cách xử lý.`,
  artifacts: [
    {
      name: 'pg-stat-user-tables.txt',
      lang: 'text',
      content: `-- 2026-04-10 14:22 +07, RDS order-primary (PostgreSQL 15.6)
      -- pg_stat_user_tables cho bảng orders
      schemaname | relname | n_live_tup | n_dead_tup | last_vacuum | last_autovacuum | vacuum_count | autovacuum_count
      public     | orders  | 12400000   | 3870000    | 2026-04-03 02:10:00+07 | 2026-04-03 02:10:00+07 | 14 | 187
      -- n_dead_tup / n_live_tup = 31%, dead tuple nhiều hơn cả dữ liệu sống
      -- pg_relation_size('orders') = 3.2 GB heap, pg_total_relation_size = 4.3 GB
      -- Ước tính bloat: dead tuple ~ 1.0 GB`,
    },
    {
      name: 'pg-stat-activity.txt',
      lang: 'text',
      content: `-- 2026-04-10 14:23 +07
      -- pg_stat_activity: phiên đang mở lâu nhất
      pid  | usename | state                | xact_start            | query_start           | wait_event_type | wait_event | query
      18421 | app     | idle in transaction  | 2026-04-10 08:14:00+07 | 2026-04-10 08:14:00+07 | Client         | ClientRead | BEGIN; SELECT * FROM orders WHERE ...; -- chưa COMMIT
      -- xid age của phiên này: 42.100.000 (tuổi của xid giữ bởi phiên, không phải now() - xact_start)
      -- max_connections = 200, active = 47, idle in transaction = 3`,
    },
    {
      name: 'xid-age-warning.txt',
      lang: 'text',
      content: `-- 2026-04-10 14:24 +07
      -- Cảnh báo từ monitoring (Datadog)
      WARNING: database "order" must be vacuumed within 1000000 transactions
      -- pg_stat_database: xact_commit = 1.24e9, xact_rollback = 3.1e6
      -- autovacuum: launcher = on, max_workers = 3, naptime = 1min
      -- log_autovacuum_min_duration = 0 (đang log mọi vacuum)
      -- log: "automatic vacuum of table \\"public.orders\\" skipped because of lock conflict"
      -- log: "automatic analyze of table \\"public.orders\\" skipped"`,
    },
  ],
  questions: [
    'Vì sao autovacuum không dọn được dead tuple dù đang bật và chạy liên tục? Dẫn chứng bằng artifact.',
    'Vì sao bảng phình to làm query chậm dù plan không đổi?',
    'Bạn xử lý thế nào trong ngày và thiết kế dài hạn để không tái diễn?',
  ],
  hints: [
    'Tìm phiên "idle in transaction" trong pg_stat_activity: nó giữ xmin, chặn vacuum vì dead tuple vẫn cần cho snapshot của phiên đó.',
    'n_dead_tup tăng + vacuum skipped vì lock conflict = autovacuum bị chặn.',
    'Xid age tăng → nguy cơ wraparound; cần vacuum freeze.',
  ],
  answer: `**Tóm tắt:** Một phiên {{idle in transaction}} giữ snapshot cũ, vì vậy autovacuum không thể xoá dead tuple (chúng vẫn còn cần cho snapshot đó). Dead tuple tích luỹ làm bảng phình to → nhiều page hơn → query đọc nhiều page hơn → chậm dần. Xid age tăng cũng báo nguy cơ transaction ID wraparound.

### Nguyên nhân gốc
1. Phiên app opened transaction lúc 08:14 nhưng chưa COMMIT (state {{idle in transaction}}). Nó giữ {{xmin}} snapshot, nên mọi dead tuple sinh ra sau đó vẫn "cần" cho phiên này.
2. Autovacuum chạy nhưng bị skip vì lock conflict (log xác nhận). Dead tuple tích luỹ: n_dead_tup = 3.870.000 (31% so với live).
3. Bảng phình to: heap tăng từ ~2.2 GB lên 3.2 GB. Query đọc nhiều page hơn → p95 tăng dù plan không đổi.

### Dẫn chứng
- Artifact 1: n_dead_tup = 3.870.000, n_live_tup = 12.400.000, last_autovacuum = 03/04 (7 ngày trước).
- Artifact 2: pid 18421 state idle in transaction, xact_start 08:14, xid age 42.1M.
- Artifact 3: vacuum skipped because of lock conflict; cảnh báo xid age.

### Cách sửa ngắn hạn
- Terminate phiên idle in transaction ({{pg_terminate_backend(18421)}}) sau khi xác nhận không còn cần.
- Chạy VACUUM (FULL nếu cần) ngoài giờ cao điểm để thu hồi space.
- Bật {{idle_in_transaction_session_timeout}} (ví dụ 5 phút) để tự kill phiên treo.

### Cách sửa dài hạn
- Sửa code: không mở transaction qua HTTP call; dùng {{@Transactional}} ngắn, hoặc tách transaction.
- Bật monitoring: alert khi n_dead_tup / n_live_tup > 20%, khi idle in transaction > 5 phút, khi xid age > 1 tỷ.
- Tune autovacuum: giảm autovacuum_vacuum_scale_factor cho bảng lớn, tăng autovacuum_max_workers.

> Senior tip: dead tuple không phải rác ngay lập tức — chúng cần cho snapshot của các phiên đang chạy. Vì vậy một transaction "quên COMMIT" là kẻ thù số 1 của vacuum. Luôn đặt idle_in_transaction_session_timeout và theo dõi pg_stat_activity.state = 'idle in transaction'.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: phiên idle in transaction giữ snapshot, chặn autovacuum xoá dead tuple',
    'Dẫn chứng đúng: n_dead_tup 3.87M, vacuum skipped lock conflict, pid idle in transaction, xid age',
    'Giải thích đúng vì sao bloat làm query chậm (nhiều page hơn, cùng plan)',
    'Đề xuất sửa đúng: terminate phiên, VACUUM, idle_in_transaction_session_timeout, tune autovacuum',
    'Có monitoring/phòng ngừa: alert n_dead_tup ratio, idle in transaction, xid age',
  ],
  tags: ['postgresql', 'vacuum', 'bloat', 'idle-in-transaction', 'autovacuum'],
},
{
  id: 'lab-sql-014',
  category: 'sql',
  title: 'N+1 lộ ra trong pg_stat_statements: SELECT theo id chạy 2 triệu lần/giờ',
  level: 'senior',
  scenario: `**Bối cảnh.** Service {{product-catalog}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6) phục vụ API GET /api/v1/products/{id} và danh sách GET /api/v1/categories/{id}/products. pg_stat_statements cho thấy một câu {{SELECT ... FROM category WHERE id = $1}} chạy **2.100.000 lần/giờ** dù traffic thực chỉ ~30.000 request/giờ. CPU RDS 70%, p95 180 ms.

**Việc bạn có.** Ba artifact: top pg_stat_statements, log Hibernate, code entity. Hãy tìm nguyên nhân N+1 và đề xuất cách sửa.`,
  artifacts: [
    {
      name: 'pg-stat-statements-top.txt',
      lang: 'text',
      content: `-- 2026-04-11 09:00 +07, RDS catalog-primary (PostgreSQL 15.6)
      queryid        | calls     | total_ms    | mean_ms | rows
      -9876543210    | 2100000   | 420000.0    | 0.200   | 2100000
      -- digest: select c1_0.id,c1_0.name from category c1_0 where c1_0.id=$1
      -- calls / hour = 2.1M, nhưng request thực ~30k/giờ → ratio 70x
      -- shared_blks_hit = 8400000, shared_blks_read = 0 (toàn cache)`,
    },
    {
      name: 'hibernate-sql.log',
      lang: 'text',
      content: `2026-04-11 08:45:12.100 DEBUG [http-nio-8080-exec-7] o.h.SQL: select c1_0.id,c1_0.name from category c1_0 where c1_0.id=?
      2026-04-11 08:45:12.105 DEBUG [http-nio-8080-exec-7] o.h.SQL: select p1_0.id,p1_0.name,p1_0.price,p1_0.category_id from product p1_0 where p1_0.category_id=?
      2026-04-11 08:45:12.110 DEBUG [http-nio-8080-exec-7] o.h.SQL: select p1_0.id,p1_0.name,p1_0.price,p1_0.category_id from product p1_0 where p1_0.id=?
      2026-04-11 08:45:12.112 DEBUG [http-nio-8080-exec-7] o.h.SQL: select p1_0.id,p1_0.name,p1_0.price,p1_0.category_id from product p1_0 where p1_0.id=?
      ... (48 dòng nữa, mỗi product một câu SELECT by id)
      2026-04-11 08:45:12.180 INFO  [http-nio-8080-exec-7] c.v.c.CategoryController: GET /api/v1/categories/42/products -> 200 in 82 ms (50 products)`,
    },
    {
      name: 'ProductEntity.java',
      lang: 'text',
      content: `// src/main/java/com/v/catalog/Product.java
      @Entity
      public class Product {
        @Id private Long id;
        @ManyToOne(fetch = FetchType.LAZY) private Category category;
        private String name;
        private BigDecimal price;
      }
      // src/main/java/com/v/catalog/CategoryService.java
      public List<ProductDto> listByCategory(Long categoryId) {
        List<Product> products = productRepo.findByCategoryId(categoryId);
        return products.stream().map(p -> new ProductDto(
            p.getId(), p.getName(), p.getPrice(),
            p.getCategory().getName()   // <-- lazy load trong stream
        )).toList();
      }`,
    },
  ],
  questions: [
    'Vì sao một câu SELECT theo id chạy 2 triệu lần/giờ dù traffic chỉ 30k request/giờ? Dẫn chứng.',
    'Vì sao tăng connection pool không giúp và CPU vẫn cao?',
    'Bạn sửa code theo những cách nào và thêm guardrail để phát hiện N+1?',
  ],
  hints: [
    'Đếm số câu SELECT by id trong log cho một request danh sách 50 sản phẩm.',
    'Lazy loading trong stream map: mỗi p.getCategory() kích hoạt một câu SELECT by id.',
    'Giải pháp: fetch join, @EntityGraph, @BatchSize, hoặc DTO projection.',
  ],
  answer: `**Tóm tắt:** Đây là N+1 do lazy loading: danh sách 50 sản phẩm được lấy bằng 1 câu, rồi với mỗi sản phẩm lại gọi {{p.getCategory().getName()}} trong stream map, kích hoạt 50 câu SELECT category by id → 51 câu SQL cho một request (1 + 50). Với 30.000 request/giờ, chỉ phần N+1 đã là 1,5 triệu câu thêm/giờ; con số 2,1 triệu calls/giờ trong pg_stat_statements còn bao gồm cả các request khác (chi tiết endpoint, tìm kiếm...) — chênh lệch 1,5M vs 2,1M là bằng chứng định lượng: traffic thực chỉ ~30k request/giờ nhưng một digest SELECT category WHERE id=$1 đã chạy 2,1 triệu lần. Không câu nào chậm (0.2 ms) nhưng tổng thời gian DB tăng và CPU cao.

### Nguyên nhân gốc
Entity {{Product}} có {{@ManyToOne(fetch = FetchType.LAZY) private Category category}}. Service map sang DTO và truy cập {{p.getCategory().getName()}} bên trong stream → Hibernate lazy-load Category cho từng product. OSIV giữ session mở nên lazy load chạy được trong controller.

### Dẫn chứng
- Artifact 1: calls = 2.100.000/giờ, digest SELECT category WHERE id=$1, mean 0.2 ms, toàn cache.
- Artifact 2: log cho thấy sau câu list product, có 50 câu SELECT category WHERE id=? (mỗi product một câu), tổng 51 câu cho một request trả 50 sản phẩm.
- Artifact 3: code CategoryService.listByCategory gọi p.getCategory().getName() trong stream map.

### Cách sửa
1. Fetch join: {{SELECT p FROM Product p JOIN FETCH p.category WHERE p.category.id = :id}}.
2. @EntityGraph(attributePaths = "category") trên repository method.
3. @BatchSize(size = 50) trên quan hệ để gom thành 1 câu IN (...) thay vì 50 câu.
4. DTO projection: query thẳng vào record/DTO, không nạp entity.

### Phòng ngừa
- Bật hibernate.generate_statistics và theo dõi statements per request.
- Dùng spring.jpa.open-in-view=false để phát hiện lazy load ngoài transaction (sẽ ném LazyInitializationException).
- Code review: không truy cập lazy association trong stream/map ngoài transaction.

> Senior tip: N+1 khó thấy vì mỗi câu rất nhanh; chỉ pg_stat_statements mới lộ ra tổng calls. Quy tắc: luôn kiểm tra số câu SQL cho một request bằng cách bật show_sql hoặc dùng datasource-proxy, và tắt OSIV ở production.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: lazy loading trong stream map gây N+1',
    'Dẫn chứng đúng: calls 2.1M/giờ, log 50 câu SELECT by id, code p.getCategory().getName()',
    'Đề xuất sửa đúng: fetch join, @EntityGraph, @BatchSize, DTO projection',
    'Biết tác động của OSIV và cách tắt để phát hiện',
    'Có monitoring/guardrail: statistics, datasource-proxy, code review',
  ],
  tags: ['postgresql', 'n-plus-one', 'hibernate', 'lazy-loading', 'pg-stat-statements'],
},
{id:'lab-sql-015',category:'sql',title:'REINDEX TABLE trong giờ cao điểm làm 619 backend chờ lock trên bảng 38 triệu dòng',level:'senior',scenario:`**Bối cảnh.** Sàn giao nhận **LogiChain** vận hành service {{tracking-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Service chạy **18 instance**, mỗi instance dùng HikariCP **40 connection** (tổng tối đa 720 connection tới RDS). Bảng {{shipments}} lưu toàn bộ đơn hàng của 2.000 đối tác: sau 4 năm đã có **38.214.507 dòng** (~8,4 GB heap + 6,1 GB index). Giờ cao điểm 17:00–19:00 hệ thống xử lý **1.400 giao dịch/giây**, mọi API đọc/ghi đơn hàng đều đi qua bảng này.

**Triệu chứng (14/03/2026, 17:05).** DBA chạy migration dọn bloat index để tăng tốc báo cáo Đơn hàng theo trạng thái:
~~~sql
REINDEX TABLE shipments;
~~~
Trong vòng **4 phút**, **toàn bộ** endpoint trả 504, CPU RDS vẫn **8%** (không phải CPU), connection pool cạn sạch, log ứng dụng tràn {{HikariPool-1 - Connection is not available, request timed out after 3000ms}}. Kill migration thì hệ thống hồi phục ngay. Migration chạy lại lúc 02:00 cùng câu SQL mất **3 phút 50 giây** và thành công. Không ai đổi code giữa hai lần.

**Việc bạn có.** Ba artifact dưới đây lấy từ production lúc 17:05:30–17:06:00. Hãy tìm nguyên nhân gốc, dựng chuỗi chờ, và đề xuất cách chạy migration an toàn.`,
  artifacts: [
    {
      name: 'pg-stat-activity-lockwait.txt',
      lang: 'text',
      content: `-- 2026-03-14 17:05:30 +07, chụp từ RDS logichain-primary (PostgreSQL 15.6)
logichain=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       left(query, 70) AS query
FROM pg_stat_activity
WHERE datname = 'logichain' AND backend_type = 'client backend'
ORDER BY xact_start
LIMIT 12;
  pid  |        state        | wait_event_type | wait_event |    xact_age     |                              query
  -------+--------------------+-----------------+------------+-----------------+--------------------------------------------------------------------
   41822 | active             | Lock            | relation   | 00:03:41.203    | REINDEX TABLE shipments;
   41823 | active             | Lock            | relation   | 00:00:02.114    | SELECT id, status, tracking_no FROM shipments WHERE id = $1
   41824 | active             | Lock            | relation   | 00:00:02.088    | UPDATE shipments SET status = $1 WHERE id = $2
   41825 | active             | Lock            | relation   | 00:00:02.051    | INSERT INTO shipments (...) VALUES (...)
   41826 | active             | Lock            | relation   | 00:00:02.019    | SELECT count(*) FROM shipments WHERE customer_id = $1
   41827 | active             | Lock            | relation   | 00:00:01.997    | SELECT id, amount FROM shipments WHERE status = $1
   41828 | active             | Lock            | relation   | 00:00:01.974    | SELECT id, status FROM shipments WHERE id = $1
   41829 | active             | Lock            | relation   | 00:00:01.941    | UPDATE shipments SET status = $1 WHERE id = $2
   41830 | active             | Lock            | relation   | 00:00:01.912    | SELECT count(*) FROM shipments WHERE customer_id = $1
   41831 | active             | Lock            | relation   | 00:00:01.888    | SELECT id, status FROM shipments WHERE id = $1
   41832 | active             | Lock            | relation   | 00:00:01.861    | SELECT id, tracking_no FROM shipments WHERE customer_id = $1
  -- Tổng: 1 migration + 618 backend đang chờ lock trên cùng một relation (chỉ hiển thị 12 đầu)
  -- wait_event = relation: đang chờ lock trên bảng shipments (relation-level lock)
  -- wait_event_type = Lock: đang trong hàng đợi lock, không chạy

logichain=# SELECT state, wait_event_type, count(*) FROM pg_stat_activity
WHERE datname = 'logichain' AND backend_type = 'client backend' GROUP BY 1, 2 ORDER BY 3 DESC;
    state        | wait_event_type | count
    -------------------+-----------------+-------
     active            | Lock            |   619
    idle              | Client          |    12
    active            |                 |     3
  (3 rows)`,
    },
    {
      name: 'pg-locks-migration.txt',
      lang: 'text',
      content: `-- 2026-03-14 17:05:31 +07
logichain=# SELECT l.locktype, l.mode, l.granted, count(*) AS n
FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.relation = 'shipments'::regclass
GROUP BY l.locktype, l.mode, l.granted ORDER BY n DESC;
  locktype  |           mode           | granted |   n
  ------------+--------------------------+---------+-----
  relation   | AccessShareLock          | f       | 512
  relation   | RowExclusiveLock         | f       | 106
  relation   | AccessShareLock          | t       |   2
  relation   | AccessExclusiveLock      | f       |   1
  (4 rows)

  -- AccessShareLock granted = f (512) + RowExclusiveLock granted = f (106) = 618 query ứng dụng
  --   (SELECT / INSERT / UPDATE) đến SAU migration, đang xếp hàng chờ lock trên shipments.
  -- AccessShareLock granted = t (2): 2 SELECT xin lock TRƯỚC migration nên đã được cấp, vẫn đang chạy.
  -- AccessExclusiveLock granted = f (1): REINDEX đang chờ, chưa được cấp.

  -- Quy tắc tương thích lock (lock conflict table):
  --   AccessExclusiveLock không tương thích với BẤT CỨ lock nào khác.
  -- PostgreSQL hàng đợi lock theo thứ tự đến (FIFO): khi migration xin AccessExclusiveLock,
  -- nó được xếp vào hàng đợi. Mọi query đến sau cũng phải đứng sau nó, dù lock của chúng
  -- (AccessShareLock) tương thích với các query đã cấp trước đó.

logichain=# SELECT pid, pg_blocking_pids(pid) AS blocked_by FROM pg_stat_activity
WHERE datname='logichain' AND wait_event_type = 'Lock' AND pid = 41823;
    pid  | blocked_by
    ---------+------------
     41823 | {41822}`,
    },
    {
      name: 'app-connection-exhausted.log',
      lang: 'text',
      content: `2026-03-14 17:05:31.204 WARN  [http-nio-8080-exec-21] c.z.h.pool.HikariPool : LogiChain-HikariPool-1 - Connection is not available, request timed out after 3000ms (total=40, active=40, idle=0, waiting=43)
2026-03-14 17:05:31.219 ERROR [http-nio-8080-exec-21] c.l.t.TrackingController : GET /api/v1/shipments/abc123 -> 504 in 3021 ms
2026-03-14 17:05:31.882 WARN  [http-nio-8080-exec-33] c.z.h.pool.HikariPool : LogiChain-HikariPool-1 - Connection is not available, request timed out after 3000ms (total=40, active=40, idle=0, waiting=41)
2026-03-14 17:05:31.901 ERROR [http-nio-8080-exec-33] c.l.t.TrackingController : GET /api/v1/shipments/def456 -> 504 in 3018 ms
2026-03-14 17:05:32.444 WARN  [http-nio-8080-exec-12] c.z.h.pool.HikariPool : LogiChain-HikariPool-1 - Connection is not available, request timed out after 3000ms (total=40, active=40, idle=0, waiting=39)
2026-03-14 17:05:32.461 ERROR [http-nio-8080-exec-12] c.l.t.TrackingController : GET /api/v1/shipments/xyz789 -> 504 in 3019 ms
2026-03-14 17:05:33.012 WARN  [http-nio-8080-exec-45] c.z.h.pool.HikariPool : LogiChain-HikariPool-1 - Connection is not available, request timed out after 3000ms (total=40, active=40, idle=0, waiting=37)
2026-03-14 17:05:33.029 ERROR [http-nio-8080-exec-45] c.l.t.TrackingController : GET /api/v1/shipments/uvw000 -> 504 in 3020 ms
-- pattern: mỗi ~600ms một request 504, pool luôn full (active=40, idle=0), waiting queue giảm dần vì client retry RateLimit
-- CPU RDS: 8% (các thread ứng dụng đều đang chờ lock, không tính CPU)`,
    },
  ],
  questions: [
    'Vì sao một câu REINDEX TABLE đơn giản lại làm 618 query ứng dụng phải chờ? Giải thích cơ chế lock trên bảng và hàng đợi lock FIFO của PostgreSQL.',
    'Vì sao cùng câu SQL lúc 02:00 lại thành công trong 3 phút 50 giây, còn lúc 17:05 treo toàn hệ thống 4 phút?',
    'Bạn sẽ chạy migration này thế nào để không-blocking, và thêm guardrail gì để không tái diễn?',
  ],
  hints: [
    'Đọc cột wait_event_type = Lock, wait_event = relation của cả 619 phiên: tất cả đang chờ lock trên relation shipments, không có phiên nào đang chạy.',
    'So sánh AccessExclusiveLock (granted = f) với AccessShareLock (granted = t): migration cần lock mạnh nhất, không tương thích với bất kỳ lock nào, nên đứng đầu hàng đợi và mọi query đến sau đều bị xếp sau.',
    'REINDEX TABLE (không CONCURRENTLY) cần AccessExclusiveLock và giữ trong toàn bộ thời gian build (~4 phút với 6,1 GB index). REINDEX CONCURRENTLY (PG 12+) chỉ cần ShareUpdateExclusiveLock — tương thích với SELECT/INSERT/UPDATE/DELETE, chỉ cấm DDL song song. Lưu ý: CREATE INDEX (không CONCURRENTLY) chỉ cần ShareLock, nên nó KHÔNG chặn SELECT (chỉ chặn INSERT/UPDATE/DELETE).',
  ],
  answer: `**Tóm tắt:** Migration {{REINDEX TABLE shipments}} (không dùng CONCURRENTLY) cần **AccessExclusiveLock** trên bảng {{shipments}} — lock mạnh nhất, không tương thích với bất kỳ lock nào khác. Vì bảng đang nóng (1.400 giao dịch/giây), lock phải chờ các query đang chạy xong; ngay khi được cấp, nó **chặt** mọi query đến sau nhờ hàng đợi lock FIFO: 618 query ứng dụng (SELECT/INSERT/UPDATE) đều phải đứng sau nó dù chúng chỉ cần AccessShareLock. Kết quả: toàn bộ hệ thống treo 4 phút, CPU 8% (chỉ có các thread chờ, không có gì chạy). Sửa: {{REINDEX TABLE CONCURRENTLY}} (hoặc {{CREATE INDEX CONCURRENTLY}} khi mục tiêu là một index mới) — chỉ cần ShareUpdateExclusiveLock, tương thích với thao tác dữ liệu; đặt {{lock_timeout}} cho role migration, chạy ngoài giờ cao điểm, và thêm {{statement_timeout}} + {{idle_in_transaction_session_timeout}} để tự dọn các phiên treo.

### Kiến thức nền: lock trên bảng (relation lock)
PostgreSQL có nhiều mức lock trên một relation (bảng), theo thứ tự mạnh dần:

| Lock | Ai lấy | Tương thích với |
|---|---|---|
| AccessShareLock | SELECT | mọi lock trừ AccessExclusiveLock |
| RowShareLock | SELECT FOR UPDATE / FOR SHARE | mọi lock trừ EXCLUSIVE và AccessExclusiveLock |
| RowExclusiveLock | INSERT / UPDATE / DELETE | mọi lock trừ SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, AccessExclusiveLock |
| ShareUpdateExclusiveLock | VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY, REINDEX CONCURRENTLY, CREATE STATISTICS | mọi lock trừ SHARE UPDATE EXCLUSIVE, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, AccessExclusiveLock |
| ShareLock | CREATE INDEX (không CONCURRENTLY) | mọi lock trừ ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE ROW EXCLUSIVE, EXCLUSIVE, AccessExclusiveLock |
| ShareRowExclusiveLock | CREATE TRIGGER, một số ALTER TABLE | mọi lock trừ ROW EXCLUSIVE, SHARE UPDATE EXCLUSIVE, SHARE ROW EXCLUSIVE, EXCLUSIVE, AccessExclusiveLock |
| ExclusiveLock | REFRESH MATERIALIZED VIEW CONCURRENTLY | chỉ tương thích với AccessShareLock (chặn mọi thao tác ghi) |
| AccessExclusiveLock | ALTER TABLE, DROP TABLE, TRUNCATE, REINDEX (không CONCURRENTLY), CLUSTER, VACUUM FULL, REFRESH MATERIALIZED VIEW, LOCK TABLE | **không tương thích với bất kỳ lock nào** |

Hai lock **tương thích** khi tập xung đột của chúng không chứa nhau (xem bảng trên). AccessExclusiveLock cần bảng **hoàn toàn trống lock**: không có SELECT, không có INSERT, không có UPDATE, không có DDL song song.

### Hàng đợi lock: tại sao một migration làm treo 618 query
1. 17:05:00 migration bắt đầu, xin AccessExclusiveLock trên {{shipments}}.
2. lúc đó đang có nhiều query ứng dụng đang chạy (giữ AccessShareLock/RowExclusiveLock). Migration phải **chờ** chúng commit/rollback → AccessExclusiveLock {{granted = f}}.
3. Ngay khi các query hiện tại xong, AccessExclusiveLock được cấp — nhưng **bất kỳ query nào đến sau migration đều bị xếp vào hàng đợi phía sau nó**, dù query đó chỉ cần AccessShareLock (SELECT). PostgreSQL hàng đợi lock theo thứ tự đến (FIFO), không phân biệt mức độ tương thích.
4. Kết quả: 618 query ứng dụng (SELECT/INSERT/UPDATE) đều phải đứng sau AccessExclusiveLock → tất cả {{wait_event_type = Lock}}, {{wait_event = relation}}, không có phiên nào chạy. Connection pool cạn trên mọi instance (40 connection/instance đều giữ các thread đang chờ), request timeout 3 giây → 504.
5. CPU 8%: các thread đều **ngồi chờ**, không tính CPU. Đây là **blocking**, không phải quá tải — thêm CPU hay thêm connection đều vô hiệu.

### Dẫn chứng
- Artifact 1: pid 41822 (migration) {{state = active}}, {{wait_event_type = Lock}}, {{wait_event = relation}}, {{xact_age = 00:03:41}} — đã chờ 3 phút 41 giây và vẫn chưa xong. Các pid 41823–41832 (ứng dụng) đều {{wait_event_type = Lock}}, {{wait_event = relation}}, xact_age từ 1,8–2,1 giây — đang chờ. Tổng {{619}} phiên đang chờ Lock.
- Artifact 2: AccessExclusiveLock {{granted = f}} n = 1 (migration đang chờ); AccessShareLock {{granted = f}} n = 512 và RowExclusiveLock {{granted = f}} n = 106 (618 query đến sau, đang xếp hàng); AccessShareLock {{granted = t}} n = 2 (2 SELECT xin trước migration nên đã được cấp). {{pg_blocking_pids(41823) = 41822}} — query ứng dụng bị migration chắn.
- Artifact 3: {{HikariPool-1 - Connection is not available, request timed out after 3000ms (total=40, active=40, idle=0, waiting=43)}} — pool cạn, waiting queue tăng. Mỗi ~600ms một request 504.

### Vì sao 02:00 thành công
Ngoài giờ cao điểm, bảng {{shipments}} không có traffic (1.400 giao dịch/giây chỉ vào 17:00–19:00). Migration xin AccessExclusiveLock và được cấp ngay vì không có lock nào đang giữ → build xong trong 3 phút 50 giây. Vấn đề không phải câu SQL hay kích thước bảng, mà là **thời điểm** và **loại lock**.

### Cách sửa
**Ngắn hạn (hôm nay):**
- Dùng {{REINDEX TABLE CONCURRENTLY shipments;}} (PostgreSQL 12+), hoặc {{CREATE INDEX CONCURRENTLY idx_shipments_status_created ON shipments (status, created_at);}} khi mục tiêu chỉ là một index mới. Lock chỉ là ShareUpdateExclusiveLock — SELECT/INSERT/UPDATE/DELETE vẫn chạy trong lúc build (chỉ DDL song song bị chặn). Build sẽ chậm hơn (khoảng 5–6 phút với 6,1 GB index) nhưng **không treo hệ thống**.
- Đặt {{lock_timeout}} cho role migration (ví dụ {{SET lock_timeout = '30s'}} hoặc {{ALTER ROLE ... SET lock_timeout = '5s'}}): nếu migration phải chờ lock quá 30 giây nó tự rollback, fail nhanh thay vì chờ vô hạn; retry sau khi giải phóng.
- Nếu migration phải chạy trong giờ cao điểm: tạm dừng service hoặc chuyển sang read-replica để không có traffic, rồi chạy.

**Dài hạn:**
- **Chia migration nhỏ:** thêm cột/đổi tên cột (metadata, nhanh) và tạo index là hai bước riêng; index luôn dùng CONCURRENTLY và không bọc trong transaction (CREATE INDEX CONCURRENTLY không thể chạy trong transaction block). Flyway bọc mỗi migration trong một transaction, nên câu này phải chạy thủ công bằng psql (hoặc tách thành job riêng), rồi để Flyway đánh dấu version đã áp dụng.
- **Chạy migration ngoài giờ cao điểm:** quy tắc deploy — mọi DDL trên bảng lớn (> 1 triệu dòng) phải được schedule vào khung quiet hours (02:00–04:00).
- **Theo dõi lock:** alert khi {{pg_locks}} có AccessExclusiveLock {{granted = f}}; dashboard số query đang chờ lock theo relation.
- **Tự dọn phiên treo:** {{idle_in_transaction_session_timeout = 30s}} và {{statement_timeout}} cho role ứng dụng, để một connection leak không giữ lock mãi mãi.

### Lỗi hay gặp
- Nghĩ REINDEX/CREATE INDEX nhanh vì "chỉ cần đọc bảng": sai — REINDEX (không CONCURRENTLY) cần AccessExclusiveLock và giữ trong toàn bộ thời gian build; còn CREATE INDEX (không CONCURRENTLY) chỉ cần ShareLock nên chặn ghi chứ không chặn đọc.
- Chạy migration trong transaction (Flyway mặc định): CREATE INDEX CONCURRENTLY / REINDEX CONCURRENTLY sẽ lỗi "CREATE INDEX CONCURRENTLY cannot run inside a transaction block".
- Kill migration rồi chạy lại ngay trong giờ cao điểm: lại treo.

### Trả lời miệng 1 phút
"REINDEX TABLE không concurrent cần AccessExclusiveLock — lock mạnh nhất, không tương thích với bất kỳ lock nào. Bảng đang nóng nên lock phải chờ các query hiện tại xong; ngay khi được cấp, nó cắt mọi query đến sau nhờ hàng đợi lock FIFO: 618 SELECT/INSERT/UPDATE đều phải đứng sau nó dù chúng chỉ cần AccessShareLock. Toàn bộ hệ thống treo 4 phút, CPU 8% vì các thread đều ngồi chờ. Ngoài giờ cao điểm không có lock nên migration thành công. Tôi sẽ dùng REINDEX CONCURRENTLY hoặc CREATE INDEX CONCURRENTLY (lock ShareUpdateExclusiveLock, tương thích với thao tác dữ liệu), đặt lock_timeout cho role migration, chạy ngoài quiet hours, và thêm monitoring cho AccessExclusiveLock granted = f."

> Senior tip: Trên PostgreSQL, **một AccessExclusiveLock đang chờ là "cổ chai"**, và một AccessExclusiveLock đang được cấp thì **chặt hoàn toàn bảng**. Vì vậy mọi DDL trên bảng nóng phải dùng CONCURRENTLY (index), hoặc VACUUM FULL/REINDEX phải được schedule. Quy tắc vàng: **trong giờ cao điểm, không có bất kỳ DDL nào (kể cả ADD COLUMN) được chạy trên bảng nóng**. Và hãy luôn đặt lock_timeout cho role migration — nó biến một sự cố treo 4 phút thành một sự cố fail nhanh và retry được.`,
  rubric: [
    'Nhận ra REINDEX (không concurrent) cần AccessExclusiveLock và bị chặn bởi các query đang chạy',
    'Giải thích cơ chế hàng đợi lock FIFO: mọi query đến sau đều bị xếp sau AccessExclusiveLock dù lock yếu hơn',
    'Dẫn chứng đúng: 619 phiên wait_event_type=Lock, AccessExclusiveLock granted=f, pg_blocking_pids, pool exhausted, CPU 8%',
    'Giải thích vì sao ngoài giờ cao điểm thành công (không có lock giữ)',
    'Đề xuất sửa: REINDEX/CREATE INDEX CONCURRENTLY, lock_timeout, chạy ngoài quiet hours, monitoring AccessExclusiveLock',
  ],
  tags: ['postgresql', 'lock', 'reindex', 'concurrent', 'access-exclusive-lock', 'migration'],
},
{id:'lab-sql-016',category:'sql',title:'Index trên email không dùng vì lower() và ép kiểu varchar vs bigint',level:'senior',scenario:`**Bối cảnh.** SaaS liên lạc **CloudChat** chạy {{auth-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB). Bảng {{app_user}} lưu tài khoản của 4.200 tổ chức: sau 5 năm đã có **8.412.607 dòng** (~2,1 GB heap). Mỗi phút có khoảng 2.500 lần đăng nhập, mỗi lần gọi endpoint {{GET /api/v1/auth/login}} chạy câu:
~~~sql
SELECT id, name, email FROM app_user WHERE lower(email) = lower($1) AND status = 'ACTIVE';
~~~
Index hiện có: {{idx_app_user_email}} btree trên {{email}} (varchar), và {{idx_app_user_status}} btree trên {{status}}.

**Triệu chứng (14/03/2026, 09:15).** p95 của endpoint login nhảy từ 120 ms lên **4,1 giây**, CPU RDS từ 18% lên 82%. DBA chạy EXPLAIN ANALYZE trên production và thấy **Seq Scan toàn bảng 8,4 triệu dòng** dù index {{idx_app_user_email}} đã tồn tại. Sau khi dev "vá" lỗi bằng cách ép kiểu tham số (truyền {{Long}} cho cột {{contract_ref}} ở một endpoint khác), một endpoint khác cũng bị Seq Scan.

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu login, schema + danh sách index, và log ứng dụng. Hãy chỉ ra vì sao index không được dùng và cách sửa đúng.`,
  artifacts: [
    {
      name: 'explain-login.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:15:41 +07, psql trên RDS cloudchat-primary (PostgreSQL 15.6)
cloudchat=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, email FROM app_user
WHERE lower(email) = lower($1) AND status = 'ACTIVE';
                                                                QUERY PLAN
      ------------------------------------------------------------------------------------------------------------------------------------
       Seq Scan on app_user  (cost=0.00..147231.56 rows=42063 width=56) (actual time=0.021..3876.412 rows=1 loops=1)
         Filter: ((lower(email) = lower($1)) AND ((status)::text = 'ACTIVE'::text))
         Rows Removed by Filter: 8412606
         Buffers: shared hit=145210 read=118433
       Planning Time: 0.312 ms
       Execution Time: 3877.204 ms
      (6 rows)

      Time: 3877.520 ms

      -- So sánh: cùng câu, bỏ lower() trên cột:
cloudchat=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, email FROM app_user
WHERE email = $1 AND status = 'ACTIVE';
                                                                QUERY PLAN
      ------------------------------------------------------------------------------------------------------------------------------------
       Index Scan using idx_app_user_email on app_user  (cost=0.43..32.45 rows=1 width=56) (actual time=0.051..0.312 rows=1 loops=1)
         Index Cond: ((email = $1) AND ((status)::text = 'ACTIVE'::text))
         Buffers: shared hit=12 read=2
       Planning Time: 0.284 ms
       Execution Time: 0.401 ms
      (6 rows)

      Time: 0.871 ms`,
    },
    {
      name: 'schema-and-index.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:16:02 +07
cloudchat=# \\d app_user
                                       Table "public.app_user"
         Column    |           Type           | Collation | Nullable |              Default
      --------------+--------------------------+-----------+----------+-----------------------------------
       id           | bigint                   |           | not null | nextval('app_user_id_seq'::regclass)
       name         | character varying(128)   |           | not null |
       email        | character varying(254)   |           | not null |
       status       | character varying(16)    |           | not null |
       created_at   | timestamp with time zone |           | not null | now()
      Indexes:
         "idx_app_user_email" btree (email)
         "idx_app_user_status" btree (status)
         "app_user_pkey" PRIMARY KEY, btree (id)

      -- Danh sách index theo cột:
cloudchat=# SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'app_user';
             indexname          |                                   indexdef
      -------------------------+------------------------------------------------------------------
       idx_app_user_email      | CREATE INDEX idx_app_user_email ON public.app_user USING btree (email)
       idx_app_user_status     | CREATE INDEX idx_app_user_status ON public.app_user USING btree (status)
       app_user_pkey           | CREATE UNIQUE INDEX app_user_pkey ON public.app_user USING btree (id)`,
    },
    {
      name: 'app-login-slow.log',
      lang: 'text',
      content: `2026-03-14 09:15:42.101 DEBUG [http-nio-8080-exec-14] o.h.SQL : select u1_0.id,u1_0.name,u1_0.email from app_user u1_0 where lower(u1_0.email) = lower($1) and u1_0.status = 'ACTIVE'
2026-03-14 09:15:45.980 INFO  [http-nio-8080-exec-14] c.c.a.AuthController : POST /api/v1/auth/login -> 200 in 3881 ms
2026-03-14 09:15:46.222 DEBUG [http-nio-8080-exec-7] o.h.SQL : select u1_0.id,u1_0.name,u1_0.email from app_user u1_0 where lower(u1_0.email) = lower($1) and u1_0.status = 'ACTIVE'
2026-03-14 09:15:50.114 INFO  [http-nio-8080-exec-7] c.c.a.AuthController : POST /api/v1/auth/login -> 3894 ms
2026-03-14 09:15:50.440 DEBUG [http-nio-8080-exec-21] o.h.SQL : select u1_0.id,u1_0.name,u1_0.email from app_user u1_0 where lower(u1_0.email) = lower($1) and u1_0.status = 'ACTIVE'
2026-03-14 09:15:54.319 INFO  [http-nio-8080-exec-21] c.c.a.AuthController : POST /api/v1/auth/login -> 3881 ms
-- pattern: mỗi request login mất ~3,9 giây, không có request nào dưới 1 giây`,
    },
  ],
  questions: [
    'Vì sao index idx_app_user_email (đã tồn tại) không được dùng cho câu WHERE lower(email) = lower($1)? Chỉ ra bằng dòng trong EXPLAIN.',
    'So sánh với câu email = $1 (0,4 ms): đây là minh chứng gì cho nguyên tắc "sargable"?',
    'Bạn sửa câu query và index thế nào để login về dưới 100 ms? Khi nào nên dùng expression index và cần lưu ý gì về IMMUTABLE?',
  ],
  hints: [
    'Đọc dòng "Filter: (lower(email) = lower($1))" trong EXPLAIN: điều kiện bọc hàm lower() quanh cột email, planner không thể dùng index btree trên email vì key trong index là giá trị email thô, không phải lower(email).',
    'Index chỉ được dùng khi vế trái là cột trần, vế phải là hằng số/tham số. Bọc hàm biến điều kiện thành biểu thức — planner không có thống kê cho biểu thức đó (trừ khi đã có expression index).',
    'Expression index: CREATE INDEX ... ON app_user (lower(email)). Function lower() phải IMMUTABLE — lower() là IMMUTABLE trong PostgreSQL, nhưng date_trunc() không phải (phụ thuộc timezone). Sau khi tạo index, cần ANALYZE để planner có statistics cho biểu thức.',
  ],
  answer: `**Tóm tắt:** Câu login viết {{WHERE lower(email) = lower($1)}} — **bọc hàm lower() quanh cột email** — làm mất khả năng dùng index: planner không thể so sánh giá trị trong index {{idx_app_user_email}} (lưu giá trị email thô) với biểu thức {{lower(email)}} nên chọn **Seq Scan toàn bảng 8.412.607 dòng** (3,9 giây). Câu viết đúng {{WHERE email = $1}} dùng lại index và chỉ mất **0,4 ms** — chênh lệch ~10.000 lần. Sửa: viết query so sánh cột trần với tham số đã chuẩn hóa (lower ở ứng dụng), hoặc tạo **expression index** {{CREATE INDEX idx_app_user_lower_email ON app_user (lower(email))}}.

### Kiến thức nền: sargable và expression index
Nguyên tắc **sargable** (SARG = Search ARGment): **index chỉ được dùng khi điều kiện WHERE là "cột_so_sánh_toán_tử_hằng_số"**, tức vế trái là cột trần, vế phải là hằng số hoặc tham số đã bind.

| Viết | Có dùng index không? | Vì sao |
|---|---|---|
| {{WHERE email = $1}} | Có | cột_so_sánh_hằng_số — index btree trên email dùng được |
| {{WHERE lower(email) = lower($1)}} | Không | bọc hàm → biểu thức — planner không có key tương đương |
| {{WHERE email LIKE 'a%'}} | Có | prefix match dùng được với btree |
| {{WHERE email LIKE '%a'}} | Không | tiền tố ẩn — phải scan |

**Expression index** (chỉ dùng khi thực sự cần): {{CREATE INDEX idx ON table (expr)}}. Index lưu giá trị của **biểu thức** (ví dụ {{lower(email)}}), không phải giá trị cột thô. Khi đó planner có thể dùng index cho câu {{WHERE lower(email) = $1}} vì biểu thức trong query **khớp** với biểu thức trong index.

### Nguyên nhân gốc, từng bước
1. Query login: {{WHERE lower(email) = lower($1) AND status = 'ACTIVE'}}. Điều kiện {{lower(email)}} là biểu thức — planner không dùng được {{idx_app_user_email}} (lưu email thô).
2. Planner không có index nào khớp biểu thức {{lower(email)}} (index btree trên {{email}} không chứa biểu thức này) nên chỉ còn đường Seq Scan; nó cũng không có thống kê cho biểu thức, ước lượng selectivity mặc định 0,5% (khoảng 42.000 dòng).
3. Seq Scan đọc toàn bộ 8.412.607 dòng, lọc bỏ 8.412.606, giữ 1 dòng: {{Rows Removed by Filter: 8412606}}, {{Buffers: shared hit=145210 read=118433}} (~263.643 page), {{Execution Time: 3877.204 ms}}.
4. Câu viết đúng {{WHERE email = $1}}: planner dùng {{idx_app_user_email}}, {{Index Cond: (email = $1)}}, chỉ đọc {{Buffers: shared hit=12 read=2}} (14 page), {{Execution Time: 0.401 ms}}.

### Dẫn chứng
- Artifact 1: {{Seq Scan on app_user ... Filter: ((lower(email) = lower($1)) ...)}}, {{Rows Removed by Filter: 8412606}}, {{Execution Time: 3877.204 ms}}. Câu thứ hai {{Index Scan using idx_app_user_email ... Execution Time: 0.401 ms}} — cùng index, chỉ khác cách viết.
- Artifact 2: index {{idx_app_user_email}} btree trên {{email}} — không phải trên {{lower(email)}}.
- Artifact 3: log ứng dụng mỗi request login mất ~3,9 giây, không có request nào dưới 1 giây.

### Cách sửa
**Ngắn hạn (hôm nay):**
- Sửa query so sánh cột trần với tham số đã chuẩn hóa ở ứng dụng: {{WHERE email = :emailLower}} (Java: {{email.toLowerCase()}} trước khi bind). Nếu cần tìm không phân biệt hoa, hãy chuẩn hóa dữ liệu ngay khi insert/update (lưu email đã lower) rồi so sánh cột đã lower — collation không phân biệt hoa (ICU nondeterministic) không dùng được với btree ở PostgreSQL 15.
- Nếu không thể sửa query: tạo expression index:
~~~sql
CREATE INDEX CONCURRENTLY idx_app_user_lower_email ON app_user (lower(email));
~~~
Sau đó {{ANALYZE app_user;}} để planner có statistics cho biểu thức {{lower(email)}}.

**Dài hạn:**
- Chuẩn hóa dữ liệu: lưu {{email}} dưới dạng lower (ví dụ cột {{email_lower}} generated always as (lower(email)) stored) và index trên {{email_lower}} — index nhỏ và query luôn sargable.
- Nếu cần tìm kiếm không phân biệt hoa với dữ liệu đã lower từ trước: {{WHERE email_lower = :emailLower}} — index scan.
- Với các cột số được lưu dưới dạng varchar (ví dụ {{contract_ref}}) và tham số từ Java là {{Long}}: ép kiểu ở **vế tham số** {{WHERE contract_ref = CAST(:ref AS varchar)}} — hoặc tốt hơn, đổi cột sang {{bigint}} theo mô hình expand/contract (thêm cột mới, backfill, dual-write, đổi index, drop cột cũ).

### Expression index cần lưu ý gì
- Function trong index expression phải **IMMUTABLE**. {{lower()}} là IMMUTABLE (kết quả chỉ phụ thuộc locale của database, cố định từ khi tạo database), nhưng {{date_trunc()}} không phải (phụ thuộc timezone), {{now()}} không phải.
- Kích thước expression index tuỳ biểu thức: {{lower(email)}} xấp xỉ index trên cột thô, còn {{contract_ref::bigint}} nhỏ hơn (8 byte/dòng thay vì chuỗi varchar). Dù bằng cách nào, index phải được {{ANALYZE}} để planner có statistics.
- Không tạo expression index một cách tùy tiện: chỉ tạo khi query thực tế cần và đã thử chỉnh query về dạng sargable.

### Lỗi hay gặp
- "Tao index rồi mà vẫn Seq Scan": vì index trên cột thô, query bọc hàm — planner không dùng.
- Ép kiểu ở vế cột ({{contract_ref::bigint}}) để "vá" lỗi operator does not exist: làm mất index (như lab-sql-006).
- Tạo expression index mà quên ANALYZE: planner không có statistics → vẫn chọn Seq Scan.

### Trả lời miệng 1 phút
"Query login viết lower(email) = lower($1) — bọc hàm quanh cột nên planner không thể dùng index idx_app_user_email (lưu email thô) và chọn Seq Scan 8,4 triệu dòng, 3,9 giây. Câu viết email = $1 dùng lại index và chỉ 0,4 ms — chênh lệch 10.000 lần. Sửa: chuẩn hóa tham số ở ứng dụng và so sánh cột trần, hoặc tạo expression index CREATE INDEX ... ON app_user (lower(email)) kèm ANALYZE. Với cột varchar chứa số, ép kiểu ở vế tham số, không ép ở vế cột."

> Senior tip: Khi EXPLAIN vẫn Seq Scan dù đã có index, hãy hỏi "điều kiện WHERE có bọc hàm hay ép kiểu quanh cột không?" — đó là nguyên nhân phổ biến thứ hai sau statistics cũ. Quy tắc vàng: **hãy viết query để cột luôn là vế trái, tham số/hằng số là vế phải**. Nếu bắt buộc phải dùng hàm, hãy tạo expression index và nhớ ANALYZE; nhưng ưu tiên số 1 luôn là chỉnh query.`,
  rubric: [
    'Chỉ đúng nguyên nhân: lower(email) bọc hàm quanh cột → không sargable → Seq Scan 8,4 triệu dòng',
    'Dẫn chứng đúng: Seq Scan + Filter lower(email) + Rows Removed 8.412.606 + Execution Time 3877 ms, so sánh với Index Scan 0,4 ms',
    'Giải thích nguyên tắc sargable và vai trò của expression index',
    'Đề xuất sửa: query cột trần + tham số chuẩn hóa, expression index (lower(email)) + ANALYZE, và trường hợp varchar-vs-number (ép vế tham số)',
    'Nêu lưu ý IMMUTABLE và không tạo expression index tùy tiện',
  ],
  tags: ['postgresql', 'index', 'expression-index', 'sargable', 'lower', 'implicit-cast'],
},
{
  id: 'lab-sql-017',
  category: 'sql',
  title: 'Migration ALTER TABLE trên bảng lớn giờ cao điểm làm hàng chờ lock',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn flash sale FlashDeal chạy {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Service chạy **12 instance**, mỗi instance dùng HikariCP **40 connection** (tổng tối đa 480 connection tới RDS). Bảng {{invoices}} lưu hoá đơn: **38.752.110 dòng** (~8,6 GB heap). Giờ cao điểm 09:30–11:00 hệ thống xử lý **1.200 giao dịch/giây**, mọi API đọc/ghi hoá đơn đều đi qua bảng này.

**Triệu chứng (15/03/2026, 10:02).** Deploy bản v2.18.0 kèm migration Flyway {{V53__add_invoice_no_to_invoices.sql}} chạy câu:
~~~sql
ALTER TABLE invoices ADD COLUMN invoice_no varchar(32);
~~~
Trong vòng 2 phút, **toàn bộ** endpoint trả 504, CPU RDS chỉ **9%** (không phải quá tải CPU), connection pool cạn sạch, log tràn {{HikariPool-1 - Connection is not available, request timed out after 3000ms}}. DBA terminate migration lúc 10:04:30 thì hệ thống hồi phục trong 30 giây. Migration chạy lại lúc 23:00 cùng câu SQL xong trong 25 giây và thành công.

**Việc bạn có.** Ba artifact: log Flyway, ảnh pg_stat_activity và pg_locks lúc 10:02:30. Hãy tìm nguyên nhân gốc, dựng chuỗi chờ, và đề xuất cách chạy migration an toàn.`,
  artifacts: [
    {
      name: 'flyway-migration.log',
      lang: 'text',
      content: `2026-03-15 10:00:00.012 INFO  [main] o.f.core.internal.command.DbMigrate : Migrating schema "public" to version "53 - add invoice no to invoices"
2026-03-15 10:00:00.015 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: ALTER TABLE invoices ADD COLUMN invoice_no varchar(32)
2026-03-15 10:04:30.118 ERROR [main] o.f.core.internal.command.DbMigrate : Migration of schema "public" to version "53" failed! Please restore backups...
2026-03-15 10:04:30.119 ERROR [main] o.f.core.internal.command.DbMigrate : SQL State  : 57P01 --- Error Code : 0 --- Message  : FATAL: terminating connection due to administrator command
-- 57P01 = admin_shutdown: backend bị DBA terminate lúc 10:04:30 (pg_terminate_backend).
-- Câu ALTER TABLE đã chờ lock từ 10:00:00 tới khi bị terminate, tức 4 phút 30 giây.`,
    },
    {
      name: 'pg-stat-activity-100230.txt',
      lang: 'text',
      content: `-- 2026-03-15 10:02:30 +07, RDS flashdeal-primary
flashdeal=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       left(query, 72) AS query
FROM pg_stat_activity WHERE datname='flashdeal' ORDER BY backend_start;
  pid   |        state        | wait_event_type | wait_event |    xact_age     |                                query
--------+---------------------+-----------------+------------+-----------------+----------------------------------------------------------------
  42110 | active              | Lock            | relation   | 00:02:30.402  | ALTER TABLE invoices ADD COLUMN invoice_no varchar(32)
  42111 | active              | Lock            | relation   | 00:00:15.230  | SELECT count(*) FROM invoices WHERE created_at >= '2026-03-15 09:00'
  42112 | active              | Lock            | relation   | 00:00:15.211  | UPDATE invoices SET status = $1 WHERE id = $2
  42113 | active              | Lock            | relation   | 00:00:15.195  | INSERT INTO invoices (...) VALUES (...)
  42114 | active              | Lock            | relation   | 00:00:15.172  | SELECT invoice_id FROM invoices WHERE customer_id = $1
  42115 | active              | Lock            | relation   | 00:00:15.150  | UPDATE invoices SET status = $1 WHERE id = $2
-- (tổng 420 backend đang chờ lock trên cùng một relation, chỉ hiển thị 6 đầu)
-- wait_event_type = Lock, wait_event = relation: đang chờ cấp lock trên bảng invoices, không phải đang chạy

flashdeal=# SELECT state, wait_event_type, count(*) FROM pg_stat_activity
WHERE datname = 'flashdeal' AND backend_type = 'client backend' GROUP BY 1, 2 ORDER BY 3 DESC;
        state        | wait_event_type | count
---------------------+-----------------+-------
 active              | Lock            |   420
 idle                | Client          |    15
 active              |                 |     5
(3 rows)`,
    },
    {
      name: 'pg-locks-100230.txt',
      lang: 'text',
      content: `-- 2026-03-15 10:02:30 +07
flashdeal=# SELECT l.locktype, l.mode, l.granted, count(*) AS n
FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.relation = 'invoices'::regclass
GROUP BY l.locktype, l.mode, l.granted ORDER BY n DESC;
  locktype  |           mode           | granted |   n
------------+--------------------------+---------+-----
 relation   | AccessShareLock          | f       | 401
 relation   | RowExclusiveLock         | f       |  18
 relation   | AccessShareLock          | t       |   3
 relation   | RowExclusiveLock         | t       |   2
 relation   | AccessExclusiveLock      | f       |   1

-- AccessShareLock f (401) + RowExclusiveLock f (18) = 419 query ứng dụng đến SAU migration,
--   đang xếp hàng chờ lock (đúng bằng cột count = 420 ở pg_stat_activity).
-- AccessShareLock t (3) + RowExclusiveLock t (2) = 5 phiên đang giữ lock, khớp với 5 backend
--   "active / wait_event_type = rỗng" trong pg_stat_activity: đó chính là nhóm migration phải chờ.
-- AccessExclusiveLock granted = f (1): migration đang chờ, chưa được cấp.
-- Sau khi migration nhận được lock, mọi query mới đến (kể cả SELECT chỉ cần AccessShareLock)
--   đều phải xếp hàng SAU migration theo thứ tự đến (FIFO).
-- pg_blocking_pids(42110) trả về pid của các phiên đang giữ lock xung đột (hard block),
--   tức 5 backend đang chạy ở trên.`,
    },
  ],
  questions: [
    'Vì sao migration xin AccessExclusiveLock bị chặn, và tại sao 419 query SELECT (chỉ cần AccessShareLock) cũng bị treo?',
    'Dựng chuỗi chờ từ artifacts: migration chờ ai, và query mới chờ migration, với bằng chứng số liệu.',
    'Vì sao cùng migration lúc 23:00 thành công trong 25 giây, nhưng lúc 10:02 treo toàn hệ thống?',
  ],
  hints: [
    'PostgreSQL hàng đợi lock theo thứ tự đến (FIFO): một AccessExclusiveLock đang chờ sẽ chặn mọi lock mới trên cùng relation, kể cả lock yếu hơn.',
    'ALTER TABLE thêm cột trong PG 11+ chỉ ghi metadata (không rewrite bảng), nên chính câu lệnh rất nhanh; vấn đề nằm ở việc xin lock, không ở độ dài câu lệnh.',
    'Có một nhóm query/transaction đang giữ lock AccessShareLock/RowExclusiveLock trước migration; migration phải chờ chúng xong.',
  ],
  answer: `**Tóm tắt:** Migration {{ALTER TABLE invoices ADD COLUMN invoice_no varchar(32)}} cần **AccessExclusiveLock** trên bảng {{invoices}} — lock mạnh nhất, không tương thích với bất kỳ lock nào khác. Bảng đang nóng (1.200 giao dịch/giây) nên migration phải chờ 5 phiên đang giữ AccessShareLock/RowExclusiveLock xong (AccessExclusiveLock granted = f). Sau khi được cấp, migration chặn đúng đầu hàng đợi lock FIFO: mọi query mới đến, kể cả SELECT chỉ cần AccessShareLock, cũng phải xếp hàng SAU migration. Hết 420 backend chờ lock, connection pool cạn, toàn hệ thống trả 504 trong khi CPU chỉ 9% (các thread đang chờ, không tính CPU). Sửa: đặt lock_timeout ngắn cho role migration, tìm và kết thúc session giữ lock, chạy migration ngoài giờ cao điểm; dài hạn chia migration (thêm cột nullable → backfill theo lô → NOT NULL), tạo index CONCURRENTLY ngoài transaction, và theo dõi AccessExclusiveLock granted = f.

### Kiến thức nền: lock trên bảng (relation lock)
PostgreSQL có nhiều mức lock trên một relation, theo thứ tự mạnh dần:
~~~text
Lock                     | Ai lấy                                                        | Xung đột với
AccessShareLock          | SELECT                                                        | chỉ AccessExclusiveLock
RowExclusiveLock         | INSERT / UPDATE / DELETE / MERGE                              | SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, AccessExclusiveLock
ShareUpdateExclusiveLock | CREATE INDEX CONCURRENTLY, REINDEX CONCURRENTLY, ANALYZE, VACUUM | chính nó, SHARE, SHARE ROW EXCLUSIVE, EXCLUSIVE, AccessExclusiveLock
AccessExclusiveLock      | ALTER TABLE, DROP TABLE, REINDEX, CLUSTER, VACUUM FULL, TRUNCATE, LOCK TABLE | mọi lock
~~~
Hai lock tương thích nếu được cấp cùng lúc. AccessExclusiveLock cần bảng hoàn toàn trống lock: không có SELECT, không có INSERT, không có UPDATE, không có DDL song song.

### Nguyên nhân gốc, từng bước
1. 10:00:00 migration bắt đầu, xin AccessExclusiveLock trên {{invoices}}.
2. Lúc đó 5 phiên ứng dụng đang chạy và giữ AccessShareLock/RowExclusiveLock. Migration phải chờ → AccessExclusiveLock có {{granted = f}}, xact_age tăng lên 2 phút 30 khi chụp ảnh.
3. PostgreSQL hàng đợi lock FIFO: khi migration đang chờ AccessExclusiveLock, mọi query mới đến cũng phải xếp hàng SAU nó, kể cả khi query đó chỉ cần AccessShareLock và tương thích với lock đã cấp trước đó.
4. Kết quả: 420 backend chờ lock (wait_event_type = Lock, wait_event = relation), connection pool Hikari cạn trên mọi instance (40 connection/instance đều giữ thread đang chờ), mỗi request timeout 3 giây → 504. CPU 9% vì các thread đang chờ, không có gì chạy. Đây là blocking, không phải quá tải — thêm CPU hay thêm connection đều vô hiệu.

### Dẫn chứng
- Artifact 1: Flyway báo **FATAL: terminating connection due to administrator command** (SQLSTATE 57P01) lúc 10:04:30 — chính là lúc DBA terminate migration đang chờ lock.
- Artifact 2: pid 42110 (migration) có {{wait_event_type = Lock}}, {{wait_event = relation}}, {{xact_age = 00:02:30.402}} — đã chờ 2 phút 30 giây. 419 phiên còn lại cũng {{wait_event_type = Lock}} chờ cùng relation. Tổng 420 backend chờ lock.
- Artifact 3: AccessExclusiveLock {{granted = f}} n = 1 (migration); AccessShareLock {{granted = f}} n = 401 và RowExclusiveLock {{granted = f}} n = 18 (419 query ứng dụng đến sau) + 1 migration = 420 phiên đang xếp hàng; AccessShareLock {{granted = t}} n = 3 và RowExclusiveLock {{granted = t}} n = 2 (5 phiên đã được cấp trước migration, vẫn đang chạy).

### Vì sao lúc 23:00 thành công
Ngoài giờ cao điểm, bảng {{invoices}} không có traffic (1.200 giao dịch/giây chỉ vào 09:30–11:00). Migration xin AccessExclusiveLock và được cấp ngay vì không có lock nào đang giữ → xong trong 25 giây. Vấn đề không phải câu SQL hay kích thước bảng, mà là **thời điểm** và **loại lock**. (Thêm sau: PG 11+ thêm cột với DEFAULT hằng số chỉ ghi metadata, không rewrite bảng, kể cả khi có NOT NULL DEFAULT; vẫn phải chờ lock.)

### Cách sửa
**Ngắn hạn (hôm nay):**
- Đặt {{lock_timeout}} ngắn cho role migration (ví dụ 5 giây): migration không chờ vô hạn, mà thất bại nhanh và có thể thử lại sau khi lock được giải phóng.
- Tìm và kết thúc session giữ lock: {{SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' ...}} hoặc sửa code để commit/rollback sớm.
- Chạy migration ngoài giờ cao điểm (23:00–04:00); không deploy migration trong giờ cao điểm.

**Dài hạn:**
- Chia migration từng bước: (1) thêm cột nullable (metadata, nhanh, không cần lock lâu), (2) backfill dữ liệu theo lô (mỗi lô một transaction ngắn, cập nhật theo khoảng id), (3) sau đó {{ALTER COLUMN ... SET NOT NULL}}, (4) tạo {{CREATE INDEX CONCURRENTLY idx_invoices_invoice_no ON invoices (invoice_no)}} NGOÀI transaction (CREATE INDEX CONCURRENTLY không chạy được trong transaction block — Flyway mặc định chạy mỗi migration trong transaction, nên câu này phải chạy thủ công bằng psql hoặc tách thành job riêng).
- Đặt {{statement_timeout}} và {{lock_timeout}} cho role ứng dụng; theo dõi {{pg_stat_activity}} state {{idle in transaction}} và connection leak.
- Cảnh báo khi {{pg_locks}} có AccessExclusiveLock {{granted = f}}.

### Lỗi hay gặp
- Nghĩ migration chậm vì rewrite bảng: PG 11+ thêm cột chỉ ghi metadata, vẫn phải chờ lock.
- Kill migration rồi chạy lại ngay trong giờ cao điểm: lại treo.
- Bỏ CREATE INDEX CONCURRENTLY trong transaction: lỗi "CREATE INDEX CONCURRENTLY cannot run inside a transaction block".

### Trả lời miệng 1 phút
"Migration ALTER TABLE cần AccessExclusiveLock, lock mạnh nhất, không tương thích với bất kỳ lock nào. Bảng đang nóng nên migration phải chờ 5 phiên đang giữ AccessShareLock/RowExclusiveLock xong. Sau khi được cấp, nó chặn đúng đầu hàng đợi FIFO: mọi query mới đến, kể cả SELECT, cũng phải xếp hàng sau nó. Hết 420 backend chờ lock, pool cạn, hệ thống trả 504, CPU 9% vì các thread đang chờ. Ngoài giờ cao điểm không có lock nên migration xong trong 25 giây. Tôi sẽ đặt lock_timeout cho role migration, chia migration (cột nullable → backfill → NOT NULL), tạo index CONCURRENTLY ngoài transaction, chạy ngoài giờ cao điểm, và cảnh báo AccessExclusiveLock granted = f."

> Senior tip: Một AccessExclusiveLock đang chờ là "cổ chai" chặn tất cả, kể cả SELECT. Vì vậy migration DDL trên bảng nóng luôn phải có lock_timeout và chạy lúc bảng ít lock nhất. Một connection leak (idle in transaction) có thể làm toàn hệ thống dừng, nên theo dõi pg_stat_activity và đặt idle_in_transaction_session_timeout là bắt buộc.`,
  rubric: [
    'Chính xác nguyên nhân: migration cần AccessExclusiveLock bị chặn bởi các query đang giữ AccessShareLock/RowExclusiveLock',
    'Giải thích đúng hàng đợi lock FIFO khiến query AccessShareLock sau migration cũng bị chặn',
    'Dẫn chứng đúng số liệu: AccessExclusiveLock granted = f, 420 backend wait_event_type = Lock, xact_age 2 phút 30 giây, pool cạn, CPU 9%',
    'Giải thích đúng vì sao 23:00 thành công (không có lock giữ) và ADD COLUMN trong PG 11+ không rewrite bảng',
    'Đề xuất sửa đúng: lock_timeout, kết thúc session giữ lock, chia migration (cột nullable → backfill → NOT NULL), CREATE INDEX CONCURRENTLY ngoài transaction, cảnh báo AccessExclusiveLock granted = f',
  ],
  tags: ['postgresql', 'lock', 'migration', 'flyway', 'access-exclusive-lock', 'fifo'],
},
{
  id: 'lab-sql-018',
  category: 'sql',
  title: 'Index trên contract_ref không được dùng vì so sánh varchar với số',
  level: 'senior',
  scenario: `**Bối cảnh.** SaaS hợp đồng điện tử SignNow chạy {{contract-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{contracts}} lưu hợp đồng của 3.200 tổ chức: **8.214.500 dòng** (~2,4 GB heap). Cột {{contract_ref}} kiểu {{varchar(32)}} chứa mã hợp đồng chỉ gồm chữ số (ví dụ {{20260314000142}}). Mỗi phút khoảng 2.500 lần tra cứu hợp đồng qua GET /api/v1/contracts/{contractRef}; Java nhận path variable là {{Long}}, Hibernate bind tham số dạng {{bigint}}.

**Triệu chứng (14/03/2026, 09:15).** p95 tra cứu hợp đồng nhảy từ 60 ms lên **4,2 giây**, CPU RDS từ 18% lên 84%. DBA chạy EXPLAIN ANALYZE trên production: **Seq Scan toàn bảng 8.214.500 dòng** dù index {{idx_contracts_contract_ref}} (btree trên {{contract_ref}}) đã tồn tại. Một dev đã gặp lỗi "operator does not exist: character varying = bigint" và "vá" câu SQL bằng cách ép kiểu cột: {{WHERE contract_ref::bigint = $1}}.

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu tra cứu, schema + index, và log ứng dụng. Hãy chỉ ra vì sao index không được dùng và cách sửa đúng.`,
  artifacts: [
    {
      name: 'explain-contract-ref.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:15:41 +07, psql tren RDS signnow-primary (PostgreSQL 15.6)
signnow=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, contract_ref, customer_name, status
FROM contracts
WHERE contract_ref::bigint = 20260314000142;
                                                      QUERY PLAN
--------------------------------------------------------------------------------
 Seq Scan on contracts  (cost=0.00..167231.56 rows=41072 width=68) (actual time=0.023..4188.712 rows=1 loops=1)
   Filter: ((contract_ref)::bigint = 20260314000142::bigint)
   Rows Removed by Filter: 8214499
   Buffers: shared hit=171000 read=140000
 Planning Time: 0.312 ms
 Execution Time: 4189.401 ms
(6 rows)

-- So sánh: cùng câu, truyền tham số là chuỗi (không ép cột):
signnow=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, contract_ref, customer_name, status
FROM contracts
WHERE contract_ref = '20260314000142';
                                                      QUERY PLAN
--------------------------------------------------------------------------------
  Index Scan using idx_contracts_contract_ref on contracts  (cost=0.43..8.45 rows=1 width=68) (actual time=0.048..0.512 rows=1 loops=1)
    Index Cond: (contract_ref = '20260314000142'::character varying)
    Buffers: shared hit=4 read=1
  Planning Time: 0.284 ms
  Execution Time: 0.704 ms
(5 rows)`,
    },
    {
      name: 'schema-and-index.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:16:02 +07
signnow=# \d contracts
                                        Table "public.contracts"
   Column     |           Type           | ...
--------------+--------------------------+...
 id           | bigint                   | not null
 contract_ref | character varying(32)    | not null  -- mã hợp đồng chỉ gồm chữ số
 customer_name | character varying(128) | not null
 status       | character varying(16)    | not null
 created_at   | timestamp with time zone | not null | now()
Indexes:
    "idx_contracts_contract_ref" btree (contract_ref)
    "contracts_pkey" PRIMARY KEY, btree (id)`,
    },
    {
      name: 'app-contract-slow.log',
      lang: 'text',
      content: `2026-03-14 09:15:42.101 DEBUG [http-nio-8080-exec-14] o.h.SQL : select c1_0.id,c1_0.contract_ref,c1_0.customer_name,c1_0.status from contracts c1_0 where c1_0.contract_ref::bigint = ?
2026-03-14 09:15:45.980 INFO  [http-nio-8080-exec-14] c.c.s.ContractController : GET /api/v1/contracts/20260314000142 -> 200 in 4211 ms
2026-03-14 09:15:46.222 DEBUG [http-nio-8080-exec-7] o.h.SQL : select c1_0.id,c1_0.contract_ref,c1_0.customer_name,c1_0.status from contracts c1_0 where c1_0.contract_ref::bigint = ?
2026-03-14 09:15:50.114 INFO  [http-nio-8080-exec-7] c.c.s.ContractController : GET /api/v1/contracts/20260315000243 -> 200 in 4198 ms
-- Lỗi trước khi "vá" (lấy từ app.log ngày 13/03, lúc 08:41:22):
-- ERROR:  operator does not exist: character varying = bigint
-- LINE 1: where c1_0.contract_ref = ?
--                      ^
-- HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.
-- pattern: mỗi request tra cứu mất khoảng 4,2 giây, không có request nào dưới 1 giây`,
    },
  ],
  questions: [
    'Vì sao index idx_contracts_contract_ref không được dùng câu WHERE contract_ref::bigint = $1? Chỉ ra bằng dòng nào trong EXPLAIN.',
    'So sánh với câu WHERE contract_ref = \'20260314000142\' (0,7 ms): đây là minh chứng gì cho nguyên tắc sargable, và tại sao ép kiểu phải đặt ở vế tham số, không phải ở vế cột?',
    'Bạn sửa query và index thế nào để tra cứu dưới 10 ms? Khi nào nên dùng expression index, và lưu ý gì về IMMUTABLE?',
  ],
  hints: [
    'Đọc dòng "Filter: ((contract_ref)::bigint = ...)" trong EXPLAIN: ép kiểu đặt ở vế cột, index lưu giá trị varchar thô nên không khớp.',
    'Index chỉ được dùng khi vế trái là cột thuần, vế phải là hằng số/tham số. Ép kiểu cột biến điều kiện thành biểu thức; planner không có thống kê cho biểu thức đó → Seq Scan.',
    'Sửa: truyền tham số dạng String (String.valueOf) hoặc ép kiểu ở vế tham số WHERE contract_ref = CAST($1 AS varchar). Nếu không sửa được query: tạo expression index CREATE INDEX ... ON contracts ((contract_ref::bigint)) + ANALYZE. Dài hạn: đổi cột sang bigint qua mô hình expand/contract (thêm cột mới, backfill theo lô, dual-write, đổi index, drop cột cũ).',
  ],
  answer: `**Tóm tắt:** Câu tra cứu viết {{WHERE contract_ref::bigint = $1}} — **ép kiểu ở vế cột** contract_ref — làm mất index: index lưu giá trị varchar thô của {{contract_ref}}, không phải giá trị sau khi ép sang bigint, nên planner chọn **Seq Scan toàn bảng 8.214.500 dòng** (4,2 giây). Câu viết đúng {{WHERE contract_ref = $1}} với tham số String dùng lại index, chỉ mất **0,7 ms** — chậm khoảng 6.000 lần. Nguyên then chốt: **ép kiểu ở vế tham số, không ở vế cột**; nếu không sửa được query, dùng expression index + ANALYZE; dài hạn đổi cột sang bigint qua expand/contract.

### Nguyên tắc sargable
**Sargable** (SARG = Search ARGument) là nguyên tắc: index chỉ được dùng khi điều kiện WHERE có dạng **cột_so_sánh_toán_tử_hằng_số**, nghĩa là vế trái là cột thuần, vế phải là hằng số hoặc tham số đã bind.

~~~text
Viết                            | Dùng index? | Lý do
WHERE contract_ref = $1         | Có          | cột thuần so sánh hằng số → index btree trên contract_ref dùng được
WHERE contract_ref::bigint = $1 | Không       | ép kiểu cột → biểu thức, index lưu varchar thô không khớp
WHERE lower(email) = lower($1)  | Không       | hàm bọc quanh cột cũng làm mất index
~~~

### Nguyên nhân gốc, từng bước
1. API tra cứu nhận contractRef thành {{Long}} từ client, Hibernate bind tham số dạng {{bigint}}.
2. Lần đầu chạy câu bị lỗi "operator does not exist: character varying = bigint" vì PostgreSQL không có toán tử so sánh varchar với bigint.
3. Dev "vá" lỗi bằng cách ép kiểu ở **vế cột**: {{WHERE contract_ref::bigint = $1}}. Cast ở vế cột nghĩa là index btree trên {{contract_ref}} (lưu giá trị varchar) không được dùng nữa — key trong index là "20260314000142" (varchar), còn câu truyền so sánh biểu thức {{contract_ref::bigint}}.
4. Planner không có index nào khớp biểu thức {{contract_ref::bigint}} (index btree trên {{contract_ref}} lưu giá trị varchar) nên chỉ còn Seq Scan; nó cũng không có thống kê cho biểu thức, ước lượng selectivity mặc định 0,5% (khoảng 41.000 dòng).
5. Seq Scan đọc hết 8.214.500 dòng, lọc bỏ 8.214.499, giữ 1 dòng: {{Rows Removed by Filter: 8214499}}, {{Buffers: shared hit=171000 read=140000}} (~311.000 trang ≈ 2,4 GB), {{Execution Time: 4189.401 ms}}.
6. Câu chỉnh {{WHERE contract_ref = $1}} (tham số String): index scan, {{Index Cond: (contract_ref = ...)}}, {{Buffers: shared hit=4 read=1}} (5 trang), {{Execution Time: 0.704 ms}}.

### Dẫn chứng
- Artifact 1: {{Seq Scan on contracts ... Filter: ((contract_ref)::bigint = 20260314000142::bigint)}}, {{Rows Removed by Filter: 8214499}}, {{Execution Time: 4189.401 ms}}. Câu thứ hai {{Index Scan using idx_contracts_contract_ref ... Execution Time: 0.704 ms}} — cùng index, chỉ khác cách viết điều kiện.
- Artifact 2: index {{idx_contracts_contract_ref}} btree trên {{contract_ref}} (varchar), không phải trên {{contract_ref::bigint}}.
- Artifact 3: lỗi trước khi vá "operator does not exist: character varying = bigint"; sau khi vá mỗi request tra cứu mất khoảng 4,2 giây.

### Cách sửa
**Ngắn hạn (hôm nay):**
- Sửa query: truyền tham số dạng {{String}} (Java: {{String.valueOf(contractRef)}} hoặc lấy path variable thành String), viết {{WHERE contract_ref = :contractRef}}. Index được dùng ngay.
- Nếu bắt buộc phải gửi tham số số: ép kiểu ở **vế tham số**: {{WHERE contract_ref = CAST($1 AS varchar)}} — index được duy trì, chỉ thêm chi phí cast một giá trị duy nhất.
- Nếu không sửa được query (code cũ): tạo expression index:
~~~sql
CREATE INDEX CONCURRENTLY idx_contracts_contract_ref_bigint ON contracts ((contract_ref::bigint));
ANALYZE contracts;
~~~
Câu {{WHERE contract_ref::bigint = $1}} thì dùng được index này vì biểu thức trong câu khớp biểu thức trong index.

**Dài hạn:**
- Chuẩn hóa dữ liệu: lưu mã hợp đồng trong cột {{bigint}} (hoặc thêm cột generated {{contract_ref_num}} = contract_ref::bigint stored) và index cột này; query hoàn toàn sargable.
- Đổi cột {{contract_ref}} sang {{bigint}} qua mô hình expand/contract: thêm cột mới, backfill theo lô, dual-write, đổi index, drop cột cũ — tuyệt đối không {{ALTER TABLE ... TYPE}} trực tiếp trên bảng 8,2 triệu dòng.

### Expression index cần lưu ý
- Hàm trong biểu thức phải **IMMUTABLE**. Cast {{::bigint}} từ varchar toàn chữ số là IMMUTABLE (kết quả không phụ thuộc cấu hình) nên dùng được trong index; hàm như {{date_trunc()}} thì không (phụ thuộc múi giờ), {{now()}} cũng không.
- Kích thước expression index tuỳ biểu thức: {{contract_ref::bigint}} nhỏ hơn index trên cột varchar thô (8 byte/dòng), nhưng index vẫn phải được {{ANALYZE}} để planner có thống kê.
- Không tạo expression index tùy tiện: chỉ tạo khi query thực sự cần và đã thử chỉnh query về dạng sargable.

### Lỗi hay gặp
- "Tạo index rồi mà vẫn Seq Scan": vì index trên cột thuần, còn query ép kiểu/bọc hàm cột → planner không dùng.
- Ép kiểu ở vế cột (contract_ref::bigint) để "vá" lỗi operator does not exist: làm mất index (như lab-sql-006).
- Tạo expression index mà quên ANALYZE: planner không có thống kê → vẫn chọn Seq Scan.

### Trả lời miệng 1 phút
"Câu tra cứu viết contract_ref::bigint = $1 — ép kiểu ở vế cột nên planner không thể dùng index idx_contracts_contract_ref (lưu varchar thô) và chọn Seq Scan 8,2 triệu dòng, 4,2 giây. Câu viết contract_ref = $1 với tham số String dùng lại index, 0,7 ms — nhanh khoảng 6.000 lần. Nguyên then chốt: ép kiểu ở vế tham số, không ở vế cột. Nếu không sửa được query, tạo expression index (contract_ref::bigint) kèm ANALYZE. Dài hạn đổi cột sang bigint qua expand/contract."

> Senior tip: Khi EXPLAIN vẫn Seq Scan dù đã có index, hãy hỏi "điều kiện WHERE có ép kiểu hoặc bọc hàm cột không?" — đây là nguyên nhân phổ biến thứ hai sau thống kê cũ. Quy tắc vàng: **viết query để cột luôn ở vế trái, tham số/hằng số ở vế phải**. Nếu bắt buộc phải dùng hàm, tạo expression index và nhớ ANALYZE; nhưng ưu tiên số 1 luôn là chính sửa câu truy vấn.`,
  rubric: [
    'Chính xác nguyên nhân: ép kiểu ở vế cột trong điều kiện WHERE làm mất index (non-sargable), chọn Seq Scan 8,2 triệu dòng',
    'Dẫn chứng đúng: dòng Filter ((contract_ref)::bigint = ...), Rows Removed by Filter 8.214.499, Execution Time 4189 ms, so sánh với Index Scan 0,7 ms',
    'Giải thích đúng nguyên tắc sargable và vị trí ép kiểu (vế tham số, không vế cột)',
    'Đề xuất sửa đúng: tham số String / CAST($1 AS varchar), expression index + ANALYZE, mô hình expand/contract đổi cột sang bigint',
    'Lưu ý IMMUTABLE và không tạo expression index tùy tiện',
  ],
  tags: ['postgresql', 'index', 'implicit-cast', 'sargable', 'expression-index'],
},
{
  id: 'lab-sql-019',
  category: 'sql',
  title: 'API danh sách đơn hàng chậm 4 giây vì N+1 query (1 + 200 câu)',
  level: 'senior',
  scenario: `**Bối cảnh.** Nền tảng thương mại B2B **OrderHub** chạy {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6, HikariCP 20 connection, {{spring.jpa.open-in-view=true}} mặc định). Màn hình "Danh sách đơn hàng" của khách lẻ gọi {{GET /api/v1/orders?page=0&size=50}} để hiển thị 50 đơn gần nhất. Mỗi đơn (bảng {{orders}}) có trung bình 4 dòng hàng (bảng {{order_items}}); API cần trả về tổng số lượng và tên sản phẩm cho từng đơn.

**Triệu chứng (15/03/2026, 10:15).** p95 của endpoint nhảy từ 320 ms lên **4.120 ms** (hơn 4 giây), Tomcat 200 thread cạn dần, gateway trả 504 cho ~6% request. Điểm lạ: **không có câu SQL nào chậm** — câu nào cũng dưới 25 ms — nhưng {{pg_stat_statements}} cho thấy số lượng câu truy vấn tăng vọt và CPU RDS tăng từ 22% lên 74%.

**Điều đã thử, không ăn.** Tăng pool Hikari từ 20 lên 40 (tệ hơn vì thêm tranh chấp ở DB), bật cache tầng ứng dụng cho tên sản phẩm (chỉ giảm vài câu), tăng timeout gateway (che triệu chứng).

**Việc bạn có.** Ba artifact: log SQL Hibernate khi gọi endpoint một lần, số liệu {{pg_stat_statements}} trong 5 phút cao điểm (đã reset lúc 10:10), và đoạn mã mapping/truy vấn hiện tại. Hãy tìm nguyên nhân gốc và đề xuất cách sửa cụ thể (JOIN FETCH, EntityGraph, batch size, DTO projection) kèm đánh đổi.`,
  artifacts: [
    {
      name: 'app-hibernate-sql.log',
      lang: 'text',
      content: `2026-03-15 10:15:12.041 INFO  [http-nio-8080-exec-17] c.o.order.OrderController  : GET /api/v1/orders?page=0&size=50 by customerId=88412
2026-03-15 10:15:12.048 DEBUG [http-nio-8080-exec-17] org.hibernate.SQL :
    select o1_0.id,o1_0.created_at,o1_0.customer_id,o1_0.status,o1_0.total_amount
    from orders o1_0
    where o1_0.customer_id=?
    order by o1_0.created_at desc
    limit ?
-- (1) 1 câu lấy 50 đơn: trả về 50 dòng, 12 ms

2026-03-15 10:15:12.064 DEBUG [http-nio-8080-exec-17] org.hibernate.SQL :
    select i1_0.order_id,i1_0.id,i1_0.product_id,i1_0.product_name,i1_0.quantity,i1_0.unit_price
    from order_items i1_0
    where i1_0.order_id=?
-- (2) câu lặp lại cho đơn #1001, trả về 4 dòng, 8 ms
2026-03-15 10:15:12.076 DEBUG [http-nio-8080-exec-17] org.hibernate.SQL :
    select i1_0.order_id,i1_0.id,i1_0.product_id,i1_0.product_name,i1_0.quantity,i1_0.unit_price
    from order_items i1_0
    where i1_0.order_id=?
-- (3) câu lặp lại cho đơn #1002, trả về 3 dòng, 7 ms
2026-03-15 10:15:12.087 DEBUG [http-nio-8080-exec-17] org.hibernate.SQL :
    select i1_0.order_id,i1_0.id,i1_0.product_id,i1_0.product_name,i1_0.quantity,i1_0.unit_price
    from order_items i1_0
    where i1_0.order_id=?
-- ... (mẫu lặp lại cho từng đơn, từ #1003 đến #1049, mỗi lần chỉ khác tham số order_id)
2026-03-15 10:15:16.118 DEBUG [http-nio-8080-exec-17] org.hibernate.SQL :
    select i1_0.order_id,i1_0.id,i1_0.product_id,i1_0.product_name,i1_0.quantity,i1_0.unit_price
    from order_items i1_0
    where i1_0.order_id=?
-- (201) câu lặp lại cho đơn #1050 (đơn thứ 50), trả về 5 dòng, 9 ms

2026-03-15 10:15:16.162 INFO  [http-nio-8080-exec-17] c.o.order.OrderController  : GET /api/v1/orders -> 200 in 4121 ms (201 statements, 50 orders)
-- Tổng: 1 (orders) + 50 (order_items, mỗi đơn 1 câu) = 201 câu SQL cho 1 request`,
    },
    {
      name: 'pg-stat-statements.txt',
      lang: 'text',
      content: `-- 2026-03-15 10:15:00 +07, RDS orderhub-primary (PostgreSQL 15.6)
-- pg_stat_statements_reset() đã chạy lúc 10:10:00
orderhub=# SELECT queryid, calls,
       round(total_exec_time::numeric, 1) AS total_ms,
       round(mean_exec_time::numeric, 3)  AS mean_ms,
       rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 3;

       queryid       |  calls  | total_ms  | mean_ms |  rows
---------------------+---------+-----------+---------+---------
  55219834400112233  |  300000 | 2100450.6 |   7.002 | 1200000
  44108723399001122  |    6000 |   74400.8 |  12.400 |  300000
  99887766554433221  |     840 |   15120.0 |  18.000 |    8400
(3 rows)

-- Giải mã queryid (rút gọn từ pg_stat_statements.query):
-- 55219834400112233: select i1_0.order_id,i1_0.id,... from order_items i1_0 where i1_0.order_id=$1
-- 44108723399001122: select o1_0.id,... from orders o1_0 where o1_0.customer_id=$1 order by o1_0.created_at desc limit $2
-- 6000 request * 50 đơn = 300000 lần gọi order_items. Mỗi câu ~7 ms, tổng 300000 câu = 2100 giây CPU tích lũy trong 5 phút.`,
    },
    {
      name: 'entity-mapping.txt',
      lang: 'text',
      content: `// Order.java (rút gọn)
@Entity
@Table(name = "orders")
public class Order {
    @Id @GeneratedValue
    private Long id;

    @Column(name = "customer_id")
    private Long customerId;

    // Mặc định @OneToMany là LAZY; không có fetch join hay EntityGraph
    @OneToMany(mappedBy = "order", fetch = FetchType.LAZY)
    private List<OrderItem> items = new ArrayList<>();
    // getter/setter ...
}

// OrderItem.java (rút gọn)
@Entity
@Table(name = "order_items")
public class OrderItem {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    private Long productId;
    private String productName;
    private int quantity;
    private BigDecimal unitPrice;
}

// OrderRepository.java
public interface OrderRepository extends JpaRepository<Order, Long> {
    Page<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId, Pageable pageable);
}

// OrderService.java (rút gọn)
@Transactional(readOnly = true)
public Page<OrderDto> listOrders(Long customerId, int page, int size) {
    Page<Order> orders = orderRepository.findByCustomerIdOrderByCreatedAtDesc(
        customerId, PageRequest.of(page, size));
    // Truy cập order.getItems() -> kích hoạt lazy load cho từng đơn
    return orders.map(o -> new OrderDto(
        o.getId(), o.getStatus(),
        o.getItems().stream().mapToInt(OrderItem::getQuantity).sum(),
        o.getItems().stream().map(OrderItem::getProductName).toList()
    ));
}`,
    },
  ],
  questions: [
    'Nguyên nhân gốc là gì? Giải thích cơ chế N+1 query (1 câu lấy danh sách + N câu lấy con) và vì sao gọi là "N+1".',
    'Dẫn chứng từ artifact: chỉ ra số câu SQL cho 1 request, queryid nào có calls cao nhất, và vì sao không câu nào chậm nhưng tổng thời gian vẫn ~4 giây.',
    'Bạn sửa thế nào trong ngắn hạn và dài hạn? So sánh JOIN FETCH, @EntityGraph, @BatchSize và DTO projection; nêu khi nào chọn cách nào và rủi ro (nhân bản dòng/Cartesian product, phân trang trong bộ nhớ, giới hạn IN).',
  ],
  hints: [
    'Đếm trong log Hibernate: 1 câu select orders + 50 câu select order_items (mỗi câu cho một order_id) = 201 câu. Đây là N+1 do truy cập collection LAZY trong vòng lặp.',
    'Tổng thời gian ≈ thời gian câu gốc + 50 * (độ trễ mạng + parse/plan + thực thi). 50 lần round-trip * ~80 ms ≈ 4 giây dù mỗi câu chỉ 7-12 ms.',
    'JOIN FETCH gộp thành 1 câu nhưng có thể nhân bản dòng Order và không an toàn với phân trang collection; EntityGraph tương tự; @BatchSize gom N câu thành N/batch câu dùng IN (...); DTO projection chỉ lấy cột cần và tránh load entity graph.',
  ],
  answer: `**Tóm tắt:** Endpoint danh sách đơn hàng bị **N+1 query**: Hibernate chạy **1 câu** lấy 50 đơn rồi, khi code truy cập {{order.getItems()}} cho từng đơn, chạy thêm **50 câu** (mỗi câu {{WHERE order_id = ?}}) để nạp {{order_items}} → tổng **201 câu SQL cho 1 request**. Mỗi câu chỉ 7–12 ms nhưng ~50 lần round-trip ứng dụng↔DB cộng dồn thành ~4,1 giây, đồng thời đẩy {{pg_stat_statements}} lên 300.000 calls/5 phút và làm CPU RDS tăng. Sửa ngắn hạn bằng {{@BatchSize}} hoặc {{@EntityGraph/JOIN FETCH}} (chọn theo phân trang); sửa dài hạn bằng **DTO projection** trả đúng dữ liệu hiển thị và giám sát số câu SQL mỗi request.

### N+1 query là gì (giải thích từ gốc)
**N+1 query** (đọc là "en cộng một") là lỗi hiệu năng hay gặp khi dùng ORM (Object-Relational Mapping - công cụ ánh xạ bảng trong database thành object trong Java, ví dụ Hibernate).
- Bước 1: ORM chạy **1 câu** để lấy danh sách cha (ví dụ 50 đơn hàng).
- Bước 2: Khi code duyệt danh sách và truy cập thuộc tính con (ví dụ {{order.getItems()}}), ORM chạy **một câu riêng cho từng phần tử cha** để nạp dữ liệu con (50 câu {{WHERE order_id = ?}}).
- Tổng cộng: **1 + N câu** (N = số phần tử cha). Tại sao gọi "N+1": vì số câu tăng **tuyến tính** theo số lượng phần tử cha, chứ không hằng số.

### Nguyên nhân gốc, từng bước
1. Entity {{Order}} có {{@OneToMany(mappedBy = "order", fetch = FetchType.LAZY) private List<OrderItem> items}}. Mặc định @OneToMany là LAZY — Hibernate không nạp items khi load Order.
2. Repository {{findByCustomerIdOrderByCreatedAtDesc}} chạy 1 câu lấy 50 đơn.
3. Service {{listOrders}} map sang DTO và truy cập {{o.getItems()}} trong stream: {{o.getItems().stream().mapToInt...}} và {{o.getItems().stream().map...}}.
4. Mỗi lần truy cập {{getItems()}} trên proxy LAZY, Hibernate chạy câu {{SELECT ... FROM order_items WHERE order_id = ?}}.
5. 50 đơn → 50 câu SELECT order_items. Log artifact 1 ghi rõ: **201 statements, 50 orders**.
6. Mỗi câu ~7-12 ms (artifact 1), nhưng 50 lần round-trip + overhead HTTP thread = 4.121 ms tổng thể (artifact 1 dòng cuối).
7. Artifact 2: queryid order_items có **calls = 300.000** trong 5 phút (6.000 request × 50 đơn), **mean_ms = 7.002**, tổng CPU 2.100 giây. Queryid orders chỉ **6.000 calls**.

### Dẫn chứng
- Artifact 1: **201 statements, 50 orders** (1 câu orders + 50 câu order_items). Các câu order_items lặp lại với {{WHERE i1_0.order_id=?}} khác nhau.
- Artifact 2: **calls 300.000 / 5 phút** cho câu order_items (queryid 55219834400112233), mean 7 ms. Câu orders chỉ 6.000 calls. Tỉ lệ calls = 50:1 — đặc trưng N+1.
- Artifact 3: code {{o.getItems().stream()}} trong {{map}} — lazy load kích hoạt trong vòng lặp. OSIV ({{open-in-view=true}}) giữ session mở cho phép lazy load ở tầng controller.

### Cách sửa
**Ngắn hạn (hôm nay):**
1. **@BatchSize(size = 50)** trên trường {{items}} của entity {{Order}} (hoặc trên class {{OrderItem}} cho quan hệ @ManyToOne ngược): Hibernate gom 50 proxy chưa load thành 1 câu {{WHERE order_id IN (...)}}. Từ 201 câu → **2 câu** (1 orders + 1 order_items IN). Cách này ít thay đổi code nhất, giữ entity graph.
2. **DTO projection** (khuyên dùng): Viết query trực tiếp trả DTO, không load entity {{Order}} và {{OrderItem}}.
~~~java
@Query("select new com.orderhub.order.OrderDto(o.id, o.status, " +
       "  (select sum(oi.quantity) from OrderItem oi where oi.order = o), " +
       "  (select oi.productName from OrderItem oi where oi.order = o)) " +
       "from Order o where o.customerId = :customerId order by o.createdAt desc")
Page<OrderDto> findByCustomerIdDto(Long customerId, Pageable pageable);
~~~
→ **1 câu duy nhất**, dùng subquery để gom sum quantity và product names. Không N+1, không load entity, không Cartesian product.

**Dài hạn:**
- Luôn dùng **DTO projection** cho các API đọc danh sách có quan hệ con.
- Bật {{spring.jpa.open-in-view=false}} để phát hiện lazy load ngoài transaction (ném {{LazyInitializationException}}).
- Giám sát: bật {{hibernate.generate_statistics=true}}, alert khi **số câu SQL / request > 5**.
- Code review: cấm truy cập collection LAZY trong stream/map ngoài @Transactional (hoặc dùng fetch plan tường minh).

### So sánh các phương án
| Phương án | Số câu SQL | Cartesian product? | An toàn với collection? | Đổi code nhiều? |
|---|---|---|---|---|
| JOIN FETCH | 1 | CÓ (nhân Order × OrderItem) | KHÔNG (HHH000104 với phân trang) | Vừa |
| @EntityGraph | 1 | CÓ | KHÔNG (tương tự JOIN FETCH) | Vừa |
| @BatchSize(50) | 2 | KHÔNG | CÓ | Ít |
| DTO projection (subquery) | 1 | KHÔNG | CÓ | Nhiều |

> Senior tip: **JOIN FETCH trên collection @OneToMany là bẫy**: nó nhân bản dòng cha (Cartesian product) và Hibernate 6 vẫn cảnh báo HHH000104 khi dùng với phân trang — planner load tất cả con vào bộ nhớ rồi mới cắt trang. Với API danh sách, **DTO projection với subquery là an toàn nhất**. Nếu không dùng được subquery, @BatchSize là giải pháp "ít code nhất" vẫn đúng ngữ nghĩa. Luôn đo **số câu SQL/request** thay vì đo latency từng câu.
`,
  rubric: [
    'Nhận diện đúng N+1: 1 câu orders + 50 câu order_items = 201 câu cho 1 request',
    'Dẫn chứng đúng: log 201 statements, pg_stat_statements calls 300.000 vs 6.000 (tỉ lệ 50:1), code o.getItems() trong stream map',
    'Giải thích rủi ro JOIN FETCH/@EntityGraph: nhân bản dòng Order (Cartesian product), không an toàn với phân trang (HHH000104)',
    'Đề xuất sửa đúng: @BatchSize (ngắn hạn, 2 câu), DTO projection với subquery (dài hạn, 1 câu, an toàn nhất)',
    'Có monitoring/guardrail: hibernate.generate_statistics, alert SQL/request > 5, tắt open-in-view, code review fetch plan',
  ],
  tags: ['postgresql', 'n-plus-one', 'hibernate', 'lazy-loading', 'batch-size', 'dto-projection'],
},
{
  id: 'lab-sql-020',
  category: 'sql',
  title: 'Connection pool cạn vì transaction dài giữ connection trong lúc gọi API ngoài',
  level: 'senior',
  scenario: `**Bối cảnh.** Dịch vụ ví điện tử **PayLite** chạy {{payment-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6, HikariCP {{maximumPoolSize=20}}, {{connectionTimeout=3000ms}}). API {{POST /api/v1/payments/checkout}} thực hiện: (1) tạo bản ghi thanh toán, (2) gọi cổng thanh toán bên ngoài (payment gateway - dịch vụ của bên thứ ba, gọi qua HTTP) để trừ tiền, (3) cập nhật trạng thái thanh toán — toàn bộ nằm trong một {{@Transactional}} duy nhất.

**Triệu chứng (15/03/2026, 11:05).** Giờ cao điểm p95 tăng mạnh và gateway trả 504. Log liên tục báo {{HikariPool-1 - Connection is not available, request timed out after 3000ms}} dù DB không quá tải (CPU RDS ~30%). {{pg_stat_activity}} cho thấy nhiều session ở trạng thái **{{idle in transaction}}** giữ connection hàng chục giây ({{wait_event ClientRead}}).

**Điều đã thử, không ăn.** Tăng {{maximumPoolSize}} từ 20 lên 40 (tạm đỡ nhưng vài phút sau lại cạn, tăng áp lực {{max_connections}}), tăng {{connectionTimeout}} (chỉ làm request chờ lâu hơn).

**Việc bạn có.** Ba artifact: log HikariCP + stack trace, ảnh chụp {{pg_stat_activity}}, và đoạn mã Java hiện tại. Hãy tìm nguyên nhân gốc, giải thích vì sao connection bị "treo" dù không chạy SQL, và đề xuất cách sửa (tách transaction, {{idle_in_transaction_session_timeout}}).`,
  artifacts: [
    {
      name: 'hikaricp-error.log',
      lang: 'text',
      content: `2026-03-15 11:05:18.442 WARN  [http-nio-8080-exec-31] com.zaxxer.hikari.pool.HikariPool :
    HikariPool-1 - Connection is not available, request timed out after 3000ms.
    (total=20, active=20, idle=0, waiting=37)

2026-03-15 11:05:18.443 ERROR [http-nio-8080-exec-31] c.p.payment.PaymentController :
    Failed to acquire JDBC Connection; nested exception is java.sql.SQLTransientConnectionException:
    HikariPool-1 - Connection is not available, request timed out after 3000ms.
        at com.zaxxer.hikari.pool.HikariPool.getConnection(HikariPool.java:197)
        at org.springframework.jdbc.datasource.DataSourceUtils.fetchConnection(DataSourceUtils.java:160)
        at org.springframework.orm.jpa.JpaTransactionManager.doBegin(JpaTransactionManager.java:466)
        at c.p.payment.PaymentService.checkout(PaymentService.java:54)

2026-03-15 11:05:19.221 INFO  [HikariPool-1 housekeeper] com.zaxxer.hikari.pool.HikariPool :
    Pool stats (total=20, active=20, idle=0, waiting=45)
-- Lặp lại 11:05:00-11:08:00. total=20, active=20 = 20 connection đều đang bị "mượn", idle=0, waiting tăng.`,
    },
    {
      name: 'pg-stat-activity.txt',
      lang: 'text',
      content: `-- 2026-03-15 11:06:10 +07, RDS paylite-primary (PostgreSQL 15.6)
paylite=# SELECT pid, usename, application_name, state,
       now() - xact_start AS xact_age,
       now() - state_change AS idle_age,
       wait_event_type, wait_event,
       left(query, 80) AS last_query
FROM pg_stat_activity
WHERE datname = 'paylite'
ORDER BY xact_start NULLS LAST;

  pid  | usename | application_name |        state        |  xact_age   |  idle_age   | wait_event_type |  wait_event   |                               last_query
-------+---------+------------------+---------------------+-------------+-------------+-----------------+---------------+------------------------------------------------------------------------
 18421 | payapp  | payment-service  | idle in transaction | 00:00:47.812| 00:00:45.103| Client          | ClientRead    | update payments set status=$1, updated_at=now() where id=$2
 18422 | payapp  | payment-service  | idle in transaction | 00:00:39.441| 00:00:37.220| Client          | ClientRead    | insert into payments (id, user_id, amount, status) values ($1,$2,$3,$4)
 18423 | payapp  | payment-service  | idle in transaction | 00:00:31.008| 00:00:28.774| Client          | ClientRead    | update payments set status=$1, updated_at=now() where id=$2
 18424 | payapp  | payment-service  | idle in transaction | 00:00:22.655| 00:00:20.401| Client          | ClientRead    | insert into payments (id, user_id, amount, status) values ($1,$2,$3,$4)
 18425 | payapp  | payment-service  | idle in transaction | 00:00:18.112| 00:00:15.900| Client          | ClientRead    | update payments set status=$1, updated_at=now() where id=$2
 18426 | payapp  | payment-service  | active              | 00:00:00.014| 00:00:00.000|                 |               | select ... from payments where id=$1
 18427 | payapp  | payment-service  | idle                |             | 00:00:00.220| Client          | ClientRead    | <insufficient privilege>
-- (tổng 20 session của payment-service: 17 "idle in transaction", 2 "active", 1 "idle")
-- "idle in transaction": session đã BEGIN, chạy xong câu SQL cuối nhưng CHƯA COMMIT/ROLLBACK
--   và đang chờ client. wait_event ClientRead = DB chờ ứng dụng, không phải ứng dụng chờ DB.

paylite=# SHOW idle_in_transaction_session_timeout;
 idle_in_transaction_session_timeout
-------------------------------------
 0
(1 row)
-- 0 = tắt: PostgreSQL không tự ngắt session "idle in transaction" dù giữ bao lâu.`,
    },
    {
      name: 'PaymentService.java',
      lang: 'text',
      content: `@Service
public class PaymentService {
    private final PaymentRepository paymentRepository;
    private final PaymentGatewayClient gatewayClient; // HTTP client gọi cổng thanh toán ngoài

    public PaymentService(PaymentRepository paymentRepository,
                          PaymentGatewayClient gatewayClient) {
        this.paymentRepository = paymentRepository;
        this.gatewayClient = gatewayClient;
    }

    @Transactional // (1) Mở transaction DB và GIỮ 1 connection từ HikariCP cho đến khi method kết thúc
    public PaymentResult checkout(CheckoutCommand cmd) {
        // (2) Ghi DB: INSERT payment (status=PENDING) -> nhanh (~10 ms)
        Payment payment = new Payment(cmd.getUserId(), cmd.getAmount(), PaymentStatus.PENDING);
        paymentRepository.save(payment);

        // (3) Gọi API ngoài (payment gateway) để trừ tiền thật
        //    - Bình thường 300-800 ms, khi gateway chậm/lỗi có thể 30-60 giây (HTTP timeout 60s)
        //    - Trong suốt thời gian này: KHÔNG có SQL nào chạy, NHƯNG connection DB và transaction vẫn mở
        GatewayResponse gw = gatewayClient.charge(cmd.getUserId(), cmd.getAmount(), payment.getId());

        // (4) Ghi DB: UPDATE payment status -> nhanh (~5 ms)
        if (gw.isSuccess()) {
            payment.setStatus(PaymentStatus.SUCCESS);
        } else {
            payment.setStatus(PaymentStatus.FAILED);
        }
        paymentRepository.save(payment);

        return PaymentResult.from(payment);
        // (5) Method kết thúc -> Spring commit transaction -> connection trả về HikariCP
    }
}`,
    },
  ],
  questions: [
    'Nguyên nhân gốc khiến connection pool cạn là gì? Giải thích mối liên hệ giữa {{@Transactional}}, việc giữ connection, và trạng thái {{idle in transaction}} trong {{pg_stat_activity}}.',
    'Dẫn chứng từ artifact: chỉ ra pool đã cạn (total/active/idle/waiting), các session {{idle in transaction}} (xact_age, wait_event ClientRead), và đoạn code nào giữ transaction trong lúc chờ API ngoài.',
    'Bạn sửa thế nào để không giữ connection DB khi gọi API ngoài? Trình bày cách tách transaction, xử lý nhất quán dữ liệu (idempotency, đối soát/bù trừ), và các giới hạn an toàn ({{idle_in_transaction_session_timeout}}).',
  ],
  hints: [
    'Trong Spring, {{@Transactional}} giữ một connection JDBC suốt phạm vi method (từ BEGIN đến COMMIT/ROLLBACK). Gọi HTTP ra ngoài 30 giây trong method nghĩa là connection bị "ngồi chờ" 30 giây mà không chạy SQL.',
    '{{idle in transaction}} + {{wait_event ClientRead}} nghĩa là PostgreSQL đã xong câu SQL cuối và đang chờ client gửi lệnh tiếp/COMMIT — DB rảnh nhưng connection bị chiếm. {{idle_in_transaction_session_timeout = 0}} nên DB không tự cắt.',
'Tách thành: (a) transaction ngắn 1 ghi payment=PENDING rồi commit, (b) gọi gateway bên ngoài transaction, (c) transaction ngắn 2 cập nhật trạng thái. Cần idempotency key',
  ],
  answer: `**Tóm tắt:** Endpoint checkout bị **connection pool cạn** vì toàn bộ logic (ghi DB → gọi payment gateway HTTP 30-60 giây → ghi DB) nằm trong **một @Transactional duy nhất**. Spring giữ 1 connection HikariCP suốt 18-60 giây mà không chạy SQL, chỉ chờ HTTP. {{pg_stat_activity}} cho thấy 17 session ở **idle in transaction** với {{xact_age}} hàng chục giây, {{wait_event ClientRead}} = DB chờ ứng dụng. CPU RDS ~30% (DB rảnh), pool 20 connection toàn bộ bị chiếm. Sửa: tách thành 2 transaction ngắn (trước/sau gọi HTTP) + idempotency key, đặt {{idle_in_transaction_session_timeout}}.

### Nguyên nhân gốc, từng bước
1. Method {{checkout}} có {{@Transactional}}: Spring mở transaction (BEGIN) và lấy 1 connection từ HikariCP khi method bắt đầu.
2. Dòng 2-3: {{paymentRepository.save(payment)}} INSERT payment status=PENDING (~10 ms).
3. Dòng 4-5: {{gatewayClient.charge(...)}} gọi HTTP ra payment gateway — **30-60 giây** (timeout 60s, có retry). Trong suốt thời gian này: **KHÔNG có SQL nào chạy**, NHƯNG connection DB và transaction vẫn mở.
4. Dòng 6-7: {{paymentRepository.save(payment)}} UPDATE payment status (~5 ms).
5. Method kết thúc → Spring commit transaction → connection trả về HikariCP. Nhưng method chạy 30-60 giây → connection bị chiếm 30-60 giây!
6. Giờ cao điểm: 20 request/giây × 30 giây = 600 connection cần thiết, pool chỉ 20 → **pool cạn**, waiting queue tăng, timeout 3 giây → 504.

### Dẫn chứng
- Artifact 1 (HikariCP log): **total=20, active=20, idle=0, waiting=37** lúc 11:05:18. Pool cạn liên tục 11:05-11:08. **total=20, active=20** = 20 connection đều đang bị "mượn".
- Artifact 2 (pg_stat_activity): 17 session **idle in transaction** với **xact_age** 18-47 giây, **wait_event = ClientRead** — DB đã xong câu SQL cuối, chờ client gửi lệnh tiếp/COMMIT. **wait_event_type = Client** nghĩa là DB chờ ứng dụng, không phải ứng dụng chờ DB.
- Artifact 3 (code): {{@Transactional}} trên method {{checkout}}. Dòng {{gatewayClient.charge(...)}} nằm giữa 2 câu save. Toàn bộ 30-60 giây trong 1 transaction.
- {{idle_in_transaction_session_timeout = 0}} (artifact 2 cuối) → PostgreSQL không tự ngắt session idle in transaction.

### Cách sửa
**Ngắn hạn (hôm nay):**
1. **Tách transaction:** (a) Transaction 1: INSERT payment=PENDING → commit. (b) Gọi gateway HTTP (ngoài transaction). (c) Transaction 2: UPDATE payment status theo kết quả → commit. Cần **idempotency key** (paymentId) để retry an toàn.
2. **Đặt {{idle_in_transaction_session_timeout}}** cho role ứng dụng: {{ALTER ROLE payapp SET idle_in_transaction_session_timeout = '30s';}} → session idle in transaction > 30s bị kill tự động, giải phóng connection.

**Dài hạn:**
3. **Circuit breaker + timeout ngắn** cho HTTP client (Resilience4j): fail nhanh thay vì chờ 60 giây.
4. **Tách pool** cho batch/service gọi HTTP chậm, không chia sẻ pool với API nhanh.
5. **Outbox pattern / Saga** nếu cần nhất quán chặt: ghi event vào bảng outbox trong transaction 1, consumer riêng xử lý gọi gateway + cập nhật trạng thái.

### Lỗi hay gặp
- Tăng {{maximumPoolSize}}: job vẫn chiếm 1 connection 30-60 giây, pool 40 cũng cạn khi tải cao, chỉ làm tăng áp lực {{max_connections}}.
- Tăng {{connectionTimeout}}: chỉ làm request chờ lâu hơn, không giải phóng connection.
- Giữ @Transactional bao trọn HTTP call: anti-pattern số 1 gây cạn pool.

### Trả lời miệng 1 phút
"Endpoint checkout có @Transactional bao trọn: INSERT payment → gọi payment gateway HTTP 30-60 giây → UPDATE payment. Toàn bộ 30-60 giây connection bị chiếm mà không chạy SQL. pg_stat_activity thấy 17 session idle in transaction, xact_age 18-47 giây, wait_event ClientRead. Pool 20 connection cạn, waiting 37, 504. Sửa: tách 2 transaction ngắn (trước/sau HTTP) + idempotency key, đặt idle_in_transaction_session_timeout = 30s, circuit breaker cho HTTP client."

> Senior tip: **Transaction chỉ nên chứa SQL**. Mọi lời gọi HTTP, message broker, file I/O, sleep đều phải nằm NGOÀI transaction. Đây là anti-pattern số 1 khiến connection pool cạn mà DB rảnh (CPU thấp). Luôn đặt idle_in_transaction_session_timeout — nó biến một bug "quên commit" chạy 60 giây thành sự cố tự giải quyết sau 30 giây.
`,
  rubric: [
    'Chính xác nguyên nhân: @Transactional bao trọn HTTP call payment gateway 30-60 giây, connection bị chiếm không chạy SQL, pool 20 connection cạn',
    'Dẫn chứng đúng: HikariCP total=20/active=20/idle=0/waiting=37, pg_stat_activity 17 session idle in transaction xact_age 18-47 giây wait_event ClientRead, code gatewayClient.charge() giữa 2 save',
    'Giải thích đúng idle in transaction + ClientRead = DB chờ ứng dụng (HTTP call), không phải ứng dụng chờ DB',
    'Đề xuất sửa đầy đủ: tách 2 transaction + idempotency key, idle_in_transaction_session_timeout, circuit breaker, tách pool, outbox/Saga',
    'Phân biệt rõ: tăng pool size/connectionTimeout chỉ trì hoãn, không giải quyết gốc; anti-pattern @Transactional bao HTTP call',
  ],
  tags: ['postgresql', 'connection-pool', 'transaction', 'idle-in-transaction', 'http-client', 'circuit-breaker', 'idempotency'],
},
{
  id: 'lab-sql-021',
  category: 'sql',
  title: 'Danh sách sản phẩm chậm 3,5 giây vì N+1 nạp đánh giá (review) cho từng sản phẩm',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử **ShopEasy** chạy {{product-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6, HikariCP 25 connection, {{spring.jpa.open-in-view=true}} mặc định). Màn hình trang chủ hiển thị 20 sản phẩm nổi bật gọi {{GET /api/v1/products/featured?limit=20}}. Mỗi sản phẩm (bảng {{products}}) có trung bình 15 đánh giá (bảng {{reviews}}); API cần trả về số sao trung bình và 3 đánh giá mới nhất cho mỗi sản phẩm.
  **Triệu chứng (16/03/2026, 14:20).** p95 của endpoint nhảy từ 280 ms lên **3.520 ms**, Tomcat 200 thread cạn dần, gateway trả 504 cho ~5% request. Đặc điểm: **không câu SQL nào chậm** — câu nào cũng dưới 15 ms — nhưng {{pg_stat_statements}} cho thấy số lượng câu truy vấn tăng vọt và CPU RDS tăng từ 25% lên 68%.
  **Điều đã thử, không ăn.** Tăng pool Hikari từ 25 lên 50 (tệ hơn, thêm tranh chấp), bật cache tầng ứng dụng cho số sao trung bình (chỉ giảm vài câu), tăng timeout gateway (che triệu chứng).
  **Việc bạn có.** Ba artifact: log SQL Hibernate khi gọi endpoint một lần, số liệu {{pg_stat_statements}} trong 5 phút cao điểm (đã reset lúc 14:15), và đoạn mã mapping/truy vấn hiện tại. Hãy tìm nguyên nhân gốc và đề xuất cách sửa cụ thể (JOIN FETCH, EntityGraph, batch size, DTO projection) kèm đánh đổi.`,
  artifacts: [
    {
      name: 'app-hibernate-sql.log',
      lang: 'text',
      content: `2026-03-16 14:20:15.041 INFO  [http-nio-8080-exec-9] c.s.product.ProductController : GET /api/v1/products/featured?limit=20
2026-03-16 14:20:15.048 DEBUG [http-nio-8080-exec-9] org.hibernate.SQL :
    select p1_0.id,p1_0.name,p1_0.price,p1_0.category_id,p1_0.created_at
    from products p1_0
    where p1_0.featured = true
    order by p1_0.created_at desc
    limit ?
-- (1) 1 câu lấy 20 sản phẩm nổi bật: trả về 20 dòng, 8 ms

2026-03-16 14:20:15.062 DEBUG [http-nio-8080-exec-9] org.hibernate.SQL :
    select r1_0.id,r1_0.product_id,r1_0.user_id,r1_0.rating,r1_0.comment,r1_0.created_at
    from reviews r1_0
    where r1_0.product_id=?
    order by r1_0.created_at desc
    limit ?
-- (2) câu lặp lại cho sản phẩm #5001, trả về 3 dòng, 6 ms
2026-03-16 14:20:15.071 DEBUG [http-nio-8080-exec-9] org.hibernate.SQL :
    select r1_0.id,r1_0.product_id,r1_0.user_id,r1_0.rating,r1_0.comment,r1_0.created_at
    from reviews r1_0
    where r1_0.product_id=?
    order by r1_0.created_at desc
    limit ?
-- (3) câu lặp lại cho sản phẩm #5002, trả về 3 dòng, 5 ms
-- ... (mẫu lặp lại cho từng sản phẩm, từ #5003 đến #5019, mỗi lần chỉ khác tham số product_id)
2026-03-16 14:20:18.542 DEBUG [http-nio-8080-exec-9] org.hibernate.SQL :
    select r1_0.id,r1_0.product_id,r1_0.user_id,r1_0.rating,r1_0.comment,r1_0.created_at
    from reviews r1_0
    where r1_0.product_id=?
    order by r1_0.created_at desc
    limit ?
-- (21) câu lặp lại cho sản phẩm #5020 (sản phẩm thứ 20), trả về 3 dòng, 7 ms

2026-03-16 14:20:18.572 INFO  [http-nio-8080-exec-9] c.s.product.ProductController : GET /api/v1/products/featured -> 200 in 3531 ms (21 statements, 20 products)
-- Tổng: 1 (products) + 20 (reviews, mỗi sản phẩm 1 câu) = 21 câu SQL cho 1 request`,
    },
    {
      name: 'pg-stat-statements.txt',
      lang: 'text',
      content: `-- 2026-03-16 14:20:00 +07, RDS shopeasy-primary (PostgreSQL 15.6)
-- pg_stat_statements_reset() đã chạy lúc 14:15:00
shopeasy=# SELECT queryid, calls,
       round(total_exec_time::numeric, 1) AS total_ms,
       round(mean_exec_time::numeric, 3)  AS mean_ms,
       rows
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_stat_statements%'
ORDER BY calls DESC
LIMIT 3;

       queryid       |  calls  | total_ms  | mean_ms |  rows
---------------------+---------+-----------+---------+--------
  771122334455667788  |  180000 | 1260450.8 |   7.002 | 540000
  882233445566778899  |   9000  |   72450.5 |   8.050 | 180000
  993344556677889900  |   9000  |   16200.0 |   1.800 | 180000
(3 rows)

-- Giải mã queryid (rút gọn từ pg_stat_statements.query):
-- 771122334455667788: select r1_0.id,r1_0.product_id,... from reviews r1_0 where r1_0.product_id=$1 order by r1_0.created_at desc limit $2
-- 882233445566778899: select p1_0.id,p1_0.name,... from products p1_0 where p1_0.featured = true order by p1_0.created_at desc limit $1
-- 9000 request * 20 sản phẩm = 180.000 lần gọi reviews. Mỗi câu ~7 ms, tổng 180.000 câu = 1.260 giây CPU tích lũy trong 5 phút.`,
    },
    {
      name: 'entity-mapping.txt',
      lang: 'text',
      content: `// Product.java (rút gọn)
@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue
    private Long id;

    private String name;
    private BigDecimal price;
    private boolean featured;

    @OneToMany(mappedBy = "product", fetch = FetchType.LAZY)
    @OrderBy("createdAt DESC")
    private List<Review> reviews = new ArrayList<>();
    // getter/setter ...
}

// Review.java (rút gọn)
@Entity
@Table(name = "reviews")
public class Review {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private Product product;

    private Long userId;
    private Integer rating;
    private String comment;
}

// ProductRepository.java
public interface ProductRepository extends JpaRepository<Product, Long> {
    Page<Product> findByFeaturedTrueOrderByCreatedAtDesc(Pageable pageable);
}

// ProductService.java (rút gọn)
@Transactional(readOnly = true)
public Page<ProductDto> listFeatured(int limit) {
    Page<Product> products = productRepository.findByFeaturedTrueOrderByCreatedAtDesc(
        PageRequest.of(0, limit));
    // Truy cập product.getReviews() -> kích hoạt lazy load cho từng sản phẩm
    return products.map(p -> new ProductDto(
        p.getId(), p.getName(), p.getPrice(),
        p.getReviews().stream().limit(3).map(Review::getRating).toList(),
        p.getReviews().stream().mapToInt(Review::getRating).average().orElse(0.0)
    ));
}`,
    },
  ],
  questions: [
    'Nguyên nhân gốc là gì? Giải thích cơ chế N+1 query (1 câu lấy danh sách + N câu lấy con) và vì sao gọi là "N+1" (so sánh với lab-sql-019 về orders/order_items).',
    'Dẫn chứng từ artifact: chỉ ra số câu SQL cho 1 request, queryid nào có calls cao nhất, và vì sao không câu nào chậm nhưng tổng thời gian vẫn ~3,5 giây.',
    'Bạn sửa thế nào trong ngắn hạn và dài hạn? So sánh JOIN FETCH, @EntityGraph, @BatchSize và DTO projection; nêu khi nào chọn cách nào và rủi ro (nhân bản dòng/Cartesian product, giới hạn IN, phân trang trong bộ nhớ khi fetch collection).',
  ],
  hints: [
    'Đếm trong log Hibernate: 1 câu select products + 20 câu select reviews (mỗi câu cho một product_id) = 21 câu. Đây là N+1 do truy cập collection LAZY trong vòng lặp map.',
    'Tổng thời gian ≈ thời gian câu gốc + N * (độ trễ mạng + parse/plan + thực thi). 20 lần round-trip * ~175 ms ≈ 3,5 giây dù mỗi câu chỉ 5-7 ms (lưu ý: LIMIT 3 trong câu reviews nhưng vẫn phải tìm 3 dòng mới nhất).',
    'JOIN FETCH gộp thành 1 câu nhưng có thể nhân bản dòng Product (Cartesian product) và KHÔNG an toàn với phân trang collection (Hibernate cảnh báo HHH000104, load tất cả vào bộ nhớ rồi mới cắt trang); @EntityGraph tương tự; @BatchSize(size=20) gom 20 câu thành 1 câu dùng IN (...); DTO projection chỉ lấy cột cần và tránh load entity graph.',
  ],
  answer: `**Tóm tắt:** Endpoint danh sách sản phẩm nổi bật bị **N+1 query**: Hibernate chạy **1 câu** lấy 20 sản phẩm rồi, khi code truy cập {{product.getReviews()}} cho từng sản phẩm, chạy thêm **20 câu** (mỗi câu {{WHERE product_id = ? ORDER BY created_at DESC LIMIT 3}}) để nạp {{reviews}} → tổng **21 câu SQL cho 1 request**. Mỗi câu chỉ 5–7 ms nhưng ~20 lần round-trip ứng dụng↔DB cộng dồn thành ~3,5 giây, đồng thời đẩy {{pg_stat_statements}} lên 180.000 calls/5 phút và làm CPU RDS tăng. Khác với lab-sql-019 (orders → order_items, collection @OneToMany), đây là products → reviews cũng là @OneToMany nhưng có ORDER BY + LIMIT trong câu con — JOIN FETCH sẽ **nhân bản dòng Product** và phá vỡ LIMIT 3 (load tất cả review rồi mới lọc 3 ở Java). Sửa ngắn hạn bằng {{@BatchSize}} hoặc **DTO projection**; sửa dài hạn bằng DTO projection + giám sát số câu SQL mỗi request.
### N+1 query là gì (giải thích từ gốc)
**N+1 query** là lỗi hiệu năng hay gặp khi dùng ORM (Object-Relational Mapping - công cụ ánh xạ bảng trong database thành object trong Java, ví dụ Hibernate).
- Bước 1: ORM chạy **1 câu** để lấy danh sách cha (ví dụ 20 sản phẩm).
- Bước 2: Khi code duyệt danh sách và truy cập thuộc tính con (ví dụ {{product.getReviews()}}), ORM chạy **một câu riêng cho từng phần tử cha** để nạp dữ liệu con (20 câu {{WHERE product_id = ?}}).
- Tổng cộng: **1 + N câu** (N = số phần tử cha). Tại sao gọi "N+1": vì số câu tăng **tuyến tính** theo số lượng phần tử cha, chứ không hằng số.
### Nguyên nhân gốc, từng bước
1. Entity {{Product}} có {{@OneToMany(mappedBy = "product", fetch = FetchType.LAZY) private List<Review> reviews}}. Mặc định @OneToMany là LAZY — Hibernate không nạp reviews khi load Product.
2. Repository {{findByFeaturedTrueOrderByCreatedAtDesc}} chạy 1 câu lấy 20 sản phẩm.
3. Service {{listFeatured}} map sang DTO và truy cập {{p.getReviews()}} trong stream: {{p.getReviews().stream().limit(3)...}} và {{p.getReviews().stream().mapToInt...}}.
4. Mỗi lần truy cập {{getReviews()}} trên proxy LAZY, Hibernate chạy câu {{SELECT ... FROM reviews WHERE product_id = ? ORDER BY created_at DESC LIMIT 3}}.
5. 20 sản phẩm → 20 câu SELECT reviews. Log artifact 1 ghi rõ: **21 statements, 20 products**.
6. Mỗi câu ~6 ms (artifact 1), nhưng 20 lần round-trip + overhead HTTP thread = 3.531 ms tổng thể (artifact 1 dòng cuối).
7. Artifact 2: queryid reviews có **calls = 180.000** trong 5 phút (9.000 request × 20 sản phẩm), **mean_ms = 7.002**, tổng CPU 1.260 giây. Queryid products chỉ **9.000 calls**.
### Dẫn chứng
- Artifact 1: **21 statements, 20 products** (1 câu products + 20 câu reviews). Các câu reviews lặp lại với {{WHERE r1_0.product_id=?}} khác nhau.
- Artifact 2: **calls 180.000 / 5 phút** cho câu reviews (queryid 771122334455667788), mean 7 ms. Câu products chỉ 9.000 calls. Tỉ lệ calls = 20:1 — đặc trưng N+1.
- Artifact 3: code {{p.getReviews().stream()}} trong {{map}} — lazy load kích hoạt trong vòng lặp. OSIV ({{open-in-view=true}}) giữ session mở cho phép lazy load ở tầng controller.
### Cách sửa
**Ngắn hạn (hôm nay):**
1. **@BatchSize(size = 20)** trên trường {{reviews}} của entity {{Product}} (hoặc trên class {{Review}} cho quan hệ @ManyToOne ngược): Hibernate gom 20 proxy chưa load thành 1 câu {{WHERE product_id IN (...)}}. Từ 21 câu → **2 câu** (1 products + 1 reviews IN). Cách này ít thay đổi code nhất, giữ entity graph, nhưng vẫn 2 round-trip.
2. **DTO projection** (khuyên dùng): Viết query trực tiếp trả DTO, không load entity {{Product}} và {{Review}}.
~~~java
@Query("select new com.shopeasy.product.ProductDto(p.id, p.name, p.price, " +
       "  (select json_agg(json_build_object('rating', r.rating, 'comment', r.comment) " +
       "   from (select * from reviews r2 where r2.product_id = p.id order by r2.created_at desc limit 3) r) " +
       ") as recentReviews, " +
       "  (select avg(r3.rating) from reviews r3 where r3.product_id = p.id) as avgRating) " +
       "from Product p where p.featured = true order by p.createdAt desc")
Page<ProductDto> findFeaturedDto(Pageable pageable);
~~~
→ **1 câu duy nhất**, dùng subquery + json_agg (PostgreSQL) để gom 3 review mới nhất và avg rating. Không N+1, không load entity, không Cartesian product.

**Dài hạn:**
- Luôn dùng **DTO projection** cho các API đọc danh sách có quan hệ con.
- Bật {{spring.jpa.open-in-view=false}} để phát hiện lazy load ngoài transaction (ném {{LazyInitializationException}}).
- Giám sát: bật {{hibernate.generate_statistics=true}}, alert khi **số câu SQL / request > 5**.
- Code review: cấm truy cập collection LAZY trong stream/map ngoài @Transactional (hoặc dùng fetch plan tường minh).

### So sánh các phương án
| Phương án | Số câu SQL | Cartesian product? | An toàn với LIMIT 3 con? | Đổi code nhiều? |
|---|---|---|---|---|
| JOIN FETCH | 1 | CÓ (nhân Product × Review) | KHÔNG (load hết review rồi lọc 3 ở Java, HHH000104) | Vừa |
| @EntityGraph | 1 | CÓ | KHÔNG (tương tự JOIN FETCH) | Vừa |
| @BatchSize(20) | 2 | KHÔNG | CÓ (giữ ORDER BY LIMIT ở câu IN) | Ít |
| DTO projection (subquery/json_agg) | 1 | KHÔNG | CÓ (xử lý ở DB) | Nhiều |

> Senior tip: **JOIN FETCH trên collection @OneToMany là bẫy**: nó nhân bản dòng cha (Cartesian product) và Hibernate 6 vẫn cảnh báo HHH000104 khi dùng với phân trang — planner load tất cả con vào bộ nhớ rồi mới cắt trang. Với API danh sách có LIMIT trên con (như "3 review mới nhất"), **DTO projection với subquery/json_agg là an toàn nhất**. Nếu không dùng được JSON, @BatchSize là giải pháp "ít code nhất" vẫn đúng ngữ nghĩa. Luôn đo **số câu SQL/request** thay vì đo latency từng câu.`,
  rubric: [
    'Nhận diện đúng N+1: 1 câu products + 20 câu reviews = 21 câu cho 1 request, khác với lab-sql-019 ở chỗ câu con có ORDER BY + LIMIT',
    'Dẫn chứng đúng: log 21 statements, pg_stat_statements calls 180.000 vs 9.000 (tỉ lệ 20:1), code p.getReviews() trong stream map',
    'Giải thích rủi ro JOIN FETCH/@EntityGraph: nhân bản dòng Product (Cartesian product), phá vỡ LIMIT 3 con (HHH000104), không an toàn',
    'Đề xuất sửa đúng: @BatchSize (ngắn hạn, 2 câu, giữ LIMIT), DTO projection với subquery/json_agg (dài hạn, 1 câu, an toàn nhất)',
    'Có monitoring/guardrail: hibernate.generate_statistics, alert SQL/request > 5, tắt open-in-view, code review fetch plan',
  ],
  tags: ['postgresql', 'n-plus-one', 'hibernate', 'lazy-loading', 'batch-size', 'dto-projection', 'json-agg'],
},
{
  id: 'lab-sql-022',
  category: 'sql',
  title: 'Connection pool cạn do @Transactional trên @Scheduled job xử lý file lớn',
  level: 'senior',
  scenario: `**Bối cảnh.** Hệ thống ngân hàng số **FinCore** chạy {{batch-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6, HikariCP {{maximumPoolSize=15}}). Mỗi ngày lúc 02:00, job {{@Scheduled(cron = "0 0 2 * * ?")}} đọc file CSV đối soát từ đối tác (khoảng **500.000 dòng**, ~50 MB), parse từng dòng, và upsert vào bảng {{reconciliation}} — toàn bộ logic nằm trong một method có annotation {{@Transactional}}.
  **Triệu chứng (17/03/2026, 02:05).** Từ lúc job bắt đầu, toàn bộ service khác dùng chung pool (API thanh toán, truy vấn số dư) bị lỗi {{HikariPool-1 - Connection is not available, request timed out after 3000ms}}. CPU RDS chỉ **12%** (DB rảnh), nhưng {{pg_stat_activity}} cho thấy **1 session** của batch-service ở trạng thái **{{idle in transaction}}** giữ connection hàng phút ({{xact_age}} tăng đều). Job xử lý xong sau **18 phút**, lúc đó pool mới giải phóng.
  **Điều đã thử, không ăn.** Tăng {{maximumPoolSize}} từ 15 lên 30 (job vẫn chiếm 1 connection trong 18 phút, các service khác vẫn chờ khi job chạy), tách Hikari pool riêng cho batch (yêu cầu đổi cấu hình, chưa kịp).
  **Việc bạn có.** Ba artifact: log HikariCP, ảnh chụp {{pg_stat_activity}} lúc 02:05, và đoạn mã Java hiện tại. Hãy tìm nguyên nhân gốc, giải thích vì sao một connection bị "treo" 18 phút dù chỉ chạy INSERT/UPSERT nhanh, và đề xuất cách sửa (tách transaction theo lô, {{idle_in_transaction_session_timeout}}, tách pool).`,
  artifacts: [
    {
      name: 'hikaricp-batch.log',
      lang: 'text',
      content: `2026-03-17 02:00:00.112 INFO  [scheduling-1] c.f.batch.ReconciliationJob      : Start daily reconciliation, file=recon_20260316.csv (500000 lines)
2026-03-17 02:00:00.115 DEBUG [scheduling-1] org.hibernate.SQL :
    insert into reconciliation (id, batch_id, partner_id, amount, status, created_at) values (?,?,?,?,?,?)
    on conflict (batch_id, partner_id) do update set amount=excluded.amount, status=excluded.status
-- (1) Upsert dòng 1, 2 ms
2026-03-17 02:00:00.120 DEBUG [scheduling-1] org.hibernate.SQL :
    insert into reconciliation ... on conflict ...
-- (2) Upsert dòng 2, 1 ms
-- ... (mẫu lặp lại cho 500.000 dòng, mỗi upsert ~1-2 ms)
2026-03-17 02:00:05.432 WARN  [http-nio-8080-exec-3] com.zaxxer.hikari.pool.HikariPool :
    HikariPool-1 - Connection is not available, request timed out after 3000ms.
    (total=15, active=15, idle=0, waiting=12)
2026-03-17 02:00:05.433 ERROR [http-nio-8080-exec-3] c.f.payment.PaymentController :
    Failed to acquire JDBC Connection; nested exception is java.sql.SQLTransientConnectionException:
    HikariPool-1 - Connection is not available, request timed out after 3000ms.
2026-03-17 02:00:10.118 WARN  [http-nio-8080-exec-7] com.zaxxer.hikari.pool.HikariPool :
    HikariPool-1 - Connection is not available, request timed out after 3000ms.
    (total=15, active=15, idle=0, waiting=28)
-- Lặp lại 02:00-02:18: pool cạn liên tục, waiting queue tăng. total=15, active=15 = 1 connection bị job chiếm, 14 connection khác bị các thread HTTP chiếm (nhưng các thread HTTP cũng bị chờ vì pool cạn).
2026-03-17 02:18:03.211 INFO  [scheduling-1] c.f.batch.ReconciliationJob      : Finished daily reconciliation in 1083 seconds (500000 rows)
2026-03-17 02:18:03.215 DEBUG [scheduling-1] org.hibernate.SQL :
    commit
-- Transaction commit sau 18 phút. Pool hồi phục ngay sau đó.`,
    },
    {
      name: 'pg-stat-activity-batch.txt',
      lang: 'text',
      content: `-- 2026-03-17 02:05:00 +07, RDS fincore-primary (PostgreSQL 15.6)
fincore=# SELECT pid, usename, application_name, state,
       now() - xact_start AS xact_age,
       now() - state_change AS idle_age,
       wait_event_type, wait_event,
       left(query, 80) AS last_query
FROM pg_stat_activity
WHERE datname = 'fincore' AND application_name = 'batch-service'
ORDER BY xact_start;

   pid  | usename | application_name |        state        |  xact_age   |  idle_age   | wait_event_type |  wait_event   |                     last_query
--------+---------+------------------+---------------------+-------------+-------------+-----------------+---------------+-------------------------------------------------
  18421 | batch   | batch-service    | idle in transaction | 00:05:00.112| 00:04:58.200| Client          | ClientRead    | insert into reconciliation ... on conflict ...
-- (tổng 1 session của batch-service: duy nhất 1 thread scheduling-1 chạy job, giữ 1 connection)
-- "idle in transaction": session đã BEGIN, chạy xong câu SQL cuối (upsert dòng n) nhưng CHƯA COMMIT
--   và đang chờ client (Java) gửi dòng tiếp theo. wait_event ClientRead = DB chờ ứng dụng.
-- xact_age = 5 phút (tăng đều theo thời gian job chạy), idle_age ≈ xact_age - thời gian thực thi SQL.
-- 14 session khác của payment-service/api-service cũng ở idle in transaction (đang chờ pool có connection).`,
    },
    {
      name: 'ReconciliationJob.java',
      lang: 'text',
      content: `@Service
public class ReconciliationJob {
    private final ReconciliationRepository repo;
    private final CsvParser csvParser;

    public ReconciliationJob(ReconciliationRepository repo, CsvParser csvParser) {
        this.repo = repo;
        this.csvParser = csvParser;
    }

    @Scheduled(cron = "0 0 2 * * ?")
    @Transactional // (1) Mở transaction DB và GIỮ 1 connection từ HikariCP cho TOÀN BỘ job (18 phút)
    public void runDailyReconciliation() {
        String batchId = "RECON-" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        Path file = Paths.get("/data/inbound/recon_" + LocalDate.now().minusDays(1).format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv");

        // (2) Mở file, đọc streaming (không load hết vào RAM)
        try (Stream<String> lines = Files.lines(file)) {
            lines.skip(1) // bỏ header
                 .forEach(line -> {
                     // (3) Parse dòng CSV -> object
                     ReconciliationRecord rec = csvParser.parse(line);
                     rec.setBatchId(batchId);

                     // (4) Upsert từng dòng: INSERT ... ON CONFLICT DO UPDATE
                     //     Mỗi upsert ~1-2 ms, NHƯNG nằm trong CÙNG transaction mở ở (1)
                     repo.upsert(rec);
                 });
        } catch (IOException e) {
            throw new RuntimeException("Read reconciliation file failed", e);
        }
        // (5) Method kết thúc -> Spring commit transaction -> connection trả về HikariCP
        //     Nhưng method chạy 18 phút -> connection bị chiếm 18 phút!
    }
}

// ReconciliationRepository.java
public interface ReconciliationRepository extends JpaRepository<Reconciliation, String> {
    @Modifying
    @Query("insert into reconciliation (id, batch_id, partner_id, amount, status, created_at) " +
           "values (:id, :batchId, :partnerId, :amount, :status, :createdAt) " +
           "on conflict (batch_id, partner_id) do update set amount = :amount, status = :status")
    void upsert(ReconciliationRecord rec);
}`,
    },
  ],
  questions: [
    'Nguyên nhân gốc khiến connection pool cạn là gì? Giải thích mối liên hệ giữa {{@Transactional}} trên @Scheduled job, việc giữ connection 18 phút, và trạng thái {{idle in transaction}} trong {{pg_stat_activity}}.',
    'Dẫn chứng từ artifact: chỉ ra pool cạn (total/active/idle/waiting), session batch {{idle in transaction}} (xact_age 5 phút tại thời điểm chụp, tăng đều 18 phút), và đoạn code nào giữ transaction trong lúc đọc file/parse CSV.',
    'Bạn sửa thế nào để không giữ connection DB khi xử lý file lớn? Trình bày cách: (a) tách transaction theo lô (batch), commit sau mỗi N dòng; (b) dùng Spring Batch chunk-oriented processing; (c) tách Hikari pool riêng cho batch; (d) đặt {{idle_in_transaction_session_timeout}} an toàn.',
  ],
  hints: [
    'Trong Spring, {{@Transactional}} giữ một connection JDBC suốt phạm vi method (từ BEGIN đến COMMIT/ROLLBACK). Job đọc file 500.000 dòng, parse và upsert trong vòng lặp forEach — toàn bộ 18 phút nằm trong CÙNG transaction.',
    '{{idle in transaction}} + {{wait_event ClientRead}} nghĩa là PostgreSQL đã xong câu SQL cuối (upsert dòng n) và đang chờ client gửi lệnh tiếp/COMMIT — DB rảnh (CPU 12%) nhưng connection bị chiếm. {{idle_in_transaction_session_timeout = 0}} nên DB không tự cắt.',
    'Tách transaction: commit sau mỗi 1.000 dòng (hoặc dùng Spring Batch chunk size 1.000). Hoặc: đọc file -> biến đổi -> ghi file tạm -> {{COPY}} vào bảng staging (nhanh, không transaction dài) -> transaction ngắn merge staging vào bảng chính. Tách pool: cấu hình DataSource riêng cho batch-service. Guardrail: {{idle_in_transaction_session_timeout = 5min}} cho role ứng dụng (trừ batch role).',
  ],
  answer: `**Tóm tắt:** Job {{@Scheduled}} có annotation {{@Transactional}} chạy 18 phút xử lý 500.000 dòng CSV. Toàn bộ vòng lặp upsert nằm trong **một transaction duy nhất** → **1 connection Hikari bị chiếm 18 phút**. Trong lúc đó, pool {{maximumPoolSize=15}} chỉ còn 14 connection cho các service khác (payment, API), nên các request HTTP bị timeout chờ connection. {{pg_stat_activity}} cho thấy session batch ở {{idle in transaction}} với {{xact_age}} tăng đều (5 phút lúc chụp, 18 phút khi xong), {{wait_event ClientRead}} = DB chờ Java đọc file/parse. CPU RDS 12% vì DB gần như không làm gì — connection bị "ngồi chờ" ứng dụng. Sửa: tách transaction theo lô (commit sau 1.000 dòng), hoặc dùng Spring Batch chunk / COPY staging, tách pool riêng cho batch, đặt {{idle_in_transaction_session_timeout}}.
### Nguyên nhân gốc, từng bước
1. Method {{runDailyReconciliation}} có {{@Transactional}} + {{@Scheduled}}. Spring mở transaction (BEGIN) và lấy 1 connection từ HikariCP khi method bắt đầu.
2. Vòng lặp {{lines.forEach(...)}} đọc 500.000 dòng CSV, parse, và gọi {{repo.upsert(rec)}} cho từng dòng. Mỗi upsert ~1-2 ms, **nhưng không commit** — cùng transaction.
3. Java dành phần lớn thời gian cho **I/O file (Files.lines) + parse CSV**, không phải SQL. Trong lúc này, transaction đã mở, connection bị giữ, PostgreSQL thấy session ở {{idle in transaction}} (đã xong câu SQL, chờ lệnh tiếp).
4. 18 phút sau, method kết thúc, Spring commit transaction, connection trả về pool.
5. Trong 18 phút đó: pool 15 connection, 1 bị job chiếm → 14 cho các service khác. Request payment/API vào lúc 02:00-02:18 đều tranh giành 14 connection, waiting queue tăng, timeout 3 giây → 504.
### Dẫn chứng
- Artifact 1 (HikariCP log): **total=15, active=15, idle=0, waiting=12** lúc 02:00:05 (chỉ 5 phút sau job bắt đầu). Pool cạn liên tục 02:00-02:18. Job log: **Finished ... in 1083 seconds (18 phút)**. Commit chỉ ở cuối.
- Artifact 2 (pg_stat_activity): session batch **pid 18421, state = idle in transaction, xact_age = 00:05:00, wait_event = ClientRead**. Chỉ 1 session batch (1 thread scheduling-1). xact_age tăng đều theo thời gian job chạy.
- Artifact 3 (code): {{@Transactional}} trên method {{runDailyReconciliation}}. Vòng lặp {{forEach}} trong try-with-resources đọc file streaming. {{repo.upsert}} gọi native query upsert. Toàn bộ 18 phút trong 1 transaction.
### Cách sửa
**Ngắn hạn (hôm nay):**
1. **Tách transaction theo lô (batch commit):** Commit sau mỗi N dòng (ví dụ 1.000). Dùng {{PlatformTransactionManager}} thủ công hoặc {{@Transactional(propagation = Propagation.REQUIRES_NEW)}} trên method upsert lô.
~~~java
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void upsertBatch(List<ReconciliationRecord> batch) {
    batch.forEach(repo::upsert);
}

// Trong job:
List<ReconciliationRecord> batch = new ArrayList<>(1000);
lines.skip(1).forEach(line -> {
    batch.add(csvParser.parse(line));
    if (batch.size() >= 1000) {
        upsertBatch(batch);
        batch.clear();
    }
});
if (!batch.isEmpty()) upsertBatch(batch);
~~~
→ Connection chỉ bị giữ trong vài trăm ms mỗi lô, trả về pool giữa các lô. Pool không cạn.

2. **Đặt {{idle_in_transaction_session_timeout}} cho role ứng dụng (trừ batch role):**
~~~sql
ALTER ROLE fincore_app SET idle_in_transaction_session_timeout = '5min';
-- Cho batch role: ALTER ROLE fincore_batch SET idle_in_transaction_session_timeout = '30min';
~~~
→ Nếu code quên commit, DB tự kill session sau 5 phút, giải phóng connection.

**Dài hạn:**
3. **Spring Batch chunk-oriented processing:** Khai báo {{Step}} với {{chunkSize(1000)}}, {{ItemReader}} đọc CSV, {{ItemProcessor}} parse, {{ItemWriter}} upsert lô. Spring Batch tự quản transaction cho mỗi chunk, có retry/skip/restart, metrics.
4. **COPY vào bảng staging + merge nhanh:** Đọc CSV -> ghi file tạm (hoặc pipe) -> {{COPY reconciliation_staging FROM STDIN}} (thường < 10 giây cho 500k dòng) -> transaction ngắn {{INSERT ... SELECT ... ON CONFLICT FROM reconciliation_staging}}. {{COPY}} không cần transaction dài, nhanh hơn upsert từng dòng gấp 100 lần.
5. **Tách Hikari pool riêng cho batch:** Cấu hình {{DataSource}} riêng ({{batch.datasource.*}}) với pool size nhỏ (5-10), không chia sẻ với API service. Batch chạy 18 phút không ảnh hưởng pool chính.
6. **Guardrail:** Alert khi có session {{idle in transaction}} > 5 phút (trừ batch role). Metric {{hikaricp.connections.active}} không được bằng {{maximumPoolSize}} quá 1 phút.

### Lỗi hay gặp
- Nghĩ "upsert nhanh 1-2 ms thì transaction cũng nhanh": quên thời gian Java đọc file/parse giữa các upsert.
- {{@Transactional}} trên @Scheduled method: anti-pattern kinh điển — method chạy lâu (batch, report, sync) **không được** bọc trong @Transactional.
- Tăng pool size để "chữa": chỉ trì hoãn vấn đề, job vẫn chiếm 1 connection trong 18 phút, tăng pool chỉ làm DB chấp nhận thêm connection khác (có thể vượt {{max_connections}}).

### Trả lời miệng 1 phút
"Job @Scheduled có @Transactional chạy 18 phút xử lý 500k dòng CSV. Toàn bộ vòng lặp upsert trong 1 transaction → 1 connection Hikari bị chiếm 18 phút. Pool 15 connection, 14 còn lại cho API payment → timeout 3 giây, 504. pg_stat_activity thấy session batch idle in transaction, xact_age tăng đều 18 phút, wait_event ClientRead = DB chờ Java đọc file. CPU 12% vì DB rảnh. Sửa: commit theo lô 1.000 dòng (PlatformTransactionManager hoặc Spring Batch chunk), hoặc COPY vào staging rồi merge nhanh, tách pool riêng cho batch, đặt idle_in_transaction_session_timeout = 5 phút cho role ứng dụng."

> Senior tip: **@Transactional trên method chạy lâu (batch, sync, report) là anti-pattern số 1 gây cạn connection pool**. Nguyên tắc: transaction chỉ bao quanh **ghi DB**, không bao quanh **đọc file, parse, gọi HTTP, sleep**. Nếu phải xử lý 500k dòng: dùng Spring Batch (chunk + transaction per chunk) hoặc COPY staging. Và luôn đặt idle_in_transaction_session_timeout — nó biến một bug "quên commit" chạy 18 phút thành một sự cố tự giải quyết sau 5 phút.`,
  rubric: [
    'Chính xác nguyên nhân: @Transactional trên @Scheduled job giữ 1 connection 18 phút (toàn bộ đọc file + parse + upsert trong 1 transaction), pool 15 connection cạn',
    'Dẫn chứng đúng: HikariCP total=15/active=15/idle=0/waiting>0, pg_stat_activity idle in transaction xact_age tăng đều, code @Transactional trên runDailyReconciliation + forEach trong transaction',
    'Giải thích đúng idle in transaction + ClientRead = DB chờ ứng dụng (đọc file/parse), không phải ứng dụng chờ DB',
    'Đề xuất sửa đầy đủ: batch commit (PlatformTransactionManager/REQUIRES_NEW), Spring Batch chunk, COPY staging + merge, tách pool riêng, idle_in_transaction_session_timeout',
    'Phân biệt rõ: tăng pool size chỉ trì hoãn, không giải quyết gốc; anti-pattern @Transactional trên long-running method',
  ],
  tags: ['postgresql', 'connection-pool', 'transaction', 'idle-in-transaction', 'batch', 'spring-batch', 'scheduled', 'copy'],
},
{
  id: 'lab-sql-023',
  category: 'sql',
  title: 'Báo cáo đơn hàng sau khi bảng lên 50 triệu dòng: index (status, created_at) bị bỏ qua vì lower() và ép kiểu',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử **MegaMarket** vận hành service {{order-analytics}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM, storage gp3 1 TB). Bảng {{orders}} lưu đơn hàng của toàn bộ seller: sau 4 năm đã có **50.318.904 dòng** (~11 GB heap + 9,2 GB index). Giờ cao điểm 09:00–11:00 hệ thống xử lý 3.000 giao dịch/giây; bảng nhận thêm ~2.500 dòng/giây.

**Triệu chứng (14/03/2026, 09:25).** Màn hình "Báo cáo đơn hàng theo trạng thái" gọi {{GET /api/v1/reports/orders?date=2026-03-14}}. p95 từ 220 ms nhảy lên **41 giây**, gateway trả 504, CPU RDS chạm 99%. DBA chạy EXPLAIN ANALYZE và thấy **Seq Scan toàn bảng 50,3 triệu dòng** dù index {{idx_orders_status_created}} (btree trên (status, created_at)) đã tồn tại từ tháng trước. Sau khi dev "vá" một lỗi cú pháp bằng cách thêm lower() vào điều kiện, query không dùng index nữa. Một endpoint khác (tra cứu theo mã đơn) cũng bị chậm vì ép kiểu cột.

**Việc bạn có.** Ba artifact dưới đây lấy từ production lúc 09:26–09:31. Hãy tìm nguyên nhân gốc, chứng minh bằng dòng lệnh trong artifact, và đề xuất cách sửa (index phù hợp, sửa điều kiện, ANALYZE, keyset pagination).`,
  artifacts: [
    {
      name: 'explain-orders-report.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:26:05 +07, psql trên RDS megamarket-primary (PostgreSQL 15.6)
      megamarket=# EXPLAIN (ANALYZE, BUFFERS)
      SELECT status, count(*), sum(total_amount) AS total
      FROM orders
      WHERE lower(status) = lower('Shipped')
        AND created_at >= '2026-03-14 00:00:00+07'::timestamptz
      GROUP BY status;
                                                                           QUERY PLAN
      -------------------------------------------------------------------------------------------------------------------------------------------------
       HashAggregate  (cost=2841521.44..2841521.48 rows=1 width=40) (actual time=40118.331..40118.336 rows=1 loops=1)
         Group Key: status
         Batches: 1  Memory Usage: 24kB
         Buffers: shared hit=631204 read=38912
         ->  Seq Scan on orders  (cost=0.00..2839895.61 rows=501802 width=40) (actual time=39872.114..40115.902 rows=10234 loops=1)
               Filter: ((lower(status) = lower('Shipped'::text)) AND (created_at >= '2026-03-14 00:00:00+07'::timestamp with time zone))
               Rows Removed by Filter: 50308670
               Buffers: shared hit=631204 read=38912
         Planning Time: 0.312 ms
         Execution Time: 40122.419 ms
      (9 rows)
      
      Time: 40122.801 ms
      
      -- So sánh: cùng câu, bỏ lower() trên cột, bind tham số đã lower ở ứng dụng:
      megamarket=# EXPLAIN (ANALYZE, BUFFERS)
      SELECT status, count(*), sum(total_amount) AS total
      FROM orders
      WHERE status = 'shipped'
        AND created_at >= '2026-03-14 00:00:00+07'::timestamptz
      GROUP BY status;
                                                                           QUERY PLAN
      -------------------------------------------------------------------------------------------------------------------------------------------------
       HashAggregate  (cost=1482.31..1482.35 rows=1 width=40) (actual time=28.441..31.208 rows=1 loops=1)
         Group Key: status
         Batches: 1  Memory Usage: 24kB
         Buffers: shared hit=184 read=14
         ->  Index Scan using idx_orders_status_created on orders  (cost=0.57..1479.54 rows=10240 width=40) (actual time=0.041..27.811 rows=10234 loops=1)
               Index Cond: ((status = 'shipped'::character varying) AND (created_at >= '2026-03-14 00:00:00+07'::timestamp with time zone))
               Buffers: shared hit=184 read=14
         Planning Time: 0.241 ms
         Execution Time: 31.519 ms
      (8 rows)
      
      Time: 31.902 ms`,
    },
    {
      name: 'explain-order-detail.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:28:12 +07, endpoint GET /api/v1/orders/{orderId} — tra cứu theo mã đơn (order_code)
      -- Java nhận path variable là Long; cột order_code kiểu varchar(20) chứa mã đơn chỉ gồm chữ số
      megamarket=# EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, order_code, customer_id, status, total_amount
      FROM orders
      WHERE order_code::bigint = 20260314004281;
                                                                              QUERY PLAN
      -----------------------------------------------------------------------------------------------------------------------------------------------------
       Seq Scan on orders  (cost=0.00..2839895.61 rows=501802 width=56) (actual time=0.027..39981.221 rows=1 loops=1)
         Filter: ((order_code)::bigint = 20260314004281::bigint)
         Rows Removed by Filter: 50318902
         Buffers: shared hit=631204 read=38912
         Planning Time: 0.298 ms
         Execution Time: 39982.104 ms
      (6 rows)
      
      Time: 39982.501 ms
      
      -- Trích app.log ngày 13/03 (trước khi dev "vá", lúc 07:14:08):
      --   ERROR:  operator does not exist: character varying = bigint
      --   LINE 1: where order_code = ?
      --                      ^
      --   HINT:  No operator matches the given name and argument type. You might need to add explicit type casts.
      -- Sau khi vá: HTTP 200 trả về đúng đơn, nhưng mỗi request vẫn tiêu ~40 giây CPU của RDS.`,
    },
    {
      name: 'schema-orders.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:29:40 +07, RDS megamarket-primary
      megamarket=# \\d+ orders
                                             Table "public.orders"
         Column         |           Type           | Collation | Nullable |      Default      | Storage  | Stats target |                Description
      --------------+--------------------------+-----------+----------+-------------------+----------+--------------+-----------------------------------------
       id            | bigint                   |           | not null |                   | plain    |              |
       order_code    | character varying(20)    |           | not null |                   | extended |              | mã đơn chỉ gồm chữ số
       customer_id   | bigint                   |           | not null |                   | plain    |              |
       status        | character varying(16)    |           | not null |                   | extended |              |
       total_amount  | numeric(14,2)           |           | not null |                   | main     |              |
       created_at    | timestamp with time zone |           | not null | now()             | plain    |              |
      Indexes:
         "idx_orders_status_created" btree (status, created_at DESC)
         "orders_pkey" PRIMARY KEY, btree (id)
      
      megamarket=# SELECT reltuples::bigint AS est_rows,
                     pg_size_pretty(pg_total_relation_size('orders')) AS total_size,
                     pg_size_pretty(pg_relation_size('orders')) AS heap_only
      FROM pg_class WHERE relname = 'orders';
         est_rows | total_size | heap_only
      -----------+------------+-----------
      50318904  | 13420 MB   | 11003 MB
      
      megamarket=# SELECT indexrelname, idx_scan, idx_tup_read
      FROM pg_stat_user_indexes WHERE relname = 'orders';
            indexrelname             | idx_scan | idx_tup_read
      -----------------------------+----------+-------------
       idx_orders_status_created      |   88412  |   3120455
       orders_pkey                    | 42110088 |  42110088`,
    },
  ],
  questions: [
    'Vì sao câu báo cáo phải quét 50 triệu dòng dù index idx_orders_status_created (status, created_at) đã tồn tại? Chỉ ra bằng dòng nào trong plan.',
    'Câu tra cứu order_code gặp lỗi gì trước đây và vì sao cách "vá" bằng cast lại khiến plan tệ hơn? So sánh với câu báo cáo: đây là hai hiện tượng một nguyên nhân.',
    'Bạn xử lý tình huống này thế nào trong ngày 14/03 (giảm thiểu ngay), và thiết kế lại thế nào để không tái diễn (index, chuẩn hóa dữ liệu, keyset pagination, monitoring)?',
  ],
  hints: [
    'Đọc dòng "Filter:" của cả hai EXPLAIN: filter nào là hằng số thuần, filter nào bọc hàm lower() hoặc ép kiểu quanh cột?',
    'So sánh "Execution Time" của câu (1) với câu (2): cùng bảng, cùng index, chỉ khác cách viết điều kiện — chênh lệch bao nhiêu lần?',
    'Nguyên tắc "sargable": index chỉ dùng được khi vế so sánh là cột trần với hằng số. lower() là IMMUTABLE (có thể dùng trong expression index) nhưng bọc hàm quanh cột vẫn làm mất khả năng dùng index btree thô; cast ::bigint trên varchar cũng làm mất index.',
  ],
  answer: `**Tóm tắt:** Cả hai endpoint đều vi phạm nguyên tắc "sargable" — cột trong điều kiện bị bọc hàm ({{lower(status)}}) hoặc bị ép kiểu ({{order_code::bigint}}) — nên PostgreSQL không dùng index {{idx_orders_status_created}} mà quét tuần tự toàn bộ 50.318.904 dòng. Mỗi lần gọi báo cáo tốn ~40 giây CPU; hàng chục lần gọi song song (cộng retry khi timeout) đốt cạn 8 vCPU của RDS. Sửa ngay bằng cách viết điều kiện cột trần với tham số đã chuẩn hóa, bỏ cast trên cột, ANALYZE; sửa lâu dài bằng chuẩn hóa kiểu dữ liệu, keyset pagination và monitoring theo rows examined/returned.

### Nguyên nhân gốc
1. **Câu báo cáo.** Điều kiện {{lower(status) = lower('Shipped')}} bọc hàm quanh cột. Planner chỉ dùng được index khi vế phải là hằng số và vế trái là cột trần; bọc hàm là biểu thức, không tương đương với {{status}}, nên index không dùng được → Seq Scan toàn bảng.
2. **Câu tra cứu mã đơn.** Cột {{order_code}} kiểu {{varchar(20)}} nhưng Java truyền tham số {{Long}}. Ban đầu PostgreSQL báo lỗi "operator does not exist: character varying = bigint"; dev "vá" bằng cách ép kiểu ở **vế cột**: {{order_code::bigint = 20260314004281}}. Cast đặt ở vế cột lại phá index (index được build trên giá trị varchar của {{order_code}}, không phải trên {{order_code::bigint}}), nên thành Seq Scan — trước đó câu lỗi ngay lập tức, nay "chạy được" nhưng quét cả bảng (40 giây) cho một phép tìm điểm.
3. **Hệ số khuếch đại.** Endpoint báo cáo không có cache, không rate-limit; client timeout 30 giây rồi retry trong khi câu cũ vẫn chạy tiếp trên DB, nên số câu chạy song song cứ tăng. CPU 99% là hệ quả của việc quét lãng phí, không phải của tải thật.

### Dẫn chứng
- Artifact 1, câu (1): dòng **"Filter: ((lower(status) = lower('Shipped'::text)) AND ...)"** cho thấy điều kiện là biểu thức, không phải cột trần; dòng **"Seq Scan on orders"** xác nhận index không được dùng; **"Rows Removed by Filter: 50308670"** nghĩa là 50.308.670 dòng bị đọc rồi loại bỏ (tổng 50.318.904 − 10.233 dòng khớp); **"Buffers: shared hit=631204 read=38912"** — đọc toàn bộ ~670 nghìn page của heap; **"Execution Time: 40122.419 ms"**.
- Artifact 1, câu (2): cùng bảng, cùng câu hỏi, chỉ đổi điều kiện sang so sánh cột thô → **"Index Scan using idx_orders_status_created"**, **"Buffers: shared hit=184 read=14"**, **"Execution Time: 31.519 ms"**. Chênh lệch 40122/31,5 ≈ **1.270 lần** chỉ vì cách viết điều kiện. Index đã có sẵn và hoạt động tốt — vấn đề không phải "thiếu index".
- Artifact 2: **"Filter: ((order_code)::bigint = ...)"**, **"Rows Removed by Filter: 50318902"**, kết quả **rows=1** — 39,98 giây CPU để trả về một đơn hàng.
- Artifact 3: index {{idx_orders_status_created}} (btree trên (status, created_at DESC)) **đã tồn tại** và có idx_scan = 88.412 lần (các câu viết đúng); thống kê cho thấy bảng có 50.318.904 dòng, heap ~11 GB.

### Cách sửa ngắn hạn (trong ngày 14/03)
- Sửa query báo cáo: viết {{WHERE status = :status}} với tham số đã chuẩn hóa ở ứng dụng (Java: {{status.toLowerCase()}} trước khi bind), dùng khoảng thời gian nửa mở trên cột thô, luôn bind parameter, chốt múi giờ nghiệp vụ một lần ở tầng ứng dụng.
- Sửa câu tra cứu mã đơn: truyền tham số dạng String ({{String.valueOf(orderCode)}}) để so sánh thẳng với cột {{varchar}} — hoặc nếu giữ Long thì ép kiểu ở **vế tham số**: {{WHERE order_code = CAST(:ref AS varchar)}}; index được dùng lại ngay.
- Dừng bão hoà: tắt tạm endpoint báo cáo, đặt rate-limit hoặc cache 5 phút; đặt {{statement_timeout}} cho role báo cáo (ví dụ 30 giây) để câu bị bỏ rơi không chạy tiếp trên DB.
- Dọn query đang chạy: dùng {{pg_cancel_backend}} cho các pid đang quét bảng.

### Cách sửa dài hạn
- **Chuẩn hóa kiểu dữ liệu:** đổi {{order_code}} sang {{bigint}} (chỉ chứa chữ số) và code truyền Long. Với bảng 50 triệu dòng phải theo mô hình expand/contract: thêm cột mới, backfill theo lô, dual-write, đổi index rồi mới drop cột tuyệt đối không {{ALTER TABLE ... TYPE}} trực tiếp.
- **Index phù hợp:** {{idx_orders_status_created}} đã đúng cho truy vấn theo status + created_at; chỉ cần query viết đúng. Nếu cần tìm không phân biệt hoa thường mà không thể sửa query: tạo **expression index** {{CREATE INDEX idx_orders_lower_status_created ON orders (lower(status), created_at)}} — {{lower()}} là IMMUTABLE với collation C (default PostgreSQL), có thể dùng; sau đó {{ANALYZE orders}}.
- **Keyset pagination:** thay vì {{OFFSET}} (phải đọc rồi vứt các dòng bị skip), dùng {{WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 50}} — chỉ đọc đúng 50 dòng mỗi trang, dù ở trang sâu.

### Phòng ngừa và monitoring
- Bật {{pg_stat_statements}} và dashboard theo dõi {{total_exec_time}} theo queryid; cảnh báo khi {{mean_exec_time}} > 1 giây hoặc {{calls}} tăng đột biến.
- Bật {{auto_explain}} với {{auto_explain.log_min_duration = 500}} để log lại plan của câu chậm; cảnh báo khi plan đổi từ "Index Scan" sang "Seq Scan" trên bảng lớn.
- Theo dõi chỉ số **rows examined / rows returned** (PostgreSQL: {{Rows Removed by Filter}}); đây là KPI phát hiện "query quét cả bảng nhưng trả về vài chục dòng".
- Theo dõi {{pg_stat_user_indexes.idx_scan = 0}} — index không được dùng là tín hiệu truy vấn đã đi lệch khỏi khuôn mẫu.
- Quy tắc review bắt buộc: trong {{WHERE}} không bọc hàm/cast lên cột; mọi query report phải kèm {{EXPLAIN (ANALYZE, BUFFERS)}} trong PR; thêm bài test hiệu năng với dữ liệu tỉ lệ production trong CI.

> Senior tip: dấu hiệu "query nhanh trên staging, chậm trên production" gần như luôn là **sai lệch tuyến tính theo số dòng**, tức plan đã đổi từ Index Scan sang Seq Scan. Ở đây index đã có sẵn và hoạt động tốt (31 ms) — vấn đề hoàn toàn nằm ở cách viết điều kiện. Nếu đo bằng {{EXPLAIN}} trên dữ liệu thật (không dùng {{LIMIT 100}} để "giả" plan), sẽ thấy ngay chỗ xấu. Kinh nghiệm ăn vào: đừng bao giờ để một dashboard quét bảng giao dịch gốc — tách bảng tổng hợp ra ngay từ đầu, chi phí nhỏ hơn nhiều so với cứu hỏa dữ liệu.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: điều kiện WHERE bọc hàm lower(status) hoặc cast order_code::bigint quanh cột làm mất khả năng dùng index (non-sargable), PostgreSQL chuyển sang Seq Scan toàn bảng 50,3 triệu dòng',
    'Dẫn chứng đúng các dòng số liệu trong artifact: Seq Scan + lower(status) trong Filter + Rows Removed by Filter 50.308.670 + Execution Time 40122 ms, và so sánh với câu dùng Index Scan 31 ms',
    'Giải thích đúng vì sao câu order_code bị mất index (cast đặt ở vế cột, index build trên order_code varchar) và vì sao đây là hậu quả của câu lỗi operator does not exist',
    'Đề xuất sửa đúng: điều kiện cột trần + tham số đã chuẩn hóa, bỏ cast ở vế cột / chuẩn hóa kiểu dữ liệu order_code, expression index lower(status) + ANALYZE, keyset pagination',
    'Có chiến lược dài hạn và monitoring cụ thể: bảng tổng hợp cho báo cáo, pg_stat_statements + auto_explain + alert theo rows examined, quy tắc review EXPLAIN trong PR',
  ],
  tags: ['postgresql', 'explain', 'index', 'sargable', 'seq-scan', 'lower', 'implicit-cast'],
},
{
  id: 'lab-sql-024',
  category: 'sql',
  title: 'Tìm kiếm tên sản phẩm dùng LIKE %abc% quét 12,4 triệu dòng: pg_trgm và cách làm việc với full-text search',
  level: 'senior',
  scenario: `**Bối cảnh.** Sách trực tuyến **BookHub** chạy {{catalog-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{books}} lưu danh mục sách của 3.000 nhà xuất bản: sau 6 năm đã có **12.418.550 dòng** (~5,2 GB heap + 2,8 GB index). Mỗi phút có khoảng 8.000 lần tìm kiếm qua endpoint {{GET /api/v1/books/search?q=java}}; ứng dụng chạy câu:
  ~~~sql
  SELECT id, title, price, author FROM books
  WHERE title ILIKE '%java%' OR description ILIKE '%java%'
  ORDER BY published_at DESC LIMIT 40;
  ~~~
  Index hiện có: {{idx_books_title}} btree trên {{title}}, {{idx_books_published}} btree trên {{published_at}}.

  **Triệu chứng (14/03/2026, 10:15).** p95 của endpoint search nhảy từ 340 ms lên **8,2 giây**, CPU RDS từ 20% lên 91%. DBA chạy EXPLAIN ANALYZE trên production và thấy **Seq Scan toàn bảng 12,4 triệu dòng** dù {{idx_books_title}} đã tồn tại. Một dev đề xuất "tạo thêm index trên description" — không ăn.

  **Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu tìm kiếm, schema + danh sách index, và log ứng dụng. Hãy chỉ ra vì sao index không được dùng và cách sửa đúng (pg_trgm GIN/GiST, tsvector, hoặc làm sạch dữ liệu).`,
  artifacts: [
    {
      name: 'explain-book-search.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:16:02 +07, psql trên RDS bookhub-primary (PostgreSQL 15.6)
      bookhub=# EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, title, price, author FROM books
      WHERE title ILIKE '%java%' OR description ILIKE '%java%'
      ORDER BY published_at DESC LIMIT 40;
                                                                                      QUERY PLAN
      --------------------------------------------------------------------------------------------------------------------------------------------------------
       Limit  (cost=0.00..2841521.44 rows=40 width=64) (actual time=0.021..8231.444 rows=40 loops=1)
         ->  Seq Scan on books  (cost=0.00..2839895.61 rows=12418550 width=64) (actual time=0.019..8228.902 rows=12418550 loops=1)
               Filter: ((title ILIKE '%java%'::text) OR (description ILIKE '%java%'::text))
               Rows Removed by Filter: 12418510
               Buffers: shared hit=1582040 read=120440
         Planning Time: 0.312 ms
         Execution Time: 8232.104 ms
      (7 rows)
      
      Time: 8232.520 ms
      
      -- So sánh: cùng câu, sau khi tạo pg_trgm index:
      bookhub=# EXPLAIN (ANALYZE, BUFFERS)
      SELECT id, title, price, author FROM books
      WHERE title ILIKE '%java%' OR description ILIKE '%java%'
      ORDER BY published_at DESC LIMIT 40;
                                                                                      QUERY PLAN
      --------------------------------------------------------------------------------------------------------------------------------------------------------
       Limit  (cost=28.45..312.44 rows=40 width=64) (actual time=0.041..78.912 rows=40 loops=1)
         ->  Bitmap Heap Scan on books  (cost=28.45..312.44 rows=40 width=64) (actual time=0.039..78.812 rows=40 loops=1)
               Recheck Cond: ((title ILIKE '%java%'::text) OR (description ILIKE '%java%'::text))
               Buffers: shared hit=184 read=12
               ->  BitmapOr  (cost=28.45..312.44 rows=40 width=0) (actual time=0.021..0.041 rows=40 loops=1)
                     ->  Bitmap Index Scan on idx_books_trgm  (cost=28.45..312.44 rows=40 width=0) (actual time=0.019..0.039 rows=40 loops=1)
                           Index Cond: (title ILIKE '%java%'::text)
                     ->  Bitmap Index Scan on idx_books_trgm  (cost=28.45..312.44 rows=40 width=0) (actual time=0.019..0.039 rows=40 loops=1)
                           Index Cond: (description ILIKE '%java%'::text)
         Planning Time: 0.412 ms
         Execution Time: 79.204 ms
      (9 rows)
      
      Time: 79.620 ms`,
    },
    {
      name: 'schema-and-index.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:17:05 +07
      bookhub=# \\d books
                                         Table "public.books"
       Column       |           Type           | Collation | Nullable |      Default      
      --------------+--------------------------+-----------+----------+-------------------
       id           | bigint                   |           | not null |                    
       title        | character varying(256)   |           | not null |                    
       author       | character varying(128)   |           | not null |                    
       description | text                     |           |          |                    
       price        | numeric(10,2)           |           | not null |                    
       published_at | timestamp with time zone |           | not null | now()             
      Indexes:
         "idx_books_title" btree (title)
         "idx_books_published" btree (published_at DESC)
         "books_pkey" PRIMARY KEY, btree (id)
      
      -- Danh sách index:
      bookhub=# SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'books';
            indexname          |                                   indexdef
      -------------------------+----------------------------------------------------------------
       idx_books_title         | CREATE INDEX idx_books_title ON public.books USING btree (title)
       idx_books_published     | CREATE INDEX idx_books_published ON public.books USING btree (published_at DESC)
       books_pkey              | CREATE UNIQUE INDEX books_pkey ON public.books USING btree (id)
      
      -- Kích thước bảng:
      bookhub=# SELECT reltuples::bigint AS est_rows,
                     pg_size_pretty(pg_relation_size('books')) AS heap,
                     pg_size_pretty(pg_total_index_size('books')) AS idx
      FROM pg_class WHERE relname = 'books';
         est_rows | heap    | idx
      -----------+---------+--------
      12418550  | 5182 MB | 2784 MB`,
    },
    {
      name: 'app-search-slow.log',
      lang: 'text',
      content: `2026-03-14 10:16:10.101 DEBUG [http-nio-8080-exec-22] o.h.SQL : select b1_0.id,b1_0.title,b1_0.price,b1_0.author from books b1_0 where b1_0.title ILIKE ? or b1_0.description ILIKE ? order by b1_0.published_at desc limit ?
2026-03-14 10:16:18.333 INFO  [http-nio-8080-exec-22] c.b.book.BookController : GET /api/v1/books/search?q=java -> 200 in 8234 ms
2026-03-14 10:16:19.440 DEBUG [http-nio-8080-exec-5] o.h.SQL : select b1_0.id,b1_0.title,b1_0.price,b1_0.author from books b1_0 where b1_0.title ILIKE ? or b1_0.description ILIKE ? order by b1_0.published_at desc limit ?
2026-03-14 10:16:27.681 INFO  [http-nio-8080-exec-5] c.b.book.BookController : GET /api/v1/books/search?q=java -> 200 in 8241 ms
-- pattern: mỗi request tìm kiếm mất khoảng 8,2 giây, không có request nào dưới 1 giây`,
    },
  ],
  questions: [
    'Vì sao index idx_books_title (đã tồn tại) không được dùng cho câu WHERE title ILIKE %java%? Chỉ ra bằng dòng trong EXPLAIN.',
    'So sánh với câu dùng pg_trgm (79 ms): đây là minh chứng gì cho nguyên tắc "sargable" và giới hạn của btree index với tìm kiếm tiền tố ẩn?',
    'Bạn sửa câu query và index thế nào để search về dưới 100 ms? Khi nào nên dùng pg_trgm (GIN/GiST), khi nào dùng tsvector (full-text search), và cần lưu ý gì về kích thước index và hiệu năng ghi?'],
  hints: [
    'Đọc dòng "Filter: ((title ILIKE %java%) OR (description ILIKE %java%))" trong EXPLAIN: ILIKE với tiền tố ẩn (%) ở đầu là "non-sargable" — btree chỉ hỗ trợ tiền tố cố định (LIKE abc%), không hỗ trợ %abc% hay ILIKE.',
    'Index chỉ được dùng khi điều kiện là cột so sánh với hằng số. Với LIKE %abc%, planner không thể dùng btree vì không biết đoạn abc nằm ở vị trí nào trong giá trị.',
    'pg_trgm: CREATE EXTENSION pg_trgm; CREATE INDEX ... USING gin (title gin_trgm_ops). GIN index lưu các tam ký (trigram) của từng từ, hỗ trợ ILIKE/LIKE cả hai phía. Tsvector dùng cho tìm kiếm từ khóa chính thống (tách từ, ranking).',
  ],
  answer: `**Tóm tắt:** Câu tìm kiếm viết {{WHERE title ILIKE '%java%' OR description ILIKE '%java%'}} — **tiền tố ẩn (%) ở đầu** — làm mất khả năng dùng index btree: planner không thể dùng {{idx_books_title}} (btree trên title) vì btree chỉ hỗ trợ tiền tố cố định (LIKE abc%), không hỗ trợ {{%abc%}} hay ILIKE → chọn **Seq Scan toàn bảng 12.418.550 dòng** (8,2 giây). Sửa: tạo **pg_trgm GIN index** {{CREATE INDEX idx_books_trgm ON books USING gin (title gin_trgm_ops, description gin_trgm_ops)}} — index này lưu các tam ký (trigram) của từng giá trị, hỗ trợ ILIKE/LIKE cả hai phía → Bitmap Index Scan, **79 ms** (khoảng 100 lần nhanh hơn). Với tìm kiếm từ khóa chính thống, dùng tsvector + GIN.

### Kiến thức nền: sargable và giới hạn của btree
Nguyên tắc **sargable** (SARG = Search ARGment): index chỉ được dùng khi điều kiện WHERE có dạng **cột_so_sánh_toán_tử_hằng_số**, tức vế trái là cột thuần, vế phải là hằng số hoặc tham số đã bind.

| Viết | Có dùng btree không? | Vì sao |
|---|---|---|
| {{WHERE title = 'Java'}} | Có | cột_so_sánh_hằng_số |
| {{WHERE title LIKE 'Java%'}} | Có | tiền tố cố định — btree có thể "nhảy" tới phần bắt đầu bằng Java |
| {{WHERE title ILIKE '%java%'}} | Không | tiền tố ẩn — không biết java nằm ở vị trí nào, phải quét toàn bộ |
| {{WHERE title LIKE '%java'}} | Không | tiền tố ẩn, tương tự |

Btree lưu các giá trị theo thứ tự bảng chữ cái; nó chỉ có thể narrow lại khi điều kiện xác định **đầu** hoặc **đầu + cuối** giá trị (LIKE abc%, hoặc = abc). Tiền tố ẩn (%) ở đầu làm mất khả năng narrow → Seq Scan.

### Nguyên gốc, từng bước
1. Query search: {{WHERE title ILIKE '%java%' OR description ILIKE '%java%' ORDER BY published_at DESC LIMIT 40}}. Cả hai điều kiện đều là ILIKE với tiền tố ẩn.
2. Planner không dùng {{idx_books_title}} (btree trên title) vì ILIKE '%java%' không sargable; cũng không dùng {{idx_books_published}} vì điều kiện không liên quan.
3. Planner không có index nào hỗ trợ ILIKE hai phía → Seq Scan đọc toàn bộ 12.418.550 dòng, lọc bỏ 12.418.510, giữ 40 dòng: {{Rows Removed by Filter: 12418510}}, {{Buffers: shared hit=1582040 read=120440}} (~1,7 GB page), {{Execution Time: 8232.104 ms}}.
4. Sau khi tạo pg_trgm GIN: planner dùng Bitmap Index Scan trên {{idx_books_trgm}}, chỉ đọc {{Buffers: shared hit=184 read=12}} (196 page), {{Execution Time: 79.204 ms}}.

### Dẫn chứng
- Artifact 1: {{Seq Scan on books ... Filter: ((title ILIKE '%java%'::text) OR (description ILIKE '%java%'::text))}}, {{Rows Removed by Filter: 12418510}}, {{Execution Time: 8232.104 ms}}. Câu thứ hai {{Bitmap Index Scan on idx_books_trgm ... Execution Time: 79.204 ms}} — cùng câu, chỉ khác index.
- Artifact 2: {{idx_books_title}} btree trên {{title}} — không hỗ trợ ILIKE hai phía.
- Artifact 3: log ứng dụng mỗi request search mất ~8,2 giây.

### Cách sửa
**Ngắn hạn (hôm nay):**
- Tạo pg_trgm index (cần {{CREATE EXTENSION pg_trgm}} trước):
~~~sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY idx_books_trgm ON books USING gin (title gin_trgm_ops, description gin_trgm_ops);
ANALYZE books;
~~~
- Câu query giữ nguyên {{ILIKE '%java%'}} — planner tự động dùng index này. Kết quả: từ 8,2 giây xuống ~80 ms.

**Dài hạn:**
- Nếu tìm kiếm là **từ khóa chính thống** (không cần tìm một phần từ): dùng **tsvector** + GIN:
~~~sql
ALTER TABLE books ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(description,''))) STORED;
CREATE INDEX idx_books_search ON books USING gin (search_vector);
-- Query: WHERE search_vector @@ to_tsquery('java')
~~~
- Chuẩn hóa dữ liệu: lưu {{title_lower}} (lower(title)) và dùng LIKE với tiền tố cố định khi tìm chính xác; hoặc lưu từ đã tách (token) trong một cột riêng.
- Nếu chỉ cần tìm theo tiền tố người dùng gõ ( autocomplete ): dùng LIKE 'java%' với btree (sargable) — nhưng chỉ khi tiền tố là hằng số từ client.

### pg_trgm vs tsvector — khi nào dùng cái nào
| Tiêu chí | pg_trgm (GIN/GiST) | tsvector (GIN) |
|---|---|---|
| Hỗ trợ | ILIKE/LIKE cả hai phía, =(phân biệt hoa) | @@ to_tsquery (từ khóa, AND/OR, NOT, ranking) |
| Chi phí index | Lớn (~3-4 lần cột varchar) | Vừa (~1-2 lần cột text) |
| Tốc độ truy vấn | Nhanh (~80 ms) | Rất nhanh (~10-30 ms) |
| Chi phí ghi | Cao (cập nhật trigram cho mỗi ghi) | Vừa |
| Phù hợp | Tìm một phần từ, misspelling, search "đề xuất" | Tìm kiếm nội dung bài viết, sản phẩm theo từ khóa |

### Lưu ý khi dùng pg_trgm
- Kích thước index: với cột {{title}} varchar(256), index GIN có thể ~1-2 GB với 12,4 triệu dòng — cần đo trên staging trước khi áp dụng production.
- Ghi nặng: mỗi INSERT/UPDATE phải tính lại trigram → với bảng nhận 2.500 dòng/giây, chi phí ghi tăng; nếu bảng **append-only** (chỉ INSERT) thì không vấn đề.
- GIN không hỗ trợ ORDER BY trực tiếp: planner dùng Bitmap Index Scan + Bitmap Heap Scan rồi sort; với LIMIT 40 thì sort chỉ trên 40 dòng → không đáng kể.
- Dùng {{CREATE INDEX CONCURRENTLY}} để không chắn ghi; sau đó {{ANALYZE}}.
- Không dùng GiST nếu không cần ranking (GiST hỗ trợ ranking nhưng chậm hơn GIN).

### Lỗi hay gặp
- "Tạo index trên title rồi mà vẫn Seq Scan": vì btree không hỗ trợ {{%abc%}} — cần pg_trgm.
- Quên {{CREATE EXTENSION pg_trgm}}: lỗi "operator class gin_trgm_ops does not exist".
- Tạo GIN trên bảng nóng mà không CONCURRENTLY: bị AccessExclusiveLock, chờ ghi.

### Trả lời miệng 1 phút
"Tìm kiếm dùng ILIKE '%java%' — tiền tố ẩn làm mất index btree, planner chọn Seq Scan 12,4 triệu dòng, 8,2 giây. Btree chỉ hỗ trợ tiền tố cố định (LIKE abc%), không hỗ trợ %abc%. Sửa: tạo pg_trgm GIN index CREATE INDEX ... USING gin (title gin_trgm_ops, description gin_trgm_ops) kèm CREATE EXTENSION pg_trgm và ANALYZE → Bitmap Index Scan, 79 ms. Nếu tìm kiếm từ khóa chính thống, dùng tsvector + GIN. Lưu ý: pg_trgm index lớn (~1-2 GB), ghi nặng, dùng CONCURRENTLY khi tạo."

> Senior tip: **Btree không bao giờ hỗ trợ tìm kiếm tiền tố ẩn (%abc%)**. Khi cần tìm một phần từ trong một cột văn bản, pg_trgm là giải pháp chuẩn của PostgreSQL; còn nếu cần tìm kiếm nội dung theo từ khóa (phân biệt từ, ranking, synonym), mới dùng tsvector. Luôn đo kích thước index trên staging trước khi tạo trên bảng 12 triệu dòng, và dùng CREATE INDEX CONCURRENTLY để không chắn ghi.`,
  rubric: [
    'Chính xác nguyên nhân: ILIKE/LIKE với tiền tố ẩn (%) ở đầu không sargable với btree → Seq Scan 12,4 triệu dòng',
    'D dẫn chứng đúng: Seq Scan + Filter ILIKE %java% + Rows Removed 12.418.510 + Execution Time 8232 ms, so sánh với Bitmap Index Scan 79 ms',
    'Giải thích đúng nguyên tắc sargable và giới hạn của btree (tiền tố cố định vs tiền tố ẩn)',
    'Đề xuất sửa đúng: pg_trgm GIN index (CREATE EXTENSION + CREATE INDEX CONCURRENTLY + ANALYZE), so sánh với tsvector cho tìm kiếm từ khóa',
    'Nêu lưu ý: kích thước index, chi phí ghi, không hỗ trợ ORDER BY trực tiếp, dùng CONCURRENTLY',
  ],
  tags: ['postgresql', 'index', 'pg_trgm', 'ilike', 'full-text-search', 'gin', 'sargable'],
},
{
  id: 'lab-sql-025',
  category: 'sql',
  title: 'Báo cáo đơn VIP lọc theo thuộc tính JSON: Seq Scan 19,6 triệu dòng vì bọc cast quanh biểu thức',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử **MegaCart** chạy service {{order-report}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{orders}} lưu **19.640.220 dòng** (~7,8 GB heap + 640 MB index). Cột {{metadata}} kiểu {{jsonb}}, mặc định là object rỗng; mỗi đơn lưu các thuộc tính: tier (hạng thành viên: gold, silver, normal), source (app, web, pos), loyalty (điểm tích luỹ, kiểu số). Một giá trị thật:

~~~json
{"id": 20260318004281, "tier": "gold", "source": "app", "loyalty": 980}
~~~

Mỗi phút có khoảng 90 request tới endpoint mới {{GET /api/v1/reports/vip-orders}} (màn hình "Đơn VIP" của phòng CRM).

**Triệu chứng (18/03/2026, 10:20).** p95 của endpoint nhảy từ 260 ms lên **4,6 giây**, gateway trả 504 cho ~12% request, CPU RDS tăng từ 24% lên 88%. DBA chạy EXPLAIN ANALYZE và thấy **Seq Scan toàn bảng 19.640.220 dòng**. Index {{idx_orders_created_at}} trên {{created_at}} đã có từ trước nhưng không giúp gì cho câu này. Một dev thử tạo index trên chính cột {{metadata}} — planner vẫn không dùng.

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE trước/sau khi sửa, schema + danh sách index + {{pg_stat_statements}}, và log Hibernate. Hãy chỉ ra vì sao index không dùng, vì sao câu so sánh {{metadata->>'loyalty'}} với số lại báo lỗi kiểu dữ liệu, và cách sửa đúng.`,
  artifacts: [
    {
      name: 'explain-vip-report.txt',
      lang: 'text',
      content: `-- 2026-03-18 10:21:03 +07, psql tren RDS megacart-primary (PostgreSQL 15.6)
megacart=# EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*), sum(total_amount) AS total
FROM orders
WHERE metadata->>'tier' = 'gold';
                                                       QUERY PLAN
------------------------------------------------------------------------------------------------------------------------
 Aggregate  (cost=1824512.44..1824512.47 rows=1 width=48) (actual time=4583.912..4583.918 rows=1 loops=1)
   Buffers: shared hit=511204 read=512339
   ->  Seq Scan on orders  (cost=0.00..1824512.44 rows=4901 width=23) (actual time=0.021..4508.331 rows=2418 loops=1)
         Filter: ((metadata ->> 'tier'::text) = 'gold'::text)
         Rows Removed by Filter: 19637802
         Buffers: shared hit=511204 read=512339
 Planning Time: 0.284 ms
 Execution Time: 4584.771 ms
(9 rows)

-- (2) Loc theo loyalty: jsonb ->> tra ve text, so sanh voi so bi loi
megacart=# EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM orders WHERE metadata->>'loyalty' >= 800;
ERROR:  operator does not exist: text >= integer
LINE 2: ... WHERE metadata->>'loyalty' >= 800
                               ^
HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.

-- (3) Sau khi "va" bang cast dat tren bieu thuc:
megacart=# EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM orders WHERE (metadata->>'loyalty')::int >= 800;
                                                       QUERY PLAN
------------------------------------------------------------------------------------------------------------------------
 Aggregate  (cost=1832101.44..1832101.47 rows=1 width=8) (actual time=4602.118..4602.124 rows=1 loops=1)
   Buffers: shared hit=511204 read=512339
   ->  Seq Scan on orders  (cost=0.00..1832101.44 rows=158220 width=0) (actual time=0.022..4521.006 rows=159000 loops=1)
         Filter: (((metadata ->> 'loyalty'::text))::integer >= 800)
         Rows Removed by Filter: 19481220
         Buffers: shared hit=511204 read=512339
 Planning Time: 0.301 ms
 Execution Time: 4603.882 ms
(9 rows)

-- (4) Sau khi tao expression index va ANALYZE:
megacart=# CREATE INDEX CONCURRENTLY idx_orders_tier ON orders ((metadata->>'tier'));
CREATE INDEX
megacart=# CREATE INDEX CONCURRENTLY idx_orders_loyalty ON orders (((metadata->>'loyalty')::int));
CREATE INDEX
megacart=# ANALYZE orders;
ANALYZE

-- (5) Cau tier: 4.584 ms -> 41,6 ms
megacart=# EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*), sum(total_amount) AS total
FROM orders
WHERE metadata->>'tier' = 'gold';
                                                       QUERY PLAN
------------------------------------------------------------------------------------------------------------------------
 Aggregate  (cost=4821.44..4821.47 rows=1 width=48) (actual time=41.229..41.235 rows=1 loops=1)
   Buffers: shared hit=18412 read=6
   ->  Index Scan using idx_orders_tier on orders  (cost=0.56..4821.44 rows=4901 width=23) (actual time=0.041..39.882 rows=2418 loops=1)
         Index Cond: ((metadata ->> 'tier'::text) = 'gold'::text)
         Buffers: shared hit=18412 read=6
 Planning Time: 0.241 ms
 Execution Time: 41.612 ms
(7 rows)

-- (6) Cau loyalty: 4.603 ms -> 11,7 ms
megacart=# EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM orders WHERE (metadata->>'loyalty')::int >= 800;
                                                       QUERY PLAN
------------------------------------------------------------------------------------------------------------------------
 Aggregate  (cost=12842.44..12842.47 rows=1 width=8) (actual time=11.402..11.408 rows=1 loops=1)
   Buffers: shared hit=12840 read=2
   ->  Index Scan using idx_orders_loyalty on orders  (cost=0.56..12842.44 rows=158220 width=0) (actual time=0.041..7.114 rows=159000 loops=1)
         Index Cond: (((metadata ->> 'loyalty'::text))::integer >= 800)
         Buffers: shared hit=12840 read=2
 Planning Time: 0.201 ms
 Execution Time: 11.741 ms
(7 rows)`,
    },
    {
      name: 'schema-and-index.txt',
      lang: 'text',
      content: `-- 2026-03-18 10:22:10 +07, RDS megacart-primary
megacart=# \\d orders
                                       Table "public.orders"
  Column       |           Type           | Nullable |     Default
---------------+--------------------------+----------+------------------
 id            | bigint                   | not null |
 total_amount  | numeric(14,2)            | not null |
 metadata      | jsonb                    | not null | '{}'::jsonb
 created_at    | timestamp with time zone | not null | now()
Indexes:
    "orders_pkey" PRIMARY KEY, btree (id)
    "idx_orders_created_at" btree (created_at)

megacart=# SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'orders';
       indexname        |                                      indexdef
------------------------+------------------------------------------------------------------------------------
 orders_pkey            | CREATE UNIQUE INDEX orders_pkey ON public.orders USING btree (id)
 idx_orders_created_at  | CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at)

megacart=# SELECT pg_size_pretty(pg_relation_size('orders')) AS heap,
                pg_size_pretty(pg_indexes_size('orders')) AS idx;
  heap  |  idx
--------+------
 7814 MB | 640 MB
(1 row)

-- Thong ke cau query 5 phut quanh su co (pg_stat_statements):
megacart=# SELECT calls, round(total_exec_time::numeric, 1) AS total_ms,
                round(mean_exec_time::numeric, 1) AS mean_ms, rows
FROM pg_stat_statements
WHERE query LIKE '%metadata->>%'
ORDER BY total_exec_time DESC LIMIT 3;
 calls |  total_ms  | mean_ms | rows
-------+------------+---------+------
   452 | 2071516.0  |  4583.0 |   452
   118 |  541822.0  |  4591.7 |   118
  3120 |   38688.0  |    12.4 | 7544320
(3 rows)
-- 452 lan * 4,6 giay = 2.071 giay CPU trong 300 giay -> ~6,9 vCPU chay lien tuc.`,
    },
    {
      name: 'app-vip-report.log',
      lang: 'text',
      content: `2026-03-18 10:21:03.118 DEBUG [http-nio-8080-exec-14] o.h.SQL :
    select count(*), sum(o1_0.total_amount) from orders o1_0
    where o1_0.metadata ->> 'tier' = ?
2026-03-18 10:21:07.702 INFO  [http-nio-8080-exec-14] c.m.o.VipOrderReportController : GET /api/v1/reports/vip-orders -> 200 in 4601 ms
2026-03-18 10:21:09.331 DEBUG [http-nio-8080-exec-21] o.h.SQL :
    select count(*) from orders o1_0 where o1_0.metadata ->> 'loyalty' >= ?
2026-03-18 10:21:09.344 ERROR [http-nio-8080-exec-21] c.m.o.VipOrderReportController : GET /api/v1/reports/vip-orders?minLoyalty=800 -> 500
org.springframework.dao.InvalidDataAccessResourceUsageException: could not execute query; nested exception is org.hibernate.exception.SQLGrammarException: could not execute query
Caused by: org.postgresql.util.PSQLException: ERROR: operator does not exist: text >= integer
  Position: 68
-- Sau khi dev sua thanh (metadata->>'loyalty')::int >= ?:
2026-03-18 10:24:11.902 DEBUG [http-nio-8080-exec-9] o.h.SQL :
    select count(*) from orders o1_0 where (o1_0.metadata ->> 'loyalty')::integer >= ?
2026-03-18 10:24:16.501 INFO  [http-nio-8080-exec-9] c.m.o.VipOrderReportController : GET /api/v1/reports/vip-orders?minLoyalty=800 -> 200 in 4599 ms
-- pattern: moi request VIP mat ~4,6 giay, khong co request nao duoi 1 giay`,
    },
  ],
  questions: [
    'Vì sao câu WHERE metadata->>\'tier\' = \'gold\' không dùng được index, và vì sao câu loyalty bị lỗi kiểu dữ liệu? Chỉ ra bằng dòng nào trong EXPLAIN/log.',
    'So sánh ba câu: (1) Seq Scan 4.584 ms, (2) lỗi operator does not exist, (3) sau khi tạo expression index còn 41,6 ms. Điều gì thay đổi giữa (1) và (3) nếu bảng và index đều có?',
    'Bạn sửa thế nào cho ngắn hạn và dài hạn? Giải thích expression index, generated column và GIN jsonb_path_ops — khi nào dùng cái nào, lưu ý gì về IMMUTABLE và ANALYZE?',
  ],
  hints: [
    'Đọc dòng "Filter: ((metadata ->> \'tier\'::text) = \'gold\'::text)": vế trái là một biểu thức trên cột metadata, không phải cột trần. Planner không có index nào trên biểu thức này nên chọn Seq Scan. Index idx_orders_created_at không giúp vì câu không lọc theo created_at.',
    'jsonb ->> luôn trả về text, kể cả khi giá trị trong JSON là số. So sánh text với số (800) không có toán tử -> lỗi "operator does not exist: text >= integer". Ép kiểu ở vế biểu thức (::int) chạy được nhưng vẫn là biểu thức -> vẫn Seq Scan.',
    'Cách sửa: tạo expression index ((metadata->>\'tier\')) và (((metadata->>\'loyalty\')::int)), rồi ANALYZE. Biểu thức trong index phải IMMUTABLE (jsonb ->> là IMMUTABLE, cast text::int cũng IMMUTABLE). Dài hạn: generated column STORED + btree, hoặc GIN jsonb_path_ops + @> cho điều kiện bằng.',
  ],
  answer: `**Tóm tắt:** Câu báo cáo lọc theo thuộc tính trong cột {{jsonb}} bằng biểu thức {{metadata->>'tier'}} — đây là **biểu thức bọc quanh cột**, không phải cột trần, nên planner không dùng được index btree thông thường và phải **Seq Scan 19.640.220 dòng** (4,6 giây). Khi lọc theo {{loyalty}}, {{metadata->>'loyalty'}} trả về **text** nên so sánh {{>= 800}} báo lỗi "operator does not exist: text >= integer"; dev "vá" bằng {{::int}} ngay trên biểu thức, càng làm index khó dùng. Sửa đúng: tạo **expression index** trên chính biểu thức đó rồi {{ANALYZE}} (đo được 4.584 ms → 41,6 ms), hoặc dùng **GIN + @>** cho điều kiện bằng, hoặc thêm **generated column** có kiểu đúng.

### Kiến thức nền: jsonb và ba toán tử hay dùng
PostgreSQL có hai kiểu JSON. {{json}} lưu **nguyên văn** (giữ cả khoảng trắng, thứ tự key); {{jsonb}} lưu dạng **cây nhị phân đã parse**, bỏ khoảng trắng, tìm kiếm nhanh hơn. Bảng ở đây dùng {{jsonb}} — đúng cho dữ liệu bị truy vấn thường xuyên.

- {{metadata->>'tier'}} : trả về **giá trị của key tier dưới dạng text**. Mũi tên đơn {{->}} trả về jsonb, mũi tên kép {{->>}} trả về text.
- {{metadata->'tier'}} : trả về jsonb, dùng khi cần đi sâu tiếp vào object lồng nhau.
- {{metadata @> ...}} : kiểm tra **chứa** (containment) — jsonb bên trái có chứa toàn bộ key/value bên phải hay không; đây là toán tử duy nhất dùng được với index GIN jsonb_path_ops.

> Điểm mấu chốt: {{->>}} **luôn trả về text**, kể cả khi giá trị trong JSON là số. Vì vậy {{metadata->>'loyalty'}} không so sánh trực tiếp với 800 được — PostgreSQL không có toán tử {{text >= integer}}.

### Vì sao biểu thức làm mất index
Một index btree trên cột {{metadata}} lưu **giá trị jsonb thô** của cả object, sắp theo thứ tự jsonb. Câu {{WHERE metadata->>'tier' = 'gold'}} không hỏi "object này có bằng ... không" mà hỏi "text ở key tier có bằng gold không". Planner không có cách nào biến câu hỏi đó thành một khoảng trên index jsonb thô, nên nó chọn Seq Scan: đọc từng dòng, bóc tách JSON, so sánh, loại.

Quy tắc chung: planner chỉ dùng index khi biểu thức trong WHERE **trùng khớp** với biểu thức đã được index. Nếu tạo {{CREATE INDEX ... ON orders ((metadata->>'tier'))}}, index sẽ lưu **đúng giá trị text** của từng dòng; khi đó vế trái của WHERE chính là biểu thức đó → dùng được. Đó là **expression index** (index trên biểu thức, không phải trên cột).

### Nguyên nhân gốc, từng bước
1. Câu 1: {{WHERE metadata->>'tier' = 'gold'}}. Vế trái là biểu thức, không phải cột → planner bỏ {{idx_orders_created_at}} (câu không lọc theo created_at) và cũng không có index nào trên biểu thức → **Seq Scan**.
2. Seq Scan đọc hết 19.640.220 dòng, giữ 2.418 dòng {{tier = gold}}, loại 19.637.802: {{Rows Removed by Filter: 19637802}}, {{Buffers: shared hit=511204 read=512339}} (~1 triệu page ≈ 7,8 GB heap), {{Execution Time: 4584.771 ms}}.
3. Câu 2: {{metadata->>'loyalty' >= 800}} → lỗi ngay vì {{->>}} trả text. Đây là **lỗi kiểu dữ liệu**, không phải lỗi index.
4. Câu 3 (sau khi vá): {{(metadata->>'loyalty')::int >= 800}}. Cast làm biểu thức phức tạp hơn; planner không có index nào khớp → vẫn Seq Scan, 4.603 ms, loại 19.481.220 dòng.
5. Sau khi tạo expression index + {{ANALYZE}}: câu 1 dùng {{Index Scan using idx_orders_tier}}, {{Buffers: shared hit=18412 read=6}} (18.418 page), {{Execution Time: 41.612 ms}}; câu 3 dùng {{idx_orders_loyalty}}, {{Execution Time: 11.741 ms}}. Chênh lệch ~110 lần và ~390 lần.

### Dẫn chứng
- Artifact 1: Seq Scan + {{Filter: ((metadata ->> 'tier'::text) = 'gold'::text)}} + {{Rows Removed by Filter: 19637802}} + {{Execution Time: 4584.771 ms}}; câu loyalty lỗi {{operator does not exist: text >= integer}}; sau index: {{Index Scan using idx_orders_tier}} + {{Execution Time: 41.612 ms}}.
- Artifact 2: index hiện có chỉ có {{orders_pkey}} và {{idx_orders_created_at}} — **không có** index nào trên {{metadata}} hay biểu thức của nó.
- Artifact 3: Hibernate bind {{metadata ->> 'tier' = ?}} (một tham số text), mỗi request 4,6 giây; câu loyalty ban đầu trả 500 vì lỗi kiểu.

### Cách sửa — ngắn hạn (18/03)
- Tạo expression index ngoài giờ cao điểm, dùng CONCURRENTLY để không chặn ghi:
~~~sql
CREATE INDEX CONCURRENTLY idx_orders_tier ON orders ((metadata->>'tier'));
CREATE INDEX CONCURRENTLY idx_orders_loyalty ON orders (((metadata->>'loyalty')::int));
ANALYZE orders;
~~~
- Sửa câu loyalty: so sánh **đúng kiểu**. Nếu loyalty là số, dùng {{::int}} (hoặc {{::numeric}}) **ở vế biểu thức**, không so sánh text với số.
- Đặt {{statement_timeout}} cho role báo cáo (ví dụ 30 giây) để câu nặng không chạy tiếp khi client đã bỏ; thêm cache ngắn 30–60 giây cho màn hình CRM.
- Nếu câu vẫn chậm vì phải đọc quá nhiều dòng, thêm điều kiện {{created_at}} (khoảng nửa mở) và index phù hợp — xem mục dài hạn.

### Cách sửa — dài hạn
- **Generated column** (PostgreSQL 12+): thêm cột dẫn xuất có kiểu đúng, lưu sẵn trên đĩa, rồi btree trên đó. Query viết {{tier_text = 'gold'}} — sargable, không cần expression index.
~~~sql
ALTER TABLE orders
  ADD COLUMN tier_text text GENERATED ALWAYS AS (metadata->>'tier') STORED,
  ADD COLUMN loyalty_int int GENERATED ALWAYS AS ((metadata->>'loyalty')::int) STORED;
CREATE INDEX CONCURRENTLY idx_orders_tier_text ON orders (tier_text);
CREATE INDEX CONCURRENTLY idx_orders_loyalty_int ON orders (loyalty_int);
~~~
- **GIN + containment** khi cần lọc nhiều key cùng lúc: {{CREATE INDEX ... USING gin (metadata jsonb_path_ops)}} rồi {{WHERE metadata @> ...}}. GIN không hỗ trợ điều kiện khoảng ({{>}}, {{<}}) trên giá trị, nên loyalty vẫn cần expression index hoặc generated column.
- Nếu JSON là **lõi nghiệp vụ** (không phải thuộc tính phụ), hãy đưa các key hay lọc ra cột thật ngay từ thiết kế. JSON nên dùng cho phần "dữ liệu bán cấu trúc", không phải cho trường phải truy vấn liên tục.

### So sánh ba cách
| Cách | Khi nào dùng | Nhược điểm |
|---|---|---|
| Expression index | Lọc đúng một key, không muốn đổi schema | Query phải viết **trùng khớp** biểu thức; mỗi key một index; vẫn phải ANALYZE |
| Generated column + btree | Lọc theo kiểu đúng (số, ngày), nhiều query | Thêm cột, tốn bộ nhớ; mỗi write tính lại biểu thức |
| GIN jsonb_path_ops + @> | Lọc nhiều key, điều kiện bằng | Không hỗ trợ > <; index lớn; ghi chậm hơn |

### Bẫy khi dùng expression index
- **IMMUTABLE**: biểu thức trong index chỉ được gọi hàm IMMUTABLE (kết quả chỉ phụ thuộc tham số). {{jsonb_object_field_text}} (toán tử {{->>}} trên jsonb) là IMMUTABLE nên index được; nếu dùng {{json}} thường hoặc {{to_char}} (phụ thuộc locale) thì PostgreSQL báo lỗi "functions in index expression must be marked IMMUTABLE".
- **Phải ANALYZE** sau khi tạo index: planner cần statistics cho biểu thức; thiếu ANALYZE thì vẫn có thể chọn Seq Scan.
- **CONCURRENTLY**: không chạy được trong transaction block; gọi bằng psql, không đưa vào Flyway.
- **Kích thước**: mỗi expression index là một btree riêng; hai index ở đây cộng thêm khoảng 1,1 GB. Đo trên staging trước.
- **Query phải khớp từng ký tự**: {{metadata->>'tier'}} khác {{lower(metadata->>'tier')}}; đổi cách viết là index cũ thành vô dụng.

### Sơ đồ luồng
~~~seq
title: Báo cáo VIP: expression index đổi Seq Scan thành Index Scan
actors: Client | order-report | PostgreSQL
Client -> order-report: GET /reports/vip-orders?tier=gold
order-report -> PostgreSQL: SELECT ... WHERE metadata->>'tier' = $1
PostgreSQL -> PostgreSQL: Seq Scan 19,6 triệu dòng, 4,6 giây
PostgreSQL --> order-report: 2.418 dòng
order-report --> Client: 200 sau 4,6 giây
note PostgreSQL: expression index ((metadata->>'tier')) + ANALYZE
order-report -> PostgreSQL: cùng câu, sau khi tạo index
PostgreSQL --> order-report: Index Scan 41 ms
order-report --> Client: 200 sau 48 ms
~~~

### Trả lời mẫu khi phỏng vấn
"Câu báo cáo lọc theo thuộc tính trong cột jsonb bằng metadata->>'tier'. Đây là biểu thức bọc quanh cột nên planner không dùng được index btree, nó Seq Scan 19,6 triệu dòng mất 4,6 giây. Khi lọc theo loyalty thì jsonb->> trả về text, so sánh với số bị lỗi operator does not exist; dev vá bằng cách ép kiểu ngay trên biểu thức, vẫn Seq Scan. Tôi tạo expression index trên chính biểu thức đó — ((metadata->>'tier')) và (((metadata->>'loyalty')::int)) — rồi ANALYZE; câu tier còn 41 ms, câu loyalty 11 ms. Lưu ý biểu thức phải IMMUTABLE, phải ANALYZE, và CONCURRENTLY thì không chạy trong Flyway. Dài hạn tôi thêm generated column STORED có kiểu đúng rồi btree, hoặc GIN jsonb_path_ops với @> khi cần lọc nhiều key."

> Senior tip: JSONB rất tiện nhưng **đừng để nó thành nơi chứa các trường bạn phải truy vấn liên tục**. Quy tắc thực dụng: cái gì đã có WHERE, ORDER BY, JOIN thì đưa ra cột thật; JSON giữ phần thuộc tính phụ. Nếu buộc phải lọc trong JSON, hãy coi expression index hoặc generated column là một phần của schema — và nhớ rằng index trên biểu thức chỉ sống nếu câu query viết lại đúng biểu thức đó.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: điều kiện WHERE là biểu thức trên cột jsonb (metadata->>\'tier\') nên không sargable, planner chọn Seq Scan 19,6 triệu dòng',
    'Dẫn chứng đúng: Seq Scan + Filter metadata ->> tier + Rows Removed 19.637.802 + Execution Time 4584 ms, so sánh với Index Scan 41 ms sau khi tạo expression index',
    'Giải thích đúng vì sao loyalty bị lỗi kiểu (jsonb ->> trả text, không có toán tử text >= integer) và vì sao cast ở vế biểu thức vẫn không dùng được index',
    'Đề xuất sửa đúng: expression index ((metadata->>\'tier\')) và (((metadata->>\'loyalty\')::int)) + ANALYZE, generated column STORED + btree, GIN jsonb_path_ops + @> cho containment',
    'Nêu lưu ý IMMUTABLE, ANALYZE, CONCURRENTLY ngoài transaction, kích thước index và bẫy so sánh text với số',
  ],
  tags: ['postgresql', 'index', 'jsonb', 'expression-index', 'sargable', 'explain'],
},
{
  id: 'lab-sql-026',
  category: 'sql',
  title: 'Migration thêm CHECK và FK không NOT VALID trên bảng 61 triệu dòng: ACCESS EXCLUSIVE LOCK làm 512 query xếp hàng',
  level: 'lead',
  scenario: `**Bối cảnh.** Cổng thanh toán **PayGate** chạy service {{ledger-service}} (Spring Boot 3.3, Hibernate 6.4, Flyway, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{ledger_entry}} lưu bút toán kế toán: **61.284.910 dòng** (~14,2 GB heap + 6,8 GB index). Giờ cao điểm 09:00–11:00 hệ thống xử lý **1.400 giao dịch/giây**, mọi API đọc/ghi bút toán đều đi qua bảng này. Service chạy **18 instance**, mỗi instance HikariCP **40 connection** (tổng tối đa 720 connection tới RDS).

**Triệu chứng (19/03/2026, 10:04).** Deploy bản v3.41.0 kèm migration Flyway {{V88__add_ledger_constraints.sql}} gồm ba câu:

~~~sql
ALTER TABLE ledger_entry ADD COLUMN reversal_of bigint;
ALTER TABLE ledger_entry ADD CONSTRAINT fk_ledger_account FOREIGN KEY (account_id) REFERENCES account(id);
ALTER TABLE ledger_entry ADD CONSTRAINT chk_ledger_amount CHECK (amount <> 0);
~~~

Sau khoảng 40 giây, **toàn bộ** endpoint đọc/ghi bút toán trả 504, CPU RDS chỉ **11%**, connection pool cạn, log tràn {{HikariPool-1 - Connection is not available, request timed out after 3000ms}}. DBA terminate migration lúc 10:07:12, hệ thống hồi phục sau ~25 giây. Cùng migration chạy lại lúc 23:30 (bảng không có traffic) thì xong trong **4 phút 12 giây**.

**Việc bạn có.** Ba artifact: log Flyway, ảnh {{pg_stat_activity}} và {{pg_locks}} lúc 10:07:10. Hãy tìm nguyên nhân gốc, dựng chuỗi chờ, giải thích vì sao 23:00 lại thành công, và đề xuất cách chạy migration an toàn.`,
  artifacts: [
    {
      name: 'flyway-migration.log',
      lang: 'text',
      content: `2026-03-19 10:04:00.012 INFO  [main] o.f.core.internal.command.DbMigrate : Migrating schema "public" to version "88 - add ledger constraints"
2026-03-19 10:04:00.015 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: ALTER TABLE ledger_entry ADD COLUMN reversal_of bigint
2026-03-19 10:04:00.412 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: ALTER TABLE ledger_entry ADD CONSTRAINT fk_ledger_account FOREIGN KEY (account_id) REFERENCES account(id)
2026-03-19 10:06:12.905 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: ALTER TABLE ledger_entry ADD CONSTRAINT chk_ledger_amount CHECK (amount <> 0)
2026-03-19 10:07:12.331 ERROR [main] o.f.core.internal.command.DbMigrate : Migration of schema "public" to version "88" failed! Please restore backups...
2026-03-19 10:07:12.332 ERROR [main] o.f.core.internal.command.DbMigrate : SQL State  : 57P01 --- Error Code : 0 --- Message  : FATAL: terminating connection due to administrator command
-- 57P01 = admin_shutdown: backend bi DBA terminate luc 10:07:12 (pg_terminate_backend).
-- Cau thu 2 (FK) chay 2 phut 12 giay (10:04:00 -> 10:06:12) de validate 61 trieu dong.
-- Cau thu 3 (CHECK) chay 59 giay thi bi terminate (10:06:12 -> 10:07:12).
-- Flyway mac dinh boc moi migration trong MOT transaction: lock cua cau dau tien
--   duoc giu den COMMIT, khong nha o cuoi tung cau.
-- Lan chay lai 23:30: ADD COLUMN 0,4s + FK 2m05 + CHECK 2m06 = 4 phut 12 giay, thanh cong.`,
    },
    {
      name: 'pg-stat-activity-100710.txt',
      lang: 'text',
      content: `-- 2026-03-19 10:07:10 +07, RDS paygate-primary (PostgreSQL 15.6)
paygate=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       left(query, 78) AS query
FROM pg_stat_activity WHERE datname='paygate' ORDER BY backend_start;

  pid   |        state        | wait_event_type | wait_event |    xact_age     |                          query
--------+---------------------+-----------------+------------+-----------------+---------------------------------------------------------
 51422  | active              |                 |            | 00:03:10.442  | ALTER TABLE ledger_entry ADD CONSTRAINT chk_ledger_amount CHECK (amount <> 0)
 51423  | active              | Lock            | relation   | 00:00:12.331  | SELECT count(*) FROM ledger_entry WHERE account_id = $1
 51424  | active              | Lock            | relation   | 00:00:12.308  | UPDATE ledger_entry SET amount = $1 WHERE id = $2
 51425  | active              | Lock            | relation   | 00:00:12.290  | INSERT INTO ledger_entry (...) VALUES (...)
 51426  | active              | Lock            | relation   | 00:00:12.264  | SELECT id, amount FROM ledger_entry WHERE account_id = $1
 51427  | active              | Lock            | relation   | 00:00:12.241  | UPDATE ledger_entry SET status = $1 WHERE id = $2
-- (con tong 507 backend cung dang cho lock tren ledger_entry, chi hien 5 dong dau)

paygate=# SELECT wait_event_type, wait_event, count(*) AS n
FROM pg_stat_activity WHERE datname='paygate' AND backend_type='client backend'
GROUP BY 1, 2 ORDER BY n DESC;
 wait_event_type | wait_event |  n
-----------------+------------+-----
 Lock            | relation   | 512
                 |            |   6
 Client          | ClientRead |   4
(3 rows)
-- 512 backend dang cho lock tren cung mot relation; 6 backend dang chay binh thuong.

paygate=# SELECT state, count(*) FROM pg_stat_activity
WHERE datname='paygate' AND backend_type='client backend' GROUP BY 1;
        state        | count
---------------------+-------
 active              |   518
 idle                |     6
(2 rows)`,
    },
    {
      name: 'pg-locks-100710.txt',
      lang: 'text',
      content: `-- 2026-03-19 10:07:10 +07
paygate=# SELECT l.locktype, l.mode, l.granted, count(*) AS n
FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.relation = 'ledger_entry'::regclass
GROUP BY l.locktype, l.mode, l.granted ORDER BY n DESC;

  locktype  |           mode           | granted |  n
------------+--------------------------+---------+-----
 relation   | AccessShareLock          | f       | 468
 relation   | RowExclusiveLock         | f       |  44
 relation   | AccessExclusiveLock      | t       |   1
(3 rows)

-- AccessExclusiveLock granted = t (1): migration dang GIU lock manh nhat tren ledger_entry.
-- AccessShareLock granted = f (468): SELECT cua ung dung phai xep hang sau migration.
-- RowExclusiveLock granted = f (44): INSERT/UPDATE/DELETE cung phai xep hang.
-- 468 + 44 = 512, khop voi so dong wait_event_type = Lock o artifact truoc.

-- Ai dang chan ai:
paygate=# SELECT a.pid, pg_blocking_pids(a.pid) AS blocked_by
FROM pg_stat_activity a
WHERE a.wait_event_type = 'Lock' AND a.datname = 'paygate'
ORDER BY a.pid LIMIT 3;
  pid  | blocked_by
-------+------------
 51423 | {51422}
 51424 | {51422}
 51425 | {51422}
-- 51422 chinh la migration: moi query cho lock deu bi no chan.

-- Lock tren bang account (bang duoc FK tham chieu):
paygate=# SELECT l.mode, l.granted, count(*) AS n
FROM pg_locks l WHERE l.relation = 'account'::regclass GROUP BY 1, 2 ORDER BY 3 DESC;
          mode           | granted |  n
-------------------------+---------+-----
 AccessShareLock         | t       |  18
 ShareRowExclusiveLock   | t       |   1
(2 rows)`,
    },
  ],
  questions: [
    'Vì sao migration cần AccessExclusiveLock, và vì sao 468 SELECT (chỉ cần AccessShareLock) cũng bị treo dù AccessShareLock vốn tương thích với RowExclusiveLock?',
    'Dựng chuỗi chờ từ artifacts: migration giữ gì, ai chờ, bằng chứng số liệu (lock mode, granted, wait_event, pg_blocking_pids).',
    'Vì sao cùng migration lúc 23:30 lại thành công? So sánh CHECK thường với NOT VALID + VALIDATE CONSTRAINT về lock và thời gian giữ; FK có khác CHECK không?',
  ],
  hints: [
    'Flyway mặc định bọc mỗi migration trong một transaction. Vì vậy AccessExclusiveLock mà câu ADD COLUMN lấy ở đầu không được nhả cho tới COMMIT — cả ba câu nằm trong cùng một lock hold.',
    'ACCESS EXCLUSIVE xung đột với mọi lock khác, kể cả AccessShareLock của SELECT. Hàng đợi lock của PostgreSQL là FIFO: một AccessExclusiveLock đang được giữ thì mọi lock xin sau đều phải chờ.',
    'CHECK không NOT VALID phải quét toàn bộ 61 triệu dòng để kiểm tra dữ liệu cũ, kéo dài thời gian giữ ACCESS EXCLUSIVE. VALIDATE CONSTRAINT chỉ cần ShareUpdateExclusiveLock, không chặn SELECT/INSERT/UPDATE/DELETE.',
  ],
  answer: `**Tóm tắt:** Migration {{V88}} chạy trong **một transaction** (Flyway mặc định). Câu {{ALTER TABLE ... ADD CONSTRAINT chk_ledger_amount CHECK (amount <> 0)}} cần **ACCESS EXCLUSIVE LOCK** trên {{ledger_entry}} và phải **quét toàn bộ 61.284.910 dòng** để kiểm tra dữ liệu cũ có thoả {{amount <> 0}} không. Vì nằm trong cùng transaction với các câu trước, ACCESS EXCLUSIVE được giữ từ câu {{ADD COLUMN}} cho tới COMMIT — tức suốt 3 phút 12 giây. ACCESS EXCLUSIVE xung đột với **mọi** lock khác, kể cả {{AccessShareLock}} của SELECT, nên 512 backend xếp hàng ({{wait_event_type = Lock}}, {{wait_event = relation}}), Hikari cạn, toàn bộ API trả 504 dù CPU chỉ 11%. Sửa: đặt {{lock_timeout}} ngắn + retry, chạy ngoài giờ cao điểm, và **chia nhỏ**: {{ADD CONSTRAINT ... NOT VALID}} (không quét) rồi {{VALIDATE CONSTRAINT}} (chỉ cần ShareUpdateExclusiveLock, không chặn đọc/ghi), tách mỗi câu thành migration riêng, {{CREATE INDEX CONCURRENTLY}} ngoài transaction.

### Kiến thức nền: các mức lock trên bảng
PostgreSQL phân biệt nhiều mức lock trên một relation, theo thứ tự mạnh dần. Hai lock được cấp cùng lúc nếu chúng **tương thích** (không xung đột).

| Mức lock | Ai dùng | Xung đột với |
|---|---|---|
| AccessShareLock | SELECT | chỉ AccessExclusiveLock |
| RowExclusiveLock | INSERT / UPDATE / DELETE | Share, ShareRowExclusive, Exclusive, AccessExclusive |
| ShareUpdateExclusiveLock | VACUUM, ANALYZE, CREATE INDEX CONCURRENTLY, VALIDATE CONSTRAINT | chính nó, Share, ShareRowExclusive, Exclusive, AccessExclusive |
| ShareRowExclusiveLock | CREATE TRIGGER, ADD FOREIGN KEY | RowExclusive, ShareUpdateExclusive, Share, ShareRowExclusive, Exclusive, AccessExclusive |
| AccessExclusiveLock | ALTER TABLE, DROP TABLE, TRUNCATE, VACUUM FULL, REINDEX | mọi lock |

Điểm cần nhớ: **VALIDATE CONSTRAINT chỉ cần ShareUpdateExclusiveLock** — mức này **không** xung đột với RowExclusiveLock, nên INSERT/UPDATE/DELETE vẫn chạy bình thường trong lúc validate. Ngược lại, {{ADD CONSTRAINT ... CHECK}} (không NOT VALID) cần ACCESS EXCLUSIVE và phải quét bảng.

### Flyway transaction và vì sao cả migration bị khoá
Flyway mặc định chạy **mỗi migration trong một transaction**. Trong PostgreSQL, lock do một câu lệnh lấy được **giữ đến khi transaction kết thúc** (COMMIT/ROLLBACK), không nhả ở cuối câu lệnh. Vì vậy:

1. Câu 1 {{ADD COLUMN reversal_of bigint}} lấy ACCESS EXCLUSIVE trên {{ledger_entry}}.
2. Câu 2 {{ADD CONSTRAINT ... FOREIGN KEY}} cần ACCESS EXCLUSIVE trên {{ledger_entry}} (và ShareRowExclusiveLock trên {{account}}), rồi quét 61 triệu dòng để kiểm tra account_id không có giá trị mồ côi — mất 2 phút 12 giây.
3. Câu 3 {{ADD CONSTRAINT ... CHECK}} cần ACCESS EXCLUSIVE và quét toàn bộ để kiểm tra {{amount <> 0}} — bị terminate sau 59 giây.
4. Trong suốt 3 phút 12 giây, ACCESS EXCLUSIVE của câu 1 **không được nhả**. Mọi SELECT/INSERT/UPDATE đến sau đều phải xếp hàng.

Nếu chạy từng câu ở từng transaction riêng, câu 1 và câu 2 vẫn giữ ACCESS EXCLUSIVE trong lúc validate — chia nhỏ **không** tự động giải quyết vấn đề; phải dùng NOT VALID để câu 2/câu 3 không quét bảng.

### Nguyên nhân gốc, từng bước
1. 10:04:00 migration BEGIN; {{ADD COLUMN}} chạy 0,4 giây (PostgreSQL 11+ thêm cột với DEFAULT hằng số chỉ ghi metadata, không rewrite 61 triệu dòng) — nhưng ACCESS EXCLUSIVE đã được lấy và giữ.
2. 10:04:00 → 10:06:12 FK validate 61 triệu dòng. Lock ACCESS EXCLUSIVE vẫn giữ (cùng transaction). Ghi vào {{ledger_entry}} bị chặn; SELECT vẫn chạy được vì AccessShareLock tương thích với... không — ACCESS EXCLUSIVE đã xung đột với AccessShareLock, nên **cả SELECT cũng bị chặn** ngay từ 10:04:00.
3. 10:06:12 → 10:07:12 CHECK validate. Bảng vẫn bị khoá.
4. Hàng đợi lock FIFO: 468 AccessShareLock + 44 RowExclusiveLock phải đứng sau ACCESS EXCLUSIVE.
5. Mỗi request giữ 1 connection Hikari trong lúc chờ lock; {{connectionTimeout = 3000ms}} → timeout → 504. 512 backend chờ trên pool tối đa 720.
6. CPU 11% vì không có gì thực sự chạy — đây là **blocking**, không phải quá tải. Thêm CPU hay thêm connection đều vô hiệu.

### Dẫn chứng
- Artifact 1: Flyway log cho thấy câu FK chạy 2 phút 12 giây, câu CHECK bị terminate (SQLSTATE 57P01) lúc 10:07:12; comment ghi rõ Flyway bọc migration trong một transaction.
- Artifact 2: pid 51422 {{state = active}} (đang quét), 512 backend {{wait_event_type = Lock}}, {{wait_event = relation}}.
- Artifact 3: {{AccessExclusiveLock granted = t}} n = 1 (migration); {{AccessShareLock granted = f}} n = 468; {{RowExclusiveLock granted = f}} n = 44; {{pg_blocking_pids}} của các pid chờ đều trả về **{51422}**. Bảng {{account}} bị ShareRowExclusiveLock (chặn ghi) nhưng SELECT vẫn chạy (AccessShareLock granted = t).

### Vì sao 23:30 thành công
Ngoài giờ cao điểm, không có lock nào đang giữ trên {{ledger_entry}}. Migration xin ACCESS EXCLUSIVE và được cấp **ngay**, không có ai xếp hàng, nên dù phải quét 61 triệu dòng (4 phút 12 giây) thì cũng không ai bị ảnh hưởng. Vấn đề không phải câu SQL hay kích thước bảng, mà là **thời điểm** và **thời gian giữ lock**.

### Cách sửa — ngắn hạn (19/03)
- Đặt {{lock_timeout}} cho role migration (ví dụ 3 giây): migration thất bại nhanh thay vì chờ vô hạn, rồi thử lại sau khi lock được giải phóng.
- Tìm và kết thúc session giữ lock: {{SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle in transaction' ...}}.
- Chạy migration ngoài giờ cao điểm (23:00–04:00); không deploy migration nặng trong giờ cao điểm.
- Tách mỗi câu SQL thành một file migration riêng để một câu lỗi không kéo theo lock của câu khác (nhưng vẫn phải dùng NOT VALID cho câu nặng).

### Cách sửa — dài hạn: NOT VALID + VALIDATE CONSTRAINT
Chia thành hai pha: **thêm constraint (không quét)** và **validate (không chặn đọc/ghi)**.
~~~sql
-- Pha 1: them cot nullable (metadata, nhanh)
ALTER TABLE ledger_entry ADD COLUMN reversal_of bigint;

-- Pha 2: them CHECK KHONG validate -> khong quet 61 trieu dong, lock rat ngan
ALTER TABLE ledger_entry ADD CONSTRAINT chk_ledger_amount CHECK (amount <> 0) NOT VALID;

-- Pha 3: validate sau, KHONG chan doc/ghi (ShareUpdateExclusiveLock)
ALTER TABLE ledger_entry VALIDATE CONSTRAINT chk_ledger_amount;

-- Pha 4: FK cung NOT VALID roi validate
ALTER TABLE ledger_entry ADD CONSTRAINT fk_ledger_account
  FOREIGN KEY (account_id) REFERENCES account(id) NOT VALID;
ALTER TABLE ledger_entry VALIDATE CONSTRAINT fk_ledger_account;
~~~
- {{NOT VALID}} bỏ qua bước quét dữ liệu cũ; ràng buộc **vẫn được áp dụng cho INSERT/UPDATE mới** (dòng mới vi phạm sẽ bị từ chối). Dữ liệu cũ có thể vi phạm cho tới khi {{VALIDATE CONSTRAINT}} chạy.
- {{VALIDATE CONSTRAINT}} chỉ cần ShareUpdateExclusiveLock → SELECT/INSERT/UPDATE/DELETE vẫn chạy; với FK còn cần RowShareLock trên bảng được tham chiếu.
- Nếu dữ liệu cũ đã vi phạm, {{VALIDATE}} sẽ lỗi; phải dọn dữ liệu trước (ví dụ {{UPDATE ... WHERE amount = 0}}) rồi validate lại.
- Tạo index (nếu cần) bằng {{CREATE INDEX CONCURRENTLY}} **ngoài transaction**; Flyway mặc định bọc transaction nên câu này sẽ lỗi "CREATE INDEX CONCURRENTLY cannot run inside a transaction block".

### FK khác CHECK thế nào về lock
| Loại | Lock trên bảng đang sửa | Lock trên bảng tham chiếu | Quét dữ liệu cũ |
|---|---|---|---|
| CHECK (không NOT VALID) | ACCESS EXCLUSIVE | không có | Có |
| CHECK NOT VALID | ACCESS EXCLUSIVE (rất ngắn) | không có | Không |
| VALIDATE CHECK | SHARE UPDATE EXCLUSIVE | không có | Có, nhưng không chặn đọc/ghi |
| FOREIGN KEY (không NOT VALID) | SHARE ROW EXCLUSIVE | SHARE ROW EXCLUSIVE | Có |
| FOREIGN KEY NOT VALID | SHARE ROW EXCLUSIVE | SHARE ROW EXCLUSIVE | Không |
| VALIDATE FOREIGN KEY | SHARE UPDATE EXCLUSIVE | ROW SHARE | Có, không chặn đọc/ghi trên bảng đang sửa |

Lưu ý: {{ADD FOREIGN KEY}} chỉ cần SHARE ROW EXCLUSIVE (không phải ACCESS EXCLUSIVE) — mức này chặn INSERT/UPDATE/DELETE nhưng **cho SELECT chạy**. Vì trong lab này FK nằm cùng transaction với CHECK, ACCESS EXCLUSIVE của CHECK là mức mạnh nhất và giữ suốt.

### Sơ đồ luồng
~~~seq
title: Migration giữ AccessExclusiveLock, 512 session xếp hàng
actors: Flyway | PostgreSQL | API ledger | HikariCP | Client
Flyway -> PostgreSQL: BEGIN; ADD CONSTRAINT CHECK (amount <> 0)
PostgreSQL -> PostgreSQL: quét 61 triệu dòng để validate
note PostgreSQL: giữ AccessExclusiveLock tới COMMIT
API ledger -> PostgreSQL: SELECT / INSERT (cần AccessShare / RowExclusive)
PostgreSQL --> API ledger: xếp hàng FIFO, chưa được cấp
API ledger -> HikariCP: giữ connection trong lúc chờ
HikariCP --> API ledger: timeout 3000ms
API ledger --> Client: 504
~~~

### Phòng ngừa và guardrail
- {{lock_timeout}} + {{statement_timeout}} cho role migration và role ứng dụng; retry migration có kiểm soát.
- {{idle_in_transaction_session_timeout}} để một connection leak không giữ lock vô hạn.
- Alert khi {{pg_locks}} có {{AccessExclusiveLock granted = f}} hoặc {{granted = t}} quá 5 giây.
- Quy trình review migration: mọi {{ADD CONSTRAINT}} trên bảng lớn phải có {{NOT VALID}} + {{VALIDATE CONSTRAINT}}; mọi {{CREATE INDEX}} phải {{CONCURRENTLY}} và chạy ngoài transaction.
- CI chạy migration trên bản sao dữ liệu thật (hoặc staging có số dòng tương đương) để đo thời gian giữ lock trước khi lên production.

### Trả lời mẫu khi phỏng vấn
"Migration chạy trong một transaction Flyway. Câu ALTER TABLE thêm CHECK cần AccessExclusiveLock và phải quét 61 triệu dòng để kiểm tra dữ liệu cũ. Vì nằm cùng transaction với các câu trước, AccessExclusiveLock được giữ tới COMMIT, tức hơn 3 phút. AccessExclusive xung đột với mọi lock, kể cả AccessShareLock của SELECT, nên 512 backend xếp hàng, pool cạn, API trả 504 dù CPU chỉ 11% — đây là blocking chứ không phải quá tải. Tôi đặt lock_timeout cho role migration, chạy ngoài giờ cao điểm, và quan trọng nhất là chia nhỏ: thêm constraint với NOT VALID để không quét, rồi VALIDATE CONSTRAINT — câu này chỉ cần ShareUpdateExclusiveLock nên không chặn đọc/ghi. FK thì NOT VALID rồi validate tương tự. Ngoài ra tôi thêm guardrail: idle_in_transaction_session_timeout, alert AccessExclusiveLock granted = f, và review migration bắt buộc có NOT VALID cho bảng lớn."

> Senior tip: Trên PostgreSQL, **một ACCESS EXCLUSIVE đang bị giữ là "cổ chai" chặn tất cả**, kể cả SELECT. Vì vậy migration DDL trên bảng nóng phải luôn có {{lock_timeout}} và chạy lúc bảng ít lock nhất. Nhưng quan trọng hơn: hãy thiết kế migration theo kiểu **thêm cấu trúc trước, validate sau** ({{NOT VALID}} + {{VALIDATE CONSTRAINT}}, {{CREATE INDEX CONCURRENTLY}}) để thời gian giữ lock chỉ còn vài trăm mili giây. Và nhớ rằng Flyway bọc mỗi migration trong một transaction — lock không nhả giữa các câu lệnh.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: migration cần ACCESS EXCLUSIVE và phải quét 61 triệu dòng để validate CHECK, giữ lock suốt transaction',
    'Giải thích đúng hàng đợi lock FIFO khiến 468 SELECT (AccessShareLock) và 44 ghi (RowExclusiveLock) cùng bị chặn',
    'Dẫn chứng đúng: AccessExclusiveLock granted = t, AccessShareLock granted = f n = 468, RowExclusiveLock granted = f n = 44, 512 backend wait_event_type = Lock, pg_blocking_pids = {51422}, CPU 11%',
    'Giải thích đúng vì sao 23:30 thành công (không có lock giữ) và vì sao Flyway transaction giữ lock tới COMMIT',
    'Đề xuất sửa đúng: lock_timeout, NOT VALID + VALIDATE CONSTRAINT (ShareUpdateExclusiveLock), ADD FOREIGN KEY dùng ShareRowExclusiveLock, CREATE INDEX CONCURRENTLY ngoài transaction, chia migration + guardrail',
  ],
  tags: ['postgresql', 'lock', 'migration', 'flyway', 'access-exclusive-lock', 'not-valid', 'validate-constraint'],
},
{
  id: 'lab-sql-027',
  category: 'sql',
  title: 'Chuyển tiền A→B và B→A đồng thời trên PostgreSQL 16 gây deadlock detected',
  level: 'senior',
  scenario: `**Bối cảnh.** Hệ thống ví điện tử PayV (Spring Boot 3.3, PostgreSQL 16.2 trên RDS, HikariCP max 30) xử lý chuyển tiền nội bộ giữa các ví khách hàng. Bảng {{wallet}} có cột {{id (bigint PK), balance (numeric(18,2))}}. Service {{TransferService.transfer(fromId, toId, amount)}} chạy trong một transaction: SELECT … FOR UPDATE từng ví theo thứ tự fromId rồi toId, sau đó UPDATE số dư.

**Triệu chứng (22/04/2026).** Khoảng 0,7% giao dịch chuyển tiền trả lỗi {{CannotAcquireLockException: ERROR: deadlock detected}} (HTTP 500), tập trung vào các cặp chuyển tiền ngược nhau (A→B và B→A cùng lúc). RDS log ghi deadlock detected, HikariCP pool không cạn (waiting = 0), CPU 8%.

**Việc bạn có.** Ba artifact dưới đây lấy từ production lúc 10:12. Hãy tìm nguyên nhân gốc, chứng minh bằng pid/xid/timestamp, rồi đề xuất cách sửa ngắn hạn và phòng ngừa.`,
  artifacts: [
    {
      name: 'postgresql-deadlock.log',
      lang: 'text',
      content: `2026-04-22 10:12:03.451 UTC [18421] ERROR:  deadlock detected
2026-04-22 10:12:03.451 UTC [18421] DETAIL:  Process 18421 waits for ShareLock on transaction 987654; blocked by process 18422.
        Process 18422 waits for ShareLock on transaction 987653; blocked by process 18421.
2026-04-22 10:12:03.451 UTC [18421] HINT:  See server log for query details.
2026-04-22 10:12:03.451 UTC [18421] CONTEXT:  while locking tuple (0,14) in relation "wallet"
2026-04-22 10:12:03.451 UTC [18421] STATEMENT:  UPDATE wallet SET balance = balance - $1 WHERE id = $2
2026-04-22 10:12:03.452 UTC [18422] ERROR:  deadlock detected
2026-04-22 10:12:03.452 UTC [18422] DETAIL:  Process 18422 waits for ShareLock on transaction 987653; blocked by process 18421.
        Process 18421 waits for ShareLock on transaction 987654; blocked by process 18422.
2026-04-22 10:12:03.452 UTC [18422] CONTEXT:  while locking tuple (0,15) in relation "wallet"
2026-04-22 10:12:03.452 UTC [18422] STATEMENT:  UPDATE wallet SET balance = balance + $1 WHERE id = $2`,
    },
    {
      name: 'pg_stat_activity.txt',
      lang: 'text',
      content: ` pid  | usename | state  |         query_start         | wait_event_type | wait_event | xact_start
-------+---------+--------+----------------------------+-----------------+------------+----------------------------
 18421 | payv    | active | 2026-04-22 10:12:03.410+00 | Lock            | transactionid | 2026-04-22 10:12:03.405+00
 18422 | payv    | active | 2026-04-22 10:12:03.412+00 | Lock            | transactionid | 2026-04-22 10:12:03.407+00
-- xid: 18421 = 987653, 18422 = 987654
-- wallet rows locked: pid 18421 holds row-level lock on wallet.id=1 (A), waits for wallet.id=2 (B)
--                   pid 18422 holds row-level lock on wallet.id=2 (B), waits for wallet.id=1 (A)`,
    },
    {
      name: 'app-log.txt',
      lang: 'text',
      content: `2026-04-22T10:12:03.453Z ERROR [http-nio-8080-exec-14] o.h.engine.jdbc.spi.SqlExceptionHelper - SQL Error: 0, SQLState: 40P01
2026-04-22T10:12:03.453Z ERROR [http-nio-8080-exec-14] o.s.orm.jpa.JpaSystemException - could not execute statement
2026-04-22T10:12:03.453Z WARN  [http-nio-8080-exec-14] org.springframework.dao.CannotAcquireLockException - deadlock detected
2026-04-22T10:12:03.453Z INFO  [http-nio-8080-exec-14] com.payv.transfer.TransferService - transfer(from=1,to=2,amount=50.00) FAILED after 48ms`,
    },
  ],
  questions: ['Nguyên nhân gốc là gì? Dẫn chứng từ artifact.', 'Bạn sẽ sửa thế nào, ngắn hạn và dài hạn?'],
  hints: ['Hai transaction cùng giữ row lock trên hai ví rồi chờ nhau.', 'Thứ tự UPDATE ngược nhau là nguyên nhân deadlock.'],
  answer: `**Tóm tắt:** Hai transaction chuyển tiền ngược chiều (A→B và B→A) cùng giữ row-level lock (SELECT … FOR UPDATE) trên ví của mình rồi chờ ví còn lại; PostgreSQL phát hiện chu trình chờ và huỷ một transaction với lỗi deadlock detected (SQLState 40P01).

### Nguyên nhân gốc
Service {{TransferService}} luôn khoá ví theo thứ tự {{fromId}} rồi {{toId}}. Khi có hai request đồng thời A→B và B→A, transaction thứ nhất giữ lock trên A và chờ B; transaction thứ hai giữ lock trên B và chờ A. Đây là deadlock kinh điển: mỗi bên giữ một tài nguyên và chờ tài nguyên của bên kia.

### Dẫn chứng
- {{postgresql-deadlock.log}}: pid 18421 waits for ShareLock on transaction 987654, blocked by 18422; pid 18422 waits for ShareLock on transaction 987653, blocked by 18421.
- {{pg_stat_activity.txt}}: xid 18421 = 987653 (giữ A, chờ B), xid 18422 = 987654 (giữ B, chờ A).
- {{app-log.txt}}: CannotAcquireLockException, SQLState 40P01, transfer(from=1,to=2) fail sau 48ms.

### Cách sửa
- Khoá theo thứ tự id cố định: trong transaction, luôn SELECT … FOR UPDATE theo id tăng dần (min(fromId,toId) trước, max sau), bất kể chiều chuyển tiền.
- Thêm retry có giới hạn (ví dụ 3 lần) cho deadlock (SQLState 40P01) và serialization failure (40001), với backoff nhỏ.
- Giữ transaction ngắn: chỉ khoá và UPDATE, không gọi service ngoài trong transaction.

### Phòng ngừa
- Unit test concurrency mô phỏng A→B và B→A đồng thời.
- Metric deadlock_count trong pg_stat_database; alert khi tăng.
- Idempotency key cho chuyển tiền để retry an toàn.
- Review code: mọi chỗ SELECT … FOR UPDATE phải có thứ tự id cố định.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: thứ tự khoá ngược nhau giữa hai transaction',
    'Dẫn chứng đúng pid/xid/timestamp deadlock',
    'Đề xuất sửa đúng: khoá theo thứ tự id cố định + retry có giới hạn',
    'Đề xuất phòng ngừa: test concurrency, metric, idempotency',
  ],
  hints: ['Hai transaction cùng giữ row lock trên hai ví rồi chờ nhau.', 'Thứ tự UPDATE ngược nhau là nguyên nhân deadlock.'],
  tags: ['postgresql', 'deadlock', 'lock', 'transfer', 'for-update'],
},
{
  id: 'lab-sql-028',
  category: 'sql',
  title: 'Bảng job queue nghẽn khóa khi 20 worker cùng SELECT FOR UPDATE',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn logistics ShipLane vận hành module booking-queue: sau khi API tạo task, 20 worker cùng consumer lệnh:

~~~sql
SELECT tq.task_id, tq.shipping_order_id, tq.payload
FROM task_queue tq
WHERE tq.status = 'PENDING'
ORDER BY tq.enqueued_at
LIMIT 1
FOR UPDATE;
~~~

**Triệu chứng (14/03/2026, 14:00).** Throughput tụt từ ~35 task/s xuống còn ~15 task/s; hàng đợi PENDING tăng nhưng worker không tiến hành xử lý. {{pg_stat_activity}} cho thấy toàn bộ backend của worker đều ở state **active** với {{wait_event_type = Lock}} / {{wait_event = transactionid}} trên cùng bảng task_queue.

**Việc bạn có.** Hai artifact: snapshot {{pg_stat_activity}} lúc 14:05 và snapshot {{pg_locks}} lúc 14:05:20. Hãy tìm đúng vòng chờ và sửa bằng {{FOR UPDATE SKIP LOCKED}} + index phù hợp + transaction ngắn.`,
  artifacts: [
    {
      name: 'pg-stat-activity-queue.txt',
      lang: 'text',
      content: `-- 2026-03-14 14:05:12 +07, RDS shiplane-primary (PostgreSQL 15.6)
-- 20 worker consumer chạy lệnh SELECT ... FOR UPDATE trên task_queue
SELECT pid, usename, application_name, state, xact_start, wait_event_type, wait_event, left(query, 60) AS query
FROM pg_stat_activity
WHERE datname = 'shiplane' AND backend_type = 'client backend' AND state = 'active'
ORDER BY xact_start;
  pid  | usename   | application_name | state |         xact_start         | wait_event_type | wait_event |                            query
-----+-----------+-------------------+-------+---------------------------+-----------------+------------+---------------------------------------------------------
  5121 | worker_01 | worker-svc        | active | 2026-03-14 14:02:41+07 | Lock           | transactionid | SELECT tq.task_id, tq.shipping_order_id, tq.payload
  5122 | worker_02 | worker-svc        | active | 2026-03-14 14:02:44+07 | Lock           | transactionid | SELECT tq.task_id, tq.shipping_order_id, tq.payload
  5123 | worker_03 | worker-svc        | active | 2026-03-14 14:02:47+07 | Lock           | transactionid | SELECT tq.task_id, tq.shipping_order_id, tq.payload

-- tổng hợp: hàng đợi task_queue backlog = 4.820 task PENDING
-- throughput 15 task/s cho thấy mỗi task bị worker kia chờ dành hàng.`,
    },
    {
      name: 'pg-locks-queue.txt',
      lang: 'text',
      content: `-- 2026-03-14 14:05:20 +07, RDS shiplane-primary
SELECT pid, locktype, mode, granted, relation::regclass AS relation, page, tuple
FROM pg_locks
WHERE relation = 'task_queue'::regclass
ORDER BY pid, granted, locktype;
  pid  |     locktype      |       mode       | granted | relation   | page | tuple
------+------------------+-----------------+---------+-------------+------+----------
  5121 | relation         | RowExclusiveLock | t       | task_queue |      |
  5121 | transactionid     | ShareLock        | f       |             |      |      |
  5122 | relation         | RowExclusiveLock | t       | task_queue |      |
  5122 | transactionid     | ShareLock        | f       |             |      |     `,
    },
  ],
  questions: [
    'Vì sao 20 worker cùng lệnh SELECT ... FOR UPDATE trên bảng task_queue lại tạo hàng loạt session chờ Lock/transactionid, và throughput tụt còn ~15 task/s?',
    'Bạn sửa bằng những gì để mỗi worker nhận đúng task chưa bị khóa, và làm sao để transaction ngắn hơn?',
  ],
  hints: [
    'Một statement SELECT ... FOR UPDATE ... LIMIT 1 mà nhiều worker cùng chạy: worker đầu khóa task, worker sau chờ. Phải có SKIP LOCKED hoặc cơ chế nhận task không khóa chung.',
    'Index phù hợp: (status, enqueued_at) để ORDER BY ... LIMIT 1 có thứ tự sạch, không cần sort rồi FOR UPDATE.',
  ],
  answer: `**Tóm tắt:** Mọi worker cùng chạy SELECT ... FOR UPDATE ... LIMIT 1 nên có thể khóa cùng một task; các worker sau chờ ShareLock trên transactionid của worker trước. Hệ quả: throughput tụt xuống ~15 task/s, hàng đợi nghẽn. Sửa bằng FOR UPDATE SKIP LOCKED để worker bỏ qua task đang giữ và nhận task tiếp theo, thêm index (status, enqueued_at), và rút ngắn transaction.

### Nguyên nhân gốc
1. Thiếu SKIP LOCKED: worker sau chờ cho tới khi worker trước commit/rollback, task đó không bao giờ được xử lý bởi worker kia.
2. Transaction giữ lock lâu hơn tối thiểu.

### Dẫn chứng
- Artifact 1: 20 backend worker active, wait_event_type = Lock, wait_event = transactionid, cùng bảng task_queue, backlog = 4.820 task PENDING.

### Cách sửa
~~~sql
SELECT tq.task_id, tq.shipping_order_id, tq.payload
FROM task_queue tq
WHERE tq.status = 'PENDING'
ORDER BY tq.enqueued_at
LIMIT 1
FOR UPDATE SKIP LOCKED;
~~~

### Phòng ngừa and monitoring
- Bật log_lock_waits.

> Senior tip: Khi có 20 worker cùng SELECT FOR UPDATE trên cùng bảng, việc dùng SKIP LOCKED thay vì FOR UPDATE chờ chắc chắn là chênh lệch giữa 15 task/s và 35+ task/s. Luôn đặt index (status, enqueued_at) để ORDER BY + LIMIT nhanh, và kiểm tra hàng đợi backlog mỗi giờ để phát hiện sớm.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: FOR UPDATE chờ chắc chắn khiến nhiều worker cùng chờ cùng một task, chờ throughput tụt',
    'Dẫn chứng đúng artifact: 20 backend active, wait_event_type=Lock, backlog 4.820 task PENDING, và vòng chờ transactionid',
    'Đề xuất sửa đúng: FOR UPDATE SKIP LOCKED + index (status, enqueued_at) + rút ngắn transaction',
    'Nêu rõ monitoring cơ chế SKIP LOCKED và tốc độ xử lý thay đổi so với cơ chế chờ.',
  ],
  tags: ['postgresql', 'lock', 'job-queue', 'for-update', 'skip-locked'],
},
{
  id: 'lab-sql-029',
  category: 'sql',
  title: 'Bảng ledger_entry phình do job batch dài xử lý hàng triệu bản ghi giữ snapshot, autovacuum không dọn được dead tuple',
  level: 'senior',
  scenario: `**Bối cảnh.** Dịch vụ ledger-batch chạy một job nightly: job này mở một transaction PostgreSQL, cập nhật hàng triệu bản ghi bảng ledger_entry để tạo báo cáo daily, giữ transaction mở dài (6–8 tiếng) để duy nhất snapshot dữ liệu.

**Triệu chứng (10/04/2026, 14:23).** p95 câu SELECT ledger_entry tăng từ 2 ms lên 80 ms trong ngày. {{pg_stat_user_tables}} báo {{n_dead_tup}} tăng gấp ba, query chậm dần. {{pg_stat_activity}} cho thấy một backend state **active** với xact_start lúc 08:14 hôm nay (đã chạy ~6 tiếng), transaction đang giữ snapshot, query = "UPDATE ledger_entry SET status = ?, amount = ? WHERE id > ?".

**Việc bạn có.** Ba artifact: snapshot {{pg_stat_user_tables}}, snapshot {{pg_stat_activity}}, log VACUUM VERBOSE. Hãy tìm transaction nào giữ snapshot lâu, vì sao autovacuum không xoá dead tuple, và sửa.`,
  artifacts: [
    {
      name: 'pg-stat-user-tables.txt',
      lang: 'text',
      content: `-- 2026-04-10 14:22 +07, RDS ledger-primary (PostgreSQL 15.6)
-- pg_stat_user_tables cho bảng ledger_entry
schemaname | relname | n_live_tup | n_dead_tup | last_vacuum | last_autovacuum | vacuum_count | autovacuum_count
public     | ledger_entry | 5200000   | 5600000    | 2026-04-03 02:10:00+07 | 2026-04-03 02:10:00+07 | 12 | 124
-- n_dead_tup / n_live_tup = 108%, dead tuple vượt xa dữ liệu sống
-- pg_relation_size('ledger_entry') = 4.1 GB heap, pg_total_relation_size = 5.3 GB
-- Ước tính bloat: dead tuple ~ 1.2 GB`,
    },
    {
      name: 'pg-stat-activity.txt',
      lang: 'text',
      content: `-- 2026-04-10 14:23 +07
       -- pg_stat_activity: phiên đang mở lâu nhất (active)
       pid  | usename | state    | xact_start            | query_start           | wait_event_type | wait_event | query
       18421 | ledger-batch | active  | 2026-04-10 08:14:00+07 | 2026-04-10 08:14:00+07 | Client         | ClientRead | UPDATE ledger_entry SET status = ?, amount = ? WHERE id > 1000000;
       -- xid age của phiên này: 48.300.000 (tuổi xid giữ)
       -- max_connections = 200, active = 52, idle in transaction = 2`
    },
    {
      name: 'vacuum-verbose.txt',
      lang: 'text',
      content: `-- 2026-04-10 14:24 +07
       -- Cảnh báo từ monitoring (Datadog)
       WARNING: database "ledger" must be vacuumed within 1200000 transactions
       -- autovacuum: launcher = on, max_workers = 3, naptime = 1min
       -- log_autovacuum_min_duration = 0
       -- log: "automatic vacuum of table \"public.ledger_entry\" skipped because of lock conflict - dead row versions cannot be removed yet, oldest xmin: 12345678"`
    },
  ],
  questions: [
    'Vì sao autovacuum không dọn được dead tuple dù đang bật và chạy liên tục? Dẫn chứng bằng artifact.',
    'Vì sao bảng phình to làm query SELECT ledger_entry chậm dù plan không đổi?',
    'Bạn xử lý thế nào trong ngày và thiết kế dài hạn để không tái diễn?',
  ],
  hints: [
    'Tìm phiên long-running active trong pg_stat_activity (state = active), xact_start cũ. Phiên này giữ snapshot, chặn autovacuum.',
    'n_dead_tup tăng + vacuum log skip (dead row versions cannot be removed) = autovacuum bị chặn.',
    'xid age tăng → nguy cơ wraparound; cần vacuum freeze.',
  ],
  answer: `**Tóm tắt:** Một job batch nightly mở một transaction dài (6–8 tiếng) trên bảng ledger_entry để duy nhất snapshot khi tính toán báo cáo daily. Transaction này cập nhật hàng triệu bản ghi, sinh ra nhiều dead tuple. Autovacuum chạy nhưng bị skip vì lock conflict — dead tuple vẫn "cần" cho snapshot của transaction batch. Dead tuple tích luỹ làm bảng phình to → nhiều page hơn → query SELECT đọc nhiều page hơn → chậm dần, mặc dù plan không đổi. Xid age tăng cũng báo nguy cơ transaction ID wraparound.

### Nguyên nhân gốc
1. Transaction batch mở transaction dài (6–8 tiếng) giữ snapshot dữ liệu → mọi dead tuple sinh ra sau đó vẫn "cần" cho transaction batch.
2. Autovacuum chạy nhưng bị skip vì lock conflict (log xác nhận: "dead row versions cannot be removed yet"): dead tuple vẫn còn cần cho snapshot.
3. Dead tuple tích luỹ: n_dead_tup / n_live_tup = 108%, làm bloat ~1.2 GB heap, query SELECT đọc nhiều page hơn.

### Dẫn chứng
- Artifact 1: n_dead_tup = 5.600.000, n_live_tup = 5.200.000, last_autovacuum = 03/04 (6 ngày trước), tỷ lệ dead tuple 108%.
- Artifact 2: pid 18421 state active (transaction dài), xact_start 08:14, query đang UPDATE, xid age 48.3M.
- Artifact 3: vacuum skip log: "dead row versions cannot be removed yet, oldest xmin: 12345678".

### Cách sửa ngắn hạn
- Terminate phiên active transaction dài (pg_terminate_backend) sau khi xác định không còn cần.
- Chạy VACUUM (FULL nếu cần) ngoài giờ cao điểm để thu hồi space.
- Bật idle_in_transaction_session_timeout (ví dụ 5 phút) để tự kill phiên dài.

### Cách sửa dài hạn
- Sửa code: không mở transaction batch dài; thay bằng commit mỗi 5000 bản ghi (batch nhỏ).
- Bật monitoring: alert khi n_dead_tup / n_live_tup > 100%, khi transaction active > 5 phút, khi xid age > 1 tỷ.
- Tune autovacuum: giảm autovacuum_vacuum_scale_factor cho bảng lớn, tăng autovacuum_max_workers.

### Phòng ngừa và monitoring
- Cảnh báo: alert khi n_dead_tup / n_live_tup > 100%, khi transaction active > 5 phút, khi xid age > 1 tỷ.
- Tune autovacuum: giảm autovacuum_vacuum_scale_factor cho bảng lớn, tăng autovacuum_max_workers.

> Senior tip: dead tuple không phải rác ngay lập tức — chúng cần cho snapshot của các phiên đang chạy. Vì vậy một transaction dài giữ snapshot là kẻ thù số 1 của vacuum. Luôn đặt idle_in_transaction_session_timeout và theo dõi pg_stat_activity.state = 'active' cùng xact_start cũ.
`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: phiên active transaction giữ snapshot, chặn autovacuum xoá dead tuple',
    'Dẫn chứng đúng: n_dead_tup 5.6M, vacuum skip log, pid active transaction với xact_start cũ, xid age',
    'Giải thích đúng vì sao bloat làm query SELECT chậm (nhiều page hơn, cùng plan)',
    'Đề xuất sửa đúng: terminate phiên, VACUUM, idle_in_transaction_session_timeout, tune autovacuum',
    'Có monitoring/phòng ngừa: alert n_dead_tup ratio, transaction active, xid age',
  ],
  tags: ['postgresql', 'vacuum', 'bloat', 'active-transaction', 'autovacuum'],
},
{
  id: 'lab-sql-030',
  category: 'sql',
  title: 'API lịch sử lệnh OFFSET 200000 đọc vứt 200 nghìn dòng: keyset pagination + index',
  level: 'senior',
  scenario: `**Bối cảnh.** Ngân hàng số FinBank chạy service {{transaction-history}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{account_transaction}} lưu lịch sử giao dịch của 1.2 triệu tài khoản: **62.418.904 dòng** (~14 GB heap + 8,2 GB index). Mỗi tài khoản trung bình ~52 giao dịch, nhưng 5% tài khoản lớn (doanh nghiệp) có 5.000–50.000 giao dịch.

Màn hình "Lịch sử giao dịch" của khách hàng doanh nghiệp gọi:
~~~text
GET /api/v1/accounts/{accountId}/transactions?page=2000&size=100
~~~
để xem trang 2000 (OFFSET 200.000). API này dùng Spring Data JPA {{Pageable}} mặc định — sinh ra câu SQL có {{OFFSET 200000 LIMIT 100}}.

**Triệu chứng (20/03/2026, 10:15).** p95 của endpoint nhảy từ 45 ms lên **4,2 giây**, CPU RDS từ 22% lên 88%. DBA chạy EXPLAIN ANALYZE trên production và thấy **Index Scan đọc 200.100 dòng chỉ để trả 100 dòng**. Index {{idx_account_transaction_account_created}} (btree trên (account_id, created_at DESC, id)) đã tồn tại nhưng planner vẫn phải duyệt qua 200.000 entry trước khi lấy 100 dòng cần thiết.

**Điều đã thử, không ăn.** Tăng {{work_mem}} lên 256 MB (không giảm được số dòng phải đọc), tạo read-replica cho báo cáo (vẫn phải OFFSET trên replica), cache trang đầu (không giúp trang sâu).

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu OFFSET, schema + index, và log ứng dụng. Hãy chỉ ra vì sao OFFSET tốn kém, và sửa bằng keyset pagination + index phù hợp.`,
  artifacts: [
    {
      name: 'explain-offset.txt',
      lang: 'text',
      content: `-- 2026-03-20 10:15:41 +07, psql trên RDS finbank-primary (PostgreSQL 15.6)
finbank=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, account_id, amount, type, created_at, balance_after
FROM account_transaction
WHERE account_id = 88412
ORDER BY created_at DESC, id DESC
LIMIT 100 OFFSET 200000;
                                                          QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=14821.56..14821.78 rows=100 width=64) (actual time=4182.331..4182.358 rows=100 loops=1)
   ->  Index Scan using idx_account_transaction_account_created on account_transaction
         (cost=0.57..17320.45 rows=230140 width=64) (actual time=0.041..4178.212 rows=200100 loops=1)
               Index Cond: (account_id = 88412)
               Buffers: shared hit=184521 read=1243
 Planning Time: 0.284 ms
 Execution Time: 4183.401 ms
(7 rows)

Time: 4183.712 ms

-- So sánh: cùng điều kiện, trang đầu (OFFSET 0):
finbank=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, account_id, amount, type, created_at, balance_after
FROM account_transaction
WHERE account_id = 88412
ORDER BY created_at DESC, id DESC
LIMIT 100;
                                                          QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=0.57..148.21 rows=100 width=64) (actual time=0.031..0.412 rows=100 loops=1)
   ->  Index Scan using idx_account_transaction_account_created on account_transaction
         (cost=0.57..17320.45 rows=230140 width=64) (actual time=0.029..0.398 rows=100 loops=1)
               Index Cond: (account_id = 88412)
               Buffers: shared hit=184 read=2
 Planning Time: 0.241 ms
 Execution Time: 0.471 ms
(7 rows)

Time: 0.782 ms`,
    },
    {
      name: 'schema-and-index.txt',
      lang: 'text',
      content: `-- 2026-03-20 10:16:02 +07
finbank=# \\d+ account_transaction
                                          Table "public.account_transaction"
   Column        |           Type           | Collation | Nullable |      Default
----------------+--------------------------+-----------+----------+-------------------
 id             | bigint                   |           | not null | nextval('...')
 account_id     | bigint                   |           | not null |
 amount         | numeric(18,2)            |           | not null |
 type           | character varying(16)    |           | not null |
 created_at     | timestamp with time zone |           | not null | now()
 balance_after  | numeric(18,2)            |           | not null |
 description    | character varying(256)   |           |          |
Indexes:
     "idx_account_transaction_account_created" btree (account_id, created_at DESC, id)
     "account_transaction_pkey" PRIMARY KEY, btree (id)

finbank=# SELECT reltuples::bigint AS est_rows,
             pg_size_pretty(pg_total_relation_size('account_transaction')) AS total_size,
             pg_size_pretty(pg_relation_size('account_transaction')) AS heap_only
FROM pg_class WHERE relname = 'account_transaction';
  est_rows | total_size | heap_only
----------+------------+-----------
 62418904 | 22140 MB   | 14023 MB

finbank=# SELECT count(*) FROM account_transaction WHERE account_id = 88412;
  count
-------
 35420
-- Tài khoản 88412 là doanh nghiệp lớn: 35.420 giao dịch. Trang 2000 (OFFSET 200.000) vượt tổng số dòng!`,
    },
    {
      name: 'app-transaction-history.log',
      lang: 'text',
      content: `2026-03-20 10:15:42.118 DEBUG [http-nio-8080-exec-14] o.h.SQL :
    select at1_0.id,at1_0.account_id,at1_0.amount,at1_0.type,at1_0.created_at,at1_0.balance_after
    from account_transaction at1_0
    where at1_0.account_id=?
    order by at1_0.created_at desc, at1_0.id desc
    limit ? offset ?
2026-03-20 10:15:46.301 INFO  [http-nio-8080-exec-14] c.f.t.TransactionController :
    GET /api/v1/accounts/88412/transactions?page=2000&size=100 -> 200 in 4188 ms
2026-03-20 10:15:46.552 DEBUG [http-nio-8080-exec-7] o.h.SQL : (cùng câu, page=2001)
2026-03-20 10:15:50.741 INFO  [http-nio-8080-exec-7] c.f.t.TransactionController :
    GET /api/v1/accounts/88412/transactions?page=2001&size=100 -> 200 in 4189 ms
-- pattern: mỗi request trang sâu mất ~4,2 giây, CPU RDS 88%`,
    },
  ],
  questions: [
    'Vì sao câu OFFSET 200000 LIMIT 100 đọc 200.100 dòng index entry chỉ để trả 100 dòng? Chỉ ra bằng dòng nào trong EXPLAIN.',
    'So sánh với OFFSET 0 (0,47 ms): chênh lệch 4183/0,47 ≈ 8.900 lần. Tại sao OFFSET không thể "nhảy" thẳng đến vị trí?',
    'Bạn sửa API này thế nào cho trang sâu cũng dưới 50 ms? Giải thích keyset pagination (WHERE (created_at, id) < (:lastCreatedAt, :lastId)) và vì sao index (account_id, created_at DESC, id) phù hợp.',
  ],
  hints: [
    'Đọc dòng "actual time=0.041..4178.212 rows=200100 loops=1": Index Scan phải duyệt 200.100 entry (200.000 OFFSET + 100 LIMIT) rồi vứt 200.000 dòng đầu.',
    'PostgreSQL không hỗ trợ "seek" trong index — OFFSET luôn phải đọc rồi bỏ. Với keyset pagination, điều kiện WHERE (created_at, id) < (:lastCreatedAt, :lastId) cho phép planner "nhảy" thẳng tới vị trí cuối trang trước.',
    'Index (account_id, created_at DESC, id) khớp ORDER BY created_at DESC, id DESC và điều kiện WHERE trên account_id + cặp (created_at, id).',
  ],
  answer: `**Tóm tắt:** Endpoint dùng OFFSET 200.000 khiến PostgreSQL phải **duyệt qua 200.100 entry index** (Index Scan trên {{idx_account_transaction_account_created}}) rồi vứt 200.000 dòng đầu — mất 4,2 giây. Trang đầu (OFFSET 0) chỉ 0,47 ms vì đọc đúng 100 dòng. Sửa bằng **keyset pagination**: client truyền {{lastCreatedAt}} và {{lastId}} của dòng cuối trang trước, server chạy {{WHERE account_id = ? AND (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 100}} — planner dùng index để **nhảy thẳng** tới vị trí, không đọc dòng thừa.

### Vì sao OFFSET tốn kém (giải thích từ gốc)
**OFFSET** trong PostgreSQL hoạt động như sau: planner chạy câu query bình thường, nhận được các dòng theo thứ tự ORDER BY, **bỏ qua N dòng đầu** (N = OFFSET), rồi trả M dòng tiếp theo (M = LIMIT). Cơ chế này **luôn phải đọc N + M dòng** từ index/bảng — không có cách nào "nhảy" thẳng đến dòng thứ N+1 vì B-tree không lưu số thứ tự dòng (rank).

| Trang | OFFSET | Dòng index phải đọc | Thời gian |
|---|---|---|---|
| 1 (trang đầu) | 0 | 100 | 0,47 ms |
| 2.000 | 200.000 | 200.100 | 4.183 ms |
| 10.000 | 1.000.000 | 1.000.100 | ~20 giây (dự kiến) |

Chi phí tăng **tuyến tính theo OFFSET**. Lưu ý: artifact 2 cho thấy tài khoản 88412 chỉ có 35.420 giao dịch, OFFSET 200.000 vượt tổng số dòng — planner vẫn phải duyệt hết 35.420 entry index (thực tế ít hơn 200.100 do dữ liệu ít hơn ước lượng statistics) rồi trả về rỗng. EXPLAIN ANALYZE báo actual rows=200100 vì statistics ước lượng 230.140 dòng cho account_id này, nhưng thực tế chỉ có 35.420.

### Dẫn chứng
- Artifact 1, câu OFFSET 200000: **"actual time=0.041..4178.212 rows=200100 loops=1"** — Index Scan duyệt 200.100 entry (theo ước lượng statistics), **Buffers: shared hit=184521 read=1243** (gần 186 nghìn page, ~1,4 GB dữ liệu đọc từ RAM). **Execution Time: 4183.401 ms**.
- Artifact 1, câu OFFSET 0: **"actual time=0.029..0.398 rows=100 loops=1"** — chỉ đọc 100 entry, **Buffers: shared hit=184 read=2**, **Execution Time: 0.471 ms**.
- Chênh lệch **4183/0,47 ≈ 8.900 lần** chỉ do OFFSET. Index đã đúng, ORDER BY đã khớp index — vấn đề không phải index kém mà là cơ chế OFFSET.
- Artifact 2: tài khoản 88412 chỉ có **35.420 giao dịch**, OFFSET 200.000 vô nghĩa (trả rỗng) nhưng planner vẫn phải duyệt index range theo ước lượng statistics.
- Artifact 3: log ứng dụng mỗi request trang sâu ~4,2 giây, CPU RDS 88%.

### Keyset pagination (cursor-based pagination) — cách hoạt động
Thay vì dùng {{OFFSET}}, client ghi nhớ **con trỏ (cursor)** của dòng cuối trang hiện tại: cặp giá trị {{(created_at, id)}}. Lần sau client truyền cursor này lên, server thêm điều kiện:

~~~sql
SELECT id, account_id, amount, type, created_at, balance_after
FROM account_transaction
WHERE account_id = 88412
  AND (created_at, id) < (:lastCreatedAt, :lastId)   -- "nhỏ hơn" theo thứ tự DESC
ORDER BY created_at DESC, id DESC
LIMIT 100;
~~~

PostgreSQL so sánh **tuple comparison** theo thứ tự từ trái sang phải: trước so sánh {{created_at}}, nếu bằng mới so {{id}}. Điều kiện {{(created_at, id) < (A, B)}} nghĩa là "created_at < A HOẶC (created_at = A VÀ id < B)" — chính xác là "dòng đứng sau (A, B) theo thứ tự DESC".

Với index {{(account_id, created_at DESC, id)}}, planner dùng **Index Cond** trên cả ba cột: {{account_id = 88412}} + {{(created_at, id) < (...)}} → **nhảy thẳng** đến vị trí cursor, đọc đúng 100 dòng tiếp theo. Không đọc dòng thừa, chi phí **không phụ thuộc vào trang**.

### Cách sửa
**Ngắn hạn (hôm nay):**
- Thêm endpoint mới dùng keyset pagination:
~~~text
GET /api/v1/accounts/{accountId}/transactions?cursor=...&size=100
~~~
- FE: nút "Trang sau" truyền cursor={{lastCreatedAt}}:{{lastId}}; nút "Trang trước" cần lưu cursor đầu trang hiện tại (hoặc dùng OFFSET cho trang trước gần — chấp nhận được vì OFFSET nhỏ).
- Giữ endpoint cũ cho tương thích nhưng ghi log cảnh báo khi {{page * size > 10000}}.

**Dài hạn:**
- Loại bỏ OFFSET hoàn toàn cho API danh sách có phân trang sâu. Keyset pagination là chuẩn cho feed, lịch sử, log.
- Nếu cần "nhảy tới trang N": ước lượng vị trí bằng {{COUNT(*) WHERE account_id = ? AND created_at < :mid}} rồi binary search cursor — phức tạp, hiếm khi cần thiết.
- Index {{(account_id, created_at DESC, id)}} đã đúng. Nếu ORDER BY khác, điều chỉnh index khớp ORDER BY (cột equality trước, cột sort sau).

### So sánh OFFSET vs Keyset
| Tiêu chí | OFFSET | Keyset (cursor) |
|---|---|---|
| Độ phức tạp client | Thấp (page, size) | Cao hơn (lưu cursor, xử lý prev/next) |
| Hiệu năng trang sâu | Tệ (O(N)) | Tốt (O(1) đọc index) |
| Hỗ trợ "nhảy trang" | Có | Khó (cần binary search hoặc ước lượng) |
| Dữ liệu thay đổi giữa 2 trang | Dòng bị lặp/lỡ | Không lặp/lỡ (cursor gắn liền dữ liệu) |
| Tương thích SQL chuẩn | Có | Cần tuple comparison (PostgreSQL, MySQL 8+, SQL Server) |

### Lỗi hay gặp
- Dùng {{WHERE created_at < :lastCreatedAt}} (quên {{id}}) → khi nhiều giao dịch cùng mili-giây, cursor không xác định được vị trí duy nhất, dòng bị lặp hoặc lỡ.
- Sai hướng so sánh: ORDER BY DESC thì dùng {{<}}, ORDER BY ASC thì dùng {{>}}.
- Index không khớp ORDER BY: nếu ORDER BY created_at DESC, id DESC mà index là (account_id, created_at ASC, id) → planner không dùng index cho sort, phải filesort.
- Không {{ANALYZE}} sau khi tạo index → planner có thể chọn Seq Scan cho tài khoản nhỏ.

### Sơ đồ luồng
~~~seq
title: Keyset pagination: client lưu cursor, server nhảy thẳng
actors: Client | transaction-history | PostgreSQL
Client -> transaction-history: GET /transactions?size=100 (trang đầu)
transaction-history -> PostgreSQL: WHERE account_id=88412 ORDER BY created_at DESC, id DESC LIMIT 100
PostgreSQL --> transaction-history: 100 dòng, cursor = (created_at_100, id_100)
transaction-history --> Client: data + cursor
Client -> transaction-history: GET /transactions?cursor=created_at_100:id_100&size=100
transaction-history -> PostgreSQL: WHERE account_id=88412 AND (created_at,id) < (cursor) ORDER BY ... LIMIT 100
PostgreSQL --> transaction-history: Index Scan nhảy thẳng, 100 dòng, 0,5 ms
transaction-history --> Client: data + cursor mới
~~~

### Trả lời mẫu khi phỏng vấn
"Endpoint lịch sử giao dịch dùng OFFSET 200.000. PostgreSQL không có seek trong index — OFFSET phải đọc 200.100 entry rồi vứt 200.000, mất 4,2 giây. Trang đầu chỉ 0,47 ms. Tôi đổi sang keyset pagination: client truyền cursor (created_at, id) của dòng cuối trang trước, server chạy WHERE account_id = ? AND (created_at, id) < (:cursor) ORDER BY created_at DESC, id DESC LIMIT 100. Index (account_id, created_at DESC, id) khớp ORDER BY và điều kiện cursor → planner nhảy thẳng, đọc đúng 100 dòng, mọi trang dưới 50 ms. Lưu ý phải có cả id trong cursor để xử lý trùng created_at."

> Senior tip: **OFFSET là kẻ thù số 1 của hiệu năng phân trang sâu**. Mọi hệ thống có feed, lịch sử, log với khả năng người dùng lướt sâu đều phải dùng keyset pagination từ ngày 1. Chi phí OFFSET tăng tuyến tính — trang 10.000 có thể tốn 20 giây trong khi keyset vẫn 0,5 ms. Và nhớ: cursor **phải đủ duy nhất** — nếu ORDER BY có cột có thể trùng giá trị (như created_at), hãy thêm PK vào cursor. Index phải khớp ORDER BY theo thứ tự: equality columns trước, sort columns sau.`,
  rubric: [
    'Chỉ đúng nguyên nhân: OFFSET 200.000 buộc Index Scan đọc 200.100 entry rồi vứt 200.000, chi phí tuyến tính theo OFFSET',
    'Dẫn chứng đúng: actual rows=200100 vs 100, Buffers 184521 vs 184, Execution Time 4183 ms vs 0,47 ms',
    'Giải thích đúng cơ chế OFFSET (không seek, phải đọc rồi bỏ) và keyset pagination (tuple comparison trên index)',
    'Đề xuất sửa đúng: keyset pagination với cursor (created_at, id), index (account_id, created_at DESC, id) khớp ORDER BY, so sánh OFFSET vs keyset',
    'Nêu lỗi hay gặp: quên id trong cursor, sai hướng so sánh, index không khớp ORDER BY',
  ],
  tags: ['postgresql', 'pagination', 'offset', 'keyset', 'cursor', 'index', 'explain'],
},
{
  id: 'lab-sql-031',
  category: 'sql',
  title: 'Xoá khách hàng thiếu index FK trên bảng con: RowExclusiveLock chặn 1.200 INSERT/giây',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử MegaMart chạy service {{customer-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{customers}} lưu 2.400.000 khách hàng. Bảng {{orders}} lưu 48.752.110 đơn hàng, có cột {{customer_id}} tham chiếu {{customers.id}} — **FK đã khai báo ở DB** nhưng **thiếu index trên customer_id**. Giờ cao điểm 10:00–12:00 hệ thống xử lý **1.200 INSERT đơn/giây**.

**Triệu chứng (21/03/2026, 10:45).** Một admin xoá 1 khách hàng test qua {{DELETE FROM customers WHERE id = 998877}} (chạy trong psql). Trong lúc câu DELETE chạy (~2 giây), **toàn bộ API tạo đơn hàng bị treo**: p95 nhảy từ 18 ms lên **2.1 giây**, CPU RDS từ 28% lên 92%. {{pg_stat_activity}} cho thấy 1.200 backend đang chờ {{wait_event_type = Lock}}, {{wait_event = relation}} trên bảng {{orders}}.

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của DELETE, snapshot {{pg_locks}}, và log ứng dụng. Hãy tìm nguyên nhân gốc, giải thích cơ chế RowExclusiveLock khi FK thiếu index, và cách sửa (tạo index CONCURRENTLY + FK NOT VALID).`,
  artifacts: [
    {
      name: 'explain-delete-customer.txt',
      lang: 'text',
      content: `-- 2026-03-21 10:45:12 +07, psql trên RDS megamart-primary (PostgreSQL 15.6)
megamart=# EXPLAIN (ANALYZE, BUFFERS)
DELETE FROM customers WHERE id = 998877;
                                                            QUERY PLAN
---------------------------------------------------------------------------------------------------
 Delete on customers  (cost=0.29..8.31 rows=1 width=6) (actual time=1842.331..1842.334 rows=1 loops=1)
   ->  Index Scan using customers_pkey on customers  (cost=0.29..8.31 rows=1 width=6) (actual time=0.021..0.024 rows=1 loops=1)
         Index Cond: (id = 998877)
 Planning Time: 0.284 ms
 Execution Time: 1843.401 ms
(5 rows)

Time: 1843.712 ms

-- Ghi chú: không có Seq Scan trên orders trong plan (kiểm tra FK chạy qua trigger RI ẩn), NHƯNG execution time 1.842 giây cho thấy điều gì đó chặn ở mức lock.
-- Thử chạy lại khi không có traffic: 0,8 ms.`,
    },
    {
      name: 'pg-locks-delete.txt',
      lang: 'text',
      content: `-- 2026-03-21 10:45:13 +07 (khi DELETE đang chạy)
megamart=# SELECT l.locktype, l.mode, l.granted, count(*) AS n, a.state
FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid
WHERE l.relation IN ('customers'::regclass, 'orders'::regclass)
GROUP BY l.locktype, l.mode, l.granted, a.state ORDER BY n DESC;

-- Trên bảng customers:
  locktype |       mode        | granted |  n  | state
-----------+-------------------+---------+-----+--------
 relation  | RowExclusiveLock  | t       |   1 | active (DELETE)

-- Trên bảng orders (FK đã khai báo, KHÔNG CÓ INDEX trên customer_id):
  locktype |               mode               | granted |  n  | state
-----------+----------------------------------+---------+-----+--------
 relation  | ShareRowExclusiveLock            | t       |   1 | active (DELETE customers)
 relation  | RowExclusiveLock                 | f       | 1200| active (INSERT orders)

-- DELETE customers đang giữ ShareRowExclusiveLock trên bảng orders (và RowExclusiveLock trên customers).
-- 1.200 INSERT orders xin RowExclusiveLock trên orders bị CHỜ (granted = f).

megamart=# SELECT pid, pg_blocking_pids(pid) AS blocked_by
FROM pg_stat_activity
WHERE wait_event_type = 'Lock' AND datname = 'megamart'
ORDER BY pid LIMIT 3;
  pid  | blocked_by
-------+------------
 51423 | {41210}
 51424 | {41210}
 51425 | {41210}
-- pid 41210 chính là session DELETE customers. Tất cả 1.200 INSERT orders bị nó chặn.`,
    },
    {
      name: 'app-orders-stuck.log',
      lang: 'text',
      content: `2026-03-21 10:45:12.118 DEBUG [http-nio-8080-exec-14] o.h.SQL :
    insert into orders (id, customer_id, total_amount, status, created_at) values (?,?,?,?,?)
2026-03-21 10:45:13.961 WARN  [http-nio-8080-exec-14] c.z.h.pool.HikariPool :
    MegaMart-HikariPool-1 - Connection is not available, request timed out after 3000ms.
2026-03-21 10:45:13.962 ERROR [http-nio-8080-exec-14] c.m.o.OrderController :
    POST /api/v1/orders -> 504 in 2145 ms
-- pattern: 1.200 INSERT/giây, mỗi cái chờ ~2 giây thì timeout, pool cạn, CPU 92%`,
    },
  ],
  questions: [
    'Vì sao DELETE trên bảng customers (chỉ 1 dòng) lại chặn 1.200 INSERT trên bảng orders? FK đã khai báo nhưng thiếu index trên customer_id — planner bắt buộc Seq Scan toàn bảng child.',
    'Giải thích cơ chế: PostgreSQL khi DELETE parent row phải kiểm tra child table có row tham chiếu không (trigger RI). Nếu child table KHÔNG CÓ index trên cột FK, planner buộc phải Seq Scan toàn bảng child → trong lúc scan, nó lấy RowExclusiveLock trên child table (relation-level) → chặn mọi INSERT/UPDATE/DELETE trên child table.',
    'Bạn sửa thế nào để không chặn ghi đơn hàng? Trình bày: (1) tạo index CONCURRENTLY trên orders.customer_id, (2) FK đã có sẵn, sau khi index xong planner dùng Index Scan, (3) nếu chưa có FK thì thêm FK NOT VALID + VALIDATE CONSTRAINT. Giải thích vì sao index giúp planner dùng Index Scan thay vì Seq Scan, từ đó không cần lock toàn bảng child.',
  ],
  hints: [
    'Đọc pg_locks: DELETE customers giữ ShareRowExclusiveLock trên orders (n = 1). 1.200 INSERT orders xin RowExclusiveLock trên orders bị granted = f. pg_blocking_pids trỏ về pid DELETE.',
    'PostgreSQL rule: DELETE/UPDATE trên parent table cần kiểm tra FK (qua trigger RI). Nếu child table có index trên cột FK → Index Scan (nhanh, lock tuple-level). Nếu KHÔNG CÓ index → Seq Scan toàn bảng child, giữ ShareRowExclusiveLock trên relation (toàn bảng) suốt quá trình scan.',
    'Index CONCURRENTLY không chặn ghi. Nếu chưa có FK: ADD CONSTRAINT NOT VALID không quét dữ liệu cũ. VALIDATE CONSTRAINT dùng ShareUpdateExclusiveLock (không chặn INSERT/UPDATE/DELETE).',
  ],
  answer: `**Tóm tắt:** Admin chạy {{DELETE FROM customers WHERE id = 998877}}. Bảng {{orders}} có cột {{customer_id}} tham chiếu {{customers.id}} — **FK đã khai báo ở DB** nhưng **thiếu index** trên {{customer_id}}. PostgreSQL khi DELETE parent row **bắt buộc phải kiểm tra** child table không có row tham chiếu (thông qua trigger RI nội bộ). Vì {{orders}} không có index trên {{customer_id}}, planner dùng **Seq Scan toàn bảng 48.752.110 dòng** để kiểm tra — trong lúc scan, nó giữ **ShareRowExclusiveLock trên bảng orders** (relation-level) → 1.200 INSERT/giây bị chờ lock, pool cạn, API tạo đơn trả 504 trong 2 giây. Sửa: tạo index {{CONCURRENTLY}} trên {{orders.customer_id}}.

### Kiến thức nền: FK và lock trên child table
Khi bạn chạy {{DELETE}} hoặc {{UPDATE khóa chính}} trên bảng parent ({{customers}}), PostgreSQL **phải đảm bảo tính toàn vẹn tham chiếu**: không được để child table ({{orders}}) chứa row trỏ đến parent row đã xoá/sửa. Việc kiểm tra này diễn ra **tự động thông qua trigger RI (Referential Integrity)** — trigger này được tạo ngầm khi bạn khai báo {{FOREIGN KEY}}.

**Quy tắc lock khi kiểm tra FK:**
- Child table **CÓ index** trên cột FK: planner dùng **Index Scan** (chỉ đọc các entry khớp), lock **chỉ các dòng liên quan** (tuple lock), thời gian cực ngắn → không chặn ghi khác.
- Child table **KHÔNG CÓ index** trên cột FK: planner dùng **Seq Scan toàn bảng**, phải đọc mọi dòng → giữ **RowExclusiveLock trên relation (toàn bảng)** suốt quá trình scan → **chặn mọi INSERT/UPDATE/DELETE** trên child table.

### Nguyên nhân gốc, từng bước
1. Admin chạy {{DELETE FROM customers WHERE id = 998877}}.
2. PostgreSQL kích hoạt trigger RI trên {{orders}} để kiểm tra FK {{customer_id}} = 998877.
3. Bảng {{orders}} **KHÔNG CÓ index** trên {{customer_id}} → planner chọn **Seq Scan**.
4. Seq Scan đọc 48.752.110 dòng, trong lúc đó giữ **ShareRowExclusiveLock trên bảng orders** (relation-level lock).
5. 1.200 INSERT/giây vào {{orders}} xin {{AccessShareLock}} (cho INSERT) và {{RowExclusiveLock}} → bị chờ vì xung đột với RowExclusiveLock của DELETE.
6. Mỗi INSERT chờ ~2 giây (thời gian Seq Scan), timeout Hikari 3 giây → 504, pool cạn.
7. CPU 92%: 1.200 thread cùng chạy Seq Scan + overhead context switch + lock contention.

### Dẫn chứng
- Artifact 1: {{DELETE}} chỉ 1 dòng trên {{customers}} (Index Scan customers_pkey) nhưng **Execution Time: 1843.401 ms** — thời gian chủ yếu do Seq Scan {{orders}} ẩn trong trigger RI. Chạy lại không traffic: 0,8 ms (không chờ lock).
- Artifact 2: {{pg_locks}}: DELETE (pid 41210) giữ {{ShareRowExclusiveLock granted = t}} trên {{orders}} (n = 1). 1.200 INSERT xin {{RowExclusiveLock granted = f}} trên {{orders}} (n = 1200). {{pg_blocking_pids}} của các INSERT đều trả về **{41210}**.
- Artifact 3: log ứng dụng INSERT orders chờ ~2 giây, timeout 3 giây → 504.

### Cách sửa
**Ngắn hạn (hôm nay):**
- Tạo index CONCURRENTLY trên cột FK (không chặn ghi):
~~~sql
CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders (customer_id);
~~~
- Sau khi index xong, planner dùng Index Scan cho kiểm tra FK: chỉ đọc ~1 dòng (customer 998877 có ~20 đơn), lock tuple-level, DELETE xong trong < 10 ms.

**Dài hạn:**
- Đảm bảo mọi FK đều có index trên cột child. Nếu gặp FK chưa có index, tạo index CONCURRENTLY trước.
- Nếu schema mới chưa có FK: thêm FK {{NOT VALID}} rồi {{VALIDATE CONSTRAINT}}:
~~~sql
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
  FOREIGN KEY (customer_id) REFERENCES customers(id) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT fk_orders_customer;
~~~
- {{NOT VALID}}: thêm ràng buộc cho INSERT/UPDATE mới, **không quét 48.7 triệu dòng cũ** (lock cực ngắn).
- {{VALIDATE CONSTRAINT}}: quét dữ liệu cũ để kiểm tra, nhưng chỉ cần **ShareUpdateExclusiveLock** — **không chặn INSERT/UPDATE/DELETE** trên {{orders}} (chỉ chặn DDL song song). Với index đã có, validate nhanh (Index Scan từng giá trị parent).

### So sánh: có index vs không index khi DELETE parent
| Tình huống | Planner | Lock trên child table | Thời gian DELETE parent | Ảnh hưởng ghi child |
|---|---|---|---|---|
| Không index FK | Seq Scan toàn bảng | RowExclusiveLock (relation) | Giây/phút (tỷ lệ với size child) | Chặn hoàn toàn INSERT/UPDATE/DELETE |
| Có index FK | Index Scan (chỉ dòng khớp) | Tuple lock (chỉ dòng liên quan) | < 10 ms | **Không chặn** (chỉ dòng bị khoá tạm) |

### Lỗi hay gặp
- Tạo index {{CREATE INDEX ... ON orders (customer_id)}} **không CONCURRENTLY** trong giờ cao điểm → {{AccessExclusiveLock}} chặn ghi 1.200 INSERT/giây, tương tự sự cố.
- Thêm FK **không NOT VALID** → {{ADD CONSTRAINT}} quét 48.7 triệu dòng, giữ {{ShareRowExclusiveLock}} (chặn ghi) trong nhiều phút.
- Quên {{VALIDATE CONSTRAINT}} sau NOT VALID → dữ liệu cũ có thể vi phạm FK mà không biết.
- Tạo index trên cột FK nhưng **không ANALYZE** → planner vẫn có thể chọn Seq Scan cho một số giá trị parent.

### Sơ đồ luồng
~~~seq
title: DELETE parent chặn INSERT child do thiếu index FK
actors: Admin | PostgreSQL | orders (child) | API tạo đơn
Admin -> PostgreSQL: DELETE FROM customers WHERE id = 998877
PostgreSQL -> PostgreSQL: trigger RI kiểm tra FK trên orders.customer_id
note PostgreSQL: KHÔNG CÓ index → Seq Scan 48.7M dòng, giữ ShareRowExclusiveLock trên orders
API tạo đơn -> PostgreSQL: INSERT INTO orders ... (cần RowExclusiveLock)
PostgreSQL --> API tạo đơn: CHỜ (bị RowExclusiveLock của DELETE chặn)
Admin -> PostgreSQL: DELETE xong (sau ~2 giây), nhả lock
API tạo đơn -> PostgreSQL: lock được cấp, INSERT chạy tiếp
~~~

### Trả lời mẫu khi phỏng vấn
"Admin DELETE 1 khách hàng, API tạo đơn hàng bị treo 2 giây rồi timeout. pg_locks thấy DELETE giữ ShareRowExclusiveLock trên bảng orders, 1.200 INSERT chờ lock. Nguyên nhân: orders có FK customer_id tham chiếu customers.id nhưng THIẾU INDEX. PostgreSQL kiểm tra FK khi DELETE parent: không index → Seq Scan toàn bảng 48.7 triệu dòng, giữ ShareRowExclusiveLock trên cả bảng orders → chặn mọi INSERT. Tôi tạo index CONCURRENTLY trên orders.customer_id → planner dùng Index Scan, chỉ khóa vài dòng liên quan, DELETE xong < 10 ms, INSERT không bị chặn."

> Senior tip: **Mọi cột khóa ngoại (FK) ở bảng con BẮT BUỘC có index**. Đây là quy tắc số 1 khi thiết kế schema quan hệ. Không index = Seq Scan khi parent DELETE/UPDATE = chặn toàn bộ ghi trên bảng con = sự cố production. Index CONCURRENTLY tạo không chặn ghi, chi phí nhỏ, hiệu quả to. Và khi thêm FK trên bảng lớn: LUÔN dùng NOT VALID + VALIDATE CONSTRAINT riêng — nó tách "thêm quy tắc cho dữ liệu mới" (nhanh, lock nhẹ) và "kiểm tra dữ liệu cũ" (chậm, lock ShareUpdateExclusiveLock, không chặn ghi).`,
  rubric: [
    'Chỉ đúng nguyên nhân: DELETE parent buộc kiểm tra child table, thiếu index trên cột FK → Seq Scan toàn bảng 48.7M dòng → giữ ShareRowExclusiveLock relation-level → chặn 1.200 INSERT/giây',
    'Dẫn chứng đúng: pg_locks ShareRowExclusiveLock granted=t trên orders (DELETE), RowExclusiveLock granted=f n=1200 (INSERT), pg_blocking_pids trỏ về pid DELETE, Execution Time 1843 ms',
    'Giải thích đúng cơ chế: có index → Index Scan + tuple lock (không chặn ghi); không index → Seq Scan + relation lock (chặn ghi)',
    'Đề xuất sửa đúng: CREATE INDEX CONCURRENTLY trên child FK (FK đã có sẵn), hoặc ADD CONSTRAINT NOT VALID + VALIDATE CONSTRAINT nếu chưa có FK',
    'Nêu lỗi hay gặp: tạo index không CONCURRENTLY, FK không NOT VALID, quên VALIDATE, quên ANALYZE',
  ],
  tags: ['postgresql', 'foreign-key', 'index', 'lock', 'delete', 'concurrently', 'not-valid', 'validate-constraint'],
},
{
  id: 'lab-sql-032',
  category: 'sql',
  title: 'Deadlock giữa 2 đơn hàng cập nhật tồn kho theo thứ tự ngược qua FK product',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử ShopFast chạy service {{order-inventory}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 16.2 trên RDS, 8 vCPU / 64 GB RAM, HikariCP 30 connection). Bảng {{inventory}} lưu tồn kho theo SKU (primary key {{sku_id}}), bảng {{order_item}} lưu chi tiết đơn hàng với FK {{product_id}} tham chiếu {{product.id}}. Khi xác nhận đơn, service trừ tồn kho bằng cách: đọc {{order_item}} để lấy danh sách {{product_id}}, sau đó UPDATE {{inventory}} cho từng SKU trong một transaction duy nhất.

**Triệu chứng (20/03/2026, 14:22).** Khoảng 0,4% đơn hàng bị lỗi {{CannotAcquireLockException: ERROR: deadlock detected}} (HTTP 500), tập trung vào hai đơn hàng {{ORD-20260320-88421}} và {{ORD-20260320-88422}} được xác nhận gần như cùng lúc (cách nhau 12 ms). **Cả hai đơn cùng chứa 2 SKU: 101 và 102** (thứ tự trong order_item khác nhau do logic sort theo category_name). PostgreSQL log ghi deadlock detected, HikariCP pool không cạn, CPU 15%.

**Việc bạn có.** Ba artifact dưới đây lấy từ production lúc 14:22. Hãy tìm nguyên nhân gốc, chứng minh bằng pid/xid/timestamp, rồi đề xuất cách sửa ngắn hạn và phòng ngừa.`,
  artifacts: [
    {
      name: 'postgresql-deadlock.log',
      lang: 'text',
      content: `2026-03-20 14:22:15.841 UTC [18421] ERROR:  deadlock detected
2026-03-20 14:22:15.841 UTC [18421] DETAIL:  Process 18421 waits for ShareLock on transaction 987654; blocked by process 18422.
        Process 18422 waits for ShareLock on transaction 987653; blocked by process 18421.
2026-03-20 14:22:15.841 UTC [18421] HINT:  See server log for query details.
2026-03-20 14:22:15.841 UTC [18421] CONTEXT:  while locking tuple (0,14) in relation "inventory"
2026-03-20 14:22:15.841 UTC [18421] STATEMENT:  UPDATE inventory SET available = available - 1 WHERE sku_id = 101
2026-03-20 14:22:15.842 UTC [18422] ERROR:  deadlock detected
2026-03-20 14:22:15.842 UTC [18422] DETAIL:  Process 18422 waits for ShareLock on transaction 987653; blocked by process 18421.
        Process 18421 waits for ShareLock on transaction 987654; blocked by process 18422.
2026-03-20 14:22:15.842 UTC [18422] CONTEXT:  while locking tuple (0,15) in relation "inventory"
2026-03-20 14:22:15.842 UTC [18422] STATEMENT:  UPDATE inventory SET available = available - 1 WHERE sku_id = 102`,
    },
    {
      name: 'pg_stat_activity.txt',
      lang: 'text',
      content: ` pid  | usename | state  |         query_start         | wait_event_type | wait_event | xact_start
-------+---------+--------+----------------------------+-----------------+------------+----------------------------
 18421 | shopapp | active | 2026-03-20 14:22:15.801+00 | Lock            | transactionid | 2026-03-20 14:22:15.785+00
 18422 | shopapp | active | 2026-03-20 14:22:15.803+00 | Lock            | transactionid | 2026-03-20 14:22:15.787+00
-- xid: 18421 = 987653, 18422 = 987654
-- order_item của đơn 88421: SKU 101 (product 101, category Electronics) rồi SKU 102 (product 102, category Fashion) — order by product_id ASC
-- order_item của đơn 88422: SKU 102 (product 102, category Fashion) rồi SKU 101 (product 101, category Electronics) — order by category_name DESC (nhánh code promotion)
-- TX1 (đơn 88421) UPDATE sku=101 trước, rồi chờ sku=102; TX2 (đơn 88422) UPDATE sku=102 trước, rồi chờ sku=101 → deadlock.`,
    },
    {
      name: 'app-deadlock.log',
      lang: 'text',
      content: `2026-03-20T14:22:15.843Z ERROR [http-nio-8080-exec-14] o.h.engine.jdbc.spi.SqlExceptionHelper - SQL Error: 0, SQLState: 40P01
2026-03-20T14:22:15.843Z ERROR [http-nio-8080-exec-14] o.s.orm.jpa.JpaSystemException - could not execute statement
2026-03-20T14:22:15.843Z WARN  [http-nio-8080-exec-14] org.springframework.dao.CannotAcquireLockException - deadlock detected
2026-03-20T14:22:15.843Z INFO  [http-nio-8080-exec-14] com.shopfast.inventory.InventoryService - confirmOrder(orderId=ORD-20260320-88421) FAILED after 56ms
2026-03-20T14:22:15.844Z INFO  [http-nio-8080-exec-22] com.shopfast.inventory.InventoryService - confirmOrder(orderId=ORD-20260320-88422) OK after 58ms`,
    },
  ],
  questions: [
    'Nguyên nhân gốc deadlock là gì? Dẫn chứng từ artifact pid/xid/timestamp và câu UPDATE nào đang chạy khi deadlock.',
    'Vì sao thứ tự UPDATE lại ngược nhau giữa hai đơn? Hãy giải thích dựa trên cách code Java sắp xếp order_item.',
    'Bạn sẽ sửa thế nào (ngắn hạn và dài hạn) để loại bỏ deadlock?',
  ],
  hints: [
    'Hai transaction cùng cập nhật 2 SKU chung (101 và 102) nhưng theo thứ tự ngược nhau do sort category_name khác nhau ở hai nhánh code.',
    'Deadlock detector PostgreSQL phát hiện chu trình chờ: TX1 giữ lock SKU 102 chờ SKU 101, TX2 giữ lock SKU 101 chờ SKU 102.',
  ],
  answer: `**Tóm tắt:** Hai transaction xác nhận đơn hàng cùng cập nhật tồn kho của **hai SKU chung (101 và 102)** nhưng theo **thứ tự ngược nhau** do code Java sắp xếp {{order_item}} theo {{category_name}} và logic sắp xếp không nhất quán giữa các nhánh. TX1 (đơn 88421) cập nhật SKU 102 trước rồi SKU 101; TX2 (đơn 88422) cập nhật SKU 101 trước rồi SKU 102. PostgreSQL phát hiện chu trình chờ (wait-for cycle) sau {{deadlock_timeout}} (1 giây) và huỷ TX1 (pid 18421) với lỗi {{SQLState 40P01}}. Sửa: thống nhất thứ tự khóa theo {{sku_id}} tăng dần trong transaction, rút ngắn transaction, thêm retry có backoff.

### Kiến thức nền: deadlock và wait-for graph
**Deadlock** (khối chờ chết) xảy ra khi hai hoặc nhiều transaction mỗi bên giữ một tài nguyên (lock) và chờ tài nguyên mà bên kia đang giữ — tạo thành một **chu trình (cycle)** trong wait-for graph. PostgreSQL chạy deadlock detector mỗi {{deadlock_timeout}} (mặc định 1 giây); khi phát hiện cycle, nó chọn một transaction làm **victim** (nạn nhân), rollback transaction đó và trả lỗi {{SQLSTATE 40P01}} ({{deadlock_detected}}), transaction kia tiếp tục chạy.

Row-level lock trong PostgreSQL: câu {{UPDATE ... WHERE sku_id = X}} lấy **exclusive lock** trên dòng (tuple) có {{sku_id = X}}. Lock này được lưu trong header của tuple ({{xmax}} = transaction id), không hiện trong {{pg_locks}}. Khi transaction khác muốn UPDATE cùng dòng, nó phải chờ **ShareLock** trên transaction id của transaction đang giữ lock — điều này **hiện** trong {{pg_locks}} với {{mode = ShareLock, granted = f}}.

### Nguyên nhân gốc, từng bước
1. **Cấu trúc đơn hàng**: Đơn 88421 chứa 2 sản phẩm: SKU 101 (product 101, category Electronics) và SKU 102 (product 102, category Fashion). Đơn 88422 cũng chứa 2 sản phẩm: SKU 101 và SKU 102 (cùng 2 SKU!).
2. **Code Java lấy order_item**:
   ~~~java
   List<OrderItem> items = orderItemRepo.findByOrderId(orderId);
   // Sắp xếp theo category_name để ưu tiên xử lý category nào trước
   items.sort(Comparator.comparing(item -> item.getProduct().getCategory().getName()));
   ~~~
3. **Bug sắp xếp không nhất quán**: Trong nhánh xử lý đơn 88421, code sort {{DESC}} (Z-A) → category **Fashion** (F) đứng trước **Electronics** (E) → xử lý SKU 102 trước, SKU 101 sau. Nhưng trong nhánh xử lý đơn 88422 (code path khác, ví dụ do promotion áp dụng), sort {{ASC}} (A-Z) → **Electronics** đứng trước **Fashion** → xử lý SKU 101 trước, SKU 102 sau. (Hoặc do dữ liệu category_name có khoảng trắng/viết hoa khác nhau dẫn so sánh khác).
4. **Thứ tự UPDATE trong transaction**:
   - TX1 (pid 18421, xid 987653, đơn 88421): {{UPDATE inventory SET available = available - 1 WHERE sku_id = 102}} (chạy 14:22:15.801) → giữ lock SKU 102. Sau đó {{UPDATE ... WHERE sku_id = 101}} → **chờ lock SKU 101**.
   - TX2 (pid 18422, xid 987654, đơn 88422): {{UPDATE inventory SET available = available - 1 WHERE sku_id = 101}} (chạy 14:22:15.803) → giữ lock SKU 101. Sau đó {{UPDATE ... WHERE sku_id = 102}} → **chờ lock SKU 102**.
5. **Chu trình chờ**: TX1 giữ SKU 102 chờ SKU 101; TX2 giữ SKU 101 chờ SKU 102. Không bên nào nhả lock → deadlock detector chạy lúc 14:22:15.841 (sau ~1 giây chờ), chọn TX1 làm victim (vì TX1 bắt đầu chờ trước), rollback TX1.

### Dẫn chứng
- Artifact 1 (log server): **"ERROR: deadlock detected"** tại PID 18421, kèm DETAIL: **"Process 18421 waits for ShareLock on transaction 987654; blocked by process 18422."** và **"Process 18422 waits for ShareLock on transaction 987653; blocked by process 18421."** — hai cạnh của vòng chờ. Dòng **"CONTEXT: while locking tuple (0,14) in relation inventory"** và **"STATEMENT: UPDATE inventory SET available = available - 1 WHERE sku_id = 101"** chỉ ra TX1 đang chờ lock trên SKU 101 khi đã giữ SKU 102. TX2 log tương tự cho SKU 102 (đang chờ SKU 102 khi đã giữ SKU 101).
- Artifact 2 (pg_stat_activity): PID 18421 (xid 987653) và 18422 (xid 987654) đều {{wait_event_type = Lock}}, {{wait_event = transactionid}} — đang chờ ShareLock trên transaction của bên kia. xact_start: TX1 14:22:15.785, TX2 14:22:15.787 (TX2 bắt đầu sớm hơn 98 ms).
- Artifact 3 (log ứng dụng): {{CannotAcquireLockException}}, SQLState 40P01, đơn 88421 FAILED sau 56 ms, đơn 88422 OK sau 58 ms (TX2 thắng vì không bị chọn làm victim).

### Cách sửa ngắn hạn (hôm nay)
- **Thống nhất thứ tự khóa**: trong transaction xác nhận đơn, **luôn sort {{order_item}} theo {{sku_id}} tăng dần** trước khi UPDATE. Đơn giản, an toàn, không phụ thuộc category hay promotion path.
  ~~~java
  items.sort(Comparator.comparingLong(OrderItem::getSkuId)); // LUÔN theo sku_id tăng dần
  for (OrderItem item : items) {
      inventoryRepo.decreaseAvailable(item.getSkuId(), item.getQuantity());
  }
  ~~~
- **Thêm retry cho deadlock**: bắt lỗi {{CannotAcquireLockException}} (Spring map từ SQLState 40P01) và retry toàn bộ transaction **3 lần** với exponential backoff + jitter (50 ms, 100 ms, 200 ms). Dùng {{@Retryable}} của Spring Retry trên method confirmOrder.
- **Rút ngắn transaction**: chỉ giữ UPDATE inventory trong transaction; đọc order_item, tính toán promotion, validate **ngoài transaction**. Transaction chỉ bao quanh: khoá dòng inventory (SELECT ... FOR UPDATE theo sku_id ASC) → UPDATE available.

### Cách sửa dài hạn
- **Khoá theo thứ tự cố định tại mức DB**: dùng {{SELECT ... FOR UPDATE}} với {{ORDER BY sku_id}} ngay trong câu query để DB đảm bảo thứ tự, không phụ thuộc code Java:
  ~~~sql
  SELECT sku_id, available FROM inventory
  WHERE sku_id IN (?, ?, ...)
  ORDER BY sku_id
  FOR UPDATE;
  ~~~
  Sau đó UPDATE theo cùng thứ tự. Vì LockRows nằm sau Sort trong plan, các dòng bị khóa theo thứ tự đã sắp.
- **Advisory lock cấp ứng dụng**: nếu không thể sắp lại thứ tự UPDATE (logic phức tạp), dùng {{pg_advisory_xact_lock(hashtext(sku_id))}} cho từng SKU theo thứ tự sku_id tăng dần ở đầu transaction.
- **Idempotency key**: mọi API xác nhận đơn phải có {{idempotency_key = orderId}} để retry an toàn, không tạo đơn kép.
- **Phân tách tồn kho theo category**: nếu conflict deadlock quá nhiều, cân nhắc sharding bảng inventory theo category hoặc dùng Redis queue serial hóa các lệnh trừ tồn kho cùng SKU.

### Phòng ngừa và monitoring
- Bật {{log_lock_waits = on}}, {{deadlock_timeout = 1s}} (mặc định); cảnh báo khi {{pg_stat_database.deadlocks}} tăng theo giờ.
- Theo dõi {{pg_stat_activity}} có {{wait_event_type = 'Lock'}} và {{wait_event = 'transactionid'}}; alert khi có phiên chờ lock > 500 ms.
- Unit test concurrency: mô phỏng 2 thread xác nhận đơn có SKU chung, assert không deadlock sau khi áp dụng fix.
- Dashboard: số deadlock/giờ, p99 confirmOrder, tỷ lệ retry.

### Sơ đồ luồng
~~~seq
title: Deadlock hai đơn cập nhật SKU 101 & 102 theo thứ tự ngược
actors: TX1 (ORD-88421) | TX2 (ORD-88422) | PostgreSQL | Inventory table
TX1 -> Inventory table: UPDATE sku=102 (giảm 1) -> lock row 102
TX2 -> Inventory table: UPDATE sku=101 (giảm 1) -> lock row 101
TX1 -> Inventory table: UPDATE sku=101 -> CHỜ (row 101 bị TX2 giữ)
TX2 -> Inventory table: UPDATE sku=102 -> CHỜ (row 102 bị TX1 giữ)
note PostgreSQL: deadlock_timeout = 1s
PostgreSQL -> TX1: ROLLBACK (victim, SQLState 40P01)
PostgreSQL -> TX2: lock 102 được cấp, UPDATE xong, COMMIT
~~~

### Trả lời mẫu khi phỏng vấn
"Hai đơn hàng cùng cập nhật SKU 101 và 102 nhưng thứ tự UPDATE ngược nhau do code sort order_item theo category_name không nhất quán giữa các nhánh. TX1 giữ lock SKU 102 chờ 101, TX2 giữ 101 chờ 102 → deadlock. PostgreSQL detector chạy sau 1s, chọn TX1 làm victim (40P01). Tôi sửa bằng: (1) sort order_item theo sku_id tăng dần **luôn luôn** trước khi UPDATE, (2) thêm retry 3 lần với backoff cho deadlock, (3) rút ngắn transaction chỉ bao quanh khoá+UPDATE. Dài hạn: SELECT FOR UPDATE ORDER BY sku_id ở DB level, advisory lock, idempotency key."

> Senior tip: **Thứ tự khóa nhất quán là hợp đồng của cả hệ thống**. Một code path sắp xếp khác (category_name, promotion, sort ASC/DESC) đủ tạo deadlock hiếm gặp, khó tái hiện. Quy tắc của tôi: **mọi transaction cập nhật nhiều dòng phải khóa theo thứ tự PK tăng dần** — viết helper {{LockHelper.lockInOrder(skuIds)}} tập trung, cấm dev tự sort. Và nhớ: deadlock không phải bug của PostgreSQL, nó là cơ chế bảo vệ dữ liệu; mục tiêu là làm cho nó **rẻ và tự hồi phục** (thứ tự khóa cố định + retry + idempotency).`,
  rubric: [
    'Chỉ đúng nguyên nhân: 2 transaction cập nhật 2 SKU chung (101, 102) theo thứ tự ngược do sort category_name không nhất quán, tạo wait-for cycle',
    'Dẫn chứng đúng: deadlock log Detail hai cạnh chu trình (xid 987653/987654), pg_stat_activity wait_event=transactionid, app log 40P01, TX1 victim',
    'Giải thích đúng tại sao thứ tự ngược: sort category_name ASC vs DESC (hoặc dữ liệu category khác) ở hai nhánh code',
    'Đề xuất sửa đúng: sort theo sku_id ASC trong transaction, retry 3 lần backoff+jitter, rút ngắn transaction, SELECT FOR UPDATE ORDER BY sku_id',
    'Có phòng ngừa: log_lock_waits, alert deadlocks, unit test concurrency, idempotency key',
  ],
  tags: ['postgresql', 'deadlock', 'lock', 'inventory', 'order', 'for-update', 'retry'],
},
{
  id: 'lab-sql-033',
  category: 'sql',
  title: 'Thêm index nhưng vẫn Seq Scan: WHERE lower(name) và so sánh varchar vs numeric',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử ShopEase chạy service {{product-search}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 16.2 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{product}} lưu **12.418.550 dòng** (~5,2 GB heap + 2,8 GB index). Mỗi phút khoảng 8.000 lần tìm kiếm qua endpoint {{GET /api/v1/products/search?q=iphone&category_id=10}}. Cột {{name}} kiểu {{varchar(256)}}, cột {{category_id}} kiểu {{bigint}}, cột {{price}} kiểu {{numeric(12,2)}}. Index hiện có: {{idx_product_name}} btree trên {{name}}, {{idx_product_category}} btree trên {{category_id}}, {{idx_product_price}} btree trên {{price}}.

**Triệu chứng (21/03/2026, 09:15).** p95 endpoint search nhảy từ 340 ms lên **8,2 giây**, CPU RDS từ 20% lên 91%. DBA chạy EXPLAIN ANALYZE trên production và thấy **Seq Scan toàn bảng 12,4 triệu dòng** dù đã tạo index {{idx_product_name_lower}} (expression index {{CREATE INDEX ON product (lower(name))}}) và index {{idx_product_category_id}}. Dev trước đó đã "vá" lỗi "operator does not exist: character varying = bigint" trên cột {{supplier_code}} (varchar chứa số) bằng cách ép kiểu cột: {{WHERE supplier_code::bigint = ?}}.

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE trước/sau khi tạo index, schema + danh sách index, và log ứng dụng. Hãy chỉ ra vì sao index không được dùng, và cách sửa đúng.`,
  artifacts: [
    {
      name: 'explain-search.txt',
      lang: 'text',
      content: `-- 2026-03-21 09:16:02 +07, psql trên RDS shopease-primary (PostgreSQL 16.2)
-- (1) Câu search: tìm theo tên (không phân biệt hoa thường) + category
shopease=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, price, category_id
FROM product
WHERE lower(name) = lower('iPhone 15 Pro')
  AND category_id = 10;
                                                          QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------------------------
 Seq Scan on product  (cost=0.00..3841521.44 rows=1 width=64) (actual time=0.021..8231.444 rows=1 loops=1)
   Filter: ((lower(name) = lower('iPhone 15 Pro'::text)) AND (category_id = 10))
   Rows Removed by Filter: 12418549
   Buffers: shared hit=1582040 read=120440
 Planning Time: 0.312 ms
 Execution Time: 8232.104 ms
(6 rows)

Time: 8232.520 ms

-- (2) Dev đã tạo expression index lower(name) nhưng planner KHÔNG dùng
shopease=# \d product
Indexes:
    "idx_product_name" btree (name)
    "idx_product_name_lower" btree (lower(name))
    "idx_product_category" btree (category_id)
    "idx_product_price" btree (price)
    "product_pkey" PRIMARY KEY, btree (id)

-- (3) So sánh: cùng câu, bỏ lower() trên cột, bind tham số đã lower ở ứng dụng
shopease=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, price, category_id
FROM product
WHERE name = 'iPhone 15 Pro'
  AND category_id = 10;
                                                          QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------------------------
 Index Scan using idx_product_name on product  (cost=0.56..8.58 rows=1 width=64) (actual time=0.041..0.312 rows=1 loops=1)
   Index Cond: ((name = 'iPhone 15 Pro'::character varying) AND (category_id = 10))
   Buffers: shared hit=12 read=2
 Planning Time: 0.284 ms
 Execution Time: 0.401 ms
(5 rows)

Time: 0.871 ms

-- (4) Câu tra cứu supplier_code: varchar chứa số, Java truyền Long, dev "vá" bằng cast cột
shopease=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, supplier_code
FROM product
WHERE supplier_code::bigint = 20260314000142;
                                                          QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------------------------
 Seq Scan on product  (cost=0.00..3839895.61 rows=1 width=48) (actual time=0.023..4188.712 rows=1 loops=1)
   Filter: ((supplier_code)::bigint = 20260314000142::bigint)
   Rows Removed by Filter: 12418549
   Buffers: shared hit=171000 read=140000
 Planning Time: 0.298 ms
 Execution Time: 4189.401 ms
(6 rows)

Time: 4189.720 ms

-- (5) So sánh: truyền tham số dạng varchar (không cast cột)
shopease=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, supplier_code
FROM product
WHERE supplier_code = '20260314000142';
                                                          QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------------------------
 Index Scan using idx_product_supplier_code on product  (cost=0.43..8.45 rows=1 width=48) (actual time=0.048..0.512 rows=1 loops=1)
   Index Cond: (supplier_code = '20260314000142'::character varying)
   Buffers: shared hit=4 read=1
 Planning Time: 0.284 ms
 Execution Time: 0.704 ms
(5 rows)

Time: 0.871 ms`,
    },
    {
      name: 'schema-and-index.txt',
      lang: 'text',
      content: `-- 2026-03-21 09:17:05 +07
shopease=# \d product
                                        Table "public.product"
   Column        |           Type           | Collation | Nullable |      Default
-----------------+--------------------------+-----------+----------+-------------------
 id              | bigint                   |           | not null |
 name            | character varying(256)   |           | not null |
 category_id     | bigint                   |           | not null |
 price           | numeric(12,2)            |           | not null |
 supplier_code   | character varying(32)    |           | not null | -- mã NCC chỉ gồm chữ số
 description     | text                     |           |          |
 created_at      | timestamp with time zone |           | not null | now()
Indexes:
    "idx_product_name" btree (name)
    "idx_product_name_lower" btree (lower(name))
    "idx_product_category" btree (category_id)
    "idx_product_price" btree (price)
    "idx_product_supplier_code" btree (supplier_code)
    "product_pkey" PRIMARY KEY, btree (id)

-- Kích thước bảng:
shopease=# SELECT reltuples::bigint AS est_rows,
                 pg_size_pretty(pg_relation_size('product')) AS heap,
                 pg_size_pretty(pg_total_index_size('product')) AS idx
FROM pg_class WHERE relname = 'product';
  est_rows | heap    | idx
-----------+---------+--------
 12418550  | 5182 MB | 2784 MB

-- Thống kê câu query 5 phút quanh sự cố (pg_stat_statements):
shopease=# SELECT calls, round(total_exec_time::numeric, 1) AS total_ms,
               round(mean_exec_time::numeric, 1) AS mean_ms, rows
FROM pg_stat_statements
WHERE query LIKE '%lower(name)%' OR query LIKE '%supplier_code%'
ORDER BY total_exec_time DESC LIMIT 3;
  calls |  total_ms  | mean_ms | rows
-------+------------+---------+------
   452 | 3721516.0  |  8233.0 |   452
   118 |  491822.0  |  4168.0 |   118
    56 |  21200.0   |   378.5 |    56`,
    },
    {
      name: 'app-search-slow.log',
      lang: 'text',
      content: `2026-03-21 09:16:10.101 DEBUG [http-nio-8080-exec-22] o.h.SQL :
    select p1_0.id,p1_0.name,p1_0.price,p1_0.category_id
    from product p1_0
    where lower(p1_0.name) = lower(?) and p1_0.category_id = ?
2026-03-21 09:16:18.333 INFO  [http-nio-8080-exec-22] c.s.p.ProductController :
    GET /api/v1/products/search?q=iphone 15 pro&category_id=10 -> 200 in 8234 ms
2026-03-21 09:16:19.440 DEBUG [http-nio-8080-exec-5] o.h.SQL :
    select p1_0.id,p1_0.name,p1_0.price,p1_0.category_id
    from product p1_0
    where lower(p1_0.name) = lower(?) and p1_0.category_id = ?
2026-03-21 09:16:27.681 INFO  [http-nio-8080-exec-5] c.s.p.ProductController :
    GET /api/v1/products/search?q=iphone 15 pro&category_id=10 -> 200 in 8241 ms
-- pattern: mỗi request search mất ~8,2 giây, không có request nào dưới 1 giây

2026-03-21 09:15:42.118 DEBUG [http-nio-8080-exec-14] o.h.SQL :
    select p1_0.id,p1_0.name,p1_0.supplier_code
    from product p1_0
    where p1_0.supplier_code::bigint = ?
2026-03-21 09:15:46.301 INFO  [http-nio-8080-exec-14] c.s.p.ProductController :
    GET /api/v1/products/by-supplier/20260314000142 -> 200 in 4191 ms
-- Lỗi trước khi "vá" (taken from app.log 20/03, 07:14:08):
-- ERROR:  operator does not exist: character varying = bigint
-- LINE 1: where supplier_code = ?
--                      ^
-- HINT:  No operator matches the given name and argument types. You might need to add explicit type casts.`,
    },
  ],
  questions: [
    'Vì sao expression index idx_product_name_lower (lower(name)) đã tạo nhưng planner KHÔNG dùng? Chỉ ra bằng dòng nào trong EXPLAIN.',
    'Câu tra cứu supplier_code gặp lỗi gì trước đây và vì sao cách "vá" bằng cast cột (supplier_code::bigint) lại khiến Seq Scan? So sánh với câu WHERE supplier_code = \'...\'.',
    'Bạn sửa query và index thế nào để search về dưới 100 ms? Khi nào nên dùng expression index, khi nào dùng partial index, và lưu ý gì về IMMUTABLE + ANALYZE?',
  ],
  hints: [
    'Đọc dòng "Filter: ((lower(name) = lower(...)) AND (category_id = 10))": vế trái lower(name) khớp với index expression, nhưng index đơn lẻ không bao phủ category_id và thiếu ANALYZE sau khi tạo index. Có ANALYZE sau khi tạo index không?',
    'Index chỉ được dùng khi vế trái là cột thuần, vế phải là hằng số/tham số. Ép kiểu cột (supplier_code::bigint) biến điều kiện thành biểu thức → planner không dùng index btree trên supplier_code (lưu varchar thô).',
    'Sửa search: chuẩn hóa tham số ở ứng dụng (lower(q)) rồi WHERE name = :qLower AND category_id = :catId — dùng index (name, category_id). Hoặc composite expression index ((lower(name), category_id)). Sửa supplier_code: truyền String, hoặc cast vế tham số. Expression index cần IMMUTABLE (lower() OK) và ANALYZE.',
  ],
  answer: `**Tóm tắt:** Câu search viết {{WHERE lower(name) = lower(?) AND category_id = 10}} — **bọc hàm lower() quanh cột name** — làm planner chọn **Seq Scan 12,4 triệu dòng** (8,2 giây) dù đã tạo expression index {{idx_product_name_lower}} trên {{lower(name)}}. Nguyên nhân: (1) index expression {{lower(name)}} khớp với vế trái, nhưng index đơn lẻ không bao phủ {{category_id = 10}} và thiếu **ANALYZE** sau khi tạo index nên planner không có statistics cho biểu thức; (2) câu supplier_code dev vá bằng cast ở vế cột, phá index. Câu tra cứu {{supplier_code}} dev "vá" lỗi "operator does not exist: character varying = bigint" bằng {{supplier_code::bigint = ?}} — **ép kiểu ở vế cột** — phá index, Seq Scan 4,2 giây. Sửa: search dùng {{WHERE name = :qLower AND category_id = ?}} với tham số đã lower ở app (composite index {{(name, category_id)}}), hoặc expression index {{(lower(name), category_id)}} + ANALYZE; supplier_code truyền String hoặc cast vế tham số.

### Kiến thức nền: sargable, expression index, và implicit cast
**Sargable** (Search ARGument Able): index chỉ dùng được khi điều kiện WHERE có dạng **cột_so_sánh_toán_tử_hằng_số** — vế trái là cột thuần, vế phải là hằng số/tham số. Bọc hàm ({{lower()}}, {{date_trunc()}}) hay ép kiểu ({{::bigint}}) quanh cột biến điều kiện thành **biểu thức**, planner không thể dùng index btree trên cột thô.

**Expression index**: {{CREATE INDEX ... ON table (expression)}}. Index lưu giá trị của **biểu thức** (ví dụ {{lower(name)}}), không phải cột thô. Khi đó planner có thể dùng index cho câu {{WHERE lower(name) = ?}} vì biểu thức trong query **trùng khớp** với biểu thức trong index. **Điều kiện bắt buộc**: biểu thức trong index phải dùng hàm **IMMUTABLE** (kết quả chỉ phụ thuộc tham số, không phụ thuộc locale, timezone, session). {{lower()}} là IMMUTABLE với collation C (default PostgreSQL).

**Implicit cast**: PostgreSQL không tự cast varchar ↔ bigint. Câu {{WHERE varchar_col = 123}} báo lỗi "operator does not exist". Dev thường "vá" bằng {{varchar_col::bigint = 123}} — **ép kiểu ở vế cột** — làm mất index. Sửa đúng: {{WHERE varchar_col = '123'}} (tham số String) hoặc {{WHERE varchar_col = CAST(123 AS varchar)}} (**ép kiểu ở vế tham số**).

### Nguyên nhân gốc, từng bước

**1. Câu search product (lower(name) + category_id):**
- Query: {{WHERE lower(name) = lower(?) AND category_id = 10}}. Vế trái {{lower(name)}} khớp với index expression {{lower(name)}}, nhưng index đơn lẻ không bao phủ {{category_id}} và thiếu {{ANALYZE product}} sau khi tạo index → planner không có {{pg_statistic}} cho biểu thức {{lower(name)}}, ước lượng selectivity mặc định 0,5% → chọn Seq Scan.
- Artifact 1: {{Seq Scan ... Filter: ((lower(name) = lower('iPhone 15 Pro'::text)) AND (category_id = 10))}}, {{Rows Removed by Filter: 12418549}}, {{Buffers: shared hit=1582040 read=120440}} (~1,7 GB page), {{Execution Time: 8232.104 ms}}.
- Câu so sánh {{WHERE name = 'iPhone 15 Pro' AND category_id = 10}}: {{Index Scan using idx_product_name}}, {{Buffers: shared hit=12 read=2}}, {{Execution Time: 0.401 ms}} — nhanh **20.500 lần**.

**2. Câu tra cứu supplier_code (varchar vs bigint):**
- Cột {{supplier_code}} {{varchar(32)}} chứa mã NCC chỉ gồm số. Java nhận path variable {{Long}}, Hibernate bind {{bigint}}.
- Lần đầu chạy: lỗi "operator does not exist: character varying = bigint".
- Dev "vá": {{WHERE supplier_code::bigint = ?}} — **cast ở vế cột**. Index {{idx_product_supplier_code}} lưu giá trị varchar thô ("20260314000142"), không khớp biểu thức {{supplier_code::bigint}} → planner Seq Scan.
- Artifact 1 câu (4): {{Seq Scan ... Filter: ((supplier_code)::bigint = ...)}}, {{Rows Removed by Filter: 12418549}}, {{Execution Time: 4189.401 ms}}.
- Câu sửa {{WHERE supplier_code = '20260314000142'}}: {{Index Scan using idx_product_supplier_code}}, {{Execution Time: 0.704 ms}} — nhanh **5.950 lần**.

### Dẫn chứng
- Artifact 1: Seq Scan + Filter {{lower(name) = lower(...)}} + Rows Removed 12.4M + 8232 ms; Index Scan 0.4 ms khi bỏ lower(). Expression index {{idx_product_name_lower}} tồn tại (\\d product) nhưng không được dùng. Câu supplier_code: Seq Scan + Filter {{(supplier_code)::bigint}} + 4189 ms vs Index Scan 0.7 ms.
- Artifact 2: Index {{idx_product_name_lower}} btree trên {{lower(name)}}; {{idx_product_supplier_code}} btree trên {{supplier_code}} (varchar). pg_stat_statements: 452 calls × 8233 ms = 3.721s CPU/5min cho search; 118 calls × 4168 ms = 491s CPU cho supplier_code.
- Artifact 3: log ứng dụng search ~8,2s; supplier_code lỗi operator does not exist trước khi vá, sau vá ~4,2s.

### Cách sửa

**Ngắn hạn (hôm nay):**

1. **Sửa câu search — cách 1 (khuyên dùng, không cần expression index):** Chuẩn hóa tham số ở ứng dụng, so sánh cột thô với tham số đã lower, dùng composite index:
   ~~~java
   // Java: String qLower = query.toLowerCase(Locale.ROOT);
   // Repository:
   @Query("SELECT p FROM Product p WHERE p.name = :qLower AND p.categoryId = :catId")
   List<Product> searchByNameAndCategory(String qLower, Long catId);
   ~~~
   ~~~sql
   CREATE INDEX CONCURRENTLY idx_product_name_category ON product (name, category_id);
   ANALYZE product;
   ~~~
   → Index Scan trên {{(name, category_id)}}, đọc ~1 dòng, < 1 ms. Cách này an toàn nhất, không phụ thuộc expression index, hoạt động với mọi collation.

2. **Sửa câu search — cách 2 (nếu bắt buộc giữ lower() trong query):** Tạo **composite expression index** khớp đúng biểu thức WHERE:
   ~~~sql
   CREATE INDEX CONCURRENTLY idx_product_lower_name_category
     ON product (lower(name), category_id);
   ANALYZE product;  -- BẮT BUỘC
   ~~~
   Query phải viết **trùng khớp**: {{WHERE lower(name) = :qLower AND category_id = 10}} (tham số đã lower, không lower(?) nữa). Planner dùng index, < 1 ms.

3. **Sửa câu supplier_code:** Truyền tham số dạng String ({{String.valueOf(supplierCode)}}), viết {{WHERE supplier_code = :code}}. Hoặc nếu giữ Long: {{WHERE supplier_code = CAST(:code AS varchar)}} (cast ở **vế tham số**). Index {{idx_product_supplier_code}} dùng lại ngay.

**Dài hạn:**
- **Chuẩn hóa dữ liệu:** Thêm cột {{name_lower text GENERATED ALWAYS AS (lower(name)) STORED}} và index {{(name_lower, category_id)}} — query viết {{WHERE name_lower = :qLower AND category_id = ?}}, hoàn toàn sargable, không cần expression index.
- **Đổi supplier_code sang bigint** qua mô hình expand/contract: thêm cột mới {{supplier_code_num bigint}}, backfill theo lô, dual-write, đổi index, drop cột cũ — tuyệt đối không {{ALTER TABLE ... TYPE}} trực tiếp trên 12 triệu dòng.
- **Quy tắc review:** Mọi WHERE không được bọc hàm/cast lên cột. PR có query mới phải kèm EXPLAIN ANALYZE trên staging có dữ liệu tỉ lệ production.

### So sánh các phương án cho search
| Phương án | Index | Query phải viết | Ưu điểm | Nhược điểm |
|---|---|---|---|---|
| Composite btree (name, category_id) | {{(name, category_id)}} | {{name = ? AND category_id = ?}} | Nhanh, đơn giản, không phụ thuộc collation/IMMUTABLE | Phải lower() ở app trước khi bind |
| Composite expression index | {{(lower(name), category_id)}} | {{lower(name) = ? AND category_id = ?}} | Giữ lower() trong SQL | Cần IMMUTABLE, ANALYZE, query phải khớp biểu thức từng ký tự |
| Generated column + btree | {{name_lower}} + {{(name_lower, category_id)}} | {{name_lower = ? AND category_id = ?}} | Sargable hoàn toàn, statistics tốt | Thêm cột, tốn disk, mỗi write tính lại |

### Lưu ý khi dùng expression index
- **IMMUTABLE**: hàm trong index expression phải IMMUTABLE. {{lower()}} OK (với collation C), {{date_trunc()}} KHÔNG (phụ thuộc timezone), {{now()}} KHÔNG.
- **ANALYZE**: bắt buộc sau CREATE INDEX, nếu không planner không có statistics → vẫn Seq Scan.
- **CONCURRENTLY**: không chạy trong transaction block; gọi bằng psql, không đưa vào Flyway.
- **Query phải khớp từng ký tự**: {{lower(name) = ?}} khác {{lower(name) = lower(?)}} — planner nhìn thấy lower(?) là biểu thức, không dùng index. Phải lower ở app, bind tham số đã lower.

### Sơ đồ luồng
~~~seq
title: Search product: expression index không dùng do lower(?) và thiếu ANALYZE
actors: Client | product-search | PostgreSQL
Client -> product-search: GET /search?q=iPhone 15 Pro&category_id=10
product-search -> PostgreSQL: SELECT ... WHERE lower(name) = lower(?) AND category_id = 10
PostgreSQL -> PostgreSQL: Seq Scan 12.4M dòng (expression index lower(name) tồn tại nhưng WHERE có lower(?), thiếu ANALYZE)
PostgreSQL --> product-search: 1 dòng, 8.2 giây
note PostgreSQL: CREATE INDEX (lower(name), category_id) + ANALYZE; query: lower(name) = :qLower
product-search -> PostgreSQL: cùng query, tham số đã lower
PostgreSQL --> product-search: Index Scan, 0.4 ms
~~~

### Trả lời mẫu khi phỏng vấn
"Câu search viết lower(name) = lower(?) AND category_id = 10. Planner Seq Scan 12.4M dòng (8.2s) dù đã có expression index lower(name). Hai lỗi: (1) WHERE so sánh lower(name) với lower(?) — vế phải cũng là biểu thức, không khớp index expression lower(name); (2) thiếu ANALYZE sau tạo index nên planner không có statistics. Câu supplier_code dev vá lỗi varchar=bigint bằng cast cột (supplier_code::bigint) — phá index, Seq Scan 4.2s. Tôi sửa search: lower() ở app, bind tham số đã lower, composite index (name, category_id) — 0.4ms. Supplier_code: truyền String hoặc cast vế tham số. Expression index cần IMMUTABLE, ANALYZE, query khớp biểu thức."

> Senior tip: **Expression index là liều thuốc cuối cùng, không phải vitamin hàng ngày**. 90% trường hợp "index không dùng" sửa được bằng cách viết query sargable (cột thô = tham số đã chuẩn hóa) + composite index đúng thứ tự. Chỉ dùng expression index khi thực sự không thể sửa query (legacy, vendor code). Và nhớ: **thiếu ANALYZE = expression index không tồn tại** trong mắt planner. Luôn so EXPLAIN trước/sau, đừng tin index đã tạo là đã xong.`,
  rubric: [
    'Chỉ đúng nguyên nhân: index expression lower(name) khớp với vế trái, nhưng index đơn lẻ không bao phủ category_id và thiếu ANALYZE sau tạo expression index',
    'Dẫn chứng đúng: Seq Scan + Filter lower(name) = lower(...) + Rows Removed 12.4M + 8232 ms; Index Scan 0.4 ms khi bỏ lower(); expression index tồn tại nhưng không dùng',
    'Giải thích đúng supplier_code: cast ở vế cột phá index btree trên varchar; cast vế tham số hoặc truyền String khôi phục index',
    'Đề xuất sửa đúng: cách 1 (chuẩn hóa tham số + composite btree name+category) — khuyên dùng; cách 2 (composite expression index + ANALYZE); supplier_code cast vế tham số',
    'Nêu lưu ý IMMUTABLE, ANALYZE, CONCURRENTLY, query phải khớp biểu thức từng ký tự, so sánh 3 phương án',
  ],
  tags: ['postgresql', 'index', 'expression-index', 'sargable', 'lower', 'implicit-cast', 'analyze'],
},
{
  id: 'lab-sql-034',
  category: 'sql',
  title: 'Job dọn dữ liệu xoá 50% bảng orders: SELECT ... ORDER BY id LIMIT 1 mất 60 giây vì dead tuple',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử **MegaMart** chạy {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{orders}} lưu đơn hàng: **40.000.000 dòng** (~9,3 GB tổng, heap ~4,6 GB, nằm gọn trong RAM), trung bình 38 nghìn giao dịch/ngày. Lúc 02:00 mỗi đêm, job dọn dữ liệu chạy {{DELETE FROM orders WHERE created_at < now() - interval '18 months'}} xoá khoảng **50% bảng** (20 triệu dòng). Sau khi job commit, màn hình "Đơn hàng mới nhất" gọi {{SELECT ... ORDER BY id LIMIT 1}} — trước đây 0,3 ms — nay mất **60 giây**. CPU RDS 95%, nhưng ReadIOPS gần như không đổi (đọc từ RAM). pg_stat_user_tables báo {{n_dead_tup}} tăng vọt. Có một phiên {{idle in transaction}} đã mở **6 giờ** trong log pg_stat_activity.

**Việc bạn có.** Ba artifact: EXPLAIN (ANALYZE, BUFFERS) của câu SELECT ORDER BY id LIMIT 1, snapshot pg_stat_user_tables + pg_stat_activity, và log autovacuum. Hãy tìm nguyên nhân gốc, chứng minh bằng dòng cụ thể, và đề xuất cách sửa ngắn hạn và dài hạn.`,
  artifacts: [
    {
      name: 'explain-select-limit.txt',
      lang: 'text',
      content: `-- 2026-03-14 03:12:41 +07, psql trên RDS megamart-primary (PostgreSQL 15.6)
megamart=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, customer_id, status, created_at FROM orders ORDER BY id LIMIT 1;
                                                           QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=0.56..0.60 rows=1 width=40) (actual time=60123.412..60123.415 rows=1 loops=1)
   ->  Index Scan using orders_pkey on orders  (cost=0.56..0.60 rows=1 width=40) (actual time=0.041..60123.409 rows=1 loops=1)
         Buffers: shared hit=598934 read=6178
         ->  Heap Fetches: 598934
 Planning Time: 0.284 ms
 Execution Time: 60123.704 ms
(6 rows)

-- So sánh: trước khi chạy job dọn dữ liệu (snapshot 01:55):
--   Limit ... rows=1 loops=1, Buffers: shared hit=3 read=0, Execution Time: 0.284 ms

-- pg_stat_user_tables trước/sau:
--   trước: n_live_tup = 40000000, n_dead_tup = 12000
--   sau:   n_live_tup = 20000000, n_dead_tup = 20012000`,
    },
    {
      name: 'pg-stat-activity.txt',
      lang: 'text',
      content: `-- 2026-03-14 03:10:00 +07, RDS megamart-primary
megamart=# SELECT pid, state, now() - xact_start AS xact_age,
       wait_event_type, wait_event, left(query, 70) AS query
FROM pg_stat_activity
WHERE datname = 'megamart' AND backend_type = 'client backend'
ORDER BY xact_start
LIMIT 8;
  pid  |        state        |   xact_age   | wait_event_type | wait_event |                            query
-------+---------------------+--------------+-----------------+------------+--------------------------------------------------------------
 18421 | idle in transaction | 06:00:12.402 | Client          | ClientRead | BEGIN; SELECT * FROM orders WHERE ...; -- chưa COMMIT
 18422 | active              | 00:00:00.014 |                 |            | SELECT id, customer_id, status, created_at FROM orders ORDER BY id LIMIT 1
 18423 | active              | 00:00:00.008 |                 |            | SELECT count(*) FROM orders WHERE status = $1
 18424 | idle                |              | Client          | ClientRead | <insufficient privilege>
...
-- xid age của phiên 18421: 41.200.000 (giữ snapshot cũ)
-- max_connections = 200, active = 47, idle in transaction = 1`,
    },
    {
      name: 'autovacuum-log.txt',
      lang: 'text',
      content: `-- 2026-03-14 03:11:00 +07, RDS megamart-primary
-- log_autovacuum_min_duration = 0
-- log:
2026-03-14 03:08:14.112 UTC [40211] LOG:  automatic vacuum of table "public.orders": skipped because of lock conflict
2026-03-14 03:08:14.113 UTC [40211] DETAIL:  dead row versions cannot be removed yet, oldest xmin: 12345678
2026-03-14 03:09:02.441 UTC [40211] LOG:  automatic vacuum of table "public.orders": index vacuum skipped
2026-03-14 03:09:41.772 UTC [40211] LOG:  automatic vacuum of table "public.orders": found 0 removable, 20012000 dead row versions
-- pg_stat_user_tables:
--   n_dead_tup = 20012000, n_live_tup = 20000000, last_autovacuum = 2026-03-07 02:10:00
-- pg_relation_size('orders') = 4.6 GB heap (tăng từ 4.6 GB trước delete? thực tế heap không giảm)`,
    },
  ],
  questions: [
    'Vì sao câu SELECT ORDER BY id LIMIT 1 phải đọc 598.934 page (Heap Fetches) dù chỉ trả 1 dòng? Chỉ ra bằng dòng nào trong EXPLAIN.',
    'Vì sao autovacuum không dọn được 20 triệu dead tuple dù đang bật và chạy liên tục? Dẫn chứng bằng artifact.',
    'Bạn xử lý thế nào trong ngày 14/03 và thiết kế dài hạn để không tái diễn (vacuum, partitioning, job batch)?',
  ],
  hints: [
    'Đọc dòng "Heap Fetches: 598934" trong EXPLAIN: Index Scan phải đi theo pointer từng entry trong index, fetch heap tuple, rồi kiểm tra visibility (xmax/xmin). Khi dead tuple chưa được vacuum, mỗi entry trong index trỏ tới một dead tuple → phải fetch heap để kiểm tra visibility.',
    'Tìm phiên idle in transaction trong pg_stat_activity: nó giữ snapshot cũ (xmin), chặn autovacuum vì dead tuple vẫn cần cho snapshot của phiên đó.',
    'n_dead_tup tăng + vacuum log skip ("dead row versions cannot be removed yet") = autovacuum bị chặn bởi snapshot.',
  ],
  answer: `**Tóm tắt:** Job DELETE xoá 20 triệu dòng sinh ra 20 triệu dead tuple. Một phiên {{idle in transaction}} mở 6 giờ giữ snapshot cũ → autovacuum không thể xoá dead tuple (chúng vẫn còn cần cho snapshot đó). Dead tuple tích luỹ → index scan phải fetch heap tuple để kiểm tra visibility → 598.934 Heap Fetches → 60 giây. Sửa: terminate phiên idle in transaction, VACUUM FULL ngoài giờ cao điểm, đặt idle_in_transaction_session_timeout, và thiết kế job batch commit theo lô + partitioning theo tháng để xoá dữ liệu cũ bằng DROP PARTITION thay vì DELETE hàng triệu dòng.
### Nguyên nhân gốc
1. Job DELETE xoá 20 triệu dòng (50% bảng) → mỗi dòng bị xoá trở thành dead tuple (vẫn còn trong heap, chỉ đánh dấu deleted).
2. Phiên idle in transaction (pid 18421) opened 6 giờ trước giữ snapshot cũ (xmin). Autovacuum không thể xoá dead tuple vì chúng vẫn cần cho snapshot của phiên đó.
3. Dead tuple tích luỹ: n_dead_tup = 20.012.000 (gần bằng n_live_tup). Index scan phải fetch heap tuple để kiểm tra visibility → 598.934 Heap Fetches → 60 giây.
### Dẫn chứng
- Artifact 1: Heap Fetches: 598934, Execution Time: 60123.704 ms, Buffers: shared hit=598934 read=6178. Trước job: 0,284 ms.
- Artifact 2: pid 18421 state idle in transaction, xact_age 6 giờ, xid age 41.2M.
- Artifact 3: vacuum log "dead row versions cannot be removed yet, oldest xmin: 12345678"; n_dead_tup = 20012000.
### Cách sửa ngắn hạn
- Terminate phiên idle in transaction ({{pg_terminate_backend(18421)}}) sau khi xác nhận không còn cần.
- Chạy VACUUM (FULL nếu cần) ngoài giờ cao điểm để thu hồi space.
- Bật {{idle_in_transaction_session_timeout}} (ví dụ 5 phút) để tự kill phiên treo.
### Cách sửa dài hạn
- Job dọn dữ liệu nên commit theo lô (batch) thay vì một transaction lớn.
- Partitioning theo tháng: xoá dữ liệu cũ bằng {{ALTER TABLE ... DETACH PARTITION}} rồi {{DROP TABLE}} partition đó — nhanh, không sinh dead tuple.
- Bật monitoring: alert khi n_dead_tup / n_live_tup > 20%, khi idle in transaction > 5 phút, khi xid age > 1 tỷ.
- Tune autovacuum: giảm autovacuum_vacuum_scale_factor cho bảng lớn, tăng autovacuum_max_workers.
> Senior tip: DELETE hàng triệu dòng là anti-pattern cho bảng lớn. Dùng partitioning + DROP PARTITION để xoá dữ liệu cũ mà không sinh dead tuple. Và luôn đặt idle_in_transaction_session_timeout — một transaction "quên COMMIT" giữ snapshot và chặn vacuum toàn bộ hệ thống.`,
  rubric: [
    'Chỉ đúng nguyên nhân: job DELETE sinh 20 triệu dead tuple, phiên idle in transaction giữ snapshot chặn autovacuum, dead tuple chưa vacuum làm index scan phải fetch heap → 598.934 Heap Fetches → 60 giây',
    'Dẫn chứng đúng: Heap Fetches 598934, Execution Time 60123 ms, n_dead_tup 20012000, vacuum log skip, pid idle in transaction xact_age 6 giờ',
    'Giải thích đúng vì sao dead tuple làm query chậm (nhiều heap fetch, cùng plan)',
    'Đề xuất sửa đúng: terminate phiên, VACUUM FULL, idle_in_transaction_session_timeout, batch commit, partitioning + DROP PARTITION, monitoring',
    'Có monitoring/phòng ngừa: alert n_dead_tup ratio, idle in transaction, xid age, tune autovacuum',
  ],
  tags: ['postgresql', 'mvcc', 'dead-tuple', 'vacuum', 'autovacuum', 'idle-in-transaction', 'partitioning'],
},
{
  id: 'lab-sql-035',
  category: 'sql',
  title: 'MySQL InnoDB: 4 worker cập nhật các nhóm dòng không giao nhau vẫn deadlock vì thiếu index',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử **ShopMart** chạy {{inventory-service}} (Spring Boot 3.3, Hibernate 6.4, MySQL 8.0.36 trên RDS, 8 vCPU / 32 GB RAM). Bảng {{inventory}} lưu tồn kho theo SKU: **18.400.000 dòng**, isolation level mặc định **REPEATABLE READ**. Mỗi SKU có cột {{warehouse_id}} (kho) và {{quantity}}. Bảng có index {{idx_inventory_sku}} trên {{sku}} (primary key) nhưng **thiếu index trên {{warehouse_id}}**. 4 worker cùng chạy job "cập nhật tồn kho theo kho": worker 1 xử lý kho 1, worker 2 xử lý kho 2, worker 3 xử lý kho 3, worker 4 xử lý kho 4 — các nhóm dòng **không giao nhau** (không SKU nào thuộc hai kho).

**Triệu chứng (15/03/2026, 11:30).** Khoảng 12% job bị lỗi {{Deadlock found when trying to get lock; try restarting transaction}} (SQLState 40001). SHOW ENGINE INNODB STATUS cho thấy LATEST DETECTED DEADLOCK với lock_mode X locks gap before rec / next-key. CPU RDS 35% (không quá tải), HikariCP pool không cạn. DBA nghi ngờ "thiếu index" nhưng không rõ vì sao các nhóm không giao nhau vẫn deadlock.

**Việc bạn có.** Ba artifact: SHOW ENGINE INNODB STATUS (LATEST DETECTED DEADLOCK), SHOW CREATE TABLE + SHOW INDEX, và log ứng dụng. Hãy tìm nguyên nhân gốc, chứng minh bằng dòng cụ thể, và đề xuất cách sửa.`,
  artifacts: [
    {
      name: 'innodb-deadlock-status.txt',
      lang: 'text',
      content: `-- 2026-03-15 11:31:00 +07, RDS shopmart-inventory (MySQL 8.0.36)
mysql> SHOW ENGINE INNODB STATUS\\G
...
------------------------
LATEST DETECTED DEADLOCK
------------------------
2026-03-15 11:30:45 0x7f8a1c0
*** (1) TRANSACTION:
TRANSACTION 42184321, ACTIVE 0.003 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1136, 1 row lock(s)
MySQL thread id 4121, OS thread handle 140234567890, query id 88412345 localhost 127.0.0.1 app updating
UPDATE inventory SET quantity = quantity - 1 WHERE warehouse_id = 1 AND sku LIKE 'A%'
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 45 page no 8821 n bits 72 index PRIMARY of table shop.inventory
lock_mode X locks gap before rec insert intention waiting
Record lock, heap_no 44 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
 0: len 8; hex 8000000000000001; (sku=1)  1: len 4; hex 80000001; (warehouse_id=1)  2: len 4; hex 8000000a; (quantity=10)  3: len 8; hex 8000000000000064; (id=100)

*** (2) TRANSACTION:
TRANSACTION 42184322, ACTIVE 0.003 sec starting index read
mysql tables in use 1, locked 1
LOCK WAIT 2 lock struct(s), heap size 1136, 1 row lock(s)
MySQL thread id 4122, OS thread handle 140234567891, query id 88412346 localhost 127.0.0.1 app updating
UPDATE inventory SET quantity = quantity - 1 WHERE warehouse_id = 2 AND sku LIKE 'A%'
*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS space id 45 page no 8821 n bits 72 index PRIMARY of table shop.inventory
lock_mode X locks gap before rec insert intention waiting
Record lock, heap_no 44 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
 0: len 8; hex 8000000000000001; (sku=1)  1: len 4; hex 80000001; (warehouse_id=1)  2: len 4; hex 8000000a; (quantity=10)  3: len 8; hex 8000000000000064; (id=100)

*** (2) HOLDS THE LOCK(S):
RECORD LOCKS space id 45 page no 8821 n bits 72 index PRIMARY of table shop.inventory
lock_mode X locks rec but not gap
Record lock, heap_no 45 PHYSICAL RECORD: n_fields 4; compact format; info bits 0
 0: len 8; hex 8000000000000002; (sku=2)  1: len 4; hex 80000002; (warehouse_id=2)  2: len 4; hex 80000005; (quantity=5)  3: len 8; hex 8000000000000065; (id=101)

*** WE ROLL BACK (2)

-- Ghi chú: cả hai transaction đều đang quét cùng một page (page no 8821) của clustered index PRIMARY (sku PK).
-- Dù warehouse_id khác nhau, vì không có index trên warehouse_id, InnoDB quét toàn bảng theo thứ tự sku (clustered index PK).
-- Transaction 1 giữ lock trên sku=2 (warehouse 2), transaction 2 chờ gap lock trên sku=1 (warehouse 1) → deadlock.`,
    },
    {
      name: 'schema-and-index.txt',
      lang: 'text',
      content: `-- 2026-03-15 11:32:00 +07, RDS shopmart-inventory
mysql> SHOW CREATE TABLE inventory\\G
*************************** 1. row ***************************
       Table: inventory
Create Table: CREATE TABLE \`inventory\` (
  \`id\` bigint NOT NULL AUTO_INCREMENT,
  \`sku\` bigint NOT NULL,
  \`warehouse_id\` int NOT NULL,
  \`quantity\` int NOT NULL,
  \`updated_at\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`idx_inventory_sku\` (\`sku\`),
  KEY \`idx_inventory_warehouse\` (\`warehouse_id\`)  -- index này TỒN TẠI nhưng chỉ có warehouse_id, không có sku
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
-- Ghi chú: index idx_inventory_warehouse chỉ có warehouse_id. Query WHERE warehouse_id = ? AND sku LIKE 'A%' cần composite index (warehouse_id, sku).

mysql> SHOW INDEX FROM inventory;
+-----------+------------+------------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| Table     | Non_unique | Key_name               | Seq_in_index | Column_name   | Collation | Cardinality | Sub_part | Packed | Null | Index_type | Comment | Index_comment |
+-----------+------------+------------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+
| inventory |          0 | PRIMARY                |            1 | id            | A         |     18400000 |     NULL | NULL   |      | BTREE      |         |               |
| inventory |          0 | idx_inventory_sku      |            1 | sku           | A         |     18400000 |     NULL | NULL   |      | BTREE      |         |               |
| inventory |          1 | idx_inventory_warehouse|            1 | warehouse_id  | A         |            4 |     NULL | NULL   |      | BTREE      |         |               |
+-----------+------------+------------------------+--------------+---------------+-----------+-------------+----------+--------+------+------------+---------+---------------+

mysql> EXPLAIN SELECT id, sku, quantity FROM inventory WHERE warehouse_id = 1 AND sku LIKE 'A%';
+----+-------------+-----------+------------+------+------------------------+------+---------+------+----------+----------+-------------+
| id | select_type | table     | partitions | type | possible_keys          | key  | key_len | ref  | rows     | filtered | Extra       |
+----+-------------+-----------+------------+------+------------------------+------+---------+------+----------+----------+-------------+
|  1 | SIMPLE      | inventory | NULL       | ALL  | idx_inventory_warehouse| NULL | NULL    | NULL | 18400000 |     0.25 | Using where |
+----+-------------+-----------+------------+------+------------------------+------+---------+------+----------+----------+-------------+
-- type = ALL (full table scan), key = NULL (không dùng index nào) vì warehouse_id chỉ có 4 giá trị (cardinality 4), optimizer chọn full scan.
-- Dù idx_inventory_warehouse tồn tại, optimizer bỏ qua vì selectivity quá thấp (4 kho → mỗi kho ~4.6 triệu dòng).`,
    },
    {
      name: 'app-inventory-update.log',
      lang: 'text',
      content: `2026-03-15 11:30:44.801 INFO  [worker-1] c.s.inventory.InventoryJob : updateStock start warehouseId=1 skuPrefix=A
2026-03-15 11:30:44.802 DEBUG [worker-1] o.h.SQL : update inventory set quantity = quantity - 1 where warehouse_id = ? and sku like ?
2026-03-15 11:30:44.803 INFO  [worker-2] c.s.inventory.InventoryJob : updateStock start warehouseId=2 skuPrefix=A
2026-03-15 11:30:44.804 DEBUG [worker-2] o.h.SQL : update inventory set quantity = quantity - 1 where warehouse_id = ? and sku like ?
2026-03-15 11:30:45.012 ERROR [worker-1] c.s.inventory.InventoryJob : updateStock failed warehouseId=1
com.mysql.cj.jdbc.exceptions.MySQLTransactionRollbackException: Deadlock found when trying to get lock; try restarting transaction
2026-03-15 11:30:45.013 ERROR [worker-2] c.s.inventory.InventoryJob : updateStock failed warehouseId=2
com.mysql.cj.jdbc.exceptions.MySQLTransactionRollbackException: Deadlock found when trying to get lock; try restarting transaction
-- pattern: 4 worker cùng chạy, deadlock xảy ra ở worker 1 và 2 (và thỉnh thoảng worker 3/4), retry sau 200ms thành công.`,
    },
  ],
  questions: [
    'Vì sao 4 worker cập nhật các nhóm dòng không giao nhau (warehouse_id khác nhau) vẫn deadlock? Chỉ ra bằng dòng lock_mode trong SHOW ENGINE INNODB STATUS.',
    'Giải thích cơ chế: InnoDB khoá theo đường quét index (clustered index PK theo sku), không theo WHERE. Khi thiếu index phù hợp, transaction quét toàn bảng theo thứ tự sku, giữ next-key lock/gap lock trên các dòng của kho khác → deadlock.',
    'Bạn sửa thế nào để loại bỏ deadlock (index composite, transaction ngắn, retry)? Giải thích vì sao index (warehouse_id, sku) giúp mỗi transaction chỉ quét và khoá dòng của kho mình.',
  ],
  hints: [
    'Đọc lock_mode "X locks gap before rec insert intention waiting" và "X locks rec but not gap" trong SHOW ENGINE INNODB STATUS: transaction 1 giữ lock trên sku=2 (warehouse 2), transaction 2 chờ gap lock trên sku=1 (warehouse 1) → deadlock.',
    'InnoDB luôn khoá theo thứ tự index nó quét. Nếu không có index phù hợp, nó quét clustered index (PK theo sku/id) → thứ tự lock là sku tăng dần, không phải warehouse.',
    'Index composite (warehouse_id, sku) cho phép InnoDB quét và khoá chỉ các dòng của warehouse mình, không chạm dòng của kho khác. Thêm retry cho deadlock (SQLState 40001) và giữ transaction ngắn.',
  ],
  answer: `**Tóm tắt:** 4 worker cập nhật các kho khác nhau nhưng deadlock vì **thiếu index phù hợp trên {{(warehouse_id, sku)}}**. InnoDB không khoá theo điều kiện WHERE; nó khoá theo **thứ tự quét index**. Vì {{idx_inventory_warehouse}} chỉ có {{warehouse_id}} (cardinality 4), optimizer chọn full table scan → InnoDB quét toàn bảng theo **clustered index (PK theo sku)**, giữ next-key lock/gap lock trên các dòng thuộc kho khác. Worker 1 giữ lock trên sku=2 (kho 2) và chờ gap lock trên sku=1 (kho 1); worker 2 giữ lock trên sku=1 và chờ sku=2 → deadlock. Sửa: tạo composite index {{(warehouse_id, sku)}} để mỗi transaction chỉ quét và khoá dòng của kho mình, thêm retry cho deadlock, và giữ transaction ngắn.
### Nguyên nhân gốc
1. Bảng {{inventory}} có {{idx_inventory_warehouse}} chỉ trên {{warehouse_id}} (cardinality 4 → mỗi kho ~4,6 triệu dòng). Optimizer chọn full table scan (type = ALL) vì selectivity quá thấp.
2. InnoDB quét clustered index (PRIMARY theo {{id}}/sku) → thứ tự lock là **sku tăng dần**, không phải warehouse.
3. Worker 1 (kho 1) quét toàn bảng, giữ next-key lock trên sku=2 (kho 2) và chờ gap lock trên sku=1 (kho 1). Worker 2 (kho 2) cũng quét toàn bảng, giữ lock trên sku=1 và chờ sku=2 → deadlock.
4. Deadlock detector InnoDB phát hiện chu trình chờ và rollback một transaction (SQLState 40001).
### Dẫn chứng
- Artifact 1: lock_mode "X locks gap before rec insert intention waiting" trên sku=1 (warehouse 1), "X locks rec but not gap" trên sku=2 (warehouse 2). Transaction 1 giữ lock sku=2, transaction 2 chờ gap lock sku=1 → deadlock.
- Artifact 2: idx_inventory_warehouse chỉ có warehouse_id (cardinality 4), EXPLAIN type = ALL, key = NULL. Thiếu composite index (warehouse_id, sku).
- Artifact 3: 4 worker cùng chạy, deadlock ở worker 1 và 2, retry sau 200ms thành công.
### Cách sửa
**Ngắn hạn (hôm nay):**
- Tạo composite index: {{CREATE INDEX idx_inventory_warehouse_sku ON inventory (warehouse_id, sku);}} (MySQL 8.0 hỗ trợ online DDL: {{ALGORITHM=INPLACE, LOCK=NONE}}).
- Thêm retry cho deadlock (SQLState 40001) với backoff nhỏ (100 ms, 200 ms, 400 ms, tối đa 3 lần).
**Dài hạn:**
- Giữ transaction ngắn: chỉ UPDATE inventory trong transaction, đọc order_item và tính toán ngoài transaction.
- Theo dõi deadlock rate trong {{SHOW ENGINE INNODB STATUS}} và metric {{innodb_deadlocks}} (performance_schema).
- Nếu deadlock vẫn xảy ra do nhiều SKU chung, dùng advisory lock hoặc serialise theo SKU.
> Senior tip: InnoDB **không** khoá theo WHERE; nó khoá theo thứ tự index nó quét. Vì vậy "các nhóm dòng không giao nhau" chỉ đúng về mặt logic, không đúng về mặt lock. Quy tắc: mọi transaction UPDATE nhiều dòng phải có index phù hợp để InnoDB chỉ quét và khoá dòng của nhóm mình. Và deadlock là cơ chế bảo vệ dữ liệu — mục tiêu là làm cho nó rẻ và tự hồi phục (index đúng + retry + idempotency).`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: thiếu composite index (warehouse_id, sku) → InnoDB quét clustered index theo sku, giữ next-key/gap lock trên dòng của kho khác → deadlock giữa các transaction cập nhật kho khác nhau',
    'Dẫn chứng đúng: lock_mode X locks gap before rec / next-key trong SHOW ENGINE INNODB STATUS, transaction 1 giữ lock sku=2 (warehouse 2) chờ sku=1 (warehouse 1)',
    'Giải thích đúng cơ chế: InnoDB khoá theo đường quét index, không theo WHERE; idx_inventory_warehouse chỉ có warehouse_id (cardinality 4) → optimizer chọn full scan',
    'Đề xuất sửa đúng: composite index (warehouse_id, sku) với online DDL, retry cho deadlock (40001), transaction ngắn',
    'Có monitoring/phòng ngừa: theo dõi deadlock rate, log_lock_waits, quy tắc review index cho query UPDATE',
  ],
  tags: ['mysql', 'innodb', 'deadlock', 'index', 'gap-lock', 'next-key-lock', 'composite-index'],
  },
  {
    id: 'lab-sql-036',
    category: 'sql',
    title: 'Sai kiểu tham số khiến index không được dùng',
    level: 'senior',
    scenario: `**Bối cảnh:** Hệ thống ngân hàng lưu số điện thoại khách hàng trong cột {{phone}} kiểu {{varchar(20)}} của bảng {{customers}} (PostgreSQL 15). Có B-tree index trên {{phone}}. API tra cứu khách hàng theo số điện thoại nhận tham số từ client, nhưng do sai kiểu trong PreparedStatement, JDBC gửi tham số kiểu numeric. Khi chạy query, EXPLAIN cho thấy PostgreSQL thực hiện **Seq Scan** trên cả bảng (đang 4 triệu dòng) thay vì index scan, vì phải ép kiểu cột {{phone}} về numeric trước khi so sánh. Hệ thống chậm rõ rệt vào giờ cao điểm.

**Số liệu:** Bảng {{customers}} 4.2 triệu dòng, index trên {{phone}} tồn tại. Query tra cứu một SĐT duy nhất nhưng đọc khoảng 1.2 triệu trang buffer, CPU DB tăng từ 15% lên 85%, thời gian trung bình từ 2 ms lên 480 ms.

**Nhiệm vụ:** Chỉ ra vì sao index không được dùng, dẫn chứng từ EXPLAIN, và sửa sao cho index scan được sử dụng lại.`,
    artifacts: [
      {
        name: 'schema-customers.sql',
        lang: 'sql',
        content: `CREATE TABLE customers (
  id bigserial primary key,
  phone varchar(20) not null,
  full_name varchar(100) not null,
  status varchar(20) default 'active',
  created_at timestamp default now()
);

CREATE INDEX idx_customers_phone ON customers (phone);

-- Dữ liệu mẫu: 4.2 triệu dòng, SĐT dạng chuỗi như '0901234567', '0987654321'.
INSERT INTO customers (phone, full_name) VALUES ('0901234567', 'Nguyen Van A');
-- ... 4.2 triệu dòng tương tự`,
      },
      {
        name: 'explain-analyze.log',
        lang: 'text',
        content: `2026-04-02 10:15:23 +07 LOG:  duration: 478.321 ms  statement: PREPARE stmt AS SELECT id, full_name FROM customers WHERE phone = $1;
2026-04-02 10:15:23 +07 LOG:  duration: 478.321 ms  statement: EXECUTE stmt(901234567);  -- tham số gửi kiểu numeric (không có nháy đơn) trong code Java

postgres=# EXPLAIN (ANALYZE, BUFFERS) SELECT id, full_name FROM customers WHERE phone = '0901234567';
                                                   QUERY PLAN
-----------------------------------------------------------------------------------------------------------------
 Index Scan using idx_customers_phone on customers  (cost=0.43..8.45 rows=1 width=40) (actual time=0.023..0.028 rows=1 loops=1)
   Index Cond: (phone = '0901234567'::text)
   Buffers: shared hit=3
 Planning time: 0.102 ms
 Execution time: 0.044 ms
(5 rows)

postgres=# EXPLAIN (ANALYZE, BUFFERS) SELECT id, full_name FROM customers WHERE phone = 901234567;  -- thiếu nháy đơn, PostgreSQL coi là numeric literal
                                                   QUERY PLAN
-----------------------------------------------------------------------------------------------------------------
 Seq Scan on customers  (cost=0.00..118742.42 rows=1 width=40) (actual time=0.015..478.123 rows=1 loops=1)
   Filter: ((phone)::numeric = 901234567::numeric)
   Rows Removed by Filter: 4199999
   Buffers: shared hit=1249998
 Planning time: 0.115 ms
 Execution time: 478.159 ms
(5 rows)

-- Dòng quan trọng: "Filter: ((phone)::numeric = 901234567::numeric)" — PostgreSQL ép kiểu cột phone về numeric để so sánh với tham số numeric, do đó không thể dùng B-tree index trên phone (kiểu varchar). Seq Scan quét toàn bộ 4.2 triệu dòng.`,
      },
    ],
    questions: [
      'Vì sao query với tham số numeric lại gây Seq Scan mặc dù có index trên cột phone varchar? Chỉ ra chính xác dòng nào trong EXPLAIN chứng minh điều này.',
      'Sai việc nằm ở layer nào (JDBC/PreparedStatement, SQL, hay kiểu dữ liệu cột)?',
      'Sửa thế nào để index scan được dùng lại, và tại sao cách sửa là an toàn đối với dữ liệu đã có?',
    ],
    hints: [
      'PostgreSQL không tự động chuyển đổi tham số numeric sang varchar để khớp index; ngược lại nó ép kiểu cột về kiểu của tham số. Khi cột được ép kiểu, B-tree index trên cột gốc không thể dùng.',
      'Dòng "Filter: ((phone)::numeric = ...)" trong EXPLAIN là bằng chứng: cột phone bị ép kiểu ngay trong điều kiện lọc, index bị bỏ qua.',
      'Cách sửa đơn giản nhất là gửi tham số đúng kiểu (chuỗi, có dấu ngoặc đơn) hoặc cast tham số về varchar. Không nên đổi kiểu cột vì sẽ ảnh hưởng toàn bộ dữ liệu và ứng dụng khác.',
    ],
    answer: `**Tóm tắt:** Query tra cứu SĐT dùng tham số kiểu numeric trong khi cột {{phone}} là {{varchar}}. PostgreSQL không thay đổi kiểu tham số để khớp index, mà **ép kiểu cột {{phone}} về numeric** trong điều kiện WHERE (xem dòng {{Filter: ((phone)::numeric = ...)}} trong EXPLAIN). Khi cột được ép kiểu, B-tree index trên {{phone}} (kiểu varchar) không thể sử dụng → PostgreSQL chọn **Seq Scan** quét 4.2 triệu dòng, CPU và thời gian phản hồi tăng xấp xỉ 240 lần (2 ms → 480 ms).

### Nguyên nhân gốc
1. Cột {{phone}} khai báo kiểu {{varchar(20)}}, có B-tree index {{idx_customers_phone}} trên cột này.
2. Code Java gửi tham số vào PreparedStatement dưới kiểu numeric (hoặc thiếu nháy đơn khiến PostgreSQL hiểu là số). PostgreSQL ưu tiên ép kiểu cột về kiểu của tham số thay vì ngược lại.
3. Biểu thức {{(phone)::numeric = 901234567::numeric}} không còn là so sánh trực tiếp trên cột {{phone}} mà là so sánh trên kết quả ép kiểu. B-tree index được xây dựng trên giá trị gốc (varchar), không hỗ trợ tìm kiếm trên giá trị sau khi ép kiểu → index bị bỏ qua.
4. PostgreSQL chọn Seq Scan (type = ALL tương đương) vì không có index nào khả dụng cho biểu thức đã ép kiểu.

### Dẫn chứng
- Artifact 2 (EXPLAIN với tham số chuỗi): Index Scan, cost 0.43..8.45, execution time 0.044 ms, chỉ đọc 3 buffer → index hoạt động đúng khi tham số đúng kiểu.
- Artifact 2 (EXPLAIN với tham số numeric): Seq Scan, cost 0.00..118742.42, execution time 478.159 ms, "Rows Removed by Filter: 4199999", dòng {{Filter: ((phone)::numeric = 901234567::numeric)}} → bằng chứng trực tiếp của việc ép kiểu cột.
- Số liệu: đọc khoảng 1.25 triệu trang buffer (shared hit=1249998) cho một tra cứu duy nhất, CPU DB tăng từ 15% lên 85%.

### Cách sửa
**Cách 1 (khuyên dùng, ít tốn công nhất): Gửi tham số đúng kiểu varchar.**
Trong Java, truyền giá trị SĐT dưới dạng chuỗi (String) vào PreparedStatement, luôn bao quanh bằng dấu ngoặc đơn trong SQL (hoặc để JDBC tự xử lý binding):
{{String sql = "SELECT id, full_name FROM customers WHERE phone = ?";}}
{{ps.setString(1, "0901234567");}}
PostgreSQL nhận tham số kiểu text/varchar, không ép cột, index scan được dùng lại.

**Cách 2: Cast tham số trong SQL.**
{{SELECT id, full_name FROM customers WHERE phone = $1::varchar}}
hoặc
{{WHERE phone = CAST($1 AS varchar)}}.

**Không khuyến khích:** Đổi kiểu cột {{phone}} từ varchar thành numeric. Sẽ ảnh hưởng toàn bộ dữ liệu (SĐT có dấu +, dấu gạch ngang, leading zero), cần migration lớn và sửa mọi truy vấn khác dùng cột này.

### Phòng ngừa
- Luôn kiểm tra kiểu tham số khi viết PreparedStatement; SĐT, mã thẻ, mã số thuế là chuỗi, không phải số, dù chỉ chứa chữ số.
- Thêm guardrail: theo dõi pg_stat_statements, cảnh báo khi một query có rowsRemoved lớn so với rows trả về (tỷ lệ > 1000:1) hoặc sử dụng Seq Scan trên bảng lớn.
- Review SQL: tránh hàm hoặc ép kiểu trên cột được index trong mệnh đề WHERE (sargable).
> Senior tip: Điều quan trọng then chốt là **index chỉ giúp khi cột không bị biến đổi** trong WHERE. Hàm, ép kiểu, hay thao tác chuỗi trên cột index đều khiến PostgreSQL bỏ qua index. Nếu nhìn thấy ::numeric, ::text, cast, hoặc hàm như lower() trên cột index trong EXPLAIN, đó là tín hiệu sớm của vấn đề hiệu năng.`,
    rubric: [
      'Chỉ đúng nguyên nhân gốc: tham số numeric khiến PostgreSQL ép kiểu cột phone (varchar) về numeric, dòng "Filter: ((phone)::numeric = ..." trong EXPLAIN là bằng chứng, index bị bỏ qua → Seq Scan.',
      'Dẫn chứng đúng: so sánh hai EXPLAIN (chuỗi → Index Scan 0.04 ms; numeric → Seq Scan 478 ms, rowsRemoved 4.2 triệu), chỉ ra dòng Filter có ::numeric.',
      'Sửa đúng: gửi tham số đúng kiểu varchar (setString) hoặc cast tham số ::varchar; không đổi kiểu cột vì ảnh hưởng dữ liệu',
      'Có phân tích tại sao không đổi kiểu cột (SĐT có ký tự đặc biệt, leading zero, migration lớn) và phương án phòng ngừa (pg_stat_statements, sargable query, guardrail rowsRemoved)',
    ],
    tags: ['postgresql', 'index', 'implicit-cast', 'seq-scan', 'explain', 'sargable'],
  },
  {
    id: 'lab-sql-037',
    category: 'sql',
    title: 'Deadlock do hai giao dịch cập nhật số dư theo thứ tự khác nhau',
    level: 'senior',
    scenario: `**Bối cảnh:** Hệ thống ví điện tử có bảng {{accounts}} (id bigserial, balance numeric) lưu số dư từng khách hàng. Hai chức năng chạy song song: (1) chuyển tiền từ tài khoản A sang B, (2) chuyển tiền từ B sang A (hoặc hai giao dịch cập nhật cùng hai tài khoản nhưng theo thứ tự ngược nhau). Mỗi giao dịch bắt đầu transaction, khóa và cập nhật số dư của hai tài khoản theo thứ tự khác nhau. PostgreSQL phát hiện deadlock và rollback một trong hai transaction.

**Số liệu:** Bảng {{accounts}} 500.000 dòng. Hai transaction T1 và T2 cùng cập nhật tài khoản id=101 và id=102. T1 cập nhật 101 trước rồi 102; T2 cập nhật 102 trước rồi 101. Deadlock xảy ra trong vài giây, lỗi SQLState 40P01.

**Nhiệm vụ:** Phân tích log deadlock, chỉ ra nguyên nhân, và sửa sao các transaction luôn khóa theo thứ tự cố định.`,
    artifacts: [
      {
        name: 'schema-accounts.sql',
        lang: 'sql',
        content: `CREATE TABLE accounts (
  id bigserial primary key,
  owner varchar(100) not null,
  balance numeric(18,2) not null default 0,
  currency varchar(3) default 'VND',
  updated_at timestamp default now()
);

CREATE INDEX idx_accounts_owner ON accounts (owner);

-- Dữ liệu mẫu
INSERT INTO accounts (owner, balance, currency) VALUES ('Nguyen Van A', 10000000, 'VND');  -- id = 101
INSERT INTO accounts (owner, balance, currency) VALUES ('Tran Thi B', 10000000, 'VND');    -- id = 102`,
      },
      {
        name: 'postgres-deadlock.log',
        lang: 'text',
        content: `2026-04-05 14:22:10.123 +07 [12345] LOG:  duration: 0.123 ms  statement: BEGIN;
2026-04-05 14:22:10.124 +07 [12345] LOG:  duration: 0.045 ms  statement: UPDATE accounts SET balance = balance - 500000 WHERE id = 101;
2026-04-05 14:22:10.500 +07 [12346] LOG:  duration: 0.110 ms  statement: BEGIN;
2026-04-05 14:22:10.501 +07 [12346] LOG:  duration: 0.038 ms  statement: UPDATE accounts SET balance = balance - 300000 WHERE id = 102;
2026-04-05 14:22:10.600 +07 [12345] LOG:  duration: 0.095 ms  statement: UPDATE accounts SET balance = balance - 200000 WHERE id = 102;  -- T1 chờ lock trên id=102 do T2 giữ
2026-04-05 14:22:10.601 +07 [12346] LOG:  duration: 0.088 ms  statement: UPDATE accounts SET balance = balance - 100000 WHERE id = 101;  -- T2 chờ lock trên id=101 do T1 giữ
2026-04-05 14:22:10.602 +07 [12346] ERROR:  deadlock detected
2026-04-05 14:22:10.602 +07 [12346] DETAIL:  Process 12346 waits for ShareLock on transaction 12345; blocked by process 12345.
2026-04-05 14:22:10.602 +07 [12346] DETAIL:  Process 12345 waits for ShareLock on transaction 12346; blocked by process 12346.
2026-04-05 14:22:10.602 +07 [12346] HINT:  See server log for wait events.
2026-04-05 14:22:10.602 +07 [12346] CONTEXT:  SQL statement "UPDATE accounts SET balance = balance - 100000 WHERE id = 101"
2026-04-05 14:22:10.602 +07 [12346] ERROR:  canceling statement due to deadlock

-- T1 (pid 12345) cập nhật id=101 trước, sau đó chờ id=102.
-- T2 (pid 12346) cập nhật id=102 trước, sau đó chờ id=101.
-- Chu kỳ chờ: T1 → id=102 (do T2 giữ), T2 → id=101 (do T1 giữ) => deadlock.
-- PostgreSQL hủy transaction T2 (SQLState 40P01), rollback các thay đổi của T2.`,
      },
    ],
    questions: [
      'Vì sao hai transaction cập nhật các dòng khác nhau (id=101 và id=102) lại deadlock? Giải thích bằng thứ tự khóa trong log.',
      'Chính xác transaction nào bị hủy và tại sao PostgreSQL chọn transaction đó (không phải transaction nào chạy trước)?',
      'Sửa code Java sao cho hai transaction không bao giờ deadlock, kể cả khi nhiều luồng cùng chạy chuyển tiền ngược chiều?',
    ],
    hints: [
      'Deadlock xảy ra vì T1 giữ lock id=101 rồi chờ id=102, còn T2 giữ lock id=102 rồi chờ id=101 — tạo thành chu kỳ chờ cyclic. Thứ tự khóa không nhất quán giữa các transaction.',
      'PostgreSQL chọn hủy transaction thực hiện câu lệnh gây deadlock (câu lệnh thứ hai trong chu kỳ chờ), không phải transaction bắt đầu trước. Đây là hành vi mặc định của deadlock detector.',
      'Sửa bằng cách tất cả transaction luôn cập nhật các tài khoản theo thứ tự id tăng dần (hoặc giảm dần), sau đó mới thực hiện các thao tác khác. Nếu thứ tự không biết trước, dùng advisory lock hoặc SERIALIZABLE với retry.',
    ],
    answer: `**Tóm tắt:** Hai transaction T1 và T2 cùng cập nhật hai tài khoản {{id=101}} và {{id=102}} nhưng theo thứ tự ngược nhau: T1 khóa 101 rồi đến 102, T2 khóa 102 rồi đến 101. PostgreSQL dùng row-level lock (FOR UPDATE ngầm qua UPDATE) và giữ lock đến hết transaction. T1 giữ lock id=101 và chờ id=102; T2 giữ lock id=102 và chờ id=101 → chu kỳ chờ → PostgreSQL phát hiện deadlock, hủy transaction T2 (SQLState 40P01), rollback các thay đổi của T2.

### Nguyên nhân gốc
1. Mỗi UPDATE trên bảng {{accounts}} với điều kiện {{WHERE id = ?}} tự động khóa dòng tương ứng (row-level exclusive lock), giữ cho đến khi COMMIT/ROLLBACK.
2. T1 (pid 12345) thực hiện UPDATE id=101 trước, giữ lock đó, sau đó Thực hiện UPDATE id=102 — nhưng id=102 đang bị T2 giữ.
3. T2 (pid 12346) thực hiện UPDATE id=102 trước, giữ lock đó, sau đó Thực hiện UPDATE id=101 — nhưng id=101 đang bị T1 giữ.
4. T1 và T2 tạo thành chu kỳ chờ (wait-for cycle): T1 chờ T2, T2 chờ T1. Deadlock detector PostgreSQL phát hiện chu kỳ này và chọn hủy một transaction (ở đây T2) để phá chu kỳ.
5. Việc hai transaction cập nhật các dòng "khác nhau" không ngăn deadlock vì vấn đề không nằm ở dữ liệu mà nằm ở **thứ tự lấy khóa**.

### Dẫn chứng
- Artifact 2 (postgres-deadlock.log): T1 (pid 12345) UPDATE id=101 ở 14:22:10.124, rồi UPDATE id=102 ở 14:22:10.600 (bị chờ). T2 (pid 12346) UPDATE id=102 ở 14:22:10.501, rồi UPDATE id=101 ở 14:22:10.601 (bị chờ).
- Dòng "Process 12346 waits for ShareLock on transaction 12345; blocked by process 12345" và ngược lại "Process 12345 waits for ShareLock on transaction 12346" chứng minh chu kỳ chờ hai chiều.
- Lỗi "deadlock detected" và "canceling statement due to deadlock" ở pid 12346 → PostgreSQL hủy T2.

### Cách sửa
**Cách 1 (khuyên dùng): Luôn khóa theo thứ tự id tăng dần.**
Trước khi cập nhật, sắp xếp các id tài khoản tăng dần, sau đó cập nhật theo thứ tự đó. Ví dụ chuyển tiền từ A sang B:
~~~java
if (fromId < toId) {
    update(fromId);
    update(toId);
} else {
    update(toId);
    update(fromId);
}
~~~
Với T1 và T2 cùng cập nhật 101 và 102, cả hai sẽ cập nhật 101 trước rồi 102 → không còn chu kỳ chờ → không deadlock.

**Cách 2: Dùng advisory lock (khi thứ tự id không thực tế).**
Lấy advisory lock trên một khóa đại diện (min(id1, id2)) trước khi cập nhật, đảm bảo chỉ một transaction xử lý cặp tài khoản đó tại một thời điểm.

**Cách 3: SERIALIZABLE isolation + retry.**
Đặt isolation level SERIALIZABLE, bắt lỗi serialization/deadlock (40001, 40P01), retry toàn bộ transaction. Tốn chi phí hơn cách 1.

### Phòng ngừa
- Code review: mọi transaction cập nhật nhiều dòng phải sắp xếp khóa theo thứ tự cố định (id tăng dần).
- Thêm metric deadlock count (pg_stat_database.deadlocks) và cảnh báo khi > 0.
- Luôn giữ transaction ngắn: chỉ thao tác DB trong transaction, tính toán và gọi service ngoài transaction.
- Viết lại idempotent: retry an toàn nếu deadlock xảy ra (có unique constraint hoặc kiểm tra trạng thái).
> Senior tip: Deadlock không phải do "hai transaction chạm cùng một dòng" mà do **thứ tự khóa không nhất quán**. Quy tắc vàng: sắp xếp tất cả khóa theo thứ tự cố định trước khi lock. Điều này áp dụng cho tất cả CSDL quan hệ (MySQL InnoDB, PostgreSQL, SQL Server...), không chỉ PostgreSQL.`,
    rubric: [
      'Chỉ đúng nguyên nhân gốc: thứ tự cập nhật id không nhất quán (T1: 101→102, T2: 102→101) tạo chu kỳ chờ, không phải do dữ liệu giao nhau',
      'Dẫn chứng đúng từ log: pid 12345 cập nhật 101 rồi chờ 102, pid 12346 cập nhật 102 rồi chờ 101; dòng deadlock detected và canceling statement',
      'Giải thích đúng transaction bị hủy: PostgreSQL hủy transaction thực hiện câu lệnh gây deadlock (T2), không phải transaction bắt đầu trước',
      'Sửa đúng: sắp xếp id tăng dần trước khi cập nhật (hoặc advisory lock / SERIALIZABLE + retry), áp dụng cho cả hai chiều chuyển tiền',
      'Có phòng ngừa: metric deadlocks, transaction ngắn, idempotent retry, quy tắc code review',
    ],
    tags: ['postgresql', 'deadlock', 'row-lock', 'transaction', 'lock-ordering', 'concurrency'],
  },
  {
    id: 'lab-sql-038',
    category: 'sql',
    title: 'Báo cáo chậm vì thống kê cũ: planner ước lượng 120 dòng, thực tế 1.800.000, chọn Nested Loop',
    level: 'senior',
    scenario: `**Bối cảnh.** Công ty thương mại điện tử **AnKhánh** vận hành service {{report-svc}} (Spring Boot 3.3, JdbcTemplate, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB). Bảng {{shipment_line}} là bảng **append-only** (mỗi dòng vận đơn chỉ INSERT một lần, không UPDATE, không DELETE): sau 4 năm đã có **20.004.118 dòng** (~6,1 GB heap + 2,3 GB index). Mỗi khi một đối tác mới kết nối, dữ liệu của họ được nạp dần vào bảng.

**Triệu chứng (14/10/2026, 06:05).** Báo cáo "Đơn đã điều phối theo kho" cho DC mới {{warehouse_id = 9}} (mới go-live 01/09) chạy **72 giây**, trong khi cùng loại báo cáo cho các DC cũ chỉ khoảng **1,5 giây**. {{pg_stat_activity}} cho thấy 1 core RDS chạy 100% suốt 70 giây, CPU toàn instance chỉ ~12%. Đội đã thử tăng {{work_mem}}, tăng connection, tạo read-replica — không giảm.

**Điều đã thử mà không ăn.** DBA nghi "thiếu index" nên tạo thêm index trên {{status}} — vẫn chậm. Một bạn đề xuất "tăng {{work_mem}}", một bạn đề xuất "ép {{enable_nestloop = off}}".

**Việc bạn có.** Ba artifact dưới đây lấy từ production: EXPLAIN ANALYZE lúc 06:05, EXPLAIN sau khi DBA chạy tay ANALYZE lúc 08:30, và snapshot thống kê. Hãy tìm vì sao planner chọn Nested Loop, vì sao chạy ANALYZE lại nhanh, và vì sao thống kê lại cũ tới 3 tháng.`,
    artifacts: [
      {
        name: 'explain-report-0605.txt',
        lang: 'text',
        content: `-- psql 15.6, RDS ankhanh-primary, 2026-10-14 06:05:41 +07
-- auto_explain: log_min_duration=500ms, log_analyze=on, log_buffers=on
ankhanh=# EXPLAIN (ANALYZE, BUFFERS)
SELECT l.id, l.sku, l.qty, w.name
FROM shipment_line l
JOIN warehouse w ON w.id = l.warehouse_id
WHERE l.warehouse_id = 9
  AND l.status = 'ALLOCATED'
  AND l.created_at >= '2026-09-01';
                                                         QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------
 Nested Loop  (cost=0.72..184512.44 rows=120 width=52) (actual time=0.061..71923.552 rows=1800000 loops=1)
   Buffers: shared hit=14388201 read=2144
   ->  Index Scan using idx_shipment_line_wh_status on shipment_line l  (cost=0.57..183902.10 rows=120 width=44) (actual time=0.042..2410.887 rows=1800000 loops=1)
         Index Cond: ((warehouse_id = 9) AND ((status)::text = 'ALLOCATED'::text) AND (created_at >= '2026-09-01'::timestamp with time zone))
         Buffers: shared hit=38421 read=1987
   ->  Seq Scan on warehouse w  (cost=0.00..4.62 rows=462 width=16) (actual time=0.001..0.038 rows=1 loops=1800000)
         Filter: (w.id = l.warehouse_id)
         Rows Removed by Filter: 461
         Buffers: shared hit=14349780
 Planning Time: 0.612 ms
 Execution Time: 71925.104 ms
-- Ghi chú: rows=120 là ước lượng của planner; actual rows=1800000.
-- Seq Scan trên warehouse (bảng chiều 462 dòng) bị lặp 1.800.000 lần.`,
      },
      {
        name: 'explain-after-analyze-0830.txt',
        lang: 'text',
        content: `-- 2026-10-14 08:30:12 +07, sau khi DBA chạy tay: ANALYZE shipment_line;
ankhanh=# EXPLAIN (ANALYZE, BUFFERS)
SELECT l.id, l.sku, l.qty, w.name
FROM shipment_line l
JOIN warehouse w ON w.id = l.warehouse_id
WHERE l.warehouse_id = 9
  AND l.status = 'ALLOCATED'
  AND l.created_at >= '2026-09-01';
                                                         QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------
 Hash Join  (cost=68.21..421883.10 rows=1798422 width=52) (actual time=1.104..1983.442 rows=1800000 loops=1)
   Hash Cond: (l.warehouse_id = w.id)
   Buffers: shared hit=38421 read=1987
   ->  Index Scan using idx_shipment_line_wh_status on shipment_line l  (cost=0.57..401887.32 rows=1798422 width=44) (actual time=0.041..1840.229 rows=1800000 loops=1)
         Index Cond: ((warehouse_id = 9) AND ((status)::text = 'ALLOCATED'::text) AND (created_at >= '2026-09-01'::timestamp with time zone))
         Buffers: shared hit=38421 read=1987
   ->  Hash  (cost=4.62..4.62 rows=462 width=16) (actual time=0.221..0.221 rows=462 loops=1)
         Buckets: 1024  Batches: 1  Memory Usage: 29kB
         ->  Seq Scan on warehouse w  (cost=0.00..4.62 rows=462 width=16) (actual time=0.006..0.204 rows=462 loops=1)
               Buffers: shared hit=8
 Planning Time: 0.588 ms
 Execution Time: 1985.610 ms
-- rows ước lượng 1.798.422, thực tế 1.800.000 (lệch < 1%).`,
      },
      {
        name: 'stats-snapshot.txt',
        lang: 'text',
        content: `-- snapshot 2026-10-14 08:31 +07
ankhanh=# SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze
           FROM pg_stat_user_tables WHERE relname = 'shipment_line';
    relname    | n_live_tup | n_mod_since_analyze | last_analyze |       last_autoanalyze
---------------+------------+---------------------+--------------+-------------------------------
 shipment_line |   20004118 |             1890442 |              | 2026-07-16 03:12:44.812+07

-- Ngưỡng autoanalyze mặc định (thống kê toàn cục):
ankhanh=# SHOW autovacuum_analyze_scale_factor;   -- 0.1
ankhanh=# SHOW autovacuum_analyze_threshold;      -- 50
-- Ngưỡng = 50 + 0.1 x 20.004.118 = 2.000.462 thay đổi
-- Hiện tại 1.890.442 < 2.000.462  =>  autoanalyze CHUA kip kich hoat

-- 43 ngày DC 9 go-live (01/09 -> 14/10) đã nạp ~1.800.000 dòng,
-- nhưng tổng thay đổi 3 tháng mới 1.890.442 => chưa chạm ngưỡng 10%.

ankhanh=# SELECT attname, n_distinct FROM pg_stats
           WHERE tablename='shipment_line' AND attname IN ('warehouse_id','status');
   attname    | n_distinct
--------------+------------
 warehouse_id |         12
 status       |          4

ankhanh=# SELECT most_common_vals FROM pg_stats
           WHERE tablename='shipment_line' AND attname='warehouse_id';
 most_common_vals
-------------------
 {1,2,3,4,5,6,7,8,10,11,12}   -- KHONG co 9 (kho moi, thong ke chup 16/07)

ankhanh=# ALTER TABLE shipment_line SET (autovacuum_analyze_scale_factor = 0.005);
ALTER TABLE`,
      },
    ],
    questions: [
      'Vì sao cùng bảng, cùng index, cùng câu query mà lúc 06:05 planner chọn Nested Loop còn sau ANALYZE lại chọn Hash Join? Chỉ ra con số ước lượng sai trong plan.',
      'Con số 120 dòng đến từ đâu, và vì sao thống kê lại cũ tới 3 tháng dù autovacuum vẫn bật? Giải thích vai trò của autovacuum_analyze_scale_factor.',
      'Bạn sửa thế nào cho báo cáo của DC mới (và mọi DC sau này) luôn nhanh? Đánh giá hai đề xuất tăng work_mem và ép enable_nestloop = off.',
    ],
    hints: [
      'So sánh rows=120 (ước lượng) với actual rows=1800000 ở node Index Scan, rồi nhìn loops=1800000 ở Seq Scan on warehouse.',
      'Trong snapshot: last_autoanalyze = 16/07, n_mod_since_analyze = 1.890.442, ngưỡng 50 + 0,1 x 20.004.118 = 2.000.462. Con số nào quyết định autoanalyze chưa chạy?',
      'Nguyên nhân gốc: bảng append-only 20 triệu dòng, DC mới go-live chỉ chiếm 1,8 triệu thay đổi, chưa chạm ngưỡng 10% nên thống kê đứng yên 3 tháng. Lower scale_factor theo bảng + ANALYZE tường minh + partition theo thời gian là hướng sửa.',
    ],
    answer: `**Tóm tắt:** Planner chọn **Nested Loop** vì thống kê của bảng {{shipment_line}} đã cũ 3 tháng: trong đó {{warehouse_id = 9}} chưa tồn tại, nên nó ước lượng chỉ **120 dòng** và cho rằng "quét bảng chiều {{warehouse}} 462 dòng một lần cho 120 dòng là rẻ". Thực tế có **1.800.000 dòng** của DC 9, nên Seq Scan trên {{warehouse}} bị lặp 1,8 triệu lần. Nguyên nhân gốc là {{autovacuum_analyze_scale_factor = 0.1}}: ngưỡng autoanalyze là 50 + 0,1 × 20.004.118 ≈ **2.000.462** thay đổi, trong khi 3 tháng qua chỉ có 1.890.442 thay đổi — chưa chạm ngưỡng nên autoanalyze chưa chạy dù vẫn bật. Sửa: {{ANALYZE}} tường minh + hạ {{autovacuum_analyze_scale_factor}} cho bảng + partition theo thời gian + extended statistics.

### Kiến thức nền: planner "đoán" số dòng như thế nào
PostgreSQL không đếm dữ liệu trước khi chạy. Nó là **cost-based optimizer**: với mỗi plan (Nested Loop, Hash Join, Merge Join), nó ước lượng **số dòng** của từng bước rồi chọn plan có chi phí thấp nhất. Số dòng dự kiến lấy từ bảng thống kê {{pg_statistic}} (xem qua {{pg_stats}}), do {{ANALYZE}} (hoặc autoanalyze) tạo ra bằng cách **lấy mẫu** 300 × {{default_statistics_target}} = 30.000 dòng.

Ví dụ đời thường: bạn nhớ "tuần trước nhà 4 người ăn" nên mua 1 kg thịt. Hôm nay có 30 khách mà bạn không cập nhật, bạn vẫn mua 1 kg — plan đúng với dữ liệu cũ, thảm hoạ với dữ liệu mới.

Các thống kê chính:
| Thống kê | Ý nghĩa |
|---|---|
| {{reltuples}} | tổng số dòng ước lượng |
| {{most_common_vals/freqs}} (MCV) | giá trị phổ biến và tần suất (dùng cho {{=}}) |
| {{histogram_bounds}} | phân bố các giá trị còn lại (dùng cho {{<}}, {{>}}) |
| {{n_distinct}} | số giá trị khác nhau |

### Nguyên nhân gốc, từng bước
1. **16/07** autoanalyze chạy lần cuối. Lúc đó DC 9 chưa go-live nên {{warehouse_id = 9}} không có trong MCV, gần như 0 dòng.
2. **01/09** DC 9 go-live, dữ liệu nạp dần. Đến **14/10** đã có **1.800.000** dòng của warehouse 9, nhưng tổng thay đổi 3 tháng chỉ **1.890.442**.
3. Ngưỡng autoanalyze = {{autovacuum_analyze_threshold + autovacuum_analyze_scale_factor × reltuples}} = 50 + 0,1 × 20.004.118 = **2.000.462**. Vì 1.890.442 < 2.000.462, **autoanalyze chưa kích hoạt** dù autovacuum vẫn bật.
4. Thống kê vẫn là của 16/07: planner "thấy" warehouse 9 gần như không có, kết hợp selectivity nhỏ của {{status = 'ALLOCATED'}} và {{created_at >= '2026-09-01'}} (ngoài histogram cũ) → ước lượng **120 dòng**.
5. Với "120 dòng" ở vòng ngoài, Nested Loop là rẻ nhất: quét {{warehouse}} (462 dòng, 8 page) một lần rồi so sánh. Ước lượng cả câu chỉ **184.512**.
6. Thực tế vòng ngoài trả **1.800.000** dòng → Seq Scan {{warehouse}} chạy **1.800.000 lần**. 1,8 triệu × 8 page ≈ 14,4 triệu buffer → 72 giây, một core RDS 100%.

~~~text
Nested Loop (thống kê cũ)                 Hash Join (sau ANALYZE)
for l in shipment_line(1.800.000):         h = hash(warehouse)  -- 462 dòng, 1 lần
   for w in warehouse(462):                  for l in shipment_line(1.800.000):
      if match: emit                            w = h.get(l.warehouse_id)
=> 1,8 triệu lần Seq Scan, 72 s            => 1,8 triệu lần tra hash, 2,0 s
~~~

### Dẫn chứng
- Artifact 1: **"Nested Loop (cost=0.72..184512.44 rows=120 ...) (actual ... rows=1800000 ...)"** — ước lượng 120, thực tế 1,8 triệu; **"Seq Scan on warehouse w ... loops=1800000"** và **"Rows Removed by Filter: 461"** lặp 1,8 triệu lần; **"Buffers: shared hit=14349780"**; **"Execution Time: 71925.104 ms"**.
- Artifact 2: sau ANALYZE, **"Hash Join ... rows=1798422 ... (actual ... rows=1800000)"**, Seq Scan warehouse **loops=1**, **"Execution Time: 1985.610 ms"** — nhanh ~36 lần.
- Artifact 3: {{last_autoanalyze = 2026-07-16}}, {{n_mod_since_analyze = 1890442}}, ngưỡng **2.000.462**; MCV của {{warehouse_id}} là **{1,2,3,4,5,6,7,8,10,11,12}** — **không có 9**.

### Cách sửa ngắn hạn (tức thì)
- {{ANALYZE shipment_line;}} — chỉ lấy mẫu 30.000 dòng, mất vài giây, đưa thống kê về hiện tại. Sau đó câu chuyển sang Hash Join (artifact 2).
- Đặt {{statement_timeout}} cho role báo cáo (ví dụ 120 giây) để một plan xấu không chiếm DB 72 giây; job retry sau khi ANALYZE.

### Cách sửa dài hạn
1. **Hạ ngưỡng autoanalyze cho bảng này:** {{ALTER TABLE shipment_line SET (autovacuum_analyze_scale_factor = 0.005);}} → ngưỡng còn 50 + 0,005 × 20.004.118 ≈ 100.000 thay đổi, autoanalyze chạy thường xuyên hơn nhiều. Với bảng append-only lớn, đây là chỉnh quan trọng nhất.
2. **Partition theo thời gian** (theo tháng, RANGE trên {{created_at}}): mỗi partition nhỏ (vài trăm nghìn đến 1–2 triệu dòng) nên ngưỡng autoanalyze theo **từng partition** nhỏ hơn nhiều; nạp xong một partition mới thì ANALYZE riêng partition đó. Đây cũng là cách tốt nhất cho bảng append-only.
3. **ANALYZE tường minh** sau mỗi mẻ nạp lớn (tương tự lab bulk load).
4. **Extended statistics** khi các cột tương quan: {{CREATE STATISTICS shipment_line_wh_status (dependencies) ON warehouse_id, status FROM shipment_line;}} rồi ANALYZE — vì warehouse 9 gần như toàn ALLOCATED, hai cột này **không độc lập**.
5. **Index phù hợp** đã có {{idx_shipment_line_wh_status}} — vấn đề không phải thiếu index mà là **ước lượng sai** khiến planner không dùng Hash Join.

**Về hai đề xuất:**
- **Tăng work_mem:** vô ích — Hash Join chỉ cần vài chục kB (bảng chiều 462 dòng), không spill. Vấn đề là ước lượng, không phải bộ nhớ.
- **Ép {{enable_nestloop = off}}:** chữa triệu chứng, ảnh hưởng toàn instance, và vẫn không sửa gốc. Khi warehouse 9 nhỏ hơn hoặc query đổi, plan có thể lại sai.

### Phòng ngừa và monitoring
- Cảnh báo khi {{n_mod_since_analyze}} tiến gần ngưỡng: {{n_mod_since_analyze > 0.8 × (threshold + scale_factor × reltuples)}}.
- Cảnh báo {{last_autoanalyze}} cũ hơn N ngày trên bảng lớn; theo dõi {{pg_stat_user_tables}}.
- Bật {{auto_explain}} ({{log_analyze}}, {{log_buffers}}) và soi tỉ lệ **rows thực tế / rows ước lượng** > 10 lần ở mọi node — dấu hiệu plan xấu.
- Test hiệu năng với dữ liệu tỉ lệ production (DC mới, warehouse lệch).

### Trả lời mẫu khi phỏng vấn
"Plan lúc 06:05 là Nested Loop với ước lượng 120 dòng nhưng thực tế 1,8 triệu, nên Seq Scan bảng warehouse bị lặp 1,8 triệu lần, 72 giây. Ước lượng sai vì thống kê cũ 3 tháng: warehouse 9 chưa có trong MCV. Autoanalyze chưa chạy vì bảng 20 triệu dòng với scale_factor mặc định 0,1 cần 2 triệu thay đổi, mà 3 tháng mới có 1,89 triệu. Tôi chạy ANALYZE để chữa cháy, hạ scale_factor xuống 0,005 cho bảng append-only, partition theo tháng để autoanalyze theo từng partition nhỏ, thêm ANALYZE sau mỗi mẻ nạp và extended statistics cho cặp warehouse_id/status vì chúng tương quan. Tăng work_mem hay tắt nestloop không giải quyết gốc."

> Senior tip: "Báo cáo của khách mới chậm, khách cũ nhanh" gần như luôn là **thống kê chưa kịp phản ánh dữ liệu mới**. Với bảng append-only lớn, scale_factor mặc định 0,1 khiến autoanalyze chạy thưa; hãy hạ theo bảng hoặc partition theo thời gian. Và khi đọc EXPLAIN ANALYZE, việc đầu tiên là tìm node có **rows ước lượng lệch thực tế nhiều bậc** — gần như mọi plan tệ bắt nguồn từ đó, không phải từ "thiếu index".`,
    rubric: [
      'Chỉ đúng ước lượng sai: rows=120 so với actual rows=1800000 ở Index Scan khiến planner chọn Nested Loop, Seq Scan warehouse chạy 1.800.000 lần',
      'Giải thích đúng vì sao thống kê cũ 3 tháng: DC 9 chưa có trong MCV, last_autoanalyze 16/07, n_mod_since_analyze 1.890.442 < ngưỡng 50 + 0,1 x 20.004.118 = 2.000.462 nên autoanalyze chưa kích hoạt dù vẫn bật',
      'Giải thích vì sao sau ANALYZE lại nhanh (statistics mới -> Hash Join, Seq Scan loops=1, ~2 giây) và vì sao estimates vẫn có thể lệch (cột tương quan -> extended statistics)',
      'Đề xuất sửa đúng: ANALYZE tường minh, hạ autovacuum_analyze_scale_factor cho bảng, partition theo thời gian + ANALYZE partition mới, extended statistics, statement_timeout cho role báo cáo',
      'Phản biện đúng work_mem (Hash không spill) và enable_nestloop (chữa triệu chứng); nêu monitoring n_mod_since_analyze/last_autoanalyze và auto_explain tỉ lệ estimate vs actual',
    ],
    tags: ['postgresql', 'explain', 'statistics', 'analyze', 'autovacuum', 'nested-loop', 'scale-factor'],
  },
  {
    id: 'lab-sql-039',
    category: 'sql',
    title: 'Bảng phình to, query chậm dần vì một transaction export mở 6 giờ giữ xmin horizon',
    level: 'senior',
    scenario: `**Bối cảnh.** Sàn thương mại điện tử **VinaShop** chạy {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 32 GB RAM). Bảng {{orders}} là bảng OLTP nóng: mỗi đơn được UPDATE nhiều lần (PENDING -> PAID -> SHIPPED...), khoảng 1.100 giao dịch/giây. Sau 2 năm bảng có **9.214.330 dòng** (~3,1 GB heap khi khoẻ, 2,0 GB index).

**Triệu chứng (14/05/2026).** Trong 2 tuần, p95 của các câu {{SELECT ... FROM orders WHERE id = $1}} tăng từ **6 ms** lên **128 ms**, CPU RDS leo từ 22% lên 61%, dung lượng đĩa tăng ~180 MB/ngày dù traffic không đổi. DBA nghi "thiếu index" và tạo thêm index — p95 vẫn không giảm. Điểm lạ: plan không đổi, cùng index, nhưng số page đọc tăng gấp đôi.

**Điều đã thử.** Tạo thêm index, tăng {{work_mem}}, restart read-replica — không ăn. Một bạn đề xuất {{VACUUM FULL}} ngay trong giờ cao điểm.

**Việc bạn có.** Ba artifact: snapshot {{pg_stat_activity}} lúc 14:10, thống kê {{pg_stat_user_tables}} của {{orders}}, và log của service export. Hãy chỉ ra vì sao autovacuum không dọn được dead tuple, vì sao bảng phình làm query chậm, và đề xuất cách sửa.`,
    artifacts: [
      {
        name: 'pg-stat-activity.txt',
        lang: 'text',
        content: `-- 2026-05-14 14:10:00 +07, RDS vinashop-primary (PostgreSQL 15.6)
shop=# SELECT pid, application_name, state, now() - xact_start AS xact_age,
       wait_event_type, wait_event, age(backend_xmin) AS xmin_age, left(query, 50) AS query
FROM pg_stat_activity
WHERE backend_xmin IS NOT NULL
ORDER BY xact_start
LIMIT 5;
  pid  | application_name |        state        |    xact_age     | wait_event_type |  wait_event  |  xmin_age  |                       query
-------+------------------+---------------------+-----------------+-----------------+--------------+------------+---------------------------------------------------
 23119 | report-export    | idle in transaction | 05:59:48        | Client          | ClientRead   |   43260112 | DECLARE csr NO SCROLL CURSOR FOR SELECT ... FR
 23087 | order-service    | active              | 00:00:00.412    |                 |              |   43260044 | UPDATE orders SET status = $1 WHERE id = $2
 23091 | order-service    | active              | 00:00:00.377    |                 |              |   43259980 | SELECT id, status FROM orders WHERE id = $1
-- Ghi chu: 23119 la phien export, idle in transaction gan 6 gio, giu backend_xmin cu.
-- age(backend_xmin) = 43.260.112 giao dich: khoang 6 gio x ~2.000 giao dich/giay.

shop=# SELECT state, wait_event_type, count(*) FROM pg_stat_activity
WHERE datname = 'shop' AND backend_type = 'client backend' GROUP BY 1, 2 ORDER BY 3 DESC;
        state        | wait_event_type | count
---------------------+-----------------+-------
 active              |                 |    41
 idle in transaction | Client          |     1
 idle                | Client          |    12
(3 rows)`,
      },
      {
        name: 'pg-stat-user-tables.txt',
        lang: 'text',
        content: `-- 2026-05-14 14:10:30 +07
shop=# SELECT relname, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum, autovacuum_count
FROM pg_stat_user_tables WHERE relname = 'orders';
  relname | n_live_tup | n_dead_tup | last_vacuum |       last_autovacuum        | autovacuum_count
----------+------------+------------+-------------+------------------------------+------------------
  orders  |    9214330 |    4127004 |             | 2026-05-14 14:04:33.104+07 |              312

-- n_dead_tup / n_live_tup = 4.127.004 / 9.214.330 = 44.8%
-- last_autovacuum = 14:04 (6 phut truoc) => autovacuum VAN chay deu,
-- nhung khong xoa duoc dead tuple moi hon snapshot cua phien 23119.

shop=# SELECT pg_size_pretty(pg_relation_size('orders')) AS heap,
       pg_size_pretty(pg_total_relation_size('orders')) AS total;
  heap  | total
--------+-------
 5.4 GB | 7.6 GB
-- 2 tuan truoc (05/01): heap 3.1 GB, total 5.3 GB

shop=# SELECT relname, age(relfrozenxid) AS xid_age
FROM pg_class WHERE relname = 'orders';
  relname | xid_age
----------+---------
  orders  |  118420334
-- age(relfrozenxid) ~118 trieu, duoi autovacuum_freeze_max_age (200 trieu)
-- => day KHONG phai wraparound, van de la xmin horizon bi giu.

-- Prometheus: p95 uri="/api/orders/{id}"
-- 2026-05-01: 6 ms
-- 2026-05-14: 128 ms`,
      },
      {
        name: 'export-service.log',
        lang: 'text',
        content: `2026-05-14 08:10:12.114 INFO  [export-thread-1] c.v.r.ExportJob     : START export warehouseId=9 format=csv target=s3://vina-export/2026-05-14/wh9.csv
2026-05-14 08:10:12.402 DEBUG [export-thread-1] org.mybatis.logging.jdbc.ConnectionLogger : ==>  Preparing: SET TRANSACTION ISOLATION LEVEL REPEATABLE READ
2026-05-14 08:10:12.455 DEBUG [export-thread-1] org.mybatis.logging.jdbc.ConnectionLogger : ==>  Preparing: DECLARE csr NO SCROLL CURSOR FOR SELECT id, status, amount, created_at FROM orders WHERE warehouse_id = ? ORDER BY id
2026-05-14 08:10:12.470 DEBUG [export-thread-1] org.mybatis.logging.jdbc.ConnectionLogger : ==> Parameters: 9
2026-05-14 08:10:13.001 INFO  [export-thread-1] c.v.r.ExportJob     : fetched 1000 rows, streaming to s3 (slow consumer)
2026-05-14 13:58:40.552 WARN  [export-thread-1] c.v.r.ExportJob     : still exporting after 5h48m, fetched 812000 rows, downstream consumer slow
2026-05-14 14:10:05.118 WARN  [export-thread-1] c.v.r.ExportJob     : export stalled ~6h, transaction STILL OPEN (REPEATABLE READ + cursor)
-- Ghi chu: phien export mo transaction REPEATABLE READ roi khai bao cursor,
-- sau do bi ket khi ghi ra S3 cham. Trong luc cho ghi S3, phien o trang thai
-- "idle in transaction" nhung van giu snapshot (backend_xmin) cua luc 08:10.`,
      },
    ],
    questions: [
      'Vì sao autovacuum chạy đều (last_autovacuum = 14:04) mà n_dead_tup vẫn 4,1 triệu và bảng vẫn phình? Dẫn chứng từ artifact.',
      'Vì sao một transaction export mở 6 giờ lại làm chậm các câu SELECT theo id dù plan không đổi? Giải thích cơ chế xmin horizon / snapshot.',
      'Bạn xử lý thế nào trong ngày, và sửa code ra sao để không tái diễn? Vì sao đây không phải lỗi autovacuum bị lock?',
    ],
    hints: [
      'Tìm phiên có state = "idle in transaction" trong pg_stat_activity: pid 23119, xact_age ~6 giờ, wait_event = ClientRead (server chờ ứng dụng, không chờ lock).',
      'age(backend_xmin) = 43.260.112 cho thấy snapshot của phiên này đang giữ chân trời xmin ở 6 giờ trước; mọi dead tuple mới hơn đều "cần" cho snapshot đó nên vacuum không xoá được.',
      'Phân biệt: autovacuum KHÔNG bị lock (last_autovacuum vẫn 14:04), mà bị chặn bởi xmin horizon. Sửa: idle_in_transaction_session_timeout, và dùng COPY TO STDOUT thay vì giữ transaction + cursor qua I/O mạng.',
    ],
    answer: `**Tóm tắt:** Một phiên {{report-export}} mở transaction **REPEATABLE READ** rồi khai báo cursor để export, nhưng bị kẹt gần **6 giờ** khi ghi kết quả ra S3 chậm → trạng thái **idle in transaction**. Transaction này giữ {{backend_xmin}} (snapshot tại 08:10), nên autovacuum chạy đều nhưng **không thể xoá dead tuple mới hơn snapshot** → {{n_dead_tup}} leo lên **4.127.004** (44,8%), bảng phình từ 3,1 GB lên 5,4 GB → cùng plan nhưng đọc nhiều page hơn → p95 tăng từ 6 ms lên 128 ms. Đây **không phải** autovacuum bị lock (nó vẫn chạy) mà là **xmin horizon** bị giữ bởi một snapshot cũ.

### Kiến thức nền: xmin horizon và dead tuple
PostgreSQL dùng **MVCC** (đa phiên bản): mỗi câu UPDATE tạo ra một **phiên bản mới** của dòng và biến bản cũ thành **dead tuple**. Dead tuple không xoá ngay vì các transaction đang chạy có thể vẫn cần đọc bản cũ (để đọc được ảnh chụp nhất quán tại thời điểm transaction của họ bắt đầu).

Mỗi transaction có một **snapshot** = một {{xmin}} (xid nhỏ nhất mà nó còn có thể nhìn thấy thay đổi). **xmin horizon** = xmin nhỏ nhất trong toàn bộ các transaction đang chạy. Autovacuum chỉ được xoá dead tuple **cũ hơn** mọi snapshot đang tồn tại — tức cũ hơn xmin horizon. Nếu một transaction giữ xmin rất cũ, dead tuple mới hơn không xoá được.

Ví dụ đời thường: cả nhà cùng xem một album ảnh chụp 6 tháng trước. Bạn muốn bỏ ảnh cũ, nhưng vì còn người đang xem cuốn album đó, bạn phải giữ lại. Khi người cuối cùng gấp album, bạn mới dọn được. Phiên export 6 giờ chính là "người đang giữ cuốn album".

### Nguyên nhân gốc, từng bước
1. **08:10:12** phiên {{report-export}} (pid 23119) chạy {{SET TRANSACTION ISOLATION LEVEL REPEATABLE READ}} rồi {{DECLARE ... CURSOR}}. Từ giây phút này, nó giữ một snapshot ({{backend_xmin = 774120000}}).
2. Sau câu khai báo cursor, ứng dụng bắt đầu ghi kết quả ra S3. S3 chậm / nghẽn → thread ứng dụng **chờ I/O mạng**, không gửi lệnh mới cho DB.
3. Phiên DB trở thành **idle in transaction**: không chạy câu nào ({{wait_event_type = Client}}, {{wait_event = ClientRead}}) nhưng **transaction vẫn mở**, vẫn giữ snapshot. Đây là trạng thái nguy hiểm nhất vì nó **không tốn CPU**.
4. Trong 6 giờ, {{order-service}} vẫn UPDATE {{orders}} bình thường (1.100 giao dịch/giây) → sinh ra **hàng triệu dead tuple**.
5. Autovacuum chạy đều ({{last_autovacuum = 14:04}}, 312 lần), nhưng mọi dead tuple sinh sau 08:10 đều **mới hơn {{backend_xmin}}** của phiên 23119 → không xoá được. {{n_dead_tup}} leo lên 4,1 triệu.
6. Dead tuple chiếm chỗ trong heap → bảng phình từ 3,1 GB lên 5,4 GB. Cùng plan {{Index Scan}} nhưng phải đọc nhiều page hơn (index trỏ tới các dòng đã chết, phải theo con trỏ tới heap, thấy dead, bỏ qua) → p95 tăng gấp ~20 lần.

### Dẫn chứng
- Artifact 1: pid **23119**, {{application_name = report-export}}, {{state = idle in transaction}}, {{xact_age = 05:59:48}}, {{wait_event_type = Client}}, {{wait_event = ClientRead}}, {{age(backend_xmin) = 43.260.112}}. Phiên này không chờ lock — nó **im lặng giữ snapshot**.
- Artifact 2: {{n_dead_tup = 4.127.004}}, {{n_live_tup = 9.214.330}} (44,8%); {{last_autovacuum = 2026-05-14 14:04:33}} — autovacuum vẫn chạy, **không** phải "skipped because of lock conflict". {{pg_relation_size = 5.4 GB}} so với 3,1 GB hai tuần trước.
- Artifact 2: {{age(relfrozenxid) = 118.420.334}} < {{autovacuum_freeze_max_age}} (200 triệu) → **không phải wraparound**, loại trừ nhầm hướng "sắp wraparound".
- Artifact 3: {{SET TRANSACTION ISOLATION LEVEL REPEATABLE READ}}, {{DECLARE csr ... CURSOR}}, rồi {{export stalled ~6h, transaction STILL OPEN}} — chuỗi nhân quả trực tiếp.

### Cách sửa ngắn hạn (trong ngày)
- {{SELECT pg_terminate_backend(23119);}} — kết thúc phiên export treo; transaction bị rollback, snapshot được nhả. ({{pg_cancel_backend}} chỉ huỷ câu đang chạy, vô dụng với phiên đang idle.) Sau đó {{VACUUM (ANALYZE) orders;}} để dọn dead tuple; câu SELECT theo id nhanh lại.
- Nếu buộc phải thu hồi dung lượng về OS: {{VACUUM FULL orders}} — nhưng nó cần **AccessExclusiveLock** và downtime, chỉ chạy ngoài giờ cao điểm. Plain {{VACUUM}} trả chỗ cho chính bảng tái dùng, thường đủ.
- {{ALTER ROLE report_export SET idle_in_transaction_session_timeout = '5min';}} hoặc đổi parameter group ({{idle_in_transaction_session_timeout = 300000}}) để lần sau tự dọn phiên treo. Lưu ý: chỉ áp dụng cho connection **mới**, cần recycle pool.

### Cách sửa dài hạn (tầng code)
1. **Không giữ transaction qua I/O mạng.** Với export nhất quán, dùng {{COPY (SELECT ...) TO STDOUT}}: nó chạy trong **một câu duy nhất** với snapshot **tạm thời**, không bao giờ ở trạng thái idle in transaction. Đây là cách đúng nhất.
2. Nếu buộc dùng cursor: đặt {{idle_in_transaction_session_timeout}} + {{statement_timeout}} cho role export, và bọc export trong một transaction **có kiểm soát thời gian**; export từ **read-replica** để không ảnh hưởng primary.
3. **Không để transaction mở khi chờ I/O:** mọi lời gọi S3/HTTP/file phải nằm **ngoài** transaction. Nếu cần nhất quán, dùng hai pha: (a) lấy danh sách id trong transaction ngắn, (b) tải dữ liệu ngoài transaction theo lô.
4. **Tự dọn phiên treo:** job quét {{pg_stat_activity}} mỗi 30 giây, terminate các phiên {{idle in transaction}} quá 5 phút, kèm cảnh báo.
5. **Giảm bloat:** tune autovacuum ({{autovacuum_vacuum_scale_factor}} theo bảng), cân nhắc {{pg_repack}} (online, không downtime) thay cho {{VACUUM FULL}}.

### Vì sao đây KHÔNG phải "autovacuum bị lock"
- Nếu bị lock, log sẽ có {{automatic vacuum ... skipped because of lock conflict}} và {{last_autovacuum}} sẽ cũ. Ở đây {{last_autovacuum = 14:04}} (6 phút trước), autovacuum **vẫn chạy đều**.
- Nguyên nhân là **xmin horizon**: dead tuple không xoá được vì còn cần cho snapshot của phiên 23119, chứ không phải vì tranh chấp lock. Đây là khác biệt quan trọng so với bài "autovacuum bị lock" — cùng triệu chứng (bảng phình) nhưng cơ chế khác, cách sửa khác (không phải kill phiên giữ lock, mà kill phiên giữ snapshot).

### Phòng ngừa và monitoring
- Cảnh báo {{SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction'}} > 0, và {{age(backend_xmin)}} tăng nhanh.
- Cảnh báo {{n_dead_tup / n_live_tup > 0,2}} trên bảng nóng; theo dõi {{last_autovacuum}}.
- Cảnh báo {{age(relfrozenxid)}} tiến gần {{autovacuum_freeze_max_age}} (wraparound) — nhưng đó là vấn đề khác.
- Quy tắc review: **transaction không được chứa lời gọi mạng/đĩa**; export nhất quán dùng {{COPY ... TO STDOUT}}.

### Trả lời mẫu khi phỏng vấn
"Một phiên export mở transaction REPEATABLE READ và cursor, rồi kẹt 6 giờ khi ghi S3, ở trạng thái idle in transaction. Nó giữ backend_xmin tại 08:10 nên autovacuum dù chạy đều vẫn không xoá được dead tuple mới hơn snapshot; n_dead_tup lên 4,1 triệu (45%), bảng phình từ 3,1 lên 5,4 GB, p95 từ 6 lên 128 ms. Đây không phải autovacuum bị lock — last_autovacuum vẫn 14:04. Tôi terminate phiên treo rồi VACUUM, đặt idle_in_transaction_session_timeout, và sửa code dùng COPY TO STDOUT thay vì giữ transaction qua I/O mạng; theo dõi idle in transaction và n_dead_tup."

> Senior tip: "idle in transaction" là trạng thái nguy hiểm nhất của PostgreSQL vì nó **không tốn CPU** — DB có vẻ rảnh mà vẫn ì ạch, khiến team đi tìm sai chỗ (thêm CPU, thêm connection). Quy tắc: **CPU thấp + latency cao = blocking hoặc giữ snapshot**. Hãy nhìn {{pg_stat_activity.state}} và {{age(backend_xmin)}} trước khi đụng tới hiệu năng. Và bài học lớn: **transaction chỉ nên chứa SQL** — mọi lời gọi S3, HTTP, file đều phải nằm ngoài transaction.`,
    rubric: [
      'Chỉ đúng phiên gây bloat: pid 23119 idle in transaction ~6 giờ, wait_event ClientRead, giữ backend_xmin (age 43.260.112) nên autovacuum không xoá được dead tuple mới hơn snapshot',
      'Dẫn chứng đúng: n_dead_tup 4.127.004 / n_live_tup 9.214.330 (44,8%), last_autovacuum 14:04 (autovacuum vẫn chạy, không bị lock), heap 3.1->5.4 GB, p95 6->128 ms, age(relfrozenxid) 118M loại trừ wraparound',
      'Giải thích đúng cơ chế xmin horizon / MVCC: dead tuple cần cho snapshot đang chạy, một transaction giữ snapshot cũ chặn vacuum; và vì sao plan không đổi mà vẫn chậm (đọc nhiều page do bloat)',
      'Đề xuất sửa đúng: pg_terminate_backend phiên treo, VACUUM (FULL khi cần), idle_in_transaction_session_timeout, và sửa code dùng COPY TO STDOUT / không giữ transaction qua I/O',
      'Phân biệt rõ với autovacuum bị lock (last_autovacuum cũ + log lock conflict) và có monitoring idle in transaction, age(backend_xmin), n_dead_tup ratio',
    ],
    tags: ['postgresql', 'vacuum', 'bloat', 'idle-in-transaction', 'xmin-horizon', 'mvcc'],
  },

{
  id: 'lab-sql-040',
  category: 'sql',
  title: 'ALTER TABLE giờ cao điểm làm treo API: AccessExclusiveLock giữ mọi query',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn thương mại điện tử MiniShop vận hành service {{catalog}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS primary 8 vCPU / 64 GB RAM). Bảng {{product}} giữ danh mục sản phẩm: **18.724.512 dòng** (~3,4 GB heap + 1,1 GB index). Giờ cao điểm 12:00–13:30 có khoảng 2.400 request/giây, 70% đọc danh mục, 30% ghi tồn kho.

**Triệu chứng (14/03/2026, 12:04).** Đúng 12:04, DBA chạy migration ALTER TABLE product ADD COLUMN discount_rate numeric(5,2) NOT NULL DEFAULT 0. Trong vòng **8 giây**, toàn bộ endpoint đọc danh mục trả 504. RDS CPU chỉ 12% nhưng số connection active nhảy từ 40 lên 512, pg_stat_activity đầy các SELECT đang chờ lock. Migration treo tới 12:09 mới kết thúc; downtime đọc danh mục khoảng 5 phút.

**Điều đã thử, không ăn.** Tăng max_connections lên 800, tăng pool Hikari lên 100 — p95 vẫn timeout vì mọi connection đều bị chặn. DBA cho rằng "migration nhỏ, không nên chậm"; thực tế là lock, không phải CPU.

**Việc bạn có.** Ba artifact: log server PostgreSQL lúc 12:04–12:09, snapshot pg_locks lúc 12:04:12, và script migration. Hãy dựng lại chu trình chờ, chỉ ra nguyên nhân gốc ở tầng thiết kế, và đề xuất cách migration an toàn trên bảng lớn.`,
  artifacts: [
    {
      name: 'postgres-lock-wait.log',
      lang: 'text',
      content: `# log server PostgreSQL 15.6 (RDS product-primary), timezone Asia/Ho_Chi_Minh
# log_lock_waits = on, deadlock_timeout = 1s, lock_timeout = 0 (không đặt)
# statement_timeout = 0
2026-03-14 12:04:00.012 +07 [24117] LOG:  duration: 0.041 ms  execute S_1: BEGIN
2026-03-14 12:04:00.015 +07 [24117] LOG:  duration: 0.038 ms  execute <unnamed>: ALTER TABLE product ADD COLUMN discount_rate numeric(5,2) NOT NULL DEFAULT 0
2026-03-14 12:04:00.016 +07 [24117] LOG:  duration: 0.011 ms  execute <unnamed>: (chờ lock)
2026-03-14 12:04:00.089 +07 [24118] LOG:  duration: 0.022 ms  execute S_1: BEGIN
2026-03-14 12:04:00.091 +07 [24118] LOG:  duration: 0.031 ms  execute <unnamed>: SELECT id, name, price, stock FROM product WHERE category_id = $1 LIMIT 20
2026-03-14 12:04:00.092 +07 [24118] LOG:  duration: 0.009 ms  execute <unnamed>: (chờ lock)
2026-03-14 12:04:00.103 +07 [24119] LOG:  duration: 0.024 ms  execute S_1: BEGIN
2026-03-14 12:04:00.105 +07 [24119] LOG:  duration: 0.029 ms  execute <unnamed>: SELECT id, name, price, stock FROM product WHERE id = $1
2026-03-14 12:04:00.106 +07 [24119] LOG:  duration: 0.010 ms  execute <unnamed>: (chờ lock)
2026-03-14 12:04:00.118 +07 [24120] LOG:  duration: 0.023 ms  execute S_1: BEGIN
2026-03-14 12:04:00.120 +07 [24120] LOG:  duration: 0.030 ms  execute <unnamed>: UPDATE product SET stock = stock - $1 WHERE id = $2
2026-03-14 12:04:00.121 +07 [24120] LOG:  duration: 0.011 ms  execute <unnamed>: (chờ lock)
# ... (487 phiên đang chờ AccessExclusiveLock của migration)
2026-03-14 12:04:08.001 +07 [24117] LOG:  duration: 7985.123 ms  execute <unnamed>: (ALTER TABLE hoàn tất)
2026-03-14 12:04:08.002 +07 [24117] LOG:  duration: 0.040 ms  execute S_2: COMMIT
2026-03-14 12:04:08.012 +07 [24118] LOG:  duration: 7920.987 ms  execute <unnamed>: SELECT ... (trả về)
2026-03-14 12:04:08.013 +07 [24119] LOG:  duration: 7907.909 ms  execute <unnamed>: SELECT ... (trả về)
2026-03-14 12:04:08.014 +07 [24120] LOG:  duration: 7909.909 ms  execute <unnamed>: UPDATE ... (trả về)
# ... (487 phiên drain xong trong ~3 giây sau khi migration commit)`,
    },
    {
      name: 'pg-locks-migration.txt',
      lang: 'text',
      content: `-- 2026-03-14 12:04:12 +07, chụp từ RDS product-primary (trong lúc migration đang chạy)
product=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       left(query, 60) AS query
FROM pg_stat_activity
WHERE pid IN (24117, 24118, 24119, 24120, 24121, 24122);
  pid  | state  | wait_event_type | wait_event   | xact_age  |                              query
-------+--------+-----------------+--------------+-----------+--------------------------------------------------------------
 24117 | active | Lock            | relation     | 00:00:12  | ALTER TABLE product ADD COLUMN discount_rate numeric(5,2) NOT
 24118 | active | Lock            | relation     | 00:00:12  | SELECT id, name, price, stock FROM product WHERE category_id
 24119 | active | Lock            | relation     | 00:00:12  | SELECT id, name, price, stock FROM product WHERE id = $1
 24120 | active | Lock            | relation     | 00:00:12  | UPDATE product SET stock = stock - $1 WHERE id = $2
 24121 | active | Lock            | relation     | 00:00:12  | SELECT count(*) FROM product WHERE category_id = $1
 24122 | active | Lock            | relation     | 00:00:12  | SELECT id, name, price, stock FROM product WHERE id = $1

product=# SELECT l.pid, l.locktype, l.relation::regclass AS relation, l.mode, l.granted
FROM pg_locks l
WHERE l.pid IN (24117, 24118, 24119, 24120, 24121, 24122)
ORDER BY l.pid, l.granted, l.locktype;
  pid  | locktype | relation |          mode          | granted
-------+----------+----------+------------------------+---------
 24117 | relation | product  | AccessExclusiveLock    | f
 24118 | relation | product  | AccessShareLock        | f
 24119 | relation | product  | AccessShareLock        | f
 24120 | relation | product  | RowExclusiveLock       | f
 24121 | relation | product  | AccessShareLock        | f
 24122 | relation | product  | AccessShareLock        | f

product=# SELECT count(*) AS waiting_sessions FROM pg_locks
WHERE NOT granted AND locktype = 'relation' AND relation = 'product'::regclass;
 waiting_sessions
------------------
              487

product=# SELECT pg_blocking_pids(24118) AS blocks_24118;
 blocks_24118
--------------
 {24117}

-- Ghi chú DBA: migration (pid 24117) đang CHỜ AccessExclusiveLock (granted = f) vì
-- còn một transaction cũ giữ AccessShareLock chưa commit. Trong lúc chờ, mọi câu
-- SELECT/UPDATE mới vào cũng CHỜ lock của migration (queue FIFO) -> toàn bộ bảng bị "treo"
-- dù migration chưa thực sự chạy. Đây là "lock queue amplification".`,
    },
    {
      name: 'migration-script.sql',
      lang: 'sql',
      content: `-- migration V20260314_1204__add_discount_rate.sql (Flyway)
-- Chạy bởi DBA thủ công lúc 12:04:00 ngày 14/03 (giờ cao điểm)
ALTER TABLE product
  ADD COLUMN discount_rate numeric(5,2) NOT NULL DEFAULT 0;

-- Mục đích: lưu chiết khấu theo sản phẩm cho chương trình khuyến mãi tháng 3.
-- Bảng product: 18.724.512 dòng, giờ cao điểm 2.400 req/s (70% đọc, 30% ghi).
-- DBA nhận xét: "câu đơn giản, không nên chậm" -> chạy trực tiếp trong giờ cao điểm.`,
    },
  ],
  questions: [
    'Vì sao migration ALTER TABLE chưa thực sự chạy (pid 24117 granted = f) mà toàn bộ endpoint đọc danh mục đã timeout? Chỉ ra cơ chế "lock queue amplification" bằng dòng nào trong artifact.',
    'Vì sao CPU chỉ 12% trong khi 487 phiên đang chờ? Đây là vấn đề gì: CPU, I/O, hay lock?',
    'Hãy đề xuất cách migration an toàn trên bảng 18 triệu dòng: cột nullable + backfill theo lô, CREATE INDEX CONCURRENTLY, và cách đặt lock_timeout / statement_timeout để migration tự bỏ cuộc thay vì treo cả hệ thống.',
  ],
  hints: [
    'Đọc kỹ snapshot pg_locks: migration (pid 24117) granted = f (chưa có AccessExclusiveLock), còn 487 phiên khác cũng granted = f — vì sao chúng không được phục vụ dù migration chưa chạy?',
    'PostgreSQL xếp hàng lock theo thứ tự FIFO: một phiên chờ AccessExclusiveLock sẽ chặn mọi lock yếu hơn vào sau nó. Đây là "lock queue amplification".',
    'Cột NOT NULL DEFAULT trên bảng lớn: PostgreSQL 11+ lưu default trong catalog (không rewrite bảng), nhưng vẫn cần AccessExclusiveLock để sửa schema — và lock đó bị chặn bởi transaction cũ chưa commit.',
    'Migration an toàn = nhiều bước nhỏ: thêm cột nullable (không default), backfill theo lô, thêm NOT NULL constraint (VALIDATE CONSTRAINT), rồi mới đặt default ở tầng ứng dụng.',
  ],
  answer: `**Tóm tắt:** Migration ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT 0 cần **AccessExclusiveLock** trên bảng product. Vì còn một transaction cũ chưa commit giữ AccessShareLock, migration phải chờ; và vì PostgreSQL xếp hàng lock **FIFO**, mọi câu SELECT/UPDATE mới vào sau migration cũng phải chờ sau migration -> "lock queue amplification": 487 phiên bị chặn dù migration chưa chạy. CPU chỉ 12% vì đây là vấn đề **lock**, không phải CPU/I/O. Sửa: thêm cột nullable (không default) trong giờ cao điểm với lock_timeout ngắn, backfill theo lô, thêm constraint VALIDATE, và CREATE INDEX CONCURRENTLY ngoài giờ cao điểm.

### Kiến thức nền: lock levels trong PostgreSQL
PostgreSQL có nhiều mức lock trên bảng (relation lock), từ yếu đến mạnh:
- **AccessShareLock**: SELECT cần (yếu nhất).
- **RowExclusiveLock**: INSERT/UPDATE/DELETE cần.
- **AccessExclusiveLock**: DDL như ALTER TABLE, DROP, TRUNCATE, VACUUM FULL cần — mạnh nhất, **không tương thích với bất kỳ lock nào khác** (kể cả AccessShareLock).

Quy tắc quan trọng: lock được cấp theo **thứ tự FIFO**. Nếu một phiên đang chờ AccessExclusiveLock, mọi phiên đến sau (dù chỉ cần AccessShareLock) phải xếp hàng sau nó — không được "chen" trước. Đây là "lock queue amplification": một migration chờ lock có thể làm treo cả bảng dù migration chưa chạy.

Ví dụ đời thường: một cửa hàng có nhiều khách đang vào ra (AccessShareLock). Một người muốn đóng cửa để sửa sang (AccessExclusiveLock) phải chờ khách cũ ra hết. Nhưng trong lúc anh ta đứng chờ ở cửa, các khách mới cũng không được vào — phải xếp hàng sau anh ta. Kết quả: cửa hàng "đóng" dù anh ta chưa làm gì.

### Nguyên nhân gốc, từng bước
1. **12:04:00.015**: DBA chạy ALTER TABLE product ADD COLUMN discount_rate numeric(5,2) NOT NULL DEFAULT 0. Câu này cần **AccessExclusiveLock**.
2. Có một transaction cũ (không hiện trong snapshot nhưng là nguyên nhân) đang giữ **AccessShareLock** trên product chưa commit (ví dụ một SELECT dài hoặc transaction mở qua I/O). Migration phải chờ lock.
3. **12:04:00.089 trở đi**: các câu SELECT/UPDATE mới của ứng dụng liên tục vào. Vì migration đang chờ AccessExclusiveLock ở đầu hàng, mọi câu mới phải xếp hàng sau migration -> **không được phục vụ**.
4. **12:04:08.001**: transaction cũ commit -> migration có lock -> ALTER TABLE chạy (chỉ mất vài ms vì PostgreSQL 11+ lưu default trong catalog, không rewrite bảng) -> commit -> 487 phiên drain xong trong ~3 giây.
5. Tổng downtime đọc danh mục: ~8 giây migration + ~3 giây drain = ~11 giây thực sự không phục vụ, nhưng vì timeout gateway 30 giây và retry, người dùng thấy 504 trong ~5 phút.

### Dẫn chứng
- Artifact 2, snapshot pg_locks lúc 12:04:12: migration (pid 24117) AccessExclusiveLock **granted = f** (chưa có lock); 5 phiên ứng dụng khác AccessShareLock/RowExclusiveLock cũng **granted = f**; waiting_sessions = 487.
- Artifact 2: pg_blocking_pids(24118) = {24117} — mọi phiên ứng dụng bị chặn bởi migration.
- Artifact 1: log cho thấy các câu SELECT/UPDATE của ứng dụng đều (chờ lock) ngay sau khi gửi, và drain xong trong ~3 giây sau khi migration commit.
- Artifact 2: CPU 12% (RDS metric) — xác nhận đây là vấn đề **lock**, không phải CPU/I/O. wait_event_type = Lock, wait_event = relation.

### Cách sửa ngắn hạn (trong ngày)
- **Hủy migration đang treo**: SELECT pg_cancel_backend(24117); (hoặc pg_terminate_backend). Migration bị cancel, hàng đợi giải phóng, ứng dụng phục hồi ngay. Flyway sẽ đánh dấu migration failed -> chạy lại sau.
- **Đặt lock_timeout cho migration**: SET lock_timeout = '2s'; trước khi chạy ALTER. Nếu không có lock trong 2 giây, migration tự bỏ cuộc với lỗi lock timeout thay vì treo cả hệ thống. Flyway/Liquibase hỗ trợ đặt lock_timeout trong script.
- **Chạy migration ngoài giờ cao điểm** (02:00–04:00) hoặc trong maintenance window.
- **Bảo vệ ứng dụng**: đặt statement_timeout cho role ứng dụng (ví dụ 5 giây) để câu bị chặn không giữ connection mãi; retry với backoff ở gateway.

### Cách sửa dài hạn (migration an toàn trên bảng lớn)
Nguyên tắc: **mỗi bước chỉ giữ lock ngắn, không giữ lock qua backfill**.

1. **Thêm cột nullable, không default** (lock ngắn, vài ms):
   ALTER TABLE product ADD COLUMN discount_rate numeric(5,2);
   PostgreSQL 11+ không rewrite bảng khi thêm cột nullable không default -> lock chỉ vài ms. Đây là bước an toàn trong giờ cao điểm.

2. **Backfill theo lô** (không lock, chạy ngoài transaction lớn):
   UPDATE product SET discount_rate = 0 WHERE discount_rate IS NULL AND id > :lastId LIMIT 10000;
   Lặp cho đến hết. Mỗi batch commit riêng -> không giữ lock lâu, không bloat WAL. Có thể chạy trong giờ cao điểm với throttle.

3. **Thêm NOT NULL constraint bằng VALIDATE** (lock ngắn):
   ALTER TABLE product ADD CONSTRAINT product_discount_rate_not_null CHECK (discount_rate IS NOT NULL) NOT VALID;
   ALTER TABLE product VALIDATE CONSTRAINT product_discount_rate_not_null;
   NOT VALID chỉ thêm constraint mà không quét bảng (lock ngắn). VALIDATE CONSTRAINT quét bảng nhưng chỉ cần ShareUpdateExclusiveLock (không chặn SELECT/UPDATE). Sau đó có thể đổi sang SET NOT NULL (lock ngắn vì constraint đã validate).

4. **Đặt default ở tầng ứng dụng** (không cần ALTER TABLE): code mới ghi discount_rate = 0 khi tạo sản phẩm. Hoặc ALTER TABLE product ALTER COLUMN discount_rate SET DEFAULT 0 (chỉ sửa catalog, lock ngắn).

5. **CREATE INDEX CONCURRENTLY** (không lock bảng):
   CREATE INDEX CONCURRENTLY idx_product_discount_rate ON product (discount_rate);
   CONCURRENTLY build index trong 2 pass, không giữ lock mạnh; không thể chạy trong transaction. Nếu fail giữa chừng, index ở trạng thái INVALID -> drop rồi chạy lại.

6. **Expand/contract cho rename/drop cột**: thêm cột mới -> dual-write -> backfill -> chuyển đọc -> drop cột cũ (mỗi bước một migration, deploy ứng dụng giữa các bước).

### Phòng ngừa và monitoring
- **Bắt buộc lock_timeout cho mọi migration**: SET lock_timeout = '2s'; (hoặc SET LOCAL lock_timeout trong transaction). Migration tự bỏ cuộc thay vì treo cả hệ thống.
- **Chạy migration ngoài giờ cao điểm** hoặc trong maintenance window; với Flyway/Liquibase, đặt lock_timeout trong script và alert khi migration fail.
- **Theo dõi lock wait**: pg_stat_activity với wait_event_type = 'Lock'; alert khi số phiên chờ lock > 50 hoặc thời gian chờ > 5 giây.
- **Quy tắc review**: mọi migration phải kèm ước lượng thời gian lock và số dòng ảnh hưởng; migration trên bảng > 1 triệu dòng phải có kế hoạch expand/contract.
- **Test migration trên dữ liệu production-like** (clone RDS) trước khi apply production.

> Senior tip: "migration nhỏ không nên chậm" là suy nghĩ nguy hiểm nhất. Vấn đề không phải thời gian chạy ALTER mà là **lock**. PostgreSQL có thể thêm cột nullable trong vài ms, nhưng AccessExclusiveLock vẫn cần — và lock đó bị chặn bởi bất kỳ transaction nào chưa commit. Quy tắc vàng: **không bao giờ chạy DDL trong giờ cao điểm mà không có lock_timeout**
`,
  rubric: [
    'Chỉ đúng cơ chế lock queue amplification: migration chờ AccessExclusiveLock (granted = f) chặn 487 phiên SELECT/UPDATE sau nó vì PostgreSQL xếp hàng lock FIFO',
    'Dẫn chứng đúng từ artifact: pg_locks cho migration granted = f, waiting_sessions = 487, pg_blocking_pids cho thấy mọi phiên bị chặn bởi migration; CPU 12% xác nhận vấn đề là lock không phải CPU/I/O',
    'Đề xuất migration an toàn đúng: thêm cột nullable không default (lock ngắn), backfill theo lô, ADD CONSTRAINT NOT VALID + VALIDATE CONSTRAINT (ShareUpdateExclusiveLock), CREATE INDEX CONCURRENTLY, bắt buộc lock_timeout cho migration',
  ],
  tags: ['postgresql', 'lock', 'migration', 'alter-table', 'lock-queue-amplification'],
},

{
  id: 'lab-sql-041',
  category: 'sql',
  title: 'Query chậm do OR giữa 2 cột: Seq Scan dù có 2 index',
  level: 'senior',
  scenario: `**Bối cảnh.** Dịch vụ tra cứu đơn hàng {{order-lookup}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{orders}} giữ toàn bộ đơn hàng: **31.402.881 dòng** (~6,2 GB heap + 2,1 GB index). Có 2 index: idx_orders_buyer_id trên buyer_id và idx_orders_seller_id trên seller_id. Endpoint GET /api/v1/orders/search?buyerId=...&sellerId=... cho phép tìm đơn theo người mua HOẶC người bán (logic OR).

**Triệu chứng (14/03/2026, 10:00–12:00).** p95 của endpoint nhảy từ 12 ms lên **1,8 giây**; RDS CPU leo từ 18% lên 89%. Slow query log cho thấy câu query với OR quét toàn bảng dù cả 2 cột đều có index. DBA nghi ngờ "index không hiệu quả" và đề xuất xóa index cũ tạo composite — nhưng composite (buyer_id, seller_id) không giúp vì điều kiện là OR, không phải AND.

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu query OR, EXPLAIN ANALYZE của câu query viết lại bằng UNION ALL, và danh sách index hiện có. Hãy chỉ ra vì sao planner không dùng 2 index, và đề xuất cách viết lại để planner dùng BitmapOr hoặc UNION ALL, kèm đo lại.`,
  artifacts: [
    {
      name: 'explain-or-query.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:12:03 +07, RDS order-lookup-primary (PostgreSQL 15.6)
orderdb=# EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.buyer_id, o.seller_id, o.status, o.total_amount, o.created_at
FROM orders o
WHERE o.buyer_id = '9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041'::uuid
   OR o.seller_id = 'b7f3c9e2-5d41-4a08-9c6b-1e2f3a4b5c6d'::uuid
ORDER BY o.created_at DESC
LIMIT 50;
                                                          QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=1241482.52..1241482.56 rows=50 width=64) (actual time=4123.498..4123.503 rows=50 loops=1)
   ->  Sort  (cost=1241482.52..1241482.56 rows=50 width=64) (actual time=4123.495..4123.499 rows=50 loops=1)
         Sort Key: created_at DESC
         Sort Method: top-N heapsort  Memory Usage: 32kB
   ->  Seq Scan on orders o  (cost=0.00..1239895.56 rows=15701440 width=64) (actual time=0.031..4120.902 rows=15701440 loops=1)
         Filter: ((buyer_id = '9f3c1a44-...'::uuid) OR (seller_id = 'b7f3c9e2-...'::uuid))
         Rows Removed by Filter: 15701441
         Buffers: shared hit=598934 read=6178
 Planning Time: 0.284 ms
 Execution Time: 4123.781 ms
(10 rows)

Time: 4124.012 ms`,
    },
    {
      name: 'explain-union-all.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:18:41 +07, RDS order-lookup-primary (PostgreSQL 15.6)
orderdb=# EXPLAIN (ANALYZE, BUFFERS)
WITH matched AS (
  SELECT o.id, o.buyer_id, o.seller_id, o.status, o.total_amount, o.created_at
  FROM orders o
  WHERE o.buyer_id = '9f3c1a44-6b2e-4f0a-9d21-7c5b8e2f1041'::uuid
  UNION ALL
  SELECT o.id, o.buyer_id, o.seller_id, o.status, o.total_amount, o.created_at
  FROM orders o
  WHERE o.seller_id = 'b7f3c9e2-5d41-4a08-9c6b-1e2f3a4b5c6d'::uuid
)
SELECT DISTINCT ON (id) id, buyer_id, seller_id, status, total_amount, created_at
FROM matched
ORDER BY id, created_at DESC
LIMIT 50;
                                                          QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=12.44..12.48 rows=50 width=64) (actual time=0.412..0.415 rows=50 loops=1)
   ->  Unique  (cost=12.44..12.48 rows=50 width=64) (actual time=0.410..0.413 rows=50 loops=1)
         ->  Sort  (cost=12.44..12.48 rows=50 width=64) (actual time=0.408..0.411 rows=50 loops=1)
               Sort Key: id, created_at DESC
               Sort Method: quicksort  Memory Usage: 32kB
   ->  Append  (cost=0.42..12.36 rows=100 width=64) (actual time=0.031..0.387 rows=100 loops=1)
         ->  Index Scan using idx_orders_buyer_id on orders o  (cost=0.42..6.18 rows=50 width=64) (actual time=0.021..0.192 rows=50 loops=1)
               Index Cond: (buyer_id = '9f3c1a44-...'::uuid)
               Order By: created_at DESC
         ->  Index Scan using idx_orders_seller_id on orders o  (cost=0.42..6.18 rows=50 width=64) (actual time=0.020..0.191 rows=50 loops=1)
               Index Cond: (seller_id = 'b7f3c9e2-...'::uuid)
               Order By: created_at DESC
 Planning Time: 0.312 ms
 Execution Time: 0.428 ms
(16 rows)

Time: 0.712 ms`,
    },
    {
      name: 'show-index-orders.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:20:11 +07, RDS order-lookup-primary
orderdb=# \d orders
                  Table "public.orders"
   Column      |           Type           | Collation | Nullable |    Default
---------------+--------------------------+-----------+----------+-----------
 id            | uuid                     |           | not null |
 buyer_id      | uuid                     |           | not null |
 seller_id     | uuid                     |           | not null |
 status        | character varying(16)    |           | not null |
 total_amount  | numeric(12,2)            |           | not null |
 created_at    | timestamp with time zone |           | not null | now()
 updated_at    | timestamp with time zone |           | not null | now()
Indexes:
    "orders_pkey" PRIMARY KEY, btree (id)
    "idx_orders_buyer_id" btree (buyer_id, created_at DESC)
    "idx_orders_seller_id" btree (seller_id, created_at DESC)

orderdb=# SELECT count(*) AS total_rows FROM orders;
 total_rows
------------
   31402881`,
    },
  ],
  questions: [
    'Vì sao câu query với OR giữa 2 cột buyer_id và seller_id không dùng được 2 index sẵn có, dù mỗi cột riêng lẻ đều có index? Chỉ ra bằng dòng nào trong plan.',
    'Planner ước tính rows=15701440 (gần nửa bảng). Vì sao selectivity của OR lại cao như vậy, và điều này ảnh hưởng thế nào đến quyết định của planner?',
    'Hãy đề xuất cách viết lại query (UNION ALL hoặc BitmapOr) để planner dùng index, kèm đo lại hiệu năng và cách xử lý trùng lặp (đơn mà cùng là buyer và seller).',
  ],
  hints: [
    'PostgreSQL không thể "OR" hai index scan theo cách đơn giản: nó phải gom TID (tuple id) từ cả 2 index rồi sort/unique — đó là BitmapOr. Planner chỉ chọn BitmapOr khi ước tính chi phí thấp hơn Seq Scan.',
    'Khi selectivity của OR cao (ước tính nhiều dòng khớp), planner kết luận Seq Scan rẻ hơn vì đọc tuần tự toàn bảng còn rẻ hơn random I/O từ index.',
    'Viết lại bằng UNION ALL: mỗi nhánh dùng đúng index của mình (buyer_id hoặc seller_id), rồi DISTINCT ON (id) để loại trùng. Planner push down LIMIT vào mỗi nhánh -> chỉ đọc 50 dòng mỗi nhánh.',
    'Index (buyer_id, created_at DESC) và (seller_id, created_at DESC) đã có sẵn và đúng thứ tự -> mỗi nhánh không cần sort thêm.',
  ],
  answer: `**Tóm tắt:** Câu query WHERE buyer_id = X OR seller_id = Y không dùng được 2 index vì planner ước tính selectivity của OR rất thấp (rows=15.701.440, gần nửa bảng) -> kết luận Seq Scan rẻ hơn BitmapOr. Sửa bằng cách viết lại bằng UNION ALL (mỗi nhánh dùng đúng index của mình) + DISTINCT ON (id) để loại trùng; hiệu năng tăng từ 4.123 ms xuống 0,428 ms (~9.600 lần). Index composite (buyer_id, seller_id) không giúp vì điều kiện là OR, không phải AND.

### Kiến thức nền: tại sao OR khó dùng index
Với điều kiện AND, planner có thể dùng một index duy nhất (hoặc intersection của nhiều index). Với điều kiện OR, planner phải gom kết quả từ nhiều index khác nhau — PostgreSQL hỗ trợ điều này qua **BitmapOr**: quét index 1 lấy danh sách TID (tuple id), quét index 2 lấy danh sách TID, OR hai danh sách, rồi đọc heap theo TID. Nhưng BitmapOr chỉ có lợi khi **tổng số dòng khớp nhỏ** (selectivity cao). Nếu OR trả về nhiều dòng (selectivity thấp), chi phí random I/O từ index + sort TID lớn hơn đọc tuần tự toàn bảng -> planner chọn Seq Scan.

Ví dụ đời thường: bạn có 2 sổ danh bạ (index) — một theo tên người mua, một theo tên người bán. Tìm "đơn của A HOẶC đơn của B": bạn có thể tra từng sổ rồi gộp (BitmapOr), nhưng nếu A và B là khách hàng lớn (mỗi người 1000 đơn), tra sổ rồi gộp mất **thời gian hơn đọc hết cuốn sổ** -> Seq Scan nhanh hơn.

### BitmapOr: khi nào planner chọn
Planner chọn BitmapOr khi ước tính tổng số dòng khớp đủ nhỏ (thường < 5-10% bảng). Trong trường hợp này, hai UUID cụ thể mỗi cái chỉ khớp vài chục đơn (selectivity rất cao), nhưng **planner không biết giá trị tham số lúc plan** (parameterized query) -> dùng ước lượng chung từ statistics: n_distinct của buyer_id và seller_id đều lớn, nhưng histogram không phản ánh được sự phân bố lệch của từng giá trị -> planner ước lượng sai, chọn Seq Scan.

### Cách viết lại bằng UNION ALL (khuyên dùng)
UNION ALL tách thành 2 nhánh độc lập, mỗi nhánh dùng đúng index của mình. Planner push down LIMIT 50 vào mỗi nhánh -> chỉ đọc 50 dòng mỗi nhánh. DISTINCT ON (id) loại trùng lặp (đơn mà cùng là buyer và seller).
~~~sql
WITH matched AS (
  SELECT o.id, o.buyer_id, o.seller_id, o.status, o.total_amount, o.created_at
  FROM orders o
  WHERE o.buyer_id = $1
  UNION ALL
  SELECT o.id, o.buyer_id, o.seller_id, o.status, o.total_amount, o.created_at
  FROM orders o
  WHERE o.seller_id = $2
)
SELECT DISTINCT ON (id) id, buyer_id, seller_id, status, total_amount, created_at
FROM matched
ORDER BY id, created_at DESC
LIMIT 50;
~~~
Kết quả: **0,428 ms** (artifact 2) so với **4.123 ms** — nhanh ~9.600 lần. Index (buyer_id, created_at DESC) và (seller_id, created_at DESC) đã có sẵn thứ tự sort -> không cần sort thêm.

### Cách khác: BitmapOr với enable_bitmapscan = on
Nếu buộc dùng câu OR gốc: đảm bảo statistics mới (ANALYZE), có thể dùng extended statistics cho cặp (buyer_id, seller_id) nếu có tương quan. Nhưng UNION ALL an toàn hơn vì không phụ thuộc quyết định planner.

### Phòng ngừa
- Tránh OR giữa các cột khác nhau trong WHERE trên bảng lớn; viết lại bằng UNION ALL.
- Chạy ANALYZE định kỳ; trên bảng lớn cân nhắc partition để statistics chính xác hơn từng partition.
- Extended statistics: {{CREATE STATISTICS orders_buyer_seller (dependencies) ON buyer_id, seller_id FROM orders;}} ANALYZE — giúp planner hiểu mối quan hệ giữa 2 cột.

### Trả lời mẫu khi phỏng vấn
"Câu query OR giữa buyer_id và seller_id chạy Seq Scan 4 giây vì planner ước lượng 15,7 triệu dòng khớp (gần nửa bảng) và chọn Seq Scan rẻ hơn BitmapOr. Thực tế mỗi UUID chỉ khớp vài chục đơn. Tôi viết lại bằng UNION ALL: mỗi nhánh dùng index của mình, LIMIT push down, DISTINCT ON (id) loại trùng. Từ 4.123 ms xuống 0,428 ms. Composite index không giúp vì điều kiện là OR. Phòng ngừa: tránh OR trên cột khác nhau, dùng UNION ALL, cập nhật statistics, extended statistics cho cặp cột."
> Senior tip: OR giữa hai cột khác nhau là "kẻ giết index" thầm lặng. Planner không thể push down LIMIT vào BitmapOr, và ước lượng selectivity của OR thường sai lệch lớn khi giá trị tham số không đều. UNION ALL tách biệt logic, cho phép planner tối ưu từng nhánh riêng — đây là pattern chuẩn cho tìm kiếm "A HOẶC B" trên bảng lớn.
`,
  rubric: [
    'Chỉ đúng nguyên nhân: planner ước lượng rows=15.701.440 cho OR (gần nửa bảng) -> chọn Seq Scan; không dùng được 2 index vì BitmapOr chỉ chọn khi selectivity cao, và planner không biết giá trị tham số lúc plan',
    'Dẫn chứng đúng: artifact 1 Seq Scan rows=15701440, artifact 2 UNION ALL dùng 2 Index Scan, Execution Time 4.123 ms -> 0,428 ms; index (buyer_id, created_at DESC) và (seller_id, created_at DESC) khớp ORDER BY',
    'Đề xuất sửa đúng: UNION ALL + DISTINCT ON (id) để loại trùng, LIMIT push down, giải thích vì sao composite index không giúp (OR không phải AND), nêu phòng ngừa: tránh OR, ANALYZE, extended statistics',
  ],
  tags: ['postgresql', 'index', 'or-condition', 'union-all', 'bitmap-or', 'selectivity'],
},
{
  id: 'lab-sql-042',
  category: 'sql',
  title: 'Kiểm tra giới hạn giao dịch chậm vì tham số số gửi kiểu sai',
  level: 'senior',
  scenario: `**Bối cảnh.** Ngân hàng số VBank chạy dịch vụ {{limit-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Mỗi tài khoản có giới hạn giao dịch ngày lưu trong bảng {{account_limit}}. Cột {{daily_limit}} kiểu {{INTEGER}} lưu số tiền VND đã làm tròn thành số nguyên. Có chỉ mục {{idx_account_limit_daily}} (btree trên {{daily_limit}}). Bảng sau 2 năm có **8.412.607 dòng** (~2,1 GB heap).

**Triệu chứng (14/03/2026, 09:15).** Endpoint {{GET /api/v1/limits/check}} kiểm tra trước khi cho giao dịch đi: câu SQL {{WHERE daily_limit <= :soTien}}. Java nhận {{soTien}} kiểu {{BigDecimal}} (tiền tệ luôn dùng {{BigDecimal}}), Hibernate gửi tham số kiểu {{numeric}}. p95 của endpoint nhảy từ 40 ms lên **3,8 giây**, CPU RDS từ 18% lên 86%. DBA chạy EXPLAIN ANALYZE và thấy **Seq Scan** toàn bảng 8,4 triệu dòng dù chỉ mục đã tồn tại. Một dev hỏi: "sao chỉ mục không dùng được, bảng chưa lớn lắm".

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu chậm và của câu viết lại đúng kiểu, schema + danh sách chỉ mục, log ứng dụng. Hãy chỉ ra nguyên nhân gốc và cách sửa.`,
  artifacts: [
    {
      name: 'explain-limit-check.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:16:02 +07, psql tren RDS vbank-primary (PostgreSQL 15.6)
vbank=# EXPLAIN (ANALYZE, BUFFERS)
SELECT account_id, daily_limit FROM account_limit
WHERE daily_limit <= 5000000;
                                                                   QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------
 Seq Scan on account_limit  (cost=0.00..147231.56 rows=42063 width=40) (actual time=0.021..3876.412 rows=1 loops=1)
   Filter: ((daily_limit)::numeric <= 5000000::numeric)
   Rows Removed by Filter: 8412606
   Buffers: shared hit=145210 read=118433
 Planning Time: 0.312 ms
 Execution Time: 3877.204 ms
(6 rows)

Time: 3877.520 ms

-- So sang: cung cau, ep kieu tham so ve INTEGER (kieu khop cot):
vbank=# EXPLAIN (ANALYZE, BUFFERS)
SELECT account_id, daily_limit FROM account_limit
WHERE daily_limit <= CAST(5000000 AS INTEGER);
                                                                   QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------
 Index Scan using idx_account_limit_daily on account_limit  (cost=0.43..8.45 rows=1 width=40) (actual time=0.051..0.312 rows=1 loops=1)
   Index Cond: (daily_limit <= 5000000)
   Buffers: shared hit=12 read=2
 Planning Time: 0.284 ms
 Execution Time: 0.401 ms
(6 rows)

Time: 0.871 ms`,
    },
    {
      name: 'schema-account-limit.txt',
      lang: 'text',
      content: `-- 2026-03-14 09:17:05 +07
vbank=# \\d account_limit
                                         Table "public.account_limit"
   Column     |           Type           | ...
--------------+--------------------------+...
 account_id   | bigint                   | not null
 daily_limit  | integer                  | not null  -- gioi han giao dien ngay, dong VND
 currency     | character(3)             | not null | 'VND'::bpchar
 updated_at   | timestamp with time zone | not null | now()
 Indexes:
     "account_limit_pkey" PRIMARY KEY, btree (account_id)
     "idx_account_limit_daily" btree (daily_limit)

vbank=# SELECT indexrelname, idx_scan FROM pg_stat_user_indexes WHERE relname = 'account_limit';
     indexrelname     | idx_scan
----------------------+---------
 idx_account_limit_daily |   31204
 account_limit_pkey      | 42110088`,
    },
    {
      name: 'app-limit-check.log',
      lang: 'text',
      content: `2026-03-14 09:15:42.118 DEBUG [http-nio-8080-exec-22] o.h.SQL :
    select al1_0.account_id,al1_0.daily_limit from account_limit al1_0 where al1_0.daily_limit<=?
2026-03-14 09:15:45.980 INFO  [http-nio-8080-exec-22] c.v.l.LimitController : GET /api/v1/limits/check -> 200 in 3881 ms
2026-03-14 09:15:46.222 DEBUG [http-nio-8080-exec-7] o.h.SQL :
    select al1_0.account_id,al1_0.daily_limit from account_limit al1_0 where al1_0.daily_limit<=?
2026-03-14 09:15:50.114 INFO  [http-nio-8080-exec-7] c.v.l.LimitController : GET /api/v1/limits/check -> 200 in 3894 ms
-- pattern: moi request kiem tra gioi han mat khoang 3,9 giay, khong co request nao duoi 1 giay`,
    },
  ],
  questions: [
    'Vì sao chỉ mục idx_account_limit_daily (đã tồn tại) không được dùng cho câu WHERE daily_limit <= :soTien? Chỉ ra bằng dòng nào trong EXPLAIN.',
    'Sai việc nằm ở layer nào (Hibernate/JDBC gửi tham số, cách viết SQL, hay kiểu dữ liệu cột)?',
    'Bạn sửa câu truy vấn và xử lý kiểu dữ liệu thế nào để kiểm tra giới hạn về dưới 10 ms? Tại sao không nên đổi cột daily_limit từ INTEGER sang NUMERIC/BIGINT?',
  ],
  hints: [
    'Dòng "Filter: ((daily_limit)::numeric <= ...)" trong EXPLAIN cho thấy cot INTEGER bi ep kieu thanh NUMERIC de so sanh voi tham so numeric, chi muc B-tree tren daily_limit (luu so nguyen) khong khop bieu thuc do.',
    'PostgreSQL khong tu doi kieu tham so de khop chi muc, ngau lai no ep kieu cot ve kieu cua tham so. Khi cot nam trong ham hoac ep kieu, dieu kien khong con "sargable" (duoc su dung chi muc).',
    'Sua: gui tham so kieu INTEGER (java.lang.Integer / ps.setInt) hoac viet WHERE daily_limit <= CAST(:soTien AS INTEGER) — ep kieu o ve tham so, khong ep cot. Doi cot sang NUMERIC/BIGINT tac dam toan bo schema va truy van khac, tranh neu khong bat buoc.',
  ],
  answer: `**Tóm tắt:** Endpoint kiểm tra giới hạn viết {{WHERE daily_limit <= :soTien}} với cột {{daily_limit}} kiểu {{INTEGER}} nhưng tham số gửi là {{BigDecimal}} (kiểu {{numeric}}). PostgreSQL không đổi kiểu tham số cho khớp chỉ mục, mà **ép kiểu cột {{daily_limit}} về {{numeric}}** (xem dòng {{Filter: ((daily_limit)::numeric <= ...)}} trong EXPLAIN). Khi cột được ép kiểu, chỉ mục B-tree trên {{daily_limit}} không còn dùng được → planner chọn **Seq Scan** quét toàn bảng 8,4 triệu dòng, mỗi lần kiểm tra tốn gần 4 giây CPU. Sửa: gửi tham số đúng kiểu {{INTEGER}} hoặc {{WHERE daily_limit <= CAST(:soTien AS INTEGER)}} (ép kiểu ở vế tham số), không đổi kiểu cột.

### Tự vấn: sargable là gì và tại sao chỉ mục bị bỏ qua
**Sargable** (viết tắt của Search ARGument Able) là tính chất của điều kiện WHERE cho phép cơ sở dữ liệu dùng chỉ mục: cột nằm ở vế trái, toán tử so sánh ở giữa, hằng số hoặc tham số đã bind ở vế phải. Ví dụ {{daily_limit <= :soTien}} là sargable khi {{:soTien}} có kiểu {{INTEGER}}.

Khi viết {{daily_limit <= :soTien}} với {{:soTien}} kiểu {{numeric}}, PostgreSQL không có toán tử so sánh trực tiếp giữa {{INTEGER}} và {{NUMERIC}}. Nó có hai hướng ép kiểu ngầm: {{INTEGER → NUMERIC}} (an toàn, vì số nguyên ép sang số thập phân không mất dữ liệu) và {{NUMERIC → INTEGER}} (không ép ngầm, vì số thập phân có thể bị cắt bỏ phần thập phân). Vì chỉ một hướng được phép, PostgreSQL chọn ép **cột** {{daily_limit}} sang {{numeric}} rồi so sánh.

Kết quả: câu trở thành {{WHERE (daily_limit)::numeric <= 5000000::numeric}}. Chỉ mục {{idx_account_limit_daily}} lưu giá trị nguyên thô của {{daily_limit}}, không lưu giá trị sau khi ép kiểu. Planner không tìm thấy chỉ mục nào khớp biểu thức {{(daily_limit)::numeric}} → chọn **Seq Scan**.

Ví dụ đời thường: chỉ mục giống mục lục sách theo số trang in trên sách. Nếu bạn hỏi "trang nào có nội dung bằng số sau khi làm tròn", mục lục không giúp vì bạn phải đọc mỗi trang, làm tròn, rồi mới so sánh — giống Seq Scan.

### Nguyên nhân gốc, từng bước
1. Cột {{daily_limit}} khai báo {{INTEGER}} lưu số nguyên. Code Java nhận số tiền kiểu {{BigDecimal}}, Hibernate gửi tham số {{numeric}}.
2. PostgreSQL không có toán tử {{INTEGER = NUMERIC}} trực tiếp, chỉ ép kiểu ngầm. Hướng an toàn là {{INTEGER → NUMERIC}}, nên planner ép **cột** {{daily_limit}}.
3. Chỉ mục lưu giá trị nguyên thô, câu so sánh trên kết quả ép kiểu → chỉ mục không khớp → **Seq Scan**.
4. Mỗi request kiểm tra giới hạn quét 8,4 triệu dòng để trả về 1 dòng; hàng chục request song phần (retry khi timeout) đốt cạn CPU. CPU 86% là hệ quả của việc quét lãng phí, không phải tải thật.

### Dẫn chứng
- Artifact 1 (câu chậm): dòng {{Filter: ((daily_limit)::numeric <= 5000000::numeric)}} cho thấy cột bị ép kiểu; {{Seq Scan on account_limit}} xác nhận chỉ mục không dùng; {{Rows Removed by Filter: 8412606}} nghĩa là 8,412,606 dòng bị đọc rồi loại bỏ; {{Buffers: shared hit=145210 read=118433}} (~263 nghìn trang) và {{Execution Time: 3877.204 ms}}.
- Artifact 1 (câu viết lại): cung bang, cung dieu kien, chi cast tham so ve INTEGER → {{Index Scan using idx_account_limit_daily}}, {{Buffers: shared hit=12 read=2}}, {{Execution Time: 0.401 ms}}. Chenh lech khoang **9.600 lan** chi vi kieu tham so. Chi muc da co san va hoat dong tot — van de khong phai "thieu chi muc".
- Artifact 2: chi muc {{idx_account_limit_daily}} btree tren {{daily_limit}} (INTEGER) da ton tai, idx_scan = 31.204 lan (cac cau viet dung kieu).
- Artifact 3: log ung dung moi request kiem tra gioi han mat khoang 3,9 giay.

### Cách sửa ngắn hạn (hôm nay)
- Sửa code gui tham so dung kieu {{INTEGER}}: {{Integer.valueOf(soTien.intValue())}} hoac {{ps.setInt(...)}}, viet {{WHERE daily_limit <= :soTienInt}}. Chi muc duoc dung ngay.
- Neu khong sua duoc code ngay: viet {{WHERE daily_limit <= CAST(:soTien AS INTEGER)}} — ep kieu o **ve tham so**, chi mot gia tri, chi muc van duoc dung.
- Them {{statement_timeout}} cho role kiem tra gioi han (vi du 2 giay) de cau sai kieu khong chiem DB lau khi client da bo.

### Cách sửa dài hạn
- **Khong doi cot {{daily_limit}} sang {{NUMERIC}}/{{BIGINT}}** neu khong bat buoc: tac dam toan bo schema, moi truy van khac dung cot nay, va migration tren bang 8 tram trieu dong tốn kém. Chi doi khi thiet ke moi yeu xu ly so thap phan thuc su.
- Chuan hoa kieu du lieu o ran gio ung dung–DB: tien te luon {{BigDecimal}} o Java, nhung neu cot DB la {{INTEGER}} thi gui {{INTEGER}}; tránh gui {{BigDecimal}} vao cot so nguyen.
- Quy tắc review: trong {{WHERE}} khong de ham hoac ep kieu tren cot da chi muc; PR co truy van moi phai kem {{EXPLAIN (ANALYZE, BUFFERS)}} tren staging co du lieu ti le production.

### Trả lời mẫu khi phỏng vấn
"Cau kiem tra gioi han viet WHERE daily_limit <= :soTien voi cot daily_limit la INTEGER nhung tham so gui la BigDecimal (numeric). PostgreSQL khong doi kieu tham so, ma ep cot daily_limit ve numeric (xem dong Filter co ::numeric trong EXPLAIN), chi muc B-tree bo qua, plannner chon Seq Scan 8,4 tram tram dong, 3,8 giay. Sua: gui tham so kieu INTEGER hoac CAST tham so ve INTEGER (ep ve tham so), khong doi cot. Ly do khong doi cot sang NUMERIC/BIGINT: tac dam schema va migration tốn kém. Chuong trinh phai viet WHERE de cot o ve trai, tham so o ve phai, kieu tham so phai khop kieu cot."

### Phòng ngừa và monitoring
- Bật {{pg_stat_statements}} va theo doi {{total_exec_time}} theo queryid; canh bao khi mot truy van tren bang lon chon Seq Scan hoac {{Rows Removed by Filter}} cao so voi dong tra ve.
- Bật {{auto_explain}} voi {{auto_explain.log_min_duration = 500}}; canh bao khi plan doi tu {{Index Scan}} sang {{Seq Scan}}.
- Kiem tra kieu tham so khi viet {{PreparedStatement}}: so tien, ma so, ngay thang deu phai dung kieu so voi cot.

> Senior tip: Khi EXPLAIN van Seq Scan da da co chi muc, hay hoi "dieu kien WHERE co ep kieu hoac bao ham cot khong?" — day la nguyen nhan phu nhat sau thong ke cu. Quy tac vang: viet truy de cot luon o ve trai, tham so/hang so o ve phai, kieu tham so phai khop kieu cot. Ep kieu hay de o ve tham so, khong o ve cot.`,
  rubric: [
    'Chỉ đúng nguyên nhân gốc: tham số numeric khiến PostgreSQL ép kiểu cột INTEGER về numeric, dòng Filter có ::numeric trong EXPLAIN là bằng chứng, chỉ mục bị bỏ qua → Seq Scan',
    'Dẫn chứng đúng: so sánh hai EXPLAIN (tham số numeric → Seq Scan 3877 ms, rowsRemoved 8,4 triệu; cast tham số INTEGER → Index Scan 0,4 ms), chỉ ra dòng Filter có ::numeric',
    'Sửa đúng: gửi tham số kiểu INTEGER hoặc CAST tham số về INTEGER (ép vế tham số), không đổi kiểu cột, giải thích tại sao không đổi cột sang NUMERIC/BIGINT',
    'Có phân tích tại sao chỉ mục không khớp (chỉ mục lưu giá trị thô, câu so sánh trên kết quả ép kiểu)',
    'Có monitoring/phòng ngừa: pg_stat_statements, auto_explain, cảnh báo Seq Scan trên bảng lớn, kiểm tra kiểu tham số',
  ],
  tags: ['postgresql', 'index', 'implicit-cast', 'seq-scan', 'explain', 'numeric'],
},
{
  id: 'lab-sql-043',
  category: 'sql',
  title: 'Hai transaction xác nhận đơn hàng khóa hai bảng theo thứ tự ngược gây deadlock',
  level: 'senior',
  scenario: `**Bối cảnh.** Sàn shop QuickCart chạy dịch vụ {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{orders}} lưu đơn hàng (cột {{id}} khóa chính, cột {{status}}), bảng {{inventory}} lưu tồn kho theo mã sản phẩm (cột {{sku_id}} khóa chính, cột {{quantity}}). Khi xác nhận đơn, code chạy trong một transaction: khóa đơn hàng, rồi khóa tồn kho và trừ số lượng.

**Triệu chứng (20/03/2026, 14:22).** Khoảng 0,4% đơn hàng bị lỗi {{CannotAcquireLockException: ERROR: deadlock detected}} (HTTP 500), tập trung vào hai request xác nhận cùng đơn {{ORD-2026-03-20-88421}} gửi gần như cùng lúc (cách nhau 12 ms, do client retry sau timeout). Cả hai request đều liên quan đến sản phẩm {{IPH-15}} nhưng code xử lý theo hai nhánh khác nhau: nhánh "xác nhận bình thường" khóa đơn trước rồi tồn kho; nhánh "đặt lại tồn kho khi thử lại" khóa tồn kho trước rồi đơn. PostgreSQL log ghi deadlock detected, HikariCP pool không cạn, CPU 15%.

**Việc bạn có.** Ba artifact: log deadlock của PostgreSQL, ảnh pg_stat_activity, log ứng dụng. Hãy tìm nguyên nhân gốc, chứng minh bằng pid/transaction id, rồi đề xuất cách sửa.

**Vì sao đây là lỗi thiết kế, không phải lỗi PostgreSQL:** PostgreSQL phát hiện deadlock và huỷ một transaction để bảo vệ dữ liệu — đó là cơ chế hoạt động đúng. Vấn đề là hai transaction khóa cùng hai tài nguyên theo thứ tự ngược nhau, tạo thành chu kỳ chờ.`,
  artifacts: [
    {
      name: 'postgresql-deadlock.log',
      lang: 'text',
      content: `-- 2026-03-20 14:22:15.841 UTC [18421] ERROR: deadlock detected
2026-03-20 14:22:15.841 UTC [18421] DETAIL: Process 18421 waits for ShareLock on transaction 987654; blocked by process 18422.
2026-03-20 14:22:15.841 UTC [18421] CONTEXT: while locking tuple (0,14) in relation "inventory"
2026-03-20 14:22:15.841 UTC [18421] STATEMENT: UPDATE inventory SET quantity = quantity - 1 WHERE sku_id = 'IPH-15'
2026-03-20 14:22:15.842 UTC [18422] ERROR: deadlock detected
2026-03-20 14:22:15.842 UTC [18422] DETAIL: Process 18422 waits for ShareLock on transaction 987653; blocked by process 18421.
2026-03-20 14:22:15.842 UTC [18422] CONTEXT: while locking tuple (0,15) in relation "orders"
2026-03-20 14:22:15.842 UTC [18422] STATEMENT: UPDATE orders SET status = 'PAYING' WHERE id = 'ORD-2026-03-20-88421'
-- xid: 18421 = 987653 (T1, da khoa don ORD-88421, dang cho ton kho IPH-15)
-- xid: 18422 = 987654 (T2, da khoa ton kho IPH-15, dang cho don ORD-88421)
-- Chu ky cho: T1 khoá don ORD-88421 cho ton kho IPH-15; T2 khoa ton kho IPH-15 cho don ORD-88421.`,
    },
    {
      name: 'pg_stat_activity.txt',
      lang: 'text',
      content: ` pid  | usename | state  |         query_start         | wait_event_type | wait_event | xact_start
------+---------+--------+----------------------------+-----------------+------------+----------------------------
 18421 | shopapp | active | 2026-03-20 14:22:15.801+00 | Lock            | transactionid | 2026-03-20 14:22:15.785+00
 18422 | shopapp | active | 2026-03-20 14:22:15.803+00 | Lock            | transactionid | 2026-03-20 14:22:15.787+00
-- xid: 18421 = 987653 (giu don ORD-88421, cho ton kho IPH-15)
-- xid: 18422 = 987654 (giu ton kho IPH-15, cho don ORD-88421)
-- Hai phien deu wait_event_type = Lock, wait_event = transactionid: dang cho ShareLock tren transaction cua ben kia.`,
    },
    {
      name: 'app-deadlock.log',
      lang: 'text',
      content: `2026-03-20T14:22:15.843Z ERROR [http-nio-8080-exec-14] o.h.engine.jdbc.spi.SqlExceptionHelper - SQL Error: 0, SQLState: 40P01
2026-03-20T14:22:15.843Z WARN  [http-nio-8080-exec-14] org.springframework.dao.CannotAcquireLockException - deadlock detected
2026-03-20T14:22:15.843Z INFO  [http-nio-8080-exec-14] c.q.o.OrderService - confirmOrder(orderId=ORD-2026-03-20-88421) FAILED after 56ms
2026-03-20T14:22:15.844Z INFO  [http-nio-8080-exec-22] c.q.o.OrderService - confirmOrder(orderId=ORD-2026-03-20-88421) OK after 58ms (lan thu lai thanh cong)
-- pattern: client gui lai don sau timeout, hai transaction chay song song, mot trong hai bi deadlock`,
    },
  ],
  questions: [
    'Nguyên nhân gốc deadlock là gì? Dẫn chứng từ artifact (pid/transaction id, hai câu đang chờ).',
    'Vì sao thứ tự khóa lại ngược nhau giữa hai transaction? Giải thích dựa trên hai nhánh code khác nhau.',
    'Bạn sửa thế nào (ngắn hạn và dài hạn) để loại bỏ deadlock? Giải thích "khóa theo thứ tự cố định" và xử lý transaction bị huỷ.',
  ],
  hints: [
    'Hai transaction khoá cung hai tai nguyen (don ORD-88421 va ton kho IPH-15) nhung thu tu nguoc: T1 khoa don roi ton kho; T2 khoa ton kho roi don.',
    'Deadlock detector PostgreSQL chay sau deadlock_timeout (1 giay), phat hien chu ky cho va huy mot transaction (SQLState 40P01).',
    'Moi transaction bi huy phai retry toan bo transaction (bao quanh @Transactional) voi backoff + idempotency key, khong retry rieng cau lenh.',
  ],
  answer: `**Tóm tắt:** Hai transaction xac nhan cung don {{ORD-2026-03-20-88421}} va cung san pham {{IPH-15}} khoá hai tai nguyen theo thu tu nguoc nhau: {{T1}} khoa don hang roi ton kho, {{T2}} khoa ton kho roi don hang. PostgreSQL phat hien chu ky cho (wait-for cycle) sau {{deadlock_timeout}} (1 giay) va huy mot transaction voi loi {{SQLState 40P01}}. Day la loi thiet ke: hai transaction khoá cung hai tai nguyen theo thu tu khong nhat quan. Sua: khoa theo thu tu co dinh (luon khoa don hang truoc, roi ton kho — hoac khoa toan he thong theo (bang, id) tang dan), retry toan bo transaction co backoff + idempotency key.

### Tự vấn: deadlock là gì
**Deadlock** (khóa chết) xay ra khi hai hoac nhieu transaction moi giu mot khoa (tai nguyen) va dang cho khoa cua ben kia, tao thanh chu ky (cycle) trong do thi cho. PostgreSQL chay deadlock detector moi {{deadlock_timeout}} (mac dinh 1 giay); khi phat hien chu ky, no chon mot transaction lam **victim** (nguoi thau), rollback transaction do va tra loi {{SQLState 40P01}} (deadlock_detected). Transaction kia tuc tuc chay tiep.

Row-level lock trong PostgreSQL: cau {{UPDATE ... WHERE id = ...}} lay **exclusive lock** tren dong (tuple), luu trong header tuple ({{xmax}} = transaction id), khong hien trong {{pg_locks}}. Transaction khac muon cap nhat cung dong phai cho **ShareLock** tren transaction id dang giu khoa — dien trong {{pg_locks}} voi {{mode = ShareLock, granted = f}}.

### Nguyên nhân gốc, từng bước
1. Don {{ORD-2026-03-20-88421}} chua san pham {{IPH-15}}. Client gui lai don (retry) sau timeout -> hai request xac nhan chay song song.
2. **T1** (pid 18421, xid 987653, nhánh "xác nhận bình thường"): {{UPDATE orders SET status = 'PAYING' WHERE id = 'ORD-2026-03-20-88421'}} → giữ khoá đơn ORD-88421. Sau đó {{UPDATE inventory SET quantity = quantity - 1 WHERE sku_id = 'IPH-15'}} → **cho khoá tồn kho** (được T2 giữ).
3. **T2** (pid 18422, xid 987654, nhánh "đặt lại tồn kho"): {{UPDATE inventory SET quantity = quantity - 1 WHERE sku_id = 'IPH-15'}} → giữ khoá tồn kho IPH-15. Sau đó {{UPDATE orders SET status = 'PAYING' WHERE id = 'ORD-2026-03-20-88421'}} → **cho khoá đơn** (được T1 giữ).
4. **Chu kỳ cho**: T1 giữ đơn chờ tồn kho; T2 giữ tồn kho chờ đơn. Khong ben nao nhá khoá → deadlock detector chay luc 14:22:15.841 (sau khoang 1 giay cho), chon T1 lam victim (vi T1 bat dau cho truoc), rollback T1.

### Dẫn chứng
- Artifact 1 (log server): {{ERROR: deadlock detected}} tai PID 18421, kèm DETAIL hai chuong cua chu ky cho: **Process 18421 waits for ShareLock on transaction 987654; blocked by process 18422** va **Process 18422 waits for ShareLock on transaction 987653; blocked by process 18421**. Dòng {{CONTEXT: while locking tuple ... in relation inventory}} va {{STATEMENT: UPDATE inventory ... WHERE sku_id = 'IPH-15'}} cho T1 dang cho khoa ton kho; T2 log tuong tu cho don.
- Artifact 2 (pg_stat_activity): PID 18421 (xid 987653) va 18422 (xid 987654) deu {{wait_event_type = Lock}}, {{wait_event = transactionid}} — dang cho ShareLock tren transaction cua ben kia.
- Artifact 3 (log ung dung): {{CannotAcquireLockException}}, SQLState 40P01, don 88421 FAILED sau 56 ms, lan thu lai OK sau 58 ms (T2 chay tiep sau khi T1 rollback).

### Sơ đồ luồng
~~~seq
title: Deadlock hai transaction xac nhan cung don cung luc
actors: T1 | T2 | orders | inventory | PostgreSQL
T1 -> orders: khoa don ORD-88421
T2 -> inventory: khoa ton kho IPH-15
T1 -> inventory: khoa ton kho IPH-15 -> CHO
T2 -> orders: khoa don ORD-88421 -> CHO
note PostgreSQL: deadlock_timeout 1s, phat hien chu ky cho
PostgreSQL -> T2: huy T2 (victim, 40P01)
PostgreSQL -> T1: cap khoa ton kho, COMMIT
~~~

### Cách sửa ngắn hạn (hôm nay)
1. **Khoá theo thứ tự cố định:** trong transaction xác nhận đơn, **luôn khoá đơn hàng trước, rồi tồn kho** (theo mã đơn/mã sản phẩm tăng dần), bất kể nhánh code nào:
   ~~~java
   // Luon khoa don truoc, ton kho sau
   orderRepo.markPaying(orderId);          // UPDATE orders ... WHERE id = ?
   inventoryRepo.decrease(skuId, qty);    // UPDATE inventory ... WHERE sku_id = ?
   ~~~
   Cả hai nhánh code giờ khoá theo cùng thứ tự → không còn chu kỳ cho → không deadlock.
2. **Retry toàn bộ transaction:** bắt lỗi {{CannotAcquireLockException}} (Spring map từ SQLState 40P01) hoặc {{40001}} (serialization_failure), retry **toàn bộ transaction** (bọc bên ngoài {{@Transactional}}) 3 lần với exponential backoff + jitter (50 ms, 100 ms, 200 ms). Dùng {{@Retryable}} của Spring Retry trên method confirmOrder.
3. **Idempotency key:** mỗi API xác nhận đơn phải có khóa lặp lại (ví dụ {{orderId}}) để retry an toàn, không tạo đơn kép khi client gửi lại.

### Cách sửa dài hạn
- **Helper khoá theo thứ tự toàn hệ thống:** viết {{LockHelper.lockInOrder(List<LockResource> resources)}} sắp xếp theo (tên bảng, id) tăng dần, dùng cho mọi transaction khoá nhiều dòng; cấm dev tự sort theo nghiệp vụ (category, promotion, ASC/DESC).
- **Khoá ở mức DB:** dùng {{SELECT ... FOR UPDATE}} với {{ORDER BY sku_id}} ngay trong câu query để DB đảm bảo thứ tự, không phụ thuộc code Java.
- **Rút ngắn transaction:** chỉ khoá và UPDATE trong transaction; đọc đơn, tính toán promotion, validate nằm ngoài transaction.
- **Giám sát:** bật {{log_lock_waits = on}}, cảnh báo khi {{pg_stat_database.deadlocks}} tăng theo giờ; theo dõi {{pg_stat_activity}} có {{wait_event_type = 'Lock'}} và {{wait_event = 'transactionid'}}; alert khi có phiên chờ khoá > 500 ms.
- **Unit test concurrency:** mô phỏng 2 luồng xác nhận đơn có SKU chung, khẳng định không deadlock sau khi áp dụng sửa.

### Trả lời mẫu khi phỏng vấn
"Hai transaction xac nhan cung don va cung san pham khoá hai tai nguyen theo thu tu nguoc: T1 khoa don roi ton kho, T2 khoa ton kho roi don. PostgreSQL phat hien chu ky cho sau 1 giay, huy mot transaction (40P01). Day la loi thiet ke, khong phai loi cu PostgreSQL. Tua sua: (1) khoa theo thu tu co dinh (luon khoa don truoc, ton kho sau) trong tat ca nhanh code; (2) retry toan bo transaction 3 lan voi backoff + jitter; (3) idempotency key de retry khong tao don kep. Dai tien: helper khoa theo thu tu (bang, id) tang dan, SELECT FOR UPDATE ORDER BY o cua DB, thu nghiem dong bo."

### Phòng ngừa và monitoring
- Bật {{log_lock_waits = on}}, {{deadlock_timeout = 1s}} (mac dinh); canh bao khi {{pg_stat_database.deadlocks}} tang theo gio.
- Theo doi {{pg_stat_activity}} co {{wait_event_type = 'Lock'}} va {{wait_event = 'transactionid'}}; canh bao khi co phien cho khoá > 500 ms.
- Unit test dong bo: mo phong 2 luong xac nhan don co SKU chung, khong dinh khong deadlock sau sua.
- Dashboard: so deadlock/gio, p99 confirmOrder, ty le retry.

> Senior tip: **Thu tu khoa nhat quan la hop doi cua toan he thong**. Mot nhan code sap xep khac (category_name, promotion, ASC/DESC) du tao deadlock hiem gap, khoi tai hien. Quy tac cua toi: **moi transaction cap nhat nhieu dong phai khoa theo thu tu PK tang dan** — viet helper {{LockHelper.lockInOrder(skuIds)}} trung tam, cam dev tu sap xep. Va nho: deadlock khong phai bug cua PostgreSQL, no la co che bao ve du lieu; muc dich la lam cho no **re va tu hoi phuc** (thu tu khoa co dinh + retry + idempotency).`,
  rubric: [
    'Chỉ đúng nguyên nhân: hai transaction khoá cung hai tai nguyen (don ORD-88421 va ton kho IPH-15) theo thu tu nguoc, tao chu ky cho',
    'Dẫn chứng đúng: deadlock log Detail hai chuong chu ky (xid 987653/987654), pg_stat_activity wait_event=transactionid, log ung dung 40P01, T1 lam victim',
    'Giải thích đúng tại sao thu tu nguoc: hai nhánh code khac nhau (xac nhan binh thuong vs dat lai ton kho)',
    'Đề xuất sửa đúng: khoa theo thu tu co dinh (don truoc, ton kho sau), retry toan bo transaction backoff+jitter, idempotency key, rut ngan transaction',
    'Có phòng ngừa: log_lock_waits, canh bao deadlocks, unit test dong bo, idempotency key',
  ],
  tags: ['postgresql', 'deadlock', 'lock-ordering', 'inventory', 'order', 'retry'],
},
  {
    id: 'lab-sql-044',
    category: 'sql',
    title: 'Báo cáo doanh thu chậm dần từng tuần: statistics cũ vì autovacuum_analyze_scale_factor quá cao',
    level: 'senior',
    scenario: `**Bối cảnh.** Công ty bán lẻ **VinaRetail** chạy {{report-service}} (Spring Boot 3.3, JdbcTemplate) trên PostgreSQL **15.6** (RDS, 8 vCPU / 64 GB RAM). Bảng {{revenue_fact}} giữ doanh thu từng hoá đơn bán lẻ: sau 3 năm đã có **29.812.044 dòng** (~7,8 GB heap). Bảng danh mục {{branch}} chỉ có **850 dòng** (một dòng cho mỗi chi nhánh), chỉ có primary key trên {{id}}, không có index nào khác.

Mỗi tuần, job ETL nạp thêm khoảng **1,2 triệu dòng** mới (tức ~4% bảng) vào {{revenue_fact}}. Ngay sau đó, màn hình "Doanh thu theo chi nhánh" chạy câu:

~~~sql
SELECT b.branch_name, sum(f.amount) AS total
FROM revenue_fact f
JOIN branch b ON b.id = f.branch_id
WHERE f.region_code = 'R2'
  AND f.sale_date >= '2026-11-01' AND f.sale_date < '2026-11-08'
GROUP BY b.branch_name;
~~~

**Triệu chứng (11/11/2026).** Báo cáo tuần này chạy **14,2 giây**, CPU RDS 100% một core. Điều lạ là **cứ mỗi tuần lại chậm hơn**: 6 tuần trước cùng câu chỉ mất 1,1 giây, tuần trước 6 giây, tuần này 14 giây — không ai đổi code, không ai đổi index. Một bạn đề xuất "tăng {{work_mem}}", một bạn khác đề xuất "thêm {{pg_hint_plan}} ép Hash Join".

**Việc bạn có.** Ba artifact: log {{auto_explain}} của lần chạy chậm, snapshot thống kê lúc 09:20, và EXPLAIN sau khi DBA chạy {{ANALYZE}} thủ công. Hãy tìm nguyên nhân gốc, giải thích vì sao "chạy lại thì nhanh", và đề xuất cách sửa để tuần nào cũng ổn định.`,
    artifacts: [
      {
        name: 'auto-explain-0914.log',
        lang: 'text',
        content: `2026-11-11 09:14:02.118 +07 [66210] report@vinaretail LOG:  duration: 14218.442 ms  plan:
  Query Text: SELECT b.branch_name, sum(f.amount) FROM revenue_fact f JOIN branch b ON b.id = f.branch_id WHERE f.region_code = $1 AND f.sale_date >= $2 AND f.sale_date < $3 GROUP BY b.branch_name
  Query Parameters: $1 = 'R2', $2 = '2026-11-01', $3 = '2026-11-08'
  GroupAggregate  (cost=1180422.75..1180422.79 rows=38 width=24) (actual time=14205.118..14205.140 rows=38 loops=1)
    Group Key: b.branch_name
    ->  Nested Loop  (cost=0.57..1179980.10 rows=120 width=20) (actual time=0.412..14188.772 rows=1800000 loops=1)
          Buffers: shared hit=14523117 read=20114
          ->  Index Scan using idx_revenue_fact_region_date on revenue_fact f  (cost=0.57..412.30 rows=120 width=20) (actual time=0.211..912.441 rows=1800000 loops=1)
                Index Cond: ((region_code = $1) AND (sale_date >= $2) AND (sale_date < $3))
                Buffers: shared hit=2561180 read=18820
          ->  Seq Scan on branch b  (cost=0.00..2.10 rows=850 width=24) (actual time=0.001..0.003 rows=850 loops=1800000)
                Filter: (b.id = f.branch_id)
                Rows Removed by Join Filter: 1527350000
                Buffers: shared hit=11961937 read=1294
  Planning Time: 0.622 ms
  Execution Time: 14218.442 ms`,
      },
      {
        name: 'stats-snapshot-0920.txt',
        lang: 'text',
        content: `-- 2026-11-11 09:20:41 +07, RDS vinaretail-primary (PostgreSQL 15.6)
vinaretail=# SELECT relname, n_live_tup, n_mod_since_analyze, last_analyze, last_autoanalyze
            FROM pg_stat_user_tables WHERE relname = 'revenue_fact';
   relname    | n_live_tup | n_mod_since_analyze |       last_analyze       |     last_autoanalyze
--------------+------------+---------------------+--------------------------+--------------------------
 revenue_fact |   29812044 |             1203881 |                          | 2026-09-30 02:11:07+07
-- 6 tuần rồi KHÔNG analyze: batch mỗi tuần ghi ~1,2 triệu dòng nhưng chưa vượt ngưỡng tự analyze

vinaretail=# SHOW autovacuum_analyze_scale_factor;
 autovacuum_analyze_scale_factor
---------------------------------
 0.1
vinaretail=# SHOW autovacuum_analyze_threshold;
 autovacuum_analyze_threshold
------------------------------
 50
-- Ngưỡng tự analyze = 50 + 0.1 * 29.812.044 = 2.981.254 thay đổi.
-- Mỗi tuần chỉ 1.203.881 dòng (4%) < 2.981.254, nên autoanalyze KHÔNG bao giờ chạy.

vinaretail=# SHOW default_statistics_target;
 default_statistics_target
---------------------------
 100

vinaretail=# SELECT attname, n_distinct, most_common_vals, most_common_freqs
            FROM pg_stats WHERE tablename = 'revenue_fact' AND attname = 'region_code';
 attname     | n_distinct |        most_common_vals         |      most_common_freqs
-------------+------------+---------------------------------+---------------------------
 region_code |         12 | {R1,R2,R3,R4,R5,R6,R7,R8,R9,R10} | {0.21,0.06,0.05,0.04,0.03,0.02,0.02,0.02,0.02,0.01}
-- Khi statistics còn mới, R2 freq 0.06 * 29,8 triệu ≈ 1,79 triệu dòng (đúng thực tế).
-- Nhưng statistics hiện tại đã 6 tuần tuổi, batch mới nằm ngoài histogram của sale_date.

vinaretail=# SELECT indexdef FROM pg_indexes WHERE tablename = 'branch';
                 indexdef
------------------------------------------
 CREATE UNIQUE INDEX branch_pkey ON public.branch USING btree (id)
-- branch KHÔNG có index trên (branch_name) và KHÔNG có index trên region_code của fact`,
      },
      {
        name: 'explain-after-analyze-0930.txt',
        lang: 'text',
        content: `-- 2026-11-11 09:30:12 +07, DBA chạy tay: ANALYZE revenue_fact;  (mất 5,1 giây)
vinaretail=# EXPLAIN (ANALYZE, BUFFERS)
SELECT b.branch_name, sum(f.amount) AS total
FROM revenue_fact f
JOIN branch b ON b.id = f.branch_id
WHERE f.region_code = 'R2'
  AND f.sale_date >= '2026-11-01' AND f.sale_date < '2026-11-08'
GROUP BY b.branch_name;
                                                   QUERY PLAN
---------------------------------------------------------------------------------------------------------------
 GroupAggregate  (cost=2210.44..2210.48 rows=38 width=24) (actual time=1182.9..1182.9 rows=38 loops=1)
   Group Key: b.branch_name
   ->  Hash Join  (cost=1.62..2168.10 rows=1800000 width=20) (actual time=0.412..980.221 rows=1800000 loops=1)
         Hash Cond: (b.id = f.branch_id)
         Buffers: shared hit=2561180
         ->  Seq Scan on branch b  (cost=0.00..2.10 rows=850 width=24) (actual time=0.003..0.012 rows=850 loops=1)
               Buffers: shared hit=3
         ->  Hash  (cost=1.20..1.20 rows=1800000 width=20) (actual time=1.102..1.102 rows=1800000 loops=1)
               Buckets: 65536  Batches: 1  Memory Usage: 9437kB
               ->  Index Scan using idx_revenue_fact_region_date on revenue_fact f  (cost=0.57..412.30 rows=1800000 width=20) (actual time=0.211..902.114 rows=1800000 loops=1)
                     Index Cond: ((region_code = 'R2') AND (sale_date >= '2026-11-01') AND (sale_date < '2026-11-08'))
                     Buffers: shared hit=2561162
 Planning Time: 0.588 ms
 Execution Time: 1187.221 ms
-- rows ước lượng 1.800.000 KHỚP thực tế; Nested Loop (loops 1,8 triệu) đã đổi sang Hash Join (loops=1).`,
      },
    ],
    questions: [
      'Vì sao cùng một câu báo cáo, cùng dữ liệu, nhưng mỗi tuần lại chậm hơn? Chỉ ra con số ước lượng sai trong plan và giải thích nó đến từ đâu dựa vào snapshot thống kê.',
      'Vì sao chạy lại lúc 09:30 (sau ANALYZE) chỉ còn 1,2 giây? Vì sao autovacuum đang bật mà 6 tuần liền không tự analyze bảng này?',
      'Bạn sửa thế nào để tuần nào cũng ổn định? Đánh giá hai đề xuất tăng work_mem và pg_hint_plan ép Hash Join.',
    ],
    hints: [
      'So sánh rows=120 (ước lượng) với rows=1800000 (thực tế) ở node Index Scan on revenue_fact, rồi nhìn loops=1800000 ở Seq Scan on branch.',
      'Trong snapshot: last_autoanalyze = 30/09, n_mod_since_analyze = 1.203.881. Tính ngưỡng autoanalyze = 50 + 0.1 * 29.812.044 ≈ 2,98 triệu: mỗi tuần chỉ 4% thay đổi nên không bao giờ chạm ngưỡng.',
      'ANALYZE cập nhật lại MCV và histogram: region R2 freq 0.06 → 1,79 triệu dòng, planner thấy hết Nested Loop và chọn Hash Join. Sửa gốc là giảm autovacuum_analyze_scale_factor cho bảng lớn và/hoặc ANALYZE tường minh sau ETL.',
    ],
    answer: `**Tóm tắt:** Bảng {{revenue_fact}} có 29,8 triệu dòng nhưng {{autovacuum_analyze_scale_factor = 0.1}} khiến ngưỡng tự analyze là 50 + 0,1 × 29.812.044 ≈ **2,98 triệu** thay đổi. Mỗi tuần ETL chỉ nạp ~1,2 triệu dòng (4%), **không bao giờ chạm ngưỡng**, nên statistics đứng yên từ 30/09 suốt 6 tuần. Câu báo cáo chạy trên statistics cũ: planner ước lượng {{region_code = 'R2'}} chỉ **120 dòng** (thực tế **1.800.000**) nên chọn **Nested Loop**, quét bảng {{branch}} 850 dòng ở vòng trong **1,8 triệu lần** (1,53 tỉ phép so sánh) → 14,2 giây. Chạy {{ANALYZE}} thủ công cập nhật MCV (R2 ≈ 6% → 1,79 triệu), planner đổi sang **Hash Join** (loops=1) → 1,2 giây. Sửa gốc: {{ALTER TABLE revenue_fact SET (autovacuum_analyze_scale_factor = 0.02, autovacuum_analyze_threshold = 10000)}} cộng {{ANALYZE}} tường minh cuối ETL; tăng {{default_statistics_target}} cho cột lọc nếu cần. Tăng {{work_mem}} và {{pg_hint_plan}} đều không giải quyết gốc.

### Kiến thức nền: planner "đoán" số dòng thế nào
PostgreSQL dùng **cost-based optimizer**: với mỗi plan (Nested Loop, Hash Join, Merge Join) nó ước lượng chi phí dựa trên **số dòng dự kiến** của từng bước, rồi chọn plan rẻ nhất. Số dòng dự kiến lấy từ bảng thống kê {{pg_statistic}} (xem qua {{pg_stats}}) do {{ANALYZE}} tạo bằng cách **lấy mẫu** 300 × {{default_statistics_target}} = 30.000 dòng.

Ví dụ đời thường: bạn nhớ "tuần trước nhà 4 người ăn" nên mua 1 kg thịt. Hôm nay có 30 khách mà bạn không cập nhật, bạn vẫn mua 1 kg — plan cũng vậy: đúng với dữ liệu cũ, thảm hoạ với dữ liệu mới.

Các thống kê chính:
| Thống kê | Ý nghĩa | Dùng khi |
|---|---|---|
| {{reltuples}} | tổng số dòng ước lượng | mọi ước lượng |
| {{most_common_vals/freqs}} (MCV) | giá trị phổ biến và tần suất | điều kiện {{=}} |
| {{histogram_bounds}} | phân bố các giá trị còn lại | {{<}}, {{>}}, BETWEEN |
| {{n_distinct}} | số giá trị khác nhau | {{=}} với giá trị hiếm, GROUP BY |

### Vì sao autovacuum không tự analyze (điểm mấu chốt)
Ngưỡng autoanalyze của một bảng = {{autovacuum_analyze_threshold + autovacuum_analyze_scale_factor × reltuples}}. Với mặc định {{scale_factor = 0.1}} và bảng 29,8 triệu dòng, ngưỡng là **2,98 triệu**. Batch tuần chỉ 1,2 triệu (4%) nên **không bao giờ chạm**. Càng nhiều tuần trôi qua, dữ liệu mới (batch_id mới, sale_date mới) càng nằm ngoài histogram cũ, ước lượng càng lệch — đó là lý do "mỗi tuần chậm hơn" chứ không phải một sự cố đơn lẻ.

### Nguyên nhân gốc, từng bước
1. **30/09 02:11** autoanalyze chạy lần cuối (khi đó bảng còn nhỏ hơn và vừa vượt ngưỡng). Sau đó 6 tuần, mỗi tuần +1,2 triệu dòng nhưng < 2,98 triệu → autoanalyze không chạy.
2. **11/11 09:14** báo cáo chạy. Statistics vẫn của 30/09: MCV của {{region_code}} có R2 freq 0.06, nhưng histogram của {{sale_date}} dừng ở tuần cũ, và batch mới nằm ngoài. Planner nhân selectivity, kẹp ước lượng về **rows=120**.
3. Với "120 dòng" ở vòng ngoài, **Nested Loop** là rẻ nhất: quét {{branch}} (850 dòng) một lần cho mỗi dòng fact. Chi phí ước lượng chỉ 1.179.980.
4. Thực tế vòng ngoài trả **1.800.000** dòng, nên Seq Scan {{branch}} chạy **1.800.000 lần**: 1.800.000 × 849 = **1.527.350.000** dòng bị Join Filter loại. Toàn bộ từ RAM ({{Buffers: shared hit=14523117}}) nên là bài toán CPU, không phải I/O (khớp CPU 100% một core).
5. **09:30** DBA chạy {{ANALYZE revenue_fact}} (5,1 giây). Statistics mới: R2 ≈ 1,79 triệu. Planner chọn **Hash Join**: đọc {{branch}} 1 lần, dựng hash 9,4 MB, mỗi dòng fact tra hash O(1). 1,2 giây.

~~~text
Nested Loop (statistics cũ)                Hash Join (statistics mới)
for f in revenue_fact(1.800.000 dòng):     h = hash(branch)      -- 1 lần, 850 dòng
   for b in branch(850 dòng):              for f in revenue_fact(1.800.000 dòng):
      if match: emit                          b = h.get(f.branch_id)
=> 1,53 tỉ phép so sánh, 14,2 s            => 1,8 triệu tra hash, 1,2 s
~~~

### Dẫn chứng
- Log 09:14: **"Nested Loop ... rows=120 ... (actual ... rows=1800000 loops=1)"** — ước lượng 120, thực tế 1,8 triệu (lệch 15.000 lần).
- **"Seq Scan on branch b ... loops=1800000"** và **"Rows Removed by Join Filter: 1527350000"** — bảng danh mục bị quét lại 1,8 triệu lần.
- Snapshot: {{last_autoanalyze = 2026-09-30}}, {{n_mod_since_analyze = 1203881}}, {{autovacuum_analyze_scale_factor = 0.1}}, {{autovacuum_analyze_threshold = 50}} → ngưỡng 2.981.254 > 1.203.881.
- Plan 09:30: **Hash Join**, Seq Scan branch **loops=1**, Execution Time **1187 ms**; rows ước lượng 1.800.000 khớp thực tế.

### Cách sửa
**Ngắn hạn (hôm nay):**
- Thêm {{ANALYZE revenue_fact;}} vào **cuối ETL**, trước khi báo cho {{report-service}} chạy. ANALYZE chỉ lấy mẫu 30.000 dòng (~5 giây), rẻ hơn nhiều so với 14 giây rủi ro.
- Đặt {{statement_timeout}} cho role báo cáo (ví dụ 60 giây) để plan xấu không chiếm DB.

**Dài hạn:**
- Giảm ngưỡng autoanalyze cho bảng lớn: {{ALTER TABLE revenue_fact SET (autovacuum_analyze_scale_factor = 0.02, autovacuum_analyze_threshold = 10000);}} → ngưỡng còn 10.000 + 0,02 × 29,8 triệu ≈ 606.000, batch 1,2 triệu sẽ vượt.
- Nếu cột lọc có nhiều giá trị và cần độ chính xác cao: {{ALTER TABLE revenue_fact ALTER COLUMN region_code SET STATISTICS 500;}} rồi {{ANALYZE}}.
- Cân nhắc extended statistics nếu {{region_code}} và {{sale_date}} tương quan: {{CREATE STATISTICS ... (dependencies)}}.
- Tách bảng staging/partition theo tuần: ANALYZE partition nhỏ sau khi nạp, không phụ thuộc autoanalyze bảng cha.

**Về hai đề xuất:**
- **Tăng work_mem:** vô ích. Plan xấu không do thiếu bộ nhớ (Hash chỉ cần 9,4 MB). Vấn đề là ước lượng sai.
- **pg_hint_plan ép Hash Join:** chữa triệu chứng, khoá cứng plan; khi batch nhỏ, Hash Join có thể lại kém. Sửa gốc (statistics đúng) tốt hơn.

### Phòng ngừa và monitoring
- Bật {{auto_explain}} ({{log_analyze = on}}) và soi **tỉ lệ rows thực tế / rows ước lượng > 10 lần** ở mọi node.
- Alert khi {{n_mod_since_analyze / reltuples}} vượt ngưỡng autoanalyze mà {{last_autoanalyze}} cũ hơn 2 tuần.
- Dashboard theo dõi {{last_analyze}}, {{last_autoanalyze}}, {{n_mod_since_analyze}} cho các bảng lớn.

### Lỗi hay gặp
- Nghĩ "đã bật autovacuum thì statistics luôn mới": với bảng lớn, {{scale_factor = 0.1}} khiến autoanalyze hiếm khi chạy.
- Chạy lại thấy nhanh rồi kết luận "do DB lúc đó bận": thực ra plan đã khác. Luôn so plan, không so thời gian.
- Tạo {{CREATE STATISTICS}} nhưng quên {{ANALYZE}} nên không có tác dụng.

### Trả lời mẫu khi phỏng vấn
"Plan là Nested Loop với ước lượng 120 dòng nhưng thực tế 1,8 triệu, nên bảng branch bị quét 1,8 triệu lần, 1,53 tỉ phép so sánh, 14 giây. Statistics đứng yên 6 tuần vì autovacuum_analyze_scale_factor = 0.1 trên bảng 29,8 triệu dòng đặt ngưỡng autoanalyze ở 2,98 triệu thay đổi, trong khi mỗi tuần ETL chỉ nạp 1,2 triệu. Tôi chạy ANALYZE thủ công thì planner đổi sang Hash Join, còn 1,2 giây, và xác nhận bằng rows ước lượng khớp thực tế. Sửa gốc: giảm scale_factor cho bảng lớn (0.02) cộng ANALYZE tường minh cuối ETL, tăng statistics target cho cột lọc, theo dõi tỉ lệ rows thực tế/ước lượng bằng auto_explain. Tăng work_mem hay ép hint không giải quyết gốc."

> Senior tip: Mẫu "báo cáo chậm dần từng tuần, chạy lại thì nhanh" gần như luôn là **statistics cũ cộng ngưỡng autoanalyze quá cao cho bảng lớn**. Quy tắc của tôi: mọi bảng lớn (hàng chục triệu dòng) phải đặt {{autovacuum_analyze_scale_factor}} riêng (0.01–0.02) và mọi bước nạp dữ liệu lớn phải kết thúc bằng {{ANALYZE}} tường minh. Khi đọc EXPLAIN ANALYZE, việc đầu tiên không phải tìm Seq Scan mà là tìm node có **rows ước lượng lệch thực tế nhiều bậc** — gần như mọi plan tệ bắt nguồn từ đó.`,
    rubric: [
      'Chỉ ra ước lượng rows=120 so với thực tế 1.800.000 khiến planner chọn Nested Loop, vòng trong Seq Scan branch chạy 1.800.000 lần (Rows Removed by Join Filter 1,53 tỉ)',
      'Giải thích đúng vì sao autovacuum không tự analyze: ngưỡng 50 + 0.1 × 29.812.044 ≈ 2,98 triệu, batch tuần 1,2 triệu (4%) không chạm, last_autoanalyze 30/09',
      'Giải thích vì sao chạy lại nhanh (ANALYZE → statistics mới → Hash Join, rows khớp) và vì sao mỗi tuần chậm dần (dữ liệu mới ngày càng lệch histogram cũ)',
      'Đề xuất sửa đúng: ANALYZE tường minh cuối ETL, giảm autovacuum_analyze_scale_factor theo bảng, tăng statistics target, extended statistics, statement_timeout',
      'Phản biện đúng work_mem và pg_hint_plan; nêu monitoring auto_explain và tỉ lệ estimate vs actual, last_analyze',
    ],
    tags: ['postgresql', 'explain', 'statistics', 'analyze', 'autovacuum', 'nested-loop'],
  },
  {
    id: 'lab-sql-045',
    category: 'sql',
    title: 'Index-only scan chậm dần 8 ms lên 894 ms: transaction mở 6 giờ chặn vacuum cập nhật visibility map',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống hoá đơn điện tử **EInvoice VN** chạy {{report-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL **15.6** trên RDS, 8 vCPU / 64 GB RAM). Bảng {{invoice}} có **45.120.033 dòng** (~11 GB heap) và index {{idx_invoice_customer_status}} btree trên {{(customer_id, status)}}.

Màn hình "Tổng hợp hoá đơn theo trạng thái của một khách hàng" chạy câu index-only scan:

~~~sql
SELECT status, count(*) FROM invoice WHERE customer_id = $1 GROUP BY status;
~~~

Khách hàng lớn {{C-88213}} có **1.780.000** hoá đơn. Câu này trước đây chạy **8 ms** với {{Heap Fetches: 0}} (chỉ đọc index, không phải chạm heap). Ngoài ra, mỗi đêm có một job xuất hoá đơn {{InvoiceExportService}} bọc {{@Transactional}} quanh cả luồng stream kết quả ra client.

**Triệu chứng (11/11/2026).** Trong 2 tuần, p95 của câu tổng hợp leo từ **8 ms** lên **894 ms**, dung lượng đĩa tăng ~400 MB/ngày dù traffic không đổi, {{n_dead_tup}} tăng liên tục. EXPLAIN cho thấy cùng index, cùng câu, nhưng {{Heap Fetches}} nhảy từ 0 lên **1.780.000**. {{pg_stat_activity}} có một phiên {{idle in transaction}} đã mở **6 giờ**. DBA nghi "thiếu index" nhưng index đã có sẵn.

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE hiện tại (kèm baseline 2 tuần trước), snapshot {{pg_stat_activity}} + {{pg_stat_user_tables}} + log vacuum, và log ứng dụng. Hãy chỉ ra vì sao index-only scan chậm dần, vì sao autovacuum chạy mà không dọn được dead tuple, và đề xuất cách xử lý.`,
    artifacts: [
      {
        name: 'explain-index-only-0814.txt',
        lang: 'text',
        content: `-- 2026-11-11 08:14:12 +07, psql tren RDS einvoice-primary (PostgreSQL 15.6)
einvoice=# EXPLAIN (ANALYZE, BUFFERS)
SELECT status, count(*) FROM invoice WHERE customer_id = 'C-88213' GROUP BY status;
                                                              QUERY PLAN
---------------------------------------------------------------------------------------------------------------------------------------
 GroupAggregate  (cost=1842310.57..1842310.61 rows=3 width=17) (actual time=891.204..891.220 rows=3 loops=1)
   Group Key: status
   ->  Index Only Scan using idx_invoice_customer_status on invoice  (cost=0.57..1842305.10 rows=1780000 width=17) (actual time=8.204..889.771 rows=1780000 loops=1)
         Index Cond: (customer_id = 'C-88213'::text)
         Heap Fetches: 1780000
         Buffers: shared hit=1240118 read=540233
 Planning Time: 0.312 ms
 Execution Time: 894.712 ms
 (7 rows)

-- BASELINE 2 tuần trước (25/10), CÙNG câu, CÙNG index:
--   Index Only Scan using idx_invoice_customer_status on invoice ... (actual ... rows=1780000 loops=1)
--         Heap Fetches: 0
--         Buffers: shared hit=1780000 read=0
--   Execution Time: 8.103 ms
-- Chênh lệch: 8 ms -> 894 ms (~110 lần), Heap Fetches 0 -> 1.780.000.`,
      },
      {
        name: 'pg-activity-and-vacuum.txt',
        lang: 'text',
        content: `-- 2026-11-11 08:14:40 +07, RDS einvoice-primary
einvoice=# SELECT pid, state, wait_event_type, wait_event,
        now() - xact_start AS xact_age, now() - state_change AS idle_for,
        left(query, 58) AS query
FROM pg_stat_activity
WHERE datname = 'einvoice' AND state = 'idle in transaction';
  pid  |        state        | wait_event_type | wait_event |  xact_age  |  idle_for  |                           query
-------+---------------------+-----------------+------------+------------+------------+--------------------------------------------------------------
 20573 | idle in transaction | Client          | ClientRead | 06:00:12   | 05:59:48   | COPY (SELECT ... FROM invoice WHERE customer_id = $1) TO STDOUT
-- 20573 mở transaction lúc 02:14, đã 6 giờ, im lặng 5h59 (đang stream kết quả cho client đọc chậm)
-- Giữ xmin = 812344031, chặn vacuum dọn dead tuple VÀ chặn cập nhật visibility map.

einvoice=# SELECT relname, n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables WHERE relname = 'invoice';
 relname | n_live_tup | n_dead_tup |     last_autovacuum
---------+------------+------------+--------------------------
 invoice |   45120033 |    6200114 | 2026-11-11 06:40:11+07
-- autovacuum CHẠY lúc 06:40 nhưng không xoá được dead tuple vì xmin của 20573 còn giữ.

-- log server (log_autovacuum_min_duration = 0):
-- 2026-11-11 06:40:55 +07 [9012] LOG:  automatic vacuum of table "einvoice.public.invoice":
--   index scans: 1
--   pages: 0 removed, 1842310 remain, 0 skipped due to pins, 1842310 skipped due to freezing
--   tuples: 6200114 removed? NO -> found 0 removable, 6200114 nonremovable tuples in 1842310 pages
--   oldest xmin = 812344031 (held by pid 20573), oldest relfrozenxid = 754120000
--   statement: VACUUM (ANALYZE) invoice
-- Ghi chú: "0 removable, 6200114 nonremovable" = dead tuple vẫn bị xmin của 20573 giữ.

einvoice=# SHOW idle_in_transaction_session_timeout;
 idle_in_transaction_session_timeout
-------------------------------------
 0
-- 0 = PostgreSQL KHÔNG BAO GIỜ tự kết thúc phiên idle in transaction.`,
      },
      {
        name: 'app-export-and-leak.log',
        lang: 'text',
        content: `2026-11-11 02:13:58.220 INFO  [http-nio-8080-exec-9]  c.v.e.InvoiceExportService : export start customer=C-88213 format=csv
2026-11-11 02:14:00.118 DEBUG [http-nio-8080-exec-9]  o.h.SQL   : select i1_0.status, count(*) from invoice i1_0 where i1_0.customer_id=? group by i1_0.status
2026-11-11 02:14:00.140 INFO  [http-nio-8080-exec-9]  c.v.e.InvoiceExportService : @Transactional EXPORT begin, streaming rows to client (client doc cham)
2026-11-11 02:14:01.902 INFO  [http-nio-8080-exec-9]  c.v.e.InvoiceExportService : streamed 120000 rows (rate ~2000 rows/s, client throttle)
... (không có dòng COMMIT nào; connection vẫn bị giữ, không trả về Hikari pool)
2026-11-11 08:13:59.771 WARN  [http-nio-8080-exec-9]  c.z.h.pool.HikariPool    : HikariPool-1 - Connection is not available, request timed out after 30000ms (total=30, active=30, idle=0, waiting=41)
2026-11-11 08:14:02.004 ERROR [http-nio-8080-exec-9]  c.v.e.InvoiceExportService : export failed customer=C-88213 : could not open JPA transaction for nested exception
-- @Transactional bao ca luong export/stream ra client; client doc cham nen transaction mo 6 gio.
-- idle_in_transaction_session_timeout = 0 nen DB khong tu don; HikariCP khong co leakDetectionThreshold.`,
      },
    ],
    questions: [
      'Vì sao cùng câu index-only scan, cùng index, nhưng chậm dần từ 8 ms lên 894 ms? Dòng "Heap Fetches" trong EXPLAIN nói lên điều gì về visibility map?',
      'Vì sao autovacuum chạy lúc 06:40 mà không xoá được dead tuple, và điều đó liên quan thế nào tới index-only scan và "transaction mở 6 giờ"?',
      'Bạn xử lý ngay lúc 08:15 ra sao, và sửa lâu dài thế nào (idle_in_transaction_session_timeout, sửa code giữ transaction, VACUUM/REINDEX CONCURRENTLY, HikariCP leak detection)?',
    ],
    hints: [
      'So sánh Heap Fetches: 0 (baseline 25/10) với 1.780.000 (hiện tại): index-only scan mất khả năng "chỉ đọc index", mỗi dòng phải đọc thêm heap.',
      'Tìm pid 20573 idle in transaction 6 giờ: nó giữ xmin = 812344031, nên dead tuple không thể xoá VÀ visibility map không thể đánh dấu page all-visible.',
      'Log vacuum "found 0 removable, 6200114 nonremovable tuples" + oldest xmin do pid 20573 giữ; idle_in_transaction_session_timeout = 0 nên không tự dọn.',
    ],
    answer: `**Tóm tắt:** Một phiên {{idle in transaction}} mở **6 giờ** (transaction {{@Transactional}} bọc cả luồng export/stream ra client) đang giữ {{xmin = 812344031}}. Vì xmin này chưa được giải phóng, autovacuum **không xoá được dead tuple** ({{6.200.114 nonremovable}}) và **không cập nhật được visibility map** (không page nào được đánh dấu all-visible). Hệ quả: index-only scan mất khả năng "chỉ đọc index" — mỗi dòng phải đọc thêm heap ({{Heap Fetches: 1.780.000}} thay vì 0) → câu tổng hợp từ **8 ms lên 894 ms**, {{n_dead_tup}} tăng, bảng phình ~400 MB/ngày. Sửa ngay: {{pg_terminate_backend(20573)}} để nhả xmin, rồi {{VACUUM}} (hoặc để autovacuum chạy) cập nhật visibility map; đặt {{idle_in_transaction_session_timeout}}. Dài hạn: sửa code không giữ transaction khi stream/gọi I/O, thêm HikariCP {{leakDetectionThreshold}}, {{REINDEX CONCURRENTLY}} nếu index bloat.

### Kiến thức nền: index-only scan và visibility map
**Index-only scan** là chế độ đọc chỉ dùng index, **không chạm bảng (heap)** — nhanh hơn nhiều. Nhưng PostgreSQL chỉ dám bỏ qua heap khi **visibility map (VM)** của trang đó đã được đánh dấu **all-visible**, tức mọi dòng trên trang đều hiển thị với mọi transaction. VM chỉ được cập nhật bởi {{VACUUM}}/{{autovacuum}} (và một phần bởi DDL).

Khi VM chưa all-visible, index-only scan vẫn phải **đọc heap để kiểm tra visibility** cho từng dòng: đó là **"Heap Fetches"**. Số Heap Fetches = số dòng phải quay lại đọc heap. Nếu bằng 0, câu chạy hoàn toàn trên index; nếu bằng số dòng, nó đã thoái hoá thành index scan cộng đọc heap ngầm.

### Vì sao transaction mở lâu chặn cả vacuum lẫn VM
PostgreSQL không xoá dead tuple nào **còn có thể cần cho snapshot của một transaction đang chạy**. Ranh giới cũ nhất mà vacuum phải giữ gọi là **xmin horizon** ({{oldest xmin}}). Một phiên {{idle in transaction}} giữ {{xmin}} của nó suốt thời gian treo, nên:
1. Mọi dead tuple sinh ra sau {{xmin}} đó **không thể xoá** (chúng vẫn "cần" cho snapshot của phiên treo).
2. VM không thể đánh dấu page all-visible (vì chưa chắc mọi transaction đều thấy các dòng mới), nên index-only scan phải đọc heap.

### Nguyên nhân gốc, từng bước
1. **02:14** {{InvoiceExportService}} mở {{@Transactional}} bao quanh cả việc stream 1,78 triệu dòng ra client. Client đọc chậm (~2.000 dòng/giây) nên transaction mở **6 giờ**, không COMMIT.
2. Trong 6 giờ đó, các transaction khác vẫn INSERT/UPDATE {{invoice}} → sinh dead tuple. Nhưng {{oldest xmin}} bị ghim ở 812344031 (của pid 20573).
3. **06:40** autovacuum chạy, nhưng log ghi **"found 0 removable, 6200114 nonremovable tuples"** — không xoá được dòng nào, và VM không cập nhật.
4. Index-only scan của câu tổng hợp: vì VM không all-visible, mỗi dòng trong 1,78 triệu phải đọc heap → **Heap Fetches: 1.780.000**, {{Buffers: shared hit=1240118 read=540233}}, 894 ms.
5. {{idle_in_transaction_session_timeout = 0}} nên PostgreSQL không tự dọn; connection Hikari bị giữ, pool cạn, request khác timeout.

### Dẫn chứng
- EXPLAIN: **"Index Only Scan ... Heap Fetches: 1780000"**, baseline 2 tuần trước **"Heap Fetches: 0"**, **"Execution Time: 894.712 ms"** so với 8 ms.
- {{pg_stat_activity}}: pid 20573 {{idle in transaction}}, {{xact_age = 06:00:12}}, {{idle_for = 05:59:48}}, {{wait_event = ClientRead}}.
- {{pg_stat_user_tables}}: {{n_dead_tup = 6200114}}, {{last_autovacuum = 06:40}}. Log vacuum: **"found 0 removable, 6200114 nonremovable tuples"**, **"oldest xmin = 812344031 (held by pid 20573)"**.
- {{idle_in_transaction_session_timeout = 0}}; log ứng dụng: {{@Transactional}} bọc stream, không có COMMIT, Hikari timeout.

### Cách sửa
**Ngắn hạn (08:15):**
- {{SELECT pg_terminate_backend(20573);}} — kết thúc phiên treo, nhả xmin. Sau đó chạy {{VACUUM (ANALYZE) invoice;}} (ngoài giờ cao điểm nếu có thể) để cập nhật VM; index-only scan trở lại {{Heap Fetches: 0}}.
- Nếu index đã bloat nặng: {{REINDEX INDEX CONCURRENTLY idx_invoice_customer_status;}} (không khoá ghi).
- Đặt {{idle_in_transaction_session_timeout = '60s'}} (đổi DB parameter group của RDS, tham số dynamic) hoặc {{ALTER ROLE report_svc SET idle_in_transaction_session_timeout = '60s'}} cho connection mới.

**Dài hạn:**
- **Không giữ transaction khi stream/gọi I/O.** Mô hình đúng: transaction ngắn chỉ đọc dữ liệu cần xuất (hoặc đọc theo lô keyset), rồi **ngoài transaction** mới stream/ghi file/gọi mạng. Nếu cần nhất quán, dùng {{REPEATABLE READ}} với snapshot ngắn hoặc export theo batch có {{WHERE id > :lastId ORDER BY id LIMIT N}}.
- Bật HikariCP {{leakDetectionThreshold}} (ví dụ 60 giây) để log stack của connection giữ quá lâu.
- Đặt {{statement_timeout}} và {{idle_in_transaction_session_timeout}} cho role ứng dụng; không để mặc định 0.
- Giám sát {{oldest xmin}}, {{n_dead_tup}}, số phiên {{idle in transaction}}, và tỉ lệ {{Heap Fetches}} của các câu index-only.

### Phòng ngừa và monitoring
- Alert khi {{pg_stat_activity}} có {{state = 'idle in transaction'}} quá 60 giây, hoặc {{now() - xact_start}} > 5 phút.
- Alert khi {{n_dead_tup / n_live_tup}} > 20%, hoặc {{oldest xmin}} tiến gần {{autovacuum_freeze_max_age}}.
- Theo dõi {{Heap Fetches}} của các câu index-only quan trọng (qua {{pg_stat_statements}} hoặc auto_explain): tăng dần là dấu hiệu VM không được cập nhật.
- Quy tắc review: {{@Transactional}} không được bọc stream, gọi HTTP, ghi file hay gửi message.

### Lỗi hay gặp
- Nghĩ "index-only scan luôn nhanh": nó chỉ nhanh khi VM all-visible; một transaction treo đủ để phá điều đó.
- Thấy autovacuum chạy mà tưởng đã dọn: log {{nonremovable tuples}} mới cho biết nó bị xmin chặn.
- {{pg_terminate_backend}} rồi không {{VACUUM}}: VM chưa cập nhật ngay, cần một lượt vacuum.
- Chỉ đặt {{idle_in_transaction_session_timeout}} ở instance mà quên {{ALTER ROLE}}: connection cũ vẫn giữ giá trị cũ cho tới khi recycle.

### Trả lời mẫu khi phỏng vấn
"Index-only scan chậm dần vì visibility map không được cập nhật. Một phiên idle in transaction mở 6 giờ — do @Transactional bọc cả luồng stream export — giữ xmin 812344031, nên autovacuum không xoá được 6,2 triệu dead tuple và không đánh dấu page all-visible. Vì VM không all-visible, index-only scan phải đọc heap 1,78 triệu lần: Heap Fetches từ 0 lên 1.780.000, 8 ms thành 894 ms. Tôi terminate phiên treo, chạy VACUUM để cập nhật VM, đặt idle_in_transaction_session_timeout, và sửa code để không giữ transaction khi stream ra client; thêm HikariCP leakDetectionThreshold và REINDEX CONCURRENTLY nếu index bloat."

> Senior tip: **"Heap Fetches" tăng dần trên một câu index-only scan là dấu hiệu kinh điển của visibility map bị bỏ đói**, mà thủ phạm thường là một {{idle in transaction}} bị lãng quên. Quy tắc của tôi: {{idle_in_transaction_session_timeout}} là setting đáng bật nhất trên PostgreSQL, và {{@Transactional}} tuyệt đối không được bọc stream/gọi mạng. Một connection leak 6 giờ không chỉ làm chậm một câu — nó âm thầm phá index-only scan của cả hệ thống và làm bảng phình mỗi ngày.`,
    rubric: [
      'Chỉ đúng cơ chế: index-only scan chậm dần vì visibility map không all-visible nên Heap Fetches tăng 0 → 1.780.000 (8 ms → 894 ms)',
      'Giải thích đúng vì sao autovacuum không dọn được: phiên idle in transaction 6 giờ giữ xmin 812344031, log vacuum 0 removable / 6.200.114 nonremovable, idle_in_transaction_session_timeout = 0',
      'Dẫn chứng đúng số liệu: Heap Fetches, n_dead_tup 6,2 triệu, xact_age 6 giờ, oldest xmin, @Transactional bọc stream, Hikari timeout',
      'Đề xuất sửa đúng: pg_terminate_backend + VACUUM cập nhật VM, idle_in_transaction_session_timeout, sửa code không giữ transaction khi I/O, REINDEX CONCURRENTLY, HikariCP leakDetectionThreshold',
      'Có monitoring/phòng ngừa: alert idle in transaction/xact_age, n_dead_tup ratio, oldest xmin, theo dõi Heap Fetches, quy tắc review @Transactional không bọc I/O',
    ],
    tags: ['postgresql', 'vacuum', 'bloat', 'idle-in-transaction', 'visibility-map', 'index-only-scan'],
  },
  {
    id: 'lab-sql-046',
    category: 'sql',
    title: 'Phân trang OFFSET lớn chậm: quét trăm nghìn dòng rồi bỏ qua',
    level: 'senior',
    scenario: `**Bối cảnh.** Dịch vụ {{order-history}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) cung cấp endpoint {{GET /api/v1/orders?page=&size=}} để khách hàng xem lịch sử đơn hàng. Bảng {{orders}} có **50.000.000 dòng** (~11 GB heap). Index hiện có: {{idx_orders_customer_created}} (btree trên {{customer_id, created_at DESC}}).

**Triệu chứng (14/03/2026).** Trang đầu tiên (page=1, size=50) chạy khoảng **40 ms**. Nhưng khách hàng vào trang 10.000 (page=10000, size=50, tức OFFSET 499.950) thì p95 nhảy lên **8,2 giây**, CPU RDS từ 15% lên 78% trên một core. DBA chạy EXPLAIN ANALYZE và thấy planner dùng **Index Scan Backward** nhưng node **Offset** loại bỏ 499.950 dòng trước khi trả 50 dòng.

**Điều đã thử.** Tăng {{work_mem}}, tạo index composite (customer_id, created_at DESC), thêm {{LIMIT}} — không giảm. Một bạn đề xuất "tăng {{max_parallel_workers}}".

**Việc bạn có.** Hai artifact: EXPLAIN ANALYZE của câu OFFSET và EXPLAIN ANALYZE của câu viết lại theo kiểu keyset pagination. Hãy chỉ ra vì sao OFFSET lớn cùng chậm, và viết lại query để trang 10.000 chạy dưới 50 ms.`,
    artifacts: [
      {
        name: 'explain-offset-page10000.txt',
        lang: 'text',
        content: `-- 2026-03-14 10:05:12 +07, RDS order-history-primary (PostgreSQL 15.6)
orderdb=# EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.customer_id, o.total_amount, o.created_at, o.status
FROM orders o
WHERE o.customer_id = 'c7e3a1f2-8b4d-4f1a-9c6e-2d5b8a3f0e71'::uuid
ORDER BY o.created_at DESC
LIMIT 50 OFFSET 499950;
                                                           QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=1.43..24465.75 rows=50 width=72) (actual time=8123.456..8123.462 rows=50 loops=1)
   Buffers: shared hit=189432 read=1442
   ->  Offset  (cost=0.57..24415.75 rows=50 width=72) (actual time=0.018..8122.198 rows=500050 loops=1)
         ->  Index Scan Backward using idx_orders_customer_created on orders o  (cost=0.57..14408.75 rows=250000 width=72) (actual time=0.041..6204.321 rows=250000 loops=1)
               Index Cond: (customer_id = 'c7e3a1f2-...'::uuid)
               Buffers: shared hit=62501 read=1442
 Planning Time: 0.284 ms
 Execution Time: 8123.781 ms`,
      },
      {
        name: 'explain-keyset-page10000.txt',
        lang: 'text',
        content: `-- 2026-03-14 10:08:34 +07, sau khi sửa thành keyset pagination
orderdb=# EXPLAIN (ANALYZE, BUFFERS)
SELECT o.id, o.customer_id, o.total_amount, o.created_at, o.status
FROM orders o
WHERE o.customer_id = 'c7e3a1f2-8b4d-4f1a-9c6e-2d5b8a3f0e71'::uuid
  AND o.created_at < '2026-02-15 03:22:10.123456+07'::timestamptz
ORDER BY o.created_at DESC
LIMIT 50;
                                                           QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=0.43..6.18 rows=50 width=72) (actual time=0.032..0.048 rows=50 loops=1)
   Buffers: shared hit=4 read=0
   ->  Index Scan Backward using idx_orders_customer_created on orders o  (cost=0.43..6.18 rows=50 width=72) (actual time=0.031..0.047 rows=50 loops=1)
         Index Cond: ((customer_id = 'c7e3a1f2-...'::uuid) AND (created_at < '2026-02-15 03:22:10.123456+07'::timestamptz))
         Buffers: shared hit=4 read=0
 Planning Time: 0.284 ms
 Execution Time: 0.412 ms`,
      },
      {
        name: 'schema-orders.txt',
        lang: 'text',
        content: `-- 2026-03-14 10:10:00 +07
orderdb=# \\d orders
                       Table "public.orders"
   Column     |           Type           | Collation | Nullable | Default
--------------+--------------------------+-----------+----------+---------
 id           | uuid                     |           | not null |
 customer_id  | uuid                     |           | not null |
 total_amount | numeric(12,2)            |           | not null |
 status       | character varying(16)    |           | not null |
 created_at   | timestamp with time zone |           | not null | now()
 updated_at   | timestamp with time zone |           | not null | now()
Indexes:
    "orders_pkey" PRIMARY KEY, btree (id)
    "idx_orders_customer_created" btree (customer_id, created_at DESC)

orderdb=# SELECT count(*) FROM orders;
  count
--------
 50000000`,
      },
    ],
    questions: [
      'Vì sao câu truy vấn với OFFSET 499.950 chạy 8 giây dù có index (customer_id, created_at DESC)? Chỉ ra bằng node nào trong plan.',
      'Vì sao OFFSET càng lớn càng chậm, trong khi trang đầu tiên chỉ 40 ms? Giải thích chi phí của planner và chi phí thực tế.',
      'Hãy viết lại query bằng keyset pagination (cursor trên created_at) và giải thích vì sao cách này không phụ thuộc vào số trang đã qua.',
    ],
    hints: [
      'Node Offset trong plan có actual time 8122 ms và rows=500050: PostgreSQL phải quét 500.050 dòng qua index rồi BỎ QUA 499.950 dòng trước khi trả 50 dòng cuối cùng.',
      'OFFSET không giảm số dòng DB phải đọc — nó chỉ bỏ qua sau khi đã đọc. Chi phí thực tế tăng tuyến tính theo offset, không theo size.',
      'Keyset pagination: WHERE created_at < :lastCreatedAt AND customer_id = :c ORDER BY created_at DESC LIMIT 50. Index (customer_id, created_at DESC) tiếp tục được dùng, chỉ đọc 50 dòng mỗi lần.',
    ],
    answer: `**Tóm tắt:** Câu truy vấn {{SELECT ... ORDER BY created_at DESC LIMIT 50 OFFSET 499950}} dùng index đúng nhưng node **Offset** phải quét 500.050 dòng qua index rồi loại bỏ 499.950 dòng trước khi trả 50 dòng cuối → execution time 8,1 giây. OFFSET không làm giảm số dòng PostgreSQL phải đọc, nó chỉ loại bỏ sau khi đọc. Sửa bằng **keyset pagination**: {{WHERE customer_id = :c AND created_at < :lastCreatedAt ORDER BY created_at DESC LIMIT 50}} → chỉ đọc 50 dòng, execution time 0,4 ms (nhanh khoảng 20.000 lần).

### Kiến thức nền: OFFSET làm gì và không làm gì
{{LIMIT n OFFSET m}} nghĩa là "đọc kết quả, bỏ qua m dòng đầu, trả n dòng tiếp theo". Điểm mấu chốt: **PostgreSQL vẫn phải sinh ra m + n dòng** rồi mới loại bỏ m dòng. OFFSET không phải "nhảy tới vị trí m" — nó là "đọc và đếm".

Với câu dùng index {{(customer_id, created_at DESC)}}, planner có thể đọc tuần tự theo đúng thứ tự, nhưng vẫn phải duyệt qua từng entry của khách hàng đó cho tới khi đủ OFFSET. Khách hàng càng nhiều đơn, trang càng sâu thì càng chậm.

### Nguyên nhân gốc, từng bước
1. Câu gốc có {{LIMIT 50 OFFSET 499950}}. Planner dùng {{Index Scan Backward}} trên {{idx_orders_customer_created}} vì có {{customer_id = ?}} và sắp xếp {{created_at DESC}} — index khớp cả lọc lẫn sắp xếp.
2. Tuy nhiên PostgreSQL phải **quét từ đầu** index (từ created_at mới nhất) và đếm từng dòng đến khi đạt OFFSET. Node Offset trong plan có actual time 8122 ms, rows=500050 nghĩa là đọc 500.050 dòng.
3. 500.050 dòng được đọc từ index + heap (buffers 189.432 hit, 1.442 read), rồi **499.950 dòng bị loại bỏ** (Offset), chỉ còn 50 dòng trả về. Chi phí đọc I/O và CPU tăng tuyến tính theo offset.
4. Trang đầu tiên (OFFSET 0) chỉ đọc 50 dòng → 40 ms. Trang 10.000 phải đọc qua 500.000 dòng trước → 8 giây. Đây là chi phí thực tế của OFFSET lớn, không phải do thiếu index.

### Dẫn chứng
- Artifact 1: node **Offset (actual time=0.018..8122.198 rows=500050 loops=1)** — đọc 500.050 dòng, bỏ qua 499.950, trả 50; **Execution Time: 8123.781 ms**; **Buffers: shared hit=189432 read=1442**.
- Artifact 1: node **Index Scan Backward ... (actual time=0.041..6204.321 rows=250000 loops=1)** — đọc 250.000 dòng của khách hàng này (selectivity cao), không phải chỉ đọc 50.
- Artifact 2: câu viết lại keyset có **Execution Time: 0.412 ms**, chỉ đọc **Buffers: shared hit=4 read=0**, dùng cùng index mà không cần Offset.
- Artifact 3: bảng 50.000.000 dòng, index {{(customer_id, created_at DESC)}} đã tồn tại và được dùng đúng.

### Cách sửa ngắn hạn (hôm nay)
- Viết lại câu truy vấn thành keyset pagination:
~~~sql
SELECT o.id, o.customer_id, o.total_amount, o.created_at, o.status
FROM orders o
WHERE o.customer_id = :customerId
  AND o.created_at < :lastCreatedAt
ORDER BY o.created_at DESC
LIMIT 50;
~~~
- Ứng dụng lưu {{created_at}} của dòng cuối cùng trong trang hiện tại, gửi làm {{:lastCreatedAt}} cho trang tiếp theo. Không cần tham số {{page}}/{{OFFSET}}.
- Nếu vẫn cần biết tổng số trang (hiếm cần trong thực tế), dùng bảng đếm riêng hoặc approximate count, không dùng {{COUNT(*)}} trên 50 triệu dòng mỗi request.

### Cách sửa dài hạn
- **Không dùng OFFSET lớn** cho phân trang nào có dữ liệu tăng liên tục (đơn hàng, log, bài viết). Keyset pagination là pattern chuẩn.
- Nếu nghiệp vụ bắt buộc phải có "trang 10.000" (ví dụ admin duyệt đơn cũ), cân nhắc **partition theo tháng** trên {{created_at}}: truy vấn chỉ quét partition của tháng cần, OFFSET nhỏ hơn nhiều.
- **Covering index (INCLUDE)** nếu cần lấy thêm cột không trong index: {{CREATE INDEX ... ON orders (customer_id, created_at DESC) INCLUDE (total_amount, status)}} để tránh heap fetch, nhưng không cập nhật chi phí OFFSET.
- Theo dõi {{pg_stat_statements}}: cảnh báo khi câu truy vấn có {{rows}} lớn nhưng {{rows_returned}} nhỏ (tỉ lệ > 100:1) — dấu hiệu OFFSET/lọc lặp phí.

### Phòng ngừa và monitoring
- Quy tắc review: phân trang trên bảng lớn phải dùng keyset ({{WHERE cot < :cursor ORDER BY cot LIMIT n}}), cấm {{OFFSET > 10.000}} trừ khi có bằng chứng hiệu năng.
- Cảnh báo {{pg_stat_statements}}: {{total_exec_time}} cao với {{rows}} lớn và {{rows_returned}} nhỏ.
- Test hiệu năng trên dữ liệu production-like (50 triệu dòng) mọi accept PR.

### Trả lời mẫu khi phỏng vấn
"Câu truy vấn ORDER BY created_at DESC LIMIT 50 OFFSET 499.950 chạy 8 giây vì PostgreSQL dùng index nhưng node Offset phải quét 500.050 dòng rồi bỏ qua 499.950 dòng trước khi trả 50 dòng cuối. OFFSET không giảm số dòng đọc, chi phí tăng tuyến tính theo offset. Tôi viết lại bằng keyset pagination: WHERE customer_id = :c AND created_at < :lastCreatedAt ORDER BY created_at DESC LIMIT 50 — chỉ đọc 50 dòng, từ 8.123 ms xuống 0,4 ms. Không dùng OFFSET lớn trên bảng dữ liệu tăng liên tục; nếu bắt buộc phải có trang sau thì partition theo tháng."

> Senior tip: OFFSET lớn là "kẻ giết hiệu năng" tham lam — trang đầu chạy nhanh, trang sau chậm dần, team chỉ phát hiện khi khách hàng vào trang sau. Quy tắc vàng: **phân trang trên bảng lớn phải dùng keyset pagination (cursor), không dùng OFFSET**. Nếu quản trị viên insists xem "trang 10.000", hãy hỏi thực sự cần gì — thường là cần tìm kiếm/lọc, không phải xem tuần tự trăm nghìn trang.`,
    rubric: [
      'Chỉ đúng nguyên nhân: node Offset đọc 500.050 dòng rồi bỏ qua 499.950, trả 50; chi phí tăng tuyến tính theo offset, không phải do thiếu index',
      'Dẫn chứng đúng: artifact 1 Offset actual time 8122 ms rows=500050, execution time 8123 ms; artifact 2 keyset 0,4 ms, buffers 4 trang; cùng index được dùng',
      'Đề xuất sửa đúng: keyset pagination WHERE created_at < :cursor ORDER BY created_at DESC LIMIT 50, giải thích tại sao không phụ thuộc số trang đã qua',
      'Có phân biệt OFFSET (đọc rồi bỏ qua) vs keyset (đi trực tiếp đến vị trí cursor qua điều kiện index)',
      'Có monitoring/phòng ngừa: pg_stat_statements tỉ lệ rows/rows_returned, quy tắc review cấm OFFSET lớn, partition nếu bắt buộc trang sau',
    ],
    tags: ['postgresql', 'pagination', 'offset', 'keyset', 'explain', 'index-scan'],
  },
  {
    id: 'lab-sql-047',
    category: 'sql',
    title: 'Xoá khách hàng chậm vì thiếu chỉ mục khoá ngoại trên bảng đơn hàng',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống {{crm}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{customers}} lưu 2.000.000 khách hàng, bảng {{orders}} lưu **30.000.000 đơn hàng** (~7 GB heap). Cột {{orders.customer_id}} là khoá ngoại tham chiếu {{customers.id}}, nhưng **không có chỉ mục** trên {{orders.customer_id}}.

**Triệu chứng (14/03/2026, 14:30).** Admin xoá khách hàng nghiệp vụ: {{DELETE FROM customers WHERE id = 'cust-98765'}}. Câu chạy **45 giây**, timeout gateway. Trong lúc đó, mọi câu INSERT/UPDATE trên {{orders}} cũng chậm, pg_stat_activity đầy các viễn cảnh chờ lock. DBA chạy EXPLAIN ANALYZE thấy DELETE trên {{customers}} phải **Seq Scan toàn bảng {{orders}}** (30 triệu dòng) để kiểm tra ràng khoá ngoại.

**Điều đã thử.** Tăng {{max_connections}}, restart {{orders-service}} — không giảm. Một bạn đề xuất "xoá con không transaction".

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của DELETE khách hàng, chuẩn pg_locks, và schema hai bảng. Hãy chỉ ra vì sao xoá 1 dòng cha làm quét 30 triệu dòng con, và đề xuất cách sửa.`,
    artifacts: [
      {
        name: 'explain-delete-customer.txt',
        lang: 'text',
        content: `-- 2026-03-14 14:30:12 +07, RDS crm-primary (PostgreSQL 15.6)
crmdb=# EXPLAIN (ANALYZE, BUFFERS)
DELETE FROM customers WHERE id = 'cust-98765';
                                                              QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------
 Delete on customers  (cost=0.43..8.45 rows=1 width=16) (actual time=44987.123..44987.129 rows=1 loops=1)
   Buffers: shared hit=1875021 read=2144
   ->  Index Scan using customers_pkey on customers  (cost=0.43..8.45 rows=1 width=16) (actual time=0.021..0.045 rows=1 loops=1)
         Index Cond: (id = 'cust-98765')
   SubPlan 1
     ->  Seq Scan on orders  (cost=0.00..789123.45 rows=3 width=8) (actual time=0.012..44985.567 rows=12 loops=1)
           Filter: (customer_id = 'cust-98765')
           Rows Removed by Filter: 29999988
 Planning Time: 0.284 ms
 Execution Time: 44987.401 ms`,
      },
{
        name: 'pg-locks-delete.txt',
        lang: 'text',
        content: `-- 2026-03-14 14:30:15 +07, trong luc DELETE khach hang dang chay
crmdb=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age, left(query, 60) AS query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';
  pid  | state  | wait_event_type | wait_event |   xact_age   |                     query
-------+--------+-----------------+------------+--------------+--------------------------------------------------
  31105 | active | Lock            | relation   | 00:00:45     | DELETE FROM customers WHERE id = 'cust-98765'
  31106 | active | Lock            | relation   | 00:00:12     | INSERT INTO orders (customer_id, total_amount) VALUES ($1, $2)
  31107 | active | Lock            | relation   | 00:00:08     | UPDATE orders SET status = $1 WHERE id = $2
  31108 | active | Lock            | relation   | 00:00:05     | INSERT INTO orders (customer_id, total_amount) VALUES ($1, $2)

crmdb=# SELECT l.pid, l.locktype, l.relation::regclass AS relation, l.mode, l.granted
FROM pg_locks l
WHERE l.relation = 'orders'::regclass OR l.relation = 'customers'::regclass
ORDER BY l.pid, l.granted, l.locktype;
  pid  | locktype |   relation   |          mode          | granted
-------+----------+--------------+------------------------+---------
  31105 | relation | customers    | RowExclusiveLock       | t
  31105 | relation | orders       | RowShareLock           | t
  31106 | relation | orders       | RowExclusiveLock       | f
  31107 | relation | orders       | RowExclusiveLock       | f
  31108 | relation | orders       | RowExclusiveLock       | f
-- Ghi chu: DELETE (pid 31105) giu RowShareLock tren orders de kiem tra FK (trigger RI chay SELECT ... FOR SHARE);
-- cac INSERT/UPDATE moi vao orders can RowExclusiveLock. RowShareLock VA RowExclusiveLock TU THONG voi nhau,
-- NHUNG do Seq Scan khong co index, FK check chay 45 giay giu RowShareLock.
-- Khi co index, FK check la Index Scan (vai micro giay), RowShareLock chi giu rat ngan -> khong bi blocking.`,
      },
      {
        name: 'schema-customers-orders.txt',
        lang: 'text',
        content: `-- 2026-03-14 14:35:00 +07
crmdb=# \\d customers
                       Table "public.customers"
   Column |           Type           | Collation | Nullable | Default
---------+--------------------------+-----------+----------+---------
 id      | uuid                     |           | not null |
 name    | character varying(100)   |           | not null |
 email   | character varying(200)   |           | not null |
Indexes:
    "customers_pkey" PRIMARY KEY, btree (id)

crmdb=# \\d orders
                       Table "public.orders"
    Column    |           Type           | Collation | Nullable | Default
-------------+--------------------------+-----------+----------+---------
 id          | uuid                     |           | not null |
 customer_id | uuid                     |           | not null |
 total_amount| numeric(12,2)            |           | not null |
 status      | character varying(16)    |           | not null |
 created_at  | timestamp with time zone |           | not null | now()
Foreign-key constraints:
    "orders_customer_id_fkey" FOREIGN KEY (customer_id) REFERENCES customers(id)
Indexes:
    "orders_pkey" PRIMARY KEY, btree (id)
-- KHONG co index tren orders(customer_id) --`,
      },
    ],
    questions: [
      'Vì sao xoá 1 dòng trong {{customers}} lại phải Seq Scan toàn bảng {{orders}} 30 triệu dòng? Chỉ ra bằng node nào trong plan.',
      'Vì sao các câu INSERT/UPDATE trên {{orders}} cũng chậm khi DELETE khách hàng đang chạy? Giải thích bằng chuẩn pg_locks.',
      'Bạn sửa thế nào để xoá khách hàng dưới 100 ms và không chặn ghi đơn hàng? Giải thích tại sao CREATE INDEX CONCURRENTLY là bước đầu tiên.',
    ],
    hints: [
      'Node SubPlan 1 -> Seq Scan on orders (actual time=0.012..44985.567 rows=12) là PostgreSQL kiểm tra ràng khoá ngoại: quét toàn bảng orders tìm dòng nào có customer_id = cust-98765.',
      'DELETE giữ RowShareLock trên orders trong toàn thời gian kiểm tra FK (trigger RI chạy SELECT ... FOR SHARE); RowShareLock TU THONG với RowExclusiveLock (INSERT/UPDATE). Nhưng do Seq Scan 30 triệu dòng mất 45 giây, RowShareLock được giữ lâu → các INSERT/UPDATE vẫn phải chờ do tranh chấp I/O và lock queue.',
      'Thêm chỉ mục CONCURRENTLY trên orders(customer_id): PostgreSQL dùng index để kiểm tra FK, Index Scan chỉ mất vài micro giây, RowShareLock chỉ giữ trong thời gian cực ngắn → không chặn ghi đơn hàng. CONCURRENTLY không khoá bảng.',
    ],
    answer: `**Tóm tắt:** Câu {{DELETE FROM customers WHERE id = ?}} phải kiểm tra ràng khoá ngoại {{orders_customer_id_fkey}}: xem có đơn hàng nào tham chiếu khách hàng này không. Vì cột {{orders.customer_id}} **không có chỉ mục**, PostgreSQL phải **Seq Scan toàn bảng orders** (30 triệu dòng) để tìm dòng có {{customer_id = 'cust-98765'}}. DELETE trigger RI chay {{SELECT ... FOR SHARE}} trên orders, giu **RowShareLock** suot 45 giay kiem tra FK. RowShareLock TU THONG voi RowExclusiveLock (INSERT/UPDATE), nhung do Seq Scan lau, lock queue va I/O contention van gay cho. Sua: tao {{CREATE INDEX CONCURRENTLY idx_orders_customer ON orders(customer_id)}} -> PostgreSQL dung index kiem tra FK, xoa duoi 100 ms, RowShareLock chi giu micro giay, khong chan ghi don hang.

### Kiến thức nền: ràng khoá ngoại và chi phí kiểm tra
Khi bạn xoá (hoặc cập nhật khoá) một dòng ở bảng cha, PostgreSQL phải bảo đảm **không còn dòng nào ở bảng con tham chiếu tới nó** (ràng {{ON DELETE RESTRICT}} mặc định). Để kiểm tra, nó cần tìm trong bảng con mọi dòng có {{customer_id}} = giá trị vừa xoá.

Nếu cột khoá ngoại ở bảng con **có index**, việc tìm kiếm là {{Index Scan}} (vài micro giây). Nếu **không có index**, PostgreSQL buộc phải **Seq Scan toàn bảng con** — với 30 triệu dòng là 45 giây. Đây là lý do "xoá 1 dòng cha" lại thành "quét 30 triệu dòng con".

### Nguyên nhân gốc, từng bước
1. Cột {{orders.customer_id}} là khoá ngoại tham chiếu {{customers.id}}. Khi xoá một dòng trong {{customers}}, PostgreSQL phải xác minh không còn dòng nào trong {{orders}} tham chiếu đến khách hàng đó.
2. Vì không có chỉ mục trên {{orders.customer_id}}, PostgreSQL không thể tra nhanh → phải **Seq Scan toàn bảng orders** (30 triệu dòng) cho mỗi xoá khách hàng. Node SubPlan 1 trong plan xác nhận: Seq Scan, actual time 44.985 giây, rows removed 29.999.988.
3. Trigger RI (Referential Integrity) chay {{SELECT 1 FROM orders WHERE customer_id = $1 FOR SHARE}} de kiem tra FK. Cau nay lay **RowShareLock** tren bang orders. RowShareLock TU THONG voi RowExclusiveLock (INSERT/UPDATE), KHONG phai AccessShareLock.
3. Tuy nhiên, do Seq Scan 30 triệu dòng mất 45 giây, RowShareLock được giữ trong suốt thời gian đó. Dù RowShareLock TU THONG với RowExclusiveLock, việc giữ lock lâu + I/O contention + lock queue khiến các INSERT/UPDATE vẫn bị chờ (wait_event = relation).
4. Kết quả: xoá 1 dòng khách hàng làm chậm toàn bộ ghi đơn hàng, pg_stat_activity đầy các viễn cảnh chờ lock, gateway timeout.

### Dẫn chứng
- Artifact 1: node **SubPlan 1 -> Seq Scan on orders (actual time=0.012..44985.567 rows=12 loops=1)** — quét 30 triệu dòng, tìm 12 đơn hàng của khách hàng, bỏ qua 29.999.988; **Execution Time: 44987.401 ms**.
- Artifact 1: DELETE trên customers dùng Index Scan (0,045 ms) — nhanh, chậm thực sự là bước kiểm tra FK trên orders.
- Artifact 2: pid 31105 (DELETE) giữ **RowShareLock** trên orders (granted = t); pid 31106/31107/31108 (INSERT/UPDATE orders) cần RowExclusiveLock (granted = f) → đang chờ. RowShareLock TU THONG với RowExclusiveLock, nhưng lock queue + I/O contention do Seq Scan lâu vẫn gây chờ.
- Artifact 3: ràng hoà {{orders_customer_id_fkey}} tồn tại, nhưng **không có chỉ mục** trên {{orders.customer_id}} (chỉ có orders_pkey trên id).

### Cách sửa ngắn hạn (hôm nay)
- {{CREATE INDEX CONCURRENTLY idx_orders_customer ON orders(customer_id);}} — tạo chỉ mục không khoá bảng, có thể chạy trong giờ cao điểm. Sau khi tạo, PostgreSQL dùng index để kiểm tra FK, xoá khách hàng xuống dưới 100 ms, RowShareLock chỉ giữ micro giây, không chặn ghi đơn hàng.
- Nếu cần xoá ngay và chỉ mục chưa xong: xoá khách hàng ngoài giờ cao điểm, hoặc xoá đơn hàng của khách hàng trước rồi mới xoá khách hàng (2 câu DELETE riêng, trong một transaction).
- Huỷ DELETE đang treo: {{SELECT pg_terminate_backend(31105);}} để giải phóng RowShareLock, các INSERT/UPDATE orders hồi phục ngay.

### Cách sửa dài hạn
- **Luôn tạo chỉ mục cho cột khoá ngoại:** mọi cột FK tham chiếu bảng cha lớn nên có chỉ mục, để xoá/cập nhật cha không phải seq scan con. Quy tắc này áp dụng cho tất cả CSDL quan hệ.
- Nếu xoá khách hàng thường xuyên: cân nhắc xoá đơn hàng của khách hàng trong batch nhỏ (ví dụ 1.000 đơn/lần) rồi xoá khách hàng, giữ transaction ngắn.
- Xem xét {{ON DELETE CASCADE}} nếu nghiệp vụ cho phép xoá cùng lúc đơn hàng của khách hàng — nhưng cần cẩn trọng vì xoá hàng loạt 30 triệu dòng trong một transaction sẽ bloat WAL và giữ lock dài.
- Theo dõi {{pg_stat_user_indexes}}: nếu {{idx_scan = 0}} trên cột FK, chỉ mục có thể không cần — nhưng với xoá cha, chỉ mục FK là bắt buộc cho hiệu năng.

### Phòng ngừa và monitoring
- Quy tắc review: mọi khoá ngoại mới phải kèm chỉ mục trên cột con, trừ khi chứng minh không cần (ví dụ cha rất nhỏ, không xoá cha).
- Cảnh báo {{pg_stat_activity}} có viễn cảnh chờ lock (> 500 ms) trên bảng Orders; alert khi {{wait_event_type = 'Lock'}}.
- Test migration trên dữ liệu production-like: xoá khách hàng có nhiều đơn hàng nhất, đo thời gian trước và sau khi thêm chỉ mục FK.

### Trả lời mẫu khi phỏng vấn
"Xoá một khách hàng trong bảng customers chạy 45 giây vì PostgreSQL phải kiểm tra ràng khoá ngoại trên bảng orders 30 triệu dòng, nhưng cột customer_id trong orders không có chỉ mục nên phải Seq Scan toàn bảng. Trigger RI chạy SELECT FOR SHARE, giữ RowShareLock trong 45 giây. Dù RowShareLock TU THONG với RowExclusiveLock, việc giữ lock lâu + I/O contention vẫn gây chờ. Sửa: tạo CREATE INDEX CONCURRENTLY trên orders(customer_id) → PostgreSQL dùng index kiểm tra FK, xoá dưới 100 ms, RowShareLock chỉ giữ micro giây, không chặn ghi đơn hàng. Luôn tạo chỉ mục cho cột khoá ngoại tham chiếu bảng lớn."

> Senior tip: Khoá ngoại không tự động đi kèm chỉ mục ở phía bảng con. Nhiều dev nghĩ FK đã có index — sai. Vì sao xoá/cập nhật dòng trong bảng cha lớn có thể kết thúc bằng Seq Scan toàn bảng con, làm treo hệ thống. Quy tắc vàng: **mọi FK tham chiếu bảng lớn phải có index ở bảng con**, và xoá cha nên kiểm tra EXPLAIN trước khi deploy. Lưu ý: FK check dùng {{SELECT ... FOR SHARE}} lay **RowShareLock** (khong phai AccessShareLock), RowShareLock TU THONG voi RowExclusiveLock — van de chi xuat hien khi Seq Scan lau giu lock lau.`,
    rubric: [
      'Chỉ đúng nguyên nhân: xoá cha phải kiểm tra FK, không có chỉ mục trên cột con → Seq Scan toàn bảng con (30 triệu dòng), node SubPlan 1 là bằng chứng',
      'Dẫn chứng đúng: artifact 1 Seq Scan orders 44.985 giây rows removed 29.999.988; artifact 2 DELETE giữ RowShareLock orders, INSERT/UPDATE orders cần RowExclusiveLock bị chờ do lock queue + I/O contention từ Seq Scan lâu; artifact 3 không có index trên orders.customer_id',
      'Đề xuất sửa đúng: CREATE INDEX CONCURRENTLY idx_orders_customer ON orders(customer_id), xoá khoảng dưới 100 ms, không chặn ghi đơn hàng; huỷ DELETE đang treo nếu cần',
      'Có giải thích đúng: FK check dùng SELECT FOR SHARE lấy RowShareLock (TU THONG với RowExclusiveLock), vấn đề chỉ do Seq Scan lâu giữ lock lâu + I/O contention, không phải lock conflict trực tiếp',
      'Có monitoring/phòng ngừa: quy tắc luôn có index cho FK, cảnh báo chờ lock, test xoá cha trên dữ liệu production-like',
    ],
    tags: ['postgresql', 'foreign-key', 'index', 'delete', 'lock', 'access-share-lock'],
  },
  {
    id: 'lab-sql-048',
    category: 'sql',
    title: 'Báo cáo trên read replica hiển thị dữ liệu cũ do replication lag',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS) chạy một instance ghi (primary) và một read replica riêng cho dashboard báo cáo doanh thu. Ứng dụng ghi đơn hàng vào primary, dashboard đọc từ replica. Mặc định {{synchronous_commit = off}}: commit xong trên primary là trả kết quả cho ứng dụng, replica nộp nhận WAL và áp dụng dữ liệu khác một khoảng thời gian. Có replication slot {{order_replica_slot}} để giữ WAL cho replica.

**Triệu chứng (14/03/2026, 14:10–14:20).** Nhân viên bán hàng cập nhật đơn {{ORD-2026-03-14-88421}} từ {{PENDING}} sang {{SHIPPED}} trên primary, rồi refresh dashboard báo cáo. Dashboard vẫn hiển thị {{PENDING}} trong 35 giây mới chuyển sang {{SHIPPED}}. Khách hàng phàn nàn "đơn đã giao nhưng hệ thống vẫn hiện đang giao". CPU primary 30%, replica 20% — không phải quá tải, là vấn đề độ trễ sao chép (replication lag).

**Việc bạn có.** Ba artifact: pg_stat_replication trên primary, pg_stat_wal_receiver trên replica, và log ứng dụng ghi status đơn. Hãy chỉ ra nguyên nhân gốc, dẫn chứng bằng số liệu artifact, và đề xuất cách sửa để đọc luôn dữ liệu mới ngay sau khi ghi.`,
    artifacts: [
      {
        name: 'pg-stat-replication-primary.txt',
        lang: 'text',
        content: `-- 2026-03-14 14:15:02 +07, primary order-primary (PostgreSQL 15.6)
orderdb=# SELECT pid, usename, application_name, client_addr, state, sync_state,
               sent_lsn, write_lsn, flush_lsn, replay_lsn,
               write_lag, flush_lag, replay_lag
FROM pg_stat_replication;
  pid  | usename  | application_name |  client_addr  | state   | sync_state |  sent_lsn  |  write_lsn  |  flush_lsn  |  replay_lsn  | write_lag | flush_lag | replay_lag
-------+----------+------------------+---------------+---------+------------+------------+-------------+-------------+--------------+-----------+-----------+------------
  22110 | repuser  | order_replica    | 10.0.5.22     | streaming | async      | 0/1D9F00   | 0/1D8E00    | 0/1D8C00    | 0/1D8A00     |           |           | 00:00:35
-- sync_state = async (synchronous_commit = off), replay_lag = 35 giay: replica da nhan WAL den 0/1D8A00 nhung chua ap duoc, con primary da tien den 0/1D9F00.`,
      },
      {
        name: 'pg-stat-wal-receiver-replica.txt',
        lang: 'text',
        content: `-- 2026-03-14 14:15:02 +07, replica order-replica (PostgreSQL 15.6)
orderdb=# SELECT status, receiver_status, received_lsn, flushed_lsn,
               last_msg_send_time, last_msg_receipt_time, latest_end_lsn,
               latest_end_time, slot_name, sender_host, sender_port
FROM pg_stat_wal_receiver;
          status           |   receiver_status   |  received_lsn  |  flushed_lsn  |        last_msg_send_time        |     last_msg_receipt_time      |  latest_end_lsn  |         latest_end_time          |  slot_name   | sender_host | sender_port
---------------------------+---------------------+----------------+---------------+----------------------------------+--------------------------------+------------------+----------------------------------+--------------+-------------+-------------
 streaming                 | receive             | 0/1D8A00       | 0/1D8A00      | 2026-03-14 14:14:27.123+07       | 2026-03-14 14:14:27.125+07     | 0/1D9F00       | 2026-03-14 14:14:27.000+07       | order_replica_slot | 10.0.5.10   | 5432
-- received_lsn = flushed_lsn = 0/1D8A00, latest_end_lsn = 0/1D9F00: WAL da duoc gui den nhung chua ap dung het, chenh lech 35 giay so voi thoi gian primary ghi.`,
      },
      {
        name: 'app-order-status-log.txt',
        lang: 'text',
        content: `2026-03-14T14:14:27.001Z INFO  [http-nio-8080-exec-11] c.o.o.OrderService - updateOrderStatus(orderId=ORD-2026-03-14-88421, status=SHIPPED) OK in 45ms (ghi primary)
2026-03-14T14:14:28.102Z INFO  [http-nio-8080-exec-22] c.o.r.ReportController - GET /api/v1/reports/revenue?orderId=ORD-2026-03-14-88421 -> 200 status=PENDING (doc replica, 1 giay sau ghi)
2026-03-14T14:15:02.511Z INFO  [http-nio-8080-exec-33] c.o.r.ReportController - GET /api/v1/reports/revenue?orderId=ORD-2026-03-14-88421 -> 200 status=SHIPPED (doc replica, 35 giay sau ghi)
-- pattern: doc ngay sau ghi lay du lieu cu, phai dam doi 35 giay moi moi.`,
      },
    ],
    questions: [
      'Vì sao dashboard trên replica hiển thị status cũ 35 giây sau khi primary đã commit? Chỉ ra bằng dòng nào trong artifact.',
      'sync_state = async có ý nghĩa gì, và tại sao synchronous_commit = off là gốc rễ của vấn đề đọc-dữ-liệu-cứ?',
      'Bạn sửa thế nào để đọc luôn dữ liệu mới ngay sau khi ghi (read-after-write consistency)? Nêu cả cách ngắn hạn và dài hạn, kèm trade-off.',
    ],
    hints: [
      'replay_lag = 00:00:35 trong pg_stat_replication và received_lsn < latest_end_lsn trong pg_stat_wal_reducer cho thấy WAL chưa được áp dụng hết trên replica.',
      'Với synchronous_commit = off, primary trả kết quả ngay khi ghi WAL local xong, không chờ replica nhận hoặc áp dụng -> gap thời gian giữa ghi và đọc.',
      'Sửa ngắn hạn: ghi xong trên primary thì đọc lại từ primary (sticky session / read-after-write routing) trong vài giây, hoặc thiết lập synchronous_commit = remote_apply cho giao dịch quan trọng. Dài hạn: giám sát replay_lag, cảnh báo > 5 giây, điều hướng đọc dựa trên lag.',
    ],
    answer: `**Tóm tắt:** Dashboard đọc từ replica nhưng replica bị chậm 35 giây so với primary (replay_lag = 35s). Gốc rễ là {{synchronous_commit = off}}: primary commit xong (ghi WAL local) là trả kết quả, không chờ replica nhận hoặc áp dụng WAL, do đó đọc ngay sau ghi vẫn lấy dữ liệu cũ. Sửa: read-after-write routing (đọc primary trong vài giây sau ghi) hoặc {{synchronous_commit = remote_apply}} cho giao dịch quan trọng, kèm giám sát replay_lag cảnh báo > 5 giây.

### Tự vấn: replication lag là gì
PostgreSQL sao chép dữ liệu qua WAL (Write-Ahead Log). Primary ghi WAL, gửi đến replica qua walsender. replica nhận (received_lsn), ghi vào đĩa (flushed_lsn), rồi áp dụng vào bảng dữ liệu (replay_lsn). **Replication lag** là khoảng thời gian giữa lúc primary commit và lúc replica áp dụng xong (replay_lsn kịp latest_end_lsn). Mặc định {{synchronous_commit = off}} (local): primary trả kết quả khi WAL đã ghi xong local, không chờ replica -> luôn có khoảng trống đọc-cũ.

Ví dụ đời thường: như một chi nhánh nhận bản sao báo cáo từ trụ sở qua bưu điện. Trụ sở ký aprob (commit) xong thông báo nhân viên, nhưng bản sao tại chi nhánh đến 35 giây sau. Khách đến chi nhánh trong khoảng đó vẫn thấy báo cáo cũ.

### Nguyên nhân gốc, từng bước
1. Giao dịch cập nhật đơn ORDER-88421 từ PENDING sang SHIPPED trên primary với {{synchronous_commit = off}}.
2. Primary ghi WAL local, commit xong, trả OK cho ứng dụng trong 45 ms.
3. WAL được gửi đến replica (received_lsn tiến lên), nhưng replica chưa áp dụng hết (replay_lsn đứng lại 0/1D8A00).
4. Dashboard đọc replica 1 giây sau -> lấy trạng thái PENDING (dữ liệu chưa được replicate).
5. Sau 35 giây replica áp dụng xong -> đọc lại mới thấy SHIPPED.
6. CPU không cao vì không phải quá tải, chỉ là độ trễ sinh ra từ chế độ sao chép bất đồng bộ.

### Dẫn chứng
- Artifact 1 (pg_stat_replication): {{sync_state = async}}, {{replay_lag = 00:00:35}}, sent_lsn 0/1D9F00 nhưng replay_lsn 0/1D8A00 (chưa áp dụng hết).
- Artifact 2 (pg_stat_wal_receiver): {{received_lsn = flushed_lsn = 0/1D8A00}}, nhưng {{latest_end_lsn = 0/1D9F00}} — WAL đã nhận nhưng chưa áp dụng hết, chênh lệch tương đương 35 giây.
- Artifact 3 (log ứng dụng): đọc 1 giây sau ghi trả PENDING, đọc 35 giây sau mới trả SHIPPED — xác nhận gap 35 giây khớp với replay_lag.

### Cách sửa ngắn hạn (hôm nay)
- **Read-after-write routing:** sau khi ghi đơn trên primary, đọc lại từ primary trong cửa sổ vài giây (ví dụ 30 giây), sau đó mới chuyển về replica. Dùng sticky session theo orderId hoặc thread-local flag {{justWrote}}.
- **{{synchronous_commit = remote_apply}}** cho giao dịch quan trọng (cập nhật đơn hàng): primary chờ replica xác nhận đã áp dụng WAL trước khi trả kết quả. Trade-off: ghi chậm hơn (đợi khứ hồi mạng tới replica), áp dụng chỉ cho các giao dịch cần đọc-ngay-sau-ghi, không phải tất cả.

### Cách sửa dài hạn
- Giám sát {{replay_lag}} từ {{pg_stat_replication}}; cảnh báo khi > 5 giây, critical > 30 giây.
- Điều hướng đọc dựa trên lag: nếu replica lag quá ngưỡng, tự động chuyển đọc về primary (đảm bảo nhất quát, hy sinh tải replica).
- Xem xét {{synchronous_standby_names}} nếu cần đảm bảo tối thiểu một replica đồng bộ trước khi commit (cộng đồng cao nhất, chi phí ghi cao nhất).
- Thiết kế ứng dụng coi dữ liệu trên replica là "cuối cùng nhất quán" (eventually consistent), không đọc ngay sau ghi trừ khi dùng routing trên.

### Trả lời mẫu khi phỏng vấn
"Dashboard đọc từ read replica nhưng replica bị chậm 35 giây so với primary (replay_lag). Gốc là synchronous_commit = off: primary commit xong là trả kết quả, không chờ replica áp dụng WAL, nên đọc ngay sau ghi vẫn lấy dữ liệu cũ. Dẫn chứng: pg_stat_replication cho sync_state=async, replay_lag=35s; pg_stat_wal_receiver cho received_lsn < latest_end_lsn; log ứng dụng đọc 1 giây sau ghi trả PENDING, 35 giây sau mới SHIPPED. Sửa: read-after-write routing (đọc primary sau khi ghi) hoặc synchronous_commit=remote_apply cho giao dịch quan trọng, kèm giám sát replay_lag và cảnh báo. Trade-off là ghi chậm hơn do đợi replica."
`,
    rubric: [
      'Chỉ đúng nguyên nhân: replication lag (replay_lag = 35s) do synchronous_commit = off, primary không chờ replica áp dụng WAL',
      'Dẫn chứng đúng: artifact 1 sync_state=async + replay_lag 35s, artifact 2 received_lsn < latest_end_lsn, artifact 3 đọc-sau-ghi lấy dữ liệu cũ',
      'Đề xuất sửa đúng: read-after-write routing hoặc synchronous_commit=remote_apply, giải thích trade-off ghi chậm hơn, có giám sát replay_lag',
      'Có phân biệt replica là eventually consistent, không đọc ngay sau ghi trừ khi routing',
      'Có monitoring/cảnh báo replay_lag > 5 giây, điều hướng đọc theo lag',
    ],
    tags: ['postgresql', 'replication', 'read-replica', 'replication-lag', 'synchronous-commit', 'read-after-write'],
  },
  {
    id: 'lab-sql-049',
    category: 'sql',
    title: 'Chậm ghi do quá nhiều chỉ mục chưa dùng (index bloat/unused index)',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống {{event-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) ghi sự kiện người dùng vào bảng {{user_events}}. Bảng sau 18 tháng có **120.000.000 dòng** (~28 GB heap). Có 14 chỉ mục trên bảng, bao gồm nhiều chỉ mục được tạo cho các báo cáo ad-hoc đã không dùng nữa. Endpoint {{POST /api/v1/events}} ghi ~5.000 sự kiện/giây. p95 của INSERT nhảy từ 8 ms lên **220 ms**, CPU RDS từ 25% lên 78%, WAL tăng nhanh. DBA nghi ngờ "đĩa chậm" nhưng iostat bình thường.

**Triệu chứng (20/03/2026, 09:00–11:00).** INSERT chậm đều đều, không có spike. VACUUM chạy liên tục. pg_stat_user_indexes chỉ ra 6 chỉ mục có {{idx_scan = 0}} (không bao giờ được dùng), nhưng vẫn được bảo trì trên mỗi INSERT/UPDATE/DELETE. Hay tìm nguyên nhân gốc và cách giảm tải ghi mà không ảnh hưởng truy vấn đọc đang dùng.

**Việc bạn có.** Ba artifact: pg_stat_user_indexes, pg_stat_user_tables, và EXPLAIN ANALYZE của một truy vấn đọc quan trọng. Hãy chỉ ra chỉ mục nào không cần và cách dọn dẹp an toàn.`,
    artifacts: [
      {
        name: 'pg-stat-user-indexes.txt',
        lang: 'text',
        content: `-- 2026-03-20 09:10:00 +07, RDS event-primary (PostgreSQL 15.6)
eventdb=# SELECT relname, indexrelname, idx_scan, idx_tup_read, idx_tup_fetch, pg_size_pretty(pg_relation_size(indexrelid)) AS size
FROM pg_stat_user_indexes WHERE relname = 'user_events' ORDER BY idx_scan;
   relname   |     indexrelname     | idx_scan | idx_tup_read | idx_tup_fetch |   size
-------------+----------------------+----------+--------------+---------------+----------
 user_events | user_events_pkey     | 45200000 |   45200000   |    45200000   | 2800 MB
 user_events | idx_user_events_user | 32100000 |   32100000   |    32100000   | 3100 MB
 user_events | idx_user_events_ts   |  8500000 |    8500000   |     8500000   | 2900 MB
 user_events | idx_user_events_type |   120000 |     120000   |     120000    | 2200 MB
 user_events | idx_user_events_city |        0 |            0 |             0 | 2500 MB
 user_events | idx_user_events_dev  |        0 |            0 |             0 | 2100 MB
 user_events | idx_user_events_camp |        0 |            0 |             0 | 1900 MB
 user_events | idx_user_events_platform | 0  |            0 |             0 | 2300 MB
 user_events | idx_user_events_lang |        0 |            0 |             0 | 1800 MB
 user_events | idx_user_events_ver  |        0 |            0 |             0 | 1700 MB
-- 6 chi muc co idx_scan = 0 (city, dev, camp, platform, lang, ver), tong khoang 12.3 GB, khong bao giờ duoc su dung nhung duoc bao tri tren moi ghi.`,
      },
      {
        name: 'pg-stat-user-tables.txt',
        lang: 'text',
        content: `-- 2026-03-20 09:12:00 +07
eventdb=# SELECT relname, n_tup_ins, n_tup_upd, n_tup_del, n_dead_tup, last_vacuum, last_autovacuum
FROM pg_stat_user_tables WHERE relname = 'user_events';
   relname    |  n_tup_ins  |  n_tup_upd  | n_tup_del | n_dead_tup |       last_vacuum       |    last_autovacuum
-------------+-------------+-------------+-----------+------------+-------------------------+----------------------
 user_events | 72000000000 |      450000 |      3000 |    2400000 | 2026-03-20 08:55:00+07 | 2026-03-20 08:58:00+07
-- 72 nghìn tr억 tuple da duoc insert, n_dead_tup 2,4 trieu, autovacuum chay lien tuc de xu ly dead tuple tu cac cap nhat xoa. Mỗi INSERT phai cap nhat 14 chi muc.`,
      },
      {
        name: 'explain-read-query.txt',
        lang: 'text',
        content: `-- 2026-03-20 09:15:00 +07, truy vấn đọc báo cáo sự kiện theo user
eventdb=# EXPLAIN (ANALYZE, BUFFERS)
SELECT count(*) FROM user_events WHERE user_id = 'u-98765' AND event_ts >= '2026-03-01';
                                                              QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------
 Aggregate  (cost=458.72..458.73 rows=1 width=8) (actual time=3.456..3.457 rows=1 loops=1)
   ->  Index Scan using idx_user_events_user on user_events  (cost=0.43..458.72 rows=15 width=8) (actual time=0.121..3.452 rows=15 loops=1)
         Index Cond: ((user_id = 'u-98765'::uuid) AND (event_ts >= '2026-03-01'::date))
         Buffers: shared hit=12 read=0
-- Truy vấn đọc quan trọng chỉ dùng 2 chi muc: user_events_pkey và idx_user_events_user (hoặc composite), các chi muc idx_scan=0 không tham gia.`,
      },
    ],
    questions: [
      'Vì sao INSERT chậm (220 ms) dù iostat bình thường và không có spike? Liên hệ với số lượng chỉ mục.',
      'Chỉ mục nào nên bỏ (idx_scan = 0) và chỉ mục nào cần giữ? Giải thích bằng artifact.',
      'Bạn dọn dẹp thế nào an toàn mà không làm gián đoạn dịch vụ? Giải thích CONCURRENTLY và kiểm tra sau khi xóa.',
    ],
    hints: [
      'Mỗi INSERT/UPDATE/DELETE phải bảo trì tất cả 14 chỉ mục (ghi thêm vào mỗi cây B-tree), nên 6 chỉ mục chưa dùng vẫn tốn I/O và WAL mà không mang lại lợi ích đọc.',
      'idx_scan = 0 trong pg_stat_user_indexes nghĩa là chỉ mục chưa bao giờ được sử dụng — dấu hiệu rõ ràng cần xem xét xóa.',
      'Dùng DROP INDEX CONCURRENTLY để không khoá bảng, sau đó theo dõi idx_scan của các chỉ mục còn lại trong 1-2 tuần trước khi quyết định xóa vĩnh viễn.',
    ],
    answer: `**Tóm tắt:** Bảng {{user_events}} có 14 chỉ mục, trong đó 6 chỉ mục {{idx_scan = 0}} (không bao giờ dùng) tổng cộng khoảng 12.3 GB. Mỗi INSERT phải bảo trì cả 14 cây B-tree, khiến ghi chậm từ 8 ms lên 220 ms, CPU 78%, WAL tăng nhanh. Sửa: xóa các chỉ mục chưa dùng bằng {{DROP INDEX CONCURRENTLY}} (không khoá bảng), giữ chỉ mục phục vụ truy vấn đọc thực tế (pkey, idx_user_events_user...), sau đó theo dõi idx_scan trong 1-2 tuần.

### Tự vấn: chi phí của chỉ mục
Chỉ mục làm đọc nhanh nhưng làm ghi chậm. Mỗi lần INSERT/UPDATE/DELETE, PostgreSQL phải cập nhật mọi chỉ mục liên quan đến cột bị thay đổi: thêm/xóa mục trong mỗi cây B-tree, ghi WAL cho mỗi chỉ mục. Có 14 chỉ mục nghĩa là 1 lần ghi dữ liệu kèm 14 lần ghi chỉ mục. Các chỉ mục chưa dùng (idx_scan = 0) chỉ gây tổn hao ghi mà không mang lại lợi ích đọc. Ngoài ra, chỉ mục chưa dùng làm VACUUM làm việc nhiều hơn (phải quét chỉ mục để dọn entry tử) và Tối ưu hóa bỏ qua.

Ví dụ đời thường: như một quyển sách có 14 mục lục khác nhau (theo tác giả, theo chủ đề, theo năm, theo màu bìa...). Mỗi lần thêm sách mới vào kho, bạn phải cập nhật tất cả 14 mục lục. Nếu 6 mục lục không ai tra cứu, bạn vẫn phải cập nhật chúng mỗi lần thêm sách — công nhân bị làm nặng để không có ích lợi.

### Nguyên nhân gốc, từng bước
1. Bảng user_events 120 triệu dòng, 14 chỉ mục (một số từ báo cáo ad-hoc đã ngừng dùng).
2. Mỗi INSERT ~5.000 sự kiện/giây phải cập nhật 14 cây B-tree -> I/O và WAL lên cao.
3. 6 chỉ mục có idx_scan = 0 không bao giờ phục vụ truy vấn, nhưng vẫn được bảo trì trên mỗi ghi -> lãng phí ~12.3 GB chỉ mục.
4. CPU 78% là chi phí bảo trì chỉ mục, không phải I/O đĩa (iostat bình thường). Autovacuum chạy liên tục do dead tuple từ cập nhật/xóa.
5. p95 INSERT nhảy từ 8 ms lên 220 ms do mỗi ghi phải xử lý thêm 14 chỉ mục.

### Dẫn chứng
- Artifact 1 (pg_stat_user_indexes): 6 chỉ mục có {{idx_scan = 0}} (city, dev, camp, platform, lang, ver), tổng kích thước ~12.3 GB, chưa bao giờ được dùng. Các chỉ mục còn lại có idx_scan cao.
- Artifact 2 (pg_stat_user_tables): n_tup_ins 72 tỷ, n_dead_tup 2,4 triệu, autovacuum chạy liên tục — mức độ ghi lớn, chỉ mục được bảo trì liên tục.
- Artifact 3 (EXPLAIN): truy vấn đọc quan trọng chỉ dùng {{idx_user_events_user}} (Index Scan, 3.4 ms), các chỉ mục idx_scan=0 không tham gia.

### Cách sửa ngắn hạn (hôm nay)
- Xóa 6 chỉ mục chưa dùng bằng {{DROP INDEX CONCURRENTLY}}: idx_user_events_city, idx_user_events_dev, idx_user_events_camp, idx_user_events_platform, idx_user_events_lang, idx_user_events_ver. CONCURRENTLY không khoá bảng, có thể chạy trong giờ cao điểm (mãi lâu hơn nhưng an toàn).
- Sau khi xóa, theo dõi p95 INSERT và CPU trong 24-48 giờ. Mong đợi giảm đáng kể.
- Nếu không chắc chắn, có thể {{REINDEX CONCURRENTLY}} hoặc đánh dấu chỉ mục INVALID trước khi xóa hoàn toàn (không khuyên dùng cho production, dùng DROP CONCURRENTLY trực tiếp).

### Cách sửa dài hạn
- Quy tắc review: chỉ tạo chỉ mục khi có truy vấn thực tế cần, kèm EXPLAIN để chứng minh chỉ mục được dùng.
- Theo định kỳ (ví dụ quý) pg_stat_user_indexes: tìm chỉ mục {{idx_scan = 0}} trong 2-4 tuần và xem xét xóa.
- Cân nhắc chỉ mục composite thay vì nhiều chỉ mục đơn lẻ nếu truy vấn thường lọc theo cùng bộ cột.
- Giám sát pg_stat_user_tables (n_tup_ins/upd/del) và WAL generation rate để phát hiện sớm chi phí ghi do chỉ mục.
- Nếu cần chỉ mục cho báo cáo ad-hoc, cân nhắc bảng tóm tắt (summary table) hoặc cơ sở dữ liệu phân tích riêng, không thêm chỉ mục trực tiếp vào bảng ghi dữ liệu.

### Trả lời mẫu khi phỏng vấn
"Bảng user_events 120 triệu dòng có 14 chỉ mục, trong đó 6 chỉ mục chưa bao giờ được dùng (idx_scan=0) tính khoảng 12,3 GB. Mỗi INSERT phải bảo trì cả 14 cây B-tree nên ghi chậm từ 8 ms lên 220 ms, CPU 78%, WAL tăng nhanh. Dẫn chứng: pg_stat_user_indexes cho 6 chỉ mục idx_scan=0, truy vấn đọc quan trọng chỉ dùng idx_user_events_user. Sửa: DROP INDEX CONCURRENTLY các chỉ mục không dùng (không khoá bảng), giữ chỉ mục phục vụ đọc thực tế, theo dõi p95 INSERT sau xóa. Dài hạn: quy tắc review chỉ tạo chỉ mục khi có truy vấn cần, định kỳ dọn chỉ mục idx_scan=0, cân nhắc bảng tóm tắt cho báo cáo ad-hoc."
`,
    rubric: [
      'Chỉ đúng nguyên nhân: quá nhiều chỉ mục (14) làm mỗi INSERT phải bảo trì 14 cây B-tree, 6 chỉ mục idx_scan=0 lãng phí ~12.3 GB',
      'Dẫn chứng đúng: artifact 1 6 chỉ mục idx_scan=0, artifact 2 n_tup_ins lớn + autovacuum liên tục, artifact 3 truy vấn đọc chỉ dùng một số chỉ mục',
      'Đề xuất sửa đúng: DROP INDEX CONCURRENTLY các chỉ mục chưa dùng (không khoá bảng), giữ chỉ mục phục vụ đọc, theo dõi p95 INSERT sau xóa',
      'Có giải thích chi phí chỉ mục đối với ghi (I/O, WAL, VACUUM) và trade-off đọc-nhanh-ghi-chậm',
      'Có monitoring/dài hạn: định kỳ kiểm tra idx_scan=0, quy tắc review, bảng tóm tắt cho báo cáo ad-hoc',
    ],
    tags: ['postgresql', 'index', 'unused-index', 'insert-performance', 'wal', 'drop-index-concurrently'],
  },
  {
    id: 'lab-sql-050',
    category: 'sql',
    title: 'ALTER TABLE ADD CONSTRAINT CHECK VALIDATE khóa bảng 12 phút: full table scan với AccessExclusiveLock',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống **PayGate** (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) vận hành bảng {{transactions}} lưu lịch sử thanh toán: **42.300.000 dòng** (~14 GB heap + 3,2 GB index). Giờ cao điểm 11:00–13:00 có 3.500 req/s (80% đọc, 20% ghi). Đội data cần thêm ràng buộc: số tiền giao dịch phải dương và không vượt 500 triệu VND.
    
    **Triệu chứng (14/03/2026, 11:35).** DBA chạy migration:
    ~~~sql
    ALTER TABLE transactions ADD CONSTRAINT chk_amount_positive
      CHECK (amount > 0 AND amount <= 500000000);
    ~~~
    Lệnh chạy **12 phút 18 giây**. Trong lúc đó, toàn bộ API thanh toán trả 504. RDS CPU 100% một core, active connection nhảy từ 45 lên 480. pg_stat_activity đầy các SELECT/INSERT đang chờ lock.
    
    **Điều đã thử, không ăn.** Tăng max_connections, restart PgBouncer — không giảm. DBA nghĩ "CHECK constraint nhẹ, chỉ thêm metadata" — thực tế PostgreSQL phải quét toàn bảng để VALIDATE.
    
    **Việc bạn có.** Ba artifact: log server lúc 11:35–11:47, snapshot pg_locks lúc 11:35:30, và EXPLAIN ANALYZE của câu SELECT mẫu. Hãy chỉ ra vì sao CHECK constraint VALIDATE khóa bảng lâu, và đề xuất cách thêm ràng buộc an toàn trên bảng lớn.`,
    artifacts: [
      {
        name: 'postgres-check-validate.log',
        lang: 'text',
        content: `# log server PostgreSQL 15.6 (RDS paygate-primary), timezone Asia/Ho_Chi_Minh
# log_lock_waits = on, deadlock_timeout = 1s
2026-03-14 11:35:00.012 +07 [31245] LOG:  duration: 0.041 ms  execute S_1: BEGIN
2026-03-14 11:35:00.015 +07 [31245] LOG:  duration: 0.038 ms  execute <unnamed>: ALTER TABLE transactions ADD CONSTRAINT chk_amount_positive CHECK (amount > 0 AND amount <= 500000000)
2026-03-14 11:35:00.016 +07 [31245] LOG:  duration: 0.011 ms  execute <unnamed>: (chờ AccessExclusiveLock)
2026-03-14 11:35:00.089 +07 [31246] LOG:  duration: 0.022 ms  execute S_1: BEGIN
2026-03-14 11:35:00.091 +07 [31246] LOG:  duration: 0.031 ms  execute <unnamed>: SELECT id, amount, status FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
2026-03-14 11:35:00.092 +07 [31246] LOG:  duration: 0.009 ms  execute <unnamed>: (chờ lock)
# ... (hàng trăm phiên xếp hàng chờ AccessExclusiveLock)
2026-03-14 11:35:05.123 +07 [31245] LOG:  duration: 5123.456 ms  execute <unnamed>: VALIDATE CONSTRAINT chk_amount_positive  -- bắt đầu quét bảng
2026-03-14 11:47:18.678 +07 [31245] LOG:  duration: 733168.234 ms  execute <unnamed>: VALIDATE CONSTRAINT chk_amount_positive  -- kết thúc sau 12 phút 13 giây
2026-03-14 11:47:18.679 +07 [31245] LOG:  duration: 0.040 ms  execute S_2: COMMIT
2026-03-14 11:47:18.690 +07 [31246] LOG:  duration: 733687.112 ms  execute <unnamed>: SELECT ... (trả về)
# ... (các phiên drain xong trong ~10 giây)`,
      },
      {
        name: 'pg-locks-check.txt',
        lang: 'text',
        content: `-- 2026-03-14 11:35:30 +07, chụp khi migration đang VALIDATE
paygate=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       left(query, 60) AS query
FROM pg_stat_activity
WHERE pid IN (31245, 31246, 31247, 31248);
  pid  | state  | wait_event_type | wait_event   | xact_age  |                              query
-------+--------+-----------------+--------------+-----------+--------------------------------------------------------------
 31245 | active | IO              | DataFileRead | 00:00:30  | VALIDATE CONSTRAINT chk_amount_positive
 31246 | active | Lock            | relation     | 00:00:30  | SELECT id, amount, status FROM transactions WHERE user_id = $1
 31247 | active | Lock            | relation     | 00:00:30  | INSERT INTO transactions (user_id, amount) VALUES ($1, $2)
 31248 | active | Lock            | relation     | 00:00:30  | SELECT count(*) FROM transactions WHERE status = 'SUCCESS'

paygate=# SELECT l.pid, l.locktype, l.relation::regclass AS relation, l.mode, l.granted
FROM pg_locks l
WHERE l.pid IN (31245, 31246, 31247, 31248)
ORDER BY l.pid, l.granted, l.locktype;
  pid  | locktype |   relation   |          mode          | granted
-------+----------+--------------+------------------------+---------
 31245 | relation | transactions | AccessExclusiveLock    | t
 31246 | relation | transactions | AccessShareLock        | f
 31247 | relation | transactions | RowExclusiveLock       | f
 31248 | relation | transactions | AccessShareLock        | f

paygate=# SELECT count(*) AS waiting_sessions FROM pg_locks
WHERE NOT granted AND locktype = 'relation' AND relation = 'transactions'::regclass;
  waiting_sessions
------------------
               312

-- Ghi chú: migration (pid 31245) ĐANG GIỮ AccessExclusiveLock trong 12 phút do VALIDATE.
-- Mọi câu SELECT/INSERT/UPDATE mới phải chờ lock này (queue FIFO) -> toàn bộ bảng "treo".`,
      },
      {
        name: 'explain-select-transactions.txt',
        lang: 'text',
        content: `-- 2026-03-14 11:34:55 +07 (trước migration)
paygate=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, amount, status FROM transactions WHERE user_id = 'u-12345' ORDER BY created_at DESC LIMIT 20;
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
  Limit  (cost=0.57..8.45 rows=20 width=48) (actual time=0.412..0.428 rows=20 loops=1)
    Buffers: shared hit=5
    ->  Index Scan Backward using idx_transactions_user_created on transactions  (cost=0.57..8.45 rows=20 width=48) (actual time=0.411..0.426 rows=20 loops=1)
          Index Cond: (user_id = 'u-12345'::uuid)
          Buffers: shared hit=5
  Planning Time: 0.284 ms
  Execution Time: 0.451 ms`,
      },
    ],
    questions: [
      'Vì sao ALTER TABLE ADD CONSTRAINT CHECK ... không phải metadata-only mà phải quét toàn bảng? Chỉ ra bằng dòng nào trong artifact cho thấy VALIDATE chạy 12 phút.',
      'Vì sao migration giữ AccessExclusiveLock trong 12 phút (không phải chỉ chờ lock)? Giải thích sự khác biệt giữa ADD CONSTRAINT NOT VALID và VALIDATE CONSTRAINT.',
      'Hãy đề xuất quy trình an toàn để thêm CHECK constraint trên bảng 42 triệu dòng: ADD CONSTRAINT NOT VALID + VALIDATE CONSTRAINT (ShareUpdateExclusiveLock), đặt lock_timeout, và chạy ngoài giờ cao điểm.',
    ],
    hints: [
      'PostgreSQL ADD CONSTRAINT CHECK mặc định VALIDATE ngay — phải quét toàn bảng kiểm tra từng dòng, giữ AccessExclusiveLock suốt quá trình. NOT VALID chỉ thêm metadata (lock vài ms).',
      'Snapshot pg_locks cho thấy migration (pid 31245) GIỮ AccessExclusiveLock (granted = t) trong lúc VALIDATE, wait_event = DataFileRead (đang đọc đĩa quét bảng). 312 phiên chờ lock.',
      'Cách an toàn: (1) ALTER TABLE ... ADD CONSTRAINT ... NOT VALID (lock ngắn, metadata-only), (2) ALTER TABLE ... VALIDATE CONSTRAINT ... (cần ShareUpdateExclusiveLock, KHÔNG chặn SELECT/INSERT/UPDATE), (3) chạy VALIDATE ngoài giờ cao điểm với lock_timeout.',
    ],
    answer: `**Tóm tắt:** DBA chạy {{ALTER TABLE transactions ADD CONSTRAINT chk_amount_positive CHECK (...)}} — mặc định PostgreSQL làm VALIDATE ngay, phải **quét toàn bảng 42.3 triệu dòng** kiểm tra điều kiện. Quá trình VALIDATE mất **12 phút 18 giây**, trong đó migration giữ **AccessExclusiveLock** (mạnh nhất, không tương thích với mọi lock khác). Mọi SELECT/INSERT/UPDATE mới vào phải xếp hàng chờ -> 312 phiên bị chặn, API trả 504. CPU 100% một core do sequential scan đĩa. Sửa: dùng {{ADD CONSTRAINT ... NOT VALID}} (chỉ sửa catalog, lock vài ms) rồi {{VALIDATE CONSTRAINT}} riêng (cần {{ShareUpdateExclusiveLock}}, không chặn đọc/ghi) ngoài giờ cao điểm, kèm {{lock_timeout}}.
    
### Kiến thức nền: ADD CONSTRAINT VALIDATE vs NOT VALID
Khi thêm CHECK constraint, PostgreSQL có hai chế độ:
- **Mặc định (VALIDATE)**: sau khi thêm metadata, PostgreSQL **quét toàn bảng** để kiểm tra mọi dòng hiện tại thỏa mãn điều kiện. Quá trình này giữ **AccessExclusiveLock** — không cho phép bất kỳ truy cập nào khác.
- **NOT VALID**: chỉ thêm metadata vào {{pg_constraint}}, **không quét bảng**. Lock chỉ vài mili-giây (AccessExclusiveLock ngắn). Dữ liệu hiện tại có thể vi phạm, nhưng các INSERT/UPDATE mới sẽ bị kiểm tra.
- **VALIDATE CONSTRAINT** (riêng): sau khi đã ADD NOT VALID, chạy lệnh này để kiểm tra dữ liệu cũ. Lệnh này cần **ShareUpdateExclusiveLock** — **tương thích với AccessShareLock (SELECT) và RowExclusiveLock (INSERT/UPDATE)**. Chỉ chặn DDL khác (ALTER TABLE, CREATE INDEX...) và VACUUM FULL.

Ví dụ đời thường: nhà phố muốn lắp camera an ninh (constraint). Cách mặc định: đóng cửa cả phố 12 phút để kiểm tra từng nhà (VALIDATE). Cách an toàn: treo biển "đang lắp camera" vài giây (NOT VALID), sau đó bảo vệ đi kiểm tra từng nhà vào giờ ít người (VALIDATE CONSTRAINT) — người dân vẫn ra vào bình thường.

### Nguyên nhân gốc, từng bước
1. **11:35:00.015** DBA chạy {{ALTER TABLE ... ADD CONSTRAINT CHECK ...}}. PostgreSQL mặc định VALIDATE ngay.
2. Cần **AccessExclusiveLock** để sửa schema. Có một transaction ngắn đang giữ AccessShareLock -> migration chờ vài ms (log 11:35:00.016 "chờ AccessExclusiveLock").
3. **11:35:05.123** Lock được cấp, migration bắt đầu **VALIDATE CONSTRAINT** — quét tuần tự 42.3 triệu dòng, đọc đĩa (wait_event = DataFileRead).
4. Trong **12 phút 13 giây** (11:35:05 đến 11:47:18), migration **GIỮ AccessExclusiveLock**.
5. Mọi câu SELECT/INSERT/UPDATE ứng dụng vào sau đều phải chờ lock này (FIFO queue). Snapshot 11:35:30 cho 312 phiên chờ.
6. **11:47:18** VALIDATE xong, COMMIT, lock được nhả, 312 phiên drain xong ~10 giây.

### Dẫn chứng
- Artifact 1: log **"VALIDATE CONSTRAINT chk_amount_positive" duration: 733168.234 ms** (12 phút 13 giây), wait_event = DataFileRead.
- Artifact 2: migration pid 31245 **AccessExclusiveLock granted = t** (đang giữ), 312 phiên chờ AccessShareLock/RowExclusiveLock granted = f.
- Artifact 2: wait_event_type = Lock, wait_event = relation cho các phiên ứng dụng.
- Artifact 3: câu SELECT bình thường chỉ 0,45 ms khi không bị chặn.

### Cách sửa ngắn hạn (trong ngày)
- **Huỷ migration đang chạy**: {{SELECT pg_terminate_backend(31245);}} — VALIDATE bị huỷ, lock nhả, ứng dụng phục hồi ngay.
- **Chạy lại an toàn**: 
  1. {{ALTER TABLE transactions ADD CONSTRAINT chk_amount_positive CHECK (amount > 0 AND amount <= 500000000) NOT VALID;}} — metadata-only, ~5 ms.
  2. Ngoài giờ cao điểm: {{SET lock_timeout = '30s'; ALTER TABLE transactions VALIDATE CONSTRAINT chk_amount_positive;}} — cần ShareUpdateExclusiveLock, không chặn SELECT/INSERT/UPDATE. Nếu lock_timeout hết, tự bỏ cuộc thay vì treo hệ thống.

### Cách sửa dài hạn (quy trình migration an toàn)
1. **Luôn dùng NOT VALID cho CHECK/FK constraint trên bảng lớn**: ADD CONSTRAINT ... NOT VALID -> VALIDATE CONSTRAINT riêng.
2. **VALIDATE CONSTRAINT cần ShareUpdateExclusiveLock** — tương thích đọc/ghi, chỉ chặn DDL khác. Có thể chạy trong giờ cao điểm nếu cần (với lock_timeout).
3. **Bắt buộc lock_timeout cho mọi migration**: {{SET lock_timeout = '2s';}} trước ALTER TABLE. Migration tự bỏ cuộc nếu không lấy được lock trong 2 giây.
4. **Chạy migration ngoài giờ cao điểm** (02:00–04:00) hoặc maintenance window.
5. **Test trên clone production** (RDS snapshot restore) đo thời gian VALIDATE trước khi apply production.
6. **Quy tắc review**: mọi ADD CONSTRAINT CHECK/FK trên bảng > 1 triệu dòng phải kèm kế hoạch NOT VALID + VALIDATE riêng.

### Phòng ngừa và monitoring
- Alert khi có phiên giữ AccessExclusiveLock > 5 giây trên bảng production.
- Theo dõi {{pg_stat_activity}} với {{wait_event_type = 'Lock'}} và {{wait_event = 'relation'}}; alert khi số phiên chờ > 50.
- Cảnh báo {{log_lock_waits = on}} ghi nhận lock wait > 1 giây.
- Dashboard: số migration VALIDATE chạy, thời gian trung bình.

> Senior tip: "CHECK constraint nhẹ, chỉ thêm metadata" là suy nghĩ sai lầm phổ biến nhất. PostgreSQL **mặc định VALIDATE** — quét toàn bảng, giữ AccessExclusiveLock. Trên bảng 40 triệu dòng có thể mất 10–20 phút. Quy tắc vàng: **ADD CONSTRAINT ... NOT VALID, rồi VALIDATE CONSTRAINT riêng (ShareUpdateExclusiveLock) ngoài giờ cao điểm, kèm lock_timeout**. Đừng bao giờ chạy ADD CONSTRAINT mặc định trong giờ cao điểm trên bảng lớn.`,
    rubric: [
      'Chỉ đúng nguyên nhân: ADD CONSTRAINT CHECK mặc định VALIDATE ngay, quét toàn bảng 42.3 triệu dòng giữ AccessExclusiveLock 12 phút, chặn 312 phiên',
      'Dẫn chứng đúng: artifact 1 VALIDATE duration 733168 ms, DataFileRead; artifact 2 AccessExclusiveLock granted=t, 312 phiên chờ; artifact 3 SELECT bình thường 0.45 ms',
      'Giải thích đúng sự khác biệt: NOT VALID (metadata-only, lock ms) vs VALIDATE (ShareUpdateExclusiveLock, tương thích đọc/ghi)',
      'Đề xuất sửa đúng: ADD CONSTRAINT NOT VALID + VALIDATE CONSTRAINT riêng, lock_timeout, chạy ngoài giờ cao điểm',
      'Có monitoring/phòng ngừa: alert AccessExclusiveLock lâu, lock_waits, quy tắc review NOT VALID cho bảng lớn',
    ],
    tags: ['postgresql', 'alter-table', 'check-constraint', 'validate', 'access-exclusive-lock', 'migration'],
  },
  {
    id: 'lab-sql-051',
    category: 'sql',
    title: 'OR điều kiện trên bảng phân vùng: partition pruning thất bại, quét 12 partition',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống **LogiTrack** (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) lưu log giao dịch trong bảng {{txn_log}} **phân vùng theo tháng (RANGE trên created_at)**. Bảng có 12 partition (tháng 1/2025 đến 12/2025), mỗi partition ~2.5 triệu dòng, tổng **30.000.000 dòng** (~9 GB). Có index cục bộ {{idx_txn_log_user}} trên {{(user_id, created_at DESC)}} trong từng partition.
    
    Endpoint {{GET /api/v1/txn/search?userId=&fromDate=&toDate=}} cho phép tìm giao dịch theo user_id HOẶC theo khoảng thời gian (logic OR do frontend gửi cả hai tham số, backend xây WHERE động).
    
    **Triệu chứng (14/03/2026, 10:00).** Query tìm giao dịch của user {{u-88990}} trong tháng 3/2025 (fromDate=2025-03-01, toDate=2026-03-31) chạy **8,4 giây**, CPU RDS 92% một core. EXPLAIN cho thấy planner quét **12 partition** thay vì chỉ partition tháng 3. DBA nghĩ "index không hiệu quả" — thực tế là partition pruning thất bại do điều kiện OR.
    
    **Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu OR, EXPLAIN ANALYZE của câu viết lại bằng UNION ALL, và danh sách partition. Hãy chỉ ra vì sao OR phá vỡ partition pruning, và viết lại query để planner chỉ quét partition cần thiết.`,
    artifacts: [
      {
        name: 'explain-or-partition.txt',
        lang: 'text',
        content: `-- 2025-03-14 10:05:12 +07, RDS logistic-primary (PostgreSQL 15.6)
logistics=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, user_id, amount, created_at, status
FROM txn_log
WHERE user_id = 'u-88990'::uuid
   OR (created_at >= '2025-03-01'::timestamptz AND created_at < '2025-04-01'::timestamptz)
ORDER BY created_at DESC
LIMIT 50;
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
  Limit  (cost=1245.67..1245.71 rows=50 width=64) (actual time=8342.112..8342.118 rows=50 loops=1)
    Buffers: shared hit=189432 read=1442
    ->  Sort  (cost=1245.67..1245.71 rows=50 width=64) (actual time=8342.110..8342.115 rows=50 loops=1)
          Sort Key: created_at DESC
          Sort Method: top-N heapsort  Memory Usage: 32kB
    ->  Append  (cost=0.57..1245.63 rows=150 width=64) (actual time=0.018..8338.456 rows=150 loops=1)
          ->  Seq Scan on txn_log_2025_01  (cost=0.00..45678.12 rows=12 width=64) (actual time=0.012..689.234 rows=12 loops=1)
                Filter: (user_id = 'u-88990'::uuid) OR ((created_at >= '2025-03-01'::timestamptz) AND (created_at < '2025-04-01'::timestamptz))
                Rows Removed by Filter: 2499988
          ->  Seq Scan on txn_log_2025_02  (cost=0.00..45678.12 rows=12 width=64) (actual time=0.011..692.101 rows=12 loops=1)
                Filter: (user_id = 'u-88990'::uuid) OR ((created_at >= '2025-03-01'::timestamptz) AND (created_at < '2025-04-01'::timestamptz))
                Rows Removed by Filter: 2499988
          # ... (10 partition khác tương tự)
          ->  Seq Scan on txn_log_2025_03  (cost=0.00..45678.12 rows=12 width=64) (actual time=0.010..695.321 rows=12 loops=1)
                Filter: (user_id = 'u-88990'::uuid) OR ((created_at >= '2025-03-01'::timestamptz) AND (created_at < '2025-04-01'::timestamptz))
                Rows Removed by Filter: 2499988
  Planning Time: 0.812 ms
  Execution Time: 8342.451 ms`,
      },
      {
        name: 'explain-union-all-partition.txt',
        lang: 'text',
        content: `-- 2025-03-14 10:12:45 +07, sau khi viết lại UNION ALL
logistics=# EXPLAIN (ANALYZE, BUFFERS)
WITH matched AS (
  SELECT id, user_id, amount, created_at, status
  FROM txn_log
  WHERE user_id = 'u-88990'::uuid
  UNION ALL
  SELECT id, user_id, amount, created_at, status
  FROM txn_log
  WHERE created_at >= '2025-03-01'::timestamptz
    AND created_at < '2025-04-01'::timestamptz
)
SELECT DISTINCT ON (id) id, user_id, amount, created_at, status
FROM matched
ORDER BY id, created_at DESC
LIMIT 50;
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
  Limit  (cost=12.44..12.48 rows=50 width=64) (actual time=0.412..0.418 rows=50 loops=1)
    Buffers: shared hit=8 read=0
    ->  Unique  (cost=12.44..12.48 rows=50 width=64) (actual time=0.410..0.415 rows=50 loops=1)
          ->  Sort  (cost=12.44..12.48 rows=50 width=64) (actual time=0.408..0.412 rows=50 loops=1)
                Sort Key: id, created_at DESC
                Sort Method: quicksort  Memory Usage: 32kB
          ->  Append  (cost=0.42..12.36 rows=100 width=64) (actual time=0.031..0.387 rows=100 loops=1)
                      ->  Index Scan Backward using txn_log_2025_03_user_id_created_at_desc_idx on txn_log_2025_03  (cost=0.42..6.18 rows=50 width=64) (actual time=0.021..0.192 rows=50 loops=1)
                      Index Cond: (user_id = 'u-88990'::uuid)
                ->  Index Scan Backward using txn_log_2025_03_created_at_idx on txn_log_2025_03  (cost=0.42..6.18 rows=50 width=64) (actual time=0.020..0.191 rows=50 loops=1)
                      Index Cond: (created_at >= '2025-03-01'::timestamptz AND created_at < '2025-04-01'::timestamptz)
  Planning Time: 0.512 ms
  Execution Time: 0.432 ms`,
      },
      {
        name: 'show-partitions.txt',
        lang: 'text',
        content: `-- 2025-03-14 10:15:00 +07
logistics=# \d+ txn_log
                                    Partitioned table "public.txn_log"
  Column   |           Type           | Collation | Nullable | Default
-----------+--------------------------+-----------+----------+---------
  id       | uuid                     |           | not null |
  user_id  | uuid                     |           | not null |
  amount   | numeric(12,2)            |           | not null |
  created_at | timestamp with time zone |           | not null |
  status   | character varying(16)    |           | not null |
Partition key: RANGE (created_at)
Partitions: txn_log_2025_01 FOR VALUES FROM ('2025-01-01') TO ('2025-02-01'),
            txn_log_2025_02 FOR VALUES FROM ('2025-02-01') TO ('2025-03-01'),
            txn_log_2025_03 FOR VALUES FROM ('2025-03-01') TO ('2025-04-01'),
            ... (tới txn_log_2025_12)

logistics=# \d txn_log_2025_03
                                    Table "public.txn_log_2025_03"
    Column   |           Type           | Collation | Nullable | Default
------------+--------------------------+-----------+----------+---------
  ... (cùng cột)
Indexes:
    "txn_log_2025_03_pkey" PRIMARY KEY, btree (id)
    "txn_log_2025_03_user_id_created_at_desc_idx" btree (user_id, created_at DESC)
    "txn_log_2025_03_created_at_idx" btree (created_at)`,
      },
    ],
    questions: [
      'Vì sao câu query với OR giữa user_id và created_at làm planner quét 12 partition thay vì chỉ partition tháng 3? Chỉ ra bằng dòng "Subplans Removed: 11" trong plan.',
      'Partition pruning hoạt động như thế nào, và tại sao điều kiện OR khiến nó thất bại? Giải thích tại sao UNION ALL khắc phục được.',
      'Hãy viết lại query bằng UNION ALL (mỗi nhánh lọc một điều kiện) và giải thích vì sao planner giờ chỉ quét partition txn_log_2025_03 cho cả hai nhánh.',
    ],
    hints: [
      'Partition pruning yêu cầu điều kiện WHERE có thể xác định được partition key (created_at) tại thời điểm plan. Điều kiện OR: user_id = ? OR (created_at BETWEEN ? AND ?) — planner không thể chứng minh rằng chỉ partition tháng 3 liên quan, vì user_id có thể nằm ở partition khác.',
      'Dòng "Subplans Removed: 11" trong Append node cho thấy 11 partition bị loại sau khi plan (chạy-time pruning), nhưng Seq Scan vẫn chạy trên 12 partition trước khi lọc -> đọc 30 triệu dòng.',
      'UNION ALL tách thành 2 nhánh: nhánh 1 chỉ lọc user_id (quét tất cả partition vì không có điều kiện trên partition key), nhánh 2 chỉ lọc created_at (pruning chỉ partition tháng 3). Nhánh 1 vẫn chậm? Thực tế user u-88990 chỉ có giao dịch tháng 3 -> planner dùng Index Scan trên từng partition, nhanh. Nếu user có dữ liệu nhiều tháng, cân nhắc partial index hoặc chạy nhánh user_id trên partition gần nhất trước.',
    ],
    answer: `**Tóm tắt:** Câu query {{WHERE user_id = ? OR (created_at BETWEEN ? AND ?)}} trên bảng {{txn_log}} phân vùng theo {{created_at}} khiến **partition pruning thất bại** — planner không thể xác định trước partition nào liên quan (vì user_id có thể ở partition nào) -> quét **12 partition** (30 triệu dòng), Seq Scan mỗi partition, 8,4 giây. Sửa bằng **UNION ALL**: tách thành 2 nhánh, nhánh 1 lọc user_id, nhánh 2 lọc created_at. Nhánh 2 pruning được chỉ partition tháng 3; nhánh 1 dùng Index Scan trên từng partition (nhanh vì user chỉ có giao dịch tháng 3). Từ 8.342 ms xuống 0,432 ms (~19.000 lần).
    
### Kiến thức nền: partition pruning trong PostgreSQL
**Partition pruning** là kỹ thuật planner loại bỏ partition không cần quét dựa trên điều kiện WHERE chứa **partition key**. Có hai loại:
- **Static pruning** (tại lúc plan): điều kiện trên partition key là hằng số hoặc parameter $n mà planner có thể đánh giá -> loại bỏ partition ngay trong plan (Subplans Removed).
- **Run-time pruning** (tại lúc chạy): điều kiện trên partition key chứa tham số không biết giá trị lúc plan (ví dụ $1) -> planner giữ tất cả partition trong plan, nhưng executor loại bỏ partition không khớp khi chạy (Append node có "Subplans Removed").

Điểm mấu chốt: pruning chỉ hoạt động khi điều kiện WHERE **chứa partition key** (created_at) và có thể chuyển thành điều kiện range trên key. Nếu điều kiện là OR giữa partition key và cột khác, planner **không thể chứng minh** chỉ một tập partition liên quan -> phải giữ tất cả.

### Nguyên nhân gốc, từng bước
1. Bảng {{txn_log}} phân vùng RANGE trên {{created_at}}, 12 partition (tháng 1–12/2025).
2. Câu query: {{WHERE user_id = 'u-88990' OR (created_at >= '2025-03-01' AND created_at < '2025-04-01')}}.
3. Planner thấy điều kiện OR: vế thứ hai chứa partition key {{created_at}}, nhưng vế thứ nhất {{user_id}} **không chứa partition key**.
4. Vì {{user_id = 'u-88990'}} có thể khớp dòng ở **bất kỳ partition nào** (user có thể giao dịch tháng nào cũng được), planner **không thể loại bỏ partition nào** dựa trên vế OR này.
5. Planner chọn plan quét tất cả 12 partition (Append node), mỗi partition chạy Seq Scan với Filter OR. Dòng **"Subplans Removed: 11"** trong plan chỉ ra 11 partition bị loại ở *run-time* (sau khi Seq Scan xong), nhưng thực tế vẫn đã đọc hết 30 triệu dòng trước khi lọc.
6. Tổng dữ liệu đọc: 12 partition × 2,5 triệu = 30 triệu dòng, Seq Scan mỗi partition -> 8,4 giây.

### Dẫn chứng
- Artifact 1: **Append node với 12 subplan** (txn_log_2025_01 đến txn_log_2025_12), **"Subplans Removed: 11"** — pruning chỉ xảy ra sau khi chạy, không phải lúc plan. Mỗi partition **Seq Scan**, Filter OR, Rows Removed 2.499.988/partition.
- Artifact 1: **Execution Time: 8342.451 ms**, Buffers 189.432 hit.
- Artifact 2: UNION ALL -> **Append chỉ 2 subplan** (txn_log_2025_03 cho cả hai nhánh), **"Subplans Removed: 11"**. Nhánh 1: **Index Scan Backward using ..._user_id_created_at_desc_idx**; Nhánh 2: **Index Scan Backward using ..._created_at_idx**.
- Artifact 2: **Execution Time: 0.432 ms**, Buffers 8 hit — nhanh ~19.000 lần.
- Artifact 3: partition txn_log_2025_03 có index {{(user_id, created_at DESC)}} và {{created_at}}.

### Cách sửa ngắn hạn (hôm nay)
- Viết lại query bằng **UNION ALL** (hoặc UNION + DISTINCT nếu cần loại trùng):
  ~~~sql
  WITH matched AS (
    SELECT id, user_id, amount, created_at, status
    FROM txn_log
    WHERE user_id = $1
    UNION ALL
    SELECT id, user_id, amount, created_at, status
    FROM txn_log
    WHERE created_at >= $2 AND created_at < $3
  )
  SELECT DISTINCT ON (id) id, user_id, amount, created_at, status
  FROM matched
  ORDER BY id, created_at DESC
  LIMIT 50;
  ~~~
- Nhánh 1 (user_id): quét tất cả partition nhưng dùng **Index Scan** trên {{(user_id, created_at DESC)}} — nhanh vì index cục bộ.
- Nhánh 2 (created_at): **pruning chỉ partition tháng 3**, dùng **Index Scan** trên {{created_at}}.
- LIMIT push down: PostgreSQL 14+ push LIMIT vào mỗi nhánh của Append -> chỉ đọc 50 dòng mỗi nhánh.

### Cách sửa dài hạn
1. **Không dùng OR giữa partition key và cột khác** trong WHERE trên bảng phân vùng. Quy tắc review: partition key phải nằm trong điều kiện AND đơn lẻ, hoặc viết lại bằng UNION ALL.
2. **Partial index** nếu cần OR thường xuyên: {{CREATE INDEX ... ON txn_log (user_id) WHERE created_at >= '2026-01-01';}} — nhưng chỉ giúp partition gần nhất.
3. **Cảnh báo auto_explain**: bật {{log_min_duration}} và alert khi Append node có Subplans Removed lớn (> 5) nhưng Execution Time cao — dấu hiệu pruning thất bại.
4. **Theo dõi pg_stat_user_tables** cho từng partition: nếu một partition bị Seq Scan nhiều mà có index, kiểm tra điều kiện WHERE.

### Phòng ngừa và monitoring
- Alert khi {{EXPLAIN}} cho thấy Append node quét nhiều partition với Seq Scan mà có index cục bộ.
- Dashboard: số partition quét trung bình cho query tìm kiếm, tỉ lệ pruning thành công.
- Test query trên dữ liệu production-like (12 partition) mọi PR thay đổi logic tìm kiếm.

### Trả lời mẫu khi phỏng vấn
"Query OR giữa user_id và created_at trên bảng txn_log partition theo created_at chạy 8 giây vì partition pruning thất bại: planner không thể loại bỏ partition nào vì user_id có thể ở partition bất kỳ -> quét 12 partition Seq Scan 30 triệu dòng. Tôi viết lại bằng UNION ALL: nhánh 1 lọc user_id (Index Scan trên từng partition), nhánh 2 lọc created_at (pruning chỉ partition tháng 3, Index Scan). Từ 8.342 ms xuống 0,432 ms. Nguyên tắc: không OR giữa partition key và cột khác, dùng UNION ALL tách điều kiện."

> Senior tip: **Partition pruning là "cây chổi thần" của bảng lớn — nhưng OR là "kẻ phá hoại" nó**. Một OR đơn giản giữa partition key và cột khác đủ làm planner quét toàn bộ bảng (tất cả partition). Trên bảng 30 triệu dòng, chênh lệch giữa pruning thành công (chỉ đọc 1 partition) và thất bại (đọc 12 partition) là 12 lần I/O, 10.000 lần latency. Quy tắc của tôi: **bảng phân vùng không được có OR trong WHERE liên quan đến partition key** — nếu nghiệp vụ bắt buộc, hãy viết lại UNION ALL ở tầng repository, đừng để planner loay hoay.`,
    rubric: [
      'Chỉ đúng nguyên nhân: OR giữa user_id (không phải partition key) và created_at (partition key) khiến planner không thể prune partition -> quét 12 partition Seq Scan 30 triệu dòng',
      'Dẫn chứng đúng: artifact 1 Append 12 subplan, Subplans Removed 11, Seq Scan mỗi partition, 8.342 ms; artifact 2 UNION ALL chỉ 2 subplan trên txn_log_2025_03, Index Scan, 0,432 ms',
      'Giải thích đúng partition pruning: static vs run-time, yêu cầu điều kiện chứa partition key, OR phá vỡ khả năng chứng minh',
      'Đề xuất sửa đúng: UNION ALL tách 2 nhánh, nhánh 2 pruning partition tháng 3, nhánh 1 Index Scan, LIMIT push down',
      'Có monitoring/phòng ngừa: alert Append quét nhiều partition, auto_explain, quy tắc review không OR với partition key',
    ],
    tags: ['postgresql', 'partition', 'partition-pruning', 'or-condition', 'union-all', 'partitioned-table'],
  },
  {
    id: 'lab-sql-052',
    category: 'sql',
    title: 'PreparedStatement generic plan chọn sai kế hoạch do tham số lệch (parameter skew)',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống {{order-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) lưu đơn hàng trong bảng {{orders}}: **60.000.000 dòng** (~15 GB heap). Cột {{status}} lưu trạng thái đơn: {{PENDING}} (0,5% ~ 300.000 dòng), {{SHIPPED}} (10%), {{DELIVERED}} (85% ~ 51 triệu dòng), {{CANCELLED}} (4,5%). Có chỉ mục {{idx_orders_status}} btree trên {{status}}.

Endpoint {{GET /api/v1/orders?status=}} dùng Hibernate/JPA với parameter binding: {{SELECT o FROM Order o WHERE o.status = :status}}. Spring Data JPA tạo PreparedStatement với tham số {{?}}.

**Triệu chứng (14/03/2026, 09:00–11:00).** Khi tìm đơn {{PENDING}} (hiếm) query chạy **8 ms** — dùng Index Scan, đúng. Khi tìm đơn {{DELIVERED}} (phổ biến, 85%) query đột nhiên chảy lên **6,2 giây** — dùng Seq Scan toàn bảng. Không ai đổi code, không đổi index, không đổi dữ liệu. Một dev nghĩ "index bị hỏng" và đề xuất REINDEX — không giảm.

**Việc bạn có.** Hai artifact: EXPLAIN ANALYZE EXECUTE của câu với tham số PENDING và với tham số DELIVERED (sau khi PreparedStatement đã được dùng 5 lần trở lên, PostgreSQL dùng generic plan), và log auto_explain. Hãy chỉ ra vì sao cùng câu, cùng index, mà kế hoạch xấu chỉ xảy ra với tham số phổ biến, và cách buộc PostgreSQL dùng custom plan cho mỗi tham số.`,
    artifacts: [
      {
        name: 'auto-explain-generic-delivered.log',
        lang: 'text',
        content: `-- 2026-03-14 09:15:22 +07, RDS orderdb (PostgreSQL 15.6, plan_cache_mode = auto)
orderdb=# EXPLAIN (ANALYZE, BUFFERS)
EXECUTE stmt_get_orders_by_status('DELIVERED');
                                                              QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=0.43..45.43 rows=50 width=72) (actual time=3120.887..6204.123 rows=50 loops=1)
   Buffers: shared hit=1894320 read=1442
   ->  Index Scan using idx_orders_status on orders o  (cost=0.43..2345678.90 rows=15000000 width=72) (actual time=0.041..6203.552 rows=51000000 loops=1)
         Index Cond: (status = 'DELIVERED'::varchar)
         Buffers: shared hit=1894320 read=1442
 Planning Time: 0.284 ms
 Execution Time: 6204.512 ms
-- Generic plan: Index Scan ước lượng 15 triệu dòng (trung bình 4 trạng thái), thực tế 51 triệu dòng DELIVERED -> 6,2 giây.`,
      },
      {
        name: 'explain-custom-pending.txt',
        lang: 'text',
        content: `-- 2026-03-14 09:20:00 +07, sau SET plan_cache_mode = force_custom_plan
orderdb=# EXPLAIN (ANALYZE, BUFFERS)
EXECUTE stmt_get_orders_by_status('PENDING');
                                                           QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Index Scan using idx_orders_status on orders o  (cost=0.43..8.45 rows=300000 width=72) (actual time=0.051..7.812 rows=300000 loops=1)
   Index Cond: (status = 'PENDING'::varchar)
   Buffers: shared hit=750 read=2
 Planning Time: 0.284 ms
 Execution Time: 8.103 ms

orderdb=# EXPLAIN (ANALYZE, BUFFERS)
EXECUTE stmt_get_orders_by_status('DELIVERED');
                                                           QUERY PLAN
------------------------------------------------------------------------------------------------------------------------------
 Seq Scan on orders o  (cost=0.00..1845123.45 rows=51000000 width=72) (actual time=0.112..784.321 rows=51000000 loops=1)
   Filter: (status = 'DELIVERED'::varchar)
   Buffers: shared hit=3124512 read=0
 Planning Time: 0.284 ms
 Execution Time: 785.102 ms
-- Custom plan: PENDING dùng Index Scan (8 ms), DELIVERED dùng Seq Scan (0,8 giây) — mỗi tham số có kế hoạch riêng phù hợp.`,
      },
    ],
    questions: [
      'Vì sao cùng câu PreparedStatement, tìm PENDING chạy 8 ms nhưng tìm DELIVERED chạy 6,2 giây, dù không đổi code hay index? Chỉ ra bằng artifact nào.',
      'Generic plan là gì, và tại sao nó lại xấu với tham số lệch (parameter skew) như trạng thái DELIVERED chiếm 85%?',
      'Bạn sửa thế nào để mỗi giá trị tham số có kế hoạch riêng, phù hợp với selectivity thực tế? Giải thích trade-off của force_custom_plan.',
    ],
    hints: [
      'PostgreSQL 12+ dùng custom plan cho 5 lần EXECUTE đầu, sau đó chuyển sang generic plan (một kế hoạch cho tất cả tham số) khi plan_cache_mode = auto. Generic plan dùng selectivity trung bình (4 trạng thái → ~25% mỗi trạng thái), không phản ánh sự lệch thực tế.',
      'Generic plan chọn Index Scan (tốt cho PENDING 0,5%, xấu cho DELIVERED 85% = 51 triệu dòng qua index random I/O). DELIVERED nên dùng Seq Scan (đọc tuần tự 15 GB nhanh hơn).',
      'Sửa: SET plan_cache_mode = force_custom_plan (hoặc force_generic_plan nếu muốn ngược lại) ở cấp session/transaction, hoặc viết các truy vấn riêng cho từng giá trị phổ biến. Custom plan có chi phí lập kế hoạch cao hơn nhưng phù hợp mỗi tham số.',
    ],
    answer: `**Tóm tắt:** Câu {{SELECT ... WHERE status = $1}} dùng PreparedStatement. PostgreSQL 12+ với {{plan_cache_mode = auto}} dùng custom plan 5 lần đầu rồi chuyển sang **generic plan** (một kế hoạch cho mọi tham số, dựa trên selectivity trung bình). Với cột {{status}} lệch (DELIVERED 85%, PENDING 0,5%), generic plan chọn Index Scan — tốt cho PENDING (8 ms) nhưng thảm họa cho DELIVERED: quét 51 triệu dòng qua index random I/O, 6,2 giây. Sửa: dùng {{force_custom_plan}} để mỗi EXECUTE có kế hoạch riêng theo giá trị tham số (PENDING → Index Scan 8 ms, DELIVERED → Seq Scan 0,8 giây), hoặc tách truy vấn riêng cho giá trị phổ biến.

### Kiến thức nền: custom plan vs generic plan
PostgreSQL chuẩn bị PreparedStatement lần đầu, sau mỗi EXECUTE nhận tham số thực tế và lập kế hoạch riêng (custom plan). Từ lần thứ 6 trở lên (mặc định {{plan_cache_mode = auto}}), nó caches một **generic plan** — kế hoạch duy nhất dùng cho tất cả các giá trị tham số sau này, dựa trên thống kê trung bình từ {{pg_stats}}. Điều này giảm chi phí lập kế hoạch nhưng rủi ro: với dữ liệu lệch, generic plan có thể sai bét cho một số giá trị.

Ví dụ đời thường: như lập vé xe theo "loại khách hàng trung bình" (generic plan) — giá vé trung bình. Nhưng khách hàng thực tế là trẻ em (giá rẻ) hoặc người lớn (giá đắt). Generic plan không khớp ai. Custom plan là lập vé riêng theo từng khách hàng.

### Nguyên nhân gốc, từng bước
1. Bảng {{orders}} 60 triệu dòng, cột {{status}} có chỉ mục {{idx_orders_status}}, dữ liệu lệch: DELIVERED 85% (51 triệu), PENDING 0,5% (300 nghìn).
2. Ứng dụng gọi PreparedStatement với tham số {{status}}. 5 lần EXECUTE đầu dùng custom plan: PENDING dùng Index Scan (8 ms), DELIVERED dùng Seq Scan (0,8 giây) — đều ổn.
3. Lần thứ 6 trở lên, PostgreSQL chuyển sang generic plan (dựa trên selectivity trung bình ~25% mỗi trạng thái). Generic plan chọn **Index Scan** (chi phí thấp hơn Seq Scan theo ước lượng trung bình).
4. Với tham số DELIVERED, Index Scan phải đọc 51 triệu entries từ index rồi fetch heap → random I/O massic → 6,2 giây. Seq Scan sẽ đọc tuần tự 15 GB, chỉ ~0,8 giây.
5. Với tham số PENDING, Index Scan vẫn tốt (8 ms) — nên vấn đề chỉ phát hiện với giá trị phổ biến.

### Dẫn chứng
- Artifact 1 (generic plan, DELIVERED): **Index Scan** trên {{idx_orders_status}}, estimated rows 15.000.000 (trung bình), actual rows 51.000.000, **Execution Time: 6204.512 ms**, Buffers 1.894.320 hit (đọc heap nhiều do index random fetch).
- Artifact 2 (custom plan): PENDING → Index Scan, Execution Time 8.103 ms; DELIVERED → **Seq Scan**, Execution Time 785.102 ms. Mỗi tham số có kế hoạch phù hợp.
- Log auto_explain sẽ hiển thị các EXECUTE sau lần thứ 5 đều dùng cùng generic plan (Index Scan) bất kể tham số.

### Cách sửa ngắn hạn (hôm nay)
- {{SET plan_cache_mode = force_custom_plan;}} ở cấp session (hoặc {{ALTER DATABASE ... SET plan_cache_mode = force_custom_plan}} / {{ALTER ROLE}}) trước khi chạy truy vấn bị ảnh hưởng. Mỗi EXECUTE lập kế hoạch riêng theo giá trị tham số thực tế.
- Nếu chỉ một số giá trị phổ biến bị ảnh hưởng: viết các truy vấn riêng (ví dụ {{WHERE status = 'DELIVERED'}} hard-coded) hoặc dùng {{CASE}} để hướng planner, thay vì dùng tham số chung.
- {{SET plan_cache_mode = force_generic_plan}} nếu ngược lại: generic plan tốt cho tất cả, muốn tiết kiệm chi phí lập kế hoạch.

### Cách sửa dài hạn
- Theo dõi {{pg_stat_statements}} + auto_explain: phát hiện truy vấn có nhiều Execution Time lệch lớn giữa các lần gọi cùng queryid — dấu hiệu parameter skew với generic plan.
- Chuẩn bị thiết kế: tránh dùng tham số cho cột có phân bố dữ liệu cực độ lệch nếu cần kế hoạch khác nhau; cân nhắc hard-coded hoặc stored procedure với IF/ELSE chọn truy vấn phù hợp.
- Tune {{prepare_threshold}} (số lần custom plan trước khi chuyển generic) nếu cần, nhưng force_custom_plan rõ ràng hơn.

### Phòng ngừa và monitoring
- Alert khi cùng queryid có Execution Time chênh lệch > 10 lần giữa các lần gọi (auto_explain / pg_stat_statements).
- Kiểm tra {{plan_cache_mode}} mặc định là auto; với dữ liệu lệch cân nhắc force_custom_plan cho các truy vấn báo cáo.
- Quy tắc review: truy vấn dùng PreparedStatement trên cột có phân bố lệch phải kiểm tra EXPLAIN với cả giá trị hiếm và phổ biến.

### Trả lời mẫu khi phỏng vấn
"Câu truy vấn PreparedStatement WHERE status = $1 dùng generic plan sau 5 lần execute. Generic plan dựa trên selectivity trung bình (~25% mỗi trạng thái) chọn Index Scan, tốt cho PENDING (0,5%, 8 ms) nhưng thảm họa cho DELIVERED (85%, 51 triệu dòng qua index) → 6,2 giây. Sửa: SET plan_cache_mode = force_custom_plan để mỗi tham số có kế hoạch riêng (PENDING Index Scan 8 ms, DELIVERED Seq Scan 0,8 giây), hoặc tách truy vấn riêng cho giá trị phổ biến. Theo dõi pg_stat_statements để phát hiện parameter skew."

> Senior tip: **Generic plan là "một kế hoạch cho tất cả" — với dữ liệu đều đều thì tốt, với dữ liệu lệch thì thảm.** Khi cùng câu SQL chạy nhanh với tham số hiếm nhưng chậm với tham số phổ biến (không đổi code, không đổi index), hãy nghi generic plan + parameter skew. Quy tắc: dùng EXPLAIN ANALYZE EXECUTE với cả giá trị hiếm và phổ biến; nếu khác biệt quá lớn, bật force_custom_plan hoặc tách truy vấn. Chi phí lập kế hoạch custom plan nhỏ bé so với chi phí chạy sai kế hoạch 6 giây.`,
    rubric: [
      'Chỉ đúng nguyên nhân: generic plan (sau 5 lần EXECUTE) dùng selectivity trung bình, chọn Index Scan xấu cho tham số phổ biến DELIVERED 85%, tốt cho PENDING 0,5%',
      'Dẫn chứng đúng: artifact 1 Index Scan estimated 15 triệu / actual 51 triệu, 6,2 giây; artifact 2 custom plan PENDING Index Scan 8 ms, DELIVERED Seq Scan 0,8 giây',
      'Giải thích đúng custom vs generic plan: plan_cache_mode = auto, 5 lần đầu custom, sau đó generic dựa trên pg_stats trung bình',
      'Đề xuất sửa đúng: force_custom_plan ở session/transaction, hoặc hard-coded truy vấn riêng cho giá trị phổ biến, nêu trade-off chi phí lập kế hoạch',
      'Có monitoring/phòng ngừa: pg_stat_statements + auto_explain phát hiện execution time lệch, quy tắc review EXPLAIN với giá trị hiếm và phổ biến',
    ],
    tags: ['postgresql', 'prepared-statement', 'generic-plan', 'parameter-skew', 'plan-cache-mode', 'explain'],
  },
  {
    id: 'lab-sql-053',
    category: 'sql',
    title: 'LIKE có ký tự wildcard ở đầu (LIKE %pattern) không dùng B-tree index → Seq Scan',
    level: 'senior',
    scenario: `**Bối cảnh.** Hệ thống {{notification-service}} (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) lưu khách hàng trong bảng {{customers}}: **40.000.000 dòng** (~10 GB heap). Cột {{email}} kiểu {{varchar(255)}} có chỉ mục {{idx_customers_email}} btree. Endpoint {{GET /api/v1/customers?domain=}} tìm khách hàng theo domain email: WHERE email LIKE :pattern với pattern = '%@gmail.com'.

**Triệu chứng (14/03/2026, 10:00).** Query tìm domain @gmail.com (khoảng 4 triệu dòng) chạy **12 giây**, CPU RDS 100% một core. EXPLAIN thấy **Seq Scan** toàn bảng 40 triệu dòng dù chỉ mục {{idx_customers_email}} đã tồn tại. DBA nghĩ "index bị hỏng" và chạy REINDEX — không giảm.

**Việc bạn có.** Hai artifact: EXPLAIN ANALYZE của câu LIKE '%@gmail.com', và EXPLAIN của câu viết lại dùng pg_trgm (hoặc cột đảo ngược). Hãy chỉ ra vì sao B-tree index không giúp với wildcard ở đầu, và cách tạo chỉ mục phù hợp.`,
    artifacts: [
      {
        name: 'explain-like-tail.txt',
        lang: 'text',
        content: `-- 2026-03-14 10:05:12 +07, RDS notificationdb (PostgreSQL 15.6)
notifdb=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, email, full_name FROM customers WHERE email LIKE '%@gmail.com';
                                                               QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------
 Seq Scan on customers  (cost=0.00..1245678.90 rows=4000000 width=48) (actual time=0.021..11984.567 rows=4000000 loops=1)
   Filter: ((email)::text ~~ '%@gmail.com'::text)
   Rows Removed by Filter: 36000000
   Buffers: shared hit=2500000 read=12345
 Planning Time: 0.284 ms
 Execution Time: 11985.102 ms
-- B-tree index trên email KHÔNG được dùng vì LIKE '%@gmail.com' bắt đầu bằng wildcard: không xác định được dải giá trị để quét index.`,
      },
      {
        name: 'explain-like-trigram.txt',
        lang: 'text',
        content: `-- 2026-03-14 10:10:00 +07, sau CREATE EXTENSION pg_trgm; CREATE INDEX ... USING gin (email gin_trgm_ops);
notifdb=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, email, full_name FROM customers WHERE email LIKE '%@gmail.com';
                                                               QUERY PLAN
-----------------------------------------------------------------------------------------------------------------------------
 Bitmap Heap Scan on customers  (cost=245.67..24567.89 rows=4000000 width=48) (actual time=45.123..312.456 rows=4000000 loops=1)
   Recheck Cond: ((email)::text ~~ '%@gmail.com'::text)
   ->  Bitmap Index Scan using idx_customers_email_trgm on customers  (cost=0.00..245.67 rows=4000000 width=0) (actual time=12.345..12.345 rows=4000000 loops=1)
         Index Cond: ((email)::text ~~ '%@gmail.com'::text)
   Buffers: shared hit=12500 read=0
 Planning Time: 0.412 ms
 Execution Time: 313.204 ms
-- pg_trgm GiN index dùng được cho LIKE '%pattern%', thời gian từ 12 giây xuống 0,3 giây.`,
      },
    ],
    questions: [
      'Vì sao câu LIKE "%@gmail.com" (khoảng 4 triệu dòng) lại Seq Scan toàn bảng 40 triệu dòng dù có chỉ mục btree trên email? Chỉ ra bằng dòng nào trong EXPLAIN.',
      'B-tree index hỗ trợ tìm kiếm theo dạng gì, và tại sao wildcard ở đầu làm index không dùng được?',
      'Bạn sửa thế nào để tìm kiếm domain email nhanh? So sánh hai cách: pg_trgm (GiN/GiST) và cột đảo ngược reverse(email) + btree.',
    ],
    hints: [
      'B-tree index lưu giá trị theo thứ tự lexicographic, chỉ hỗ trợ tìm kiếm theo tiền tố (prefix). LIKE "gmail%" có thể dùng index (quét dải gmail..gmailz), nhưng LIKE "%@gmail.com" không xác định được điểm bắt đầu trong index.',
      'Dòng "Filter: ((email)::text ~~ "%@gmail.com"::text)" trong EXPLAIN và "Seq Scan on customers" xác nhận chỉ mục bị bỏ qua.',
      'Giải pháp 1: pg_trgm extension, chỉ mục GiN/GiST trên email (gin_trgm_ops) hỗ trợ tìm chuỗi bất kỳ. Giải pháp 2: cột tạo tự động reverse(email) + btree index, truy vấn WHERE reverse(email) LIKE "moc.liamg@%".',
    ],
    answer: `**Tóm tắt:** Câu {{WHERE email LIKE '%@gmail.com'}} không dùng được chỉ mục btree {{idx_customers_email}} vì B-tree chỉ hỗ trợ tìm kiếm theo tiền tố; wildcard ở đầu ('%') làm mất điểm bắt đầu để quét index → PostgreSQL chọn **Seq Scan** quét 40 triệu dòng, 12 giây. Sửa: tạo chỉ mục **pg_trgm (GiN/GiST)** trên email hoặc dùng **cột đảo ngược reverse(email)** + btree index với {{WHERE reverse(email) LIKE 'moc.liamg@%'}}. Thời gian từ 12 giây xuống 0,3 giây.

### Kiến thức nền: B-tree và tìm kiếm theo mẫu
Chỉ mục B-tree lưu giá trị theo thứ tự tăng dần (lexicographic cho chuỗi). Nó hỗ trợ hiệu quả các phép so sánh =, <, >, BETWEEN, và LIKE với **tiền tố cố định** (LIKE 'gmail%') vì có thể xác định dải giá trị [gmail, gmailz] và quét liên tiếp trong index.

Khi LIKE bắt đầu bằng wildcard ('%@gmail.com'), giá trị bắt đầu là bất kỳ → không thể xác định dải index → B-tree không dùng được. PostgreSQL coi đây là điều kiện không sargable đối với B-tree, chọn Seq Scan.

Ví dụ đời thường: danh bạ theo thứ tự bảng chữ cái. Tìm "tên bắt đầu bằng An" (An*) thì nhanh — mở trang A, đọc đến A-z. Tìm "tên kết thúc bằng van" (*van) thì phải đọc toàn bộ danh bạ — không biết bắt đầu từ trang nào.

### Nguyên nhân gốc, từng bước
1. Bảng {{customers}} 40 triệu dòng, cột {{email}} varchar(255), chỉ mục btree {{idx_customers_email}}.
2. Truy vấn {{WHERE email LIKE '%@gmail.com'}} — wildcard ở đầu, phần trước '@gmail.com' là bất kỳ.
3. Planner không thể xác định dải giá trị trong btree để quét → bỏ qua chỉ mục → **Seq Scan** toàn bảng.
4. Dòng Filter: ((email)::text ~~ '%@gmail.com'::text) xác nhận điều kiện được áp dụng làm filter sau khi đọc từng dòng, không phải index condition.
5. Đọc 40 triệu dòng từ heap, loại bỏ 36 triệu, trả 4 triệu → 12 giây, CPU 100% một core.

### Dẫn chứng
- Artifact 1: **Seq Scan on customers**, estimated rows 4.000.000, actual rows 4.000.000, Rows Removed by Filter 36.000.000, **Execution Time: 11985.102 ms**. Không có Index Cond, chỉ Filter.
- Artifact 2 (pg_trgm): **Bitmap Index Scan using idx_customers_email_trgm**, **Execution Time: 313.204 ms** — nhanh khoảng 38 lần. Chỉ mục GiN hỗ trợ tìm chuỗi bất kỳ qua toán tử trgm.

### Cách sửa ngắn hạn (hôm nay)
- {{CREATE EXTENSION IF NOT EXISTS pg_trgm;}} rồi {{CREATE INDEX idx_customers_email_trgm ON customers USING gin (email gin_trgm_ops);}}. Chỉ mục GiN hỗ trợ LIKE '%pattern%', ILIKE, similarity. CREATE INDEX thông thường khoá bảng (không ghi được), có thể chạy ngoài giờ cao điểm; hoặc {{CREATE INDEX CONCURRENTLY}} nếu không muốn khoá.
- Truy vấn giữ nguyên {{WHERE email LIKE '%@gmail.com'}}, planner tự chọn chỉ mục trigram.

### Cách sửa dài hạn
- Nếu chỉ tìm domain email (luôn '%@domain'), cột đảo ngược hiệu quả hơn: thêm cột {{email_rev}} kiểu {{varchar(255)}} sinh tự động (generated column) {{reverse(email)}}, chỉ mục btree trên {{email_rev}}, truy vấn {{WHERE email_rev LIKE 'moc.liamg@%'}} → dùng btree index, nhanh và nhỏ hơn pg_trgm.
- Nếu cần tìm kiếm văn bản toàn văn (full-text) trên nhiều cột: dùng {{to_tsvector}} + chỉ mục GiN, hoặc Elasticsearch.
- Theo dõi kích thước chỉ mục pg_trgm (có thể lớn) và chi phí cập nhật trên mỗi INSERT/UPDATE.

### Phòng ngừa và monitoring
- Quy tắc review: tránh LIKE bắt đầu bằng wildcard trên cột lớn có chỉ mục btree; nếu bắt buộc, dùng pg_trgm hoặc cột đảo ngược.
- Kiểm tra EXPLAIN: nếu thấy Filter trên cột có index thay vì Index Cond, nghi vấn điều kiện không sargable (wildcard đầu, hàm trên cột, ép kiểu).
- Cảnh báo khi Seq Scan trên bảng lớn với rows trả về nhỏ so với rows đọc (tỉ lệ > 100:1).

### Trả lời mẫu khi phỏng vấn
"Câu WHERE email LIKE '%@gmail.com' chạy Seq Scan 40 triệu dòng, 12 giây, vì B-tree index chỉ hỗ trợ tìm theo tiền tố; wildcard ở đầu làm mất điểm bắt đầu quét index. Dẫn chứng: EXPLAIN có 'Seq Scan on customers' và 'Filter: ((email)::text ~~ '%@gmail.com'::text)', không có Index Cond. Sửa: CREATE EXTENSION pg_trgm + chỉ mục GiN (gin_trgm_ops) trên email, thời gian từ 12 giây xuống 0,3 giây; hoặc dùng cột reverse(email) + btree index với WHERE reverse(email) LIKE 'moc.liamg@%'. Nên tránh LIKE bắt đầu wildcard trên cột lớn."

> Senior tip: **Wildcard ở đầu LIKE là "kẻ giết index" cổ điển**. B-tree chỉ giúp khi giá trị bắt đầu cố định (tiền tố). Nếu nghiệp vụ thường xuyên tìm "cuối chuỗi" (domain email, mã bưu điện, suffix mã hàng), hãy dùng pg_trgm hoặc cột đảo ngược — đừng để planner quét toàn bảng mỗi lần tìm kiếm. Và nhớ: chỉ mục btree trên email vẫn hữu ích cho tìm kiếm chính xác (email = '...') hoặc prefix (email LIKE 'nguyen%'), chỉ mất tác dụng với wildcard đầu.`,
    rubric: [
      'Chỉ đúng nguyên nhân: B-tree index không hỗ trợ LIKE bắt đầu wildcard (% đầu), không xác định dải index → Seq Scan; dòng Filter có ~~ "%..." là bằng chứng',
      'Dẫn chứng đúng: artifact 1 Seq Scan 40 triệu dòng 12 giây; artifact 2 pg_trgm Bitmap Index Scan 0,3 giây, nhanh ~38 lần',
      'Giải thích đúng B-tree chỉ hỗ trợ tiền tố (prefix), ví dụ LIKE "gmail%" dùng được, LIKE "%gmail.com" không',
      'Đề xuất sửa đúng: pg_trgm GiN/GiST index hoặc cột reverse(email) + btree với WHERE reverse(email) LIKE "moc.liamg@%"',
      'Có monitoring/phòng ngừa: quy tắc review tránh wildcard đầu, kiểm tra Index Cond vs Filter trong EXPLAIN, cảnh báo Seq Scan bảng lớn',
    ],
    tags: ['postgresql', 'index', 'like', 'wildcard', 'pg-trgm', 'seq-scan', 'sargable'],
  },
  {
  id: 'lab-sql-054',
  category: 'sql',
  title: 'ALTER TABLE peak hours: ALTER COLUMN TYPE numeric trên bảng 50 triệu dòng gây rewrite 25 phút',
  level: 'senior',
  scenario: `**Bối cảnh.** Hệ thống thanh toán **PayFlow** (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{transactions}} lưu lịch sử giao dịch: **52.318.402 dòng** (~18 GB heap + 4,2 GB index). Giờ cao điểm 11:00–13:00 có 4.500 req/s (80% đọc, 20% ghi). Đội data cần đổi cột {{amount}} từ {{numeric(12,2)}} sang {{numeric(18,4)}} để hỗ trợ tiền tệ đòi hỏi độ chính xác cao hơn.
     
  **Triệu chứng (14/03/2026, 11:35).** DBA chạy migration:
  ~~~sql
  ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(18,4);
  ~~~
  Lệnh chạy **25 phút 18 giây**. Trong lúc đó, toàn bộ API thanh toán trả 504. RDS CPU 100% một core, active connection nhảy từ 45 lên 480. {{pg_stat_activity}} đầy các SELECT/INSERT đang chờ lock. DBA nghĩ "chỉ đổi precision, không nên lâu" — thực tế PostgreSQL phải **rewrite toàn bộ bảng** và giữ **AccessExclusiveLock** suốt quá trình.
  
  **Điều đã thử, không ăn.** Tăng {{max_connections}}, restart PgBouncer — không giảm. DBA cho rằng "ALTER TYPE nhẹ, chỉ sửa metadata" — thực tế là rewrite dữ liệu.
  
  **Việc bạn có.** Ba artifact: log server lúc 11:35–12:00, snapshot pg_locks lúc 11:35:30, và EXPLAIN ANALYZE của câu SELECT mẫu. Hãy chỉ ra vì sao ALTER COLUMN TYPE rewrite bảng, và đề xuất cách an toàn trên bảng lớn.`,
  artifacts: [
    {
      name: 'postgres-alter-type.log',
      lang: 'text',
      content: `# log server PostgreSQL 15.6 (RDS payflow-primary), timezone Asia/Ho_Chi_Minh
# log_lock_waits = on, deadlock_timeout = 1s
2026-03-14 11:35:00.012 +07 [31245] LOG:  duration: 0.041 ms  execute S_1: BEGIN
2026-03-14 11:35:00.015 +07 [31245] LOG:  duration: 0.038 ms  execute <unnamed>: ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(18,4)
2026-03-14 11:35:00.016 +07 [31245] LOG:  duration: 0.011 ms  execute <unnamed>: (chờ AccessExclusiveLock)
2026-03-14 11:35:00.089 +07 [31246] LOG:  duration: 0.022 ms  execute S_1: BEGIN
2026-03-14 11:35:00.091 +07 [31246] LOG:  duration: 0.031 ms  execute <unnamed>: SELECT id, amount, status FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20
2026-03-14 11:35:00.092 +07 [31246] LOG:  duration: 0.009 ms  execute <unnamed>: (chờ lock)
# ... (hàng trăm phiên xếp hàng chờ AccessExclusiveLock)
2026-03-14 11:35:05.123 +07 [31245] LOG:  duration: 5123.456 ms  execute <unnamed>: (ALTER TABLE bắt đầu rewrite - đọc và ghi lại mọi dòng)
2026-03-14 12:00:18.678 +07 [31245] LOG:  duration: 1513568.234 ms  execute <unnamed>: ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(18,4)  -- kết thúc sau 25 phút 13 giây
2026-03-14 12:00:18.679 +07 [31245] LOG:  duration: 0.040 ms  execute S_2: COMMIT
2026-03-14 12:00:18.690 +07 [31246] LOG:  duration: 1513687.112 ms  execute <unnamed>: SELECT ... (trả về)
# ... (các phiên drain xong trong ~10 giây)`,
    },
    {
      name: 'pg-locks-alter-type.txt',
      lang: 'text',
      content: `-- 2026-03-14 11:35:30 +07, chụp khi migration đang rewrite
payflow=# SELECT pid, state, wait_event_type, wait_event, now() - xact_start AS xact_age,
       left(query, 60) AS query
FROM pg_stat_activity
WHERE pid IN (31245, 31246, 31247, 31248);
  pid  | state  | wait_event_type | wait_event   | xact_age  |                              query
-------+--------+-----------------+--------------+-----------+--------------------------------------------------------------
 31245 | active | IO              | DataFileRead | 00:00:30  | ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(1
 31246 | active | Lock            | relation     | 00:00:30  | SELECT id, amount, status FROM transactions WHERE user_id = 
 31247 | active | Lock            | relation     | 00:00:30  | INSERT INTO transactions (user_id, amount) VALUES ($1, $2)
 31248 | active | Lock            | relation     | 00:00:30  | SELECT count(*) FROM transactions WHERE status = 'SUCCESS'

payflow=# SELECT l.pid, l.locktype, l.relation::regclass AS relation, l.mode, l.granted
FROM pg_locks l
WHERE l.pid IN (31245, 31246, 31247, 31248)
ORDER BY l.pid, l.granted, l.locktype;
  pid  | locktype |   relation   |          mode          | granted
-------+----------+--------------+------------------------+---------
 31245 | relation | transactions | AccessExclusiveLock    | t
 31246 | relation | transactions | AccessShareLock        | f
 31247 | relation | transactions | RowExclusiveLock       | f
 31248 | relation | transactions | AccessShareLock        | f

payflow=# SELECT count(*) AS waiting_sessions FROM pg_locks
WHERE NOT granted AND locktype = 'relation' AND relation = 'transactions'::regclass;
  waiting_sessions
------------------
               312

-- Ghi chú: migration (pid 31245) ĐANG GIỮ AccessExclusiveLock trong 25 phút do rewrite bảng.
-- Mọi câu SELECT/INSERT/UPDATE mới phải chờ lock này (queue FIFO) -> toàn bộ bảng "treo".`,
    },
    {
      name: 'explain-select-transactions.txt',
      lang: 'text',
      content: `-- 2026-03-14 11:34:55 +07 (trước migration)
payflow=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, amount, status FROM transactions WHERE user_id = 'u-12345' ORDER BY created_at DESC LIMIT 20;
                                                             QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
  Limit  (cost=0.57..8.45 rows=20 width=48) (actual time=0.412..0.428 rows=20 loops=1)
    Buffers: shared hit=5
    ->  Index Scan Backward using idx_transactions_user_created on transactions  (cost=0.57..8.45 rows=20 width=48) (actual time=0.411..0.426 rows=20 loops=1)
          Index Cond: (user_id = 'u-12345'::uuid)
          Buffers: shared hit=5
  Planning Time: 0.284 ms
  Execution Time: 0.451 ms`,
    },
  ],
  questions: [
    'Vì sao ALTER TABLE ALTER COLUMN TYPE numeric lại phải rewrite toàn bộ bảng 52 triệu dòng trong 25 phút, trong khi ALTER TABLE ADD COLUMN DEFAULT chỉ sửa metadata? Chỉ ra bằng dòng nào trong artifact cho thấy rewrite đang chạy.',
    'Vì sao migration giữ AccessExclusiveLock trong 25 phút (không phải chỉ chờ lock)? Giải thích sự khác biệt giữa ADD COLUMN (metadata-only từ PG 11) và ALTER COLUMN TYPE (bắt buộc rewrite).',
    'Hãy đề xuất quy trình an toàn để đổi kiểu cột trên bảng 50 triệu dòng: expand/contract (thêm cột mới, dual-write, backfill, đổi tên), chạy ngoài giờ cao điểm, và cách đặt lock_timeout để migration tự bỏ cuộc.',
  ],
  hints: [
    'PostgreSQL ADD COLUMN với DEFAULT từ phiên bản 11 chỉ sửa catalog (metadata-only), KHÔNG rewrite bảng. Nhưng ALTER COLUMN TYPE **luôn** phải rewrite toàn bộ bảng vì biểu diễn trên đĩa thay đổi (numeric(12,2) → numeric(18,4) khác cấu trúc lưu trữ).',
    'Snapshot pg_locks cho thấy migration (pid 31245) GIỮ AccessExclusiveLock (granted = t) trong lúc rewrite, wait_event = DataFileRead (đang đọc/ghi đĩa). 312 phiên chờ lock.',
    'Cách an toàn (expand/contract): (1) ALTER TABLE ADD COLUMN amount_new numeric(18,4); (2) backfill theo lô: UPDATE transactions SET amount_new = amount::numeric(18,4) WHERE id BETWEEN ...; (3) dual-write ở tầng ứng dụng; (4) ALTER TABLE RENAME COLUMN amount TO amount_old, RENAME COLUMN amount_new TO amount; (5) DROP COLUMN amount_old. Mỗi bước lock ngắn, có thể chạy trong giờ cao điểm (trừ DROP COLUMN cần AccessExclusiveLock ngắn).',
  ],
  answer: `**Tóm tắt:** DBA chạy {{ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(18,4)}} — PostgreSQL phải **rewrite toàn bộ bảng 52.3 triệu dòng** vì biểu diễn trên đĩa của {{numeric(12,2)}} và {{numeric(18,4)}} khác nhau. Quá trình rewrite mất **25 phút 13 giây**, trong đó migration giữ **AccessExclusiveLock** (mạnh nhất, không tương thích với mọi lock khác). Mọi SELECT/INSERT/UPDATE mới vào phải xếp hàng chờ -> 312 phiên bị chặn, API trả 504. CPU 100% một core do sequential scan/ghi đĩa. Sửa: dùng pattern **expand/contract** (thêm cột mới, backfill theo lô, dual-write, đổi tên) — mỗi bước lock ngắn, không rewrite toàn bảng một lần.
     
### Kiến thức nền: ALTER COLUMN TYPE vs ADD COLUMN DEFAULT
Khi thêm cột với DEFAULT từ **PostgreSQL 11**, engine chỉ ghi default vào catalog ({{pg_attribute.atthasdef}}), **không quét bảng** — các dòng cũ khi đọc sẽ lấy default từ catalog. Đây là metadata-only, lock vài mili-giây.

Nhưng **ALTER COLUMN TYPE** hoàn toàn khác: kiểu dữ liệu thay đổi nghĩa là **biểu diễn nhị phân trên đĩa thay đổi** (ví dụ {{numeric(12,2)}} dùng 2 byte scale, {{numeric(18,4)}} dùng 4 byte scale). PostgreSQL **bắt buộc phải đọc mọi dòng, convert giá trị, ghi lại** — đó là **table rewrite**. Rewrite cần **AccessExclusiveLock** suốt quá trình (không thể chia nhỏ lock được vì catalog phải thay đổi nguyên tử).

Ví dụ đời thường: ADD COLUMN DEFAULT như "thêm cột mới vào biểu mẫu, giá trị mặc định in sẵn" — không cần in lại toàn bộ hồ sơ cũ. ALTER COLUMN TYPE như "đổi đơn vị đo từ kg sang gam cho mọi hồ sơ" — phải lấy từng hồ sơ ra, chuyển đổi, lưu lại. (Lưu ý: numeric storage trong PostgreSQL dùng dạng biến đổi, không phải fixed byte per scale; việc đổi precision/scale vẫn buộc rewrite vì catalog và format trên đĩa thay đổi.)

### Nguyên nhân gốc, từng bước
1. **11:35:00.015** DBA chạy {{ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(18,4)}}. PostgreSQL yêu cầu **AccessExclusiveLock** để sửa schema.
2. Có một transaction ngắn đang giữ AccessShareLock -> migration chờ vài ms (log 11:35:00.016 "chờ AccessExclusiveLock").
3. **11:35:05.123** Lock được cấp, migration bắt đầu **rewrite bảng** — đọc tuần tự 52.3 triệu dòng, convert {{amount}} từ numeric(12,2) sang numeric(18,4), ghi lại vào các page mới (wait_event = DataFileRead).
4. Trong **25 phút 13 giây** (11:35:05 đến 12:00:18), migration **GIỮ AccessExclusiveLock**.
5. Mọi câu SELECT/INSERT/UPDATE ứng dụng vào sau đều phải chờ lock này (FIFO queue). Snapshot 11:35:30 cho 312 phiên chờ.
6. **12:00:18** rewrite xong, COMMIT, lock được nhả, 312 phiên drain xong ~10 giây.

### Dẫn chứng
- Artifact 1: log **"ALTER TABLE transactions ALTER COLUMN amount TYPE numeric(18,4) duration: 1513568.234 ms"** (25 phút 13 giây), wait_event = DataFileRead.
- Artifact 2: migration pid 31245 **AccessExclusiveLock granted = t** (đang giữ), 312 phiên chờ AccessShareLock/RowExclusiveLock granted = f.
- Artifact 2: wait_event_type = IO, wait_event = DataFileRead cho migration — xác nhận đang đọc/ghi đĩa rewrite.
- Artifact 3: câu SELECT bình thường chỉ 0,45 ms khi không bị chặn.

### Cách sửa ngắn hạn (trong ngày)
- **Huỷ migration đang chạy**: {{SELECT pg_terminate_backend(31245);}} — rewrite bị huỷ, lock nhả, ứng dụng phục hồi ngay.
- **Chạy lại an toàn (expand/contract)**:
  1. {{ALTER TABLE transactions ADD COLUMN amount_new numeric(18,4);}} — metadata-only, ~5 ms.
  2. **Backfill theo lô** (ngoài giờ cao điểm, mỗi lô 10.000 dòng, commit riêng):
     ~~~sql
     UPDATE transactions SET amount_new = amount::numeric(18,4) WHERE ctid BETWEEN '...' AND '...';
     ~~~
     Lặp cho đến hết (dùng ctid hoặc keyset pagination trên khóa chính). Mỗi batch commit riêng -> không giữ lock lâu, không bloat WAL.
  3. **Dual-write ở tầng ứng dụng**: code mới ghi cả {{amount}} và {{amount_new}} (hoặc chỉ ghi {{amount_new}} và dùng trigger sync ngược).
  4. **Đổi tên cột** (lock ngắn, AccessExclusiveLock vài ms):
     ~~~sql
     ALTER TABLE transactions RENAME COLUMN amount TO amount_old;
     ALTER TABLE transactions RENAME COLUMN amount_new TO amount;
     ~~~
  5. **DROP COLUMN cũ** (cần AccessExclusiveLock, chạy ngoài giờ cao điểm):
     ~~~sql
     ALTER TABLE transactions DROP COLUMN amount_old;
     ~~~
- **Bắt buộc lock_timeout**: {{SET lock_timeout = '2s';}} trước ALTER TABLE. Migration tự bỏ cuộc nếu không lấy được lock trong 2 giây.

### Cách sửa dài hạn (quy trình migration an toàn)
1. **Luôn dùng expand/contract cho ALTER TYPE trên bảng lớn**: thêm cột mới -> backfill -> dual-write -> rename -> drop cũ.
2. **Không bao giờ chạy ALTER COLUMN TYPE trong giờ cao điểm** — nó rewrite toàn bảng và giữ AccessExclusiveLock.
3. **Test trên clone production** (RDS snapshot restore) đo thời gian rewrite trước khi apply production.
4. **Quy tắc review**: mọi ALTER COLUMN TYPE trên bảng > 1 triệu dòng phải kèm kế hoạch expand/contract.

### Phòng ngừa và monitoring
- Alert khi có phiên giữ AccessExclusiveLock > 5 giây trên bảng production.
- Theo dõi {{pg_stat_activity}} với {{wait_event_type = 'IO'}} và {{wait_event = 'DataFileRead'}}; alert khi số phiên chờ lock > 50.
- Cảnh báo {{log_lock_waits = on}} ghi nhận lock wait > 1 giây.
- Dashboard: số migration rewrite chạy, thời gian trung bình.

> Senior tip: "ALTER COLUMN TYPE chỉ đổi precision, không nên lâu" là suy nghĩ nguy hiểm thứ hai sau "ADD COLUMN DEFAULT nhẹ". ADD COLUMN DEFAULT từ PG 11 là metadata-only (nhanh), nhưng ALTER COLUMN TYPE **luôn rewrite bảng** — trên 50 triệu dòng có thể mất 20–30 phút. Quy tắc vàng: **đổi kiểu cột = expand/contract**, không bao giờ ALTER COLUMN TYPE trực tiếp trên bảng production lớn. Và nhớ: DROP COLUMN cũng cần AccessExclusiveLock — hãy chạy nó ngoài giờ cao điểm sau khi đã rename xong.`,
  rubric: [
    'Chỉ đúng nguyên nhân: ALTER COLUMN TYPE rewrite toàn bảng 52.3 triệu dòng giữ AccessExclusiveLock 25 phút, chặn 312 phiên',
    'Dẫn chứng đúng: artifact 1 ALTER duration 1513568 ms, DataFileRead; artifact 2 AccessExclusiveLock granted=t, 312 phiên chờ; artifact 3 SELECT bình thường 0.45 ms',
    'Giải thích đúng sự khác biệt: ADD COLUMN DEFAULT (PG 11+) metadata-only vs ALTER COLUMN TYPE rewrite bắt buộc do biểu diễn đĩa thay đổi',
    'Đề xuất sửa đúng: expand/contract (ADD COLUMN mới, backfill lô, dual-write, RENAME, DROP), lock_timeout, chạy ngoài giờ cao điểm',
    'Có monitoring/phòng ngừa: alert AccessExclusiveLock lâu, DataFileRead, lock_waits, quy tắc review expand/contract',
  ],
  tags: ['postgresql', 'alter-table', 'alter-column-type', 'table-rewrite', 'access-exclusive-lock', 'expand-contract'],
},
  {
  id: 'lab-sql-055',
  category: 'sql',
  title: 'OR query với implicit cast: Seq Scan dù có index do tham số numeric so sánh varchar',
  level: 'senior',
  scenario: `**Bối cảnh.** Hệ thống **ShopEase** (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{products}} lưu sản phẩm: **12.418.550 dòng** (~5,2 GB heap + 2,8 GB index). Có 2 index: {{idx_products_sku}} btree trên {{sku}} (varchar(32) chứa mã chỉ có số) và {{idx_products_barcode}} btree trên {{barcode}} (varchar(32) chứa mã vạch chỉ có số). Endpoint {{GET /api/v1/products/search?code=}} cho phép tìm theo SKU HOẶC barcode (logic OR).
     
  **Triệu chứng (14/03/2026, 10:00).** p95 endpoint nhảy từ 12 ms lên **3,8 giây**, CPU RDS từ 18% lên 89%. Slow query log cho thấy câu query với OR quét toàn bảng dù cả 2 cột đều có index. DBA nghi ngờ "index không hiệu quả" — thực tế là implicit cast phá index.
     
  **Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu query OR, EXPLAIN ANALYZE của câu query viết lại đúng kiểu, và schema + danh sách index. Hãy chỉ ra vì sao implicit cast kết hợp với OR phá index, và cách sửa.`,
  artifacts: [
    {
      name: 'explain-or-implicit-cast.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:05:12 +07, RDS shopease-primary (PostgreSQL 15.6)
shopease=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, price FROM products
WHERE sku = '20260314000142'::numeric
   OR barcode = '20260314000142'::numeric;
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
  Seq Scan on products  (cost=0.00..3841521.44 rows=1 width=64) (actual time=0.021..3876.412 rows=1 loops=1)
    Filter: ((sku)::numeric = 20260314000142::numeric) OR ((barcode)::numeric = 20260314000142::numeric)
    Rows Removed by Filter: 12418549
    Buffers: shared hit=145210 read=118433
  Planning Time: 0.312 ms
  Execution Time: 3877.204 ms
(6 rows)

Time: 3877.520 ms

-- So sánh: cùng điều kiện, cast tham số về varchar (khớp kiểu cột):
shopease=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, name, price FROM products
WHERE sku = '20260314000142'
   OR barcode = '20260314000142';
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
  Bitmap Heap Scan on products  (cost=12.44..12.48 rows=1 width=64) (actual time=0.412..0.415 rows=1 loops=1)
    Recheck Cond: ((sku = '20260314000142'::text) OR (barcode = '20260314000142'::text))
    ->  BitmapOr  (cost=12.44..12.44 rows=1 width=0) (actual time=0.312..0.312 rows=1 loops=1)
          ->  Bitmap Index Scan on idx_products_sku  (cost=0.00..6.18 rows=1 width=0) (actual time=0.121..0.121 rows=1 loops=1)
                Index Cond: (sku = '20260314000142'::text)
          ->  Bitmap Index Scan on idx_products_barcode  (cost=0.00..6.18 rows=1 width=0) (actual time=0.191..0.191 rows=1 loops=1)
                Index Cond: (barcode = '20260314000142'::text)
    Buffers: shared hit=12 read=2
  Planning Time: 0.284 ms
  Execution Time: 0.432 ms

Time: 0.712 ms`,
    },
    {
      name: 'schema-products.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:07:05 +07
shopease=# \d products
                                       Table "public.products"
   Column    |           Type           | Collation | Nullable |    Default
-------------+--------------------------+-----------+----------+-------------
 id          | bigint                   |           | not null |
 name        | character varying(256)   |           | not null |
 sku         | character varying(32)    |           | not null | -- mã SKU chỉ gồm chữ số
 barcode     | character varying(32)    |           | not null | -- mã vạch chỉ gồm chữ số
 price       | numeric(12,2)            |           | not null |
 created_at  | timestamp with time zone |           | not null | now()
Indexes:
    "products_pkey" PRIMARY KEY, btree (id)
    "idx_products_sku" btree (sku)
    "idx_products_barcode" btree (barcode)
    "idx_products_name" btree (name)

shopease=# SELECT count(*) AS total_rows FROM products;
  total_rows
------------
   12418550`,
    },
    {
      name: 'app-search-slow.log',
      lang: 'text',
      content: `2026-03-14 10:05:42.118 DEBUG [http-nio-8080-exec-22] o.h.SQL :
    select p1_0.id,p1_0.name,p1_0.price from products p1_0 where p1_0.sku=? or p1_0.barcode=?
2026-03-14 10:05:45.980 INFO  [http-nio-8080-exec-22] c.s.p.ProductController :
    GET /api/v1/products/search?code=20260314000142 -> 200 in 3881 ms
2026-03-14 10:05:46.222 DEBUG [http-nio-8080-exec-7] o.h.SQL :
    select p1_0.id,p1_0.id,p1_0.name,p1_0.price from products p1_0 where p1_0.sku=? or p1_0.barcode=?
2026-03-14 10:05:50.114 INFO  [http-nio-8080-exec-7] c.s.p.ProductController :
    GET /api/v1/products/search?code=20260314000142 -> 200 in 3894 ms
-- pattern: mỗi request search mất ~3,9 giay, khong co request nao duoi 1 giay
-- Java nhận tham số 'code' là String, nhưng Hibernate bind numeric do @Column(precision=18) trên entity field`,
    },
  ],
  questions: [
    'Vì sao câu query OR giữa sku và barcode không dùng được 2 index sẵn có, dù mỗi cột riêng lẻ đều có index? Chỉ ra bằng dòng nào trong EXPLAIN.',
    'Implicit cast xảy ra ở đâu: JDBC bind numeric, PostgreSQL ép kiểu cột varchar → numeric. Khi cột bị ép kiểu trong OR, planner không thể dùng BitmapOr trên 2 index. Giải thích cơ chế.',
    'Bạn sửa thế nào để index được dùng lại? So sánh: cast tham số về varchar ở ứng dụng, hoặc viết WHERE sku = CAST(:code AS varchar) OR barcode = CAST(:code AS varchar). Tại sao không nên đổi kiểu cột sang numeric?',
  ],
  hints: [
    'Dòng "Filter: ((sku)::numeric = ...) OR ((barcode)::numeric = ...)" trong EXPLAIN cho thấy CẢ HAI CỘT đều bị ép kiểu sang numeric để so sánh với tham số numeric. Khi cột bị ép kiểu, B-tree index trên varchar không khớp biểu thức -> planner không thể dùng BitmapOr.',
    'PostgreSQL không tự cast tham số numeric sang varchar để khớp index; ngược lại nó ép kiểu cột. Khi CẢ HAI vế của OR đều bị ép kiểu, planner từ chối BitmapOr (vì biểu thức không khớp index) và chọn Seq Scan.',
    'Sửa: gửi tham số đúng kiểu varchar (String) hoặc cast vế tham số: WHERE sku = :code::varchar OR barcode = :code::varchar. Không đổi cột sang numeric vì SKU/barcode có thể có leading zero, prefix chữ cái sau này, migration tốn kém.',
  ],
  answer: `**Tóm tắt:** Câu query {{WHERE sku = :code OR barcode = :code}} với cột {{sku}}, {{barcode}} kiểu {{varchar}} nhưng tham số bind {{numeric}} (do Hibernate @Column precision). PostgreSQL không đổi kiểu tham số, mà **ép kiểu CẢ HAI CỘT varchar sang numeric** (xem dòng {{Filter: ((sku)::numeric = ...) OR ((barcode)::numeric = ...)}} trong EXPLAIN). Khi cột bị ép kiểu, B-tree index trên varchar không khớp -> planner không thể dùng **BitmapOr** trên 2 index, chọn **Seq Scan** quét 12,4 triệu dòng, 3,8 giây. Sửa: bind tham số kiểu String, hoặc cast vế tham số {{:code::varchar}}. Không đổi cột sang numeric.
 
### Kiến thức nền: implicit cast + OR = index killer kép
Với điều kiện đơn giản {{WHERE sku = :code}}, implicit cast numeric→varchar phá index (lab-sql-042). Với **OR giữa 2 cột**, vấn đề nhân đôi: PostgreSQL phải gom kết quả từ 2 index qua **BitmapOr**. Nhưng BitmapOr chỉ hoạt động khi điều kiện trên mỗi cột **khớp chính xác index expression** (cột thuần = tham số cùng kiểu). Khi CẢ HAI vế OR đều bị ép kiểu, planner không thấy index nào khả dụng cho BitmapOr -> fallback Seq Scan.

Ví dụ đời thường: bạn có 2 sổ danh bạ (index) — một theo tên, một theo SĐT. Tìm "người có tên X HOẶC SĐT Y". Nếu bạn viết tên và SĐT sai định dạng (vd: SĐT viết thành số không dấu cách), cả 2 sổ đều không tra được -> phải lật trang trang (Seq Scan).

### Nguyên nhân gốc, từng bước
1. Cột {{sku}}, {{barcode}} khai báo {{varchar(32)}}, có B-tree index riêng.
2. Entity field có annotation {{@Column(precision=18)}} -> Hibernate bind tham số kiểu {{numeric}} (hoặc {{BigDecimal}}).
3. PostgreSQL không có toán tử {{varchar = numeric}} trực tiếp, chỉ ép kiểu ngầm. Hướng an toàn là {{varchar → numeric}}, nên planner ép **CẢ HAI CỘT**.
4. Biểu thức trở thành {{WHERE (sku)::numeric = 20260314000142::numeric OR (barcode)::numeric = 20260314000142::numeric}}.
5. Index {{idx_products_sku}} lưu giá trị varchar thô ("20260314000142"), không lưu giá trị sau ép kiểu. Planner không tìm thấy index khớp biểu thức {{(sku)::numeric}}.
6. **BitmapOr yêu cầu mỗi nhánh có index condition khớp**. Vì 2 nhánh đều bị ép kiểu, không nhánh nào dùng được index -> planner chọn **Seq Scan**.
7. Mỗi request quét 12,4 triệu dòng để trả 1 dòng; hàng chục request song song đốt cạn CPU. CPU 89% là hệ quả quét lãng phí.

### Dẫn chứng
- Artifact 1 (câu chậm): dòng {{Filter: ((sku)::numeric = ...) OR ((barcode)::numeric = ...)}} cho thấy CẢ HAI CỘT bị ép kiểu; {{Seq Scan on products}}, {{Rows Removed by Filter: 12418549}}, {{Buffers: shared hit=145210 read=118433}} (~263 nghìn trang), {{Execution Time: 3877.204 ms}}.
- Artifact 1 (câu sửa): cùng điều kiện, cast tham số varchar -> {{Bitmap Heap Scan}}, {{BitmapOr}} với 2 **Bitmap Index Scan** trên {{idx_products_sku}} và {{idx_products_barcode}}, {{Buffers: shared hit=12 read=2}}, {{Execution Time: 0.432 ms}}. Chênh lệch khoảng **9.000 lần** chỉ vì kiểu tham số.
- Artifact 2: index {{idx_products_sku}}, {{idx_products_barcode}} btree trên varchar đã tồn tại.
- Artifact 3: log ứng dụng mỗi request search mất ~3,9 giây; Hibernate bind numeric do @Column(precision=18).

### Cách sửa ngắn hạn (hôm nay)
- **Sửa entity**: bỏ {{@Column(precision=18)}} trên field {{sku}}, {{barcode}}, dùng {{@Column(length=32)}} -> Hibernate bind {{String}}.
- **Hoặc sửa repository**: viết {{WHERE sku = :code::varchar OR barcode = :code::varchar}} (cast vế tham số). Index dùng lại ngay.
- Thêm {{statement_timeout}} cho role search (ví dụ 2 giây) để câu sai kiểu không chiếm DB lâu.

### Cách sửa dài hạn
- **Không đổi cột {{sku}}, {{barcode}} sang {{numeric}}**: SKU/barcode có thể có leading zero (00123), prefix chữ (SP-123), checksum. Đổi sang numeric mất dữ liệu và tốn migration 12 triệu dòng.
- Chuẩn hóa kiểu ở ranh giới ứng dụng–DB: mã SKU, mã vạch, mã thẻ, mã số thuế là **chuỗi**, không phải số, dù chỉ chứa chữ số.
- Quy tắc review: trong {{WHERE}} không được ép kiểu trên cột đã index; PR có truy vấn mới phải kèm {{EXPLAIN (ANALYZE, BUFFERS)}} trên staging có dữ liệu tỉ lệ production.

### Trả lời mẫu khi phỏng vấn
"Câu search OR giữa sku và barcode chạy Seq Scan 3,8 giây vì Hibernate bind tham số numeric (do @Column precision) vào cột varchar. PostgreSQL ép CẢ HAI CỘT varchar sang numeric (Filter có ::numeric), index B-tree bỏ qua, BitmapOr không dùng được -> Seq Scan 12,4 triệu dòng. Dẫn chứng: EXPLAIN có Filter ((sku)::numeric = ...) OR ((barcode)::numeric = ...). Sửa: bỏ @Column precision trên entity field, hoặc cast vế tham số ::varchar. Không đổi cột sang numeric vì mã SKU có thể có leading zero, prefix chữ. Chương trình phải chuẩn hóa kiểu ở ranh giới app-DB."

### Phòng ngừa và monitoring
- Bật {{pg_stat_statements}} và theo dõi {{total_exec_time}} theo queryid; cảnh báo khi truy vấn trên bảng lớn chọn Seq Scan hoặc {{Rows Removed by Filter}} cao so với dòng trả về.
- Bật {{auto_explain}} với {{auto_explain.log_min_duration = 500}}; cảnh báo khi plan đổi từ {{Bitmap Index Scan}} sang {{Seq Scan}}.
- Kiểm tra kiểu tham số khi viết {{PreparedStatement}}: mã SKU, barcode, số điện thoại, mã số thuế đều phải bind String, không phải numeric.

> Senior tip: **Implicit cast + OR là "cặp giết index" chết người**. Một cast phá index đơn lẻ, hai cast phá cả BitmapOr. Khi EXPLAIN thấy Seq Scan dù có index, hãy hỏi ngay: "Điều kiện WHERE có ép kiểu cột không?" — đây là nguyên nhân phổ biến thứ hai sau statistics cũ. Quy tắc vàng: **ép kiểu ở vế tham số, không ở vế cột**. Và với OR, hãy đảm bảo TẤT CẢ vế đều khớp index (không ép kiểu, không hàm, không biểu thức).`,
  rubric: [
    'Chỉ đúng nguyên nhân: tham số numeric khiến PostgreSQL ép CẢ HAI CỘT varchar sang numeric, Filter có ::numeric trên cả sku và barcode -> BitmapOr không dùng được -> Seq Scan',
    'Dẫn chứng đúng: so sánh hai EXPLAIN (tham số numeric -> Seq Scan 3877 ms; cast tham số varchar -> BitmapOr + 2 Bitmap Index Scan 0,43 ms), chỉ ra dòng Filter có ::numeric trên cả 2 cột',
    'Sửa đúng: bind tham số String hoặc CAST vế tham số ::varchar, không đổi kiểu cột, giải thích tại sao không đổi cột sang numeric',
    'Giải thích đúng cơ chế BitmapOr: yêu cầu mỗi nhánh có index condition khớp, ép kiểu cột làm mất khớp',
    'Có monitoring/phòng ngừa: pg_stat_statements, auto_explain, quy tắc review kiểu tham số mã SKU/barcode',
  ],
  tags: ['postgresql', 'index', 'implicit-cast', 'or-condition', 'bitmap-or', 'seq-scan', 'bitmap-index-scan'],
},
{
  id: 'lab-sql-056',
  category: 'sql',
  title: 'CREATE INDEX CONCURRENTLY trong transaction Flyway bị abort: migration lặp vô tận',
  level: 'senior',
  scenario: `**Bối cảnh.** Hệ thống **ShopMart** (Spring Boot 3.3, Flyway 10.x, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) chạy migration tự động khi deploy. Bảng {{orders}} có **28.412.905 dòng** (~4,1 GB dữ liệu + 2,8 GB index). DBA thêm migration tạo index phục vụ báo cáo:
  ~~~sql
  CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders (status, created_at DESC);
  ~~~
  Migration chạy trong Flyway (mặc định bọc mỗi migration trong **một transaction**).

  **Triệu chứng (14/03/2026, 14:02).** Deploy bản v2.14.0. Migration **bị lỗi ngay lập tức**:
  ~~~
  ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block
  ~~~
  Flyway đánh dấu migration **failed**. Team fix code, deploy lại v2.14.1 — migration chạy lại, lại bị lỗi tương tự. Lặp lại 3 lần, mỗi lần Flyway rollback transaction, connection pool bị căng. DBA phải can thiệp thủ công: chạy index bằng psql ngoài transaction, rồi {{flyway repair}}.

  **Việc bạn có.** Ba artifact: log Flyway, snapshot pg_locks lúc migration chạy, và script migration. Hãy giải thích tại sao CREATE INDEX CONCURRENTLY không chạy trong transaction, tại sao Flyway mặc định bọc transaction gây lỗi, và quy trình an toàn để tạo index CONCURRENTLY trên production.

  **Điểm mới so với lab-sql-011/017/040/050:** Tập trung vào **Flyway transaction wrapping** conflict với **CONCURRENTLY**, không phải ALTER TABLE. Lỗi "cannot run inside a transaction block" là đặc trưng, không phải lock wait.`,
  artifacts: [
    {
      name: 'flyway-migration-error.log',
      lang: 'text',
      content: `2026-03-14 14:02:00.012 INFO  [main] o.f.core.internal.command.DbMigrate : Migrating schema "public" to version "47 - add index for report"
2026-03-14 14:02:00.015 INFO  [main] o.f.core.internal.sqlscript.DefaultSqlScriptExecutor : Executing SQL: CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders (status, created_at DESC)
2026-03-14 14:02:00.016 ERROR [main] o.f.core.internal.command.DbMigrate : Migration of schema "public" to version "47" failed! Please restore backups...
2026-03-14 14:02:00.017 ERROR [main] o.f.core.internal.command.DbMigrate : SQL State  : 0A000 --- Error Code : 0 --- Message  : CREATE INDEX CONCURRENTLY cannot run inside a transaction block
2026-03-14 14:02:00.018 ERROR [main] o.f.core.internal.command.DbMigrate : SQL State  : 0A000 --- Error Code : 0 --- Message  : CREATE INDEX CONCURRENTLY cannot run inside a transaction block
-- Flyway 10.x mặc định: spring.flyway.out-of-order=false, spring.flyway.validate-on-migrate=true
-- Mỗi migration chạy trong MỘT transaction (BEGIN ... COMMIT/ROLLBACK).
-- CREATE INDEX CONCURRENTLY yêu cầu KHÔNG trong transaction.
2026-03-14 14:02:00.019 WARN  [main] o.f.core.internal.command.DbMigrate : Rolling back transaction...`,
    },
    {
      name: 'pg-locks-flyway.txt',
      lang: 'text',
      content: `-- 2026-03-14 14:02:00 +07, RDS shopmart-primary
-- Migration V47 chạy, Flyway đang trong transaction (BEGIN đã chạy)
shopmart=# SELECT pid, state, wait_event_type, wait_event, left(query, 80) AS query
FROM pg_stat_activity
WHERE datname = 'shopmart' AND backend_type = 'client backend' AND query LIKE '%CREATE INDEX CONCURRENTLY%';
  pid  | state  | wait_event_type | wait_event |                            query
-------+--------+-----------------+------------+--------------------------------------------------------------
  31245 | active |                 |            | CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders
-- Không có lock wait vì câu lệnh lỗi ngay trước khi lấy lock.
-- Transaction Flyway đang mở (BEGIN) -> CREATE INDEX CONCURRENTLY thấy đang trong transaction block -> báo lỗi 0A000.`,
    },
    {
      name: 'migration-script.sql',
      lang: 'text',
      content: `-- V47__add_index_for_report.sql (Flyway)
-- Chạy tự động khi deploy qua Spring Boot
CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders (status, created_at DESC);
-- Flyway bọc câu này trong: BEGIN; ... COMMIT;
-- Lỗi: CREATE INDEX CONCURRENTLY không được phép trong transaction block.`,
    },
  ],
  questions: [
    'Tại sao CREATE INDEX CONCURRENTLY báo lỗi "cannot run inside a transaction block"? Giải thích cơ chế PostgreSQL yêu cầu.',
    'Flyway mặc định bọc migration trong transaction gây ra lỗi này. Có những cách nào để chạy CREATE INDEX CONCURRENTLY qua Flyway an toàn?',
    'Nếu đã deploy lỗi 3 lần, migration table Flyway bị failed. Làm sao để khôi phục (flyway repair) và chạy lại index an toàn?',
  ],
  hints: [
    'CREATE INDEX CONCURRENTLY cần 2 pass quét bảng, giữa 2 pass không giữ lock mạnh -> PostgreSQL cấm nó trong transaction vì nếu rollback thì index ở trạng thái bất nhất quán.',
    'Flyway: (1) spring.flyway.schemas config, (2) callback afterMigrate chạy psql riêng, (3) tách file migration CONCURRENTLY và chạy thủ công, (4) Flyway 8+ hỗ trợ executeInTransaction=false cho migration riêng.',
    'flyway repair: xóa record failed trong flyway_schema_history, sau đó chạy index bằng psql (không transaction), rồi flyway migrate tiếp.',
  ],
  answer: `**Tóm tắt:** Migration Flyway chạy {{CREATE INDEX CONCURRENTLY}} trong transaction (Flyway mặc định bọc mỗi migration trong BEGIN...COMMIT). PostgreSQL cấm CONCURRENTLY trong transaction vì index được xây dựng 2 pass, giữa 2 pass không giữ lock mạnh — nếu transaction rollback, index sẽ ở trạng thái hỏng (INVALID) không thể dọn. Lỗi {{0A000}} xảy ra ngay lập tức. Sửa: tách migration CONCURRENTLY ra file riêng với {{executeInTransaction=false}} (Flyway 8+) hoặc chạy thủ công bằng psql, sau đó {{flyway repair}} để bỏ qua version đã failed.

### Kiến thức nền: tại sao CONCURRENTLY cấm trong transaction
{{CREATE INDEX CONCURRENTLY}} xây dựng index trong 2 giai đoạn: (1) quét bảng lấy dữ liệu, (2) ghi index. Giữa 2 giai đoạn không giữ {{AccessExclusiveLock}} để cho phép ghi đồng thời. Nếu chạy trong transaction và bị rollback giữa chừng, index đã tạo một phần không thể rollback sạch (không có WAL cho build index) -> PostgreSQL cấm triệt để, ném lỗi {{0A000}} ngay khi thấy đang trong transaction block.

Khác với {{CREATE INDEX}} thường: nó giữ {{ShareLock}} (chặn ghi) trong toàn bộ quá trình, xong mới commit -> có thể trong transaction.

### Flyway và transaction wrapping
Flyway mặc định: mỗi file migration = một transaction. Spring Boot Flyway auto-migration chạy ngay khi ứng dụng khởi động.

| Cách chạy CONCURRENTLY qua Flyway | Ưu điểm | Nhược điểm |
|---|---|---|
| File migration riêng + {{executeInTransaction=false}} (Flyway 8+) | Tự động, không can thiệp | Cần Flyway 8+, chỉ dùng cho câu này |
| Callback {{afterMigrate}} chạy {{psql -c "CREATE INDEX CONCURRENTLY..."}} | Tách hẳn khỏi transaction Flyway | Phụ thuộc psql, cần quản lý credentials |
| Chạy thủ công psql -> {{flyway repair}} -> deploy tiếp | Kiểm soát đầy đủ | Thủ công, dễ quên |
| Tắt auto-migrate, chạy migration qua script CI/CD | Kiểm soát thứ tự, có thể tách CONCURRENTLY | Phức tạp hóa pipeline |

### Nguyên nhân gốc
1. Team thêm {{CREATE INDEX CONCURRENTLY}} vào file migration Flyway thông thường.
2. Flyway bọc câu lệnh trong transaction ({{BEGIN}} ... {{COMMIT}}).
3. PostgreSQL thấy {{CREATE INDEX CONCURRENTLY}} trong transaction block -> ném lỗi {{SQLSTATE 0A000}} ngay lập tức.
4. Flyway rollback transaction, đánh dấu version 47 **failed** trong {{flyway_schema_history}}.
5. Deploy lại v2.14.1: Flyway thấy version 47 failed -> không chạy migration mới cho đến khi repair.

### Dẫn chứng
- Artifact 1: {{ERROR: CREATE INDEX CONCURRENTLY cannot run inside a transaction block}}, {{SQL State: 0A000}}.
- Artifact 2: Migration Flyway đang trong transaction, CREATE INDEX CONCURRENTLY lỗi trước khi lấy lock.
- Artifact 3: Script migration không có cấu hình {{executeInTransaction=false}}.

### Cách sửa ngắn hạn (hôm nay)
1. **Chạy index bằng psql thủ công** (ngoài transaction):
~~~bash
psql "postgresql://user:pass@host:5432/db" -c "CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders (status, created_at DESC);"
~~~
2. **Sửa Flyway history**:
~~~sql
DELETE FROM flyway_schema_history WHERE version = '47' AND success = false;
-- Hoặc: flyway repair (Flyway CLI)
~~~
3. Deploy lại ứng dụng (Flyway sẽ thấy version 47 đã được "sửa" và chạy migration tiếp).

### Cách sửa dài hạn (quy trình chuẩn)
1. **Tách migration CONCURRENTLY**: Tạo file {{V47.1__add_index_concurrently.sql}} với nội dung:
~~~sql
-- executeInTransaction=false
CREATE INDEX CONCURRENTLY idx_orders_status_created ON orders (status, created_at DESC);
~~~
Flyway 8+ đọc comment {{executeInTransaction=false}} và chạy câu này **ngoài transaction**.
2. **Nếu Flyway < 8**: Dùng callback {{afterMigrate}} trong Java:
~~~java
@Component
public class ConcurrentIndexCallback implements Callback {
    @Override
    public boolean supports(Event event, Context context) {
        return event == Event.AFTER_MIGRATE;
    }
    @Override
    public void handle(Event event, Context context) {
        // Chạy psql hoặc JDBCStatement.execute() KHÔNG trong transaction
    }
}
~~~
3. **Quy tắc review**: mọi {{CREATE INDEX CONCURRENTLY}} bắt buộc tách migration hoặc có config {{executeInTransaction=false}}. CI kiểm tra grep "CREATE INDEX CONCURRENTLY" trong file migration không có comment đó -> fail.

### Phòng ngừa và monitoring
- Alert khi {{flyway_schema_history}} có record {{success = false}}.
- Theo dõi {{pg_stat_user_indexes}}: index mới tạo có {{idx_scan = 0}} ban đầu, sau vài phút nên > 0.
- Chạy {{pg_repack}} hoặc {{REINDEX CONCURRENTLY}} nếu index bloat sau build.

> Senior tip: **Flyway + CREATE INDEX CONCURRENTLY = cặp đôi hay gặp lỗi**. Mặc định Flyway bọc transaction, CONCURRENTLY cấm transaction. Luôn nhớ: "index lớn trên bảng production -> CONCURRENTLY -> tách transaction". Nên cấu hình Flyway default {{executeInTransaction=false}} cho migration DDL, chỉ bật transaction cho DML.`,
  rubric: [
    'Chỉ đúng nguyên nhân: Flyway bọc migration trong transaction, CREATE INDEX CONCURRENTLY cấm trong transaction block (SQLSTATE 0A000), PostgreSQL yêu cầu CONCURRENTLY chạy tự do giữa 2 pass quét bảng',
    'Dẫn chứng đúng: artifact 1 lỗi 0A000, artifact 2 Flyway transaction đang mở, artifact 3 script migration không có executeInTransaction=false',
    'Đề xuất sửa đúng: chạy index bằng psql thủ công + flyway repair, hoặc tách migration với executeInTransaction=false (Flyway 8+), hoặc callback afterMigrate',
    'Có quy trình dài hạn: tách migration CONCURRENTLY, quy tắc review bắt buộc executeInTransaction=false, CI check grep',
    'Phân biệt rõ với ALTER TABLE/ADD CONSTRAINT (cần transaction) vs CREATE INDEX CONCURRENTLY (cấm transaction)',
  ],
  tags: ['postgresql', 'index', 'concurrently', 'flyway', 'transaction', 'migration', 'executeintransaction'],
},
{
  id: 'lab-sql-057',
  category: 'sql',
  title: 'OR giữa 2 cột có index: BitmapOr được chọn nhưng chậm hơn Seq Scan do combined selectivity cao',
  level: 'senior',
  scenario: `**Bối cảnh.** Hệ thống **LogiChain** (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM). Bảng {{shipment_event}} ghi log sự kiện vận đơn: **18.214.507 dòng** (~4,2 GB heap + 1,8 GB index). Có 2 index: {{idx_shipment_event_shipment}} trên {{shipment_id}} (cardinality 18M, gần như unique), {{idx_shipment_event_type}} trên {{event_type}} (cardinality 8: CREATED, PICKED, IN_TRANSIT, DELIVERED, FAILED, RETURNED, CANCELLED, EXCEPTION). Endpoint tìm sự kiện: {{WHERE shipment_id = ? OR event_type = 'EXCEPTION'}}.

  **Triệu chứng (14/03/2026, 10:15).** p95 endpoint nhảy từ 40 ms lên **2,8 giây**, CPU RDS từ 15% lên 88%. EXPLAIN cho thấy planner chọn **BitmapOr** (gom Bitmap Index Scan từ 2 index) nhưng thực tế chậm hơn Seq Scan nhiều. DBA nghĩ "BitmapOr chắc chắn nhanh hơn Seq Scan" — thực tế combined selectivity quá cao (OR gom ~40% bảng).

  **Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu OR (BitmapOr), EXPLAIN ANALYZE của Seq Scan ép bằng {{enable_bitmapscan = off}}, và thống kê cột. Hãy giải thích tại sao BitmapOr lại chậm, khi nào OR nên dùng Seq Scan, và cách viết lại an toàn.

  **Điểm mới so với lab-sql-041/055:** Tập trung vào **BitmapOr được chọn nhưng kém hiệu quả hơn Seq Scan** do selectivity cao, không phải index không dùng. Planner chọn BitmapOr vì ước lượng chi phí thấp hơn, nhưng chi phí thực tế (random I/O + heap fetch) cao hơn đọc tuần tự.`,
  artifacts: [
    {
      name: 'explain-bitmapor-slow.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:16:02 +07, RDS logichain-primary (PostgreSQL 15.6)
logichain=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, shipment_id, event_type, created_at, detail
FROM shipment_event
WHERE shipment_id = 's-88990'::uuid
   OR event_type = 'EXCEPTION';
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 Limit  (cost=124.56..124.60 rows=50 width=80) (actual time=2841.112..2841.118 rows=50 loops=1)
   Buffers: shared hit=1894320 read=1442
   ->  Bitmap Heap Scan on shipment_event  (cost=124.56..3841521.44 rows=7285920 width=80) (actual time=0.041..2840.902 rows=7285920 loops=1)
         Recheck Cond: ((shipment_id = 's-88990'::uuid) OR (event_type = 'EXCEPTION'::varchar))
         Heap Fetches: 7285920
         Buffers: shared hit=1894320 read=1442
         ->  BitmapOr  (cost=124.56..124.56 rows=7285920 width=0) (actual time=412.301..412.301 rows=7285920 loops=1)
               ->  Bitmap Index Scan on idx_shipment_event_shipment  (cost=0.00..62.28 rows=1 width=0) (actual time=0.121..0.121 rows=1 loops=1)
                     Index Cond: (shipment_id = 's-88990'::uuid)
               ->  Bitmap Index Scan on idx_shipment_event_type  (cost=0.00..62.28 rows=7285920 width=0) (actual time=412.180..412.180 rows=7285920 loops=1)
                     Index Cond: (event_type = 'EXCEPTION'::varchar)
 Planning Time: 0.284 ms
 Execution Time: 2841.451 ms
 -- BitmapOr gom 2 index: shipment_id (1 dòng) + event_type='EXCEPTION' (7.285.920 dòng).
 -- Heap Fetches: 7.285.920 (random I/O đọc heap từng dòng).`,
    },
    {
      name: 'explain-seqscan-forced.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:18:00 +07, ép planner dùng Seq Scan
logichain=# SET enable_bitmapscan = off;
logichain=# EXPLAIN (ANALYZE, BUFFERS)
SELECT id, shipment_id, event_type, created_at, detail
FROM shipment_event
WHERE shipment_id = 's-88990'::uuid
   OR event_type = 'EXCEPTION';
                                                           QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 Seq Scan on shipment_event  (cost=0.00..3841521.44 rows=7285920 width=80) (actual time=0.021..1124.567 rows=7285920 loops=1)
   Filter: ((shipment_id = 's-88990'::uuid) OR (event_type = 'EXCEPTION'::varchar))
   Rows Removed by Filter: 10928587
   Buffers: shared hit=1245210 read=0
 Planning Time: 0.212 ms
 Execution Time: 1125.212 ms
 -- Seq Scan: 1.125 giây (đọc tuần tự, không random I/O), nhanh hơn BitmapOr 2.8 giây gấp 2.5 lần.`,
    },
    {
      name: 'stats-shipment-event.txt',
      lang: 'text',
      content: `-- 2026-03-14 10:20:00 +07
logichain=# SELECT relname, n_live_tup, n_dead_tup FROM pg_stat_user_tables WHERE relname = 'shipment_event';
  relname      | n_live_tup | n_dead_tup
---------------+------------+------------
 shipment_event | 18214507   | 120442

logichain=# SELECT attname, n_distinct, most_common_vals, most_common_freqs
FROM pg_stats WHERE tablename = 'shipment_event' AND attname = 'event_type';
  attname    | n_distinct |          most_common_vals          |       most_common_freqs
--------------+------------+----------------------------------+--------------------------
 event_type   |          8 | {DELIVERED, IN_TRANSIT, CREATED, PICKED, FAILED, CANCELLED, RETURNED, EXCEPTION} | {0.35,0.25,0.15,0.12,0.06,0.04,0.02,0.01}
-- EXCEPTION chiếm 1% = 182.145 dòng. Nhưng planner ước lượng rows cho EXCEPTION = 7.285.920 (lệch lớn do statistics cũ?).
-- shipment_id near-unique, EXCEPTION = 1% -> OR gom ~40% bảng (7.285.920 / 18.214.507).
-- Planner chọn BitmapOr vì ước lượng chi phí < Seq Scan, nhưng random I/O 7.2M heap fetches chậm hơn sequential scan.`,
    },
  ],
  questions: [
    'Tại sao planner chọn BitmapOr (ước lượng chi phí thấp hơn) nhưng thực tế chậm hơn Seq Scan gấp 2.5 lần? Chỉ ra bằng Heap Fetches và Buffers.',
    'Khi nào OR giữa 2 cột nên dùng Seq Scan thay vì BitmapOr? Giải thích ngưỡng selectivity và chi phí random I/O vs sequential scan.',
    'Bạn sửa thế nào để query nhanh và ổn định? So sánh: (1) UNION ALL tách 2 nhánh + LIMIT push down, (2) partial index trên event_type = EXCEPTION, (3) materialized view cho EXCEPTION events.',
  ],
  hints: [
    'BitmapOr gom TID từ 2 index -> sort TID -> random I/O đọc heap (Heap Fetches). Với 7.2M dòng, random I/O chậm hơn sequential scan 30-50%.',
    'Planner ước lượng chi phí dựa trên cost model: seq_page_cost=1.0, random_page_cost=4.0 (mặc định). Nhưng nếu dữ liệu trong shared_buffers, random_page_cost thực tế thấp hơn -> planner ưu tiên BitmapOr sai.',
    'UNION ALL: nhánh 1 (shipment_id) dùng Index Scan 1 dòng, nhánh 2 (event_type=EXCEPTION) dùng Index Scan + LIMIT. BitmapOr ép gom tất cả rồi mới LIMIT.',
  ],
  answer: `**Tóm tắt:** Query {{WHERE shipment_id = ? OR event_type = 'EXCEPTION'}} dùng **BitmapOr** gom 2 index: shipment_id (1 dòng) + event_type='EXCEPTION' (7.285.920 dòng = 40% bảng). BitmapOr phải fetch 7.285.920 heap tuple (random I/O) -> **2.841 ms**. Ép planner dùng **Seq Scan** ({{SET enable_bitmapscan = off}}) chỉ **1.125 ms** (sequential I/O nhanh hơn). Nguyên nhân: combined selectivity cao (~40% bảng), random_page_cost mặc định 4.0 làm planner ưu tiên BitmapOr, nhưng random I/O thực tế chậm hơn sequential scan. Sửa: {{UNION ALL}} tách 2 nhánh (mỗi nhánh LIMIT 50), hoặc partial index {{WHERE event_type = 'EXCEPTION'}}.

### Kiến thức nền: BitmapOr vs Seq Scan — khi nào cái nào nhanh
**BitmapOr**: gom TID (tuple ID) từ nhiều index -> sort TID -> đọc heap theo TID (random I/O). Phù hợp khi **tổng số dòng khớp nhỏ** (selectivity < 5-10%). Chi phí: index scan + sort TID + random heap fetches.
**Seq Scan**: đọc tuần tự mọi page của bảng (sequential I/O). Phù hợp khi **selectivity cao** (> 10-20%) hoặc bảng nhỏ. Chi phí: sequential I/O, không sort, không random fetch.

PostgreSQL cost model: {{seq_page_cost = 1.0}}, {{random_page_cost = 4.0}} (mặc định). Planner tính: BitmapOr cost = index_cost + sort_cost + random_page_cost * heap_fetches. Với 7.2M heap fetches, cost ước lượng vẫn thấp hơn Seq Scan vì planner cho rằng index selectivity cao. Nhưng thực tế:
- Nếu dữ liệu không trong shared_buffers: random I/O đĩa chậm hơn sequential 10-50x.
- Nếu trong shared_buffers: random_page_cost thực tế ~1.0-1.5, planner quá bi quan (dùng 4.0) -> chọn BitmapOr khi Seq Scan nhanh hơn.

### Nguyên nhân gốc, từng bước
1. Cột {{event_type}} có giá trị {{EXCEPTION}} chiếm 1% (statistics: most_common_freqs = 0.01). Nhưng planner ước lượng rows cho EXCEPTION = 7.285.920 (lệch do statistics cũ hoặc parameter binding).
2. {{shipment_id}} near-unique (1 dòng). OR gom 2 điều kiện -> combined selectivity ước lượng ~40% bảng (7.285.920 / 18.214.507).
3. Planner chọn **BitmapOr** vì cost model thấy index scan + random fetches rẻ hơn Seq Scan toàn bảng (theo cost model mặc định).
4. Thực thi: Bitmap Index Scan event_type trả 7.285.920 TID -> sort TID -> **Heap Fetches: 7.285.920** (random I/O đọc heap từng dòng). {{Buffers: shared hit=1894320}}.
5. Ép Seq Scan: đọc tuần tự 18.2M dòng, sequential I/O, **Execution Time: 1.125 s** (nhanh 2.5 lần).

### Dẫn chứng
- Artifact 1: **BitmapOr** -> **Bitmap Heap Scan**, **Heap Fetches: 7285920**, **Execution Time: 2841.451 ms**.
- Artifact 2: **Seq Scan** ({{enable_bitmapscan = off}}) -> **Execution Time: 1125.212 ms**, nhanh 2.5 lần.
- Artifact 3: {{event_type}} MCV có EXCEPTION freq 0.01 (1%), nhưng planner ước lượng 7.2M (40%) — statistics lệch hoặc parameter binding làm mất MCV.

### Cách sửa ngắn hạn (hôm nay)
1. **UNION ALL + LIMIT push down** (khuyên dùng):
~~~sql
SELECT * FROM (
  SELECT id, shipment_id, event_type, created_at, detail
  FROM shipment_event
  WHERE shipment_id = $1
  LIMIT 50
  UNION ALL
  SELECT id, shipment_id, event_type, created_at, detail
  FROM shipment_event
  WHERE event_type = 'EXCEPTION'
  LIMIT 50
) sub
ORDER BY created_at DESC
LIMIT 50;
~~~
PostgreSQL 14+ push LIMIT vào mỗi nhánh của Append -> nhánh 1 Index Scan 1 dòng, nhánh 2 Index Scan 50 dòng, không Heap Fetches 7.2M.

2. **Partial index** cho EXCEPTION (nếu query thường lọc EXCEPTION):
~~~sql
CREATE INDEX CONCURRENTLY idx_shipment_event_exception
  ON shipment_event (shipment_id, created_at DESC)
  WHERE event_type = 'EXCEPTION';
~~~
Index chỉ chứa 182k dòng (1%), nhẹ, query {{WHERE event_type = 'EXCEPTION'}} dùng index này.

3. **Materialized view** cho EXCEPTION events (refresh định kỳ), dashboard đọc view này.

### Cách sửa dài hạn
- **Cập nhật statistics**: {{ANALYZE shipment_event}} để planner có MCV đúng.
- **Tune random_page_cost**: nếu workload chủ yếu trong RAM, {{SET random_page_cost = 1.5}} (hoặc 1.1 cho SSD/NVMe) cho planner đánh giá đúng chi phí random I/O.
- **Extended statistics**: {{CREATE STATISTICS ... (dependencies) ON shipment_id, event_type FROM shipment_event;}} nếu 2 cột có tương quan.
- **Materialized view** cho event_type hiếm (EXCEPTION, FAILED) refresh 5 phút.

### Phòng ngừa và monitoring
- Alert khi query có **Heap Fetches > 100.000** và **Execution Time > 1 giây** — dấu hiệu BitmapOr kém hiệu quả.
- Auto_explain với {{log_analyze = on}}: soi tỉ lệ **Heap Fetches / Rows Returned > 1000**.
- Dashboard: so sánh EXPLAIN ANALYZE với {{enable_bitmapscan = on/off}} cho query OR quan trọng.

> Senior tip: **BitmapOr không phải thần thánh cho mọi OR**. Với combined selectivity > 10-20%, Seq Scan thường nhanh hơn nhờ sequential I/O. Planner dùng cost model (random_page_cost=4.0) nhưng thực tế trên SSD/NVMe hoặc shared_buffers lớn, random I/O không chậm gấp 4 lần sequential. Luôn test {{enable_bitmapscan = off}} để so sánh. Và nhớ: **UNION ALL + LIMIT push down** là pattern chuẩn cho OR trên bảng lớn — nó tách logic, cho phép planner tối ưu từng nhánh riêng, tránh gom TID khổng lồ.`,
  rubric: [
    'Chỉ đúng nguyên nhân: BitmapOr gom 7.2M TID từ index event_type=EXCEPTION -> Heap Fetches 7.2M (random I/O) chậm hơn Seq Scan sequential I/O',
    'Dẫn chứng đúng: artifact 1 Heap Fetches 7285920, Execution Time 2841 ms; artifact 2 Seq Scan 1125 ms; artifact 3 combined selectivity ~40%, MCV EXCEPTION 1% nhưng planner ước lượng 40%',
    'Giải thích đúng ngưỡng selectivity: BitmapOr tốt khi < 5-10%, Seq Scan tốt khi > 10-20%, cost model random_page_cost=4.0 vs thực tế SSD/RAM',
    'Đề xuất sửa đúng: UNION ALL + LIMIT push down (mỗi nhánh LIMIT 50), partial index WHERE event_type=EXCEPTION, materialized view, tune random_page_cost',
    'Có monitoring/phòng ngừa: alert Heap Fetches > 100k, auto_explain log_analyze, so sánh enable_bitmapscan on/off',
  ],
  tags: ['postgresql', 'index', 'bitmap-or', 'or-condition', 'seq-scan', 'random-io', 'union-all', 'partial-index'],
},
{id:'lab-sql-058',category:'sql',title:'Index trên phone không dùng vì tham số numeric ép kiểu ngầm',level:'senior',scenario:`**Bối cảnh.** Service xác thực OTP cho app ngân hàng **PayVault** (Spring Boot 3.3, PostgreSQL 15.6 trên RDS). Bảng {{user_account}} có 6.800.000 dòng, index B-tree trên {{phone}} kiểu {{varchar(20)}}. Endpoint {{POST /api/v1/auth/otp}} nhận OTP theo số điện thoại; JDBC driver nhận tham số là {{Long}} (số điện thoại parse thành số) và query {{WHERE phone = ?}}. Latency từ 12 ms lên 2,8 s trong giờ cao điểm, CPU RDS 95%.`,artifacts:[{name:'explain-1.txt',lang:'text',content:`EXPLAIN (ANALYZE, BUFFERS): SELECT id, status FROM user_account WHERE phone = 84901234567;
Seq Scan on user_account (actual time=0.03..2814.6 rows=1 loops=1)
Rows Removed by Filter: 6799999
shared hit=12400 read=55200
Planning Time=0.3 ms
Execution Time=2815.0 ms
Index: CREATE INDEX user_account_phone_idx ON user_account(phone);
phone column type: character varying(20)
Parameter type inferred by JDBC: bigint`},{name:'explain-2.txt',lang:'text',content:`EXPLAIN (ANALYZE, BUFFERS): SELECT id, status FROM user_account WHERE phone = '84901234567';
Index Scan using user_account_phone_idx on user_account (actual time=0.05..0.09 rows=1 loops=1)
Index Cond: ((phone)::text = '84901234567'::text)
shared hit=4 read=0
Planning Time=0.2 ms
Execution Time=0.12 ms
Rows: 1`}],questions:['Vì sao index không dùng ở explain-1 và vì sao PostgreSQL lại cho phép so sánh varchar với bigint?','Sửa ở tầng ứng dụng/JDBC như thế nào và kiểm tra lại bằng EXPLAIN ANALYZE?'],hints:['PostgreSQL ép kiểu ngầm theo assignment coercion: varchar -> numeric/bigint nếu cột là text và tham số là số.','Predicate thực thi là {{phone::numeric = $1}} (hoặc bigint), biến đổi cột nên index B-tree trên varchar không khớp.','Bind tham số đúng kiểu text/varchar, đừng parse số điện thoại thành Long.'],answer:`**Tóm tắt:** JDBC bind tham số {{Long}} làm PostgreSQL ngầm ép cột {{phone}} (varchar) thành số để so sánh, predicate thực thi {{phone::numeric = $1}} biến đổi cột nên B-tree trên varchar không khớp → Seq Scan 6,8 triệu dòng, 2,8 s. Bind đúng {{String}} giữ predicate sargable và Index Scan 0,12 ms.
### Bằng chứng
explain-1: Seq Scan, Rows Removed by Filter 6.799.999, read 55.200 buffer, Execution Time 2.815 ms. explain-2 với tham số chuỗi: Index Scan, shared hit 4, 0,12 ms.
### Vì sao PostgreSQL cho phép
PostgreSQL có implicit cast từ varchar sang numeric/bigint trong ngữ cảnh so sánh (assignment coercion). Khi một vế là text và vế kia là số, planner chèn cast lên cột để types khớp, làm predicate không còn "cột = hằng số" nữa. Index B-tree lưu key theo kiểu varchar; biểu thức {{phone::numeric}} là biểu thức khác, nên planner không dùng index.
### Khắc phục
- Ở ứng dụng: giữ phone là String, không parse thành Long/BigInteger; bind JDBC với {{setString}} hoặc JPA {{@Param}} kiểu String.
- Kiểm tra {{pg_stat_statements}} và EXPLAIN ANALYZE để thấy kiểu tham số; nếu driver suy luận sai, ép kiểu rõ ràng trong SQL: {{WHERE phone = CAST(? AS varchar)}} hoặc {{WHERE phone = ?::text}}.
- Thêm constraint/check để phone luôn là chuỗi chữ số; cân nhắc domain type.
- Nếu cần tìm theo số đã chuẩn hóa (bỏ dấu +, khoảng trắng), tạo expression index đúng biểu thức và query đúng biểu thức đó (như lab-sql-006).
### Phòng ngừa
- Code review: cột text không được so sánh với tham số số; test integration với EXPLAIN.
- Monitoring: alert query có Seq Scan trên bảng > 1M dòng và Execution Time > 1 s; theo dõi {{shared read}}.
- Tránh implicit cast ở mọi predicate (date, uuid, numeric) để giữ index.
> Senior tip: Bug này thường xuất hiện khi refactor "phone parse thành Long cho tiện validate". Index có sẵn nhưng predicate đã đổi kiểu; luôn kiểm tra kiểu bind, không chỉ tên cột.`,rubric:['Nhận đúng implicit cast varchar->numeric làm mất index','Dẫn chứng explain-1 Seq Scan vs explain-2 Index Scan','Đề xuất bind tham số đúng kiểu text/String','Nêu kiểm tra pg_stat_statements/EXPLAIN và cast rõ ràng','Có monitoring/phòng ngừa implicit cast'],tags:['postgresql','index','implicit-cast','jdbc','sargable']},
{id:'lab-sql-059',category:'sql',title:'Deadlock giữa 2 transaction cập nhật số dư theo thứ tự khác nhau',level:'senior',scenario:`**Bối cảnh.** Service ví điện tử **WalletX** (Spring Boot 3.3, PostgreSQL 15.6 trên RDS) xử lý chuyển tiền giữa 2 ví. Hai request đồng thời: T1 chuyển 500k từ ví 101 sang 202 (khóa 101 rồi 202); T2 chuyển 300k từ ví 202 sang 101 (khóa 202 rồi 101). Một transaction bị PostgreSQL hủy với SQLSTATE 40P01, số dư có thể lệch nếu ứng dụng không retry đúng.`,artifacts:[{name:'postgresql-2026-11-03.log',lang:'text',content:`2026-11-03 14:22:18.112 +07 [22104] ERROR: deadlock detected
2026-11-03 14:22:18.112 +07 [22104] DETAIL: Process 22104 waits for ShareLock on transaction 104857; blocked by process 22119.
Process 22119 waits for ShareLock on transaction 104858; blocked by process 22104.
Process 22104: UPDATE wallet SET balance = balance - 500000 WHERE id = 202
Process 22119: UPDATE wallet SET balance = balance - 300000 WHERE id = 101
2026-11-03 14:22:18.112 +07 [22104] HINT: See server log for query details.
T1 pid=22104: first UPDATE wallet id=101 then id=202; T2 pid=22119: first UPDATE wallet id=202 then id=101; deadlock_timeout=1s.`},{name:'wallet-tx.log',lang:'text',content:`2026-11-03 14:22:18.115 +07 tx=TX-9001 status=ABORTED reason=deadlock sqlstate=40P01
2026-11-03 14:22:18.116 +07 tx=TX-9002 status=COMMITTED balance_101=... balance_202=...
retry policy: max 3, backoff 50/100/200ms with jitter; only retry on SQLSTATE 40P01/40001
idempotency key: transfer_id UUID stored in wallet_transfer ledger (unique)`}],questions:['Dựng wait-for cycle từ log và giải thích vì sao deadlock detector chọn victim.','Sửa thứ tự khóa và retry/idempotency như thế nào để không mất tiền?'],hints:['T1 giữ 101 chờ 202, T2 giữ 202 chờ 101.','PostgreSQL chọn victim sau deadlock_timeout; transaction bị hủy phải retry toàn bộ, không retry từng câu.','Idempotency key đảm bảo retry không trừ tiền hai lần.'],answer:`**Tóm tắt:** T1 giữ khóa ví 101 chờ 202, T2 giữ 202 chờ 101 tạo chu trình deadlock; PostgreSQL phát hiện sau 1 s và hủy một transaction (SQLSTATE 40P01). Sửa bằng khóa theo thứ tự id tăng dần cho mọi chuyển tiền + retry toàn transaction có idempotency key.
### Bằng chứng
Log: pid 22104 chờ transaction 104857 của 22119; pid 22119 chờ 104858 của 22104; câu UPDATE ngược chiều (22104 update 202, 22119 update 101). wallet-tx.log: TX-9001 ABORTED 40P01, retry policy max 3 với backoff, idempotency key transfer_id.
### Khắc phục
- Mọi luồng cập nhật nhiều ví khóa theo thứ tự id tăng dần trong cùng transaction: {{SELECT ... FROM wallet WHERE id IN (...) ORDER BY id FOR UPDATE}}.
- Bắt SQLSTATE 40P01/40001 và retry toàn transaction (không retry từng câu giữa transaction đã aborted) với backoff + jitter, giới hạn số lần.
- Idempotency: lưu transfer_id (UUID) trong bảng wallet_transfer với unique constraint; retry kiểm tra đã tồn tại thì trả kết quả cũ, tránh trừ tiền hai lần.
- Giữ transaction ngắn, index id, theo dõi deadlock rate và lock wait time.
### Phòng ngừa
- Kiểm thử tải đồng thời hai chiều chuyển tiền; chaos test retry.
- Monitoring: alert deadlock count > ngưỡng, lock wait > 200 ms; log idempotency duplicate.
- Không trộn thứ tự khóa giữa các code path (ví dụ batch job khóa theo created_at khác với API khóa theo id).
> Senior tip: Deadlock không phải lỗi dữ liệu mà là lỗi thứ tự tài nguyên; idempotency + retry toàn transaction là bắt buộc cho ví tiền, không chỉ "thử lại câu UPDATE".`,rubric:['Dựng đúng chu trình 22104↔22119 theo transaction IDs','Nêu deadlock detector hủy transaction 40P01','Đề xuất khóa theo thứ tự id tăng dần','Retry toàn transaction + idempotency key','Có monitoring/phòng ngừa'],tags:['postgresql','deadlock','locking','wallet','idempotency']},
{id:'lab-sql-060',category:'sql',title:'Partitioned table stale statistics gây Nested Loop sai (ước lượng 120 dòng, thực tế 1,8M)',level:'senior',scenario:`**Bối cảnh.** Hệ thống **OrderFlow** (Spring Boot 3.3, Hibernate 6.4, PostgreSQL 16.2 trên RDS, 16 vCPU / 128 GB RAM). Bảng **order_line** được partition theo RANGE trên {{created_at}} (1 partition/tháng, 36 partitions, tổng **42.300.000 dòng**, ~18 GB heap + 9 GB index). Bảng **product** 2.100.000 dòng. Query join đơn hàng - sản phẩm lọc theo {{order_line.created_at}} (tháng hiện tại) và {{product.category_id}}. Index: {{idx_order_line_product}} trên {{product_id}}, {{idx_order_line_created}} trên {{created_at}}, {{idx_product_category}} trên {{category_id}}.

**Triệu chứng (12/03/2026, 08:45).** p95 query nhảy từ 45 ms lên **12,4 giây**, CPU RDS 89%. EXPLAIN ANALYZE cho thấy planner chọn **Nested Loop** với {{order_line}} làm outer (ước lượng **120 rows**), scan {{product}} bằng Index Scan. Thực tế {{order_line}} trả **1.824.567 dòng** (partition tháng hiện tại), Nested Loop lặp 1.8M lần -> **Execution Time 12.415 ms**. Statistics partition cha {{order_line}} đã **stale 3 tuần** (chưa ANALYZE sau bulk load tháng trước).

**Việc bạn có.** Ba artifact: EXPLAIN ANALYZE của câu join chậm, {{pg_stat_user_tables}} + {{pg_stats}} cho partition cha và con, log ứng dụng. Hãy chỉ ra vì sao planner ước lượng sai, tại sao Nested Loop được chọn, và cách khắc phục.`,artifacts:[{name:'explain-join-slow.txt',lang:'text',content:`-- 2026-03-12 08:46:10 +07, RDS orderflow-primary (PostgreSQL 16.2)
-- Query: join order_line (partition tháng 03/2026) + product lọc category_id=10
orderflow=# EXPLAIN (ANALYZE, BUFFERS)
SELECT ol.id, ol.order_id, ol.product_id, ol.qty, ol.price, p.name, p.category_id
FROM order_line ol
JOIN product p ON p.id = ol.product_id
WHERE ol.created_at >= '2026-03-01' AND ol.created_at < '2026-04-01'
  AND p.category_id = 10;
                                                          QUERY PLAN
--------------------------------------------------------------------------------------------------------------------------------------
 Nested Loop  (cost=1.12..84521.44 rows=120 width=104) (actual time=0.041..12415.682 rows=1824567 loops=1)
   Buffers: shared hit=5842104 read=12440
   ->  Append  (cost=0.56..1245.12 rows=120 width=48) (actual time=0.021..412.304 rows=1824567 loops=1)
         Subplans Removed: 35
         ->  Index Scan using order_line_202603_created_at_idx on order_line_202603 ol  (cost=0.56..1245.12 rows=120 width=48)
               Index Cond: (created_at >= '2026-03-01 00:00:00+07' AND created_at < '2026-04-01 00:00:00+07')
               Buffers: shared hit=18420 read=12440
   ->  Index Scan using product_pkey on product p  (cost=0.56..694.32 rows=1 width=56) (actual time=0.006..0.006 rows=1 loops=1824567)
         Index Cond: (id = ol.product_id)
         Filter: (category_id = 10)
         Rows Removed by Filter: 0
         Buffers: shared hit=5823684
 Planning Time: 2.145 ms
 Execution Time: 12416.821 ms
-- Planner ước lượng 120 rows cho partition order_line_202603 (dựa trên stats partition CHA stale).
-- Thực tế partition con có 1.824.567 rows. Nested Loop lặp 1.8M lần Index Scan product.`},{name:'stats-partition.txt',lang:'text',content:`-- 2026-03-12 08:50:00 +07
orderflow=# SELECT relname, n_live_tup, n_dead_tup, last_analyze, last_autoanalyze
FROM pg_stat_user_tables WHERE relname LIKE 'order_line%';
   relname        | n_live_tup | n_dead_tup |     last_analyze     |  last_autoanalyze
------------------+------------+------------+----------------------+--------------------
 order_line       |  42300000  |    12450   | 2026-02-19 03:15:00  | 2026-02-19 03:15:00  -- PARTITION CHA, stale 3 tuần
 order_line_202601|   987450   |     412    | 2026-03-01 03:15:00  | 2026-03-01 03:15:00
 order_line_202602|  1123560   |     520    | 2026-03-08 03:15:00  | 2026-03-08 03:15:00
 order_line_202603|  1824567   |     890    | 2026-03-08 03:15:00  | 2026-03-08 03:15:00  -- partition con đã analyze
 order_line_202604|         0  |       0    |                      |                      -- partition rỗng (tương lai)
 ...

orderflow=# SELECT relname, schemaname, n_live_tup, n_dead_tup
FROM pg_stat_user_tables WHERE relname = 'order_line';  -- chỉ partition cha
   relname  | schemaname | n_live_tup | n_dead_tup
------------+------------+------------+------------
 order_line | public     |  42300000  |    12450   -- tổng 36 partitions

orderflow=# SELECT tablename, attname, n_distinct, most_common_vals, most_common_freqs
FROM pg_stats WHERE tablename = 'order_line' AND attname = 'created_at';
   tablename  | attname    | n_distinct |          most_common_vals          |       most_common_freqs
--------------+------------+------------+----------------------------------+--------------------------
 order_line   | created_at |       -1.0 | {2026-01-15,2026-02-10,2026-02-20}| {0.023,0.019,0.018}  -- stats CHA cũ, không phản ánh tháng 03
-- Partition con order_line_202603 có stats riêng (n_live_tup=1824567) nhưng planner dùng stats CHA khi Append.`},{name:'app-order-slow.log',lang:'text',content:`2026-03-12 08:46:12.340 DEBUG [http-nio-8080-exec-88] o.h.SQL :
    select ol.id, ol.order_id, ol.product_id, ol.qty, ol.price, p.name, p.category_id
    from order_line ol
    join product p on p.id = ol.product_id
    where ol.created_at >= ? and ol.created_at < ? and p.category_id = ?
2026-03-12 08:46:24.755 INFO  [http-nio-8080-exec-88] c.o.OrderController :
    GET /api/v1/orders/lines?month=2026-03&category=10 -> 200 in 12418 ms
-- Pattern: mọi request lọc tháng hiện tại + category đều mất 12-13 giây.`}],questions:['Tại sao planner ước lượng 120 rows cho partition tháng 03 mà thực tế có 1,8M rows? Giải thích vai trò stats partition CHA vs CON.','Tại sao Nested Loop được chọn thay vì Hash Join? Chi phí ước lượng vs thực tế.','Sửa ngắn hạn (hôm nay) và dài hạn (tuần này) như thế nào? So sánh: ANALYZE partition cha, SET enable_nestloop=off, CTE materialized, Hash Join ép bằng join_collapse_limit.'],hints:['Planner dùng stats partition CHA (stale 3 tuần) để ước lượng cho Append, không dùng stats partition CON (đã fresh).','Nested Loop cost = outer_rows * inner_cost. Với outer=120 ước lượng, cost thấp. Thực tế outer=1.8M -> cost thực tế = 1.8M * inner_cost.','ANALYZE partition cha cập nhật n_live_tup tổng, nhưng partition con vẫn giữ stats riêng. Cần ANALYZE partition cha SAU khi partition con có dữ liệu mới.','Hash Join: build hash table inner (product filter category=10 ~210k rows) + probe outer (order_line partition 1.8M) -> sequential I/O, nhanh hơn Nested Loop random I/O.'],answer:`**Tóm tắt:** Planner ước lượng **120 rows** cho partition {{order_line_202603}} dựa trên **statistics partition CHA {{order_line}} stale 3 tuần** (chưa ANALYZE sau bulk load tháng 02-03). Thực tế partition con có **1.824.567 rows**. Planner chọn **Nested Loop** vì cost model thấy outer=120 nhỏ -> Index Scan product 120 lần rẻ hơn Hash Join. Thực tế Nested Loop lặp **1.8M lần** Index Scan product -> **12,4 giây**. Sửa: {{ANALYZE order_line}} (partition cha) ngay lập tức; dài hạn: auto_analyze threshold partition, pg_stat_clear_snapshot, monitor n_live_tup lệch.

### Nguyên nhân gốc, từng bước
1. Bảng {{order_line}} partition RANGE theo tháng. Partition cha {{order_line}} lưu **stats tổng hợp** (n_live_tup=42.3M, last_analyze=19/02). Partition con {{order_line_202603}} có **stats riêng** (n_live_tup=1.82M, last_analyze=08/03).
2. Khi planner xử lý {{Append}} (gộp 36 partitions), nó dùng **stats partition CHA** để ước lượng rows cho từng subplan. Vì stats CHA stale (cập nhật 19/02, trước khi partition 03 có dữ liệu), planner ước lượng **120 rows** cho tháng 03 (dựa trên mật độ cũ).
3. Partition con {{order_line_202603}} thực tế có **1.824.567 rows** (bulk load tháng 03). Planner không dùng stats partition con khi Append vì partition pruning đã chọn 1 partition, nhưng ước lượng rows vẫn lấy từ CHA.
4. Với outer_rows ước lượng = 120, cost Nested Loop = 120 * (Index Scan product cost ~694) = ~83k. Cost Hash Join = build hash product (category=10 ~210k rows) + probe 120 rows = cao hơn ước lượng. Planner chọn **Nested Loop**.
5. Thực thi: Append trả **1.824.567 rows** từ partition 03 -> Nested Loop lặp 1.8M lần Index Scan product -> **Heap Fetches 1.8M**, **Buffers 5.8M**, **Execution Time 12.415 ms**.

### Dẫn chứng
- Artifact 1: **Nested Loop**, **rows=120** (ước lượng), **actual rows=1824567**, **loops=1824567** trên Index Scan product, **Execution Time 12416 ms**.
- Artifact 2: Partition CHA {{order_line}} **last_analyze 19/02** (stale 3 tuần), n_live_tup=42.3M. Partition con {{order_line_202603}} n_live_tup=1.82M, last_analyze=08/03 (fresh). Stats CHA không phản ánh dữ liệu tháng 03.
- Artifact 3: App log 12.4 giây/request, pattern nhất quán.

### Cách sửa ngắn hạn (hôm nay)
1. **ANALYZE partition cha ngay**:
~~~sql
ANALYZE order_line;  -- cập nhật stats tổng hợp, planner sẽ ước lượng đúng ~1.8M cho tháng 03
~~~
Sau ANALYZE, planner chọn **Hash Join** (outer 1.8M probe hash table product 210k) -> ~400 ms.

2. **Workaround ngay nếu không ANALYZE được**: ép Hash Join
~~~sql
SET enable_nestloop = off;  -- session-level, ép planner dùng Hash Join/Merge Join
-- HOẶC dùng CTE materialized:
WITH ol AS MATERIALIZED (
  SELECT * FROM order_line
  WHERE created_at >= '2026-03-01' AND created_at < '2026-04-01'
)
SELECT ol.*, p.name, p.category_id
FROM ol JOIN product p ON p.id = ol.product_id
WHERE p.category_id = 10;
~~~

### Cách sửa dài hạn
- **Giảm auto_analyze threshold cho partition**: {{autovacuum_analyze_scale_factor = 0.01}} (mặc định 0.1) trên partition cha, {{autovacuum_analyze_threshold = 1000}} để trigger sớm khi partition con nhận dữ liệu mới.
- **pg_stat_clear_snapshot()** sau bulk load partition mới: ép planner nạp stats mới mà không cần reconnect.
- **Partition-wise join** (PostgreSQL 14+): {{enable_partitionwise_join = on}} (mặc định on) cho phép planner dùng stats partition con trực tiếp khi join. Kiểm tra {{join_collapse_limit}} đủ lớn (mặc định 8) để không collapse partition.
- **Monitoring**: alert khi {{n_live_tup partition cha}} lệch > 20% tổng {{n_live_tup partition con}} (tổng 36 partitions). Query theo dõi:
~~~sql
SELECT 'order_line' AS parent, n_live_tup FROM pg_stat_user_tables WHERE relname = 'order_line'
UNION ALL
SELECT 'sum_children', SUM(n_live_tup) FROM pg_stat_user_tables WHERE relname LIKE 'order_line\_%';
~~~

### Phòng ngừa và monitoring
- Alert khi query có **loops > 100.000** trên Nested Loop (dấu hiệu ước lượng sai).
- Dashboard: so sánh **Estimated Rows vs Actual Rows** cho query quan trọng (auto_explain log_analyze).
- Chạy {{ANALYZE}} partition cha **sau mỗi bulk load partition mới** (hook trong pipeline CDC/ETL).
- Cân nhắc **pg_repack** hoặc {{CLUSTER}} trên partition lớn để giảm random I/O nếu Hash Join vẫn chậm.

> Senior tip: **Partition table stats là "bẫy" hay gặp nhất**. Partition cha stats chỉ cập nhật khi ANALYZE cha hoặc autovacuum chạy trên cha. Bulk load partition con KHÔNG tự cập nhật stats cha. Luôn nhớ: **sau khi attach/load partition mới -> ANALYZE partition cha**. Và đừng tin auto_analyze mặc định (scale_factor=0.1) trên bảng lớn - nó trigger quá muộn. Tôi để scale_factor=0.01 cho bảng > 100M rows.`,rubric:['Chỉ đúng nguyên nhân: planner dùng stats partition CHA stale để ước lượng rows cho Append, không phản ánh dữ liệu partition CON mới','Dẫn chứng đúng: artifact 1 rows=120 ước lượng vs actual 1824567, loops=1824567; artifact 2 last_analyze CHA 19/02 vs CON 08/03','Giải thích đúng tại sao Nested Loop được chọn: cost model outer=120 rẻ hơn Hash Join','Đề xuất sửa đúng: ANALYZE partition cha ngay, SET enable_nestloop=off workaround, dài hạn giảm auto_analyze_scale_factor, pg_stat_clear_snapshot','Có monitoring/phòng ngừa: alert loops > 100k, dashboard estimated vs actual, ANALYZE sau bulk load'],tags:['postgresql','partition','statistics','nested-loop','hash-join','analyze','autoanalyze','bulk-load']},
{id:'lab-sql-061',category:'sql',title:'Prepared transaction (PREPARE TRANSACTION) quên commit giữ xmin chặn vacuum, bloat n_dead_tup',level:'senior',scenario:`**Bối cảnh.** Hệ thống thanh toán **PayLink** (Spring Boot 3.3, PostgreSQL 15.6 trên RDS, 8 vCPU / 64 GB RAM) dùng **two-phase commit (2PC)** cho giao dịch chuyển tiền liên ngân hàng qua XA transaction. Bảng {{wallet_ledger}} ghi log chuyển tiền: **8.400.000 dòng** (~3,2 GB heap + 1,1 GB index). Mỗi ngày ~150.000 giao dịch, trong đó ~200 giao dịch 2PC.

**Triệu chứng (28/02/2026, 14:30).** Bảng {{wallet_ledger}} bloat nghiêm trọng: **n_dead_tup = 4.200.000** (50% bảng), heap size tăng 40% trong 2 tuần. Autovacuum chạy 6 lần/ngày nhưng **dead tuples không giảm**. pg_stat_progress_vacuum cho thấy vacuum scan toàn bảng nhưng **tuples removed = 0**. CPU vacuum worker cao, I/O đọc ghi liên tục. Không có long-running transaction (pg_stat_activity max xact_start 2 phút).

**Việc bạn có.** Ba artifact: {{pg_prepared_xacts}}, {{pg_stat_user_tables}} + {{pg_stat_progress_vacuum}}, log ứng dụng XA. Hãy tìm nguyên nhân vacuum không dọn dead tuple, và cách khắc phục.`,artifacts:[{name:'prepared-xacts.txt',lang:'text',content:`-- 2026-02-28 14:35:00 +07
paylink=# SELECT * FROM pg_prepared_xacts;
 transaction  | gid                              | prepared           | owner  | database
--------------+----------------------------------+--------------------+--------+----------
 1048576      | xa_2pc_paylink_20260214_001234  | 2026-02-14 09:12:34| paylink| paylink
 1048577      | xa_2pc_paylink_20260215_002156  | 2026-02-15 14:22:56| paylink| paylink
 1048578      | xa_2pc_paylink_20260216_003421  | 2026-02-16 11:05:42| paylink| paylink
 1048579      | xa_2pc_paylink_20260220_004512  | 2026-02-20 16:30:11| paylink| paylink
 1048580      | xa_2pc_paylink_20260222_005678  | 2026-02-22 08:45:33| paylink| paylink
 1048581      | xa_2pc_paylink_20260225_006789  | 2026-02-25 12:10:19| paylink| paylink
-- 6 prepared transaction **chưa COMMIT PREPARED / ROLLBACK PREPARED** từ 14/02 đến 25/02 (2-14 ngày).
-- Mỗi prepared xact giữ **xmin** (transaction ID) tại thời điểm PREPARE.
-- Vacuum không thể dọn tuple có xmin >= prepared_xact_xmin.`},{name:'vacuum-stats.txt',lang:'text',content:`-- 2026-02-28 14:40:00 +07
paylink=# SELECT relname, n_live_tup, n_dead_tup, last_vacuum, last_autovacuum, last_analyze, last_autoanalyze
FROM pg_stat_user_tables WHERE relname = 'wallet_ledger';
   relname      | n_live_tup | n_dead_tup |    last_vacuum    |  last_autovacuum  |    last_analyze    |  last_autoanalyze
----------------+------------+------------+-------------------+-------------------+--------------------+-------------------
 wallet_ledger  |   8400000  |   4200000  | 2026-02-28 14:25  | 2026-02-28 14:25  | 2026-02-28 14:25   | 2026-02-28 14:25
-- n_dead_tup = 4.2M (50%), không giảm sau autovacuum.

paylink=# SELECT * FROM pg_stat_progress_vacuum;
 pid  | datname | relid | phase        | heap_blks_total | heap_blks_scanned | heap_blks_vacuumed | index_vacuum_count | max_dead_tuples | num_dead_tuples
------+---------+-------+--------------+-----------------+-------------------+--------------------+--------------------+-----------------+----------------
 3214 | paylink | 16420 | vacuuming heap|  410000         |  410000           |  410000            |        12          |     178000      |       0
-- vacuum scan hết 410k heap blocks, vacuumed 410k blocks, **num_dead_tuples = 0** (không dọn được tuple nào).
-- max_dead_tuples = 178k (maintenance_work_mem limit), nhưng thực tế 0 tuple xóa được.

paylink=# SELECT age(datfrozenxid) FROM pg_database WHERE datname = 'paylink';
 age
-------
  12450000
-- datfrozenxid age 12.45M (gần ngưỡng autovacuum_freeze_max_age 200M), nhưng không phải vấn đề chính.`},{name:'xa-recovery.log',lang:'text',content:`2026-02-14 09:12:34.112 INFO  [xa-recovery] c.p.XARecoveryManager :
    XAResource.start(xid=xa_2pc_paylink_20260214_001234, flags=TMNOFLAGS)
    XAResource.end(xid=..., flags=TMSUCCESS)
    XAResource.prepare(xid=...) -> XA_OK
    -- PREPARED thành công, chờ commit từ coordinator
2026-02-14 09:12:35.220 ERROR  [xa-recovery] c.p.XARecoveryManager :
    Coordinator unavailable (network partition), cannot send COMMIT
    -- Coordinator down, transaction Prepared bị treo
2026-02-14 09:15:00.000 INFO  [xa-recovery] c.p.XARecoveryManager :
    Recovery scan: found 1 prepared xact (xa_2pc_paylink_20260214_001234), retrying commit...
    XAResource.commit(xid=..., onePhase=false) -> XAER_RMERR (Resource Manager error)
    -- Commit thất bại, Prepared transaction vẫn còn
-- Pattern lặp lại: coordinator network partition -> prepare thành công -> commit thất bại -> recovery retry thất bại -> prepared xact tồn tại vô thời hạn.
-- Ứng dụng KHÔNG có timeout auto-rollback cho prepared transaction.`}],questions:['Tại sao autovacuum scan toàn bảng nhưng num_dead_tuples = 0? Giải thích vai trò xmin của prepared transaction.','Tìm 6 prepared transaction trong artifact 1: chúng đã tồn tại bao lâu? Tại sao vacuum không dọn tuple có xmin >= prepared_xmin?','Sửa ngắn hạn (hôm nay) và dài hạn (tuần này) như thế nào? So sánh: ROLLBACK PREPARED thủ công, max_prepared_xacts timeout, application-level recovery timeout.'],hints:['Prepared transaction giữ xmin "đóng băng" (frozen) tại thời điểm PREPARE. Vacuum chỉ dọn tuple có xmin < oldest active xmin (kể cả prepared xact).','6 prepared xact từ 14/02 đến 25/02 (2-14 ngày). prepared_xact_xmin = xmin tại thời điểm PREPARE. Mọi tuple INSERT/UPDATE sau thời điểm đó có xmin >= prepared_xmin -> vacuum không dọn.','ROLLBACK PREPARED \'xa_gid\' xóa prepared transaction ngay, giải phóng xmin. Vacuum sau đó sẽ dọn được dead tuples.','Dài hạn: ứng dụng phải có timeout auto-rollback prepared xact (ví dụ 1 giờ), monitor pg_prepared_xacts, alert khi age > ngưỡng.'],answer:`**Tóm tắt:** 6 **prepared transaction (2PC)** từ 14/02 đến 25/02 **chưa COMMIT PREPARED / ROLLBACK PREPARED** do coordinator network partition. Mỗi prepared xact giữ **xmin** tại thời điểm PREPARE. **Autovacuum không thể dọn dead tuple** có xmin >= oldest prepared_xact_xmin -> **n_dead_tup 4.2M (50%) không giảm**, vacuum scan toàn bảng nhưng **num_dead_tuples = 0**. Sửa: {{ROLLBACK PREPARED 'gid'}} thủ công 6 xact ngay; dài hạn: app timeout auto-rollback prepared xact > 1 giờ, monitor pg_prepared_xacts, alert age.

### Nguyên nhân gốc, từng bước
1. Ứng dụng dùng **XA 2PC** cho chuyển tiền liên ngân hàng. {{XAResource.prepare()}} thành công -> PostgreSQL tạo **prepared transaction** (hiện trong {{pg_prepared_xacts}}), gán **xmin = transaction ID hiện tại**.
2. Coordinator network partition -> **COMMIT PREPARED không gửi được**. Recovery manager retry commit nhưng thất bại ({{XAER_RMERR}}). Prepared transaction **tồn tại vô thời hạn** (không có timeout auto-rollback ở ứng dụng).
3. 6 prepared transaction tích lũy từ 14/02 đến 25/02. **Oldest prepared_xact_xmin = xmin của xact 14/02** (1048576).
4. Mọi **INSERT/UPDATE/DELETE** trên {{wallet_ledger}} sau 14/02 nhận **xmin >= oldest prepared_xmin**.
5. Autovacuum chạy: chỉ dọn tuple có **xmin < oldest active xmin** (kể cả prepared xact). Vì prepared xact cũ nhất giữ xmin rất cũ, **hết dead tuple đều có xmin >= prepared_xmin** -> **vacuum không dọn được tuple nào** (num_dead_tuples = 0).
6. Dead tuple tích lũy: **n_dead_tup 4.2M (50%)**, heap bloat 40%, autovacuum chạy liên tục (6 lần/ngày) nhưng vô ích, tiêu tốn CPU/I/O.

### Dẫn chứng
- Artifact 1: **6 prepared transaction** trong {{pg_prepared_xacts}}, prepared từ 14/02 đến 25/02 (2-14 ngày), owner=paylink.
- Artifact 2: {{wallet_ledger}} **n_dead_tup = 4.2M**, **pg_stat_progress_vacuum: heap_blks_vacuumed = 410k, num_dead_tuples = 0** (scan hết nhưng không dọn được tuple nào).
- Artifact 3: Log XA recovery: prepare thành công -> coordinator down -> commit thất bại -> retry thất bại -> prepared xact tồn tại. Không có timeout auto-rollback.

### Cách sửa ngắn hạn (hôm nay)
1. **ROLLBACK PREPARED thủ công** 6 prepared transaction:
~~~sql
ROLLBACK PREPARED 'xa_2pc_paylink_20260214_001234';
ROLLBACK PREPARED 'xa_2pc_paylink_20260215_002156';
ROLLBACK PREPARED 'xa_2pc_paylink_20260216_003421';
ROLLBACK PREPARED 'xa_2pc_paylink_20260220_004512';
ROLLBACK PREPARED 'xa_2pc_paylink_20260222_005678';
ROLLBACK PREPARED 'xa_2pc_paylink_20260225_006789';
~~~
Sau đó chạy {{VACUUM (ANALYZE) wallet_ledger}} -> dead tuples được dọn, n_dead_tup về 0.

2. **Kiểm tra dữ liệu**: các giao dịch 2PC này đã rollback ở coordinator chưa? Nếu coordinator đã rollback, ROLLBACK PREPARED an toàn. Nếu coordinator chưa quyết định, cần phối hợp với team operations.

### Cách sửa dài hạn
- **Application-level timeout**: XA recovery manager phải có **max prepared age** (ví dụ 1 giờ). Quá timeout -> tự động {{ROLLBACK PREPARED}} và ghi log alert.
~~~java
@Scheduled(fixedDelay = 300_000) // 5 phút
public void cleanupStalePreparedXacts() {
  List<PreparedXact> stale = jdbc.query(
    "SELECT gid, prepared FROM pg_prepared_xacts WHERE prepared < now() - interval '1 hour'",
    (rs, i) -> new PreparedXact(rs.getString("gid"), rs.getTimestamp("prepared"))
  );
  for (PreparedXact x : stale) {
    jdbc.execute("ROLLBACK PREPARED '" + x.gid + "'");
    log.warn("Rolled back stale prepared xact: {}", x.gid);
    metrics.increment("xa.prepared.rolled_back");
  }
}
~~~
- **Monitoring**: alert khi {{pg_prepared_xacts}} có row **age > 1 giờ** (hoặc {{max_prepared_xacts}} > 0). Dashboard: số prepared xact, age cũ nhất.
- **{{max_prepared_xacts}}**: đặt > 0 (mặc định 0 = unlimited) để giới hạn số prepared xact đồng thời, tránh exhaustion.
- **XA transaction design**: cân nhắc **1PC (single-phase)** cho giao dịch nội bộ, chỉ dùng 2PC khi thực sự cần atomic cross-database. Giảm surface area 2PC.

### Phòng ngừa và monitoring
- Alert: {{SELECT count(*) FROM pg_prepared_xacts WHERE prepared < now() - interval '1 hour'}} > 0.
- Alert: {{age(datfrozenxid)}} tăng bất thường do prepared xact giữ xmin.
- Log structured: mọi PREPARE/COMMIT PREPARED/ROLLBACK PREPARED có correlation ID, gửi sang ELK.
- Chaos test: kill coordinator sau PREPARE, verify app auto-rollback trong 1 giờ.

> Senior tip: **Prepared transaction là "kill switch" cho vacuum**. Một prepared xact quên tồn tại 1 ngày = vacuum vô hiệu hóa cho toàn database (vì xmin global). 2PC hiếm khi cần thiết - 90% trường hợp dùng 1PC + idempotency + reconciliation job an toàn hơn. Nếu BẮT BUỘC 2PC: **timeout auto-rollback là bắt buộc**, không có ngoại lệ.`,rubric:['Chỉ đúng nguyên nhân: prepared transaction 2PC quên giữ xmin chặn vacuum dọn dead tuple','Dẫn chứng đúng: artifact 1 6 prepared xact 14/02-25/02; artifact 2 n_dead_tup 4.2M, vacuum num_dead_tuples=0','Giải thích đúng cơ chế: vacuum chỉ dọn tuple xmin < oldest active xmin (kể prepared xact)','Đề xuất sửa đúng: ROLLBACK PREPARED thủ công 6 xact, app timeout auto-rollback > 1h, monitor pg_prepared_xacts','Có monitoring/phòng ngừa: alert prepared xact age > 1h, max_prepared_xacts, chaos test coordinator down'],tags:['postgresql','prepared-transaction','two-phase-commit','xmin','vacuum','bloat','xa','recovery']},
);

