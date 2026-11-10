/* Topics: design, architecture — owner: task T5. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'design-001',
  topic: 'design',
  level: 'senior',
  q: 'Bạn có 45 phút cho một câu system design. Trình bày cách dẫn dắt buổi phỏng vấn từ đầu đến cuối để thể hiện đúng năng lực senior.',
  a: `**Tóm tắt:** System design 45 phút là bài kiểm tra **quy trình tư duy có cấu trúc**, không phải đọc thuộc kiến trúc. Đi theo 7 bước: làm rõ yêu cầu, ước lượng, API, data model, kiến trúc tổng thể, đào sâu điểm nghẽn, trade-off — và nói to suy nghĩ trong suốt quá trình.

### Phân bổ thời gian
| Phút | Hoạt động | Kết quả cần có |
|---|---|---|
| 0–5 | Làm rõ yêu cầu | 3–5 use case, các con số scale, out-of-scope |
| 5–10 | Ước lượng | QPS, storage, bandwidth, read/write ratio |
| 10–15 | API + data model | 3–5 endpoint, bảng/collection chính |
| 15–25 | Kiến trúc tổng thể | Sơ đồ box + luồng đọc/ghi |
| 25–38 | Đào sâu 1–2 điểm nghẽn | Cơ chế cụ thể, không kể tên suông |
| 38–43 | Trade-off + failure modes | Khi nào phương án khác tốt hơn |
| 43–45 | Tóm tắt | 3 câu chốt lại thiết kế |

### 1. Làm rõ yêu cầu (đừng bỏ qua)
- **Functional:** chỉ 3–5 use case chính, hỏi rõ cái gì **không** làm. Ví dụ với URL shortener: có custom alias không, có analytics không, link hết hạn không.
- **Non-functional:** DAU, read/write ratio, peak factor, p99 latency, availability (99.9 hay 99.99), consistency, retention, ngân sách.
- Nếu interviewer không cho số, **tự đặt giả định và nói thành lời**: "Tôi giả sử 10 triệu DAU, peak gấp 3 lần trung bình, chấp nhận eventual consistency cho phần analytics."

### 2. Ước lượng để chọn công nghệ
Công thức đủ dùng:
- {{QPS trung bình = DAU × số thao tác/ngày / 86400}}, {{QPS peak = 2–5 × trung bình}}.
- {{Storage = writes/ngày × kích thước bản ghi × số ngày lưu × replication factor}}.
- **Kết luận quan trọng hơn con số**: 50 GB thì một Postgres là đủ; 50 TB thì phải nghĩ tới partition và object storage.

### 3. API
Viết 3–5 endpoint ngắn gọn, nêu request/response chính và **idempotency key** cho mọi API ghi. Đây là chỗ thể hiện kinh nghiệm production: client retry là chuyện chắc chắn xảy ra.

### 4. Data model và chọn storage
Đi từ **access pattern** ngược lên schema, không đi từ ERD xuống. Nêu:
- Entity chính, khoá chính, khoá phân vùng.
- Index phục vụ đúng câu query nóng nhất.
- Vì sao SQL hay NoSQL: cần transaction/join thì SQL; ghi cực lớn, key-value đơn giản thì wide-column; ranking realtime thì Redis sorted set; file thì S3.

### 5. Kiến trúc tổng thể
Vẽ một sơ đồ đơn giản rồi mới thêm chi tiết:
~~~text
Client -> CDN -> Load Balancer -> API (stateless)
                                   |-> Redis (cache)
                                   |-> Postgres (primary) -> replica
                                   |-> Kafka -> workers -> analytics store
~~~
Nói rõ luồng đọc và luồng ghi khác nhau ở đâu.

### 6. Đào sâu điểm nghẽn
Interviewer thường chọn một trong: hot key, write amplification, tranh chấp khoá, fan-out, consistency khi cache, mất message. Hãy chọn chỗ **bạn hiểu sâu nhất**, giải thích cơ chế từng bước và đưa ra 2 phương án kèm điều kiện chọn.

### 7. Trade-off và failure mode
Luôn trả lời được: "Nếu Redis chết thì sao?", "Nếu traffic tăng 10 lần trong 1 giờ thì sao?", "Điều gì xảy ra nếu hai request đến cùng lúc?". Một thiết kế không có failure mode là một thiết kế chưa được nghĩ.

### Sai lầm thường gặp
- Vẽ ngay khi chưa rõ yêu cầu, rồi phải vẽ lại.
- Kể tên Kafka, Cassandra, Kubernetes như bùa hộ mệnh mà không giải thích **vì sao**.
- Bỏ qua ước lượng nên không biết hệ thống nhỏ hay lớn.
- Im lặng 30 giây suy nghĩ — interviewer không chấm được suy nghĩ trong đầu bạn.
- Không chủ động nói consistency, monitoring, và chi phí vận hành.

> Senior tip: tôi luôn dành 60 giây cuối để nói "phần nào tôi sẽ làm khác nếu có thêm thời gian" — nó cho thấy bạn biết giới hạn của thiết kế và biết ưu tiên, đúng thứ interviewer tìm ở senior.`,
  follow: [
    'Nếu interviewer cắt ngang và đổi yêu cầu giữa chừng, bạn xử lý thế nào?',
    'Bạn ưu tiên đào sâu phần nào khi chỉ còn 10 phút: database hay scaling?',
    'Làm sao chứng minh thiết kế của bạn chịu được peak mà không cần load test thật?'
  ],
  tags: ['system design', 'interview framework', 'estimation']
,
  refs: [
    { type: 'book', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
  ]
},
{
  id: 'design-002',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế URL shortener (như bit.ly) phục vụ 100 triệu URL mới mỗi tháng, đọc nhiều gấp 100 lần ghi. Đi từ yêu cầu tới điểm nghẽn.',
  a: `**Tóm tắt:** URL shortener là bài **key-value ở quy mô lớn**: sinh mã ngắn duy nhất, tra cứu cực nhanh, ghi ít hơn đọc rất nhiều. Chọn sinh mã bằng counter + base62, lưu mapping trong DB có unique index, cache nóng ở Redis, redirect bằng 302 để còn analytics.

### Yêu cầu
- **Functional:** tạo short URL (tuỳ chọn custom alias, TTL), redirect, thống kê click, có thể xoá.
- **Non-functional:** 100M URL mới/tháng ≈ **40 writes/s** trung bình; đọc gấp 100 lần ≈ **4.000 reads/s**, peak 3–5 lần. p99 redirect < 50 ms. Availability 99.99% cho redirect. Analytics chấp nhận chậm vài phút.
- **Ngoài phạm vi:** chống phishing nâng cao, multi-region active-active ngay từ đầu.

### Ước lượng
- 100M × 500 byte ≈ **50 GB/tháng**, khoảng 600 GB/năm — một Postgres có index vẫn thoải mái, chưa cần sharding ngay.
- 7 ký tự base62 cho {{62^7 ≈ 3.5 × 10^12}} tổ hợp, đủ dùng hàng chục năm.
- Cache: 20% URL nóng chiếm 80% traffic; giữ 1–2 triệu entry trong Redis là dư.

### Sinh mã ngắn: 3 cách và lựa chọn
1. **Hash long URL** (MD5/SHA rồi lấy 7 ký tự): cùng URL ra cùng mã, tốt cho dedup, nhưng **phải xử lý collision** bằng cách thử salt.
2. **Random 7 ký tự + retry on conflict**: đơn giản, phân tán tốt, nhưng lãng phí request khi kho mã bắt đầu đầy và không đảm bảo tuyến tính.
3. **Counter toàn cục + base62**: không bao giờ trùng, mã ngắn dần đều. Nhược điểm là **đoán được** mã kế tiếp; khắc phục bằng XOR với số bí mật hoặc thêm vài ký tự random.

Cách tôi chọn: **counter phân đoạn (range allocation)**. Một service lấy trước 10.000 ID từ DB/Redis bằng {{INCRBY}}, phát trong bộ nhớ; nếu process chết chỉ mất một khoảng ID, không ảnh hưởng tính duy nhất.

### API
~~~text
POST /api/v1/urls
  { longUrl, customAlias?, expiresAt? }  -> { shortUrl, code }
GET  /{code}                             -> 302 Location: longUrl
GET  /api/v1/urls/{code}/stats           -> { clicks, countries, referrers }
DELETE /api/v1/urls/{code}
~~~
Mọi POST nhận header {{Idempotency-Key}} để retry không tạo hai bản ghi.

### Data model
~~~sql
CREATE TABLE url_mapping (
  id          BIGINT PRIMARY KEY,
  code        VARCHAR(10) NOT NULL,
  long_url    TEXT NOT NULL,
  user_id     BIGINT,
  created_at  TIMESTAMPTZ NOT NULL,
  expires_at  TIMESTAMPTZ,
  UNIQUE (code)
);
CREATE INDEX idx_mapping_user ON url_mapping(user_id, created_at DESC);
~~~
Bảng click event **không** nằm trong DB giao dịch: bắn vào Kafka, worker ghi sang ClickHouse/BigQuery. Nếu ghi mỗi click vào Postgres, vài nghìn writes/s kèm reads sẽ giết DB rất nhanh.

### Kiến trúc
~~~text
                 +-----------+
Client --------> |   CDN     |
                 +-----------+
                       |
                 +-----------+
                 |    LB     |
                 +-----------+
                       |
            +----------+-----------+
            |      URL service     |  stateless, scale ngang
            +----------+-----------+
                 |            |
          +------+-----+   +--+---------+
          |   Redis    |   | Postgres   |
          | code->url  |   | primary    |
          +------------+   +--+---------+
                              |  replica
                       +------+------+
                       |  Kafka      | -> click worker -> analytics DB
                       +-------------+
~~~

### Luồng đọc (quan trọng nhất)
1. Chuẩn hoá code, kiểm tra định dạng.
2. Tra Redis. Hit thì redirect ngay, **không chạm DB**.
3. Miss thì đọc replica Postgres; nếu thấy thì set Redis TTL 24h kèm jitter.
4. Không thấy thì trả 404 và cache "null" TTL ngắn (30–60 s) để chặn cache penetration.
5. Ghi click event **bất đồng bộ** vào Kafka, không chặn redirect.

### 301 hay 302?
- **301 (permanent):** browser/CDN cache, giảm tải server, nhưng mất khả năng đổi đích, đổi thống kê, thu hồi link.
- **302 (temporary):** mỗi lần click đều qua server, tốn hơn nhưng cho phép analytics chính xác và thay đổi linh hoạt.
Với sản phẩm cần số liệu, chọn 302. Nếu tối ưu chi phí cho link tĩnh vĩnh viễn, có thể cho phép 301 có chủ đích.

### Điểm nghẽn và cách xử lý
| Vấn đề | Triệu chứng | Giải pháp |
|---|---|---|
| Hot URL (lan truyền viral) | Redis/DB một shard quá tải | Local cache L1 trong app + replicate key |
| Cache stampede khi key hết hạn | Nhiều request cùng đọc DB | Single-flight/mutex theo code |
| Sinh mã tranh chấp | Duplicate key khi random | Counter range allocation |
| Bảng phình to | Query chậm dần | Partition theo tháng hoặc theo hash(code) |
| Abuse/phishing | Link độc hại | Safe Browsing API, rate limit theo user/IP |

### Mở rộng
Khi vượt 1 tỷ URL: shard theo {{hash(code)}} với consistent hashing, hoặc chuyển mapping sang KV store (DynamoDB/Cassandra) với {{code}} làm partition key. Analytics tách hoàn toàn, dùng cột thời gian làm partition. Multi-region: mỗi region đọc replica, ghi về primary region; chấp nhận độ trễ replication vài chục ms.

> Senior tip: điều hay bị bỏ qua nhất là **custom alias và trùng mã**. Người dùng nhập alias "promo2026" trong khi hệ thống vừa sinh ra cùng mã — phải tách namespace hoặc kiểm tra unique trên cả hai nguồn, nếu không sẽ có bug rất khó tái hiện.`,
  follow: [
    'Nếu yêu cầu đổi sang 10 tỷ URL và 1 triệu reads/s, kiến trúc thay đổi thế nào?',
    'Bạn đảm bảo thống kê click không mất mát khi Kafka down ra sao?',
    'Custom alias có thể bị chiếm dụng; bạn thiết kế quy tắc đặt và thu hồi thế nào?'
  ],
  tags: ['URL shortener', 'base62', 'cache', 'Kafka']
,
  refs: [
  ]
},
{
  id: 'design-003',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế rate limiter phân tán cho API gateway. So sánh token bucket và sliding window, và cách triển khai nguyên tử với Redis.',
  a: `**Tóm tắt:** Rate limiter bảo vệ hệ thống khỏi lưu lượng vượt sức chịu và chống abuse. Với một instance, token bucket trong bộ nhớ là đủ; với nhiều instance, cần trạng thái chia sẻ và **cập nhật nguyên tử** — Redis + Lua script, hoặc thuật toán xấp xỉ chấp nhận sai số để giảm round-trip.

### Yêu cầu và vị trí đặt
- Giới hạn theo **API key / user / IP / endpoint**, ví dụ 100 req/phút cho user thường, 10.000 cho partner.
- Độ trễ thêm vào mỗi request < 2 ms; limiter chết không được làm sập toàn hệ thống.
- Trả {{429 Too Many Requests}} kèm {{Retry-After}}, {{X-RateLimit-Limit}}, {{X-RateLimit-Remaining}}, {{X-RateLimit-Reset}}.
- Đặt ở API gateway (Nginx/Envoy/Spring Cloud Gateway) để chặn sớm, trước khi vào business service.

### So sánh thuật toán
| Thuật toán | Cách hoạt động | Ưu | Nhược |
|---|---|---|---|
| Fixed window | Đếm trong mỗi phút, reset đầu phút | Rẻ, dễ hiểu | **Burst gấp đôi** ở biên (100 req lúc 12:00:59 + 100 lúc 12:01:00) |
| Sliding window log | Lưu timestamp từng request | Chính xác nhất | Tốn bộ nhớ O(số request), khó scale |
| Sliding window counter | Nội suy giữa window trước và hiện tại | Rẻ, mượt hơn fixed | Vẫn là xấp xỉ, sai số nhỏ |
| **Token bucket** | Xô chứa N token, nạp r token/giây | Cho phép burst có kiểm soát, rẻ | Cần lưu 2 biến (token, thời điểm) |
| Leaky bucket | Hàng đợi xả đều | Làm mượt đầu ra | Thêm độ trễ, không hợp API đồng bộ |

Với API, **token bucket** thường là lựa chọn tốt nhất vì traffic thật vốn có burst: người dùng mở app bắn 20 request một lúc rồi im 5 phút.

### Token bucket hoạt động thế nào
Mỗi key có {{capacity}} (burst tối đa) và {{refillRate}} (token/giây). Khi request đến:
1. Tính {{elapsed = now - lastRefill}}.
2. {{tokens = min(capacity, tokens + elapsed × refillRate)}}.
3. Nếu {{tokens >= cost}} thì trừ và cho qua; ngược lại chặn.

Ví dụ capacity 100, refill 10/s: user im 10 giây được thêm 100 token (đầy xô), sau đó bắn 100 request liên tiếp vẫn qua — đó là burst có chủ đích, không phải bug.

### Triển khai phân tán với Redis
Sai lầm phổ biến: đọc token, tính trong app, ghi lại. Hai request đồng thời đọc cùng giá trị {{tokens = 1}} và cả hai đều được qua ⇒ vượt giới hạn. Phải gộp tính toán và ghi vào **một lệnh nguyên tử**. Redis Lua script chạy đơn luồng nên phù hợp:

~~~text
-- KEYS[1] = rate:user:123 , ARGV = capacity, refill, now_ms, cost
local data = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens = tonumber(data[1])
local ts = tonumber(data[2])
local now = tonumber(ARGV[3])
if tokens == nil then
  tokens = tonumber(ARGV[1])
  ts = now
end
local refill = (now - ts) / 1000.0 * tonumber(ARGV[2])
tokens = math.min(tonumber(ARGV[1]), tokens + refill)
local cost = tonumber(ARGV[4])
local allowed = 0
if tokens >= cost then
  tokens = tokens - cost
  allowed = 1
end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], 86400000)
return { allowed, math.floor(tokens) }
~~~

Lưu ý:
- Dùng **thời gian của Redis** ({{redis.call('TIME')}}) thay vì đồng hồ app để tránh lệch giờ giữa các node.
- TTL phải lớn hơn thời gian đầy xô, nếu không key bị xoá và user được reset burst.
- Mỗi request một lần gọi Redis là 0,3–1 ms trong cùng datacenter, chấp nhận được; nếu cần nhanh hơn, dùng **local bucket + đồng bộ định kỳ** (mỗi 100 ms xin một phần quota từ Redis). Cách này chấp nhận vượt nhẹ nhưng giảm tải Redis hàng chục lần.

### Hot key và sharding
Một API key của partner gọi 500k req/s sẽ biến một key Redis thành điểm nghẽn. Giải pháp:
- Tách quota thành N bộ đếm con ({{rate:key:0..N-1}}) và chọn theo random/hash request; tổng quota vẫn đúng xấp xỉ.
- Với giới hạn theo IP, dùng tiền tố theo dải mạng để tránh key phân tán quá mức.
- Cache quyết định trong thời gian rất ngắn (ví dụ 10 ms) cho các key nóng, đánh đổi độ chính xác.

### Limiter chết thì sao?
- **Fail-open:** cho request đi qua khi Redis không truy cập được. Hệ thống vẫn phục vụ, nhưng mất bảo vệ — phù hợp API đọc thông thường.
- **Fail-closed:** chặn toàn bộ. An toàn cho tài chính nhưng biến sự cố Redis thành sự cố toàn hệ thống.
- Thực tế: fail-open kèm **local fallback limiter** (bucket trong bộ nhớ mỗi instance với quota chia đều) để vẫn có mức bảo vệ tối thiểu.

### Trả lỗi tử tế
Ngoài 429, nên trả thêm thời gian chờ và hướng dẫn. Client tốt sẽ backoff theo {{Retry-After}}; client xấu thì bị chặn — đó chính là mục tiêu.

> Senior tip: đừng đặt rate limit theo user ID nếu chưa xác thực, vì kẻ tấn công tạo hàng triệu tài khoản. Luôn có thêm lớp theo IP và theo endpoint; và nhớ rằng NAT công ty có thể khiến hàng nghìn người dùng chung một IP — giới hạn theo IP phải rộng hơn nhiều so với theo user.`,
  follow: [
    'Bạn xử lý công bằng khi một tenant chiếm hết quota của cụm thế nào?',
    'Nếu cần giới hạn theo cửa sổ trượt chính xác tuyệt đối, bạn chọn cấu trúc dữ liệu gì?',
    'Làm sao test rate limiter dưới tải đồng thời cao mà không bị flaky?'
  ],
  tags: ['rate limiter', 'token bucket', 'Redis', 'Lua']
,
  refs: [
    { type: 'article', title: 'Scaling your API with rate limiters (Stripe)', url: 'https://stripe.com/blog/rate-limiters' },
    { type: 'doc', title: 'Redis INCR: rate limiter pattern', url: 'https://redis.io/docs/latest/commands/incr/' },
  ]
}
,
{
  id: 'design-004',
  topic: 'design',
  level: 'lead',
  refs: [
    { type: 'doc', title: 'Redis: Scripting with Lua', url: 'https://redis.io/docs/latest/develop/interact/programmability/eval-intro/' },
  ],
  q: 'Thiết kế hệ thống flash sale: 100.000 request trong 1 giây cho 1.000 sản phẩm, mỗi người chỉ mua 1, tuyệt đối không oversell. Trình bày cả luồng và cách xử lý sự cố.',
  a: `**Tóm tắt:** Flash sale là bài toán **tranh chấp tài nguyên hữu hạn dưới tải cực lớn**. Nguyên tắc: chặn và quyết định càng sớm càng tốt, trừ kho bằng thao tác **nguyên tử có điều kiện**, tạo đơn bất đồng bộ, và luôn có tầng DB làm chốt chặn cuối cùng chống oversell.

### Yêu cầu
- **Functional:** mở bán đúng giờ, mỗi user tối đa 1 đơn/sản phẩm, giữ hàng trong 10 phút để thanh toán, hết hàng thì vào waitlist.
- **Non-functional:** 100k req/s trong vài giây, p99 phản hồi < 500 ms, **không bao giờ bán quá số lượng**, chấp nhận eventual consistency cho thông báo và thống kê.
- **Ưu tiên:** tính đúng đắn của tồn kho > độ trễ > tính công bằng tuyệt đối.

### Ước lượng nhanh
1.000 sản phẩm, 100.000 request ⇒ hơn 99% request sẽ thất bại. Vậy **phần lớn công việc là từ chối thật nhanh**, không phải tạo đơn. Mục tiêu là chỉ để ~1.000 request đi sâu vào hệ thống.

### Kiến trúc tổng thể
~~~text
Client -> CDN/WAF -> LB -> API gateway (rate limit, auth)
                                |
                         Sale service
                          |         |
                  Redis (Lua)     Kafka (order created)
                  stock + user      |
                  dedup set         v
                              Order worker -> DB (conditional update)
                                                   |
                                              Payment service
~~~
Trước giờ mở bán: **warmup** đưa tồn kho và danh sách user hợp lệ vào Redis. Sau khi bán: đối soát Redis với DB.

### Tầng 1 — chặn ở gateway
- Rate limit theo user/IP/device fingerprint, ví dụ 5 req/s.
- Xác thực trước khi vào sale service để loại bot chưa đăng nhập.
- Có thể dùng "waiting room" phát token theo nhịp để làm phẳng traffic; người dùng thấy vị trí hàng đợi thay vì lỗi.

### Tầng 2 — quyết định trong Redis bằng Lua
Đây là chỗ chống oversell. Một script làm 3 việc nguyên tử: kiểm tra user đã mua chưa, kiểm tra còn hàng, trừ kho và ghi user.

~~~text
-- KEYS[1]=stock:sku, KEYS[2]=buyers:sku ; ARGV[1]=userId
if redis.call('SISMEMBER', KEYS[2], ARGV[1]) == 1 then
  return -1                      -- đã mua rồi
end
local left = tonumber(redis.call('GET', KEYS[1]) or '0')
if left <= 0 then
  return 0                       -- hết hàng
end
redis.call('DECR', KEYS[1])
redis.call('SADD', KEYS[2], ARGV[1])
return 1                         -- thành công, giữ chỗ
~~~

Vì Redis chạy đơn luồng và script là nguyên tử, hai request đồng thời không thể cùng đọc {{left = 1}}. Đây là **reservation**, chưa phải đơn cuối cùng.

### Tầng 3 — tạo đơn bất đồng bộ
Request thành công được đẩy vào Kafka với {{orderId}} sinh sẵn và {{reservationId}}. API trả ngay "đang xử lý" kèm mã tra cứu, không bắt người dùng chờ ghi DB. Worker tiêu thụ và tạo đơn.

### Tầng 4 — DB là chốt chặn cuối
Redis có thể sai do thao tác tay, restore backup, hoặc script lỗi. DB phải tự bảo vệ:

~~~sql
UPDATE inventory
   SET available = available - 1, version = version + 1
 WHERE sku = 'SKU-1' AND available >= 1;
-- affected rows = 0 => hết hàng, huỷ reservation

ALTER TABLE orders ADD CONSTRAINT uk_user_sku UNIQUE (user_id, sku);
~~~
- Câu UPDATE có điều kiện là nguyên tử ở mức row, không cần {{SELECT ... FOR UPDATE}} rồi tính trong app.
- Unique constraint chặn trường hợp hai request của cùng user lọt qua Redis.
- Nếu affected rows = 0, worker đánh dấu reservation thất bại và giải phóng.

### Giữ hàng và hết hạn
Reservation có TTL 10 phút (Redis key + cột {{expires_at}} trong DB). Một job quét reservation quá hạn để hoàn kho. Phải **idempotent**: hoàn kho chỉ khi reservation còn trạng thái PENDING, dùng conditional update để tránh hoàn hai lần.

### Chống oversell: các lỗi thực tế
| Lỗi | Hậu quả | Cách tránh |
|---|---|---|
| Đọc tồn kho rồi ghi trong app | Lost update, oversell | UPDATE có điều kiện hoặc Lua |
| Chỉ tin Redis | Redis restore làm bán quá | DB constraint + đối soát |
| Retry tạo đơn | Một user nhiều đơn | Unique (user, sku), idempotency key |
| Hoàn kho hai lần | Bán vượt số lượng thật | Trạng thái reservation + conditional update |
| Job hết hạn chạy trước khi payment callback tới | Đơn đã trả tiền bị huỷ | Callback và job cùng khoá theo orderId |

### Hot row và sharding
1.000 sản phẩm nhưng một SKU hot có thể nhận 50k request/s. Row inventory của SKU đó thành điểm nghẽn. Có hai cách:
- **Shard tồn kho** thành N bucket (mỗi bucket 1/N số lượng), request chọn bucket ngẫu nhiên còn hàng. Tăng throughput, nhưng phải chấp nhận một bucket hết trong khi bucket khác còn.
- **Serialize theo SKU** qua Kafka partition key = sku: đơn giản, throughput khoảng vài nghìn/s mỗi partition, dễ đúng.

Với 1.000 sản phẩm, sharding theo bucket thường thắng vì tính đúng đắn vẫn được DB bảo vệ.

### Sự cố và vận hành
- **Redis chết trước giờ mở bán:** huỷ sale hoặc chuyển sang chế độ DB-only với rate limit rất thấp — thà chậm còn hơn oversell.
- **Kafka tắc:** reservation vẫn giữ, người dùng thấy "đang xử lý"; cần cảnh báo lag và mở rộng consumer.
- **Đối soát:** cuối ngày so {{số đơn thành công + reservation hết hạn}} với số lượng ban đầu; lệch là sự cố P1.
- **Minh bạch:** hiển thị số lượng còn lại có thể gây tranh chấp; thường chỉ hiện "còn hàng/hết hàng".

> Senior tip: tôi luôn thiết kế flash sale sao cho **có thể tắt trong 1 phút** bằng feature flag và trả về trang "sự cố kỹ thuật" thay vì bán sai. Oversell không chỉ là lỗi dữ liệu, nó là khủng hoảng truyền thông — một đơn hàng không giao được tốn hơn nhiều so với việc từ chối sớm.`,
  follow: [
    'Nếu yêu cầu mỗi người được mua tối đa 3 sản phẩm, script Lua thay đổi thế nào?',
    'Bạn xử lý trường hợp payment callback đến sau khi reservation đã hết hạn ra sao?',
    'Làm sao đối soát tồn kho giữa Redis và DB mà không chặn traffic đang bán?'
  ],
  tags: ['flash sale', 'oversell', 'Redis Lua', 'inventory']
},
{
  id: 'design-005',
  topic: 'design',
  level: 'lead',
  refs: [
    { type: 'article', title: 'Designing robust and predictable APIs with idempotency (Stripe)', url: 'https://stripe.com/blog/idempotency' },
    { type: 'doc', title: 'Pattern: Transactional outbox', url: 'https://microservices.io/patterns/data/transactional-outbox.html' },
  ],
  q: 'Thiết kế hệ thống thanh toán / ví điện tử. Làm sao đảm bảo idempotency, ledger không sai lệch và reconciliation với đối tác?',
  a: `**Tóm tắt:** Thanh toán là bài toán **đúng đắn và truy vết**, không phải bài toán tốc độ. Ba trụ cột: idempotency key cho mọi lệnh ghi, **double-entry ledger** bất biến làm nguồn sự thật, và **reconciliation** hằng ngày với sao kê đối tác. Không có "exactly-once" thần kỳ — chỉ có at-least-once cộng với xử lý idempotent.

### Yêu cầu
- **Functional:** nạp/rút, chuyển tiền nội bộ, thanh toán qua provider (thẻ, ví), hoàn tiền, xem số dư và lịch sử.
- **Non-functional:** không mất tiền, không tạo tiền; mọi thay đổi truy vết được; p99 < 1 s cho lệnh nội bộ; availability 99.99%; audit lưu tối thiểu 7 năm.
- **Ngoài phạm vi:** chống gian lận ML, đa tiền tệ phức tạp (nhưng thiết kế vẫn phải có trường currency).

### Mô hình dữ liệu: double-entry ledger
Mỗi giao dịch gồm **nhiều bút toán** sao cho tổng nợ = tổng có. Không bao giờ UPDATE số dư trực tiếp; chỉ **append** bút toán, số dư là tổng hợp (hoặc bảng materialized cập nhật trong cùng transaction).

~~~sql
CREATE TABLE ledger_entry (
  id           BIGSERIAL PRIMARY KEY,
  txn_id       UUID NOT NULL,
  account_id   BIGINT NOT NULL,
  direction    CHAR(1) NOT NULL CHECK (direction IN ('D','C')),
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency     CHAR(3) NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_idem ON ledger_entry (txn_id, account_id, direction);
~~~
- Tiền lưu bằng **số nguyên đơn vị nhỏ nhất** (VND là đồng, USD là cent). Không dùng {{double}}/{{float}} vì sai số nhị phân.
- Bảng **append-only**: sửa sai bằng bút toán đảo (reversal), không xoá. Đây là yêu cầu kiểm toán, không phải sở thích.
- Số dư có thể tính lại từ ledger bất cứ lúc nào; bảng balance chỉ là cache để đọc nhanh và phải đối soát định kỳ.

### Idempotency
Client gửi {{Idempotency-Key}} (UUID) cho mỗi lệnh. Server lưu key cùng request hash và response:
1. Nếu key mới: xử lý, lưu response trong cùng transaction với ledger entry.
2. Nếu key đã có và request hash giống: trả lại **đúng response cũ**, không xử lý lại.
3. Nếu key đã có nhưng body khác: trả 409 để phát hiện client bug.
Retry mạng, timeout, hay người dùng bấm hai lần đều an toàn.

### State machine của một giao dịch
~~~text
INITIATED -> AUTHORIZED -> CAPTURED -> SETTLED
     |            |            |
     +----------> FAILED <-----+
     |                         |
     +--> EXPIRED       REFUNDED (từ CAPTURED/SETTLED)
~~~
Mỗi chuyển trạng thái là một **conditional update** ({{WHERE status = 'AUTHORIZED'}}). Không cho phép nhảy trạng thái tuỳ tiện; mọi sự kiện lạ ghi log và đẩy vào hàng đợi điều tra.

### Kiến trúc
~~~text
Client -> Payment API -> Payment service -> Ledger DB (primary)
                              |                  |
                              |            outbox table
                              v                  |
                        Provider gateway <-- outbox relay -> Kafka
                              |                                  |
                       webhook receiver ----------------------+
                                                              v
                                                     Settlement/recon job
~~~
- **Outbox pattern:** ghi ledger + ghi event vào cùng DB transaction; một relay đọc outbox và publish Kafka. Tránh dual-write kiểu "ghi DB xong gọi Kafka" — nếu Kafka lỗi, hai bên lệch nhau.
- **Webhook** từ provider phải idempotent theo {{provider_event_id}} vì provider gửi lại nhiều lần.

### Giao dịch phân tán: saga, không phải 2PC
Chuyển tiền giữa hai ví khác service: trừ ví A, cộng ví B. Không dùng distributed transaction. Dùng saga:
1. Trừ A (ghi ledger, trạng thái PENDING).
2. Phát event sang service B.
3. Cộng B thành công ⇒ đánh dấu hoàn tất.
4. Nếu bước 3 thất bại sau N lần ⇒ bút toán bù (compensate) cộng lại A.
Mọi bước idempotent và có thể retry. Trạng thái trung gian phải hiển thị cho người dùng ("đang xử lý"), không được im lặng.

### Reconciliation
Hằng ngày (và có thể mỗi giờ) tải sao kê provider, so khớp theo {{provider_ref}}:
- **Có ở ta, không có ở provider:** giao dịch treo — điều tra, có thể provider timeout nhưng thực tế chưa trừ.
- **Có ở provider, không có ở ta:** webhook mất — chủ động query provider theo ref.
- **Lệch số tiền/phí/tiền tệ:** cảnh báo ngay, không tự động sửa.
- **Trùng:** provider gửi hai lần, đảm bảo ledger chỉ một bút toán.

Kết quả reconciliation phải lưu lại và có dashboard; "không có lệch" cũng là một kết quả cần chứng minh.

### Cô lập và khoá
- Cập nhật số dư: dùng {{UPDATE ... WHERE balance >= amount}} hoặc row lock, và **khoá theo thứ tự account_id tăng dần** để tránh deadlock khi chuyển tiền hai chiều.
- Mức cô lập: với ledger, ưu tiên transaction ngắn và ràng buộc DB; SERIALIZABLE có thể gây retry nhiều, cần đo trước khi dùng diện rộng.

### Bảo mật và tuân thủ
- Không log số thẻ/CVV; token hoá qua provider.
- Phân quyền theo nguyên tắc least privilege; thao tác điều chỉnh thủ công cần 4-eyes approval.
- Audit log bất biến, có thể xuất cho kiểm toán.

> Senior tip: bài học đắt nhất của tôi là **đừng bao giờ để số dư là nguồn sự thật duy nhất**. Khi có sự cố, ledger append-only cho phép dựng lại toàn bộ lịch sử và chứng minh với đối tác; một bảng balance bị UPDATE sai thì không có cách nào biết nó sai từ lúc nào.`,
  follow: [
    'Bạn xử lý webhook đến trước khi API tạo giao dịch hoàn tất thế nào?',
    'Nếu provider không cung cấp sao kê chi tiết, reconciliation dựa vào gì?',
    'Thiết kế API hoàn tiền một phần (partial refund) trên ledger ra sao?'
  ],
  tags: ['payment', 'ledger', 'idempotency', 'outbox']
},
{
  id: 'design-006',
  topic: 'design',
  level: 'mid',
  q: 'Thiết kế notification service gửi email/SMS/push cho hàng triệu người dùng. Làm sao xử lý retry, ưu tiên và tránh gửi trùng?',
  a: `**Tóm tắt:** Notification service là hệ thống **gửi đi, chấp nhận at-least-once**, cần hàng đợi theo kênh và ưu tiên, retry có backoff, dedup theo sự kiện, và tách biệt hoàn toàn khỏi luồng nghiệp vụ chính. OTP của người dùng không được xếp sau chiến dịch marketing.

### Yêu cầu
- **Functional:** gửi email, SMS, push, in-app; template có biến; người dùng cấu hình loại thông báo; xem lịch sử đã gửi; huỷ được thông báo chưa gửi.
- **Non-functional:** 1 triệu thông báo/ngày, peak 10k/phút; OTP p99 < 3 giây end-to-end; không mất thông báo giao dịch; marketing có thể trễ.
- **Ràng buộc:** provider bên thứ ba có rate limit và có lúc down.

### Kiến trúc
~~~text
Service A --\
Service B ---> Notification API -> DB (notification, template)
Service C --/         |
                      v
                Priority router
             /        |         \
        high(OTP)   normal      low(marketing)
             \        |         /
              Kafka topics (3 mức)
                    |
              Channel workers (email/sms/push)
                    |
              Provider adapters (SES, Twilio, FCM)
                    |
              Delivery status -> DB + webhook
~~~
API **chỉ nhận và trả 202**, không gọi provider đồng bộ. Gọi đồng bộ nghĩa là độ trễ và độ tin cậy của provider trở thành của bạn.

### Mô hình dữ liệu
~~~sql
CREATE TABLE notification (
  id            UUID PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  channel       VARCHAR(10) NOT NULL,
  template_code VARCHAR(50) NOT NULL,
  payload       JSONB NOT NULL,
  dedup_key     VARCHAR(200) NOT NULL,
  priority      SMALLINT NOT NULL,
  status        VARCHAR(20) NOT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uk_notif_dedup ON notification (dedup_key, channel);
~~~
{{dedup_key}} ví dụ {{order-paid:12345:email}} — cùng một sự kiện nghiệp vụ chỉ tạo một thông báo mỗi kênh.

### Ưu tiên
Ba topic riêng, ba nhóm worker riêng (hoặc cùng worker nhưng đọc topic theo tỉ lệ):
- **High:** OTP, cảnh báo bảo mật, giao dịch tiền. Không bao giờ bị marketing chặn.
- **Normal:** xác nhận đơn, nhắc lịch.
- **Low:** khuyến mãi, bản tin. Có thể trễ vài giờ.

Nếu dùng chung một queue với priority field, marketing ùa vào sẽ làm OTP chờ — đây là lỗi kinh điển. Tách topic là cách rẻ và chắc chắn nhất.

### Retry
- Retry chỉ với lỗi **tạm thời**: timeout, 429, 5xx. Lỗi vĩnh viễn (email sai định dạng, số điện thoại không tồn tại, 4xx) thì đánh dấu FAILED, không retry.
- **Exponential backoff + jitter**: 1s, 5s, 30s, 2m, 10m; jitter để tránh hàng nghìn worker cùng retry một thời điểm.
- Giới hạn 5–8 lần rồi đẩy **DLQ**. DLQ phải có người xem và công cụ replay.
- Với provider rate limit, worker tự điều tiết (token bucket) thay vì để provider trả 429 liên tục.

### Chống gửi trùng
Hệ thống dùng at-least-once, nên trùng là khả năng thực tế. Ba lớp:
1. Unique {{dedup_key}} khi nhận sự kiện — chặn trùng ở nguồn.
2. Trước khi gọi provider, đánh dấu SENDING bằng conditional update; nếu đã SENDING/SENT thì bỏ qua.
3. Provider thường có idempotency key riêng (một số SMS API hỗ trợ), dùng nếu có.
Không thể đảm bảo tuyệt đối nếu provider không hỗ trợ; vì vậy thông báo marketing chấp nhận trùng hiếm, còn OTP có thể gửi lại là chấp nhận được (người dùng nhập mã mới nhất).

### Template và nội dung
- Template lưu DB, có version; thay đổi template không cần deploy.
- Render với dữ liệu đã kiểm tra; **escape** nội dung người dùng để tránh injection vào HTML email.
- Đa ngôn ngữ theo locale người dùng.
- Giới hạn độ dài SMS, cắt an toàn theo ký tự Unicode.

### Tuỳ chọn người dùng và quy định
- Bảng preference theo {{user_id, channel, category}}; tôn trọng opt-out ngay lập tức.
- Quiet hours: không gửi marketing ban đêm theo múi giờ người dùng.
- Ghi log ai đã đồng ý nhận gì, khi nào — cần cho tuân thủ.

### Provider failover
Mỗi kênh nên có ít nhất hai provider. Adapter interface chung; khi provider chính lỗi liên tiếp (circuit breaker mở), chuyển provider phụ. Lưu ý chi phí và chất lượng khác nhau; failover phải có cảnh báo để không âm thầm đốt tiền.

### Theo dõi
Các chỉ số bắt buộc: queue lag theo priority, tỉ lệ thành công theo provider, p99 độ trễ, số lượng DLQ, tỉ lệ bounce/complaint của email. Bounce rate tăng là dấu hiệu reputation domain đang xấu — phải xử lý trước khi bị blacklist.

> Senior tip: OTP là thứ tôi luôn tách hẳn khỏi hệ thống thông báo thường, đôi khi dùng một luồng riêng với provider riêng. Một chiến dịch marketing gửi nhầm 2 triệu email có thể làm nghẽn queue và khiến OTP trễ 10 phút — đó là sự cố làm người dùng không đăng nhập được, không phải chỉ là email chậm.`,
  follow: [
    'Bạn thiết kế cơ chế huỷ (cancel) thông báo đã vào queue thế nào?',
    'Nếu provider chính tăng giá gấp ba, kiến trúc giúp bạn chuyển đổi ra sao?',
    'Làm sao đo chất lượng gửi email mà không đọc nội dung người dùng?'
  ],
  tags: ['notification', 'retry', 'priority queue', 'dedup']
}
,
{
  id: 'design-007',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế news feed cho mạng xã hội. So sánh fan-out on write và fan-out on read; kiến trúc hybrid xử lý celebrity thế nào?',
  a: `**Tóm tắt:** News feed là bài toán **đọc cực nhiều, ghi có hệ quả lan rộng**. Fan-out on write (push) cho đọc nhanh nhưng ghi đắt; fan-out on read (pull) ghi rẻ nhưng đọc đắt. Hệ thống thực tế dùng **hybrid**: push cho người dùng thường, pull và merge cho celebrity.

### Yêu cầu
- **Functional:** xem feed người mình follow, sắp theo thời gian hoặc relevance; phân trang; thấy bài mới trong vài giây; xoá bài thì biến mất khỏi feed.
- **Non-functional:** 50 triệu DAU, mỗi người follow trung bình 200, mỗi ngày 5 triệu bài mới; đọc 20 lần/ngày/người ⇒ khoảng 11.500 reads/s trung bình, peak 50k. p99 tải feed < 300 ms. Chấp nhận eventual consistency vài giây.

### Ước lượng write amplification
Một người có 1.000 follower đăng bài ⇒ 1.000 bản ghi feed. Nếu trung bình 200 follower, 5 triệu bài/ngày ⇒ **1 tỷ bản ghi feed/ngày**. Với celebrity 50 triệu follower, một bài = 50 triệu bản ghi — không thể push.

### Hai mô hình
| Tiêu chí | Fan-out on write (push) | Fan-out on read (pull) |
|---|---|---|
| Ghi | Đắt, lan rộng theo follower | Rẻ, chỉ ghi bài gốc |
| Đọc | Rất nhanh, đọc danh sách có sẵn | Chậm, phải merge nhiều nguồn |
| Độ trễ thấy bài mới | Vài giây (tuỳ worker) | Gần như tức thì |
| Celebrity | Thảm hoạ write amplification | Tự nhiên xử lý tốt |
| Lưu trữ | Lớn gấp hàng trăm lần | Nhỏ |
| Xoá/sửa bài | Phải lan truyền đi xoá | Chỉ sửa bản gốc |

### Kiến trúc hybrid
~~~text
Post service -> Kafka (post-created)
                    |
            Fan-out worker
             /            \
   follower < 10k      follower >= 10k
        |                     |
  push vào feed cache     đánh dấu "celebrity post"
  của từng follower       (chỉ ghi 1 bản)
        |                     |
        +--------+------------+
                 |
        Feed service khi đọc:
        1. lấy feed đã push từ Redis (ZSET)
        2. lấy bài mới của các celebrity đang follow
        3. merge theo timestamp, phân trang
~~~
- Feed cache: Redis sorted set, {{key = feed:userId}}, {{score = timestamp}}, {{member = postId}}, trim còn 800–1.000 bài. Bài cũ hơn thì fallback DB.
- Danh sách celebrity follow của mỗi user cache riêng, ít thay đổi.
- Fan-out worker scale ngang theo partition của userId; xử lý theo batch để giảm round-trip Redis.

### Luồng ghi
1. Người dùng đăng bài: Post service lưu bài, phát event {{post-created}}.
2. Fan-out worker đọc danh sách follower (cache).
3. Với follower thường: {{ZADD feed:userId timestamp postId}} cho từng người, pipeline theo lô 500.
4. Với celebrity: không push; ghi vào danh sách "recent posts" của tác giả.
5. Người dùng online có thể nhận thông báo realtime qua WebSocket, nhưng feed vẫn nhất quán dần.

### Luồng đọc
1. Lấy N bài mới nhất từ feed ZSET ({{ZREVRANGEBYSCORE}}).
2. Lấy bài mới của celebrity mà user follow, giới hạn theo thời gian.
3. Merge hai danh sách, loại trùng, lấy đủ số cho trang.
4. Hydrate thông tin bài (nội dung, tác giả, media) từ cache/DB theo batch — tránh N+1.
5. Trả cursor là {{(score, postId)}} để phân trang ổn định.

### Phân trang
Không dùng offset vì feed thay đổi liên tục sẽ gây trùng/sót. Dùng **cursor** dựa trên score + id; điều kiện {{score < lastScore OR (score = lastScore AND id < lastId)}}.

### Xoá và sửa bài
- Xoá: đánh dấu deleted ở bài gốc; feed đọc qua lớp lọc. Với push, có thể chấp nhận bài đã xoá vẫn còn trong cache đến khi TTL, hoặc phát event xoá để fan-out worker gỡ (tốn kém).
- Sửa nội dung: chỉ sửa bản gốc, feed chỉ lưu id nên tự động đúng — đây là lợi ích lớn của việc **feed lưu con trỏ, không lưu bản sao nội dung**.

### Ranking
Feed theo thời gian là mặc định dễ hiểu. Với feed có xếp hạng:
1. **Candidate generation:** lấy vài trăm bài từ push/pull/trending.
2. **Scoring:** feature (độ mới, tương tác, quan hệ, loại nội dung) qua mô hình.
3. **Re-ranking:** diversity, chặn nội dung trùng, quảng cáo.
Tách ranking khỏi storage; cache kết quả ngắn hạn. Không chạy model nặng trong request đồng bộ nếu p99 bị ảnh hưởng.

### Sự cố thường gặp
| Sự cố | Nguyên nhân | Giảm thiểu |
|---|---|---|
| Fan-out chậm | Celebrity hoặc worker tắc | Ngưỡng celebrity, batch, backpressure |
| Feed trống | Redis mất dữ liệu | Fallback DB + rebuild theo nhu cầu |
| Bài trùng | Merge push và pull | Dedup theo postId |
| Hot key | Một user được đọc liên tục | Cache L1, replicate |
| Xoá không lan toả | Feed cache còn id cũ | Lọc khi hydrate, TTL ngắn |

### Ví dụ đời thực
  Một mạng xã hội có 30 triệu DAU từng gặp sự cố feed trễ 30 giây vào một tối thứ Sáu khi một diễn viên nổi tiếng đăng bài. **Triệu chứng:** p99 tải feed tăng từ 220 ms lên 30 giây, queue Kafka {{post-created}} lag lên 800k message, CPU của 4 fan-out worker vượt 90%. Người dùng phàn nàn "feed không cập nhật bài mới" trên group Facebook. **Điều tra:** dashboard Grafana cho thấy partition 3 của topic {{post-created}} có throughput đột ngột từ 2k msg/s lên 120k msg/s; {{redis-cli --hotkeys}} chỉ ra key {{feed:<userId>}} của celebrity không xuất hiện — nghĩa là worker đã push 50 triệu lần cho 50 triệu follower nhưng không ai nhận được vì key bị hot. Lệnh {{ZADD feed:userId ...}} trên một key duy nhất trở thành điểm nghẽn do Redis xử lý từng member một. **Nguyên nhân gốc:** celebrity có 50 triệu follower nhưng hệ thống vẫn áp dụng push (fan-out on write) vì ngưỡng celebrity là 10k follower — celebrity này vượt ngưỡng 5.000 lần. Một bài = 50 triệu bản ghi feed, mỗi bản là một ZADD; worker phải thực hiện 50 triệu thao tác Redis trong khi chỉ có 1 partition xử lý. **Xử lý:** (1) Tăng ngưỡng celebrity lên 500k follower và áp dụng ngưỡng động theo throughput thực tế thay vì follower count; (2) celebrity chuyển sang pull — chỉ ghi 1 bản {{recent_posts}} của tác giả, feed service merge khi đọc; (3) worker batch ZADD theo lô 500 member thay vì từng người một, dùng pipeline; (4) thêm read replica cho Redis cluster để phân tán hot key. **Kết quả đo được:** sau 1 tuần, p99 feed trở về 280 ms, queue lag về 0, và celebrity post chỉ mất 3 giây để thấy trên feed của follower thường —acceptable vì fan-out worker chạy nền.

### Trả lời mẫu khi phỏng vấn
  "Khi interviewer hỏi về news feed, tôi bắt đầu bằng một con số: với 50 triệu DAU và trung bình 200 follower mỗi người, mỗi ngày có khoảng 1 tỷ bản ghi feed được tạo nếu dùng push toàn bộ — điều không thể. Vì vậy tôi chọn mô hình hybrid: push cho người dùng có dưới ngưỡng follower (ví dụ 10k), pull cho celebrity. Cơ chế là fan-out worker đọc event post-created từ Kafka, nếu follower dưới ngưỡng thì ZADD vào feed Redis sorted set của từng người; nếu celebrity thì không push, chỉ ghi recent_posts. Khi đọc, feed service lấy từ Redis ZSET của người dùng kết hợp với bài mới của celebrity đang theo dõi, merge theo timestamp. Trade-off là người dùng theo celebrity có thể thấy bài muộn vài giây so với người theo thường, nhưng bù lại hệ thống không bị sập khi một bài viral. Kinh nghiệm thực tế của tôi là ngưỡng celebrity không nên cố định: một tài khoản chỉ 8k follower nhưng có bài viral có thể làm nghẽn worker nếu vẫn push. Vì vậy tôi dùng ngưỡng động dựa trên throughput thực tế và luôn có feature flag để tắt push cho một tài khoản cụ thể trong vòng 1 phút."

  > Senior tip: ngưỡng celebrity không nên cố định cứng 10k. Tôi từng thấy một tài khoản 8k follower nhưng có bài viral nhận 2 triệu tương tác, làm worker fan-out nghẽn cả hàng đợi. Hãy dùng ngưỡng động theo tải thực tế và luôn có cơ chế tắt push cho một tài khoản cụ thể.`,
  follow: [
    'Nếu sản phẩm yêu cầu feed nhất quán tức thì khi follow/unfollow, bạn xử lý ra sao?',
    'Bạn thiết kế rebuild feed khi Redis mất toàn bộ dữ liệu mà không sập hệ thống?',
    'Làm sao cá nhân hoá feed mà vẫn giữ p99 dưới 300 ms?'
  ],
  tags: ['news feed', 'fan-out', 'Redis sorted set', 'celebrity']
,
  refs: [
    { type: 'doc', title: 'Redis sorted sets', url: 'https://redis.io/docs/latest/develop/data-types/sorted-sets/' },
  ]
},
{
  id: 'design-008',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế hệ thống chat realtime: WebSocket, presence, thứ tự tin nhắn và lưu trữ. Xử lý mất kết nối và gửi trùng thế nào?',
  a: `**Tóm tắt:** Chat realtime gồm ba phần độc lập: **kết nối** (WebSocket gateway giữ hàng triệu connection), **định tuyến** (biết user đang ở gateway nào để đẩy tin), và **lưu trữ** (append tin nhắn theo conversation). Thứ tự chỉ cần đảm bảo **trong từng cuộc hội thoại**, không phải toàn cục; gửi tin dùng at-least-once + client dedup.

### Yêu cầu
- **Functional:** chat 1-1 và nhóm, gửi/nhận tức thì, trạng thái đã đọc, online/offline, lịch sử, đính kèm file, push khi offline.
- **Non-functional:** 10 triệu user đồng thời, mỗi user 1–3 connection; p99 gửi tới người nhận < 200 ms; không mất tin nhắn; lịch sử tải < 500 ms cho 50 tin gần nhất.
- **Chấp nhận:** thứ tự toàn cục không cần; presence có thể trễ vài giây; tin nhắn có thể đến trùng trong tình huống retry.

### Kết nối: WebSocket gateway
~~~text
Client ==WebSocket==> Gateway node (giữ socket)
                         |
                    Session registry (Redis):
                    userId -> [gatewayId, connId]
                         |
              +----------+----------+
              |                     |
        Message service        Presence service
              |
        Kafka / Redis Stream
              |
        Gateway đích -> đẩy xuống socket
~~~
- Gateway **không chứa business logic**; chỉ xác thực, giữ socket, đăng ký session, chuyển tin.
- Mỗi gateway phục vụ 100k–500k connection tuỳ RAM và file descriptor; scale ngang bằng thêm node.
- Cần sticky session ở load balancer hoặc dùng shared registry để gateway nào cũng định tuyến được.
- Heartbeat ping/pong mỗi 30 giây; quá 60 giây không có phản hồi thì đóng socket và xoá session.

### Presence
Không nên broadcast trạng thái mỗi lần user online cho toàn bộ danh bạ. Cách làm:
- Ghi {{presence:userId = online}} với TTL 60 giây, refresh theo heartbeat.
- Người xem presence chỉ query cho những người đang mở khung chat (vài chục người), không query cả danh bạ.
- Khi chuyển offline, phát event cho subscriber của user đó (bạn bè đang mở chat).
- Đa thiết bị: presence online nếu **ít nhất một** session còn sống; key theo từng thiết bị và tổng hợp.

### Thứ tự tin nhắn
Chỉ cần thứ tự trong một conversation. Cách chắc chắn:
1. Message service nhận tin, gán **sequence number** tăng dần cho conversation. Có thể dùng Redis {{INCR conv:seq:<id>}}, nhưng phải đảm bảo tính bền (nếu Redis mất, sequence có thể lùi).
2. An toàn hơn: DB/allocator cấp sequence bền theo conversation, hoặc dùng ID có thể sắp xếp (Snowflake) kèm kiểm tra.
3. Lưu tin với {{(conversation_id, seq)}} là khoá duy nhất.
4. Client hiển thị theo seq nhận được; nếu thiếu seq thì yêu cầu bù (gap detection).

Không dùng timestamp client vì đồng hồ điện thoại sai và có thể đảo thứ tự.

### Lưu trữ
Với chat, mẫu truy cập luôn là "lấy N tin gần nhất của một conversation". Chọn wide-column (Cassandra/ScyllaDB/HBase) hoặc Postgres partition:
~~~text
partition key: conversation_id
clustering key: seq DESC
columns: message_id, sender_id, type, body, created_at, edited_at
~~~
- Đọc 50 tin gần nhất là một range scan nhỏ, rất nhanh.
- Conversation nhóm lớn vẫn chỉ một partition; nếu một conversation quá lớn (hiếm), tách theo tháng.
- File/ảnh lưu S3, tin nhắn chỉ lưu metadata và URL đã ký.

### Luồng gửi tin
1. Client sinh {{clientMsgId}} (UUID) và gửi qua WebSocket kèm {{conversationId}}.
2. Gateway chuyển sang Message service (qua RPC nội bộ hoặc Kafka).
3. Message service kiểm tra quyền, chống spam, cấp seq, ghi DB, trả ack cho sender.
4. Phát event {{message-created}} tới các gateway đang giữ session của thành viên.
5. Gateway đẩy xuống client; client gửi ack; nếu không có ack sau timeout, gateway thử lại.
6. Người dùng offline: lưu vào hộp thư chờ và gửi push notification.

### Chống trùng và mất tin
- **At-least-once** ở mọi chặng. Client dedup theo {{clientMsgId}}; server lưu unique {{(conversation_id, client_msg_id)}} để retry không tạo hai tin.
- **Ack 2 chiều:** server ack khi đã ghi bền; client hiển thị trạng thái "đang gửi/đã gửi". Nếu không có ack, client retry với cùng clientMsgId.
- **Reconnect:** client gửi {{lastSeq}} đã nhận; server trả các tin từ {{lastSeq + 1}} (giới hạn số lượng, nếu quá nhiều thì tải theo trang). Đây là cách chắc chắn để không mất tin sau khi mất mạng.
- Không cần "exactly-once": trùng hiếm và dedup rẻ hơn nhiều so với cố gắng đảm bảo tuyệt đối.

### Nhóm lớn
Nhóm 100k thành viên (kênh cộng đồng) không thể fan-out từng người trong request. Dùng mô hình **pull cho nhóm lớn**: ghi một bản vào conversation, client online nhận thông báo "có tin mới" rồi tự tải. Với nhóm nhỏ, push trực tiếp để có độ trễ thấp.

### Sự cố và vận hành
| Sự cố | Ảnh hưởng | Cách xử lý |
|---|---|---|
| Gateway chết | Mất socket | Client reconnect có backoff + jitter, LB chuyển node |
| Session registry cũ | Tin đẩy nhầm node | TTL ngắn, xoá khi đóng socket, fallback hỏi lại |
| Redis seq mất | Trùng/lùi seq | Sequence bền từ DB, hoặc chấp nhận rebuild |
| Consumer chậm | Tin đến trễ | Scale consumer, backpressure, ưu tiên tin 1-1 |
| Spam/flood | Quá tải | Rate limit theo user, chặn trước khi cấp seq |

### Ví dụ đời thực
  Một nền tảng chat với 5 triệu user đồng thời từng mất tin nhắn hàng loạt vào tháng 12 khi một gateway node bị restart. **Triệu chứng:** hàng nghìn người dùng báo "tin nhắn bị mất" giữa một cuộc hội thoại nhóm 1-1; dashboard cho thấy một gateway node bị restart do CPU quá tải, và session registry trong Redis còn một số entry cũ pointing tới gateway đã chết. **Điều tra:** log gateway cho thấy khi node restart, client reconnect nhưng gateway mới không biết lastSeq của client nên trả về 50 tin đầu tiên thay vì các tin sau lastSeq. Lệnh {{HGET session:<userId> lastSeq}} trả về null vì key bị xoá TTL 60 giây trước khi reconnect. **Nguyên nhân gốc:** session registry dùng TTL 60 giây được refresh theo heartbeat, nhưng khi gateway restart, client reconnect trong vòng 2 giây và gateway mới không có lastSeq — client bị coi là lần đầu vào chat. **Xử lý:** (1) client gửi {{lastSeq}} một cách rõ ràng khi reconnect thay vì để gateway tự tra cứu; (2) server trả các tin từ {{lastSeq + 1}} với giới hạn số lượng, nếu quá nhiều thì tải theo trang; (3) tăng TTL session lên 5 phút và xoá session explicit khi đóng socket; (4) thêm retry: gateway mới nếu không có session thì hỏi message service theo conversation_id. **Kết quả đo được:** sau khi fix, reconnect mất 300 ms và không có tin nhắn nào bị mất; dashboard reconnect success rate từ 87% lên 99.9%.

### Trả lời mẫu khi phỏng vấn
  "Chat realtime có ba phần độc lập cần thiết kế: kết nối, định tuyến và lưu trữ. Kết nối là WebSocket gateway giữ socket, không chứa business logic, mỗi node phục vụ 100k–500k connection. Định tuyến dùng session registry nhỏ trong Redis biết user đang ở gateway nào để đẩy tin — đây là thứ không thể thay thế bằng database vì sẽ tạo ra hàng triệu query mỗi giây. Lưu trữ dùng append tin nhắn với sequence number tăng dần cho mỗi conversation, không dùng timestamp client vì đồng hồ có thể sai. Về mất kết nối, chìa khóa là client reconnect phải gửi lastSeq đã nhận; server trả các tin từ lastSeq+1, giới hạn số lượng nếu quá nhiều. Về gửi trùng, hệ thống dùng at-least-once everywhere và client dedup theo clientMsgId; server lưu unique (conversation_id, client_msg_id) để retry không tạo hai tin. Trade-off là không cố gắng exactly-once vì trùng rarity và dedup rẻ hơn nhiều so với đảm bảo tuyệt đối."

  > Senior tip: đừng cố làm WebSocket "stateless" bằng cách đẩy mọi thứ qua database — bạn sẽ tạo ra hàng triệu query mỗi giây. Cái cần là **registry tập trung nhỏ** (user đang ở gateway nào) cộng với gateway giữ socket trong RAM; đó là mô hình đã được chứng minh ở quy mô hàng chục triệu kết nối.`,
  follow: [
    'Mã hoá đầu cuối (end-to-end encryption) ảnh hưởng gì tới kiến trúc?',
    'Làm sao đảm bảo thứ tự tin nhắn khi một conversation bị di chuyển giữa các shard?',
    'Nếu cần tìm kiếm toàn văn trong lịch sử chat, bạn tích hợp kho nào và đồng bộ ra sao?'
  ],
  tags: ['chat', 'WebSocket', 'presence', 'message ordering']
,
  refs: [
    { type: 'doc', title: 'RFC 6455: The WebSocket Protocol', url: 'https://datatracker.ietf.org/doc/html/rfc6455' },
    { type: 'doc', title: 'Spring Framework: WebSockets', url: 'https://docs.spring.io/spring-framework/reference/web/websocket.html' },
  ]
},
{
  id: 'design-009',
  topic: 'design',
  level: 'mid',
  q: 'So sánh cache-aside, write-through và write-behind. Làm sao xử lý cache stampede, hot key và invalidation nhất quán?',
  a: `**Tóm tắt:** Cache-aside là mặc định cho hầu hết hệ thống: app tự đọc cache, miss thì đọc DB rồi set. Write-through ghi cả cache lẫn DB ngay; write-behind ghi cache rồi ghi DB sau (nhanh nhưng có nguy cơ mất dữ liệu). Ba vấn đề luôn phải trả lời: invalidation, stampede (nhiều request cùng miss), và hot key.

### So sánh ba mô hình
| Mô hình | Luồng ghi | Ưu | Nhược | Dùng khi |
|---|---|---|---|---|
| Cache-aside | Ghi DB, xoá cache | Đơn giản, cache chỉ chứa dữ liệu đã dùng | Có cửa sổ stale, miss đầu tiên chậm | Mặc định, dữ liệu đọc nhiều |
| Read-through | App đọc cache; cache tự load từ DB khi miss | App không cần biết DB | Cần cache hỗ trợ loader | Thư viện/hạ tầng có sẵn |
| Write-through | Ghi cache + DB trong cùng luồng | Cache luôn mới, đọc ngay sau ghi thấy đúng | Ghi chậm hơn, ghi dữ liệu ít đọc là lãng phí | Dữ liệu cần đọc-tức-thì sau ghi |
| Write-behind | Ghi cache, DB ghi bất đồng bộ | Ghi rất nhanh, gộp batch | **Mất dữ liệu nếu cache chết**, phức tạp | Counter, metrics, dữ liệu chịu mất |

### Cache-aside đúng cách
~~~java
public User getUser(long id) {
    String key = "user:" + id;
    User cached = redis.get(key, User.class);
    if (cached != null) return cached;

    User user = repository.findById(id).orElseThrow();
    long ttl = 600 + ThreadLocalRandom.current().nextInt(60);
    redis.set(key, user, Duration.ofSeconds(ttl));   // jitter chống avalanche
    return user;
}

public void updateUser(User user) {
    repository.save(user);
    redis.delete("user:" + user.id());   // xoá SAU khi DB commit
}
~~~
Vì sao **xoá** thay vì cập nhật cache? Hai request ghi đồng thời có thể cập nhật cache theo thứ tự ngược với DB, để lại dữ liệu cũ vĩnh viễn. Xoá đơn giản hơn và lần đọc sau tự nạp lại.

### Invalidation: những cạm bẫy
1. **Xoá trước khi commit:** request khác đọc miss, nạp dữ liệu cũ từ DB chưa commit, rồi ghi lại cache — dữ liệu cũ sống tiếp. Luôn xoá **sau** commit.
2. **Xoá hai lần (delayed double delete):** xoá sau commit rồi xoá lại sau 500 ms để dọn dữ liệu cũ lỡ được ghi. Là biện pháp giảm thiểu, không phải bảo đảm.
3. **CDC/binlog (Debezium):** nghe thay đổi DB và xoá cache — đáng tin nhất, tách khỏi code nghiệp vụ, nhưng thêm hạ tầng.
4. **TTL là lưới an toàn:** mọi key nên có TTL, kể cả khi bạn nghĩ invalidation đã đúng.

### Stampede (thundering herd)
Khi một key nóng hết hạn, hàng nghìn request cùng miss và cùng đọc DB. Ba cách:
- **Mutex/single-flight theo key:** chỉ một request được load, các request khác chờ hoặc trả dữ liệu cũ. Dùng {{SET lock:key NX PX 3000}}.
- **Probabilistic early expiration:** làm mới sớm với xác suất tăng dần khi gần hết TTL.
- **Stale-while-revalidate:** trả dữ liệu cũ đã hết hạn trong lúc một worker nền làm mới.

Code single-flight tối giản:
~~~java
User loadWithLock(String key, long id) {
    if (redis.setIfAbsent("lock:" + key, "1", Duration.ofSeconds(3))) {
        try {
            User u = repository.findById(id).orElseThrow();
            redis.set(key, u, Duration.ofMinutes(10));
            return u;
        } finally {
            redis.delete("lock:" + key);
        }
    }
    sleep(50);
    return getFromCacheOrDb(key, id);
}
~~~

### Hot key
Một key được đọc hàng trăm nghìn lần/giây làm một node Redis quá tải.
- **L1 in-process cache** (Caffeine) TTL 1–5 giây: giảm 90%+ request tới Redis.
- **Key replication:** tạo {{user:123:0..9}} với cùng giá trị, đọc random — phân tán tải nhưng invalidation phải xoá cả 10.
- **Đọc từ replica:** nếu chỉ đọc, thêm read replica cho cache tier.
- Xác định hot key bằng {{redis-cli --hotkeys}} hoặc theo dõi latency per-key.

### Penetration và avalanche
- **Penetration:** key không tồn tại bị hỏi liên tục. Cache giá trị null TTL ngắn, hoặc dùng Bloom filter để loại trước khi chạm DB.
- **Avalanche:** nhiều key hết hạn cùng lúc do được nạp cùng lúc. Thêm **jitter** vào TTL: {{ttl = base + random(0, base × 0.1)}}.

### Nhất quán: chọn mức nào?
- Dữ liệu tài chính, số dư: **không cache** hoặc cache rất ngắn kèm invalidation chặt; đọc thẳng DB/ledger.
- Catalog sản phẩm: cache 1–5 phút, chấp nhận stale.
- Cấu hình feature flag: cache local + pub/sub để xoá nhanh.
Đừng hứa "cache luôn đúng"; hãy nói rõ **độ trễ nhất quán chấp nhận được** và cách đo.

### Ví dụ đời thực
  Một hệ thống đơn hàng dùng cache-aside cho catalog sản phẩm (100k sản phẩm, đọc 50k lần/giây). Một ngày 11/11, sau khi dev deploy mới, khách hàng thấy giá sản phẩm cũ trong 15 phút. **Triệu chứng:** p99 tải trang sản phẩm tăng từ 200 ms lên 2 giây, nhiều khách phàn nàn "giá không cập nhật" trên group Facebook. **Điều tra:** log ứng dụng cho thấy sau khi deploy, cache key {{product:<id>}} vẫn còn TTL 600 giây từ lần đọc trước deploy; dev đã sửa logic tính giá nhưng không xoá cache. Lệnh {{redis-cli KEYS product:*}} cho thấy hàng nghìn key vẫn giữ giá cũ. **Nguyên nhân gốc:** cache-aside chỉ xoá cache khi dữ liệu thay đổi từ cùng app; deploy mới là một "thay đổi" khác biệt — cache không tự invalidation. **Xử lý:** (1) thêm delayed double delete — xoá cache ngay sau commit rồi xoá lại sau 500 ms; (2) thêm TTL jitter 600–660 giây để không có hàng nghìn key hết hạn cùng lúc; (3) thêm CDC (Debezium) nghe binlog Postgres và xoá cache tự động — đáng tin nhất; (4) chuẩn bị feature flag để tắt cache trong 1 phút khi cần. **Kết quả đo được:** sau khi triển khai CDC, không có trường hợp nào cache stale vượt 1 giây; p99 trở về 180 ms.

### Trả lời mẫu khi phỏng vấn
  "Khi hỏi về caching, tôi luôn bắt đầu bằng cache-aside vì đó là mô hình mặc định: app tự đọc cache, miss thì đọc DB rồi set; khi ghi thì xoá cache SAU khi DB commit — xoá thay vì cập nhật vì hai request ghi đồng thời có thể cập nhật cache theo thứ tự ngược với DB. Ba vấn đề luôn phải trả lời: invalidation, stampede và hot key. Invalidation: xoá trước commit là sai vì request khác có thể nạp dữ liệu cũ; delayed double delete (xoá sau commit rồi xoá lại 500 ms) là giảm thiểu; CDC/Debezium nghe binlog là đáng tin nhất. Stampede: khi key nóng hết hạn, hàng nghìn request cùng miss; dùng single-flight mutex (SET NX PX) để chỉ một request load, các request khác chờ hoặc trả stale. Hot key: dùng L1 in-process cache (Caffeine) TTL 1–5 giây để giảm 90% request tới Redis, hoặc key replication. Trade-off là cache luôn không thể đúng tuyệt đối; điều quan trọng là biết stale tối đa chấp nhận được và cách đo."

  > Senior tip: trong sự cố production, cache thường là thứ che lỗi chứ không phải nguyên nhân. Tôi luôn chuẩn bị khả năng **tắt cache trong 1 phút** (feature flag) để xem hệ thống có sống nổi không; nếu tắt cache mà DB sập ngay thì bạn chưa có cache, bạn có một điểm chết mới.`,
  follow: [
    'Bạn chọn TTL thế nào cho dữ liệu vừa cần mới vừa đọc rất nhiều?',
    'Làm sao invalidate cache khi dữ liệu thay đổi từ một service khác không chung codebase?',
    'So sánh Redis và cache local (Caffeine) về nhất quán và độ trễ.'
  ],
  tags: ['caching', 'cache-aside', 'stampede', 'hot key']
}
,
{
  id: 'design-010',
  topic: 'design',
  level: 'lead',
  refs: [
    { type: 'article', title: 'How to do distributed locking (Martin Kleppmann)', url: 'https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html' },
    { type: 'doc', title: 'Redis: Distributed Locks', url: 'https://redis.io/docs/latest/develop/use/patterns/distributed-locks/' },
  ],
  q: 'Distributed lock: Redis Redlock có thực sự an toàn? Khi nào dùng ZooKeeper/etcd, và fencing token giải quyết vấn đề gì?',
  a: `**Tóm tắt:** Distributed lock chỉ an toàn tuyệt đối khi có **fencing token** — một số thứ tự tăng dần mà tài nguyên đích kiểm tra được. Redis single-node với SET NX PX + token là đủ cho phần lớn nhu cầu "tránh làm trùng". Redlock nhiều node giảm rủi ro mất lock nhưng vẫn phụ thuộc đồng hồ và không cứu được client bị dừng (GC pause) sau khi lock hết hạn. Với tính đúng đắn cao, ưu tiên ràng buộc DB/optimistic lock hơn là lock phân tán.

### Vì sao cần lock
Ví dụ: hai instance cùng chạy job tính lại báo cáo, hoặc hai request cùng trừ tồn kho. Lock phân tán cho **loại trừ lẫn nhau** trên nhiều process/máy. Nhưng trước khi dùng, hãy hỏi: có cách nào **không cần lock** không? Unique constraint, conditional update, partition theo key thường đơn giản và đúng hơn.

### Redis lock cơ bản
~~~text
SET lock:report:2026-10 "token-uuid" NX PX 30000
~~~
- {{NX}}: chỉ set nếu chưa tồn tại — đây là phần "acquire".
- {{PX 30000}}: TTL 30 giây để tránh deadlock nếu process chết.
- {{token-uuid}}: giá trị riêng của lần acquire, dùng khi release.

Release phải kiểm tra token, nếu không sẽ xoá lock của người khác khi lock cũ đã hết hạn và người mới đã vào:
~~~text
-- KEYS[1]=lock key, ARGV[1]=token
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
~~~
Hai lệnh GET rồi DEL tách rời là sai; phải gộp trong Lua.

### Vấn đề lớn nhất: lock hết hạn khi client vẫn đang làm việc
Kịch bản kinh điển:
1. Client A acquire lock TTL 30 giây.
2. A bị **stop-the-world GC** 40 giây (hoặc mạng chậm, VM bị treo).
3. Lock hết hạn, client B acquire và bắt đầu ghi.
4. A tỉnh dậy, tưởng mình vẫn giữ lock, và **ghi đè** kết quả của B.

TTL dài hơn không giải quyết triệt để, chỉ giảm xác suất. Watchdog (gia hạn tự động) cũng không cứu được nếu process bị treo hoàn toàn.

### Fencing token
Giải pháp đúng: mỗi lần acquire cấp một **số tăng dần** (từ counter Redis/etcd/DB). Mọi thao tác ghi gửi kèm số này; tài nguyên đích **từ chối** token nhỏ hơn token lớn nhất đã thấy.
~~~text
A acquire -> token 33
A pause ...
lock expire, B acquire -> token 34, B ghi với 34 (storage ghi nhớ 34)
A tỉnh, ghi với 33 -> storage từ chối vì 33 < 34
~~~
Đây là lý do Kleppmann nói lock **một mình** không đủ cho tính đúng đắn; cần storage hỗ trợ kiểm tra fencing. Nếu tài nguyên đích không kiểm tra được token (ví dụ ghi file S3), lock không bảo vệ được bạn khỏi kịch bản pause.

### Redlock và tranh luận
Redlock: acquire trên N=5 node độc lập, thành công nếu ≥ 3 node trong thời gian ngắn hơn TTL; coi là giữ lock nếu thời gian còn lại > 0.
- **Phía ủng hộ (antirez):** giảm phụ thuộc một node, chịu được mất node, phù hợp khi cần hiệu quả.
- **Phía phản đối (Kleppmann):** vẫn dựa vào **đồng hồ và timing**, không có fencing; một client pause dài vẫn ghi đè; hệ thống có thể mất lock trong lúc sự cố mạng. Khuyến nghị dùng hệ thống có consensus thật (ZooKeeper/etcd) và fencing.
Kết luận thực dụng: Redlock **không sai** cho mục tiêu "giảm khả năng hai worker chạy cùng lúc", nhưng **không đủ** cho mục tiêu "không bao giờ ghi đè". Đừng dùng nó cho thanh toán hay tồn kho nếu không có ràng buộc thứ hai.

### ZooKeeper / etcd
- **ZooKeeper:** tạo **ephemeral sequential node**; node nhỏ nhất giữ lock. Session chết thì node biến mất tự động. Watch để biết khi lock được giải phóng. Là hệ thống consensus (ZAB), nên có tính tuyến tính hoá cho thao tác ghi.
- **etcd:** lease + revision; acquire bằng transaction so sánh revision; lease hết hạn thì key mất. Ít thao tác hơn, dễ vận hành trong hệ sinh thái Kubernetes.
- Nhược điểm chung: thêm một cụm phải vận hành, độ trễ cao hơn Redis, throughput thấp hơn nhiều.

### Chọn gì cho từng tình huống
| Nhu cầu | Lựa chọn hợp lý |
|---|---|
| Tránh hai job trùng, chấp nhận hiếm khi trùng | Redis SET NX PX + token + TTL |
| Bầu leader cho scheduler | etcd/ZooKeeper lease, hoặc DB advisory lock |
| Bảo vệ tồn kho/thanh toán | **Không dùng lock phân tán**; dùng conditional update + unique constraint |
| Cần loại trừ tuyệt đối, có storage kiểm tra token | Consensus + fencing token |
| Chống xử lý trùng message | Idempotency key, không phải lock |

### Thực hành tốt
- TTL dài hơn thời gian xử lý dự kiến 3–5 lần; có watchdog gia hạn nhưng **không tin tưởng tuyệt đối**.
- Luôn release trong {{finally}} bằng Lua kiểm tra token.
- Ghi log {{acquire/release}} kèm token và thời gian giữ lock để điều tra.
- Nếu lock là "nice to have" (chỉ giảm tải), fail-open; nếu là "bắt buộc", phải có ràng buộc tầng dữ liệu.

### Ví dụ đời thực
Một nền tảng thương mại điện tử chạy job tính lại tồn kho khả dụng (available stock = tổng tồn kho - tồn kho đang giữ cho đơn chưa thanh toán) theo lịch mỗi 5 phút. Job này chạy trên 3 instance Spring Boot để dự phòng, và dùng Redis {{SET lock:stock-recalc NX PX 30000}} để chỉ một instance chạy. Một buổi tối thứ Bảy, traffic tăng gấp 4 lần vì chương trình flash sale. **Triệu chứng:** dashboard kho hàng hiển thị tồn kho âm cho 12 mã sản phẩm (ví dụ -47 chiếc áo thun), trong khi đơn hàng vẫn được tạo thành công. Metric {{lock.stock.held_seconds}} có vài điểm nhảy lên 45–55 giây, vượt TTL 30 giây; log cho thấy 2 instance cùng in "recalc started" cách nhau 18 giây cho cùng một chu kỳ.

**Điều tra:** kiểm tra GC log (JDK 17, G1GC) trên instance A: {{jcmd <pid> GC.heap_info}} và GC log cho thấy một lần Full GC kéo dài 38 giây do heap 6 GB bị căng và promotion failure (vùng Old đầy, không kịp thu gom). Truy vết log theo {{requestId}} của job cho thấy: A acquire lock lúc 20:05:00, bắt đầu đọc dữ liệu; A bị Full GC 38 giây; lock hết hạn lúc 20:05:30; B acquire thành công lúc 20:05:31 và tính lại tồn kho dựa trên snapshot mới; B ghi kết quả (token logic không có) lúc 20:05:42; A tỉnh dậy lúc 20:05:38 và ghi đè kết quả của B (tính trên dữ liệu cũ hơn) lúc 20:05:55. Kết quả A bỏ qua các đơn giữ chỗ mà B đã trừ, nên tồn kho bị cộng ngược lại sai.

**Nguyên nhân gốc:** lock chỉ dùng TTL, không có cơ chế fencing token; tài nguyên đích (bảng {{stock_snapshot}}) chấp nhận mọi lần ghi mà không kiểm tra thứ tự. Stop-the-world GC dài hơn TTL làm lock mất hiệu lực loại trừ nhưng client không biết.

**Xử lý:** (1) Chuyển job sang **một consumer duy nhất** dùng partition/leader election thay vì lock phân tán — bỏ hẳn bài toán tranh chấp. (2) Với các thao tác vẫn cần ghi từ nhiều nguồn, thêm cột {{recalc_version BIGINT}} vào {{stock_snapshot}} và dùng conditional update: {{UPDATE stock_snapshot SET qty=?, recalc_version=? WHERE sku=? AND recalc_version < ?}}; version lấy từ Redis {{INCR stock:recalc:version}} (hoặc sequence DB) mỗi lần acquire logic. (3) Release lock bằng Lua kiểm tra token (đã có nhưng chưa dùng nhất quán). (4) Điều chỉnh GC: giảm {{-Xmx}} xuống 4 GB cho job worker, bật {{-XX:MaxGCPauseMillis=200}}, tách job nặng ra process riêng để GC của web request không ảnh hưởng. (5) Thêm cảnh báo khi {{lock.held_seconds > 20}} hoặc khi phát hiện hai lần "recalc started" trong một chu kỳ.

**Kết quả đo được:** sau 2 tuần không còn tồn kho âm do recalc. p99 thời gian Full GC của worker giảm từ 38 giây xuống 180 ms. Conditional update từ chối trung bình 0,3 lần/giờ (các trường hợp tranh chấp hiếm còn lại) và được log để theo dõi — chứng tỏ fencing đang bảo vệ đúng.

### Trả lời mẫu khi phỏng vấn
"Khi được hỏi về distributed lock, tôi luôn bắt đầu bằng việc hỏi có thể tránh lock không, vì unique constraint, conditional update hay partition theo key thường đúng và đơn giản hơn. Nếu buộc phải dùng lock, với Redis tôi dùng {{SET key token NX PX}} và release bằng Lua kiểm tra token để không xoá nhầm lock của người khác. Nhưng tôi nhấn mạnh rằng lock một mình không đủ cho tính đúng đắn: client có thể bị stop-the-world GC dài hơn TTL, lock hết hạn, client khác vào, rồi client cũ tỉnh dậy ghi đè. Ở production tôi từng gặp đúng kịch bản này với job tính tồn kho và Full GC 38 giây làm tồn kho bị tính sai. Cách giải quyết đúng là fencing token — một số thứ tự tăng dần mà tầng lưu trữ kiểm tra, từ chối ghi có token cũ. Ngoài ra tôi ưu tiên thiết kế để bỏ lock, ví dụ dùng một consumer duy nhất hoặc conditional update theo version. Redlock thì tôi xem là giảm xác suất trùng cho các job không quan trọng, nhưng không dùng cho dữ liệu tiền hay tồn kho nếu không có ràng buộc thứ hai ở tầng dữ liệu."

> Senior tip: câu hỏi tôi luôn hỏi trong phỏng vấn là "nếu client giữ lock bị GC 40 giây thì sao?". Người trả lời "tăng TTL" chưa đủ; người trả lời "fencing token ở tầng storage" là người đã thực sự vận hành hệ thống phân tán.`,
  follow: [
    'Bạn triển khai fencing token với một storage không hỗ trợ so sánh version thế nào?',
    'Khi nào DB advisory lock (Postgres) là lựa chọn tốt hơn Redis?',
    'Làm sao giám sát lock bị giữ quá lâu mà không gây false positive?'
  ],
  tags: ['distributed lock', 'Redlock', 'fencing token', 'etcd']
},
{
  id: 'design-011',
  topic: 'design',
  level: 'senior',
  q: 'Giải thích CAP và PACELC. Consistency model nào phù hợp cho ví tiền, giỏ hàng và news feed? Chọn database tương ứng.',
  a: `**Tóm tắt:** CAP nói khi có **partition**, hệ thống phải chọn giữa consistency và availability. PACELC bổ sung: khi **không** có partition, vẫn phải chọn giữa latency và consistency. Không có "CA" trong hệ phân tán thật; chỉ có CP hoặc AP trong lúc sự cố mạng, và latency/consistency trong lúc bình thường.

### CAP chính xác là gì
- **C (Consistency):** mọi đọc thấy ghi mới nhất — theo nghĩa tuyến tính hoá (linearizability).
- **A (Availability):** mọi request tới node còn sống đều nhận phản hồi **không lỗi** (không hứa dữ liệu mới nhất).
- **P (Partition tolerance):** hệ thống vẫn chạy khi mạng chia cắt. Trong hệ phân tán thật, P là **bắt buộc** vì mạng sẽ hỏng; vì vậy thực chất chỉ chọn C hay A khi partition xảy ra.

Hiểu sai phổ biến: "chọn 2 trong 3" như một menu cố định. Thực tế là **khi P xảy ra**, bạn chọn C (từ chối/treo để không trả dữ liệu sai) hoặc A (trả dữ liệu có thể cũ).

### PACELC
Nếu **P**artition thì chọn **A** hay **C**; **E**lse (bình thường) chọn **L**atency hay **C**onsistency.
- {{PA/EL}}: Cassandra, DynamoDB (mặc định eventual) — ưu tiên availability và độ trễ.
- {{PC/EC}}: Spanner, CockroachDB, etcd, ZooKeeper — ưu tiên consistency, trả giá bằng latency.
- {{PA/EC}}: cấu hình được, ví dụ MongoDB với write concern majority (EC) nhưng vẫn AP khi partition tuỳ cấu hình.
PACELC hữu ích hơn CAP vì nó nói về **99,99% thời gian không có partition** — lúc đó latency mới là thứ người dùng cảm nhận.

### Phổ consistency
Từ mạnh đến yếu:
1. **Linearizable:** như một biến duy nhất, đọc sau ghi thấy ngay. Đắt nhất.
2. **Sequential:** mọi node thấy cùng thứ tự thao tác, không nhất thiết theo thời gian thực.
3. **Causal:** giữ quan hệ nhân quả (trả lời phải sau câu hỏi), cho phép song song không liên quan.
4. **Read-your-writes:** người ghi thấy được ghi của mình.
5. **Monotonic reads:** không bao giờ thấy dữ liệu cũ hơn lần đọc trước.
6. **Eventual:** cuối cùng sẽ hội tụ, không hứa khi nào.

Trong thực tế, ta thường không cần linearizable cho mọi thứ. Ví dụ: số dư ví cần read-your-writes; feed chỉ cần eventual; giỏ hàng cần read-your-writes nhưng không cần toàn cục.

### Quorum
Với hệ replicated N node: ghi thành công khi W node xác nhận, đọc từ R node. Nếu **R + W > N** thì tập đọc và tập ghi giao nhau ít nhất một node, nên đọc thấy ghi mới nhất (với điều kiện versioning). Ví dụ N=3, W=2, R=2. Tăng W làm ghi chậm hơn và giảm availability ghi khi node chết; tăng R làm đọc chậm hơn (phải chờ nhiều node) và giảm availability đọc.

### Chọn theo yêu cầu
| Dữ liệu | Consistency cần | Chọn |
|---|---|---|
| Số dư ví, ledger | Linearizable/strong, có transaction | PostgreSQL/MySQL, CockroachDB, Spanner |
| Đơn hàng, tồn kho | Strong cho điều kiện trừ kho | Postgres + conditional update; tránh eventual |
| Giỏ hàng | Read-your-writes, chịu được mất mát nhỏ | Redis/DynamoDB, TTL |
| Session, token | Strong đọc theo key | Redis cluster, DynamoDB |
| News feed, timeline | Eventual vài giây | Cassandra/ScyllaDB, Redis sorted set |
| Tìm kiếm sản phẩm | Eventual, cần full-text | Elasticsearch/OpenSearch |
| Analytics, log | Eventual, ghi cực lớn | ClickHouse, BigQuery, S3 + Athena |
| Cấu hình/feature flag | Read-your-writes, cần nhanh | etcd/ZooKeeper hoặc Redis + pub/sub |

### Ví dụ ra quyết định
**Ví tiền:** dùng Postgres với transaction, ledger append-only. Lý do: sai một đồng là sự cố pháp lý; không đánh đổi consistency lấy latency. Nếu cần scale toàn cầu, dùng CockroachDB/Spanner nhưng chấp nhận latency ghi cao hơn.

**Giỏ hàng:** người dùng thêm hàng phải thấy ngay trên thiết bị đó (read-your-writes), nhưng nếu mất một item do lỗi hiếm thì phiền chứ không thảm hoạ. Redis/DynamoDB với TTL 30 ngày là hợp lý; dữ liệu có thể eventual giữa các thiết bị.

**News feed:** trễ vài giây hoàn toàn ổn. Cassandra cho bài gốc, Redis sorted set cho feed đã fan-out. Không dùng Postgres làm feed storage vì write amplification và phân trang cursor khó.

### Những cạm bẫy
- **Đọc từ replica ngay sau ghi:** replication lag 100 ms đủ để người dùng thấy "mất" dữ liệu vừa lưu. Giải: đọc từ primary trong vài giây sau ghi, hoặc dùng session token/version.
- **Trộn nhiều nguồn:** ghi Postgres, đọc Elasticsearch nhưng index trễ 5 giây — người dùng tạo xong tìm không thấy. Cần thông báo "đang xử lý" hoặc đọc fallback.
- **Nhầm "eventual" với "không bao giờ đúng":** eventual cần cơ chế đảm bảo hội tụ (retry, anti-entropy, read repair). Không có cơ chế đó là mất dữ liệu.

### Ví dụ đời thực
Một ứng dụng ví điện tử nội bộ (dùng cho nhân viên mua hàng trong công ty, quy mô ~50.000 người) có hai luồng: (1) xem số dư và lịch sử giao dịch, (2) bảng xếp hạng "top chi tiêu tháng" hiển thị trên trang chủ. Ban đầu đội dùng một cụm cơ sở dữ liệu NoSQL cấu hình mặc định (eventual consistency, đọc từ replica gần nhất) cho cả hai luồng để "nhanh và scale dễ".

**Triệu chứng:** sau khi nạp tiền, khoảng 2–5% người dùng thấy số dư vẫn là số cũ trong 1–3 giây và bấm nạp lại hoặc thanh toán lần nữa. Có 37 trường hợp ghi nhận giao dịch trừ tiền bị từ chối với lỗi "insufficient balance" dù người dùng vừa nạp thành công (theo log nạp). Đồng thời bảng xếp hạng đôi khi hiển thị thứ hạng nhảy lung tung giữa các lần tải trang.

**Điều tra:** kiểm tra log ứng dụng thấy luồng nạp tiền ghi vào node leader rồi trả "thành công" cho client; request đọc số dư ngay sau đó (cùng phiên người dùng) bị load balancer đưa tới một replica chưa nhận bản sao — replication lag đo được 400 ms đến 2,8 giây trong giờ cao điểm (metric {{replication_lag_ms}} p99 = 2800). Luồng thanh toán đọc số dư từ replica và từ chối vì thấy số cũ. Bảng xếp hạng dùng cùng cụm, đọc eventual nên thứ hạng thay đổi theo replica được chọn — đây là hành vi chấp nhận được nhưng chưa được giải thích cho sản phẩm.

**Nguyên nhân gốc:** áp một consistency model (eventual, ưu tiên latency) cho hai loại dữ liệu có yêu cầu khác nhau. Số dư ví cần ít nhất read-your-writes cho chính người dùng và cần quyết định thanh toán dựa trên dữ liệu đủ mới; bảng xếp hạng chỉ cần eventual.

**Xử lý:** (1) Tách luồng số dư/ledger sang PostgreSQL với transaction ({{BEGIN; SELECT balance FOR UPDATE; kiểm tra; INSERT ledger; UPDATE balance; COMMIT}}) — chọn {{PC/EC}} cho dữ liệu tiền. (2) Với các màn hình "số dư của tôi" sau khi ghi, đọc từ primary hoặc gửi kèm phiên bản/ghi chú "read-after-write" trong 5 giây. (3) Giữ bảng xếp hạng trên đường ống eventual: ghi sự kiện chi tiêu vào hàng đợi, tính lại bảng xếp hạng bất đồng bộ mỗi 30 giây, cache kết quả — chấp nhận trễ và ghi rõ "cập nhật mỗi 30 giây" trên UI. (4) Thêm kiểm thử tái hiện: kịch bản "ghi rồi đọc ngay" chạy trong môi trường có replication lag giả lập.

**Kết quả đo được:** lỗi "insufficient balance" sai sau nạp tiền giảm về 0 trong 30 ngày theo dõi. p99 đọc số dư tăng từ 18 ms lên 35 ms (đọc primary) — chấp nhận được. Bảng xếp hạng ổn định hơn về trải nghiệm vì người dùng hiểu dữ liệu trễ có chủ đích.

### Trả lời mẫu khi phỏng vấn
"Khi nói về CAP và PACELC, tôi không dừng ở định nghĩa mà đi thẳng vào yêu cầu của từng loại dữ liệu. CAP nhắc rằng khi có partition mạng thì phải chọn consistency hay availability; PACELC bổ sung rằng kể cả lúc bình thường vẫn phải chọn latency hay consistency. Trong thực tế tôi phân loại dữ liệu: ví dụ số dư ví và ledger cần consistency mạnh, tôi dùng cơ sở dữ liệu quan hệ với transaction và conditional update, chấp nhận latency cao hơn; giỏ hàng cần read-your-writes cho chính người dùng nhưng chịu được mất mát nhỏ, nên cache hoặc key-value với TTL là hợp lý; news feed hay bảng xếp hạng chấp nhận eventual vài giây để đổi lấy độ trễ thấp và khả năng scale. Tôi từng gặp sự cố khi một hệ thống dùng eventual cho cả số dư ví: người dùng nạp xong đọc từ replica chưa kịp sao chép nên thấy số cũ và bị từ chối thanh toán. Cách sửa là tách luồng tiền về giao dịch mạnh và chỉ dùng eventual cho những nơi sản phẩm chấp nhận trễ. Trade-off luôn là: dữ liệu nào sai một đơn vị là sự cố nghiệp vụ thì không đánh đổi consistency."

> Senior tip: khi interviewer hỏi CAP, đừng trả lời định nghĩa rồi dừng. Hãy nói ngay "với bài toán này tôi chấp nhận stale bao lâu, vì người dùng sẽ cảm nhận thế nào" — đó là câu trả lời của người đã thiết kế sản phẩm, không chỉ đọc sách.`,
  follow: [
    'Bạn triển khai read-your-writes khi người dùng đọc từ replica ở region khác thế nào?',
    'Nếu cần đổi từ eventual sang strong consistency cho một bảng đang chạy production, lộ trình ra sao?',
    'Giải thích cách DynamoDB đạt được conditional write mạnh dù là hệ AP.'
  ],
  tags: ['CAP', 'PACELC', 'consistency', 'database selection']
,
  refs: [
    { type: 'article', title: 'Please stop calling databases CP or AP (Martin Kleppmann)', url: 'https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html' },
    { type: 'doc', title: 'Jepsen: Consistency Models', url: 'https://jepsen.io/consistency' },
  ]
},
{
  id: 'design-012',
  topic: 'design',
  level: 'lead',
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
  ],
  q: 'Hệ thống hiện có 1.000 người dùng, sếp muốn chuẩn bị cho 1 triệu. Bạn vạch lộ trình kiến trúc theo từng mốc, mỗi mốc gắn với tín hiệu nào cần scale?',
  a: `**Tóm tắt:** Scale không phải là làm kiến trúc của Google ngay từ đầu, mà là **giải quyết điểm nghẽn tiếp theo** ở mỗi mốc. 1k user cần một monolith gọn gàng và backup; 100k cần stateless + cache + replica; 1M cần shard, tách async, multi-region. Mỗi bước phải có **tín hiệu đo được** và chi phí vận hành tương xứng.

### Nguyên tắc
1. **Đo trước khi scale.** Biết p99, QPS, DB connections, CPU, slow query. Không có số liệu thì mọi thay đổi là đoán.
2. **Scale theo trục rẻ nhất trước:** code/index → cache → replica → queue → shard → service.
3. **Giữ khả năng deploy độc lập.** Đừng tách microservice chỉ vì "nghe hiện đại".
4. **Mỗi bước có rollback.** Feature flag, dual-write, shadow read.

### Mốc 1 — 1.000 user: làm đúng nền tảng
- Một ứng dụng Spring Boot + một Postgres (hoặc MySQL), deploy 1–2 instance sau reverse proxy.
- **Backup tự động + đã test restore** (rất nhiều đội bỏ qua bước này).
- Index cho các query chính, connection pool hợp lý (HikariCP 10–20 connection cho 1 instance).
- Log có cấu trúc, health check, cảnh báo uptime.
- CI/CD cơ bản, migration có version (Flyway/Liquibase).
**Chưa cần:** Redis, Kafka, microservice, Kubernetes. Ở mức này chúng chỉ tăng rủi ro.

Tín hiệu cần bước tiếp: DB CPU > 60% thường xuyên, p99 > 500 ms, deploy gây downtime.

### Mốc 2 — 10.000 user: tách tải đọc, cache
- Redis cho dữ liệu đọc nhiều (session, catalog, config). Cache-aside với TTL + jitter.
- **Read replica** cho báo cáo và các query nặng; đọc critical vẫn về primary.
- CDN cho static asset; object storage (S3) cho file người dùng thay vì lưu DB.
- Tách job nền ra worker riêng (email, báo cáo) để không chặn request.
- Thêm APM (Micrometer + Prometheus/Grafana hoặc dịch vụ managed), tracing cho luồng chính.

Tín hiệu: p99 đọc tăng theo traffic, cache hit thấp, job nền chiếm CPU web.

### Mốc 3 — 100.000 user: stateless + async + quan sát
- App **hoàn toàn stateless** (session trong Redis/JWT), scale ngang sau load balancer.
- Rate limit ở gateway; circuit breaker cho dependency ngoài.
- **Message queue** (RabbitMQ/Kafka/SQS) cho tác vụ bất đồng bộ: email, webhook, xử lý ảnh.
- Tách database theo domain nếu cần (ví dụ search sang Elasticsearch), nhưng vẫn có thể là modular monolith.
- **Connection pooling ở tầng proxy** (PgBouncer) vì 20 instance × 20 connection = 400 connection, Postgres bắt đầu mệt.
- Đặt SLO rõ ràng và alert theo SLO, không alert theo từng CPU spike.
- Load test định kỳ với kịch bản thật.

Tín hiệu: write vượt khả năng một primary, bảng lớn (>100M row) query chậm, deploy cần downtime vì migration.

### Mốc 4 — 500.000 user: partition, shard có kế hoạch
- **Partition bảng lớn** theo thời gian hoặc theo tenant trước khi nghĩ tới shard.
- Shard chỉ khi một primary không còn đủ: chọn **shard key** theo truy vấn phổ biến nhất, tránh hotspot. Ví dụ shard theo {{tenant_id}} thay vì theo thời gian.
- Tách read model (CQRS) cho các màn hình nặng; đồng bộ bằng event.
- Tách service theo **business capability** có ranh giới rõ: auth, billing, notification. Mỗi service sở hữu DB riêng, giao tiếp qua API/event.
- **Idempotency và outbox** trở thành bắt buộc vì có async.
- Tăng cường bảo mật: secret manager, audit log, phân quyền.

Tín hiệu: một service chặn cả hệ thống khi chậm, team deploy giẫm chân nhau, chi phí DB tăng phi tuyến.

### Mốc 5 — 1.000.000 user: đa region, cell
- **Multi-region:** active-passive trước (đơn giản, RPO vài phút), active-active chỉ khi thật cần và đã có giải pháp conflict resolution.
- **Cell-based architecture:** chia người dùng thành các cell độc lập, sự cố một cell không lan ra toàn hệ thống.
- CDN + edge cho nội dung tĩnh; đọc gần người dùng.
- Data pipeline cho analytics tách khỏi OLTP (CDC → lakehouse).
- Chaos engineering, game day, runbook cho từng sự cố lớn.
- Tối ưu chi phí: right-sizing, reserved instance, tiering storage.

### Bảng tóm tắt
| Mốc | Thêm gì | Bỏ/không làm gì |
|---|---|---|
| 1k | Monolith, 1 DB, backup, CI/CD | Chưa cache, chưa queue |
| 10k | Redis, replica, CDN, worker | Chưa shard, chưa microservice |
| 100k | Stateless, LB, queue, PgBouncer, SLO | Chưa tách quá nhiều service |
| 500k | Partition/shard, CQRS, tách service theo domain | Không tách theo tầng kỹ thuật |
| 1M | Multi-region, cell, chaos, data platform | Không active-active khi chưa cần |

### Điều hay bị bỏ qua
- **Chi phí vận hành tăng nhanh hơn traffic.** Mỗi thành phần thêm vào là một thứ phải vá, backup, nâng cấp, trực đêm.
- **Con người là điểm nghẽn.** 3 kỹ sư không vận hành nổi 20 microservice + service mesh. Chọn kiến trúc phù hợp năng lực đội.
- **Dữ liệu cũ.** Migration 100 triệu row cần chạy nền, batched, có kiểm tra; không làm trong một transaction.
- **Deploy an toàn:** blue-green/canary quan trọng hơn việc chọn công nghệ DB mới.

### Ví dụ đời thực
Một sản phẩm SaaS quản lý đơn hàng cho cửa hàng nhỏ đang có khoảng 1.200 tài khoản (mỗi tài khoản vài người dùng, tổng ~4.000 người dùng hoạt động ngày). Kiến trúc là một ứng dụng Spring Boot + một PostgreSQL trên một máy chủ, deploy thủ công. Sau khi lên báo, lượng đăng ký tăng nhanh: trong 6 tuần đạt ~40.000 người dùng hoạt động ngày, giờ cao điểm (11:00–13:00) gấp 5 lần bình thường.

**Triệu chứng:** p99 API {{GET /orders}} tăng từ 280 ms lên 3,2 giây vào giờ cao điểm; trang quản trị báo cáo doanh thu thỉnh thoảng timeout 30 giây; PostgreSQL báo {{FATAL: remaining connection slots are reserved}} và CPU DB dao động 85–95%. Đội kỹ thuật (3 người) hoảng và đề xuất "chuyển sang microservice + Kubernetes + Kafka" trong 1 tháng.

**Điều tra:** dùng APM và {{pg_stat_statements}} thấy 2 truy vấn chiếm 70% thời gian DB: (1) danh sách đơn hàng thiếu index trên {{(tenant_id, created_at)}} nên quét nhiều dòng; (2) báo cáo doanh thu chạy truy vấn tổng hợp nặng trực tiếp trên primary vào giờ làm việc. HikariCP mỗi instance mở 20 connection; khi scale tạm lên 6 instance để chịu tải thì tổng 120 connection chạm trần cấu hình Postgres ({{max_connections}} 100). Không có cache cho dữ liệu danh mục; static asset vẫn đi qua app server.

**Nguyên nhân gốc:** không phải "thiếu microservice" mà là các điểm nghẽn cơ bản: thiếu index, query nặng đặt sai chỗ, connection pool nhân lên theo số instance, và chưa có lớp giảm tải đọc. Quy mô ~40k user vẫn nằm trong tầm một monolith được tối ưu.

**Xử lý theo mốc (không nhảy cóc):** (1) Tuần 1: thêm index {{(tenant_id, created_at DESC)}}, tối ưu query báo cáo, đặt timeout truy vấn; p99 giảm còn 900 ms. (2) Tuần 2: đưa PostgreSQL lên máy mạnh hơn một bậc, bật PgBouncer (transaction pooling) để kiểm soát connection; thêm 1 read replica và chuyển báo cáo sang replica. (3) Tuần 3: đưa session và catalog vào Redis (cache-aside, TTL có jitter), đẩy static asset lên CDN/object storage; p99 giờ cao điểm còn ~350 ms, CPU DB xuống 45–55%. (4) Chuẩn bị nền cho mốc tiếp: app stateless, health check, CI/CD, giám sát SLO. Chưa tách microservice vì 3 kỹ sư không đủ vận hành; ghi lại ranh giới domain để tách sau khi có tín hiệu thật (deploy giẫm chân nhau, một phần làm chậm toàn bộ).

**Kết quả đo được:** sau 3 tuần, hệ thống chịu ổn định ~40k người dùng hoạt động ngày với chi phí hạ tầng tăng khoảng 2,2 lần (thay vì ước tính 6–8 lần nếu dựng cụm Kubernetes/Kafka). Thời gian khôi phục khi sự cố rõ hơn nhờ backup đã test restore và runbook đơn giản.

### Trả lời mẫu khi phỏng vấn
"Khi được hỏi cách chuẩn bị từ 1.000 lên 1 triệu người dùng, tôi không vẽ kiến trúc đích ngay mà trình bày lộ trình theo từng mốc gắn với tín hiệu đo được. Ở 1.000 người dùng, tôi giữ monolith gọn, một cơ sở dữ liệu, CI/CD, backup và đã test restore — đây là thứ nhiều đội bỏ qua. Khi p99 và CPU DB tăng, mốc tiếp theo là thêm cache, read replica, CDN và tách job nền; sau đó làm app stateless, thêm queue cho bất đồng bộ, PgBouncer để kiểm soát connection. Chỉ khi một primary không chịu nổi ghi hoặc một phần hệ thống bắt đầu chặn phần khác, tôi mới nghĩ tới partition, shard, rồi tách service theo ranh giới nghiệp vụ. Ở production tôi từng thấy đội 3 người muốn nhảy thẳng sang microservice và Kubernetes khi traffic tăng, nhưng điểm nghẽn thật là thiếu index và query nặng trên primary; tối ưu theo trục rẻ nhất giúp ổn định trong vài tuần với chi phí thấp hơn nhiều. Trade-off tôi luôn nói rõ là chi phí vận hành và năng lực đội tăng nhanh hơn traffic, nên kiến trúc phải đi sau số liệu, không đi trước."

> Senior tip: tôi luôn hỏi "nếu ngày mai traffic tăng 10 lần, cái gì vỡ đầu tiên?" và chuẩn bị cho đúng cái đó. Đội nào trả lời được bằng số liệu sẽ scale tốt hơn đội có kiến trúc đẹp nhưng không biết điểm nghẽn thật.`,
  follow: [
    'Bạn thuyết phục sếp không cần microservice ở mốc 100k user thế nào?',
    'Khi nào nên chọn shard theo tenant thay vì theo user id?',
    'Làm sao di chuyển 100 triệu row sang schema mới mà gần như không downtime?'
  ],
  tags: ['scaling', 'architecture roadmap', 'sharding', 'multi-region']
},
{
  id: 'design-013',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế job scheduler phân tán chạy hàng chục nghìn job/ngày và các batch lớn. Làm sao tránh chạy trùng và xử lý job lỗi?',
  a: `**Tóm tắt:** Scheduler phân tán cần **một nguồn sự thật bền** cho lịch và trạng thái, cơ chế **claim job nguyên tử** (SELECT FOR UPDATE SKIP LOCKED), worker **idempotent**, và checkpoint cho batch lớn. Không thể đảm bảo exactly-once end-to-end; hãy làm at-least-once cộng với hiệu ứng idempotent.

### Yêu cầu
- **Functional:** job cron (mỗi 5 phút, mỗi đêm), job một lần sau X phút, retry khi lỗi, chạy lại thủ công, theo dõi trạng thái.
- **Non-functional:** 50.000 job/ngày (trung bình < 1/s nhưng dồn vào đầu giờ), batch 10 triệu bản ghi, không chạy trùng một job tại cùng thời điểm, job trễ tối đa 1 phút, không mất job khi node chết.

### Kiến trúc
~~~text
+-------------------+       +----------------------+
| Scheduler service | ----> |  job table (DB)      |
| (nhiều instance)  |       |  next_run_at, status |
+-------------------+       |  lease_until, shard  |
         |                  +----------+-----------+
         | claim job                   |
         v                             v
+-------------------+       +----------------------+
|  Worker pool      | ----> |  business handler    |
|  (autoscale)      |       +----------------------+
+-------------------+
         |
         v
   Kafka topic job-events -> monitoring / DLQ
~~~

### Bảng job
~~~sql
CREATE TABLE job (
  id           BIGSERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  cron_expr    TEXT,                  -- NULL nếu one-off
  next_run_at  TIMESTAMPTZ NOT NULL,
  status       VARCHAR(20) NOT NULL,  -- PENDING, RUNNING, DONE, FAILED, DEAD
  attempts     INT NOT NULL DEFAULT 0,
  lease_until  TIMESTAMPTZ,
  worker_id    TEXT,
  payload      JSONB NOT NULL,
  idempotency_key TEXT NOT NULL,
  UNIQUE (idempotency_key)
);
CREATE INDEX idx_due ON job (next_run_at) WHERE status = 'PENDING';
~~~

### Claim job nguyên tử
Nhiều scheduler instance cùng quét bảng. Cách đúng trên Postgres (MySQL 8 cũng có {{SKIP LOCKED}} nhưng không có {{RETURNING}} và không cho subquery cùng bảng trong UPDATE — phải {{SELECT ... FOR UPDATE SKIP LOCKED}} rồi UPDATE trong cùng transaction):
~~~sql
UPDATE job
   SET status = 'RUNNING',
       worker_id = 'worker-7',
       lease_until = now() + interval '5 minutes',
       attempts = attempts + 1
 WHERE id = (
   SELECT id FROM job
    WHERE status = 'PENDING' AND next_run_at <= now()
    ORDER BY next_run_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED
 )
RETURNING *;
~~~
- {{SKIP LOCKED}} cho phép nhiều worker lấy job khác nhau mà không chờ nhau.
- Nếu worker chết, {{lease_until}} quá hạn và một job reaper đưa job về PENDING (tăng attempts).
- Không giữ transaction lâu trong lúc chạy job; chỉ giữ đủ để claim.

### Cron và next_run_at
- Không dùng mỗi node tự chạy cron riêng (sẽ trùng). Chỉ **một** tiến trình materialize cron thành job instance, hoặc dùng DB unique theo {{(name, scheduled_at)}} để chống trùng.
- Tính {{next_run_at}} theo UTC và timezone cấu hình; lưu UTC trong DB.
- Tránh "thundering herd" lúc 00:00: thêm **jitter** khi tạo job (00:00–00:05) hoặc chia slot.
- Job bị lỡ (node down) khi khởi động lại: quét job có {{next_run_at < now()}} và chạy bù, có giới hạn cửa sổ (ví dụ chỉ bù trong 1 giờ).

### Bầu leader (nếu cần)
Một số việc chỉ nên một node làm: materialize cron, cleanup. Dùng:
- Postgres advisory lock, hoặc
- etcd/ZooKeeper lease, hoặc
- bảng {{leader_lease}} với conditional update và TTL.
Không cần leader cho việc claim job — {{SKIP LOCKED}} đã đủ.

### Batch lớn: chia để trị
10 triệu bản ghi không thể xử lý trong một transaction hay một job. Chia thành **partition/chunk**:
~~~text
Job cha (batch-2026-10-22)
  +-- chunk 0: id 1..100000
  +-- chunk 1: id 100001..200000
  ...
  +-- chunk N
~~~
- Mỗi chunk là một job con, claim độc lập, chạy song song.
- Chunk ghi **checkpoint** (last processed id/offset) để resume, không làm lại từ đầu.
- Commit theo lô 500–1.000 bản ghi; tránh transaction 10 triệu row (bloat, lock, WAL khổng lồ).
- Giới hạn concurrency để không làm nghẽn DB nguồn/đích.
- Theo dõi tiến độ theo chunk; job cha DONE khi mọi chunk DONE.

### Idempotency: chìa khoá của mọi thứ
Job có thể chạy lại do retry, lease hết hạn, hoặc chạy tay. Mọi handler phải an toàn khi chạy hai lần:
- Ghi có **unique key nghiệp vụ** (ví dụ {{(batch_id, record_id)}}) và dùng upsert/ignore.
- Hoặc kiểm tra trạng thái trước khi làm: nếu đã DONE thì bỏ qua.
- Với tác động bên ngoài (gửi email, gọi API), dùng idempotency key của đối tác nếu có.
- Nếu không idempotent được, ghi **intent** trước rồi thực thi, và có bước đối soát.

### Retry, backoff, DLQ
- Phân loại lỗi: tạm thời (timeout, 5xx, deadlock) thì retry; vĩnh viễn (dữ liệu sai, 4xx) thì FAILED ngay.
- Backoff lũy tiến + jitter; số lần tối đa (ví dụ 5) rồi chuyển DEAD/DLQ.
- DLQ phải có UI/CLI để xem và replay, kèm lý do lỗi và payload.
- Cảnh báo khi tỉ lệ FAILED tăng hoặc job trễ quá SLA.

### Vận hành
| Chỉ số | Ý nghĩa | Ngưỡng gợi ý |
|---|---|---|
| Job PENDING quá next_run_at | Scheduler tắc | > 1 phút là bất thường |
| Job RUNNING quá lease | Worker treo | Reaper xử lý, cảnh báo nếu nhiều |
| attempts cao | Lỗi hệ thống | > 2 là cần xem |
| Thời gian chạy batch | Hiệu năng | So với baseline, tăng 30% là điều tra |
| DLQ size | Job bỏ cuộc | > 0 cần có người xem |

### Công cụ có sẵn
- **Quartz** (JDBC job store, clustered): tốt cho job đơn giản, nhưng scale batch lớn và sharding không phải thế mạnh.
- **Spring Batch**: mạnh về chunk, restart, skip/retry; cần tự thêm scheduler phân tán.
- **Kubernetes CronJob**: chỉ phù hợp job ít, không có exactly-once và không phù hợp chục nghìn job.
- **Temporal**: workflow bền, retry, timer rất tốt; phù hợp khi job có nhiều bước và cần bù trừ, nhưng thêm hạ tầng.
- **Kafka + consumer**: hợp cho stream, không hợp cho cron đúng giờ.

### Ví dụ đời thực
  Một hệ thống ngân hàng số xử lý 50.000 job/ngày: nightly batch tính lãi suất, đối soát giao dịch, gửi báo cáo, và các job ad-hoc như retry thanh toán thất bại. **Triệu chứng:** Một đêm, batch đối soát (10 triệu bản ghi) chạy quá 4 giờ và làm nghẽn connection pool, khiến các job cron 5 phút bị treo hàng loạt, p99 API tăng từ 80 ms lên 12 giây. Monitoring cho thấy {{active connections = 100/100}}, {{job RUNNING > lease_until = 47 jobs}}. **Điều tra:** Script reaper (chạy 5 phút/lần) thấy job batch cha vẫn RUNNING nên không reaper; các chunk con đã DONE nhưng job cha chờ aggregation. Do chunk size nhỏ (10.000) tạo ra 1.000 chunk, overhead claim + commit lớn. Worker autoscale đã max 20 pod nhưng DB primary CPU 95% do nhiều transaction nhỏ. **Nguyên nhân gốc:** Batch lớn không giới hạn concurrency chunk; 1.000 chunk chạy song song gây connection storm. Không có backpressure từ scheduler xuống worker. **Xử lý:** (1) Thêm semaphore giới hạn 10 chunk đồng thời mỗi batch cha; (2) Tăng chunk size lên 100.000 bản ghi, giảm xuống 100 chunk; (3) Materialize cron job dùng advisory lock thay vì INSERT + ON CONFLICT để tránh thundering herd lúc 00:00; (4) Tách connection pool: batch dùng pool riêng (max 30), API dùng pool chính (max 70). **Kết quả đo được:** Nightly batch từ 4h giảm xuống 1h15p; job cron 5 phút không còn trễ; p99 API ổn định < 100 ms; reaper không còn cảnh báo lease timeout.

### Trả lời mẫu khi phỏng vấn
  "Khi thiết kế scheduler phân tán, tôi tập trung vào ba thứ: không chạy trùng, không mất job, và batch lớn không làm sập hệ thống. Cốt lõi là bảng job với SKIP LOCKED để claim nguyên tử, lease_until để phát hiện worker chết, và idempotency_key để chạy lại an toàn. Với batch 10 triệu bản ghi, tôi chia chunk, mỗi chunk lưu checkpoint để resume. Tôi từng gặp sự cố batch đối soát tạo 1.000 chunk làm nghẽn connection pool — giải pháp là giới hạn concurrency chunk và tăng chunk size. Nếu cần workflow phức tạp nhiều bước có bù trừ, tôi cân nhắc Temporal thay vì tự xây saga. Monitoring thì theo dõi PENDING quá hạn, RUNNING quá lease, và DLQ size."

> Senior tip: điều tôi luôn kiểm tra đầu tiên khi nhận hệ thống scheduler là **job có chạy trùng được không**. Nếu handler không idempotent, mọi cơ chế lease/retry đẹp đến đâu cũng sẽ tạo ra dữ liệu sai vào đúng đêm có sự cố — và đó là lúc không ai muốn debug.`,
  follow: [
    'Bạn xử lý job cần chạy đúng một lần mỗi ngày mà vẫn chịu được node chết giữa chừng?',
    'Khi batch làm nghẽn DB production, bạn điều tiết thế nào mà không dừng hẳn?',
    'So sánh scheduler tự xây với Temporal cho quy mô 50.000 job/ngày.'
  ],
  tags: ['job scheduler', 'batch', 'SKIP LOCKED', 'idempotency']
,
  refs: [
    { type: 'doc', title: 'PostgreSQL SELECT: The Locking Clause (SKIP LOCKED)', url: 'https://www.postgresql.org/docs/current/sql-select.html' },
    { type: 'doc', title: 'Spring Batch Reference', url: 'https://docs.spring.io/spring-batch/reference/' },
  ]
}
,
{
  id: 'architecture-001',
  topic: 'architecture',
  level: 'mid',
  q: 'Áp dụng SOLID vào thực tế: chỉ ra một đoạn code Java vi phạm nhiều nguyên lý và refactor nó. Mỗi nguyên lý giải quyết vấn đề gì?',
  a: `**Tóm tắt:** SOLID là bộ nguyên tắc giúp code **dễ thay đổi** khi yêu cầu thay đổi. Nó không phải mục tiêu tự thân: đừng tạo interface cho mọi class. Giá trị thật nằm ở chỗ giảm phụ thuộc, giảm hiệu ứng domino khi sửa, và cho phép test từng phần.

### Code vi phạm
~~~java
public class OrderService {
    public void checkout(Order order, String paymentType) {
        // SRP: vừa tính tiền, vừa lưu DB, vừa gửi email
        if (paymentType.equals("CARD")) {
            cardClient.charge(order.total());
        } else if (paymentType.equals("WALLET")) {
            walletClient.debit(order.total());
        } else if (paymentType.equals("COD")) {
            // không làm gì
        }
        jdbcTemplate.update("INSERT INTO orders ...");
        mailSender.send(order.email(), "Đặt hàng thành công");
    }
}
~~~
Vấn đề:
- **SRP:** một class có 3 lý do để thay đổi (nghiệp vụ, lưu trữ, thông báo).
- **OCP:** thêm phương thức thanh toán mới phải sửa {{if/else}}.
- **DIP:** phụ thuộc trực tiếp {{jdbcTemplate}}, {{mailSender}}, client cụ thể.
- **ISP:** nếu gom mọi thứ vào một interface lớn, client phải phụ thuộc method không dùng.
- **LSP:** nếu tạo lớp con giả vờ hỗ trợ thanh toán nhưng ném {{UnsupportedOperationException}}, đó là vi phạm LSP.

### Refactor: tách trách nhiệm + phụ thuộc abstraction
~~~java
public interface PaymentGateway {
    boolean supports(String type);
    void charge(Money amount);
}

@Component
class CardGateway implements PaymentGateway {
    public boolean supports(String type) { return "CARD".equals(type); }
    public void charge(Money amount) { cardClient.charge(amount); }
}

public interface OrderRepository { void save(Order order); }
public interface Notifier { void orderConfirmed(Order order); }

@Service
public class OrderService {
    private final List<PaymentGateway> gateways;
    private final OrderRepository repository;
    private final Notifier notifier;

    public OrderService(List<PaymentGateway> gateways,
                        OrderRepository repository,
                        Notifier notifier) {
        this.gateways = gateways;
        this.repository = repository;
        this.notifier = notifier;
    }

    public void checkout(Order order, String type) {
        PaymentGateway gateway = gateways.stream()
            .filter(g -> g.supports(type))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unsupported: " + type));
        gateway.charge(order.total());   // OCP: thêm gateway mới không sửa đây
        repository.save(order);
        notifier.orderConfirmed(order);
    }
}
~~~
Lưu ý: vẫn còn chỗ "biết" danh sách type, nhưng nó nằm trong từng gateway, không phải chuỗi if/else trung tâm. Với tập type đóng, Java 21 cho phép {{sealed interface}} + {{switch}} pattern matching — ngắn gọn và compiler kiểm tra đủ nhánh; đó là lựa chọn tốt khi tập giá trị thật sự cố định.

### Từng nguyên lý, hiểu đúng
| Nguyên lý | Câu hỏi kiểm tra | Dấu hiệu vi phạm |
|---|---|---|
| **SRP** | Class có mấy lý do để thay đổi? | Tên class có "And", file 1.000 dòng, import nhiều tầng |
| **OCP** | Thêm tính năng mới có phải sửa code cũ? | Chuỗi if/else hoặc switch dài theo "loại" |
| **LSP** | Lớp con có thay thế được lớp cha? | Ném UnsupportedOperationException, làm yếu postcondition |
| **ISP** | Interface có method client không dùng? | Interface 20 method, nhiều implement để trống |
| **DIP** | Phụ thuộc abstraction hay chi tiết? | {{new HttpClient()}} trong service, import driver DB |

### LSP ví dụ
~~~java
class ReadOnlyList extends ArrayList<String> {
    @Override public boolean add(String s) {
        throw new UnsupportedOperationException();  // phá hợp đồng của List
    }
}
~~~
Hàm nào nhận {{List}} và gọi {{add}} sẽ vỡ khi truyền {{ReadOnlyList}}. Sửa bằng cách tách interface {{ReadableList}} chỉ có method đọc, hoặc dùng {{List.copyOf}} / {{Collections.unmodifiableList}} — trả về kiểu không hứa khả năng ghi.

### Khi nào KHÔNG cần SOLID nặng
- Script nhỏ, CRUD đơn giản, prototype: thêm interface chỉ làm khó đọc.
- Với DTO/record, value object: giữ đơn giản.
- Nguyên tắc thực dụng: **trừu tượng hoá khi có biến thể thứ hai hoặc khi cần test**. Đừng tạo {{PaymentGateway}} nếu hệ thống mãi mãi chỉ có một cổng.
- SOLID giúp dễ thay đổi, nhưng mỗi lớp trừu tượng là một thứ phải đọc hiểu. Cân bằng bằng kinh nghiệm và yêu cầu thực tế.

### Ví dụ đời thực
  Một dự án e-commerce 3 năm tuổi, team 8 dev, codebase 150k LOC. **Triệu chứng:** Mỗi khi thêm phương thức thanh toán mới (VNPAY, MoMo, ZaloPay, ShopeePay), dev phải sửa 12 file: OrderService, PaymentService, controller, DTO, validator, integration test, mock config, feature flag, documentation, migration script, CI pipeline, và runbook. Thời gian trung bình 3 ngày/tính năng, tỷ lệ bug regression 35%. **Điều tra:** Code review cho thấy OrderService có 2.400 dòng, import 47 class, phụ thuộc trực tiếp 8 client thanh toán cụ thể, 3 repository, 2 email service, 1 SMS service. Không có interface PaymentGateway — mỗi client được {{new}} trực tiếp trong method {{checkout}}. Test unit không thể mock client, buộc dùng integration test chậm (12 phút/lần). **Nguyên nhân gốc:** Vi phạm DIP (phụ thuộc chi tiết), OCP (thêm cổng phải sửa code cũ), SRP (OrderService làm 5 việc: validate, tính phí, gọi client, lưu DB, gửi thông báo). **Xử lý:** (1) Tạo interface PaymentGateway với method {{supports(type)}} và {{charge(amount)}}; (2) Tách 8 client thành 8 implementation; (3) Inject {{List<PaymentGateway>}} vào OrderService, tra cứu bằng stream; (4) Tách repository, notifier ra interface riêng; (5) Viết unit test cho từng gateway và OrderService (mock gateway), integration test chỉ 2 file. **Kết quả đo được:** Thêm cổng mới từ 3 ngày xuống 4 giờ (chỉ thêm 1 class + test), regression rate từ 35% xuống 5%, unit test coverage OrderService từ 12% lên 98%, thời gian CI từ 12p xuống 3p.

### Trả lời mẫu khi phỏng vấn
  "SOLID không phải checklist để áp dụng máy móc — nó là công cụ giảm chi phí thay đổi. Tôi từng thấy OrderService 2.400 dòng nhét hết thanh toán, lưu DB, gửi mail, thêm cổng mới phải sửa 12 file. Tôi refactor: tạo PaymentGateway interface, tách 8 implementation, inject List<PaymentGateway>, OrderService chỉ lo orchestrate. Kết quả: thêm cổng từ 3 ngày xuống 4 giờ, regression ít hơn 7 lần. Nguyên tắc cốt lõi: DIP để test được, OCP để mở rộng không sửa cũ, SRP để tách trách nhiệm. Nhưng đừng over-engineer: nếu hệ thống chỉ có 1 cổng thanh toán và không dự định thêm, interface chỉ làm code khó đọc. Tôi luôn hỏi: 'nếu mai đổi nhà cung cấp, bao nhiêu file phải sửa?' — câu trả lời đo được giá trị thực của SOLID."

> Senior tip: trong code review, tôi không hỏi "class này có SOLID không" mà hỏi "nếu mai đổi nhà cung cấp thanh toán, bao nhiêu file phải sửa?". Câu trả lời đo được đó hữu ích hơn mọi định nghĩa lý thuyết.`,
  follow: [
    'Bạn xử lý khi hai nguyên lý xung đột nhau trong một thiết kế cụ thể?',
    'Làm sao thuyết phục team không lạm dụng interface cho mọi class?',
    'Cho ví dụ vi phạm ISP trong một repository interface thực tế và cách tách.'
  ],
  tags: ['SOLID', 'refactoring', 'clean code']
},
{
  id: 'architecture-002',
  topic: 'architecture',
  level: 'mid',
  q: 'Design pattern nào xuất hiện trong Spring mà lập trình viên thường dùng mà không biết? Giải thích cơ chế bên trong của từng cái.',
  a: `**Tóm tắt:** Spring là một bộ design pattern chạy được: **Proxy** cho AOP/transaction, **Template Method** cho JDBC/REST, **Factory** cho bean, **Strategy** cho HandlerMapping, **Observer** cho event. Hiểu cơ chế giúp tránh những lỗi rất khó debug như self-invocation làm mất {{@Transactional}}.

### Bảng pattern và nơi xuất hiện
| Pattern | Trong Spring | Vì sao dùng |
|---|---|---|
| Singleton | Bean scope mặc định | Một instance chia sẻ, tiết kiệm bộ nhớ |
| Factory | {{BeanFactory}}, {{FactoryBean}}, {{@Bean}} | Che giấu logic khởi tạo phức tạp |
| Proxy | AOP, {{@Transactional}}, {{@Cacheable}}, {{@Async}} | Thêm hành vi mà không sửa code gốc |
| Template Method | {{JdbcTemplate}}, {{TransactionTemplate}}, {{RestTemplate}} | Cố định khung, cho phép truyền callback |
| Strategy | {{HandlerMapping}}, chọn converter | Chọn thuật toán theo ngữ cảnh |
| Observer | {{ApplicationEventPublisher}} + {{@EventListener}} | Tách publisher khỏi subscriber |
| Adapter | {{HandlerAdapter}} | Nhiều kiểu handler, một giao diện chung |
| Decorator | {{BeanPostProcessor}}, wrapper bean | Bọc thêm trách nhiệm |

### Proxy: quan trọng nhất và cũng hay gây bug
Khi bạn đánh dấu {{@Transactional}}, Spring tạo một **proxy** bọc bean thật. Lời gọi từ bên ngoài đi qua proxy; proxy mở transaction rồi mới gọi method thật.
~~~java
@Service
public class OrderService {
    @Transactional
    public void create(Order o) {
        save(o);
        sendEvent(o);       // nếu gọi this.sendEvent() thì KHÔNG qua proxy
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void sendEvent(Order o) { ... }
}
~~~
- Gọi {{this.sendEvent()}} bên trong cùng class là **self-invocation**: không qua proxy, nên {{REQUIRES_NEW}} không có tác dụng. Đây là bug production rất phổ biến.
- Cách sửa: tách sang bean khác, hoặc inject chính proxy (self-injection), hoặc dùng {{TransactionTemplate}} tường minh.
- Spring Boot mặc định dùng **CGLIB** (proxy bằng subclass) nên class/method không được {{final}}; nếu implement interface có thể dùng JDK dynamic proxy. Cả hai đều không proxy được method {{private}}.

### Template Method
{{JdbcTemplate}} cố định toàn bộ quy trình: lấy connection, tạo statement, xử lý exception, đóng tài nguyên. Bạn chỉ cung cấp phần thay đổi qua callback:
~~~java
jdbcTemplate.query(
    "SELECT id, name FROM users WHERE age > ?",
    (rs, rowNum) -> new User(rs.getLong("id"), rs.getString("name")),
    18
);
~~~
Đây chính là Template Method: khung thuật toán ở lớp cha, bước cụ thể do callback/lớp con quyết định. Lợi ích là không thể quên đóng connection — thứ mà code JDBC tay rất dễ làm sai.

### Factory
- {{BeanFactory}} là container tạo và quản lý bean.
- {{FactoryBean}} cho phép logic tạo phức tạp: ví dụ tạo {{DataSource}} từ nhiều nguồn, trả về một proxy.
- {{@Bean}} trong {{@Configuration}} cũng là factory method; Spring đảm bảo gọi một lần và trả cùng instance (CGLIB proxy configuration class).

### Strategy
{{HandlerMapping}} chọn handler phù hợp với request; nhiều implementation (RequestMappingHandlerMapping, SimpleUrlHandlerMapping). Đây là Strategy: interface chung, nhiều thuật toán, chọn theo dữ liệu đầu vào. Trong code nghiệp vụ, đây là pattern để xoá if/else (xem câu strategy + Map injection).

### Observer
~~~java
publisher.publishEvent(new OrderPaidEvent(orderId));
@Component
class MailListener {
    @EventListener
    void on(OrderPaidEvent e) { mailService.sendReceipt(e.orderId()); }
}
~~~
Mặc định event là **đồng bộ** trong cùng thread; listener chậm làm chậm publisher. Muốn bất đồng bộ phải cấu hình {{@Async}} + executor. Lỗi trong listener đồng bộ có thể rollback transaction của publisher — cần cân nhắc.

### Adapter
{{HandlerAdapter}} cho phép {{DispatcherServlet}} xử lý nhiều kiểu handler (annotation, interface Controller, HttpRequestHandler) qua một giao diện chung. Đây là cách Spring mở rộng mà không sửa servlet lõi.

### Decorator và BeanPostProcessor
Spring cho phép bọc bean sau khi khởi tạo. Ví dụ tự viết một {{BeanPostProcessor}} để thay bean bằng proxy logging. Cẩn thận: can thiệp quá nhiều vào vòng đời bean làm hệ thống khó hiểu và khó debug.

### Pitfall tổng hợp
- Proxy không áp dụng cho self-invocation, method private, class final.
- {{@Transactional}} trên method gọi từ cùng class không hoạt động.
- {{@Async}} nên trả về {{void}} hoặc {{Future}}/{{CompletableFuture}}; nếu trả kiểu khác, method vẫn chạy async nhưng caller luôn nhận {{null}}.
- Bean singleton phải **thread-safe**; đừng giữ state request trong field.
- Event listener đồng bộ có thể che giấu độ trễ và lỗi.

### Ví dụ đời thực
  Một hệ thống đặt vé xem phim 5 năm tuổi, 2 triệu user/ngày. **Triệu chứng:** Deploy version 2.3.1 làm lỗi thanh toán VNPAY — khách không nhận email xác nhận, đơn hàng bị tạo trùng khi khách retry, tiền bị trừ 2 lần. Log chỉ thấy "transaction rolled back" nhưng DB vẫn có đơn commit từ các lần retry. Team debug 6 giờ mới tìm ra nguyên nhân. **Điều tra:** OrderService.create() có @Transactional (REQUIRED), bên trong gọi this.sendConfirmationEmail() có @Transactional(propagation = REQUIRES_NEW). Gọi this.method() trong cùng class là self-invocation: **bỏ qua proxy**, nên REQUIRES_NEW không áp dụng và sendConfirmationEmail chạy cùng transaction với create(). Khi SMTP ném exception, cả hai cùng rollback; đơn không tạo, email không gửi — log chỉ in "transaction rolled back" của transaction ngoài cùng nên team nhầm rằng order đã commit và email lỗi riêng. Khách không thấy xác nhận → retry thanh toán → tạo trùng đơn, trừ tiền 2 lần. **Nguyên nhân gốc:** Self-invocation bypass proxy — @Transactional trên method gọi bằng this() bị bỏ qua hoàn toàn. Code review không bắt được vì "logic trông đúng", test integration pass vì SMTP mock không timeout. **Xử lý:** (1) Tách sendConfirmationEmail ra NotificationService bean riêng; (2) Thêm ArchUnit rule: method @Transactional không được gọi method @Transactional khác trong cùng class; (3) Ép CGLIB qua {{spring.aop.proxy-target-class=true}} (mặc định là false: Spring dùng JDK proxy nếu bean có interface; CGLIB chỉ khi class không implement interface) và tránh {{final}} class/method (proxy có thể không áp dụng); (4) Viết test integration thực sự timeout SMTP. **Kết quả đo được:** 0 sự cố self-invocation trong 12 tháng sau; deploy payment an tâm hơn; team mới onboarding đọc ArchUnit report hiểu quy tắc ngay.

### Trả lời mẫu khi phỏng vấn
  "Spring dùng Proxy pattern cho AOP: @Transactional, @Async, @Cacheable đều là proxy bọc bean. Bug kinh điển là self-invocation — gọi this.method() trong cùng class không qua proxy, nên @Transactional(propagation=REQUIRES_NEW) không hoạt động. Tôi từng debug 6 giờ sự cố thanh toán bị trừ tiền 2 lần do OrderService.create() gọi this.sendEmail() có REQUIRES_NEW. Giải pháp: tách sang bean riêng hoặc inject self (proxy). Các pattern khác: Template Method (JdbcTemplate cố định quy trình JDBC), Factory (BeanFactory/@Bean), Strategy (HandlerMapping), Observer (ApplicationEventPublisher), Adapter (HandlerAdapter), Decorator (BeanPostProcessor). Hiểu cơ chế proxy giúp debug nhanh: khi @Async không chạy hoặc @Transactional không rollback, check self-invocation trước."

> Senior tip: khi debug "transaction không rollback" hoặc "async không chạy", việc đầu tiên tôi làm là kiểm tra lời gọi có đi qua proxy không. Chín trên mười lần nguyên nhân là self-invocation, không phải cấu hình Spring sai.`,
  follow: [
    'Bạn chứng minh một bean đang bị proxy bằng cách nào trong lúc debug?',
    'Khi nào nên dùng ApplicationEvent thay vì gọi trực tiếp service?',
    'Spring Boot 3 dùng CGLIB mặc định; điều này ảnh hưởng gì tới thiết kế class?'
  ],
  tags: ['design patterns', 'Spring', 'proxy', 'AOP']
},
{
  id: 'architecture-003',
  topic: 'architecture',
  level: 'mid',
  q: 'Làm sao dùng Strategy cùng Spring để loại bỏ chuỗi if-else? Trình bày cách inject {{Map<String, Strategy>}} và các cạm bẫy.',
  a: `**Tóm tắt:** Định nghĩa một interface Strategy với phương thức nhận diện loại, tạo nhiều {{@Component}} implementation, rồi inject {{List<Strategy>}} hoặc {{Map<String, Strategy>}} vào service. Spring tự gom tất cả bean cùng type; service tra cứu O(1) thay vì chuỗi if/else. Cạm bẫy chính là trùng key, thứ tự bean, và xử lý loại không hỗ trợ.

### Code if/else cần thay
~~~java
public BigDecimal fee(String channel, BigDecimal amount) {
    if ("CARD".equals(channel)) return amount.multiply(new BigDecimal("0.029"));
    if ("WALLET".equals(channel)) return amount.multiply(new BigDecimal("0.01"));
    if ("BANK".equals(channel)) return new BigDecimal("2000");
    throw new IllegalArgumentException("Unknown channel");
}
~~~
Thêm kênh mới phải sửa method, test lại toàn bộ, và rất dễ quên một nhánh.

### Strategy + Spring
~~~java
public interface FeeStrategy {
    String channel();
    BigDecimal fee(BigDecimal amount);
}

@Component
class CardFeeStrategy implements FeeStrategy {
    public String channel() { return "CARD"; }
    public BigDecimal fee(BigDecimal amount) {
        return amount.multiply(new BigDecimal("0.029"));
    }
}

@Component
class WalletFeeStrategy implements FeeStrategy {
    public String channel() { return "WALLET"; }
    public BigDecimal fee(BigDecimal amount) {
        return amount.multiply(new BigDecimal("0.01"));
    }
}

@Service
public class FeeService {
    private final Map<String, FeeStrategy> strategies;

    public FeeService(List<FeeStrategy> list) {
        this.strategies = list.stream().collect(
            Collectors.toUnmodifiableMap(FeeStrategy::channel, Function.identity()));
    }

    public BigDecimal fee(String channel, BigDecimal amount) {
        FeeStrategy s = strategies.get(channel);
        if (s == null) throw new IllegalArgumentException("Unknown channel: " + channel);
        return s.fee(amount);
    }
}
~~~
Điểm quan trọng:
- {{Collectors.toUnmodifiableMap}} **ném exception nếu trùng key** — tốt, vì trùng channel là bug cấu hình, phát hiện lúc khởi động thay vì lúc chạy.
- Inject {{List<FeeStrategy>}} đảm bảo lấy hết implementation; inject trực tiếp {{Map<String, FeeStrategy>}} cũng được nhưng key là **bean name**, không phải channel — dễ nhầm.
- Có thể dùng {{@Order}} nếu cần ưu tiên, nhưng với map theo channel thì không cần.

### Map injection của Spring hoạt động thế nào
Spring tìm tất cả bean có type phù hợp và inject:
- {{List<T>}}: danh sách, có thể sắp theo {{@Order}} / {{Ordered}}.
- {{Map<String, T>}}: key là **tên bean**, value là bean. Nếu bạn đặt tên class là {{cardFeeStrategy}}, key là {{cardFeeStrategy}} — không phải "CARD".
Vì vậy tôi thường inject List rồi tự build map theo khoá nghiệp vụ, rõ ràng hơn và kiểm soát được trùng lặp.

### Xử lý loại không hỗ trợ
- Ném exception rõ ràng, đừng trả null/0 âm thầm.
- Nếu nghiệp vụ cho phép mặc định, thêm một {{DefaultFeeStrategy}} với channel đặc biệt; nhưng phải ghi rõ trong tài liệu.
- Với API public, map lỗi sang 400 kèm danh sách giá trị hợp lệ.

### Strategy vs switch expression (Java 21)
Với tập giá trị **đóng** và logic ngắn, {{switch}} trên enum/sealed type là lựa chọn tốt:
~~~java
sealed interface Channel permits Card, Wallet, Bank {}
BigDecimal fee(Channel c, BigDecimal amount) {
    return switch (c) {
        case Card card -> amount.multiply(new BigDecimal("0.029"));
        case Wallet w -> amount.multiply(new BigDecimal("0.01"));
        case Bank b -> new BigDecimal("2000");
    };
}
~~~
Compiler báo nếu thiếu nhánh, code ngắn, không cần DI. Strategy thắng khi:
- Tập loại **mở** (plugin, tenant tự cấu hình).
- Mỗi strategy có dependency riêng (client, config, repository).
- Cần test độc lập từng loại hoặc bật/tắt theo cấu hình.
Đừng biến mọi switch thành Strategy — đó là over-engineering.

### Cạm bẫy thực tế
| Cạm bẫy | Hậu quả | Cách tránh |
|---|---|---|
| Hai bean cùng channel | Map ném lỗi hoặc ghi đè | toUnmodifiableMap, test khởi động |
| Quên đăng ký bean | Runtime unknown channel | Test integration cho mọi channel |
| Dùng bean name làm key | Tra cứu sai | Tự build map theo channel |
| Strategy giữ state | Race condition | Strategy phải stateless |
| Lạm dụng cho 2 nhánh | Code phức tạp hơn | So sánh với switch |

### Test
- Unit test từng strategy với số liệu cụ thể.
- Test {{FeeService}} với một list strategy giả để kiểm tra tra cứu và lỗi.
- Test khởi động Spring context để phát hiện trùng key — đây là test rẻ và bắt được lỗi cấu hình.

### Ví dụ đời thực
  Một hệ thống thanh toán đa kênh (CARD, WALLET, BANK_TRANSFER, QR_CODE, BNPL) phục vụ 200k đơn/ngày. **Triệu chứng:** Mỗi khi onboard đối tác mới (ví dụ MoMo, ZaloPay, ShopeePay), dev phải sửa FeeService, DiscountService, SettlementService, ReconciliationJob — trung bình 18 file, 2.5 ngày, 30% khả năng bug tính phí sai. Code review thấy chuỗi if-else dài 80 dòng trong FeeService, DiscountService dùng switch 50 case, SettlementService có Map hardcoded. **Điều tra:** FeeStrategy interface có nhưng chỉ 3 implementation cũ; 5 kênh mới được hardcode vì "nhanh hơn". Map injection Spring dùng bean name làm key nên tra cứu sai im lặng (channel "MOMO" tra key "momoFeeStrategy" ra null, fallback về default 0%). **Nguyên nhân gốc:** Không enforce convention build map theo channel() trong constructor; không có test khởi động bắt trùng key; team mới không hiểu cơ chế Map injection của Spring. **Xử lý:** (1) Bắt buộc build map trong constructor dùng {{toUnmodifiableMap(FeeStrategy::channel)}}; (2) Thêm ArchUnit test: mọi class implement FeeStrategy phải có {{@Component}} và channel() unique; (3) Viết integration test khởi động context với tất cả channel kỳ vọng; (4) Tạo template GitHub issue cho kênh mới: chỉ cần thêm 1 class implement FeeStrategy. **Kết quả đo được:** Onboard kênh mới từ 2.5 ngày xuống 3 giờ (chỉ thêm 1 class + test), 0 bug tính phí sau deploy, coverage FeeService 100%.

### Trả lời mẫu khi phỏng vấn
  "Strategy + Spring DI giúp xoá if-else bằng cách inject List<Strategy> rồi build map theo khoá nghiệp vụ. Cốt lõi: interface FeeStrategy có method channel(), mỗi implementation là @Component, service inject List rồi toUnmodifiableMap(FeeStrategy::channel) — fail fast nếu trùng key. Quan trọng: đừng inject Map<String, Strategy> trực tiếp vì Spring dùng bean name làm key, không phải channel(). Tôi từng gặp bug: hai team thêm MOMO, map ghi đè âm thầm, phí tính sai 2 tuần mới phát hiện khi đối soát. Giải pháp: build map trong constructor, ArchUnit check unique channel, test khởi động context. Khi nào dùng switch thay vì Strategy? Tập giá trị đóng, logic ngắn, không cần dependency riêng — Java 21 sealed interface + switch compiler-check exhaustiveness."

> Senior tip: tôi luôn yêu cầu map được build trong constructor và **fail fast** khi trùng khoá. Trong một dự án, hai team cùng thêm strategy "MOMO" và map âm thầm ghi đè, khiến phí của một đối tác bị tính sai suốt hai tuần — lỗi chỉ lộ ra khi đối soát tài chính.`,
  follow: [
    'Bạn làm sao để strategy có thể bật/tắt theo tenant mà không cần deploy?',
    'Nếu mỗi strategy cần thứ tự ưu tiên, bạn thiết kế thế nào?',
    'Khi nào bạn chọn enum + switch thay vì Strategy?'
  ],
  tags: ['Strategy', 'Spring DI', 'if-else', 'Map injection']
},
{
  id: 'architecture-004',
  topic: 'architecture',
  level: 'senior',
  q: 'Trình bày cấu trúc package cho Clean/Hexagonal Architecture trong Spring Boot. Ưu nhược điểm so với layered architecture là gì?',
  a: `**Tóm tắt:** Clean/Hexagonal đặt **domain ở trung tâm**, phụ thuộc chỉ hướng vào trong: domain không biết Spring, JPA, HTTP. Application chứa use case và định nghĩa **port**; adapter (web, persistence, messaging) implement port. Đổi lại sự trong sáng và khả năng test, bạn trả giá bằng nhiều lớp mapping và code dài hơn.

### Cấu trúc package
~~~text
com.example.order
+-- domain
|   +-- model          Order, OrderLine, Money (record)
|   +-- event          OrderPaid
|   +-- exception      DomainException
|   +-- port
|       +-- in         PlaceOrderUseCase (interface)
|       +-- out        OrderRepository, PaymentPort (interface)
+-- application
|   +-- service        PlaceOrderService (implement port in)
|   +-- dto            PlaceOrderCommand
+-- adapter
|   +-- in.web         OrderController, mapper
|   +-- in.messaging   OrderEventConsumer
|   +-- out.persistence JpaOrderRepository, OrderJpaEntity, mapper
|   +-- out.payment    StripePaymentAdapter
+-- config             Spring wiring, bean configuration
~~~
Có biến thể đặt port trong application thay vì domain; điều quan trọng là **chiều phụ thuộc**, không phải tên thư mục.

### Dependency rule
~~~text
adapter in --> application/domain <-- adapter out
                    ^
                    |
                 config (Spring)
~~~
- Domain không import {{org.springframework}}, {{jakarta.persistence}}, {{com.fasterxml.jackson}}.
- Application chỉ phụ thuộc domain + port interface.
- Adapter phụ thuộc domain/application, không ngược lại.
Nếu domain import JPA annotation, bạn đã trói domain vào hạ tầng và mất phần lớn lợi ích.

### Ví dụ use case
~~~java
public interface PlaceOrderUseCase {
    OrderId place(PlaceOrderCommand cmd);
}

@Service
public class PlaceOrderService implements PlaceOrderUseCase {
    private final OrderRepository orders;      // port out
    private final PaymentPort payments;        // port out
    private final DomainEventPublisher events; // port out

    public PlaceOrderService(OrderRepository orders,
                             PaymentPort payments,
                             DomainEventPublisher events) {
        this.orders = orders;
        this.payments = payments;
        this.events = events;
    }

    @Override
    public OrderId place(PlaceOrderCommand cmd) {
        Order order = Order.create(cmd.customerId(), cmd.lines());
        payments.authorize(order.total());     // gọi ra ngoài qua port
        orders.save(order);
        events.publishAll(order.pullEvents());
        return order.id();
    }
}
~~~
Service không biết thanh toán là Stripe hay Momo, không biết lưu bằng JPA hay Mongo. Đổi adapter không cần sửa use case.

### Mapping giữa các tầng
- Web DTO → Command: validate format, không validate nghiệp vụ.
- Command → Domain: dựng entity/value object, domain tự kiểm tra invariant.
- Domain → JPA entity: mapper riêng. Đây là chỗ nhiều người bỏ qua bằng cách dùng luôn JPA entity làm domain — nhanh nhưng làm domain phụ thuộc JPA và khó test.
- Domain → Response DTO: không trả entity ra ngoài (lazy loading, lộ field nội bộ, coupling API với DB).

### Ưu điểm
- **Test domain không cần Spring**: nhanh, ổn định, không cần DB.
- **Thay hạ tầng dễ**: đổi payment provider, đổi DB, thêm message broker chỉ cần adapter mới.
- **Ranh giới rõ**: business rule nằm một chỗ, không rải trong controller/service/JPA listener.
- **Hỗ trợ modular hoá**: mỗi module có port riêng, dễ tách service sau này.
- **Dễ dùng cho legacy migration**: viết adapter mới, giữ domain sạch.

### Nhược điểm
- **Nhiều code hơn**: mapper, DTO, interface. Với CRUD đơn giản, đây là chi phí không đáng.
- **Đường đi khó theo dõi** với người mới: controller → use case → port → adapter.
- **Áp lực dùng JPA entity làm domain** vì tiện; nếu không kỷ luật, kiến trúc thoái hoá thành layered đội lốt.
- **Transaction boundary** cần đặt đúng: thường ở application service, không ở domain (domain không biết transaction).
- **Over-engineering** nếu domain đơn giản: 3 bảng, không quy tắc nghiệp vụ.

### So sánh với layered
| Tiêu chí | Layered | Clean/Hexagonal |
|---|---|---|
| Phụ thuộc | Service gọi repository, controller gọi service; domain thường phụ thuộc JPA | Chỉ hướng vào trong |
| Test domain | Cần mock nhiều, đôi khi cần DB | Unit test thuần |
| Tốc độ ban đầu | Nhanh | Chậm hơn |
| Khi nghiệp vụ phức tạp | Logic rải rác, khó bảo vệ invariant | Domain tập trung |
| CRUD đơn giản | Phù hợp | Thừa |

### Cách áp dụng thực dụng
- Bắt đầu bằng **modular monolith**: chia package theo module nghiệp vụ, mỗi module có domain/application/adapter nội bộ.
- Chỉ tạo port khi thật sự có biến thể hoặc cần test seam. Không cần port cho mọi repository nếu bạn chấp nhận test với DB.
- Giữ domain sạch ở module quan trọng (billing, pricing), cho phép đơn giản ở module phụ (admin CRUD).
- Dùng ArchUnit để **kiểm tra chiều phụ thuộc tự động** trong CI; nếu không, kiến trúc sẽ bị phá trong vài sprint.

### Ví dụ đời thực
  Một fintech startup 3 năm, team 12 dev, modular monolith 8 module. **Triệu chứng:** Sprint 15, module Billing deploy gây lỗi module Pricing — test Pricing pass nhưng production tính phí sai cho 4.000 đơn trong 2 giờ. Nguyên nhân: Billing thêm cột {{discount_percent}} vào bảng {{orders}} (JPA entity), Pricing đọc entity này trực tiếp thay vì qua port. **Điều tra:** ArchUnit check chưa có (chỉ có sơ đồ architecture). Domain Pricing import {{jakarta.persistence}} và dùng {{OrderJpaEntity}} thay vì {{Order}} domain. Mapping thủ công giữa domain/JPA entity bị bỏ qua vì "nhanh". **Nguyên nhân gốc:** Không enforce dependency rule; team áp dụng Clean Architecture chỉ trên sơ đồ, code thực tế domain phụ thuộc JPA, adapter lẫn lộn. **Xử lý:** (1) Viết ArchUnit test: {{noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAPackage("..persistence..")}}; (2) Bắt buộc mapping domain ↔ JPA entity bằng MapStruct trong adapter; (3) CI fail nếu ArchUnit violation; (4) Refactor Pricing: tạo {{OrderRepository}} port, implement {{JpaOrderRepository}} adapter, Pricing chỉ dùng {{Order}} domain. **Kết quả đo được:** 0 violation ArchUnit sau 6 tháng; deploy module độc lập không còn gây lỗi chéo; onboarding dev mới đọc ArchUnit report hiểu ranh giới module trong 30 phút thay vì 2 tuần.

### Trả lời mẫu khi phỏng vấn
  "Clean/Hexagonal đặt domain ở trung tâm, phụ thuộc chỉ hướng vào trong: domain không biết Spring, JPA, HTTP. Application chứa use case và định nghĩa port (interface); adapter (web, persistence, messaging) implement port. Cấu trúc package: domain/model, domain/port/in, domain/port/out, application/service, adapter/in.web, adapter/out.persistence. Ưu: test domain không cần Spring, thay hạ tầng dễ, ranh giới rõ. Nhược: nhiều mapper/DTO, chậm ban đầu, dễ over-engineer CRUD đơn giản. Tôi từng thấy dự án 'Clean Architecture' mà domain import JPA và controller trả entity — kiến trúc chỉ còn trên sơ đồ. Giải pháp: ArchUnit test từ ngày đầu, bắt buộc mapping domain↔JPA entity ở adapter, CI fail violation. Transaction boundary đặt ở application service, không ở domain."

> Senior tip: tôi từng thấy một dự án "Clean Architecture" mà domain import JPA và controller trả thẳng entity — kiến trúc chỉ còn trên sơ đồ. Nếu định áp dụng, hãy viết ArchUnit test ngay từ ngày đầu; kỷ luật tự động đáng tin hơn kỷ luật con người.`,
  follow: [
    'Bạn đặt transaction boundary ở đâu trong hexagonal architecture và vì sao?',
    'Làm sao tránh việc mapping domain/JPA entity trở thành gánh nặng?',
    'ArchUnit nên kiểm tra những quy tắc nào cho cấu trúc này?'
  ],
  tags: ['clean architecture', 'hexagonal', 'package structure', 'ArchUnit']
,
  refs: [
    { type: 'article', title: 'Hexagonal Architecture (Alistair Cockburn)', url: 'https://alistair.cockburn.us/hexagonal-architecture/' },
    { type: 'article', title: 'The Clean Architecture (Robert C. Martin)', url: 'https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html' },
    { type: 'doc', title: 'ArchUnit User Guide', url: 'https://www.archunit.org/userguide/html/000_Index.html' },
  ]
}
,
{
  id: 'architecture-005',
  topic: 'architecture',
  level: 'senior',
  q: 'DDD: phân biệt entity và value object, aggregate và domain event. Làm sao chọn aggregate boundary và quản lý transaction giữa các aggregate?',
  a: `**Tóm tắt:** **Entity** có danh tính xuyên thời gian; **value object** không có id, bất biến, bằng nhau theo giá trị. **Aggregate** là cụm entity/value object được bảo vệ bởi một root, là **đơn vị nhất quán và transaction**. Giữa các aggregate chỉ tham chiếu bằng id và nhất quán cuối cùng qua **domain event**. Nguyên tắc: một transaction chỉ sửa một aggregate.

### Entity vs Value Object
| Tiêu chí | Entity | Value Object |
|---|---|---|
| Danh tính | Có id, tồn tại xuyên thời gian | Không id, mô tả giá trị |
| Bằng nhau | Theo id | Theo toàn bộ thuộc tính |
| Bất biến | Có thể thay đổi trạng thái | Nên bất biến, tạo mới khi đổi |
| Ví dụ | Order, Customer, Account | Money, Email, Address, DateRange |
| Lưu DB | Bảng riêng hoặc trong aggregate | Thường nhúng (embeddable) |

~~~java
public record Money(long amountMinor, String currency) {
    public Money {
        if (amountMinor < 0) throw new IllegalArgumentException("negative");
        if (currency == null || currency.length() != 3) throw new IllegalArgumentException("currency");
    }
    public Money plus(Money other) {
        if (!currency.equals(other.currency)) throw new IllegalArgumentException("currency mismatch");
        return new Money(amountMinor + other.amountMinor, currency);
    }
}
~~~
{{Money}} không có id, kiểm tra invariant ngay khi tạo, phép cộng trả về instance mới. So sánh {{new Money(100, "USD").equals(new Money(100, "USD"))}} là true — đúng ngữ nghĩa giá trị.

### Aggregate
Aggregate là ranh giới nhất quán. Mọi thay đổi đi qua **aggregate root**; bên ngoài không được sửa entity con trực tiếp.
~~~java
public class Order {                    // aggregate root
    private final OrderId id;
    private final List<OrderLine> lines;
    private OrderStatus status;
    private long version;               // optimistic locking

    public void addLine(ProductId productId, Money price, int qty) {
        if (status != OrderStatus.DRAFT) throw new IllegalStateException("locked");
        if (qty <= 0) throw new IllegalArgumentException("qty");
        lines.add(new OrderLine(productId, price, qty));
        // invariant: tổng tiền luôn tính từ lines, không lưu rời rồi lệch
    }

    public Money total() {
        return lines.stream().map(OrderLine::subtotal)
                    .reduce(Money.zero("USD"), Money::plus);
    }
}
~~~
- Invariant được bảo vệ trong root: ví dụ "không thêm dòng khi đơn đã chốt", "tổng tiền khớp các dòng".
- Entity con ({{OrderLine}}) không có repository riêng; muốn sửa phải qua Order.
- Aggregate càng nhỏ càng tốt: ít tranh chấp, ít dữ liệu load, dễ cache.

### Chọn aggregate boundary
Câu hỏi để quyết định:
1. **Cái gì phải nhất quán ngay lập tức?** Nếu hai thứ phải đúng cùng lúc trong một transaction, chúng có thể cùng aggregate.
2. **Cái gì thay đổi độc lập?** Nếu tần suất và actor khác nhau, tách ra.
3. **Có tranh chấp ghi cao không?** Gộp quá nhiều sẽ khoá cả cụm, giảm throughput.
4. **Có cần load toàn bộ để làm việc không?** Nếu chỉ cần một phần, ranh giới có thể sai.

Ví dụ:
- **Order + OrderLine**: cùng aggregate. Tổng tiền và trạng thái phải nhất quán với các dòng.
- **Order và Customer**: khác aggregate. Order tham chiếu {{CustomerId}}, không giữ object Customer. Khách đổi địa chỉ không cần khoá Order.
- **Order và Inventory**: khác aggregate, thường khác service. Trừ kho qua event/saga, không dùng chung transaction.
- **Product + Price**: tuỳ nghiệp vụ; nếu giá phải cố định tại thời điểm đặt, OrderLine lưu **bản sao giá** (value object) thay vì tham chiếu Product.

### Domain event
Domain event là sự kiện đã xảy ra trong domain, đặt tên ở quá khứ: {{OrderPlaced}}, {{PaymentCaptured}}. Nó tách side-effect khỏi aggregate:
- Aggregate chỉ ghi nhận event vào danh sách nội bộ.
- Application service publish sau khi transaction commit.
- Consumer xử lý email, cập nhật read model, trừ kho.

**Không publish event trực tiếp lên broker trong lúc aggregate đang xử lý** — nếu transaction rollback, event đã gửi sẽ sai. Dùng **outbox pattern**: ghi event vào bảng outbox trong cùng transaction, relay đọc và publish sau.

~~~sql
CREATE TABLE outbox (
  id BIGSERIAL PRIMARY KEY,
  aggregate_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);
~~~
Relay đọc {{published_at IS NULL}} theo batch, publish, đánh dấu. At-least-once, consumer phải idempotent.

### Transaction giữa các aggregate
Nguyên tắc: **một transaction = một aggregate**. Nếu cần nhất quán giữa hai aggregate:
1. **Saga/process manager**: chuỗi bước, mỗi bước một transaction, có bù trừ khi lỗi.
2. **Eventual consistency** với domain event: aggregate A ghi + phát event; aggregate B cập nhật sau.
3. **Chấp nhận trạng thái trung gian** và hiển thị cho người dùng ("đang xử lý").

Ví dụ đặt hàng: Order tạo ở trạng thái PENDING, phát {{OrderPlaced}}; Inventory reserve; nếu fail, phát {{OrderCancelled}} và Order chuyển CANCELLED. Không cố gộp Order và Inventory vào một transaction — sẽ tạo coupling và khoá chéo.

### Aggregate và JPA
- Dùng {{@Version}} cho optimistic locking; xử lý {{OptimisticLockException}} bằng retry hoặc báo xung đột.
- Tránh {{@OneToMany(cascade = ALL, orphanRemoval = true)}} trên collection khổng lồ: load cả aggregate 100k dòng là thảm hoạ. Giới hạn kích thước aggregate.
- Không inject repository vào entity. Entity không nên gọi DB; application service phối hợp.
- Lazy loading ngoài transaction gây {{LazyInitializationException}}; giải pháp là fetch đúng phần cần hoặc DTO projection, không mở session vô tội vạ.

### Pitfall
| Pitfall | Hậu quả | Cách tránh |
|---|---|---|
| Aggregate quá lớn | Load chậm, khoá lâu | Tách theo invariant thật sự |
| Tham chiếu object thay vì id | Load dây chuyền, coupling | Chỉ giữ id giữa aggregate |
| Gọi repository trong entity | Domain phụ thuộc hạ tầng | Đưa logic phối hợp ra service |
| Publish event trước commit | Event sai khi rollback | Outbox, publish sau commit |
| Nhiều aggregate một transaction | Khoá chéo, deadlock | Saga/eventual |
| Anemic domain | Invariant rải rác | Đưa hành vi vào aggregate |

### Khi nào không cần DDD
Hệ CRUD, báo cáo, admin tool: entity + service là đủ. DDD có chi phí nhận thức cao; chỉ đầu tư khi nghiệp vụ phức tạp, nhiều invariant, nhiều actor và thay đổi liên tục. Đừng biến mọi bảng thành aggregate.

### Ví dụ đời thực
  Một sàn giao dịch chứng khoán xử lý 500k lệnh/ngày. **Triệu chứng:** Sự cố "mất lệnh" lặp lại 3 lần trong quý: khách đặt mua 1000 cổ phiếu, hệ thống xác nhận thành công nhưng sổ order book không thấy lệnh, sau 10 phút lệnh xuất hiện với giá sai. Log chỉ thấy {{OrderPlaced}} event nhưng không có {{OrderMatched}}. **Điều tra:** Order aggregate và MatchingEngine aggregate chia tách đúng, nhưng {{OrderPlaced}} event publish trực tiếp lên Kafka trong transaction của Order (không dùng outbox). Khi Kafka broker restart lúc commit, event mất mà DB đã commit. MatchingEngine không nhận event, lệnh không vào order book. **Nguyên nhân gốc:** Vi phạm quy tắc "publish event sau commit" — dùng outbox pattern. Code ghi event vào bảng outbox trong cùng transaction, relay đọc outbox publish Kafka. **Xử lý:** (1) Thêm bảng outbox, sửa Order aggregate ghi event vào danh sách nội bộ, application service flush outbox trong cùng transaction; (2) Relay dùng {{SELECT ... FOR UPDATE SKIP LOCKED}} đọc outbox, publish Kafka, đánh dấu published_at; (3) Idempotent consumer MatchingEngine dùng {{orderId}} dedup; (4) Thêm reconciliation job hàng giờ so sánh count order DB vs count event Kafka. **Kết quả đo được:** 0 sự cố mất lệnh trong 9 tháng; reconciliation phát hiện 0 lệch; latency order→match trung bình 800ms (tăng 200ms do outbox relay, chấp nhận được).

### Trả lời mẫu khi phỏng vấn
  "DDD cốt lõi: Entity có id, Value Object không có id (bất biến, so sánh giá trị), Aggregate là ranh giới nhất quán (một transaction sửa một aggregate), Domain event tách side-effect. Chọn aggregate boundary: cái gì phải nhất quán ngay → cùng aggregate; cái gì thay đổi độc lập, tranh chấp cao → tách aggregate, dùng event+saga. Order + OrderLine cùng aggregate; Order + Inventory tách, reserve qua saga. Quan trọng: không publish event trước commit — phải outbox pattern. Tôi từng gặp sàn chứng khoán mất lệnh do Order publish event trực tiếp trong transaction, Kafka restart mất event. Sửa: outbox table + relay, idempotent consumer, reconciliation job. Anemic domain (chỉ getter/setter, logic ở service) là dấu hiệu chưa hiểu DDD — invariant phải nằm trong aggregate root."

> Senior tip: câu hỏi tôi dùng để kiểm tra hiểu DDD là "nếu hai người đặt cùng một sản phẩm cuối cùng, transaction nằm ở đâu?". Người trả lời "gộp Order và Inventory vào một transaction" chưa hiểu ranh giới; người trả lời "hai aggregate, reserve qua saga/event và DB có ràng buộc" mới là người đã vận hành hệ thống thật.`,
  follow: [
    'Bạn chọn kích thước aggregate thế nào khi có collection rất lớn?',
    'Làm sao xử lý optimistic lock conflict mà không làm người dùng thấy lỗi?',
    'Khi nào nên dùng process manager thay vì choreography bằng event?'
  ],
  tags: ['DDD', 'aggregate', 'value object', 'domain event']
,
  refs: [
    { type: 'article', title: 'DDD Aggregate (Martin Fowler)', url: 'https://martinfowler.com/bliki/DDD_Aggregate.html' },
    { type: 'article', title: 'Value Object (Martin Fowler)', url: 'https://martinfowler.com/bliki/ValueObject.html' },
    { type: 'article', title: 'Domain Event (Martin Fowler)', url: 'https://martinfowler.com/eaaDev/DomainEvent.html' },
  ]
},
{
  id: 'architecture-006',
  topic: 'architecture',
  level: 'senior',
  q: 'Bạn quản lý technical debt và refactor một legacy codebase đang chạy production như thế nào mà không gây sự cố?',
  a: `**Tóm tắt:** Technical debt phải được **nhìn thấy, đo được và trả dần** — không phải chiến dịch rewrite. Công cụ chính: characterization test trước khi sửa, strangler fig/branch by abstraction để thay dần, feature flag để kiểm soát, và PR nhỏ. Big-bang rewrite là cách phổ biến nhất để thất bại.

### Làm debt hiện hình
- **Debt register**: mỗi mục ghi mô tả, rủi ro, chi phí ước tính, tác động, owner. Gắn vào backlog, không để trong đầu.
- **Hotspot analysis**: kết hợp độ phức tạp (cyclomatic, cognitive) với tần suất thay đổi (git churn). File vừa phức tạp vừa sửa nhiều là ưu tiên số một.
- **SonarQube/SpotBugs**: code smell, duplication, coverage. Đừng biến thành KPI cứng — sẽ sinh đối phó.
- **Sự cố production**: mỗi incident gắn với debt góp phần gây ra nó; đó là bằng chứng thuyết phục nhất với business.
- **Thời gian onboarding**: chỗ người mới mất nhiều ngày để hiểu là debt thật.

### Trước khi sửa: tạo lưới an toàn
Legacy thường thiếu test. Viết **characterization test** (golden master) để ghi lại hành vi hiện tại — kể cả hành vi xấu, nếu đó là hợp đồng với client.
~~~java
@Test
void goldenMaster_pricing() {
    // ghi lại output hiện tại của 200 input đại diện
    for (TestCase tc : fixtures()) {
        assertEquals(tc.expected, legacyPricer.price(tc.input));
    }
}
~~~
- Test này không khẳng định hành vi **đúng**, chỉ khẳng định hành vi **không đổi** trong lúc refactor.
- Với code khó test do static/global state, tạo **seam**: thêm interface hoặc tham số để inject.
- Nếu không thể test, refactor từng bước cực nhỏ và có thể revert.

### Chiến lược thay thế
| Chiến lược | Cách làm | Khi dùng |
|---|---|---|
| Boy scout rule | Mỗi PR cải thiện nhỏ quanh code đang sửa | Mặc định, liên tục |
| Strangler fig | Dựng đường mới song song, chuyển traffic dần, tắt đường cũ | Thay module lớn, rewrite từng phần |
| Branch by abstraction | Tạo interface, hai implementation, đổi bằng flag | Thay thuật toán/library |
| Dark launch / shadow | Chạy code mới song song, so sánh kết quả, chưa dùng | Rủi ro cao, cần kiểm chứng |
| Freeze + refactor | Ngừng thêm feature trong module, dọn dứt điểm | Debt nhỏ, phạm vi rõ |

### Strangler fig thực tế
1. Đặt **facade/proxy** trước module cũ, route theo % traffic hoặc theo tenant.
2. Xây module mới với test đầy đủ.
3. Chuyển 1% → 10% → 50% → 100%, theo dõi error rate, latency, business metric.
4. Giữ khả năng rollback bằng flag trong suốt quá trình.
5. Khi ổn định, xoá code cũ và facade tạm.

Không chuyển toàn bộ cùng lúc; mỗi bước phải có tiêu chí thành công và thời gian quan sát.

### Branch by abstraction
~~~java
public interface TaxCalculator { Money tax(Order o); }

@Component
class LegacyTaxCalculator implements TaxCalculator { ... }

@Component
class NewTaxCalculator implements TaxCalculator { ... }

@Component
class TaxCalculatorRouter implements TaxCalculator {
    private final TaxCalculator legacy;
    private final TaxCalculator modern;
    private final FeatureFlags flags;

    public Money tax(Order o) {
        // flag theo tenant, có thể tắt ngay nếu lỗi
        return flags.newTax(o.tenantId()) ? modern.tax(o) : legacy.tax(o);
    }
}
~~~
Đây là seam để chạy song song và so sánh. Ghi log cả hai kết quả ở chế độ shadow để phát hiện khác biệt trước khi chuyển traffic.

### PR nhỏ và an toàn
- Một PR chỉ làm một việc: đổi tên, tách method, thêm test, hoặc di chuyển code. Không trộn refactor với feature.
- Refactor cơ học (rename, extract) tách commit khỏi thay đổi hành vi để review dễ.
- Chạy test tự động + review kỹ phần thay đổi hành vi.
- Tránh "refactor toàn bộ package" trong một PR khổng lồ — không ai review nổi.

### Đo kết quả
- Lead time, tần suất deploy, change failure rate, MTTR.
- Số bug liên quan module, thời gian onboarding.
- Coverage của module sau refactor (không phải toàn repo).
- Latency/resource nếu refactor vì hiệu năng.
Nếu không đo, debt sẽ bị cắt khi có deadline — luôn luôn.

### Khi nào rewrite
Chỉ rewrite khi:
1. Chi phí bảo trì dài hạn lớn hơn rewrite **có tính cả rủi ro**.
2. Có thể chạy song song và chuyển dần.
3. Có đội đủ năng lực và thời gian, không bị áp lực feature.
4. Có kế hoạch dữ liệu: migration, dual-write, backfill, rollback.
Rewrite big-bang thường mất 2–3 lần ước tính và bỏ sót business rule ngầm — những rule không ai viết ra nhưng khách hàng phụ thuộc.

### Ví dụ đời thực
    Một nền tảng thương mại điện tử 7 năm tuổi, 50 lập trình viên, monolith (ứng dụng một khối) 800 nghìn dòng code. **Triệu chứng:** Mỗi tháng có 2–3 lần phát hành (deploy) lỗi do module discount và pricing — khách thấy giá cũ sau khi khuyến mãi kết thúc, hoặc giá giảm đột ngột giữa chừng. p99 checkout (thời gian phản hồi ở mức 99% yêu cầu) tăng từ 400 ms lên 2,5 giây vào giờ cao điểm. **Điều tra:** Kiểm tra code thấy file {{PricingEngine.java}} 3.200 dòng, import 31 class, có 17 method tính giá khác nhau, trong đó 5 method là "tạm thời" (ghi chú TODO từ 2019). Không có unit test (kiểm thử đơn vị) cho pricing; chỉ có integration test (kiểm thử tích hợp) chạy trên DB thật, mất 12 phút/lần. Mỗi lần thêm chương khuyến mãi mới, lập trình viên phải sửa trực tiếp method {{calculateDiscount}} và thêm một {{if (campaignType == "...")}} — đến năm thứ 5 có 23 case. **Nguyên nhân gốc:** Nợ kỹ thuật (technical debt — những chỗ code làm tắt để kịp hạn, để lại chi phí sửa sau) tích lũy theo từng tính năng; branch by abstraction (tách logic qua interface để chạy song song bản cũ/mới) và characterization test (bộ test "chụp" hành vi hiện tại làm chuẩn, kể cả hành vi sai) đều không được áp dụng vì "chỉ là thay đổi nhỏ". **Xử lý:** (1) Viết characterization test: 200 case đầu vào/đầu ra hiện tại làm golden master (kết quả chuẩn để so sánh) — kể cả kết quả sai cũng được ghi nhận; (2) Tạo interface {{PriceCalculator}} với hai implementation (bản hiện thực): bản cũ và bản mới; (3) Dùng feature flag (cờ bật/tắt tính năng theo cấu hình) để chuyển 1% traffic sang bản mới, so sánh log, tăng dần 10% → 50% → 100%; (4) Mỗi PR refactor chỉ tách 1 method ra class riêng, có test; (5) Đặt quy tắc: không thêm case mới vào {{PricingEngine}} nếu chưa refactor xong. **Kết quả đo được:** Sau 3 tháng, checkout p99 trở về 480 ms, deploy không còn lỗi pricing, thời gian thêm khuyến mãi từ 3 ngày xuống 4 giờ (chỉ thêm cấu hình + 1 class), coverage (độ phủ test) unit test pricing từ 0% lên 87%.

### Trả lời mẫu khi phỏng vấn
    "Khi nói về nợ kỹ thuật (technical debt), tôi luôn bắt đầu bằng việc đo, không phải cảm tính. Trên một monolith (ứng dụng một khối) 800 nghìn dòng code, tôi xác định hotspot (điểm nóng — file hay thay đổi và phức tạp) bằng git churn (tần suất sửa file) kết hợp cyclomatic complexity (độ phức tạp luồng rẽ nhánh): file {{PricingEngine.java}} 3.200 dòng, 23 nhánh if-else, sửa trung bình 5 lần/tuần — đó là điểm nghẽn. Chiến lược tôi dùng là branch by abstraction (tách qua interface để chạy song song bản cũ và mới): tạo interface {{PriceCalculator}}, hai implementation (bản hiện thực), dùng feature flag (cờ bật/tắt tính năng) để chuyển traffic dần 1% → 100% và có thể rollback (quay lại) ngay nếu lỗi. Trước khi refactor (tái cấu trúc), tôi viết characterization test (bộ test chụp hành vi hiện tại làm golden master/chuẩn so sánh) với 200 case đầu ra hiện tại — kể cả kết quả sai cũng được ghi nhận để bảo vệ hành vi trong lúc thay đổi. Mỗi PR (yêu cầu gộp code) chỉ làm một việc: tách một method, thêm test, không trộn refactor với tính năng mới. Tôi từng thấy đội khác rewrite big-bang (viết lại toàn bộ một lần) và mất 6 tháng để khôi phục business rule (quy tắc nghiệp vụ) bị bỏ sót. Trade-off (đánh đổi) ngắn hạn là mỗi PR refactor tốn khoảng 20% công suất, nhưng đổi lại deploy ổn định hơn và thời gian thêm khuyến mãi từ 3 ngày xuống 4 giờ."

  
> Senior tip: tôi luôn nói với stakeholder bằng ngôn ngữ rủi ro, không phải code: "module này gây 40% sự cố trong 6 tháng, mỗi sự cố tốn 2 giờ và ảnh hưởng 5.000 người dùng". Khi có con số, việc xin thời gian refactor dễ hơn nhiều so với nói "code xấu".`,
  follow: [
    'Bạn thuyết phục product owner hy sinh 20% capacity cho refactor thế nào?',
    'Làm sao viết characterization test cho code phụ thuộc nhiều vào thời gian và random?',
    'Khi nào bạn quyết định xoá hẳn module cũ sau khi chuyển traffic?'
  ],
  tags: ['technical debt', 'legacy', 'strangler fig', 'refactoring']
,
  refs: [
    { type: 'article', title: 'Strangler Fig Application (Martin Fowler)', url: 'https://martinfowler.com/bliki/StranglerFigApplication.html' },
    { type: 'article', title: 'Technical Debt Quadrant (Martin Fowler)', url: 'https://martinfowler.com/bliki/TechnicalDebtQuadrant.html' },
  ]
},
{
  id: 'architecture-007',
  topic: 'architecture',
  level: 'senior',
  q: 'Viết một ADR (Architecture Decision Record) để ghi lại quyết định kiến trúc. Cấu trúc gồm gì và làm sao đánh giá trade-off khách quan?',
  a: `**Tóm tắt:** ADR là một tài liệu **ngắn, bất biến, lưu trong repo**, ghi lại **bối cảnh, quyết định, hệ quả và các phương án đã cân nhắc**. Mục tiêu không phải tài liệu hoá kiến trúc đầy đủ, mà là giải thích **vì sao** — để 6 tháng sau không ai phải đoán hay làm lại tranh luận cũ.

### Cấu trúc một ADR
~~~text
# ADR-0007: Dùng Kafka thay vì RabbitMQ cho event nghiệp vụ

Status: Accepted (2026-10-22)
Deciders: Platform team, Payments team
Supersedes: -
Superseded by: -

## Context
- 12 service, 40 triệu event/ngày, cần replay 7 ngày để rebuild read model.
- RabbitMQ hiện tại không giữ event sau khi ack; replay phải viết lại.
- Team đã có kinh nghiệm vận hành Kafka ở hệ thống analytics.
- SLA: p99 publish < 20 ms, không mất event khi một broker chết.

## Decision
Dùng Kafka làm event bus cho domain event; RabbitMQ giữ cho task queue
ngắn hạn (email, job) nơi không cần replay.

## Consequences
Positive:
- Replay được theo offset, rebuild read model dễ.
- Throughput cao, partition theo aggregate id giữ thứ tự.
Negative:
- Vận hành phức tạp hơn (broker, partition, rebalance).
- Consumer phải idempotent vì at-least-once.
- Chi phí storage tăng theo retention.

## Alternatives considered
- RabbitMQ + bảng outbox + archive: đơn giản hơn nhưng replay chậm.
- AWS SQS/SNS: ít vận hành nhưng khó replay và ordering.
- Pulsar: tính năng tốt nhưng team chưa có kinh nghiệm.

## References
- RFC-123, benchmark nội bộ, link dashboard.
~~~
Một ADR tốt đọc trong 5 phút. Nếu dài hơn 2 trang, có thể bạn đang viết tài liệu thiết kế chứ không phải ADR.

### Status và vòng đời
- **Proposed**: đang bàn, chưa áp dụng.
- **Accepted**: đã chốt và đang áp dụng.
- **Deprecated**: không còn khuyến nghị nhưng hệ thống vẫn dùng.
- **Superseded by ADR-00xx**: bị thay thế, **không sửa nội dung cũ**.
ADR là bất biến. Khi quyết định thay đổi, tạo ADR mới và link hai chiều. Lịch sử quyết định là tài sản.

### Đánh giá trade-off khách quan
1. **Xác định tiêu chí trước khi so sánh.** Ví dụ: throughput, latency p99, chi phí 3 năm, độ phức tạp vận hành, kỹ năng team, khả năng replay, lock-in.
2. **Cho trọng số.** Không phải tiêu chí nào cũng quan trọng như nhau. Ghi rõ trọng số để người đọc thấy giả định.
3. **Chấm điểm có bằng chứng.** Benchmark, PoC, số liệu từ hệ thống tương tự — không chấm theo cảm giác.
4. **Tính chi phí đầy đủ.** License, hạ tầng, người vận hành, đào tạo, migration, thời gian downtime.
5. **Nêu rõ điều kiện đảo ngược.** Quyết định nào dễ đảo (type 2) thì làm nhanh; quyết định khó đảo (type 1) cần phân tích sâu.

Ví dụ bảng:
| Tiêu chí | Trọng số | Kafka | RabbitMQ | SQS |
|---|---|---|---|---|
| Replay event | 25% | 5 | 1 | 1 |
| Throughput | 20% | 5 | 3 | 4 |
| Vận hành | 20% | 2 | 4 | 5 |
| Kinh nghiệm team | 20% | 4 | 4 | 3 |
| Chi phí 3 năm | 15% | 3 | 4 | 4 |
| **Tổng** | | **3,90** | **3,05** | **3,25** |

Điểm số chỉ là công cụ hỗ trợ thảo luận, không thay thế phán đoán. Nếu kết quả trái với trực giác, xem lại trọng số và bằng chứng.

### Những lỗi thường gặp
- **ADR chỉ ghi quyết định, không ghi phương án bị loại.** Người sau không biết vì sao không chọn, rồi đề xuất lại.
- **Viết ADR sau khi đã làm xong và không ai đọc.** Nên viết trước hoặc trong lúc quyết định, review như tài liệu thiết kế.
- **Không ghi hệ quả tiêu cực.** Mọi quyết định đều có giá; che giấu làm mất niềm tin.
- **Cập nhật lén ADR cũ.** Làm mất lịch sử; hãy supersede.
- **ADR cho mọi thứ.** Quyết định nhỏ, dễ đảo, có thể ghi trong PR description. ADR dành cho quyết định khó đảo, ảnh hưởng nhiều team.
- **Không có owner.** ADR không có người chịu trách nhiệm sẽ mục.

### Quy trình nhẹ
1. Viết ADR ở trạng thái Proposed, đưa vào PR nhỏ.
2. Review trong 2–3 ngày với các team bị ảnh hưởng.
3. Chốt, đổi Accepted, merge vào {{docs/adr/}}.
4. Link từ code/README module liên quan.
5. Định kỳ rà soát ADR cũ; cái nào hết hiệu lực thì supersede.

Công cụ: một thư mục Markdown là đủ, không cần phần mềm. Có thể dùng MADR template.

### ADR và RFC khác nhau thế nào
- **RFC**: đề xuất thiết kế chi tiết, có thể dài, mục tiêu lấy ý kiến trước khi làm.
- **ADR**: ghi lại **quyết định** và lý do, ngắn gọn, bất biến.
Một quyết định lớn có thể có RFC trước, ADR sau khi chốt, và ADR link tới RFC.

### Ví dụ đời thực
    Một công ty logistics có 3 service (billing, tracking, notification) đang dùng chung một RabbitMQ cluster. **Triệu chứng:** Khi notification service thêm một hàng đợi mới cho email retry, billing service bị chậm 2 giây do kết nối tới broker (máy trung gian nhận/chuyển message) bị gián đoạn và phải kết nối lại; p99 publish billing tăng từ 15 ms lên 2,2 giây vào giờ cao điểm. **Điều tra:** RabbitMQ dashboard cho thấy một node (máy chủ trong cụm) bị lỗi đĩa và khởi động lại; các queue (hàng đợi) của notification được khai báo {{durable=true}} (tồn tại sau khi broker khởi động lại) nhưng message (tin nhắn) không được publish với cờ persistent — nên khi node gặp sự cố, một phần message trong hàng đợi bị mất. Queue cũng không dùng cơ chế sao chép (như quorum queue) nên không có bản sao trên node khác. Billing service publish sự kiện quan trọng (order-paid), nhưng RabbitMQ mặc định xoá message ngay sau khi consumer ack (xác nhận đã xử lý) — tức là không có khả năng **replay** (phát lại message cũ). Mỗi lần cần dựng lại read model (mô hình đọc), team phải viết script đọc log ứng dụng để phát lại — mỗi lần mất 30 phút. **Nguyên nhân gốc:** Chọn RabbitMQ vì "đơn giản và team đã có kinh nghiệm" nhưng không đánh giá hai yêu cầu trọng số cao nhất trong bảng ADR: **replay** và **throughput** (lưu lượng). **Xử lý:** (1) Viết ADR-001: chọn Kafka (hệ thống log sự kiện phân tán, giữ message theo thời gian lưu trữ nên có thể replay) làm event bus (kênh sự kiện chung), RabbitMQ giữ cho task queue ngắn (email, job) nơi không cần replay; (2) Migration (chuyển đổi): thêm outbox table (bảng trung gian trong DB để ghi sự kiện an toàn), relay publish Kafka, chạy song song 2 tuần so sánh log; (3) Cập nhật trọng số: replay 25%, throughput 20%, vận hành 20% — Kafka tổng điểm 3,90 cao hơn RabbitMQ 3,05. **Kết quả đo được:** p99 publish trở về 18 ms, replay dựng lại read model từ 7 ngày chỉ mất 2 giờ (tự động theo offset Kafka), không còn script export thủ công.

### Trả lời mẫu khi phỏng vấn
    "Một ADR (Architecture Decision Record — bản ghi quyết định kiến trúc) tốt là tài liệu 1–2 trang, lưu trong repo, bất biến, ghi context (bối cảnh), decision (quyết định), consequences (hệ quả), alternatives (phương án bị loại) và references. Khi chọn giữa Kafka và RabbitMQ, tôi xác định tiêu chí trước: khả năng replay (phát lại) sự kiện (trọng số 25%), throughput (lưu lượng, 20%), vận hành (20%), kinh nghiệm team (20%), chi phí 3 năm (15%). Kafka đạt 3,90, RabbitMQ 3,05. Điểm số chỉ hỗ trợ thảo luận, không thay thế phán đoán. Tôi từng thấy team chọn RabbitMQ vì 'đơn giản' nhưng sau 6 tháng phải viết script đọc log để phát lại sự kiện, mỗi lần mất 30 phút, vì RabbitMQ xoá message sau khi consumer ack (xác nhận xử lý) còn Kafka giữ theo retention (thời gian lưu trữ). Giải pháp: migration (chuyển đổi) bằng outbox table (bảng trung gian ghi sự kiện) + relay publish Kafka, chạy song song 2 tuần so sánh log. ADR phải được viết trước hoặc trong lúc quyết định, không viết muộn, và khi quyết định thay đổi thì tạo ADR mới supersede (thay thế) ADR cũ."

  
> Senior tip: giá trị lớn nhất của ADR không phải tài liệu, mà là **buộc người ra quyết định viết ra các phương án bị loại**. Trong nhiều buổi review, chính phần Alternatives khiến team nhận ra mình đang chọn công nghệ vì hype chứ không vì nhu cầu.`,
  follow: [
    'Bạn xử lý khi có hai ADR mâu thuẫn nhau trong cùng hệ thống?',
    'Làm sao đánh giá chi phí vận hành dài hạn của một lựa chọn công nghệ?',
    'Khi nào một quyết định không cần ADR mà chỉ cần ghi trong PR?'
  ],
  tags: ['ADR', 'architecture decision', 'trade-off', 'documentation']
,
  refs: [
    { type: 'doc', title: 'Architectural Decision Records (adr.github.io)', url: 'https://adr.github.io/' },
    { type: 'article', title: 'Documenting Architecture Decisions (Michael Nygard)', url: 'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions' },
  ]
},
{
  id: 'architecture-008',
  topic: 'architecture',
  level: 'lead',
  refs: [
    { type: 'article', title: 'Anemic Domain Model (Martin Fowler)', url: 'https://martinfowler.com/bliki/AnemicDomainModel.html' },
    { type: 'doc', title: 'Refactoring.Guru: Code Smells', url: 'https://refactoring.guru/refactoring/smells' },
  ],
  q: 'Phân tích các anti-pattern kiến trúc hay gặp: God class, anemic domain model, distributed monolith. Nhận diện và sửa thế nào?',
  a: `**Tóm tắt:** Anti-pattern là giải pháp **có vẻ đúng lúc đầu nhưng gây chi phí tăng dần**. Ba cái phổ biến nhất: God class (một class biết quá nhiều), anemic domain model (dữ liệu và hành vi tách rời, invariant không được bảo vệ), và distributed monolith (nhiều service nhưng vẫn phụ thuộc chặt như monolith). Nhận diện bằng dấu hiệu đo được, sửa bằng thay đổi tăng dần — không rewrite.

### God class / God service
**Dấu hiệu:**
- File 1.000+ dòng, 20+ dependency inject.
- Tên kiểu {{OrderManager}}, {{CommonService}}, {{Utils}}.
- Là "change magnet": gần như mọi feature đều phải sửa nó.
- Nhiều người cùng sửa → conflict liên tục.
- Test khó vì phải mock nửa hệ thống.

**Vì sao hình thành:** ai cũng thêm một method vào chỗ đã có sẵn thay vì tạo chỗ mới; deadline thúc đẩy; thiếu review kiến trúc.

**Cách sửa:**
1. Liệt kê method theo **trách nhiệm** (nhóm theo động từ/nghiệp vụ).
2. Trích xuất từng nhóm thành class/service riêng, bắt đầu từ nhóm ít phụ thuộc nhất.
3. Giữ facade tạm thời gọi các thành phần mới để không phá client.
4. Viết test trước khi tách; sau khi tách, test chuyển theo.
5. Đặt quy tắc (ArchUnit, checkstyle) để class mới không phình lại.

~~~java
// Trước: OrderManager làm mọi thứ
class OrderManager { create(); calculateTax(); sendMail(); exportPdf(); syncErp(); }

// Sau: tách theo trách nhiệm, phối hợp qua use case
class PlaceOrderService { ... }
class TaxCalculator { ... }
class OrderNotifier { ... }
class OrderExporter { ... }
~~~
Không cần tách tất cả cùng lúc; mỗi PR tách một nhóm, có test bảo vệ.

### Anemic domain model
**Dấu hiệu:**
- Entity chỉ có getter/setter, không có hành vi.
- Toàn bộ logic nằm trong service, thao tác trực tiếp lên field.
- Cùng một invariant bị kiểm tra ở nhiều nơi, hoặc có nơi quên kiểm tra.
- Setter công khai cho phép tạo trạng thái không hợp lệ.

**Vì sao có hại:** invariant không có chỗ bảo vệ. Ví dụ trạng thái đơn hàng có thể nhảy từ DRAFT sang SHIPPED nếu ai đó set field trực tiếp; tổng tiền có thể lệch khỏi các dòng.

**Cách sửa:**
- Đưa hành vi vào entity/aggregate: {{order.addLine()}}, {{order.cancel()}}, {{wallet.debit()}}.
- Đóng field, chỉ mở method nghiệp vụ; setter chỉ dùng cho framework nếu buộc phải có.
- Dùng constructor/factory kiểm tra invariant ngay khi tạo.
- Value object cho khái niệm nhỏ (Money, Email) để không truyền string rời.

~~~java
// Anemic
order.setStatus("SHIPPED");   // bất kỳ trạng thái nào cũng được
order.setTotal(total);        // total có thể lệch lines

// Giàu hành vi
order.ship();                 // kiểm tra chỉ ship khi PAID
order.recalculateTotal();     // luôn suy ra từ lines
~~~

**Khi anemic là ổn:** CRUD đơn giản, read model/CQRS projection, DTO, admin tool. Không phải mọi hệ thống đều cần domain model giàu hành vi. Vấn đề chỉ xuất hiện khi nghiệp vụ phức tạp mà invariant bị rải rác.

### Distributed monolith
**Dấu hiệu:**
- Nhiều service nhưng **dùng chung database** hoặc truy cập bảng của nhau.
- Deploy phải theo thứ tự, service A bắt buộc deploy trước B.
- Một request đi qua 8 service đồng bộ, p99 cộng dồn.
- Thay đổi schema một bảng làm hỏng nhiều service.
- Shared library chứa entity/DTO chung, mọi service phụ thuộc cùng version.
- Test end-to-end mới biết có lỗi; không service nào test độc lập được.

**Vì sao tệ hơn monolith:** bạn trả chi phí vận hành phân tán (network, retry, tracing, deploy) nhưng vẫn giữ coupling chặt. Không được lợi ích nào của cả hai mô hình.

**Cách sửa:**
1. **Xác định boundary theo business capability**, không theo tầng kỹ thuật. Mỗi service sở hữu dữ liệu của mình.
2. Tách database (DB per service) theo lộ trình: view/read replica tạm, sau đó chuyển hẳn.
3. Thay gọi đồng bộ bằng **event** cho luồng không cần trả lời ngay; giữ sync cho truy vấn cần kết quả.
4. Loại bỏ shared entity library; chia sẻ **contract** (OpenAPI, schema event) thay vì class.
5. Contract testing (Pact) và consumer-driven contract để deploy độc lập.
6. Đo **deploy independence**: một service có thể deploy mà không cần service khác không? Nếu không, chưa phải microservice thật.

### Các anti-pattern liên quan
| Anti-pattern | Dấu hiệu | Sửa |
|---|---|---|
| Chatty service | Một request gọi 50 lần service khác | Gộp API, batch, cache, BFF |
| Shared database | Nhiều service đọc/ghi cùng bảng | DB per service, event |
| Nano-service | Service quá nhỏ, overhead lớn | Gộp theo capability |
| Cyclic dependency | A gọi B, B gọi A | Event, tách service thứ ba |
| Golden hammer | Dùng một công nghệ cho mọi bài | Đánh giá theo yêu cầu |
| Big ball of mud | Không có boundary rõ | Modular hoá dần |
| Hero dependency | Chỉ một người hiểu hệ thống | Pairing, tài liệu, phân quyền |

### Nhận diện bằng số liệu
- **Coupling:** số service phải sửa cho một feature; số lần deploy theo nhóm.
- **Change failure rate** theo module.
- **p99 end-to-end** so với tổng p99 từng service — chênh lệch lớn là dấu hiệu chuỗi gọi dài.
- **Số bảng DB được truy cập bởi nhiều service** (từ query log hoặc catalog).
- **Thời gian onboarding** cho một module.

### Cách sửa bền vững
- Đặt **architecture fitness function** trong CI: ArchUnit, dependency-cruiser, contract test, schema ownership check.
- Review kiến trúc định kỳ, không chỉ review code.
- Ghi ADR cho các boundary quan trọng để không bị phá sau này.
- Thay đổi tăng dần, có feature flag và rollback; không "big bang re-architecture".

### Ví dụ đời thực
    Một công ty fintech (công nghệ tài chính) có 12 service microservice (dịch vụ nhỏ), nhưng vẫn dùng chung một database schema (cấu trúc cơ sở dữ liệu). **Triệu chứng:** Khi team Payment thêm một cột {{kyc_status}} vào bảng {{users}}, team Loan và Risk cùng phải deploy (phát hành) trong cùng ngày để tránh crash (sập); mỗi lần thay đổi schema là một lần deploy nhóm. p99 end-to-end (từ đầu đến cuối) của API đặt khoản vay tăng từ 450 ms lên 3,2 giây do request đi qua 8 service gọi đồng bộ (gọi trực tiếp và chờ kết quả). **Điều tra:** Kiểm tra log deploy thấy 6 service có dependency (phụ thuộc) vào bảng {{users}}; thư viện dùng chung {{common-entity}} phiên bản 2.3.4 được 8 service dùng, nhưng không ai có thẩm quyền thay đổi. Lỗi chỉ lộ ra ở kiểm thử end-to-end; mỗi service tự test pass vì dùng dữ liệu giả (mock). **Nguyên nhân gốc:** Distributed monolith (monolith phân tán — nhìn như microservice nhưng vẫn phụ thuộc chặt như một khối): nhiều service nhưng dùng chung database và thư viện entity dùng chung, nên trả chi phí phân tán (network, retry/thử lại, tracing/theo dấu, deploy theo nhóm) mà vẫn giữ coupling (độ ràng buộc) chặt. **Xử lý:** (1) Xác định boundary (ranh giới) theo business capability (năng lực nghiệp vụ): mỗi service sở hữu dữ liệu của mình; (2) Tách database: tạo view/read replica tạm thời cho service khác đọc, sau đó chuyển hẳn; (3) Thay gọi đồng bộ bằng event (sự kiện) cho luồng không cần kết quả ngay; (4) Bỏ thư viện entity dùng chung, chỉ chia sẻ contract (hợp đồng giao tiếp: OpenAPI, schema event) thay vì chia sẻ class; (5) Contract testing (kiểm thử hợp đồng, ví dụ Pact) để deploy độc lập; (6) Đo deploy independence (khả năng deploy độc lập): một service có thể deploy mà không cần service khác không? Sau 6 tháng, Payment deploy không cần chờ Loan hay Risk.

### Trả lời mẫu khi phỏng vấn
    "Ba anti-pattern (mẫu thiết kế xấu hay gặp) phổ biến là God class (class 'biết quá nhiều', là change magnet — chỗ nào thay đổi cũng phải sửa), anemic domain model (entity chỉ có dữ liệu getter/setter, hành vi và quy tắc nằm hết ở service nên invariant/điều kiện bất biến không được bảo vệ), và distributed monolith (monolith phân tán — nhiều service nhưng vẫn phụ thuộc chặt như một khối). Dấu hiệu nhận biết: file 1.000+ dòng, 20+ dependency inject là God class; entity chỉ getter/setter, logic ở service là anemic; nhiều service dùng chung database hoặc phải deploy theo thứ tự là distributed monolith. Cách xử lý: God class — tách method theo trách nhiệm, mỗi PR tách một nhóm, có test; anemic — đưa hành vi vào aggregate (cụm đối tượng có gốc kiểm soát quy tắc), đóng field, dùng value object; distributed monolith — DB per service (mỗi service một DB), dùng event (sự kiện) thay gọi đồng bộ, bỏ thư viện entity dùng chung, chỉ chia sẻ contract (OpenAPI/schema event) và dùng contract testing. Tôi từng gặp 12 service dùng chung bảng {{users}}: Payment thêm cột khiến 6 service phải deploy cùng ngày, p99 tăng từ 450 ms lên 3,2 giây. Giải pháp là tách database, dùng event, và đo deploy independence (khả năng deploy độc lập) — một service có thể deploy chiều thứ Sáu mà không phải hỏi ai không?"

  
> Senior tip: tôi đánh giá một hệ microservice bằng một câu hỏi duy nhất: "team này có thể deploy một service vào 3 giờ chiều thứ Sáu mà không hỏi ai không?". Nếu câu trả lời là không, đó là distributed monolith — và mọi dashboard đẹp đẽ về số lượng service chỉ là trang trí.`,
  follow: [
    'Bạn đo mức độ coupling giữa các service bằng chỉ số nào?',
    'Khi nào bạn quyết định gộp service thay vì tiếp tục tách?',
    'Làm sao chuyển từ shared database sang DB per service mà không downtime?'
  ],
  tags: ['anti-pattern', 'god class', 'anemic model', 'distributed monolith']
},
{
  id: 'design-014',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế hệ thống chuyển tiền liên ngân hàng 24/7 (kiểu NAPAS). Mô tả luồng giao dịch, trạng thái, cơ chế timeout và quy trình đối soát.',
  a: `**Tóm tắt:** Đây là bài toán **đúng tuyệt đối hơn là nhanh**: mỗi giao dịch đi qua một state machine chặt chẽ (khởi tạo → giữ tiền → gửi switch → kết quả), ghi bút toán kép vào ledger, chống gửi trùng bằng idempotency key và mã tham chiếu. Điểm khó nhất là **timeout: trạng thái "không biết" (UNKNOWN), không phải thất bại**, phải truy vấn lại switch và đối soát cuối ngày chứ không được tự hoàn tiền.

### Làm rõ yêu cầu và quy mô
- Chức năng: truy vấn tên người nhận, chuyển tiền nhanh 24/7 qua switch (NAPAS), xem trạng thái, tra soát/khiếu nại, đối soát hằng ngày.
- Phi chức năng: không mất giao dịch, không "tạo tiền ảo", audit đầy đủ, chạy 24/7 không có cửa sổ bảo trì; tuân thủ hạn mức và quy định xác thực của NHNN. Sinh trắc học (vân tay, mặt, NHNN định danh điện tử) được yêu cầu với giao dịch trên mức quy định — kiểm tra văn bản và quy định hiện hành khi triển khai thực tế.
- Ước lượng (giả định ngân hàng lớn): 5 triệu giao dịch/ngày → 5.000.000 / 86.400 ≈ 58 TPS trung bình; giờ cao điểm (ngày lương, trước Tết) giả sử gấp 10 → ~600 TPS. Không lớn về throughput; cái khó là tính đúng.
- Giao thức bản tin, chuẩn (ví dụ ISO 8583/ISO 20022), mã lỗi và timeout phụ thuộc dịch vụ, phiên bản và đặc tả kết nối của switch; không suy đoán từ tên dịch vụ.

### Kiến trúc tổng thể
~~~text
App/Internet Banking -> API Gateway -> Transfer Service (stateless)
                                            |
                         +------------------+------------------+
                         |                                     |
                  PostgreSQL (txn + ledger)            Outbox -> Kafka
                         |                                     |
                  Core Banking (hold/post)          Switch Connector (ISO 8583)
                                                               |
                                                         NAPAS switch
                                                               |
                                                     Ngân hàng thụ hưởng
~~~

### State machine
~~~text
INITIATED -> HELD (đã giữ tiền) -> SENT -> SUCCESS -> POSTED
                    |                |
                    |                +-> FAILED (từ chối rõ ràng) -> RELEASED (nhả tiền giữ)
                    |                +-> UNKNOWN (timeout) -> inquiry -> SUCCESS | FAILED
                    +-> REJECTED (không đủ số dư / vượt hạn mức)
~~~
Mỗi chuyển trạng thái là **conditional update** để hai worker không cùng xử lý:
~~~sql
UPDATE transfer SET status = 'SUCCESS', updated_at = now()
 WHERE id = :id AND status IN ('SENT', 'UNKNOWN');   -- 0 dòng = đã có người xử lý
~~~

### Luồng chi tiết
1. **Idempotency:** client gửi {{Idempotency-Key}}; unique index trên (customer_id, idempotency_key). Request trùng trả lại kết quả cũ, không tạo giao dịch mới.
2. **Giữ tiền (hold):** gọi core banking tạo hold, giảm số dư khả dụng nhưng chưa hạch toán. Nếu không đủ tiền → REJECTED.
3. **Gửi switch:** ghi outbox trong cùng transaction với trạng thái SENT; connector gửi bản tin kèm mã tham chiếu duy nhất (trace/reference number). Mã này là khoá để truy vấn và đối soát.
4. **Nhận kết quả:** thành công thì hạch toán Nợ tài khoản khách hàng / Có tài khoản trung gian thanh toán NAPAS, nhả hold, thông báo khách. Từ chối rõ ràng (sai tài khoản, ngân hàng nhận từ chối) thì nhả hold, chuyển FAILED.
5. **Quyết toán (settlement):** tách trạng thái ghi có tức thời của giao dịch khỏi quy trình quyết toán liên ngân hàng. Cơ chế, chu kỳ và tài khoản quyết toán do scheme/switch cùng quy định áp dụng quyết định; đối soát phải khớp số liệu giao dịch và settlement report tương ứng.

### Timeout: phần interviewer chấm điểm
- Hết thời gian chờ mà không có phản hồi → **UNKNOWN**, giữ nguyên hold. Không tự hoàn tiền: switch có thể đã chuyển thành công và người nhận đã được cộng tiền, chỉ là phản hồi bị mất. Nếu hoàn cho người gửi, ngân hàng mất đúng số tiền đó.
- **Không gửi lại bản tin chuyển tiền mới** (có thể chuyển hai lần). Thay vào đó gửi bản tin truy vấn trạng thái theo mã tham chiếu (hoặc quy trình reversal nếu đặc tả switch yêu cầu), retry có backoff.
- Vẫn chưa rõ sau N lần → hàng đợi tra soát, cuối ngày đối soát với file của switch sẽ quyết định. Khách thấy "Giao dịch đang xử lý", không phải "Thất bại".

### Đối soát
| Lệch | Ý nghĩa | Xử lý |
|---|---|---|
| Ta SUCCESS, switch không có | Ghi nhận sai phía ta | Điều tra, đảo bút toán có phê duyệt |
| Ta UNKNOWN, switch thành công | Phản hồi bị mất | Hạch toán thành công |
| Ta UNKNOWN/FAILED, switch không có | Giao dịch chưa tới switch | Nhả hold, FAILED |
| Lệch số tiền | Lỗi nghiêm trọng | Cảnh báo P1, không tự sửa |

Khớp theo (mã tham chiếu, số tiền, ngày). Chiều ngược lại (ngân hàng ta là bên nhận) cũng phải đối soát: switch báo đã ghi có mà ta chưa cộng tiền cho khách.

### Hoàn tiền / chuyển nhầm
Ngân hàng gửi **không thể tự trừ tiền tài khoản ở ngân hàng khác**. Chuyển nhầm phải đi theo quy trình tra soát qua switch; ngân hàng nhận liên hệ người thụ hưởng và chỉ hoàn khi có cơ sở. Hệ thống chỉ cần lưu yêu cầu tra soát, trạng thái và giao dịch hoàn (nếu có) tham chiếu giao dịch gốc.

### Failure modes
| Sự cố | Xử lý |
|---|---|
| Switch/ngân hàng nhận chậm | Circuit breaker theo ngân hàng nhận, báo khách sớm thay vì treo |
| Connector crash sau khi gửi | Outbox + mã tham chiếu giúp truy vấn lại, không gửi trùng |
| Core banking chậm khi giữ tiền | Timeout ngắn ở bước hold; hold là thao tác có thể truy vấn lại |
| Kafka trễ | Dữ liệu nguồn ở DB; job quét SENT/UNKNOWN quá hạn |

### Ví dụ đời thực
    Một ngân hàng thương mại chuyển tiền nhanh 24/7 (NAPAS) xử lý trung bình 5 triệu giao dịch/ngày. **Triệu chứng:** Vào một ngày mưa lớn, đường truyền giữa switch NAPAS và ngân hàng thụ hưởng bị rớt gói; khoảng 1.200 giao dịch chuyển sang trạng thái UNKNOWN sau 30 giây timeout (hết thời gian chờ phản hồi). Một job tự động "dọn dẹp" chạy mỗi 5 phút thấy UNKNOWN và tự động nhả hold (tiền đang bị giữ) + đánh dấu FAILED, vì cho rằng switch không nhận được bản tin. **Điều tra:** Job log ghi "auto-release UNKNOWN -> FAILED" cho 1.200 giao dịch; đối chiếu với file settlement (đối soát cuối ngày) của switch ngày đó: 847 giao dịch trong số đó **thành công thực sự** — người nhận đã được cộng tiền. Ngân hàng phải thực hiện reversal (giao dịch đảo chiều/hoàn trả) cho 847 giao dịch và đối chiếu với ngân hàng thụ hưởng để ghi nhận sự cố. **Nguyên nhân gốc:** Job tự động chuyển UNKNOWN thành FAILED mà không truy vấn switch trước — vi phạm nguyên tắc "UNKNOWN không phải FAILED". **Xử lý:** (1) Tắt job tự động; (2) Thêm bản tin inquiry (truy vấn trạng thái) theo mã tham chiếu với backoff (chờ tăng dần: 30 giây, 2 phút, 10 phút, 1 giờ); (3) Chỉ chuyển FAILED khi inquiry trả về rõ ràng hoặc đã vượt số lần retry (thử lại); (4) Đặt metric {{transfer.unknown.age}} và cảnh báo nếu > 5 phút; (5) Runbook (quy trình xử lý sự cố): UNKNOWN phải có người xác nhận hoặc đối chiếu settlement trước khi nhả hold. **Kết quả đo được:** Sau khi sửa, 0 giao dịch bị tự động hoàn tiền; 100% UNKNOWN được inquiry trước; thời gian trung bình từ UNKNOWN đến kết quả rõ ràng từ 30 giây lên 4 phút (chấp nhận được vì là giao dịch tiền).

### Trả lời mẫu khi phỏng vấn
    "Bài toán chuyển tiền liên ngân hàng là bài toán đúng tuyệt đối hơn là nhanh. Mỗi giao dịch đi qua state machine (máy trạng thái — tập các bước chuyển trạng thái được định nghĩa rõ): INITIATED → HELD → SENT → SUCCESS/FAILED/UNKNOWN → POSTED/RELEASED. Timeout (hết thời gian chờ) là phần quan trọng nhất: khi không có phản hồi, trạng thái là UNKNOWN, giữ nguyên hold (tiền đang bị giữ), không tự hoàn tiền — vì switch có thể đã chuyển thành công và người nhận đã được cộng tiền, chỉ là phản hồi bị mất. Thay vào đó, gửi inquiry (bản tin truy vấn trạng thái) theo mã tham chiếu, retry (thử lại) có backoff (chờ tăng dần); vẫn chưa rõ sau N lần thì đưa vào hàng đợi đối chiếu cuối ngày. Khách hàng thấy 'Giao dịch đang xử lý', không phải 'Thất bại'. Tôi từng gặp một job tự động chuyển UNKNOWN thành FAILED và làm ngân hàng mất tiền do 847 giao dịch đã thành công bị hoàn lại. Giải pháp: inquiry trước, metric tuổi UNKNOWN, runbook (quy trình xử lý sự cố) đối chiếu rõ ràng."

  
> Senior tip: lỗi đắt nhất trong hệ thống chuyển tiền thường không nằm ở lúc tải cao mà ở **xử lý timeout**: một job "dọn dẹp" tự chuyển UNKNOWN thành FAILED và nhả hold sẽ làm ngân hàng mất tiền mỗi khi mạng chập chờn. Hãy đo số giao dịch UNKNOWN theo phút làm metric hàng đầu và có runbook tra soát rõ ràng.`,
  follow: [
    'Bạn thiết kế cơ chế truy vấn trạng thái khi switch không trả kết quả thế nào để không gây chuyển trùng?',
    'Nếu switch đổi format file đối soát, bạn quản lý version parser ra sao?',
    'Ngân hàng ta là bên nhận: làm sao đảm bảo không cộng tiền hai lần khi switch gửi lại bản tin?'
  ],
  tags: ['IBFT', 'NAPAS', 'banking', 'reconciliation', 'ledger', 'timeout']
,
  refs: [
    { type: 'doc', title: 'ISO 20022', url: 'https://www.iso20022.org/' },
    { type: 'doc', title: 'Saga distributed transactions pattern (Azure)', url: 'https://learn.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga' },
  ]
},
{
  id: 'design-015',
  topic: 'design',
  level: 'senior',
  q: 'So sánh Snowflake, ULID và DB sequence theo block cho distributed ID generator. Xử lý clock skew và thứ tự toàn cục thế nào?',
  a: `**Tóm tắt:** Snowflake cho ID 64-bit gần đúng theo thời gian, sinh cục bộ rất nhanh nhưng phải quản lý worker ID và chống đồng hồ chạy lùi. ULID 128-bit không cần worker ID, vẫn sort được theo thời gian nhưng to gấp đôi. DB sequence cấp theo block đơn giản, không phụ thuộc đồng hồ, nhưng cần DB HA và không cho thứ tự thời gian giữa các instance. Không cách nào cho **thứ tự toàn cục tuyệt đối**; cần điều đó thì phải có một sequencer duy nhất.

### Snowflake: cấu trúc 64 bit
~~~text
| 1 bit = 0 | 41 bit timestamp (ms từ custom epoch) | 10 bit worker | 12 bit sequence |
2^41 ms ≈ 69,7 năm;  2^10 = 1024 worker;  2^12 = 4096 ID / ms / worker
~~~
- Custom epoch (ví dụ 2024-01-01) để kéo dài tuổi thọ 69 năm tính từ mốc đó.
- Sequence tăng trong cùng 1 ms; hết 4096 thì chờ sang ms kế tiếp.
- ID là {{long}} tăng dần theo thời gian → insert vào B-tree luôn ở mép phải, index gọn.

### So sánh
| Tiêu chí | Snowflake | ULID | DB block |
|---|---|---|---|
| Kích thước | 64 bit ({{long}}) | 128 bit (26 ký tự Base32 hoặc cột UUID) | 64 bit |
| Sort theo thời gian | Gần đúng (ms) | Gần đúng (ms) | Chỉ trong một instance |
| Cần điều phối | Worker ID duy nhất | Không | DB cấp block |
| Phụ thuộc đồng hồ | Có, rất nhạy | Có, nhưng phần random giữ tính duy nhất | Không |
| Lộ thông tin | Thời điểm tạo, worker | Thời điểm tạo | Tốc độ tăng trưởng |
| Rủi ro chính | Trùng worker ID, clock lùi | Kích thước index | DB down khi hết block |

ULID = 48 bit timestamp + 80 bit random; timestamp nằm ở đầu nên đọc ngược ra thời điểm rất dễ và B-tree vẫn insert gần cuối. Nhược điểm thật là kích thước: khoá chính 16 byte (hoặc 26 byte nếu lưu chuỗi) làm mọi index phụ to hơn. Thư viện ULID thường có chế độ monotonic: cùng 1 ms thì tăng phần random lên 1 để giữ thứ tự trong một process.

### Clock skew: vì sao nguy hiểm
NTP có thể **step** đồng hồ lùi lại, VM bị pause rồi đồng bộ lại thời gian. Nếu {{currentTimeMillis}} quay về một ms đã dùng, generator có thể sinh lại đúng timestamp + sequence cũ → **trùng ID**.

Cách phòng:
1. Giữ {{lastTimestamp}} trong generator; nếu thời gian hiện tại nhỏ hơn: lùi ít (vài ms) thì chờ, lùi nhiều thì **từ chối sinh ID và alert** (fail-fast tốt hơn sinh trùng).
2. Cấu hình đồng bộ giờ theo kiểu slew (chỉnh từ từ) thay vì step khi đang chạy; với chrony chỉ cho phép {{makestep}} lúc khởi động.
3. Khi khởi động lại, đừng sinh ngay nếu không chắc đồng hồ đã ổn; một số hệ thống lưu mốc thời gian cuối cùng để so sánh.

~~~java
public synchronized long nextId() {
    long now = System.currentTimeMillis();
    if (now < lastTs) {
        long drift = lastTs - now;
        if (drift > 5) throw new IllegalStateException("Clock moved back " + drift + " ms");
        now = waitUntil(lastTs);                // lùi rất ít: chờ đồng hồ đuổi kịp
    }
    if (now == lastTs) {
        seq = (seq + 1) & 0xFFF;                // 12 bit sequence
        if (seq == 0) now = waitUntil(lastTs + 1); // hết 4096 ID trong ms này
    } else {
        seq = 0;
    }
    lastTs = now;
    return ((now - EPOCH) << 22) | (workerId << 12) | seq;
}
~~~
Ngưỡng 5 ms là ví dụ; chọn theo SLA vì luồng gọi bị block trong lúc chờ.

### Gán worker ID: nguồn bug thật hay gặp hơn clock skew
Hash IP hoặc hostname để ra 10 bit dễ trùng khi Kubernetes tái sử dụng IP hoặc scale lên. Cách an toàn: lease worker ID từ etcd/ZooKeeper/Redis có TTL và gia hạn; StatefulSet dùng ordinal của pod; hoặc bảng DB {{worker_lease}} với unique constraint. Mất lease thì ngừng sinh ID.

### DB block allocation
~~~sql
UPDATE id_block SET next_id = next_id + 1000
 WHERE name = 'order'
RETURNING next_id - 1000 AS start_id, next_id - 1 AS end_id;
~~~
Mỗi instance giữ một block trong RAM. Ước lượng: 10.000 ID/s với block 1.000 → chỉ 10 lần gọi DB/s. Crash thì mất phần còn lại của block (lỗ hổng số, chấp nhận được). Hai instance dùng hai block khác nhau nên ID **không** phản ánh thứ tự thời gian giữa các instance. Trong PostgreSQL có thể dùng sequence để cấp **đầu block**: mỗi instance gọi {{nextval}} một lần, dùng giá trị nhận được làm đầu block và dành 1.000 số kế tiếp cho riêng mình; cấu hình {{INCREMENT BY 1000}} khiến các đầu block không chồng nhau. Đảm bảo các số trong block không được cấp lại bởi đường khác.

### Thứ tự toàn cục
ID theo thời gian chỉ là "gần đúng": hai node sinh trong cùng ms có thể đảo thứ tự, và đồng hồ hai máy luôn lệch vài ms. Cần thứ tự tuyệt đối (sổ lệnh chứng khoán, ledger) thì dùng một **sequencer đơn luồng** cho mỗi phạm vi (mỗi mã chứng khoán, mỗi tài khoản) hoặc offset của một Kafka partition. Đừng sắp xếp nghiệp vụ quan trọng bằng timestamp từ nhiều máy.

### Khi nào chọn gì
| Tình huống | Chọn |
|---|---|
| Khoá chính {{bigint}}, throughput cao, team vận hành được lease worker | Snowflake |
| Polyglot, không muốn điều phối, chấp nhận 128 bit | ULID (hoặc UUIDv7) |
| Hệ thống vừa phải, đã có PostgreSQL HA | DB sequence/block |
| Cần thứ tự tuyệt đối | Sequencer đơn luồng theo partition |

### Ví dụ đời thực
    Một nền tảng logistics có 30 instance (bản chạy) microservice sinh ID theo Snowflake tự viết. **Triệu chứng:** Vào một ngày thứ Sáu, một pod (đơn vị chạy ứng dụng trong Kubernetes — hệ thống điều phối container) bị crash (sập) và Kubernetes khởi động lại pod mới với IP mới; bộ sinh ID ở pod mới nhận worker ID (mã định danh máy/worker, 10 bit trong Snowflake) = hash(IP) % 1024 → **trùng worker ID** với một pod đang chạy. Hai worker cùng timestamp (mốc thời gian) + sequence (số thứ tự trong cùng mili-giây) → sinh ra 2 ID trùng nhau; khi insert (chèn) vào PostgreSQL, constraint (ràng buộc unique) báo lỗi. 12 đơn hàng bị từ chối, khách phải thử lại. **Điều tra:** Log DB thấy {{duplicate key violation}} trên bảng {{orders.id}}; kiểm tra cấu hình worker ID: dùng {{InetAddress.getLocalHost().getHostAddress()}} rồi hash mod 1024. Khi Kubernetes tái sử dụng dải IP, hai pod có thể có IP trùng hoặc hash trùng — worker ID không còn duy nhất. **Nguyên nhân gốc:** Worker ID được gán từ IP/hash — không có lease (cơ chế "thuê" định danh có thời hạn, tự hết hạn nếu không gia hạn) hoặc ràng buộc duy nhất toàn cụm. **Xử lý:** (1) Dùng etcd (kho key-value phân tán) cấp worker ID bằng lease có TTL (thời gian sống) + gia hạn định kỳ; (2) Phương án thay thế: StatefulSet (kiểu triển khai có tên/ordinal cố định) với ordinal làm worker ID; (3) Thêm kiểm thử khởi động nhiều pod cùng lúc, xác nhận không trùng; (4) Cân nhắc UUIDv7 (định danh 128-bit có sắp xếp theo thời gian, chuẩn RFC 9562) để bỏ hoàn toàn worker ID và clock skew (đồng hồ lệch/lùi). **Kết quả đo được:** 0 lỗi trùng khóa sau 3 tháng; khởi động lại pod không còn sinh ID trùng.

### Trả lời mẫu khi phỏng vấn
    "Snowflake là ID 64-bit: 1 bit sign (dấu), 41 bit timestamp (mốc thời gian), 10 bit worker (mã máy), 12 bit sequence (số thứ tự trong cùng mili-giây). Ưu điểm: sinh rất nhanh, gần đúng theo thời gian, giúp insert (chèn) vào chỉ mục B-tree ở mép phải. Nhược điểm: phải quản lý worker ID và chống clock skew (đồng hồ hệ thống bị lệch hoặc lùi). Clock skew nguy hiểm vì khi NTP (giao thức đồng bộ thời gian) chỉnh lùi đồng hồ, chương trình có thể sinh lại cặp timestamp + sequence cũ → trùng ID. Cách phòng: giữ lastTimestamp; nếu lùi < 5 ms thì chờ, lùi nhiều thì dừng (fail-fast) để tránh trùng. Worker ID là nguồn lỗi thật: hash IP dễ trùng khi Kubernetes tái sử dụng IP; cách an toàn là lease (thuê định danh có thời hạn) từ etcd/ZooKeeper/Redis có TTL và gia hạn, hoặc dùng StatefulSet ordinal. DB sequence/block không phụ thuộc đồng hồ nhưng không sắp xếp được theo thời gian giữa các instance. Nếu cần thứ tự tuyệt đối (sổ lệnh chứng khoán) thì phải có sequencer đơn luồng. Tôi từng thấy 12 đơn hàng bị từ chối do hai pod Snowflake trùng worker ID — giải pháp là etcd lease hoặc chuyển sang UUIDv7 (định danh 128-bit sắp xếp theo thời gian, RFC 9562)."

  > Senior tip: khi review một Snowflake tự viết, tôi hỏi hai câu trước tiên: "worker ID được cấp thế nào khi scale từ 3 lên 30 pod?" và "đồng hồ lùi 1 giây thì chuyện gì xảy ra?". Phần lớn implementation tự viết trả lời sai ít nhất một câu. Nếu không thật sự cần {{long}}, UUIDv7 (cùng ý tưởng time-ordered như ULID, chuẩn hoá trong RFC 9562) bớt được cả hai rủi ro.`,
  follow: [
    'Nếu cần ID 64-bit nhưng không muốn lo clock skew, bạn thiết kế thế nào?',
    'Khi migrate khoá chính từ bigint auto-increment sang Snowflake hoặc ULID, lộ trình ra sao?',
    'So sánh kích thước index giữa bigint, UUID và chuỗi ULID 26 ký tự trong PostgreSQL.'
  ],
  tags: ['Snowflake', 'ULID', 'UUIDv7', 'distributed ID', 'clock skew', 'sequence']
,
  refs: [
    { type: 'doc', title: 'RFC 9562: Universally Unique IDentifiers (UUIDv7)', url: 'https://www.rfc-editor.org/rfc/rfc9562' },
    { type: 'doc', title: 'PostgreSQL CREATE SEQUENCE', url: 'https://www.postgresql.org/docs/current/sql-createsequence.html' },
  ]
},
{
  id: 'design-016',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế hệ thống đặt vé concert/rạp phim cho phép chọn chỗ ngồi: 500.000 người vào cùng lúc khi mở bán, tuyệt đối không bán một ghế cho hai người. Giữ chỗ tạm và thanh toán xử lý thế nào?',
  a: `**Tóm tắt:** Mỗi ghế là một bản ghi có trạng thái AVAILABLE → HELD (có hạn, ví dụ 10 phút) → SOLD. Giữ chỗ bằng **một conditional UPDATE nguyên tử** (hoặc Redis SET NX có TTL) nên hai người không thể cùng giữ một ghế; unique constraint trên vé là chốt chặn cuối. Thanh toán chỉ được xác nhận nếu hold còn hiệu lực; phòng tải đột biến bằng phòng chờ ảo (virtual waiting room), không phải bằng việc scale DB vô hạn.

### Làm rõ yêu cầu
- Chọn ghế cụ thể (không phải vé đứng), tối đa 4 ghế/người, giữ chỗ 10 phút để thanh toán.
- Quy mô: sân vận động 40.000 ghế, 500.000 người vào trong 5 phút đầu. Giả sử mỗi người tải sơ đồ ghế 3 lần và thử giữ 2 lần: đọc ≈ 1,5 triệu request, ghi ≈ 1 triệu lần thử nhưng **tối đa chỉ 40.000 lần thành công**. Bài toán là contention cực cao trên tập dữ liệu nhỏ.
- Không overbooking là yêu cầu cứng; hiển thị sơ đồ ghế được phép trễ vài giây.

### API
~~~text
GET  /events/{id}/seats            -> sơ đồ ghế (cache, trễ 1-2 s chấp nhận được)
POST /events/{id}/holds            {seatIds:[...]} -> holdId, expiresAt | 409 ghế đã bị giữ
POST /holds/{holdId}/payment       Idempotency-Key -> chuyển sang cổng thanh toán
POST /payments/callback            cổng thanh toán gọi về -> xác nhận vé
~~~

### Mô hình dữ liệu
~~~sql
CREATE TABLE seat (
  event_id bigint, seat_id text, status text NOT NULL,   -- AVAILABLE | HELD | SOLD
  hold_id uuid, hold_until timestamptz, version int,
  PRIMARY KEY (event_id, seat_id));
CREATE TABLE ticket (
  event_id bigint, seat_id text, order_id uuid,
  UNIQUE (event_id, seat_id));                            -- chốt chặn cuối cùng
~~~

### Giữ chỗ nguyên tử
~~~sql
UPDATE seat SET status = 'HELD', hold_id = :holdId, hold_until = now() + interval '10 minutes'
 WHERE event_id = :eventId AND seat_id = ANY(:seatIds)
   AND (status = 'AVAILABLE' OR (status = 'HELD' AND hold_until < now()));
-- số dòng cập nhật != số ghế yêu cầu  => ROLLBACK, trả 409
~~~
Vì sao đúng: PostgreSQL khoá từng dòng khi UPDATE; transaction thứ hai chờ, rồi đánh giá lại điều kiện WHERE trên phiên bản mới và thấy ghế đã HELD nên bỏ qua. Không có "đọc rồi mới ghi" nên không có race. Điều kiện hold_until < now() giúp ghế hết hạn tự quay lại mà không cần job dọn ngay lập tức (job chỉ để sơ đồ ghế hiển thị đúng). Khi giữ nhiều ghế, sắp xếp seat_id để giảm deadlock giữa hai người cùng chọn một cặp ghế.

### Kiến trúc
~~~text
Users -> CDN (sơ đồ tĩnh) -> Waiting Room (token theo lượt, vào 2.000 người/phút)
                                  |
                           Booking Service --(hold/confirm)--> PostgreSQL (primary)
                                  |                                  |
                           Redis (cache trạng thái ghế, TTL 1s)   Outbox -> Kafka -> Email/vé điện tử
                                  |
                           Payment Gateway (redirect + callback)
~~~
Phòng chờ ảo là thành phần quan trọng nhất: thay vì để 500.000 request đập vào DB, chỉ cho một lượng người dùng tương ứng với năng lực xử lý vào trang chọn ghế, số còn lại thấy vị trí trong hàng đợi. Nó vừa bảo vệ hệ thống vừa công bằng hơn "ai F5 nhanh hơn".

### Thanh toán và hết hạn giữ chỗ
- Khi chuyển sang thanh toán, đặt **hạn thanh toán ở cổng ngắn hơn hold** (ví dụ hold 10 phút, link thanh toán hết hạn sau 8 phút) để giảm ca "đã trả tiền nhưng hold đã hết".
- Callback xác nhận bằng conditional update: chỉ chuyển SOLD khi hold_id khớp. Callback xử lý idempotent theo mã giao dịch cổng thanh toán.
- Ca xấu: tiền về sau khi hold đã hết và ghế đã bị người khác giữ → không được ép bán; tự động hoàn tiền và thông báo. Đây là chính sách phải chốt với business từ đầu.
- Callback có thể không đến: job đối soát truy vấn cổng thanh toán cho các hold đang chờ.

### So sánh cách khoá
| Cách | Ưu | Nhược |
|---|---|---|
| Conditional UPDATE trên PostgreSQL | Đúng tuyệt đối, đơn giản, transactional | Một DB primary chịu toàn bộ ghi; cần phòng chờ |
| Redis SET NX EX theo ghế | Rất nhanh, TTL tự nhả | Redis không phải nguồn sự thật; vẫn cần DB constraint khi bán |
| SELECT ... FOR UPDATE SKIP LOCKED | Hợp với "chọn giúp ghế tốt nhất", vé đứng | Không hợp khi người dùng chọn ghế cụ thể |
| Optimistic lock (version) | Không giữ khoá lâu | Tỉ lệ conflict cao khi tranh chấp mạnh, retry nhiều |

### Failure modes
- Redis cache sai lệch: chỉ ảnh hưởng hiển thị, quyết định cuối luôn ở DB.
- Bot giữ chỗ hàng loạt rồi bỏ: giới hạn số hold/người, CAPTCHA ở phòng chờ, hold ngắn.
- DB primary quá tải: phòng chờ giảm nhịp vào; partition theo event nếu nhiều sự kiện mở bán cùng lúc.

### Ví dụ đời thực
    Một nền tảng đặt vé concert 40.000 ghế mở bán cho 500.000 người trong 5 phút. **Triệu chứng:** 3 phút sau khi mở bán, 2.300 ghế đã ở trạng thái HELD (đang giữ chỗ) nhưng 1.200 hold bị hết hạn và do bot (chương trình tự động) tạo ra (giữ hàng nghìn ghế rồi bỏ). Khách thật thấy lỗi 409 "ghế đã bị giữ" dù không ai giữ; một số ghế bị bán hai lần vì callback (lời gọi xác nhận từ cổng thanh toán) đến sau khi hold đã hết hạn. **Điều tra:** Log booking service thấy 1.200 hold có {{hold_until < now()}} nhưng status vẫn HELD — job dọn dẹp chưa chạy; cache (bộ nhớ đệm) sơ đồ ghế trên Redis còn stale (dữ liệu cũ) 1 giây nên khách thấy AVAILABLE trong khi DB đã HELD. Callback từ cổng thanh toán đến trễ 3 phút do timeout, khi đó hold đã hết và ghế bị người khác giữ. **Nguyên nhân gốc:** Không có virtual waiting room (phòng chờ ảo) nên 500.000 request đập thẳng vào DB; không có job dọn dẹp hold hết hạn chạy định kỳ; callback không idempotent (gọi lặp cho cùng kết quả) theo hold_id. **Xử lý:** (1) Thêm virtual waiting room: chỉ cho 2.000 người/phút vào trang chọn ghế, số còn lại xếp hàng chờ; (2) Job dọn dẹp HELD quá hạn chạy mỗi 30 giây; (3) Callback chỉ chuyển SOLD khi {{hold_id}} khớp và {{hold_until > now()}}; (4) Cache sơ đồ ghế TTL (thời gian sống) 1 giây + pub/sub (cơ chế phát tin cập nhật) để làm tươi; (5) Thời gian giữ ghế 10 phút nhưng link thanh toán hết hạn 8 phút. **Kết quả đo được:** Sau khi sửa, 0 ghế bị bán hai lần; 99,9% khách thấy trạng thái ghế chính xác; lưu lượng vào trang chọn ghế giảm từ mức bùng nổ xuống còn khoảng 2.000 yêu cầu/phút (được phòng chờ điều tiết).

### Trả lời mẫu khi phỏng vấn
    "Mỗi ghế là một bản ghi chuyển trạng thái AVAILABLE → HELD → SOLD. Giữ chỗ bằng conditional UPDATE (câu lệnh cập nhật có điều kiện): {{UPDATE seat SET status='HELD', hold_id=?, hold_until=now()+interval '10 minutes' WHERE event_id=? AND seat_id=ANY(?) AND (status='AVAILABLE' OR (status='HELD' AND hold_until < now()))}}. PostgreSQL khóa từng dòng khi cập nhật, giao dịch đến sau chờ rồi đánh giá lại điều kiện, nên không có race condition (tình huống tranh chấp). Unique constraint (ràng buộc duy nhất) trên vé là chốt cuối. Thanh toán: callback (lời gọi xác nhận từ cổng thanh toán) chỉ chuyển SOLD khi {{hold_id}} khớp và hold còn hiệu lực; nếu tiền về sau khi hold hết thì không ép bán, phải tự động hoàn tiền. Phòng tải: dùng virtual waiting room (phòng chờ ảo) — chỉ cho khoảng 2.000 người/phút vào trang chọn ghế, số còn lại xếp hàng; đây mới là thứ giảm tải thật sự vì phần lớn lưu lượng là đọc sơ đồ ghế. Trade-off (đánh đổi): không cần distributed lock (khóa phân tán) cho từng ghế vì conditional UPDATE trong DB đã là cơ chế khóa kèm giao dịch. Tôi từng gặp bot giữ 1.200 ghế và một ghế bị bán hai lần do callback đến muộn — giải pháp là phòng chờ, job dọn dẹp hold hết hạn, và callback idempotent (gọi lặp cho cùng kết quả) theo hold_id."

  > Senior tip: interviewer thường gài câu "dùng distributed lock cho từng ghế được không?". Được, nhưng thừa: một UPDATE có điều kiện trong DB đã là lock đúng nghĩa và có transaction đi kèm. Thứ thật sự cứu bạn ngày mở bán là phòng chờ và cache sơ đồ ghế, vì hơn 90% traffic là đọc.`,
  follow: [
    'Nếu muốn hiển thị trạng thái ghế realtime cho 50.000 người đang xem cùng một sơ đồ, bạn làm thế nào?',
    'Thanh toán thành công nhưng callback đến sau khi hold hết hạn: bạn xử lý theo những bước nào?',
    'Với vé không đánh số ghế (vé đứng, 10.000 vé), thiết kế giữ chỗ thay đổi ra sao?'
  ],
  tags: ['booking', 'overbooking', 'hold', 'TTL', 'waiting room', 'concurrency']
,
  refs: [
    { type: 'doc', title: 'Redis SET (NX, PX options)', url: 'https://redis.io/docs/latest/commands/set/' },
    { type: 'doc', title: 'PostgreSQL: Explicit Locking', url: 'https://www.postgresql.org/docs/current/explicit-locking.html' },
  ]
},
{
  id: 'design-017',
  topic: 'design',
  level: 'lead',
  refs: [
    { type: 'article', title: 'The LMAX Architecture (Martin Fowler)', url: 'https://martinfowler.com/articles/lmax.html' },
    { type: 'doc', title: 'LMAX Disruptor', url: 'https://lmax-exchange.github.io/disruptor/' },
  ],
  q: 'Thiết kế order matching engine cho một sàn giao dịch chứng khoán/crypto: khớp lệnh theo giá rồi thời gian, độ trễ thấp, không mất lệnh khi crash. Vì sao các engine thường chạy đơn luồng?',
  a: `**Tóm tắt:** Lệnh đi qua gateway và kiểm tra rủi ro, rồi vào một **sequencer** gán số thứ tự và ghi journal bền vững. Sau đó **một luồng duy nhất cho mỗi nhóm mã** khớp lệnh trên order book trong RAM theo nguyên tắc giá tốt nhất trước, cùng giá thì lệnh đến trước khớp trước. Đơn luồng giúp engine **deterministic** nếu journal ghi đủ input có thứ tự, timestamp và kết quả phụ thuộc bên ngoài; khi đó replay tái tạo được trạng thái, phục hồi/HA đơn giản hơn và không cần lock trên order book.

### Làm rõ yêu cầu
- Loại lệnh: limit, market, huỷ, sửa. Phiên khớp liên tục (phiên định kỳ ATO/ATC của sàn VN là mở rộng sau).
- Lưu ý bối cảnh VN: khớp lệnh do Sở giao dịch thực hiện; công ty chứng khoán chủ yếu làm OMS (nhận lệnh, kiểm tra sức mua, đẩy lên sàn). Bài này giả định ta xây chính engine (sàn crypto hoặc engine nội bộ).
- Ước lượng: 3 triệu lệnh/ngày trong 4,5 giờ giao dịch → 3.000.000 / 16.200 s ≈ 185 lệnh/s trung bình; đầu và cuối phiên có thể gấp 20–50 lần → vài nghìn lệnh/s. Một luồng xử lý thuần trong RAM chịu được mức này dư dả; thứ cần tối ưu là **độ trễ ổn định (p99)**, không phải throughput.

### Kiến trúc
~~~text
Client -> Gateway (auth, validate) -> Pre-trade risk (sức mua, hạn mức)
                                          |
                                     Sequencer: gán seq, ghi journal (fsync + replicate)
                                          |
                     +--------------------+--------------------+
                     |                    |                    |
              Engine shard A        Engine shard B       Engine standby (replay cùng journal)
              (mã 1..N, 1 luồng)    (mã N+1..M)
                     |
              Output events: ack, trade, cancel  ->  Market data feed
                                                ->  Clearing/settlement, OMS, lịch sử (DB)
~~~
Database không nằm trên đường nóng: trade được ghi xuống DB bất đồng bộ từ output events.

### Order book
- Mỗi mã: hai phía. Bid sắp giảm dần theo giá, ask tăng dần; mỗi mức giá là hàng đợi FIFO.
- {{HashMap<Long, Order>}} theo orderId để huỷ lệnh O(1) (mỗi Order biết mức giá của nó).
- Giá lưu dạng {{long}} theo đơn vị bước giá, không dùng {{double}}; {{BigDecimal}} quá chậm và sinh rác ở đường nóng.

~~~java
// Khớp một lệnh mua limit với phía bán (asks: TreeMap<Long, ArrayDeque<Order>> tăng dần)
void matchBuy(Order buy) {
    while (buy.remaining > 0 && !asks.isEmpty()) {
        var best = asks.firstEntry();                 // giá bán thấp nhất
        if (best.getKey() > buy.price) break;         // không còn giá khớp được
        ArrayDeque<Order> level = best.getValue();
        Order sell = level.peekFirst();               // lệnh đến trước khớp trước
        long qty = Math.min(buy.remaining, sell.remaining);
        buy.remaining -= qty; sell.remaining -= qty;
        out.trade(buy.id, sell.id, best.getKey(), qty); // giá khớp = giá lệnh đang chờ
        if (sell.remaining == 0) { level.pollFirst(); byId.remove(sell.id); }
        if (level.isEmpty()) asks.pollFirstEntry();
    }
    if (buy.remaining > 0) restOnBook(buy);           // phần còn lại vào sổ bên mua
}
~~~

### Vì sao đơn luồng
| Đa luồng có lock | Đơn luồng theo shard |
|---|---|
| Phải khoá order book; contention ngay ở mã nóng | Không lock, cache CPU nóng |
| Thứ tự khớp phụ thuộc lập lịch thread, khó tái hiện | Deterministic khi toàn bộ input, thứ tự, timestamp và quyết định ngoại vi được ghi vào journal |
| Phục hồi cần snapshot nhất quán phức tạp | Snapshot + replay journal từ seq cuối |

Mô hình này giống kiến trúc LMAX (business logic đơn luồng, giao tiếp qua ring buffer Disruptor). Mở rộng bằng cách **shard theo mã**, không bao giờ chia một mã cho hai luồng.

### Bền vững và HA
- Lệnh chỉ được ack "đã nhận" sau khi sequencer ghi journal và nhân bản sang ít nhất một node khác.
- Engine chính và standby cùng đọc journal, cùng khớp; standby chỉ không phát output. Primary chết → standby đã ở đúng trạng thái, chuyển vai trong vài giây (bảo vệ split-brain bằng lease/fencing).
- Snapshot order book định kỳ để không phải replay từ đầu ngày.

### Độ trễ trong Java
- Tránh tạo object ở đường nóng (pool Order, tái sử dụng buffer) để giảm GC; cân nhắc ZGC hoặc Generational ZGC (Java 21) cho pause ngắn, nhưng tốt nhất là ít rác.
- Pin luồng engine vào core riêng, busy-spin thay vì block khi chờ input.
- Đo p99/p99.9 từ gateway tới ack bằng histogram (HdrHistogram), không đo trung bình.

### Failure modes
- Mã quá nóng làm nghẽn shard: tách mã đó ra shard riêng.
- Lệnh bất thường (fat finger): kiểm tra biên độ giá, khối lượng tối đa ở pre-trade risk.
- Journal disk chậm: group commit (gom nhiều lệnh một lần fsync) đổi vài trăm micro giây lấy throughput.

### Ví dụ đời thực
Triệu chứng: Một sàn crypto nội bộ (engine tự xây bằng Java, một shard một luồng cho mỗi mã nóng như BTC/USDT) chạy ổn ở 1.500 lệnh/s, nhưng vào 20:00–20:30 (giờ tin tức Mỹ công bố) p99 độ trễ ack (thời gian từ lúc gateway nhận lệnh đến lúc trả "đã nhận") tăng từ 3 ms lên 120 ms, và có 2 lệnh bị ack trễ khiến bot của market maker gửi lệnh huỷ nhưng huỷ không kịp, tạo giao dịch ngoài ý muốn.

Điều tra: Đo histogram p99/p99.9 từ gateway đến ack bằng HdrHistogram, tách từng chặng (gateway, risk, sequencer, engine). Metric cho thấy thời gian đứng chủ yếu ở sequencer, không phải engine (engine vẫn xử lý một lệnh trong ~40 micro giây). Log sequencer và metric disk ({{iostat -x 1}} trên node journal, hoặc {{node_disk_write_time_seconds_total}} nếu có Prometheus node exporter) cho thấy {{await}} của ổ NVMe tăng vọt và số lần {{fsync}}/s bằng đúng số lệnh/s. Kiểm tra cấu hình: sequencer đang {{fsync}} cho từng lệnh một.

Nguyên nhân gốc: Mỗi lệnh đòi một lần {{fsync}} (ép dữ liệu xuống thiết bị lưu trữ bền vững) để đảm bảo "ack chỉ sau khi journal an toàn". Ở 3.000 lệnh/s cao điểm, ổ NVMe không kịp phục vụ 3.000 fsync/s tuần tự, hàng đợi ghi phình ra → độ trễ ack tăng. Đây là đánh đổi kinh điển: bền vững mạnh (mỗi lệnh) đổi lấy độ trễ.

Cách xử lý: Bật **group commit** ở sequencer: gom các lệnh đến trong cửa sổ rất ngắn (ví dụ 200 micro giây hoặc tối đa 64 lệnh) rồi ghi một batch và {{fsync}} một lần, sau đó ack cả batch. Giữ nguyên quy tắc "chỉ ack sau fsync". Thêm giám sát {{sequencer_batch_size}}, {{journal_fsync_latency_p99}}, và {{ack_latency_p99}}. Kiểm thử failover: kill primary, xác nhận standby replay journal đến đúng {{seq}} cuối và tiếp tục khớp.

Kết quả đo được: fsync giảm còn ~200–400 lần/s ở cùng tải, p99 ack về 4–6 ms ở 3.000 lệnh/s, không còn lệnh ack trễ gây huỷ trượt trong phiên sau. Đổi lại, độ trễ tối thiểu tăng thêm ~0,1 ms do chờ batch, chấp nhận được so với mục tiêu p99 ổn định.

### Trả lời mẫu khi phỏng vấn
"Em sẽ thiết kế matching engine như một state machine đơn luồng theo từng shard mã để bảo đảm tính deterministic, tức là cùng một dãy lệnh đầu vào thì luôn cho ra cùng kết quả khớp. Lệnh đi qua gateway và kiểm tra rủi ro, rồi sequencer gán số thứ tự và ghi journal bền vững trước khi engine khớp trên order book trong RAM theo nguyên tắc giá tốt nhất trước, cùng giá thì ai đến trước khớp trước. Em dùng giá dạng số nguyên theo bước giá, không dùng double, và dùng HashMap theo orderId để huỷ O(1). Database không nằm trên đường nóng, trade được ghi bất đồng bộ từ output event. Về HA, primary và standby cùng replay journal; chỉ ack sau khi journal đã được nhân bản. Trade-off chính là đơn luồng dễ đúng và dễ phục hồi nhưng phải shard theo mã, còn bền vững mỗi lệnh làm tăng độ trễ nên em dùng group commit để cân bằng. Ở dự án trước, việc chuyển từ fsync từng lệnh sang group commit đã kéo p99 ack từ hơn 100 ms về khoảng 5 ms ở tải cao điểm."

> Senior tip: ở cấp lead, điểm cộng lớn nhất là nói được "engine là một state machine deterministic, journal là nguồn sự thật". Từ câu đó suy ra mọi thứ: HA bằng replay, audit bằng journal, debug bằng cách phát lại đúng ngày lỗi trên máy dev. Ứng viên bắt đầu bằng "dùng Kafka + nhiều consumer + Redis lock" thường tự đào hố về thứ tự khớp.`,
  follow: [
    'Bạn hỗ trợ phiên khớp lệnh định kỳ (ATO/ATC) thế nào: thuật toán xác định giá khớp?',
    'Làm sao kiểm tra sức mua trước khi khớp mà không biến risk check thành điểm nghẽn?',
    'Primary và standby lệch nhau một lệnh khi failover: làm sao phát hiện và xử lý?'
  ],
  tags: ['matching engine', 'order book', 'sequencer', 'low latency', 'LMAX', 'determinism']
},
{
  id: 'design-018',
  topic: 'design',
  level: 'mid',
  q: 'Thiết kế tính năng gợi ý từ khoá (autocomplete/typeahead) cho ô tìm kiếm của một sàn thương mại điện tử 10 triệu người dùng/ngày. Gõ "dien th" phải ra "điện thoại" trong vòng 100 ms.',
  a: `**Tóm tắt:** Không tính gợi ý lúc người dùng gõ. Một pipeline offline đếm tần suất từ khoá từ log tìm kiếm, dựng sẵn bảng **prefix → top-K từ khoá** (trie có cache top-K ở mỗi node), nạp vào RAM của service gợi ý. Mỗi request chỉ là một phép tra cứu O(độ dài prefix). Thêm chuẩn hoá tiếng Việt bỏ dấu, debounce ở client, cache cho prefix ngắn và một lớp "trending" cập nhật vài phút một lần.

### Làm rõ yêu cầu và ước lượng
- Trả về 10 gợi ý, xếp theo độ phổ biến; hỗ trợ gõ không dấu; lọc từ khoá nhạy cảm.
- 10 triệu người dùng × 5 lần tìm/ngày × khoảng 6 request mỗi lần gõ (đã debounce) = 300 triệu request/ngày → 300.000.000 / 86.400 ≈ 3.500 QPS trung bình; cao điểm (sale 12.12) giả sử gấp 5 → ~17.000 QPS.
- Độ tươi: từ khoá mới nổi xuất hiện trong vài phút là đủ; không cần realtime từng giây.

### Kiến trúc
~~~text
Search box --debounce 150ms--> CDN/edge cache (prefix 1-2 ký tự)
                                   |
                           Suggest Service (n instance, dữ liệu trong RAM)
                                   ^
            nạp snapshot mới, swap nguyên tử (mỗi giờ)
                                   |
Search logs -> Kafka -> Job tổng hợp (đếm, decay theo thời gian, lọc) -> Snapshot trên S3
                   \-> Stream đếm trending (cửa sổ 10 phút) -> Redis (lớp trending)
~~~

### Cấu trúc dữ liệu
Trie thuần phải duyệt toàn bộ cây con để tìm top-K, quá chậm với prefix ngắn. Cách làm thực tế: **lưu sẵn top-K ở mỗi node** khi build offline. Truy vấn = đi theo prefix rồi trả list có sẵn.

Ước lượng bộ nhớ: chỉ giữ từ khoá được tìm ≥ 20 lần trong 30 ngày, giả sử còn 1 triệu từ khoá; giới hạn prefix 20 ký tự. Số prefix khác nhau giả sử ~5 triệu (chia sẻ nhiều). Mỗi prefix giữ 10 con trỏ/ID (~40–80 byte) cộng overhead → cỡ 500 MB–1 GB. Vừa RAM một instance, nên mỗi instance giữ bản đầy đủ, scale ngang đơn giản. Nếu lớn hơn, có thể shard theo ký tự đầu, nhưng dễ lệch tải (prefix "a" nóng hơn "x").

Một cách thay thế ít code: Elasticsearch/OpenSearch có kiểu field {{completion}} (completion suggester) dựng cấu trúc FST trong bộ nhớ, hỗ trợ trọng số. Hợp khi đã vận hành ES; tự build trie hợp khi cần kiểm soát xếp hạng và độ trễ.

### Chuẩn hoá tiếng Việt
~~~java
static String normalize(String s) {
    String n = Normalizer.normalize(s.toLowerCase(Locale.ROOT), Normalizer.Form.NFD);
    n = n.replaceAll("\\\\p{M}", "");          // bỏ dấu thanh, dấu mũ (combining marks)
    n = n.replace('đ', 'd');                  // 'đ' không tách được bằng NFD, phải thay tay
    return n.trim().replaceAll("\\\\s+", " ");  // gộp khoảng trắng
}
// normalize("Điện Thoại ") -> "dien thoai"
~~~
Index theo dạng đã chuẩn hoá, nhưng **hiển thị** dạng có dấu phổ biến nhất của từ khoá đó.

### Xếp hạng và độ tươi
- Điểm = tổng lượt tìm có **decay** (ví dụ mỗi ngày nhân 0,9) để từ khoá cũ không bám top mãi; có thể cộng thêm tỉ lệ click/mua.
- Lớp trending: đếm theo cửa sổ 10 phút, chỉ áp cho từ khoá tăng đột biến; service trộn kết quả hai lớp khi trả về.
- Lọc: blacklist từ ngữ nhạy cảm, tên thương hiệu bị cấm, và chống bơm từ khoá bằng cách chỉ đếm một lần mỗi user trong một khoảng thời gian.

### Tối ưu phía client và cache
- Debounce 100–200 ms, huỷ request cũ khi người dùng gõ tiếp.
- Prefix 1–2 ký tự chỉ có vài nghìn tổ hợp nhưng chiếm phần lớn traffic → cache ở CDN/trình duyệt vài phút.
- Cá nhân hoá (lịch sử tìm của chính user) trộn ở client hoặc một lớp riêng, để phần chung vẫn cache được.

### Trade-off
| Phương án | Ưu | Nhược |
|---|---|---|
| Trie top-K trong RAM | Nhanh nhất, kiểm soát hoàn toàn | Phải tự build, deploy snapshot |
| Redis sorted set mỗi prefix | Dễ cập nhật tăng dần | Rất nhiều key, tốn RAM Redis, thêm network hop |
| ES completion suggester | Ít code, có fuzzy | Phụ thuộc cluster ES, khó tuỳ biến xếp hạng |
| SQL LIKE 'prefix%' | Đơn giản, prefix search có thể tận dụng index phù hợp | Khó giữ 17.000 QPS và xếp hạng tốt nếu không thiết kế index/cache phù hợp |

### Ví dụ đời thực
Triệu chứng: Sàn thương mại điện tử ~8 triệu MAU bật tính năng autocomplete mới dùng Redis {{ZREVRANGE}} cho mỗi prefix (một sorted set cho mỗi chuỗi tiền tố người dùng gõ). Ngày sale, traffic gợi ý tăng lên ~12.000 QPS; p95 thời gian phản hồi autocomplete tăng từ 60 ms lên 400 ms, ô tìm kiếm hiện gợi ý chậm rõ rệt và Redis CPU chạm 85%.

Điều tra: Bật {{SLOWLOG GET 50}} trên Redis và xem metric {{redis_commands_duration_seconds}}, {{instantaneous_ops_per_sec}}. SLOWLOG cho thấy rất nhiều lệnh đọc trên các key prefix 1–2 ký tự ({{"p:a"}}, {{"p:d"}}) bị lặp lại liên tục. Đếm số key prefix ({{DBSIZE}}, sampling key pattern) cho thấy hàng triệu key, nhưng top 200 prefix ngắn chiếm phần lớn request. Ở client, log frontend cho thấy mỗi lần gõ gửi request ngay lập tức, người dùng gõ nhanh tạo 8–10 request/giây, nhiều request cũ trở nên vô ích.

Nguyên nhân gốc: Hai vấn đề cộng hưởng: (1) mô hình "mỗi prefix một sorted set" tạo quá nhiều key và mỗi request là một network hop tới Redis; prefix ngắn bị truy vấn lặp đi lặp lại; (2) client không debounce nên nhân số request lên gấp nhiều lần.

Cách xử lý: (1) Ở client thêm debounce 150 ms và huỷ request cũ (AbortController) khi người dùng gõ tiếp. (2) Cache prefix 1–2 ký tự ở CDN/trình duyệt với TTL 2–5 phút (dữ liệu này ít thay đổi). (3) Thay lớp Redis prefix-key bằng snapshot trie top-K dựng offline (job tổng hợp log tìm kiếm mỗi giờ, nạp vào RAM của Suggest Service và swap nguyên tử); Redis chỉ giữ lớp "trending" cửa sổ 10 phút để trộn vào. (4) Thêm dashboard theo dõi QPS gốc, cache hit rate, p95, và lỗi.

Kết quả đo được: Số request xuống Redis/service gợi ý giảm ~70% (debounce + CDN cache), p95 autocomplete về 40–70 ms ở ~12.000 QPS đỉnh, Redis CPU giảm còn ~20%. Từ khoá trending mới vẫn xuất hiện trong 5–10 phút nhờ lớp trending riêng.

### Trả lời mẫu khi phỏng vấn
"Với autocomplete cho sàn thương mại điện tử, em sẽ không tính gợi ý lúc người dùng gõ mà dựng sẵn dữ liệu offline. Pipeline lấy log tìm kiếm, chuẩn hoá, đếm tần suất có decay theo thời gian, rồi build cấu trúc prefix trỏ tới top K từ khoá và nạp snapshot vào RAM của Suggest Service, nên mỗi request chỉ là tra cứu theo độ dài prefix. Với tiếng Việt em chuẩn hoá bỏ dấu bằng Unicode NFD và xử lý riêng chữ đ, nhưng hiển thị lại dạng có dấu phổ biến. Để chịu tải, em debounce 150 ms ở client, huỷ request cũ, cache prefix 1–2 ký tự ở CDN, và có lớp trending cập nhật vài phút một lần cho từ khoá tăng đột biến. Trade-off là dữ liệu gợi ý có độ trễ vài phút và phải vận hành job build snapshot; em chấp nhận vì mục tiêu là p95 dưới 100 ms. Ở một lần tối ưu tương tự, debounce và cache prefix ngắn đã giảm khoảng 70% request xuống backend."

> Senior tip: phần lớn độ trễ cảm nhận được nằm ở client và mạng, không ở server. Đo từ lúc gõ tới lúc hiện gợi ý; thường debounce hợp lý cộng cache prefix ngắn đã giảm hơn một nửa số request mà chẳng cần đụng tới thuật toán.`,
  follow: [
    'Làm sao hỗ trợ gõ sai chính tả (ví dụ "dien thaoi") mà không làm chậm truy vấn?',
    'Bạn cập nhật snapshot trie mới vào các instance thế nào để không tăng độ trễ khi swap?',
    'Cá nhân hoá gợi ý theo lịch sử người dùng mà vẫn tận dụng được cache?'
  ],
  tags: ['typeahead', 'autocomplete', 'trie', 'top-K', 'tiếng Việt', 'cache']
},
{
  id: 'design-019',
  topic: 'design',
  level: 'senior',
  q: 'Công ty có khoảng 1.000 pod Spring Boot. Thiết kế hệ thống thu thập log và metrics tập trung: ingest, lưu trữ, truy vấn, retention và kiểm soát chi phí. Bạn tránh những sai lầm nào?',
  a: `**Tóm tắt:** Log và metrics là hai bài toán khác nhau. Log: agent trên node đọc log JSON có traceId, đẩy qua Kafka làm bộ đệm, xử lý (parse, **che dữ liệu nhạy cảm**), lưu hot vài ngày để tìm kiếm và cold trên object storage cho retention dài. Metrics: Prometheus scrape, remote write về kho time-series dài hạn, và **kiểm soát cardinality**. Chi phí chủ yếu đến từ lượng dữ liệu được index, nên quyết định "index gì, giữ bao lâu" quan trọng hơn chọn công cụ nào.

### Ước lượng quy mô (giả định)
- Log: 1.000 pod × 100 dòng/s × 400 byte = 40 MB/s → 40 × 86.400 ≈ 3,5 TB/ngày dữ liệu thô. Giả sử nén được 5–10 lần → 350–700 GB/ngày trên storage.
- Metrics: 1.000 pod × 2.000 series (JVM, HTTP, pool, Kafka client) = 2 triệu active series; scrape 15 s → 2.000.000 / 15 ≈ 133.000 sample/s.
- Con số đó cho thấy: index full-text toàn bộ 3,5 TB/ngày trong 90 ngày là rất đắt; phải phân tầng.

### Kiến trúc
~~~text
Pod (JSON log -> stdout)        Pod (/actuator/prometheus)
      |                                  |
Node agent (Fluent Bit / OTel Collector) Prometheus (scrape, giữ 1-2 ngày)
      |                                  |
    Kafka (bộ đệm, chống spike)    remote_write -> Mimir/Thanos/VictoriaMetrics (S3)
      |                                  |
Processor: parse, mask PII,          Grafana + Alertmanager
 lọc DEBUG, gắn metadata
      |
 +----+-----------------------+
 |                            |
Hot: OpenSearch/Loki (7 ngày)  Cold: S3 (nén, phân vùng theo ngày) -> lifecycle sang Glacier
~~~

### Phía ứng dụng
- Log dạng JSON có {{traceId}}/{{spanId}}: Spring Boot 3 với Micrometer Tracing tự đưa traceId vào MDC; từ Spring Boot 3.4 có sẵn structured logging (ECS, GELF, Logstash format) qua cấu hình.
- Ghi ra stdout, để agent thu gom; không để app gửi log thẳng qua mạng (app chậm theo hệ thống log).
- Không log toàn bộ request/response; không log số thẻ, CCCD, số dư, OTP. Masking ở processor chỉ là lớp thứ hai.

### Vì sao cần Kafka ở giữa
Khi có sự cố, lượng log tăng vọt (stack trace, retry) đúng lúc hệ thống lưu trữ cũng đang chịu tải. Kafka hấp thụ spike trong giới hạn dung lượng và retention đã cấu hình, cho backend thời gian bắt kịp và cho nhiều consumer (SIEM của bộ phận bảo mật, kho dữ liệu) đọc cùng luồng. Đây không phải bảo đảm không mất log: cần theo dõi consumer lag/disk và có buffer ra disk ở agent khi Kafka không tới được; khi buffer đầy phải có chính sách rõ ràng.

### Lưu trữ và retention phân tầng
| Tầng | Nội dung | Thời gian | Ghi chú |
|---|---|---|---|
| Hot | Log có thể tìm kiếm | 7–14 ngày | Phục vụ điều tra sự cố |
| Cold | Toàn bộ log nén trên S3 | 90 ngày–vài năm | Truy vấn bằng Athena khi cần |
| Archive | Audit log | Theo quy định | S3 Object Lock (WORM), tách khỏi log ứng dụng |
| Metrics | Raw 15 s | 15–30 ngày | Downsample 5 phút cho dữ liệu cũ |

So sánh lưu trữ log hot: Elasticsearch/OpenSearch index full-text, tìm kiếm mạnh nhưng tốn CPU, RAM, disk; Loki chỉ index label (service, namespace, level) còn nội dung lưu chunk nén trên object storage, rẻ hơn nhiều nhưng tìm theo nội dung chậm hơn. Nhiều nơi chọn Loki cho log ứng dụng, ES cho các luồng cần tìm kiếm phức tạp.

### Cardinality: sai lầm đắt nhất với metrics
~~~java
// SAI: mỗi userId tạo một time series mới -> hàng triệu series, Prometheus OOM
Counter.builder("payment.requests").tag("userId", userId).register(registry).increment();

// ĐÚNG: tag có tập giá trị nhỏ, cố định
Counter.builder("payment.requests")
       .tag("channel", channel)        // APP, WEB, POS
       .tag("result", result)          // SUCCESS, FAILED, TIMEOUT
       .register(registry).increment();
~~~
Tương tự với tag {{uri}} chứa ID thật thay vì template. Đặt giới hạn series mỗi job ở phía lưu trữ và cảnh báo khi số series tăng đột biến.

### Kiểm soát chi phí
- Chỉ bật DEBUG theo service, theo thời gian; sample log thành công lặp lại, giữ 100% log lỗi.
- Tính chi phí theo team (theo namespace) và cho họ xem; chi phí giảm ngay khi team thấy hoá đơn của mình.
- Trace dùng tail-based sampling: giữ trace lỗi hoặc chậm, sample phần còn lại.

### Failure modes
- Hệ thống log chết đúng lúc cần nhất: monitoring của chính hệ thống log phải độc lập (ít nhất alert cơ bản không đi qua nó).
- Một service log vòng lặp lỗi làm ngập Kafka: rate limit theo nguồn ở agent.
- Clock lệch giữa node làm sai thứ tự log: dựa vào traceId để ghép, không chỉ timestamp.

### Ví dụ đời thực
Triệu chứng: Một hệ thống ~800 pod Spring Boot dùng Prometheus (scrape 15s) + remote_write về kho metrics dài hạn. Khoảng 02:10 sáng, Prometheus bắt đầu dùng RAM tăng nhanh, sau đó OOM và restart lặp lại; dashboard Grafana mất dữ liệu 10–15 phút, alertmanager im lặng một phần vì không có metric mới.

Điều tra: Xem log Prometheus (OOMKilled), metric {{prometheus_tsdb_head_series}} (số time series đang hoạt động trong head), {{prometheus_tsdb_head_chunks_created_total}}, và trang {{/tsdb-status}} để xem top label/value tạo nhiều series. {{/tsdb-status}} cho thấy một metric HTTP của service {{payment-api}} có hàng trăm nghìn series mới trong 30 phút, và label {{uri}} có giá trị dạng {{/payments/123456}}, {{/orders/98765}} (chứa ID thật thay vì mẫu route).

Nguyên nhân gốc: Một thay đổi gần đây ghi metric độ trễ/đếm request với tag {{uri}} lấy từ đường dẫn thật thay vì mẫu route. Mỗi {{orderId}}/{{paymentId}} tạo ra một time series mới (cardinality nổ). 800 pod × số ID khác nhau → số series tăng vượt xa dung lượng RAM Prometheus head block. Đây là lỗi cardinality kinh điển: tag có tập giá trị "vô hạn".

Cách xử lý: (1) Ổn định ngay: thêm {{metric_relabel_configs}} ở Prometheus để drop tạm metric/tag gây nổ, hoặc giới hạn/alert theo {{prometheus_tsdb_head_series}}; khởi động lại Prometheus sau khi giảm tải scrape nếu cần. (2) Sửa code: đổi tag {{uri}} sang template route (ví dụ {{/payments/<id>}}, {{/orders/<id>}}) và chỉ giữ tag có tập giá trị nhỏ, cố định ({{method}}, {{status}}, {{channel}}). (3) Phòng ngừa: đặt quy tắc review metric (không dùng userId/orderId/requestId làm label), giới hạn series mỗi job ở kho lưu trữ, cảnh báo khi {{prometheus_tsdb_head_series}} tăng đột biến. (4) Với log tương tự, kiểm tra agent/processor không index ID động vào label.

Kết quả đo được: Sau khi drop tạm và deploy bản sửa, {{prometheus_tsdb_head_series}} giảm từ mức gây OOM về ~2,5 triệu series ổn định, Prometheus hết restart, alert và dashboard khôi phục. Thêm alert "head series tăng > 30% trong 10 phút" giúp phát hiện sớm nếu tái diễn.

### Trả lời mẫu khi phỏng vấn
"Khi thiết kế logging và metrics cho khoảng 1.000 pod Spring Boot, em tách hai bài toán. Với log, em cho ứng dụng ghi JSON ra stdout có traceId, agent trên node gom và đẩy qua Kafka để chống spike, rồi processor parse, che dữ liệu nhạy cảm và lọc trước khi lưu hot vài ngày để tìm kiếm, còn cold nén trên object storage theo chính sách retention. Với metrics, em dùng Prometheus scrape, remote_write về kho time-series dài hạn và downsample dữ liệu cũ. Điểm em luôn nhấn mạnh là kiểm soát chi phí và cardinality: quyết định index gì, giữ bao lâu quan trọng hơn chọn công cụ; tag metric phải có tập giá trị nhỏ, cố định, tuyệt đối không dùng userId hay orderId. Trade-off là log full-text hot đắt và chậm nếu giữ lâu, còn Loki rẻ hơn nhưng tìm nội dung kém hơn, nên em phân tầng theo nhu cầu điều tra. Em từng xử lý Prometheus OOM do tag uri chứa ID thật làm nổ series; sửa bằng cách dùng route template và thêm cảnh báo khi head series tăng đột biến."

> Senior tip: trước khi bàn công cụ, hãy hỏi "bao nhiêu % log chúng ta từng tìm tới?". Câu trả lời thường rất nhỏ. Phân tầng hot/cold và sample log thành công thường giảm chi phí mạnh hơn nhiều so với đổi từ ES sang công cụ khác.`,
  follow: [
    'Bạn đảm bảo log không chứa dữ liệu nhạy cảm (số thẻ, CCCD) ở tầng ứng dụng thế nào, ngoài masking ở pipeline?',
    'Prometheus bị OOM vì cardinality tăng đột biến lúc 2 giờ sáng: bạn điều tra và xử lý ra sao?',
    'So sánh head-based và tail-based sampling cho distributed tracing.'
  ],
  tags: ['logging', 'metrics', 'observability', 'Kafka', 'cardinality', 'retention']
,
  refs: [
    { type: 'doc', title: 'OpenTelemetry Documentation', url: 'https://opentelemetry.io/docs/' },
    { type: 'doc', title: 'Prometheus: Metric and label naming', url: 'https://prometheus.io/docs/practices/naming/' },
    { type: 'doc', title: 'Grafana Loki Documentation', url: 'https://grafana.com/docs/loki/latest/' },
  ]
},
{
  id: 'design-020',
  topic: 'design',
  level: 'lead',
  refs: [
    { type: 'doc', title: 'Redis INCR', url: 'https://redis.io/docs/latest/commands/incr/' },
  ],
  q: 'Thiết kế hệ thống phát hiện gian lận thời gian thực cho giao dịch thẻ/ví điện tử: phải ra quyết định chấp nhận, yêu cầu xác thực thêm hay từ chối trong khoảng 100 ms. Bạn kết hợp rule engine, feature store và model thế nào?',
  a: `**Tóm tắt:** Tách hai đường: **đường đồng bộ** nằm trong luồng thanh toán, chỉ đọc feature đã tính sẵn (Redis) rồi chạy rule + model trong ngân sách thời gian cố định và có chính sách dự phòng khi quá hạn; **đường bất đồng bộ** dùng stream processing (Kafka + Flink) tính các velocity feature theo cửa sổ thời gian, cập nhật feature store, phát hiện mẫu phức tạp và đưa case cho analyst. Rule cho phép phản ứng trong vài phút với kiểu gian lận mới; model bắt các mẫu tinh vi; nhãn (chargeback, khiếu nại) quay lại để huấn luyện.

### Làm rõ yêu cầu
- Quyết định: APPROVE, CHALLENGE (yêu cầu OTP/sinh trắc), DECLINE, kèm lý do để giải thích cho khách và analyst.
- Quy mô giả định: 20 triệu giao dịch/ngày → 20.000.000 / 86.400 ≈ 230 TPS trung bình; cao điểm (ngày sale, lương) gấp 10 → ~2.300 TPS.
- Ngân sách độ trễ: p99 ≤ 100 ms cho toàn bộ fraud check, vì nó cộng thẳng vào thời gian thanh toán.
- Hai chỉ số kinh doanh mâu thuẫn: **tỉ lệ bắt gian lận** và **tỉ lệ chặn nhầm** (khách thật bị từ chối, chịu ma sát). Phải thống nhất với business mức nào chấp nhận được.

### Kiến trúc
~~~text
Payment Service --(sync, timeout 100ms)--> Fraud Decision Service
                                            | 1. đọc feature (Redis)      ~5 ms
                                            | 2. rule engine              ~2 ms
                                            | 3. model score              ~10 ms
                                            | 4. kết hợp -> quyết định + lý do
                                            v
                                     Kafka: txn + decision events
                                            |
              +-----------------------------+-----------------------------+
              |                             |                             |
     Flink: velocity / window      Case management (analyst)      Data lake (S3)
     -> cập nhật Redis features    xác nhận gian lận -> nhãn      -> training, backtest rule
~~~

### Feature: phần quyết định chất lượng
| Nhóm | Ví dụ | Tính ở đâu |
|---|---|---|
| Velocity | Số giao dịch của thẻ trong 10 phút, tổng tiền 24 giờ | Counter theo bucket, cập nhật đồng bộ |
| Thiết bị/mạng | Thiết bị mới, IP thuộc dải nghi vấn, emulator | Lúc request |
| Hành vi | Lệch so với số tiền trung bình 90 ngày, giờ giao dịch bất thường | Flink/batch, lưu Redis |
| Quan hệ | Người nhận mới, người nhận đã bị nhiều tài khoản báo cáo | Graph/batch |
| Địa lý | Hai giao dịch cách nhau 1.000 km trong 30 phút | Lưu vị trí cuối cùng |

Velocity cho giao dịch hiện tại phải tính **ngay trong đường đồng bộ** (Flink trễ vài giây; kẻ gian bắn 20 giao dịch trong 10 giây sẽ lọt):
~~~java
// Phác thảo: production cần gộp INCR + TTL thành thao tác nguyên tử và khử trùng theo transactionId.
// Bucket 1 phút là xấp xỉ cửa sổ trượt; giao dịch retry phải dùng idempotency key.
long countLast10Min(String cardHash) {
    long minute = Instant.now().getEpochSecond() / 60;
    String key = "vel:" + cardHash + ":" + minute;
    redis.opsForValue().increment(key);                   // tính cả giao dịch hiện tại
    redis.expire(key, Duration.ofMinutes(11));            // minh hoạ; gộp hai lệnh trong production
    List<String> keys = LongStream.range(minute - 9, minute + 1)
            .mapToObj(m -> "vel:" + cardHash + ":" + m).toList();
    return redis.opsForValue().multiGet(keys).stream()    // 1 round-trip cho 10 bucket
            .filter(Objects::nonNull).mapToLong(Long::parseLong).sum();
}
~~~
Feature dùng lúc huấn luyện và lúc phục vụ phải được tính **cùng một định nghĩa**; nếu không model sẽ tốt trên giấy nhưng kém trên production (training-serving skew). Đó là lý do có feature store với hai mặt online/offline.

### Rule và model
- Rule engine (tự viết DSL hoặc Drools) cấu hình được không cần deploy: "người nhận mới AND số tiền > 50 triệu AND thiết bị mới → CHALLENGE". Rule giải thích được, phản ứng nhanh với kiểu lừa đảo mới.
- Model (gradient boosting phổ biến với dữ liệu dạng bảng) cho điểm rủi ro; chạy in-process (ONNX Runtime có Java API) để tránh thêm network hop.
- Kết hợp: rule chặn cứng luôn thắng; còn lại theo ngưỡng điểm. Rule mới chạy **shadow mode** (chỉ ghi log, không chặn) vài ngày để đo tỉ lệ chặn nhầm trước khi bật.

### Khi fraud service chậm hoặc chết
| Chính sách | Khi nào |
|---|---|
| Fail-open (cho qua) | Giao dịch nhỏ, khách lâu năm |
| Step-up (CHALLENGE) | Mặc định khi không chắc |
| Fail-closed (từ chối) | Số tiền lớn, người nhận mới |
Quyết định dự phòng phải được ghi nhận và kiểm tra lại bất đồng bộ.

### Bottleneck và rủi ro
- Hot key Redis cho merchant lớn: tách counter theo shard rồi cộng.
- Nhãn đến muộn (chargeback sau vài tuần) → đánh giá model phải tính độ trễ của nhãn.
- Kẻ gian dò ngưỡng: không trả lý do chi tiết cho client; thay đổi rule định kỳ.
- Dữ liệu cá nhân: hash số thẻ (tokenization), phân quyền truy cập case.

### Ví dụ đời thực
Triệu chứng: Một ví điện tử có Fraud Decision Service đặt trong luồng thanh toán (timeout 100 ms, nếu quá hạn thì CHALLENGE). Trong chiến dịch hoàn tiền 21:00, lượng giao dịch tăng gấp ~8 lần lên ~1.800 TPS. Đột nhiên tỉ lệ CHALLENGE tăng từ 6% lên 22% trong 10 phút, nhưng dashboard cho thấy điểm model không tăng tương ứng; nhiều khách than bị yêu cầu OTP bất thường.

Điều tra: Xem metric {{fraud_decision_latency_p99}}, {{fraud_timeout_total}}, tỉ lệ quyết định theo {{reason}} (APPROVE/CHALLENGE/DECLINE). Phân tích trace (OpenTelemetry) cho thấy thời gian chủ yếu nằm ở bước đọc feature từ Redis, đặc biệt các lệnh lấy velocity theo nhiều bucket. Redis metric {{redis_connected_clients}}, {{latency}}, {{instantaneous_ops_per_sec}} tăng; một vài key dạng {{vel:<merchant_lớn>:<minute>}} nhận lượng truy cập rất cao (hot key). Kiểm tra thêm cho thấy đường bất đồng bộ (Flink) bị trễ ~40 giây do backlog, nhưng đường đồng bộ vẫn phải tự tính velocity giao dịch hiện tại.

Nguyên nhân gốc: Velocity feature được tính đồng bộ bằng cách đọc/ghi nhiều bucket phút trên Redis. Merchant lớn tạo hot key và làm tăng độ trễ đọc; p99 vượt 100 ms → Fraud Decision Service rơi vào chính sách dự phòng CHALLENGE (step-up) để an toàn. Kết quả là "chặn nhầm mềm" (ma sát cho khách thật) tăng, dù không có sóng gian lận thực sự.

Cách xử lý: (1) Tối ưu hot key: tách counter theo shard ({{vel:<cardHash>:<minute>:<shard>}}) rồi cộng, hoặc dùng local aggregation + đẩy định kỳ cho merchant rất lớn; gộp thao tác Redis bằng Lua/pipeline để giảm round-trip. (2) Phân tầng quyết định khi quá tải: nếu timeout, áp dụng rule nhẹ (số tiền nhỏ + thiết bị quen + người nhận quen → APPROVE có giám sát hậu kiểm), số tiền lớn/người nhận mới → CHALLENGE; tránh CHALLENGE đồng loạt. (3) Đặt ngân sách thời gian từng bước (đọc feature 15 ms, rule 5 ms, model 20 ms) và circuit breaker cho Redis chậm. (4) Theo dõi {{fraud_fallback_total}} và drill-down theo lý do để phát hiện fallback thành "chính sách mặc định".

Kết quả đo được: Sau tối ưu key và ngân sách thời gian, p99 fraud check giảm về 55–70 ms ở ~1.800 TPS, tỉ lệ timeout/fallback giảm mạnh và CHALLENGE quay về ~7%. Không ghi nhận tăng chargeback bất thường trong 7 ngày sau nhờ vẫn giữ step-up cho giao dịch rủi ro cao.

### Trả lời mẫu khi phỏng vấn
"Em sẽ thiết kế phát hiện gian lận thời gian thực tách hai đường. Đường đồng bộ nằm trong luồng thanh toán, có ngân sách khoảng 100 ms: đọc feature đã tính sẵn từ Redis, chạy rule engine để bắt các luật rõ ràng, rồi cho model chấm điểm và kết hợp ra quyết định APPROVE, CHALLENGE hoặc DECLINE kèm lý do. Đường bất đồng bộ dùng Kafka và stream processing như Flink để tính velocity theo cửa sổ thời gian, cập nhật feature store, phát hiện mẫu phức tạp và đưa case cho analyst; nhãn chargeback quay lại để huấn luyện. Điểm quan trọng là velocity của chính giao dịch hiện tại phải tính đồng bộ, vì Flink trễ vài giây sẽ lọt đợt bắn giao dịch nhanh. Trade-off là giữa tỉ lệ bắt gian lận và tỉ lệ chặn nhầm; rule mới em cho chạy shadow mode trước khi bật. Khi service chậm hoặc chết, em dùng chính sách dự phòng theo ngữ cảnh, ví dụ số tiền lớn hoặc người nhận mới thì step-up, và luôn ghi lại để hậu kiểm. Em cũng chú ý training-serving skew: feature lúc huấn luyện và lúc phục vụ phải cùng định nghĩa."

> Senior tip: ở ngân hàng, trận chiến lớn nhất hiện nay là lừa đảo khách tự chuyển tiền (social engineering), không phải thẻ bị đánh cắp: chính chủ, đúng thiết bị, đúng OTP. Feature thật sự hữu ích là về **người nhận** (tài khoản mới mở, nhận tiền từ nhiều nạn nhân) và hành vi bất thường như đang trong cuộc gọi. Hãy đưa ví dụ này vào câu trả lời, interviewer ngân hàng sẽ đánh giá cao.`,
  follow: [
    'Làm sao backtest một rule mới trên dữ liệu 6 tháng trước khi bật?',
    'Model cho điểm tốt khi huấn luyện nhưng kém trên production: bạn kiểm tra những gì?',
    'Thiết kế phát hiện tài khoản "money mule" nhận tiền từ nhiều nạn nhân như thế nào?'
  ],
  tags: ['fraud detection', 'streaming', 'feature store', 'rule engine', 'Flink', 'Redis']
},
{
  id: 'design-021',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế OTP/2FA service cho ngân hàng: sinh, lưu, hết hạn, chống brute force và gửi SMS qua nhiều nhà mạng có dự phòng. Ngoài SMS OTP còn lựa chọn nào an toàn hơn?',
  a: `**Tóm tắt:** OTP 6 chữ số sinh bằng {{SecureRandom}}, **chỉ lưu HMAC của OTP** trong Redis với TTL ngắn (2–5 phút), gắn chặt với mục đích và ngữ cảnh giao dịch. Xác minh bằng một thao tác nguyên tử (Lua) vừa so sánh, vừa đếm số lần sai, vừa xoá khi đúng để không dùng lại được. Giới hạn số lần thử, số lần gửi lại, và gửi qua nhiều SMS provider có failover dựa trên delivery report. SMS OTP dễ bị SIM swap và đánh cắp qua lừa đảo, nên với giao dịch giá trị lớn, ngân hàng dùng Smart OTP (TOTP trong app gắn thiết bị) hoặc sinh trắc học.

### Yêu cầu
- Mục đích: đăng nhập thiết bị mới, xác nhận giao dịch, đổi thông tin bảo mật.
- Quy mô giả định: 2 triệu OTP/ngày → ~23/s trung bình, cao điểm vài trăm/s. Tải không lớn; thứ quan trọng là **bảo mật và tỉ lệ SMS đến nơi**.
- OTP dùng một lần, hết hạn nhanh, không thể đem OTP của giao dịch A dùng cho giao dịch B.

### API
~~~text
POST /otp/challenges   {purpose, userId, context:{txnId, amount, beneficiary}} -> challengeId
POST /otp/verify       {challengeId, code} -> OK | WRONG(còn n lần) | EXPIRED | LOCKED
~~~

### Sinh và lưu
- {{SecureRandom}}, không dùng {{Random}} hay {{Math.random}} (đoán được).
- Lưu {{HMAC-SHA256(serverKey, challengeId + code)}} chứ không lưu code thô: lộ dump Redis hoặc log cũng không lộ OTP đang hiệu lực.
- Key Redis: {{otp:<challengeId>}} là một hash gồm h (HMAC), n (số lần thử), bản tóm tắt ngữ cảnh giao dịch; TTL 3 phút.
- Nội dung SMS ghi rõ hành động: "OTP xác nhận chuyển 5.000.000đ tới ...123. Không cung cấp OTP cho bất kỳ ai". Khách đọc được mình đang xác nhận gì là lớp chống lừa đảo rẻ nhất.

### Xác minh nguyên tử
~~~text
-- KEYS[1] = otp:<challengeId>, ARGV[1] = HMAC của code người dùng nhập, ARGV[2] = số lần tối đa
local h = redis.call('HGET', KEYS[1], 'h')
if not h then return -1 end                      -- hết hạn hoặc đã dùng
local n = redis.call('HINCRBY', KEYS[1], 'n', 1)
if n > tonumber(ARGV[2]) then redis.call('DEL', KEYS[1]) return -2 end   -- khoá
if h == ARGV[1] then redis.call('DEL', KEYS[1]) return 1 end            -- đúng: xoá, không dùng lại
return 0                                          -- sai, còn lượt
~~~
Vì sao phải nguyên tử: nếu đọc rồi mới so sánh và xoá ở Java, hai request song song cùng một code đúng có thể cùng thành công (dùng OTP hai lần), hoặc kẻ tấn công gửi song song nhiều đoán mà bộ đếm không kịp tăng.

### Chống brute force: làm phép tính
OTP 6 số có 10^6 khả năng. Cho phép 5 lần thử mỗi OTP → xác suất đoán trúng 5 / 1.000.000 = 0,0005%. Nếu giới hạn tối đa 10 OTP/ngày cho một tài khoản thì xác suất ngày ≈ 50 / 1.000.000 = 0,005%. Thiếu giới hạn số lần gửi lại, kẻ tấn công chỉ việc xin OTP mới liên tục và con số này mất ý nghĩa. Vì vậy cần:
- Giới hạn thử theo OTP, giới hạn gửi theo user, theo số điện thoại, theo IP/thiết bị; cooldown 60 s giữa hai lần gửi.
- Không khoá cứng tài khoản chỉ dựa trên request chưa xác thực (dễ bị DoS); áp dụng cooldown/rate limit, step-up challenge và quy trình khóa có tín hiệu rủi ro phù hợp, đồng thời thông báo cho chủ tài khoản.
- Chống **SMS pumping**: kẻ gian dùng form gửi OTP để bắn SMS tới số quốc tế giá cao, chia doanh thu với nhà mạng. Chặn đầu số quốc tế không cần thiết, CAPTCHA cho luồng không cần đăng nhập.

### Gửi SMS nhiều nhà cung cấp
~~~text
OTP Service -> Kafka topic sms.otp (ưu tiên cao, tách khỏi SMS marketing)
                  |
            SMS Router: chọn provider theo nhà mạng của số + tỉ lệ thành công gần đây
                  |-- Provider A (brandname)   --DLR-->
                  |-- Provider B (dự phòng)    --DLR-->
            Không nhận DLR thành công sau ~20 s -> gửi lại qua provider khác (CÙNG OTP)
~~~
- Gửi lại phải dùng **cùng mã** trong cùng challenge, nếu không khách nhận 2 mã khác nhau và nhập nhầm.
- Theo dõi tỉ lệ giao thành công và độ trễ theo provider/nhà mạng; circuit breaker khi một provider xuống.

### Phương án mạnh hơn SMS
| Phương thức | Ưu | Nhược |
|---|---|---|
| SMS OTP | Ai cũng dùng được | SIM swap, bị lừa đọc OTP, phụ thuộc nhà mạng, tốn tiền |
| TOTP (RFC 6238) / Smart OTP trong app | Không qua mạng, rẻ, gắn với thiết bị đã đăng ký | Mất máy cần quy trình kích hoạt lại an toàn |
| Push xác nhận trong app | UX tốt, hiển thị ngữ cảnh giao dịch | Cần chống bấm đồng ý theo phản xạ |
| Sinh trắc học (khuôn mặt) đối chiếu dữ liệu CCCD | Khó mạo danh | Chi phí, quy trình eKYC |

Ở Việt Nam, giao dịch chuyển tiền giá trị lớn hiện phải xác thực sinh trắc học theo quy định của NHNN; SMS OTP ngày càng chỉ còn vai trò phụ.

### Ví dụ đời thực
Triệu chứng: Ứng dụng ngân hàng ghi nhận nhiều khiếu nại "không nhận được OTP" vào 11:45–12:00 (giờ cao điểm), tỉ lệ giao dịch bị huỷ ở bước xác nhận tăng 15%. Cùng lúc, tổng chi phí SMS tăng đột biến và có dấu hiệu nhiều request gửi OTP lặp lại trong thời gian ngắn.

Điều tra: Xem metric theo provider/nhà mạng: {{sms_send_latency_p95}}, {{sms_delivery_success_rate}}, {{sms_dlr_timeout_total}} (DLR là delivery report - báo cáo nhà mạng cho biết SMS đã gửi tới máy hay chưa), và {{otp_verify_fail_rate}}. Log OTP Service cho thấy số challenge tạo ra tăng cao nhưng tỉ lệ verify không tăng tương ứng. SMS Router cho provider A có DLR chậm/timeout với một nhà mạng lớn; logic gửi lại đang tạo challenge/OTP mới mỗi lần bấm "Gửi lại" hoặc khi DLR timeout, dẫn tới khách nhận nhiều mã khác nhau.

Nguyên nhân gốc: Hai lỗi kết hợp: (1) failover dựa trên DLR nhưng khi provider chậm, hệ thống phát sinh thêm yêu cầu gửi và đôi khi tạo OTP mới thay vì dùng lại cùng challenge; (2) kiểm soát gửi lại/cooldown chưa đủ chặt theo user/số điện thoại/thiết bị, nên người dùng bấm lặp và hệ thống cũng tự bắn thêm, gây nghẽn và nhầm mã. Ngoài ra có một luồng nhập số điện thoại chưa đăng nhập thiếu rate limit mạnh, làm tăng nguy cơ SMS pumping.

Cách xử lý: (1) Đảm bảo "gửi lại dùng cùng mã trong cùng challenge" trong TTL; cooldown 60 giây cho nút gửi lại; chỉ tạo challenge mới khi OTP hết hạn hoặc người dùng đổi ngữ cảnh giao dịch. (2) SMS Router: nếu không nhận DLR thành công sau 20 giây, gửi lại **cùng nội dung OTP** qua provider B; circuit breaker khi provider/nhà mạng lỗi; theo dõi DLR theo từng tuyến. (3) Chống lạm dụng: rate limit theo user, số điện thoại, IP/thiết bị, CAPTCHA cho luồng công khai, chặn đầu số quốc tế không cần; cảnh báo khi {{otp_send_rate}} hoặc chi phí SMS tăng bất thường. (4) Vẫn giữ xác minh nguyên tử bằng Lua để không dùng lại OTP và đếm sai chính xác.

Kết quả đo được: Sau 1 tuần, tỉ lệ giao SMS thành công trong 30 giây tăng trở lại mức > 97% cho nhà mạng bị ảnh hưởng, khiếu nại "không nhận OTP" giảm ~60%, và chi phí SMS giảm ~25% nhờ bớt gửi trùng/mã mới không cần thiết. Tỉ lệ nhập sai do nhiều mã cũng giảm rõ.

### Trả lời mẫu khi phỏng vấn
"Khi thiết kế OTP/2FA cho ngân hàng, em tập trung vào ba việc: sinh mã an toàn, xác minh nguyên tử và gửi được tin trong điều kiện nhà mạng không ổn định. OTP 6 số được sinh bằng SecureRandom, chỉ lưu HMAC của OTP trong Redis với TTL 2 đến 5 phút và gắn với ngữ cảnh giao dịch như mã giao dịch, số tiền, người nhận. Xác minh em dùng Lua script để vừa so sánh, vừa tăng số lần sai, vừa xoá OTP khi đúng trong một thao tác nguyên tử, nên không thể dùng lại mã và không bị race khi gửi song song. Em giới hạn số lần thử mỗi OTP, cooldown gửi lại, rate limit theo user, số điện thoại, IP và có biện pháp chống SMS pumping. Với SMS, em dùng Kafka tách luồng OTP, router nhiều provider có failover dựa trên delivery report, nhưng gửi lại phải dùng cùng mã trong cùng challenge. Trade-off là SMS OTP tiện nhưng yếu trước SIM swap và lừa đảo, nên với giao dịch giá trị lớn em ưu tiên Smart OTP hoặc sinh trắc học theo đúng nghiệp vụ ngân hàng."

> Senior tip: lỗ hổng OTP trong thực tế hiếm khi là thuật toán sinh mã mà là **luồng nghiệp vụ**: endpoint xác minh không giới hạn số lần, OTP không gắn với giao dịch (dùng OTP đăng nhập để chuyển tiền), hoặc mã OTP lọt vào log ứng dụng. Khi review, tôi grep log của service OTP trước tiên.`,
  follow: [
    'Triển khai TOTP trong app: thiết bị mới kích hoạt Smart OTP thế nào để kẻ gian không chiếm được?',
    'Một nhà mạng gửi SMS chậm 2 phút trong giờ cao điểm: hệ thống của bạn phát hiện và phản ứng ra sao?',
    'Làm sao chống tấn công dò OTP phân tán từ hàng nghìn IP khác nhau?'
  ],
  tags: ['OTP', '2FA', 'TOTP', 'SMS', 'brute force', 'Redis', 'security']
,
  refs: [
    { type: 'doc', title: 'RFC 6238: TOTP', url: 'https://datatracker.ietf.org/doc/html/rfc6238' },
    { type: 'doc', title: 'RFC 4226: HOTP', url: 'https://datatracker.ietf.org/doc/html/rfc4226' },
    { type: 'doc', title: 'OWASP Multifactor Authentication Cheat Sheet', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html' },
  ]
},
{
  id: 'architecture-009',
  topic: 'architecture',
  level: 'mid',
  q: 'Viết Singleton thread-safe trong Java có những cách nào? Vì sao nhiều người coi Singleton là anti-pattern, và singleton scope của Spring khác gì Singleton của GoF?',
  a: `**Tóm tắt:** Cách gọn và an toàn nhất là **enum singleton** hoặc **holder idiom** (lazy, thread-safe nhờ cơ chế khởi tạo class của JVM). Double-checked locking chỉ đúng khi field là {{volatile}}. Singleton GoF bị chê vì nó là **global state ẩn**: phụ thuộc không lộ ra ở constructor, khó mock, khó test song song. Spring singleton thì khác: **một instance cho mỗi bean definition trong một ApplicationContext**, được inject qua constructor, nên giữ được lợi ích "một instance" mà không mang các nhược điểm trên. Và Spring singleton **không tự thread-safe**.

### Các cách viết
~~~java
// 1. Eager: đơn giản, khởi tạo khi class được nạp
public final class Eager {
    private static final Eager INSTANCE = new Eager();
    private Eager() {}
    public static Eager getInstance() { return INSTANCE; }
}

// 2. Holder idiom: lazy + thread-safe, không cần synchronized
public final class Config {
    private Config() {}
    private static class Holder { static final Config INSTANCE = new Config(); }
    public static Config getInstance() { return Holder.INSTANCE; } // Holder chỉ nạp khi gọi lần đầu
}

// 3. Double-checked locking: BẮT BUỘC volatile
public final class Dcl {
    private static volatile Dcl instance;
    public static Dcl getInstance() {
        Dcl local = instance;
        if (local == null) {
            synchronized (Dcl.class) {
                local = instance;
                if (local == null) instance = local = new Dcl();
            }
        }
        return local;
    }
}

// 4. Enum: chống cả reflection lẫn serialization tạo instance thứ hai
public enum IdGenerator { INSTANCE; public long next() { return 0L; } }
~~~

### Vì sao DCL cần volatile
{{new Dcl()}} gồm cấp phát bộ nhớ, chạy constructor, gán tham chiếu. Không có {{volatile}}, JIT/CPU được phép sắp xếp để gán tham chiếu **trước** khi constructor chạy xong. Thread khác thấy {{instance != null}} ở lần check đầu (ngoài khối synchronized) và dùng một object chưa khởi tạo xong. {{volatile}} tạo quan hệ happens-before giữa lần ghi và lần đọc, cấm việc này.

Holder idiom an toàn vì JLS đảm bảo khởi tạo class chỉ chạy một lần và có đồng bộ; class lồng {{Holder}} chỉ được khởi tạo khi {{getInstance}} truy cập nó.

### Phá Singleton
| Cách phá | Phòng |
|---|---|
| Reflection gọi constructor private | Ném exception trong constructor nếu đã có instance; hoặc dùng enum |
| Deserialize tạo object mới | Thêm {{readResolve}} trả về INSTANCE; enum tự xử lý |
| Nhiều classloader (app server, plugin) | Mỗi classloader có một "singleton" riêng; GoF không giải được |
| Clone | Không implement {{Cloneable}} |

### Vì sao bị coi là anti-pattern
- **Phụ thuộc ẩn:** {{PaymentService}} gọi {{AuditLogger.getInstance()}} bên trong; đọc constructor không biết nó cần logger.
- **Khó test:** không thay được bằng mock nếu không dùng mock static; trạng thái bên trong rò rỉ giữa các test, test song song chập chờn.
- **Global mutable state:** ai cũng sửa được, bug phụ thuộc thứ tự chạy.
- **Vòng đời cứng:** không đổi được cấu hình theo môi trường, không đóng tài nguyên gọn.

### Spring singleton khác gì
| | GoF Singleton | Spring singleton scope |
|---|---|---|
| Phạm vi | Một instance mỗi classloader | Một instance mỗi bean definition trong một context |
| Lấy instance | {{getInstance()}} static | Container inject qua constructor |
| Có thể có 2 instance cùng class | Không | Có, nếu khai báo 2 bean (ví dụ 2 DataSource) |
| Test | Khó thay thế | Truyền mock vào constructor |

### Câu trả lời sai phổ biến
- "Spring singleton nên thread-safe." Sai: Spring chỉ đảm bảo một instance; nếu bean có field mutable (đếm, cache {{HashMap}}, {{SimpleDateFormat}}) thì nhiều request đồng thời sẽ đụng nhau. Bean singleton nên stateless.
- "Inject prototype vào singleton thì mỗi lần gọi có object mới." Sai: chỉ inject một lần; cần {{ObjectProvider}} hoặc lookup method.
- "DCL không cần volatile vì đã synchronized." Sai như phân tích trên.

### Ví dụ đời thực
Triệu chứng: Một dịch vụ Spring Boot xử lý thanh toán dùng một lớp {{PaymentConfig.getInstance()}} kiểu Singleton GoF (lazy, tự {{new}} bên trong) để giữ cấu hình endpoint và secret của cổng thanh toán. Sau khi bật chạy test tích hợp song song (parallel test) và deploy thêm môi trường staging trên cùng cụm CI, đội QA gặp lỗi ngẫu nhiên: một số test staging gọi nhầm endpoint sandbox/production, và log đôi khi in thiếu/đúng cấu hình không ổn định. Trên production đơn lẻ thì ít thấy, nhưng khi thêm luồng tải bất thường có lúc cấu hình đọc ra null.

Điều tra: Kiểm tra code thấy {{PaymentConfig}} dùng lazy init không thread-safe đầy đủ (check-then-act không {{synchronized}}/{{volatile}} đúng) và có field mutable {{endpoint}}, {{secret}} bị ghi đè khi {{reload()}}. Trong môi trường test, nhiều thread khởi tạo context/test cùng lúc; với app server hoặc classloader khác nhau, có dấu hiệu nhiều bản nạp class dẫn tới hành vi khó đoán. Log khởi tạo cho thấy constructor {{PaymentConfig}} đôi khi chạy theo thứ tự không mong muốn. Thử viết test nhỏ tái hiện: nhiều thread gọi {{getInstance()}} và {{reload()}} → thấy giá trị đọc không nhất quán.

Nguyên nhân gốc: Singleton GoF tạo global mutable state: phụ thuộc ẩn (khó biết ai dùng), vòng đời gắn với classloader, và không thread-safe nếu tự viết sai. Việc {{reload()}} ghi đè field chia sẻ khiến request/thread khác đọc cấu hình giữa chừng. Trong test, không thể thay {{getInstance()}} bằng cấu hình giả một cách sạch.

Cách xử lý: (1) Sửa an toàn tối thiểu nếu buộc giữ: dùng holder idiom hoặc enum (nhưng vẫn không giải quyết global mutable state). (2) Cách đúng trong Spring: chuyển {{PaymentConfig}} thành bean quản lý bởi container, inject qua constructor; cấu hình lấy từ {{@ConfigurationProperties}} (immutable nếu có thể), reload bằng cơ chế có kiểm soát (refresh scope/cấu hình tập trung) thay vì ghi trực tiếp static field. (3) Tách secret ra secret manager/vault; không giữ secret trong object chia sẻ tự do. (4) Thêm test: inject mock config trong unit test; test tích hợp chạy theo profile rõ ràng.

Kết quả đo được: Sau khi chuyển sang bean cấu hình immutable inject qua constructor, lỗi gọi nhầm endpoint trong test song song biến mất, test tích hợp chạy ổn định và thời gian debug cấu hình giảm. Việc review bảo mật cũng dễ hơn vì đường đi của secret rõ ràng.

### Trả lời mẫu khi phỏng vấn
"Trong Java, em thường dùng enum singleton hoặc holder idiom vì gọn và thread-safe nhờ cơ chế khởi tạo class của JVM; double-checked locking chỉ đúng khi field là volatile, nếu không thread khác có thể thấy object chưa khởi tạo xong. Nhưng trong code nghiệp vụ Spring, em hầu như không tự viết Singleton GoF vì nó tạo global state ẩn, khó mock, khó test và phụ thuộc bị giấu sau getInstance. Spring singleton khác: nó là một instance cho mỗi bean definition trong một ApplicationContext, được inject qua constructor nên phụ thuộc lộ rõ và dễ thay bằng mock. Trade-off là Spring chỉ quản lý vòng đời và số lượng instance, chứ không tự làm bean thread-safe; bean singleton có state mutable như SimpleDateFormat hay HashMap vẫn có thể lỗi race condition. Em từng gặp lỗi cấu hình ngẫu nhiên do static singleton bị nhiều thread ghi đè, và cách sửa là chuyển sang bean cấu hình immutable inject qua constructor."

> Senior tip: trong code nghiệp vụ dùng Spring, gần như không có lý do viết {{getInstance()}}. Khi review thấy static singleton giữ cache hay config, tôi yêu cầu chuyển thành bean. Ngoại lệ hợp lý là thứ không phụ thuộc gì và không có state, ví dụ một mapper hay comparator dùng chung.`,
  follow: [
    'Holder idiom và enum singleton: khi nào bạn chọn cái nào?',
    'Một bean singleton có field SimpleDateFormat gây lỗi ngày tháng ngẫu nhiên trên production. Giải thích và sửa.',
    'Làm sao lấy instance mới của prototype bean mỗi lần gọi từ một singleton bean?'
  ],
  tags: ['Singleton', 'design pattern', 'volatile', 'Spring scope', 'thread-safety']
},
{
  id: 'architecture-010',
  topic: 'architecture',
  level: 'mid',
  q: 'Phân biệt Simple Factory, Factory Method và Abstract Factory bằng ví dụ tích hợp nhiều cổng thanh toán (VNPay, MoMo, thẻ quốc tế). Trong Spring, bạn còn cần tự viết factory không?',
  a: `**Tóm tắt:** **Simple Factory** là một hàm (thường static) chọn class để {{new}} dựa vào tham số; không phải pattern GoF. **Factory Method** là một method trừu tượng trong lớp cha, lớp con quyết định tạo object nào, còn lớp cha dùng object đó trong thuật toán chung. **Abstract Factory** là một interface tạo ra **một họ object liên quan** phải dùng cùng nhau (client + signer + parser của cùng một đối tác). Trong Spring, phần lớn việc "chọn implementation" làm bằng inject {{Map}}/{{List}} bean; tự viết factory chỉ cần khi object được tạo theo tham số runtime.

### Simple Factory
~~~java
public final class PaymentClients {
    public static PaymentClient of(Provider p) {
        return switch (p) {                    // switch expression (Java 14+): compiler báo lỗi nếu enum thêm giá trị mà thiếu nhánh
            case VNPAY -> new VnpayClient();
            case MOMO  -> new MomoClient();
            case CARD  -> new CardClient();
        };
    }
}
~~~
Đủ dùng khi tập lựa chọn nhỏ và ổn định. Nhược: thêm provider phải sửa hàm này.

### Factory Method
Lớp cha nắm quy trình, để lớp con quyết định "tạo cái gì":
~~~java
public abstract class StatementImporter {
    public final ImportResult importFile(Path file) {   // thuật toán chung, không cho override
        StatementParser parser = createParser();          // factory method
        List<Txn> txns = parser.parse(file);
        validate(txns);
        return save(txns);
    }
    protected abstract StatementParser createParser();    // lớp con chọn parser
}

class VcbImporter extends StatementImporter {
    protected StatementParser createParser() { return new CsvStatementParser(";"); }
}
class NapasImporter extends StatementImporter {
    protected StatementParser createParser() { return new FixedWidthParser(); }
}
~~~
Factory Method thường đi kèm Template Method. Ví dụ trong JDK: {{Collection.iterator()}}; mỗi collection trả về iterator của riêng nó.

### Abstract Factory
Mỗi đối tác có **bộ** thành phần phải khớp nhau: client HTTP, cách ký request, cách parse callback. Trộn signer của VNPay với parser của MoMo là bug.
~~~java
public interface PaymentKit {                 // một "họ" sản phẩm
    PaymentClient client();
    RequestSigner signer();
    CallbackParser callbackParser();
}
@Component("VNPAY") class VnpayKit implements PaymentKit { /* trả về 3 object của VNPay */ }
@Component("MOMO")  class MomoKit  implements PaymentKit { /* trả về 3 object của MoMo */ }
~~~
Ví dụ JDK: {{DocumentBuilderFactory}}, {{XMLInputFactory}}.

### So sánh
| | Simple Factory | Factory Method | Abstract Factory |
|---|---|---|---|
| Hình thức | Một hàm chọn class | Method abstract, override ở lớp con | Interface với nhiều method tạo |
| Cơ chế mở rộng | Sửa hàm | Kế thừa | Thêm implementation của interface |
| Tạo ra | Một object | Một object trong một quy trình | Một họ object nhất quán |
| GoF | Không | Có | Có |

### Trong Spring
- Container chính là một factory khổng lồ; {{@Bean}} method thực chất là factory method.
- Chọn theo key lúc runtime: inject {{Map<String, PaymentKit>}} (key = tên bean) rồi tra cứu, không cần switch.
- {{FactoryBean}} dùng khi việc tạo bean phức tạp (ví dụ các {{*FactoryBean}} của Spring tạo proxy, client).
- Vẫn cần factory tự viết khi object phụ thuộc **tham số runtime** (ví dụ tạo {{RetryPolicy}} theo cấu hình của từng merchant đọc từ DB): một bean factory nhận tham số và trả object mới.

### Câu trả lời sai phổ biến
- Gọi mọi static method {{of}}/{{valueOf}} là "Factory Method pattern". Đó là static factory method (Effective Java), không phải pattern GoF.
- Mô tả Abstract Factory là "factory tạo ra factory". Điểm cốt lõi là **họ object nhất quán**, không phải số tầng.
- Viết factory + interface cho thứ chỉ có một implementation: thêm lớp vô ích.

### Ví dụ đời thực

Dự án thanh toán tích hợp VNPay, MoMo và thẻ quốc tế; mỗi đối tác có client HTTP, cách ký và parse callback khác nhau.

Triệu chứng: sau khi deploy thêm MoMo, giao dịch VNPay cũ bị lỗi "UnsupportedOperationException", thất toán khoảng 5% trong 30 phút.

Điều tra: team dùng Simple Factory, một hàm static switch theo enum. Dev sửa hàm này để thêm case MOMO nhưng vô tình xóa nhánh VNPay khi merge. Không có test riêng cho từng đối tác, nên lỗi chỉ lộ ra trên production sau deploy.

Nguyên nhân gốc: Simple Factory vi phạm nguyên lý mở-đóng — thêm đối tác phải sửa code cũ, dễ làm hỏng đối tác đã ổn định. Client, signer, parser của mỗi đối tác bị trộn lẫn trong cùng một class.

Cách xử lý: quay về commit trước để khôi phục, rồi refactor sang Abstract Factory: interface {{PaymentKit}} với {{client()}}, {{signer()}}, {{callbackParser()}}; mỗi đối tác một implementation. Inject {{Map<String, PaymentKit>}} vào service, tra cứu theo mã đối tác runtime.

Kết quả: thêm đối tác mới chỉ thêm package mới, không đụng code cũ. Thời gian đưa đối tác mới lên production giảm từ mấy ngày xuống mấy giờ, không còn downgrade giao dịch cũ khi triển khai.

### Trả lời mẫu khi phỏng vấn

"Simple Factory là một hàm tĩnh chọn class theo tham số, nhưng không phải pattern GoF vì thêm đối tác mới lại phải sửa hàm cũ. Factory Method để lớp cha giữ quy trình chung, lớp con quyết định tạo object nào — ví dụ importer ngân hàng chọn parser CSV hay fixed-width. Abstract Factory tạo một họ object nhất quán: client, signer và parser của cùng một đối tác, tránh việc trộn signer của VNPay với parser của MoMo. Trong Spring tôi inject {{Map<String, PaymentKit>}} và tra cứu theo mã đối tác runtime, chỉ viết factory tự tạo khi object phụ thuộc tham số đọc từ DB. Khi nào dùng cái nào: Simple Factory cho tập lựa chọn nhỏ ổn định, Factory Method khi thuật toán chung cố định nhưng tạo object thay đổi, Abstract Factory khi nhiều thành phần phải khớp nhau như một họ. Thực tế, khi thêm đối tác mới tôi tạo package riêng và dùng test kiến trúc để chặn package của đối tác này import package của đối tác khác, giúp triển khai an toàn mà không làm hỏng giao dịch cũ."

> Senior tip: khi tích hợp đối tác, Abstract Factory (hay "kit" theo đối tác) đáng giá nhất ở chỗ gom mọi thứ của một đối tác vào một package; thêm đối tác mới là thêm một package, không đụng code cũ. Tôi dùng test kiến trúc để đảm bảo package của đối tác này không import package của đối tác khác.`,
  follow: [
    'Khi nào bạn chọn Factory Method (kế thừa) thay vì truyền Strategy qua constructor?',
    'Inject Map<String, Bean> trong Spring: key lấy từ đâu và xử lý khi key không tồn tại thế nào?',
    'Cho ví dụ FactoryBean trong Spring và khi nào bạn tự viết một FactoryBean.'
  ],
  tags: ['Factory Method', 'Abstract Factory', 'design pattern', 'Spring', 'payment']
},
{
  id: 'architecture-011',
  topic: 'architecture',
  level: 'mid',
  q: 'Khi nào bạn dùng Builder pattern? Team dùng Lombok @Builder khắp nơi, kể cả trên JPA entity. Những pitfall nào bạn sẽ chỉ ra khi review?',
  a: `**Tóm tắt:** Builder hợp khi object có **nhiều tham số, nhiều tham số tuỳ chọn** và nên **immutable**: thay cho telescoping constructor và tránh nhầm thứ tự tham số cùng kiểu. Lombok {{@Builder}} tiện nhưng có bẫy: bỏ qua giá trị khởi tạo mặc định của field (cần {{@Builder.Default}}), không kiểm tra field bắt buộc, phá constructor không tham số mà JPA cần, {{toBuilder}} copy nông, và không xử lý kế thừa. Với DTO đơn giản, Java {{record}} thường là lựa chọn tốt hơn.

### Vấn đề Builder giải quyết
~~~java
// Telescoping constructor: 4 tham số String liên tiếp, đổi chỗ fromAcc/toAcc compiler không phát hiện
new TransferRequest("0011001", "0022002", "VND", "Chuyen tien", amount, true, false);

// Builder: tự mô tả, tham số tuỳ chọn có thể bỏ qua
TransferRequest.builder()
    .fromAccount("0011001").toAccount("0022002")
    .amount(amount).currency("VND")
    .note("Chuyen tien")
    .build();
~~~

### Pitfall của Lombok @Builder
**1. Giá trị mặc định bị bỏ qua**
~~~java
@Builder
public class Order {
    private String status = "NEW";              // builder KHÔNG dùng giá trị này -> status = null
    @Builder.Default
    private List<Item> items = new ArrayList<>(); // phải có @Builder.Default mới giữ mặc định
}
~~~
Đây là bug NPE kinh điển; Lombok có cảnh báo lúc compile nhưng nhiều team bỏ qua warning.

**2. Không kiểm tra field bắt buộc.** {{build()}} vui vẻ tạo object thiếu {{amount}}. Đặt validation trong constructor (Lombok gọi constructor all-args) hoặc dùng record với compact constructor:
~~~java
@Builder
public record TransferCommand(String fromAccount, String toAccount, BigDecimal amount, String note) {
    public TransferCommand {                              // compact constructor: chạy với mọi cách tạo
        Objects.requireNonNull(fromAccount, "fromAccount");
        if (amount == null || amount.signum() <= 0) throw new IllegalArgumentException("amount > 0");
    }
}
~~~

**3. @Builder trên JPA entity.** Nếu class không có constructor nào, {{@Builder}} sinh constructor all-args và class **mất constructor không tham số** mà JPA/Hibernate cần. Thêm {{@NoArgsConstructor(access = AccessLevel.PROTECTED)}} và {{@AllArgsConstructor}} sẽ chạy được, nhưng vấn đề lớn hơn là builder cho phép tạo entity ở trạng thái không hợp lệ và set cả {{id}}, {{version}}. Với entity, tôi thích **static factory method có tên nghiệp vụ** ({{Account.open(...)}}) giữ invariant.

**4. @Builder + @Data.** {{@Data}} sinh setter, nên object vẫn mutable; builder không còn ý nghĩa immutable. Dùng {{@Value}} hoặc record.

**5. toBuilder copy nông.** {{order.toBuilder().build()}} chia sẻ cùng {{List}} với object gốc; sửa list của bản sao làm đổi bản gốc. Dùng {{@Singular}} cho collection (Lombok tạo list immutable) hoặc copy phòng thủ trong constructor.

**6. Kế thừa.** {{@Builder}} không biết field của lớp cha; cần {{@SuperBuilder}} trên cả cha và con, và hai annotation không trộn được.

**7. Jackson.** Deserialize object chỉ có builder cần {{@Jacksonized}} cùng {{@Builder}}, nếu không Jackson không biết tạo object.

### Khi nào KHÔNG dùng Builder
- Object 2–3 field: constructor hoặc static factory rõ hơn.
- DTO bất biến nhỏ: {{record}} đã có constructor, equals, hashCode, toString.
- Object có invariant phức tạp giữa các field: factory method có tên nghiệp vụ diễn đạt ý định tốt hơn builder "set gì cũng được".

### Câu trả lời sai phổ biến
- "Builder giúp code nhanh hơn." Không; nó tạo thêm object builder, chỉ giúp đọc và an toàn hơn.
- "Lombok @Builder thì object immutable." Chỉ khi field final và không có setter.

### Ví dụ đời thực

Dịch vụ đơn hàng dùng Lombok @Builder cho class Order với field status = "NEW" mặc định.

Triệu chứng: sau khi thêm field status, đơn hàng mới tạo có status null, downstream xử lý đơn bị NPE khoảng 2% đơn, ảnh hưởng tạo đơn trong giờ cao điểm.

Điều tra: log NPE trỏ đến lần đọc status, xem mã nguồn thấy @Builder sinh constructor all-args và không dùng giá trị khởi tạo của field, nên status = null.

Nguyên nhân gốc: @Builder bỏ qua giá trị mặc định của field, cần @Builder.Default mới giữ nguyên. Ngoài ra @Builder không validate field bắt buộc (amount) và đối với JPA entity mất constructor không tham số mà Hibernate cần.

Cách xử lý: thêm @Builder.Default cho danh sách mục, dùng record với compact constructor để validate amount > 0, thêm {{@NoArgsConstructor(access = AccessLevel.PROTECTED)}} + {{@AllArgsConstructor}} cho entity, tránh kết hợp @Builder với @Data (đối tượng vẫn mutable).

Kết quả: giảm NPE liên quan status đơn hàng, validation lỗi sớm lúc khởi tạo object, entity không bị set id/version qua builder, số lỗi severity cao liên quan đơn hàng giảm về 0 trong tháng sau.

### Trả lời mẫu khi phỏng vấn

"Builder hợp khi object có nhiều tham số, nhiều tham số tuỳ chọn và nên immutable, giúp tránh telescoping constructor và nhầm thứ tự tham số cùng kiểu. Lombok @Builder tiện nhưng có bẫy: bỏ qua giá trị mặc định của field nếu thiếu @Builder.Default, không kiểm tra field bắt buộc, phá constructor không tham số mà JPA cần, toBuilder copy nông, và không hỗ trợ kế thừa (cần @SuperBuilder trên cả cha và con). Với DTO đơn giản tôi dùng record. Với entity tôi thích static factory method có tên nghiệp vụ để giữ invariant. Khi review, tôi tìm @Builder đi cùng @Data hoặc @Entity trước, đó là hai tổ hợp sinh bug nhiều nhất. Record không thay thế hoàn toàn Builder khi object có nhiều tham số tuỳ chọn và cần hàm rõ ràng, vì record bắt buộc cung cấp đủ trường trong constructor. Trong thực tế tôi bắt đầu từ record, chỉ chọn Builder khi object thật sự có nhiều tham số tuỳ chọn cần hàm gán rõ ràng, và luôn validate bắt buộc ngay trong compact constructor."

> Senior tip: khi review, tôi tìm {{@Builder}} đi cùng {{@Data}} hoặc {{@Entity}} trước tiên; đó là hai tổ hợp sinh bug nhiều nhất. Quy ước tốt cho team: record cho DTO, factory method có tên cho entity, Builder cho object cấu hình nhiều tham số tuỳ chọn.`,
  follow: [
    'Record trong Java 17 có thay thế hoàn toàn Builder được không? Khi nào vẫn cần Builder?',
    'Bạn xử lý field bắt buộc trong builder thế nào để lỗi lộ ra lúc compile thay vì runtime (step builder)?',
    'Vì sao JPA cần constructor không tham số và Hibernate dùng nó vào lúc nào?'
  ],
  tags: ['Builder', 'Lombok', 'record', 'JPA', 'immutability']
},
{
  id: 'architecture-012',
  topic: 'architecture',
  level: 'senior',
  q: 'Proxy pattern là gì và Spring dùng nó thế nào cho @Transactional, @Async, @Cacheable, @Lazy? Vì sao gọi một method @Transactional từ chính class đó lại không có transaction?',
  a: `**Tóm tắt:** Proxy là object đứng trước object thật, **cùng interface**, chặn lời gọi để thêm hành vi (mở transaction, chạy async, đọc cache, khởi tạo trễ) rồi chuyển tiếp. Spring tạo proxy lúc khởi tạo bean (BeanPostProcessor), dùng **JDK dynamic proxy** khi theo interface hoặc **CGLIB subclass** (mặc định trong Spring Boot). Vì proxy nằm **bên ngoài** object, lời gọi {{this.method()}} bên trong class đi thẳng vào object thật, bỏ qua proxy, nên annotation không có hiệu lực.

### Proxy viết tay để hiểu cơ chế
~~~java
public interface TransferService { void transfer(String from, String to, BigDecimal amt); }

TransferService target = new TransferServiceImpl();
TransferService proxy = (TransferService) Proxy.newProxyInstance(
    TransferService.class.getClassLoader(),
    new Class<?>[] { TransferService.class },
    (p, method, args) -> {
        long start = System.nanoTime();
        try {
            return method.invoke(target, args);           // gọi object thật
        } finally {
            log.info("{} took {} us", method.getName(), (System.nanoTime() - start) / 1000);
        }
    });
~~~
{{@Transactional}} cũng vậy: interceptor mở transaction trước {{invoke}}, commit nếu thành công, rollback nếu có RuntimeException (mặc định), rồi trả kết quả.

### Spring dùng proxy ở đâu
| Tính năng | Proxy làm gì |
|---|---|
| {{@Transactional}} | TransactionInterceptor: begin, commit/rollback |
| {{@Async}} | Đẩy lời gọi sang executor, trả về ngay |
| {{@Cacheable}} | Tra cache theo key; hit thì không gọi method |
| {{@Lazy}} tại điểm inject | Inject proxy; bean thật chỉ tạo ở lần gọi đầu |
| {{@Configuration}} | Class được CGLIB enhance để gọi {{@Bean}} method nhiều lần vẫn trả về cùng singleton |
| Spring Data repository | Interface không có class implement; proxy sinh query |
| Hibernate lazy loading | {{getReferenceById}} và quan hệ LAZY trả về proxy, truy cập mới query |

### JDK proxy và CGLIB
| | JDK dynamic proxy | CGLIB |
|---|---|---|
| Cách làm | Implement interface | Sinh subclass của class |
| Yêu cầu | Bean có interface | Class và method không {{final}} |
| Inject theo class impl | Lỗi (proxy không phải kiểu đó) | Được |
Spring Boot mặc định {{spring.aop.proxy-target-class=true}} nên dùng CGLIB kể cả khi có interface, tránh lỗi inject theo class.

### Self-invocation
~~~java
@Service
public class StatementService {
    public void importAll(List<File> files) {
        for (File f : files) importOne(f);    // this.importOne -> KHÔNG qua proxy, không có transaction riêng
    }
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void importOne(File f) { ... }
}
~~~
Cách sửa, theo thứ tự ưu tiên:
1. Tách {{importOne}} sang bean khác (thường là thiết kế tốt hơn).
2. Dùng {{TransactionTemplate}} để quản lý transaction bằng code, rõ ràng.
3. Tự inject chính mình qua {{@Lazy}} hoặc {{ObjectProvider}} (chạy được nhưng khó đọc).
4. AspectJ weaving (compile/load time) không dùng proxy nên không có vấn đề này, nhưng tăng độ phức tạp build.

### Các bẫy khác cùng gốc
- Method {{private}} không bao giờ được proxy chặn. Từ Spring 6, với proxy kiểu class, method protected/package-private cũng được hỗ trợ cho {{@Transactional}}, nhưng public vẫn là cách an toàn nhất.
- Method {{final}} (hoặc class final, ví dụ Kotlin mặc định) thì CGLIB không override được: annotation im lặng không chạy.
- Gọi method trong constructor hoặc {{@PostConstruct}}: lúc đó proxy chưa bọc hoặc đang gọi trên object thật.
- {{new MyService()}} thủ công: không phải bean, không có proxy.

### Câu trả lời sai phổ biến
- "Spring sửa bytecode class của tôi để thêm transaction." Không, mặc định là proxy bọc bên ngoài (trừ khi cấu hình AspectJ).
- "Đánh {{@Transactional}} lên private method cũng được." Không có tác dụng và không báo lỗi.

### Ví dụ đời thực

Dịch vụ nhập chỉnh lệnh giao dịch batch, method importAll gọi importOne có @Transactional(propagation = REQUIRES_NEW).

Triệu chứng: một file bị lỗi làm rollback toàn bộ batch thay vì chỉ file đó, thời gian xử lý batch 10.000 lệnh tăng từ 5 phút lên 30 phút sau khi deploy.

Điều tra: đặt breakpoint, xem class bean được inject có hậu tố $$SpringCGLIB$$, thấy importAll gọi this.importOne() trực tiếp bên trong class, bỏ qua proxy.

Nguyên nhân gốc: self-invocation. Proxy nằm bên ngoài object thật, lời gọi this.method() không qua proxy nên annotation @Transactional không có hiệu lực, tất cả chạy trong cùng transaction.

Cách xử lý: tách importOne sang bean riêng (thiết kế tốt nhất), hoặc dùng TransactionTemplate quản lý transaction bằng code, hoặc inject chính mình qua {{ObjectProvider}} (khuyên ít dùng vì khó đọc).

Kết quả: mỗi file có transaction riêng, lỗi một file không ảnh hưởng file khác, batch 10.000 lệnh ổn định khoảng 5 phút, giảm incident liên quan rollback sai.

### Trả lời mẫu khi phỏng vấn

"Proxy là object cùng interface đứng trước object thật, chặn lời gọi để thêm hành vi như mở transaction, chạy async hoặc đọc cache, rồi chuyển tiếp. Spring tạo proxy khi khởi tạo bean, dùng JDK dynamic proxy nếu bean có interface hoặc CGLIB subclass (mặc định trong Spring Boot). Vì proxy nằm bên ngoài, gọi this.method() trong class bỏ qua proxy, nên @Transactional, @Async, @Cacheable không chạy. @Lazy tại điểm inject inject proxy, bean thật chỉ tạo ở lần gọi đầu; method final hoặc class final (Kotlin mặc định) CGLIB không override được, annotation im lặng không chạy. Cách sửa: tách method sang bean khác, dùng TransactionTemplate, hoặc AspectJ weaving. Khi debug transaction không rollback hay cache không ăn, tôi xem class bean có hậu tố $$SpringCGLIB$$ và kiểm tra lời gọi có đi qua tham chiếu bean đó. Chín trên mười lần lỗi là self-invocation hoặc exception bị catch nuốt mất."

> Senior tip: khi debug "transaction không rollback" hay "cache không ăn", tôi đặt breakpoint xem class của bean được inject: thấy tên có {{$$SpringCGLIB$$}} là có proxy. Rồi kiểm tra lời gọi có đi qua tham chiếu bean đó không. Chín trên mười lần lỗi là self-invocation hoặc exception bị catch nuốt mất.`,
  follow: [
    'Exception checked có làm @Transactional rollback không? Cấu hình rollbackFor thế nào?',
    'Thứ tự áp dụng khi một method có cả @Transactional và @Cacheable: proxy nào bọc ngoài?',
    'Vì sao @Async trên method trả về void làm exception biến mất, và bạn xử lý thế nào?'
  ],
  tags: ['Proxy', 'Spring AOP', '@Transactional', 'CGLIB', 'self-invocation']
,
  refs: [
    { type: 'doc', title: 'Spring Framework: Understanding AOP Proxies', url: 'https://docs.spring.io/spring-framework/reference/core/aop/proxying.html' },
    { type: 'doc', title: 'Spring Framework: Declarative Transaction Management', url: 'https://docs.spring.io/spring-framework/reference/data-access/transaction/declarative.html' },
  ]
},
{
  id: 'architecture-013',
  topic: 'architecture',
  level: 'senior',
  q: 'Phân biệt Adapter, Facade và Decorator qua một tình huống tích hợp đối tác: hệ thống cần gọi SDK của một ví điện tử, thêm retry/metrics, và cung cấp một API mở tài khoản gọi 4 hệ thống phía sau.',
  a: `**Tóm tắt:** Phân biệt bằng **ý định và interface**. **Adapter** đổi interface của thứ có sẵn (SDK đối tác) sang interface mà code của ta mong đợi. **Decorator** giữ nguyên interface, bọc thêm hành vi (retry, metrics, log) và có thể xếp chồng. **Facade** tạo một interface mới, đơn giản, đứng trước nhiều hệ thống con (eKYC, core banking, phát hành thẻ, thông báo). Proxy cũng giữ nguyên interface như Decorator nhưng mục đích là kiểm soát truy cập (lazy, bảo mật, remote), không phải thêm tính năng.

### Adapter: SDK đối tác sang port của ta
~~~java
public interface WalletGateway {                       // port do domain của ta định nghĩa
    PaymentResult charge(PaymentCommand cmd);
}

@Component
class AcmeWalletAdapter implements WalletGateway {    // AcmeWalletSdk: SDK giả định của đối tác
    private final AcmeWalletSdk sdk;
    AcmeWalletAdapter(AcmeWalletSdk sdk) { this.sdk = sdk; }

    public PaymentResult charge(PaymentCommand cmd) {
        AcmeRequest req = new AcmeRequest(cmd.orderId(), cmd.amount().longValueExact()); // VND -> long
        AcmeResponse res = sdk.createPayment(req);
        return switch (res.code()) {                    // dịch mã lỗi của đối tác sang ngôn ngữ của ta
            case "0"  -> PaymentResult.success(res.transId());
            case "9"  -> PaymentResult.pending(res.transId());
            default   -> PaymentResult.failed(res.code(), res.message());
        };
    }
}
~~~
Lợi ích: kiểu dữ liệu, mã lỗi, exception của đối tác **không rò** vào domain. Đổi đối tác = viết adapter mới.

### Decorator: thêm hành vi, giữ interface
~~~java
class MeteredWalletGateway implements WalletGateway {
    private final WalletGateway inner;            // bọc một WalletGateway bất kỳ
    private final MeterRegistry registry;
    MeteredWalletGateway(WalletGateway inner, MeterRegistry registry) { this.inner = inner; this.registry = registry; }

    public PaymentResult charge(PaymentCommand cmd) {
        return Timer.builder("wallet.charge").register(registry)
                    .record(() -> inner.charge(cmd));   // thêm đo thời gian, không đổi kết quả
    }
}
// Xếp chồng: new MeteredWalletGateway(new RetryingWalletGateway(adapter), registry)
~~~
**Thứ tự xếp chồng có ý nghĩa:** metrics bọc ngoài retry đo tổng thời gian kể cả retry; bọc trong thì đo từng lần gọi. Retry chỉ an toàn khi đối tác hỗ trợ idempotency (cùng orderId không trừ tiền hai lần). Trong thực tế, các decorator dạng này thường dùng thư viện như Resilience4j thay vì tự viết.

### Facade: một API cho nhiều hệ thống
~~~java
@Service
public class AccountOpeningFacade {
    // eKyc, coreBanking, cardIssuing, notifier: 4 client đến 4 hệ thống
    public OpeningResult open(OpeningRequest req) {
        KycResult kyc = eKyc.verify(req.idCard(), req.selfie());
        String cif = coreBanking.createCustomer(kyc);
        String accountNo = coreBanking.openAccount(cif, req.product());
        cardIssuing.requestDebitCard(cif, accountNo);
        notifier.welcome(req.phone(), accountNo);
        return new OpeningResult(cif, accountNo);
    }
}
~~~
Client (mobile app, BFF) chỉ biết {{open()}}. Facade không cấm gọi trực tiếp hệ thống con; nó chỉ cung cấp đường đi đơn giản. Lưu ý: facade gọi 4 hệ thống tuần tự là chỗ phải nghĩ về lỗi từng phần (đã tạo CIF nhưng mở thẻ lỗi) → cần saga/bước bù hoặc trạng thái hồ sơ để làm tiếp.

### Bảng phân biệt
| | Adapter | Decorator | Facade | Proxy |
|---|---|---|---|---|
| Interface | Đổi sang interface khác | Giữ nguyên | Tạo interface mới, đơn giản hơn | Giữ nguyên |
| Bọc bao nhiêu | Một object | Một object, xếp chồng nhiều lớp | Nhiều hệ thống con | Một object |
| Mục đích | Tương thích | Thêm hành vi | Che độ phức tạp | Kiểm soát truy cập |
| Ví dụ JDK/Spring | {{InputStreamReader}}, {{HandlerAdapter}} | {{BufferedInputStream}} | {{JdbcTemplate}} che JDBC thô | Proxy của {{@Transactional}} |

### Câu trả lời sai phổ biến
- "Adapter và Facade đều là wrapper nên như nhau." Khác ở số lượng và mục đích: adapter làm khớp một interface, facade đơn giản hoá cả một hệ thống.
- "Decorator thì dùng kế thừa." Decorator dùng **composition**; kế thừa để thêm hành vi sẽ bùng nổ số lớp con cho mỗi tổ hợp (retry + metrics, chỉ metrics...).
- Facade phình thành god service chứa cả logic nghiệp vụ: facade chỉ nên điều phối.

### Ví dụ đời thực

Dịch vụ thanh toán tích hợp SDK của một ví điện tử, sau đó cần thêm retry, đo metrics và cung cấp API mở tài khoản gọi 4 hệ thống phía sau.

Triệu chứng: sau khi đổi SDK đối tác, mã lỗi "99" của đối tác rò rỉ ra API của ta, mobile app hiển thị sai thông điệp, và gọi SDK trực tiếp ở nhiều service khiến test khó viết.

Điều tra: tìm thấy team gọi AcmeWalletSdk trực tiếp trong service nghiệp vụ, không có lớp trung gian giữa domain và SDK.

Nguyên nhân gốc: không có Adapter, kiểu dữ liệu và mã lỗi của đối tác rò vào domain, vi phạm nguyên lý phụ thuộc vào abstraction.

Cách xử lý: viết {{WalletGateway}} interface do domain định nghĩa, {{AcmeWalletAdapter}} dịch mã lỗi đối tác sang ngôn ngữ của ta, thêm {{MeteredWalletGateway}} đo thời gian và {{RetryingWalletGateway}} retry (chỉ khi đối tác hỗ trợ idempotency). API mở tài khoản dùng {{Facade}} điều phối eKYC, core banking, phát hành thẻ và thông báo. Decorator xếp chồng thứ tự quan trọng: metrics bọc ngoài retry đo tổng thời gian kể cả retry, bọc trong đo từng lần.

Kết quả: đổi đối tác chỉ viết adapter mới, mã lỗi đối tác không rò ra API, monitor latency mỗi lệnh, API mở tài khoản đơn giản cho client mobile.

### Trả lời mẫu khi phỏng vấn

"Adapter đổi interface của SDK đối tác sang port mà domain của ta mong đợi, giúp đổi đối tác chỉ viết adapter mới và mã lỗi đối tác không rò vào domain. Decorator giữ nguyên interface, bọc thêm retry, metrics, log, có thể xếp chồng nhiều lớp, thứ tự bọc có ý nghĩa. Facade tạo interface mới đơn giản đứng trước nhiều hệ thống con, ví dụ API mở tài khoản gọi eKYC, core banking, phát hành thẻ và thông báo. Proxy cũng giữ interface nhưng mục đích là kiểm soát truy cập như lazy, bảo mật hay remote, không phải thêm tính năng. Trong tích hợp ngân hàng tôi yêu cầu adapter là nơi duy nhất biết mã lỗi đối tác và mọi mapping có test với response mẫu thật từ sandbox. Thứ tự xếp chồng Decorator quan trọng: metrics bọc ngoài retry đo tổng thời gian kể cả retry, bọc trong đo từng lần, nên chọn theo mục tiêu quan sát hệ thống."

> Senior tip: trong tích hợp ngân hàng, tôi yêu cầu adapter là nơi **duy nhất** biết mã lỗi đối tác và mọi mapping có test với response mẫu thật (lấy từ sandbox của đối tác). Khi đối tác thêm mã lỗi mới, bug sẽ nằm gọn ở một class thay vì rải khắp code.`,
  follow: [
    'Bạn đặt retry ở decorator, ở HTTP client hay ở message queue? Tiêu chí chọn?',
    'Facade mở tài khoản lỗi ở bước thứ 3: bạn thiết kế để khách có thể tiếp tục thay vì làm lại từ đầu thế nào?',
    'Spring có cách nào khai báo chuỗi decorator gọn gàng thay vì new lồng nhau?'
  ],
  tags: ['Adapter', 'Facade', 'Decorator', 'Proxy', 'integration', 'design pattern']
,
  refs: [
    { type: 'doc', title: 'Refactoring.Guru: Adapter', url: 'https://refactoring.guru/design-patterns/adapter' },
    { type: 'doc', title: 'Refactoring.Guru: Facade', url: 'https://refactoring.guru/design-patterns/facade' },
    { type: 'doc', title: 'Refactoring.Guru: Decorator', url: 'https://refactoring.guru/design-patterns/decorator' },
  ]
},
{
  id: 'architecture-014',
  topic: 'architecture',
  level: 'mid',
  q: 'IoC, Dependency Injection và Dependency Inversion Principle khác nhau thế nào? Có thể dùng DI mà vẫn vi phạm DIP không?',
  a: `**Tóm tắt:** **IoC** (Inversion of Control) là ý tưởng rộng: framework điều khiển luồng và gọi code của bạn ("đừng gọi tôi, tôi sẽ gọi bạn"). **DI** là một kỹ thuật cụ thể để hiện thực IoC cho việc tạo phụ thuộc: object nhận phụ thuộc từ bên ngoài thay vì tự {{new}}. **DIP** là nguyên lý thiết kế (chữ D trong SOLID): module cấp cao không phụ thuộc module cấp thấp, cả hai phụ thuộc abstraction, và **abstraction thuộc về phía cấp cao**. Có thể dùng DI mà vẫn vi phạm DIP: inject thẳng class cụ thể của tầng hạ tầng vào domain.

### IoC: rộng hơn DI
Ví dụ IoC không liên quan đến DI:
- Servlet container gọi {{doGet}} của bạn; bạn không viết vòng lặp nhận request.
- {{@KafkaListener}}: framework poll và gọi method của bạn.
- Template Method: lớp cha gọi hook của lớp con.
Điểm chung: quyền điều khiển luồng thuộc về framework/khung, code của bạn chỉ được "cắm vào".

### DI: kỹ thuật cung cấp phụ thuộc
~~~java
// Không DI: tự tạo phụ thuộc, không thay được khi test
class TransferService {
    private final AccountRepository repo = new JdbcAccountRepository(dataSource);
}

// DI qua constructor: ai tạo TransferService thì quyết định repo nào
class TransferService {
    private final AccountRepository repo;
    TransferService(AccountRepository repo) { this.repo = repo; }
}
~~~
DI **không cần container**: tự wiring trong {{main}} hoặc trong test bằng {{new TransferService(fakeRepo)}} vẫn là DI. Spring chỉ tự động hoá việc này.

Ưu tiên constructor injection: field {{final}}, phụ thuộc bắt buộc rõ ràng, test không cần Spring, constructor quá dài là tín hiệu class làm quá nhiều việc. Field injection ({{@Autowired}} trên field) ẩn phụ thuộc và chỉ chạy được trong container. Từ Spring Boot 2.6, vòng phụ thuộc giữa bean bị cấm mặc định ({{spring.main.allow-circular-references=false}}), gặp lỗi đó nên sửa thiết kế thay vì bật lại.

### DIP: hướng của phụ thuộc
~~~text
VI PHẠM DIP (dù có DI):                 TUÂN THỦ DIP:
domain.TransferService                   domain.TransferService
   | inject                                 | phụ thuộc
   v                                        v
infra.JdbcAccountRepository              domain.AccountRepository (interface, domain sở hữu)
                                            ^
                                            | implements
                                         infra.JdbcAccountRepository
~~~
Ở bên trái, Spring vẫn inject (có DI) nhưng domain import package hạ tầng: đổi JDBC sang JPA phải sửa domain. Ở bên phải, mũi tên phụ thuộc từ hạ tầng **chỉ vào** domain; đó là "inversion". Chi tiết quan trọng mà nhiều ứng viên bỏ qua: interface nằm ở **package của domain** và được đặt tên theo nhu cầu của domain ({{AccountRepository.findForUpdate}}), không phải một interface chung chung do tầng hạ tầng định nghĩa.

### Bảng so sánh
| | IoC | DI | DIP |
|---|---|---|---|
| Loại | Nguyên tắc/kiểu kiến trúc framework | Kỹ thuật | Nguyên lý thiết kế |
| Trả lời câu hỏi | Ai điều khiển luồng? | Phụ thuộc đến từ đâu? | Phụ thuộc trỏ về hướng nào? |
| Cần container | Không | Không | Không |
| Ví dụ | Servlet, listener, template method | Constructor injection | Port trong domain, adapter ở infra |

### Câu trả lời sai phổ biến
- "IoC, DI là một, chính là Spring." Spring là một container IoC dùng DI; hai khái niệm có trước và độc lập với Spring.
- "Có interface là đạt DIP." Không, nếu interface nằm ở tầng hạ tầng và domain import nó, hướng phụ thuộc vẫn sai.
- "Phải tạo interface cho mọi service." DIP áp dụng ở **ranh giới** (domain với hạ tầng, với đối tác); service nội bộ chỉ có một implementation không cần interface.

### Ví dụ đời thực

Dịch vụ chuyển tiền cần thay JDBC sang JPA nhưng team phải sửa class TransferService ở tầng domain.

Triệu chứng: sau khi thêm JPA, domain import org.springframework.jdbc và jakarta.persistence, đổi repository phải sửa nhiều class ở domain, test domain không chạy được mà không có Spring.

Điều tra: xem import của package domain, thấy phụ thuộc trực tiếp vào JdbcAccountRepository và framework persistence.

Nguyên nhân gốc: có DI (constructor injection) nhưng vi phạm DIP vì interface do tầng hạ tầng định nghĩa, mũi tên phụ thuộc từ domain chỉ xuống infra, không phải inversion.

Cách xử lý: tạo {{AccountRepository}} interface ở package domain, đặt tên theo nhu cầu domain (ví dụ {{findForUpdate}}), {{infra.JdbcAccountRepository}} implements nó, mũi tên phụ thuộc từ infra chỉ vào domain.

Kết quả: đổi JDBC sang JPA không đụng domain, test domain không cần Spring, đưa luật kiểm tra import domain vào test kiến trúc ArchUnit để không ai phải nhớ.

### Trả lời mẫu khi phỏng vấn

"IoC là ý tưởng rộng: framework điều khiển luồng và gọi code của ta, ví dụ servlet container gọi doGet hoặc listener Kafka gọi method. DI là kỹ thuật cung cấp phụ thuộc từ bên ngoài thay vì tự new, không nhất thiết cần container, Spring chỉ tự động hóa việc này. DIP là nguyên lý thiết kế: module cấp cao và module cấp thấp đều phụ thuộc abstraction, và abstraction thuộc về phía cấp cao. Có thể dùng DI nhưng vẫn vi phạm DIP nếu inject thẳng class hạ tầng vào domain. Tôi kiểm tra DIP nhanh bằng cách xem import của package domain: thấy jdbc hay persistence là có vấn đề, và đưa luật đó vào test kiến trúc ArchUnit. Constructor injection ưu tiên vì field final, phụ thuộc bắt buộc rõ ràng và test không cần Spring. Mỗi team nên ghi lại lý do chọn interface ở package domain để những dev sau này không ngược dòng quy tắc."

> Senior tip: kiểm tra DIP nhanh nhất là nhìn phần import của package domain: thấy {{org.springframework.jdbc}}, {{jakarta.persistence}} hay SDK đối tác là có vấn đề. Tôi đưa luật đó vào test kiến trúc (ArchUnit) để không ai phải nhớ.`,
  follow: [
    'Constructor của một service có 9 tham số: bạn xử lý thế nào?',
    'Vì sao field injection khó test và có rủi ro gì với bean bị null?',
    'Trong Hexagonal Architecture, port và adapter liên hệ với DIP thế nào?'
  ],
  tags: ['IoC', 'Dependency Injection', 'DIP', 'SOLID', 'Spring']
},
{
  id: 'architecture-015',
  topic: 'architecture',
  level: 'senior',
  q: '"Composition over inheritance" nghĩa là gì trong thực tế? Cho ví dụ một cây kế thừa gây hại trong code nghiệp vụ và cách bạn refactor nó.',
  a: `**Tóm tắt:** Kế thừa gắn chặt lớp con với **chi tiết cài đặt** của lớp cha (fragile base class) và chỉ mở rộng được theo một chiều; khi nghiệp vụ thay đổi theo nhiều chiều độc lập (loại sản phẩm × phí × hạn mức × kênh), số lớp con bùng nổ. Composition tách mỗi chiều thay đổi thành một object (policy/strategy) được ghép lại, thay được lúc runtime và test riêng. Kế thừa vẫn đúng khi có quan hệ "là một" thật và lớp cha **được thiết kế để kế thừa**; Java 17 sealed interface + record là cách mô hình hoá cây kiểu dữ liệu an toàn.

### Ví dụ hại: cây kế thừa sản phẩm tiền gửi
~~~text
AbstractAccount
 |-- SavingsAccount
 |    |-- OnlineSavingsAccount          (phí khác)
 |    |-- OnlineSavingsWithdrawAnytime  (cho rút trước hạn)
 |-- CurrentAccount
      |-- CurrentAccountOverdraft
      |-- CurrentAccountOverdraftPremium (miễn phí + thấu chi)
~~~
Mỗi sản phẩm mới là tổ hợp của: cách tính lãi, biểu phí, quy tắc rút, hạn mức. Kế thừa chỉ cho chọn **một** trục, các trục khác bị copy-paste hoặc nhồi vào lớp cha bằng cờ {{if (isPremium)}}. Sửa {{AbstractAccount.withdraw()}} cho một sản phẩm có thể làm vỡ năm sản phẩm khác.

### Fragile base class: ví dụ kinh điển
~~~java
class CountingSet<E> extends HashSet<E> {
    int added = 0;
    @Override public boolean add(E e) { added++; return super.add(e); }
    @Override public boolean addAll(Collection<? extends E> c) { added += c.size(); return super.addAll(c); }
}
// addAll(3 phần tử) -> added = 6, vì HashSet.addAll bên trong gọi lại add() đã bị override
~~~
Lớp con phụ thuộc vào việc lớp cha **tự gọi** method nào bên trong, điều không có trong hợp đồng công khai và có thể đổi giữa các phiên bản.

### Refactor sang composition
~~~java
public interface InterestPolicy { BigDecimal monthlyInterest(BigDecimal balance); }
public interface FeePolicy      { Money withdrawalFee(Money amount, Channel channel); }
public interface WithdrawalRule { void check(Account acc, Money amount); }   // ném exception nếu vi phạm

public final class Account {                       // final: không cần kế thừa nữa
    private final InterestPolicy interest;
    private final FeePolicy fee;
    private final WithdrawalRule withdrawalRule;
    private Money balance;

    public void withdraw(Money amount, Channel ch) {
        withdrawalRule.check(this, amount);          // mỗi trục thay đổi là một object riêng
        balance = balance.minus(amount).minus(fee.withdrawalFee(amount, ch));
    }
}
// Sản phẩm = cấu hình tổ hợp: new Account(new TieredInterest(...), new FreeOnline(), new AnytimeWithdrawal())
~~~
Lợi ích: thêm sản phẩm mới phần lớn là **cấu hình** (đọc từ bảng product), policy được unit test độc lập, và đổi policy không ảnh hưởng sản phẩm khác.

### Khi kế thừa vẫn đúng
- Quan hệ "là một" ổn định và lớp con tuân thủ hoàn toàn hợp đồng lớp cha (LSP).
- Lớp cha được **thiết kế để kế thừa**: có tài liệu hook nào được override, method còn lại {{final}} (Template Method).
- Mô hình hoá các biến thể dữ liệu đóng: {{sealed interface PaymentMethod permits Card, Wallet, BankTransfer}} với các {{record}}, xử lý bằng switch pattern matching (Java 21). Ở đây không có state chia sẻ hay hành vi bị override, nên không có fragile base class.
- Extension point của framework ({{OncePerRequestFilter}}, {{AbstractRoutingDataSource}}).

### So sánh
| | Kế thừa | Composition |
|---|---|---|
| Ghép nhiều chiều thay đổi | Bùng nổ lớp con | Ghép object |
| Thay hành vi lúc runtime | Không | Có |
| Phụ thuộc chi tiết nội bộ | Có (fragile) | Chỉ qua interface |
| Lượng code ban đầu | Ít | Nhiều hơn một chút |
| Tái sử dụng code chung | Tự nhiên | Cần delegate |

### Câu trả lời sai phổ biến
- "Không bao giờ dùng kế thừa." Quá cực đoan; record + sealed, template method, framework hook là kế thừa hợp lý.
- Kế thừa chỉ để **tái sử dụng code** (ví dụ {{BaseService}} chứa tiện ích log, mapper): đó là dấu hiệu nên dùng helper/composition.

### Ví dụ đời thực

Dịch vụ tài sản có cây kế thừa sản phẩm tiền gửi với nhiều nhánh.

Triệu chứng: thêm sản phẩm tiết kiệm online cho rút bất kỳ lúc nào, team tạo {{OnlineSavingsWithdrawAnytime}} kế thừa {{OnlineSavingsAccount}}; sau đó sửa {{AbstractAccount.withdraw()}} cho một sản phẩm làm vỡ năm sản phẩm khác, incident thất toán giao dịch rút tiền.

Điều tra: git blame thấy {{AbstractAccount.withdraw()}} dùng cờ {{if (isPremium)}}, mỗi trục thay đổi (lãi, phí, rút, hạn mức) bị copy-paste hoặc nhồi cờ vào class cha.

Nguyên nhân gốc: kế thừa chỉ mở rộng theo một chiều, số lớp con bùng nổ khi nghiệp vụ thay đổi theo nhiều trục độc lập, và sửa class cha dễ làm vỡ sản phẩm khác (fragile base class).

Cách xử lý: refactor sang composition, mỗi trục thành policy interface ({{InterestPolicy}}, {{FeePolicy}}, {{WithdrawalRule}}), {{Account}} final ghép các policy, mỗi sản phẩm là cấu hình tổ hợp đọc từ bảng.

Kết quả: thêm sản phẩm mới phần lớn là cấu hình, policy được unit test độc lập, đổi policy không ảnh hưởng sản phẩm khác, số incident liên quan rút tiền giảm xuống 0.

### Trả lời mẫu khi phỏng vấn

"Kế thừa gắn chặt lớp con với chi tiết triển khai của lớp cha, dễ gây fragile base class và chỉ mở rộng một chiều, nên khi nghiệp vụ thay đổi theo nhiều trục số lớp con bùng nổ. Composition tách mỗi chiều thành object policy được ghép lại, thay được lúc runtime và test riêng. Ví dụ class {{CountingSet}} extends {{HashSet}}, {{addAll}} gọi lại {{add}} đã override khiến đếm sai. Refactor sang {{Account}} với {{InterestPolicy}}, {{FeePolicy}}, {{WithdrawalRule}}, mỗi sản phẩm là cấu hình. Khi nào dùng kế thừa: quan hệ là một ổn định, lớp cha thiết kế để kế thừa (hook có tài liệu, method còn lại {{final}}), hoặc biến thể dữ liệu đóng như {{sealed interface}}. Lỗi phổ biến là dùng kế thừa chỉ để tái sử dụng code (ví dụ {{BaseService}} chứa tiện ích), thì nên dùng helper hoặc composition. Dấu hiệu cây kế thừa sai là lớp cha có cờ boolean hoặc {{protected}} method chỉ một lớp con dùng."

> Senior tip: dấu hiệu sớm nhất của cây kế thừa sai là lớp cha bắt đầu có cờ boolean hoặc method protected chỉ một lớp con dùng. Khi thấy hai dấu hiệu đó trong review, tôi đề xuất tách trục thay đổi ra policy trước khi thêm lớp con kế tiếp; càng để lâu, chi phí tách càng lớn.`,
  follow: [
    'Sealed interface với record khác gì kế thừa truyền thống, vì sao không gặp fragile base class?',
    'Bạn refactor một cây kế thừa đang chạy production mà không phá dữ liệu đã lưu bằng JPA inheritance thế nào?',
    'Delegation trong composition có tốn hiệu năng đáng kể không?'
  ],
  tags: ['composition', 'inheritance', 'fragile base class', 'sealed', 'refactoring']
,
  refs: [
    { type: 'doc', title: 'JEP 409: Sealed Classes', url: 'https://openjdk.org/jeps/409' },
    { type: 'doc', title: 'Refactoring: Replace Superclass with Delegate', url: 'https://refactoring.com/catalog/replaceSuperclassWithDelegate.html' },
  ]
},
{
  id: 'architecture-016',
  topic: 'architecture',
  level: 'senior',
  q: 'Khi review code, bạn hay gặp những code smell nào nhất (long method, primitive obsession, feature envy...)? Với từng smell, bạn refactor thế nào mà không gây lỗi production?',
  a: `**Tóm tắt:** Code smell là dấu hiệu bề mặt cho thấy thiết kế khó thay đổi, không phải bug. Những smell gặp nhiều nhất trong code nghiệp vụ Java: **long method**, **large class**, **primitive obsession** (tiền là {{BigDecimal}} + {{String}} currency rời rạc), **feature envy** (method dùng dữ liệu của class khác nhiều hơn của mình), **long parameter list/data clumps**, **shotgun surgery** và cờ boolean truyền vào method. Refactor an toàn: viết characterization test trước, dùng refactoring tự động của IDE, bước nhỏ, và **tách PR refactor khỏi PR đổi hành vi**.

### Các smell và cách sửa
| Smell | Dấu hiệu | Refactoring |
|---|---|---|
| Long method | Hơn ~50 dòng, nhiều comment phân đoạn "// bước 1" | Extract Method theo từng bước, đặt tên bằng nghiệp vụ |
| Large class | Hàng nghìn dòng, nhiều nhóm field ít liên quan | Extract Class theo nhóm field/method dùng chung |
| Primitive obsession | {{String accountNo}}, {{BigDecimal}} + {{String}} currency | Value object ({{record}}) có validation |
| Feature envy | {{a.getB().getC()...}} rồi tính toán | Move Method về class sở hữu dữ liệu |
| Data clumps / long params | Bộ (fromDate, toDate) hoặc (amount, currency) đi cùng nhau mọi nơi | Introduce Parameter Object |
| Shotgun surgery | Thêm một loại phí phải sửa 7 file | Gom logic về một chỗ (Move Method, Strategy) |
| Divergent change | Một class đổi vì nhiều lý do khác nhau | Tách theo lý do thay đổi (SRP) |
| Flag argument | {{transfer(cmd, true, false)}} | Tách method có tên, hoặc enum |
| Switch theo type lặp lại | Cùng một switch ở nhiều nơi | Polymorphism hoặc sealed + switch tập trung |
| Speculative generality | Interface, tham số "để sau này dùng" | Xoá (YAGNI) |

### Primitive obsession: ví dụ đáng sửa nhất
~~~java
// Trước: dễ cộng VND với USD, dễ quên làm tròn, số âm lọt vào
BigDecimal fee = amount.multiply(rate);
if (currency.equals("VND")) fee = fee.setScale(0, RoundingMode.HALF_UP);

// Sau: invariant nằm ở một chỗ, mọi nơi dùng được bảo vệ
public record Money(BigDecimal amount, Currency currency) {
    public Money {
        Objects.requireNonNull(currency);
        if (amount.signum() < 0) throw new IllegalArgumentException("Số tiền âm");
        amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.HALF_UP); // VND: 0 chữ số lẻ
    }
    public Money plus(Money o) {
        if (!currency.equals(o.currency)) throw new IllegalArgumentException("Khác loại tiền");
        return new Money(amount.add(o.amount), currency);
    }
}
~~~
{{java.util.Currency.getInstance("VND").getDefaultFractionDigits()}} trả về 0, nên làm tròn đúng theo đơn vị tiền.

### Feature envy
~~~java
// Trước: service "ghen tị" với dữ liệu của Loan
BigDecimal remaining = loan.getPrincipal().subtract(loan.getPaid());
boolean overdue = loan.getDueDate().isBefore(today) && remaining.signum() > 0;

// Sau: hành vi về đúng chỗ dữ liệu
boolean overdue = loan.isOverdue(today);
~~~
Đây cũng là cách chữa anemic domain model từng bước, không cần viết lại.

### Refactor an toàn trên production
1. **Characterization test:** trước khi đụng code cũ, viết test chụp lại hành vi hiện tại (kể cả hành vi kỳ quặc), dùng input từ log thật đã che dữ liệu.
2. **Dùng refactoring của IDE** (Extract Method, Rename, Change Signature, Move): nó cập nhật mọi chỗ gọi chính xác hơn sửa tay.
3. **Bước nhỏ, commit nhỏ**, test xanh sau mỗi bước.
4. **Tách PR**: PR refactor không đổi hành vi, reviewer chỉ cần xác nhận "tương đương"; PR tính năng đi sau.
5. Với thay đổi rủi ro (đổi cách tính tiền), chạy song song cũ và mới, so sánh kết quả, log chênh lệch trước khi chuyển hẳn.

### Câu trả lời sai phổ biến
- Liệt kê tên smell mà không nói **vì sao** nó gây hại (khó thay đổi, khó test, bug lặp lại).
- "Thấy smell là refactor ngay." Refactor có chi phí; ưu tiên code hay bị sửa và hay có bug (hotspot), code không ai đụng thì để yên.
- Trộn refactor lớn vào PR tính năng: reviewer không thể kiểm tra, rủi ro cao.

> Senior tip: tôi ưu tiên refactor theo dữ liệu: kết hợp số lần thay đổi file (git log) với số bug liên quan; vài file đứng đầu cả hai danh sách thường là nơi refactor đem lại nhiều giá trị nhất. "Boy scout rule" (để code sạch hơn một chút mỗi lần chạm vào) hiệu quả hơn một dự án refactor lớn không ai dám merge.`,
  follow: [
    'Làm sao viết characterization test cho một method 500 dòng phụ thuộc DB và đối tác?',
    'Bạn thuyết phục PO dành thời gian refactor bằng số liệu nào?',
    'Static analysis (Sonar, PMD) bắt được những smell nào, và những smell nào chỉ người review mới thấy?'
  ],
  tags: ['code smell', 'refactoring', 'primitive obsession', 'feature envy', 'code review']
,
  refs: [
    { type: 'doc', title: 'Refactoring.Guru: Code Smells', url: 'https://refactoring.guru/refactoring/smells' },
    { type: 'doc', title: 'Catalog of Refactorings (Martin Fowler)', url: 'https://refactoring.com/catalog/' },
  ]
},
{
  id: 'architecture-017',
  topic: 'architecture',
  level: 'senior',
  q: 'So sánh event notification và event-carried state transfer trong event-driven architecture. Vì sao hệ thống event-driven khó debug, và bạn làm gì để giảm rủi ro đó?',
  a: `**Tóm tắt:** **Event notification** chỉ báo "có chuyện xảy ra" kèm ID; consumer cần thêm dữ liệu thì gọi ngược lại service nguồn. **Event-carried state transfer** gửi kèm đủ dữ liệu để consumer tự lưu bản sao và không cần gọi lại. Cách thứ nhất ít coupling về schema nhưng tạo coupling lúc runtime; cách thứ hai tách runtime nhưng schema event trở thành hợp đồng công khai và dữ liệu nhân bản nhiều nơi. EDA khó debug vì luồng nghiệp vụ **không nằm ở một chỗ nào trong code**: nó phân tán qua các consumer, bất đồng bộ, có trùng lặp và sai thứ tự. Giảm rủi ro bằng trace ID xuyên suốt, schema có quản lý, consumer idempotent, DLQ có quy trình, và dùng orchestration cho luồng dài cần nhìn thấy trạng thái.

### Ba kiểu dùng event (theo cách phân loại của Martin Fowler)
| Kiểu | Payload | Consumer làm gì | Rủi ro |
|---|---|---|---|
| Event notification | {{orderId}}, loại sự kiện | Gọi API nguồn lấy chi tiết | Nguồn chết thì consumer kẹt; bão request ngược |
| Event-carried state transfer | Toàn bộ trạng thái cần thiết | Lưu bản sao cục bộ | Schema thành hợp đồng; dữ liệu cũ (stale) |
| Event sourcing | Chuỗi event là nguồn sự thật | Dựng lại trạng thái từ event | Phức tạp, khó đổi schema event cũ |

Ví dụ thương mại điện tử: {{OrderPlaced}} dạng notification thì kho, khuyến mãi, thông báo đều gọi lại Order Service lúc cao điểm, nhân tải lên nhiều lần. Dạng state transfer mang sẵn item, địa chỉ, tổng tiền; Order Service chậm cũng không ảnh hưởng consumer. Đổi lại, thêm/xoá field phải tính đến mọi consumer.

### Event-carried state transfer: thiết kế payload
~~~json
{
  "eventId": "9f1c...", "type": "OrderPlaced", "version": 2,
  "occurredAt": "2026-10-23T09:15:02Z",
  "orderId": "ORD-1001", "customerId": "C-77",
  "items": [{"sku": "SKU-1", "qty": 2, "price": 150000}],
  "total": 300000, "currency": "VND"
}
~~~
{{eventId}} để consumer khử trùng, {{version}} để tiến hoá schema, {{occurredAt}} để xử lý event đến muộn, {{orderId}} làm Kafka key để giữ thứ tự theo đơn hàng.

### Vì sao khó debug
- **Luồng ẩn:** đọc code Order Service không biết ai đang nghe {{OrderPlaced}}; thêm một consumer mới có thể đổi hành vi toàn hệ thống.
- **Bất đồng bộ và eventual consistency:** người dùng thấy đơn đã đặt nhưng điểm thưởng chưa cộng; là bug hay chỉ đang trễ?
- **Trùng và sai thứ tự:** at-least-once nên event có thể đến hai lần; khác partition thì không có thứ tự.
- **Chuỗi phản ứng:** event A kích hoạt B, B kích hoạt C; lỗi ở C rất khó lần ngược về A.
- **Poison message:** một event lỗi format chặn cả partition nếu consumer retry vô hạn.

### Biện pháp
1. **Trace ID trong header** Kafka, nối liền HTTP → producer → consumer. Spring Boot 3 + Micrometer Tracing hỗ trợ khi bật observation ({{spring.kafka.template.observation-enabled}}, {{spring.kafka.listener.observation-enabled}}).
2. **Schema có quản lý:** Schema Registry với chế độ tương thích (backward), quy tắc chỉ thêm field optional; tài liệu hoá event bằng AsyncAPI hoặc một event catalog để biết ai produce, ai consume.
3. **Outbox** để event và thay đổi DB nhất quán; **consumer idempotent** (bảng {{processed_event}} với unique eventId).
4. **Retry có giới hạn + DLQ** (Spring Kafka {{DefaultErrorHandler}} với {{DeadLetterPublishingRecoverer}}), có dashboard và người chịu trách nhiệm xử lý DLQ.
5. **Orchestration cho luồng dài:** quy trình nhiều bước có bù trừ (mở tài khoản, hoàn tiền) nên có một orchestrator giữ trạng thái để trả lời được "hồ sơ này đang ở bước nào". Choreography hợp với phản ứng độc lập, ít bước.

### Khi nào KHÔNG nên event-driven
- Cần kết quả ngay để trả lời người dùng (kiểm tra số dư trước khi chuyển tiền): gọi đồng bộ.
- Team nhỏ, một service: event nội bộ trong process ({{ApplicationEventPublisher}}) đủ dùng, chưa cần Kafka.

### Ví dụ đời thực
Một sàn TMĐT xử lý 100k đơn/ngày. **Triệu chứng:** Khách hàng nhắn CSKH "đã đặt hàng nhưng không thấy điểm thưởng, cũng không nhận email xác nhận". Log chỉ thấy "OrderPlaced event sent" nhưng consumer điểm thưởng (Loyalty Service) không xử lý được vì DB connection pool hết do query chậm. Team debug 4 giờ, thấy Order Service đẩy event, Loyalty Service đọc event nhưng retry vô hạn làm chặn partition Kafka, event bên dưới (đơn hàng khác) bị stuck. **Điều tra:** Consumer Loyalty không idempotent (không có bảng {{processed_event}}), lỗi DB connection pool ném exception, Spring Kafka {{DefaultErrorHandler}} retry 10 lần rồi DLQ, nhưng DLQ không được monitor. Order Service tiếp tục đẩy event, partition bị chặn, consumer khác (Inventory, Notification) cũng bị delay. **Nguyên nhân gốc:** Không có idempotency, không monitor DLQ, retry vô hạn chặn partition. **Xử lý:** (1) Thêm bảng {{processed_event}} unique eventId, consumer check trước khi xử lý; (2) {{DefaultErrorHandler}} với {{DeadLetterPublishingRecoverer}} + max retry 3, DLQ đẩy topic riêng có dashboard + alert PagerDuty; (3) Trace ID xuyên suốt (Micrometer Tracing) để xem luồng đơn hàng end-to-end; (4) AsyncAPI catalog event, ai produce/consume rõ ràng. **Kết quả đo được:** 0 event mất 6 tháng, MTTR từ 4 giờ xuống 15 phút (xem trace ID biết ngay chỗ nào lỗi), DLQ alert tự động phân công on-call.

### Trả lời mẫu khi phỏng vấn
"Event-driven khó debug vì luồng nghiệp vụ không nằm ở một chỗ: phân tán qua consumer, async, trùng lặp, sai thứ tự. Giải pháp: trace ID xuyên suốt, schema registry quản lý, consumer idempotent (bảng processed_event), retry có giới hạn + DLQ có dashboard + người on-call, orchestration cho luồng dài. Tôi từng gặp Loyalty Service retry vô hạn chặn partition Kafka, làm delay Inventory/Notification 4 giờ. Sửa: idempotent key, DLQ monitor, trace ID. Choreography hợp phản ứng độc lập ít bước; luồng dài cần bù trừ (mở tài khoản, hoàn tiền) phải có orchestrator. Luôn hỏi: event đến 2 lần, muộn 1 giờ, hoặc không bao giờ đến thì sao? Nếu team không trả lời được câu 3, thiếu cơ chế đối soát — tiền hoặc dữ liệu sẽ lệch âm thầm."

> Senior tip: quy tắc tôi áp cho mọi event: phải trả lời được "nếu event này đến hai lần, đến muộn 1 giờ, hoặc không bao giờ đến thì sao?". Nếu team không trả lời được câu thứ ba, hệ thống thiếu cơ chế đối soát, và đó là chỗ tiền hoặc dữ liệu sẽ lệch âm thầm.`,
  follow: [
    'Bạn tiến hoá schema event (đổi tên field, tách field) thế nào khi có 6 consumer của 4 team?',
    'Consumer cần dữ liệu khách hàng mới nhất nhưng chỉ nhận event-carried state: xử lý dữ liệu stale ra sao?',
    'Làm sao xây một màn hình "theo dõi trạng thái đơn hàng" trong hệ thống choreography?'
  ],
  tags: ['event-driven', 'Kafka', 'event notification', 'event-carried state transfer', 'observability']
,
  refs: [
    { type: 'article', title: 'What do you mean by Event-Driven? (Martin Fowler)', url: 'https://martinfowler.com/articles/201701-event-driven.html' },
    { type: 'doc', title: 'OpenTelemetry Documentation', url: 'https://opentelemetry.io/docs/' },
  ]
},
{
  id: 'architecture-018',
  topic: 'architecture',
  level: 'senior',
  q: 'Team muốn chuyển từ monolith lộn xộn sang microservices. Bạn đề xuất modular monolith với Spring Modulith: ranh giới module được định nghĩa và kiểm tra thế nào, module giao tiếp ra sao, và khi nào mới tách thành service?',
  a: `**Tóm tắt:** Modular monolith là một deployable duy nhất nhưng chia thành các module theo bounded context, với **ranh giới được kiểm tra tự động**. Spring Modulith coi mỗi **package con trực tiếp của package gốc ứng dụng** là một module; chỉ package gốc của module là API công khai, package con là internal. Test {{ApplicationModules.verify()}} báo lỗi khi có vòng phụ thuộc hoặc truy cập internal của module khác. Module giao tiếp qua gọi API công khai hoặc qua **application event** được lưu bền (Event Publication Registry). Chỉ tách thành service khi có lý do đo được: scale khác biệt, nhịp deploy khác, team độc lập, yêu cầu cô lập (bảo mật, compliance).

### Cấu trúc
~~~text
com.bank.lending                  <- package gốc (@SpringBootApplication)
 |-- application/                 <- module "application": hồ sơ vay
 |    |-- LoanApplicationService  (public API của module)
 |    |-- internal/               (chỉ module này dùng)
 |-- scoring/                     <- module "scoring"
 |    |-- ScoringService
 |    |-- internal/
 |-- disbursement/                <- module "disbursement": giải ngân
~~~

### Kiểm tra ranh giới
~~~java
class ModularityTests {
    ApplicationModules modules = ApplicationModules.of(LendingApplication.class);

    @Test
    void verifiesModularStructure() {
        modules.verify();      // lỗi nếu có cycle giữa module hoặc dùng class trong internal của module khác
    }

    @Test
    void writesDocumentation() {
        new Documenter(modules).writeDocumentation();   // sinh sơ đồ module (PlantUML/C4) và tài liệu
    }
}
~~~
Có thể giới hạn chặt hơn bằng {{@ApplicationModule(allowedDependencies = ...)}} trong {{package-info.java}}, hoặc mở thêm package con làm API bằng {{@NamedInterface}}. Test chạy trong CI nên vi phạm bị chặn ở PR, không phụ thuộc trí nhớ của reviewer.

### Giao tiếp giữa module bằng event
~~~java
// module application: publish trong cùng transaction với việc lưu hồ sơ
@Transactional
public void approve(LoanId id) {
    loan.approve();
    events.publishEvent(new LoanApproved(id, loan.amount()));
}

// module disbursement
@ApplicationModuleListener                         // = @Async + @Transactional(REQUIRES_NEW) + @TransactionalEventListener
void on(LoanApproved event) { disbursementService.schedule(event.loanId(), event.amount()); }
~~~
Với starter lưu trữ (ví dụ {{spring-modulith-starter-jpa}}), mỗi lần publish được ghi vào bảng event publication trong cùng transaction; listener chạy xong mới đánh dấu hoàn tất. App crash giữa chừng thì publication còn dang dở được gửi lại (cấu hình gửi lại khi khởi động hoặc gửi lại chủ động). Đây chính là outbox pattern nội bộ. Khi cần, event có thể được đẩy ra Kafka ({{@Externalized}}) mà không đổi code module, bước đệm tự nhiên trước khi tách service.

### Test theo module
{{@ApplicationModuleTest}} chỉ khởi động bean của một module (và phụ thuộc cho phép), giúp test nhanh và lộ ra phụ thuộc ẩn.

### So sánh
| | Monolith lộn xộn | Modular monolith | Microservices |
|---|---|---|---|
| Ranh giới | Không có | Package + kiểm tra tự động | Mạng + API |
| Transaction | Một DB, tuỳ tiện | Một DB, khuyến khích mỗi module bảng riêng | Phân tán, saga |
| Vận hành | Đơn giản | Đơn giản | Phức tạp (deploy, observability, network) |
| Refactor ranh giới | Đắt | Rẻ (đổi package) | Rất đắt |
| Scale độc lập | Không | Không | Có |

### Khi nào tách module thành service
- Module cần scale khác hẳn phần còn lại (scoring tốn CPU vào cuối tháng).
- Team riêng muốn release độc lập và module đã ổn định ranh giới (ít đổi API).
- Yêu cầu cô lập: PCI DSS cho dữ liệu thẻ, công nghệ khác.
Nếu module chưa sạch phụ thuộc ở trong monolith, tách ra chỉ tạo distributed monolith.

### Pitfall
- Module chia theo tầng kỹ thuật (controller, service, repository) thay vì theo nghiệp vụ: Modulith không cứu được.
- Các module join bảng của nhau trong query: ranh giới code sạch nhưng ranh giới dữ liệu vẫn dính.
- Event mang entity JPA thay vì dữ liệu bất biến (record).

### Ví dụ đời thực
Một ngân hàng 300k LOC monolith 8 năm, team 20 dev. **Triệu chứng:** Deploy module Loan làm sập module Card 3 lần/quý; thêm tính điểm Loyalty phải sửa 4 module, 2 tuần; p99 API tăng dần, tìm bug mất giờ vì logic rải rác. **Điều tra:** Package chia theo tầng (controller/service/repository), không theo nghiệp vụ. Module Loan gọi thẳng repository Card; event mang entity JPA; không có test ranh giới. Spring Modulith {{verify()}} fail 200+ vi phạm. **Nguyên nhân gốc:** Monolith lộn xộn, không có bounded context, dependency cycle Loan → Card → Loan. **Xử lý:** (1) Chia lại package theo bounded context: {{loan}}, {{card}}, {{loyalty}}, {{customer}}; (2) Mỗi module có {{api}}, {{internal}}, {{persistence}}; (3) Spring Modulith {{ApplicationModules.verify()}} trong CI, dùng {{FreezingArchRule}} chặn vi phạm mới, giảm dần 50/Tháng; (4) Giao tiếp qua event ({{LoanApproved}} → {{Disbursement}}), không join bảng chéo; (5) {{@ApplicationModuleTest}} test mỗi module độc lập. **Kết quả đo được:** 6 tháng sau, {{verify()}} xanh, deploy Loan không còn ảnh hưởng Card, thêm Loyalty 3 ngày (chỉ module mới + event), p99 API ổn định, onboarding dev mới hiểu ranh giới 30 phút (trước 2 tuần).

### Trả lời mẫu khi phỏng vấn
"Modular monolith là một deployable nhưng chia module theo bounded context, ranh giới được kiểm tra tự động. Spring Modulith coi mỗi package con trực tiếp là module; chỉ package gốc là API công khai. Dùng {{ApplicationModules.verify()}} trong CI bắt cycle dependency và truy cập internal. Giao tiếp module qua API công khai hoặc application event lưu bền (outbox pattern nội bộ). Tách service chỉ khi có lý do đo được: scale khác biệt, nhịp deploy khác, team độc lập, yêu cầu cô lập. Tôi từng gặp monolith 300k LOC, deploy Loan làm sập Card, chia package theo tầng. Refactor sang Modulith: chia package theo bounded context, {{verify()}} trong CI, FreezingArchRule giảm vi phạm, giao tiếp qua event. 6 tháng sau verify xanh, deploy độc lập, thêm module 3 ngày."

> Senior tip: tôi chỉ đồng ý tách microservice khi modular monolith đã chạy vài tháng mà {{verify()}} xanh và các module chỉ nói chuyện qua event hoặc API công khai. Lúc đó tách là việc cơ học. Ngược lại, nếu không giữ nổi ranh giới trong một codebase, team sẽ không giữ nổi nó qua mạng.`,
  follow: [
    'Module A cần dữ liệu của module B để hiển thị: gọi API của B, join bảng, hay giữ bản sao qua event?',
    'Event publication bị kẹt ở trạng thái chưa hoàn tất: bạn giám sát và xử lý thế nào?',
    'Lộ trình đưa một monolith 300.000 dòng không có ranh giới sang modular monolith?'
  ],
  tags: ['Spring Modulith', 'modular monolith', 'bounded context', 'events', 'architecture']
,
  refs: [
    { type: 'doc', title: 'Spring Modulith Reference', url: 'https://docs.spring.io/spring-modulith/reference/' },
  ]
},
{
  id: 'architecture-019',
  topic: 'architecture',
  level: 'lead',
  refs: [
    { type: 'doc', title: 'Anti-corruption Layer pattern (Azure)', url: 'https://learn.microsoft.com/en-us/azure/architecture/patterns/anti-corruption-layer' },
    { type: 'article', title: 'Strangler Fig Application (Martin Fowler)', url: 'https://martinfowler.com/bliki/StranglerFigApplication.html' },
  ],
  q: 'Ngân hàng xây kênh số mới (app, open API) nhưng phải tích hợp core banking legacy (T24, Flexcube...). Bạn thiết kế anti-corruption layer thế nào để mô hình legacy không lan vào hệ thống mới?',
  a: `**Tóm tắt:** Anti-corruption layer (ACL, khái niệm từ DDD) là lớp **dịch** giữa bounded context mới và hệ thống legacy: domain mới chỉ nói chuyện qua một **port** bằng ngôn ngữ của mình ({{holdFunds}}, {{postTransfer}}, {{Money}}, {{AccountStatus}}); ACL lo phần còn lại: giao thức và định dạng của core, mapping mã lỗi và mã sản phẩm, idempotency, timeout/retry, cache dữ liệu tham chiếu, và xử lý lúc core đóng sổ cuối ngày. Mục tiêu: đổi core (hoặc nâng cấp phiên bản core) chỉ phải sửa ACL, không phải sửa mọi kênh.

### Vấn đề nếu không có ACL
- Field, mã giao dịch, mã lỗi riêng của core xuất hiện trong app, open API, service khuyến mãi... Mười team cùng phải hiểu cùng một mô hình legacy.
- Hành vi đặc thù của core (định dạng ngày, field nhiều giá trị, số tài khoản kèm mã chi nhánh, giờ đóng sổ) rò rỉ thành if/else ở khắp nơi.
- Đổi core (dự án chuyển đổi core thường kéo dài nhiều năm) thành viết lại toàn bộ kênh.

### Kiến trúc
~~~text
Mobile App / Open API / Internet Banking
                |
        Channel services (domain mới: Transfer, Account, Card)
                |  port: CoreBankingPort (ngôn ngữ của domain mới)
                v
   +-------------------- Anti-Corruption Layer --------------------+
   | Facade: API nghiệp vụ thô -> chuỗi lệnh của core               |
   | Translator: domain <-> model legacy, mã lỗi, mã sản phẩm       |
   | Adapter: giao thức của core (message, web service, MQ, DB view)|
   | Idempotency store, retry/timeout, circuit breaker              |
   | Store-and-forward khi core đang đóng sổ cuối ngày              |
   +----------------------------------------------------------------+
                |
        Core banking (T24, Flexcube, ...)
~~~

### Port nằm ở domain mới
~~~java
public interface CoreBankingPort {                       // domain sở hữu, không có kiểu dữ liệu của core
    HoldId holdFunds(AccountNo acc, Money amount, String reference);
    PostingResult postTransfer(TransferPosting posting);   // reference duy nhất -> idempotent
    AccountSnapshot getAccount(AccountNo acc);
}

public sealed interface PostingResult {
    record Posted(String coreRef) implements PostingResult {}
    record Rejected(RejectReason reason) implements PostingResult {}  // INSUFFICIENT_FUNDS, ACCOUNT_BLOCKED...
    record Unknown(String reference) implements PostingResult {}       // timeout: phải truy vấn lại
}
~~~
Kết quả {{Unknown}} là điểm then chốt: ACL không được giả định thất bại khi core không trả lời; nó phải truy vấn lại theo reference trước khi kết luận.

### Translator: phần tốn công nhất
| Legacy | Domain mới |
|---|---|
| Mã lỗi riêng của core (hàng trăm mã) | Enum {{RejectReason}} vài chục giá trị; mã lạ → {{UNKNOWN_CORE_ERROR}} + alert |
| Mã sản phẩm, loại giao dịch nội bộ | {{ProductType}} theo nghiệp vụ |
| Ngày, số tiền dạng chuỗi theo format của core | {{LocalDate}}, {{Money}} |
| Trạng thái tài khoản dạng cờ | {{AccountStatus}} (ACTIVE, DORMANT, BLOCKED) |
Bảng mapping nên là cấu hình có version và có test dựa trên message mẫu thật lấy từ môi trường test của core.

### Các vấn đề vận hành
- **Đóng sổ cuối ngày (COB/EOD):** trong cửa sổ batch, core có thể từ chối hoặc chậm. ACL chuyển sang chế độ nhận lệnh, lưu hàng đợi bền và hạch toán sau (store-and-forward) cho loại giao dịch cho phép; loại không cho phép thì trả lỗi rõ ràng.
- **Bảo vệ core:** core thường không scale ngang được. ACL đặt rate limit/bulkhead theo loại lệnh, cache dữ liệu ít đổi (danh mục chi nhánh, sản phẩm, tỉ giá theo phiên) để kênh số không đổ hết truy vấn đọc vào core.
- **Đọc nhiều:** truy vấn lịch sử giao dịch nên đi qua read model (CDC từ DB core hoặc file/sự kiện core phát ra) thay vì gọi core mỗi lần mở app.
- **Đối soát:** mọi lệnh qua ACL có reference; đối soát hằng ngày giữa log ACL và báo cáo của core.

### Thiết kế tổ chức
- ACL là **service riêng** do một team sở hữu khi nhiều kênh dùng chung; là **module/thư viện** khi chỉ một ứng dụng dùng. Service riêng giúp tập trung kiến thức core, nhưng dễ thành nút cổ chai về tổ chức.
- Pitfall lớn nhất: ACL phình thành nơi chứa logic nghiệp vụ ("tính phí ở ACL cho nhanh"). ACL chỉ dịch và bảo vệ; nghiệp vụ ở domain.
- Kết hợp **strangler fig**: chức năng mới viết ở domain mới, chức năng cũ dần chuyển qua; ACL là đường biên giữa hai thế giới.

### Trade-off
| Lợi | Chi phí |
|---|---|
| Đổi/nâng cấp core chỉ sửa một chỗ | Thêm một hop, thêm độ trễ |
| Kênh mới phát triển nhanh, model sạch | Mapping phải bảo trì liên tục |
| Bảo vệ core khỏi tải kênh số | Rủi ro thành bottleneck tổ chức |

### Ví dụ đời thực
Một ngân hàng lớn tích hợp 3 kênh số (app, internet banking, open API) với core banking T24. **Triệu chứng:** Mỗi khi T24 nâng cấp phiên bản (năm 2 lần), 3 team kênh số đều phải sửa code, trung bình 3 tuần/team, tổng 9 tuần effort. Mã lỗi T24 (hàng trăm mã) rò rỉ ra API mobile app, client hiển thị "ERR_99" thay vì thông báo thân thiện. Logic xử lý giờ đóng sổ (COB 17:00–17:30) bị copy sang 5 service, một service quên check gây giao dịch lọt vào batch, sai số dư. **Điều tra:** Không có ACL; kênh số import thư viện T24 SDK trực tiếp, mapping mã lỗi rải rác, logic COB duplicate. **Nguyên nhân gốc:** Domain mới phụ thuộc model legacy, vi phạm DIP. **Xử lý:** (1) Tạo {{CoreBankingPort}} interface do domain sở hữu ({{holdFunds}}, {{postTransfer}}, {{getAccount}}); (2) {{AcmeWalletAdapter}} dịch mã lỗi T24 sang enum {{RejectReason}} vài chục giá trị, mã lạ → {{UNKNOWN_CORE_ERROR}} + alert; (3) ACL xử lý COB: store-and-forward queue, hạch toán sau batch; (4) Idempotency store + circuit breaker bảo vệ core; (5) ArchUnit test cấm import T24 SDK ngoài package ACL. **Kết quả đo được:** Nâng cấp T24 chỉ sửa ACL (1 team, 3 ngày thay vì 9 tuần), mã lỗi T24 không còn rò ra API, 0 sự cố COB 12 tháng, mapping mã lỗi có test tự động với sample thật từ sandbox T24.

### Trả lời mẫu khi phỏng vấn
"Anti-corruption layer là lớp dịch giữa bounded context mới và legacy: domain mới chỉ nói qua port bằng ngôn ngữ của mình ({{holdFunds}}, {{postTransfer}}, {{Money}}), ACL lo giao thức core, mapping mã lỗi/sản phẩm, idempotency, timeout, COB. Tôi từng gặp 3 kênh số dùng chung T24 SDK, nâng cấp T24 mất 9 tuần, mã lỗi T24 rò ra API mobile. Giải pháp: {{CoreBankingPort}} interface do domain sở hữu, adapter dịch mã lỗi T24 sang enum {{RejectReason}}, ACL xử lý COB store-and-forward, ArchUnit cấm import T24 SDK ngoài ACL. Kết quả: nâng cấp T24 3 ngày, 0 rò rỉ mã lỗi. Trade-off: thêm hop độ trễ, mapping bảo trì, rủi ro bottleneck tổ chức. ACL tốt là grep codebase kênh số không thấy mã lỗi/core field nào ngoài ACL."

> Senior tip: thước đo một ACL tốt là grep codebase của các kênh: không được thấy mã lỗi, tên field hay mã giao dịch của core ở bất kỳ đâu ngoài ACL. Tôi đưa điều đó thành test kiến trúc, và yêu cầu mọi mã lỗi lạ từ core sinh alert thay vì bị map âm thầm thành "lỗi hệ thống".`,
  follow: [
    'Core banking không có API idempotent: ACL đảm bảo không hạch toán hai lần khi timeout thế nào?',
    'Bạn xây read model lịch sử giao dịch từ core bằng CDC hay bằng file cuối ngày? Trade-off?',
    'Lộ trình chuyển đổi core banking (core migration) trong khi kênh số vẫn chạy 24/7?'
  ],
  tags: ['anti-corruption layer', 'DDD', 'core banking', 'legacy', 'integration', 'strangler fig']
},
{
  id: 'architecture-020',
  topic: 'architecture',
  level: 'senior',
  q: 'Cho ví dụ dùng Template Method, Observer và Chain of Responsibility trong code nghiệp vụ thật (không phải ví dụ sách giáo khoa). Mỗi pattern có bẫy gì khi dùng với Spring?',
  a: `**Tóm tắt:** **Template Method** cố định khung quy trình ở lớp cha, cho lớp con thay từng bước (import file sao kê của nhiều ngân hàng). **Observer** cho phép phát sự kiện mà không biết ai nghe (đơn hàng thanh toán xong → tích điểm, gửi email); trong Spring là {{ApplicationEventPublisher}} + {{@EventListener}}/{{@TransactionalEventListener}}. **Chain of Responsibility** chuyển request qua chuỗi handler, mỗi handler xử lý hoặc chặn (chuỗi kiểm tra trước khi chuyển tiền). Bẫy chính: Template Method dựa vào kế thừa nên dễ cứng; listener mặc định chạy **đồng bộ trong cùng transaction**; chuỗi handler phụ thuộc thứ tự cần khai báo rõ.

### Template Method: import sao kê đối soát
~~~java
public abstract class StatementImportJob {
    public final ImportReport run(Path file) {           // final: khung không đổi
        List<RawLine> lines = read(file);
        List<StatementTxn> txns = lines.stream().map(this::parseLine).toList(); // bước thay đổi
        validate(txns);                                    // bước chung
        ImportReport report = reconcile(txns);             // bước chung
        afterImport(report);                               // hook tuỳ chọn
        return report;
    }
    protected abstract StatementTxn parseLine(RawLine line); // mỗi ngân hàng một format
    protected void afterImport(ImportReport r) {}           // mặc định không làm gì
}
~~~
Bẫy: thêm nhiều hook và cờ dần biến lớp cha thành god class; lớp con override nhầm bước không nên override. Cách hiện đại hơn là **callback/strategy** truyền vào (đúng như {{JdbcTemplate}}, {{TransactionTemplate}}, {{RestClient}} của Spring làm): khung cố định, phần thay đổi là lambda, không cần kế thừa.

### Observer: Spring application event
~~~java
@Transactional
public void markPaid(OrderId id) {
    order.markPaid();
    publisher.publishEvent(new OrderPaid(id, order.total()));
}

@Component
class LoyaltyListener {
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)   // chỉ chạy khi đơn đã commit
    @Transactional(propagation = Propagation.REQUIRES_NEW)              // cần transaction mới để ghi DB
    public void on(OrderPaid e) { loyalty.addPoints(e.orderId(), e.total()); }
}
~~~
Bẫy thực tế:
- {{@EventListener}} thường chạy **đồng bộ, cùng thread, cùng transaction**: listener ném exception làm rollback cả đơn hàng; listener chậm làm API chậm.
- {{@TransactionalEventListener}} AFTER_COMMIT: transaction gốc đã commit, ghi DB trong listener phải dùng transaction mới (REQUIRES_NEW), nếu không thay đổi có thể không được lưu.
- Event trong bộ nhớ **mất khi app crash** sau commit: việc quan trọng (gửi tiền, gửi sang hệ thống khác) cần outbox hoặc Event Publication Registry của Spring Modulith.
- Thêm {{@Async}} thì listener chạy thread khác, mất context (transaction, security, MDC) nếu không cấu hình truyền.

### Chain of Responsibility: kiểm tra trước khi chuyển tiền
~~~java
public interface TransferCheck { void check(TransferContext ctx); }  // ném exception để chặn

@Component @Order(10) class AccountStatusCheck implements TransferCheck { ... }
@Component @Order(20) class DailyLimitCheck     implements TransferCheck { ... }
@Component @Order(30) class BlacklistCheck      implements TransferCheck { ... }
@Component @Order(40) class FraudScoreCheck     implements TransferCheck { ... } // gọi service ngoài, đặt cuối

@Service
class TransferValidator {
    private final List<TransferCheck> checks;      // Spring inject theo thứ tự @Order
    TransferValidator(List<TransferCheck> checks) { this.checks = checks; }
    void validate(TransferContext ctx) { checks.forEach(c -> c.check(ctx)); }
}
~~~
Thêm kiểm tra mới = thêm một bean, không sửa validator. Đặt check rẻ và hay chặn lên trước, check đắt (gọi mạng) xuống cuối. Spring Security {{SecurityFilterChain}} và Servlet {{Filter}} là CoR cùng ý tưởng (handler có thể gọi tiếp hoặc dừng chuỗi).

Bẫy: quên {{@Order}} thì thứ tự không được đảm bảo; handler có side effect (trừ hạn mức) ở giữa chuỗi mà handler sau chặn thì phải hoàn tác. Giữ handler **thuần kiểm tra**, side effect làm sau khi cả chuỗi qua.

### Khi nào KHÔNG dùng
| Pattern | Không dùng khi |
|---|---|
| Template Method | Chỉ có một biến thể; hoặc nhiều trục thay đổi độc lập (dùng strategy) |
| Observer | Bên phát cần kết quả của bên nghe, hoặc thứ tự giữa listener quan trọng |
| CoR | Chỉ 2 bước cố định; if tuần tự rõ ràng hơn |

### Ví dụ đời thực
Một hệ thống thanh toán xử lý 500k giao dịch/ngày. **Triệu chứng:** Deploy version 2.3.1 làm lỗi thanh toán VNPAY — khách không nhận email xác nhận, đơn hàng bị tạo trùng khi khách retry, tiền bị trừ 2 lần. Log chỉ thấy "transaction rolled back" nhưng DB vẫn có đơn commit từ các lần retry. Team debug 6 giờ mới tìm ra nguyên nhân. **Điều tra:** {{OrderService.create()}} có {{@Transactional}} (REQUIRED), bên trong gọi {{this.sendConfirmationEmail()}} có {{@Transactional(propagation = REQUIRES_NEW)}}. Gọi {{this.method()}} trong cùng class là self-invocation: **bỏ qua proxy**, nên REQUIRES_NEW không áp dụng và {{sendConfirmationEmail}} chạy cùng transaction với {{create()}}. Khi SMTP ném exception, cả hai cùng rollback; đơn không tạo, email không gửi — log chỉ in "transaction rolled back" của transaction ngoài nên team nhầm rằng order đã commit và email lỗi riêng. Khách không thấy xác nhận → retry thanh toán → tạo trùng đơn, trừ tiền 2 lần. **Nguyên nhân gốc:** Self-invocation bypass proxy — {{@Transactional}} trên method gọi bằng {{this()}} bị bỏ qua hoàn toàn. Code review không bắt được vì "logic trông đúng", test integration pass vì SMTP mock không timeout. **Xử lý:** (1) Tách {{sendConfirmationEmail}} ra {{NotificationService}} bean riêng; (2) Thêm ArchUnit rule: method {{@Transactional}} không được gọi method {{@Transactional}} khác trong cùng class; (3) Ép CGLIB qua {{spring.aop.proxy-target-class=true}} và tránh {{final}} class/method; (4) Viết test integration thực sự timeout SMTP. **Kết quả đo được:** 0 sự cố self-invocation 12 tháng sau; deploy payment an tâm hơn; team mới onboarding đọc ArchUnit report hiểu quy tắc ngay.

### Trả lời mẫu khi phỏng vấn
"Template Method cố định khung quy trình ở lớp cha, lớp con thay bước cụ thể (import sao kê ngân hàng). Observer phát sự kiện không biết ai nghe (đơn hàng xong → tích điểm, gửi email); Spring dùng ApplicationEventPublisher + @EventListener/@TransactionalEventListener. Chain of Responsibility chuyển request qua chuỗi handler (kiểm tra trước khi chuyển tiền). Bẫy: Template Method dùng kế thừa dễ cứng; listener mặc định chạy đồng bộ cùng transaction, lỗi listener rollback giao dịch chính; CoR phụ thuộc @Order, quên thì thứ tự sai. Tôi từng debug 6 giờ bug trừ tiền 2 lần do {{OrderService.create()}} gọi {{this.sendEmail()}} có REQUIRES_NEW — self-invocation bỏ qua proxy, transaction không tách. Sửa: tách bean riêng hoặc inject self. Khi debug transaction không rollback hay cache không ăn, tôi xem class bean có hậu tố {{$$SpringCGLIB$$}} và kiểm tra lời gọi có qua proxy."

> Senior tip: Observer trong process là thứ tôi thấy gây sự cố nhiều nhất: dev nghĩ "phát event là tách rời rồi" nhưng listener lỗi vẫn làm rollback giao dịch chính, hoặc ngược lại event mất khi pod restart. Luôn hỏi: listener này chạy trong transaction nào, thread nào, và nếu app chết ngay sau commit thì sao?`,
  follow: [
    'Thứ tự giữa nhiều @EventListener cho cùng một event được xác định thế nào?',
    'Template Method và Strategy: bạn chọn cái nào cho bài import file nhiều định dạng, vì sao?',
    'Làm sao trả về tất cả lỗi kiểm tra thay vì dừng ở lỗi đầu tiên trong chuỗi CoR?'
  ],
  tags: ['Template Method', 'Observer', 'Chain of Responsibility', 'Spring events', 'design pattern']
,
  refs: [
    { type: 'doc', title: 'Refactoring.Guru: Template Method', url: 'https://refactoring.guru/design-patterns/template-method' },
    { type: 'doc', title: 'Refactoring.Guru: Observer', url: 'https://refactoring.guru/design-patterns/observer' },
    { type: 'doc', title: 'Refactoring.Guru: Chain of Responsibility', url: 'https://refactoring.guru/design-patterns/chain-of-responsibility' },
  ]
},
{
  id: 'architecture-021',
  topic: 'architecture',
  level: 'senior',
  q: 'Sau hai năm, kiến trúc Hexagonal của dự án đã "mục": domain import JPA, controller gọi thẳng repository, package vòng tròn. Bạn dùng ArchUnit và các quy tắc phụ thuộc thế nào để giữ kiến trúc không bị xói mòn?',
  a: `**Tóm tắt:** Quy tắc kiến trúc chỉ nằm trong wiki thì sẽ bị vi phạm; phải biến nó thành **test chạy trong CI**. ArchUnit đọc bytecode và cho viết luật bằng Java: domain không phụ thuộc Spring/JPA, tầng nào được gọi tầng nào, không có vòng phụ thuộc giữa các package/slice, quy ước đặt tên. Với codebase đã vi phạm, dùng **FreezingArchRule** để ghi nhận vi phạm hiện có và chỉ chặn vi phạm mới, rồi giảm dần. Kết hợp thêm ranh giới cứng hơn (Maven/Gradle multi-module) cho những luật quan trọng nhất.

### Vì sao kiến trúc xói mòn
- Deadline: "gọi repository từ controller cho nhanh".
- Người mới không biết quy ước; reviewer không nhìn thấy import ở file không được sửa trong diff.
- IDE tự động import class đầu tiên tìm thấy.
Mỗi vi phạm nhỏ trông vô hại; sau 200 vi phạm, việc đổi persistence hay tách module trở thành không thể.

### Bộ luật ArchUnit cơ bản
~~~java
@AnalyzeClasses(packages = "com.bank.payment", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest   // domain thuần: không biết Spring, JPA, web
    static final ArchRule domainIsPure = noClasses().that().resideInAPackage("..domain..")
        .should().dependOnClassesThat()
        .resideInAnyPackage("org.springframework..", "jakarta.persistence..", "..adapter..");

    @ArchTest   // tầng: web -> application -> domain; adapter chỉ đi vào qua port
    static final ArchRule layers = layeredArchitecture().consideringAllDependencies()
        .layer("Web").definedBy("..adapter.web..")
        .layer("Persistence").definedBy("..adapter.persistence..")
        .layer("Application").definedBy("..application..")
        .layer("Domain").definedBy("..domain..")
        .whereLayer("Web").mayNotBeAccessedByAnyLayer()
        .whereLayer("Persistence").mayNotBeAccessedByAnyLayer()
        .whereLayer("Application").mayOnlyBeAccessedByLayers("Web")
        .whereLayer("Domain").mayOnlyBeAccessedByLayers("Application", "Web", "Persistence");

    @ArchTest   // không vòng phụ thuộc giữa các feature package
    static final ArchRule noCycles = slices().matching("com.bank.payment.(*)..").should().beFreeOfCycles();
}
~~~
Domain được Application, Web và Persistence truy cập theo chiều phụ thuộc vào trong; Persistence adapter **implement port** do domain sở hữu (DIP), còn domain không phụ thuộc ngược vào adapter.

### Codebase đã vi phạm: freeze rồi giảm dần
~~~java
@ArchTest
static final ArchRule domainIsPureFrozen = FreezingArchRule.freeze(domainIsPure);
~~~
Lần chạy đầu, ArchUnit lưu danh sách vi phạm hiện có vào một "violation store" (mặc định là thư mục file text, commit vào repo). Từ đó test chỉ fail khi có **vi phạm mới**; vi phạm cũ được sửa sẽ tự rời khỏi store. Team thấy rõ số vi phạm giảm theo thời gian, không cần "big bang".

### Luật hay dùng khác
- Controller không truy cập repository trực tiếp.
- Class có {{@Transactional}} chỉ nằm ở tầng application.
- Không dùng {{java.util.Date}}, {{LocalDateTime.now()}} không có Clock trong domain (để test được thời gian).
- Package của đối tác A không import package của đối tác B.
- Tên: class trong {{..adapter.web..}} kết thúc bằng {{Controller}}.

### So sánh các cơ chế giữ ranh giới
| Cơ chế | Mức chặn | Ưu | Nhược |
|---|---|---|---|
| Quy ước + review | Người | Không tốn gì | Không bền |
| ArchUnit | Test trong CI | Linh hoạt, luật tuỳ ý, freeze được | Chỉ phát hiện khi chạy test |
| Maven/Gradle multi-module | Compiler | Không thể vi phạm (không có trên classpath) | Cứng, nhiều module tốn công build |
| Spring Modulith verify | Test | Hiểu khái niệm module, sinh tài liệu | Theo quy ước package của Modulith |
| JPMS (module-info) | Compiler + runtime | Chặt nhất | Ma sát với reflection, framework |

Cách thực dụng: luật quan trọng nhất (domain không phụ thuộc hạ tầng) có thể đẩy lên mức module build; phần còn lại dùng ArchUnit.

### Pitfall
- Luật viết sai package pattern nên luôn pass (không match class nào). ArchUnit mặc định báo lỗi khi phần {{should}} không nhận class nào; cấu hình {{archRule.failOnEmptyShould=false}} sẽ tắt bảo vệ này, nên chỉ dùng {{allowEmptyShould(true)}} khi rỗng là có chủ ý.
- Viết quá nhiều luật chi li, team bắt đầu thêm ngoại lệ hàng loạt. Bắt đầu với 3–5 luật có lý do rõ ràng, ghi lý do trong {{because(...)}}.

### Ví dụ đời thực
Một fintech 3 năm, team 12 dev, modular monolith 8 module. **Triệu chứng:** Sprint 15, module Billing deploy gây lỗi module Pricing — test Pricing pass nhưng production tính phí sai cho 4.000 đơn trong 2 giờ. Nguyên nhân: Billing thêm cột {{discount_percent}} vào bảng {{orders}} (JPA entity), Pricing đọc entity này trực tiếp thay vì qua port. **Điều tra:** ArchUnit check chưa có (chỉ có sơ đồ architecture). Domain Pricing import {{jakarta.persistence}} và dùng {{OrderJpaEntity}} thay vì {{Order}} domain. Mapping thủ công giữa domain/JPA entity bị bỏ qua vì "nhanh". **Nguyên nhân gốc:** Không enforce dependency rule; team áp dụng Clean Architecture chỉ trên sơ đồ, code thực tế domain phụ thuộc JPA, adapter lẫn lộn. **Xử lý:** (1) Viết ArchUnit test: {{noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAPackage("..persistence..")}}; (2) Bắt buộc mapping domain ↔ JPA entity bằng {{MapStruct}} trong adapter; (3) CI fail nếu ArchUnit violation; (4) Refactor Pricing: tạo {{OrderRepository}} port, implement {{JpaOrderRepository}} adapter, Pricing chỉ dùng {{Order}} domain. **Kết quả đo được:** 0 violation ArchUnit sau 6 tháng; deploy module độc lập không còn gây lỗi chéo; onboarding dev mới đọc ArchUnit report hiểu ranh giới module 30 phút thay vì 2 tuần.

### Trả lời mẫu khi phỏng vấn
"ArchUnit biến quy tắc kiến trúc thành test CI. Luật cốt lõi: domain không phụ thuộc Spring/JPA/adapter; tầng web/application/persistence chỉ truy cập domain theo chiều phụ thuộc vào trong; không cycle giữa feature package. Dùng {{FreezingArchRule}} cho codebase đã vi phạm: ghi nhận vi phạm cũ, chỉ chặn vi phạm mới, giảm dần. Tôi từng gặp modular monolith 8 module: Billing deploy làm sai Pricing vì domain Pricing đọc JPA entity của Billing. Sửa: ArchUnit cấm domain import persistence, bắt buộc {{MapStruct}} mapping, CI fail violation. 6 tháng sau 0 violation, deploy độc lập, onboarding 30 phút. Luật quan trọng đẩy lên {{Maven}} module, còn lại {{ArchUnit}}. Luôn kèm {{.because()}} viết ngôn ngữ nghiệp vụ để dev hiểu lý do."

> Senior tip: tôi luôn kèm {{.because("...")}} vào từng luật, viết bằng ngôn ngữ nghiệp vụ ("domain phải test được không cần DB"). Khi test fail, dev đọc được lý do thay vì nghĩ đây là luật quan liêu và tìm cách lách.`,
  follow: [
    'Bạn áp dụng ArchUnit cho một codebase có 500 vi phạm sẵn mà không làm team nản thế nào?',
    'Khi nào nên nâng một luật từ ArchUnit lên thành ranh giới Maven module?',
    'Viết luật ArchUnit cấm gọi LocalDateTime.now() trong domain và giải thích vì sao luật đó hữu ích.'
  ],
  tags: ['ArchUnit', 'architecture test', 'hexagonal', 'dependency rules', 'package cycle']
,
  refs: [
    { type: 'doc', title: 'ArchUnit User Guide', url: 'https://www.archunit.org/userguide/html/000_Index.html' },
  ]
},
{
  id: 'architecture-022',
  topic: 'architecture',
  level: 'lead',
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide (multitenancy)', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' },
    { type: 'doc', title: 'PostgreSQL: Row Security Policies', url: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html' },
  ],
  q: 'Bạn xây nền tảng SaaS (ví dụ phần mềm quản lý bán hàng hoặc core cho nhiều quỹ tín dụng) phục vụ 2.000 khách hàng doanh nghiệp. So sánh database-per-tenant, schema-per-tenant và discriminator column; triển khai với Hibernate 6 thế nào và những bẫy rò rỉ dữ liệu giữa tenant?',
  a: `**Tóm tắt:** Ba mức cô lập đánh đổi giữa **an toàn/linh hoạt** và **chi phí/vận hành**. Database-per-tenant cô lập mạnh nhất, dễ đáp ứng yêu cầu khách lớn nhưng tốn tài nguyên và khó migrate hàng nghìn DB. Schema-per-tenant là trung gian. Discriminator column (một cột {{tenant_id}} trên mọi bảng) rẻ và dễ scale số tenant nhất nhưng một câu query quên điều kiện là lộ dữ liệu của khách khác. Hibernate 6 hỗ trợ cả hai kiểu: {{MultiTenantConnectionProvider}} cho DB/schema riêng, {{@TenantId}} cho discriminator. Thực tế thường **lai**: đa số tenant nhỏ dùng chung (discriminator + Row Level Security), tenant lớn hoặc yêu cầu đặc biệt có DB riêng.

### So sánh
| Tiêu chí | DB per tenant | Schema per tenant | Discriminator column |
|---|---|---|---|
| Cô lập dữ liệu | Mạnh nhất | Khá (chung instance) | Phụ thuộc code + RLS |
| Noisy neighbor | Ít | Chung CPU/IO instance | Chung tất cả |
| Chi phí với 2.000 tenant | Cao | Trung bình | Thấp |
| Migration schema | 2.000 lần chạy | 2.000 lần chạy | 1 lần |
| Backup/restore một tenant | Dễ | Khá dễ | Khó (phải lọc dữ liệu) |
| Connection pool | Pool theo DB, bùng nổ connection | Dùng chung pool, đổi schema | Dùng chung |
| Tuỳ biến theo khách | Dễ | Khá | Khó |

Ước lượng vì sao DB-per-tenant khó với nhiều tenant: 2.000 DB × pool tối thiểu 5 connection = 10.000 connection mỗi instance ứng dụng; với 10 instance là 100.000, vượt xa mức PostgreSQL chịu nổi nếu không có PgBouncer và pool lười (tạo khi cần, đóng khi rảnh).

### Xác định tenant hiện tại
Tenant lấy từ claim đã xác thực hoặc subdomain/host sau khi đối chiếu tenant đó với quyền của người dùng; host cũng là dữ liệu do client gửi nên không được tin cậy một mình. Lưu trong context theo request:
~~~java
@Component
class TenantResolver implements CurrentTenantIdentifierResolver<String>, HibernatePropertiesCustomizer {
    @Override public String resolveCurrentTenantIdentifier() {
        return TenantContext.current().orElseThrow(() -> new IllegalStateException("Tenant context is required"));
    }
    @Override public boolean validateExistingCurrentSessions() { return true; }
    @Override public void customize(Map<String, Object> props) {
        props.put(AvailableSettings.MULTI_TENANT_IDENTIFIER_RESOLVER, this); // đăng ký với Hibernate
    }
}
// TenantContext: ThreadLocal set trong filter sau khi xác thực, clear trong finally
~~~
(Resolver có generic từ Hibernate 6.4; Hibernate 6.2 dùng interface không generic và trả về {{String}}. Không nên dùng tenant mặc định kiểu "system" để né lỗi thiếu context; batch/admin phải chọn tenant tường minh.)

### Discriminator với @TenantId
~~~java
@Entity
class Invoice {
    @Id Long id;
    @TenantId String tenantId;   // Hibernate tự gán khi insert và tự thêm điều kiện tenant vào truy vấn HQL/Criteria
    BigDecimal amount;
}
~~~
**Không bao phủ native SQL** và truy vấn qua {{JdbcTemplate}}; đó là chỗ rò rỉ hay gặp. Lớp bảo vệ thứ hai: **PostgreSQL Row Level Security**: bật RLS trên bảng, policy so {{tenant_id}} với tenant trong cấu hình DB. Với connection pool, đặt tenant trong transaction bằng {{SET LOCAL}} hoặc {{set_config(..., true)}} để trạng thái không rò sang lần mượn connection sau; nếu dùng session setting thì phải reset chắc chắn. RLS không áp cho owner của bảng trừ khi bật {{FORCE ROW LEVEL SECURITY}}, nên ứng dụng phải chạy bằng role không phải owner và không có quyền bypass RLS.

### Schema/DB per tenant
Cài {{MultiTenantConnectionProvider}}: với schema-per-tenant, lấy connection từ pool chung rồi {{connection.setSchema(schema)}}, trả về thì đặt lại schema mặc định; chỉ chọn schema từ registry đã kiểm soát, không ghép trực tiếp tenant tùy ý. Với DB-per-tenant, tra map tenant → DataSource (tạo lười). Migration: chạy Flyway lần lượt cho từng schema/DB, theo đợt, có theo dõi tenant nào lỗi để chạy lại.

### Các bẫy rò rỉ dữ liệu
- **Thread pool, {{@Async}}, CompletableFuture:** ThreadLocal không tự đi theo; tenant của request trước còn sót lại nếu quên clear. Dùng TaskDecorator để truyền và xoá context.
- **Cache:** key Redis/Caffeine thiếu tenant → khách A thấy dữ liệu khách B. Bắt buộc prefix tenant.
- **Kafka/batch:** message phải mang tenant trong header; consumer set context trước khi xử lý.
- **Search index, file trên S3, log:** cùng nguyên tắc, mỗi kho dữ liệu đều cần phân tách tenant.
- **Báo cáo tổng hợp toàn hệ thống:** chạy bằng tài khoản riêng, có audit.

### Lộ trình gợi ý
Bắt đầu với discriminator + RLS cho đa số; thiết kế sẵn khả năng "chuyển tenant lớn sang DB riêng" (routing theo tenant, dữ liệu export/import theo tenant). Khách hàng yêu cầu cô lập (ngân hàng, quỹ có quy định) thì cấp DB riêng ngay, tính phí tương ứng.

### Ví dụ đời thực
  Một công ty cung cấp phần mềm quản lý bán hàng cho 2.000 khách hàng doanh nghiệp đang dùng chung discriminator column + Row Level Security trên PostgreSQL. **Triệu chứng:** một khách hàng A phàn nàn thấy được hóa đơn của khách hàng B trong lịch sử giao dịch. **Điều tra:** kiểm tra log application thấy request của tenant A đi vào với {{tenant_id = 'A'}} đúng; tra PostgreSQL với {{sql SELECT * FROM pg_stat_activity WHERE state = 'active'\g}} thấy kết nối được dùng lại trong pool — một connection vừa xử lý tenant A xong, chưa set {{SET LOCAL app.tenant_id = 'B'}} cho tenant B, mà tenant B dùng lại luôn connection đó. **Nguyên nhân gốc:** ứng dụng dùng chung connection pool và set tenant context bằng session-level setting thay vì transaction-level; khi tenant B mượn connection, tenant_id vẫn còn giá trị 'A' từ tenant trước. **Xử lý:** (1) đổi {{SET LOCAL}} (transaction-level) thay vì {{SET}} (session-level), đảm bảo reset trong {{finally}}; (2) thêm PgBouncer với {{pool_mode = transaction}} để kết nối được trả về pool ở trạng thái sạch; (3) thêm middleware set {{tenant_id}} ngay khi bắt đầu transaction và clear sau commit/rollback; (4) chạy bộ test tenant isolation tự động trong CI: tạo dữ liệu cho hai tenant, gọi mọi endpoint với token A và khẳng định không có bản ghi nào của B. **Kết quả:** sau 2 tuần, không còn sự cố rò rỉ, connection pool vẫn dùng chung được 4.000 tenant mà không cần tách DB.

### Trả lời mẫu khi phỏng vấn
  "Khi hỏi về multi-tenancy, tôi bắt đầu bằng cách so sánh ba mô hình: database-per-tenant cô lập mạnh nhất nhưng với 2.000 tenant thì connection pool bùng nổ — 100.000 connection nếu không có PgBouncer; schema-per-tenant là trung gian; discriminator column với một cột tenant_id trên mọi bảng là rẻ và dễ scale nhất. Với Hibernate 6, tôi dùng {{@TenantId}} trên entity để Hibernate tự thêm điều kiện tenant vào truy vấn HQL/Criteria, kết hợp {{MultiTenantConnectionProvider}} để chọn schema hoặc DB. Cơ chế then chốt là {{CurrentTenantIdentifierResolver}} set tenant từ claim xác thực vào ThreadLocal, và một middleware set {{SET LOCAL app.tenant_id = 'B'}} trong transaction để PostgreSQL Row Level Security là lớp bảo vệ thứ hai. Trade-off lớn nhất là rò rỉ dữ liệu: nếu developer viết native SQL quên tenant_id, hoặc pool dùng lại connection chưa reset, hoặc cache key thiếu tenant prefix — thì dữ liệu tenant này lọt sang tenant kia. Vì vậy tôi luôn có bộ test tenant isolation trong CI và dùng {{SET LOCAL}} thay vì {{SET}}. Kinh nghiệm thực tế: với 2.000 tenant, discriminator + RLS là lựa chọn phổ biến; tenant lớn hoặc có yêu cầu pháp lý đặc biệt (ngân hàng, quỹ tín dụng) thì cấp DB riêng ngay, tính phí tương ứng."

  > Senior tip: tôi viết một bộ test tự động "tenant isolation": tạo dữ liệu cho hai tenant, gọi mọi API list/search/export bằng token tenant A và khẳng định không có bản ghi nào của B. Bộ test này chạy trong CI cho mọi endpoint mới, vì lỗi rò rỉ giữa tenant là loại sự cố làm mất khách nhanh nhất của một SaaS.`,
  follow: [
    'Một tenant lớn chiếm 40% tải và làm chậm các tenant khác trên cùng DB: bạn xử lý thế nào?',
    'Cách migrate một tenant từ shared schema sang database riêng mà không downtime?',
    'Truyền tenant context qua virtual thread và @Async trong Spring Boot 3 thế nào cho an toàn?'
  ],
  tags: ['multi-tenancy', 'Hibernate', '@TenantId', 'Row Level Security', 'SaaS', 'PostgreSQL']
},
{
  id: 'design-022', topic: 'design', level: 'lead',
  q: 'Thiết kế ledger cho ví có nhiều transfer đồng thời từ cùng tài khoản. Làm sao ghi bút toán kép, giữ số dư không âm, xử lý retry và đối soát số dư materialized?',
  a: `**Tóm tắt:** Ledger là nguồn sự thật bất biến: một transfer ghi debit và credit cân bằng trong một transaction DB; số dư khả dụng được bảo vệ bằng khóa hoặc conditional update tại DB. Idempotency key duy nhất xử lý retry, còn projection số dư được đối chiếu và dựng lại từ posting thay vì sửa lịch sử.

### Yêu cầu và giả định tải
- Giả định 5 triệu ví hoạt động, 2 triệu transfer/ngày (23/s trung bình), peak 1.000/s vào ngày nhận lương. Đây là giả định sizing, cần thay bằng telemetry.
- Transfer nội bộ all-or-nothing, tổng debit bằng tổng credit theo từng currency, không âm, có lịch sử truy vết. Lịch sử đọc có thể trễ vài giây; xác nhận và kiểm tra hạn mức cần nhất quán mạnh.
- API ghi phải chịu retry của mobile/client sau timeout mà không tạo bút toán thứ hai.

### API và mô hình dữ liệu
- {{POST /transfers}} nhận {{Idempotency-Key}}, source, destination, amountMinor, currency; trả transferId/status. Cùng key, cùng payload trả kết quả đã lưu; cùng key khác payload trả conflict.
- {{GET /transfers/:id}} xem trạng thái; {{GET /accounts/:id/balance}} trả posted, reserved và available balance.
~~~text
transfer(id, client_id, idem_key, payload_hash, status)  UNIQUE(client_id, idem_key)
ledger_txn(id, transfer_id UNIQUE, currency, created_at)
posting(id, txn_id, account_id, side, amount_minor, currency)
account_balance(account_id, currency, posted, reserved, version)
~~~
Amount là integer minor units, không floating point. Idempotency key scope theo client: unique toàn cục khiến hai client trùng key nhận nhầm kết quả của nhau. Balance là projection để đọc nhanh, có thể tái dựng. Constraint kiểm tra amount dương và side hợp lệ; cân bằng nhiều posting phải được đảm bảo trong transaction boundary/service đã kiểm soát.

### Luồng ghi
~~~text
Client -> Transfer API -> DB transaction
                           | insert idempotency + txn
                           | lock accounts theo ID tăng dần
                           | conditional debit + credit postings
                           | update balance + outbox
                           v
                         COMMIT -> event relay
~~~
1. Insert idempotency record bằng {{INSERT ... ON CONFLICT DO NOTHING}} (unique violation thường sẽ abort cả transaction PostgreSQL); nếu đã có, so payload hash và trả kết quả cũ.
2. Khóa hai account theo thứ tự ID tăng dần ({{SELECT ... FOR UPDATE}}) để A→B và B→A song song không deadlock. Debit chỉ thành công khi available >= amount: kiểm tra trên dòng đã khóa, hoặc conditional update {{UPDATE ... WHERE posted - reserved >= :amount}} rồi kiểm tra số dòng = 1. Đọc số dư bằng SELECT thường (không khóa) rồi kiểm tra ở Java và ghi sau là race: hai request cùng thấy đủ tiền.
3. Ghi debit, credit, balance projection, transfer state và outbox event cùng transaction. Chỉ báo thành công sau commit. Không publish Kafka rồi mới commit DB vì hai hệ thống có thể lệch nhau.
4. Outbox relay at-least-once; consumer deduplicate event ID. Với liên ngân hàng, tạo hold rồi gọi network ngoài transaction; sau đó capture hoặc release.

### Nhất quán và lỗi
- Timeout sau commit nhưng trước response: client retry cùng key; unique constraint tìm ra kết quả gốc. Không tạo key mới khi chưa biết kết quả.
- Hai rút tiền song song: row lock hoặc conditional update là chốt chặn; Redis/cache chỉ phục vụ đọc, không quyết định overdraft.
- Một account quá nóng serialize throughput. Shard theo account giữ thứ tự cục bộ; transfer xuyên shard cần state machine/compensation rõ ràng, không giả định transaction phân tán.
- Đối soát kiểm tra tổng debit-credit từng txn và tính lại balance projection theo account. Sai lệch tạo case; điều chỉnh bằng reversal/adjustment posting mới có audit, không UPDATE dòng cũ.
- Cần lưu currency và quy tắc làm tròn rõ ràng; không cộng các currency khác nhau vào một tổng.

### Trade-off và câu hỏi đào sâu
- Balance snapshot giúp đọc O(1) nhưng tăng write coupling; ledger-only read đơn giản hơn về nguồn sự thật nhưng tốn kém khi lịch sử dài.
- Row lock đơn giản, dễ hiểu nhưng account hot giới hạn throughput. Optimistic version giảm lock khi ít tranh chấp, song phải retry transaction và vẫn cần xử lý exhaustion.
- Bạn xử lý refund bằng sửa transfer cũ hay bút toán đảo? Một giao dịch có nhiều account ở shard khác bảo đảm invariant ra sao? DB commit thành công mà response mất thì API retry làm gì?

### Ví dụ đời thực
  Một ví điện tử có 5 triệu ví đang chạy ledger double-entry với balance projection materialized. **Triệu chứng:** vào ngày nhận lương, p99 latency của {{POST /transfers}} tăng từ 120 ms lên 4 giây, và dashboard hiện {{lock_wait}} trung bình 800 ms. **Điều tra:** {{sql SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock' AND wait_event = 'transactionid'\g}} thấy hàng nghìn transaction đang chờ lock trên account_id của tài khoản nhận lương (tài khoản trả lương dùng chung của hàng nghìn nhân viên). **Nguyên nhân gốc:** design dùng {{SELECT ... FOR UPDATE}} trên hai account theo thứ tự ID tăng dần, nhưng account nhận lương có ID nhỏ hơn account chuyển tiền nên lock thứ tự luôn ổn định — tuy nhiên account nhận lương bị hàng nghìn transfer đồng thời tranh lock cùng một dòng account_balance. Row lock đơn giản nhưng không đủ throughput cho account hot. **Xử lý:** (1) chuyển sang optimistic locking với {{version}} column: {{UPDATE account_balance SET posted = posted + ?, version = version + 1 WHERE account_id = ? AND version = ?}}, retry tối đa 3 lần khi version conflict; (2) shard account_balance theo {{hash(account_id) % N}} để account hot không còn là điểm nghẽn duy nhất; (3) thêm read replica cho balance projection, chỉ ghi trên primary. **Kết quả:** p99 trở về 180 ms, không còn lock_wait, và số lượng retry version conflict dưới 0.5% — chấp nhận được cho payment.

### Trả lời mẫu khi phỏng vấn
  "Khi hỏi về ledger, tôi bắt đầu bằng một nguyên tắc: ledger là nguồn sự thật bất biến, không bao giờ UPDATE posting; chỉ append. Một transfer gồm debit và credit cân bằng, ghi trong cùng một DB transaction. Để xử lý retry, tôi dùng idempotency key scoped theo client với unique constraint — cùng key cùng payload trả kết quả cũ, khác payload trả 409. Để giữ số dư không âm khi nhiều transfer đồng thời, tôi dùng hai cách: row lock {{SELECT ... FOR UPDATE}} theo thứ tự account_id tăng dần để tránh deadlock, hoặc optimistic version column với retry. Trade-off là row lock đơn giản nhưng account hot giới hạn throughput; optimistic lock giảm lock nhưng phải retry transaction khi conflict. Projection balance là cache để đọc nhanh, có thể tái dựng từ posting, và phải đối chiếu định kỳ. Kinh nghiệm thực tế: tôi từng thấy account nhận lương bị lock hàng nghìn transfer đồng thời — giải pháp là shard balance theo hash(account_id) và dùng optimistic locking với retry. Luôn monitor lock_wait, version conflict rate và chênh lệch balance projection."

  > Senior tip: monitor idempotency retries, lock wait/deadlock (hoặc version conflict nếu dùng optimistic), outbox age và chênh lệch balance projection. Ledger “cân theo ngày” nhưng không drill-down được tới transfer vẫn khó vận hành.`,
  follow: ['Làm sao ngăn overdraft khi hai request cùng lúc?', 'Có được sửa posting đã ghi không?', 'Bạn rebuild projection thế nào khi ledger liên tục được ghi?'],
  tags: ['ledger', 'double-entry', 'idempotency', 'balance', 'reconciliation']
},
{
  id: 'design-023', topic: 'design', level: 'senior',
  q: 'Thiết kế adapter chuyển khoản nhanh 24/7 qua Napas khi timeout khiến không rõ lệnh đã hoàn tất chưa. Làm sao tránh gửi trùng, quản lý trạng thái và xử lý tra soát?',
  a: `**Tóm tắt:** Timeout ở payment rail là {{UNKNOWN}}, không phải thất bại. Lưu state machine bền vững, reference ổn định, giữ tiền theo chính sách và tra cứu/đối soát trước khi retry lệnh mơ hồ; chỉ trả kết quả cuối khi có bằng chứng xác nhận.

### Yêu cầu và sizing giả định
- Giả định 8 triệu lệnh/ngày (93/s trung bình), peak 1.500/s. Nội bộ cần nhận lệnh nhanh; rail có thể phản hồi trễ nhiều giây. Các số này chỉ dùng sizing, không đại diện số liệu đối tác.
- Giả định về rail: có bản tin gửi lệnh mang reference duy nhất, bản tin tra cứu trạng thái và file đối soát định kỳ. Định dạng bản tin, mã lỗi, timeout và quy trình/thời hạn tra soát cụ thể lấy theo tài liệu kỹ thuật Napas cấp cho ngân hàng thành viên, không tự suy đoán.
- Không ghi nợ hai lần, không báo thất bại khi người nhận đã nhận tiền, không giữ tiền vô hạn. Cần trạng thái cho khách, lịch sử audit và công cụ tra soát.
- Tách “đã nhận lệnh” khỏi “đã thanh toán cuối cùng”.

### API và mô hình
- {{POST /bank-transfers}} nhận clientRequestId duy nhất, beneficiary, amountMinor, currency; trả {{ACCEPTED}} + transferId. Status endpoint và webhook cung cấp cập nhật sau đó.
- Transfer lưu key, payload hash, rail reference, version, state, timestamps/deadline. Attempt là bảng append-only chứa provider, correlation ID, request hash, response code và payload phản hồi đã mask dữ liệu nhạy cảm. Ledger ghi hold/capture/reversal riêng.
- Cùng key, cùng payload trả cùng transfer; cùng key payload khác là conflict. Không log số tài khoản đầy đủ.

### Luồng và state machine
~~~text
RECEIVED -> VALIDATED -> HELD -> SUBMITTED
                                   |
                                   +-- success rõ ràng ----> COMPLETED (capture hold)
                                   +-- reject rõ ràng -----> REJECTED -> RELEASED
                                   +-- timeout/reset/lỗi --> UNKNOWN -> INQUIRY
INQUIRY -> CONFIRMED_SUCCESS -> COMPLETED (capture hold)
INQUIRY -> CONFIRMED_FAILED  -> RELEASED
INQUIRY -> vẫn mơ hồ        -> giữ hold, mở case tra soát
~~~
1. Validate hạn mức và beneficiary; ghi transfer, idempotency và hold trong transaction.
2. Outbox tạo command cho worker. Worker gọi rail ngoài transaction với reference cố định.
3. Response rõ ràng cập nhật state bằng optimistic version. Timeout, socket reset hoặc response hỏng chuyển sang UNKNOWN; giữ hold trong policy window và tạo inquiry.
4. Inquiry dùng API tra cứu hoặc settlement file. Thành công thì capture, thất bại xác nhận thì release; vẫn mơ hồ thì giữ case mở, báo khách đang xử lý và chuyển tra soát.
5. Phản hồi muộn, kết quả tra cứu và file đối soát có thể lặp hoặc đảo thứ tự: xác thực nguồn, dedupe theo reference, chỉ cho phép transition hợp lệ; event cũ không được ghi lùi trạng thái terminal.

### Nhất quán, lỗi và trade-off
- Không có transaction phân tán giữa DB và rail. Outbox tránh mất command sau commit; worker at-least-once cần idempotency phía đối tác. Nếu rail không hỗ trợ idempotency, không retry mù khi kết quả unknown.
- Client timeout không hủy lệnh đã nhận. Retry cùng request ID trả transfer hiện hữu. API đồng bộ chờ rail đơn giản nhưng giữ connection và khuếch đại lỗi; accepted async cần UX polling/callback và vận hành state machine.
- Circuit breaker giảm tải khi rail lỗi: lệnh bị chặn lúc breaker mở chắc chắn chưa gửi nên có thể từ chối hoặc xếp hàng an toàn, nhưng không dùng breaker để đánh dấu lệnh đã SUBMITTED/UNKNOWN là thất bại. Theo dõi unknown count/age, tiền đang hold và inquiry backlog, không chỉ HTTP 5xx.
- Reconciliation ghép internal reference, rail reference, amount, account và status; phân loại thiếu phía mình/đối tác, mismatch, duplicate. Mỗi exception có owner, SLA và bằng chứng.
- Không tự release hold của lệnh UNKNOWN theo timer: chỉ release khi có xác nhận thất bại (tra cứu hoặc file đối soát). Nếu business vẫn chọn release sau deadline thì cần quy trình duyệt trước cho trường hợp xác nhận thành công đến muộn (ghi nợ có thể làm số dư âm, thu hồi, case tra soát), không để số dư âm âm thầm.

### Câu hỏi đào sâu
- Không có inquiry API thì thời điểm nào dùng settlement file để kết luận?
- Làm sao chuyển provider trong lúc lệnh đang chạy mà giữ reference?
- Ai xử lý case unknown vượt SLA và bằng chứng nào được lưu?

### Ví dụ đời thực
  Một ngân hàng đã triển khai adapter Napas 24/7 cho chuyển khoản nhanh. **Triệu chứng:** sau khi timeout 15 giây, application trả về "Giao dịch thất bại" cho khách hàng, nhưng Napas sau đó hoàn tất giao dịch — khách hàng bị trừ tiền twice. **Điều tra:** log application thấy worker gọi rail, timeout sau 15 giây, ghi state = FAILED và release hold. Napas side log cho thấy command đã nhận và processing, response về sau 16 giây. **Nguyên nhân gốc:** ứng dụng coi timeout là thất bại, trong khi với payment rail timeout là {{UNKNOWN}} — không biết lệnh đã hoàn tất hay chưa. Hold được release trong khi command vẫn đang chạy ở rail, và client retry tạo command thứ hai. **Xử lý:** (1) đổi state FAILED thành UNKNOWN, giữ hold trong policy window 30 phút; (2) thêm inquiry API tra cứu trạng thái theo rail reference trước khi retry; (3) chỉ release hold khi có xác nhận thất bại rõ ràng từ inquiry hoặc settlement file; (4) thêm alert theo tuổi UNKNOWN và tổng tiền hold. **Kết quả:** sau 1 tháng, không còn trường hợp trừ tiền twice, và số lượng UNKNOWN peak giảm từ 500/lần xuống còn 12/lần — đều được inquiry giải quyết trong vòng 2 phút.

### Trả lời mẫu khi phỏng vấn
  "Khi hỏi về payment rail timeout, tôi bắt đầu bằng nhận định quan trọng: timeout ở payment rail là UNKNOWN, không phải thất bại. Cơ chế là tôi lưu state machine bền vững với các trạng thái RECEIVED → VALIDATED → HELD → SUBMITTED → UNKNOWN → INQUIRY → COMPLETED/RELEASED. Khi timeout, tôi giữ hold trong policy window và tạo inquiry để tra cứu trạng thái theo rail reference — không bao giờ retry mù khi kết quả unknown, không bao giờ release hold theo timer chỉ. Dùng outbox pattern để không mất command sau commit DB, worker at-least-once với idempotency key phía đối tác. Circuit breaker giảm tải khi rail lỗi nhưng không dùng breaker để đánh dấu lệnh đã SUBMITTED là thất bại. Trade-off là inquiry thêm độ trễ nhưng tránh ghi nợ hai lần; retry mù nhanh hơn nhưng có thể tạo duplicate. Kinh nghiệm thực tế: tôi từng thấy timeout 15 giây được coi là thất bại, dẫn đến trừ tiền twice — giải pháp là giữ hold 30 phút và inquiry trước khi retry. Luôn alert theo tuổi UNKNOWN và tổng tiền hold."

  > Senior tip: alert theo tuổi UNKNOWN và tổng tiền bị hold. Timeout ngắn có thể tạo backlog lớn dù phần lớn lệnh cuối cùng thành công.`,
  follow: ['State nào khách hàng nhìn thấy khi rail còn mơ hồ?', 'Callback cũ có thể ghi lùi state thế nào?', 'Bạn giải quyết case tra soát kéo dài ra sao?'],
  tags: ['Napas', 'payment rail', 'timeout', 'state machine', 'reconciliation']
},
{
  id: 'design-024', topic: 'design', level: 'senior',
  q: 'Thiết kế vòng đời Smart OTP trong ứng dụng ngân hàng: liên kết thiết bị, xác nhận giao dịch, đổi điện thoại và khôi phục tài khoản thế nào để chống chiếm quyền?',
  a: `**Tóm tắt:** Smart OTP là credential gắn với thiết bị và tài khoản, không chỉ là mã số. Enrollment phải xác thực mạnh; challenge ký phải ràng buộc nội dung giao dịch, chống replay và giới hạn thử; quy trình recovery/revoke không được yếu hơn đăng ký ban đầu.

### Yêu cầu và tải giả định
- Giả định 3 triệu user, một triệu xác thực/ngày, peak 500/s. Cần hỗ trợ đăng ký, ký giao dịch, thu hồi khi mất máy và audit.
- Offline OTP có thể có ích nhưng giao dịch vẫn phải kiểm tra challenge phía server. Không ghi seed bí mật vào log/analytics.
- Hạn chế approve nhầm người nhận/số tiền do malware thay nội dung giữa màn hình và server.

### API và dữ liệu
- {{POST /otp-devices/enroll}} tạo challenge; {{POST /otp-devices/confirm}} kích hoạt; {{POST /transactions/:id/challenge}} trả nonce, amount, currency, beneficiary digest và expiry; {{POST /transactions/:id/approve}} gửi proof.
- Device lưu userId, trạng thái PENDING/ACTIVE/REVOKED, encrypted secret reference hoặc public key, timestamps/version. Secret mã hóa bằng KMS/HSM key; chỉ verifier có quyền giải mã.
- Challenge lưu nonce, transactionId, payload hash, expiry, attempt count, consumedAt. Consume bằng conditional update ({{UPDATE ... SET consumed_at = now() WHERE id = :id AND consumed_at IS NULL AND expires_at > now()}}, kiểm tra số dòng = 1), thêm unique constraint trên approval(transaction_id) để không approve hai lần.

### Kiến trúc và luồng
~~~text
Enrollment:  Bank App -> Auth API -> Device Registry -> KMS/HSM (bọc secret)
Giao dịch:   Payment API -> Challenge Store (digest bất biến + nonce + expiry)
                                 |
             Bank App --proof--> OTP Verify <- Device Registry + KMS/HSM
                                 |
                                 v
             consume challenge + approval (idempotent) -> Payment API thực thi
~~~
1. Enrollment yêu cầu factor hiện hữu, risk checks, trạng thái pending; xác nhận qua kênh độc lập/cooling period với thao tác rủi ro cao.
2. Tạo giao dịch thì server đóng băng digest của amount, currency, beneficiary và sinh nonce dùng một lần. App hiển thị nội dung đó; thiết bị tạo OTP/MAC/chữ ký trên challenge.
3. Verify nguyên tử: challenge chưa hết hạn/chưa consume, device active, proof hợp lệ, attempts dưới ngưỡng; consume challenge và tạo approval idempotent cùng transaction boundary. Lần thử sai phải tăng attempt count bằng atomic update và được commit, đừng để rollback xoá mất lần thử sai (attacker thử vô hạn).
4. Đổi máy: revoke cũ, step-up đăng ký mới, cảnh báo kênh cũ và áp hạn chế theo risk policy. Mất máy khẩn cấp cần quy trình xác minh danh tính có audit.

### Chống abuse và failure mode
- TOTP (RFC 6238: HMAC trên bước thời gian, mặc định 30 giây) chỉ chứng minh có seed trong cửa sổ thời gian, không ràng buộc giao dịch khách nhìn thấy. Nếu vẫn dùng thì chỉ chấp nhận lệch tối đa ±1 bước và ghi nhớ bước đã dùng để mã không replay được. Transaction signing/challenge-response giúp chống đổi nội dung, nhưng cần bảo vệ thiết bị và UX hiển thị đáng tin.
- Rate limit theo user, device, IP, transaction và resend; counter phải atomic. Khóa mềm/cooldown tránh attacker gây khóa tài khoản vô thời hạn.
- KMS/HSM lỗi: không tự hạ cấp SMS cho giao dịch rủi ro cao. Từ chối an toàn hoặc dùng fallback được risk policy phê duyệt.
- Push approve tiện nhưng có push fatigue; hiển thị đầy đủ giao dịch, giới hạn push và không dùng nút approve chung cho nhiều request.
- Recovery thường là lỗ hổng lớn: không tắt Smart OTP chỉ dựa trên dữ liệu dễ đoán; mọi enrollment/revoke có thông báo, audit và review bất thường.

### Trade-off và câu hỏi đào sâu
- Offline TOTP dễ triển khai, nhưng challenge response ràng buộc transaction tốt hơn. Public key signing tránh lưu shared secret phía server song cần quản trị key lifecycle.
- Cooling period giảm chiếm quyền nhưng cản khách hợp pháp. Tuning theo amount, device reputation và hành vi, có quy trình hỗ trợ rõ.
- Điện thoại bị malware nhưng seed còn trong keystore thì threat còn gì? Có thể revoke khi registry lỗi? Khách mất cả máy và SIM khôi phục thế nào?

### Ví dụ đời thực
  Một ứng dụng ngân hàng đã triển khai Smart OTP cho 3 triệu user. **Triệu chứng:** sau khi đổi điện thoại, 5.000 user trong ngày không thể đăng ký OTP mới — hệ thống trả về "Thiết bị không hợp lệ" dù đã xác thực bằng OTP email. **Điều tra:** log device registry thấy trạng thái của thiết bị cũ là REVOKED, nhưng challenge verify vẫn check device theo userId mà không filter theo active device; challenge được tạo cho thiết bị cũ đã revoke, và proof từ thiết bị mới không match vì challenge bind với device_id cũ. **Nguyên nhân gốc:** quy trình đổi máy revoke thiết bị cũ nhưng không invalidate challenge đã phát hành cho device_id cũ; challenge store không check device active trước khi consume. **Xử lý:** (1) thêm check {{device.status = 'ACTIVE'}} trong consume challenge; (2) revoke thiết bị cũ đồng thời invalidate tất cả challenge chưa consume của device_id đó; (3) thêm cooling period 24h sau revoke trước khi enrollment mới; (4) thêm test tự động: revoke device, tạo challenge, khẳng định challenge bị từ chối. **Kết quả:** sau 1 tuần, không còn user nào bị lock sau đổi máy, và enrollment mới thành công 99.8%.

### Trả lời mẫu khi phỏng vấn
  "Khi hỏi về Smart OTP, tôi bắt đầu bằng nhận định: Smart OTP là credential gắn với thiết bị và tài khoản, không chỉ là mã số. Cơ chế là enrollment phải xác thực mạnh — yêu cầu factor hiện có, risk checks, cooling period trước khi kích hoạt. Khi tạo giao dịch, server đóng băng digest của amount, currency, beneficiary và sinh nonce dùng một lần; thiết bị tạo OTP/MAC/challenge-response trên challenge đó. Verify là nguyên tử: challenge chưa hết hạn/chưa consume, device active, proof hợp lệ, attempts dưới ngưỡng — consume challenge bằng conditional update {{UPDATE ... SET consumed_at = now() WHERE id = :id AND consumed_at IS NULL AND expires_at > now()}}, kiểm tra số dòng = 1. Trade-off là TOTP (RFC 6238) dễ triển khai nhưng chỉ chứng minh có seed trong cửa sổ thời gian, không ràng buộc giao dịch; challenge-response ràng buộc transaction tốt hơn nhưng cần bảo vệ thiết bị. Kinh nghiệm thực tế: tôi từng thấy user đổi máy bị lock vì challenge vẫn bind với device_id cũ đã revoke — giải pháp là consume challenge phải check device active và revoke invalidate challenge. Recovery là lỗ hổng lớn: không tắt Smart OTP chỉ dựa trên dữ liệu dễ đoán."

  > Senior tip: theo dõi approve rồi reversal, enrollment theo kênh, challenge expiry và lockout false positive. Đo ma sát khách thật cùng hiệu quả chống fraud.`,
  follow: ['TOTP khác transaction signing ở rủi ro nào?', 'Bạn backup secret mà không làm lộ thế nào?', 'Recovery cần kiểm soát nào để tránh social engineering?'],
  tags: ['Smart OTP', 'device binding', 'transaction signing', 'recovery', 'security']
},
{
  id: 'design-025', topic: 'design', level: 'senior',
  q: 'Thiết kế sinh sao kê tháng cho 10 triệu tài khoản. Sao kê phải khớp ledger, chạy lại an toàn, tải riêng tư và không làm ảnh hưởng giao dịch online.',
  a: `**Tóm tắt:** Chốt snapshot nhất quán theo kỳ và watermark, chia workload ổn định, sinh artifact bất biến kèm manifest/checksum. Retry dùng cùng logical job và chỉ publish atomically sau validation; ledger correction phát hành version điều chỉnh thay vì sửa file cũ âm thầm.

### Yêu cầu và sizing giả định
- Giả định 10 triệu tài khoản, 20% hoạt động, 40 posting/tài khoản: 80 triệu dòng. Với 150 byte/dòng là khoảng 12 GB dữ liệu thô chưa tính PDF/nén. Cần benchmark trên schema thật.
- Hoàn thành trong 6 giờ sau chốt kỳ; query không làm cạn primary. Opening + posting trong kỳ = closing theo cùng cut-off, timezone và currency.
- API cho biết trạng thái, khách chỉ tải statement thuộc quyền của mình; bucket private và URL ngắn hạn.

### API và data model
- {{POST /statement-jobs}} tạo job period; {{GET /statements/:account/:period}} trả metadata/status; download API authorize rồi tạo signed URL.
- Job lưu period, watermark, partition, attempt/status. Manifest lưu account, period, ledger watermark, row count, checksum, object key, version/generatedAt.
- Ledger index theo (account_id, booking_time, entry_id); partition thời gian giúp pruning nhưng query account vẫn cần index. Tránh quá nhiều partition nhỏ.

### Kiến trúc và luồng
~~~text
Scheduler -> Job table -> workers -> read replica / snapshot
                              | validate totals
                              v
                    temp object -> checksum -> manifest publish
~~~
1. Chốt kỳ bằng watermark xác định sau khi đóng kỳ kế toán: không nhận thêm posting có booking date thuộc kỳ cũ và chờ các transaction đang chạy commit xong. Không chỉ dựa vào timestamp hay {{max(id)}}: giao dịch đến muộn có thể mang booking time cũ, còn sequence PostgreSQL cấp số trước khi commit nên id nhỏ có thể commit sau id lớn.
2. Chia theo hash(accountId) hoặc range cân bằng; worker claim job bằng lease có expiry, đọc keyset pagination thay OFFSET lớn.
3. Nhất quán nhờ lọc theo watermark của kỳ đã đóng (dữ liệu kỳ cũ không đổi), nên mỗi account đọc bằng transaction ngắn; tránh một transaction REPEATABLE READ kéo dài hàng giờ vì nó giữ xmin, gây bloat hoặc bị hủy do conflict with recovery trên replica. Nếu replica chưa replay tới watermark (so {{pg_last_wal_replay_lsn()}} với {{pg_current_wal_lsn()}} ghi lại lúc chốt kỳ) thì chờ hoặc chọn nguồn khác; không trộn opening và closing của thời điểm khác nhau.
4. Render vào object key tạm theo job+attempt. Kiểm row count/arithmetic/checksum rồi publish manifest version; file dở không bao giờ lộ.
5. API xác minh ownership, ký URL TTL ngắn; encryption, access audit và lifecycle cleanup cho file tạm.

### Retry, consistency và vận hành
- Worker chết: lease hết hạn, worker mới chạy lại logical job; object attempt cũ được dọn. Unique (account, period, version) giữ lịch sử version; partial unique index (account, period) WHERE is_current mới ngăn hai statement current. Publish kiểm tra fencing token (attempt hiện hành) để worker cũ đã mất lease nhưng vẫn chạy không ghi đè.
- Sửa ledger sau phát hành: tạo version điều chỉnh có reason và link bản trước. Không xóa dấu vết hoặc ghi đè âm thầm.
- Điều tiết concurrency theo replica CPU/IO và queue age; pause khi online workload vượt ngưỡng. Checkpoint theo account để retry không cần chạy lại cả kỳ.
- Checksum chứng minh file không đổi, không chứng minh đúng nội dung; cần đối chiếu arithmetic, count và tổng ledger. Dữ liệu PII cần retention/access policy đã được business xác nhận.
- Snapshot vật lý tốn storage nhưng tái lập được; query động rẻ hơn nhưng kết quả đổi theo correction. Chọn theo audit/business requirement, không tự đoán thời hạn lưu.

### Câu hỏi đào sâu
- Giao dịch booking muộn qua ranh giới tháng được phản ánh thế nào?
- PDF phát hành rồi phát hiện thiếu posting thì versioning ra sao?
- Account doanh nghiệp lớn không được làm chậm mọi partition thế nào?

### Ví dụ đời thực
  Một ngân hàng đã triển khai sinh sao kê tháng cho 10 triệu tài khoản. **Triệu chứng:** vào cuối tháng, dashboard cho thấy 12% job timeout sau 6 giờ, và khách hàng A tải statement kỳ 2026-11 nhưng nhận được file của kỳ 2026-10. **Điều tra:** worker log thấy một worker crash giữa chừng sau khi claim job, attempt object còn tồn tại; worker mới chạy lại logical job nhưng không dọn object attempt cũ, và manifest publish không có fencing token — worker cũ (đã mất lease nhưng restart chậm) publish manifest version 2 ghi đè version 1 do worker mới tạo. **Nguyên nhân gốc:** lease expired nhưng worker chưa stop, và publish không kiểm tra fencing token; thêm nữa watermark chốt kỳ dùng {{max(id)}} thay vì cut-off time, nên posting có booking_time cũ nhưng id lớn hơn watermark bị bỏ sót. **Xử lý:** (1) thêm fencing token (attempt number) vào manifest publish, worker mới phải có attempt cao hơn mới được publish; (2) watermark dùng cut-off time confirmed, không dùng max(id); (3) thêm checkpoint theo account để retry không chạy lại cả kỳ; (4) dọn object attempt khi lease expired. **Kết quả:** sau 2 tuần, job completion percentile 95% tăng từ 78% lên 99.6%, và không còn trường hợp tải sai kỳ.

### Trả lời mẫu khi phỏng vấn
  "Khi hỏi về statement generation, tôi bắt đầu bằng chốt kỳ: không nhận thêm posting có booking date thuộc kỳ cũ và chờ các transaction đang chạy commit xong. Watermark phải dùng cut-off time, không dùng max(id) vì posting đến muộn có thể mang booking_time cũ, còn sequence PostgreSQL cấp số trước khi commit nên id nhỏ có thể commit sau id lớn. Chia workload theo hash(accountId) hoặc range, worker claim job bằng lease có expiry, đọc keyset pagination thay vì OFFSET lớn. Nhất quán nhờ lọc theo watermark của kỳ đã đóng — dữ liệu kỳ cũ không đổi, nên mỗi account đọc bằng transaction ngắn; tránh REPEATABLE READ kéo dài hàng giờ vì giữ xmin gây bloat. Retry dùng cùng logical job, object attempt cũ được dọn, và unique (account, period, version) giữ lịch sử version. Publish kiểm tra fencing token để worker cũ đã mất lease nhưng vẫn chạy không ghi đè. Trade-off: snapshot vật lý tốn storage nhưng tái lập được; query động rẻ hơn nhưng kết quả đổi theo correction. Kinh nghiệm thực tế: tôi từng thấy worker crash giữa chừng và publish không có fencing token khiến khách tải sai kỳ — giải pháp là fencing token và checkpoint theo account."

  > Senior tip: dashboard cần completion percentile theo partition, replica lag tại watermark, mismatch count và tuổi job lớn nhất. Tổng số job thành công che mất một partition luôn trễ.`,
  follow: ['Snapshot isolation nào phù hợp khi ledger liên tục ghi?', 'Bạn dọn object tạm khi worker chết ra sao?', 'Làm sao tái lập chính xác statement đã phát hành?'],
  tags: ['statement', 'batch', 'partitioning', 'snapshot', 'object storage']
},
{
  id: 'design-026', topic: 'design', level: 'lead',
  q: 'Fraud model chặn nhầm nhiều khách thật sau một lần đổi rule. Thiết kế quản trị rule, rollout, đo false positive và analyst override mà vẫn giữ quyết định realtime dưới 100 ms.',
  a: `**Tóm tắt:** Runtime realtime dùng rule bundle bất biến, version hóa và đã warm; quản trị/rollout nằm ngoài request path. Replay, shadow và canary phát hiện tác động trước khi mở rộng; quyết định lưu reason, feature freshness và version để giải thích, rollback hoặc kill switch nhanh.

### Yêu cầu và tải giả định
- Giả định 15 triệu giao dịch/ngày, peak 2.000 TPS, toàn bộ fraud check p99 ≤100 ms, phần engine 30 ms. Đây là sizing giả định.
- Output approve/challenge/decline. False positive gây mất khách, false negative gây tổn thất; không tối ưu một metric như AUC đơn lẻ.
- Decision phải truy nguyên input, model/rule version, ngưỡng và người phát hành.

### Data và API
- Payment gọi {{POST /risk/decision}} với transactionId, amount, beneficiary/merchant và device context; trả action, reason codes, decisionId, policy version.
- Rule bundle bất biến gồm version, effectiveAt, owner, approvals, checksum. Decision log lưu version, feature freshness, latency và action; hạn chế PII.
- Online feature store giữ velocity theo account/device/beneficiary, có event-time window và updatedAt. Missing/stale feature phải biểu diễn riêng, không tự coi null là zero.

### Kiến trúc và rollout
~~~text
Payment -> Risk gateway -> bounded feature read -> rules + model -> decision
Events -> stream aggregates -> online feature store
Analyst labels -> case system -> evaluation -> approved bundle
~~~
1. Online path có timeout chặt và local cached bundle. Không gọi warehouse hoặc service có latency không giới hạn.
2. Hard safety rules trước, scoring/rule tiếp theo; map score sang action. Decision log gửi async durable buffer, không để log sink treo payment.
3. Offline replay phải tái tạo point-in-time feature (tránh label leakage), rồi shadow mode, canary cohort nhỏ, tăng dần. So latency, approval, challenge, complaint và matured loss.
4. Analyst review case theo SLA; label có nguồn và confidence. Chargeback (thẻ) và khiếu nại/tra soát (chuyển khoản) đến muộn nhiều tuần nên dashboard tách proxy sớm (challenge rate) khỏi loss đã trưởng thành.

### False positive và failure mode
- Không coi mọi decline là fraud. Đo trên mẫu xác minh/label, cohort theo kênh, merchant, device, khách mới/cũ; báo confidence interval và label delay.
- Bundle có kill switch/rollback theo version. Fallback khi feature store chậm là chính sách risk owner phê duyệt: challenge, decline hoặc capped approval theo exposure; platform không tự chọn.
- Analyst override cần role access, reason, audit, expiry; không cho phép bỏ qua hard control vô hạn.
- Shadow mode tốn compute; giới hạn traffic. Dữ liệu replay phải dùng feature tại thời điểm quyết định. Theo dõi drift, missingness và thay đổi mùa vụ.
- Rule dễ giải thích/cập nhật, nhưng bị né; model bắt tổ hợp tinh vi nhưng khó giải thích. Kết hợp hai loại và đo kết quả theo cohort.

### Trade-off và câu hỏi đào sâu
- Ngưỡng challenge dựa trên expected loss, chi phí ma sát và năng lực review, không chỉ precision.
- Nếu audit sink không ghi được, policy có thể yêu cầu fail closed ở một số giao dịch; quyết định phụ thuộc risk appetite và quy định nội bộ đã xác minh.
- Làm sao phân biệt drift với mùa vụ? Fallback approve có cap exposure nào? Analyst tự tạo rule thế nào mà vẫn có kiểm soát?

### Ví dụ đời thực
  Một công ty fintech đã triển khai rule bundle mới chặn giao dịch từ thiết bị mới có velocity cao. **Triệu chứng:** sau khi rollout phiên bản bundle v12, false positive tăng gấp 3 — khoảng 400 khách thật/ngày bị decline, chủ yếu khách nhận lương vào ngày cố định dùng thiết bị mới. **Điều tra:** dashboard decision log thấy action = DECLINE, rule version = v12, reason code = NEW_DEVICE_HIGH_VELOCITY, feature freshness bình thường; log gateway không lỗi latency (p99 45 ms < 100 ms). **Nguyên nhân gốc:** rule mới chưa qua shadow mode, việc chỉnh ngưỡng velocity từ 3 lên 5 giao dịch/giờ bỏ qua đánh giá trên khách thật, và analyst override không có expiry nên rule cũ còn chồng chéo. **Xử lý:** (1) kill switch ngay quay lại bundle v11; (2) replay trên 7 ngày dữ liệu cũ với bundle v12 để đo false positive trước khi mở rộng; (3) shadow mode trên 5% traffic, chỉ ghi log không chặn; (4) canary 1% rồi tăng dần, theo dõi challenge rate và loss; (5) analyst override thêm role access, reason, audit và expiry 7 ngày. **Kết quả:** false positive giảm từ 400 xuống dưới 20 khách/ngày, p99 latency vẫn dưới 100 ms, không còn decline khách thật sau 2 tuần.

### Trả lời mẫu khi phỏng vấn
  "Khi một rule mới làm chặn nhầm khách thật, tôi không restart toàn hệ thống. Tôi dùng rule bundle bất biến, version hóa, có kill switch ngay lập tức quay lại phiên bản cũ. Truyền rollout qua replay dữ liệu cũ, shadow mode chỉ ghi log không chặn, rồi canary cohort nhỏ tăng dần theo challenge rate và p99 latency. Đo false positive trên mẫu xác minh theo cohort, kênh, thiết bị, khách mới/cũ, báo confidence interval và label delay. Analyst override cần role access, reason, audit và expiry, không bỏ qua hard control vô hạn. Fallback khi feature store chậm là chính sách risk owner phê duyệt, platform không tự chọn. Kinh nghiệm thực tế: model AUC tốt hơn nhưng chặn nhầm khách nhận lương vào ngày cố định vẫn là rollout xấu, nên luôn có guardrail theo tỷ lệ challenge/decline theo cohort."

> Senior tip: guardrail rollout gồm tỷ lệ challenge/decline theo cohort và p99 latency. Model AUC tốt hơn nhưng chặn nhầm khách nhận lương vào ngày cố định vẫn là rollout xấu.`,
  follow: ['False positive đo thế nào khi nhãn đến sau nhiều tuần?', 'Bạn rollback rule mà không restart toàn hệ thống ra sao?', 'Khi nào feature thiếu khiến quyết định phải fail closed?'],
  tags: ['fraud', 'false positive', 'rule engine', 'model rollout', 'risk']
},
{
  id: 'design-027', topic: 'design', level: 'senior',
  q: 'Thiết kế loyalty points và cashback giữa ngân hàng, merchant và đối tác. Làm sao chống cộng điểm trùng, xử lý hết hạn, refund và đối soát khi file đối tác đến muộn?',
  a: `**Tóm tắt:** Điểm thưởng cần ledger append-only riêng, với pending/available lots và event accrual, redemption, expiry, reversal. Dedupe theo business event ID, version hóa earn rule, và đối soát settlement batch; webhook lặp không được cộng điểm hai lần.

### Yêu cầu và sizing giả định
- Giả định 4 triệu thành viên, 10 triệu giao dịch/ngày (~116/s, peak 2.000/s), mỗi event tạo 1–3 posting. Đây là giả định sizing.
- Điểm có giá trị kinh tế: cần audit, policy hạn dùng minh bạch, balance giải thích được. Tách pending points khỏi available points; cashback tiền thật dùng ledger tiền riêng.
- Refund có thể xảy ra sau redemption; policy cần chốt negative balance/thu hồi kỳ sau/manual review.

### API và mô hình dữ liệu
- {{POST /loyalty/events}} nhận eventId, memberId, merchantId, orderId, type, amountMinor, currency; {{GET /points/balance}} trả available/pending/expiringSoon; redemption có idempotency key.
- {{points_event}} unique (partner, event_id), lưu payload hash để phát hiện cùng ID khác nội dung; {{points_lot}} lưu earned/remaining/expiresAt/source; {{points_posting}} append accrue/redeem/expire/reverse; {{partner_batch}} lưu checksum/period/status.
- Earn rule version gồm tỷ lệ, làm tròn, category eligible, cap; posting ghi ruleVersion. Không tin số điểm do merchant tự gửi nếu chưa validate.

### Luồng
~~~text
Merchant -> adapter -> inbox dedupe -> pending points lot
Settlement file -> matcher -> activate / exception case
Redemption -> reserve lots -> confirm -> posting
Refund -> reversal posting -> balance policy
~~~
1. Nhận webhook/file vào durable inbox; verify signature, dedupe event ID/hash. Cùng ID khác payload là exception/security alert.
2. Tạo pending lot theo rule tại thời điểm giao dịch; activate sau settlement hoặc khi hết thời hạn đổi trả. Không phụ thuộc event đến đúng thứ tự.
3. Redemption chọn lot theo policy (ví dụ hết hạn sớm dùng trước), reserve bằng conditional update/transaction, rồi confirm/cancel. Retry cùng key không tạo redemption mới.
4. Expiry worker xử lý theo ngày hết hạn; chỉ expire remaining bằng lock/conditional update. Unique expiry reference làm retry an toàn.
5. Refund tạo reversal liên kết source transaction; nếu điểm đã tiêu, áp dụng chính sách negative balance/thu hồi/manual case, không xóa posting cũ.

### Nhất quán, đối soát và trade-off
- Consumer at-least-once; unique constraint và transaction inbox+posting giúp mỗi event chỉ accrue một lần. Outbox phát balance-changed; app cache là projection.
- Match batch theo partner, order, amount và points expected. File muộn giữ pending; mismatch tạo exception có SLA, không tự suy đoán thành công.
- Expiry index/bucket tránh quét mọi lot. Partition theo member hash hỗ trợ balance; expiry theo thời gian cần index/queue riêng.
- Rate/velocity cap theo member/merchant, refund ratio và fraud review chống farming. Materialized balance đọc nhanh nhưng cần reconciliation/rebuild; tính lại từ ledger đơn giản hơn nhưng đắt.
- Batch ID lặp checksum khác phải vào quarantine. Partner settlement có thể thiếu, trùng hoặc đến sai kỳ; lưu raw file bất biến và kết quả matcher để audit.

### Câu hỏi đào sâu
- Đơn hoàn sau 30 ngày nhưng khách đã tiêu điểm thì xử lý sao?
- Batch ID giống nhau nhưng checksum khác thì ai quyết định?
- Expiry và redemption đồng thời tranh cùng lot được tuần tự hóa thế nào?

### Ví dụ đời thực
Một chương trình điểm thưởng giữa ngân hàng và chuỗi bán lẻ (loyalty points: điểm tích lũy đổi quà/giảm giá; cashback: tiền hoàn lại). **Triệu chứng:** sau chiến dịch cuối tuần, khoảng 1.200 thành viên phản ánh điểm tăng gấp đôi, trong khi báo cáo đối tác chỉ ghi một giao dịch cho mỗi đơn; tổng nợ điểm (liability: số điểm doanh nghiệp còn phải "trả") lệch +8% so với dự kiến. **Điều tra:** truy vấn {{points_event}} theo {{event_id}} thấy một số event có 2 posting do consumer xử lý lại webhook (at-least-once: message có thể được giao lại); kiểm tra {{partner_batch}} thấy file settlement của đối tác A đến trễ 2 ngày, checksum đúng nhưng kỳ (period) bị đánh sai; log redemption cho thấy 37 đơn hoàn tiền xảy ra sau khi khách đã đổi điểm. **Nguyên nhân gốc:** thiếu unique constraint {{(partner, event_id)}} ở luồng cũ, matcher batch tự suy đoán kỳ khi file trễ, và policy hoàn tiền chưa chốt cách xử lý điểm đã tiêu. **Xử lý:** thêm durable inbox + unique {{(partner, event_id)}} và so sánh payload hash; accrual tạo pending lot, chỉ activate sau settlement khớp; file trễ hoặc checksum/kỳ bất thường đưa vào exception có SLA, không tự khớp; refund tạo reversal posting, nếu điểm đã tiêu thì ghi nợ điểm theo policy có duyệt thủ công. **Kết quả đo được:** điểm cộng trùng giảm về 0 trên 30 ngày, lệch liability sau đối soát giảm dưới 0,5%, thời gian xử lý exception batch có SLA rõ (4 giờ làm việc).

### Trả lời mẫu khi phỏng vấn
"Nếu em thiết kế loyalty points và cashback giữa ngân hàng, merchant và đối tác, em coi điểm là một ledger riêng, append-only, không cập nhật số dư bằng cách ghi đè. Mỗi giao dịch có business event ID; em dùng unique constraint và durable inbox để webhook bị gửi lặp không cộng điểm hai lần, và lưu payload hash để phát hiện cùng ID nhưng nội dung khác. Điểm chia thành pending và available: earn tạo pending lot theo rule version tại thời điểm giao dịch, chỉ activate sau settlement hoặc hết thời hạn đổi trả. Redemption chọn lot theo policy, ví dụ điểm sắp hết hạn dùng trước, và reserve bằng transaction/conditional update để tránh tranh chấp. Expiry xử lý theo bucket theo ngày hết hạn, chỉ trừ phần remaining. Refund tạo reversal posting; nếu khách đã tiêu điểm thì áp dụng policy nợ điểm hoặc thu hồi kỳ sau, không xoá lịch sử. Với file đối tác đến muộn, em giữ trạng thái pending và đối soát theo batch checksum/kỳ, mismatch đưa vào exception có SLA thay vì tự suy đoán."

> Senior tip: theo dõi liability theo expiry bucket, orphan event, batch mismatch và negative balance. Spike điểm sắp hết hạn có thể do lỗi timezone/job retry chứ không phải chiến dịch marketing.`,
  follow: ['Pending points giữ bao lâu khi settlement trễ?', 'Balance âm có được phép không và ai duyệt?', 'Bạn dựng lại balance sau bug earn rule thế nào?'],
  tags: ['loyalty', 'cashback', 'points ledger', 'idempotency', 'reconciliation']
},
{
  id: 'design-028',
  topic: 'design',
  level: 'senior',
  q: 'API xuất báo cáo đang chạy đồng bộ 2–5 phút: load balancer cắt ở 60 giây, người dùng bấm lại tạo báo cáo trùng, deploy giữa chừng làm mất việc. Bạn chuyển nó sang async job thế nào: hợp đồng API, bảng jobs, worker lấy việc, lease/heartbeat, reaper, báo kết quả và retry?',
  a: `**Tóm tắt:** Tách "nhận yêu cầu" khỏi "làm việc": API ghi một dòng vào bảng **jobs** rồi trả ngay **202 Accepted** kèm link trạng thái; worker lấy job bằng {{SELECT ... FOR UPDATE SKIP LOCKED}}, giữ job bằng **lease có heartbeat**, một **reaper** thu hồi job của worker đã chết. Client theo dõi qua **status API** (hoặc webhook), mọi bước đều **idempotent** và retry có **exponential backoff + jitter**.

### Vì sao đồng bộ hỏng
- Request giữ một thread và một kết nối HTTP suốt 5 phút; 200 người cùng bấm là cạn thread pool, ảnh hưởng cả API khác.
- Proxy, load balancer, gateway đều có timeout (thường 30–60 s): server vẫn chạy nhưng client đã nhận lỗi 504 và bấm lại, tạo thêm một báo cáo.
- Deploy hoặc pod restart giết request đang chạy, không ai biết để chạy lại.

### Luồng mới
~~~text
Client --POST /reports (Idempotency-Key: k1)--> API --INSERT jobs--> DB
       <-- 202 Accepted, Location: /jobs/123 ---
Worker --claim (SKIP LOCKED)--> DB; chạy job; heartbeat mỗi 30s; ghi file lên S3
Worker --UPDATE status=SUCCEEDED, result_url--> DB  (--> webhook nếu client đăng ký)
Client --GET /jobs/123--> {status: RUNNING, progress: 40}  ... {status: SUCCEEDED, result_url}
~~~

### Hợp đồng API
- {{POST /reports}} với header {{Idempotency-Key}}: unique theo {{(tenant_id, idempotency_key)}}. Bấm lại cùng key thì trả lại **đúng job cũ**, không tạo job mới.
- Trả **202 Accepted**, header {{Location: /jobs/123}}, body {{jobId}} và {{status}}. Có thể thêm {{Retry-After: 5}} gợi ý khoảng poll.
- {{GET /jobs/123}}: {{status}}, {{progress}}, {{error}}, {{result_url}} (presigned URL có hạn, không trả file qua API).
- {{POST /jobs/123/cancel}}: đặt cờ huỷ; worker kiểm tra cờ ở mỗi checkpoint.

### Bảng jobs
~~~sql
CREATE TABLE jobs (
  id              BIGSERIAL PRIMARY KEY,
  tenant_id       BIGINT NOT NULL,
  idempotency_key TEXT   NOT NULL,
  type            TEXT   NOT NULL,
  payload         JSONB  NOT NULL,
  status          TEXT   NOT NULL,       -- QUEUED, RUNNING, SUCCEEDED, FAILED, CANCELLED
  attempts        INT    NOT NULL DEFAULT 0,
  max_attempts    INT    NOT NULL DEFAULT 5,
  run_after       TIMESTAMPTZ NOT NULL DEFAULT now(),  -- dùng cho backoff
  lease_owner     TEXT,
  lease_until     TIMESTAMPTZ,
  progress        INT, result_url TEXT, last_error TEXT,
  UNIQUE (tenant_id, idempotency_key)
);
CREATE INDEX jobs_ready ON jobs (run_after) WHERE status = 'QUEUED';
~~~
Worker claim bằng một transaction **ngắn**: chọn dòng QUEUED có {{run_after <= now()}} với {{FOR UPDATE SKIP LOCKED}}, đổi sang RUNNING, đặt {{lease_owner}}, {{lease_until = now() + 90s}}, tăng {{attempts}}, rồi commit ngay. Không giữ transaction trong lúc chạy job 5 phút.

### Lease, heartbeat và fencing
Lease nghĩa là "job này thuộc worker W tới thời điểm T". Worker gia hạn định kỳ:
~~~java
// chạy mỗi 30s trong lúc job đang làm; lease 90s = chịu được 2 lần heartbeat lỡ
int n = jdbc.update("""
    UPDATE jobs SET lease_until = now() + interval '90 seconds', progress = ?
     WHERE id = ? AND lease_owner = ? AND attempts = ? AND status = 'RUNNING'
    """, progress, jobId, workerId, attempt);
if (n == 0) {          // lease đã bị reaper thu hồi và giao cho worker khác
    cancelled.set(true); // dừng ngay, không được ghi kết quả
}
~~~
Điều kiện {{lease_owner = ? AND attempts = ?}} là **fencing**: worker bị GC pause 3 phút tỉnh dậy không thể ghi đè kết quả của lần chạy mới. Lệnh hoàn tất cũng phải có cùng điều kiện. Dùng {{now()}} của DB, không dùng đồng hồ của từng pod.

### Reaper và retry
Một tiến trình chạy mỗi 30 s (chỉ cần một instance, ví dụ giữ advisory lock):
- Job RUNNING có {{lease_until < now()}}: nếu {{attempts < max_attempts}} thì về QUEUED với {{run_after = now() + backoff}}, ngược lại FAILED.
- Backoff: {{min(cap, base × 2^attempts)}} + jitter ngẫu nhiên. Ví dụ base 30 s, cap 30 phút: 30 s, 1 phút, 2 phút, 4 phút... Jitter tránh 1.000 job lỗi cùng lúc retry cùng giây.
- Phân loại lỗi: timeout, 5xx, deadlock thì retry; dữ liệu sai, 4xx thì FAILED ngay, retry chỉ phí tài nguyên.

### Báo kết quả
| Cách | Ưu | Nhược |
|---|---|---|
| Polling status API | đơn giản, client nào cũng làm được | tốn request; cần cache/ETag |
| Webhook | realtime, không tốn poll | client phải có endpoint public; phải ký HMAC, retry, client dedup theo event id |
| SSE/WebSocket | realtime cho UI | giữ kết nối, khó qua một số proxy |

Thực tế: luôn có status API (nguồn sự thật), thêm webhook hoặc SSE như tối ưu.

### Pitfall production
- Handler không idempotent: retry tạo hai file, gửi hai email. Ghi kết quả theo key cố định ({{reports/123.xlsx}}) để chạy lại thì ghi đè.
- Graceful shutdown: khi nhận SIGTERM, ngừng claim job mới, chờ job đang chạy tới checkpoint hoặc trả về QUEUED; nếu không, job chỉ được thu hồi sau khi lease hết hạn.
- Bảng jobs phình to và (với PostgreSQL) bloat vì UPDATE liên tục: chuyển job xong sang bảng lưu trữ hoặc partition theo ngày, xoá theo partition.
- Không giới hạn số job mỗi tenant: một tenant gửi 10.000 job chiếm hết worker. Đặt quota và claim công bằng theo tenant.

### Ví dụ đời thực
Một sản phẩm SaaS xuất báo cáo doanh thu chạy đồng bộ mất 2-5 phút. **Triệu chứng:** giờ cao điểm 180 người bấm xuất, gateway trả 504 sau 60 giây; mỗi người bấm lại 2-3 lần, cuối ngày có khoảng 420 job trùng tạo ~12.000 file trên S3. **Điều tra:** xem access log thấy cùng {{Idempotency-Key}} bị thiếu nên mỗi POST tạo một dòng job; metric {{job_queue_oldest_age_seconds}} tăng lên 900 giây; {{reaper_reclaimed_total}} tăng đột biến sau mỗi lần deploy. **Nguyên nhân gốc:** API giữ request dài, không có idempotency key, và worker bị SIGTERM khi deploy nên job RUNNING mất owner. **Xử lý:** chuyển sang {{POST /reports}} trả 202 kèm {{Location}}, unique {{(tenant_id, idempotency_key)}}; worker claim bằng {{FOR UPDATE SKIP LOCKED}}, lease 90 giây, heartbeat 30 giây tách thread riêng; reaper mỗi 30 giây trả job quá hạn về QUEUED với backoff + jitter; shutdown ngừng claim và chờ checkpoint. **Kết quả đo được:** tỷ lệ 504 của endpoint xuất báo cáo giảm từ 38% xuống < 1%, job trùng giảm về 0, tuổi job QUEUED lâu nhất ở peak còn 45 giây.

### Trả lời mẫu khi phỏng vấn
"Khi gặp API chạy 2-5 phút bị load balancer cắt và người dùng bấm lại tạo trùng, em tách nhận yêu cầu khỏi thực thi. API ghi một dòng job có {{Idempotency-Key}} theo tenant rồi trả 202 kèm link trạng thái; bấm lại cùng key chỉ trả đúng job cũ. Worker lấy việc bằng {{FOR UPDATE SKIP LOCKED}} để tránh hai worker claim trùng, giữ job bằng lease và heartbeat định kỳ, đồng thời fencing bằng {{lease_owner}} và {{attempts}} để worker bị GC pause tỉnh dậy không ghi đè kết quả. Một reaper thu hồi job RUNNING quá lease và đưa về QUEUED với exponential backoff cộng jitter; lỗi dữ liệu sai thì fail ngay, không retry mù. Client poll status API hoặc nhận webhook đã ký HMAC và tự dedup theo event id. Ở production, em theo dõi tuổi job QUEUED lâu nhất và số lần reaper thu hồi để phát hiện heartbeat bị chậm trước khi người dùng thấy trễ."

> Senior tip: metric quan trọng nhất là **tuổi của job QUEUED lâu nhất** và **số lần reaper thu hồi lease**. Reaper thu hồi nhiều thường không phải worker chết mà do heartbeat chạy chung thread pool với job nặng nên bị trễ: tách heartbeat ra thread riêng, và đặt lease ít nhất 3 lần chu kỳ heartbeat.`,
  follow: [
    'Worker bị GC pause dài hơn lease rồi tỉnh dậy: điều gì ngăn nó ghi đè kết quả?',
    'Khi nào bạn thay bảng jobs bằng SQS hoặc Temporal?',
    'Bạn thiết kế webhook retry và chữ ký HMAC thế nào để client chống giả mạo và chống trùng?'
  ],
  tags: ['async job', '202 Accepted', 'SKIP LOCKED', 'lease', 'heartbeat', 'reaper', 'idempotency', 'backoff', 'webhook'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: SELECT, The Locking Clause', url: 'https://www.postgresql.org/docs/current/sql-select.html' },
    { type: 'doc', title: 'RFC 9110: HTTP Semantics', url: 'https://www.rfc-editor.org/rfc/rfc9110' },
    { type: 'article', title: 'ZemIT: Kafka có phải queue thật và bạn vẫn', url: 'https://zemit.substack.com/p/kafka-a-co-queue-that-va-ban-van' }
  ]
},
{
  id: 'design-029',
  topic: 'design',
  level: 'lead',
  q: 'Hệ thống cần chạy background job (gửi email, resize ảnh, đồng bộ đối tác). Bạn so sánh hàng đợi bằng bảng DB, Redis Streams, message broker (RabbitMQ/SQS) và Kafka thế nào, và khi nào chọn cái nào?',
  a: `**Tóm tắt:** Chọn theo 4 câu hỏi: job có phải ghi **cùng transaction** với dữ liệu nghiệp vụ không, cần **ack/retry/delay từng job** không, **throughput** bao nhiêu, và có cần **replay / nhiều consumer** không. Bảng DB thắng ở tính nhất quán và đơn giản; Redis Streams thắng ở độ trễ nhưng độ bền yếu hơn; RabbitMQ/SQS là work queue chuẩn; Kafka hợp event stream hơn là job queue.

### 1. Bảng DB (SELECT ... FOR UPDATE SKIP LOCKED)
- Cơ chế: job là một dòng; worker claim bằng {{FOR UPDATE SKIP LOCKED}} để nhiều worker không lấy trùng; lease + reaper thu hồi job treo.
- Điểm mạnh lớn nhất: **INSERT job cùng transaction** với dữ liệu nghiệp vụ. Đơn hàng commit thì job gửi email chắc chắn tồn tại; rollback thì job cũng biến mất. Không có dual-write.
- Query được: "job nào lỗi của tenant X tuần này" chỉ là một câu SQL.
- Giới hạn: mỗi job là nhiều lần UPDATE; worker poll liên tục tạo tải cho DB chính. Thường đủ cho vài chục đến vài trăm job/s; cao hơn thì phải đo. PostgreSQL bị bloat vì UPDATE/DELETE nhiều, cần autovacuum tốt hoặc partition theo ngày. Có thể dùng {{LISTEN/NOTIFY}} để đánh thức worker thay vì poll dày.

### 2. Redis Streams
- Cơ chế: {{XADD jobs * ...}} thêm job; consumer group đọc bằng {{XREADGROUP}}; mỗi message đã giao nằm trong **PEL (pending entries list)** tới khi worker {{XACK}}. Worker chết thì worker khác dùng {{XAUTOCLAIM}} để nhận lại message pending quá lâu; {{XPENDING}} cho biết số lần giao, dùng để đẩy poison message ra.
~~~text
XADD jobs * type email to a@x.com          -> 1730000000000-0
XREADGROUP GROUP workers w1 COUNT 10 BLOCK 5000 STREAMS jobs >
XACK jobs workers 1730000000000-0
XAUTOCLAIM jobs workers w2 60000 0-0 COUNT 10   -- nhận lại job pending > 60s
~~~
- Điểm mạnh: độ trễ thấp (mili giây), throughput cao, có sẵn nếu đã dùng Redis.
- Điểm yếu: dữ liệu ở RAM; AOF với {{appendfsync everysec}} có thể mất khoảng 1 giây ghi; replication bất đồng bộ nên failover có thể mất job đã được xác nhận ghi. Không có delay/retry có lịch sẵn; phải tự làm (ví dụ sorted set theo thời điểm chạy). Stream phải được cắt ({{MAXLEN}}) kẻo đầy RAM.

### 3. Message broker: RabbitMQ, SQS
- **SQS**: nhận message, message bị ẩn trong **visibility timeout**; xoá thì xong, không xoá thì hiện lại để retry. Quá {{maxReceiveCount}} thì chuyển sang DLQ (redrive policy). Delay tới 15 phút, giữ message tối đa 14 ngày. Không phải vận hành gì.
- **RabbitMQ**: manual ack/nack, {{prefetch}} giới hạn số message mỗi worker giữ, dead-letter exchange, TTL, priority; dùng **quorum queue** để chịu được mất node.
- Điểm mạnh: đúng ngữ nghĩa work queue: worker rảnh lấy việc, ack từng job, retry/DLQ có sẵn, scale worker tự do.
- Điểm yếu: không ghi cùng transaction với DB, cần outbox nếu job phải khớp tuyệt đối với dữ liệu nghiệp vụ; không replay job đã ack.

### 4. Kafka
- Hợp khi job thực chất là **phản ứng với một event** đã nằm trong Kafka, cần nhiều consumer độc lập và replay.
- Không hợp cho job dài, không đều: head-of-line blocking theo partition, số worker bị giới hạn bởi partition, retry/DLQ phải tự xây bằng topic phụ. Share group (Kafka 4.x) cải thiện chuyện này nhưng còn mới và không giữ thứ tự.

### Bảng so sánh
| Tiêu chí | Bảng DB | Redis Streams | RabbitMQ / SQS | Kafka |
|---|---|---|---|---|
| Enqueue cùng transaction DB | **có** | không | không (cần outbox) | không (cần outbox) |
| Ack/retry từng job | tự làm, dễ | PEL + XAUTOCLAIM | **có sẵn** | không (consumer group) |
| Delay / lịch chạy | **dễ** ({{run_after}}) | tự làm | có (giới hạn) | tự làm |
| Độ bền | cao (WAL) | trung bình | cao (quorum queue / SQS) | cao |
| Throughput | thấp–trung bình | cao | trung bình–cao | rất cao |
| Replay | query lại | trong giới hạn MAXLEN | không | **có** |
| Vận hành thêm | không | Redis có sẵn | trung bình / gần 0 (SQS) | cao |

### Cách chọn
1. Job phải khớp tuyệt đối với dữ liệu nghiệp vụ, vài chục job/s: **bảng DB**. Không thêm hạ tầng.
2. Trên AWS, job độc lập, cần retry/DLQ/delay: **SQS**. Nếu job sinh ra từ transaction DB, dùng outbox đẩy sang SQS.
3. Cần routing phức tạp, priority, chạy on-prem: **RabbitMQ**.
4. Cần độ trễ mili giây, chấp nhận mất rất ít và job idempotent, đã có Redis: **Redis Streams**.
5. Job là hệ quả của event cần nhiều hệ thống cùng nghe, cần replay: **Kafka**, có thể bridge sang queue cho phần việc nặng.

### Pitfall production
- Chọn Kafka cho "queue email" rồi phải tự viết retry topic, DLT, delay: tốn gấp nhiều lần so với SQS.
- Dùng Redis List ({{LPUSH}}/{{BRPOP}}) làm queue: worker chết sau khi pop là **mất job**, vì không có PEL. Streams hoặc pattern có danh sách đang xử lý mới an toàn.
- Bảng DB queue nằm chung DB nghiệp vụ, worker poll 100 lần/s mỗi pod: DB tốn CPU chỉ để trả lời "không có job".

### Ví dụ đời thực
Một nền tảng thương mại điện tử cần gửi email xác nhận, resize ảnh và đồng bộ tồn kho đối tác. **Triệu chứng:** sau đợt sale, email trễ 20-40 phút; DB nghiệp vụ CPU tăng cao dù traffic đọc ổn định. **Điều tra:** metric DB cho thấy ~4.000 truy vấn poll "có job không" mỗi phút từ 8 worker; bảng jobs tăng ~2 triệu dòng/ngày do UPDATE liên tục; log cho thấy resize ảnh nặng 10-30 giây làm hàng chờ email bị nghẽn. **Nguyên nhân gốc:** dùng bảng DB chung cho mọi loại job, không tách workload nặng/nhẹ, và job được tạo sau khi commit đơn hàng bằng hai bước riêng nên một số job mất khi service lỗi giữa chừng. **Xử lý:** job nghiệp vụ quan trọng (gửi email xác nhận) chuyển sang SQS với DLQ và visibility timeout phù hợp; tạo job bằng transactional outbox từ DB nghiệp vụ để không dual-write; resize ảnh dùng worker pool riêng và giới hạn concurrency; job nội bộ cần query trạng thái theo tenant giữ ở bảng DB nhưng thêm index {{jobs_ready}} và giảm poll. **Kết quả đo được:** email xác nhận P95 giảm từ 28 phút xuống 90 giây, CPU DB giảm ~35% giờ cao điểm, không còn mất job khi deploy nhờ outbox.

### Trả lời mẫu khi phỏng vấn
"Khi chọn nền tảng chạy background job, em không chọn công nghệ trước mà hỏi 4 câu: job có phải ghi cùng transaction với dữ liệu nghiệp vụ không, có cần ack/retry/delay từng job không, throughput bao nhiêu, và có cần replay cho nhiều consumer không. Nếu job phải chắc chắn đi cùng đơn hàng và lưu lượng vài chục đến vài trăm job mỗi giây, bảng DB với {{FOR UPDATE SKIP LOCKED}} là lựa chọn đơn giản và nhất quán. Nếu job độc lập, trên AWS em thường dùng SQS vì có retry, visibility timeout và DLQ sẵn; khi job sinh ra từ transaction DB thì dùng outbox để tránh dual-write. Redis Streams hợp khi cần độ trễ thấp nhưng phải chấp nhận độ bền yếu hơn và tự làm delay/claim lại. Kafka chỉ hợp khi job thực chất là event cần nhiều hệ thống nghe và replay. Dù chọn gì, em luôn coi handler là at-least-once và bắt buộc idempotent."

> Senior tip: ở mọi lựa chọn, ngữ nghĩa thực tế đều là **at-least-once**, nên handler idempotent là bắt buộc, không phải tuỳ chọn. Bắt đầu bằng bảng DB hoặc SQS; chỉ chuyển sang thứ phức tạp hơn khi metric (tuổi job, tải DB, throughput) cho thấy cần, và ghi lại lý do bằng ADR.`,
  follow: [
    'Bạn migrate từ bảng DB queue sang SQS mà không mất hoặc chạy trùng job thế nào?',
    'Redis failover làm mất một ít job đã XADD: bạn phát hiện và bù thế nào?',
    'Khi nào cần priority queue, và mỗi lựa chọn làm priority ra sao?'
  ],
  tags: ['job queue', 'SKIP LOCKED', 'Redis Streams', 'RabbitMQ', 'SQS', 'Kafka', 'background job', 'trade-off'],
  refs: [
    { type: 'doc', title: 'Redis Streams', url: 'https://redis.io/docs/latest/develop/data-types/streams/' },
    { type: 'doc', title: 'Amazon SQS visibility timeout', url: 'https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html' },
    { type: 'doc', title: 'RabbitMQ Quorum Queues', url: 'https://www.rabbitmq.com/docs/quorum-queues' },
    { type: 'doc', title: 'PostgreSQL: SELECT, The Locking Clause', url: 'https://www.postgresql.org/docs/current/sql-select.html' },
    { type: 'article', title: 'ZemIT: Kafka có phải queue thật và bạn vẫn', url: 'https://zemit.substack.com/p/kafka-a-co-queue-that-va-ban-van' }
  ]
},
{
  id: 'architecture-023',
  topic: 'architecture',
  level: 'lead',
  q: 'Team bạn đang chọn nền tảng nhắn tin cho hệ thống: Kafka hay RabbitMQ. Bạn viết Architecture Decision Record (ADR) thế nào để ghi lại quyết định, khi nào cần ADR, và cho ví dụ cấu trúc ADR cho trường hợp này?',
  a: `**Tóm tắt:** ADR (Architecture Decision Record — bản ghi quyết định kiến trúc) là một văn bản ngắn, lưu cùng mã nguồn, ghi lại **một quyết định kiến trúc quan trọng, bối cảnh, các lựa chọn đã cân nhắc, và lý do chọn/bỏ**. Cần ADR khi quyết định khó đảo ngược, tốn kém nếu đổi, ảnh hưởng nhiều team, hoặc có nhiều lựa chọn hợp lý dễ gây tranh luận lại sau này. ADR không phải tài liệu thiết kế chi tiết; nó trả lời "tại sao lúc đó chúng ta chọn thế này" để người mới (hoặc chính bạn 6 tháng sau) không lặp lại tranh luận cũ.

### ADR là gì, vì sao cần
- **Cái gì:** Mỗi ADR là một file (thường Markdown) đánh số thứ tự, ví dụ {{0007-use-kafka-for-order-events.md}}. Nó bất biến (immutable) theo nghĩa: quyết định cũ không bị sửa nội dung; nếu đổi hướng, tạo ADR mới đánh dấu ADR cũ là "Superseded" (bị thay thế).
- **Vì sao cần:**
  - **Bộ nhớ tổ chức:** Người rời team mang theo lý do; ADR giữ lại. Dev mới đọc 10 ADR hiểu được "xương sống" kiến trúc nhanh hơn đọc 200 ticket.
  - **Tránh tranh luận lặp:** "Sao mình không dùng RabbitMQ?" — đọc ADR 0007. Nếu bối cảnh đổi (ví dụ throughput giờ chỉ 50 msg/s, không cần replay), ADR mới có thể thay thế.
  - **Ra quyết định minh bạch:** Buộc người đề xuất nêu rõ trade-off, không chọn theo "quen tay" hay "trend".
  - **Kiểm toán/compliance:** Một số lĩnh vực (tài chính, y tế) cần truy vết lý do kỹ thuật.

### Khi nào CẦN ADR, khi nào KHÔNG
| Cần ADR | Không cần ADR |
|---|---|
| Chọn công nghệ nền tảng (DB, message broker, cloud) | Chọn tên biến, cấu trúc package nhỏ |
| Quyết định ranh giới service/module | Refactor nội bộ một class |
| Chiến lược auth, multi-tenancy, data residency | Nâng phiên bản thư viện patch |
| Pattern xuyên suốt (sync vs async, event sourcing có/không) | Cách implement một feature cụ thể (đã có pattern) |
| Quyết định tốn tiền lớn hoặc khó đảo ngược | Thử nghiệm tạm thời (spike) — nhưng kết luận của spike nên thành ADR |

Quy tắc ngón tay: nếu đổi quyết định này mất > 2 tuần công hoặc ảnh hưởng > 1 team, viết ADR.

### Cấu trúc ADR phổ biến (MADR / Nygard)
~~~text
# ADR-0007: Dùng Kafka cho luồng sự kiện đơn hàng

- Status: Accepted (2026-08-15)
- Deciders: An (Tech Lead), Bình (Architect), Chi (SRE)
- Date: 2026-08-15

## Context (Bối cảnh)
Hệ thống thương mại điện tử có 5 service (Order, Inventory, Payment,
Notification, Analytics) cần phản ứng khi đơn hàng đổi trạng thái.
Yêu cầu đo được:
- ~3.000 sự kiện/giây giờ cao điểm, tăng gấp 3 vào sale.
- 4 consumer độc lập (Inventory, Notification, Analytics, Fraud) đọc
  cùng sự kiện, mỗi bên xử lý tốc độ khác nhau.
- Cần replay 7 ngày để dựng lại báo cáo Analytics khi logic đổi.
- Độ trễ chấp nhận < 2 giây (không cần sub-millisecond).
- Team 8 dev, 1 SRE; chưa ai vận hành Kafka production.

## Options Considered (Các lựa chọn)
1. Kafka
2. RabbitMQ
3. AWS SNS + SQS

## Decision (Quyết định)
Chọn **Kafka** (managed: Amazon MSK) cho luồng sự kiện đơn hàng.

## Rationale (Lý do)
- **Nhiều consumer + replay:** Kafka giữ log theo retention; 4 group
  độc lập đọc cùng topic, offset riêng. Replay 7 ngày đáp ứng yêu cầu
  Analytics. RabbitMQ xoá message sau khi ack — phải tự lưu bản sao.
- **Throughput:** 3.000 msg/s (peaks 9.000) nằm trong vùng Kafka xử lý
  thoải mái với 6 partition; RabbitMQ làm được nhưng vận hành phức
  tạp hơn ở mức này khi cần durable + nhiều queue.
- **Trade-off chấp nhận:** vận hành Kafka khó hơn. Giảm rủi ro bằng
  MSK (managed), giới hạn scope ban đầu 1 cluster, 1 topic domain,
  training 2 tuần cho team; SRE chịu trách nhiệm runbook.

## Why not others (Vì sao không chọn)
- **RabbitMQ:** mạnh về routing phức tạp, per-message ack, delay —
  nhưng replay và multi-consumer độc lập không phải điểm mạnh tự nhiên;
  phải duplicate queue hoặc dùng stream plugin (thêm độ phức tạp).
- **SNS+SQS:** đơn giản, managed; nhưng replay cần tự lưu (S3/Kinesis),
  chi phí tăng theo số consumer (mỗi consumer 1 queue + fan-out),
  và vendor lock-in AWS sâu hơn mức team muốn ở tầng này.

## Consequences (Hệ quả)
- Cần quy ước: schema event (Avro/JSON Schema + Schema Registry),
  key partition (orderId), idempotent consumer, DLQ topic.
- Chi phí MSK ~\$X/tháng (ước tính) + dung lượng lưu 7 ngày.
- Bước tiếp: spike 1 tuần (ADR-0008) chứng minh consumer idempotent
  và replay; review lại sau 3 tháng vận hành thực tế.
~~~

### Ví dụ so sánh nhanh trong ADR (bảng trade-off)
| Tiêu chí | Kafka (MSK) | RabbitMQ | SNS+SQS |
|---|---|---|---|
| Replay sự kiện | Có (retention) | Không tự nhiên | Phải tự lưu |
| Nhiều consumer độc lập | Consumer group | Duplicate queue | Fan-out |
| Per-message retry/DLQ | Tự xây (topic phụ) | Có sẵn | Có sẵn |
| Throughput mục tiêu | Rất thoải mái | Đạt được, tốn công hơn | Đạt được |
| Vận hành (team hiện tại) | Khó → dùng managed | Trung bình | Thấp |
| Độ trễ | ms–s | sub-ms–ms | ms–s |

### Pitfall production
- **ADR viết sau khi đã làm xong:** mất giá trị vì lý do thật bị "hợp thức hoá" ngược. Viết khi đang cân nhắc, chốt trước khi implement lớn.
- **ADR quá dài như tài liệu thiết kế:** không ai đọc. 1–2 trang là đủ; chi tiết kỹ thuật để ở design doc/link.
- **Không ghi "Consequences" và điều kiện xem lại:** quyết định trông đúng mãi. Ghi rõ "review lại nếu throughput < 500 msg/s hoặc team không còn vận hành được Kafka".
- **ADR nằm ngoài repo (Confluence, Google Doc):** lệch khỏi code, khó tìm. Lưu {{docs/adr/}} trong repo, review qua PR như code.

### Ví dụ đời thực
Một hệ thống thương mại điện tử có 5 service cần phản ứng khi đơn hàng đổi trạng thái. **Triệu chứng:** team tranh luận kéo dài 3 tuần giữa Kafka, RabbitMQ và SNS+SQS; mỗi người đưa lý do khác nhau, quyết định bị lặp lại mỗi cuộc họp. **Điều tra:** Tech Lead thu thập số liệu: ~3.000 sự kiện/giây giờ cao điểm, tăng gấp 3 ngày sale; 4 consumer độc lập (Inventory, Notification, Analytics, Fraud); Analytics cần replay 7 ngày khi đổi logic; độ trễ chấp nhận < 2 giây; team 8 dev, 1 SRE, chưa vận hành Kafka production. **Nguyên nhân gốc:** thiếu một bản ghi quyết định có bối cảnh đo được và trade-off rõ, nên cuộc thảo luận dựa vào sở thích cá nhân. **Xử lý:** viết ADR-0007 trong {{docs/adr/}}, nêu Context, 3 lựa chọn, bảng so sánh, quyết định dùng Kafka (Amazon MSK) cho luồng sự kiện đơn hàng, ghi rõ trade-off vận hành và điều kiện xem lại sau 3 tháng; chốt qua PR có Tech Lead, Architect, SRE. **Kết quả đo được:** quyết định được chốt trong 2 ngày sau khi có ADR, spike 1 tuần chứng minh consumer idempotent và replay; sau 3 tháng, team có runbook và không phát sinh tranh luận lặp về lựa chọn broker.

### Trả lời mẫu khi phỏng vấn
"Khi team chọn giữa Kafka và RabbitMQ, em dùng ADR để ghi quyết định có thể truy vết. Em viết ADR khi quyết định khó đảo ngược, tốn kém nếu đổi, hoặc ảnh hưởng nhiều team. Cấu trúc em dùng gồm Status, Deciders, Date, Context có số liệu, các lựa chọn, quyết định, lý do, lý do không chọn phương án khác, và hệ quả kèm điều kiện xem lại. Với ví dụ Kafka hay RabbitMQ, em nêu rõ throughput giờ cao điểm, số consumer độc lập, nhu cầu replay, độ trễ chấp nhận và năng lực vận hành của team. Nếu cần nhiều consumer và replay, Kafka thường hợp hơn; nếu cần per-message ack, routing phức tạp, retry/DLQ sẵn và không cần replay, RabbitMQ hợp hơn. ADR được lưu trong repo, review qua PR như code; khi bối cảnh đổi, em tạo ADR mới đánh dấu ADR cũ là Superseded thay vì sửa lịch sử."

> Senior tip: ADR tốt nhất là ADR khiến người phản đối cũng thấy lập luận của mình đã được ghi nhận trong mục "Why not others". Nếu ADR chỉ ca ngợi lựa chọn được chọn, nó là văn bản bán hàng, không phải quyết định kỹ thuật. Khi tôi review ADR, tôi tìm phần trade-off bị chấp nhận — nếu không có, tôi yêu cầu bổ sung trước khi Approve.`,
  follow: [
    'Khi bối cảnh thay đổi (ví dụ traffic giảm mạnh), bạn cập nhật ADR cũ thế nào mà vẫn giữ lịch sử?',
    'ADR khác gì RFC (Request for Comments) và design doc? Khi nào dùng cái nào?',
    'Làm sao để team thực sự duy trì thói quen viết ADR thay vì bỏ sau 2 tháng?'
  ],
  tags: ['ADR', 'architecture decision', 'Kafka', 'RabbitMQ', 'trade-off', 'documentation'],
  refs: [
    { type: 'doc', title: 'MADR - Markdown Architectural Decision Records', url: 'https://adr.github.io/madr/' },
    { type: 'article', title: 'Michael Nygard: Documenting Architecture Decisions', url: 'https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions' }
  ]
},
{
  id: 'architecture-024',
  topic: 'architecture',
  level: 'senior',
  q: 'Modular monolith là gì? Bạn đặt ranh giới module, kiểm tra ranh giới bằng ArchUnit, và quyết định khi nào tách một module thành service riêng như thế nào?',
  a: `**Tóm tắt:** Modular monolith (monolith theo module) là một ứng dụng deploy thành **một đơn vị** (một file chạy, một process) nhưng bên trong được chia thành các **module** có ranh giới rõ: mỗi module sở hữu dữ liệu và logic của mình, module khác chỉ tương tác qua API công khai (interface/method) hoặc event, không chọc thẳng vào bảng/class nội bộ. Nó giữ được sự đơn giản vận hành của monolith (một deploy, gọi hàm trong process, transaction dễ hơn) nhưng chuẩn bị đường thoát sang microservice khi thực sự cần. ArchUnit giúp biến ranh giới từ "quy ước miệng" thành test tự động.

### Cái gì → vì sao cần → hoạt động thế nào
- **Cái gì:** Hãy tưởng tượng một tòa nhà văn phòng: monolith lộn xộn là một sàn mở, ai cũng đi qua bàn ai. Microservice là nhiều tòa nhà khác phố, đi lại phải gửi thư (network). Modular monolith là một tòa nhà nhưng mỗi phòng ban có cửa, bảng tên, và lễ tân — muốn hỏi phòng Kế toán phải qua quầy, không được tự mở tủ hồ sơ của họ.
- **Vì sao cần:**
  - Nhiều team nhảy thẳng sang microservice khi chưa cần → chịu chi phí network, data consistency phân tán, deploy/observability phức tạp, nhưng vẫn chia ranh giới sai (distributed monolith — tệ hơn monolith).
  - Modular monolith cho phép đi nhanh, refactor ranh giới dễ (đổi package/interface rẻ hơn đổi API mạng + migration dữ liệu), và chỉ trả chi phí phân tán khi có lý do thật.
- **Hoạt động thế nào:** Mỗi module là một package gốc (ví dụ {{com.shop.order}}, {{com.shop.catalog}}, {{com.shop.payment}}). Quy tắc: package gốc = API công khai; package con ({{.internal}}, {{.persistence}}) = private. Module A gọi module B qua interface trong {{com.shop.catalog.api}}, không import {{com.shop.catalog.internal.*}}.

### Cấu trúc module (ví dụ)
~~~text
com.shop
  +-- order
  |    +-- api                (public: OrderFacade, OrderPlaced event)
  |    +-- internal           (private: OrderService, rules)
  |    +-- persistence        (private: OrderRepository, entities)
  +-- catalog
  |    +-- api                (public: CatalogFacade, ProductView)
  |    +-- internal
  |    +-- persistence
  +-- payment
       +-- api
       +-- internal
       +-- persistence
~~~
Nguyên tắc dữ liệu: bảng {{orders}} chỉ do module {{order}} sở hữu. Module {{payment}} cần biết tổng tiền? Gọi {{OrderFacade.getPayableAmount(orderId)}} hoặc nhận event {{OrderPlaced}} — không join trực tiếp bảng {{orders}}.

### Kiểm tra ranh giới bằng ArchUnit
~~~java
@AnalyzeClasses(packages = "com.shop")
class ModuleBoundaryTest {
    @ArchTest
    static final ArchRule noInternalAccess = noClasses()
        .that().resideInAPackage("..order..")
        .should().dependOnClassesThat()
        .resideInAPackage("..catalog.internal..");

    @ArchTest
    static final ArchRule noCycles = slices()
        .matching("com.shop.(*)..").namingSlices("$1")
        .should().beFreeOfCycles();

    @ArchTest
    static final ArchRule persistenceIsolated = noClasses()
        .that().resideOutsideOfPackage("..order.persistence..")
        .should().dependOnClassesThat()
        .resideInAPackage("..order.persistence..");
}
~~~
Test này chạy trong CI ({{mvn test}}). Vi phạm ranh giới = build fail. Với codebase cũ nhiều vi phạm, dùng {{FreezingArchRule.freeze(...)}} để chặn vi phạm mới và giảm dần (xem cũng architecture-021). Spring Modulith cung cấp cách tiếp cận tương tự với {{ApplicationModules.verify()}} và hỗ trợ event giữa module.

### Giao tiếp giữa module
| Cách | Khi nào | Ưu | Nhược |
|---|---|---|---|
| Gọi interface công khai (in-process) | Cần kết quả ngay (query) | Đơn giản, nhanh, dễ debug | Coupling đồng bộ; caller chịu lỗi callee |
| Application event (Spring {{@TransactionalEventListener}}) | Phản ứng phụ (gửi mail sau khi đặt hàng) | Giảm coupling; dễ thêm consumer | Khó trace luồng; thứ tự/xử lý lỗi cần chú ý |
| Event + bảng outbox (trong cùng DB) | Cần đảm bảo event khớp DB | Nhất quán mà không cần broker | Thêm độ phức tạp; vẫn in-process consumer |

### Khi nào tách module thành service riêng?
Chỉ tách khi có **lý do đo được**, không tách "cho đẹp":
- **Scale khác biệt:** module Search cần 20 instance lúc sale, phần còn lại 3 — tách để scale độc lập. Nếu scale giống nhau, tách chỉ tốn tiền.
- **Nhịp deploy khác:** team Fraud cần deploy 5 lần/ngày, Order 1 lần/tuần và bị chặn bởi quy trình kiểm soát — tách giảm xung đột (nhưng trước tiên thử tách pipeline/ownership).
- **Yêu cầu cô lập:** dữ liệu nhạy cảm (PCI) phải tách mạng/DB; hoặc một module hay sập kéo sập cả hệ.
- **Team độc lập thật sự:** > 2 team đụng cùng module liên tục gây conflict — và ranh giới module đã rõ. Ranh giới mờ thì tách service = distributed monolith.

Dấu hiệu CHƯA nên tách: team < 10 người, chưa có observability tốt, ranh giới module còn hay đổi, chưa đo được bottleneck.

### Pitfall production
- **"Modular" chỉ trên giấy:** package chia đẹp nhưng module A inject thẳng repository của module B. Không có ArchUnit/Spring Modulith verify = ranh giới sẽ mục.
- **Chia DB schema chung không có chủ sở hữu:** ai cũng {{ALTER TABLE}} của nhau. Quy ước: mỗi module có schema/prefix bảng riêng; truy cập chéo qua API.
- **Tách service quá sớm khi ranh giới sai:** phải gộp lại hoặc sống với API mạng vụng về + saga phức tạp. Chi phí sửa ranh giới trên mạng cao gấp nhiều lần trong monolith.
- **Transaction xuyên module:** {{@Transactional}} bọc gọi 2 module tưởng là nguyên tử — đúng trong monolith, nhưng đây là coupling ẩn; nếu mai tách service sẽ vỡ. Cần nhận diện và thiết kế lại (eventual consistency) cho các điểm này.

### Ví dụ đời thực
Một monolith thương mại điện tử 8 năm tuổi có 12 dev, deploy 2 lần/tuần. **Triệu chứng:** mỗi lần sửa module Catalog có thể làm hỏng Order vì code gọi chéo repository và entity nội bộ; thời gian review tăng, refactor bị trì hoãn vì sợ ảnh hưởng lan. **Điều tra:** dùng ArchUnit quét phụ thuộc, phát hiện 63 vi phạm: {{order.internal}} import {{catalog.persistence}}, {{payment}} join thẳng bảng {{orders}}, và 5 chu kỳ phụ thuộc giữa package. **Nguyên nhân gốc:** ranh giới module chỉ là quy ước, không có cơ chế kiểm tra tự động; schema DB chung không có chủ sở hữu. **Xử lý:** tách API công khai cho từng module, chuyển truy cập chéo sang facade/event, đặt ArchUnit rule chặn import {{*.internal.*}} và chu kỳ; dùng {{FreezingArchRule}} để không tăng vi phạm mới rồi giảm dần 63 vi phạm theo từng sprint. Module Search có tải cao ngày sale được chuẩn bị tách service sau khi ranh giới ổn định. **Kết quả đo được:** sau 3 tháng, vi phạm ArchUnit giảm từ 63 xuống 4, thời gian build/test không đổi đáng kể, số lỗi hồi quy giữa Order/Catalog giảm rõ trong 4 release.

### Trả lời mẫu khi phỏng vấn
"Em hiểu modular monolith là một ứng dụng deploy một đơn vị nhưng bên trong chia module có ranh giới rõ: mỗi module sở hữu dữ liệu và logic của mình, module khác chỉ gọi qua API công khai hoặc event, không chạm vào {{internal}} hay bảng của module khác. Em chọn modular monolith khi team chưa có lý do đo được để chịu chi phí phân tán của microservice. Để ranh giới không chỉ nằm trên giấy, em dùng ArchUnit hoặc Spring Modulith để kiểm tra tự động trong CI: cấm phụ thuộc vào package nội bộ, cấm chu kỳ, và cô lập persistence. Khi nào tách service? Em chỉ tách khi có số liệu: scale khác biệt, nhịp deploy khác, yêu cầu cô lập dữ liệu/mạng, hoặc team độc lập thật sự và ranh giới đã ổn định. Em tránh tách quá sớm vì sửa ranh giới sai qua network và migration dữ liệu đắt hơn nhiều so với refactor trong monolith."

> Senior tip: tôi coi modular monolith là "trạng thái mặc định tốt" cho team nhỏ/vừa. Câu hỏi phỏng vấn hay bị trả lời sai là liệt kê lợi ích microservice mà quên chi phí; câu trả lời mạnh là: "Tôi giữ monolith modular, đặt ArchUnit từ đầu, và chỉ tách service khi có số liệu (scale/deploy/isolation) chứng minh module đó cần sống riêng." Nhớ kèm ví dụ số liệu bạn từng gặp.`,
  follow: [
    'Làm sao xử lý transaction cần ghi vào hai module (ví dụ Order + Inventory) trong modular monolith?',
    'Spring Modulith khác gì tự viết ArchUnit rule? Khi nào chọn cái nào?',
    'Bạn phát hiện module A gọi 40 chỗ vào internal của module B — kế hoạch xử lý từng bước?'
  ],
  tags: ['modular monolith', 'ArchUnit', 'bounded context', 'microservice', 'module boundary'],
  refs: [
    { type: 'doc', title: 'Spring Modulith Reference', url: 'https://docs.spring.io/spring-modulith/reference/' },
    { type: 'doc', title: 'ArchUnit User Guide', url: 'https://www.archunit.org/userguide/html/000_Index.html' }
  ]
},
{
  id: 'architecture-025',
  topic: 'architecture',
  level: 'lead',
  q: 'Bạn phải thay thế một hệ thống legacy (monolith cũ, không ai dám sửa) bằng hệ thống mới mà không được ngừng dịch vụ. Bạn áp dụng Strangler Fig pattern: routing, đồng bộ dữ liệu hai chiều, và khi nào tắt hệ cũ? Minh hoạ luồng bằng ~~~seq.',
  a: `**Tóm tắt:** Strangler Fig (cây đa bóp — đặt theo cách cây đa mọc bọc quanh cây chủ rồi dần thay thế) là chiến lược di trú tăng dần: đặt một lớp **routing/facade** trước hệ cũ, chuyển từng khả năng (capability) sang hệ mới, để cả hai chạy song song, rồi cuối cùng tắt hệ cũ. Phần khó nhất không phải viết code mới mà là **đồng bộ dữ liệu hai chiều** khi cả hai hệ cùng "sống", và quyết định **điểm cắt** an toàn. Không có "big bang rewrite" — mỗi bước phải có thể rollback.

### Cái gì → vì sao cần
- **Cái gì:** Thay vì tắt hệ cũ, xây hệ mới xong rồi bật cái mới một lần (big bang — rủi ro cực cao), bạn "bóp nghẹt" dần: chuyển chức năng A sang mới, kiểm chứng, chuyển B, ... hệ cũ teo dần đến khi tắt.
- **Vì sao cần:** Hệ legacy thường là "hộp đen" nuôi nghiệp vụ: không có test, logic rải rác, nhưng đang chạy tiền thật. Big bang rewrite hay thất bại vì: (1) hiểu sai nghiệp vụ ẩn, (2) mất 18 tháng mà chưa ra gì, (3) cutover một đêm lỗi là thảm hoạ. Strangler giảm blast radius: mỗi lần chỉ chuyển một lát cắt nhỏ.
- **Ví dụ đời thường:** Sửa đường cao tốc đang chạy xe — không đóng cả đường xây lại; làm từng làn, chuyển xe sang làn tạm, xong làn này mới làm làn kia.

### Bước 1: Lớp routing (facade/proxy)
Đặt một điểm vào duy nhất (API Gateway, reverse proxy, hoặc facade service) quyết định request đi hệ cũ hay mới:
~~~text
Luồng tổng quát:
Client -> [Routing Facade] --(đã migrate)--> [Hệ mới]
                           --(chưa)---------> [Hệ legacy]
~~~
Routing theo tính năng (URL/endpoint), theo phần trăm (canary), hoặc theo tenant. Bắt đầu 0% sang mới, tăng dần.

~~~seq
title: Strangler Fig - chuyển dần endpoint GET /orders
actors: Client | Facade | NewSvc | Legacy
Client -> Facade: GET /orders/123
Facade -> Facade: rule: orders READ da migrate
Facade -> NewSvc: GET /orders/123
NewSvc --> Facade: 200 order
Facade --> Client: 200 order
note Client..Legacy: endpoint chua migrate van di Legacy
~~~

### Bước 2: Đồng bộ dữ liệu hai chiều (phần khó nhất)
Khi cả hai hệ cùng chạy, dữ liệu phải nhất quán đủ dùng. Có 3 chiến lược (thường kết hợp):
| Chiến lược | Cách làm | Ưu | Nhược | Khi nào |
|---|---|---|---|---|
| **Một nguồn sự thật (single write)** | Chỉ hệ mới (hoặc cũ) được ghi; bên kia đọc qua API hoặc nhận bản sao | Đơn giản, không xung đột ghi | Bên đọc có thể trễ; phụ thuộc bên ghi | Ưu tiên nếu làm được |
| **CDC (Change Data Capture)** | Đọc thay đổi từ DB log (ví dụ Debezium đọc binlog/WAL) đẩy sang bên kia | Không sửa code legacy | Độ trễ; mapping schema; vòng lặp nếu hai chiều | Legacy không sửa được |
| **Sync hai chiều có kiểm soát** | Cả hai ghi, đồng bộ qua event/CDC, có quy tắc giải xung đột | Linh hoạt giai đoạn chuyển tiếp | **Phức tạp, dễ tạo vòng lặp/xung đột** | Chỉ tạm thời, phạm vi hẹp |

~~~seq
title: CDC dong bo mot chieu (Legacy -> New)
actors: Legacy | LegacyDB | CDC | NewSvc | NewDB
Legacy -> LegacyDB: UPDATE orders
LegacyDB -> CDC: doc thay doi tu WAL
CDC -> NewSvc: event OrderUpdated
NewSvc -> NewDB: upsert orders (idempotent)
NewSvc --> CDC: ack
~~~

Quy tắc sống còn cho sync hai chiều: (1) **Idempotent** — nhận lại cùng event không tạo bản ghi trùng (dùng key tự nhiên/upsert). (2) **Chống vòng lặp** — event do sync tạo ra phải gắn cờ {{source=sync}} để CDC bên kia bỏ qua, nếu không A->B->A->B vô hạn. (3) **Một trường một chủ** — mỗi field có đúng một hệ là chủ (source of truth); tránh hai bên cùng sửa một field. (4) **Reconcile định kỳ** — job so sánh hai bên, báo lệch.

### Bước 3: Di trú theo lát cắt (slice)
Không chuyển theo tầng kỹ thuật ("chuyển hết DB trước") mà theo **khả năng nghiệp vụ** dọc:
1. Chọn lát cắt nhỏ, giá trị rõ, ít phụ thuộc (ví dụ: "xem chi tiết đơn" trước, "tạo đơn + thanh toán" sau).
2. Xây trong hệ mới, migrate dữ liệu lịch sử lát cắt đó (backfill), bật routing (canary 1% → 10% → 100%).
3. So sánh kết quả (shadow/parallel run nếu được): gọi cả hai, trả kết quả cũ cho user, log khác biệt.
4. Đóng băng ghi trên phần đã migrate ở hệ cũ (read-only hoặc chặn).

### Bước 4: Khi nào tắt hệ cũ?
Tắt khi **tất cả** điều kiện sau đúng:
- 100% traffic các khả năng đã route sang mới, duy trì ổn định (ví dụ 2–4 tuần) không rollback.
- Không còn consumer đọc/ghi trực tiếp DB legacy (kiểm tra connection, CDC, job batch, report).
- Dữ liệu lịch sử cần giữ đã backfill/archived; đối chiếu checksum/số lượng khớp.
- Runbook rollback hết hiệu lực (không ai cần quay lại), và team vận hành ký xác nhận.
- Hợp đồng/compliance cho phép ngừng (lưu trữ audit nếu cần).

Tắt theo từng phần: thu hồi quyền truy cập, tắt route, tắt CDC, đặt DB legacy read-only một thời gian, rồi mới decommission. Giữ snapshot/backup trước khi xoá hẳn.

### Pitfall production
- **Sync hai chiều không chống vòng lặp:** CDC đẩy A->B, B ghi DB kích CDC đẩy B->A — bão event, dữ liệu nhấp nháy. Luôn gắn metadata nguồn và bỏ qua event do sync sinh ra.
- **Chuyển "tầng" thay vì "lát cắt":** migrate hết DB nhưng logic vẫn ở legacy → hai hệ ghép chặt qua DB chung, không tắt được cái nào.
- **Quên consumer ẩn của legacy DB:** report, script kế toán, integration đối tác đọc thẳng DB cũ. Phải rà soát toàn bộ kết nối trước khi tắt.
- **Không có shadow comparison:** tưởng hệ mới đúng nhưng lệch logic tính thuế/khuyến mãi — phát hiện khi khách khiếu nại. Chạy song song và so diff trên traffic thật (ẩn PII) trước khi cutover.

### Ví dụ đời thực
Một monolith đặt hàng 12 năm tuổi không được ngừng dịch vụ. **Triệu chứng:** team muốn thay hệ mới nhưng business chỉ chấp nhận downtime gần như 0; lần thử big-bang trước đó bị huỷ vì rủi ro cutover. **Điều tra:** lập bản đồ endpoint và consumer DB legacy, phát hiện 38 endpoint public, 11 job batch và 4 báo cáo đọc thẳng DB cũ; endpoint "xem chi tiết đơn" chiếm 42% traffic đọc và ít phụ thuộc ghi. **Nguyên nhân gốc:** hệ cũ là hộp đen, dữ liệu và logic gắn chặt, nên không thể thay toàn bộ an toàn trong một đêm. **Xử lý:** đặt routing facade trước legacy; chọn lát cắt đầu tiên là GET /orders, dựng service mới, backfill dữ liệu lịch sử, dùng CDC một chiều từ legacy DB sang new DB cho giai đoạn chuyển tiếp; chạy shadow compare 2 tuần, rồi canary 1% → 10% → 100%; event sync gắn {{source=sync}} để chống vòng lặp. **Kết quả đo được:** sau 4 tuần, 42% traffic đọc đơn chạy trên hệ mới với tỷ lệ khác biệt shadow < 0,2% (đều là mapping hiển thị), không downtime; legacy giảm dần theo bảng endpoint còn lại.

### Trả lời mẫu khi phỏng vấn
"Với hệ thống legacy không được ngừng dịch vụ, em dùng Strangler Fig để di trú tăng dần, không big-bang. Em đặt một routing facade trước hệ cũ: request nào đã migrate thì đi hệ mới, chưa migrate thì đi legacy. Em cắt theo lát cắt nghiệp vụ dọc, ví dụ bắt đầu từ khả năng đọc ít rủi ro, sau đó mới tới luồng ghi phức tạp. Phần khó nhất là dữ liệu: nếu có thể em chọn một nguồn sự thật; nếu legacy không sửa được thì dùng CDC như Debezium, đảm bảo consumer idempotent, có cơ chế chống vòng lặp bằng metadata nguồn, và reconcile định kỳ. Trước khi cutover em chạy shadow hoặc parallel compare trên traffic thật. Em chỉ tắt phần legacy khi 100% traffic đã route ổn định, không còn consumer ẩn đọc DB cũ, dữ liệu đã backfill/đối chiếu, và có thời gian read-only trước khi decommission."

> Senior tip: Tiêu chí thành công của strangler không phải "hệ mới xong" mà là "mỗi tháng tắt được thêm một phần legacy đo được". Lập bảng: endpoint nào còn trên legacy, % traffic, ngày mục tiêu tắt. Nếu 3 tháng bảng không thay đổi, bạn đang xây hệ mới song song chứ không phải strangler — phải quay lại cắt lát cắt nhỏ hơn.`,
  follow: [
    'Bạn xử lý trường hợp legacy và hệ mới có mô hình dữ liệu khác nhau (ví dụ 1 bảng cũ tách thành 3 bảng mới)?',
    'Shadow traffic so sánh kết quả khác nhau — bạn phân loại khác biệt "chấp nhận được" và "lỗi" thế nào?',
    'Khi nào strangler KHÔNG phù hợp và bạn buộc phải cân nhắc cách khác?'
  ],
  tags: ['strangler fig', 'legacy migration', 'CDC', 'routing', 'data sync', 'incremental migration'],
  refs: [
    { type: 'article', title: 'Martin Fowler: Strangler Fig Application', url: 'https://martinfowler.com/bliki/StranglerFigApplication.html' },
    { type: 'doc', title: 'Debezium Documentation', url: 'https://debezium.io/documentation/' }
  ]
},
{
  id: 'architecture-026',
  topic: 'architecture',
  level: 'lead',
  q: 'Bạn thiết kế multi-tenancy cho sản phẩm SaaS B2B (nhiều công ty khách dùng chung một hệ thống). So sánh shared schema, schema-per-tenant, DB-per-tenant; xử lý noisy neighbor và cô lập dữ liệu thế nào?',
  a: `**Tóm tắt:** Multi-tenancy (đa thuê bao) nghĩa là một hệ thống phần mềm phục vụ nhiều khách hàng (tenant — ví dụ mỗi công ty là một tenant) trên cùng hạ tầng, nhưng dữ liệu của họ phải cô lập với nhau. Ba mô hình chính: **shared schema** (chung bảng, có cột {{tenant_id}}) rẻ và scale số tenant lớn nhất nhưng rủi ro rò rỉ cao nhất nếu code quên lọc; **schema-per-tenant** tách schema trên cùng DB; **DB-per-tenant** cô lập mạnh nhất, đắt và khó vận hành khi nhiều tenant. Thực tế hay dùng **lai**: tenant nhỏ chung, tenant lớn/trả nhiều hoặc có yêu cầu tuân thủ được cấp DB riêng. Noisy neighbor (hàng xóm ồn — một tenant dùng quá nhiều tài nguyên làm tenant khác chậm) xử lý bằng giới hạn tài nguyên, hàng đợi công bằng, và tách tầng khi cần.

### Ba mô hình so sánh
| Tiêu chí | Shared schema ({{tenant_id}}) | Schema per tenant | DB per tenant |
|---|---|---|---|
| Cô lập dữ liệu | Yếu nhất (phụ thuộc code) | Khá (tách namespace) | Mạnh nhất |
| Rủi ro rò rỉ do bug | Cao (quên {{WHERE tenant_id}}) | Trung bình | Thấp |
| Chi phí / tenant | Thấp nhất | Trung bình | Cao nhất |
| Scale số tenant | Rất tốt (hàng nghìn) | Trung bình (giới hạn số schema/connection) | Kém khi quá nhiều DB |
| Migrate schema | 1 lần | N lần (mỗi schema) | N lần (mỗi DB) |
| Tuỳ biến schema/phiên bản | Khó | Có thể | Dễ |
| Backup/restore 1 tenant | Khó (lọc dòng) | Dễ hơn | Dễ |
| Tuỳ hợp đồng (dữ liệu đặt tại quốc gia) | Khó | Khó | Dễ (đặt DB ở region) |

### Shared schema: cách làm an toàn
- Mọi bảng nghiệp vụ có {{tenant_id}} (NOT NULL, có index). Khóa chính tổng hợp hoặc unique gồm {{tenant_id}} để tránh va chạm.
- **Bắt buộc lọc tenant ở tầng hạ tầng, không dựa vào dev nhớ:** dùng Hibernate filter/{{@TenantId}} (Hibernate 6), Row Level Security (RLS) của PostgreSQL, hoặc wrapper repository tự chèn điều kiện. RLS là lớp phòng thủ kép: ngay cả câu SQL thô quên điều kiện, DB vẫn chặn.
~~~sql
-- PostgreSQL RLS: DB tự lọc theo tenant đang đặt trong session
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON orders
  USING (tenant_id = current_setting('app.tenant_id')::bigint);
~~~
~~~java
// Set tenant mỗi request (sau khi xác thực), clear trong finally
jdbc.execute("SET LOCAL app.tenant_id = '" + tenantId + "'");
// SET LOCAL chỉ sống trong transaction — tránh rò sang request khác
~~~
- Tenant lấy từ **claim đã xác thực** (token), không tin giá trị client gửi tự do (header {{X-Tenant}} phải đối chiếu quyền).

### Noisy neighbor
- **Cái gì:** Tenant A chạy báo cáo nặng / import 10 triệu dòng làm DB CPU 100%, tenant B (trả tiền) bị chậm theo. Giống chung cư: một hộ xả nước tối đa làm cả tầng yếu áp lực.
- **Xử lý theo tầng:**
  - **Giới hạn tốc độ (rate limit) per tenant:** số request/giây, kích thước payload, số job đồng thời. Trả 429/503 có {{Retry-After}}.
  - **Hàng đợi công bằng:** job nặng (export, import) đi qua queue; worker lấy theo vòng (fair scheduling) để tenant lớn không chiếm hết slot.
  - **Cô lập tài nguyên DB:** giới hạn {{statement_timeout}} per tenant/role; connection pool tách cho tác vụ nặng; read replica cho báo cáo. Với PostgreSQL có thể dùng {{ALTER ROLE tenant_a SET statement_timeout = '5s'}}.
  - **Tách tầng cho tenant "cá voi":** tenant rất lớn hoặc yêu cầu SLA cao → chuyển sang DB-per-tenant hoặc cụm riêng (mô hình lai). Đây là lý do thực tế phải thiết kế để **di chuyển tenant** được.
  - **Quan sát per tenant:** metric độ trễ/lỗi/CPU truy vấn gắn nhãn {{tenant_id}} để phát hiện ai gây tải.

### Cách chọn thực tế
1. SaaS giai đoạn đầu, nhiều tenant nhỏ, ngân sách hạn chế: **shared schema** + RLS + rate limit. Đầu tư lớp tenant context thật chặt.
2. Số tenant trung bình, cần tuỳ biến nhẹ: **schema-per-tenant** (chú ý giới hạn connection/migration).
3. Ít tenant lớn, yêu cầu tuân thủ/data residency hoặc trả phí cao: **DB-per-tenant**.
4. Trưởng thành: **lai** — mặc định shared, nâng hạng tenant đặc biệt sang DB riêng. Thiết kế {{TenantRouter}} (chọn datasource theo tenant) từ đầu để việc nâng hạng không phải viết lại.

### Pitfall production
- **Rò rỉ tenant do thiếu lọc:** một câu query admin, một job batch, một API export quên {{tenant_id}} → trả dữ liệu chéo. Phòng thủ nhiều lớp: {{@TenantId}}/filter + RLS + test tự động quét query không có điều kiện tenant + review.
- **Cache dùng chung key không có tenant:** {{cache.get("product:123")}} trả sản phẩm của tenant A cho tenant B. Luôn đưa {{tenant_id}} vào cache key.
- **Connection pool bùng nổ với DB/schema-per-tenant:** 500 tenant × 5 connection × 10 instance = 25.000 connection. Cần pooler (PgBouncer), pool lười, hoặc giới hạn tenant hoạt động đồng thời.
- **Migration N lần thất bại giữa chừng:** 200/500 schema đã migrate, 201 lỗi → trạng thái không đồng nhất. Cần công cụ migration per-tenant có theo dõi phiên bản và khả năng chạy lại (idempotent).

### Ví dụ đời thực
- **Triệu chứng:** Sản phẩm SaaS B2B dùng shared schema, phục vụ ~1.800 tenant. Một buổi sáng, đội hỗ trợ nhận 6 phiếu từ công ty A báo thấy đơn hàng của công ty B trong màn hình quản trị. Tổng ~120 bản ghi bị lộ trong 25 phút trước khi phát hiện.
- **Điều tra:** Tra log truy cập API thấy các request đều đi qua endpoint export báo cáo. Kiểm tra metric truy vấn theo tenant (nhãn {{tenant_id}} gắn ở tầng ứng dụng) cho thấy endpoint này ghi nhận truy vấn không kèm ngữ cảnh tenant. Đọc mã nguồn: đường đi export gọi câu SQL thô để tối ưu hiệu năng, ghép điều kiện ngày tháng nhưng quên thêm {{tenant_id}}; đường đi này cũng bỏ qua Hibernate filter vì không dùng repository chuẩn.
- **Nguyên nhân gốc:** Phòng thủ chỉ có một lớp (filter ở ORM). Khi một luồng code "đi tắt" dùng SQL thô và không qua lớp đó, không còn lớp chặn thứ hai. Bảng PostgreSQL chưa bật Row Level Security (RLS) nên database chấp nhận mọi truy vấn hợp lệ cú pháp.
- **Cách xử lý:** (1) Ngắn hạn (trong 40 phút): tắt endpoint export, xoá dữ liệu cache phản hồi liên quan, thông báo khách hàng bị ảnh hưởng theo quy trình sự cố. (2) Trung hạn (1–2 tuần): bật RLS cho các bảng nghiệp vụ, đặt {{SET LOCAL app.tenant_id}} trong transaction sau bước xác thực, viết lại truy vấn export qua tầng có kiểm soát tenant. (3) Bổ sung test tự động: quét truy vấn SQL trong codebase và bài kiểm tra tích hợp tạo hai tenant, xác nhận tenant A không đọc được dữ liệu tenant B trên mọi API nhạy cảm.
- **Kết quả đo được:** Sau 30 ngày, 0 sự cố rò rỉ chéo. Bộ kiểm tra cô lập tenant chạy trong CI chặn 2 lần code mới thiếu điều kiện tenant trước khi merge. Độ trễ endpoint export tăng ~8 ms do RLS đánh giá policy, chấp nhận được so với rủi ro tuân thủ.

### Trả lời mẫu khi phỏng vấn
"Khi thiết kế multi-tenancy cho SaaS B2B, em bắt đầu từ mức cô lập dữ liệu và chi phí vận hành. Ba lựa chọn là shared schema có {{tenant_id}}, schema-per-tenant và DB-per-tenant. Với giai đoạn nhiều tenant nhỏ, em thường chọn shared schema vì chi phí và khả năng mở rộng số tenant tốt, nhưng em không tin vào việc mỗi developer luôn nhớ thêm điều kiện lọc. Em đặt phòng thủ hai lớp: lớp ứng dụng gắn ngữ cảnh tenant từ token đã xác thực và lớp cơ sở dữ liệu dùng Row Level Security của PostgreSQL để tự chặn truy vấn quên điều kiện. Vấn đề tiếp theo là noisy neighbor, tức một tenant chạy báo cáo nặng làm tenant khác chậm, nên em giới hạn tốc độ theo tenant, tách tác vụ nặng vào hàng đợi xử lý công bằng, và đặt {{statement_timeout}} cho truy vấn dài. Thực tế em từng gặp sự cố rò rỉ 120 bản ghi do một endpoint dùng SQL thô bỏ qua ORM filter; sau khi bật RLS và thêm kiểm tra cô lập tenant trong CI, lỗi kiểu đó không tái diễn. Em cũng thiết kế {{TenantRouter}} từ đầu để tenant lớn hoặc có yêu cầu tuân thủ có thể tách sang DB riêng mà không phải viết lại."

> Senior tip: Trong phỏng vấn, đừng chỉ chọn một mô hình — hãy nói "tôi chọn shared schema ban đầu nhưng thiết kế TenantContext + TenantRouter để có thể tách tenant lớn sau, vì yêu cầu cô lập thường tăng theo giá trị hợp đồng". Và luôn nhắc hai lớp phòng thủ (code + RLS): một bug ứng dụng không được phép trở thành sự cố rò rỉ dữ liệu khách hàng.`,
  follow: [
    'Bạn di chuyển một tenant từ shared schema sang DB riêng với gần như không downtime thế nào?',
    'Làm sao test tự động phát hiện query thiếu điều kiện tenant_id?',
    'Tenant yêu cầu dữ liệu đặt tại EU (data residency) — kiến trúc thay đổi ra sao?'
  ],
  tags: ['multi-tenancy', 'SaaS', 'tenant isolation', 'noisy neighbor', 'RLS', 'PostgreSQL'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Row Security Policies', url: 'https://www.postgresql.org/docs/current/ddl-rowsecurity.html' },
    { type: 'doc', title: 'Hibernate ORM User Guide (Multitenancy)', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }
  ]
},
{
  id: 'architecture-027',
  topic: 'architecture',
  level: 'lead',
  q: 'Event sourcing là gì? Khi nào nó đáng dùng, khi nào là over-engineering? Bạn xử lý snapshot và schema evolution (tiến hoá lược đồ) của event ra sao?',
  a: `**Tóm tắt:** Event sourcing (lưu theo sự kiện) lưu **chuỗi sự kiện bất biến** mô tả mọi thay đổi ("Đơn đã tạo", "Đã thêm món", "Đã thanh toán") thay vì chỉ lưu trạng thái hiện tại. Trạng thái hiện tại suy ra bằng cách phát lại (replay) các event. Nó cho audit log tự nhiên, khả năng dựng lại trạng thái quá khứ, và dễ phát event tích hợp — nhưng đổi cách tư duy, truy vấn phức tạp hơn (thường cần projection/read model), và schema event khó đổi. **Đáng dùng** khi lịch sử/audit/khả năng replay là yêu cầu cốt lõi (kế toán sổ cái, giao dịch tài chính, quy trình có tranh chấp). **Over-engineering** cho CRUD thông thường (quản lý danh mục, hồ sơ đơn giản) nơi bạn chỉ cần trạng thái hiện tại.

### Cái gì → ví dụ đời thường
- **State-based (thông thường):** tài khoản có số dư 500.000đ — bạn chỉ biết hiện tại, không biết vì sao.
- **Event sourcing:** lưu chuỗi: {{AccountOpened(+0)}} → {{MoneyDeposited(+1.000.000)}} → {{MoneyWithdrawn(-500.000)}} → số dư hiện tại = phát lại = 500.000đ. Bạn biết toàn bộ lịch sử, có thể trả lời "số dư cuối ngày 15 là bao nhiêu?" bằng cách replay tới ngày 15. Giống sao kê ngân hàng (danh sách giao dịch) vs chỉ nhìn số dư.
- **Event bất biến:** đã ghi thì không sửa/xoá (append-only). Sửa sai bằng event bù ({{MoneyWithdrawnReversed}}), không đè event cũ — giữ được audit.

### Cấu trúc lưu trữ (đơn giản hoá)
~~~text
Event Store (bảng append-only, ví dụ theo aggregate)
| aggregate_id | version | type              | data (JSON)                 | occurred_at |
| ord-123      | 1       | OrderCreated      | {customer:7, items:[...]}   | 10:00:01    |
| ord-123      | 2       | ItemAdded         | {sku:"A1", qty:2}           | 10:00:15    |
| ord-123      | 3       | OrderPaid         | {amount:200000, txn:"T9"}   | 10:05:00    |
Trạng thái hiện tại = fold/replay event 1..3 theo thứ tự version.
~~~
~~~java
// Suy ra trạng thái: áp từng event lên aggregate rỗng
Order order = Order.empty();
for (Event e : store.load("ord-123")) order.apply(e);
// order giờ ở trạng thái "Paid" với đúng items
~~~
- **Optimistic concurrency:** ghi event mới kèm {{expectedVersion}}. Nếu ai đó đã ghi version 4, ghi với expected 3 sẽ thất bại (conflict) — tránh ghi đè mất sự kiện.

### Khi nào ĐÁNG dùng
- **Audit/bắt buộc truy vết:** tài chính, kế toán sổ cái, bảo hiểm, y tế — cần chứng minh "ai đổi gì, lúc nào, giá trị trước/sau". Event sourcing cho audit "miễn phí" vì bản chất là log.
- **Cần dựng lại quá khứ / what-if:** "trạng thái đơn hàng tại thời điểm tranh chấp là gì?", phát lại logic mới trên event cũ để sửa báo cáo.
- **Miền nghiệp vụ giàu hành vi, event tự nhiên:** quy trình nhiều bước, domain expert nói bằng sự kiện ("khi khách hủy sau khi giao...").
- **Tích hợp hướng sự kiện:** event nội bộ có thể publish ra ngoài (thường qua outbox) cho service khác.

### Khi nào OVER-ENGINEERING
- **CRUD thuần:** quản lý danh mục sản phẩm, cấu hình — chỉ cần giá trị hiện tại, không ai hỏi "tên sản phẩm lúc 3 tháng trước là gì?". Thêm event store, projection, replay = chi phí lớn không mang lại giá trị.
- **Team chưa quen:** mô hình tư duy khác (suy nghĩ bằng event, không phải set state), debug khó hơn ("trạng thái này đến từ event nào?"), tooling ít hơn ORM truyền thống.
- **Yêu cầu truy vấn ad-hoc mạnh:** hỏi "tất cả đơn > 1 triệu, giao Hà Nội, tháng trước" trên event store thô rất bất tiện → bắt buộc xây read model/projection (CQRS). Nếu mọi thứ là truy vấn phức tạp, chi phí projection lớn.
- **Miền dữ liệu lớn, vòng đời dài:** aggregate có 100.000 event → replay chậm (cần snapshot, xem dưới).

### Snapshot (ảnh chụp)
- **Vấn đề:** aggregate sống 5 năm tích 50.000 event; load mỗi lần replay 50.000 event → chậm.
- **Giải pháp:** định kỳ lưu **snapshot** = trạng thái tại version N. Load = đọc snapshot gần nhất + replay phần event sau snapshot.
~~~text
Load ord-123 (50.000 events, snapshot tại version 49.000):
1. Đọc snapshot @ 49.000 -> có trạng thái ngay.
2. Replay event 49.001..50.000 (1.000 events) -> trạng thái hiện tại.
~~~
- Snapshot là **tối ưu**, không phải nguồn sự thật; có thể xoá và dựng lại từ event. Lưu mỗi K event (ví dụ 500) hoặc theo thời gian. Snapshot phải đi kèm version để biết replay tiếp từ đâu.

### Schema evolution của event (tiến hoá lược đồ)
Event sống mãi (append-only), code thì đổi — đây là thách thức lớn nhất:
- **Quy tắc vàng:** event đã phát hành là **hợp đồng bất biến**. Không đổi nghĩa field, không tái sử dụng type cho mục đích khác.
- **Thay đổi tương thích (an toàn):** thêm field tuỳ chọn có giá trị mặc định; thêm loại event mới (code cũ bỏ qua). Giống mở rộng JSON về phía trước.
- **Thay đổi không tương thích:** đổi tên/kiểu/xoá field bắt buộc, đổi nghĩa. **Không** sửa event cũ trong store. Cách xử lý:
  - **Upcasting:** khi đọc, chuyển event phiên bản cũ lên cấu trúc mới trong code ({{v1 -> v2}}) trước khi apply. Store vẫn giữ bản gốc.
  - **Version hoá rõ:** {{OrderCreated_v2}}, hoặc field {{schemaVersion}} trong payload.
  - **Copy-and-transform (hiếm, cẩn thận):** migrate sang stream mới — chỉ khi thực sự cần, phải giữ truy vết.
- Tránh payload mơ hồ: dùng tên rõ, đơn vị rõ ({{amountCents}}, {{currency}}), không nhét cả object khổng lồ nếu chỉ cần vài field.

### Pitfall production
- **Dùng event sourcing rồi lại truy vấn trực tiếp event store cho UI:** chậm và vụng. Cần **projection/read model** (bảng thường, cập nhật từ event) cho truy vấn — tức chấp nhận CQRS (tách đọc/ghi).
- **Sửa/xoá event trong store "cho tiện":** phá audit và có thể làm replay ra trạng thái sai. Muốn "xóa" theo GDPR → dùng crypto-shredding (mã hoá dữ liệu cá nhân trong event bằng key per-user, xoá key) thay vì xoá event.
- **Event quá to hoặc quá chi tiết:** lưu cả blob/ảnh trong event → store phình; hoặc event "mọi lần gõ phím" → không mang nghĩa nghiệp vụ. Event nên là **fact nghiệp vụ có ý nghĩa**.
- **Không version event từ đầu:** 6 tháng sau đổi schema không còn đường lên. Đặt {{schemaVersion}} và cơ chế upcast ngay từ event đầu tiên.

### Ví dụ đời thực
- **Triệu chứng:** Hệ thống ví điện tử dùng event sourcing cho sổ cái giao dịch (aggregate tài khoản). Sau 18 tháng vận hành, một số tài khoản hoạt động dày (nhà bán lẻ) tích ~60.000 event. Khi gọi API lấy số dư/chi tiết tài khoản, p95 độ trễ tăng từ 120 ms lên 2,8 giây vào giờ cao điểm; thread pool xử lý lệnh nạp/rút bắt đầu xếp hàng.
- **Điều tra:** Bật theo dõi thời gian load aggregate thấy phần lớn thời gian nằm ở bước đọc và phát lại (replay) hàng chục nghìn event từ event store. Kiểm tra metric cho thấy tài khoản chậm đều có {{event_count}} rất lớn; truy vấn DB vẫn dùng index {{(aggregate_id, version)}} nhưng số bản ghi đọc mỗi lần là vấn đề.
- **Nguyên nhân gốc:** Thiết kế ban đầu chưa bật snapshot. Mỗi thao tác đều replay toàn bộ lịch sử từ version 1, nên chi phí load tăng tuyến tính theo tuổi và tần suất giao dịch của aggregate.
- **Cách xử lý:** (1) Triển khai snapshot: sau mỗi 500 event (hoặc khi load vượt ngưỡng), lưu trạng thái tài khoản kèm {{version}}. Luồng load đổi thành "đọc snapshot gần nhất + replay phần event còn lại". (2) Chạy job dựng snapshot nền cho các aggregate "nóng" để lần load đầu sau triển khai không phải trả hết chi phí replay. (3) Thiết lập giám sát {{events_replayed_per_load}} và {{aggregate_event_count}}; đặt cảnh báo khi replay trung bình vượt 1.000 event.
- **Kết quả đo được:** Với tài khoản ~60.000 event, số event replay mỗi lần load giảm xuống còn 0–500. p95 API lấy số dư giảm từ 2,8 giây về 150 ms; tải đọc trên event store giảm khoảng 70% cho nhóm tài khoản hoạt động dày. Snapshot bị xoá thử nghiệm cho một aggregate vẫn dựng lại đúng trạng thái từ event, xác nhận snapshot chỉ là tối ưu.

### Trả lời mẫu khi phỏng vấn
"Em hiểu event sourcing là cách lưu mọi thay đổi trạng thái dưới dạng chuỗi sự kiện bất biến, ví dụ tài khoản được mở, tiền nạp vào, tiền rút ra, rồi suy ra trạng thái hiện tại bằng cách phát lại các sự kiện đó. Cách này rất mạnh khi bài toán cần audit và truy vết, như sổ cái tài chính, vì bản thân event store đã là lịch sử đầy đủ. Nhưng em không dùng nó cho mọi CRUD, vì truy vấn phức tạp hơn, team phải tư duy theo event và thường cần thêm read model. Khi dùng thật, hai vấn đề em luôn chuẩn bị là snapshot và tiến hoá lược đồ event. Snapshot giúp aggregate có nhiều sự kiện không phải replay từ đầu; snapshot chỉ là tối ưu, nguồn sự thật vẫn là event. Với schema evolution, event đã ghi là hợp đồng bất biến, nên thay đổi tương thích thì thêm field tuỳ chọn, còn thay đổi không tương thích thì em dùng upcasting khi đọc hoặc version hoá event, không sửa event cũ. Em từng xử lý một case tải tài khoản 60.000 event mất gần 3 giây; sau khi thêm snapshot mỗi 500 event, p95 giảm còn khoảng 150 mili giây."

> Senior tip: Câu trả lời senior không phải "event sourcing tuyệt vời" mà là "tôi dùng event sourcing cho phần cần audit/replay (ví dụ sổ cái giao dịch) và giữ CRUD thường cho phần còn lại trong cùng hệ thống". Event sourcing là công cụ cho đúng bài toán, không phải kiến trúc mặc định cho mọi thứ. Nếu interviewer hỏi "khi nào KHÔNG dùng" mà bạn không nêu được, đó là dấu hiệu chưa dùng thực tế.`,
  follow: [
    'Event sourcing khác gì chỉ lưu audit log hoặc dùng CDC/outbox? Khi nào audit log là đủ?',
    'Bạn thiết kế projection bị lỗi hoặc cần thay đổi — rebuild read model thế nào trên production?',
    'Làm sao đáp ứng yêu cầu "xóa dữ liệu người dùng" (GDPR) khi event store là append-only?'
  ],
  tags: ['event sourcing', 'CQRS', 'snapshot', 'schema evolution', 'audit', 'append-only'],
  refs: [
    { type: 'article', title: 'Martin Fowler: Event Sourcing', url: 'https://martinfowler.com/eaaDev/EventSourcing.html' },
    { type: 'doc', title: 'EventStoreDB: Event Sourcing Basics', url: 'https://www.eventstore.com/event-sourcing' }
  ]
},
{
  id: 'architecture-028',
  topic: 'architecture',
  level: 'senior',
  q: 'Cell-based architecture (kiến trúc theo ô/tế bào) là gì? Nó giúp giới hạn blast radius (bán kính ảnh hưởng) như thế nào, và bạn thiết kế routing, chia cell, quản lý state ra sao?',
  a: `**Tóm tắt:** Cell-based architecture chia hệ thống thành nhiều **cell** giống nhau, mỗi cell là một cụm độc lập đầy đủ (compute + storage + dependencies cần thiết) phục vụ một **tập con** người dùng/tenant. Lỗi, deploy xấu, hoặc quá tải chỉ ảnh hưởng cell đó — **blast radius bị giới hạn** theo kích thước cell thay vì làm sập toàn hệ. Đổi lại phải có lớp **cell router** (định tuyến tenant → cell), chiến lược chia/di chuyển tenant, và chấp nhận rằng một số state/dữ liệu toàn cục khó chia.

### Cái gì → vì sao cần
- **Cái gì:** Thay vì một cụm khổng lồ phục vụ mọi người dùng (shared-everything), bạn tạo N bản sao thu nhỏ của stack: {{cell-1}} phục vụ tenant 1–1000, {{cell-2}} tenant 1001–2000... Mỗi cell có app, DB (hoặc shard), cache riêng. Một cell hỏng = chỉ 1000 tenant bị ảnh hưởng, 9000 tenant còn lại vẫn chạy.
- **Ví dụ đời thường:** Tàu thủy có nhiều khoang kín nước. Một khoang thủng thì ngập khoang đó, tàu chưa chìm vì khoang khác vẫn kín. Một thân liền mạch thì một lỗ thủng có thể làm chìm cả tàu.
- **Vì sao cần:**
  - **Blast radius:** deploy lỗi, query xấu làm cạn connection, hoặc bug chỉ kích hoạt với dữ liệu tenant X → chỉ cell chứa X chết. Với cụm đơn, 100% người dùng ảnh hưởng.
  - **Scale theo đơn vị:** thêm cell mới khi tăng tenant, thay vì phình một cụm đơn khổng lồ (gặp giới hạn DB connection, kích thước cluster, thời gian failover).
  - **Giới hạn failure domain:** thử nghiệm/rollout từng cell (canary theo cell).

### Thành phần chính
~~~seq
title: Cell-based routing
actors: Client | Router | Cell1 | Cell2 | Global
Client -> Router: request (tenant=1500)
Router -> Router: map tenant 1500 -> cell-2
Router -> Cell2: forward request
Cell2 --> Router: response
Router --> Client: response
note Client..Global: Global chi giu mapping tenant->cell
~~~

| Thành phần | Vai trò | Lưu ý |
|---|---|---|
| **Cell router** | Nhận request, tra cứu {{tenant -> cell}}, chuyển tiếp | Phải cực kỳ đơn giản, sẵn sàng cao; router hỏng = toàn hệ hỏng (blast radius mới) — nên là lớp mỏng, stateless, multi-AZ/region |
| **Cell** | Stack đầy đủ cho tập tenant được gán | Tự chủ nhất có thể: app, DB, cache, queue. Giảm phụ thuộc chéo giữa cell |
| **Bảng ánh xạ tenant→cell** | Nguồn sự thật "tenant này ở đâu" | Lưu ở tầng global bền (replicated), cache tại router; thay đổi khi di chuyển tenant |
| **Control plane (global)** | Tạo/xoá cell, gán tenant, di chuyển, deploy | Tách khỏi data plane; control plane chậm không được làm data plane chết |

### Chia cell và giới hạn kích thước
- Chọn kích thước cell để một cell chết vẫn chấp nhận được (ví dụ mỗi cell ≤ 5% tổng tenant, hoặc ≤ 5% doanh thu). Đây chính là **blast radius mục tiêu**.
- Gán tenant: hash/mod (đơn giản, cố định) hoặc tra cứu bảng (linh hoạt, di chuyển được). Thực tế ưu tiên **bảng ánh xạ** vì tenant lớn/nhỏ không đều và cần di chuyển.
- Di chuyển tenant giữa cell (khi cell đầy hoặc cân bằng): cần cơ chế migrate dữ liệu tenant + chuyển ánh xạ, thường có cửa sổ đóng băng ghi ngắn hoặc dual-write tạm.

### State toàn cục — điểm khó
Không phải mọi thứ chia theo cell được:
- **Dữ liệu tenant (orders, users của tenant):** nằm trong cell — tốt.
- **Danh mục chung, cấu hình toàn cục, tìm kiếm xuyên tenant (admin):** khó đặt trong cell. Cách xử lý: (1) dịch vụ global riêng, read-only replica đẩy xuống cell; (2) chấp nhận truy vấn global đi đường khác (không qua cell router); (3) duplicate dữ liệu tham chiếu vào mỗi cell (eventual consistency).
- **Định danh:** {{tenant_id}}/ID phải globally unique (không trùng giữa cell) — dùng UUID/ULID hoặc dải ID.

### So sánh nhanh với cách khác
| Cách | Blast radius | Độ phức tạp | Phù hợp |
|---|---|---|---|
| Một cụm lớn + autoscale | 100% | Thấp | Nhỏ/vừa, chưa gặp sự cố lan rộng |
| Sharding DB (chỉ DB) | DB chia, app vẫn chung | Trung bình | Nút thắt ở DB |
| **Cell-based (full stack)** | Giới hạn theo cell | Cao | Rất lớn, cần cô lập failure domain mạnh |
| Multi-region active-active | Theo region + cell | Rất cao | Toàn cầu, yêu cầu DR |

### Pitfall production
- **Router thành điểm chết đơn:** router phức tạp, có state, hoặc phụ thuộc DB chậm → sập router là sập hết. Giữ router stateless, cache ánh xạ cục bộ, có cơ chế fallback an toàn.
- **Phụ thuộc global ẩn trong cell:** cell gọi một dịch vụ global duy nhất (auth chung, config service) — dịch vụ đó chết thì mọi cell chết. Audit dependency: cell phải sống được khi global suy giảm (cache credential, cấu hình).
- **Cell không đều (hot cell):** vài tenant "cá voi" dồn vào một cell → cell đó quá tải. Cần giám sát per cell, đặt tenant lớn vào cell riêng hoặc chia lại.
- **Vận hành N cell:** deploy, migrate schema, quan sát nhân lên N lần. Bắt buộc tự động hoá (IaC, deploy theo sóng cell) — làm tay không scale.

### Ví dụ đời thực
- **Triệu chứng:** Nền tảng SaaS chạy một cụm ứng dụng và một cụm cơ sở dữ liệu dùng chung cho ~20.000 tenant. Một lần phát hành tính năng báo cáo mới, một truy vấn thiếu index chỉ bị kích hoạt với kiểu dữ liệu của một nhóm tenant. DB CPU tăng lên 98% trong 6 phút, hàng đợi kết nối cạn, và 100% tenant (kể cả tenant không dùng báo cáo) gặp lỗi 5xx hoặc chậm nghiêm trọng.
- **Điều tra:** Dashboard toàn cụm cho thấy CPU/connection tăng đột ngột ngay sau deploy. Truy vấn chậm hàng đầu (từ thống kê truy vấn chậm) là câu SQL của tính năng mới; tần suất tăng theo một nhóm tenant thử tính năng. Không có cách cô lập nhóm này vì mọi tenant đi chung một cụm ứng dụng và chung kết nối DB.
- **Nguyên nhân gốc:** Blast radius (bán kính ảnh hưởng) của toàn hệ là 100%: một thay đổi xấu hoặc một mẫu tải bất thường lan ra mọi tenant. Hệ thống thiếu ranh giới cô lập failure domain.
- **Cách xử lý:** (1) Ngắn hạn: rollback bản phát hành, thêm giới hạn thời gian truy vấn và index thiếu, khôi phục dịch vụ. (2) Trung hạn: chuyển sang mô hình cell-based. Chia 20.000 tenant thành 20 cell, mỗi cell ~1.000 tenant với stack ứng dụng + DB riêng; đặt cell router mỏng, stateless tra bảng ánh xạ {{tenant -> cell}} (cache cục bộ, dữ liệu gốc đặt ở kho cấu hình bền). (3) Rollout về sau đi theo sóng từng cell, có giám sát per-cell (độ trễ, lỗi, CPU DB).
- **Kết quả đo được:** Khi tái diễn một truy vấn nặng tương tự ở môi trường thử nghiệm có cell, chỉ cell chứa tenant kích hoạt (≈5% tenant) bị ảnh hưởng, các cell khác giữ p95 ổn định. Thời gian deploy tăng do rollout 20 sóng, nhưng được tự động hoá bằng pipeline; rủi ro ảnh hưởng toàn hệ giảm rõ rệt so với cụm đơn.

### Trả lời mẫu khi phỏng vấn
"Em hiểu cell-based architecture là chia hệ thống thành nhiều ô độc lập, mỗi ô có đủ stack để phục vụ một nhóm tenant, thay vì một cụm lớn phục vụ tất cả. Mục tiêu chính là giới hạn blast radius: nếu một deploy lỗi, một truy vấn xấu hay một tenant quá tải gây sự cố, chỉ ô đó bị ảnh hưởng. Về thiết kế, em cần một cell router rất mỏng và stateless để tra ánh xạ tenant sang cell rồi chuyển tiếp; router phải đơn giản và sẵn sàng cao vì nó là điểm còn có thể ảnh hưởng toàn hệ. Dữ liệu nghiệp vụ của tenant nằm trong cell, còn mapping tenant-to-cell và cấu hình toàn cục cần một control plane riêng, tách khỏi data plane. Em cũng phải tính trước việc di chuyển tenant khi cell đầy và xử lý state toàn cục như danh mục dùng chung. Trong một tình huống thực tế, một truy vấn thiếu index sau deploy đã làm 20.000 tenant lỗi vì dùng cụm chung; sau khi chia 20 cell, lỗi tương tự chỉ ảnh hưởng khoảng 5% tenant. Em thường nhấn mạnh cell-based không phải bước đầu, chỉ dùng khi chi phí sự cố lan rộng lớn hơn chi phí vận hành nhiều cell."

> Senior tip: Cell-based không phải bước đầu tiên. Hãy nói: "Tôi chỉ dùng cell khi đã thấy sự cố một tenant/deploy làm ảnh hưởng toàn hệ và chi phí sự cố vượt chi phí vận hành N cell." Nhấn mạnh hai điểm interviewer hay hỏi: router phải cực đơn giản (nó là blast radius còn lại), và phải đo được kích thước cell = blast radius mục tiêu bằng số liệu, không chọn cảm tính.`,
  follow: [
    'Làm sao deploy phiên bản mới an toàn trên 50 cell (rollout strategy)?',
    'Một tenant cần truy vấn dữ liệu tổng hợp xuyên các tenant khác (báo cáo admin) — đi đường nào trong kiến trúc cell?',
    'Router cache ánh xạ tenant→cell bị stale trong lúc di chuyển tenant — xử lý thế nào?'
  ],
  tags: ['cell-based architecture', 'blast radius', 'fault isolation', 'routing', 'scalability'],
  refs: [
    { type: 'doc', title: 'AWS: Cell-Based Architecture Guidance', url: 'https://docs.aws.amazon.com/wellarchitected/latest/reducing-scope-of-impact-with-cell-based-architecture/what-is-a-cell-based-architecture.html' },
    { type: 'article', title: 'AWS Builders Library: Shuffle Sharding / cell concepts', url: 'https://aws.amazon.com/builders-library/workload-isolation-using-shuffle-sharding/' }
  ]
},
{
  id: 'architecture-029',
  topic: 'architecture',
  level: 'lead',
  q: 'Chi phí cloud (FinOps) là gì và vì sao nó là một thuộc tính kiến trúc? Cho ví dụ con số cụ thể và các trade-off kiến trúc ảnh hưởng trực tiếp tới hoá đơn.',
  a: `**Tóm tắt:** FinOps (Financial Operations) là thực hành quản lý chi phí cloud liên tục, có sự phối hợp giữa kỹ thuật, tài chính và sản phẩm. Chi phí cloud **là thuộc tính kiến trúc** vì các quyết định thiết kế (serverless hay container luôn chạy, chọn DB, giữ log bao lâu, chatty service gọi nhau qua mạng, multi-AZ/region) quyết định 70–90% hoá đơn — tối ưu sau khi xây xong chỉ gọt được phần nhỏ. Kiến trúc tốt cân bằng chi phí với độ tin cậy, hiệu năng và tốc độ phát triển, dùng **số liệu đơn vị** (cost per request/order/tenant) thay vì chỉ nhìn tổng hoá đơn.

### Cái gì → vì sao là thuộc tính kiến trúc
- **FinOps là gì:** không phải "đợt cắt giảm cuối quý" mà là vòng lặp: đo (biết tiền đi đâu) → gán chủ (ai chịu trách nhiệm) → tối ưu (đổi kiến trúc/cấu hình) → dự báo. Giống hoá đơn điện: biết máy nào tốn điện mới biết tắt hay thay.
- **Vì sao là thuộc tính kiến trúc:** code chạy đúng nhưng kiến trúc chọn sai có thể tốn gấp 5–10 lần. Ví dụ: hai service chatty gọi nhau 20 lần/request qua NAT Gateway + cross-AZ, mỗi request rẻ nhưng 500 triệu request/tháng thành hoá đơn khổng lồ. Quyết định "gộp hay tách", "gọi sync hay async", "lưu dữ liệu ở đâu, bao lâu" được chốt ở thiết kế.
- **Khái niệm cần biết:** {{on-demand}} (trả theo giờ/giây, linh hoạt, đắt nhất), {{reserved/savings plan}} (cam kết 1–3 năm, giảm ~30–60% cho tải ổn định), {{spot}} (dùng công suất dư, giảm ~60–90% nhưng có thể bị thu hồi — hợp job chịu gián đoạn).

### Ví dụ con số (minh hoạ, để hiểu thứ tự lớn)
Giả sử API thương mại điện tử ~50 request/giây trung bình (≈130 triệu/tháng), giờ cao điểm gấp 4:

| Quyết định kiến trúc | Lựa chọn A (đắt hơn) | Lựa chọn B (rẻ hơn) | Trade-off |
|---|---|---|---|
| Compute | 12 pod EKS luôn chạy cho peak (over-provision) ~\$1.800/tháng | Autoscale 3→12 pod theo tải + mix spot cho worker ~\$700/tháng | B cần autoscale tốt, warm-up; spot chỉ cho job chịu gián đoạn |
| DB | RDS instance lớn on-demand ~\$900/tháng | Right-size + 1yr reserved cho baseline ~\$550/tháng | Reserved cần cam kết; phải đo utilisation thật |
| Log/observability | Giữ log ứng dụng 365 ngày, index tất cả field ~\$1.200/tháng | Giữ 30 ngày hot + archive S3, sampling trace 10% ~\$300/tháng | Mất khả năng tra cứu log cũ; cần truy vết đủ khi sự cố |
| Giao tiếp service | 2 service gọi nhau cross-AZ qua NAT, chatty ~\$400/tháng data transfer | Gộp lời gọi (batch), dùng endpoint nội bộ, cân nhắc đặt cùng AZ/caching ~\$80/tháng | Gộp làm tăng coupling; cross-AZ giúp HA — không bỏ HA chỉ để rẻ |
| Lưu trữ | Ảnh/object luôn S3 Standard ~\$230/tháng (10 TB) | Lifecycle: 30 ngày Standard → IA → Glacier ~\$60/tháng | Truy xuất Glacier chậm/đắt; phù hợp dữ liệu lạnh |

*(Số liệu minh hoạ theo thứ tự lớn thường gặp; thực tế phụ thuộc region/cấu hình — luôn tính bằng pricing calculator và bill thật.)*

Tổng minh hoạ: A ~\$4.530/tháng vs B ~\$1.690/tháng cho cùng chức năng, nhưng B chấp nhận trade-off (retention ngắn hơn, cam kết reserved, autoscale phải chuẩn).

### Đo đúng: đơn vị chi phí
- Tổng hoá đơn tăng có thể là tốt (người dùng tăng). Chỉ số hữu ích: **cost per 1.000 request**, **cost per order**, **cost per tenant/tháng**. Nếu traffic tăng 2× mà cost per order không đổi → kiến trúc scale hiệu quả.
- Gắn nhãn tài nguyên (tag {{service}}, {{team}}, {{env}}) để biết tiền của ai. Thiếu tag = hoá đơn là một cục không ai chịu trách nhiệm.

### Trade-off kiến trúc điển hình
- **Managed vs self-host:** managed (RDS, MSK) đắt tiền dịch vụ hơn tự chạy trên EC2, nhưng giảm công vận hành và rủi ro. Team nhỏ thường rẻ hơn tổng thể khi dùng managed (tính cả lương vận hành).
- **Serverless (Lambda) vs luôn chạy:** Lambda rẻ khi tải thấp/lẻ tẻ (trả theo lần gọi), đắt hơn nhiều khi tải cao ổn định liên tục — lúc đó container/EC2 + reserved rẻ hơn. Phải tính theo profile tải.
- **Độ bền/HA cao vs chi phí:** multi-AZ, replica chéo region, backup dài hạn đều tốn tiền. Chọn theo RPO/RTO yêu cầu, không phải "bật hết cho chắc" mọi hệ thống (hệ nội bộ ít quan trọng không cần mức HA của hệ thanh toán).
- **Build vs buy:** tự xây (log pipeline, auth) tốn công kỹ sư liên tục — chi phí ẩn thường lớn hơn hoá đơn dịch vụ mua.

### Pitfall production
- **Tối ưu vi mô, bỏ qua macro:** dev tốn 3 ngày giảm 5% CPU pod, trong khi log/index chiếm 40% hoá đơn. Luôn bắt đầu từ breakdown top 5 khoản chi.
- **Dữ liệu chuyển mạng (data transfer) bị quên:** cross-AZ, NAT Gateway, egress internet tính tiền theo GB — kiến trúc chatty giữa service có thể làm mục này phình bất ngờ.
- **Tài nguyên mồ côi:** EBS không gắn, load balancer không có target, snapshot cũ, môi trường dev chạy cuối tuần. Tự động tắt/xoá tài nguyên không dùng.
- **Cắt chi phí làm vỡ SLO:** giảm replica, tắt multi-AZ, xoá log để rẻ → sự cố kéo dài, mất niềm tin. FinOps tối ưu **lãng phí**, không tối ưu **độ bền cần thiết**.

### Ví dụ đời thực
- **Triệu chứng:** Hoá đơn AWS của một hệ thương mại điện tử tăng từ ~\$6.200/tháng lên ~\$14.800/tháng trong 2 tháng, trong khi lượng đơn hàng chỉ tăng ~15%. Không có sự cố hiệu năng rõ rệt, nên chi phí bị xem là "tăng trưởng tự nhiên" cho đến khi đội tài chính yêu cầu giải trình.
- **Điều tra:** Phân tích hoá đơn theo tag {{service}} và {{env}} cho thấy ba khoản tăng lớn: (1) log ứng dụng lưu và index 90 ngày ở mức chi tiết cao (~\$3.900/tháng), (2) data transfer qua NAT Gateway tăng do hai service gọi nhau rất chatty theo từng mục giỏ hàng (~\$2.100/tháng), (3) cụm worker over-provision luôn chạy đủ cho giờ cao điểm (~\$1.700/tháng). Metric đơn vị cho thấy {{cost per 1.000 orders}} tăng 2,1 lần.
- **Nguyên nhân gốc:** Các quyết định kiến trúc được chốt theo tính năng: bật log debug kéo dài "để tiện tra cứu", tách service nhưng thiết kế API chatty, và cấp tài nguyên cố định cho peak. Không có chủ sở hữu chi phí theo service và không theo dõi chỉ số đơn vị.
- **Cách xử lý:** (1) Log/quan sát: giữ log hot 30 ngày, mẫu (sampling) log thành công, chuyển log cũ sang lưu trữ giá rẻ; giữ đầy đủ log lỗi và trace khi có sự cố. (2) Giao tiếp: gộp nhiều lời gọi thành một API batch, thêm cache dữ liệu đọc nhiều; không loại bỏ multi-AZ vì mục tiêu là giảm data transfer không cần thiết, không cắt độ bền. (3) Compute: autoscale worker 3→12 theo hàng đợi, dùng reserved cho tải nền ổn định; job batch không nhạy trễ dùng spot với cơ chế thử lại. (4) Quy trình: gắn tag bắt buộc, đặt mục tiêu {{cost per 1.000 orders}}, rà soát hàng tháng.
- **Kết quả đo được:** Sau 6 tuần, hoá đơn giảm còn ~\$8.100/tháng (~45%) dù lượng đơn tiếp tục tăng nhẹ. {{cost per 1.000 orders}} về gần mức trước đợt tăng. SLO p95 và tỷ lệ lỗi không xấu đi; thời gian tra cứu log cũ dài hạn tăng nhưng vẫn đáp ứng khi cần nhờ lưu trữ lạnh.

### Trả lời mẫu khi phỏng vấn
"Em xem chi phí cloud là một thuộc tính kiến trúc, không phải việc chỉ xử lý sau khi hệ thống chạy. Quyết định chọn serverless hay container luôn chạy, dùng managed database nào, giữ log bao lâu, các service gọi nhau chatty hay batch, hay bật multi-AZ đều ảnh hưởng trực tiếp đến hoá đơn. Cách em tiếp cận theo FinOps là đo chi phí theo đơn vị, ví dụ cost per 1.000 request hoặc cost per order, rồi gắn trách nhiệm chi phí cho từng service bằng tag. Khi tối ưu, em bắt đầu từ những khoản lớn nhất thay vì tối ưu vi mô. Ví dụ em từng gặp hoá đơn tăng gấp hơn hai lần trong khi đơn hàng chỉ tăng 15%; nguyên nhân nằm ở log giữ quá lâu, data transfer qua NAT do API chatty và worker cấp cố định cho peak. Sau khi đổi chiến lược log, gộp lời gọi, thêm cache và autoscale kết hợp reserved cho tải nền, chi phí giảm khoảng 45% mà SLO không xấu đi. Em luôn cân bằng chi phí với độ tin cậy: FinOps là cắt lãng phí, không cắt các cơ chế HA hay quan sát mà hệ thống thực sự cần."

> Senior tip: Khi trình bày quyết định kiến trúc, tôi kèm ước tính chi phí bậc lớn (order of magnitude) và chỉ số cost-per-request, ví dụ "phương án A ~\$2k/tháng, B ~\$600/tháng nhưng RTO tăng từ 5 phút lên 30 phút — với hệ thanh toán tôi chọn A, với báo cáo nội bộ tôi chọn B". Điều đó cho thấy bạn xem chi phí là ràng buộc thiết kế thật, không phải việc của đội tài chính sau khi deploy.`,
  follow: [
    'Làm sao bạn phát hiện và xử lý tài nguyên cloud mồ côi (orphaned) tự động?',
    'Khi nào serverless (Lambda) đắt hơn chạy container thường xuyên? Hãy ước tính ngưỡng.',
    'Bạn cân bằng thế nào giữa yêu cầu multi-region (DR) với chi phí gần gấp đôi hạ tầng?'
  ],
  tags: ['FinOps', 'cloud cost', 'architecture', 'trade-off', 'AWS', 'cost optimization'],
  refs: [
    { type: 'doc', title: 'FinOps Foundation: What is FinOps', url: 'https://www.finops.org/introduction/what-is-finops/' },
    { type: 'doc', title: 'AWS Well-Architected: Cost Optimization Pillar', url: 'https://docs.aws.amazon.com/wellarchitected/latest/cost-optimization-pillar/welcome.html' }
  ]
},
{
  id: 'architecture-030',
  topic: 'architecture',
  level: 'lead',
  q: 'Bạn là kiến trúc sư và team không đồng ý với quyết định kiến trúc của bạn (ví dụ chọn công nghệ hoặc cách chia service). Bạn dẫn dắt quyết định như thế nào: dùng RFC, spike, tiêu chí đo ra sao để đi đến kết luận?',
  a: `**Tóm tắt:** Mục tiêu không phải "thắng tranh luận" mà là đi đến quyết định **tốt nhất theo bằng chứng** mà team hiểu và cam kết thực hiện. Quy trình thực dụng: viết **RFC** (Request for Comments — đề xuất xin góp ý) nêu rõ vấn đề, lựa chọn, tiêu chí đánh giá; dùng **spike** (thử nghiệm ngắn, có giới hạn thời gian) để biến ý kiến thành dữ liệu khi tiêu chí còn mơ hồ; quyết định dựa trên **tiêu chí đo được** đã chốt trước; ghi lại bằng ADR. Người kiến trúc sư dẫn dắt bằng cách làm rõ ràng bài toán và trade-off, không áp đặt bằng chức danh.

### Cái gì → vì sao cần
- **Cái gì:**
  - **RFC:** văn bản đề xuất (1–3 trang) gửi team góp ý trước khi chốt: nêu bối cảnh, vấn đề, các phương án, tiêu chí, phương án đề xuất, rủi ro. Có thời hạn góp ý (ví dụ 3 ngày làm việc).
  - **Spike:** thử nghiệm kỹ thuật ngắn (time-box, thường 1–5 ngày) để trả lời một câu hỏi cụ thể ("Kafka có đạt 5.000 msg/s với payload 2KB trên hạ tầng ta không?", "ORM X có sinh query N+1 trong case của ta không?"). Kết quả là dữ liệu/kết luận, **code spike thường vứt đi**.
  - **Tiêu chí đo:** các thước đo cụ thể dùng để so phương án (độ trễ p95, throughput, chi phí/tháng, công vận hành ước tính, thời gian implement, mức team quen).
- **Vì sao cần:** Bất đồng kiến trúc thường là bất đồng về **ưu tiên** (người A coi độ trễ quan trọng nhất, người B coi tốc độ giao hàng) hoặc về **giả định chưa kiểm chứng** ("chắc Mongo nhanh hơn"). Không có quy trình, tranh luận rơi vào cảm tính, uy tín cá nhân, hoặc ai nói to hơn.

### Quy trình dẫn dắt từng bước
1. **Làm rõ vấn đề, không nhảy vào giải pháp:** viết một đoạn "Problem statement" — ta đang giải quyết gì, ràng buộc gì (SLA, ngân sách, deadline, kỹ năng team), thành công đo bằng gì. Nhiều bất đồng tan khi cùng đồng ý vấn đề.
2. **Liệt kê phương án thật sự (kể cả phương án bạn không thích):** mỗi phương án nêu ưu/nhược trung thực. Nếu RFC chỉ ca ngợi một phương án, đó là vận động hành lang, không phải RFC.
3. **Chốt tiêu chí và trọng số TRƯỚC khi tranh luận phương án:**
~~~text
Tiêu chí (ví dụ chọn message broker):
- Đáp ứng throughput 5.000 msg/s (bắt buộc, pass/fail)
- Hỗ trợ replay 7 ngày (bắt buộc)
- Công vận hành với team 1 SRE (trọng số cao)
- Chi phí/tháng (trọng số trung bình)
- Độ trễ p95 < 500ms (đủ dùng, không cần tối ưu quá)
Chốt bộ tiêu chí này với team trước khi chấm điểm phương án.
~~~
4. **Dùng spike khi còn giả định chưa kiểm chứng:** nếu tranh cãi "Kafka có phức tạp quá với team mình không?" — spike 3 ngày: dựng cluster dev, viết producer/consumer, đo effort và vấn đề gặp. Quyết bằng dữ liệu, không bằng cảm giác.
5. **Thu thập góp ý có cấu trúc:** RFC mở comment trong thời hạn; họp 30–45 phút chỉ để giải quyết điểm chưa rõ, không để họp biến thành tranh luận lại từ đầu. Ghi nhận phản đối trong RFC ("Concern: ... / Response: ...").
6. **Ra quyết định minh bạch:** người chịu trách nhiệm quyết định (DRI/architect) chốt, nêu rõ căn cứ theo tiêu chí. **Disagree and commit** — người không đồng ý vẫn được ghi nhận, nhưng team cam kết thực hiện; đặt mốc **review lại** (ví dụ sau 2 tháng/1 quý) nếu tiêu chí không đạt.
7. **Ghi ADR:** kết quả chốt thành ADR (xem architecture-023) để không tranh luận lại.

~~~seq
title: Dẫn dắt quyết định kiến trúc
actors: Arch | Team | Spike
Arch -> Team: RFC: van de + phuong an + tieu chi
Team -> Arch: gop y, neu lo ngai
Arch -> Team: chot tieu chi chung
Arch -> Spike: spike 3 ngay kiem chung gia dinh
Spike --> Arch: ket qua do duoc
Arch -> Team: quyet dinh theo tieu chi + ly do
Arch -> Team: ghi ADR, dat moc review
~~~

### Pitfall production
- **Áp đặt bằng quyền lực:** "tôi là architect nên chọn cái này" — team ngoan ngoãn thực hiện nhưng không cam kết, ngầm chống đối, hoặc không cảnh báo rủi ro. Quyết định tệ hơn vì mất trí tuệ tập thể.
- **Nhượng bộ để "yên ổn":** chọn phương án trung bình yếu để tránh xung đột, dù tiêu chí cho thấy phương án khác tốt hơn. Lãnh đạo là chịu trách nhiệm quyết định có căn cứ.
- **Spike không có câu hỏi và time-box:** biến thành dự án nhỏ 3 tuần, code spike lọt vào production. Spike phải có câu hỏi rõ ("đo được X chưa?") và ngày kết thúc cứng.
- **Không đặt mốc review:** quyết định sai sống mãi vì "đã chốt rồi". Ghi trong ADR: "review sau 8 tuần; nếu chi phí vận hành > Y hoặc p95 > Z thì xét lại phương án B".
- **Bỏ qua tiếng nói ít nói:** người im lặng (junior, người mới, remote) có thể thấy rủi ro thật. RFC dạng viết giúp họ góp ý không phải tranh miệng.

### Ví dụ đời thực
- **Triệu chứng:** Team backend 8 người tranh luận 3 tuần về việc tách module thanh toán thành service riêng hay giữ trong modular monolith. Hai nhóm giữ lập trường ngược nhau, cuộc họp kéo dài, quyết định bị trì hoãn; tính năng thanh toán mới chậm tiến độ. Mỗi bên viện dẫn kinh nghiệm cá nhân ("microservice linh hoạt hơn", "monolith dễ vận hành hơn") nhưng không có dữ liệu chung.
- **Điều tra (làm rõ vấn đề):** Kiến trúc sư viết RFC 2 trang nêu bối cảnh: module thanh toán hiện nhận ~40 request/giây (giờ cao điểm 120), team có 1 người trực vận hành, deadline tính năng mới là 6 tuần, mục tiêu là giảm rủi ro deploy ảnh hưởng đơn hàng. RFC liệt kê ba phương án (giữ modular monolith, tách service, tách sau khi đạt tiêu chí), kèm tiêu chí đã chốt với team: tác động tới deadline, công vận hành, khả năng cô lập lỗi, độ phức tạp giao dịch, chi phí ước tính.
- **Nguyên nhân gốc (của bế tắc):** Bất đồng thực ra là khác ưu tiên (tốc độ giao hàng vs cô lập dài hạn) và có giả định chưa kiểm chứng (tách service có chắc cô lập lỗi tốt hơn với team 1 người vận hành?). Tranh luận miệng không tách được hai lớp này.
- **Cách xử lý:** (1) Chốt tiêu chí và trọng số trước khi chấm điểm. (2) Chạy spike 3 ngày có time-box: dựng một service thanh toán tối giản trong môi trường dev, đo effort triển khai, quan sát luồng giao dịch (cần bù trừ khi lỗi), và đánh giá vận hành (log, deploy, theo dõi). (3) Kết quả spike cho thấy đáp ứng được chức năng nhưng tăng độ phức tạp giao dịch và vận hành so với deadline 6 tuần. (4) Quyết định: giữ modular monolith, siết ranh giới module bằng interface rõ và kiểm tra kiến trúc tự động; ghi ADR với điều kiện review sau 8 tuần hoặc khi tải thanh toán vượt ngưỡng đã định thì xét lại việc tách.
- **Kết quả đo được:** Quyết định chốt trong 5 ngày sau RFC (so với 3 tuần bế tắc). Tính năng mới ra đúng kế hoạch; 8 tuần sau, hai sự cố deploy không làm gián đoạn luồng thanh toán nhờ ranh giới module rõ hơn. ADR giúp cuộc thảo luận về sau dựa trên tiêu chí và mốc đo, không lặp lại tranh luận cũ.

### Trả lời mẫu khi phỏng vấn
"Khi team không đồng ý với quyết định kiến trúc của em, mục tiêu của em không phải thắng tranh luận mà là đi đến quyết định tốt nhất theo bằng chứng và để team cam kết thực hiện. Em thường bắt đầu bằng RFC ngắn: nêu rõ vấn đề, ràng buộc, các phương án kể cả phương án em không thích, và tiêu chí đánh giá. Trước khi tranh luận phương án, em chốt tiêu chí với team, ví dụ tác động deadline, độ trễ, công vận hành, chi phí và mức team quen. Nếu còn giả định chưa kiểm chứng, em dùng spike có time-box, thường 1 đến 3 ngày, để trả lời một câu hỏi cụ thể và lấy dữ liệu. Sau đó người chịu trách nhiệm quyết định dựa trên tiêu chí, ghi nhận ý kiến phản đối, và chốt ADR có mốc review lại. Em từng gặp trường hợp team tranh luận ba tuần về tách service thanh toán; RFC và một spike ba ngày cho thấy chi phí vận hành và giao dịch vượt deadline, nên em quyết định giữ modular monolith, siết ranh giới module và đặt điều kiện review sau tám tuần. Kể cả khi dữ liệu cho thấy em sai, em đổi ý và ghi rõ lý do."

> Senior tip: Dấu hiệu bạn dẫn dắt tốt là sau quyết định, người từng phản đối có thể giải thích được "vì sao team chọn vậy" gần đúng như bạn — nghĩa là họ thấy lập luận của mình được xét đến. Trong phỏng vấn, kể một câu chuyện thật: bất đồng gì, bạn dùng RFC/spike/tiêu chí nào, kết quả ra sao (kể cả khi bạn đã sai và đổi ý nhờ dữ liệu) — điều đó thể hiện trưởng thành hơn là kể bạn luôn đúng.`,
  follow: [
    'Khi spike cho thấy phương án bạn đề xuất kém hơn, bạn xử lý thế nào trước team?',
    'Làm sao phân biệt quyết định "cần đồng thuận" với quyết định "cần dứt khoát dù chưa ai hoàn toàn hài lòng"?',
    'Team phân tán múi giờ — bạn điều chỉnh quy trình RFC/spike ra sao?'
  ],
  tags: ['RFC', 'spike', 'architecture decision', 'leadership', 'trade-off', 'ADR'],
  refs: [
    { type: 'article', title: 'Martin Fowler: Writing Architecture Decision Records (and decision context)', url: 'https://martinfowler.com/articles/scaling-architecture-conversationally.html' },
    { type: 'article', title: 'Thoughtworks: Spikes', url: 'https://www.thoughtworks.com/en-us/insights/blog/just-enough-technical-design-spikes' }
  ]
}
,
{
  id: 'design-030',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế notification service đa kênh.',
  a: `**Tóm tắt:** Notification service đa kênh (gửi thông báo qua nhiều kênh như email, SMS, push, in-app) cần thiết kế theo **at-least-once delivery** (ít nhất một lần: hệ thống đảm bảo gửi, nhưng có thể gửi lặp nếu mất ACK — gói xác nhận), kết hợp **khử trùng** (dedup) bằng khóa nghiệp vụ. Mỗi kênh có hàng đợi, SLA (mức cam kết thời gian), giới hạn tốc độ và nhà cung cấp (provider) riêng. Ưu tiên thông báo quan trọng (OTP — mã xác thực một lần), dùng retry có backoff + jitter (độ trễ ngẫu nhiên) và circuit breaker (cầu dao: ngắt tạm khi provider lỗi liên tục) để bảo vệ hệ thống.

### 1. Vì sao at-least-once chứ không exactly-once?
Exactly-once (đúng một lần) trên mạng là rất khó/không thực tế vì lỗi mạng, timeout và crash (bài toán tương tự "hai vị tướng"): producer (bên gửi) không biết ACK bị mất hay xử lý chưa xong nên phải retry. Cách thực dụng: **at-least-once + dedup phía nhận/xử lý**. Gửi có thể lặp, nhưng xử lý lặp thì bỏ qua nhờ khóa trùng.

### 2. Khử trùng (dedup)
- **dedup key** = hàm băm của các yếu tố nghiệp vụ, ví dụ {{hash(userId + templateId + businessEventId + channel)}}. Dùng {{businessEventId}} (id sự kiện gốc, như id đơn hàng) để retry của cùng sự kiện không tạo thông báo mới.
- Lưu key trong Redis bằng thao tác nguyên tử {{SET key NX EX 86400}} (chỉ đặt nếu chưa có, hết hạn sau 24h). Key đã tồn tại → bỏ qua (skip).
- Cửa sổ dedup (TTL) chọn theo nghiệp vụ: OTP vài phút, thông báo giao dịch vài giờ/1 ngày, marketing dài hơn nhưng vẫn cần chặn trùng chiến dịch.

### 3. Hàng đợi theo kênh và ưu tiên
Mỗi kênh (email/SMS/push/in-app) một hàng đợi riêng vì:
- **SLA khác nhau:** OTP SMS cần < 5 giây; email giao dịch có thể 30 giây; marketing có thể trễ hơn.
- **Provider khác nhau:** lỗi của nhà cung cấp SMS không được làm tắc email.
- **Rate limit khác nhau:** provider giới hạn số gửi/giây; worker phải điều tiết theo kênh.

Ưu tiên (priority): **OTP > giao dịch > marketing**. OTP đi hàng đợi riêng có worker chuyên dụng, bypass (đi tắt) mọi hàng đợi marketing để không bị "đói" tài nguyên.

### 4. Retry, backoff và jitter
- Retry khi lỗi tạm (timeout, 5xx, throttling). Không retry mù khi lỗi vĩnh viễn (số điện thoại sai, unsubscribe) — phân loại lỗi.
- Exponential backoff: 1s, 2s, 4s, 8s... giới hạn số lần và tổng thời gian (ví dụ tối đa 5 lần trong 10 phút cho giao dịch).
- **Jitter (ngẫu nhiên hoá):** dùng full jitter {{random(0, backoff)}} thay vì chờ đúng mốc, để tránh thundering herd (bầy đàn: hàng nghìn request retry cùng lúc khi provider vừa hồi phục).

### 5. Circuit breaker cho provider
Khi tỷ lệ lỗi của provider vượt ngưỡng (ví dụ > 50% trong 10 giây) → **open** (mở cầu dao, ngừng gọi) một khoảng (30 giây) → **half-open** (thử thăm dò vài request). Nếu probe thành công thì đóng lại. Mục đích: không làm quá tải provider đang chết và không lãng phí worker chờ timeout. Kết hợp fallback kênh nếu hợp lý (push lỗi tạm thời → thử in-app), nhưng OTP phải cẩn trọng với bảo mật và chi phí SMS.

### 6. Luồng xử lý tổng quát
~~~seq
title: Luồng gửi notification đa kênh
actors: App | NotifySvc | Dedup | Queue | Provider
App -> NotifySvc: event (user, template, data)
NotifySvc -> Dedup: check dedupKey
Dedup --> NotifySvc: new / duplicate
NotifySvc -> Queue: enqueue theo kênh + priority
Queue -> Provider: worker gửi (rate limit)
Provider --> Queue: ACK / fail
Queue -> NotifySvc: retry backoff+jitter / DLQ
~~~
- **DLQ (dead-letter queue — hàng đợi thư chết):** sau khi vượt số lần retry, đưa vào DLQ để điều tra thủ công, không chặn luồng chính.

### 7. Dữ liệu và tuỳ chọn người dùng
- Lưu trạng thái gửi ({{PENDING/SENT/DELIVERED/FAILED}}) để tra cứu và hỗ trợ khách hàng, nhưng nguồn phát là sự kiện nghiệp vụ.
- Tôn trọng tuỳ chọn nhận (opt-in/opt-out) theo kênh và loại thông báo; OTP/bảo mật thường không cho opt-out.
- Template tách nội dung khỏi code, có biến động ({{amount}}, {{orderId}}) và phiên bản theo ngôn ngữ.

### Ví dụ đời thực
- **Triệu chứng:** Nền tảng thương mại điện tử gửi ~2 triệu thông báo/ngày (email, push, SMS OTP). Đợt khuyến mãi cuối tuần, đội marketing phát chiến dịch 1,2 triệu email trong 20 phút. Cùng lúc, người dùng phản ánh OTP đăng nhập/đặt hàng đến sau 3–8 phút; tỷ lệ đăng nhập thành công giảm rõ trong 30 phút.
- **Điều tra:** Kiểm tra dashboard hàng đợi thấy một hàng đợi chung cho nhiều loại thông báo đang tích ~900.000 message, thời gian chờ tăng vọt. Worker xử lý lần lượt nên email marketing chiếm phần lớn slot. Metric provider SMS vẫn bình thường (độ trễ provider ~400 ms), nhưng thời điểm worker lấy được job OTP đã trễ. Log cho thấy không có phân biệt ưu tiên giữa OTP và marketing.
- **Nguyên nhân gốc:** Thiết kế dùng hàng đợi/worker chung và không tách ưu tiên kênh. Tải marketing (throughput lớn, SLA lỏng) làm "đói" OTP (throughput thấp, SLA < 5 giây). Ngoài ra, cơ chế retry cũ không có jitter nên khi một đợt lỗi tạm xảy ra trước đó, retry dồn cụm gây tải tăng.
- **Cách xử lý:** (1) Ngắn hạn: tạm dừng chiến dịch marketing, tăng worker cho luồng giao dịch, xử lý backlog OTP. (2) Thiết kế lại: tách hàng đợi theo kênh và loại — **OTP đi queue riêng với worker chuyên dụng**, giới hạn SLA nội bộ; marketing có queue/rate limit riêng. Thêm priority, dedup key theo {{businessEventId + channel}}, retry exponential backoff với full jitter, và circuit breaker cho từng provider. (3) Đặt cảnh báo theo tuổi message OTP trong queue (ví dụ > 10 giây) và tỷ lệ gửi trễ.
- **Kết quả đo được:** Sau thay đổi, 99% OTP được gửi trong < 4 giây ngay cả khi chiến dịch marketing chạy song song (đã giới hạn tốc độ). Số khiếu nại "không nhận OTP" giảm từ ~120/giờ ở đỉnh sự cố xuống < 5/giờ. Thời gian gửi email marketing tăng nhẹ (chấp nhận theo SLA), không còn ảnh hưởng luồng xác thực.

### Trả lời mẫu khi phỏng vấn
"Nếu thiết kế notification service đa kênh, em sẽ tách rõ luồng gửi theo kênh và theo mức ưu tiên, vì email, SMS, push, in-app có SLA, provider và rate limit khác nhau. Về độ tin cậy, em chọn at-least-once delivery vì exactly-once trên mạng rất khó; để tránh gửi trùng khi retry, em dùng dedup key dựa trên sự kiện nghiệp vụ như {{businessEventId}} kết hợp user và channel, lưu trong Redis với thao tác nguyên tử và TTL phù hợp. Mỗi kênh có hàng đợi riêng, worker điều tiết theo rate limit provider. OTP là loại quan trọng nhất nên em cho đi queue riêng có worker chuyên dụng, không bao giờ dùng chung với marketing, mục tiêu dưới 5 giây. Với lỗi tạm, em retry bằng exponential backoff có full jitter để tránh thundering herd, còn lỗi vĩnh viễn thì không retry mù mà đưa vào dead-letter queue. Em cũng đặt circuit breaker cho từng provider để ngừng gọi khi lỗi liên tục. Em từng gặp case chiến dịch marketing làm OTP trễ tới 8 phút vì dùng hàng đợi chung; sau khi tách queue OTP, thêm dedup, jitter và cảnh báo theo tuổi message, 99% OTP gửi dưới 4 giây."

> Senior tip: OTP phải đi queue riêng với worker dedicated và SLA < 5s; marketing có thể bị delay. Jitter full (random 0..backoff) chứ không equal jitter, để tránh đồng bộ retry.`,
  follow: ['OTP ưu tiên thế nào?', 'Tại sao cần jitter?', 'Khi provider SMS và push cùng lỗi, bạn fallback và bảo vệ trải nghiệm người dùng ra sao?'],
  tags: ['notification', 'queue', 'dedup']
},
{
  id: 'design-031',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế leaderboard realtime.',
  a: `**Tóm tắt:** Leaderboard realtime dùng Redis Sorted Set (ZSET): ZINCRBY atomic để cộng điểm, ZREVRANGE lấy top, ZREVRANK lấy thứ hạng user, DB là source of truth để khôi phục.

### 1. Vì sao Redis ZSET?

ZSET lưu member-score và tự sort O(log N) mỗi op. In-memory → latency ms. Phù hợp leaderboard cần update liên tục.

### 2. Các lệnh chính

- ZINCRBY lb score userId → cộng điểm atomic.
- ZREVRANGE lb 0 9 WITHSCORES → top 10.
- ZREVRANK lb userId → thứ hạng (0-based).
- ZSCORE lb userId → điểm hiện tại.

### 3. Tie-breaker

Redis tie-break theo member string lexicographically. Nếu muốn tie-break theo thời gian đạt điểm, encode score thành composite: score * 1e9 + (MAX_TS - ts) để người đạt sớm xếp trên.

### 4. Khôi phục sau crash

Redis là cache; DB lưu score history. Khi Redis mất: rebuild ZSET từ DB (batch). Hoặc dùng Redis persistence (AOF everysec) + replica.

### 5. Scale

- Sharding theo leaderboard key (global vs per-game).
- Nếu leaderboard quá lớn (triệu user) → top-N only in Redis, rank chính xác cho top; user thường dùng approximate rank qua bucket.

### Pitfall

- Dùng INCR trên String rồi SORT → O(N log N) mỗi query → chậm.
- Không persist → mất data khi restart.
- Hot key single leaderboard → bottleneck; partition.

### Cơ chế chi tiết: ZSET internals

ZSET lưu cặp (member, điểm) và tự động sắp xếp theo điểm. Bên trong Redis dùng hai cấu trúc kết hợp:
- **Skip list (danh sách nhảy):** cấu trúc phân cấp giúp tìm, xóa, chèn trong O(log N) trung bình. Mỗi node có các pointer "nhảy" theo nhiều mức (mức 1 = linked list đơn, múc 2 = nhảy mỗi 2 nút...). Đơn giản hơn cây đỏ-đen nhưng tốn hơn một chút bộ nhớ.
- **Hash table:** tra cứu member -> điểm trong O(1), dùng cho ZSCORE.

Với 10 triệu user, mỗi entry khoảng 72 bytes → ~720 MB, vừa vặn trong một Redis instance 2–4 GB. Đây là lý do ZSET phù hợp leaderboard: đọc top-K và tra thứ hạng nhanh, cập nhật thường xuyên.

### Idempotent score update

{{ZINCRBY}} là atomic (thực hiện trọn vẹn, không bị xen giữa) nhưng **không idempotent**: nếu client gửi lại cùng lệnh (ví dụ retry do mạng timeout), điểm sẽ được cộng nhiều lần. Hai cách khắc phục:
- **Client request_id:** server lưu bộ nhớ request_id đã xử lý (TTL 24h). Nhận request -> kiểm tra -> nếu đã có thì trả kết quả cũ; chưa có thì {{ZINCRBY}} và đánh dấu đã xử lý.
- **ZADD với GT (Redis 6.2+):** {{ZADD lb GT điểm userId}} chỉ cập nhật nếu điểm mới cao hơn điểm cũ. Phù hợp khi client gửi tổng điểm mới (không phải delta). Nếu client chỉ gửi delta (+10), dùng request_id.

### Tie-breaker (xếp hạng cùng điểm)

Redis chia như nhau theo chuỗi member theo thứ tự từ điển. Nếu muốn xếp hạng theo thời gian đạt điểm, mã hoá điểm thành composite: {{điểm * 1e9 + (MAX_TS - ts)}}. Điểm nguyên occupies phần cao, timestamp occupies phần thấp. MAX_TS là thời gian tương lai xa (ví dụ năm 2100). Công thức: {{composite = points * 1_000_000_000 + (MAX_TS - achieved_at_ms)}}. Người đạt sớm hơn có {{achieved_at_ms}} nhỏ hơn -> {{MAX_TS - achieved_at_ms}} lớn hơn -> composite lớn hơn -> xếp trên.

### Sharding và approximate rank

Khi một leaderboard nhận hàng triệu update/giây, một ZSET key trở thành bottleneck (Redis đơn luồng). Sharding: chia thành N shard ZSET lb:{shard_i}, shard_key = hash(userId) % N.
- **Top-K global:** query top-K từ mỗi shard, merge K-way bằng min-heap O(K × log N).
- **Rank user:** ZREVRANK trong shard + ZCOUNT đếm số user có điểm cao hơn trong shard, cộng rank các shard khác.
- **Approximate rank:** chia khoảng điểm thành bucket (0–1000, 1001–2000...). Mỗi bucket đếm số user. Rank ≈ tổng bucket trên + offset trong bucket. Sai số < kích thước bucket.

### Monitoring và operations

- Metric bắt buộc: ZADD ops/s, ZREVRANGE latency p99, memory usage, key eviction rate.
- Hot key detection: theo dõi ops/s theo key; nếu một key vượt ngưỡng (ví dụ 10k ops/s), cảnh báo và gợi ý sharding.
- Persistence: AOF everysec + replica; khi Redis mất, rebuild từ DB (pipeline {{ZADD}} batch 5000, ~30s cho 10M user).
- Anti-drift: rebuild hàng tuần từ DB để đối chiếu điểm Redis với DB score_history; nếu lệch, alert và fix.

### Ví dụ đời thực: game leaderboard bị trùng điểm do client retry

Một game di động có leaderboard theo điểm, hàng chục triệu người chơi. **Triệu chứng:** vào cuối tuần, một số người phàn nàn thứ hạng bị nhảy lên rồi xuống; hai người cùng điểm nhưng thứ hạng thay đổi giữa hai lần tải trang. **Điều tra:** log backend thấy nhiều lệnh {{ZINCRBY}} cho cùng userId đến cùng lúc do client retry khi mạng timeout. Mỗi retry là một {{ZINCRBY}} +10, nên userId bị cộng thêm 10 điểm dù chỉ hoàn thành level một lần. **Nguyên nhân gốc:** {{ZINCRBY}} atomic nhưng **không idempotent**: lặp lại lệnh lặp lại hiệu ứng. Ngoài ra, tie-break bằng chuỗi member (userId theo bảng chữ cái) không phản ánh thời gian đạt điểm, nên thứ hạng bất ổn. **Xử lý:** (1) thêm {{client_request_id}} vào request; server lưu set request_id gần nhất, nếu lặp trả kết quả cũ; hoặc dùng {{ZADD}} với {{GT}}. (2) Mã hoá thời gian vào điểm: {{điểm = points * 1_000_000_000 + (MAX_TS - achieved_at_ms)}}. (3) Rebuild hàng tuần từ DB score_history để đối chiếu Redis. **Kết quả đo được:** trùng điểm giảm từ ~2% xuống 0.03%, thứ hạng ổn định qua các lần reload.

### Trả lời mẫu khi phỏng vấn

"Khi hỏi về leaderboard, tôi chọn Redis Sorted Set vì {{ZINCRBY}} atomic, {{ZREVRANGE}} lấy top O(log N), {{ZREVRANK}} tra thứ hạng — hết trong bộ nhớ, latency dưới 5ms. Điểm mấu chốt là **idempotency**: {{ZINCRBY}} cộng thêm điểm mỗi lần client retry, nên tôi luôn ghi nhận request_id để lặp lại không tăng điểm. Với tie-break, tôi mã hoá thời gian đạt điểm vào điểm bằng {{điểm * 1e9 + (MAX_TS - ts)}} để người đạt sớm xếp trên. Cuối cùng, Redis chỉ là view nhanh; tôi giữ CSDL làm source of truth và có script rebuild khôi phục khi Redis mất — cache có thể mất, điểm người dùng không được mất."

> Senior tip: Luôn có DB source of truth + rebuild script; Redis chỉ là view. Tie-break encode vào score để deterministic, tránh race.` ,
  follow: ['Tie-breaker?', 'Khôi phục?'],
  tags: ['leaderboard','redis']
},
{
  id: 'design-032',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế chat 1-1 và nhóm realtime.',
  a: `**Tóm tắt:** Chat realtime dùng WebSocket, lưu message trước rồi broadcast, fan-out hybrid (direct cho nhóm nhỏ, pub/sub cho nhóm lớn), presence tracking, push notification khi offline.

### 1. Lưu trước broadcast

Persist message vào DB trước khi broadcast để đảm bảo durability và ordering; client ACK bằng message id.

### 2. Fan-out hybrid

- Nhóm nhỏ (< 1000): server fan-out trực tiếp tới connection của từng member.
- Nhóm lớn (celebrity channel): pub/sub qua Redis/Kafka, client subscribe topic.

### 3. Presence

Heartbeat mỗi 30s; TTL 60s trong Redis. Offline → push notification.

### 4. Reconnect

Client exponential backoff reconnect; resume từ lastMessageId (cursor) để không mất message.

### 5. Ordering

Per-conversation sequence number; client reorder theo seq.

### Pitfall

- Broadcast trước persist → mất message khi crash.
- Presence storm với triệu connection → dùng distributed presence.
- WebSocket sticky session → load balancer phải consistent hash.

### Cơ chế chi tiết: Fan-out hybrid

Với nhóm nhỏ (< 1000 thành viên), server duy trì bản ghi conversationId -> danh sách connectionId của từng thành viên đang online (trong bộ nhớ hoặc Redis). Khi có message mới, server lặp qua danh sách và gọi gửi trực tiếp xuống từng WebSocket. Độ phức tạp O(N) với N = số thành viên online. Phù hợp vì N nhỏ, latency thấp, không qua trung gian.

Với nhóm lớn / kênh công khai (celebrity, livestream chat), fan-out trực tiếp sẽ tốn quá nhiều CPU/memory trên gateway và gây thundering herd (nhiều quá trình cùng kích hoạt cùng lúc) khi broadcast. Chuyển sang mô hình pub/sub (công cấu publish-subscribe - người gửi publish message vào một kênh, nhiều người dùng subscribe kênh đó nhận message): message đẩy vào Redis Stream hoặc Kafka topic chat:{conversationId}. Các gateway instance subscribe topic này, nhận message và đẩy xuống connection của thành viên đang online trên instance đó. Số lượng subscriber = số gateway instance (thường 10–100), không phụ thuộc vào số user. Latency tăng thêm khoảng 1–2 ms do qua message broker, nhưng scale gần như vô hạn.

Ngưỡng chuyển đổi: thường đặt ở 500–1000 thành viên online. Có thể dùng feature flag (cờ điều khiển tính năng) bật/tắt pub/sub cho từng conversationId để xử lý sự cố nóng.

### Cơ chế chi tiết: Presence và Reconnect

**Presence (trạng thái hiện diện - biết ai đang online):** Mỗi connection gửi ping (heartbeat) mỗi 30 giây. Gateway cập nhật khóa Redis presence:{userId}:{deviceId} với TTL 60 giây (thời gian sống - key tự xóa sau TTL). User coi là online nếu ít nhất một thiết bị còn TTL > 0. Khi TTL hết, gateway phát sự kiện user_offline cho **chỉ những người đang mở chat với user đó** - không broadcast cho cả danh bạ (tránh presence storm - tình trạng quá nhiều kết nối presence cùng lúc làm quá tải hệ thống với triệu kết nối).

**Reconnect:** Client lưu lastMessageId (cursor - con trỏ đánh dấu tin nhắn cuối đã xem) của từng cuộc trò chuyện. Khi reconnect, client gửi RESUME conversationId lastMessageId. Server truy vấn CSDL lấy message WHERE id > lastMessageId ORDER BY id LIMIT 100 và đẩy xuống. Nếu lastMessageId quá cũ (khoảng cách lớn), server trả lỗi FULL_SYNC_REQUIRED và client tải lại toàn bộ lịch sử gần nhất. Exponential backoff (lùi theo số mũ): 1s, 2s, 4s, 8s, max 30s + jitter ngẫu nhiên 0–500 ms để tránh reconnect storm (nhiều client reconnect cùng lúc khi gateway vừa khởi động lại).

### Cơ chế chi tiết: Ordering và Idempotency

Mỗi cuộc trò chuyện có một sequence number (số thứ tự) tăng dần (có thể dùng Redis INCR conv:seq:{conversationId} hoặc cột identity của CSDL). Khi client gửi message, server gán seq rồi persist. Client nhận ACK kèm seq. Nếu client không nhận được ACK (mạng đứt), client retry cùng clientMessageId (UUID do client sinh). Server kiểm tra clientMessageId đã xử lý chưa (bộ nhớ Redis msg:processed:{clientMessageId} TTL 24h) — nếu có thì trả ACK cũ, không tạo message mới. Đây là **idempotency ở tầng ứng dụng** (thao tác lặp lại cho cùng kết quả).

### Ví dụ đời thực: message trùng lặp và mất tin khi reconnect

Một ứng dụng chat 2 triệu DAU dùng WebSocket + Redis pub/sub cho nhóm lớn. **Triệu chứng:** người dùng trong nhóm 5000 thành viên báo nhận được cùng một tin nhắn 2–3 lần liên tiếp; một số người reconnect sau khi đổi mạng 4G->WiFi thì mất 5–10 tin nhắn. **Điều tra:** log gateway thấy client gửi tin, server persist thành công nhưng ACK bị mất do mạng timeout; client retry (không có clientMessageId) -> server tạo message thứ 2 với seq mới. Với reconnect: client không lưu lastMessageId, reconnect thì server đẩy toàn bộ lịch sử (1000 tin) -> client hiển thị trùng lặp và lag. **Nguyên nhân gốc:** (1) thiếu idempotency key ở client -> retry tạo message trùng; (2) reconnect không dùng cursor -> server không biết client đã thấy đâu. **Xử lý:** (1) client sinh clientMessageId UUID cho mỗi tin, gửi kèm request; server lưu clientMessageId trong bộ nhớ Redis set TTL 24h, nếu thấy trùng trả ACK cũ; (2) client lưu lastMessageId mỗi cuộc trò chuyện vào localStorage; reconnect gửi RESUME conversationId lastMessageId; server chỉ trả message seq > lastMessageId; (3) thêm FULL_SYNC_REQUIRED khi gap > 5000 message. **Kết quả đo được:** message trùng giảm từ ~2% xuống 0.01%; reconnect mất tin giảm từ 5% xuống 0%; p99 latency reconnect < 800 ms.

### Trả lời mẫu khi phỏng vấn

"Khi thiết kế chat realtime, tôi bắt đầu bằng nguyên tắc persist trước, broadcast sau - message phải ghi vào CSDL trước khi đẩy cho người nhận, đảm bảo không mất dữ liệu khi gateway crash. Với fan-out, tôi dùng hybrid: nhóm nhỏ (< 1k) đẩy trực tiếp từ gateway, nhóm lớn chuyển sang pub/sub qua Redis Stream/Kafka để tránh quá tải gateway. Presence theo dõi heartbeat 30s, TTL 60s trong Redis, chỉ thông báo cho người đang mở chat chứ không broadcast cho cả danh bạ. Điểm mấu chốt là idempotency: client phải gửi clientMessageId UUID, server deduplicate bằng bộ nhớ Redis set; và reconnect có cursor - client lưu lastMessageId, reconnect chỉ kéo message mới. Tôi từng gặp case thiếu hai thứ này khiến message trùng lặp 2% và reconnect mất tin 5%; sau khi thêm dedup key và cursor-based resume, cả hai đều gần như bằng 0."

> Senior tip: Luôn persist-first + cursor-based resume; presence là best-effort, không block message delivery.` ,
  follow: ['Fan-out?', 'Reconnect?'],
  tags: ['chat','websocket']
},
{
  id: 'design-033',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế news feed với celebrity.',
  a: `**Tóm tắt:** News feed celebrity dùng hybrid fan-out: push cho user thường (write-time fan-out), pull cho celebrity (read-time merge), cursor-based pagination.

### 1. Vấn đề celebrity

Fan-out on write cho celebrity có triệu follower → write amplification lớn, chậm. Fan-out on read cho tất cả → read chậm cho mọi user.

### 2. Hybrid

- User thường: write-time fan-out vào feed cache của follower.
- Celebrity: không fan-out; khi follower đọc feed, merge celebrity posts on read.

### 3. Cursor-based pagination

Dùng cursor (timestamp+id) thay vì OFFSET để tránh skip/duplicate khi data thay đổi. OFFSET lớn → O(N) scan.

### 4. Ranking

Score = affinity + recency + engagement; top-K merge từ nhiều source.

### 5. Cache & invalidation

Feed cache TTL ngắn; celebrity post invalidate follower feeds lazily.

### 6. Monitoring

Track fan-out lag, feed freshness, read latency p99.

### Pitfall

- Cache stampede khi celebrity post → coalescing.
- Cursor không stable khi clock skew → dùng snowflake id.
- Hot celebrity post → thundering herd.

### Cơ chế chi tiết: Fan-out worker

Fan-out worker tiêu thụ sự kiện post-created từ Kafka (hệ thống tin nhắn phân tán - các ứng dụng gửi/nhận message qua topic). Mỗi worker xử lý một partition (phân vùng - phần của topic được phân tán), đọc batch 100–500 sự kiện/lần. Với mỗi sự kiện, worker lấy danh sách follower từ cache (Redis followers:{userId} - ZSET lưu follow_time). Nếu số follower < ngưỡng (mặc định 10k), worker dùng Redis pipeline (gom nhiều lệnh gửi cùng lúc để giảm round-trip) ZADD feed:{followerId} {timestamp} {postId} cho từng follower. Pipeline gom 100–500 lệnh gửi một lần giảm round-trip từ khoảng 500ms xuống ~5ms. Nếu số follower >= ngưỡng, worker **không push**, chỉ cập nhật recent_posts:{authorId} (ZSET lưu 500 bài mới nhất của celebrity). Worker scale ngang bằng thêm partition Kafka; mỗi partition chỉ xử lý một tập con tác giả.

Vấn đề hot partition: bài của celebrity rơi vào một partition -> worker đó quá tải. Giải pháp: pre-split partition theo băm authorId, hoặc detect celebrity trước khi vào Kafka (routing key = celebrity thì vào topic riêng, xử lý bởi worker pool riêng với concurrency cao hơn).

### Cơ chế chi tiết: Read path và merge

Khi client gọi GET /feed?cursor=... feed service:
1. Đọc từ feed:{userId} (Redis ZSET) top N bài đã push (thường 50–100).
2. Lấy danh sách celebrity mà user follow từ cache celebrity_follows:{userId}.
3. Với mỗi celebrity, đọc recent_posts:{celebrityId} top M bài (M = 10–20).
4. Merge K danh sách đã sắp xếp (K = 1 push + số celebrity follow) bằng **k-way merge** dùng min-heap O(tổng × log K). Loại bỏ duplicate postId (dùng hash set - cấu trúc lưu giá trị duy nhất).
5. Hydrate chi tiết bài (content, author, media) từ cache/CSDL theo batch postId — tránh N+1 query (tránh truy vấn CSDL nhiều lần lặp cho từng bài).
6. Trả về cursor (score, postId) của bài cuối để trang sau.

Cursor ổn định: điều kiện điểm < điểmCuoi HOẶC (điểm = điểmCuoi VÀ postId < postIdCuoi) đảm bảo không skip/duplicate khi data thay đổi giữa hai request. Không dùng OFFSET vì OFFSET lớn sẽ quét O(N) và khi data thay đổi liên tục sẽ gây skip/duplicate.

### Cơ chế chi tiết: Cache invalidation và lan truyền xoá

Khi celebrity xoá/sửa bài:
- Sửa: chỉ cập nhật bài gốc trong CSDL; feed chỉ lưu postId nên tự động đúng — không cần invalidate.
- Xoá: phát sự kiện post-deleted -> fan-out worker nhận và ZREM feed:{followerId} {postId} cho TẤT CẢ follower (dùng pipeline batch 500). Đồng thời xóa khỏi recent_posts:{authorId}. Nếu số follower lớn (celebrity), dùng job nền chia nhỏ theo batch 10k follower/lần, hoàn tất trong vài giây. Không chờ TTL 2h.

### Ví dụ đời thực: feed bị duplicate bài khi merge push và pull

Một nền tảng nội dung có 5 triệu DAU dùng hybrid fan-out: push cho user thường, pull cho celebrity. **Triệu chứng:** người dùng báo thấy cùng một bài twice trong feed (lần ở vị trí 3 và vị trí 15), và khi cuộn xuống bài bị mất. **Điều tra:** kiểm tra log feed service thấy hai nguồn trả về cùng postId: feed ZSET của user (push) trả bài do worker fan-out, và celebrity recent_posts (pull) cũng trả bài đó — merge không loại bỏ trùng. Ngoài ra, khi celebrity xoá bài, feed ZSET của follower vẫn giữ id cũ đến khi TTL (2h). **Nguyên nhân gốc:** merge push và pull là hai đường dữ liệu độc lập, không có cơ chế dedup (loại trùng) theo postId; và xoá bài không lan truyền sang feed cache đã push. **Xử lý:** (1) merge theo postId, loại bỏ id trùng trước khi trả; (2) dùng cursor phân trang ổn định (score, postId) để không skip/duplicate khi data thay đổi; (3) khi celebrity xoá bài, phát sự kiện post-deleted để fan-out worker gỡ id khỏi feed ZSET (dùng ZREM batch); (4) hydrate chi tiết bài qua batch, lọc bỏ bài đã xoá ở lớp cuối. **Kết quả đo được:** duplicate bài giảm từ ~3% xuống 0.1%, và bài xoá biến mất khỏi feed trung bình trong 2 giây thay vì 2h.

### Trả lời mẫu khi phỏng vấn

"Khi hỏi về news feed celebrity, tôi giải thích ngay rằng push cho celebrity có triệu follower là không thể: một bài = 50 triệu ZADD, worker sẽ bị nghẽn. Vì vậy tôi dùng hybrid: push cho follower dưới ngưỡng (ví dụ 10k), pull cho celebrity. Khi đọc, feed service lấy từ Redis ZSET của người dùng kết hợp recent_posts của celebrity, merge theo timestamp, và dùng cursor (score, postId) để phân trang — không dùng OFFSET vì OFFSET lớn sẽ quét O(N) và khi data thay đổi liên tục sẽ gây skip/duplicate. Điểm hay bị bỏ qua là merge: hai nguồn push và pull có thể trả cùng postId, phải dedup theo postId trước khi trả; và khi xoá bài, phải phát sự kiện để worker gỡ id khỏi feed cache đã push, không thể chờ TTL 2h."

> Senior tip: Hybrid fan-out là trade-off write vs read; chọn threshold follower count (ví dụ 10k) để chuyển sang pull.` ,
  follow: ['Tại sao hybrid?', 'Cursor khác OFFSET?'],
  tags: ['news-feed','fan-out']
},
{
  id: 'design-034',
  topic: 'design',
  level: 'senior',
  q: 'Thiết kế lưu file có deduplication.',
  a: `**Tóm tắt:** File storage dedup dùng content-addressable storage (CAS): hash content làm id, chunking để dedup partial, reference counting để GC.

### 1. Content-addressable

File id = SHA-256(content). Upload cùng content → cùng id → skip lưu, tăng ref count.

### 2. Chunking

Chia file thành chunk (ví dụ 4MB) để dedup partial (delta). Hữu ích cho backup/versioning.

### 3. Reference counting

Mỗi file/chunk có ref count; khi 0 → GC (soft delete + hard delete sau TTL).

### 4. Integrity

Verify hash sau upload/download; corruption → re-fetch từ replica.

### 5. Storage tiers

Hot (SSD) cho recent, cold (S3 Glacier) cho archive.

### 6. Upload flow

Client hash → check existence → upload missing chunks → commit manifest.

### 7. Concurrency & consistency

Manifest commit dùng optimistic locking trên file id; conflict → retry. Chunk upload idempotent theo chunk hash.

### 8. Cost optimization

Tiering + lifecycle policy tự động chuyển cold sau 30 ngày không truy cập.

### Pitfall extra

- Orphan chunks khi upload fail → GC sweep.
- Dedup cross-tenant phải cẩn thận privacy (hash leak existence) → salt per tenant.

### Cơ chế chi tiết: Chunking strategy

Có hai cách chia chunk:
- **Fixed-size chunking (chia cố định 4MB):** đơn giản, dễ triển khai. Nhược điểm: thay đổi 1 byte ở đầu file làm dịch chuyển toàn bộ chunk sau đó -> không dedup được phần còn lại. Phù hợp cho file ít thay đổi (backup, lớp ảnh container).
- **Content-Defined Chunking - CDC (chia theo nội dung, dùng Rabin fingerprinting - kỹ thuật vân tay nội dung):** ranh giới chunk quyết định bởi nội dung (hash cửa sổ trượt). Thay đổi cục bộ chỉ ảnh hưởng chunk chứa thay đổi -> dedup tốt cho file thường sửa (disk VM, kho code). Chi phí CPU cao hơn, nhưng tỷ lệ dedup tốt hơn 2–3x so với fixed-size.

Production thường dùng CDC cho backup/VM, fixed-size cho object storage đơn giản. Kết hợp: file nhỏ (< 8MB) không chunk, file lớn dùng CDC. CDC tham số: kích thước cửa sổ (48–64 byte), min/max chunk size (2KB–512KB), kích thước trung bình mục tiêu (64KB–1MB). Chunk size quá nhỏ -> manifest lớn; quá lớn -> mức chi tiết dedup thô.

### Cơ chế chi tiết: Cấu trúc manifest

~~~json
{
  "fileId": "sha256:abc123...",
  "size": 104857600,
  "chunks": [
    {"hash": "sha256:chunk1...", "size": 4194304, "offset": 0},
    {"hash": "sha256:chunk2...", "size": 4194304, "offset": 4194304}
  ],
  "createdAt": "2026-11-01T10:00:00Z",
  "tenantId": "tenant-123"
}
~~~

Manifest được lưu như một object riêng (cũng có content hash), ref count = số file tham chiếu. Luồng upload: client tính hash chunk -> kiểm tra sự tồn tại -> upload chunk thiếu -> POST manifests với danh sách hash chunk -> server xác thực và commit (tăng ref count từng chunk). Bước commit manifest là nguyên tử: nếu thất bại giữa chừng, chunk trở thành orphan (ref count = 0).

### Cross-tenant privacy và salt

Nếu dùng chung kho lưu trữ chunk cho nhiều tenant (khách hàng), hash chunk có thể rò rỉ thông tin: kẻ tấn công upload file đoán -> nếu chunk tồn tại -> biết tenant khác có file đó. Giải pháp: **salt per tenant** (muối cho mỗi tenant) — chunk hash = SHA-256(salt_tenant + nội dung chunk). Salt lưu trong cấu hình tenant, xoay thay đổi định kỳ. Trade-off: mất dedup cross-tenant (chấp nhận được vì bảo mật > lượng dung lượng saves). Nếu bắt buộc dedup cross-tenant (ví dụ kho chứa container công khai), dùng **convergent encryption** (mã hóa hoán quy - mã hóa chunk với khóa = hash(chunk)), nhưng cần mô hình mối đe dọa kỹ (kẻ tấn công có thể tra cứu từ điển).

### Kiểm tra toàn vẹn và sửa chữa

Mỗi chunk lưu kèm crc32c (nhanh) và sha256 (chắc chắn). Job nền:
- **Scrub hàng tuần:** đọc 1% chunk ngẫu nhiên, xác thực sha256. Sai -> đánh dấu corrupt, trigger sao chép lại từ replica khỏe.
- **Sửa chữa:** chunk corrupt -> tìm replica đúng hash -> sao chép lại -> xác thực. Nếu tất cả replica corrupt -> alert P1, cần khôi phục từ bản sao lưu.
- **Kiểm tra tính nhất quán manifest:** hàng ngày so sánh ref count manifest với kho chunk thực tế; lệch -> sửa ref count.

### Garbage Collection cho orphan chunk

- **Soft delete:** khi xóa file/manifest, ref count giảm. Chunk có ref count = 0 -> đánh dấu orphaned_at, không xóa ngay.
- **Hard delete sau TTL:** orphan chunk sau 7–30 ngày mới xóa (để khôi phục nếu commit manifest thất bại do mạng).
- **Pending TTL:** chunk upload xong nhưng commit manifest thất bại trong 1h -> xóa (tránh orphan tăng dần).
- GC job chạy định kỳ (mỗi giờ), batch 1000 chunk/lần, ghi log tỉ lệ orphan để cảnh báo.

### Tách tầng lưu trữ và tối ưu chi phí

- **Hot tier (SSD):** chunk gần đây (< 30 ngày), truy cập thường xuyên.
- **Warm tier (HDD/object storage):** chunk 30–90 ngày.
- **Cold tier (S3 Glacier / băng):** chunk > 90 ngày, khôi phục trong vài giờ.

Chính sách vòng đời tự động chuyển theo thời gian truy cập gần nhất. Dedup giúp tách tầng hiệu quả hơn: cùng nội dung chỉ lưu 1 lần ở mỗi tầng.

### Ví dụ đời thực: orphan chunk bít tắc lưu trữ sau khi upload thất bại

Một dịch vụ lưu file doanh nghiệp có hàng triệu người dùng, dùng CAS (content-addressable storage - lưu theo hash nội dung) với chunk 4MB và reference counting. **Triệu chứng:** dung lượng disk tăng 30% trong 2 tuần dù người dùng chỉ upload lượng file nhỏ; dashboard cho thấy số orphan chunk tăng dần. **Điều tra:** kiểm tra log upload service thấy nhiều request timeout ở bước "commit manifest" — client upload xong các chunk nhưng request commit bị thất bại; chunk đã được lưu với hash nhưng manifest (danh sách chunk + ref count) chưa được ghi. **Nguyên nhân gốc:** upload chunk là idempotent theo chunk hash (nên lặp lại không sao), nhưng bước commit manifest là ghi ref count — nếu thất bại giữa chừng, chunk trở thành orphan (ref count = 0). Job GC chỉ chạy mỗi ngày và chỉ xóa chunk có ref count = 0 và không nằm trong manifest nào đang chờ. **Xử lý:** (1) thêm TTL cho chunk pending (1h) — chunk không được commit trong 1h thì xóa; (2) commit manifest dùng optimistic locking trên file id, conflict -> retry; (3) job GC chạy mỗi giờ thay vì mỗi ngày, và ghi log tỉ lệ orphan để cảnh báo; (4) thêm kiểm tra toàn vẹn hàng tuần: xác thực hash của mỗi chunk với lưu trữ. **Kết quả đo được:** orphan chunk giảm từ 30% xuống dưới 1%, dung lượng disk ổn định.

### Trả lời mẫu khi phỏng vấn

"Khi hỏi về lưu file dedup, tôi bắt đầu bằng content-addressable storage: id file = SHA-256(content), upload cùng nội dung -> cùng id -> skip lưu. Với file lớn, chunking 4MB giúp dedup phần — hai file có cùng phần đầu thì chunk đó không cần upload lại, rất hữu ích cho backup/versioning. Mỗi chunk/file có reference count; khi về 0 thì GC (xóa mềm + xóa cứng sau TTL). Điểm hay bị bỏ là orphan chunk: nếu upload xong chunk nhưng commit manifest thất bại, chunk trở thành orphan — tôi dùng TTL cho chunk pending và job GC chạy thường xuyên hơn. Với dedup cross-tenant, cần salt per tenant vì hash leak có thể cho biết tenant A có file nào đó. Cuối cùng, kiểm tra toàn vẹn xác thực hash sau upload/download để phát hiện hư hỏng dữ liệu."

> Senior tip: CAS + ref count là nền tảng của Dropbox/borg; luôn có GC job và integrity check.` ,
  follow: ['Tại sao chunking?', 'Reference counting?'],
  tags: ['dedup','chunking']
},
{
  id: 'design-035',
  topic: 'design',
  level: 'lead',
  q: 'Thiết kế đặt vé chống overbook.',
  a: `**Tóm tắt:** Đặt vé chống overbook dùng hold TTL + SELECT FOR UPDATE, expiry worker giải phóng ghế hết hạn, confirm atomic chuyển hold → booked.

### 1. Hold phase

User chọn ghế → INSERT hold với expires_at = now + 10min, status=HOLD. Dùng SELECT FOR UPDATE trên seat row để serialize concurrent hold.

### 2. Expiry worker

Job định kỳ UPDATE seat SET status=AVAILABLE WHERE status=HOLD AND expires_at < now.

### 3. Confirm

Payment success → UPDATE seat SET status=BOOKED WHERE id=? AND status=HOLD AND expires_at > now (conditional). Nếu 0 rows → hold expired → fail.

### 4. Pessimistic vs optimistic

- Pessimistic (FOR UPDATE): serialize, an toàn, throughput thấp.
- Optimistic (version column): throughput cao, retry khi conflict; phù hợp low contention.

### Pitfall

- Hold TTL quá ngắn → user chưa thanh toán xong.
- Expiry worker race với confirm → conditional update bảo vệ.
- Over-sell nếu không conditional.

### Cơ chế chi tiết: Hold phase và Seat map

Hold phase là bước quan trọng nhất. Mô hình dữ liệu:
~~~sql
CREATE TABLE seat (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  section VARCHAR(20), row_num INT, seat_num INT,
  status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE, HOLD, BOOKED
  hold_expires_at TIMESTAMPTZ,
  hold_token UUID,           -- khóa idempotency từ client
  version INT NOT NULL DEFAULT 0,
  UNIQUE (event_id, section, row_num, seat_num)
);
CREATE INDEX idx_seat_event_status ON seat(event_id, status);
~~~

Khi user chọn ghế (có thể chọn nhiều), client gửi danh sách seatId kèm hold_token (UUID). Server chạy trong **một transaction**:
1. SELECT * FROM seat WHERE id IN (...) AND status = 'AVAILABLE' FOR UPDATE — khoá row, serialize concurrent hold.
2. Kiểm tra tất cả seat đều AVAILABLE. Nếu có seat đã HOLD/BOOKED -> rollback, trả lỗi SEAT_TAKEN.
3. UPDATE seat SET status='HOLD', hold_expires_at=now() + interval '10 minutes', hold_token=?, version=version+1 WHERE id IN (...).
4. Commit. Trả hold_id (UUID gom nhóm) cho client.

hold_token quan trọng: nếu client gửi lại cùng request (retry), server thấy hold_token đã tồn tại -> trả hold hiện có thay vì tạo mới (idempotency).

### Cơ chế chi tiết: Expiry worker design

Expiry worker không chỉ đơn giản UPDATE seat SET status='AVAILABLE' WHERE status='HOLD' AND hold_expires_at < now(). Cần thiết kế an toàn:
- **Batch size:** mỗi lần xử lý 100–500 seat, tránh khoá bảng quá lâu.
- **Conditional update:** chỉ cập nhật nếu vẫn còn HOLD và đã hết hạn:
UPDATE seat
   SET status='AVAILABLE', hold_token=NULL, hold_expires_at=NULL, version=version+1
 WHERE id IN (...) AND status='HOLD' AND hold_expires_at < now()
Chỉ cập nhật nếu vẫn còn HOLD và đã hết hạn. Nếu payment callback vừa đổi sang BOOKED, affected rows = 0 -> không làm gì.
- **Cursor-based pagination:** dùng WHERE id > last_processed_id thay vì OFFSET để tránh skip khi data thay đổi.
- **Idempotent:** chạy lại nhiều lần cũng an toàn nhờ điều kiện status='HOLD'.
- **Schedule:** chạy mỗi 30s–1p. Có feature flag bật/tắt ngay lập tức.

### Cơ chế chi tiết: Waitlist

Khi event sold out (hết vé), user đăng ký waitlist:
~~~sql
CREATE TABLE waitlist (
  id BIGSERIAL PRIMARY KEY,
  event_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  seat_preference JSONB,      -- section/row ưu tiên
  status VARCHAR(20) DEFAULT 'WAITING', -- WAITING, OFFERED, EXPIRED, FULFILLED
  offered_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,     -- TTL cho offer (ví dụ 10 phút)
  UNIQUE (event_id, user_id)
);
~~~

Khi seat bị release (expiry hoặc user hủy), worker lấy waitlist đầu tiên (FIFO theo created_at), tạo hold mới cho user đó, gửi thông báo (email/push), set offered_at=now(), expires_at=now()+10min. User phải confirm trong TTL; hết hạn -> chuyển user tiếp theo. Waitlist storm khi hàng loạt seat release cùng lúc -> batch processing + rate limit notification (ví dụ chỉ gửi 100 notification/giây).

### Cơ chế chi tiết: Pessimistic vs Optimistic locking

- **Pessimistic locking (SELECT FOR UPDATE):** khoá row ngay khi bắt đầu transaction. An toàn tuyệt đối, không có retry. Nhược điểm: throughput thấp (chỉ một transaction khoá row tại một thời điểm), dễ deadlock nếu khoá nhiều row (phải khoá theo thứ tự cố định). Phù hợp với hold phase (contention cao: nhiều user chọn cùng ghế).
- **Optimistic locking (version column):** không khoá row; UPDATE có điều kiện WHERE id=? AND version=x. Nếu affected rows = 0 -> version thay đổi (conflict) -> rollback và retry (exponential backoff). Throughput cao, nhưng retry có thể lên đến 10–20 lần khi contention cao. Phù hợp với confirm phase (contention thấp: chỉ một user confirm một ghế).
- **SELECT ... FOR UPDATE SKIP LOCKED:** tính năng Postgres — khoá row và bỏ qua row đã bị khoá bởi transaction khác. Dùng cho expiry worker: SELECT id FROM seat WHERE status='HOLD' AND expires_at < now() ORDER BY id LIMIT 100 FOR UPDATE SKIP LOCKED — worker không cần đợi row đang được khoá bởi worker khác.

### Ví dụ đời thực: hold hết hạn và payment callback đến trễ -> oversell nhẹ

Một nền tảng đặt vé máy bay có 20 triệu vé/năm, dùng hold TTL 10 phút + expiry worker + conditional confirm. **Triệu chứng:** hàng tháng có ~50 đơn bị từ chối dù đã thanh toán thành công ("đơn của bạn đã bị hủy vì hết thời gian giữ chỗ"), và 3 trường hợp vé bị bán quá 1 lần (sau khi đối chiếu). **Điều tra:** kiểm tra log expiry worker thấy job chạy mỗi 1 phút; một lần chạy bắt đầu lúc 10:00:00 và kết thúc lúc 10:02:30 (quá 2 phút do CSDL chậm). Trong khoảng đó, payment callback của 12 đơn đến và ghi BOOKED — nhưng expiry worker đã đọc row với status=HOLD và sau đó UPDATE thành AVAILABLE. **Nguyên nhân gốc:** expiry worker không dùng conditional update (chỉ WHERE status=HOLD AND expires_at < now) nên khi chạy sau payment callback, nó ghi Available lên một row vừa được BOOKED. Expiry worker và payment callback race trên cùng row. **Xử lý:** (1) expiry worker dùng conditional update WHERE status='HOLD' AND expires_at < now() — nếu payment callback vừa đổi sang BOOKED, affected rows = 0; (2) payment callback dùng conditional WHERE status='HOLD' AND expires_at > now() — nếu expiry worker vừa đổi sang AVAILABLE, affected rows = 0; (3) thêm column version để optimistic locking; (4) callback và expiry worker cùng khoá theo seat row (SELECT FOR UPDATE) khi cần. **Kết quả đo được:** oversell nhẹ từ 3 xuống 0, đơn bị hủy nhầm giảm từ 50 xuống 2 (2 đơn còn do payment provider chậm hơn 10 phút).

### Trả lời mẫu khi phỏng vấn

"Khi hỏi về đặt vé chống overbook, tôi bắt đầu bằng hold phase: user chọn ghế -> INSERT hold với expires_at = now + 10 phút, status=HOLD, và dùng SELECT FOR UPDATE trên seat row để serialize concurrent hold. Expiry worker là job định kỳ UPDATE seat SET status=AVAILABLE WHERE status=HOLD AND expires_at < now — nhưng điều hay bị bỏ là worker đó phải dùng conditional update, nếu không nó có thể ghi Available lên một row vừa được payment callback đổi sang BOOKED. Confirm cũng conditional: UPDATE seat SET status=BOOKED WHERE id=? AND status=HOLD AND expires_at > now; nếu 0 rows thì hold đã hết hạn. Với pessimistic vs optimistic: pessimistic (SELECT FOR UPDATE) serialize và an toàn nhưng throughput thấp, phù hợp với hold phase; optimistic (version column) throughput cao, retry khi conflict, phù hợp với confirm phase khi contention thấp. Luôn có expiry worker chỉ là cleanup, không phải authority."

> Senior tip: Luôn conditional update với status check; expiry worker chỉ là cleanup, không phải authority.` ,
  follow: ['Pessimistic vs optimistic?', 'Hold hết hạn?'],
  tags: ['ticketing','overbook']
},
{
  id: 'architecture-031',
  topic: 'architecture',
  level: 'senior',
  q: 'Distributed lock bằng Redis (SET NX PX) trông đơn giản nhưng tại sao nó không an toàn tuyệt đối? Giải thích từng bước các kịch bản hỏng (GC pause, clock), cơ chế fencing token hoạt động ra sao, và khi nào nên dùng DB row lock thay thế.',
  a: `**Tóm tắt:** Distributed lock (khóa phân tán - cơ chế đảm bảo tại một thời điểm chỉ một tiến trình trên nhiều máy được làm một việc) bằng Redis {{SET key token NX PX ttl}} đủ cho mục tiêu "giảm trùng lặp", nhưng **không đủ** cho mục tiêu "không bao giờ ghi đè sai" khi không có fencing token (số thứ tự tăng dần mà tài nguyên đích kiểm tra). Nguyên nhân gốc: lock hết hạn theo thời gian trong khi client vẫn đang giữ quyền truy cập tài nguyên; GC pause, clock skew, hoặc mạng chậm có thể khiến client cũ ghi đè client mới. Với dữ liệu quan trọng (tiền, tồn kho), ưu tiên ràng buộc DB (row lock, conditional update) thay vì lock Redis thuần.

### Thuật ngữ nền (đọc nếu chưa quen)
- **GC pause / stop-the-world (STW):** khoảng thời gian máy ảo Java (JVM) tạm dừng mọi thread ứng dụng để dọn rác bộ nhớ. Với heap lớn, pause có thể kéo dài từ vài trăm mili-giây đến hàng chục giây.
- **Clock skew (lệch đồng hồ):** các máy chủ có giờ hệ thống khác nhau do NTP đồng bộ không hoàn hảo hoặc bước nhảy giờ; hai máy có thể lệch vài mili-giây đến vài giây.
- **TTL (Time To Live):** thời gian sống của key; hết TTL Redis tự xóa key (tức lock tự hết hạn).
- **Nguyên tử (atomic):** thao tác được thực hiện trọn vẹn, không bị xen giữa bởi thao tác khác.

### Redis lock cơ bản: từng bước bên trong
Mục tiêu: chỉ một worker xử lý job {{report:2026-11}}.
1. Worker A tạo token ngẫu nhiên {{tA = uuid()}} (để chỉ chính A mới được nhả lock của A).
2. A gửi: {{SET lock:report:2026-11 tA NX PX 30000}}.
   - {{NX}} (Not eXists): chỉ đặt nếu key chưa tồn tại. Redis xử lý lệnh này đơn luồng (single-threaded event loop) nên hai lệnh SET NX đến cùng lúc không thể cùng thành công - đây là điểm "nguyên tử" tạo nên mutual exclusion (loại trừ lẫn nhau).
   - {{PX 30000}}: TTL 30 giây. Redis lưu thời điểm hết hạn và xóa key khi đến hạn (active + passive expiry).
3. Nếu trả {{OK}}, A giữ lock; nếu {{nil}}, A không giữ lock.
4. A làm việc (ví dụ tính báo cáo 8 giây), ghi kết quả.
5. A nhả lock: **không được** {{DEL lock:report:2026-11}} trần, vì nếu lock đã hết hạn và B đã vào, A sẽ xóa lock của B. Phải dùng Lua script (chạy nguyên tử trong Redis):
~~~text
-- KEYS[1]=lock key, ARGV[1]=token
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
else
  return 0  -- lock đã thuộc về người khác, không xóa
end
~~~

### Vì sao vẫn không an toàn: 3 kịch bản hỏng
**Kịch bản 1 - GC pause / process treo (phổ biến nhất):**
~~~text
t=0s   A acquire lock (TTL 30s), token=tA
t=1s   A bắt đầu ghi báo cáo (nhiều object, heap căng)
t=2s   JVM của A vào Full GC stop-the-world, mọi thread A đứng im
t=30s  Redis xóa lock (TTL hết) - A không biết, đang bị treo
t=31s  B acquire lock, token=tB, bắt đầu ghi
t=40s  B ghi xong báo cáo phiên bản V2
t=42s  GC của A kết thúc, A tỉnh dậy, vẫn "nghĩ" mình giữ lock
t=43s  A ghi đè báo cáo -> V2 bị mất, dữ liệu sai
~~~
Tăng TTL (ví dụ 5 phút) chỉ giảm xác suất, không loại bỏ: GC pause dài, VM bị swap, container bị CPU throttle đều có thể vượt TTL. Giảm thời gian xử lý cũng không đảm bảo.

**Kịch bản 2 - Clock skew / bước nhảy thời gian (NTP):**
Redis tính TTL theo đồng hồ monotonic của chính nó (tốt), nhưng nếu bạn tự kiểm tra "còn bao lâu" bằng đồng hồ ứng dụng lệch, hoặc trong thiết lập phức tạp (Redlock dùng thời gian cục bộ để ước lượng), bước nhảy NTP có thể làm bạn đánh giá sai thời gian còn lại. Độc lập hơn, nếu TTL được quản lý bởi tầng ứng dụng dựa trên {{System.currentTimeMillis()}} (wall clock, có thể nhảy lùi/tiến), logic gia hạn/hết hạn sẽ sai.

**Kịch bản 3 - Mất lock khi failover (Redis không durable):**
Nếu dùng Redis master-replica bất đồng bộ (async replication): A acquire trên master, master chưa kịp replicate key lock sang replica thì master chết; replica được thăng lên master nhưng không có key lock -> B acquire được. Hai client cùng giữ lock.

### Fencing token: cơ chế sửa đúng gốc rễ
Lock một mình chỉ là "lời hứa mềm". Cần **fencing token**: một số nguyên tăng dần, cấp mỗi lần acquire thành công, và **tài nguyên đích phải từ chối token cũ**.
~~~text
Bước 1: Lấy token tăng dần (nguồn cấp phát phải có thứ tự)
  - Redis: token = INCR fence:report:2026-11  -> ví dụ A nhận 33
  - Hoặc dùng DB sequence / etcd revision
Bước 2: A acquire lock kèm token 33, bắt đầu làm việc
Bước 3: A bị GC pause, lock hết hạn, B acquire -> nhận token 34
Bước 4: B ghi vào storage: "ghi V2 nếu token >= token_đã_thấy"
  -> storage đang nhớ token_max=0, nhận 34 -> chấp nhận, cập nhật token_max=34
Bước 5: A tỉnh dậy, ghi với token 33
  -> storage thấy 33 < 34 -> TỪ CHỐI (stale writer)
~~~
Ví dụ kiểm tra fencing ở DB (Postgres):
~~~sql
-- Bảng lưu token cao nhất đã chấp nhận cho mỗi tài nguyên
UPDATE report_output
   SET content = ?, fence_token = 34
 WHERE report_id = '2026-11'
   AND fence_token < 34;  -- chỉ ghi nếu token mới hơn
-- affected rows = 0 => bị từ chối, client biết mình đã mất lock
~~~
**Điểm mấu chốt:** nếu tài nguyên đích không thể kiểm tra token (ghi file S3 thuần, gọi API bên thứ ba không hỗ trợ version), fencing token không áp dụng được - khi đó lock Redis **không bảo vệ được** tính đúng đắn.

### Khi nào dùng DB row lock thay thế
| Nhu cầu | Lựa chọn | Vì sao |
|---|---|---|
| Tránh hai job chạy trùng, chấp nhận hiếm khi trùng | Redis SET NX PX + token + TTL + handler idempotent | Rẻ, đủ cho "best effort" |
| Cập nhật đúng một hàng dữ liệu (tồn kho, số dư) | {{SELECT ... FOR UPDATE}} hoặc {{UPDATE ... WHERE điều_kiện}} trong transaction DB | DB là nguồn sự thật, atomic ở mức row, không cần lock ngoài |
| Xử lý job hàng đợi trong Postgres | {{SELECT ... FOR UPDATE SKIP LOCKED}} | Claim nguyên tử, không lock chéo, tích hợp sẵn fencing bằng điều kiện |
| Khóa logic theo tenant/user trong 1 DB | Postgres {{pg_advisory_xact_lock(key)}} | Lock gắn transaction, tự nhả khi commit/rollback, không lệ thuộc Redis |
| Tọa độ giữa nhiều hệ thống không chung DB | Redis/etcd + fencing token ở mọi storage đích | Chỉ khi thật sự cần cross-system |

Ví dụ DB row lock thay Redis cho trừ tồn kho (đúng hơn, đơn giản hơn):
~~~sql
UPDATE inventory
   SET available = available - 1
 WHERE sku = 'SKU-1' AND available >= 1;
-- affected rows = 1 => thành công; 0 => hết hàng
-- Không cần lock Redis, không lo GC pause ghi đè
~~~

### Trên production
- **Triệu chứng:** báo cáo bị ghi đè ngẫu nhiên, job chạy trùng (hai dòng log "started" cùng jobId), tồn kho âm hiếm khi (nếu dùng lock thay vì điều kiện DB). Tỉ lệ lỗi tăng vào lúc GC căng (heap đầy, promotion failure) hoặc khi NTP bước giờ.
- **Cách đo:** log {{lock_acquire, token, lease_ms, lock_release}}; metric thời gian giữ lock và số lần release trả 0 (mất lock). Correlate với GC log ({{-Xlog:gc*:file=gc.log}} JDK 17+) - nếu mất lock trùng thời điểm STW dài, đó là bằng chứng.
- **Tuning/cấu hình có thật (Redis):** dùng {{PX}} (ms) thay {{EX}}; đặt TTL >= 3-5x p99 thời gian xử lý; watchdog gia hạn (Redisson {{RLock}} có watchdog mặc định 30s, gia hạn mỗi 10s) nhưng **watchdog không cứu process bị treo hoàn toàn** (STW, SIGSTOP). Bật {{appendonly yes}} và chấp nhận lock có thể mất khi failover nếu dùng async replication; cần correctness thì dùng replication có xác nhận hoặc chuyển sang hệ consensus.
- **Nguyên tắc vận hành:** handler phía sau lock phải **idempotent** (chạy 2 lần cho cùng kết quả) - đó là lưới an toàn cuối khi lock thất bại.

### Ví dụ đời thực: báo cáo tài chính bị ghi đè do GC pause

Một hệ thống xử lý báo cáo doanh thu hàng ngày của ngân hàng, chạy lúc 02:00 sáng. Mỗi báo cáo mất khoảng 25 giây tính toán (tổng hợp 50 triệu giao dịch), dùng Redis lock TTL 60s. **Triệu chứng:** sau 3 tháng, team phát hiện báo cáo ngày 15/10 bị sai lệch 2,3 tỷ so với dữ liệu gốc; log thấy hai worker cùng ghi report_output cho cùng report_id=2024-10-15 trong vòng 2 giây. **Điều tra:** GC log (JDK 17, G1GC, heap 16GB) cho thấy lúc 02:15:23 worker A vào Full GC STW kéo dài 48 giây (humongous allocation + promotion failure). Lúc đó lock TTL 60s đã hết hạn (acquire lúc 02:14:55). Worker B acquire lock lúc 02:15:35, tính xong ghi V2 lúc 02:16:00. Worker A sau khi GC xong (02:16:11) vẫn nghĩ mình giữ lock, ghi đè V1 -> V2 mất. **Nguyên nhân gốc:** lock Redis hết hạn theo thời gian thực nhưng worker không biết; không có fencing token nên storage chấp nhận write từ worker cũ. **Xử lý:** (1) Thêm fencing token: Redis INCR fence:report:2024-10-15 cấp token mỗi acquire; (2) report_output thêm cột fence_token BIGINT DEFAULT 0; (3) Worker ghi DB với WHERE fence_token < $new_token (conditional update); (4) Tăng lock TTL lên 300s + bật Redisson watchdog gia hạn 10s; (5) Thêm alert: metric lock_lost_total > 0 hoặc GC pause > 30s -> PagerDuty. **Kết quả đo được:** 6 tháng sau, 0 sự cố ghi đè báo cáo; lock_lost_total = 0; p99 báo cáo 28s (trong TTL).

### Trả lời mẫu khi phỏng vấn

"Khi nói về distributed lock Redis, tôi luôn bắt đầu bằng: SET NX PX chỉ là mutual exclusion best-effort, không phải correctness guarantee. Vấn đề cốt lõi là lock hết hạn theo thời gian thực (TTL) trong khi code chạy theo thời gian logic — GC pause, CPU throttle, network partition đều có thể làm TTL hết mà worker không hay. Tôi từng gặp case Full GC 48s làm lock hết hạn, worker cũ ghi đè báo cáo tài chính đã được worker mới tính xong. Giải pháp đúng là fencing token: mỗi lần acquire lock, lấy token tăng dần từ Redis INCR (hoặc DB sequence); storage đích (DB, S3 versioned, v.v.) chỉ chấp nhận write nếu token mới hơn token đã thấy. Nếu storage không hỗ trợ compare-and-swap (ví dụ API thứ ba), lock Redis không bảo vệ được — lúc đó phải dùng DB row lock (UPDATE ... WHERE version = x) hoặc etcd/consensus. Tóm lại: Redis lock giảm trùng lặp, fencing token + conditional write mới đảm bảo đúng đắn."


> Senior tip: Tôi coi Redis lock là "đèn giao thông gợi ý", còn fencing token + ràng buộc DB là "rào chắn vật lý". Trong phỏng vấn, nếu bạn nói "dùng Redis lock" mà không nhắc GC pause và fencing, interviewer senior sẽ đào tiếp; nếu bạn chủ động nói "lock chỉ giảm trùng, tính đúng đắn nằm ở conditional write với token/version", đó là câu trả lời của người đã từng bị mất dữ liệu.`,
  follow: ['Redisson watchdog gia hạn lock tự động; nó có giải quyết được kịch bản GC stop-the-world 40 giây không? Vì sao?', 'Bạn thiết kế fencing token khi storage đích là một API HTTP bên thứ ba không hỗ trợ version/compare-and-swap như thế nào?', 'Postgres advisory lock khác row lock (SELECT FOR UPDATE) ở điểm nào, và khi nào advisory lock phù hợp hơn?'],
  refs: [{"type":"article","title":"How to do distributed locking (Martin Kleppmann)","url":"https://martin.kleppmann.com/2016/02/08/how-to-do-distributed-locking.html"},{"type":"doc","title":"Redis: Distributed Locks","url":"https://redis.io/docs/latest/develop/use/patterns/distributed-locks/"}],
},
{
  id: 'architecture-032',
  topic: 'architecture',
  level: 'senior',
  q: 'Giải thích consensus Raft ở mức đủ hiểu để vận hành: leader election, log replication và quorum hoạt động từng bước thế nào? Liên hệ với etcd và Kafka KRaft - tại sao chúng cần Raft và điều gì xảy ra khi leader chết?',
  a: `**Tóm tắt:** Consensus (đồng thuận - các nút trong cụm thống nhất cùng một giá trị/thứ tự dù có nút chết hoặc mạng chậm) là bài toán cốt lõi của hệ phân tán. Raft là thuật toán consensus được thiết kế để dễ hiểu: một cụm bầu ra **leader** duy nhất, mọi ghi đi qua leader, leader sao chép log (nhật ký lệnh) sang follower và chỉ **commit** khi đa số (quorum) đã nhận. etcd dùng Raft để lưu metadata/cấu hình nhất quán; Kafka KRaft dùng biến thể dựa trên Raft (metadata quorum) để thay ZooKeeper quản lý metadata broker/topic.

### Thuật ngữ nền
- **Node (nút):** một tiến trình/server tham gia cụm (ví dụ một instance etcd).
- **Quorum (đa số):** số nút tối thiểu phải đồng ý để quyết định có hiệu lực. Cụm N nút, quorum = floor(N/2)+1. Ví dụ N=3 -> 2; N=5 -> 3.
- **Log (nhật ký):** danh sách lệnh có thứ tự, mỗi mục có {{index}} và {{term}} (nhiệm kỳ).
- **Term (nhiệm kỳ):** số nguyên tăng dần; mỗi lần bầu cử bắt đầu term mới. Term giúp phân biệt leader cũ/mới.
- **Commit:** một mục log được coi là chắc chắn khi leader biết nó đã được sao chép tới quorum; sau commit, trạng thái máy (state machine) mới áp dụng lệnh.

### Cấu trúc dữ liệu Raft nhìn từ bên trong
Mỗi nút giữ:
~~~text
persistent (lưu đĩa, sống qua restart):
  currentTerm = 5          -- term hiện tại
  votedFor = nodeB         -- đã bầu cho ai trong term này (hoặc null)
  log[] = [ {idx:1,term:1,cmd:x}, {idx:2,term:3,cmd:y}, ... ]

volatile (trong RAM):
  commitIndex = 7          -- index cao nhất đã commit
  lastApplied = 7          -- index cao nhất đã áp dụng vào state machine
Leader thêm:
  nextIndex[follower]      -- index tiếp theo sẽ gửi cho follower
  matchIndex[follower]     -- index cao nhất follower đã xác nhận
~~~

### 1) Leader election - bầu leader từng bước
Trạng thái nút: {{Follower}} (mặc định) / {{Candidate}} / {{Leader}}.
~~~seq
title: Raft - Leader election (3 nút)
actors: F1 | F2 | F3
note F1..F3: Ban đầu đều Follower, nhận heartbeat từ leader cũ
F1 -> F1: Hết election timeout (ngẫu nhiên, ví dụ 150-300ms)
F1 -> F1: Chuyển Candidate, term=6, tự bầu cho mình
F1 -> F2: RequestVote(term=6, lastLogIndex,lastLogTerm)
F1 -> F3: RequestVote(term=6, lastLogIndex,lastLogTerm)
F2 -> F1: VoteGranted (log F1 ít nhất mới bằng F2)
F3 -> F1: VoteGranted
F1 -> F1: Đạt quorum (2/3) -> thành Leader term 6
F1 -> F2: AppendEntries rỗng (heartbeat)
F1 -> F3: AppendEntries rỗng (heartbeat)
~~~
Quy tắc quan trọng:
- Mỗi nút chỉ bầu **1 phiếu mỗi term** (tránh 2 leader cùng term).
- Follower chỉ bầu cho candidate có log **ít nhất cập nhật bằng** mình (so sánh {{lastLogTerm}} rồi {{lastLogIndex}}). Điều này ngăn leader mới thiếu dữ liệu đã commit.
- **Election timeout ngẫu nhiên** (randomized) giảm xác suất hai nút cùng ứng cử -> split vote. Nếu split vote, hết timeout lại bầu term mới.
- Khi nhận message có {{term}} cao hơn, nút lập tức hạ xuống Follower và cập nhật {{currentTerm}}.

### 2) Log replication - sao chép log từng bước
Mọi lệnh ghi từ client chỉ đi vào **leader**.
~~~seq
title: Raft - ghi thành công (commit khi đủ quorum)
actors: Client | Leader | F1 | F2
Client -> Leader: PUT x=5
Leader -> Leader: Append {idx:8,term:6,cmd:PUT x=5} vào log local
Leader -> F1: AppendEntries(prevIdx=7,prevTerm=5, entries=[idx8], leaderCommit=7)
Leader -> F2: AppendEntries(prevIdx=7,prevTerm=5, entries=[idx8], leaderCommit=7)
F1 -> F1: Kiểm tra prevIdx/prevTerm khớp -> append idx8
F1 -> Leader: Success (matchIndex=8)
Leader -> Leader: Đếm ack: leader+F1 = 2/3 (quorum) -> commitIndex=8
F2 -> Leader: Success
Leader -> Client: OK (đã commit)
Leader -> F1: Heartbeat kèm leaderCommit=8 -> F1 apply idx8
~~~
Nếu log follower lệch (thiếu mục): leader phát hiện qua {{prevLogIndex/prevLogTerm}} không khớp, giảm {{nextIndex}} của follower đó và gửi lại từ điểm khớp (backtrack) cho đến khi đồng bộ.

### 3) Vì sao quorum (đa số) là chìa khóa
Quorum đảm bảo **giao nhau** (intersection): bất kỳ hai tập đa số nào cũng có ít nhất 1 nút chung. Nút chung đó mang thông tin về mục đã commit, nên leader mới (được bầu bởi đa số) chắc chắn có log chứa mọi mục đã commit. Đây là nền tảng an toàn (safety) của Raft.
- N=3 chịu được 1 nút chết; N=5 chịu được 2. Tăng N tăng chịu lỗi nhưng tăng độ trễ ghi (phải chờ nhiều ack) và chi phí.
- Nếu mất quorum (ví dụ 2/3 nút chết), cụm **không bầu được leader mới và không nhận ghi** - đây là chọn C (consistency) thay vì A (availability) khi partition theo CAP.

### Liên hệ etcd
- **etcd** (kho key-value phân tán, dùng bởi Kubernetes lưu toàn bộ trạng thái cluster) chạy Raft: ghi {{kubectl apply}} -> API server ghi etcd -> chỉ thành công khi quorum etcd commit. Vì vậy etcd cần 3 hoặc 5 thành viên, đặt trên failure domain khác nhau.
- Đọc có thể {{linearizable}} (qua leader, chắc chắn mới nhất) hoặc {{serializable}} (từ follower, nhanh hơn nhưng có thể hơi cũ) tùy cấu hình client.

### Liên hệ Kafka KRaft
- Trước đây Kafka dùng **ZooKeeper** (hệ consensus riêng) để lưu metadata: broker nào sống, partition leader ở đâu, topic config. KRaft (Kafka Raft Metadata mode) thay ZooKeeper bằng một **controller quorum** chạy giao thức dựa trên Raft, lưu metadata trong một internal log topic ({{__cluster_metadata}}).
- Điều xảy ra khi controller leader chết: các controller còn lại bầu leader mới bằng quorum; metadata đã commit không mất. Broker tiếp tục phục vụ produce/consume dựa trên metadata đã biết, nhưng thay đổi metadata (tạo topic, bầu partition leader mới) phải chờ controller quorum ổn.
- Lợi ích thực tế: bỏ phụ thuộc ZooKeeper, mở rộng số partition tốt hơn, thời gian khôi phục controller nhanh và nhất quán hơn.

### Trên production
- **Triệu chứng khi quorum mất:** etcd báo {{etcdserver: no leader}}, {{request timed out}}; Kubernetes API server lỗi ghi; Kafka controller không bầu được leader, không tạo topic mới. Ứng dụng phía trên có thể vẫn đọc cache nhưng không thay đổi trạng thái cluster.
- **Cách đo:** metric etcd {{etcd_server_has_leader}}, {{etcd_server_leader_changes_seen_total}} (tăng bất thường = bầu lại liên tục), {{etcd_disk_wal_fsync_duration_seconds}} (đĩa chậm làm chậm commit). Kafka: {{ActiveControllerCount}} (phải = 1 trên toàn cụm).
- **Tuning/cấu hình có thật:** election timeout phải lớn hơn thời gian round-trip mạng và thời gian fsync đĩa; etcd khuyến nghị SSD, tách đĩa WAL; không đặt cụm 2 nút (mất 1 là mất quorum). Giám sát leader change: bầu lại thường xuyên thường do mạng không ổn, GC pause trên node controller, hoặc đĩa chậm.
- **Trade-off cốt lõi:** Raft chọn an toàn và dễ hiểu, đổi lại ghi phải qua leader (leader là điểm nóng ghi) và độ trễ ghi >= 1 round-trip đến quorum.

### Ví dụ đời thực
  Một công ty vận hành cụm etcd 3 node lưu metadata cho Kubernetes (đang trong quá trình di chuyển một số service metadata từ ZooKeeper sang etcd). Buổi sáng, một switch mạng trong datacenter bị lag 300ms → node etcd thứ 3 mất kết nối. Cụm chỉ còn 2/3 node, vẫn đủ quorum nên ban đầu mọi thứ trông bình thường. Tuy nhiên, election timeout của etcd chỉ là 150ms — quá thấp so với jitter mạng. Node thứ 3 sau đó reconnect nhưng liên tục chuyển Candidate → Follower → Candidate vì heartbeat từ leader không đều. Metric {{etcd_server_leader_changes_seen_total}} tăng từ bình thường ~1/giờ lên 12 lần trong 10 phút. Kafka controller (đang dùng KRaft để lưu metadata topic/partition, độc lập với etcd) không thể commit metadata mới: không tạo topic mới được, không reassign partition leader khi broker chết. Ứng dụng phía trên vẫn đọc cache và phục vụ read, nhưng mọi thay đổi cấu hình (tạo topic, thay đổi replication factor) đều timeout. **Triệu chứng:** {{etcdserver: no leader}} hiện khoảng 20s mỗi lần bầu lại; Kafka {{ActiveControllerCount}} nhảy giữa 0 và 1; API tạo topic mới trả 503. **Điều tra:** dashboard cho thấy election timeout 150ms nhỏ hơn round-trip mạng trung bình 180ms giữa các node (đặt trên 3 AZ khác nhau nhưng chưa có firewall rule ổn định). Node thứ 3 liên tục ứng dụng cử tri RequestVote vì heartbeat không đến đủ nhanh. **Nguyên nhân gốc:** election timeout < network jitter → split vote và bầu lại liên tục → metadata quorum không ổn định. **Xử lý:** (1) Tăng {{--election-timeout}} từ 150ms lên 400ms và {{--heartbeat-interval}} từ 100ms lên 250ms; (2) Thêm node etcd thứ 4 để có tolerance 2 node mất; (3) Đặt 3 node trên 3 AZ khác nhau với firewall rule ổn định và giảm jitter mạng; (4) Thêm cảnh báo khi {{leader_changes_seen_total}} tăng > 3 lần trong 5 phút. **Kết quả đo được:** sau 1 tuần, không có bầu lại leader không cần thiết; Kafka tạo topic mới trở lại bình thường; thời gian commit metadata tăng trung bình 30ms (chấp nhận được).

### Trả lời mẫu khi phỏng vấn
  "Khi nói về Raft, tôi bắt đầu bằng một con số: cụm 3 node, quorum = 2. Cơ chế là leader election — mỗi nút có election timeout ngẫu nhiên, candidate gửi RequestVote, đạt quorum mới thành leader. Log replication: mọi ghi đi qua leader, leader append log local rồi gửi AppendEntries cho follower, commit khi đã có ack từ quorum. Đây là chìa khóa: bất kỳ hai tập đa số nào cũng giao nhau ít nhất 1 node, nên leader mới chắc chắn có mọi log đã commit. Ở production tôi từng thấy etcd bầu lại leader 12 lần trong 10 phút do election timeout quá thấp (150ms) so với network jitter — etcd lưu metadata cho Kubernetes nên Kubernetes API server không thể ghi, và cùng lúc đó Kafka controller (chạy KRaft, một cụm Raft riêng) cũng bị ảnh hưởng bởi cùng switch mạng nên không thể commit metadata mới: không tạo topic mới được, không reassign partition leader. Cách sửa là tăng election timeout lên 400ms, đặt node trên các failure domain khác nhau, và giám sát leader_changes_seen_total. Trade-off: election timeout cao hơn làm thời gian khôi phục leader lâu hơn khi leader thật sự chết; quá thấp thì dễ bầu lại liên tục do network jitter. Với Kafka KRaft, khác biệt là controller quorum riêng biệt với data broker — metadata quorum không nên đặt chung với broker vì một sự cố network có thể làm mất cả hai."

  > Senior tip: Khi ai đó nói "dùng Raft nên dữ liệu luôn an toàn", hãy hỏi thêm: quorum có còn không, đĩa có fsync trước khi ack không, và client đọc từ leader hay follower. Raft đảm bảo an toàn theo mô hình giả định (crash fault, không Byzantine); cấu hình sai (tắt fsync, cụm 2 nút, network bất ổn) vẫn mất dữ liệu.`,
  follow: ['Nếu hai node cùng thành Candidate do split vote, Raft đảm bảo không có hai leader cùng commit một index khác nhau như thế nào?', 'Linearizable read trong Raft (read qua leader) khác gì với đọc từ follower, và ReadIndex/lease read giải quyết ra sao?', 'Khi Kafka chuyển từ ZooKeeper sang KRaft, rủi ro vận hành chính trong quá trình migration là gì và tại sao metadata quorum phải tách biệt với data broker?'],
  refs: [{"type":"doc","title":"The Raft Consensus Algorithm","url":"https://raft.github.io/"},{"type":"doc","title":"etcd: Why etcd","url":"https://etcd.io/docs/v3.5/learning/why/"}],
},
{
  id: 'architecture-033',
  topic: 'architecture',
  level: 'senior',
  q: 'Thời gian trong hệ phân tán: tại sao không thể dùng timestamp đồng hồ máy để sắp xếp sự kiện một cách đáng tin cậy? Giải thích clock skew, NTP, Lamport clock và vector clock từng bước, kèm ví dụ khi sắp xếp sai gây hậu quả trong ngân hàng/thương mại điện tử.',
  a: `**Tóm tắt:** Trong hệ phân tán không có đồng hồ toàn cục hoàn hảo. Đồng hồ máy (wall clock) bị **clock skew** (lệch giữa các máy) và có thể nhảy lùi/tiến khi NTP hiệu chỉnh, nên sắp xếp sự kiện chỉ bằng timestamp máy có thể cho thứ tự sai nhân quả. **Lamport clock** cho thứ tự logic nhất quán với quan hệ "xảy ra trước" nhưng không phân biệt được hai sự kiện song song. **Vector clock** phát hiện được quan hệ nhân quả và concurrency (song song). Trong thực tế: dùng đồng hồ vật lý cho hiển thị/log gần đúng, dùng version/logical clock/HLC cho thứ tự nhân quả và giải quyết xung đột.

### Thuật ngữ nền
- **Wall clock (đồng hồ tường):** giờ thực tế trên máy, ví dụ {{2026-11-07T10:00:01Z}}; lấy bằng {{System.currentTimeMillis()}} (Java) - có thể nhảy do NTP.
- **Monotonic clock (đồng hồ đơn điệu):** chỉ tăng, không nhảy lùi, dùng để đo khoảng thời gian; {{System.nanoTime()}} - **không** dùng để so sánh giữa các máy.
- **Clock skew:** độ lệch giữa đồng hồ hai máy tại cùng thời điểm (ví dụ máy A nhanh hơn B 120ms).
- **Clock drift:** tốc độ đồng hồ chạy nhanh/chậm so với chuẩn do phần cứng thạch anh.
- **NTP (Network Time Protocol):** giao thức đồng bộ giờ qua mạng; máy hỏi NTP server và chỉnh đồng hồ. Độ chính xác điển hình vài mili-giây trong LAN, chục mili-giây qua Internet; NTP có thể **bước nhảy** (step) hoặc **chỉnh từ từ** (slew) - bước nhảy làm timestamp lùi/tiến đột ngột.
- **Happened-before (xảy ra trước), ký hiệu A -> B:** A có thể ảnh hưởng B (cùng tiến trình theo thứ tự, hoặc gửi/nhận message). Nếu không A->B và không B->A thì A, B **concurrent** (song song).

### Vì sao timestamp máy không đủ: ví dụ từng bước
Hệ thống ngân hàng: hai giao dịch trên cùng tài khoản, số dư ban đầu 1.000.000đ.
~~~text
Máy A (đồng hồ NHANH hơn thực tế 500ms):
  10:00:01.600 A ghi "rút 800.000đ" (thực tế xảy ra lúc 10:00:01.100)

Máy B (đồng hồ ĐÚNG):
  10:00:01.300 B ghi "nạp 200.000đ" (thực tế xảy ra lúc 10:00:01.300)

Nếu sắp xếp theo timestamp máy: A(1.600) sau B(1.300)
  -> hiểu nhầm nạp trước, rút sau (đúng ngẫu nhiên ở đây)
Nhưng nếu A nhanh hơn 600ms:
  A(1.700) vẫn sau? A ghi 1.700, B ghi 1.300 -> rút sau nạp.
Nếu B ghi lúc 10:00:01.800 (thực tế 1.800) nhưng NTP bước lùi B 300ms:
  B timestamp thành 1.500 -> hệ thống nghĩ nạp xảy ra trước rút? thứ tự đảo.
~~~
Trong thương mại điện tử: "đặt hàng" (máy web) và "hủy đơn" (máy worker) có thể bị sắp sai -> hệ thống hủy một đơn chưa được ghi nhận, hoặc hoàn tiền sai. Log ghép từ nhiều máy theo timestamp sẽ kể sai câu chuyện sự cố.

### Lamport clock - đồng hồ logic (thứ tự nhất quán với nhân quả)
Mỗi tiến trình giữ bộ đếm số nguyên {{L}}.
~~~text
Quy tắc:
1. Trước mỗi sự kiện nội bộ: L = L + 1
2. Khi gửi message m: L = L + 1; gửi kèm timestamp t=L
3. Khi nhận message có timestamp t: L = max(L, t) + 1

Ví dụ 3 tiến trình P1,P2,P3 (bắt đầu đều L=0):
P1: e1(L=1) --gửi m(t=2)-->        e4(L=3)
P2:                 nhận m: L=max(0,2)+1=3, e2(L=3) --gửi n(t=4)-->
P3:                                  nhận n: L=max(0,4)+1=5, e3(L=5)

Thứ tự Lamport: e1(1), m(2), e2(3), e4(3), n(4), e3(5)
~~~
Tính chất: nếu {{A -> B}} (nhân quả) thì {{L(A) < L(B)}}. **Nhưng chiều ngược lại không đúng**: {{L(e2)=3, L(e4)=3}} bằng nhau nên không nói được e2 (ở P2) và e4 (ở P1) ai xảy ra trước - hai sự kiện đó **concurrent** (song song). Lamport clock **không phát hiện concurrency**.

### Vector clock - phát hiện nhân quả và song song
Mỗi tiến trình {{Pi}} giữ vector {{V[i]}} có N phần tử (N tiến trình).
~~~text
Quy tắc:
1. Sự kiện nội bộ tại Pi: V[i] = V[i] + 1
2. Gửi message: V[i] = V[i] + 1; gửi kèm V
3. Nhận message kèm Vmsg tại Pi:
     V[j] = max(V[j], Vmsg[j]) với mọi j; rồi V[i] = V[i] + 1

So sánh V và W:
  V <= W nếu mọi k: V[k] <= W[k]
  V <  W nếu V <= W và tồn tại k: V[k] < W[k]  (V xảy ra trước W)
  Song song (concurrent) nếu không V<W và không W<V

Ví dụ:
P1: (1,0,0) --gửi--> (2,0,0)
P2:             nhận -> (2,1,0) --gửi--> (2,2,0)
P3: (0,0,1)  (sự kiện độc lập, không nhận message)

So sánh (2,2,0) với (0,0,1):
  (2,2,0) có phần tử 1,2 lớn hơn nhưng phần tử 3 = 0 < 1
  (0,0,1) có phần tử 3 lớn hơn -> KHÔNG cái nào <= cái kia => SONG SONG
~~~
Vector clock cho biết chính xác hai phiên bản dữ liệu có quan hệ nhân quả hay xung đột concurrent (cần merge/resolve). Nhược điểm: vector lớn khi nhiều tiến trình (phải nén, dùng dotted version vector trong thực tế như Riak).

### Áp dụng thực tế
| Bài toán | Cách dùng thời gian |
|---|---|
| Hiển thị "gửi lúc 10:01" | Wall clock (chấp nhận sai lệch nhỏ) |
| Sắp xếp log nhiều máy để debug | Wall clock + ghi rõ offset NTP; chấp nhận gần đúng, đối chiếu thêm request/correlation id |
| Thứ tự giao dịch tiền trong 1 tài khoản | Một nguồn sự thật (DB sequence/serializable transaction) hoặc single-writer per account - **không** dùng timestamp máy |
| Phát hiện xung đột ghi song song (eventual consistency) | Version, vector clock/dotted version, hoặc last-write-wins có hiểu rủi ro |
| Phiên bản trong Raft/etcd | {{term}} + {{index}} (thứ tự logic toàn cụm qua consensus) |
| Deadline/timeout | Monotonic clock ({{nanoTime}}) để đo khoảng, không dùng wall clock |

### Trên production
- **Triệu chứng do clock sai:** token/session hết hạn sớm hoặc sống quá lâu; log timeline đảo lộn gây chẩn đoán sai sự cố; last-write-wins chọn sai bản ghi "mới hơn"; chứng chỉ TLS bị từ chối (not yet valid/expired) khi clock lệch mạnh.
- **Cách đo:** theo dõi offset NTP ({{chronyc tracking}} trên Linux: field {{System time}}; hoặc metric node exporter {{node_timex_offset_seconds}}). Cảnh báo khi lệch > 50-100ms trong datacenter.
- **Tuning/cấu hình có thật:** chạy {{chrony}} hoặc {{ntpd}} trên mọi node; ưu tiên NTP server nội bộ; cấu hình chrony tránh step nhảy lớn khi đang chạy (slew) trừ khi lệch quá ngưỡng an toàn; trong JVM không dùng {{currentTimeMillis}} cho logic timeout quan trọng - dùng {{nanoTime}} hoặc thư viện deadline.
- **Nguyên tắc:** với dữ liệu tiền/banking, **không bao giờ** quyết định đúng-sai nghiệp vụ dựa vào so sánh timestamp từ hai máy khác nhau; dùng transaction DB, sequence, hoặc consensus.

### Ví dụ đời thực
  Một sàn giao dịch chứng khoán (500k lệnh/ngày) dùng last-write-wins (LWW) trên một cụm Cassandra để lưu giá trị giá cổ phiếu hiện tại của từng mã, với timestamp máy làm "phiên bản mới nhất". Một buổi sáng, hai nhánh giao dịch ở Singapore và Frankfurt cùng ghi giá cho mã ABC: Singapore ghi 1.234,56 USD lúc timestamp máy 09:00:01.100 (đồng hồ lệch +180ms), Frankfurt ghi 1.234,57 USD lúc timestamp máy 09:00:00.900 (đồng hồ đúng). LWW chọn Frankfurt vì timestamp 900 < 1000 — đúng theo đồng hồ, nhưng Singapore mới gửi command sau đó 200ms (do network round-trip). Kết quả: giá ABC hiện trên dashboard là 1.234,57 trong khi lệnh từ Singapore (giá mới hơn theo thời gian thực) bị bỏ qua. Nhà đầu tư đặt bán theo giá cũ, lệnh không được thực hiện vì giá đã tăng. **Triệu chứng:** metric {{cassandra_write_conflicts}} tăng vọt; log ứng dụng ghi "LWW conflict resolved to older version"; khách hàng than rằng giá cổ phiếu không cập nhật theo lệnh của họ. **Điều tra:** kiểm tra offset NTP: {{node_timex_offset_seconds}} trên node Singapore = +0,18s; node Frankfurt = +0,002s. Hai node cùng ghi key {{price:ABC}}, LWW so sánh timestamp máy — Singapore bị coi là "cũ" dù command đến sau. **Nguyên nhân gốc:** LWW dựa trên timestamp máy không thể phân biệt được "ghi đến sau" và "đồng hồ nhanh hơn". **Xử lý:** (1) Thay thế LWW bằng version vector hoặc logical clock (số lần ghi + node id) để so sánh theo nhân quả thay vì vật lý; (2) Với giá cổ phiếu, chọn một node leader duy nhất cho mỗi mã (partition theo mã) để mọi ghi đi qua cùng một thứ tự — không cần LWW; (3) Dùng {{CAS}} (compare-and-set) với version hiện tại: {{UPDATE price SET val=? WHERE key=? AND version=?}}; (4) Cấu hình NTP để offset < 50ms và cảnh báo khi lệch > 100ms. **Kết quả đo được:** không còn xung đột LWW; giá cổ phiếu cập nhật theo đúng thứ tự command; offset NTP ổn định dưới 30ms.

### Trả lời mẫu khi phỏng vấn
  "Trong hệ phân tán, không có đồng hồ toàn cục hoàn hảo — đồng hồ máy bị clock skew và có thể nh jumped do NTP hiệu chỉnh, nên sắp xếp sự kiện chỉ bằng timestamp máy có thể cho thứ tự sai nhân quả. Lamport clock cho thứ tự logic nhất quán với quan hệ xảy ra trước: mỗi tiến trình giữ một số nguyên, trước mỗi sự kiện tăng 1, khi gửi message gửi kèm timestamp, khi nhận thì L = max(L, t) + 1. Nếu A xảy ra trước B thì L(A) < L(B), nhưng chiều ngược lại không đúng — hai sự kiện có cùng giá trị Lamport là concurrent. Vector clock khắc phục điều đó: mỗi tiến trình giữ một vector, sự kiện nội bộ tăng phần tử của mình, khi nhận message thì update từng phần tử bằng max. So sánh V và W: nếu mọi phần tử V <= W và ít nhất một phần tử V < W thì V xảy ra trước W; nếu không thì song song. Ở production tôi từng gặp LWW chọn sai giá cổ phiếu do clock skew +180ms — Singapore ghi sau nhưng timestamp máy nhanh hơn nên bị bỏ qua. Cách sửa là dùng version vector hoặc partition theo mã để một leader duy nhất quyết định thứ tự. Trade-off: Lamport clock đơn giản nhưng không phát hiện concurrency; vector clock chính xác nhưng vector lớn khi nhiều tiến trình. Với dữ liệu tiền, không bao giờ dùng timestamp máy để quyết định — luôn dùng transaction DB hoặc consensus."

  > Senior tip: Câu trả lời senior không phải "dùng NTP cho chính xác". NTP giảm skew nhưng không xóa nó về 0 và không sửa được bước nhảy. Câu trả lời đúng là: nhận ra bài toán cần **thứ tự vật lý** hay **thứ tự nhân quả**; nhân quả thì dùng logical clock/version/consensus, còn vật lý chỉ dùng cho hiển thị và chấp nhận sai số đo được.`,
  follow: ['Google Spanner dùng TrueTime với khoảng bất định [earliest, latest] để đạt external consistency; ý tưởng "chờ hết bất định" giải quyết clock skew ra sao và đánh đổi gì?', 'Hybrid Logical Clock (HLC) kết hợp wall clock và Lamport clock như thế nào, và vì sao nó hữu ích cho database phân tán (ví dụ CockroachDB)?', 'Trong hệ event sourcing, bạn gắn thứ tự sự kiện bằng timestamp hay sequence number; khi nào cần cả hai và mỗi cái dùng cho mục đích gì?'],
  refs: [{"type":"doc","title":"chrony documentation (clock synchronization)","url":"https://chrony-project.org/documentation.html"},{"type":"article","title":"Time, Clocks, and the Ordering of Events (Lamport)","url":"https://lamport.azurewebsites.net/pubs/time-clocks.pdf"}],
},
{
  id: 'architecture-034',
  topic: 'architecture',
  level: 'senior',
  q: 'Consistent hashing (băm nhất quán) và virtual node giải quyết vấn đề gì khi thêm/bớt node trong cụm cache hoặc storage phân tán? Giải thích cấu trúc vòng băm, cách định tuyến key, và vì sao rebalancing ít tốn kém hơn băm modulo.',
  a: `**Tóm tắt:** Consistent hashing (băm nhất quán - kỹ thuật ánh xạ key và node lên cùng một vòng băm để khi số node đổi, chỉ một phần nhỏ key phải di chuyển) giải quyết bài toán: {{hash(key) % N}} khiến gần như **mọi key đổi chỗ** khi N thay đổi. Với consistent hashing, thêm 1 node chỉ làm di chuyển khoảng {{1/(N+1)}} key. **Virtual node** (vnode - mỗi node vật lý chiếm nhiều vị trí trên vòng) khắc phục phân bố lệch khi ít node hoặc khi node có sức mạnh khác nhau.

### Bối cảnh: vì sao modulo gây thảm họa khi scale
Giả sử 3 node cache (N=3), key {{user:42}} đi vào node {{hash(user:42) % 3 = 1}}.
~~~text
Trước (N=3):  key K -> hash(K) % 3
  user:42 (hash 10) % 3 = 1  -> Node1
  user:17 (hash 11) % 3 = 2  -> Node2
  user:99 (hash 12) % 3 = 0  -> Node0

Thêm Node3 (N=4):  key K -> hash(K) % 4
  user:42 (10 % 4 = 2) -> Node2  (ĐỔI CHỖ)
  user:17 (11 % 4 = 3) -> Node3  (ĐỔI CHỖ)
  user:99 (12 % 4 = 0) -> Node0  (giữ nguyên)
~~~
Gần {{~75%}} key bị remap (kỳ vọng {{(N)/(N+1)}}). Hậu quả: cache miss hàng loạt (cache stampede) dồn vào DB, có thể làm sập hệ thống ngay lúc bạn vừa scale up - ngược mục đích.

### Consistent hashing: cấu trúc vòng băm từng bước
**Bước 1 - Vòng băm (hash ring):** chọn hàm băm có không gian lớn (ví dụ MD5 128-bit hoặc 32-bit), tưởng tượng giá trị băm nằm trên một vòng tròn khép kín {{0 -> 2^32-1 -> 0}}.
~~~text
              0
          .---+---.
       .-'         '-.
   330 '-.         .-'  40
                 /
       N-A *-----* key:user42 (hash=55) -> đi xuôi chiều kim đồng hồ
          /    /
      200*   *-* 90
          '-' '-'
           N-C  N-B

Vị trí node (băm tên/IP node): N-A=330, N-B=90, N-C=200
Vị trí key: user42=55
~~~
**Bước 2 - Đặt node lên vòng:** {{pos(N-A)=hash("nodeA")}}, {{pos(N-B)=hash("nodeB")}}, {{pos(N-C)=hash("nodeC")}}.
**Bước 3 - Định tuyến key:** băm key được vị trí {{p = hash(key)}}. Đi **xuôi chiều kim đồng hồ** trên vòng từ {{p}} đến gặp node đầu tiên -> key thuộc node đó.
~~~text
user42 -> hash=55  -> gặp N-B tại 90 đầu tiên  => lưu ở N-B
user17 -> hash=150 -> gặp N-C tại 200         => lưu ở N-C
user99 -> hash=350 -> vòng qua 0, gặp N-A 330  => lưu ở N-A
~~~
**Cấu trúc dữ liệu thực thi:** lưu vị trí node trong cây tìm kiếm cân bằng (sorted map / TreeMap trong Java) để tra cứu "node kế tiếp" theo {{ceiling(hash(key))}} trong {{O(log M)}} (M = số vnode).

### Thêm/bớt node: chỉ di chuyển phần nhỏ
~~~text
Thêm N-D tại vị trí 60 (giữa 55 và 90):
  Trước: key 55 -> N-B(90)
  Sau:   key 55 -> N-D(60)  (CHỈ các key nằm giữa N-A(330 qua vòng) và N-D(60)? 
         chính xác: key có hash trong khoảng (330, 60] trên vòng giờ thuộc N-D
         thay vì trước đó thuộc N-B. Chỉ đoạn cung đó bị ảnh hưởng.)

Xóa N-B(90):
  Các key từng thuộc N-B (khoảng (60,90]) chuyển sang N-C(200).
~~~
Kỳ vọng: thêm 1 node vào cụm N node chỉ di chuyển {{K/(N+1)}} key (K tổng key). Bỏ 1 node chỉ ảnh hưởng key của chính node đó. Đây là khác biệt cốt lõi so với modulo.

### Virtual node (vnode): vì sao cần
Vấn đề khi ít node vật lý: 3 node chỉ tạo 3 điểm trên vòng -> các cung rất lệch (node A có thể "sở hữu" 70% vòng, B 10%). Node mạnh/yếu cũng bị đối xử ngang nhau.
~~~text
Giải pháp: mỗi node vật lý có V vnode (ví dụ V=150)
  N-A -> hash("N-A#1"), hash("N-A#2"), ..., hash("N-A#150") rải đều trên vòng
  N-B -> hash("N-B#1")..hash("N-B#150")
  N-C -> hash("N-C#1")..hash("N-C#150")

Key vẫn map tới vnode gần nhất theo chiều kim đồng hồ,
nhưng vnode được quy chiếu về node vật lý (N-A, N-B, N-C).
~~~
Lợi ích:
- **Phân bố đều hơn:** luật số lớn - nhiều điểm ngẫu nhiên rải đều hơn.
- **Node heterogenous:** node mạnh gấp đôi cho 300 vnode, node yếu 75 vnode.
- **Rebalance mịn khi node chết:** key của node chết rải sang nhiều node khác (mỗi vnode đổ vào node kế tiếp khác nhau) thay vì dồn hết vào 1 hàng xóm.

### Áp dụng thực tế
- **Redis Cluster:** dùng 16384 hash slot (một dạng phân mảnh cố định, tư tưởng tương tự chia miền đều); key map qua {{CRC16(key) mod 16384}} vào slot, slot gán cho node. Thêm node -> migrate một số slot (và key trong slot) thủ công/reshard.
- **Cassandra / Dynamo / Riak:** consistent hashing + vnode để phân vùng token ring; replica đặt trên N vnode kế tiếp thuộc node vật lý khác.
- **Client-side cache sharding:** thư viện (memcached client, ketama) dùng consistent hashing để chọn server.

### Trên production
- **Triệu chứng:** thêm node cache nhưng DB vẫn spike (remap quá nhiều do modulo hoặc vnode quá ít); một node nhận tải gấp 3 node khác (vòng lệch, quá ít vnode); sau rebalance, latency tăng do cold cache trên key vừa di chuyển.
- **Cách đo:** phân bố key/QPS theo node (phải gần đều); tỉ lệ cache hit trước/sau thêm node; thời gian và lượng dữ liệu di chuyển khi reshard. Redis Cluster: {{CLUSTER NODES}}, {{redis-cli --cluster check}}.
- **Tuning/cấu hình có thật:** chọn số vnode đủ lớn (thường 100-256/node vật lý tùy hệ) để cân bằng chi phí bộ nhớ metadata; khi thêm node mới, **warm up** dần (shadow traffic hoặc prefill) trước khi nhận full traffic để tránh cache stampede; dùng replication factor >= 2 để node chết không mất dữ liệu, chỉ cần promote replica.
- **Lưu ý:** consistent hashing giải quyết "key nào đi đâu"; nó **không** tự xử lý replication, consistency, hay chuyển dữ liệu - tầng lưu trữ phải có cơ chế migrate (Redis reshard, Cassandra streaming).

### Ví dụ đời thực
Một nền tảng caching dùng 4 node memcached với consistent hashing + ketama (160 vnode/node) để phục vụ 120k reads/s cho trang chi tiết sản phẩm. Cache hit rate ổn định 94%, DB CPU 35%, p99 120ms. Buổi Black Friday, team thêm 2 node mới (node-4, node-5) để tăng công suất — sau khi add, cache hit rate giảm xuống 62%, DB CPU tăng vọt lên 92%, p99 latency tăng từ 120ms lên 1,4s, khách hàng than trang sản phẩm chậm. **Triệu chứng:** dashboard cho thấy chỉ node-3 đang giữ 67% key trong khi 3 node còn lại chỉ giữ 11% mỗi node; metric {{cache_miss_rate}} tăng theo từng bước add node. **Điều tra:** ketama tạo vnode bằng hash("node#i") ngẫu nhiên — node-3 có CPU và RAM gấp 2 lần node khác nhưng cùng 160 vnode, nên trên vòng băm node-3 "chiếm" các cung lớn hơn do số lượng điểm ngẫu nhiên ít; node-4, node-5 mới chỉ nhận được khoảng 1/6 key lý thuyết nhưng tất cả đều cold — mỗi key mới phải load từ DB. **Nguyên nhân gốc:** (1) vnode count quá thấp (160/node) và không điều chỉnh theo công suất phần cứng — node mạnh bị đối xử ngang node yếu; (2) thêm node đột ngột mà không warm-up, biến thay đổi key thành cache stampede dồn vào DB; (3) không dùng hash slot cố định (như Redis Cluster 16384 slot) để chia miền đều. **Xử lý:** (1) Tăng vnode lên 256/node và điều chỉnh theo công suất — node mạnh gấp 2 lần cho 512 vnode, node yếu 128 vnode; (2) Thêm node từ từ với shadow traffic 10% → 50% → 100%, mỗi bước chạy ít nhất 15 phút để warm-up; (3) Chuyển sang Redis Cluster với 16384 hash slot cố định (chia đều không cần vnode, migrate theo slot); (4) Pre-fill cache cho các key hot trước khi add node. **Kết quả đo được:** sau 2 tuần, cache hit rate trở lại 93%, DB CPU xuống 38%, p99 130ms; khi scale thêm node, chỉ khoảng 1/N key di chuyển và có warm-up — không còn spike DB.

### Trả lời mẫu khi phỏng vấn
"Khi nói về consistent hashing, tôi bắt đầu bằng một ví dụ: với modulo, thêm 1 node làm gần như mọi key đổi chỗ — cache miss hàng loạt, có thể làm sập hệ thống ngay lúc scale up. Consistent hashing đặt key và node lên cùng một vòng băm, key thuộc node đầu tiên gặp theo chiều kim đồng hồ; thêm node chỉ di chuyển khoảng 1/(N+1) key. Virtual node là bước tiếp theo: mỗi node vật lý chiếm nhiều vnode (100-256) trên vòng để phân bố đều và cho phép node mạnh/yếu có khác biệt — node mạnh cho nhiều vnode hơn. Ở production, tôi từng thấy một cụm memcached với 160 vnode/node: khi thêm node có CPU mạnh hơn nhưng không điều chỉnh vnode, node đó chiếm 68% key, các node còn lại chỉ 11% — thêm node mới chỉ làm cold-load dồn vào DB, cache hit rate giảm từ 94% xuống 62%. Cách sửa là tăng vnode, điều chỉnh theo công suất node, thêm node từ từ với warm-up, hoặc dùng Redis Cluster hash slot cố định. Trade-off: vnode nhiều tăng chi phí metadata nhưng giảm lệch; vnode quá ít thì phân bố lệch. Nguyên tắc: consistent hashing giải quyết key nào đi đâu, nhưng replication, migrate, và warm-up phải được thiết kế riêng — không có thứ nào tự xử lý hết."

  > Senior tip: Khi thiết kế sharding, tôi luôn hỏi "thêm 1 node thì bao nhiêu % dữ liệu phải di chuyển và mất bao lâu". Consistent hashing cho câu trả lời ~1/N; modulo cho ~100%. Nhưng đừng dừng ở đó: rebalance an toàn còn cần giới hạn tốc độ migrate, ưu tiên replica, và kế hoạch chống cache stampede khi key vừa đổi chỗ.`,
  follow: ['Hash slot của Redis Cluster (16384 slot cố định) khác gì với consistent hashing + vnode truyền thống, và vì sao Redis chọn cách đó?', 'Khi một node chết đột ngột, làm sao đảm bảo key của nó vẫn phục vụ được (replication) và rebalancing xảy ra an toàn mà không gây overload?', 'Hot key (một key được đọc cực nhiều) có được consistent hashing giải quyết không? Nếu không, bạn xử lý hot key trên cụm sharded thế nào?'],
  refs: [{"type":"doc","title":"Redis Cluster specification (hash slots)","url":"https://redis.io/docs/latest/operate/oss_and_stack/reference/cluster-spec/"}],
},
{
  id: 'architecture-035',
  topic: 'architecture',
  level: 'senior',
  q: 'So sánh các consistency model: linearizable, sequential, causal và eventual. Giải thích từng mô hình bằng ví dụ thật trong ngân hàng/thương mại điện tử (số dư, đơn hàng, tồn kho hiển thị), và vì sao "mạnh hơn" luôn có cái giá về độ trễ/khả dụng.',
  a: `**Tóm tắt:** Consistency model (mô hình nhất quán - cam kết về việc các nút/tiến trình nhìn thấy dữ liệu theo thứ tự nào) là "hợp đồng" giữa hệ thống và người dùng. **Linearizable** (tuyến tính hóa) mạnh nhất: mọi thao tác như xảy ra tức thì tại một thời điểm, dễ suy luận nhưng tốn độ trễ và giảm khả dụng khi lỗi mạng. **Sequential** giữ cùng thứ tự quan sát, không ràng buộc thời gian thực. **Causal** chỉ giữ thứ tự nhân quả, cho phép song song độc lập. **Eventual** chỉ hứa cuối cùng hội tụ. Chọn mô hình theo tác động nghiệp vụ của việc đọc sai, không chọn theo "càng mạnh càng tốt".

### Thuật ngữ nền
- **Replica (bản sao):** nhiều nút giữ bản sao dữ liệu để tăng chịu lỗi/tốc độ đọc.
- **Latency (độ trễ):** thời gian từ lúc gửi yêu cầu đến lúc nhận kết quả.
- **Availability (khả dụng):** hệ thống vẫn trả lời (không lỗi) khi có nút/mạng hỏng.

### Phổ mô hình từ mạnh đến yếu (nhìn theo "thứ tự được bảo đảm")
~~~text
Mạnh hơn  <----------------------------------------------  Yếu hơn
Linearizable > Sequential > Causal > Read-your-writes > Eventual
   (đắt: chờ phối hợp/quorum, có thể từ chối khi partition)
   (rẻ: phản hồi nhanh, chịu được partition, nhưng đọc có thể cũ/xung đột)
~~~

### 1) Linearizable (tuyến tính hóa)
Cam kết: tồn tại một thứ tự toàn cục của mọi thao tác, và thứ tự đó **khớp thời gian thực**. Nếu thao tác A hoàn thành trước khi B bắt đầu (theo thời gian thực), mọi người thấy A trước B. Mỗi đọc trả về giá trị của ghi gần nhất đã hoàn tất.
~~~text
Ví dụ ngân hàng - chuyển tiền giữa hai tài khoản:
t1: Client chuyển 500k từ A(1tr) sang B(0)
    [txn: A=500k, B=500k] COMMIT (linearizable)
t2 (sau khi t1 hoàn tất): Client đọc số dư A -> PHẢI thấy 500k
Không bao giờ thấy trạng thái giữa chừng (A đã trừ, B chưa cộng)
~~~
**Vì sao đắt:** ghi/đọc thường phải qua leader hoặc chờ quorum (Raft, Paxos). Nếu mạng partition, nút thiểu số phải từ chối phục vụ để không trả dữ liệu cũ -> hy sinh availability (CP theo CAP).
**Khi dùng:** số dư ví, ledger, trừ tồn kho, khóa/điều phối (etcd/ZooKeeper), bất kỳ nơi "đọc sai một lần = thiệt hại tiền/pháp lý".

### 2) Sequential consistency (nhất quán tuần tự)
Cam kết: mọi tiến trình thấy **cùng một thứ tự** các thao tác, và thứ tự của mỗi tiến trình được giữ; nhưng thứ tự toàn cục **không nhất thiết khớp thời gian thực**.
~~~text
P1: write(x,1) hoàn tất lúc 10:00:01
P2: (bắt đầu lúc 10:00:02) read(x) có thể thấy 0 rồi mới thấy 1
    miễn là MỌI tiến trình đều thấy cùng kịch bản (0 rồi 1)
~~~
Khác linearizable ở ràng buộc thời gian thực. Ít hệ thực tế quảng cáo "sequential thuần"; hữu ích để hiểu nền tảng lý thuyết. Một số hệ cung cấp sequential khi đọc từ replica theo cùng thứ tự log.

### 3) Causal consistency (nhất quán nhân quả)
Cam kết: nếu {{A -> B}} (nhân quả: B đọc/nhận kết quả của A, hoặc cùng client theo thứ tự), mọi nơi thấy A trước B. Các thao tác **song song** (không liên quan) có thể được thấy theo thứ tự khác nhau ở các replica khác nhau.
~~~text
Ví dụ thương mại điện tử - bình luận trả lời:
User X: đăng "Áo này đẹp" (sự kiện A)
User Y: đọc A, trả lời "Mua ở đâu?" (sự kiện B, có nhân quả A->B)
User Z: đăng "Ship nhanh không?" (sự kiện C, song song, không liên quan A,B)

Causal đảm bảo: không ai thấy B ("Mua ở đâu?") trước A ("Áo này đẹp")
Cho phép: một replica thấy C trước A, replica khác thấy A trước C (vì C song song)
~~~
**Vì sao rẻ hơn linearizable:** không cần phối hợp toàn cục cho thao tác song song; có thể dùng metadata nhân quả (vector clock, dependency tracking). **Đổi lại:** không đủ cho bài toán cần một thứ tự toàn cục duy nhất (ví dụ hai người cùng mua món hàng cuối cùng).
**Khi dùng:** mạng xã hội, bình luận, giỏ hàng cộng tác, hệ thống "read-your-writes" mở rộng.

### 4) Eventual consistency (nhất quán cuối cùng)
Cam kết: nếu không có ghi mới, **cuối cùng** mọi replica hội tụ về cùng giá trị. Không hứa khi nào, và trong lúc hội tụ các replica có thể trả giá trị khác nhau.
~~~text
Ví dụ thương mại điện tử - hiển thị tồn kho trên trang sản phẩm:
Kho thật: 3 sản phẩm
Replica Asia (chậm 2s): hiển thị "còn 5"
Replica EU: hiển thị "còn 3"
Vài giây sau không ghi thêm: cả hai hội tụ về 3
~~~
**Khi dùng:** số lượt xem, tồn kho hiển thị (gần đúng - nhưng **trừ kho thực sự** khi đặt hàng phải linearizable/điều kiện), feed, cache, analytics.
**Cạm bẫy:** eventual cần cơ chế chống phân kỳ vĩnh viễn (anti-entropy, read repair, conflict resolution). "Last write wins" dùng timestamp máy sẽ sai khi clock skew - cần version có ý nghĩa nhân quả.

### Áp dụng ngân hàng / thương mại điện tử
| Dữ liệu | Mô hình tối thiểu hợp lý | Vì sao | Công nghệ ví dụ |
|---|---|---|---|
| Số dư, ledger, chuyển tiền | Linearizable / serializable transaction | Sai 1 đồng = sự cố pháp lý; không được đọc số dư cũ để quyết định rút | Postgres (transaction), Spanner |
| Trừ tồn kho khi chốt đơn | Linearizable (conditional write) | Tránh bán quá (oversell) | {{UPDATE .. WHERE stock>=1}}, Redis Lua atomic (với chốt DB) |
| Tồn kho hiển thị trên trang | Eventual (vài giây) | Sai hiển thị chấp nhận được; chốt đơn mới kiểm tra thật | Cache/replica, search index |
| Lịch sử đơn hàng của chính user | Read-your-writes | User vừa đặt phải thấy đơn của mình | Đọc primary sau ghi, session token |
| Giỏ hàng | Causal / read-your-writes | Thêm rồi xem phải thấy; merge concurrent giữa thiết bị | DynamoDB, versioned cart |
| Feed khuyến mãi | Eventual | Trễ vài giây không ảnh hưởng | CDN, replica, cache |

### Trên production
- **Triệu chứng chọn sai mô hình:** (quá yếu) user thấy "đặt hàng thành công" nhưng mở lịch sử không có (chưa read-your-writes); bán quá tồn kho (trừ kho eventual). (quá mạnh) p99 ghi cao, cụm từ chối ghi khi mất 1 node/quorum, latency cross-region lớn.
- **Cách đo:** đo replication lag (Postgres {{pg_stat_replication}}: {{write_lag, flush_lag, replay_lag}}; metric {{seconds_behind_master}}); tỉ lệ đọc stale (so sánh version); lỗi timeout do chờ quorum.
- **Tuning/cấu hình có thật:** Postgres đọc replica chấp nhận lag -> route đọc quan trọng về primary hoặc dùng {{synchronous_commit}} + synchronous standby (đánh đổi latency). Cassandra có tunable consistency per query ({{ONE/QUORUM/ALL}}). DynamoDB có {{ConsistentRead}}. Luôn ghi rõ trong code/query: đọc này chấp nhận stale bao nhiêu.
- **Nguyên tắc:** vẽ bảng dữ liệu và gắn mô hình cho từng loại; "toàn hệ thống linearizable" hoặc "toàn hệ thống eventual" đều thường là sai.

### Ví dụ đời thực
  Một sàn thương mại điện tử (5 triệu đơn/ngày) dùng read-your-writes cho trang xác nhận đơn hàng: sau khi tạo đơn, client load lại chi tiết đơn #123 từ replica để hiển thị "Đơn #123 thành công". Buổi tối 11/11, traffic tăng 5 lần và replication lag trên Postgres replica p99 tăng từ 80ms lên 2,2 giây do WAL accumulation. **Triệu chứng:** khoảng 8% client thấy trang "404 - Không tìm thấy đơn" sau khi bấm "Đặt hàng", rồi load lại thì thấy đơn. Hậu quả: nhiều khách bấm "Đặt hàng" lần thứ hai (vì nghĩ đơn chưa được tạo), tạo ra đơn trùng — dù đã có idempotency key, nhưng key chỉ prevent duplicate theo client; khách hàng dùng thiết bị mới hoặc mất session sẽ tạo đơn mới. metric {{404_after_create}} tăng từ 0,3% lên 8%. **Điều tra:** {{pg_stat_replication}} cho thấy {{replay_lag}} p99 = 2,2s; log ứng dụng ghi "order not found" trong khoảng 2s sau khi ghi commit. **Nguyên nhân gốc:** read-your-writes được triển khai bằng cách route đọc qua replica — không có cơ chế đảm bảo client thấy ghi của mình. Khi replication lag tăng, client đọc replica chưa thấy đơn vừa tạo. **Xử lý:** (1) Thay vì load lại, trả thẳng đơn trong response của request tạo đơn (không cần đọc lại); (2) Nếu phải đọc lại, route đọc qua primary trong 5 giây sau ghi, hoặc gửi kèm version và follower phải chờ replica bắt kịp; (3) Tăng replica CPU và WAL sender; (4) Thêm idempotency key lưu theo user (không chỉ theo client session) để bấm lại không tạo đơn trùng. **Kết quả đo được:** {{404_after_create}} về 0%; không có đơn trùng do double-click; p99 load chi tiết đơn giảm từ 2,2s xuống 180ms (đọc primary).

### Trả lời mẫu khi phỏng vấn
  "Khi nói về consistency model, tôi không dừng ở định nghĩa mà đi vào từng loại dữ liệu trong một luồng đặt hàng. Linearizable: mạnh nhất, mọi thao tác như xảy ra tức thì — dùng cho số dư ví và trừ tồn kho khi chốt đơn, nhưng phải trả giá bằng độ trễ và giảm khả dụng khi partition. Sequential: mọi tiến trình thấy cùng một thứ tự, không nhất thiết khớp thời gian thực — ít dùng trong thực tế. Causal: giữ thứ tự nhân quả, cho phép song song — phù hợp giỏ hàng cộng tác và bình luận mạng xã hội. Eventual: cuối cùng hội tụ, dùng cho tồn kho hiển thị và feed. Ở production tôi từng gặp read-your-writes bị fail trên replica khi replication lag tăng lên 2,2s vào 11/11 — 8% client thấy 404 sau khi đặt hàng. Cách sửa là trả thẳng đơn trong response thay vì load lại, hoặc route đọc qua primary trong vài giây sau ghi. Trade-off: linearizable đắt nhưng cần cho tiền; eventual rẻ nhưng phải có cơ chế anti-entropy và conflict resolution. Nguyên tắc: không bao giờ chọn 'toàn hệ thống linearizable' hay 'toàn hệ thống eventual' — chọn theo tác động nghiệp vụ của việc đọc sai."

  > Senior tip: Trong phỏng vấn, đừng chỉ liệt kê định nghĩa. Hãy lấy một luồng thật (đặt hàng: giữ chỗ -> trừ kho -> ghi đơn -> hiện lịch sử -> cập nhật trang sản phẩm) và chỉ ra mỗi bước cần consistency nào. Đó là cách chứng minh bạn chọn mô hình theo nghiệp vụ, không theo giáo trình.`,
  follow: ['Read-your-writes và monotonic reads là session guarantee; bạn triển khai read-your-writes khi đọc đi qua replica (replication lag) bằng cách nào?', 'Tại sao last-write-wins (LWW) dùng timestamp máy nguy hiểm trong eventual consistency, và CRDT/version vector cải thiện điều gì?', 'Một hệ thống có thể cung cấp linearizable cho một phần dữ liệu và eventual cho phần khác trong cùng kiến trúc không? Ranh giới và rủi ro là gì?'],
  refs: [{"type":"doc","title":"Jepsen: Consistency Models","url":"https://jepsen.io/consistency"}],
},
{
  id: 'architecture-036',
  topic: 'architecture',
  level: 'lead',
  q: 'Thundering herd, cache stampede và retry storm: ba hiện tượng khuếch đại tải này khác nhau thế nào, cơ chế gây ra từng cái ra sao, và bạn thiết kế phòng chống bằng request coalescing, jitter, circuit breaker, load shedding như thế nào trên production?',
  a: `**Tóm tắt:** **Thundering herd** (đàn thú dồn ập - nhiều tiến trình cùng thức dậy tranh một tài nguyên), **cache stampede** (cache hết hạn -> nhiều request cùng đổ về DB), và **retry storm** (lỗi -> mọi client cùng retry -> làm hệ thống tệ hơn) là ba dạng **khuếch đại tải** (load amplification): một sự kiện nhỏ tạo ra N lần công việc. Phòng chống dựa trên 4 kỹ thuật bổ trợ nhau: **request coalescing** (gộp yêu cầu trùng), **jitter** (ngẫu nhiên hóa thời điểm), **circuit breaker** (ngắt mạch khi downstream lỗi), **load shedding** (chủ động từ chối bớt khi quá tải).

### Thuật ngữ nền
- **Downstream:** hệ thống/phụ thuộc mà bạn gọi tới (DB, service khác). **Upstream:** nơi gọi vào bạn.
- **Cache miss:** tra cache không có dữ liệu, phải lấy từ nguồn gốc (thường là DB).
- **Backoff:** chờ lâu dần giữa các lần retry. **Exponential backoff:** thời gian chờ tăng theo lũy thừa (1s, 2s, 4s...).

### 1) Cache stampede - cơ chế từng bước
~~~text
Bối cảnh: key "hot:product:99" được 5.000 req/s đọc, cache TTL hết hạn lúc t=10s.

t=9.999  5.000 req/s đều HIT cache -> DB 0 req/s
t=10.000 TTL hết, key bị xóa
t=10.001 5.000 req đồng thời MISS cache
         -> cả 5.000 req cùng gọi DB: SELECT * FROM product WHERE id=99
         -> DB QPS spike 0 -> 5.000 (hoặc hơn do pile-up)
         -> DB chậm/sập -> các req timeout -> user lỗi hàng loạt
t=10.050 một req may mắn lấy được từ DB, set lại cache
         -> nhưng 4.999 req khác đã gửi/đang gửi query
~~~
Đây là khuếch đại: 1 key hết hạn -> 5.000 truy vấn DB giống hệt nhau.

### 2) Thundering herd (tổng quát)
Xảy ra khi nhiều worker chờ cùng một tín hiệu và cùng thức dậy: ví dụ hàng nghìn process chờ cùng lock/file descriptor (cấp OS), hoặc hàng nghìn client được hẹn "retry sau 30s" và cùng retry đúng giây 30. Trong kiến trúc dịch vụ, stampede là một dạng herd; herd còn gặp ở: leader election timeout trùng nhau (nếu không random), cron job cùng giờ 00:00, reconnect đồng loạt sau khi DB phục hồi.

### 3) Retry storm - cơ chế từng bước
~~~text
Bối cảnh: Service A gọi Service B (đang quá tải, p99 5s, nhiều timeout).
Mỗi request A có retry 3 lần, không backoff/jitter.

t=0   1.000 req/s tới A -> gọi B -> B quá tải, 60% timeout
t=1s  600 req timeout + 600 retry ngay lập tức = 1.600 req/s tới B
      -> B càng quá tải, 80% timeout
t=2s  1.280 timeout + retry -> ~2.300 req/s -> B sập hoàn toàn
A cũng cạn connection/thread vì chờ B -> A sập theo (cascade failure)
~~~
Khuếch đại: lỗi một phần -> retry biến thành tấn công từ chính hệ thống (self-DDoS).

### Phòng chống 1: Request coalescing (gộp yêu cầu)
Chỉ cho **một** request đi load dữ liệu khi cache miss; các request khác chờ kết quả đó (singleflight).
~~~java
// Ý tưởng (dùng lock per-key, ví dụ Redis SET NX hoặc local map)
String key = "product:99";
Product v = cache.get(key);
if (v != null) return v;

String lockKey = "lock:" + key;
// NX: chỉ set nếu chưa có; PX: TTL lock ngắn (tránh deadlock nếu holder chết)
boolean won = redis.setIfAbsent(lockKey, "1", Duration.ofMillis(3000));
if (won) {
  try {
    Product p = db.load(99);               // chỉ 1 req chạm DB
    long ttl = 600 + rand.nextInt(60);      // jitter TTL (xem dưới)
    cache.set(key, p, Duration.ofSeconds(ttl));
    return p;
  } finally { redis.delete(lockKey); }
} else {
  Thread.sleep(50);                         // chờ ngắn rồi đọc lại cache
  return getWithCoalescing(key);            // hoặc trả stale nếu có
}
~~~
Lưu ý: cần TTL cho lock; có thể dùng thư viện local singleflight (per-instance) + cache L1 để giảm round-trip Redis. Biến thể: **stale-while-revalidate** - trả dữ liệu cũ hết hạn ngay, một luồng nền làm mới.

### Phòng chống 2: Jitter (ngẫu nhiên hóa)
Jitter phá sự đồng bộ.
~~~text
TTL cache: base=600s -> ttl = 600 + random(0,60) giây
  => 10.000 key không hết hạn cùng lúc (chống avalanche)

Retry backoff + full jitter (công thức phổ biến):
  base=1s, cap=30s, attempt=n
  sleep = random(0, min(cap, base * 2^n))
  attempt1: random(0,2s), attempt2: random(0,4s), attempt3: random(0,8s)...
  => các client dàn đều, không dồn lại cùng thời điểm

Election/reconnect timeout: 150ms + random(0,150ms) (Raft dùng cách này)
~~~
Bảng so sánh backoff (tư duy): không backoff -> storm; backoff cố định -> herd theo nhịp; exponential + jitter -> dàn đều.

### Phòng chống 3: Circuit breaker (ngắt mạch)
Ngắt mạch (giống cầu dao điện): khi downstream lỗi quá ngưỡng, **ngừng gọi** một lúc để downstream hồi phục, thay vì tiếp tục dội request.
~~~text
Trạng thái:
  CLOSED (đóng, bình thường): gọi đi; đếm lỗi
    -> tỉ lệ lỗi vượt ngưỡng (ví dụ 50% trên 20 req) => OPEN
  OPEN (mở, ngắt): từ chối ngay (fail fast) hoặc trả fallback, KHÔNG gọi downstream
    -> sau thời gian chờ (ví dụ 30s) => HALF_OPEN
  HALF_OPEN (thử): cho vài req thăm dò
    -> thành công => CLOSED; thất bại => OPEN
~~~
Thư viện Java thực tế: **Resilience4j** ({{CircuitBreaker}}, {{Bulkhead}}, {{Retry}}, {{RateLimiter}}). Kết hợp: retry chỉ với lỗi tạm thời và **đặt trong** circuit breaker (không retry khi mạch mở); đặt timeout ngắn để không giữ thread.

### Phòng chống 4: Load shedding (chủ động cắt tải)
Khi quá tải, **từ chối bớt** request có kiểm soát để phần còn lại được phục vụ đúng, thay vì cố gắng xử lý hết rồi sập cả cụm.
~~~text
Cách làm (từ rẻ đến tinh vi):
- Giới hạn concurrency/bulkhead: tối đa 50 req đồng thời tới DB; vượt -> 503
- Hàng đợi có giới hạn: queue đầy -> từ chối (không xếp hàng vô hạn)
- Từ chối theo ưu tiên: giữ request thanh toán, cắt request gợi ý/analytics
- Shed theo độ trễ: nếu p99 nội bộ vượt ngưỡng, trả 503 + Retry-After
- Rate limit ở gateway (token bucket) như lớp ngoài cùng
~~~
Nguyên tắc: {{503 nhanh}} + {{Retry-After}} (kèm jitter phía client) tốt hơn {{timeout chậm}} sau 30s, vì timeout giữ tài nguyên (thread, connection) lâu hơn.

### Phối hợp trên production
~~~text
Client -> [Rate limit + jitter retry] -> Gateway -> [Bulkhead + Timeout]
       -> Service [Circuit breaker -> Downstream]
       -> Cache [Coalescing + TTL jitter + stale fallback] -> DB
~~~
Mỗi lớp chặn một dạng khuếch đại; không có lớp nào thay thế được tất cả.

### Trên production
- **Triệu chứng:** DB QPS spike nhọn theo chu kỳ TTL; latency tăng đột biến rồi lan sang service khác (cascade); metric retry count tăng cùng lúc error rate; CPU/connection pool cạn dù traffic user không tăng tương ứng.
- **Cách đo:** dashboard cache hit/miss theo thời gian (stampede thấy miss spike nhọn), DB QPS, tỉ lệ retry, trạng thái circuit breaker (Resilience4j expose metric), tỉ lệ 503 do shedding. So sánh {{traffic vào}} vs {{traffic ra downstream}} - nếu ra >> vào là đang khuếch đại.
- **Tuning/cấu hình có thật:** Resilience4j {{CircuitBreakerConfig}} ({{failureRateThreshold}}, {{waitDurationInOpenState}}, {{slidingWindowSize}}), {{RetryConfig}} ({{maxAttempts}}, {{waitDuration}}, {{IntervalFunction.ofExponentialRandomBackoff}}), {{BulkheadConfig}} ({{maxConcurrentCalls}}). DB connection pool (HikariCP {{maximumPoolSize}}) là bulkhead tự nhiên - đừng đặt quá lớn.
- **Runbook:** khi storm xảy ra, ưu tiên (1) bật shedding/rate limit hạ traffic vào, (2) mở circuit breaker thủ công nếu cần bảo vệ downstream, (3) kiểm tra retry config của caller, (4) sau khi ổn mới tắt dần.

### Ví dụ đời thực
  Một nền tảng giao tiếp nội bộ (chat, 5 triệu user) dùng circuit breaker Resilience4j giữa notification-service và user-profile-service (lấy thông tin người dùng để hiển thị sender name). Buổi sáng, user-profile-service deploy version mới với một thay đổi ORM: query lấy profile thêm một JOIN bảng settings, làm truy vấn tăng từ 10ms lên 120ms. **Triệu chứng:** notification-service p99 tăng từ 80ms lên 1,2 giây; metric {{resilience4j_circuitbreaker_state}} của breaker kết nối user-profile chuyển từ CLOSED sang OPEN trong 3 phút; hàng chục nghìn notification bị delay (OTP xác nhận đăng nhập trễ 5 phút); dashboard cho thấy {{retry_count}} tăng từ bình thường ~50/giờ lên 12.000/giờ. **Điều tra:** breaker mở sau khi tỉ lệ timeout vượt 50% trên sliding window 20 request. Mỗi notification retry 3 lần với exponential backoff — nhưng breaker đã mở, retry vẫn chạy (cấu hình sai: retry không check breaker state). Retry storm: notification retry → user-profile càng quá tải → timeout tăng → retry thêm. **Nguyên nhân gốc:** (1) Circuit breaker mở nhưng retry vẫn chạy, làm tăng tải thay vì giảm; (2) Deploy làm query chậm đột ngột không có rollback tự động. **Xử lý:** (1) Sắp xếp retry trong circuit breaker: khi breaker OPEN, retry bị bỏ qua (fail fast); (2) Thêm timeout 200ms cho call user-profile (thay vì dùng default indefinitely); (3) Deploy mới thêm feature flag để rollback nhanh; (4) Thêm fallback: khi profile-service lỗi, notification vẫn gửi với sender name = "Hệ thống" thay vì bỏ. **Kết quả đo được:** sau 10 phút, breaker đóng lại; notification p99 trở về 90ms; retry_count giảm về 100/giờ; không có OTP nào bị mất.

### Trả lời mẫu khi phỏng vấn
  "Ba hiện tượng này đều là khuếch đại tải — một sự kiện nhỏ tạo ra N lần công việc. Cache stampede là cache hết hạn, hàng nghìn request cùng miss và cùng gọi DB; thundering herd là tổng quát khi nhiều worker cùng thức dậy tranh một tài nguyên (leader election, reconnect, cron 00:00); retry storm là lỗi → mọi client cùng retry → làm hệ thống tệ hơn. Phòng chống: request coalescing (singleflight — chỉ 1 request đi load, các request khác chờ), jitter (TTL ngẫu nhiên, exponential backoff + full jitter), circuit breaker (ngắt mạch khi downstream lỗi — CLOSED → OPEN → HALF_OPEN), và load shedding (từ chối bớt khi quá tải — bulkhead, hàng đợi giới hạn, 503 + Retry-After). Ở production tôi từng thấy retry storm khi deploy làm query chậm: circuit breaker mở nhưng retry vẫn chạy, tạo thành self-DDoS. Cách sửa là retry phải check breaker state, thêm timeout ngắn, và fallback trả dữ liệu cũ. Trade-off: không có lớp nào thay thế tất cả — mỗi lớp blocked một dạng khuếch đại khác nhau."

  > Senior tip: Retry là liều thuốc có thể thành độc dược. Quy tắc tôi dùng: chỉ retry lỗi **tạm thời** (timeout, 503, connection reset), không retry lỗi **xác định** (400, 401, logic fail), luôn có backoff+jitter+giới hạn số lần, và tổng thời gian retry phải nằm trong deadline của request gốc. Nếu mọi tầng đều retry mù, một lỗi 1% có thể nhân lên thành outage 100%.`,
  follow: ['Làm sao phân biệt trên dashboard một spike do traffic thật tăng (user đông) với spike do cache stampede hoặc retry storm?', 'Bulkhead pattern (cô lập tài nguyên) bổ sung cho circuit breaker như thế nào, và bạn chia bulkhead theo gì (theo downstream, theo loại request)?', 'Stale-while-revalidate trả dữ liệu cũ có rủi ro nghiệp vụ gì? Những loại dữ liệu nào tuyệt đối không được dùng cơ chế này?'],
},
{
  id: 'architecture-037',
  topic: 'architecture',
  level: 'lead',
  q: 'Ở góc độ lead, bạn chọn cơ chế phối hợp phân tán nào cho từng bài toán: Redis lock, etcd/ZooKeeper lease, hay ràng buộc DB? Phân tích trade-off qua case leader election của scheduler, claim job, và cập nhật tồn kho - kèm cơ chế lease/heartbeat/fencing end-to-end.',
  a: `**Tóm tắt:** Không có "distributed lock tốt nhất", chỉ có cơ chế **đủ đúng** cho từng mức hậu quả. Lead cần chọn theo câu hỏi: "nếu hai tiến trình cùng chạy, thiệt hại là gì?". Trùng job báo cáo (gây tốn CPU) chấp nhận best-effort; trùng trừ tiền là thảm họa - phải có fencing ở tầng dữ liệu. Ba họ công cụ: **Redis lock** (rẻ, nhanh, best-effort), **etcd/ZooKeeper** (consensus, lease + session, phù hợp leader election/coordination), **DB constraint/transaction** (nguồn sự thật, fencing tự nhiên bằng điều kiện/version).

### Khung ra quyết định
~~~text
Hậu quả nếu chạy trùng?
  |-- Nhẹ (tốn tài nguyên, gửi mail trùng có thể chấp nhận)
  |     -> Redis SET NX PX + handler idempotent
  |-- Trung bình (dữ liệu sai nhưng sửa/đối soát được)
  |     -> etcd/ZooKeeper lease HOẶC DB claim (SKIP LOCKED) + idempotent
  |-- Nặng (mất tiền, oversell, vi phạm hợp đồng)
        -> KHÔNG tin lock phân tán thuần
           Dùng: transaction DB + conditional write + unique/version (fencing)
~~~

### Case 1: Leader election cho scheduler (chỉ 1 node điều phối cron)
Mục tiêu: trong 5 instance scheduler, chỉ 1 instance "materialize" cron thành job mỗi phút. Nếu hiếm khi 2 instance cùng chạy, job có {{UNIQUE(name, scheduled_at)}} nên chỉ 1 insert thành công -> chấp nhận được.
**Chọn:** etcd lease hoặc DB advisory/lease table.
~~~seq
title: Leader election bằng lease (etcd/DB)
actors: S1 | S2 | etcd
S1 -> etcd: grant lease TTL=15s -> leaseId=7
S1 -> etcd: put leader=S1 với leaseId=7 (thành công nếu key trống)
S1 -> S1: Trở thành leader, materialize cron
S1 -> etcd: keepAlive leaseId=7 (gia hạn mỗi 5s)
S1 -> etcd: keepAlive leaseId=7 (heartbeat tiếp)
note S2: S2 thử put leader -> thất bại, watch key leader
S1 -> S1: S1 chết (không keepAlive)
etcd -> etcd: Lease 7 hết TTL -> xóa key leader
etcd -> S2: Watch notify: leader key bị xóa
S2 -> etcd: put leader=S2 với lease mới -> thành leader
~~~
**Cơ chế lease:** lease là "hợp đồng có hạn"; sống sót nhờ heartbeat gia hạn. Nếu leader treo (GC pause dài, mạng tách), heartbeat không đến -> lease hết -> leader bị thu hồi. Đây là **fail-safe** (an toàn khi im lặng) nhưng có cửa sổ: trong khoảng pause, leader cũ có thể vẫn đang hành động.
**Fencing:** gắn {{leaseId}}/revision tăng dần vào hành động ghi (ví dụ ghi job kèm {{fence = leaseRevision}}; consumer kiểm tra). etcd cung cấp {{mod_revision}}/transaction compare-and-swap tự nhiên.

### Case 2: Claim job từ hàng đợi trong Postgres
Mục tiêu: 20 worker lấy job, không ai lấy trùng.
~~~sql
-- Mỗi worker chạy trong transaction ngắn (chỉ claim)
UPDATE job
   SET status = 'RUNNING',
       worker_id = 'w7',
       lease_until = now() + interval '5 minutes',
       attempts = attempts + 1,
       fence = fence + 1            -- fencing token tăng dần
 WHERE id = (
   SELECT id FROM job
    WHERE status = 'PENDING' AND next_run_at <= now()
    ORDER BY next_run_at
    LIMIT 1
    FOR UPDATE SKIP LOCKED          -- bỏ qua hàng đang bị lock
 )
 RETURNING *;
~~~
Worker xử lý xong ghi kết quả **có điều kiện fencing**:
~~~sql
UPDATE job SET status = 'DONE', result = ?
 WHERE id = ? AND worker_id = 'w7' AND fence = ? AND status = 'RUNNING';
-- affected rows = 0 => worker đã mất lease, bỏ kết quả (stale)
~~~
**Vì sao tốt:** không cần Redis/etcd; DB vừa là queue vừa là nguồn fencing. {{SKIP LOCKED}} cho throughput cao (worker không chờ nhau). Lease {{lease_until}} + reaper xử lý worker chết.

### Case 3: Cập nhật tồn kho (không dùng lock phân tán)
~~~sql
-- Đúng: conditional write nguyên tử trong DB, không race condition
UPDATE inventory
   SET available = available - 1
 WHERE sku = 'SKU-1' AND available >= 1;
-- affected rows = 1 => giữ hàng thành công
-- Không Redis lock, không lo GC pause, không lo clock
~~~
Nếu phải phối hợp nhiều hệ thống (giữ kho ở inventory-service, trừ ví ở payment-service): dùng **saga + idempotency + outbox**; mỗi bước tự bảo vệ bằng ràng buộc DB cục bộ và bút toán bù (compensate). Distributed lock bao trùm saga là anti-pattern (giữ lock qua network call = mong manh).

### So sánh nhanh
| Tiêu chí | Redis lock (SET NX PX) | etcd/ZooKeeper lease | DB conditional/row lock |
|---|---|---|---|
| Độ trễ | Rất thấp (sub-ms) | Thấp-vừa (ms, qua consensus) | Vừa (ms, phụ thuộc txn) |
| Đúng đắn khi client treo | Yếu nếu không fencing | Tốt hơn (session/lease) + fencing | Tốt (txn gắn kết nối; fencing bằng điều kiện) |
| Chịu lỗi hạ tầng | Mất lock nếu failover async | Chịu được nếu còn quorum | Theo HA của DB |
| Vận hành | Đơn giản | Cụm consensus cần chăm sóc | Tận dụng DB sẵn có |
| Phù hợp | Best-effort dedup | Leader election, coordination | Dữ liệu nghiệp vụ là nguồn sự thật |

### Trên production
- **Triệu chứng chọn sai:** dùng Redis lock cho tồn kho -> oversell hiếm gặp khó tái hiện; dùng etcd cho mọi thứ -> độ trễ tăng, etcd thành bottleneck; giữ {{SELECT FOR UPDATE}} lâu qua HTTP call -> deadlock/connection pool cạn.
- **Cách đo:** thời gian giữ lock/lease; số lần fencing từ chối (stale writer) - con số > 0 là bình thường nhỏ, tăng vọt là có worker treo; tỉ lệ job chạy trùng; p99 transaction DB.
- **Tuning/cấu hình có thật:** lease TTL đủ lớn hơn chu kỳ heartbeat (thường heartbeat = TTL/3); timeout xử lý < TTL hoặc có cơ chế checkpoint/fencing; Postgres {{lock_timeout}}, {{statement_timeout}} để tránh giữ lock vô hạn. Với scheduler dùng DB, index {{(status, next_run_at)}} partial cho PENDING.
- **Review thiết kế (lead):** với mỗi "lock" trong sơ đồ, đặt câu hỏi "fencing ở đâu, idempotency ở đâu, hậu quả nếu trùng là gì". Nếu câu trả lời là "Redis lo", đó là rủi ro cần ghi nhận.

### Ví dụ đời thực
  Một nền tảng logistics (500.000 đơn/ngày) dùng Redis lock (SET NX PX 30000) để đảm bảo chỉ một worker cập nhật trạng thái đơn hàng khi chuyển từ PAID → SHIPPED. Buổi tối, một lần Full GC trên worker node kéo dài 45 giây do heap pressure. Worker A acquire lock lúc 21:00:00, bắt đầu xử lý; lock TTL 30s; Full GC 45s; lock hết hạn lúc 21:00:30; worker B acquire lock, đọc đơn hàng #ABC123 (trạng thái PAID) và chuyển sang SHIPPED; worker B ghi kết quả lúc 21:00:42; worker A tỉnh dậy lúc 21:00:45, vẫn tưởng giữ lock, và ghi lại đơn hàng #ABC123 sang DELIVERED — ghiền kết quả của B. Kết quả: đơn hàng #ABC123 được ghi nhận là DELIVERED nhưng thực tế chưa giao hàng; khách hàng nhận hàng trước khi hệ thống ghi nhận; đối tác logistics tính phí sai. **Triệu chứng:** log ứng dụng ghi hai lần ghi trạng thái cho cùng đơn; metric {{lock.held_seconds}} có điểm nhảy lên 45s; khách hàng than "hệ thống nói đã giao nhưng không có hàng". **Điều tra:** kiểm tra GC log (G1GC, heap 4GB) — promotion failure; Redis key {{lock:order:ABC123}} không có fencing token; bảng {{orders}} không có cột version hoặc unique constraint để reject stale write. **Nguyên nhân gốc:** Redis lock chỉ là mutual exclusion best-effort, không có fencing; worker bị GC pause vượt TTL mà không biết. **Xử lý:** (1) Thêm cột {{version BIGINT}} vào {{orders}} và dùng conditional update: {{UPDATE orders SET status='DELIVERED', version=version+1 WHERE id=? AND version=? AND status='SHIPPED'}}; (2) Khi worker A tỉnh dậy, affected rows = 0 → biết bị stale và rollback; (3) Thêm fencing token: mỗi acquire lock lấy {{INCR fence}} từ Redis, ghi đi kèm; DB reject nếu fence nhỏ hơn đã thấy; (4) Điều chỉnh GC: giảm heap xuống 2GB, {{-XX:MaxGCPauseMillis=200}}, tách heavy job ra process riêng; (5) Thêm cảnh báo khi {{lock.held_seconds > 20}}. **Kết quả đo được:** sau 2 tuần không có đơn nào bị ghi overwrite; fencing từ chối trung bình 0,5 lần/giờ (các trường hợp tranh chấp còn lại); Full GC p99 giảm từ 45s xuống 150ms.

### Trả lời mẫu khi phỏng vấn
  "Lead không cần biết mọi loại lock — cần biết khi nào dùng cái nào. Khung ra quyết định của tôi dựa trên hậu quả nếu hai tiến trình cùng chạy: nhẹ (job báo cáo, gửi mail trùng) → Redis SET NX PX + handler idempotent; trung bình (dữ liệu sai nhưng sửa được) → etcd/ZooKeeper lease hoặc DB claim SKIP LOCKED + idempotent; nặng (mất tiền, oversell) → không tin lock phân tán thuần, dùng transaction DB + conditional write + fencing. Ở production tôi từng thấy Redis lock cho đơn hàng: worker bị Full GC 45s vượt TTL 30s, worker mới vào ghi, worker cũ tỉnh dậy ghi overwrite — đơn hàng được ghi nhận DELIVERED nhưng chưa giao. Cách sửa là thêm version column và conditional update: {{UPDATE ... WHERE version=?}}; nếu affected rows = 0 thì biết bị stale. Fencing token (số tăng dần từ Redis INCR) được gửi kèm ghi; DB reject nếu token nhỏ hơn đã thấy. Trade-off: Redis lock nhanh và dễ nhưng không bảo vệ được client treo; etcd lease có session và heartbeat, an toàn hơn nhưng thêm cụm consensus; DB constraint là nguồn sự thật, chậm nhất nhưng đúng đắn. Nguyên tắc: đường dẫn tiền/dữ liệu quan trọng phải tự bảo vệ ở tầng lưu trữ — không bao giờ chỉ tin lock phân tán."

  > Senior tip: Lead giỏi không phải người biết nhiều loại lock, mà là người **thiết kế để không cần lock** cho đường dẫn tiền/dữ liệu quan trọng: dùng conditional write, unique constraint, single-writer partition, hoặc idempotency key. Lock phân tán dành cho coordination (ai là leader, ai claim việc) - còn correctness của dữ liệu phải tự bảo vệ ở tầng lưu trữ.`,
  follow: ['Trong Kubernetes, leader election (client-go) dùng Lease object trên API server; cơ chế này ánh xạ thế nào sang lease/heartbeat/fencing bạn vừa mô tả?', 'Khi worker bị GC pause vượt lease TTL rồi tỉnh dậy, ngoài fencing token ở DB, bạn cần xử lý gì với side effect bên ngoài (gọi API payment, gửi email)?', 'Bạn thuyết phục team chuyển từ "Redis lock bọc quanh logic trừ kho" sang "conditional update + idempotency" như thế nào (rủi ro, migration, kiểm chứng)?'],
},
{
  id: 'architecture-038',
  topic: 'architecture',
  level: 'lead',
  q: 'Giải thích linearizability sâu hơn ở mức cơ chế: read/write quorum, leader-based read, và vì sao đọc từ replica có thể trả dữ liệu cũ dù ghi đã "thành công"? Phân tích đánh đổi latency vs correctness trong ngân hàng (đọc số dư) và thương mại điện tử (xác nhận đơn) qua từng lựa chọn kỹ thuật.',
  a: `**Tóm tắt:** Một ghi được "thành công" chưa chắc mọi nơi đọc thấy ngay - điều đó phụ thuộc vào **đường đọc** và **mô hình nhất quán**. Linearizable (tuyến tính hóa - đọc luôn thấy ghi mới nhất đã hoàn tất theo thời gian thực) đạt được bằng cách buộc đọc và ghi đi qua cùng một thứ tự toàn cục (leader/quorum có phối hợp). Đọc từ replica rẻ và nhanh nhưng có thể stale (cũ) do replication lag. Lead phải chọn theo tác động nghiệp vụ: đọc số dư để quyết định cho rút tiền phải linearizable; hiển thị "đơn đã đặt" có thể read-your-writes; danh sách gợi ý chỉ cần eventual.

### Cơ chế 1: Leader-based replication và cửa sổ stale
~~~seq
title: Ghi thành công nhưng đọc replica bị stale
actors: ClientW | Leader | F1(replica) | ClientR
ClientW -> Leader: write(x=10)
Leader -> Leader: ghi local log/index
Leader -> F1: replicate x=10 (async)
Leader -> ClientW: OK (ack sau khi leader ghi / hoặc sau quorum)
note F1: F1 chưa kịp áp dụng (replication lag 200ms)
ClientR -> F1: read(x)
F1 -> ClientR: x=5 (STALE - cũ)
F1 -> F1: áp dụng x=10 (trễ 200ms)
~~~
**"Ghi thành công" nghĩa là gì** phụ thuộc cấu hình ack:
- Ack khi leader ghi: nhanh nhất, nhưng leader chết trước khi replicate -> mất ghi đã ack.
- Ack khi quorum (đa số) ghi: an toàn hơn (ghi sống qua mất leader), nhưng đọc từ follower ngoài quorum vẫn có thể stale cho đến khi follower đuổi kịp.

### Cơ chế 2: Quorum read/write (R + W > N)
Với N replica, ghi cần W ack, đọc hỏi R replica, chọn giá trị có version mới nhất.
~~~text
N=3 (replica A,B,C), mỗi bản ghi có version tăng dần
Chọn W=2, R=2 => R+W=4 > 3 => giao nhau ít nhất 1 replica

Ghi x=10 (version v3): ghi vào A,B thành công (W=2) -> ack
Đọc: hỏi B,C (R=2) -> nhận (B: v3=10), (C: v2=5) -> chọn v3=10 (mới nhất)

Vì sao an toàn? Tập ghi {A,B} và tập đọc {B,C} giao nhau tại B,
B đã có v3 nên đọc thấy v3.
~~~
**Cạm bẫy thực tế:**
- Cần **version/timestamp đáng tin** để chọn "mới nhất" (không dùng wall clock lệch - xem clock skew; dùng version đơn điệu từ leader/log index).
- Chưa chắc linearizable theo thời gian thực trong mọi triển khai (xung đột concurrent, repair). Dynamo-style quorum thường cho eventual/tunable; linearizable cần thêm (ví dụ read repair cẩn thận, hoặc giao thức kiểu Raft).
- {{W=1}} (ghi nhanh) + {{R=1}} (đọc nhanh): {{1+1 <= 3}} -> có thể đọc stale. Nhanh nhưng yếu.

### Cơ chế 3: Linearizable read qua leader/consensus
~~~text
Cách A - Đọc qua leader: mọi read gửi tới leader -> leader biết commitIndex mới nhất.
  Đắt: leader thành bottleneck đọc; latency cao nếu client xa leader.

Cách B - ReadIndex (Raft): follower hỏi leader "commitIndex hiện tại là bao nhiêu?",
  chờ local apply đến index đó rồi trả đọc. Không chuyển dữ liệu qua leader,
  nhưng vẫn 1 round-trip tới leader để xác nhận.

Cách C - Lease read: leader giữ "lease" (cam kết còn là leader trong khoảng thời gian
  an toàn dựa trên clock/heartbeat). Trong lease, leader đọc local không cần hỏi quorum.
  Rủi ro: nếu giả định clock/lease sai, có thể đọc stale trong trường hợp hiếm.

Cách D - Đọc follower kèm version tối thiểu (read-your-writes):
  client gửi kèm "tôi cần thấy ít nhất version v3 (vừa ghi)";
  follower chờ đuổi kịp v3 rồi trả lời. Không linearizable toàn cục, nhưng đủ cho session.
~~~

### Áp dụng ngân hàng: đọc số dư để quyết định rút tiền
~~~text
Kịch bản nguy hiểm (stale read):
  Số dư thật = 500k (vừa rút còn 500k, ghi đã commit trên leader)
  App đọc số dư từ replica stale -> thấy 1.000k
  App cho phép rút 800k -> ghi lệnh rút
  -> Nếu không có ràng buộc DB: overspend. Nếu có: lệnh rút bị từ chối muộn (UX tệ)

Thiết kế đúng (chọn 1 hoặc kết hợp):
  1. Đọc số dư phục vụ quyết định ghi -> đọc linearizable (primary/ReadIndex)
  2. Quyết định cho phép rút nằm trong DB: 
     UPDATE account SET balance = balance - 800000
      WHERE id=? AND balance >= 800000;  (fencing bằng điều kiện)
     -> kể cả đọc hiển thị stale, thao tác tiền vẫn đúng
  3. Hiển thị số dư "tham khảo" có thể stale vài trăm ms, ghi chú "đang cập nhật"
~~~
**Nguyên tắc ngân hàng:** đường dẫn **ghi tiền/quyết định tiền** phải dựa trên nguồn sự thật có điều kiện tuyến tính hóa; đường dẫn **hiển thị** có thể nới lỏng.

### Áp dụng thương mại điện tử: xác nhận đơn
~~~text
Luồng: User bấm "Đặt hàng" -> ghi đơn (commit) -> redirect trang "Đơn #123 thành công"
Vấn đề: trang xác nhận đọc từ replica -> chưa thấy đơn #123 -> "Không tìm thấy đơn"
  (user hoảng, bấm lại -> nguy cơ đặt trùng nếu không idempotent)

Giải pháp theo mức:
  - Read-your-writes: sau ghi, đọc đơn #123 từ primary (hoặc kèm version) trong phiên đó
  - Trả thẳng dữ liệu đơn trong response của request tạo đơn (không cần đọc lại)
  - Idempotency key cho nút đặt hàng để bấm lại không tạo đơn trùng
  - Eventual cho danh sách "tất cả đơn hàng" (trễ 1s chấp nhận được)
~~~

### Bảng đánh đổi
| Cách đọc | Độ trễ | Tải leader | Đảm bảo | Dùng cho |
|---|---|---|---|---|
| Local replica | Thấp nhất | Không | Eventual (stale) | Gợi ý, feed, analytics |
| Replica + chờ version | Thấp-vừa | Không (trừ check) | Read-your-writes | Trang xác nhận sau ghi |
| ReadIndex / quorum read | Vừa | Có (nhẹ) | Linearizable | Đọc phục vụ quyết định quan trọng |
| Qua leader / txn serializable | Cao hơn | Có (nhiều) | Linearizable/serializable | Tiền, tồn kho chốt đơn |

### Trên production
- **Triệu chứng stale read:** "tôi vừa lưu mà mở lại không thấy", đơn xác nhận 404 thoáng qua, số dư hiển thị nhảy lên xuống. Tăng khi replica lag cao (mạng, replica yếu, ghi burst).
- **Cách đo:** {{replication lag}} (byte/seconds); sampled consistency check (ghi giá trị + version, đọc từ replica, đo thời gian đến khi thấy); tỉ lệ lỗi "not found sau create" theo route đọc.
- **Tuning/cấu hình có thật:** Postgres {{synchronous_standby_names}} cho replica đồng bộ (linearizable hơn nhưng tăng latency ghi, giảm availability khi standby chết); route đọc/ghi ở tầng ứng dụng ({{@Transactional(readOnly=true)}} tới replica chỉ cho truy vấn chấp nhận stale). CockroachDB/Spanner cung cấp bounded/strong staleness tùy câu lệnh.
- **Thiết kế API:** endpoint ghi trả về resource + version; client dùng version đó cho lần đọc sau. Đừng buộc client "đợi 1 giây rồi load lại" - đó là che giấu vấn đề consistency bằng timing.

> Senior tip: Câu hỏi lead không phải "chọn CP hay AP", mà là "với từng câu query trong luồng này, stale tối đa chấp nhận bao nhiêu và hậu quả nếu vượt?". Tôi thường vẽ luồng đặt hàng và gắn nhãn từng chỗ đọc: {{[linearizable]}}, {{[read-your-writes]}}, {{[eventual 2s]}}. Bảng đó vừa là thiết kế, vừa là hợp đồng với team và là cơ sở chọn hạ tầng.`,
  follow: ['Synchronous replication (standby sync) trong Postgres cải thiện linearizable read như thế nào và đánh đổi availability/latency ra sao khi standby chậm hoặc chết?', 'Read-your-writes triển khai bằng cách "ghi nhớ version đã ghi vào session/cookie và gửi kèm request đọc" có rủi ro gì khi user đổi thiết bị hoặc session bị xoay?', 'Trong CockroachDB/Spanner, bounded staleness read cho phép đọc dữ liệu "cũ tối đa X giây" nhanh hơn; bạn chọn X và xác định query nào được dùng bounded staleness dựa trên tiêu chí gì?'],
}
  ,
  {
    id: 'design-036',
    topic: 'design',
    level: 'senior',
    q: 'Proxy, Decorator và Adapter khác nhau thế nào? Ví dụ Spring AOP, java.io, HandlerAdapter.',
    a: `**Tóm tắt:** Proxy kiểm soát truy cập (Spring AOP), Decorator thêm trách nhiệm (java.io streams), Adapter chuyển đổi interface (Spring MVC HandlerAdapter).

### 1. Proxy

Kiểm soát truy cập tới object thật: lazy init, access control, logging, transaction. Spring AOP dùng proxy (JDK dynamic proxy hoặc CGLIB). Gọi tự thân không đi qua proxy → khuyên lệnh không chạy.

### 2. Decorator

Thêm trách nhiệm động mà không đổi interface. java.io: BufferedInputStream bao bọc InputStream, thêm buffer. Có thể xếp nhiều decorator.

### 3. Adapter

Chuyển interface của class thành interface client mong đợi. Spring MVC: HandlerAdapter chuyển Controller method thành HandlerExecutionChain invocation.

### 4. So sánh

- Proxy: cùng interface, kiểm soát.
- Decorator: cùng interface, thêm hành vi.
- Adapter: khác interface, chuyển đổi.

### Cạm bẫy

- Decorator lồng sâu → khó gỡ lỗi.
- Proxy gọi tự thân (Spring AOP).
- Adapter lạm dụng → thiết kế quá phức tạp.

> Senior tip: Proxy = kiểm soát, Decorator = thêm, Adapter = chuyển. Nhớ bẫy gọi tự thân của Spring AOP.` ,
    follow: ['Spring AOP gọi tự thân vì sao không chạy?', 'Decorator trong java.io có nhược điểm gì?', 'Adapter khác Facade thế nào?'],
    tags: ['design-patterns','proxy','decorator','adapter']
  }
);