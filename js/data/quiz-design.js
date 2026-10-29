/* Multiple-choice bank (exam pool design) - owner: Claude quiz task. Format: see AGENTS.md section 4 */
(window.QUIZ = window.QUIZ || []).push(
// ===================== design =====================
{
  id: 'qz-design-007',
  topic: 'design',
  q: 'Mạng xã hội 200 triệu user dùng fan-out on write cho news feed. Một ca sĩ có 50 triệu follower đăng bài và hàng đợi fan-out bị nghẽn 40 phút. Cách sửa nào hợp lý nhất?',
  options: [
    'Hybrid: user thường vẫn fan-out on write, còn tài khoản có lượng follower vượt ngưỡng (ví dụ > 100k) không fan-out mà được trộn vào feed lúc đọc (fan-out on read)',
    'Chuyển toàn bộ hệ thống sang fan-out on read: mỗi lần mở app thì query bài mới của tất cả người mình follow',
    'Tăng số consumer fan-out lên 10 lần để ghi 50 triệu bản copy nhanh hơn',
    'Giới hạn mỗi tài khoản chỉ được tối đa 5 triệu follower'
  ],
  answer: 0,
  explain: `**Đáp án đúng: hybrid fan-out, celebrity được kéo vào lúc đọc.**

### Vì sao đúng
- **Fan-out on write** (push): khi đăng bài, hệ thống chép post id vào feed cache của từng follower. Đọc feed cực nhanh (chỉ đọc một list có sẵn), nhưng chi phí ghi tỉ lệ với số follower: 1 bài của celebrity = 50 triệu lần ghi.
- **Fan-out on read** (pull): lúc đọc mới đi gom bài từ những người mình follow. Ghi rẻ, nhưng đọc đắt nếu follow nhiều người.
- Phân bố follower rất lệch: 99,9% user có vài trăm follower, chỉ vài nghìn tài khoản có hàng triệu. Hybrid dùng push cho số đông (đọc nhanh) và pull cho số ít celebrity: khi user mở feed, lấy feed đã push sẵn rồi **merge** thêm bài mới của vài celebrity họ follow (mỗi celebrity có một timeline riêng được cache nóng).

### Vì sao các phương án khác sai
- **Chuyển toàn bộ sang fan-out on read**: user follow 500 người thì mỗi lần mở app phải query 500 timeline rồi sort, với 200 triệu user là tải đọc khổng lồ; bỏ mất ưu điểm đọc nhanh cho số đông.
- **Tăng consumer 10 lần**: vẫn phải ghi 50 triệu bản copy cho một bài, tốn bộ nhớ cache và chỉ dời nút thắt sang Redis/storage; bài thứ hai của celebrity lại nghẽn tiếp.
- **Giới hạn follower**: là quyết định sản phẩm không chấp nhận được, không phải giải pháp kỹ thuật.

> Senior tip: ngưỡng celebrity nên là cấu hình động và tính theo cả tần suất đăng bài. Feed cache thường chỉ giữ vài trăm post id gần nhất cho user active trong 30 ngày, user không active thì không fan-out để tiết kiệm bộ nhớ.`
},
{
  id: 'qz-design-008',
  topic: 'design',
  q: 'Ước lượng nhanh cho URL shortener: 100 triệu URL mới mỗi tháng, giữ 5 năm, mỗi bản ghi (mã ngắn, URL gốc, metadata) khoảng 500 byte. Dung lượng lưu trữ thô xấp xỉ bao nhiêu?',
  options: [
    'Khoảng 300 GB',
    'Khoảng 3 TB',
    'Khoảng 30 TB',
    'Khoảng 300 TB'
  ],
  answer: 1,
  explain: `**Đáp án đúng: khoảng 3 TB.**

### Cách tính
~~~text
100 triệu/tháng x 12 tháng x 5 năm = 6 tỉ bản ghi
6 x 10^9 x 500 byte = 3 x 10^12 byte = 3 TB
~~~
Đây là dung lượng thô, chưa tính index, replica (thường x3) và overhead của storage engine. Khi trình bày, nói rõ: "3 TB dữ liệu thô, khoảng 10–15 TB khi tính index và 3 replica" để thể hiện bạn biết con số thật trên đĩa lớn hơn.

### Vì sao các phương án khác sai
- **300 GB**: sai một bậc, thường do quên nhân 5 năm hoặc tính 50 byte/bản ghi.
- **30 TB**: sai một bậc theo hướng ngược lại, ví dụ nhân nhầm 5.000 byte/bản ghi.
- **300 TB**: lệch hai bậc, có thể do cộng cả lượt click (100 lần đọc mỗi URL) vào dung lượng, trong khi đọc không tạo dữ liệu mới nếu không lưu analytics.

### Ý nghĩa thiết kế
3 TB vẫn vừa một cụm database nhỏ hoặc vài shard, nên không cần thiết kế quá phức tạp. QPS mới là điểm cần quan tâm: 100 triệu/tháng tương đương khoảng 40 write/giây trung bình, và với tỉ lệ đọc 100:1 thì khoảng 4.000 read/giây, đỉnh có thể gấp 3–5 lần. Mức đọc này cần cache (Redis/CDN) trước database.

> Senior tip: thuộc sẵn mốc "1 tháng khoảng 2,5 triệu giây" và "1 ngày khoảng 86.400 giây (làm tròn 10^5)". Interviewer đánh giá cách bạn làm tròn và kiểm tra lại con số, không đánh giá độ chính xác đến từng byte.`
},
{
  id: 'qz-design-009',
  topic: 'design',
  q: 'Cụm cache 10 node đang chia key bằng {{hash(key) % N}}. Thêm node thứ 11 lúc cao điểm, cache hit rate rơi từ 95% xuống gần 10% và DB quá tải. Giải thích nào đúng?',
  options: [
    'Node mới chưa warm-up nên chỉ khoảng 1/11 số key bị miss; hit rate rơi mạnh là do lỗi cấu hình TTL',
    'Modulo hashing chỉ làm đổi node của các key có hash chia hết cho 11',
    'Với modulo, khoảng 10/11 (gần 91%) key đổi sang node khác nên gần như toàn bộ cache bị miss; consistent hashing (có virtual node) chỉ dời khoảng 1/11 key',
    'Consistent hashing cũng dời khoảng 91% key, khác biệt duy nhất là phân bố đều hơn'
  ],
  answer: 2,
  explain: `**Đáp án đúng: modulo hashing làm khoảng 91% key đổi node; consistent hashing chỉ dời khoảng 1/11.**

### Vì sao đúng
- Với {{hash % N}}, khi N đổi từ 10 sang 11, một key chỉ giữ nguyên node khi {{h % 10 == h % 11}}, tức một tỉ lệ nhỏ (khoảng 1/11). Gần như toàn bộ key bị "chuyển nhà", nên request đầu tiên của mỗi key đều miss và rơi thẳng xuống DB, giống một cache stampede trên toàn cụm.
- **Consistent hashing**: node và key cùng được băm lên một vòng (ring). Key thuộc node đầu tiên theo chiều kim đồng hồ. Thêm node mới chỉ "cắt" một đoạn ring từ node kế bên, nên chỉ khoảng 1/(N+1) key bị dời. **Virtual node** (mỗi node vật lý có 100–200 điểm trên ring) giúp phần bị cắt được lấy đều từ nhiều node, tránh một node phải gánh hết.

### Vì sao các phương án khác sai
- **Chỉ 1/11 key miss do node mới**: đó là hành vi của consistent hashing, không phải modulo.
- **Chỉ key có hash chia hết cho 11**: sai toán học; giá trị {{h % 10}} và {{h % 11}} khác nhau với phần lớn h.
- **Consistent hashing cũng dời 91%**: sai, ưu điểm cốt lõi của nó chính là chỉ dời phần tỉ lệ 1/(N+1).

> Senior tip: Redis Cluster không dùng consistent hashing mà dùng 16.384 hash slot cố định ({{CRC16(key) % 16384}}), thêm node thì di chuyển slot có kiểm soát. Dù dùng cơ chế nào, scale cụm cache nên làm ngoài giờ cao điểm và theo dõi DB QPS trong lúc chuyển.`
},
{
  id: 'qz-design-010',
  topic: 'design',
  q: 'Service A giữ distributed lock trên Redis (TTL 10 giây) để ghi file báo cáo lên storage. A bị GC pause 30 giây, lock hết hạn, service B lấy lock và ghi xong; sau đó A tỉnh dậy và ghi đè dữ liệu cũ. Cách chống đúng là gì?',
  options: [
    'Tăng TTL lên 60 giây là đủ, vì GC pause hiếm khi vượt quá con số đó',
    'Chuyển sang Redlock với 5 node Redis độc lập',
    'Trước khi ghi, A kiểm tra lại lock còn của mình bằng lệnh GET rồi mới ghi',
    'Dùng fencing token: mỗi lần cấp lock trả về một số tăng dần, storage từ chối mọi lệnh ghi mang token nhỏ hơn token lớn nhất đã thấy'
  ],
  answer: 3,
  explain: `**Đáp án đúng: fencing token được kiểm tra ở phía storage.**

### Vì sao đúng
Vấn đề gốc: client **không thể biết chắc** mình vẫn giữ lock tại thời điểm thực hiện ghi, vì giữa lúc kiểm tra và lúc ghi luôn có thể có pause (GC, CPU bị throttle, mạng chậm). Fencing token chuyển việc kiểm tra sang **bên nhận lệnh ghi**:
~~~text
A lấy lock -> token 33   (rồi GC pause)
lock hết hạn, B lấy lock -> token 34, ghi kèm 34 -> storage nhớ max=34
A tỉnh dậy, ghi kèm 33 -> storage thấy 33 < 34 -> từ chối
~~~
Token có thể là số tăng dần do lock service cấp (ZooKeeper zxid, etcd revision) hoặc một cột version trong DB ({{UPDATE ... WHERE version < :token}}).

### Vì sao các phương án khác sai
- **Tăng TTL**: chỉ làm sự cố hiếm hơn chứ không loại bỏ được; pause có thể đến từ swap, VM bị migrate, hoặc mạng partition. Thêm nữa, TTL dài làm hệ thống chờ lâu khi A chết thật.
- **Redlock 5 node**: tăng độ sẵn sàng của lock service, nhưng không giải quyết được client bị pause sau khi đã nhận lock. Martin Kleppmann đã chỉ ra chính điểm này khi phân tích Redlock.
- **GET lại trước khi ghi**: vẫn có khe hở giữa GET và lệnh ghi (check-then-act), pause có thể rơi đúng vào khe đó.

> Senior tip: nếu tài nguyên đích là database, nhiều khi bạn không cần distributed lock: dùng optimistic locking (cột version) hoặc unique constraint thường đơn giản và an toàn hơn. Chỉ dùng lock Redis cho mục đích **hiệu quả** (tránh làm trùng việc), còn **tính đúng đắn** phải được đảm bảo ở storage.`
},
{
  id: 'qz-design-011',
  topic: 'design',
  multi: true,
  q: 'Hệ thống dùng cache-aside với Redis trước PostgreSQL. Thỉnh thoảng giá sản phẩm trên cache cũ hơn DB hàng giờ. Những biện pháp nào giúp giảm stale cache một cách đúng đắn? (Chọn 2)',
  options: [
    'Khi cập nhật, ghi giá mới vào cache trước rồi mới ghi DB',
    'Khi cập nhật, ghi DB rồi xoá (delete) key cache thay vì set giá trị mới vào cache',
    'Bỏ TTL để cache không bao giờ hết hạn, tránh miss',
    'Invalidate cache dựa trên CDC (Debezium đọc WAL/binlog) có retry, để key vẫn được xoá kể cả khi app crash ngay sau khi commit',
    'Xoá key cache bên trong transaction DB, trước khi commit'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: ghi DB rồi xoá cache; và invalidate qua CDC có retry.**

### Vì sao đúng
- **Ghi DB rồi delete cache**: delete an toàn hơn set vì hai request cập nhật đồng thời có thể set cache theo thứ tự ngược với thứ tự commit (A commit trước nhưng set sau, cache giữ giá trị của A dù DB có giá trị của B). Delete thì lần đọc kế tiếp sẽ nạp lại từ DB. Vẫn có một race hiếm (reader đọc DB cũ, writer ghi và xoá, rồi reader set giá trị cũ) nên luôn giữ TTL làm lưới an toàn.
- **CDC**: nếu app crash giữa "commit DB" và "delete cache" thì key cũ sống tới khi hết TTL. Debezium đọc thay đổi đã commit từ log của DB và phát event, một consumer xoá key với retry, nên lệnh xoá cuối cùng chắc chắn xảy ra.

### Vì sao các phương án khác sai
- **Ghi cache trước rồi ghi DB**: nếu ghi DB fail hoặc rollback, cache chứa giá trị chưa từng tồn tại trong DB.
- **Bỏ TTL**: mọi sai lệch sẽ tồn tại vĩnh viễn; TTL là lớp bảo vệ cuối cùng.
- **Xoá cache trước commit**: một request đọc chen vào sau khi xoá nhưng trước khi commit sẽ đọc giá trị cũ từ DB và nạp lại vào cache, khiến cache cũ thêm một vòng TTL nữa.

> Senior tip: với dữ liệu nhạy cảm như giá, kết hợp ba lớp: delete sau commit, CDC invalidation và TTL ngắn (vài phút) có jitter. Đo tỉ lệ stale bằng cách sample so sánh cache với DB thay vì đoán.`
},
{
  id: 'qz-design-012',
  topic: 'design',
  q: 'Ví điện tử: một tài khoản merchant nhận và chi khoảng 200 giao dịch/giây, số dư tuyệt đối không được âm. Cách trừ tiền nào vừa đúng vừa chịu được tải?',
  options: [
    'Trong cùng transaction: {{UPDATE account SET balance = balance - :amt WHERE id = :id AND balance >= :amt}}, kiểm tra số dòng bị ảnh hưởng bằng 1, rồi INSERT các bút toán ledger',
    'Đọc số dư bằng SELECT trong {{@Transactional}} mặc định (READ COMMITTED), kiểm tra đủ tiền ở Java rồi UPDATE giá trị mới',
    'Dùng Redis distributed lock theo account id, bên trong đọc và ghi số dư như bình thường, không cần ràng buộc gì ở DB',
    'Trừ tiền bất đồng bộ qua Kafka, cuối ngày batch kiểm tra tài khoản nào âm thì đòi lại'
  ],
  answer: 0,
  explain: `**Đáp án đúng: conditional UPDATE nguyên tử kèm ghi ledger trong cùng transaction.**

### Vì sao đúng
- Câu lệnh {{UPDATE ... WHERE balance >= :amt}} được DB thực hiện nguyên tử trên một dòng: dòng bị khoá ghi trong lúc cập nhật, điều kiện được đánh giá lại trên phiên bản mới nhất. Nếu không đủ tiền thì 0 dòng bị ảnh hưởng và app trả lỗi "số dư không đủ".
- Ghi bút toán kép (debit/credit) trong cùng transaction giúp số dư luôn khớp ledger. Có thể thêm {{CHECK (balance >= 0)}} làm lớp bảo vệ cuối.
- 200 TPS trên một dòng vẫn chịu được nếu transaction ngắn (vài ms). Khi vượt ngưỡng, có thể chia tài khoản hot thành nhiều sub-account.

### Vì sao các phương án khác sai
- **SELECT rồi UPDATE ở Java với READ COMMITTED**: hai transaction cùng đọc 100, cùng thấy đủ tiền, cùng ghi kết quả: lost update và số dư có thể âm. READ COMMITTED không ngăn kiểu race read-modify-write này.
- **Chỉ dùng Redis lock**: lock có thể hết hạn khi app pause (xem fencing token), Redis failover có thể mất lock; tính đúng đắn của tiền không được phụ thuộc vào một hệ thống bên ngoài DB.
- **Trừ async rồi đòi lại**: vi phạm yêu cầu "không được âm", tạo nợ xấu và rủi ro pháp lý.

> Senior tip: khi bị hỏi "sao không dùng SELECT FOR UPDATE", hãy trả lời rằng nó cũng đúng nhưng giữ lock lâu hơn (qua một round-trip về app); conditional UPDATE gộp kiểm tra và ghi thành một lệnh nên thông lượng cao hơn.`
},
{
  id: 'qz-design-013',
  topic: 'design',
  q: 'Bạn dùng ID kiểu Snowflake (41 bit timestamp ms, 10 bit worker id, 12 bit sequence). Một worker sinh tối đa bao nhiêu ID mỗi mili giây, và nên làm gì khi NTP chỉnh đồng hồ lùi 5 ms?',
  options: [
    '1.024 ID/ms; khi đồng hồ lùi thì reset sequence về 0 và tiếp tục sinh',
    '4.096 ID/ms; khi phát hiện thời gian hiện tại nhỏ hơn timestamp lần sinh trước thì chờ tới khi đồng hồ vượt qua mốc đó (hoặc báo lỗi nếu lệch lớn) để không sinh ID trùng',
    '4.096 ID/ms; đồng hồ lùi không gây vấn đề vì worker id đã đảm bảo duy nhất',
    '1.024 ID/ms; chuyển sang dùng UUID v4 cho khoảng thời gian bị lùi'
  ],
  answer: 1,
  explain: `**Đáp án đúng: 4.096 ID/ms mỗi worker; khi đồng hồ lùi thì chờ hoặc từ chối sinh ID.**

### Vì sao đúng
- 12 bit sequence cho 2^12 = 4.096 giá trị trong cùng một mili giây trên một worker. 10 bit worker cho 1.024 worker, tổng lý thuyết khoảng 4 triệu ID/ms trên toàn cụm. 41 bit timestamp ms đủ dùng khoảng 69 năm kể từ epoch tuỳ chọn.
- Tính duy nhất dựa trên bộ ba (timestamp, worker, sequence). Nếu đồng hồ lùi 5 ms, worker sẽ quay lại các timestamp **đã dùng** và có thể sinh lại đúng bộ ba cũ, tức trùng ID. Vì vậy implementation chuẩn lưu {{lastTimestamp}}: nếu {{now < lastTimestamp}} thì lệch nhỏ (vài ms) cứ chờ, lệch lớn thì ném lỗi và cảnh báo.

### Vì sao các phương án khác sai
- **1.024 ID/ms**: nhầm số bit của worker id với sequence.
- **Reset sequence về 0 khi lùi**: chính là cách sinh ra ID trùng với những ID đã cấp trong 5 ms đó.
- **Worker id đảm bảo duy nhất**: worker id chỉ phân biệt giữa các máy; trên cùng một máy, trùng timestamp và sequence vẫn là trùng ID.
- **Chuyển sang UUID v4 tạm thời**: phá vỡ định dạng 64 bit và tính sắp xếp theo thời gian, nơi lưu trữ kiểu BIGINT cũng không chứa được.

> Senior tip: cấu hình NTP chạy kiểu slew (chỉnh từ từ) thay vì step để tránh nhảy lùi. Cấp worker id qua ZooKeeper/etcd hoặc bảng DB có lease, vì hai pod trùng worker id là lỗi trùng ID khó phát hiện nhất.`
},
{
  id: 'qz-design-014',
  topic: 'design',
  q: 'API xuất báo cáo chạy đồng bộ 2–5 phút; load balancer cắt kết nối ở 60 giây nên người dùng bấm lại nhiều lần, tạo ra nhiều job trùng làm DB quá tải. Thiết kế lại thế nào?',
  options: [
    'Tăng idle timeout của load balancer lên 10 phút cho endpoint này',
    'Cho mỗi request chạy trong một thread riêng ({{@Async}}) và trả 200 ngay, không cần trả gì thêm',
    'POST tạo job và trả {{202 Accepted}} kèm job id; worker xử lý từ hàng đợi; client poll {{GET /jobs/:id}} hoặc nhận thông báo; dùng idempotency key (user + tham số) để bấm lại trả về job cũ; file kết quả để trên object storage qua presigned URL',
    'Cache kết quả báo cáo 24 giờ để lần bấm sau trả nhanh'
  ],
  answer: 2,
  explain: `**Đáp án đúng: async job pattern với 202 Accepted, hàng đợi và idempotency key.**

### Vì sao đúng
- Tách "nhận yêu cầu" khỏi "xử lý": request HTTP kết thúc trong vài ms, không còn phụ thuộc timeout của LB, proxy hay trình duyệt.
- Hàng đợi + số worker giới hạn = **backpressure**: tối đa N báo cáo chạy song song, DB không bị dồn tải.
- Idempotency key (ví dụ hash của user id + loại báo cáo + khoảng ngày) giúp bấm lại trả về đúng job đang chạy thay vì tạo job mới.
- File lớn để trên S3, client tải qua presigned URL có hạn dùng, server ứng dụng không phải stream file.

### Vì sao các phương án khác sai
- **Tăng timeout LB**: giữ kết nối và thread vài phút cho mỗi request; người dùng vẫn có thể F5 tạo job trùng; các proxy khác (CDN, mobile network) vẫn có thể cắt.
- **@Async trả 200 ngay**: client không có cách biết job xong chưa và tải kết quả ở đâu; job nằm trong bộ nhớ nên mất khi pod restart; vẫn không chặn trùng.
- **Cache 24 giờ**: chỉ giúp lần sau, lần đầu vẫn timeout; bấm lại trong lúc job đầu đang chạy vẫn tạo job trùng.

> Senior tip: lưu trạng thái job trong DB (PENDING/RUNNING/DONE/FAILED, progress %, error) để UI hiển thị tiến độ, và chạy báo cáo nặng trên read replica để không ảnh hưởng luồng giao dịch.`
},
{
  id: 'qz-design-015',
  topic: 'design',
  q: 'Hệ thống chạy ở hai datacenter, đường truyền giữa hai DC bị đứt (network partition) 10 phút. Với dữ liệu "số dư ví" và "giỏ hàng", lựa chọn theo CAP nào hợp lý?',
  options: [
    'Cả hai đều chọn AP: tiếp tục nhận ghi ở cả hai DC, gộp lại sau khi mạng phục hồi',
    'Cả hai đều chọn CP: từ chối mọi ghi ở cả hai DC cho tới khi mạng phục hồi',
    'Số dư ví chọn AP để không mất giao dịch; giỏ hàng chọn CP vì đơn hàng cần chính xác',
    'Số dư ví chọn CP (phía không giữ quorum/primary từ chối ghi); giỏ hàng chọn AP (vẫn cho thêm/bớt, gộp theo item khi mạng phục hồi)'
  ],
  answer: 3,
  explain: `**Đáp án đúng: ví tiền chọn CP, giỏ hàng chọn AP.**

### Vì sao đúng
CAP chỉ buộc phải chọn **khi có partition**: hoặc từ chối request để giữ nhất quán (CP), hoặc tiếp tục phục vụ và chấp nhận lệch tạm thời (AP).
- **Số dư ví**: nếu cả hai DC cùng nhận lệnh rút, khách có thể rút hai lần trên cùng số tiền (double spend). Mất tiền là không thể sửa sau, nên phía mất quorum phải từ chối ghi; khách thấy lỗi tạm thời còn tốt hơn mất tiền.
- **Giỏ hàng**: thêm/bớt sản phẩm ở hai phía có thể gộp được (union theo item, hoặc dùng CRDT). Lỗi tệ nhất là món đã xoá xuất hiện lại, khách có thể tự xoá. Từ chối thêm vào giỏ thì mất doanh thu ngay lập tức. Đây chính là lý do Amazon Dynamo được thiết kế kiểu AP cho giỏ hàng.

### Vì sao các phương án khác sai
- **Cả hai AP**: ví tiền có thể bị double spend.
- **Cả hai CP**: giỏ hàng ngừng hoạt động 10 phút một cách không cần thiết.
- **Ví AP, giỏ CP**: đảo ngược đúng trade-off, chọn rủi ro mất tiền cho dữ liệu tiền và hy sinh availability cho dữ liệu chịu được lệch.

> Senior tip: nhắc thêm PACELC: ngay cả khi không có partition, vẫn phải chọn giữa latency và consistency (ví dụ ghi đồng bộ sang DC thứ hai tốn thêm 20–40 ms). Với ví, thường chọn mô hình một DC primary cho mỗi tài khoản thay vì active-active.`
},
{
  id: 'qz-design-016',
  topic: 'design',
  multi: true,
  q: 'Mở bán vé concert: 500.000 người vào cùng lúc, 20.000 ghế, khách được chọn chỗ và giữ chỗ 10 phút để thanh toán, tuyệt đối không bán trùng ghế. Những thành phần nào nên có? (Chọn 3)',
  options: [
    'Virtual waiting room: xếp hàng và chỉ cho một lượng người vừa đủ vào trang chọn ghế mỗi phút',
    'Kiểm tra ghế trống bằng SELECT rồi INSERT vé, không cần ràng buộc gì thêm vì đã có kiểm tra ở tầng ứng dụng',
    'Giữ chỗ bằng thao tác nguyên tử có hạn (ví dụ {{SET seat:eventId:seatId userId NX EX 600}} trên Redis, hoặc UPDATE có điều kiện trạng thái AVAILABLE)',
    'Khoá pessimistic toàn bộ bảng ghế của sự kiện trong mỗi transaction đặt chỗ',
    'Unique constraint trên (event_id, seat_id) ở bảng vé đã bán làm lớp bảo vệ cuối cùng'
  ],
  answer: [0, 2, 4],
  explain: `**Đáp án đúng: waiting room, giữ chỗ nguyên tử có TTL, và unique constraint ở DB.**

### Vì sao đúng
- **Waiting room**: 500.000 người chỉ tranh 20.000 ghế. Cho tất cả vào cùng lúc là tự tạo DDoS. Xếp hàng giúp hệ thống phía sau chỉ phải phục vụ vài nghìn người đồng thời, trải nghiệm cũng công bằng hơn (vào trước được chọn trước).
- **Giữ chỗ nguyên tử có TTL**: {{SET ... NX EX 600}} chỉ thành công cho người đầu tiên; hết 10 phút không thanh toán thì key tự hết hạn và ghế được mở lại, không cần job dọn dẹp. Cách tương đương trên DB: {{UPDATE seat SET status='HELD', held_until=... WHERE id=? AND status='AVAILABLE'}}.
- **Unique constraint**: nếu Redis failover làm mất key giữ chỗ, hai người có thể cùng tới bước thanh toán; constraint ở DB đảm bảo chỉ một vé được ghi, người còn lại được hoàn tiền tự động.

### Vì sao các phương án khác sai
- **SELECT rồi INSERT**: race check-then-act kinh điển, hai request cùng thấy ghế trống và cùng ghi.
- **Khoá toàn bảng ghế**: tuần tự hoá mọi lượt đặt chỗ của sự kiện, thông lượng sụp đổ đúng lúc tải cao nhất.

> Senior tip: hiển thị sơ đồ ghế từ cache có độ trễ 1–2 giây là chấp nhận được; chỉ thao tác giữ chỗ mới cần nhất quán mạnh. Tách rõ đường đọc (rẻ, cache) và đường ghi (nguyên tử) là chìa khoá của mọi bài toán bán vé.`
},
{
  id: 'qz-design-017',
  topic: 'design',
  q: 'Sàn thương mại điện tử cần autocomplete cho ô tìm kiếm: khoảng 10 triệu sản phẩm, 20.000 lượt gõ/giây lúc cao điểm, p99 dưới 50 ms, gợi ý theo độ phổ biến. Phương án nào phù hợp nhất?',
  options: [
    'Tính sẵn top-K gợi ý cho mỗi prefix (trie hoặc bảng prefix -> top-K) từ log tìm kiếm theo batch, phục vụ từ bộ nhớ/Redis; client debounce khoảng 150 ms và cache kết quả theo prefix',
    'Mỗi lượt gõ chạy {{SELECT name FROM product WHERE name LIKE :q || \'%\' ORDER BY sold DESC LIMIT 10}} trên PostgreSQL',
    'Mỗi lượt gõ chạy {{LIKE \'%\' || :q || \'%\'}} để bắt được cả từ ở giữa tên sản phẩm',
    'Dùng một model ML sinh gợi ý theo thời gian thực cho từng ký tự gõ'
  ],
  answer: 0,
  explain: `**Đáp án đúng: tính sẵn top-K cho mỗi prefix và phục vụ từ bộ nhớ.**

### Vì sao đúng
- Autocomplete là bài toán **đọc cực nhiều, dữ liệu thay đổi chậm**: độ phổ biến của từ khoá không cần cập nhật từng giây. Một job batch (mỗi giờ hoặc mỗi ngày) đọc log tìm kiếm, đếm tần suất, rồi với mỗi prefix lưu sẵn top 10 kết quả.
- Lúc phục vụ chỉ là một lookup O(độ dài prefix) trong trie hoặc một lệnh GET trên Redis, dễ đạt vài ms.
- Debounce phía client và cache theo prefix (CDN/trình duyệt) giảm số request thật xuống nhiều lần.

### Vì sao các phương án khác sai
- **LIKE prefix trên PostgreSQL**: có thể dùng B-tree với {{text_pattern_ops}}, nhưng ORDER BY độ phổ biến trên tập khớp lớn (prefix "a" khớp hàng triệu dòng) phải sort nhiều; 20.000 QPS dồn vào DB chính là quá tải.
- **LIKE '%q%'**: không dùng được B-tree index, phải scan toàn bảng 10 triệu dòng cho mỗi lượt gõ.
- **ML real-time cho từng ký tự**: latency và chi phí không phù hợp với p99 50 ms; ML (nếu có) chỉ nên dùng để xếp hạng trong batch hoặc cá nhân hoá trên tập ứng viên nhỏ.

> Senior tip: kết hợp hai nguồn: top-K toàn cục tính sẵn và một tầng nhỏ cho xu hướng nóng (trending trong 15 phút qua) cập nhật bằng stream. Nhớ lọc từ khoá nhạy cảm trước khi đưa vào danh sách gợi ý.`
},
{
  id: 'qz-design-018',
  topic: 'design',
  q: 'Sau khi chuyển các API đọc sang PostgreSQL read replica (replication lag thường 100–500 ms), user đổi địa chỉ giao hàng xong, trang reload lại vẫn hiện địa chỉ cũ. Cách xử lý phù hợp nhất?',
  options: [
    'Chuyển sang synchronous replication cho mọi replica để lag bằng 0',
    'Read-your-writes: sau khi user ghi, các lần đọc dữ liệu của chính user đó trong một khoảng ngắn (ví dụ vài giây, hoặc tới khi replica đã replay tới LSN của lần ghi) được route về primary',
    'Thêm {{Thread.sleep(1000)}} sau khi ghi để replica kịp đồng bộ',
    'Bỏ read replica, đưa toàn bộ traffic đọc về primary'
  ],
  answer: 1,
  explain: `**Đáp án đúng: đảm bảo read-your-writes cho chính người vừa ghi.**

### Vì sao đúng
- Người dùng chỉ khó chịu khi **không thấy thay đổi của chính mình**. Người khác thấy chậm vài trăm ms thì không ai nhận ra. Vì vậy chỉ cần đảm bảo nhất quán cho phiên của người vừa ghi.
- Cách làm: sau khi ghi, lưu mốc thời gian (hoặc LSN trả về từ {{pg_current_wal_lsn()}}) vào session/cookie; router đọc kiểm tra, nếu còn trong cửa sổ hoặc replica chưa replay tới LSN đó ({{pg_last_wal_replay_lsn()}}) thì đọc từ primary.
- Phần lớn traffic đọc vẫn đi replica, primary chỉ nhận thêm một phần rất nhỏ.

### Vì sao các phương án khác sai
- **Synchronous replication cho mọi replica**: mỗi commit phải chờ replica xác nhận, latency ghi tăng; replica chậm hoặc chết có thể làm treo ghi. Dù dùng {{synchronous_commit = remote_apply}} thì chi phí này áp lên mọi transaction chỉ để giải quyết vấn đề của một phiên.
- **sleep 1 giây**: lag không có trần cố định (lúc vacuum hoặc ghi nặng có thể vài giây), còn thread bị giữ vô ích.
- **Bỏ replica**: giải quyết triệu chứng bằng cách vứt bỏ khả năng scale đọc.

> Senior tip: với Spring, có thể dùng {{AbstractRoutingDataSource}} chọn primary/replica theo {{@Transactional(readOnly = true)}} kết hợp cờ "vừa ghi" trong request context. Luôn theo dõi metric replication lag và cảnh báo khi vượt 1–2 giây.`
},
{
  id: 'qz-design-019',
  topic: 'design',
  q: 'Bảng orders 2 tỉ dòng cần shard. 80% query là "đơn hàng của tôi" theo user_id, 20% là tra cứu theo order_id. Chọn shard key thế nào?',
  options: [
    'Shard theo created_at (mỗi tháng một shard) để dễ archive dữ liệu cũ',
    'Shard theo trạng thái đơn hàng (NEW, PAID, SHIPPED...) để tách tải',
    'Shard theo hash(user_id), và nhúng shard id (hoặc vài bit của user_id) vào order_id để tra theo order_id cũng tìm thẳng đúng shard',
    'Shard theo hash(order_id) để phân bố đều nhất, query theo user_id thì scatter-gather tới tất cả shard'
  ],
  answer: 2,
  explain: `**Đáp án đúng: shard theo user_id và mã hoá shard vào order_id.**

### Vì sao đúng
- Shard key nên khớp với **access pattern chính**: "đơn của tôi" chỉ đụng một shard, có thể phân trang và sort trong một DB.
- Tra cứu theo order_id (từ CSKH, webhook thanh toán) vẫn route được nếu order_id chứa shard id, ví dụ Snowflake-style ID dành 10 bit cho logical shard. Không cần bảng lookup toàn cục.
- Hash(user_id) phân bố đều; dùng logical shard (ví dụ 1.024 logical shard map lên 16 DB vật lý) để sau này tách DB mà không phải rehash.

### Vì sao các phương án khác sai
- **Theo created_at**: mọi ghi mới dồn vào shard của tháng hiện tại (hot shard); query "đơn của tôi" phải đi qua nhiều shard.
- **Theo trạng thái**: chỉ vài giá trị, phân bố lệch, và mỗi lần đổi trạng thái lại phải chuyển dòng sang shard khác.
- **Hash(order_id)**: ghi phân bố đều, nhưng 80% query (theo user_id) phải scatter-gather tới mọi shard; latency bằng shard chậm nhất và tải nhân theo số shard.

> Senior tip: chú ý những user cực lớn (merchant có hàng triệu đơn) có thể làm một shard nóng. Trước khi shard, hãy cân nhắc partition theo thời gian trong PostgreSQL + archive; nhiều hệ thống 2 tỉ dòng vẫn chạy tốt trên một cụm nếu index và archive hợp lý.`
},
{
  id: 'qz-design-020',
  topic: 'design',
  multi: true,
  q: 'Job scheduler: 5 pod Spring Boot cùng đọc bảng jobs (khoảng 50.000 job/ngày). Có job bị chạy 2–3 lần. Những cách nào chống chạy trùng một cách đúng đắn? (Chọn 2)',
  options: [
    'Mỗi worker claim job bằng {{SELECT ... FROM jobs WHERE status = \'PENDING\' ORDER BY run_at LIMIT 10 FOR UPDATE SKIP LOCKED}} rồi đánh dấu RUNNING trong cùng transaction',
    'Để {{@Scheduled}} chạy trên mọi pod nhưng thêm sleep ngẫu nhiên 0–5 giây để giảm xác suất trùng',
    'Cho mỗi pod một consumer group Kafka riêng để mỗi pod nhận đủ job',
    'Với job định kỳ dạng cron, dùng ShedLock (bảng khoá có lockAtMostFor) để chỉ một pod chạy mỗi lần kích hoạt, kết hợp job có tính idempotent',
    'Chỉ chạy scheduler trên pod có hostname kết thúc bằng -0'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: claim bằng FOR UPDATE SKIP LOCKED; và ShedLock cho job cron, kết hợp idempotent.**

### Vì sao đúng
- **SKIP LOCKED** (PostgreSQL 9.5+, MySQL 8.0+): mỗi worker khoá các dòng nó lấy, worker khác bỏ qua các dòng đang bị khoá thay vì chờ, nên 5 pod lấy 5 nhóm job khác nhau mà không đợi nhau. Đổi trạng thái sang RUNNING trong cùng transaction đảm bảo không ai claim lại.
- **ShedLock**: trước khi chạy, ghi một dòng khoá theo tên job với {{lock_until}}; pod khác thấy khoá còn hạn thì bỏ qua. {{lockAtMostFor}} đảm bảo khoá tự nhả nếu pod chết. Do khoá có thể hết hạn khi job chạy quá lâu, job vẫn nên idempotent.

### Vì sao các phương án khác sai
- **Sleep ngẫu nhiên**: chỉ giảm xác suất, không loại bỏ race; vẫn trùng khi tải cao hoặc job chạy lâu.
- **Mỗi pod một consumer group**: Kafka phát mọi message tới **mọi** consumer group, nên mỗi job chạy 5 lần, ngược hoàn toàn mục đích. Muốn chia việc phải dùng chung một group.
- **Chỉ pod -0 chạy**: tên kiểu {{-0}} chỉ có với StatefulSet; với Deployment thì tên ngẫu nhiên. Pod đó chết thì không job nào chạy (single point of failure).

> Senior tip: thêm cơ chế "reaper" trả các job RUNNING quá lâu (heartbeat cũ hơn N phút) về PENDING, và lưu attempt count để đẩy job lỗi nhiều lần vào trạng thái DEAD chờ người xử lý.`
},
// ===================== architecture =====================
{
  id: 'qz-architecture-007',
  topic: 'architecture',
  q: 'Trong một Spring bean, method {{importAll()}} (không có annotation) gọi {{this.saveBatch(batch)}}, còn {{saveBatch}} có {{@Transactional(propagation = REQUIRES_NEW)}}. Khi lỗi xảy ra, dữ liệu của các batch trước không được rollback/commit riêng như mong đợi. Vì sao?',
  options: [
    'REQUIRES_NEW chỉ hoạt động khi method là private',
    'Spring chỉ hỗ trợ REQUIRES_NEW với JTA, không hỗ trợ với DataSourceTransactionManager',
    'Transaction chỉ được tạo khi method được gọi từ controller',
    'Gọi qua {{this}} là self-invocation: lời gọi không đi qua proxy AOP nên annotation trên {{saveBatch}} bị bỏ qua; cần tách sang bean khác hoặc dùng {{TransactionTemplate}}'
  ],
  answer: 3,
  explain: `**Đáp án đúng: self-invocation bỏ qua proxy.**

### Vì sao đúng
Spring hiện thực {{@Transactional}} bằng **Proxy pattern**: bean được inject vào chỗ khác thực ra là một proxy (CGLIB subclass hoặc JDK dynamic proxy). Proxy mở transaction, rồi gọi method trên object thật. Khi đã ở bên trong object thật, {{this.saveBatch()}} là lời gọi Java bình thường tới chính object đó, không đi qua proxy, nên không có interceptor nào đọc annotation.
~~~java
@Service
class ImportService {
  private final BatchWriter writer;          // bean riêng -> đi qua proxy
  void importAll(List<List<Row>> batches) {
    for (var b : batches) writer.saveBatch(b); // mỗi batch một transaction mới
  }
}
~~~
Cách khác: dùng {{TransactionTemplate.execute(...)}} để quản lý transaction bằng code, rõ ràng và không phụ thuộc proxy.

### Vì sao các phương án khác sai
- **Chỉ hoạt động với private**: ngược lại, method private không thể bị proxy override nên annotation trên method private không có tác dụng (với proxy mode mặc định).
- **Chỉ hỗ trợ với JTA**: {{DataSourceTransactionManager}} và {{JpaTransactionManager}} đều hỗ trợ REQUIRES_NEW bằng cách suspend transaction hiện tại và lấy connection mới.
- **Chỉ từ controller**: transaction tạo ở bất kỳ lời gọi nào đi qua proxy, không liên quan tầng gọi.

> Senior tip: REQUIRES_NEW lấy thêm một connection trong khi connection cũ vẫn bị giữ; với pool 10 connection và 10 request đồng thời, có thể gây deadlock pool. Hãy cân nhắc kỹ trước khi dùng nó trong vòng lặp.`
},
{
  id: 'qz-architecture-008',
  topic: 'architecture',
  q: 'Aggregate {{Customer}} đang chứa {{List<Order>}} (khách VIP có 30.000 đơn). Mỗi lần thêm đơn phải load cả customer và gặp lỗi optimistic lock liên tục khi khách đặt từ nhiều thiết bị. Thiết kế lại theo DDD thế nào?',
  options: [
    'Tách Order thành aggregate riêng, tham chiếu Customer bằng {{customerId}}; mỗi transaction chỉ sửa một aggregate; quy tắc liên aggregate (như cập nhật hạng thành viên) xử lý bằng domain event, nhất quán cuối cùng',
    'Giữ nguyên nhưng chuyển {{List<Order>}} sang {{FetchType.LAZY}} là đủ',
    'Bỏ cột version để không còn lỗi optimistic lock',
    'Gộp Customer, Order và Payment vào cùng một aggregate lớn để đảm bảo mọi invariant trong một transaction'
  ],
  answer: 0,
  explain: `**Đáp án đúng: aggregate nhỏ, tham chiếu bằng id, liên kết qua domain event.**

### Vì sao đúng
- Aggregate là **ranh giới nhất quán**: mọi invariant bên trong được giữ trong một transaction, nên aggregate càng lớn thì càng nhiều tranh chấp. Thêm đơn hàng không cần khoá cả khách hàng.
- Quy tắc của Vaughn Vernon: thiết kế aggregate nhỏ, tham chiếu aggregate khác bằng id, mỗi transaction sửa một aggregate, dùng eventual consistency giữa các aggregate.
- Ví dụ: {{OrderPlaced}} event được phát; một handler cộng điểm và nâng hạng cho Customer trong transaction riêng. Vài giây trễ là chấp nhận được với nghiệp vụ.

### Vì sao các phương án khác sai
- **Chỉ đổi sang LAZY**: giảm chi phí load, nhưng không sửa ranh giới: Customer vẫn là aggregate root mà mọi lần thêm đơn phải đi qua và tranh chấp version; truy cập collection để thêm phần tử vẫn có thể khởi tạo cả 30.000 đơn.
- **Bỏ version**: lỗi biến mất vì giờ các thay đổi ghi đè nhau âm thầm (lost update), tệ hơn.
- **Gộp thành aggregate lớn**: nhân rộng đúng vấn đề đang gặp.

> Senior tip: khi phỏng vấn, hãy hỏi lại "invariant nào thực sự phải đúng ngay lập tức?". Thường câu trả lời là rất ít; phần còn lại có thể chấp nhận nhất quán cuối cùng.`
},
{
  id: 'qz-architecture-009',
  topic: 'architecture',
  q: 'Interface {{PaymentGateway}} có 3 implementation (VNPay, MoMo, ZaloPay). Bạn cần thêm đo latency và retry cho cả ba mà không sửa code từng implementation, client vẫn dùng đúng interface {{PaymentGateway}}. Pattern nào phù hợp nhất?',
  options: [
    'Adapter',
    'Decorator: một class cũng implement {{PaymentGateway}}, bọc một {{PaymentGateway}} khác và thêm hành vi trước/sau khi uỷ quyền',
    'Facade',
    'Abstract Factory'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Decorator.**

### Vì sao đúng
Decorator giữ **nguyên interface** và thêm hành vi bằng cách bọc:
~~~java
class MeteredGateway implements PaymentGateway {
  private final PaymentGateway inner;  // VNPay, MoMo... hoặc decorator khác
  private final Timer timer;
  public PayResult pay(PayRequest r) {
    return timer.record(() -> inner.pay(r)); // thêm đo latency, logic gốc giữ nguyên
  }
}
// ghép lớp: new RetryingGateway(new MeteredGateway(new VnPayGateway(...)))
~~~
Các decorator có thể xếp chồng theo thứ tự tuỳ ý, tuân thủ Open/Closed Principle.

### Vì sao các phương án khác sai
- **Adapter**: dùng để **đổi interface**, ví dụ chuyển SDK của MoMo (API riêng) thành {{PaymentGateway}} của bạn. Ở đây interface không đổi.
- **Facade**: cung cấp một interface **đơn giản hơn** cho một hệ thống con phức tạp (gộp nhiều bước), không phải để thêm hành vi xuyên suốt trên cùng interface.
- **Abstract Factory**: tạo ra các họ object liên quan, không thêm hành vi lúc runtime.

> Senior tip: trong Spring, đo latency và retry thường làm bằng AOP hoặc Resilience4j annotation, mà bản chất chính là decorator do proxy tạo ra. Viết decorator tay vẫn hữu ích khi cần kiểm soát thứ tự rõ ràng (ví dụ metric bọc ngoài retry để đo tổng thời gian, hay bọc trong để đo từng lần thử).`
},
{
  id: 'qz-architecture-010',
  topic: 'architecture',
  multi: true,
  q: 'Bạn dùng {{ApplicationEventPublisher}} để phát {{OrderPlacedEvent}} và xử lý bằng {{@TransactionalEventListener}} (gửi email xác nhận). Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Listener chạy bên trong cùng transaction với order, nên nếu gửi email lỗi thì order cũng rollback',
    'Phase mặc định là {{AFTER_COMMIT}}: listener chỉ chạy khi transaction phát event đã commit thành công',
    'Event được đảm bảo xử lý kể cả khi JVM crash ngay sau khi commit',
    'Nếu event được publish khi không có transaction nào đang chạy, listener mặc định không được gọi (trừ khi đặt {{fallbackExecution = true}})',
    'Listener luôn chạy trên một thread riêng'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: phase mặc định AFTER_COMMIT; và không có transaction thì listener bị bỏ qua trừ khi bật fallbackExecution.**

### Vì sao đúng
- {{@TransactionalEventListener}} đăng ký event vào transaction synchronization; tới đúng phase (mặc định {{AFTER_COMMIT}}) mới gọi listener. Nếu transaction rollback, email không bị gửi, đúng mong muốn "không gửi xác nhận cho đơn không tồn tại".
- Khi publish ngoài transaction, không có gì để đồng bộ nên Spring bỏ qua listener; {{fallbackExecution = true}} cho phép chạy ngay lập tức.

### Vì sao các phương án khác sai
- **Chạy trong cùng transaction và làm rollback order**: ở phase AFTER_COMMIT, transaction đã commit xong, exception của listener không thể rollback order nữa.
- **Đảm bảo kể cả khi JVM crash**: event chỉ nằm trong bộ nhớ. Crash giữa commit và lúc listener chạy thì event mất. Cần độ tin cậy thì dùng outbox (ghi event vào bảng trong cùng transaction) hoặc Spring Modulith Event Publication Registry.
- **Luôn chạy trên thread riêng**: mặc định chạy đồng bộ trên thread vừa commit; muốn async phải thêm {{@Async}}.

> Senior tip: trong listener AFTER_COMMIT, nếu cần ghi DB thì dùng {{REQUIRES_NEW}}, vì transaction cũ đã commit nhưng resource vẫn còn gắn với thread; ghi với REQUIRED có thể không được commit như bạn nghĩ.`
},
{
  id: 'qz-architecture-011',
  topic: 'architecture',
  q: 'Sáu tháng sau khi chọn Kafka thay vì RabbitMQ, team mới hỏi lý do và muốn đổi lại. Không ai nhớ đã cân nhắc những gì. Cách làm nào giúp tránh tình trạng này cho các quyết định sau?',
  options: [
    'Ghi quyết định vào một trang wiki chung, ai cũng có thể sửa nội dung khi bối cảnh thay đổi',
    'Để quyết định kiến trúc cho một người (architect) và mọi người hỏi trực tiếp khi cần',
    'Viết ADR ngắn lưu trong repo: context, các phương án đã cân nhắc, quyết định, hệ quả (cả mặt xấu); ADR không sửa nội dung mà được thay bằng ADR mới đánh dấu "superseded"',
    'Ghi lý do vào comment trong code của class producer Kafka'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Architecture Decision Record trong repo, bất biến, được supersede bằng ADR mới.**

### Vì sao đúng
- ADR (theo Michael Nygard) gồm: **Title, Status, Context, Decision, Consequences**. Nhiều team thêm phần "Options considered" để ghi phương án bị loại và lý do.
- Lưu trong repo (ví dụ {{docs/adr/0007-use-kafka.md}}) nên được review qua PR như code và có lịch sử git.
- Không sửa ADR cũ: khi bối cảnh đổi, viết ADR mới và đánh dấu ADR cũ là superseded. Nhờ vậy sau này vẫn biết **vì sao tại thời điểm đó** quyết định là hợp lý.
- Phần "Consequences" ghi cả mặt xấu (ví dụ "Kafka không có delay queue sẵn, retry phải tự làm") giúp team mới hiểu trade-off thay vì nghĩ quyết định cũ là sai lầm.

### Vì sao các phương án khác sai
- **Wiki ai cũng sửa được**: nội dung bị ghi đè, mất ngữ cảnh lịch sử, thường lệch với code.
- **Một architect giữ trong đầu**: bus factor bằng 1, người đó nghỉ là mất tri thức.
- **Comment trong class**: quyết định kiến trúc ảnh hưởng nhiều service, không thuộc về một class; comment không có chỗ ghi phương án đã loại.

> Senior tip: ADR nên ngắn, đọc trong 5 phút. Chỉ viết cho những quyết định khó đảo ngược (chọn broker, database, cách chia service), không viết cho chuyện chọn thư viện log.`
},
{
  id: 'qz-architecture-012',
  topic: 'architecture',
  q: 'Codebase đang biểu diễn tiền bằng {{double amount}} và {{String currency}} rải khắp nơi; đã có bug 0,1 + 0,2 lệch và cộng nhầm VND với USD. Bạn thiết kế lại thế nào?',
  options: [
    'Đổi {{double}} sang {{float}} để tiết kiệm bộ nhớ và làm tròn khi hiển thị',
    'Tạo entity {{Money}} có id riêng trong DB và các setter để cập nhật số tiền',
    'Dùng {{long}} lưu số tiền nhân 100 cho mọi loại tiền, bỏ field currency',
    'Tạo value object {{Money}} bất biến (ví dụ Java {{record}}) gồm {{BigDecimal}} và {{Currency}}; các phép cộng/trừ kiểm tra cùng currency, so sánh theo giá trị và chuẩn hoá scale'
  ],
  answer: 3,
  explain: `**Đáp án đúng: value object Money bất biến với BigDecimal + Currency.**

### Vì sao đúng
- **Value object**: không có danh tính, hai Money cùng số tiền và currency là bằng nhau; bất biến nên chia sẻ an toàn giữa các thread.
- Đóng gói quy tắc nghiệp vụ trong một chỗ, loại bỏ "primitive obsession":
~~~java
record Money(BigDecimal amount, Currency currency) {
  Money {
    amount = amount.setScale(currency.getDefaultFractionDigits(), RoundingMode.HALF_EVEN);
  }
  Money plus(Money o) {
    if (!currency.equals(o.currency)) throw new IllegalArgumentException("Khác loại tiền");
    return new Money(amount.add(o.amount), currency);
  }
}
~~~
- Chuẩn hoá scale trong constructor rất quan trọng: {{BigDecimal.equals}} so sánh cả scale ({{2.0}} khác {{2.00}}), nên không chuẩn hoá thì equals của record sẽ sai.

### Vì sao các phương án khác sai
- **float**: vẫn là số nhị phân dấu phẩy động, còn kém chính xác hơn double.
- **Entity có id và setter**: tiền không có danh tính; setter làm object mutable, dễ bị sửa ngoài ý muốn khi được chia sẻ.
- **long x 100, bỏ currency**: không phải tiền nào cũng có 2 chữ số thập phân (VND là 0, một số đồng tiền là 3), và bỏ currency chính là nguyên nhân lỗi cộng VND với USD.

> Senior tip: lưu DB bằng {{NUMERIC(19,4)}} kèm cột currency, map bằng {{@Embeddable}} trong JPA. Luôn chỉ định {{RoundingMode}} khi chia; không chỉ định thì {{divide}} có thể ném {{ArithmeticException}} với số thập phân vô hạn.`
},
{
  id: 'qz-architecture-013',
  topic: 'architecture',
  q: 'Class {{Product}} dùng chung cho Catalog, Inventory và Shipping đã có 60 field; mỗi team sửa đều làm vỡ team khác. Hướng xử lý theo DDD là gì?',
  options: [
    'Tách bounded context: mỗi context có model Product riêng chỉ chứa field nó cần (Catalog: mô tả, ảnh; Inventory: tồn kho theo kho; Shipping: cân nặng, kích thước), liên kết bằng productId và dịch dữ liệu qua context mapping',
    'Giữ một model Product chuẩn duy nhất (canonical model) cho toàn công ty và lập hội đồng duyệt mọi thay đổi',
    'Chuyển Product sang kế thừa: {{CatalogProduct extends Product}}, {{InventoryProduct extends Product}}',
    'Đổi tất cả field sang kiểu {{Map<String, Object>}} để không team nào phải sửa class'
  ],
  answer: 0,
  explain: `**Đáp án đúng: tách bounded context, mỗi context một model riêng.**

### Vì sao đúng
- Cùng một từ "Product" có **ý nghĩa khác nhau** trong từng ngữ cảnh. Bounded context là ranh giới trong đó một thuật ngữ có một nghĩa duy nhất (ubiquitous language).
- Mỗi context giữ model gọn, chỉ đổi khi nghiệp vụ của chính nó đổi, nên các team độc lập.
- Dữ liệu dùng chung (productId, tên) được đồng bộ qua event hoặc API; khi tích hợp với model bên ngoài thì dùng anti-corruption layer để dịch.

### Vì sao các phương án khác sai
- **Canonical model toàn công ty**: chính là tình trạng hiện tại cộng thêm quy trình chậm; mọi thay đổi vẫn ảnh hưởng mọi người.
- **Kế thừa**: lớp cha Product vẫn là điểm chung bị sửa bởi mọi team, và kế thừa tạo coupling chặt hơn; ba lớp con thật ra không phải "is-a" mà là các góc nhìn khác nhau.
- **Map<String, Object>**: mất type safety, lỗi chuyển từ compile time sang runtime, không ai biết field nào đang được dùng.

> Senior tip: vẽ context map (Customer/Supplier, Conformist, ACL, Shared Kernel) trước khi chia service. Ranh giới bounded context thường là ứng viên tốt cho ranh giới microservice hoặc module.`
},
{
  id: 'qz-architecture-014',
  topic: 'architecture',
  q: 'Team chọn modular monolith với Spring Modulith. Làm sao phát hiện sớm khi module {{order}} gọi thẳng vào class trong package nội bộ của module {{inventory}} hoặc tạo phụ thuộc vòng?',
  options: [
    'Review code thật kỹ, không cần công cụ',
    'Viết test gọi {{ApplicationModules.of(Application.class).verify()}}; Spring Modulith coi package con trực tiếp của package gốc là module, chỉ package gốc của module là API công khai, và test fail khi có truy cập package nội bộ hoặc vòng phụ thuộc',
    'Tách mỗi module thành một microservice riêng để compiler tự ngăn',
    'Đánh dấu tất cả class là {{public}} để dễ gọi chéo'
  ],
  answer: 1,
  explain: `**Đáp án đúng: kiểm tra cấu trúc bằng {{ApplicationModules.verify()}} trong test.**

### Vì sao đúng
- Spring Modulith suy ra module từ cấu trúc package: mỗi package con trực tiếp của package chứa class {{@SpringBootApplication}} là một module. Type nằm ở package gốc của module là API; các package con bên trong mặc định là internal.
- {{verify()}} dùng ArchUnit để kiểm tra: không có vòng phụ thuộc giữa module, không truy cập type internal của module khác. Chạy trong CI nên vi phạm bị chặn ngay ở PR.
~~~java
@Test
void verifiesModularStructure() {
  ApplicationModules.of(Application.class).verify();
}
~~~
- Module giao tiếp qua API công khai hoặc qua event ({{@ApplicationModuleListener}}), sau này tách thành service sẽ dễ hơn.

### Vì sao các phương án khác sai
- **Chỉ review code**: con người bỏ sót, nhất là khi codebase lớn và nhiều team; kiến trúc "mục" dần mà không ai thấy.
- **Tách ngay thành microservice**: đổi lấy chi phí vận hành phân tán (network, deploy, dữ liệu phân tán) chỉ để có ranh giới, trong khi modular monolith ra đời chính để có ranh giới mà chưa cần trả chi phí đó.
- **Đánh dấu tất cả public**: phá bỏ hoàn toàn khả năng đóng gói của Java.

> Senior tip: Spring Modulith còn sinh tài liệu module (C4/PlantUML) và hỗ trợ {{@ApplicationModuleTest}} để test từng module độc lập, rất hữu ích khi chứng minh với team rằng ranh giới đang được giữ.`
},
{
  id: 'qz-architecture-015',
  topic: 'architecture',
  multi: true,
  q: 'Bạn dẫn dắt chuyển một monolith 500k dòng sang kiến trúc mới theo strangler fig, hệ thống vẫn phải chạy và ra tính năng hằng tháng. Những cách làm nào đúng tinh thần strangler fig? (Chọn 2)',
  options: [
    'Đặt một lớp routing (API gateway/reverse proxy) phía trước, chuyển dần từng endpoint hoặc từng luồng nghiệp vụ sang hệ mới, có thể quay lại hệ cũ nếu lỗi',
    'Đóng băng tính năng 12 tháng để viết lại toàn bộ rồi cutover một lần',
    'Dùng anti-corruption layer giữa hệ mới và monolith để model của hệ mới không bị nhiễm model cũ',
    'Cho service mới và monolith cùng ghi vào các bảng cũ vô thời hạn, không phân định ai sở hữu dữ liệu',
    'Bắt đầu bằng phần lõi phức tạp và rủi ro nhất (ví dụ tính tiền) để chứng minh kiến trúc mới'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: routing chuyển dần từng phần; và anti-corruption layer.**

### Vì sao đúng
- **Routing tăng dần**: strangler fig là "bóp nghẹt" hệ cũ từng chút. Proxy phía trước cho phép chuyển {{/catalog/**}} sang service mới, đo kết quả, rồi tiếp tục; lỗi thì đổi route về. Mỗi bước nhỏ, có thể đảo ngược, giá trị được giao liên tục.
- **ACL**: hệ mới gọi monolith (hoặc nghe event của nó) qua một lớp dịch. Model hệ mới được thiết kế sạch theo domain, không mang theo các khái niệm méo mó của hệ cũ.

### Vì sao các phương án khác sai
- **Đóng băng 12 tháng, cutover một lần**: đây là big-bang rewrite, rủi ro cao nhất; business không chờ được, hệ mới lại phải đuổi theo tính năng của hệ cũ.
- **Cùng ghi bảng cũ vô thời hạn**: hai hệ ghi chung dữ liệu nghĩa là vẫn coupling ở tầng DB; cần chuyển quyền sở hữu dữ liệu cho hệ mới (đồng bộ tạm qua CDC), có điểm kết thúc rõ ràng.
- **Bắt đầu từ phần lõi rủi ro nhất**: nên bắt đầu từ phần ít phụ thuộc, giá trị rõ, rủi ro thấp (ví dụ notification, catalog đọc) để team học cách làm và dựng hạ tầng trước.

> Senior tip: đặt metric "phần trăm traffic đã đi qua hệ mới" và mốc tắt từng phần của monolith. Không có mốc tắt, dự án strangler rất dễ thành hai hệ thống song song mãi mãi.`
},
{
  id: 'qz-architecture-016',
  topic: 'architecture',
  q: 'Order service phát event {{OrderUpdated(orderId)}}. 8 service consumer nhận event rồi đều gọi ngược {{GET /orders/:id}} để lấy chi tiết, khiến Order service nhận thêm 10.000 RPS lúc cao điểm. Hướng xử lý hợp lý?',
  options: [
    'Thêm cache Redis trước API của Order service là xong, không cần đổi event',
    'Chuyển sang gọi REST đồng bộ từ Order tới 8 service thay cho event',
    'Chuyển sang event-carried state transfer: event mang đủ dữ liệu consumer cần (trạng thái, tổng tiền, items...) kèm version; consumer lưu bản sao cục bộ và không phải gọi ngược',
    'Giảm số consumer xuống còn 2 service'
  ],
  answer: 2,
  explain: `**Đáp án đúng: event-carried state transfer.**

### Vì sao đúng
- Event chỉ chứa id là kiểu **event notification**: nhẹ, nhưng mọi consumer phải gọi lại producer, tạo tải tỉ lệ với số consumer và **coupling lúc runtime** (Order chết thì 8 service cũng không xử lý được).
- Event mang trạng thái giúp consumer tự đủ dữ liệu, lưu bản sao (read model) và xử lý kể cả khi Order đang lỗi. Version hoặc sequence number trong event cho phép bỏ qua event cũ đến muộn.
- Trade-off: event lớn hơn, schema event thành hợp đồng phải quản lý (Schema Registry, compatibility), và consumer chấp nhận dữ liệu nhất quán cuối cùng.

### Vì sao các phương án khác sai
- **Chỉ thêm cache**: giảm tải DB của Order nhưng 10.000 RPS vẫn vào service; dữ liệu cache có thể cũ hơn event (consumer đọc phải giá trị trước khi cập nhật), và coupling runtime vẫn còn.
- **REST đồng bộ từ Order tới 8 service**: Order phải biết mọi consumer, một service chậm làm chậm Order; đi ngược lợi ích của event-driven.
- **Giảm consumer**: các service đó cần dữ liệu cho nghiệp vụ; cắt bỏ là thay đổi yêu cầu chứ không phải giải pháp.

> Senior tip: đừng nhét toàn bộ entity vào event. Thiết kế event theo nhu cầu của consumer và theo ngôn ngữ domain ({{OrderPaid}}, {{OrderShipped}}) thay vì một event chung chung {{OrderUpdated}}, consumer sẽ dễ hiểu ý định hơn.`
},
{
  id: 'qz-architecture-017',
  topic: 'architecture',
  q: 'Luồng duyệt khoản vay có 8 bước kiểm tra (KYC, blacklist, điểm tín dụng, hạn mức...). Mỗi bước có thể dừng luồng và trả lý do từ chối; thứ tự và danh sách bước thay đổi theo sản phẩm vay. Pattern nào phù hợp nhất?',
  options: [
    'Singleton chứa một method dài với 8 khối if',
    'Observer: phát event cho 8 listener chạy song song',
    'Template Method: lớp cha cố định 8 bước, lớp con override từng bước',
    'Chain of Responsibility: mỗi rule là một handler cùng interface, chuỗi được lắp theo cấu hình từng sản phẩm, handler có thể dừng chuỗi và trả lý do'
  ],
  answer: 3,
  explain: `**Đáp án đúng: Chain of Responsibility.**

### Vì sao đúng
~~~java
interface LoanRule { Optional<String> check(LoanApplication app); } // empty = qua

class RuleChain {
  private final List<LoanRule> rules; // lắp theo cấu hình sản phẩm
  Optional<String> evaluate(LoanApplication app) {
    for (LoanRule r : rules) {
      Optional<String> reject = r.check(app);
      if (reject.isPresent()) return reject; // dừng sớm, trả lý do
    }
    return Optional.empty();
  }
}
~~~
- Mỗi rule nhỏ, test độc lập; thêm rule mới không sửa rule cũ (Open/Closed).
- Danh sách và thứ tự lắp được từ cấu hình (trong Spring có thể inject {{List<LoanRule>}} rồi lọc/sắp theo sản phẩm). Đặt rule rẻ (blacklist) trước rule đắt (gọi bureau tín dụng) để tiết kiệm chi phí.

### Vì sao các phương án khác sai
- **Một method dài với 8 if**: khó test, khó đổi thứ tự theo sản phẩm, mọi thay đổi đều đụng một chỗ.
- **Observer**: listener chạy độc lập, không có khái niệm "dừng chuỗi" hay thứ tự phụ thuộc; khó gom một kết quả duyệt duy nhất.
- **Template Method**: cố định khung thuật toán ở lớp cha, tốt khi các bước luôn giống nhau; ở đây danh sách bước thay đổi theo sản phẩm, dùng kế thừa sẽ sinh ra nhiều lớp con.

> Senior tip: nếu rule do nghiệp vụ tự sửa thường xuyên, cân nhắc rule engine hoặc lưu rule dạng dữ liệu; nhưng với 8–15 rule ổn định thì Java thuần + Chain of Responsibility dễ debug và review hơn nhiều.`
},
{
  id: 'qz-architecture-018',
  topic: 'architecture',
  q: 'Dự án hexagonal sau 2 năm: class trong package {{domain}} bắt đầu import {{jakarta.persistence}} và {{org.springframework}}. Cách bền vững nhất để giữ ranh giới?',
  options: [
    'Viết test ArchUnit, ví dụ {{noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAnyPackage("jakarta.persistence..", "org.springframework..")}}, chạy trong CI',
    'Ghi quy tắc vào README và nhắc lại trong buổi họp team',
    'Gộp domain và adapter vào cùng package để hết vi phạm',
    'Chuyển sang layered architecture vì hexagonal quá khó giữ'
  ],
  answer: 0,
  explain: `**Đáp án đúng: kiểm tra ranh giới bằng test ArchUnit trong CI.**

### Vì sao đúng
- Quy tắc kiến trúc được biến thành **test tự động**: ai vi phạm thì build đỏ ngay tại PR, kèm thông báo class nào phụ thuộc class nào. Đây là "fitness function" của kiến trúc tiến hoá.
- Domain không phụ thuộc framework giúp test domain thuần Java (nhanh, không cần Spring context), và đổi tầng persistence không ảnh hưởng nghiệp vụ.
- Có thể thêm luật khác: adapter không gọi lẫn nhau, controller không gọi thẳng repository, không có vòng phụ thuộc giữa các slice.

### Vì sao các phương án khác sai
- **README và nhắc nhở**: quy tắc không được thực thi thì sớm muộn sẽ bị vi phạm khi deadline gấp hoặc có người mới.
- **Gộp package**: xoá vi phạm bằng cách xoá luôn kiến trúc.
- **Bỏ hexagonal**: có thể là quyết định hợp lý nếu dự án đơn giản, nhưng không giải quyết câu hỏi "giữ ranh giới"; layered cũng cần luật (không gọi ngược tầng) và cũng mục nếu không được kiểm tra.

> Senior tip: khi áp ArchUnit lên codebase đã có vi phạm, dùng {{FreezingArchRule}} để ghi lại vi phạm hiện có, chỉ chặn vi phạm mới, rồi trả nợ dần thay vì phải sửa hết ngay.`
},
{
  id: 'qz-architecture-019',
  topic: 'architecture',
  multi: true,
  q: 'SaaS 2.000 tenant nhỏ, dùng chung bảng có cột {{tenant_id}} và PostgreSQL Row-Level Security (policy so {{tenant_id}} với {{current_setting(\'app.tenant_id\')}}). Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Schema-per-tenant với 2.000 schema có chi phí migration không đổi so với một schema',
    'Với connection pool, phải đặt tenant bằng {{SET LOCAL}} (hoặc {{set_config(..., true)}}) trong mỗi transaction, nếu không giá trị cũ có thể còn sót lại trên connection cho request của tenant khác',
    'RLS không tốn chi phí gì và không cần index trên tenant_id',
    'Owner của bảng mặc định bỏ qua RLS; cần {{ALTER TABLE ... FORCE ROW LEVEL SECURITY}} (và app không chạy bằng superuser hay role có BYPASSRLS) thì policy mới áp lên user đó',
    'Database-per-tenant là phương án rẻ nhất cho 2.000 tenant nhỏ'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: dùng SET LOCAL theo transaction; và owner/superuser bỏ qua RLS nếu không FORCE.**

### Vì sao đúng
- **SET LOCAL**: connection trong pool được tái sử dụng giữa các request. {{SET app.tenant_id = ...}} (không LOCAL) sống tới khi connection đóng, nên request sau của tenant khác có thể "thừa hưởng" giá trị cũ nếu code quên set lại; đây là lỗi rò dữ liệu nghiêm trọng. {{SET LOCAL}} tự hết hiệu lực khi transaction kết thúc.
- **Owner bỏ qua RLS**: theo tài liệu PostgreSQL, superuser và role có BYPASSRLS luôn bỏ qua; owner của bảng cũng bỏ qua trừ khi bảng bật FORCE ROW LEVEL SECURITY. Nhiều team test với user migration (là owner) nên tưởng RLS đang chạy.

### Vì sao các phương án khác sai
- **Schema-per-tenant migration không đổi**: mỗi migration phải chạy 2.000 lần; một schema lỗi giữa chừng tạo trạng thái lệch; catalog phình to làm chậm.
- **RLS không tốn chi phí, không cần index**: policy thực chất là điều kiện WHERE thêm vào mọi query; không có index (thường là index ghép bắt đầu bằng tenant_id) thì query sẽ scan nhiều.
- **Database-per-tenant rẻ nhất**: 2.000 database nghĩa là 2.000 lần backup, monitoring, connection pool; đắt nhất về vận hành, chỉ hợp với số ít tenant lớn cần cô lập mạnh.

> Senior tip: mô hình phổ biến là hybrid: shared schema + RLS cho tenant nhỏ, database riêng cho vài tenant enterprise trả tiền cho sự cô lập. Viết test tích hợp chứng minh tenant A không đọc được dữ liệu tenant B.`
},
{
  id: 'qz-architecture-020',
  topic: 'architecture',
  q: 'Code review gặp singleton lazy dùng double-checked locking: {{private static Config instance;}} (không có {{volatile}}), kiểm tra null, vào {{synchronized}}, kiểm tra lại rồi {{instance = new Config()}}. Vấn đề là gì và cách sửa gọn nhất?',
  options: [
    'Không có vấn đề, synchronized đã đảm bảo an toàn hoàn toàn',
    'Thiếu volatile nên thread khác (đọc ở lần kiểm tra đầu, ngoài synchronized) có thể thấy tham chiếu khác null trỏ tới object chưa khởi tạo xong; sửa bằng volatile, hoặc gọn hơn là holder idiom / enum singleton',
    'Vấn đề là synchronized quá chậm; nên bỏ hẳn synchronized và chỉ kiểm tra null một lần',
    'Vấn đề là GC có thể thu hồi instance static bất cứ lúc nào'
  ],
  answer: 1,
  explain: `**Đáp án đúng: thiếu volatile gây lộ object khởi tạo dở; dùng volatile hoặc holder idiom.**

### Vì sao đúng
- {{instance = new Config()}} gồm: cấp phát bộ nhớ, chạy constructor, gán tham chiếu. Theo Java Memory Model, không có quan hệ happens-before giữa thread ghi (trong synchronized) và thread đọc ở lần kiểm tra đầu (ngoài synchronized), nên thread đọc có thể thấy tham chiếu đã gán nhưng field bên trong vẫn là giá trị mặc định.
- {{volatile}} tạo happens-before giữa lần ghi và lần đọc, sửa được lỗi. Gọn hơn nữa:
~~~java
class Config {
  private Config() { /* load */ }
  private static class Holder { static final Config INSTANCE = new Config(); }
  static Config get() { return Holder.INSTANCE; } // JVM đảm bảo khởi tạo lazy và thread-safe
}
~~~
Enum singleton còn chống được việc tạo thêm instance qua reflection và serialization.

### Vì sao các phương án khác sai
- **synchronized đã đủ**: chỉ đúng nếu **mọi** lần đọc đều trong synchronized; lần kiểm tra đầu nằm ngoài nên không được bảo vệ.
- **Bỏ synchronized**: hai thread cùng thấy null và tạo hai instance.
- **GC thu hồi static**: object được tham chiếu bởi field static của class đã load không bị thu hồi khi class loader còn sống.

> Senior tip: trong ứng dụng Spring, hầu như không cần tự viết singleton: bean mặc định là singleton scope và được container quản lý, dễ thay bằng mock khi test.`
},
// ===================== microservices =====================
{
  id: 'qz-microservices-007',
  topic: 'microservices',
  q: 'Chuỗi gọi: client -> A -> B -> C. Client thử tối đa 3 lần, A gọi B tối đa 3 lần, B gọi C tối đa 3 lần (tính cả lần đầu). Khi C chết hẳn, một thao tác của người dùng sinh ra tối đa bao nhiêu lời gọi tới C?',
  options: [
    '3',
    '9',
    '27',
    '81'
  ],
  answer: 2,
  explain: `**Đáp án đúng: 27 lời gọi (3 x 3 x 3).**

### Vì sao đúng
Retry ở nhiều tầng **nhân** với nhau:
~~~text
client: 3 lần gọi A
  mỗi lần A: 3 lần gọi B          -> 9 lần B
    mỗi lần B: 3 lần gọi C        -> 27 lần C
~~~
Đúng lúc C đang quá tải hoặc vừa khởi động lại, nó nhận lượng tải gấp 27 lần: đây là **retry storm**, biến sự cố nhỏ thành cascading failure. Thêm vào đó, mỗi tầng chờ timeout của mình nên client chờ rất lâu cho một kết quả chắc chắn thất bại.

### Vì sao các phương án khác sai
- **3**: chỉ tính retry ở một tầng.
- **9**: bỏ quên retry ở client (hoặc ở một tầng service).
- **81**: nhân thêm một tầng không tồn tại.

### Cách thiết kế đúng
- Chỉ retry ở **một tầng** (thường là tầng gần lỗi nhất, hoặc ở edge), các tầng khác fail fast.
- Retry có exponential backoff + jitter và **retry budget** (ví dụ retry tối đa 10% số request).
- Circuit breaker để ngừng gọi C khi tỉ lệ lỗi cao.
- **Deadline propagation**: truyền thời hạn còn lại qua header; tầng dưới thấy hết thời gian thì không gọi nữa.

> Senior tip: kiểm tra cả retry ẩn trong thư viện: HTTP client, SDK AWS, driver DB và service mesh (Istio) đều có thể tự retry. Nhiều sự cố retry storm xảy ra vì hai lớp retry được bật mà không ai biết.`
},
{
  id: 'qz-microservices-008',
  topic: 'microservices',
  q: 'Consumer Kafka dùng cấu hình mặc định ({{max.poll.records=500}}, {{max.poll.interval.ms=300000}}). Mỗi record cần gọi API mất khoảng 1 giây. Log liên tục báo consumer rời group, rebalance và nhiều record bị xử lý lại. Nguyên nhân khả dĩ nhất?',
  options: [
    'session.timeout.ms quá nhỏ nên heartbeat không kịp gửi',
    'Topic có quá nhiều partition',
    'Broker hết dung lượng đĩa',
    'Xử lý 500 record mất khoảng 500 giây, vượt max.poll.interval.ms 5 phút giữa hai lần {{poll()}}, nên consumer bị coi là chết và bị đá khỏi group; offset chưa commit nên batch bị xử lý lại'
  ],
  answer: 3,
  explain: `**Đáp án đúng: thời gian xử lý một batch vượt max.poll.interval.ms.**

### Vì sao đúng
- Từ Kafka 0.10.1, heartbeat được gửi bằng thread nền, còn **max.poll.interval.ms** kiểm tra riêng việc app có tiếp tục gọi {{poll()}} hay không. 500 record x 1 giây = 500 giây > 300 giây, consumer chủ động rời group, partition được giao cho consumer khác.
- Offset của batch đang xử lý chưa được commit, nên consumer mới đọc lại từ offset cũ: xử lý trùng, rồi lại timeout, tạo vòng lặp rebalance.

Cách sửa (chọn một hoặc kết hợp):
- Giảm {{max.poll.records}} (ví dụ 50) để một batch xong trong khoảng 50 giây.
- Tăng {{max.poll.interval.ms}} nếu thời gian xử lý thật sự dài.
- Xử lý song song trong partition một cách cẩn thận, hoặc tăng số partition và consumer.
- Consumer phải idempotent vì xử lý lại là điều chắc chắn sẽ xảy ra.

### Vì sao các phương án khác sai
- **session.timeout.ms quá nhỏ**: heartbeat chạy ở thread riêng nên không bị việc xử lý chậm chặn; triệu chứng "xử lý chậm thì bị đá" đặc trưng cho max.poll.interval.ms.
- **Nhiều partition**: không gây consumer rời group.
- **Broker hết đĩa**: lỗi nằm ở phía producer/broker (ghi thất bại), không gây rebalance phía consumer.

> Senior tip: theo dõi metric {{time-between-poll-avg}}/{{time-between-poll-max}} của consumer và log lý do rời group. Đặt max.poll.records theo công thức: thời gian xử lý p99 mỗi record x số record nhỏ hơn khoảng 50% max.poll.interval.ms.`
},
{
  id: 'qz-microservices-009',
  topic: 'microservices',
  q: 'Producer Kafka 3.x giữ cấu hình mặc định. Broker leader chậm trả ACK, producer tự retry gửi lại cùng một batch. Message có bị ghi trùng vào partition không?',
  options: [
    'Không: từ Kafka 3.0 mặc định {{enable.idempotence=true}} và {{acks=all}}, broker dùng producer id + sequence number để loại batch gửi lại; nhưng nếu ứng dụng tự gọi {{send()}} lần nữa (ví dụ sau khi restart) thì vẫn có thể trùng',
    'Có: Kafka luôn ghi trùng khi retry, cần bật transaction mới tránh được',
    'Không, vì mặc định acks=0 nên producer không bao giờ retry',
    'Có, vì idempotence chỉ được bật khi đặt max.in.flight.requests.per.connection=1'
  ],
  answer: 0,
  explain: `**Đáp án đúng: idempotent producer mặc định chặn trùng do retry nội bộ, nhưng không chặn việc app tự gửi lại.**

### Vì sao đúng
- KIP-679 (Kafka 3.0) đổi mặc định của producer thành {{enable.idempotence=true}} và {{acks=all}}.
- Mỗi producer có một producer id (PID); mỗi batch gửi tới một partition mang sequence number tăng dần. Broker nhớ sequence gần nhất theo (PID, partition); batch gửi lại có sequence đã thấy thì broker trả thành công mà không ghi thêm.
- Giới hạn: PID mới được cấp khi producer khởi động lại. Nếu app crash rồi gửi lại message từ đầu thì đó là một lần {{send()}} mới, broker không nhận ra là trùng. Muốn chống trùng end-to-end cần idempotency ở consumer (theo business key) hoặc dùng transactional producer.

### Vì sao các phương án khác sai
- **Luôn ghi trùng, cần transaction**: transaction dùng cho ghi nguyên tử nhiều partition và consume-transform-produce; trùng do retry nội bộ đã được idempotence xử lý.
- **Mặc định acks=0**: sai, mặc định là acks=all từ 3.0 (trước đó là 1).
- **Cần max.in.flight=1**: idempotence giữ thứ tự với tối đa 5 request in-flight mỗi connection; không cần giảm về 1.

> Senior tip: nếu bạn tự đặt cấu hình xung đột (ví dụ {{acks=1}}) thì idempotence không được bật như mong đợi; hãy kiểm tra log cấu hình producer khi khởi động thay vì tin vào "mặc định".`
},
{
  id: 'qz-microservices-010',
  topic: 'microservices',
  q: 'Saga đặt hàng (orchestration): bước 1 giữ tồn kho thành công, bước 2 trừ tiền thất bại vì thẻ hết hạn. Orchestrator cần làm gì và compensating action phải có tính chất nào?',
  options: [
    'Rollback transaction phân tán của Inventory bằng 2PC',
    'Gọi compensating action "nhả tồn kho" cho bước 1; compensation phải idempotent và có thể retry vì lời gọi có thể bị lặp hoặc timeout; trạng thái saga được lưu bền để tiếp tục sau khi orchestrator restart',
    'Không làm gì, để job dọn dẹp cuối ngày tự nhả tồn kho',
    'Xoá bản ghi giữ tồn kho trực tiếp trong database của Inventory service'
  ],
  answer: 1,
  explain: `**Đáp án đúng: chạy compensation idempotent cho các bước đã thành công, trạng thái saga lưu bền.**

### Vì sao đúng
- Saga là chuỗi **local transaction**, mỗi bước đã commit ở service của nó. Không có rollback thật, chỉ có hành động bù trừ về mặt nghiệp vụ: "nhả tồn kho" bù cho "giữ tồn kho".
- Compensation có thể bị gọi nhiều lần (orchestrator timeout rồi retry, message trùng), nên phải idempotent: ví dụ nhả theo {{reservationId}}, lần thứ hai thấy đã nhả thì trả OK.
- Orchestrator lưu state machine (STARTED, INVENTORY_RESERVED, PAYMENT_FAILED, COMPENSATING, CANCELLED) vào DB; nếu nó crash giữa chừng thì khởi động lại vẫn biết phải làm tiếp bước nào.

### Vì sao các phương án khác sai
- **2PC**: saga tồn tại chính vì 2PC không phù hợp giữa microservice (khoá tài nguyên trong lúc chờ, coordinator là điểm chết, nhiều hệ không hỗ trợ XA). Bước 1 đã commit, không còn gì để 2PC rollback.
- **Chờ job cuối ngày**: tồn kho bị giữ vô ích nhiều giờ, khách khác không mua được; nên dùng compensation ngay, job dọn dẹp chỉ là lưới an toàn.
- **Ghi thẳng vào DB của Inventory**: phá vỡ quyền sở hữu dữ liệu, bỏ qua logic nghiệp vụ và event của Inventory service.

> Senior tip: thiết kế bước có khả năng thất bại cao nhất (thanh toán) càng sớm càng tốt, và bước không thể bù trừ (gửi hàng, gửi email) để cuối cùng. Thứ tự bước tốt làm giảm đáng kể số lần phải compensate.`
},
{
  id: 'qz-microservices-011',
  topic: 'microservices',
  multi: true,
  q: 'Service Spring Boot 3 trên Kubernetes mất khoảng 90 giây để khởi động (warm-up cache). Khi DB chập chờn 2 phút, toàn bộ pod bị restart liên tục. Những cấu hình probe nào đúng? (Chọn 2)',
  options: [
    'Liveness probe chỉ phản ánh trạng thái nội bộ của app ({{/actuator/health/liveness}}), không kiểm tra DB hay dịch vụ ngoài',
    'Dùng chung một endpoint kiểm tra cả DB cho liveness và readiness để đơn giản',
    'Khi liveness probe fail, pod chỉ bị gỡ khỏi Service endpoints chứ không bị restart',
    'Dùng startupProbe (ví dụ {{failureThreshold: 30}}, {{periodSeconds: 5}}) cho giai đoạn khởi động 90 giây thay vì đặt initialDelaySeconds lớn cho liveness',
    'Đặt liveness probe timeoutSeconds bằng 0 để kiểm tra nhanh nhất'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: liveness chỉ kiểm tra trạng thái nội bộ; startupProbe cho giai đoạn khởi động.**

### Vì sao đúng
- **Liveness** trả lời câu hỏi "process có bị hỏng không thể tự hồi phục (deadlock, trạng thái lỗi) không?". Nếu liveness kiểm tra DB, DB chập chờn làm **mọi pod cùng bị restart**; restart không sửa được DB mà còn mất cache warm-up 90 giây, kéo dài sự cố. Spring Boot cung cấp sẵn {{/actuator/health/liveness}} và {{/actuator/health/readiness}} (tự bật khi chạy trên Kubernetes).
- **startupProbe**: trong lúc nó chưa thành công, liveness và readiness chưa chạy. 30 x 5 giây = 150 giây cho phép khởi động chậm mà sau đó liveness vẫn phát hiện treo nhanh.

### Vì sao các phương án khác sai
- **Chung endpoint có DB**: chính là nguyên nhân restart hàng loạt. DB (nếu cần) chỉ nên ảnh hưởng **readiness**, để pod tạm ngừng nhận traffic chứ không bị giết.
- **Liveness fail chỉ gỡ khỏi endpoints**: đó là hành vi của readiness; liveness fail thì kubelet restart container.
- **timeoutSeconds bằng 0**: giá trị tối thiểu là 1 giây; timeout quá ngắn làm probe fail giả khi GC pause.

> Senior tip: ngay cả readiness cũng nên cân nhắc khi đưa DB vào: nếu mọi pod cùng not-ready, Service không còn endpoint và client nhận lỗi kết nối thay vì một response lỗi có ý nghĩa. Nhiều team chỉ để readiness phản ánh "app đã sẵn sàng phục vụ" và xử lý DB lỗi bằng circuit breaker.`
},
{
  id: 'qz-microservices-012',
  topic: 'microservices',
  q: 'Event Avro trên Kafka dùng Schema Registry với compatibility BACKWARD (mặc định của Confluent Schema Registry). Bạn cần thêm thông tin {{voucherCode}} vào event {{OrderPlaced}}. Thay đổi nào được chấp nhận và nên deploy theo thứ tự nào?',
  options: [
    'Thêm field {{voucherCode}} kiểu string không có default; deploy producer trước',
    'Đổi tên field {{note}} thành {{voucherCode}} mà không khai báo alias',
    'Thêm field {{voucherCode}} có giá trị default (ví dụ union {{["null","string"]}} với default null); với BACKWARD, nâng cấp consumer trước rồi mới tới producer',
    'Đổi kiểu field {{amount}} từ long sang string để chứa thêm mã voucher'
  ],
  answer: 2,
  explain: `**Đáp án đúng: thêm field có default, nâng cấp consumer trước.**

### Vì sao đúng
- **BACKWARD** nghĩa là: consumer dùng schema mới phải đọc được dữ liệu ghi bằng schema cũ. Dữ liệu cũ không có {{voucherCode}}, nên reader cần giá trị default để điền vào. Field có default (thường là union với null) thoả điều kiện này.
- Thứ tự: consumer lên schema mới trước (vẫn đọc được event cũ), sau đó producer mới bắt đầu ghi field mới.

### Vì sao các phương án khác sai
- **Thêm field không có default**: consumer mới đọc event cũ không biết điền gì cho field mới, Schema Registry từ chối đăng ký schema.
- **Đổi tên không alias**: với Avro, đổi tên tương đương xoá field cũ và thêm field mới không default, không tương thích.
- **Đổi long sang string**: Avro không có quy tắc promotion từ long sang string, reader không đọc được dữ liệu cũ; đồng thời thay đổi ý nghĩa field là thiết kế sai.

### Bảng nhớ nhanh
| Mode | Kiểm tra | Nâng cấp trước |
|---|---|---|
| BACKWARD | schema mới đọc được dữ liệu cũ | consumer |
| FORWARD | schema cũ đọc được dữ liệu mới | producer |
| FULL | cả hai chiều | thứ tự nào cũng được |

> Senior tip: với topic có nhiều consumer thuộc nhiều team, BACKWARD_TRANSITIVE hoặc FULL_TRANSITIVE an toàn hơn vì kiểm tra với **mọi** version cũ chứ không chỉ version liền trước, quan trọng khi replay dữ liệu lâu năm.`
},
{
  id: 'qz-microservices-013',
  topic: 'microservices',
  q: 'Topic {{payments}} có 12 partition, consumer group đang có 12 pod và lag tăng lúc cao điểm. Team scale lên 20 pod nhưng lag không giảm. Vì sao, và nên làm gì?',
  options: [
    'Kafka cần vài giờ để cân bằng lại, cứ chờ lag sẽ giảm',
    'Phải đổi sang consumer group khác để 20 pod cùng nhận đủ message',
    'Do broker giới hạn tối đa 12 consumer cho mỗi topic, cần tăng giới hạn trên broker',
    'Trong một group, mỗi partition chỉ giao cho tối đa một consumer, nên 8 pod thừa ngồi không; cần tăng số partition (lưu ý ảnh hưởng tới phân phối key) hoặc tăng tốc xử lý mỗi consumer (batch, xử lý song song có kiểm soát theo key)'
  ],
  answer: 3,
  explain: `**Đáp án đúng: số partition là trần của độ song song trong một consumer group.**

### Vì sao đúng
- Kafka giao mỗi partition cho đúng một consumer trong group để giữ thứ tự trong partition. 12 partition thì tối đa 12 consumer làm việc; 8 pod còn lại idle (chỉ làm dự phòng khi pod khác chết).
- Hướng xử lý:
  - Tăng partition (ví dụ lên 24 hoặc 48). Lưu ý: key được map theo {{hash(key) % số partition}}, nên tăng partition làm cùng một key chuyển sang partition khác, thứ tự theo key có thể bị đảo trong giai đoạn chuyển tiếp.
  - Tối ưu xử lý: batch ghi DB, giảm I/O đồng bộ, hoặc xử lý song song bên trong consumer nhưng vẫn giữ thứ tự theo key (ví dụ thư viện Confluent Parallel Consumer).

### Vì sao các phương án khác sai
- **Chờ vài giờ**: rebalance diễn ra trong vài giây; không có cơ chế nào giao thêm partition cho pod thừa.
- **Đổi sang group khác**: mỗi group nhận **toàn bộ** message, nên tạo group mới là xử lý trùng chứ không chia tải.
- **Broker giới hạn 12 consumer**: không có giới hạn như vậy; giới hạn đến từ số partition.

> Senior tip: khi tạo topic, ước lượng partition theo thông lượng đỉnh dự kiến trong 1–2 năm chia cho thông lượng một consumer xử lý được, rồi cộng dư. Tăng partition thì dễ, giảm partition thì không làm được.`
},
{
  id: 'qz-microservices-014',
  topic: 'microservices',
  q: 'App mobile cần một màn hình gộp dữ liệu từ 5 service, payload phải gọn vì mạng 3G; web admin cần dữ liệu đầy đủ hơn và định dạng khác. API gateway chung đang phình to vì logic riêng cho từng client. Hướng xử lý?',
  options: [
    'Backend for Frontend (BFF): một BFF cho mobile và một cho web, mỗi BFF do team frontend tương ứng sở hữu, gộp và cắt dữ liệu theo nhu cầu của client đó; API gateway chỉ giữ việc chung (auth, rate limit, routing)',
    'Để app mobile tự gọi trực tiếp 5 service rồi tự gộp dữ liệu',
    'Đưa thêm logic gộp cho mọi loại client vào API gateway hiện có',
    'Gộp 5 service thành một service để không cần gọi nhiều nơi'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Backend for Frontend tách theo loại client.**

### Vì sao đúng
- Mỗi loại client có nhu cầu khác nhau (kích thước payload, cách phân trang, trường cần hiển thị). Gom hết vào một gateway khiến gateway thành "God service", mọi team phải xếp hàng sửa chung.
- BFF gọi song song 5 service ở trong mạng nội bộ (latency thấp) rồi trả một response gọn cho mobile, giảm số round-trip qua mạng di động chậm.
- Team frontend sở hữu BFF của mình nên thay đổi màn hình không cần chờ team backend.

### Vì sao các phương án khác sai
- **Mobile gọi trực tiếp 5 service**: 5 round-trip trên mạng 3G, lộ cấu trúc nội bộ ra ngoài, mỗi lần đổi service phải phát hành lại app (người dùng cập nhật chậm).
- **Thêm logic vào gateway chung**: đúng là vấn đề đang gặp; gateway nên mỏng, lo các việc cắt ngang (auth, TLS, rate limit, routing).
- **Gộp 5 service**: giải quyết vấn đề hiển thị bằng cách đổi ranh giới domain, không tương xứng và phá vỡ quyền sở hữu của các team.

> Senior tip: BFF cũng có rủi ro: logic nghiệp vụ dần trôi vào BFF và bị lặp giữa các BFF. Giữ quy tắc: BFF chỉ gộp, cắt và chuyển đổi dữ liệu; quy tắc nghiệp vụ phải nằm ở service domain.`
},
{
  id: 'qz-microservices-015',
  topic: 'microservices',
  multi: true,
  q: 'Bạn xây distributed tracing cho 30 service Spring Boot 3. Những phát biểu nào đúng? (Chọn 3)',
  options: [
    'Spring Cloud Sleuth không hỗ trợ Spring Boot 3; thay bằng Micrometer Tracing (bridge sang OpenTelemetry hoặc Brave)',
    'Trace context được truyền giữa service qua header, mặc định của Micrometer Tracing là chuẩn W3C {{traceparent}}',
    'Ghi 100% trace ở 50.000 RPS luôn rẻ nên không cần sampling',
    'Khi chuyển việc sang thread pool khác (ví dụ {{@Async}} hoặc {{CompletableFuture}} với executor riêng), trace context có thể mất nếu executor không được bọc để propagate context',
    'Chỉ cần log có timestamp là đủ để ghép luồng request qua 30 service, không cần trace id'
  ],
  answer: [0, 1, 3],
  explain: `**Đáp án đúng: Micrometer Tracing thay Sleuth; W3C traceparent; và context có thể mất khi đổi thread.**

### Vì sao đúng
- Sleuth dừng ở dòng Spring Boot 2.x; từ Boot 3, tracing chuyển sang **Micrometer Tracing** với bridge {{micrometer-tracing-bridge-otel}} hoặc {{micrometer-tracing-bridge-brave}}, kết hợp Observation API.
- Propagation mặc định là W3C Trace Context: header {{traceparent}} chứa trace id, span id và cờ sampled, nhờ vậy tương thích với các hệ khác dùng OpenTelemetry.
- Trace context được giữ trong ThreadLocal; khi công việc chạy trên thread khác mà executor không được bọc bằng cơ chế context propagation (ví dụ {{ContextPropagatingTaskDecorator}} hoặc {{ContextSnapshot}}), span mới sẽ thành trace riêng, đứt mạch.

### Vì sao các phương án khác sai
- **Ghi 100% luôn rẻ**: ở 50.000 RPS, mỗi request vài chục span là hàng triệu span mỗi giây, chi phí lưu trữ và network rất lớn. Thường dùng head sampling vài % hoặc tail sampling (giữ toàn bộ trace lỗi và chậm) ở OpenTelemetry Collector.
- **Chỉ cần timestamp**: hàng nghìn request đồng thời, không thể ghép log theo thời gian; cần trace id (đưa vào MDC để log và trace liên kết được).

> Senior tip: đưa {{traceId}} vào mọi dòng log và vào response header lỗi trả cho client. Khi khách gửi ảnh chụp lỗi có trace id, bạn đi thẳng tới trace thay vì tìm kim đáy bể.`
},
{
  id: 'qz-microservices-016',
  topic: 'microservices',
  q: 'Bạn cần đổi tên cột {{full_name}} thành {{display_name}} trong khi service chạy canary (10% pod bản mới, 90% bản cũ, cùng một database) và phải rollback được bất kỳ lúc nào. Cách làm đúng?',
  options: [
    'Chạy {{ALTER TABLE ... RENAME COLUMN}} trong migration của bản mới, bản cũ sẽ tự thích nghi',
    'Expand–contract: thêm cột mới; bản mới ghi cả hai cột và đọc cột mới; backfill dữ liệu cũ; khi mọi pod đã lên bản mới và ổn định mới dừng ghi cột cũ; cuối cùng xoá cột cũ ở một release sau',
    'Dừng toàn bộ service, đổi tên cột, deploy bản mới rồi bật lại',
    'Tạo view tên cũ trỏ sang cột mới rồi xoá ngay cột cũ trong cùng release'
  ],
  answer: 1,
  explain: `**Đáp án đúng: expand–contract (parallel change) qua nhiều release.**

### Vì sao đúng
Khi canary, **hai phiên bản code chạy cùng lúc trên cùng schema**, nên mỗi bước thay đổi schema phải tương thích với cả code cũ lẫn code mới:
~~~text
Release 1 (expand):  ADD COLUMN display_name; code mới ghi cả hai, đọc display_name (fallback full_name)
Backfill:            UPDATE theo batch nhỏ: display_name = full_name nơi còn null
Release 2:           mọi pod đã là bản mới -> đọc/ghi chỉ display_name
Release 3 (contract): DROP COLUMN full_name
~~~
Ở bất kỳ bước nào, rollback code về bản trước vẫn chạy được vì cột cũ còn đó và vẫn được cập nhật.

### Vì sao các phương án khác sai
- **RENAME ngay**: 90% pod bản cũ lập tức lỗi vì cột {{full_name}} không còn; rollback code cũng không cứu được vì schema đã đổi.
- **Dừng toàn bộ service**: có downtime, trái với mục tiêu canary và zero-downtime.
- **View rồi xoá cột cũ ngay**: code cũ thường ghi vào bảng chứ không qua view; xoá cột trong cùng release làm mất khả năng rollback.

> Senior tip: tách migration ra khỏi lúc khởi động app (chạy như một job riêng trước khi deploy) và kiểm tra lock: ADD COLUMN có default hằng số trên PostgreSQL 11+ chỉ đổi metadata, nhưng backfill lớn phải chia batch để tránh lock lâu và WAL tăng vọt.`
},
{
  id: 'qz-microservices-017',
  topic: 'microservices',
  q: 'Các service nội bộ xác thực nhau bằng OAuth2 client credentials (JWT). Service B đang gọi introspection endpoint của auth server cho mỗi request, tạo 3.000 RPS lên auth server và thêm 40 ms latency. Cải thiện thế nào?',
  options: [
    'Bỏ xác thực giữa các service nội bộ vì đã nằm trong VPC',
    'Cache kết quả introspection 24 giờ theo token',
    'Validate JWT cục bộ bằng chữ ký với public key lấy từ JWKS endpoint (cache, tự làm mới khi gặp key id lạ), kiểm tra {{exp}}, {{iss}}, {{aud}} và scope; access token để thời hạn ngắn (vài phút)',
    'Chuyển sang gửi client secret trong mọi request để B tự so sánh'
  ],
  answer: 2,
  explain: `**Đáp án đúng: validate JWT cục bộ với JWKS được cache.**

### Vì sao đúng
- JWT được ký bởi auth server; B chỉ cần public key để kiểm tra chữ ký, không phải hỏi auth server mỗi lần. Spring Security Resource Server làm việc này khi cấu hình {{spring.security.oauth2.resourceserver.jwt.issuer-uri}} hoặc {{jwk-set-uri}}.
- JWKS được cache; khi auth server xoay key, token mới có {{kid}} lạ thì thư viện tải lại JWKS.
- Kiểm tra {{aud}} rất quan trọng: token cấp cho service C không được dùng để gọi B. Token ngắn hạn giới hạn thiệt hại khi bị lộ, bù cho việc không thu hồi tức thời được.

### Vì sao các phương án khác sai
- **Bỏ xác thực trong VPC**: mô hình "tin mạng nội bộ" không còn phù hợp (zero trust); chỉ cần một service bị chiếm (SSRF, RCE) là kẻ tấn công gọi được mọi nơi.
- **Cache introspection 24 giờ**: dài hơn thời hạn token, mất ý nghĩa của introspection (kiểm tra thu hồi); cache ngắn thì vẫn còn nhiều lời gọi.
- **Gửi client secret mỗi request**: secret dài hạn đi khắp mạng, mọi service phải biết secret của nhau; đây là ngược lại với mục đích của OAuth2.

> Senior tip: introspection vẫn hợp với token opaque hoặc khi cần thu hồi ngay lập tức (ví dụ thao tác tài chính nhạy cảm). Với service mesh, mTLS xác thực danh tính service ở tầng transport, còn JWT mang thông tin người dùng/scope ở tầng ứng dụng; hai thứ bổ sung cho nhau.`
},
{
  id: 'qz-microservices-018',
  topic: 'microservices',
  q: 'Topic {{customer-state}} dùng {{cleanup.policy=compact}} để luôn giữ trạng thái mới nhất của mỗi khách hàng theo key customerId. Khách yêu cầu xoá dữ liệu (GDPR). Cách đúng để xoá khỏi topic là gì?',
  options: [
    'Gửi record cùng key với value là chuỗi rỗng "{}"',
    'Xoá thủ công file segment chứa record trên broker',
    'Giảm retention.ms của topic xuống 1 giây',
    'Gửi tombstone: record cùng key với value {{null}}; compaction sẽ xoá các bản cũ của key, và tombstone được giữ thêm khoảng {{delete.retention.ms}} để consumer kịp thấy rồi mới bị xoá'
  ],
  answer: 3,
  explain: `**Đáp án đúng: gửi tombstone (value null) cho key cần xoá.**

### Vì sao đúng
- Log compaction giữ ít nhất bản ghi **mới nhất** cho mỗi key. Tombstone là bản mới nhất với value null, đánh dấu "key này đã bị xoá". Khi log cleaner chạy, các bản cũ của key bị loại.
- Tombstone được giữ lại trong {{delete.retention.ms}} (mặc định 24 giờ) để consumer đang đọc chậm vẫn nhận được và xoá bản sao cục bộ của mình; sau đó tombstone cũng bị xoá.
- Lưu ý: compaction chỉ chạy trên segment đã đóng, nên dữ liệu không biến mất ngay lập tức; có thể điều chỉnh {{segment.ms}}, {{min.compaction.lag.ms}} hoặc {{max.compaction.lag.ms}} nếu có yêu cầu thời hạn xoá.

### Vì sao các phương án khác sai
- **Value là "{}"**: đây là một giá trị hợp lệ, compaction giữ nó như bản mới nhất; dữ liệu cũ bị thay chứ key vẫn tồn tại.
- **Xoá file segment thủ công**: làm hỏng index và offset, có thể làm broker lỗi; không bao giờ thao tác trực tiếp lên file log.
- **Giảm retention.ms**: với topic chỉ có policy compact, retention theo thời gian không áp dụng; nếu đổi sang compact,delete thì sẽ xoá dữ liệu của **mọi** khách hàng.

> Senior tip: với yêu cầu GDPR trên topic không compact (log sự kiện giữ lâu), cách thực tế là crypto-shredding: mã hoá dữ liệu cá nhân bằng key riêng cho từng khách, xoá key thì dữ liệu trong mọi bản sao và backup đều không đọc được nữa.`
},
{
  id: 'qz-microservices-019',
  topic: 'microservices',
  multi: true,
  q: 'Pipeline đọc từ topic {{orders}}, tính toán, ghi sang topic {{invoices}}, và một consumer khác ghi {{invoices}} vào PostgreSQL. Những phát biểu nào đúng về exactly-once trong Kafka? (Chọn 2)',
  options: [
    'Chỉ cần bật {{enable.idempotence=true}} là toàn bộ pipeline, kể cả ghi PostgreSQL, đạt exactly-once',
    'Transactional producer (transactional.id) cho phép ghi output và commit offset đầu vào trong cùng một transaction, đạt exactly-once cho luồng consume-transform-produce trong Kafka',
    'Consumer muốn không thấy dữ liệu của transaction bị abort phải đặt {{isolation.level=read_committed}}, vì mặc định là read_uncommitted',
    'Đặt acks=1 là đủ cho exactly-once',
    'Transaction Kafka tự động rollback cả dữ liệu đã ghi vào PostgreSQL'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: transactional producer cho consume-transform-produce; và consumer phải đặt read_committed.**

### Vì sao đúng
- Với transaction, producer gọi {{sendOffsetsToTransaction}} để commit offset đầu vào **cùng transaction** với record đầu ra. Hoặc cả hai cùng thành công, hoặc cả hai bị abort: không mất, không trùng trong phạm vi Kafka.
- Record của transaction bị abort vẫn nằm trong log. Consumer {{read_uncommitted}} (mặc định) vẫn đọc thấy chúng; chỉ {{read_committed}} mới lọc bỏ và chỉ đọc tới last stable offset.

### Vì sao các phương án khác sai
- **Chỉ cần idempotence**: idempotent producer chỉ chống trùng do retry trong một phiên producer; không bao phủ consumer, offset hay hệ thống ngoài.
- **acks=1**: còn yếu hơn mặc định; leader chết trước khi follower sao chép là mất dữ liệu; transaction yêu cầu acks=all.
- **Rollback PostgreSQL**: transaction Kafka không phối hợp với DB ngoài. Với bước ghi DB, cần consumer idempotent: lưu offset hoặc message id vào cùng transaction DB (inbox), hoặc upsert theo business key.

> Senior tip: khi phỏng vấn, nói rõ "exactly-once trong Kafka" khác "exactly-once effect end-to-end". Phần lớn hệ thống thực tế dùng at-least-once + consumer idempotent vì đơn giản hơn và đúng với mọi loại sink.`
},
{
  id: 'qz-microservices-020',
  topic: 'microservices',
  q: 'Mỗi lần rolling deploy 6 pod consumer, group {{invoice-sync}} rebalance liên tục, mọi consumer dừng xử lý và lag tăng vọt vài phút. Biện pháp nào giảm ảnh hưởng hiệu quả nhất?',
  options: [
    'Dùng static membership ({{group.instance.id}} cố định cho từng pod, ví dụ tên pod của StatefulSet) với {{session.timeout.ms}} lớn hơn thời gian restart một pod, kết hợp cooperative rebalancing (CooperativeStickyAssignor) để chỉ partition bị ảnh hưởng mới bị thu hồi',
    'Giảm session.timeout.ms xuống 1 giây để rebalance nhanh hơn',
    'Tắt hoàn toàn rebalance trên broker',
    'Tạo mỗi pod một consumer group riêng để không ảnh hưởng lẫn nhau'
  ],
  answer: 0,
  explain: `**Đáp án đúng: static membership + cooperative rebalancing.**

### Vì sao đúng
- **Static membership** (KIP-345): consumer có {{group.instance.id}} cố định. Khi pod restart và quay lại trong {{session.timeout.ms}}, coordinator nhận ra cùng thành viên và trả lại đúng partition cũ **mà không rebalance**.
- **Cooperative rebalancing** (KIP-429): thay vì mọi consumer thu hồi toàn bộ partition (eager, stop-the-world), chỉ những partition cần chuyển mới bị thu hồi; các consumer khác tiếp tục xử lý. Từ Kafka 3.x, giá trị mặc định của {{partition.assignment.strategy}} là {{[RangeAssignor, CooperativeStickyAssignor]}} nhưng vẫn dùng Range cho tới khi bạn bỏ Range khỏi danh sách.
- Kafka 4.0 đưa giao thức consumer group mới (KIP-848, {{group.protocol=consumer}}) GA, rebalance tăng dần do broker điều phối, cũng nhằm giải quyết đúng vấn đề này.

### Vì sao các phương án khác sai
- **session.timeout.ms 1 giây**: consumer bị coi là chết chỉ vì GC pause ngắn, rebalance còn nhiều hơn.
- **Tắt rebalance**: không có cấu hình như vậy; rebalance là cơ chế bắt buộc để giao partition khi thành viên thay đổi.
- **Mỗi pod một group**: mỗi pod nhận toàn bộ message, xử lý trùng 6 lần.

> Senior tip: kết hợp thêm {{maxUnavailable: 1}} khi rolling update và graceful shutdown (đóng consumer đúng cách để commit offset). Theo dõi metric số lần rebalance mỗi giờ; con số này tăng đột biến thường là dấu hiệu sớm của vấn đề max.poll.interval.ms hoặc pod bị OOM.`
},
// ===================== scenario =====================
{
  id: 'qz-scenario-007',
  topic: 'scenario',
  q: 'API lịch sử giao dịch dùng {{ORDER BY created_at DESC, id DESC LIMIT 50 OFFSET :offset}} trên bảng 50 triệu dòng. Trang 1 mất 5 ms, trang 2.000 (OFFSET 100.000) mất 4 giây. Cách sửa phù hợp nhất?',
  options: [
    'Thêm index trên created_at là đủ, OFFSET sẽ nhanh như trang đầu',
    'Keyset (seek) pagination: client gửi cặp (created_at, id) của dòng cuối trang trước, query {{WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 50}} với index ghép (created_at, id)',
    'Tăng work_mem và shared_buffers của PostgreSQL',
    'Cache toàn bộ 50 triệu dòng trong Redis rồi phân trang trên Redis'
  ],
  answer: 1,
  explain: `**Đáp án đúng: keyset pagination với index ghép.**

### Vì sao đúng
- {{OFFSET 100000}} bắt DB **đọc và bỏ đi** 100.000 dòng trước khi trả 50 dòng. Ngay cả khi đi theo index, chi phí vẫn tăng tuyến tính theo offset; trang càng sâu càng chậm.
- Keyset nhảy thẳng tới vị trí bắt đầu qua index (row value comparison {{(a, b) < (x, y)}} dùng được index ghép trên PostgreSQL), nên mọi trang đều tốn chi phí như trang đầu.
- Thêm {{id}} vào khoá sắp xếp để phá hoà khi nhiều dòng trùng {{created_at}}, tránh mất hoặc lặp dòng giữa các trang.

### Vì sao các phương án khác sai
- **Chỉ index created_at**: index giúp tránh sort, nhưng OFFSET vẫn phải duyệt qua 100.000 entry; trang sâu vẫn chậm.
- **Tăng work_mem/shared_buffers**: có thể giảm I/O nhưng không đổi độ phức tạp; còn ảnh hưởng toàn bộ DB.
- **Cache 50 triệu dòng vào Redis**: tốn bộ nhớ, khó đồng bộ, và phân trang sâu trên Redis cũng có chi phí tương tự.

### Trade-off
Keyset không nhảy được tới "trang 2.000" tuỳ ý, chỉ đi tiếp/lùi. Với UI lịch sử giao dịch (cuộn vô hạn, nút "xem thêm") đây là điều chấp nhận được; nếu cần nhảy trang, giới hạn số trang tối đa và gợi ý người dùng lọc theo khoảng ngày.

> Senior tip: trả về một cursor mờ (base64 của created_at + id) thay vì để client tự ghép tham số, như vậy sau này đổi khoá sắp xếp không làm vỡ hợp đồng API.`
},
{
  id: 'qz-scenario-008',
  topic: 'scenario',
  q: 'Một kỹ sư chạy migration {{CREATE INDEX idx_orders_customer ON orders(customer_id)}} trên bảng PostgreSQL 80 triệu dòng lúc 10 giờ sáng. Trong 6 phút, mọi INSERT/UPDATE vào orders bị treo, API đặt hàng timeout. Lần sau nên làm thế nào?',
  options: [
    'Chạy cùng câu lệnh nhưng vào ban đêm, vì CREATE INDEX thường không khoá gì cả',
    'Đặt statement_timeout = 1s cho migration để nó tự huỷ nếu lâu',
    'Dùng {{CREATE INDEX CONCURRENTLY}} (chạy ngoài transaction block); nếu thất bại sẽ để lại index INVALID cần DROP rồi tạo lại; đặt lock_timeout ngắn để không xếp hàng chặn query khác',
    'Tạo index trên replica rồi failover sang replica đó'
  ],
  answer: 2,
  explain: `**Đáp án đúng: CREATE INDEX CONCURRENTLY, xử lý index INVALID nếu thất bại.**

### Vì sao đúng
- {{CREATE INDEX}} thường giữ lock SHARE trên bảng suốt thời gian build: SELECT vẫn chạy nhưng INSERT/UPDATE/DELETE bị chặn. Với 80 triệu dòng, việc build mất vài phút là đủ làm sập luồng đặt hàng.
- {{CONCURRENTLY}} chỉ giữ lock SHARE UPDATE EXCLUSIVE (không chặn ghi), build bằng nhiều lượt quét và chờ các transaction cũ kết thúc. Đổi lại: chậm hơn, không chạy được trong transaction block (nhiều tool migration phải cấu hình riêng cho bước này), và nếu thất bại sẽ để lại index ở trạng thái INVALID.
- {{lock_timeout}} ngắn (ví dụ 5s) giúp migration bỏ cuộc thay vì đứng chờ lock và làm các query phía sau xếp hàng theo.

### Vì sao các phương án khác sai
- **Chạy ban đêm, cho rằng không khoá**: CREATE INDEX thường **có** chặn ghi; ban đêm chỉ giảm ảnh hưởng, hệ thống 24/7 (thanh toán) vẫn bị treo.
- **statement_timeout 1 giây**: index sẽ không bao giờ build xong; đồng thời không giải quyết việc chặn ghi trong 1 giây đó.
- **Build trên replica rồi failover**: physical replica là read-only, không tạo index riêng được; failover chỉ để làm migration là rủi ro không cần thiết.

> Senior tip: trong Flyway, migration chứa CONCURRENTLY phải chạy ngoài transaction (Flyway hỗ trợ cấu hình {{executeInTransaction=false}} cho script). Sau khi chạy, kiểm tra {{pg_index.indisvalid}} để chắc chắn không còn index INVALID tốn chi phí ghi mà không được dùng.`
},
{
  id: 'qz-scenario-009',
  topic: 'scenario',
  q: 'Pod Spring Boot có memory limit 2Gi, chạy với {{-Xmx2g}}. Pod bị restart vài giờ một lần, {{kubectl describe}} báo {{OOMKilled}} (exit code 137), nhưng log không có {{OutOfMemoryError}} và heap dump không được tạo. Nguyên nhân khả dĩ nhất?',
  options: [
    'Heap bị memory leak, JVM ném OutOfMemoryError nhưng log bị mất',
    'Liveness probe fail nên Kubernetes kill pod',
    'Node thiếu CPU nên kernel kill process',
    'Heap được phép dùng tới toàn bộ 2Gi, cộng thêm bộ nhớ ngoài heap (metaspace, thread stack, code cache, direct buffer, GC) làm RSS vượt limit; kernel OOM killer giết process; cần đặt heap khoảng 70–75% limit (ví dụ {{-XX:MaxRAMPercentage=75}})'
  ],
  answer: 3,
  explain: `**Đáp án đúng: tổng bộ nhớ của process vượt limit container, không phải heap đầy.**

### Vì sao đúng
- Memory limit của container giới hạn **toàn bộ RSS** của process, không chỉ heap. JVM còn dùng metaspace (class), mỗi thread khoảng 1 MB stack (200 thread là 200 MB), code cache JIT, direct buffer của Netty/NIO, cấu trúc nội bộ của GC.
- Khi RSS chạm limit, kernel (cgroup OOM killer) gửi SIGKILL: JVM không có cơ hội ghi log hay heap dump, exit code 137 = 128 + 9 (SIGKILL).
- Sửa: đặt {{-XX:MaxRAMPercentage=75}} (JVM tự tính theo limit của container) hoặc {{-Xmx}} khoảng 1.4g; dùng Native Memory Tracking ({{-XX:NativeMemoryTracking=summary}}, {{jcmd <pid> VM.native_memory}}) để xem phần ngoài heap.

### Vì sao các phương án khác sai
- **Heap leak, OOME bị mất log**: nếu heap đầy, JVM ném OutOfMemoryError trong process (vẫn sống), log và {{-XX:+HeapDumpOnOutOfMemoryError}} hoạt động; trạng thái OOMKilled cho thấy bị giết từ bên ngoài.
- **Liveness fail**: lý do restart sẽ là liveness probe failed (exit code thường 143 với SIGTERM), không phải OOMKilled.
- **Thiếu CPU**: thiếu CPU gây throttling (chậm), không gây kill.

> Senior tip: đặt memory request bằng limit cho service Java để tránh bị evict khi node thiếu bộ nhớ, và cảnh báo khi container_memory_working_set_bytes vượt 90% limit trong 10 phút, trước khi OOMKilled xảy ra.`
},
{
  id: 'qz-scenario-010',
  topic: 'scenario',
  q: 'Một cụm Redis dùng chung cho cache sản phẩm, session đăng nhập và distributed lock, cấu hình {{maxmemory-policy allkeys-lru}}. Cao điểm khuyến mãi, user bị đăng xuất ngẫu nhiên và có job chạy trùng vì lock "biến mất". Cách xử lý đúng?',
  options: [
    'Tách theo mục đích: cache dùng instance có allkeys-lru (hoặc allkeys-lfu); session và lock dùng instance riêng với noeviction (hoặc volatile-*) và đủ bộ nhớ, có cảnh báo khi dùng trên 80% maxmemory',
    'Đổi sang volatile-lru trên cụm chung là đủ, vì session và lock đều có TTL nên sẽ không bao giờ bị xoá',
    'Tắt maxmemory để Redis dùng không giới hạn RAM của máy',
    'Tăng TTL của session và lock để chúng ít bị xoá hơn'
  ],
  answer: 0,
  explain: `**Đáp án đúng: tách Redis theo mục đích với eviction policy phù hợp từng loại dữ liệu.**

### Vì sao đúng
- Với {{allkeys-lru}}, khi chạm maxmemory Redis xoá **bất kỳ key nào** ít được dùng gần đây, kể cả session và lock. Cao điểm khuyến mãi, lượng cache sản phẩm tăng mạnh đẩy session/lock ra ngoài.
- Cache là dữ liệu tạm, mất thì nạp lại; session và lock là **trạng thái** không được phép mất ngầm. Hai loại có yêu cầu trái ngược nên cần instance (hoặc cụm) riêng. Với {{noeviction}}, khi đầy Redis trả lỗi cho lệnh ghi; lỗi rõ ràng tốt hơn mất dữ liệu âm thầm, và cảnh báo bộ nhớ giúp xử lý trước.

### Vì sao các phương án khác sai
- **volatile-lru trên cụm chung**: volatile-* chỉ xoá key có TTL. Cache, session và lock đều có TTL, nên session/lock vẫn là ứng viên bị xoá.
- **Tắt maxmemory**: Redis dùng tới hết RAM, máy swap hoặc bị OOM killer giết, mất toàn bộ dữ liệu cùng lúc.
- **Tăng TTL**: eviction không quan tâm TTL dài hay ngắn (với allkeys-lru), và TTL dài làm bộ nhớ đầy nhanh hơn.

> Senior tip: theo dõi {{evicted_keys}} trong {{INFO stats}}; với instance chứa session/lock, con số này phải luôn bằng 0. Ngoài ra, lock dùng cho tính đúng đắn vẫn cần fencing token hoặc ràng buộc ở DB vì Redis failover (replication bất đồng bộ) cũng có thể làm mất lock.`
},
{
  id: 'qz-scenario-011',
  topic: 'scenario',
  multi: true,
  q: 'Mỗi lần rolling deploy service thanh toán (10 pod trên Kubernetes), client nhận khoảng 300 lỗi 502/503 và vài lỗi "connection reset". Những biện pháp nào xử lý đúng nguyên nhân? (Chọn 2)',
  options: [
    'Thêm preStop hook (ví dụ sleep 5–10 giây) để kube-proxy/Ingress kịp gỡ pod khỏi danh sách endpoint trước khi app bắt đầu tắt',
    'Tăng số replica từ 10 lên 30',
    'Bật graceful shutdown của Spring Boot ({{server.shutdown=graceful}}, mặc định từ Boot 3.4) với {{spring.lifecycle.timeout-per-shutdown-phase}} phù hợp, và đặt terminationGracePeriodSeconds lớn hơn tổng preStop + thời gian drain',
    'Đặt terminationGracePeriodSeconds bằng 0 để pod cũ tắt thật nhanh',
    'Đưa kiểm tra database vào liveness probe'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: preStop delay và graceful shutdown với grace period đủ dài.**

### Vì sao đúng
Khi pod bị xoá, hai việc diễn ra **song song**: kubelet gửi SIGTERM cho container, và control plane cập nhật EndpointSlice để các node/Ingress ngừng gửi traffic. Cập nhật endpoint lan ra mất vài giây, trong lúc đó traffic vẫn tới pod đang tắt.
- **preStop sleep**: trì hoãn SIGTERM vài giây để endpoint được gỡ xong; khi app bắt đầu tắt thì gần như không còn request mới.
- **Graceful shutdown**: Spring Boot ngừng nhận request mới và chờ request đang xử lý hoàn tất (tới timeout) thay vì cắt ngang, tránh "connection reset" và giao dịch dở dang.
- terminationGracePeriodSeconds (mặc định 30 giây) phải lớn hơn preStop + thời gian drain, nếu không kubelet gửi SIGKILL giữa chừng.

### Vì sao các phương án khác sai
- **Tăng replica**: giảm tỉ lệ lỗi trên mỗi pod nhưng không sửa cơ chế; mỗi pod bị thay vẫn rớt request.
- **Grace period bằng 0**: buộc tắt ngay lập tức, mọi request đang xử lý bị cắt, lỗi còn nhiều hơn.
- **Liveness kiểm tra DB**: không liên quan tới deploy, còn có thể gây restart hàng loạt khi DB chập chờn.

> Senior tip: kiểm chứng bằng cách chạy load test (ví dụ k6 ở 500 RPS) trong lúc deploy và yêu cầu 0 lỗi; thêm PodDisruptionBudget và {{maxUnavailable: 0}}, {{maxSurge: 25%}} để luôn đủ capacity trong lúc thay pod.`
},
{
  id: 'qz-scenario-012',
  topic: 'scenario',
  q: 'Sau khi database primary failover (DNS endpoint trỏ sang node mới trong khoảng 30 giây), nhiều pod Java vẫn báo lỗi kết nối hoặc treo request thêm 10–15 phút mới tự hết. Nguyên nhân khả dĩ nhất?',
  options: [
    'Node DB mới chạy chậm hơn node cũ',
    'Connection trong pool vẫn trỏ tới node cũ đã chết; không có socket timeout hay TCP keepalive nên mỗi connection chờ tới khi hệ điều hành báo lỗi (có thể nhiều phút); cộng thêm JVM cache DNS. Cần đặt socketTimeout/keepalive cho driver, maxLifetime của HikariCP hợp lý và TTL DNS ngắn',
    'HikariCP không hỗ trợ failover, phải đổi sang connection pool khác',
    'Ứng dụng cần được build lại với địa chỉ IP mới'
  ],
  answer: 1,
  explain: `**Đáp án đúng: connection cũ treo vì thiếu timeout, cộng với DNS cache.**

### Vì sao đúng
- Khi node cũ biến mất đột ngột (không gửi FIN/RST), các connection TCP đang mở trong pool không biết đối phương đã chết. Request lấy connection đó gửi query rồi chờ response mãi, tới khi TCP retransmission timeout của hệ điều hành hết (trên Linux có thể khoảng 15 phút với cấu hình mặc định).
- JVM có thể cache kết quả DNS (thuộc tính {{networkaddress.cache.ttl}}); nếu đặt quá dài, connection mới vẫn đi tới IP cũ.
- Sửa: {{socketTimeout}} (PostgreSQL JDBC) để query không chờ vô hạn, bật {{tcpKeepAlive}}, đặt {{maxLifetime}} của Hikari ngắn hơn timeout của hạ tầng (ví dụ 30 phút), {{keepaliveTime}} để kiểm tra connection rảnh, và TTL DNS của JVM khoảng 30–60 giây.

### Vì sao các phương án khác sai
- **Node mới chậm hơn**: không giải thích việc lỗi kết nối rồi tự hết sau 10–15 phút.
- **HikariCP không hỗ trợ failover**: pool chỉ quản lý connection; khi connection lỗi được loại bỏ, connection mới được tạo theo địa chỉ hiện tại. Vấn đề nằm ở timeout, không nằm ở việc chọn pool.
- **Build lại với IP mới**: app kết nối qua DNS endpoint; build lại không cần thiết và đi ngược mục đích của endpoint.

> Senior tip: đưa failover vào game day: chủ động failover ở staging và đo thời gian từ lúc failover tới khi error rate về 0. Con số này mới là RTO thật, thường khác xa con số "30 giây" trong tài liệu của nhà cung cấp.`
},
{
  id: 'qz-scenario-013',
  topic: 'scenario',
  q: 'Khoảng 2% request bị từ chối với lỗi JWT "token not yet valid" ({{nbf}}/{{iat}} nằm trong tương lai), chỉ xảy ra khi request rơi vào 1 trong 8 pod của auth server. Nguyên nhân và cách sửa hợp lý?',
  options: [
    'Khoá ký JWT của pod đó khác các pod còn lại; cần xoay khoá toàn hệ thống',
    'Token quá dài nên bị cắt khi đi qua load balancer',
    'Node chạy pod đó bị lệch đồng hồ (clock skew), ký token với thời điểm phát hành sớm hơn giờ thật của service kiểm tra; sửa đồng bộ NTP trên node, thêm cảnh báo độ lệch và cho phép leeway nhỏ (30–60 giây) khi validate',
    'Thư viện JWT có bug, cần tắt kiểm tra nbf và exp hoàn toàn'
  ],
  answer: 2,
  explain: `**Đáp án đúng: lệch đồng hồ trên một node, sửa NTP và thêm leeway nhỏ.**

### Vì sao đúng
- {{iat}} (issued at) và {{nbf}} (not before) được lấy từ đồng hồ máy ký. Nếu máy đó chạy **nhanh** hơn vài phút, service kiểm tra với đồng hồ đúng sẽ thấy token "chưa tới thời điểm hiệu lực".
- Lỗi chỉ xuất hiện khi request rơi vào một pod cụ thể và tỉ lệ khớp với tỉ lệ traffic của pod đó: dấu hiệu rất đặc trưng của vấn đề trên một node.
- Sửa gốc: đồng bộ NTP (chrony) trên node và theo dõi độ lệch. Leeway nhỏ khi validate (nhiều thư viện hỗ trợ clock skew tolerance) là phòng vệ hợp lý vì đồng hồ không bao giờ khớp tuyệt đối.

### Vì sao các phương án khác sai
- **Khoá ký khác**: sẽ gây lỗi chữ ký không hợp lệ (invalid signature), không phải lỗi thời gian.
- **Token bị cắt**: gây lỗi parse/chữ ký, không gây đúng thông báo về thời gian.
- **Tắt kiểm tra nbf/exp**: token bị lộ sẽ dùng được mãi; leeway nhỏ khác hoàn toàn với tắt kiểm tra.

> Senior tip: đồng hồ lệch còn gây lỗi khó thấy hơn ở chỗ khác: TOTP/OTP, chữ ký AWS SigV4 (yêu cầu thời gian lệch không quá 5 phút), thứ tự log và Snowflake ID. Đưa metric độ lệch NTP vào dashboard của mọi node.`
},
{
  id: 'qz-scenario-014',
  topic: 'scenario',
  q: 'Partition 3 của topic {{orders}} đứng yên ở offset 18.234 suốt 2 giờ, lag partition này tăng lên 400 nghìn trong khi 11 partition khác bình thường. Log lặp lại cùng một lỗi parse JSON. Team đã cấu hình error handler retry không giới hạn. Nguyên nhân và cách xử lý?',
  options: [
    'Broker giữ partition 3 bị lỗi đĩa, cần reassign partition',
    'Consumer của partition 3 thiếu CPU, cần tăng resource cho pod đó',
    'Cần tăng số partition để chia bớt tải cho partition 3',
    'Poison pill: record tại offset 18.234 không bao giờ xử lý được, retry vô hạn chặn mọi record phía sau trong partition; cấu hình số lần retry giới hạn rồi đẩy sang dead letter topic (ví dụ {{DefaultErrorHandler}} + {{DeadLetterPublishingRecoverer}}), phân loại lỗi không thể retry (deserialization) để chuyển DLT ngay'
  ],
  answer: 3,
  explain: `**Đáp án đúng: poison pill chặn partition, cần giới hạn retry và dead letter topic.**

### Vì sao đúng
- Kafka xử lý tuần tự trong partition. Một record lỗi vĩnh viễn (JSON sai định dạng) cùng retry không giới hạn khiến consumer kẹt ở đúng offset đó; các partition khác vẫn chạy nên chỉ partition 3 bị lag.
- Spring Kafka: {{DefaultErrorHandler}} với {{BackOff}} giới hạn, sau khi hết lần thử thì {{DeadLetterPublishingRecoverer}} gửi record sang topic {{orders.DLT}} kèm header chứa thông tin exception, rồi commit offset và đi tiếp.
- Lỗi deserialization nên được bọc bằng {{ErrorHandlingDeserializer}} để consumer không chết vòng lặp trước khi tới listener; các exception như deserialization/validation được coi là not-retryable và đi DLT ngay.

### Vì sao các phương án khác sai
- **Lỗi đĩa broker**: sẽ gây lỗi ở producer và log broker, không phải lỗi parse JSON lặp lại ở consumer.
- **Thiếu CPU**: chậm đều chứ không đứng yên tuyệt đối ở một offset; log không lặp đúng một lỗi.
- **Tăng partition**: record lỗi vẫn ở partition 3; partition mới không giúp gì cho dữ liệu đã có.

> Senior tip: DLT cần có chủ: dashboard đếm message, cảnh báo khi có message mới, và công cụ replay từ DLT sau khi sửa lỗi. DLT không ai đọc chỉ là một cách mất dữ liệu có tổ chức.`
},
{
  id: 'qz-scenario-015',
  topic: 'scenario',
  multi: true,
  q: 'Hoá đơn AWS tháng này gấp 3 tháng trước trong khi traffic chỉ tăng 15%. Cost Explorer cho thấy chi phí tăng mạnh ở mục NAT Gateway và CloudWatch. Những nguyên nhân/biện pháp nào hợp lý? (Chọn 2)',
  options: [
    'Traffic từ internet đi vào (data transfer IN) bị tính phí cao, cần chặn bớt người dùng',
    'Pod trong private subnet đọc/ghi S3 đi qua NAT Gateway nên mỗi GB bị tính phí xử lý; thêm VPC Gateway Endpoint cho S3 (không tính phí) để traffic S3 không qua NAT',
    'Mua Reserved Instances làm hoá đơn tăng gấp 3',
    'Một release bật log level DEBUG làm lượng log đẩy lên CloudWatch Logs tăng mạnh (phí ingestion tính theo GB); đưa log level về INFO, sampling log, đặt retention cho log group',
    'EC2 đọc S3 cùng region luôn bị tính phí data transfer theo GB'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: traffic S3 đi qua NAT Gateway; và log DEBUG làm tăng phí ingestion CloudWatch Logs.**

### Vì sao đúng
- **NAT Gateway** tính phí theo giờ và theo **mỗi GB dữ liệu xử lý** (khoảng 0,045 USD/GB ở us-east-1). Job đọc/ghi hàng chục TB S3 qua NAT tốn hàng nghìn USD. **Gateway endpoint** cho S3 và DynamoDB không tính phí, chỉ cần thêm route vào route table.
- **CloudWatch Logs** tính phí ingestion theo GB (khoảng 0,50 USD/GB ở us-east-1 cho log class Standard) cộng phí lưu trữ. Bật DEBUG có thể tăng lượng log 10–50 lần. Log group không đặt retention thì giữ mãi mãi.

### Vì sao các phương án khác sai
- **Data transfer IN bị tính phí cao**: dữ liệu đi vào AWS từ internet nhìn chung không tính phí; phí nằm ở chiều ra (OUT).
- **Reserved Instances làm tăng**: RI là cam kết để giảm giá; có thể có khoản trả trước nhưng không giải thích việc tăng ở NAT và CloudWatch.
- **EC2 đọc S3 cùng region luôn tính phí transfer**: truyền dữ liệu giữa S3 và EC2 cùng region không tính phí data transfer (vẫn có phí request); phí phát sinh khi đi qua NAT Gateway hoặc khác region.

> Senior tip: bật Cost Anomaly Detection và gắn tag (team, service) cho tài nguyên để biết ngay ai gây tăng. Đưa "kiểm tra log level và lượng log" vào checklist release; một dòng log DEBUG trong vòng lặp nóng có thể tốn hàng nghìn USD mỗi tháng.`
},
{
  id: 'qz-scenario-016',
  topic: 'scenario',
  q: '22 giờ tối thứ Bảy, request vào {{POST /api/auth/login}} tăng từ 50 lên 3.000 RPS, 98% trả 401, đến từ hàng nghìn IP khác nhau, mỗi IP chỉ vài request, thử nhiều email khác nhau. Phản ứng hợp lý nhất?',
  options: [
    'Đây là credential stuffing (dùng mật khẩu lộ từ nơi khác): bật rate limit theo tài khoản và theo dấu hiệu thiết bị/ASN, bật CAPTCHA hoặc bot challenge ở WAF cho endpoint login, theo dõi các tài khoản đăng nhập thành công bất thường để buộc đổi mật khẩu/xác thực thêm',
    'Chặn từng IP một khi thấy request lỗi',
    'Tắt hẳn chức năng đăng nhập đến sáng thứ Hai',
    'Khoá vĩnh viễn mọi tài khoản bị thử sai một lần'
  ],
  answer: 0,
  explain: `**Đáp án đúng: nhận diện credential stuffing và phòng thủ nhiều lớp theo tài khoản, thiết bị và bot.**

### Vì sao đúng
- Dấu hiệu: nhiều IP (botnet/proxy dân dụng), mỗi IP ít request, mỗi lần thử một email khác nhau với tỉ lệ thất bại cao. Kẻ tấn công dùng danh sách email/mật khẩu bị lộ từ dịch vụ khác, hy vọng người dùng dùng lại mật khẩu.
- Vì mỗi IP chỉ vài request, giới hạn theo IP gần như vô dụng. Cần tín hiệu khác: số lần thử theo tài khoản, fingerprint thiết bị, ASN/data center, và challenge (CAPTCHA, bot management) chỉ cho luồng đáng ngờ.
- 2% thành công trên 3.000 RPS là hàng chục tài khoản bị chiếm mỗi giây: phải theo dõi đăng nhập thành công từ nguồn đáng ngờ, thu hồi session và yêu cầu xác thực thêm.

### Vì sao các phương án khác sai
- **Chặn từng IP**: hàng nghìn IP thay đổi liên tục, chặn không kịp và dễ chặn nhầm người thật dùng chung NAT.
- **Tắt đăng nhập**: chính kẻ tấn công đạt được mục tiêu từ chối dịch vụ; chỉ cân nhắc khi không còn cách nào khác.
- **Khoá vĩnh viễn sau một lần sai**: kẻ tấn công có thể khoá hàng loạt tài khoản người thật (account lockout DoS); nên dùng khoá tạm có backoff.

> Senior tip: kiểm tra mật khẩu mới với danh sách mật khẩu đã lộ (ví dụ API k-anonymity của Have I Been Pwned) và khuyến khích MFA; về lâu dài, passkey loại bỏ hoàn toàn credential stuffing.`
},
{
  id: 'qz-scenario-017',
  topic: 'scenario',
  q: 'Tính năng "đặt avatar từ URL" tải ảnh từ URL người dùng nhập. Pentester nhập {{http://169.254.169.254/latest/meta-data/iam/security-credentials/}} và nhận được tên IAM role của EC2. Cách khắc phục đúng và đủ nhất?',
  options: [
    'Chặn chuỗi "169.254.169.254" trong URL bằng regex',
    'Chặn SSRF nhiều lớp: chỉ cho phép http/https, resolve DNS rồi từ chối IP private/loopback/link-local (kiểm tra cả IP sau mỗi redirect và dùng chính IP đã kiểm tra khi kết nối để tránh DNS rebinding), bắt buộc IMDSv2 trên EC2, và chạy việc tải ảnh qua egress proxy chỉ ra được internet',
    'Chỉ cho phép URL kết thúc bằng .jpg hoặc .png',
    'Đổi IAM role sang role có nhiều quyền hơn để không bị lỗi khác'
  ],
  answer: 1,
  explain: `**Đáp án đúng: phòng thủ SSRF nhiều lớp, kiểm tra IP sau khi resolve, IMDSv2 và egress proxy.**

### Vì sao đúng
- SSRF biến server của bạn thành "proxy" để gọi vào mạng nội bộ. 169.254.169.254 là Instance Metadata Service; ở IMDSv1, một GET đơn giản là đọc được credentials tạm của role.
- Kiểm tra theo **IP sau khi resolve**, không theo chuỗi: kẻ tấn công có thể dùng tên miền trỏ về IP nội bộ, dạng số thập phân/hex, hoặc redirect 302 sang địa chỉ nội bộ. DNS rebinding đổi IP giữa lúc kiểm tra và lúc kết nối, nên phải kết nối tới đúng IP đã kiểm tra.
- **IMDSv2** yêu cầu lấy token bằng request PUT có header riêng; kiểu SSRF chỉ gửi GET không làm được. Đặt hop limit bằng 1 để container không với tới được (tuỳ kiến trúc mạng).
- Egress proxy tách hẳn luồng tải URL bên ngoài khỏi mạng nội bộ.

### Vì sao các phương án khác sai
- **Regex chặn chuỗi IP**: dễ vượt qua bằng {{http://2852039166/}}, tên miền trỏ về IP đó, IPv6 hoặc redirect.
- **Chỉ cho đuôi .jpg/.png**: {{http://169.254.169.254/x?a.jpg}} vẫn hợp lệ; đuôi URL không nói gì về đích đến.
- **Tăng quyền IAM**: làm thiệt hại lớn hơn khi credentials bị lộ; nên làm ngược lại (least privilege).

> Senior tip: sau khi sửa, coi như credentials của role đã lộ: kiểm tra CloudTrail xem có lệnh gọi bất thường dùng role đó từ IP lạ. SSRF đã gây ra nhiều vụ lộ dữ liệu lớn trên AWS, nên đây là câu hỏi phỏng vấn security rất hay gặp.`
},
{
  id: 'qz-scenario-018',
  topic: 'scenario',
  q: 'Service pricing chạy với CPU limit 1 core; dashboard cho thấy CPU trung bình chỉ 35% limit, nhưng p99 latency tăng từ 80 ms lên 600 ms lúc cao điểm. Metric {{container_cpu_cfs_throttled_periods_total}} tăng mạnh. Giải thích nào đúng?',
  options: [
    'CPU trung bình 35% nên CPU không thể là nguyên nhân; cần tìm ở database',
    'Kubernetes giảm CPU của pod khi node có pod khác ưu tiên cao hơn',
    'CFS quota tính theo chu kỳ 100 ms: các đợt burst (nhiều thread xử lý request, GC song song, JIT) dùng hết 100 ms CPU trong vài chục ms đầu chu kỳ, phần còn lại bị throttle; trung bình thấp nhưng request bị dừng. Cần tăng hoặc bỏ CPU limit (giữ request), và cân nhắc số thread GC/{{-XX:ActiveProcessorCount}}',
    'Pod thiếu bộ nhớ nên CPU bị giảm'
  ],
  answer: 2,
  explain: `**Đáp án đúng: CFS throttling do burst trong từng chu kỳ 100 ms.**

### Vì sao đúng
- Limit 1 core nghĩa là trong mỗi chu kỳ 100 ms, container được dùng tổng cộng 100 ms CPU **trên tất cả các core**. Nếu 8 thread cùng chạy song song trên node 8 core, quota hết sau khoảng 12,5 ms, rồi cả container bị dừng tới hết chu kỳ: request đang xử lý bị cộng thêm tới khoảng 87 ms chờ, lặp lại qua nhiều chu kỳ.
- Trung bình theo phút vẫn thấp vì phần lớn thời gian ứng dụng rảnh; throttling chỉ thấy rõ qua tỉ lệ {{throttled_periods / periods}}.
- JVM nhìn thấy limit 1 core nên chọn số thread GC theo đó; nếu tự đặt số thread lớn, burst càng nặng.

### Vì sao các phương án khác sai
- **CPU trung bình thấp nên không phải CPU**: chính là cái bẫy; trung bình che đi các đợt bị throttle ngắn.
- **Bị giảm vì pod ưu tiên cao**: CPU request đảm bảo phần chia tối thiểu; throttle do quota là do limit của chính pod, không phải do pod khác.
- **Thiếu bộ nhớ làm giảm CPU**: thiếu bộ nhớ gây GC nhiều hoặc OOMKilled, không gây tăng metric throttled periods của CFS.

> Senior tip: nhiều tổ chức chọn đặt CPU request chính xác và bỏ CPU limit cho service nhạy latency, dựa vào request để chia tài nguyên công bằng. Nếu buộc phải có limit, đặt nó lớn hơn rõ rệt so với mức dùng đỉnh và cảnh báo khi tỉ lệ throttled vượt 5%.`
},
{
  id: 'qz-scenario-019',
  topic: 'scenario',
  q: 'Sau khi lên Java 21 và bật {{spring.threads.virtual.enabled=true}} (Spring Boot 3.2+), service order thỉnh thoảng treo hẳn dưới tải. Thread dump cho thấy carrier thread đều bận, virtual thread bị "pinned" bên trong một khối {{synchronized}} bọc lời gọi HTTP blocking tới đối tác. Nguyên nhân và cách xử lý?',
  options: [
    'Virtual thread không hỗ trợ HTTP client, phải quay lại platform thread',
    'Số virtual thread bị giới hạn 256 nên hết thread',
    'Cần tăng heap vì mỗi virtual thread chiếm 1 MB stack',
    'Trên Java 21, virtual thread block bên trong synchronized bị ghim vào carrier thread; số carrier mặc định bằng số core nên vài lời gọi chậm là chiếm hết carrier. Thay synchronized bằng ReentrantLock quanh I/O, giới hạn concurrency tới đối tác (Semaphore), dùng JFR event {{jdk.VirtualThreadPinned}} để tìm điểm pin; JDK 24 (JEP 491) đã bỏ pinning với synchronized'
  ],
  answer: 3,
  explain: `**Đáp án đúng: pinning trong synchronized làm cạn carrier thread.**

### Vì sao đúng
- Virtual thread chạy trên một pool nhỏ carrier thread (ForkJoinPool, mặc định số carrier bằng số core). Khi virtual thread block (I/O), nó bình thường được **unmount** để carrier phục vụ virtual thread khác.
- Trên Java 21–23, nếu virtual thread block khi đang giữ monitor ({{synchronized}}), nó không unmount được mà **ghim** carrier. Máy 8 core chỉ cần 8 request cùng chờ đối tác trong synchronized là toàn bộ carrier bị chiếm, hàng nghìn virtual thread khác đứng chờ: service treo.
- Cách xử lý: dùng {{ReentrantLock}} (virtual thread unmount được khi chờ lock này), thu hẹp vùng synchronized để không bọc I/O, giới hạn số lời gọi đồng thời tới đối tác. JDK 24 với JEP 491 cho phép virtual thread unmount cả khi ở trong synchronized.

### Vì sao các phương án khác sai
- **Không hỗ trợ HTTP client**: các API blocking của JDK (socket, HttpClient) đã được viết lại để hợp tác với virtual thread.
- **Giới hạn 256 virtual thread**: không có giới hạn như vậy; có thể tạo hàng triệu virtual thread. Số 256 là giới hạn tối đa mặc định của pool carrier, không phải của virtual thread.
- **Mỗi virtual thread 1 MB stack**: stack của virtual thread nằm trên heap và co giãn theo nhu cầu, thường chỉ vài KB.

> Senior tip: virtual thread làm mất "giới hạn tự nhiên" của thread pool cũ (200 thread Tomcat). Hãy đặt giới hạn rõ ràng cho tài nguyên phía sau: connection pool DB, Semaphore cho đối tác; nếu không, 10.000 request đồng thời sẽ dồn hết vào hệ thống phía sau.`
},
{
  id: 'qz-scenario-020',
  topic: 'scenario',
  multi: true,
  q: '20 giờ tối thứ Sáu, tỉ lệ thanh toán thành công giảm từ 99% xuống 60%. Trong 15 phút, 9 kỹ sư nhảy vào cùng một kênh chat, mỗi người thử một giả thuyết, có người đã chuẩn bị hotfix. Với vai trò senior, bạn nên làm gì? (Chọn 2)',
  options: [
    'Chỉ định một Incident Commander điều phối, tách người phụ trách giao tiếp (cập nhật trạng thái cho stakeholder theo nhịp cố định, ví dụ 30 phút) khỏi nhóm điều tra',
    'Chờ tìm ra nguyên nhân gốc rồi mới quyết định rollback, để tránh rollback nhầm',
    'Cho mỗi người tự deploy hotfix của mình để thử song song cho nhanh',
    'Ưu tiên giảm thiểu ảnh hưởng trước: kiểm tra thay đổi gần nhất (deploy, config, feature flag) và rollback/tắt flag nếu có liên quan, sau đó mới điều tra nguyên nhân gốc',
    'Ghi rõ tên người gây lỗi trong postmortem để tránh lặp lại'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: lập Incident Commander và tách vai trò giao tiếp; ưu tiên mitigation (rollback/tắt flag) trước khi tìm root cause.**

### Vì sao đúng
- **Incident Commander**: 9 người cùng thử giả thuyết mà không điều phối dễ dẫn tới các thay đổi chồng chéo, không ai biết cái gì đã đổi. IC phân việc (một người xem log thanh toán, một người kiểm tra đối tác, một người xem các thay đổi gần đây), quyết định hành động và ghi timeline. Người phụ trách giao tiếp giúp nhóm kỹ thuật không bị cắt ngang bởi câu hỏi từ quản lý.
- **Mitigate trước**: mỗi phút sự cố là mất doanh thu. Phần lớn sự cố bắt nguồn từ thay đổi gần đây; rollback là hành động rẻ, có thể đảo ngược và thường đủ để khôi phục dịch vụ. Root cause có thể tìm sau trên môi trường đã ổn định.

### Vì sao các phương án khác sai
- **Chờ root cause rồi mới rollback**: kéo dài thời gian ảnh hưởng tới khách; rollback nhầm thì chi phí thấp, còn chờ thì chi phí cao.
- **Mỗi người tự deploy hotfix**: nhiều thay đổi cùng lúc làm tình hình khó hiểu hơn, có thể gây sự cố thứ hai, và không biết thay đổi nào có tác dụng.
- **Ghi tên người gây lỗi**: postmortem phải blameless; đổ lỗi khiến mọi người giấu thông tin. Câu hỏi đúng là "hệ thống nào đã cho phép lỗi này lọt qua?".

> Senior tip: thống nhất trước các mức severity và tiêu chí kích hoạt rollback (ví dụ success rate thấp hơn 95% trong 5 phút sau deploy thì rollback ngay không cần họp). Quyết định đã định sẵn từ trước luôn nhanh hơn quyết định đưa ra lúc 20 giờ tối thứ Sáu.`
}
);
