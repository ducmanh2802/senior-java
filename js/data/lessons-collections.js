/* Bài học track "collections". Schema & markup: AGENTS.md mục 12. lesson-collections-001 là bài MẪU (integrator viết). */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-collections-001',
  track: 'collections',
  order: 1,
  title: 'HashMap từ bên trong: hash, bucket, resize và hợp đồng equals/hashCode',
  level: 'mid',
  minutes: 25,
  goals: [
    'Giải thích được một lệnh {{put}} đi qua những bước nào và vì sao trung bình là O(1)',
    'Biết khi nào bucket chuyển thành cây đỏ-đen và vì sao resize tốn kém',
    'Viết đúng {{equals}}/{{hashCode}} cho một key và tránh lỗi key bị "mất" trong map',
  ],
  body: `### HashMap là một mảng các bucket
Bên trong {{HashMap}} là một mảng {{table}}, mỗi phần tử là một **bucket**. Khi gọi {{put(key, value)}}:

1. Tính {{key.hashCode()}} rồi **trộn bit**: {{h ^ (h >>> 16)}}. Lý do: chỉ số bucket chỉ dùng vài bit thấp, nên trộn 16 bit cao xuống giúp các key khác nhau ở bit cao không dồn vào cùng bucket.
2. Chỉ số bucket = {{(n - 1) & hash}} với {{n}} là kích thước mảng. Vì {{n}} luôn là **lũy thừa của 2**, phép AND này tương đương phép chia lấy dư nhưng nhanh hơn.
3. Nếu bucket trống: tạo node mới. Nếu đã có node: duyệt các node, node nào có {{hash}} bằng nhau **và** {{equals}} trả về true thì ghi đè value; không có thì thêm node mới vào cuối.

~~~java
Map<String, Integer> m = new HashMap<>();   // table chưa được tạo: lazy, lần put đầu mới cấp phát 16 bucket
m.put("VCB", 1);   // hash("VCB") → bucket i
m.put("TCB", 2);   // khác bucket → O(1)
m.get("VCB");      // tính lại hash → đúng bucket → so equals → 1
~~~

**Vì sao trung bình O(1)?** Nếu hash phân tán đều, mỗi bucket chỉ có 0–1 node, nên {{get}} chỉ là tính hash cộng một lần so sánh. Trường hợp xấu nhất là mọi key cùng một bucket.

### Va chạm: danh sách liên kết rồi tới cây
Từ Java 8, một bucket bắt đầu là **danh sách liên kết**. Khi một bucket có **từ 8 node** (TREEIFY_THRESHOLD) **và** mảng đã có **ít nhất 64 bucket** (MIN_TREEIFY_CAPACITY), bucket đó chuyển thành **cây đỏ-đen**, nên tra cứu trong bucket giảm từ O(n) xuống O(log n). Nếu mảng còn nhỏ hơn 64, HashMap **resize** thay vì tạo cây, vì nhiều khả năng va chạm chỉ do mảng quá chật. Khi cây còn ≤ 6 node (sau resize), nó trở lại thành danh sách.

Cây cần so sánh được các key: nếu key implement {{Comparable}} thì dùng {{compareTo}}, nếu không HashMap dùng thứ tự phụ (tên class, {{identityHashCode}}). Đây là lý do một hệ thống bị tấn công **HashDoS** (gửi hàng nghìn key cùng hash) vẫn chịu được O(log n) thay vì sập vì O(n²).

### Resize: vì sao đắt và cách tránh
Khi số phần tử vượt **threshold = capacity × loadFactor** (mặc định 16 × 0.75 = 12), mảng được **gấp đôi** và mọi node được chia lại. Java 8 không tính lại hash: nó xem bit {{hash & oldCap}}: bằng 0 thì node ở nguyên chỉ số cũ, bằng 1 thì chuyển sang chỉ số cũ + oldCap. Dù vậy resize vẫn là O(n) và cấp phát mảng mới.

| Tình huống | Nên làm |
|---|---|
| Biết trước khoảng 10.000 phần tử | {{new HashMap<>(14_000)}} (≈ n / 0.75), hoặc {{HashMap.newHashMap(10_000)}} từ Java 19 |
| Map chỉ đọc sau khi tạo | {{Map.copyOf(...)}}: bất biến, gọn bộ nhớ hơn |
| Nhiều thread cùng ghi | {{ConcurrentHashMap}}, **không** dùng HashMap |

> HashMap không thread-safe. Ở Java 7, hai thread cùng resize có thể tạo vòng lặp trong danh sách khiến {{get}} chạy mãi (CPU 100%). Java 8 đã sửa vòng lặp đó nhưng vẫn có thể **mất dữ liệu** khi ghi đồng thời.

### Hợp đồng equals/hashCode
HashMap tìm bucket bằng {{hashCode}} rồi mới so {{equals}}, nên hai quy tắc bắt buộc:
- Nếu {{a.equals(b)}} thì {{a.hashCode() == b.hashCode()}}. Vi phạm thì hai key "bằng nhau" rơi vào hai bucket khác nhau và {{get}} trả về null.
- {{hashCode}} phải **ổn định** trong lúc object nằm trong map. Nếu key là object mutable và bạn đổi field tham gia tính hash **sau khi put**, entry vẫn nằm ở bucket cũ: {{get}} không tìm thấy nữa, nhưng entry vẫn chiếm bộ nhớ. Đây là một kiểu memory leak hay gặp.

~~~java
final class AccountKey {                   // final + field final: key bất biến
    private final String bankCode, accountNo;
    AccountKey(String bankCode, String accountNo) { this.bankCode = bankCode; this.accountNo = accountNo; }
    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AccountKey k)) return false;      // pattern matching (Java 16+)
        return bankCode.equals(k.bankCode) && accountNo.equals(k.accountNo);
    }
    @Override public int hashCode() { return Objects.hash(bankCode, accountNo); }  // dùng ĐÚNG các field của equals
}
~~~

Từ Java 16, {{record AccountKey(String bankCode, String accountNo)}} tự sinh {{equals}}/{{hashCode}}/{{toString}} đúng hợp đồng, nên đây là cách nên dùng cho key.

### Liên hệ phỏng vấn
Interviewer hay hỏi tiếp: vì sao capacity là lũy thừa của 2, khi nào treeify, vì sao {{ConcurrentHashMap}} không cho key null (không phân biệt được "không có" với "giá trị null" khi đọc đồng thời), và tình huống key mutable bị mất. Làm xong 2 bài tập dưới đây là bạn trả lời được cả bốn câu.`,
  exercises: [
    {
      title: 'Viết equals/hashCode cho key tài khoản',
      prompt: `Class {{AccountKey}} dùng làm key trong {{Map<AccountKey, Long>}} lưu số dư theo (mã ngân hàng, số tài khoản). Hiện nó chưa override {{equals}}/{{hashCode}}, nên hai object cùng giá trị bị coi là hai key khác nhau.

Hãy override **equals** và **hashCode** theo đúng hợp đồng: bằng nhau khi cùng {{bankCode}} và {{accountNo}}; {{equals(null)}} và so với kiểu khác trả về false. Giả sử hai field không bao giờ null.`,
      starter: `final class AccountKey {
    private final String bankCode;
    private final String accountNo;

    AccountKey(String bankCode, String accountNo) {
        this.bankCode = bankCode;
        this.accountNo = accountNo;
    }

    String bankCode() { return bankCode; }
    String accountNo() { return accountNo; }

    // TODO: override equals và hashCode
}`,
      tests: `public class Main {
    static int passed = 0, total = 0;
    static void check(String name, boolean ok, String detail) {
        total++;
        if (ok) { passed++; System.out.println("PASS " + name); }
        else System.out.println("FAIL " + name + ": " + detail);
    }
    public static void main(String[] args) {
        AccountKey a = new AccountKey("VCB", "0011001234567");
        AccountKey b = new AccountKey("VCB", "0011001234567");
        AccountKey c = new AccountKey("TCB", "0011001234567");
        check("equal values are equal", a.equals(b) && b.equals(a), "a.equals(b) phải true theo cả hai chiều");
        check("equal objects have equal hashCode", a.hashCode() == b.hashCode(), "hashCode khác nhau: " + a.hashCode() + " vs " + b.hashCode());
        check("different bank is not equal", !a.equals(c), "khác bankCode mà vẫn equals");
        check("equals(null) is false", !a.equals(null), "equals(null) phải false");
        check("equals other type is false", !a.equals("VCB0011001234567"), "so với String phải false");
        Map<AccountKey, Long> balances = new HashMap<>();
        balances.put(a, 5_000_000L);
        check("lookup with an equal key", Long.valueOf(5_000_000L).equals(balances.get(b)), "get(b) trả về " + balances.get(b));
        Set<AccountKey> set = new HashSet<>(List.of(a, b, c));
        check("HashSet removes duplicates", set.size() == 2, "size = " + set.size() + ", mong đợi 2");
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `final class AccountKey {
    private final String bankCode;
    private final String accountNo;

    AccountKey(String bankCode, String accountNo) {
        this.bankCode = bankCode;
        this.accountNo = accountNo;
    }

    String bankCode() { return bankCode; }
    String accountNo() { return accountNo; }

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AccountKey)) return false;
        AccountKey k = (AccountKey) o;
        return bankCode.equals(k.bankCode) && accountNo.equals(k.accountNo);
    }

    @Override public int hashCode() {
        return Objects.hash(bankCode, accountNo);
    }
}`,
      hints: [
        'equals: kiểm tra cùng tham chiếu, rồi kiểm tra kiểu bằng instanceof (instanceof với null luôn false), rồi so từng field.',
        'hashCode phải dùng đúng các field tham gia equals: {{Objects.hash(bankCode, accountNo)}}.',
      ],
      explain: `Lỗi hay gặp: chỉ override {{equals}} mà quên {{hashCode}}. Khi đó {{a.equals(b)}} là true nhưng hai object vẫn có {{hashCode}} mặc định (theo identity) khác nhau, nên {{get(b)}} tìm ở bucket khác và trả về null, còn HashSet giữ cả hai bản.

Dùng {{instanceof}} thay vì {{getClass() != o.getClass()}} là được ở đây vì class là {{final}} (không có subclass phá tính đối xứng). Trong code thật, {{record AccountKey(String bankCode, String accountNo)}} cho kết quả tương đương mà không phải viết tay.`,
    },
    {
      title: 'LRU cache 2 dòng với LinkedHashMap',
      prompt: `Viết {{LruCache<K, V>}} có sức chứa cố định: {{get}} trả về value (null nếu không có) và đánh dấu key là **vừa dùng**; {{put}} thêm/ghi đè và khi vượt sức chứa thì **loại key lâu nhất không dùng**; {{size}} trả về số phần tử.

Gợi ý mục tiêu: dùng {{LinkedHashMap}} ở chế độ **access-order** thay vì tự viết danh sách liên kết.`,
      starter: `class LruCache<K, V> {
    private final int capacity;

    LruCache(int capacity) {
        this.capacity = capacity;
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
        check("evicts least recently used", () -> {
            LruCache<String, Integer> c = new LruCache<>(2);
            c.put("a", 1); c.put("b", 2);
            c.get("a");          // a vừa dùng → b là lâu nhất
            c.put("c", 3);       // vượt sức chứa → loại b
            eq(null, c.get("b")); eq(1, c.get("a")); eq(3, c.get("c")); eq(2, c.size());
        });
        check("updating a key does not evict", () -> {
            LruCache<String, Integer> c = new LruCache<>(2);
            c.put("a", 1); c.put("b", 2); c.put("a", 10);
            eq(2, c.size()); eq(10, c.get("a")); eq(2, c.get("b"));
        });
        check("put refreshes recency", () -> {
            LruCache<String, Integer> c = new LruCache<>(2);
            c.put("a", 1); c.put("b", 2); c.put("a", 11);   // a mới được ghi → b lâu nhất
            c.put("c", 3);
            eq(null, c.get("b")); eq(11, c.get("a"));
        });
        check("capacity 1", () -> {
            LruCache<Integer, String> c = new LruCache<>(1);
            c.put(1, "x"); c.put(2, "y");
            eq(null, c.get(1)); eq("y", c.get(2)); eq(1, c.size());
        });
        check("missing key returns null", () -> eq(null, new LruCache<String, String>(3).get("none")));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class LruCache<K, V> {
    private final Map<K, V> map;

    LruCache(int capacity) {
        // accessOrder = true: mỗi get/put đưa entry về cuối danh sách
        this.map = new LinkedHashMap<K, V>(16, 0.75f, true) {
            @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > capacity;   // gọi sau mỗi put: vượt sức chứa thì bỏ entry đầu (lâu nhất)
            }
        };
    }

    V get(K key) { return map.get(key); }

    void put(K key, V value) { map.put(key, value); }

    int size() { return map.size(); }
}`,
      hints: [
        'Constructor {{LinkedHashMap(initialCapacity, loadFactor, accessOrder)}}: truyền {{true}} để thứ tự lặp là thứ tự truy cập.',
        'Override {{removeEldestEntry}} trong một subclass ẩn danh: trả về {{size() > capacity}}.',
      ],
      explain: `{{LinkedHashMap}} giữ thêm một danh sách liên kết đôi qua mọi entry. Với {{accessOrder = true}}, mỗi {{get}}/{{put}} chuyển entry về cuối, nên entry đầu danh sách luôn là entry lâu nhất không dùng. {{put}} gọi {{removeEldestEntry}} sau khi thêm; trả về true thì entry đầu bị xoá. Mọi thao tác vẫn O(1).

Không thread-safe: dùng trong nhiều thread thì bọc {{Collections.synchronizedMap}} (chậm khi tranh chấp) hoặc dùng thư viện như Caffeine (thuật toán W-TinyLFU, hit rate tốt hơn LRU thuần). Chú ý: với access-order, ngay cả {{get}} cũng **thay đổi cấu trúc** map, nên lặp qua map trong lúc gọi {{get}} sẽ gây {{ConcurrentModificationException}}.`,
    },
  ],
  check: [
    {
      q: 'HashMap mặc định (capacity 16, loadFactor 0.75): mảng bucket được mở rộng từ 16 lên 32 khi nào?',
      options: ['Khi thêm phần tử thứ 13', 'Khi thêm phần tử thứ 16', 'Khi một bucket có 8 node', 'Khi thêm phần tử thứ 17'],
      answer: 0,
      explain: `Threshold = 16 × 0.75 = 12; khi size vượt 12 (tức phần tử thứ 13) thì mảng gấp đôi lên 32. (Lần put đầu tiên cũng gọi resize(), nhưng chỉ để cấp phát mảng 16 bucket do HashMap khởi tạo lười.) Bucket có 8 node chỉ dẫn tới treeify (nếu capacity ≥ 64) hoặc resize sớm, không phải điều kiện resize thông thường. 16 và 17 là nhầm với capacity.`,
    },
    {
      q: 'Key là object mutable; sau khi {{put}}, bạn đổi một field tham gia {{hashCode}}. Điều gì xảy ra?',
      options: ['HashMap tự di chuyển entry sang bucket mới', '{{get}} với key đó thường trả về null, còn entry vẫn chiếm bộ nhớ', 'Ném {{ConcurrentModificationException}}', 'Không ảnh hưởng gì vì HashMap so sánh bằng equals'],
      answer: 1,
      explain: `HashMap không biết key đã đổi: entry vẫn ở bucket tính theo hash cũ, còn {{get}} tính hash mới và tìm ở bucket khác. HashMap không tự di chuyển entry; CME chỉ xảy ra khi sửa cấu trúc lúc đang lặp; và equals chỉ được gọi **sau khi** đã chọn bucket theo hash.`,
    },
    {
      q: 'Bucket chuyển thành cây đỏ-đen khi nào (Java 8+)?',
      options: ['Ngay khi có va chạm', 'Khi bucket có từ 8 node và table có ít nhất 64 bucket', 'Khi size vượt threshold', 'Khi key implement Comparable'],
      answer: 1,
      explain: `Cần cả hai điều kiện: TREEIFY_THRESHOLD = 8 node trong bucket và MIN_TREEIFY_CAPACITY = 64; nếu table nhỏ hơn thì HashMap resize thay vì treeify. Va chạm đơn lẻ chỉ tạo danh sách; vượt threshold gây resize; Comparable chỉ giúp sắp xếp node trong cây chứ không quyết định treeify.`,
    },
  ],
  related: ['collections-001', 'collections-005', 'core-001'],
  tags: ['HashMap', 'equals', 'hashCode', 'LRU'],
}
);
