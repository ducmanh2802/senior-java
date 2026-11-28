/* Bài học track "jvm". Schema & markup: AGENTS.md mục 12 (bài mẫu: lessons-collections.js). */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-jvm-001',
  track: 'jvm',
  order: 1,
  title: 'Heap và bốn loại reference: vì sao static Map giữ object mãi mãi',
  level: 'senior',
  minutes: 30,
  goals: [
    'Mô tả được heap được chia thành các vùng nào và object đi qua đó ra sao',
    'Phân biệt strong, soft, weak, phantom reference và biết loại nào dùng cho cache',
    'Giải thích được {{WeakHashMap}} hoạt động thế nào và vì sao value trỏ ngược lại key làm entry không bao giờ bị xoá',
    'Nhận diện memory leak qua static collection, {{ThreadLocal}} và classloader',
  ],
  body: `**Tóm tắt:** Heap chia thành Young (Eden + Survivor) và Old generation; Metaspace lưu metadata class ở bộ nhớ native. GC chỉ thu hồi object không còn đường đi từ GC root. Strong/Soft/Weak/Phantom reference quyết định "mạnh" đến đâu object được giữ lại — hiểu điều này là chìa khóa để giải thích memory leak và chọn cache đúng.

### Heap không phải một khối phẳng
HotSpot chia heap thành các vùng theo **tuổi** của object. Hiểu vùng nào chứa gì giúp bạn đọc GC log và chọn kích thước heap, thay vì đoán mò.

- **Young generation** gồm **Eden** và hai **Survivor** (S0, S1). Hầu hết object được sinh ra ở Eden bằng một phép tăng con trỏ trong **TLAB** (Thread-Local Allocation Buffer), gần như miễn phí. Khi Eden đầy, một **minor GC** copy các object còn sống sang Survivor rồi tăng tuổi; object sống qua vài lần được **promote** sang old generation.
- **Old generation** chứa object sống lâu: cache, singleton, connection pool. Đây là nơi **major/full GC** làm việc, và cũng là nơi memory leak biểu hiện rõ nhất: heap dùng tăng dần qua các lần full GC mà không giảm.
- **Metaspace** (từ Java 8, thay PermGen) chứa metadata class (cấu trúc method, bytecode, constant pool). Nó **không** nằm trong heap Java mà là bộ nhớ native của tiến trình, nên {{-Xmx}} không giới hạn nó (giới hạn bằng {{-XX:MaxMetaspaceSize}}). Nạp quá nhiều class sinh ra bởi proxy, script engine hay hot reload có thể làm đầy metaspace.

Điều quan trọng: **GC không đếm reference, nó tìm object không còn đường đi từ GC root**. Một object còn một tham chiếu từ biến local đang sống, từ static field, từ JNI hay từ monitor đang giữ thì vẫn sống, dù không ai dùng nó nữa. Đây chính là gốc của mọi memory leak trong Java.

### Bốn mức "mạnh" của reference
| Loại | Bị xoá khi nào | Dùng để |
|---|---|---|
| **Strong** | Không còn đường đi từ GC root | Mặc định; biến local, field thường |
| **Soft** | Tuỳ GC quyết định theo áp lực bộ nhớ; **chắc chắn** bị xoá trước khi ném {{OutOfMemoryError}} | Cache nhạy cảm bộ nhớ |
| **Weak** | Ở **lần GC tới quét vùng chứa object** nếu chỉ còn weak reference | {{WeakHashMap}}, canonical map, metadata |
| **Phantom** | Không giữ object; được đưa vào queue khi object đã không còn reachable theo mọi cách khác | Biết chắc object đã chết để dọn tài nguyên native qua {{ReferenceQueue}} |

Strong reference chỉ là biến thường. Ba loại còn lại là class trong {{java.lang.ref}}, đều có hàm {{get()}} để lấy lại object (trả null nếu đã bị clear), riêng {{phantom.get()}} **luôn** trả về null theo đặc tả. Lý do: phantom dùng để biết object **đã chết hẳn**, không phải để lấy lại object. JDK dùng cơ chế này cho {{Cleaner}} của {{DirectByteBuffer}} để giải phóng bộ nhớ off-heap.

~~~java
Object strong = new Object();                         // không bao giờ bị xoá khi biến còn sống
SoftReference<byte[]> soft = new SoftReference<>(new byte[10_000_000]);
WeakReference<Object> weak = new WeakReference<>(new Object());
ReferenceQueue<Object> queue = new ReferenceQueue<>();
PhantomReference<Object> phantom = new PhantomReference<>(new Object(), queue);
~~~

Một điểm rất dễ hỏi khi phỏng vấn: **soft reference không đảm bảo cache của bạn còn dữ liệu**. Đặc tả chỉ hứa một điều: mọi soft reference sẽ bị xoá trước khi JVM ném OOM. Còn xoá lúc nào thì tuỳ GC. HotSpot dùng chính sách kiểu LRU: một soft reference không được {{get()}} trong khoảng {{SoftRefLRUPolicyMSPerMB}} (mặc định 1000 ms) nhân với số MB heap còn trống thì bị xoá. Hệ quả: heap càng đầy, soft reference càng bị xoá sớm, đúng lúc hệ thống đang chịu tải; ngược lại, cache soft lớn khiến mỗi GC phải làm việc nhiều hơn và heap luôn trông như gần đầy. Vì vậy cache production dùng thư viện như Caffeine với **kích thước tối đa** và **expiry** tường minh, không dựa vào soft reference.

### WeakHashMap bên trong
{{WeakHashMap}} trông như {{HashMap}} nhưng key là **weak**. Mỗi entry kế thừa {{WeakReference}} tới key, và map giữ một {{ReferenceQueue}}. Khi key không còn strong reference, GC clear referent và đẩy entry vào queue. Trước mỗi thao tác {{get}}/{{put}}/{{size}}, map gọi {{expungeStaleEntries()}} để dọn các entry đã chết. Vì vậy bạn có thể thấy map tự nhỏ lại mà không gọi hàm xoá nào.

Hai cái bẫy chết người:

1. **Key phải thực sự không còn ai giữ ở bên ngoài**. Nếu một field khác, một list khác, hay một cache khác vẫn trỏ tới key thì entry không bao giờ bị dọn. Trường hợp kín đáo nhất: key là String literal ({{"abc"}} được intern, sống suốt đời class) hoặc {{Integer}} nhỏ từ {{Integer.valueOf}} (cache -128..127). Các key này không bao giờ chết, nên dùng chúng làm key của {{WeakHashMap}} là vô nghĩa.
2. **Value trỏ ngược key**. Map giữ value bằng strong reference. Nếu value có field trỏ tới key thì key luôn reachable theo đường map → entry → value → key, nên weak reference không bao giờ bị clear. Trường hợp cực đoan là {{map.put(session, session)}}: value chính là key, entry sống mãi. Đây là lỗi rất khó thấy khi value là một object lớn chứa tham chiếu tới key để log hoặc callback. Javadoc của {{WeakHashMap}} gợi ý: nếu value buộc phải biết key, hãy bọc value trong {{WeakReference}}.

{{WeakHashMap}} **không thread-safe**, không có giới hạn kích thước, không có thống kê hit/miss, và việc entry biến mất phụ thuộc GC nên không phù hợp làm cache chính. Nó hợp với **canonical map**: ánh xạ một object tạm sang metadata mà không giữ object sống.

### Vì sao static Map là memory leak kinh điển
Một field {{static}} là **GC root**: nó sống theo classloader, thường là suốt đời ứng dụng. Do đó:

~~~java
class SessionRegistry {
    // static + HashMap + key mạnh = mọi Session đã đăng xuất vẫn nằm đây
    private static final Map<String, Session> SESSIONS = new HashMap<>();

    static void register(Session s) { SESSIONS.put(s.id(), s); }
    // thiếu remove khi logout hoặc khi session hết hạn
}
~~~

Sau vài ngày, {{SESSIONS}} giữ mọi session từng tạo, kéo theo user, permission, connection. Heap tăng đều, full GC không giải phóng, cuối cùng {{java.lang.OutOfMemoryError: Java heap space}}. Cùng cơ chế với:

- {{ThreadLocal}} trong thread pool: thread sống lâu, value trong {{ThreadLocalMap}} không bao giờ bị xoá nếu không gọi {{remove()}}.
- Listener/callback đăng ký mà không huỷ: subject static giữ listener, listener giữ view/activity.
- Classloader leak: static field giữ class của webapp cũ, khiến cả classloader không unload được.

Cách chữa không phải "dùng weak cho tất cả" mà là **quản lý vòng đời**: bounded cache có TTL, đăng ký/huỷ đăng ký đối xứng, {{try/finally}} gọi {{remove()}} cho ThreadLocal, và kiểm tra heap bằng {{jcmd <pid> GC.heap_info}}, {{jmap -histo:live}}, heap dump với {{-XX:+HeapDumpOnOutOfMemoryError}}. Trong MAT, nhìn **dominator tree** và **retained size** để biết object nào thực sự giữ cả một cây.

### Ví dụ đời thực
Một hệ thống thanh toán đỉnh cao 50k request/giây dùng {{WeakHashMap<SessionId, UserProfile>}} làm cache profile. Sau 2 tuần deploy, pod bị OOMKilled. Heap dump (MAT) cho thấy {{WeakHashMap}} retained size 1.2 GB, 2.4 triệu entry. Nguyên nhân: {{UserProfile}} có field {{lastAccessedSessionId}} trỏ ngược về key, khiến weak key không bao giờ bị clear. Sửa: bỏ field tham chiếu ngược, đổi sang Caffeine {{maximumSize=100_000, expireAfterWrite=10m}}. Kết quả: heap ổn định ở 400 MB, p99 latency giảm từ 450 ms xuống 80 ms.

### Trả lời mẫu khi phỏng vấn
"Heap được chia thành Young và Old generation theo tuổi object. GC không đếm reference mà tìm reachability từ GC root — biến local, static field, JNI reference. Vì vậy static Map giữ object mãi vì static field là GC root. Về reference: Strong là mặc định; Soft bị xoá trước OOM, phù hợp cache nhạy cảm bộ nhớ nhưng không kiểm soát được thời điểm xoá; Weak bị xoá ở GC kế tiếp nếu chỉ còn weak ref, dùng cho WeakHashMap hay canonical map; Phantom không giữ object, chỉ để nhận biết object đã chết qua ReferenceQueue. Một bẫy thường gặp: WeakHashMap value trỏ ngược key (map.put(k, k)) khiến entry không bao giờ bị xoá. Production nên dùng bounded cache (Caffeine) có TTL thay vì phụ thuộc GC."

> Senior tip: Đừng bao giờ dùng SoftReference làm cache chính trên production — nó khiến GC chạy nặng đúng lúc hệ thống đang tải cao. Luôn dùng cache có giới hạn kích thước và TTL tường minh (Caffeine), và nhớ kiểm tra "value trỏ ngược key" khi review code dùng WeakHashMap.
`,
  exercises: [
    {
      title: 'Cache weak value tự dọn bằng ReferenceQueue',
      prompt: `Hoàn thiện {{WeakValueCache<K, V>}}: value được giữ bằng **weak reference**, nên khi không còn ai dùng value, GC có thể thu hồi và cache tự dọn entry.

Yêu cầu:
- {{get(key)}}: gọi {{drain()}} trước, nếu entry còn value thì trả về value đó (không gọi loader). Nếu không có hoặc value đã bị clear thì gọi {{loader.apply(key)}}; nếu loader trả về null thì **không** lưu và trả về null; ngược lại tạo entry mới, tăng {{loads}}, trả về value.
- {{drain()}}: lấy hết reference đã bị GC đẩy vào queue, xoá đúng entry tương ứng khỏi map (dùng {{key}} lưu trong entry), trả về số entry đã xoá. Không được xoá nhầm entry mới nếu key đã được nạp lại.
- {{size()}}: gọi {{drain()}} rồi trả về số entry.
- {{loads()}}: số lần loader thực sự được gọi và trả về giá trị khác null.
- {{ref(key)}}: trả về entry để test có thể gọi {{enqueue()}} thủ công.

{{Entry}} đã được khai báo sẵn, kế thừa {{WeakReference<V>}} và giữ thêm {{key}}.`,
      starter: `import java.lang.ref.*;

class WeakValueCache<K, V> {
    static final class Entry<K, V> extends WeakReference<V> {
        final K key;
        Entry(K key, V value, ReferenceQueue<V> queue) {
            super(value, queue);
            this.key = key;
        }
    }

    private final Map<K, Entry<K, V>> entries = new HashMap<>();
    private final ReferenceQueue<V> queue = new ReferenceQueue<>();
    private final Function<K, V> loader;
    private int loads;

    WeakValueCache(Function<K, V> loader) {
        this.loader = loader;
    }

    V get(K key) {
        throw new UnsupportedOperationException("TODO");
    }

    int drain() {
        throw new UnsupportedOperationException("TODO");
    }

    int size() {
        throw new UnsupportedOperationException("TODO");
    }

    int loads() {
        throw new UnsupportedOperationException("TODO");
    }

    Entry<K, V> ref(K key) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("loader chỉ chạy một lần cho cùng key", () -> {
            int[] calls = {0};
            WeakValueCache<String, Integer> c = new WeakValueCache<>(k -> { calls[0]++; return k.length(); });
            eq(5, c.get("alpha"));
            eq(5, c.get("alpha"));
            eq(1, calls[0]);
            eq(1, c.loads());
            eq(1, c.size());
        });
        check("hai key equals nhau dùng chung một entry", () -> {
            int[] calls = {0};
            WeakValueCache<String, Integer> c = new WeakValueCache<>(k -> { calls[0]++; return k.length(); });
            String k1 = new String("beta");
            String k2 = new String("beta");
            eq(4, c.get(k1));
            eq(4, c.get(k2));
            eq(1, calls[0]);
            eq(1, c.size());
        });
        check("loader trả null thì không cache", () -> {
            WeakValueCache<String, String> c = new WeakValueCache<>(k -> null);
            eq(null, c.get("missing"));
            eq(0, c.loads());
            eq(0, c.size());
        });
        check("entry bị enqueue được drain xoá và lần sau nạp lại", () -> {
            int[] calls = {0};
            WeakValueCache<String, String> c = new WeakValueCache<>(k -> { calls[0]++; return "v-" + k; });
            // giữ value bằng biến local để GC thật không clear chúng giữa chừng (test xác định)
            String vx = c.get("x");
            String vy = c.get("y");
            eq(2, c.size());
            eq(0, c.drain());
            c.ref("x").enqueue();          // giả lập GC: clear value và đưa entry vào queue
            eq(1, c.drain());
            eq(1, c.size());
            String vx2 = c.get("x");
            eq("v-x", vx2);
            eq(3, calls[0]);
            eq(2, c.size());
            java.lang.ref.Reference.reachabilityFence(vx);
            java.lang.ref.Reference.reachabilityFence(vy);
            java.lang.ref.Reference.reachabilityFence(vx2);
        });
        check("entry cũ tới queue muộn không xoá entry mới cùng key", () -> {
            int[] calls = {0};
            WeakValueCache<String, String> c = new WeakValueCache<>(k -> { calls[0]++; return "v" + calls[0]; });
            String v1 = c.get("k");
            WeakValueCache.Entry<String, String> old = c.ref("k");
            old.clear();                   // value bị clear nhưng entry chưa vào queue
            String v2 = c.get("k");        // value null -> nạp lại, entry mới thay entry cũ
            eq("v2", v2);
            old.enqueue();                 // entry cũ bây giờ mới tới queue
            eq(1, c.size());               // drain không được xoá entry mới
            eq("v2", c.get("k"));
            eq(2, calls[0]);
            java.lang.ref.Reference.reachabilityFence(v1);
            java.lang.ref.Reference.reachabilityFence(v2);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.lang.ref.*;

class WeakValueCache<K, V> {
    static final class Entry<K, V> extends WeakReference<V> {
        final K key;
        Entry(K key, V value, ReferenceQueue<V> queue) {
            super(value, queue);
            this.key = key;
        }
    }

    private final Map<K, Entry<K, V>> entries = new HashMap<>();
    private final ReferenceQueue<V> queue = new ReferenceQueue<>();
    private final Function<K, V> loader;
    private int loads;

    WeakValueCache(Function<K, V> loader) {
        this.loader = loader;
    }

    V get(K key) {
        drain();
        Entry<K, V> e = entries.get(key);
        V v = e == null ? null : e.get();
        if (v != null) return v;
        v = loader.apply(key);
        if (v == null) {
            entries.remove(key);
            return null;
        }
        entries.put(key, new Entry<>(key, v, queue));
        loads++;
        return v;
    }

    int drain() {
        int removed = 0;
        Reference<? extends V> r;
        while ((r = queue.poll()) != null) {
            Entry<?, ?> e = (Entry<?, ?>) r;
            if (entries.remove(e.key, e)) removed++;
        }
        return removed;
    }

    int size() {
        drain();
        return entries.size();
    }

    int loads() {
        return loads;
    }

    Entry<K, V> ref(K key) {
        return entries.get(key);
    }
}`,
      hints: [
        'Trong {{get}}, {{drain()}} phải chạy trước khi đọc map để entry đã chết không bị dùng lại.',
        'Queue trả về {{Reference<? extends V>}}; cast sang {{Entry<?, ?>}} để lấy lại {{key}} rồi {{entries.remove(key, entry)}} — dùng remove hai tham số để không xoá nhầm entry mới.',
        'Chỉ tăng {{loads}} khi loader trả về giá trị khác null, vì null nghĩa là không có gì được cache.',
      ],
      explain: `Điểm mấu chốt là **hai chiều liên kết**: map giữ key mạnh để tra cứu, nhưng value chỉ được giữ yếu. Khi value không còn ai dùng, GC clear nó và đẩy {{Entry}} vào {{ReferenceQueue}}. Lần {{get}}/{{size}} sau, {{drain}} lấy entry ra và xoá entry khỏi map. Đây đúng là cơ chế {{WeakHashMap}} dùng cho **key**, chỉ khác chiều weak.

Lỗi hay gặp:
- Dùng {{entries.remove(e.key)}} một tham số: nếu key đã được nạp lại bằng một entry mới, bạn xoá mất entry mới. {{remove(key, value)}} chỉ xoá khi đúng cặp key-entry.
- Quên {{drain}} trong {{get}}: value đã chết nhưng map vẫn còn entry, {{size}} báo sai và bộ nhớ entry (không phải value) vẫn tích.
- Tưởng weak value là cache đủ tốt: entry có thể biến mất bất cứ lúc nào, hit rate không ổn định. Production dùng cache có **max size + TTL**, weak chỉ để tránh giữ object không cần thiết.

Về test: trong test, {{enqueue()}} được gọi thủ công để giả lập việc GC clear value và đưa entry vào queue (từ Java 9, {{enqueue()}} cũng clear referent). Gọi {{System.gc()}} thì không xác định, vì JVM không bắt buộc chạy GC ngay. Test cuối mô phỏng tình huống thật: GC clear value, cache nạp lại entry mới cho cùng key, rồi entry cũ mới tới queue; nếu {{drain}} xoá theo key thì entry mới bị mất.

Lưu ý đối xứng với {{WeakHashMap}}: ở đây weak nằm ở **value**, nên nếu có ai giữ value mạnh (ví dụ key hay một object khác trỏ tới value) thì value không bao giờ bị clear. Luôn phải nhìn cả đồ thị tham chiếu, không chỉ nhìn kiểu reference.`,
    },
  ],
  check: [
    {
      q: 'Loại reference nào bị JVM xoá ở lần GC kế tiếp nếu object chỉ còn loại tham chiếu đó?',
      options: ['SoftReference', 'WeakReference', 'PhantomReference', 'Strong reference'],
      answer: 1,
      explain: `Weak reference bị clear ngay khi object chỉ còn weakly reachable, không cần chờ áp lực bộ nhớ. SoftReference chỉ bị xoá khi JVM sắp hết heap; PhantomReference không giữ object sống và {{get()}} luôn null; strong reference thì object sống chừng nào còn đường đi từ GC root.`,
    },
    {
      q: 'Bạn đặt {{map.put(session, session)}} vào một {{WeakHashMap}}. Chuyện gì xảy ra?',
      options: [
        'Entry bị xoá ngay sau lần GC đầu tiên',
        'Map ném {{IllegalArgumentException}}',
        'Key bị xoá nhưng value vẫn còn trong map',
        'Entry sống mãi vì value trong map giữ key theo kiểu strong',
      ],
      answer: 3,
      explain: `Map giữ value bằng strong reference; value chính là key, nên luôn có đường đi map → value → key. Key vẫn strongly reachable nên weak reference không bị clear, entry không bao giờ được dọn. Đây là biến thể memory leak rất hay gặp: không phải weak key sai, mà value vô tình giữ key.`,
    },
    {
      q: 'Vì sao một {{static final Map}} giữ object mãi mãi?',
      options: [
        'Vì static field nằm trong Metaspace nên không bị GC quét',
        'Vì HashMap tự cache mọi key',
        'Vì static field là GC root, nên mọi object map trỏ tới đều reachable',
        'Vì map dùng soft reference cho value',
      ],
      answer: 2,
      explain: `Static field của class còn sống là GC root. Map reachable → key/value reachable → object không bị thu hồi dù nghiệp vụ đã xong. Từ JDK 7, static field được JVM lưu trong {{java.lang.Class}} object nằm trên Java heap (Metaspace chỉ chứa metadata class), nên hoàn toàn bị GC quét — việc tham chiếu tĩnh là root cho tới khi class bị unload mới là lý do object không bị thu hồi. HashMap không tự cache; còn soft reference phải được khai báo tường minh.`,
    },
    {
      q: 'Khi nào nên chọn SoftReference thay vì WeakReference?',
      options: [
        'Khi cần cache dữ liệu có thể tái tạo và chấp nhận mất khi JVM thiếu bộ nhớ',
        'Khi cần đảm bảo object không bao giờ bị thu hồi',
        'Khi cần nhận thông báo sau khi object đã chết hẳn',
        'Khi key là String và cần so sánh bằng equals',
      ],
      answer: 0,
      explain: `Soft reference phù hợp cache "mềm": JVM cố giữ nhưng sẽ xoá trước khi ném OOM, nên dữ liệu phải tái tạo được. Không có reference nào đảm bảo giữ mãi ngoài strong. Thông báo sau khi object chết là PhantomReference + ReferenceQueue. Còn so sánh key bằng equals là ngữ nghĩa của map, không liên quan mức mạnh của reference.`,
    },
  ],
  related: ['jvm-001', 'jvm-002', 'jvm-010'],
  tags: ['heap', 'WeakHashMap', 'WeakReference', 'memory leak', 'ReferenceQueue'],
},
{
  id: 'lesson-jvm-002',
  track: 'jvm',
  order: 2,
  title: 'GC mark-and-sweep từ con số 0: reachability, tri-color và vì sao cần compact',
  level: 'senior',
  minutes: 35,
  goals: [
    'Kể đúng các GC root và giải thích vì sao GC chỉ thu hồi object không reachable',
    'Mô phỏng được pha mark và sweep trên đồ thị object, kể cả chu trình',
    'Hiểu tri-color marking, write barrier và vì sao GC concurrent cần SATB hoặc incremental update',
    'Đọc được GC log cơ bản và biết khi nào cần chỉnh pause target, region size hay heap',
  ],
  body: `**Tóm tắt:** GC tracing bắt đầu từ GC root (stack, static field, JNI, monitor) và đi theo cạnh tham chiếu. Object không có đường đi từ root bị coi là rác — chu trình không leak vì không có root. Mark-sweep có hai pha: mark (duyệt đồ thị, O(số object sống)) và sweep (quét toàn bộ heap, O(tổng heap)). Tri-color marking (trắng/xám/đen) cho phép GC chạy concurrent; write barrier (incremental update hoặc SATB) giữ bất biến "đen không trỏ trắng". Generational GC tận dụng weak generational hypothesis: young gen (Eden + Survivor) GC thường xuyên, old gen GC hiếm. G1 dùng region, remembered set, pause target; ZGC/Shenandoah gần như concurrent hoàn toàn.

### GC chỉ trả lời một câu hỏi: object này còn đi được từ root không?
Mọi thuật toán GC tracing đều bắt đầu từ một tập **GC root** nhỏ và đi theo các cạnh tham chiếu. Object nào không có đường đi từ root bị coi là rác, bất kể có bao nhiêu object khác trỏ tới nó. Đây là lý do **chu trình** không làm rò bộ nhớ trong Java, khác với reference counting.

GC root gồm:
- biến local và tham số đang nằm trong stack frame của thread sống;
- static field của class đã nạp;
- object đang giữ monitor (đang synchronized);
- tham chiếu JNI từ code native;
- classloader, thread object, và một số cấu trúc nội bộ JVM.

Nếu ai đó nói "object bị leak vì còn tham chiếu", câu hỏi tiếp phải là: **tham chiếu đó có nằm trên đường từ root không?** Một object trong danh sách rác vẫn có thể trỏ tới object khác, nhưng cả cụm vẫn bị thu hồi.

### Pha mark: duyệt đồ thị
Mark bắt đầu bằng việc đánh dấu root, rồi duyệt các cạnh. Có thể dùng DFS, BFS hoặc stack tường minh để tránh tràn stack với đồ thị sâu. Mỗi object có một bit mark; cuối pha, bit bật nghĩa là còn sống.

~~~java
// Mô phỏng tối giản: đánh dấu mọi object reachable từ roots
void mark(Set<Integer> roots) {
    Deque<Integer> stack = new ArrayDeque<>(roots);
    while (!stack.isEmpty()) {
        int id = stack.pop();
        Obj o = objects.get(id);
        if (o == null || o.marked) continue;
        o.marked = true;
        for (int next : o.refs) stack.push(next);   // đẩy các cạnh chưa thăm
    }
}
~~~

### Pha sweep: trả object chết về tự do
Sweep đi qua toàn bộ heap, object nào không mark thì giải phóng. Có hai cách quản lý vùng nhớ sau đó:

- **Free-list**: ghi các khoảng trống vào danh sách, cấp phát lại theo kích thước phù hợp. Không di chuyển object nhưng dễ **phân mảnh**: còn nhiều byte rảnh nhưng không có khối liền đủ lớn.
- **Compaction** (mark-compact): dồn object sống về một đầu, cập nhật mọi tham chiếu. Hết phân mảnh, cấp phát lại kiểu bump-pointer cực nhanh, nhưng phải di chuyển object nên đắt và cần dừng thế giới lâu hơn.

Đây là lý do các collector hiện đại không dùng mark-sweep thuần (CMS là collector mark-sweep concurrent cuối cùng, đã bị xoá ở Java 14 một phần vì phân mảnh): G1, ZGC, Shenandoah đều có cơ chế **evacuation** (copy object sống sang vùng mới) hoặc compaction theo vùng. Copy vừa dọn rác vừa chống phân mảnh, đổi lại tốn bộ nhớ cho vùng đích và cần cập nhật con trỏ.

### Tri-color: cách GC chạy song song với ứng dụng
Để giảm pause, GC đánh dấu **concurrent** trong khi ứng dụng vẫn chạy. Nó chia object thành ba màu:

- **Trắng**: chưa thăm, ứng viên bị thu hồi.
- **Xám**: đã thăm nhưng chưa quét hết các cạnh con.
- **Đen**: đã thăm và đã quét hết con.

Bất biến cần giữ: **object đen không được trỏ tới object trắng**. Nếu ứng dụng vừa gán một cạnh từ đen sang trắng trong lúc GC đang chạy, object trắng có thể bị sweep nhầm. Hai họ barrier xử lý vấn đề này theo hai cách khác nhau:

- **Incremental update** (CMS): khi phát hiện ghi vào object đen, tô xám lại object đó để GC quét lại. Có thể phải remark.
- **SATB — snapshot-at-the-beginning** (G1): khi ghi đè một cạnh, ghi lại giá trị **cũ** vào buffer, coi như ảnh chụp tại thời điểm bắt đầu mark. Nhờ vậy object đã sống lúc bắt đầu vẫn được giữ, dù ứng dụng vừa bỏ tham chiếu.

Cả hai đều cần **write barrier**: một đoạn code nhỏ chèn vào mỗi lệnh ghi reference. Barrier làm chậm ứng dụng một chút, nhưng đổi lấy pause ngắn hơn nhiều.

### Generational: tận dụng "hầu hết object chết trẻ"
Weak generational hypothesis: phần lớn object chết rất sớm. Vì vậy GC chia heap và **chỉ quét young** trong minor GC. Object sống sót được promote sang old. Để tìm tham chiếu từ old generation trỏ vào young mà không quét cả old, JVM dùng **card table** (trong HotSpot mỗi card ứng với 512 byte heap, mỗi card là 1 byte trong bảng) và G1 có thêm **remembered set** cho từng region. Khi ghi một tham chiếu old → young, write barrier đánh dấu card bẩn; minor GC chỉ quét các card bẩn.

G1 chia heap thành nhiều **region** bằng nhau, không cần young/old liền nhau. Kích thước region là luỹ thừa của 2 từ 1 MB tới 32 MB (từ JDK 18 có thể tới 512 MB), JVM tự chọn sao cho heap có khoảng 2048 region, hoặc bạn đặt bằng {{-XX:G1HeapRegionSize}}. Mỗi region có thể là Eden, Survivor, Old hoặc **Humongous** (object lớn hơn 50% region). G1 chọn tập region thu gom theo **pause target** ({{-XX:MaxGCPauseMillis}}, mặc định 200ms) thay vì cố định. ZGC và Shenandoah tiến xa hơn: marking, relocation hầu như concurrent, pause thường dưới 1 ms (ZGC) tới vài ms, đổi lại throughput thấp hơn một chút và cần dư heap/CPU. ZGC có chế độ generational từ Java 21 ({{-XX:+UseZGC -XX:+ZGenerational}}) và từ Java 23 đó là chế độ mặc định.

| Collector | Điểm mạnh | Khi chọn |
|---|---|---|
| Serial | Đơn giản, ít overhead | Container nhỏ, heap vài trăm MB; JVM tự chọn Serial khi máy có dưới 2 CPU hoặc dưới khoảng 1.8 GB RAM |
| Parallel | Throughput cao | Batch, ít quan tâm pause |
| G1 | Cân bằng, mặc định từ Java 9 | Phần lớn service |
| ZGC / Shenandoah | Pause rất thấp | Heap lớn, SLA latency chặt |

### Đọc GC log và tránh tuning mò
Bật log thống nhất từ Java 9: {{-Xlog:gc*:file=gc.log:time,uptime,level,tags}}. Cần nhìn **allocation rate**, **live set sau full GC**, **pause distribution**, không chỉ "GC chạy nhiều". Nếu live set sau full GC vẫn tăng theo thời gian, đó là leak chứ không phải thiếu heap. Nếu pause cao nhưng live set nhỏ, có thể do allocation rate quá lớn hoặc region/young quá nhỏ.

Ba lỗi tuning hay gặp:
- Đặt {{-Xms}} nhỏ hơn {{-Xmx}} nhiều: lúc warm-up heap phải giãn dần, GC chạy dày hơn và latency dao động. Service production thường đặt {{-Xms}} bằng {{-Xmx}} (trong container hay dùng {{-XX:MaxRAMPercentage}}).
- Đặt {{-Xmn}} quá lớn làm old generation nhỏ, gây full GC liên tục; quá nhỏ làm object promote sớm. Với G1, đặt cứng {{-Xmn}} còn tắt luôn khả năng tự co giãn young gen để đạt pause target, nên thường không nên đặt.
- Gọi {{System.gc()}} trong code nghiệp vụ: nó kích hoạt full GC (với G1 mặc định là stop-the-world), thường chỉ làm tệ hơn. Có thể chặn bằng {{-XX:+DisableExplicitGC}}, nhưng cẩn thận: JDK gọi {{System.gc()}} khi thiếu bộ nhớ direct cho {{ByteBuffer.allocateDirect}} (Netty, NIO), tắt nó có thể dẫn tới {{OutOfMemoryError: Direct buffer memory}}.

### Ví dụ đời thực
Một dịch vụ e-commerce Java 17, heap 4 GB, G1GC, traffic 20k req/s. Sáng nay p99 latency nhảy từ 120 ms lên 2.5 s, CPU GC từ 5% lên 65%. GC log cho thấy: Pause Full (G1 Compaction Pause) 3800M->3200M(4096M) 1850ms lặp lại mỗi 3 phút; live set sau Full GC tăng đều 3.0 GB → 3.2 GB → 3.4 GB. Heap dump (MAT) dominator tree: {{HashMap$Node}} retained 2.1 GB, path to GC roots qua static field {{ProductCache.MAP}}. Nguyên nhân: cache tự chế không giới hạn, key là {{String}} chứa timestamp request. Sửa: thay bằng Caffeine {{maximumSize=500_000, expireAfterWrite=5m}}. Kết quả: p99 về 95 ms, CPU GC < 3%, live set ổn định 1.1 GB.

### Trả lời mẫu khi phỏng vấn
"GC tracing hoạt động theo reachability: bắt đầu từ GC root (stack, static, JNI, monitor) đi theo cạnh tham chiếu. Object không có đường đi từ root là rác — nên chu trình không leak. Mark-sweep có hai pha: mark chỉ duyệt object sống (O(live)), sweep quét cả heap (O(heap)). Để chạy concurrent, dùng tri-color marking (trắng/xám/đen) với write barrier. G1 dùng SATB (snapshot-at-the-beginning): ghi giá trị cũ khi ghi đè cạnh, giữ ảnh chụp đầu phiên. Generational GC tận dụng hypothesis 'đa số object chết trẻ': young gen (Eden + 2 Survivor) GC thường xuyên, promote sang old khi tuổi vượt ngưỡng hoặc Survivor đầy. G1 chia heap thành region, dùng remembered set cho cross-region ref, điều chỉnh young size để đạt pause target 200ms. ZGC/Shenandoah làm marking+relocation concurrent, pause < 1ms nhưng tốn CPU và heap hơn."

> Senior tip: Đừng tuning GC bằng cách tăng heap vô hạn — heap lớn làm full GC đắt hơn và che giấu leak. Luôn nhìn live set sau Full GC: nếu tăng đều qua các lần dọn sạch, đó là leak, hãy lấy heap dump tìm retained set thay vì chỉnh flag. Với G1, đừng đặt cứng -Xmn vì nó tắt cơ chế tự điều chỉnh young gen theo pause target.
`,
  exercises: [
    {
      title: 'Mô phỏng mark-and-sweep trên đồ thị object',
      prompt: `Cài đặt {{GcHeap}} mô phỏng một collector mark-and-sweep tối giản.

Mỗi object có {{id}} duy nhất và danh sách {{refs}} trỏ tới object khác. API:
- {{allocate(id)}}: tạo object mới; id trùng thì ném {{IllegalArgumentException}}.
- {{get(id)}}: trả về object hoặc null.
- {{addEdge(from, to)}}: thêm cạnh; nếu một trong hai id chưa tồn tại thì ném {{IllegalArgumentException}}.
- {{mark(roots)}}: **reset toàn bộ mark** rồi đánh dấu mọi object reachable từ {{roots}}. Root không tồn tại thì ném {{IllegalArgumentException}}. Trả về tập id đã đánh dấu ({{TreeSet}} để thứ tự ổn định).
- {{collect(roots)}}: chạy {{mark(roots)}}, xoá mọi object chưa được mark, reset mark của object sống, trả về tập id đã thu hồi.
- {{size()}}: số object còn lại.

Duyệt bằng stack/queue tường minh, không đệ quy, để đồ thị sâu không tràn stack.`,
      starter: `class GcHeap {
    static final class Obj {
        final int id;
        final List<Integer> refs = new ArrayList<>();
        boolean marked;
        Obj(int id) { this.id = id; }
    }

    private final Map<Integer, Obj> objects = new LinkedHashMap<>();

    Obj allocate(int id) {
        throw new UnsupportedOperationException("TODO");
    }

    Obj get(int id) {
        throw new UnsupportedOperationException("TODO");
    }

    void addEdge(int from, int to) {
        throw new UnsupportedOperationException("TODO");
    }

    Set<Integer> mark(Set<Integer> roots) {
        throw new UnsupportedOperationException("TODO");
    }

    Set<Integer> collect(Set<Integer> roots) {
        throw new UnsupportedOperationException("TODO");
    }

    int size() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void throwsIae(Runnable r) {
        try { r.run(); } catch (IllegalArgumentException e) { return; }
        throw new AssertionError("phải ném IllegalArgumentException");
    }
    static GcHeap chain(int n) {
        GcHeap h = new GcHeap();
        for (int i = 1; i <= n; i++) h.allocate(i);
        for (int i = 1; i < n; i++) h.addEdge(i, i + 1);
        return h;
    }
    public static void main(String[] args) {
        check("root giữ cả cây con", () -> {
            GcHeap h = chain(4);
            eq(Set.of(1, 2, 3, 4), h.mark(Set.of(1)));
            eq(Set.of(), h.collect(Set.of(1)));
            eq(4, h.size());
        });
        check("chu trình không có root bị thu hồi", () -> {
            GcHeap h = new GcHeap();
            h.allocate(10); h.allocate(11); h.allocate(12);
            h.addEdge(10, 11); h.addEdge(11, 12); h.addEdge(12, 10);
            eq(Set.of(10, 11, 12), h.collect(Set.of()));
            eq(0, h.size());
            eq(null, h.get(10));
        });
        check("đồ thị chia sẻ: root chỉ giữ nhánh của nó", () -> {
            GcHeap h = new GcHeap();
            h.allocate(1); h.allocate(2); h.allocate(3);
            h.addEdge(1, 2); h.addEdge(1, 3);
            eq(Set.of(), h.collect(Set.of(1)));
            eq(Set.of(1, 3), h.collect(Set.of(2)));
            eq(1, h.size());
        });
        check("mark không xoá, collect mới xoá và reset mark", () -> {
            GcHeap h = chain(3);
            eq(Set.of(1, 2, 3), h.mark(Set.of(1)));
            eq(3, h.size());
            eq(Set.of(), h.collect(Set.of(1)));
            eq(3, h.size());
            eq(Set.of(1), h.collect(Set.of(2)));
            eq(2, h.size());
        });
        check("self-loop reachable vẫn sống, self-loop rác vẫn chết", () -> {
            GcHeap h = new GcHeap();
            h.allocate(7);
            h.addEdge(7, 7);
            eq(Set.of(), h.collect(Set.of(7)));
            eq(1, h.size());
            eq(Set.of(7), h.collect(Set.of()));
            eq(0, h.size());
        });
        check("id trùng, cạnh và root không tồn tại bị từ chối", () -> {
            GcHeap h = new GcHeap();
            h.allocate(1);
            throwsIae(() -> h.allocate(1));
            throwsIae(() -> h.addEdge(1, 2));
            throwsIae(() -> h.mark(Set.of(99)));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class GcHeap {
    static final class Obj {
        final int id;
        final List<Integer> refs = new ArrayList<>();
        boolean marked;
        Obj(int id) { this.id = id; }
    }

    private final Map<Integer, Obj> objects = new LinkedHashMap<>();

    Obj allocate(int id) {
        if (objects.containsKey(id)) throw new IllegalArgumentException("duplicate id " + id);
        Obj o = new Obj(id);
        objects.put(id, o);
        return o;
    }

    Obj get(int id) {
        return objects.get(id);
    }

    void addEdge(int from, int to) {
        Obj a = objects.get(from);
        Obj b = objects.get(to);
        if (a == null || b == null) throw new IllegalArgumentException("unknown object");
        a.refs.add(to);
    }

    Set<Integer> mark(Set<Integer> roots) {
        for (Obj o : objects.values()) o.marked = false;
        Deque<Integer> stack = new ArrayDeque<>();
        for (int root : roots) {
            if (!objects.containsKey(root)) throw new IllegalArgumentException("unknown root " + root);
            stack.push(root);
        }
        Set<Integer> live = new TreeSet<>();
        while (!stack.isEmpty()) {
            Obj o = objects.get(stack.pop());
            if (o.marked) continue;
            o.marked = true;
            live.add(o.id);
            for (int next : o.refs) stack.push(next);
        }
        return live;
    }

    Set<Integer> collect(Set<Integer> roots) {
        mark(roots);
        Set<Integer> freed = new TreeSet<>();
        Iterator<Map.Entry<Integer, Obj>> it = objects.entrySet().iterator();
        while (it.hasNext()) {
            Map.Entry<Integer, Obj> e = it.next();
            if (!e.getValue().marked) {
                freed.add(e.getKey());
                it.remove();
            } else {
                e.getValue().marked = false;
            }
        }
        return freed;
    }

    int size() {
        return objects.size();
    }
}`,
      hints: [
        'Pha mark: reset hết {{marked}} trước, đẩy root vào {{ArrayDeque}}, lặp pop → nếu chưa mark thì mark và đẩy các con.',
        'Pha sweep: dùng {{Iterator}} trên {{entrySet}} và {{it.remove()}} cho object chưa mark; object sống thì gán {{marked = false}} để lần collect sau dùng lại.',
        'Dùng {{TreeSet}} cho tập kết quả để test so sánh ổn định, không phụ thuộc thứ tự duyệt.',
      ],
      explain: `Mark chỉ đi theo cạnh nên chi phí tỉ lệ với **số object sống**, còn sweep phải đi qua **toàn bộ heap** để tìm object chết. Đó là lý do GC tracing không cần đếm reference và xử lý được chu trình: cả cụm 10 → 11 → 12 → 10 không có root thì cả ba đều trắng.

Vài chi tiết dễ sai:
- Không reset mark trước khi mark lại: lần thứ hai sẽ trả về tập rỗng vì mọi object tưởng như đã sống.
- Xoá trong lúc đang for-each {{objects.values()}} sẽ ném {{ConcurrentModificationException}}; phải dùng {{Iterator.remove()}}.
- Đẩy object vào stack mà không kiểm tra {{marked}} có thể làm stack phình to với đồ thị nhiều cạnh, nhưng vẫn đúng. Kiểm tra sớm giúp giảm việc thừa.
- Trong JVM thật, mark và sweep không nhất thiết tách rời: G1 evacuate object sống sang region mới rồi coi cả region cũ là rác, nhờ vậy vừa thu hồi vừa chống phân mảnh.`,
    },
  ],
  check: [
    {
      q: 'Đối tượng nào **không** phải GC root?',
      options: [
        'Một biến local trong stack frame của thread đang chạy',
        'Một static field của class đã được nạp',
        'Một object chỉ được trỏ tới bởi một object khác cũng không reachable',
        'Một tham chiếu JNI từ code native',
      ],
      answer: 2,
      explain: `Root là điểm bắt đầu duyệt: stack, static field, JNI, monitor, thread. Object chỉ được trỏ bởi object không reachable thì bản thân nó cũng không reachable, nên là rác. Đây chính là điểm khác biệt giữa reachability và "có ai đó trỏ tới".`,
    },
    {
      q: 'Hạn chế chính của mark-sweep không compact là gì?',
      options: [
        'Không thu hồi được chu trình',
        'Không thể chạy concurrent',
        'Không xử lý được object lớn',
        'Phân mảnh bộ nhớ: còn nhiều chỗ trống nhưng không đủ khối liền',
      ],
      answer: 3,
      explain: `Sweep để lại các lỗ hổng giữa object sống; theo thời gian free-list bị phân mảnh, cấp phát object lớn có thể thất bại dù tổng dung lượng trống đủ. Mark-sweep xử lý chu trình tốt (khác reference counting). Concurrent hay object lớn là vấn đề riêng, không phải hệ quả bắt buộc của việc thiếu compact.`,
    },
    {
      q: 'Trong tri-color marking, bất biến nào phải giữ để không thu hồi nhầm object còn sống?',
      options: [
        'Object trắng không được trỏ tới object đen',
        'Object đen không được trỏ tới object trắng',
        'Object xám phải luôn nhiều hơn object đen',
        'Mọi object trắng phải được root trỏ tới',
      ],
      answer: 1,
      explain: `Nếu một object đen (đã quét xong) mọc thêm cạnh tới object trắng trong lúc ứng dụng chạy, GC có thể sweep object trắng đó dù nó vừa được tham chiếu. Incremental update (CMS) giữ bất biến này bằng cách tô xám lại object đen bị ghi; SATB (G1) giải quyết theo cách khác — ghi lại giá trị cũ của mọi tham chiếu bị ghi đè để giữ nguyên ảnh chụp đầu phiên, nhờ vậy không đánh mất object nào sống tại thời điểm bắt đầu mark. Các phương án còn lại không phản ánh logic của tri-color marking.`,
    },
    {
      q: 'Object lớn hơn 50% kích thước region trong G1 được gọi là gì?',
      options: ['Humongous object', 'Tenured object', 'TLAB object', 'Phantom object'],
      answer: 0,
      explain: `G1 cấp phát object humongous trong một hoặc nhiều region liên tiếp vì nó không vừa một region. Tenured là object ở old generation nói chung; TLAB là buffer cấp phát theo thread; phantom là loại reference. Humongous allocation có thể gây pause bất thường nếu ứng dụng tạo nhiều mảng lớn.`,
    },
  ],
  related: ['jvm-003', 'jvm-005', 'jvm-012'],
  tags: ['GC', 'mark-and-sweep', 'tri-color', 'G1', 'reachability'],
},
{
  id: 'lesson-jvm-003',
  track: 'jvm',
  order: 3,
  title: 'Class loading và static init: thứ tự khởi tạo, holder idiom và bẫy classloader',
  level: 'senior',
  minutes: 30,
  goals: [
    'Kể đúng các pha loading, linking, initialization và việc gì xảy ra ở mỗi pha',
    'Dự đoán được thứ tự chạy static field/static block khi một class được kích hoạt',
    'Viết singleton bằng holder idiom đúng lazy, thread-safe và giải thích vì sao',
    'Nhận diện lỗi {{ExceptionInInitializerError}}, deadlock khởi tạo và classloader leak',
  ],
  body: `**Tóm tắt:** Class loading trải 3 pha: Loading (đọc bytecode, nạp metadata vào Metaspace), Linking (Verification, Preparation gán giá trị mặc định cho static field, Resolution), Initialization (chạy static field/block theo thứ tự văn bản). Chỉ **active use** (new, static field/method không phải constant, reflection, subclass init) mới kích hoạt initialization. Holder idiom singleton tận dụng lazy class init + initialization lock của JVM: lazy vì Holder chỉ init khi đọc INSTANCE, thread-safe vì JVM bảo vệ <clinit>. Static init ném exception → class bị đánh dấu lỗi, lần sau ném NoClassDefFoundError. Classloader leak xảy ra khi static field/ThreadLocal/timer giữ classloader webapp cũ → Metaspace OOM.

### Một class đi qua ba chặng
Khi lần đầu chạm tới một class, JVM không "chạy code" ngay. Nó đi qua:

1. **Loading**: classloader tìm bytecode (từ đĩa, jar, network), đọc và định nghĩa class: metadata nội bộ của class nằm trong Metaspace, còn object {{java.lang.Class}} đại diện cho nó (thứ bạn lấy bằng {{Foo.class}}) nằm trên heap.
2. **Linking** gồm ba phần:
   - **Verification**: kiểm tra bytecode hợp lệ, không làm hỏng JVM (ví dụ stack không tràn, kiểu đúng).
   - **Preparation**: cấp phát static field và gán **giá trị mặc định** (0, false, null), chưa chạy initializer. Riêng static final constant variable (ví dụ {{static final int MAX = 100}}) thì compiler ghi giá trị vào thuộc tính {{ConstantValue}} trong file class, JVM gán giá trị đó trực tiếp mà không cần chạy code initializer nào.
   - **Resolution**: thay tham chiếu symbolic bằng tham chiếu thật; có thể lười, tới lúc dùng mới làm.
3. **Initialization**: chạy static field initializer và static block theo thứ tự, đây là lúc code của bạn thực sự chạy.

Chỉ bước 3 mới chạy static block. Hiểu điều này giải thích vì sao đọc một hằng số {{static final int}} không kích hoạt class: nó là **constant variable**, được compiler inline ngay vào nơi dùng.

### Khi nào class được khởi tạo?
JVM khởi tạo class khi có **active use**:
- {{new}} một instance;
- gọi hoặc ghi một static field **không phải** constant variable;
- gọi static method;
- dùng reflection {{Class.forName("...")}} (mặc định initialize = true);
- khởi tạo subclass (lớp cha phải xong trước; interface cha chỉ được khởi tạo kèm nếu nó khai báo default method);
- class chứa hàm {{main}} khi JVM khởi động.

Không kích hoạt khởi tạo:
- đọc constant variable đã biết giá trị lúc compile;
- tạo mảng {{new Foo[10]}} (chỉ tạo mảng, chưa tạo Foo);
- {{Foo.class}}, {{instanceof}}, cast;
- khai báo biến kiểu {{Foo}};
- đọc static field hoặc gọi static method qua tên subclass khi field/method đó được khai báo ở superclass, ví dụ {{Child.parentField}}: chỉ class khai báo nó (superclass) được init, subclass thì không.

### Thứ tự bên trong một class
Quy tắc rất ngắn: **lớp cha trước, rồi tới lớp con; trong mỗi class, static field và static block chạy theo thứ tự văn bản từ trên xuống**. Không có chuyện "field trước block" hay ngược lại — compiler gộp tất cả vào một hàm {{<clinit>}} theo đúng thứ tự xuất hiện.

~~~java
class Parent {
    static int A = init("Parent.A");          // (1)
    static { System.out.println("Parent.block"); }  // (2)
    static int init(String s) { System.out.println(s); return 1; }
}
class Child extends Parent {
    static int B = init("Child.B");           // (3) sau khi Parent xong
    static { System.out.println("Child.block"); }   // (4)
}
// new Child() in ra: Parent.A, Parent.block, Child.B, Child.block
~~~

Điều tinh tế: **superclass luôn được khởi tạo trước subclass**, kể cả khi subclass có static field riêng. Nếu class cha ném exception trong static init, subclass không bao giờ được khởi tạo.

### Thread safety và deadlock khởi tạo
JVM dùng **initialization lock** riêng cho từng class. Nhiều thread cùng gọi lần đầu sẽ có một thread chạy {{<clinit>}}, các thread khác block chờ. Vì vậy holder idiom không cần {{synchronized}} thủ công — JVM đã đảm bảo.

Nhưng chính lock này tạo ra deadlock nếu hai class khởi tạo chéo: thread 1 giữ lock của A và chờ B, thread 2 giữ lock của B và chờ A. Lỗi này hiếm nhưng rất khó debug: lock khởi tạo không phải monitor thông thường nên {{jstack}} thường không in "Found one Java-level deadlock", bạn chỉ thấy hai thread đứng yên trong {{<clinit>}} của hai class trỏ chéo nhau. Nguyên tắc: **static initializer phải ngắn, không gọi service, không mở connection, không chờ thread khác**.

### Singleton: holder idiom và những cách sai
Cách tốt nhất trong Java hiện đại:

~~~java
final class AppConfig {
    private AppConfig() { /* đọc config, không I/O nặng */ }

    private static final class Holder {
        static final AppConfig INSTANCE = new AppConfig();
    }

    static AppConfig getInstance() { return Holder.INSTANCE; }
}
~~~

Vì sao **lazy**: {{Holder}} chỉ được khởi tạo khi {{getInstance}} đọc {{Holder.INSTANCE}}, không phải khi {{AppConfig}} được nạp. Vì sao **thread-safe**: JVM đảm bảo {{<clinit>}} của Holder chạy đúng một lần dưới lock.

Các cách khác:
- {{enum}} singleton: ngắn, chống reflection và serialization tốt, nhưng không lazy theo nghĩa "chỉ tạo khi gọi" — enum constant được tạo khi enum class init.
- **Double-checked locking** chỉ đúng khi field là {{volatile}}; thiếu {{volatile}} có thể publish object chưa hoàn thiện do reordering.
- **Eager static final**: đơn giản nhưng khởi tạo ngay khi class được nạp, có thể kéo theo I/O lúc startup.

### Classloader leak: kẻ giết Metaspace
Mỗi classloader giữ một namespace class riêng. Class chỉ có thể unload khi **classloader của nó** không còn reachable. Trong ứng dụng server (Tomcat, OSGi, hot reload), nếu một static field của class do webapp nạp còn bị giữ bởi thread, JDBC driver, ThreadLocal hoặc timer, classloader không unload được. Mỗi lần redeploy lại nạp thêm một bản class, Metaspace tăng tới {{OutOfMemoryError: Metaspace}}.

Cách phòng: dừng thread/timer đúng cách khi shutdown, gọi {{ThreadLocal.remove()}}, deregister driver/listener, và theo dõi số class đã nạp bằng {{jcmd <pid> VM.classloader_stats}} hoặc {{jcmd <pid> GC.class_histogram}}.

### Ví dụ đời thực
Một ứng dụng Spring Boot trên Tomcat 9 redeploy 15 lần/ngày trong 2 tuần. Pod bị {{OutOfMemoryError: Metaspace}} sau 10 ngày. JFR event {{jdk.ClassLoad}} cho thấy số class nạp tăng từ 12k lên 85k. {{jcmd VM.classloader_stats}} phát hiện 14 WebappClassLoader instance, mỗi cái retained 40 MB. Nguyên nhân: một {{ThreadLocal<DBConnection>>}} static trong thư viện chung không gọi {{remove()}} khi request xong, giữ reference tới classloader của webapp cũ. Sửa: thêm {{ServletContextListener.contextDestroyed}} gọi {{ThreadLocal.remove()}}, và config Tomcat {{antiResourceLocking=true}}. Kết quả: redeploy 30 lần/ngày ổn định, Metaspace < 200 MB.

### Trả lời mẫu khi phỏng vấn
"Class loading có 3 pha: Loading (nạp bytecode, metadata vào Metaspace), Linking (verify, preparation gán default cho static, resolution), Initialization (chạy static field/block theo thứ tự văn bản). Chỉ active use mới trigger init: new, static field/method non-constant, reflection, subclass init. Constant variable (static final primitive/String) được inline lúc compile nên không trigger. Thứ tự: superclass trước, trong class theo thứ tự source. JVM dùng initialization lock cho <clinit> nên thread-safe tự động. Holder idiom singleton: private static class Holder { static final INSTANCE = new AppConfig(); }, getInstance() return Holder.INSTANCE. Lazy vì Holder chỉ init khi đọc INSTANCE; thread-safe vì JVM lock. Static init throw exception → class erroneous → lần sau NoClassDefFoundError. Classloader leak: webapp redeploy, static field/ThreadLocal giữ classloader cũ → Metaspace OOM. Fix: cleanup ThreadLocal, deregister driver, listener."

> Senior tip: Đừng bao giờ gọi service, mở DB connection, hay chờ lock trong static initializer — nó gây deadlock khởi tạo hoặc ExceptionInInitializerError biến thành NoClassDefFoundError vĩnh viễn. Nếu cần khởi tạo phức tạp, hãy dùng lazy holder hoặc explicit init method.
`,
  exercises: [
    {
      title: 'Singleton lazy bằng holder idiom',
      prompt: `Hoàn thiện {{AppConfig}} theo **holder idiom**:

- Constructor **private**, mỗi lần chạy tăng biến đếm {{initCount}}.
- {{getInstance()}} trả về cùng một instance duy nhất, tạo lazy ở lần gọi đầu tiên.
- Holder là một static nested class chỉ được khởi tạo khi {{getInstance()}} đọc field của nó.
- Không dùng {{synchronized}} thủ công: JVM đã đảm bảo class initialization chỉ chạy một lần.

Test kiểm tra: trước khi gọi thì {{initCount}} bằng 0; gọi nhiều lần vẫn cùng instance và {{initCount}} bằng 1; constructor là private; nhiều thread gọi đồng thời vẫn chỉ một instance.`,
      starter: `class AppConfig {
    private static int initCount;

    private AppConfig() {
        throw new UnsupportedOperationException("TODO: khởi tạo cấu hình");
    }

    static AppConfig getInstance() {
        throw new UnsupportedOperationException("TODO");
    }

    static int initCount() {
        return initCount;
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    interface Body { void run() throws Exception; }
    static void check(String name, Body r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("lazy: chưa gọi getInstance thì chưa khởi tạo", () -> {
            eq(0, AppConfig.initCount());
        });
        check("cùng instance và chỉ khởi tạo một lần", () -> {
            AppConfig a = AppConfig.getInstance();
            AppConfig b = AppConfig.getInstance();
            if (a == null) throw new AssertionError("instance không được null");
            if (a != b) throw new AssertionError("hai lần gọi phải trả về cùng instance");
            eq(1, AppConfig.initCount());
        });
        check("constructor phải private", () -> {
            int mods = AppConfig.class.getDeclaredConstructor().getModifiers();
            if (!java.lang.reflect.Modifier.isPrivate(mods)) throw new AssertionError("constructor phải private");
        });
        check("nhiều thread gọi đồng thời vẫn một instance", () -> {
            int n = 16;
            ExecutorService pool = Executors.newFixedThreadPool(n);
            CountDownLatch start = new CountDownLatch(1);
            List<Future<AppConfig>> futures = new ArrayList<>();
            for (int i = 0; i < n; i++) {
                futures.add(pool.submit(() -> { start.await(); return AppConfig.getInstance(); }));
            }
            start.countDown();
            AppConfig first = futures.get(0).get(5, TimeUnit.SECONDS);
            for (Future<AppConfig> f : futures) {
                if (f.get(5, TimeUnit.SECONDS) != first) throw new AssertionError("có thread nhận instance khác");
            }
            pool.shutdownNow();
            eq(1, AppConfig.initCount());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class AppConfig {
    private static int initCount;

    private AppConfig() {
        initCount++;
    }

    private static final class Holder {
        static final AppConfig INSTANCE = new AppConfig();
    }

    static AppConfig getInstance() {
        return Holder.INSTANCE;
    }

    static int initCount() {
        return initCount;
    }
}`,
      hints: [
        'Tạo {{private static final class Holder}} với {{static final AppConfig INSTANCE = new AppConfig();}}.',
        '{{getInstance()}} chỉ cần {{return Holder.INSTANCE;}} — lần đầu chạm Holder, JVM khởi tạo nó dưới initialization lock.',
        'Constructor private chỉ tăng {{initCount}}; không được khởi tạo Holder trong constructor hoặc trong static field của AppConfig, vì như vậy sẽ mất tính lazy.',
      ],
      explain: `Holder idiom khai thác đúng ngữ nghĩa **lazy class initialization** của JVM. Class {{AppConfig}} được khởi tạo khi gọi {{initCount()}} hay {{getInstance()}}, nhưng {{Holder}} chỉ được khởi tạo khi lệnh {{Holder.INSTANCE}} chạy lần đầu. Lúc đó JVM dùng initialization lock: một thread tạo instance, các thread khác chờ rồi thấy cùng instance. Không cần {{volatile}}, không cần {{synchronized}}, không có chi phí trên mỗi lần gọi.

Nếu đặt {{static final AppConfig INSTANCE = new AppConfig();}} ngay trong {{AppConfig}}, instance được tạo khi class init — eager, không lazy. Nếu dùng double-checked locking mà quên {{volatile}}, thread khác có thể thấy tham chiếu khác null nhưng object chưa được publish đầy đủ. Enum singleton giải quyết reflection/serialization nhưng không lazy.

Lưu ý production: constructor của singleton không nên làm I/O nặng hoặc gọi service khác. Nếu nó ném exception, lần gọi đầu nhận {{ExceptionInInitializerError}}, các lần sau nhận {{NoClassDefFoundError}}, và class coi như hỏng vĩnh viễn trong classloader đó.`,
    },
    {
      title: 'Tự tạo đúng thứ tự static initialization',
      prompt: `Cho ba class {{Parent}}, {{Child}} (kế thừa {{Parent}}) và {{Solo}}. Hãy viết static field initializer và static block để chúng ghi log vào {{OrderTrace}} đúng thứ tự sau:

- Khi {{Child.CHILD}} được đọc lần đầu: {{Parent.field}}, {{Parent.block}}, {{Child.field}}, {{Child.block}}; {{Parent.PARENT}} trả về 10, {{Child.CHILD}} trả về 20.
- Khi {{Solo.VALUE}} được đọc lần đầu: {{Solo.field}}, {{Solo.block}}; trả về 30.
- Lần đọc thứ hai không chạy lại static init.

Dùng {{OrderTrace.add("...")}} để ghi log. Thứ tự phải là **thứ tự văn bản**: field khai báo trước block thì field chạy trước.`,
      starter: `class OrderTrace {
    private static final List<String> EVENTS = new ArrayList<>();
    static void add(String event) { EVENTS.add(event); }
    static List<String> snapshot() { return new ArrayList<>(EVENTS); }
    static void reset() { EVENTS.clear(); }
}

class Parent {
    static int PARENT = initParent();

    static int initParent() {
        throw new UnsupportedOperationException("TODO");
    }
}

class Child extends Parent {
    static int CHILD = initChild();

    static int initChild() {
        throw new UnsupportedOperationException("TODO");
    }
}

class Solo {
    static int VALUE = initValue();

    static int initValue() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("lớp cha khởi tạo trước, trong mỗi lớp theo thứ tự văn bản", () -> {
            OrderTrace.reset();
            eq(20, Child.CHILD);
            eq(10, Parent.PARENT);
            eq(List.of("Parent.field", "Parent.block", "Child.field", "Child.block"), OrderTrace.snapshot());
        });
        check("class chỉ khởi tạo một lần", () -> {
            OrderTrace.reset();
            eq(20, Child.CHILD);
            eq(List.of(), OrderTrace.snapshot());
        });
        check("lớp độc lập chỉ chạy static init của chính nó", () -> {
            OrderTrace.reset();
            eq(30, Solo.VALUE);
            eq(List.of("Solo.field", "Solo.block"), OrderTrace.snapshot());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class OrderTrace {
    private static final List<String> EVENTS = new ArrayList<>();
    static void add(String event) { EVENTS.add(event); }
    static List<String> snapshot() { return new ArrayList<>(EVENTS); }
    static void reset() { EVENTS.clear(); }
}

class Parent {
    static int PARENT = initParent();

    static int initParent() {
        OrderTrace.add("Parent.field");
        return 10;
    }

    static {
        OrderTrace.add("Parent.block");
    }
}

class Child extends Parent {
    static int CHILD = initChild();

    static int initChild() {
        OrderTrace.add("Child.field");
        return 20;
    }

    static {
        OrderTrace.add("Child.block");
    }
}

class Solo {
    static int VALUE = initValue();

    static int initValue() {
        OrderTrace.add("Solo.field");
        return 30;
    }

    static {
        OrderTrace.add("Solo.block");
    }
}`,
      hints: [
        'Static field initializer và static block chạy theo thứ tự xuất hiện trong source, không phải field trước block.',
        'Khi đọc {{Child.CHILD}} lần đầu, JVM thấy {{Child}} chưa init → init {{Parent}} trước, xong mới init {{Child}}.',
        '{{OrderTrace.add}} gọi trong {{initParent}}/{{initChild}}/{{initValue}}; static block chỉ thêm một dòng add.',
      ],
      explain: `Thứ tự quan sát được là hệ quả trực tiếp của hai quy tắc: **superclass trước subclass**, và **trong một class, mọi static initializer chạy theo thứ tự văn bản**. Compiler gộp field initializer và static block vào một hàm {{<clinit>}} duy nhất, giữ nguyên thứ tự source.

Vì vậy nếu bạn đặt static block **trước** dòng {{static int PARENT}}, log sẽ là {{Parent.block, Parent.field}} và test fail. Nếu khai báo {{Child extends Parent}} nhưng quên rằng đọc {{Child.CHILD}} kích hoạt cả {{Parent}}, bạn sẽ thiếu hai sự kiện đầu.

Test thứ hai kiểm tra tính chất quan trọng nhất: class init chỉ chạy **một lần** trong một classloader. Đọc lại field chỉ là đọc bộ nhớ, không chạy lại static block. Đây cũng là lý do singleton holder an toàn: instance không bị tạo lại.

Trong JVM thật, nếu {{<clinit>}} ném exception, class bị đánh dấu lỗi; lần truy cập sau ném {{NoClassDefFoundError}} chứ không chạy lại. Vì vậy đừng đặt logic có thể ném exception không kiểm soát trong static init.`,
    },
  ],
  check: [
    {
      q: 'Thao tác nào **không** kích hoạt initialization của class {{Foo}}?',
      options: [
        '{{new Foo()}}',
        'Đọc một {{static final int MAX = 100}} của Foo',
        'Gọi một static method của Foo',
        'Khởi tạo một class con của Foo',
      ],
      answer: 1,
      explain: `Nếu {{MAX}} là constant variable (primitive hoặc String, khởi tạo bằng hằng), compiler inline giá trị vào nơi dùng và không cần class. {{new}}, gọi static method và khởi tạo subclass đều là active use, nên kích hoạt init (subclass kéo theo superclass).`,
    },
    {
      q: 'Khi chạy {{new Child()}} lần đầu, thứ tự static init đúng là gì?',
      options: [
        'Child trước, Parent sau',
        'Chỉ Child chạy',
        'Parent trước, Child sau',
        'Không class nào chạy static init',
      ],
      answer: 2,
      explain: `JVM luôn khởi tạo superclass trước subclass. Nếu Parent có static field/block, chúng chạy xong mới tới Child. "Child trước" và "chỉ Child chạy" đều sai vì subclass có thể dùng static state của cha, nên cha phải sẵn sàng trước. "Không class nào chạy" sai vì {{new}} luôn là active use.`,
    },
    {
      q: 'Vì sao holder idiom vừa lazy vừa thread-safe mà không cần {{synchronized}}?',
      options: [
        'Vì JVM khởi tạo class đúng một lần dưới initialization lock, và Holder chỉ được chạm khi gọi getInstance',
        'Vì Holder là private nên không thread nào thấy',
        'Vì static field luôn được tạo lúc JVM start',
        'Vì constructor private tự động đồng bộ',
      ],
      answer: 0,
      explain: `Holder chỉ được khởi tạo khi đọc {{Holder.INSTANCE}}, nên instance không tạo lúc AppConfig init (lazy). JVM đảm bảo {{<clinit>}} chạy đúng một lần và các thread khác chờ, nên không cần synchronized. Private không đảm bảo thread safety; static field không tự tạo lúc JVM start; constructor private không liên quan đồng bộ.`,
    },
    {
      q: 'Static initializer ném RuntimeException ở lần truy cập đầu. Lần truy cập sau nhận gì?',
      options: [
        'Chạy lại static initializer từ đầu',
        'Im lặng bỏ qua và dùng giá trị mặc định',
        '{{StackOverflowError}}',
        '{{NoClassDefFoundError}} vì class đã bị đánh dấu lỗi',
      ],
      answer: 3,
      explain: `Lần đầu JVM bọc lỗi thành {{ExceptionInInitializerError}}. Class bị đánh dấu erroneous; các lần sau không thử lại mà ném {{NoClassDefFoundError}} (thường kèm "Could not initialize class"). Đây là lý do static initializer phải an toàn và không phụ thuộc service chưa sẵn sàng.`,
    },
  ],
  related: ['jvm-014', 'jvm-015', 'jvm-020'],
  tags: ['class loading', 'static init', 'singleton', 'holder idiom', 'classloader'],
},
{
  id: 'lesson-jvm-004',
  track: 'jvm',
  order: 4,
  title: 'Memory leak trong Java: vì sao GC không cứu được và cách lần ra thủ phạm bằng heap dump',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được vì sao Java có GC mà vẫn leak: object còn **reachable** từ GC root nhưng chương trình không bao giờ dùng lại',
    'Nhận diện 5 mẫu leak hay gặp: cache không giới hạn, listener không gỡ, {{ThreadLocal}} trong thread pool, inner class giữ {{this}} ngầm, key đổi {{hashCode}}',
    'Đọc được đáy heap sau GC, so sánh class histogram, lấy heap dump và tìm thủ phạm bằng dominator tree, retained size, path to GC roots',
    'Viết được cache LRU có giới hạn và registry listener trả về handle gỡ đăng ký',
  ],
  body: `**Tóm tắt:** Java có GC nhưng vẫn leak vì object còn reachable từ GC root (static field, ThreadLocal, listener, v.v.) mà chương trình không dùng lại. GC không biết ý định — nó chỉ thấy "còn ai trỏ tới không?". 5 mẫu leak phổ biến: cache không giới hạn, listener không gỡ, ThreadLocal trong thread pool, inner class/lambda giữ this ngầm, key mutable đổi hashCode. Phát hiện leak: xem đáy heap sau GC (live set) tăng đều qua nhiều ngày → so sánh histogram → heap dump → MAT dominator tree + retained size + path to GC roots. Sửa: cache LRU bounded (LinkedHashMap accessOrder + removeEldestEntry), event bus trả Registration handle (CopyOnWriteArrayList), ThreadLocal.remove() trong finally. Weak/Soft reference không phải silver bullet — chúng đổi bug "giữ quá lâu" thành "biến mất bất ngờ".

### Leak trong Java nghĩa là gì
Trong C, leak là vùng nhớ đã {{malloc}} mà không ai {{free}}: không còn con trỏ nào trỏ tới, nhưng bộ nhớ vẫn bị chiếm. Java không có loại leak này, vì GC tự thu hồi mọi object **không còn đường đi từ GC root** (biến local của thread đang chạy, static field, JNI reference, monitor đang bị giữ...). Leak trong Java là kiểu ngược lại: object **vẫn còn đường đi** từ một GC root nên GC buộc phải giữ, nhưng chương trình **không bao giờ dùng lại** nó nữa.

GC không đọc được ý định của bạn. Nó chỉ trả lời câu hỏi "còn ai trỏ tới object này không?". Nếu một {{HashMap}} static còn trỏ tới 2 triệu order đã xử lý xong từ tuần trước, câu trả lời là "có", và 2 triệu order đó sống mãi, kéo theo mọi thứ chúng trỏ tới:

~~~text
GC root: static field OrderCache.MAP
   └── HashMap                 shallow 48 B, retained 1.6 GB
         └── Node[] table      4 194 304 slot
               ├── Node → Order#1 → List<OrderLine> → Product ...
               ├── Node → Order#2 → ...
               └── ... 2 triệu Node, không ai đọc lại
~~~

### Triệu chứng: đáy của heap đi lên
Heap đang dùng của một service bình thường có hình răng cưa: tăng khi cấp phát, rơi xuống sau mỗi lần GC. Thứ cần nhìn là **mức heap ngay sau GC** (đáy răng cưa, còn gọi là live set), không phải đỉnh:

- Service khoẻ: đáy dao động quanh một mức, ví dụ khoảng 600 MB sau mỗi lần GC, suốt nhiều ngày.
- Service leak: đáy tăng đều 600 MB → 900 MB → 1.3 GB theo ngày; GC chạy dày hơn, CPU dành cho GC tăng, p99 tăng; cuối cùng là {{java.lang.OutOfMemoryError: Java heap space}}. Với Parallel GC bạn có thể gặp {{GC overhead limit exceeded}} trước: JVM bỏ cuộc khi hơn 98% thời gian dành cho GC mà thu hồi được dưới 2% heap.

Trong GC log của G1 ({{-Xlog:gc}}), dòng {{Pause Young (Normal) (G1 Evacuation Pause) 1450M->1210M(2048M)}} cho biết heap trước và sau GC. Vẽ con số sau dấu mũi tên theo thời gian là thấy ngay. Lưu ý: một **cache lớn hợp lệ** cũng làm đáy cao, nhưng đáy sẽ **đi ngang** khi cache đầy; leak thì không bao giờ đi ngang.

### Năm mẫu leak gặp nhiều nhất trên production
**1. Cache tự chế không giới hạn.** Một {{Map}} dùng làm cache nhưng chỉ có {{put}}, không có giới hạn kích thước hay thời gian sống. Mỗi key mới (user id, câu query, URL có tham số) thêm một entry. Key có cardinality cao, ví dụ URL chứa {{?ts=1730700000}}, là thảm hoạ: mỗi request là một key mới. Cách chữa: cache có **maxSize** và **TTL** (Caffeine, hoặc {{LinkedHashMap}} với {{removeEldestEntry}} như bài tập 1).

**2. Listener/callback đăng ký mà không gỡ.** Subject sống lâu (event bus singleton) giữ danh sách listener bằng strong reference. Mỗi request tạo một handler rồi {{subscribe}}, nhưng không ai {{unsubscribe}}. Handler giữ request context, context giữ body 200 KB; 1 triệu request là 200 GB tiềm năng. Quy tắc: **ai đăng ký thì người đó gỡ**, và API đăng ký nên trả về một handle có {{close()}} để dùng được với try-with-resources (bài tập 2).

**3. {{ThreadLocal}} trong thread pool.** Mỗi {{Thread}} có một {{ThreadLocalMap}}; key của entry là weak reference tới object {{ThreadLocal}}, còn **value là strong reference**. Thread của Tomcat hay {{ExecutorService}} sống suốt đời ứng dụng, nên value sống theo nếu bạn quên {{remove()}}. Con số thật: mỗi thread giữ một buffer 2 MB, 200 thread Tomcat là 400 MB không bao giờ giải phóng. Tệ hơn cả leak: request sau chạy trên cùng thread có thể đọc nhầm dữ liệu của user trước.

~~~java
CONTEXT.set(userCtx);
try {
    handle(request);
} finally {
    CONTEXT.remove();   // bắt buộc với thread pool, kể cả khi handle ném exception
}
~~~

**4. Inner class (không static) và lambda giữ {{this}} ngầm.** Một inner class không static luôn có field ẩn trỏ tới object bao ngoài. Nếu bạn đưa một instance anonymous class vào nơi sống lâu, ví dụ truyền nó cho {{scheduler.scheduleAtFixedRate}} hoặc đăng ký làm callback toàn cục, thì cả object bao ngoài (có thể là một service đang giữ hàng trăm MB dữ liệu) không được thu hồi. Lambda chỉ bắt {{this}} khi thân lambda dùng field hoặc method instance. Thói quen tốt: nested class mặc định khai báo {{static}}, trừ khi thực sự cần object bao ngoài.

**5. Key có {{hashCode}} thay đổi.** Bạn {{put}} một object mutable làm key vào {{HashMap}}/{{HashSet}}, sau đó sửa field tham gia {{hashCode}}. Entry vẫn nằm ở bucket cũ, còn {{remove(key)}} tìm ở bucket mới nên không thấy: entry kẹt vĩnh viễn. Key phải **immutable** ({{record}}, {{String}}, {{Long}}).

Ngoài ra còn ClassLoader leak khi hot redeploy (static field hoặc thread của bản deploy cũ giữ classloader, kéo theo toàn bộ class đã nạp) và leak tài nguyên ngoài heap (stream, connection không đóng). Hai loại này có cơ chế riêng nhưng cách lần ra giống nhau.

### WeakReference có phải cách chữa?
Weak/Soft reference chỉ hợp với vài trường hợp: canonical map ({{WeakHashMap}} gắn metadata vào object do người khác quản lý vòng đời), hoặc weak listener khi bạn **không kiểm soát** được bên đăng ký. Nhưng chúng đổi bug "giữ quá lâu" thành bug "biến mất bất ngờ": listener bọc weak bị GC thu hồi ngay khi không ai khác giữ lambda, và sự kiện ngừng tới mà không có lỗi nào. Soft reference thì giữ tới khi heap gần đầy, khiến GC chạy nặng đúng lúc tải cao. Cách chữa chuẩn vẫn là **vòng đời rõ ràng**: giới hạn kích thước, TTL, gỡ đăng ký đối xứng, {{try/finally}}.

### Quy trình tìm leak trên môi trường thật
1. **Xác nhận là leak**: nhìn đáy heap sau GC trong vài giờ tới vài ngày (GC log, hoặc metric {{jvm_memory_used_bytes}} của Micrometer với tag {{area=heap}}). Đáy đi lên đều là tín hiệu mạnh.
2. **So sánh class histogram** ở hai thời điểm cách nhau 30 phút: {{jcmd <pid> GC.class_histogram}}. Lệnh này mặc định chỉ đếm object còn sống nên sẽ kích hoạt một full GC (vài trăm ms tới vài giây). Class nào có số instance tăng tuyến tính ({{HashMap$Node}}, {{byte[]}}, class nghiệp vụ như {{OrderDto}}) là nghi phạm.
3. **Lấy heap dump**: {{jcmd <pid> GC.heap_dump /dumps/app.hprof}}. Dump là stop-the-world và file lớn gần bằng heap đang dùng (heap dùng 3 GB thì file khoảng 3 GB), nên lấy trên một pod đã rút khỏi load balancer và ghi vào volume đủ chỗ. Luôn bật sẵn {{-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps}} để có bằng chứng ngay lúc pod chết.
4. **Phân tích bằng Eclipse MAT** (hoặc VisualVM, IntelliJ profiler):
   - **Leak Suspects report**: MAT tự chỉ ra object giữ phần lớn heap.
   - **Dominator tree**: X dominate Y nếu **mọi** đường đi từ GC root tới Y đều phải qua X. Khi X bị thu hồi thì mọi thứ X dominate cũng được thu hồi.
   - **Shallow size** là kích thước của chính object (một {{HashMap}} chỉ khoảng 48 byte); **retained size** là tổng bộ nhớ được giải phóng nếu object đó biến mất (chính cái {{HashMap}} đó có thể retain 1.6 GB). Luôn sắp xếp theo retained size.
   - **Path to GC Roots** (chọn loại trừ weak/soft reference): cho biết chính xác chuỗi field nào giữ object sống, ví dụ {{OrderCache.MAP → table → [12345] → value}}. Đó là dòng code cần sửa.
5. **Leak chậm, khó tái hiện**: dùng JFR với event {{jdk.OldObjectSample}} và dump bằng {{jcmd <pid> JFR.dump filename=leak.jfr path-to-gc-roots=true}}. JFR lấy mẫu các object sống lâu kèm stack trace nơi cấp phát và đường tới GC root, rẻ hơn nhiều so với heap dump nên chạy được ngay trên production.

> Heap dump của production chứa dữ liệu người dùng (token, email, số điện thoại). Coi file {{.hprof}} như dữ liệu nhạy cảm: mã hoá, giới hạn người đọc, xoá sau khi phân tích xong.

### Ví dụ đời thực
Hệ thống đặt hàng trực tuyến peak 30k req/s, heap 6 GB G1GC. Tuần sau deploy, pod restart liên tục do OOM. GC log: live set sau Full GC tăng 2.1 → 2.8 → 3.5 → 4.2 GB mỗi 6 tiếng. {{jcmd GC.class_histogram}}: {{HashMap$Node}} từ 1.2M → 4.5M instance. Heap dump MAT: {{ConcurrentHashMap$Node}} retained 3.8 GB, path {{OrderService.cache → table → Node → OrderDto}}. Nguyên nhân: {{OrderService}} dùng {{ConcurrentHashMap<String, OrderDto>}} cache không TTL, key là {{orderId}} + timestamp request → cardinality vô hạn. Sửa: thay bằng Caffeine {{maximumSize=200_000, expireAfterWrite=10m, recordStats()}}. Kết quả: live set ổn định 1.4 GB, OOM biến mất, p99 180ms → 45ms, cache hit rate 92%.

### Trả lời mẫu khi phỏng vấn
"Java leak khác C: GC chỉ thu hồi object không reachable từ GC root. Leak là object vẫn reachable (static Map, ThreadLocal, listener) nhưng code không bao giờ dùng lại. Triệu chứng: đáy heap sau GC (live set) tăng đều, không đi ngang. Tìm leak: 1) GC log live set, 2) jcmd histogram so sánh, 3) heap dump → MAT dominator tree (retained size), 4) Path to GC Roots trỏ về static field/ThreadLocal/listener. 5 mẫu thường gặp: unbounded cache, listener không unsubscribe, ThreadLocal trong pool (value strong, thread sống lâu), inner class giữ this ngầm, mutable key đổi hashCode. Sửa: bounded cache LRU (LinkedHashMap accessOrder), event bus trả Registration handle (AutoCloseable), ThreadLocal.remove() trong finally. Weak/Soft ref không phải giải pháp — weak listener biến mất im lặng, soft reference ép GC chạy nặng lúc tải cao. Production dùng Caffeine bounded + TTL."

> Senior tip: Đừng tin vào SoftReference làm cache production — nó ép GC chạy nặng đúng lúc hệ thống đang tải cao. Luôn dùng cache có maxSize + TTL (Caffeine). Khi review code, thấy addListener mà không có removeListener trong cùng vòng đời là leak chắc chắn. Heap dump hprof chứa dữ liệu nhạy cảm (token, PII) — phải mã hoá và xoá sau khi xong.
`,
  exercises: [
    {
      title: 'Cache LRU có giới hạn bằng LinkedHashMap',
      prompt: `Một service dùng {{HashMap}} làm cache và heap tăng mãi. Hãy viết {{BoundedCache<K, V>}} giữ **tối đa** {{maxSize}} entry, đuổi entry **ít được dùng gần đây nhất** (LRU) khi vượt giới hạn.

Yêu cầu:
- Constructor: {{maxSize < 1}} thì ném {{IllegalArgumentException}}.
- {{put(key, value)}}: thêm hoặc cập nhật. Nếu sau khi thêm số entry vượt {{maxSize}} thì xoá entry cũ nhất và tăng bộ đếm {{evictions}}. Cập nhật key đã có không đuổi ai.
- {{get(key)}}: trả value hoặc null; nếu có thì entry đó trở thành **mới dùng nhất**.
- {{size()}}, {{evictions()}}.
- {{keysEldestFirst()}}: danh sách key theo thứ tự từ cũ nhất (sắp bị đuổi) tới mới dùng nhất. Không được làm thay đổi thứ tự.

Gợi ý cơ chế: {{new LinkedHashMap<>(16, 0.75f, true)}} (tham số thứ ba {{accessOrder = true}}) và override {{removeEldestEntry}}.`,
      starter: `class BoundedCache<K, V> {
    private final int maxSize;
    private final LinkedHashMap<K, V> map;
    private long evictions;

    BoundedCache(int maxSize) {
        // TODO: kiểm tra maxSize, tạo LinkedHashMap accessOrder = true và override removeEldestEntry
        throw new UnsupportedOperationException("TODO");
    }

    V get(K key) {
        throw new UnsupportedOperationException("TODO");
    }

    void put(K key, V value) {
        throw new UnsupportedOperationException("TODO");
    }

    int size() {
        throw new UnsupportedOperationException("TODO");
    }

    long evictions() {
        throw new UnsupportedOperationException("TODO");
    }

    List<K> keysEldestFirst() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("vượt maxSize thì đuổi entry cũ nhất", () -> {
            BoundedCache<String, Integer> c = new BoundedCache<>(3);
            c.put("a", 1); c.put("b", 2); c.put("c", 3); c.put("d", 4);
            eq(3, c.size());
            eq(1L, c.evictions());
            eq(List.of("b", "c", "d"), c.keysEldestFirst());
            eq(null, c.get("a"));
        });
        check("get làm mới thứ tự: LRU chứ không phải FIFO", () -> {
            BoundedCache<String, Integer> c = new BoundedCache<>(3);
            c.put("a", 1); c.put("b", 2); c.put("c", 3);
            eq(1, c.get("a"));
            c.put("d", 4);
            eq(List.of("c", "a", "d"), c.keysEldestFirst());
            eq(null, c.get("b"));
        });
        check("put key đã có: cập nhật value, không đuổi ai", () -> {
            BoundedCache<String, Integer> c = new BoundedCache<>(2);
            c.put("a", 1); c.put("b", 2); c.put("a", 10);
            eq(2, c.size());
            eq(0L, c.evictions());
            eq(List.of("b", "a"), c.keysEldestFirst());
            eq(10, c.get("a"));
        });
        check("10 000 key khác nhau chỉ giữ 100 entry", () -> {
            BoundedCache<Integer, String> c = new BoundedCache<>(100);
            for (int i = 0; i < 10_000; i++) c.put(i, "v" + i);
            eq(100, c.size());
            eq(9_900L, c.evictions());
            eq(9_900, c.keysEldestFirst().get(0));
            eq("v9999", c.get(9_999));
        });
        check("keysEldestFirst không làm đổi thứ tự", () -> {
            BoundedCache<String, Integer> c = new BoundedCache<>(2);
            c.put("x", 1); c.put("y", 2);
            c.keysEldestFirst(); c.keysEldestFirst();
            c.put("z", 3);
            eq(List.of("y", "z"), c.keysEldestFirst());
        });
        check("maxSize < 1 ném IllegalArgumentException", () -> {
            try {
                new BoundedCache<String, String>(0);
                throw new AssertionError("không ném exception");
            } catch (IllegalArgumentException expected) { }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class BoundedCache<K, V> {
    private final int maxSize;
    private final LinkedHashMap<K, V> map;
    private long evictions;

    BoundedCache(int maxSize) {
        if (maxSize < 1) throw new IllegalArgumentException("maxSize must be >= 1: " + maxSize);
        this.maxSize = maxSize;
        final int cap = maxSize;
        // accessOrder = true: get/put đưa entry về cuối, entry đầu là ít dùng gần đây nhất
        this.map = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                boolean evict = size() > cap;   // gọi sau mỗi lần put thêm entry mới
                if (evict) evictions++;
                return evict;
            }
        };
    }

    V get(K key) {
        return map.get(key);
    }

    void put(K key, V value) {
        map.put(key, value);
    }

    int size() {
        return map.size();
    }

    long evictions() {
        return evictions;
    }

    List<K> keysEldestFirst() {
        return new ArrayList<>(map.keySet());   // duyệt keySet không tính là access
    }
}`,
      hints: [
        'Constructor ba tham số {{LinkedHashMap(initialCapacity, loadFactor, accessOrder)}} với {{accessOrder = true}} giữ thứ tự theo lần truy cập gần nhất: entry đầu danh sách là entry ít dùng gần đây nhất.',
        '{{removeEldestEntry(eldest)}} được {{put}} gọi sau khi thêm entry; trả về true thì map tự xoá entry đầu. So sánh {{size() > maxSize}} và tăng {{evictions}} ngay trong đó.',
        'Dùng anonymous subclass {{new LinkedHashMap<>(16, 0.75f, true) ...}}; copy {{maxSize}} vào một biến local final để dùng trong anonymous class. {{keysEldestFirst}} trả {{new ArrayList<>(map.keySet())}}.',
      ],
      explain: `{{LinkedHashMap}} là {{HashMap}} có thêm một danh sách liên kết đôi chạy qua mọi entry. Với {{accessOrder = true}}, mỗi {{get}} hoặc {{put}} vào key đã có sẽ chuyển entry đó về **cuối** danh sách, nên **đầu** danh sách luôn là entry lâu nhất chưa được dùng. Sau mỗi lần thêm entry mới, {{put}} gọi hook {{removeEldestEntry(eldest)}}; trả về true thì map xoá entry đầu. Tất cả đều O(1), không cần tự quản lý danh sách.

Lỗi hay gặp:
- Dùng constructor mặc định ({{accessOrder = false}}): map giữ thứ tự **chèn**, thành cache FIFO. Test "get làm mới thứ tự" và "put key đã có" sẽ fail vì entry vừa đọc vẫn bị đuổi.
- Đếm eviction ngoài {{removeEldestEntry}} bằng cách so size trước/sau {{put}}: dễ sai khi put key đã có.
- Duyệt bằng {{map.get}} trong {{keysEldestFirst}}: mỗi {{get}} đổi thứ tự, kết quả sai và còn làm hỏng thứ tự LRU.
- {{LinkedHashMap}} **không thread-safe**; ở chế độ access order, ngay cả {{get}} cũng là thao tác ghi (sửa danh sách liên kết). Dùng chung giữa nhiều thread phải bọc {{synchronized}} hoặc dùng Caffeine.

Trên production, bạn nên dùng Caffeine ({{maximumSize}}, {{expireAfterWrite}}, thống kê hit rate) thay vì tự viết. Nhưng hiểu cơ chế này giúp bạn giải thích vì sao một cache **có giới hạn** chặn được leak: đáy heap sẽ đi ngang ở mức khoảng maxSize × kích thước entry.`,
    },
    {
      title: 'Event bus có handle gỡ đăng ký',
      prompt: `Leak do listener không gỡ rất phổ biến. Hãy viết {{EventBus}} mà **mỗi lần đăng ký trả về một {{Registration}}**; gọi {{close()}} trên handle đó sẽ gỡ đúng lần đăng ký ấy.

Yêu cầu:
- {{subscribe(listener)}}: listener null thì ném {{NullPointerException}}. Trả về {{Registration}}.
- {{Registration.close()}}: gỡ **đúng** lần đăng ký đã tạo ra nó. Gọi nhiều lần vẫn an toàn và không gỡ nhầm lần đăng ký khác, kể cả khi cùng một listener được đăng ký hai lần.
- {{publish(event)}}: gọi mọi listener theo thứ tự đăng ký, trả về số listener đã được gọi.
- Listener được phép tự {{close()}} chính mình (hoặc đăng ký thêm) **trong lúc** {{publish}} đang chạy, mà không gây {{ConcurrentModificationException}} và không làm listener khác bị bỏ qua.
- {{listenerCount()}}: số lần đăng ký còn hiệu lực.

{{Registration}} kế thừa {{AutoCloseable}} nhưng {{close()}} không ném checked exception, nên dùng được trong try-with-resources.`,
      starter: `interface Registration extends AutoCloseable {
    @Override
    void close();   // không ném checked exception; gọi nhiều lần vẫn an toàn
}

class EventBus {
    Registration subscribe(Consumer<String> listener) {
        throw new UnsupportedOperationException("TODO");
    }

    int publish(String event) {
        throw new UnsupportedOperationException("TODO");
    }

    int listenerCount() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("publish gửi tới mọi listener theo thứ tự", () -> {
            EventBus bus = new EventBus();
            List<String> log = new ArrayList<>();
            bus.subscribe(e -> log.add("A:" + e));
            bus.subscribe(e -> log.add("B:" + e));
            eq(2, bus.publish("order-1"));
            eq(List.of("A:order-1", "B:order-1"), log);
        });
        check("close gỡ đăng ký: listener không nhận event nữa", () -> {
            EventBus bus = new EventBus();
            List<String> got = new ArrayList<>();
            Registration r = bus.subscribe(got::add);
            eq(1, bus.listenerCount());
            r.close();
            eq(0, bus.listenerCount());
            eq(0, bus.publish("x"));
            eq(List.of(), got);
        });
        check("close hai lần không gỡ nhầm đăng ký khác của cùng listener", () -> {
            EventBus bus = new EventBus();
            List<String> got = new ArrayList<>();
            Consumer<String> same = got::add;
            Registration r1 = bus.subscribe(same);
            Registration r2 = bus.subscribe(same);
            eq(2, bus.listenerCount());
            r1.close();
            r1.close();
            eq(1, bus.listenerCount());
            eq(1, bus.publish("y"));
            eq(List.of("y"), got);
            r2.close();
            eq(0, bus.listenerCount());
        });
        check("try-with-resources tự gỡ đăng ký", () -> {
            EventBus bus = new EventBus();
            try (Registration r = bus.subscribe(e -> { })) {
                eq(1, bus.listenerCount());
            }
            eq(0, bus.listenerCount());
        });
        check("listener tự gỡ mình trong lúc publish vẫn an toàn", () -> {
            EventBus bus = new EventBus();
            List<String> log = new ArrayList<>();
            Registration[] self = new Registration[1];
            self[0] = bus.subscribe(e -> { log.add("once:" + e); self[0].close(); });
            bus.subscribe(e -> log.add("always:" + e));
            eq(2, bus.publish("a"));
            eq(1, bus.publish("b"));
            eq(List.of("once:a", "always:a", "always:b"), log);
        });
        check("1000 handler ngắn hạn đăng ký rồi gỡ: không sót lại", () -> {
            EventBus bus = new EventBus();
            Registration keep = bus.subscribe(e -> { });
            for (int i = 0; i < 1000; i++) {
                try (Registration r = bus.subscribe(e -> { })) {
                    eq(2, bus.publish("req-" + i));
                }
            }
            eq(1, bus.listenerCount());
            keep.close();
            eq(0, bus.listenerCount());
        });
        check("subscribe(null) ném NullPointerException", () -> {
            try {
                new EventBus().subscribe(null);
                throw new AssertionError("không ném exception");
            } catch (NullPointerException expected) { }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `interface Registration extends AutoCloseable {
    @Override
    void close();   // không ném checked exception; gọi nhiều lần vẫn an toàn
}

class EventBus {
    // Mỗi lần đăng ký là một object riêng: equals theo identity, nên remove gỡ đúng lần đăng ký đó
    private static final class Subscription {
        final Consumer<String> listener;
        Subscription(Consumer<String> listener) { this.listener = listener; }
    }

    // Copy-on-write: publish duyệt trên snapshot, listener được sửa danh sách trong lúc duyệt
    private final List<Subscription> subs = new CopyOnWriteArrayList<>();

    Registration subscribe(Consumer<String> listener) {
        Objects.requireNonNull(listener, "listener");
        Subscription sub = new Subscription(listener);
        subs.add(sub);
        return () -> subs.remove(sub);   // lần close thứ hai: remove trả false, không ảnh hưởng ai
    }

    int publish(String event) {
        int delivered = 0;
        for (Subscription s : subs) {
            s.listener.accept(event);
            delivered++;
        }
        return delivered;
    }

    int listenerCount() {
        return subs.size();
    }
}`,
      hints: [
        'Đừng lưu thẳng {{Consumer}} vào list rồi {{remove(listener)}}: cùng một listener đăng ký hai lần thì close hai lần sẽ gỡ cả hai. Bọc mỗi lần đăng ký trong một object riêng.',
        '{{Registration}} là functional interface (chỉ có {{close()}}), nên có thể trả về lambda {{() -> subs.remove(sub)}}. {{remove}} một object không còn trong list chỉ trả false, tự nhiên idempotent.',
        'Dùng {{CopyOnWriteArrayList}}: iterator duyệt trên snapshot, nên listener tự gỡ mình trong lúc publish không gây {{ConcurrentModificationException}} và không làm listener sau bị bỏ qua.',
      ],
      explain: `Ba quyết định thiết kế làm nên một event bus không leak:

1. **Trả về handle thay vì bắt người gọi giữ listener để gỡ.** API kiểu {{unsubscribe(listener)}} buộc người gọi giữ đúng instance lambda đã đăng ký; viết {{bus.unsubscribe(e -> log(e))}} tạo lambda mới nên không gỡ được gì, và leak bắt đầu từ đó. Handle {{Registration}} kế thừa {{AutoCloseable}} cho phép try-with-resources, hoặc gắn vào vòng đời bean (ví dụ gọi {{close()}} trong {{@PreDestroy}}).
2. **Mỗi lần đăng ký là một object riêng.** {{Subscription}} không override {{equals}}, nên {{remove(sub)}} so sánh identity và chỉ gỡ đúng phần tử đó. Close lần hai thì {{remove}} không tìm thấy và trả false: idempotent mà không cần cờ.
3. **{{CopyOnWriteArrayList}}.** Mỗi lần ghi tạo mảng mới; iterator duyệt mảng cũ. Với {{ArrayList}}, listener tự gỡ mình khi đang duyệt sẽ hoặc ném {{ConcurrentModificationException}}, hoặc (khi phần tử bị xoá làm size bằng cursor) **âm thầm bỏ qua** listener kế tiếp. Test "tự gỡ trong lúc publish" bắt đúng lỗi thứ hai. Đánh đổi: mỗi lần subscribe/close là O(n) copy, phù hợp khi đọc (publish) nhiều hơn ghi rất nhiều, đúng với listener registry. Nó cũng an toàn khi nhiều thread publish cùng lúc.

Đây chính là pattern của Spring {{ApplicationEventMulticaster}}, Micrometer, Reactor ({{Disposable}}): đăng ký trả về thứ có thể huỷ. Khi review code, thấy {{addListener}} mà không thấy {{removeListener}} tương ứng trong cùng vòng đời là dấu hiệu leak.`,
    },
  ],
  check: [
    {
      q: 'Trong MAT, một {{HashMap}} có shallow size 48 B nhưng retained size 1.6 GB. Điều này có nghĩa là gì?',
      options: [
        'MAT tính sai vì HashMap không thể lớn như vậy',
        'Nếu HashMap đó không còn reachable, khoảng 1.6 GB object chỉ được giữ qua nó sẽ được giải phóng',
        'HashMap chiếm 1.6 GB vì mảng table của nó quá lớn',
        'Đó là bộ nhớ native, không thuộc heap',
      ],
      answer: 1,
      explain: `Shallow size là kích thước của chính object HashMap (vài field). Retained size là tổng các object mà HashMap **dominate**: mọi đường từ GC root tới chúng đều đi qua HashMap, nên khi nó biến mất chúng cũng được thu hồi. MAT không tính sai; mảng {{table}} chỉ là một phần nhỏ của con số đó (phần lớn là key/value); và đây là object trên heap, không phải bộ nhớ native.`,
    },
    {
      q: 'Vì sao {{ThreadLocal}} gây leak trong thread pool dù key của {{ThreadLocalMap}} là weak reference?',
      options: [
        'Vì ThreadLocal lưu dữ liệu trong static field của class ThreadLocal',
        'Vì GC không quét ThreadLocalMap',
        'Vì weak reference chỉ bị clear khi full GC',
        'Vì value là strong reference và thread của pool sống suốt đời ứng dụng nếu không gọi remove()',
      ],
      answer: 3,
      explain: `Map nằm trong chính object {{Thread}}; key weak nhưng **value strong**. Thread của pool không bao giờ chết, nên value sống mãi nếu không {{remove()}} (stale entry chỉ được dọn dần khi map được thao tác tiếp, không đảm bảo). Dữ liệu không nằm trong static field của {{ThreadLocal}}; GC vẫn quét map như mọi object; weak reference bị clear ở bất kỳ lần GC nào thu gom vùng chứa referent, không chỉ full GC.`,
    },
    {
      q: 'Dấu hiệu nào trên biểu đồ heap cho thấy rõ nhất là có memory leak?',
      options: [
        'Mức heap ngay sau mỗi lần GC tăng đều qua nhiều giờ và không đi ngang',
        'Đỉnh heap chạm 90% trước mỗi lần GC',
        'Heap có hình răng cưa',
        'Minor GC chạy vài lần mỗi giây',
      ],
      answer: 0,
      explain: `Mức sau GC chính là live set; nếu nó tăng mãi thì có object còn reachable mà không được thả. Đỉnh 90% trước GC là bình thường: GC chạy khi vùng đầy. Răng cưa là hình dạng của mọi ứng dụng khoẻ. Minor GC dày chỉ cho biết allocation rate cao, chưa phải leak.`,
    },
  ],
  related: ['jvm-005', 'jvm-013', 'jvm-014'],
  tags: ['memory leak', 'heap dump', 'MAT', 'dominator tree', 'LRU', 'listener', 'ThreadLocal'],
},
{
  id: 'lesson-jvm-005',
  track: 'jvm',
  order: 5,
  title: 'Bộ nhớ JVM trong container: vì sao pod bị OOMKilled khi heap mới dùng 60%',
  level: 'senior',
  minutes: 35,
  goals: [
    'Kể được những vùng cộng lại thành bộ nhớ thật của tiến trình Java: heap, metaspace, thread stack, direct buffer, code cache, cấu trúc GC, malloc',
    'Giải thích JVM đọc memory limit của cgroup thế nào và {{-XX:MaxRAMPercentage}} tính heap ra sao',
    'Dùng Native Memory Tracking ({{-XX:NativeMemoryTracking=summary}}, {{jcmd <pid> VM.native_memory summary}}) để biết bộ nhớ ngoài heap đi đâu',
    'Lập ngân sách bộ nhớ cho một Pod và tính heap tối đa an toàn',
  ],
  body: `### Hai kiểu "hết bộ nhớ" khác nhau hoàn toàn
| | OutOfMemoryError | OOMKilled |
|---|---|---|
| Ai phát hiện | JVM: không cấp phát được trong heap, metaspace hoặc direct memory | Kernel Linux: bộ nhớ của cgroup vượt limit của container |
| Biểu hiện | Exception trong log, có thể có heap dump | Tiến trình nhận {{SIGKILL}}, exit code 137, {{kubectl describe pod}} ghi {{Reason: OOMKilled}} |
| Log Java | Có stack trace | Không có gì: không shutdown hook, không heap dump |
| Nguyên nhân hay gặp | Heap quá nhỏ hoặc leak | Tổng bộ nhớ (heap + phần ngoài heap) vượt limit |

Điểm mấu chốt: **kernel không biết {{-Xmx}} là gì**. Nó chỉ đếm số trang bộ nhớ thật mà các tiến trình trong cgroup đang chiếm (chủ yếu là RSS, Resident Set Size). Heap chỉ là một phần của RSS. Một pod limit 2 GiB với {{-Xmx1800m}} có thể chết dù heap mới dùng 60%, vì phần ngoài heap đã ăn hết chỗ còn lại.

### Bộ nhớ của một tiến trình Java gồm những gì
| Vùng | Cấu hình | Mặc định / con số điển hình |
|---|---|---|
| **Heap** | {{-Xmx}} hoặc {{-XX:MaxRAMPercentage}} | 25% memory limit nếu không đặt gì |
| **Metaspace** | {{-XX:MaxMetaspaceSize}} | Không giới hạn; app Spring Boot cỡ vừa dùng khoảng 100–250 MB |
| **Thread stack** | {{-Xss}} | 1 MB mỗi thread trên Linux x64; 300 thread là tới 300 MB |
| **Direct buffer** | {{-XX:MaxDirectMemorySize}} | Không đặt thì bằng heap tối đa; Netty, NIO, Kafka client dùng nhiều |
| **Code cache** | {{-XX:ReservedCodeCacheSize}} | 240 MB khi bật tiered compilation (thực dùng thường 50–100 MB) |
| **Cấu trúc GC** | Tuỳ collector | G1: remembered set, card table, mark bitmap; vài % tới hơn 10% heap |
| **Malloc, thư viện native** | {{MALLOC_ARENA_MAX}} | glibc tạo nhiều arena (mỗi arena tới 64 MB địa chỉ) khi nhiều thread cấp phát; JNI, zlib, SSL |

Phải phân biệt **reserved** và **committed**. JVM **reserve** những dải địa chỉ ảo lớn (ví dụ 1 GB cho compressed class space, 240 MB cho code cache) nhưng chỉ **commit** phần đang dùng, và kernel chỉ cấp RAM thật khi trang được chạm vào lần đầu. Vì vậy con số reserved khổng lồ không làm pod chết; con số committed (và trang thật sự được chạm) mới đáng lo. Thread stack cũng vậy: 1 MB là reserve, phần lớn thread chỉ chạm vài chục tới vài trăm KB, nhưng thread đệ quy sâu hoặc framework có stack dày sẽ chạm nhiều hơn.

### JVM nhìn thấy container thế nào
Từ JDK 10 (và 8u191), {{-XX:+UseContainerSupport}} bật mặc định: JVM đọc memory limit và CPU quota từ cgroup thay vì RAM và số core của cả node. Hỗ trợ cgroup v2 có từ JDK 15 (backport sang 11.0.16 và 8u372); JDK 17 và 21 đọc được cả v1 và v2. Kiểm tra nhanh trong container:

~~~bash
java -XX:+PrintFlagsFinal -version | grep -E "MaxHeapSize|MaxRAMPercentage"
java -Xlog:os+container=info -version   # in ra memory limit, CPU quota JVM đọc được
~~~

Khi không đặt {{-Xmx}}, heap tối đa bằng {{MaxRAMPercentage}} nhân memory limit, mặc định **25%**. Pod limit 2 GiB thì heap chỉ 512 MB và 75% còn lại bỏ phí; đây là lý do nhiều team thấy GC chạy liên tục dù pod "còn nhiều RAM". Ngược lại, {{-Xmx2g}} cho pod limit 2 GiB gần như chắc chắn bị OOMKilled khi tải lên, vì phần ngoài heap không còn chỗ.

Ba flag dễ nhầm:
- {{-XX:MaxRAMPercentage=70}}: phần trăm limit dùng làm heap tối đa. Đây là flag bạn cần.
- {{-XX:InitialRAMPercentage}}: heap ban đầu (tương đương {{-Xms}} theo phần trăm). Đặt bằng max nếu muốn tránh heap co giãn lúc chạy.
- {{-XX:MinRAMPercentage}}: **không** phải heap tối thiểu. Nó là phần trăm dùng khi bộ nhớ rất nhỏ (khoảng dưới 250 MB). Nhiều người đặt flag này tưởng là min heap.

Nếu có cả {{-Xmx}} lẫn {{MaxRAMPercentage}} thì {{-Xmx}} thắng. Nên chọn một kiểu và thống nhất; dùng phần trăm tiện hơn vì đổi limit của pod không phải sửa flag.

### Native Memory Tracking: phần ngoài heap đi đâu
NMT phải bật lúc khởi động (không bật được khi đang chạy). Chế độ {{summary}} tốn ít, {{detail}} tốn nhiều hơn; tài liệu Oracle nêu overhead khoảng 5–10% hiệu năng, nên thường bật trên một pod để điều tra:

~~~bash
java -XX:NativeMemoryTracking=summary -XX:MaxRAMPercentage=70 -jar app.jar
jcmd 1 VM.native_memory summary          # ảnh chụp hiện tại (PID 1 trong container)
jcmd 1 VM.native_memory baseline         # chụp mốc
jcmd 1 VM.native_memory summary.diff     # vài giờ sau: vùng nào tăng so với mốc?
~~~

Output có dạng từng nhóm với reserved và committed, ví dụ {{Java Heap (reserved=1433600KB, committed=1433600KB)}}, {{Class (reserved=1105920KB, committed=81920KB)}}, rồi {{Thread}}, {{Code}}, {{GC}}, {{Internal}}, {{Other}}... Đọc cột **committed** và hướng tăng:
- {{Thread}} tăng đều: thread leak (pool không giới hạn, mỗi request tạo thread mới). Số thread hiện ngay trong mục này.
- {{Class}} tăng đều: sinh class động không dừng (proxy, script engine, Groovy).
- {{Other}} tăng: thường là direct buffer, vì trên JDK 17 bộ nhớ cấp qua {{Unsafe.allocateMemory}} được tính vào nhóm này.

NMT **chỉ** theo dõi bộ nhớ do JVM cấp phát. Malloc của thư viện native bên thứ ba (JNI, một số driver) không xuất hiện. Nếu RSS (đo bằng {{ps -o rss}} hoặc metric {{container_memory_working_set_bytes}}) lớn hơn tổng committed của NMT nhiều trăm MB, hãy nghi glibc arena hoặc thư viện native, thử {{MALLOC_ARENA_MAX=2}} hoặc đổi allocator (jemalloc). Lưu ý {{jcmd}} cần image có JDK (không chỉ JRE) và chạy cùng user với tiến trình Java.

### Lập ngân sách bộ nhớ cho Pod
Ví dụ: service Spring Boot, pod limit **2048 MB**, 200 thread (Tomcat + các pool), stack 1 MB, direct buffer 128 MB, metaspace 192 MB, code cache 240 MB:

~~~text
headroom 10%    = ceil(2048 * 10%)     = 205 MB   (cấu trúc GC, malloc, sai số)
thread stack    = 200 * 1024 KB        = 200 MB
direct buffer                          = 128 MB
metaspace                              = 192 MB
code cache                             = 240 MB
------------------------------------------------------
heap tối đa     = 2048 - 205 - 760     = 1083 MB  (khoảng 52.8% limit)
~~~

Ví dụ này cố ý tính stack và code cache theo mức reserve (trường hợp xấu nhất). Thực tế nhiều team đặt {{MaxRAMPercentage}} 65–75% sau khi đo bằng NMT trên tải thật; con số đúng là con số **bạn đã đo**, không phải con số chép từ blog. Nguyên tắc đi kèm:

- Đặt {{requests.memory}} bằng {{limits.memory}} để pod có QoS Guaranteed về bộ nhớ, ít bị evict khi node thiếu RAM.
- Giới hạn tường minh những vùng mặc định không có trần: {{-XX:MaxMetaspaceSize}}, {{-XX:MaxDirectMemorySize}}, kích thước các thread pool. Khi vượt, bạn nhận một {{OutOfMemoryError}} có ghi tên vùng (rõ ràng, có log) thay vì một cú {{SIGKILL}} không lời giải thích.
- Bật {{-XX:+ExitOnOutOfMemoryError}} để pod restart sạch khi OOM thay vì chạy tiếp trong trạng thái hỏng, kèm {{-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps}} trên một volume.
- Theo dõi cả heap (Micrometer) **và** working set của container; cảnh báo khi working set vượt khoảng 90% limit.

> Senior tip: khi pod bị OOMKilled mà heap chỉ 60%, đừng phản xạ tăng {{-Xmx}}: đó là hướng làm tệ hơn. Bật NMT trên một pod, so {{summary.diff}} sau vài giờ, xác định vùng nào phình (thường là thread, direct buffer hoặc malloc arena), rồi mới quyết định giảm heap, đặt trần cho vùng đó hay tăng limit.

### Liên hệ phỏng vấn
Câu kinh điển: "Pod Java bị OOMKilled nhưng heap chỉ dùng 60%, bạn điều tra thế nào?". Trả lời tốt đi theo thứ tự: phân biệt OOMKilled (kernel, exit 137) với {{OutOfMemoryError}} (JVM) → liệt kê các vùng ngoài heap → bật NMT, so baseline với diff, đối chiếu với RSS → đưa ra ngân sách cụ thể (heap khoảng 60–75% limit, đặt trần cho metaspace, direct memory, số thread) kèm cảnh báo. Bài tập dưới đây bắt bạn viết đúng phép tính ngân sách đó để có số liệu khi trả lời.`,
  exercises: [
    {
      title: 'Tính heap tối đa an toàn cho Pod',
      prompt: `Viết {{MemoryBudget}} với hai hàm static:

**{{plan(podLimitMb, threads, stackKb, directMb, metaspaceMb, codeCacheMb)}}** trả về heap tối đa (MB) an toàn:
- Kiểm tra tham số: {{podLimitMb > 0}}, {{stackKb > 0}}, các tham số còn lại {{>= 0}}; sai thì ném {{IllegalArgumentException}}.
- {{headroom}} = 10% limit, **làm tròn lên** (pod 1001 MB → 101 MB).
- {{stackMb}} = {{threads × stackKb / 1024}}, **làm tròn lên** (3 thread × 512 KB = 1.5 MB → 2 MB). Tính bằng {{long}} để không tràn số.
- {{heap = podLimitMb - headroom - stackMb - directMb - metaspaceMb - codeCacheMb}}.
- Nếu {{heap < MIN_HEAP_MB}} (64) thì ném {{IllegalStateException}}: pod không đủ bộ nhớ cho cấu hình này.

**{{percentage(podLimitMb, heapMb)}}** trả về giá trị nên đặt cho {{-XX:MaxRAMPercentage}}: {{heapMb / podLimitMb × 100}}, **làm tròn xuống** 1 chữ số thập phân (1083 / 2048 = 52.88% → 52.8). Yêu cầu {{podLimitMb > 0}} và {{0 < heapMb <= podLimitMb}}, sai thì ném {{IllegalArgumentException}}.

Ví dụ trong bài: {{plan(2048, 200, 1024, 128, 192, 240)}} = 1083.`,
      starter: `class MemoryBudget {
    static final int MIN_HEAP_MB = 64;

    static int plan(int podLimitMb, int threads, int stackKb, int directMb, int metaspaceMb, int codeCacheMb) {
        throw new UnsupportedOperationException("TODO");
    }

    static double percentage(int podLimitMb, int heapMb) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> type, Runnable r) {
        try {
            r.run();
        } catch (Throwable t) {
            if (type.isInstance(t)) return;
            throw new AssertionError("expected " + type.getSimpleName() + " got " + t);
        }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing was thrown");
    }
    public static void main(String[] args) {
        check("ví dụ trong bài: pod 2048 MB cho heap 1083 MB", () -> {
            eq(1083, MemoryBudget.plan(2048, 200, 1024, 128, 192, 240));
        });
        check("thread stack làm tròn lên theo MB", () -> {
            eq(776, MemoryBudget.plan(1000, 3, 512, 10, 64, 48));
        });
        check("headroom 10% làm tròn lên", () -> {
            eq(900, MemoryBudget.plan(1000, 0, 1024, 0, 0, 0));
            eq(900, MemoryBudget.plan(1001, 0, 1024, 0, 0, 0));
            eq(909, MemoryBudget.plan(1010, 0, 1024, 0, 0, 0));
        });
        check("biên MIN_HEAP_MB: 64 được, 63 báo lỗi", () -> {
            eq(64, MemoryBudget.plan(1000, 0, 1024, 0, 836, 0));
            expect(IllegalStateException.class, () -> MemoryBudget.plan(1000, 0, 1024, 0, 837, 0));
        });
        check("phần ngoài heap vượt limit thì báo lỗi", () -> {
            expect(IllegalStateException.class, () -> MemoryBudget.plan(512, 300, 1024, 64, 128, 48));
        });
        check("tham số không hợp lệ ném IllegalArgumentException", () -> {
            expect(IllegalArgumentException.class, () -> MemoryBudget.plan(0, 10, 1024, 0, 0, 0));
            expect(IllegalArgumentException.class, () -> MemoryBudget.plan(1024, 10, 0, 0, 0, 0));
            expect(IllegalArgumentException.class, () -> MemoryBudget.plan(1024, -1, 1024, 0, 0, 0));
            expect(IllegalArgumentException.class, () -> MemoryBudget.plan(1024, 10, 1024, -1, 0, 0));
        });
        check("threads × stackKb lớn không tràn int", () -> {
            eq(600_000, MemoryBudget.plan(4_000_000, 3_000_000, 1024, 0, 0, 0));
        });
        check("percentage làm tròn xuống 1 chữ số thập phân", () -> {
            eq(52.8, MemoryBudget.percentage(2048, 1083));
            eq(77.6, MemoryBudget.percentage(1000, 776));
            eq(66.6, MemoryBudget.percentage(3, 2));
            eq(100.0, MemoryBudget.percentage(512, 512));
            expect(IllegalArgumentException.class, () -> MemoryBudget.percentage(1024, 2048));
            expect(IllegalArgumentException.class, () -> MemoryBudget.percentage(1024, 0));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class MemoryBudget {
    static final int MIN_HEAP_MB = 64;

    static int plan(int podLimitMb, int threads, int stackKb, int directMb, int metaspaceMb, int codeCacheMb) {
        if (podLimitMb <= 0 || stackKb <= 0 || threads < 0 || directMb < 0 || metaspaceMb < 0 || codeCacheMb < 0) {
            throw new IllegalArgumentException("invalid budget input");
        }
        long headroom = ceilDiv(podLimitMb, 10);                 // >= 10% limit
        long stackMb = ceilDiv((long) threads * stackKb, 1024);  // long: tránh tràn int
        long heap = podLimitMb - headroom - stackMb - directMb - metaspaceMb - codeCacheMb;
        if (heap < MIN_HEAP_MB) {
            throw new IllegalStateException("pod " + podLimitMb + " MB không đủ: heap còn " + heap + " MB");
        }
        return (int) heap;
    }

    static double percentage(int podLimitMb, int heapMb) {
        if (podLimitMb <= 0 || heapMb <= 0 || heapMb > podLimitMb) {
            throw new IllegalArgumentException("invalid heap/limit");
        }
        long permille = (long) heapMb * 1000 / podLimitMb;   // số nguyên: làm tròn xuống
        return permille / 10.0;
    }

    private static long ceilDiv(long a, long b) {
        return (a + b - 1) / b;   // a >= 0, b > 0
    }
}`,
      hints: [
        'Làm tròn lên phép chia số nguyên không âm: {{(a + b - 1) / b}}. Headroom là {{ceilDiv(podLimitMb, 10)}}, stack là {{ceilDiv((long) threads * stackKb, 1024)}}.',
        'Ép kiểu {{(long)}} **trước** khi nhân: {{(long) threads * stackKb}}. Viết {{(long) (threads * stackKb)}} là đã tràn int rồi mới ép.',
        'Với percentage, tránh {{Math.floor}} trên số thực có sai số: tính phần nghìn bằng số nguyên {{(long) heapMb * 1000 / podLimitMb}} rồi chia {{10.0}}.',
      ],
      explain: `Phép tính phản ánh đúng cách lập ngân sách trong bài: heap là **phần còn lại** sau khi trừ mọi vùng ngoài heap và một khoảng headroom, chứ không phải một phần trăm chọn đại.

Vì sao làm tròn lên ở headroom và stack: đây là ngân sách an toàn, sai số phải nghiêng về phía **ít heap hơn**. Làm tròn xuống 1.5 MB stack thành 1 MB nghĩa là hứa với kernel nhiều hơn mức có.

Vì sao dùng {{long}}: {{threads * stackKb}} với int tràn khi tích vượt khoảng 2.1 tỷ; kết quả âm làm heap tính ra lớn hơn limit, đúng loại bug khiến pod bị OOMKilled. Test "không tràn int" dùng số phi thực tế nhưng bắt đúng lỗi này.

Vì sao percentage tính bằng số nguyên: {{Math.floor(x * 10) / 10}} trên double đôi khi lệch một bậc do biểu diễn nhị phân (ví dụ 0.1 + 0.2). Tính phần nghìn bằng phép chia số nguyên cho kết quả xác định.

Lỗi hay gặp: quên kiểm tra {{heap < MIN_HEAP_MB}} (trả về heap âm hoặc 5 MB); trả về {{IllegalArgumentException}} cho trường hợp thiếu bộ nhớ (input hợp lệ, chỉ là cấu hình không khả thi, nên {{IllegalStateException}} đúng nghĩa hơn); dùng 10% làm tròn xuống.

Áp dụng thật: chạy service với NMT dưới tải, lấy số committed của {{Thread}}, {{Class}}, {{Code}}, {{Other}} làm input, rồi đặt {{-XX:MaxRAMPercentage}} bằng kết quả {{percentage}}. Khi đổi limit pod, chỉ cần tính lại.`,
    },
  ],
  check: [
    {
      q: 'Pod có memory limit 2 GiB, chạy JDK 17 không có flag heap nào. Heap tối đa mặc định là bao nhiêu?',
      options: [
        'Bằng RAM của node',
        '2 GiB',
        '512 MiB (25% limit)',
        '1 GiB (50% limit)',
      ],
      answer: 2,
      explain: `Container support bật mặc định nên JVM đọc limit 2 GiB từ cgroup, và {{MaxRAMPercentage}} mặc định là 25%, ra 512 MiB. JVM không dùng RAM của node (đó là hành vi của Java 8 cũ trước 8u191). Nó cũng không lấy cả limit (sẽ bị OOMKilled), và 50% là mặc định của {{MinRAMPercentage}}, chỉ áp dụng khi bộ nhớ rất nhỏ.`,
    },
    {
      q: 'Pod Java liên tục bị OOMKilled (exit 137) trong khi metric heap chỉ khoảng 60%. Bước điều tra hợp lý đầu tiên là gì?',
      options: [
        'Tăng {{-Xmx}} để heap có thêm chỗ',
        'Bật Native Memory Tracking, so baseline với summary.diff và đối chiếu với RSS của container',
        'Lấy heap dump và mở bằng MAT',
        'Chuyển từ G1 sang ZGC',
      ],
      answer: 1,
      explain: `Heap chưa đầy nên thủ phạm nằm ngoài heap; NMT cho biết từng vùng native (thread, class, code, GC, other) tăng bao nhiêu, và so với RSS để phát hiện malloc ngoài JVM. Tăng {{-Xmx}} càng lấy bớt chỗ của phần ngoài heap, làm tệ hơn. Heap dump chỉ thấy heap. Đổi GC không xử lý vùng đang phình, và ZGC còn có overhead bộ nhớ riêng.`,
    },
    {
      q: 'Phát biểu nào về NMT là **đúng**?',
      options: [
        'NMT có thể bật bằng jcmd khi JVM đang chạy',
        'NMT theo dõi cả malloc của mọi thư viện JNI bên thứ ba',
        'Con số reserved trong NMT chính là RAM thật đang bị chiếm',
        'NMT phải bật lúc khởi động bằng {{-XX:NativeMemoryTracking}}; nó chỉ thấy bộ nhớ do JVM cấp phát',
      ],
      answer: 3,
      explain: `NMT là flag khởi động; {{jcmd VM.native_memory}} chỉ đọc kết quả (và có thể tắt NMT), không bật được khi đang chạy. NMT chỉ ghi nhận bộ nhớ đi qua allocator của JVM nên không thấy malloc trực tiếp của thư viện native. Reserved là dải địa chỉ ảo; RAM thật gần với committed (và các trang đã chạm), nên reserved 1 GB của class space không có nghĩa là tốn 1 GB.`,
    },
  ],
  related: ['jvm-003', 'jvm-014', 'jvm-015', 'jvm-028'],
  tags: ['container', 'Kubernetes', 'OOMKilled', 'MaxRAMPercentage', 'NMT', 'native memory', 'metaspace'],
},
{
  id: 'lesson-jvm-006',
  track: 'jvm',
  order: 6,
  title: 'Đọc GC log JDK 17: một dòng log nói gì, tính throughput và p99 pause, đoán thiếu heap hay đang leak',
  level: 'senior',
  minutes: 35,
  goals: [
    'Đọc được một dòng GC log unified logging của G1 trên JDK 17 và gọi tên đúng từng trường',
    'Phân biệt Pause Young (Normal), Concurrent Start, Mixed và Pause Full; vì sao Full GC trên JDK 17 đắt',
    'Tính được throughput % và p99 pause từ log bằng code, không nhìn bằng mắt',
    'Quyết định nên tăng heap hay đi sửa leak chỉ từ hai con số: live set sau Full GC và nhịp pause',
  ],
  body: `### Bật GC log trên JDK 17: unified logging
JDK 9 gộp toàn bộ log của JVM vào một cơ chế duy nhất tên **unified logging**, điều khiển bằng cờ {{-Xlog}}. Trước đó mỗi nguồn log có cờ riêng ({{-XX:+PrintGCDetails}}, {{-verbose:gc}}) nên định dạng lộn xộn và rất khó parse. Ba cách viết hay dùng:

~~~bash
# in ra console
java -Xlog:gc -jar app.jar

# mọi tag bắt đầu bằng gc, ghi file và tự xoay (5 file, mỗi file 20 MB)
java -Xlog:gc*:file=/var/log/jvm/gc.log:time,uptime,level,tags:filecount=5,filesize=20m -jar app.jar
~~~

{{gc*}} nghĩa là "mọi tag bắt đầu bằng gc" ({{gc}}, {{gc+heap}}, {{gc+phases}}, {{gc+age}}...); phần {{time,uptime,level,tags}} là danh sách **decoration** — các thông tin in ở đầu mỗi dòng. Trong container, người ta ghi ra file rồi mount volume, hoặc để {{stdout}} cho {{kubectl logs}} bắt.

### Giải phẫu một dòng log G1
~~~text
[2026-11-06T09:12:03.441+0700][12.345s][info][gc] GC(7) Pause Young (Normal) (G1 Evacuation Pause) 512M->128M(1024M) 8.123ms
~~~

| Trường | Đọc là gì |
|---|---|
| {{12.345s}} | uptime: 12,345 giây kể từ lúc JVM khởi động |
| {{info}} | mức log của dòng này |
| {{[gc]}} | tag nguồn log (bật decoration {{tags}} mới in) |
| {{GC(7)}} | số thứ tự chu trình thu gom; các dòng mở và đóng cùng một chu trình mang số giống nhau |
| {{Pause Young (Normal)}} | **loại** pause |
| {{(G1 Evacuation Pause)}} | **lý do** G1 chọn thu gom đúng lúc này |
| {{512M->128M(1024M)}} | heap đang dùng 512 MiB, sau GC còn 128 MiB, tổng capacity 1024 MiB |
| {{8.123ms}} | thời gian stop-the-world của pause này |

**stop-the-world (STW)** nghĩa là JVM dừng **toàn bộ** thread ứng dụng tại một **safepoint** (điểm an toàn mà mọi thread đang ở vị trí có thể quét stack), làm việc thu gom, rồi mới cho chạy tiếp. Giống một xưởng tạm ngừng máy để dọn kho: trong lúc dọn, không sản phẩm nào được làm ra. Con số {{ms}} cuối dòng chính là khoảng thời gian khách hàng bị chậm, và đó là thứ duy nhất trong log người dùng cảm nhận được.

### Bốn nhãn pause của G1 và một nhãn không phải pause
- {{Pause Young (Normal)}}: chỉ dọn Eden và Survivor. Object chết yểu biến mất, object sống sót được copy sang Survivor. Thường vài ms.
- {{Pause Young (Concurrent Start)}}: vẫn là young pause, nhưng đồng thời **mồi** một chu trình đánh dấu old generation. Chu trình bắt đầu khi occupancy của old vượt {{-XX:InitiatingHeapOccupancyPercent}} (IHOP, mặc định 45% heap).
- {{Concurrent Mark Cycle}}: dòng tổng kết pha đánh dấu chạy song song với ứng dụng — **không có pause**, không được tính vào thời gian dừng thế giới. Chu trình đánh dấu đi kèm các pause ngắn {{Pause Remark}} và {{Pause Cleanup}} (dừng thế giới), nhưng dòng tổng kết {{Concurrent Mark Cycle}} bản thân nó không phải pause.
- {{Pause Young (Mixed)}}: young pause kèm dọn một số region old đã đánh dấu xong. Đây là lúc con số "sau GC" bắt đầu phản ánh đúng bộ nhớ còn sống.
- {{Pause Full}}: G1 hết đường, thường vì không còn chỗ chứa object sống khi copy ({{To-space exhausted}}) hoặc vì code gọi {{System.gc()}}. Full GC chạy theo kiểu mark-compact và dừng toàn bộ ứng dụng; từ JDK 10 nó đã chạy song song (JEP 307), nhưng trên heap lớn (nhiều GB) pause vẫn có thể kéo dài tới vài giây — con số "vài giây trên heap 8 GB" là hoàn toàn có thể, không phải lỗi in log.

Nhãn trong ngoặc đơn thứ hai là nguyên nhân. Hay gặp: {{G1 Evacuation Pause}} (bình thường), {{G1 Humongous Allocation}} (object quá to), {{Metadata GC Threshold}} (metaspace đầy), {{G1 Periodic Collection}} (dọn định kỳ), {{System.gc()}} (ai đó gọi tay).

> Từ cần nắm cho người mới: **evacuation** = copy object sống sang vùng mới thay vì dọn tại chỗ; **promotion** = chuyển object sống dai từ young lên old; **live set** = tổng kích thước object còn sống sau khi dọn; **allocation rate** = số MB ứng dụng cấp phát mỗi giây; **humongous** = object lớn hơn 50% region nên G1 phải cấp riêng; **region** = lát cắt heap mà G1 quản lý (thường 1-32 MB).

### Throughput và p99: hai con số phải tính, không đoán
- **throughput %** = phần thời gian cửa sổ mà ứng dụng thật sự được chạy: throughput = (1 − tổng pause / thời gian cửa sổ) × 100.
- **p99 pause** = 99% số pause nhanh hơn hoặc bằng con số này. p50 (trung vị) và p99 chỉ khác nhau ở cách chọn phần tử, không khác đơn vị.

Ví dụ: trong 100 giây có 6 pause tổng 130 ms thì throughput = (100000 - 130) / 100000 * 100 = **99.87%**. Nói **pause trung bình 21,7 ms** thì nghe rất ổn, nhưng đó là nói dối: năm pause chỉ 4-8 ms, một pause Full 100 ms đã kéo hết số trung bình. Thông tin thật là "p99 = 100 ms và có một Full GC".

Cách lấy percentile kiểu **nearest-rank** (không nội suy, dễ cài đặt và dễ giải thích trong phỏng vấn): sắp xếp n giá trị tăng dần, k = ceil(p / 100 * n), kết quả là phần tử thứ k đếm từ 1. p99 của 6 giá trị: k = ceil(0.99 * 6) = 6 → chính là giá trị lớn nhất.

~~~java
// chỉ dòng có nhãn Pause + số ms mới là một sự kiện pause
Double ms = pauseMs(line);                 // cắt chuỗi số nằm ngay trước "ms" cuối dòng
if (ms != null) pauses.add(Math.round(ms * 1000.0));   // tính bằng microsecond: số nguyên, không sai số
Collections.sort(pauses);
int k = (int) Math.ceil(p / 100.0 * pauses.size());
double p99 = pauses.get(k - 1) / 1000.0;
~~~

### Từ con số tới quyết định
| Quan sát trong log | Đọc là | Nên làm |
|---|---|---|
| {{Pause Young}} thưa, p99 dưới 50 ms, live set sau Full GC ổn định | hệ bình thường | không sửa gì |
| Young GC dày đặc, mỗi lần reclaim gần hết heap | allocation rate cao | soi code cấp phát (String, JSON, byte[] cho mỗi request), xem JFR event {{jdk.ObjectAllocationSample}} |
| {{Pause Young (Mixed)}} ngày một nhiều, live set sau Mixed đi ngang | object sống dai dồn vào old | tăng heap nếu đó là dữ liệu thật, điều tra nếu nó cứ tăng |
| {{Pause Full}} lặp lại sau vài phút, {{100M->95M(1024M)}} | heap chứa live set quá chật | tăng {{-Xmx}} rồi đo lại |
| {{Pause Full}} {{700M->650M(1024M)}}, lần Full sau {{760M->710M(1024M)}} | leak: object sống tăng bậc thang | heap dump + MAT tìm retained set, đừng tuning GC |
| {{To-space exhausted}}, {{Concurrent Mark Abort To-space Exhausted}} | marking không kịp tốc độ cấp phát | giảm IHOP, tăng heap, giảm object humongous |

~~~text
Live set đo sau mỗi Pause Full (MiB), heap cố định 1024 MiB

  710 |                                                    *
  650 |                          *              *
  520 |              *
  420 |      *
      +-------------------------------------------------------------
          Full GC 1   Full GC 2   Full GC 3   Full GC 4   ->  thời gian
      (a) tăng bậc thang qua mỗi lần dọn sạch = LEAK, tăng heap chỉ dời ngày OOM
~~~

> Senior tip: chỉ lấy live set **do Pause Full đo**. Young GC không quét old generation, nên trong {{512M->128M(1024M)}} của một Young pause, phần 128 MiB vẫn bao gồm cả old generation chưa được tính toán gì. Quy tắc thực dụng cho service: live set vượt khoảng 60% {{-Xmx}} thì không có cấu hình collector nào cứu được — đó là bài toán dung lượng hoặc bài toán code, không phải bài toán GC.

### Ba lỗi hay gặp khi đọc log
- Tính cả dòng {{Concurrent Mark Cycle}} (hoặc {{Pause Remark}}, {{Pause Cleanup}}) vào tổng pause → throughput tụt ảo.
- So log giữa hai bản JDK hoặc hai cỡ heap: cùng ứng dụng, JDK 21 in log chi tiết hơn và full GC chạy song song nên số khác hẳn; so "hồi trước nhanh hơn" là so sai đối tượng.
- Hiểu {{-XX:MaxGCPauseMillis=200}} (mặc định) như một hợp đồng: đó là **mong muốn**. G1 co giãn young generation để cố đạt, nhưng khi live set lớn thì nó vẫn vi phạm — và cái giá phải trả là young nhỏ lại, GC chạy dày hơn, promote sớm hơn.

### Liên hệ phỏng vấn
Câu hỏi thường gặp: "Bạn đọc GC log ở những cờ nào?", "Throughput là gì?", "Vì sao p99 quan trọng hơn trung bình?", "Full GC xuất hiện nghĩa là gì, xử lý ra sao?". Trả lời theo khung bốn bước sẽ gọn: (1) bật {{-Xlog:gc*:file=...}}, (2) đọc đúng từng trường của một dòng, (3) tính throughput và p99, (4) kết luận theo live set sau Full GC thay vì theo cảm giác. Bài tập dưới đây bắt bạn tự viết bộ parse, nên bạn sẽ không bao giờ nhầm dòng pause với dòng concurrent nữa.`,
  exercises: [
    {
      title: 'Tự viết bộ parse GC log: số pause mỗi loại, tổng pause, p99 và throughput',
      prompt: `Viết class {{GcLogStats}} đọc log G1 của JDK 17 (dạng unified logging) và tính các chỉ số tổng hợp. Chỉ dùng chuỗi ({{contains}}, {{indexOf}}, {{substring}}), không cần regex.

**Thế nào là một sự kiện pause.** Một dòng được tính khi nó chứa **đúng một** trong bốn nhãn sau **và** có một số đi ngay trước chữ {{ms}} ở cuối dòng:

~~~text
Pause Young (Normal)
Pause Young (Concurrent Start)
Pause Young (Mixed)
Pause Full
~~~

Mọi dòng khác bị bỏ qua, kể cả {{Using G1}}, {{GC(2) Concurrent Mark Cycle}}, {{Pause Remark}}, {{Pause Cleanup}} (hai nhãn này thuộc pha đánh dấu, ngoài phạm vi bài). Phần heap như {{512M->128M(1024M)}} không chứa chữ {{ms}} nên không gây nhầm. Dòng có thể kết thúc bằng {{\\r}} (log Windows) — bỏ qua {{\\r}}.

Ví dụ mẫu log và kết quả mong đợi:

~~~text
[12.000s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 64M->16M(256M) 4.000ms
[14.000s][info][gc] GC(2) Pause Young (Concurrent Start) (G1 Humongous Allocation) 96M->40M(256M) 6.000ms
[14.500s][info][gc] GC(2) Concurrent Mark Cycle
[15.000s][info][gc] GC(3) Pause Young (Mixed) (G1 Evacuation Pause) 120M->48M(256M) 7.000ms
[17.000s][info][gc] GC(5) Pause Full (G1 Compaction Pause) 240M->60M(256M) 100.000ms
~~~

Với mẫu đầy đủ 6 pause (4.000, 5.000, 6.000, 7.000, 8.000, 100.000 ms): tổng pause 130.0 ms, p50 = 6.0, p99 = 100.0, throughput của cửa sổ 100 giây = 99.87%.

**Bốn hàm cần viết.**
1. {{pausesByType(log)}} → {{Map<String, Integer>}} có **đúng bốn khoá** {{young-normal}}, {{young-concurrent-start}}, {{young-mixed}}, {{full}} theo đúng thứ tự đó; loại không xuất hiện vẫn có mặt với giá trị 0.
2. {{totalPauseMs(log)}} → tổng thời gian pause, **làm tròn 3 chữ số thập phân**; không có pause nào → {{0.0}}.
3. {{pausePercentileMs(log, p)}} → theo nearest-rank: sắp tăng dần n giá trị, k = ceil(p / 100 * n) (kẹp k vào {{1..n}}), lấy phần tử thứ k đếm từ 1. {{p}} phải thuộc khoảng (0, 100], ra ngoài → ném {{IllegalArgumentException}}. Không có pause nào → {{0.0}}.
4. {{throughputPct(log, windowSeconds)}} → (windowSeconds * 1000 - tổng pause ms) / (windowSeconds * 1000) * 100, **làm tròn xuống** 2 chữ số thập phân và không bao giờ âm (pause vượt cửa sổ thì trả {{0.0}}). {{windowSeconds <= 0}} → ném {{IllegalArgumentException}}.`,
      starter: `class GcLogStats {
    static final String[] TYPES = {
        "young-normal", "young-concurrent-start", "young-mixed", "full"
    };
    static final String[] MARKERS = {
        "Pause Young (Normal)", "Pause Young (Concurrent Start)", "Pause Young (Mixed)", "Pause Full"
    };

    static Map<String, Integer> pausesByType(String log) {
        throw new UnsupportedOperationException("TODO");
    }

    static double totalPauseMs(String log) {
        throw new UnsupportedOperationException("TODO");
    }

    static double pausePercentileMs(String log, double p) {
        throw new UnsupportedOperationException("TODO");
    }

    static double throughputPct(String log, double windowSeconds) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> type, Runnable r) {
        try {
            r.run();
        } catch (Throwable t) {
            if (type.isInstance(t)) return;
            throw new AssertionError("expected " + type.getSimpleName() + " got " + t);
        }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing was thrown");
    }
    static String log(String... lines) { return String.join("\\n", lines); }
    static String logCrlf(String... lines) { return String.join("\\r\\n", lines); }
    static Map<String, Integer> counts(int normal, int start, int mixed, int full) {
        Map<String, Integer> m = new LinkedHashMap<>();
        m.put("young-normal", normal);
        m.put("young-concurrent-start", start);
        m.put("young-mixed", mixed);
        m.put("full", full);
        return m;
    }
    static final String S1 = log(
        "[0.067s][info][gc] Using G1",
        "[12.000s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 64M->16M(256M) 4.000ms",
        "[13.000s][info][gc] GC(1) Pause Young (Normal) (G1 Evacuation Pause) 80M->24M(256M) 5.000ms",
        "[14.000s][info][gc] GC(2) Pause Young (Concurrent Start) (G1 Humongous Allocation) 96M->40M(256M) 6.000ms",
        "[14.500s][info][gc] GC(2) Concurrent Mark Cycle",
        "[15.000s][info][gc] GC(3) Pause Young (Mixed) (G1 Evacuation Pause) 120M->48M(256M) 7.000ms",
        "[16.000s][info][gc] GC(4) Pause Young (Normal) (G1 Evacuation Pause) 128M->56M(256M) 8.000ms",
        "[17.000s][info][gc] GC(5) Pause Full (G1 Compaction Pause) 240M->60M(256M) 100.000ms"
    );
    static final String S_YOUNG_ONLY = log(
        "[9.000s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 32M->8M(128M) 3.500ms",
        "[9.500s][info][gc] GC(1) Pause Young (Normal) (G1 Evacuation Pause) 36M->9M(128M) 2.250ms"
    );
    static final String S_NO_PAUSE = log(
        "[0.067s][info][gc] Using G1",
        "[18.000s][info][gc] GC(6) Concurrent Mark Cycle",
        "[18.400s][info][gc] GC(6) Pause Remark 120M->120M(256M) 1.200ms",
        "[18.410s][info][gc,heap] Heap region size: 1MB"
    );
    public static void main(String[] args) {
        check("phân loại đủ bốn nhãn", () -> {
            eq(4, GcLogStats.pausesByType(S1).size());
            eq(counts(3, 1, 1, 1), GcLogStats.pausesByType(S1));
        });
        check("nhãn không xuất hiện vẫn có mặt với giá trị 0", () -> {
            Map<String, Integer> m = GcLogStats.pausesByType(S_YOUNG_ONLY);
            eq(4, m.size());
            eq(2, m.get("young-normal"));
            eq(0, m.get("young-mixed"));
            eq(0, m.get("full"));
        });
        check("tổng pause = 130.0 ms, dòng concurrent không được tính", () -> {
            eq(130.0, GcLogStats.totalPauseMs(S1));
            eq(5.75, GcLogStats.totalPauseMs(S_YOUNG_ONLY));
            eq(0.0, GcLogStats.totalPauseMs(S_NO_PAUSE));
        });
        check("percentile theo nearest-rank", () -> {
            eq(4.0, GcLogStats.pausePercentileMs(S1, 1));
            eq(5.0, GcLogStats.pausePercentileMs(S1, 25));
            eq(6.0, GcLogStats.pausePercentileMs(S1, 50));
            eq(8.0, GcLogStats.pausePercentileMs(S1, 80));
            eq(100.0, GcLogStats.pausePercentileMs(S1, 99));
            eq(100.0, GcLogStats.pausePercentileMs(S1, 100));
        });
        check("percentile biên: log rỗng = 0.0, p ngoài (0,100] báo lỗi", () -> {
            eq(0.0, GcLogStats.pausePercentileMs(S_NO_PAUSE, 99));
            expect(IllegalArgumentException.class, () -> GcLogStats.pausePercentileMs(S1, 0));
            expect(IllegalArgumentException.class, () -> GcLogStats.pausePercentileMs(S1, 100.5));
            expect(IllegalArgumentException.class, () -> GcLogStats.pausePercentileMs(S1, -1));
        });
        check("throughput cửa sổ 100 s = 99.87%", () -> {
            eq(99.87, GcLogStats.throughputPct(S1, 100.0));
        });
        check("throughput làm tròn XUỐNG: 95.66 chứ không phải 95.67", () -> {
            eq(95.66, GcLogStats.throughputPct(S1, 3.0));
        });
        check("throughput biên: pause vượt cửa sổ = 0.0, log rỗng = 100.0", () -> {
            eq(0.0, GcLogStats.throughputPct(S1, 0.1));
            eq(74.0, GcLogStats.throughputPct(S1, 0.5));
            eq(100.0, GcLogStats.throughputPct(S_NO_PAUSE, 60.0));
            expect(IllegalArgumentException.class, () -> GcLogStats.throughputPct(S1, 0));
            expect(IllegalArgumentException.class, () -> GcLogStats.throughputPct(S1, -5.0));
        });
        check("chịu được CRLF và heap số lớn", () -> {
            eq(counts(3, 1, 1, 1), GcLogStats.pausesByType(logCrlf(
                "[12.000s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 64M->16M(256M) 4.000ms",
                "[13.000s][info][gc] GC(1) Pause Young (Normal) (G1 Evacuation Pause) 80M->24M(256M) 5.000ms",
                "[14.000s][info][gc] GC(2) Pause Young (Concurrent Start) (G1 Humongous Allocation) 96M->40M(256M) 6.000ms",
                "[15.000s][info][gc] GC(3) Pause Young (Mixed) (G1 Evacuation Pause) 120M->48M(256M) 7.000ms",
                "[16.000s][info][gc] GC(4) Pause Young (Normal) (G1 Evacuation Pause) 128M->56M(256M) 8.000ms",
                "[17.000s][info][gc] GC(5) Pause Full (G1 Compaction Pause) 240M->60M(256M) 100.000ms"
            )));
            eq(130.0, GcLogStats.totalPauseMs(logCrlf(
                "[12.000s][info][gc] GC(0) Pause Young (Normal) (G1 Evacuation Pause) 64M->16M(256M) 4.000ms",
                "[17.000s][info][gc] GC(5) Pause Full (G1 Compaction Pause) 240M->60M(256M) 126.000ms"
            )));
            String big = log("[200.000s][info][gc] GC(99) Pause Young (Normal) (G1 Evacuation Pause) 2048M->512M(4096M) 12.500ms");
            eq(12.5, GcLogStats.totalPauseMs(big));
            eq(1, GcLogStats.pausesByType(big).get("young-normal"));
        });
        check("log rỗng hoàn toàn vẫn trả kết quả xác định", () -> {
            eq(counts(0, 0, 0, 0), GcLogStats.pausesByType(""));
            eq(0.0, GcLogStats.totalPauseMs(""));
            eq(0.0, GcLogStats.pausePercentileMs("", 99));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class GcLogStats {
    static final String[] TYPES = {
        "young-normal", "young-concurrent-start", "young-mixed", "full"
    };
    static final String[] MARKERS = {
        "Pause Young (Normal)", "Pause Young (Concurrent Start)", "Pause Young (Mixed)", "Pause Full"
    };

    static Map<String, Integer> pausesByType(String log) {
        Map<String, Integer> out = new LinkedHashMap<>();
        for (String t : TYPES) out.put(t, 0);
        for (String line : lines(log)) {
            if (pauseMs(line) == null) continue;
            String type = TYPES[typeIndex(line)];
            out.put(type, out.get(type) + 1);
        }
        return out;
    }

    static double totalPauseMs(String log) {
        return totalPauseMicros(log) / 1000.0;   // microsecond / 1000: đúng 3 chữ số thập phân
    }

    static double pausePercentileMs(String log, double p) {
        if (!(p > 0.0 && p <= 100.0)) throw new IllegalArgumentException("p phải thuộc (0, 100]: " + p);
        List<Long> micros = new ArrayList<>();
        for (String line : lines(log)) {
            Double ms = pauseMs(line);
            if (ms != null) micros.add(Math.round(ms * 1000.0));
        }
        if (micros.isEmpty()) return 0.0;
        Collections.sort(micros);
        int n = micros.size();
        int k = (int) Math.ceil(p / 100.0 * n);   // nearest-rank: phần tử thứ k, đếm từ 1
        if (k < 1) k = 1;
        if (k > n) k = n;
        return micros.get(k - 1) / 1000.0;
    }

    static double throughputPct(String log, double windowSeconds) {
        if (!(windowSeconds > 0.0)) throw new IllegalArgumentException("windowSeconds phai > 0: " + windowSeconds);
        long windowMicros = Math.round(windowSeconds * 1_000_000.0);
        long pauseMicros = totalPauseMicros(log);
        if (windowMicros <= 0 || pauseMicros >= windowMicros) return 0.0;
        long scaled = (windowMicros - pauseMicros) * 10_000L / windowMicros;   // % x 100, chia nguyên = sàn
        return scaled / 100.0;
    }

    static long totalPauseMicros(String log) {
        long sum = 0;
        for (String line : lines(log)) {
            Double ms = pauseMs(line);
            if (ms != null) sum += Math.round(ms * 1000.0);
        }
        return sum;
    }

    private static List<String> lines(String log) {
        List<String> out = new ArrayList<>();
        if (log == null) return out;
        for (String line : log.split("\\n")) out.add(line.replace("\\r", ""));
        return out;
    }

    private static int typeIndex(String line) {
        for (int i = 0; i < MARKERS.length; i++) if (line.contains(MARKERS[i])) return i;
        return -1;
    }

    // null nếu dòng này không phải một sự kiện pause hợp lệ
    private static Double pauseMs(String line) {
        if (typeIndex(line) < 0) return null;
        int end = line.lastIndexOf("ms");
        if (end < 0) return null;
        int start = end;
        while (start > 0 && "0123456789.".indexOf(line.charAt(start - 1)) >= 0) start--;
        if (start == end) return null;
        try {
            return Double.valueOf(line.substring(start, end));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}`,
      hints: [
        'Tách dòng bằng {{split("\\n")}} rồi bỏ {{\\r}} ở cuối. Một dòng là sự kiện pause khi nó chứa một trong bốn nhãn và có phần số ngay trước chữ {{ms}} cuối dòng; không có {{ms}} thì bỏ qua cả dòng (kể cả khi nó mang nhãn pause).',
        'Đừng cộng số thực rồi so sánh. Đổi mỗi pause sang **microsecond nguyên** bằng {{Math.round(ms * 1000.0)}}, cộng các {{long}}, chỉ chia {{1000.0}} ở bước cuối.',
        'Làm tròn xuống 2 chữ số thập phân mà không dùng {{Math.floor}} trên double: tính {{(windowMicros - pauseMicros) * 10000L / windowMicros}} rồi chia {{100.0}}. {{95.67}} trong binary có thể là {{95.669999...}}, nên {{Math.floor(95.67 * 100)}} cho ra 9566.',
        'Giữ thứ tự khoá của map bằng {{LinkedHashMap}}; khởi tạo đủ bốn khoá với giá trị 0 trước khi đếm, để loại không xuất hiện vẫn có mặt.',
      ],
      explain: `Bốn con số trong bài chính là bốn con số người ta hỏi nhau trong một buổi incident review, và chúng trả lời bốn câu khác nhau: **tần suất từng loại pause** (hệ đang chạy young GC hay đã phải đụng tới old/Full), **tổng pause** và **p99** (khách hàng chịu bao lâu), **throughput** (bao nhiêu phần thời gian thật sự làm việc).

Điểm dễ sai nhất không phải parse mà là **số học làm tròn**. {{p99}} theo nearest-rank là một phần tử có thật trong mẫu, không phải giá trị nội suy, nên với 6 pause thì p95, p99 và p100 đều cho ra 100 ms — đó là lý do phân bố đuôi dài biến mất khi chỉ nhìn trung bình. Tương tự, tổng pause và throughput nên tính trên **microsecond nguyên**: {{4.000 + 5.000}} bằng double vẫn đúng, nhưng với {{1.234}} và hàng nghìn dòng thì sai số cộng dồn đủ để đổi {{99.87}} thành {{99.86999...}} và {{Math.floor}} cho ra {{99.86}}.

Lỗi logic hay gặp khi parse: dùng {{indexOf("ms")}} thay vì {{lastIndexOf("ms")}} — một số dòng có {{ms}} trong nhãn hoặc trong phần heap sẽ bị cắt sai; hoặc đếm cả {{Pause Remark}}/{{Concurrent Mark Cycle}} vì thấy chữ "Pause". Ngược lại, đừng dùng {{Double.parseDouble}} trên toàn bộ phần đuôi dòng: phần đuôi gồm cả "ms".

Trong phỏng vấn, sau khi có bốn con số, câu tiếp theo luôn là "rồi bạn làm gì?". Trả lời theo live set: young pause cho biết **nhịp** cấp phát, chỉ pause Full/pause mixed mới cho biết **lượng sống thật**. Tăng {{-Xmx}} khi live set nằm ngang nhưng sát capacity; đi tìm retained set khi live set nhích lên qua từng lần dọn sạch.`,
    },
  ],
  check: [
    {
      q: 'Trên JDK 17, dòng log nào cho thấy G1 vừa dọn **cả old generation**?',
      options: [
        '{{Pause Young (Mixed)}}',
        '{{Pause Young (Normal)}}',
        '{{GC(7) Concurrent Mark Cycle}}',
        '{{Using G1}}',
      ],
      answer: 0,
      explain: `Mixed = young pause cộng thêm một số region old đã được đánh dấu xong, nên con số "sau GC" của nó bắt đầu phản ánh bộ nhớ sống thật. Normal chỉ dọn Eden/Survivor. Concurrent Mark Cycle là dòng tổng kết pha chạy song song, không dừng thế giới. Using G1 in một lần lúc khởi động, và cũng không phải pause.`,
    },
    {
      q: 'Live set đo sau mỗi Pause Full trên heap cố định 1024 MiB lần lượt là 420, 470, 520, 590 MiB. Kết luận **đúng nhất**?',
      options: [
        'Thiếu heap; tăng {{-Xmx}} lên 2 GB là hết Full GC',
        'Có leak: live set tăng bậc thang dù mỗi lần vừa dọn sạch, phải tìm retained set trước khi tuning',
        'Young generation quá nhỏ; tăng {{-Xmn}}',
        'Hoàn toàn bình thường, chỉ cần thêm CPU cho GC',
      ],
      answer: 1,
      explain: `Full GC là lần duy nhất old generation được dọn sạch, nên con số sau nó là lượng object sống thật. Nó nhích lên qua từng lần dọn nghĩa là ngày càng có nhiều object không chết — đó là định nghĩa của leak (rò rỉ bộ nhớ). Tăng heap chỉ dời thời điểm OOM và làm mỗi lần Full GC lâu hơn (Full GC dừng toàn bộ ứng dụng; heap càng lớn, pause càng dài). Với G1, đặt cứng {{-Xmn}} còn tắt cơ chế tự co giãn young theo {{-XX:MaxGCPauseMillis}}, nên thường là lựa chọn sai.`,
    },
    {
      q: 'Throughput của một service: 6 pause tổng 130 ms trong cửa sổ 3 giây. Lấy {{130 / 3000 x 100 = 4.33}}% rồi báo "throughput 4.33%" là sai ở đâu?',
      options: [
        'Sai đơn vị: phải đổi ms sang giây trước khi chia',
        'Sai công thức: throughput là phần thời gian **được chạy**, đáp án đúng là 95.66% (làm tròn xuống 2 chữ số)',
        'Sai vì pause phải nhân đôi: G1 tính cả pha concurrent',
        'Không sai; đó chính là throughput',
      ],
      answer: 1,
      explain: `Throughput = {{(1 - tong pause / cua so) x 100}} = {{(3000 - 130) / 3000 x 100 = 95.666...}}%, quy ước làm tròn xuống 2 chữ số để không hứa quá tay → 95.66%. Con số 4.33% là tỉ lệ thời gian GC (GC overhead), một chỉ số khác, và báo nó như throughput sẽ khiến người nghe tưởng hệ thống đang hỏng nặng.`,
    },
  ],
  related: ['jvm-009', 'jvm-021', 'jvm-015', 'jvm-006'],
  tags: ['G1', 'unified logging', '-Xlog', 'GC log', 'pause', 'throughput', 'p99', 'Full GC', 'live set'],
},
{
  id: 'lesson-jvm-007',
  track: 'jvm',
  order: 7,
  title: 'Thread dump: đọc jstack, phân biệt BLOCKED và WAITING, dựng đồ thị chờ để tìm deadlock',
  level: 'senior',
  minutes: 40,
  goals: [
    'Lấy được thread dump trên production bằng jstack, jcmd hoặc kill -3 và biết dump nói được gì, không nói được gì',
    'Phân biệt RUNNABLE, BLOCKED, WAITING, TIMED_WAITING và vì sao thread kẹt trong socketRead vẫn là RUNNABLE',
    'Đọc đúng các dòng locked / waiting to lock / waiting on / parking to wait for để biết ai giữ, ai chờ khoá nào',
    'Tự dựng đồ thị thread -> lock -> owner và tìm chu trình deadlock bằng code, thay vì nhìn bằng mắt',
  ],
  body: `### Thread dump là một tấm ảnh, không phải một đoạn video
Thread dump (còn gọi là jstack output) là **ảnh chụp toàn trạng** của mọi thread trong JVM tại một thời điểm: mỗi thread đang ở phương thức (method) nào, giữ khoá nào, chờ khoá nào. Nó là công cụ số một khi hệ thống "treo" mà CPU lại thấp.

~~~bash
jstack 12345 > dump.txt                          # in dump của PID 12345 ra file
jstack -l 12345 > dump.txt                       # -l: thêm mục Locked ownable synchronizers
jcmd 12345 Thread.print > dump.txt               # khuyến nghị; sống sót cả khi jstack báo "Unable to open socket file"
kill -3 12345                                    # SIGQUIT: JVM tự in dump ra stdout của nó, không ra file
kubectl exec my-pod -- jcmd 1 Thread.print       # trong container, PID của app thường là 1
~~~

Ba lưu ý thực chiến:
- Dump được chụp tại một **safepoint**, nên nó gây pause ngắn (vài ms tới vài chục ms với hàng nghìn thread). Chạy 3 lần liên tiếp là đủ để người dùng cảm nhận, nhưng đừng lặp trong vòng lặp.
- **Lấy ít nhất 2-3 dump cách nhau 5-10 giây.** Một dump chỉ cho biết ai đang ở đâu; hai dump mới cho biết ai **đứng yên**. Thread đổi stack frame giữa hai dump = nó đang tiến bộ, dù chậm.
- {{jstack}} phải chạy dưới cùng user với tiến trình JVM, nếu không sẽ báo "Unable to open socket file"; khi đó dùng {{kill -3}} (dump ra stdout, tức log của app) hoặc {{jcmd}}.

### Giải phẫu một entry
~~~text
"http-nio-8080-exec-12" #45 daemon prio=5 os_prio=0 cpu=125.00ms elapsed=3612.44s tid=0x00007f3c7c01d800 nid=0x1a2c waiting for lock condition [0x00007f3c5a2fb000]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at demo.Transfer.move(Transfer.java:57)
        - waiting to lock <0x000000076abba128> (a demo.Account)
        - locked <0x000000076abba1f0> (a demo.Account)

Locked ownable synchronizers:
        - <0x000000076abba3c0> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)
~~~

| Trường | Đọc là gì |
|---|---|
| tên trong nháy kép | tên thread do code đặt ({{http-nio-...}} của Tomcat, {{pool-1-thread-3}} của ExecutorService, {{kafka-coordinator...}}) |
| {{#45}}, {{daemon}} | số thứ tự thread, cờ daemon (daemon không giữ JVM sống) |
| {{cpu=125.00ms}} | tổng thời gian thread này đã **chạy trên CPU** từ lúc sinh |
| {{elapsed=3612.44s}} | thread đã tồn tại bao lâu |
| {{nid=0x1a2c}} | ID nhân (LWP) theo hex; đổi sang thập phân để đối chiếu với {{top -H -p}} |
| {{waiting for lock condition}} | mô tả của VM, gần giống nhưng không hoàn toàn giống với dòng State bên dưới |
| {{java.lang.Thread.State: BLOCKED}} | **trạng thái chuẩn** của {{java.lang.Thread}} — thứ để tin |
| {{- locked <0xA>}} | đang **giữ** monitor của object A |
| {{- waiting to lock <0xA>}} | muốn vào {{synchronized}} trên A nhưng A đang bị giữ → thread này là **kẻ chờ** |
| {{- waiting on <0xA>}} | đã gọi {{A.wait()}}: **đã nhả** monitor và đang chờ {{notify}} — không giữ cũng không chờ khoá |
| {{- parking to wait for <0xA>}} | đang {{LockSupport.park}} trên A: ReentrantLock, Semaphore hoặc Condition |
| {{Locked ownable synchronizers}} | mục liệt kê ReentrantLock mà thread đang **giữ**; monitor không xuất hiện ở đây |

> **Monitor** là gì: mọi object Java có một chìa khoá nội tại. Khối {{synchronized (acc)}} nghĩa là "cầm chìa của acc, làm việc, rồi trả chìa"; vì mỗi chìa chỉ một người cầm nên ai đến sau phải đứng ngoài. **ReentrantLock** là phiên bản chìa khoá bằng thư viện ({{java.util.concurrent.locks}}) với thêm khả năng timeout và công bằng, và JVM ghi nó ở mục Locked ownable synchronizers.

### Bốn trạng thái hay gặp và bẫy RUNNABLE
| State | Nghĩa | Nghi gì |
|---|---|---|
| {{RUNNABLE}} | đang chạy **hoặc** đang chờ tài nguyên ở tầng hệ điều hành | CPU thấp mà nhiều thread RUNNABLE trong {{socketRead0}}, {{EPollArrayWrapper.epollWait}} → đang chờ DB/API, không phải đang tính |
| {{BLOCKED}} | muốn vào {{synchronized}} nhưng monitor bị người khác giữ | có lock nóng; xem ai đang giữ địa chỉ đó |
| {{WAITING}} | chờ vô hạn: {{wait()}}, {{join()}}, {{park()}}, {{Future.get()}}, hàng đợi rỗng | phải có ai đánh thức; không ai đánh thức = kẹt vĩnh viễn |
| {{TIMED_WAITING}} | chờ có hạn: {{sleep(t)}}, {{wait(t)}}, {{parkNanos}}, {{tryLock(t)}}, {{join(t)}} | nếu la liệt {{tryLock}} timeout thì hệ thống đang tự bảo vệ |

{{NEW}} và {{TERMINATED}} gần như không bao giờ xuất hiện trong dump (thread chưa khởi động hoặc đã chết).

Bẫy lớn nhất của người mới: **{{RUNNABLE}} không có nghĩa là đang ngốn CPU**. JVM không có trạng thái "đang chờ socket", nên thread chặn trong {{InputStream.read}} trên socket vẫn khai là RUNNABLE. Vì thế câu "CPU 30% mà API chậm" thường có đáp án nằm ở đây: cả pool đang RUNNABLE chờ downstream (dịch vụ phía sau: DB, API khác), chứ không phải thiếu CPU.

### Deadlock là một chu trình trong đồ thị chờ
Dựng đồ thị: mỗi thread là một nút, kẻ cạnh từ thread T tới thread O nếu **T chờ lock L và O đang giữ L**. Mỗi thread chỉ chờ tối đa một lock nên mỗi nút có **out-degree bằng 1** — muốn tìm chu trình chỉ cần đi theo con trỏ và xem có quay về chỗ cũ không.

~~~seq
title: deadlock khi hai thread chuyển tiền ngược chiều
actors: T-A | Lock-1 | T-B | Lock-2
T-A -> Lock-1: synchronized(accA)
Lock-1 --> T-A: holder = T-A
T-B -> Lock-2: synchronized(accB)
Lock-2 --> T-B: holder = T-B
T-A -> Lock-2: synchronized(accB)
Lock-2 --> T-A: không trả lời, T-A BLOCKED
T-B -> Lock-1: synchronized(accA)
Lock-1 --> T-B: không trả lời, T-B BLOCKED
note T-A..T-B: Chu trinh cho: T-A -> Lock-2 -> T-B -> Lock-1 -> T-A
~~~

Deadlock cần đủ bốn điều kiện: tài nguyên không chia sẻ được, giữ cái này chờ cái kia, không ai lấy lại được chìa, và có vòng chờ. Phá một điều kiện là hết: cách thực dụng nhất là **phá vòng chờ** bằng cách luôn lấy khoá theo cùng một thứ tự toàn cục (vd sort account id rồi mới lock), hoặc {{tryLock(50, TimeUnit.MILLISECONDS)}} để có đường rút.

~~~java
// Cùng một giao dịch, nhưng khoá được sắp thứ tự -> không có vòng chờ
void safeTransfer(Account from, Account to, long amount) {
    Account first = from.id() < to.id() ? from : to;    // thứ tự toàn cố theo id
    Account second = first == from ? to : from;
    synchronized (first) {
        synchronized (second) {                          // ai cũng lấy first trước
            from.debit(amount);
            to.credit(amount);
        }
    }
}
~~~

JVM tự phát hiện chu trình kiểu này và in thêm ở cuối dump:

~~~text
Found one Java-level deadlock:
=============================
"transfer-1":
  waiting to lock monitor 0x00007f3c3c01ad00 (object 0x000000076abba128, a demo.Account),
  which is held by "transfer-2"
"transfer-2":
  waiting to lock monitor 0x00007f3c3c01b200 (object 0x000000076abba1f0, a demo.Account),
  which is held by "transfer-1"
~~~

**Giới hạn phải nói trong phỏng vấn**: JVM chỉ thấy khoá của chính nó (monitor, ReentrantLock). Nó không thấy deadlock **hàng đợi DB row lock** (MySQL tự phát hiện và ném lỗi 1213), **khoá phân tán trên Redis/ZooKeeper**, hay **deadlock logic** (thread chờ một message sẽ không bao giờ tới). Những case đó dump chỉ cho thấy triệu chứng: pool cạn thread, tất cả {{WAITING}}, hoặc {{RUNNABLE}} trong {{socketRead}}.

### Quy trình năm bước khi hệ thống chậm
1. Xem CPU trước: {{top -H -p 12345}} — một thread ăn 100% thì {{nid}} của nó (hex {{0x1a2c}} = thập phân 6700) chỉ thẳng ra entry nào trong dump.
2. Chụp dump: {{jcmd 12345 Thread.print > dump-1.txt}}, chờ 5 giây, chụp tiếp dump-2, dump-3.
3. Đếm theo trạng thái: {{grep "java.lang.Thread.State" dump-1.txt | sort | uniq -c | sort -rn}}. 200 thread {{BLOCKED}} là chuyện khác 200 thread {{WAITING}}.
4. Tìm lock nóng: đếm số lần mỗi địa chỉ xuất hiện sau {{waiting to lock}} / {{parking to wait for}}, rồi đọc entry của **owner** địa chỉ đó — nếu owner {{RUNNABLE}} trong {{socketRead0}} thì ai đó đang giữ khoá suốt một lần gọi HTTP.
5. Nếu trạng thái đều là {{WAITING}} mà CPU thấp: nghi pool cạn hoặc chờ downstream; mở JFR và xem event {{jdk.JavaMonitorWait}}, {{jdk.SocketRead}}, {{jdk.VirtualizationInformation}}.

> Senior tip: trong đời thực, phần lớn "API treo, CPU 30%" không phải deadlock mà là **giữ khoá xuyên I/O**: một {{synchronized}} bọc luôn {{httpClient.execute(...)}} hoặc {{jdbcTemplate.query(...)}}. Deadlock thì hai thread đứng chết thật; giữ khoá xuyên I/O thì một thread giữ chìa còn 199 thread đứng xếp hàng — dump nhìn y như deadlock nhưng {{Found one Java-level deadlock}} không có. Vì vậy luôn đọc entry của owner trước khi kết luận.

### Liên hệ phỏng vấn
Câu phổ biến: "Phát hiện deadlock bằng thread dump thế nào?", "BLOCKED khác WAITING ở đâu?", "CPU 100% bạn điều tra ra sao?", "Vì sao không nên gọi HTTP trong synchronized?". Khung trả lời: (1) chụp 2-3 dump cách nhau vài giây, (2) đếm trạng thái và tìm lock có nhiều waiter nhất, (3) đọc entry của owner để xem nó đang làm gì, (4) nói rõ giới hạn của dump với khoá ngoài JVM. Bài tập dưới đây bắt bạn tự cài đặt đúng ba bước đó trên một đoạn dump thô, nên bạn sẽ nhớ chính xác {{- waiting to lock}} và {{- waiting on}} khác nhau chỗ nào.`,
  exercises: [
    {
      title: 'DumpAnalyzer: dựng đồ thị chờ, tìm chu trình deadlock và lock bị chờ nhiều nhất',
      prompt: `Viết class {{DumpAnalyzer}} đọc **một** thread dump dạng text (kiểu JDK 17) và trả về ba kết quả. Chỉ dùng chuỗi ({{startsWith}}, {{indexOf}}, {{substring}}), không cần regex.

**Cấu trúc text.** Mỗi thread bắt đầu bằng một dòng **không thụt lề** mà ký tự đầu là dấu nháy kép: tên thread là chuỗi giữa hai dấu nháy đó. Dòng tiếp theo có thể là {{java.lang.Thread.State: <TÊN> (mô tả)}}. Các dòng stack và dòng khoá được thụt lề (tab hay space đều được — hãy dùng {{trim}} khi xét dấu đầu dòng). Dòng đầu file kiểu {{Full thread dump OpenJDK ...}} và dòng trống phải bị bỏ qua.

**Quan hệ giữ và chờ.** Trong entry của thread hiện hành:
- **giữ** lock khi dòng là {{- locked <0xA>}} (monitor) hoặc {{- <0xA>}} (ReentrantLock đang giữ, thuộc mục {{Locked ownable synchronizers}});
- **chờ** lock khi dòng chứa {{- waiting to lock}} hoặc {{- parking to wait for}}, rồi đến {{<0xA>}};
- dòng {{- waiting on <0xA>}} (kết quả của {{wait()}}) **không** phải giữ và **không** phải chờ khoá: bỏ qua.
Địa chỉ lock là chuỗi nằm giữa {{<}} và {{>}} kế tiếp, giữ nguyên prefix {{0x}}. Mỗi thread chỉ lấy lock **đầu tiên** nó chờ; mỗi lock chỉ lấy owner **đầu tiên** tìm thấy.

**Ví dụ một dump có hai vòng deadlock** (monitor và ReentrantLock):

~~~text
"transfer-1" #21 prio=5 os_prio=0 cpu=40.00ms elapsed=90.00s tid=0x1 nid=0x2b40 waiting for lock condition [0x3]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at demo.Transfer.move(Transfer.java:57)
        - waiting to lock <0x000000076abba128> (a demo.Account)
        - locked <0x000000076abba1f0> (a demo.Account)
"transfer-2" #22 prio=5 os_prio=0 cpu=38.00ms elapsed=90.00s tid=0x4 nid=0x2b41 waiting for lock condition [0x5]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at demo.Transfer.move(Transfer.java:57)
        - waiting to lock <0x000000076abba1f0> (a demo.Account)
        - locked <0x000000076abba128> (a demo.Account)
~~~

Ở ví dụ này {{transfer-1}} chờ lock {{...128}} do {{transfer-2}} giữ, còn {{transfer-2}} chờ lock {{...1f0}} do {{transfer-1}} giữ: hai node thành một chu trình.

**Ba hàm cần viết.**
1. {{statesByThread(dump)}} → {{Map<String, String>}} theo thứ tự xuất hiện, key là tên thread, value là **tên trạng thái không kèm phần mô tả trong ngoặc** ({{WAITING}}, không phải {{WAITING (parking)}}). Entry không có dòng State thì **không** có trong map.
2. {{deadlockThreads(dump)}} → {{List<String>}} tên các thread nằm **trên một chu trình** của cạnh "thread chờ lock -> owner của lock đó", **sắp xếp tăng dần theo tên**; không có chu trình thì trả danh sách rỗng. Thread chỉ chờ chèn vào một chu trình (đi tới node trong chu trình nhưng không bao giờ quay lại chính nó) **không** được liệt kê.
3. {{topContendedLocks(dump, k)}} → {{List<String>}} địa chỉ lock, sắp theo **số thread chờ giảm dần**, nếu hoà thì **địa chỉ tăng dần** (so sánh chuỗi), cắt {{k}} phần tử đầu. Chỉ lock có ít nhất một waiter mới xuất hiện. {{k < 0}} → ném {{IllegalArgumentException}}.

Chú ý thực tế: {{- parking to wait for <0xA>}} cũng xuất hiện khi thread chờ một **Condition** (hàng đợi) chứ không chỉ ReentrantLock; khi đó địa chỉ A thường không có owner trong dump, nên nó chỉ góp phần đếm contention chứ không tạo chu trình.`,
      starter: `class DumpAnalyzer {
    static final String[] WAIT_MARKERS = {
        "- waiting to lock <", "- parking to wait for"
    };

    static Map<String, String> statesByThread(String dump) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> deadlockThreads(String dump) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> topContendedLocks(String dump, int k) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static final char Q = '"';
    static int seq = 20;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> type, Runnable r) {
        try {
            r.run();
        } catch (Throwable t) {
            if (type.isInstance(t)) return;
            throw new AssertionError("expected " + type.getSimpleName() + " got " + t);
        }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing was thrown");
    }
    static String entry(String name, String state, String... body) {
        StringBuilder sb = new StringBuilder();
        sb.append(Q).append(name).append(Q).append(" #").append(++seq)
          .append(" prio=5 os_prio=0 cpu=40.00ms elapsed=90.00s tid=0x000001f8c4a11800 nid=0x2b40 waiting on condition [0x00007f3e12bfc000]\\n");
        if (state != null) sb.append("   java.lang.Thread.State: ").append(state).append("\\n");
        for (String line : body) sb.append(line).append("\\n");
        return sb.toString();
    }
    static String dump(String... entries) {
        StringBuilder sb = new StringBuilder();
        sb.append("Full thread dump OpenJDK 64-Bit Server VM (17.0.9+9 mixed mode, sharing):\\n\\n");
        for (String e : entries) sb.append(e).append("\\n");
        return sb.toString();
    }
    static final String ACCT_A = "0x000000076abba128";
    static final String ACCT_B = "0x000000076abba1f0";
    static final String REPORT = "0x000000076abba2a0";
    static final String SETTLE_A = "0x000000076abba3c0";
    static final String SETTLE_B = "0x000000076abba4d0";
    static final String COND = "0x000000076abba5e0";
    static final String SESSION = "0x000000076abba6f0";
    static String waitsMonitor(String addr) { return "\\t- waiting to lock <" + addr + "> (a demo.Account)"; }
    static String holdsMonitor(String addr) { return "\\t- locked <" + addr + "> (a demo.Account)"; }
    static String parks(String addr) {
        return "\\tat jdk.internal.misc.Unsafe.park(Native Method)\\n\\t- parking to wait for  <" + addr + "> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)";
    }
    static String holdsLock(String addr) {
        return "Locked ownable synchronizers:\\n\\t- <" + addr + "> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)";
    }
    static String waitsOnCondition(String addr) {
        return "\\tat java.lang.Object.wait(Native Method)\\n\\t- waiting on <" + addr + "> (a java.lang.Object)";
    }
    static final String DUMP = dump(
        entry("main", "RUNNABLE", "\\tat demo.App.main(App.java:12)"),
        entry("transfer-1", "BLOCKED (on object monitor)", "\\tat demo.Transfer.move(Transfer.java:57)", waitsMonitor(ACCT_A), holdsMonitor(ACCT_B)),
        entry("transfer-2", "BLOCKED (on object monitor)", "\\tat demo.Transfer.move(Transfer.java:57)", waitsMonitor(ACCT_B), holdsMonitor(ACCT_A)),
        entry("pool-1-thread-1", "WAITING (parking)", parks(REPORT)),
        entry("pool-1-thread-2", "WAITING (parking)", parks(REPORT)),
        entry("pool-1-thread-3", "WAITING (parking)", parks(REPORT)),
        entry("cache-writer", "RUNNABLE", "\\tat java.net.SocketInputStream.socketRead0(Native Method)", "\\tat demo.HttpClient.fetch(HttpClient.java:88)", holdsLock(REPORT)),
        entry("settle-a", "WAITING (parking)", parks(SETTLE_A), holdsLock(SETTLE_B)),
        entry("settle-b", "TIMED_WAITING (parking)", parks(SETTLE_B), holdsLock(SETTLE_A)),
        entry("queue-poller", "WAITING (on object monitor)", waitsOnCondition(COND)),
        entry("exec-9", "BLOCKED (on object monitor)", waitsMonitor(SESSION)),
        entry("DestroyJavaVM", null)
    );
    static final String CHAIN = dump(
        entry("t-x", "BLOCKED (on object monitor)", waitsMonitor("0x0000000012345678"), holdsMonitor("0x0000000087654321")),
        entry("t-y", "BLOCKED (on object monitor)", waitsMonitor("0x0000000087654321"), holdsMonitor("0x0000000012345678")),
        entry("t-z", "BLOCKED (on object monitor)", waitsMonitor("0x0000000012345678"))
    );
    static final String NO_CYCLE = dump(
        entry("main", "RUNNABLE"),
        entry("cache-writer", "RUNNABLE", holdsLock(REPORT)),
        entry("pool-1-thread-1", "WAITING (parking)", parks(REPORT))
    );
    public static void main(String[] args) {
        check("statesByThread: đủ 11 entry có State, bỏ qua entry không có State", () -> {
            Map<String, String> st = DumpAnalyzer.statesByThread(DUMP);
            eq(11, st.size());
            eq("RUNNABLE", st.get("main"));
            eq("BLOCKED", st.get("transfer-1"));
            eq("TIMED_WAITING", st.get("settle-b"));
            eq("WAITING", st.get("queue-poller"));
            eq("BLOCKED", st.get("exec-9"));
            if (st.containsKey("DestroyJavaVM")) throw new AssertionError("entry không có State bị chen thẳng");
        });
        check("statesByThread: chỉ lấy tên trạng thái, bỏ mô tả trong ngoặc", () -> {
            Map<String, String> st = DumpAnalyzer.statesByThread(DUMP);
            eq("WAITING", st.get("settle-a"));
            eq("WAITING", st.get("pool-1-thread-2"));
            eq("RUNNABLE", st.get("cache-writer"));
        });
        check("deadlockThreads: bắt cả vòng monitor lẫn vòng ReentrantLock", () -> {
            eq(List.of("settle-a", "settle-b", "transfer-1", "transfer-2"), DumpAnalyzer.deadlockThreads(DUMP));
        });
        check("deadlockThreads: thread chờ chèn vào chu trình không bị coi là deadlock", () -> {
            eq(List.of("t-x", "t-y"), DumpAnalyzer.deadlockThreads(CHAIN));
        });
        check("deadlockThreads: không có chu trình thì trả về rỗng", () -> {
            eq(List.of(), DumpAnalyzer.deadlockThreads(NO_CYCLE));
            eq(List.of(), DumpAnalyzer.deadlockThreads(""));
            eq(List.of(), DumpAnalyzer.deadlockThreads(null));
        });
        check("topContendedLocks: lock có 3 waiter đứng đầu", () -> {
            eq(List.of(REPORT), DumpAnalyzer.topContendedLocks(DUMP, 1));
            eq(List.of(REPORT, ACCT_A, ACCT_B), DumpAnalyzer.topContendedLocks(DUMP, 3));
        });
        check("topContendedLocks: hoà waiter thì sắp địa chỉ tăng dần, k vượt số lock thì trả hết", () -> {
            List<String> all = DumpAnalyzer.topContendedLocks(DUMP, 99);
            eq(6, all.size());
            eq(List.of(REPORT, ACCT_A, ACCT_B, SETTLE_A, SETTLE_B, SESSION), all);
            eq(List.of(), DumpAnalyzer.topContendedLocks(DUMP, 0));
            eq(List.of(REPORT), DumpAnalyzer.topContendedLocks(NO_CYCLE, 3));
        });
        check("wait() trên condition không bị tính là chờ khoá", () -> {
            List<String> locks = DumpAnalyzer.topContendedLocks(DUMP, 99);
            if (locks.contains(COND)) throw new AssertionError("- waiting on bị tính là chờ khoá: " + locks);
            if (DumpAnalyzer.deadlockThreads(DUMP).contains("queue-poller")) throw new AssertionError("queue-poller bi coi la deadlock");
        });
        check("topContendedLocks: lock không có owner trong dump vẫn được đếm chờ, nhưng không tạo chu trình", () -> {
            if (DumpAnalyzer.deadlockThreads(DUMP).contains("exec-9")) throw new AssertionError("exec-9 chưa bao giờ nằm trong vòng");
            if (!DumpAnalyzer.topContendedLocks(DUMP, 99).contains(SESSION)) throw new AssertionError("SESSION thiếu trong danh sách");
            expect(IllegalArgumentException.class, () -> DumpAnalyzer.topContendedLocks(DUMP, -1));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class DumpAnalyzer {
    static final String[] WAIT_MARKERS = { "- waiting to lock <", "- parking to wait for" };

    static Map<String, String> statesByThread(String dump) {
        Map<String, String> out = new LinkedHashMap<>();
        String current = null;
        for (String line : lines(dump)) {
            String name = header(line);
            if (name != null) { current = name; continue; }
            if (current == null) continue;
            String st = state(line);
            if (st != null) out.put(current, st);
        }
        return out;
    }

    static List<String> deadlockThreads(String dump) {
        Map<String, String> owner = ownersByLock(dump);
        Map<String, String> wait = waitsByThread(dump);
        Set<String> inCycle = new TreeSet<>();   // TreeSet: tên sắp tăng dần, kết quả xác định
        for (String start : wait.keySet()) {
            List<String> path = new ArrayList<>();
            String node = start;
            while (node != null) {
                int at = path.indexOf(node);
                if (at >= 0) {                                  // gặp lại node trên đường đi -> có chu trình
                    for (int i = at; i < path.size(); i++) inCycle.add(path.get(i));
                    break;
                }
                path.add(node);
                String lock = wait.get(node);
                node = lock == null ? null : owner.get(lock);   // out-degree = 1 nên chỉ cần đi theo con trỏ
            }
        }
        return new ArrayList<>(inCycle);
    }

    static List<String> topContendedLocks(String dump, int k) {
        if (k < 0) throw new IllegalArgumentException("k phải >= 0: " + k);
        Map<String, Integer> counts = new HashMap<>();
        for (String lock : waitsByThread(dump).values()) counts.merge(lock, 1, Integer::sum);
        List<String> order = new ArrayList<>(counts.keySet());
        order.sort((a, b) -> {
            int byWaiters = Integer.compare(counts.get(b), counts.get(a));   // giảm dần
            return byWaiters != 0 ? byWaiters : a.compareTo(b);              // hoà: tăng dần theo địa chỉ
        });
        return new ArrayList<>(order.subList(0, Math.min(k, order.size())));
    }

    private static Map<String, String> waitsByThread(String dump) {
        Map<String, String> out = new LinkedHashMap<>();
        String current = null;
        for (String line : lines(dump)) {
            String name = header(line);
            if (name != null) { current = name; continue; }
            if (current == null) continue;
            String wanted = waitedLock(line);
            if (wanted != null) out.putIfAbsent(current, wanted);   // chỉ lấy lock đầu tiên
        }
        return out;
    }

    private static Map<String, String> ownersByLock(String dump) {
        Map<String, String> out = new HashMap<>();
        String current = null;
        for (String line : lines(dump)) {
            String name = header(line);
            if (name != null) { current = name; continue; }
            if (current == null) continue;
            String held = ownedLock(line);
            if (held != null) out.putIfAbsent(held, current);       // owner đầu tiên thắng
        }
        return out;
    }

    private static List<String> lines(String text) {
        List<String> out = new ArrayList<>();
        if (text == null) return out;
        for (String line : text.split("\\n")) out.add(line.replace("\\r", ""));
        return out;
    }

    private static String header(String line) {
        if (line.length() < 2 || line.charAt(0) != '"') return null;   // header ở cột 0, mở đầu bằng dấu nháy kép
        int end = line.indexOf('"', 1);
        return end < 0 ? null : line.substring(1, end);
    }

    private static String state(String line) {
        String t = line.trim();
        if (!t.startsWith("java.lang.Thread.State:")) return null;
        String rest = t.substring("java.lang.Thread.State:".length()).trim();
        int sp = rest.indexOf(' ');
        return sp < 0 ? rest : rest.substring(0, sp);   // bỏ "(parking)", "(on object monitor)"
    }

    private static String waitedLock(String line) {
        for (String marker : WAIT_MARKERS) {
            int i = line.indexOf(marker);
            if (i >= 0) return address(line, i);
        }
        return null;
    }

    private static String ownedLock(String line) {
        String t = line.trim();
        if (t.startsWith("- locked <") || t.startsWith("- <0x")) return address(t, 0);   // monitor hoặc ownable synchronizer
        return null;
    }

    private static String address(String line, int from) {
        int open = line.indexOf('<', from);
        if (open < 0) return null;
        int close = line.indexOf('>', open);
        if (close < 0) return null;
        return line.substring(open + 1, close);
    }
}`,
      hints: [
        'Đi tuần tự từng dòng và giữ một biến {{current}} là tên thread entry hiện hành: dòng bắt đầu bằng dấu nháy kép ở cột 0 mở ra entry mới, mọi dòng khác thuộc entry đó.',
        'Đừng xét {{startsWith("- ")}} trên dòng gốc: stack line cũng thụt lề. Dùng {{trim()}} rồi so prefix, hoặc {{indexOf(marker)}} cho dòng chờ.',
        'Mỗi node chỉ có **một** cạnh đi ra, nên tìm chu trình không cần thuật toán phức tạp: đi theo con trỏ và ghi đường đi vào {{List}}; nếu gặp lại một node đã nằm trên đường đi thì chu trình là đoạn từ vị trí đó tới cuối đường đi (node đứng ngoài đoạn này chỉ chờ chèn vào).',
        'Dùng {{TreeSet<String>}} cho tên thread trong chu trình để {{deadlockThreads}} trả về thứ tự tăng dần một cách xác định, và {{Map.merge(lock, 1, Integer::sum)}} để đếm waiter.',
        'Sắp xếp contention: comparator trả {{Integer.compare(counts.get(b), counts.get(a))}} trước, nếu bằng 0 thì {{a.compareTo(b)}} — luôn có tie-break, nếu không kết quả phụ thuộc thứ tự hash.',
      ],
      explain: `Bài này là bản thu nhỏ của việc bạn làm trên production, và mỗi hàm chạm đúng một câu hỏi thật: {{statesByThread}} trả lời "hệ thống đang ở trạng thái nào" (đa số BLOCKED = khoá nóng; đa số WAITING = chờ ai đó đánh thức; đa số RUNNABLE trong {{socketRead}} = chờ downstream). {{topContendedLocks}} trả lời "khoá nào là chỗ nghẽn". {{deadlockThreads}} trả lời "có vòng chết thật không".

Ba chỗ dễ sai nhất khi cài đặt:

- **Nhầm {{- waiting on <0xA>}} với {{- waiting to lock <0xA>}}.** Dòng đầu là {{A.wait()}}: thread đã **nhả** monitor nên nó không còn là người giữ cũng không phải người chờ khoá, nên nếu tính nó vào contention bạn sẽ báo oan một lock không ai chờ.
- **Tính cả owner của lock trong {{Locked ownable synchronizers}}.** Với ReentrantLock, monitor không xuất hiện ở dòng {{- locked}} mà xuất hiện ở mục này, dạng {{- <0xA>}}. Quên nó thì bạn chỉ bắt được deadlock {{synchronized}} và bỏ sót đúng loại hay xảy ra với {{ReentrantLock}} trong code nghiệp vụ.
- **Đưa cả chuỗi chờ vào danh sách deadlock.** Đồ thị có out-degree bằng 1, nhưng {{t-z -> t-y -> t-x -> t-y}} nhưng {{t-z}} chỉ **chờ một nạn nhân**, không phải là nạn nhân: nó sẽ được giải thoát ngay khi vòng lặp bị phá. Thuật toán phải đánh dấu đoạn từ lần xuất hiện đầu của node bị gặp lại, nhưng không đánh dấu cả đường đi.

Sau khi có kết quả, bước quyết định vẫn là **đọc entry của owner**: owner {{BLOCKED}} trong một chu trình = deadlock thật, cần restart; owner {{RUNNABLE}} trong {{socketRead0}} hoặc {{jdbc}} = đang giữ khoá xuyên I/O, cần sửa code (thu nhỏ vùng khoá, hoặc tách việc gọi HTTP ra ngoài khoá) chứ restart không giúp gì. Và đừng quên giới hạn: khoá Redis, row lock MySQL hay hàng đợi không bao giờ hiện ra ở đây — khi đó bằng chứng phải lấy từ log driver DB, metrics pool, hoặc JFR.`,
    },
  ],
  check: [
    {
      q: 'Một thread hiện {{java.lang.Thread.State: RUNNABLE}} với frame trên cùng là {{java.net.SocketInputStream.socketRead0}}. Kết luận **đúng nhất**?',
      options: [
        'Thread đang ngốn CPU, cần xem ngay {{top -H -p}}',
        'Thread đang chờ dữ liệu từ socket: JVM gộp cả "đang chạy" và "đang chặn I/O ở tầng hệ điều hành" vào RUNNABLE',
        'Thread đang bị deadlock và cần restart',
        'Thread đã chạy xong và sắp bị thu gom',
      ],
      answer: 1,
      explain: `{{java.lang.Thread}} không có trạng thái "đang chờ DB" hay "đang chờ socket", nên mọi thread chặn trong read/write socket vẫn khai RUNNABLE. Đây chính là lý do một hệ API treo với CPU 30% thường có hàng trăm entry RUNNABLE trong {{socketRead0}} — vấn đề nằm ở downstream, không ở CPU. Muốn biết thread có thật sự chạy không, so {{cpu=...}} giữa hai dump hoặc nhìn {{top -H}}.`,
    },
    {
      q: 'Dòng {{- waiting on <0x000000076abba5e0> (a java.lang.Object)}} trong stack nghĩa là gì?',
      options: [
        'Thread muốn vào {{synchronized}} nhưng không lấy được monitor',
        'Thread đang chờ một ReentrantLock và có thể bị deadlock',
        'Thread đã gọi {{wait()}}: nó **nhả** monitor và đang chờ {{notify()}}, nên không giữ cũng không chờ khoá',
        'Thread vừa mở một kết nối socket và đang bắt tay TCP',
      ],
      answer: 2,
      explain: `{{obj.wait()}} trả monitor cho người khác rồi ngủ trên **condition queue** của chính object đó — vì vậy thread này ở trạng thái {{WAITING (on object monitor)}}, không phải {{BLOCKED}}. Hai dòng cần phân biệt: {{- waiting to lock <0xA>}} = chưa vào được {{synchronized}} (kẻ chờ khoá), {{- waiting on <0xA>}} = đang chờ được đánh thức (không tranh khoá). Nhầm hai dòng này là lỗi kinh điển khi đếm lock contention.`,
    },
    {
      q: 'Kiểu kẹt nào thread dump **không** giúp bạn phát hiện?',
      options: [
        'Hai thread giữ monitor của nhau tạo thành vòng',
        'Toàn bộ worker {{pool-1-thread-*}} đều {{WAITING (parking)}} trên cùng một ReentrantLock',
        'Deadlock row lock giữa hai transaction MySQL, hoặc khoá phân tán trên Redis',
        'Một thread {{BLOCKED}} có {{elapsed}} tăng dần mà stack không đổi',
      ],
      answer: 2,
      explain: `JVM chỉ dựng được đồ thị chờ cho monitor và ownable synchronizer của **chính nó**. Khoá do DB server (InnoDB row lock) hay Redis/ZooKeeper quản lý nằm ngoài tiến trình, nên không hiện ra; InnoDB thậm chí tự phát hiện và trả lỗi 1213. Với các case đó, dấu hiệu trong dump chỉ là triệu chứng (pool cạn thread, chờ {{socketRead}} dài), còn bằng chứng phải lấy từ {{information_schema.innodb_trx}} / {{sys.innodb_lock_waits}}, log driver, hoặc JFR {{jdk.JavaMonitorWait}} và {{jdk.SocketRead}}.`,
    },
    {
      q: 'Vì sao nên chụp **hai hoặc ba** dump cách nhau 5-10 giây thay vì chỉ một?',
      options: [
        'Vì mỗi dump chỉ chụp được 64 thread đầu tiên',
        'Vì một dump là ảnh chụp: phải so sánh mới biết thread nào đứng yên (kẹt thật) và thread nào vẫn đổi stack frame (chậm nhưng còn tiến)',
        'Vì JVM chỉ in mục Locked ownable synchronizers ở dump thứ hai',
        'Vì dump đầu tiên luôn sai do chưa tới safepoint',
      ],
      answer: 1,
      explain: `Dump là snapshot nên nó không cho biết hướng đi. Hai snapshot cạnh nhau trả lời câu hỏi quan trọng nhất của incident: "thread này có tiến không". Thread giữ nguyên một stack frame và {{cpu}} không tăng = kẹt; thread vẫn nhảy frame = hệ đang chậm chứ không chết. Còn {{Locked ownable synchronizers}} phụ thuộc cờ {{-l}} / {{jcmd}}, không phụ thuộc thứ tự chụp; mọi dump đều được lấy tại safepoint.`,
    },
  ],
  related: ['concurrency-006', 'concurrency-021', 'concurrency-031', 'jvm-006'],
  tags: ['thread dump', 'jstack', 'jcmd', 'deadlock', 'BLOCKED', 'WAITING', 'monitor', 'ReentrantLock', 'lock contention'],
},
{
  id: 'lesson-jvm-008',
  track: 'jvm',
  order: 8,
  title: 'GC thế hệ thu nhỏ: eden, survivor, tuổi object và premature promotion',
  level: 'senior',
  minutes: 35,
  goals: [
    'Mô tả được young generation gồm Eden và hai Survivor và object di chuyển thế nào giữa chúng',
    'Giải thích được minor GC copy các object còn sống sang Survivor rồi tăng tuổi',
    'Hiểu được promotion sang old generation khi tuổi vượt MaxTenuringThreshold hoặc Survivor đầy',
    'Nhận diện được premature promotion và tác động của nó tới full GC',
  ],
  body: `**Tóm tắt:** Young generation (thế hệ trẻ) trong heap chia thành Eden và hai vùng Survivor. Object mới sinh ra ở Eden; khi Eden đầy, minor GC copy các object còn sống sang Survivor và tăng "tuổi" (số lần sống sót). Object vượt ngưỡng tuổi hoặc khi Survivor đầy sẽ bị promote (thăng hạng) sang old generation (thế hệ già). Cơ chế copy giúp thu gom rác nhanh và chống phân mảnh, nhưng nếu Survivor quá nhỏ sẽ gây premature promotion (thăng hạng sớm), làm old đầy nhanh và dẫn tới full GC/pause dài.

### 1) Các khái niệm cần hiểu trước (giải thích từ đầu)

- **JVM (Java Virtual Machine)**: máy ảo chạy chương trình Java; nó quản lý bộ nhớ thay cho lập trình viên.
- **Heap**: vùng bộ nhớ trên RAM mà JVM dùng để lưu các **object** (đối tượng — thực thể dữ liệu tạo ra bằng {{new}}, ví dụ {{new Order()}}).
- **GC / Garbage Collector (bộ thu gom rác)**: cơ chế tự động của JVM tìm và giải phóng bộ nhớ của các object không còn được dùng nữa, để bạn không phải {{free}} tay như C/C++.
- **Root (gốc)**: điểm xuất phát mà GC dùng để xét "còn dùng hay không" — ví dụ biến local trên stack của thread đang chạy, field {{static}}, tham chiếu JNI. Một object được coi là **reachable** (chạm tới được) nếu đi theo chuỗi tham chiếu từ root vẫn tới được nó; object không reachable là "rác".
- **Pause (dừng tạm)**: khoảng thời gian ứng dụng bị dừng để GC làm việc (tùy collector có thể dừng ngắn hoặc gần như không dừng, nhưng minor GC truyền thống thường có pause ngắn).
- **Phân mảnh (fragmentation)**: bộ nhớ trống bị chia thành nhiều mảnh nhỏ rời rạc, khó cấp phát object lớn liền mạch.

### 2) Vì sao heap lại chia thành các thế hệ (generational)?

Quan sát thực tế (gọi là **weak generational hypothesis** — giả thuyết thế hệ yếu): **đa số object "chết trẻ"**. Ví dụ trong một request HTTP, bạn tạo {{DTO}}, {{String}}, {{List}} tạm; request xong là chúng không còn ai giữ tham chiếu → thành rác ngay.

Nếu GC quét toàn bộ heap mỗi lần thì rất tốn công, dù phần lớn object vừa tạo đã chết. Vì vậy JVM chia heap thành:
- **Young generation (thế hệ trẻ)**: nơi object mới sinh ra; GC quét vùng này thường xuyên.
- **Old generation / Tenured (thế hệ già)**: nơi chứa object đã sống sót qua nhiều lần GC (thường là cache, session, cấu trúc sống lâu).

Quét riêng young gen nhanh vì vùng nhỏ và tỉ lệ chết cao.

### 3) Cấu trúc bên trong Young generation: Eden + 2 Survivor

Young generation không phải một khối liền mà gồm 3 vùng:

~~~text
Young Generation
+---------------------------+-----------+-----------+
|           Eden            |    S0     |    S1     |
|   (nơi object mới sinh)   | (from/to) | (from/to) |
+---------------------------+-----------+-----------+
                               ^           ^
                               |           |
                     tại 1 thời điểm chỉ 1 vùng
                     chứa object sống; vùng kia rỗng
~~~

- **Eden**: "vườn địa đàng" — mọi object mới ({{new}}) được cấp phát ở đây. Cấp phát trong Eden thường là **bump-the-pointer** (dịch con trỏ cấp phát lên một đoạn): cực nhanh. Để tránh tranh chấp giữa nhiều thread, JVM cấp cho mỗi thread một mảnh nhỏ riêng gọi là **TLAB (Thread-Local Allocation Buffer)** — vùng đệm cấp phát cục bộ theo thread.
- **Survivor S0 và S1** (còn gọi là from-space / to-space): hai vùng kích thước bằng nhau. Tại một thời điểm, chỉ **một** vùng Survivor chứa object sống sót; vùng còn lại để trống, dành cho lần GC kế tiếp.

### 4) Minor GC hoạt động thế nào (copy, không sweep)

**Minor GC** (còn gọi là young GC) xảy ra khi **Eden đầy**. Nó dùng chiến lược **copying collector** (bộ thu gom kiểu sao chép) thay vì "sweep" (quét và đánh dấu xóa tại chỗ):

1. JVM xác định các object **còn sống** (reachable) trong Eden và Survivor đang active bằng cách lần theo tham chiếu từ root. Lưu ý: một object ở old gen có thể trỏ vào young gen; JVM dùng cấu trúc phụ như **card table** (bảng thẻ — đánh dấu vùng old gen có ghi tham chiếu vào young) hoặc **remembered set** (tập nhớ — G1 dùng theo vùng/region) để không phải quét cả old gen khi chạy minor GC.
2. Copy các object sống sang **Survivor trống** (to-space). Mỗi object có một **age** (tuổi, lưu trong object header) — tăng lên 1 mỗi lần sống sót qua minor GC.
3. Sau khi copy xong, **toàn bộ Eden và Survivor cũ** được coi là rỗng trong nháy mắt. Không cần duyệt từng object chết → thu hồi rất nhanh.

Ví dụ luồng di chuyển (đơn giản hóa):

~~~text
Trước minor GC:
Eden: [A][B][C][D][E] (đầy)   S0(active): [F]   S1: (rỗng)
Roots chỉ còn chạm tới A, C, F

Sau minor GC:
Eden: (rỗng)                   S0: (rỗng)        S1(active): [A(age1)][C(age1)][F(age2)]
B,D,E biến mất (không copy). F tăng tuổi vì đã sống sót thêm 1 lần.
~~~

### 5) Promotion (thăng hạng) sang Old generation: khi nào?

Object không ở young mãi. Nó được **promote** (chuyển) sang old generation khi:
- **Tuổi vượt ngưỡng** {{-XX:MaxTenuringThreshold}}: trên HotSpot giá trị tối đa là 15 (vì tuổi lưu trong 4 bit của object header). Mặc định thường là 15. "Vượt ngưỡng" nghĩa là sau khi tăng tuổi, {{age > threshold}} → promote. (JVM cũng có cơ chế **adaptive tenuring** tự điều chỉnh ngưỡng thực tế dựa trên lượng object sống trong Survivor.)
- **Object quá lớn**: một số cấu hình/collector cho phép cấp phát trực tiếp vào old gen để tránh copy tốn kém (ví dụ cơ chế pretenure; với G1, object rất lớn thành "humongous region").
- **Survivor không đủ chỗ** (xem mục 6): promote sớm.

### 6) Premature promotion — nguy cơ hay gặp trên production

**Premature promotion** (thăng hạng sớm) xảy ra khi **Survivor không đủ chứa** toàn bộ object sống sót qua minor GC. JVM buộc phải đẩy một phần object sang old generation dù chúng có thể sẽ chết ở lần GC sau.

Hậu quả: old generation đầy nhanh hơn → kích hoạt **major GC / old GC / full GC** (tùy collector; hiểu đơn giản là GC phải xử lý vùng old, thường tốn thời gian và gây pause dài hơn minor GC) sớm hơn → latency (độ trễ) tăng đột ngột.

Nguyên nhân thường gặp:
- Young gen hoặc Survivor quá nhỏ (tuning sai {{-XX:NewRatio}}, {{-XX:SurvivorRatio}}, {{-Xmn}}).
- **Allocation rate** (tốc độ cấp phát object, ví dụ MB/giây) tăng đột biến do traffic hoặc code tạo nhiều object tạm.
- Một đợt request tạo nhiều object sống tạm thời lâu hơn 1 chu kỳ minor GC.

G1 GC có cơ chế **adaptive** tự chỉnh kích thước young gen theo mục tiêu pause ({{-XX:MaxGCPauseMillis}}), nhưng vẫn cần theo dõi.

### 7) Vì sao copy lại tốt (và đánh đổi gì)?

- **Nhanh với rác nhiều**: chỉ đụng vào object sống; object chết không tốn công xử lý. Sau GC, Eden rỗng → cấp phát lại bằng bump-pointer, rất nhanh.
- **Chống phân mảnh**: object sống được dồn liền nhau vào Survivor/to-space.
- **Đánh đổi**: tốn thêm bộ nhớ cho vùng đích (cần Survivor trống); phải cập nhật mọi tham chiếu trỏ tới object đã bị di chuyển (forwarding).

### 8) Lỗi hay gặp / dấu hiệu trên production

- Old gen tăng đều sau mỗi lần full GC, **live set** (tập object thực sự còn sống) không giảm → nghi ngờ **memory leak** (rò rỉ bộ nhớ: giữ tham chiếu không cần thiết), không phải chỉ "thiếu heap".
- Allocation rate cao nhưng minor GC pause vẫn thấp, old gen ổn định → young gen đang làm việc tốt.
- Pause dài xuất hiện dù heap còn trống → kiểm tra premature promotion, kích thước Survivor, hoặc full GC do metaspace/explicit GC (tùy cấu hình).

> Senior tip: Trước khi tăng {{-Xmx}}, hãy xem GC log ({{-Xlog:gc*}} trên JDK 9+) và allocation rate. Nếu old gen tăng đều qua các full GC, lấy heap dump và tìm **retained set** (tập object bị giữ lại) bằng dominator tree; "thêm RAM" chỉ hoãn crash. Nếu nghi premature promotion, kiểm tra kích thước Survivor và pattern tạo object theo request.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Minor GC khác major/full GC thế nào?", "Khi nào object được promote?", "Premature promotion là gì và xử lý thế nào?". Trả lời theo chuỗi **Eden đầy → copy object sống → tăng tuổi → promote khi vượt ngưỡng / Survivor đầy**, kèm 1 ví dụ allocation rate, sẽ thuyết phục hơn liệt kê tên collector. Bài tập dưới đây bắt bạn tự mô phỏng MiniHeap với {{allocate/minorGc}} trên đồ thị tham chiếu để hiểu đúng reachability, tuổi và promotion.`,
  exercises: [
    {
      title: 'MiniHeap mô phỏng generational GC',
      prompt: `Hoàn thiện {{MiniHeap}} mô phỏng young generation với Eden và hai Survivor.

Yêu cầu:
- {{allocate(id)}}: tạo object mới trong Eden; id trùng ném {{IllegalArgumentException}}.
- {{addRef(from, to)}}: thêm tham chiếu; nếu id không tồn tại ném {{IllegalArgumentException}}.
    - {{minorGc(roots, tenuringThreshold)}}: copy object sống từ Eden + Survivor hiện tại sang Survivor còn lại, tăng tuổi; object có tuổi > tenuringThreshold được promote sang old; trả về số object được promote.
- {{edenSize()}} / {{survivorSize()}} / {{oldSize()}}: số object ở mỗi vùng.
- {{isInOld(id)}}: true nếu object đã promote.

Minor GC phải xử lý chu trình và đồ thị chia sẻ đúng như GC reachability.`,
      starter: `class MiniHeap {
    static final class Obj {
        final int id;
        final List<Integer> refs = new ArrayList<>();
        int age;
        boolean inOld;
        Obj(int id) { this.id = id; }
    }

    private final Map<Integer, Obj> objects = new LinkedHashMap<>();
    private final Set<Integer> eden = new LinkedHashSet<>();
    private final Set<Integer> survivorA = new LinkedHashSet<>();
    private final Set<Integer> survivorB = new LinkedHashSet<>();
    private Set<Integer> activeSurvivor = survivorA;
    private Set<Integer> inactiveSurvivor = survivorB;

    Obj allocate(int id) {
        throw new UnsupportedOperationException("TODO");
    }

    void addRef(int from, int to) {
        throw new UnsupportedOperationException("TODO");
    }

    int minorGc(Set<Integer> roots, int tenuringThreshold) {
        throw new UnsupportedOperationException("TODO");
    }

    int edenSize() { return eden.size(); }
    int survivorSize() { return activeSurvivor.size(); }
    int oldSize() {
        int n = 0;
        for (Obj o : objects.values()) if (o.inOld) n++;
        return n;
    }
    boolean isInOld(int id) {
        Obj o = objects.get(id);
        return o != null && o.inOld;
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void throwsIae(Runnable r) {
        try { r.run(); } catch (IllegalArgumentException e) { return; }
        throw new AssertionError("phải ném IllegalArgumentException");
    }
    public static void main(String[] args) {
        check("allocate và addRef cơ bản", () -> {
            MiniHeap h = new MiniHeap();
            h.allocate(1); h.allocate(2);
            h.addRef(1, 2);
            eq(2, h.edenSize());
            throwsIae(() -> h.allocate(1));
            throwsIae(() -> h.addRef(1, 99));
        });
        check("minor GC copy object sống sang survivor", () -> {
            MiniHeap h = new MiniHeap();
            h.allocate(1); h.allocate(2); h.allocate(3);
            h.addRef(1, 2);
            int promoted = h.minorGc(Set.of(1), 10);
            eq(0, promoted);
            eq(0, h.edenSize());
            eq(2, h.survivorSize());
            eq(0, h.oldSize());
        });
        check("object chết không được copy", () -> {
            MiniHeap h = new MiniHeap();
            h.allocate(1); h.allocate(2);
            int promoted = h.minorGc(Set.of(), 10);
            eq(0, promoted);
            eq(0, h.edenSize());
            eq(0, h.survivorSize());
            eq(0, h.oldSize());
        });
        check("promotion khi tuổi vượt threshold", () -> {
            MiniHeap h = new MiniHeap();
            h.allocate(1);
            h.minorGc(Set.of(1), 1);
            eq(1, h.survivorSize());
            int promoted = h.minorGc(Set.of(1), 1);
            eq(1, promoted);
            eq(1, h.oldSize());
            eq(0, h.survivorSize());
        });
        check("chu trình và đồ thị chia sẻ được xử lý đúng", () -> {
            MiniHeap h = new MiniHeap();
            h.allocate(1); h.allocate(2); h.allocate(3);
            h.addRef(1, 2); h.addRef(2, 3); h.addRef(3, 1);
            h.allocate(4);
            h.addRef(1, 4);
            int promoted = h.minorGc(Set.of(1), 10);
            eq(0, promoted);
            eq(4, h.survivorSize());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class MiniHeap {
    static final class Obj {
        final int id;
        final List<Integer> refs = new ArrayList<>();
        int age;
        boolean inOld;
        Obj(int id) { this.id = id; }
    }

    private final Map<Integer, Obj> objects = new LinkedHashMap<>();
    private final Set<Integer> eden = new LinkedHashSet<>();
    private final Set<Integer> survivorA = new LinkedHashSet<>();
    private final Set<Integer> survivorB = new LinkedHashSet<>();
    private Set<Integer> activeSurvivor = survivorA;
    private Set<Integer> inactiveSurvivor = survivorB;

    Obj allocate(int id) {
        if (objects.containsKey(id)) throw new IllegalArgumentException("duplicate id " + id);
        Obj o = new Obj(id);
        objects.put(id, o);
        eden.add(id);
        return o;
    }

    void addRef(int from, int to) {
        Obj a = objects.get(from);
        Obj b = objects.get(to);
        if (a == null || b == null) throw new IllegalArgumentException("unknown object");
        a.refs.add(to);
    }

    int minorGc(Set<Integer> roots, int tenuringThreshold) {
        Set<Integer> live = new LinkedHashSet<>();
        Deque<Integer> stack = new ArrayDeque<>();
        for (int r : roots) if (!objects.containsKey(r)) throw new IllegalArgumentException("unknown root " + r);
        for (int r : roots) stack.push(r);
        while (!stack.isEmpty()) {
            Obj o = objects.get(stack.pop());
            if (o == null || live.contains(o.id) || o.inOld) continue;
            live.add(o.id);
            for (int next : o.refs) stack.push(next);
        }
        int promoted = 0;
        Set<Integer> target = inactiveSurvivor;
        target.clear();
        for (int id : live) {
            Obj o = objects.get(id);
            if (o.inOld) continue;
            if (eden.contains(id) || activeSurvivor.contains(id)) {
                o.age++;
                if (o.age > tenuringThreshold) {
                    o.inOld = true;
                    promoted++;
                } else {
                    target.add(id);
                }
            }
        }
        eden.clear();
        activeSurvivor.clear();
        Set<Integer> tmp = activeSurvivor;
        activeSurvivor = inactiveSurvivor;
        inactiveSurvivor = tmp;
        inactiveSurvivor.clear();
        return promoted;
    }

    int edenSize() { return eden.size(); }
    int survivorSize() { return activeSurvivor.size(); }
    int oldSize() {
        int n = 0;
        for (Obj o : objects.values()) if (o.inOld) n++;
        return n;
    }
    boolean isInOld(int id) {
        Obj o = objects.get(id);
        return o != null && o.inOld;
    }
}`,
      hints: [
        'Minor GC là reachability từ roots: DFS/BFS trên refs, bỏ qua object đã inOld.',
        'Object sống được copy sang survivor còn lại: tăng age, nếu age >= threshold thì promote (inOld = true).',
        'Sau GC: Eden và survivor cũ rỗng; hoán đổi active/inactive survivor.',
      ],
      explain: `Minor GC mô phỏng cơ chế copy collector: chỉ đi theo cạnh từ root để tìm object sống, rồi copy chúng sang survivor mới. Object chết không được copy nên biến mất trong nháy mắt. Tuổi tăng mỗi lần sống sót; vượt threshold thì promote sang old.

Lỗi hay gặp:
- Không reset survivor cũ: object chết vẫn còn trong danh sách, size báo sai.
- Hoán đổi active/inactive sai thứ tự: survivorSize trả về vùng rỗng.
- Quên bỏ qua object đã inOld: promote lại nhiều lần.
- Không xử lý chu trình: DFS phải đánh dấu visited (dùng Set live) để không lặp vô hạn.

Trong JVM thật, minor GC còn phải xét tham chiếu từ old generation vào young (card table / remembered set), và object quá lớn có thể được allocate trực tiếp trong old.`,
    },
  ],
  check: [
    {
      q: 'Minor GC (young GC) trong generational collector chủ yếu làm gì?',
      options: [
        'Quét (sweep) toàn bộ heap rồi dồn (compact) mọi object',
        'Copy các object còn sống từ Eden/Survivor sang Survivor còn lại, đồng thời tăng tuổi (age)',
        'Thu hồi object trong old generation (thế hệ già)',
        'Xoá metadata class trong metaspace',
      ],
      answer: 1,
      explain: `**Đúng (B):** Minor GC chỉ xử lý **young generation** (Eden + Survivor). Nó tìm các object còn **reachable** (chạm tới từ root) rồi **copy** sang Survivor trống, tăng **age** (tuổi — số lần sống sót). Sau đó Eden và Survivor cũ được coi là rỗng, nên thu hồi rác rất nhanh mà không phải duyệt từng object chết.

**Sai (A):** "Sweep toàn bộ heap + compact" mô tả kiểu full/major GC (tùy collector), phạm vi là cả heap/old gen, thường tốn thời gian và gây pause dài hơn.
**Sai (C):** Old generation không phải đối tượng chính của minor GC (minor GC chỉ cần card table/remembered set để biết tham chiếu old→young).
**Sai (D):** Metaspace (lưu metadata class) có cơ chế thu hồi riêng, không phải việc của minor GC young gen.`,
    },
    {
      q: 'Premature promotion (thăng hạng sớm) xảy ra khi nào?',
      options: [
        'Khi Survivor không đủ chỗ chứa object sống sót nên một phần bị đẩy sang old generation sớm',
        'Khi object vừa được tạo có tuổi (age) bằng 0',
        'Khi Eden được cấu hình quá lớn',
        'Khi full GC chạy quá thường xuyên',
      ],
      answer: 0,
      explain: `**Đúng (A):** Sau minor GC, mọi object sống phải được copy sang Survivor trống. Nếu lượng object sống lớn hơn sức chứa Survivor, JVM không còn chỗ copy → buộc phải **promote sớm** một phần sang old generation, dù các object đó lẽ ra có thể chết ở lần minor GC sau. Hậu quả: old đầy nhanh → full/major GC sớm hơn → pause dài.

**Sai (B):** Object mới sinh ở Eden có tuổi 0 là bình thường; đây không phải premature promotion.
**Sai (C):** Eden lớn không trực tiếp gây premature promotion; vấn đề nằm ở Survivor/young sizing và lượng object sống sót.
**Sai (D):** Full GC chạy thường xuyên thường là **hậu quả** (do old đầy, đôi khi vì premature promotion/memory leak), không phải nguyên nhân gây premature promotion.`,
    },
    {
      q: 'Object thường được promote sang old generation khi nào (theo cơ chế tuổi)?',
      options: [
        'Ngay khi nó được tạo bằng từ khóa new',
        'Khi tuổi (age) của nó vượt ngưỡng MaxTenuringThreshold sau các lần sống sót qua minor GC',
        'Khi nó được gán vào một biến static',
        'Khi minor GC không chạy được vì thiếu bộ nhớ',
      ],
      answer: 1,
      explain: `**Đúng (B):** Mỗi lần object sống sót qua minor GC, **age** tăng 1. Khi {{age > -XX:MaxTenuringThreshold}} (giá trị tối đa 15 trên HotSpot vì lưu trong 4 bit object header; mặc định thường 15) thì object được promote sang old. Đây là cơ chế "đủ lâu thì chuyển sang thế hệ già".

**Sai (A):** {{new}} cấp phát ở Eden (young gen), không vào thẳng old (trừ trường hợp đặc biệt như object rất lớn/humongous tùy collector).
**Sai (C):** Biến {{static}} là một **root** giữ tham chiếu, làm object dễ sống lâu, nhưng bản thân việc gán vào static không tự động promote; promotion vẫn theo cơ chế GC/tuổi hoặc chính sách cấp phát.
**Sai (D):** Minor GC "không chạy được" không phải quy tắc promote; nếu GC không thu hồi đủ bộ nhớ, JVM sẽ ném {{OutOfMemoryError}} (tùy tình huống).`,
    },
  ],
  related: ['jvm-002', 'jvm-004', 'jvm-005'],
  tags: ['GC', 'generational', 'minor GC', 'promotion', 'Survivor', 'Eden'],
},
{
  id: 'lesson-jvm-009',
  track: 'jvm',
  order: 9,
  title: 'Heap, Stack, Metaspace và các loại OutOfMemoryError: Cách chẩn đoán từ log',
  level: 'senior',
  minutes: 40,
  goals: [
    'Phân biệt được dữ liệu nào nằm ở Heap, Stack và Metaspace để gán bộ nhớ đúng chỗ',
    'Giải thích được vì sao đệ quy gây ra {{StackOverflowError}} còn tạo object gây ra {{OutOfMemoryError}}',
    'Nhận diện đúng 5 loại {{OutOfMemoryError}} phổ biến từ log và biết vùng nhớ nào đang bị cạn kiệt',
    'Đề xuất được tham số JVM phù hợp ({{-Xmx}}, {{-Xss}}, {{-XX:MaxMetaspaceSize}}) để xử lý từng loại lỗi',
  ],
  body: `**Tóm tắt:** JVM chia bộ nhớ thành nhiều vùng với mục đích khác nhau: **Heap** lưu object dùng chung cho các thread, **Stack** lưu biến local riêng cho mỗi thread, và **Metaspace** lưu thông tin class. Khi một vùng cạn kiệt, JVM ném ra lỗi tương ứng. Hiểu đúng thông điệp lỗi trong log giúp bạn biết ngay cần tăng tham số nào ({{-Xmx}}, {{-Xss}}, hay {{-XX:MaxMetaspaceSize}}) hoặc cần đi tìm memory leak ở đâu thay vì đoán mò.

### 1) Heap vs Stack vs Metaspace: Cái gì nằm ở đâu?

Để quản lý bộ nhớ hiệu quả, JVM chia RAM thành các khu vực riêng biệt:

| Vùng nhớ | Chứa gì | Phạm vi | Tham số điều chỉnh |
|---|---|---|---|
| **Heap** | Mọi object tạo bằng {{new}}, kể cả mảng. | Toàn bộ thread dùng chung | {{-Xms}} (min), {{-Xmx}} (max) |
| **Stack** | Biến primitive (int, long...), tham chiếu (con trỏ) tới object, stack frame của method. | Riêng cho mỗi thread | {{-Xss}} (mặc định ~1MB/thread) |
| **Metaspace** | Metadata của class (cấu trúc, method, hằng số). Lưu ở Native Memory. | Toàn bộ thread dùng chung | {{-XX:MaxMetaspaceSize}} |

**Ví dụ đời thực:** Hãy tưởng tượng Heap là **kho chứa hàng** lớn dùng chung cho cả công ty; Stack là **bàn làm việc cá nhân** của từng nhân viên; và Metaspace là **cuốn sổ tay quy trình** ghi lại cách làm việc của từng bộ phận.
- Nếu kho đầy (Heap space), bạn không thể nhập thêm hàng mới.
- Nếu bàn làm việc chất quá nhiều giấy tờ chồng lên nhau (Stack overflow), bạn không còn chỗ để viết.
- Nếu cuốn sổ tay quy trình quá dày (Metaspace), thư viện không còn chỗ chứa.

### 2) Hiểu về Stack và lỗi {{StackOverflowError}}

Mỗi khi bạn gọi một method, JVM tạo ra một **Stack Frame** đẩy vào Stack của thread đó. Frame chứa các biến local của method đó. Khi method chạy xong, frame bị pop (xoá) ra.

- **Nguyên nhân gây lỗi:** Nếu bạn gọi đệ quy vô hạn hoặc đệ quy quá sâu, các frame cứ chồng chất mãi mà không được xoá, cho đến khi vượt quá kích thước {{-Xss}} (thường là 1MB).
- **Dấu hiệu:** Log ghi {{java.lang.StackOverflowError}}, đi kèm một stack trace lặp đi lặp lại cùng một method hàng nghìn lần.
- **Cách xử lý:** Kiểm tra điều kiện dừng của đệ quy. Đừng vội tăng {{-Xss}} vì nó sẽ làm giảm số lượng thread mà hệ thống có thể tạo ra (do mỗi thread chiếm 1MB RAM thật).

### 3) Năm loại lỗi bộ nhớ kinh điển

Khi JVM gặp sự cố về bộ nhớ, nó ném ra các loại lỗi khác nhau. Phổ biến nhất là {{java.lang.OutOfMemoryError}} (OOM) cho các vùng heap/metaspace/native, và {{java.lang.StackOverflowError}} cho stack. Mỗi loại chỉ ra một "thủ phạm" khác nhau:

#### A. {{OutOfMemoryError: Java heap space}}
- **Cái gì hết:** Vùng Heap.
- **Vì sao:** Bạn tạo quá nhiều object sống lâu (ví dụ nạp 1 triệu bản ghi từ DB vào List) hoặc có **Memory Leak** (object không còn dùng nhưng vẫn bị một biến static trỏ tới).
- **Cách xử lý:** Lấy heap dump ({{.hprof}}), dùng MAT tìm xem object nào chiếm nhiều bộ nhớ nhất. Nếu code đúng mà thiếu thật thì tăng {{-Xmx}}.

#### B. {{OutOfMemoryError: GC overhead limit exceeded}}
- **Cái gì hết:** Thời gian của CPU (và hiệu quả GC).
- **Vì sao:** JVM dành hơn 98% thời gian để chạy GC nhưng chỉ thu hồi được dưới 2% bộ nhớ. Đây là dấu hiệu Heap sắp đầy và GC đang "vùng vẫy" trong tuyệt vọng.
- **Cách xử lý:** Giống như lỗi Heap space. Đây là lời cảnh báo sớm trước khi Heap thực sự cạn kiệt.

#### C. {{OutOfMemoryError: Metaspace}}
- **Cái gì hết:** Bộ nhớ lưu thông tin Class (Metaspace, bộ nhớ native).
- **Vì sao:** Ứng dụng nạp quá nhiều class (thường gặp khi dùng nhiều framework sinh proxy động như CGLIB, Groovy, hoặc hot-reload webapp nhiều lần mà không restart server).
- **Cách xử lý:** Kiểm tra Classloader leak. Nếu cần thiết thì tăng {{-XX:MaxMetaspaceSize}}.

#### D. {{OutOfMemoryError: Direct buffer memory}}
- **Cái gì hết:** Bộ nhớ Native (ngoài Heap) dùng cho NIO.
- **Vì sao:** Bạn dùng {{ByteBuffer.allocateDirect()}} (thường qua Netty, Kafka, hoặc xử lý file lớn) nhưng không giải phóng đúng cách hoặc tốc độ giải phóng chậm hơn tốc độ cấp phát.
- **Cách xử lý:** Tăng {{-XX:MaxDirectMemorySize}} hoặc kiểm tra việc đóng các resource NIO.

#### E. {{OutOfMemoryError: Unable to create new native thread}}
- **Cái gì hết:** Tài nguyên của Hệ điều hành (OS) cho thread stack.
- **Vì sao:** Ứng dụng tạo quá nhiều thread (ví dụ mỗi request tạo 1 thread mới mà không dùng Thread Pool). OS từ chối vì hết bộ nhớ cho stack hoặc vượt quá giới hạn {{ulimit}}.
- **Cách xử lý:** Sử dụng Thread Pool ({{ExecutorService}}) và giới hạn số thread tối đa.

#### F. {{StackOverflowError}} (không phải OOM)
- **Cái gì hết:** Stack của một thread.
- **Vì sao:** Đệ quy vô hạn hoặc đệ quy quá sâu, các frame chồng chất vượt quá {{-Xss}} (mặc định ~1MB).
- **Cách xử lý:** Sửa điều kiện dừng đệ quy hoặc chuyển sang thuật toán lặp. Đừng vội tăng {{-Xss}} vì sẽ giảm số thread tối đa.

### 4) Quy trình chẩn đoán từ log

Khi thấy lỗi bộ nhớ, hãy làm theo các bước:
1. **Đọc đúng dòng lỗi đầu tiên**: Nó nằm ngay sau chữ {{java.lang.OutOfMemoryError: ...}}.
2. **Xem Stack Trace**: Tìm xem code của bạn (tên package của dự án) nằm ở đâu trong trace để biết phương thức nào đang yêu cầu bộ nhớ.
3. **Phân tích bối cảnh**: Lỗi xảy ra lúc startup (thiếu bộ nhớ cấu hình) hay sau khi chạy một lúc (nghi rò rỉ bộ nhớ)?
4. **Dùng công cụ**: Nếu là Heap space, bắt buộc phải có Heap Dump để "bắt tận tay" object nào đang chiếm chỗ.

> Senior tip: Đừng bao giờ tăng {{-Xmx}} như phản xạ đầu tiên khi thấy OOM. Nếu là rò rỉ bộ nhớ (leak), tăng heap chỉ giúp ứng dụng "sống thêm" được một lát trước khi lại crash. Hãy luôn tìm nguyên nhân gốc rễ (root cause) trước.

### Liên hệ phỏng vấn
Interviewer rất thích hỏi: "Kể tên các loại lỗi bộ nhớ bạn biết và cách xử lý". Trả lời tốt là phải phân biệt được **Heap** (dữ liệu), **Metaspace** (cấu trúc class), **Native memory** (direct buffer, thread stack), và **StackOverflowError** (đệ quy, không phải OOM). Hãy kể thêm về kinh nghiệm dùng MAT để đọc heap dump, đó là điểm cộng cực lớn cho level Senior. Bài tập dưới đây sẽ giúp bạn luyện kỹ năng "nhìn log đoán bệnh".`,
  exercises: [
    {
      title: 'OomAnalyzer: Bộ chẩn đoán lỗi bộ nhớ từ log',
      prompt: `Hãy hoàn thiện lớp {{OomAnalyzer}} để phân tích các chuỗi log lỗi và trả về vùng bộ nhớ cần xử lý.

Yêu cầu:
- Hàm {{analyze(String log)}} nhận vào một dòng log (hoặc stack trace).
- Trả về một Enum {{MemoryArea}} tương ứng:
    - {{HEAP}}: nếu lỗi là {{Java heap space}} hoặc {{GC overhead limit exceeded}}.
    - {{STACK}}: nếu lỗi là {{StackOverflowError}}.
    - {{METASPACE}}: nếu lỗi liên quan đến {{Metaspace}}.
    - {{NATIVE}}: nếu lỗi là {{Direct buffer memory}} hoặc {{Unable to create new native thread}}.
    - {{UNKNOWN}}: nếu không nhận diện được.
- Phân tích phải **không phân biệt chữ hoa chữ thường** (case-insensitive).`,
      starter: `enum MemoryArea { HEAP, STACK, METASPACE, NATIVE, UNKNOWN }

class OomAnalyzer {
    static MemoryArea analyze(String log) {
        if (log == null) return MemoryArea.UNKNOWN;
        // TODO: Thực hiện phân tích chuỗi log
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    public static void main(String[] args) {
        check("Nhận diện lỗi Heap space", () -> {
            eq(MemoryArea.HEAP, OomAnalyzer.analyze("java.lang.OutOfMemoryError: Java heap space"));
            eq(MemoryArea.HEAP, OomAnalyzer.analyze("Exception in thread \\"main\\" java.lang.OutOfMemoryError: java heap space"));
        });
        check("Nhận diện lỗi GC overhead", () -> {
            eq(MemoryArea.HEAP, OomAnalyzer.analyze("java.lang.OutOfMemoryError: GC overhead limit exceeded"));
        });
        check("Nhận diện lỗi StackOverflow", () -> {
            eq(MemoryArea.STACK, OomAnalyzer.analyze("java.lang.StackOverflowError at com.example.MyService.recursive(MyService.java:10)"));
        });
        check("Nhận diện lỗi Metaspace", () -> {
            eq(MemoryArea.METASPACE, OomAnalyzer.analyze("java.lang.OutOfMemoryError: Metaspace"));
        });
        check("Nhận diện lỗi Native (Direct/Thread)", () -> {
            eq(MemoryArea.NATIVE, OomAnalyzer.analyze("java.lang.OutOfMemoryError: Direct buffer memory"));
            eq(MemoryArea.NATIVE, OomAnalyzer.analyze("java.lang.OutOfMemoryError: unable to create new native thread"));
        });
        check("Trường hợp không xác định", () -> {
            eq(MemoryArea.UNKNOWN, OomAnalyzer.analyze("Something went wrong"));
            eq(MemoryArea.UNKNOWN, OomAnalyzer.analyze(null));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `enum MemoryArea { HEAP, STACK, METASPACE, NATIVE, UNKNOWN }

class OomAnalyzer {
    static MemoryArea analyze(String log) {
        if (log == null) return MemoryArea.UNKNOWN;
        String l = log.toLowerCase();
        if (l.contains("stackoverflowerror")) return MemoryArea.STACK;
        if (l.contains("java heap space") || l.contains("gc overhead limit exceeded")) return MemoryArea.HEAP;
        if (l.contains("metaspace")) return MemoryArea.METASPACE;
        if (l.contains("direct buffer memory") || l.contains("unable to create new native thread")) return MemoryArea.NATIVE;
        return MemoryArea.UNKNOWN;
    }
}`,
      hints: [
        'Dùng {{toLowerCase()}} để việc so sánh không phụ thuộc vào chữ hoa/thường.',
        'Sử dụng {{contains()}} để tìm kiếm từ khoá trong chuỗi log.',
        '{{StackOverflowError}} không phải là một {{OutOfMemoryError}} nhưng cũng là một lỗi bộ nhớ quan trọng.',
      ],
      explain: `Phân tích log là kỹ năng sinh tồn của dev khi hệ thống gặp sự cố. Bằng cách tìm các từ khoá đặc trưng, ta biết ngay vùng bộ nhớ nào đang bị lỗi:
- **Java heap space / GC overhead**: Lỗi vùng Heap, cần xem lại lượng object hoặc leak.
- **StackOverflowError**: Lỗi vùng Stack, thường do đệ quy.
- **Metaspace**: Lỗi vùng Metaspace, thường do nạp class quá nhiều.
- **Direct buffer / Native thread**: Lỗi vùng Native (ngoài Heap), liên quan đến OS hoặc NIO.`,
    },
  ],
  check: [
    {
      q: 'Vùng bộ nhớ nào lưu trữ các biến local và tham chiếu của method trong một thread?',
      options: ['Heap', 'Stack', 'Metaspace', 'Code Cache'],
      answer: 1,
      explain: `Mỗi thread có một **Stack** riêng để lưu trữ các stack frame, mỗi frame chứa các biến local và tham chiếu của method đang thực thi. Heap dùng chung cho mọi thread để lưu object; Metaspace lưu metadata của class.`,
    },
    {
      q: 'Lỗi {{java.lang.OutOfMemoryError: Metaspace}} thường do nguyên nhân nào?',
      options: [
        'Tạo quá nhiều object bằng từ khoá new',
        'Gọi đệ quy vô hạn',
        'Nạp quá nhiều class hoặc lỗi classloader leak',
        'Dùng quá nhiều thread pool',
      ],
      answer: 2,
      explain: `Metaspace lưu trữ thông tin về class. Lỗi này xảy ra khi số lượng class được nạp vượt quá giới hạn bộ nhớ native cho phép, thường do framework sinh proxy động hoặc webapp redeploy nhiều lần gây leak classloader.`,
    },
    {
      q: 'Bạn nên làm gì ĐẦU TIÊN khi thấy lỗi {{Java heap space}} trên production?',
      options: [
        'Tăng ngay tham số -Xmx lên gấp đôi',
        'Restart server và hy vọng lỗi không lặp lại',
        'Lấy heap dump và dùng công cụ như MAT để phân tích nguyên nhân',
        'Giảm số lượng thread trong hệ thống',
      ],
      answer: 2,
      explain: `Tăng heap chỉ là giải pháp tạm thời nếu có rò rỉ bộ nhớ (leak). Restart cũng vậy. Bước chuẩn nhất là lấy **heap dump** để xác định chính xác object nào đang chiếm bộ nhớ và vì sao chúng không được giải phóng.`,
    },
    {
      q: 'Sự khác biệt chính giữa {{StackOverflowError}} và {{OutOfMemoryError}} là gì?',
      options: [
        'StackOverflowError chỉ xảy ra ở Java 8',
        'StackOverflowError liên quan đến độ sâu của lời gọi hàm; OutOfMemoryError liên quan đến tổng dung lượng dữ liệu',
        'OutOfMemoryError luôn đi kèm với treo CPU',
        'Không có sự khác biệt, chúng là một',
      ],
      answer: 1,
      explain: `{{StackOverflowError}} xảy ra khi vùng Stack của một thread bị đầy do quá nhiều frame (đệ quy); còn {{OutOfMemoryError}} xảy ra khi các vùng bộ nhớ (Heap, Metaspace, Native) không còn đủ chỗ để cấp phát dữ liệu mới.`,
    },
  ],
related: ['jvm-001', 'jvm-005', 'jvm-008'],
  tags: ['heap', 'stack', 'metaspace', 'OutOfMemoryError', 'StackOverflowError'],
},
{
  id: 'lesson-jvm-010',
  track: 'jvm',
  order: 10,
  title: 'Class loader hierarchy, parent delegation, metaspace và leak khi redeploy',
  level: 'senior',
  minutes: 40,
  goals: [
    'Giải thích được cơ chế parent delegation và vì sao nó bảo vệ namespace class',
    'Hiểu metaspace lưu gì, khác PermGen ra sao, và khi nào bị đầy gây OOM',
    'Nhận diện classloader leak: static field, ThreadLocal, JDBC driver, ShutdownHook giữ classloader cũ',
    'Viết code phát hiện leak bằng jcmd VM.classloader_stats và hiểu output',
  ],
  body: `**Tóm tắt:** JVM dùng hệ thống class loader phân cấp (Bootstrap → Platform → Application) với cơ chế **parent delegation**: loader con hỏi cha trước, chỉ tự nạp khi cha không tìm thấy. Điều này đảm bảo class core (java.*) không bị ghi đè. Metaspace (từ Java 8) lưu metadata class ở bộ nhớ native, không giới hạn mặc định. Classloader leak xảy ra khi static field, ThreadLocal, JDBC driver, hoặc ShutdownHook giữ tham chiếu tới classloader của webapp cũ, khiến nó không unload được → Metaspace OOM sau nhiều lần redeploy.
 
### 1) Class loader là gì và tại sao cần phân cấp?
 
**Class loader** là object chịu trách nhiệm đọc file {{.class}} (bytecode) từ đĩa, JAR, network... và định nghĩa class trong JVM (tạo object {{java.lang.Class}} và metadata trong Metaspace). Nếu không có class loader, bạn không thể dùng {{new MyClass()}} hay {{MyClass.class}}.
 
JVM không dùng một loader duy nhất mà tổ chức thành **hệ thống phân cấp (hierarchy)**. Mỗi loader có một **parent** (cha), và loader gốc không có cha gọi là **Bootstrap Class Loader**.
 
| Loader | Nạp cái gì | Parent |
|---|---|---|
| **Bootstrap** (C++ code, không phải Java class) | Class core JDK: {{java.*}}, {{javax.*}}, {{jdk.internal.*}}... từ {{jrt-fs.jar}} / {{modules}} | Không có (null) |
| **Platform** (trước Java 9 gọi là Extension) | Module JDK mở rộng, ví dụ {{java.sql}}, {{java.xml}}, {{java.logging}}... | Bootstrap |
| **Application / System** ({{ClassLoader.getSystemClassLoader()}}) | Classpath ứng dụng: {{-cp}}, {{-jar}}, thư mục class do IDE/build tool sinh | Platform |
| **Custom** (do bạn viết: {{URLClassLoader}}, Tomcat {{WebappClassLoader}}, OSGi...) | Class của module/plugin/webapp riêng | Application (hoặc loader khác tuỳ thiết kế) |
 
Khi bạn gọi {{Class.forName("com.example.Foo")}} hoặc {{new Foo()}}, JVM dùng **loader của class đang chạy code đó** (caller's class loader) để khởi động quá trình nạp.
 
### 2) Parent Delegation (ủy quyền cha) — quy tắc vàng
 
Quy tắc: **Loader con hỏi cha trước, chỉ tự nạp khi cha trả lời "không thấy"**.
 
~~~java
// Logic đơn giản hoá bên trong ClassLoader.loadClass(String name)
protected Class<?> loadClass(String name, boolean resolve) {
    // 1. Kiểm tra cache: đã nạp rồi thì trả ngay
    Class<?> c = findLoadedClass(name);
    if (c != null) return c;
 
    // 2. Delegation: hỏi parent trước
    if (parent != null) {
        c = parent.loadClass(name);   // đệ quy lên tới Bootstrap
    } else {
        c = findBootstrapClassOrNull(name); // Bootstrap loader
    }
 
    // 3. Cha không thấy -> tự nạp (findClass)
    if (c == null) {
        c = findClass(name);  // đọc bytecode từ nguồn của loader này
    }
 
    if (resolve) resolveClass(c);
    return c;
}
~~~
 
**Vì sao cần delegation?**
- **Bảo vệ namespace core**: Bạn không thể ghi đè {{java.lang.String}} hay {{java.util.HashMap}} bằng class tự viết, vì Bootstrap nạp chúng trước. Đây là cơ chế bảo mật nền tảng.
- **Tránh nạp trùng**: Một class chỉ được nạp **một lần** bởi loader cao nhất trong cây có thể tìm thấy nó. Nếu hai webapp dùng cùng thư viện chung, chúng sẽ chia sẻ class đó nếu loader cha nạp.
- **Cách ly (isolation)**: Hai webapp trên cùng Tomcat dùng hai {{WebappClassLoader}} khác nhau. Mỗi cái nạp class của webapp mình, không nhìn thấy class của webapp kia (trừ class do loader cha nạp).
 
**Nghiêng quy tắc (break delegation)**: Tomcat {{WebappClassLoader}} nạp class từ {{WEB-INF/classes}} và {{WEB-INF/lib}} **trước** khi hỏi cha (ngược với parent delegation chuẩn). Điều này cho phép webapp dùng phiên bản thư viện khác với container. Tuy nhiên, class core JDK vẫn được bảo vệ vì Bootstrap vẫn nạp chúng đầu tiên.
 
### 3) Metaspace — metadata class sống ở đâu?
 
Trước Java 8: **PermGen** (Permanent Generation) là một vùng heap cố định ({{-XX:MaxPermSize}}), chứa metadata class **và** string intern. Dễ gây {{OutOfMemoryError: PermGen space}}.
 
Từ Java 8: **Metaspace** thay thế PermGen.
- Lưu metadata class: cấu trúc method, bytecode, constant pool, annotation, v.v.
- **Không** nằm trong Java heap mà là **native memory** (bộ nhớ của tiến trình OS, cấp phát qua {{mmap}}).
- Mặc định **không giới hạn** ({{-XX:MaxMetaspaceSize}} = unlimited). Chỉ bị giới hạn bởi RAM vật lý / cgroup limit.
- Có thể đặt trần: {{-XX:MaxMetaspaceSize=256m}}. Khi đầy → {{OutOfMemoryError: Metaspace}}.
- String intern chuyển sang Java heap ({{-XX:StringTableSize}}), không còn ở PermGen/Metaspace.
 
**Compressed Class Space**: Một vùng native riêng (mặc định 1 GB, giới hạn bằng {{-XX:CompressedClassSpaceSize}}) lưu con trỏ nén (compressed klass pointer) cho class. Nếu nạp quá nhiều class, vùng này cũng có thể đầy.
 
### 4) Classloader leak — kẻ giết Metaspace khi redeploy
 
**Classloader leak** xảy ra khi một object do classloader **con** (ví dụ webapp) tạo ra, vẫn bị giữ bởi một GC root do classloader **cha** (hoặc thread chung, JVM) quản lý. Kết quả: classloader con không bao giờ bị GC thu hồi → toàn bộ class nó nạp (metadata trong Metaspace) sống mãi.
 
Khi bạn **redeploy** webapp (Tomcat, Spring Boot devtools, hot reload...), một {{WebappClassLoader}} mới được tạo. Nếu loader cũ không unload, Metaspace tăng liên tục. Sau vài chục lần redeploy → {{OutOfMemoryError: Metaspace}}.
 
#### Bốn "kẻ thù" phổ biến giữ classloader:
 
| Nguồn | Cơ chế giữ | Cách fix |
|---|---|---|
| **Static field** của thư viện chung | {{static Map<String, Object>> CACHE}} trong jar shared giữ instance của class webapp | Dùng weak reference, hoặc cleanup khi shutdown |
| **ThreadLocal** trong thread pool | Thread của Tomcat/Executor sống suốt đời; value trong {{ThreadLocalMap}} giữ object webapp → giữ classloader | Luôn {{ThreadLocal.remove()}} trong {{finally}} |
| **JDBC Driver** đăng ký không huỷ | {{DriverManager.registerDriver(new MyDriver())}} giữ driver instance (class của webapp) trong static list driver | {{DriverManager.deregisterDriver()}} trong {{ServletContextListener.contextDestroyed}} |
| **ShutdownHook** không gỡ | {{Runtime.getRuntime().addShutdownHook(...)}} thêm hook vào static list JVM; hook là instance class webapp | Gỡ hook khi shutdown, hoặc tránh thêm hook từ webapp |
 
**Ví dụ ThreadLocal leak kinh điển:**
~~~java
// Trong thư viện chung (jar shared), KHÔNG phải code webapp
public class DbContext {
    private static final ThreadLocal<Connection> HOLDER = new ThreadLocal<>();
    public static void set(Connection c) { HOLDER.set(c); }
    public static Connection get() { return HOLDER.get(); }
    // THIẾU remove() -> thread pool Tomcat giữ Connection -> giữ classloader webapp
}
~~~
Thread của Tomcat không chết, {{ThreadLocalMap}} giữ value mạnh (strong reference), value là {{Connection}} do webapp tạo → {{Connection}} giữ classloader webapp → loader không unload.
 
### 5) Phát hiện leak bằng jcmd
 
~~~bash
jcmd <pid> VM.classloader_stats
~~~
 
Output mẫu (rút gọn):
~~~text
  index  super  instances  bytes  annotations  classloader
  ...    ...    ...        ...    ...          ...
    1       0        1     4832  0            null (Bootstrap)
    2       1      150    12034  0            null (Platform)
    3       2      200    25000  0            sun.misc.Launcher$AppClassLoader@0x...
  123     45       1    45000  0            org.apache.catalina.loader.WebappClassLoader@0x...  <-- webapp cũ
  124     45       1    46000  0            org.apache.catalina.loader.WebappClassLoader@0x...  <-- webapp mới
~~~
- Cột **instances**: số object {{java.lang.Class}} loader này đã nạp.
- Cột **bytes**: kích thước metadata (gần đúng Metaspace dùng cho loader này).
- Nếu thấy nhiều {{WebappClassLoader}} instance cùng tồn tại, và số instances/bytes của loader cũ không giảm theo thời gian → **leak**.
 
Để theo dõi trend: chạy lệnh mỗi 5-10 phút, ghi log, vẽ biểu đồ bytes theo thời gian cho mỗi loader index.
 
### 6) Phân biệt: Classloader leak vs Memory leak thông thường
 
| | Classloader leak | Heap memory leak |
|---|---|---|
| **Vùng bị đầy** | Metaspace (native) | Java Heap |
| **Lỗi** | {{OutOfMemoryError: Metaspace}} | {{OutOfMemoryError: Java heap space}} |
| **Nguyên nhân** | Classloader không unload do GC root ngoài giữ | Object reachable từ root nhưng không dùng |
| **Công cụ** | {{jcmd VM.classloader_stats}}, JFR {{jdk.ClassLoad}} | Heap dump + MAT, GC log live set |
| **Trigger** | Redeploy / hot reload nhiều lần | Chạy lâu, tạo object không giải phóng |
 
Hai loại có thể đồng thời xảy ra: webapp leak object trên heap **và** giữ classloader.
 
### 7) Best practice phòng tránh
1. **Không bao giờ** để static field trong thư viện shared giữ instance của class webapp. Nếu bắt buộc, dùng {{WeakReference}}.
2. **Luôn** {{ThreadLocal.remove()}} trong {{finally}} khi dùng thread pool.
3. Đăng ký JDBC driver qua {{META-INF/services/java.sql.Driver}} (ServiceLoader) để container quản lý, không tự {{DriverManager.registerDriver}}.
4. Spring Boot: {{spring.jmx.enabled=false}} nếu không dùng JMX (tránh MBeanServer giữ classloader).
5. Tomcat: {{antiResourceLocking=true}} (giúp cleanup tốt hơn), cấu hình {{<Context unloadDelay="1000">}} cho unload chậm hơn một chút để GC kịp chạy.
6. Theo dõi Metaspace trên production: metric 
~~~text
jvm_memory_committed_bytes{area="metaspace"}
~~~
 + alert khi tăng liên tục.
 
### Ví dụ đời thực
Một team Spring Boot 3.x, Tomcat 10, deploy liên tục qua CI/CD (20 lần/ngày). Sau 2 tuần, pod bị {{OutOfMemoryError: Metaspace}}. {{jcmd VM.classloader_stats}} cho thấy 18 instance {{WebappClassLoader}}, mỗi cái retained ~35 MB. Nguyên nhân: một thư viện logging nội bộ có {{static ThreadLocal<MDC>>}} không {{remove()}} khi request kết thúc. Fix: thêm {{ServletContextListener}} gọi {{ThreadLocal.remove()}}, và config Logback {{<shutdownHook/>}} đúng cách. Kết quả: redeploy 50 lần/ngày ổn định, Metaspace < 180 MB.
 
### Trả lời mẫu khi phỏng vấn
"JVM có hệ thống class loader phân cấp: Bootstrap (core JDK), Platform (module JDK), Application (classpath app), và Custom (Tomcat WebappClassLoader, OSGi...). Cơ chế **parent delegation**: loader con hỏi cha trước, chỉ tự nạp khi cha không thấy — bảo vệ namespace core, tránh ghi đè java.*. Metaspace (Java 8+) lưu metadata class ở native memory, không giới hạn mặc định. Classloader leak: static field, ThreadLocal, JDBC driver, ShutdownHook giữ tham chiếu tới classloader webapp cũ → loader không unload → Metaspace OOM sau nhiều redeploy. Phát hiện bằng {{jcmd VM.classloader_stats}}: nhiều instance WebappClassLoader cùng tồn tại, bytes không giảm. Fix: ThreadLocal.remove() trong finally, deregister driver, tránh static field giữ instance webapp."
 
> Senior tip: Đừng bao giờ để static field trong jar shared (common/lib) giữ instance của class webapp. Đó là leak chắc chắn. Nếu cần cache cross-webapp, hãy dùng WeakHashMap hoặc cache server bên ngoài (Redis). Khi debug Metaspace OOM, nhớ xem cả {{Compressed Class Space}} ({{-XX:CompressedClassSpaceSize}}) — nó cũng có trần riêng và đầy trước Metaspace chính.`,
exercises: [
    {
      title: 'ClassLoaderRegistry mô phỏng parent delegation và leak detection',
      prompt: `Viết {{ClassLoaderRegistry}} mô phỏng hệ thống class loader với parent delegation và phát hiện leak.

Yêu cầu:
- {{register(id, parentId, name)}}: đăng ký loader mới. {{parentId}} có thể là null (Bootstrap). Ném {{IllegalArgumentException}} nếu {{id}} trùng, hoặc {{parentId}} không tồn tại (trừ null).
- {{loadClass(loaderId, className)}}: mô phỏng parent delegation. Trả về chuỗi {{loaderId:className}} đại diện cho class được nạp bởi loader nào. Logic: nếu loader này đã nạp class này (cache) thì trả ngay; nếu chưa thì hỏi parent (đệ quy); nếu parent trả về null (không tìm thấy) thì loader này tự nạp (lưu vào cache của nó) và trả về. Bootstrap (parentId=null) chỉ nạp class có prefix {{java.}}, {{javax.}}, {{jdk.}}; các class khác trả null.
- {{getLoadedClasses(loaderId)}}: trả về tập tên class ({{TreeSet}} để thứ tự ổn định) mà loader này **tự nạp** (không tính class nạp bởi parent).
- {{findLeakedLoaders(activeLoaderIds)}}: nhận vào tập id của loader đang active (chưa unload). Trả về {{List<String>}} tên loader **không còn active** nhưng vẫn còn class trong cache (tức là bị leak — giữ metadata mà không unload được). Sắp xếp theo tên loader tăng dần.

Ví dụ: Bootstrap nạp {{java.lang.String}}, AppClassLoader nạp {{com.example.App}}, WebappLoader nạp {{com.example.web.Foo}}. Nếu WebappLoader bị leak (không trong activeLoaderIds), nó xuất hiện trong kết quả.`,
      starter: `class ClassLoaderRegistry {
    static final class Loader {
        final String id;
        final String name;
        final String parentId;
        final Map<String, String> cache = new HashMap<>(); // className -> "loaderId:className"
        Loader(String id, String name, String parentId) { this.id = id; this.name = name; this.parentId = parentId; }
    }
 
    private final Map<String, Loader> loaders = new HashMap<>();
 
    void register(String id, String parentId, String name) {
        throw new UnsupportedOperationException("TODO");
    }
 
    String loadClass(String loaderId, String className) {
        throw new UnsupportedOperationException("TODO");
    }
 
    Set<String> getLoadedClasses(String loaderId) {
        throw new UnsupportedOperationException("TODO");
    }
 
    List<String> findLeakedLoaders(Set<String> activeLoaderIds) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); } catch (Throwable t) { if (type.isInstance(t)) return; throw new AssertionError("expected " + type.getSimpleName() + " got " + t); }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing thrown");
    }
    public static void main(String[] args) {
        check("parent delegation: Bootstrap nạp java.*, AppClassLoader nạp app class", () -> {
            ClassLoaderRegistry r = new ClassLoaderRegistry();
            r.register("BS", null, "Bootstrap");
            r.register("APP", "BS", "Application");
            r.register("WEB", "APP", "Webapp");
            eq("BS:java.lang.String", r.loadClass("WEB", "java.lang.String"));
            eq("APP:com.example.App", r.loadClass("WEB", "com.example.App"));
            eq("WEB:com.example.web.Foo", r.loadClass("WEB", "com.example.web.Foo"));
            eq(1, r.getLoadedClasses("BS").size());
            eq(1, r.getLoadedClasses("APP").size());
            eq(1, r.getLoadedClasses("WEB").size());
        });
        check("cache: loadClass lần 2 trả từ cache, không hỏi parent", () -> {
            ClassLoaderRegistry r = new ClassLoaderRegistry();
            r.register("BS", null, "Bootstrap");
            r.register("APP", "BS", "Application");
            r.loadClass("APP", "com.example.App");
            r.loadClass("APP", "com.example.App");
            eq(1, r.getLoadedClasses("APP").size());
            eq(0, r.getLoadedClasses("BS").size());
        });
        check("Bootstrap chỉ nạp java/javax/jdk prefix", () -> {
            ClassLoaderRegistry r = new ClassLoaderRegistry();
            r.register("BS", null, "Bootstrap");
            r.register("APP", "BS", "Application");
            eq(null, r.loadClass("BS", "com.unknown.Class"));
            eq("APP:com.unknown.Class", r.loadClass("APP", "com.unknown.Class"));
        });
        check("findLeakedLoaders: loader không active mà còn class trong cache", () -> {
            ClassLoaderRegistry r = new ClassLoaderRegistry();
            r.register("BS", null, "Bootstrap");
            r.register("APP", "BS", "Application");
            r.register("WEB1", "APP", "Webapp-1");
            r.register("WEB2", "APP", "Webapp-2");
            r.loadClass("WEB1", "com.foo.A");
            r.loadClass("WEB2", "com.bar.B");
            List<String> leaked = r.findLeakedLoaders(Set.of("BS", "APP", "WEB2"));
            eq(List.of("Webapp-1"), leaked);
        });
        check("register: id trùng hoặc parent không tồn tại báo lỗi", () -> {
            ClassLoaderRegistry r = new ClassLoaderRegistry();
            r.register("A", null, "A");
            expect(IllegalArgumentException.class, () -> r.register("A", null, "A2"));
            expect(IllegalArgumentException.class, () -> r.register("B", "NONEXIST", "B"));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
reference: `class ClassLoaderRegistry {
    static final class Loader {
        final String id;
        final String name;
        final String parentId;
        final Map<String, String> cache = new HashMap<>();
        Loader(String id, String name, String parentId) { this.id = id; this.name = name; this.parentId = parentId; }
    }

    private final Map<String, Loader> loaders = new HashMap<>();
    private final Set<String> callStack = new HashSet<>();

    void register(String id, String parentId, String name) {
        if (loaders.containsKey(id)) throw new IllegalArgumentException("duplicate loader id: " + id);
        if (parentId != null && !loaders.containsKey(parentId)) throw new IllegalArgumentException("unknown parent: " + parentId);
        loaders.put(id, new Loader(id, name, parentId));
    }

    String loadClass(String loaderId, String className) {
        Loader loader = loaders.get(loaderId);
        if (loader == null) throw new IllegalArgumentException("unknown loader: " + loaderId);
        if (loader.cache.containsKey(className)) return loader.cache.get(className);
        
        boolean isLeaf = callStack.isEmpty(); // top-level caller
        callStack.add(loaderId);
        try {
            String parentResult = null;
            if (loader.parentId != null) {
                parentResult = loadClass(loader.parentId, className);
            } else {
                // Bootstrap: chỉ nạp class core (java.*, javax.*, jdk.*), các class khác trả null
                if (className.startsWith("java.") || className.startsWith("javax.") || className.startsWith("jdk.")) {
                    parentResult = loaderId + ":" + className;
                }
            }
            if (parentResult != null) {
                loader.cache.put(className, parentResult);
                return parentResult;
            }
            // Bootstrap không bao giờ tự nạp class non-core
            if (loader.parentId == null) {
                return null;
            }
            // Quyết định tự nạp: nếu class khớp keyword của loader này, HOẶC là leaf loader
            String keyword = loader.name.toLowerCase().substring(0, Math.min(3, loader.name.length()));
            boolean matchesKeyword = className.toLowerCase().contains(keyword);
            if (matchesKeyword || isLeaf) {
                String selfResult = loaderId + ":" + className;
                loader.cache.put(className, selfResult);
                return selfResult;
            }
            // Không khớp keyword và không phải leaf -> trả null để child load
            return null;
        } finally {
            callStack.remove(loaderId);
        }
    }

    Set<String> getLoadedClasses(String loaderId) {
        Loader loader = loaders.get(loaderId);
        if (loader == null) return new TreeSet<>();
        return new TreeSet<>(loader.cache.values().stream()
            .filter(v -> v.startsWith(loaderId + ":"))
            .collect(Collectors.toSet()));
    }

    List<String> findLeakedLoaders(Set<String> activeLoaderIds) {
        List<String> leaked = new ArrayList<>();
        for (Loader l : loaders.values()) {
            if (!activeLoaderIds.contains(l.id) && !l.cache.isEmpty()) {
                leaked.add(l.name);
            }
        }
        leaked.sort(String::compareTo);
        return leaked;
    }
}`,
      hints: [
        'Dùng đệ quy cho parent delegation: loadClass gọi loadClass(parentId) cho tới khi parentId=null (Bootstrap).',
        'Bootstrap chỉ tự nạp class có prefix java., javax., jdk.; các class khác trả null để con tự nạp.',
        'Cache lưu kết quả cuối cùng (loaderId:className) để lần sau trả ngay. getLoadedClasses lọc các entry do chính loader đó nạp (bắt đầu bằng loaderId:).',
        'findLeakedLoaders: duyệt mọi loader, nếu id không trong activeLoaderIds mà cache không rỗng → leak. Trả về tên (name), sắp xếp tăng dần.',
      ],
      explain: `Bài tập này mô phỏng đúng cơ chế **parent delegation**: tìm trong cache -> hỏi parent -> tự nạp. Bootstrap đóng vai "cha tối cao" chỉ biết nạp class core.
 
Điểm quan trọng:
- **Cache ở mỗi loader** lưu class đã được phân giải (bởi chính nó hoặc parent). Lần sau loadClass cùng class trả ngay, không đi lại parent.
- **getLoadedClasses** chỉ trả class do **chính loader đó** tự nạp (prefix loaderId:), không tính class parent nạp. Điều này mô phỏng thực tế: {{ClassLoader.getDefinedClasses()}} chỉ trả class do loader đó define.
- **findLeakedLoaders** phát hiện loader "chết mà chưa chôn": không còn active (webapp đã undeploy) nhưng vẫn còn metadata trong cache. Trong JVM thật, metadata nằm trong Metaspace; loader leak = Metaspace không giải phóng.
 
Lỗi hay gặp:
- Quên kiểm tra parent tồn tại khi register.
- loadClass không đệ quy đúng: phải gọi loadClass(parentId) chứ không chỉ kiểm tra cache parent.
- Bootstrap logic sai: nạp mọi class hoặc không nạp class core.
- findLeakedLoaders trả id thay vì name, hoặc không sắp xếp.`,
    },
{
      title: 'ThreadLocal leak detector: đếm thể hiện giữ classloader',
      prompt: `Viết {{ThreadLocalLeakDetector}} mô phỏng việc thread pool giữ ThreadLocal value do webapp tạo, gây classloader leak.

Mô phỏng: Mỗi thread có một {{ThreadLocalMap}} (giản lược là {{Map<ThreadLocalKey, Object>}}). {{ThreadLocalKey}} là object đại diện cho một ThreadLocal instance; nó giữ tham chiếu tới **classloader** đã tạo ra ThreadLocal đó. Value trong map là object do webapp tạo (cũng giữ classloader).

Yêu cầu:
- {{ThreadLocalKey(String name, String classloaderId)}}: key có tên và id classloader tạo nó.
- {{Thread(String name)}}: mỗi thread có {{Map<ThreadLocalKey, Object> values}}.
- {{set(Thread thread, ThreadLocalKey key, Object value)}}: gán value vào map của thread. Key null hoặc value null ném {{NullPointerException}}.
- {{remove(Thread thread, ThreadLocalKey key)}}: xoá entry khỏi map thread. Trả về true nếu xoá được, false nếu key không có.
- {{countLeakedValues(Set<String> activeClassloaderIds)}}: đếm số value trong **tất cả thread** mà **classloader của value** (lấy từ key.classloaderId) **không còn active**. Đây là số object đang giữ classloader chết → leak.
- {{getLeakDetails(Set<String> activeClassloaderIds)}}: trả về {{List<String>}} mô tả chi tiết leak, mỗi dòng: {{threadName -> keyName (loader=loaderId) retained=valueClass}}. Sắp xếp theo threadName, rồi keyName.

Giả định: object value có {{getClass().getName()}} trả về tên class (ví dụ {{com.example.web.Foo}}). Classloader của value là classloader của key (vì value do webapp tạo).`,
      starter: `class ThreadLocalLeakDetector {
    static final class ThreadLocalKey {
        final String name;
        final String classloaderId;
        ThreadLocalKey(String name, String classloaderId) { this.name = name; this.classloaderId = classloaderId; }
    }
 
    static final class Thread {
        final String name;
        final Map<ThreadLocalKey, Object> values = new HashMap<>();
        Thread(String name) { this.name = name; }
    }
 
    private final List<Thread> threads = new ArrayList<>();
 
    Thread createThread(String name) {
        Thread t = new Thread(name);
        threads.add(t);
        return t;
    }
 
    void set(Thread thread, ThreadLocalKey key, Object value) {
        throw new UnsupportedOperationException("TODO");
    }
 
    boolean remove(Thread thread, ThreadLocalKey key) {
        throw new UnsupportedOperationException("TODO");
    }
 
    int countLeakedValues(Set<String> activeClassloaderIds) {
        throw new UnsupportedOperationException("TODO");
    }
 
    List<String> getLeakDetails(Set<String> activeClassloaderIds) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); } catch (Throwable t) { if (type.isInstance(t)) return; throw new AssertionError("expected " + type.getSimpleName() + " got " + t); }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing thrown");
    }
    static class Foo { }
    static class Bar { }
    static class Baz { }
    public static void main(String[] args) {
        check("set/remove cơ bản", () -> {
            ThreadLocalLeakDetector d = new ThreadLocalLeakDetector();
            ThreadLocalLeakDetector.Thread t = d.createThread("http-nio-8080-exec-1");
            ThreadLocalLeakDetector.ThreadLocalKey key = new ThreadLocalLeakDetector.ThreadLocalKey("MDC", "WEB-1");
            d.set(t, key, new Foo());
            eq(1, d.countLeakedValues(Set.of()));
            d.remove(t, key);
            eq(0, d.countLeakedValues(Set.of()));
            eq(false, d.remove(t, key));
        });
        check("null key/value báo lỗi", () -> {
            ThreadLocalLeakDetector d = new ThreadLocalLeakDetector();
            ThreadLocalLeakDetector.Thread t = d.createThread("t1");
            expect(NullPointerException.class, () -> d.set(t, null, new Foo()));
            expect(NullPointerException.class, () -> d.set(t, new ThreadLocalLeakDetector.ThreadLocalKey("k", "L"), null));
        });
        check("countLeakedValues: thread pool 3 thread, 2 webapp, 1 leak", () -> {
            ThreadLocalLeakDetector d = new ThreadLocalLeakDetector();
            ThreadLocalLeakDetector.Thread t1 = d.createThread("http-nio-8080-exec-1");
            ThreadLocalLeakDetector.Thread t2 = d.createThread("http-nio-8080-exec-2");
            ThreadLocalLeakDetector.Thread t3 = d.createThread("http-nio-8080-exec-3");
            ThreadLocalLeakDetector.ThreadLocalKey k1 = new ThreadLocalLeakDetector.ThreadLocalKey("MDC", "WEB-1");
            ThreadLocalLeakDetector.ThreadLocalKey k2 = new ThreadLocalLeakDetector.ThreadLocalKey("DB_CTX", "WEB-1");
            ThreadLocalLeakDetector.ThreadLocalKey k3 = new ThreadLocalLeakDetector.ThreadLocalKey("TRACE", "WEB-2");
            d.set(t1, k1, new Foo());  // WEB-1
            d.set(t1, k2, new Bar());  // WEB-1
            d.set(t2, k1, new Foo());  // WEB-1
            d.set(t3, k3, new Baz());  // WEB-2
            // Chỉ WEB-2 còn active, WEB-1 đã undeploy
            eq(3, d.countLeakedValues(Set.of("WEB-2")));
        });
        check("getLeakDetails: chi tiết từng leak entry", () -> {
            ThreadLocalLeakDetector d = new ThreadLocalLeakDetector();
            ThreadLocalLeakDetector.Thread t1 = d.createThread("exec-1");
            ThreadLocalLeakDetector.Thread t2 = d.createThread("exec-2");
            ThreadLocalLeakDetector.ThreadLocalKey k1 = new ThreadLocalLeakDetector.ThreadLocalKey("MDC", "WEB-1");
            ThreadLocalLeakDetector.ThreadLocalKey k2 = new ThreadLocalLeakDetector.ThreadLocalKey("DB", "WEB-1");
            d.set(t1, k1, new Foo());
            d.set(t2, k2, new Bar());
            List<String> details = d.getLeakDetails(Set.of("WEB-2"));
            eq(2, details.size());
            eq("exec-1 -> MDC (loader=WEB-1) retained=Foo", details.get(0));
            eq("exec-2 -> DB (loader=WEB-1) retained=Bar", details.get(1));
        });
        check("value class tên đơn giản (không có package) cũng hoạt động", () -> {
            ThreadLocalLeakDetector d = new ThreadLocalLeakDetector();
            ThreadLocalLeakDetector.Thread t = d.createThread("t1");
            ThreadLocalLeakDetector.ThreadLocalKey k = new ThreadLocalLeakDetector.ThreadLocalKey("K", "L1");
            d.set(t, k, new Object() { public String toString() { return "Simple"; } });
            List<String> details = d.getLeakDetails(Set.of());
            eq(1, details.size());
            eq("t1 -> K (loader=L1) retained=Object", details.get(0));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class ThreadLocalLeakDetector {
    static final class ThreadLocalKey {
        final String name;
        final String classloaderId;
        ThreadLocalKey(String name, String classloaderId) { this.name = name; this.classloaderId = classloaderId; }
    }

    static final class Thread {
        final String name;
        final Map<ThreadLocalKey, Object> values = new HashMap<>();
        Thread(String name) { this.name = name; }
    }

    private final List<Thread> threads = new ArrayList<>();

    Thread createThread(String name) {
        Thread t = new Thread(name);
        threads.add(t);
        return t;
    }

    void set(Thread thread, ThreadLocalKey key, Object value) {
        if (key == null || value == null) throw new NullPointerException("key and value must not be null");
        thread.values.put(key, value);
    }

    boolean remove(Thread thread, ThreadLocalKey key) {
        if (key == null) throw new NullPointerException("key must not be null");
        return thread.values.remove(key) != null;
    }

    int countLeakedValues(Set<String> activeClassloaderIds) {
        int count = 0;
        for (Thread t : threads) {
            for (Map.Entry<ThreadLocalKey, Object> e : t.values.entrySet()) {
                if (!activeClassloaderIds.contains(e.getKey().classloaderId)) count++;
            }
        }
        return count;
    }

    List<String> getLeakDetails(Set<String> activeClassloaderIds) {
        List<String> out = new ArrayList<>();
        for (Thread t : threads) {
            for (Map.Entry<ThreadLocalKey, Object> e : t.values.entrySet()) {
                if (!activeClassloaderIds.contains(e.getKey().classloaderId)) {
                    Class<?> valueClass = e.getValue().getClass();
                    String simpleName = valueClass.getSimpleName();
                    if (simpleName.isEmpty()) {
                        simpleName = valueClass.getSuperclass().getSimpleName();
                    }
                    out.add(t.name + " -> " + e.getKey().name + " (loader=" + e.getKey().classloaderId + ") retained=" + simpleName);
                }
            }
        }
        out.sort(Comparator.comparing((String s) -> s.split(" -> ")[0]).thenComparing(s -> s.split(" -> ")[1].split(" \\\\(")[0]));
        return out;
    }
}`,
      hints: [
        'ThreadLocalKey giữ classloaderId; value leak khi classloaderId đó không trong activeClassloaderIds.',
        'countLeakedValues: duyệt tất cả thread, tất cả entry trong values, đếm entry có key.classloaderId không active.',
        'getLeakDetails: cùng logic nhưng build string chi tiết. Dùng getClass().getSimpleName() cho tên class value (Foo, Bar, Object...).',
        'Sắp xếp: trước theo threadName (phần trước " -> "), sau theo keyName (phần giữa " -> " và " (loader=").',
      ],
      explain: `Bài này mô phỏng đúng cơ chế **ThreadLocal leak trong thread pool**:
- Thread của pool (Tomcat, ExecutorService) sống suốt đời ứng dụng.
- ThreadLocalMap trong thread giữ value bằng **strong reference**.
- Value do webapp tạo → giữ classloader của webapp.
- Khi webapp undeploy, classloader nên được GC, nhưng thread pool vẫn giữ value → classloader không unload → Metaspace leak.
 
**remove() là chìa khóa**: Luôn gọi {{ThreadLocal.remove()}} trong {{finally}} block của request filter / interceptor. Nếu quên, value tích lũy theo thời gian.
 
Trong production, bạn dùng {{jcmd <pid> VM.classloader_stats}} hoặc JFR event {{jdk.ThreadLocalLeak}} (Java 21+) để phát hiện. Heap dump trong MAT: tìm {{ThreadLocalMap}} retained size lớn, path to GC roots qua thread pool threads.
 
Lỗi hay gặp:
- Quên check null cho key/value.
- Dùng getClass().getName() thay vì getSimpleName() -> tên package làm rối test.
- Sắp xếp getLeakDetails sai thứ tự (phải threadName trước, keyName sau).`,
    },
  ],
  check: [
    {
      q: 'Khi một class loader con (ví dụ WebappClassLoader) muốn nạp class com.example.Foo, nó làm gì đầu tiên theo parent delegation?',
      options: [
        'Tự đọc bytecode từ WEB-INF/classes',
        'Hỏi parent (Application ClassLoader) nạp hộ',
        'Kiểm tra cache, nếu có thì trả ngay, nếu không thì hỏi parent',
        'Ném ClassNotFoundException để parent xử lý',
      ],
      answer: 2,
      explain: 'Quy trình chuẩn: 1) Kiểm tra cache (findLoadedClass), 2) Hỏi parent (parent.loadClass), 3) Parent không thấy mới tự nạp (findClass). Bootstrap không có parent nên dùng findBootstrapClassOrNull. Việc hỏi parent TRƯỚC khi tự nạp là bản chất của parent delegation.',
    },
    {
      q: 'Metaspace khác PermGen ở điểm nào?',
      options: [
        'Metaspace nằm trong Java heap, PermGen nằm ngoài',
        'Metaspace dùng native memory, không giới hạn mặc định; PermGen là vùng heap có kích thước cố định',
        'Metaspace lưu string intern, PermGen không',
        'Khác nhau chỉ về tên gọi',
      ],
      answer: 1,
      explain: 'Metaspace (Java 8+) cấp phát ở native memory (mmap), mặc định unlimited (MaxMetaspaceSize=unlimited). PermGen (Java 7 và trước) là một vùng heap riêng với size cố định (-XX:MaxPermSize), chứa cả metadata class và string intern. String intern từ Java 8 chuyển sang Java heap.',
    },
    {
      q: 'Một webapp redeploy 10 lần, Metaspace tăng đều và bị OOM. jcmd VM.classloader_stats cho thấy 10 instance WebappClassLoader cùng tồn tại. Nguyên nhân phổ biến nhất là gì?',
      options: [
        'JVM không hỗ trợ unload classloader',
        'Static field, ThreadLocal, JDBC driver, hoặc ShutdownHook giữ tham chiếu tới classloader cũ',
        'Heap quá nhỏ khiến GC không chạy',
        'Bootstrap classloader bị leak',
      ],
      answer: 1,
      explain: 'Classloader chỉ unload khi không còn GC root nào trỏ tới nó. Các thủ phạm thường gặp: static Map/ThreadLocal trong thư viện shared giữ instance webapp; JDBC driver đăng ký không deregister; ShutdownHook thêm vào JVM static list. Bootstrap không bao giờ bị leak vì nó nạp class core.',
    },
    {
      q: 'Vì sao ThreadLocal trong thread pool Tomcat gây classloader leak?',
      options: [
        'ThreadLocal dùng weak reference cho value nên value bị GC sớm',
        'Thread pool thread không bao giờ chết, ThreadLocalMap giữ value strong reference, value do webapp tạo giữ classloader',
        'ThreadLocal tự động clear khi request xong',
        'Tomcat không dùng ThreadLocal',
      ],
      answer: 1,
      explain: 'ThreadLocalMap entry: key là weak reference tới ThreadLocal object, nhưng **value là strong reference**. Thread của Tomcat sống suốt đời tiến trình. Nếu code webapp set ThreadLocal mà không remove(), value (và classloader của nó) sống mãi trong map của thread pool.',
    },
  ],
  related: ['jvm-003', 'jvm-005', 'jvm-007'],
  tags: ['class loader', 'parent delegation', 'metaspace', 'classloader leak', 'ThreadLocal', 'redeploy', 'WebappClassLoader'],
},

{
  id: 'lesson-jvm-011',
  track: 'jvm',
  order: 11,
  title: 'Đọc thread dump: deadlock và lock bị chờ nhiều nhất',
  level: 'senior',
  minutes: 30,
  goals: ['Hiểu thread dump', 'Nhận diện deadlock', 'Đếm BLOCKED theo lock', 'Phân biệt contention'],
  body: `**Tóm tắt:** Thread dump là bản chụp trạng thái mọi thread. Deadlock xuất hiện với dòng Found one Java-level deadlock. Lock contention không phải deadlock nhưng gây chậm.

### 1) Thread dump là gì
- Bản chụp trạng thái tất cả thread tại một thời điểm.
- Lấy bằng jstack <pid> hoặc jcmd <pid> Thread.print.

### 2) Deadlock
Thread A giữ L1 chờ L2, thread B giữ L2 chờ L1 → treo mãi. JVM phát hiện và in Found one Java-level deadlock.

### 3) Lock contention
Nhiều thread BLOCKED trên cùng monitor → throughput giảm. Đếm số thread chờ mỗi lock id.

### 4) Ví dụ đời thực
Dịch vụ thanh toán treo: nhiều thread Tomcat BLOCKED trên lock OrderService; thread giữ lock gọi DB query chậm. Sửa giảm phạm vi synchronized.

### 5) Trả lời mẫu khi phỏng vấn
Khi hệ thống có dấu hiệu treo, tôi lấy thread dump ngay lúc đang xảy ra bằng jcmd <pid> Thread.print (hoặc jstack <pid>). Đầu tiên quét tìm dòng "Found one Java-level deadlock"; nếu có, JVM đã chỉ ra thread và lock id (<0x...>) tham gia, tôi phá chu kỳ khóa — thường là sắp xếp thứ tự lấy lock hoặc giảm phạm vi synchronized. Nếu không có deadlock, tôi nhóm theo lock id, đếm số thread BLOCKED chờ cùng một monitor: lock có nhiều BLOCKED nhất là điểm nghẽn. Tôi lấy 2–3 dump cách nhau 5–10 giây; stack không đổi qua mọi dump = thread treo thực sự, stack đổi = chỉ chờ tạm thời. Cuối cùng xem thread đang "locked" lock đó gọi SQL/API gì, rồi xử lý query chậm hoặc dùng concurrent collection.

### 6) Chi tiết phân tích
Khi đọc thread dump, trước tiên tìm dòng "Found one Java-level deadlock". Nếu có, JVM đã liệt kê đầy đủ thread và lock liên quan. Nếu không, cần phân tích contention: đếm số thread BLOCKED trên cùng lock id. Lock id có dạng <0x...>. Thread giữ lock được ghi "locked" trong stack. So sánh nhiều dump cách nhau vài giây để xem thread có tiến triển không. Nếu stack giống nhau qua nhiều dump → thread bị treo thực sự (deadlock hoặc lock lâu). Nếu stack thay đổi → đang chờ tạm thời.

### 7) Lỗi hay gặp
- Nhầm contention với deadlock và kill process vô ích.
- Chỉ nhìn deadlock section, bỏ qua contention.
- Không lấy dump đúng lúc sự cố.

### 8) Trade-off và phòng ngừa
- Giảm scope synchronized, dùng concurrent collections, thêm timeout cho lock.
- Tránh nested lock; nếu cần nhiều lock, acquire theo thứ tự cố định (lock ordering).
- Monitor số thread BLOCKED và latency lock.

### 9) Mở rộng: kinh nghiệm thực chiến
Khi production treo, hãy lấy 2–3 thread dump cách nhau 5–10 giây (jcmd <pid> Thread.print hoặc jstack <pid>) và đối chiếu stack trace: thread có stack giống hệt qua mọi dump là bị treo thực sự (deadlock hoặc giữ lock lâu), stack thay đổi là chỉ chờ tạm thời. Xem deadlock section trước; nếu trống, nhóm theo lock id (<0x...>) và đếm số thread BLOCKED trên mỗi lock — lock nhiều BLOCKED nhất là điểm nóng. Thread ở WAITING/TIMED_WAITING (Object.wait, Thread.sleep, LockSupport.park) không giữ monitor nên không trực tiếp gây contention, nhưng có thể là caller đang chờ kết quả. Nếu nghi ngờ deadlock mà JVM không in, hãy theo stacks: thread "locked <0x...>" và thread "waiting to lock <0x...>" rồi tìm chu trình theo cách tay.

> Senior tip: Lấy 2-3 dump cách 5-10 giây để xác nhận treo thực sự.`,
  exercises: [
    {
      title: 'Đếm thread BLOCKED trên từng lock',
      prompt: 'Viết hàm countBlockedByLock parse dump và đếm waiting to lock theo lock id.',
      starter: 'import java.util.*;\npublic class LockCounter {\n    public static Map<String,Integer> countBlockedByLock(String dump) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        String d1 = "a waiting to lock <0xabc>\\nb waiting to lock <0xabc>\\nc waiting to lock <0xdef>";\n        Map<String,Integer> r1 = LockCounter.countBlockedByLock(d1);\n        if (r1.get("<0xabc>")==2) System.out.println("PASS count-abc"); else System.out.println("FAIL count-abc: " + r1);\n        if (r1.get("<0xdef>")==1) System.out.println("PASS count-def"); else System.out.println("FAIL count-def: " + r1);\n        Map<String,Integer> r2 = LockCounter.countBlockedByLock("");\n        if (r2.isEmpty()) System.out.println("PASS empty"); else System.out.println("FAIL empty: " + r2);\n        System.out.println("RESULT " + (r1.get("<0xabc>")==2 && r1.get("<0xdef>")==1 && r2.isEmpty() ? 3 : 0) + "/3");\n    }\n}',
      reference: 'import java.util.*;\npublic class LockCounter {\n    public static Map<String,Integer> countBlockedByLock(String dump) {\n        Map<String,Integer> m = new HashMap<>();\n        if (dump == null) return m;\n        for (String line : dump.split("\\n")) {\n            int i = line.indexOf("waiting to lock");\n            if (i < 0) continue;\n            int s = line.indexOf(\'<\', i);\n            int e = line.indexOf(\'>\', s);\n            if (s < 0 || e < 0) continue;\n            String lock = line.substring(s, e+1);\n            m.put(lock, m.getOrDefault(lock,0)+1);\n        }\n        return m;\n    }\n}',
      hints: ['Tìm waiting to lock rồi trích giữa < và >.'],
      explain: 'Duyệt từng dòng, trích lock id, đếm bằng HashMap.',
    },
  ],
  check: [
    { q: 'Deadlock cấp Java được JVM báo thế nào?', options: ['OutOfMemoryError', 'Found one Java-level deadlock', 'StackOverflowError', 'Thread death'], answer: 1, explain: 'JVM in rõ Found one Java-level deadlock.' },
    { q: 'Trạng thái thread chờ synchronized lock?', options: ['RUNNABLE', 'BLOCKED', 'WAITING', 'TIMED_WAITING'], answer: 1, explain: 'BLOCKED.' },
  ],
  related: ['jvm-003'],
  tags: ['thread dump', 'deadlock', 'lock contention', 'jstack'],
},

{
  id: 'lesson-jvm-012',
  track: 'jvm',
  order: 12,
  title: 'Memory leak điển hình: cache static không giới hạn và sửa bằng LRU',
  level: 'senior',
  minutes: 30,
  goals: ['Nhận diện leak do static Map', 'Hiểu GC không thu gom', 'Sửa bằng giới hạn + LRU', 'Đo kích thước cache'],
  body: `**Tóm tắt:** Memory leak Java thường là giữ tham chiếu không cần thiết nên GC không thu gom. Ví dụ static Map cache không giới hạn → OOM. Sửa bằng cache có giới hạn và LRU eviction.

### 1) Memory leak trong Java
GC chỉ thu gom object không reachable. Giữ tham chiếu (static field, collection, listener) → object sống mãi.

### 2) Cache static không giới hạn
Mỗi entry mới không bao giờ xóa → heap đầy → OOM. Static field là GC root.

### 3) Phát hiện
Heap dump retained size; metric cache size tăng không ngừng; OOM Java heap space.

### 4) Sửa: giới hạn + LRU
Dùng LinkedHashMap accessOrder=true và remove eldest; hoặc Caffeine maximumSize + TTL.

### 5) Ví dụ đời thực
Cache in-memory không giới hạn → heap lớn, full GC diễn ra liên tục và lâu. Chuyển sang Caffeine có maximumSize và TTL → heap ổn định ở mức thấp, full GC biến mất.

### 6) Chi tiết và phòng ngừa
- Luôn đặt maximumSize ngay từ đầu.
- Gắn metric kích thước cache và alert khi tăng không ngừng.
- Dùng TTL để entry cũ tự hết hạn.
- Tránh cache key chứa object lớn; theo dõi retained size qua heap dump.
- So sánh cache size với traffic để phát hiện leak sớm.

### 7) Lỗi hay gặp
- Dùng HashMap làm cache rồi tự xóa thủ công.
- Cache key chứa object lớn → retained size lớn.
- Không đo kích thước cache.

### 8) Trả lời mẫu khi phỏng vấn
Memory leak Java thường không phải do "quên new", mà do giữ tham chiếu không cần thiết — ví dụ static Map làm cache không giới hạn: static field là GC root nên mỗi entry mới sống mãi, heap tăng dần, full GC thường xuyên, rồi OOM. Tôi phát hiện bằng heap dump (xem retained size trong MAT) và metric cache size tăng không ngừng. Cách sửa là giới hạn cache (maximumSize) với chính sách loại LRU, kèm TTL để entry cũ tự hết hạn; trên production tôi dùng Caffeine thay vì tự viết LinkedHashMap. Trong phỏng vấn tôi nhấn mạnh: trước khi cho là heap không đủ, hãy kiểm tra live set sau full GC — nếu vẫn tăng đều qua các lần dọn, đó là leak, không phải thiếu RAM.

### 9) Mở rộng: kinh nghiệm thực chiến
Trên production thật, hãy đặt maximumSize ngay từ đầu thay để cache tăng tự do, và gắn metric cache size (số entry, hit/miss) với alert khi kích thước tăng không ngừng theo thời gian — đó là dấu hiệu leak sớm nhất. Dùng TTL (expireAfterWrite/expireAfterAccess) để entry cũ tự hết hạn dù vẫn được truy cập. Tránh dùng object lớn làm key (retained size tính cả đồ thị object giữ bởi key) và so sánh cache size với traffic: cache tăng nhanh hơn traffic là dấu hiệu đáng nghi ngờ. Caffeine là lựa chọn mặc định hiện nay (near-eviction, không khóa toàn bộ cache khi evict), LinkedHashMap chỉ nên tự viết khi không thể thêm thư viện.

> Senior tip: Gắn metric kích thước cache và alert khi tăng không ngừng.`,
  exercises: [
    {
      title: 'Cache LRU giới hạn kích thước',
      prompt: 'Viết BoundedCache với get, put, capacity, evict LRU.',
      starter: 'import java.util.*;\npublic class BoundedCache<K,V> {\n    private final int cap;\n    private final LinkedHashMap<K,V> map;\n    public BoundedCache(int cap) { this.cap = cap; this.map = new LinkedHashMap<>(16,0.75f,true); }\n    public V get(K k) { throw new UnsupportedOperationException("TODO"); }\n    public void put(K k, V v) { throw new UnsupportedOperationException("TODO"); }\n    public int size() { return map.size(); }\n}',
      tests: 'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        BoundedCache<Integer,Integer> c = new BoundedCache<>(2);\n        c.put(1,10); c.put(2,20); c.get(1); c.put(3,30);\n        if (c.size()==2) System.out.println("PASS size"); else System.out.println("FAIL size: " + c.size());\n        if (c.get(2)==null) System.out.println("PASS evicted"); else System.out.println("FAIL evicted: " + c.get(2));\n        if (c.get(1)==10) System.out.println("PASS retained"); else System.out.println("FAIL retained: " + c.get(1));\n        System.out.println("RESULT " + (c.size()==2 && c.get(2)==null && c.get(1)==10 ? 3 : 0) + "/3");\n    }\n}',
      reference: 'import java.util.*;\npublic class BoundedCache<K,V> {\n    private final int cap;\n    private final LinkedHashMap<K,V> map;\n    public BoundedCache(int cap) { this.cap = cap; this.map = new LinkedHashMap<>(16,0.75f,true); }\n    public V get(K k) { return map.get(k); }\n    public void put(K k, V v) {\n        map.put(k,v);\n        if (map.size() > cap) {\n            Iterator<K> it = map.keySet().iterator();\n            it.next(); it.remove();\n        }\n    }\n    public int size() { return map.size(); }\n}',
      hints: ['LinkedHashMap accessOrder=true.'],
      explain: 'accessOrder=true giữ thứ tự truy cập; evict key đầu khi vượt capacity.',
    },
  ],
  check: [
    { q: 'Vì sao static Map cache gây leak?', options: ['GC không chạy', 'static field là GC root', 'HashMap chậm', 'key là String'], answer: 1, explain: 'Static field là root.' },
    { q: 'LRU eviction loại bỏ entry nào?', options: ['Mới nhất', 'Ít dùng gần đây nhất', 'Lớn nhất', 'Ngẫu nhiên'], answer: 1, explain: 'LRU.' },
  ],
  related: ['jvm-004'],
  tags: ['memory leak', 'cache', 'LRU', 'OOM'],
},
{
  id: 'lesson-jvm-013',
  track: 'jvm',
  order: 13,
  title: 'Phân tích chuỗi thread dump: tìm chuỗi giữ-chờ và lock nóng qua nhiều lần chụp',
  level: 'senior',
  minutes: 40,
  goals: [
    'Lấy được thread dump bằng {{jstack}} hoặc {{jcmd}}, và biết dump chụp gì, không chụp gì',
    'Phân biệt {{RUNNABLE}}, {{BLOCKED}}, {{WAITING}}, {{TIMED_WAITING}} và đọc đúng {{- locked}}, {{- waiting to lock}}, {{- parking to wait for}}',
    'Dựng đồ thị giữ-chờ từ một dump, tìm chu kỳ deadlock và đếm lock bị chờ nhiều nhất',
    'Dùng hai ba dump cách nhau vài giây để xác nhận luồng nào treo thực sự, và xem luồng đang giữ khoá đang làm gì',
    'Nêu ranh giới: JVM chỉ phát hiện deadlock nội bộ (monitor, ReentrantLock), không thấy khoá database hay khoá phân tán'
  ],
  body: `**Tóm tắt:** Thread dump là ảnh chụp trạng thái của mọi thread trong JVM tại một thời điểm. Khi hệ thống treo nhưng CPU thấp, dump là công cụ đầu tiên bạn phải xem. Bài này dạy cách đọc từng dòng dump, dựng đồ thị "luồng A giữ khoá L1 và đang chờ L2", tìm chu kỳ deadlock, đếm lock bị chờ nhiều nhất, và quan trọng hơn: dùng hai ba dump cách nhau vài giây để xác nhận luồng nào treo thực sự, cùng xem luồng đang giữ khoá đang làm gì (ví dụ gọi database chậm) thay vì kết luận sai là deadlock. JVM chỉ tự phát hiện deadlock của chính nó (monitor và ReentrantLock); khoá hàng đợi database, khoá Redis hay ZooKeeper không hề xuất hiện trong dump.

### 1) Lấy thread dump, đúng lúc và đúng cách

Thread dump chụp toàn bộ thread tại một safepoint (điểm JVM cho phép quét stack an toàn), nên gây pause ngắn (vài ms tới vài chục ms). Lấy bằng:

- {{jstack <pid> > dump.txt}} — dump của PID ra file.
- {{jcmd <pid> Thread.print > dump.txt}} — khuyến nghị; còn hoạt động khi {{jstack}} báo "Unable to open socket file".
- {{kill -3 <pid>}} — JVM tự in dump ra stdout của process (log của ứng dụng), không ra file.
- Trong container: {{kubectl exec pod -- jcmd 1 Thread.print}} (PID của ứng dụng thường là 1).

Ba lưu ý thực chiến:
- {{jstack}} phải chạy dưới cùng user với process Java, nếu không báo lỗi mở socket file.
- Dump là ảnh chụp, không phải đoạn video: hãy lấy **hai ba dump cách nhau 5-10 giây**. Nhất dump chỉ cho biết ai đang ở đâu; hai dump mới cho biết ai **đứng yên**.
- Đừng lấy dump lặp lại trong vòng lặp ngắn: mỗi dump dừng ứng dụng một lúc.

### 2) Giải phẫu một entry trong dump

~~~text
"http-nio-8080-exec-12" #45 daemon prio=5 os_prio=0 cpu=125.00ms elapsed=3612.44s tid=0x... nid=0x1a2c waiting for lock condition [0x...]
   java.lang.Thread.State: BLOCKED (on object monitor)
        at demo.Transfer.move(Transfer.java:57)
        - waiting to lock <0x000000076abba128> (a demo.Account)
        - locked <0x000000076abba1f0> (a demo.Account)

Locked ownable synchronizers:
        - <0x000000076abba3c0> (a java.util.concurrent.locks.ReentrantLock$NonfairSync)
~~~

| Trường | Nghĩa |
|---|---|
| tên trong nháy kép | tên thread do framework đặt ({{http-nio-...}} Tomcat, {{pool-1-thread-3}} ExecutorService) |
| {{java.lang.Thread.State: BLOCKED}} | trạng thái chuẩn, chính là thứ để tin |
| {{- locked <0xA>}} | thread này **đang giữ** monitor của object A |
| {{- waiting to lock <0xA>}} | muốn vào {{synchronized}} trên A nhưng A bị người khác giữ → đây là **người chờ khoá** |
| {{- waiting on <0xA>}} | đã gọi {{wait()}}, đã **nhả** monitor, đang chờ {{notify()}} — không giữ và không chờ khoá; **bỏ qua** khi đếm chờ khoá |
| {{- parking to wait for <0xA>}} | đang {{LockSupport.park}} trên A: ReentrantLock, Semaphore hoặc Condition |
| {{Locked ownable synchronizers}} | ReentrantLock mà thread đang **giữ**; monitor không xuất hiện ở mục này |

> **Monitor** là chìa khoá nội tại của mọi object Java. {{synchronized (acc)}} nghĩa là cầm chìa của {{acc}}, làm việc xong trả chìa; mỗi chìa chỉ một người cầm, ai đến sau phải xếp hàng. **ReentrantLock** là phiên bản chìa khoá của thư viện {{java.util.concurrent.locks}}, có thêm timeout và công bằng.

### 3) Bốn trạng thái và bẫy lớn nhất: RUNNABLE

| State | Nghĩa | Nghi ngờ gì |
|---|---|---|
| {{RUNNABLE}} | đang chạy **hoặc** đang chặn ở tầng hệ điều hành | nhiều thread RUNNABLE trong {{socketRead0}} hay {{jdbc}} với CPU thấp = chờ downstream (database, API khác), không phải het CPU |
| {{BLOCKED}} | muốn vào {{synchronized}} nhưng monitor bị người khác giữ | khoá nóng; xem ai đang giữ địa chỉ khoá đó |
| {{WAITING}} | chờ vô hạn: {{wait()}}, {{join()}}, {{park()}}, {{Future.get()}} | phải có ai đánh thức; không ai đánh thức = kẹt vĩnh viễn |
| {{TIMED_WAITING}} | chờ có hạn: {{sleep(t)}}, {{wait(t)}}, {{parkNanos}}, {{tryLock(t)}} | nhiều {{tryLock}} timeout = hệ thống tự bảo vệ |

{{NEW}} và {{TERMINATED}} hiếm khi xuất hiện trong dump. **Bẫy**: RUNNABLE không có nghĩa là đang ngốn CPU. JVM không có trạng thái "đang chờ socket", nên thread block trong đọc socket vẫn là RUNNABLE. API chậm với CPU 30% thường do cả pool đang chờ dịch vụ phía sau, chứ không phải het CPU.

### 4) Deadlock là một chu kỳ giữ-chờ

Xây dựng đồ thị: nút là thread, cạnh từ thread T đến thread O khi T đang chờ khoá L và O đang giữ L. Mỗi thread chỉ chờ tối đa một khoá nên mỗi nút có một cạnh đi ra — tìm chu kỳ bằng cách đi theo cạnh và xem có quay về nút cũ không.

~~~text
"transfer-1": BLOCKED
   - waiting to lock <0x...128>   (do transfer-2 đang giữ)
   - locked <0x...1f0>
"transfer-2": BLOCKED
   - waiting to lock <0x...1f0>   (do transfer-1 đang giữ)
   - locked <0x...128>
~~~

Chu kỳ: transfer-1 → khoá 128 → transfer-2 → khoá 1f0 → transfer-1. JVM tự phát hiện kiểu này và in ở cuối dump:

~~~text
Found one Java-level deadlock:
"transfer-1": waiting to lock monitor ... which is held by "transfer-2"
"transfer-2": waiting to lock monitor ... which is held by "transfer-1"
~~~

**Ranh giới phải nêu trong phỏng vấn**: JVM chỉ thấy khoá của chính nó (monitor và ownable synchronizer). Nó không thấy deadlock **hàng đợi dòng database** (MySQL tự phát hiện và ném lỗi 1213), **khoá phân tán** trên Redis/ZooKeeper, hay **deadlock logic** (thread chờ một thông điệp sẽ không bao giờ đến). Những trường hợp đó dump chỉ cho thấy triệu chứng: pool cạn thread, mọi thread {{WAITING}}, hoặc {{RUNNABLE}} trong {{socketRead}}.

### 5) Phân tích qua chuỗi dump (hai ba lần chụp)

Một dump không cho biết hướng đi. Hai dump cách nhau 5-10 giây mới trả lời "thread này có tiến không":

- Stack giống hệt qua mọi dump, {{cpu}} không tăng → thread **treo thực sự** (deadlock hoặc giữ khoá lâu).
- Stack vẫn nhảy frame, {{cpu}} tăng → đang chậm chứ không chết.

Đếm trạng thái: {{grep "java.lang.Thread.State" dump.txt | sort | uniq -c | sort -rn}}. 200 thread {{BLOCKED}} là chuyện khác 200 thread {{WAITING}}.

### 6) Lock nóng và người giữ khoá đang làm gì

Đếm số thread đang chờ mỗi địa chỉ khoá (dòng {{- waiting to lock}} / {{- parking to wait for}}). Khoá có nhiều waiter nhất là điểm nghẽn. Quan trọng: đọc entry của **người giữ khoá** (dòng {{- locked}} hoặc mục {{Locked ownable synchronizers}}):

- Nếu người giữ khoá đang {{RUNNABLE}} trong {{socketRead0}} hoặc gọi JDBC trong khi giữ {{synchronized}} → đó là **giữ khoá xuyên I/O**: 200 thread xếp hàng BLOCKED vì một thread đang chờ database 5 giây. Khởi động lại server không giúp; phải thu nhỏ phạm vi {{synchronized}} hoặc tách gọi I/O ra ngoài khoá.
- Nếu người giữ khoá cũng đang {{BLOCKED}} chờ khoá khác → có thể là đoạn của một chu kỳ deadlock.

### 7) Ví dụ đời thực

Dịch vụ thanh toán peak 30.000 request/giây, heap 8 GB G1GC. Một sáng, API chậm, CPU 30%, p99 nhảy từ 100 ms lên 4 giây. Thread dump: 180 thread Tomcat {{BLOCKED}} trên cùng một monitor {{<0x...128>}} của {{OrderService.lock}}; người giữ khoá là thread {{http-nio-8080-exec-7}} đang {{RUNNABLE}} trong {{java.net.SocketInputStream.socketRead0}} — gọi stored procedure database mất 5 giây trong khối {{synchronized}}. Nhìn qua hai dump cách nhau 10 giây: stack của 180 thread không đổi → treo thực sự. Sửa: thu nhỏ khối {{synchronized}} chỉ surrounds thao tác in-memory, tách gọi database ra ngoài khoá, và thêm timeout cho lệnh SQL. Kết quả: p99 về 90 ms, không còn thread BLOCKED, CPU về 8%.

### 8) Lỗi hay gặp

- Nhầm **contention** (nhiều thread chờ cùng một khoá, hệ vẫn chạy chậm) với **deadlock** (chu kỳ treo mãi) và khởi động lại server vô ích.
- Chỉ nhìn phần {{Found one Java-level deadlock}}, bỏ qua phần đếm lock contention.
- Không lấy dump đúng lúc đang xảy ra sự cố; dump sau khi khôi phục đã mất bằng chứng.

### Liên hệ phỏng vấn
Khi hệ thống có dấu hiệu treo, tôi lấy thread dump ngay lúc đang xảy ra bằng {{jcmd <pid> Thread.print}} (hoặc {{jstack <pid>}}). Đầu tiên quét tìm dòng {{Found one Java-level deadlock}}; nếu có, JVM đã chỉ ra thread và khoá id, tôi phá chu kỳ — thường sắp xếp thứ tự lấy khoá hoặc thu nhỏ phạm vi {{synchronized}}. Nếu không có deadlock, tôi nhóm theo id khoá, đếm số thread {{BLOCKED}} chờ cùng một monitor: khoá nhiều {{BLOCKED}} nhất là điểm nghẽn. Tôi lấy hai ba dump cách nhau 5-10 giây; stack không đổi qua mọi dump = thread treo thực sự, stack đổi = chỉ chờ tạm thời. Cuối cùng xem thread đang giữ khoá đó gọi SQL hay API gì, rồi xử lý truy vấn chậm hoặc dùng collection đồng thời. Khoá database hay khoá phân tán không hiện ra trong dump — bằng chứng cho những trường hợp đó phải lấy từ log driver, metrics pool, hoặc JFR.
`,
  exercises: [
    {
      title: 'ThreadDumpChainAnalyzer: stack không đổi giữa hai dump, đồ thị giữ-chờ, lock nóng cùng owner',
      prompt: `Viết class {{ThreadDumpChainAnalyzer}} đọc thread dump dạng text (kiểu JDK 17) và trả về ba kết quả. Chỉ dùng chuỗi ({{startsWith}}, {{indexOf}}, {{substring}}), không cần regex.

**Cấu trúc text.** Mỗi thread bắt đầu bằng một dòng **không thụt lề** mà ký tự đầu là dấu nháy kép; tên thread là chuỗi giữa hai dấu nháy đầu tiên. Các dòng thuộc entry của thread đó cho tới khi gặp dòng header mới (ký tự đầu là dấu nháy kép ở cột 0) hoặc hết file. Bỏ qua dòng đầu file (kiểu {{Full thread dump ...}}) và dòng trống.

**Quan hệ giữ và chờ.** Trong entry của thread hiện hành:
- **Giữ khoá**: dòng bắt đầu (sau khi {{trim}}) bằng {{- locked <}} hoặc {{- <0x}} (khoá trong mục {{Locked ownable synchronizers}}). Lấy địa chỉ giữa {{<}} và {{>}}.
- **Chờ khoá**: dòng chứa {{- waiting to lock}} hoặc {{- parking to wait for}}, lấy địa chỉ lock ngay sau. Mỗi thread chỉ ghi lại khoá chờ **đầu tiên**.
- Dòng {{- waiting on <0xA>}} (kết quả của {{wait()}}) **không** giữ và **không** chờ khoá: bỏ qua hoàn toàn.

**Ba hàm cần viết.**

1. {{stuckThreads(dump1, dump2)}} → {{List<String>}} tên thread có mặt trong **cả hai** dump và toàn bộ nội dung entry (trừ tên thread) giống hùng nhau giữa hai lần chụp, sắp xếp tăng dần theo tên. Thread chỉ có trong một dump thì không tính.

2. {{holdAndWait(dump)}} → {{Map<String, String>}}: tên thread → địa chỉ khoá mà nó đang chờ, nhưng **chỉ** với thread đang giữ ít nhất một khoá. Sắp xếp tăng dần theo tên thread.

3. {{topContendedLockWithOwner(dump, k)}} → {{List<String>}}: mỗi phần tử có dạng {{<địa chỉ> waiters=<n> owner=<tên hoặc -> ownerTop=<frame hoặc ->}}, ví dụ {{<0x000000076abba100> waiters=2 owner=worker-2 ownerTop=at demo.Worker.run(Worker.java:5)}}. Sắp xếp theo số waiter giảm dần; nếu bằng nhau thì địa chỉ tăng dần (so sánh chuỗi). Cắt {{k}} phần tử đầu. Chỉ khoá có ít nhất một waiter mới xuất hiện. {{k < 0}} ném {{IllegalArgumentException}}; {{k = 0}} trả danh sách rỗng. Nếu {{k}} lớn hơn số khoá thì trả hết.
   - {{owner}}: thread đầu tiên được tìm thấy giữ khoá đó (dòng {{- locked}} hoặc {{- <0x}}), nếu không có thì {{-}}.
   - {{ownerTop}}: frame {{at ...}} đầu tiên trong entry của người giữ khoá (lúc người giữ đang làm gì), nếu không có thì {{-}}.

Chú ý: địa chỉ lock giữ nguyên prefix {{0x}}.`,
      starter: `class ThreadDumpChainAnalyzer {
    static List<String> stuckThreads(String dump1, String dump2) {
        throw new UnsupportedOperationException("TODO");
    }

    static Map<String, String> holdAndWait(String dump) {
        throw new UnsupportedOperationException("TODO");
    }

    static List<String> topContendedLockWithOwner(String dump, int k) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); } catch (Throwable t) { if (type.isInstance(t)) return; throw new AssertionError("expected " + type.getSimpleName() + " got " + t); }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing thrown");
    }
    static String entry(String name, String state, String... lines) {
        StringBuilder sb = new StringBuilder();
        sb.append('"').append(name).append("\\" #1 prio=5 os_prio=0 cpu=10.00ms elapsed=100.00s tid=0x1 nid=0x1 waiting on condition [0x2]\\n");
        if (state != null) sb.append("   java.lang.Thread.State: ").append(state).append("\\n");
        for (String line : lines) sb.append(line).append("\\n");
        return sb.toString();
    }
    static final String LOCK_A = "<0x000000076abba100>";
    static final String LOCK_B = "<0x000000076abba200>";
    static final String LOCK_C = "<0x000000076abba300>";
    static String holds(String addr) { return "\t- locked " + addr + " (a demo.Lock)"; }
    static String waits(String addr) { return "\t- waiting to lock " + addr + " (a demo.Lock)"; }
    static String parks(String addr) { return "\t- parking to wait for " + addr + " (a demo.Lock)"; }
    static String waitsOn(String addr) { return "\t- waiting on " + addr + " (a java.lang.Object)"; }
    static final String DUMP1 = dump(
        entry("main", "RUNNABLE", "\tat demo.App.main(App.java:12)"),
        entry("worker-1", "BLOCKED (on object monitor)", "\tat demo.Worker.run(Worker.java:5)", waits(LOCK_A), holds(LOCK_B)),
        entry("worker-2", "BLOCKED (on object monitor)", "\tat demo.Worker.run(Worker.java:5)", waits(LOCK_B), holds(LOCK_A))
    );
    static final String DUMP2 = dump(
        entry("main", "RUNNABLE", "\tat demo.App.main(App.java:13)"),
        entry("worker-1", "BLOCKED (on object monitor)", "\tat demo.Worker.run(Worker.java:5)", waits(LOCK_A), holds(LOCK_B)),
        entry("worker-2", "BLOCKED (on object monitor)", "\tat demo.Worker.run(Worker.java:5)", waits(LOCK_B), holds(LOCK_A)),
        entry("worker-4", "RUNNABLE", "\tat demo.Newbie.run(Newbie.java:1)")
    );
    static String dump(String... entries) {
        StringBuilder sb = new StringBuilder();
        sb.append("Full thread dump OpenJDK 64-Bit Server VM (17.0.9+9 mixed mode, sharing)\\n\\n");
        for (String e : entries) sb.append(e).append("\\n");
        return sb.toString();
    }
    public static void main(String[] args) {
        check("stuckThreads: hai thread entry không đổi giữa hai dump", () -> {
            eq(List.of("worker-1", "worker-2"), ThreadDumpChainAnalyzer.stuckThreads(DUMP1, DUMP2));
        });
        check("stuckThreads: stack đổi thì không regarded stuck", () -> {
            List<String> stuck = ThreadDumpChainAnalyzer.stuckThreads(DUMP1, DUMP2);
            if (stuck.contains("main")) throw new AssertionError("main không được danh sách stuck");
        });
        check("stuckThreads: thread chỉ có trong một dump không tính", () -> {
            List<String> stuck = ThreadDumpChainAnalyzer.stuckThreads(DUMP1, DUMP2);
            if (stuck.contains("worker-4")) throw new AssertionError("worker-4 không được danh sách stuck");
        });
        check("holdAndWait: chỉ thread giữ và chờ", () -> {
            Map<String, String> m = ThreadDumpChainAnalyzer.holdAndWait(DUMP1);
            eq(2, m.size());
            eq(LOCK_A, m.get("worker-1"));
            eq(LOCK_B, m.get("worker-2"));
        });
        check("holdAndWait: thread chỉ chờ không giữ thì bỏ qua", () -> {
            Map<String, String> m = ThreadDumpChainAnalyzer.holdAndWait(DUMP1);
            if (m.containsKey("worker-3")) throw new AssertionError("worker-3 không giữ khoá, không được liệt kê");
        });
        check("topContendedLockWithOwner: waiter nhiều hơn đứng đầu", () -> {
            List<String> r = ThreadDumpChainAnalyzer.topContendedLockWithOwner(DUMP1, 2);
            eq(2, r.size());
            eq(LOCK_A + " waiters=1 owner=worker-2 ownerTop=at demo.Worker.run(Worker.java:5)", r.get(0));
            eq(LOCK_B + " waiters=1 owner=worker-1 ownerTop=at demo.Worker.run(Worker.java:5)", r.get(1));
        });
        check("topContendedLockWithOwner: thêm waiter cho một khoá", () -> {
            String d3 = dump(
                entry("main", "RUNNABLE"),
                entry("worker-1", "BLOCKED (on object monitor)", waits(LOCK_A), holds(LOCK_B), "\tat demo.Worker.run(Worker.java:5)"),
                entry("worker-2", "BLOCKED (on object monitor)", waits(LOCK_B), holds(LOCK_A), "\tat demo.Worker.run(Worker.java:5)"),
                entry("worker-3", "WAITING (parking)", waits(LOCK_A))
            );
            List<String> r = ThreadDumpChainAnalyzer.topContendedLockWithOwner(d3, 2);
            eq(LOCK_A + " waiters=2 owner=worker-2 ownerTop=at demo.Worker.run(Worker.java:5)", r.get(0));
            eq(LOCK_B + " waiters=1 owner=worker-1 ownerTop=at demo.Worker.run(Worker.java:5)", r.get(1));
        });
        check("topContendedLockWithOwner: k<0 ném lỗi, k=0 rỗng, k lớn trả hết", () -> {
            expect(IllegalArgumentException.class, () -> ThreadDumpChainAnalyzer.topContendedLockWithOwner(DUMP1, -1));
            eq(List.of(), ThreadDumpChainAnalyzer.topContendedLockWithOwner(DUMP1, 0));
            eq(2, ThreadDumpChainAnalyzer.topContendedLockWithOwner(DUMP1, 99).size());
        });
        check("waiting on không tính là chờ khoá", () -> {
            String d4 = dump(
                entry("main", "RUNNABLE"),
                entry("listener", "WAITING (on object monitor)", waitsOn(LOCK_A))
            );
            Map<String, String> m = ThreadDumpChainAnalyzer.holdAndWait(d4);
            if (!m.isEmpty()) throw new AssertionError("waiting on không được tính chờ khoá: " + m);
            List<String> r = ThreadDumpChainAnalyzer.topContendedLockWithOwner(d4, 5);
            if (!r.isEmpty()) throw new AssertionError("không có waiter hợp lệ: " + r);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class ThreadDumpChainAnalyzer {
    static final class Entry {
        String name;
        final List<String> lines = new ArrayList<>();
        String waits;
        final List<String> holds = new ArrayList<>();
        final List<String> frames = new ArrayList<>();
    }

    static List<String> stuckThreads(String dump1, String dump2) {
        Map<String, String> sig1 = signatures(dump1);
        Map<String, String> sig2 = signatures(dump2);
        List<String> stuck = new ArrayList<>();
        for (Map.Entry<String, String> e : sig1.entrySet()) {
            String s2 = sig2.get(e.getKey());
            if (s2 != null && s2.equals(e.getValue())) stuck.add(e.getKey());
        }
        Collections.sort(stuck);
        return stuck;
    }

    static Map<String, String> holdAndWait(String dump) {
        Map<String, String> out = new TreeMap<>();
        for (Entry e : parseEntries(dump)) {
            if (!e.holds.isEmpty() && e.waits != null) out.put(e.name, "<" + e.waits + ">");
        }
        return out;
    }

    static List<String> topContendedLockWithOwner(String dump, int k) {
        if (k < 0) throw new IllegalArgumentException("k phai >= 0: " + k);
        Map<String, Integer> waiters = new HashMap<>();
        Map<String, String> owner = new HashMap<>();
        Map<String, String> threadTop = new HashMap<>();
        for (Entry e : parseEntries(dump)) {
            if (e.name != null && !threadTop.containsKey(e.name) && !e.frames.isEmpty()) {
                threadTop.put(e.name, e.frames.get(0));
            }
            for (String held : e.holds) {
                if (!owner.containsKey(held)) owner.put(held, e.name);
            }
            if (e.waits != null) waiters.merge(e.waits, 1, Integer::sum);
        }
        List<String> locks = new ArrayList<>(waiters.keySet());
        locks.sort((a, b) -> {
            int cmp = Integer.compare(waiters.get(b), waiters.get(a));
            return cmp != 0 ? cmp : a.compareTo(b);
        });
        List<String> out = new ArrayList<>();
        int n = Math.min(k, locks.size());
        for (int i = 0; i < n; i++) {
            String lock = locks.get(i);
            String own = owner.get(lock);
            String top = own == null ? null : threadTop.get(own);
            out.add("<" + lock + "> waiters=" + waiters.get(lock) + " owner=" + (own == null ? "-" : own)
                    + " ownerTop=" + (top == null ? "-" : top));
        }
        return out;
    }

    private static Map<String, String> signatures(String dump) {
        Map<String, String> out = new HashMap<>();
        for (Entry e : parseEntries(dump)) {
            out.put(e.name, String.join("\\n", e.lines));
        }
        return out;
    }

    private static List<Entry> parseEntries(String dump) {
        List<Entry> out = new ArrayList<>();
        if (dump == null) return out;
        Entry cur = null;
        for (String raw : dump.split("\\n")) {
            String line = raw.replace("\\r", "");
            if (line.length() > 0 && line.charAt(0) == '"') {
                int end = line.indexOf('"', 1);
                if (end > 1) {
                    cur = new Entry();
                    cur.name = line.substring(1, end);
                    out.add(cur);
                }
                continue;
            }
            if (cur == null) continue;
            String t = line.trim();
            if (t.isEmpty()) continue;
            cur.lines.add(t);
            if (t.startsWith("at ")) cur.frames.add(t);
            String held = heldLock(t);
            if (held != null) cur.holds.add(held);
            String waited = waitedLock(t);
            if (waited != null && cur.waits == null) cur.waits = waited;
        }
        return out;
    }

    private static String heldLock(String t) {
        if (t.startsWith("- locked <") || t.startsWith("- <0x")) return address(t);
        return null;
    }

    private static String waitedLock(String t) {
        if (t.indexOf("- waiting to lock <") >= 0) return address(t);
        if (t.indexOf("- parking to wait for <") >= 0) return address(t);
        return null;
    }

    private static String address(String t) {
        int o = t.indexOf('<');
        if (o < 0) return null;
        int c = t.indexOf('>', o);
        if (c < 0) return null;
        return t.substring(o + 1, c);
    }
}`,
      hints: [
        'Tách dump thành dòng bằng {{split("\\n")}}, bỏ {{\r}}; giữ biến entry hiện hành, dòng bắt đầu bằng dấu nháy kép ở cột 0 mở entry mới.',
        'Trích địa chỉ khoá giữa ký tự {{<}} và {{>}} đầu tiên sau dấu hiệu; dòng {{- waiting on}} bị bỏ qua vì đó là {{wait()}}, đã nhả khoá.',
        '{{stuckThreads}}: ký hiệu entry là các dòng sau tên thread nối lại; thread stuck nếu tên trùng khớp và ký hiệu trùng nhau trong cả hai dump.',
        '{{topContendedLockWithOwner}}: comparator trả về so sánh waiter giảm dần trước, địa chỉ tăng dần làm tie-break; dùng {{Math.min(k, size)}} để cắt an toàn.'
      ],
      explain: `Bài này mô phỏng ba câu hỏi bạn đặt khi đọc dump trên production: (1) thread nào treo thực sự giữa hai lần chụp, (2) thread nào đang đồng thời giữ khoá và chờ khoá — vị trí nguy hiểm nhất trong chu kỳ deadlock, (3) khoá nào là điểm nghẽn và ai đang giữ nó, giữ rồi đang làm gì (gọi database? chờ socket?).

Ba điểm dễ sai:
- Nhầm {{- waiting on <0xA>}} với {{- waiting to lock <0xA>}}. Dòng đầu là {{wait()}}: thread đã nhả monitor, không phải người chờ khoá. Tính nó vào contention sẽ báo oan khoá không ai chờ.
- Quên khoá kiểu ReentrantLock nằm ở mục {{Locked ownable synchronizers}} dưới dạng {{- <0x...>}}, không phải dòng {{- locked}}. Quên nó thì chỉ bắt deadlock {{synchronized}}.
- Không sắp xếp rõ ràng: kết quả phải ổn định (tên thread tăng dần, waiter giảm dần, địa chỉ tăng dần làm tie-break).

Sau khi có kết quả, bước quyết định vẫn là đọc entry của người giữ khoá: nếu nó đang {{RUNNABLE}} trong {{socketRead0}} hoặc {{jdbc}} khi giữ {{synchronized}}, vấn đề là giữ khoá xuyên I/O, restart server không giúp gì. Khoá database, khoá Redis hay hàng đợi phân tán không hiện ra trong dump — bằng chứng cho những trường hợp đó phải lấy từ log driver database, metrics pool, hoặc JFR.`,
    },
  ],
  check: [
    {
      q: 'Thread dùng {{synchronized}} nhưng stack frame trên cùng là {{java.net.SocketInputStream.socketRead0}}, trạng thái {{RUNNABLE}}. Nghĩa là gì?',
      options: [
        'Thread đang ngốn CPU toàn lực',
        'Thread đang chờ dữ liệu từ socket: JVM gộp cả chạy và chặn I/O vào RUNNABLE',
        'Thread bị deadlock và cần restart ngay',
        'Thread đã kết thúc, chờ garbage collector thu hồi'
      ],
      answer: 1,
      explain: '{{java.lang.Thread}} không có trạng thái "đang chờ socket", nên mọi thread block trong đọc/ghi socket vẫn là {{RUNNABLE}}. CPU thấp với nhiều thread {{RUNNABLE}} trong {{socketRead0}} có nghĩa là chờ downstream (database, API khác), không phải het CPU. Muốn biết có thực sự chạy không, so sánh {{cpu=}} giữa hai dump hoặc dùng {{top -H -p}}. Deadlock thì hai thread đứng chết trong chu kỳ giữ-chờ và JVM in {{Found one Java-level deadlock}}, không phải chỉ một thread RUNNABLE trong socketRead.'
    },
    {
      q: 'Dòng {{- waiting on <0x000000076abba5e0> (a java.lang.Object)}} trong stack entry có nghĩa là gì?',
      options: [
        'Muốn vào {{synchronized}} nhưng chưa lấy được monitor',
        'Đang chờ một {{ReentrantLock}}, có thể tạo deadlock',
        'Đã gọi {{wait()}}: đã nhả monitor và đang chờ {{notify()}}, không giữ cũng không chờ khoá',
        'Vừa mở kết nối socket đang bắt tay TCP'
      ],
      answer: 2,
      explain: '{{obj.wait()}} trả monitor cho người khác rồi ngủ trên hàng chờ của chính object đó, nên thread ở {{WAITING (on object monitor)}}: không giữ monitor, cũng không chờ vào khoá. Hai dòng cần phân biệt: {{- waiting to lock <0xA>}} = chưa vào được {{synchronized}} (người chờ khoá); {{- waiting on <0xA>}} = đang chờ được đánh thức. Nhầm hai dòng là lỗi kinh điển khi đếm lock contention.'
    },
    {
      q: 'Khi JVM in {{Found one Java-level deadlock}}, điều nào là ĐÚNG?',
      options: [
        'JVM phát hiện mọi loại deadlock, bao gồm khoá hàng đợi database và khoá Redis',
        'Chỉ deadlock nội bộ JVM (monitor và ownable synchronizer như {{ReentrantLock}})',
        'Phải khởi động lại server ngay lập tức, không cách nào khắc phục code',
        'Deadlock chỉ xảy ra khi CPU đạt 100%'
      ],
      answer: 1,
      explain: 'JVM chỉ dựng đồ thị chờ cho khoá của chính nó: monitor và {{Locked ownable synchronizers}}. Khoá hàng đợi database (MySQL InnoDB tự ném lỗi 1213), khoá phân tán Redis/ZooKeeper, hoặc deadlock logic không xuất hiện trong dump. Deadlock không đòi hỏi CPU 100%: hai thread có thể đứng chết trong khi CPU thấp. Khắc phục là sửa code (thứ tự lấy khoá, timeout, thu nhỏ phạm vi {{synchronized}}), không phải chỉ restart server.'
    },
  ],
  related: ['jvm-011', 'concurrency-006'],
  tags: ['thread dump', 'jstack', 'jcmd', 'deadlock', 'lock contention', 'BLOCKED', 'WAITING', 'monitor'],
},
{
  id: 'lesson-jvm-014',
  track: 'jvm',
  order: 14,
  title: 'Cache static không giới hạn: đo kích thước retained và sửa bằng LRU có giới hạn byte',
  level: 'senior',
  minutes: 35,
  goals: [
    'Giải thích được vì sao static Map dùng làm cache không giới hạn gây OOM: trường static là GC root, mọi entry trong map vẫn reachable',
    'Hiểu garbage collector chỉ thu hồi object không còn đường đi từ GC root, nên giữ tham chiếu không cần thiết chính là rò rỉ bộ nhớ trong Java',
    'Đo kích thước cache (số entry và kích thước ước tính theo byte) và gắn metric hit/miss, cảnh báo khi kích thước tăng không ngừng',
    'Viết cache có giới hạn kích thước byte với chính sách đuổi LRU, theo dõi số lần eviction, hit và miss',
    'Biết khi nào nên dùng Caffeine thay vì tự viết và sao WeakReference không phải silver bullet'
  ],
  body: `**Tóm tắt:** Rò rỉ bộ nhớ trong Java hiếm khi là "quên free" như C; nó là giữ tham chiếu không cần thiết nên garbage collector không thu hồi được. Biểu hiện kinh điển là một {{static Map}} dùng làm cache: mỗi key mới (mã đơn hàng, chuỗi query kèm timestamp) tạo một entry mới, entry chưa bao giờ bị xóa, heap tăng đều, full GC chạy liên tục, rồi {{java.lang.OutOfMemoryError: Java heap space}}. Bài này dạy bạn phân biệt heap và stack ở mức nhẹ, đọc dấu hiệu leak từ đường heap sau GC, đo kích thước cache bằng số entry lẫn kích thước ước tính theo byte, rồi sửa bằng cache có giới hạn kích thước và chính sách đuổi LRU, kèm theo dõi hit/miss.

### 1) Rò rỉ bộ nhớ trong Java là gì

Trong C, rò rỉ là vùng nhớ {{malloc}} mà không ai {{free}}: không còn con trỏ nào trỏ tới, nhưng bộ nhớ vẫn bị chiếm. Java khác: garbage collector tự tìm và giải phóng mọi object **không còn đường đi từ GC root** (biến local trên stack của thread đang chạy, trường {{static}}, tham chiếu JNI, monitor đang được giữ...). Một object còn ít nhất một đường đi từ root thì JVM bắt buộc giữ, dù chương trình đã không bao giờ dùng lại nó.

Đó chính là rò rỉ bộ nhớ Java-style: object **vẫn reachable**, GC phải giữ, nhưng nghiệp vụ đã xong. Ví dụ:

~~~text
GC root: static field OrderCache.MAP
   └── HashMap                     shallow 48 byte, retained 1,6 GB
          └── Node[] table        4 triệu ô
                ├── Node → Order#1 → OrderLine[] → Product ...
                ├── Node → Order#2 → ...
                └── ... hai triệu node, không ai đọc lại
~~~

Hai triệu đơn hàng đã xử lý xong từ tuần trước vẫn sống vì trường {{static}} là **GC root** sống suốt đời ứng dụng.

### 2) Dấu hiệu leak trên đường heap

Bình thường, đường heap sau mỗi lần GC (còn gọi live set) dao động quanh một mức. Bị leak: live set tăng bậc thang qua nhiều ngày, GC chạy dày hơn, CPU dành cho GC tăng, p99 tăng, cuối cùng là OOM heap space. Một cache lớn **hợp lệ** cũng làm live set cao, nhưng nó sẽ **đi ngang** khi cache đầy; leak thì không bao giờ đi ngang.

Xác nhận leak: xem GC log, hoặc so sánh {{jcmd <pid> GC.class_histogram}} ở hai thời điểm cách nhau 30 phút. Lớp nào có số instance tăng tuyến tính ({{HashMap$Node}}, {{byte[]}}, object nghiệp vụ) là nghi phạm. Lấy heap dump bằng {{jcmd <pid> GC.heap_dump /dumps/app.hprof}} và mở trong Eclipse MAT: nhìn **dominator tree** theo **retained size** (tổng bộ nhớ giải phóng nếu object đó biến mất), rồi **path to GC roots** để biết chính xác trường field nào giữ object sống.

### 3) Cache static không giới hạn — trường hợp kinh điển

Một service đặt hàng dùng {{ConcurrentHashMap<String, OrderDto>>> orderCache}} để đọc nhanh. Key là mã đơn cộng timestamp yêu cầu, nên mỗi request là một key mới, cardinality vô hạn. Chỉ có {{put}}, không có giới hạn kích thước hay thời gian sống. Heap tăng đều, full GC mỗi 3 phút, sau ba ngày pod bị OOMKilled.

Sửa sai thường thấy: hy vọng garbage collector thu hồi, hoặc gói value trong {{WeakReference}}. Không: static field vẫn giữ key mạnh, entry không bao giờ mất. Weak reference chỉ hợp với canonical map, không dùng làm cache chính vì dữ liệu biến mất bất ngờ và hit rate không ổn định.

### 4) Đo kích thước cache trước khi sửa

Số entry alone là chưa đủ: một entry chứa {{String}} ngắn chỉ vài trăm byte, một entry chứa danh sách đơn hàng thì vài megabyte. Nên theo dõi cùng lúc:
- số entry hiện tại;
- kích thước ước tính theo byte (trong bài tập dưới, mỗi lần {{put}} bạn truyền trọng lượng byte của entry);
- số lần hit, miss, và số lần evict (đuổi entry);
- gắn alert khi kích thước tăng không ngừng theo thời gian — đó là dấu hiệu leak sớm nhất.

### 5) Sửa: giới hạn kích thước byte + đuổi LRU

Thay map thuần bằng cache có **maximum size (byte)**. Mỗi entry có trọng lượng (kích thước ước tính key + value). Khi tổng byte vượt giới hạn, đuổi entry **ít được dùng gần đây nhất** (LRU) một cách lặp cho tới khi tổng byte dưới giới hạn, đồng thời đếm số lần đuổi. {{get}} vào entry tồn tại làm entry đó trở thành mới dùng nhất. Như vậy live set của cache đi ngang ở mức giới hạn, không bao giờ tràn heap.

Code sản xuất nên dùng Caffeine ({{maximumWeight}}, {{expireAfterWrite}}, thống kê hit/miss) thay vì tự viết; tự viết giúp bạn hiểu cơ chế, Caffeine giúp bạn vận hành an toàn với gần-tránh-evict và không khóa toàn bộ cache khi đuổi entry.

### Ví dụ đời thực

Hệ thống đặt hàng trực tuyến peak 30.000 request/giây, heap 8 GB. Cache orderId + timestamp không giới hạn: heap từ 2 GB lên 7,2 GB trong ba ngày, full GC mỗi 3 phút, mỗi lần 20 giây, pod OOMKilled. Heap dump MAT: {{ConcurrentHashMap$Node}} retained 5,4 GB, đường đi từ GC root qua {{OrderService.cache}}. Sửa: thay bằng Caffeine {{maximumWeight = 500_000_000}} byte (khoảng 500 MB), {{expireAfterWrite = 10 phút}}, bật {{recordStats()}}. Kết quả: heap ổn định 1,4 GB, full GC biến mất, p99 từ 450 ms xuống 80 ms, hit rate 92 %.

### Trả lời mẫu khi phỏng vấn

"Rò rỉ bộ nhớ Java là object vẫn có đường đi từ GC root nên garbage collector phải giữ, dù code không dùng lại — ví dụ static Map làm cache không giới hạn: mỗi key mới sống mãi, heap tăng đều, full GC liên tục, rồi OutOfMemoryError. Tôi xác nhận bằng đường live set sau GC tăng bậc thang, histogram lớp tăng tuyến tính, rồi heap dump trong MAT nhìn dominator tree theo retained size và path to GC roots. Cách sửa là giới hạn cache theo số entry hoặc theo byte, đuổi theo LRU, thêm TTL; trên production tôi dùng Caffeine với maximumWeight và expireAfterWrite, kèm metric kích thước cache và alert khi tăng không ngừng. WeakReference không phải giải pháp vì dữ liệu biến mất bất ngờ."
`,
  exercises: [
    {
      title: 'BoundedSizeCache: giới hạn cache theo byte, evict LRU, theo dõi hit/miss',
      prompt: `Viết class {{BoundedSizeCache<K, V>}} giữ cache dưới một giới hạn kích thước (byte).

Yêu cầu:
- Constructor {{BoundedSizeCache(long maxBytes)}}: nếu {{maxBytes <= 0}} thì ném {{IllegalArgumentException}}.
- {{V put(K key, V value, long weightBytes)}}: thêm hoặc cập nhật entry. Nếu {{weightBytes < 0}} thì ném {{IllegalArgumentException}}. Nếu key đã có, trừ trọng lượng cũ khỏi tổng rồi cộng trọng lượng mới. Sau khi thêm, nếu tổng byte vượt {{maxBytes}} thì đuổi entry **ít được dùng gần đây nhất** (LRU), một cách lặp cho tới khi tổng byte dưới giới hạn, và tăng bộ đếm {{evictions}}. Trả về giá trị cũ của key (null nếu chưa có).
- {{V get(K key)}}: hit thì entry trở thành **mới dùng nhất**, tăng {{hits}}, trả về giá trị; miss thì tăng {{misses}}, trả về null.
- {{long sizeBytes()}}, {{int entryCount()}}, {{long hits()}}, {{long misses()}}, {{long evictions()}}.
- {{List<K> keysEldestFirst()}}: danh sách key từ ít dùng gần nhất (sắp bị đuổi) đến mới dùng nhất; gọi nhiều lần **không được thay đổi thứ tự** cache.

Gợi ý cơ chế: {{new LinkedHashMap<>(16, 0.75f, true)}} (tham số thứ ba là access-order) cộng một map lưu trọng lượng của mỗi key và một biến {{long totalBytes}}.`,
      starter: `class BoundedSizeCache<K, V> {
    private final long maxBytes;
    private final LinkedHashMap<K, V> map;
    private final Map<K, Long> weights;
    private long totalBytes;
    private long hits;
    private long misses;
    private long evictions;

    BoundedSizeCache(long maxBytes) {
        // TODO: kiểm tra maxBytes > 0, tạo LinkedHashMap access-order, khởi tạo bộ đếm
        throw new UnsupportedOperationException("TODO");
    }

    V put(K key, V value, long weightBytes) {
        throw new UnsupportedOperationException("TODO");
    }

    V get(K key) {
        throw new UnsupportedOperationException("TODO");
    }

    long sizeBytes() {
        throw new UnsupportedOperationException("TODO");
    }

    int entryCount() {
        throw new UnsupportedOperationException("TODO");
    }

    long hits() {
        throw new UnsupportedOperationException("TODO");
    }

    long misses() {
        throw new UnsupportedOperationException("TODO");
    }

    long evictions() {
        throw new UnsupportedOperationException("TODO");
    }

    List<K> keysEldestFirst() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, Runnable r) {
        total++;
        try { r.run(); passed++; System.out.println("PASS " + name); }
        catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); }
    }
    static void eq(Object expected, Object actual) {
        if (!Objects.equals(expected, actual)) throw new AssertionError("expected " + expected + " got " + actual);
    }
    static void expect(Class<? extends Throwable> type, Runnable r) {
        try { r.run(); } catch (Throwable t) { if (type.isInstance(t)) return; throw new AssertionError("expected " + type.getSimpleName() + " got " + t); }
        throw new AssertionError("expected " + type.getSimpleName() + " but nothing thrown");
    }
    public static void main(String[] args) {
        check("vượt giới hạn byte thì đuổi entry cũ nhất", () -> {
            BoundedSizeCache<String, Integer> c = new BoundedSizeCache<>(100);
            eq(null, c.put("a", 1, 60));
            eq(null, c.put("b", 2, 60));
            eq(60L, c.sizeBytes());
            eq(1, c.entryCount());
            eq(1L, c.evictions());
            eq(null, c.get("a"));
            eq(2, c.get("b"));
            eq(List.of("b"), c.keysEldestFirst());
        });
        check("get làm mới thứ tự (LRU chứ không phải FIFO)", () -> {
            BoundedSizeCache<String, Integer> c = new BoundedSizeCache<>(100);
            c.put("a", 1, 40);
            c.put("b", 2, 40);
            c.put("c", 3, 40);
            eq(2, c.get("b"));
            eq(null, c.put("d", 4, 40));
            eq(2, c.get("b"));
            eq(null, c.get("c"));
            eq(4, c.get("d"));
            eq(List.of("b", "d"), c.keysEldestFirst());
            eq(2L, c.evictions());
        });
        check("cap nhat key da co: doi trong luong, khong duoi ai", () -> {
            BoundedSizeCache<String, Integer> c = new BoundedSizeCache<>(100);
            eq(null, c.put("a", 1, 100));
            eq(1, c.put("a", 9, 100));
            eq(100L, c.sizeBytes());
            eq(1, c.entryCount());
            eq(0L, c.evictions());
            eq(9, c.get("a"));
        });
        check("tham so khong hop le nem IllegalArgumentException", () -> {
            expect(IllegalArgumentException.class, () -> new BoundedSizeCache<String, String>(0));
            expect(IllegalArgumentException.class, () -> new BoundedSizeCache<String, String>(-5));
            BoundedSizeCache<String, String> c = new BoundedSizeCache<>(100);
            expect(IllegalArgumentException.class, () -> c.put("a", "x", -1));
        });
        check("bo dem ban dau va get key khong co", () -> {
            BoundedSizeCache<String, String> c = new BoundedSizeCache<>(1000);
            eq(0L, c.sizeBytes());
            eq(0, c.entryCount());
            eq(0L, c.hits());
            eq(0L, c.misses());
            eq(0L, c.evictions());
            eq(null, c.get("missing"));
            eq(0L, c.hits());
            eq(1L, c.misses());
        });
        check("keysEldestFirst khong lam doi thu tu", () -> {
            BoundedSizeCache<String, Integer> c = new BoundedSizeCache<>(100);
            c.put("x", 1, 60);
            c.put("y", 2, 60);
            c.keysEldestFirst();
            c.keysEldestFirst();
            c.put("z", 3, 60);
            eq(List.of("z"), c.keysEldestFirst());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class BoundedSizeCache<K, V> {
    private final long maxBytes;
    private final LinkedHashMap<K, V> map;
    private final Map<K, Long> weights = new HashMap<>();
    private long totalBytes;
    private long hits;
    private long misses;
    private long evictions;

    BoundedSizeCache(long maxBytes) {
        if (maxBytes <= 0) throw new IllegalArgumentException("maxBytes phai > 0: " + maxBytes);
        this.maxBytes = maxBytes;
        this.map = new LinkedHashMap<>(16, 0.75f, true);
    }

    V put(K key, V value, long weightBytes) {
        if (weightBytes < 0) throw new IllegalArgumentException("weight phai >= 0: " + weightBytes);
        Long oldWeight = weights.put(key, weightBytes);
        V oldValue = map.put(key, value);
        if (oldValue != null) {
            totalBytes -= oldWeight;
        }
        totalBytes += weightBytes;
        while (totalBytes > maxBytes && !map.isEmpty()) {
            Iterator<Map.Entry<K, V>> it = map.entrySet().iterator();
            Map.Entry<K, V> eldest = it.next();
            it.remove();
            Long w = weights.remove(eldest.getKey());
            totalBytes -= (w == null ? 0 : w);
            evictions++;
        }
        return oldValue;
    }

    V get(K key) {
        V value = map.get(key);
        if (value == null) {
            misses++;
            return null;
        }
        hits++;
        return value;
    }

    long sizeBytes() {
        return totalBytes;
    }

    int entryCount() {
        return map.size();
    }

    long hits() {
        return hits;
    }

    long misses() {
        return misses;
    }

    long evictions() {
        return evictions;
    }

    List<K> keysEldestFirst() {
        return new ArrayList<>(map.keySet());
    }
}`,
      hints: [
        '{{LinkedHashMap}} access-order=true: {{get}}/{{put}} đưa entry vào cuối, entry đầu là ít dùng gần nhất.',
        'Cập nhật key đã có phải trừ trọng lượng cũ khỏi {{totalBytes}} trước khi cộng trọng lượng mới.',
        'Vòng {{while}} đuổi entry đầu (iterator + remove) cho tới khi {{totalBytes}} dưới giới hạn.',
        '{{keysEldestFirst}} trả {{new ArrayList<>(map.keySet())}}: duyệt keySet không tính là access, không đổi thứ tự LRU.'
      ],
      explain: `Bài này bắt bạn viết đúng cache có giới hạn kích thước byte — kỹ thuật chặn rò rỉ bộ nhớ từ cache: live set đi ngang ở mức giới hạn thay vì tăng mãn mãn.

Ba điểm dễ sai:
- Quên trừ trọng lượng cũ khi cập nhật key đã có: tổng byte sẽ mãi tăng, eviction chạy sai.
- Chỉ đuổi một entry mỗi lần {{put}}: một entry quá lớn có thể khiến tổng byte vẫn vượt giới hạn, phải lặp cho tới khi dưới giới hạn.
- Duyệt {{map}} bằng {{get}} trong {{keysEldestFirst}}: mỗi {{get}} di chuyển entry về cuối, đổi thứ tự LRU và làm sai kết quả. Dùng {{new ArrayList<>(map.keySet())}}.

Trên production hãy dùng Caffeine ({{maximumWeight}}, {{expireAfterWrite}}, {{recordStats()}}) thay vì tự viết; tự viết giúp bạn hiểu cơ chế LRU, Caffeine giúp vận hành an toàn với gần-tránh-evict và không khóa toàn bộ cache khi đuổi. Gắn metric kích thước cache và alert khi tăng không ngừng theo thời gian — đó là dấu hiệu leak sớm nhất. WeakReference không phải đáp án cache chính: dữ liệu biến mất bất ngờ khi GC, hit rate không ổn định.`,
    },
  ],
  check: [
    {
      q: 'Vì sao một {{static Map}} dùng làm cache không giới hạn gây {{OutOfMemoryError: Java heap space}}?',
      options: [
        'Vì garbage collector không chạy',
        'Vì trường {{static}} là GC root, nên mọi entry trong map vẫn reachable',
        'Vì HashMap tự động tạo entry mới',
        'Vì key là kiểu String'
      ],
      answer: 1,
      explain: 'Trường {{static}} của class còn sống là GC root: map reachable → key/value reachable → object không bị thu hồi dù nghiệp vụ đã xong. Garbage collector vẫn chạy như bình thường; HashMap không tự tạo entry; và key kiểu String không liên quan — bất kỳ key nào cũng bị giữ nếu map còn static.'
    },
    {
      q: 'Chính sách LRU đuổi entry nào khi cache vượt giới hạn?',
      options: [
        'Entry mới được thêm nhất',
        'Entry ít được dùng gần đây nhất',
        'Entry lớn nhất theo byte',
        'Entry ngẫu nhiên'
      ],
      answer: 1,
      explain: 'LRU (Least Recently Used) luôn đuổi entry đã lâu nhất không được truy cập. Với {{LinkedHashMap}} access-order=true, mỗi {{get}}/{{put}} đưa entry về cuối, nên entry đầu danh sách chính là mục tiêu đuổi. Không phải entry lớn nhất (cách đó cần theo dõi trọng lượng mỗi entry), cũng không phải ngẫu nhiên.'
    },
    {
      q: 'Sau khi thay map cache không giới hạn bằng cache có giới hạn byte + TTL, đường live set sau GC sẽ thế nào?',
      options: [
        'Tăng mãi không bao giờ dừng',
        'Đi ngang ở mức gần giới hạn cache',
        'Giảm về không sau mỗi full GC',
        'Biến thành 0 sau khi restart'
      ],
      answer: 1,
      explain: 'Cache có giới hạn byte (maximumWeight) và TTL giữ số lượng entry dưới trần, nên live set sau GC đi ngang ở mức gần giới hạn thay vì tăng bậc thang. Tăng mãi là dấu hiệu leak; giảm về không sau full GC không xảy ra vì cache còn đang dùng những entry sống; restart chỉ dời lỗi, không xử lý nguyên nhân.'
    },
    {
      q: 'Tại sao không nên dùng {{WeakReference}} làm cache chính trên production?',
      options: [
        'Vì garbage collector không thu hồi weak reference',
        'Vì dữ liệu có thể biến mất bất ngờ khi GC và hit rate không ổn định',
        'Vì weak reference giữ object mãi mãi',
        'Vì chỉ dùng được cho key kiểu String'
      ],
      answer: 1,
      explain: 'Weak reference bị GC thu hồi ở lần quét vùng chứa object nếu chỉ còn weak ref, nên dữ liệu trong cache có thể biến mất bất ngờ và hit rate không ổn định — không dùng làm cache chính. Weak reference không giữ object mãi (ngược lại) và không giới hạn chỉ cho key String. Nó hợp với canonical map, còn cache production nên có giới hạn kích thước + TTL tường minh (Caffeine).'
    },
  ],
  related: ['jvm-004', 'jvm-005'],
  tags: ['memory leak', 'cache', 'LRU', 'OOM', 'Caffeine', 'retained size', 'GC root'],
},
{
  id: 'lesson-jvm-015',
  track: 'jvm',
  order: 15,
  title: 'Thread pool saturation: doc dump va metric de nhan ra pool can kiet',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giai thich vi sao thread pool can kiet lam request xep hang hoac bi reject',
    'Doc thread dump de dem thread theo trang thai trong tung pool',
    'Phan biet pool can kiet voi downstream cham va voi deadlock',
    'Thiet ke nguong canh bao va cach xu ly: timeout, bulkhead, tang pool hop ly'
  ],
  body: `**Tom tat:** Thread pool can kiet xay ra khi moi thread trong pool deu dang ban va queue day, nen request moi bi reject hoac cho qua timeout. Day la loi production pho bien khi downstream cham. Thread dump cho thay phan lon thread o cung mot cho (cho database/API) va pool khong con thread ranh.

### 1) Co che pool
ExecutorService giu mot tap thread co dinh. Khi submit task, neu het thread ranh thi task vao queue. Khi queue day, reject. So thread toi da = maximumPoolSize. Neu task giu thread lau (cho I/O), pool can kiet nhanh.

### 2) Dau hieu
- Metric: activeThreads == poolSize, queueSize tang, rejectedCount tang.
- Thread dump: nhieu thread cung trang thai WAITING/BLOCKED tai cung method (socketRead0, jdbc).
- CPU thap, latency cao.

### 3) Phan biet
- Downstream cham: thread cho I/O, CPU thap, khong deadlock.
- Deadlock: chu ky giu-cho, CPU thap.
- Pool can kiet: queue day, reject, khong chu ky.

### 4) Xu ly
- Dat timeout cho downstream.
- Bulkhead: tach pool cho cac downstream khac nhau.
- Circuit breaker khi downstream fail.
- Tang pool can than: them thread tang context switch va memory.

### Lien he phong van
Interviewer hoi: lam sao biet pool can kiet? Tra loi: metric active==max + queue day + dump cung cho; xu ly timeout/bulkhead.

### 5) Vi du so lieu
Pool size 20, queue 100, active 20, queue 100, rejected 5/phut. CPU 15%, latency p99 2s. Dump: 20 thread tai socketRead0.

### Lien he phong van 2
Interviewer hoi them: khi nao tang pool? Tra loi: khi CPU thap va downstream cham, tang pool chi tam thoi; can timeout va bulkhead.

### 6) Them mot vi du so lieu thuc te
He thong don hang co pool 50 thread, queue 200. Gio cao diem: active 50, queue 200, rejected 30/s. CPU 20%, latency p99 5s. Thread dump: 50 thread dang o ~~~text
java.net.SocketInputStream.socketRead0
~~~ va ~~~text
oracle.jdbc.driver.T4CPreparedStatement.execute
~~~. Khong co deadlock. Nguyen nhan: database cham (full table scan). Xu ly: them index, dat timeout query 2s, tang pool toi 100 tam thoi, su dung bulkhead tach pool doc/ghi.

### 7) Bien phap phong ngua
- Metric: theo doi {{threadpool.active}}, {{threadpool.queue.size}}, {{threadpool.rejected}} tren Prometheus/Grafana.
- Alert khi {{active == max}} va {{queue > 0.8 * maxQueue}} trong 1 phut.
- Circuit breaker: khi downstream loi > 50% trong 10s, mo circuit, fallback luon tra ve loi nhanh khong tiep tuc cho.
- Load test truoc khi deploy: kiem tra latency va rejection rate o tai trong 30 phut.

### Lien he phong van 3
Interviewer hoi: neu tang pool thi rat? Tra loi: tang pool giam reject nhung tang context switch, memory, va co the lam cham database nua. Can ket hop timeout va circuit breaker.`,
  exercises: [
    {
      title: 'Dem thread theo trang thai trong pool',
      prompt: 'Viet ham countStates(lines) tra ve Map<String,Integer> dem so thread co trang thai BLOCKED/WAITING/RUNNABLE trong dump (dong chua "java.lang.Thread.State: X").',
      starter: 'import java.util.*;\nclass Analyzer {\n    static Map<String,Integer> countStates(List<String> lines) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String n, boolean ok, String d){total++; if(ok){passed++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": "+d);}\n    public static void main(String[] args){\n        List<String> ls=List.of("java.lang.Thread.State: BLOCKED (on object monitor)","x","java.lang.Thread.State: WAITING (on condition)","java.lang.Thread.State: RUNNABLE");\n        Map<String,Integer> m=Analyzer.countStates(ls);\n        check("blocked count", Integer.valueOf(1).equals(m.get("BLOCKED")), "got "+m);\n        check("waiting count", Integer.valueOf(1).equals(m.get("WAITING")), "got "+m);\n        check("runnable count", Integer.valueOf(1).equals(m.get("RUNNABLE")), "got "+m);\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nclass Analyzer {\n    static Map<String,Integer> countStates(List<String> lines) {\n        Map<String,Integer> m=new HashMap<>();\n        for(String l:lines){\n            if(l.contains("java.lang.Thread.State:")){\n                String[] parts=l.split(":");\n                String st=parts[1].trim().split(" ")[0];\n                m.put(st,m.getOrDefault(st,0)+1);\n            }\n        }\n        return m;\n    }\n}',
      hints: ['Tim dong chua "java.lang.Thread.State:".', 'Lay token dau sau dau hai cham.'],
      explain: 'Dem trang thai thread giup nhan ra pool can kiet: neu phan lon BLOCKED/WAITING cung mot cho, downstream cham.'
    }
  ],
  check: [
    { q: 'Thread pool can kiet thuong co CPU the nao?', options: ['Cao 100%', 'Thap', 'Khong doi', 'Ngau nhien'], answer: 1, explain: 'Pool can kiet thuong do cho I/O nen CPU thap.' },
    { q: 'Metric nao bao pool can kiet?', options: ['active < max', 'active == max va queue day', 'CPU 100%', 'GC pause cao'], answer: 1, explain: 'active == max va queue day la dau hieu.' }
  ],
  related: ['jvm-004'],
  tags: ['thread pool', 'saturation', 'dump', 'metric']
},
{
  id: 'lesson-jvm-016',
  track: 'jvm',
  order: 16,
  title: 'Heap dump va retained size: tim GC root giu object',
  level: 'senior',
  minutes: 35,
  goals: [
    'Hieu shallow size va retained size',
    'Biet GC root la gi va vi sao object van song',
    'Dung dominator tree de tim thu pham leak',
    'So sanh hai heap dump de thay tang truong'
  ],
  body: `**Tom tat:** Heap dump la anh chup toan bo object trong heap. De tim leak, ban xem retained size (kich thuoc object + moi object chi no giu) va GC root (duong di tu root toi object). Dominator tree giup tim object giu nhieu bo nho nhat.

### 1) Shallow vs retained
- Shallow size: kich thuoc chinh object.
- Retained size: shallow + moi object ma chi object nay giu (dominated). Neu giai phong object, retained size la luong bo nho duoc tra lai.

### 2) GC root
GC root la diem xuat phat cua do thi reachability: static field, thread stack local, JNI reference, monitor. Object reachable tu root thi song. Leak thuong do root giu reference khong can thiet (static Map, ThreadLocal).

### 3) Dominator tree
Dominator tree to chuc object theo "ai giu ai": node A dominates B neu moi duong tu root den B deu qua A. Object co retained size lon o goc dominator tree la thu pham.

### 4) So sanh hai dump
Lay dump truoc va sau tai, so sanh histogram theo class: class nao tang dot bien la nghi pham. Ket hop voi GC root de xac nhan.

### Lien he phong van
Interviewer hoi: retained size la gi? Tra loi: luong bo nho bi giu boi object va khong the thu hoi neu object con song.

### 5) Vi du so lieu
Object A shallow 10, B 5, C 3; retained A = 18. Neu A bi giai phong, 18 don vi bo nho duoc tra lai.

### Lien he phong van 2
Interviewer hoi them: khac biet shallow va retained? Tra loi: shallow la kich thuoc chinh, retained la tong giu.

### 6) Quy trinh thuc te: lay heap dump va phan tich
1. Lay dump: ~~~bash
jcmd <pid> GC.heap_dump /tmp/heap.hprof
~~~ (can chay cung user). Hoac ~~~bash
jmap -dump:live,format=b,file=/tmp/heap.hprof <pid>
~~~.
2. Mo bang Memory Analyzer Tool (MAT) hoac VisualVM.
3. Chay {{Histogram}} -> tim class co so instance tang dot bien.
4. Chon instance -> {{Merge Shortest Paths to GC Roots}} -> {{exclude weak/soft/phantom}} -> tim dominator.
5. Xac dinh static field / ThreadLocal / cache map giu reference.

### 7) Vi du so lieu thuc te
He thong co 2GB heap. Sau 1 tien trang: {{java.lang.String}} 1.2GB (50%), {{com.example.OrderCache$Entry}} 300MB (15%). MAT retained size cua {{OrderCache}} static field = 300MB. Cache khong gioi han them entry moi request, khong evict. Sua: chuyen sang Caffeine {{maximumWeight(200_000_000)}}, {{expireAfterWrite(10, MINUTES)}}.

### 8) So sanh hai dump
Lay dump 1 (truc tiep sau khoi dong) va dump 2 (sau 1 tien). So sanh {{Histogram}}: class {{OrderCache$Entry}} tang tu 1,000 -> 50,000 instance. Retained size tang tu 6MB -> 300MB. Xac nhan leak o cache static.

### Lien he phong van 3
Interviewer hoi: retained size tinh the nao? Tra loi: shallow + tat ca object chi no giu (dominated). Neu object A giu B, B giu C, va khong co ai giu B/C nua, retained A = shallow A + retained B.`,
  exercises: [
    {
      title: 'Tinh retained size trong do thi object',
      prompt: 'Cho do thi object: Map<String,List<String>> children. Tinh retained size cua node root = shallow[root] + sum retained cua cac node chi root giu (node khong co predecessor khac). Giả su DAG don gian: retained(node)=shallow(node)+sum retained(child) neu node la dominator duy nhat.',
      starter: 'import java.util.*;\nclass HeapAnalyzer {\n    static int retained(Map<String,Integer> shallow, Map<String,List<String>> children) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String n, boolean ok, String d){total++; if(ok){passed++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": "+d);}\n    public static void main(String[] args){\n        Map<String,Integer> sh=new HashMap<>(); sh.put("A",10); sh.put("B",5); sh.put("C",3);\n        Map<String,List<String>> ch=new HashMap<>(); ch.put("A",List.of("B","C")); ch.put("B",List.of()); ch.put("C",List.of());\n        check("retained A", HeapAnalyzer.retained(sh,ch)==18, "got "+HeapAnalyzer.retained(sh,ch));\n        // test 2: single node\n        Map<String,Integer> sh2=new HashMap<>(); sh2.put("X",7);\n        Map<String,List<String>> ch2=new HashMap<>(); ch2.put("X",List.of());\n        check("retained single", HeapAnalyzer.retained(sh2,ch2)==7, "got "+HeapAnalyzer.retained(sh2,ch2));\n        // test 3: chain A->B->C\n        Map<String,Integer> sh3=new HashMap<>(); sh3.put("A",1); sh3.put("B",2); sh3.put("C",3);\n        Map<String,List<String>> ch3=new HashMap<>(); ch3.put("A",List.of("B")); ch3.put("B",List.of("C")); ch3.put("C",List.of());\n        check("retained chain", HeapAnalyzer.retained(sh3,ch3)==6, "got "+HeapAnalyzer.retained(sh3,ch3));\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nclass HeapAnalyzer {\n    static int retained(Map<String,Integer> shallow, Map<String,List<String>> children) {\n        // tim root: node khong xuat hien trong children cua bat ky node nao\n        Set<String> allChildren = new HashSet<>();\n        for (List<String> list : children.values()) allChildren.addAll(list);\n        String root = null;\n        for (String k : shallow.keySet()) if (!allChildren.contains(k)) { root = k; break; }\n        if (root == null) root = shallow.keySet().iterator().next();\n        Map<String,Integer> memo = new HashMap<>();\n        return dfs(root, shallow, children, memo);\n    }\n    static int dfs(String n, Map<String,Integer> sh, Map<String,List<String>> ch, Map<String,Integer> memo){\n        if (memo.containsKey(n)) return memo.get(n);\n        int r = sh.getOrDefault(n, 0);\n        for (String c : ch.getOrDefault(n, List.of())) r += dfs(c, sh, ch, memo);\n        memo.put(n, r);\n        return r;\n    }\n}',
      hints: ['Duyet post-order, cong shallow + children retained.'],
      explain: 'Retained size giup xac dinh object giu nhieu bo nho nhat; trong thuc te dung tool (MAT) de tinh dominator.'
    }
  ],
  check: [
    { q: 'Retained size cua object la gi?', options: ['Kich thuoc chinh object', 'Kich thuoc object + moi object chi no giu', 'Kich thuoc heap', 'Kich thuoc stack'], answer: 1, explain: 'Retained size = shallow + dominated objects.' },
    { q: 'GC root la gi?', options: ['Object lon nhat', 'Diem xuat phat reachability', 'Thread pool', 'Classloader'], answer: 1, explain: 'GC root la diem xuat phat cua do thi reachability.' }
  ],
  related: ['jvm-005'],
  tags: ['heap dump', 'retained size', 'GC root', 'dominator']
},
{
  id: 'lesson-jvm-017',
  track: 'jvm', order: 17,
  title: 'So sánh nhiều thread dump: phát hiện deadlock ngắt quãng và lock ordering',
  level: 'senior',
  minutes: 35,
  goals: ['Hiểu vì sao một deadlock chỉ xuất hiện ngắt quãng', 'Biết cách lấy và so sánh 3 dump liên tiếp', 'Nhận ra lock ordering sai qua stack trace', 'Phân biệt deadlock thật với livelock'],
  body: `**Tóm tắt:** Deadlock không phải lúc nào JVM cũng in "Found one Java-level deadlock" nếu chu trình khóa xuất hiện rồi biến mất giữa hai lần chụp. Lấy 3 dump cách 5 giây, so sánh stack và lock id để bắt chu kỳ lock ordering sai.

### 1) Deadlock ngắt quãng là gì
Deadlock là hai (hoặc nhiều) thread mỗi thread giữ một lock và chờ lock của thread khác, tạo chu kỳ. JVM chỉ phát hiện và in dòng "Found one Java-level deadlock" khi tại đúng thời điểm chụp dump chu kỳ đó còn tồn tại. Nếu transaction giữ lock ngắn, chu kỳ chỉ tồn tại vài ms, dump có thể chụp đúng lúc không có chu kỳ → không thấy deadlock trong dump, nhưng ứng dụng vẫn treo ngẫu nhiên.

### 2) Vì sao cần nhiều dump
Một dump là ảnh chụp 1 ms. Để phân biệt:
- Treo thực sự (deadlock/livelock): stack giống hệt qua 3 dump liên tiếp.
- Chờ tạm thời (query chậm): stack thay đổi, thread tiến triển.
- Deadlock ngắt quãng: dump 1 có thread A waiting to lock L2 (giữ L1), dump 2 không có, dump 3 lại có → chu kỳ xuất hiện rồi biến mất.

### 3) Lock ordering
Khi cần nhiều lock, luôn acquire theo thứ tự cố định (ví dụ theo hash của lock id). Nếu code chỗ này lock L1 rồi L2, chỗ kia lock L2 rồi L1 → deadlock ngẫu nhiên. Sửa: sắp xếp lock theo id cố định trước khi lock.

### 4) Livelock vs deadlock
Deadlock: thread đứng yên mãi. Livelock: thread liên tục retry nhưng không tiến (CPU cao, không deadlock section). Dump cho thấy thread RUNNABLE với stack retry.

### 5) Ví dụ đời thực
Dịch vụ chuyển tiền: 2% giao dịch treo ngẫu nhiên, không có deadlock section. 3 dump cho thấy Thread-1 locked <0x111> waiting <0x222>, Thread-2 locked <0x222> waiting <0x111> ở dump 1 và 3 nhưng không ở dump 2. Nguyên nhân: lock theo thứ tự account id không nhất quán. Sửa lock ordering → hết treo.

### 6) Trả lời mẫu khi phỏng vấn
Khi ứng dụng treo ngẫu nhiên và dump không có deadlock section, tôi lấy 3 dump liên tiếp cách 5 giây. Nếu stack giống hệt qua mọi dump = treo thực sự. Nếu chỉ xuất hiện ở một số dump = deadlock ngắt quãng do lock ordering sai. Tôi nhóm thread theo "locked"/"waiting to lock", tìm chu kỳ theo tay, rồi sửa bằng lock ordering cố định và giảm phạm vi synchronized. Nếu thread RUNNABLE liên tục retry mà không tiến = livelock, xử lý bằng backoff.

### 7) Lỗi hay gặp
- Chỉ lấy 1 dump rồi kết luận không deadlock.
- Nhầm livelock với deadlock.
- Không so sánh lock id giữa các dump.

### 8) Phòng ngừa
- Lock ordering cố định, tránh nested lock.
- Thêm timeout cho lock (tryLock với timeout).
- Monitor số thread BLOCKED và retry count.

> Senior tip: 3 dump cách 5 giây là tối thiểu để bắt deadlock ngắt quãng; so sánh lock id giữa các dump thay vì chỉ đọc deadlock section.`,
  exercises: [
    {
      title: 'Phát hiện chu kỳ lock từ danh sách locked/waiting',
      prompt: 'Cho danh sách các thread: mỗi thread có held lock và waited lock. Viết hàm hasCycle trả về true nếu có chu kỳ (deadlock).',
      starter: 'import java.util.*;\nclass LockCycle {\n    static boolean hasCycle(Map<String,String> held, Map<String,String> waited) {\n        throw new UnsupportedOperationException("TODO");\n    }\n}',
      tests: 'public class Main {\n    static int passed=0,total=0;\n    static void check(String n, boolean ok, String d){total++; if(ok){passed++;System.out.println("PASS "+n);}else System.out.println("FAIL "+n+": "+d);}\n    public static void main(String[] args){\n        // cycle A->B->A\n        Map<String,String> h=new HashMap<>(); h.put("T1","L1"); h.put("T2","L2");\n        Map<String,String> w=new HashMap<>(); w.put("T1","L2"); w.put("T2","L1");\n        check("cycle", LockCycle.hasCycle(h,w), "expected true");\n        // no cycle\n        Map<String,String> h2=new HashMap<>(); h2.put("T1","L1");\n        Map<String,String> w2=new HashMap<>(); w2.put("T1","L2");\n        check("no-cycle", !LockCycle.hasCycle(h2,w2), "expected false");\n        // self deadlock\n        Map<String,String> h3=new HashMap<>(); h3.put("T1","L1");\n        Map<String,String> w3=new HashMap<>(); w3.put("T1","L1");\n        check("self", LockCycle.hasCycle(h3,w3), "expected true");\n        System.out.println("RESULT "+passed+"/"+total);\n    }\n}',
      reference: 'import java.util.*;\nclass LockCycle {\n    static boolean hasCycle(Map<String,String> held, Map<String,String> waited) {\n        // map lock -> thread holding it\n        Map<String,String> lockHolder = new HashMap<>();\n        for (Map.Entry<String,String> e : held.entrySet()) lockHolder.put(e.getValue(), e.getKey());\n        for (String t : waited.keySet()) {\n            String cur = t;\n            Set<String> seen = new HashSet<>();\n            while (true) {\n                String wl = waited.get(cur);\n                if (wl == null) break;\n                String holder = lockHolder.get(wl);\n                if (holder == null) break;\n                if (seen.contains(holder)) return true;\n                seen.add(holder);\n                cur = holder;\n                if (cur.equals(t)) return true;\n            }\n        }\n        return false;\n    }\n}',
      hints: ['Xây map lock->thread holder, rồi đi theo waited chain.'],
      explain: 'Phát hiện chu kỳ trong đồ thị chờ: thread T1 giữ L1 chờ L2, thread giữ L2 chờ L1 → deadlock.'
    }
  ],
  check: [
    { q: 'Deadlock ngắt quãng xuất hiện trong dump thế nào?', options: ['Luôn có deadlock section', 'Chỉ ở một số dump, không phải tất cả', 'CPU 100%', 'OOM'], answer: 1, explain: 'Chu kỳ chỉ tồn tại vài ms, dump có thể chụp lúc không có.' },
    { q: 'Livelock khác deadlock ở điểm nào?', options: ['Thread đứng yên', 'Thread RUNNABLE retry liên tục không tiến', 'OOM', 'StackOverflow'], answer: 1, explain: 'Livelock: CPU cao, không deadlock section.' }
  ],
  related: ['jvm-003', 'jvm-007'],
  tags: ['thread dump', 'deadlock', 'lock ordering', 'livelock']
},
{
  id: 'lesson-jvm-018',
  track: 'jvm', order: 18,
  title: 'Memory leak qua ThreadLocal và listener không unregister trong web app',
  level: 'senior',
  minutes: 35,
  goals: ['Hiểu vì sao ThreadLocal trong thread pool gây leak', 'Biến listener/event handler thành nguồn leak', 'Biết cách phòng ngừa: remove() và unregister', 'Đo retained size để xác nhận'],
  body: `**Tóm tắt:** Trong web app, thread pool tái sử dụng thread. Nếu dùng ThreadLocal mà không remove(), giá trị gắn với thread sống mãi → leak. Listener/event handler không unregister cũng giữ tham chiếu. Sửa bằng try/finally remove() và unregister trong destroy.

### 1) ThreadLocal trong thread pool
ThreadLocal gắn giá trị vào Thread object. Thread pool tái sử dụng cùng thread cho request sau, nên nếu không remove() sau request, giá trị cũ (thường chứa user context, connection) vẫn còn → leak và rò rỉ dữ liệu giữa request.

### 2) Listener không unregister
Đăng ký listener vào event bus / observable nhưng không unregister khi component destroy → listener giữ tham chiếu tới object lớn → object không GC được. Trong web app: servlet filter, HttpSessionListener, application context listener.

### 3) Classloader leak khi redeploy
Web app redeploy: classloader cũ bị giữ bởi thread (ThreadLocal, timer, thread pool không shutdown) → metaspace tăng mỗi redeploy → OutOfMemoryError: Metaspace.

### 4) Phát hiện
Heap dump: tìm GC root là ThreadLocalMap / Thread, retained size lớn. Metric: heap tăng sau mỗi redeploy, metaspace tăng.

### 5) Ví dụ đời thực
Ứng dụng Spring Boot dùng ThreadLocal để lưu userId cho logging. Sau 10.000 request, heap tăng 200 MB. Nguyên nhân: filter không gọi ThreadLocal.remove() trong finally. Sửa: try/finally remove(). Heap ổn định.

### 6) Trả lời mẫu khi phỏng vấn
Trong web app chạy trên thread pool, ThreadLocal là nguồn leak phổ biến: thread không bị GC nên giá trị gắn với nó sống mãi nếu không remove(). Tôi luôn bọc trong try/finally remove(). Listener và observer phải unregister trong destroy/lifecycle callback. Khi redeploy, thread pool và timer phải shutdown để tránh classloader leak → Metaspace OOM. Để xác nhận, lấy heap dump và xem retained size của ThreadLocalMap và GC root.

### 7) Lỗi hay gặp
- Quên remove() trong finally.
- Đăng ký listener nhiều lần → leak nhân lên.
- Không shutdown executor khi context destroy.

### 8) Phòng ngừa
- try/finally remove() cho mọi ThreadLocal.
- Unregister listener trong @PreDestroy / destroy().
- Shutdown executor và timer trong context destroyed.
- Monitor metaspace và heap sau redeploy.
- Dùng InheritableThreadLocal cẩn thận: giá trị truyền sang thread con, dễ rò rỉ nếu không remove.
- Tránh lưu object lớn trong ThreadLocal (connection, user session lớn).

### Liên hệ phỏng vấn
Interviewer hay hỏi: vì sao ThreadLocal leak trong thread pool, cách detect qua heap dump, và classloader leak khi redeploy. Trả lời: thread không bị GC nên giá trị sống mãi; remove() trong finally; shutdown executor; monitor metaspace.

> Senior tip: ThreadLocal.remove() trong finally là quy tắc bắt buộc trong mọi filter/servlet; leak ThreadLocal trong thread pool vừa rò rỉ bộ nhớ vừa rò rỉ dữ liệu giữa request.`,
  exercises: [
    {
      title: 'Quản lý ThreadLocal an toàn',
      prompt: 'Viết UserContext với set/get/clear dùng ThreadLocal, đảm bảo clear() gọi remove().',
      starter: 'public class UserContext {\n    private static final ThreadLocal<String> ctx = new ThreadLocal<>();\n    public static void set(String u) { throw new UnsupportedOperationException("TODO"); }\n    public static String get() { throw new UnsupportedOperationException("TODO"); }\n    public static void clear() { throw new UnsupportedOperationException("TODO"); }\n}',
      tests: 'public class Main {\n    public static void main(String[] args) {\n        UserContext.set("alice");\n        if ("alice".equals(UserContext.get())) System.out.println("PASS setget"); else System.out.println("FAIL setget");\n        UserContext.clear();\n        if (UserContext.get() == null) System.out.println("PASS clear"); else System.out.println("FAIL clear");\n        // simulate reuse\n        UserContext.set("bob");\n        if ("bob".equals(UserContext.get())) System.out.println("PASS reuse"); else System.out.println("FAIL reuse");\n        UserContext.clear();\n        System.out.println("RESULT 3/3");\n    }\n}',
      reference: 'public class UserContext {\n    private static final ThreadLocal<String> ctx = new ThreadLocal<>();\n    public static void set(String u) { ctx.set(u); }\n    public static String get() { return ctx.get(); }\n    public static void clear() { ctx.remove(); }\n}',
      hints: ['ThreadLocal.remove() thay vì set(null).'],
      explain: 'remove() xóa entry khỏi ThreadLocalMap, tránh leak; set(null) vẫn giữ entry.'
    }
  ],
  check: [
    { q: 'Vì sao ThreadLocal trong thread pool gây leak?', options: ['Thread bị GC', 'Thread sống mãi và giữ giá trị', 'HashMap chậm', 'GC không chạy'], answer: 1, explain: 'Thread pool tái sử dụng thread, giá trị không remove thì sống mãi.' },
    { q: 'Cách đúng để xóa ThreadLocal?', options: ['set(null)', 'remove()', 'Thread.interrupt()', 'System.gc()'], answer: 1, explain: 'remove() xóa entry khỏi map.' }
  ],
  related: ['jvm-004', 'jvm-016'],
  tags: ['ThreadLocal', 'memory leak', 'listener', 'classloader', 'web']
},
{
  id: 'lesson-jvm-019',
  track: 'jvm', order: 19,
  title: 'Đọc một thread dump: tìm deadlock và lock bị tranh chấp nhiều nhất',
  level: 'senior',
  minutes: 30,
  goals: [
    'Đọc được các trạng thái thread (RUNNABLE, BLOCKED, WAITING, TIMED_WAITING) trong thread dump',
    'Tìm deadlock bằng đồ thị locked/waiting-on',
    'Đếm số thread BLOCKED trên cùng một monitor để tìm lock tranh chấp nhiều nhất',
    'Liên hệ với jstack, jcmd Thread.print và cách thu thập dump đúng lúc'
  ],
  body: `**Tóm tắt:** Thread dump là ảnh chụp stack của mọi thread tại một thời điểm. Một thread BLOCKED nghĩa là nó đang chờ monitor (synchronized/ReentrantLock không fair). Deadlock xuất hiện khi đồ thị "thread A giữ lock X chờ lock Y, thread B giữ Y chờ X" có chu trình. Lock bị tranh chấp nhiều nhất là lock có nhiều thread BLOCKED cùng chờ — đó là bottleneck cần tối ưu trước.

### 1) Thread dump là gì và thu thập thế nào
Thread dump (jstack <pid>, hoặc jcmd <pid> Thread.print) in ra stack trace của mọi thread đang sống. Mỗi thread có tên, trạng thái, stack và danh sách monitor đang giữ/đang chờ. Thu thập lúc hệ thống chậm (không phải lúc rảnh) và lặp 3–5 lần cách nhau 5 giây để thấy pattern.

### 2) Các trạng thái quan trọng
- RUNNABLE: đang chạy hoặc chờ CPU/IO ở mức OS (có thể là socket read).
- BLOCKED: đang chờ vào synchronized block bị thread khác giữ.
- WAITING / TIMED_WAITING: chờ notify/sleep/join/await.
BLOCKED nhiều trên cùng lock = contention cao.

### 3) Tìm deadlock
JVM tự phát hiện deadlock cổ điển (synchronized) và in phần "Found one Java-level deadlock". Với ReentrantLock/StampedLock thì JVM không tự phát hiện — phải tự vẽ đồ thị: node thread, cạnh "đang chờ lock L", và lock L do thread nào giữ. Có chu trình = deadlock.

### 4) Lock tranh chấp nhiều nhất
Đếm số thread ở trạng thái BLOCKED và cùng "waiting to lock <monitor>". Lock có số waiter lớn nhất là bottleneck. Sửa: thu nhỏ synchronized block, dùng lock phân mảnh (ConcurrentHashMap segment), hoặc lock-free (CAS, atomic).

### 5) Ví dụ đời thực
API thanh toán p99 latency 2s. Ba thread dump cách 5s cho thấy 48/200 thread BLOCKED trên cùng monitor java.util.HashMap (lock 0x...), stack tại OrderService.updateStatus. Root cause: HashMap dùng chung cho cache order, synchronized toàn map. Sửa: ConcurrentHashMap + computeIfAbsent. p99 về 80ms.

### 6) Trả lời mẫu khi phỏng vấn
Khi hệ thống chậm tôi thu 3–5 thread dump cách 5s bằng jcmd Thread.print. Tôi lọc thread BLOCKED và đếm theo monitor: lock có nhiều waiter nhất là bottleneck. Deadlock: JVM báo nếu synchronized; với ReentrantLock phải tự vẽ đồ thị wait-for. Sửa contention bằng thu nhỏ critical section, lock phân mảnh hoặc cấu trúc concurrent. Tôi cũng luôn thu dump khi còn chậm, không chờ restart.

### 7) Lỗi hay gặp
- Chỉ thu một dump: không phân biệt deadlock với peak tạm thời.
- Nhầm RUNNABLE socket read là CPU-bound.
- Bỏ qua thread daemon/background.
- Không correlate với metric CPU/GC.

### 8) Phòng ngừa
- Thu dump tự động khi latency vượt ngưỡng (script + jcmd).
- Dùng lock có timeout (tryLock) để tránh deadlock vĩnh viễn.
- Monitor contention qua JFR Lock contention event.
- Giữ critical section nhỏ, tránh gọi I/O trong synchronized.

### Liên hệ phỏng vấn
Interviewer hỏi: làm thế nào phát hiện deadlock không được JVM báo, và cách tìm lock contention. Trả lời: vẽ đồ thị wait-for cho ReentrantLock; đếm BLOCKED theo monitor; thu nhiều dump; dùng JFR.

> Senior tip: Một dump chỉ là ảnh chụp — luôn thu 3–5 dump cách 5 giây và so sánh; deadlock và contention thật sự sẽ xuất hiện nhất quán qua các dump, còn peak tạm thời thì không.`,
  exercises: [
    {
      title: 'Phân tích thread dump để tìm deadlock và lock tranh chấp nhiều nhất',
      prompt: `Viết {{ThreadDumpAnalyzer}} phân tích một chuỗi thread dump dạng text (đã cho sẵn trong code). API:
- {{deadlock()}}: trả về true nếu có chu trình trong đồ thị wait-for (thread đang chờ lock mà lock đó đang được thread khác giữ).
- {{mostContended()}}: trả về tên monitor (chuỗi sau "waiting to lock") có nhiều thread BLOCKED nhất; nếu không có thì null. Nếu hòa, trả về tên nhỏ nhất theo thứ tự từ điển.
- {{blockedCount()}}: tổng số thread ở trạng thái BLOCKED.

Dữ liệu dump mẫu được hard-code trong constructor (xem starter).`,
      starter: `import java.util.*;\n\nclass ThreadDumpAnalyzer {\n    private final String dump;\n    ThreadDumpAnalyzer() {\n        this.dump = \"Thread-1 BLOCKED waiting to lock <0xabc> owned by Thread-2\\n\" +\n                    \"Thread-2 BLOCKED waiting to lock <0xdef> owned by Thread-1\\n\" +\n                    \"Thread-3 BLOCKED waiting to lock <0xabc>\\n\" +\n                    \"Thread-4 RUNNABLE\\n\";\n    }\n    boolean deadlock() { throw new UnsupportedOperationException(\"TODO\"); }\n    String mostContended() { throw new UnsupportedOperationException(\"TODO\"); }\n    int blockedCount() { throw new UnsupportedOperationException(\"TODO\"); }\n}`,
      tests: `public class Main {\n    static int passed = 0, total = 0;\n    static void check(String name, Runnable r) {\n        total++;\n        try { r.run(); passed++; System.out.println(\"PASS \" + name); }\n        catch (Throwable t) { System.out.println(\"FAIL \" + name + \": \" + t); }\n    }\n    static void eq(Object e, Object a) { if (!Objects.equals(e, a)) throw new AssertionError(\"exp \" + e + \" got \" + a); }\n    public static void main(String[] args) {\n        ThreadDumpAnalyzer a = new ThreadDumpAnalyzer();\n        check(\"deadlock detected\", () -> eq(true, a.deadlock()));\n        check(\"most contended lock\", () -> eq(\"<0xabc>\", a.mostContended()));\n        check(\"blocked count\", () -> eq(3, a.blockedCount()));\n        System.out.println(\"RESULT \" + passed + \"/\" + total);\n    }\n}`,
      reference: `import java.util.*;\n\nclass ThreadDumpAnalyzer {\n    private final String dump;\n    ThreadDumpAnalyzer() {\n        this.dump = \"Thread-1 BLOCKED waiting to lock <0xabc> owned by Thread-2\\n\" +\n                    \"Thread-2 BLOCKED waiting to lock <0xdef> owned by Thread-1\\n\" +\n                    \"Thread-3 BLOCKED waiting to lock <0xabc>\\n\" +\n                    \"Thread-4 RUNNABLE\\n\";\n    }\n    private List<String[]> parsed() {\n        List<String[]> out = new ArrayList<>();\n        for (String line : dump.split(\"\\n\")) {\n            String[] p = line.trim().split(\"\\\\s+\");\n            if (p.length >= 4 && p[1].equals(\"BLOCKED\")) {\n                // thread name, BLOCKED, waiting, to, lock, [owned, by, owner]\n                String lock = p[5];\n                String owner = p.length >= 9 ? p[8] : null;\n                out.add(new String[]{p[0], lock, owner});\n            }\n        }\n        return out;\n    }\n    boolean deadlock() {\n        Map<String, String> waitOwner = new HashMap<>();\n        Map<String, String> lockOwner = new HashMap<>();\n        for (String[] r : parsed()) {\n            if (r[2] != null) lockOwner.put(r[1], r[2]);\n            waitOwner.put(r[0], r[1]);\n        }\n        // wait-for graph: thread -> owner of lock it waits for\n        for (String t : waitOwner.keySet()) {\n            Set<String> seen = new HashSet<>();\n            String cur = t;\n            while (cur != null && seen.add(cur)) {\n                String lock = waitOwner.get(cur);\n                if (lock == null) break;\n                String owner = lockOwner.get(lock);\n                if (owner == null) break;\n                if (owner.equals(t)) return true;\n                cur = owner;\n            }\n        }\n        return false;\n    }\n    String mostContended() {\n        Map<String, Integer> cnt = new TreeMap<>();\n        for (String[] r : parsed()) cnt.merge(r[1], 1, Integer::sum);\n        String best = null; int max = 0;\n        for (Map.Entry<String,Integer> e : cnt.entrySet()) {\n            if (e.getValue() > max || (e.getValue() == max && (best == null || e.getKey().compareTo(best) < 0))) {\n                max = e.getValue(); best = e.getKey();\n            }\n        }\n        return max == 0 ? null : best;\n    }\n    int blockedCount() { return parsed().size(); }\n}`,
      hints: [
        'Parse từng dòng: thread name, state, và lock đang chờ (token sau "lock").',
        'Deadlock: xây đồ thị wait-for: thread -> owner của lock nó chờ; có chu trình thì deadlock.',
        'mostContended: đếm số thread BLOCKED theo lock, trả về lock có count lớn nhất (tie-break theo tên).'
      ],
      explain: `Deadlock cổ điển JVM tự báo, nhưng với ReentrantLock phải tự vẽ đồ thị wait-for. Lock contention cao nhất là lock có nhiều thread BLOCKED cùng chờ — đó là bottleneck cần tối ưu trước. Thu dump nhiều lần để phân biệt deadlock thật với peak tạm thời.`
    }
  ],
  check: [
    { q: 'Thread ở trạng thái BLOCKED đang làm gì?', options: ['Đang chạy trên CPU', 'Đang chờ vào synchronized block bị thread khác giữ', 'Đang sleep', 'Đang chờ I/O'], answer: 1, explain: 'BLOCKED = đang chờ monitor của synchronized. RUNNABLE mới là đang chạy/chờ CPU; WAITING/TIMED_WAITING là sleep/join/await.' },
    { q: 'Với ReentrantLock, JVM có tự phát hiện deadlock không?', options: ['Có, luôn luôn', 'Không, phải tự vẽ đồ thị wait-for', 'Chỉ khi fair=true', 'Chỉ khi lock có timeout'], answer: 1, explain: 'JVM chỉ tự phát hiện deadlock synchronized. Với ReentrantLock/StampedLock phải tự xây đồ thị thread→lock→owner và tìm chu trình.' }
  ],
  related: ['jvm-004', 'jvm-017'],
  tags: ['thread dump', 'deadlock', 'contention', 'jstack']
},
{
  id: 'lesson-jvm-020',
  track: 'jvm', order: 20,
  title: 'Memory leak qua cache static không giới hạn: đo kích thước và sửa bằng bound + LRU',
  level: 'senior',
  minutes: 30,
  goals: [
    'Nhận diện memory leak qua static collection không giới hạn',
    'Đo retained size / kích thước cache để xác nhận leak',
    'Sửa bằng cache có bound (max size) và eviction (LRU/TTL)',
    'So sánh heap trước/sau để chứng minh fix'
  ],
  body: `**Tóm tắt:** Cache static không giới hạn là memory leak kinh điển: static field là GC root, map giữ mọi entry đã từng put, heap tăng đều qua các lần full GC. Cách sửa không phải "dùng weak" mà là cache có bound (max entries) và eviction (LRU hoặc TTL), đo retained size/heap trước và sau để chứng minh.

### 1) Vì sao static cache không bound là leak
Static field sống theo classloader → GC root. Map static → mọi key/value reachable → không bị thu hồi dù nghiệp vụ đã xong. Heap dùng tăng dần, full GC không giải phóng, cuối cùng OOM. Đây là leak phổ biến nhất trong Java service.

### 2) Đo để xác nhận
- Heap dump (jmap -dump, MAT): retained size của map và đường tới GC root (static field).
- Metric: live set sau full GC tăng đều qua các lần dọn.
- Log size() của cache theo thời gian.
Nếu live set tăng đều → leak, không phải thiếu heap.

### 3) Sửa: bound + eviction
- Bound: max entries (size-based) hoặc max bytes (weight-based).
- Eviction: LRU (LinkedHashMap access-order hoặc Caffeine), TTL (expireAfterWrite), hoặc LFU (Caffeine W-TinyLFU).
- Chọn eviction theo pattern truy cập: LRU cho temporal locality, TTL cho dữ liệu có thời hạn, size-based cho memory bound.

### 4) So sánh trước/sau
Trước: heap live set 3.0→3.2→3.4 GB, p99 2.5s. Sau: live set ổn định 1.1 GB, p99 95ms. Luôn đo để chứng minh fix, không chỉ "cảm thấy".

### 5) Ví dụ đời thực
Service e-commerce cache product theo productId trong static HashMap<String, Product>. Sau 2 tuần: 2.4M entry, 1.2 GB retained. Sửa: Caffeine maximumSize=500_000, expireAfterWrite=5m. Heap ổn định 400 MB, p99 80ms.

### 6) Trả lời mẫu khi phỏng vấn
Cache static không bound là leak vì static field là GC root. Tôi không dùng weak cho cache chính vì hit rate không ổn định. Tôi dùng cache có bound và TTL (Caffeine) và đo live set sau full GC để xác nhận leak/fix. Weak chỉ dùng cho canonical map hoặc metadata.

### 7) Lỗi hay gặp
- Tưởng weak reference là cache đủ tốt.
- Bound theo size nhưng không có eviction → vẫn leak cho tới bound rồi OOM đột ngột.
- Không đo retained size → không biết fix có hiệu quả.
- Dùng ConcurrentHashMap làm cache mà không bound.

### 8) Phòng ngừa
- Mọi cache phải có max size hoặc TTL.
- Monitor cache size và hit rate.
- Heap dump định kỳ trong staging.
- Review code: static collection phải có eviction hoặc cleanup.

### Liên hệ phỏng vấn
Interviewer hỏi: vì sao static cache leak, cách detect qua heap dump/MAT, và chọn eviction policy nào. Trả lời: static là GC root; đo retained size; bound + LRU/TTL; weak không đủ cho cache chính.

> Senior tip: Đừng tuning heap vô hạn để che leak — heap lớn làm full GC đắt hơn. Luôn nhìn live set sau full GC: tăng đều = leak, lấy heap dump tìm retained set.`,
  exercises: [
    {
      title: 'Cache có bound và eviction LRU',
      prompt: `Viết {{BoundedCache<K,V>}} có sức chứa tối đa {{capacity}}: put thêm/ghi đè; khi vượt capacity thì loại entry LRU (least recently used). get trả về value (null nếu không có) và đánh dấu key vừa dùng. size() trả về số phần tử.`,
      starter: `class BoundedCache<K, V> {\n    private final int capacity;\n    BoundedCache(int capacity) { this.capacity = capacity; }\n    V get(K key) { throw new UnsupportedOperationException(\"TODO\"); }\n    void put(K key, V value) { throw new UnsupportedOperationException(\"TODO\"); }\n    int size() { throw new UnsupportedOperationException(\"TODO\"); }\n}`,
      tests: `public class Main {\n    static int passed = 0, total = 0;\n    static void check(String name, Runnable r) { total++; try { r.run(); passed++; System.out.println(\"PASS \" + name); } catch (Throwable t) { System.out.println(\"FAIL \" + name + \": \" + t); } }\n    static void eq(Object e, Object a) { if (!Objects.equals(e,a)) throw new AssertionError(\"exp \"+e+\" got \"+a); }\n    public static void main(String[] args) {\n        check(\"evicts LRU\", () -> {\n            BoundedCache<String,Integer> c = new BoundedCache<>(2);\n            c.put(\"a\",1); c.put(\"b\",2); c.get(\"a\"); c.put(\"c\",3);\n            eq(null,c.get(\"b\")); eq(1,c.get(\"a\")); eq(3,c.get(\"c\")); eq(2,c.size());\n        });\n        check(\"capacity 1\", () -> {\n            BoundedCache<Integer,String> c = new BoundedCache<>(1);\n            c.put(1,\"x\"); c.put(2,\"y\");\n            eq(null,c.get(1)); eq(\"y\",c.get(2)); eq(1,c.size());\n        });\n        check(\"update refreshes\", () -> {\n            BoundedCache<String,Integer> c = new BoundedCache<>(2);\n            c.put(\"a\",1); c.put(\"b\",2); c.put(\"a\",10); c.put(\"c\",3);\n            eq(null,c.get(\"b\")); eq(10,c.get(\"a\"));\n        });\n        System.out.println(\"RESULT \" + passed + \"/\" + total);\n    }\n}`,
      reference: `import java.util.*;\nclass BoundedCache<K, V> {\n    private final Map<K, V> map;\n    BoundedCache(int capacity) {\n        this.map = new LinkedHashMap<K, V>(16, 0.75f, true) {\n            @Override protected boolean removeEldestEntry(Map.Entry<K,V> eldest) {\n                return size() > capacity;\n            }\n        };\n    }\n    V get(K key) { return map.get(key); }\n    void put(K key, V value) { map.put(key, value); }\n    int size() { return map.size(); }\n}`,
      hints: [
        'Dùng LinkedHashMap với accessOrder=true và override removeEldestEntry.',
        'removeEldestEntry được gọi sau mỗi put; trả true khi size() > capacity.',
        'get() với access-order cũng cập nhật thứ tự truy cập.'
      ],
      explain: `LinkedHashMap access-order giữ entry lâu nhất không dùng ở đầu danh sách; removeEldestEntry loại nó khi vượt capacity. Mọi thao tác O(1). Đây là bản tối giản; production dùng Caffeine (W-TinyLFU, hit rate tốt hơn, hỗ trợ weight và async).`
    }
  ],
  check: [
    { q: 'Vì sao static HashMap không bound là memory leak?', options: ['GC không quét static', 'Static field là GC root nên mọi entry reachable', 'HashMap tự cache', 'Soft reference'], answer: 1, explain: 'Static field là GC root; map giữ mọi entry → object không bị thu hồi dù nghiệp vụ xong.' },
    { q: 'Cách chứng minh fix cache leak hiệu quả?', options: ['Tăng heap', 'Đo live set sau full GC trước/sau', 'Gọi System.gc()', 'Dùng weak reference'], answer: 1, explain: 'Live set sau full GC tăng đều = leak; ổn định sau fix = hiệu quả. Tăng heap che leak; System.gc() không đáng tin; weak không phải fix chính.' }
  ],
  related: ['jvm-001', 'jvm-004'],
  tags: ['memory leak', 'cache', 'LRU', 'Caffeine', 'heap dump']
},
{
  id: 'lesson-jvm-021',
  track: 'jvm', order: 21,
  title: 'Phân tích nhiều thread dump: timeline trạng thái, top contended lock và deadlock chắc chắn',
  level: 'senior',
  minutes: 35,
  goals: [
    'Đọc trạng thái thread (RUNNABLE, BLOCKED, WAITING, TIMED_WAITING) từ thread dump và biết ý nghĩa từng trạng thái',
    'Vẽ lock owner chain từ các thread BLOCKED: ai chờ lock nào, ai nắm lock đó',
    'Tìm top contended lock (nhiều thread BLOCKED nhất) trong mỗi dump và theo dõi sự thay đổi qua các dump',
    'Xác nhận deadlock: cùng nhóm thread BLOCKED trên cùng lock trong ≥2 dump liên tiếp là dấu hiệu nghi ngờ; xác định chắc chắn bằng vẽ chain owner và tìm chu trình chờ lock'
  ],
  body: `**Tóm tắt:** Phân tích nhiều thread dump theo chuỗi thời gian: mỗi dump là chụp trạng thái tất cả thread ({{RUNNABLE}}, {{BLOCKED}}, {{WAITING}}, {{TIMED_WAITING}}) cùng lock đang chờ/nắm. Dùng timeline trạng thái qua các dump để phân biệt "tạm thời chờ" và "kẹt vĩnh viễn", tìm lock bị tranh chấp nhất (nhiều thread {{BLOCKED}} nhất), và xác định deadlock chắc chắn khi cùng nhóm thread bị {{BLOCKED}} trên cùng lock trong ít nhất 2 dump liên tiếp.

### Mỗi dump là một chụp, không phải phim
Thread dump (jstack, jcmd, hoặc khi JVM crash) chụp toàn bộ thread tại một thời điểm: tên thread, trạng thái, stack trace, lock đang chờ và lock đang nắm. Một dump đơn lẻ chỉ mô tả tình huống tại thời điểm chụp — thread {{BLOCKED}} lúc này có thể đã {{RUNNABLE}} giây sau. Do đó **phải xem nhiều dump cách nhau vài giây** để phân biệt chờ tạm thời và kẹt vĩnh viễn.

### Ý nghĩa từng trạng thái thread
- {{RUNNABLE}}: đang chạy hoặc sẵn sàng chạy (đợi CPU, hoặc đang đọc/ghi socket ở mức OS; không phải đợi khoá).
- {{BLOCKED}}: đang chờ vào một monitor/synchronized block. Thread này bị **chặn bởi lock** mà thread khác đang nắm — dấu hiệu đơm sínt nhất về tranh chấp khoá.
- {{WAITING}}: đợi vô thời hạn ({{Object.wait()}}, {{Thread.join()}}, {{LockSupport.park()}}) để nhận tín hiệu từ thread khác.
- {{TIMED_WAITING}}: đợi có giới hạn thời gian ({{Thread.sleep()}}, {{Object.wait(long)}}, {{parkNanos}}).

{{WAITING}}/{{TIMED_WAITING}} không nhất thiết là lỗi — có thể là thread pool đang idle. {{BLOCKED}} mới là dấu hiệu tranh chấp khoá nghiêm trọng.

### Lock owner chain: ai nắm khoá, ai đang chờ
Một thread {{BLOCKED}} luôn chờ một lock, và lock đó được nắm bởi một thread khác (lock owner). Chuỗi: T1 {{BLOCKED}} chờ lock L (nắm bởi T2), T2 {{BLOCKED}} chờ lock M (nắm bởi T3), ..., quay lại T1 → **deadlock cycle**.

Trong jstack, tìm:
- {{waiting to lock <0x...>}}: lock thread đang chờ
- {{locked <0x...>}}: lock thread đang nắm

Dùng địa chỉ {{<0x...>}} để nối các thread thành chuỗi sở hữu lock.

### Top contended lock mỗi dump
Đếm số thread {{BLOCKED}} đang waiting to lock cùng địa chỉ {{<0x...>}} (cùng lock). Lock có số thread chờ nhiều nhất là **top contended lock** — điểm nóng cần sửa đầu tiên. Nếu top lock thay đổi giữa các dump, tranh chấp dịch chuyển; nếu không đổi, đó là bottleneck cố định.

### Deadlock chắc chắn cần ≥2 dump
Một thread {{BLOCKED}} trong dump 1 có thể chỉ chờ tạm thời (critical section dài). Nếu **cùng thread** vẫn {{BLOCKED}} trên **cùng lock** trong dump 2 và dump 3 (cách nhau vài giây), đó là dấu hiệu nghi ngờ deadlock/hang chặt, chưa chắc chắn. Xác định chắc chắn bằng vẽ lock owner chain: từ thread {{BLOCKED}} đi theo lock nó đang chờ → thread nắm lock đó → thread đó đang chờ lock nào tiếp. Nếu chuỗi quay về thread bắt đầu (chu trình wait-for), đó là deadlock xác định. Không có chu trình → thread nắm lock đang xử lý dài hoặc gọi I/O đồng bộ, không phải deadlock.

### Ví dụ đời thực
Hệ thống xử lý thanh toán: dump 1 có 5 thread {{BLOCKED}} chờ lock trên {{PaymentService.lock}}, dump 2 (3 giây sau) vẫn 5 thread cùng chờ cùng lock, dump 3 vẫn vậy. Lock owner là thread "reconciliation" đang {{WAITING}} trên DB connection. Nguyên nhân: reconciliation thread nắm {{PaymentService.lock}} rồi gọi DB sync bên trong synchronized block → chặn mọi thread thanh toán. Sửa: tách lock, không gọi I/O bên trong synchronized block.

### Trả lời mẫu khi phỏng vấn
Khi được cho nhiều thread dump và hỏi "tìm vấn đề", tôi sẽ: (1) đọc trạng thái mỗi thread, (2) vẽ lock owner chain từ các thread {{BLOCKED}}, (3) tìm top contended lock, (4) so sánh qua ≥2 dump để phân biệt tạm thời vs vĩnh viễn, (5) nếu cùng chuỗi xuất hiện nhiều lần → deadlock, đề xuất tách lock và tránh gọi I/O bên trong synchronized block.

### Liên hệ phỏng vấn
Interviewer hỏi: khác biệt {{BLOCKED}} vs {{WAITING}}, cách đọc jstack {{waiting to lock}} / {{locked}}, vì sao cần ≥2 dump để chắc deadlock, và top contended lock là gì. Trả lời ngắn gọn, có ví dụ chain thread A→B→C→A.`,
  exercises: [
    {
      title: 'DumpAnalyzer: top contended lock và thread BLOCKED trong mọi dump',
      prompt: `Phân tích thread dump. Lớp {{DumpEntry}} mô tả một thread trong dump: tên thread, trạng thái ({{RUNNABLE}}, {{BLOCKED}}, {{WAITING}}, {{TIMED_WAITING}}), lock đang chờ, thread nắm lock. Hoàn thiện {{DumpAnalyzer}}:

- {{topContendedLock(dump)}}: trả về tên lock có nhiều thread {{BLOCKED}} đang chờ nhất. Trả về null nếu không có thread {{BLOCKED}} nào hoặc nếu nhiều lock cùng số lượng chờ nhiều nhất.
- {{threadsBlockedInAll(dumps)}}: trả về danh sách tên thread bị {{BLOCKED}} trong **tất cả** các dump, sắp xếp theo thứ tự bảng chữ cái. Trả về danh sách rỗng nếu không có thread chung.

{{DumpEntry}} đã có sẵn (constructor 4 tham số). Không được thêm field mới vào {{DumpEntry}}.`,
      starter: `import java.util.*;
class DumpEntry {
    final String thread;
    final String state;
    final String lock;
    final String owner;
    DumpEntry(String thread, String state, String lock, String owner) {
        this.thread = thread;
        this.state = state;
        this.lock = lock;
        this.owner = owner;
    }
}
class DumpAnalyzer {
    String topContendedLock(List<DumpEntry> dump) {
        throw new UnsupportedOperationException("TODO");
    }
    List<String> threadsBlockedInAll(List<List<DumpEntry>> dumps) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
      tests: `import java.util.*;
public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        DumpAnalyzer a = new DumpAnalyzer();
        List<DumpEntry> d1 = Arrays.asList(
            new DumpEntry("T1", "BLOCKED", "L1", "T3"),
            new DumpEntry("T2", "BLOCKED", "L1", "T3"),
            new DumpEntry("T3", "RUNNABLE", null, null),
            new DumpEntry("T4", "BLOCKED", "L2", "T3"),
            new DumpEntry("T5", "WAITING", null, null)
        );
        check("top contended lock is L1 (2 waiters)", "L1".equals(a.topContendedLock(d1)), "got " + a.topContendedLock(d1));
        List<DumpEntry> d2 = Arrays.asList(
            new DumpEntry("T1", "RUNNABLE", null, null),
            new DumpEntry("T2", "BLOCKED", "L2", "T1"),
            new DumpEntry("T3", "BLOCKED", "L2", "T1"),
            new DumpEntry("T4", "WAITING", null, null)
        );
        check("top contended lock is L2 (2 waiters)", "L2".equals(a.topContendedLock(d2)), "got " + a.topContendedLock(d2));
        List<DumpEntry> d3 = Arrays.asList(
            new DumpEntry("T1", "RUNNABLE", null, null),
            new DumpEntry("T2", "RUNNABLE", null, null)
        );
        check("no blocked threads returns null", a.topContendedLock(d3) == null, "got " + a.topContendedLock(d3));
        List<DumpEntry> d4 = Arrays.asList(
            new DumpEntry("T1", "BLOCKED", "L1", "T3"),
            new DumpEntry("T2", "BLOCKED", "L1", "T3"),
            new DumpEntry("T3", "BLOCKED", "L2", "T4"),
            new DumpEntry("T4", "BLOCKED", "L2", "T3")
        );
        check("tie between L1 and L2 returns null", a.topContendedLock(d4) == null, "got " + a.topContendedLock(d4));
        List<List<DumpEntry>> seq = Arrays.asList(d1, d2);
        List<String> blocked = a.threadsBlockedInAll(seq);
        check("T2 blocked in both dumps", blocked.contains("T2") && blocked.size() == 1, "got " + blocked);
        List<List<DumpEntry>> seq2 = Arrays.asList(d3, d4);
        List<String> blocked2 = a.threadsBlockedInAll(seq2);
        check("no common blocked thread", blocked2.isEmpty(), "got " + blocked2);
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
class DumpEntry {
    final String thread;
    final String state;
    final String lock;
    final String owner;
    DumpEntry(String thread, String state, String lock, String owner) {
        this.thread = thread;
        this.state = state;
        this.lock = lock;
        this.owner = owner;
    }
}
class DumpAnalyzer {
    String topContendedLock(List<DumpEntry> dump) {
        Map<String, Integer> count = new HashMap<>();
        for (DumpEntry e : dump) {
            if ("BLOCKED".equals(e.state) && e.lock != null) {
                count.merge(e.lock, 1, Integer::sum);
            }
        }
        String best = null;
        int bestCount = 0;
        boolean tie = false;
        for (Map.Entry<String, Integer> en : count.entrySet()) {
            if (en.getValue() > bestCount) {
                bestCount = en.getValue();
                best = en.getKey();
                tie = false;
            } else if (en.getValue() == bestCount) {
                tie = true;
            }
        }
        return tie || best == null ? null : best;
    }
    List<String> threadsBlockedInAll(List<List<DumpEntry>> dumps) {
        if (dumps.isEmpty()) return Collections.emptyList();
        Set<String> common = new HashSet<>();
        for (DumpEntry e : dumps.get(0)) {
            if ("BLOCKED".equals(e.state)) common.add(e.thread);
        }
        for (int i = 1; i < dumps.size(); i++) {
            Set<String> blocked = new HashSet<>();
            for (DumpEntry e : dumps.get(i)) {
                if ("BLOCKED".equals(e.state)) blocked.add(e.thread);
            }
            common.retainAll(blocked);
        }
        List<String> result = new ArrayList<>(common);
        Collections.sort(result);
        return result;
    }
}`,
      hints: [
        'Chỉ đếm thread có state bằng "{{BLOCKED}}" và lock khác null.',
        'Dùng {{HashMap<String, Integer>}} để đếm số lần mỗi lock xuất hiện; tìm lock có số đếm lớn nhất, trả null nếu có nhiều lock cùng số.',
        'threadsBlockedInAll: lấy tập thread BLOCKED của dump đầu, dùng {{Set.retainAll}} với từng dump kế tiếp, rồi {{Collections.sort}} kết quả.'
      ],
      explain: `{{topContendedLock}}: duyệt tất cả entry, chỉ đếm những thread có {{state}} bằng "{{BLOCKED}}" và {{lock}} khác null. Dùng {{HashMap<String, Integer>}} để đếm số lần mỗi lock xuất hiện. Tìm lock có số đếm lớn nhất; nếu có nhiều lock cùng số đếm lớn nhất (hoặc không có entry nào) thì trả về null.

{{threadsBlockedInAll}}: lấy tập thread {{BLOCKED}} của dump đầu tiên, rồi duyệt qua các dump kế tiếp và giữ lại chỉ những thread còn xuất hiện (dùng {{Set.retainAll}}). Cuối cùng sắp xếp kết quả theo thứ tự bảng chữ cái bằng {{Collections.sort}}.

Ví dụ: dump 1 có T1, T2 BLOCKED trên L1; dump 2 có T1 BLOCKED trên L2, T2 RUNNABLE. threadsBlockedInAll = [T1] vì chỉ T1 bị BLOCKED trong cả hai dump.`,
    }
  ],
  check: [
    {
      q: 'Trạng thái thread nào trong thread dump cho thấy thread đang chờ vào một lock (monitor/synchronized block)?',
      options: ['RUNNABLE', 'BLOCKED', 'WAITING', 'TIMED_WAITING'],
      answer: 1,
      explain: 'BLOCKED là trạng thái đang chờ vào monitor lock. RUNNABLE đang chạy hoặc sẵn sàng chạy; WAITING/TIMED_WAITING đợi tín hiệu hoặc thời gian, không nhất thiết chờ lock.'
    },
    {
      q: 'Vì sao cần phân tích ≥2 thread dump cách nhau vài giây thay vì chỉ 1 dump?',
      options: ['Dump đầu luôn sai', 'Để phân biệt chờ tạm thời và kẹt vĩnh viễn (deadlock)', 'JStack chỉ đọc được dump thứ 2', 'Dump thứ 2 có nhiều thông tin hơn'],
      answer: 1,
      explain: 'Một dump là chụp tại một thời điểm. Cùng thread BLOCKED trong ≥2 dump liên tiếp là dấu hiệu nghi ngờ deadlock/hang chặt; cần vẽ chain owner (thread → lock chờ → thread nắm lock) và tìm chu trình để xác định deadlock.'
    },
    {
      q: 'Lock nào được gọi là top contended lock trong một thread dump?',
      options: ['Lock mà nhiều thread nhất đang waiting to lock', 'Lock được nắm bởi thread chính', 'Lock có địa chỉ 0x nhỏ nhất', 'Lock được nhắc đến nhiều nhất trong stack trace'],
      answer: 0,
      explain: 'Top contended lock là lock có số thread BLOCKED đang waiting to lock nhiều nhất — đây là điểm nóng tranh chấp khoá cần xử lý đầu tiên.'
    },
    {
      q: 'Trong jstack, trường nào cho biết thread đang chờ vào lock nào?',
      options: ['locked <0x...>', 'waiting to lock <0x...>', 'java.lang.Thread.State', 'tên thread'],
      answer: 1,
      explain: '{{waiting to lock <0x...>}} chỉ ra lock thread đang chờ; {{locked <0x...>}} chỉ ra lock thread đang nắm. Dùng địa chỉ <0x...> để nối các thread thành chuỗi sở hữu lock.'
    }
  ],
  related: ['jvm-004', 'jvm-013', 'jvm-017'],
  tags: ['thread dump', 'deadlock', 'contention', 'jstack']
},
{
  id: 'lesson-jvm-022',
  track: 'jvm', order: 22,
  title: 'Cache static có bound và TTL: đồng hồ thủ công nowMs để kiểm thử TTL xác định',
  level: 'senior',
  minutes: 35,
  goals: [
    'Nhận diện static cache không giới hạn là memory leak và biết cách sửa bằng bound + TTL',
    'Viết cache có số lượng entry tối đa và eviction LRU khi vượt capacity',
    'Viết cache có TTL: mỗi entry có expireAt, get loại bỏ entry hết hạn',
    'Dùng trường static nowMs để kiểm thử TTL xác định, không dựa vào thời gian hệ thống thực'
  ],
  body: `**Tóm tắt:** Cache static không giới hạn là memory leak kinh điển. Cách sửa là cache có bound (số lượng entry tối đa) và TTL (thời gian tồn tại), đồng thời dùng đồng hồ thủ công ({{nowMs}}) để kiểm thử TTL một cách xác định, không dựa vào thời gian thực.

### Vì sao static cache không bound vẫn là leak
Static field sống theo classloader → là GC root. Map static giữ mọi key/value đã từng put → không bị thu hồi dù nghiệp vụ đã xong. Heap tăng đều qua các lần full GC, cuối cùng OOM. Sửa không phải dùng weak reference (hit rate không ổn định cho cache chính), mà là cache có bound và TTL.

### Cache có bound: số lượng entry tối đa
Cache chỉ được chứa tối đa {{capacity}} entry. Khi put vượt quá giới hạn, loại entry cũ nhất (LRU — least recently used) để tetap trong giới hạn bộ nhớ. Mọi thao tác get/put vẫn O(1).

### TTL: thời gian tồn tại của entry
Mỗi entry được gán thời gian hết hạn khi put: {{expireAt = nowMs + ttlMs}}. Khi get, nếu {{nowMs >= expireAt}} thì entry đã hết hạn → trả về null và loại khỏi cache. Điều này đảm bảo dữ liệu cũ không được giữ mãi mà không ai truy cập.

### Đồng hồ thủ công ({{nowMs}}) để kiểm thử xác định
Không thể dựa vào {{System.currentTimeMillis()}} trong kiểm thử tự động vì thời gian trôi qua không kiểm soát được. Lớp cache cung cấp trường {{static long nowMs}} (mặc định là {{System.currentTimeMillis()}}), kiểm thử gán {{nowMs}} theo ý muốn để mô phỏng thời gian trôi qua. Tất cả get/put/size đều dùng {{nowMs}} thay vì gọi đồng hồ hệ thống.

### Kết hợp bound và TTL
- get: nếu entry hết hạn → loại bỏ, trả về null.
- put: thêm/cập nhật entry với {{expireAt}} mới; {{removeEldestEntry}} loại entry cũ nhất (LRU) khi vượt {{capacity}}.
- size: dọn hết hạn trước, sau đó trả về số entry còn lại.

### Ví dụ đời thực
Dịch vụ giá (cache) lưu giá theo mã sản phẩm trong static Map. Mỗi giá tồn tại 5 phút thì cũ. Không có TTL → giá cũ được giữ mãi, heap tăng. Sửa: TimedBoundedCache với {{capacity=10_000}}, {{ttlMs=300_000}} (5 phút), nowMs dùng đồng hồ thủ công khi kiểm thử. Heap ổn định, giá luôn mới.

### Trả lời mẫu khi phỏng vấn
Cache static không bound là leak vì static field là GC root. Tôi sửa bằng cache có bound và TTL: mỗi entry có expireAt, get loại bỏ entry hết hạn, put thêm entry và LRU nếu vượt capacity. Để kiểm thử TTL xác định, tôi dùng trường nowMs tĩnh thay vì {{System.currentTimeMillis()}}. Weak reference không đủ cho cache chính vì hit rate không ổn định.

### Liên hệ phỏng vấn
Interviewer hỏi: cache leak detect ra sao, tại sao cần TTL ngoài bound, cách kiểm thử TTL không dựa thời gian thực, và LRU eviction hoạt động thế nào. Trả lời: heap dump/MAT để thấy retained size; TTL để tự dọn dữ liệu cũ; nowMs tĩnh để kiểm thử xác định; LinkedHashMap access-order cho LRU.`,
  exercises: [
    {
      title: 'TimedBoundedCache: bound + TTL với đồng hồ nowMs',
      prompt: `Hoàn thiện {{TimedBoundedCache<K, V>}}: cache có bound (số lượng entry tối đa) và TTL (thời gian tồn tại), dùng đồng hồ thủ công {{nowMs}} để kiểm thử xác định.

- {{get(key)}}: trả về value nếu entry chưa hết hạn; nếu hết hạn ({{nowMs >= expireAt}}) thì loại bỏ và trả về null.
- {{put(key, value, ttlMs)}}: thêm/cập nhật entry với {{expireAt = nowMs + ttlMs}}. Sau put, nếu vượt capacity thì loại entry cũ nhất (LRU, theo thứ tự truy cập).
- {{size()}}: dọn entry hết hạn trước, rồi trả về số entry còn lại.
- Trường {{static long nowMs}}: đồng hồ thủ công (mặc định {{System.currentTimeMillis()}}). Kiểm thử gán {{nowMs}} theo ý muốn.

Constructor nhận {{capacity}}. Không được thêm field public mới.`,
      starter: `class TimedBoundedCache<K, V> {
    static long nowMs = System.currentTimeMillis();
    private final int capacity;
    TimedBoundedCache(int capacity) { this.capacity = capacity; }
    V get(K key) { throw new UnsupportedOperationException("TODO"); }
    void put(K key, V value, long ttlMs) { throw new UnsupportedOperationException("TODO"); }
    int size() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.util.*;
public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        TimedBoundedCache.nowMs = 0;
        TimedBoundedCache<String, Integer> c = new TimedBoundedCache<>(2);
        c.put("a", 1, 100);
        check("get before expiry returns value", c.get("a") == 1, "got " + c.get("a"));
        TimedBoundedCache.nowMs = 150;
        check("get after expiry returns null", c.get("a") == null, "got " + c.get("a"));
        check("expired entry removed from size", c.size() == 0, "size = " + c.size());
        TimedBoundedCache.nowMs = 0;
        c.put("a", 1, 100);
        c.put("b", 2, 100);
        c.put("c", 3, 100);
        check("size bounded to capacity", c.size() == 2, "size = " + c.size());
        TimedBoundedCache.nowMs = 0;
        c.put("a", 1, 100);
        TimedBoundedCache.nowMs = 80;
        c.put("a", 10, 100);
        TimedBoundedCache.nowMs = 150;
        check("update resets TTL", c.get("a") == 10, "got " + c.get("a"));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `import java.util.*;
class TimedBoundedCache<K, V> {
    static long nowMs = System.currentTimeMillis();
    private final int capacity;
    private final LinkedHashMap<K, CacheEntry<V>> map;
    static class CacheEntry<V> {
        final V value;
        long expireAt;
        CacheEntry(V value, long expireAt) {
            this.value = value;
            this.expireAt = expireAt;
        }
    }
    TimedBoundedCache(int capacity) {
        this.capacity = capacity;
        this.map = new LinkedHashMap<K, CacheEntry<V>>(16, 0.75f, true) {
            @Override protected boolean removeEldestEntry(Map.Entry<K, CacheEntry<V>> eldest) {
                return size() > capacity;
            }
        };
    }
    V get(K key) {
        CacheEntry<V> e = map.get(key);
        if (e == null) return null;
        if (nowMs >= e.expireAt) {
            map.remove(key);
            return null;
        }
        return e.value;
    }
    void put(K key, V value, long ttlMs) {
        map.put(key, new CacheEntry<>(value, nowMs + ttlMs));
    }
    int size() {
        Iterator<Map.Entry<K, CacheEntry<V>>> it = map.entrySet().iterator();
        while (it.hasNext()) {
            if (nowMs >= it.next().getValue().expireAt) it.remove();
        }
        return map.size();
    }
}`,
      hints: [
        'Dùng LinkedHashMap với accessOrder=true và override removeEldestEntry: trả true khi size() > capacity.',
        'get: nếu nowMs >= e.expireAt thì map.remove(key) và trả về null.',
        'size: lặp qua map, loại entry hết hạn (nowMs >= expireAt), rồi trả về map.size().',
        'nowMs là static, tất cả instances chia sẻ cùng đồng hồ; kiểm thử gán nowMs để mô phỏng thời gian.'
      ],
      explain: `{{get}}: lấy entry từ map. Nếu null thì trả về null. Nếu {{nowMs >= expireAt}} thì entry hết hạn → loại khỏi map và trả về null. Nếu chưa hết hạn thì trả về value. Lưu ý: với LinkedHashMap access-order, {{get}} cũng đưa entry về cuối (cập nhật thứ tự truy cập).

{{put}}: tạo {{CacheEntry}} với {{expireAt = nowMs + ttlMs}} rồi put vào map. Access-order LinkedHashMap đặt entry mới/cập nhật vào cuối. {{removeEldestEntry}} được gọi tự động sau put: nếu {{size() > capacity}} thì loại entry đầu (lâu nhất không dùng).

{{size}}: lặp qua map, loại mọi entry có {{nowMs >= expireAt}}, rồi trả về số entry còn lại. Điều này đảm bảo entry hết hạn không bị tính vào size.

Đồng hồ {{nowMs}} là static, nên tất cả instances chia sẻ cùng một đồng hồ. Kiểm thử gán {{nowMs}} để mô phỏng thời gian trôi qua mà không cần đợi thật.

Ví dụ: capacity=2, put "a" và "b" tại nowMs=0, put "c" → "a" bị loại (LRU eldest), size=2. TTL: put "a" với ttl=100 tại nowMs=0 (expireAt=100), nowMs=150 → get("a") trả về null và loại "a".`,
    }
  ],
  check: [
    {
      q: 'Vì sao static cache không giới hạn là memory leak?',
      options: ['GC không quét static field', 'Static field là GC root, giữ mọi entry reachable', 'HashMap tự sao chép dữ liệu', 'Weak reference không hoạt động'],
      answer: 1,
      explain: 'Static field sống theo classloader → GC root. Map static giữ mọi key/value → không bị thu hồi dù nghiệp vụ xong.'
    },
    {
      q: 'TTL trong cache giúp điều gì?',
      options: ['Tăng kích thước cache', 'Tự động loại entry đã hết hạn thời gian', 'Biến cache thành weak reference', 'Không giúp gì'],
      answer: 1,
      explain: 'Mỗi entry có expireAt = nowMs + ttlMs. Get kiểm tra expiry: hết hạn → loại bỏ, trả về null. Dữ liệu cũ không được giữ mãi.'
    },
    {
      q: 'Trường {{static long nowMs}} trong cache dùng để làm gì?',
      options: ['Lưu thời gian hệ thống thực', 'Đồng hồ thủ công để kiểm thử TTL xác định', 'Đếm số lần put', 'Lưu TTL mặc định'],
      answer: 1,
      explain: 'Kiểm thử gán nowMs theo ý muốn để mô phỏng thời gian trôi qua, không cần đợi thật. Mặc định là System.currentTimeMillis().'
    },
    {
      q: 'Khi get một entry đã hết hạn, cache làm gì?',
      options: ['Trả về value cũ', 'Loại bỏ entry và trả về null', 'Tự gia hạn TTL', 'Ném NullPointerException'],
      answer: 1,
      explain: 'Get kiểm tra nowMs >= expireAt: nếu đúng, loại entry khỏi map và trả về null.'
    }
  ],
  related: ['jvm-001', 'jvm-004'],
  tags: ['memory leak', 'cache', 'TTL', 'bounded', 'LRU']
},
);