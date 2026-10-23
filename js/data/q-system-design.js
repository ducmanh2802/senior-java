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
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
  ]
}
,
{
  id: 'design-004',
  topic: 'design',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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

> Senior tip: ngưỡng celebrity không nên cố định cứng 10k. Tôi từng thấy một tài khoản 8k follower nhưng có bài viral nhận 2 triệu tương tác, làm worker fan-out nghẽn cả hàng đợi. Hãy dùng ngưỡng động theo tải thực tế và luôn có cơ chế tắt push cho một tài khoản cụ thể.`,
  follow: [
    'Nếu sản phẩm yêu cầu feed nhất quán tức thì khi follow/unfollow, bạn xử lý ra sao?',
    'Bạn thiết kế rebuild feed khi Redis mất toàn bộ dữ liệu mà không sập hệ thống?',
    'Làm sao cá nhân hoá feed mà vẫn giữ p99 dưới 300 ms?'
  ],
  tags: ['news feed', 'fan-out', 'Redis sorted set', 'celebrity']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: đừng cố làm WebSocket "stateless" bằng cách đẩy mọi thứ qua database — bạn sẽ tạo ra hàng triệu query mỗi giây. Cái cần là **registry tập trung nhỏ** (user đang ở gateway nào) cộng với gateway giữ socket trong RAM; đó là mô hình đã được chứng minh ở quy mô hàng chục triệu kết nối.`,
  follow: [
    'Mã hoá đầu cuối (end-to-end encryption) ảnh hưởng gì tới kiến trúc?',
    'Làm sao đảm bảo thứ tự tin nhắn khi một conversation bị di chuyển giữa các shard?',
    'Nếu cần tìm kiếm toàn văn trong lịch sử chat, bạn tích hợp kho nào và đồng bộ ra sao?'
  ],
  tags: ['chat', 'WebSocket', 'presence', 'message ordering']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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

> Senior tip: khi interviewer hỏi CAP, đừng trả lời định nghĩa rồi dừng. Hãy nói ngay "với bài toán này tôi chấp nhận stale bao lâu, vì người dùng sẽ cảm nhận thế nào" — đó là câu trả lời của người đã thiết kế sản phẩm, không chỉ đọc sách.`,
  follow: [
    'Bạn triển khai read-your-writes khi người dùng đọc từ replica ở region khác thế nào?',
    'Nếu cần đổi từ eventual sang strong consistency cho một bảng đang chạy production, lộ trình ra sao?',
    'Giải thích cách DynamoDB đạt được conditional write mạnh dù là hệ AP.'
  ],
  tags: ['CAP', 'PACELC', 'consistency', 'database selection']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
  ]
},
{
  id: 'design-012',
  topic: 'design',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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

> Senior tip: điều tôi luôn kiểm tra đầu tiên khi nhận hệ thống scheduler là **job có chạy trùng được không**. Nếu handler không idempotent, mọi cơ chế lease/retry đẹp đến đâu cũng sẽ tạo ra dữ liệu sai vào đúng đêm có sự cố — và đó là lúc không ai muốn debug.`,
  follow: [
    'Bạn xử lý job cần chạy đúng một lần mỗi ngày mà vẫn chịu được node chết giữa chừng?',
    'Khi batch làm nghẽn DB production, bạn điều tiết thế nào mà không dừng hẳn?',
    'So sánh scheduler tự xây với Temporal cho quy mô 50.000 job/ngày.'
  ],
  tags: ['job scheduler', 'batch', 'SKIP LOCKED', 'idempotency']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: tôi từng thấy một dự án "Clean Architecture" mà domain import JPA và controller trả thẳng entity — kiến trúc chỉ còn trên sơ đồ. Nếu định áp dụng, hãy viết ArchUnit test ngay từ ngày đầu; kỷ luật tự động đáng tin hơn kỷ luật con người.`,
  follow: [
    'Bạn đặt transaction boundary ở đâu trong hexagonal architecture và vì sao?',
    'Làm sao tránh việc mapping domain/JPA entity trở thành gánh nặng?',
    'ArchUnit nên kiểm tra những quy tắc nào cho cấu trúc này?'
  ],
  tags: ['clean architecture', 'hexagonal', 'package structure', 'ArchUnit']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: câu hỏi tôi dùng để kiểm tra hiểu DDD là "nếu hai người đặt cùng một sản phẩm cuối cùng, transaction nằm ở đâu?". Người trả lời "gộp Order và Inventory vào một transaction" chưa hiểu ranh giới; người trả lời "hai aggregate, reserve qua saga/event và DB có ràng buộc" mới là người đã vận hành hệ thống thật.`,
  follow: [
    'Bạn chọn kích thước aggregate thế nào khi có collection rất lớn?',
    'Làm sao xử lý optimistic lock conflict mà không làm người dùng thấy lỗi?',
    'Khi nào nên dùng process manager thay vì choreography bằng event?'
  ],
  tags: ['DDD', 'aggregate', 'value object', 'domain event']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: tôi luôn nói với stakeholder bằng ngôn ngữ rủi ro, không phải code: "module này gây 40% sự cố trong 6 tháng, mỗi sự cố tốn 2 giờ và ảnh hưởng 5.000 người dùng". Khi có con số, việc xin thời gian refactor dễ hơn nhiều so với nói "code xấu".`,
  follow: [
    'Bạn thuyết phục product owner hy sinh 20% capacity cho refactor thế nào?',
    'Làm sao viết characterization test cho code phụ thuộc nhiều vào thời gian và random?',
    'Khi nào bạn quyết định xoá hẳn module cũ sau khi chuyển traffic?'
  ],
  tags: ['technical debt', 'legacy', 'strangler fig', 'refactoring']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: giá trị lớn nhất của ADR không phải tài liệu, mà là **buộc người ra quyết định viết ra các phương án bị loại**. Trong nhiều buổi review, chính phần Alternatives khiến team nhận ra mình đang chọn công nghệ vì hype chứ không vì nhu cầu.`,
  follow: [
    'Bạn xử lý khi có hai ADR mâu thuẫn nhau trong cùng hệ thống?',
    'Làm sao đánh giá chi phí vận hành dài hạn của một lựa chọn công nghệ?',
    'Khi nào một quyết định không cần ADR mà chỉ cần ghi trong PR?'
  ],
  tags: ['ADR', 'architecture decision', 'trade-off', 'documentation']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
  ]
},
{
  id: 'architecture-008',
  topic: 'architecture',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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
- Phi chức năng: không mất giao dịch, không "tạo tiền ảo", audit đầy đủ, chạy 24/7 không có cửa sổ bảo trì; tuân thủ hạn mức và quy định xác thực của NHNN. Theo Quyết định 2345/QĐ-NHNN áp dụng từ 01/07/2024, sinh trắc học được yêu cầu với giao dịch trên 10 triệu đồng/lần hoặc tổng giao dịch online trên 20 triệu đồng/ngày; kiểm tra văn bản và quy định hiện hành khi triển khai thực tế.
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

> Senior tip: lỗi đắt nhất trong hệ thống chuyển tiền thường không nằm ở lúc tải cao mà ở **xử lý timeout**: một job "dọn dẹp" tự chuyển UNKNOWN thành FAILED và nhả hold sẽ làm ngân hàng mất tiền mỗi khi mạng chập chờn. Hãy đo số giao dịch UNKNOWN theo phút làm metric hàng đầu và có runbook tra soát rõ ràng.`,
  follow: [
    'Bạn thiết kế cơ chế truy vấn trạng thái khi switch không trả kết quả thế nào để không gây chuyển trùng?',
    'Nếu switch đổi format file đối soát, bạn quản lý version parser ra sao?',
    'Ngân hàng ta là bên nhận: làm sao đảm bảo không cộng tiền hai lần khi switch gửi lại bản tin?'
  ],
  tags: ['IBFT', 'NAPAS', 'banking', 'reconciliation', 'ledger', 'timeout']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: khi review một Snowflake tự viết, tôi hỏi hai câu trước tiên: "worker ID được cấp thế nào khi scale từ 3 lên 30 pod?" và "đồng hồ lùi 1 giây thì chuyện gì xảy ra?". Phần lớn implementation tự viết trả lời sai ít nhất một câu. Nếu không thật sự cần {{long}}, UUIDv7 (cùng ý tưởng time-ordered như ULID, chuẩn hoá trong RFC 9562) bớt được cả hai rủi ro.`,
  follow: [
    'Nếu cần ID 64-bit nhưng không muốn lo clock skew, bạn thiết kế thế nào?',
    'Khi migrate khoá chính từ bigint auto-increment sang Snowflake hoặc ULID, lộ trình ra sao?',
    'So sánh kích thước index giữa bigint, UUID và chuỗi ULID 26 ký tự trong PostgreSQL.'
  ],
  tags: ['Snowflake', 'ULID', 'UUIDv7', 'distributed ID', 'clock skew', 'sequence']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: interviewer thường gài câu "dùng distributed lock cho từng ghế được không?". Được, nhưng thừa: một UPDATE có điều kiện trong DB đã là lock đúng nghĩa và có transaction đi kèm. Thứ thật sự cứu bạn ngày mở bán là phòng chờ và cache sơ đồ ghế, vì hơn 90% traffic là đọc.`,
  follow: [
    'Nếu muốn hiển thị trạng thái ghế realtime cho 50.000 người đang xem cùng một sơ đồ, bạn làm thế nào?',
    'Thanh toán thành công nhưng callback đến sau khi hold hết hạn: bạn xử lý theo những bước nào?',
    'Với vé không đánh số ghế (vé đứng, 10.000 vé), thiết kế giữ chỗ thay đổi ra sao?'
  ],
  tags: ['booking', 'overbooking', 'hold', 'TTL', 'waiting room', 'concurrency']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
  ]
},
{
  id: 'design-017',
  topic: 'design',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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

> Senior tip: trước khi bàn công cụ, hãy hỏi "bao nhiêu % log chúng ta từng tìm tới?". Câu trả lời thường rất nhỏ. Phân tầng hot/cold và sample log thành công thường giảm chi phí mạnh hơn nhiều so với đổi từ ES sang công cụ khác.`,
  follow: [
    'Bạn đảm bảo log không chứa dữ liệu nhạy cảm (số thẻ, CCCD) ở tầng ứng dụng thế nào, ngoài masking ở pipeline?',
    'Prometheus bị OOM vì cardinality tăng đột biến lúc 2 giờ sáng: bạn điều tra và xử lý ra sao?',
    'So sánh head-based và tail-based sampling cho distributed tracing.'
  ],
  tags: ['logging', 'metrics', 'observability', 'Kafka', 'cardinality', 'retention']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
  ]
},
{
  id: 'design-020',
  topic: 'design',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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

> Senior tip: lỗ hổng OTP trong thực tế hiếm khi là thuật toán sinh mã mà là **luồng nghiệp vụ**: endpoint xác minh không giới hạn số lần, OTP không gắn với giao dịch (dùng OTP đăng nhập để chuyển tiền), hoặc mã OTP lọt vào log ứng dụng. Khi review, tôi grep log của service OTP trước tiên.`,
  follow: [
    'Triển khai TOTP trong app: thiết bị mới kích hoạt Smart OTP thế nào để kẻ gian không chiếm được?',
    'Một nhà mạng gửi SMS chậm 2 phút trong giờ cao điểm: hệ thống của bạn phát hiện và phản ứng ra sao?',
    'Làm sao chống tấn công dò OTP phân tán từ hàng nghìn IP khác nhau?'
  ],
  tags: ['OTP', '2FA', 'TOTP', 'SMS', 'brute force', 'Redis', 'security']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: khi debug "transaction không rollback" hay "cache không ăn", tôi đặt breakpoint xem class của bean được inject: thấy tên có {{$$SpringCGLIB$$}} là có proxy. Rồi kiểm tra lời gọi có đi qua tham chiếu bean đó không. Chín trên mười lần lỗi là self-invocation hoặc exception bị catch nuốt mất.`,
  follow: [
    'Exception checked có làm @Transactional rollback không? Cấu hình rollbackFor thế nào?',
    'Thứ tự áp dụng khi một method có cả @Transactional và @Cacheable: proxy nào bọc ngoài?',
    'Vì sao @Async trên method trả về void làm exception biến mất, và bạn xử lý thế nào?'
  ],
  tags: ['Proxy', 'Spring AOP', '@Transactional', 'CGLIB', 'self-invocation']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: trong tích hợp ngân hàng, tôi yêu cầu adapter là nơi **duy nhất** biết mã lỗi đối tác và mọi mapping có test với response mẫu thật (lấy từ sandbox của đối tác). Khi đối tác thêm mã lỗi mới, bug sẽ nằm gọn ở một class thay vì rải khắp code.`,
  follow: [
    'Bạn đặt retry ở decorator, ở HTTP client hay ở message queue? Tiêu chí chọn?',
    'Facade mở tài khoản lỗi ở bước thứ 3: bạn thiết kế để khách có thể tiếp tục thay vì làm lại từ đầu thế nào?',
    'Spring có cách nào khai báo chuỗi decorator gọn gàng thay vì new lồng nhau?'
  ],
  tags: ['Adapter', 'Facade', 'Decorator', 'Proxy', 'integration', 'design pattern']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: dấu hiệu sớm nhất của cây kế thừa sai là lớp cha bắt đầu có cờ boolean hoặc method protected chỉ một lớp con dùng. Khi thấy hai dấu hiệu đó trong review, tôi đề xuất tách trục thay đổi ra policy trước khi thêm lớp con kế tiếp; càng để lâu, chi phí tách càng lớn.`,
  follow: [
    'Sealed interface với record khác gì kế thừa truyền thống, vì sao không gặp fragile base class?',
    'Bạn refactor một cây kế thừa đang chạy production mà không phá dữ liệu đã lưu bằng JPA inheritance thế nào?',
    'Delegation trong composition có tốn hiệu năng đáng kể không?'
  ],
  tags: ['composition', 'inheritance', 'fragile base class', 'sealed', 'refactoring']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: quy tắc tôi áp cho mọi event: phải trả lời được "nếu event này đến hai lần, đến muộn 1 giờ, hoặc không bao giờ đến thì sao?". Nếu team không trả lời được câu thứ ba, hệ thống thiếu cơ chế đối soát, và đó là chỗ tiền hoặc dữ liệu sẽ lệch âm thầm.`,
  follow: [
    'Bạn tiến hoá schema event (đổi tên field, tách field) thế nào khi có 6 consumer của 4 team?',
    'Consumer cần dữ liệu khách hàng mới nhất nhưng chỉ nhận event-carried state: xử lý dữ liệu stale ra sao?',
    'Làm sao xây một màn hình "theo dõi trạng thái đơn hàng" trong hệ thống choreography?'
  ],
  tags: ['event-driven', 'Kafka', 'event notification', 'event-carried state transfer', 'observability']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: tôi chỉ đồng ý tách microservice khi modular monolith đã chạy vài tháng mà {{verify()}} xanh và các module chỉ nói chuyện qua event hoặc API công khai. Lúc đó tách là việc cơ học. Ngược lại, nếu không giữ nổi ranh giới trong một codebase, team sẽ không giữ nổi nó qua mạng.`,
  follow: [
    'Module A cần dữ liệu của module B để hiển thị: gọi API của B, join bảng, hay giữ bản sao qua event?',
    'Event publication bị kẹt ở trạng thái chưa hoàn tất: bạn giám sát và xử lý thế nào?',
    'Lộ trình đưa một monolith 300.000 dòng không có ranh giới sang modular monolith?'
  ],
  tags: ['Spring Modulith', 'modular monolith', 'bounded context', 'events', 'architecture']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
  ]
},
{
  id: 'architecture-019',
  topic: 'architecture',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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

> Senior tip: Observer trong process là thứ tôi thấy gây sự cố nhiều nhất: dev nghĩ "phát event là tách rời rồi" nhưng listener lỗi vẫn làm rollback giao dịch chính, hoặc ngược lại event mất khi pod restart. Luôn hỏi: listener này chạy trong transaction nào, thread nào, và nếu app chết ngay sau commit thì sao?`,
  follow: [
    'Thứ tự giữa nhiều @EventListener cho cùng một event được xác định thế nào?',
    'Template Method và Strategy: bạn chọn cái nào cho bài import file nhiều định dạng, vì sao?',
    'Làm sao trả về tất cả lỗi kiểm tra thay vì dừng ở lỗi đầu tiên trong chuỗi CoR?'
  ],
  tags: ['Template Method', 'Observer', 'Chain of Responsibility', 'Spring events', 'design pattern']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
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

> Senior tip: tôi luôn kèm {{.because("...")}} vào từng luật, viết bằng ngôn ngữ nghiệp vụ ("domain phải test được không cần DB"). Khi test fail, dev đọc được lý do thay vì nghĩ đây là luật quan liêu và tìm cách lách.`,
  follow: [
    'Bạn áp dụng ArchUnit cho một codebase có 500 vi phạm sẵn mà không làm team nản thế nào?',
    'Khi nào nên nâng một luật từ ArchUnit lên thành ranh giới Maven module?',
    'Viết luật ArchUnit cấm gọi LocalDateTime.now() trong domain và giải thích vì sao luật đó hữu ích.'
  ],
  tags: ['ArchUnit', 'architecture test', 'hexagonal', 'dependency rules', 'package cycle']
,
  refs: [
    { type: 'doc', title: 'AWS Well-Architected Framework', url: 'https://docs.aws.amazon.com/wellarchitected/latest/framework/welcome.html' },
    { type: 'doc', title: 'Google SRE Book', url: 'https://sre.google/sre-book/table-of-contents/' },
    { type: 'doc', title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer' }
  ]
},
{
  id: 'architecture-022',
  topic: 'architecture',
  level: 'lead',
  refs: [{"type": "doc", "title": "System Design Primer", "url": "https://github.com/donnemartin/system-design-primer"}, {"type": "doc", "title": "High Scalability", "url": "https://highscalability.com/"}],
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

> Senior tip: tôi viết một bộ test tự động "tenant isolation": tạo dữ liệu cho hai tenant, gọi mọi API list/search/export bằng token tenant A và khẳng định không có bản ghi nào của B. Bộ test này chạy trong CI cho mọi endpoint mới, vì lỗi rò rỉ giữa tenant là loại sự cố làm mất khách nhanh nhất của một SaaS.`,
  follow: [
    'Một tenant lớn chiếm 40% tải và làm chậm các tenant khác trên cùng DB: bạn xử lý thế nào?',
    'Cách migrate một tenant từ shared schema sang database riêng mà không downtime?',
    'Truyền tenant context qua virtual thread và @Async trong Spring Boot 3 thế nào cho an toàn?'
  ],
  tags: ['multi-tenancy', 'Hibernate', '@TenantId', 'Row Level Security', 'SaaS', 'PostgreSQL']
},
);
