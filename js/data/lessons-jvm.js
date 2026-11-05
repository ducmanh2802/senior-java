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
  body: `### Heap không phải một khối phẳng
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

> Một mẹo đọc heap dump: tìm class có số instance tăng bất thường, rồi xem "Path to GC Roots". Nếu path đi qua một static field của class nghiệp vụ, gần như chắc chắn đó là leak, không phải lỗi GC.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Vì sao dùng WeakHashMap làm cache mà memory vẫn tăng?", "SoftReference khác WeakReference chỗ nào?", "Kể một memory leak bạn từng gặp". Trả lời tốt là nói được **reachability từ GC root**, không chỉ đọc định nghĩa. Bài tập dưới đây bắt bạn tự xây một cache dùng weak value + {{ReferenceQueue}}, đúng cơ chế mà {{WeakHashMap}} dùng bên trong.`,
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
  body: `### GC chỉ trả lời một câu hỏi: object này còn đi được từ root không?
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

> Đừng tối ưu GC bằng cách tăng heap vô hạn. Heap lớn làm mỗi full GC đắt hơn và che giấu leak. Hãy tìm retained set trước, rồi mới chỉnh collector.

### Liên hệ phỏng vấn
Câu hỏi kinh điển: "GC tìm rác thế nào?", "Vì sao chu trình không leak trong Java?", "G1 khác CMS ở đâu?", "Khi nào object được promote?". Trả lời theo **reachability + generational + barrier** sẽ thuyết phục hơn liệt kê tên collector. Bài tập dưới đây bắt bạn tự cài đặt mark-and-sweep, nên bạn sẽ nhớ chính xác vì sao sweep phải xét **toàn bộ** heap còn mark chỉ đi theo cạnh.`,
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
  body: `### Một class đi qua ba chặng
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

> Lỗi rất hay gặp: static initializer gọi một service lấy từ Spring context. Class init chạy quá sớm, trước khi context sẵn sàng, gây {{ExceptionInInitializerError}}; lần sau mọi truy cập class đó nhận {{NoClassDefFoundError}} dù nguyên nhân gốc đã được log ở lần đầu.

### Liên hệ phỏng vấn
Interviewer hay hỏi: "Vì sao holder idiom lazy mà vẫn thread-safe?", "Static block chạy khi nào?", "Khi nào class bị unload?", "Khác nhau giữa {{ExceptionInInitializerError}} và {{NoClassDefFoundError}}?". Trả lời chắc là nói được **active use**, **thứ tự văn bản**, **initialization lock** và **điều kiện unload của classloader**. Hai bài tập dưới đây bắt bạn viết holder singleton và tự tay tạo đúng thứ tự khởi tạo.`,
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
  body: `### Leak trong Java nghĩa là gì
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

### Liên hệ phỏng vấn
Câu hỏi hay gặp: "Java có GC thì sao vẫn leak?", "Kể một memory leak bạn đã xử lý", "Shallow size khác retained size thế nào?". Một câu trả lời tốt đi theo cấu trúc: **triệu chứng** (đáy heap sau GC tăng, GC dày, OOM) → **bằng chứng** (histogram so sánh, heap dump, dominator tree, path to GC roots) → **nguyên nhân gốc** (ví dụ listener không gỡ) → **sửa và phòng ngừa** (cache có giới hạn, API đăng ký trả handle, alert trên heap sau GC). Hai bài tập dưới đây là hai cách sửa phổ biến nhất: cache LRU có giới hạn và event bus có hàm gỡ đăng ký.`,
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
  related: ['jvm-005', 'jvm-013', 'jvm-004', 'jvm-032'],
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
);
