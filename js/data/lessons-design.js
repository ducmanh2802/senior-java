/* Bài học track design: mô phỏng building block bằng JDK chuẩn, không phụ thuộc đồng hồ hay dịch vụ ngoài. */
(function () {
  'use strict';

  const lesson = (id, order, title, level, goals, body, exercise, checks, tags) => ({
    id: 'lesson-design-' + id, track: 'design', order, title, level, minutes: 30,
    goals, body, exercises: [exercise], check: checks, tags,
  });

  (window.LESSONS = window.LESSONS || []).push(
    lesson('001', 1, 'Rate limiter: token bucket và sliding window log', 'mid', [
      'Mô phỏng token bucket với thời gian được truyền vào và không nạp token hai lần cho cùng khoảng thời gian',
      'So sánh burst của token bucket với giới hạn chính xác của sliding window log',
    ], `### Rate limit bảo vệ điều gì?
Rate limiter giới hạn tốc độ nhận việc để một client, một tenant lỗi hoặc một đợt retry không làm cạn thread, connection pool hay ngân sách downstream. Trước khi chọn thuật toán hãy định nghĩa rõ key (user, API key, tenant hay route), đơn vị (request/giây, byte/giây), burst được phép, và điều gì xảy ra khi bị từ chối (HTTP 429, hàng đợi hay fallback). Giới hạn ở gateway bảo vệ hệ thống sớm; giới hạn trong service vẫn cần thiết khi có nhiều đường gọi nội bộ.

### Token bucket từng bước
Bucket có dung lượng C và số token hiện có T. Mỗi request cần một token. Thời gian trôi qua Δt tạo thêm r × Δt token, nhưng T bị chặn ở C. Request được nhận khi T ≥ 1, sau đó trừ một token. Ví dụ C=5, r=2 token/giây: sau khi để yên 2 giây có tối đa 5 token, nên cho phép burst 5 request; sau đó chỉ có thể tiếp tục trung bình 2 request/giây. Bucket không tích lũy vô hạn vì phần vượt C bị bỏ.

~~~text
T := min(C, T + elapsed × refillRate)
if T >= cost: T := T - cost; allow
else: reject
~~~

Thời gian phải là input để thuật toán xác định và kiểm thử được. Trong production dùng monotonic clock ({{System.nanoTime()}}) để đo thời lượng, không dùng wall clock ({{System.currentTimeMillis()}}) vì nó có thể nhảy lùi hoặc tiến khi NTP chỉnh giờ. Nếu nhiều instance cùng giới hạn một tenant, bộ đếm trong RAM mỗi instance làm tổng quota tăng theo số instance. Cần state chung như Redis với thao tác nguyên tử (thường Lua script), hoặc phân quota có chủ ý; phép đọc rồi ghi riêng rẽ có race.

### Sliding window log
Lưu timestamp của từng request được nhận trong cửa sổ. Khi thời điểm t đến, bỏ các timestamp ≤ t-window, rồi nhận nếu số còn lại nhỏ hơn limit. Thuật toán diễn đạt đúng giới hạn cho mọi đoạn cửa sổ, nhưng bộ nhớ O(requests trong window) trên từng key và cleanup tốn công. Với tải lớn, sliding window counter chia cửa sổ thành bucket nhỏ để giảm bộ nhớ nhưng có sai số gần ranh giới. Fixed window (đếm theo từng phút tròn) rẻ nhất nhưng cho phép burst gần gấp đôi tại ranh giới hai cửa sổ: với giới hạn 100 request/phút, client gửi 100 request lúc 00:59 và 100 request lúc 01:00, cả hai cửa sổ đều hợp lệ, nhưng thực tế 200 request đã lọt qua trong 2 giây.

| Thuật toán | Burst | Bộ nhớ | Sai số |
|---|---|---|---|
| Token bucket | Có, tối đa capacity | O(1)/key | Đúng tốc độ trung bình; không giới hạn cứng số request trong một cửa sổ |
| Sliding log | Không vượt limit trong mọi cửa sổ | O(request/window) | Gần như chính xác |
| Fixed window | Có thể dồn ở ranh giới | O(1)/key | Cao ở ranh giới |

### Cài đặt trong ứng dụng
Trong một JVM đơn, đồng bộ hoá bucket hoặc dùng cấu trúc đồng thời đúng cách. Với Redis, ghép đọc trạng thái, tính token và ghi thành một script nguyên tử; TTL dọn key không hoạt động. Định nghĩa rõ khi Redis lỗi: fail-open tăng rủi ro quá tải, fail-closed làm mất availability. Bucket4j cung cấp nhiều backend và cấu hình refill; Redis/Gateway phù hợp khi quota cần chia sẻ. Cần metric cho allowed, rejected, số key và độ trễ backend, nhưng tránh gắn user id vào metric label gây cardinality bùng nổ.

### Pitfall vận hành
Token cost có thể khác nhau theo endpoint; nếu limiter chỉ tính request thì upload 1 GB ngang một health check. Key theo IP phía sau proxy sai nếu không xác thực header proxy tin cậy. Nhiều replica với cấu hình refill giống nhau không tạo ra quota toàn cụm nếu mỗi replica giữ bucket riêng. Khi đổi capacity/rate, cần biết state cũ được migrate hay reset. Trả 429 nên có Retry-After phù hợp, nhưng client vẫn phải có jitter để tránh cả đám retry cùng lúc.

### Liên hệ phỏng vấn
Nêu trước scope của quota và semantics khi vượt giới hạn; sau đó chọn bucket nếu cần burst có kiểm soát, sliding log nếu yêu cầu chính xác theo cửa sổ. Bài tập dưới đây dùng đồng hồ giả truyền vào, vì vậy test tại biên thời gian không flaky và không cần sleep.`, {
      title: 'Cài token bucket với đồng hồ giả',
      prompt: `Cài {{TokenBucket(capacity, refillPerSecond, nowMillis)}}. {{allow(nowMillis)}} nạp token theo thời gian đã trôi qua, chặn ở capacity, rồi tiêu thụ một token nếu đủ. Thời gian không được lùi; nếu now nhỏ hơn mốc trước thì coi elapsed là 0 và không làm mốc lùi.`,
      starter: `class TokenBucket {
    private final int capacity;
    private final double rate;
    TokenBucket(int capacity, double rate, long nowMillis) {
        this.capacity = capacity; this.rate = rate;
    }
    boolean allow(long nowMillis) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,n=0; static void c(String s, boolean b){n++;if(b){p++;System.out.println("PASS "+s);}else System.out.println("FAIL "+s+": unexpected result");}
 public static void main(String[] x){
  TokenBucket b=new TokenBucket(2,1.0,0);
  c("initial capacity",b.allow(0)&&b.allow(0)&&!b.allow(0));
  c("refills by elapsed time",b.allow(1000));
  c("fractional refill accumulates",!b.allow(1499)&&b.allow(2000));
  TokenBucket d=new TokenBucket(2,2.0,0); d.allow(10000); c("refill caps at capacity",d.allow(10000)&&!d.allow(10000));
  TokenBucket e=new TokenBucket(1,1.0,1000); e.allow(1000); c("clock rollback does not mint tokens",!e.allow(0)&&e.allow(2000));
  System.out.println("RESULT "+p+"/"+n);
 }
}`,
      reference: `class TokenBucket {
    private final int capacity;
    private final double rate;
    private double tokens;
    private long last;
    TokenBucket(int capacity, double rate, long nowMillis) {
        if (capacity < 1 || rate < 0) throw new IllegalArgumentException();
        this.capacity = capacity; this.rate = rate; this.tokens = capacity; this.last = nowMillis;
    }
    boolean allow(long nowMillis) {
        long elapsed = Math.max(0, nowMillis - last);
        last = Math.max(last, nowMillis);
        tokens = Math.min(capacity, tokens + elapsed * rate / 1000.0);
        if (tokens < 1.0) return false;
        tokens -= 1.0; return true;
    }
}`,
      hints: ['Tạo state gồm tokens và last; khởi đầu bucket đầy.', 'Đổi milliseconds sang giây trước khi nhân rate; cập nhật last đơn điệu và clamp tokens.'],
      explain: `Mỗi lần gọi, elapsed nhân refill rate tạo lượng token phân số; giữ dạng double để 500 ms ở rate 1/s tích lũy thành nửa token. Chỉ cho phép khi đủ 1. Dùng {{Math.min}} ngăn idle lâu tạo burst lớn hơn capacity. Trong production rate/capacity phải được validate, còn state phân tán phải cập nhật nguyên tử.`,
    }, [
      { q: 'Vì sao token bucket cho burst?', options: ['Token tích luỹ tới capacity khi không có request', 'Nó lưu toàn bộ timestamp', 'Mỗi instance tự đồng bộ Redis', 'Vì refill không có giới hạn'], answer: 0, explain: `Đúng: idle tích lũy token hữu hạn tới capacity. Sliding log lưu timestamp (không phải token); Redis không tự xuất hiện; refill bị chặn bởi capacity nên không vô hạn.` },
      { q: 'Muốn quota dùng chung giữa nhiều replica, điều gì quan trọng nhất?', options: ['Dùng static field', 'Dùng state chia sẻ và cập nhật nguyên tử', 'Tăng limit trên mỗi replica', 'Dùng wall clock cho chính xác'], answer: 1, explain: `State cục bộ nhân quota theo số replica. Shared store cần thao tác atomic để tránh hai request cùng đọc một token cuối. Static chỉ chia sẻ trong một JVM; tăng limit làm sai quota; wall clock không giải quyết đồng bộ.` },
    ], ['rate-limiter', 'token-bucket', 'sliding-window']),

    lesson('002', 2, 'Cache eviction: LRU và LFU', 'mid', [
      'Dùng LinkedHashMap access-order cho LRU gọn và nhận biết giới hạn thread-safety',
      'Giải thích cấu trúc map cộng doubly linked list và buckets tần suất của LFU',
    ], `### Cache cần chính sách loại bỏ
Cache giữ bản sao dữ liệu đắt để tính hoặc đọc. Khi đầy, eviction policy quyết định entry nào bị loại; chính sách chỉ hiệu quả khi pattern truy cập tương lai có liên hệ với lịch sử. Cache không phải nguồn dữ liệu chuẩn: cần TTL, invalidation, giới hạn kích thước và hành vi khi cache miss. LRU giả định thứ vừa dùng sắp được dùng lại; LFU giả định thứ dùng thường xuyên trong quá khứ tiếp tục hữu ích.

### LRU với LinkedHashMap
{{LinkedHashMap}} nối các entry bằng danh sách đôi. Constructor với {{accessOrder=true}} đặt entry vừa truy cập về cuối; đầu danh sách là least recently used. Override {{removeEldestEntry}} để loại đầu sau khi put vượt capacity. get/put/remove trung bình O(1), code ngắn và ít lỗi con trỏ. Tuy vậy, LRU này không thread-safe; synchronized toàn cache có thể serialize workload. Cũng cần quyết định null có nghĩa là miss hay value hợp lệ.

~~~java
Map<K,V> map = new LinkedHashMap<K,V>(16, .75f, true) {
  protected boolean removeEldestEntry(Map.Entry<K,V> e) {
    return size() > capacity; // sau put, bỏ entry già nhất
  }
};
~~~

### LRU thủ công
HashMap ánh xạ key tới node. Danh sách đôi giữ thứ tự mới dùng; get tìm node O(1), unlink khỏi vị trí cũ và nối vào tail. put cập nhật node hiện có hoặc tạo node, rồi nếu quá capacity unlink head. Sentinel head/tail loại bỏ nhiều nhánh null. Map và list là hai góc nhìn của cùng tập entry nên mọi thao tác phải cập nhật cả hai; quên remove khỏi map tạo entry không thể truy cập, quên unlink tạo node ma.

### LFU và tie-break
LFU loại key có tần suất thấp nhất. Một HashMap key→node cùng các bucket tần suất, mỗi bucket là danh sách đôi theo recency, cho get/put O(1) amortized. get chuyển node từ bucket f sang f+1; minFreq tăng khi bucket hiện tại rỗng. Khi eviction, lấy node LRU trong bucket minFreq để xử lý hoà. Tần suất cần aging hoặc decay trong hệ thống chạy lâu: một key hot hôm qua có thể giữ chỗ mãi dù hôm nay không còn truy cập.

| Policy | Hợp với | Điểm yếu |
|---|---|---|
| LRU | locality theo thời gian | scan lớn có thể đẩy hot set |
| LFU | popularity ổn định | stale frequency, nhiều state |
| TTL | dữ liệu hết hạn theo nghiệp vụ | không tự chọn nạn nhân khi đầy |

### Chọn giải pháp production
Cache cục bộ như Caffeine thường tốt hơn tự cài vì có eviction, statistics, concurrency và admission policy. Redis phù hợp cache chia sẻ nhưng thêm network hop và vận hành; TTL không đảm bảo invalidation tức thời. Spring Cache abstraction thống nhất annotation nhưng semantics phụ thuộc provider. Với cache-aside, đọc miss rồi load nguồn; đồng thời nhiều miss có thể tạo stampede, cần request coalescing, lock có giới hạn hoặc refresh-ahead. Không cache exception hay dữ liệu phân quyền sai key.

### Pitfall và đo lường
Hit rate cao vẫn có thể che latency p99 tệ nếu miss tới database chậm. Theo dõi hit/miss, eviction, load latency, size, và chi phí memory; tránh cardinality label theo key. Object lớn khiến capacity theo số entry gây OOM, nên giới hạn cân theo weight. Cache invalidation qua event có thể mất message; cần TTL hoặc versioning làm hàng rào. LRU access-order làm get thành mutation, nên đọc đồng thời vẫn cần đồng bộ.

### Liên hệ phỏng vấn
Giải thích vì sao LRU dùng map cộng list để giữ O(1), rồi hỏi workload có temporal locality không. Nếu cache nhiều node, thảo luận local vs shared, invalidation, stampede và consistency trước khi nói thuật toán.`, {
      title: 'Cài LRU O(1) bằng HashMap và danh sách đôi',
      prompt: `Cài {{LruCache}} có capacity dương, {{get}} trả null nếu thiếu và làm mới recency; {{put}} cập nhật hoặc thêm, loại phần tử ít được dùng gần đây nhất khi đầy.`,
      starter: `class LruCache {
    LruCache(int capacity) {}
    Integer get(int key) { throw new UnsupportedOperationException("TODO"); }
    void put(int key, int value) { throw new UnsupportedOperationException("TODO"); }
    int size() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,n=0; static void c(String s, boolean b){n++;if(b){p++;System.out.println("PASS "+s);}else System.out.println("FAIL "+s+": wrong cache state");}
 public static void main(String[] a){
  LruCache c=new LruCache(2);c.put(1,10);c.put(2,20);c.get(1);c.put(3,30);
  c("get refreshes recency",c.get(2)==null&&c.get(1)==10&&c.get(3)==30&&c.size()==2);
  c.put(1,11);c("update existing key",c.size()==2&&c.get(1)==11);
  c.put(4,40);c("put refreshes and evicts",c.get(3)==null&&c.get(4)==40);
  LruCache one=new LruCache(1);one.put(8,80);one.put(9,90);c("capacity one",one.get(8)==null&&one.get(9)==90);
  System.out.println("RESULT "+p+"/"+n);
 }
}`,
      reference: `class LruCache {
    private static class Node { int k,v; Node prev,next; Node(int k,int v){this.k=k;this.v=v;} }
    private final int cap; private final Map<Integer,Node> map=new HashMap<>();
    private final Node head=new Node(0,0), tail=new Node(0,0);
    LruCache(int capacity){if(capacity<1)throw new IllegalArgumentException();cap=capacity;head.next=tail;tail.prev=head;}
    private void unlink(Node x){x.prev.next=x.next;x.next.prev=x.prev;}
    private void newest(Node x){x.prev=tail.prev;x.next=tail;tail.prev.next=x;tail.prev=x;}
    Integer get(int key){Node x=map.get(key);if(x==null)return null;unlink(x);newest(x);return x.v;}
    void put(int key,int value){Node x=map.get(key);if(x!=null){x.v=value;unlink(x);newest(x);return;}x=new Node(key,value);map.put(key,x);newest(x);if(map.size()>cap){Node old=head.next;unlink(old);map.remove(old.k);}}
    int size(){return map.size();}
}`,
      hints: ['Node lưu key để eviction có thể xoá đúng entry khỏi map.', 'Tạo sentinel head/tail; mọi lần get hoặc put existing đều unlink rồi nối ngay trước tail.'],
      explain: `Map cho phép tìm node trong O(1), list giữ thứ tự truy cập. Sentinel làm unlink không phải xử lý riêng node đầu/cuối. Khi vượt capacity, {{head.next}} là nạn nhân; phải xoá đồng thời khỏi cả list và map. LFU mở rộng ý tưởng bằng nhiều list theo frequency, kèm quy tắc tie-break recency.`,
    }, [
      { q: 'get trong LinkedHashMap access-order có phải thao tác chỉ đọc?', options: ['Có, thứ tự không thay đổi', 'Không, nó thay đổi recency của entry', 'Chỉ thay đổi khi map đầy', 'Nó luôn xoá entry'], answer: 1, explain: `Với accessOrder=true, get chuyển entry vừa đọc về cuối danh sách, tức là sửa cấu trúc bên trong. Vì vậy nhiều thread chỉ "đọc" vẫn cần đồng bộ. "Thứ tự không đổi" là hành vi của insertion-order (mặc định). Việc dịch chuyển xảy ra ở mọi lần get chứ không chỉ khi map đầy; và get không bao giờ xoá entry (xoá là việc của removeEldestEntry sau put).` },
      { q: 'Trong LFU, khi nhiều key cùng tần suất thấp nhất thì tie-break phổ biến nào?', options: ['Loại key mới được thêm gần nhất', 'Loại key có hash nhỏ nhất', 'Loại key ít được dùng gần đây nhất (LRU) trong bucket tần suất thấp nhất', 'Không cần tie-break, chọn ngẫu nhiên là đủ'], answer: 2, explain: `Mỗi bucket tần suất là một danh sách theo recency, nên lấy phần tử đầu (LRU) của bucket minFreq vừa xác định, vừa O(1). Loại key mới nhất là sai hướng: key mới luôn có tần suất 1, loại nó ngay khiến key mới không bao giờ có cơ hội ở lại. Hash không phản ánh độ hữu ích. Chọn ngẫu nhiên làm kết quả không xác định, khó test và khó giải thích.` },
    ], ['cache', 'lru', 'lfu']),

    lesson('003', 3, 'Consistent hashing và virtual nodes', 'senior', [
      'Mô hình hoá hash ring và ánh xạ key tới node kế tiếp theo chiều kim đồng hồ',
      'Đo key movement khi thêm node và hiểu trade-off giữa số virtual node, cân bằng và chi phí',
    ], `### Vấn đề khi chia modulo
Với N shard, cách {{hash(key) % N}} đơn giản nhưng thêm hoặc bớt một shard làm hầu hết key đổi đích vì mẫu số thay đổi. Cache bị lạnh, dữ liệu phải rebalance lớn và downstream chịu spike. Consistent hashing đặt node và key lên cùng một vòng hash; key đi theo chiều kim đồng hồ tới node đầu tiên. Khi thêm node, chỉ một đoạn giữa node mới và predecessor thường đổi chủ; phần còn lại giữ nguyên.

### Ring với virtual nodes
Một physical node được đưa lên ring nhiều lần bằng các nhãn như {{nodeA#0}}…{{nodeA#V-1}}. Mỗi vnode có vị trí hash riêng. Khi tra key, chọn vnode có hash nhỏ nhất ≥ hash(key), nếu hết vòng thì quay về vị trí đầu. Virtual nodes giảm lệch tải do chỉ có vài điểm ngẫu nhiên, đồng thời cho phép node mạnh có nhiều vnode hơn. Chi phí là ring lớn hơn và cập nhật membership tốn O(V log(NV)) nếu dùng TreeMap.

~~~text
hash(key) = 73
ring: 10 A#0 ---- 81 B#2 ---- 140 C#0
key 73 → B#2 (điểm đầu tiên >= 73)
~~~

Hash function cần phân phối tốt và ổn định giữa process. Java {{hashCode}} không phù hợp nếu không chuẩn hoá thuật toán/encoding, và không nên dùng identity. Production thường dùng hash 64/128 bit có seed/quy ước byte rõ ràng; collision phải được xử lý. Đừng dùng TreeMap comparator có thể coi hai điểm khác nhau là bằng nhau rồi làm mất vnode.

### Thêm, bỏ node và movement
Khi thêm vnode, key thuộc đoạn vừa được vnode mới tiếp quản đổi owner; khi bỏ node, key của nó chuyển sang successor. Tỉ lệ movement có thể đo bằng cách tạo tập key cố định, phân phối trước, thêm node, rồi đếm owner thay đổi. Kết quả lý tưởng khi thêm node mới vào N node là xấp xỉ 1/(N+1), không phải chính xác cho mọi seed/virtual-node count. Test cần so cùng key set và hash deterministically.

### Cân bằng và giới hạn
Ít vnode khiến phân phối không đều; nhiều vnode cải thiện balance nhưng làm membership/ring lớn và tốn CPU/bộ nhớ. Vnode không tự giải quyết hot key: một key nóng vẫn nằm ở một shard. Cần replication, key salting có thể phá thứ tự, hoặc cache/read replica theo nghiệp vụ. Node capacity khác nhau có thể được biểu diễn bằng số vnode khác nhau, nhưng thay đổi trọng số gây movement cần lập kế hoạch.

| Chiến lược | Thay đổi membership | Cân bằng | Vấn đề |
|---|---|---|---|
| modulo N | thường gần toàn bộ key | tốt khi N cố định | thêm shard gây remap lớn |
| ring, 1 điểm/node | ít remap | dao động lớn | node có thể nhận đoạn khổng lồ |
| ring, nhiều vnode | ít remap | tốt hơn | state ring và rebalance |

### Production và vận hành
Consistent hashing phù hợp cache phân tán, partition routing hoặc shard placement khi membership đổi. Nó không tự replicate dữ liệu, không cung cấp consensus, và không xử lý split brain. Service discovery phải phát membership có version đồng nhất; nếu node A và B thấy ring khác nhau, cùng key có thể ghi vào hai nơi. Khi deploy, có thể shadow-route, copy dữ liệu rồi switch, theo dõi movement và miss rate. Nếu cần phân vùng dữ liệu mạnh, xem xét database partitioning hoặc rendezvous hashing cũng có thể đơn giản hơn.

### Liên hệ phỏng vấn
Nói rõ hash ring, successor lookup, và vì sao movement cục bộ. Sau đó lượng hoá movement bằng workload, nhắc virtual nodes, hot key, replication và đồng bộ membership. Bài tập dùng hash đơn giản deterministic để tập trung vào ownership, không giả làm production cryptographic hash.`, {
      title: 'Đo movement khi thêm node trên hash ring',
      prompt: `Cài {{Ring}} với {{addNode(name, virtualNodes)}} và {{owner(key)}}. Dùng hash ổn định {{Math.floorMod(String.hashCode(), 100000)}}; đặt vnode theo chuỗi {{name + "#" + i}}. owner chọn vị trí vnode đầu tiên >= hash(key); nếu không có thì vòng lại vị trí nhỏ nhất.
- Nếu hai vnode trùng vị trí, dò tới vị trí kế tiếp {{(h + 1) % 100000}} cho tới khi trống (không được ghi đè vnode cũ).
- {{addNode}} ném {{IllegalArgumentException}} nếu tên node đã tồn tại hoặc {{virtualNodes < 1}}.`,
      starter: `class Ring {
    void addNode(String name, int virtualNodes) { throw new UnsupportedOperationException("TODO"); }
    String owner(String key) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,n=0;static void c(String s,boolean b){n++;if(b){p++;System.out.println("PASS "+s);}else System.out.println("FAIL "+s+": incorrect ring");}
 public static void main(String[] z){
  Ring r=new Ring();r.addNode("a",3);c("single node owns all",r.owner("k1").equals("a"));
  r.addNode("b",3);c("lookup is deterministic",r.owner("customer-42").equals(r.owner("customer-42")));
  int moved=0;Ring old=new Ring();old.addNode("a",20);old.addNode("b",20);Ring added=new Ring();added.addNode("a",20);added.addNode("b",20);added.addNode("c",20);for(int i=0;i<1000;i++)if(!old.owner("key"+i).equals(added.owner("key"+i)))moved++;
  c("adding node preserves some owners",moved>0&&moved<1000);
  boolean onlyToNew=true;for(int i=0;i<1000;i++){String k="key"+i;if(!old.owner(k).equals(added.owner(k))&&!added.owner(k).equals("c"))onlyToNew=false;}
  c("moved keys go only to the new node",onlyToNew);
  TreeMap<Integer,String> pts=new TreeMap<>();for(String nm:new String[]{"a","b"})for(int i=0;i<20;i++){int h=Math.floorMod((nm+"#"+i).hashCode(),100000);while(pts.containsKey(h))h=(h+1)%100000;pts.put(h,nm);}
  boolean exact=true;for(int i=0;i<1000;i++){String k="key"+i;Map.Entry<Integer,String> e=pts.ceilingEntry(Math.floorMod(k.hashCode(),100000));String exp=(e==null?pts.firstEntry():e).getValue();if(!exp.equals(old.owner(k)))exact=false;}
  c("successor lookup with wrap-around",exact);
  Ring dup=new Ring();dup.addNode("x",2);boolean thrown=false;try{dup.addNode("x",2);}catch(IllegalArgumentException e){thrown=true;}c("duplicate node rejected",thrown);
  boolean bad=false;try{r.addNode("bad",0);}catch(IllegalArgumentException e){bad=true;}c("zero vnode rejected",bad);
  System.out.println("RESULT "+p+"/"+n);
 }
}`,
      reference: `class Ring {
    private final TreeMap<Integer,String> points=new TreeMap<>(); private final Set<String> nodes=new HashSet<>();
    void addNode(String name,int count){if(name==null||count<1||!nodes.add(name))throw new IllegalArgumentException();for(int i=0;i<count;i++){int h=Math.floorMod((name+"#"+i).hashCode(),100000);while(points.containsKey(h))h=(h+1)%100000;points.put(h,name);}}
    String owner(String key){if(points.isEmpty())throw new IllegalStateException();int h=Math.floorMod(key.hashCode(),100000);Map.Entry<Integer,String> e=points.ceilingEntry(h);return (e==null?points.firstEntry():e).getValue();}
}`,
      hints: ['Dùng TreeMap để ceilingEntry tìm vnode kế tiếp; null nghĩa là quay vòng.', 'Xử lý collision điểm hash deterministic bằng cách dò điểm kế tiếp; từ chối tên trùng để tránh ghi đè.'],
      explain: `Ring đặt nhiều điểm cho mỗi physical node. {{ceilingEntry}} thực hiện successor lookup; nếu không có điểm phía sau thì vòng về {{firstEntry}}. Collision cần được giải quyết thay vì để TreeMap ghi đè. Tỉ lệ movement nên đo bằng key thực tế và cùng thuật toán hash ở hai cấu hình.`,
    }, [
      { q: 'Ring đang có 4 node cân bằng tốt. Thêm node thứ 5 thì khoảng bao nhiêu key đổi owner, và chúng đi đâu?', options: ['Gần như tất cả key, chia đều cho 5 node', 'Không key nào, node mới chỉ nhận key mới', 'Khoảng 1/5 số key, và tất cả đều chuyển sang node mới', 'Khoảng 1/4 số key, chuyển qua lại giữa các node cũ'], answer: 2, explain: `Node mới chỉ tiếp quản các đoạn ring nằm ngay trước các vnode của nó, nên chỉ key trong những đoạn đó đổi owner, xấp xỉ 1/(N+1) = 1/5, và đích luôn là node mới; key giữa các node cũ không đổi chỗ cho nhau. "Gần như tất cả" là hành vi của {{hash % N}}. Key cũ nằm trong đoạn node mới tiếp quản bắt buộc phải chuyển, nên không thể "không key nào".` },
      { q: 'Virtual nodes chủ yếu giải quyết vấn đề nào?', options: ['Hot key đơn lẻ', 'Phân phối không đều khi mỗi node chỉ có một điểm', 'Replication consistency', 'Mã hoá dữ liệu'], answer: 1, explain: `Nhiều điểm lấy mẫu giúp cân bằng tải tốt hơn. Hot key vẫn tập trung; virtual node không replicate hay mã hoá dữ liệu.` },
    ], ['consistent-hashing', 'sharding', 'virtual-nodes']),

    lesson('004', 4, 'Circuit breaker: CLOSED, OPEN, HALF_OPEN', 'senior', [
      'Cài state machine có ngưỡng lỗi và thời gian mở được điều khiển bởi đồng hồ giả',
      'Phân biệt circuit breaker với retry, timeout và bulkhead trong production',
    ], `### Vì sao cần circuit breaker?
Khi dependency chậm/hỏng, request giữ thread và connection lâu hơn; queue đầy làm lỗi lan sang endpoint vốn khỏe. Retry vô hạn còn nhân tải lên dependency đang suy giảm. Circuit breaker ngăn gọi tiếp trong một khoảng, cho hệ thống phục hồi, và cho phép một số probe kiểm tra khả năng hồi phục. Nó không thay timeout: mỗi call vẫn cần deadline hữu hạn.

### State machine
CLOSED cho phép call và đếm lỗi trong một cửa sổ/chuỗi liên tiếp. Khi đạt threshold, chuyển OPEN, reject nhanh mà không gọi dependency. Sau wait duration, lần kiểm tra có thể chuyển HALF_OPEN. HALF_OPEN chỉ cho một số probe; probe thành công đủ ngưỡng thì đóng, lỗi thì mở lại. Phải định nghĩa rõ lỗi nào được tính: timeout/5xx thường tính, validation 4xx thường không; cancellation có thể cần xử lý riêng.

~~~text
CLOSED -- failures >= threshold --> OPEN
OPEN -- now >= retryAt --> HALF_OPEN
HALF_OPEN -- enough successes --> CLOSED
HALF_OPEN -- any counted failure --> OPEN
~~~

Đồng hồ monotonic/giả khiến wait duration đo được chính xác. Không gọi {{Thread.sleep}} trong test; truyền now vào thao tác hoặc clock abstraction. Trong hệ thống nhiều thread, state transition phải atomic để không cho hàng trăm probe lọt qua cùng lúc. Resilience4j cung cấp circuit breaker, sliding window, metrics, decorators và event hooks; production vẫn phải chọn threshold/window hợp lý.

### Window và ngưỡng
Failure rate 50% trên cửa sổ 10 call khác ý nghĩa với 50% trên 1000 call. Cửa sổ count-based phù hợp lưu lượng ổn định; time-based phản ánh gần đây nhưng cần clock và cleanup. Có minimum number of calls để tránh mở vì một lỗi duy nhất lúc khởi động. Slow-call rate có thể mở circuit dù call chưa lỗi. Quá nhạy gây flap; quá lỏng không bảo vệ. Theo dõi trạng thái, rejected calls và thời gian ở mỗi state.

### HALF_OPEN concurrency
Khi cooldown kết thúc, chỉ cho phép số probe cấu hình. Probe đang chạy cần được tính vào quota; concurrent calls khác bị reject hoặc nhận fallback. Nếu chỉ check state rồi increment không nguyên tử, nhiều request cùng thấy slot trống. Sau probe completion cần xử lý đúng một lần; callback trùng hoặc exception bị nuốt có thể làm state sai. Có thể dùng semaphore/atomic count hoặc thư viện đã kiểm chứng.

| Cơ chế | Vai trò |
|---|---|
| Timeout/deadline | giới hạn thời gian một call chiếm tài nguyên |
| Retry | thử lại lỗi có thể phục hồi, với giới hạn và backoff |
| Circuit breaker | tạm ngưng call khi lỗi vượt ngưỡng |
| Bulkhead | giới hạn số call đồng thời để cô lập tài nguyên |

### Production policy
Đặt breaker quanh đúng remote dependency, không quanh toàn request nếu có các bước độc lập. Fallback phải đúng nghiệp vụ: dữ liệu stale có thể chấp nhận, thanh toán không thể giả thành thành công. Nếu dùng retry bên trong breaker, định nghĩa một logical call hay từng attempt được tính; retry quá nhiều làm breaker mở muộn và khuếch đại tải. Gắn timeout nhỏ hơn deadline tổng, thêm jitter cho retry, và quan sát các transition.

### Liên hệ phỏng vấn
Mô tả state transitions cùng semantics của probe, rồi phân biệt timeout/retry/bulkhead. Hỏi thêm ngưỡng được chọn từ SLO và baseline nào, thay vì khẳng định một con số cố định phù hợp mọi service.`, {
      title: 'Cài breaker theo ngưỡng lỗi và đồng hồ giả',
      prompt: `Cài {{Breaker(threshold, openMillis, nowMillis)}} với {{failure(now)}}, {{success(now)}} và {{allow(now)}}. Sau threshold lỗi liên tiếp thì OPEN; hết thời gian thì HALF_OPEN và cho đúng một probe; probe success đóng, probe failure mở lại.`,
      starter: `class Breaker {
    Breaker(int threshold,long openMillis,long now) {}
    boolean allow(long now) { throw new UnsupportedOperationException("TODO"); }
    void failure(long now) { throw new UnsupportedOperationException("TODO"); }
    void success(long now) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,n=0;static void c(String s,boolean b){n++;if(b){p++;System.out.println("PASS "+s);}else System.out.println("FAIL "+s+": wrong state");}
 public static void main(String[] a){Breaker b=new Breaker(2,100,0);c("closed allows calls",b.allow(0));b.failure(1);c("below threshold stays closed",b.allow(2));b.failure(3);c("threshold opens",!b.allow(4));c("open rejects before cooldown",!b.allow(102));c("cooldown permits one probe",b.allow(103)&&!b.allow(103));b.success(104);c("probe success closes",b.allow(105));
  Breaker d=new Breaker(1,50,0);d.failure(0);c("probe failure reopens",d.allow(50));d.failure(51);c("reopened rejects",!d.allow(52));
  System.out.println("RESULT "+p+"/"+n);}
}`,
      reference: `class Breaker {
    private enum State { CLOSED, OPEN, HALF_OPEN }
    private final int threshold; private final long wait; private int failures; private State state=State.CLOSED; private long openedAt; private boolean probeUsed;
    Breaker(int threshold,long openMillis,long now){if(threshold<1||openMillis<0)throw new IllegalArgumentException();this.threshold=threshold;wait=openMillis;}
    boolean allow(long now){if(state==State.OPEN){if(now-openedAt<wait)return false;state=State.HALF_OPEN;probeUsed=false;}if(state==State.HALF_OPEN){if(probeUsed)return false;probeUsed=true;}return true;}
    void failure(long now){if(state==State.HALF_OPEN||++failures>=threshold){state=State.OPEN;openedAt=now;probeUsed=false;}}
    void success(long now){if(state==State.HALF_OPEN){state=State.CLOSED;failures=0;probeUsed=false;}else if(state==State.CLOSED)failures=0;}
}`,
      hints: ['OPEN chỉ chuyển HALF_OPEN khi now-openedAt đạt wait; HALF_OPEN chỉ cấp một permit.', 'Failure trong HALF_OPEN mở lại ngay; success trong HALF_OPEN đóng và reset chuỗi lỗi.'],
      explain: `Bài tập dùng lỗi liên tiếp để giữ state machine nhỏ; thư viện production thường hỗ trợ sliding window theo số call hoặc thời gian. Probe permit cần atomic trong code concurrent. Timeout của remote call vẫn phải riêng biệt; breaker không tự dừng một call đang treo.`,
    }, [
      { q: 'Đã có circuit breaker, bạn có còn cần timeout cho từng call không?', options: ['Không, breaker thay thế hoàn toàn timeout', 'Không, vì breaker tự huỷ call đang treo khi chuyển OPEN', 'Chỉ cần khi breaker ở HALF_OPEN', 'Có; breaker chỉ chặn call mới, call đã gửi đi vẫn cần deadline'], answer: 3, explain: `Breaker quyết định có cho call **mới** đi hay không; nó không dừng một call đang chờ. Không có timeout, call treo vẫn giữ thread/connection, và breaker cũng không nhận được tín hiệu lỗi để mở. Chuyển OPEN không huỷ call đang chạy. Timeout cần ở mọi trạng thái, không riêng HALF_OPEN.` },
      { q: 'HALF_OPEN dùng probe để làm gì?', options: ['Tạo thêm tải bất kể kết quả', 'Thử giới hạn call để quyết định đóng hay mở lại', 'Xoá lỗi khỏi log', 'Bỏ qua timeout'], answer: 1, explain: `Probe nhỏ kiểm chứng dependency hồi phục trước khi cho traffic bình thường. Nó không xoá log, bỏ timeout hay tự tạo tải vô hạn.` },
    ], ['circuit-breaker', 'resilience', 'state-machine']),

    lesson('005', 5, 'Idempotency key và retry exponential backoff', 'lead', [
      'Mô phỏng thanh toán retry an toàn bằng idempotency key và lưu kết quả trước khi trả',
      'Thiết kế retry có giới hạn, exponential backoff, jitter và phân biệt lỗi retryable',
    ], `### Retry tạo at-least-once
Client gửi thanh toán nhưng timeout không chứng minh server chưa xử lý. Nếu gửi lại request mới, khách có thể bị trừ tiền hai lần. Mạng không cho client biết chắc kết quả khi response mất; do đó thiết kế thực tế thường là at-least-once delivery cộng idempotent operation, không hứa exactly-once end-to-end.

### Idempotency key
Client tạo key ổn định cho một ý định thanh toán và gửi lại cùng key trong mọi retry. Server lưu key, request fingerprint và kết quả. Lần đầu claim key nguyên tử, thực hiện nghiệp vụ, lưu kết quả; lần sau cùng payload trả lại kết quả cũ. Nếu cùng key nhưng payload khác, trả conflict thay vì âm thầm trả nhầm. Key cần scope theo merchant/account và operation; TTL phải dài hơn cửa sổ retry nhưng phù hợp retention/compliance.

~~~text
key chưa có → claim → xử lý một lần → lưu response
key đã có + payload giống → trả response đã lưu
key đã có + payload khác → conflict
~~~

Đây là transaction boundary khó: nếu ghi key rồi process crash trước charge, key bị kẹt; nếu charge thành công rồi crash trước khi lưu response, retry có thể charge lần nữa. Cần transaction cùng ledger nếu cùng database, hoặc workflow/outbox và downstream idempotency nếu gọi payment provider. Trạng thái PROCESSING cần lease/timeout và cách reconcile; không chỉ dùng ConcurrentHashMap trong ứng dụng đa instance.

### Retry policy
Exponential backoff tăng khoảng chờ theo attempt: base × 2^attempt, có cap để tránh giá trị quá lớn. Jitter ngẫu nhiên giảm đồng bộ retry của nhiều client sau outage. Cách phổ biến là "full jitter": chờ một khoảng ngẫu nhiên trong [0, min(cap, base×2^attempt)]. Không có jitter, hàng nghìn client lỗi cùng lúc sẽ retry đúng cùng các mốc 100 ms, 200 ms, 400 ms… và đánh sập dependency thêm lần nữa. Retry chỉ lỗi transient (timeout, 429 theo Retry-After, một số 5xx), giới hạn attempt/deadline tổng, không retry lỗi validation hay mọi 4xx. Timeout mỗi attempt phải nằm trong deadline caller. Retry ở nhiều layer nhân số lần gọi: nếu gateway thử tối đa 3 lần và mỗi lần service bên dưới lại thử tối đa 3 lần với dependency, một request người dùng có thể thành 9 lần gọi; thêm một tầng nữa là 27. Nên chỉ retry ở một tầng.

### Mô phỏng thời gian
Bài tập dùng danh sách thời điểm retry thay vì sleep: delay attempt i là min(cap, base×2^i), tổng thời gian kiểm tra bằng số học. Trong production scheduler dùng monotonic clock; test chỉ kiểm tra policy, không chờ thời gian. Không giữ thread ngủ để backoff trong reactive/event-loop; schedule async. Resilience4j Retry cấu hình max attempts, interval function và exception predicate; policy không tự cung cấp idempotency storage.

| Cơ chế | Đảm bảo |
|---|---|
| Retry | tăng cơ hội thành công khi lỗi transient |
| Idempotency | cùng ý định gửi lại không nhân hiệu ứng |
| Timeout | giới hạn thời gian chờ mỗi attempt |
| Outbox | phát event sau commit một cách phục hồi được |

### Production checklist
Store unique constraint cho (scope,key), fingerprint canonical payload, kết quả/status, timestamps và retention. Claim phải nguyên tử; hai request đồng thời cùng key chỉ một request thực thi. Không lưu dữ liệu thẻ nhạy cảm trong bảng idempotency; lưu reference/token theo PCI controls. Metrics gồm duplicate hit, conflict, processing lâu và retry attempt; log key đã hash/redact. API trả semantics nhất quán khi request đầu còn PROCESSING (202/409 hoặc chờ có giới hạn).

### Pitfall
Key ngẫu nhiên mới mỗi lần retry vô hiệu hoá idempotency. Chỉ lưu key sau khi xử lý tạo race duplicate. Hash payload không canonical có thể đổi vì thứ tự JSON field; fingerprint cần canonical representation và include currency/merchant. Retention quá ngắn cho phép charge lặp từ retry muộn; vô hạn thì bảng tăng mãi. Retry một non-idempotent POST mà không có key là lỗi tài chính nghiêm trọng.

### Liên hệ phỏng vấn
Bắt đầu bằng tình huống response mất sau khi provider đã charge. Giải thích vì sao retry cần cùng key, nơi lưu key và transaction boundary; sau đó thêm retry budget, backoff+jitter, timeout, duplicate concurrent requests và reconciliation.`, {
      title: 'Mô phỏng idempotent payment và backoff xác định',
      prompt: `Cài {{PaymentService.pay(key, amount)}}: cùng key cùng amount chỉ ghi nhận một charge; cùng key khác amount ném IllegalArgumentException. {{Backoff.delay(attempt, base, cap)}} trả base×2^attempt có chặn cap, attempt bắt đầu từ 0.`,
      starter: `class PaymentService {
    int pay(String key,int amount) { throw new UnsupportedOperationException("TODO"); }
    int charges() { throw new UnsupportedOperationException("TODO"); }
}
class Backoff {
    static long delay(int attempt,long base,long cap) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,n=0;static void c(String s,boolean b){n++;if(b){p++;System.out.println("PASS "+s);}else System.out.println("FAIL "+s+": wrong result");}
 public static void main(String[] a){PaymentService s=new PaymentService();int x=s.pay("k1",500);c("same key reuses result",x==s.pay("k1",500));c("duplicate does not charge",s.charges()==1);boolean conflict=false;try{s.pay("k1",700);}catch(IllegalArgumentException e){conflict=true;}c("same key different payload conflicts",conflict&&s.charges()==1);
 c("exponential sequence",Backoff.delay(0,100,1000)==100&&Backoff.delay(1,100,1000)==200&&Backoff.delay(3,100,1000)==800);c("backoff is capped",Backoff.delay(8,100,1000)==1000);
 System.out.println("RESULT "+p+"/"+n);}
}`,
      reference: `class PaymentService {
    private final Map<String,Integer> amounts=new HashMap<>(); private final Map<String,Integer> results=new HashMap<>(); private int count;
    int pay(String key,int amount){if(key==null||key.isBlank()||amount<=0)throw new IllegalArgumentException();if(amounts.containsKey(key)){if(amounts.get(key)!=amount)throw new IllegalArgumentException("key payload conflict");return results.get(key);}amounts.put(key,amount);int result=++count;results.put(key,result);return result;}
    int charges(){return count;}
}
class Backoff {
    static long delay(int attempt,long base,long cap){if(attempt<0||base<0||cap<0)throw new IllegalArgumentException();long d=base;for(int i=0;i<attempt&&d<cap;i++)d=d>cap/2?cap:d*2;return Math.min(d,cap);}
}`,
      hints: ['Hai map giữ payload fingerprint/amount và kết quả; kiểm tra key đã tồn tại trước khi tăng charge count.', 'Tính doubling bằng vòng lặp và kiểm tra cap trước phép nhân để tránh overflow long.'],
      explain: `Bài mô phỏng lưu kết quả theo key để retry trả lại cùng receipt và không tăng số charge. Cùng key với payload khác phải conflict. Hai map ở đây đơn giản hoá trạng thái; hệ thống thật cần unique constraint/transaction để hai instance không xử lý đồng thời. Backoff có cap và tránh overflow; thêm jitter trong production nhưng test policy cơ bản nên deterministic.`,
    }, [
      { q: 'Client timeout sau khi server đã charge. Retry an toàn cần gì?', options: ['Tạo key mới cho lần retry', 'Gửi lại cùng idempotency key và payload', 'Bỏ qua lưu kết quả', 'Retry vô hạn'], answer: 1, explain: `Cùng key và payload cho phép server nhận diện cùng ý định và trả kết quả đã ghi. Key mới tạo operation mới; không lưu kết quả dẫn tới duplicate; retry vô hạn gây tải và không đảm bảo an toàn.` },
      { q: 'Vì sao thêm jitter vào exponential backoff?', options: ['Để giảm việc nhiều client retry cùng một thời điểm sau outage', 'Để mọi client retry cùng lúc cho nhanh', 'Để không cần timeout nữa', 'Để thay idempotency key'], answer: 0, explain: `Jitter phân tán thời điểm retry, tránh thundering herd khi dependency vừa hồi phục; retry đồng loạt chính là điều cần tránh. Jitter không liên quan timeout (mỗi attempt vẫn cần deadline) và không thay idempotency (retry vẫn có thể gửi trùng nên server vẫn phải nhận diện bằng key).` },
    ], ['idempotency', 'retry', 'payments']),

    lesson('006', 6, 'Transactional outbox: vì sao không gửi Kafka trong transaction DB', 'senior', [
      'Giải thích được dual-write là gì và liệt kê đúng các trạng thái lệch nó tạo ra giữa DB và broker',
      'Viết outbox table + relay phục hồi được sau crash, hiểu vì sao semantics là at-least-once',
      'Biết cách làm consumer idempotent và giữ thứ tự event theo aggregate',
      'Chọn được giữa relay polling và CDC (Debezium) theo hạ tầng đang có',
    ], `### Bài toán: một nghiệp vụ, hai hệ thống phải ghi

Service "tạo đơn hàng" phải làm hai việc: ghi đơn vào MySQL và báo cho các hệ thống khác (kho vận, email, tích điểm) qua Kafka. **Kafka** là hàng đợi sự kiện phân tán, mấy khái niệm cần biết trước đã: **producer** là app gửi message; **topic** là hộp thư có tên (order-created); topic chia thành nhiều **partition** là các luồng ghi tuần tự song song, và Kafka chỉ đảm bảo **thứ tự trong một partition**; **broker** là server giữ các partition (mỗi partition được nhân bản sang broker khác để không mất khi một server chết); **consumer** đọc message và ghi lại **offset** (con trỏ cho biết đã đọc tới đâu) để lần sau đọc tiếp.

Cách viết tự nhiên nhất là:

~~~java
@Transactional
public void placeOrder(Order o) {
    orderRepo.save(o);                 // (1) DB commit khi method kết thúc
    kafka.send("order-created", o);    // (2) gửi message từ trong cùng method
}
~~~

Hai bước này nằm ở **hai hệ thống không có transaction chung**. Liệt kê mọi khả năng:

| Tiến trình chết ở đâu | Kết quả thực tế | Hậu quả |
|---|---|---|
| Trước khi commit | không đơn, không event | ổn, client retry |
| Sau commit, trước send | có đơn, không có event | kho vận không bao giờ biết, **mất event vĩnh viễn** vì không còn gì ghi nhớ rằng event cần gửi |
| Đang send, ack bị mất | có đơn, có thể có 2 event | trùng, consumer phải chịu được |
| Send xong, commit thất bại (ràng buộc uniqueness, exception phía sau) | không đơn, có event | hệ thống kia làm việc cho đơn **không tồn tại** |

Đây là bài toán **dual-write**: không tồn tại một lệnh COMMIT phủ lên hai hệ thống độc lập, nên không có cách nào "chạy lại đúng chỗ bị đứt" nếu app chỉ biết mỗi lần gửi.

### 2PC/XA: hướng giải quyết "đúng" nhưng hầu như không ai dùng
**Two-Phase Commit (2PC)**: một transaction manager hỏi tất cả bên tham gia (DB, broker hỗ trợ **XA**) "chuẩn bị xong chưa?" (phase prepare, các bên giữ lock), khi tất cả trả lời xong mới ra lệnh commit. Cái giá: transaction manager là điểm lỗi tập trung, lock bị giữ suốt phase prepare nên throughput thường giảm vài lần, một bên treo làm toàn bộ treo theo, và nó phá mất tính độc lập triển khai của microservices. Vì thế trong hệ thống thực người ta đổi yêu cầu: không cố đạt exactly-once trên hai hệ thống, mà làm cho **một hệ thống trở thành điểm cam kết duy nhất**.

### Outbox: đưa cả hai ghi về cùng một transaction
Ý tưởng: đừng gửi Kafka trong transaction. Thay vào đó ghi message vào **một bảng của chính database nghiệp vụ**, cùng transaction:

~~~sql
CREATE TABLE outbox (
  id           BIGINT PRIMARY KEY,      -- event id ổn định, không sinh lại khi retry
  agg_id       VARCHAR(64),             -- order-7: dùng làm partition key
  event_type   VARCHAR(64),
  payload      JSON,
  created_at   DATETIME(3),
  delivered_at DATETIME(3) NULL         -- NULL = chưa relay
);
INSERT INTO orders (...);               -- nghiệp vụ
INSERT INTO outbox (...);               -- event cần gửi
COMMIT;                                 -- MỘT commit cho cả hai dòng
~~~

Vì hai INSERT nhắm vào cùng một database, tính nguyên tử do chính database đảm bảo: hoặc đơn hàng và event cùng tồn tại, hoặc cả hai cùng không. Không còn trạng thái "có đơn mà thiếu event", và cũng không còn "event cho đơn đã rollback". Một thành phần thứ hai, **relay**, sẽ lấy các dòng có delivered_at IS NULL và gửi sang Kafka sau.

Giá phải trả, nói thẳng từ đầu: event tới Kafka **muộn hơn** commit một khoảng (độ trễ poll, thường vài trăm ms tới vài giây), và semantics là **at-least-once** (relay có thể gửi trùng). Cả hai đều xử lý được và đều là đánh đổi chủ động, không phải lỗi.

~~~seq
title: Outbox relay, một điểm cam kết duy nhất
actors: Service | MySQL | Relay | Kafka | Consumer
Service -> MySQL: BEGIN, INSERT orders và INSERT outbox
MySQL --> Service: COMMIT, cả hai dòng đã nằm trong log
note Service..MySQL: Crash ở đây thì chưa có event, client retry an toàn
Relay -> MySQL: SELECT WHERE delivered_at IS NULL
MySQL --> Relay: batch event chưa gửi
Relay -> Kafka: send với partition key order-7
Relay -> MySQL: UPDATE SET delivered_at = now
note Relay..Kafka: Crash giữa send và update thì lần sau gửi lại
Kafka -> Consumer: phát event, có thể trùng lặp
Consumer -> Consumer: kiểm event id, bỏ qua nếu đã áp dụng
~~~

### Relay: polling hay CDC
- **Polling**: relay chạy SELECT theo chu kỳ, gửi Kafka, rồi UPDATE delivered_at (hoặc xoá dòng sang bảng archive). Ưu: không thêm hạ tầng, chỉ cần database. Nhược: tải đọc lặp lại trên database nguồn, độ trễ bằng chu kỳ poll, và phải có chỉ mục trên (delivered_at, id) để không scan cả bảng.
- **CDC (Change Data Capture)**: công cụ như **Debezium** chạy trong Kafka Connect đọc **transaction log** của database (binlog MySQL, WAL PostgreSQL) và phát mỗi thay đổi thành message, trong đó có dòng mới INSERT vào bảng outbox. Ưu: không truy vấn bảng nghiệp vụ, độ trễ thấp, và log đã chứa cả đơn hàng lẫn dòng outbox nên thứ tự của chúng được giữ nguyên. Nhược: thêm một hạ tầng phải vận hành, cần quyền đọc log, schema change phải quản lý.

### At-least-once và consumer idempotent
Luôn tồn tại cửa sổ "đã gửi sang Kafka nhưng chưa kịp đánh dấu delivered" (relay chết đúng lúc đó, hoặc ack tới chậm). Lần relay sau thấy dòng vẫn NULL nên gửi lại. Không xoá được cửa sổ này nếu không có coordination kiểu 2PC, nên thay vì hứa exactly-once ở producer, ta **chấp nhận trùng và bắt consumer chịu trùng**:
- Mỗi event mang **event id ổn định** (id của dòng outbox), không phải UUID sinh lại mỗi lần gửi.
- Consumer lưu id đã xử lý (bảng processed_event có primary key, Redis SET có TTL, hoặc state store của consumer) và bỏ qua id đã thấy — biến "gửi 2 lần" thành "áp dụng 1 lần".
- Ưu tiên thao tác **tự nhiên idempotent**: UPDATE status='PAID' WHERE order_id=? AND status='NEW' chạy hai lần chỉ có một hiệu lực; "cộng 100 điểm" thì không idempotent, phải chuyển thành "cộng điểm theo reference key = event id".

### Thứ tự theo aggregate
Muốn consumer thấy "đã tạo đơn" trước "đã thanh toán" thì mọi event của **cùng một đơn hàng** phải đi qua **cùng một partition**: lấy agg_id làm partition key. Khi đó cần thêm hai điều: relay gửi tuần tự cho một key (không song song hoá các event cùng đơn), và retry cho một key phải chờ vì Kafka không tự sắp xếp lại message đã vào partition. Lưu ý số partition của topic không tăng vô hạn: tăng partition làm thay đổi cách chia key, nên kế hoạch sức chứa cần quyết định sớm.

### Outbox không tự giải quyết chuyện gì
- Không đảm bảo Kafka đã nhận bền vững: producer vẫn phải cấu hình acks=all, retries, **enable.idempotence=true** (chống trùng và mất bên trong chính Kafka), min.insync.replicas đủ.
- Không sửa được đọc từ replica: nếu service đọc replica để chịu tải, đơn hàng có thể chưa hiện ra trong khi event đã được relay gửi — cần đọc primary cho dòng vừa ghi.
- Bảng outbox lớn mãi: cần job archive dòng đã delivered, chỉ mục hỗ trợ, và với hệ lớn thì shard cả bảng outbox theo agg_id.
- Không làm cho nghiệp vụ thành công trở lại: nếu business logic đã commit, event sẽ đi **chậm** chứ không bị rút lại. Nghiệp vụ cần "rút lại" phải phát thêm event đảo ngược (compensating), xem saga.

### Pitfall thực tế
- Đánh dấu delivered **trước** khi nhận ack từ Kafka: mất thật sự message đang gửi dở.
- Payload nhét dữ liệu "nóng" (số dư hiện tại): event nên mô tả cái đã xảy ra; ai cần giá trị hiện tại thì đọc nguồn chuẩn.
- Chạy hai instance relay mà không phân công: không sai về at-least-once, nhưng trùng nhiều hơn và thứ tự theo key dễ vỡ.
- Đặt bảng outbox ở database **khác** database nghiệp vụ: mất đúng thứ vừa mua, quay về dual-write.
- Không theo dõi **relay lag** (now - created_at của dòng lâu nhất chưa delivered): sự cố chỉ lộ ra khi bộ phận kho vận gọi điện hỏi sao đơn nằm im.

### Liên hệ phỏng vấn
Trả lời theo khung: (1) dual-write và ba trạng thái lệch; (2) outbox gom tất cả về một điểm cam kết, đổi lấy độ trễ và at-least-once; (3) relay polling hay CDC tuỳ hạ tầng; (4) consumer idempotent + partition key theo aggregate; (5) vận hành: metric relay lag, cleanup, cấu hình producer. Nếu bị hỏi "sao không dùng Kafka transaction": transaction của Kafka producer (Kafka 0.11+, dùng cho stream processing exactly-once) chỉ phối hợp được các thao tác **bên trong** Kafka, nó không commit cùng MySQL. Nếu bị hỏi "sao không dùng XA": trả lời bằng chi phí lock và coordination ở trên.
Bài tập dưới đây mô phỏng DB và broker có thể sập giữa chừng, để chính bạn chạy và thấy dual-write mất event còn outbox thì không.`, {
      title: 'Chứng minh dual-write mất event, outbox thì không',
      prompt: `Hạ tầng mô phỏng đã có sẵn trong file test (bạn không cần viết), với API như sau:

~~~java
final class Sim {
    static class Crash extends RuntimeException { }  // process chet giua chung thao tac
    Map<String,String> orders;      // dong DON HANG da commit
    Map<String,String> outbox;      // dong OUTBOX da commit
    Set<String> delivered;          // outbox id da relay xong
    List<String> broker;            // message Kafka THỰC SỰ nhận được
    Set<String> applied;            // event consumer đã áp dụng
    String crashBefore;             // "commit" | "publish" | "mark" | null
    void begin()                    // mở transaction
    void saveOrder(String id)       // INSERT pending, chỉ bền vững sau commit
    void saveOutbox(String id)      // INSERT outbox pending
    void commit()                   // crashBefore = "commit": bỏ pending, ném Crash
    void publish(String id)         // crashBefore = "publish": ném Crash, broker không đổi
    void mark(String id)            // crashBefore = "mark": ném Crash, chưa kịp delivered
    boolean apply(String id)        // true = lần đầu tiên, false = bản sao
    void recover()                  // process đã khởi động lại
}
~~~

Cài class {{Outbox}} với các static method, dùng **đúng** thứ tự thao tác được yêu cầu để kết quả crash không phụ thuộc cách viết:
1. {{dualWrite(sim, id)}}: begin, saveOrder, commit, rồi publish. Không bắt Crash, mặc nó bay ra cho caller.
2. {{writeWithOutbox(sim, id)}}: begin, saveOrder, saveOutbox, commit. **Không** publish ở bước này.
3. {{relay(sim)}}: với mỗi id có trong outbox mà chưa có trong delivered, publish rồi mark id đó.
4. {{consume(sim, id)}}: trả về kết quả {{apply}} của consumer (true = event mới, false = trùng lặp).
`,
      starter: `class Outbox {
    static void dualWrite(Sim sim, String id) { throw new UnsupportedOperationException("TODO"); }
    static void writeWithOutbox(Sim sim, String id) { throw new UnsupportedOperationException("TODO"); }
    static void relay(Sim sim) { throw new UnsupportedOperationException("TODO"); }
    static boolean consume(Sim sim, String id) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int p = 0, n = 0;
    static void c(String s, boolean ok, String detail) {
        n++;
        if (ok) { p++; System.out.println("PASS " + s); }
        else System.out.println("FAIL " + s + ": " + detail);
    }
    static void quiet(Runnable r) { try { r.run(); } catch (Sim.Crash e) { } }
    static int count(List<String> l, String x) { int k = 0; for (String v : l) if (v.equals(x)) k++; return k; }
    public static void main(String[] a) {
        Sim s1 = new Sim();
        Outbox.dualWrite(s1, "o1");
        c("dual write works while nothing fails", s1.orders.containsKey("o1") && count(s1.broker, "o1") == 1, "orders=" + s1.orders.keySet() + " broker=" + s1.broker);

        Sim s2 = new Sim();
        s2.crashBefore = "publish";
        quiet(() -> Outbox.dualWrite(s2, "o1"));
        s2.recover();
        Outbox.relay(s2);
        c("dual write loses the event when it dies at publish", s2.orders.containsKey("o1") && s2.broker.isEmpty(), "orders=" + s2.orders.keySet() + " broker=" + s2.broker);

        Sim s3 = new Sim();
        s3.crashBefore = "commit";
        quiet(() -> Outbox.writeWithOutbox(s3, "o1"));
        c("outbox write is atomic with the order row", s3.orders.isEmpty() && s3.outbox.isEmpty() && s3.broker.isEmpty(), "orders=" + s3.orders.keySet() + " outbox=" + s3.outbox.keySet() + " broker=" + s3.broker);

        Sim s4 = new Sim();
        Outbox.writeWithOutbox(s4, "o1");
        s4.crashBefore = "publish";
        quiet(() -> Outbox.relay(s4));
        c("a crashed relay keeps the row pending", s4.outbox.containsKey("o1") && !s4.delivered.contains("o1") && s4.broker.isEmpty(), "outbox=" + s4.outbox.keySet() + " delivered=" + s4.delivered + " broker=" + s4.broker);
        s4.recover();
        Outbox.relay(s4);
        Outbox.relay(s4);
        c("relay publishes each outbox row exactly once when ack arrives", count(s4.broker, "o1") == 1 && s4.delivered.contains("o1"), "broker=" + s4.broker + " delivered=" + s4.delivered);

        Sim s5 = new Sim();
        Outbox.writeWithOutbox(s5, "o1");
        s5.crashBefore = "mark";
        quiet(() -> Outbox.relay(s5));
        s5.recover();
        Outbox.relay(s5);
        c("losing the ack gives at-least-once, i.e. a duplicate", count(s5.broker, "o1") == 2, "broker=" + s5.broker);
        c("consumer dedupes the redelivered event", Outbox.consume(s5, "o1") && !Outbox.consume(s5, "o1") && s5.applied.size() == 1, "applied=" + s5.applied);
        System.out.println("RESULT " + p + "/" + n);
    }
}
final class Sim {
    static class Crash extends RuntimeException { Crash() { super("crash giua chung thao tac"); } }
    final Map<String,String> orders = new LinkedHashMap<>();
    final Map<String,String> outbox = new LinkedHashMap<>();
    final Set<String> delivered = new LinkedHashSet<>();
    final List<String> broker = new ArrayList<>();
    final Set<String> applied = new HashSet<>();
    String crashBefore;
    private boolean inTx;
    private final Map<String,String> pendOrders = new LinkedHashMap<>();
    private final Map<String,String> pendOutbox = new LinkedHashMap<>();
    void begin() { if (inTx) throw new IllegalStateException("begin phia trong transaction dang mo"); inTx = true; }
    void saveOrder(String id) { requireTx("saveOrder"); pendOrders.put(id, "payload-" + id); }
    void saveOutbox(String id) { requireTx("saveOutbox"); pendOutbox.put(id, "payload-" + id); }
    void commit() {
        requireTx("commit");
        inTx = false;
        if ("commit".equals(crashBefore)) { pendOrders.clear(); pendOutbox.clear(); throw new Crash(); }
        orders.putAll(pendOrders); outbox.putAll(pendOutbox);
        pendOrders.clear(); pendOutbox.clear();
    }
    void publish(String id) {
        if ("publish".equals(crashBefore)) throw new Crash();
        broker.add(id);
    }
    void mark(String id) {
        if ("mark".equals(crashBefore)) throw new Crash();
        delivered.add(id);
    }
    boolean apply(String id) { return applied.add(id); }
    void recover() { crashBefore = null; }
    private void requireTx(String op) { if (!inTx) throw new IllegalStateException(op + " phia ngoai transaction"); }
}`,
      reference: `class Outbox {
    static void dualWrite(Sim sim, String id) {
        sim.begin();
        sim.saveOrder(id);
        sim.commit();
        sim.publish(id);                       // thuoc he thong khac, khong the commit cung DB
    }
    static void writeWithOutbox(Sim sim, String id) {
        sim.begin();
        sim.saveOrder(id);
        sim.saveOutbox(id);
        sim.commit();                          // MỘT commit cho cả đơn hàng lẫn event
    }
    static void relay(Sim sim) {
        List<String> pending = new ArrayList<>();
        for (String id : sim.outbox.keySet()) if (!sim.delivered.contains(id)) pending.add(id);
        for (String id : pending) {
            sim.publish(id);                   // gui truoc...
            sim.mark(id);                      // ...roi moi danh dau: crash o day sinh duplicate
        }
    }
    static boolean consume(Sim sim, String id) { return sim.apply(id); }
}`,
      hints: [
        'dualWrite gọi publish SAU commit: khi crash đúng lúc publish thì không còn dấu vết nào cho relay biết event cần gửi, nên event mất vĩnh viễn.',
        'relay nên chép danh sách id chưa delivered ra một List rồi mới gửi, để không sửa collection đang duyệt.',
        'Thứ tự publish rồi mark là có chủ ý: crash giữa hai bước làm lần relay sau gửi lại (at-least-once). Ngược lại mark rồi publish sẽ mất message.',
        'consume chỉ cần trả về kết quả của sim.apply(id): true là lần đầu áp dụng, false là bản sao trùng lặp.',
      ],
      explain: `Ba kết luận của bài chạy được ngay trong output: (1) dualWrite crash ở publish để lại dòng trong {{orders}} còn {{broker}} rỗng, và {{relay}} sau đó chịu hết — dual-write không ghi lại ở đâu rằng event còn phải gửi; (2) writeWithOutbox crash ở commit thì không còn gì cả, client retry sạch sẽ, đó chính là tính nguyên tử mà outbox mua được; (3) crash giữa publish và mark tạo duplicate thật ({{broker}} chứa o1 hai lần) tức at-least-once, và consumer đã lưu event id nên hiệu lực nghiệp vụ chỉ xảy ra một lần. Trong production, delivered_at thường được thay bằng xoá dòng hoặc chuyển sang bảng archive, và mark phải xảy ra SAU khi producer nhận ack.`,
    }, [
      { q: 'Vì sao gọi {{kafka.send}} bên trong method có {{@Transactional}} vẫn có thể mất event?', options: ['Vì Kafka không có transaction nên Spring không gửi được từ trong method', 'Vì hai thao tác thuộc hai hệ thống không có điểm cam kết chung: chết giữa commit và send để lại đơn hàng mà không có event', 'Vì {{@Transactional}} luôn rollback khi có producer send trong cùng method', 'Vì phải dùng {{@KafkaListener}} thay cho producer send'], answer: 1, explain: `Đây chính là dual-write: Spring commit DB lúc method kết thúc, còn send là gọi tới một hệ thống khác. Kafka Có transaction (Kafka 0.11+) nhưng chúng chỉ phối hợp các thao tác trong nội bộ Kafka, không commit cùng MySQL, nên phương án đầu sai ở tiền đề. {{@Transactional}} không tự rollback vì có send, và {{@KafkaListener}} là phía consumer, không liên quan tới việc gửi.` },
      { q: 'Relay gửi message thành công nhưng chết trước khi ghi delivered_at. Semantics nào mô tả đúng?', options: ['Exactly-once, vì relay sẽ không gửi lại dòng đã gửi rồi', 'At-most-once, vì message có thể đã mất', 'At-least-once, vì lần relay sau vẫn thấy dòng chưa delivered nên gửi lại, và consumer phải idempotent', 'Best-effort, chỉ gửi lại khi có yêu cầu'], answer: 2, explain: `Không có cách nào biết "đã gửi nhưng chưa kịp đánh dấu" nếu không thêm coordination, nên thiết kế chấp nhận gửi lại và dồn việc khử trùng cho consumer (lưu event id đã áp dụng). Exactly-once là hứa vượt khả năng của relay; at-most-once thì ngược lại (message không mất, chỉ trùng); và không cần ai yêu cầu cả, vòng lặp relay tự phát hiện dòng còn pending.` },
      { q: 'Vì sao relay nên dùng id aggregate (order id) làm partition key khi gửi Kafka?', options: ['Để Kafka nhân bản message sang broker khác', 'Vì Kafka chỉ giữ thứ tự trong một partition, nên mọi event của cùng một đơn phải nằm cùng partition', 'Để giảm số partition cần tạo cho topic', 'Vì partition key là bắt buộc và chỉ được là id aggregate'], answer: 1, explain: `Replication (phương án đầu) độc lập với partition key. Thứ tự tuần tự chỉ được Kafka đảm bảo trong phạm vi một partition, nên muốn "tạo đơn" tới trước "thanh toán" thì hai event của cùng đơn phải cùng partition. Partition key có thể là bất kỳ chuỗi nào, không bắt buộc là id aggregate, và việc chọn key không làm giảm số partition của topic.` },
      { q: 'So với CDC (Debezium), nhược điểm chính của relay polling là gì?', options: ['Phải xin quyền đọc transaction log của database', 'Tạo tải đọc lặp lại trên chính database nguồn và độ trễ bằng chu kỳ poll', 'Không thể giữ thứ tự event theo aggregate', 'Luôn gửi trùng message'], answer: 1, explain: `Polling chạy SELECT WHERE delivered_at IS NULL theo chu kỳ trên database nghiệp vụ, vừa tốn tài nguyên vừa trễ một khoảng bằng chu kỳ; quyền đọc log là chi phí của CDC chứ không phải polling. Thứ tự vẫn giữ được nếu đọc theo id và gửi với partition key đúng, còn trùng lặp là đặc trưng at-least-once của cả hai cách.` },
    ], ['outbox', 'kafka', 'dual-write', 'cdc']),

    lesson('007', 7, 'Sharding: chọn shard key, hot partition và resharding', 'senior', [
      'Chọn shard key theo bốn tiêu chí và chỉ ra được hệ quả của từng lựa chọn',
      'Phân biệt hash-based với range-based, biết khi nào scatter-gather xuất hiện',
      'Đo và giải thích hot partition bằng số liệu, không bằng cảm giác',
      'Mô tả quy trình resharding an toàn và lý do hash modulo phải đổi chỗ nhiều key',
    ], `### Shard là gì, và khi nào thật sự cần
**Sharding** (phân vùng ngang) là chia một bảng lớn thành nhiều **shard**, mỗi shard là một database độc lập chạy ở một máy khác nhau, kèm một quy tắc **shard key** cho biết bản ghi nào nằm ở shard nào. Cần phân biệt với **read replica**: replica chỉ là bản sao để gánh thao tác đọc, mọi ghi vẫn dồn về một node, dung lượng vẫn một node. Sharding giải quyết đồng thời ba giới hạn: số ghi/giây và số connection của một node, dung lượng đĩa, và kích thước index (B+Tree sâu hơn khi bảng phình, maintenance như index rebuild hay ALTER mất hàng giờ).

Ví dụ con số: bảng orders 900 triệu dòng, mỗi dòng 2 KB chưa tính index. Một node chứa khoảng 2 TB dữ liệu nóng là đã rất khó vận hành; chia 16 shard xuống còn khoảng 56 triệu dòng và 125 GB mỗi shard, mỗi shard có thể backup và migrate độc lập.

Vì dữ liệu nằm rải nên **mọi query đều phải biết đi đâu**. Đây là lý do chọn shard key gần như không thể sửa lại về sau.

### Bốn tiêu chí chọn shard key
1. **Xuất hiện trong gần mọi query.** Không có nó trong WHERE thì app phải bắn query tới tất cả shard (mục scatter-gather).
2. **Phân phối đều cả dung lượng lẫn lưu lượng.** Nhiều dòng không đồng nghĩa nhiều request: một tenant có 10 triệu đơn nhưng bị lãng quên vẫn nhẹ hơn tenant 100 nghìn đơn được quét mỗi giây.
3. **Không đổi sau khi ghi.** Đổi giá trị shard key nghĩa là xoá ở shard này và chèn ở shard khác, không còn là một UPDATE trong một transaction.
4. **Không tạo điểm nóng theo thời gian.** Shard theo ngày thì shard "hôm nay" ăn 100% thao tác ghi.

Thực tế hay chọn id của **aggregate** (orderId, userId) vì thoả 1 và 3; tránh created_at vì phá 2 và 4.

### Hash-based
~~~java
int shard = Math.floorMod(orderId.hashCode(), SHARDS);   // 0..SHARDS-1
~~~
Ưu: không cần bảng ánh xạ, phân phối đều khi key đa dạng, thao tác route O(1). Nhược: mất hoàn toàn **locality**, nên mọi query theo khoảng (theo thời gian, theo tiền tố, BETWEEN, LIMIT/OFFSET lớn) trở thành scatter-gather; và khi đổi SHARDS thì gần như mọi key đổi chỗ. Con số đo được: với 1200 key "user-0" tới "user-1199", tăng từ 4 lên 6 shard làm **802 key (66,8%)** đổi shard, vì {{h % 4}} và {{h % 6}} chỉ trùng nhau trên một phần các lớp đồng dư.

Bẫy kinh điển: {{Math.abs(hash) % n}}. Với {{hash == Integer.MIN_VALUE}} thì {{Math.abs}} vẫn trả về số âm (số nguyên bù hai overflow) → IndexOutOfBounds. Luôn dùng {{Math.floorMod}}.

### Range-based
Mỗi shard phụ trách một khoảng giá trị: shard 0 nhận id 0 tới 99 999 999, shard 1 nhận khoảng tiếp theo, lưu trong một **bảng ánh xạ** (shard directory). Ưu: giữ được locality, query "các đơn của tháng này" chỉ đụng một shard, và thêm shard mới thường chỉ là cắt thêm một khoảng mới ở đầu trên của dải, không phải di chuyển dữ liệu cũ. Nhược: skew — nếu dữ liệu tăng theo thời gian thì shard cuối luôn nóng; và bảng ánh xạ phải được quản lý có phiên bản, nếu không hai instance sẽ hiểu khác nhau về cùng một khoảng.

| Tiêu chí | Hash | Range |
|---|---|---|
| Cân bằng dung lượng | tốt | phụ thuộc cách chia khoảng |
| Query có shard key | 1 shard | 1 shard |
| Query khoảng, sort | scatter-gather tới mọi shard | tốt, tại chỗ |
| Tăng số shard | nhiều key phải chuyển | thường chỉ thêm shard mới |
| Hot tenant | rải được nếu key là id đơn hàng | dễ nóng theo khoảng |
| Cần hạ tầng thêm | không | có bảng ánh xạ + người quản lý |

### Hot partition và cách đo
Tình huống thật: 900 trong 1000 request gần đây thuộc về một tenant lớn. Nếu shard key là tenantId, toàn bộ lượng ghi đó dồn vào MỘT shard, p99 của shard đó kéo theo cả hệ thống, trong khi 7 shard còn lại ngồi chơi. Nếu shard key là id đơn hàng (mỗi đơn một id khác nhau), cùng 1000 key đó phân phối trên 8 shard thành 124 tới 126 key mỗi shard, chỉ số imbalance chỉ 0,016.

Để không tranh luận bằng cảm giác, dùng hai con số: {{counts}} (số key/số request mỗi shard) và {{imbalance = (max - min) / average}} — bằng 0 khi hoàn hảo đều, xấp xỉ số shard trừ 1 khi có một shard ăn gần hết. Bài tập đo chính hai đại lượng này.

Xử lý hot partition theo thứ tự chi phí tăng dần: tách tenant lớn sang shard dành riêng (chiến lược "dedicated shard", phổ biến với khách enterprise); muối key (salt) thành tenantId + '#' + (n % 16) để chia nhỏ, đổi lại mọi query theo tenant phải gom 16 sub-shard; thêm read replica cho phía đọc; hoặc đổi shard key sang mức entity và giữ một bảng tra tenantId tới danh sách shard.

### Scatter-gather
Query {{WHERE status = 'PAID' ORDER BY created_at LIMIT 20 OFFSET 1000}} trên 32 shard: shard không biết ai là 1000 dòng đầu toàn cục, nên mỗi shard phải trả về 1020 dòng đã sort cục bộ, app gộp và sort lại. Nghĩa là 32 640 dòng đi qua mạng cho một trang 20 dòng, và chi phí tăng theo OFFSET. Cách giảm:
- Luôn kèm shard key trong WHERE khi nghiệp vụ cho phép (query theo đơn hàng thì có orderId).
- Đưa loại query "lướt không có key" sang một **view** riêng: Kafka event (xem bài outbox) đổ vào Elasticsearch/OpenSearch hoặc một service tổng hợp, coi đó là công cụ tìm kiếm chứ không phải nguồn sự thật.
- Phân trang bằng cursor (seek theo cặp (created_at, id)) thay vì OFFSET.
- Đặt timeout và giới hạn fan-out, vì một query chậm chiếm connection trên mọi shard một lúc. Lưu ý connection pool nhân theo số shard: 32 shard, pool 10 thì một instance app đã mở tới 320 kết nối.

### Resharding 4 lên 6 mà không dừng dịch vụ
Không thể chạy UPDATE trên hàng trăm triệu dòng giữa giờ cao điểm, và nếu app tính {{hash % N}} cứng thì phiên bản mới và cũ sẽ ghi vào hai shard khác nhau. Quy trình chuẩn dùng bảng ánh xạ có phiên bản (directory) và chuyển theo các bước:

~~~seq
title: Resharding 4 lên 6, không dừng dịch vụ
actors: App | Router | Shard cu | Shard moi | Migration job
App -> Router: route(order-42) theo directory phiên bản 3
Router -> Shard cu: đọc và ghi như bình thường
Migration job -> Shard cu: quét toàn bộ key, tính shard mới cho từng key
Migration job -> Shard moi: copy key đang đổi chủ
note Shard cu..Shard moi: trong lúc copy phải catch-up các ghi mới
App -> Router: ghi mới vào cả shard cũ lẫn shard mới
Migration job -> Router: so sánh để xác nhận hai bên đã khớp
Router -> Shard moi: cắt song ghi, chuyển đọc sang phiên bản 4
Router --> App: API không đổi, router tự quyết
~~~

Thứ tự an toàn: (1) bật **song ghi** để mọi ghi mới xuất hiện ở cả hai bên; (2) **backfill** dữ liệu cũ; (3) **catch-up** và **đối chiếu** (đếm, so checksum theo khoảng); (4) chuyển đọc theo tỷ lệ nhỏ (5%, 25%, 100%) để có thể quay đầu; (5) bỏ shard cũ sau một khoảng an toàn. Nếu dùng consistent hashing với virtual node (bài lesson-design-003), lượng key phải chuyển khi thêm một shard chỉ còn xấp xỉ 1/(N+1), tức khoảng 17% cho trường hợp 4 lên 5, thay vì 66,8%.

### Ràng buộc xuyên shard
- **UNIQUE toàn bảng** (email, số điện thoại) không còn do một database đảm bảo. Hướng giải quyết: bảng tra email_hash tới userId đặt ở shard cố định và cấp phát id qua một service, hoặc chấp nhận kiểm tra "gần đúng" rồi sửa bằng sự kiện đền bù.
- **JOIN và foreign key** giữa hai bảng shard theo key khác nhau không thực hiện được ở tầng DB. Thiết kế theo hướng **shard cùng chỗ**: các bảng của một aggregate dùng chung shard key (orders và order_items đều theo orderId).
- **Transaction nhiều shard**: chuyển thành saga với event idempotent, hoặc thu nhỏ đơn vị transaction về một shard.
- **Khoá phân tán và dead lock** khi một nghiệp vụ chạm hai shard theo thứ tự khác nhau: luôn lấy khoá theo cùng một thứ tự (sắp xếp theo shard id).

### Pitfall
- Shard theo {{created_at}} cho dữ liệu time-series: shard hiện tại luôn nóng và luôn là nút thắt ghi; nếu vẫn muốn locality theo thời gian thì kết hợp (nhóm theo tháng, trong nhóm hash theo id).
- Chạy migration mà không có lối quay đầu: phải giữ khả năng đọc lại shard cũ cho tới khi dữ liệu mới ổn định.
- Quên rằng công cụ vận hành cũng phải shard: job scan toàn bảng, báo cáo thống kê, và backup đều trở thành fan-out.
- Để logic route nằm rải rác trong app: đổi chính sách route là một cuộc đại tu. Nhét nó vào một lớp Router/thư viện dùng chung, có phiên bản trong cấu hình.

### Liên hệ phỏng vấn
Khung trả lời: (1) nêu áp lực khiến phải shard (ghi, dung lượng, connection, index) và bác bỏ khả năng chỉ dùng replica; (2) hỏi lại pattern truy cập trước khi chọn shard key, vì đó là quyết định khó đảo nhất; (3) hash hay range kèm lý do và hệ quả locality; (4) hot tenant xử lý thế nào (dedicated shard, salt, replica) và đo bằng imbalance; (5) scatter-gather cho query không có key, kèm giải pháp view/index; (6) quy trình resharding và cách giảm lượng key chuyển. Câu đào sâu thường là "email unique thì sao", "làm sao biết shard nào nóng", và "đã merge hai shard chưa, merge khó hơn split ở đâu".`, {
      title: 'Đo độ lệch tải và đếm key phải chuyển khi tăng shard',
      prompt: `Cài class {{Router}} với năm static method, chỉ dùng JDK.

- {{hashShard(key, shards)}}: trả về chỉ số shard trong {{0..shards-1}} theo công thức {{Math.floorMod(key.hashCode(), shards)}}. Nếu {{shards < 1}} thì ném {{IllegalArgumentException}}.
- {{rangeShard(value, upperBounds)}}: {{upperBounds}} là các mốc trên **đã sắp xếp tăng dần**, ví dụ hai mốc 100 và 200 tạo ba vùng. Trả về chỉ số vùng chứa {{value}}: vùng 0 là các giá trị nhỏ hơn mốc đầu tiên, vùng cuối cùng là các giá trị lớn hơn hoặc bằng mốc cuối.
- {{counts(keys, shards)}}: mảng đếm số key của từng shard theo {{hashShard}}.
- {{movedKeys(keys, from, to)}}: đếm số key đổi shard khi tăng từ {{from}} lên {{to}} shard (dùng đúng {{hashShard}} cho cả hai).
- {{imbalance(counts)}}: trả về {{(max - min) / average}}, bằng 0 khi chia đều tuyệt đối; mảng rỗng thì ném {{IllegalArgumentException}}.

Ví dụ để đối chiếu: {{hashShard("user-0", 4)}} bằng 2, và {{movedKeys}} của 1200 key "user-0" tới "user-1199" khi tăng 4 lên 6 shard bằng 802.
`,
      starter: `class Router {
    static int hashShard(String key, int shards) { throw new UnsupportedOperationException("TODO"); }
    static int rangeShard(int value, int[] upperBounds) { throw new UnsupportedOperationException("TODO"); }
    static int[] counts(List<String> keys, int shards) { throw new UnsupportedOperationException("TODO"); }
    static int movedKeys(List<String> keys, int from, int to) { throw new UnsupportedOperationException("TODO"); }
    static double imbalance(int[] counts) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
    static int p = 0, n = 0;
    static void c(String s, boolean ok, String detail) {
        n++;
        if (ok) { p++; System.out.println("PASS " + s); }
        else System.out.println("FAIL " + s + ": " + detail);
    }
    static List<String> keys(int to) { List<String> l = new ArrayList<>(); for (int i = 0; i < to; i++) l.add("user-" + i); return l; }
    public static void main(String[] a) {
        List<String> ks = keys(1200);
        int[] cnt = new int[4];
        int out = 0, moved = 0;
        for (String k : ks) { int sh = Router.hashShard(k, 4); if (sh < 0 || sh > 3) out++; else cnt[sh]++; }
        c("hash shard stays inside 0..shards-1", out == 0, out + " key roi ngoai khoang hop le");
        c("hash spreads 1200 keys over 4 shards", cnt[0] > 250 && cnt[0] < 350 && cnt[1] > 250 && cnt[1] < 350 && cnt[2] > 250 && cnt[2] < 350 && cnt[3] > 250 && cnt[3] < 350, "counts=" + Arrays.toString(cnt));
        for (String k : ks) if (Router.hashShard(k, 4) != Router.hashShard(k, 6)) moved++;
        c("modulo remaps most keys when 4 becomes 6", moved * 100 / ks.size() >= 60, "moved=" + moved + "/" + ks.size());
        int[] mine = Router.counts(ks, 4);
        c("counts matches hashShard and covers every key", mine[0] == cnt[0] && mine[0] + mine[1] + mine[2] + mine[3] == ks.size(), "counts=" + Arrays.toString(mine) + " loop=" + Arrays.toString(cnt));
        c("movedKeys equals the manual loop", Router.movedKeys(ks, 4, 6) == moved, "movedKeys=" + Router.movedKeys(ks, 4, 6) + " loop=" + moved);
        c("same shard count moves nothing", Router.movedKeys(ks, 5, 5) == 0, "moved=" + Router.movedKeys(ks, 5, 5));
        c("range shard picks the right bucket", Router.rangeShard(50, new int[]{100, 200}) == 0 && Router.rangeShard(100, new int[]{100, 200}) == 1 && Router.rangeShard(199, new int[]{100, 200}) == 1 && Router.rangeShard(200, new int[]{100, 200}) == 2 && Router.rangeShard(9999, new int[]{100, 200}) == 2, "chia vung theo mui tren sai");
        c("imbalance measures skew", Router.imbalance(new int[]{30, 30, 30, 30}) == 0.0 && Router.imbalance(new int[]{60, 20}) == 1.0 && Router.imbalance(new int[]{70, 10, 10, 10}) > 2.0, "imb={70,10,10,10}=" + Router.imbalance(new int[]{70, 10, 10, 10}));
        List<String> hot = new ArrayList<>(); for (int i = 0; i < 900; i++) hot.add("vip-" + i); for (int i = 0; i < 100; i++) hot.add("normal-" + i);
        c("hash keeps a hot tenant spread out", Router.imbalance(Router.counts(hot, 8)) < 0.6, "imbalance=" + Router.imbalance(Router.counts(hot, 8)) + " counts=" + Arrays.toString(Router.counts(hot, 8)));
        System.out.println("RESULT " + p + "/" + n);
    }
}`,
      reference: `class Router {
    static int hashShard(String key, int shards) {
        if (shards < 1) throw new IllegalArgumentException("shards must be >= 1");
        return Math.floorMod(key.hashCode(), shards);
    }
    static int rangeShard(int value, int[] upperBounds) {
        for (int i = 0; i < upperBounds.length; i++) if (value < upperBounds[i]) return i;
        return upperBounds.length;
    }
    static int[] counts(List<String> keys, int shards) {
        int[] c = new int[shards];
        for (String k : keys) c[hashShard(k, shards)]++;
        return c;
    }
    static int movedKeys(List<String> keys, int from, int to) {
        if (from < 1 || to < 1) throw new IllegalArgumentException();
        int m = 0;
        for (String k : keys) if (hashShard(k, from) != hashShard(k, to)) m++;
        return m;
    }
    static double imbalance(int[] counts) {
        if (counts.length == 0) throw new IllegalArgumentException("empty counts");
        int max = counts[0], min = counts[0], sum = 0;
        for (int x : counts) { if (x > max) max = x; if (x < min) min = x; sum += x; }
        double avg = (double) sum / counts.length;
        return avg == 0 ? 0.0 : (max - min) / avg;
    }
}`,
      hints: [
        'hashShard dùng Math.floorMod chứ không dùng phép % hay Math.abs, vì hashCode có thể âm mà Math.abs(Integer.MIN_VALUE) vẫn âm.',
        'rangeShard: duyệt các mốc theo thứ tự, value nhỏ hơn mốc nào thì thuộc vùng đó; không mốc nào lớn hơn value thì trả về chỉ số vùng cuối.',
        'imbalance tính max, min và tổng trong MỘT vòng lặp, rồi chia (max - min) cho average; nhớ ép kiểu sang double để không bị chia số nguyên.',
        'movedKeys chỉ cần so hashShard(k, from) với hashShard(k, to) cho từng key, không cần sinh danh sách shard mới.',
      ],
      explain: `1200 key "user-i" phân phối trên 4 shard thành 298, 300, 302, 300 key nên {{imbalance}} chỉ 0,013, nhưng {{movedKeys}} từ 4 lên 6 shard trả về 802, tức 66,8% số key phải đổi chỗ: {{h % 4}} và {{h % 6}} chỉ cho cùng kết quả trên một phần các lớp đồng dư modulo 12. Đó là lý do tăng shard theo công thức modulo cứng đòi cả một chiến dịch di chuyển dữ liệu, trong khi consistent hashing (bài lesson-design-003) chỉ chuyển xấp xỉ 1/(N+1). Với dữ liệu lệch (900 key của một tenant lớn), hash theo id đơn hàng vẫn giữ mỗi shard trong 8 shard ở khoảng 124 tới 126 key; cùng dữ liệu đó mà shard key là tenantId thì có shard chứa 900 request, shard khác 100, sáu shard còn lại trống, imbalance bằng 7,2. Đó là cách chứng minh hot partition bằng số liệu thay vì tranh luận cảm tính. {{rangeShard}} cho thấy mặt trái còn lại: giữ được locality cho query khoảng nhưng phải quản lý bảng ánh xạ có phiên bản, và vùng cuối luôn nhận toàn bộ dữ liệu mới ghi.`,
    }, [
      { q: 'Yêu cầu nào sau đây khiến một shard key là lựa chọn TỒI?', options: ['Nó xuất hiện trong điều kiện WHERE của gần mọi query', 'Một giá trị của nó chiếm khoảng 40% toàn bộ lưu lượng ghi', 'Nó không thay đổi sau khi bản ghi được tạo', 'Nó là id của aggregate, ví dụ orderId'], answer: 1, explain: `Một giá trị chiếm gần nửa lưu lượng nghĩa là một shard nhận gần nửa số ghi, tức hot partition, và sharding mất ý nghĩa cân bằng tải. Ba yêu cầu còn lại chính là tiêu chí của shard key tốt: có trong query để route, không đổi để khỏi chuyển bản ghi giữa hai database, và là id aggregate để các bảng liên quan đi cùng shard.` },
      { q: 'Vì sao {{Math.floorMod(hash, N)}} gây vấn đề khi tăng N từ 4 lên 6?', options: ['Vì hàm hash không xác định giữa các lần chạy', 'Vì đổi N làm phần lớn key đổi shard, kéo theo chiến dịch di chuyển dữ liệu khổng lồ', 'Vì không áp dụng được cho key dạng UUID', 'Vì luôn để lại shard trống'], answer: 1, explain: `Kết quả của {{h % 4}} và {{h % 6}} chỉ trùng nhau trên một phần nhỏ các lớp đồng dư, phép đo trong bài là 66,8% key phải chuyển. Hash của String là xác định theo đặc tả {{hashCode}}, nên phương án đầu sai; modulo vẫn dùng được cho UUID (chỉ là chuỗi), chỉ là không giữ được locality; và phân phối thường khá đều chứ không tự để trống shard.` },
      { q: 'Query {{WHERE status = ? ORDER BY created_at LIMIT 20 OFFSET 1000}} không chứa shard key trên 32 shard. Ứng xử lý thế nào?', options: ['Database tự động chuyển query sang shard thích hợp', 'Gửi query tới shard có số hiệu bằng status, rồi lấy kết quả', 'Phải scatter-gather cả 32 shard, mỗi shard trả 1020 dòng rồi gộp và sort lại; về lâu dài nên loại query này ra một view riêng (Elasticsearch hoặc service tổng hợp) và phân trang bằng cursor thay vì OFFSET', 'Chỉ cần thêm index trên status là hết fan-out'], answer: 2, explain: `Shard không biết thứ tự toàn cục nên mỗi shard phải trả đủ số dòng bằng LIMIT cộng OFFSET, chi phí tăng theo OFFSET. Database không tự route khi không có shard key, và index chỉ tăng tốc trong phạm vi một shard, không giảm số shard phải hỏi. Route theo giá trị status thì không có cơ sở: status không quyết định dữ liệu nằm ở shard nào.` },
      { q: 'Trong quy trình resharding, vì sao phải bật song ghi và backfill TRƯỚC khi chuyển đọc sang shard mới?', options: ['Để giảm dung lượng đĩa của shard cũ', 'Để shard mới kịp có đủ dữ liệu cũ lẫn các ghi phát sinh trong lúc chuyển, và chỉ chuyển đọc khi đối chiếu cho thấy hai bên đã khớp, còn có thể quay đầu', 'Vì shard cũ không còn đủ chỗ chứa dữ liệu mới', 'Vì song ghi biến transaction hai shard thành one-phase commit'], answer: 1, explain: `Nếu chuyển đọc ngay, mọi ghi xảy ra trong lúc backfill chưa được chép sang shard mới và dữ liệu biến mất khỏi tầm nhìn của người dùng; song ghi cộng backfill cộng đối chiếu là cách đóng cửa sổ đó và giữ khả năng rollback. Song ghi làm tăng chứ không giảm dung lượng, và nó không hợp nhất hai transaction thành một: tính nhất quán vẫn phải kiểm bằng đối chiếu.` },
    ], ['sharding', 'hot-partition', 'resharding', 'scatter-gather'])
  );
})();
