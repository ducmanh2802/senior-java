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
  tags: ['exception', 'checked', 'RuntimeException', 'error handling']
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
  tags: ['final', 'finally', 'finalize', 'Cleaner', 'try-with-resources']
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
  tags: ['generics', 'type erasure', 'wildcard', 'PECS']
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
  tags: ['nested class', 'inner class', 'memory leak', 'this$0']
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
  tags: ['serialization', 'serialVersionUID', 'deserialization', 'security']
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
  tags: ['reflection', 'annotation processing', 'Lombok', 'MethodHandle']
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
  tags: ['HashMap', 'resize', 'treeify', 'hash flooding']
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
  tags: ['iterator', 'fail-fast', 'ConcurrentModificationException', 'fail-safe']
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
  tags: ['LinkedHashMap', 'LRU', 'removeEldestEntry', 'Caffeine']
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
  tags: ['TreeMap', 'NavigableMap', 'Comparator', 'BigDecimal']
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
  tags: ['CopyOnWriteArrayList', 'BlockingQueue', 'backpressure', 'thread pool']
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
  tags: ['Stream', 'lazy', 'parallel', 'ForkJoinPool']
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
  tags: ['record', 'compact constructor', 'DTO', 'JPA']
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
  tags: ['sealed', 'pattern matching', 'switch', 'Java 21']
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
  tags: ['Collectors', 'groupingBy', 'toMap', 'Stream']
}
);
