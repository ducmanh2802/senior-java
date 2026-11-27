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
},
{
  "id": "qz-design-021",
  "topic": "design",
  "q": "API công khai của bạn bị một client gọi 50.000 request/phút trong khi giới hạn là 1.000 request/phút. Bạn cần chặn vượt ngưỡng nhưng vẫn cho phép burst ngắn hợp lý. Thuật toán rate limiting (giới hạn tốc độ: kiểm soát số request trong một khoảng thời gian) nào phù hợp nhất cho yêu cầu này?",
  "options": [
    "Fixed window counter (đếm theo cửa sổ cố định): mỗi phút reset bộ đếm về 0, cho phép tối đa 1.000 request/phút",
    "Token bucket (xô token): nạp token với tốc độ ổn định (ví dụ ~16 token/giây) và cho phép tích luỹ token để xử lý burst ngắn, nhưng không vượt quá sức chứa xô",
    "Leaky bucket (xô rò rỉ): xếp request vào hàng đợi và xả ra với tốc độ cố định, request thừa bị bỏ khi hàng đợi đầy",
    "Không dùng rate limiting, chỉ tăng số server để chịu tải"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** Token bucket là lựa chọn tốt khi cần vừa giới hạn tốc độ trung bình vừa cho phép burst ngắn có kiểm soát.\n\n### Giải thích từng bước\n\n- **Rate limiting là gì?** Rate limiting (giới hạn tốc độ) là cơ chế kiểm soát số request (yêu cầu) mà một client (ứng dụng/máy gọi vào) được phép gửi trong một khoảng thời gian. Ví dụ đời thường: cổng soát vé cho tối đa 10 người/phút, nếu đến quá đông thì phải chờ.\n- **Vì sao cần?** Nếu không giới hạn, một client lỗi vòng lặp vô hạn hoặc bị tấn công có thể gửi hàng chục nghìn request, làm server quá tải và ảnh hưởng người dùng khác.\n\n- **Token bucket hoạt động thế nào?**\n  1. Tưởng tượng một cái xô có sức chứa tối đa, ví dụ 1.000 token (mỗi token đại diện cho quyền thực hiện 1 request).\n  2. Hệ thống nạp token vào xô với tốc độ ổn định, ví dụ 1.000/60 giây ~ 16,7 token/giây.\n  3. Mỗi request đến sẽ lấy 1 token. Nếu còn token thì request được xử lý; nếu hết token thì request bị từ chối (thường trả HTTP 429 Too Many Requests).\n  4. Nếu client im lặng một lúc, token tích luỹ trong xô (tối đa bằng sức chứa). Khi client gửi dồn dập, nó có thể dùng lượng token tích luỹ để burst (tăng đột biến) ngắn, nhưng không thể vượt sức chứa xô.\n- **Ví dụ cụ thể:** Xô sức chứa 200 token, nạp 16 token/giây. Client nghỉ 10 giây tích được ~160 token, sau đó có thể gửi 160 request gần như ngay lập tức, rồi phải chờ token nạp tiếp.\n\n### Vì sao các phương án khác sai\n- **Fixed window counter**: chia thời gian thành cửa sổ cố định. Vấn đề boundary burst: client gửi 1.000 request lúc 12:00:59 và 1.000 request lúc 12:01:00, tức 2.000 request trong ~2 giây nhưng cả hai cửa sổ đều hợp lệ.\n- **Leaky bucket**: xả request với tốc độ cố định như nước rò rỉ đều, nên làm mượt lưu lượng nhưng **không cho phép burst** dù ngắn.\n- **Tăng số server**: chỉ tăng khả năng chịu tải, không giải quyết việc một client chiếm dụng tài nguyên quá mức.\n\n### Ví dụ đời thực\n- Triệu chứng: API thanh toán có 1 khách hàng tích hợp lỗi, gửi 50.000 request/phút làm p99 latency (độ trễ mà 99% request nhanh hơn hoặc bằng) tăng từ 120 ms lên 2.500 ms cho tất cả khách.\n- Điều tra: log gateway cho thấy 1 API key chiếm 92% traffic.\n- Xử lý: áp token bucket ở API gateway (cổng API: điểm vào duy nhất nhận request và áp chính sách như auth, rate limit), giới hạn 1.000/phút, sức chứa burst 200, trả header {{Retry-After}}.\n- Kết quả: traffic của client vi phạm bị giới hạn, p99 của các client khác trở về ~150 ms.\n\n### Trả lời mẫu khi phỏng vấn\nEm sẽ dùng rate limiting ở API gateway để bảo vệ hệ thống. Với yêu cầu cho phép burst ngắn, em chọn token bucket: token được nạp với tốc độ ổn định tương ứng giới hạn trung bình, và xô có sức chứa nhất định để tích luỹ token cho burst hợp lý. Request vượt quá thì trả 429 kèm Retry-After. Nếu cần chia sẻ bộ đếm giữa nhiều instance gateway, em lưu trạng thái trong Redis (kho key-value trong bộ nhớ, truy cập rất nhanh) và dùng thao tác nguyên tử như Lua script để tránh race condition. Em cũng phân biệt giới hạn theo API key hoặc theo user để công bằng.\n\n> Senior tip: Rate limit nên đặt ở nhiều tầng (edge/CDN, gateway, service) và trả thông tin quota qua header ({{X-RateLimit-Remaining}}, {{Retry-After}}). Với hệ phân tán, đừng đếm cục bộ từng node nếu không sẽ nhân giới hạn theo số node."
},
{
  "id": "qz-design-022",
  "topic": "design",
  "multi": true,
  "q": "Bạn thiết kế hệ thống chat 1-1 dùng WebSocket (kết nối hai chiều giữ lâu giữa client và server) và message queue (hàng đợi tin nhắn: thành phần trung gian lưu tạm tin nhắn để xử lý bất đồng bộ). Khi một server restart, một số tin nhắn bị mất hoặc gửi trùng. Những biện pháp nào giúp đảm bảo không mất tin nhắn và xử lý trùng an toàn? (Chọn 2)",
  "options": [
    "Lưu tin nhắn vào database bền vững (persistent storage: lưu trên đĩa, không mất khi restart) trước khi báo đã nhận (ack) cho người gửi, và dùng idempotency key (mã định danh duy nhất để xử lý lặp không gây tác dụng phụ thêm)",
    "Giữ tin nhắn chỉ trong bộ nhớ RAM của server để đạt độ trễ thấp nhất, không cần ghi đĩa",
    "Dùng at-most-once delivery (gửi nhiều nhất một lần) để chắc chắn không bao giờ trùng",
    "Consumer chỉ ack (xác nhận) cho queue sau khi xử lý xong; nếu retry gây trùng thì client/consumer khử trùng dựa trên message id",
    "Tắt hoàn toàn retry ở mọi nơi để tránh trùng"
  ],
  "answer": [
    0,
    3
  ],
  "explain": "**Tóm tắt:** Để không mất tin nhắn cần lưu bền vững và chỉ ack sau khi xử lý xong; để an toàn khi trùng cần idempotency (tính lũy đẳng: làm lặp nhiều lần cho cùng kết quả như làm một lần) và khử trùng.\n\n### Giải thích từng bước\n\n- **Vấn đề:** Dữ liệu chỉ trong RAM (bộ nhớ tạm) sẽ mất khi tiến trình crash/restart. Trong hệ phân tán, lỗi mạng khiến hệ thống phải retry (thử lại), nên một tin nhắn có thể được gửi/nhận nhiều lần.\n- **Message queue** (ví dụ Kafka, RabbitMQ) là trung gian lưu tin nhắn để bên gửi và bên nhận không cần online cùng lúc.\n\n- **Biện pháp 1 - Persist trước khi ack:**\n  1. Client gửi tin nhắn kèm {{messageId}} duy nhất do client sinh.\n  2. Server ghi tin nhắn vào database trên đĩa (ví dụ PostgreSQL).\n  3. Chỉ sau khi ghi thành công mới trả ack cho người gửi. Nếu server chết trước bước 3, người gửi retry; nhờ {{messageId}} và unique constraint (ràng buộc duy nhất trong DB) server không tạo bản trùng.\n- **Biện pháp 2 - Ack sau xử lý và khử trùng:**\n  1. Consumer xử lý xong mới ack cho queue; queue chỉ xoá tin sau khi có ack. Đây là mô hình at-least-once (gửi ít nhất một lần, có thể trùng).\n  2. Nếu consumer chết sau xử lý nhưng trước ack, queue giao lại tin nhắn.\n  3. Phía nhận lưu {{messageId}} đã xử lý hoặc dùng unique key để bỏ qua bản trùng.\n\n### Vì sao các phương án khác sai\n- **Chỉ giữ trong RAM**: nhanh nhưng mất dữ liệu ngay khi restart.\n- **At-most-once delivery**: gửi tối đa một lần nên khi lỗi sẽ không gửi lại, dẫn đến mất tin nhắn.\n- **Tắt hoàn toàn retry**: lỗi mạng tạm thời là bình thường; không retry đồng nghĩa mất tin khi gửi thất bại.\n\n### Ví dụ đời thực\n- Triệu chứng: sau rolling restart, ~0,2% tin nhắn biến mất, một số tin bị lặp.\n- Điều tra: server ack client khi tin mới vào RAM; consumer auto-ack queue trước khi ghi DB.\n- Xử lý: đổi sang ghi DB rồi ack client, manual ack sau xử lý, khử trùng theo {{messageId}}.\n- Kết quả: không còn mất tin sau 4 tuần; bản trùng hiếm được hấp thụ nhờ idempotent.\n\n### Trả lời mẫu khi phỏng vấn\nVới chat em chọn at-least-once kết hợp idempotency. Tin nhắn được persist xuống DB trước khi ack cho người gửi, queue chỉ xoá sau khi consumer ack. Vì có thể trùng, mỗi tin có messageId duy nhất và phía nhận dùng unique constraint hoặc bảng đã xử lý để khử trùng. Exactly-once end-to-end rất khó nên thực tế ưu tiên không mất dữ liệu và xử lý trùng an toàn.\n\n> Senior tip: Hiểu rõ ngữ nghĩa delivery (at-most-once, at-least-once, exactly-once). Với Kafka, phân biệt commit offset và hoàn tất nghiệp vụ để tránh ack sớm gây mất dữ liệu."
},
{
  "id": "qz-design-023",
  "topic": "design",
  "q": "Bảng {{orders}} tăng lên 500 triệu dòng, truy vấn theo {{user_id}} ngày càng chậm. Bạn dùng sharding (phân mảnh: chia dữ liệu thành nhiều database nhỏ hơn, mỗi mảnh gọi là shard). Chọn shard key (khóa phân mảnh: trường quyết định một bản ghi nằm ở shard nào) nào hợp lý nhất cho truy vấn chính \"lấy đơn hàng của một user\"?",
  "options": [
    "Shard theo {{created_at}} để mỗi tháng một shard, vì dữ liệu mới hay được truy cập",
    "Shard theo {{hash(user_id)}} để các đơn của cùng một user nằm trên cùng một shard và phân bố tương đối đều",
    "Shard theo {{order_id}} tự tăng để ghi tuần tự và dễ biết shard mới nhất",
    "Mỗi lần ghi chọn ngẫu nhiên một shard để cân bằng tải"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** Với truy vấn chủ yếu theo {{user_id}}, dùng {{hash(user_id)}} làm shard key giúp gom dữ liệu của cùng user vào một shard và phân tán tải đều.\n\n### Giải thích từng bước\n\n- **Sharding là gì?** Thay vì một database chứa 500 triệu dòng, ta chia thành nhiều shard, ví dụ 8 shard mỗi shard ~62 triệu dòng. Ứng dụng phải biết bản ghi nằm ở shard nào.\n- **Shard key là gì?** Trường dùng để tính shard đích, ví dụ {{shard = hash(user_id) % 8}}.\n- **Scatter-gather** (tản đi rồi gom lại): nếu dữ liệu của một user nằm rải rác nhiều shard, truy vấn phải hỏi tất cả shard rồi gộp, rất chậm.\n\n- **Vì sao {{hash(user_id)}} hợp lý?**\n  1. Cùng {{user_id}} luôn cho cùng hash nên mọi đơn của user X nằm trên một shard cố định.\n  2. Truy vấn lịch sử đơn của user chỉ chạm 1 shard (single-shard query).\n  3. Hàm hash phân bố user tương đối đều, tránh hot spot (một shard quá nóng).\n\n### Vì sao các phương án khác sai\n- **Shard theo {{created_at}}**: tốt cho truy vấn theo thời gian, nhưng đơn của một user rải rác nhiều shard (scatter-gather) và shard tháng hiện tại nhận toàn bộ ghi mới thành hot shard.\n- **Shard theo {{order_id}} tự tăng**: đơn của cùng user nằm khắp shard; truy vấn theo user phải hỏi mọi shard.\n- **Chọn ngẫu nhiên khi ghi**: cân bằng ghi nhưng phá khả năng định vị khi đọc, phải quét tất cả shard.\n\n### Ví dụ đời thực\n- Triệu chứng: trang lịch sử đơn p95 (95% request nhanh hơn mức này) mất 4,2 giây.\n- Điều tra: {{WHERE user_id = ? ORDER BY created_at DESC LIMIT 20}} scan nhiều dữ liệu trên một DB lớn.\n- Xử lý: chia 16 shard theo {{hash(user_id)}}, thêm lớp routing; truy vấn theo user chỉ chạm 1 shard.\n- Kết quả: p95 giảm còn ~180 ms; báo cáo toàn hệ thống chạy qua pipeline tổng hợp riêng.\n\n### Trả lời mẫu khi phỏng vấn\nEm chọn shard key theo access pattern chính. Nếu đa số truy vấn theo user_id, em dùng hash(user_id) để dữ liệu liên quan cùng shard, tránh scatter-gather. Em cũng tính tới user cực lớn gây hot spot và chuẩn bị chiến lược resharding như consistent hashing hoặc logical shard, vì đổi shard key sau này rất tốn kém.\n\n> Senior tip: Không có shard key hoàn hảo cho mọi truy vấn. Tối ưu cho truy vấn quan trọng nhất, dùng read model/search cho truy vấn phụ. Chọn số logical shard lớn từ đầu để dễ mở rộng."
},
{
  "id": "qz-design-024",
  "topic": "design",
  "q": "Trong hệ thống phân tán, bạn phải chọn giữa strong consistency (nhất quán mạnh: sau khi ghi xong, mọi lần đọc đều thấy dữ liệu mới nhất) và eventual consistency (nhất quán cuối cùng: sau một thời gian, các bản sao sẽ hội tụ về cùng giá trị). Với bài toán chuyển tiền giữa hai tài khoản, lựa chọn nào phù hợp nhất?",
  "options": [
    "Eventual consistency, vì chuyển tiền không cần chính xác ngay",
    "Strong consistency cho thao tác trừ/cộng số dư để tránh mất tiền hoặc trừ hai lần; các phần như hiển thị lịch sử có thể chấp nhận eventual consistency",
    "Strong consistency cho mọi thứ trong toàn hệ thống, kể cả gợi ý và quảng cáo",
    "Eventual consistency nhưng bỏ qua kiểm tra số dư để tăng tốc độ"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** Tiền bạc yêu cầu correctness (tính đúng) nên thao tác số dư cần strong consistency; các phần không quan trọng về tiền có thể eventual để tăng hiệu năng.\n\n### Giải thích từng bước\n\n- **Strong consistency là gì?** Sau khi một giao dịch ghi thành công, mọi client đọc ngay sau đó đều thấy giá trị mới. Ví dụ đời thường: số dư ATM cập nhật ngay sau khi rút tiền, không thể rút lần hai nếu đã hết.\n- **Eventual consistency là gì?** Các bản sao (replica) có thể tạm thời khác nhau nhưng sẽ hội tụ sau một khoảng trễ (replication lag). Ví dụ: bạn đổi avatar, bạn bè có thể thấy ảnh cũ vài giây rồi mới thấy ảnh mới.\n- **Vì sao chuyển tiền cần strong consistency?**\n  1. Nếu hai yêu cầu đọc số dư cũ cùng lúc (do replica chưa kịp cập nhật), hệ thống có thể cho phép trừ tiền hai lần (double spend) hoặc làm số dư âm.\n  2. Cần giao dịch (transaction) đảm bảo ACID hoặc cơ chế nhất quán tương đương: kiểm tra số dư và trừ tiền phải dựa trên trạng thái mới nhất.\n- **Phân tách theo miền:** ghi sổ cái/số dư dùng đường dẫn nhất quán mạnh; gửi thông báo, cập nhật bảng lịch sử hiển thị, thống kê có thể bất đồng bộ và eventual.\n\n### Vì sao các phương án khác sai\n- **Eventual consistency cho chuyển tiền**: chấp nhận đọc dữ liệu cũ dẫn đến rủi ro mất tiền, không thể chấp nhận trong tài chính.\n- **Strong consistency cho mọi thứ**: đúng cho số dư nhưng quá tốn kém và giảm độ sẵn sàng/độ trễ cho các phần như gợi ý, quảng cáo vốn không cần chính xác tức thời.\n- **Eventual nhưng bỏ kiểm tra số dư**: vừa sai về tính nhất quán vừa bỏ mất ràng buộc nghiệp vụ, chắc chắn gây lỗi tài chính.\n\n### Ví dụ đời thực\n- Triệu chứng: người dùng thấy số dư đủ nhưng giao dịch thỉnh thoảng bị từ chối, hoặc hiếm khi bị trừ hai lần trong hệ thống cũ đọc từ replica.\n- Điều tra: luồng trừ tiền đọc số dư từ read replica trễ ~800 ms.\n- Xử lý: chuyển kiểm tra và ghi số dư sang primary với transaction nhất quán; lịch sử giao dịch hiển thị đọc từ replica/eventual.\n- Kết quả: không còn double spend, p99 luồng chuyển tiền tăng nhẹ 20 ms nhưng đúng nghiệp vụ.\n\n### Trả lời mẫu khi phỏng vấn\nEm sẽ phân loại dữ liệu theo yêu cầu nghiệp vụ. Với chuyển tiền, tính đúng quan trọng nhất nên em dùng strong consistency cho bước kiểm tra và cập nhật số dư, ví dụ transaction trên nguồn dữ liệu chính hoặc cơ chế khóa/điều kiện nguyên tử. Với lịch sử, thông báo hay báo cáo, em chấp nhận eventual consistency để tối ưu độ trễ và khả năng mở rộng. Nói cách khác, không chọn một mức nhất quán cho cả hệ thống mà chọn theo từng use case.\n\n> Senior tip: Trong phỏng vấn, hãy nêu rõ trade-off theo CAP: khi có partition, bạn ưu tiên consistency hay availability cho từng loại dữ liệu. Tiền thì ưu tiên consistency (CP cho luồng ghi quan trọng)."
},
{
  "id": "qz-design-025",
  "topic": "design",
  "multi": true,
  "q": "Hệ thống thương mại điện tử dùng Redis làm cache (bộ nhớ đệm: lưu bản sao dữ liệu để đọc nhanh hơn) trước PostgreSQL. Sau khi cập nhật giá sản phẩm, người dùng thỉnh thoảng vẫn thấy giá cũ vài phút. Những biện pháp nào giúp giảm dữ liệu cũ trong cache một cách hợp lý? (Chọn 2)",
  "options": [
    "Áp dụng cache-aside: khi cập nhật DB thành công thì xoá (invalidate) key cache tương ứng để lần đọc sau lấy dữ liệu mới từ DB",
    "Ghi giá mới vào cache trước, rồi mới ghi vào DB để người dùng thấy nhanh",
    "Bỏ TTL (time-to-live: thời gian sống của key cache, hết hạn sẽ tự xoá) để cache luôn nhanh và không bao giờ bị miss",
    "Đặt TTL hợp lý cho key cache như một lưới an toàn, để dù quên xoá thì dữ liệu cũ cũng tự hết hạn sau một khoảng ngắn",
    "Xoá toàn bộ cache mỗi giây để đảm bảo luôn mới"
  ],
  "answer": [
    0,
    3
  ],
  "explain": "**Tóm tắt:** Kết hợp xoá cache khi ghi DB (invalidate) và đặt TTL hợp lý giúp giảm dữ liệu cũ mà vẫn giữ lợi ích hiệu năng của cache.\n\n### Giải thích từng bước\n\n- **Cache-aside (lazy loading) là gì?** Ứng dụng đọc: nếu cache có (hit) thì trả về; nếu không có (miss) thì đọc DB, ghi vào cache rồi trả về. Khi ghi: cập nhật DB rồi xoá key cache liên quan. Lần đọc sau sẽ miss và nạp giá trị mới.\n- **TTL là gì?** TTL (time-to-live) là thời gian sống, ví dụ 300 giây. Sau thời gian này Redis tự xoá key. TTL là lưới an toàn phòng trường hợp xoá cache thất bại.\n- **Tại sao chọn delete thay vì update cache khi ghi?** Nếu cập nhật cache, hai luồng ghi gần nhau có thể ghi cache theo thứ tự ngược với DB. Xoá cache đơn giản và an toàn hơn trong nhiều trường hợp.\n\n### Vì sao các phương án khác sai\n- **Ghi cache trước, DB sau**: nếu ghi DB thất bại, cache đã chứa giá trị sai/không tồn tại trong DB, gây lệch dữ liệu nghiêm trọng.\n- **Bỏ TTL**: nếu bước invalidate bị bỏ lỡ, dữ liệu cũ sẽ nằm mãi trong cache.\n- **Xoá toàn bộ cache mỗi giây**: gần như vô hiệu hoá cache, gây cache stampede (dồn tải ồ ạt về DB) và tăng độ trễ, chi phí DB.\n\n### Ví dụ đời thực\n- Triệu chứng: admin đổi giá từ 100.000 xuống 90.000 nhưng 5% người dùng vẫn thấy 100.000 trong ~10 phút.\n- Điều tra: luồng cập nhật ghi DB nhưng không xoá cache; key không có TTL.\n- Xử lý: áp dụng cache-aside với invalidate sau commit DB, đặt TTL 5 phút cho key giá, và thêm jitter (dao động ngẫu nhiên nhỏ) để tránh hết hạn đồng loạt.\n- Kết quả: giá mới hiển thị gần như ngay sau cập nhật; trường hợp miss invalidate tối đa lệch 5 phút thay vì vô hạn.\n\n### Trả lời mẫu khi phỏng vấn\nEm dùng chiến lược cache-aside: đọc thì ưu tiên cache, miss thì nạp từ DB; ghi thì cập nhật DB trước rồi xoá cache. Đồng thời em luôn đặt TTL làm lưới an toàn để dữ liệu cũ tự hết hạn nếu invalidate thất bại. Em cũng lưu ý race condition hiếm gặp giữa đọc và ghi, nên với dữ liệu quan trọng có thể kết hợp phiên bản hoặc cơ chế kiểm tra lại.\n\n> Senior tip: Cache invalidation là bài toán khó. Luôn hỏi dữ liệu này chấp nhận lệch bao lâu để chọn TTL và chiến lược phù hợp; đừng cố làm cache luôn đúng tuyệt đối nếu chi phí quá cao."
},
{
  "id": "qz-design-026",
  "topic": "design",
  "q": "Bạn dùng Kafka (hệ thống message queue/log phân tán: lưu luồng sự kiện theo thứ tự trong partition) để xử lý sự kiện đơn hàng. Yêu cầu: các sự kiện của cùng một {{order_id}} phải được xử lý đúng thứ tự (tạo -> thanh toán -> giao hàng). Bạn nên thiết kế key/partition như thế nào?",
  "options": [
    "Dùng {{order_id}} làm message key để Kafka ghi các sự kiện cùng key vào cùng một partition; mỗi partition chỉ có một consumer trong nhóm xử lý theo thứ tự",
    "Không dùng key, để Kafka phân phối round-robin (xoay vòng) cho đều để tăng tốc",
    "Dùng {{user_id}} làm key vì dễ nhớ, dù một user có nhiều đơn",
    "Tạo một partition duy nhất cho toàn bộ topic để đảm bảo thứ tự tuyệt đối cho mọi đơn"
  ],
  "answer": 0,
  "explain": "**Tóm tắt:** Kafka chỉ đảm bảo thứ tự trong một partition, nên cần dùng {{order_id}} làm key để mọi sự kiện của cùng đơn đi vào cùng partition và được xử lý tuần tự.\n\n### Giải thích từng bước\n\n- **Partition là gì?** Topic trong Kafka được chia thành nhiều partition (phân vùng). Mỗi partition là một log có thứ tự append-only. Các partition khác nhau xử lý song song nên không có đảm bảo thứ tự toàn cục giữa chúng.\n- **Consumer group là gì?** Nhóm consumer cùng đọc một topic; Kafka gán mỗi partition cho tối đa một consumer trong nhóm tại một thời điểm, nên trong một partition các message được xử lý tuần tự.\n- **Message key và hashing:** khi gửi message có key, Kafka tính hash(key) để chọn partition. Cùng key -> cùng partition -> giữ thứ tự.\n\n- **Áp dụng:** key = {{order_id}} đảm bảo \"tạo\", \"thanh toán\", \"giao hàng\" của đơn #123 luôn vào cùng partition và xử lý đúng trình tự. Các đơn khác có thể nằm partition khác và xử lý song song, nên hệ thống vẫn mở rộng được.\n\n### Vì sao các phương án khác sai\n- **Không dùng key (round-robin)**: sự kiện của cùng đơn có thể rơi vào partition khác nhau và xử lý lệch thứ tự, ví dụ giao hàng đến trước thanh toán.\n- **Dùng {{user_id}} làm key**: giữ thứ tự theo user nhưng một user có nhiều đơn thì các đơn khác nhau bị xếp nối tiếp trong cùng partition, gây nghẽn không cần thiết và không phản ánh đúng ràng buộc nghiệp vụ.\n- **Một partition duy nhất**: đảm bảo thứ tự toàn cục nhưng throughput (thông lượng) bị giới hạn bởi một consumer, không mở rộng được.\n\n### Ví dụ đời thực\n- Triệu chứng: thỉnh thoảng hệ thống ghi nhận \"giao hàng\" trước \"thanh toán\" cho cùng đơn.\n- Điều tra: producer gửi event không có key, Kafka phân phối round-robin vào 12 partition.\n- Xử lý: đổi producer gửi với key {{order_id}}, giữ số partition ổn định; consumer xử lý idempotent phòng retry.\n- Kết quả: không còn nghịch thứ tự trong cùng đơn, throughput vẫn đạt ~20.000 event/giây nhờ 12 partition.\n\n### Trả lời mẫu khi phỏng vấn\nKafka đảm bảo thứ tự trong partition, nên em chọn key theo thực thể cần giữ thứ tự, ở đây là order_id. Như vậy mọi sự kiện của cùng đơn vào cùng partition và được một consumer xử lý tuần tự. Em cân nhắc số partition đủ lớn để song song, và lưu ý khi tăng partition thì phân bố key có thể thay đổi, cần kế hoạch migration.\n\n> Senior tip: Đừng nhầm thứ tự trong partition với thứ tự toàn topic. Hãy xác định đúng phạm vi thứ tự nghiệp vụ cần (per order, per user, hay toàn hệ thống)."
},
{
  "id": "qz-design-027",
  "topic": "design",
  "q": "Hệ thống đọc tin tức có tỷ lệ đọc/ghi khoảng 100:1 (mỗi lần đăng bài có ~100 lượt đọc). Trang chủ cần tải nhanh dưới 200 ms. Kiến trúc nào giúp giảm tải database đọc hiệu quả nhất?",
  "options": [
    "Chỉ tăng kích thước instance database và giữ mọi request đọc/ghi vào cùng một DB",
    "Thêm cache (ví dụ Redis/CDN) cho dữ liệu đọc nhiều và dùng read replica (bản sao chỉ đọc) để tách tải đọc khỏi primary (DB chính nhận ghi)",
    "Ghi dữ liệu vào nhiều database khác nhau nhưng không có cơ chế đồng bộ hay cache",
    "Bắt client tự lưu toàn bộ dữ liệu trên trình duyệt và không gọi server"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** Với workload đọc rất nhiều, kết hợp cache và read replica giúp giảm tải cho primary và giảm độ trễ đọc.\n\n### Giải thích từng bước\n\n- **Đặc điểm 100:1:** cứ 1 ghi có 100 đọc. Nút thắt thường nằm ở đường đọc.\n- **Cache là gì?** Cache (Redis trong bộ nhớ, hoặc CDN - mạng phân phối nội dung đặt gần người dùng) lưu bản sao dữ liệu nóng (hay được đọc). Đọc cache thường mất 1-5 ms thay vì 20-100 ms từ DB.\n- **Read replica là gì?** Bản sao của primary database, nhận dữ liệu sao chép (replication) từ primary. Ứng dụng gửi truy vấn đọc sang replica, gửi ghi sang primary, nhờ vậy primary không bị quá tải bởi đọc.\n\n- **Luồng điển hình:**\n  1. Client yêu cầu trang chủ.\n  2. Ứng dụng kiểm tra cache; nếu hit trả ngay.\n  3. Nếu miss, đọc từ read replica, lưu vào cache với TTL, rồi trả về.\n  4. Khi có bài mới/cập nhật, ghi vào primary và xoá/cập nhật cache liên quan.\n\n### Vì sao các phương án khác sai\n- **Chỉ scale up DB đơn lẻ**: tăng CPU/RAM có giới hạn (vertical scaling) và vẫn là một điểm nghẽn.\n- **Nhiều DB không đồng bộ, không cache**: dữ liệu không nhất quán, client đọc có thể thấy dữ liệu khác nhau hoặc thiếu.\n- **Client lưu toàn bộ dữ liệu, không gọi server**: không thực tế với dữ liệu lớn và thay đổi liên tục, không đảm bảo dữ liệu mới và bảo mật.\n\n### Ví dụ đời thực\n- Triệu chứng: giờ cao điểm 20:00, trang chủ tải 1,8 giây, primary DB CPU 95%.\n- Điều tra: 98% truy vấn là đọc danh sách bài mới, cùng dữ liệu được đọc lặp lại.\n- Xử lý: thêm Redis cache TTL 30 giây cho trang chủ và 2 read replica cho truy vấn chi tiết; CDN cache tài nguyên tĩnh.\n- Kết quả: tải trang chủ ~120 ms ở cache hit, CPU primary giảm còn ~40%, hệ thống chịu được gấp 3 lưu lượng đọc.\n\n### Trả lời mẫu khi phỏng vấn\nVới tỷ lệ đọc/ghi 100:1, em ưu tiên tối ưu đường đọc. Em đặt cache (Redis và CDN nếu phù hợp) trước DB cho dữ liệu nóng để giảm độ trễ, và dùng read replica để phân tải truy vấn đọc khỏi primary. Em cũng tính đến replication lag nên dữ liệu cần đọc-sau-ghi của chính người dùng sẽ đi về primary hoặc có cơ chế bảo đảm.\n\n> Senior tip: Cache giúp rất nhiều nhưng thêm độ phức tạp (invalidate, stale data). Luôn đo cache hit rate và đặt TTL phù hợp với mức chấp nhận lệch dữ liệu."
},
{
  "id": "qz-design-028",
  "topic": "design",
  "multi": true,
  "q": "Một dịch vụ thanh toán phụ thuộc vào dịch vụ kho hàng đang bị chậm (phản hồi 10-20 giây thay vì 200 ms). Kết quả là thread của dịch vụ thanh toán bị giữ lại, gây nghẽn toàn hệ thống. Những cơ chế nào giúp bảo vệ hệ thống trong tình huống này? (Chọn 2)",
  "options": [
    "Dùng circuit breaker (cầu dao: cơ chế tự ngắt gọi sang dịch vụ lỗi sau ngưỡng thất bại, thử lại sau một khoảng thời gian) để fail fast (thất bại nhanh) thay vì chờ lâu",
    "Tăng timeout lên 60 giây và tăng số thread không giới hạn để chờ dịch vụ kho hồi phục",
    "Đặt timeout hợp lý cho cuộc gọi từ xa và dùng bulkhead (vách ngăn: cô lập tài nguyên như thread pool theo từng phụ thuộc) để lỗi của kho không cạn kiệt tài nguyên chung",
    "Bỏ mọi cơ chế lỗi và để request tự treo cho đến khi xong",
    "Gọi lại (retry) liên tục ngay lập tức không giới hạn số lần"
  ],
  "answer": [
    0,
    2
  ],
  "explain": "**Tóm tắt:** Circuit breaker giúp ngắt nhanh khi phụ thuộc lỗi, còn timeout và bulkhead giới hạn tác động lan truyền để bảo vệ tài nguyên hệ thống.\n\n### Giải thích từng bước\n\n- **Vấn đề cascading failure (lỗi dây chuyền):** dịch vụ kho chậm -> gọi kho bị treo -> thread pool (nhóm luồng xử lý) của thanh toán cạn -> request khác của thanh toán cũng không được xử lý.\n- **Timeout:** thời gian tối đa chờ một cuộc gọi. Timeout ngắn (ví dụ 500 ms - 2 s tuỳ ngữ cảnh) giúp giải phóng thread sớm thay vì chờ 20 giây.\n- **Circuit breaker:** có 3 trạng thái chính: Closed (gọi bình thường, đếm lỗi), Open (ngắt, fail fast trong thời gian chờ), Half-open (thử vài request để xem phụ thuộc hồi phục chưa). Giống cầu dao điện: quá tải thì ngắt để bảo vệ hệ thống.\n- **Bulkhead:** vách ngăn khoang tàu. Mỗi phụ thuộc có thread pool/connection pool riêng (ví dụ 20 thread cho kho). Kho chậm chỉ làm đầy khoang của nó, không ảnh hưởng khoang khác.\n\n### Vì sao các phương án khác sai\n- **Timeout 60 giây và thread không giới hạn**: giữ tài nguyên rất lâu và có thể tạo quá nhiều thread gây cạn RAM/CPU, làm sự cố tệ hơn.\n- **Bỏ mọi cơ chế lỗi**: request treo vô hạn, hệ thống nhanh chóng kiệt tài nguyên.\n- **Retry liên tục ngay lập tức không giới hạn**: tạo retry storm (bão retry) dồn thêm tải lên dịch vụ đang yếu.\n\n### Ví dụ đời thực\n- Triệu chứng: dịch vụ kho chậm do bảo trì DB, p99 thanh toán tăng từ 300 ms lên 15 giây, lỗi lan sang toàn bộ checkout.\n- Điều tra: thread pool 200 luồng đều bị block chờ gọi kho (timeout mặc định 30 giây).\n- Xử lý: đặt timeout gọi kho 1 giây, bulkhead 20 luồng riêng, circuit breaker mở sau 50% lỗi trong 10 giây và trả phản hồi degradable (giảm chức năng).\n- Kết quả: checkout các luồng không phụ thuộc kho vẫn hoạt động; khi kho hồi phục, circuit breaker half-open rồi đóng lại.\n\n### Trả lời mẫu khi phỏng vấn\nEm dùng timeout hợp lý để không giữ tài nguyên quá lâu, bulkhead để cô lập phụ thuộc, và circuit breaker để fail fast khi phụ thuộc lỗi liên tục. Kết hợp với fallback/degradation nếu nghiệp vụ cho phép. Em tránh retry vô hạn và sẽ dùng retry có backoff (giãn cách tăng dần) kèm giới hạn số lần.\n\n> Senior tip: Các cơ chế này (Resilience4j trong Spring Boot) cần cấu hình theo số liệu thực tế (latency p99, tỷ lệ lỗi) chứ không đặt bừa. Luôn có giám sát cho trạng thái circuit breaker và tỷ lệ timeout."
},
{
  "id": "qz-design-029",
  "topic": "design",
  "q": "Bạn có PostgreSQL primary (nhận ghi) và 2 read replica (bản sao nhận đọc). Ứng dụng ghi profile người dùng vào primary rồi chuyển người dùng sang trang xem profile, nhưng trang này đọc từ replica và đôi khi trả dữ liệu cũ. Đây là vấn đề gì và cách xử lý phù hợp nhất?",
  "options": [
    "Đây là mất dữ liệu vĩnh viễn trên primary; cần khôi phục từ backup",
    "Đây là replication lag (độ trễ sao chép: replica chưa kịp nhận thay đổi từ primary); với thao tác read-after-write của chính người dùng, đọc từ primary hoặc đợi replica bắt kịp",
    "Đây là lỗi do dùng SQL; chỉ cần chuyển sang NoSQL là hết",
    "Đây là deadlock (kẹt khoá) giữa primary và replica; cần xoá replica"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** Đây là replication lag gây ra hiện tượng đọc-sau-ghi không thấy dữ liệu mới; cần đảm bảo read-after-write consistency (nhất quán đọc sau ghi) cho phiên của người dùng vừa ghi.\n\n### Giải thích từng bước\n\n- **Replication lag là gì?** Primary ghi dữ liệu trước, sau đó thay đổi được truyền (replicate) sang replica. Khoảng thời gian từ lúc ghi trên primary đến lúc replica có cùng dữ liệu gọi là replication lag, có thể từ vài mili-giây đến vài giây tuỳ tải.\n- **Read-after-write consistency:** người dùng vừa cập nhật (ghi) thì kỳ vọng lần đọc ngay tiếp theo thấy thay đổi của chính mình. Nếu đọc rơi vào replica đang trễ, họ thấy dữ liệu cũ dù primary đã có dữ liệu mới.\n\n- **Cách xử lý phổ biến:**\n  1. **Đọc từ primary cho phiên vừa ghi:** sau khi ghi, gắn cờ/timestamp vào session trong vài giây và định tuyến đọc của phiên đó về primary.\n  2. **Theo dõi vị trí replication:** ghi nhận LSN/binlog position tại thời điểm ghi, chỉ đọc replica khi replica đã đuổi kịp.\n  3. **Chấp nhận eventual cho dữ liệu không quan trọng:** nhưng profile vừa sửa thường cần thấy ngay.\n\n### Vì sao các phương án khác sai\n- **Mất dữ liệu vĩnh viễn**: dữ liệu vẫn có trên primary; vấn đề là thời điểm replica nhìn thấy, không phải mất dữ liệu.\n- **Chuyển sang NoSQL là hết**: nhiều hệ NoSQL cũng có replica và lag tương tự; vấn đề nằm ở mô hình nhất quán.\n- **Deadlock giữa primary và replica**: replication thông thường không khoá theo kiểu deadlock ứng dụng; xoá replica làm mất khả năng mở rộng đọc.\n\n### Ví dụ đời thực\n- Triệu chứng: người dùng đổi tên hiển thị, trang reload vẫn hiện tên cũ trong 1-2 giây, refresh lại thì đúng.\n- Điều tra: metric cho thấy replica lag tăng lên ~1.500 ms lúc cao điểm ghi.\n- Xử lý: sau API cập nhật profile, set cờ \"read-from-primary\" trong session 5 giây; các đọc profile trong phiên đó đi primary, các đọc khác vẫn dùng replica.\n- Kết quả: người dùng luôn thấy thay đổi của mình ngay lập tức, tải đọc trên primary chỉ tăng ~3%.\n\n### Trả lời mẫu khi phỏng vấn\nEm nhận ra đây là replication lag. Với yêu cầu read-after-write của chính người dùng, em sẽ định tuyến các đọc trong phiên vừa ghi về primary trong một khoảng ngắn, hoặc đợi replica bắt kịp theo replication position. Các truy vấn đọc thuần túy, không yêu cầu thấy ngay thay đổi của chính mình, vẫn có thể dùng replica để giảm tải primary. Em cũng theo dõi metric lag để cảnh báo khi vượt ngưỡng.\n\n> Senior tip: Đừng route toàn bộ đọc về primary cho chắc vì sẽ mất lợi ích của replica. Hãy phân loại truy vấn: read-after-write nhạy cảm -> primary; đọc thông thường -> replica. Đây là trade-off kinh điển giữa consistency và scalability."
},
{
  "id": "qz-design-030",
  "topic": "design",
  "q": "Một trang sản phẩm có ảnh, CSS, JavaScript tĩnh (ít thay đổi) và thông tin giá/tồn kho (thay đổi thường xuyên). Người dùng ở nhiều quốc gia phàn nàn tải trang chậm. Bạn nên dùng CDN (Content Delivery Network: mạng máy chủ phân phối nội dung đặt gần người dùng) như thế nào cho hiệu quả?",
  "options": [
    "Đặt toàn bộ dữ liệu động như giá/tồn kho trên CDN với cache rất lâu và không bao giờ xoá",
    "Phục vụ tài nguyên tĩnh (ảnh, CSS, JS) qua CDN với cache-control phù hợp; dữ liệu động như giá/tồn kho lấy từ origin/API với chiến lược cache ngắn hoặc không cache tuỳ yêu cầu độ mới",
    "Không dùng CDN, chỉ đặt một server duy nhất ở một quốc gia để dễ quản lý",
    "Dùng CDN nhưng tắt hết cache để mọi request đều quay về origin"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** CDN phù hợp nhất cho nội dung tĩnh và có thể cache; dữ liệu động cần chiến lược cache ngắn hoặc lấy trực tiếp từ origin để đảm bảo độ mới.\n\n### Giải thích từng bước\n\n- **CDN là gì?** CDN là mạng các máy chủ (edge server) đặt ở nhiều vị trí địa lý. Khi người dùng ở Việt Nam truy cập, CDN có thể phục vụ nội dung từ edge gần Việt Nam thay vì từ server gốc (origin) ở Mỹ, giảm độ trễ mạng (latency do khoảng cách).\n- **Nội dung tĩnh vs động:** ảnh, CSS, JS thường giống nhau cho mọi người và ít đổi -> cache lâu rất hiệu quả. Giá, tồn kho thay đổi theo thời gian và cần độ chính xác -> cache lâu có thể gây sai.\n- **Chiến lược:**\n  1. Tĩnh: đặt {{Cache-Control: public, max-age=86400}} (1 ngày) hoặc dùng file name có hash ({{app.abc123.js}}) để cache rất lâu và đổi tên file khi cập nhật.\n  2. Động: API trả giá/tồn kho có thể {{max-age=30}} giây nếu chấp nhận lệch nhỏ, hoặc {{no-store}} nếu phải luôn mới.\n\n### Vì sao các phương án khác sai\n- **Cache lâu toàn bộ dữ liệu động**: người dùng có thể thấy giá/tồn kho sai trong thời gian dài, gây lỗi đặt hàng và mất uy tín.\n- **Không dùng CDN, một server duy nhất**: người dùng xa server chịu độ trễ cao (ví dụ thêm 200-300 ms round-trip), tải trang chậm.\n- **Dùng CDN nhưng tắt hết cache**: request vẫn đi qua CDN nhưng luôn quay về origin, mất lợi ích cache.\n\n### Ví dụ đời thực\n- Triệu chứng: người dùng ở châu Âu tải trang sản phẩm mất 3,2 giây, trong khi origin ở Singapore.\n- Điều tra: ảnh và JS (tổng 2 MB) được tải trực tiếp từ origin; TTFB (time to first byte) cao do khoảng cách.\n- Xử lý: đưa ảnh/CSS/JS lên CDN với cache 7 ngày và versioning; API giá/tồn kho cache 15 giây tại CDN.\n- Kết quả: thời gian tải tài nguyên tĩnh giảm còn ~400 ms ở châu Âu; giá hiển thị lệch tối đa 15 giây, chấp nhận được theo nghiệp vụ.\n\n### Trả lời mẫu khi phỏng vấn\nEm dùng CDN để đưa nội dung tĩnh gần người dùng và giảm tải origin. Tài nguyên tĩnh như ảnh, CSS, JS được cache lâu với versioning. Dữ liệu động như giá, tồn kho được thiết kế theo yêu cầu độ mới: nếu chấp nhận lệch nhỏ thì cache ngắn (vài chục giây), nếu cần chính xác thì đi thẳng origin hoặc dùng cơ chế invalidation. Em cũng chọn cache-control và đo hit rate để tối ưu.\n\n> Senior tip: CDN không chỉ cho file tĩnh; nhiều CDN hỗ trợ cache API response, edge logic. Luôn cân nhắc stale bao lâu là chấp nhận được cho từng loại dữ liệu thay vì áp một chính sách cho tất cả."
},
{
  "id": "qz-design-031",
  "topic": "design",
  "multi": true,
  "q": "Bạn xây dựng chatbot hỗ trợ nội bộ dùng RAG (Retrieval-Augmented Generation: kỹ thuật tìm tài liệu liên quan rồi đưa vào ngữ cảnh cho LLM trả lời). Sau khi triển khai, chatbot đôi khi trả lời sai dù tài liệu đúng có trong kho. Những nguyên nhân và cải tiến nào hợp lý? (Chọn 2)",
  "options": [
    "Chunking (chia nhỏ tài liệu) quá lớn hoặc cắt sai ngữ cảnh khiến đoạn truy xuất không chứa đủ thông tin; cần điều chỉnh kích thước chunk và thêm overlap (phần chồng lặp) hợp lý",
    "Không cần embedding (biểu diễn văn bản thành vector số để tìm theo ngữ nghĩa), chỉ cần tăng temperature (tham số tăng độ ngẫu nhiên câu trả lời) của LLM",
    "Kết quả retrieval (bước truy xuất) kém do truy vấn/embedding chưa phù hợp; có thể cải thiện bằng hybrid search (kết hợp tìm từ khóa và tìm vector ngữ nghĩa) và reranking (xếp hạng lại kết quả)",
    "Bỏ hoàn toàn bước kiểm tra nguồn trích dẫn vì LLM luôn đúng khi có dữ liệu",
    "Lưu toàn bộ tài liệu 10.000 trang vào một lần gọi LLM mà không cần retrieval để chắc chắn không thiếu"
  ],
  "answer": [
    0,
    2
  ],
  "explain": "**Tóm tắt:** Lỗi RAG thường đến từ bước chia nhỏ tài liệu và bước truy xuất; cần chunking/overlap phù hợp và cải thiện retrieval (hybrid search, rerank) để đưa đúng ngữ cảnh cho LLM.\n\n### Giải thích từng bước\n\n- **RAG là gì?** Thay vì để LLM (Large Language Model: mô hình ngôn ngữ lớn) trả lời chỉ dựa trên kiến thức có sẵn, ta tìm các đoạn tài liệu liên quan trong kho rồi đưa các đoạn đó vào prompt (ngữ cảnh) để LLM trả lời dựa trên nguồn.\n- **Chunking là gì?** Tài liệu dài được chia thành các chunk (mảnh nhỏ, ví dụ 300-800 token). Nếu chunk quá lớn chứa nhiều nhiễu; nếu quá nhỏ hoặc cắt giữa chừng thì mất ngữ cảnh. Overlap (chồng lặp 50-100 token giữa các chunk liền kề) giúp giữ mạch ý.\n- **Retrieval là gì?** Bước tìm các chunk liên quan nhất với câu hỏi, thường dùng embedding (vector số biểu diễn ý nghĩa) và tìm vector gần nhau. Nếu retrieval chọn nhầm chunk, LLM nhận ngữ cảnh sai và trả lời sai.\n- **Cải tiến:** hybrid search kết hợp BM25 (tìm từ khóa chính xác) và vector search (tìm theo nghĩa) để tăng recall; reranker (mô hình xếp hạng lại) chấm lại top-k kết quả để chọn đoạn thực sự liên quan.\n\n### Vì sao các phương án khác sai\n- **Bỏ embedding và tăng temperature**: temperature cao làm câu trả lời ngẫu nhiên hơn, không giúp tìm đúng tài liệu; không có embedding/vector search thì khó truy xuất theo ngữ nghĩa.\n- **Bỏ kiểm tra nguồn trích dẫn**: LLM có thể hallucination (bịa thông tin) hoặc suy luận sai ngay cả khi có ngữ cảnh; cần yêu cầu trích dẫn và kiểm tra.\n- **Nhét toàn bộ 10.000 trang vào một lần gọi**: vượt giới hạn context window (cửa sổ ngữ cảnh: số token tối đa LLM xử lý trong một lần), chi phí rất cao và độ trễ lớn; LLM cũng dễ bỏ sót thông tin ở giữa ngữ cảnh dài.\n\n### Ví dụ đời thực\n- Triệu chứng: chatbot trả lời sai quy trình nghỉ phép dù tài liệu HR có đoạn đúng.\n- Điều tra: chunk 2.000 token cắt đôi bảng quy định; truy vấn \"nghỉ phép năm\" chỉ trả về đoạn giới thiệu chung, không có bảng điều kiện.\n- Xử lý: giảm chunk xuống ~500 token với overlap 80 token, thêm hybrid search (BM25 + vector) và reranker lấy top 5; prompt yêu cầu trích dẫn đoạn nguồn.\n- Kết quả: tỷ lệ trả lời đúng trên bộ câu hỏi kiểm thử tăng từ 68% lên 91%, câu không chắc được trả lời \"không tìm thấy trong tài liệu\".\n\n### Trả lời mẫu khi phỏng vấn\nKhi RAG trả lời sai dù có tài liệu, em kiểm tra theo từng bước của pipeline: ingestion (chunking, metadata), retrieval (embedding, top-k, hybrid search), và generation (prompt, trích dẫn). Em sẽ điều chỉnh chunk size/overlap để giữ ngữ cảnh, dùng hybrid search và reranker để tăng chất lượng truy xuất, và yêu cầu model trả lời dựa trên nguồn kèm trích dẫn. Em cũng đo bằng bộ eval (câu hỏi - đáp án kỳ vọng) thay vì cảm tính.\n\n> Senior tip: RAG là bài toán hệ thống, không chỉ là nhét tài liệu vào LLM. Hãy log câu hỏi, các chunk được truy xuất và câu trả lời để debug; không có observability (quan sát) thì rất khó biết lỗi nằm ở retrieval hay generation."
},
{
  "id": "qz-design-032",
  "topic": "design",
  "q": "Bạn đưa tính năng tóm tắt tài liệu dùng LLM vào sản phẩm. Mỗi lần tóm tắt một tài liệu 10 trang tốn ~6.000 token đầu vào và ~500 token đầu ra, với 20.000 lượt/ngày. Chi phí tăng nhanh và đội tài chính yêu cầu tối ưu. Hướng nào hợp lý nhất để giảm chi phí mà vẫn giữ chất lượng chấp nhận được?",
  "options": [
    "Luôn dùng model lớn nhất, context dài nhất cho mọi yêu cầu, kể cả tác vụ rất đơn giản",
    "Tắt cache và logging để tiết kiệm, không đo lường gì thêm",
    "Phân loại tác vụ theo độ khó: dùng model nhỏ/rẻ cho tóm tắt ngắn hoặc tiền xử lý, model mạnh cho trường hợp khó; thêm cache cho tài liệu lặp lại, giới hạn độ dài đầu vào/ra và theo dõi chi phí theo tính năng",
    "Gửi toàn bộ tài liệu gốc mọi lần kể cả khi tài liệu không đổi, để model luôn có đủ ngữ cảnh"
  ],
  "answer": 2,
  "explain": "**Tóm tắt:** Tối ưu chi phí LLM cần kết hợp chọn model phù hợp theo tác vụ, giảm token không cần thiết (cache, giới hạn độ dài) và đo lường chi phí.\n\n### Giải thích từng bước\n\n- **Token là gì?** Token là đơn vị văn bản mà LLM xử lý (có thể là một từ hoặc một phần của từ). Nhà cung cấp thường tính phí theo số token đầu vào (input) và đầu ra (output). Ví dụ minh hoạ: 20.000 lượt/ngày * (6.000 input + 500 output) = 130 triệu token/ngày; chi phí thực tế phụ thuộc bảng giá từng model.\n- **Vì sao chi phí tăng nhanh?** Gọi model lớn, prompt dài, output dài và gọi lặp lại cho cùng nội dung đều làm tăng token tiêu thụ.\n\n- **Các hướng tối ưu:**\n  1. **Chọn model theo tác vụ (model routing):** tóm tắt ngắn, phân loại, trích xuất đơn giản có thể dùng model nhỏ/rẻ hơn; chỉ chuyển sang model mạnh khi cần suy luận phức tạp.\n  2. **Giảm token:** cắt bớt phần không cần thiết của tài liệu (tiền xử lý), giới hạn độ dài tóm tắt, dùng prompt ngắn gọn nhưng rõ.\n  3. **Cache:** nếu cùng tài liệu được tóm tắt lại, lưu kết quả để tránh gọi lại (prompt caching nếu nhà cung cấp hỗ trợ).\n  4. **Đo lường:** gắn tag chi phí theo endpoint/tính năng, theo dõi token và tỷ lệ cache hit để biết điểm tốn nhất.\n\n### Vì sao các phương án khác sai\n- **Luôn dùng model lớn nhất**: chất lượng có thể tốt hơn ở tác vụ khó nhưng lãng phí lớn cho tác vụ đơn giản.\n- **Tắt cache và logging**: tiết kiệm rất ít nhưng mất khả năng quan sát; không đo được thì không tối ưu được.\n- **Gửi toàn bộ tài liệu mọi lần dù không đổi**: tiêu tốn token lặp lại không cần thiết; nên cache kết quả hoặc tái sử dụng bản tóm tắt trung gian.\n\n### Ví dụ đời thực\n- Triệu chứng: hóa đơn LLM tăng từ 2.000 USD lên 9.500 USD/tháng khi tính năng tóm tắt mở cho toàn bộ người dùng.\n- Điều tra: 35% request là tóm tắt lại cùng tài liệu; 40% tài liệu rất ngắn nhưng vẫn gọi model lớn với prompt dài.\n- Xử lý: route tài liệu ngắn sang model nhỏ, cache kết quả theo hash tài liệu trong 24 giờ, giới hạn input 4.000 token và output 300 token cho chế độ nhanh.\n- Kết quả: chi phí giảm ~45%, p95 latency giảm từ 4,5 s xuống 2,1 s, chất lượng tóm tắt trên mẫu kiểm tra chỉ giảm 2%.\n\n### Trả lời mẫu khi phỏng vấn\nEm tối ưu chi phí LLM theo ba trục: giảm số lần gọi (cache, tránh trùng), giảm token mỗi lần gọi (rút gọn ngữ cảnh, giới hạn output), và chọn model phù hợp độ khó (model routing). Em luôn đo chi phí và chất lượng song song bằng bộ eval để đảm bảo tiết kiệm không làm hỏng trải nghiệm. Em cũng đặt giới hạn (quota/rate limit) để tránh chi phí bùng nổ bất thường.\n\n> Senior tip: Chi phí LLM phải được theo dõi như một SLO sản phẩm (cost per request/feature). Thiết kế fallback: khi ngân sách hoặc quota chạm ngưỡng, chuyển sang model rẻ hơn hoặc chế độ rút gọn thay vì sập tính năng."
},
{
  "id": "qz-design-033",
  "topic": "design",
  "q": "Bạn tích hợp LLM vào API trả lời khách hàng. Yêu cầu sản phẩm: người dùng thấy phản hồi xuất hiện dần (không chờ 8-10 giây mới có toàn bộ), và p95 end-to-end (từ lúc gửi yêu cầu đến khi nhận xong) cần thấp. Kỹ thuật nào giúp cải thiện trải nghiệm độ trễ cảm nhận rõ nhất?",
  "options": [
    "Chờ LLM sinh xong toàn bộ câu trả lời rồi mới gửi một lần về client",
    "Dùng streaming (truyền dần từng phần token về client ngay khi có) qua Server-Sent Events hoặc streaming response, để người dùng đọc trong khi model còn sinh",
    "Tăng kích thước prompt gấp đôi để model hiểu rõ hơn bất kể chi phí thời gian",
    "Gọi LLM tuần tự nhiều lần mà không song song hoá các bước độc lập"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** Streaming cho phép gửi từng phần kết quả về client ngay khi LLM sinh ra, giảm time-to-first-token (thời gian tới token đầu tiên) và cải thiện độ trễ cảm nhận.\n\n### Giải thích từng bước\n\n- **Độ trễ trong LLM:** tổng thời gian gồm thời gian xếp hàng, xử lý prompt (prefill) và sinh từng token (decode). Với câu trả lời dài, chờ toàn bộ có thể mất nhiều giây.\n- **Streaming là gì?** Thay vì đợi đủ toàn bộ văn bản, server nhận token/đoạn nhỏ từ LLM và chuyển tiếp ngay cho client (thường qua HTTP streaming hoặc Server-Sent Events - kênh server đẩy sự kiện từng phần về trình duyệt). Người dùng thấy chữ xuất hiện dần.\n- **Time-to-first-token (TTFT):** thời gian đến khi ký tự đầu tiên xuất hiện. TTFT thường thấp hơn nhiều so với thời gian hoàn tất; streaming tối ưu cảm nhận này.\n\n- **Các tối ưu bổ sung:** rút gọn prompt, dùng model phù hợp, song song hoá bước retrieval và các gọi độc lập, cache. Nhưng với yêu cầu \"phản hồi xuất hiện dần\", streaming là kỹ thuật trực tiếp.\n\n### Vì sao các phương án khác sai\n- **Chờ sinh xong rồi gửi một lần**: TTFT bằng tổng thời gian sinh, trải nghiệm chờ đợi tệ với câu trả lời dài.\n- **Tăng prompt gấp đôi**: thường làm tăng thời gian prefill và chi phí, không cải thiện độ trễ cảm nhận.\n- **Gọi tuần tự nhiều lần không song song**: cộng dồn độ trễ các bước; các bước độc lập (ví dụ truy xuất nhiều nguồn) nên chạy song song khi có thể.\n\n### Ví dụ đời thực\n- Triệu chứng: người dùng chờ 9 giây mới thấy câu trả lời, tỷ lệ thoát trang cao.\n- Điều tra: TTFT ~1,2 giây nhưng server chỉ trả response sau khi hoàn tất ~9 giây; UI hiển thị spinner suốt thời gian đó.\n- Xử lý: bật streaming từ API LLM đến backend đến frontend (SSE), hiển thị token dần; đồng thời song song hoá bước retrieval.\n- Kết quả: TTFT giữ ~1,2 giây, người dùng bắt đầu đọc ngay; tỷ lệ thoát giảm 30%.\n\n### Trả lời mẫu khi phỏng vấn\nĐể cải thiện độ trễ cảm nhận, em dùng streaming để trả token dần cho client ngay khi có, giúp giảm TTFT. Em kết hợp với tối ưu pipeline: prompt gọn, model phù hợp, cache và chạy song song các bước độc lập như retrieval. Em vẫn đo cả TTFT và thời gian hoàn tất end-to-end, vì streaming cải thiện cảm nhận nhưng không tự làm model sinh nhanh hơn.\n\n> Senior tip: Khi streaming, cần xử lý lỗi giữa chừng (stream bị ngắt), timeout, và không để lộ dữ liệu nhạy cảm trong từng mẩu. Ở Spring Boot có thể dùng SSE ({{SseEmitter}}) hoặc reactive streams tuỳ kiến trúc."
},
{
  "id": "qz-design-034",
  "topic": "design",
  "multi": true,
  "q": "Bạn thiết kế trợ lý AI gọi API nội bộ (đặt lịch, tra cứu đơn hàng) thông qua tool calling (LLM yêu cầu gọi hàm/công cụ với tham số). Những biện pháp nào giúp hệ thống an toàn và đáng tin cậy? (Chọn 2)",
  "options": [
    "Xác thực và phân quyền (authorization) ở phía server cho từng tool call dựa trên danh tính người dùng, không tin mù quáng vào tham số do LLM đề xuất",
    "Cho LLM quyền gọi mọi API nội bộ, kể cả xoá dữ liệu, mà không cần kiểm tra hay xác nhận",
    "Validate (kiểm tra hợp lệ) schema và giá trị tham số, giới hạn tool được phép, timeout/retry an toàn và ghi log/audit (nhật ký kiểm tra) cho mỗi lần gọi",
    "Bỏ qua idempotency vì tool call do AI thực hiện thì không bao giờ bị lặp",
    "Nhúng trực tiếp bí mật (secret key) vào prompt hệ thống và trả về cho client để dễ gọi tool"
  ],
  "answer": [
    0,
    2
  ],
  "explain": "**Tóm tắt:** Tool calling phải được đối xử như một request từ client không đáng tin: cần phân quyền ở server, validate tham số, giới hạn phạm vi và có audit/timeout.\n\n### Giải thích từng bước\n\n- **Tool calling là gì?** LLM không trực tiếp thực thi hành động; nó trả về yêu cầu \"hãy gọi hàm X với tham số Y\". Ứng dụng của bạn mới là bên thực sự gọi API/hàm. Vì LLM có thể bị prompt injection (chèn chỉ dẫn độc hại) hoặc hiểu sai, tham số do LLM sinh ra **không đáng tin**.\n- **Phân quyền ở server:** mỗi tool call phải gắn với danh tính người dùng (user/session) và kiểm tra quyền. Ví dụ người dùng A không được tra cứu đơn hàng của người dùng B dù LLM đề xuất.\n- **Validate và giới hạn:** chỉ cho phép danh sách tool được định nghĩa (allowlist), kiểm tra schema (kiểu dữ liệu, giá trị hợp lệ), đặt timeout, và với hành động có tác dụng phụ (ghi/xoá) cần cân nhắc xác nhận hoặc cơ chế idempotent.\n- **Audit:** ghi log ai yêu cầu, tool nào, tham số (đã che bớt dữ liệu nhạy cảm), kết quả, để điều tra sự cố.\n\n### Vì sao các phương án khác sai\n- **Cho phép gọi mọi API không kiểm tra**: rủi ro nghiêm trọng (xoá dữ liệu, lộ thông tin) nếu LLM bị thao túng hoặc sai.\n- **Bỏ qua idempotency**: mạng lỗi hoặc retry có thể khiến cùng tool call được thực hiện lại; hành động như tạo đơn cần idempotency key.\n- **Nhúng bí mật vào prompt và trả client**: lộ secret, vi phạm bảo mật cơ bản.\n\n### Ví dụ đời thực\n- Triệu chứng: trợ lý AI vô tình huỷ đơn hàng của khách khác sau khi người dùng nhập câu lệnh mơ hồ.\n- Điều tra: tool {{cancelOrder(orderId)}} không kiểm tra chủ sở hữu đơn; tham số lấy trực tiếp từ output của LLM.\n- Xử lý: thêm kiểm tra ownership ở server, validate {{orderId}} thuộc user hiện tại, yêu cầu xác nhận cho hành động huỷ, và ghi audit log.\n- Kết quả: không còn huỷ nhầm; các yêu cầu bất thường bị từ chối với thông báo rõ ràng.\n\n### Trả lời mẫu khi phỏng vấn\nEm coi output của LLM là untrusted input. Với tool calling, server phải xác thực người dùng, phân quyền cho từng tool và từng tài nguyên, validate schema/tham số theo allowlist, và áp timeout cũng như idempotency cho hành động có tác dụng phụ. Em ghi audit log và giới hạn phạm vi tool để giảm rủi ro. Với hành động nhạy cảm, em thêm bước xác nhận của người dùng.\n\n> Senior tip: Nguyên tắc least privilege (quyền tối thiểu) rất quan trọng: chỉ cấp cho trợ lý AI đúng những tool và dữ liệu cần cho nhiệm vụ. Đừng để LLM trở thành đường tắt vượt qua kiểm soát truy cập của bạn."
},
{
  "id": "qz-design-035",
  "topic": "design",
  "q": "Dịch vụ tóm tắt bằng LLM của bạn phụ thuộc vào nhà cung cấp bên ngoài. Giờ cao điểm, nhà cung cấp trả lỗi 429 (quá tải/quá hạn mức) và độ trễ tăng vọt, làm toàn bộ tính năng tóm tắt ngừng hoạt động. Thiết kế nào giúp hệ thống degrade gracefully (giảm chức năng một cách êm, vẫn phục vụ phần còn lại)?",
  "options": [
    "Retry (thử lại) ngay lập tức không giới hạn và giữ request người dùng chờ vô hạn đến khi nhà cung cấp hồi phục",
    "Kết hợp timeout, retry có backoff (giãn cách tăng dần) và jitter (ngẫu nhiên nhỏ), circuit breaker, fallback (phương án dự phòng như model khác hoặc trả kết quả rút gọn/queued), cùng hàng đợi để xử lý bất đồng bộ khi phù hợp",
    "Tắt hoàn toàn mọi cơ chế lỗi để giảm độ phức tạp code",
    "Gửi cùng một request song song 20 lần tới cùng nhà cung cấp để tăng cơ hội thành công"
  ],
  "answer": 1,
  "explain": "**Tóm tắt:** Khi phụ thuộc LLM bên ngoài không ổn định, cần timeout, retry có kiểm soát, circuit breaker và fallback/hàng đợi để hệ thống vẫn hoạt động ở mức giảm chức năng thay vì sập.\n\n### Giải thích từng bước\n\n- **Vấn đề phụ thuộc ngoài:** bạn không kiểm soát hạ tầng của nhà cung cấp LLM. Lỗi 429 (rate limit/quá tải) và latency spike là tình huống thực tế.\n- **Timeout:** giới hạn thời gian chờ (ví dụ 10-15 giây tuỳ tác vụ) để không giữ tài nguyên vô hạn.\n- **Retry có backoff và jitter:** thử lại sau 1s, 2s, 4s... và thêm jitter để nhiều client không retry cùng lúc. Chỉ retry lỗi tạm thời (429, 5xx), không retry lỗi do input sai (4xx khác 429).\n- **Circuit breaker:** nếu lỗi liên tục, mở mạch để fail fast và chuyển sang fallback trong thời gian chờ, tránh dồn thêm tải.\n- **Fallback:** tuỳ nghiệp vụ có thể dùng model dự phòng (nhà cung cấp khác/model nhỏ hơn), trả tóm tắt trích xuất đơn giản, hoặc xếp vào hàng đợi xử lý sau và thông báo kết quả sẽ có sau.\n\n### Vì sao các phương án khác sai\n- **Retry ngay lập tức không giới hạn, chờ vô hạn**: làm tệ thêm tình trạng quá tải (retry storm), giữ thread/connection và kéo sập cả dịch vụ của bạn.\n- **Tắt mọi cơ chế lỗi**: hệ thống không có khả năng phục hồi, lỗi phụ thuộc sẽ lan truyền trực tiếp tới người dùng.\n- **Gửi song song 20 lần cùng request**: nhân 20 lần lưu lượng lên nhà cung cấp đang quá tải, vi phạm rate limit và tăng chi phí.\n\n### Ví dụ đời thực\n- Triệu chứng: 18:00 nhà cung cấp LLM trả 429 và p99 tăng 12 giây, trang tóm tắt báo lỗi hàng loạt.\n- Điều tra: client retry ngay lập tức 5 lần cho mỗi request, không có circuit breaker; 100% request đồng bộ chờ kết quả.\n- Xử lý: thêm timeout 12 giây, retry tối đa 2 lần với exponential backoff + jitter, circuit breaker mở sau ngưỡng lỗi; fallback chuyển sang model nhỏ dự phòng, nếu vẫn lỗi thì xếp job vào queue và trả trạng thái đang xử lý.\n- Kết quả: khi nhà cung cấp lỗi, 70% request vẫn có tóm tắt nhanh, 30% được xử lý trễ trong 3-5 phút; không còn sập dây chuyền.\n\n### Trả lời mẫu khi phỏng vấn\nEm thiết kế theo hướng chịu lỗi: timeout để giới hạn chờ, retry có backoff/jitter cho lỗi tạm thời, circuit breaker để fail fast khi phụ thuộc xuống, và fallback phù hợp nghiệp vụ (model dự phòng, kết quả rút gọn, hoặc xử lý bất đồng bộ qua queue). Em cũng theo dõi tỷ lệ lỗi, độ trễ và chi phí để điều chỉnh ngưỡng. Mục tiêu là degrade gracefully thay vì để toàn bộ tính năng sập.\n\n> Senior tip: Luôn phân biệt lỗi nào nên retry (429, timeout, 5xx tạm thời) và lỗi nào không (400 do input sai). Với tính năng LLM, thiết kế sản phẩm nên có đường lui (UX fallback) chứ không chỉ dựa vào hạ tầng."
},
{
  id: 'qz-design-036',
  topic: 'design',
  q: 'Cụm Kafka 6 broker, nhân bản (số bản sao mỗi partition trên các broker khác nhau) bằng 3. Producer cấu hình {{acks=all}} nhưng cấu hình {{min.insync.replicas=1}}. Leader của partition nhận ghi rồi bị mất kết nối với 2 broker còn lại, ngay lúc đó leader chết. Điều gì xảy ra với các bản ghi vừa ack? (Chọn 2)',
  multi: true,
  options: [
    'Với {{acks=all}} và {{min.insync.replicas=1}}, chỉ cần leader còn trong tập ISR (in-sync replicas: các broker theo kịp leader) là ghi đã được coi là thành công, nên batch vừa ack có thể biến mất khi leader chết',
    'Nên đặt {{acks=all}} cùng {{min.insync.replicas=2}} và số broker tối thiểu đủ lớn, để ghi chỉ thành công khi ít nhất 2 bản sao đã lưu; khi đó mất 1 broker vẫn còn dữ liệu đã ack',
    '{{replication.factor=3}} đảm bảo mọi bản ghi đã ack luôn còn nguyên vẹn kể cả khi mất hoàn toàn một datacenter',
    'Nếu một broker chậm (rớt khỏi ISR rồi quay lại), nên giảm {{min.insync.replicas}} xuống 1 để broker đó được ghi vào ngay lập tức'
  ],
  answer: [0, 1],
  explain: '**Tóm tắt:** {{acks=all}} chỉ có nghĩa "chờ đủ số bản sao theo {{min.insync.replicas}}", không phải "chờ đủ {{replication.factor}}". Khi cấu hình mặc định là 1, một bản ghi đã ack vẫn có thể mất nếu leader chết trước khi kịp nhân bản.\n\n### Giải thích từng bước\n\n- **Quorum ghi trong Kafka là gì?** Một ghi được coi là thành công khi có ít nhất {{min.insync.replicas}} broker (gồm cả leader) đã ghi vào log. Tập ISR là các broker đang theo kịp leader (không chậm quá {{replica.lag.time.max.ms}}).\n- **Vì sao mất dữ liệu?** Leader nhận ghi và chỉ có 1 bản trong ISR (chính leader) nên đã thoả quorum → trả ack cho producer. Ngay sau đó leader chết, 2 bản còn lại chưa có dữ liệu. Broker mới lên làm leader từ một bản không có bản ghi đó → mất dữ liệu đã ack.\n- **Vì sao {{replication.factor=3}} không cứu được?** Nhân bản chỉ bảo vệ khi bạn mất broker **sau khi** dữ liệu đã được nhân bản. Quorum yếu thì nhân bản không chạy kịp.\n\n### Vì sao các phương án khác sai\n- **{{replication.factor=3}} an toàn tuyệt đối**: sai. Không có cấu hình quorum nào chống được mất dữ liệu đã ack nếu quorum quá yếu; còn datacenter cháy là chuyện của DR (disaster recovery: khôi phục sau thảm hoạ) đa vùng.\n- **Giảm {{min.insync.replicas}} xuống 1 khi một broker chậm**: sai hẳn. Làm vậy thì quorum yếu đi đúng lúc hệ thống đang mất một bản sao, rủi ro mất dữ liệu đã ack tăng chứ không giảm.\n\n### Ví dụ đời thực\n- Triệu chứng: một cửa hàng thấy đơn hàng "đã thanh toán" biến mất sau khi broker 3 restart.\n- Điều tra: topic cấu hình {{acks=all}} nhưng {{min.insync.replicas=1}}; broker 3 chết giữa 2 lần flush, leader mới không có bản ghi.\n- Xử lý: {{acks=all}}, {{min.insync.replicas=2}}, {{replication.factor=3}}, bật {{unclean.leader.election.enable=false}}.\n- Kết quả: mất broker vẫn còn dữ liệu, p99 ghi tăng khoảng 15%.\n\n### Trả lời mẫu khi phỏng vấn\nTrong Kafka, "đã ack" chỉ có nghĩa "đủ quorum theo cấu hình", nên em luôn kiểm tra ba tham số cùng nhau: {{acks}}, {{min.insync.replicas}} và {{unclean.leader.election.enable}}. Với dữ liệu tiền/đơn hàng, em dùng {{acks=all}}, {{min.insync.replicas=2}} trên tối thiểu 3 broker, và tắt bầu leader không sạch. Em chấp nhận ghi chậm hơn để không mất dữ liệu.\n\n> Senior tip: Hãy xem ISR như một hợp đồng: dữ liệu đã ack chỉ an toàn khi số bản sao đồng bộ luôn lớn hơn 1. Đặt quorum 2 rồi kiểm tra bằng chaos test (giết broker chủ động) trước khi tin.'
},
{
  id: 'qz-design-037',
  topic: 'design',
  q: 'Bạn thiết kế REST API cho resource {{Order}} (đơn hàng), có các thao tác: xem chi tiết, tạo đơn, cập nhật địa chỉ giao, và huỷ đơn. Api version đặt ở URL ({{/v1/orders}}). Đâu là cách thiết kế phù hợp? (Chọn 2)',
  multi: true,
  options: [
    'Dùng đúng HTTP method theo ngữ nghĩa: {{GET}} để đọc (an toàn, idempotent, có thể cache), {{POST}} để tạo (không idempotent), {{PATCH}} để sửa một phần, {{DELETE}} để huỷ; mỗi lần đọc dùng {{If-None-Match}} với ETag để tiết kiệm băng thông',
    'Mọi thao tác đều là {{POST}} (kể cả đọc) để đơn giản và tránh bị cache',
    'Endpoint {{GET /v1/orders/123}} trả về 404 khi đơn không tồn tại, và nếu client gửi token hết hạn thì trả 200 kèm body {{status: "error"}}',
    'Mỗi lần thay đổi response thì thêm version mới {{/v2/orders}} mà không bao giờ bỏ version cũ; đồng thời dùng {{GET}} cho tài nguyên lớn, kết quả nặng, và trang hoá bằng cursor thay vì OFFSET lớn'
  ],
  answer: [0, 3],
  explain: '**Tóm tắt:** Hãy để HTTP method mang ngữ nghĩa, trả HTTP status đúng, và quản lý version bằng cách thêm version mới thay vì phá vỡ hợp đồng hiện có; pagination dùng cursor khi dữ liệu lớn.\n\n### Giải thích từng bước\n\n- **Method nào cho việc gì?** {{GET}} = đọc, không làm đổi dữ liệu (safe) và gọi lại bao nhiêu lần cũng ra kết quả như nhau (idempotent); {{POST}} = tạo mới, không idempotent; {{PUT}} = thay thế toàn bộ, idempotent; {{PATCH}} = sửa một phần; {{DELETE}} = xoá.\n- **Status code nói lên điều gì?** 2xx thành công, 4xx lỗi do client, 5xx lỗi server. 401 chưa đăng nhập, 403 đã đăng nhập nhưng không đủ quyền, 404 không tìm thấy, 409 xung đột trạng thái, 422 dữ liệu không hợp lệ về nghiệp vụ.\n- **Cache có điều kiện:** client gửi lại {{If-None-Match}} kèm ETag; nếu nội dung không đổi, server trả 304 (không có body) → tiết kiệm băng thông.\n- **Version:** client đã tích hợp {{/v1}} thì không được đổi ngầm. Thêm {{/v2}} hoặc thêm field tuỳ chọn (optional) vào response cũ.\n\n### Vì sao các phương án khác sai\n- **Mọi thứ là POST:** mất cache, mất tính idempotent, proxy không thể retry an toàn, khó dùng công cụ chung.\n- **Trả 200 cho lỗi:** client không phân biệt được thành công/thất bại; log/monitoring không đếm được tỉ lệ lỗi.\n\n### Ví dụ đời thực\n- Triệu chứng: app mobile hiển thị "đơn hàng trống" dù đơn tồn tại.\n- Điều tra: server trả 200 kèm body rỗng khi hết hạn token thay vì 401.\n- Xử lý: chuẩn hoá mã lỗi ({{code, message, details[]}}), trả 401/403/404 đúng, thêm ETag.\n- Kết quả: client tự refresh token, băng thông giảm 30%.\n\n### Trả lời mẫu khi phỏng vấn\nEm thiết kế API quanh resource và method: GET/PATCH/DELETE theo ngữ nghĩa, trả HTTP status đúng, lỗi có body chuẩn hoá, version bằng URL hoặc header. Với danh sách lớn, em dùng cursor pagination thay vì OFFSET, và cache có điều kiện bằng ETag. Em không phá vỡ hợp đồng cũ, chỉ thêm field optional hoặc version mới.\n\n> Senior tip: Một API tốt được đánh giá bằng việc client có đoán đúng hành vi không. Hãy viết OpenAPI spec và contract test để thay đổi không làm vỡ client cũ.'
},
{
  id: 'qz-design-038',
  topic: 'design',
  q: 'API {{GET /orders}} dùng {{OFFSET 100000 LIMIT 20}} trên bảng 200 triệu dòng. Các trang đầu nhanh, nhưng trang sâu (offset lớn) chậm dần và dữ liệu có thể bị lặp hoặc thiếu khi có đơn mới xen vào. Cách sửa tốt nhất?',
  options: [
    'Keyset (cursor) pagination: dùng {{WHERE (created_at, id) < (:lastCreatedAt, :lastId) ORDER BY created_at DESC, id DESC LIMIT 20}} và trả opaque cursor cho client',
    'Giữ OFFSET nhưng giảm LIMIT xuống 1 để nhẹ hơn',
    'Thêm LIMIT 20 và tăng offset theo cấp số nhân để bớt số lần gọi',
    'Dùng đếm toàn bộ bảng {{SELECT count(*)}} mỗi lần gọi để biết tổng số trang'
  ],
  answer: 0,
  explain: '**Tóm tắt:** OFFSET buộc database phải đọc và bỏ qua N dòng nên càng sâu càng chậm và dễ lệch khi dữ liệu chèn thêm; keyset pagination dùng vị trí cuối trang trước làm mốc nên chi phí không đổi.\n\n### Giải thích từng bước\n\n- **OFFSET làm gì?** Database phải sắp xếp, đếm, nhảy qua N dòng rồi mới lấy 20 dòng. Trang 5.000 (offset 100.000) đọc 100.020 dòng chỉ để trả 20 → chậm gấp hàng nghìn lần trang đầu.\n- **Vì sao dữ liệu bị lặp/thiếu?** Có đơn mới được chèn lên đầu trong lúc client đang lật trang: offset 0-20 giờ là đơn khác, đơn cũ bị đẩy xuống → lặp. Nếu có đơn bị xoá thì đơn bị bỏ qua.\n- **Keyset hoạt động thế nào?** Ghi nhớ (created_at, id) của dòng cuối trang trước; trang sau lọc đúng các dòng nhỏ hơn mốc đó. Có index trên (created_at, id) thì mỗi trang chỉ đọc 20 dòng → thời gian gần như không đổi.\n- **Cursor opaque:** server mã hoá cursor (ví dụ base64 JSON hoặc token ký) để client không tự sửa được.\n\n### Vì sao các phương án khác sai\n- **Giảm LIMIT**: offset vẫn lớn nên vẫn phải quét N dòng.\n- **Tăng offset theo cấp số nhân**: không giải quyết bản chất, còn gây nhảy trang.\n- **{{count(*)}} mỗi request**: trên 200 triệu dòng là thao tác rất nặng, chỉ nên đếm xấp xỉ khi thật cần.\n\n### Ví dụ đời thực\n- Triệu chứng: trang "lịch sử giao dịch" của user có 5.000 đơn, trang 200 mất 4 giây.\n- Điều tra: query dùng OFFSET, EXPLAIN cho thấy đọc 100.000 dòng cho mỗi trang.\n- Xử lý: đổi sang keyset, index {{orders(created_at DESC, id DESC)}}, trả cursor.\n- Kết quả: p95 giảm từ 4,2 s xuống 60 ms, không còn đơn bị lặp.\n\n### Trả lời mẫu khi phỏng vấn\nVới bảng lớn, em không dùng OFFSET mà dùng keyset pagination: lấy cặp (created_at, id) của bản ghi cuối, lọc bằng điều kiện nhỏ hơn, kèm index phủ đúng thứ tự sắp xếp. Ưu điểm là chi phí mỗi trang không đổi và không bị lệch khi có chèn/xoá. Nếu bắt buộc phải nhảy trang tuỳ ý, em giới hạn số trang và dùng snapshot hoặc tìm kiếm theo bộ lọc thay thế.\n\n> Senior tip: Khi dùng keyset, luôn có tie-breaker là id duy nhất. So sánh chỉ trên created_at sẽ nhảy hoặc lặp nếu hai bản ghi cùng timestamp.'
},
{
  id: 'qz-design-039',
  topic: 'design',
  q: 'Bạn thêm search bằng pgvector (extension vector của PostgreSQL) cho 5 triệu mô tả sản phẩm, dùng embedding 1.536 chiều. Theo dõi chỉ số nào cho thấy hệ thống đang đánh đổi đúng giữa chất lượng và độ trễ? (Chọn 3)',
  multi: true,
  options: [
    'Recall@k (tỉ lệ kết quả đúng có trong top k) so với ground truth (kết quả đúng đã biết trước), đo định kỳ trên một bộ truy vấn cố định',
    'p95 độ trễ truy vấn (thời gian phản hồi của 95% truy vấn) và độ trễ ở backend sau khi áp bộ lọc theo danh mục và giá',
    'Tỉ lệ truy vấn thất bại hoặc vượt timeout, cùng tỉ lệ phải quét toàn bộ bảng (sequential scan) khi dùng bộ lọc',
    'Số chiều của vector càng lớn thì recall luôn tăng nên nên đặt 4.000 chiều cho chắc'
  ],
  answer: [0, 1, 2],
  explain: '**Tóm tắt:** Chất lượng đo bằng recall@k (hoặc nDCG), chi phí đo bằng p95 độ trễ và tỉ lệ timeout; cả hai phải theo dõi cùng nhau trên một bộ eval cố định.\n\n### Giải thích từng bước\n\n- **Embedding và pgvector là gì?** Embedding là vector số biểu diễn ý nghĩa văn bản; pgvector cho phép lưu cột vector và tìm các vector gần nhau. PostgreSQL có hai chỉ mục chính: {{ivfflat}} (chia vùng, nhanh nhưng recall phụ thuộc số list) và {{hnsw}} (đồ thị phân lớp, thường recall cao hơn, chậm hơn khi xây).\n- **Recall@k:** trong top k kết quả trả về, bao nhiêu phần trăm là kết quả đúng. Bộ eval cố định (ví dụ 200 truy vấn có đáp án đúng đã gán nhãn) giúp so sánh giữa các cấu hình.\n- **Độ trễ p95:** 95% truy vấn nhanh hơn ngưỡng đó. Đo cả khi có bộ lọc (danh mục, giá) vì pgvector có thể phải lọc sau khi tìm → chậm.\n- **Chỉ số phụ:** tỉ lệ timeout, tỉ lệ sequential scan, tỉ lệ cache hit của index.\n\n### Vì sao phương án còn lại sai\n- **Càng nhiều chiều càng tốt:** sai. Chi phí bộ nhớ và thời gian tính khoảng cách tăng, hiệu quả chỉ tăng tới ngưỡng nào đó; 1.536 chiều thường đã đủ cho phần lớn mô hình.\n\n### Ví dụ đời thực\n- Triệu chứng: tìm kiếm theo danh mục "đồ điện" trả kết quả không liên quan.\n- Điều tra: chỉ số {{ivfflat}} có {{lists=100}} quá ít cho 5 triệu vector; phải quét nhiều list.\n- Xử lý: chuyển sang HNSW ({{m=16, ef_construction=64}}), thêm bộ lọc trong truy vấn, đo lại recall và p95.\n- Kết quả: recall@10 tăng từ 0,71 lên 0,93, p95 210 ms.\n\n### Trả lời mẫu khi phỏng vấn\nEm coi vector search là một pipeline có hai chỉ số bắt buộc: recall (chất lượng) và p95 latency (chi phí). Em giữ một bộ eval cố định, thay đổi từng tham số một, và luôn đo cả hai. Nếu recall giảm mà latency không cải thiện bao nhiêu, em rollback cấu hình.\n\n> Senior tip: pgvector rất nhạy với thứ tự: hãy tạo index sau khi import dữ liệu, và dùng {{EXPLAIN (ANALYZE, BUFFERS)}} để biết index có thực sự được dùng không.'
},
{
  id: 'qz-design-040',
  topic: 'design',
  q: 'Trợ lý AI phải trả lời theo tài liệu nội bộ của 5 phòng ban. Mỗi phòng có quyền xem khác nhau: nhân viên chỉ được đọc tài liệu phòng mình, quản lý được đọc tất cả. Bạn kiểm soát quyền truy cập trong pipeline RAG như thế nào? (Chọn 2)',
  multi: true,
  options: [
    'Lọc tài liệu theo quyền của người dùng ngay tại bước retrieval (metadata filter theo department/acl), không đưa tài liệu ngoài quyền vào ngữ cảnh LLM',
    'Nhồi hết tài liệu vào một lần gọi LLM rồi để LLM tự quyết định được phép đọc gì dựa trên câu hỏi',
    'Ghi audit log: ai hỏi câu gì, tài liệu nào được truy xuất, câu trả lời có trích dẫn gì',
    'Cứ đưa mọi tài liệu vào ngữ cảnh nhưng yêu cầu LLM "không được trả lời tài liệu nội bộ khác phòng" trong system prompt'
  ],
  answer: [0, 2],
  explain: '**Tóm tắt:** Phân quyền phải xảy ra trước khi dữ liệu vào ngữ cảnh LLM: lọc ở tầng retrieval theo danh tính người dùng, kèm audit log để truy vết.\n\n### Giải thích từng bước\n\n- **RAG là gì?** Tìm các đoạn tài liệu liên quan (retrieval) rồi đưa vào prompt cho LLM trả lời. Nếu không lọc quyền trước, các đoạn ngoài quyền đã nằm trong ngữ cảnh.\n- **Vì sao không thể dựa vào prompt?** LLM không có cơ chế thực thi quyền. Nó có thể bị prompt injection (chèn chỉ dẫn độc hại) hoặc đơn giản là trả lời theo ngữ cảnh có sẵn. Không có gì ngăn dữ liệu rò rỉ khi đã vào prompt.\n- **Cách làm đúng:** gắn ACL (access control list: danh sách quyền) cho từng tài liệu; khi truy vấn, truyền danh tính người dùng vào bộ lọc metadata của vector store; chỉ top-k kết quả hợp lệ được đưa vào prompt.\n- **Audit:** log user, câu hỏi, các chunk được truy xuất, câu trả lời để điều tra khi có nghi ngờ rò rỉ.\n\n### Vì sao hai phương án còn lại sai\n- **Nhồi tất cả rồi để LLM tự quyết**: vi phạm phân quyền, dữ liệu đã nằm trong ngữ cảnh và có thể bị lộ.\n- **Chỉ dựa vào system prompt**: prompt là gợi ý, không phải hàng rào bảo mật.\n\n### Ví dụ đời thực\n- Triệu chứng: nhân viên phòng A hỏi về lương và nhận được bảng lương phòng B.\n- Điều tra: RAG không lọc theo department; toàn bộ tài liệu nằm trong một collection duy nhất.\n- Xử lý: thêm metadata {{department}} vào từng chunk, lọc trong truy vấn, thêm audit log.\n- Kết quả: không còn rò rỉ; kiểm toán truy vết được từng câu trả lời.\n\n### Trả lời mẫu khi phỏng vấn\nEm đặt kiểm soát quyền ở tầng retrieval, không phải ở prompt: mỗi tài liệu có metadata quyền, truy vấn truyền danh tính người dùng, chỉ chunk hợp lệ mới vào ngữ cảnh. Em ghi audit log và kiểm thử bằng bộ câu hỏi của từng phòng để chắc chắn không lẫn dữ liệu.\n\n> Senior tip: Hãy kiểm thử RAG bằng các câu hỏi "cấm" — nếu một câu hỏi của phòng B nhận được dữ liệu phòng A, pipeline của bạn đã sai.'
},
{
  id: 'qz-design-041',
  topic: 'design',
  q: 'Trợ lý AI trả lời khách hàng cần phản hồi nhanh (người dùng thấy chữ xuất hiện dần). Dịch vụ gọi LLM qua mạng công khai thỉnh thoảng chậm 5-10 giây. Thiết kế nào giúp giữ độ trễ trải nghiệm thấp và tránh đứt kết nối? (Chọn 2)',
  multi: true,
  options: [
    'Dùng streaming (SSE hoặc chunked response) để đẩy từng token về client ngay khi LLM sinh ra; đo TTFT (time to first token) và tổng thời gian hoàn thành',
    'Đặt timeout cứng 60 giây cho mỗi lần gọi rồi mới trả lời, không streaming, để đơn giản',
    'Đặt timeout hợp lý (ví dụ 20 giây), retry có jitter cho lỗi 429/5xx với giới hạn số lần, và fallback sang mô hình/nhà cung cấp dự phòng khi lỗi liên tiếp',
    'Gọi song song 5 lần cùng một prompt rồi lấy câu trả lời nhanh nhất để đảm bảo luôn có kết quả'
  ],
  answer: [0, 2],
  explain: '**Tóm tắt:** Streaming giảm TTFT (thời gian chờ token đầu tiên) nên người dùng thấy phản hồi ngay; kết hợp timeout hợp lý, retry có giới hạn và fallback để sự cố của nhà cung cấp không làm sập tính năng.\n\n### Giải thích từng bước\n\n- **TTFT là gì?** Khoảng thời gian từ lúc gửi yêu cầu đến khi nhận token đầu tiên. Người dùng cảm nhận "nhanh" phụ thuộc TTFT, không phải tổng thời gian sinh hết câu trả lời.\n- **Streaming:** server đẩy từng phần nhỏ về client (Server-Sent Events hoặc chunked transfer). Client hiển thị ngay từ token đầu → cảm giác nhanh hơn nhiều so với chờ 5 giây rồi nhận một cục.\n- **Timeout và retry:** nếu nhà cung cấp chậm, một timeout dài làm request treo. Đặt timeout theo phân vị p99 thực tế; retry chỉ cho lỗi tạm thời (429, 5xx), có jitter để tránh tất cả client retry cùng lúc.\n- **Fallback:** nếu nhà cung cấp chính lỗi liên tiếp, chuyển sang mô hình/nhà cung cấp khác hoặc trả lời mẫu "hệ thống đang bận, bạn thử lại sau" thay vì lỗi 500.\n\n### Vì sao hai phương án còn lại sai\n- **Timeout 60 giây, không streaming**: người dùng chờ lâu, dễ bỏ trang; timeout quá dài không giải quyết gốc rễ.\n- **Gọi song song 5 lần**: tăng chi phí 5 lần, gây thêm tải, và các câu trả lời có thể mâu thuẫn.\n\n### Ví dụ đời thực\n- Triệu chứng: tỉ lệ khách hàng rời trang trả lời AI tăng vào giờ cao điểm.\n- Điều tra: LLM p95 8 giây, không streaming, không timeout hợp lý.\n- Xử lý: bật SSE streaming, timeout 20 giây, retry 2 lần cho 429/5xx, fallback mô hình nhẹ.\n- Kết quả: TTFT giảm xuống 800 ms, tỉ lệ rời trang giảm từ 22% xuống 6%.\n\n### Trả lời mẫu khi phỏng vấn\nEm đo TTFT và tổng thời gian. Với LLM, em bật streaming để người dùng thấy phản hồi ngay, đặt timeout theo p99 và retry có jitter cho lỗi tạm thời, giới hạn số lần retry, và có fallback sang mô hình khác khi lỗi liên tiếp. Em không gọi song song trùng lặp vì tăng chi phí và có thể mâu thuẫn câu trả lời.\n\n> Senior tip: Đừng quên token cuối: một số client chỉ hiển thị khi stream kết thúc. Hãy kiểm tra cả TTFT và tỉ lệ stream bị cắt giữa chừng.'
},
{
  id: 'qz-design-042',
  topic: 'design',
  q: 'API của bạn dùng token bucket (xô token) để giới hạn 1.000 request/phút cho mỗi client. Token bucket hoạt động thế nào và ảnh hưởng gì tới client khi vượt giới hạn?',
  options: [
    'Mỗi client có một xô với dung tích B token, nạp đều R token/giây; mỗi request tiêu 1 token. Khi xô rỗng, request bị từ chối hoặc phải chờ',
    'Mỗi request cộng thêm 1 vào bộ đếm, cứ 1.000 thì khoá client vĩnh viễn',
    'Xô chỉ nạp lại mỗi phút một lần nên client không bao giờ được vượt quá 1.000 request mỗi phút dù có chờ',
    'Token bucket là thuật toán của cơ sở dữ liệu, không liên quan đến rate limit ở tầng API'
  ],
  answer: 0,
  explain: '**Tóm tắt:** Token bucket nạp token đều đặn với tốc độ R và chứa tối đa B token; request tiêu token, hết token thì bị từ chối. Nó cho phép bùng nổ ngắn (burst) tới B request rồi ổn định ở R request/giây.\n\n### Giải thích từng bước\n\n- **Vì sao cần rate limit?** Bảo vệ hệ thống khỏi một client gọi quá nhiều (lỗi hoặc cố ý), tránh quá tải DB và chi phí, đảm bảo công bằng giữa các client.\n- **Token bucket là gì?** Tưởng tượng một xô: mỗi giây có R token được thêm vào (tối đa B token). Mỗi request lấy 1 token. Nếu xô rỗng, request bị từ chối với HTTP 429.\n- **Vì sao có burst?** Vì xô có thể tích trữ B token, client có thể gửi nhanh B request trong một thời điểm rồi phải chờ tốc độ nạp R.\n- **429 và Retry-After:** trả 429 kèm header {{Retry-After}} (số giây nên chờ) để client biết khi nào thử lại.\n\n### Vì sao các phương án khác sai\n- **Đếm đơn giản rồi khoá vĩnh viễn**: quá khắc nghiệt, không có khái niệm burst, và khoá vĩnh viễn gây sự cố kéo dài.\n- **Chỉ nạp mỗi phút**: đó là fixed window, không phải token bucket; nó gây hiện tượng "cạnh cửa sổ" (burst gấp đôi ở ranh giới phút).\n- **Là thuật toán DB**: sai hoàn toàn.\n\n### Ví dụ đời thực\n- Triệu chứng: một client gửi 50.000 request/phút làm API chậm cho mọi người.\n- Điều tra: không có rate limit, chỉ dựa vào WAF.\n- Xử lý: token bucket R=1.000/phút, B=200, lưu ở Redis (dùng Lua script để atomic), trả 429 + Retry-After.\n- Kết quả: client khác không còn bị ảnh hưởng; client vi phạm được thông báo rõ ràng.\n\n### Trả lời mẫu khi phỏng vấn\nEm dùng token bucket ở tầng gateway: dung tích B cho phép burst ngắn, tốc độ nạp R giữ mức ổn định. Khi vượt giới hạn, em trả 429 kèm Retry-After để client tự điều chỉnh. Em lưu trạng thái token ở Redis và dùng Lua script để cập nhật atomic, tránh race condition giữa nhiều instance.\n\n> Senior tip: Token bucket phân phối trên nhiều instance cần một nguồn sự thật chung (Redis). Nếu mỗi instance tự đếm, giới hạn thực tế sẽ gấp N lần.'
},
{
  id: 'qz-design-043',
  topic: 'design',
  q: 'Bạn thiết kế API upload file (tối đa 5 GB, có thể 10 GB) từ ứng dụng di động qua mạng 4G chập chờn. Client thường mất kết nối giữa chừng. Thiết kế nào phù hợp? (Chọn 2)',
  multi: true,
  options: [
    'Upload theo từng phần (multipart/resumable upload): client chia file thành các chunk (ví dụ 8 MB), upload từng chunk kèm checksum, server xác nhận từng phần; mất mạng chỉ phải gửi lại chunk đang dở',
    'Bắt buộc upload toàn bộ file trong một request duy nhất, nếu lỗi thì làm lại từ đầu',
    'Giới hạn kích thước request ở mức vài trăm KB để tránh timeout',
    'Dùng pre-signed URL (link tạm thời có chữ ký) để client upload trực tiếp lên object storage (ví dụ S3), giảm tải cho API server và tận dụng hạ tầng của nhà cung cấp'
  ],
  answer: [0, 3],
  explain: '**Tóm tắt:** Với file lớn trên mạng không ổn định, hãy upload theo phần (resumable) để chỉ gửi lại phần lỗi, và cân nhắc pre-signed URL để client ghi thẳng lên object storage.\n\n### Giải thích từng bước\n\n- **Vì sao không upload một lần?** Một request 5 GB phải giữ kết nối liên tục; mất mạng giữa chừng là mất toàn bộ, client phải gửi lại từ đầu, tốn băng thông và thời gian.\n- **Multipart upload hoạt động thế nào?** Client chia file thành chunk (8-16 MB), upload từng chunk, server lưu tạm và trả về danh sách chunk đã nhận. Khi mất mạng, client hỏi lại chunk nào đã xong rồi gửi tiếp phần còn thiếu.\n- **Pre-signed URL là gì?** Server tạo một URL có chữ ký và thời hạn (ví dụ 15 phút); client dùng URL đó để upload thẳng lên S3. Server không phải chuyển file, chỉ cấp quyền.\n- **Checksum:** mỗi chunk kèm hash (ví dụ SHA-256) để server kiểm tra toàn vẹn trước khi xác nhận.\n\n### Vì sao hai phương án còn lại sai\n- **Một request duy nhất**: không chịu được mất mạng, dễ timeout.\n- **Giới hạn vài trăm KB**: file 5 GB cần hàng nghìn request, không khả thi.\n\n### Ví dụ đời thực\n- Triệu chứng: 30% lượt upload video 2 GB thất bại giữa chừng trên 4G.\n- Điều tra: upload một request, timeout 30 giây, không resume.\n- Xử lý: multipart 8 MB, pre-signed URL cho S3, checksum từng chunk, trạng thái upload lưu ở DB.\n- Kết quả: tỉ lệ thành công tăng từ 70% lên 99%, thời gian upload trung bình giảm 40%.\n\n### Trả lời mẫu khi phỏng vấn\nEm dùng resumable/multipart upload: chunk nhỏ, xác nhận từng phần, lưu trạng thái để tiếp tục sau khi mất mạng. Với object storage, em cấp pre-signed URL để client ghi trực tiếp, giảm tải cho API. Em kiểm tra checksum từng chunk và chỉ hoàn tất khi đủ tất cả phần.\n\n> Senior tip: Đừng quên cleanup các chunk mồ côi (orphan) sau N ngày; nếu không, chi phí lưu trữ tạm sẽ tăng âm thầm.'
},
{
  id: 'qz-design-044',
  topic: 'design',
  q: 'Một hệ thống phân tán cần truyền dữ liệu từ PostgreSQL sang Kafka để các hệ thống khác tiêu thụ. Có hai cách: (a) poll bảng bằng job định kỳ, (b) CDC (Change Data Capture: bắt thay đổi từ transaction log). So sánh nào đúng? (Chọn 2)',
  multi: true,
  options: [
    'Poll định kỳ đơn giản nhưng độ trễ phụ thuộc chu kỳ poll, tốn tài nguyên khi bảng lớn, và khó bắt được xoá (delete) nếu bảng không có cột updated_at',
    'CDC đọc write-ahead log (WAL) của PostgreSQL nên độ trễ rất thấp (thường dưới một giây), không tạo thêm tải truy vấn lên bảng, và bắt được cả INSERT, UPDATE, DELETE',
    'CDC yêu cầu thay đổi schema bảng (thêm cột updated_at) và vẫn không bắt được xoá',
    'Với hệ thống cần đồng bộ gần thời gian thực, CDC thường tốt hơn poll; với hệ thống chấp nhận trễ vài phút và bảng nhỏ, poll đơn giản và dễ vận hành hơn'
  ],
  answer: [0, 3],
  explain: '**Tóm tắt:** Poll đơn giản nhưng trễ và tốn tài nguyên; CDC đọc log giao dịch nên trễ thấp, không tải lên bảng, bắt được mọi thay đổi kể cả xoá, nhưng phức tạp hơn khi vận hành.\n\n### Giải thích từng bước\n\n- **Poll là gì?** Một job chạy mỗi N giây, truy vấn {{SELECT * FROM orders WHERE updated_at > :lastRun}} để lấy bản ghi mới. Đơn giản, không cần hạ tầng đặc biệt.\n- **Nhược điểm của poll:** độ trễ bằng chu kỳ poll; với bảng lớn, điều kiện lọc phải dùng index nếu không sẽ quét toàn bảng; xoá cứng (hard delete) không có dòng nào để thấy nếu không có cột updated_at.\n- **CDC là gì?** Đọc WAL (write-ahead log: nhật ký giao dịch của PostgreSQL) qua logical replication (nhân bản logic). Debezium là công cụ phổ biến, đọc slot nhân bản và chuyển thành event.\n- **Ưu điểm của CDC:** độ trễ dưới một giây, không thêm truy vấn lên bảng, bắt cả INSERT/UPDATE/DELETE.\n- **Nhược điểm:** cần cấu hình {{wal_level = logical}}, quản lý replication slot (nếu slot bị đầy, WAL không được dọn → đĩa phình), cần pipeline riêng.\n\n### Vì sao hai phương án còn lại sai\n- **CDC cần thêm cột updated_at**: sai; CDC đọc WAL, không cần đổi schema.\n- **CDC vẫn không bắt được xoá**: sai; xoá là một event trong WAL.\n\n### Ví dụ đời thực\n- Triệu chứng: hệ thống tìm kiếm trễ 10 phút so với DB.\n- Điều tra: job poll mỗi 10 phút, bảng 500 triệu dòng, không index phù hợp → poll chậm.\n- Xử lý: chuyển sang Debezium CDC, logical replication slot, topic Kafka {{orders.cdc}}.\n- Kết quả: độ trễ giảm xuống dưới 1 giây, tải DB giảm.\n\n### Trả lời mẫu khi phỏng vấn\nPoll phù hợp khi bảng nhỏ, trễ vài phút chấp nhận được, muốn đơn giản. CDC phù hợp khi cần trễ thấp và bắt mọi thay đổi; đọc WAL nên không tải lên bảng. Em luôn cân nhắc chi phí vận hành replication slot và pipeline riêng trước khi chọn CDC.\n\n> Senior tip: Replication slot đầy là một trong những sự cố phổ biến nhất của CDC trên PostgreSQL: WAL không được dọn sẽ làm đầy đĩa. Hãy đặt cảnh báo kích thước WAL và giám sát slot.'
},
{
  id: 'qz-design-045',
  topic: 'design',
  q: 'Hệ thống chat 1-1 cần đảm bảo hai người dùng có thể nhắn tin cho nhau kể cả khi một người offline, tin nhắn không được mất, và thứ tự trong một cuộc trò chuyện phải đúng. Thiết kế nào phù hợp? (Chọn 2)',
  multi: true,
  options: [
    'Lưu tin nhắn vào database bền vững trước khi báo đã nhận cho người gửi; khi người nhận offline, tin nhắn được giữ ở server và đẩy khi họ kết nối lại',
    'Gửi tin nhắn trực tiếp từ client người gửi tới client người nhận, không qua server, để giảm độ trễ',
    'Mỗi cuộc trò chuyện có một chuỗi (sequence number) tăng dần; client dùng nó để sắp xếp lại và phát hiện tin nhắn bị thiếu',
    'Chỉ cần WebSocket, không cần lưu trữ gì vì tin nhắn sẽ được đẩy ngay lập tức'
  ],
  answer: [0, 2],
  explain: '**Tóm tắt:** Tin nhắn phải được lưu bền vững trước khi ack; khi người nhận offline thì giữ ở server; dùng sequence number theo cuộc trò chuyện để sắp xếp đúng thứ tự và phát hiện thiếu.\n\n### Giải thích từng bước\n\n- **Vì sao cần lưu trước khi ack?** Nếu server nhận tin, báo "đã gửi" cho người gửi, rồi server chết trước khi ghi đĩa, tin nhắn mất mà người gửi tưởng đã gửi thành công.\n- **Offline thì sao?** Server giữ tin nhắn (ví dụ trong bảng hoặc queue theo user), khi người nhận kết nối lại sẽ kéo các tin chưa đọc.\n- **Thứ tự:** trong một cuộc trò chuyện, mỗi tin nhắn có sequence number tăng dần (do server cấp). Client sắp xếp theo số này; nếu thiếu số, biết ngay có tin chưa nhận.\n- **WebSocket chỉ là kênh vận chuyển:** nó không đảm bảo lưu trữ, không đảm bảo tin nhắn không mất khi offline.\n\n### Vì sao hai phương án còn lại sai\n- **Gửi trực tiếp client-to-client**: cả hai phải online cùng lúc, không có lưu trữ, mất tin khi offline, khó đồng bộ nhiều thiết bị.\n- **Chỉ WebSocket không lưu**: server restart là mất tin.\n\n### Ví dụ đời thực\n- Triệu chứng: tin nhắn gửi lúc người nhận offline biến mất khi họ online lại.\n- Điều tra: server chỉ đẩy qua WebSocket, không lưu khi người nhận offline.\n- Xử lý: lưu vào DB trước khi ack, hàng đợi tin chưa đọc theo user, sequence number mỗi hội thoại.\n- Kết quả: không mất tin, thứ tự đúng, đồng bộ được nhiều thiết bị.\n\n### Trả lời mẫu khi phỏng vấn\nEm tách kênh vận chuyển khỏi lưu trữ: WebSocket đẩy tin theo thời gian thực, nhưng tin phải được ghi DB trước khi ack. Khi người nhận offline, server giữ tin và đẩy khi họ kết nối. Em dùng sequence number theo hội thoại để đảm bảo thứ tự và phát hiện thiếu tin.\n\n> Senior tip: Đừng quên idempotency khi client gửi lại tin sau mất kết nối: dùng client-generated message id để loại trùng.'
},
{
  id: 'qz-design-046',
  topic: 'design',
  q: 'Bạn thiết kế hệ thống thông báo (notification) gửi email, push notification và SMS. Mỗi thông báo có thể được yêu cầu gửi lại. Hệ thống cần đảm bảo không gửi trùng, có thể theo dõi trạng thái, và chịu được nhà cung cấp bên ngoài lỗi. Thiết kế nào phù hợp? (Chọn 2)',
  multi: true,
  options: [
    'Một hàng đợi (queue) tách riêng việc gửi thông báo; mỗi thông báo có id duy nhất và trạng thái (PENDING, SENT, FAILED); worker đọc từ queue và gọi nhà cung cấp, ghi kết quả lại DB',
    'Gửi trực tiếp trong request của user (đồng bộ), nếu nhà cung cấp lỗi thì trả lỗi cho user',
    'Dùng idempotency key (khoá chống trùng) khi gọi API nhà cung cấp để tránh gửi trùng khi retry',
    'Retry vô hạn ngay lập tức khi nhà cung cấp lỗi, không cần delay'
  ],
  answer: [0, 2],
  explain: '**Tóm tắt:** Tách việc gửi thông báo thành hàng đợi + worker + trạng thái để không chặn request của user, theo dõi được, và retry có kiểm soát; dùng idempotency key để retry không gửi trùng.\n\n### Giải thích từng bước\n\n- **Vì sao tách hàng đợi?** Gửi email/SMS chậm và dễ lỗi; nếu gọi trực tiếp trong request, user phải chờ và API dễ timeout.\n- **Trạng thái:** PENDING → SENDING → SENT/FAILED. Có trạng thái thì theo dõi và gửi lại được, biết thông báo nào đang kẹt.\n- **Idempotency key:** khi gọi nhà cung cấp, kèm một khoá duy nhất cho mỗi thông báo; nếu retry, nhà cung cấp nhận ra khoá đã xử lý và không gửi lần hai.\n- **Retry có kiểm soát:** exponential backoff (tăng dần thời gian chờ) + giới hạn số lần; sau nhiều lần lỗi, chuyển sang hàng đợi lỗi (dead letter queue) để xử lý thủ công.\n\n### Vì sao hai phương án còn lại sai\n- **Gửi đồng bộ trong request**: user chờ nhà cung cấp, API dễ timeout, lỗi nhà cung cấp làm request thất bại dù thông báo không quan trọng.\n- **Retry vô hạn ngay lập tức**: dồn dập, làm nhà cung cấp quá tải, không có thời gian phục hồi.\n\n### Ví dụ đời thực\n- Triệu chứng: giờ cao điểm, API đặt hàng chậm vì gửi email trong request.\n- Điều tra: gọi SMTP đồng bộ, timeout 30 giây.\n- Xử lý: đẩy thông báo vào queue, worker gửi sau, trạng thái lưu DB, retry exponential backoff, DLQ.\n- Kết quả: p99 API giảm từ 3 giây xuống 200 ms, tỉ lệ gửi thành công tăng.\n\n### Trả lời mẫu khi phỏng vấn\nEm tách thông báo thành pipeline riêng: queue + worker + trạng thái. Worker gọi nhà cung cấp với idempotency key, retry exponential backoff có giới hạn, lỗi thì vào DLQ. Nhờ vậy request của user không bị chặn, theo dõi được, và không gửi trùng.\n\n> Senior tip: Đừng quên giám sát DLQ: nếu không ai xử lý, thông báo quan trọng sẽ kẹt âm thầm.'
},
{
  id: 'qz-design-047',
  topic: 'design',
  q: 'API của bạn trả về thông tin sản phẩm, có cả giá và tồn kho. Giá thay đổi vài lần mỗi ngày, tồn kho thay đổi liên tục. Bạn cache cả hai trong Redis với TTL 5 phút. Vấn đề gì xảy ra và cách xử lý?',
  options: [
    'Tồn kho cũ 5 phút có thể gây oversell (bán quá tồn); cần cache TTL ngắn hơn cho tồn kho (ví dụ 5-10 giây) hoặc không cache tồn kho mà đọc từ DB có kiểm soát, đồng thời làm rõ với nghiệp vụ mức chấp nhận',
    'TTL 5 phút cho mọi thứ là hợp lý vì cache luôn đúng trong TTL',
    'Nên cache cả giá và tồn kho vĩnh viễn, chỉ xoá khi có admin cập nhật thủ công',
    'Cache chỉ gây hại, không nên dùng trong thương mại điện tử'
  ],
  answer: 0,
  explain: '**Tóm tắt:** Cache TTL dài cho dữ liệu biến động nhanh (tồn kho) gây bán quá tồn; cần TTL ngắn hơn hoặc đọc trực tiếp từ DB, và thống nhất với nghiệp vụ về mức chấp nhận cũ.\n\n### Giải thích từng bước\n\n- **Cache là gì?** Lưu bản sao dữ liệu ở nơi gần (Redis) để đọc nhanh hơn. Đánh đổi: có thể cũ so với nguồn gốc (DB).\n- **Vì sao tồn kho cũ 5 phút nguy hiểm?** Hai người cùng mua sản phẩm cuối cùng; cả hai đều thấy "còn 1" từ cache, cùng đặt hàng → oversell.\n- **Cách xử lý:** tồn kho nên có TTL rất ngắn (5-10 giây) hoặc không cache, đọc từ DB khi cần quyết định đặt hàng; giá có thể cache lâu hơn vì sai vài phút ít rủi ro hơn.\n- **Thống nhất nghiệp vụ:** không có "đúng tuyệt đối" trong mọi hệ thống; phải biết nghiệp vụ chấp nhận mức trễ nào.\n\n### Vì sao ba phương án còn lại sai\n- **TTL 5 phút luôn đúng**: sai; TTL chỉ là thời gian cache tự hết hạn, không đảm bảo khớp DB.\n- **Cache vĩnh viễn, xoá thủ công**: tồn kho sẽ cũ đến khi admin nhớ xoá.\n- **Không dùng cache**: mất lợi ích hiệu năng; có thể cache những phần ổn định.\n\n### Ví dụ đời thực\n- Triệu chứng: 20 đơn oversell mỗi ngày cho sản phẩm giới hạn.\n- Điều tra: tồn kho cache 5 phút.\n- Xử lý: TTL tồn kho 5 giây, kiểm tra lại DB ở bước đặt hàng, dùng hàng đợi để tuần tự hoá các đơn cùng sản phẩm.\n- Kết quả: oversell gần như bằng 0, độ trễ đặt hàng tăng không đáng kể.\n\n### Trả lời mẫu khi phỏng vấn\nEm phân loại dữ liệu theo tốc độ thay đổi: dữ liệu ổn định cache lâu, dữ liệu biến động nhanh cache ngắn hoặc không cache. Với tồn kho, em không tin cache tuyệt đối mà kiểm tra lại ở bước quyết định, và thống nhất với nghiệp vụ mức chấp nhận cũ.\n\n> Senior tip: Cache không phải công tắc đúng/sai; nó là bài toán đánh đổi. Hãy ghi rõ trong tài liệu thiết kế: dữ liệu nào được phép cũ bao lâu, và hệ thống xử lý thế nào khi cache lệch.'
},
{
id: 'qz-design-048',
  topic: 'design',
  q: 'Bạn thiết kế API public có hàng nghìn client. Client hay gọi sai: gửi sai kiểu dữ liệu, thiếu trường bắt buộc, gửi field không hợp lệ. Bạn muốn trả lỗi rõ ràng, dễ sửa, và không làm lộ chi tiết nội bộ. Thiết kế response lỗi nào phù hợp?',
  options: [
    'Trả HTTP status phù hợp (400 cho sai cú pháp/schema, 422 cho đúng cú pháp nhưng sai nghiệp vụ, 401/403 cho xác thực/phân quyền) kèm body lỗi có mã lỗi ổn định (ví dụ {{code: "VALIDATION_ERROR"}}), thông điệp cho người đọc, và danh sách chi tiết lỗi theo từng field',
    'Mọi lỗi đều trả 500 kèm stack trace đầy đủ để client dễ debug',
    'Trả 200 với body {{success: false}} cho mọi lỗi để client dễ xử lý',
    'Không cần mã lỗi riêng, chỉ cần thông điệp tiếng Việt là đủ'
  ],
  answer: 0,
  explain: '**Tóm tắt:** Dùng HTTP status đúng ngữ nghĩa, body lỗi có mã ổn định để client lập trình theo, thông điệp dễ hiểu, và chi tiết theo từng field; không bao giờ trả stack trace.\n\n### Giải thích từng bước\n\n- **HTTP status nói gì?** 400 sai cú pháp hoặc schema, 401 chưa đăng nhập, 403 không đủ quyền, 404 không tìm thấy, 409 xung đột, 422 đúng cú pháp nhưng sai nghiệp vụ, 429 quá nhiều request, 5xx lỗi server.\n- **Mã lỗi ổn định:** client code theo mã ({{code}}), không theo thông điệp (thông điệp có thể thay đổi theo ngôn ngữ/phiên bản).\n- **Chi tiết theo field:** giúp client chỉ đúng chỗ cần sửa, thay vì "dữ liệu không hợp lệ".\n- **Không lộ nội bộ:** stack trace, đường dẫn file, phiên bản thư viện là thông tin nhạy cảm cho kẻ tấn công.\n\n### Vì sao ba phương án còn lại sai\n- **500 + stack trace**: lộ thông tin, client không phân biệt được lỗi do mình hay do server.\n- **200 cho mọi lỗi**: client không biết thất bại, monitoring không đếm được tỉ lệ lỗi.\n- **Chỉ thông điệp tiếng Việt**: client không lập trình theo được; thông điệp thay đổi là vỡ client.\n\n### Ví dụ đời thực\n- Triệu chứng: app mobile không hiển thị đúng lỗi khi server từ chối đơn hàng.\n- Điều tra: server trả 200 kèm body lỗi.\n- Xử lý: trả 400/422 đúng, body {{code, message, details}}, tài liệu hoá.\n- Kết quả: client hiển thị lỗi chính xác, giảm ticket hỗ trợ.\n\n### Trả lời mẫu khi phỏng vấn\nEm thiết kế lỗi như một hợp đồng: HTTP status đúng, mã lỗi ổn định, thông điệp cho người đọc, chi tiết theo field. Client code theo mã, không theo thông điệp. Em không trả stack trace và không trả 200 cho lỗi để monitoring đo được.\n\n> Senior tip: Hãy viết một trang "API error codes" và giữ nó ổn định như hợp đồng. Đổi mã lỗi là breaking change.'
},
{
  id: 'qz-design-049',
  topic: 'design',
  q: 'Bạn thiết kế hệ thống tìm kiếm sản phẩm dùng Elasticsearch/OpenSearch (công cụ tìm kiếm phân tán, chỉ mục đảo ngược để tìm từ khóa nhanh). Dữ liệu nằm ở PostgreSQL. Bạn đồng bộ dữ liệu như thế nào để kết quả tìm kiếm luôn cập nhật? (Chọn 2)',
  multi: true,
  options: [
    'Đồng bộ hai chiều: ghi vào PostgreSQL trước (nguồn sự thật), sau đó đẩy thay đổi sang search index qua CDC hoặc outbox pattern (bảng outbox cùng transaction, một worker đọc và đẩy đi)',
    'Ghi trực tiếp vào Elasticsearch trước, rồi ghi vào PostgreSQL sau để tìm kiếm nhanh hơn',
    'Đồng bộ bằng job đêm: xoá toàn bộ index và import lại từ PostgreSQL mỗi 24 giờ',
    'Nếu search index lệch, cần job đối chiếu (reconciliation: so sánh và sửa dữ liệu lệch) định kỳ để phát hiện và bù lại, thay vì mặc kệ'
  ],
  answer: [0, 3],
  explain: '**Tóm tắt:** PostgreSQL là nguồn sự thật; ghi vào DB trước, rồi đồng bộ sang search index qua CDC hoặc outbox; có job đối định kỳ để sửa lệch.\n\n### Giải thích từng bước\n\n- **Vì sao DB là nguồn sự thật?** Tìm kiếm chỉ là một cách nhìn khác của cùng dữ liệu; nếu DB ghi được mà search không có, dữ liệu vẫn còn. Ngược lại thì mất.\n- **Outbox pattern là gì?** Trong cùng transaction ghi dữ liệu, ghi thêm một bản ghi vào bảng {{outbox}}. Một worker đọc bảng outbox và đẩy sang Elasticsearch. Nhờ cùng transaction, không có trạng thái "DB đã ghi nhưng quên đẩy".\n- **CDC:** đọc WAL của PostgreSQL để đẩy thay đổi sang search index; trễ thấp, không cần bảng outbox.\n- **Đối (reconciliation):** job định kỳ so sánh DB với search index, phát hiện và sửa tài liệu lệch/thiếu.\n- **Reindex toàn bộ:** cần khi schema index thay đổi hoặc nghi ngờ lệch nhiều; nên chạy nền, không xoá index cũ ngay (dùng alias).\n\n### Vì sao ba phương án còn lại sai\n- **Ghi ES trước rồi DB sau**: nếu DB ghi thất bại, search có dữ liệu ma, user đặt hàng không được.\n- **Job đêm xoá và import lại**: 24 giờ dữ liệu cũ, và import toàn bộ tốn tài nguyên; không phù hợp dữ liệu biến động.\n- **Không đối**: lệch tích tụ, user không tìm thấy sản phẩm vừa tạo.\n\n### Ví dụ đời thực\n- Triệu chứng: sản phẩm mới tạo không xuất hiện khi tìm kiếm trong 30 phút.\n- Điều tra: đồng bộ bằng cron 30 phút.\n- Xử lý: outbox + worker đẩy real-time, job đối mỗi giờ, reindex qua alias khi cần.\n- Kết quả: độ trễ đồng bộ xuống dưới 5 giây.\n\n### Trả lời mẫu khi phỏng vấn\nEm giữ PostgreSQL là nguồn sự thật, đồng bộ sang search index qua outbox hoặc CDC trong cùng transaction. Em có job đối định kỳ để sửa lệch, và reindex qua alias khi thay đổi schema. Em không bao giờ ghi search trước rồi mới ghi DB.\n\n> Senior tip: Alias cho phép reindex không downtime: tạo index mới, import, trỏ alias sang index mới, xoá index cũ.'
},
{
  id: 'qz-design-050',
  topic: 'design',
  q: 'Bạn thiết kế hệ thống phân tán dùng Saga (chuỗi giao dịch cục bộ, mỗi bước có bù trừ) để đặt hàng: giữ tồn kho, trừ tiền, tạo đơn giao hàng. Bước "giữ tồn kho" đã thành công, bước "trừ tiền" thất bại. Bạn cần bù trừ (rollback) như thế nào cho đúng? (Chọn 2)',
  multi: true,
  options: [
    'Gọi bù trừ tương ứng của bước đã thành công: "nhả tồn kho đã giữ"; bù trừ phải idempotent (gọi lại nhiều lần vẫn an toàn)',
    'Bỏ qua bước giữ tồn kho vì nó không quan trọng',
    'Ghi log bù trừ thất bại vào DLQ (dead letter queue: hàng đợi lỗi) và có cơ chế thử lại hoặc can thiệp thủ công',
    'Dùng một transaction phân tán (2PC) để rollback tất cả cùng lúc'
  ],
  answer: [0, 2],
  explain: '**Tóm tắt:** Saga bù trừ theo thứ tự ngược: bước đã thành công phải được bù trừ; bù trừ idempotent và có DLQ khi thất bại; 2PC thường không phù hợp vì khóa tài nguyên lâu.\n\n### Giải thích từng bước\n\n- **Saga là gì?** Mỗi bước là một transaction cục bộ; nếu bước sau thất bại, các bước trước được bù trừ (compensation) để đưa hệ thống về trạng thái nhất quán.\n- **Thứ tự bù trừ:** ngược với thứ tự thực hiện. Giữ tồn kho → trừ tiền → tạo đơn; nếu trừ tiền lỗi, bù trừ giữ tồn kho (nhả hàng đã giữ).\n- **Idempotent:** bù trừ có thể được gọi lại (do retry hoặc lỗi mạng); gọi hai lần "nhả tồn kho" không được làm sai.\n- **DLQ:** nếu bù trừ thất bại (ví dụ dịch vụ tồn kho cũng lỗi), ghi vào DLQ để thử lại hoặc con người xử lý; không im lặng bỏ qua.\n- **2PC (two-phase commit):** đảm bảo tất cả cùng commit hoặc cùng rollback, nhưng khóa tài nguyên lâu, dễ nghẽn, không phù hợp hệ thống lớn.\n\n### Vì sao ba phương án còn lại sai\n- **Bỏ qua giữ tồn kho**: tồn kho bị giữ mãi, hàng không bán được.\n- **Bỏ qua thất bại bù trừ**: hệ thống lệch trạng thái âm thầm.\n- **2PC**: với nhiều service qua mạng, 2PC làm nghẽn và dễ dead-lock; Saga là lựa chọn thực tế hơn.\n\n### Ví dụ đời thực\n- Triệu chứng: sau sự cố, nhiều đơn "treo" với tồn kho bị giữ mà không có đơn.\n- Điều tra: bước trừ tiền thất bại nhưng không bù trừ giữ tồn kho.\n- Xử lý: thêm compensation cho mỗi bước, idempotent, DLQ, job đối định kỳ.\n- Kết quả: tồn kho được nhả tự động, không còn đơn treo.\n\n### Trả lời mẫu khi phỏng vấn\nEm thiết kế Saga với compensation cho từng bước, bù trừ theo thứ tự ngược, idempotent, và DLQ khi bù trừ thất bại. Em không dùng 2PC cho hệ thống nhiều service vì khóa tài nguyên lâu. Em có job đối để phát hiện trạng thái lệch.\n\n> Senior tip: Compensation phải là hành động nghiệp vụ thật, không phải rollback kỹ thuật. "Nhả tồn kho đã giữ" là một API riêng, không phải hoàn tác database.'
},
{
  id: 'qz-architecture-021',
  topic: 'architecture',
  q: `Đoạn code Java sau vi phạm nguyên tắc thiết kế nào và cách sửa?
~~~java
class Invoice {
    void print() { ... }
    void saveToDb() { ... }
    void sendEmail() { ... }
}
~~~`,
  options: [
    'Vi phạm SRP: một class làm ba việc khác nhau (biểu diễn, lưu trữ, thông báo). Tách thành Invoice (domain), InvoiceRepository, InvoiceNotifier',
    'Vi phạm OCP: nên dùng interface InvoicePrinter',
    'Vi phạm LSP: subclass không thay thế được Invoice',
    'Không vi phạm gì, nên giữ nguyên để đơn giản'
  ],
  answer: 0,
  explain: `**Đáp án đúng: vi phạm SRP.**

### Vì sao đúng
- SRP (Single Responsibility Principle): một class nên có một lý do để thay đổi. Ở đây có ba lý do: thay đổi format in, thay đổi schema DB, thay đổi email template.
- Tách trách nhiệm: Invoice chỉ giữ dữ liệu và quy tắc nghiệp vụ; InvoiceRepository lo lưu; InvoiceNotifier lo gửi. Mỗi phần thay đổi độc lập, test dễ hơn.

### Vì sao các phương án khác sai
- **OCP**: không phải vấn đề chính; chưa có chỗ cần mở rộng bằng kế thừa/interface.
- **LSP**: không có kế thừa nào.
- **Không vi phạm**: gộp nhiều trách nhiệm làm class phình to và khó test.

> Senior tip: SRP không có nghĩa "một method". Một class có thể có nhiều method nhưng cùng phục vụ một mục đích.`
},
{
  id: 'qz-architecture-022',
  topic: 'architecture',
  multi: true,
  q: 'Code smell nào thường đi kèm với shotgun surgery? (Chọn 2)',
  options: [
    'Duplicated code',
    'Feature envy',
    'Dead code',
    'Long parameter list'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: duplicated code và feature envy.**

### Vì sao đúng
- Shotgun surgery: một thay đổi nhỏ phải sửa nhiều class. Thường xuất hiện khi logic bị rải rác (duplicated) hoặc method dùng dữ liệu của class khác nhiều (feature envy).
- Refactor: move method, extract class, consolidating duplicate code.

### Vì sao các phương án khác sai
- Dead code: không liên quan trực tiếp.
- Long parameter list: smell riêng, thường do thiếu object.

> Senior tip: Khi sửa một bug phải touch > 3 file, đó là tín hiệu shotgun surgery.`
},
{
  id: 'qz-architecture-023',
  topic: 'architecture',
  q: 'Strategy vs State: điểm khác biệt chính là gì?',
  options: [
    'Strategy thay đổi hành vi tại runtime do client chọn; State thay đổi hành vi theo trạng thái nội tại của object',
    'Strategy dùng inheritance, State dùng composition',
    'State không thể có nhiều implementation',
    'Strategy chỉ dùng cho sorting'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Strategy do client chọn; State theo trạng thái nội tại.**

### Vì sao đúng
- Strategy: client inject thuật toán (ví dụ payment method). Object không tự đổi strategy trừ khi client đổi.
- State: object tự chuyển state (ví dụ Order từ NEW sang PAID) và hành vi thay đổi theo.

### Vì sao các phương án khác sai
- Cả hai đều dùng composition.
- State có thể nhiều implementation.
- Strategy không chỉ sorting.

> Senior tip: Nếu state transitions phức tạp, cân nhắc state machine (Spring State Machine).`
},
{
  id: 'qz-architecture-024',
  topic: 'architecture',
  q: 'Spring @Transactional proxy: method private có @Transactional có hoạt động không?',
  options: [
    'Có, CGLIB proxy override private method',
    'Không, proxy không intercept private method',
    'Chỉ khi dùng AspectJ weaving',
    'Chỉ với JTA'
  ],
  answer: 1,
  explain: `**Đáp án đúng: không, proxy không intercept private method.**

### Vì sao đúng
- Spring proxy (JDK/CGLIB) chỉ intercept được method public, không final và được gọi qua proxy (không phải self-invocation). Method private không thể override (và caller trong cùng class gọi trực tiếp, không qua proxy) nên annotation bị bỏ qua.

### Vì sao các phương án khác sai
- CGLIB không override được private (và cả final).
- AspectJ weaving có thể nhưng không mặc định.
- JTA không liên quan.

> Senior tip: Đặt @Transactional trên public method, không final, và gọi qua bean inject. Lỗi "annotation không chạy" thường do private/final hoặc self-invocation.`
},
{
  id: 'qz-architecture-025',
  topic: 'architecture',
  q: 'Builder pattern khi nào dùng thay vì constructor nhiều tham số?',
  options: [
    'Khi object có nhiều optional field và cần readable',
    'Khi object immutable bắt buộc',
    'Khi cần singleton',
    'Khi cần lazy init'
  ],
  answer: 0,
  explain: `**Đáp án đúng: nhiều optional field, cần readable.**

### Vì sao đúng
- Telescoping constructor khó đọc và dễ nhầm thứ tự. Builder cho phép đặt tên từng field.

### Vì sao các phương án khác sai
- Immutable có thể dùng record/constructor.
- Singleton không liên quan.
- Lazy init không liên quan.

> Senior tip: Java record + compact constructor cho value object đơn giản; Builder cho object phức tạp.`
},
{
  id: 'qz-architecture-026',
  topic: 'architecture',
  q: 'Hexagonal architecture: port và adapter là gì?',
  options: [
    'Port là interface do domain định nghĩa; adapter là implementation kết nối với infra (DB, HTTP, Kafka)',
    'Port là controller; adapter là service',
    'Port là DB table; adapter là repository',
    'Port là DTO; adapter là mapper'
  ],
  answer: 0,
  explain: `**Đáp án đúng: port interface domain; adapter implementation infra.**

### Vì sao đúng
- Domain định nghĩa port (interface). Adapter implement port để nối với công nghệ cụ thể. Domain không phụ thuộc infra.

### Vì sao các phương án khác sai
- Controller/service là delivery layer, không phải port.
- DB table/repository là persistence adapter.
- DTO/mapper là translation.

> Senior tip: Test domain bằng in-memory adapter, không cần DB.`
},
{
  id: 'qz-architecture-027',
  topic: 'architecture',
  q: 'DDD aggregate boundary: điều gì phải đúng trong một transaction?',
  options: [
    'Chỉ một aggregate root được sửa trong một transaction; liên aggregate dùng domain event',
    'Nhiều aggregate có thể sửa cùng transaction nếu cùng DB',
    'Aggregate chỉ là entity collection',
    'Boundary do DB transaction quyết định'
  ],
  answer: 0,
  explain: `**Đáp án đúng: một aggregate root mỗi transaction.**

### Vì sao đúng
- Aggregate là ranh giới nhất quán. Sửa nhiều aggregate trong cùng transaction tạo coupling và tranh chấp.

### Vì sao các phương án khác sai
- Cùng DB không giải quyết coupling.
- Aggregate không chỉ collection.
- DB transaction không định nghĩa boundary nghiệp vụ.

> Senior tip: Hỏi interviewer "invariant nào phải đúng ngay lập tức?" để xác định boundary.`
},
{
  id: 'qz-architecture-028',
  topic: 'architecture',
  q: 'Code smell "feature envy": method dùng dữ liệu của class khác nhiều hơn class của chính nó. Refactor nào phù hợp?',
  options: [
    'Move method sang class chứa dữ liệu',
    'Extract interface',
    'Introduce parameter object',
    'Replace conditional with polymorphism'
  ],
  answer: 0,
  explain: `**Đáp án đúng: move method.**

### Vì sao đúng
- Method nên ở gần dữ liệu nó dùng. Move method giảm coupling và tăng cohesion.

### Vì sao các phương án khác sai
- Extract interface không giải quyết envy.
- Parameter object giảm params nhưng không move logic.
- Polymorphism cho conditional, không cho envy.

> Senior tip: Feature envy thường xuất hiện khi domain logic bị đặt sai chỗ (anemic domain).`
},
{
  id: 'qz-architecture-029',
  topic: 'architecture',
  q: 'Refactor an toàn có test: bước đầu tiên nên làm gì?',
  options: [
    'Viết characterization tests (golden tests) bao phủ hành vi hiện tại',
    'Rewrite toàn bộ module',
    'Đổi tên class trước',
    'Tối ưu performance'
  ],
  answer: 0,
  explain: `**Đáp án đúng: characterization tests.**

### Vì sao đúng
- Cần biết hành vi hiện tại trước khi refactor. Characterization tests ghi lại output thực tế làm safety net.

### Vì sao các phương án khác sai
- Rewrite rủi ro cao.
- Đổi tên trước không có tests.
- Tối ưu không phải refactor.

> Senior tip: Refactor = thay đổi cấu trúc không thay đổi hành vi; tests chứng minh.`
},
{
  id: 'qz-architecture-030',
  topic: 'architecture',
  q: 'Decorator trong Spring: {{@Transactional}} trên method service là ví dụ của pattern nào?',
  options: [
    'Decorator/Proxy: proxy bọc bean và thêm transaction behavior',
    'Adapter',
    'Facade',
    'Factory'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Decorator/Proxy.**

### Vì sao đúng
- Spring tạo proxy bọc bean gốc, thêm cross-cutting concern (transaction, security) mà không sửa code nghiệp vụ bên trong.

### Vì sao các phương án khác sai
- Adapter chuyển interface.
- Facade gom API.
- Factory tạo object.

> Senior tip: Gọi method {{@Transactional}} nội bộ cùng class sẽ bypass proxy.`
},
{
  id: 'qz-architecture-031',
  topic: 'architecture',
  q: 'SOLID OCP: thêm payment method mới mà không sửa code cũ, dùng gì?',
  options: [
    'Interface {{PaymentProcessor}} + implementation mới inject vào',
    'if-else theo type',
    'switch statement',
    'Reflection'
  ],
  answer: 0,
  explain: `**Đáp án đúng: interface + implementation.**

### Vì sao đúng
- OCP: mở rộng bằng thêm class, không sửa class cũ. DI inject implementation phù hợp.

### Vì sao các phương án khác sai
- if-else/switch phải sửa khi thêm type.
- Reflection phức tạp, mất type safety.

> Senior tip: Kết hợp với Strategy pattern.`
},
{
  id: 'qz-architecture-032',
  topic: 'architecture',
  q: 'LSP: subclass phải làm gì?',
  options: [
    'Có thể thay thế superclass mà không làm vỡ chương trình',
    'Override mọi method',
    'Cùng package với superclass',
    'Implement interface riêng'
  ],
  answer: 0,
  explain: `**Đáp án đúng: substitutability.**

### Vì sao đúng
- LSP: object của subclass có thể dùng ở mọi nơi expecting superclass.

### Vì sao các phương án khác sai
- Override mọi method không đủ.
- Package/interface không liên quan.

> Senior tip: Vi phạm LSP thường do override làm thay đổi contract (throw exception mới).`
},
{
  id: 'qz-architecture-033',
  topic: 'architecture',
  q: 'ISP: interface quá lớn làm gì?',
  options: [
    'Client implement method không dùng → tách interface nhỏ',
    'Tăng performance',
    'Giảm memory',
    'Không ảnh hưởng'
  ],
  answer: 0,
  explain: `**Đáp án đúng: tách interface nhỏ.**

### Vì sao đúng
- ISP: client không nên phụ thuộc method không dùng. Tách interface theo client.

### Vì sao các phương án khác sai
- Performance/memory không phải vấn đề chính.

> Senior tip: Interface theo role (Readable, Writable) thay vì Fat interface.`
},
{
  id: 'qz-architecture-034',
  topic: 'architecture',
  q: 'DIP: high-level module nên phụ thuộc vào?',
  options: [
    'Abstraction (interface), không phụ thuộc low-level concrete',
    'Concrete implementation',
    'Database',
    'Framework'
  ],
  answer: 0,
  explain: `**Đáp án đúng: abstraction.**

### Vì sao đúng
- DIP: cả high-level và low-level phụ thuộc vào abstraction. Giúp test và thay thế infra.

### Vì sao các phương án khác sai
- Concrete/DB/framework tạo coupling.

> Senior tip: Spring DI là hiện thực DIP.`
},
{
  id: 'qz-architecture-035',
  topic: 'architecture',
  q: 'Record trong Java 16+ phù hợp nhất cho?',
  options: [
    'Value object/DTO bất biến',
    'Entity có lifecycle',
    'Service có state',
    'Controller'
  ],
  answer: 0,
  explain: `**Đáp án đúng: value object/DTO.**

### Vì sao đúng
- Record tự sinh constructor, equals, hashCode, toString, immutable.

### Vì sao các phương án khác sai
- Entity cần mutability/identity.
- Service/controller không phải data carrier.

> Senior tip: Record không thể extend class khác.`
},
{
  id: 'qz-architecture-036',
  topic: 'architecture',
  q: 'Shotgun surgery: một thay đổi nhỏ phải sửa nhiều class. Nguyên nhân thường là?',
  options: [
    'Logic rải rác, thiếu encapsulation',
    'Class quá lớn',
    'Quá nhiều interface',
    'Dùng quá nhiều design pattern'
  ],
  answer: 0,
  explain: `**Đáp án đúng: logic rải rác.**

### Vì sao đúng
- Khi responsibility phân tán, thay đổi lan rộng. Refactor: consolidate.

### Vì sao các phương án khác sai
- Class quá lớn là God class (khác).
- Interface/pattern không phải nguyên nhân.

> Senior tip: Theo dõi số file touched per PR.`
},
{
  id: 'qz-architecture-037',
  topic: 'architecture',
  q: 'Feature envy: method dùng dữ liệu của class khác. Cách phát hiện?',
  options: [
    'Method gọi getter của class khác nhiều hơn field của chính nó',
    'Method quá dài',
    'Method có nhiều parameter',
    'Method throw exception'
  ],
  answer: 0,
  explain: `**Đáp án đúng: gọi getter khác nhiều.**

### Vì sao đúng
- Feature envy = method thuộc về class A nhưng dùng data của class B. Move method.

### Vì sao các phương án khác sai
- Dài/params/exception là smell khác.

> Senior tip: IDE có inspection "feature envy".`
},
{
  id: 'qz-architecture-038',
  topic: 'architecture',
  q: 'Safe refactor: sau khi refactor, làm gì để đảm bảo behavior?',
  options: [
    'Chạy toàn bộ test suite + characterization tests',
    'Manual test một case',
    'Code review',
    'Format code'
  ],
  answer: 0,
  explain: `**Đáp án đúng: chạy tests.**

### Vì sao đúng
- Tests chứng minh behavior không đổi. Characterization tests bao phủ legacy.

### Vì sao các phương án khác sai
- Manual test không đủ.
- Review/format không verify behavior.

> Senior tip: Refactor từng bước nhỏ, commit thường xuyên.`
},
{
  id: 'qz-architecture-039',
  topic: 'architecture',
  multi: true,
  q: 'Hexagonal architecture lợi ích? (Chọn 2)',
  options: [
    'Domain độc lập với infra, dễ test',
    'Cho phép thay DB/framework mà không đổi domain',
    'Tăng performance',
    'Giảm số class'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: độc lập domain và thay infra.**

### Vì sao đúng
- Port/adapter cô lập domain. Test bằng fake adapter. Thay DB chỉ đổi adapter.

### Vì sao các phương án khác sai
- Performance/class count không phải lợi ích.

> Senior tip: Hexagonal phù hợp domain phức tạp.`
},
{
  id: 'qz-architecture-040',
  topic: 'architecture',
  q: 'DDD: aggregate root chịu trách nhiệm gì?',
  options: [
    'Bảo vệ invariant và là entry point cho mọi thay đổi bên trong aggregate',
    'Lưu dữ liệu',
    'Gửi event',
    'Render UI'
  ],
  answer: 0,
  explain: `**Đáp án đúng: bảo vệ invariant.**

### Vì sao đúng
- Aggregate root kiểm soát mọi thay đổi, đảm bảo invariant nội bộ. Bên ngoài chỉ tham chiếu root.

### Vì sao các phương án khác sai
- Lưu/gửi/render là infra/UI.

> Senior tip: Không cho phép sửa entity con trực tiếp từ ngoài.`
},
{
  id: 'qz-architecture-041',
  topic: 'architecture',
  q: 'Hệ thống đặt vé sự kiện áp dụng CQRS: command ghi (giữ chỗ, thanh toán) và query đọc (xem sơ đồ ghế, lịch sử vé). Khi nào CQRS xứng đáng và trade-off là gì?',
  options: [
    'Luôn dùng CQRS vì tách đọc/ghi là best practice',
    'Chỉ khi domain phức tạp, tải đọc/ghi khác biệt lớn (ví dụ đọc nhiều gấp 100 lần ghi) và chấp nhận eventual consistency giữa command và query; không nên dùng cho CRUD đơn giản',
    'Chỉ dùng CQRS khi cần event sourcing',
    'CQRS bắt buộc dùng hai database riêng biệt'
  ],
  answer: 1,
  explain: `**Đáp án đúng: CQRS xứng đáng khi domain phức tạp và tải đọc/ghi lệch nhiều, chấp nhận eventual consistency.**
 
### Vì sao đúng
- **CQRS** (Command Query Responsibility Segregation) tách model ghi (command) và model đọc (query). Model ghi tập trung validation, business rule, invariant; model đọc tối ưu cho hiển thị (denormalized, pre-computed).
- **Khi xứng đáng**: domain phong phú (nhiều invariant, business logic), tỷ lệ read/write rất cao (100:1 trở lên), team đủ lớn để bảo trì hai model, chấp nhận dữ liệu đọc chậm vài giây so với ghi (eventual consistency).
- **Trade-off**: code gấp đôi (hai model, hai repository, sync mechanism), độ phức tạp vận hành tăng (projection lag, schema migration phức tạp), eventual consistency gây bất ngờ cho user (vừa đặt xong mà chưa thấy trong lịch sử).
- **KHÔNG nên dùng**: CRUD đơn giản, admin panel, domain anémic, team nhỏ, yêu cầu strong consistency giữa đọc và ghi.

### Vì sao các phương án khác sai
- **Luôn dùng**: over-engineering cho hệ thống đơn giản.
- **Bắt buộc event sourcing**: CQRS và event sourcing độc lập; có thể CQRS mà không event sourcing (sync projection bằng CDC hoặc dual-write có bù trừ).
- **Bắt buộc hai DB**: có thể dùng cùng DB, khác schema hoặc khác table; tách DB chỉ cần khi scale độc lập.

> Senior tip: đừng bắt đầu bằng CQRS. Bắt đầu modular monolith, tách read model khi đo được read amplification và pain point thực tế.`
},
{
  id: 'qz-architecture-042',
  topic: 'architecture',
  q: 'Team đang cân nhắc Event Sourcing cho service "Kho hàng": lưu mọi thay đổi tồn kho dưới dạng event (StockReceived, StockReserved, StockReleased, StockAdjusted) thay vì chỉ lưu current state. Trade-off chính nào team phải cân nhắc?',
  options: [
    'Event Sourcing miễn phí: lưu event thay vì state, query nhanh hơn, không cần migration schema',
    'Lợi: audit trail hoàn hảo, time-travel debug, rebuild read model bất kỳ lúc nào. Hại: event schema migration phức tạp (upcaster), projection lag, query ad-hoc khó, replay toàn bộ event tốn thời gian khi dữ liệu lớn, team phải học tư duy mới',
    'Chỉ phù hợp cho hệ thống tài chính, không dùng cho kho hàng',
    'Event Sourcing tự động giải quyết mọi vấn đề consistency'
  ],
  answer: 1,
  explain: `**Đáp án đúng: lợi audit/time-travel/rebuild; hại schema migration, projection lag, query ad-hoc khó, replay chậm, learning curve.**
 
### Vì sao đúng
- **Event Sourcing**: lưu chuỗi event thay vì state hiện tại. State = fold(events).
- **Lợi ích**:
  - Audit trail: mọi thay đổi có timestamp, actor, lý do (event payload).
  - Time-travel: xem state tại bất kỳ thời điểm nào (replay tới offset).
  - Rebuild read model: thêm projection mới (ví dụ báo cáo mới) bằng cách replay từ đầu.
  - Tách command/query tự nhiên: command append event, query đọc projection.
- **Chi phí/Trade-off**:
  - **Event schema evolution**: thêm/xoá field, đổi type cần upcaster (đọc event cũ, phát event mới) — phức tạp và dễ sai.
  - **Projection lag**: read model cập nhật async, user có thể thấy dữ liệu cũ vài giây.
  - **Query ad-hoc khó**: không thể {{SELECT * FROM stock WHERE qty > 100}} trực tiếp; phải dùng projection hoặc snapshot.
  - **Replay time**: 10 triệu event có thể mất giờ để rebuild; cần snapshot định kỳ.
  - **Learning curve**: team phải tư duy event-first, xử lý idempotency, ordering, compensation.

### Vì sao các phương án khác sai
- **Miễn phí/query nhanh**: ngược lại, query phức tạp hơn, cần projection.
- **Chỉ tài chính**: bất kỳ domain nào cần audit trail, temporal query đều hưởng lợi.
- **Tự động giải quyết consistency**: ES không giải quyết consistency; projection lag tạo eventual consistency.

> Senior tip: bắt đầu bằng "event store" đơn giản (bảng append-only trong PostgreSQL) + CDC để sync projection. Chỉ dùng framework ES (EventStoreDB, Axon) khi đã hiểu rõ pain point. Luôn có snapshot strategy (mỗi 1000 event hoặc mỗi ngày).`
},
{
  id: 'qz-architecture-043',
  topic: 'architecture',
  q: 'Saga đặt hàng: bước 1 giữ kho, bước 2 trừ tiền, bước 3 tạo đơn, bước 4 gửi email. Orchestration vs Choreography: chọn cách nào và tại sao?',
  options: [
    'Luôn chọn Orchestration vì dễ debug',
    'Luôn chọn Choreography vì loose coupling',
    'Orchestration khi quy trình phức tạp, có nhiều điều kiện phân nhánh, cần kiểm soát tập trung, dễ hiểu luồng và bù trừ (compensating transaction); Choreography khi các bước đơn giản, ít phụ thuộc, team tự chủ từng service',
    'Choreography dùng event, Orchestration dùng REST đồng bộ'
  ],
  answer: 2,
  explain: `**Đáp án đúng: Orchestration cho quy trình phức tạp/cần kiểm soát; Choreography cho quy trình đơn giản/ít phụ thuộc.**
 
### Vì sao đúng
- **Orchestration**: một orchestrator (state machine) điều phối thứ tự bước, gọi service, xử lý lỗi, chạy compensating transaction.
  - Ưu: luồng nghiệp vụ tập trung một chỗ, dễ hiểu, dễ debug, dễ thay đổi thứ tự/bước, xử lý timeout/retry tập trung, compensating transaction rõ ràng.
  - Nhược: orchestrator trở thành "smart pipe", coupling logic điều phối, single point of failure (cần HA).
  - Phù hợp: quy trình nhiều bước, nhiều điều kiện (if-else), rollback phức tạp, cần audit trail luồng.
- **Choreography**: các service phát event, service khác nghe và phản ứng. Không có central coordinator.
  - Ưu: loose coupling, service tự chủ, scale team tốt.
  - Nhược: luồng nghiệp vụ rải rác (distributed logic), khó debug (phải trace event chain), circular dependency risk, bù trừ transaction khó phối hợp (phải phát event bù).
  - Phù hợp: quy trình tuyến tính, ít bước, ít điều kiện, team nhiều và muốn tự chủ.

### Vì sao các phương án khác sai
- **Luôn Orchestration**: tạo bottleneck coupling khi quy trình đơn giản.
- **Luôn Choreography**: rối khi logic phức tạp, khó bù trừ.
- **Choreography = event, Orchestration = REST**: sai, Orchestration cũng có thể dùng event (orchestrator phát command event, service reply result event).

> Senior tip: thực tế nhiều hệ thống hybrid: Orchestration ở mức cao (quản lý state machine đơn hàng), Choreography ở mức chi tiết (inventory, payment tự phát event nội bộ). Luôn thiết kế compensating transaction trước khi viết code.`
},
{
  id: 'qz-architecture-044',
  topic: 'architecture',
  q: 'Clean Architecture: dependency rule cốt lõi là gì và vi phạm phổ biến nào làm vỡ ranh giới?',
  options: [
    'Inner layer không được biết outer layer; vi phạm phổ biến: domain import framework (JPA, Spring) hoặc outer layer quyết định business rule',
    'Outer layer không được biết inner layer; vi phạm: controller gọi repository',
    'Tất cả layer đều có thể biết nhau miễn là dùng interface',
    'Dependency rule chỉ áp dụng cho database'
  ],
  answer: 0,
  explain: `**Đáp án đúng: inner layer không biết outer layer; vi phạm: domain import framework hoặc business rule rò rỉ ra ngoài.**
 
### Vì sao đúng
- **Dependency Rule** (Robert Martin): source code dependency chỉ được trỏ **về phía trong**. Domain (Entities, Use Cases) không được phụ thuộc vào Framework (Spring, JPA, Kafka), UI, Database. Framework phụ thuộc vào Domain (implement interface do Domain định nghĩa).
- **Vi phạm phổ biến**:
  1. Entity có {{@Entity}}, {{@Table}}, {{@Column}} (JPA annotation) → domain phụ thuộc JPA.
  2. Use Case inject {{JpaRepository}} thay vì interface {{Repository}} do domain định nghĩa.
  3. Business rule rò rỉ ra Controller/Service (ví dụ validation, tính giá trong controller).
  4. DTO của framework (Spring {{Page}}, {{Pageable}}) lọt vào Use Case.
- **Cách giữ ranh giới**: dùng port/adapter pattern, ArchUnit test, code review.

### Vì sao các phương án khác sai
- **Outer không biết inner**: ngược lại, outer phải biết inner (implement port).
- **Tất cả biết nhau**: phá vỡ nguyên tắc cốt lõi.
- **Chỉ áp dụng DB**: áp dụng cho mọi outer layer (UI, framework, external service).

> Senior tip: trong Spring, dùng {{@Repository}} interface ở domain package, implement ở adapter package. Use Case inject interface. Chạy ArchUnit trong CI: {{noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAnyPackage("org.springframework..", "jakarta.persistence..")}}.`
},
{
  id: 'qz-architecture-045',
  topic: 'architecture',
  q: 'Modular monolith: team chia module theo bounded context. Làm sao để module A dùng service của module B mà không phá vỡ encapsulation?',
  options: [
    'Module A inject bean public của module B trực tiếp',
    'Module A gọi REST API của module B qua HTTP nội bộ',
    'Module A phụ thuộc vào interface (port) do module B định nghĩa ở package API; Spring wiring inject implementation của B vào A; module B chỉ expose type ở package gốc, internal package bị hidden',
    'Gộp hai module thành một'
  ],
  answer: 2,
  explain: `**Đáp án đúng: phụ thuộc vào interface (port) ở package API của module B, Spring inject implementation.**
 
### Vì sao đúng
- **Modular monolith** (Spring Modulith): mỗi module là một package con trực tiếp của root package. Package gốc của module = **public API** (interface, DTO, event). Các package con bên trong = **internal** (implementation, entity, config).
- Module A muốn dùng B: A thêm dependency compile-time vào B, nhưng **chỉ dùng type ở package gốc của B** (interface {{PaymentService}}, DTO {{PaymentRequest}}). Spring inject implementation {{PaymentServiceImpl}} (nằm trong internal package của B) vào A.
- **Encapsulation**: ArchUnit/Spring Modulith {{verify()}} chặn A truy cập internal package của B. B đổi internal thoải mái không lo A bị vỡ.
- **Giao tiếp**: đồng bộ (gọi method interface) hoặc bất đồng bộ (phát event {{@ApplicationModuleListener}}).

### Vì sao các phương án khác sai
- **Inject bean public trực tiếp**: nếu bean là implementation class (không phải interface), A phụ thuộc concrete class của B → vỡ encapsulation.
- **Gọi REST nội bộ**: thêm latency, serialization, error handling, deployment coupling; modular monolith sinh ra để tránh chi phí này.
- **Gộp module**: mất ranh giới bounded context.

> Senior tip: Spring Modulith quy ước: module = package con cấp 1. Type ở package gốc = API. Test: {{ApplicationModules.of(App.class).verify()}}. Tài liệu module tự sinh: {{ApplicationModules.of(App.class).forEach(m -> m.writeDocumentation(...))}}.`
},
{
  id: 'qz-architecture-046',
  topic: 'architecture',
  multi: true,
  q: 'CQRS: projection (read model) cập nhật như thế nào? Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Dual-write: command handler vừa ghi event/command DB, vừa update read model trong cùng transaction',
    'CDC (Change Data Capture): Debezium đọc WAL/binlog, phát event, projection consumer cập nhật read model',
    'Event-driven: command phát domain event, projection listener (transactional hoặc async) cập nhật read model',
    'Polling: projection định kỳ {{SELECT * FROM write_table WHERE updated_at > last_sync}}',
    'Read model luôn strong consistency với write model'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: CDC (Debezium) và event-driven projection listener.**
 
### Vì sao đúng
- **CDC (Debezium)**: đọc thay đổi từ transaction log của DB (WAL/binlog), phát event tới Kafka. Projection consumer đọc event và cập nhật read model. Ưu: không xâm nhập code command, đảm bảo mọi thay đổi đều bị bắt (kể cả SQL trực tiếp). Nhược: phụ thuộc schema DB, cần quản lý connector.
- **Event-driven projection**: command handler phát domain event (Spring {{ApplicationEventPublisher}}, Kafka, outbox table). Projection listener (có thể {{@TransactionalEventListener}} phase {{AFTER_COMMIT}} hoặc Kafka consumer) cập nhật read model. Ưu: event là ngôn ngữ domain, dễ hiểu, kiểm soát được payload. Nhược: cần discipline để luôn phát event, có thể mất event nếu không dùng outbox.

### Vì sao các phương án khác sai
- **Dual-write trong cùng transaction**: vi phạm single responsibility của command handler, coupling write/read model, nếu read model fail thì command rollback (không mong muốn). Dual-write thường dẫn đến inconsistency khi một phía thành công một phía fail.
- **Polling**: độ trễ lớn, tốn resource, dễ bỏ sót khi updated_at không cập nhật (bulk update, trigger).
- **Luôn strong consistency**: CQRS bản chất là eventual consistency giữa command và query. Strong consistency chỉ có khi projection cập nhật đồng bộ trong cùng transaction (rất hiếm, phá vỡ lý do tách CQRS).

> Senior tip: kết hợp outbox pattern (ghi event vào bảng outbox trong cùng transaction command) + CDC hoặc relay phát event ra Kafka → projection consumer idempotent cập nhật read model. Đặt metric projection lag (giây) và alert khi vượt ngưỡng.`
},
{
  id: 'qz-architecture-047',
  topic: 'architecture',
  q: 'Team dùng Event Sourcing. Khi replay 5 triệu event để rebuild projection mới, mất 45 phút. Cách giảm thời gian rebuild?',
  options: [
    'Chỉ replay event của 30 ngày gần nhất',
    'Snapshot: định kỳ lưu state của aggregate (mỗi N event hoặc theo thời gian); rebuild load snapshot gần nhất rồi replay phần còn lại',
    'Chạy replay song song trên nhiều thread không quan tâm thứ tự',
    'Tăng heap size JVM là đủ'
  ],
  answer: 1,
  explain: `**Đáp án đúng: snapshot state định kỳ, rebuild từ snapshot gần nhất + replay phần còn lại.**
 
### Vì sao đúng
- **Snapshot** (memento): lưu state của aggregate/event stream tại một offset (ví dụ mỗi 1000 event, hoặc mỗi ngày, hoặc khi aggregate đạt kích thước nhất định).
- **Rebuild với snapshot**:
  1. Tìm snapshot mới nhất trước offset cần rebuild.
  2. Load snapshot vào projection (hoặc aggregate).
  3. Replay event từ offset snapshot tới cuối.
- **Ví dụ**: 5 triệu event, snapshot mỗi 100k event → 50 snapshot. Rebuild load snapshot #49 (offset 4.9M) + replay 100k event → từ 45 phút giảm xuống vài giây.
- **Lưu ý**: snapshot phải versioned (khi event schema đổi, snapshot cũ có thể không load được → cần upcaster cho snapshot hoặc rebuild full).

### Vì sao các phương án khác sai
- **Chỉ replay 30 ngày**: mất lịch sử, projection sai cho dữ liệu cũ.
- **Song song không quan tâm thứ tự**: Event Sourcing yêu cầu thứ tự tuyệt đối trong một stream (partition key = aggregate id). Song song chỉ được khi chia theo partition key (mỗi aggregate độc lập).
- **Tăng heap**: không giải quyết bản chất O(N) replay time.

> Senior tip: dùng snapshotting library (EventStoreDB, Axon) hoặc tự implement: bảng {{snapshot(aggregate_id, offset, state_json, created_at)}}. Xoá snapshot cũ sau khi tạo mới để tiết kiệm dung lượng.`
},
{
  id: 'qz-architecture-048',
  topic: 'architecture',
  q: 'Anti-corruption layer (ACL) trong DDD dùng khi nào và làm gì?',
  options: [
    'Dùng để validate input từ client trước khi vào domain',
    'Dùng khi tích hợp với hệ thống ngoài (legacy, third-party) mà model của nó khác model domain của bạn: ACL dịch model ngoài sang model domain, che giấu sự thay đổi của bên ngoài',
    'Là một design pattern cho caching',
    'Dùng để mã hoá dữ liệu nhạy cảm'
  ],
  answer: 1,
  explain: `**Đáp án đúng: ACL dịch model hệ thống ngoài sang model domain, che giấu sự thay đổi của bên ngoài.**
 
### Vì sao đúng
- **Anti-corruption Layer** (Eric Evans): lớp cách ly giữa bounded context của bạn và context bên ngoài (legacy system, third-party API, external service). Bên ngoài có model, thuật ngữ, quy tắc khác; ACL ngăn không cho "corrupt" domain model của bạn.
- **ACL làm gì**:
  - Dịch external DTO → internal Value Object/Entity.
  - Map external error code → domain exception.
  - Che giấu thay đổi API bên ngoài: bên ngoài đổi field, ACL cập nhật mapping, domain không đổi.
  - Thường implement bằng Facade/Adapter pattern.
- **Khi dùng**: tích hợp legacy (không thể sửa), third-party API (không kiểm soát), microservice khác thuộc team khác (bounded context khác).

### Vì sao các phương án khác sai
- **Validate input client**: đó là validation layer / input sanitization, không phải ACL.
- **Caching pattern**: ACL không phải caching.
- **Mã hoá**: đó là encryption/security layer.

> Senior tip: ACL thường là một package/service nhỏ, test kỹ mapping. Không lạm dụng: nếu bạn kiểm soát được cả hai bên, hãy đồng bộ model thay vì thêm ACL.`
},
{
  id: 'qz-architecture-049',
  topic: 'architecture',
  multi: true,
  q: 'Architecture Decision Record (ADR) nên ghi gì và quy trình ra sao? (Chọn 2)',
  options: [
    'Chỉ ghi quyết định cuối cùng, không cần ghi phương án bị loại',
    'Ghi: Title, Status, Context, Decision, Consequences (cả mặt tốt và xấu), Options considered; ADR không sửa, muốn đổi thì viết ADR mới đánh dấu superseded',
    'ADR lưu trên Confluence/wiki để mọi người dễ sửa',
    'ADR lưu trong repo (docs/adr/), review qua PR như code',
    'Mỗi class có một ADR riêng'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: ghi đầy đủ Context/Decision/Consequences/Options; ADR bất biến, lưu trong repo, review qua PR.**
 
### Vì sao đúng
- **Cấu trúc ADR** (Michael Nygard):
  - **Title**: quyết định gì (ví dụ "Use Kafka for async messaging").
  - **Status**: Proposed / Accepted / Superseded / Deprecated.
  - **Context**: bối cảnh, ràng buộc, yêu cầu tại thời điểm quyết định.
  - **Decision**: quyết định đã chọn.
  - **Consequences**: hệ quả (cả tích cực và tiêu cực, ví dụ "Kafka không có delay queue, phải tự implement retry").
  - **Options considered**: các phương án khác đã đánh giá và lý do loại (giúp team sau không phải tái điều tra).
- **Quy trình**:
  1. Viết ADR draft, mở PR.
  2. Team review, thảo luận, chỉnh sửa.
  3. Merge → ADR accepted, không bao giờ sửa nội dung.
  4. Muốn đổi quyết định: viết ADR mới, status cũ = Superseded, link tới ADR mới.
- **Lưu trong repo**: versioned cùng code, review qua PR, không bị mất khi wiki migrage.

### Vì sao các phương án khác sai
- **Chỉ ghi quyết định**: mất context, team sau không hiểu tại sao chọn cái đó, dễ lặp lại sai lầm.
- **Lưu wiki ai cũng sửa**: nội dung bị ghi đè, mất lịch sử, lệch với code.
- **Mỗi class một ADR**: quá lẻ, ADR dành cho quyết định kiến trúc lớn (chọn DB, broker, chia service, pattern), không phải chi tiết implement.

> Senior tip: ADR ngắn (đọc < 5 phút). Chỉ viết cho quyết định "đắt" khi đảo ngược (kiến trúc, công nghệ cốt lõi). Tool: {{adr-tools}}, {{adr-log}}.`
},
{
  id: 'qz-architecture-050',
  topic: 'architecture',
  q: 'Architecture Fitness Function: khái niệm này là gì và ví dụ cụ thể?',
  options: [
    'Đo performance của hệ thống',
    'Test tự động kiểm tra đặc tính kiến trúc (dependency rule, coupling, cyclic dependency, naming convention) chạy trong CI; ví dụ: ArchUnit test `noClasses().that().resideInAPackage("..domain..").should().dependOnClassesThat().resideInAnyPackage("..adapter..")`',
    'Metric business (revenue, conversion)',
    'Code coverage threshold'
  ],
  answer: 1,
  explain: `**Đáp án đúng: test tự động kiểm tra đặc tính kiến trúc chạy trong CI (ví dụ ArchUnit test dependency rule).**
 
### Vì sao đúng
- **Architecture Fitness Function** (Neal Ford, Rebecca Parsons, Patrick Kua): bất kỳ cơ chế tự động nào cung cấp feedback khách quan về đặc tính kiến trúc của hệ thống. Chuyển "quy tắc kiến trúc" từ tài liệu thành **test executable**.
- **Phân loại**:
  - **Atomic**: một test đơn lẻ (ví dụ: không có cyclic dependency, domain không import Spring).
  - **Holistic**: bộ test đánh giá toàn hệ (ví dụ: coupling giữa module, technical debt index).
  - **Temporal**: chạy theo lịch (nightly) hoặc triggered (PR).
  - **Continual**: chạy trong CI pipeline mọi commit.
- **Ví dụ thực tế**:
  - ArchUnit: {{classes().that().resideInAPackage("..domain..").should().onlyDependOnClassesThat().resideInAnyPackage("..domain..", "java..")}}.
  - Spring Modulith: {{ApplicationModules.of(App.class).verify()}}.
  - Dependency check: {{dependencyCheck}} plugin chặn thư viện có CVE.
  - Naming convention: test {{@Service}} không được đặt tên {{*Impl}}, {{@Entity}} không được có {{set*}} public.
- **Lợi ích**: kiến trúc không "mốc" theo thời gian; vi phạm bị phát hiện sớm tại PR; onboarding dev mới đọc test hiểu quy tắc.

### Vì sao các phương án khác sai
- **Performance metric**: đó là performance testing, không phải architecture fitness function (dù có thể kết hợp).
- **Business metric**: đo lường business outcome.
- **Code coverage**: đo test coverage, không phải architecture.

> Senior tip: bắt đầu bằng 3-5 fitness function quan trọng nhất (dependency rule, cyclic dep, no-logic-in-controller). Chạy trong CI, fail build khi vi phạm. Dùng {{FreezingArchRule}} khi áp lên codebase cũ: ghi nhận vi phạm hiện tại, chỉ chặn vi phạm mới.`
},
{
  id: 'qz-design-051',
  topic: 'design',
  q: `Đoạn code sau vi phạm Single Responsibility Principle (SRP - mỗi class chỉ nên có một lý do để thay đổi)?
~~~java
class ReportService {
    String buildCsv() { ... }
    void sendEmail() { ... }
    void saveDb() { ... }
}
~~~`,
  options: [
    '{{ReportService}} vừa tạo dữ liệu, vừa gửi email, vừa lưu DB nên có nhiều lý do thay đổi',
    'Không vi phạm vì tất cả đều liên quan report',
    'Chỉ vi phạm nếu class quá dài',
    'Vi phạm OCP nhưng không vi phạm SRP'
  ],
  answer: 0,
  explain: `**Đáp án đúng: class có nhiều trách nhiệm (tạo, gửi, lưu).**

**Tóm tắt:** SRP (Single Responsibility Principle - nguyên tắc trách nhiệm đơn lẻ) nói rằng một class nên chỉ có một lý do để thay đổi. Class làm 3 việc (build CSV, gửi email, lưu DB) sẽ đổi khi format đổi, khi SMTP đổi, hoặc khi schema DB đổi.

### Vì sao đúng
- "Một lý do để thay đổi" nghĩa là một nhóm thay đổi nghiệp vụ/kỹ thuật. Ở đây: thay đổi cách format báo cáo, thay đổi provider email, thay đổi cách lưu trữ đều buộc sửa cùng class.
- Tách thành {{ReportFormatter}}, {{ReportMailer}}, {{ReportRepository}} giúp mỗi class ổn định hơn và dễ test (mock từng phần).

### Vì sao các phương án khác sai
- "Liên quan report" không đồng nghĩa một trách nhiệm; SRP xét lý do thay đổi, không xét tên miền mơ hồ.
- Độ dài không phải tiêu chí SRP; class ngắn vẫn có thể vi phạm.
- Đây là vi phạm SRP rõ ràng, không phải OCP.

> Senior tip: Khi review, đếm "actor" khiến class đổi (business, infra, ops) — nhiều actor thường là smell SRP.`
},
{
  id: 'qz-design-052',
  topic: 'design',
  multi: true,
  q: 'Đoạn code nào tuân thủ Open/Closed Principle (OCP - mở rộng được nhưng không phải sửa code cũ) khi thêm phương thức thanh toán mới? (Chọn 2)',
  options: [
    'Định nghĩa {{interface PaymentProcessor { void pay(Money m); } }} và thêm class mới {{MomoProcessor}} implement interface',
    'Inject {{Map<String, PaymentProcessor>}} hoặc chọn bean theo key để dùng implementation mới',
    'Thêm nhánh {{if (type.equals("MOMO")) ... else if ...}} vào class thanh toán hiện có mỗi khi có loại mới',
    'Dùng {{switch(type)}} trong controller để gọi hàm tĩnh tương ứng'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: dùng interface/abstraction và inject implementation mới.**

**Tóm tắt:** OCP (Open/Closed - mở để mở rộng, đóng để sửa đổi) khuyến khích thêm hành vi bằng class mới thay vì sửa chuỗi if/switch cũ.

### Vì sao đúng
- Interface + implementation mới: code cũ không đổi, chỉ thêm class và cấu hình/đăng ký bean.
- Chọn processor qua Map/DI cho phép mở rộng runtime mà không chạm logic lõi.

### Vì sao các phương án khác sai
- if-else/switch phải sửa mỗi lần thêm loại thanh toán → vi phạm OCP, dễ quên nhánh và khó test.
- Gọi hàm tĩnh trong controller trộn điều phối với nghiệp vụ và vẫn phải sửa khi thêm loại.

> Senior tip: OCP không có nghĩa "không bao giờ sửa code", mà là thiết kế điểm mở rộng ở nơi biến động.`
},
{
  id: 'qz-design-053',
  topic: 'design',
  q: `Đoạn code sau vi phạm Liskov Substitution Principle (LSP - class con phải thay thế được class cha) thế nào?
~~~java
class Bird { void fly() { } }
class Penguin extends Bird {
    void fly() { throw new UnsupportedOperationException(); }
}
~~~`,
  options: [
    'Chỗ gọi {{Bird.fly()}} kỳ vọng bay được nhưng {{Penguin}} ném exception nên thay thế không an toàn',
    'Không vi phạm vì chim cánh cụt về mặt sinh học là chim',
    'Vi phạm DIP vì dùng extends',
    'Chỉ cần đổi tên method là hết vi phạm'
  ],
  answer: 0,
  explain: `**Đáp án đúng: subclass phá vỡ "hợp đồng" (contract - cam kết hành vi) của superclass.**

**Tóm tắt:** LSP (Liskov Substitution Principle) yêu cầu object của lớp con dùng được ở nơi mong đợi lớp cha mà không gây lỗi bất ngờ.

### Vì sao đúng
- Client nhận {{Bird}} và gọi {{fly()}} hợp lệ theo contract; {{Penguin}} ném exception làm client crash hoặc phải if-instanceof.
- Thiết kế đúng hơn: tách {{Flyable}} hoặc phân cấp {{FlyingBird}}/{{Bird}} theo khả năng thực tế.

### Vì sao các phương án khác sai
- Phân loại sinh học không đảm bảo contract lập trình.
- DIP (Dependency Inversion) nói về phụ thuộc abstraction, không phải lỗi này.
- Đổi tên không sửa hành vi vi phạm.

> Senior tip: Dấu hiệu LSP smell: subclass override để throw, trả null bất thường, hoặc no-op làm sai kỳ vọng caller.`
},
{
  id: 'qz-design-054',
  topic: 'design',
  q: `Interface Segregation Principle (ISP - tách interface lớn thành interface nhỏ theo nhu cầu client): đoạn nào tốt hơn?
~~~java
interface Worker { void code(); void test(); void deploy(); }
~~~
với dev chỉ code/test.`,
  options: [
    'Tách thành {{Coder}}, {{Tester}}, {{Deployer}} để class chỉ implement method nó thực sự cần',
    'Giữ một interface lớn cho tiện tìm',
    'Cho method thừa ném {{UnsupportedOperationException}}',
    'Dùng abstract class thay interface là đủ'
  ],
  answer: 0,
  explain: `**Đáp án đúng: tách interface theo vai trò.**

**Tóm tắt:** ISP (Interface Segregation Principle) nói client không nên bị ép phụ thuộc vào method nó không dùng.

### Vì sao đúng
- Interface "béo" (fat interface) buộc implement method vô nghĩa, gây coupling và dễ vỡ khi interface đổi.
- Interface nhỏ theo role giúp mock/test dễ và tuân thủ SRP ở mức hợp đồng.

### Vì sao các phương án khác sai
- Interface lớn "tiện tìm" nhưng gây gánh nặng implement và thay đổi dây chuyền.
- Ném exception là workaround, vẫn vi phạm contract.
- Abstract class không tự giải quyết việc gộp quá nhiều trách nhiệm.

> Senior tip: Nếu bạn thấy {{default}} method rỗng hoặc throw khắp nơi, hãy nghi ngờ ISP.`
},
{
  id: 'qz-design-055',
  topic: 'design',
  multi: true,
  q: 'Dependency Inversion Principle (DIP - module cấp cao phụ thuộc abstraction, không phụ thuộc chi tiết): đoạn code nào áp dụng đúng? (Chọn 2)',
  options: [
    '{{class OrderService { private final OrderRepository repo; OrderService(OrderRepository repo){this.repo=repo;} } }} với {{OrderRepository}} là interface',
    'Cấu hình Spring inject {{JpaOrderRepository}} implement {{OrderRepository}} vào service',
    '{{class OrderService { private final JpaOrderRepository repo = new JpaOrderRepository(); } }} khởi tạo trực tiếp',
    'Service gọi thẳng {{EntityManager}} và SQL string trong method nghiệp vụ'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: phụ thuộc interface và để DI container cung cấp implementation.**

**Tóm tắt:** DIP (Dependency Inversion Principle) đảo chiều phụ thuộc: business logic (cấp cao) nói chuyện với abstraction; chi tiết hạ tầng (DB, HTTP) implement abstraction đó.

### Vì sao đúng
- Constructor nhận interface giúp thay DB/mock khi test mà không sửa service.
- Spring DI (Dependency Injection - tiêm phụ thuộc) là cơ chế lắp ghép implementation ở runtime.

### Vì sao các phương án khác sai
- {{new}} trực tiếp concrete class gắn cứng hạ tầng vào nghiệp vụ, khó test.
- Gọi thẳng EntityManager/SQL trong service trộn persistence vào business và vi phạm DIP/SRP.

> Senior tip: DIP không bắt buộc dùng framework; quan trọng là hướng phụ thuộc và điểm tiêm (constructor).`
},
{
  id: 'qz-design-056',
  topic: 'design',
  q: 'Phân biệt Strategy và State pattern: tình huống nào nên dùng Strategy?',
  options: [
    'Chọn thuật toán tính phí ship (nhanh/thường/tiết kiệm) do client/cấu hình quyết định và có thể thay tại runtime',
    'Đối tượng tự chuyển trạng thái đơn hàng (CREATED→PAID→SHIPPED) và hành vi đổi theo trạng thái nội bộ',
    'Tạo object phức tạp từng bước',
    'Thêm hành vi logging cho object có sẵn'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Strategy cho việc chọn thuật toán hoán đổi được.**

**Tóm tắt:** Strategy pattern (mẫu chiến lược) đóng gói các thuật toán thay thế nhau sau một interface; State pattern (mẫu trạng thái) cho phép object thay đổi hành vi khi trạng thái nội bộ thay đổi.

### Vì sao đúng
- Tính phí ship: cùng mục tiêu, khác cách tính; caller hoặc context chọn strategy phù hợp.
- Mỗi strategy độc lập, dễ test và thêm mới (kết hợp OCP).

### Vì sao các phương án khác sai
- Chuyển trạng thái đơn hàng với luật chuyển tiếp là bài toán State (hoặc state machine).
- Tạo từng bước là Builder; bọc thêm hành vi là Decorator.

> Senior tip: Hỏi "ai quyết định đổi?" — bên ngoài chọn thuật toán → Strategy; bản thân object đổi theo lifecycle → State.`
},
{
  id: 'qz-design-057',
  topic: 'design',
  q: 'State pattern: điều gì mô tả đúng nhất hành vi của nó?',
  options: [
    'Object ủy thác hành vi cho object trạng thái hiện tại và việc chuyển trạng thái được kiểm soát theo ngữ cảnh/trạng thái',
    'Client luôn truyền strategy mới cho mỗi lần gọi',
    'Chỉ dùng enum và switch là State pattern chuẩn',
    'State và Strategy luôn giống nhau về ý định'
  ],
  answer: 0,
  explain: `**Đáp án đúng: hành vi phụ thuộc trạng thái nội bộ và có thể tự chuyển.**

**Tóm tắt:** State pattern gom hành vi theo từng trạng thái vào class riêng; context giữ state hiện tại và delegate.

### Vì sao đúng
- Tránh switch khổng lồ lặp lại ở nhiều method; mỗi state biết hành vi và trạng thái kế tiếp hợp lệ.
- Chuyển tiếp (transition) thường nằm trong context/state, phản ánh vòng đời object.

### Vì sao các phương án khác sai
- Client truyền strategy mỗi lần là đặc trưng Strategy.
- Enum+switch có thể mô phỏng đơn giản nhưng không phải bản chất pattern khi logic phức tạp.
- Ý định khác: State về vòng đời/hành vi nội tại, Strategy về thuật toán thay thế.

> Senior tip: Với nhiều trạng thái và luật chuyển phức tạp, cân nhắc state machine library nhưng vẫn giữ tư duy State.`
},
{
  id: 'qz-design-058',
  topic: 'design',
  multi: true,
  q: 'Decorator trong Spring (proxy/AOP - lập trình hướng khía cạnh, thêm hành vi ngang như transaction/log quanh method): phát biểu nào đúng? (Chọn 2)',
  options: [
    '{{@Transactional}} thường được Spring thực thi qua proxy bọc bean để mở/commit/rollback transaction quanh lời gọi method',
    'Proxy thêm cross-cutting concern (mối quan tâm cắt ngang như bảo mật, giao dịch) mà không sửa code nghiệp vụ trong method',
    'Proxy làm thay đổi bytecode của class domain entity trong mọi trường hợp',
    'Gọi method {{@Transactional}} từ chính method khác trong cùng class luôn đi qua proxy'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: Spring dùng proxy để bọc hành vi và thêm concern ngang.**

**Tóm tắt:** Decorator/Proxy pattern (mẫu bọc) thêm hành vi trước/sau khi ủy thác cho đối tượng thật; Spring AOP thường dùng JDK dynamic proxy hoặc CGLIB.

### Vì sao đúng
- {{@Transactional}}, {{@Cacheable}}, security advice là ví dụ điển hình: hạ tầng xử lý quanh lời gọi.
- Tách concern giúp code nghiệp vụ gọn và tái sử dụng.

### Vì sao các phương án khác sai
- Không phải mọi trường hợp đều sửa bytecode entity; cơ chế phụ thuộc cấu hình/proxy type.
- Self-invocation (gọi nội bộ cùng instance) thường bypass proxy nên annotation có thể không có tác dụng.

> Senior tip: Hiểu rõ "proxy boundary" để tránh bug transaction/log không chạy như mong đợi.`
},
{
  id: 'qz-design-059',
  topic: 'design',
  q: 'Builder pattern (mẫu xây dựng) và Java {{record}} (Java 16+, kiểu dữ liệu bất biến mang dữ liệu) phù hợp thế nào?',
  options: [
    '{{record}} phù hợp value object/DTO bất biến; Builder hữu ích khi có nhiều tham số tùy chọn hoặc cần bước dựng phức tạp',
    '{{record}} thay thế hoàn toàn Builder trong mọi trường hợp',
    'Builder chỉ dùng cho entity JPA mutable',
    '{{record}} cho phép setter để thay đổi field sau khi tạo'
  ],
  answer: 0,
  explain: `**Đáp án đúng: record cho dữ liệu bất biến, Builder cho khởi tạo phức tạp.**

**Tóm tắt:** Builder tách việc "lắp ráp" object nhiều bước/nhều tham số; {{record}} sinh sẵn constructor, accessor, {{equals/hashCode/toString}} cho dữ liệu bất biến.

### Vì sao đúng
- DTO (Data Transfer Object - gói dữ liệu trao đổi) bất biến hợp với record: rõ ràng, ít boilerplate.
- Khi có 6-7 tham số, nhiều giá trị mặc định, hoặc validation theo nhóm, Builder (tự viết hoặc Lombok) vẫn hữu ích; có thể kết hợp record + builder.

### Vì sao các phương án khác sai
- Record không có setter và không thay thế mọi nhu cầu dựng (ví dụ bước tính toán trung gian).
- Builder không chỉ dành cho JPA entity.
- Record bất biến theo thiết kế.

> Senior tip: Ưu tiên bất biến cho message/event; dùng Builder khi constructor dài gây nhầm thứ tự tham số.`
},
{
  id: 'qz-design-060',
  topic: 'design',
  q: 'Hexagonal Architecture (Ports and Adapters - kiến trúc lục giác/cổng và bộ chuyển đổi) tách phần nào khỏi phần nào?',
  options: [
    'Domain/business logic (lõi) độc lập với hạ tầng (DB, HTTP, queue) thông qua port (interface) và adapter (triển khai)',
    'Chỉ tách Controller khỏi Service trong cùng tầng',
    'Bắt buộc dùng 6 module Maven',
    'Thay thế hoàn toàn việc viết integration test'
  ],
  answer: 0,
  explain: `**Đáp án đúng: cô lập domain khỏi chi tiết hạ tầng bằng port/adapter.**

**Tóm tắt:** Port là "ổ cắm" (interface) do domain định nghĩa hoặc cần; Adapter là "phích cắm" nối port với công nghệ cụ thể (JPA, Kafka, REST).

### Vì sao đúng
- Domain không import framework/driver → dễ unit test với fake adapter.
- Đổi DB hay message broker chỉ thay adapter, giữ nguyên use case.

### Vì sao các phương án khác sai
- Không chỉ là tách Controller/Service bề mặt.
- "Hexagonal" là ẩn dụ, không quy định số module.
- Vẫn cần integration test cho adapter và wiring.

> Senior tip: Áp dụng mạnh khi domain phức tạp và vòng đời sản phẩm dài; với CRUD đơn giản có thể là over-engineering.`
},
{
  id: 'qz-design-061',
  topic: 'design',
  multi: true,
  q: 'DDD (Domain-Driven Design - thiết kế hướng miền): Aggregate boundary (ranh giới aggregate - cụm đối tượng nhất quán) nên được xác định dựa trên điều gì? (Chọn 2)',
  options: [
    'Các invariant (bất biến nghiệp vụ - điều kiện phải luôn đúng) cần được đảm bảo nhất quán trong một giao dịch',
    'Ranh giới nơi các thay đổi phải "đúng cùng lúc" theo luật nghiệp vụ, do Aggregate Root điều phối',
    'Gom tất cả entity liên quan vào một aggregate thật lớn để dễ join',
    'Theo đúng số bảng trong database'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: dựa trên invariant và tính nhất quán tức thì.**

**Tóm tắt:** Aggregate là cụm object được xem như một đơn vị nhất quán; chỉ Aggregate Root (gốc) được truy cập từ bên ngoài.

### Vì sao đúng
- Nếu hai dữ liệu phải luôn thỏa luật cùng lúc (ví dụ tổng tiền = sum dòng), chúng thường thuộc cùng aggregate hoặc cần cơ chế khác (saga/eventual consistency).
- Root bảo vệ invariant khi nhận command/thay đổi.

### Vì sao các phương án khác sai
- Aggregate quá lớn gây lock contention, transaction dài, khó scale.
- Ranh giới DB (bảng) là chi tiết lưu trữ, không quyết định ranh giới nghiệp vụ.

> Senior tip: Khi phỏng vấn, hỏi "quy tắc nào không được sai dù chỉ 1 giây?" để tìm invariant và boundary.`
},
{
  id: 'qz-design-062',
  topic: 'design',
  q: 'Code smell "Shotgun surgery" (phẫu thuật rải đạn - một thay đổi nhỏ phải sửa nhiều nơi) thường do nguyên nhân gì?',
  options: [
    'Một trách nhiệm/khái niệm bị phân mảnh rải rác nhiều class, thiếu gom nhóm (cohesion - sự gắn kết bên trong)',
    'Một class quá lớn làm mọi thứ',
    'Dùng quá nhiều interface',
    'Đặt tên biến quá dài'
  ],
  answer: 0,
  explain: `**Đáp án đúng: logic liên quan bị rải rác.**

**Tóm tắt:** Shotgun surgery xảy ra khi thêm/sửa một rule buộc bạn chạm vào hàng loạt file.

### Vì sao đúng
- Ví dụ: quy tắc tính thuế nằm rải rác ở controller, service, util, entity → mỗi lần đổi luật phải săn nhiều chỗ.
- Hướng xử lý: gom trách nhiệm liên quan (Move Field/Method, Extract Class/Module) để thay đổi tập trung.

### Vì sao các phương án khác sai
- Class quá lớn là "God class"/"Large class", smell khác (dù có thể đi kèm).
- Nhiều interface hay tên dài không phải nguyên nhân trực tiếp.

> Senior tip: Đo bằng số file/PR cho một thay đổi nghiệp vụ đơn giản; con số cao là tín hiệu kiến trúc rò rỉ.`
},
{
  id: 'qz-design-063',
  topic: 'design',
  q: 'Code smell "Feature envy" (ghen tị tính năng - method quan tâm dữ liệu của class khác hơn class mình): dấu hiệu và hướng refactor đúng là gì?',
  options: [
    'Method gọi nhiều getter/field của object khác; cân nhắc Move Method sang class sở hữu dữ liệu đó',
    'Method có quá nhiều tham số; luôn dùng Introduce Parameter Object',
    'Method quá ngắn; cần inline',
    'Class có nhiều constructor; cần Builder'
  ],
  answer: 0,
  explain: `**Đáp án đúng: phát hiện qua việc "mượn" dữ liệu và di chuyển hành vi.**

**Tóm tắt:** Feature envy cho thấy hành vi đang đặt sai chỗ so với dữ liệu nó thao tác.

### Vì sao đúng
- Nếu {{order.getCustomer().getLevel()}} lặp lại để tính chiết khấu, logic có thể thuộc về {{Customer}} hoặc {{PricingPolicy}}.
- Move Method/Extract Method giúp tăng cohesion và giảm coupling.

### Vì sao các phương án khác sai
- Nhiều tham số là smell khác (Long Parameter List).
- Method ngắn hay nhiều constructor không định nghĩa feature envy.

> Senior tip: Trong domain giàu hành vi (rich domain), tránh để service "hút" hết logic khỏi entity/value object một cách mù quáng.`
},
{
  id: 'qz-design-064',
  topic: 'design',
  multi: true,
  q: 'Refactor an toàn (thay đổi cấu trúc code nhưng giữ nguyên hành vi) khi chưa có test: bước nào nên ưu tiên? (Chọn 2)',
  options: [
    'Viết characterization test (test ghi lại hành vi hiện tại) làm lưới an toàn trước khi đổi cấu trúc',
    'Refactor từng bước nhỏ, chạy test sau mỗi bước và commit thường xuyên',
    'Viết lại toàn bộ module trong một nhánh dài rồi mới test cuối kỳ',
    'Tối ưu hiệu năng song song với đổi kiến trúc lớn để tiết kiệm thời gian'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: khóa hành vi bằng test và đi từng bước nhỏ.**

**Tóm tắt:** Refactor an toàn dựa trên phản hồi nhanh: biết hành vi cũ, thay đổi nhỏ, xác minh liên tục.

### Vì sao đúng
- Characterization test (golden/master test) bắt output/side-effect hiện tại, kể cả hành vi lạ, để phát hiện lệch.
- Bước nhỏ + commit giúp khoanh vùng lỗi và rollback dễ.

### Vì sao các phương án khác sai
- Viết lại lớn (big bang rewrite) rủi ro mất hành vi ngầm và khó debug.
- Trộn tối ưu hiệu năng với thay đổi cấu trúc làm khó biết nguyên nhân khi có lỗi.

> Senior tip: "Làm cho thay đổi dễ (dễ sửa) rồi mới làm thay đổi dễ đó" — nhưng luôn cần bằng chứng từ test/monitoring.`
},
{
  id: 'qz-design-065',
  topic: 'design',
  q: 'Trong DDD, vì sao chỉ nên thay đổi trạng thái bên trong Aggregate thông qua Aggregate Root?',
  options: [
    'Root là điểm vào duy nhất để kiểm tra invariant và điều phối thay đổi nhất quán bên trong ranh giới aggregate',
    'Vì framework ORM yêu cầu như vậy',
    'Để giảm số class trong domain',
    'Để mọi entity đều public setter cho tiện'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Aggregate Root bảo vệ bất biến.**

**Tóm tắt:** Aggregate Root (gốc của aggregate) chịu trách nhiệm đảm bảo mọi thay đổi giữ cho cụm object luôn hợp lệ theo luật nghiệp vụ.

### Vì sao đúng
- Nếu client sửa trực tiếp entity con, root không có cơ hội từ chối thay đổi vi phạm luật (ví dụ vượt hạn mức dòng đơn).
- Giao tiếp qua method mang ý nghĩa nghiệp vụ ({{order.addItem(...)}}) rõ hơn setter rời rạc.

### Vì sao các phương án khác sai
- ORM có thể hỗ trợ mapping nhưng lý do chính là nghiệp vụ, không phải công cụ.
- Giảm số class hay mở setter không liên quan và thường làm yếu thiết kế.

> Senior tip: Expose ID của entity con ra ngoài nếu cần tham chiếu, nhưng route thay đổi qua root.`
},
{
  id: 'qz-design-066',
  topic: 'design',
  q: 'Một service tính giá có {{if (customer.isVip()) ... else ...}} rải rác nhiều nơi. Refactor nào thường phù hợp để tuân thủ OCP và giảm trùng lặp?',
  options: [
    'Dùng Strategy/Policy (ví dụ {{PricingPolicy}}) và chọn implementation theo ngữ cảnh thay vì rải if',
    'Chuyển hết if vào database stored procedure',
    'Dùng biến global để lưu loại khách hàng',
    'Copy-paste logic vào từng controller'
  ],
  answer: 0,
  explain: `**Đáp án đúng: đóng gói biến thể thuật toán bằng Strategy/Policy.**

**Tóm tắt:** Khi hành vi thay đổi theo loại/điều kiện ổn định, Strategy giúp thay nhánh điều kiện bằng polymorphism.

### Vì sao đúng
- Mỗi policy có trách nhiệm rõ, thêm loại mới bằng class mới và đăng ký.
- Test từng policy độc lập, giảm rủi ro sửa một chỗ làm hỏng chỗ khác.

### Vì sao các phương án khác sai
- Đẩy logic nghiệp vụ xuống DB khó version/test và trộn trách nhiệm.
- Biến global/copy-paste tăng coupling và shotgun surgery.

> Senior tip: Đừng lạm dụng pattern cho 1-2 nhánh ổn định; refactor khi thấy biến động và trùng lặp thực sự.`
},
{
  id: 'qz-design-067',
  topic: 'design',
  q: 'Trong Hexagonal Architecture, "port" thường là gì trong code Java?',
  options: [
    'Interface do domain/use case định nghĩa để mô tả khả năng cần (ví dụ {{PaymentGateway}}) mà adapter hạ tầng sẽ implement',
    'Một class controller REST',
    'File cấu hình YAML',
    'Bảng database'
  ],
  answer: 0,
  explain: `**Đáp án đúng: port là abstraction (thường là interface).**

**Tóm tắt:** Port mô tả "cần gì" ở biên ứng dụng; adapter hiện thực "làm thế nào" với công nghệ cụ thể.

### Vì sao đúng
- Ví dụ outbound port {{OrderRepository}} do domain cần; {{JpaOrderRepository}} là adapter.
- Inbound port có thể là interface use case mà web/controller gọi vào.

### Vì sao các phương án khác sai
- Controller/YAML/bảng là thành phần hạ tầng hoặc cơ chế, không phải port.

> Senior tip: Đặt tên port theo ngôn ngữ miền (PaymentGateway) thay vì công nghệ (StripeClient) để giữ domain sạch.`
},
{
  id: 'qz-design-068',
  topic: 'design',
  multi: true,
  q: 'Khi refactor legacy code an toàn, thực hành nào giúp giảm rủi ro? (Chọn 2)',
  options: [
    'Thêm test bao phủ nhánh quan trọng (kể cả test qua API/public method) trước khi thay đổi cấu trúc bên trong',
    'Tách bước: đổi tên/di chuyển (behavior-preserving) rồi mới thay đổi hành vi trong bước riêng có test',
    'Tắt toàn bộ test cũ vì chúng cản refactor',
    'Gộp refactor và thêm tính năng lớn vào cùng một commit để dễ review'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: có lưới an toàn và tách loại thay đổi.**

**Tóm tắt:** Refactor (giữ hành vi) và thay đổi tính năng là hai loại rủi ro khác nhau; trộn chúng làm khó truy vết.

### Vì sao đúng
- Test bảo vệ hợp đồng quan sát được; với legacy có thể bắt đầu từ test mức tích hợp.
- Tách bước giúp diff rõ: bước nào chỉ "di chuyển", bước nào đổi logic.

### Vì sao các phương án khác sai
- Tắt test bỏ mất tín hiệu hồi quy.
- Commit lớn trộn refactor+feature khiến review và bisect bug rất khó.

> Senior tip: Dùng "Mikado method" hoặc danh sách bước nhỏ khi refactor chuỗi phụ thuộc phức tạp.`
},
{
  id: 'qz-design-069',
  topic: 'design',
  q: 'So sánh dùng {{record}} (bất biến) với class mutable cho DTO trong API: lợi ích chính của {{record}} là gì?',
  options: [
    'Dữ liệu bất biến, intent rõ "chỉ mang dữ liệu", giảm lỗi do bị sửa ngầm và giảm boilerplate',
    'Cho phép kế thừa để tái sử dụng field',
    'Tự động map với mọi annotation ORM mà không cấu hình',
    'Luôn nhanh hơn class thường về hiệu năng runtime'
  ],
  answer: 0,
  explain: `**Đáp án đúng: bất biến và rõ ý định.**

**Tóm tắt:** {{record}} (Java 16+) là cách khai báo ngắn gọn cho carrier dữ liệu bất biến.

### Vì sao đúng
- Không có setter → khó bị thay đổi ngoài ý muốn khi truyền qua nhiều tầng.
- Trình biên dịch sinh constructor/accessor/equals/hashCode/toString nhất quán.

### Vì sao các phương án khác sai
- {{record}} không thể {{extends}} class khác (nhưng có thể implement interface).
- ORM mapping phụ thuộc phiên bản/cấu hình, không tự động "mọi trường hợp".
- Hiệu năng không phải lý do chính và phụ thuộc ngữ cảnh.

> Senior tip: Với entity JPA cần proxy/mutation, record thường không phù hợp; dùng cho DTO/command/query object.`
},
{
  id: 'qz-design-070',
  topic: 'design',
  q: 'Trong Spring, decorator/proxy cho {{@Cacheable}} hoặc {{@Transactional}} thường KHÔNG áp dụng khi nào?',
  options: [
    'Khi gọi method được chú thích từ một method khác trong cùng instance (self-invocation), lời gọi không đi qua proxy',
    'Khi method là public',
    'Khi bean được Spring quản lý',
    'Khi dùng interface'
  ],
  answer: 0,
  explain: `**Đáp án đúng: self-invocation bypass proxy.**

**Tóm tắt:** Nhiều tính năng Spring AOP dựa trên proxy bao ngoài bean; gọi {{this.method()}} đi thẳng vào object thật, không qua lớp bọc.

### Vì sao đúng
- {{this.internal()}} từ {{publicMethod()}} cùng class sẽ không kích hoạt advice của {{internal()}}.
- Cách xử lý: tách bean, tự inject chính mình (cẩn thận), hoặc dùng AspectJ weaving khi thực sự cần.

### Vì sao các phương án khác sai
- Public bean/interface không phải nguyên nhân chặn; ngược lại còn là điều kiện phổ biến để proxy hoạt động.

> Senior tip: Khi debug "annotation không chạy", kiểm tra call stack xem có đi qua proxy class ({{\\$Proxy}}/CGLIB) không.`
}

,
{ id: 'qz-microservices-043', topic: 'microservices', q: 'Resilience4j CircuitBreaker ở trạng thái OPEN thì điều gì xảy ra với các request mới?', options: ['Tất cả request vẫn được gọi downstream, chỉ log warning', 'Request bị fail fast, ném CallNotPermittedException mà không gọi downstream', 'Request được xếp hàng chờ đến khi HALF_OPEN', 'CircuitBreaker tự retry với backoff'], answer: 1, explain: `**Tóm tắt:** OPEN = mạch bị ngắt: request mới bị từ chối ngay (fail fast) để bảo vệ service downstream đang lỗi; không gọi downstream.\n\n### Vì sao\n- CLOSED: mọi request đi qua, đếm lỗi theo sliding window.\n- Khi tỉ lệ lỗi ≥ ngưỡng (failureRateThreshold), chuyển OPEN.\n- OPEN trong waitDurationInOpenState: mọi call ném CallNotPermittedException.\n- Hết thời gian → HALF_OPEN: cho phép một số call thăm dò; nếu thành công → CLOSED, nếu lỗi → OPEN lại.\n\n### Vì sao các phương án khác sai\n- A: gọi downstream khi đang OPEN phá vỡ mục đích bảo vệ.\n- C: không có hàng chờ; fail fast ngay.\n- D: retry là tính năng Retry, không phải CircuitBreaker.\n\n> Senior tip: Đặt fallback cho CallNotPermittedException (cache cũ, default) để UX không vỡ.` },
{ id: 'qz-microservices-044', topic: 'microservices', multi: true, q: 'Khi retry một request không idempotent (Chọn 2)', options: ['Retry tự động luôn an toàn nếu có circuit breaker', 'Cần idempotency key để tránh xử lý trùng', 'Chỉ retry lỗi 5xx, không retry 4xx', 'Retry với exponential backoff + jitter giảm thundering herd', 'Retry vô hạn cho đến khi thành công'], answer: [1, 3], explain: `**Tóm tắt:** Retry chỉ an toàn khi operation idempotent hoặc có idempotency key; kết hợp backoff + jitter để tránh dồn dập.\n\n### Vì sao đúng\n- Idempotency key: server dedupe theo key, retry không tạo duplicate (vd: thanh toán).\n- Exponential backoff + jitter: tránh mọi client retry cùng lúc gây spike.\n\n### Vì sao các phương án khác sai\n- A: circuit breaker không làm operation idempotent.\n- C: retry 4xx thường vô nghĩa (client error), nhưng statement "chỉ retry 5xx" không phải điều kiện idempotency được hỏi.\n- E: retry vô hạn dễ gây storm và duplicate.\n\n> Senior tip: Phân biệt retriable (timeout, 503, connection reset) vs non-retriable (400, 404, 422).` },
{ id: 'qz-microservices-045', topic: 'microservices', q: 'Saga pattern dùng để làm gì trong microservices?', options: ['Đồng bộ schema DB giữa các service', 'Quản lý transaction phân tán qua chuỗi local transaction + compensating action', 'Cache dữ liệu giữa các service', 'Load balance request giữa các instance'], answer: 1, explain: `**Tóm tắt:** Saga = transaction phân tán = chuỗi transaction cục bộ ở mỗi service; nếu một bước fail, chạy compensating transaction để hoàn tác các bước trước.\n\n### Hai kiểu\n- Choreography: service publish event, service khác lắng nghe.\n- Orchestration: một orchestrator điều phối.\n\n### Vì sao các phương án khác sai\n- A: schema sync là migration tooling.\n- C: cache là Redis/CDN.\n- D: load balance là gateway/discovery.\n\n> Senior tip: Compensating action phải idempotent và có thể chạy nhiều lần.` },
{ id: 'qz-microservices-046', topic: 'microservices', q: 'Outbox pattern giải quyết vấn đề gì?', options: ['Gửi message Kafka trước khi commit DB', 'Đảm bảo ghi DB và publish event cùng thành công (atomic) bằng bảng outbox + relay', 'Thay thế transaction DB', 'Mã hoá message trong Kafka'], answer: 1, explain: `**Tóm tắt:** Outbox ghi event vào bảng outbox cùng transaction với business data; relay đọc outbox và publish lên broker → dual-write atomic.\n\n### Cơ chế\n- 1 transaction: UPDATE orders + INSERT outbox.\n- Relay (CDC/worker) đọc outbox → publish Kafka → mark published.\n- Consumer phải idempotent (at-least-once).\n\n### Vì sao các phương án khác sai\n- A: publish trước commit → mất consistency nếu commit fail.\n- C: outbox không thay transaction.\n- D: mã hoá là security layer.\n\n> Senior tip: Dùng Debezium CDC để relay không polling DB.` },
{ id: 'qz-microservices-047', topic: 'microservices', q: 'Service discovery (Eureka/Consul) giúp gì?', options: ['Mã hoá TLS giữa service', 'Client tìm instance healthy động theo registry, không hard-code host', 'Lưu session user', 'Giới hạn rate request'], answer: 1, explain: `**Tóm tắt:** Service đăng ký instance vào registry; client query registry để gọi instance healthy, hỗ trợ scale/replace động.\n\n### Vì sao các phương án khác sai\n- A: TLS là mTLS/cert.\n- C: session lưu Redis/DB.\n- D: rate limit là gateway.\n\n> Senior tip: Client-side (Ribbon/Spring Cloud LoadBalancer) vs server-side (gateway) discovery; health check quyết định instance available.` },
{ id: 'qz-microservices-048', topic: 'microservices', q: 'API Gateway thường chịu trách nhiệm gì?', options: ['Chỉ routing URL', 'Routing, auth, rate limit, aggregation, protocol translation', 'Lưu trữ dữ liệu nghiệp vụ', 'Compile code service'], answer: 1, explain: `**Tóm tắt:** Gateway là điểm vào duy nhất: routing, authn/authz, rate limiting, request aggregation, protocol translation (REST↔gRPC).\n\n### Vì sao các phương án khác sai\n- A: thiếu auth/rate limit → không đủ.\n- C: DB là storage.\n- D: build là CI.\n\n> Senior tip: Tránh business logic trong gateway; giữ stateless để scale ngang.` },
{ id: 'qz-microservices-049', topic: 'microservices', q: 'Distributed tracing (OpenTelemetry) primarily cung cấp gì?', options: ['Metric CPU của từng pod', 'Trace end-to-end qua nhiều service với traceId/spanId', 'Log tập trung', 'Backup DB'], answer: 1, explain: `**Tóm tắt:** Trace gắn traceId/spanId qua header (traceparent) để theo dõi một request đi qua nhiều service, tìm bottleneck.\n\n### Vì sao các phương án khác sai\n- A: metric là Prometheus.\n- C: log tập trung là ELK/Loki.\n- D: backup là DB ops.\n\n> Senior tip: Propagate context qua messaging (Kafka headers) để trace không bị đứt.` },
{ id: 'qz-microservices-050', topic: 'microservices', q: 'Kafka consumer group đảm bảo điều gì về thứ tự message?', options: ['Thứ tự toàn cục trên topic', 'Thứ tự được bảo toàn trong mỗi partition; cùng key → cùng partition', 'Thứ tự ngẫu nhiên giữa các consumer', 'Không có đảm bảo nào'], answer: 1, explain: `**Tóm tắt:** Kafka chỉ bảo toàn thứ tự trong một partition; message có cùng key được hash vào cùng partition → xử lý theo thứ tự per key.\n\n### Vì sao các phương án khác sai\n- A: topic có nhiều partition → không có thứ tự toàn cục.\n- C: consumer group chia partition, mỗi partition một consumer → thứ tự trong partition vẫn giữ.\n- D: có đảm bảo per-partition.\n\n> Senior tip: Nếu cần thứ tự theo entity, dùng entityId làm key.` },
{ id: 'qz-microservices-051', topic: 'microservices', multi: true, q: 'Để retry an toàn với Kafka consumer (Chọn 2)', options: ['Commit offset trước khi xử lý', 'Xử lý idempotent theo message key/id', 'Dùng manual commit sau khi xử lý xong', 'Tăng partitions để retry nhanh hơn', 'Disable rebalance'], answer: [1, 2], explain: `**Tóm tắt:** Idempotent processing + manual commit sau xử lý đảm bảo at-least-once không duplicate side-effect.\n\n### Vì sao đúng\n- Idempotent: xử lý lại cùng message không tạo duplicate (dedupe theo id).\n- Manual commit sau xử lý: crash giữa chừng → reprocess, không mất message.\n\n### Vì sao các phương án khác sai\n- A: commit trước xử lý → mất message nếu crash.\n- D: thêm partition không liên quan retry.\n- E: rebalance cần cho scale.\n\n> Senior tip: Kết hợp dead-letter topic cho poison pill.` },
{ id: 'qz-microservices-052', topic: 'microservices', q: 'Choreography saga vs orchestration saga: khi nào chọn orchestration?', options: ['Khi có ≤ 2 service và flow đơn giản', 'Khi flow phức tạp, nhiều bước, cần quan sát tập trung và retry/compensation rõ ràng', 'Khi không cần compensation', 'Khi dùng Kafka'], answer: 1, explain: `**Tóm tắt:** Flow phức tạp → orchestrator tập trung giúp theo dõi, retry, compensation rõ ràng; flow đơn giản → choreography đủ.\n\n### Vì sao các phương án khác sai\n- A: flow đơn giản nên choreography.\n- C: saga luôn cần compensation.\n- D: broker không quyết định kiểu saga.\n\n> Senior tip: Orchestrator có thể trở thành SPOF; làm nó resilient + observable.` },
{
  id: 'qz-banking-028',
  topic: 'banking',
  q: 'Khách A chuyển 1.000.000 VND sang khách B, phí 10.000 VND do A chịu. Theo ghi sổ kép (double-entry bookkeeping), ít nhất mấy bút toán và ghi vào tài khoản nào là đúng?',
  options: [
    '1 bút toán: nợ A 1.010.000, có B 1.000.000',
    '3 bút toán: nợ A 1.010.000; có B 1.000.000; có khoản phí 10.000 (doanh thu ngân hàng)',
    '2 bút toán: nợ A 1.000.000, có B 1.000.000; phí không ghi vào sổ cái',
    'Nợ B 1.000.000, có A 1.000.000 (chiều ngược lại nghiệp vụ)'
  ],
  answer: 1,
  explain: `**Đáp án đúng: 3 bút toán — nợ A 1.010.000; có B 1.000.000; có khoản phí 10.000.**

**Tóm tắt:** Trong sổ kế toán, mỗi giao dịch phải có ít nhất một bút toán ghi nợ (debit) và một bút toán ghi có (credit), và tổng số tiền ghi nợ phải bằng tổng số tiền ghi có trong cùng giao dịch. Khoản phí cần bút toán riêng để ghi nhận doanh thu.

### Vì sao đúng
Ba bút toán trên cân bằng:
- Nợ tài khoản A 1.010.000: số dư khả dụng của A giảm một triệu mười nghìn (một triệu tiền chuyển thêm mười nghìn phí).
- Có tài khoản B 1.000.000: số dư B tăng một triệu.
- Có khoản phí thu 10.000: doanh thu ngân hàng tăng mười nghìn.

Tổng nợ = 1.010.000; tổng có = 1.000.000 + 10.000 = 1.010.000. Hai bên bằng nhau, sổ cái vẫn cân bằng.

Ví dụ minh hoạ:
~~~text
Giao dịch: A chuyển 1.000.000 cho B, phí 10.000 do A trả

             NỢ (debit)           CÓ (credit)
Tài khoản A:   1.010.000           (số dư giảm)
Tài khoản B:                   1.000.000   (số dư tăng)
Khoản phí thu:                      10.000   (doanh thu)
Tổng:              1.010.000   =  1.010.000  cân bằng
~~~

### Vì sao các phương án khác sai
- **1 bút toán nợ A 1.010.000, có B 1.000.000**: nợ 1.010.000 không bằng có 1.000.000, sai nguyên tắc cân bằng sổ kép; khoản phí 10.000 biến mất không được ghi nhận ở đâu cả.
- **2 bút toán nợ A 1.000.000, có B 1.000.000, phí không ghi**: bỏ qua khoản phí, không ghi mọi sự biến động tiền tệ vào sổ cái; sau này không truy vết được phí từ đâu và số dư toàn hệ thống sẽ sai.
- **Nợ B, có A**: chiều ghi ngược nghĩa là B chuyển tiền cho A, sai hoàn toàn nghiệp vụ.

> Senior tip: Thiết kế bảng bút toán ledger với các cột account_id, amount, direction (debit/credit), transaction_id. Trước khi commit một giao dịch, hãy tính tổng debit và tổng credit của cùng transaction_id; nếu khác nhau thì rollback toàn bộ giao dịch, chứ không chỉ rollback một bút toán.`
},
{
  id: 'qz-banking-029',
  topic: 'banking',
  q: 'Khách nhấn nút "Gửi" chuyển tiền hai lần nhanh, ứng dụng gửi hai HTTP request cùng idempotency key lên server. Server nhận cả hai request song song trên hai luồng khác nhau. Cách xử lý đúng là gì?',
  options: [
    'Xử lý cả hai request vì chúng đến trên hai luồng khác nhau',
    'Kiểm tra idempotency key trong cơ sở dữ liệu; nếu key đã được xử lý thì trả lại kết quả cũ, không thực hiện lại bút toán; việc kiểm tra và lưu key phải nằm trong cùng một transaction DB với bút toán',
    'Dùng thời gian gửi của client để phân biệt; hai request đến khác mili giây thì coi là hai giao dịch khác nhau',
    'Từ chối request thứ hai bằng mã HTTP 409 Conflict'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Kiểm tra idempotency key trong DB; nếu key đã được xử lý thì trả lại kết quả cũ, không thực hiện lại bút toán; kiểm tra và lưu key phải nằm trong cùng một transaction DB với bút toán.**

**Tóm tắt:** Idempotency key là mã định danh duy nhất (thường do client tạo, ví dụ UUID) gắn cho mỗi ý định giao dịch. Cùng một key nghĩa là cùng một ý định (ví dụ "chuyển 200.000 cho B"), nên server chỉ xử lý một lần; các lần gửi lại do nhấn nhầm hoặc mạng retry đều nhận lại kết quả đã lưu. Để tránh hai luồng cùng đọc "chưa có key" rồi cùng thực hiện, kiểm tra và lưu key phải nguyên tử, nằm trong cùng một transaction DB.

Thuật ngữ:
- **Idempotency (tính lũy đẳng)**: thực hiện cùng thao tác nhiều lần cho kết quả như thực hiện một lần.
- **Idempotency key**: chuỗi định danh duy nhất gắn với mỗi yêu cầu, server dùng để nhận biết yêu cầu trùng.

### Vì sao đúng
Kịch bản nhấn nút Gửi hai lần nhanh:
1. Luồng 1 kiểm tra key "abc-123" trong DB: chưa có.
2. Luồng 2 cũng kiểm tra key "abc-123": chưa có (vì luồng 1 chưa kịp lưu).
3. Nếu cả hai đều thực hiện bút toán → tiền bị trừ hai lần (race condition).
Cách đúng: dùng transaction DB, ví dụ SELECT ... FOR UPDATE để khóa dòng key, hoặc INSERT ... ON CONFLICT DO NOTHING rồi kiểm tra số dòng bị ảnh hưởng: nếu không chèn được dòng nào thì key đã tồn tại, trả lại kết quả đã lưu.

~~~text
Luồng 1:                      Luồng 2:
SELECT key=abc... không có     SELECT key=abc... không có
(trả rỗng)                     (trả rỗng)
     |                               |
     v                               v
trừ tiền 1 triệu             trừ tiền 1 triệu  <-- tiền bị trừ hai lần
     |                               |
     v                               v
INSERT key=abc thành công    INSERT key=abc → lỗi trùng khóa (tiền đã bị trừ)
~~~

Kiểm tra-lưu key trong cùng transaction với bút toán làm toàn bộ thành nguyên tử: hoặc toàn bộ thành công hoặc toàn bộ rollback.

### Vì sao các phương án khác sai
- **Xử lý cả hai vì hai luồng khác nhau**: hai luồng khác nhau vẫn là hai yêu cầu trùng cùng một ý định; xử lý cả hai là trừ tiền hai lần, sai nghiêm trọng trong thanh toán.
- **Dùng thời gian client để phân biệt**: đồng hồ client không đáng tin cậy (có thể lệch, bị chỉnh lại giờ) và hai retry của cùng ý định có thể có thời gian khác; không dùng thời gian để định danh ý định giao dịch.
- **Từ chối HTTP 409**: client hoặc đối tác nhận 409 sẽ hiểu là xung đột và thường gửi lại, dẫn đến client bị kẹt, giao dịch không có kết quả rõ ràng. Đúng là trả 200 kèm kết quả đã lưu.

> Senior tip: idempotency key phải đại diện cho ý định nghiệp vụ, không phải mã vận chuyển nội bộ. Đặt TTL cho key (ví dụ 24-72 giờ) để bảng không tăng vô hạn, nhưng TTL phải dài hơn cửa sổ retry của đối tác hoặc client.`
},
{
  id: 'qz-banking-030',
  topic: 'banking',
  q: 'File đối soát từ đối tác không có mã tham chiếu chung với hệ thống của bạn, chỉ có số tiền, thời gian và hướng giao dịch. Làm sao đối soát đúng?',
  options: [
    'So sánh tổng tiền cuối ngày; nếu tổng bằng nhau thì coi như tất cả giao dịch đều khớp',
    'Match từng cặp theo (số tiền, hướng, thời gian trong cửa sổ nhỏ, ví dụ 5 phút); những giao dịch không tìm được cặp đưa vào hàng chờ unmatched để điều tra',
    'Tự động tạo giao dịch trong hệ thống của bạn để khớp số liệu ngay lập tức',
    'Bỏ qua vì không có mã tham chiếu thì không thể đối soát'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Match từng cặp theo (số tiền, hướng, thời gian gần nhau trong cửa sổ nhỏ, ví dụ 5 phút); giao dịch không tìm được cặp đưa vào hàng chờ unmatched để điều tra.**

**Tóm tắt:** Khi không có mã tham chiếu chung, hệ thống phải ghép cặp giao dịch bằng các thuộc tính có sẵn (số tiền, hướng nộp/trừ, thời gian giao dịch) với dung sai thời gian nhỏ. Mỗi giao dịch chỉ được ghép một lần (1-1), những giao dịch chưa khớp phải giữ lại để điều tra, không được tự động tạo giao dịch hay kết luận chỉ từ tổng tiền.

Thuật ngữ:
- **Đối soát (reconciliation)**: so sánh dữ liệu giao dịch giữa hai bên để đảm bảo khớp nhau.
- **Matched / Unmatched**: khớp cặp / chưa tìm được cặp đối ứng.
- **Timing difference**: lệch do thời gian, ví dụ bên này đã ghi nhưng bên kia ghi sau.

### Vì sao đúng
Ví dụ minh hoạ:
~~~text
Hệ thống của bạn:         Đối tác:
1.000.000 VND, 14:05:12    1.000.000 VND, 14:05:45   <- cùng số tiền, cùng hướng, chênh 33 giây < 5 phút → MATCH
2.500.000 VND, 14:10:00    (không có)                  <- không tìm cặp → UNMATCHED, đưa vào hàng chờ
~~~
Nếu đối tác có hai dòng 1.000.000 VND trong cùng cửa sổ 5 phút, hệ thống không được tự động chọn một dòng vì có thể ghép nhầm; đưa về điều tra thủ công.

### Vì sao các phương án khác sai
- **So sánh tổng tiền cuối ngày; tổng bằng nhau thì coi như khớp**: rất rủi ro vì hai sai lệch có thể triệt tiêu nhau (một giao dịch thừa 100.000, một giao dịch thiếu 100.000) làm tổng vẫn bằng nhau nhưng chi tiết sai. Đối soát tài chính bắt buộc phải khớp ở mức từng giao dịch.
- **Tự động tạo giao dịch trong hệ thống của bạn**: tự động tạo giao dịch để "cho khớp" có thể ghi nhận giao dịch không hợp lệ hoặc bị trùng; mọi giao dịch trong core banking phải có bằng chứng nghiệp vụ rõ ràng.
- **Bỏ qua**: không có mã tham chiếu không có nghĩa là không đối soát, chỉ là đối soát bằng các thuộc tính khác kém chính xác hơn, cần cẩn thận hơn.

> Senior tip: Đặt cửa sổ thời gian (ví dụ 5 phút hoặc 1 giờ) dựa trên SLA của đối tác, không được quá rộng để tránh ghép nhầm giao dịch khác có cùng số tiền. Tạo báo cáo aging cho unmatched (ví dụ > 24 giờ) để đội vận hành ưu tiên điều tra.`
},
{
  id: 'qz-banking-031',
  topic: 'banking',
  multi: true,
  q: 'Giao dịch chuyển tiền sang đối tác: hệ thống của bạn đã trừ tiền và gửi yêu cầu qua API đối tác, nhưng đối tác trả timeout (không có phản hồi rõ ràng). Giao dịch treo ở trạng thái PENDING. Các xử lý nào đúng? (Chọn 2)',
  options: [
    'Giữ trạng thái PENDING và cung cấp API cho khách hàng tra cứu trạng thái theo mã tham chiếu giao dịch',
    'Job tra soát định kỳ: đối các giao dịch PENDING quá hạn, gửi inquiry/reversal đến đối tác theo mã tham chiếu gốc để xác định trạng thái thực',
    'Tự động hoàn tiền cho khách ngay khi timeout vì không biết kết quả',
    'Tự động gửi lại yêu cầu chuyển tiền với mã giao dịch mới để đảm bảo đối tác nhận được'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: Giữ trạng thái PENDING và cung cấp API tra cứu theo mã tham chiếu · Job tra soát định kỳ gửi inquiry/reversal cho giao dịch PENDING quá hạn theo mã tham chiếu gốc.**

**Tóm tắt:** Timeout tạo ra trạng thái "không xác định": bạn không biết đối tác đã xử lý, đang xử lý hay chưa xử lý. Không được tự động hoàn tiền hay tự động gửi lại, vì nếu giao dịch thực ra đã thành công ở đối tác thì hoàn tiền làm mất tiền và gửi lại làm trừ tiền hai lần.

Thuật ngữ:
- **Giao dịch treo (hung transaction)**: giao dịch đã bắt đầu nhưng kết thúc ở trạng thái trung gian (PENDING, AUTHORIZED) vì không nhận được phản hồi cuối cùng.
- **Inquiry (tra soát)**: gọi API riêng của đối tác để hỏi trạng thái giao dịch theo mã tham chiếu gốc.
- **Reversal (đảo ngược)**: yêu cầu hủy hoặc hoàn tác một giao dịch đã ủy quyền theo quy trình của đối tác.

### Vì sao đúng
- Giữ PENDING và cung cấp API tra cứu: khách hàng biết giao dịch đang được xử lý, không bấm lại, hệ thống không đoán trạng thái.
- Job tra soát định kỳ: sau một khoảng thời gian (ví dụ 30 phút, 2 giờ), hệ thống tự động gọi inquiry hoặc reversal đối với các giao dịch PENDING quá hạn, sau đó cập nhật trạng thái thành SUCCESS hoặc FAILED và thông báo khách hàng.

~~~text
Trạng thái PENDING:
  Khách chuyển tiền → Core trừ tiền → Gửi yêu cầu đối tác → Timeout
                                                      |
                                                      v
                                              Giao dịch treo PENDING
                                                      |
                                              Job tra soát định kỳ
                                                      |
                                              Inquiry/Reversal đối tác
                                                      |
                                              Cập nhật SUCCESS/FAILED
~~~

### Vì sao các phương án khác sai
- **Tự động hoàn tiền ngay khi timeout**: nếu giao dịch thực ra đã thành công ở đối tác (tiền đã đi), hoàn tiền làm số dư sai và khó đối soát.
- **Tự động gửi lại với mã giao dịch mới**: nếu đối tác đã xử lý yêu cầu cũ, yêu cầu mới tạo giao dịch thứ hai → trừ tiền hai lần. Retry chỉ an toàn khi dùng cùng idempotency key/mã tham chiếu gốc và đối tác hỗ trợ xử lý trùng.

> Senior tip: Thiết kế máy trạng thái giao dịch rõ ràng (PENDING, SUCCESS, FAILED, UNKNOWN). Các giao dịch UNKNOWN phải được job tra soát tự động xử lý và có cảnh báo nếu vượt quá thời gian cho phép. Luôn log đầy đủ mã tham chiếu hai phía để đội vận hành đối chiếu nhanh.`
},
{
  id: 'qz-banking-032',
  topic: 'banking',
  q: 'Backend Java cần tích hợp chuyển tiền ngay (real-time payment) qua hệ thống thanh toán tức thời dùng ISO 20022. So sánh với kết nối thẻ qua ISO 8583, phát biểu nào đúng ở mức khái niệm?',
  options: [
    'ISO 20022 là bản nén của ISO 8583 để truyền nhanh hơn trên mạng chậm',
    'ISO 8583 dùng thông điệp có cấu trúc phong phú (XML) và end-to-end ID, còn ISO 20022 dùng field cố định với bitmap qua TCP socket',
    'ISO 20022 dùng thông điệp có cấu trúc phong phú (thường là XML) với ngữ nghĩa rõ ràng và mã tham chiếu liên cuối (end-to-end ID, UETR), thường kết nối qua API hoặc hàng đợi tin nhắn; ISO 8583 dùng field cố định với bitmap qua kết nối TCP socket dài hạn, tối ưu cho giao dịch thẻ thời gian thực',
    'ISO 20022 chỉ dùng cho tiền mã hóa (crypto), ngân hàng truyền thống vẫn dùng ISO 8583'
  ],
  answer: 2,
  explain: `**Đáp án đúng: ISO 20022 dùng thông điệp có cấu trúc phong phú (thường là XML) với ngữ nghĩa rõ ràng và end-to-end ID (UETR), thường qua API hoặc hàng đợi tin nhắn; ISO 8583 dùng field cố định với bitmap qua TCP socket dài hạn, tối ưu cho giao dịch thẻ.**

**Tóm tắt:** Hai chuẩn phục vụ bối cảnh khác nhau và có thể cùng tồn tại trong một hệ thống: ISO 8583 cho thẻ (ATM, POS), ISO 20022 cho chuyển tiền và thanh toán hiện đại.

Thuật ngữ:
- **Real-time payment (thanh toán tức thời)**: chuyển tiền được xử lý và tài khoản được cập nhật trong vài giây, ngay lập tức, không phải đợi batch cuối ngày.
- **ISO 20022**: chuẩn quốc tế định nghĩa mô hình dữ liệu và cú pháp thông điệp tài chính (thường là XML), mỗi trường có tên và ý nghĩa rõ ràng.
- **End-to-end ID / UETR**: mã duy nhất gắn theo giao dịch từ đầu đến cuối, giúp hai bên tra cứu cùng một giao dịch mà không nhầm.
- **Bitmap**: chuỗi bit chỉ ra trường nào có mặt trong thông điệp ISO 8583.
- **TCP socket dài hạn**: kết nối giữ luôn giữa hai hệ thống, dùng để gửi nhiều thông điệp liên tục.

### Vì sao đúng
ISO 20022 thông điệp dài, có cấu trúc, dễ mở rộng, mang nhiều thông tin nghiệp vụ (tên người nhận đầy đủ, mục đích thanh toán, mã tham chiếu liên cuối UETR). Backend Java thường parse/generate XML qua API REST hoặc hàng đợi tin nhắn (message queue). ISO 8583 thông điệp ngắn, field cố định, dùng bitmap để biết field nào hiện, gửi qua kết nối TCP socket giữ lâu, tối ưu độ trễ thấp cho giao dịch thẻ.

### Vì sao các phương án khác sai
- **ISO 20022 là bản nén của ISO 8583**: sai, hai chuẩn khác nhau về mô hình và mục tiêu; thông điệp ISO 20022 thường lớn hơn vì mang nhiều thông tin.
- **ISO 8583 dùng XML và end-to-end ID, ISO 20022 dùng bitmap**: ngược lại hoàn toàn.
- **ISO 20022 chỉ dùng cho tiền mã hóa (crypto)**: sai, ISO 20022 được dùng rộng trong chuyển tiền ngân hàng (ví dụ SWIFT, hệ thống thanh toán tức thời), không dành cho crypto.

> Senior tip: Khi tích hợp ISO 20022, hãy lưu bản gốc thông điệp để tra soát và tuân thủ, và chú ý mapping trường (tên người nhận, địa chỉ, mã mục đích) vì mỗi ngân hàng có thể dùng profile khác nhau. Giữ end-to-end ID (UETR) đi kèm mọi yêu cầu để các bên dễ đối soát.`
},
{
  id: 'qz-banking-033',
  topic: 'banking',
  q: 'Khách gọi tổng đài hỗ trợ quên số thẻ, yêu cầu nhân viên đọc lại toàn bộ số thẻ (PAN) và mã CVV để xác thực chủ thẻ trước khi hỗ trợ. Cách xử lý đúng theo PCI DSS là gì?',
  options: [
    'Nhân viên đọc lại toàn bộ PAN và CVV vì khách là chủ thẻ, đây là cách xác thực nhanh nhất',
    'Không đọc lại PAN đầy đủ (chỉ xác nhận 4 số cuối) và tuyệt đối không đọc CVV vì CVV không được lưu và không được xuất lại; xác thực bằng cách khác như OTP, CMND/CCCD, thông tin tài khoản',
    'Đọc PAN đầy đủ nhưng che CVV, vì PAN đã được mã hóa trong cơ sở dữ liệu',
    'Yêu cầu khách gửi ảnh cả mặt trước và mặt sau của thẻ qua email tổng đài'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Không đọc lại PAN đầy đủ (chỉ xác nhận 4 số cuối) và tuyệt đối không đọc CVV; xác thực bằng cách khác như OTP, CMND/CCCD, thông tin tài khoản.**

**Tóm tắt:** PCI DSS cấm lưu dữ liệu xác thực nhạy cảm như CVV/CVC sau khi giao dịch được ủy quyền, và chỉ cho phép hiển thị PAN ở dạng che bớt (masking), ví dụ chỉ 4 số cuối. Nhân viên hỗ trợ không được đọc lại toàn bộ số thẻ và CVV cho khách.

Thuật ngữ:
- **PAN (Primary Account Number)**: số thẻ đầy đủ in trên mặt thẻ.
- **CVV/CVC**: mã xác thực (thường 3 chữ số ở mặt sau thẻ) dùng để chứng minh người dùng đang giữ thực vật thẻ khi thanh toán không gặp mặt.
- **Masking**: che bớt dữ liệu nhạy cảm khi hiển thị, ví dụ chỉ hiện 4 số cuối (**** **** **** 1234).
- **Dữ liệu xác thực nhạy cảm (sensitive authentication data)**: CVV, mã PIN, dữ liệu pát thẻ (magnetic stripe) — không được lưu sau khi ủy quyền, dù đã mã hóa.

### Vì sao đúng
CVV mục đích là chứng minh người mua đang giữ thẻ vật lý. Nếu hệ thống lưu CVV hoặc nhân viên đọc lại CVV cho khách, thì khi hệ thống bị xâm nhập hoặc thông tin bị nghe trộm, kẻ tấn công có đủ thông tin để giao dịch không gặp mặt. PAN đầy đủ cũng chỉ nên hiển thị dạng che bớt để giảm thiệt hại nếu log hoặc màn hình bị lộ.

Xác thực chủ thẻ nên dùng các kênh khác: OTP gửi đến điện thoại đã đăng ký, CMND/CCCD, thông tin tài khoản chỉ chủ nhân biết.

### Vì sao các phương án khác sai
- **Đọc lại toàn bộ PAN và CVV**: vi phạm nghiêm trọng PCI DSS; CVV tuyệt đối không được xuất lại, PAN đầy đủ không được đọc lại ở kênh tổng đài.
- **Đọc PAN đầy đủ nhưng che CVV**: PAN đầy đủ cũng không được đọc lại trong tương tác hỗ trợ; mã hóa trong cơ sở dữ liệu không cho phép hiển thị PAN đầy đủ cho nhân viên tổng đài.
- **Yêu cầu khách gửi ảnh thẻ qua email**: email không phải kênh an toàn để truyền dữ liệu thẻ, và ảnh thẻ chứa PAN đầy đủ plus CVV (mặt sau), rất dễ bị lộ.

> Senior tip: Thiết kế hệ thống để giảm phạm vi PCI DSS: đẩy việc nhập thẻ sang trang thanh toán của cổng (hosted payment page), backend chỉ nhận token. Kiểm tra log, exception và tracing để chắc chắn không vô tình in PAN hoặc CVV.`
},
{
  id: 'qz-banking-034',
  topic: 'banking',
  q: 'Phí chuyển tiền là 0.1% số tiền, tính bằng BigDecimal. Với giao dịch 100.005 VND, phát biểu nào đúng về cách tính và làm tròn phí?',
  options: [
    'Dùng double tính rồi làm tròn ở cuối là chính xác vì sai số nhỏ không quan trọng với số tiền nhỏ',
    'Phí = 100.005 x 0.001 = 0.100005 VND, làm tròn về 2 chữ số thập phân theo HALF_UP là 0.10 VND; phép chia BigDecimal phải chỉ rõ RoundingMode, không thì ném ArithmeticException; trên một triệu giao dịch, sai số 1-2 đồng mỗi lần tích lũy thành chục triệu VND',
    'BigDecimal chia không cần RoundingMode, kết quả tự động và chính xác',
    'Dùng long lưu theo đơn vị xu thì không bao giờ cần làm tròn'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Phí 0.10 VND theo HALF_UP; phép chia BigDecimal phải chỉ rõ RoundingMode; sai số tích lũy lớn trên hàng triệu giao dịch.**

**Tóm tắt:** Tiền phải tính chính xác tuyệt đối. Double là số nhị phân không thể biểu diễn chính xác 0.1, nên sai số tích lũy. BigDecimal lưu số thập phân chính xác, nhưng phép chia có thể cho kết quả thập phân vô hạn, nên phải quy tắc làm tròn (RoundingMode).

Thuật ngữ:
- **BigDecimal**: lớp Java biểu diễn số thập phân với độ chính xác tuyệt đối, gồm phần số nguyên và scale (số chữ số thập phân).
- **RoundingMode.HALF_UP**: làm tròn lên nếu chữ số cuối cùng bị loại là 5 hoặc hơn, ngược lại làm tròn xuống.
- **ArithmeticException**: exception ném khi phép chia BigDecimal cho kết quả thập phân vô hạn mà không chỉ rõ RoundingMode.

### Vì sao đúng
Phí = 100.005 × 0.001 = 0.100005 VND. Làm tròn 2 chữ số thập phân theo HALF_UP: chữ số thứ ba là 0, nên kết quả là 0.10 VND. Phép chia trong BigDecimal (ví dụ chia tỷ giá) phải chỉ rõ RoundingMode; nếu kết quả thập phân vô hạn như 10 chia 3 và không chỉ rõ quy tắc, Java ném ArithmeticException.

Ví dụ sai số tích lũy: nếu mỗi giao dịch bị lệch 1-2 đồng do double, trên một triệu giao dịch thì lệch chục triệu VND, không chấp nhận được trong sổ cái.

### Vì sao các phương án khác sai
- **Dùng double rồi làm tròn ở cuối**: double đã mang sai số từ đầu (0.1 + 0.2 = 0.30000000000000004), làm tròn ở cuối không cứu được sai số đã tích lũy trong quá trình tính toán.
- **BigDecimal chia không cần RoundingMode**: sai, khi kết quả thập phân vô hạn BigDecimal ném ArithmeticException.
- **Dùng long theo đơn vị xu**: long tránh được số thập phân khi lưu, nhưng khi đổi đơn vị (ví dụ từ VND sang xu hoặc ngược lại) vẫn có thể cần làm tròn, và long không tự mang thông tin về đơn vị tiền, dễ nhầm lẫn. BigDecimal vẫn là lựa chọn chuẩn cho nghiệp vụ tài chính.

> Senior tip: Luôn dùng BigDecimal(String) thay vì BigDecimal(double) để không mang sai số của double vào đầu vào. So sánh BigDecimal bằng compareTo, không dùng equals (vì 2.0 và 2.00 không bằng nhau theo equals). Hiển thị phí và số tiền với setScale(2, RoundingMode.HALF_UP).`
},
{
  id: 'qz-banking-035',
  topic: 'banking',
  q: 'Ngân hàng đặt cut-off 15h30. Khách A chuyển tiền vào thứ Sáu 15h29, khách B chuyển vào thứ Sáu 15h31. Thứ Bảy và Chủ Nhật là cuối tuần, thứ Hai là ngày lễ quốc gia. Value date (ngày giá trị) của mỗi giao dịch là ngày nào?',
  options: [
    'Cả hai đều value date thứ Sáu vì giao dịch cùng ngày',
    'A: thứ Sáu (trước cut-off), B: thứ Ba (sau cut-off, trượt qua cuối tuần và ngày lễ thứ Hai)',
    'B: thứ Bảy vì batch EOD chạy vào buổi tối thứ Sáu',
    'Value date luôn là ngày giao dịch cộng một ngày lịch sử, không coi cuối tuần hay ngày lễ'
  ],
  answer: 1,
  explain: `**Đáp án đúng: A có value date thứ Sáu; B có value date thứ Ba (sau cut-off thứ Sáu, trượt qua cuối tuần thứ Bảy-Chủ Nhật và ngày lễ thứ Hai).**

**Tóm tắt:** Cut-off là mốc thời gian trong ngày để phân loại giao dịch vào ngày giá trị nào. Giao dịch trước cut-off ghi vào ngày làm việc hiện tại; giao dịch sau cut-off ghi vào ngày làm việc tiếp theo. Ngày làm việc loại trừ cuối tuần và ngày lễ, nên thứ Ba là ngày làm việc tiếp theo sau thứ Sáu khi thứ Hai là ngày lễ.

Thuật ngữ:
- **Cut-off (giờ cắt)**: mốc kỹ thuật trong ngày; giao dịch nhận trước cut-off thuộc ngày làm việc hiện tại, sau cut-off thuộc ngày làm việc tiếp theo.
- **Value date (ngày giá trị)**: ngày chính thức giao dịch được ghi vào sổ cái và bắt đầu tính lãi / hạn mức.
- **Ngày làm việc (business day)**: ngày trong tuần trừ cuối tuần và ngày lễ quốc gia, khác với ngày lịch sử (calendar day) tính 365 ngày một năm.

### Vì sao đúng
- Khách A 15h29 thứ Sáu: trước cut-off 15h30 → value date là thứ Sáu, batch EOD thứ Sáu tổng kết giao dịch này.
- Khách B 15h31 thứ Sáu: sau cut-off → ghi vào ngày làm việc tiếp theo. Ngày làm việc tiếp theo sau thứ Sáu là thứ Hai (bỏ qua thứ Bảy, Chủ Nhật), nhưng thứ Hai là ngày lễ → tiếp tục là thứ Ba. Value date của B là thứ Ba.

### Vì sao các phương án khác sai
- **Cả hai đều thứ Sáu**: sai, B sau cut-off nên không thuộc ngày thứ Sáu.
- **B: thứ Bảy vì batch EOD tối thứ Sáu**: batch EOD chỉ xử lý giao dịch thuộc ngày làm việc hiện tại; giao dịch sau cut-off của B chưa thuộc ngày thứ Sáu, EOD không thấy nó.
- **Value date luôn +1 ngày lịch sử**: sai vì ngày làm việc loại trừ cuối tuần và ngày lễ; tính theo ngày lịch sử sẽ ghi lãi sai và giao dịch bị trễ.

> Senior tip: Dev phải dùng một BusinessDayService dùng chung cho toàn hệ thống, không được tính ngày tùy tiện ở từng màn hình. Cut-off và ngày làm việc khác nhau giữa sản phẩm (tiết kiệm, vay, thẻ) — hỏi rõ specification trước khi code.`
},
{
  id: 'qz-banking-036',
  topic: 'banking',
  multi: true,
  q: 'Thiết kế API chuyển tiền để chống yêu cầu trùng do client retry. Thực hành nào đúng về idempotency key? (Chọn 2)',
  options: [
    'Cùng một ý định giao dịch (ví dụ "chuyển 200.000 cho B") dù gửi lại bao nhiêu lần cũng phải dùng cùng một idempotency key',
    'Hai giao dịch khác nhau (chuyển cho A và chuyển cho B) có thể dùng cùng key nếu số tiền khác nhau',
    'Kiểm tra key đã tồn tại và lưu key + kết quả trong cùng một transaction DB với bút toán nghiệp vụ',
    'Dùng timestamp của client làm idempotency key vì mỗi lần gửi thì thời gian khác nhau'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: Cùng ý định giao dịch phải dùng cùng key · Kiểm tra và lưu key + kết quả trong cùng transaction DB với bút toán.**

**Tóm tắt:** Idempotency key đại diện cho ý định nghiệp vụ, không phải cho mỗi lần gửi HTTP. Cùng ý định (có thể retry) dùng cùng key; ý định khác phải dùng key khác. Kiểm tra và lưu key phải nguyên tử, nằm trong cùng transaction với bút toán để tránh race condition.

Thuật ngữ:
- **Ý định giao dịch**: hành động người dùng muốn thực hiện (ví dụ "chuyển 200.000 cho B"). Dù gửi lại nhiều lần do retry, đó vẫn là cùng một ý định.
- **Transaction DB**: nhóm các thao tác cơ sở dữ liệu thành một đơn vị, hoặc tất cả thành công hoặc tất cả rollback.

### Vì sao đúng
- Cùng ý định dùng cùng key: server nhận thấy key đã xử lý thì trả lại kết quả cũ, client retry an toàn không bị trừ tiền hai lần.
- Lưu key + kết quả trong cùng transaction: tránh trường hợp hai request cùng đọc "chưa có key" rồi cùng thực hiện bút toán (race condition). Transaction đảm bảo chỉ một request thắng.

### Vì sao các phương án khác sai
- **Hai giao dịch khác nhau dùng cùng key nếu số tiền khác nhau**: sai, key định danh ý định, không định danh số tiền. Hai giao dịch khác nhau dùng cùng key sẽ làm server coi chúng là một và từ chối xử lý giao dịch thứ hai.
- **Dùng timestamp client làm key**: đồng hồ client không đáng tin cậy (có thể lệch, chỉnh giờ) và không thể dùng làm định danh ý định nghiệp vụ.

> Senior tip: Đặt TTL cho key (ví dụ 24-72 giờ) để bảng không tăng vô hạn, nhưng TTL phải dài hơn cửa sổ retry của client và đối tác. Khi gặp unique constraint do request trùng, hãy đọc lại kết quả đã lưu và trả về phản hồi thành công tương ứng thay vì báo lỗi 500.`
},
{
  id: 'qz-banking-037',
  topic: 'banking',
  multi: true,
  q: 'Giảm phạm vi hệ thống phải tuân thủ PCI DSS (PCI scope) khi nhận thanh toán thẻ. Hành động nào đúng? (Chọn 2)',
  options: [
    'Dùng trang thanh toán của cổng thanh toán (hosted payment page) hoặc SDK, khách nhập thẻ trên trang cổng; hệ thống của bạn chỉ nhận token giao dịch thay vì PAN/CVV',
    'Lưu PAN đã mã hóa AES trong cơ sở dữ liệu của mình thì hệ thống tự động thoát khỏi PCI DSS scope',
    'Tokenization thay PAN thật bằng mã đại diện không có giá trị nếu bị lộ, giúp giảm dữ liệu nhạy cảm hệ thống của bạn phải giữ',
    'Ghi toàn bộ request/response kèm PAN vào log DEBUG để lập trình viên dễ debug lỗi thanh toán'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: Dùng hosted payment page/SDK, backend chỉ nhận token · Tokenization thay PAN thật bằng mã đại diện giúp giảm dữ liệu nhạy cảm hệ thống phải giữ.**

**Tóm tắt:** PCI DSS áp dụng cho mọi hệ thống lưu trữ, xử lý hoặc truyền dữ liệu thẻ. Cách giảm phạm vi hiệu quả nhất là không để PAN/CVV đi qua hệ thống của bạn: dùng trang thanh toán của cổng hoặc tokenization, backend chỉ làm việc với token.

Thuật ngữ:
- **PCI DSS (Payment Card Industry Data Security Standard)**: tiêu chuẩn bảo mật cho hệ thống lưu trữ, xử lý hoặc truyền dữ liệu thẻ thanh toán.
- **Hosted payment page**: trang thu thẻ do cổng thanh toán cung cấp, khách nhập thẻ trên hạ tầng của cổng, không qua hệ thống của bạn.
- **Token**: mã đại diện thay cho dữ liệu thẻ thật, dùng để tham chiếu giao dịch mà không lộ PAN.
- **Tokenization**: thay PAN thật bằng mã đại diện; hệ thống an toàn riêng ánh xạ token về PAN khi cần.

### Vì sao đúng
- Hosted payment page/SDK: PAN/CVV không đi qua backend của bạn, nên hệ thống của bạn không tiếp xúc dữ liệu nhạy cảm → phạm vi tuân thủ nhỏ hơn, chi phí kiểm tra bảo mật thấp hơn.
- Tokenization: thay PAN thật bằng mã đại diện không có giá trị nếu bị lộ; nếu token bị đánh cắp, kẻ tấn công không thể dùng để giao dịch mà không có hệ thống ánh xạ riêng.

### Vì sao các phương án khác sai
- **Lưu PAN mã hóa AES thì thoát khỏi PCI DSS**: sai. Mã hóa PAN vẫn nằm trong PCI DSS scope; bạn vẫn phải mã hóa khóa, kiểm soát truy cập, giám sát và kiểm tra định kỳ. Mã hóa giảm rủi ro, không loại bỏ hoàn toàn sự tuân thủ.
- **Ghi toàn bộ request/response kèm PAN vào log DEBUG**: sai, rất dễ rò rỉ PAN. Luôn redact (loại bỏ) trường nhạy cảm trước khi ghi log.

> Senior tip: Rà soát toàn bộ chuỗi: log ứng dụng, APM/tracing, message queue, error tracker và bản sao lưu. Nhiều sự cố lộ thẻ đến từ hệ thống quan sát (observability) hoặc dump lỗi, không chỉ từ cơ sở dữ liệu chính.`
}
,
{ id: 'qz-design-091', topic: 'design', q: 'Hệ thống có 10.000 người dùng đồng thời, mỗi người gửi 1 request/giây. Ước lượng QPS và dung lượng lưu trữ log trong 1 ngày nếu mỗi request log 2 bytes?', options: ['QPS = 10.000, log = 1,7 GB/ngày', 'QPS = 1.000, log = 170 MB/ngày', 'QPS = 100.000, log = 17 GB/ngày', 'QPS = 10.000, log = 170 GB/ngày'], answer: 0, explain: `**Tóm tắt:** QPS = số người dùng đồng thời × request/người/giây = 10.000; log/ngày = 10.000 × 2 bytes × 86.400 giây ≈ 1,7 GB.

### Vì sao đúng
- QPS (Queries Per Second): 10.000 × 1 = 10.000.
- Log/ngày: 10.000 req/s × 2 bytes = 20 KB/s; × 86.400 s = 1.728.000 KB ≈ 1,7 GB.

### Vì sao các phương án khác sai
- **QPS = 1.000**: quên hệ số 10; thường do nhầm 10.000 người dùng thành 1.000.
- **QPS = 100.000**: nhân thêm 10 lần, nhầm mỗi người gửi 10 request/giây.
- **Log = 170 GB**: sai đơn vị, tính 2 bytes thành 200 bytes hoặc nhân thêm 100.

> Senior tip: Luôn ghi rõ giả định (DAU, peak factor, payload size) trước khi tính; phỏng vấn đánh giá quá trình hơn kết quả.` },
{ id: 'qz-design-092', topic: 'design', multi: true, q: 'Cache-aside (lazy loading) phù hợp khi nào? (Chọn 2)', options: ['Dữ liệu đọc nhiều, ít thay đổi', 'Dữ liệu cần nhất quán nghiêm ngặt tức thời', 'Cache warm-up không cần thiết', 'Dữ liệu ghi nhiều, cần đồng bộ cache ngay'], answer: [0, 2], explain: `**Tóm tắt:** Cache-aside đọc từ cache, miss thì đọc DB rồi ghi cache; phù hợp dữ liệu đọc nhiều và chấp nhận cache miss đầu tiên.

### Vì sao đúng
- **Dữ liệu đọc nhiều, ít thay đổi**: cache hit cao, giảm tải DB.
- **Cache warm-up không cần thiết**: cache tự đầy dần theo truy cập (lazy).

### Vì sao các phương án khác sai
- **Dữ liệu cần nhất quán nghiêm ngặt tức thời**: cache-aside có thể stale; cần invalidation phức tạp.
- **Dữ liệu ghi nhiều, cần đồng bộ cache ngay**: nên dùng write-through/write-behind thay vì cache-aside.

> Senior tip: Cache-aside đơn giản nhưng dễ stale; luôn có TTL và chiến lược invalidation rõ ràng.` },
{ id: 'qz-design-093', topic: 'design', q: 'Consistent hashing giải quyết vấn đề gì khi thêm/bớt node cache?', options: ['Phân phối đều key theo hash modulo N', 'Chỉ remap một phần nhỏ key khi topology thay đổi', 'Đảm bảo không có key nào bị mất', 'Tăng tốc độ hash function'], answer: 1, explain: `**Tóm tắt:** Consistent hashing đặt node trên vòng tròn hash; khi thêm/bớt node chỉ remap các key thuộc cung lân cận, không phải toàn bộ.

### Vì sao đúng
- Mỗi node quản lý một cung trên vòng; thay đổi node chỉ ảnh hưởng key trong cung đó → remap tối thiểu, cache hit rate ổn định.

### Vì sao các phương án khác sai
- **Phân phối đều key theo hash modulo N**: đó là hash modulo truyền thống, thêm node làm remap gần như toàn bộ.
- **Đảm bảo không có key nào bị mất**: consistent hashing không đảm bảo không mất; cần replication.
- **Tăng tốc độ hash function**: không liên quan; hash function vẫn như cũ.

> Senior tip: Dùng virtual node để cân bằng tải khi node có công suất khác nhau.` },
{ id: 'qz-design-094', topic: 'design', q: 'Sharding theo key (range sharding) có rủi ro gì phổ biến?', options: ['Hot spot khi key phân bố lệch', 'Không thể join giữa shard', 'Tốn bộ nhớ metadata', 'Không hỗ trợ transaction'], answer: 0, explain: `**Tóm tắt:** Range sharding chia key theo khoảng; nếu dữ liệu phân bố lệch (hot key) một shard bị quá tải.

### Vì sao đúng
- Hot spot: ví dụ user id tăng dần hoặc celebrity account tập trung traffic vào một shard.

### Vì sao các phương án khác sai
- **Không thể join giữa shard**: đúng là khó nhưng không phải rủi ro phổ biến nhất của range sharding.
- **Tốn bộ nhớ metadata**: không phải vấn đề chính.
- **Không hỗ trợ transaction**: một số DB hỗ trợ distributed transaction.

> Senior tip: Hash sharding giảm hot spot nhưng làm range query khó; chọn theo pattern truy vấn.` },
{ id: 'qz-design-095', topic: 'design', q: 'Replication đồng bộ (synchronous) so với bất đồng bộ (asynchronous) khác nhau chiefly ở?', options: ['Độ trễ ghi và đảm bảo nhất quán', 'Kích thước dữ liệu', 'Số lượng replica', 'Giao thức mạng'], answer: 0, explain: `**Tóm tắt:** Sync chờ replica xác nhận trước khi trả về client (chậm hơn nhưng nhất quán); async trả về ngay (nhanh hơn nhưng có thể mất dữ liệu nếu primary chết).

### Vì sao đúng
- Sync: độ trễ ghi cao hơn, RPO ≈ 0. Async: độ trễ thấp, RPO > 0.

### Vì sao các phương án khác sai
- **Kích thước dữ liệu**: không phải yếu tố phân biệt.
- **Số lượng replica**: cả hai đều có thể nhiều replica.
- **Giao thức mạng**: cả hai đều dùng TCP.

> Senior tip: Production thường dùng semi-sync để cân bằng giữa độ trễ và an toàn.` },
{ id: 'qz-design-096', topic: 'design', multi: true, q: 'Trong CAP theorem, khi partition xảy ra, hệ thống phải chọn? (Chọn 2)', options: ['Nhất quán (Consistency)', 'Khả dụng (Availability)', 'Phân vùng (Partition tolerance) - bắt buộc', 'Hiệu năng (Performance)'], answer: [0, 1], explain: `**Tóm tắt:** Partition tolerance là bắt buộc trong hệ thống phân tán; khi partition xảy ra phải chọn giữa Consistency và Availability.

### Vì sao đúng
- **Nhất quán**: trả về dữ liệu mới nhất hoặc lỗi.
- **Khả dụng**: luôn trả về, có thể stale.

### Vì sao các phương án khác sai
- **Phân vùng - bắt buộc**: partition tolerance không phải lựa chọn, nó là điều kiện.
- **Hiệu năng**: không phải phần của CAP.

> Senior tip: PACELC bổ sung: khi không partition, trade-off giữa latency và consistency.` },
{ id: 'qz-design-097', topic: 'design', q: 'Idempotency trong API thanh toán đạt được bằng cách nào?', options: ['Dùng idempotency key do client gửi, server lưu kết quả theo key', 'Dùng transaction ACID', 'Dùng retry với exponential backoff', 'Dùng distributed lock'], answer: 0, explain: `**Tóm tắt:** Client gửi idempotency key; server thực hiện một lần và lưu kết quả; request lặp lại trả về kết quả cũ.

### Vì sao đúng
- Idempotency key đảm bảo retry không tạo duplicate charge.

### Vì sao các phương án khác sai
- **Transaction ACID**: đảm bảo atomicity nhưng không ngăn duplicate request.
- **Retry với exponential backoff**: retry không idempotent sẽ duplicate.
- **Distributed lock**: có thể ngăn race nhưng không lưu kết quả để trả lại.

> Senior tip: Lưu key + response hash với TTL; xử lý concurrent request cùng key bằng lock.` },
{ id: 'qz-design-098', topic: 'design', q: 'Queue (message queue) khác stream (event log) chủ yếu ở?', options: ['Queue xoá message sau khi consume; stream giữ log và cho replay', 'Queue nhanh hơn stream', 'Stream không hỗ trợ consumer group', 'Queue chỉ dùng cho sync'], answer: 0, explain: `**Tóm tắt:** Queue (RabbitMQ) xoá message sau acknowledge; stream (Kafka) giữ log bất biến cho replay và nhiều consumer group.

### Vì sao đúng
- Stream giữ offset, cho replay và xử lý lại; queue truyền thống xoá sau consume.

### Vì sao các phương án khác sai
- **Queue nhanh hơn stream**: không đúng tuyệt đối; phụ thuộc use case.
- **Stream không hỗ trợ consumer group**: Kafka có consumer group.
- **Queue chỉ dùng cho sync**: queue thường dùng async.

> Senior tip: Chọn queue cho task work; stream cho event sourcing và analytics.` },
{ id: 'qz-design-099', topic: 'design', q: 'CDN giúp giảm latency chủ yếu bằng cách nào?', options: ['Cache nội dung tĩnh tại edge gần người dùng', 'Tăng băng thông server gốc', 'Nén dữ liệu', 'Mã hóa TLS'], answer: 0, explain: `**Tóm tắt:** CDN đặt bản sao nội dung tĩnh tại các điểm edge gần người dùng, giảm RTT.

### Vì sao đúng
- Edge cache giảm khoảng cách vật lý, giảm latency và tải origin.

### Vì sao các phương án khác sai
- **Tăng băng thông server gốc**: không phải cơ chế chính.
- **Nén dữ liệu**: có thể nhưng không phải cốt lõi của CDN.
- **Mã hóa TLS**: bảo mật, không giảm latency.

> Senior tip: Cache-control headers và invalidation chiến lược quyết định hiệu quả CDN.` },
{ id: 'qz-design-100', topic: 'design', multi: true, q: 'Hot key problem trong cache/DB thường xử lý bằng? (Chọn 2)', options: ['Local cache + TTL ngắn', 'Shard key theo hash của key', 'Replicate hot key trên nhiều node', 'Tăng TTL lên rất lớn'], answer: [0, 2], explain: `**Tóm tắt:** Hot key tập trung traffic; xử lý bằng local cache và replicate hot key trên nhiều node.

### Vì sao đúng
- **Local cache + TTL ngắn**: giảm tải remote cache/DB.
- **Replicate hot key trên nhiều node**: phân tán tải.

### Vì sao các phương án khác sai
- **Shard key theo hash của key**: không giải quyết hot key vì cùng key hash về cùng shard.
- **Tăng TTL lên rất lớn**: có thể stale, không phân tán tải.

> Senior tip: Phát hiện hot key bằng metrics và tự động replicate.` }, { id: 'qz-banking-038', topic: 'banking', q: 'Trong hệ thống ledger ngân hàng, một giao dịch chuyển tiền bắt buộc phải ghi bao nhiêu bút toán để đảm bảo nguyên tắc double-entry?', options: ['1 bút toán ghi nợ tài khoản nguồn', '2 bút toán: ghi nợ nguồn và ghi có đích', '3 bút toán: nợ nguồn, có đích và phí', '4 bút toán: nợ nguồn, có đích, phí và thuế'], answer: 1, explain: `**Tóm tắt:** Double-entry ledger yêu cầu mỗi giao dịch có ít nhất 2 bút toán cân bằng: ghi nợ (debit) tài khoản nguồn và ghi có (credit) tài khoản đích, tổng nợ = tổng có.

### Vì sao đúng
- **2 bút toán: ghi nợ nguồn và ghi có đích**: nguyên tắc cân bằng kế toán, tổng debit = total credit.

### Vì sao các phương án khác sai
- **1 bút toán ghi nợ tài khoản nguồn**: mất cân bằng.
- **3/4 bút toán**: phí và thuế chỉ là bút toán bổ sung nếu có.

> Senior tip: Luôn kiểm tra invariant tổng debit = total credit trước khi commit.` },
{ id: 'qz-banking-039', topic: 'banking', multi: true, q: 'Idempotency trong API chuyển tiền đạt được bằng cách nào? (Chọn 2)', options: ['Client gửi Idempotency-Key unique cho mỗi request logic', 'Server lưu key đã xử lý và trả lại kết quả cũ nếu key trùng', 'Retry request với key mới mỗi lần', 'Dùng timestamp làm key'], answer: [0, 1], explain: `**Tóm tắt:** Idempotency đảm bảo retry không tạo duplicate giao dịch: client gửi key unique, server lưu và trả kết quả cũ nếu key đã xử lý.

### Vì sao đúng
- **Client gửi Idempotency-Key unique cho mỗi request logic**: mỗi nghiệp vụ chuyển tiền có một key duy nhất.
- **Server lưu key đã xử lý và trả lại kết quả cũ nếu key trùng**: tránh tạo giao dịch trùng khi retry.

### Vì sao các phương án khác sai
- **Retry với key mới mỗi lần**: phá idempotency, có thể tạo duplicate.
- **Dùng timestamp làm key**: không unique khi retry nhanh; dễ collision.

> Senior tip: Lưu idempotency key với TTL và trạng thái processing/completed; xử lý concurrent cùng key bằng lock hoặc unique constraint.` },
{ id: 'qz-banking-040', topic: 'banking', q: 'Đối soát (reconciliation) giữa ledger nội bộ và sao kê ngân hàng thường chạy khi nào và mục đích chính?', options: ['Chạy real-time mỗi giây để chặn giao dịch', 'Chạy theo batch cuối ngày/cut-off để phát hiện chênh lệch và điều chỉnh', 'Chạy khi user báo lỗi', 'Chạy khi deploy hệ thống'], answer: 1, explain: `**Tóm tắt:** Reconciliation thường chạy batch định kỳ (cuối ngày/cut-off) để so khớp ledger nội bộ với sao kê ngân hàng, phát hiện chênh lệch và điều chỉnh.

### Vì sao đúng
- **Chạy theo batch cuối ngày/cut-off để phát hiện chênh lệch và điều chỉnh**: phù hợp với chu kỳ sao kê ngân hàng.

### Vì sao các phương án khác sai
- **Real-time mỗi giây để chặn giao dịch**: reconciliation không chặn giao dịch.
- **Khi user báo lỗi**: quá muộn.
- **Khi deploy**: không liên quan.

> Senior tip: Theo dõi unmatched items aging; alert nếu item chưa match quá SLA.` },
{ id: 'qz-banking-041', topic: 'banking', q: 'Giao dịch treo (pending/hold) trên tài khoản thường được xử lý thế nào?', options: ['Luôn trừ tiền vĩnh viễn ngay lập tức', 'Tạo hold tạm thời, giải phóng nếu không settle trong thời gian quy định', 'Bỏ qua không ghi ledger', 'Chỉ ghi log, không ảnh hưởng số dư'], answer: 1, explain: `**Tóm tắt:** Pending/hold tạo reservation tạm thời trên available balance; nếu không settle trong thời gian quy định thì giải phóng hold.

### Vì sao đúng
- **Tạo hold tạm thời, giải phóng nếu không settle trong thời gian quy định**: bảo vệ tiền khách nhưng không finalize.

### Vì sao các phương án khác sai
- **Trừ tiền vĩnh viễn ngay lập tức**: sai vì giao dịch có thể bị huỷ.
- **Bỏ qua không ghi ledger**: mất traceability.
- **Chỉ ghi log**: không bảo vệ số dư.

> Senior tip: Phân biệt available balance vs ledger balance; hold expiry job phải idempotent.` },
{ id: 'qz-banking-042', topic: 'banking', q: 'ISO 8583 và ISO 20022 khác nhau cơ bản ở điểm nào?', options: ['ISO 8583 là XML phong phú, ISO 20022 là binary compat', 'ISO 8583 là định dạng message card payment truyền thống (binary/field-based), ISO 20022 là chuẩn XML/JSON phong phú dùng cho payments hiện đại', 'Cả hai đều giống nhau, chỉ khác version', 'ISO 20022 chỉ dùng cho crypto'], answer: 1, explain: `**Tóm tắt:** ISO 8583 là chuẩn message cho card payment truyền thống (field-based/binary); ISO 20022 là chuẩn dữ liệu phong phú (XML/JSON) cho payments hiện đại.

### Vì sao đúng
- **ISO 8583 field-based/binary, ISO 20022 XML/JSON phong phú**: mô tả đúng bản chất.

### Vì sao các phương án khác sai
- **ISO 8583 là XML phong phú**: đảo ngược.
- **Giống nhau**: sai.
- **ISO 20022 chỉ crypto**: sai.

> Senior tip: Migration ISO 20022 cần mapping field và xử lý data truncation; test interoperability.` },
{ id: 'qz-banking-043', topic: 'banking', q: 'Theo PCI DSS, dữ liệu thẻ nào KHÔNG được lưu trữ sau khi giao dịch hoàn tất?', options: ['PAN (masked)', 'CVV/CVC (sensitive authentication data)', 'Ngày hết hạn', 'Tên chủ thẻ'], answer: 1, explain: `**Tóm tắt:** PCI DSS cấm lưu trữ sensitive authentication data như CVV/CVC sau khi authorization; PAN phải được mask/truncate.

### Vì sao đúng
- **CVV/CVC (sensitive authentication data)**: không được lưu sau authorization, dù mã hóa.

### Vì sao các phương án khác sai
- **PAN (masked)**: có thể lưu nếu masked/truncated và bảo vệ.
- **Ngày hết hạn**: có thể lưu nếu cần.
- **Tên chủ thẻ**: có thể lưu.

> Senior tip: Rà soát log, backup, analytics để đảm bảo không lưu CVV ở bất kỳ đâu.` },
{ id: 'qz-banking-044', topic: 'banking', q: 'Khi tính toán tiền tệ trong Java, nên dùng kiểu dữ liệu nào để tránh lỗi làm tròn?', options: ['float/double', 'int (đơn vị cents)', 'BigDecimal với scale và rounding mode rõ ràng', 'String'], answer: 2, explain: `**Tóm tắt:** BigDecimal với scale và rounding mode rõ ràng là cách an toàn để tính tiền; float/double có lỗi biểu diễn nhị phân.

### Vì sao đúng
- **BigDecimal với scale và rounding mode rõ ràng**: chính xác, kiểm soát làm tròn.

### Vì sao các phương án khác sai
- **float/double**: lỗi biểu diễn nhị phân (0.1+0.2).
- **int cents**: có thể dùng nhưng dễ overflow.
- **String**: không tính toán được.

> Senior tip: Dùng BigDecimal và đặt scale/rounding mode thống nhất.` },
{ id: 'qz-banking-045', topic: 'banking', q: 'Giờ cut-off trong xử lý thanh toán batch có ý nghĩa gì?', options: ['Thời điểm hệ thống restart', 'Mốc thời gian: giao dịch sau cut-off được xử lý ở batch tiếp theo', 'Thời gian timeout của API', 'Giờ bảo trì hệ thống'], answer: 1, explain: `**Tóm tắt:** Cut-off là mốc thời gian: giao dịch sau cut-off được xử lý ở batch/chu kỳ tiếp theo, ảnh hưởng settlement date.

### Vì sao đúng
- **Mốc thời gian: giao dịch sau cut-off được xử lý ở batch tiếp theo**: đúng định nghĩa cut-off.

### Vì sao các phương án khác sai
- **Restart/timeout/bảo trì**: không liên quan.

> Senior tip: Hiển thị cut-off rõ cho user và cảnh báo khi gần cut-off.` },
{ id: 'qz-banking-046', topic: 'banking', multi: true, q: 'Khi retry giao dịch thanh toán thất bại, cần đảm bảo những điều gì? (Chọn 2)', options: ['Sử dụng idempotency key để tránh duplicate', 'Retry với backoff và jitter', 'Retry ngay lập tức không giới hạn', 'Bỏ qua lỗi và trả success'], answer: [0, 1], explain: `**Tóm tắt:** Retry an toàn cần idempotency key và backoff+jitter để tránh duplicate và thundering herd.

### Vì sao đúng
- **Idempotency key**: tránh duplicate giao dịch.
- **Backoff + jitter**: giảm tải và tránh đồng thời.

### Vì sao các phương án khác sai
- **Retry ngay không giới hạn**: gây quá tải và duplicate.
- **Bỏ qua lỗi trả success**: mất tiền/dữ liệu.

> Senior tip: Có max retry và dead-letter queue cho giao dịch không settle.` },
{ id: 'qz-banking-047', topic: 'banking', q: 'Ledger append-only (chỉ thêm, không sửa/xoá) mang lại lợi ích chính nào?', options: ['Giảm dung lượng lưu trữ', 'Audit trail đầy đủ và khả năng reconstruct trạng thái tại mọi thời điểm', 'Tăng tốc độ ghi', 'Đơn giản hoá schema'], answer: 1, explain: `**Tóm tắt:** Append-only ledger giữ mọi bút toán, cho phép audit đầy đủ và reconstruct balance tại bất kỳ thời điểm nào.

### Vì sao đúng
- **Audit trail đầy đủ và reconstruct trạng thái tại mọi thời điểm**: cốt lõi append-only.

### Vì sao các phương án khác sai
- **Giảm dung lượng**: sai, tăng dung lượng.
- **Tăng tốc ghi**: không phải chính.
- **Đơn giản schema**: không chính.

> Senior tip: Dùng event sourcing pattern; snapshot định kỳ để query nhanh.` },
  // ===================== scenario (new round) =====================
  {
    id: 'qz-scenario-031',
    topic: 'scenario',
    q: 'Service dùng Spring Boot 3.2+ với virtual thread ({{spring.threads.virtual.enabled=true}}). Dưới tải cao, request bị treo, CPU thấp, thread dump cho thấy hàng trăm virtual thread ở trạng thái RUNNABLE nhưng carrier thread (ForkJoinPool) đều bận trong lời gọi HTTP blocking tới đối tác bên trong khối {{synchronized}}. Bước xử lý đúng đầu tiên?',
    options: [
      'Tăng -Xmx để giảm GC pressure',
      'Thay {{synchronized}} bằng {{ReentrantLock}} quanh I/O, giới hạn concurrency bằng Semaphore, dùng JFR event {{jdk.VirtualThreadPinned}} để xác nhận pinning',
      'Tắt virtual thread, quay lại platform thread',
      'Tăng số carrier thread bằng {{-Djdk.virtualThreadScheduler.parallelism}}'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Thay synchronized bằng ReentrantLock quanh I/O, giới hạn concurrency bằng Semaphore, dùng JFR event jdk.VirtualThreadPinned để xác nhận pinning.**

### Vì sao đúng
- Trên Java 21–23, virtual thread block khi đang giữ monitor ({{synchronized}}) sẽ **ghim (pin)** carrier thread. Carrier thread mặc định bằng số core CPU. Vài chục lời gọi HTTP chậm trong synchronized là chiếm hết carrier → hàng nghìn virtual thread khác không được schedule → service treo mà CPU thấp.
- {{ReentrantLock}} cho phép virtual thread unmount khi chờ lock, không pin carrier. Giới hạn concurrency tới đối tác ({{Semaphore}}) tránh dồn tải khiến đối tác cũng sập.
- JFR event {{jdk.VirtualThreadPinned}} ghi lại stack trace tại điểm pin, giúp tìm chính xác khối synchronized gây vấn đề.
- JDK 24 (JEP 491) đã cho phép unmount trong synchronized, nhưng hiện tại production nhiều nơi vẫn dùng Java 21 LTS.

### Vì sao các phương án khác sai
- **Tăng -Xmx**: không liên quan, vấn đề là scheduling chứ không phải heap.
- **Tắt virtual thread**: lãng phí throughput cao của virtual thread; chỉ cần sửa pinning là chạy tốt.
- **Tăng carrier thread**: chỉ trì hoãn vấn đề; pinning vẫn xảy ra và carrier thread tiêu tốn memory/stack.

> Senior tip: virtual thread làm mất "giới hạn tự nhiên" của thread pool cũ. Luôn đặt giới hạn rõ ràng cho tài nguyên phía sau: connection pool DB, Semaphore cho đối tác; nếu không, 10.000 request đồng thời sẽ dồn hết vào hệ thống phía sau.`
  },
  {
    id: 'qz-scenario-032',
    topic: 'scenario',
    multi: true,
    q: 'Dưới tải cao, PostgreSQL báo lỗi {{deadlock detected}} liên tục trên bảng {{orders}} khi cập nhật trạng thái đơn hàng. Hai session cùng cập nhật {{order_items}} và {{orders}} nhưng theo thứ tự ngược nhau. Chọn 2 biện pháp đúng để khắc phục (Chọn 2).',
    options: [
      'Đảm bảo mọi transaction cập nhật các bảng theo **cùng một thứ tự cố định** (ví dụ: orders trước, order_items sau) ở mọi nơi trong codebase',
      'Tăng {{deadlock_timeout}} lên 10 giây để transaction có thời gian retry tự động',
      'Dùng {{SELECT ... FOR UPDATE NOWAIT}} trên bảng cha (orders) ở đầu transaction để lấy lock theo thứ tự nhất quán trước khi chạm bảng con',
      'Bỏ qua lỗi deadlock và cho application retry vô hạn',
      'Chuyển isolation level sang READ UNCOMMITTED'
    ],
    answer: [0, 2],
    explain: `**Đáp án đúng: Đảm bảo thứ tự cập nhật bảng cố định · Dùng SELECT FOR UPDATE NOWAIT trên bảng cha để lấy lock trước.**

### Vì sao đúng
- Deadlock kinh điển xảy ra khi session A lock orders rồi muốn lock order_items, session B lock order_items rồi muốn lock orders. **Quy tắc vàng**: mọi transaction phải lock tài nguyên theo **cùng một thứ tự toàn cục** (thường là theo thứ tự phân cấp: bảng cha trước, bảng con sau).
- {{SELECT ... FOR UPDATE NOWAIT}} ở đầu transaction trên bảng cha ({{orders}}) lấy lock hàng mục tiêu ngay lập tức; nếu không lấy được thì fail ngay (không chờ), tránh tình trạng "nắm một tay, chờ tay kia". Kết hợp với thứ tự cố định loại bỏ deadlock triệt để.

### Vì sao các phương án khác sai
- **Tăng deadlock_timeout**: chỉ làm transaction chờ lâu hơn trước khi bị chọn làm victim; không giải quyết vòng tròn lock.
- **Retry vô hạn**: application có thể retry mãi không xong nếu deadlock liên tục; cần sửa nguyên nhân là thứ tự lock.
- **READ UNCOMMITTED**: PostgreSQL không hỗ trợ isolation level này (chỉ có READ COMMITTED, REPEATABLE READ, SERIALIZABLE); và đọc dirty không giải quyết write-write conflict.

> Senior tip: đặt convention "luôn lock bảng cha trước" vào coding standard và review. Có thể viết test tích hợp mô phỏng 2 session cập nhật ngược thứ tự để verify fix.`
  },
  {
    id: 'qz-scenario-033',
    topic: 'scenario',
    q: 'Service Java 21 dùng G1GC. p99 latency bình thường ~50 ms nhưng **mỗi 5–10 phút có đợt spike lên 3–5 giây**, cùng lúc GC log cho thấy Full GC (hoặc G1 long pause) kéo dài 2–4 giây. Heap usage sau GC vẫn cao (~80% heap). Metric {{jvm.gc.pause}} p99 tăng mạnh. Nguyên nhân khả dĩ nhất?',
    options: [
      'Heap quá nhỏ, cần tăng -Xmx',
      'Allocation rate cao gây young GC quá nhiều, object promote sớm sang old gen, old gen đầy và trigger Full GC; cần tuning G1 ({{-XX:G1HeapRegionSize}}, {{-XX:InitiatingHeapOccupancyPercent}}, {{-XX:MaxGCPauseMillis}}) hoặc chuyển ZGC',
      'Database chậm làm request chờ',
      'Memory leak, object không bị thu hồi'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Allocation rate cao gây promote sớm, old gen đầy, trigger Full GC; cần tuning G1 hoặc chuyển ZGC.**

### Vì sao đúng
- G1GC chia heap thành các region. Nếu **allocation rate** (tốc độ cấp phát object) cao, young generation đầy nhanh, object bị promote sang old gen sớm trước khi chết (premature promotion). Old gen dần đầy → G1 trigger **mixed GC** rồi **Full GC** (stop-the-world) để dọn old gen. Full GC G1 là single-threaded, chậm, gây spike latency lớn.
- Heap sau GC vẫn ~80% là dấu hiệu **old gen chứa nhiều object sống lâu** (caching, session, lazy-loaded data) chứ không phải leak đơn thuần. Leak thì heap tăng đơn điệu không bao giờ giảm sau Full GC.
- Giải pháp: giảm allocation rate (object pooling, tránh tạo object rác trong hot path), tuning G1: tăng {{-XX:G1HeapRegionSize}} (1–32 MB), hạ {{-XX:InitiatingHeapOccupancyPercent}} (mặc định 45%) để mixed GC sớm hơn, đặt {{-XX:MaxGCPauseMillis}} thực tế (100–200 ms). Hoặc chuyển **ZGC** (JDK 21+) cho pause < 1 ms ở heap lớn, trade-off là CPU overhead cao hơn một chút.

### Vì sao các phương án khác sai
- **Heap quá nhỏ**: nếu heap nhỏ thì OOM sớm, không phải spike định kỳ.
- **Database chậm**: sẽ thấy DB wait time trong trace, không trùng với GC pause.
- **Memory leak**: heap sau Full GC sẽ không giảm; ở đây heap giảm sau Full GC (từ ~95% xuống ~80%) nên là promotion pressure.

> Senior tip: bật {{-Xlog:gc*}} hoặc JFR recording để xem allocation rate (MB/s). Allocation rate > 500 MB/s thường cần tuning. Đừng chỉ nhìn heap usage % — hãy nhìn **old gen occupancy trend** và **GC pause distribution**.`
  },
  {
    id: 'qz-scenario-034',
    topic: 'scenario',
    q: 'Sau khi bật Spring Boot DevTools hoặc dùng library sinh class động (CGLIB, ByteBuddy, Groovy), Metaspace usage tăng không ngừng và cuối cùng ném {{OutOfMemoryError: Metaspace}}. Heap vẫn bình thường. Nguyên nhân gốc và cách xử lý?',
    options: [
      'Tăng {{-XX:MaxMetaspaceSize}} lên 1 GB là đủ',
      'Classloader leak: classloader cũ không bị GC vì vẫn bị reference (static field, ThreadLocal, driver JDBC đăng ký không huỷ). Cần tìm classloader bị leak bằng heap dump + MAT dominator tree theo classloader, fix reference hoặc đăng ký shutdown hook huỷ driver',
      'Chuyển sang Java 8 để tránh Metaspace',
      'Tắt class loading động'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Classloader leak — classloader cũ không bị GC vì vẫn bị reference (static field, ThreadLocal, driver JDBC). Cần tìm bằng heap dump + MAT dominator tree theo classloader.**

### Vì sao đúng
- Metaspace lưu **metadata class** (Klass, method, annotation). Classloader nạp class, và classloader chỉ bị GC khi **không còn object nào reference tới classloader hoặc class của nó**.
- Nguyên nhân phổ biến:
  1. **JDBC driver**: {{DriverManager.registerDriver()}} giữ reference static tới driver class → classloader không bao giờ GC. Fix: {{DriverManager.deregisterDriver()}} trong shutdown hook.
2. **ThreadLocal** giữ object của classloader (Spring {{RequestContextHolder}}, {{LocaleContextHolder}}). Fix: dùng {{ThreadLocal}} của thư viện có {{remove()}} hoặc **dọn dẹp thủ công**.
   3. **Cache/static field** giữ reference tới class (ví dụ {{Map<Class, ...>}}).
  4. **JSP/Thymeleaf template compile** mỗi request tạo class mới.
- Chẩn đoán: heap dump {{jmap -dump}}, mở Eclipse MAT, nhóm object theo **classloader** ({{Group By Classloader}}). Classloader nào retain nhiều object nhất là culprit.

### Vì sao các phương án khác sai
- **Tăng MaxMetaspaceSize**: chỉ trì hoãn OOM, không sửa leak; Metaspace không giới hạn mặc định sẽ ăn hết native memory.
- **Chuyển Java 8**: Java 8 dùng PermGen (cũng bị OOM), không giải quyết leak.
- **Tắt class loading động**: DevTools, Spring AOP (CGLIB), Hibernate proxy **cần** class loading động; không thể tắt hoàn toàn.

> Senior tip: production **không bao giờ bật DevTools**. Metaspace OOM thường xảy ra sau nhiều lần redeploy (hot reload) trong dev/staging; production dùng immutable image. Luôn có shutdown hook deregister JDBC driver.`
  },
  {
    id: 'qz-scenario-035',
    topic: 'scenario',
    multi: true,
    q: 'Consumer Kafka (Spring Kafka) xử lý message mất trung bình 2 giây. Cấu hình {{max.poll.interval.ms=300000}} (5 phút), {{max.poll.records=500}}. Sau deploy, consumer group liên tục rebalance, log lặp lại {{Member ... failed to join group: The member ... failed to re-join within the session timeout}}. Chọn 2 nguyên nhân/biện pháp đúng (Chọn 2).',
    options: [
      'Xử lý message quá lâu (gần max.poll.interval.ms) khiến coordinator coi consumer chết và trigger rebalance; cần giảm max.poll.records hoặc tăng max.poll.interval.ms',
      'Heartbeat thread bị block do processing trong listener cùng thread, không gửi heartbeat kịp; cần tách processing ra thread pool riêng hoặc dùng @KafkaListener(containerFactory) với concurrency',
      'Broker quá tải, cần restart broker',
      'Topic partition quá ít, cần tăng partition',
      'Network partition giữa consumer và broker'
    ],
    answer: [0, 1],
    explain: `**Đáp án đúng: Xử lý message gần max.poll.interval.ms gây rebalance · Heartbeat thread bị block bởi processing.**

### Vì sao đúng
- Kafka consumer có 2 timeout quan trọng:
  1. **session.timeout.ms** (mặc định 45s): thời gian consumer phải gửi heartbeat. Heartbeat chạy trên **thread riêng** (heartbeat thread).
  2. **max.poll.interval.ms** (mặc định 5 phút): thời gian tối đa giữa 2 lần {{poll()}}. Nếu xử lý batch 500 record mất > 5 phút, consumer bị coi là stuck và kick khỏi group.
- Với {{max.poll.records=500}} và xử lý 2 giây/record → batch mất ~1000 giây (16 phút) **vượt xa max.poll.interval.ms** → coordinator kick consumer → rebalance liên tục.
- Ngoài ra, Spring Kafka listener mặc định xử lý trên **cùng thread** với poll loop. Nếu processing block thread này, **heartbeat thread** (riêng) vẫn chạy nhưng **poll loop không gọi poll() kịp** → vi phạm max.poll.interval.ms. Cách fix: giảm {{max.poll.records}} (ví dụ 50–100), **tăng {{max.poll.interval.ms}}** (ví dụ 10–15 phút), **tách processing ra thread pool** ({{@KafkaListener}} + {{containerFactory}} set {{concurrency}} hoặc custom {{Executor}}) để poll loop nhẹ nhàng.

### Vì sao các phương án khác sai
- **Restart broker**: không giải quyết consumer config sai.
- **Tăng partition**: không giảm thời gian xử lý mỗi record; vẫn vi phạm max.poll.interval.ms.
- **Network partition**: sẽ gây mất kết nối, không phải rebalance lặp có pattern cố định sau deploy.

> Senior tip: đặt alert {{consumer-lag}} và {{rebalance-rate}}. Rebalance > 1 lần/phút là bất thường. Luôn test consumer với tải thực tế trước khi deploy.`
  },
  {
    id: 'qz-scenario-036',
    topic: 'scenario',
    q: 'Service reactive (Spring WebFlux + R2DBC) chạy ổn định vài tuần thì bất ngờ báo lỗi {{HikariPool-1 - Connection is not available, request timed out after 30000ms}}. Code dùng {{Mono.fromCallable(() -> blockingJdbcCall())}} và {{.subscribeOn(Schedulers.boundedElastic())}}. Nguyên nhân khả dĩ?',
    options: [
      'R2DBC driver bị leak connection',
      'Blocking JDBC call trong boundedElastic vẫn lấy connection từ HikariCP (pool chung với code blocking cũ), nhưng boundedElastic unbounded queue làm hàng nghìn task chờ connection → pool cạn; cần tách pool riêng cho blocking code hoặc chuyển hoàn toàn sang R2DBC non-blocking',
      'Database quá tải',
      'Cần tăng maximum-pool-size của HikariCP'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Blocking JDBC call trong boundedElastic dùng chung HikariCP với code blocking cũ; boundedElastic unbounded queue làm task dồn lên, cạn connection pool.**

### Vì sao đúng
- {{Schedulers.boundedElastic()}} là thread pool **unbounded queue** (có thể xếp hàng không giới hạn task). Khi traffic tăng, hàng nghìn task {{Mono.fromCallable}} được ném vào queue, mỗi task khi chạy lấy connection từ **chung HikariCP**.
- HikariCP có {{maximumPoolSize}} cố định (ví dụ 20). 10.000 task chờ → 20 connection bị giữ bởi 20 task đang chạy, 9.980 task chờ connection → timeout 30s → lỗi.
- Code reactive nên dùng **R2DBC non-blocking** (không dùng thread pool blocking, không dùng connection pool truyền thống). Nếu bắt buộc dùng JDBC blocking (thư viện cũ), phải **tách HikariCP riêng** cho blocking code, đặt queue giới hạn ({{Schedulers.newBoundedElastic(queueCapacity)}}), và áp dụng **backpressure** ở tầng trên.

### Vì sao các phương án khác sai
- **R2DBC driver leak**: R2DBC không dùng HikariCP; lỗi nói rõ HikariPool.
- **Database quá tải**: sẽ thấy DB CPU cao, slow query; ở đây lỗi là client-side pool timeout.
- **Tăng maximumPoolSize**: chỉ trì hoãn vấn đề; unbounded queue vẫn dồn task, pool lớn hơn làm DB quá tải hơn.

> Senior tip: reactive + blocking JDBC là anti-pattern. Nếu chưa chuyển hết sang R2DBC, hãy cô lập blocking code: pool riêng, bounded queue, circuit breaker. Đừng để unbounded queue "ăn" connection pool chung.`
  },
  {
    id: 'qz-scenario-037',
    topic: 'scenario',
    q: 'Cache-aside pattern: đọc cache miss → query DB → set cache. Dưới tải cao, cùng một key bị miss đồng thời bởi 100 request, tất cả query DB và set cache → **cache stampede**. Code đã có lock Redis {{SET key:lock NX EX 10}} nhưng vẫn thấy stampede. Lỗi thường gặp?',
    options: [
      'Lock key trùng với data key, bị overwrite khi set cache',
      'Lock được lấy nhưng **exception trong query DB không release lock** (thiếu try-finally hoặc Lua script), các request sau wait hết 10s rồi tự query DB → stampede',
      'Redis single-threaded nên không hỗ trợ lock',
      'TTL 10 giây quá ngắn'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Exception trong query DB không release lock (thiếu try-finally hoặc Lua script), request sau wait hết TTL rồi tự query DB → stampede.**

### Vì sao đúng
- Pattern đúng:
~~~java
lock = SET lockKey NX EX 10;
if (lock) {
    try {
        data = queryDB();
        setCache(data);
    } finally {
        DEL lockKey;
    }
} else {
    waitAndReadCache();
}
~~~
- Lỗi hay gặp:
  1. **Quên finally**: exception ném ra giữa chừng → lock không bị xóa → các request khác {{GET lockKey}} thấy tồn tại, sleep wait, hết 10s lock tự expire → tất cả cùng query DB.
  2. **Dùng 2 lệnh riêng (SET + DEL)**: không atomic; crash giữa 2 lệnh cũng để lock treo.
  3. **Lock key trùng data key**: {{SET dataKey NX}} thì set cache sẽ ghi đè lock → race condition.
- Giải pháp chắc chắn: dùng **Lua script** (atomic) hoặc **Redisson** (có tryLock/unlock tự động, watchdog gia hạn TTL). Lua script gộp {{check lock → query DB (không thể ở trong Lua) → set cache → release}} không được vì Lua không gọi được DB. Thay vào đó: lock bằng Lua/Redisson, **finally block bắt buộc** ở Java.

### Vì sao các phương án khác sai
- **Lock key trùng data key**: là bug khác, nhưng không phải nguyên nhân "vẫn stampede khi đã có lock".
- **Redis single-threaded**: Redis hỗ trợ lock tốt (SET NX, Redisson).
- **TTL 10 giây**: đủ dài cho query DB bình thường; ngắn hơn query time mới gây vấn đề.

> Senior tip: luôn test case "query DB ném exception" để verify lock vẫn được release. Dùng Redisson {{RLock.tryLock()}} + {{unlock()}} trong finally, hoặc Redisson {{RLock}} với watchdog tự gia hạn.`
  },
  {
    id: 'qz-scenario-038',
    topic: 'scenario',
    multi: true,
    q: 'Service A gọi Service B qua Resilience4j CircuitBreaker. Cấu hình: {{slidingWindowSize=10}}, {{failureRateThreshold=50%}}, {{waitDurationInOpenState=30s}}. Service B chậm (latency p99 5 giây) nhưng **không fail** (trả 200). CircuitBreaker **không mở** (closed), Service A tiếp tục gọi, thread pool A cạn kệ vì chờ B. Chọn 2 cấu hình/biện pháp đúng (Chọn 2).',
    options: [
      'Bật **slow call rate** detection: {{slowCallRateThreshold=50%}}, {{slowCallDurationThreshold=2s}} để mở circuit khi latency cao',
      'Thêm **TimeLimiter** ({{TimeLimiterConfig}}) timeout 2 giây, biến slow call thành exception → tính vào failure rate',
      'Tăng failureRateThreshold lên 90% để circuit khó mở hơn',
      'Giảm slidingWindowSize xuống 5 để circuit nhạy hơn',
      'Tắt CircuitBreaker, chỉ dùng Retry'
    ],
    answer: [0, 1],
    explain: `**Đáp án đúng: Bật slow call rate detection · Thêm TimeLimiter timeout biến slow call thành exception.**

### Vì sao đúng
- CircuitBreaker mặc định chỉ đếm **failure** (exception, 5xx). **Slow call (latency cao nhưng trả 200) không tính failure** → circuit không bao giờ mở → thread pool bị chiếm bởi request chờ.
- **Slow call rate** (Resilience4j 2.x): cấu hình {{slowCallDurationThreshold}} (ví dụ 2s) và {{slowCallRateThreshold}} (ví dụ 50%). Nếu > 50% call chậm hơn 2s trong cửa sổ trượt → circuit mở.
- **TimeLimiter**: bọc call bằng timeout (ví dụ 2s). Timeout ném {{TimeoutException}} → tính là **failure** → failure rate tăng → circuit mở. Kết hợp hai cơ chế: slow call rate mở sớm, TimeLimiter đảm bảo không chờ vô hạn.

### Vì sao các phương án khác sai
- **Tăng failureRateThreshold lên 90%**: làm circuit **khó mở hơn**, ngược với mục tiêu.
- **Giảm slidingWindowSize xuống 5**: cửa sổ nhỏ hơn làm metric nhạy hơn nhưng không giải quyết bản chất: slow call không được tính.
- **Tắt CircuitBreaker**: mất bảo vệ hoàn toàn; thread pool A sẽ cạn ngay.

> Senior tip: luôn pair CircuitBreaker + TimeLimiter + Bulkhead. Bulkhead giới hạn số call đồng thời tới B (ví dụ 20), khi đầy reject ngay (fail fast) thay vì chờ.`
  },
  {
    id: 'qz-scenario-039',
    topic: 'scenario',
    q: 'Servlet service (Spring MVC, Tomcat) upload file lớn lên S3. Dưới tải cao, request upload chậm (S3 latency 5–10 giây), **Tomcat thread pool (max 200) cạn kệ**, health check fail, pod bị restart. Code dùng {{AmazonS3Client.putObject}} blocking. Cách xử lý đúng?',
    options: [
      'Tăng Tomcat maxThreads lên 1000',
      'Chuyển sang **Spring WebFlux + S3 Async Client (non-blocking)** hoặc tách upload vào service riêng dùng **virtual thread**/boundedElastic, trả presigned URL cho client upload thẳng S3',
      'Tăng S3 timeout',
      'Giảm file size limit'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Chuyển sang WebFlux + S3 Async Client hoặc tách upload service dùng virtual thread, tốt nhất là trả presigned URL cho client upload thẳng S3.**

### Vì sao đúng
- Tomcat thread pool (mặc định 200) dành cho **request xử lý nhanh**. Blocking I/O 5–10 giây/upload chiếm thread lâu → 200 upload đồng thời là cạn pool → mọi request khác (health check, API khác) đều queue → timeout → pod unhealthy.
- **Giải pháp tốt nhất**: **Presigned URL**. Server sinh URL có hạn (5–15 phút), client upload thẳng S3. Server chỉ lo metadata, không stream byte qua JVM. Tiết kiệm bandwidth, CPU, thread, memory.
- Nếu phải upload qua server: dùng **S3 Async Client** ({{S3AsyncClient.putObject}} trả {{CompletableFuture}}) kết hợp **Spring WebFlux** (non-blocking I/O, event loop Netty) hoặc **virtual thread** (Java 21+, {{Executors.newVirtualThreadPerTaskExecutor()}}) để blocking I/O không pin platform thread.
- Tách service upload riêng cũng được, nhưng vẫn cần async/virtual thread cho service đó.

### Vì sao các phương án khác sai
- **Tăng Tomcat maxThreads 1000**: mỗi thread ~1 MB stack + kernel overhead; 1000 thread = ~1 GB RAM, GC pressure cao, context switch chậm; không scale.
- **Tăng S3 timeout**: không giảm thời gian chiếm thread.
- **Giảm file size**: không giải quyết bản chất blocking I/O.

> Senior tip: presigned URL là pattern chuẩn cho upload/download lớn. Nếu cần xử lý file sau upload: S3 Event Notification → SQS → worker xử lý (async, decoupled).`
  },
  {
    id: 'qz-scenario-040',
    topic: 'scenario',
    q: 'Chạy migration Flyway/Liquibase song song trên 3 pod Kubernetes ({{initContainer}}). Pod 1 chạy migration thành công, pod 2 và 3 báo lỗi {{Lock wait timeout exceeded; try restarting transaction}} trên bảng {{flyway_schema_history}} / {{databasechangeloglock}}. Nguyên nhân và cách xử lý?',
    options: [
      'Database khóa bảng history, cần restart DB',
      'Flyway/Liquibase dùng advisory lock (hoặc row lock) trên bảng metadata để đảm bảo chỉ 1 instance migrate một lúc. Pod 1 đang giữ lock, pod 2/3 wait timeout. Cách xử lý: cấu hình {{lockTimeout}} lớn hơn thời gian migration, hoặc chỉ cho 1 pod chạy migration (Kubernetes Job + {{completions=1}}), các pod khác đợi Job hoàn tất',
      'Chạy migration thủ công trên 1 pod, các pod khác bỏ qua',
      'Tắt lock trong Flyway/Liquibase'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Flyway/Liquibase dùng advisory lock/row lock trên bảng metadata; pod 1 giữ lock, pod 2/3 wait timeout. Chạy migration bằng Kubernetes Job (completions=1) thay vì initContainer trên mọi pod.**

### Vì sao đúng
- Flyway/Liquibase **tự động locking** để tránh 2 tiến trình migrate cùng lúc làm hỏng schema. Lock mechanism:
  - Flyway: {{SELECT ... FOR UPDATE}} trên {{flyway_schema_history}} hoặc advisory lock ({{pg_advisory_lock}}).
  - Liquibase: row lock trên {{databasechangeloglock}} ({{locked=1}}).
- Với {{initContainer}} trên Deployment 3 replica: 3 pod start cùng lúc → 3 initContainer cùng chạy migrate → 2 pod bị block chờ lock → timeout (mặc địnhFlyway {{lockTimeout=0}} = không timeout, nhưng DB hoặc driver có {{lock_wait_timeout}}).
- **Kiến trúc đúng**: tách migration ra **Kubernetes Job** ({{completions=1}}, {{parallelism=1}}). Deployment pod thêm {{initContainer}} chỉ **wait** Job hoàn tất (poll {{kubectl wait --for=condition=complete job/migrate}} hoặc dùng sidecar). Chỉ 1 lần migrate cho toàn cụm.

### Vì sao các phương án khác sai
- **Restart DB**: không giải quyết race condition migrate.
- **Chạy thủ công**: không tự động, dễ quên, không phù hợp CI/CD.
- **Tắt lock**: cực kỳ nguy hiểm, 2 migrate cùng lúc có thể corrupt schema history.

> Senior tip: Flyway {{lockTimeout}} (ms) có thể đặt lớn (ví dụ 1800000 = 30 phút) để wait thay vì fail, nhưng Job pattern vẫn tốt hơn vì tách biệt vòng đời migrate và vòng đời app.`
  },
  {
    id: 'qz-banking-048',
    topic: 'banking',
    q: 'Hệ thống của bạn nhận lệnh chuyển 1.000.000 từ tài khoản A và ghi nhận ngay, nhưng lệnh này phải gom vào file batch gửi ngân hàng đối tác vài giờ sau mới thực sự đi. Theo ghi sổ kép, sổ cái phải luôn cân bằng. Cách ghi nào đúng trong khoảng thời gian tiền "đang đi"?',
    options: [
      'Chưa ghi gì vào sổ cái cho tới khi đối tác báo đã cộng tiền cho B, vì lúc đó tiền mới thật sự chuyển',
      'Ghi ngay 2 bút toán: nợ (debit) tài khoản A 1.000.000, có (credit) một tài khoản trung chuyển (suspense/clearing account) 1.000.000; khi đối tác xác nhận đã cộng B thì ghi tiếp: nợ tài khoản trung chuyển 1.000.000, có tài khoản B 1.000.000',
      'Ghi luôn nợ A và có B như thể chuyển xong, sau này đối tác lỗi thì sửa số dư bằng tay',
      'Chỉ ghi một bút toán nợ A, không cần bút toán đối ứng vì đây là giao dịch nội bộ'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Ghi ngay qua tài khoản trung chuyển (suspense/clearing account) để sổ luôn cân bằng, rồi "đóng" tài khoản trung chuyển khi đối tác xác nhận.**

**Tóm tắt:** Sổ cái kép bắt buộc mỗi giao dịch phải cân bằng (tổng nợ = tổng có) tại mọi thời điểm. Khi tiền còn "đang đi" (in transit) giữa hai hệ thống, ta không thể ghi thẳng có vào B vì B chưa nhận; cũng không thể bỏ trống vì như thế sổ mất cân bằng. Giải pháp chuẩn là dùng một tài khoản trung chuyển làm "điểm neo" tạm thời.

Thuật ngữ:
- **Suspense account (tài khoản treo) / clearing account (tài khoản thanh toán bù trừ)**: tài khoản kỹ thuật của chính ngân hàng, dùng để "giữ" số tiền đang chờ được xử lý tiếp. Nó không thuộc khách hàng nào, chỉ để sổ sách luôn khớp.
- **In transit (đang chuyển)**: trạng thái tiền đã rời nguồn nhưng chưa tới đích.

### Vì sao đúng
Vì sổ kép yêu cầu cân bằng, khi A bị trừ 1.000.000 thì phải có một chỗ "cộng 1.000.000" ngay lập tức. Chỗ đó là tài khoản trung chuyển:
~~~text
Bước 1 (nhận lệnh, tiền đang đi):
   NỢ  A:                  1.000.000   (tài sản khách A giảm)
   CÓ  Tài khoản treo:    1.000.000   (nợ phải trả "treo" chờ xử lý)
   Tổng nợ = tổng có = 1.000.000  -> cân bằng

Bước 2 (đối tác xác nhận đã cộng B):
   NỢ  Tài khoản treo:    1.000.000   (giải phóng khoản treo)
   CÓ  B:                  1.000.000   (tài sản khách B tăng)
   Tổng nợ = tổng có = 1.000.000  -> cân bằng
~~~
Sau bước 2, tài khoản trung chuyển về 0 (đã "đóng"), tiền đã tới B. Nếu đối tác báo lỗi, ta ghi bút toán đảo: nợ tài khoản treo, có lại A — A được hoàn tiền, sổ vẫn cân bằng. Số dư của tài khoản treo khác 0 chính là "tổng tiền đang đi" và luôn phải được theo dõi, đối soát.

### Vì sao các phương án khác sai
- **Chưa ghi gì cho tới khi B nhận được**: trong khoảng chờ, A đã bị trừ (hoặc sẽ bị trừ) nhưng sổ không có bút toán đối ứng → sổ mất cân bằng, không biết 1.000.000 đang nằm đâu. Đây chính là lúc cần tài khoản treo.
- **Ghi thẳng có B rồi sửa tay khi lỗi**: B "tăng số dư" cho khoản tiền chưa thật sự tới; nếu đối tác lỗi, việc sửa số dư bằng tay phá vỡ nguyên tắc append-only (không sửa/xoá bút toán) và mất vết kiểm toán.
- **Chỉ ghi một bút toán nợ A**: vi phạm sổ kép (một bút toán không có đối ứng), không thể tái hiện trạng thái và không cân bằng.

> Senior tip: Mỗi loại "đang chờ" nên có tài khoản treo riêng (treo do timeout, treo do chờ đối tác, treo do sai thông tin người nhận) để dễ theo dõi và đối soát. Đặt cảnh báo khi số dư tài khoản treo vượt ngưỡng hoặc tồn quá lâu (ví dụ > 24 giờ), vì đó là dấu hiệu tiền bị kẹt.`
  },
  {
    id: 'qz-banking-049',
    topic: 'banking',
    q: 'Hai giao dịch chạy song song: giao dịch 1 chuyển từ A sang B, giao dịch 2 chuyển từ B sang A. Cả hai đều dùng pessimistic lock ({{SELECT ... FOR UPDATE}}) trên từng dòng tài khoản. Thỉnh thoảng DB ném lỗi deadlock. Nguyên nhân gốc và cách sửa đúng là gì?',
    options: [
      'Deadlock do DB yếu, chỉ cần tăng {{lock_timeout}} cho thật lớn',
      'Bỏ {{FOR UPDATE}}, dùng {{SELECT}} thường để không ai phải chờ lock',
      'Các giao dịch khoá hai dòng theo thứ tự ngược nhau (giao dịch 1 giữ A rồi xin B, giao dịch 2 giữ B rồi xin A) nên cùng chờ nhau vô hạn; sửa bằng cách luôn khoá các tài khoản theo một thứ tự nhất quán (ví dụ id tăng dần) trước khi trừ/cộng',
      'Đọc số dư bằng {{SELECT}}, kiểm tra ở Java rồi ghi lại giá trị mới, không cần lock'
    ],
    answer: 2,
    explain: `**Đáp án đúng: Deadlock do hai giao dịch khoá hai dòng theo thứ tự ngược nhau; sửa bằng quy tắc lock theo thứ tự nhất quán (ví dụ luôn theo id tăng dần).**

**Tóm tắt:** Deadlock (khoá chết) xảy ra khi hai tiến trình mỗi bên giữ một tài nguyên và cùng chờ tài nguyên bên kia đang giữ, tạo vòng chờ khép kín. Với chuyển tiền hai chiều, cách phòng ngừa kinh điển là **lock ordering**: mọi giao dịch phải khoá các tài khoản theo cùng một trật tự xác định.

Thuật ngữ:
- **Pessimistic lock (khoá bi quan)**: giả định chắc chắn có xung đột nên khoá dòng lại ({{SELECT ... FOR UPDATE}}) để không ai đọc/ghi trong lúc mình xử lý.
- **Deadlock (khoá chết)**: hai transaction cùng giữ một phần khoá và chờ phần còn lại của nhau, không ai nhả ra.

### Vì sao đúng
Diễn tiến gây deadlock:
~~~text
Thời điểm   Giao dịch 1 (A->B)        Giao dịch 2 (B->A)
   t1       FOR UPDATE dòng A       FOR UPDATE dòng B
            (A đang bị khoá)         (B đang bị khoá)
   t2       xin khoá dòng B  ...    xin khoá dòng A  ...
            (B do GD2 giữ)           (A do GD1 giữ)
   t3       chờ B                  chờ A   -> vòng chờ khép kín
            DB phát hiện deadlock, huỷ một giao dịch
~~~
Cách sửa: quy ước "khi cần khoá nhiều tài khoản, luôn khoá theo id tăng dần". Giao dịch 1 khoá A rồi B; giao dịch 2 cũng khoá A rồi B (vì A có id nhỏ hơn). Khi đó không tồn tại vòng chờ: nếu GD2 đến sau, nó phải chờ A do GD1 giữ, GD1 lấy tiếp B và chạy xong, nhả khoá, GD2 mới tiếp tục.
~~~java
// Khoá hai tài khoản theo thứ tự id tăng dần để tránh deadlock
var ids = Stream.of(fromId, toId).sorted().toList();
for (Long id : ids) repo.lockById(id);   // SELECT ... FOR UPDATE theo trật tự cố định
// sau đó mới trừ from, cộng to trong cùng transaction
~~~

### Vì sao các phương án khác sai
- **Tăng {{lock_timeout}} thật lớn**: chỉ làm giao dịch chờ lâu hơn rồi vẫn deadlock; timeout lớn còn giữ connection và khoá lâu, dễ nghẽn pool. Không loại bỏ vòng chờ.
- **Bỏ {{FOR UPDATE}}, dùng {{SELECT}} thường**: mất khoá → hai giao dịch cùng đọc số dư cũ rồi cùng ghi (lost update), số dư có thể sai hoặc âm; đổi deadlock lấy lỗi tiền tệ còn tệ hơn.
- **Đọc rồi ghi lại giá trị mới ở Java, không lock**: chính là read-modify-write không nguyên tử, hai request cùng đọc 100, cùng thấy đủ, cùng ghi kết quả → mất cập nhật và có thể âm số dư.

> Senior tip: Lock ordering là kỹ thuật chung cho mọi tài nguyên nhiều khoá (không chỉ tiền). Nếu một giao dịch động tới 3-4 tài khoản, vẫn áp cùng quy tắc sắp xếp. Khi DB vẫn báo deadlock lẻ tẻ, hãy retry cả giao dịch (vì DB đã rollback an toàn) kèm backoff, và log lại để điều tra.`
  },
  {
    id: 'qz-banking-050',
    topic: 'banking',
    multi: true,
    q: 'Bạn phải chia 100,00 (đơn vị tiền có 2 chữ số thập phân) thành 3 phần bằng nhau, mỗi phần là số có đúng 2 chữ số thập phân và tổng ba phần phải bằng đúng 100,00. Những cách nào cho kết quả đúng? (Chọn 2)',
    options: [
      'Tính 100,00 / 3 cho mỗi phần rồi làm tròn từng phần độc lập; nếu tổng lệch 0,01 thì chấp nhận vì sai số nhỏ',
      'Chia phần nguyên cho mỗi phần, còn phần dư (0,01) phân bổ cho một phần theo quy tắc xác định (ví dụ phần có số dư lớn nhất - largest remainder), sao cho tổng khớp tuyệt đối',
      'Dùng {{double}} tính rồi làm tròn khi hiển thị, tổng sẽ luôn khớp 100,00',
      'Giữ danh sách phần đã chia, cộng dồn và gán nốt phần dư còn thiếu vào phần cuối theo trật tự cố định, đảm bảo tổng bằng đúng 100,00'
    ],
    answer: [1, 3],
    explain: `**Đáp án đúng: Phân bổ phần dư còn lại theo quy tắc xác định (largest remainder hoặc gán vào phần cuối theo trật tự cố định) để tổng khớp tuyệt đối.**

**Tóm tắt:** Chia tiền không bao giờ được "làm tròn mỗi phần một cách độc lập rồi bỏ qua phần dư", vì tổng các phần đã làm tròn thường lệch so với số ban đầu. Cách đúng là **allocation theo phần dư**: chia phần nguyên, rồi phân bổ phần dư còn lại một cách tất định (deterministic) sao cho tổng bằng đúng số gốc.

Thuật ngữ:
- **Allocation problem (bài toán phân bổ)**: chia một tổng thành nhiều phần mà ràng buộc tổng các phần phải bằng đúng tổng ban đầu.
- **Largest remainder (phần dư lớn nhất)**: quy tắc chia phần dư cho phần có số dư (phần bị cắt) lớn nhất, giúp phân bổ công bằng nhất.
- **Deterministic (tất định)**: cùng đầu vào luôn cho cùng kết quả, không tuỳ tiện.

### Vì sao đúng
100,00 chia 3 = 33,3333... Làm tròn độc lập mỗi phần về 33,33 thì tổng là 99,99, thiếu 0,01. Cách đúng:
~~~text
100,00 / 3 = 33 phần nguyên 33,00, dư 1,00 ; rồi 1,00 / 3 mỗi phần 0,33 dư 0,01
Phần thô: 33,33 | 33,33 | 33,33   tổng 99,99  -> còn dư 0,01
Phân bổ 0,01 cho một phần theo quy tắc (vd phần đầu): 33,34 | 33,33 | 33,33
Tổng = 100,00  -> khớp tuyệt đối
~~~
- Phương án 1 (largest remainder) và phương án 3 (gán phần dư vào phần cuối theo trật tự cố định) đều đảm bảo tổng khớp; điểm chung là **phần dư được phân bổ tường minh, có quy tắc**, không bỏ quên.
- Trong code, phải dùng {{BigDecimal}} với {{RoundingMode}} rõ ràng và một hàm allocate trả về danh sách phần đã cộng đúng phần dư.

### Vì sao các phương án khác sai
- **Làm tròn từng phần độc lập rồi chấp nhận lệch 0,01**: sai nguyên tắc tài chính — sổ cái phải khớp tuyệt đối; 0,01 nhân hàng triệu giao dịch thành sai số lớn, và không giải trình được đồng tiền thiếu nằm ở đâu.
- **Dùng {{double}} rồi làm tròn hiển thị**: {{double}} là số nhị phân, 100,00 không biểu diễn chính xác; làm tròn lúc hiển thị không sửa được sai số đã tích luỹ trong phép chia, và tổng vẫn có thể lệch.

> Senior tip: Khi chia tiền cho nhiều bên (phí, hoa hồng, chia doanh thu), luôn viết một hàm allocate(amount, ratios) trả về danh sách phần mà tổng bằng đúng amount, kèm kiểm thử tự động (assert tổng == amount). Quy tắc gán phần dư phải cố định để kết quả ổn định giữa các lần chạy và giữa các hệ thống.`
  },
  {
    id: 'qz-banking-051',
    topic: 'banking',
    q: 'Một hệ thống tính phí và lãi cho hàng triệu giao dịch, làm tròn về 2 chữ số thập phân bằng {{RoundingMode.HALF_UP}}. Sau vài tháng, tổng tiền thu lệch nhẹ so với đối tác dù mỗi phép làm tròn trông "đúng". Vì sao {{HALF_EVEN}} (banker rounding) thường được khuyến nghị cho tính toán tài chính quy mô lớn?',
    options: [
      'Vì {{HALF_EVEN}} chạy nhanh hơn {{HALF_UP}}',
      'Vì {{HALF_EVEN}} luôn làm tròn xuống nên có lợi cho ngân hàng',
      'Vì {{HALF_UP}} bị cấm trong Java nên bắt buộc dùng {{HALF_EVEN}}',
      'Vì {{HALF_UP}} luôn đẩy số 0,5 lên trên, tạo thiên lệch tích luỹ (bias) khi lặp lại rất nhiều lần; {{HALF_EVEN}} làm tròn về số chẵn gần nhất nên thiên lệch dương và âm triệt tiêu nhau, tổng sai số gần 0 hơn'
    ],
    answer: 3,
    explain: `**Đáp án đúng: {{HALF_UP}} luôn làm tròn phần 0,5 lên trên nên tạo thiên lệch tích luỹ; {{HALF_EVEN}} làm tròn về số chẵn gần nhất giúp triệt tiêu thiên lệch, tổng sai số gần 0.**

**Tóm tắt:** Làm tròn là việc bỏ bớt chữ số thừa. Nếu quy tắc luôn đẩy các trường hợp "đúng giữa" (0,5) về cùng một hướng, thì qua hàng triệu lần, sai số dồn về một phía và tích luỹ thành con số lớn. {{HALF_EVEN}} chia đều các trường hợp 0,5 về số chẵn nên không thiên vị.

Thuật ngữ:
- **Rounding mode (chế độ làm tròn)**: quy tắc quyết định chữ số cuối khi bỏ phần dư.
- **HALF_UP**: nếu phần bị bỏ ≥ 0,5 thì tăng chữ số cuối lên 1 (làm tròn "nửa lên").
- **HALF_EVEN (banker's rounding)**: nếu phần bị bỏ đúng 0,5 thì làm tròn về số chẵn gần nhất; nếu > 0,5 vẫn lên, < 0,5 vẫn xuống.
- **Bias (thiên lệch)**: sai số có xu hướng dồn về một chiều.

### Vì sao đúng
Ví dụ với các số kết thúc đúng ở 0,5 khi làm tròn về số nguyên:
~~~text
Số     HALF_UP   HALF_EVEN
0,5       1         0     (0 là chẵn)
1,5       2         2     (2 là chẵn)
2,5       3         2     (2 là chẵn)
3,5       4         4     (4 là chẵn)
---------------------------
Với HALF_UP: 1+2+3+4 = 10  (luôn bị đẩy lên, dư 2 so với 8)
Với HALF_EVEN: 0+2+2+4 = 8 (cân bằng, không dư)
~~~
Khi lặp hàng triệu giao dịch, phần dư "0,5" của HALF_UP dồn hết lên trên → tổng thu cao hơn thực tế một lượng nhỏ nhưng ổn định một chiều. HALF_EVEN khiến các lần lên/xuống xen kẽ, tổng lệch gần 0. Vì vậy nhiều chuẩn và hệ thống tài chính chọn HALF_EVEN cho tính toán nội bộ, còn HALF_UP thường dùng khi hiển thị cho người dùng theo thói quen "làm tròn 0,5 lên".

### Vì sao các phương án khác sai
- **{{HALF_EVEN}} nhanh hơn**: hai chế độ cùng độ phức tạp, tốc độ không phải lý do; đây là vấn đề đúng đắn số học, không phải hiệu năng.
- **{{HALF_EVEN}} luôn làm tròn xuống, có lợi cho ngân hàng**: sai mô tả — HALF_EVEN làm tròn về số chẵn (lúc lên lúc xuống), không phải luôn xuống; "có lợi cho ngân hàng" cũng không phải mục tiêu kỹ thuật.
- **{{HALF_UP}} bị cấm trong Java**: hoàn toàn sai, {{HALF_UP}} là hằng số hợp lệ và được dùng phổ biến; không có lệnh cấm nào.

> Senior tip: Điều quan trọng là cả hệ thống và đối tác phải thoả thuận **cùng một rounding mode** cho cùng loại nghiệp vụ; lệch quy tắc làm tròn là nguyên nhân reconciliation break rất khó tìm. Ghi rõ rounding mode trong tài liệu tích hợp và trong test.`
  },
  {
    id: 'qz-banking-052',
    topic: 'banking',
    q: 'Hệ thống đặt trên server cấu hình múi giờ UTC, dùng {{LocalDate.now()}} để so với cut-off 15h30. Ngân hàng áp cut-off theo giờ Việt Nam (UTC+7). Khách chuyển lúc 15h00 giờ VN (tức 08h00 UTC) bị tính nhầm sang value date hôm sau. Nguyên nhân gốc và cách sửa đúng?',
    options: [
      '{{LocalDate.now()}} lấy ngày/giờ theo múi giờ mặc định của JVM (đang là UTC), không phải giờ nghiệp vụ của ngân hàng; phải quy mọi so sánh cut-off về một timezone nghiệp vụ cố định (ví dụ {{Asia/Ho_Chi_Minh}}), hoặc dùng {{Instant}}/{{OffsetDateTime}} và đổi sang zone đó trước khi so với cut-off dạng giờ tường',
      'Tăng cut-off lên 16h30 cho chắc, không lo lệch nữa',
      'Thay {{LocalDate.now()}} bằng {{System.currentTimeMillis()}} là hết lệch múi giờ',
      'Cách duy nhất và tốt nhất là đổi múi giờ hệ điều hành của server sang giờ VN'
    ],
    answer: 0,
    explain: `**Đáp án đúng: {{LocalDate.now()}} dùng múi giờ mặc định của JVM (UTC) chứ không phải giờ nghiệp vụ; phải quy về timezone nghiệp vụ cố định ({{Asia/Ho_Chi_Minh}}) hoặc dùng {{Instant}} rồi đổi sang zone đó trước khi so cut-off.**

**Tóm tắt:** "15h30" là một mốc giờ tường (wall-clock) gắn với một múi giờ cụ thể (giờ VN). Nếu bạn lấy thời điểm hiện tại theo UTC rồi so với 15h30, bạn đang so hai mốc ở hai múi giờ khác nhau → lệch 7 tiếng. Cách đúng là luôn gắn mốc cut-off với đúng múi giờ nghiệp vụ.

Thuật ngữ:
- **Timezone (múi giờ)**: vùng địa lý quy định độ lệch so với UTC; Việt Nam là UTC+7 quanh năm, không có giờ mùa hè.
- **Wall-clock time (giờ tường)**: con số đồng hồ người dân thấy (ví dụ 15h30), khác với **instant** (mốc thời gian tuyệt đối trên trục thời gian).
- **Instant**: mốc thời gian tuyệt đối, không phụ thuộc múi giờ (tương đương epoch).
- **JVM default timezone**: múi giờ mặc định của tiến trình Java, có thể là UTC nếu server cấu hình vậy.

### Vì sao đúng
Vấn đề là so sánh hai đại lượng ở hai hệ quy chiếu:
~~~text
Khách chuyển 15h00 giờ VN = 08h00 UTC (cùng một instant)
Code chạy: LocalDate.now() = 2026-11-27 (theo UTC), giờ hiện tại 08h00
So 08h00 < 15h30 -> tưởng là trước cut-off? KHÔNG, vì...
   thực tế 08h00 UTC chính là 15h00 VN, đã TRƯỚC 15h30 VN -> đúng ra là trước cut-off
Nhưng nếu code lấy giờ VN bằng LocalDate.now(ZoneId.of("Asia/Ho_Chi_Minh"))
   -> 15h00, so với cut-off 15h30 -> trước cut-off, value date hôm nay. Đúng.
~~~
Cách chuẩn: dùng {{Instant}} (luôn chính xác tuyệt đối), khi cần so với cut-off dạng giờ tường thì {{instant.atZone(ZoneId.of("Asia/Ho_Chi_Minh"))}} rồi lấy giờ trong ngày để so. Không dựa vào múi giờ mặc định của JVM.

### Vì sao các phương án khác sai
- **Tăng cut-off lên 16h30**: chỉ che một trường hợp, không sửa nguyên nhân; các mốc giờ khác (qua đêm, ngày lễ) vẫn sai, và đổi cut-off là đổi nghiệp vụ tuỳ tiện.
- **Dùng {{System.currentTimeMillis()}}**: đây chỉ là epoch millis (một {{Instant}}), vẫn phải quy về múi giờ nghiệp vụ mới so được với "15h30"; bản thân nó không chứa thông tin múi giờ.
- **Đổi múi giờ HĐH của server sang VN là cách duy nhất và tốt nhất**: phụ thuộc cấu hình hạ tầng, dễ vỡ khi deploy lên môi trường khác (container, cloud mặc định UTC), và không giải quyết khi hệ thống phục vụ nhiều múi giờ. Cách bền vững là xử lý timezone trong code một cách tường minh.

> Senior tip: Lưu mọi timestamp trong DB ở UTC (kiểu {{timestamptz}}) và chỉ chuyển sang giờ nghiệp vụ ở tầng hiển thị/so sánh cut-off. Đặt hằng số {{ZoneId}} nghiệp vụ ở một chỗ, không rải rác. Viết test với các mốc sát cut-off (15h29, 15h30, 15h31) để bắt lỗi múi giờ.`
  },
  {
    id: 'qz-banking-053',
    topic: 'banking',
    q: 'Ledger append-only của bạn đã có hàng trăm triệu bút toán. Mỗi lần khách mở app xem số dư, không thể cộng lại toàn bộ từ đầu. Thiết kế nào vừa nhanh vừa giữ được tính chính xác và kiểm toán?',
    options: [
      'Mỗi khi có bút toán mới thì {{UPDATE}} số dư trên bảng tài khoản; số dư đó là nguồn sự thật duy nhất, ledger chỉ để tham khảo',
      'Lưu snapshot số dư định kỳ (ví dụ cuối ngày) kèm mốc bút toán cuối cùng đã áp dụng; số dư hiện tại = snapshot gần nhất + cộng các bút toán phát sinh sau mốc đó; có job đối chiếu snapshot với ledger để phát hiện lệch',
      'Đếm số bút toán rồi nhân với số tiền trung bình để ra số dư',
      'Cache số dư trong Redis và không bao giờ cập nhật lại cho tới khi restart'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Snapshot số dư định kỳ + cộng bút toán phát sinh sau mốc snapshot (replay), kèm job đối chiếu snapshot với ledger.**

**Tóm tắt:** Ledger append-only là nguồn sự thật đầy đủ nhưng đọc cả lịch sử thì quá chậm. Cách chuẩn là **materialized balance có kiểm chứng**: lưu snapshot (bản chụp) số dư tại một mốc, rồi chỉ cộng thêm các bút toán mới sau mốc đó. Định kỳ đối chiếu snapshot với ledger để đảm bảo không lệch.

Thuật ngữ:
- **Snapshot (bản chụp)**: giá trị số dư được lưu tại một thời điểm (ví dụ 00:00 mỗi ngày), kèm id của bút toán cuối cùng đã tính vào snapshot.
- **Replay (phát lại)**: cộng tiếp các bút toán xuất hiện sau mốc snapshot để ra số dư hiện tại.
- **Materialized balance**: số dư được tính sẵn và lưu lại để đọc nhanh, thay vì tính lại từ đầu mỗi lần.

### Vì sao đúng
~~~text
Số dư hiện tại = Snapshot(cuối ngày hôm qua) + tổng bút toán từ sáng nay tới giờ
Ví dụ: snapshot 23:59 = 5.000.000 (đã gồm bút toán #900)
   sáng nay có #901 (+200.000), #902 (-50.000)
   -> số dư = 5.000.000 + 200.000 - 50.000 = 5.150.000
Việc cần làm chỉ là đọc 1 dòng snapshot + vài chục bút toán mới, không phải hàng trăm triệu dòng.
~~~
Để đảm bảo đúng, job đối chiếu định kỳ cộng lại từ ledger (hoặc từ snapshot trước) và so với snapshot hiện tại; nếu lệch thì cảnh báo và dừng ghi. Cách này giữ ledger là nguồn sự thật (append-only, kiểm toán đầy đủ) còn snapshot chỉ là lớp tăng tốc có thể tái tạo lại bất cứ lúc nào.

### Vì sao các phương án khác sai
- **{{UPDATE}} số dư và coi đó là nguồn sự thật, ledger chỉ tham khảo**: phá vỡ append-only (sửa trực tiếp số dư), mất khả năng tái dựng lịch sử; nếu một lần UPDATE sai hoặc lost update thì không còn cách đối chiếu đáng tin. Số dư nên là hệ quả suy ra từ ledger, không phải sự thật độc lập.
- **Đếm số bút toán nhân số tiền trung bình**: vô nghĩa về nghiệp vụ — các bút toán có số tiền khác nhau và cả hai chiều; không thể ra số dư đúng.
- **Cache Redis không bao giờ cập nhật tới khi restart**: số dư sẽ đứng yên sai ngay khi có giao dịch mới; cache phải được cập nhật hoặc invalidate theo bút toán, không phải "đóng băng".

> Senior tip: Snapshot nên tạo trong cùng transaction nhất quán (hoặc từ một bản read có mốc LSN rõ ràng) để không "vừa chụp vừa có bút toán chen vào". Ghi kèm mốc (sequence/LSN/thời điểm) để replay chính xác. Tần suất snapshot là bài toán đánh đổi: thưa thì replay nhiều, dày thì tốn lưu trữ.`
  },
  {
    id: 'qz-banking-054',
    topic: 'banking',
    multi: true,
    q: 'Đối tác gửi file đối soát cuối ngày trong đó mỗi dòng là "tổng ròng" (net settlement) của rất nhiều giao dịch trong ngày, không phải từng giao dịch lẻ. Bạn có ledger từng giao dịch. Những cách đối soát nào đúng? (Chọn 2)',
    options: [
      'Vì file chỉ có tổng ròng nên không thể đối soát, bỏ qua file',
      'Tính tổng các giao dịch của bạn theo cùng nhóm/kỳ rồi so với tổng ròng của đối tác; nếu lệch thì truy vết (drill-down) xuống từng giao dịch cấu thành để tìm nguyên nhân',
      'Coi mỗi dòng tổng ròng là một giao dịch đơn lẻ và tạo bút toán mới đúng bằng tổng đó',
      'Đối soát hai chiều: so khớp ở mức tổng để phát hiện lệch nhanh, nhưng vẫn phải giải trình được từng giao dịch cấu thành khi có break'
    ],
    answer: [1, 3],
    explain: `**Đáp án đúng: So khớp ở mức tổng ròng theo nhóm/kỳ để phát hiện lệch, nhưng vẫn phải truy vết được từng giao dịch cấu thành (drill-down).**

**Tóm tắt:** Net settlement (thanh toán bù trừ ròng) là việc cuối ngày chỉ chuyển phần chênh lệch ròng giữa hai bên thay vì từng giao dịch. Đối soát vẫn làm được: so tổng của bạn với tổng ròng của đối tác; nếu lệch thì mở "hộp đen" từng giao dịch để tìm nguyên nhân. Bỏ qua hay tạo bút toán giả đều sai.

Thuật ngữ:
- **Net settlement (thanh toán ròng)**: thay vì chuyển từng giao dịch, hai bên chỉ chuyển số tiền chênh lệch (A nợ B 100, B nợ A 30 → cuối ngày A chuyển B 70).
- **Gross settlement (thanh toán gộp)**: chuyển từng giao dịch riêng lẻ, không bù trừ.
- **Break (điểm lệch)**: một dòng không khớp giữa hai bên cần điều tra.
- **Drill-down (truy vết xuống chi tiết)**: từ tổng đi xuống từng giao dịch cấu thành.

### Vì sao đúng
- Phương án 1: gom các giao dịch của bạn theo cùng nhóm (cùng đối tác, cùng kỳ, cùng loại) rồi so với tổng ròng. Tổng khớp là dấu hiệu tốt; lệch thì phải truy từng giao dịch để biết giao dịch nào gây break (thiếu, trùng, sai số tiền, làm tròn).
- Phương án 3: nguyên tắc đối soát không đổi — vẫn so khớp và phân loại matched/mismatched/unmatched, chỉ khác là mức khớp tổng hợp; khi có break vẫn phải giải trình được từng giao dịch. Đối soát chỉ ở mức tổng mà không truy được chi tiết thì không đủ tin cậy cho tài chính.
~~~text
Ledger của bạn (gross):  100 + 30 = 130 (A->B 100, B->A 30)
File đối tác (net):      A->B ròng 70
So khớp: 130 - 30 = 100? -> phải nhóm đúng chiều để ra 70; nếu ra 71 -> break 1
   -> drill-down: tìm giao dịch lệch 1 (thường do làm tròn phí)
~~~

### Vì sao các phương án khác sai
- **Bỏ qua file vì chỉ có tổng ròng**: net settlement vẫn phản ánh nghĩa vụ tiền thật; bỏ qua là mất khả năng phát hiện thất thoát/lệch, vi phạm kiểm soát tài chính.
- **Coi mỗi dòng tổng ròng là một giao dịch đơn lẻ và tạo bút toán mới bằng tổng đó**: sẽ ghi trùng/ghi sai — tổng ròng không phải một giao dịch mới mà là kết quả gộp của nhiều giao dịch đã có; tạo bút toán mới làm sổ lệch và mất truy vết.

> Senior tip: Lưu cả gross ledger lẫn kết quả net để đối soát hai chiều. Khi làm việc với net, phải có bảng ánh xạ (mapping) rõ ràng: tổng ròng này gồm những giao dịch nào, theo tiêu chí nhóm nào. Mọi break phải được phân loại nguyên nhân (timing, làm tròn, thiếu, trùng) và theo dõi bằng aging report.`
  },
  {
    id: 'qz-banking-055',
    topic: 'banking',
    q: 'Theo ghi sổ kép, khi khách nộp 5.000.000 tiền mặt vào tài khoản của họ tại ngân hàng, bút toán đúng trên sổ cái của ngân hàng là gì?',
    options: [
      'Nợ (debit) tài khoản khách 5.000.000, có (credit) tiền mặt 5.000.000, vì tài khoản khách tăng',
      'Chỉ ghi có (credit) tài khoản khách 5.000.000, không cần bút toán nợ',
      'Nợ (debit) tài khoản tiền mặt/két của ngân hàng 5.000.000 (tài sản tăng), có (credit) tài khoản tiền gửi khách hàng 5.000.000 (nợ phải trả của ngân hàng tăng)',
      'Nợ tiền mặt 5.000.000, có doanh thu 5.000.000'
    ],
    answer: 2,
    explain: `**Đáp án đúng: Nợ tiền mặt (tài sản ngân hàng tăng) 5.000.000, có tiền gửi khách hàng (nợ phải trả của ngân hàng tăng) 5.000.000.**

**Tóm tắt:** Với ngân hàng, tiền khách gửi là **nợ phải trả** (ngân hàng nợ khách, phải trả lại khi khách yêu cầu). Khi nhận tiền mặt, tài sản (tiền mặt) tăng → ghi nợ; đồng thời nghĩa vụ với khách tăng → ghi có. Đây là điểm khác biệt cốt lõi so với chuyển tiền giữa hai khách.

Thuật ngữ:
- **Tài sản (asset)**: cái ngân hàng sở hữu (tiền mặt, khoản cho vay...). Tài sản tăng → ghi nợ (debit).
- **Nợ phải trả (liability)**: cái ngân hàng nợ người khác (tiền gửi của khách...). Nợ phải trả tăng → ghi có (credit).
- **Tiền gửi khách hàng (customer deposit)**: khoản khách gửi vào ngân hàng; với ngân hàng đây là nợ phải trả.

### Vì sao đúng
Nguyên tắc ghi sổ theo loại tài khoản:
~~~text
Loại tài khoản      Tăng thì ghi gì
Tài sản (tiền mặt)   NỢ (debit)
Nợ phải trả (tiền gửi) CÓ (credit)
Doanh thu            CÓ (credit)
Chi phí              NỢ (debit)
~~~
Khách nộp 5.000.000 tiền mặt:
- Tiền mặt trong két ngân hàng tăng 5.000.000 → tài sản tăng → **nợ tiền mặt 5.000.000**.
- Ngân hàng giờ nợ khách 5.000.000 (phải trả khi khách rút) → nợ phải trả tăng → **có tiền gửi khách hàng 5.000.000**.
Tổng nợ = tổng có = 5.000.000, sổ cân bằng. Bản chất: tiền không "biến mất", nó chuyển từ "tiền mặt trong két" sang "nghĩa vụ phải trả khách", cùng giá trị.

### Vì sao các phương án khác sai
- **Nợ tài khoản khách, có tiền mặt**: hiểu sai bản chất — tài khoản khách (tiền gửi) là nợ phải trả của ngân hàng, khi nó tăng phải ghi **có**, không phải nợ; chiều ghi này sẽ làm sổ hiểu ngược.
- **Chỉ ghi có tài khoản khách, không ghi nợ**: vi phạm sổ kép (thiếu bút toán đối ứng), sổ mất cân bằng, không biết 5.000.000 đến từ đâu.
- **Nợ tiền mặt, có doanh thu**: tiền khách nộp không phải doanh thu của ngân hàng (không phải phí/lãi); ghi vào doanh thu làm sai báo cáo kết quả kinh doanh và phải trả lại tiền cho khách sau này.

> Senior tip: Khi phỏng vấn, nói rõ "tiền gửi khách hàng là nợ phải trả của ngân hàng" — đây là chi tiết Senior hay kiểm tra. Trong hệ thống, nên có bảng account với cột loại (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE) để tự kiểm tra chiều debit/credit và đảm bảo tổng cân bằng.`
  },
  {
    id: 'qz-banking-056',
    topic: 'banking',
    q: 'Bảng idempotency key đặt TTL 24 giờ, một job dọn key cũ chạy mỗi giờ. Một đối tác bị offline lâu, retry một giao dịch sau 25 giờ kể từ lần đầu. Hậu quả có thể xảy ra và cách phòng ngừa đúng là gì?',
    options: [
      'Không có hậu quả gì, vì retry luôn an toàn',
      'Giao dịch sẽ bị từ chối hoàn toàn, đúng như mong muốn',
      'Nên đặt TTL ngắn hơn (1 giờ) để bảng gọn, retry sớm vẫn an toàn',
      'Key đã bị dọn nên hệ thống coi request là mới và có thể trừ tiền lần hai; TTL của key phải dài hơn cửa sổ retry tối đa của đối tác, hoặc lưu kết quả giao dịch (theo mã giao dịch gốc) lâu hơn để tra soát khi retry đến muộn'
    ],
    answer: 3,
    explain: `**Đáp án đúng: Key bị dọn trước khi retry tới → hệ thống tưởng request mới → có nguy cơ trừ tiền hai lần; TTL phải dài hơn cửa sổ retry của đối tác, hoặc lưu kết quả theo mã giao dịch gốc lâu hơn để tra soát.**

**Tóm tắt:** Idempotency key chỉ chống trùng trong khoảng thời gian key còn tồn tại. Nếu key bị xoá (TTL hết hạn, job dọn) mà đối tác vẫn retry, hệ thống không còn "ký ức" về giao dịch cũ và xử lý như request mới. Vì vậy TTL phải bao trùm toàn bộ cửa sổ retry thực tế của đối tác.

Thuật ngữ:
- **TTL (Time To Live)**: thời gian sống của một bản ghi; hết TTL thì bản ghi bị xoá.
- **Cửa sổ retry (retry window)**: khoảng thời gian tối đa mà một bên có thể gửi lại cùng một request (có thể vài giờ đến vài ngày tuỳ đối tác).
- **Idempotency key**: khoá định danh ý định giao dịch, dùng để nhận request trùng.

### Vì sao đúng
~~~text
t=0h   : đối tác gửi GD, key K được lưu, trừ tiền 1.000.000
t=24h  : TTL của K hết hạn
t=25h  : job dọn key K (đã dọn từ 24h)
t=25h  : đối tác retry GD với cùng K
         -> hệ thống tìm K: KHÔNG THẤY -> tưởng request mới
         -> trừ tiền 1.000.000 LẦN NỮA (trùng)
~~~
Cách phòng ngừa:
- Đặt TTL của key **dài hơn** cửa sổ retry tối đa của đối tác (ví dụ đối tác retry tới 72h thì TTL ≥ 7 ngày), và chỉ dọn key khi chắc chắn không còn retry.
- Hoặc lưu kết quả giao dịch lâu hơn (theo mã giao dịch gốc/idempotency key) ở một bảng riêng, để khi retry đến muộn vẫn tra ra và trả kết quả cũ.
- Kết hợp unique constraint trên mã giao dịch nghiệp vụ làm lưới an toàn ở tầng DB, không chỉ dựa vào bảng key.

### Vì sao các phương án khác sai
- **Không có hậu quả vì retry luôn an toàn**: sai — retry chỉ an toàn khi hệ thống còn nhận diện được request trùng; mất key thì retry trở thành giao dịch mới.
- **Giao dịch bị từ chối hoàn toàn, đúng mong muốn**: không đúng nghiệp vụ — nếu lần đầu đã thành công, retry đến muộn cần được trả về kết quả cũ (thành công), không phải từ chối; từ chối khiến đối tác tưởng thất bại và có thể xử lý bù.
- **TTL ngắn hơn (1 giờ) cho gọn**: làm vấn đề nặng thêm — cửa sổ không nhớ ngắn hơn, retry sau 1 giờ chắc chắn bị coi là mới; "gọn bảng" không đáng đánh đổi bằng rủi ro trừ tiền hai lần.

> Senior tip: TTL của idempotency key là ràng buộc nghiệp vụ, không phải tuỳ chọn vận hành. Hỏi đối tác "retry tối đa bao lâu" rồi đặt TTL dài hơn. Với giao dịch đã hoàn tất, cân nhắc giữ bản ghi kết quả (không phải toàn bộ payload) theo mã giao dịch để vừa an toàn vừa không phình DB.`
  },
  {
    id: 'qz-banking-057',
    topic: 'banking',
    multi: true,
    q: 'Trong ngân hàng, ba khái niệm "ngày ghi sổ (posting/booking date)", "ngày giá trị (value date)" và "ngày giao dịch" thường bị nhầm lẫn. Những phát biểu nào đúng? (Chọn 2)',
    options: [
      'Ngày giá trị (value date) là ngày số dư thực sự thay đổi và bắt đầu tính lãi, có thể khác ngày hệ thống ghi bút toán (posting date)',
      'Ba khái niệm này luôn trùng nhau, không cần phân biệt',
      'Ngày posting/booking là ngày hệ thống ghi bút toán vào sổ; nó có thể khác value date (ví dụ giao dịch sau cut-off: posting hôm nay nhưng value date là ngày làm việc kế tiếp)',
      'Value date luôn bằng đúng ngày khách bấm nút thực hiện giao dịch, không bao giờ khác'
    ],
    answer: [0, 2],
    explain: `**Đáp án đúng: Value date là ngày số dư thực sự đổi và tính lãi, có thể khác posting date · Posting date là ngày hệ thống ghi bút toán, cũng có thể khác value date.**

**Tóm tắt:** Một giao dịch có nhiều "ngày" khác nhau vì các hệ thống xử lý và hạch toán không cùng nhịp. Posting date là ngày bút toán được ghi vào sổ; value date là ngày số dư có hiệu lực và bắt đầu tính lãi. Chúng thường trùng nhưng có thể lệch (giao dịch sau cut-off, cuối tuần, ngày lễ).

Thuật ngữ:
- **Posting/booking date (ngày ghi sổ)**: ngày hệ thống thực sự ghi bút toán vào ledger.
- **Value date (ngày giá trị)**: ngày khoản tiền bắt đầu có hiệu lực trên số dư và được tính lãi/hạn mức.
- **Cut-off**: mốc giờ phân loại giao dịch vào ngày làm việc nào (xem qz-banking-035).
- **Ngày giao dịch**: ngày khách thực hiện (có thể trùng posting hoặc value, tuỳ luồng).

### Vì sao đúng
- Phương án 0: value date quyết định lãi và số dư khả dụng thực sự. Ví dụ nộp tiền sau cut-off thứ Sáu: posting ghi thứ Sáu (hệ thống nhận), nhưng value date là thứ Ba (ngày làm việc kế tiếp) → tiền chưa được tính lãi cuối tuần. Hai ngày khác nhau là bình thường.
- Phương án 2: posting date là mốc kỹ thuật "bút toán vào sổ khi nào"; nó phản ánh thời điểm xử lý, không nhất thiết là thời điểm tiền có hiệu lực. Giao dịch sau cut-off là ví dụ điển hình posting ≠ value.
~~~text
Khách chuyển 15h31 thứ Sáu (cut-off 15h30):
   posting date  = thứ Sáu   (hệ thống ghi bút toán ngay)
   value date    = thứ Ba    (ngày làm việc kế tiếp, sau cuối tuần + lễ)
   -> số dư "ghi sổ" đổi thứ Sáu, nhưng "có hiệu lực/tính lãi" từ thứ Ba
~~~

### Vì sao các phương án khác sai
- **Ba khái niệm luôn trùng nhau**: sai — chính vì có cut-off, cuối tuần, ngày lễ và các luồng xử lý khác nhau mà chúng thường lệch; gộp làm một sẽ tính lãi và báo cáo sai.
- **Value date luôn bằng ngày khách bấm nút, không bao giờ khác**: sai — value date do quy tắc nghiệp vụ (cut-off, ngày làm việc) quyết định, không phải thời điểm khách bấm; giao dịch sau cut-off có value date ở tương lai.

> Senior tip: Trong thiết kế, lưu tách bạch posting_date và value_date trên mỗi bút toán, và dùng chung một BusinessDayService để tính value date. Khi đối chiếu với đối tác, làm rõ đang so theo ngày nào — nhiều "break" thực chất là do hai bên hiểu "ngày" khác nhau.`
  },
  {
    id: 'qz-banking-058',
    topic: 'banking',
    q: 'Một giao dịch chuyển tiền 500.000 VND từ tài khoản A sang B đã được ghi nhận (posting). Hôm sau phát hiện sai số tài khoản đích (nhầm B thành C). Cách khắc phục đúng theo sổ kế toán là gì?',
    options: [
      'Xoá bút toán cũ và ghi lại bút toán đúng (A nợ 500.000, B có 500.000)',
      'Ghi bút toán đảo ngược (reversal): A có 500.000, C nợ 500.000; sau đó ghi bút toán đúng: A nợ 500.000, B có 500.000',
      'Chỉ sửa trường account_id trong hàng ledger từ C thành B',
      'Ghi bút toán mới: B nợ 500.000, C có 500.000 (chuyển tiền từ B về C để khấu trừ)'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Ghi bút toán đảo ngược (reversal) để hoàn tác giao dịch sai, sau đó ghi bút toán đúng — không bao giờ xoá hoặc sửa bút toán đã ghi.**
**Tóm tắt:** Nguyên tắc sổ kế toán: bút toán một khi đã ghi vào sổ cái (posted) là bất biến (immutable). Sai sót phải khắc phục bằng bút toán đảo ngược (storno/reversal) rồi ghi lại đúng, để giữ lịch sử truy vết (audit trail) đầy đủ.

### Vì sao đúng
Kịch bản: A chuyển cho B, nhưng hệ thống ghi nhầm sang C.
1. Bút toán gốc (sai): Nợ A 500.000; Có C 500.000.
2. Bút toán reversal (storno): Có A 500.000; Nợ C 500.000 — hoàn tác số dư về trạng thái trước giao dịch.
3. Bút toán đúng: Nợ A 500.000; Có B 500.000.

Sau 3 bước, A giảm 500.000, B tăng 500.000, C về 0 — đúng nghiệp vụ. Lịch sử giữ nguyên cả bút toán sai và reversal để kiểm soát viên (auditor) thấy được quá trình sửa lỗi.

Ví dụ ledger:
~~~text
Gốc (sai):  Nợ A 500.000 | Có C 500.000
Reversal:   Có A 500.000 | Nợ C 500.000
Đúng:       Nợ A 500.000 | Có B 500.000
Kết quả A: -500.000, B: +500.000, C: 0
~~~

### Vì sao các phương án khác sai
- **Xoá bút toán cũ**: vi phạm nguyên tắc bất biến của sổ cái, mất audit trail, không thể giải thích tại sao số dư thay đổi.
- **Sửa account_id trong hàng ledger**: tương tự xoá, làm mất vết tích lịch sử; database ledger thường không cho UPDATE/DELETE trên bảng bút toán.
- **Chuyển từ B về C**: B chưa bao giờ nhận tiền, không thể nợ B; logic nghiệp vụ sai và tạo bút toán không có bằng chứng.

> Senior tip: Thiết kế bảng ledger với cột reversal_of (FK trỏ về transaction_id bị đảo ngược) để truy vết cặp gốc–reversal. Luôn yêu cầu phê duyệt cho reversal (maker-checker).`
  },
  {
    id: 'qz-banking-059',
    topic: 'banking',
    multi: true,
    q: 'Hệ thống dùng idempotency key cho API chuyển tiền. Các tình huống nào có thể gây duplicate charge dù đã có idempotency key? (Chọn 2)',
    options: [
      'Hai service khác nhau (API Gateway và Callback handler) dùng bảng idempotency key riêng biệt, không chia sẻ',
      'Client gửi request với key "txn-123", server xử lý thành công nhưng response bị mất; client retry với key "txn-124" (key mới)',
      'TTL của idempotency key là 24 giờ; đối tác retry sau 30 giờ do sự cố kéo dài',
      'Server lưu key sau khi commit transaction nghiệp vụ, chứ không trong cùng transaction'
    ],
    answer: [1, 2],
    explain: `**Đáp án đúng: Client retry với key mới (không dùng lại key cũ) · TTL key ngắn hơn cửa sổ retry của đối tác.**
**Tóm tắt:** Idempotency key chỉ bảo vệ khi CÙNG KEY được dùng lại. Nếu client tự tạo key mới mỗi lần retry, hoặc key hết hạn trước khi đối tác retry, server sẽ coi là giao dịch mới và xử lý trùng.

### Vì sao đúng
- **Client retry với key mới**: idempotency hoạt động dựa trên định danh ý định. Key mới = ý định mới theo hiểu của server. Client PHẢI giữ nguyên key cho cùng một ý định (ví dụ lưu key ở localStorage hoặc nhận từ server lúc tạo giao dịch).
- **TTL 24h, đối tác retry sau 30h**: key đã bị xoá do hết TTL, request retry đến sau 30h bị coi là mới. TTL phải dài hơn SLA retry tối đa của đối tác (thường 48–72h).

### Vì sao các phương án khác sai
- **Hai service dùng bảng key riêng**: nếu cùng một logical request đi qua hai entrypoint khác nhau (gateway + callback), cần chung kho dữ liệu idempotency (Redis/DB chung) hoặc key phải được truyền xuyên suốt. Việc tách bảng có thể gây duplicate nhưng không phải do cơ chế idempotency bản thân.
- **Lưu key sau commit**: nếu lưu key trong transaction nghiệp vụ (cùng transaction) thì an toàn; nếu lưu SAU commit (transaction riêng) thì có khe hở: crash giữa commit nghiệp vụ và lưu key → key chưa lưu, retry sẽ xử lý lại. Cách đúng là key + nghiệp vụ CÙNG MỘT transaction.

> Senior tip: Tách rõ "idempotency key do client tạo" (cho API public) và "mã tham chiếu nội bộ" (cho hệ thống con). Client public: server cấp key khi tạo intent, client dùng key đó cho mọi retry.`
  },
  {
    id: 'qz-banking-060',
    topic: 'banking',
    q: 'Đối soát hàng ngày giữa ledger nội bộ và sao kê ngân hàng đối tác: file đối tác có 10.000 dòng, ledger nội bộ khớp 9.950 dòng, 50 dòng unmatched. 30 dòng unmatched là "timing difference" (giao dịch cuối ngày đối tác ghi sáng hôm sau). Cách xử lý 30 dòng timing difference đúng nhất là gì?',
    options: [
      'Tạo 30 bút toán điều chỉnh (adjustment) trong ledger nội bộ để khớp số liệu ngay',
      'Đánh dấu 30 dòng là "timing difference", chờ batch ngày hôm sau tự khớp khi đối tác ghi, không tạo bút toán điều chỉnh',
      'Yêu cầu đối tác sửa file sao kê hôm nay để khớp',
      'Bỏ qua 30 dòng vì số lượng ít, không ảnh hưởng tổng tiền'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Đánh dấu là timing difference, chờ ngày sau tự khớp khi đối tác ghi, không tạo bút toán điều chỉnh.**
**Tóm tắt:** Timing difference là chênh lệch do thời điểm ghi nhận khác nhau giữa hai bên (ví dụ cut-off khác nhau, batch chạy khác giờ). Đây KHÔNG phải sai sót, không được tạo bút toán điều chỉnh — chỉ cần theo dõi và xác nhận tự khớp ở kỳ đối soát sau.

### Vì sao đúng
Ví dụ: Khách chuyển tiền 23h50. Ledger nội bộ ghi posting ngay (cùng ngày). Đối tác cổng thanh toán có cut-off 23h00, nên chỉ ghi vào ngày làm việc kế tiếp. Hôm nay đối soát: nội bộ có, đối tác chưa có → unmatched.
- Đây là timing difference hợp pháp, không phải lỗi.
- Xử lý: ghi chú "timing difference", đặt expected_value_date, job tự động verify ngày sau.
- Tạo adjustment sẽ làm ledger sai (ghi hai lần cùng một giao dịch khi ngày sau đối tác thực sự ghi).

### Vì sao các phương án khác sai
- **Tạo bút toán điều chỉnh**: adjustment dùng cho SAI SÓT (sai số tiền, sai tài khoản, thiếu ghi). Timing difference không phải sai sót; tạo adjustment sẽ gây duplicate khi ngày sau đối tác ghi dòng thật.
- **Yêu cầu đối tác sửa file**: đối tác không sửa sao kê chính thức vì chênh lệch thời gian xử lý.
- **Bỏ qua**: phải theo dõi rõ ràng (có danh sách aging), không được "bỏ qua" ngầm. Nếu quá hạn (ví dụ > 3 ngày làm việc) vẫn chưa khớp → escalate.

> Senior tip: Thiết kế bảng reconciliation_breaks với cột break_type (TIMING, AMOUNT, MISSING, EXTRA...), expected_resolution_date. Dashboard operation hiển thị aging theo loại để ưu tiên xử lý AMOUNT/MISSING trước.`
  },
  {
    id: 'qz-banking-061',
    topic: 'banking',
    q: 'Giao dịch thẻ bị "treo" ở trạng thái AUTHORIZED (đã hold tiền, chưa capture/settlement). Sau 7 ngày hold tự động hết hạn (expire), tiền được giải phóng về available balance. Khách hàng than phiền: "Tôi đã mua hàng, tại sao tiền bị trừ rồi lại hoàn về?" Phát biểu nào đúng?',
    options: [
      'Hệ thống lỗi, cần capture thủ công để giữ tiền',
      'Đây là hành vi chuẩn: AUTHORIZED chỉ là hold tạm thời; merchant phải capture trong thời hạn (thường 7 ngày), hết hạn thì hold tự giải phóng — tiền chưa thực sự chuyển cho merchant',
      'Khách hàng bị lừa, giao dịch không hợp lệ',
      'Cần tăng thời gian hold lên 30 ngày để tránh hoàn tiền'
    ],
    answer: 1,
    explain: `**Đáp án đúng: AUTHORIZED chỉ là hold (authorization); merchant phải capture trong thời hạn, hết hạn thì tự giải phóng — đây là hành vi chuẩn của card network (Visa/MC), không phải lỗi.**
**Tóm tắt:** Luồng thẻ: AUTHORIZATION (hold tiền, đảm bảomerchant có thể thu) → CAPTURE/SETTLEMENT (chuyển tiền thật). Nếu merchant không capture trong thời hạn (thường 7 ngày, tùy card scheme), hold tự expire và tiền trở về available balance.

### Vì sao đúng
- **Authorization**: ngân hàng phát thẻ (issuer) khóa số tiền trên hạn mức/available balance, trả mã auth code cho merchant. Tiền CHƯA chuyển cho merchant.
- **Capture**: merchant gửi capture (thường cùng ngày hoặc tối đa vài ngày) để yêu cầu chuyển tiền. Issuer khi nhận capture mới chuyển tiền (settlement) cho acquirer → merchant.
- **Expire**: nếu không capture trong thời hạn, hold tự động nhả. Issuer không bị buộc phải thanh toán nếu không có capture.

Ví dụ timeline:
~~~text
Ngày 0 10:00: Khách swipe thẻ 1.000.000 → AUTHORIZED (hold 1.000.000, available balance giảm)
Ngày 0 14:00: Merchant gửi capture → CAPTURED → settlement T+1/T+2
Hoặc:
Ngày 0 10:00: AUTHORIZED
Ngày 7 23:59: Không capture → hold EXPIRE → available balance khôi phục 1.000.000
~~~

### Vì sao các phương án khác sai
- **Hệ thống lỗi/capture thủ công**: expire là quy tắc card scheme, không phải bug hệ thống. Capture thủ công sau expire thường bị từ chối bởi issuer.
- **Khách bị lừa**: giao dịch hợp lệ, chỉ merchant quên capture.
- **Tăng hold 30 ngày**: card scheme giới hạn tối đa (Visa thường 7 ngày cho POS, 30 ngày cho hotel/car rental); tăng tùy ý vi phạm quy tắc scheme.

> Senior tip: Hiển thị rõ cho khách: "Số dư khả dụng đã trừ hold 1.000.000 (chờ merchant capture)". Cảnh báo merchant qua webhook khi hold sắp expire (ngày thứ 5, 6).`
  },
  {
    id: 'qz-banking-062',
    topic: 'banking',
    multi: true,
    q: 'Ngân hàng đang migrate từ ISO 8583 sang ISO 20022 cho real-time payment. Những thách thức nào là thực tế khi mapping message? (Chọn 2)',
    options: [
      'ISO 20022 dùng XML/JSON phong phú, ISO 8583 dùng field cố định với bitmap; cần mapping hai chiều cho hàng trăm trường, nhiều trường ISO 20022 không có đối ứng trực tiếp trong ISO 8583',
      'Chuyển đổi chỉ cần đổi protocol từ TCP socket sang HTTP/REST, payload giữ nguyên',
      'UETR (Unique End-to-End Transaction Reference) trong ISO 20022 phải được map sang field 11 (STAN) hoặc field 37 (RRN) của ISO 8583, nhưng STAN/RRN chỉ unique per session/acquirer, không đảm bảo unique end-to-end',
      'ISO 20022 message ngắn hơn ISO 8583 nên bandwidth tiết kiệm hơn'
    ],
    answer: [0, 2],
    explain: `**Đáp án đúng: Mapping hai chiều phức tạp do mô hình dữ liệu khác biệt · UETR không map 1-1 được với STAN/RRN của ISO 8583.**
**Tóm tắt:** Migration không chỉ đổi format; mô hình dữ liệu ISO 20022 phong phú hơn (structured, có semantic rõ ràng) so với ISO 8583 (field cố định, bitmap). UETR là end-to-end unique; STAN/RRN chỉ unique trong phạm vi session/acquirer.

### Vì sao đúng
- **Mapping phức tạp**: ISO 20022 có component lồng nhau (PartyIdentification, CashAccount, RemittanceInformation...), ISO 8583 là field phẳng (DE 2, DE 3, DE 4...). Một trường ISO 20022 có thể tách ra nhiều field ISO 8583, hoặc nhiều trường ISO 20022 gộp thành một field 8583. Mapping phải xử lý optional/conditional fields, code list mapping (currency, country, transaction type).
- **UETR vs STAN/RRN**: UETR (UUID) duy nhất xuyên suốt vòng đời giao dịch qua nhiều trung gian. STAN (System Trace Audit Number, 6 số) reset mỗi ngày/session; RRN (Retrieval Reference Number) thêm ngày + STAN. Không thể mapping lossless — cần lưu UETR riêng trong hệ thống khi chuyển sang 8583.

### Vì sao các phương án khác sai
- **Chỉ đổi protocol, payload giữ nguyên**: sai hoàn toàn — payload structure khác hẳn, XML vs binary field-based.
- **ISO 20022 message ngắn hơn**: ngược lại, ISO 20022 XML thường lớn hơn do tag lặp lại và structure phong phú; bandwidth tăng, nhưng bù lại bằng khả năng mở rộng và tự mô tả.

> Senior tip: Chạy song song (dual run) ít nhất 3 tháng: hệ thống mới sinh ISO 20022, adapter dịch sang 8583 gửi legacy; so sánh kết quả settlement hàng ngày. Lưu cả bản gốc 20022 và bản map 8583 để audit.`
  },
  {
    id: 'qz-banking-063',
    topic: 'banking',
    q: 'Hệ thống lưu PAN (số thẻ) đã token hóa: PAN thật được mã hóa AES-256 và lưu trong vault riêng (HSM), backend chỉ giữ token (mã đại diện 16 ký tự). Khi cần hiển thị 4 số cuối PAN cho khách xem trên app, cách làm an toàn và đúng PCI DSS là gì?',
    options: [
      'Gọi API vault giải mã PAN thật, lấy 4 số cuối, trả về app; vault log mọi lần giải mã',
      'Tokenization service trả về 4 số cuối ngay trong token (ví dụ token format: TK_xxxx1234), backend không bao giờ gọi vault giải mã PAN',
      'Backend tự lưu 4 số cuối PAN trong DB riêng (không mã hóa) để hiển thị nhanh',
      'App tự giải mã token bằng public key để lấy 4 số cuối'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Tokenization service thiết kế token chứa 4 số cuối (hoặc trả metadata kèm 4 số cuối), backend không bao giờ gọi vault giải mã PAN thật.**
**Tóm tắt:** Mục đích tokenization là PAN thật không bao giờ rời khỏi vault/HSM. Hiển thị 4 số cuối (masked PAN) nên được hỗ trợ bởi token service (trả masked PAN hoặc embed trong token), không cần giải mã PAN thật.

### Vì sao đúng
- **Token chứa masked PAN**: ví dụ token TK_4242_1234 (prefix + BIN + 4 cuối) hoặc token service có endpoint GET /tokens/{id}/masked trả **** **** **** 1234. Backend/app chỉ nhận masked PAN.
- Vault/HSM chỉ được gọi khi CẦN PAN thật (gửi sang acquirer, network tokenization). Mỗi lần giải mã là một lần PAN xuất hiện trong bộ nhớ → tăng phạm vi PCI DSS và rủi ro lộ dữ liệu.

### Vì sao các phương án khác sai
- **Gọi vault giải mã mỗi lần hiển thị**: PAN thật load vào memory backend, log, tracing, dump → phạm vi PCI DSS mở rộng ra toàn backend. Vault log giải mã không giảm rủi ro ở backend.
- **Backend lưu 4 số cuối trong DB**: 4 số cuối PAN là dữ liệu nhạy cảm (PII), lưu riêng vẫn trong phạm vi PCI DSS nếu liên kết được với token. Không cần thiết vì token service đã cung cấp.
- **App giải mã token**: token không phải mã hóa PAN (thường là random surrogate); không có public key để giải mã. Ngay khi token là encrypted PAN, key không được đưa vào app.

> Senior tip: PCI DSS SAQ-A hoặc SAQ-A-EP yêu cầu PAN không chạm hệ thống merchant. Thiết kế token format: tk_{bin}_{last4}_{random} hoặc dùng network token (EMVCo) — card scheme cấp token, không cần vault riêng.`
  },
  {
    id: 'qz-banking-064',
    topic: 'banking',
    q: 'Backend Java tính phí 0.05% cho giao dịch 1.234.567 VND. Mã: {{BigDecimal fee = amount.multiply(BigDecimal.valueOf(0.0005)).setScale(0, RoundingMode.HALF_EVEN);}} (làm tròn nguyên VND). Kết quả fee là bao nhiêu và tại sao dùng HALF_EVEN (banker\'s rounding) thay vì HALF_UP?',
    options: [
      'Fee = 617 VND; HALF_EVEN làm tròn 5 lên, giống HALF_UP',
      'Fee = 617 VND; HALF_EVEN làm tròn 5 về số chẵn gần nhất, giảm bias tích lũy trên hàng triệu giao dịch',
      'Fee = 618 VND; HALF_EVEN luôn làm tròn lên',
      'Fee = 617 VND; HALF_EVEN chỉ dùng cho tiền tệ có 3 chữ số thập phân'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Fee = 617 VND; HALF_EVEN làm tròn 5 về số chẵn gần nhất, giảm bias tích lũy.**
**Tóm tắt:** 1.234.567 × 0.0005 = 617.2835 VND. Làm tròn nguyên theo HALF_EVEN: phần thập phân .2835 < .5 → làm tròn xuống 617. HALF_EVEN (banker's rounding) khi phần thập phân đúng = 0.5 thì làm tròn về số chẵn gần nhất (617.5 → 618, 616.5 → 616), phân bố đều lên/xuống, tránh bias hệ thống luôn làm tròn lên của HALF_UP.

### Vì sao đúng
Tính toán:
~~~java
BigDecimal amount = new BigDecimal("1234567");
BigDecimal rate = new BigDecimal("0.0005"); // 0.05%
BigDecimal raw = amount.multiply(rate); // 617.2835
int fee = raw.setScale(0, RoundingMode.HALF_EVEN).intValue(); // 617
~~~
- 617.2835: chữ số sau dấu phẩy là 2 (< 5) → làm tròn xuống 617.
- Nếu raw = 617.5: HALF_UP → 618 (luôn lên); HALF_EVEN → 618 (vì 618 chẵn).
- Nếu raw = 616.5: HALF_UP → 617; HALF_EVEN → 616 (vì 616 chẵn).

Trên một triệu giao dịch, HALF_UP khiến tổng phí lệch lên hệ thống (bias dương). HALF_EVEN phân bố đều, tổng phí sát thực tế hơn — quan trọng cho sổ cái ngân hàng.

### Vì sao các phương án khác sai
- **HALF_EVEN làm tròn 5 lên giống HALF_UP**: sai — HALF_EVEN chỉ làm tròn 5 lên khi số nguyên phần chẵn, ngược lại làm tròn xuống.
- **Fee = 618**: sai tính toán (617.2835 làm tròn nguyên là 617).
- **HALF_EVEN chỉ cho 3 chữ số thập phân**: sai — HALF_EVEN áp dụng cho mọi scale, không phụ thuộc đơn vị tiền.

> Senior tip: Luôn dùng {{BigDecimal(String)}} cho hằng số tỷ lệ (0.0005), không dùng {{BigDecimal(double)}} (sai số nhị phân). Định nghĩa {{RoundingMode}} trong constant dùng chung toàn hệ thống (ví dụ {{FEE_ROUNDING = HALF_EVEN}}, {{INTEREST_ROUNDING = HALF_UP}} tuỳ quy định).`
  },
  {
    id: 'qz-banking-065',
    topic: 'banking',
    multi: true,
    q: 'Ngân hàng có cut-off 15:30 cho chuyển tiền trong nước (NAPAS). Thứ Sáu 15:25 khách A chuyển 100 triệu, Thứ Sáu 15:35 khách B chuyển 50 triệu. Thứ Bảy, Chủ Nghỉ; Thứ Hai là ngày lễ. Value date và available balance thay đổi như nào? (Chọn 2)',
    options: [
      'Khách A: value date Thứ Sáu, available balance giảm ngay Thứ Sáu sau batch EOD',
      'Khách B: value date Thứ Ba, available balance giảm Thứ Sáu nhưng tiền chỉ có hiệu lực Thứ Ba',
      'Cả hai đều value date Thứ Sáu vì cùng ngày giao dịch',
      'Khách B: value date Thứ Hai (ngày lễ), available balance không thay đổi Thứ Sáu'
    ],
    answer: [0, 1],
    explain: `**Đáp án đúng: A value date Thứ Sáu, balance giảm Thứ Sáu · B value date Thứ Ba, balance giảm Thứ Sáu nhưng tiền chỉ có hiệu lực Thứ Ba.**
**Tóm tắt:** Cut-off phân chia value date: trước cut-off → value date hôm nay; sau cut-off → value date ngày làm việc kế tiếp. Available balance thường giảm ngay khi giao dịch được chấp nhận (authorization), nhưng tiền chỉ "có hiệu lực" (tính lãi, dùng cho hạn mức) từ value date.

### Vì sao đúng
- **Khách A (15:25 < 15:30)**: trước cut-off → value date Thứ Sáu. Batch EOD Thứ Sáu tổng kết, số dư ledger (posted balance) và available balance đều phản ánh giao dịch này từ Thứ Sáu.
- **Khách B (15:35 > 15:30)**: sau cut-off → value date ngày làm việc kế tiếp. Ngày làm việc sau Thứ Sáu: Thứ Bảy (nghỉ), Chủ Nhật (nghỉ), Thứ Hai (lễ) → Thứ Ba.
  - Available balance: thường giảm ngay khi core chấp nhận giao dịch (để tránh khách chi tiêu trùng hạn mức), nhưng flag {{value_date = Thứ Ba}}.
  - Posted balance (số dư đã ghi sổ): có thể chỉ cập nhật khi batch EOD ngày value date (Thứ Ba), tuỳ thiết kế.
  - Lãi suất, hạn mức thẻ, kiểm tra minimum balance: dùng value date Thứ Ba.

Timeline:
~~~text
Thứ Sáu 15:25: A chuyển -> auth OK -> available balance giảm, value_date = Thứ Sáu
Thứ Sáu 15:35: B chuyển -> auth OK -> available balance giảm, value_date = Thứ Ba
Thứ Sáu EOD: batch tổng kết A; B vẫn pending value_date
Thứ Ba EOD: batch tổng kết B (posted balance cập nhật)
~~~

### Vì sao các phương án khác sai
- **Cả hai value date Thứ Sáu**: B sau cut-off, không được value date hôm nay.
- **B value date Thứ Hai**: Thứ Hai là ngày lễ, không phải ngày làm việc; value date phải là ngày làm việc (business day).

> Senior tip: Tách biệt {{available_balance}} (dùng cho authorization, giảm ngay) và {{ledger_balance}}/{{posted_balance}} (dùng cho báo cáo, cập nhật theo value_date). Luôn dùng BusinessDayService tập trung để tính value_date.`
  },
  {
    id: 'qz-banking-066',
    topic: 'banking',
    q: 'Hệ thống core banking dùng Oracle, cần migrate sang PostgreSQL. Bảng ledger có cột {{amount NUMBER(19,4)}}. Khi migrate sang PostgreSQL, kiểu dữ liệu nào tương đương an toàn nhất cho tiền tệ?',
    options: [
      'REAL (4 byte float)',
      'DOUBLE PRECISION (8 byte float)',
      'NUMERIC(19,4) hoặc DECIMAL(19,4)',
      'BIGINT lưu số tiền nhân 10.000'
    ],
    answer: 2,
    explain: `**Đáp án đúng: NUMERIC(19,4) hoặc DECIMAL(19,4) — kiểu điểm cố định (fixed-point) chính xác, tương đương Oracle NUMBER(19,4).**
**Tóm tắt:** Tiền tệ bắt buộc dùng kiểu số chính xác (exact numeric). PostgreSQL NUMERIC/DECIMAL lưu chính xác đến scale chỉ định, không có sai số biểu diễn như float/double. BIGINT nhân 10.000 cũng chính xác nhưng mất ngữ nghĩa scale, dễ nhầm lẫn khi đọc/ghi.

### Vì sao đúng
- **Oracle NUMBER(19,4)**: 19 chữ số tổng cộng, 4 chữ số thập phân. Ví dụ: 999.999.999.999.999,9999 (15 chữ số nguyên + 4 thập phân).
- **PostgreSQL NUMERIC(19,4)**: tương đương chính xác, storage biến đổi (khoảng 8–10 byte), tính toán chính xác, hỗ trợ scale.
- **NUMERIC vs DECIMAL**: trong PostgreSQL là alias nhau; SQL standard: NUMERIC scale chính xác, DECIMAL scale tối thiểu. Dùng NUMERIC cho rõ ý định.

### Vì sao các phương án khác sai
- **REAL/DOUBLE PRECISION**: float nhị phân, KHÔNG biểu diễn chính xác 0.1, 0.01... Sai số tích lũy không chấp nhận được cho ledger.
- **BIGINT x 10.000**: chính xác về mặt toán học nhưng:
  - Application phải tự nhân/chia 10.000 ở mọi chỗ → dễ quên, bug.
  - Không tự mang thông tin "đây là tiền VND 4 chữ số thập phân"; khác tiền tệ khác scale (JPY 0, USD 2).
  - Query trực tiếp DB thấy số nguyên lớn, khó debug.
  - Migration data: phải nhân 10.000 cho mọi dòng, rủi ro overflow nếu vượt 19 chữ số.

> Senior tip: Dùng NUMERIC(19,4) cho tiền VND (4 chữ số thập phân cho phép tính lãi chính xác). Map JPA: {{@Column(precision = 19, scale = 4) private BigDecimal amount;}}. Không bao giờ dùng float/double cho tiền.`
  },
  {
    id: 'qz-banking-067',
    topic: 'banking',
    q: 'Saga pattern cho chuyển tiền liên ngân hàng: Service A (initiator) gọi Service B (ngân hàng nhận) qua async message. B xử lý thành công và reply. Sau đó A cập nhật trạng thái SUCCESS. Nếu A crash SAU khi B reply thành công NHƯNG TRƯỚC khi A cập nhật SUCCESS, khi A restart phải làm gì?',
    options: [
      'Gửi lại request sang B để xử lý lại (retry)',
      'Không làm gì, đợi B gửi callback lần nữa',
      'Query trạng thái thực tế từ B (idempotent inquiry) rồi cập nhật local state cho khớp; không gửi request nghiệp vụ mới',
      'Đánh dấu giao dịch FAILED và hoàn tiền cho khách'
    ],
    answer: 2,
    explain: `**Đáp án đúng: Query trạng thái thực tế từ B (idempotent inquiry) rồi đồng bộ local state; không gửi request nghiệp vụ mới.**
**Tóm tắt:** Saga step đã thành công ở participant (B) nhưng orchestrator (A) chưa kịp lưu state. Khi recover, A phải **hỏi trạng thái thực tế** (inquiry) thay vì retry nghiệp vụ. Retry có thể gây duplicate ở B (nếu B không idempotent) hoặc tạo giao dịch mới.

### Vì sao đúng
Kịch bản:
1. A gửi {{TransferRequest}} (có idempotency key) → B.
2. B xử lý, ghi ledger, reply {{TransferResponse SUCCESS}} (đã lưu idempotency key).
3. A nhận response, chuẩn bị {{UPDATE status=SUCCESS}} → CRASH (power loss, OOM kill).
4. A restart, đọc DB: giao dịch vẫn {{PENDING}}.

Xử lý recover:
- A gọi endpoint inquiry sang B với CÙNG idempotency key hoặc correlation ID:
~~~text
GET /transfers/{id}/status
~~~
- B trả {{SUCCESS}} (đã xử lý, không chạy lại vì key đã tồn tại).
- A cập nhật local {{status=SUCCESS}} → consistent.

Đây là nguyên tắc **state reconciliation** (đối soát trạng thái) trong distributed saga: orchestrator recover bằng cách query participant, không replay command.

### Vì sao các phương án khác sai
- **Gửi lại request (retry)**: nếu B không idempotent hoặc key khác, B xử lý lần 2 → duplicate. Ngay khi B idempotent, retry vẫn tốn tài nguyên và làm phức tạp logic.
- **Đợi callback**: B đã reply xong, không callback lần 2 trừ khi có cơ chế riêng (webhook retry), không đáng tin cậy cho recover.
- **Đánh dấu FAILED + hoàn tiền**: sai nghiệp vụ — giao dịch THÀNH CÔNG ở B, đánh giá FAILED và hoàn tiền sẽ tạo reversal không cần thiết, làm rối ledger.

> Senior tip: Thiết kế saga state machine: {{PENDING}} → {{IN_PROGRESS}} (đã gửi) → {{WAITING_RESPONSE}} → {{SUCCESS}}/{{FAILED}}. Recovery job định kỳ quét {{IN_PROGRESS}}/{{WAITING_RESPONSE}} quá hạn (ví dụ > 5 phút), gọi inquiry sang participant, đồng bộ state. Luôn log correlation_id xuyên suốt.`
  },
  // ===================== scenario (new round 4) =====================
  {
    id: 'qz-scenario-041',
    topic: 'scenario',
    q: 'API lịch sử giao dịch trả chậm đột ngột từ 50 ms lên 3 giây. Metric cho thấy CPU database tăng vọt, không có deploy mới, traffic không tăng. Truy vấn chính là {{SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 20}}. Nguyên nhân khả dĩ nhất và cách kiểm tra nhanh?',
    options: [
      'Index trên {{user_id}} bị fragment hoặc statistics lỗi, chạy {{ANALYZE}} hoặc {{REINDEX}}',
      'Lỗi network giữa app và DB, cần restart connection pool',
      'Garbage collection của JVM app đang dọn dẹp object lớn, làm chậm request',
      'Plan cache của PostgreSQL bị xóa do restart DB, query lần đầu chạy chậm'
    ],
    answer: 0,
    explain: `**Đáp án đúng: Index bị fragment hoặc statistics lỗi, chạy ANALYZE/REINDEX.**
 
### Vì sao đúng
- Khi không có thay đổi code hay traffic, mà query từng index nhanh bỗng chậm, nguyên nhân thường là **statistics cũ** làm planner chọn sai plan (ví dụ seq scan thay vì index scan), hoặc **index bloat** (fragment) làm đọc nhiều page hơn.
- {{ANALYZE}} cập nhật statistics cho planner; {{REINDEX}} xây lại index loại bỏ bloat. Cả hai an toàn và thường khôi phục hiệu năng ngay.
- Kiểm tra nhanh: {{EXPLAIN (ANALYZE, BUFFERS) SELECT ...}} để xem plan thực tế (seq scan hay index scan, rows returned, buffers hit/read).
 
### Vì sao các phương án khác sai
- **Lỗi network**: thường gây timeout hoặc error, không làm query chậm đều đặn 3 giây.
- **GC của JVM app**: làm chậm app, không làm tăng CPU của database server.
- **Plan cache xóa do restart DB**: query đầu tiên sau restart có thể chậm do compile, nhưng query sau sẽ cache; không giải thích việc chậm liên tục.
 
> Senior tip: Bật {{track_io_timing}} và {{auto_explain}} log query chậm (> 1s) để phát hiện sớm khi plan thay đổi. Cảnh báo khi {{seq_scan}} ratio tăng trên bảng có index.`
  },
  {
    id: 'qz-scenario-042',
    topic: 'scenario',
    multi: true,
    q: 'Pool connection HikariCP của service báo exhausted (cạn kiệt) lúc cao điểm: {{pool=HikariPool-1, max=20, active=20, idle=0, waiting=150}}. App không deploy mới, traffic tăng nhẹ 10%. Những nguyên nhân/biện pháp nào hợp lý? (Chọn 2)',
    options: [
      'Query mới chậm (missing index, lock contention) làm thời gian giữ connection tăng, pool cạn dù traffic tăng ít; cần EXPLAIN query chậm và fix index/lock',
      'Tăng {{maximumPoolSize}} lên 100 để chắc chắn không bao giờ cạn',
      'Giảm {{connectionTimeout}} xuống 100 ms để fail fast và trả lỗi cho client nhanh hơn',
      'Bật {{leakDetectionThreshold}} (ví dụ 30s) và log stack trace nơi connection bị rò rỉ (quên close/return), fix leak trong code'
    ],
    answer: [0, 3],
    explain: `**Đáp án đúng: Query chậm làm tăng thời gian giữ connection; và bật leak detection để tìm connection leak.**
 
### Vì sao đúng
- **Nguyên nhân 1 - Query chậm**: traffic tăng nhẹ nhưng connection cạn nghĩa là mỗi request giữ connection lâu hơn. Thường do query mới/chậm (thiếu index, lock contention, plan regression) hoặc gọi DB trong vòng lặp. Fix root cause: tối ưu query, thêm index, giảm lock scope.
- **Nguyên nhân 2 - Connection leak**: code lấy connection từ pool nhưng không trả lại (quên {{close()}}, exception bypass finally, reactive code không subscribe). {{leakDetectionThreshold}} log stack trace nơi connection được lấy nhưng không trả, giúp pinpoint leak.
- Kết hợp: metric {{hikaricp.connections.active}} tăng dần theo thời gian (leak) hoặc tăng đột ngột lúc query chậm.
 
### Vì sao các phương án khác sai
- **Tăng maxPoolSize lên 100**: chỉ trì hoãn cạn, không sửa gốc. 100 connection tốn RAM, CPU context switch, và DB có thể quá tải (max_connections). Connection pool không phải buffer vô hạn.
- **Giảm connectionTimeout 100ms**: làm client nhận lỗi 429/500 thay vì chờ; không giải quyết việc query chậm hay leak. Timeout hợp lý thường 5-30 giây.
 
> Senior tip: Luôn đặt {{connectionTimeout}} > {{maxLifetime}} của query chậm nhất. Monitor {{hikaricp.connections.usage}} (active/max) và cảnh báo > 80%. Leak detection chỉ bật ở non-production hoặc production với threshold cao (30s+) để tránh noise.`
  },
  {
    id: 'qz-scenario-043',
    topic: 'scenario',
    q: 'Consumer Kafka group {{order-service}} lag tăng từ 0 lên 500 nghìn trong 30 phút, sau đó ổn định ở mức cao. Metric {{records-consumed-rate}} bằng 0, {{fetch-rate}} thấp. Log consumer không có error, chỉ log {{poll}} đều đặn. Nguyên nhân khả dĩ nhất?',
    options: [
      'Broker partition leader đang election, consumer chờ metadata refresh',
      'Consumer bị stuck ở một record (poison pill) do deserialization error, cấu hình retry vô hạn chặn toàn bộ partition',
      'Network giữa consumer và broker bị gãy gọn, consumer không nhận được record',
      'Topic bị xóa partition nên consumer không tìm thấy offset'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Poison pill (record độc) chặn partition do deserialization error + retry vô hạn.**
 
### Vì sao đúng
- Kafka xử lý tuần tự trong partition. Một record lỗi vĩnh viễn (JSON sai schema, Avro schema mismatch) khiến deserializer ném exception.
- Nếu cấu hình {{DefaultErrorHandler}} với retry không giới hạn (hoặc {{BackOff}} không có maxAttempts), consumer sẽ retry mãi record đó, không bao giờ commit offset, không poll record tiếp theo -> lag tăng, {{records-consumed-rate}} = 0.
- Log {{poll}} đều đặn vì consumer vẫn gọi poll nhưng không xử lý được record nào.
- Fix: cấu hình retry giới hạn (ví dụ {{maxAttempts=3}}) + {{DeadLetterPublishingRecoverer}} đẩy record lỗi sang DLT, commit offset và đi tiếp. Dùng {{ErrorHandlingDeserializer}} để lỗi deserialize không crash listener.
 
### Vì sao các phương án khác sai
- **Broker leader election**: thường mất vài giây, consumer reconnect và tiếp tục; không gây lag 500k ổn định 30 phút.
- **Network gãy gọn**: consumer sẽ log error disconnect, rebalance liên tục, không chỉ lag tăng yên lặng.
- **Topic bị xóa partition**: không thể xóa partition trong Kafka; chỉ có thể tăng. Nếu partition giảm do replication factor thì consumer sẽ rebalance, không gây stuck yên lặng.
 
> Senior tip: Cảnh báo khi {{consumer-lag}} > ngưỡng (ví dụ 10k) và {{records-consumed-rate}} = 0. DLT cần có chủ: dashboard đếm, alert, và tool replay sau khi fix bug deserialize.`
  },
  {
    id: 'qz-scenario-044',
    topic: 'scenario',
    multi: true,
    q: 'Sau khi deploy version mới, pod Spring Boot bị OOMKilled (exit 137) sau 20 phút chạy, heap dump không tạo được. Memory limit 2Gi, {{-Xmx2g}}. Những nguyên nhân/biện pháp nào đúng? (Chọn 2)',
    options: [
      'Heap được phép dùng 2Gi chạm limit container, cộng thêm metaspace, thread stack (~1MB/thread), code cache, direct buffer, GC structure làm RSS vượt limit; cần đặt {{-XX:MaxRAMPercentage=75}} (heap ~1.5Gi) và bật Native Memory Tracking',
      'Memory leak trong heap, cần tăng {{-Xmx}} lên 4Gi',
      'GC pause quá lâu làm Kubernetes liveness probe fail, pod bị kill; cần tăng liveness timeout',
      'Direct buffer của Netty không giới hạn, đặt {{-XX:MaxDirectMemorySize=512m}} và dùng pooled allocator'
    ],
    answer: [0, 3],
    explain: `**Đáp án đúng: Tổng RSS (heap + off-heap) vượt container limit; cần giảm heap % và giới hạn direct memory.**
 
### Vì sao đúng
- Container limit = 2Gi giới hạn **toàn bộ RSS** (Resident Set Size) của process, không chỉ heap. JVM dùng: heap ({{-Xmx}}), metaspace (class metadata), thread stack (~1MB x số thread, 200 thread = 200MB), code cache (JIT), direct buffer (Netty/NIO), GC internal structures.
- {{-Xmx2g}} = cho phép heap dùng tới 2Gi, cộng off-heap thường 300-800MB -> RSS > 2Gi -> kernel OOM killer kill process (SIGKILL, exit 137). JVM không kịp ghi log hay heap dump.
- Sửa: {{-XX:MaxRAMPercentage=75}} (JVM tự tính theo cgroup limit) hoặc {{-Xmx1536m}}; {{-XX:MaxDirectMemorySize=512m}}; bật NMT {{-XX:NativeMemoryTracking=summary}} để {{jcmd <pid> VM.native_memory}} xem chi tiết off-heap.
 
### Vì sao các phương án khác sai
- **Memory leak heap, tăng Xmx**: nếu leak thì heap dump hoặc OOME trong log sẽ xuất hiện; OOMKilled = bị kill từ bên ngoài, không phải JVM ném OOME. Tăng heap làm RSS lớn hơn -> kill nhanh hơn.
- **GC pause làm liveness fail**: liveness fail = SIGTERM (exit 143), không phải OOMKilled (137). GC pause có thể gây latency nhưng không kill process.
 
> Senior tip: Đặt {{memory request = limit}} cho Java pod (Guaranteed QoS) tránh evict. Cảnh báo {{container_memory_working_set_bytes > 90% limit}} trong 10 phút -> scale hoặc investigate trước khi OOMKilled.`
  },
  {
    id: 'qz-scenario-045',
    topic: 'scenario',
    q: 'Cache sản phẩm dùng Redis TTL 5 phút. Một sản phẩm hot bị update giá, ngay sau đó 10.000 request/giây đọc sản phẩm này. Cache miss -> 10.000 request cùng lúc đánh vào DB (cache stampede). Cách giảm thiệt hại hiệu quả nhất?',
    options: [
      'Tăng TTL lên 1 giờ để giảm cache miss',
      'Dùng distributed lock (Redis SET NX) khi cache miss: chỉ 1 request nạp DB, các request khác chờ lock rồi đọc cache; lock có TTL ngắn (ví dụ 5s) để tránh deadlock',
      'Tắt cache cho sản phẩm hot này, đọc thẳng DB',
      'Tăng connection pool DB lên 500 để chịu được 10k request'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Dùng distributed lock (SET NX) khi cache miss để chỉ 1 request nạp DB, các request khác chờ rồi đọc cache.**
 
### Vì sao đúng
- **Cache stampede**: key hot hết hạn -> hàng nghìn request cùng miss -> cùng gọi DB -> DB quá tải, thậm chí sập.
- **Single-flight / Request coalescing**: khi cache miss, request đầu tiên {{SET key:lock NX EX 5}} thành công, nạp DB, set cache, xoá lock. Các request khác thấy lock tồn tại -> chờ (sleep 10-50ms) -> retry đọc cache -> hit.
- Lock TTL ngắn (5-10s) đảm bảo nếu request nạp DB crash, lock tự hết hạn, request khác không chờ mãi.
- Pattern này gọi là "singleflight" hoặc "request coalescing", thư viện Go {{singleflight}}, Java có thể tự implement hoặc dùng Redis Lua script atomic.
 
### Vì sao các phương án khác sai
- **Tăng TTL 1 giờ**: chỉ giảm tần suất stampede, không xóa bỏ. Key vẫn sẽ hết hạn lúc nào đó và stampede xảy ra. Càng TTL dài càng dễ dữ liệu cũ.
- **Tắt cache cho sản phẩm hot**: DB chịu 10k QPS đọc, khả năng cao sập ngay. Cache stampede là vấn đề *khi* miss, không phải cache sai.
- **Tăng pool DB 500**: connection pool không xử lý được 10k QPS đồng thời; DB vẫn quá tải CPU/I/O.
 
> Senior tip: Kết hợp thêm **probabilistic early expiration** (random jitter trên TTL, ví dụ TTL = 300s + random(0-60s)) để key không hết hạn cùng lúc. Với key cực hot, có thể dùng **cache warming** (job nạp trước khi TTL gần hết) hoặc **stale-while-revalidate** (trả cache cũ trong khi nạp mới nền).`
  },
  {
    id: 'qz-scenario-046',
    topic: 'scenario',
    multi: true,
    q: 'Service A gọi service B qua REST. B chậm (p99 10s) do sự cố downstream. A cấu hình retry 3 lần, timeout 5s. Kết quả: A cạn thread pool, toàn bộ A ngừng phục vụ request khác. Những biện pháp nào bảo vệ A? (Chọn 2)',
    options: [
      'Circuit breaker: sau ngưỡng lỗi (ví dụ 50% trong 10s) mở mạch, fail fast trong khoảng thời gian chờ, không gọi B nữa',
      'Tăng thread pool A lên 1000 để chứa thêm request chờ B',
      'Bulkhead: tách thread pool/connection pool riêng cho việc gọi B, lỗi B chỉ cạn pool đó, không ảnh hưởng luồng khác của A',
      'Tăng timeout lên 30s để B kịp trả lời, giảm retry'
    ],
    answer: [0, 2],
    explain: `**Đáp án đúng: Circuit breaker để fail fast khi B lỗi; Bulkhead để cô lập tài nguyên gọi B.**
 
### Vì sao đúng
- **Vấn đề cascading failure**: B chậm -> A retry 3 lần x 5s = 15s giữ thread cho 1 request. 100 request cùng lúc = 100 thread bận 15s -> pool cạn -> request khác (không liên quan B) cũng thất bại.
- **Circuit breaker**: theo dõi tỷ lệ lỗi/timeout. Mở mạch (OPEN) khi vượt ngưỡng -> fail fast ngay lập tức (trả lỗi degradable) thay vì chờ timeout. Half-open sau một khoảng thử lại B. Thư viện: Resilience4j, Spring Retry + CircuitBreaker.
- **Bulkhead**: cấp pool thread/connection **riêng** cho client gọi B (ví dụ 20 thread). B chậm chỉ làm đầy pool này; các luồng khác của A (gọi C, đọc cache, v.v.) dùng pool khác -> không bị ảnh hưởng. Resilience4j {{Bulkhead}} hoặc cấu hình {{WebClient}}/{{RestClient}} riêng pool.
 
### Vì sao các phương án khác sai
- **Tăng thread pool 1000**: chỉ trì hoãn cạn, tốn RAM/CPU, context switch chậm; B vẫn chậm, retry vẫn giữ thread lâu. Không sửa root cause.
- **Tăng timeout 30s**: giữ thread lâu hơn (3 retry x 30s = 90s/request), pool cạn nhanh hơn, request khác thất bại nhanh hơn.
 
> Senior tip: Kết hợp cả ba: timeout hợp lý (1-2s), circuit breaker, bulkhead. Với Spring Cloud, dùng {{Resilience4j}} annotation {{@CircuitBreaker}}, {{@Bulkhead}}, {{@Retry}} trên method client. Metric: circuit breaker state, bulkhead available permits.`
  },
  {
    id: 'qz-scenario-047',
    topic: 'scenario',
    q: 'Retry storm: client gọi API, lỗi 500, retry 3 lần ngay lập tức. 100 client cùng làm vậy -> API nhận gấp 4 lần tải, lỗi nhiều hơn, client retry nhiều hơn -> vòng luẩn quẩn. Cách thiết kế retry đúng?',
    options: [
      'Retry ngay lập tức không giới hạn cho tới khi thành công',
      'Exponential backoff + jitter: chờ 1s, 2s, 4s... + random(0-500ms); giới hạn max retry (3-5); chỉ retry lỗi tạm thời (429, 5xx), không retry 4xx; có retry budget (tổng retry <= 10% traffic)',
      'Retry 10 lần với fixed delay 100ms',
      'Không retry, trả lỗi ngay để client tự xử lý'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Exponential backoff + jitter, giới hạn retry, chỉ retry lỗi tạm thời, có retry budget.**
 
### Vì sao đúng
- **Retry storm**: nhiều client retry đồng thời -> tải dồn lên service đang yếu -> service sập tiếp -> retry nhiều hơn.
- **Exponential backoff**: thời gian chờ tăng gấp đôi mỗi lần (1s, 2s, 4s...) -> phân tán retry theo thời gian, cho service hồi phục.
- **Jitter**: thêm ngẫu nhiên nhỏ (0-500ms) -> tránh thundering herd (hàng nghìn client retry cùng lúc sau đúng 1s).
- **Chỉ retry lỗi tạm thời**: 429 (rate limit), 5xx (server error). Không retry 4xx (bad request, unauthorized) vì retry không giải quyết được.
- **Retry budget**: giới hạn tổng số retry trong hệ thống (ví dụ <= 10% request) để không làm đầy queue/service khi đang quá tải.
- Thư viện: Resilience4j {{RetryConfig}}, Spring Retry {{@Retryable}} với {{BackOffPolicy}}.
 
### Vì sao các phương án khác sai
- **Retry ngay vô hạn**: chính là cấu trúc retry storm, dồn tải, không bao giờ hồi phục.
- **Fixed delay 100ms x 10**: không backoff, vẫn thundering herd; 10 lần retry nhân 10 tải.
- **Không retry**: mất khả năng tự hồi phục từ lỗi tạm thời (network blip, GC pause); client phải tự implement retry -> lặp lại sai lầm.
 
> Senior tip: Kiểm tra retry ẩn: HTTP client, AWS SDK, DB driver, service mesh (Istio) đều có thể tự retry. Nhiều storm do hai lớp retry cùng bật mà không ai biết. Tắt retry ở tầng dưới (driver, mesh), chỉ retry ở tầng ứng dụng với config rõ ràng.`
  },
  {
    id: 'qz-scenario-048',
    topic: 'scenario',
    multi: true,
    q: 'Database primary failover sang standby (DNS endpoint cập nhật trong 30s). Ứng dụng Java (HikariCP, PostgreSQL JDBC) vẫn báo lỗi kết nối hoặc treo thêm 10-15 phút mới tự hết. Những cấu hình nào giúp giảm thời gian này? (Chọn 2)',
    options: [
      'Đặt {{socketTimeout}} (JDBC) và {{tcpKeepAlive=true}} để connection cũ phát hiện chết sớm; đặt {{maxLifetime}} HikariCP ngắn hơn hạ tầng (ví dụ 30 phút); đặt {{keepaliveTime}} HikariCP kiểm tra connection rảnh',
      'Tăng {{connectionTimeout}} HikariCP lên 60s để chờ DNS cập nhật',
      'Tắt DNS cache của JVM ({{networkaddress.cache.ttl=0}}) hoặc đặt thấp (30-60s) để IP mới được resolve ngay',
      'Chuyển sang connection pool khác (ví dụ DBCP2) hỗ trợ failover tốt hơn'
    ],
    answer: [0, 2],
    explain: `**Đáp án đúng: Cấu hình socket timeout/keepalive cho JDBC + maxLifetime/keepaliveTime Hikari + TTL DNS thấp.**
 
### Vì sao đúng
- Khi primary fail, connection TCP trong pool vẫn trỏ IP cũ. Không có FIN/RST -> connection "treo" cho tới khi TCP retransmission timeout của OS (Linux mặc định ~15 phút).
- **socketTimeout** (JDBC): query không chờ vô hạn, ném exception sau timeout -> pool loại connection xấu.
- **tcpKeepAlive**: bật TCP keepalive probe, phát hiện peer chết nhanh hơn (phút thay vì 15 phút).
- **HikariCP maxLifetime** (ví dụ 30 phút): connection cũ bị xoá định kỳ, buộc tạo connection mới theo IP mới.
- **HikariCP keepaliveTime**: test connection rảnh (SELECT 1) trước khi cho mượn, loại connection chết.
- **JVM DNS cache TTL** ({{networkaddress.cache.ttl}}): mặc định cache dương (không bao giờ hết hạn) khi security manager bật, hoặc cache lâu. Đặt 30-60s để resolve IP mới sau failover.
 
### Vì sao các phương án khác sai
- **Tăng connectionTimeout 60s**: chỉ làm client chờ lâu hơn khi lấy connection; không giải quyết connection cũ treo trong pool.
- **Chuyển pool khác**: HikariCP đã hỗ trợ đầy đủ; vấn đề nằm ở cấu hình timeout, không phải pool.
 
> Senior tip: Game day: chủ động failover ở staging, đo thời gian từ failover đến error rate = 0. Con số này mới là RTO thật. Cảnh báo {{hikaricp.connections.pending}} tăng bất thường.`
  },
  {
    id: 'qz-scenario-049',
    topic: 'scenario',
    q: 'Topic Kafka {{payments}} 12 partition, consumer group 12 pod, lag tăng lúc cao điểm. Scale lên 20 pod nhưng lag không giảm. Team cấu hình {{max.poll.records=500}}, {{max.poll.interval.ms=300000}}. Mỗi record xử lý 1 giây. Nguyên nhân và cách xử lý?',
    options: [
      'Kafka cần vài giờ để cân bằng lại, cứ chờ lag sẽ giảm',
      'Trong một consumer group, mỗi partition chỉ giao cho tối đa 1 consumer; 12 partition = tối đa 12 consumer làm việc; 8 pod thừa ngồi không. Cần tăng partition (lưu ý key distribution) hoặc tăng tốc xử lý (batch, parallel consumer)',
      'Broker giới hạn 12 consumer/topic, cần tăng config broker',
      'Consumer group bị rebalance liên tục do heartbeat timeout, cần tăng session.timeout.ms'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Số partition là trần độ song song trong consumer group; 12 partition = max 12 consumer hoạt động.**
 
### Vì sao đúng
- Kafka giao mỗi partition cho đúng 1 consumer trong group để giữ thứ tự. 12 partition -> tối đa 12 consumer xử lý song song. 8 pod scale thêm idle (chỉ làm standby khi pod khác chết).
- **max.poll.records=500**, mỗi record 1s -> 500s xử lý một batch > {{max.poll.interval.ms=300000}} (5 phút) -> consumer bị coi là chết, rebalance, lag tăng thêm. Cần giảm {{max.poll.records}} (ví dụ 50) hoặc tăng {{max.poll.interval.ms}}.
- Hướng xử lý lag:
  - Tăng partition (ví dụ 24, 48). Lưu ý: key mapping {{hash(key) % partitions}} thay đổi -> cùng key có thể đổi partition, thứ tự tạm bị đảo.
  - Tối ưu xử lý: batch write DB, async I/O, hoặc dùng Confluent Parallel Consumer (xử lý song song trong partition nhưng giữ thứ tự theo key).
 
### Vì sao các phương án khác sai
- **Chờ vài giờ**: rebalance xong trong giây; partition không tự tăng.
- **Broker giới hạn 12 consumer**: không có giới hạn này; giới hạn từ partition.
- **Rebalance do heartbeat**: heartbeat chạy thread riêng; stuck processing gây ra bởi max.poll.interval.ms, không phải session.timeout.ms.
 
> Senior tip: Tạo topic với partition ước lượng theo peak throughput / throughput một consumer, cộng dư 2-3x. Tăng partition dễ, giảm thì không làm được.`
  },
  {
    id: 'qz-scenario-050',
    topic: 'scenario',
    multi: true,
    q: 'Sự cố production: 20h thứ Sáu, tỷ lệ thanh toán thành công giảm từ 99% xuống 60%. 9 kỹ sư nhảy vào chat, mỗi người thử một giả thuyết, có người chuẩn bị hotfix. Vai trò senior, bạn làm gì? (Chọn 2)',
    options: [
      'Chỉ định một Incident Commander điều phối, tách người phụ trách giao tiếp (cập nhật stakeholder 30 phút/lần) khỏi nhóm điều tra',
      'Chờ tìm ra root cause rồi mới rollback, tránh rollback nhầm',
      'Cho mỗi người tự deploy hotfix của mình song song cho nhanh',
      'Ưu tiên mitigation trước: kiểm tra thay đổi gần nhất (deploy, config, feature flag) và rollback/tắt flag nếu liên quan, sau đó mới điều tra root cause'
    ],
    answer: [0, 3],
    explain: `**Đáp án đúng: Lập Incident Commander + tách vai trò giao tiếp; ưu tiên mitigation (rollback/tắt flag) trước khi tìm root cause.**
 
### Vì sao đúng
- **Incident Commander (IC)**: 9 người tự do điều tra -> thay đổi chồng chéo, không ai biết gì đã đổi. IC phân việc (ai xem log thanh toán, ai kiểm tra đối tác, ai xem thay đổi gần đây), quyết định hành động, ghi timeline. Người giao tiếp (Communications Lead) chắn câu hỏi từ management, để nhóm kỹ thuật tập trung.
- **Mitigate trước**: Mỗi phút sự cố = mất doanh thu. Phần lớn sự cố từ thay đổi gần đây; rollback/tắt feature flag rẻ, đảo ngược được, thường khôi phục dịch vụ. Root cause tìm sau trên môi trường ổn định.
- **Runbook**: Team nên có runbook sự cố định sẵn: severity levels, tiêu chí rollback (ví dụ success rate < 95% trong 5p sau deploy -> rollback ngay không cần họp).
 
### Vì sao các phương án khác sai
- **Chờ root cause mới rollback**: kéo dài ảnh hưởng; rollback nhầm chi phí thấp, chờ chi phí cao.
- **Mỗi người tự deploy hotfix**: nhiều thay đổi cùng lúc làm tình huống khó hiểu, có thể gây sự cố thứ 2, không biết fix nào có tác dụng.
 
> Senior tip: Postmortem phải blameless (không đổ lỗi cá nhân). Câu hỏi đúng: "Hệ thống nào cho phép lỗi lọt qua?" - cải tiến quy trình, automation, observability.`
  },
  {
    id: 'qz-scenario-051',
    topic: 'scenario',
    q: 'Sau deploy, team scale app từ 5 pod lên 50 pod để chịu tải. Mỗi pod dùng HikariCP {{maximumPoolSize=20}}. PostgreSQL báo lỗi {{FATAL: sorry, too many clients already}} và app không kết nối được. Nguyên nhân và cách xử lý đúng đầu tiên?',
    options: [
      'Tăng {{max_connections}} của PostgreSQL lên 2000 và restart DB',
      'Mỗi pod cần một pool lớn để xử lý song song, nên giữ nguyên 20 và chỉ thêm RAM cho DB',
      'Tổng connection xấp xỉ 50 x 20 = 1000 vượt {{max_connections}} của PostgreSQL (mặc định 100); cần dùng connection pool trung gian (PgBouncer) hoặc giảm pool mỗi pod, không để mỗi pod tự mở hàng chục connection',
      'Lỗi do DNS, cần restart connection pool của mỗi pod'
    ],
    answer: 2,
    explain: `**Đáp án đúng: Tổng 1000 connection vượt max_connections; dùng PgBouncer hoặc giảm pool mỗi pod.**

### Vì sao đúng
- PostgreSQL mỗi connection là một process; {{max_connections}} mặc định là 100. 50 pod x 20 = 1000 >> 100, nên connection mới bị từ chối ngay với thông báo too many clients.
- PgBouncer giữ ít connection trực tiếp tới PostgreSQL và multiplex hàng ngàn connection từ app qua pool nhỏ hơn. Hoặc giảm {{maximumPoolSize}} mỗi pod (ví dụ 5–8) và theo dõi {{pg_stat_activity}}.

### Vì sao các phương án khác sai
- **Tăng {{max_connections}} lên 2000**: mỗi connection PostgreSQL tốn RAM và context switch; 2000 connection đồng thời làm DB quá tải, chỉ dời nút thắt sang CPU/I/O, không phải cách xử lý bền vững.
- **Giữ 20 mỗi pod**: tổng vẫn vượt hạn, lỗi tiếp tục.
- **DNS**: thông báo lỗi rõ ràng là too many clients, không phải DNS.

> Senior tip: quy tắc ngón tay: tổng {{maximumPoolSize}} của tất cả app pod không được vượt quá 70–80% {{max_connections}} của PostgreSQL (trừ khi dùng PgBouncer). Cảnh báo metric {{pg_stat_activity}} và {{hikaricp.connections.pending}}.`
  },
  {
    id: 'qz-scenario-052',
    topic: 'scenario',
    multi: true,
    q: 'Sau khi deploy tính năng mới hiển thị danh sách đơn hàng kèm tên khách hàng và các mặt hàng, API chậm đột ngột: với 20 đơn, Hibernate sinh khoảng 40 câu SQL. Những phát biểu nào đúng về cách xử lý? (Chọn 2)',
    options: [
      'Bật {{show_sql=true}} (hoặc p6spy) để xem SQL thực tế, xác nhận hiện tượng N+1 (một câu query danh sách, sau đó một câu query cho mỗi đơn/mặt hàng)',
      'Dùng {{@EntityGraph}} hoặc {{JOIN FETCH}} để tải Order kèm Customer và OrderItems trong một câu SQL, thay cho lazy load từng cái',
      'Tăng {{maximumPoolSize}} của HikariCP sẽ khử N+1 vì pool lớn hơn',
      'Đánh dấu {{@Transactional(readOnly = true)}} là N+1 tự biến mất'
    ],
    answer: [0, 1],
    explain: `**Đáp án đúng: Xác nhận N+1 qua SQL log, rồi sửa bằng @EntityGraph/JOIN FETCH.**

### Vì sao đúng
- **N+1 là gì?** Một câu query lấy danh sách (1), sau đó mỗi dòng trong danh sách triggers thêm một câu query để tải dữ liệu liên kết (N). Với 20 đơn x 2 liên kết ≈ 40 câu SQL, đúng biểu hiện N+1.
- **Bật SQL log**: xem SQL thực tế ngay trên log để xác nhận, chứ không phải đoán.
- **@EntityGraph / JOIN FETCH**: Hibernate gom dữ liệu liên kết vào một câu SQL JOIN, chỉ chạm DB một lần.

### Vì sao các phương án khác sai
- **Tăng pool**: pool lớn hơn không làm giảm số câu SQL; N+1 vẫn xảy ra, chỉ chậm hơi ít hơn do không chờ kết nối pool.
- **@Transactional(readOnly=true)**: giúp Hibernate tối ưu một chút (không flush dirty checking), nhưng không gom các câu SQL liên kết nên N+1 vẫn còn.

> Senior tip: N+1 thường xuất hiện sau khi thêm field mới hoặc thay đổi fetch type. Code review nên kiểm tra các vòng lặp gọi getter đối tượng liên kết/collection. Lưu ý @EntityGraph với collection lớn có thể sinh hàng trùng (Cartesian product), cần cân nhắc {{@BatchFetchSize}} làm lựa chỉnh.`
  },
  {
    id: 'qz-scenario-053',
    topic: 'scenario',
    q: 'Cache giỏ hàng dùng Redis, một giỏ hàng hot có khoảng 1 triệu mục. Code gọi {{DEL cart:123}} để xóa giỏ sau khi thanh toán. Redis đơn luồng bị chặn khoảng 10 giây, tất cả lệnh cache khác (GET/SET) cũng chờ theo. Cách xử lý đúng?',
    options: [
      'Gọi {{DEL}} nhiều lần với timeout nhỏ hơn',
      'Dùng {{UNLINK cart:123}} (xóa non-blocking trong luồng nền) hoặc xóa dần bằng pipeline (HSCAN/HDEL theo lô nhỏ), không gọi DEL trực tiếp trên key lớn trong luồng chính',
      'Tăng số luồng Redis để xử lý song song',
      'Tắt persistence (RDB/AOF) để DEL nhanh hơn'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Dùng UNLINK hoặc xóa dần lô nhỏ, không DEL key lớn trực tiếp trong luồng chính.**

### Vì sao đúng
- Redis xử lý lần lượt một lệnh trong luồng chính. {{DEL}} trên key có triệu thành viên là O(N), chặn luồng chính đến khi xong; mọi client khác bị chờ (head-of-line blocking).
- {{UNLINK}} chỉ xóa metadata ngay và trả về, việc giải phóng bộ nhớ chạy trong nền. Key lớn cũng nên xóa lô nhỏ qua pipeline để không gây spike latency.

### Vì sao các phương án khác sai
- **DEL nhiều lần**: vẫn là lệnh chặn, không giải quyết vấn đề gốc.
- **Tăng số luồng Redis**: Redis vẫn đơn luồng cho lệnh dữ liệu (IO thread chỉ xử lý mạng), không giúp DEL key lớn nhanh hơn.
- **Tắt persistence**: không làm giảm chi phí O(N) của lệnh DEL.

> Senior tip: theo dõi metric {{blocked_clients}} và latency p99 của Redis; key lớn (hàng trăm nghìn thành viên trở lên) không nên thao tác toàn bộ trong một lệnh. Dùng {{SCAN}} thay vì {{KEYS}}, và chia nhỏ giỏ hàng nếu giỏ có thể lớn.`
  },
  {
    id: 'qz-scenario-054',
    topic: 'scenario',
    q: 'Producer Kafka cần gửi thông báo kèm tệp PDF nhị sinh khoảng 2 MB. Broker báo lỗi {{MessageTooLargeException}} và message không được ghi. Giới hạn mặc định của Kafka là 1 MB cho mỗi bản ghi. Cách xử lý đúng?',
    options: [
      'Retry gửi liên tục cho tới khi thành công',
      'Tăng {{message.max.bytes}} trên broker và {{max.request.size}} trên producer (hoặc nén/chia tệp, gửi metadata qua Kafka và tải nội dung lên object storage), không để message lớn lấn át broker',
      'Tắt compression.type để message nhỏ hơn',
      'Gửi message qua topic khác có phân vùng nhiều hơn'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Tăng giới hạn kích thước message cả hai bên, hoặc dùng object storage cho payload lớn.**

### Vì sao đúng
- Kafka không dùng cho payload lớn; message lớn lấn aufs broker, phân vùng và consumer. Nếu payload dưới vài MB: tăng {{message.max.bytes}} (broker) và {{max.request.size}} (producer) đồng bộ, bật nén.
- Cách tốt hơn đối với tệp lớn: tải tệp lên S3/object storage, gửi message chỉ chứa URL và metadata qua Kafka (thin message, fat payload outside).

### Vì sao các phương án khác sai
- **Retry liên tục**: message lớn vẫn bị từ chối, retry dồn tải lên broker.
- **Tắt compression**: compression làm message nhỏ hơn, không phải lớn hơn.
- **Topic phân vùng nhiều hơn**: giới hạn là kích thước mỗi bản ghi, không liên quan số phân vùng.

> Senior tip: Best practice là Kafka mang sự kiện + URL, object storage mang nội dung. Giới hạn 1 MB có tác dụng phòng vệ, không nên mở rộng vô hạn vì một message lớn có thể treo một phân vùng trong nhiều giây.`
  },
  {
    id: 'qz-scenario-055',
    topic: 'scenario',
    q: 'Sau deploy phiên bản mới, mỗi giờ ứng dụng bị treo 3–5 giây, mọi request chờ đồng thời. Log GC cho thấy Full GC stop-the-world kéo dài vài giây. Dump code tìm thấy đoạn gọi {{System.gc()}} trong tác vụ báo cáo định kỳ. Nguyên nhân và cách xử lý?',
    options: [
      'System.gc() chỉ là gợi ý, JVM thường bỏ qua nên không liên quan',
      'System.gc() ép JVM thực hiện Full GC stop-the-world; cần xóa lệnh gọi này, để JVM tự quản lý GC (hoặc dùng {{-XX:+DisableExplicitGC}} nếu không kiểm soát được source)',
      'Tăng heap lên gấp đôi để Full GC ít xảy ra hơn',
      'Chuyển sang serial GC để Full GC nhanh hơn'
    ],
    answer: 1,
    explain: `**Đáp án đúng: System.gc() gây Full GC stop-the-world, hãy xóa hoặc tắt rõ ràng.**

### Vì sao đúng
- {{System.gc()}} là lời nhắc mạnh tới JVM chạy Full GC ngay; trong Full GC, các luồng ứng dụng bị tạm dừng cho đến khi xong -> spike latency. Nhiều instance gọi cùng lúc -> toàn bộ service treo.
- Sửa: xóa lời gọi, để JVM tự kích hoạt GC dựa trên ngưỡng heap. Nếu không kiểm soát được source (thư viện bên thứ ba), khởi động JVM với {{-XX:+DisableExplicitGC}}.

### Vì sao các phương án khác sai
- **Gợi ý có thể bỏ qua**: đúng lý thuyết, nhưng JVM thường tuân thủ, và đây là nguyên nhân spike định kỳ kinh điển trong production.
- **Tăng heap**: Full GC vẫn xảy ra khi System.gc() được gọi; heap lớn hơn thậm chí làm Full GC kéo dài hơn.
- **Serial GC**: chỉ thích hợp heap nhỏ, không giải quyết việc ép Full GC stop-the-world.

> Senior tip: Full GC định kỳ cùng lúc trên nhiều instance thường do System.gc() hoặc cron job/JMX gọi nó. Tìm bằng {{-Xlog:gc*safepoint}} hoặc JFR event {{jdk.GCPhasePause}}.`
  },
  {
    id: 'qz-scenario-056',
    topic: 'scenario',
    multi: true,
    q: 'Sau deploy, server log mở rộng làm ổ đĩa chứa log đầy 100%. Ứng dụng dùng Logback/Log4j2 ghi đồng bộ vào file, request bắt đầu treo ở dòng ghi log, không tạo được heap dump. Không ai xóa log cũ. Những biện pháp nào đúng? (Chọn 2)',
    options: [
      'Dùng asynchronous appender (Logback {{AsyncAppender}} / Log4j2 Async) để ghi log không chặn request, cùng quay log (rolling policy) và đặt cảnh báo dùng ổ đĩa',
      'Tăng heap của JVM để ứng dụng chịu được nhiều log hơn',
      'Tắt hoàn toàn ghi log trong production để không đầy ổ đĩa',
      'Lưu log trên ổ đĩa riêng (hoặc gởi centralized logging), đặt retention (ví dụ 7–14 ngày) và alert khi dùng ổ > 85%'
    ],
    answer: [0, 3],
    explain: `**Đáp án đúng: Ghi log không chặn request + quay log, ổ riêng, retention và alert.**

### Vì sao đúng
- Appender đồng bộ ghi vào file trực tiếp trong luồng xử lý request; ổ đầy -> hệ thống gọi ghi bị treo (I/O wait) -> toàn bộ request ảnh hưởng, thậm chí không tạo heap dump được.
- Async appender đẩy ghi vào hàng đợi đệm, request tiếp tục xử lý. Rolling policy giữ file trong giới hạn, retention xoá cũ, alert phát hiện sớm trước khi ổ đầy.

### Vì sao các phương án khác sai
- **Tăng heap**: log ghi vào ổ đĩa, không phải heap; heap lớn hơn không ngăn ổ đầy.
- **Tắt log**: mất khả năng điều tra sự cố; nên quản lý log chứ không phải tắt.

> Senior tip: đặt ổ log riêng khỏi ổ hệ thống và ổ dữ liệu (tránh đầy ổ hệ làm hệ điều hành không khởi động). Kết hợp centralized logging (ELK/Loki) để xóa log local sau khi đã ship. Cảnh báo ổ đĩa > 85% và inode > 85%.`
  },
  {
    id: 'qz-scenario-057',
    topic: 'scenario',
    q: 'Sau deploy code mới, bảng {{orders}} bị chậm: các session khác chờ lên đến 30 giây khi cập nhật cùng một đơn hàng. Tra cứu {{pg_locks}} cho thấy một session giữ row lock trên đơn hàng này hơn 10 phút mà không commit/rollback. Nguyên nhân và xử lý đúng đầu tiên?',
    options: [
      'Tăng {{max_connections}} để nhiều session hơn',
      'Transaction quên commit/rollback (ví dụ kết nối lấy từ pool không được trả lại, hoặc code gọi dịch vụ bên ngoài bên trong transaction giữ khoá dòng). Xác định session bị treo qua {{pg_stat_activity}}/{{pg_locks}}, hoàn tác hoặc pg_terminate_backend nếu cần, rồi sửa code: transaction ngắn, không gọi I/O bên trong khoá',
      'Chuyển isolation level sang SERIALIZABLE để khoá mạnh hơn',
      'Restart PostgreSQL để giải phóng mọi khoá'
    ],
    answer: 1,
    explain: `**Đáp án đúng: Transaction dài giữ row lock; tìm session qua pg_stat_activity/pg_locks, sửa code transaction ngắn, không gọi I/O bên trong khoá.**

### Vì sao đúng
- PostgreSQL dùng row-level lock cho UPDATE/DELETE; session khác cùng cập nhật dòng đó phải chờ đến khi session đầu commit/rollback.
- Nếu code mở transaction, cập nhật đơn, rồi gọi API chậm bên ngoài hoặc quên đóng kết nối, khoá được giữ hàng mười phút -> hàng chờ lớn.
- Xử lý: xác định PID qua {{pg_stat_activity}}, xem lý do (state = idle in transaction), pg_terminate_backend chỉ khi cần, rồi sửa root cause: transaction ngắn nhất có thể, không gọi dịch vụ bên ngoài khi đang nắm khoá DB.

### Vì sao các phương án khác sai
- **Tăng max_connections**: thêm session chờ không giúp, thậm chí làm nặng hơn.
- **SERIALIZABLE**: khoá mạnh hơn, dễ deadlock hơn, không giải quyết transaction quên commit.
- **Restart DB**: giải quyết tạm thời nhưng gây downtime, không sửa code, lỗi sẽ lặp lại.

> Senior tip: đặt {{statement_timeout}} và {{idle_in_transaction_session_timeout}} để tự huỷ transaction chạy lâu và transaction nghỉ uốn, ngăn trường hợp này lặp lại. Cảnh báo session idle in transaction > 5 phút.`
  },
  {
    id: 'qz-scenario-058',
    topic: 'scenario',
    q: 'Code dùng một {{HashMap}} static làm cache chia sẻ giữa tất cả request. Lúc cao điểm, nhiều thread cùng {{put}} vào HashMap đang gần đầy, CPU nhảy lên 100% và ứng dụng không phản hồi. Thread dump cho thấy nhiều thread kẹt trong vòng lặp trên phần tử của HashMap. Nguyên nhân và cách xử lý?',
    options: [
      'HashMap không an toàn với nhiều thread đồng thời ghi: khi resize (tham khuyết), các phần tử bị đính lại thành danh sách ngược và có thể tạo vòng lặp (infinite loop) trên cùng một bucket, thread kẹt mãi',
      'Tăng heap vì HashMap quá lớn',
      'Dùng {{Collections.synchronizedMap}} là đủ và hiệu quả nhất',
      'HashMap chỉ đọc an toàn, ghi thì không sao vì mỗi request có bản sao'
    ],
    answer: 0,
    explain: `**Đáp án đúng: HashMap không thread-safe; resize cộng lúc ghi đồng thời có thể tạo vòng lặp danh sách, CPU 100%.**

### Vì sao đúng
- Khi nhiều thread cùng put gây resize, phần tử trong cùng bucket được thêm vào đầu danh sách liên kết; thay đổi cạnh tranh có thể khiến hai phần tử trỏ lẫn nhau (A.next = B, B.next = A). Lúc duyệt bucket đó -> vòng lặp vô hạn, CPU 100%, thread không thoát.
- Sửa: dùng {{ConcurrentHashMap}} (chia khoá, không khóa toàn bảng) hoặc {{Collections.synchronizedMap}} nếu ít ghi; không dùng static HashMap làm cache chia sẻ mà không có giới hạn kích thước.

### Vì sao các phương án khác sai
- **Tăng heap**: không liên quan, vấn đề là vòng lặp không thoát, không phải thiếu bộ nhớ.
- **synchronizedMap**: an toàn về dữ liệu nhưng khóa toàn bảng trên mỗi thao tác -> throughput thấp lúc cao điểm; ConcurrentHashMap thường phù hợp hơn.
- **HashMap chỉ đọc an toàn**: sai, thậm chí đọc khi có thread đang ghi cũng có thể thấy trạng thái hỏng (vô hạn lặp).

> Senior tip: cache dùng chung nên có chính sách xoá (TTL, kích thước tối đa, ví dụ Caffeine) và luôn chọn cấu trúc thread-safe cho trạng thái chia sẻ. Không bao giờ dùng HashMap/ArrayList static làm cache trong ứng dụng đa luồng.`
  },
  {
    id: 'qz-scenario-059',
    topic: 'scenario',
    q: 'Service mới dùng {{@Async}} cho việc gửi email và sinh báo cáo. Executor mặc định của Spring tạo một luồng mới cho mỗi tác vụ và không giới hạn số luồng. Lúc cao điểm có hàng nghìn tác vụ đồng thời, ứng dụng tạo hàng nghìn luồng, heap và CPU spiking, pod bị OOMKilled. Cách xử lý đúng?',
    options: [
      'Tăng memory limit của pod lên 8Gi để chứa nhiều luồng hơn',
      'Tắt @Async, chạy tất cả tác vụ tuần tự trên luồng chính',
      'Cấu hình {{TaskExecutor}} riêng (ví dụ {{ThreadPoolTaskExecutor}}) với pool size và queueCapacity giới hạn, áp dụng backpressure (các tác vụ vượt quá được chờ hoặc từ chối), không để executor tạo luồng không giới hạn',
      'Mỗi tác vụ @Async tự tạo {{new Thread()}} để isolates lỗi'
    ],
    answer: 2,
    explain: `**Đáp án đúng: TaskExecutor riêng có giới hạn pool và hàng chờ, áp dụng backpressure.**

### Vì sao đúng
- @Async mặc định có thể tạo luồng mới cho mỗi tác vụ (không giới hạn). Hàng nghìn tác vụ -> hàng nghìn luồng, mỗi luồng khoảng 1 MB stack -> heap/RAM spiking, GC chật, pod OOMKilled.
- Sửa: định nghĩa {{ThreadPoolTaskExecutor}} bean với {{corePoolSize}}, {{maxPoolSize}}, {{queueCapacity}}, chính sách khi đầy (ví dụ {{CallerRunsPolicy}} áp lực ngược về caller), dùng {{@Async(\"myExecutor\")}}.

### Vì sao các phương án khác sai
- **Tăng memory**: chỉ trì hoãn OOM, hàng nghìn luồng vẫn gây context switch nặng, GC pressure, tăng thời gian stop-the-world.
- **Chạy tuần tự**: throughput xuống gần không, không chấp nhận được.
- **new Thread() mỗi tác vụ**: sai tương tự, nặng hơn và khó quản lý.

> Senior tip: bất kỳ tác vụ nền nào (gửi email, báo cáo, gọi đối tác) cũng phải đi qua executor có giới hạn, kèm hàng đợi và chính sách khi đầy. Theo dõi metric số luồng của JVM và thread của container.`
  },
  {
    id: 'qz-scenario-060',
    topic: 'scenario',
    q: 'Sau deploy tính năng lưu toàn bộ lịch sử sự kiện vào một {{ArrayList}} static trong bộ nhớ để tra cứu nhanh, danh sách không bao giờ bị xoá. Sau vài ngày, heap tăng dần, GC lại liên tục, cuối cùng ném {{java.lang.OutOfMemoryError: Java heap space}} (JVM vẫn ghi log, có heap dump). Nguyên nhân và cách xử lý?',
    options: [
      'Tăng {{-Xmx}} lên gấp đôi là giải pháp triệt tiêu',
      'ArrayList static lưu liên tục mà không giới hạn -> memory leak logic; cần giới hạn kích thước (ví dụ Caffeine cache với TTL/kích thước tối đa, hoặc Queue cố định), theo dõi heap, không nên lưu lịch sử vĩnh viễn trong JVM heap',
      'Chuyển sang {{LinkedList}} tiêu thụ ít bộ nhớ hơn',
      'Gọi {{System.gc()}} định kỳ để dọn danh sách'
    ],
    answer: 1,
    explain: `**Đáp án đúng: ArrayList static không giới hạn là memory leak logic; giới hạn kích thước/TTL, không lưu vĩnh viễn trong heap.**

### Vì sao đúng
- static ArrayList là GC root, phần tử thêm vào không bao giờ bị thu hồi. Mỗi sự kiện mới -> danh sách dài hơn -> heap chiếm dụng tăng đơn điệu -> GC chạy nhiều nhưng không thu hồi được -> cuối cùng OOM heap space. Đây là lỗi logic tích luỹ, chỉ phát hiện sau vài ngày chạy.
- Sửa: dùng cấu trúc có giới hạn (Caffeine cache với maximumSize/expireAfterWrite, hoặc ring buffer/Queue cố định), hoặc đẩy lịch sử vào database/file, không giữ vĩnh viễn trong JVM heap.

### Vì sao các phương án khác sai
- **Tăng {{-Xmx}}**: chỉ trì hoãn OOM vài ngày, không sửa gốc, và heap lớn hơn làm GC lâu hơn.
- **LinkedList**: mỗi node là đối tượng riêng, bộ nhớ thậm chí nhiều hơn ArrayList; vấn đề là không xoá dữ liệu, không phải kiểu danh sách.
- **System.gc() định kỳ**: không thu hồi được vì các phần tử vẫn được static field tham chiếu; gây Full GC stop-the-world thêm nặng.

> Senior tip: bất kỳ container static (list, map, queue) tích luỹ dữ liệu theo thời gian đều là suspected memory leak. Quy tắc: mỗi cache cần chính sách eviction (xoá) — TTL, kích thước tối đa, hoặc lưu ngoài heap. Heap dump mở Eclipse MAT xem dominator tree sẽ xác định ngay nguyên nhân.`
  }
);
