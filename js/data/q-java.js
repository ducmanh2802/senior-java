/* Topics: core, collections, modern — owner: task T1. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'core-001',
  topic: 'core',
  level: 'mid',
  q: 'Contract giữa {{equals()}} và {{hashCode()}} là gì? Vi phạm thì chuyện gì xảy ra?',
  a: `**Tóm tắt:** hai object {{equals()}} bằng nhau thì **bắt buộc** có cùng {{hashCode()}}; ngược lại không bắt buộc (cho phép collision).

### Contract
- **Reflexive / symmetric / transitive / consistent**, và {{x.equals(null) == false}}.
- {{a.equals(b)}} ⇒ {{a.hashCode() == b.hashCode()}}.
- {{hashCode()}} phải ổn định khi các field tham gia {{equals}} không đổi.

### Vi phạm thì sao
- Override {{equals}} mà quên {{hashCode}}: {{HashMap}}/{{HashSet}} đặt hai object "bằng nhau" vào hai bucket khác nhau ⇒ {{contains()}} trả về {{false}}, set chứa phần tử trùng.
- Dùng **mutable field** làm key rồi sửa sau khi {{put}} ⇒ key "mất tích" trong map, gây memory leak.

~~~java
record Point(int x, int y) {}          // record tự sinh equals/hashCode đúng contract

@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof User u)) return false;
    return id.equals(u.id);
}
@Override public int hashCode() { return Objects.hash(id); }
~~~

> Senior tip: với JPA entity, đừng dùng id tự sinh trong {{hashCode}} (null trước khi persist) — dùng business key hoặc trả về hằng số theo class.`,
  follow: [
    'Vì sao {{hashCode}} trả về hằng số vẫn đúng contract nhưng là ý tưởng tồi?',
    'Implement {{equals}} cho class có kế thừa thế nào để không phá tính đối xứng?'
  ],
  tags: ['equals', 'hashCode', 'HashMap']
},
{
  id: 'core-002',
  topic: 'core',
  level: 'mid',
  q: 'Vì sao {{String}} là immutable và final? String pool hoạt động thế nào, {{intern()}} dùng khi nào?',
  a: `**Tóm tắt:** {{String}} bất biến vì an toàn (thread, bảo mật, làm key), còn pool là vùng nhớ chia sẻ các literal giống nhau để tiết kiệm heap; {{intern()}} đưa chuỗi runtime về pool và trả về instance chuẩn.

### Bên trong String
- Class khai báo {{public final class String}}, nên không thể kế thừa để phá tính bất biến.
- Từ Java 9, dữ liệu nằm trong {{private final byte[] value}} kèm {{byte coder}} (Compact Strings): chuỗi Latin-1 dùng 1 byte/ký tự, chuỗi có ký tự ngoài Latin-1 dùng UTF-16. Trước Java 9 là {{char[]}}.
- Mọi "thay đổi" như {{concat}}, {{substring}}, {{replace}} đều tạo object mới. Không có setter, không expose mảng bên trong.

### Vì sao phải bất biến
- **Thread-safe miễn phí**: nhiều thread đọc cùng object mà không cần lock, vì trạng thái không đổi.
- **An toàn khi làm key**: {{hashCode}} được cache trong field {{hash}} (tính lần đầu), nếu chuỗi đổi thì entry trong {{HashMap}} sẽ mất tích.
- **Bảo mật**: đường dẫn file, URL, tên class, câu SQL được truyền vào API nhạy cảm; nếu bên nhận giữ tham chiếu mà nội dung bị sửa sau khi kiểm tra (TOCTOU) thì lỗ hổng xuất hiện.
- **Chia sẻ và tối ưu**: pool, substring cũ không còn chia sẻ mảng (từ Java 7u6 đổi để tránh leak), JIT tối ưu tốt hơn.

### String pool
- Literal {{"hello"}} được resolve lúc load class và đưa vào **string pool** (từ Java 7 nằm trên heap, không phải PermGen).
- {{new String("hello")}} tạo object mới trên heap; literal bên trong vẫn lấy từ pool.
- {{==}} so sánh reference, {{equals}} so sánh nội dung.
- {{intern()}} tra pool: nếu có chuỗi bằng nội dung thì trả về instance trong pool, nếu chưa có thì thêm vào và trả về chính nó. Từ Java 7, chuỗi không còn trong pool cũng có thể được thu gom khi không còn ai tham chiếu.

~~~java
String a = "hello";                  // pool
String b = new String("hello");      // heap, khác reference
System.out.println(a == b);          // false
System.out.println(a == b.intern()); // true
String c = ("hel" + "lo");           // compile-time constant => pool
System.out.println(a == c);          // true
~~~

### Pitfall production
- Cộng chuỗi trong vòng lặp bằng {{+}} tạo hàng nghìn object trung gian; dùng {{StringBuilder}} cho vòng lặp, {{String.join}} cho tập hợp.
- Nối chuỗi trong {{toString()}} của entity trong log nóng cũng tạo rác; cân nhắc log theo tham số.
- {{intern()}} trên dữ liệu không lặp lại (ví dụ mỗi request một UUID) làm pool phình to; chỉ dùng khi biết chắc tập giá trị nhỏ và lặp nhiều.

> Senior tip: với service nhiều chuỗi trùng, bật {{-XX:+UseStringDeduplication}} (G1) và theo dõi {{-XX:+PrintStringTableStatistics}}; đừng gọi {{intern()}} tràn lan vì nó chạm một bảng có lock nội bộ.`,
  follow: [
    'Vì sao cộng chuỗi bằng {{+}} trong vòng lặp lại chậm hơn {{StringBuilder}}?',
    'Nếu {{String}} cho phép kế thừa thì những bất biến nào bị phá?',
    '{{substring()}} từ Java 7 trở đi có còn giữ mảng gốc không, vì sao thay đổi đó quan trọng?'
  ],
  tags: ['String', 'immutability', 'String pool', 'intern']
},
{
  id: 'core-003',
  topic: 'core',
  level: 'mid',
  q: 'Java luôn pass-by-value — giải thích điều này khi truyền một object reference vào method.',
  a: `**Tóm tắt:** Java copy **giá trị của tham số** khi gọi method. Với object, giá trị được copy là **reference**, nên method sửa được nội dung object nhưng không thể đổi reference của biến phía caller.

### Chuyện gì xảy ra trên stack
- Mỗi lời gọi method tạo frame mới; tham số là biến local trong frame đó.
- Với primitive, bản copy là giá trị số. Sửa trong method không ảnh hưởng caller.
- Với object, biến ở caller và biến tham số là **hai biến khác nhau** cùng trỏ tới một object trên heap. Vì vậy:
  - Gọi method trên object ({{list.add}}, {{sb.append}}) thì caller thấy thay đổi.
  - Gán lại tham số ({{param = other}}) chỉ đổi biến local, caller vẫn trỏ object cũ.

~~~java
static void reassign(StringBuilder sb) {
    sb = new StringBuilder("moi");     // chỉ đổi biến local
}
static void mutate(StringBuilder sb) {
    sb.append(" them");                // sửa object dùng chung
}

StringBuilder x = new StringBuilder("goc");
reassign(x);
System.out.println(x);                 // goc
mutate(x);
System.out.println(x);                 // goc them
~~~

### Hệ quả khi phỏng vấn
- Không có "pass-by-reference" kiểu C++ trong Java. Không thể viết {{swap(a, b)}} đổi được biến của caller.
- Muốn trả nhiều giá trị: trả object/record, dùng mảng một phần tử, hoặc {{AtomicReference}} (nhưng thường record là rõ ràng nhất).
- Truyền mảng cũng là truyền reference: method sửa phần tử thì caller thấy, gán mảng mới thì không.
- Khi API nhận collection/array/ngày tháng mutable, hãy **defensive copy** ở biên nếu muốn giữ bất biến; nếu không, caller có thể sửa dữ liệu sau khi bạn validate.

### Liên hệ với immutability
- Vì reference được copy chứ không phải object, việc "truyền object vào method" không tạo bản sao. Đây là lý do các class như {{String}}, {{LocalDate}}, record nên bất biến: chia sẻ an toàn mà không cần copy.
- Ngược lại, chia sẻ {{Date}}, {{ArrayList}} giữa các tầng dễ sinh bug "dữ liệu tự đổi" rất khó truy.

> Senior tip: khi review code, thấy method public nhận {{List}} rồi lưu thẳng vào field là dấu hiệu cần {{List.copyOf}}; còn thấy {{param = ...}} trong method thì gần như chắc chắn là bug do hiểu sai pass-by-value.`,
  follow: [
    'Viết method {{swap}} cho hai {{Integer}} — vì sao không thể?',
    'Truyền {{List}} vào method rồi {{list = new ArrayList<>()}} có ảnh hưởng caller không?',
    'Defensive copy nên đặt ở constructor hay getter, hay cả hai?'
  ],
  tags: ['pass-by-value', 'reference', 'method']
},
{
  id: 'core-004',
  topic: 'core',
  level: 'senior',
  q: 'Thiết kế exception hierarchy cho một service Spring thế nào? Checked hay unchecked, khi nào wrap, và làm sao tránh nuốt lỗi?',
  a: `**Tóm tắt:** dùng một base **unchecked** {{BusinessException}} mang {{errorCode}} cho lỗi nghiệp vụ, để nguyên các RuntimeException của framework, wrap lỗi hạ tầng kèm {{cause}}, và map ra HTTP ở một chỗ duy nhất ({{@RestControllerAdvice}}).

### Checked vs unchecked
- **Checked** (extends {{Exception}}): compiler bắt handle. Phù hợp với điều kiện **có thể phục hồi** mà caller bắt buộc phải quyết định, ví dụ {{IOException}} khi đọc file, {{InterruptedException}}. Nhược điểm: làm bẩn signature, khó dùng trong lambda/stream, dễ sinh {{catch (Exception e)}} rỗng.
- **Unchecked** (extends {{RuntimeException}}): lỗi lập trình hoặc lỗi nghiệp vụ không phục hồi tại chỗ. Đa số service hiện đại chọn unchecked để giữ API sạch; lỗi được xử lý tập trung ở tầng web.
- **Error** ({{OutOfMemoryError}}, {{StackOverflowError}}): không bắt, không khai báo; JVM ở trạng thái không đáng tin.

### Một hierarchy gợi ý
~~~java
public class BusinessException extends RuntimeException {
    private final String code;                 // "ORDER_NOT_FOUND"
    public BusinessException(String code, String msg, Throwable cause) {
        super(msg, cause);                     // luôn giữ cause
        this.code = code;
    }
    public String getCode() { return code; }
}

public class NotFoundException extends BusinessException {
    public NotFoundException(String code, String msg) { super(code, msg, null); }
}
~~~

- Tầng domain ném {{NotFoundException("ORDER_NOT_FOUND", ...)}}; tầng web map code sang 404, 409, 422.
- Không để lộ stack trace hay tên bảng/DB ra response; log đầy đủ ở server, trả message an toàn cho client.
- Lỗi validation nên gom nhiều field (danh sách lỗi), không ném từng cái.

### Khi nào wrap
- Wrap khi thêm **ngữ cảnh nghiệp vụ** hoặc đổi loại lỗi cho tầng trên: bắt {{SQLException}} rồi {{throw new RepositoryException(msg, e)}} để giữ cause và thêm ngữ cảnh.
- Không wrap nếu không thêm thông tin — chỉ làm stack dài và khó đọc.
- Luôn truyền {{cause}}; đừng {{throw new RuntimeException(e.getMessage())}} vì mất stack gốc.
- Tránh **log rồi ném lại**: một lỗi bị log ở 3 tầng gây nhiễu và tăng chi phí. Chọn một nơi log (advice hoặc consumer boundary).

### Nuốt lỗi và try-with-resources
- {{catch (Exception e)}} rồi không làm gì là anti-pattern; tối thiểu phải log kèm context và quyết định rõ (bỏ qua, retry, fallback).
- {{finally}} dùng để cleanup; với tài nguyên implements {{AutoCloseable}} hãy dùng try-with-resources để exception khi close được gắn vào {{getSuppressed()}} thay vì che lỗi chính.
- Trong async/CompletableFuture, lỗi nằm trong future; phải {{exceptionally}}/{{handle}} hoặc log ở {{whenComplete}}, nếu không sẽ biến mất im lặng.

> Senior tip: đặt {{errorCode}} ổn định trong enum/constant và đừng đổi nghĩa của code cũ; client/monitoring thường parse code này. Với lỗi 5xx, log kèm correlation id và đừng log toàn bộ payload nếu có dữ liệu cá nhân.`,
  follow: [
    'Vì sao lỗi {{InterruptedException}} phải gọi {{Thread.currentThread().interrupt()}} khi bắt?',
    '{{@Transactional}} rollback mặc định với checked và unchecked khác nhau thế nào?',
    'Làm sao giữ {{cause}} mà không lộ thông tin nội bộ ra response?'
  ],
  tags: ['exception', 'checked', 'RuntimeException', 'error handling'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-005',
  topic: 'core',
  level: 'senior',
  q: 'Phân biệt {{final}}, {{finally}}, {{finalize}}. Vì sao {{finalize}} bị deprecate và {{Cleaner}}/try-with-resources thay thế ra sao?',
  a: `**Tóm tắt:** {{final}} là modifier (không đổi tham chiếu/không override/không kế thừa), {{finally}} là block luôn chạy khi thoát try, còn {{finalize}} là hook GC đã bị deprecate vì không đảm bảo thời điểm, chạy chậm và nguy hiểm; thay bằng try-with-resources hoặc {{Cleaner}}.

### final
- **Biến/field**: gán một lần, không đổi reference. Với object, nội dung vẫn mutable ({{final List}} vẫn {{add}} được).
- **Method**: không cho override.
- **Class**: không cho kế thừa ({{String}}, {{Integer}}).
- Ý nghĩa quan trọng với **memory model**: field {{final}} được "freeze" sau constructor, nên thread khác đọc thấy giá trị đúng nếu object được publish an toàn. Đây là nền tảng của immutable object.
- {{final}} local dùng được trong lambda/anonymous class (effectively final cũng vậy).

### finally
- Chạy khi try thoát bình thường, khi có exception, khi {{return}}, {{break}}, {{continue}}.
- **Không chạy** khi JVM chết: {{System.exit}}, {{Runtime.halt}}, crash native, kill -9.
- {{return}} trong {{finally}} **che** exception/return trước đó — cực kỳ nguy hiểm, tránh tuyệt đối.

### finalize
- Được gọi bởi GC **trước khi** thu hồi, không đảm bảo thời điểm, có thể không bao giờ gọi, và chạy trên finalizer thread đơn luồng nên dễ nghẽn.
- Có thể **hồi sinh** object bằng cách gán {{this}} vào static field — phá vỡ giả định về vòng đời.
- Không ném được exception hữu ích; exception bị nuốt.
- Từ Java 18, finalization **deprecated for removal** (JEP 421) và có thể tắt bằng {{--finalization=disabled}}; từ Java 9 đã có {{Cleaner}} chính thức.
- Vì sao vẫn còn: tương thích ngược với code cũ và một số thư viện native.

### Thay thế
- **try-with-resources**: cách chuẩn cho mọi tài nguyên {{AutoCloseable}} (file, socket, JDBC). Close theo thứ tự ngược, exception khi close vào {{getSuppressed()}}.
- **Cleaner** ({{java.lang.ref.Cleaner}}): đăng ký một action chạy khi object bị phantom-reachable; dùng cho tài nguyên native không có API close, nhưng vẫn **không đảm bảo** thời điểm — chỉ là lưới an toàn.
- Với {{ByteBuffer}} trực tiếp, dùng {{Cleaner}} nội bộ của JDK hoặc cố gắng tái sử dụng buffer.

~~~java
try (var in = Files.newInputStream(path);
     var out = Files.newOutputStream(dest)) {
    in.transferTo(out);                  // close tự động, kể cả khi lỗi
}
~~~

> Senior tip: đừng bao giờ đặt logic nghiệp vụ quan trọng trong {{finalize}}. Nếu thấy {{finalize}} trong codebase cũ, hãy thay bằng {{AutoCloseable}} + try-with-resources trước, chỉ giữ {{Cleaner}} cho native resource.`,
  follow: [
    'Vì sao {{return}} trong {{finally}} có thể nuốt exception?',
    '{{final}} field giúp gì cho việc publish object an toàn giữa các thread?',
    '{{Cleaner}} khác {{finalize}} ở điểm nào và vẫn còn hạn chế gì?'
  ],
  tags: ['final', 'finally', 'finalize', 'Cleaner', 'try-with-resources'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-006',
  topic: 'core',
  level: 'senior',
  q: 'Generics bị type erasure ảnh hưởng thế nào? Giải thích wildcard và quy tắc PECS với {{? extends}} / {{? super}}.',
  a: `**Tóm tắt:** generic chỉ được kiểm tra lúc compile rồi **xoá** (erasure) khỏi bytecode; wildcard dùng để tăng tính linh hoạt, và PECS: **Producer Extends, Consumer Super** — đọc ra thì {{? extends T}}, ghi vào thì {{? super T}}.

### Type erasure
- {{List<String>}} và {{List<Integer>}} cùng là {{List}} trong bytecode; không có {{new T()}}, không {{instanceof T}}, không mảng {{new T[]}}, không overload chỉ khác type parameter.
- Compiler chèn **cast** và **bridge method** để giữ tính đa hình. Ví dụ {{Comparable}} có {{compareTo(Object)}} bridge gọi {{compareTo(MyType)}}.
- Hệ quả: không thể kiểm tra generic runtime; {{List<String>}} bị "heap pollution" nếu nhét sai qua raw type. {{@SafeVarargs}} chỉ là cam kết của lập trình viên.
- Generic type không có mặt trong reflection đầy đủ, nhưng **vẫn còn** trong metadata ({{getGenericSuperclass}}, {{ParameterizedType}}) nếu khai báo ở class/field/method. Jackson lợi dụng điều này qua {{TypeReference}}.

### Tại sao cần wildcard
- Generic là **invariant**: {{List<Integer>}} **không phải** subtype của {{List<Number>}}, dù {{Integer}} là subtype của {{Number}}. Nếu cho phép, ta có thể {{add(3.14)}} vào list Integer.
- Wildcard mở rộng theo một chiều an toàn:

~~~java
Number sum(List<? extends Number> src) {   // producer: đọc được Number
    double s = 0;
    for (Number n : src) s += n.doubleValue();
    return s;
}
void addInts(List<? super Integer> dst) {  // consumer: ghi được Integer
    dst.add(1);
}
~~~

- {{? extends T}}: chỉ đọc ra {{T}}, **không** ghi (trừ {{null}}) vì compiler không biết subtype cụ thể.
- {{? super T}}: ghi được {{T}}, đọc ra chỉ {{Object}}.
- {{?}} = {{? extends Object}}, đọc được Object, không ghi.

### PECS áp dụng
- {{Collections.copy(List<? super T> dest, List<? extends T> src)}} là ví dụ kinh điển.
- API nhận collection chỉ để đọc: dùng {{Collection<? extends T>}} để nhận cả {{List<Sub>}}.
- API chỉ ghi: {{Consumer<? super T>}}.
- Trả về thì dùng type cụ thể, không dùng wildcard (trừ khi che giấu implementation).
- {{Comparable<? super T>}} cho phép so sánh với supertype.

### Pitfall
- Raw type ({{List}} không tham số) tắt kiểm tra compile, sinh warning và có thể nổ {{ClassCastException}} ở chỗ khác.
- Không thể tạo mảng generic: {{new List<String>[10]}} sai; dùng {{List<List<String>>}} hoặc {{Array.newInstance}} + cast có kiểm soát.
- {{List<Object>}} không nhận {{List<String>}}; {{List<?>}} thì nhận nhưng không add được.

> Senior tip: khi thiết kế API thư viện, dùng wildcard ở **input** để người dùng truyền được nhiều loại hơn; đừng lạm dụng wildcard ở return vì làm caller phải xử lý {{?}} vô ích. Và nhớ rằng chi phí generic là 0 runtime — chỉ có bridge method và cast nhỏ.`,
  follow: [
    'Vì sao không thể {{new T[]}} hay {{new List<String>[10]}}?',
    'Bridge method sinh ra để làm gì và ảnh hưởng reflection thế nào?',
    'Khi nào dùng {{List<?>}} thay vì {{List<Object>}}?'
  ],
  tags: ['generics', 'type erasure', 'wildcard', 'PECS'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-007',
  topic: 'core',
  level: 'mid',
  q: 'Thiết kế một immutable class thế nào cho đúng? Defensive copy đặt ở đâu và vì sao?',
  a: `**Tóm tắt:** class {{final}}, mọi field {{private final}}, không setter, **copy** mọi tham số mutable trong constructor và copy lại khi trả ra ngoài; không để {{this}} rò rỉ trong constructor.

### Các bước thiết kế
1. Khai báo {{final class}} (hoặc dùng static factory + constructor private) để không bị subclass phá bất biến.
2. Field {{private final}}; không có method thay đổi trạng thái.
3. Trong constructor, **validate** rồi **defensive copy** mọi tham số mutable ({{Date}}, {{List}}, {{Map}}, mảng).
4. Getter trả về bản copy hoặc view bất biến, không trả reference nội bộ.
5. Cẩn thận với **leaking this**: không gọi method override được, không đăng ký listener, không đưa {{this}} ra ngoài trước khi constructor xong.
6. {{equals}}/{{hashCode}} dựa trên field bất biến; {{toString}} không lộ dữ liệu nhạy cảm.

~~~java
public final class Period {
    private final LocalDate start;      // LocalDate immutable, không cần copy
    private final List<String> tags;    // List mutable, phải copy

    public Period(LocalDate start, List<String> tags) {
        this.start = Objects.requireNonNull(start);
        this.tags = List.copyOf(tags);  // copy + null-hostile + immutable
    }
    public List<String> tags() { return tags; }   // an toàn vì đã bất biến
}
~~~

### Defensive copy ở đâu
- **Constructor**: bắt buộc nếu tham số mutable và bạn muốn giữ bất biến. Nếu không, caller giữ reference và sửa sau khi object tạo xong.
- **Getter**: nếu field vẫn mutable (ví dụ {{Date}}), phải trả {{new Date(value.getTime())}}; nếu đã dùng {{List.copyOf}}/{{Collections.unmodifiableList}} thì không cần copy thêm.
- {{Collections.unmodifiableList}} chỉ là **view**: nếu list gốc bị sửa, view vẫn thay đổi. {{List.copyOf}} tạo bản sao thật và bất biến, an toàn hơn cho giá trị.
- Mảng luôn phải copy vì {{clone()}} của mảng trả bản mới nhưng getter trả thẳng mảng là hở.

### Vì sao đáng làm
- Thread-safe không cần lock; dùng làm key trong map an toàn; dễ cache và chia sẻ.
- Ít bug "dữ liệu tự đổi" khi object đi qua nhiều tầng.
- Record giúp giảm boilerplate nhưng **không tự copy** component mutable; vẫn phải viết compact constructor gọi {{List.copyOf}}.

### Pitfall
- Quên copy trong constructor nhưng copy trong getter: vẫn bị lộ nếu có method nội bộ dùng list gốc — và tốn copy mỗi lần đọc.
- Dùng {{List.of(...)}} với phần tử null sẽ ném NPE; kiểm tra dữ liệu đầu vào trước.
- Class "gần bất biến" có field mutable lộ ra qua getter là nguyên nhân phổ biến của race condition khó tái hiện.

> Senior tip: với DTO/record nhận từ request, hãy copy ngay ở biên (controller/service) để phần còn lại của hệ thống làm việc với dữ liệu bất biến; đừng tin rằng caller không sửa.`,
  follow: [
    '{{Collections.unmodifiableList}} khác {{List.copyOf}} ở điểm nào?',
    'Record có tự bảo vệ khỏi component mutable không?',
    'Leaking {{this}} trong constructor gây ra vấn đề gì với đa hình?'
  ],
  tags: ['immutable', 'defensive copy', 'List.copyOf']
},
{
  id: 'core-008',
  topic: 'core',
  level: 'senior',
  q: 'Phân biệt static nested class và inner class. Vì sao inner class dễ gây memory leak?',
  a: `**Tóm tắt:** static nested class **không** giữ reference tới instance outer; inner (non-static) giữ ngầm {{this$0}} nên object inner sống thì outer cũng sống. Vì vậy mặc định hãy dùng static nested, chỉ dùng inner khi thật sự cần truy cập trạng thái outer.

### Khác biệt cơ bản
- **Static nested**: khai báo {{static class Foo}} trong outer. Không cần instance outer, không có {{this$0}}, dùng như class top-level (chỉ khác phạm vi tên).
- **Inner (non-static)**: mỗi instance gắn với một instance outer; compiler sinh field {{final Outer this$0}} và constructor nhận outer. Có thể gọi trực tiếp field/method của outer.
- **Local class**: khai báo trong method, cũng giữ reference tới outer và capture biến local effectively final.
- **Anonymous class**: như local, giữ outer và biến capture; thường thấy trong listener/callback.

~~~java
public class Service {
    private final Repo repo;

    static class CacheKey {            // không giữ Service
        final String id;
        CacheKey(String id) { this.id = id; }
    }

    class Worker {                     // giữ ngầm Service.this
        void run() { repo.find(); }
    }
}
~~~

### Vì sao leak
- Đăng ký inner listener/callback vào một registry sống lâu (static list, singleton, thread pool, event bus). Registry giữ inner, inner giữ outer, nên **cả object service** không được thu gom dù nghiệp vụ đã xong.
- Trong ứng dụng desktop/Android, inner class giữ Activity/Context là leak kinh điển; trong backend, inner task giữ cả service lớn kèm cache, connection pool reference.
- Anonymous class trong {{ThreadLocal}} hoặc scheduled task cũng giữ outer theo cách tương tự.
- Ngoài ra, inner class làm object outer không thể GC dù chỉ còn callback nhỏ; kích thước thực tế bị giữ có thể rất lớn.

### Cách tránh
- Mặc định {{static}} cho nested class; truyền dependency cần thiết qua constructor thay vì truy cập {{Outer.this}}.
- Với listener, giữ reference và **unregister** trong {{close()}}/{{@PreDestroy}}; hoặc dùng {{WeakReference}} cho callback ngắn hạn.
- Với task định kỳ, dùng static nested + tham số, tránh capture {{this}} ngoài ý muốn.
- Kiểm tra bằng heap dump (Eclipse MAT) tìm {{this$0}} trỏ ngược bất thường.

### Khi nào dùng inner
- Khi object con thực sự là một phần vòng đời của outer và cần truy cập trạng thái private của outer, ví dụ {{Iterator}} của collection ({{ArrayList.Itr}} là inner, truy cập {{elementData}} và {{modCount}}).
- Khi muốn API {{outer.new Inner()}} thể hiện quan hệ chặt. Còn lại, static nested rõ ràng và an toàn hơn.

> Senior tip: trong code review, thấy {{private class X}} không dùng field/method outer là dấu hiệu nên đổi thành {{static}}; điều này cũng giảm 1 reference và giúp serialization gọn hơn.`,
  follow: [
    'Inner class được compiler sinh field gì, và field đó ảnh hưởng serialization thế nào?',
    'Làm sao phát hiện memory leak do inner class bằng heap dump?',
    'Vì sao {{Iterator}} của {{ArrayList}} lại là inner class hợp lý?'
  ],
  tags: ['nested class', 'inner class', 'memory leak', 'this$0'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-009',
  topic: 'core',
  level: 'senior',
  q: 'Java serialization: {{serialVersionUID}} để làm gì, rủi ro bảo mật của deserialization là gì và nên thay bằng gì?',
  a: `**Tóm tắt:** {{serialVersionUID}} là "version" của class để tránh {{InvalidClassException}} khi cấu trúc thay đổi; Java deserialization trên dữ liệu không tin cậy có thể bị **gadget chain dẫn tới RCE**, nên hiện đại ưu tiên JSON/Protobuf/Avro và nếu buộc dùng thì phải có {{ObjectInputFilter}}.

### serialVersionUID
- Nếu không khai báo, JVM tự tính từ signature class (field, method, modifier); chỉ cần thêm một field là giá trị đổi và dữ liệu cũ không đọc được.
- Khai báo tường minh {{private static final long serialVersionUID = 1L;}} để kiểm soát tương thích.
- Đổi version khi thay đổi **không tương thích** (xoá field, đổi type); thêm field mới thường tương thích và field mới nhận giá trị mặc định.
- Serialization mặc định ghi **toàn bộ object graph** theo tên class; đổi package/class name cũng làm hỏng.

### Cách hoạt động
- {{Serializable}} là marker; {{ObjectOutputStream}} ghi metadata + field không {{transient}}; {{readObject}} khôi phục **không gọi constructor** (trừ class cha không Serializable).
- {{transient}} loại field khỏi luồng; {{Externalizable}} cho phép tự kiểm soát hoàn toàn.
- {{writeReplace}}/{{readResolve}} dùng cho singleton/proxy.

### Rủi ro
- Kẻ tấn công gửi byte stream chứa chuỗi class có sẵn trên classpath (Apache Commons Collections, Spring, ROME...) tạo **gadget chain**: mỗi {{readObject}} thực thi code, cuối cùng gọi {{Runtime.exec}}. Không cần lỗi trong code của bạn.
- Deserialization xảy ra **trước** khi bạn validate dữ liệu, nên validate field không cứu được.
- Các lỗ hổng nổi tiếng (CommonsCollections, WebLogic, JBoss) đều đi qua đường này.

### Phòng thủ
- **Không nhận Java serialization qua network/HTTP**, kể cả từ service nội bộ. Dùng JSON (Jackson), Protobuf, Avro, CBOR.
- Nếu bắt buộc (RMI, session cũ), đặt {{ObjectInputFilter}} whitelist class và giới hạn độ sâu/kích thước (JEP 290, {{jdk.serialFilter}}), bật filter theo ngữ cảnh (JEP 415).
- Không dùng {{ObjectInputStream}} trên cookie/session do client kiểm soát; nếu có, ký và mã hoá.
- Với cache phân tán (Redis), đừng dùng Java serialization mặc định; dùng JSON/Protobuf để tránh cả lỗi tương thích lẫn bảo mật.

### Thay thế
- DTO record + Jackson/Protobuf rõ ràng schema, dễ version, an toàn hơn.
- Với session, lưu JSON hoặc dùng token stateless (JWT) thay vì serialize object.
- Với snapshot nội bộ, có thể dùng {{Externalizable}} nhưng vẫn cần kiểm soát nguồn.

> Senior tip: nếu hệ thống cũ còn dùng Java serialization trong Redis/session, hãy coi đó là **nợ bảo mật P1**; đặt filter trước, sau đó migrate sang JSON. Đừng chỉ tăng {{serialVersionUID}} rồi yên tâm — nó không liên quan gì đến an toàn.`,
  follow: [
    'Vì sao deserialization không gọi constructor và điều đó ảnh hưởng bất biến thế nào?',
    '{{ObjectInputFilter}} whitelist nên cấu hình ở đâu trong Spring Boot?',
    'Khi nào {{transient}} là bắt buộc thay vì chỉ để tối ưu?'
  ],
  tags: ['serialization', 'serialVersionUID', 'deserialization', 'security'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-010',
  topic: 'core',
  level: 'senior',
  q: 'Reflection và annotation processing: chi phí ra sao, framework dùng ở đâu, và pitfall nào hay gặp trên production?',
  a: `**Tóm tắt:** reflection cho phép nhìn và gọi class lúc runtime nhưng chậm hơn lời gọi trực tiếp (lookup, kiểm tra access, boxing, khó inline); annotation processing chạy lúc **compile** và sinh code nên gần như không có chi phí runtime. Spring/Hibernate/Jackson dùng reflection, Lombok/MapStruct dùng annotation processing.

### Reflection
- API: {{Class.forName}}, {{getDeclaredFields}}, {{Method.invoke}}, {{Constructor.newInstance}}, {{setAccessible}}.
- Chi phí:
  - **Lookup** tên method/field mỗi lần gọi rất đắt; phải cache {{Method}}/{{Field}}.
  - **Access check** và boxing/unboxing cho tham số kiểu primitive.
  - **Không inline** được qua JIT như lời gọi trực tiếp; từ Java 18 core reflection được viết lại trên {{MethodHandle}} nên nhanh hơn trước, nhưng vẫn không bằng static call.
  - Khởi tạo class, load metadata, có thể tăng thời gian startup.
- {{MethodHandle}}/{{VarHandle}} là lựa chọn nhanh hơn cho hot path; {{LambdaMetafactory}} biến reflective call thành functional interface một lần.
- Reflection phá encapsulation: {{setAccessible(true)}} có thể bị chặn bởi module ({{InaccessibleObjectException}}) từ Java 9/17; cần {{--add-opens}} (thường chỉ để tương thích tạm).

### Framework dùng thế nào
- **Spring**: scan class, đọc annotation, tạo proxy (CGLIB/JDK dynamic proxy), inject field/constructor. Startup chậm nhưng runtime dùng proxy đã sinh.
- **Hibernate**: map entity qua metadata, dùng bytecode enhancement/reflect để đọc field, lazy proxy.
- **Jackson**: đọc getter/constructor/record component để serialize; cache {{BeanDescription}} để giảm chi phí.
- **JUnit/Mockito**: tạo instance, inject mock, verify lời gọi.

### Annotation processing
- Chạy trong {{javac}} qua {{Processor}}; đọc annotation và **sinh source/bytecode** (hoặc báo lỗi compile).
- **Lombok** can thiệp AST bằng internal API của javac, sinh getter/setter/constructor vào bytecode — tiện nhưng dễ vỡ khi JDK đổi và gây tranh cãi với tooling.
- **MapStruct** sinh mapper type-safe lúc compile, runtime nhanh như code tay; **Dagger** sinh DI graph.
- Chi phí runtime = 0; chi phí build tăng; cần cấu hình processor trong Maven/Gradle và đôi khi lỗi khó đọc khi generated code sai.

### Pitfall production
- Gọi {{getMethods()}}/{{getDeclaredFields()}} trong vòng lặp request mà không cache: CPU tăng vọt, GC nhiều.
- Dùng reflection để set field private của JDK: chết khi nâng JDK (strong encapsulation), native image/AOT cũng không hỗ trợ tốt.
- Reflection + {{setAccessible}} làm mất kiểm tra kiểu, lỗi chỉ nổ runtime.
- Startup chậm do scan quá rộng; cân nhắc AOT, CDS, hoặc giới hạn package scan.
- Với GraalVM native image, reflection cần khai báo cấu hình; thư viện dùng reflection động dễ fail.

> Senior tip: cache metadata reflection trong {{ConcurrentHashMap}} hoặc dùng {{MethodHandle}}; đo bằng JMH trước khi tối ưu. Và đừng dùng reflection cho logic nghiệp vụ thường ngày — chỉ dùng ở tầng hạ tầng/framework.`,
  follow: [
    'Vì sao {{Method.invoke}} chậm hơn lời gọi trực tiếp, và {{MethodHandle}} cải thiện gì?',
    'Strong encapsulation từ Java 17 ảnh hưởng thư viện cũ thế nào?',
    'Annotation processing khác runtime annotation ở điểm nào?'
  ],
  tags: ['reflection', 'annotation processing', 'Lombok', 'MethodHandle'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-011',
  topic: 'core',
  level: 'lead',
  q: 'Liệt kê các method của {{Object}}. {{clone()}} có nên dùng không, so với copy constructor thế nào?',
  a: `**Tóm tắt:** {{Object}} cung cấp {{equals}}, {{hashCode}}, {{toString}}, {{getClass}}, {{clone}}, {{finalize}} và bộ {{wait}}/{{notify}}/{{notifyAll}}; {{clone()}} hoạt động qua {{Cloneable}} nhưng nhiều cạm bẫy, nên ưu tiên **copy constructor** hoặc static factory.

### Các method của Object
- {{equals(Object)}}: so sánh tham chiếu mặc định; override theo contract.
- {{hashCode()}}: hash mặc định dựa trên identity; phải đi cùng {{equals}}.
- {{toString()}}: mặc định {{ClassName@hex}}; override để log dễ đọc nhưng che dữ liệu nhạy cảm.
- {{getClass()}}: trả {{Class}} runtime; không override được; dùng cho reflection và so sánh chính xác kiểu.
- {{clone()}}: protected native, tạo bản sao; chỉ hoạt động nếu class implements {{Cloneable}}, nếu không ném {{CloneNotSupportedException}}.
- {{finalize()}}: đã deprecate, không dùng.
- {{wait()}}, {{wait(long)}}, {{wait(long,int)}}, {{notify()}}, {{notifyAll()}}: phối hợp monitor; phải gọi trong {{synchronized}} trên đúng object, nếu không {{IllegalMonitorStateException}}.

### clone() có vấn đề gì
- **Shallow copy**: field object vẫn chia sẻ reference; muốn deep phải tự clone từng field — dễ sai và dễ bỏ sót.
- **Không gọi constructor**: bất biến/validate trong constructor bị bỏ qua; với class có final field rất khó gán.
- **{{Cloneable}} là marker kỳ lạ**: không có method nào; nó chỉ đổi hành vi của {{Object.clone}} từ ném exception sang copy field.
- **Kế thừa**: subclass phải tự override để trả đúng kiểu; dễ trả sai class hoặc làm hỏng contract.
- **Không type-safe**: {{clone()}} trả {{Object}} ở nhiều chỗ, phải cast.
- Với mảng, {{clone()}} an toàn và nhanh (copy nông), nhưng với object phức tạp thì không.

### Copy constructor / factory
- Copy constructor {{User(User other)}} rõ ràng, type-safe, kiểm soát deep copy và giữ được validation; bên trong gán {{this.tags = List.copyOf(other.tags)}}.
- Static factory {{User.copyOf(u)}} tiện cho generic/collection.
- Record có canonical constructor; muốn copy thì {{new User(r.id(), r.tags())}} hoặc compact constructor tự copy.
- Với deep copy phức tạp, dùng mapper (MapStruct) hoặc serialization qua JSON (chậm, chỉ dùng khi cần).

### Khi nào vẫn dùng clone
- Copy mảng primitive/object nông trong hot path: {{int[] copy = arr.clone()}}.
- Code cũ/thư viện bắt buộc; khi đó override {{clone()}} public, gọi {{super.clone()}}, rồi deep copy field mutable, và cân nhắc {{CloneNotSupportedException}}.

> Senior tip: trong codebase mới, đừng implement {{Cloneable}}; dùng copy constructor hoặc record. Nếu buộc phải giữ {{clone()}} cho tương thích, hãy viết unit test khẳng định bản copy **không chia sẻ** collection/mảng với bản gốc — đây là chỗ bug thường ẩn.`,
  follow: [
    'Vì sao {{Cloneable}} được xem là thiết kế tồi trong Effective Java?',
    '{{wait}}/{{notify}} khác gì {{Condition}} của {{ReentrantLock}}?',
    'Làm sao deep copy một object graph có vòng lặp tham chiếu?'
  ],
  tags: ['Object', 'clone', 'copy constructor', 'wait notify']
},
{
  id: 'collections-001',
  topic: 'collections',
  level: 'senior',
  q: 'Giải thích bên trong {{HashMap}}: hash spreading, bucket, resize, load factor và treeify từ Java 8.',
  a: `**Tóm tắt:** {{HashMap}} là mảng các bucket ({{Node[] table}}); index = {{(n-1) & spread(hash)}}; khi số phần tử vượt {{capacity * loadFactor}} thì resize gấp đôi; từ Java 8 bucket dài ≥ 8 được chuyển thành cây đỏ-đen để tránh O(n) khi collision nhiều.

### Cấu trúc
- Mặc định capacity 16, load factor 0.75; bảng **lazy init** ở lần {{put}} đầu tiên (trước đó {{table == null}}).
- Mỗi entry là {{Node}} gồm {{hash}}, {{key}}, {{value}}, {{next}}. Bucket là danh sách liên kết.
- Capacity luôn là luỹ thừa của 2 để dùng phép {{&}} thay cho modulo.

### Hash spreading
~~~java
static final int hash(Object key) {
    int h;
    return (key == null) ? 0 : (h = key.hashCode()) ^ (h >>> 16);
}
int index = (n - 1) & hash;          // n là capacity
~~~
- XOR 16 bit cao xuống thấp để các bit cao cũng tham gia index; nếu không, với capacity nhỏ, hash chỉ dùng bit thấp nên dễ đụng.
- {{null}} key luôn vào bucket 0, chỉ có một key null.

### Resize
- Khi {{size > threshold}} (threshold = capacity * 0.75), gọi {{resize}}: tạo mảng mới gấp đôi, phân bố lại node.
- Java 8 tối ưu: mỗi bucket cũ tách thành **lo** và **hi** theo bit mới của hash, giữ thứ tự tương đối, không tính lại hash.
- Chi phí O(n) mỗi lần; nhiều lần resize liên tiếp gây spike latency. Vì vậy nếu biết trước số phần tử, khởi tạo capacity hợp lý: {{new HashMap<>((int)(expected / 0.75f) + 1)}}.

### Treeify (Java 8)
- Khi một bucket có ≥ {{TREEIFY_THRESHOLD = 8}} node **và** capacity ≥ {{MIN_TREEIFY_CAPACITY = 64}}, bucket chuyển thành {{TreeNode}} (cây đỏ-đen), tìm kiếm O(log n) thay vì O(n).
- Nếu capacity < 64, HashMap **resize** thay vì treeify, vì resize có thể làm bucket ngắn lại.
- Khi số node giảm xuống ≤ {{UNTREEIFY_THRESHOLD = 6}}, chuyển lại linked list.
- So sánh key trong cây dùng {{hashCode}} trước; nếu bằng thì dùng {{Comparable}} nếu key implements, nếu không dùng {{tieBreakOrder}} (so sánh identity) để cây vẫn hợp lệ.
- Tại sao threshold 8: phân bố hash chuẩn thì xác suất bucket dài 8 cực nhỏ (xấp xỉ 6e-8 với load factor 0.75); treeify chỉ để chống tấn công hash flooding.

### Các điểm hay hỏi
- {{HashMap}} không thread-safe: {{put}} đồng thời có thể mất dữ liệu; trước Java 8 còn có thể tạo vòng lặp vô hạn khi resize (bug nổi tiếng).
- Từ Java 8, việc resize không còn tạo vòng lặp nhưng vẫn không an toàn — cần {{ConcurrentHashMap}} hoặc đồng bộ ngoài.
- {{containsKey}} và {{get}} đều O(1) trung bình; worst case O(log n) từ Java 8 (có treeify), trước đó O(n).
- Key phải có {{hashCode}} ổn định; key mutable làm entry "mất tích".
- {{HashMap}} cho phép 1 key null và nhiều value null; {{Hashtable}}/{{ConcurrentHashMap}} thì không.

> Senior tip: đặt capacity ban đầu cho map lớn (ví dụ map cấu hình 100k entry) để tránh 10+ lần resize lúc khởi động; và nếu nghi ngờ hash flooding từ input người dùng, dùng key kiểu {{String}} với salt hoặc giới hạn kích thước request.`,
  follow: [
    'Vì sao capacity phải là luỹ thừa của 2 và load factor 0.75?',
    'Treeify threshold 8 và untreeify 6 — vì sao không dùng cùng một ngưỡng?',
    'HashMap thay đổi thế nào từ Java 7 sang Java 8 về xử lý collision?'
  ],
  tags: ['HashMap', 'resize', 'treeify', 'hash flooding'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-002',
  topic: 'collections',
  level: 'lead',
  q: '{{ConcurrentHashMap}} từ Java 8 hoạt động thế nào (CAS + synchronized trên bin)? Vì sao {{size()}} không chính xác tuyệt đối và vì sao không cho null?',
  a: `**Tóm tắt:** Java 8 bỏ segment, dùng **CAS** để chèn vào bucket rỗng và **synchronized trên node đầu** khi có collision; bộ đếm dùng {{baseCount}} + {{CounterCell}} nên {{size()}} là ước lượng dưới cập nhật đồng thời; null bị cấm để tránh nhập nhằng giữa "không có key" và "key có value null", đồng thời đơn giản hoá lock-free read.

### Từ Java 7 sang Java 8
- Java 7: chia thành các {{Segment}} (mặc định 16), mỗi segment là một bảng có lock riêng; mức đồng thời cố định.
- Java 8: một mảng {{Node[] table}}, không segment.
  - Bucket rỗng: {{casTabAt}} để đặt node đầu, không lock.
  - Bucket có node: {{synchronized (f)}} trên node đầu, cập nhật list/cây trong bucket đó.
  - Đọc: {{get}} không lock vì {{val}} và {{next}} là {{volatile}}.
- Kết quả: mức đồng thời theo bucket, tốt hơn nhiều so với 16 segment cố định.

### Ghi và đọc
~~~java
// giả lập ý tưởng putVal
if (tabAt(tab, i) == null) {
    if (casTabAt(tab, i, null, new Node(hash, key, value)))
        return;                        // chèn không lock
}
synchronized (f) {                     // f = node đầu bucket
    // duyệt list, update hoặc append; nếu dài thì treeify
}
~~~
- Resize có hỗ trợ **multi-threading**: các thread giúp di chuyển bucket ({{transfer}}), dùng {{ForwardingNode}} đánh dấu bucket đã chuyển.
- {{computeIfAbsent}}/{{compute}}/{{merge}} là atomic theo key, nhưng mapping function chạy **bên trong lock của bucket** — đừng gọi I/O hay thao tác chậm trong đó, và tuyệt đối không cập nhật đệ quy cùng map (có thể deadlock hoặc vòng lặp).
- Iterator là **weakly consistent**: không ném {{ConcurrentModificationException}}, phản ánh trạng thái tại một thời điểm, có thể thấy hoặc không thấy cập nhật mới.

### size() và bộ đếm
- Không dùng một biến {{size}} duy nhất vì sẽ thành điểm nghẽn. Java 8 dùng {{baseCount}} cộng thêm mảng {{CounterCell}} (ý tưởng giống {{LongAdder}}): mỗi thread cập nhật một cell khác nhau, giảm contention.
- {{sumCount()}} cộng tất cả lại, nhưng trong lúc đang cộng thì các thread khác vẫn thay đổi ⇒ kết quả có thể **không phải snapshot chính xác** tại bất kỳ thời điểm nào.
- Vì vậy {{size()}} chỉ nên dùng cho ước lượng/monitoring; đừng dùng để quyết định logic "nếu size == 0 thì..." trong môi trường đồng thời.
- {{mappingCount()}} trả {{long}}, tránh tràn int khi > 2 tỷ entry.

### Vì sao cấm null
- Nếu cho phép value null, {{get(key)}} trả null không phân biệt được "key không tồn tại" và "key tồn tại với value null"; muốn phân biệt phải gọi thêm {{containsKey}}, tạo race giữa hai lời gọi.
- Việc cấm null cho phép triển khai lock-free đơn giản hơn: sự hiện diện của node đã đủ biểu diễn key tồn tại.
- Trong {{ConcurrentHashMap}} còn cấm key null; nếu cần biểu diễn "không có", dùng giá trị sentinel hoặc {{Optional}} (nhưng cân nhắc chi phí).

### Pitfall
- Dùng {{computeIfAbsent}} để cache kết quả gọi DB: lock giữ lâu, các thread khác cùng bucket bị chặn; nên dùng cache có loading (Caffeine) hoặc future per key.
- {{putIfAbsent}} + kiểm tra sau đó không atomic; dùng {{computeIfAbsent}}/{{merge}} đúng cách.
- Kích thước ban đầu: {{new ConcurrentHashMap<>(expected)}} để giảm resize.

> Senior tip: CHM rất tốt cho map cấu hình/registry đọc nhiều, nhưng không thay thế cache có eviction. Với hot key, cân nhắc {{LongAdder}}/{{striped lock}} thay vì {{compute}} trên cùng một key vì mọi thread sẽ xếp hàng trên cùng bucket.`,
  follow: [
    'Vì sao {{computeIfAbsent}} có thể gây deadlock nếu mapping function động vào chính map?',
    '{{ConcurrentHashMap}} đảm bảo gì cho iterator và {{size()}}?',
    'Khi nào nên dùng {{Collections.synchronizedMap}} thay vì CHM?'
  ],
  tags: ['ConcurrentHashMap', 'CAS', 'size', 'null']
},
{
  id: 'collections-003',
  topic: 'collections',
  level: 'mid',
  q: '{{ArrayList}} vs {{LinkedList}}: cache locality ảnh hưởng thế nào, và khi nào {{LinkedList}} thực sự thắng?',
  a: `**Tóm tắt:** {{ArrayList}} lưu trong mảng liên tục nên duyệt cực nhanh nhờ cache locality và truy cập ngẫu nhiên O(1); {{LinkedList}} là các node rải rác, mỗi node tốn header + 2 reference, duyệt chậm và tốn bộ nhớ. {{LinkedList}} gần như không bao giờ thắng ở workload thực tế; {{ArrayDeque}} thường tốt hơn cho queue/stack.

### Bên trong
- {{ArrayList}}: {{Object[] elementData}} + {{size}}. Thêm cuối amortized O(1); chèn/xoá giữa O(n) do {{System.arraycopy}} dịch phần tử. Khi đầy, tăng khoảng 1.5 lần ({{oldCapacity + (oldCapacity >> 1)}}).
- {{LinkedList}}: node {{prev, item, next}}; mỗi node là object riêng. {{get(i)}} O(n) (duyệt từ đầu hoặc cuối); thêm/xoá ở hai đầu O(1); xoá qua {{Iterator}} O(1) vì đã có node.

### Cache locality
- CPU đọc theo cache line (thường 64 byte). Mảng {{Object[]}} nằm liền nhau nên duyệt tuần tự gần như luôn hit cache; JIT cũng tối ưu vòng lặp mảng tốt.
- Mỗi node LinkedList là một object trên heap, có thể nằm rải rác; truy cập {{next}} là **pointer chasing**, mỗi bước có thể cache miss. Duyệt 1 triệu phần tử có thể chậm gấp nhiều lần ArrayList dù cùng O(n).
- Memory: node LinkedList tốn header object (~16 byte) + 3 reference (~12-24 byte tuỳ compressed oops) ≈ 32-40 byte/phần tử; ArrayList chỉ tốn reference trong mảng (4-8 byte) + overhead mảng.

### Khi nào LinkedList có lý
- Cần cả {{List}} và {{Deque}}, thêm/xoá rất nhiều ở hai đầu, và **không** truy cập theo index. Nhưng {{ArrayDeque}} cũng làm được việc này nhanh hơn và ít bộ nhớ hơn.
- Xoá phần tử ở giữa khi đã có {{ListIterator}} tại đúng vị trí (O(1) cho thao tác xoá), nhưng chi phí để **đi tới** vị trí vẫn O(n), và locality vẫn kém.
- Danh sách rất lớn mà thao tác chèn/xoá giữa liên tục và không cần index — hiếm trong backend; thường dùng cấu trúc khác (skip list, tree, queue).

### Thực tế
- Hầu hết code backend dùng {{ArrayList}}; queue/stack dùng {{ArrayDeque}}; priority dùng {{PriorityQueue}}; concurrent queue dùng {{ArrayBlockingQueue}}/{{LinkedBlockingQueue}}.
- {{LinkedList}} còn được dùng làm {{Deque}} trong một số code cũ, nhưng {{ArrayDeque}} nhanh hơn ~vài lần trong benchmark.
- Đừng chọn collection dựa trên Big-O thuần; hằng số và bộ nhớ quyết định rất nhiều.

> Senior tip: nếu thấy {{LinkedList}} trong code, hỏi ngay "có thật sự cần chèn/xoá giữa với iterator không?"; 90% trường hợp đổi sang {{ArrayList}} hoặc {{ArrayDeque}} sẽ nhanh hơn và giảm heap. Đo bằng JMH trên dữ liệu thật thay vì tin cảm giác.`,
  follow: [
    'Vì sao {{ArrayDeque}} thường thay được {{LinkedList}} làm queue/stack?',
    'Tăng capacity 1.5 lần của ArrayList có ảnh hưởng gì tới bộ nhớ?',
    'Khi nào nên khởi tạo {{ArrayList}} với capacity cho trước?'
  ],
  tags: ['ArrayList', 'LinkedList', 'cache locality', 'ArrayDeque']
},
{
  id: 'collections-004',
  topic: 'collections',
  level: 'senior',
  q: 'Fail-fast và fail-safe iterator khác nhau thế nào? {{ConcurrentModificationException}} xảy ra khi nào và tránh ra sao?',
  a: `**Tóm tắt:** fail-fast iterator kiểm tra {{modCount}} và ném {{ConcurrentModificationException}} nếu collection bị sửa ngoài iterator; fail-safe (weakly consistent) như {{ConcurrentHashMap}} hay snapshot như {{CopyOnWriteArrayList}} thì không ném nhưng có thể thấy dữ liệu cũ/không đầy đủ.

### Fail-fast
- {{ArrayList}}, {{HashMap}}, {{HashSet}}... có field {{modCount}} tăng mỗi lần thay đổi cấu trúc.
- Iterator lưu {{expectedModCount}}; mỗi {{next()}}/{{remove()}} so sánh, lệch thì ném CME ngay.
- Đây là **best-effort detection**, không phải cơ chế đồng bộ: không đảm bảo phát hiện mọi trường hợp, nhất là đa luồng.
- CME có thể xảy ra cả trong **một thread** khi vừa for-each vừa {{list.remove(x)}} hoặc {{map.put}}.

~~~java
for (String s : list) {
    if (s.isEmpty()) list.remove(s);   // CME
}
// đúng:
Iterator<String> it = list.iterator();
while (it.hasNext()) if (it.next().isEmpty()) it.remove();
// hoặc gọn:
list.removeIf(String::isEmpty);
~~~

- {{list.remove(int)}} khác {{it.remove()}}; chỉ iterator biết để cập nhật {{expectedModCount}}.
- {{for (int i...)}} rồi {{remove(i)}} không ném nhưng **bỏ sót** phần tử do index dịch — bug âm thầm còn tệ hơn.

### Fail-safe / weakly consistent
- {{ConcurrentHashMap}}: iterator không ném CME, phản ánh trạng thái tại một thời điểm; có thể thấy hoặc không thấy thay đổi đang diễn ra. {{size()}} cũng chỉ là ước lượng.
- {{CopyOnWriteArrayList}}: iterator làm việc trên **snapshot** của mảng tại thời điểm tạo; sửa list không ảnh hưởng iterator, nhưng iterator không hỗ trợ {{remove}}.
- {{Collections.synchronizedList}}: iterator **vẫn fail-fast**; muốn duyệt an toàn phải đặt khối {{synchronized (list)}} quanh cả vòng lặp (theo Javadoc).
- {{ConcurrentSkipListMap}} weakly consistent tương tự.

### Cách tránh
- Sửa qua iterator ({{it.remove()}}, {{it.set()}}).
- Dùng {{removeIf}}, {{replaceAll}}, {{computeIfPresent}}.
- Với map, dùng {{entrySet().removeIf}}, {{map.compute}} thay vì remove trong for-each.
- Đa luồng: dùng collection concurrent đúng loại, hoặc copy sang list mới trước khi duyệt nếu chỉ cần snapshot.
- Không dùng {{Collections.synchronizedList}} rồi tưởng iterator an toàn.

### Pitfall
- Bắt CME rồi bỏ qua là che bug; CME là tín hiệu logic sai, không phải lỗi tạm thời để retry.
- Duyệt {{subList}} rồi sửa list gốc cũng gây CME.
- Sửa collection trong {{forEach}} của chính nó cũng CME (trừ concurrent).

> Senior tip: trong code review, ưu tiên {{removeIf}}/{{computeIfAbsent}} vì vừa gọn vừa tránh CME; với CHM, đừng dựa vào {{size()}} để dừng vòng lặp trong môi trường đồng thời — dùng kết quả trả về của thao tác hoặc đếm cục bộ.`,
  follow: [
    'Vì sao {{Collections.synchronizedList}} vẫn có thể ném CME khi duyệt?',
    '{{CopyOnWriteArrayList}} iterator có hỗ trợ {{remove}} không, vì sao?',
    'CME trong ứng dụng đa luồng có phải lúc nào cũng do đa luồng không?'
  ],
  tags: ['iterator', 'fail-fast', 'ConcurrentModificationException', 'fail-safe'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-005',
  topic: 'collections',
  level: 'senior',
  q: 'Dùng {{LinkedHashMap}} làm LRU cache thế nào? {{removeEldestEntry}} và access-order hoạt động ra sao, và có nên dùng trong production?',
  a: `**Tóm tắt:** bật {{accessOrder = true}} để mỗi lần {{get}}/{{put}} đưa entry lên cuối danh sách, override {{removeEldestEntry}} trả {{size() > capacity}} để tự xoá entry cũ nhất; cách này đơn giản nhưng **không thread-safe** và không có thống kê/expiry, nên production thường dùng Caffeine.

### Cơ chế
- {{LinkedHashMap}} kế thừa {{HashMap}} và nối các entry bằng danh sách đôi ({{before}}/{{after}}).
- Mặc định **insertion-order**; constructor {{LinkedHashMap(int capacity, float loadFactor, boolean accessOrder)}} với {{accessOrder = true}} chuyển sang **access-order**.
- Trong access-order, {{get}} và {{put}} (kể cả {{getOrDefault}}, {{compute}}) là "truy cập" và di chuyển entry ra cuối.
- {{removeEldestEntry(Map.Entry)}} được gọi sau mỗi lần thêm; trả {{true}} thì xoá entry **đầu tiên** (least recently used).

~~~java
class LruCache<K, V> extends LinkedHashMap<K, V> {
    private final int max;
    LruCache(int max) {
        super(16, 0.75f, true);      // accessOrder = true
        this.max = max;
    }
    @Override protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > max;
    }
}
~~~

- Có thể override {{removeEldestEntry}} để trả false với một số key (ghim entry) hoặc log khi evict.

### Giới hạn
- **Không thread-safe**: nhiều thread {{get}} đồng thời vẫn làm thay đổi danh sách liên kết (access-order) ⇒ phải bọc {{synchronized}} hoặc dùng {{Collections.synchronizedMap}}; nhưng khi đó mọi thao tác tuần tự, mất lợi ích.
- **Không có TTL**: chỉ evict theo kích thước, không theo thời gian.
- **Không có thống kê**: hit rate, eviction count phải tự đếm.
- **Không có chính sách tốt hơn LRU**: LRU dễ bị "cache pollution" bởi quét tuần tự một lần (mỗi phần tử mới đẩy hết cache cũ ra).
- **Chi phí bộ nhớ**: thêm 2 reference/entry so với HashMap; với cache lớn và entry nhỏ, overhead đáng kể.
- {{get}} trong access-order là **structural modification** theo nghĩa iterator: duyệt và {{get}} đồng thời có thể gây CME trong cùng thread.

### Production
- Dùng **Caffeine**: {{Caffeine.newBuilder().maximumSize(10_000).expireAfterWrite(...).recordStats().build()}}, hỗ trợ W-TinyLFU (tốt hơn LRU), async loading, thống kê, thread-safe.
- Hoặc Guava Cache (đơn giản hơn, ít tính năng hơn Caffeine).
- Redis/Memcached nếu cache phân tán; cần chính sách invalidate rõ ràng.
- Với cache trong JVM, luôn đặt **maximumSize** để tránh OOM; cache không giới hạn là bom hẹn giờ.

> Senior tip: đừng tự viết LRU bằng LinkedHashMap trong service production trừ khi cache rất nhỏ và chỉ một thread truy cập. Caffeine không chỉ nhanh hơn mà còn tránh được pattern scan làm sạch cache, và có metric để biết cache có hiệu quả hay không.`,
  follow: [
    'Vì sao access-order {{get}} có thể gây CME khi duyệt map?',
    'LRU có nhược điểm gì so với LFU/W-TinyLFU?',
    'Làm sao thêm TTL cho một cache tự viết bằng LinkedHashMap?'
  ],
  tags: ['LinkedHashMap', 'LRU', 'removeEldestEntry', 'Caffeine'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-006',
  topic: 'collections',
  level: 'senior',
  q: '{{TreeMap}}/{{NavigableMap}} dùng khi nào? Vì sao comparator phải nhất quán với {{equals}} và hậu quả nếu không?',
  a: `**Tóm tắt:** {{TreeMap}} là cây đỏ-đen, giữ key theo thứ tự, cho phép truy vấn range/floor/ceiling O(log n); comparator (hoặc {{compareTo}}) phải nhất quán với {{equals}}, nếu không map/set sẽ coi hai key khác nhau là một và **mất dữ liệu âm thầm**.

### NavigableMap
- {{firstKey}}, {{lastKey}}, {{floorKey(k)}} (≤ k), {{ceilingKey(k)}} (≥ k), {{lowerKey}}, {{higherKey}}.
- {{headMap(k, inclusive)}}, {{tailMap}}, {{subMap(from, to)}} là **view** — thay đổi view ảnh hưởng map gốc.
- {{pollFirstEntry}}, {{pollLastEntry}} tiện cho hàng đợi ưu tiên có xoá.
- {{descendingMap}} đảo thứ tự; {{TreeSet}} tương tự cho set.

### Use case
- Range query trong bộ nhớ: tìm khung giờ, bucket giá, version ≥ X.
- Leaderboard nhỏ, scheduler đơn giản (nhưng production nên dùng heap/Redis sorted set).
- Gom nhóm theo khoảng: {{subMap(from, true, to, false)}}.
- Tìm phần tử gần nhất (nearest neighbor 1 chiều).

### Comparator và equals
- {{TreeMap}} **không dùng** {{equals}}/{{hashCode}} để định danh key; nó dùng {{compare()}}.
- Nếu {{compare(a, b) == 0}} nhưng {{a.equals(b)}} là false, map coi là **cùng một key**: {{put(b, ...)}} ghi đè value của {{a}}, {{size()}} không tăng, {{get(b)}} trả value của a. Đây là vi phạm contract của {{Map}}.
- Ví dụ kinh điển: {{new TreeSet<>(Comparator.comparing(String::length))}} — "ab" và "cd" cùng length 2 nên chỉ giữ một.
- Comparator cũng phải **transitive** và **consistent**: nếu không, cây đỏ-đen có thể mất cân bằng hoặc tìm kiếm sai.
- Với key có {{compareTo}} tự nhiên: đảm bảo {{compareTo == 0}} ⇔ {{equals == true}}. {{BigDecimal}} là cái bẫy nổi tiếng: {{new BigDecimal("1.0").equals(new BigDecimal("1.00"))}} là false nhưng {{compareTo}} là 0 ⇒ dùng làm key TreeMap sẽ gộp.
- Null: {{TreeMap}} không cho key null trừ khi comparator xử lý null; natural ordering ném NPE.

### Khác biệt với HashMap
- {{TreeMap}}: O(log n), có thứ tự, memory cao hơn, không cho null key (mặc định).
- {{HashMap}}: O(1) trung bình, không thứ tự; {{LinkedHashMap}} giữ thứ tự chèn/access.
- Nếu chỉ cần sắp xếp khi in ra, dùng HashMap rồi sort lúc cần sẽ nhanh hơn cho write-heavy.

> Senior tip: khi dùng comparator tùy biến, viết unit test khẳng định các key **khác nhau** vẫn là phần tử riêng biệt; đây là loại bug không ném exception, chỉ làm mất record và cực khó phát hiện. Với BigDecimal, luôn normalize ({{stripTrailingZeros}}) trước khi làm key, ví dụ {{bd.stripTrailingZeros().toPlainString()}} — riêng {{toPlainString}} không normalize ("1.0" và "1.00" vẫn khác nhau).`,
  follow: [
    'Vì sao {{BigDecimal}} là cái bẫy khi làm key của {{TreeMap}}?',
    '{{subMap}} là view hay bản copy, và điều đó ảnh hưởng gì?',
    'Khi nào dùng {{TreeMap}} thay vì sort một {{HashMap}} khi cần?'
  ],
  tags: ['TreeMap', 'NavigableMap', 'Comparator', 'BigDecimal'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-007',
  topic: 'collections',
  level: 'senior',
  q: '{{CopyOnWriteArrayList}} và các {{BlockingQueue}} dùng trong tình huống nào? So sánh {{ArrayBlockingQueue}}, {{LinkedBlockingQueue}}, {{SynchronousQueue}}.',
  a: `**Tóm tắt:** {{CopyOnWriteArrayList}} copy toàn bộ mảng mỗi lần ghi, đọc không lock — hợp với danh sách listener **đọc nhiều, ghi cực ít**; {{BlockingQueue}} dùng cho producer-consumer, chọn theo bounded/unbounded, throughput và cơ chế handoff.

### CopyOnWriteArrayList
- Mọi thao tác ghi ({{add}}, {{set}}, {{remove}}) tạo mảng mới rồi thay reference {{volatile}}; đọc dùng mảng hiện tại, không lock.
- Iterator là **snapshot**: không CME, không {{remove}}; có thể thấy dữ liệu cũ.
- Chi phí ghi O(n) cả về thời gian và bộ nhớ; ghi liên tục ⇒ GC pressure rất lớn.
- Hợp: danh sách listener/observer ít thay đổi, cấu hình read-mostly, tập subscriber trong event bus.
- Không hợp: cache, queue, collection lớn cập nhật thường xuyên.
- {{CopyOnWriteArraySet}} tương tự, dùng cho tập nhỏ.

### BlockingQueue
- Hỗ trợ {{put}} (chờ khi đầy), {{take}} (chờ khi rỗng), bản có timeout {{offer(e, t, unit)}}, {{poll(t, unit)}}.
- Dùng cho thread pool ({{ThreadPoolExecutor}} dùng queue), pipeline xử lý, backpressure.

| Queue | Bound | Đặc điểm | Dùng khi |
|---|---|---|---|
| {{ArrayBlockingQueue}} | có | mảng, lock + condition, công bằng tuỳ chọn | cần giới hạn chặt, throughput vừa, bộ nhớ dự đoán được |
| {{LinkedBlockingQueue}} | tuỳ chọn | node, 2 lock (put/take) | throughput cao; **mặc định không giới hạn** nên dễ OOM |
| {{SynchronousQueue}} | 0 | handoff trực tiếp, không lưu | thread pool kiểu cached, chuyển task ngay cho consumer |
| {{PriorityBlockingQueue}} | không giới hạn | heap, ưu tiên | task có priority, chấp nhận không bound |
| {{DelayQueue}} | không giới hạn | phần tử chỉ lấy được sau delay | retry, scheduler nhẹ |
| {{LinkedTransferQueue}} | không giới hạn | transfer, hiệu năng cao | producer chờ consumer nhận |

### Chọn thế nào
- Luôn đặt **bound** cho queue trong production; queue vô hạn chỉ dời OOM chứ không tránh.
- Cần backpressure: dùng {{ArrayBlockingQueue}} nhỏ + {{CallerRunsPolicy}} hoặc chặn producer.
- Cần throughput lớn với nhiều producer/consumer: {{LinkedBlockingQueue}} có bound hợp lý.
- Cần handoff tức thì, không tồn đọng: {{SynchronousQueue}}.
- Cần ưu tiên: {{PriorityBlockingQueue}} nhưng nhớ nó không bound và không đảm bảo FIFO cho cùng priority.
- Với virtual thread (Java 21), {{SynchronousQueue}}/{{ArrayBlockingQueue}} vẫn dùng tốt; tránh queue quá lớn làm mất lợi ích backpressure.

### Pitfall
- {{LinkedBlockingQueue}} mặc định {{Integer.MAX_VALUE}} — một trong những nguyên nhân OOM phổ biến khi dùng {{Executors.newFixedThreadPool}} (queue unbounded).
- {{CopyOnWriteArrayList}} trong vòng lặp ghi hàng nghìn phần tử: O(n²).
- Không xử lý {{InterruptedException}}: phải restore interrupt hoặc thoát êm.
- Poison pill để đóng consumer cần đúng số consumer, nếu không sẽ kẹt.

> Senior tip: với thread pool, luôn tự tạo {{ThreadPoolExecutor}} với queue bounded và đặt tên thread; đừng dùng {{Executors.newFixedThreadPool}} mặc định vì queue vô hạn che giấu overload cho tới khi OOM. Theo dõi {{queue.size()}} và thời gian chờ {{take}} để phát hiện nghẽn sớm.`,
  follow: [
    'Vì sao {{Executors.newFixedThreadPool}} có thể gây OOM khi tải tăng?',
    '{{SynchronousQueue}} hoạt động thế nào khi không có consumer chờ?',
    'Khi nào {{CopyOnWriteArrayList}} là lựa chọn tồi dù đọc nhiều?'
  ],
  tags: ['CopyOnWriteArrayList', 'BlockingQueue', 'backpressure', 'thread pool'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-008',
  topic: 'collections',
  level: 'lead',
  q: 'Cần lưu 10 triệu phần tử trong bộ nhớ — chọn collection nào? Phân tích memory footprint, boxing và primitive collections.',
  a: `**Tóm tắt:** với 10 triệu phần tử, **boxing và overhead của node** quyết định hàng trăm MB; ưu tiên mảng primitive ({{int[]}}) hoặc primitive collection (Eclipse Collections, fastutil) thay vì {{ArrayList<Integer>}} hay {{HashMap<Integer, ...>}}; nếu phải dùng object, chọn cấu trúc mảng liên tục và presize.

### Tính nhanh bộ nhớ
- {{int[]}} 10 triệu: 40 MB + header mảng.
- {{ArrayList<Integer>}} 10 triệu: mảng reference ~40-80 MB (tuỳ compressed oops) **cộng** 10 triệu object {{Integer}} ~16 byte mỗi cái = ~160 MB, tổng thường 200-300 MB. Nếu giá trị ngoài cache {{-128..127}}, không dùng chung được.
- {{LinkedList<Integer>}}: mỗi node ~32-40 byte + Integer ⇒ có thể > 500 MB và duyệt cực chậm.
- {{HashMap<Integer, Integer>}} 10 triệu entry: mảng bucket + node + 2 Integer + key object; thực tế có thể 700 MB đến hơn 1 GB, và còn phụ thuộc load factor. Đây là lựa chọn tồi nếu key là số nguyên liên tục.
- {{String}} key còn tệ hơn: mỗi String ~40+ byte + mảng byte.

### Nguyên nhân
- **Boxing**: mỗi primitive thành object có header (12-16 byte) + field; cache Integer chỉ cho -128..127.
- **Object header + alignment**: object trên HotSpot thường align 8 byte; node nhỏ cũng tốn 16 byte header.
- **Reference**: mỗi phần tử trong mảng/Object[] tốn 4 byte (heap < 32 GB với compressed oops) hoặc 8 byte.
- **Over-allocation**: ArrayList tăng 1.5x, HashMap capacity luỹ thừa 2 + load factor 0.75.

### Lựa chọn theo nhu cầu
- Chỉ lưu số nguyên/giá trị: {{int[]}}, {{long[]}}; nếu cần động, dùng {{IntArrayList}} (fastutil), {{IntArrayList}}/{{IntHashSet}} (Eclipse Collections), HPPC.
- Map khoá int → value object: {{Int2ObjectOpenHashMap}} (fastutil) hoặc Eclipse {{IntObjectHashMap}}; tránh {{HashMap<Integer, V>}}.
- Map int → int: {{IntIntHashMap}} — tiết kiệm cực lớn.
- Cần tập hợp: {{IntOpenHashSet}} thay {{HashSet<Integer>}}.
- Cần sort/range: mảng primitive + {{Arrays.sort}} + {{Arrays.binarySearch}} thường nhanh và nhẹ nhất.
- Dữ liệu quá lớn: cân nhắc lưu ngoài heap (off-heap, Chronicle Map), cơ sở dữ liệu nhúng, hoặc streaming thay vì giữ tất cả.
- Nếu key là số liên tục 0..N: dùng mảng trực tiếp thay map — O(1) và ít bộ nhớ nhất.

### Đo và kiểm chứng
- Dùng JOL (Java Object Layout) để đo chính xác footprint.
- Bật {{-XX:+UseCompressedOops}} (mặc định khi heap < 32 GB) và {{-XX:+UseCompressedClassPointers}}.
- Đặt {{-Xmx}} và theo dõi GC; cache 10 triệu object thường cần heap 1-2 GB chỉ cho cấu trúc, chưa kể tải.
- JMH để đo throughput; đừng tối ưu theo cảm giác.

### Pitfall
- Nghĩ rằng {{HashMap}} O(1) là đủ nhanh mà bỏ qua memory: 10 triệu entry có thể làm GC pause tăng mạnh.
- Dùng {{ArrayList<Integer>}} rồi sort: boxing comparator chậm hơn {{Arrays.sort(int[])}} nhiều.
- Giữ collection lớn trong static field/singleton ⇒ leak suốt vòng đời ứng dụng.
- Quên rằng {{Integer.valueOf}} cache chỉ giúp giá trị nhỏ; dữ liệu thực tế thường ngoài khoảng đó.

> Senior tip: trước khi chọn collection, ước lượng memory bằng công thức đơn giản và kiểm tra với JOL; nếu vượt quá ~30-40% heap dự kiến, hãy thiết kế lại (primitive collection, chunking, hoặc không giữ toàn bộ trong RAM). Đây là quyết định kiến trúc, không chỉ là micro-optimization.`,
  follow: [
    'Vì sao {{HashMap<Integer, V>}} tốn bộ nhớ hơn nhiều so với tính toán ngây thơ?',
    'Khi nào nên chọn mảng primitive thay vì primitive collection?',
    'Làm sao đo chính xác footprint của một collection bằng JOL?'
  ],
  tags: ['memory', 'boxing', 'primitive collections', 'fastutil']
},
{
  id: 'collections-009',
  topic: 'collections',
  level: 'senior',
  q: '{{PriorityQueue}}: heap bên trong, bài toán top-K trên stream dữ liệu lớn, độ phức tạp.',
  a: `**Tóm tắt:** {{PriorityQueue}} là min-heap (binary heap) dựa trên mảng, O(log n) cho offer/poll, O(1) peek; dùng cho top-K (giữ K phần tử lớn nhất/nhỏ nhất) trên stream lớn với bộ nhớ O(K); không thread-safe, không cho null, iterator không đảm bảo thứ tự.
 
### Cấu trúc heap
- Mảng {{Object[] queue}}; parent tại i, children tại 2i+1, 2i+2.
- {{offer}}: thêm cuối, sift-up (bubble up) so sánh với parent.
- {{poll}}: lấy root, đổi cuối lên root, sift-down (trickle down).
- {{peek}}: trả root không xoá.
- Không phải BST — chỉ đảm bảo parent ≤ children (min-heap), không sắp xếp toàn bộ.

### Top-K trên stream lớn
- Bài toán: tìm K phần tử lớn nhất từ stream N phần tử (N >> K, ví dụ N=1 tỷ, K=100).
- Giải pháp: min-heap size K. Duyệt stream:
  - Heap size < K: {{offer}} trực tiếp.
  - Heap size = K: nếu phần tử mới > root (min), {{poll}} rồi {{offer}} mới.
- Kết quả: heap chứa K phần tử lớn nhất, root là nhỏ nhất trong top-K.
- Độ phức tạp: O(N log K) thời gian, O(K) bộ nhớ — tốt hơn sort O(N log N) khi K << N.

~~~java
// Top 100 số lớn nhất
PriorityQueue<Long> minHeap = new PriorityQueue<>(100);
for (long v : stream) {
    if (minHeap.size() < 100) minHeap.offer(v);
    else if (v > minHeap.peek()) { minHeap.poll(); minHeap.offer(v); }
}
List<Long> top100 = minHeap.stream().sorted(Comparator.reverseOrder()).toList();
~~~

### Độ phức tạp
| Thao tác | Độ phức tạp |
|---|---|
| {{offer}}/{{add}} | O(log n) |
| {{poll}}/{{remove}} | O(log n) |
| {{peek}} | O(1) |
| {{contains}} | O(n) (duyệt mảng) |
| {{size}}/{{isEmpty}} | O(1) |
| Xây heap từ collection | O(n) (heapify) |

### Pitfall
- **Không cho null**: ném NPE ngay khi {{offer(null)}}.
- **Không thread-safe**: dùng {{PriorityBlockingQueue}} cho đa luồng.
- **Iterator không sorted**: {{iterator()}} duyệt theo mảng heap, không theo thứ tự ưu tiên; muốn sorted phải {{stream().sorted()}} hoặc poll hết.
- **Comparator phức tạp**: nếu comparator chậm, log n nhân thêm hằng số lớn; cân nhắc pre-compute key.
- **Memory**: mảng mở rộng 2x khi đầy; presize {{new PriorityQueue<>(initialCapacity)}} nếu biết K.

> Senior tip: với top-K thực tế (log analytics, monitoring), dùng {{PriorityQueue}} + stream processing; nếu cần top-K phân tán, mỗi node tính local top-K rồi merge. Với K rất lớn, cân nhắc {{TreeSet}} (O(log n) nhưng memory cao hơn) hoặc approximate algorithm (Count-Min Sketch, t-Digest).`,
  follow: [
    'Vì sao {{PriorityQueue}} dùng min-heap cho bài toán top-K lớn nhất?',
    '{{PriorityBlockingQueue}} khác {{PriorityQueue}} ở đâu?',
    'Khi nào nên dùng {{TreeSet}} thay vì {{PriorityQueue}}?'
  ],
  tags: ['PriorityQueue', 'heap', 'top-K', 'stream'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-010',
  topic: 'collections',
  level: 'mid',
  q: '{{ArrayDeque}} vs {{Stack}}/{{LinkedList}} làm stack/queue; vì sao {{Stack}} bị khuyên tránh?',
  a: `**Tóm tắt:** {{ArrayDeque}} là lựa chọn hiện đại cho stack/queue: mảng vòng (circular array), O(1) amortized cho push/pop/offer/poll, cache-friendly, không đồng bộ, không cho null; {{Stack}} extends {{Vector}} (sync, legacy), {{LinkedList}} tốn memory và cache miss — đều không khuyến khích.
 
### Stack — legacy, không dùng
- Extends {{Vector}}: mọi method {{synchronized}} ⇒ chi phí lock không cần thiết cho single-thread.
- Kế thừa {{Vector}} kéo theo {{get}}, {{set}}, {{insert}} ở giữa — phá vỡ ngữ nghĩa stack (LIFO).
- {{push}}/{{pop}} đồng bộ hóa từng method, không hỗ trợ atomic batch.
- JavaDoc khuyến nghị: **"A more complete and consistent set of LIFO stack operations is provided by the Deque interface and its implementations."**

### LinkedList — tốn kém cho stack/queue
- Node object riêng: header + 2 reference + data ≈ 32-40 byte/entry (vs 4-8 byte reference trong mảng).
- Pointer chasing: mỗi {{pop}}/{{poll}} truy cập {{next}}/{{prev}} — cache miss nhiều.
- Implement cả {{List}} và {{Deque}}; dùng làm {{Deque}} thì thừa thừa method {{get(i)}}, {{add(i, e)}} O(n).
- Chỉ ưu tiên khi cần {{ListIterator}} xoá giữa O(1) **và** đã có con trỏ tại vị trí.

### ArrayDeque — lựa chọn chuẩn
- Mảng vòng {{Object[] elements}} + {{head}}, {{tail}} index.
- {{push}}/{{addFirst}}/{{offerFirst}}: giảm head, ghi.
- {{pop}}/{{removeFirst}}/{{pollFirst}}: đọc head, tăng head.
- {{offerLast}}/{{pollLast}} tương tự cho queue.
- Resize: mảng gấp đôi khi đầy (copy 2 mảng do vòng).
- **Không cho null** (để phân biệt empty slot và null value).
- **Không thread-safe**: dùng {{ConcurrentLinkedDeque}} hoặc sync ngoài nếu cần.
- Implement {{Deque}}, {{Queue}}, {{Cloneable}}, {{Serializable}}.

### So sánh nhanh
| | Stack | LinkedList | ArrayDeque |
|---|---|---|---|
| Push/Pop | O(1) sync | O(1) | O(1) amortized |
| Memory/entry | ~40 byte (Vector) | ~32-40 byte | 4-8 byte (ref) |
| Cache locality | Tốt (mảng) | Tệ (node) | Rất tốt (mảng) |
| Null allowed | Có | Có | **Không** |
| Thread-safe | Có (sync) | Không | Không |

### Khi nào dùng gì
- Stack/Queue single-thread: **ArrayDeque**.
- Queue đa luồng bounded: **ArrayBlockingQueue**.
- Queue đa luồng unbounded: **LinkedBlockingQueue** (có bound!).
- Cần priority: **PriorityQueue** / **PriorityBlockingQueue**.
- Cần blocking + priority: **PriorityBlockingQueue**.
- Handoff trực tiếp: **SynchronousQueue**.

> Senior tip: trong code review, thấy {{new Stack()}} hoặc {{new LinkedList()}} dùng làm stack/queue là cơ hội refactor sang {{ArrayDeque}} — nhanh hơn, nhẹ hơn, API hiện đại ({{push}}/{{pop}}/{{peek}} cho stack, {{offer}}/{{poll}}/{{peek}} cho queue).`,
  follow: [
    'Vì sao {{ArrayDeque}} không cho null trong khi {{LinkedList}} cho phép?',
    '{{ArrayDeque}} resize như thế nào khi mảng vòng đầy?',
    'Khi nào {{ConcurrentLinkedDeque}} thích hợp hơn {{ArrayBlockingQueue}}?'
  ],
  tags: ['ArrayDeque', 'Stack', 'LinkedList', 'Deque', 'Queue']
},
{
  id: 'collections-011',
  topic: 'collections',
  level: 'senior',
  q: '{{List.of}} vs {{Collections.unmodifiableList}} vs copy: immutable thật hay chỉ là view; null và NPE.',
  a: `**Tóm tắt:** {{List.of}} (Java 9+) tạo list **immutable thật** (không thêm/xoá/sửa được, cấm null); {{Collections.unmodifiableList}} chỉ là **view** bao list gốc (list gốc sửa thì view thay đổi); copy thủ công ({{new ArrayList<>(src)}}) tạo bản sao mutable. Chọn theo nhu cầu: immutable API dùng {{List.of}}/{{List.copyOf}}, defensive copy dùng {{new ArrayList<>}}, read-only view dùng {{unmodifiableList}}.
 
### List.of / List.copyOf (Java 9/10)
- {{List.of(a, b, c)}}: immutable, fixed-size, **cấm null** (ném NPE), không hỗ trợ {{add}}/{{remove}}/{{set}}/{{sort}}.
- {{List.copyOf(list)}}: copy bản gốc thành immutable list; nếu list gốc đã immutable thì có thể trả về chính nó (optimization).
- Internal: dùng {{ImmutableCollections.ListN}} (compact, không field thừa), serialization hỗ trợ.
- Null: bất kỳ phần tử null nào ⇒ NPE ngay khi tạo — phát hiện sớm bug data.

### Collections.unmodifiableList
~~~java
List<String> mutable = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(mutable);
mutable.add("c");           // OK
System.out.println(view);   // [a, b, c] — view thấy thay đổi!
~~~
- Chỉ **wrap** list gốc, không copy; method mutating ({{add}}, {{set}}, {{remove}}, {{sort}}) ném {{UnsupportedOperationException}}.
- List gốc vẫn mutable ⇒ view không an toàn nếu list gốc bị chia sẻ và sửa.
- Cho phép null nếu list gốc cho phép.
- Dùng khi: muốn expose read-only view cho caller nhưng nội bộ vẫn cần mutate; hoặc tạm bọc legacy API.

### Copy thủ công
~~~java
List<String> copy = new ArrayList<>(source);   // shallow copy, mutable
List<String> copy = List.copyOf(source);       // immutable copy (Java 10)
~~~
- {{new ArrayList<>(source)}}: shallow copy, hoàn toàn độc lập, mutable, cho phép null.
- Dùng cho defensive copy trong constructor/setter khi cần sở hữu dữ liệu.

### So sánh nhanh
| Tính chất | List.of/copyOf | unmodifiableList | new ArrayList() |
|---|---|---|---|
| Immutable | **Có** | View (gốc mutable) | Không |
| Null allowed | **Không** | Theo list gốc | Có |
| Bản sao hay view | Bản sao | View | Bản sao |
| Memory | Tối ưu (compact) | Wrapper nhẹ | Mảng mới + ref |
| Serialization | Hỗ trợ | Hỗ trợ | Hỗ trợ |

### Pitfall
- Dùng {{List.of}} cho DTO/response mà dữ liệu có null ⇒ NPE lúc runtime; lọc null trước hoặc dùng {{new ArrayList<>}}.
- Truyền {{unmodifiableList}} cho API bên ngoài mà quên list gốc còn bị mutate nội bộ ⇒ caller thấy dữ liệu "immutable" vẫn thay đổi.
- {{List.copyOf(null)}} ném NPE; {{Collections.unmodifiableList(null)}} ném NPE.
- {{List.of}} không implement {{RandomAccess}} (đánh giá tuần tự), nhưng truy cập index O(1) do mảng backing.

> Senior tip: API public trả về collection **luôn dùng {{List.copyOf}}/{{Set.copyOf}}/{{Map.copyOf}}** (Java 10+) để đảm bảo immutable thực sự; nội bộ dùng {{ArrayList}}/{{HashMap}} mutable. Đừng dùng {{unmodifiableList}} cho API public trừ khi có lý do mạnh (performance cực đoan, list lớn, không muốn copy).`,
  follow: [
    'Vì sao {{List.of}} cấm null trong khi {{ArrayList}} cho phép?',
    '{{List.copyOf}} có tối ưu khi list gốc đã immutable không?',
    'Làm sao tạo immutable list có null được (nếu thực sự cần)?'
  ],
  tags: ['List.of', 'unmodifiableList', 'immutable', 'defensive copy'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-012',
  topic: 'collections',
  level: 'senior',
  q: '{{WeakHashMap}}, {{IdentityHashMap}}: cơ chế và use case thật (cache theo key class, graph traversal).',
  a: `**Tóm tắt:** {{WeakHashMap}} key là {{WeakReference}} — entry tự biến mất khi key không còn strong reference (phù hợp cache metadata theo class/object); {{IdentityHashMap}} dùng {{==}} thay vì {{equals}}/{{hashCode}} (phù hợp graph traversal, object identity). Cả hai không thread-safe.
 
### WeakHashMap
- Entry: key wrap trong {{WeakReference}}, value strong reference.
- GC: khi key chỉ còn weak reference (không ai strong reference tới), GC sẽ clear weak reference ⇒ entry bị xoá ở lần truy cập tiếp theo (hoặc {{expungeStaleEntries}}).
- **Không** tự dọn dẹp ngay lập tức; size() có thể tính entry đang chờ dọn.
- Value **không** được weak — nếu value giữ strong reference ngược về key thì key không bao giờ bị GC.

~~~java
// Cache metadata cho Class (ClassLoader có thể unload)
Map<Class<?>, Meta> cache = new WeakHashMap<>();
Meta getMeta(Class<?> clazz) {
    return cache.computeIfAbsent(clazz, Meta::new);
}
~~~

### Use case WeakHashMap
- **Class/ClassLoader metadata cache**: khi class unload, entry tự dọn.
- **Observer/Listener registry**: listener là key, value là callback; listener GC ⇒ entry tự mất (tránh memory leak).
- **Cache cho object ngắn hạn**: key là object do caller quản lý lifecycle.
- **Không dùng cho**: cache dữ liệu chung (value có thể giữ key), caching nặng (dùng Caffeine/Guava).

### IdentityHashMap
- So sánh key bằng **{{==}}** (identity), không dùng {{equals}}/{{hashCode}}.
- Hash bằng {{System.identityHashCode(key)}} (thường dựa trên address).
- Violation {{Map}} contract (equals/hashCode) — dùng có chủ đích.
- Iterator order không xác định, nhưng ổn định trong một lần duyệt.

### Use case IdentityHashMap
- **Graph traversal**: visited set cho object graph (cycle detection), key là object node — cần identity vì node có thể equals nhau nhưng khác instance.
- **Object-to-metadata mapping**: gắn metadata cho object không kiểm soát {{equals}}/{{hashCode}} (thư viện thứ ba, entity JPA proxy).
- **Serialization/Deep copy**: tracking object đã xử lý.
- **Proxy/Wrapper**: key là proxy instance, equals delegate nhưng identity khác nhau.

### So sánh
| | WeakHashMap | IdentityHashMap |
|---|---|---|
| Key equality | {{equals}} (trên referent) | **{{==}}** (identity) |
| Key reference | {{WeakReference}} | Strong |
| Auto cleanup | Khi key GC | Không |
| Thread-safe | Không | Không |
| Null key | Cho phép | Cho phép |

### Pitfall
- {{WeakHashMap}} size() không chính xác (tính entry stale); dùng {{expungeStaleEntries}} nếu cần.
- {{WeakHashMap}} value giữ key ⇒ leak (circular reference); dùng {{WeakReference}} cho value nếu cần.
- {{IdentityHashMap}} vi phạm contract Map — không dùng cho key có equals/hashCode logic business.
- Cả hai không thread-safe; bọc {{Collections.synchronizedMap}} hoặc dùng concurrent alternative.

> Senior tip: {{WeakHashMap}} là "lưới an toàn" cho metadata cache nhẹ, không thay thế cache production (Caffeine). {{IdentityHashMap}} hiếm dùng nhưng không thể thay thế khi cần identity semantics — đừng cố gắng hack {{equals}}/{{hashCode}} để làm được việc này.`,
  follow: [
    'Vì sao {{WeakHashMap}} value không nên giữ reference ngược về key?',
    '{{IdentityHashMap}} dùng {{System.identityHashCode}} — collision xử lý thế nào?',
    'Khi nào dùng {{WeakHashMap}} thay vì {{ReferenceQueue}} + {{WeakReference}} thủ công?'
  ],
  tags: ['WeakHashMap', 'IdentityHashMap', 'weak reference', 'identity', 'cache'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-013',
  topic: 'collections',
  level: 'senior',
  q: 'Sort trong Java: TimSort ổn định, {{Comparator.comparing().thenComparing()}}, {{nullsFirst}}, lỗi "Comparison method violates its general contract".',
  a: `**Tóm tắt:** Java dùng **TimSort** (hybrid merge/insertion) cho {{Arrays.sort}}/{{Collections.sort}} — ổn định (stable), O(n log n) worst-case, O(n) cho mảng gần đã sort; {{Comparator.composing}} cho phép chain so sánh; {{nullsFirst}}/{{nullsLast}} xử lý null an toàn; vi phạm contract (transitivity, symmetry) ném {{IllegalArgumentException}}.
 
### TimSort
- Kết hợp **merge sort** (ổn định, tốt cho run có sẵn) và **insertion sort** (tốt cho mảng nhỏ/gần sort).
- Tìm "run" (dãy đã sort) tự nhiên, merge chúng; tận dụng data gần sort ⇒ O(n) best case.
- **Stable**: phần tử bằng nhau giữ thứ tự tương đối — quan trọng cho multi-key sort (sort bằng key phụ rồi key chính).
- Từ Java 8: {{Arrays.sort}} primitive dùng dual-pivot quicksort (không stable); object arrays dùng TimSort.

### Comparator chain
~~~java
// Sắp xếp: status ASC, createdAt DESC, name ASC
Comparator<Order> cmp = Comparator
    .comparing(Order::getStatus)
    .thenComparing(Order::getCreatedAt, Comparator.reverseOrder())
    .thenComparing(Order::getName, Comparator.nullsFirst(String::compareTo));
orders.sort(cmp);
~~~
- {{comparing}}: key extractor + optional key comparator.
- {{thenComparing}}: chain thêm comparator cho tie-break.
- {{nullsFirst}}/{{nullsLast}}: wrapper cho comparator con, null coi là nhỏ/lớn nhất.

### Comparator tĩnh hữu ích
- {{Comparator.naturalOrder()}}, {{reverseOrder()}}
- {{Comparator.nullsFirst(naturalOrder())}}, {{nullsLast(...)}}
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} tránh boxing.

### Lỗi "Comparison method violates its general contract"
- Ném khi TimSort phát hiện comparator **không transitive** hoặc **không symmetric**.
- Nguyên nhân thường gặp:
  1. **Comparator dựa trên field nullable** mà không xử lý null: {{a.getName().compareTo(b.getName())}} ném NPE hoặc vi phạm transitivity khi null xen vào.
  2. **Logic so sánh phức tạp sai**: {{(a, b) -> a.x < b.x ? -1 : 1}} (quên case bằng nhau trả 0).
  3. **So sánh float/double** với NaN: {{Double.compare}} xử lý NaN, nhưng tự viết {{a < b ? -1 : 1}} sai với NaN.

~~~java
// Sai: vi phạm transitivity khi có null
Comparator<Person> bad = (a, b) -> a.getName().compareTo(b.getName());

// Đúng: xử lý null tường minh
Comparator<Person> good = Comparator
    .comparing(Person::getName, Comparator.nullsFirst(String::compareTo));
~~~

### Pitfall
- **Primitive array sort không stable**: {{Arrays.sort(int[])}} dùng quicksort; muốn stable dùng {{Integer[]}} hoặc {{List.sort}}.
- **Comparator không consistent với equals**: {{TreeSet}}/{{TreeMap}} dùng comparator, không dùng {{equals}} — nếu comparator trả 0 cho 2 object khác nhau, TreeSet coi là trùng và loại bỏ.
- **Null trong stream sort**: {{stream.sorted()}} ném NPE nếu phần tử null; dùng {{Comparator.nullsFirst}} hoặc lọc trước.
- **Performance**: comparator phức tạp trong hot path — cache key extractor, tránh lambda capture.

> Senior tip: luôn test comparator với {{Collections.sort}} trên dữ liệu có null, trùng giá trị, và kiểm tra stability bằng cách sort 2 lần với key khác nhau. Với data lớn, dùng {{comparingInt}}/{{comparingLong}} để tránh boxing. Đừng tự viết logic so sánh phức tạp — chain các comparator có sẵn.`,
  follow: [
    'Vì sao TimSort ổn định (stable) quan trọng cho multi-key sort?',
    'Primitive array sort ({{Arrays.sort(int[])}}) không stable — làm sao sort stable cho int?',
    'Làm sao debug lỗi "Comparison method violates its general contract" khi stack trace không rõ dòng nào sai?'
  ],
  tags: ['TimSort', 'Comparator', 'sort', 'stable', 'nullsFirst'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-014',
  topic: 'collections',
  level: 'lead',
  q: 'Hash collision và tấn công HashDoS; vì sao treeify giúp; thiết kế {{hashCode}} tốt cho composite key.',
  a: `**Tóm tắt:** hash collision là 2 key khác nhau có {{hashCode}} trùng bucket; HashDoS khai thác collision để biến {{HashMap}} O(1) thành O(n) gây DoS; Java 8 **treeify** chuyển bucket dài ≥ 8 thành cây đỏ-đen O(log n); {{hashCode}} tốt cho composite key dùng {{Objects.hash}} hoặc mix bit thủ công (prime multiplier).
 
### Hash collision cơ bản
- {{HashMap}} index = {{(n-1) & spread(hashCode())}}; capacity luỹ thừa 2 ⇒ chỉ dùng bit thấp.
- Collision: 2 key khác bucket nhưng index trùng ⇒ chuỗi linked list (Java 7) hoặc cây (Java 8+).
- Tần suất collision phụ thuộc chất lượng {{hashCode}} và capacity.

### Tấn công HashDoS (Algorithmic Complexity Attack)
- Kẻ tấn công gửi nhiều key gây collision cố ý ({{hashCode}} trả về cùng giá trị hoặc cùng bucket).
- Ví dụ: {{String}} hash = {{s[0]*31^(n-1) + ...}}; có thể tạo nhiều string khác nhau cùng hash.
- Kết quả: {{put}}/{{get}} degrade thành O(n) ⇒ CPU 100%, request timeout.
- Thực tế: tấn công qua JSON payload, form parameter, header — server parse vào {{HashMap}}.

### Treeify (Java 8) — chống HashDoS
- Ngưỡng: bucket size ≥ {{TREEIFY_THRESHOLD = 8}} **VÀ** capacity ≥ {{MIN_TREEIFY_CAPACITY = 64}} ⇒ chuyển linked list → {{TreeNode}} (red-black tree).
- Tìm kiếm trong cây: O(log n) thay vì O(n).
- Nếu capacity < 64: **resize** gấp đôi thay vì treeify (resize làm bucket phân tán lại, có thể giảm collision).
- Untreeify: bucket size ≤ {{UNTREEIFY_THRESHOLD = 6}} ⇒ chuyển lại list.
- Key trong cây so sánh: trước {{hashCode}}, sau {{Comparable}} (nếu implement), cuối {{tieBreakOrder}} (identity hash) để đảm bảo total order.

### Thiết kế hashCode tốt cho composite key
~~~java
// Cách 1: Objects.hash (Java 7+) — tiện nhưng tạo varargs array
@Override public int hashCode() { return Objects.hash(id, name, category); }

// Cách 2: Thủ công (nhanh hơn, không allocation) — Effective Java
@Override public int hashCode() {
    int result = 17;
    result = 31 * result + (id == null ? 0 : id.hashCode());
    result = 31 * result + (name == null ? 0 : name.hashCode());
    result = 31 * result + (category == null ? 0 : category.hashCode());
    return result;
}

// Cách 3: Record (Java 14+) — tự sinh hashCode đúng contract
record Key(Long id, String name, String category) {}
~~~
- Nguyên tắc: **prime multiplier** (31, 37, 1000003) để phân tán bit; mix bit cao xuống thấp ({{h ^ (h >>> 16)}} như {{HashMap.spread}}).
- {{equals}} phải khớp: so sánh cùng các field.
- Immutable field cho key — key mutable trong map là bug.

### Phòng thủ HashDoS production
- Giới hạn request size, parameter count (Spring: {{spring.mvc.max-request-parameters}}).
- Dùng {{ConcurrentHashMap}} (treeify cũng có) hoặc key không do user kiểm soát (UUID, Long).
- Với input user làm key: hash salt (Java 9+ {{String.hashCode}} không salt, nhưng có thể wrap key).
- Monitoring: theo dõi {{HashMap}} bucket size max qua JMX/heap dump.

> Senior tip: HashDoS hiếm nhưng khi xảy ra rất đau; treeify là lưới an toàn cuối, không phải giải pháp gốc. Gốc là: **không bao giờ dùng input user trực tiếp làm key của HashMap/HashSet không giới hạn**. Dùng UUID/Long ID, hoặc giới hạn số entry, hoặc dùng Caffeine/Guava cache có eviction. Với composite key, dùng record — trình biên dịch sinh {{hashCode}}/{{equals}} chuẩn và không bao giờ sai.`,
  follow: [
    'Vì sao treeify threshold là 8 và untreeify là 6 (không dùng cùng ngưỡng)?',
    '{{Objects.hash}} có allocation varargs — khi nào nên viết thủ công?',
    'Làm sao phát hiện HashDoS đang diễn ra trên production?'
  ],
  tags: ['HashDoS', 'hash collision', 'treeify', 'hashCode', 'composite key']
}
,
{
  id: 'modern-001',
  topic: 'modern',
  level: 'senior',
  q: 'Stream có lazy evaluation thế nào? Phân biệt stateful/stateless operation và khi nào parallel stream có hại?',
  a: `**Tóm tắt:** intermediate operation chỉ **xây pipeline**, chưa chạy; terminal operation mới kéo dữ liệu qua. Stateful op ({{sorted}}, {{distinct}}, {{limit}}) phải giữ trạng thái và có thể phải duyệt hết; parallel stream dùng chung {{ForkJoinPool.commonPool}} nên dễ hại khi có I/O, dữ liệu nhỏ, hoặc tác vụ blocking.

### Lazy evaluation
~~~java
Stream<String> s = names.stream()
    .filter(n -> { System.out.println("filter " + n); return n.length() > 3; })
    .map(String::toUpperCase);       // chưa có dòng nào in ra
List<String> out = s.toList();       // terminal -> mới chạy
~~~
- Mỗi phần tử đi qua toàn bộ pipeline trước khi sang phần tử tiếp theo (trừ op stateful), nhờ vậy short-circuit hiệu quả.
- {{findFirst}}, {{anyMatch}}, {{limit}} có thể dừng sớm; {{forEach}} thì không.
- Stream **single-use**: dùng lại ném {{IllegalStateException}}.
- Không có terminal operation ⇒ không có gì chạy; đây là lỗi hay gặp khi quên {{collect}}/{{forEach}}.

### Stateful vs stateless
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}}, {{mapToInt}} — xử lý từng phần tử độc lập.
- **Stateful**: {{distinct}}, {{sorted}}, {{limit}}, {{skip}}, {{takeWhile}}/{{dropWhile}} — cần buffer hoặc biết toàn bộ dữ liệu.
- {{sorted}} trên stream vô hạn sẽ không bao giờ kết thúc; {{distinct}} phải nhớ mọi giá trị đã thấy.
- Stateful op làm parallel kém hiệu quả vì phải đồng bộ/merge; {{limit}} trong parallel đặc biệt tốn kém.

### Parallel stream
- Mặc định dùng {{ForkJoinPool.commonPool()}} với số thread = CPU - 1. Mọi parallel stream trong JVM **chia sẻ** pool này.
- Có hại khi:
  - Tác vụ **blocking** (gọi DB, HTTP, file): thread pool cạn, các stream khác đói; thậm chí deadlock nếu task chờ nhau.
  - Dữ liệu nhỏ: chi phí split/merge/fork lớn hơn lợi ích.
  - Nguồn dữ liệu khó split: {{LinkedList}}, {{Iterator}}, {{Stream.iterate}} — splitting kém.
  - Có stateful op nặng hoặc side effect không thread-safe.
  - Chạy trong môi trường đã có thread pool riêng (web request) — dễ tranh chấp.
- Có lợi khi: dữ liệu lớn, CPU-bound, nguồn split tốt (ArrayList, mảng), op stateless, không blocking.
- Quy tắc ước lượng của Brian Goetz: N * Q > 10.000 (N = số phần tử, Q = chi phí mỗi phần tử) mới đáng parallel.
- Muốn dùng pool riêng: submit vào {{ForkJoinPool}} custom, không đặt {{parallelStream}} trực tiếp trong request thread.

### Pitfall
- {{peek}} để debug có thể không chạy nếu không có terminal op hoặc bị short-circuit.
- Side effect trong {{map}}/{{forEach}} (add vào list ngoài) không an toàn khi parallel; dùng {{collect}}.
- {{Stream.iterate}} vô hạn + {{parallel}} chia rất kém; dùng {{Stream.iterate(seed, hasNext, next)}} (Java 9) hoặc generator phù hợp.
- Quên đóng stream có tài nguyên ({{Files.lines}}, {{Files.list}}) — dùng try-with-resources.

> Senior tip: mặc định viết stream tuần tự cho rõ ràng; chỉ bật parallel khi có benchmark chứng minh và dữ liệu đủ lớn. Trong service web, đừng gọi {{parallelStream}} cho I/O — dùng virtual thread (Java 21) hoặc executor có bound.`,
  follow: [
    'Vì sao {{sorted}} trên stream vô hạn không bao giờ trả về?',
    '{{findFirst}} và {{findAny}} khác nhau thế nào trong parallel?',
    'Làm sao dùng ForkJoinPool riêng cho parallel stream?'
  ],
  tags: ['Stream', 'lazy', 'parallel', 'ForkJoinPool'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-002',
  topic: 'modern',
  level: 'mid',
  q: '{{Optional}} nên và không nên dùng ở đâu? Phân biệt {{orElse}}/{{orElseGet}}, {{of}}/{{ofNullable}} và các pitfall thường gặp.',
  a: `**Tóm tắt:** {{Optional}} là **kiểu trả về** để buộc caller xử lý "có thể không có"; không dùng làm field, tham số, hay phần tử collection; tránh {{get()}} trần, dùng {{orElseGet}} khi giá trị mặc định đắt, và {{ofNullable}} khi nguồn có thể null.

### Mục đích
- Thay cho việc trả {{null}} để API tự mô tả khả năng vắng mặt.
- Không phải để thay mọi null; nó là tín hiệu ở **biên API**, nhất là khi không có exception tự nhiên.
- Không thiết kế cho hiệu năng cao: mỗi {{Optional}} là một object; escape analysis có thể loại bỏ nhưng không đảm bảo.

### Nên
- Method trả về có thể không có kết quả: {{Optional<User> findById(long id)}}.
- Chuỗi xử lý: {{optional.map(User::email).filter(s -> !s.isBlank()).orElse(DEFAULT)}}.
- {{orElseThrow(() -> new NotFoundException(...))}} để biến vắng mặt thành lỗi rõ ràng.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9) để chuyển thành stream.

### Không nên
- **Field** của entity/DTO: không Serializable, khó map JPA/Jackson (cần module), tăng phức tạp; dùng null + validate.
- **Tham số method**: caller phải bọc {{Optional.of(...)}} vô ích; dùng overload hoặc validate null.
- **Collection**: {{List<Optional<T>>}} thường là dấu hiệu nên lọc bỏ null; trả list rỗng thay vì Optional rỗng.
- **Key của Map**: Optional không có hashCode/equals phù hợp ngữ nghĩa? Thực ra có, nhưng dùng làm key là lạm dụng.
- **Primitive**: dùng {{OptionalInt}}/{{OptionalLong}}/{{OptionalDouble}} để tránh boxing, nhưng API này ít được ưa chuộng.

### orElse vs orElseGet
~~~java
// orElse: tham số được tính NGAY, kể cả khi Optional có giá trị
User u1 = opt.orElse(loadFromDb());       // luôn gọi DB -> lãng phí

// orElseGet: supplier chỉ gọi khi rỗng
User u2 = opt.orElseGet(() -> loadFromDb());
~~~
- {{orElse}} nhận giá trị đã có; nếu tạo object/đọc DB thì dùng {{orElseGet}}.
- {{orElseThrow()}} (Java 10) ném {{NoSuchElementException}}; bản có supplier cho exception tùy biến.

### of vs ofNullable
- {{Optional.of(x)}} ném NPE nếu x null — dùng khi chắc chắn không null.
- {{Optional.ofNullable(x)}} cho phép null → {{Optional.empty()}}.
- {{Optional.empty()}} là singleton, dùng khi biết chắc không có.

### Pitfall
- {{opt.get()}} không kiểm tra ⇒ {{NoSuchElementException}}, tương đương null nhưng khó debug hơn. Dùng {{orElseThrow}} với message.
- {{opt.isPresent()}} rồi {{get()}} là code null-check trá hình; ưu tiên {{map}}/{{ifPresent}}.
- So sánh {{opt == Optional.empty()}} sai; dùng {{isEmpty()}} (Java 11) hoặc {{isPresent()}}.
- {{Optional}} trong entity JPA gây lỗi mapping; trong Jackson cần {{Jdk8Module}}.
- Lạm dụng {{Optional}} cho mọi thứ làm code rối và chậm; đôi khi trả null có kiểm soát + {{@Nullable}} lại thực dụng hơn.

> Senior tip: dùng {{Optional}} ở tầng service/repository, còn ở tầng controller/DTO hãy chuyển về giá trị hoặc lỗi rõ ràng. Đừng bọc Optional quanh collection — trả {{List.of()}} rỗng để caller không phải xử lý hai tầng "không có".`,
  follow: [
    'Vì sao {{Optional}} không nên làm field của entity JPA?',
    '{{Optional.stream()}} dùng để làm gì?',
    'Khi nào trả null tốt hơn trả {{Optional}}?'
  ],
  tags: ['Optional', 'orElse', 'ofNullable', 'API design']
},
{
  id: 'modern-003',
  topic: 'modern',
  level: 'senior',
  q: 'Record có những đặc điểm gì? Compact constructor hoạt động ra sao, và record có làm DTO/JPA entity được không?',
  a: `**Tóm tắt:** record là class **final**, bất biến theo khai báo, tự sinh accessor/{{equals}}/{{hashCode}}/{{toString}}, có canonical constructor; compact constructor dùng để validate/chuẩn hoá; record rất hợp làm DTO/value object nhưng **không** hợp làm JPA entity.

### Đặc điểm
- Khai báo {{record Point(int x, int y)}} sinh:
  - field {{private final}} cho từng component.
  - accessor {{x()}}, {{y()}} (không phải {{getX()}}).
  - {{equals}}/{{hashCode}} theo tất cả component; {{toString}} dạng {{Point[x=1, y=2]}}.
  - canonical constructor nhận đủ component.
- Không thể kế thừa class khác (đã final), nhưng **implement interface** được; có thể có static field/method, instance method phụ.
- Không có setter; "sửa" bằng cách tạo record mới.
- Serialization của record dùng canonical constructor và component, không dùng cơ chế field mặc định; không cần {{serialVersionUID}} (nhưng có thể khai báo).
- Record pattern (Java 21) cho phép destructure trong {{instanceof}}/switch.

### Compact constructor
~~~java
record Range(int lo, int hi) {
    Range {                          // không có danh sách tham số
        if (lo > hi) throw new IllegalArgumentException("lo > hi");
        // gán ngầm vào field sau khi validate
    }
}
record Order(String id, List<Item> items) {
    Order {
        Objects.requireNonNull(id);
        items = List.copyOf(items);   // defensive copy cho component mutable
    }
}
~~~
- Compact constructor chạy **trước** khi field được gán; có thể reassign tham số để chuẩn hoá.
- Không được truy cập {{this}} trước khi gán; không gọi method instance.
- Có thể khai báo canonical constructor đầy đủ nếu cần, hoặc constructor phụ gọi {{this(...)}}.

### DTO
- Rất tốt: ít boilerplate, bất biến, dễ đọc, {{equals}} đúng.
- Jackson hỗ trợ record từ 2.12 (cần {{jackson-databind}} mới); nhiều thư viện mapping hỗ trợ.
- Bean Validation: annotation trên component được áp dụng (cần cấu hình phù hợp).
- Hạn chế: không có kế thừa, không có default value trực tiếp (phải qua constructor phụ), một số framework cũ yêu cầu no-arg constructor/getter.
- Với DTO lớn, record vẫn ổn; nhưng nếu cần mutate dần khi build, dùng builder + class thường.

### JPA entity
- **Không nên**: JPA yêu cầu no-arg constructor (có thể protected), field không final, proxy cho lazy loading cần subclass (Hibernate tạo proxy), dirty checking dựa trên snapshot field mutable.
- Record là final nên Hibernate không tạo proxy được; accessor không theo chuẩn getter; field final không set được khi load.
- Hibernate 6 có hỗ trợ record cho một số trường hợp ({{@Embeddable}}, projection) nhưng entity vẫn nên là class thường.
- Có thể dùng record làm **projection** trong JPQL constructor expression hoặc interface projection; rất tiện cho read-only.
- Với DTO từ entity, map thủ công hoặc MapStruct.

### Pitfall
- Record không tự deep-copy component mutable; phải {{List.copyOf}} trong compact constructor.
- {{equals}} của record dùng tất cả component; nếu có field cache/derived, đừng thêm vào record.
- Không dùng record cho object cần thay đổi nhiều lần (builder pattern phù hợp hơn).
- Reflection/serialization framework cũ có thể không nhận record.

> Senior tip: dùng record cho **value object và DTO**, còn entity JPA giữ class thường. Trong compact constructor, luôn validate và copy collection; đây là nơi duy nhất đảm bảo bất biến thực sự.`,
  follow: [
    'Vì sao Hibernate không tạo proxy được cho record?',
    'Compact constructor khác canonical constructor ở điểm nào?',
    'Record pattern (Java 21) giúp gì khi xử lý dữ liệu lồng nhau?'
  ],
  tags: ['record', 'compact constructor', 'DTO', 'JPA'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-004',
  topic: 'modern',
  level: 'senior',
  q: 'Sealed class và pattern matching for switch (Java 21) hoạt động thế nào? Exhaustiveness đảm bảo gì và có pitfall gì?',
  a: `**Tóm tắt:** {{sealed}} giới hạn tập class con được phép kế thừa, giúp mô hình hoá **algebraic data type**; switch pattern (Java 21) cho phép match theo kiểu + guard và compiler kiểm tra **exhaustive** nếu hierarchy sealed, nhưng vẫn cần xử lý {{null}} và cẩn thận khi thêm subtype mới.

### Sealed
~~~java
sealed interface Shape permits Circle, Square, Triangle {}
record Circle(double r) implements Shape {}
record Square(double side) implements Shape {}
record Triangle(double a, double b, double c) implements Shape {}
~~~
- Subclass phải {{final}}, {{sealed}} hoặc {{non-sealed}}.
- Subclass phải nằm cùng module (hoặc cùng package nếu unnamed module) với sealed type.
- Có thể dùng {{permits}} tường minh hoặc để compiler suy ra từ các class cùng file.
- Lợi ích: đóng tập kiểu, cho phép compiler kiểm tra đầy đủ, tài liệu hoá domain.

### Pattern matching for switch
~~~java
double area(Shape s) {
    return switch (s) {
        case Circle c            -> Math.PI * c.r() * c.r();
        case Square q            -> q.side() * q.side();
        case Triangle t          -> heron(t);
        // không cần default vì Shape sealed và đã phủ hết
    };
}
~~~
- Java 21 cho phép switch trên bất kỳ reference type, kết hợp type pattern, record pattern, guard {{when}}.
- {{case null}} có thể khai báo riêng; nếu không, switch pattern ném NPE khi selector null (khác switch cũ trên String cũng NPE).
- Thứ tự case quan trọng: case cụ thể phải trước case tổng quát, nếu không compiler báo lỗi "dominated".
- {{when}} guard: {{case Circle c when c.r() > 10 -> ...}}.
- Record pattern lồng: {{case Point(int x, int y) -> ...}}; có thể destructure sâu.
- Exhaustiveness: với sealed hierarchy, compiler biết mọi subtype và bắt buộc phủ hết; với interface không sealed, cần {{default}}.

### Exhaustiveness đảm bảo gì
- Nếu thêm một subtype mới vào sealed interface, **mọi switch thiếu case sẽ lỗi compile** — đây là lợi ích lớn so với visitor/if-else, giúp refactor an toàn.
- Với switch expression, thiếu case là lỗi compile (không như switch statement cũ).
- Tuy nhiên, exhaustiveness chỉ đúng khi hierarchy thực sự sealed và compiler thấy hết subtype; nếu dùng {{non-sealed}} thì mất tính chất này.

### Pitfall
- {{null}}: quên xử lý ⇒ NPE runtime; thêm {{case null -> ...}} nếu dữ liệu có thể null.
- Thứ tự case: pattern tổng quát đứng trước làm case sau không bao giờ chạy, compiler báo lỗi nhưng đôi khi thông báo khó hiểu.
- Sealed không ngăn được việc dùng reflection/unsafe, nhưng trong code thường ngày đủ tốt.
- Preview: pattern matching switch là preview ở 17-20, **final từ 21**; nếu build bằng 17 phải bật {{--enable-preview}} và không dùng được trong production (preview không tương thích).
- Từ Java 21, switch **statement** dùng pattern hoặc {{case null}} cũng bắt buộc exhaustive; chỉ switch statement kiểu cũ (hằng enum/String/int) mới được phép thiếu case mà vẫn compile — nên ưu tiên switch expression để luôn được kiểm tra.
- Không lạm dụng sealed cho mọi interface: chỉ dùng khi tập subtype thực sự đóng và bạn kiểm soát được.

> Senior tip: sealed + record + switch exhaustive là bộ ba thay thế visitor pattern rất gọn cho domain ít thay đổi. Nhưng nếu domain mở cho plugin bên ngoài, đừng sealed — bạn sẽ chặn việc mở rộng.`,
  follow: [
    'Vì sao switch pattern trên sealed type không cần {{default}}?',
    '{{non-sealed}} dùng khi nào và ảnh hưởng gì tới exhaustiveness?',
    'Switch pattern xử lý {{null}} khác switch trên String thế nào?'
  ],
  tags: ['sealed', 'pattern matching', 'switch', 'Java 21'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-005',
  topic: 'modern',
  level: 'lead',
  q: 'Từ Java 8 lên 21, tính năng nào đáng giá nhất khi nâng cấp hệ thống? Lộ trình migrate 8 → 17/21 nên làm thế nào?',
  a: `**Tóm tắt:** giá trị lớn nhất là **GC/performance** (G1 mặc định, ZGC), **ngôn ngữ** (record, sealed, pattern matching, switch expression, text block), **runtime** (virtual thread ở 21, strong encapsulation), và **bảo mật/vòng đời**; migrate nên theo bước 8 → 11 → 17 → 21, chạy test + jdeps, xử lý reflection/module trước khi đổi LTS.

### Tính năng đáng giá
- **Java 9**: collection factory {{List.of}}/{{Map.of}}, {{Optional}} bổ sung, private interface method, try-with-resources với biến effectively final, module system (có thể chưa dùng ngay).
- **Java 10**: {{var}} cho local.
- **Java 11 (LTS)**: {{String.isBlank}}/{{strip}}/{{lines}}/{{repeat}}, {{Files.readString}}, HTTP Client chuẩn, chạy single-file {{java Foo.java}}, {{Optional.isEmpty}}.
- **Java 14-16**: switch expression, text block, record, {{instanceof}} pattern, {{helpful NullPointerException}} (rất hữu ích debug).
- **Java 17 (LTS)**: sealed class, strong encapsulation mặc định, bỏ SecurityManager dần, nhiều cải tiến GC.
- **Java 21 (LTS)**: **virtual thread** (JEP 444), pattern matching for switch, record pattern, sequenced collection ({{getFirst}}/{{getLast}}/{{reversed}}), generational ZGC, key encapsulation API.
- **GC**: G1 mặc định từ 9; ZGC (11+) và Shenandoah cho pause thấp; Epsilon cho benchmark. Từ 21, ZGC generational cải thiện throughput.
- **Khác**: Compact Strings (9), AppCDS mặc định (12+), container awareness (10+), TLS 1.3, cải thiện startup.

### Vì sao nâng cấp
- Bảo mật: bản cũ không còn nhận patch.
- Hiệu năng: GC và JIT tốt hơn; G1/ZGC giảm pause.
- Hệ sinh thái: Spring Boot 3 yêu cầu Java 17; nhiều thư viện mới bỏ hỗ trợ 8.
- Virtual thread giảm chi phí thread cho I/O, đơn giản hoá code blocking.

### Lộ trình migrate
1. **Đo baseline**: test suite, JMH, heap/GC log, dependency tree.
2. **8 → 11**: chạy {{jdeps --jdk-internals}}, thay API bị bỏ (JAXB, JAX-WS, CORBA, Nashorn), cập nhật TLS, xử lý {{--illegal-access}} (11 còn cho phép, 17 thì chặt).
3. **11 → 17**: dọn reflection vào JDK internals ({{--add-opens}}), nâng Spring Boot 3 nếu dùng, kiểm tra thư viện bytecode (Lombok, CGLIB, Mockito) tương thích.
4. **17 → 21**: tận dụng pattern matching/record, thử virtual thread ở nơi I/O-bound nhưng **đo lại** (pin carrier thread với synchronized trước Java 24; connection pool cần điều chỉnh).
5. **CI**: chạy song song JDK cũ/mới, test integration, smoke test trên staging với tải thật.
6. **Rollout**: container image mới, có thể blue-green; theo dõi GC, latency p99, memory.

### Pitfall
- Nhảy thẳng 8 → 21 làm gỡ lỗi khó hơn nhiều; đi từng LTS giúp khoanh vùng.
- Reflection/bytecode instrumentation (agent APM, Lombok cũ) là chỗ vỡ nhiều nhất.
- Thư viện cũ dùng {{sun.misc.Unsafe}}: vẫn chạy ở 17/21, nhưng các method truy cập bộ nhớ bị deprecate for removal từ Java 23 (JEP 471) và in cảnh báo runtime từ 24 (JEP 498); nên lên kế hoạch chuyển sang {{VarHandle}}/FFM API.
- Virtual thread không nhanh hơn cho CPU-bound; đừng thay toàn bộ thread pool.
- {{--add-opens}} là giải pháp tạm; hãy sửa code/thư viện.
- Kiểm tra TLS, chứng chỉ, và độ tương thích của driver DB.

> Senior tip: hãy coi migrate JDK là dự án có kế hoạch, không phải đổi version trong pom. Bắt đầu bằng việc chạy test trên JDK mới trong CI **trước khi** đổi production; dùng jdeprscan để tìm API sắp bỏ và OpenRewrite để tự động hoá một phần.`,
  follow: [
    'Vì sao nên đi qua từng LTS thay vì nhảy thẳng 8 → 21?',
    'Virtual thread giải quyết vấn đề gì và không giải quyết vấn đề gì?',
    'Strong encapsulation từ Java 17 ảnh hưởng thư viện cũ ra sao?'
  ],
  tags: ['Java 21', 'migration', 'LTS', 'virtual threads']
},
{
  id: 'modern-006',
  topic: 'modern',
  level: 'mid',
  q: '{{var}}, text block và switch expression: lợi ích thực tế và pitfall cần tránh là gì?',
  a: `**Tóm tắt:** {{var}} giảm boilerplate nhưng chỉ dùng cho local và nên giữ tên biến rõ nghĩa; text block viết chuỗi nhiều dòng dễ đọc, cần hiểu quy tắc bỏ indentation; switch expression trả giá trị, không fallthrough, và bắt buộc exhaustive.

### var (Java 10)
- Suy luận kiểu lúc compile từ initializer; không phải dynamic typing, không có chi phí runtime.
- Chỉ dùng cho **biến local**, cả trong for/foreach, try-with-resources; không dùng cho field, tham số, return type.
- Không dùng khi không có initializer: {{var x;}} sai; {{var x = null;}} cũng sai.
- Nên dùng khi kiểu dài và lộ rõ từ vế phải: {{var users = new ArrayList<User>();}}, {{var entry = map.entrySet().iterator().next();}}.
- Không nên khi kiểu không rõ: {{var result = service.process();}} — người đọc phải nhảy vào method. Ưu tiên tên biến mô tả kiểu hoặc giữ kiểu tường minh.
- Pitfall: {{var}} với anonymous class vẫn giữ được kiểu anonymous (khác diamond), nhưng hiếm dùng; {{var}} cho tham số lambda (Java 11) chủ yếu để gắn annotation, ví dụ {{(@NonNull var s) -> s.length()}}.
- Không ảnh hưởng API công khai; đừng lạm dụng để code ngắn mà khó đọc.

### Text block (Java 15)
~~~java
String sql = """
        SELECT id, name
        FROM users
        WHERE active = true
        ORDER BY name
        """;
~~~
- Mở bằng ba dấu nháy kép + xuống dòng bắt buộc; đóng bằng ba dấu nháy kép.
- **Incidental whitespace** (indentation chung nhỏ nhất + whitespace cuối dòng) được bỏ; dùng semantics của {{stripIndent}}.
- Ký tự cuối trước dấu đóng ảnh hưởng newline cuối; cần cẩn thận khi so sánh.
- Escape vẫn hoạt động; có {{ \\s }} để giữ space cuối; không cần escape dấu nháy kép đơn lẻ.
- Có {{formatted}} hoặc {{String.format}}; không có interpolation trực tiếp (String template đã rút khỏi 23).
- Rất hợp SQL/JSON/HTML/XML; nhưng **đừng** ghép dữ liệu người dùng vào SQL text block — vẫn dùng PreparedStatement.

### Switch expression (Java 14)
~~~java
String label = switch (status) {
    case ACTIVE, PENDING -> "mo";
    case CLOSED -> "dong";
    case null -> "khong ro";         // case null cần Java 21
    default -> "khac";
};
~~~
- Dùng {{->}} không fallthrough, không cần {{break}}; có thể dùng block + {{yield}}.
- Bắt buộc bao phủ hết (exhaustive) cho expression; enum/String phải có default nếu không đủ.
- Selector null: ném NPE nếu không có {{case null}} (với switch trên reference type).
- Có thể trả giá trị trực tiếp, giảm biến tạm và lỗi gán thiếu nhánh.
- Switch statement vẫn có thể dùng cú pháp cũ; nên chuyển dần sang arrow để tránh fallthrough.
- Với enum, thêm hằng số mới mà quên case sẽ lỗi compile ở switch expression — lợi ích lớn khi refactor.

### Pitfall chung
- {{var}} làm code khó đọc khi kiểu quan trọng cho người review; đừng dùng ở API public.
- Text block giữ indentation bất ngờ nếu dấu đóng đặt sai cột; dùng IDE format và test chuỗi.
- Switch expression trên {{null}} khác switch cũ; nếu dữ liệu có thể null, thêm {{case null}} hoặc kiểm tra trước.
- Đừng dùng text block để build câu SQL động; đó là lỗi bảo mật, không phải lỗi style.

> Senior tip: dùng text block cho SQL/JSON cố định trong test hoặc query, còn dữ liệu động vẫn bind qua placeholder. Với {{var}}, quy ước nội bộ nên là: dùng khi vế phải đã nói rõ kiểu, tránh khi gọi method trả về kiểu phức tạp.`,
  follow: [
    'Vì sao {{var}} không dùng được cho field hay tham số?',
    'Text block bỏ indentation theo quy tắc nào?',
    'Switch expression xử lý enum thiếu case ra sao?'
  ],
  tags: ['var', 'text block', 'switch expression', 'Java 15']
},
{
  id: 'modern-007',
  topic: 'modern',
  level: 'mid',
  q: 'Functional interface, lambda capture "effectively final" và method reference hoạt động thế nào? Có pitfall gì?',
  a: `**Tóm tắt:** functional interface có đúng **một** abstract method (SAM); lambda chỉ capture biến local **effectively final** (không gán lại) và capture theo giá trị; method reference là cú pháp gọn cho lambda, nhưng có thể gây nhập nhằng hoặc boxing nếu không để ý.

### Functional interface
- Interface có một abstract method, ví dụ {{Runnable}}, {{Comparator<T>}}, {{Function<T,R>}}, {{Predicate<T>}}.
- {{@FunctionalInterface}} chỉ là kiểm tra compile, không bắt buộc.
- Có thể có default/static method; chúng không tính vào SAM.
- Lambda không tạo class mới cho mỗi biểu thức: compiler dùng {{invokedynamic}} + {{LambdaMetafactory}} để sinh implementation, thường nhẹ hơn anonymous class.
- Có thể dùng method reference ở mọi nơi cần functional interface.

### Lambda capture
- Lambda capture biến local bằng **giá trị** tại thời điểm tạo; biến phải **effectively final** (không bị gán lại sau khi khởi tạo).
- Field của enclosing object thì không bị ràng buộc này; lambda giữ {{this}} và đọc field qua đó (nên field có thể thay đổi).
- {{this}} trong lambda trỏ **enclosing instance**, khác anonymous class (trong anonymous class {{this}} là instance của anonymous class).
- Không thể dùng {{break}}/{{continue}} nhảy ra ngoài lambda; {{return}} trong lambda là return của lambda.
- Vòng lặp tạo nhiều lambda capture biến đổi → lỗi compile; dùng biến local mới trong mỗi vòng.

~~~java
int base = 10;                 // không gán lại -> OK
Function<Integer, Integer> f = x -> x + base;

int count = 0;
// count++;                    // nếu gán lại thì lambda dưới không compile
Runnable r = () -> System.out.println(count);

String prefix = "ID-";
List<String> ids = items.stream()
    .map(s -> prefix + s)      // capture prefix
    .toList();
~~~

### Method reference
- 4 dạng: static ({{Integer::parseInt}}), instance của object cụ thể ({{System.out::println}}), unbound instance ({{String::length}} tương đương {{s -> s.length()}}), constructor ({{ArrayList::new}}).
- Ưu điểm: ngắn, rõ khi method đã có tên tốt.
- Nhược điểm: có thể khó hiểu khi chain dài; đôi khi lambda rõ hơn (nhất là khi cần đặt tên tham số).
- Nhập nhằng: overload có thể làm method reference không compile; phải chỉ rõ kiểu hoặc dùng lambda.
- Boxing: {{Function<Integer,Integer> f = x -> x + 1}} vẫn boxing; dùng {{IntUnaryOperator}} nếu cần tránh.
- Method reference không tự truyền thêm tham số; với method cần state, phải bind trước.

### Pitfall
- Capture biến mutable bằng cách tạo mảng một phần tử hoặc {{AtomicInteger}} — chạy được nhưng dễ sinh race; ưu tiên thiết kế lại.
- Lambda trong vòng lặp capture biến vòng lặp (biến đổi) → lỗi compile; copy ra biến local.
- Checked exception không đi qua functional interface chuẩn; phải wrap hoặc viết interface riêng.
- Serializability: lambda chỉ serializable nếu target type là {{Serializable}}; không nên dựa vào.
- {{peek}}/{{forEach}} với side effect trong parallel không an toàn.
- Method reference tới method có side effect ẩn có thể gây bất ngờ; đọc kỹ.

> Senior tip: dùng method reference khi nó làm code dễ đọc hơn, nhưng đừng ép; một lambda có tên tham số rõ đôi khi tốt hơn {{Foo::bar}}. Và với hot path, cân nhắc functional interface primitive chuyên dụng để tránh boxing.`,
  follow: [
    'Vì sao biến local capture phải effectively final?',
    '{{this}} trong lambda và anonymous class khác nhau thế nào?',
    'Khi nào method reference gây nhập nhằng overload?'
  ],
  tags: ['lambda', 'functional interface', 'method reference', 'effectively final']
},
{
  id: 'modern-008',
  topic: 'modern',
  level: 'senior',
  q: '{{Collectors.groupingBy}}/{{toMap}} có những pitfall gì (duplicate key, null value) và cách xử lý đúng?',
  a: `**Tóm tắt:** {{toMap}} ném {{IllegalStateException}} khi key trùng và NPE khi value null; {{groupingBy}} ném NPE khi classifier trả null; cách xử lý là cung cấp merge function, lọc null trước, hoặc dùng downstream phù hợp.

### toMap
~~~java
// sai: trùng key -> IllegalStateException
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(User::email, u -> u));

// đúng: chọn bản ghi thắng
Map<String, User> byEmail = users.stream()
    .collect(Collectors.toMap(
        User::email,
        u -> u,
        (a, b) -> b,              // hoặc merge theo updatedAt
        LinkedHashMap::new));     // giữ thứ tự nếu cần
~~~
- Key trùng: bản không có merge function ném {{IllegalStateException}} ("Duplicate key ...", từ Java 9 kèm cả hai value).
- Value null: **NPE** — bản 2 tham số kiểm tra {{requireNonNull(value)}}, bản có merge function dùng {{Map.merge}} vốn cấm value null; lọc bằng {{filter(Objects::nonNull)}} hoặc thay bằng sentinel.
- Key null: {{HashMap}} vẫn nhận (hash của null là 0) nhưng {{ConcurrentHashMap}} thì không; đừng dựa vào key null, hãy lọc hoặc đảm bảo key không null.
- Không có merge function thì không thể biết giữ bản nào; đừng bỏ qua lỗi này bằng cách nuốt exception.

### groupingBy
- {{groupingBy(classifier)}} trả {{Map<K, List<T>>}}; classifier trả null ⇒ NPE (do {{computeIfAbsent}}/key null).
- Downstream: {{counting()}}, {{mapping()}}, {{summingInt()}}, {{averagingInt()}}, {{joining()}}, {{toSet()}}, {{collectingAndThen()}}.
- Muốn map con là {{Set}} hoặc kiểu khác: truyền downstream {{toSet()}}, {{toMap()}}...
- Muốn giữ thứ tự: {{groupingBy(classifier, LinkedHashMap::new, downstream)}}.
- Muốn sắp xếp: {{TreeMap::new}}; nhưng nhớ comparator/equals consistency.
- {{partitioningBy}} chỉ chia hai nhóm true/false, luôn có cả hai key.

### Các collector hữu ích
- {{teeing}} (Java 12): kết hợp hai collector, ví dụ vừa đếm vừa tính trung bình.
- {{flatMapping}} (Java 9): flatten collection trong downstream.
- {{filtering}} (Java 9): lọc trước khi collect downstream.
- {{collectingAndThen}}: biến đổi kết quả cuối (ví dụ wrap unmodifiable).

### Pitfall
- Dùng {{toMap}} rồi ngạc nhiên vì mất dữ liệu: thực ra nó ném exception, nhưng nếu có merge function trả sai thì mất âm thầm.
- {{groupingBy}} với classifier null: dữ liệu bẩn làm nổ toàn bộ pipeline; lọc trước.
- Value null trong downstream {{toMap}} vẫn NPE; kiểm tra kỹ.
- Dùng {{HashMap}} mặc định rồi phụ thuộc thứ tự: kết quả không đảm bảo; dùng {{LinkedHashMap}}/{{TreeMap}}.
- Song song: collector **không** cần container thread-safe (mỗi thread có container riêng rồi gộp bằng combiner), nhưng supplier/accumulator/combiner tự viết phải đúng và không dùng state chia sẻ.
- Tránh side effect trong classifier/downstream; collector nên là hàm thuần.

> Senior tip: khi map dữ liệu từ DB, luôn giả định key có thể trùng và value có thể null; viết merge function rõ ràng (ví dụ giữ bản mới nhất theo timestamp) thay vì để exception nổ ở production. Và với báo cáo, dùng {{LinkedHashMap}}/{{TreeMap}} để thứ tự ổn định giữa các lần chạy.`,
  follow: [
    'Vì sao {{toMap}} ném NPE khi value null?',
    'Làm sao group theo nhiều tiêu chí lồng nhau?',
    '{{teeing}} dùng trong tình huống nào?'
  ],
  tags: ['Collectors', 'groupingBy', 'toMap', 'Stream'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-009',
  topic: 'modern',
  level: 'senior',
  q: '{{SequencedCollection}} / {{SequencedMap}} (Java 21): giải quyết vấn đề gì, {{getFirst}}/{{getLast}}/{{reversed}}.',
  a: `**Tóm tắt:** Java 21 thêm interface {{SequencedCollection}} và {{SequencedMap}} để thống nhất API truy cập đầu/cuối và đảo ngược cho các collection có thứ tự ({{List}}, {{Deque}}, {{LinkedHashSet}}, {{LinkedHashMap}}, {{TreeSet}}, {{TreeMap}}); trước đây mỗi loại có method riêng ({{getFirst}}/{{getLast}}, {{first}}/{{last}}, {{peekFirst}}/{{peekLast}}).
 
### Vấn đề trước Java 21
| Collection | First | Last | Reversed |
|---|---|---|---|
| {{List}} | {{get(0)}} | {{get(size-1)}} | {{Collections.reverse}} (mutate) hoặc {{ListIterator}} |
| {{Deque}} | {{getFirst}}/{{peekFirst}} | {{getLast}}/{{peekLast}} | {{descendingIterator}} |
| {{LinkedHashSet}} | Không có | Không có | Không có |
| {{SortedSet}}/{{TreeSet}} | {{first}} | {{last}} | {{descendingSet}} |
| {{LinkedHashMap}} | Không có | Không có | Không có |
| {{SortedMap}}/{{TreeMap}} | {{firstKey}} | {{lastKey}} | {{descendingMap}} |

- API không thống nhất, khó viết code generic cho "collection có thứ tự".
- {{Collections.reverse}} mutate list gốc; muốn view reversed phải tự viết wrapper.

### SequencedCollection (extends Collection)
- {{getFirst()}} / {{getLast()}}: lấy phần tử đầu/cuối (ném {{NoSuchElementException}} nếu rỗng).
- {{addFirst(E)}} / {{addLast(E)}}: thêm đầu/cuối (optional, {{UnsupportedOperationException}} nếu immutable).
- {{removeFirst()}} / {{removeLast()}}: xoá đầu/cuối (optional).
- {{reversed()}}: trả **view** đảo ngược (read-only, không copy, thay đổi gốc ảnh hưởng view).

~~~java
List<String> list = new ArrayList<>(List.of("a", "b", "c"));
list.getFirst();           // "a"
list.getLast();            // "c"
for (String s : list.reversed()) { ... }  // c, b, a
~~~

### SequencedMap (extends Map)
- {{firstEntry()}} / {{lastEntry()}}: {{Map.Entry}} đầu/cuối.
- {{firstKey()}} / {{lastKey()}}: key đầu/cuối.
- {{putFirst}}, {{putLast}}: thêm đầu/cuối (optional).
- {{reversed()}}: view đảo ngược (entry set reversed).
- {{sequencedKeySet()}}, {{sequencedValues()}}, {{sequencedEntrySet()}}: view có thứ tự.

~~~java
LinkedHashMap<String, Integer> map = new LinkedHashMap<>();
map.put("a", 1); map.put("b", 2);
map.firstKey();           // "a"
map.lastEntry();          // b=2
for (var e : map.reversed().entrySet()) { ... }  // b=2, a=1
~~~

### Implementer chính
- {{List}}, {{ArrayList}}, {{LinkedList}}, {{Vector}}, {{Stack}}
- {{Deque}}, {{ArrayDeque}}, {{LinkedList}}, {{ConcurrentLinkedDeque}}
- {{LinkedHashSet}}, {{LinkedHashMap}}
- {{SortedSet}}/{{NavigableSet}}, {{TreeSet}}
- {{SortedMap}}/{{NavigableMap}}, {{TreeMap}}
- **Không implement**: {{HashSet}}, {{HashMap}}, {{ConcurrentHashMap}}, {{CopyOnWriteArrayList}} (vì không đảm bảo thứ tự ổn định).

### Pitfall
- {{reversed()}} trả **view**, không phải bản copy — sửa collection gốc thì view thay đổi, và ngược lại (nếu mutable).
- {{getFirst}} ném exception nếu rỗng; dùng {{isEmpty()}} check trước hoặc {{stream().findFirst()}}.
- {{SequencedCollection}} không extends {{Deque}} — không có {{push}}/{{pop}}.
- Immutable collections ({{List.of}}, {{Set.of}}) implement {{SequencedCollection}} nhưng {{addFirst}}/{{removeFirst}} ném {{UnsupportedOperationException}}.

> Senior tip: khi viết method nhận collection có thứ tự, dùng {{SequencedCollection}} làm tham số thay vì {{List}}/{{Deque}} — chấp nhận được nhiều loại hơn và có API thống nhất. {{reversed()}} view rất tiện cho duyệt ngược không cần index math.`,
  follow: [
    'Vì sao {{HashSet}}/{{HashMap}} không implement {{SequencedCollection}}/{{SequencedMap}}?',
    '{{reversed()}} view có thread-safe không?',
    'Làm sao viết code generic in ra collection có thứ tự trước Java 21?'
  ],
  tags: ['SequencedCollection', 'SequencedMap', 'Java 21', 'reversed', 'getFirst'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-010',
  topic: 'modern',
  level: 'senior',
  q: 'Record patterns và nested deconstruction trong switch (Java 21), guard {{when}}.',
  a: `**Tóm tắt:** Java 21 cho phép **record pattern** destructure ngay trong {{instanceof}} và {{switch}}; lồng nhau (nested) để tách dữ liệu sâu; {{when}} guard thêm điều kiện boolean cho case — thay thế visitor pattern và if-else chain phức tạp.
 
### Record pattern cơ bản
~~~java
record Point(int x, int y) {}
record Rectangle(Point topLeft, Point bottomRight) {}

Object obj = new Rectangle(new Point(0, 0), new Point(10, 10));

if (obj instanceof Rectangle(Point(int x1, int y1), Point(int x2, int y2))) {
    System.out.println(x1 + "," + y1 + " -> " + x2 + "," + y2); // 0,0 -> 10,10
}
~~~
- Pattern: {{Rectangle(Point(int x1, int y1), Point(int x2, int y2))}} khớp type và destructure component lồng nhau.
- Biến pattern ({{int x1}}) khai báo ngay trong pattern, scope là block {{if}}/{{case}}.

### Nested deconstruction trong switch
~~~java
sealed interface Expr permits Const, Add, Mul {}
record Const(int value) implements Expr {}
record Add(Expr left, Expr right) implements Expr {}
record Mul(Expr left, Expr right) implements Expr {}

int eval(Expr e) {
    return switch (e) {
        case Const(int v)            -> v;
        case Add(Expr l, Expr r)     -> eval(l) + eval(r);
        case Mul(Expr l, Expr r)     -> eval(l) * eval(r);
    };
}
~~~
- {{Add(Expr l, Expr r)}}: destructure 2 component là {{Expr}}, đệ quy xử lý.
- Không cần visitor pattern, không cần cast, compiler kiểm tra exhaustive (vì {{Expr}} sealed).

### Guard {{when}}
~~~java
String classify(Object o) {
    return switch (o) {
        case String s when s.length() > 10 -> "long string";
        case String s                       -> "short string";
        case Integer i when i > 0           -> "positive int";
        case Integer i                      -> "non-positive int";
        case null                           -> "null";
        default                             -> "other";
    };
}
~~~
- {{when}}: boolean expression sau pattern, chỉ match nếu true.
- Thứ tự case quan trọng: case có guard cụ thể phải **trước** case tổng quát cùng type (compiler báo "dominated" nếu ngược).
- {{case null}} tách biệt — không match {{default}}.

### Kết hợp record pattern + guard
~~~java
record Order(String id, Customer customer, List<Item> items) {}
record Customer(String name, boolean vip) {}

String priority(Order o) {
    return switch (o) {
        case Order(_, Customer(_, true), var items) when items.size() > 5 -> "VIP_BULK";
        case Order(_, Customer(_, true), _)                              -> "VIP";
        case Order(_, _, var items) when items.size() > 100              -> "BULK";
        default                                                            -> "NORMAL";
    };
}
~~~
- {{_}} (unnamed pattern, Java 22+ preview / Java 21 unnamed variable): bỏ qua component không cần.
- {{var items}}: pattern variable declaration (type inference).

### So sánh với visitor pattern
| | Visitor | Record pattern + switch |
|---|---|---|
| Boilerplate | Cao (interface + accept + impl) | Thấp (chỉ record + switch) |
| Exhaustiveness | Runtime (quên impl ném exception) | **Compile-time** (sealed) |
| Thêm operation | Thêm method visitor (sửa nhiều class) | Thêm switch method (một chỗ) |
| Thêm type | Sửa visitor interface + tất cả impl | Thêm record + sửa switch (compiler nhắc) |
| Performance | Double dispatch | Single dispatch, JIT tốt |

### Pitfall
- Sealed hierarchy bắt buộc: không sealed ⇒ cần {{default}} ⇒ mất exhaustive check.
- Guard {{when}} không được truy cập biến pattern từ case khác.
- Unnamed pattern {{_}} chỉ Java 22+ (preview), Java 21 dùng {{var _}} hoặc tên biến rồi không dùng.
- Performance: pattern matching switch compile thành {{tableswitch}}/{{lookupswitch}} + type check, nhanh hơn visitor.

> Senior tip: record pattern + sealed + switch exhaustive là "killer feature" cho domain modeling (AST, command, event, state). Thay thế visitor pattern hoàn toàn cho hierarchy ổn định. Nếu domain mở (plugin), dùng {{non-sealed}} hoặc interface thường.`,
  follow: [
    'Vì sao record pattern + sealed switch an toàn hơn visitor pattern?',
    'Unnamed pattern {{_}} khác {{var _}} ở điểm nào?',
    'Khi nào không nên dùng record pattern (ví dụ hierarchy thay đổi thường xuyên)?'
  ],
  tags: ['record pattern', 'nested deconstruction', 'switch', 'when', 'Java 21'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
}
,
{
  id: 'core-012',
  topic: 'core',
  level: 'senior',
  q: 'Xử lý tiền tệ bằng {{BigDecimal}}: scale, {{RoundingMode}}, {{equals}} vs {{compareTo}}, và vì sao tuyệt đối không dùng {{double}}?',
  a: `**Tóm tắt:** tiền tệ **bắt buộc** dùng {{BigDecimal}} vì {{double}}/{{float}} không biểu diễn chính xác số thập phân (0.1 + 0.2 ≠ 0.3); {{BigDecimal}} cho phép kiểm soát scale và {{RoundingMode}}, dùng {{compareTo}} để so sánh thay vì {{equals}} (vì {{equals}} còn so sánh scale).

### Vì sao không dùng double
- {{double}} tuân theo IEEE 754 nhị phân: số thập phân hữu hạn (0.1, 0.01, 19.99) thường thành số lặp vô hạn trong nhị phân ⇒ sai số tròn tích lũy.
- Ví dụ kinh điển: {{0.1 + 0.2 = 0.30000000000000004}}; tính lãi, chiết khấu, tiền tệ ngoại tệ sẽ lệch cent và cộng dồn qua ngàn giao dịch thành số lớn.
- Các chuẩn kế toán/ngân hàng (ISO 4217, PCI DSS) yêu cầu độ chính xác tuyệt đối; {{double}} không đáp ứng được.

### BigDecimal cơ bản
~~~java
// Tạo từ String — AN TOÀN
BigDecimal price = new BigDecimal("19.99");

// Tạo từ double — CẤM (giữ sai số nhị phân)
BigDecimal bad = new BigDecimal(0.1);   // 0.10000000000000000555...
BigDecimal good = BigDecimal.valueOf(0.1); // dùng Double.toString -> "0.1"
~~~
- Luôn dùng constructor nhận {{String}} hoặc {{BigDecimal.valueOf(double)}}.
- {{scale}} = số chữ số sau dấu phẩy; âm nghĩa là nhân 10^|scale| (dùng cho số lớn tròn hàng chục/trăm).

### RoundingMode
- Cần thiết khi chia hoặc chuyển đổi scale: {{divide(divisor, scale, RoundingMode.HALF_UP)}}.
- Các mode phổ biến: {{HALF_UP}} (toán học), {{HALF_EVEN}} (banker's rounding, chuẩn IEEE 754R), {{DOWN}}/{{UP}}/{{CEILING}}/{{FLOOR}}.
- Không đặt scale cho {{divide}} sẽ ném {{ArithmeticException}} nếu không chia hết (non-terminating decimal).

### equals vs compareTo
~~~java
new BigDecimal("1.0").equals(new BigDecimal("1.00"));  // false (scale khác)
new BigDecimal("1.0").compareTo(new BigDecimal("1.00")); // 0 (giá trị bằng)
~~~
- {{equals}} so sánh cả **scale** và giá trị; {{compareTo}} chỉ so sánh giá trị số học.
- Dùng {{compareTo}} cho logic nghiệp vụ (so sánh giá, kiểm tra âm/dương); dùng {{equals}} chỉ khi cần biết chính xác định dạng (ví dụ serial hóa).
- {{signum()}} trả -1/0/1 tiện cho điều kiện.

### Pitfall production
- Quên {{divide}} kèm scale + rounding ⇒ exception lúc runtime khi chia 10/3.
- Dùng {{double}} trung gian trong công thức ({{bd.add(BigDecimal.valueOf(0.1))}}) rồi convert về {{BigDecimal}} — sai số vẫn lạ.
- Lưu DB: cột {{NUMERIC(19,4)}} hoặc {{DECIMAL}}; đừng dùng {{FLOAT}}/{{DOUBLE}}. Hibernate mapping {{@Column(precision = 19, scale = 4)}}.
- Tiền tệ đa ngoại tệ: luôn kèm {{Currency}} (ISO 4217), không cộng/trừ tiền tệ khác nhau.

> Senior tip: viết wrapper {{Money}} (record {{Money(BigDecimal amount, Currency currency)}}) với validation ở constructor; tập trung logic làm tròn, chuyển đổi, so sánh vào một chỗ để tránh rải rác {{RoundingMode.HALF_UP}} khắp codebase.`,
  follow: [
    'Vì sao {{BigDecimal("0.1")}} an toàn mà {{new BigDecimal(0.1)}} không?',
    'Khi nào dùng {{RoundingMode.HALF_EVEN}} thay vì {{HALF_UP}}?',
    'Làm sao xử lý tiền tệ đa ngoại tệ trong một hệ thống thanh toán?'
  ],
  tags: ['BigDecimal', 'money', 'RoundingMode', 'floating point'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-013',
  topic: 'core',
  level: 'senior',
  q: 'Java Date/Time API: phân biệt {{Instant}}, {{LocalDateTime}}, {{ZonedDateTime}}, {{OffsetDateTime}}; lưu thời gian trong DB thế nào để tránh bug timezone lúc nửa đêm (cut-off ngân hàng)?',
  a: `**Tóm tắt:** {{Instant}} là điểm trên timeline (UTC, không timezone), {{LocalDateTime}} là ngày giờ địa phương **không** có offset, {{OffsetDateTime}} có offset cố định, {{ZonedDateTime}} có quy tắc timezone (DST). Lưu DB luôn dùng {{Instant}} (UTC) hoặc {{TIMESTAMP WITH TIME ZONE}}; chuyển về múi giờ người dùng **chỉ ở tầng hiển thị**.

### Bốn kiểu chính
| Kiểu | Mô tả | Dùng khi |
|---|---|---|
| {{Instant}} | UTC nanosecond, không timezone | Lưu trữ, log, so sánh, truyền giữa service |
| {{LocalDateTime}} | Năm-tháng-ngày-giờ-phút-giây, **không** offset | Giao diện người dùng, lịch hẹn, sinh nhật |
| {{OffsetDateTime}} | LocalDateTime + offset cố định (+07:00) | Giao tiếp với hệ thống ngoài chỉ gửi offset |
| {{ZonedDateTime}} | LocalDateTime + ZoneId (IANA, có DST) | Business logic liên quan múi giờ, quy tắc mùa hè |

### Chuyển đổi an toàn
~~~java
Instant now = Instant.now();                    // UTC
ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh")); // +07, có DST lịch sử
OffsetDateTime odt = vn.toOffsetDateTime();     // offset tại thời điểm đó
LocalDateTime ldt = vn.toLocalDateTime();       // mất timezone
Instant back = vn.toInstant();                  // ngược về UTC
~~~
- Không bao giờ dùng {{LocalDateTime}} để lưu timestamp sự kiện (log, order time, payment time) — mất ngữ cảnh timezone.
- {{ZonedDateTime}} khác {{OffsetDateTime}} ở chỗ nó biết **quy tắc DST** (ngày chuyển giờ mùa hè); {{OffsetDateTime}} chỉ là offset tĩnh.

### Bug cut-off ngân hàng (thực tế)
- Hệ thống cut-off giao dịch lúc 23:59:59 **theo múi giờ ngân hàng (ví dụ +07)**.
- Nếu lưu {{LocalDateTime}} "2024-03-10 23:59:59" mà không lưu offset, ngày chuyển DST (nếu có) hoặc khi server đổi múi giờ, thời điểm thực tế sai lệch 1 tiếng.
- Giải pháp: lưu {{Instant}} (UTC) trong DB cột {{TIMESTAMP WITH TIME ZONE}} (PostgreSQL) hoặc {{DATETIME}} (MySQL 8.0+ với {{TIMESTAMP}} tự convert). Khi query cut-off: {{WHERE created_at < '2024-03-11 00:00:00+07'}} (đã có offset).
- Spring Boot: cấu hình {{spring.jpa.properties.hibernate.jdbc.time_zone=UTC}} và dùng {{@Column(columnDefinition = "TIMESTAMP WITH TIME ZONE")}}.

### Các lỗi hay gặp
- {{LocalDateTime.now()}} lấy theo múi giờ JVM ({{ZoneId.systemDefault()}}); container Docker thường để UTC ⇒ sai so với múi giờ VN.
- Parse string không có offset bằng {{LocalDateTime.parse}} rồi gán cho cột {{TIMESTAMP WITH TIME ZONE}} ⇒ DB dùng múi giờ session, không ổn định.
- So sánh {{ZonedDateTime}} khác zone: phải {{toInstant()}} rồi so sánh, không so sánh field trực tiếp.
- {{Period}} vs {{Duration}}: {{Period}} cho ngày/tháng/năm (date-based), {{Duration}} cho giờ/phút/giây/nano (time-based).

> Senior tip: quy tắc vàng — **luôn lưu UTC (Instant) trong DB**, **luôn hiển thị theo timezone người dùng ở frontend**, **không bao giờ để business logic tính toán trên LocalDateTime**. Với batch job cut-off, dùng {{ZonedDateTime}} có ZoneId cố định của ngân hàng để xác định ranh giới ngày.`,
  follow: [
    'Vì sao {{ZonedDateTime}} an toàn hơn {{OffsetDateTime}} cho logic cut-off?',
    'Làm sao migrate cột {{TIMESTAMP}} cũ sang {{TIMESTAMP WITH TIME ZONE}} không mất dữ liệu?',
    'Khi nào dùng {{LocalDate}} thay vì {{LocalDateTime}} cho ngày sinh/ngày hết hạn?'
  ],
  tags: ['Date/Time', 'Instant', 'ZonedDateTime', 'timezone', 'cut-off'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-014',
  topic: 'core',
  level: 'mid',
  q: 'Autoboxing: Integer cache (-128..127), {{==}} trên wrapper, NPE khi unboxing, và chi phí boxing trong vòng lặp nóng.',
  a: `**Tóm tắt:** autoboxing tự chuyển primitive ↔ wrapper; {{Integer.valueOf}} cache -128..127 nên {{==}} đúng trên cache nhưng sai ngoài phạm vi; unboxing {{null}} ném NPE; boxing trong vòng lặp tạo rác GC lớn — dùng primitive hoặc primitive collection.
 
### Cache Integer
- {{Integer.valueOf(int)}} cache [-128, 127] (có thể mở rộng bằng {{-XX:AutoBoxCacheMax}}); {{new Integer()}} đã deprecated (Java 9) và không dùng cache.
- {{Long}}, {{Short}}, {{Byte}}, {{Character}} cũng có cache tương tự.
- {{Boolean}} cache {{TRUE}}/{{FALSE}} singleton.

~~~java
Integer a = 127, b = 127;        // cache -> same object
Integer c = 128, d = 128;        // mới tạo -> khác object
System.out.println(a == b);      // true
System.out.println(c == d);      // false (so sánh reference!)
System.out.println(c.equals(d)); // true (so sánh giá trị)
~~~

### NPE khi unboxing
~~~java
Integer wrapper = null;
int primitive = wrapper;         // NPE tại dòng này (unboxing ngầm)
~~~
- Xảy ra khi: map.get(key) trả null rồi gán cho primitive; ternary operator {{condition ? 1 : null}} ép kiểu primitive; stream {{reduce}} với identity null.
- Phòng thủ: dùng {{Objects.requireNonNull}}, {{Optional}}, hoặc kiểm tra null trước khi unbox.

### Chi phí boxing trong hot path
- Mỗi boxing tạo object mới (trừ cache), gây allocation rate cao ⇒ young GC nhiều, pause tăng.
- Ví dụ: {{Long sum = 0L; for (long v : values) sum += v;}} — {{sum}} bị box/unbox mỗi vòng.
- Khắc phục: dùng primitive local ({{long sum = 0;}}), hoặc primitive stream ({{LongStream}}, {{IntStream}}), hoặc primitive collection (fastutil/Eclipse Collections).
- JIT có thể escape analysis loại bỏ boxing nếu object không thoát method, nhưng không đảm bảo.

### So sánh wrapper
- Luôn dùng {{equals}} cho wrapper; {{==}} chỉ đúng nhờ cache và là bug ngầm.
- {{Comparator.naturalOrder()}} an toàn cho wrapper null (ném NPE), {{Comparator.nullsFirst}} xử lý null tường minh.

> Senior tip: bật {{-XX:+PrintCompilation}} và {{-XX:+PrintInlining}} để xem JIT có loại bỏ boxing không; trong code quan trọng (low latency), viết thủ công dùng primitive hoặc dùng thư viện primitive collection. Đừng tin rằng "JIT sẽ lo" — đo bằng JMH.`,
  follow: [
    'Vì sao {{Integer}} cache mặc định -128..127 và làm sao mở rộng?',
    'Ternary operator {{flag ? 1 : null}} ném NPE khi gán cho {{int}} — tại sao?',
    'Khi nào nên dùng {{OptionalInt}} thay vì {{Optional<Integer>}}?'
  ],
  tags: ['autoboxing', 'Integer cache', 'NPE', 'performance']
},
{
  id: 'core-015',
  topic: 'core',
  level: 'senior',
  q: 'try-with-resources: thứ tự đóng, suppressed exception, và cách viết {{AutoCloseable}} đúng.',
  a: `**Tóm tắt:** try-with-resources đóng tài nguyên theo thứ tự **ngược lại khai báo**, exception khi close bị gắn vào {{getSuppressed()}} của exception chính; tự viết {{AutoCloseable}} phải idempotent, không ném exception trong {{close()}} trừ khi không thể khôi phục.
 
### Thứ tự đóng
~~~java
try (var in = new FileInputStream("a.txt");
     var out = new FileOutputStream("b.txt")) {
    // dùng in, out
} // out.close() chạy trước, rồi in.close()
~~~
- Đóng theo LIFO (last in, first out) — giống stack; resource khai báo sau đóng trước.
- Nếu constructor resource sau ném exception, resource trước vẫn được đóng (Java 9+ hỗ trợ resource final/effectively final).

### Suppressed exception
- Nếu block try ném exception **và** close() cũng ném exception: exception close bị **suppressed** (gắn vào {{primary.getSuppressed()}}), exception chính vẫn là exception từ try block.
- Trước Java 7 (dùng finally), exception close sẽ **ghi đè** exception chính — mất nguyên nhân gốc.
- Luôn log {{getSuppressed()}} khi bắt exception để không mất lỗi đóng tài nguyên.

~~~java
try (var rs = stmt.executeQuery()) {
    // xử lý
} catch (SQLException e) {
    for (Throwable s : e.getSuppressed()) {
        log.warn("Suppressed: {}", s.getMessage());
    }
    throw e;
}
~~~

### Viết AutoCloseable đúng
~~~java
public final class DbResource implements AutoCloseable {
    private final Connection conn;
    private volatile boolean closed = false;
 
    public DbResource(Connection conn) { this.conn = conn; }
 
    @Override
    public void close() {
        if (closed) return;                 // idempotent
        closed = true;
        try {
            if (conn != null && !conn.isClosed()) conn.close();
        } catch (SQLException e) {
            // log và nuốt, hoặc wrap thành unchecked nếu caller cần biết
            // KHÔNG ném checked exception mới nếu không cần thiết
        }
    }
}
~~~
- **Idempotent**: gọi {{close()}} nhiều lần an toàn.
- **Không ném exception** trong {{close()}} trừ khi lỗi nghiêm trọng không thể bỏ qua (ví dụ flush buffer thất bại khi ghi log quan trọng). Nếu ném, caller không xử lý được dễ dàng.
- **Thread-safe** nếu resource chia sẻ: dùng {{volatile}} hoặc {{synchronized}}.
- Resource có state ({{InputStream}}, {{Connection}}) nên {{final}} class để tránh subclass phá vỡ logic đóng.

### Java 9+: resource final/effectively final
~~~java
var in = Files.newInputStream(path);
try (in) { ... }  // không cần khai báo mới trong try
~~~

> Senior tip: trong code review, tìm mọi {{close()}} thủ công trong finally — hãy chuyển sang try-with-resources. Với resource pool (DB connection), {{close()}} trả về pool chứ không đóng vật lý; đảm bảo {{AutoCloseable}} của wrapper pool đúng ngữ nghĩa.`,
  follow: [
    'Vì sao exception trong close() bị suppressed thay vì ghi đè exception chính?',
    'Resource khai báo trong try-with-resources có thể là null không?',
    'Làm sao viết AutoCloseable cho resource cần flush trước khi đóng (ví dụ BufferedWriter)?'
  ],
  tags: ['try-with-resources', 'AutoCloseable', 'suppressed exception', 'resource management'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-016',
  topic: 'core',
  level: 'senior',
  q: 'Enum nâng cao: {{EnumMap}}/{{EnumSet}}, enum singleton, enum làm state machine, và vì sao không persist bằng {{ordinal()}}.',
  a: `**Tóm tắt:** enum là class final với tập instance cố định; {{EnumMap}}/{{EnumSet}} nhanh hơn HashMap/HashSet nhờ mảng index theo {{ordinal()}}; enum singleton thread-safe miễn phí; enum state machine gọn nhẹ; **không persist ordinal()** vì thêm/sửa enum làm lệch dữ liệu — dùng name() hoặc code tự định nghĩa.
 
### EnumMap / EnumSet
- {{EnumMap<K,V>}}: key là enum, backing là mảng {{V[]}} index = {{key.ordinal()}}; O(1) không hash, không collision, memory nhỏ, duyệt theo thứ tự khai báo.
- {{EnumSet}}: bitset (long cho ≤ 64 enum, mảng long cho > 64); {{EnumSet.allOf}}, {{noneOf}}, {{range}}, {{complement}} cực nhanh.
- So với {{HashMap}}/{{HashSet}}: nhanh hơn 2-10x, ít GC, không cần hashCode/equals.

~~~java
enum Status { NEW, PROCESSING, DONE, FAILED }
EnumMap<Status, Integer> counter = new EnumMap<>(Status.class);
EnumSet<Status> active = EnumSet.of(Status.NEW, Status.PROCESSING);
~~~

### Enum singleton
~~~java
enum Singleton { INSTANCE; void doWork() {} }
~~~
- Thread-safe, serialization-safe (JVM đảm bảo), reflection-safe (constructor private), lazy init.
- Cách đơn giản nhất và được khuyến nghị (Effective Java Item 3).

### Enum state machine
~~~java
enum OrderState {
    CREATED { @Override OrderState next() { return PAID; } },
    PAID { @Override OrderState next() { return SHIPPED; } },
    SHIPPED { @Override OrderState next() { return DELIVERED; } },
    DELIVERED { @Override OrderState next() { return this; } };
    abstract OrderState next();
}
~~~
- Mỗi state là instance, method abstract ép buộc implement chuyển tiếp.
- Dễ thêm validation, logging, side effect trong từng state.
- Không dùng cho state machine phức tạp với nhiều transition điều kiện — dùng thư viện hoặc pattern khác.

### Vì sao không persist ordinal()
- {{ordinal()}} trả về index khai báo (0-based). Thêm enum ở giữa hoặc đổi thứ tự ⇒ tất cả dữ liệu cũ sai nghĩa.
- Ví dụ: {{Status.NEW=0, PROCESSING=1}}; thêm {{PENDING}} ở giữa ⇒ PROCESSING thành 2, dữ liệu cũ PROCESSING (1) giờ thành PENDING.
- Giải pháp: persist {{name()}} (String) hoặc code tự định nghĩa {{code}} (String/Int) trong enum field.
- {{name()}} ổn định miễn là không đổi tên enum; đổi tên enum vẫn cần migration script.

### Pitfall
- {{EnumMap}} không thread-safe; dùng {{ConcurrentHashMap}} nếu chia sẻ.
- {{EnumSet}} không serializable tốt qua một số framework cũ; test kỹ.
- Switch trên enum: thêm case mới mà quên cập nhật switch ⇒ bug; dùng switch expression (exhaustive) để compiler bắt.

> Senior tip: trong JPA, map enum bằng {{@Enumerated(EnumType.STRING)}} (lưu name) hoặc {{AttributeConverter}} cho code tùy chỉnh; **không bao giờ** dùng {{EnumType.ORDINAL}}. Với state machine phức tạp, cân nhắc thư viện như Squirrel hoặc tự viết nhưng tách logic transition ra class riêng.`,
  follow: [
    'Vì sao {{EnumMap}} nhanh hơn {{HashMap}} cho key enum?',
    'Enum singleton có nhược điểm gì so với static holder?',
    'Làm sao migrate dữ liệu đã lưu ordinal() sang code/name an toàn?'
  ],
  tags: ['enum', 'EnumMap', 'EnumSet', 'singleton', 'state machine'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-017',
  topic: 'core',
  level: 'senior',
  q: 'Interface default/static/private method, diamond problem, và khi nào chọn abstract class thay vì interface?',
  a: `**Tóm tắt:** Java 8+ cho phép default/static/private method trong interface; diamond problem giải quyết bằng quy tắc "class win" và bắt buộc override khi conflict; chọn abstract class khi cần state chung, constructor, hoặc non-public member; interface cho contract và multiple implementation.

### Default method
~~~java
default void log() { System.out.println("log"); }
~~~
- Cung cấp implementation mặc định, class implement có thể override.
- Dùng để **mở rộng interface cũ** mà không phá binary compatibility (ví dụ {{Collection.stream()}}, {{Iterable.forEach()}}).
- Không thể truy cập private field của class implement (chỉ dùng method public/protected khác).

### Static method
~~~java
static void helper() { ... }
~~~
- Tiện cho utility method gắn liền interface ({{Stream.of}}, {{Comparator.naturalOrder()}}).
- Không kế thừa được; gọi qua {{InterfaceName.helper()}}.

### Private method (Java 9)
~~~java
private void shared() { ... }
private static void util() { ... }
~~~
- Chia sẻ code giữa default method, không lộ ra ngoài.

### Diamond problem
~~~java
interface A { default void m() { System.out.println("A"); } }
interface B { default void m() { System.out.println("B"); } }
class C implements A, B { 
    @Override public void m() { A.super.m(); } // bắt buộc override, chọn A hoặc B
}
~~~
- Quy tắc: **class win** — nếu class (hoặc cha) có method cụ thể (non-abstract), dùng của class.
- Nếu hai interface có default method trùng tên và class không override ⇒ compile error.
- Dùng {{A.super.m()}} để gọi default method cụ thể.

### Interface vs Abstract class
| Tiêu chí | Interface | Abstract class |
|---|---|---|
| Kế thừa | multiple (implements) | single (extends) |
| Field | chỉ {{static final}} | instance field, constructor |
| Access modifier | public (default method) | bất kỳ (protected, package) |
| State | không | có |
| Binary compat | thêm default method an toàn | thêm method abstract phá vỡ subclass |

### Khi nào chọn abstract class
- Cần **state chung** (field) hoặc **constructor** khởi tạo state.
- Cần **non-public method** (protected helper cho subclass).
- Thiết kế template method pattern ({{final}} method gọi abstract hook).
- Base class cho hierarchy chặt (entity base, handler base).

### Khi nào chọn interface
- Định nghĩa **contract** (capability), không quan tâm implementation.
- Cần multiple implementation ({{Comparable}}, {{Serializable}}, {{AutoCloseable}}).
- API công khai muốn binary compatibility khi mở rộng.

> Senior tip: mặc định dùng **interface** cho API mới; chỉ dùng abstract class khi thực sự cần state/constructor. Nếu thấy interface có quá nhiều default method phức tạp, cân nhắc tách thành abstract class helper + interface mảnh.`,
  follow: [
    'Default method có thể override {{Object}} method (equals, hashCode, toString) không?',
    'Static method trong interface có được kế thừa không?',
    'Vì sao Java không cho phép interface có instance field non-final?'
  ],
  tags: ['interface', 'default method', 'diamond problem', 'abstract class'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-018',
  topic: 'core',
  level: 'senior',
  q: 'Java I/O vs NIO: buffer, channel, {{Files}} API, đọc file lớn theo stream, zero-copy {{transferTo}}.',
  a: `**Tóm tắt:** I/O truyền thống (stream) blocking, byte-by-byte; NIO (New I/O) dùng **buffer + channel**, non-blocking, memory-mapped, zero-copy. {{Files}} API (Java 7+) tiện cho thao tác file hệ thống; đọc file lớn dùng {{Files.lines}}/{{Files.newInputStream}} + stream; {{transferTo}} truyền dữ liệu kernel-to-kernel không copy qua user space.
 
### I/O truyền thống vs NIO
| Đặc điểm | java.io (Stream) | java.nio (Buffer/Channel) |
|---|---|---|
| Mô hình | Blocking, byte/char stream | Buffer + Channel, non-blocking (Selector) |
| Đơn vị đọc/ghi | Byte/char đơn lẻ hoặc mảng | Buffer ({{ByteBuffer}}, {{CharBuffer}}...) |
| Memory-mapped | Không | {{FileChannel.map}} ({{MappedByteBuffer}}) |
| Zero-copy | Không | {{transferTo}}/{{transferFrom}} |
| File system | {{File}} (hạn chế) | {{Path}}, {{Files}} (bộ API đầy đủ) |

### Buffer cơ bản
~~~java
ByteBuffer buf = ByteBuffer.allocateDirect(8192); // off-heap, zero-copy ready
buf.put(data);        // write mode
buf.flip();           // chuyển sang read mode (limit=position, position=0)
channel.read(buf);    // đọc vào buffer
buf.compact();        // dời unread data về đầu, chuẩn bị đọc tiếp
~~~
- {{allocateDirect}}: off-heap, dùng cho zero-copy, GC ít hơn nhưng allocation chậm hơn.
- {{flip()}}, {{clear()}}, {{compact()}}, {{rewind()}} quản trị position/limit/capacity.

### Files API (Java 7+)
- {{Files.readAllLines}}, {{Files.write}}, {{Files.copy}}, {{Files.move}}, {{Files.delete}}, {{Files.walk}}.
- {{Files.lines(path)}} trả {{Stream<String>}} lazy, tự đóng stream khi xong (try-with-resources).
- {{Files.newInputStream}}/{{newOutputStream}} trả stream chuẩn, dùng với NIO channel.

### Đọc file lớn (GB) không OOM
~~~java
// Cách 1: Files.lines + stream processing (line by line)
try (Stream<String> lines = Files.lines(Paths.get("huge.log"))) {
    lines.filter(s -> s.contains("ERROR"))
         .forEach(System.out::println);
}

// Cách 2: BufferedReader thủ công
try (var br = Files.newBufferedReader(path)) {
    String line;
    while ((line = br.readLine()) != null) { ... }
}
~~~
- Không bao giờ {{Files.readAllBytes}} hoặc {{readAllLines}} file lớn — load hết vào heap.

### Zero-copy transferTo
~~~java
try (var in = FileChannel.open(src, StandardOpenOption.READ);
     var out = FileChannel.open(dest, StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
    long transferred = in.transferTo(0, in.size(), out); // kernel copy, không qua user buffer
}
~~~
- {{transferTo}} nhờ OS copy trực tiếp giữa 2 file descriptor (sendfile trên Linux), nhanh hơn và không tiêu tốn heap.
- Yêu cầu: source là {{FileChannel}}, destination có thể là {{FileChannel}} hoặc {{SocketChannel}}.
- Java 9+: {{transferTo}} trả về số byte đã transfer; có thể gọi lặp nếu không transfer hết.

> Senior tip: với log processing lớn, dùng {{Files.lines}} + parallel stream (nếu CPU-bound) hoặc {{BufferedReader}} tuần tự (nếu I/O-bound). Với copy file lớn hoặc gửi file qua network, luôn ưu tiên {{transferTo}}. Tránh {{MappedByteBuffer}} cho file > 2GB trên 32-bit hoặc khi cần đóng gấp (unmap khó khăn, dùng {{Cleaner}} hoặc reflection hack).`,
  follow: [
    'Vì sao {{transferTo}} nhanh hơn đọc vào buffer rồi ghi ra?',
    'Khi nào dùng {{ByteBuffer.allocateDirect}} thay vì {{allocate}}?',
    '{{MappedByteBuffer}} có nhược điểm gì và làm sao unmap an toàn?'
  ],
  tags: ['NIO', 'Buffer', 'Channel', 'Files', 'transferTo', 'zero-copy'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-019',
  topic: 'core',
  level: 'senior',
  q: 'String concat bằng {{+}} sau Java 9 (invokedynamic), {{StringBuilder}} khi nào thực sự cần, {{String.format}} chậm ra sao?',
  a: `**Tóm tắt:** từ Java 9, {{+}} dùng {{invokedynamic}} + {{StringConcatFactory}} sinh bytecode tối ưu tại runtime, nhanh ngang {{StringBuilder}} cho các phép concat đơn giản; {{StringBuilder}} vẫn cần cho vòng lặp, concat có điều kiện, hoặc tùy chỉnh capacity; {{String.format}} chậm do parse format string và tạo {{Formatter}} mỗi lần.
 
### String concat sau Java 9 (JEP 280)
- Trước Java 9: {{a + b + c}} biên dịch thành chuỗi {{new StringBuilder().append(a).append(b).append(c).toString()}}.
- Java 9+: compiler sinh lời gọi {{invokedynamic}} bootstrap method {{StringConcatFactory.makeConcatWithConstants}}; runtime chọn chiến lược tối ưu ({{StringBuilder}}, {{String.join}}, {{Arrays.copyOf}}, thậm chí {{StringConcatHelper}}).
- Lợi ích: JIT có thể inline, tối ưu theo profile thực tế; không tạo {{StringBuilder}} trung gian trong bytecode tĩnh.
- Kết quả: {{s1 + s2 + s3}} nhanh như {{StringBuilder}} thủ công, code dễ đọc hơn.

### Khi nào vẫn cần StringBuilder
- **Vòng lặp**: concat trong loop tạo nhiều lời gọi {{invokedynamic}} riêng lẻ, không gộp được.
~~~java
// Chậm: mỗi vòng một invokedynamic
String s = "";
for (String part : parts) s += part; 

// Nhanh: một StringBuilder
StringBuilder sb = new StringBuilder(estimatedSize);
for (String part : parts) sb.append(part);
String s = sb.toString();
~~~
- **Concat có điều kiện/phân nhánh**: logic phức tạp mà bootstrap method không gộp được.
- **Cần kiểm soát capacity**: tránh resize nội bộ ({{new StringBuilder(1024)}}).
- **Thread-local buffer**: tái dùng {{StringBuilder}} trong hot path (cẩn thận thread-safety).

### String.format chậm ra sao
- Parse format string ({{%d}}, {{%s}}, {{%.2f}}...) mỗi lần gọi — regex/internal parser.
- Tạo {{Formatter}} object mới mỗi lần (allocation).
- Boxing/unboxing cho primitive argument.
- Locale handling mặc định.

~~~java
// Chậm
String msg = String.format("User %s has %d orders", name, count);

// Nhanh: concat đơn giản
String msg = "User " + name + " has " + count + " orders";

// Hoặc StringBuilder cho nhiều phần
String msg = new StringBuilder("User ").append(name).append(" has ").append(count).append(" orders").toString();
~~~

### Benchmark gợi ý (JMH)
- {{+}} / {{StringConcatFactory}}: ~1-2 ns/op cho 3-4 string ngắn.
- {{StringBuilder}} thủ công: ~1-2 ns/op (tương đương).
- {{String.format}}: ~50-100 ns/op (chậm 50-100x).
- {{MessageFormat}}: còn chậm hơn.

### Pitfall
- Concat trong log statement: {{log.info("Processing " + id + " for " + user)}} — chuỗi được tạo **trước** khi kiểm tra log level; dùng code block dưới (SLF4J placeholder) để lazy evaluation.
~~~java
log.info("Processing {} for {}", id, user);
~~~
- {{String.join}} cho collection: tiện nhưng tạo mảng trung gian nếu truyền varargs; dùng {{StringJoiner}} cho stream.

> Senior tip: mặc định viết {{+}} cho concat đơn giản (Java 9+), chỉ dùng {{StringBuilder}} khi có vòng lặp hoặc cần capacity. Bật {{-XX:+PrintStringConcat}} để xem chiến lược JIT chọn. Với logging, **luôn dùng placeholder SLF4J** — đây là lỗi performance hay gặp nhất trong production.`,
  follow: [
    'Vì sao {{invokedynamic}} giúp concat nhanh hơn bytecode tĩnh?',
    '{{String.join}} khác {{Collectors.joining}} ở điểm nào?',
    'Khi nào {{StringBuilder}} thread-local là ý tưởng tốt/hay?'
  ],
  tags: ['String', 'concat', 'invokedynamic', 'StringBuilder', 'String.format'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-020',
  topic: 'core',
  level: 'mid',
  q: 'Giải thích 4 tính chất OOP bằng ví dụ thật trong code nghiệp vụ bạn từng viết (không đọc định nghĩa). Tính chất nào bạn thấy hay bị dùng sai nhất?',
  a: `**Tóm tắt:** Encapsulation là giấu state và chỉ cho đổi qua method giữ được invariant (ví dụ {{Account.withdraw}} không cho số dư âm). Abstraction là caller chỉ biết "cái gì" qua interface ({{PaymentProcessor.pay}}), không biết "làm thế nào". Inheritance là tái sử dụng hành vi theo quan hệ "is-a" thật sự. Polymorphism là cùng một lời gọi chạy implementation khác nhau theo object thực tế, nhờ đó thêm cổng thanh toán mới không phải sửa if/else. Hay bị dùng sai nhất là inheritance: kế thừa chỉ để dùng lại code.

### Encapsulation: bảo vệ invariant, không phải "getter/setter cho mọi field"
~~~java
public class Account {
    private BigDecimal balance;                 // không ai sửa trực tiếp
    private final List<Txn> history = new ArrayList<>();

    public void withdraw(BigDecimal amount) {
        if (amount.signum() <= 0) throw new IllegalArgumentException("amount <= 0");
        if (balance.compareTo(amount) < 0) throw new InsufficientFundsException();
        balance = balance.subtract(amount);     // invariant: balance >= 0 luôn đúng
        history.add(Txn.debit(amount));         // state đổi cùng nhau, không lệch
    }
    public BigDecimal getBalance() { return balance; }   // không có setBalance
    public List<Txn> history() { return List.copyOf(history); } // không lộ list nội bộ
}
~~~
Vì sao quan trọng: nếu có {{setBalance}}, bất kỳ service nào cũng có thể ghi số dư âm hoặc quên ghi lịch sử. Rule nghiệp vụ nằm rải rác thì không ai kiểm soát được.

### Abstraction + Polymorphism: bỏ chuỗi if/else theo loại
~~~java
public interface PaymentProcessor {             // abstraction: chỉ nói "thanh toán"
    PaymentMethod method();
    PaymentResult pay(Order order);
}

@Service
public class CheckoutService {
    private final Map<PaymentMethod, PaymentProcessor> processors;

    public CheckoutService(List<PaymentProcessor> all) {  // Spring inject mọi bean
        this.processors = all.stream()
            .collect(Collectors.toMap(PaymentProcessor::method, p -> p));
    }
    public PaymentResult checkout(Order o) {
        return processors.get(o.method()).pay(o); // dynamic dispatch theo object thật
    }
}
~~~
Thêm VNPay, MoMo hay ZaloPay chỉ cần thêm một class {{@Component}} mới; {{CheckoutService}} không đổi (Open/Closed). Đó là lợi ích thật của polymorphism, đáng nói hơn ví dụ Dog/Cat.

### Inheritance: dùng khi có "is-a" và khung chung
Ví dụ hợp lý là template method: {{AbstractStatementExporter}} có method {{final export()}} gọi lần lượt {{header()}}, {{rows()}}, {{footer()}}; lớp con PDF và Excel chỉ override từng bước. Kế thừa sai là {{class OrderService extends BaseDao}} chỉ để gọi được {{save()}}: nó gắn chặt hai lớp, lộ method không mong muốn và vi phạm Liskov. Nên dùng composition (inject {{OrderRepository}}).

| Tính chất | Câu hỏi nó trả lời | Dấu hiệu dùng sai |
|---|---|---|
| Encapsulation | Ai được đổi state, theo rule nào? | Entity toàn setter public, rule nằm ở service |
| Abstraction | Caller cần biết gì tối thiểu? | Interface lộ chi tiết của provider (HTTP status, SQL) |
| Inheritance | Có thật là "is-a" không? | Kế thừa để dùng lại helper, cây sâu hơn 2–3 tầng |
| Polymorphism | Có thể thay implementation không? | {{instanceof}}/switch theo type rải khắp nơi |

### Câu trả lời sai phổ biến
- Đọc định nghĩa sách giáo khoa và lấy ví dụ Animal/Dog, không liên hệ được với code thật.
- Nhầm encapsulation với "field private + getter/setter đầy đủ". Có setter cho mọi field thì vẫn là phá encapsulation.
- Nhầm abstraction (thiết kế mức khái niệm, interface) với encapsulation (giấu dữ liệu và bảo vệ invariant).
- Chỉ nói đến runtime polymorphism (overriding) mà quên overloading là compile-time polymorphism.

> Senior tip: khi trả lời, chọn một ví dụ xuyên suốt (thanh toán, tài khoản) rồi chỉ ra trade-off: "tôi ưu tiên composition, chỉ kế thừa khi có khung template rõ ràng". Interviewer ngân hàng thường hỏi tiếp sang SOLID và Strategy pattern, nên chuẩn bị sẵn ví dụ {{Map<Type, Strategy>}} như trên.`,
  follow: [
    'Composition over inheritance: cho một ví dụ bạn đã refactor từ kế thừa sang composition.',
    'JPA entity cần no-arg constructor và setter thì làm sao vẫn giữ được encapsulation?',
    'Liskov Substitution Principle bị vi phạm trong ví dụ nào bạn từng gặp?'
  ],
  tags: ['OOP', 'encapsulation', 'polymorphism', 'inheritance', 'abstraction']
},
{
  id: 'core-021',
  topic: 'core',
  level: 'senior',
  q: 'Overloading vs overriding: quy tắc với {{static}}, {{private}}, {{final}}, kiểu trả về covariant và exception là gì? Dự đoán output khi gọi static method qua reference kiểu cha.',
  a: `**Tóm tắt:** Overloading là nhiều method cùng tên nhưng khác danh sách tham số; compiler chọn method lúc **compile time** dựa trên **kiểu khai báo** của argument. Overriding là lớp con định nghĩa lại method instance cùng chữ ký; JVM chọn lúc **runtime** dựa trên **object thật**. {{static}} method không override được mà chỉ bị **hiding**; {{private}} và {{final}} không override được.

### Bảng quy tắc
| Quy tắc | Overloading | Overriding |
|---|---|---|
| Khi nào chọn | Compile time, theo static type | Runtime, theo dynamic type (vtable) |
| Chữ ký | Cùng tên, khác parameter list | Cùng tên và parameter list |
| Return type | Tuỳ ý, nhưng không thể chỉ khác return type | Giống hệt, hoặc subtype (covariant) nếu là reference type |
| Access modifier | Tuỳ ý | Không được hẹp hơn (protected lên public được, ngược lại không) |
| Checked exception | Tuỳ ý | Không được ném checked exception mới hoặc rộng hơn; unchecked thì thoải mái |
| static / private / final | Overload được | Không override được (static thì hiding) |

### Dự đoán output: static hiding vs dynamic dispatch
~~~java
class Parent {
    static String who()  { return "Parent.static"; }
    String name()        { return "Parent.instance"; }
}
class Child extends Parent {
    static String who()  { return "Child.static"; }      // hiding
    @Override String name() { return "Child.instance"; } // overriding
}

Parent p = new Child();
System.out.println(p.who());   // Parent.static  (chọn theo kiểu khai báo Parent)
System.out.println(p.name());  // Child.instance (chọn theo object thật)
~~~
Vì sao: lời gọi static được compiler bind sẵn thành {{invokestatic Parent.who}}, nên object thật không liên quan. Method instance được compile thành {{invokevirtual}} và JVM tra bảng method của class thật lúc chạy.

### Dự đoán output: overload resolution
~~~java
static void print(Object o)  { System.out.println("Object"); }
static void print(String s)  { System.out.println("String"); }
static void print(long x)    { System.out.println("long"); }
static void print(Integer x) { System.out.println("Integer"); }

Object obj = "hello";
print(obj);   // Object: chọn theo static type, không phải runtime type
print("hi");  // String: method cụ thể nhất
print(5);     // long: widening (phase 1) thắng boxing (phase 2)
// print(null); -> lỗi compile "ambiguous": String và Integer ngang nhau
~~~
Compiler tìm theo 3 phase: (1) không boxing, không varargs; (2) cho phép boxing/unboxing; (3) cho phép varargs. Phase nào tìm thấy thì dừng, sau đó chọn method cụ thể nhất.

### private và final
- {{private}} method không được kế thừa. Lớp con viết method cùng tên là method **mới**; thêm {{@Override}} sẽ lỗi compile. Code trong lớp cha gọi method đó vẫn chạy bản của lớp cha.
- {{final}} method thì không cho override, dùng để khoá thuật toán (ví dụ bước kiểm tra chữ ký trong template method).

### Câu trả lời sai phổ biến
- "Chỉ khác return type cũng là overload": sai, lỗi compile.
- "Static method override được vì gọi được qua instance": sai, đó là hiding và gọi qua instance chỉ là cú pháp gây hiểu nhầm.
- "Overloading chọn theo object thật": sai, nó chọn theo kiểu khai báo.

### Pitfall production
- Viết {{public boolean equals(Account other)}}: đây là **overload**, không phải override {{equals(Object)}}. {{HashSet}} và {{List.contains}} gọi bản {{Object}} nên không bao giờ dùng method của bạn. Luôn gắn {{@Override}}.
- {{List<Integer>}} có {{remove(int index)}} và {{remove(Object o)}}: gọi {{list.remove(1)}} sẽ xoá phần tử ở **index 1**, không phải giá trị 1. Muốn xoá giá trị thì gọi {{list.remove(Integer.valueOf(1))}}.
- Hai overload {{f(List<String>)}} và {{f(List<Integer>)}} lỗi compile "name clash" vì sau type erasure có cùng chữ ký.

> Senior tip: bật cảnh báo thiếu {{@Override}} trong IDE/Sonar và coi đó là lỗi. Với API public, hạn chế overload có cùng số tham số mà kiểu dễ autobox lẫn nhau (int/Integer/long/Object), vì người gọi rất dễ trỏ nhầm method mà không hề biết.`,
  follow: [
    'Vì sao field không có polymorphism? {{p.field}} với {{p}} khai báo kiểu cha trả về giá trị nào?',
    'Gọi một method overridable trong constructor lớp cha thì nguy hiểm thế nào?',
    'Bridge method do compiler sinh ra khi override method generic là gì?'
  ],
  tags: ['overloading', 'overriding', 'method hiding', 'polymorphism', 'covariant return'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-022',
  topic: 'core',
  level: 'mid',
  q: 'Dự đoán output: so sánh {{==}} và {{equals}} với String literal, {{new String}}, chuỗi nối lúc runtime và {{Integer}}. Vì sao so sánh ID kiểu {{Long}} bằng {{==}} chạy đúng ở dev nhưng hỏng ở production?',
  a: `**Tóm tắt:** {{==}} so sánh **reference** (hai biến có trỏ cùng một object không), còn {{equals}} so sánh **nội dung**, với điều kiện class đã override nó. String literal và hằng số compile-time được đưa vào String pool nên {{==}} tình cờ ra true; chuỗi tạo lúc runtime thì không. {{Integer}}/{{Long}} cache từ -128 đến 127, nên {{==}} đúng với ID nhỏ ở môi trường dev và sai khi ID lớn hơn 127 trên production.

### Dự đoán output: String
~~~java
String a = "hello";
String b = "hello";
String c = new String("hello");
String d = "hel" + "lo";         // hằng compile-time: compiler gộp thành "hello"
String part = "hel";
String e = part + "lo";          // part không phải hằng: nối lúc runtime, object mới
final String fpart = "hel";
String f = fpart + "lo";         // fpart là constant variable: lại được gộp

System.out.println(a == b);          // true
System.out.println(a == c);          // false
System.out.println(a.equals(c));     // true
System.out.println(a == d);          // true
System.out.println(a == e);          // false
System.out.println(a == e.intern()); // true
System.out.println(a == f);          // true
~~~
Vì sao:
- Mọi literal giống nhau trong cùng JVM dùng chung một object trong String pool, nên {{a == b}}.
- {{new String(...)}} luôn tạo object mới trên heap, kể cả khi pool đã có "hello".
- {{"hel" + "lo"}} và {{fpart + "lo"}} là **constant expression** (JLS 15.29), được tính ngay lúc compile và intern như literal. Bỏ {{final}} đi thì {{part + "lo"}} chạy lúc runtime (qua {{StringConcatFactory}}) và tạo object mới.
- {{intern()}} trả về object trong pool có cùng nội dung.

### Dự đoán output: wrapper
~~~java
Integer x = 127, y = 127;
Integer m = 128, n = 128;
Long id = 127L;
System.out.println(x == y);         // true: cùng object trong cache
System.out.println(m == n);         // false: ngoài cache, 2 object khác nhau
System.out.println(m.equals(n));    // true
System.out.println(m == 128);       // true: m bị unbox, so sánh giá trị int
System.out.println(x.equals(127L)); // false: 127L box thành Long, khác class
System.out.println(id.equals(127)); // false: 127 box thành Integer
~~~
Kết quả trên đúng với cấu hình mặc định; cờ {{-XX:AutoBoxCacheMax}} có thể nới cache của {{Integer}}, nên càng không được dựa vào {{==}}.

### equals không phải lúc nào cũng so nội dung
{{Object.equals}} mặc định chính là {{==}}. {{StringBuilder}} **không** override {{equals}}, nên {{new StringBuilder("a").equals(new StringBuilder("a"))}} trả về false. Muốn so nội dung thì dùng {{sb1.compareTo(sb2) == 0}} (Java 11+) hoặc so {{toString()}}. {{BigDecimal.equals}} lại so cả scale: {{2.0}} khác {{2.00}}.

### Câu trả lời sai phổ biến
- "Với String thì {{==}} so sánh giá trị": nó chỉ đúng tình cờ khi cả hai cùng là literal.
- "{{equals}} luôn so sánh nội dung": chỉ đúng khi class override nó.
- Quên rằng {{Integer.equals(Long)}} luôn false dù cùng giá trị.

### Pitfall production
- {{if (order.getUserId() == currentUser.getId())}} với {{Long}}: test bằng user ID 1, 2, 3 đều pass; lên production ID 10 523 thì false, gây lỗi phân quyền "không phải chủ đơn hàng". Dùng {{Objects.equals(a, b)}} (an toàn với null) hoặc so primitive.
- {{status == "ACTIVE"}} với status đọc từ DB hoặc JSON: chuỗi được tạo runtime nên luôn false. Dùng {{"ACTIVE".equals(status)}} để tránh luôn NPE, hoặc tốt hơn là enum (enum so bằng {{==}} là đúng và nhanh).

> Senior tip: bật rule Sonar/ErrorProne "reference comparison of boxed types / strings" ở mức blocker. Bug {{Long ==}} là loại lỗi chỉ lộ ra khi dữ liệu đủ lớn, nên test unit với ID nhỏ không bao giờ bắt được; khi viết test hãy cố ý dùng ID lớn hơn 127.`,
  follow: [
    '{{new String("hello")}} tạo ra bao nhiêu object? Phụ thuộc vào điều gì?',
    'Vì sao enum so sánh bằng {{==}} lại an toàn, kể cả khi deserialize?',
    '{{switch}} trên String hoạt động thế nào bên trong ({{hashCode}} rồi {{equals}})?'
  ],
  tags: ['equals', 'String pool', 'Integer cache', 'predict output', 'wrapper']
},
{
  id: 'core-023',
  topic: 'core',
  level: 'senior',
  q: 'Dự đoán output: {{return}} trong {{try}} rồi sửa biến trong {{finally}}, {{return}} trong {{finally}}, exception trong {{finally}}, và {{System.exit}} trong {{try}}. Những tình huống này gây bug production thế nào?',
  a: `**Tóm tắt:** Khi {{try}} chạy {{return expr}}, giá trị của {{expr}} được tính và lưu tạm **trước** khi {{finally}} chạy; sửa biến primitive trong {{finally}} không đổi giá trị trả về, nhưng sửa object mà reference trỏ tới thì có. {{return}} hoặc {{throw}} trong {{finally}} **thay thế** kết quả của {{try}} và nuốt mất exception gốc. {{System.exit}} dừng JVM nên {{finally}} không chạy.

### 1. Thứ tự thực thi
~~~java
static int order() {
    try {
        System.out.println("try");
        return value("return-expr");   // biểu thức return được tính trước
    } finally {
        System.out.println("finally");
    }
}
static int value(String s) { System.out.println(s); return 1; }
// Output:
// try
// return-expr
// finally
~~~

### 2. Sửa biến trong finally
~~~java
static int primitive() {
    int x = 1;
    try {
        return x;          // giá trị 1 được copy vào một slot tạm
    } finally {
        x = 2;             // đổi biến local, không đổi slot tạm
    }
}                          // primitive() trả về 1

static StringBuilder reference() {
    StringBuilder sb = new StringBuilder("a");
    try {
        return sb;         // copy reference, cùng trỏ một object
    } finally {
        sb.append("b");    // sửa chính object đó
    }
}                          // reference() trả về "ab"
~~~
Vì sao: compiler sinh bytecode lưu giá trị return vào một biến local ẩn, chạy code {{finally}} (được nhân bản inline vào từng lối ra), rồi mới {{ireturn}}/{{areturn}} giá trị ẩn đó. Với reference, thứ được copy là con trỏ chứ không phải object.

### 3. return trong finally nuốt exception
~~~java
static int swallow() {
    try {
        throw new RuntimeException("boom");
    } finally {
        return 2;          // compiler chỉ cảnh báo: finally không kết thúc bình thường
    }
}                          // swallow() trả về 2, "boom" biến mất không dấu vết
~~~

### 4. Exception trong finally thay thế exception gốc
~~~java
try {
    try {
        throw new IllegalStateException("A");
    } finally {
        throw new RuntimeException("B");
    }
} catch (RuntimeException e) {
    System.out.println(e.getMessage() + " suppressed=" + e.getSuppressed().length);
}
// Output: B suppressed=0   -> "A" mất hẳn, không có trong suppressed
~~~
Chỉ try-with-resources mới tự gắn exception lúc đóng resource vào {{getSuppressed()}}; {{finally}} viết tay thì không.

### 5. System.exit
~~~java
try {
    System.out.println("try");
    System.exit(0);
} finally {
    System.out.println("finally");   // không bao giờ in
}
// Output: try
~~~
{{System.exit}} không return; JVM chạy shutdown hook rồi dừng. {{finally}} cũng không chạy khi gọi {{Runtime.halt}}, khi process bị {{kill -9}}, JVM crash, hay khi thread daemon đang dở mà JVM tắt.

### Câu trả lời sai phổ biến
- "finally chạy sau return nên giá trị trả về là 2": sai với primitive.
- "finally luôn luôn chạy": sai với {{System.exit}}, halt, kill -9.
- "Exception trong finally sẽ được nối vào exception cũ": sai, exception cũ mất hẳn.

### Pitfall production
- Gọi {{conn.close()}} trong {{finally}} mà {{close()}} ném lỗi sẽ che mất lỗi SQL thật, log chỉ còn "connection already closed". Dùng try-with-resources.
- {{return}} trong {{finally}} làm method báo thành công trong khi giao dịch đã lỗi, nên caller không rollback hay retry. Rất khó điều tra vì log sạch.
- Gọi {{System.exit}} trong code thư viện hoặc job Spring sẽ bỏ qua {{finally}} và có thể bỏ dở batch đang ghi dở dang.

> Senior tip: cấm {{return}}/{{throw}} trong {{finally}} bằng static analysis (Sonar có rule "jump statements should not occur in finally blocks"). Trong {{finally}} chỉ nên dọn dẹp, không xử lý nghiệp vụ; nếu dọn dẹp có thể lỗi thì bọc try/catch riêng và log lỗi đó, đừng để nó đè lên lỗi chính.`,
  follow: [
    'try-with-resources sinh ra bytecode thế nào để giữ được suppressed exception?',
    'Shutdown hook có chạy khi container bị SIGTERM không? Còn SIGKILL thì sao?',
    'Nếu {{catch}} cũng có {{return}} và {{finally}} cũng có {{return}} thì giá trị nào được trả về?'
  ],
  tags: ['finally', 'exception', 'predict output', 'System.exit', 'try-catch'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-024',
  topic: 'core',
  level: 'senior',
  q: 'Dự đoán output: thứ tự chạy static block, instance block, field initializer và constructor khi có kế thừa. Vì sao gọi method overridable trong constructor lớp cha lại nguy hiểm?',
  a: `**Tóm tắt:** Static block và static field chạy **một lần**, khi class được khởi tạo lần đầu, theo thứ tự cha trước con. Mỗi lần {{new}}: constructor con gọi {{super()}} trước; sau khi constructor cha xong mới chạy field initializer và instance block của lớp con (theo thứ tự xuất hiện trong code), rồi tới thân constructor con. Vì vậy method bị override mà được gọi từ constructor cha sẽ thấy field lớp con **chưa được gán** (null/0).

### Dự đoán output: cơ bản
~~~java
class Parent {
    static { System.out.println("Parent static"); }
    { System.out.println("Parent instance block"); }
    Parent() { System.out.println("Parent constructor"); }
}
class Child extends Parent {
    static { System.out.println("Child static"); }
    { System.out.println("Child instance block"); }
    Child() { System.out.println("Child constructor"); }
}
new Child();
new Child();
~~~
~~~text
Parent static
Child static
Parent instance block
Parent constructor
Child instance block
Child constructor
Parent instance block
Parent constructor
Child instance block
Child constructor
~~~
Vì sao: muốn khởi tạo {{Child}} thì JVM phải khởi tạo {{Parent}} trước (JLS 12.4). Lần {{new}} thứ hai class đã được khởi tạo nên không còn dòng static. Compiler chép field initializer và instance block vào **mỗi constructor**, ngay sau lệnh gọi {{super(...)}}, nên chúng luôn chạy sau constructor cha.

### Bẫy 1: method override gọi từ constructor cha
~~~java
class Base {
    Base() { init(); }                 // gọi method có thể bị override
    void init() { }
}
class Derived extends Base {
    private String name = "derived";   // chỉ được gán SAU khi Base() xong
    private final int size = 10;       // constant variable: compiler inline số 10
    @Override void init() {
        System.out.println(name + " " + size);
    }
}
new Derived();
// Output: null 10
~~~
{{name}} vẫn là giá trị mặc định null vì initializer của {{Derived}} chưa chạy. {{size}} in ra 10 vì nó là {{final}} primitive gán bằng hằng compile-time, nên mọi chỗ dùng đều được thay bằng số 10. Bỏ {{final}} thì sẽ in {{null 0}}.

### Bẫy 2: thứ tự static field
~~~java
class Config {
    static Config INSTANCE = new Config();   // chạy trước
    static int counter = 0;                  // chạy sau, ghi đè
    Config() { counter++; }
}
System.out.println(Config.counter);          // Output: 0
~~~
Khi khởi tạo class, mọi static field có giá trị mặc định (counter = 0). Dòng 1 tạo object và tăng counter lên 1, sau đó dòng 2 gán lại counter = 0. Đổi thứ tự hai dòng thì output là 1.

### Khi nào class được khởi tạo
- Lần đầu {{new}}, gọi static method, đọc/ghi static field (không phải hằng), {{Class.forName}}, hoặc khởi tạo lớp con.
- Đọc một {{static final}} hằng compile-time (ví dụ {{static final int MAX = 5}}) **không** kích hoạt static block, vì giá trị đã được inline vào class gọi.
- Đây là nền tảng của pattern Holder: {{static class Holder}} chứa instance singleton, được khởi tạo lazy và thread-safe nhờ JVM khoá quá trình class init.

### Câu trả lời sai phổ biến
- "Instance block chạy trước constructor cha": sai, nó chạy sau {{super()}}.
- "Static block chạy mỗi lần new": sai, chỉ một lần cho mỗi class loader.
- Cho rằng {{final}} field luôn có giá trị khi được gọi từ constructor cha: chỉ đúng với hằng compile-time.

### Pitfall production
- Lớp cha gọi {{init()}} hoặc {{validate()}} trong constructor, lớp con override và dùng field chưa gán, gây NPE khó hiểu. Effective Java khuyên: constructor không được gọi method overridable (trực tiếp hay gián tiếp).
- Exception trong static block làm lần đầu thấy {{ExceptionInInitializerError}}, các lần sau thấy {{NoClassDefFoundError}}. Ai chỉ đọc log mới nhất sẽ tưởng thiếu jar.
- Hai class có static init phụ thuộc vòng nhau và được khởi tạo từ hai thread khác nhau có thể deadlock ngay lúc khởi động.

> Senior tip: giữ static block thật mỏng (không gọi network/DB, không đọc config phức tạp). Trong Spring, dùng constructor injection và {{@PostConstruct}} thay vì logic trong static/instance block; khi gặp {{NoClassDefFoundError}} trên production, hãy tìm {{ExceptionInInitializerError}} đầu tiên trong log.`,
  follow: [
    'Vì sao static nested Holder là cách lazy singleton thread-safe mà không cần {{synchronized}}?',
    'Phân biệt {{ExceptionInInitializerError}} và {{NoClassDefFoundError}} khi điều tra lỗi khởi động.',
    'Record và enum có thứ tự khởi tạo đặc biệt gì không?'
  ],
  tags: ['initialization order', 'static block', 'constructor', 'predict output', 'class loading'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-025',
  topic: 'core',
  level: 'senior',
  q: 'Stack vs heap trong JVM: biến local, object, reference, static field và String pool nằm ở đâu? {{StackOverflowError}} xảy ra khi nào trên production và xử lý thế nào?',
  a: `**Tóm tắt:** Mỗi thread có một **JVM stack** riêng gồm các frame; mỗi lần gọi method sinh một frame chứa biến local (primitive và **reference**) và operand stack, method return thì frame bị huỷ. Mọi **object** (kể cả mảng và field bên trong object) nằm trên **heap** dùng chung, do GC quản lý. Static field nằm cùng đối tượng {{Class}} trên heap, metadata của class nằm ở Metaspace, String pool nằm trên heap từ Java 7. {{StackOverflowError}} xảy ra khi chuỗi lời gọi sâu vượt quá kích thước stack ({{-Xss}}), thường do đệ quy vô hạn.

### Ví dụ: cái gì nằm ở đâu
~~~java
class TransferService {
    static final Map<String, BigDecimal> LIMITS = new HashMap<>(); // reference trong Class mirror, map trên heap

    void transfer(Account from, long amount) {   // 'from': reference, nằm trong frame
        int fee = 1_000;                          // primitive local: nằm trong frame
        Receipt r = new Receipt(amount, fee);     // 'r' trong frame, object Receipt trên heap
        from.debit(amount + fee);                 // frame mới cho debit() được push
    }   // frame bị pop: fee và r biến mất; Receipt thành rác nếu không ai giữ reference
}
~~~
Lưu ý: field {{int}} của một object nằm trên **heap** cùng object đó, không phải trên stack.

### So sánh
| | Stack (mỗi thread) | Heap (dùng chung) |
|---|---|---|
| Chứa gì | Frame: biến local, reference, operand stack | Object, mảng, field của object, String pool |
| Vòng đời | Theo lời gọi method (LIFO) | Đến khi không còn reference và GC thu hồi |
| Kích thước | {{-Xss}} (Linux 64-bit mặc định khoảng 1 MB) | {{-Xms}}/{{-Xmx}} |
| Lỗi khi hết | {{StackOverflowError}} | {{OutOfMemoryError: Java heap space}} |
| Thread-safety | Biến local tự nhiên thread-confined | Cần đồng bộ khi chia sẻ |

### Vì sao thiết kế như vậy
- Stack cấp phát/giải phóng chỉ bằng dịch con trỏ, cực rẻ, và không cần GC; nhưng kích thước phải biết theo method và sống ngắn.
- Object có vòng đời không đoán trước (được trả về, lưu vào cache) nên phải nằm ở vùng chung có GC.
- JIT có **escape analysis**: object không thoát khỏi method có thể được scalar replacement (tách field thành biến local) nên không cấp phát trên heap. Đây là tối ưu, không phải đảm bảo.
- Virtual thread (Java 21): khi bị unmount, stack của nó được lưu thành các chunk object trên heap, nhờ vậy tạo hàng triệu virtual thread được.

### StackOverflowError trên production
- Entity JPA hai chiều ({{Order}} có list {{OrderItem}}, {{OrderItem}} trỏ ngược lại {{Order}}) dùng Lombok {{@Data}}: {{toString()}}/{{hashCode()}} gọi nhau vô hạn. Jackson serialize quan hệ hai chiều cũng vậy.
- Đệ quy trên dữ liệu do người dùng kiểm soát: cây danh mục sâu, JSON lồng nhau hàng nghìn tầng, regex có backtracking lớn.
- Xử lý: sửa thuật toán thành vòng lặp + {{ArrayDeque}} làm stack tường minh; loại field quan hệ khỏi {{toString}}/{{equals}}; dùng {{@JsonManagedReference}}/{{@JsonBackReference}} hoặc DTO; giới hạn độ sâu input. Tăng {{-Xss}} chỉ là giải pháp tạm và tốn bộ nhớ nhân với số thread.

### Câu trả lời sai phổ biến
- "Primitive luôn nằm trên stack": sai, primitive là field của object thì nằm trên heap.
- "Static nằm trên stack" hoặc "String pool nằm trong PermGen": PermGen đã bị bỏ từ Java 8, String pool chuyển lên heap từ Java 7.
- "Java truyền object theo reference": Java luôn pass-by-value; giá trị được copy là reference.

> Senior tip: khi thấy {{StackOverflowError}}, đọc stack trace để tìm đoạn lặp lại (thường là {{toString}} hoặc {{hashCode}} lặp xen kẽ giữa 2 class). Đừng bắt {{StackOverflowError}} để xử lý tiếp, vì trạng thái lúc đó có thể dở dang. Với {{OutOfMemoryError: unable to create native thread}}, nguyên nhân là quá nhiều thread (mỗi thread tốn stack riêng) chứ không phải thiếu heap.`,
  follow: [
    'Escape analysis và scalar replacement hoạt động thế nào? Làm sao biết nó có xảy ra?',
    'Metaspace khác PermGen ở đâu? Khi nào gặp {{OutOfMemoryError: Metaspace}}?',
    'Vì sao virtual thread vẫn có thể bị pin vào carrier thread trong Java 21?'
  ],
  tags: ['stack', 'heap', 'StackOverflowError', 'JVM memory', 'String pool'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'core-026',
  topic: 'core',
  level: 'lead',
  q: 'Access modifier: {{protected}} và package-private thực sự hoạt động thế nào (kể cả bẫy khi truy cập qua reference kiểu cha)? Vì sao field nên {{private}}, và bạn dùng visibility để giữ ranh giới module trong codebase lớn thế nào?',
  a: `**Tóm tắt:** Có 4 mức: {{private}} (chỉ trong class), package-private/không ghi gì (cùng package), {{protected}} (cùng package **cộng** lớp con ở package khác, nhưng lớp con chỉ truy cập được qua reference kiểu của chính nó), {{public}} (mọi nơi, nếu module export package). Field nên {{private}} để class tự giữ invariant và đổi được cách lưu trữ mà không làm vỡ code khác. Ở mức kiến trúc, package-private là công cụ rẻ nhất để giấu implementation của một module nghiệp vụ.

### Bảng truy cập
| Modifier | Cùng class | Cùng package | Lớp con khác package | Nơi khác |
|---|---|---|---|---|
| private | Có | Không | Không | Không |
| (package-private) | Có | Có | Không | Không |
| protected | Có | Có | Có (qua kiểu của chính lớp con) | Không |
| public | Có | Có | Có | Có |

Điều nhiều người không biết: {{protected}} **rộng hơn** package-private, vì nó bao gồm cả cùng package.

### Bẫy protected khi khác package (JLS 6.6.2)
~~~java
package com.bank.core;
public class Account {
    protected long balance;
    void audit() { }                         // package-private
}

package com.bank.saving;
public class SavingAccount extends Account {
    void applyInterest(Account other, SavingAccount same) {
        this.balance += 10;                  // OK: qua chính object này
        same.balance += 10;                  // OK: reference kiểu SavingAccount
        // other.balance += 10;              // LỖI compile: Account không phải kiểu của mình
        // audit();                          // LỖI compile: package-private, khác package
    }
}
~~~
Vì sao: {{protected}} nghĩa là "lớp con được dùng phần kế thừa **của chính nó**", không phải "được đọc protected field của mọi object kiểu cha". Nếu không, bất kỳ ai cũng có thể viết một lớp con giả để đọc state của object khác.

### Vì sao field nên private
- **Invariant**: chỉ method của class mới đổi được state, nên kiểm tra nằm một chỗ ({{balance >= 0}}).
- **Đổi representation**: đổi {{long cents}} sang {{BigDecimal}} mà caller không phải sửa.
- **Thread-safety**: class không thể đảm bảo đồng bộ hay visibility cho field mà ai cũng ghi trực tiếp được.
- **Hibernate proxy**: trong {{equals}} mà đọc {{other.id}} trực tiếp, nếu {{other}} là lazy proxy thì field của proxy là null; gọi {{other.getId()}} mới đúng. Đây là bug thật hay gặp khi so sánh entity.

### Dùng visibility làm ranh giới module (góc nhìn Lead)
- Tổ chức **package-by-feature** ({{payment}}, {{loan}}, {{customer}}) thay vì package-by-layer ({{controller}}, {{service}}, {{repository}}). Khi đó chỉ class facade/API là {{public}}, còn repository, mapper, helper để package-private, nên module khác không thể gọi tắt vào repository của bạn.
- Spring vẫn inject được bean package-private, và test đặt cùng package vẫn test được.
- Dùng ArchUnit (hoặc Spring Modulith) để viết test kiểm tra rule "module loan không được phụ thuộc vào package internal của payment" trong CI.
- Java 9 JPMS: {{public}} không còn nghĩa là ai cũng thấy; package phải được {{exports}} trong {{module-info.java}}. Từ Java 16/17, JDK chặn mặc định reflection vào API nội bộ (JEP 403), nên các thư viện cũ dùng {{setAccessible}} vào {{sun.*}} có thể lỗi khi nâng cấp.

### Câu trả lời sai phổ biến
- "protected chỉ dành cho lớp con": sai, cùng package cũng truy cập được.
- "Không ghi modifier thì mặc định là private" (nhầm với C#/C++ class member).
- "Field private + getter/setter public là đủ encapsulation": setter cho mọi field vẫn phá invariant.

### Pitfall trong Spring
- {{@Transactional}} hoặc {{@Cacheable}} đặt trên method {{private}} không bao giờ có hiệu lực, vì proxy không chặn được lời gọi đó; gọi nội bộ qua {{this}} cũng bỏ qua proxy. Từ Spring 6, proxy dạng class (CGLIB) hỗ trợ thêm method protected và package-private, nhưng private thì vẫn không.

> Senior tip: trong code review, mặc định mọi class mới là package-private và chỉ nâng lên {{public}} khi có lý do. Với monolith lớn đang tính tách microservice, việc siết visibility theo package-by-feature trước là bước rẻ nhất để lộ ra phụ thuộc chéo và chuẩn bị cắt module.`,
  follow: [
    'Package-by-feature và package-by-layer: bạn chọn cái nào và vì sao?',
    'Làm sao test method package-private mà không phải mở thành public?',
    'Spring Modulith hoặc ArchUnit giúp giữ ranh giới module như thế nào?'
  ],
  tags: ['access modifier', 'protected', 'package-private', 'encapsulation', 'modularity']
},
{
  id: 'collections-015',
  topic: 'collections',
  level: 'senior',
  q: 'So sánh {{HashMap}}, {{Hashtable}}, {{Collections.synchronizedMap}} và {{ConcurrentHashMap}}. Trong service xử lý đồng thời bạn chọn cái nào, và vì sao "đã thread-safe" vẫn có thể sai?',
  a: `**Tóm tắt:** {{HashMap}} không thread-safe, cho phép một key null và nhiều value null. {{Hashtable}} là class legacy từ Java 1.0, mọi method {{synchronized}} trên chính object, không cho null. {{synchronizedMap}} là wrapper bọc một map bất kỳ, khoá một mutex cho mọi thao tác; về bản chất giống {{Hashtable}}. {{ConcurrentHashMap}} khoá theo từng bin (CAS + {{synchronized}} trên node đầu), đọc không khoá, có thao tác nguyên tử {{compute}}/{{merge}}, không cho null. Trong code mới nên dùng {{ConcurrentHashMap}}; nhưng thread-safe từng method không có nghĩa là chuỗi thao tác check-then-act của bạn cũng an toàn.

### Bảng so sánh
| | HashMap | Hashtable | synchronizedMap | ConcurrentHashMap |
|---|---|---|---|---|
| Thread-safe | Không | Có (1 lock) | Có (1 lock) | Có (lock theo bin) |
| Null key/value | 1 key null, nhiều value null | Không | Theo map gốc | Không |
| Đọc đồng thời | Không an toàn | Bị khoá | Bị khoá | Không khoá |
| Iterator | Fail-fast | Enumeration/fail-fast | Fail-fast, phải tự synchronized | Weakly consistent, không ném CME |
| Thao tác nguyên tử | Không | Không (ngoài từng method) | Không | {{putIfAbsent}}, {{compute}}, {{merge}} |
| Ghi chú | Mặc định cho code đơn luồng | Legacy, tránh dùng | Bọc TreeMap/LinkedHashMap khi cần | Lựa chọn mặc định cho đa luồng |

### Vì sao HashMap dùng chung giữa thread là nguy hiểm
Hai thread cùng {{put}} có thể ghi đè node của nhau (mất dữ liệu), hoặc thấy {{size}} sai trong lúc resize. Ở Java 7, resize đồng thời còn có thể tạo vòng lặp trong linked list và làm CPU 100%. Java 8 đã đổi cách chuyển node nên không còn vòng lặp kiểu đó, nhưng vẫn mất dữ liệu.

### "Thread-safe" vẫn sai: compound action
~~~java
Map<String, Integer> counts = Collections.synchronizedMap(new HashMap<>());

// SAI: hai thread cùng thấy chưa có key, cùng put 1 -> mất một lần đếm
if (!counts.containsKey(user)) counts.put(user, 1);
else counts.put(user, counts.get(user) + 1);

// ĐÚNG: một thao tác nguyên tử trên ConcurrentHashMap
ConcurrentMap<String, Integer> safe = new ConcurrentHashMap<>();
safe.merge(user, 1, Integer::sum);

// Duyệt synchronizedMap: bắt buộc tự khoá trên chính wrapper
synchronized (counts) {
    for (var e : counts.entrySet()) { /* ... */ }
}
~~~
Mỗi method riêng lẻ có khoá, nhưng giữa {{containsKey}} và {{put}} thread khác vẫn chen vào được.

### Vì sao ConcurrentHashMap không cho null
Nếu {{get(k)}} trả về null, trong môi trường đồng thời ta không thể phân biệt "không có key" với "key có value null" (gọi thêm {{containsKey}} thì kết quả có thể đã thay đổi). Cấm null loại bỏ sự mơ hồ này.

### Câu trả lời sai phổ biến
- "ConcurrentHashMap chia 16 segment": đó là Java 7; từ Java 8 khoá theo bin.
- "synchronizedMap nhanh hơn Hashtable": cả hai đều một lock toàn cục, hiệu năng tương đương.
- "Dùng ConcurrentHashMap là hết race condition": vẫn sai nếu dùng {{get}} rồi {{put}} thay vì {{compute}}/{{merge}}.

### Pitfall production
- Gọi API ngoài hoặc query DB bên trong {{computeIfAbsent}}: bin bị khoá suốt thời gian đó, các thread khác ghi vào cùng bin bị chặn. Cache nặng nên dùng Caffeine.
- Trong hàm mapping của {{computeIfAbsent}} lại sửa chính map đó có thể ném {{IllegalStateException: Recursive update}} hoặc treo.
- {{size()}} chỉ là ước lượng khi đang ghi; dùng {{mappingCount()}} cho map lớn và đừng dựa vào nó để ra quyết định nghiệp vụ.

> Senior tip: khi review code thấy {{Collections.synchronizedMap}} hay {{Hashtable}} trong code mới, gần như luôn thay được bằng {{ConcurrentHashMap}} và {{merge}}/{{compute}}. Nếu cần map có thứ tự và đồng thời, dùng {{ConcurrentSkipListMap}} thay vì bọc {{TreeMap}} bằng một lock toàn cục.`,
  follow: [
    'Vì sao iterator của {{ConcurrentHashMap}} không ném {{ConcurrentModificationException}}? Nó thấy được dữ liệu nào?',
    'Khi nào {{ConcurrentHashMap}} vẫn chưa đủ và bạn cần lock bên ngoài hoặc cache như Caffeine?',
    'Đếm số request theo user ở throughput cao: {{merge}} hay {{LongAdder}} trong map?'
  ],
  tags: ['HashMap', 'Hashtable', 'ConcurrentHashMap', 'synchronizedMap', 'thread-safety'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-016',
  topic: 'collections',
  level: 'senior',
  q: '{{HashSet}} hoạt động thế nào bên trong? Chuyện gì xảy ra nếu bạn sửa field tham gia {{hashCode}} của một object sau khi đã đưa nó vào {{HashSet}} hoặc làm key của {{HashMap}}?',
  a: `**Tóm tắt:** {{HashSet}} thực chất là một {{HashMap}} bên trong: phần tử là key, value là một object giả dùng chung ({{PRESENT}}). {{add}} trả về true khi {{map.put}} trả về null (key chưa có). Vì vậy mọi quy tắc của {{HashMap}} đều áp dụng: tìm bucket theo {{hashCode}}, xác nhận bằng {{equals}}. Nếu sửa field tham gia {{hashCode}} sau khi đã add, object bị "lạc" trong bucket cũ: {{contains}} và {{remove}} đều trả về false, add lại thì thành bản ghi trùng, và object cũ không bao giờ được xoá (memory leak).

### Bên trong
~~~java
// Rút gọn từ mã nguồn JDK
public class HashSet<E> {
    private transient HashMap<E, Object> map;
    private static final Object PRESENT = new Object();

    public boolean add(E e)      { return map.put(e, PRESENT) == null; }
    public boolean contains(Object o) { return map.containsKey(o); }
    public boolean remove(Object o)   { return map.remove(o) == PRESENT; }
}
~~~
- {{LinkedHashSet}} dựa trên {{LinkedHashMap}} nên giữ thứ tự chèn.
- {{TreeSet}} dựa trên {{TreeMap}}, so trùng bằng {{compareTo}}/{{Comparator}} chứ **không** dùng {{equals}}/{{hashCode}}. Ví dụ {{new BigDecimal("2.0")}} và {{new BigDecimal("2.00")}}: {{HashSet}} giữ 2 phần tử (equals so cả scale), {{TreeSet}} chỉ giữ 1 (compareTo bằng 0).

### Dự đoán output: key bị đổi sau khi add
~~~java
class Key {
    String no;
    Key(String no) { this.no = no; }
    @Override public boolean equals(Object o) { return o instanceof Key k && k.no.equals(no); }
    @Override public int hashCode() { return no.hashCode(); }
}

Set<Key> set = new HashSet<>();
Key a = new Key("001");
set.add(a);
a.no = "002";                                  // đổi field dùng trong hashCode

System.out.println(set.contains(a));           // false
System.out.println(set.contains(new Key("001"))); // false
System.out.println(set.remove(a));             // false
set.add(a);
System.out.println(set.size());                // 2
~~~
Vì sao: node trong bucket lưu **hash cũ** (tính từ "001"). Tìm {{a}} thì hash mới (từ "002") không khớp với node đó. Tìm {{new Key("001")}} thì đúng bucket và hash khớp, nhưng {{equals}} so "001" với field hiện tại "002" nên vẫn false. Object vẫn nằm trong set nhưng không ai tìm thấy, và add lại tạo node thứ hai trỏ cùng object.

### Tình huống thật hay gặp
- **JPA entity** có {{hashCode}} dựa trên id tự sinh: thêm entity mới (id null) vào {{Set<OrderItem>}}, sau {{persist}} id được gán, hash đổi, rồi {{remove}} không xoá được, orphanRemoval không chạy. Cách phổ biến: dùng business key bất biến, hoặc cho {{hashCode}} trả về hằng theo class và {{equals}} so id khi id khác null.
- Dùng {{List}} hay {{StringBuilder}} mutable làm key của cache: ai đó sửa list sau khi put là cache không bao giờ hit và phình to dần.
- Lombok {{@Data}} sinh {{hashCode}} theo mọi field: entity bị sửa field là lạc khỏi set.

### Cách phòng tránh
| Cách | Ghi chú |
|---|---|
| Key bất biến ({{record}}, String, field final) | Lựa chọn tốt nhất |
| {{hashCode}} chỉ dựa trên field không đổi | Ví dụ mã tài khoản, không dùng số dư |
| Muốn đổi key: remove, sửa, rồi add lại | Phải làm khi object chưa đổi |
| Defensive copy khi nhận key từ ngoài | {{List.copyOf}} trước khi dùng làm key |

### Câu trả lời sai phổ biến
- "HashSet dùng equals để kiểm tra trùng": chưa đủ, nó dùng {{hashCode}} chọn bucket trước, sau đó mới {{equals}}.
- "Sửa key thì set tự cập nhật": collection không biết object bị sửa.
- "TreeSet cũng dựa vào equals": sai, nó dựa vào compareTo.

> Senior tip: khi gặp bug "đã add vào set mà contains trả false" hoặc memory leak ở cache map, việc đầu tiên là kiểm tra key có bị sửa sau khi put không. Quy tắc team nên có: mọi class dùng làm key của Map/Set phải bất biến, tốt nhất là {{record}}.`,
  follow: [
    'Viết {{equals}}/{{hashCode}} cho JPA entity thế nào để an toàn với Set và Hibernate proxy?',
    'Vì sao {{TreeSet}} với comparator không nhất quán với {{equals}} lại vi phạm contract của {{Set}}?',
    'Nếu {{hashCode}} luôn trả về cùng một hằng số thì {{HashSet}} chạy thế nào từ Java 8?'
  ],
  tags: ['HashSet', 'hashCode', 'mutable key', 'HashMap', 'JPA entity'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'collections-017',
  topic: 'collections',
  level: 'mid',
  q: 'Bạn cần xoá các phần tử thoả điều kiện khỏi một {{ArrayList}} (hoặc {{Map}}) đang duyệt. For-each, {{Iterator.remove}}, {{removeIf}} và vòng for theo index khác nhau thế nào? Dự đoán output của vài trường hợp bẫy.',
  a: `**Tóm tắt:** Gọi {{list.remove}} trong vòng for-each thường ném {{ConcurrentModificationException}} vì iterator phát hiện {{modCount}} bị đổi ngoài nó. Cách đúng: {{Iterator.remove()}} khi cần logic phức tạp, {{removeIf}} (Java 8+) là ngắn gọn và nhanh nhất với {{ArrayList}}, còn map thì dùng {{map.entrySet().removeIf(...)}}. Vòng for theo index thì phải duyệt ngược hoặc chỉnh index cẩn thận.

### Vì sao for-each ném CME
For-each trên {{List}} được compiler dịch thành {{Iterator}}. {{ArrayList}} có biến {{modCount}} tăng mỗi lần thay đổi cấu trúc; iterator lưu {{expectedModCount}} khi tạo và so lại trong mỗi lần {{next()}}. Gọi {{list.remove}} trực tiếp làm {{modCount}} lệch, lần {{next()}} kế tiếp ném CME. Lỗi này xảy ra ngay cả với **một thread**.

### Dự đoán output: hai trường hợp bẫy
~~~java
List<String> l1 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l1) {
    if (s.equals("a")) l1.remove(s);
}
// Ném ConcurrentModificationException

List<String> l2 = new ArrayList<>(List.of("a", "b", "c"));
for (String s : l2) {
    if (s.equals("b")) l2.remove(s);
}
System.out.println(l2);
// Output: [a, c]   -> KHÔNG ném lỗi, và "c" không bao giờ được kiểm tra
~~~
Vì sao trường hợp 2 không lỗi: sau khi xoá "b", size còn 2, con trỏ {{cursor}} của iterator cũng là 2. {{hasNext()}} chỉ kiểm tra {{cursor != size}} nên trả về false và vòng lặp kết thúc trước khi {{next()}} kịp kiểm tra {{modCount}}. Code "chạy được" nhưng bỏ sót phần tử cuối, một bug im lặng nguy hiểm hơn cả CME.

### Các cách đúng
~~~java
// 1. Iterator.remove: xoá phần tử vừa next(), iterator tự cập nhật trạng thái
Iterator<Order> it = orders.iterator();
while (it.hasNext()) {
    Order o = it.next();
    if (o.isExpired()) {
        audit.log(o);            // cần logic thêm trước khi xoá
        it.remove();
    }
}

// 2. removeIf: gọn và O(n) với ArrayList
orders.removeIf(Order::isExpired);

// 3. Map: xoá trên view entrySet / values
balances.entrySet().removeIf(e -> e.getValue().signum() == 0);

// 4. Index: duyệt ngược để việc dịch phần tử không làm bỏ sót
for (int i = list.size() - 1; i >= 0; i--) {
    if (shouldRemove(list.get(i))) list.remove(i);
}
~~~

### So sánh
| Cách | Độ phức tạp với ArrayList | Ghi chú |
|---|---|---|
| for-each + list.remove | CME hoặc bỏ sót | Không bao giờ dùng |
| Iterator.remove | O(n) mỗi lần xoá, tổng có thể O(n^2) | Linh hoạt, dùng được với LinkedList (O(1)) |
| removeIf | O(n) tổng, dịch mảng một lần | Lựa chọn mặc định |
| for index xuôi + remove(i) | Bỏ sót phần tử kế tiếp nếu quên i-- | Dễ sai |
| stream().filter().toList() | O(n), tạo list mới | Khi muốn giữ list gốc |

### Câu trả lời sai phổ biến
- "CME chỉ xảy ra khi nhiều thread": sai, một thread vẫn bị.
- "Đổi sang {{CopyOnWriteArrayList}} là xong": nó không ném CME vì duyệt trên snapshot, nhưng mỗi lần remove copy toàn bộ mảng, và {{iterator().remove()}} của nó ném {{UnsupportedOperationException}}.
- "CME luôn được ném khi sửa": tài liệu JDK nói fail-fast chỉ là best-effort, như ví dụ "b" ở trên.

> Senior tip: trong code review, thấy {{remove}} bên trong for-each là chặn ngay. Với batch lớn (hàng trăm nghìn phần tử), chuyển từ vòng {{Iterator.remove}} sang {{removeIf}} có thể giảm thời gian từ vài giây xuống vài mili-giây vì tránh dịch mảng lặp lại.`,
  follow: [
    'Vì sao {{ConcurrentHashMap}} cho phép xoá trong lúc duyệt mà không ném CME?',
    'Sửa value (không đổi cấu trúc) trong lúc duyệt {{HashMap}} có ném CME không?',
    '{{removeIf}} của {{ArrayList}} được cài đặt thế nào để đạt O(n)?'
  ],
  tags: ['ConcurrentModificationException', 'Iterator', 'removeIf', 'ArrayList', 'predict output']
},
{
  id: 'collections-018',
  topic: 'collections',
  level: 'senior',
  q: '{{Arrays.asList}} có những bẫy gì (fixed-size, là view của mảng, mảng primitive)? Dự đoán output và cho biết bạn chọn gì thay thế trong từng tình huống.',
  a: `**Tóm tắt:** {{Arrays.asList}} không tạo {{java.util.ArrayList}} mà trả về một class nội bộ {{Arrays$ArrayList}} bọc **chính mảng gốc**. Vì vậy nó có kích thước cố định ({{add}}/{{remove}} ném {{UnsupportedOperationException}}), {{set}} ghi xuyên xuống mảng và ngược lại, và truyền vào mảng primitive thì nhận được list **một phần tử** là cả mảng. Cần list sửa được thì bọc {{new ArrayList<>(...)}}; cần bất biến thì dùng {{List.of}}/{{List.copyOf}}.

### Dự đoán output
~~~java
String[] arr = {"b", "a", "c"};
List<String> list = Arrays.asList(arr);

list.set(0, "z");
System.out.println(arr[0]);                 // z          (list ghi xuyên xuống mảng)
arr[1] = "y";
System.out.println(list);                   // [z, y, c]  (mảng đổi thì list thấy ngay)
Collections.sort(list);
System.out.println(Arrays.toString(arr));   // [c, y, z]  (sort list là sort mảng)
list.add("d");                              // UnsupportedOperationException

int[] nums = {1, 2, 3};
System.out.println(Arrays.asList(nums).size());    // 1 -> kiểu là List<int[]>
Integer[] boxed = {1, 2, 3};
System.out.println(Arrays.asList(boxed).size());   // 3
~~~

### Vì sao lại như vậy
- **View, không phải copy**: {{Arrays$ArrayList}} chỉ giữ reference tới mảng, nên tạo list là O(1) và không tốn bộ nhớ. Đổi lại, mảng không thể giãn ra, nên mọi thao tác đổi kích thước bị cấm. Class này kế thừa {{AbstractList}}, mà {{add}}/{{remove}} mặc định ở đó ném UOE; {{clear()}} hay {{removeIf}} khớp phần tử nào đó cũng ném UOE vì cuối cùng gọi {{remove}}.
- **Mảng primitive**: chữ ký là {{asList(T... a)}}; generic không nhận primitive, nên {{int[]}} không thể khớp thành {{T[]}} mà chính {{int[]}} trở thành một {{T}}. Kết quả là {{List<int[]>}} có 1 phần tử. Cần list số thì dùng {{Arrays.stream(nums).boxed().toList()}} hoặc khai báo {{Integer[]}}.
- **Null**: {{Arrays.asList}} chấp nhận null, còn {{List.of}} ném NPE khi tạo, và cả {{List.of(...).contains(null)}} cũng ném NPE.

### Chọn gì thay thế
| Nhu cầu | Dùng | Ghi chú |
|---|---|---|
| List sửa được, thêm/xoá | {{new ArrayList<>(Arrays.asList(arr))}} | Copy, tách khỏi mảng |
| List bất biến, không null | {{List.of(...)}} / {{List.copyOf(c)}} | Ném UOE với cả {{set}} |
| Xem mảng như list, có sort/set | {{Arrays.asList(arr)}} | Chấp nhận việc ghi xuyên |
| Từ mảng primitive | {{IntStream.of(...).boxed().toList()}} | Hoặc thư viện primitive collection |

### Câu trả lời sai phổ biến
- "Arrays.asList trả về ArrayList": đúng tên class nhưng là class lồng trong {{Arrays}}, không phải {{java.util.ArrayList}}.
- "Arrays.asList là immutable": sai, {{set}} và {{sort}} vẫn chạy và còn sửa luôn mảng gốc.
- "Arrays.asList(intArray) cho ra List<Integer>": sai, ra {{List<int[]>}}.

### Pitfall production
- Hàm A trả về {{Arrays.asList(...)}}, hàm B ở module khác nhận {{List}} và gọi {{add}}: test của A pass, lỗi chỉ xuất hiện ở luồng kết hợp trên production với {{UnsupportedOperationException}} rất khó hiểu.
- Truyền {{Arrays.asList(arr)}} cho một component rồi sau đó tái sử dụng hoặc sửa mảng {{arr}} (buffer dùng lại): component kia đột nhiên thấy dữ liệu thay đổi.
- Gán {{Arrays.asList(...)}} vào collection của JPA entity lúc khởi tạo, sau này code nghiệp vụ gọi {{getItems().add(...)}} thì vỡ. Khởi tạo collection của entity bằng {{new ArrayList<>()}}.

> Senior tip: quy ước API nội bộ: method public trả về {{List}} thì hoặc là bất biến rõ ràng ({{List.copyOf}}), hoặc ghi rõ trong Javadoc là caller được sửa. Đừng trả về {{Arrays.asList}} ra ngoài ranh giới module, vì nó là trạng thái "nửa sửa được" khó đoán nhất.`,
  follow: [
    '{{List.of}} khác {{Collections.unmodifiableList}} ở điểm nào khi list gốc thay đổi?',
    'Vì sao {{Arrays.asList(1, 2, 3).contains(1L)}} trả về false?',
    'Làm sao chuyển {{int[]}} sang {{List<Integer>}} hiệu quả với mảng vài triệu phần tử?'
  ],
  tags: ['Arrays.asList', 'UnsupportedOperationException', 'immutable', 'List.of', 'predict output'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-011',
  topic: 'modern',
  level: 'senior',
  q: '{{Stream.toList()}} (Java 16) khác {{collect(Collectors.toList())}} và {{Collectors.toUnmodifiableList()}} thế nào về mutability, null và kiểu trả về? Thay hàng loạt bằng IDE có an toàn không?',
  a: `**Tóm tắt:** {{collect(Collectors.toList())}} (Java 8) trả về list mà spec **không hứa** gì về kiểu hay mutability (thực tế hiện nay là {{ArrayList}}, sửa được). {{Collectors.toUnmodifiableList()}} (Java 10) trả về list bất biến và **ném NPE nếu có null**. {{Stream.toList()}} (Java 16) trả về list bất biến nhưng **cho phép null**. Thay hàng loạt {{collect(toList())}} bằng {{toList()}} không an toàn: code nào sau đó {{add}}/{{sort}}/{{set}} trên list kết quả sẽ ném {{UnsupportedOperationException}} lúc runtime.

### Dự đoán output
~~~java
List<String> a = Stream.of("x", "y").collect(Collectors.toList());
a.add("z");                 // chạy được (đang là ArrayList), nhưng spec không đảm bảo

List<String> b = Stream.of("x", "y").toList();
b.add("z");                 // UnsupportedOperationException

List<String> c = Stream.of("x", null).toList();     // OK: [x, null]

List<String> d = Stream.of("x", null)
        .collect(Collectors.toUnmodifiableList());  // NullPointerException
~~~

### Bảng so sánh
| | collect(toList()) | toUnmodifiableList() | Stream.toList() |
|---|---|---|---|
| Từ phiên bản | Java 8 | Java 10 | Java 16 |
| Sửa được | Không đảm bảo (thực tế có) | Không | Không |
| Phần tử null | Cho phép | NPE | Cho phép |
| Suy luận kiểu | Theo target type | Theo target type | Cố định theo kiểu phần tử của stream |
| Độ dài code | Dài | Dài | Ngắn nhất |

### Khác biệt về kiểu trả về (bẫy khi migrate)
~~~java
// Compile được: T của collector được suy ra là Number từ target type
List<Number> ok = Stream.of(1, 2).collect(Collectors.toList());

// Lỗi compile: toList() của Stream<Integer> trả về đúng List<Integer>
// List<Number> err = Stream.of(1, 2).toList();
~~~
{{toList()}} là method của {{Stream<T>}} và trả về {{List<T>}}, nên không có chỗ cho compiler suy luận kiểu rộng hơn. Muốn vậy thì phải {{map}} sang kiểu cha hoặc dùng {{Stream.<Number>of(1, 2)}}.

### Vì sao Java thêm toList()
- Pattern {{collect(Collectors.toList())}} xuất hiện khắp nơi và dài dòng.
- Đa số trường hợp list kết quả chỉ để đọc; trả về bất biến giúp tránh bug chia sẻ state.
- Cho phép null để thay thế được phần lớn code cũ mà không vỡ ngay vì NPE (khác với {{toUnmodifiableList}}).

### Khi nào dùng cái nào
- Mặc định code mới: {{toList()}}.
- Cần list sửa được (sẽ sort, add tiếp): {{collect(Collectors.toCollection(ArrayList::new))}}, đảm bảo kiểu rõ ràng thay vì dựa vào hành vi ngầm của {{Collectors.toList()}}.
- Muốn phát hiện sớm dữ liệu null (ví dụ danh sách mã giao dịch không được null): {{toUnmodifiableList()}}.

### Câu trả lời sai phổ biến
- "toList() chỉ là cách viết tắt của collect(Collectors.toList())": sai, khác cả mutability lẫn suy luận kiểu.
- "toList() và toUnmodifiableList() giống hệt": khác ở chỗ xử lý null.
- "List bất biến thì phần tử cũng bất biến": sai, chỉ cấu trúc list bất biến; object bên trong vẫn sửa được.

### Pitfall production
- Sonar/IDE gợi ý "Replace with toList()", dev bấm áp dụng cho cả project; một service ở xa gọi {{result.sort(...)}} hoặc {{removeIf}} và nổ UOE trên production, vì test không cover nhánh đó.
- Trả list bất biến cho Jackson thì không sao, nhưng gán vào collection của JPA entity rồi để code khác gọi {{add}} thì lỗi.

> Senior tip: khi migrate, làm theo từng module và grep các chỗ list kết quả bị sửa ({{add}}, {{sort}}, {{remove}}, {{set}}) trước khi thay. Đưa vào coding convention: "list trả ra từ stream là bất biến; cần sửa thì dùng {{toCollection(ArrayList::new)}}" để ý đồ được thể hiện ngay trong code.`,
  follow: [
    'Vì sao {{Collectors.toList()}} không hứa trả về {{ArrayList}}? Điều đó ảnh hưởng gì khi nâng cấp JDK?',
    '{{Collectors.toMap}} và {{Collectors.toUnmodifiableMap}} xử lý duplicate key và null thế nào?',
    'Khi nào bạn chủ động muốn list chứa null bị chặn sớm thay vì cho qua?'
  ],
  tags: ['Stream.toList', 'Collectors', 'immutable', 'Java 16', 'migration'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-012',
  topic: 'modern',
  level: 'lead',
  q: 'Service của bạn cần gọi API core banking/đối tác qua HTTP. {{java.net.http.HttpClient}} (Java 11+) dùng thế nào cho đúng (sync/async, timeout, HTTP/2)? So với RestTemplate, RestClient, WebClient bạn chọn gì và vì sao?',
  a: `**Tóm tắt:** {{HttpClient}} là HTTP client chuẩn của JDK từ Java 11: immutable, thread-safe, có connection pool bên trong nên **tạo một lần và dùng chung**; hỗ trợ HTTP/2 (tự fallback HTTP/1.1), {{send}} đồng bộ và {{sendAsync}} trả về {{CompletableFuture}}. Mặc định **không có timeout** nên phải đặt {{connectTimeout}} và {{timeout}} cho từng request. Trong ứng dụng Spring Boot 3.2+, tôi chọn {{RestClient}} (có thể chạy trên chính JDK HttpClient) để có message converter, xử lý lỗi và observability; dùng HttpClient trực tiếp cho thư viện hoặc tool không phụ thuộc Spring.

### Dùng HttpClient đúng cách
~~~java
private static final HttpClient CLIENT = HttpClient.newBuilder()
        .version(HttpClient.Version.HTTP_2)        // ưu tiên HTTP/2, server không hỗ trợ thì dùng 1.1
        .connectTimeout(Duration.ofSeconds(2))     // timeout mở kết nối TCP/TLS
        .build();                                  // immutable, thread-safe: dùng chung

HttpRequest req = HttpRequest.newBuilder(URI.create("https://core-bank.internal/api/accounts/123"))
        .timeout(Duration.ofSeconds(5))            // tối đa 5s chờ response, quá thì HttpTimeoutException
        .header("Accept", "application/json")
        .GET()
        .build();

// Sync: ném IOException, InterruptedException; rất hợp với virtual thread
HttpResponse<String> res = CLIENT.send(req, HttpResponse.BodyHandlers.ofString());
if (res.statusCode() >= 400) {                     // 4xx/5xx KHÔNG tự ném exception
    throw new UpstreamException(res.statusCode(), res.body());
}

// Async: không chặn thread gọi
CompletableFuture<String> body = CLIENT.sendAsync(req, HttpResponse.BodyHandlers.ofString())
        .thenApply(HttpResponse::body);
~~~

### Vì sao phải dùng chung một instance
Mỗi {{HttpClient}} có connection pool và thread quản lý selector riêng. Tạo mới cho mỗi request làm mất keep-alive (lại bắt tay TLS mỗi lần, tốn hàng chục ms) và có thể rò thread/kết nối. Từ Java 21, {{HttpClient}} implement {{AutoCloseable}} ({{close}}, {{shutdown}}) để giải phóng tài nguyên chủ động khi thật sự cần client ngắn hạn.

### So sánh lựa chọn
| | JDK HttpClient | RestTemplate | RestClient (Spring 6.1) | WebClient |
|---|---|---|---|---|
| Kiểu | Sync + async (CompletableFuture) | Sync | Sync, API fluent | Reactive |
| Phụ thuộc | Chỉ JDK | Spring | Spring | Spring WebFlux, Reactor |
| JSON mapping | Tự làm | Có | Có | Có |
| Lỗi 4xx/5xx | Tự kiểm tra status | Ném exception | {{retrieve()}} ném exception | Ném khi {{retrieve()}} |
| Observability | Tự làm | Có (Micrometer) | Có | Có |
| Tình trạng | Chuẩn JDK | Maintenance mode | Khuyến nghị cho code sync mới | Dùng khi đã reactive |

~~~java
RestClient client = RestClient.builder()
        .requestFactory(new JdkClientHttpRequestFactory(CLIENT)) // tái dùng JDK HttpClient
        .baseUrl("https://core-bank.internal")
        .build();

AccountDto dto = client.get().uri("/api/accounts/{id}", id)
        .retrieve()                                // 4xx/5xx -> RestClientResponseException
        .body(AccountDto.class);
~~~

### Tiêu chí chọn (góc nhìn Lead)
- Codebase Spring MVC, Java 21 + virtual thread: {{RestClient}} sync là đủ đơn giản và scale tốt; không cần kéo Reactor vào chỉ để gọi HTTP.
- Cần kiểm soát chi tiết connection pool (max per route, idle eviction): đặt Apache HttpClient 5 làm request factory, vì JDK HttpClient chỉ cấu hình pool qua system property như {{jdk.httpclient.keepalive.timeout}}.
- Thư viện SDK nội bộ dùng cho nhiều team: JDK HttpClient để không áp đặt phiên bản Spring.

### Câu trả lời sai phổ biến
- "HttpClient tự ném exception khi 500": sai, phải tự kiểm tra {{statusCode()}}.
- "connectTimeout là đủ": nó chỉ bao phần mở kết nối; server nhận kết nối rồi treo thì vẫn chờ mãi nếu không có request {{timeout}}.
- "Async thì nhanh hơn": async chỉ giải phóng thread gọi, không làm upstream trả lời nhanh hơn.

### Pitfall production
- Không có timeout: upstream treo làm cạn thread pool Tomcat và cả service chết theo (cascading failure).
- Retry mù quáng với lệnh chuyển tiền: phải có idempotency key và chỉ retry lỗi an toàn; bọc thêm circuit breaker (Resilience4j).
- Log nguyên body response chứa số tài khoản hoặc CCCD: phải mask.

> Senior tip: đặt timeout theo SLA của upstream (ví dụ p99 là 800 ms thì timeout khoảng 2 s) và tổng timeout của chuỗi gọi phải nhỏ hơn timeout mà client của bạn chờ bạn. Mọi client HTTP ra ngoài nên đi qua một bean dùng chung có sẵn timeout, tracing header và metric, thay vì để mỗi dev tự tạo client.`,
  follow: [
    'Bạn đặt connect timeout, read timeout và tổng deadline cho một chuỗi gọi 3 service thế nào?',
    'Retry một API chuyển tiền bị timeout: làm sao tránh trừ tiền hai lần?',
    'Khi chạy trên virtual thread, gọi HTTP đồng bộ có còn là vấn đề về scalability không?'
  ],
  tags: ['HttpClient', 'RestClient', 'WebClient', 'timeout', 'HTTP/2']
},
{
  id: 'modern-013',
  topic: 'modern',
  level: 'mid',
  q: 'Helpful NullPointerException và pattern matching cho {{instanceof}} giúp gì khi debug và viết code hằng ngày? Ngoài ra, những cải tiến nhỏ nào từ Java 9 đến 21 bạn thực sự dùng?',
  a: `**Tóm tắt:** Từ Java 14 (bật mặc định từ Java 15), NPE có thông báo chỉ rõ **biểu thức nào** bị null, ví dụ "because the return value of getAddress() is null", nên không còn phải đoán trong chuỗi gọi dài. Pattern matching cho {{instanceof}} (chính thức Java 16) vừa kiểm tra kiểu vừa khai báo biến đã ép kiểu, bỏ được bước cast thủ công. Cùng với đó là nhiều API nhỏ như {{List.of}}, {{String.isBlank}}, {{Files.readString}}, {{Stream.toList}} giúp code ngắn và ít lỗi hơn.

### Helpful NullPointerException
~~~java
String city = customer.getAddress().getCity().toUpperCase();
~~~
~~~text
// Java 8:
java.lang.NullPointerException
    at CustomerService.format(CustomerService.java:42)

// Java 17 (dạng thông báo):
java.lang.NullPointerException: Cannot invoke "Address.getCity()"
    because the return value of "Customer.getAddress()" is null
~~~
- JVM phân tích bytecode tại vị trí lỗi để biết giá trị null đến từ đâu (field, phần tử mảng, kết quả method, biến local).
- Tên biến local chỉ hiện nếu class được compile kèm thông tin debug ({{-g}}, Maven và Gradle mặc định có); nếu không sẽ thấy dạng {{<local4>}}.
- Thông báo chỉ được tính khi gọi {{getMessage()}}, nên không tốn chi phí cho NPE bị bắt và bỏ qua. Có thể tắt bằng {{-XX:-ShowCodeDetailsInExceptionMessages}} nếu lo lộ thông tin cấu trúc code.

### Pattern matching cho instanceof
~~~java
// Trước Java 16
if (event instanceof PaymentEvent) {
    PaymentEvent p = (PaymentEvent) event;      // cast lặp lại, dễ cast nhầm kiểu
    process(p.amount());
}

// Java 16+
if (event instanceof PaymentEvent p && p.amount().signum() > 0) {
    process(p.amount());                         // p chỉ tồn tại khi match
}

// Flow scoping: biến dùng được sau khi loại trường hợp không match
if (!(obj instanceof Account other)) return false;
return accountNo.equals(other.accountNo);        // hay dùng trong equals()
~~~
Biến pattern có phạm vi theo luồng điều khiển: dùng được ở nhánh mà compiler chắc chắn đã match. Dùng {{||}} thay vì {{&&}} thì không truy cập được {{p}} ở vế sau.

### Các cải tiến nhỏ đáng biết
| Phiên bản | Tính năng | Dùng khi nào |
|---|---|---|
| 9 | {{List.of}}, {{Set.of}}, {{Map.of}} | Hằng số, dữ liệu test |
| 9 | {{Optional.ifPresentOrElse}}, {{Optional.stream}}, {{Stream.takeWhile}} | Xử lý Optional, cắt stream theo điều kiện |
| 10 | {{var}}, {{List.copyOf}}, {{Optional.orElseThrow()}} | Biến local kiểu dài, defensive copy |
| 11 | {{String.isBlank}}, {{strip}}, {{lines}}, {{repeat}}; {{Files.readString}}; {{Predicate.not}} | Validate input, đọc file nhỏ |
| 12 | {{Collectors.teeing}} | Tính hai kết quả trong một lần duyệt |
| 14–16 | Switch expression, text block, record, {{Stream.toList}} | DTO, SQL/JSON nhiều dòng |
| 17 | Sealed class | Mô hình hoá trạng thái đóng |
| 21 | SequencedCollection, record pattern, virtual thread, {{Math.clamp}} | Lấy phần tử đầu/cuối, IO-bound |

### Câu trả lời sai phổ biến
- "Phải bật cờ mới có helpful NPE": từ Java 15 đã bật mặc định.
- "Pattern instanceof chỉ là cú pháp đẹp": nó còn loại bỏ lỗi cast nhầm kiểu, vì kiểm tra và ép kiểu là cùng một bước.
- Kể tính năng mà không nói đã dùng ở đâu: interviewer muốn nghe ví dụ thật.

### Pitfall
- Log chỉ ghi {{e.toString()}} hoặc custom message mà nuốt stack trace: thông báo hay đến đâu cũng thiếu dòng code; luôn log cả exception.
- Helpful NPE giúp tìm chỗ null, không thay được việc thiết kế để tránh null: validate ở biên (Bean Validation), dùng {{Optional}} cho giá trị trả về có thể vắng.

> Senior tip: khi kể "cải tiến hay dùng", hãy gắn với tác động: "sau khi lên 17, thời gian điều tra NPE từ log production giảm rõ vì thông báo chỉ thẳng getter nào trả null". Câu trả lời có kết quả đo được luôn ghi điểm hơn danh sách tính năng.`,
  follow: [
    'Vì sao helpful NPE ban đầu bị tắt mặc định ở Java 14?',
    'Pattern variable trong {{instanceof}} có thể là {{final}} không? Gán lại được không?',
    '{{Collectors.teeing}} giải quyết bài toán gì? Cho ví dụ tính min và max cùng lúc.'
  ],
  tags: ['helpful NPE', 'instanceof', 'pattern matching', 'Java 11', 'Java 17']
},
{
  id: 'modern-014',
  topic: 'modern',
  level: 'mid',
  q: '"Java 8 có gì mới và bạn dùng tính năng nào nhiều nhất?" Trả lời câu mở đầu kinh điển này thế nào cho ăn điểm, và interviewer thường vặn tiếp những gì?',
  a: `**Tóm tắt:** Java 8 đưa lập trình hàm vào Java: **lambda + functional interface + method reference**, **Stream API**, **Optional**, **default/static method trong interface**, **java.time** thay {{Date}}/{{Calendar}}, và **CompletableFuture**. Tôi dùng nhiều nhất là Stream để xử lý dữ liệu nghiệp vụ, java.time cho mọi logic ngày giờ (cut-off, kỳ hạn), và CompletableFuture để gọi song song nhiều service. Sau đó nêu luôn một ví dụ cụ thể và một điều bạn cẩn thận khi dùng.

### Cấu trúc câu trả lời ăn điểm
1. Liệt kê ngắn 5–6 nhóm tính năng (15 giây).
2. Chọn 2–3 cái bạn dùng thật, mỗi cái kèm một ví dụ nghiệp vụ.
3. Nói một trade-off hoặc pitfall, cho thấy bạn hiểu sâu chứ không chỉ biết dùng.
4. Nếu dự án đã lên 17/21, nhắc ngắn những gì bạn dùng thêm (record, switch expression, virtual thread).

### Ví dụ: Stream thay vòng lặp gom nhóm
~~~java
// Java 7: tổng tiền giao dịch thành công theo loại
Map<String, BigDecimal> totals = new HashMap<>();
for (Txn t : txns) {
    if (t.getStatus() == Status.SUCCESS) {
        BigDecimal cur = totals.get(t.getType());
        totals.put(t.getType(), cur == null ? t.getAmount() : cur.add(t.getAmount()));
    }
}

// Java 8: khai báo "muốn gì" thay vì "làm thế nào"
Map<String, BigDecimal> totals8 = txns.stream()
        .filter(t -> t.getStatus() == Status.SUCCESS)
        .collect(Collectors.groupingBy(Txn::getType,
                 Collectors.reducing(BigDecimal.ZERO, Txn::getAmount, BigDecimal::add)));
~~~

### Ví dụ: CompletableFuture gọi song song
~~~java
// Duyệt khoản vay cần hồ sơ khách hàng và điểm tín dụng từ 2 hệ thống
CompletableFuture<Profile> profile =
        CompletableFuture.supplyAsync(() -> profileApi.get(id), ioPool);
CompletableFuture<Score> score =
        CompletableFuture.supplyAsync(() -> creditApi.score(id), ioPool);
LoanOffer offer = profile.thenCombine(score, LoanOffer::of).join(); // ~max(t1, t2) thay vì t1 + t2
~~~
Truyền executor riêng ({{ioPool}}) vì mặc định {{supplyAsync}} dùng {{ForkJoinPool.commonPool()}}, vốn có số thread khoảng số core và dùng chung cả JVM; gọi IO chặn trên đó sẽ làm nghẽn các phần khác.

### Những câu interviewer hay vặn tiếp
| Câu hỏi | Ý chính cần nói |
|---|---|
| Vì sao cần default method? | Để thêm {{stream()}}, {{forEach}} vào {{Collection}}/{{Iterable}} mà không làm vỡ hàng triệu class đã implement interface đó |
| Lambda khác anonymous class? | Không tạo file .class riêng, dùng {{invokedynamic}}; {{this}} trỏ tới class bao ngoài; chỉ capture biến effectively final |
| Vì sao bỏ Date/SimpleDateFormat? | {{Date}} mutable, {{SimpleDateFormat}} không thread-safe; java.time bất biến và tách rõ {{Instant}}/{{LocalDate}}/{{ZonedDateTime}} |
| Optional dùng ở đâu? | Kiểu trả về có thể vắng; không dùng cho field, tham số, collection |
| Stream có nhanh hơn for? | Không mặc định nhanh hơn; lợi ích chính là dễ đọc và dễ compose |

Ngoài ra Java 8 còn có: {{HashMap}} treeify bucket khi nhiều collision, Metaspace thay PermGen, {{StringJoiner}}, {{Base64}}, {{Map.computeIfAbsent}}/{{merge}}.

### Câu trả lời sai phổ biến
- Kể nhầm tính năng của bản sau: {{var}} (Java 10), {{List.of}} (Java 9), record (Java 16), module (Java 9) đều **không** có ở Java 8.
- Chỉ liệt kê như đọc release note, không có ví dụ đã dùng.
- Nói "stream luôn nhanh hơn" hoặc "dùng parallel stream cho nhanh" mà không nói về chi phí.

### Pitfall khi dùng thực tế
- Stream lồng nhau dài 15 dòng, khó debug; tách thành method có tên rõ ràng.
- {{Optional.get()}} không kiểm tra, hoặc {{orElse(expensiveCall())}} luôn gọi hàm tốn kém ngay cả khi có giá trị (dùng {{orElseGet}}).
- {{CompletableFuture}} quên xử lý lỗi ({{exceptionally}}/{{handle}}) hoặc quên timeout ({{orTimeout}} có từ Java 9).

> Senior tip: chuẩn bị sẵn một câu chuyện "trước/sau": ví dụ "API tổng hợp thông tin khách hàng gọi tuần tự 3 service mất khoảng 900 ms, chuyển sang CompletableFuture song song còn khoảng 350 ms". Một con số thật từ dự án của bạn đáng giá hơn mọi định nghĩa.`,
  follow: [
    'Default method có gây diamond problem không? Java giải quyết thế nào?',
    'Vì sao {{SimpleDateFormat}} dùng làm biến static lại gây lỗi khi chạy đa luồng?',
    'CompletableFuture chạy trên thread nào nếu không truyền executor? Rủi ro gì?'
  ],
  tags: ['Java 8', 'lambda', 'Stream', 'Optional', 'CompletableFuture']
},
{
  id: 'modern-015',
  topic: 'modern',
  level: 'senior',
  q: 'Phân biệt {{map}} vs {{flatMap}}, {{reduce}} vs {{collect}}, và {{peek}} trong Stream. Cho ví dụ nghiệp vụ và những lỗi hay gặp, kể cả dự đoán output với {{peek}}.',
  a: `**Tóm tắt:** {{map}} biến mỗi phần tử thành **đúng một** phần tử; {{flatMap}} biến mỗi phần tử thành **một stream** rồi nối phẳng các stream đó lại (một thành nhiều hoặc không). {{reduce}} gộp các giá trị **bất biến** thành một (tổng, max), còn {{collect}} là mutable reduction, gom vào container như list, map. {{peek}} chỉ để debug: nó lazy và JVM được phép bỏ qua, nên không được dùng để thay đổi state.

### map vs flatMap
~~~java
// Stream<List<OrderItem>>: mỗi order thành một list, vẫn lồng nhau
List<List<OrderItem>> nested = orders.stream()
        .map(Order::getItems)
        .toList();

// Stream<OrderItem>: làm phẳng thành danh sách mọi item của mọi order
List<OrderItem> items = orders.stream()
        .flatMap(o -> o.getItems().stream())
        .toList();

// Optional: mapper đã trả về Optional thì dùng flatMap để tránh Optional<Optional<...>>
Optional<String> city = findCustomer(id)
        .flatMap(Customer::getAddress)       // getAddress() trả về Optional<Address>
        .map(Address::getCity);
~~~
Java 16 có thêm {{mapMulti}} để phát 0..n phần tử mà không phải tạo stream con, hữu ích khi mỗi phần tử chỉ sinh vài kết quả.

### reduce vs collect
~~~java
// reduce: đúng chỗ, gộp giá trị bất biến
BigDecimal total = txns.stream()
        .map(Txn::amount)
        .reduce(BigDecimal.ZERO, BigDecimal::add);   // ZERO là identity thật

// SAI: dùng reduce để gom vào container mutable
List<String> ids = txns.stream().reduce(new ArrayList<>(),
        (acc, t) -> { acc.add(t.id()); return acc; },
        (a, b) -> { a.addAll(b); return a; });       // parallel: nhiều thread cùng sửa một ArrayList

// ĐÚNG: collect tạo container riêng cho từng nhánh rồi mới gộp
List<String> ids2 = txns.stream().map(Txn::id).collect(Collectors.toList());
~~~
Vì sao: {{reduce}} giả định identity và các kết quả trung gian là giá trị bất biến; trong parallel stream, cùng một identity được dùng cho mọi nhánh. {{collect}} gọi supplier để tạo container **mới** cho mỗi nhánh, nên an toàn.

Thêm một bẫy: identity phải đúng là phần tử trung hoà. {{Stream.of(1, 2, 3).reduce(10, Integer::sum)}} trả về 16 khi chạy tuần tự, nhưng chạy {{parallel()}} có thể ra 36 vì 10 được cộng cho mỗi phần (tách 3 phần là cộng 3 lần).

### peek: dự đoán output
~~~java
long n = List.of("a", "b", "c").stream()
        .peek(s -> System.out.println("peek " + s))
        .count();
System.out.println(n);
// Java 9+: chỉ in "3", không có dòng "peek" nào
~~~
Từ Java 9, {{count()}} có thể tính thẳng từ kích thước của nguồn (SIZED) khi pipeline không có {{filter}}/{{flatMap}}, nên bỏ qua việc duyệt và {{peek}} không chạy. Ngoài ra không có terminal operation thì {{peek}} cũng không bao giờ chạy.

### Bảng tóm tắt
| Operation | Đầu vào → đầu ra | Dùng cho |
|---|---|---|
| map | 1 → 1 | Đổi kiểu, trích field |
| flatMap | 1 → 0..n (stream) | Làm phẳng quan hệ cha-con, Optional lồng nhau |
| reduce | n → 1 giá trị bất biến | Tổng, min/max, nối giá trị |
| collect | n → container | List, Map, groupingBy, joining |
| peek | Không đổi | Log debug, không side effect quan trọng |

### Câu trả lời sai phổ biến
- "flatMap dùng để làm phẳng Map": sai, nó làm phẳng stream lồng nhau.
- "reduce và collect như nhau": khác về mutability và tính an toàn khi parallel.
- "peek giống forEach nhưng không kết thúc stream": peek không đảm bảo chạy, còn forEach là terminal và luôn chạy.

### Pitfall production
- Dùng {{peek(o -> o.setStatus(PROCESSED))}} để cập nhật trạng thái đơn hàng: một ngày ai đó đổi terminal operation sang {{count()}} hoặc thêm {{limit}} và một phần đơn không được cập nhật.
- {{flatMap}} trên quan hệ lazy của JPA trong vòng lặp gây N+1 query; fetch join trước khi stream.

> Senior tip: quy ước team: lambda trong stream phải **không có side effect** (trừ {{forEach}} cuối cùng). Thấy {{peek}} chứa setter hoặc {{reduce}} với {{ArrayList}} trong code review là dấu hiệu cần viết lại ngay.`,
  follow: [
    '{{reduce}} có 3 tham số (identity, accumulator, combiner): combiner dùng khi nào?',
    'Khi nào nên dùng {{mapMulti}} thay vì {{flatMap}}?',
    'Vì sao lambda trong stream nên stateless? Cho ví dụ stateful lambda gây sai kết quả khi parallel.'
  ],
  tags: ['Stream', 'flatMap', 'reduce', 'collect', 'peek'],
  refs: [
    { type: 'doc', title: 'Java Language Specification', url: 'https://docs.oracle.com/javase/specs/' },
    { type: 'doc', title: 'JEP 444: Virtual Threads', url: 'https://openjdk.org/jeps/444' },
    { type: 'doc', title: 'Java Object Specification', url: 'https://docs.oracle.com/javase/8/docs/api/java/lang/Object.html' }
  ]
},
{
  id: 'modern-016',
  topic: 'modern',
  level: 'lead',
  q: 'Stream hay vòng for: so sánh hiệu năng, khả năng đọc và bảo trì. Khi nào bạn không dùng stream, và bạn đặt guideline gì cho team?',
  a: `**Tóm tắt:** Về hiệu năng, với phần lớn code nghiệp vụ (vài trăm đến vài nghìn phần tử, có gọi DB/network), khác biệt giữa stream và for là không đáng kể so với IO. Stream có chi phí cố định (tạo pipeline, lambda) và dễ dính boxing, nên trong vòng lặp nóng trên dữ liệu lớn thì for với primitive thường nhanh hơn hoặc ngang bằng; phải đo bằng JMH chứ không đoán. Lợi ích chính của stream là **dễ đọc** với các phép filter/map/group. Tôi dùng for khi cần break phức tạp, ném checked exception, cập nhật nhiều biến, hay làm việc theo index.

### Vì sao stream không "tự nhanh hơn"
- Mỗi pipeline tạo vài object (stage, spliterator, sink), và lambda có capture biến tạo object mỗi lần chạy. Với list 10 phần tử gọi hàng triệu lần/giây, chi phí cố định này chiếm phần lớn.
- {{Stream<Integer>}} phải box/unbox từng phần tử; {{IntStream}}/{{LongStream}} tránh được việc này.
- JIT tối ưu vòng for đơn giản rất tốt (loop unrolling, vector hoá). Pipeline stream nhiều tầng khó inline hết hơn; nhưng khi JIT inline được thì chênh lệch nhỏ.
- {{parallel()}} không miễn phí: chia việc, gộp kết quả, và chạy trên {{ForkJoinPool.commonPool()}} dùng chung cả JVM.

~~~java
// Ba cách tính tổng: khác biệt nằm ở boxing, không phải ở "stream hay for"
long s1 = 0;
for (long v : amounts) s1 += v;                       // primitive, nhanh nhất ổn định
long s2 = Arrays.stream(amounts).sum();               // LongStream: gần tương đương
long s3 = list.stream().reduce(0L, Long::sum);        // Stream<Long>: box từng phần tử
~~~

### Khi for rõ ràng hơn stream
~~~java
// Checked exception trong lambda: phải bọc, mất tính gọn
List<String> contents = paths.stream().map(p -> {
    try { return Files.readString(p); }
    catch (IOException e) { throw new UncheckedIOException(e); }
}).toList();

// Nhiều biến kết quả + dừng sớm theo điều kiện: for tự nhiên hơn
BigDecimal total = BigDecimal.ZERO;
int failed = 0;
for (Txn t : txns) {
    if (t.isCutOffMarker()) break;              // dừng sớm theo logic nghiệp vụ
    if (t.isFailed()) { failed++; continue; }
    total = total.add(t.amount());              // lambda không gán lại được biến local
}
~~~

### Bảng quyết định
| Tình huống | Chọn | Lý do |
|---|---|---|
| Lọc, biến đổi, gom nhóm dữ liệu nghiệp vụ | Stream | Ngắn, khai báo rõ ý định |
| Tìm phần tử đầu tiên / kiểm tra tồn tại | Stream ({{anyMatch}}, {{findFirst}}) | Có short-circuit |
| Vòng lặp nóng trên mảng primitive lớn | For (hoặc {{IntStream}}) | Tránh boxing và chi phí pipeline |
| Cần index, duyệt hai list song song | For | Stream không có index tự nhiên |
| Ném checked exception, break nhiều điều kiện | For | Lambda không hợp |
| Nhiều accumulator cùng lúc | For (hoặc collector riêng) | Lambda chỉ capture biến effectively final |
| Xử lý CPU-heavy, dữ liệu rất lớn, tách được | Cân nhắc parallel, có đo | Đừng dùng trong request handler |

### Câu trả lời sai phổ biến
- "Stream nhanh hơn vì chạy song song": stream mặc định là tuần tự.
- "Stream chậm, nên cấm dùng": với code có IO, khác biệt là nhiễu; cấm stream chỉ làm code dài và dễ lỗi hơn.
- "Dùng {{parallelStream}} cho API chậm": nếu chậm do gọi DB/HTTP thì parallel stream chỉ chiếm commonPool và làm nghẽn phần khác.

### Pitfall production
- {{parallelStream()}} gọi repository bên trong request handler: dưới tải cao commonPool bị chặn bởi IO, cả {{CompletableFuture}} mặc định cũng chậm theo.
- Pipeline dài 20 dòng với lambda nhiều tầng: stack trace khó đọc, debug khó; tách thành method có tên.
- Tái sử dụng một {{Stream}} đã được tiêu thụ sẽ ném {{IllegalStateException}}; stream không phải collection.

> Senior tip: guideline tôi hay đặt cho team: (1) stream là mặc định cho biến đổi dữ liệu, mỗi lambda ngắn, không side effect; (2) for cho logic điều khiển phức tạp và hot path đã được profiler chỉ ra; (3) cấm {{parallelStream}} trong code xử lý request nếu không có benchmark JMH và review riêng. Quy tắc "đo trước khi tối ưu" quan trọng hơn mọi tranh luận stream hay for.`,
  follow: [
    'Bạn sẽ viết benchmark JMH thế nào để so sánh stream và for cho đúng (warmup, dead-code elimination)?',
    'Parallel stream chia việc dựa trên gì? Vì sao {{LinkedList}} hay {{Stream.iterate}} chia việc kém?',
    'Lambda không capture biến thì có tạo object mới mỗi lần không?'
  ],
  tags: ['Stream', 'performance', 'for loop', 'parallel stream', 'JMH']
}
);
