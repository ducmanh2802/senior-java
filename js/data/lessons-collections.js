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
},
{
  id: 'lesson-collections-002',
  track: 'collections',
  order: 2,
  title: 'ArrayList từ bên trong: mảng động, grow 1.5 lần và cái giá của remove giữa danh sách',
  level: 'mid',
  minutes: 25,
  goals: [
    'Mô tả được {{ArrayList}} lưu dữ liệu ra sao và capacity tăng theo công thức nào',
    'Nói đúng độ phức tạp của {{get}}, {{add}}, {{add(index, e)}}, {{remove(index)}}, {{contains}} và giải thích vì sao',
    'Tránh được các lỗi production: xoá trong vòng lặp, {{remove(int)}} với {{List<Integer>}}, giữ {{subList}} làm rò bộ nhớ',
  ],
  body: `### ArrayList chỉ là một mảng Object[] cộng một biến size
Bên trong {{ArrayList}} có đúng hai trường quan trọng: mảng {{Object[] elementData}} và số nguyên {{size}}. **Capacity** là độ dài mảng ({{elementData.length}}), còn **size** là số phần tử thực sự đang dùng. Các ô từ {{size}} trở đi luôn là {{null}}.

Vì dữ liệu nằm liền nhau trong một mảng, {{get(i)}} chỉ là kiểm tra chỉ số rồi đọc {{elementData[i]}}: **O(1)** thật sự, và còn rất thân thiện với CPU cache (đọc tuần tự các ô liền kề, CPU prefetch được). Đây là lý do trong thực tế {{ArrayList}} gần như luôn nhanh hơn {{LinkedList}}, kể cả ở nhiều thao tác mà lý thuyết Big-O nói {{LinkedList}} thắng.

### Grow: vì sao 1.5 lần mà không phải +1
Constructor không tham số **không** cấp phát ngay: nó gán một mảng rỗng dùng chung. Lần {{add}} đầu tiên mới tạo mảng **10 ô** (DEFAULT_CAPACITY). Khi mảng đầy, {{grow()}} tạo mảng mới lớn hơn rồi {{Arrays.copyOf}} toàn bộ sang:

~~~java
// JDK 17, ArrayList.grow (rút gọn): tăng thêm một nửa capacity cũ
int newCapacity = ArraysSupport.newLength(oldCapacity,
        minCapacity - oldCapacity,     // tối thiểu phải đủ chỗ
        oldCapacity >> 1);             // mong muốn: +50%
// thực chất: old + max(minGrowth, old >> 1)  →  10, 15, 22, 33, 49, 73, 109...
~~~

**Vì sao nhân theo tỉ lệ?** Nếu mỗi lần chỉ +1 ô, thêm n phần tử sẽ copy 1 + 2 + ... + n = O(n²) lần. Nhân với hệ số cố định (1.5) thì tổng số lần copy chỉ còn O(n), nên chi phí **trung bình (amortized)** mỗi {{add}} vào cuối là **O(1)**. Hệ số 1.5 thay vì 2 là thỏa hiệp: lãng phí bộ nhớ tối đa khoảng 33% thay vì 50%.

**ArrayList không tự co lại.** Thêm 1 triệu phần tử rồi {{clear()}} thì mảng 1 triệu ô vẫn còn đó (toàn null). Muốn trả bộ nhớ thì gọi {{trimToSize()}} hoặc tạo list mới.

### Vì sao remove giữa danh sách chậm
{{remove(index)}} phải **dồn** mọi phần tử phía sau lên một ô để lấp chỗ trống, rồi gán ô cuối thành null để GC thu hồi object:

~~~java
// JDK 17, ArrayList.fastRemove (rút gọn)
int newSize = size - 1;
if (newSize > i)
    System.arraycopy(es, i + 1, es, i, newSize - i);   // dịch (size - i - 1) phần tử
es[size = newSize] = null;                             // không gán null = giữ tham chiếu, rò bộ nhớ
~~~

{{System.arraycopy}} là intrinsic rất nhanh (gần như memmove), nhưng vẫn là **O(n - i)**: xoá ở đầu list 1 triệu phần tử là dịch gần 1 triệu ô. {{add(index, e)}} cũng vậy, theo chiều ngược lại. Còn xoá ở **cuối** thì không phải dịch gì: O(1).

| Thao tác | Độ phức tạp | Vì sao |
|---|---|---|
| {{get(i)}} / {{set(i, e)}} | O(1) | truy cập mảng theo chỉ số |
| {{add(e)}} vào cuối | O(1) amortized | thỉnh thoảng grow O(n), chia đều ra |
| {{add(i, e)}} / {{remove(i)}} | O(n - i) | dịch các phần tử phía sau |
| {{remove(size - 1)}} | O(1) | không phải dịch |
| {{contains(o)}} / {{indexOf(o)}} / {{remove(Object)}} | O(n) | duyệt tuần tự, gọi {{equals}} |
| {{removeIf(pred)}} | O(n) | đánh dấu rồi dồn một lượt |

### Lỗi production hay gặp
- **Xoá trong vòng lặp bằng chỉ số** từ đầu đến cuối: sau khi xoá ô i, phần tử kế tiếp dịch về ô i và bị bỏ qua. Xoá từng cái bằng {{remove(0)}} trong vòng lặp là O(n²): 200 nghìn phần tử có thể mất nhiều giây. Dùng {{list.removeIf(...)}} (O(n)).
- **Sửa list trong for-each** ném {{ConcurrentModificationException}}: iterator so {{modCount}} của list với giá trị nó ghi nhớ lúc tạo.
- **{{remove(int)}} vs {{remove(Object)}}** với {{List<Integer>}}: {{list.remove(1)}} xoá phần tử ở **chỉ số 1**, không phải giá trị 1. Muốn xoá giá trị thì {{list.remove(Integer.valueOf(1))}}.
- **{{subList}} là view**: nó giữ tham chiếu tới cả mảng gốc. Cắt 10 phần tử từ list 1 triệu rồi cache lại là giữ cả 1 triệu phần tử trong bộ nhớ. Muốn tách hẳn thì {{new ArrayList<>(list.subList(a, b))}}. Sửa cấu trúc list gốc sau đó thì dùng subList sẽ ném CME.
- **{{Arrays.asList}}** trả về list kích thước cố định (bọc thẳng mảng): {{add}}/{{remove}} ném {{UnsupportedOperationException}}. {{List.of}} thì bất biến hoàn toàn và không cho null.
- **Không biết trước kích thước**: đọc 5 triệu dòng vào {{new ArrayList<>()}} sẽ grow khoảng 30 lần và tạo ra nhiều mảng rác lớn. Biết trước thì {{new ArrayList<>(expected)}} hoặc {{ensureCapacity}}.

> Bộ nhớ: {{ArrayList<Integer>}} tốn 4 byte cho mỗi tham chiếu (compressed oops) **cộng** 16 byte cho mỗi object Integer ngoài vùng cache -128..127. Với hàng chục triệu số, {{int[]}} (4 byte/phần tử) nhỏ hơn khoảng 5 lần.

### Liên hệ phỏng vấn
Câu kinh điển: "ArrayList hay LinkedList?". Trả lời senior: gần như luôn {{ArrayList}} (hoặc {{ArrayDeque}} cho hàng đợi), vì locality của mảng thắng việc LinkedList mỗi node tốn 24 byte và phải đuổi theo con trỏ; LinkedList chỉ "O(1)" khi bạn **đã đứng sẵn** ở node cần chèn. Interviewer còn hay hỏi: capacity mặc định, công thức grow, vì sao amortized O(1), và cách xoá nhiều phần tử an toàn. Bài tập dưới đây bắt bạn tự viết lại đúng các cơ chế đó.`,
  exercises: [
    {
      title: 'Tự viết MiniArrayList: add, get, remove và grow 1.5 lần',
      prompt: `Hoàn thiện {{MiniArrayList<E>}} mô phỏng đúng {{ArrayList}} của JDK:

- Ban đầu {{elementData}} là mảng rỗng (capacity 0, khởi tạo lười).
- {{add(e)}}: thêm vào cuối. Nếu mảng đầy: capacity 0 thì tạo mảng **10** ô; ngược lại capacity mới = {{old + (old >> 1)}}. Copy dữ liệu cũ sang mảng mới.
- {{add(index, e)}}: chèn tại {{index}} (cho phép {{index == size}}), dịch các phần tử phía sau sang phải. Grow giống {{add(e)}}.
- {{get(index)}}: trả về phần tử; {{index < 0}} hoặc {{index >= size}} thì ném {{IndexOutOfBoundsException}}.
- {{remove(index)}}: xoá và trả về phần tử, dồn các phần tử phía sau lên, **gán null ô cuối cũ** để không rò bộ nhớ. Kiểm tra chỉ số như {{get}}.
- Không bao giờ co mảng lại.

Các method {{size()}}, {{capacity()}}, {{slot(i)}} đã có sẵn để test nhìn vào bên trong.`,
      starter: `class MiniArrayList<E> {
    private static final Object[] EMPTY = new Object[0];
    private Object[] elementData = EMPTY;
    private int size;

    int size() { return size; }
    int capacity() { return elementData.length; }
    Object slot(int i) { return elementData[i]; }   // cho test nhìn thẳng vào mảng

    void add(E e) {
        throw new UnsupportedOperationException("TODO");
    }

    void add(int index, E e) {
        throw new UnsupportedOperationException("TODO");
    }

    E get(int index) {
        throw new UnsupportedOperationException("TODO");
    }

    E remove(int index) {
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
    static void throwsIoobe(Runnable r) {
        try { r.run(); } catch (IndexOutOfBoundsException e) { return; }
        throw new AssertionError("phải ném IndexOutOfBoundsException");
    }
    static MiniArrayList<Integer> filled(int n) {
        MiniArrayList<Integer> l = new MiniArrayList<>();
        for (int i = 0; i < n; i++) l.add(i);
        return l;
    }
    public static void main(String[] args) {
        check("lazy: first add allocates 10 slots", () -> {
            MiniArrayList<String> l = new MiniArrayList<>();
            eq(0, l.capacity());
            l.add("a");
            eq(10, l.capacity()); eq(1, l.size()); eq("a", l.get(0));
        });
        check("grows by 1.5x: 10 -> 15 -> 22 -> 33", () -> {
            MiniArrayList<Integer> l = filled(10);
            eq(10, l.capacity());
            l.add(10); eq(15, l.capacity());
            for (int i = 11; i < 16; i++) l.add(i);
            eq(22, l.capacity());
            for (int i = 16; i < 23; i++) l.add(i);
            eq(33, l.capacity());
            for (int i = 0; i < 23; i++) eq(i, l.get(i));
        });
        check("get out of range throws", () -> {
            MiniArrayList<Integer> l = filled(3);
            throwsIoobe(() -> l.get(3));
            throwsIoobe(() -> l.get(-1));
            throwsIoobe(() -> new MiniArrayList<String>().get(0));
        });
        check("remove middle shifts left and nulls old last slot", () -> {
            MiniArrayList<Integer> l = filled(5);          // 0 1 2 3 4
            eq(2, l.remove(2));                            // 0 1 3 4
            eq(4, l.size());
            eq(3, l.get(2)); eq(4, l.get(3));
            eq(null, l.slot(4));
            throwsIoobe(() -> l.remove(4));
        });
        check("remove first and last", () -> {
            MiniArrayList<String> l = new MiniArrayList<>();
            l.add("x"); l.add("y"); l.add("z");
            eq("x", l.remove(0)); eq("z", l.remove(1));
            eq(1, l.size()); eq("y", l.get(0));
            eq(null, l.slot(1)); eq(null, l.slot(2));
        });
        check("insert at front, middle and end", () -> {
            MiniArrayList<String> l = new MiniArrayList<>();
            l.add(0, "b");          // vào list rỗng
            l.add(0, "a");          // đầu
            l.add(2, "d");          // index == size
            l.add(2, "c");          // giữa
            eq(4, l.size());
            eq("a", l.get(0)); eq("b", l.get(1)); eq("c", l.get(2)); eq("d", l.get(3));
            throwsIoobe(() -> l.add(6, "z"));
        });
        check("insert triggers grow without losing data", () -> {
            MiniArrayList<Integer> l = filled(10);
            l.add(5, 99);
            eq(15, l.capacity()); eq(11, l.size());
            eq(4, l.get(4)); eq(99, l.get(5)); eq(5, l.get(6)); eq(9, l.get(10));
        });
        check("1000 adds then remove all: never shrinks", () -> {
            MiniArrayList<Integer> l = filled(1000);
            eq(1234, l.capacity());                         // 10,15,22,...,823,1234
            for (int i = 0; i < 1000; i++) eq(i, l.remove(0));
            eq(0, l.size()); eq(1234, l.capacity()); eq(null, l.slot(0));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class MiniArrayList<E> {
    private static final Object[] EMPTY = new Object[0];
    private Object[] elementData = EMPTY;
    private int size;

    int size() { return size; }
    int capacity() { return elementData.length; }
    Object slot(int i) { return elementData[i]; }

    private void growIfFull() {
        if (size < elementData.length) return;
        int old = elementData.length;
        int newCap = old == 0 ? 10 : old + (old >> 1);         // lazy 10, sau đó +50%
        elementData = Arrays.copyOf(elementData, newCap);       // O(n), nhưng hiếm
    }

    private void checkIndex(int index) {
        if (index < 0 || index >= size)
            throw new IndexOutOfBoundsException("Index " + index + " out of bounds for length " + size);
    }

    void add(E e) {
        growIfFull();
        elementData[size++] = e;
    }

    void add(int index, E e) {
        if (index < 0 || index > size)                           // cho phép index == size
            throw new IndexOutOfBoundsException("Index " + index + " out of bounds for length " + size);
        growIfFull();
        System.arraycopy(elementData, index, elementData, index + 1, size - index);  // dịch phải
        elementData[index] = e;
        size++;
    }

    @SuppressWarnings("unchecked")
    E get(int index) {
        checkIndex(index);
        return (E) elementData[index];
    }

    @SuppressWarnings("unchecked")
    E remove(int index) {
        checkIndex(index);
        E old = (E) elementData[index];
        int moved = size - index - 1;
        if (moved > 0) System.arraycopy(elementData, index + 1, elementData, index, moved);  // dồn trái
        elementData[--size] = null;                              // cho GC thu hồi
        return old;
    }
}`,
      hints: [
        'Viết một hàm phụ {{growIfFull()}}: nếu {{size == elementData.length}} thì tính capacity mới (0 → 10, còn lại {{old + (old >> 1)}}) và dùng {{Arrays.copyOf}}.',
        'Dịch phần tử bằng {{System.arraycopy(src, srcPos, dest, destPos, length)}}: nó xử lý đúng cả khi nguồn và đích chồng lên nhau trong cùng một mảng.',
        'Trong {{remove}}: số phần tử phải dồn là {{size - index - 1}}; sau đó {{elementData[--size] = null}}.',
      ],
      explain: `Ý chính: {{add}} vào cuối gần như luôn O(1), chỉ thỉnh thoảng phải copy toàn bộ khi grow; vì capacity tăng theo cấp số nhân (×1.5) nên tổng chi phí copy cho n lần add vẫn là O(n). {{add(index, e)}} và {{remove(index)}} phải dịch {{size - index}} phần tử, nên càng gần đầu list càng đắt.

Lỗi hay gặp:
- Quên {{elementData[--size] = null}}: ô cuối vẫn trỏ tới object đã "xoá", GC không thu hồi được (loitering reference). JDK cũng gán null đúng như vậy.
- Kiểm tra chỉ số bằng {{elementData.length}} thay vì {{size}}: {{get(size)}} sẽ trả về null thay vì ném lỗi.
- Tự dịch bằng vòng for từ trái sang phải khi **chèn**: ghi đè dữ liệu trước khi kịp copy. Muốn tự viết vòng lặp thì khi chèn phải chạy từ phải sang trái; {{System.arraycopy}} tự xử lý trường hợp chồng lấn.
- Tính {{old * 1.5}} bằng double: chậm hơn và dễ sai làm tròn; JDK dùng {{old >> 1}}.`,
    },
  ],
  check: [
    {
      q: '{{new ArrayList<>()}} rồi lần lượt add 11 phần tử. Capacity của mảng bên trong lúc này là bao nhiêu?',
      options: ['11', '15', '20', '16'],
      answer: 1,
      explain: `Lần add đầu cấp phát 10 ô. Phần tử thứ 11 làm mảng đầy nên grow thành {{10 + (10 >> 1)}} = 15. 20 là nhầm với hệ số 2 (như Vector mặc định), 16 là nhầm với HashMap, còn 11 là nghĩ ArrayList chỉ tăng đúng 1 ô mỗi lần.`,
    },
    {
      q: '{{List<Integer> l = new ArrayList<>(List.of(5, 1, 7));}} sau đó gọi {{l.remove(1)}}. Kết quả là gì?',
      options: ['[5, 7]: xoá phần tử ở chỉ số 1', '[5, 7]: xoá giá trị 1', '[1, 7]: xoá giá trị 5', 'Lỗi biên dịch vì mơ hồ'],
      answer: 0,
      explain: `Có hai overload {{remove(int index)}} và {{remove(Object o)}}. Đối số {{1}} là {{int}} nên khớp chính xác với {{remove(int)}}, không cần autoboxing, vì vậy xoá **chỉ số 1**, mà ở đây phần tử đó lại có giá trị 1 nên kết quả trông giống nhau. Phương án "xoá giá trị 1" sai cơ chế: với {{List.of(5, 3, 7)}} thì nó xoá 3. Không có lỗi biên dịch vì overload resolution ưu tiên khớp không cần boxing. Muốn xoá theo giá trị: {{l.remove(Integer.valueOf(1))}}.`,
    },
    {
      q: 'Vòng lặp {{while (!list.isEmpty()) list.remove(0);}} trên ArrayList 1 triệu phần tử chạy rất chậm. Vì sao?',
      options: ['Mỗi lần remove(0) phải dịch toàn bộ phần còn lại, tổng O(n²)', 'ArrayList co mảng lại sau mỗi lần remove', 'isEmpty() duyệt cả list nên O(n)', 'remove ném và bắt ConcurrentModificationException mỗi vòng'],
      answer: 0,
      explain: `{{remove(0)}} gọi {{System.arraycopy}} dịch {{size - 1}} phần tử, cộng dồn n + (n-1) + ... ≈ n²/2 lần dịch. ArrayList không bao giờ tự co mảng; {{isEmpty()}} chỉ so {{size == 0}} (O(1)); và không có iterator nên không có CME. Cách đúng: {{clear()}}, xoá từ cuối, hoặc dùng {{ArrayDeque}} nếu cần lấy ra từ đầu.`,
    },
  ],
  related: ['collections-003', 'collections-004', 'collections-008'],
  tags: ['ArrayList', 'dynamic array', 'amortized', 'System.arraycopy'],
},
{
  id: 'lesson-collections-003',
  track: 'collections',
  order: 3,
  title: 'ConcurrentHashMap: CAS, khoá theo bin, compute/merge nguyên tử và vì sao không cho null',
  level: 'senior',
  minutes: 30,
  goals: [
    'Giải thích được một lệnh {{put}} của {{ConcurrentHashMap}} (Java 8+) khi nào dùng CAS, khi nào khoá, và khoá cái gì',
    'Nhận ra lỗi check-then-act và read-modify-write, sửa bằng {{merge}}/{{compute}}/{{putIfAbsent}}',
    'Biết các giới hạn: {{size()}} chỉ là ước lượng khi đang ghi, hàm trong {{compute}} chạy khi đang giữ khoá, không cho null',
  ],
  body: `### Vấn đề: HashMap mất dữ liệu khi nhiều thread cùng ghi
{{HashMap}} không có bất kỳ đồng bộ nào. Hai thread cùng {{put}} vào một bucket trống có thể cùng thấy bucket là null và cùng ghi node của mình: node ghi sau đè node ghi trước, một entry biến mất. Hai thread cùng resize có thể làm hỏng cấu trúc bảng. Còn đếm bằng {{map.put(k, map.get(k) + 1)}} thì mất cập nhật gần như chắc chắn khi có tranh chấp.

Cách cũ là bọc lại: {{Hashtable}} hay {{Collections.synchronizedMap}} dùng **một khoá cho cả map**, nên 32 thread cũng chỉ ghi được lần lượt từng thread một. {{ConcurrentHashMap}} giải quyết bằng cách **khoá nhỏ nhất có thể**.

### Java 8+: CAS cho bin trống, synchronized trên node đầu bin
Java 7 chia map thành 16 **Segment** (mỗi segment là một ReentrantLock). Java 8 viết lại hoàn toàn: chỉ còn một mảng {{Node[] table}} giống HashMap, và mỗi lệnh {{put}} đi theo các bước:

1. Tính hash (trộn bit như HashMap) và chỉ số bin. Bảng được tạo lười, cũng bằng CAS.
2. **Bin trống**: ghi node mới bằng **CAS** (compare-and-swap) lên ô của mảng, **không khoá gì cả**. Nếu CAS thua (thread khác vừa ghi), vòng lặp thử lại.
3. **Bin đang được chuyển khi resize** (node đầu là {{ForwardingNode}}, hash = MOVED): thread này **giúp** chuyển dữ liệu sang bảng mới rồi mới put. Resize được nhiều thread chia nhau làm, mỗi thread nhận một dải bin.
4. **Bin đã có node**: {{synchronized}} trên **node đầu của bin đó**, rồi duyệt danh sách (hoặc cây đỏ-đen nếu bin đã treeify, cùng ngưỡng 8/64 như HashMap) để ghi đè hoặc thêm node.
5. Tăng bộ đếm phần tử bằng CAS; khi tranh chấp cao thì đếm trên nhiều ô {{CounterCell}} (giống {{LongAdder}}).

~~~java
// Ý tưởng putVal (rút gọn từ JDK, không phải code đầy đủ)
if ((f = tabAt(tab, i)) == null) {
    if (casTabAt(tab, i, null, new Node<>(hash, key, value))) break;  // không khoá
} else if (f.hash == MOVED) {
    tab = helpTransfer(tab, f);                                     // giúp resize
} else {
    synchronized (f) { /* chỉ khoá bin i: các bin khác vẫn ghi song song */ }
}
~~~

**Vì sao thiết kế như vậy?** Với hash phân tán tốt, phần lớn bin có 0–1 node, nên đa số lệnh put rơi vào nhánh CAS rẻ. Hai thread chỉ chặn nhau khi ghi **cùng một bin**. Còn {{get}} **không khoá**: các trường {{val}} và {{next}} của Node là {{volatile}}, nên đọc luôn thấy dữ liệu đã được ghi đầy đủ.

### size() chỉ là ước lượng
{{size()}} cộng {{baseCount}} với mọi CounterCell. Trong lúc thread khác đang ghi, kết quả có thể đã cũ ngay khi trả về. Cần số lớn hơn {{Integer.MAX_VALUE}} thì dùng {{mappingCount()}}. Iterator là **weakly consistent**: không bao giờ ném {{ConcurrentModificationException}}, có thể thấy hoặc không thấy thay đổi xảy ra sau khi bắt đầu duyệt.

### Thao tác nguyên tử: đừng tự ghép get rồi put
Mỗi method đơn lẻ là thread-safe, nhưng **ghép hai lời gọi lại thì không**:

~~~java
// SAI: hai thread cùng đọc 5, cùng ghi 6 → mất một lần đếm
counts.put(word, counts.getOrDefault(word, 0L) + 1);
// ĐÚNG: đọc-sửa-ghi trong một thao tác, khoá bin trong lúc chạy hàm
counts.merge(word, 1L, Long::sum);

// SAI: check-then-act, hai thread cùng thấy "chưa có" → tạo 2 list, 1 bị mất
if (!byUser.containsKey(u)) byUser.put(u, new CopyOnWriteArrayList<>());
// ĐÚNG
byUser.computeIfAbsent(u, k -> new CopyOnWriteArrayList<>()).add(order);
~~~

| Method | Nguyên tử làm gì | Ghi chú |
|---|---|---|
| {{putIfAbsent(k, v)}} | thêm nếu chưa có | {{v}} luôn được tạo trước, kể cả khi không dùng |
| {{computeIfAbsent(k, f)}} | gọi {{f}} chỉ khi chưa có | dùng cho cache, multimap |
| {{compute(k, f)}} | đọc-sửa-ghi, {{f}} trả về null thì xoá key | linh hoạt nhất |
| {{merge(k, v, f)}} | chưa có thì đặt {{v}}, có rồi thì {{f(old, v)}} | đếm, cộng dồn |
| {{replace(k, old, new)}} / {{remove(k, v)}} | compare-and-set theo giá trị | optimistic update |

### Vì sao không cho null
{{ConcurrentHashMap}} ném {{NullPointerException}} với key hoặc value null. Lý do: nếu cho null thì {{get(k) == null}} có hai nghĩa ("không có key" hoặc "value là null"). Với HashMap bạn gọi thêm {{containsKey}} để phân biệt, nhưng trong môi trường đồng thời, giữa hai lời gọi đó thread khác có thể đã thêm hoặc xoá key, nên kết quả không còn tin được. Cấm null loại bỏ hẳn sự mơ hồ: null luôn nghĩa là "không có". Nhờ vậy {{compute}} cũng dùng được null với nghĩa "xoá key".

### Lỗi production hay gặp
- **Hàm trong {{compute}}/{{computeIfAbsent}} chạy khi đang giữ khoá bin**: gọi HTTP hay query DB trong đó sẽ chặn mọi thread khác ghi vào cùng bin. Tệ hơn, sửa **chính map đó** bên trong hàm (ví dụ computeIfAbsent lồng nhau) có thể ném {{IllegalStateException: Recursive update}} hoặc treo.
- **Một key cực nóng** (mọi thread cùng {{merge}} vào key "total") thì mọi thread xếp hàng trên một khoá. Dùng value là {{LongAdder}}: {{map.computeIfAbsent(k, x -> new LongAdder()).increment()}}.
- **Value mutable không thread-safe**: map an toàn không làm {{ArrayList}} nằm bên trong an toàn. Sửa value trong {{compute}}, hoặc dùng value thread-safe như {{ConcurrentHashMap.newKeySet()}}.
- Dựa vào {{size()}} hay {{isEmpty()}} để ra quyết định nghiệp vụ trong lúc map đang được ghi.

> Hiệu năng: ở Java 8, {{computeIfAbsent}} khoá bin ngay cả khi key đã có, nên cache "đọc nhiều" bị tranh chấp; JDK 9 đã thêm đường đi nhanh kiểm tra node đầu bin trước khi khoá. Trên Java 8, mẫu phổ biến là {{get}} trước, null mới {{computeIfAbsent}}.

### Liên hệ phỏng vấn
Interviewer hay hỏi: khác biệt Java 7 (Segment) và Java 8 (CAS + synchronized trên bin), vì sao {{get}} không cần khoá, vì sao {{size()}} không chính xác tuyệt đối, vì sao cấm null, và "code đếm này có thread-safe không" với một đoạn get-rồi-put trên ConcurrentHashMap. Câu trả lời senior luôn đi kèm: chọn đúng thao tác nguyên tử, giữ hàm trong compute ngắn, và dùng LongAdder cho key nóng.`,
  exercises: [
    {
      title: 'Đếm tần suất từ từ nhiều thread bằng merge',
      prompt: `Viết {{WordCounter}} được nhiều thread gọi đồng thời:

- {{add(word)}}: tăng số lần xuất hiện của {{word}} thêm 1. Phải đúng tuyệt đối khi 8 thread cùng gọi hàng trăm nghìn lần. {{word}} null thì ném {{NullPointerException}}.
- {{count(word)}}: số lần đã đếm, chưa có thì trả về 0.
- {{snapshot()}}: trả về một **bản sao** (thay đổi sau đó của counter không ảnh hưởng tới bản sao).

Starter đang dùng {{HashMap}}; nếu bạn viết {{put(w, get(w) + 1)}} kể cả trên ConcurrentHashMap thì test đa luồng sẽ báo mất cập nhật.`,
      starter: `class WordCounter {
    private final Map<String, Long> counts = new HashMap<>();   // TODO: HashMap không thread-safe

    void add(String word) {
        throw new UnsupportedOperationException("TODO");
    }

    long count(String word) {
        throw new UnsupportedOperationException("TODO");
    }

    Map<String, Long> snapshot() {
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
    // chạy task trên nhiều thread, cùng xuất phát nhờ latch để tối đa tranh chấp
    static void runConcurrently(int threads, IntConsumer task) {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> fs = new ArrayList<>();
        try {
            for (int t = 0; t < threads; t++) {
                final int id = t;
                fs.add(pool.submit(() -> { start.await(); task.accept(id); return null; }));
            }
            start.countDown();
            pool.shutdown();
            if (!pool.awaitTermination(20, TimeUnit.SECONDS)) throw new AssertionError("timeout: có thể bị deadlock");
            for (Future<?> f : fs) f.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new AssertionError("task lỗi: " + (e.getCause() != null ? e.getCause() : e));
        } finally {
            pool.shutdownNow();
        }
    }
    public static void main(String[] args) {
        check("single thread counts", () -> {
            WordCounter c = new WordCounter();
            for (String w : "to be or not to be".split(" ")) c.add(w);
            eq(2L, c.count("to")); eq(2L, c.count("be")); eq(1L, c.count("or")); eq(1L, c.count("not"));
        });
        check("unknown word is 0", () -> eq(0L, new WordCounter().count("ghost")));
        check("null word throws NPE", () -> {
            try { new WordCounter().add(null); } catch (NullPointerException e) { return; }
            throw new AssertionError("add(null) phải ném NullPointerException");
        });
        check("8 threads hammer 4 hot words: no lost update", () -> {
            for (int round = 0; round < 3; round++) {
                WordCounter c = new WordCounter();
                String[] words = { "VND", "USD", "EUR", "JPY" };
                runConcurrently(8, id -> { for (int i = 0; i < 100_000; i++) c.add(words[i % 4]); });
                for (String w : words) eq(200_000L, c.count(w));
            }
        });
        check("8 threads insert 2000 distinct keys concurrently", () -> {
            WordCounter c = new WordCounter();
            runConcurrently(8, id -> { for (int r = 0; r < 10; r++) for (int i = 0; i < 2000; i++) c.add("acc-" + i); });
            Map<String, Long> s = c.snapshot();
            eq(2000, s.size());
            for (int i = 0; i < 2000; i++) eq(80L, s.get("acc-" + i));
        });
        check("snapshot is an independent copy", () -> {
            WordCounter c = new WordCounter();
            c.add("a"); c.add("a"); c.add("b");
            Map<String, Long> s = c.snapshot();
            c.add("a"); c.add("z");
            eq(2L, s.get("a")); eq(null, s.get("z")); eq(2, s.size());
            eq(3L, c.count("a"));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class WordCounter {
    private final ConcurrentHashMap<String, Long> counts = new ConcurrentHashMap<>();

    void add(String word) {
        // merge là đọc-sửa-ghi nguyên tử: chưa có thì đặt 1, có rồi thì old + 1
        // ConcurrentHashMap tự ném NullPointerException khi key null
        counts.merge(word, 1L, Long::sum);
    }

    long count(String word) {
        return counts.getOrDefault(word, 0L);
    }

    Map<String, Long> snapshot() {
        return new HashMap<>(counts);   // copy; iterator weakly consistent nên không ném CME
    }
}`,
      hints: [
        'Đổi field sang {{ConcurrentHashMap<String, Long>}}. Bản thân việc đổi map chưa đủ: {{get}} rồi {{put}} vẫn là hai thao tác tách rời.',
        'Dùng {{counts.merge(word, 1L, Long::sum)}}: một lời gọi duy nhất, nguyên tử theo key.',
        'Snapshot: {{new HashMap<>(counts)}} tạo bản sao độc lập.',
      ],
      explain: `{{merge}} chạy toàn bộ "đọc giá trị cũ, cộng, ghi lại" trong lúc giữ khoá của bin chứa key (hoặc bằng một CAS nếu bin còn trống), nên không thread nào chen vào giữa được. Với HashMap thường, test đa luồng có thể mất cập nhật, ra số sai, thậm chí mất cả key khi hai thread cùng resize.

Lỗi hay gặp:
- Đổi sang ConcurrentHashMap nhưng vẫn viết {{counts.put(w, counts.getOrDefault(w, 0L) + 1)}}: hai thread cùng đọc 41, cùng ghi 42, mất một lần đếm. Test với 4 key nóng và 8 thread sẽ cho số nhỏ hơn 200000.
- Bọc mọi thứ bằng {{synchronized}} trên cả object: đúng nhưng mọi thread xếp hàng một khoá, mất ý nghĩa của ConcurrentHashMap.
- Trả về chính map bên trong ở {{snapshot()}}: người gọi thấy dữ liệu tiếp tục thay đổi và còn sửa được trạng thái nội bộ.

Khi vài key cực nóng (hàng triệu lần/giây), cả {{merge}} cũng tranh chấp trên một khoá bin; khi đó dùng {{ConcurrentHashMap<String, LongAdder>}} với {{computeIfAbsent(w, k -> new LongAdder()).increment()}}: LongAdder chia bộ đếm ra nhiều ô để các thread không đụng nhau.`,
    },
    {
      title: 'Registry phiên đăng nhập: multimap đồng thời bằng compute',
      prompt: `Một user có thể có nhiều phiên đăng nhập (web, mobile...). Viết {{SessionRegistry}} được nhiều thread gọi đồng thời:

- {{login(userId, sessionId)}}: thêm phiên cho user.
- {{logout(userId, sessionId)}}: xoá phiên; nếu user không còn phiên nào thì **xoá luôn key của user** khỏi map (không để lại set rỗng gây rò bộ nhớ).
- {{sessions(userId)}}: bản sao tập phiên hiện tại, user không có thì trả về tập rỗng.
- {{activeUsers()}}: số user đang có ít nhất một phiên.

Login và logout của **cùng một user** có thể chạy song song; không được mất phiên nào. Gợi ý: làm mọi thay đổi trên set **bên trong** {{compute}}/{{computeIfPresent}}.`,
      starter: `class SessionRegistry {
    private final Map<String, Set<String>> byUser = new HashMap<>();   // TODO

    void login(String userId, String sessionId) {
        throw new UnsupportedOperationException("TODO");
    }

    void logout(String userId, String sessionId) {
        throw new UnsupportedOperationException("TODO");
    }

    Set<String> sessions(String userId) {
        throw new UnsupportedOperationException("TODO");
    }

    int activeUsers() {
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
    static void runConcurrently(int threads, IntConsumer task) {
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> fs = new ArrayList<>();
        try {
            for (int t = 0; t < threads; t++) {
                final int id = t;
                fs.add(pool.submit(() -> { start.await(); task.accept(id); return null; }));
            }
            start.countDown();
            pool.shutdown();
            if (!pool.awaitTermination(20, TimeUnit.SECONDS)) throw new AssertionError("timeout: có thể bị deadlock");
            for (Future<?> f : fs) f.get();
        } catch (InterruptedException | ExecutionException e) {
            throw new AssertionError("task lỗi: " + (e.getCause() != null ? e.getCause() : e));
        } finally {
            pool.shutdownNow();
        }
    }
    public static void main(String[] args) {
        check("login, logout, cleanup empty user", () -> {
            SessionRegistry r = new SessionRegistry();
            r.login("u1", "web"); r.login("u1", "mobile"); r.login("u2", "web");
            eq(Set.of("web", "mobile"), r.sessions("u1")); eq(2, r.activeUsers());
            r.logout("u1", "web"); eq(Set.of("mobile"), r.sessions("u1"));
            r.logout("u1", "mobile"); eq(Set.of(), r.sessions("u1")); eq(1, r.activeUsers());
        });
        check("unknown user and unknown session are no-ops", () -> {
            SessionRegistry r = new SessionRegistry();
            r.logout("ghost", "x");
            r.login("u", "a"); r.logout("u", "zzz");
            eq(Set.of(), r.sessions("ghost")); eq(Set.of("a"), r.sessions("u")); eq(1, r.activeUsers());
        });
        check("sessions() returns a copy", () -> {
            SessionRegistry r = new SessionRegistry();
            r.login("u", "a");
            Set<String> s = r.sessions("u");
            r.login("u", "b");
            eq(Set.of("a"), s);
        });
        check("concurrent logins: 8 threads x 100 users x 50 sessions", () -> {
            SessionRegistry r = new SessionRegistry();
            runConcurrently(8, id -> {
                for (int s = 0; s < 50; s++) for (int u = 0; u < 100; u++) r.login("user-" + u, "t" + id + "-s" + s);
            });
            eq(100, r.activeUsers());
            for (int u = 0; u < 100; u++) eq(400, r.sessions("user-" + u).size());
        });
        check("concurrent login and logout on the same users", () -> {
            for (int round = 0; round < 5; round++) {
                SessionRegistry r = new SessionRegistry();
                for (int u = 0; u < 20; u++) for (int s = 0; s < 200; s++) r.login("u" + u, "old-" + s);
                runConcurrently(8, id -> {
                    for (int s = 0; s < 200; s++) for (int u = 0; u < 20; u++) {
                        if (id % 2 == 0) { if (s % 4 == id / 2) r.logout("u" + u, "old-" + s); }
                        else r.login("u" + u, "new-" + id + "-" + s);
                    }
                });
                eq(20, r.activeUsers());
                for (int u = 0; u < 20; u++) eq(800, r.sessions("u" + u).size());   // 4 thread x 200 phiên mới
            }
        });
        check("all logouts in parallel leave no empty users", () -> {
            SessionRegistry r = new SessionRegistry();
            for (int u = 0; u < 50; u++) for (int s = 0; s < 80; s++) r.login("u" + u, "s" + s);
            runConcurrently(8, id -> { for (int u = 0; u < 50; u++) for (int s = id; s < 80; s += 8) r.logout("u" + u, "s" + s); });
            eq(0, r.activeUsers());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class SessionRegistry {
    private final ConcurrentHashMap<String, Set<String>> byUser = new ConcurrentHashMap<>();

    void login(String userId, String sessionId) {
        // thêm phiên NGAY TRONG compute: đang giữ khoá bin nên logout không thể xoá set giữa chừng
        byUser.compute(userId, (k, set) -> {
            if (set == null) set = ConcurrentHashMap.newKeySet();
            set.add(sessionId);
            return set;
        });
    }

    void logout(String userId, String sessionId) {
        // trả về null = xoá key; làm nguyên tử cùng với việc remove phiên
        byUser.computeIfPresent(userId, (k, set) -> {
            set.remove(sessionId);
            return set.isEmpty() ? null : set;
        });
    }

    Set<String> sessions(String userId) {
        Set<String> s = byUser.get(userId);
        return s == null ? Set.of() : Set.copyOf(s);
    }

    int activeUsers() {
        return byUser.size();
    }
}`,
      hints: [
        'Map nên là {{ConcurrentHashMap<String, Set<String>>}}, value là {{ConcurrentHashMap.newKeySet()}} để đọc an toàn từ {{sessions()}}.',
        'Logout: {{computeIfPresent(userId, (k, set) -> ...)}} xoá phiên rồi trả về null nếu set rỗng: trả về null nghĩa là xoá key.',
        'Login: đừng viết {{computeIfAbsent(...).add(...)}}: lệnh add chạy **sau** khi đã nhả khoá, logout có thể vừa xoá set đó khỏi map. Hãy {{add}} ngay bên trong {{compute}}.',
      ],
      explain: `Mấu chốt là mọi thay đổi trên set của một user đều diễn ra **bên trong** {{compute}}/{{computeIfPresent}}, tức là trong lúc giữ khoá bin của key đó. Nhờ vậy "thêm phiên" và "xoá phiên, set rỗng thì xoá user" không bao giờ đan xen.

Vì sao {{byUser.computeIfAbsent(u, k -> newKeySet()).add(s)}} (mẫu multimap phổ biến) lại sai ở đây? {{computeIfAbsent}} trả về set rồi **nhả khoá**, sau đó mới gọi {{add}}. Nếu đúng khoảnh khắc đó một thread logout xoá phiên cuối cùng và xoá key user, thì {{add}} ghi vào một set đã bị tách khỏi map: phiên mới bị mất một cách im lặng. Mẫu computeIfAbsent rồi add chỉ an toàn khi **không bao giờ xoá key**.

Lỗi hay gặp khác: dùng {{HashSet}} làm value rồi trả thẳng ra ngoài (thread đọc thấy set đang bị sửa), để lại set rỗng sau logout (map phình dần, rò bộ nhớ), hay {{if (set.isEmpty()) byUser.remove(userId)}} tách rời khỏi compute (có thể xoá mất user vừa login lại).`,
    },
  ],
  check: [
    {
      q: '{{ConcurrentHashMap}} (Java 8+) xử lý thế nào khi {{put}} vào một bin đang trống?',
      options: ['Khoá Segment chứa bin bằng ReentrantLock', 'synchronized trên toàn bộ map', 'Ghi node bằng CAS, không lấy khoá', 'synchronized trên mảng table'],
      answer: 2,
      explain: `Bin trống được ghi bằng CAS lên ô của mảng; thua CAS thì vòng lặp thử lại. Chỉ khi bin đã có node mới {{synchronized}} trên **node đầu bin**. Segment + ReentrantLock là thiết kế Java 7, đã bị bỏ ở Java 8. Khoá toàn map là cách của Hashtable/synchronizedMap. Khoá cả mảng table sẽ chặn mọi thread, ngược với mục tiêu của ConcurrentHashMap.`,
    },
    {
      q: 'Vì sao {{ConcurrentHashMap}} không cho key hoặc value null?',
      options: ['Vì hash của null không tính được', 'Vì {{get}} trả về null sẽ mơ hồ giữa "không có" và "value null", và không thể kiểm tra lại bằng containsKey một cách nguyên tử', 'Vì CAS không so sánh được với null', 'Vì null làm cây đỏ-đen mất cân bằng'],
      answer: 1,
      explain: `Trong map đồng thời, {{containsKey}} rồi {{get}} là hai thao tác tách rời, giữa chúng thread khác có thể thay đổi map, nên không có cách nào phân biệt chắc chắn hai nghĩa của null. HashMap vẫn tính hash cho null (cho bằng 0) nên "không tính được" là sai. CAS so sánh tham chiếu, null là giá trị hợp lệ (bin trống chính là null). Cây đỏ-đen không liên quan.`,
    },
    {
      q: 'Đoạn {{map.put(k, map.get(k) + 1)}} trên một {{ConcurrentHashMap<String, Integer>}} có key k sẵn. 2 thread cùng chạy, mỗi thread 1 lần. Kết quả có thể là gì?',
      options: ['Luôn tăng đúng 2 vì ConcurrentHashMap thread-safe', 'Có thể chỉ tăng 1 vì get và put là hai thao tác tách rời', 'Luôn ném ConcurrentModificationException', 'Deadlock vì put chờ get nhả khoá'],
      answer: 1,
      explain: `Mỗi method riêng lẻ là thread-safe, nhưng hai thread có thể cùng {{get}} ra 5 rồi cùng {{put}} 6: mất một lần tăng (lost update). Sửa bằng {{merge(k, 1, Integer::sum)}} hoặc {{compute}}. ConcurrentHashMap không ném CME, và {{get}} không lấy khoá nên không có deadlock.`,
    },
  ],
  related: ['collections-002', 'collections-004', 'concurrency-001'],
  tags: ['ConcurrentHashMap', 'CAS', 'merge', 'compute', 'thread-safety'],
},
{
  id: 'lesson-collections-004',
  track: 'collections',
  order: 4,
  title: 'TreeMap và NavigableMap: tra cứu theo khoảng và Comparator nhất quán với equals',
  level: 'mid',
  minutes: 25,
  goals: [
    'Giải thích TreeMap lưu dữ liệu bằng cây đỏ-đen và vì sao mọi thao tác là O(log n)',
    'Dùng đúng {{floorEntry}}/{{ceilingEntry}}/{{lowerEntry}}/{{higherEntry}} và các view {{headMap}}/{{tailMap}}/{{subMap}}',
    'Viết Comparator nhất quán với {{equals}}, không tràn số, và hiểu vì sao Comparator sai làm "mất" phần tử',
  ],
  body: `### TreeMap là cây nhị phân tìm kiếm tự cân bằng
{{TreeMap}} lưu mỗi entry trong một node có {{key}}, {{value}}, con trái, con phải, cha và một bit màu. Quy tắc của cây tìm kiếm: mọi key ở nhánh trái **nhỏ hơn** node, mọi key ở nhánh phải **lớn hơn**. Để tìm một key, ta xuất phát từ gốc, so sánh rồi rẽ trái hoặc phải, mỗi bước loại bỏ được cả một nhánh.

Nếu chỉ chèn ngây thơ, dữ liệu đã sắp xếp sẽ biến cây thành một "danh sách" lệch hẳn sang một bên (O(n)). TreeMap dùng **cây đỏ-đen**: sau mỗi lần chèn/xoá, nó tô lại màu và xoay node để giữ chiều cao không quá khoảng 2·log2(n). Kết quả: {{get}}, {{put}}, {{remove}}, {{floorKey}}... đều **O(log n) trong trường hợp xấu nhất**. Một triệu key chỉ cần khoảng 20 đến 40 lần so sánh.

So với {{HashMap}} (O(1) trung bình), TreeMap chậm hơn và tốn bộ nhớ hơn (mỗi node có thêm 3 con trỏ), nhưng đổi lại có thứ mà HashMap không có: **thứ tự** và **tra cứu theo khoảng**.

### NavigableMap: hỏi "gần nhất" thay vì "đúng bằng"
| Method | Trả về key | Ví dụ với key 0, 100, 500 |
|---|---|---|
| {{floorKey(x)}} | lớn nhất **≤** x | floorKey(250) = 100, floorKey(100) = 100 |
| {{lowerKey(x)}} | lớn nhất **<** x | lowerKey(100) = 0 |
| {{ceilingKey(x)}} | nhỏ nhất **≥** x | ceilingKey(101) = 500 |
| {{higherKey(x)}} | nhỏ nhất **>** x | higherKey(500) = null |
| {{headMap(x, incl)}} / {{tailMap(x, incl)}} / {{subMap(a, ai, b, bi)}} | view theo khoảng | tailMap(100, true) = 100, 500 |
| {{firstEntry()}} / {{pollFirstEntry()}} / {{descendingMap()}} | đầu, lấy-và-xoá, đảo chiều | |

Các method {{...Entry}} trả về entry tương ứng. Không có key phù hợp thì trả về **null**, nên luôn phải kiểm tra null.

Bài toán kinh điển là **tra bậc**: biểu phí theo bậc số tiền, thuế luỹ tiến, giá có hiệu lực tại một thời điểm, tra dải IP:

~~~java
NavigableMap<Long, Long> feeByTier = new TreeMap<>();
feeByTier.put(0L, 1_100L);              // từ 0đ: phí 1.100đ
feeByTier.put(10_000_000L, 3_300L);     // từ 10 triệu: phí 3.300đ
feeByTier.put(500_000_000L, 11_000L);   // từ 500 triệu: phí 11.000đ
Map.Entry<Long, Long> e = feeByTier.floorEntry(25_000_000L);  // bậc 10 triệu → 3.300
// Không dùng Map: phải duyệt tuyến tính hoặc chuỗi if/else cứng trong code
~~~

Các view ({{headMap}}, {{subMap}}...) **không copy**: chúng nhìn thẳng vào cây gốc, sửa view là sửa map gốc, và {{put}} một key nằm ngoài khoảng của view sẽ ném {{IllegalArgumentException}}. Entry trả về từ {{floorEntry}} và các method tương tự là ảnh chụp bất biến: gọi {{setValue}} sẽ ném {{UnsupportedOperationException}}.

### TreeMap chỉ dùng compare, không dùng equals
Đây là điểm quan trọng nhất của bài. TreeMap quyết định hai key "bằng nhau" khi {{compare(a, b) == 0}}. Nó **không bao giờ gọi** {{equals}} hay {{hashCode}}. Vì vậy Comparator phải **nhất quán với equals**: {{compare(a, b) == 0}} khi và chỉ khi {{a.equals(b)}}. Vi phạm thì:

~~~java
// Comparator chỉ so số tiền: hai giao dịch khác nhau nhưng cùng 500.000đ bị coi là MỘT key
Set<Txn> ranking = new TreeSet<>(Comparator.comparingLong(Txn::amount).reversed());
ranking.add(new Txn("T1", 500_000));
ranking.add(new Txn("T2", 500_000));   // compare == 0 → add trả về false, T2 biến mất im lặng
// Sửa: thêm tiêu chí phụ phân biệt duy nhất
Comparator.comparingLong(Txn::amount).reversed().thenComparing(Txn::id);
~~~

Ví dụ ngược lại trong JDK: {{new BigDecimal("1.0")}} và {{new BigDecimal("1.00")}} **không** equals (khác scale) nhưng {{compareTo}} bằng 0. Bỏ cả hai vào {{HashSet}} được 2 phần tử, vào {{TreeSet}} chỉ còn 1. Với {{TreeMap.put}}, key cũ được giữ, chỉ value bị ghi đè.

### Lỗi production hay gặp
- **Comparator bằng phép trừ**: {{(a, b) -> a.amount() - b.amount()}} tràn số khi giá trị lớn hoặc âm (ví dụ hoàn tiền), cho dấu sai, làm cây sắp xếp sai và tra cứu "không thấy" key đang có. Dùng {{Long.compare}}, {{Comparator.comparingLong}}.
- **Key mutable**: đổi field tham gia so sánh sau khi put thì key nằm sai vị trí trong cây, {{get}} không tìm thấy, giống lỗi key mutable ở HashMap.
- **Null**: với thứ tự tự nhiên, {{put(null, v)}} ném {{NullPointerException}}. Cần null thì dùng {{Comparator.nullsFirst(...)}}.
- **Quên kiểm tra null** của {{floorEntry}} khi giá trị nhỏ hơn bậc thấp nhất, gây NPE ở tầng gọi.
- **Dùng chung giữa nhiều thread**: TreeMap không thread-safe. Cần NavigableMap đồng thời thì dùng {{ConcurrentSkipListMap}} (skip list, O(log n) kỳ vọng, không khoá khi đọc).

> Từ Java 21, {{TreeMap}} là một {{SequencedMap}}: có {{firstEntry()}}, {{lastEntry()}}, {{reversed()}}; nhưng {{putFirst}}/{{putLast}} ném {{UnsupportedOperationException}} vì vị trí do Comparator quyết định.

### Liên hệ phỏng vấn
Interviewer hay hỏi: khi nào chọn TreeMap thay vì HashMap (cần thứ tự hoặc truy vấn khoảng), độ phức tạp và vì sao (cây đỏ-đen cân bằng), và câu bẫy "TreeSet tự nhiên mất phần tử" để xem bạn có biết TreeMap so sánh bằng {{compare}} chứ không phải {{equals}}. Trả lời tốt sẽ kèm một use case thật như biểu phí theo bậc dùng {{floorEntry}}, đúng như bài tập dưới đây.`,
  exercises: [
    {
      title: 'Biểu phí chuyển tiền theo bậc số tiền bằng floorEntry',
      prompt: `Ngân hàng tính phí chuyển khoản theo bậc: mỗi bậc bắt đầu từ một mức tiền {{fromAmount}} (tính cả mức đó) và áp dụng cho tới mức của bậc kế tiếp. Viết {{FeeSchedule}}:

- {{addTier(fromAmount, fee)}}: thêm bậc; thêm lại cùng {{fromAmount}} thì ghi đè phí. {{fromAmount < 0}} thì ném {{IllegalArgumentException}}. Bậc có thể được thêm theo thứ tự bất kỳ.
- {{feeFor(amount)}}: phí của bậc có {{fromAmount}} **lớn nhất mà ≤ amount**. Nếu không có bậc nào như vậy (số tiền nhỏ hơn bậc thấp nhất, hoặc chưa có bậc nào) thì ném {{IllegalArgumentException}}.
- {{nextThreshold(amount)}}: mức bắt đầu của bậc kế tiếp **lớn hơn hẳn** {{amount}} (để báo khách "chuyển từ X trở lên sẽ đổi phí"), không có thì trả về null.

Mỗi thao tác phải là O(log n).`,
      starter: `class FeeSchedule {
    // TODO: chọn cấu trúc dữ liệu phù hợp

    void addTier(long fromAmount, long fee) {
        throw new UnsupportedOperationException("TODO");
    }

    long feeFor(long amount) {
        throw new UnsupportedOperationException("TODO");
    }

    Long nextThreshold(long amount) {
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
    static FeeSchedule standard() {
        FeeSchedule s = new FeeSchedule();
        s.addTier(500_000_000L, 11_000L);     // thêm lộn xộn thứ tự
        s.addTier(0L, 1_100L);
        s.addTier(10_000_000L, 3_300L);
        return s;
    }
    public static void main(String[] args) {
        check("fee inside each tier", () -> {
            FeeSchedule s = standard();
            eq(1_100L, s.feeFor(0L)); eq(1_100L, s.feeFor(2_500_000L));
            eq(3_300L, s.feeFor(25_000_000L)); eq(11_000L, s.feeFor(2_000_000_000L));
        });
        check("boundaries are inclusive at fromAmount", () -> {
            FeeSchedule s = standard();
            eq(1_100L, s.feeFor(9_999_999L)); eq(3_300L, s.feeFor(10_000_000L));
            eq(3_300L, s.feeFor(499_999_999L)); eq(11_000L, s.feeFor(500_000_000L));
            eq(11_000L, s.feeFor(Long.MAX_VALUE));
        });
        check("below lowest tier or empty schedule throws", () -> {
            FeeSchedule s = new FeeSchedule();
            throwsIae(() -> s.feeFor(100L));
            s.addTier(1_000L, 500L);
            throwsIae(() -> s.feeFor(999L));
            eq(500L, s.feeFor(1_000L));
        });
        check("re-adding a tier overwrites its fee", () -> {
            FeeSchedule s = standard();
            s.addTier(10_000_000L, 2_200L);
            eq(2_200L, s.feeFor(10_000_000L)); eq(1_100L, s.feeFor(1L));
        });
        check("negative fromAmount rejected", () -> throwsIae(() -> new FeeSchedule().addTier(-1L, 100L)));
        check("nextThreshold is strictly greater", () -> {
            FeeSchedule s = standard();
            eq(0L, s.nextThreshold(-5L));
            eq(10_000_000L, s.nextThreshold(0L));
            eq(500_000_000L, s.nextThreshold(10_000_000L));
            eq(null, s.nextThreshold(500_000_000L));
            eq(null, new FeeSchedule().nextThreshold(1L));
        });
        check("10000 tiers", () -> {
            FeeSchedule s = new FeeSchedule();
            for (long i = 9_999; i >= 0; i--) s.addTier(i * 1_000L, i);
            eq(1_234L, s.feeFor(1_234_567L)); eq(9_999L, s.feeFor(50_000_000L));
            eq(1_235_000L, s.nextThreshold(1_234_567L));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class FeeSchedule {
    // key = mức bắt đầu của bậc, value = phí; TreeMap giữ key đã sắp xếp
    private final NavigableMap<Long, Long> tiers = new TreeMap<>();

    void addTier(long fromAmount, long fee) {
        if (fromAmount < 0) throw new IllegalArgumentException("fromAmount < 0: " + fromAmount);
        tiers.put(fromAmount, fee);                 // trùng key thì ghi đè
    }

    long feeFor(long amount) {
        Map.Entry<Long, Long> tier = tiers.floorEntry(amount);   // bậc lớn nhất <= amount, O(log n)
        if (tier == null) throw new IllegalArgumentException("Không có bậc phí cho số tiền " + amount);
        return tier.getValue();
    }

    Long nextThreshold(long amount) {
        return tiers.higherKey(amount);             // nhỏ nhất > amount, null nếu không có
    }
}`,
      hints: [
        'Dùng {{TreeMap<Long, Long>}}: key là mức bắt đầu của bậc, value là phí.',
        '{{floorEntry(amount)}} trả về bậc lớn nhất có key ≤ amount, hoặc null nếu amount nhỏ hơn mọi key.',
        'Bậc kế tiếp "lớn hơn hẳn" là {{higherKey}}, không phải {{ceilingKey}} (ceiling trả về chính amount nếu nó trùng một mức).',
      ],
      explain: `{{floorEntry}} chính là câu hỏi "bậc nào đang áp dụng cho số tiền này", trả lời trong O(log n) mà không cần chuỗi if/else hay duyệt danh sách. Thêm một bậc mới chỉ là một lệnh {{put}}, không phải sửa code; trong thực tế biểu phí thường được nạp từ DB hoặc config vào một TreeMap bất biến lúc khởi động.

Lỗi hay gặp:
- Dùng {{ceilingKey}} cho {{nextThreshold}}: khi amount đúng bằng một mức (10.000.000), ceiling trả về chính nó thay vì bậc kế tiếp.
- Quên kiểm tra {{floorEntry}} trả về null: gây {{NullPointerException}} khi unboxing thay vì một lỗi nghiệp vụ rõ ràng.
- Dùng {{HashMap}} rồi duyệt mọi key để tìm bậc: đúng kết quả nhưng O(n) và phụ thuộc thứ tự lặp không xác định nếu viết sai.
- Dùng {{double}} cho tiền: luôn dùng {{long}} (đơn vị nhỏ nhất) hoặc {{BigDecimal}}.`,
    },
    {
      title: 'Comparator xếp hạng giao dịch nhất quán với equals',
      prompt: `Hệ thống giám sát cần bảng xếp hạng giao dịch theo **số tiền giảm dần** bằng {{TreeSet<Txn>}}. Phiên bản hiện tại dùng {{Comparator.comparingLong(Txn::amount).reversed()}} và báo cáo bị **thiếu giao dịch** mỗi khi hai giao dịch cùng số tiền.

Viết {{Rankings.byAmountDesc()}} trả về Comparator:
- Số tiền lớn xếp trước. Số tiền có thể âm (hoàn tiền) và có thể là {{Long.MIN_VALUE}}/{{Long.MAX_VALUE}}: không được tràn số.
- Cùng số tiền thì {{id}} nhỏ hơn (thứ tự chữ cái) xếp trước.
- Nhất quán với {{equals}} của record: {{compare(a, b) == 0}} khi và chỉ khi {{a.equals(b)}}.`,
      starter: `record Txn(String id, long amount) {}

class Rankings {
    static Comparator<Txn> byAmountDesc() {
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
    static List<String> ids(Collection<Txn> c) {
        List<String> r = new ArrayList<>();
        for (Txn t : c) r.add(t.id());
        return r;
    }
    public static void main(String[] args) {
        check("larger amount first", () -> {
            TreeSet<Txn> s = new TreeSet<>(Rankings.byAmountDesc());
            s.add(new Txn("A", 100)); s.add(new Txn("B", 900)); s.add(new Txn("C", 500));
            eq(List.of("B", "C", "A"), ids(s));
        });
        check("equal amounts are all kept, ordered by id", () -> {
            TreeSet<Txn> s = new TreeSet<>(Rankings.byAmountDesc());
            s.add(new Txn("T3", 500_000)); s.add(new Txn("T1", 500_000)); s.add(new Txn("T2", 500_000)); s.add(new Txn("T0", 1));
            eq(4, s.size());
            eq(List.of("T1", "T2", "T3", "T0"), ids(s));
        });
        check("extreme and negative amounts do not overflow", () -> {
            TreeSet<Txn> s = new TreeSet<>(Rankings.byAmountDesc());
            s.add(new Txn("min", Long.MIN_VALUE)); s.add(new Txn("max", Long.MAX_VALUE));
            s.add(new Txn("refund", -1)); s.add(new Txn("zero", 0)); s.add(new Txn("big", 3_000_000_000L));
            eq(List.of("max", "big", "zero", "refund", "min"), ids(s));
        });
        check("consistent with equals", () -> {
            Comparator<Txn> c = Rankings.byAmountDesc();
            Txn[] xs = { new Txn("A", 5), new Txn("A", 5), new Txn("B", 5), new Txn("A", 6), new Txn("A", -5) };
            for (Txn a : xs) for (Txn b : xs) {
                boolean same = c.compare(a, b) == 0;
                if (same != a.equals(b)) throw new AssertionError("compare(" + a + ", " + b + ") = " + c.compare(a, b) + " nhưng equals = " + a.equals(b));
                if (Integer.signum(c.compare(a, b)) != -Integer.signum(c.compare(b, a))) throw new AssertionError("không phản xứng: " + a + " vs " + b);
            }
        });
        check("TreeMap lookup with an equal key", () -> {
            TreeMap<Txn, String> m = new TreeMap<>(Rankings.byAmountDesc());
            m.put(new Txn("X", 700), "flagged");
            eq("flagged", m.get(new Txn("X", 700)));
            eq(null, m.get(new Txn("Y", 700)));
            eq(1, m.size());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Txn(String id, long amount) {}

class Rankings {
    static Comparator<Txn> byAmountDesc() {
        // comparingLong dùng Long.compare bên trong: không trừ nên không tràn số
        return Comparator.comparingLong(Txn::amount).reversed()
                .thenComparing(Txn::id);   // tiêu chí phụ: phân biệt hai giao dịch cùng số tiền
    }
}`,
      hints: [
        'Bắt đầu từ {{Comparator.comparingLong(Txn::amount).reversed()}}; nó dùng {{Long.compare}} nên an toàn với giá trị cực trị.',
        'Thêm {{.thenComparing(Txn::id)}}: hai giao dịch chỉ "bằng nhau" khi cùng cả số tiền lẫn id, đúng như equals của record.',
      ],
      explain: `TreeSet coi hai phần tử là trùng khi {{compare == 0}}, nên Comparator chỉ so số tiền khiến giao dịch thứ hai cùng số tiền bị {{add}} trả về false và biến mất khỏi báo cáo, không có exception nào. Thêm tiêu chí phụ là {{id}} (duy nhất) làm Comparator nhất quán với equals.

Thứ tự trong chuỗi quan trọng: {{comparingLong(...).reversed().thenComparing(Txn::id)}} chỉ đảo chiều số tiền. Nếu viết {{comparingLong(...).thenComparing(Txn::id).reversed()}} thì cả id cũng bị đảo (T3 trước T1).

Lỗi hay gặp:
- {{(a, b) -> (int) (b.amount() - a.amount())}}: hiệu của hai long có thể tràn, và ép về int cắt mất 32 bit cao, nên 3.000.000.000 so với 0 có thể ra số âm. Kết quả: cây sắp sai, {{contains}} trả về false với phần tử đang có, và {{Collections.sort}} đôi khi ném "Comparison method violates its general contract".
- Viết tay {{-Long.compare(a, b)}} vẫn đúng, nhưng {{-a.compareTo(b)}} với một compareTo tự viết trả về {{Integer.MIN_VALUE}} thì đổi dấu vẫn ra chính nó. Dùng {{reversed()}} hoặc đảo tham số {{Long.compare(b, a)}} an toàn hơn.`,
    },
  ],
  check: [
    {
      q: 'Thêm {{new BigDecimal("1.0")}} và {{new BigDecimal("1.00")}} vào một {{HashSet}} và một {{TreeSet}}. Kích thước mỗi set là bao nhiêu?',
      options: ['HashSet 1, TreeSet 1', 'HashSet 2, TreeSet 2', 'HashSet 2, TreeSet 1', 'HashSet 1, TreeSet 2'],
      answer: 2,
      explain: `{{BigDecimal.equals}} so cả giá trị lẫn scale nên "1.0" và "1.00" khác nhau, và hashCode cũng khác: HashSet giữ 2. {{compareTo}} chỉ so giá trị nên trả về 0: TreeSet coi là trùng, giữ 1. Đây là ví dụ kinh điển của thứ tự tự nhiên **không** nhất quán với equals. Các phương án còn lại giả định hai set dùng cùng một tiêu chí so sánh, điều không đúng.`,
    },
    {
      q: 'TreeMap có các key 0, 100, 500. {{floorKey(100)}} và {{lowerKey(100)}} lần lượt trả về gì?',
      options: ['100 và 0', '0 và 0', '100 và 100', '100 và null'],
      answer: 0,
      explain: `floor là "lớn nhất ≤ x" nên lấy chính 100; lower là "lớn nhất < x" (chặt) nên lấy 0. null chỉ xảy ra khi không có key nào nhỏ hơn, ví dụ {{lowerKey(0)}}. Nhầm floor với lower là lỗi biên phổ biến khi tính biểu phí theo bậc.`,
    },
    {
      q: 'Comparator {{(a, b) -> (int) (a.amount() - b.amount())}} với {{amount}} kiểu long. Vấn đề là gì?',
      options: ['Không có vấn đề, chỉ chậm hơn Long.compare', 'Phép trừ có thể tràn và ép kiểu cắt bit, cho dấu sai nên TreeMap/sort hoạt động sai', 'Lỗi biên dịch vì lambda không trả về int', 'Chỉ sai khi amount bằng 0'],
      answer: 1,
      explain: `Hiệu của hai long có thể vượt phạm vi long (ví dụ MAX và số âm), còn ép về int thì bỏ 32 bit cao: hiệu 3.000.000.000 thành một số âm. Dấu sai làm vi phạm hợp đồng compare: cây sắp sai chỗ, tìm không thấy key, sort có thể ném IllegalArgumentException. Lambda có ép {{(int)}} nên biên dịch bình thường; còn giá trị 0 là trường hợp vô hại nhất.`,
    },
  ],
  related: ['collections-006', 'collections-013', 'core-012'],
  tags: ['TreeMap', 'NavigableMap', 'Comparator', 'floorEntry', 'BigDecimal'],
},
{
  id: 'lesson-collections-005',
  track: 'collections',
  order: 5,
  title: 'PriorityQueue (heap) và ArrayDeque: top-K trên luồng dữ liệu và cửa sổ trượt',
  level: 'senior',
  minutes: 30,
  goals: [
    'Mô tả binary heap nằm trong một mảng, vì sao {{offer}}/{{poll}} là O(log n) còn {{peek}} là O(1)',
    'Giải bài top-K trên luồng dữ liệu lớn bằng min-heap kích thước K với O(n log K) thời gian và O(K) bộ nhớ',
    'Chọn {{ArrayDeque}} thay cho {{Stack}}/{{LinkedList}}, và dùng deque đơn điệu cho bài cửa sổ trượt O(n)',
  ],
  body: `### PriorityQueue là binary heap nằm trong một mảng
{{PriorityQueue}} không sắp xếp toàn bộ dữ liệu. Nó chỉ giữ **tính chất heap**: mỗi node nhỏ hơn hoặc bằng hai con của nó (min-heap theo thứ tự tự nhiên hoặc Comparator). Vì vậy phần tử nhỏ nhất luôn ở **gốc**, còn các phần tử khác chỉ "gần đúng" thứ tự.

Cây heap là cây nhị phân **đầy đủ** nên được lưu gọn trong mảng {{Object[] queue}} mà không cần con trỏ: node ở chỉ số {{i}} có con ở {{2i + 1}} và {{2i + 2}}, cha ở {{(i - 1) / 2}}.

~~~text
mảng:  [ 1 | 3 | 2 | 7 | 4 | 5 ]        cây:        1
chỉ số:  0   1   2   3   4   5                    /   \\
                                                 3     2
con của 1 (i=1): i=3 (7), i=4 (4)               / \\   /
                                               7   4 5
~~~

- {{offer(e)}}: đặt {{e}} vào cuối mảng rồi **sift-up**: so với cha, nhỏ hơn thì đổi chỗ, lặp lại. Tối đa chiều cao cây: **O(log n)**.
- {{poll()}}: lấy gốc, đưa phần tử cuối lên gốc rồi **sift-down**: đổi chỗ với con nhỏ hơn cho tới khi đúng vị trí. **O(log n)**.
- {{peek()}}: đọc {{queue[0]}}: **O(1)**.
- {{remove(o)}} / {{contains(o)}}: phải duyệt tuyến tính: **O(n)**.
- {{new PriorityQueue<>(collection)}}: dựng heap từ dưới lên (heapify) trong **O(n)**, nhanh hơn n lần {{offer}}.

Capacity mặc định là 11; khi đầy, mảng tăng gần gấp đôi lúc còn nhỏ (dưới 64) và thêm 50% lúc đã lớn.

### Những điều PriorityQueue KHÔNG làm
- **Iterator và toString không theo thứ tự ưu tiên**: in một PriorityQueue ra là in mảng heap. Muốn lấy theo thứ tự thì {{poll}} lần lượt.
- **Không ổn định**: hai phần tử bằng nhau ra theo thứ tự bất kỳ. Cần FIFO khi bằng nhau thì thêm số thứ tự vào Comparator.
- **Không tự sắp lại khi phần tử thay đổi**: sửa field làm thay đổi độ ưu tiên của một phần tử đang nằm trong heap sẽ phá tính chất heap. Phải {{remove}} rồi {{offer}} lại.
- Không cho {{null}}, không thread-safe. Bản đồng thời là {{PriorityBlockingQueue}}, nhưng nó **không giới hạn kích thước**: producer nhanh hơn consumer thì heap phình đến OutOfMemoryError.
- Muốn max-heap: {{new PriorityQueue<>(Comparator.reverseOrder())}}.

### Top-K trên luồng dữ liệu: min-heap kích thước K
Cần 100 giao dịch lớn nhất trong 100 triệu giao dịch đọc dần từ Kafka hay file? Sắp xếp tất cả tốn O(n log n) và phải giữ cả n phần tử trong RAM. Mẹo là giữ một **min-heap chỉ K phần tử**: gốc là giao dịch **nhỏ nhất trong top hiện tại**, tức "ngưỡng vào top".

~~~java
PriorityQueue<Long> heap = new PriorityQueue<>();   // min-heap: gốc = nhỏ nhất trong top-K
for (long amount : stream) {
    if (heap.size() < k) heap.offer(amount);
    else if (amount > heap.peek()) {               // lớn hơn ngưỡng: thay chỗ phần tử nhỏ nhất
        heap.poll();
        heap.offer(amount);
    }                                               // nhỏ hơn ngưỡng: bỏ qua trong O(1)
}
~~~

Vì sao dùng **min**-heap cho bài tìm phần tử **lớn** nhất? Vì ta cần loại nhanh phần tử yếu nhất trong top, và nó nằm ngay ở gốc. Thời gian O(n log K), bộ nhớ O(K). Với K = 100, log K ≈ 7, gần như tuyến tính.

### ArrayDeque: mảng vòng cho cả stack lẫn queue
{{ArrayDeque}} là một mảng vòng với hai chỉ số {{head}} và {{tail}}. Thêm/lấy ở cả hai đầu chỉ là dịch chỉ số theo modulo độ dài mảng, nên **O(1)** (amortized vì thỉnh thoảng mảng phải grow). Nó không cho {{null}} vì dùng null để đánh dấu ô trống.

| Cấu trúc | Làm stack/queue | Vấn đề |
|---|---|---|
| {{Stack}} | {{push}}/{{pop}} | kế thừa {{Vector}}: mọi method {{synchronized}}, lộ cả {{get(i)}}, {{add(i, e)}} phá trừu tượng stack |
| {{LinkedList}} | Deque đầy đủ | mỗi phần tử một node 24 byte, đuổi con trỏ, cache locality kém |
| {{ArrayDeque}} | Deque đầy đủ | nhanh nhất cho đơn luồng; không null, không thread-safe |
| {{ArrayBlockingQueue}} / {{LinkedBlockingDeque}} | producer-consumer | có khoá và chặn khi đầy/rỗng, dùng khi nhiều thread |

Javadoc của ArrayDeque ghi rõ: nhiều khả năng nhanh hơn {{Stack}} khi dùng làm stack và nhanh hơn {{LinkedList}} khi dùng làm queue. Dùng làm stack thì gọi {{push}}/{{pop}}/{{peek}} (thao tác ở đầu); làm queue thì {{offer}}/{{poll}}. Mỗi thao tác có hai biến thể: {{addFirst}}/{{removeFirst}} ném exception khi lỗi, {{offerFirst}}/{{pollFirst}} trả về false/null.

### Cửa sổ trượt với deque đơn điệu
Bài "giá trị lớn nhất trong mỗi cửa sổ k phần tử liên tiếp" (độ trễ cao nhất trong k request gần nhất, giá cao nhất trong k phút): cách ngây thơ là O(n·k). Dùng deque chứa **chỉ số**, giữ các giá trị tương ứng **giảm dần** từ đầu tới cuối:

1. Bỏ ở đầu deque chỉ số đã trượt ra khỏi cửa sổ.
2. Bỏ ở cuối deque mọi chỉ số có giá trị ≤ giá trị mới: chúng không bao giờ còn là max được nữa, vì phần tử mới vừa lớn hơn vừa ở lâu hơn trong cửa sổ.
3. Thêm chỉ số mới vào cuối; đầu deque chính là max của cửa sổ.

Mỗi chỉ số vào deque một lần và ra tối đa một lần, nên tổng cộng **O(n)**.

> Lỗi production hay gặp: dùng {{Stack}} vì "tên dễ hiểu" (trả giá synchronized trên đường nóng), in PriorityQueue ra log rồi tưởng nó đã sắp xếp, dùng PriorityBlockingQueue không giới hạn làm hàng đợi job, và thêm {{null}} vào ArrayDeque gây NPE ở chỗ khó đoán.

### Liên hệ phỏng vấn
Interviewer hay hỏi: heap lưu trong mảng thế nào và độ phức tạp từng thao tác, top-K vì sao dùng min-heap và tốn bao nhiêu bộ nhớ, vì sao {{Stack}} bị khuyên tránh, và bài sliding window maximum. Câu hỏi đào sâu kiểu senior: top-K **phân tán** (mỗi node tính top-K cục bộ rồi gộp các heap lại, vì top-K toàn cục chắc chắn nằm trong hợp của các top-K cục bộ), và khi nào cần heap có hỗ trợ cập nhật độ ưu tiên (Dijkstra) mà PriorityQueue không có.`,
  exercises: [
    {
      title: 'Top-K giao dịch lớn nhất trên luồng dữ liệu',
      prompt: `Viết {{TopKTracker}} nhận lần lượt các giao dịch từ một luồng rất dài và luôn trả lời được "K giao dịch lớn nhất tính đến lúc này":

- Constructor {{TopKTracker(k)}}: {{k <= 0}} thì ném {{IllegalArgumentException}}.
- {{offer(txn)}}: nhận một giao dịch. Chỉ được giữ **tối đa k** giao dịch trong bộ nhớ (test kiểm tra qua {{retained()}}).
- {{top()}}: danh sách tối đa k giao dịch lớn nhất, sắp **giảm dần theo amount**; cùng amount thì {{id}} nhỏ hơn đứng trước (và được ưu tiên giữ lại). Gọi {{top()}} **không** được làm thay đổi trạng thái.
- {{retained()}}: số giao dịch đang giữ.

Mục tiêu O(log k) cho mỗi {{offer}}.`,
      starter: `record Txn(String id, long amount) {}

class TopKTracker {
    private final int k;

    TopKTracker(int k) {
        this.k = k;
    }

    void offer(Txn t) {
        throw new UnsupportedOperationException("TODO");
    }

    List<Txn> top() {
        throw new UnsupportedOperationException("TODO");
    }

    int retained() {
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
    static List<String> ids(List<Txn> l) {
        List<String> r = new ArrayList<>();
        for (Txn t : l) r.add(t.id());
        return r;
    }
    public static void main(String[] args) {
        check("top 3 of 8", () -> {
            TopKTracker t = new TopKTracker(3);
            long[] a = { 50, 900, 20, 700, 300, 1000, 10, 650 };
            for (int i = 0; i < a.length; i++) t.offer(new Txn("T" + i, a[i]));
            eq(List.of("T5", "T1", "T3"), ids(t.top()));
            eq(3, t.retained());
        });
        check("fewer than k items", () -> {
            TopKTracker t = new TopKTracker(5);
            eq(List.of(), t.top());
            t.offer(new Txn("a", 1)); t.offer(new Txn("b", 3));
            eq(List.of("b", "a"), ids(t.top()));
        });
        check("ties: smaller id wins and comes first", () -> {
            TopKTracker t = new TopKTracker(2);
            t.offer(new Txn("C", 100)); t.offer(new Txn("B", 100)); t.offer(new Txn("D", 100)); t.offer(new Txn("A", 100));
            eq(List.of("A", "B"), ids(t.top()));
        });
        check("k = 1 and negative amounts", () -> {
            TopKTracker t = new TopKTracker(1);
            t.offer(new Txn("r1", -500)); t.offer(new Txn("r2", -20)); t.offer(new Txn("r3", -300));
            eq(List.of("r2"), ids(t.top()));
        });
        check("top() does not consume", () -> {
            TopKTracker t = new TopKTracker(2);
            t.offer(new Txn("x", 5)); t.offer(new Txn("y", 9));
            eq(t.top(), t.top());
            t.offer(new Txn("z", 7));
            eq(List.of("y", "z"), ids(t.top()));
        });
        check("invalid k", () -> {
            try { new TopKTracker(0); } catch (IllegalArgumentException e) { return; }
            throw new AssertionError("k = 0 phải ném IllegalArgumentException");
        });
        check("200000-item stream matches full sort, memory bounded", () -> {
            Random rnd = new Random(42);
            TopKTracker t = new TopKTracker(100);
            List<Txn> all = new ArrayList<>();
            for (int i = 0; i < 200_000; i++) {
                Txn x = new Txn(String.format("TX%06d", i), rnd.nextInt(5_000_000));
                all.add(x); t.offer(x);
                if (t.retained() > 100) throw new AssertionError("giữ " + t.retained() + " > k phần tử");
            }
            all.sort(Comparator.comparingLong(Txn::amount).reversed().thenComparing(Txn::id));
            eq(all.subList(0, 100), t.top());
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Txn(String id, long amount) {}

class TopKTracker {
    // "tốt hơn" = amount lớn hơn, cùng amount thì id nhỏ hơn
    private static final Comparator<Txn> BEST_FIRST =
            Comparator.comparingLong(Txn::amount).reversed().thenComparing(Txn::id);

    private final int k;
    private final PriorityQueue<Txn> heap;   // gốc = giao dịch KÉM nhất trong top hiện tại

    TopKTracker(int k) {
        if (k <= 0) throw new IllegalArgumentException("k must be > 0");
        this.k = k;
        this.heap = new PriorityQueue<>(k, BEST_FIRST.reversed());   // min-heap theo "độ tốt"
    }

    void offer(Txn t) {
        if (heap.size() < k) {
            heap.offer(t);
        } else if (BEST_FIRST.compare(t, heap.peek()) < 0) {        // t tốt hơn phần tử kém nhất
            heap.poll();                                             // O(log k)
            heap.offer(t);                                           // O(log k)
        }
    }

    List<Txn> top() {
        List<Txn> result = new ArrayList<>(heap);   // copy: không đụng vào heap
        result.sort(BEST_FIRST);                    // O(k log k), iterator của heap không có thứ tự
        return result;
    }

    int retained() {
        return heap.size();
    }
}`,
      hints: [
        'Dùng một {{PriorityQueue<Txn>}} mà gốc là giao dịch **kém nhất** trong top: so sánh theo amount tăng dần, cùng amount thì id **giảm dần**.',
        'Khi heap đã đủ k: chỉ khi giao dịch mới tốt hơn {{heap.peek()}} mới {{poll}} rồi {{offer}}.',
        '{{top()}}: copy heap sang một ArrayList rồi sort; đừng {{poll}} trên heap thật, và đừng tin thứ tự của iterator.',
      ],
      explain: `Heap giữ đúng k phần tử, gốc là "ngưỡng vào top". Giao dịch mới kém hơn ngưỡng bị loại trong O(1) chỉ bằng một lần {{peek}}; tốt hơn thì thay chỗ ngưỡng trong O(log k). Tổng O(n log k) thời gian và O(k) bộ nhớ, nên chạy được trên luồng vô hạn.

Định nghĩa thứ tự **một lần** ({{BEST_FIRST}}) rồi đảo ngược cho heap giúp hai nơi (heap và kết quả) không bao giờ lệch nhau, kể cả quy tắc phá hoà theo id.

Lỗi hay gặp:
- Dùng max-heap chứa mọi phần tử rồi poll k lần: đúng nhưng O(n) bộ nhớ, test {{retained()}} sẽ bắt.
- Trả về {{new ArrayList<>(heap)}} mà không sort: iterator của PriorityQueue duyệt theo mảng heap, không theo thứ tự.
- Cài {{top()}} bằng cách poll hết heap: lần gọi thứ hai trả về rỗng.
- Quên phá hoà: với các amount bằng nhau, phần tử nào được giữ lại sẽ phụ thuộc thứ tự đến, kết quả không xác định.`,
    },
    {
      title: 'Giá trị lớn nhất trong cửa sổ trượt bằng ArrayDeque',
      prompt: `Hệ thống giám sát cần **độ trễ cao nhất trong mỗi k request liên tiếp**. Viết {{Windows.maxInWindows(int[] values, int k)}} trả về mảng gồm {{values.length - k + 1}} giá trị, phần tử thứ i là max của {{values[i]}} .. {{values[i + k - 1]}}.

- {{k <= 0}}: ném {{IllegalArgumentException}}.
- {{values.length < k}} (kể cả mảng rỗng): trả về mảng rỗng.
- Yêu cầu **O(n)** bằng một {{ArrayDeque<Integer>}} chứa chỉ số (deque đơn điệu), không dùng cách duyệt lại k phần tử cho mỗi cửa sổ.

Ví dụ: {{[1, 3, -1, -3, 5, 3, 6, 7]}}, k = 3 → {{[3, 3, 5, 5, 6, 7]}}.`,
      starter: `class Windows {
    static int[] maxInWindows(int[] values, int k) {
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
    static void eqArr(int[] expected, int[] actual) {
        if (!Arrays.equals(expected, actual)) throw new AssertionError("expected " + Arrays.toString(expected) + " got " + Arrays.toString(actual));
    }
    static int[] brute(int[] v, int k) {
        if (v.length < k) return new int[0];
        int[] r = new int[v.length - k + 1];
        for (int i = 0; i + k <= v.length; i++) {
            int m = Integer.MIN_VALUE;
            for (int j = i; j < i + k; j++) m = Math.max(m, v[j]);
            r[i] = m;
        }
        return r;
    }
    public static void main(String[] args) {
        check("classic example", () -> eqArr(new int[] { 3, 3, 5, 5, 6, 7 }, Windows.maxInWindows(new int[] { 1, 3, -1, -3, 5, 3, 6, 7 }, 3)));
        check("k = 1 returns the input", () -> eqArr(new int[] { 4, -2, 9 }, Windows.maxInWindows(new int[] { 4, -2, 9 }, 1)));
        check("k = n returns one max", () -> eqArr(new int[] { 9 }, Windows.maxInWindows(new int[] { 4, 9, -2, 8 }, 4)));
        check("shorter than k or empty", () -> {
            eqArr(new int[0], Windows.maxInWindows(new int[] { 1, 2 }, 3));
            eqArr(new int[0], Windows.maxInWindows(new int[0], 1));
        });
        check("k <= 0 throws", () -> {
            try { Windows.maxInWindows(new int[] { 1 }, 0); } catch (IllegalArgumentException e) { return; }
            throw new AssertionError("k = 0 phải ném IllegalArgumentException");
        });
        check("duplicates, increasing and decreasing runs", () -> {
            eqArr(new int[] { 4, 4, 4, 4 }, Windows.maxInWindows(new int[] { 4, 4, 4, 2, 4 }, 2));
            eqArr(new int[] { 3, 4, 5 }, Windows.maxInWindows(new int[] { 1, 2, 3, 4, 5 }, 3));
            eqArr(new int[] { 5, 4, 3 }, Windows.maxInWindows(new int[] { 5, 4, 3, 2, 1 }, 3));
            eqArr(new int[] { Integer.MIN_VALUE, Integer.MAX_VALUE }, Windows.maxInWindows(new int[] { Integer.MIN_VALUE, Integer.MIN_VALUE, Integer.MAX_VALUE }, 2));
        });
        check("random arrays match brute force", () -> {
            Random rnd = new Random(7);
            for (int t = 0; t < 300; t++) {
                int n = rnd.nextInt(60), k = 1 + rnd.nextInt(10);
                int[] v = new int[n];
                for (int i = 0; i < n; i++) v[i] = rnd.nextInt(41) - 20;
                eqArr(brute(v, k), Windows.maxInWindows(v, k));
            }
        });
        check("large input", () -> {
            Random rnd = new Random(11);
            int[] v = new int[300_000];
            for (int i = 0; i < v.length; i++) v[i] = rnd.nextInt(1_000_000);
            eqArr(brute(v, 50), Windows.maxInWindows(v, 50));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Windows {
    static int[] maxInWindows(int[] values, int k) {
        if (k <= 0) throw new IllegalArgumentException("k must be > 0");
        int n = values.length;
        if (n < k) return new int[0];
        int[] result = new int[n - k + 1];
        Deque<Integer> dq = new ArrayDeque<>();      // chỉ số, giá trị giảm dần từ đầu tới cuối
        for (int i = 0; i < n; i++) {
            if (!dq.isEmpty() && dq.peekFirst() <= i - k) dq.pollFirst();       // trượt ra khỏi cửa sổ
            while (!dq.isEmpty() && values[dq.peekLast()] <= values[i]) dq.pollLast();  // không bao giờ còn là max
            dq.offerLast(i);
            if (i >= k - 1) result[i - k + 1] = values[dq.peekFirst()];         // đầu deque = max
        }
        return result;
    }
}`,
      hints: [
        'Deque lưu **chỉ số** chứ không lưu giá trị, để biết phần tử nào đã trượt ra khỏi cửa sổ (chỉ số ≤ i - k).',
        'Trước khi thêm i: bỏ ở cuối mọi chỉ số có giá trị ≤ {{values[i]}}. Như vậy giá trị trong deque luôn giảm dần và đầu deque là max.',
        'Bắt đầu ghi kết quả khi {{i >= k - 1}}, vào ô {{i - k + 1}}.',
      ],
      explain: `Tại sao bỏ được phần tử ở cuối deque khi gặp giá trị lớn hơn hoặc bằng? Vì phần tử mới vừa **lớn hơn hoặc bằng**, vừa **rời cửa sổ muộn hơn**, nên trong mọi cửa sổ tương lai chứa phần tử cũ thì phần tử mới cũng có mặt và không nhỏ hơn. Phần tử cũ không bao giờ là đáp án duy nhất nữa. Mỗi chỉ số vào deque một lần và ra tối đa một lần, nên tổng là O(n) dù có vòng while lồng bên trong.

Lỗi hay gặp:
- Lưu giá trị thay vì chỉ số: không biết khi nào phần tử hết hạn, nhất là khi có giá trị trùng.
- Dùng {{PriorityQueue}}: cũng ra kết quả nhưng xoá phần tử hết hạn là {{remove(o)}} O(k), tổng O(n·k); hoặc phải xoá lười (lazy deletion) rồi O(n log n).
- Dùng {{Stack}}/{{LinkedList}}: đúng nhưng chậm hơn {{ArrayDeque}}. Lưu ý {{Deque<Integer>}} so sánh {{dq.peekFirst() <= i - k}} là unboxing nên an toàn; nhưng so hai {{Integer}} bằng {{==}} thì sai ngoài vùng cache -128..127.`,
    },
  ],
  check: [
    {
      q: 'Bạn {{offer}} lần lượt 5, 1, 4, 2 vào một {{PriorityQueue<Integer>}} rồi {{System.out.println(pq)}}. Điều nào đúng?',
      options: ['Luôn in [1, 2, 4, 5]', 'In theo thứ tự mảng heap bên trong, ví dụ [1, 2, 4, 5] hoặc không theo thứ tự tăng dần; chỉ phần tử đầu chắc chắn là nhỏ nhất', 'In theo thứ tự thêm vào [5, 1, 4, 2]', 'Ném UnsupportedOperationException vì PriorityQueue không hỗ trợ toString'],
      answer: 1,
      explain: `{{toString}} dùng iterator, mà iterator duyệt mảng heap theo chỉ số. Mảng heap chỉ đảm bảo {{queue[0]}} là nhỏ nhất; các vị trí khác chỉ thoả tính chất heap. Ở ví dụ này kết quả là [1, 2, 4, 5] một cách tình cờ (với 5, 1, 4, 2, 3 thì ra [1, 2, 4, 5, 3]). Nó không giữ thứ tự thêm vào, và toString hoạt động bình thường. Muốn có thứ tự thì poll lần lượt.`,
    },
    {
      q: 'Tìm 100 giao dịch lớn nhất trong 100 triệu giao dịch đọc dần từ luồng. Cách nào tối ưu và độ phức tạp là gì?',
      options: ['Max-heap chứa tất cả rồi poll 100 lần: O(n) bộ nhớ', 'Sort toàn bộ: O(n log n) thời gian, O(n) bộ nhớ', 'Min-heap giữ 100 phần tử: O(n log K) thời gian, O(K) bộ nhớ', 'TreeSet chứa tất cả: O(n log n)'],
      answer: 2,
      explain: `Min-heap kích thước K có gốc là ngưỡng vào top: phần tử nhỏ hơn bị loại sau một lần peek, lớn hơn thì thay gốc trong O(log K). Bộ nhớ chỉ K phần tử nên chạy được trên luồng. Ba cách còn lại đều phải giữ cả 100 triệu phần tử trong RAM; sort và TreeSet còn tốn O(n log n), và TreeSet với comparator chỉ theo amount còn làm mất các giao dịch bằng tiền.`,
    },
    {
      q: 'Vì sao khuyên dùng {{ArrayDeque}} thay cho {{Stack}} làm stack?',
      options: ['Stack không có method pop', 'Stack kế thừa Vector: mọi method synchronized gây tốn kém không cần thiết, và lộ các method truy cập theo chỉ số phá trừu tượng stack', 'ArrayDeque thread-safe còn Stack thì không', 'ArrayDeque cho phép phần tử null còn Stack thì không'],
      answer: 1,
      explain: `{{Stack extends Vector}} nên mỗi push/pop đều lấy khoá, và cho phép {{get(i)}}, {{add(i, e)}}, {{remove(i)}} trên "stack". ArrayDeque là mảng vòng không khoá, nhanh hơn. Ngược lại với các phương án sai: Stack có pop; ArrayDeque **không** thread-safe; và ArrayDeque **cấm** null (Stack thì cho phép).`,
    },
  ],
  related: ['collections-009', 'collections-010', 'collections-007'],
  tags: ['PriorityQueue', 'heap', 'top-K', 'ArrayDeque', 'sliding window'],
}
);
