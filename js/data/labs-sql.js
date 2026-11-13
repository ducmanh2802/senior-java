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
  answer: `**Tóm tắt:** Đây là N+1 do lazy loading: danh sách 50 sản phẩm được lấy bằng 1 câu, rồi với mỗi sản phẩm lại gọi {{p.getCategory().getName()}} trong stream map, kích hoạt 50 câu SELECT category by id. 30.000 request/giờ × 50 = 1.5M câu thêm, khớp với 2.1M calls/giờ. Không câu nào chậm (0.2 ms) nhưng tổng thời gian DB tăng và CPU cao.

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
}
);

