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

Thời gian phải là input để thuật toán xác định và kiểm thử được. Trong production dùng monotonic clock cho thời lượng, không dùng wall clock có thể nhảy khi NTP chỉnh giờ. Nếu nhiều instance cùng giới hạn một tenant, bộ đếm trong RAM mỗi instance làm tổng quota tăng theo số instance. Cần state chung như Redis với thao tác nguyên tử (thường Lua script), hoặc phân quota có chủ ý; phép đọc rồi ghi riêng rẽ có race.

### Sliding window log
Lưu timestamp của từng request được nhận trong cửa sổ. Khi thời điểm t đến, bỏ các timestamp ≤ t-window, rồi nhận nếu số còn lại nhỏ hơn limit. Thuật toán diễn đạt đúng giới hạn cho mọi đoạn cửa sổ, nhưng bộ nhớ O(requests trong window) trên từng key và cleanup tốn công. Với tải lớn, sliding window counter chia cửa sổ thành bucket nhỏ để giảm bộ nhớ nhưng có sai số gần ranh giới. Fixed window rẻ hơn nhưng cho phép burst gần gấp đôi tại ranh giới hai phút liên tiếp.

| Thuật toán | Burst | Bộ nhớ | Sai số |
|---|---|---|---|
| Token bucket | Có, tối đa capacity | O(1)/key | Không cho quota dài hạn |
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
      { q: 'get trong LinkedHashMap access-order có phải thao tác chỉ đọc?', options: ['Có, thứ tự không thay đổi', 'Không, nó thay đổi recency của entry', 'Chỉ thay đổi khi map đầy', 'Nó luôn xoá entry'], answer: 1, explain: `Access-order phải chuyển entry vừa đọc về cuối nên get làm thay đổi cấu trúc. Điều này khiến cần đồng bộ khi dùng chung. Các lựa chọn khác mô tả insertion-order hoặc sai hành vi.` },
      { q: 'Trong LFU, khi nhiều key cùng tần suất thấp nhất thì tie-break phổ biến nào?', options: ['Loại key mới nhất', 'Loại key LRU trong bucket tần suất đó', 'Loại key có hash nhỏ nhất', 'Không thể phân biệt'], answer: 1, explain: `Dùng recency trong mỗi frequency bucket tạo quyết định ổn định và hỗ trợ O(1). Hash không thể hiện độ hữu ích; không có tie-break làm semantics mơ hồ.` },
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
      prompt: `Cài {{Ring}} với {{addNode(name, virtualNodes)}} và {{owner(key)}}. Dùng hash ổn định {{Math.floorMod(String.hashCode(), 100000)}}; đặt vnode theo chuỗi {{name + "#" + i}}. owner chọn vị trí vnode đầu tiên >= hash(key), vòng lại đầu.`,
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
      { q: 'Thêm node vào consistent hash ring thường thay đổi owner của bao nhiêu key?', options: ['Tất cả key', 'Một phần liên tiếp của ring', 'Không key nào', 'Chỉ key có tên node mới'], answer: 1, explain: `Node mới tiếp quản đoạn ring từ predecessor đến điểm mới, nên chỉ key trong vùng đó remap (xấp xỉ 1/(N+1) khi cân bằng).` },
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
      { q: 'Circuit breaker thay thế cơ chế nào?', options: ['Timeout hoàn toàn', 'Không thay timeout; nó ngăn call mới khi dependency lỗi', 'Database transaction', 'Load balancing'], answer: 1, explain: `Breaker reject call mới theo state; request đã đi vẫn cần timeout. Nó không quản lý transaction hoặc chọn node như load balancer.` },
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
Exponential backoff tăng khoảng chờ theo attempt: base × 2^attempt, có cap để tránh giá trị quá lớn. Jitter ngẫu nhiên giảm đồng bộ retry của nhiều client sau outage. Retry chỉ lỗi transient (timeout, 429 theo Retry-After, một số 5xx), giới hạn attempt/deadline tổng, không retry lỗi validation hay mọi 4xx. Timeout mỗi attempt phải nằm trong deadline caller. Retry ở nhiều layer nhân số lần gọi: 3 lần ở gateway × 3 ở service = 9 request.

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
      { q: 'Vì sao thêm jitter vào exponential backoff?', options: ['Để mọi client retry cùng lúc', 'Để giảm đồng bộ retry sau outage', 'Để bỏ timeout', 'Để thay idempotency key'], answer: 1, explain: `Jitter phân tán thời điểm retry, giảm thundering herd. Nó không thay timeout hay idempotency; đồng bộ retry là điều cần tránh.` },
    ], ['idempotency', 'retry', 'payments'])
  );
})();
