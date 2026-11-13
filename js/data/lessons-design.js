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

### Cơ chế từng bước: Token bucket thực thi như thế nào
Để hiểu rõ VÌ SAO token bucket lại cho phép burst nhưng vẫn giới hạn tốc độ trung bình, hãy đi lần lượt từng bước thực thi khi một request đến:

**Bước 1: Tính elapsed time**
- Lấy thời điểm hiện tại {{nowMillis}} trừ thời điểm lần trước cập nhật bucket {{lastRefillMillis}}.
- Nếu kết quả âm (clock lùi do NTP hoặc test giả), coi elapsed = 0. Điều này ngăn token được "mint" thêm khi thời gian bị đảo ngược.
- {{lastRefillMillis}} được cập nhật đơn điệu: luôn lấy max của giá trị cũ và {{nowMillis}}.

**Bước 2: Nạp token theo tỷ lệ refill**
- Token mới = {{elapsedMs * refillRate / 1000.0}} (vì rate thường tính theo token/giây, còn elapsed tính milliseconds).
- Token hiện tại = {{Math.min(capacity, currentTokens + newTokens)}}. Hàm {{Math.min}} quan trọng: nó đảm bảo bucket không bao giờ đầy hơn capacity, ngay khi hệ thống idle rất lâu.
- Đây là lý do burst **có giới hạn**: chỉ có thể tích lũy tối đa {{capacity}} token.

**Bước 3: Quyết định cho phép hay từ chối**
- Nếu {{currentTokens >= 1}}: trừ 1 token, trả về true (cho phép).
- Ngược lại: trả về false (từ chối, HTTP 429). Token **không** bị trừ khi từ chối.

**Ví dụ số**: Capacity=10, Rate=5 token/giây. Bucket mới tạo đầy 10 token. Client gửi 10 request liên tiếp → hết token. Dừng 200 ms → nạp thêm 1 token. Gửi 1 request → cho phép, còn 0 token. Dùng 1 giây → nạp 5 token, bucket có 5 token.

~~~java
class TokenBucket {
    private final int capacity;
    private final double rate;       // token per second
    private double tokens;
    private long lastRefillMs;
    TokenBucket(int cap, double rate, long now) {
        this.capacity = cap; this.rate = rate;
        this.tokens = cap; this.lastRefillMs = now;
    }
    boolean allow(long now) {
        long elapsed = Math.max(0, now - lastRefillMs);
        lastRefillMs = Math.max(lastRefillMs, now);
        tokens = Math.min(capacity, tokens + elapsed * rate / 1000.0);
        if (tokens < 1.0) return false;
        tokens -= 1.0; return true;
    }
}
~~~

### Sliding window log: từng bước
**Bước 1**: Xoá các timestamp cũ hơn {{now - windowMs}} khỏi danh sách (cleanup).
**Bước 2**: Nếu {{list.size() < limit}}: thêm {{now}} vào danh sách, cho phép.
**Bước 3**: Ngược lại: từ chối. Danh sách không đổi.
Độ phức tạp: cleanup O(n) trong trường hợp xấu, nhưng amortized O(1) nếu cleanup đều đặn.

### Cài đặt trong ứng dụng
Trong một JVM đơn, đồng bộ hoá bucket hoặc dùng cấu trúc đồng thời đúng cách. Với Redis, ghép đọc trạng thái, tính token và ghi thành một script nguyên tử; TTL dọn key không hoạt động. Định nghĩa rõ khi Redis lỗi: fail-open tăng rủi ro quá tải, fail-closed làm mất availability. Bucket4j cung cấp nhiều backend và cấu hình refill; Redis/Gateway phù hợp khi quota cần chia sẻ. Cần metric cho allowed, rejected, số key và độ trễ backend, nhưng tránh gắn user id vào metric label gây cardinality bùng nổ.

### Lỗi hay gặp trên production
1. **Dùng wall clock thay vì monotonic clock**: Khi NTP chỉnh giờ lùi, {{System.currentTimeMillis()}} giảm, elapsed âm khiến bucket nạp token sai (hoặc nạp rất nhiều nếu code không clamp). Dùng {{System.nanoTime()}} hoặc truyền clock vào để test.
2. **Quên clamp token ở capacity**: Nếu chỉ làm {{tokens += elapsed * rate}} mà không {{Math.min(capacity, ...)}}, idle lâu sẽ tạo burst khổng lồ vượt quota thiết kế.
3. **Key theo IP phía sau proxy/load balancer**: Không xác thực {{X-Forwarded-For}} hoặc {{Forwarded}} header khiến nhiều client cùng IP chia sẻ quota, hoặc attacker spoof IP. Cần trust proxy config và validate header.
4. **Nhiều replica giữ bucket cục bộ**: Mỗi instance có bucket riêng → tổng quota thực tế = quota × số replica. Phải dùng Redis shared state với Lua script atomic, hoặc chia quota tĩnh cho từng replica.
5. **Token cost không phân biệt endpoint**: Health check nhẹ và upload 1 GB cùng tốn 1 token. Nên gán weight theo endpoint (bytes, CPU cost) và trừ {{cost}} token thay vì luôn 1.

### Pitfall vận hành
Token cost có thể khác nhau theo endpoint; nếu limiter chỉ tính request thì upload 1 GB ngang một health check. Key theo IP phía sau proxy sai nếu không xác thực header proxy tin cậy. Nhiều replica với cấu hình refill giống nhau không tạo ra quota toàn cụm nếu mỗi replica giữ bucket riêng. Khi đổi capacity/rate, cần biết state cũ được migrate hay reset. Trả 429 nên có Retry-After phù hợp, nhưng client vẫn phải có jitter để tránh cả đám retry cùng lúc.

### Liên hệ phỏng vấn
Nêu trước scope của quota và semantics khi vượt giới hạn; sau đó chọn bucket nếu cần burst có kiểm soát, sliding log nếu yêu cầu chính xác theo cửa sổ. Bài tập dưới đây dùng đồng hồ giả truyền vào, vì vậy test tại biên thời gian không flaky và không cần sleep.

**Câu hỏi thường gặp thêm:**
- *Vì sao sliding window log tốn nhiều bộ nhớ hơn token bucket?* Vì phải lưu timestamp từng request, trong khi token bucket chỉ lưu 2 số (tokens, lastRefill).
- *Làm sao xử lý clock drift trong distributed rate limiter?* Dùng centralized store (Redis) làm nguồn thời gian chân lý, hoặc đồng hồ logic (Hybrid Logical Clock). Trên client chỉ gửi request, không tự tính token.
- *Fail-open hay fail-closed khi Redis down?* Tùy SLO: payment service chọn fail-closed (an toàn), search API chọn fail-open (khả dụng). Luôn có circuit breaker bao rate limiter call Redis.`, {
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
      { q: 'Dùng {{System.currentTimeMillis()}} làm clock cho token bucket nguy hiểm vì sao?', options: ['Nó chậm hơn {{nanoTime()}}', 'NTP có thể chỉnh giờ lùi/tiến làm elapsed âm hoặc nhảy vọt', 'Nó không có độ phân giải milliseconds', 'Nó không thread-safe'], answer: 1, explain: `Wall clock bị NTP điều chỉnh: có thể lùi (elapsed âm → mint token sai) hoặc tiến nhảy (elapsed lớn → nạp token quá nhiều). Monotonic clock ({{nanoTime()}}) chỉ tăng, không bao giờ lùi, an toàn cho đo thời lượng.` },
      { q: 'Sliding window log so với token bucket: điểm yếu chính là gì?', options: ['Không giới hạn burst được', 'Bộ nhớ O(requests trong window) trên mỗi key', 'Không hỗ trợ rate khác nhau theo endpoint', 'Không thể dùng với Redis'], answer: 1, explain: `Sliding log phải lưu timestamp từng request → bộ nhớ tăng tuyến tính với traffic. Token bucket chỉ O(1) state (tokens, lastRefill). Cả hai đều hỗ trợ rate khác nhau và dùng được Redis.` },
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

### Cơ chế từng bước: LRU (LinkedHashMap) thực thi như thế nào
Để hiểu VÌ SAO {{LinkedHashMap}} access-order đạt O(1) cho get/put/evict, hãy đi lần lượt từng bước:

**Bước 1: Cấu trúc dữ liệu kép**
- Bên trong: một mảng bucket (như {{HashMap}}) lưu {{Node<K,V>}} — mỗi node trỏ {{next}} (trong bucket) VÀ {{before}}, {{after}} (trong danh sách đôi toàn cục).
- {{head}} và {{tail}} là sentinel: {{head.after}} là entry cũ nhất (LRU), {{tail.before}} là entry mới nhất (MRU).

**Bước 2: {{get(key)}} — đọc VÀ sửa cấu trúc**
- Tìm bucket bằng hash, duyệt node trong bucket so {{equals}} → tìm thấy node.
- **Quan trọng**: {{accessOrder=true}} nghĩa là **get cũng là mutation**. Node được unlink khỏi vị trí cũ ({{node.before.after = node.after; node.after.before = node.before}}) rồi chèn ngay trước {{tail}} ({{node.before = tail.before; node.after = tail; tail.before.after = node; tail.before = node}}).
- Trả về {{node.value}}. Toàn bộ O(1).

**Bước 3: {{put(key, value)}} — thêm hoặc cập nhật**
- Nếu key đã có: cập nhật value, rồi làm như get (unlink + chèn trước tail).
- Nếu key mới: tạo node, chèn vào bucket (head của linked list trong bucket), **và** chèn vào danh sách đôi toàn cục trước tail.
- Gọi {{removeEldestEntry(eldest)}} — nếu trả true (khi {{size() > capacity}}), unlink {{head.after}} khỏi cả bucket list và danh sách đôi.

**Tóm tắt**: Map lo tìm node O(1), danh sách đôi lo giữ thứ tự O(1). Hai cấu trúc **chia sẻ cùng một node object** nên cập nhật một chỗ đủ cho cả hai.

~~~java
// Mini LRU skeleton (core ideas only)
class LruCache<K,V> {
    static class Node<K,V> { K key; V value; Node<K,V> prev, next; }
    private final int cap;
    private final Map<K, Node<K,V>> map = new HashMap<>();
    private final Node<K,V> head = new Node<>(), tail = new Node<>();
    LruCache(int cap) { this.cap = cap; head.next = tail; tail.prev = head; }
    V get(K key) {
        Node<K,V> n = map.get(key); if (n == null) return null;
        unlink(n); attachToTail(n); return n.value;
    }
    void put(K key, V value) {
        Node<K,V> n = map.get(key);
        if (n != null) { n.value = value; unlink(n); attachToTail(n); return; }
        n = new Node<>(); n.key = key; n.value = value;
        map.put(key, n); attachToTail(n);
        if (map.size() > cap) { Node<K,V> lru = head.next; unlink(lru); map.remove(lru.key); }
    }
    private void unlink(Node<K,V> n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void attachToTail(Node<K,V> n) { n.prev = tail.prev; n.next = tail; tail.prev.next = n; tail.prev = n; }
}
~~~

### Cơ chế từng bước: LFU thực thi như thế nào
LFU mở rộng ý tưởng bằng **nhiều danh sách đôi theo tần suất**:

**Bước 1: Cấu trúc**
- {{keyNodeMap}}: {{key → Node}} (node lưu key, value, freq).
- {{freqMap}}: {{freq → DoublyLinkedList<Node>}} — mỗi tần suất một list LRU.
- {{minFreq}}: tần suất nhỏ nhất hiện có (để evict O(1)).

**Bước 2: {{get(key)}}**
- Tìm node trong {{keyNodeMap}}.
- Unlink node khỏi list tần suất cũ {{freqMap.get(freq)}}.
- Nếu list cũ rỗng **và** {{freq == minFreq}} → {{minFreq++}}.
- Tăng {{node.freq++}}, chèn node vào đầu list {{freqMap.get(newFreq)}} (MRU của tần suất mới).
- Trả về value.

**Bước 3: {{put(key, value)}}**
- Nếu key có: cập nhật value, gọi get(key) để tăng freq (reuse logic).
- Nếu key mới: nếu đã đầy → evict {{freqMap.get(minFreq).tail.prev}} (LRU trong bucket minFreq), xoá khỏi {{keyNodeMap}}.
- Tạo node mới freq=1, chèn vào {{freqMap.get(1)}}, {{minFreq = 1}}, thêm vào {{keyNodeMap}}.

**Tie-break**: Khi nhiều key cùng freq thấp nhất, evict LRU **trong bucket đó** — công bằng vì key cũ hơn được ưu tiên xoá.

### Chọn giải pháp production
Cache cục bộ như Caffeine thường tốt hơn tự cài vì có eviction, statistics, concurrency và admission policy. Redis phù hợp cache chia sẻ nhưng thêm network hop và vận hành; TTL không đảm bảo invalidation tức thời. Spring Cache abstraction thống nhất annotation nhưng semantics phụ thuộc provider. Với cache-aside, đọc miss rồi load nguồn; đồng thời nhiều miss có thể tạo stampede, cần request coalescing, lock có giới hạn hoặc refresh-ahead. Không cache exception hay dữ liệu phân quyền sai key.

### Lỗi hay gặp trên production
1. **Quên {{synchronized}} khi dùng LinkedHashMap access-order trong đa luồng**: get() thay đổi cấu trúc nội bộ (di chuyển node), nên đọc đồng thời không an toàn. Dùng {{Collections.synchronizedMap}} (chậm khi tranh chấp) hoặc Caffeine (W-TinyLFU, lock-free reads).
2. **LFU không có aging/decay**: Key hot hôm qua (freq=1000) giữ chỗ mãi dù hôm nay không truy cập, đẩy key thực sự hot ra khỏi cache. Cần decay định kỳ (chia freq cho 2 theo chu kỳ) hoặc sliding window frequency.
3. **Cache stampede (thundering herd)**: Nhiều request cùng miss một key hot → cùng load DB → sập DB. Giải pháp: request coalescing (chỉ 1 thread load, các thread khác chờ), probabilistic early expiration, hoặc refresh-ahead.
4. **Dùng capacity theo số entry mà value to**: 10k entry × 100KB = 1GB heap → OOM. Phải dùng weight-based eviction (Caffeine: {{weigher}}, {{maximumWeight}}).
5. **Cache invalidation mất message**: Gửi event xoá cache qua Kafka, consumer down → cache stale vĩnh viễn. Phải có TTL làm hàng rào thứ 2, hoặc versioning (key kèm version, invalidation = bump version).
6. **Null value nghĩa là miss hay value hợp lệ?**: {{get}} trả null ambiguos. Dùng {{Optional}} hoặc sentinel object riêng, hoặc split {{containsKey}} + {{get}} (nhưng race condition trong đa luồng).

### Pitfall và đo lường
Hit rate cao vẫn có thể che latency p99 tệ nếu miss tới database chậm. Theo dõi hit/miss, eviction, load latency, size, và chi phí memory; tránh cardinality label theo key. Object lớn khiến capacity theo số entry gây OOM, nên giới hạn cân theo weight. Cache invalidation qua event có thể mất message; cần TTL hoặc versioning làm hàng rào. LRU access-order làm get thành mutation, nên đọc đồng thời vẫn cần đồng bộ.

### Liên hệ phỏng vấn
Giải thích vì sao LRU dùng map cộng list để giữ O(1), rồi hỏi workload có temporal locality không. Nếu cache nhiều node, thảo luận local vs shared, invalidation, stampede và consistency trước khi nói thuật toán.

**Câu hỏi thường gặp thêm:**
- *Vì sao LFU phức tạp hơn LRU mà vẫn dùng?* Với workload popularity ổn định (top-k item truy cập lặp lại), LFU hit rate cao hơn LRU vì không bị scan lớn đẩy hot set.
- *Làm sao xử lý cold start cho LFU?* Key mới freq=1, vào bucket 1. Nếu bucket 1 đầy mà minFreq=1, key mới vừa add có thể bị evict ngay. Caffeine dùng admission policy (W-TinyLFU filter) chặn key kém hot vào cache.
- *Cache local vs distributed (Redis) khi nào chọn cái nào?* Local: latency sub-ms, phù hợp read-heavy, data nhỏ, tolerate staleness. Distributed: shared state, larger data, consistency quan trọng, chấp nhận network hop.`, {
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
      { q: 'Tại sao LFU cần aging/decay tần suất trong hệ thống chạy lâu?', options: ['Để giảm bộ nhớ dùng bởi freqMap', 'Key hot hôm qua có thể giữ chỗ mãi dù hôm nay không còn truy cập', 'Để tie-break LRU hoạt động đúng', 'Giúp minFreq tăng nhanh hơn'], answer: 1, explain: `Nếu không decay, key từng rất hot (freq cao) sẽ không bao giờ bị evict, chiếm chỗ key thực sự hot hiện tại. Decay (chia freq cho 2 theo chu kỳ) hoặc sliding window frequency cho phép cache thích ứng với pattern truy cập thay đổi.` },
      { q: 'Cache stampede là gì và cách giảm thiểu phổ biến?', options: ['Nhiều thread cùng ghi cache gây deadlock; dùng synchronized', 'Nhiều request cùng miss key hot → cùng load DB; dùng request coalescing', 'Cache đầy gây evict liên tục; tăng capacity', 'LFU freq overflow; dùng LongAdder'], answer: 1, explain: `Stampede: key hot hết hạn/miss, hàng nghìn request cùng load DB → sập DB. Request coalescing: chỉ 1 thread load, các thread khác chờ (future/promise) hoặc trả stale data trong lúc refresh. Probabilistic early expiration và refresh-ahead cũng giúp.` },
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

### Cơ chế từng bước: lookup key trên hash ring
Để hiểu VÌ SAO consistent hashing lại cho movement cục bộ, hãy đi lần lượt từng bước khi tra owner của một key:

**Bước 1: Hash key vào không gian vòng tròn**
- Tính {{hash(key)}} → số nguyên trong khoảng {{[0, 2^32-1]}} (hoặc {{[0, 2^64-1]}} tùy hash function).
- Ví dụ: {{hash("user-42") = 157342}}.

**Bước 2: Tìm successor (vnode kế tiếp theo chiều kim đồng hồ)**
- Ring lưu các vnode dưới dạng cặp {{(hashPosition, nodeName)}} đã sắp xếp theo hashPosition.
- Dùng cấu trúc dữ liệu có {{ceilingEntry}} (như {{TreeMap}} trong Java) để tìm vnode đầu tiên có {{hashPosition >= hash(key)}}.
- Nếu tìm thấy: owner là {{nodeName}} của vnode đó.

**Bước 3: Wrap-around khi không có vnode nào lớn hơn**
- Nếu {{hash(key)}} lớn hơn tất cả các vnode trên ring ({{ceilingEntry}} trả về null), quay vòng về vnode có hashPosition nhỏ nhất ({{firstEntry}}).
- Điều này đảm bảo mọi key đều có owner, ring kín.

**Bước 4: Virtual nodes phân tán owner**
- Mỗi physical node có nhiều vnode (ví dụ {{nodeA#0}}, {{nodeA#1}}…{{nodeA#V-1}}) ở các vị trí hash khác nhau.
- Key thuộc đoạn giữa {{vnode_i}} và {{vnode (i+1)}} thuộc về physical node của {{vnode (i+1)}}.
- Khi thêm physical node mới, chỉ các key trong đoạn ngay trước vnode của node mới mới đổi owner; các đoạn khác không ảnh hưởng.

### Thêm, bỏ node và movement
Khi thêm vnode, key thuộc đoạn vừa được vnode mới tiếp quản đổi owner; khi bỏ node, key của nó chuyển sang successor. Tỉ lệ movement có thể đo bằng cách tạo tập key cố định, phân phối trước, thêm node, rồi đếm owner thay đổi. Kết quả lý tưởng khi thêm node mới vào N node là xấp xỉ 1/(N+1), không phải chính xác cho mọi seed/virtual-node count. Test cần so cùng key set và hash deterministically.

### Cân bằng và giới hạn
Ít vnode khiến phân phối không đều; nhiều vnode cải thiện balance nhưng làm membership/ring lớn và tốn CPU/bộ nhớ. Vnode không tự giải quyết hot key: một key nóng vẫn nằm ở một shard. Cần replication, key salting có thể phá thứ tự, hoặc cache/read replica theo nghiệp vụ. Node capacity khác nhau có thể được biểu diễn bằng số vnode khác nhau, nhưng thay đổi trọng số gây movement cần lập kế hoạch.

| Chiến lược | Thay đổi membership | Cân bằng | Vấn đề |
|---|---|---|---|
| modulo N | thường gần toàn bộ key | tốt khi N cố định | thêm shard gây remap lớn |
| ring, 1 điểm/node | ít remap | dao động lớn | node có thể nhận đoạn khổng lồ |
| ring, nhiều vnode | ít remap | tốt hơn | state ring và rebalance |

### Ví dụ minh hoạ: Ring tối giản bằng TreeMap
~~~java
class SimpleRing {
    private final TreeMap<Long, String> ring = new TreeMap<>();
    private final int vnodesPerNode;
    SimpleRing(int vnodesPerNode) { this.vnodesPerNode = vnodesPerNode; }

    // Thêm physical node: sinh V vnode, hash tên "node#i", insert vào ring
    void addNode(String node) {
        for (int i = 0; i < vnodesPerNode; i++) {
            long h = hash(node + "#" + i);
            ring.put(h, node); // collision xử lý riêng trong bài tập
        }
    }

    // Tìm owner: ceilingEntry tìm vnode kế tiếp, null thì firstEntry (wrap)
    String owner(String key) {
        if (ring.isEmpty()) throw new IllegalStateException("ring empty");
        long h = hash(key);
        Map.Entry<Long, String> e = ring.ceilingEntry(h);
        return (e == null ? ring.firstEntry() : e).getValue();
    }

    private long hash(String s) { return Math.floorMod(s.hashCode(), 1_000_000); }
}
~~~

### Production và vận hành
Consistent hashing phù hợp cache phân tán, partition routing hoặc shard placement khi membership đổi. Nó không tự replicate dữ liệu, không cung cấp consensus, và không xử lý split brain. Service discovery phải phát membership có version đồng nhất; nếu node A và B thấy ring khác nhau, cùng key có thể ghi vào hai nơi. Khi deploy, có thể shadow-route, copy dữ liệu rồi switch, theo dõi movement và miss rate. Nếu cần phân vùng dữ liệu mạnh, xem xét database partitioning hoặc rendezvous hashing cũng có thể đơn giản hơn.

### Lỗi hay gặp trên production
1. **Ring không đồng bộ giữa các instance**: Service discovery phát membership chậm hoặc version mismatch khiến node A và B thấy ring khác nhau → cùng key ghi vào hai node khác nhau → data inconsistency. Giải pháp: dùng consensus store (etcd, Consul) làm nguồn chân lý, listener cập nhật ring local ngay khi membership thay đổi, và version check trước khi route.
2. **Hash function không phù hợp cho ring production**: {{String.hashCode()}} là thuật toán xác định (công thức quy định trong hợp đồng {{String}}, ổn định qua các bản Java cho cùng nội dung chuỗi), nhưng chỉ cho 32 bit, phân phối có thể không đủ đều cho ring lớn, và dễ bị lệch nếu các service hash khác kiểu dữ liệu hoặc khác cách mã hoá byte (UTF-8 vs UTF-16). Dùng {{System.identityHashCode()}} (hash theo danh tính object, không theo nội dung) cho key nội dung cũng sai. Giải pháp: chuẩn hoá hash function (Murmur3, xxHash, hoặc cắt SHA-256) với seed/quy ước cố định, luôn hash byte theo encoding rõ ràng (UTF-8), và dùng cùng thuật toán ở mọi service.
3. **Collision vnode làm mất điểm trên ring**: TreeMap ghi đè entry khi key trùng, vnode bị mất → đoạn ring trống → key rơi vào node sai. Giải pháp: dò tuyến tính {{(h+1) % MAX}} cho tới khi trống (như bài tập), hoặc dùng multimap (hash → list vnode) rồi chọn theo quy tắc deterministic.
4. **Hot key không được giải quyết bởi virtual nodes**: Một key truy cập cực nhiều (celebrity user, viral content) vẫn map vào một vnode duy nhất → overload một shard. Giải pháp: key salting ({{key + "#" + random(0, K-1)}}) để chia hot key ra K vnode, client phải fan-out đọc K shard, hoặc cache layer trước shard.

### Cơ chế chi tiết: Tính movement khi thêm node
Để lượng hoá chính xác, ta tạo tập key cố định (ví dụ 10.000 key), phân phối bằng ring cũ (N node), sau đó thêm node mới (N+1 node) và đếm bao nhiêu key đổi owner. Công thức lý thuyết:
- Movement ratio ≈ 1 / (N + 1) khi vnode đủ lớn và hash phân phối đều.
- Ví dụ: N=4 → thêm node thứ 5 → ~20% key chuyển, và **tất cả** đều chuyển sang node mới (không phải chia lẫn nhau).

~~~java
// Đo movement thực tế
int moved = 0;
for (String key : keys) {
    String oldOwner = ringWith4Nodes.owner(key);
    String newOwner = ringWith5Nodes.owner(key);
    if (!oldOwner.equals(newOwner)) moved++;
}
double ratio = (double) moved / keys.size();  // mong đợi ~0.20
~~~

> Lưu ý: movement phụ thuộc seed hash và số vnode. Với ít vnode, số thực tế có thể lệch so với 1/(N+1). Production nên mô phỏng với workload thực trước khi scale.

### Liên hệ phỏng vấn
Nói rõ hash ring, successor lookup, và vì sao movement cục bộ. Sau đó lượng hoá movement bằng workload, nhắc virtual nodes, hot key, replication và đồng bộ membership. Bài tập dùng hash đơn giản deterministic để tập trung vào ownership, không giả làm production cryptographic hash.

**Câu hỏi thường gặp thêm:**
- *Vì sao modulo N gây remap gần như toàn bộ key khi thêm shard?* Vì {{hash % N}} thay đổi mẫu số, mọi key đều có thể rơi vào bucket khác nhau. Consistent hashing chỉ đổi owner cho đoạn ring giữa node mới và predecessor.
- *Làm sao xử lý hot key trong consistent hashing?* Key salting (thêm suffix ngẫu nhiên), replication read, hoặc cache layer. Virtual nodes không giải quyết hot key đơn lẻ.
- *Ring dùng TreeMap có thread-safe không?* TreeMap không thread-safe; production dùng ConcurrentSkipListMap hoặc read-only snapshot + atomic swap khi membership đổi.
- *Khi node down, key của nó chuyển sang đâu?* Key chuyển sang successor (vnode kế tiếp theo chiều kim đồng hồ). Nếu dùng replication, quorum read có thể vẫn trả được dữ liệu từ replica khác.`, {
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
      { q: 'Tại sao consistent hashing dùng ceilingEntry (successor) thay vì floorEntry (predecessor)?', options: ['TreeMap không có floorEntry', 'CeilingEntry nhanh hơn', 'Key thuộc về node kế tiếp theo chiều kim đồng hồ để movement cục bộ khi thêm node', 'FloorEntry chỉ dùng cho range query'], answer: 2, explain: `Key đi theo chiều kim đồng hồ tới node đầu tiên ≥ hash(key). Khi thêm node mới, node đó chen giữa predecessor và successor cũ; chỉ key trong đoạn giữa predecessor cũ và node mới đổi owner (đi sang node mới). Dùng predecessor sẽ làm movement lan rộng hơn.` },
      { q: 'Vnode collision (hai vnode cùng hashPosition) xử lý thế nào để không mất vnode?', options: ['TreeMap tự xử lý bằng comparator', 'Ghi đè vnode cũ (data loss chấp nhận được)', 'Dò tuyến tính (h+1) % MAX cho tới khi trống, rồi insert', 'Bỏ qua vnode collision, không xảy ra trong thực tế'], answer: 2, explain: `TreeMap.put ghi đè key trùng → vnode cũ mất. Phải dò vị trí kế tiếp deterministic cho tới khi trống, đảm bảo mọi vnode đều có chỗ. Comparator không giải quyết được collision giá trị hash.` },
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

### Window và ngưỡng: count-based vs time-based
Failure rate 50% trên cửa sổ 10 call khác ý nghĩa với 50% trên 1000 call.
- **Count-based window**: lưu kết quả N call gần nhất (ví dụ 100 call). Phù hợp lưu lượng ổn định, dễ cài đặt, không cần clock. Nhược: nếu traffic thưa, cửa sổ bao phủ thời gian rất dài, phản ánh chậm sự cố thực tế.
- **Time-based window**: lưu call trong T giây gần nhất (ví dụ 10 giây). Phản ánh gần đây, thích ứng nhanh khi traffic biến đổi. Nhược: cần clock monotonic, cleanup định kỳ, và có thể flip-flop khi traffic rơi gần 0 (cửa sổ gần như rỗng → một lỗi = 100% rate).

Cả hai đều cần **minimum number of calls** (ví dụ 20) trước khi tính tỷ lệ, tránh mở vì một lỗi duy nhất lúc khởi động. **Slow-call rate** (call vượt timeout nhưng không exception) cũng có thể mở circuit dù call chưa lỗi hẳn. Quá nhạy gây flap; quá lỏng không bảo vệ. Theo dõi trạng thái, rejected calls và thời gian ở mỗi state.

| Loại cửa sổ | Ưu điểm | Nhược điểm | Khi nào dùng |
|---|---|---|---|
| Count-based (N call) | Đơn giản, không cần clock, ổn định khi traffic đều | Chậm phản ứng khi traffic thưa | Traffic ổn định, muốn implement đơn giản |
| Time-based (T giây) | Phản ánh thực tế gần đây, thích ứng nhanh | Cần clock, cleanup, dễ flap khi traffic thấp | Traffic biến động, cần độ nhạy cao |

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

### Cơ chế từng bước: breaker xử lý một cuộc gọi
Để hiểu VÌ SAO ba trạng thái lại bảo vệ hệ thống, hãy đi lần lượt cuộc đời của một request gọi dependency qua breaker:

**Bước 1: {{allow(now)}} kiểm tra trạng thái**
- CLOSED: cho gọi đi, sau khi kết thúc gọi ghi lại thành công hoặc thất bại.
- OPEN: nếu {{now - openedAt}} vẫn nhỏ hơn thời gian cooldown ({{waitMs}}), từ chối ngay (fail-fast), không gọi dependency, trả lỗi hoặc fallback ngay lập tức. Điều này ngăn hàng triệu request giữ thread/connection đợi một dependency đã biết đang lỗi.
- HALF_OPEN: cooldown đã hết, breaker đang "thử ngại". Chỉ cho **một** probe đi qua; các request khác bị từ chối hoặc nhận fallback.

**VÌ SAO fail-fast ở OPEN?** Nếu không có breaker, hàng nghìn request cùng chờ dependency timeout (ví dụ 30s) sẽ làm cạn thread pool, queue đầy, và lan lỗi sang service khác. Breaker biến 30s wait thành <1ms reject, bảo vệ tài nguyên cục bộ.

**Bước 2: Gọi dependency và ghi nhận kết quả**
- Gọi thành công: trong CLOSED reset bộ đếm lỗi về 0; trong HALF_OPEN → chuyển về CLOSED, mạch đã khôi phục.
- Gọi thất bại (timeout, 5xx từ dependency…): trong CLOSED tăng bộ đếm lỗi liên tiếp; đủ ngưỡng ({{threshold}}) → chuyển OPEN, ghi {{openedAt = now}}. Trong HALF_OPEN một lỗi nào cũng mở lại OPEN ngay, vì dependency vẫn chưa ổn định.

**VÌ SAO HALF_OPEN một lỗi cũng mở lại?** Probe là "thử thách" dependency. Nếu probe fail nghĩa là dependency vẫn chưa sẵn sàng; mở lại ngay để tiếp tục bảo vệ thay vì cho thêm traffic.

**Bước 3: OPEN → HALF_OPEN → CLOSED**
- Khi {{now - openedAt >= waitMs}}, lần {{allow}} tiếp theo chuyển sang HALF_OPEN và cấp một probe.
- Probe thành công đủ ngưỡng (thường 1–3 lần) → CLOSED. Một probe thất bại → OPEN lại, bắt đầu cooldown mới.
Tại sao lại vậy? Mở mạch ngay khi lỗi quá nhiều để ngừng thả tải vào dependency đang suy giảm; chờ một khoảng để dependency có thời gian phục hồi; rồi chỉ thả một luồng lượng nhỏ (probe) để xác thực trước khi mở cửa toàn bộ traffic. Không có timeout riêng cho mỗi attempt thì call treo vẫn chiếm tài nguyên cho dù breaker đã OPEN.

### Ví dụ mã: breaker tối giản (lỗi liên tiếp)
~~~java
class Breaker {
    private enum State { CLOSED, OPEN, HALF_OPEN }
    private final int threshold; // số lỗi liên tiếp để mở mạch
    private final long waitMs;   // thời gian cooldown trước khi cho probe
    private int failures;        // số lỗi liên tiếp hiện tại
    private State state = State.CLOSED;
    private long openedAt;       // thời điểm mạch mở lần gần nhất
    private boolean probeUsed;
    Breaker(int threshold, long waitMs) {
        if (threshold < 1 || waitMs < 0) throw new IllegalArgumentException();
        this.threshold = threshold; this.waitMs = waitMs;
    }
    boolean allow(long now) {
        if (state == State.OPEN) {
            if (now - openedAt < waitMs) return false; // chưa hết cooldown
            state = State.HALF_OPEN; probeUsed = false;
        }
        if (state == State.HALF_OPEN && probeUsed) return false; // một probe mỗi lần mở
        if (state == State.HALF_OPEN) probeUsed = true;
        return true;
    }
    void recordFailure(long now) { if (state == State.HALF_OPEN || ++failures >= threshold) { state = State.OPEN; openedAt = now; probeUsed = false; } }
    void recordSuccess(long now) { if (state == State.HALF_OPEN) { state = State.CLOSED; failures = 0; probeUsed = false; } else if (state == State.CLOSED) failures = 0; }
}
~~~
Lưu ý: code trên dùng lỗi liên tiếp để đơn giản hoá; thư viện production (ví dụ Resilience4j) thường đếm tỷ lệ lỗi trong cửa sổ thời gian gần đây, và cấp phép probe bằng biến nguyên tử (atomic) để nhiều thread không cùng nắm một lượt.

### Ví dụ mở rộng: Sliding window count-based (100 call)
Để hiểu VÌ SAO production dùng sliding window thay vì đếm liên tiếp, đây là bản demo dùng ring buffer:
~~~java
class SlidingWindowBreaker {
    private static final int WINDOW = 100;
    private final int threshold;      // số lỗi cho phép trong window
    private final int[] results;      // 0=success, 1=failure
    private int idx = 0, count = 0, failures = 0;
    private enum State { CLOSED, OPEN, HALF_OPEN }
    private State state = State.CLOSED;
    private long openedAt, waitMs;
    SlidingWindowBreaker(int threshold, int waitMs) {
        this.threshold = threshold; this.waitMs = waitMs;
        this.results = new int[WINDOW];
    }
    boolean allow(long now) {
        if (state == State.OPEN) {
            if (now - openedAt < waitMs) return false;
            state = State.HALF_OPEN;
        }
        return true; // HALF_OPEN logic đơn giản: cho 1 call, production cần atomic
    }
    void record(boolean success) {
        int old = results[idx];
        if (count == WINDOW) failures -= old; else count++;
        results[idx] = success ? 0 : 1;
        failures += results[idx];
        idx = (idx + 1) % WINDOW;
        if (state == State.CLOSED && count >= 20 && failures >= threshold) {
            state = State.OPEN; openedAt = System.currentTimeMillis();
        } else if (state == State.HALF_OPEN) {
            state = success ? State.CLOSED : State.OPEN;
            if (state == State.CLOSED) { failures = 0; count = 0; Arrays.fill(results, 0); }
            else openedAt = System.currentTimeMillis();
        }
    }
}
~~~
> Sliding window cho tỷ lệ lỗi thực tế hơn: một burst 50 lỗi trong 100 call mở mạch, nhưng 50 lỗi rải trong 1000 call thì không. Đó là lý do Resilience4j mặc định dùng sliding window.

### Lỗi hay gặp trên production
1. **Call treo mà không có timeout riêng**: triệu chứng hàng request giữ thread/connection lâu, p99 tăng, thread pool cạn kiệt. Nguyên nhân: breaker chỉ chặn **call mới**, không huỷ call đã gửi đi. Cách sửa: gán timeout nhỏ hơn deadline tổng cho mỗi attempt, trong mọi trạng thái breaker.
2. **Ngưỡng lỗi quá nhẹ (flapping)**: triệu chứng mạch bật/tắt liên tục, traffic giật giấu. Nguyên nhân: {{threshold}} thấp hoặc cửa sổ quá ngắn so với tỷ lệ lỗi bình thường, một lỗi lẻ lúc khởi động cũng mở mạch. Cách sửa: đặt ngưỡng từ SLO và baseline thực tế, có minimum số cuộc gọi trước khi tính tỷ lệ.
3. **Hàng chục probe cùng lúc ở HALF_OPEN**: triệu chứng dependency vừa hồi phục lại bị đập thêm. Nguyên nhân: kiểm tra trạng thái rồi tăng đếm không nguyên tử, nhiều request cùng thấy chỗ trống. Cách sửa: dùng semaphore/biến nguyên tử, chỉ cho một probe mỗi lần mở, các request khác nhận fallback.
4. **Fallback không đúng nghiệp vụ**: triệu chứng hiển thị dữ liệu cũ hoặc đánh dấu đơn "thành công" thực ra chưa thanh toán. Nguyên nhân: dùng một fallback chung cho mọi endpoint. Cách sửa: fallback theo từng nghiệp vụ, thanh toán không được giả thành công; dữ liệu stale chỉ dùng cho tra cứu chỉ đọc.
5. **Retry và breaker xung đột**: retry bên trong breaker làm breaker thấy "một logical call" là nhiều attempt, chậm mở mạch và nhân tải dependency. Cách sửa: retry ở layer ngoài breaker, hoặc cấu hình breaker đếm logical call; breaker bao retry là anti-pattern.
6. **Không theo dõi metrics trạng thái**: không biết breaker ở OPEN bao lâu, bao nhiêu request bị reject, probe success/fail rate. Cách sửa: export metrics (state, rejected, probe_ok, probe_fail) lên Prometheus/Grafana, alert khi flap rate cao.

### Liên hệ phỏng vấn
Mô tả state transitions cùng semantics của probe, rồi phân biệt timeout/retry/bulkhead. Hỏi thêm ngưỡng được chọn từ SLO và baseline nào, thay vì khẳng định một con số cố định phù hợp mọi service.

**Câu hỏi thường gặp thêm:**
- *Breaker ở trạng thái OPEN thì làm gì với request mới?* Trả lời: từ chối ngay (fail-fast), không gọi dependency; chỉ khi hết cooldown mới vào HALF_OPEN và cho một probe.
- *Vì sao vẫn cần timeout cho mỗi call khi đã có breaker?* Trả lời: breaker không huỷ call đang chạy; call treo vẫn giữ thread/connection, nên mỗi attempt vẫn cần deadline hữu hạn.
- *Ngưỡng lỗi chọn thế nào để không bị bật tắt liên tục?* Trả lời: đặt theo SLO và tỷ lệ lỗi baseline thực tế, có minimum số cuộc gọi trước khi tính, theo dõi thời gian ở mỗi trạng thái.
- *Sự khác biệt giữa count-based và time-based window?* Count-based dùng N call gần nhất, đơn giản nhưng chậm phản ứng khi traffic thưa. Time-based dùng T giây gần đây, nhạy hơn nhưng cần clock monotonic và cleanup; dễ flap khi traffic gần 0.
- *Khi nào nên dùng sliding window thay vì đếm lỗi liên tiếp?* Khi traffic biến động hoặc muốn tỷ lệ lỗi phản ánh thực tế (50 lỗi/100 call ≠ 50 lỗi/1000 call). Đếm liên tiếp chỉ phù hợp demo hoặc traffic rất ổn định.`, {
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
      { q: 'Mạch ở trạng thái CLOSED chuyển sang OPEN khi nào?', options: ['Khi số lỗi liên tiếp đạt ngưỡng threshold', 'Khi có một lỗi bất kỳ', 'Khi hết thời gian cooldown (retryAt)', 'Khi một probe thành công'], answer: 0, explain: `Đúng: CLOSED chỉ mở khi số lỗi liên tiếp đạt ngưỡng, tránh mở vì một lỗi lẻ. Các đáp án sai mô tả chuyển trạng thái khác: hết cooldown đưa OPEN → HALF_OPEN (không phải CLOSED → OPEN); probe thành công đưa HALF_OPEN → CLOSED (đóng mạch, không mở).` },
      { q: 'Khi mạch ở OPEN và chưa hết cooldown, request mới xảy ra sao?', options: ['Gọi dependency như bình thường', 'Được gọi probe một lần', 'Từ chối ngay (fail-fast) mà không gọi dependency', 'Đợi hết cooldown rồi mới gọi'], answer: 2, explain: `Đúng: trong OPEN breaker từ chối call mới ngay lập tức, trả lỗi hoặc fallback, bảo vệ dependency đang yếu và không giữ thread/connection. Gọi như bình thường hoặc chờ hết cooldown sai; probe chỉ được một lượt và chỉ sau khi hết cooldown vào HALF_OPEN.` },
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

### Cơ chế từng bước
Để hiểu tại sao cần cả idempotency key và retry policy, đi từng bước một tình huống thực tế:

**Bước 1: Tạo ý định (không gửi ngay)**
Client tạo {{Idempotency-Key}} duy nhất cho yêu cầu thanh toán này (ví dụ UUID v4). Key gắn với {{merchantId}}, {{accountId}} và {{operation}} (pay). Quan trọng: **không tạo key mới khi retry** — cùng một key cho cùng một ý định.

**Bước 2: Gửi request lần đầu**
Client gửi {{POST /payments}} kèm header {{Idempotency-Key}} và body đã canonical hoá (JSON sort keys). Network có thể timeout trước khi nhận response, không có nghĩa server chưa xử lý.

**Bước 3: Server claim key nguyên tử**
Server kiểm tra bảng idempotency theo (scope, key). Nếu chưa có, dùng {{INSERT ... ON CONFLICT DO NOTHING}} hoặc unique constraint để claim. Chỉ transaction thành công mới được tiến hành xử lý nghiệp vụ. Nếu insert conflict vì request đồng thời, thread thứ hai phải đọc trạng thái hiện tại thay vì xử lý lại.

**Bước 4: Xử lý một lần**
Trong cùng transaction (hoặc workflow an toàn), server thực hiện charge qua provider. Sau khi có kết quả, lưu vào bảng idempotency: {{status=COMPLETED}}, {{response_body}}, {{http_status}} và {{expires_at}}. Chỉ lưu response **sau khi** nghiệp vụ thành công hoặc đã xác định kết quả cuối cùng.

**Bước 5: Trả kết quả; retry nhận lại kết quả cũ**
Nếu client timeout và retry với cùng key và cùng payload: server tìm key đã tồn tại, so sánh fingerprint payload. Nếu giống → trả **y nguyên** response đã lưu (cùng status/body). Nếu khác → trả {{409 Conflict}} để tránh xử lý sai ý định. Nếu key đang {{PROCESSING}} và chưa hết lease → trả {{202 Accepted}} hoặc chờ có giới hạn, tránh xử lý song song.

~~~java
// Mô phỏng claim + trả kết quả đã lưu (đơn giản hoá)
public PaymentResp pay(String idemKey, String payload, long now) {
    IdemRec r = store.find(idemKey);           // đọc
    if (r != null) {
        if (!r.payloadHash.equals(hash(payload))) throw new Conflict();
        if (r.status == Status.COMPLETED) return r.resp;  // trả lại kết quả cũ
        if (r.status == Status.PROCESSING && !r.expired(now)) return pending(); // đang xử lý
    }
    // claim
    if (!store.tryClaim(idemKey, payload, now)) return pay(idemKey,payload,now); // retry đọc
    try {
        PaymentResp resp = provider.charge(canon(payload));
        store.complete(idemKey, resp, now);
        return resp;
    } catch (Exception e) {
        store.fail(idemKey, e, now);            // đánh dấu để reconcile nếu cần
        throw e;
    }
}
~~~

**Bước 6: Áp dụng retry policy có kiểm soát**
Chỉ retry lỗi **transient** (network timeout, 503, 429 có {{Retry-After}}). Tính delay = {{min(cap, base * 2^attempt)}} + **jitter** (full jitter phổ biến: random trong [0, delay]). Giới hạn {{maxAttempts}} và **tổng deadline**. Mỗi attempt vẫn phải có {{timeout}} riêng. **Chỉ một tầng** được retry để tránh nhân bội.

### Lỗi hay gặp trên production
1. **Key mới mỗi lần retry**: Client sinh UUID mới khi timeout → server coi là yêu cầu mới → có thể charge lần hai. **Cách sửa:** Tạo key một lần tại client trước khi gửi attempt đầu, giữ nguyên key cho toàn bộ chuỗi retry.
2. **Lưu key sau khi xử lý**: Nếu ghi key sau khi đã gọi provider và crash giữa chừng → retry không tìm thấy key → gọi provider lại. **Cách sửa:** Claim key (insert) **trước** khi gọi bất kỳ side effect nào có thể không đảo ngược.
3. **Payload không canonical**: JSON có thứ tự field khác nhau → hash khác → server có thể coi là payload khác (hoặc ngược lại không phát hiện). **Cách sửa:** Canonical hoá (sort keys), chỉ include field ảnh hưởng nghiệp vụ (currency, amount, merchant, orderId), tránh field thời gian ngẫu nhiên.
4. **PROCESSING kẹt vô thời hạn**: Thread chết sau khi claim nhưng trước khi complete → key mãi ở trạng thái PROCESSING, retry chờ mãi. **Cách sửa:** Thêm {{lease_expires_at}}, timeout lease, background job reconcile với provider (query trạng thái transaction) để hoàn tất hoặc fail an toàn.

### Pitfall
Key ngẫu nhiên mới mỗi lần retry vô hiệu hoá idempotency. Chỉ lưu key sau khi xử lý tạo race duplicate. Hash payload không canonical có thể đổi vì thứ tự JSON field; fingerprint cần canonical representation và include currency/merchant. Retention quá ngắn cho phép charge lặp từ retry muộn; vô hạn thì bảng tăng mãi. Retry một non-idempotent POST mà không có key là lỗi tài chính nghiêm trọng.

### Liên hệ phỏng vấn
**Câu hỏi thường gặp:**

- *Response mất sau khi provider đã charge, làm sao retry an toàn?* Trả lời: dùng cùng {{Idempotency-Key}} và payload đã canonical hoá; server claim key trước khi gọi provider, lưu response sau khi có kết quả; retry với cùng key sẽ trả response đã lưu thay vì charge lại. Cần transaction boundary rõ ràng và xử lý trạng thái {{PROCESSING}}.
- *Tại sao cần jitter trong exponential backoff?* Trả lời: tránh thundering herd (nhiều client retry đồng loạt cùng thời điểm sau outage) làm dependency càng tồi tệ hơn. Dùng full jitter giúp phân tán thời điểm, vẫn đảm bảo backoff tăng dần và có cap.
- *Khi nào dùng 202 vs 409 khi key đang PROCESSING hoặc payload khác?* Trả lời: cùng key + payload khác → {{409 Conflict}} (nghi ngờ nhầm ý định). Cùng key + payload giống nhưng vẫn {{PROCESSING}} và chưa hết lease → có thể {{202 Accepted}} với {{Retry-After}} hoặc chờ ngắn có giới hạn; nếu lease hết hạn cần reconcile với provider trước khi quyết định.`, {
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
    ], ['sharding', 'hot-partition', 'resharding', 'scatter-gather']),
    lesson('006', 6, 'Consistent hashing: đo phân bố key và dịch chuyển khi thêm bớt node', 'senior', [
      'Cài vòng hash có virtual node, tra cứu owner theo successor và xử lý vòng quay',
      'Đo phân bố key theo node và đếm số key phải chuyển khi thêm hoặc bỏ node'
    ], `**Tóm tắt:** Consistent hashing (băm nhất quán) đặt cả node lẫn key lên cùng một vòng băm (hash ring - một trục số vòng tròn, thường 0 đến 2^32-1); mỗi key được gán cho node kế tiếp theo chiều kim đồng hồ. Nhờ vậy khi thêm hoặc bỏ node, chỉ một phần key phải chuyển chỗ, thay vì gần như toàn bộ như cách chia {{hash(key) % N}}.

### "Hash", "ring", "node" là gì?
- **Hash** (hàm băm): hàm nhận đầu vào (chuỗi, số) và trả về một số nguyên cố định. Cùng đầu vào luôn cho cùng đầu ra; đầu ra khác nhau phân tán đều. Ví dụ đời thường: như đánh số thứ tự ngẫu nhiên nhưng ổn định cho từng tên học sinh.
- **Node** (nút): một máy chủ/lõi lưu trữ hoặc cache cụ thể, ví dụ server A, B, C.
- **Ring** (vòng): tưởng tượng các giá trị hash nằm trên một vòng tròn đóng; đi quá giá trị lớn nhất sẽ quay về 0.
- **Virtual node** (nút ảo, viết tắt vnode): thay vì đặt mỗi node vật lý 1 điểm trên vòng, ta đặt mỗi node nhiều điểm ({{nodeA#0}}, {{nodeA#1}}…). Điều này giúp phân bố đều hơn vì chỉ 1 điểm dễ tạo đoạn vòng quá dài/quá ngắn.

### Vấn đề của chia modulo {{hash(key) % N}}
Với N node, gán {{owner = hash(key) % N}} rất đơn giản. Nhưng khi thêm 1 node (N thành N+1), mẫu số đổi nên gần như mọi key tính ra kết quả khác. Ví dụ 10 triệu key cache: thêm 1 server có thể làm ~80% key bị "miss" (không tìm thấy ở chỗ cũ) cùng lúc, gây tải đột biến xuống database phía sau (cache stampede - bão cache miss). Consistent hashing giảm mạnh hiện tượng này: chỉ key nằm trong đoạn vòng bị node mới "cắt" mới chuyển.

### Cơ chế từng bước: tra cứu owner
1. **Hash key**: {{h = hash(key)}} cho ra một vị trí trên vòng.
2. **Tìm successor** (người kế tiếp): tìm vnode có vị trí hash nhỏ nhất mà >= {{h}} theo chiều kim đồng hồ.
3. **Wrap-around** (quay vòng): nếu {{h}} lớn hơn vị trí của mọi vnode, owner là vnode có vị trí nhỏ nhất (quay về đầu vòng). Không có bước này, một phần key sẽ không có owner.
4. **Từ vnode ra node vật lý**: vnode {{nodeB#7}} thuộc về node vật lý {{nodeB}}.

~~~text
Vòng hash (0..99, minh hoạ):
  10: A#0      35: B#0      60: A#1      85: C#0
key "cart-1" -> hash 22 -> successor là 35 (B#0) => owner B
key "cart-9" -> hash 90 -> không có >=90 -> wrap về 10 (A#0) => owner A
~~~

### Thêm và bớt node: vì sao movement cục bộ?
- **Thêm node C#0 tại 85**: các key có hash trong khoảng từ sau vnode trước 85 đến 85 sẽ chuyển sang C#0. Chỉ đoạn đó đổi owner; các đoạn khác giữ nguyên.
- **Bỏ node B** (gỡ mọi vnode của B): key từng thuộc B chuyển sang successor kế tiếp của từng vnode B. Các key của A, C không bị ảnh hưởng.
- Lý tưởng với vnode đủ nhiều, thêm 1 node vào N node làm chuyển xấp xỉ {{1/(N+1)}} tổng số key, và các key chuyển đều đi về node mới.

### Virtual node và phân bố
Với ít vnode, vị trí ngẫu nhiên có thể gom lại thành đoạn dài khiến một node nhận quá nhiều key (mất cân bằng). Tăng số vnode (ví dụ 100-200 vnode/node vật lý) làm mỗi node sở hữu nhiều đoạn nhỏ rải khắp vòng, phân bố gần đều hơn. Đánh đổi: ring lớn hơn, tốn bộ nhớ và thời gian tra cứu ({{O(log(V*N))}} với cây tìm kiếm). Node mạnh hơn có thể gán nhiều vnode hơn để nhận nhiều tải hơn (weighted vnode).

~~~java
// Ý tưởng tra cứu bằng TreeMap (cây đỏ-đen, tra successor O(log M))
TreeMap<Integer, String> ring = new TreeMap<>(); // hashPosition -> physicalNode
ring.put(hash("A#0"), "A");
Integer pos = ring.ceilingKey(hash(key)); // key nhỏ nhất >= hash(key)
if (pos == null) pos = ring.firstKey();   // wrap-around
String owner = ring.get(pos);
~~~

### Lỗi hay gặp
- **Quên wrap-around**: key có hash lớn hơn mọi vnode trả về null/rỗng thay vì quay đầu vòng.
- **Dùng hash không ổn định**: {{System.identityHashCode}} hoặc hash phụ thuộc địa chỉ bộ nhớ làm cùng key cho kết quả khác nhau giữa lần chạy/process. Phải dùng hàm hash ổn định theo nội dung.
- **Đếm movement sai**: so sánh trên tập key khác nhau trước/sau. Phải giữ nguyên cùng tập key và cùng hàm hash.
- **Nghĩ vnode giải quyết hot key**: một key cực "nóng" vẫn chỉ nằm trên 1 node; vnode chỉ cân bằng số lượng key, không cân bằng tải theo tần suất truy cập.

### Liên hệ phỏng vấn
Nêu rõ: (1) modulo gây remap gần toàn bộ khi đổi N, (2) ring + successor cho remap cục bộ, (3) vnode cải thiện phân bố và cho phép gán trọng số, (4) nhắc giới hạn: hot key, đồng bộ membership giữa các instance, và consistent hashing không tự nhân bản dữ liệu. Đo được movement/distribution trên tập key cụ thể là cách trả lời có số liệu.
`, {
      title: 'Vòng hash có virtual node và đo phân bố khi thêm/bớt node',
      prompt: `Cài {{ConsistentRing}} mô phỏng consistent hashing đơn giản, dùng hash ổn định {{Math.floorMod(s.hashCode(), 100000)}}.
- {{addNode(name, vnodeCount)}}: thêm node vật lý với {{vnodeCount}} vnode. Mỗi vnode có vị trí {{hash(name + "#" + i)}} với i từ 0. Nếu hai vị trí trùng, dò tuyến tính {{(h+1) % 100000}} tới khi trống. Ném {{IllegalArgumentException}} nếu tên null/rỗng, đã tồn tại, hoặc {{vnodeCount < 1}}.
- {{removeNode(name)}}: gỡ toàn bộ vnode của node. Ném {{IllegalArgumentException}} nếu không tồn tại.
- {{owner(key)}}: trả về tên node vật lý sở hữu key (successor theo chiều kim đồng hồ, có wrap-around). Ném {{IllegalStateException}} nếu ring rỗng.
- {{distribution(keys)}}: trả về {{Map<String,Integer>}} đếm số key mỗi node sở hữu (chỉ gồm node có ít nhất 1 key).
- {{movedCount(keys, before, after)}} là static: đếm số key có owner khác nhau giữa hai ring {{before}} và {{after}} trên cùng tập key.`,
      starter: `class ConsistentRing {
    void addNode(String name, int vnodeCount) { throw new UnsupportedOperationException("TODO"); }
    void removeNode(String name) { throw new UnsupportedOperationException("TODO"); }
    String owner(String key) { throw new UnsupportedOperationException("TODO"); }
    java.util.Map<String, Integer> distribution(java.util.List<String> keys) { throw new UnsupportedOperationException("TODO"); }
    static int movedCount(java.util.List<String> keys, ConsistentRing before, ConsistentRing after) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,n=0; static void c(String s, boolean b){n++;if(b){p++;System.out.println("PASS "+s);}else System.out.println("FAIL "+s+": incorrect");}
 public static void main(String[] x){
  ConsistentRing r=new ConsistentRing(); r.addNode("A",5); r.addNode("B",5);
  c("deterministic owner", r.owner("user-1").equals(r.owner("user-1")));
  c("wrap-around works", r.owner("zzz-wrap-key")!=null);
  java.util.List<String> keys=new java.util.ArrayList<>();
  for(int i=0;i<1000;i++) keys.add("key-"+i);
  ConsistentRing before=new ConsistentRing(); before.addNode("A",50); before.addNode("B",50);
  ConsistentRing after=new ConsistentRing(); after.addNode("A",50); after.addNode("B",50); after.addNode("C",50);
  int moved=ConsistentRing.movedCount(keys,before,after);
  boolean onlyC=true;
  for(String k:keys){ if(!before.owner(k).equals(after.owner(k)) && !after.owner(k).equals("C")) onlyC=false; }
  c("adding node moves some keys", moved>0 && moved<1000);
  c("moved keys go only to new node", onlyC);
  ConsistentRing rm=new ConsistentRing(); rm.addNode("A",50); rm.addNode("B",50); rm.addNode("C",50); rm.removeNode("C");
  int back=ConsistentRing.movedCount(keys,rm,before);
  c("remove then compare is stable", back==0);
  java.util.Map<String,Integer> dist=after.distribution(keys);
  int sum=0; for(int v:dist.values()) sum+=v;
  c("distribution sums to key count", sum==1000 && dist.containsKey("A") && dist.containsKey("B") && dist.containsKey("C"));
  boolean dup=false; try{ r.addNode("A",1);}catch(IllegalArgumentException e){ dup=true; }
  boolean bad=false; try{ r.addNode("D",0);}catch(IllegalArgumentException e){ bad=true; }
  c("invalid add rejected", dup && bad);
  ConsistentRing empty=new ConsistentRing(); boolean emptyErr=false; try{ empty.owner("k"); }catch(IllegalStateException e){ emptyErr=true; }
  c("empty ring throws", emptyErr);
  System.out.println("RESULT "+p+"/"+n);
 }
}`,
      reference: `class ConsistentRing {
    private final java.util.TreeMap<Integer,String> ring=new java.util.TreeMap<>();
    private final java.util.Set<String> nodes=new java.util.HashSet<>();
    void addNode(String name,int vnodeCount){
        if(name==null||name.isEmpty()||vnodeCount<1||!nodes.add(name)) throw new IllegalArgumentException();
        for(int i=0;i<vnodeCount;i++){
            int h=Math.floorMod((name+"#"+i).hashCode(),100000);
            while(ring.containsKey(h)) h=(h+1)%100000;
            ring.put(h,name);
        }
    }
    void removeNode(String name){
        if(!nodes.remove(name)) throw new IllegalArgumentException();
        ring.entrySet().removeIf(e -> e.getValue().equals(name));
    }
    String owner(String key){
        if(ring.isEmpty()) throw new IllegalStateException();
        int h=Math.floorMod(key.hashCode(),100000);
        java.util.Map.Entry<Integer,String> e=ring.ceilingEntry(h);
        return (e==null?ring.firstEntry():e).getValue();
    }
    java.util.Map<String,Integer> distribution(java.util.List<String> keys){
        java.util.Map<String,Integer> m=new java.util.HashMap<>();
        for(String k:keys){ String o=owner(k); m.put(o, m.getOrDefault(o,0)+1); }
        return m;
    }
    static int movedCount(java.util.List<String> keys, ConsistentRing before, ConsistentRing after){
        int moved=0; for(String k:keys) if(!before.owner(k).equals(after.owner(k))) moved++; return moved;
    }
}`,
      hints: [
        'Dùng {{TreeMap<Integer,String>}} (vị trí -> tên node vật lý) để {{ceilingEntry}} tìm successor và {{firstEntry}} để wrap-around.',
        'Khi thêm vnode, nếu vị trí hash đã có thì tăng dần {{(h+1) % 100000}} cho tới khi tìm được chỗ trống; lưu cả {{Set<String>}} tên node để phát hiện trùng tên.',
        'Xoá node: duyệt {{ring.entrySet().removeIf(...)}} theo tên vật lý; {{movedCount}} chỉ cần so {{owner}} trước/sau trên cùng danh sách key.'
      ],
      explain: `Lời giải tách rõ hai lớp: vòng lưu nhiều điểm (vnode) nhưng mỗi điểm trỏ về tên node vật lý, nên {{owner}} luôn trả về node thật. {{ceilingEntry}} cho successor; null nghĩa là key nằm sau vnode cuối cùng và phải quay về {{firstEntry}}. Dò tuyến tính khi trùng vị trí tránh ghi đè vnode khác. Khi thêm node C, chỉ các key rơi vào đoạn mà vnode của C vừa chiếm mới đổi owner, và chúng chỉ có thể chuyển sang C. {{distribution}} cho cái nhìn cân bằng tải: vnode càng nhiều, số key mỗi node càng gần nhau.`
    }, [
      { q: 'Thêm 1 node mới vào ring consistent hashing đang có 4 node (vnode đủ nhiều). Phát biểu nào đúng nhất?', options: ['Gần như tất cả key phải chuyển và rải đều sang 5 node', 'Khoảng 1/5 key chuyển và chúng chỉ chuyển sang node mới', 'Không key nào chuyển, node mới chỉ nhận key phát sinh sau này', 'Khoảng 1/4 key chuyển qua lại giữa các node cũ'], answer: 1, explain: 'Node mới chỉ "cắt" một số đoạn trên vòng nên chỉ các key trong đoạn đó đổi owner, xấp xỉ 1/(N+1). Các key chuyển đều đi sang node mới. "Gần như tất cả" là hành vi của hash modulo khi đổi N.' },
      { q: 'Vì sao cần virtual node (nhiều điểm mỗi node vật lý) thay vì 1 điểm?', options: ['Để cùng một key có thể nằm trên nhiều node', 'Để phân bố key đều hơn và cho phép gán trọng số khác nhau cho node mạnh/yếu', 'Để không cần hàm hash', 'Để tự động nhân bản (replicate) dữ liệu'], answer: 1, explain: 'Một điểm mỗi node dễ tạo đoạn vòng dài/ngắn lệch nhau; nhiều vnode rải điểm khắp vòng giúp cân bằng. Node mạnh có thể có nhiều vnode hơn. Vnode không thay thế replication.' },
      { q: 'Bỏ qua bước wrap-around (khi hash(key) lớn hơn mọi vnode) sẽ gây lỗi gì?', options: ['Key đó bị gán cho node có hash lớn nhất, đúng theo vòng', 'Key đó không tìm được owner dù ring không rỗng', 'Ring tự thêm vnode mới', 'Chỉ ảnh hưởng hiệu năng, không ảnh hưởng kết quả'], answer: 1, explain: 'Nếu không có vnode nào >= hash(key) thì successor hợp lệ là vnode nhỏ nhất (đầu vòng) vì vòng khép kín. Không quay vòng sẽ trả về null/exception cho một phần key hợp lệ.' }
    ], ['consistent-hashing', 'hash-ring', 'distribution']),
    lesson('008', 8, 'Quorum đọc/ghi: khi nào đọc được dữ liệu cũ và vì sao R + W > N', 'lead', [
      'Mô phỏng N replica với tham số W (ghi) và R (đọc), hiểu ý nghĩa chồng lấp tập hợp',
      'Phát hiện trường hợp đọc dữ liệu cũ khi R + W <= N và giải thích trade-off nhất quán/khả dụng/độ trễ'
    ], `**Tóm tắt:** Trong hệ có N bản sao (replica - bản sao của cùng dữ liệu trên nhiều máy), ghi xác nhận trên W replica và đọc từ R replica: nếu {{R + W > N}} thì tập replica được đọc và tập vừa được ghi chắc chắn có ít nhất 1 replica chung, nên đọc mạnh (strong read) có thể trả về bản mới nhất (với cơ chế chọn phiên bản). Nếu {{R + W <= N}} thì có thể đọc toàn bộ từ các replica chưa kịp nhận bản ghi, dẫn tới đọc dữ liệu cũ (stale read).

### Thuật ngữ cơ bản
- **Replica** (bản sao): mỗi máy giữ một bản copy của dữ liệu. Ví dụ 3 server đều lưu số dư tài khoản "U1".
- **N**: tổng số replica lưu dữ liệu đó.
- **W** (write quorum): số replica phải xác nhận đã ghi thành công thì phép ghi mới được coi là thành công. Ví dụ W=2 với N=3 nghĩa là ghi xong trên 2 máy là báo OK, máy thứ 3 có thể cập nhật trễ.
- **R** (read quorum): số replica phải trả lời khi đọc; client chọn bản "mới nhất" trong R kết quả (thường dựa trên version/timestamp).
- **Version** (phiên bản): một số tăng dần gắn với mỗi lần ghi để biết bản nào mới hơn. Không có version, khi 2 replica trả về giá trị khác nhau ta không biết cái nào đúng.
- **Stale read** (đọc cũ): đọc ra giá trị chưa bao gồm lần ghi gần nhất đã "thành công" theo W.

### Vì sao R + W > N đảm bảo giao nhau?
Đây là lập luận tập hợp đơn giản (pigeonhole principle - nguyên lý chuồng bồ câu):
- Tập ghi G có {{|G| = W}} replica.
- Tập đọc D có {{|D| = R}} replica.
- Tổng "chỗ" đã dùng: {{W + R}}. Nếu lớn hơn N (tổng replica tồn tại), hai tập không thể hoàn toàn rời nhau, nên {{G ∩ D}} có ít nhất {{R + W - N}} phần tử.
- Replica chung đó đã nhận bản ghi mới nhất => trong R bản đọc có ít nhất 1 bản mới.

Ví dụ số liệu: N=3, W=2, R=2. Ghi "v=5" thành công trên replica {A,B} (version 1), replica C vẫn giữ "v=0". Đọc với R=2: có thể đọc {A,C} hoặc {B,C} hoặc {A,B} - mọi trường hợp đều có A hoặc B, nên chọn version cao nhất sẽ được 5.

Ngược lại N=3, W=1, R=1: ghi thành công chỉ trên A (v=5, ver 1), đọc từ C (v=0, ver 0) => stale read vì {{1+1 <= 3}} và hai tập {A}, {C} không giao nhau.

~~~text
N=3 (A,B,C), version tăng dần mỗi lần ghi
W=2: ghi v=7 ver2 lên {A,B} OK, C còn ver1  -> đọc R=2 {B,C} thấy ver2,ver1 => chọn ver2 (mới)
W=1,R=1: ghi v=7 ver2 lên {A} OK            -> đọc R=1 {C} thấy ver1 => CŨ (stale)
~~~

### Trade-off khi chọn R, W
| Cấu hình (N=3) | Tính chất | Đổi lấy |
|---|---|---|
| W=3, R=1 | Đọc rất nhanh, luôn mới nếu ghi xong | Ghi chậm/yếu: 1 replica chết là không ghi được |
| W=1, R=3 | Ghi rất nhanh | Đọc chậm; ghi có thể mất nếu replica ghi chưa kịp nhân bản rồi chết |
| W=2, R=2 | Cân bằng, đọc/ghi chịu được 1 replica lỗi | Độ trễ trung bình cho cả đọc và ghi |
| W=1, R=1 | Rất nhanh, sẵn sàng cao | Có thể đọc cũ và mất ghi (R+W <= N) |

"Chịu được 1 replica lỗi" nghĩa là còn đủ replica sống để đạt W hoặc R: với N=3,W=2, chỉ cần 2 máy sống là vẫn ghi/đọc được.

### Những điều mô hình đơn giản chưa nói hết
- **Xung đột ghi đồng thời** (write conflict): hai client ghi cùng key lên các tập replica khác nhau cùng lúc; cần cơ chế hợp nhất (last-write-wins theo timestamp, vector clock, hoặc CRDT). Bài học này tập trung vào điều kiện đọc thấy ghi đã xác nhận.
- **Replica trễ/đứt mạng**: bản sao chưa nhận được ghi (hinted handoff, read repair sẽ sửa dần) là nguồn gốc stale read khi quorum không giao.
- **Không phải "linearizable" miễn phí**: R+W>N với version đơn giản cho đọc nhất quán trong nhiều trường hợp nhưng cạnh tranh phức tạp cần giao thức mạnh hơn (Paxos/Raft). Hệ thực tế (Cassandra, DynamoDB) cho phép chọn mức nhất quán.

### Lỗi hay gặp
- Nhầm lẫn "W=1 là đã an toàn" vì ghi trả về thành công: thực ra chỉ 1 bản có dữ liệu, hỏng bản đó trước khi nhân bản là mất.
- So sánh version sai kiểu (so chuỗi thay vì số) dẫn tới chọn bản cũ.
- Nghĩ tăng N tự động tăng tính nhất quán: nếu giữ R=1,W=1 thì N lớn hơn càng dễ đọc lệch.

### Liên hệ phỏng vấn
Trả lời theo công thức: nêu N,R,W, điều kiện {{R + W > N}} và lý do tập giao nhau; đưa ví dụ số cụ thể (N=3,W=2,R=2) và phản ví dụ stale read (W=1,R=1). Nêu trade-off độ trễ/khả dụng (chịu bao nhiêu node chết) và nhắc hệ thật cho phép cấu hình per-request (Cassandra {{CONSISTENCY}}, DynamoDB consistent read). Phân biệt "quorum nhất quán" với "consensus bầu leader" (Raft/Paxos) - liên quan nhưng khác bài toán.
`, {
      title: 'Mô phỏng N replica, ghi W đọc R và phát hiện stale read',
      prompt: `Cài {{ReplicaStore}} mô phỏng N replica cho một key duy nhất, mỗi replica lưu {{value}} (int) và {{version}} (int, tăng dần).
- Constructor {{ReplicaStore(int n)}}: tạo N replica, ban đầu value=0, version=0. Ném {{IllegalArgumentException}} nếu {{n < 1}}.
- {{write(int value, int w)}}: tăng version toàn hệ lên +1, ghi {{(value, version mới)}} vào đúng W replica đầu tiên (index 0..W-1) và trả về version mới. Ném {{IllegalArgumentException}} nếu {{w < 1 || w > n}}. (Mô phỏng: các replica còn lại chưa nhận bản mới.)
- {{read(int r)}}: đọc từ R replica cuối cùng (index n-r..n-1), trả về value của replica có version lớn nhất trong R bản đó. Ném {{IllegalArgumentException}} nếu {{r < 1 || r > n}}.
- {{isStale(int latestVersion, int r)}}: trả về {{true}} nếu {{read(r)}} có version nhỏ hơn {{latestVersion}} (đọc trượt bản mới nhất đã ghi thành công).
- {{quorumOverlap(int n, int r, int w)}}: static, trả về {{true}} nếu {{r + w > n}}.`,
      starter: `class ReplicaStore {
    ReplicaStore(int n) { throw new UnsupportedOperationException("TODO"); }
    int write(int value, int w) { throw new UnsupportedOperationException("TODO"); }
    int read(int r) { throw new UnsupportedOperationException("TODO"); }
    boolean isStale(int latestVersion, int r) { throw new UnsupportedOperationException("TODO"); }
    static boolean quorumOverlap(int n, int r, int w) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int p=0,nf=0; static void c(String s, boolean b){nf++;if(b){p++;System.out.println("PASS "+s);}else System.out.println("FAIL "+s+": incorrect");}
 public static void main(String[] x){
  ReplicaStore s=new ReplicaStore(3);
  int v1=s.write(10,2);
  c("write returns version", v1==1);
  c("quorum read sees latest when R+W>N", !s.isStale(v1,2) && s.read(2)==10);
  ReplicaStore s2=new ReplicaStore(3);
  int v2=s2.write(7,1);
  c("stale read when R+W<=N", ReplicaStore.quorumOverlap(3,1,1)==false && s2.isStale(v2,1) && s2.read(1)==0);
  ReplicaStore s3=new ReplicaStore(3);
  int a=s3.write(1,2); int b=s3.write(2,2);
  c("version increases and latest visible", b==a+1 && s3.read(2)==2);
  c("overlap formula", ReplicaStore.quorumOverlap(5,3,3) && !ReplicaStore.quorumOverlap(5,2,3) && ReplicaStore.quorumOverlap(3,2,2));
  boolean bad=false; try{ new ReplicaStore(0);}catch(IllegalArgumentException e){ bad=true; }
  boolean bad2=false; try{ s.read(0);}catch(IllegalArgumentException e){ bad2=true; }
  c("invalid args rejected", bad && bad2);
  System.out.println("RESULT "+p+"/"+nf);
 }
}`,
      reference: `class ReplicaStore {
    private final int n;
    private final int[] val;
    private final int[] ver;
    private int latestVer = 0;
    ReplicaStore(int n){
        if(n<1) throw new IllegalArgumentException();
        this.n=n; this.val=new int[n]; this.ver=new int[n];
    }
    int write(int value, int w){
        if(w<1||w>n) throw new IllegalArgumentException();
        latestVer++;
        for(int i=0;i<w;i++){ val[i]=value; ver[i]=latestVer; }
        return latestVer;
    }
    int read(int r){
        if(r<1||r>n) throw new IllegalArgumentException();
        int bestV=-1, bestVal=0;
        for(int i=n-r;i<n;i++){ if(ver[i]>bestV){ bestV=ver[i]; bestVal=val[i]; } }
        return bestVal;
    }
    boolean isStale(int latestVersion, int r){
        if(r<1||r>n) throw new IllegalArgumentException();
        int bestV=-1;
        for(int i=n-r;i<n;i++){ if(ver[i]>bestV) bestV=ver[i]; }
        return bestV < latestVersion;
    }
    static boolean quorumOverlap(int n, int r, int w){ return r + w > n; }
}`,
      hints: [
        'Lưu hai mảng độ dài N: {{val[i]}} và {{ver[i]}}. {{write}} tăng {{latestVer}} rồi cập nhật index 0..w-1; {{read}} duyệt n-r..n-1 chọn phần tử có {{ver}} lớn nhất.',
        '{{isStale}} so sánh version lớn nhất nhìn thấy khi đọc r replica với {{latestVersion}} đã ghi thành công.',
        '{{quorumOverlap}} chỉ là phép so sánh {{r + w > n}}; kiểm tra ví dụ N=3: (2,2) giao nhau, (1,1) thì không.'
      ],
      explain: `Mô hình cố định tập replica ghi là 0..W-1 và đọc là n-r..n-1 để quan sát rõ giao nhau: khi R+W>N hai dải luôn chồng (ví dụ W=2,R=2,N=3 => ghi 0,1 và đọc 1,2 giao ở index 1), nên {{read(2)}} luôn thấy version mới nhất sau {{write(...,2)}}. Khi W=1,R=1,N=3, ghi chạm index 0 còn đọc chỉ nhìn index 2 - không giao nhau - nên đọc ra giá trị cũ (stale). Điều kiện {{R+W>N}} bảo đảm mọi cặp tập hợp kích thước R,W đều có giao; {{R+W<=N}} thì tồn tại tập đọc không chứa replica vừa ghi. Hệ thực tế dùng version/timestamp (hoặc vector clock) để chọn bản thắng khi các replica trả về khác nhau.`
    }, [
      { q: 'Với N=5 replica, cấu hình nào đảm bảo mọi lần đọc (chọn bản version lớn nhất) thấy được lần ghi gần nhất đã xác nhận?', options: ['W=2, R=2', 'W=2, R=3', 'W=1, R=4', 'W=3, R=3'], answer: 3, explain: 'Cần R + W > N. Với N=5: (2,2)=4 không đủ, (2,3)=5 không đủ (phải lớn hơn N), (1,4)=5 không đủ, (3,3)=6 > 5 nên giao nhau chắc chắn.' },
      { q: 'Khi R + W <= N, điều gì có thể xảy ra?', options: ['Hệ thống tự động chuyển sang chế độ nhất quán mạnh', 'Có thể đọc phải giá trị cũ (stale) vì tập replica đọc và tập replica vừa ghi có thể không giao nhau', 'Ghi sẽ bị từ chối', 'Mọi replica luôn có cùng dữ liệu'], answer: 1, explain: 'Nếu tổng nhỏ hơn hoặc bằng N, tồn tại khả năng chọn R replica để đọc nằm ngoài W replica vừa nhận ghi, nên không replica nào trong tập đọc có bản mới. Hệ không tự nâng cấp nhất quán; ghi vẫn có thể thành công theo W; replica không tự đồng bộ tức thì.' },
      { q: 'Trong mô hình quorum, vì sao mỗi bản ghi/replica cần version (hoặc timestamp)?', options: ['Để nén dữ liệu', 'Để khi đọc từ R replica có thể chọn bản mới nhất trong các giá trị khác nhau', 'Để giảm số replica cần ghi', 'Để thay thế hoàn toàn cơ chế quorum'], answer: 1, explain: 'Khi R replica trả về giá trị khác nhau, client cần tiêu chí so sánh để biết bản nào mới hơn; version tăng đơn điệu hoặc timestamp phục vụ việc đó. Nó không nén dữ liệu, không giảm W, và không thay thế điều kiện giao nhau của quorum.' },
      { q: 'Với N=3, W=1, R=1, phát biểu nào đúng?', options: ['Không bao giờ đọc được dữ liệu cũ', 'Có thể vừa đọc cũ vừa mất dữ liệu nếu replica duy nhất nhận ghi hỏng trước khi nhân bản', 'Luôn chậm hơn N=3, W=2, R=2', 'Tương đương nhất quán mạnh'], answer: 1, explain: 'W=1 nghĩa chỉ 1 replica xác nhận ghi: nếu nó hỏng trước khi sao sang replica khác, bản ghi mất; R=1 đọc từ 1 replica có thể không phải bản vừa ghi (R+W=2 <= 3). Đổi lại độ trễ thấp và sẵn sàng cao hơn khi node chết, nhưng không đảm bảo nhất quán mạnh.' }
    ], ['quorum', 'replication', 'consistency']),

  );
})();
