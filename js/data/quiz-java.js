/* Multiple-choice bank (exam pool java) - owner: Claude quiz task. Format: see AGENTS.md section 4 */
(window.QUIZ = window.QUIZ || []).push(

// ===================== core =====================
{
  id: 'qz-core-007', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
static int f() {
    int x = 1;
    try { return x; }
    finally { x = 2; }
}
static int g() {
    try { throw new RuntimeException("boom"); }
    finally { return 3; }
}
// main:
System.out.println(f() + " " + g());
~~~`,
  options: [
    `1 3, và RuntimeException "boom" bị nuốt mất không ai thấy`,
    `2 3, vì finally chạy sau cùng nên x = 2 được trả về`,
    `1, sau đó chương trình ném RuntimeException "boom"`,
    `Không biên dịch được vì không được viết return trong finally`
  ],
  answer: 0,
  explain: `**Đáp án đúng: 1 3, exception "boom" bị nuốt mất.**

### Vì sao đúng
- Trong {{f()}}: lệnh {{return x}} **tính giá trị trả về (1) và cất vào một slot tạm** trước khi nhảy vào {{finally}}. {{finally}} gán {{x = 2}} chỉ sửa biến local, không sửa giá trị đã cất, nên {{f()}} trả về 1. (Nếu {{x}} là một object mutable như {{StringBuilder}} và finally gọi {{append}}, caller sẽ thấy thay đổi vì giá trị cất là tham chiếu.)
- Trong {{g()}}: {{return}} trong {{finally}} là "abrupt completion" nên **thay thế** mọi kết quả trước đó, kể cả exception đang bay. RuntimeException biến mất hoàn toàn, {{g()}} trả về 3.

### Vì sao các phương án còn lại sai
- **2 3**: hiểu sai rằng finally sửa được giá trị trả về kiểu primitive đã được tính.
- **1 rồi ném exception**: exception bị return trong finally nuốt, không lan ra ngoài.
- **Không biên dịch được**: return trong finally hợp lệ; javac chỉ cảnh báo khi bật {{-Xlint:finally}}.

> Senior tip: return/throw trong {{finally}} là anti-pattern kinh điển làm mất exception gốc trên production (log không có stack trace, giao dịch "thành công" giả). Bật {{-Xlint:all -Werror}} hoặc rule Sonar/ErrorProne ({{FinallyThrows}}, {{ReturnFromFinallyBlock}}) để chặn từ CI.`
},
{
  id: 'qz-core-008', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
String a = "hello";
String b = "hel" + "lo";
String c = new String("hello");
final String p = "hel";
String d = p + "lo";
String q = "hel";
String e = q + "lo";
System.out.println((a == b) + " " + (a == c) + " " + (a == d)
    + " " + (a == e) + " " + (a == e.intern()));
~~~`,
  options: [
    `true false false false true`,
    `true false true false true`,
    `true false true true true`,
    `false false false false true`
  ],
  answer: 1,
  explain: `**Đáp án đúng: true false true false true.**

### Vì sao đúng
- {{a == b}}: {{"hel" + "lo"}} là **compile-time constant expression**, javac gộp thành literal {{"hello"}} lúc biên dịch, nên cùng trỏ vào một object trong String pool → {{true}}.
- {{a == c}}: {{new String(...)}} luôn tạo object mới trên heap → {{false}}.
- {{a == d}}: {{p}} là biến {{final}} khởi tạo bằng hằng số, tức là **constant variable**, nên {{p + "lo"}} vẫn là hằng số biên dịch → gộp thành literal → {{true}}.
- {{a == e}}: {{q}} không final, phép nối chạy lúc runtime (từ Java 9 qua {{invokedynamic}}/{{StringConcatFactory}}) và tạo String mới → {{false}}.
- {{e.intern()}} trả về bản trong pool, chính là object của {{a}} → {{true}}.

### Vì sao các phương án còn lại sai
- **true false false false true**: bỏ qua quy tắc constant variable của {{final String p}}.
- **true false true true true**: tưởng nối chuỗi lúc runtime cũng tự intern; thực tế không.
- **false false false false true**: tưởng mọi phép nối đều chạy lúc runtime; javac gộp hằng số từ rất sớm.

> Senior tip: kết quả {{==}} trên String phụ thuộc vào chi tiết biên dịch (thêm/bỏ {{final}} là đổi kết quả), nên trong code thật luôn dùng {{equals}}. Câu này hay dùng để xem ứng viên có hiểu constant folding và String pool chứ không phải để khuyến khích dùng {{==}}.`
},
{
  id: 'qz-core-009', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
static void change(StringBuilder sb, int n, String s) {
    sb.append("!");
    sb = new StringBuilder("new");
    n++;
    s = s + "?";
}
// main:
StringBuilder sb = new StringBuilder("hi");
int n = 1;
String s = "a";
change(sb, n, s);
System.out.println(sb + " " + n + " " + s);
~~~`,
  options: [
    `new 2 a?`,
    `hi! 2 a`,
    `hi! 1 a`,
    `hi 1 a`
  ],
  answer: 2,
  explain: `**Đáp án đúng: hi! 1 a.**

### Vì sao đúng
Java **luôn pass-by-value**. Với object, giá trị được copy là **tham chiếu**:
- {{sb.append("!")}}: tham số {{sb}} và biến ở main cùng trỏ vào một object, nên thay đổi nội dung object được caller nhìn thấy → "hi!".
- {{sb = new StringBuilder("new")}}: chỉ gán lại **bản copy** của tham chiếu trong method; biến ở main vẫn trỏ object cũ.
- {{n++}}: tăng bản copy của primitive, {{n}} ở main vẫn là 1.
- {{s = s + "?"}}: String immutable, phép nối tạo object mới và chỉ gán vào biến local → {{s}} ở main vẫn là "a".

~~~text
main.sb ──┐
          ├──> [StringBuilder "hi!"]
param.sb ─┘   (sau đó param.sb trỏ sang [StringBuilder "new"], main không biết)
~~~

### Vì sao các phương án còn lại sai
- **new 2 a?**: giả định pass-by-reference như C++ {{&}}, Java không có.
- **hi! 2 a**: primitive được copy, tăng trong method không ảnh hưởng caller.
- **hi 1 a**: bỏ qua việc {{append}} sửa trực tiếp object dùng chung.

> Senior tip: bug thật hay gặp là method "trả kết quả" bằng cách gán lại tham số (ví dụ {{list = new ArrayList<>()}}) rồi caller không thấy gì. Quy ước tốt: coi tham số như {{final}} (nhiều team bật checkstyle {{FinalParameters}} hoặc ParameterAssignment) và trả kết quả qua return value.`
},
{
  id: 'qz-core-010', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
class Parent {
    static { System.out.print("A"); }
    { System.out.print("B"); }
    Parent() { System.out.print("C"); }
}
class Child extends Parent {
    static { System.out.print("D"); }
    { System.out.print("E"); }
    Child() { System.out.print("F"); }
}
// main:
new Child();
new Child();
~~~`,
  options: [
    `ABCDEFABCDEF`,
    `ADBECFBECF`,
    `DABCEFBCEF`,
    `ADBCEFBCEF`
  ],
  answer: 3,
  explain: `**Đáp án đúng: ADBCEFBCEF.**

### Vì sao đúng
1. Lần đầu dùng {{Child}}, JVM phải **khởi tạo class**. Khởi tạo subclass yêu cầu superclass được khởi tạo trước → static block của Parent ({{A}}) rồi của Child ({{D}}). Static block chỉ chạy **một lần** cho mỗi class (mỗi ClassLoader).
2. Tạo object: constructor {{Child()}} ngầm gọi {{super()}} đầu tiên. Trong Parent, instance initializer và field initializer chạy **sau super() và trước thân constructor** → {{B}} rồi {{C}}.
3. Quay lại Child: instance initializer {{E}} rồi thân constructor {{F}}.
4. Lần {{new Child()}} thứ hai: class đã khởi tạo, chỉ còn phần instance → {{BCEF}}.

### Vì sao các phương án còn lại sai
- **ABCDEFABCDEF**: tưởng static block chạy mỗi lần new và chạy xen với instance block.
- **ADBECFBECF**: tưởng toàn bộ instance block (cả cha lẫn con) chạy trước mọi constructor; thực tế cha hoàn tất (B, C) rồi mới tới con.
- **DABCEFBCEF**: superclass luôn được khởi tạo trước subclass.

> Senior tip: hệ quả nguy hiểm của thứ tự này: nếu constructor Parent gọi một method bị Child override, method đó chạy khi field của Child **chưa được khởi tạo** (null/0). Đây là lý do Effective Java khuyên không gọi overridable method trong constructor.`
},
{
  id: 'qz-core-011', topic: 'core',
  q: `Bạn lưu số tiền vào {{HashSet}} và {{TreeSet}}. Đoạn code sau in ra gì?
~~~java
BigDecimal a = new BigDecimal("1.0");
BigDecimal b = new BigDecimal("1.00");
Set<BigDecimal> hs = new HashSet<>(List.of(a, b));
Set<BigDecimal> ts = new TreeSet<>(List.of(a, b));
System.out.println(a.equals(b) + " " + a.compareTo(b)
    + " " + hs.size() + " " + ts.size());
~~~`,
  options: [
    `false 0 2 1`,
    `true 0 1 1`,
    `false 0 1 1`,
    `false 0 2 2`
  ],
  answer: 0,
  explain: `**Đáp án đúng: false 0 2 1.**

### Vì sao đúng
- {{BigDecimal.equals}} so sánh **cả value lẫn scale**: 1.0 (scale 1) khác 1.00 (scale 2) → {{false}}. {{hashCode}} cũng khác theo scale.
- {{compareTo}} chỉ so sánh **giá trị số** → 0.
- {{HashSet}} dùng {{hashCode/equals}} → coi là hai phần tử → size 2.
- {{TreeSet}} dùng {{compareTo}} → coi là trùng → size 1.

Đây là ví dụ kinh điển của việc {{compareTo}} **không nhất quán với equals** (Javadoc của BigDecimal ghi rõ điều này).

### Vì sao các phương án còn lại sai
- **true 0 1 1**: {{equals}} của BigDecimal có xét scale.
- **false 0 1 1**: HashSet không dùng compareTo, nên vẫn giữ cả hai.
- **false 0 2 2**: TreeSet dựa hoàn toàn vào compareTo để xác định trùng.

> Senior tip: trong hệ thống tiền tệ, chuẩn hoá scale ngay khi vào domain ({{setScale(2, RoundingMode.HALF_UP)}}) và so sánh bằng {{compareTo}}. Cẩn thận {{stripTrailingZeros()}}: "100" thành 1E+2 khi in, gây lỗi hiển thị/serialize. Một bug thật: map {{HashMap<BigDecimal, Rate>}} tra cứu theo số tiền đọc từ DB (scale 4) không khớp key nạp từ config (scale 2).`
},
{
  id: 'qz-core-012', topic: 'core',
  q: `Với các overload sau, đoạn code in ra gì?
~~~java
static void m(long x)    { System.out.print("long "); }
static void m(Integer x) { System.out.print("Integer "); }
static void m(int... x)  { System.out.print("varargs "); }
// main:
int i = 5;
m(i);
Integer boxed = 5;
m(boxed);
~~~`,
  options: [
    `Integer Integer`,
    `long Integer`,
    `varargs Integer`,
    `Lỗi biên dịch vì lời gọi m(i) mơ hồ (ambiguous)`
  ],
  answer: 1,
  explain: `**Đáp án đúng: long Integer.**

### Vì sao đúng
Compiler chọn overload theo **3 pha** (JLS 15.12.2), dừng ở pha đầu tiên tìm được ứng viên:
1. **Pha 1**: chỉ cho phép widening primitive/reference, **không boxing/unboxing, không varargs**.
2. **Pha 2**: cho phép boxing/unboxing.
3. **Pha 3**: cho phép varargs.

- {{m(i)}} với {{int}}: pha 1 thấy {{m(long)}} (widening int → long) hợp lệ → chọn ngay, không xét tới boxing sang {{Integer}}.
- {{m(boxed)}} với {{Integer}}: pha 1 thấy {{m(Integer)}} khớp đúng kiểu → chọn. {{m(long)}} cần unboxing nên thuộc pha 2, bị loại.

### Vì sao các phương án còn lại sai
- **Integer Integer**: boxing chỉ được xét ở pha 2, sau widening.
- **varargs Integer**: varargs có độ ưu tiên thấp nhất (pha 3), chỉ dùng khi hai pha trước không có ứng viên.
- **Ambiguous**: không mơ hồ vì pha 1 chỉ có đúng một ứng viên.

> Senior tip: quy tắc này được giữ để code cũ (trước Java 5) không đổi hành vi khi thêm autoboxing. Bug thật: {{list.remove(i)}} với {{List<Integer>}} và {{int i}} gọi {{remove(int index)}} (pha 1) chứ không phải {{remove(Object)}}, xoá nhầm phần tử theo vị trí.`
},
{
  id: 'qz-core-013', topic: 'core', multi: true,
  q: `Class cha khai báo {{public void load() throws IOException}}. Ở subclass, những khai báo override nào **biên dịch được**? (Chọn 2)`,
  options: [
    `public void load() throws Exception`,
    `public void load()`,
    `protected void load() throws IOException`,
    `public void load() throws FileNotFoundException`,
    `public void load() throws IOException, SQLException`
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: {{public void load()}} và {{public void load() throws FileNotFoundException}}.**

### Vì sao đúng
Quy tắc override xuất phát từ **Liskov substitution**: code đang gọi qua kiểu cha ({{Base b = new Sub(); b.load();}}) chỉ chuẩn bị {{catch (IOException)}}, nên subclass:
- **Không được ném checked exception rộng hơn hoặc mới**, chỉ được ném ít hơn, hẹp hơn (subclass của IOException), hoặc không ném gì.
- **Không được thu hẹp access modifier** (public → protected sẽ làm hỏng code gọi từ package khác).
- Unchecked exception (RuntimeException) thì thoải mái.

Vì vậy bỏ throws hoàn toàn hợp lệ, và {{FileNotFoundException}} là subclass của {{IOException}} nên cũng hợp lệ.

### Vì sao các phương án còn lại sai
- **throws Exception**: rộng hơn IOException, caller không bắt được → lỗi biên dịch.
- **protected ...**: giảm quyền truy cập từ public xuống protected → lỗi "attempting to assign weaker access privileges".
- **throws IOException, SQLException**: SQLException là checked exception mới, không thuộc IOException.

> Senior tip: đây là lý do nhiều framework hiện đại (Spring, JPA) chuộng unchecked exception: interface có thể tiến hoá mà không phá vỡ toàn bộ implementation. Khi thiết kế interface public, cân nhắc kỹ checked exception vì sau này không thể thêm mà không breaking change.`
},
{
  id: 'qz-core-014', topic: 'core',
  q: `Bạn cần một method generic sao cho cả hai lời gọi {{copy(List<Integer> src, List<Number> dst)}} và {{copy(List<Double> src, List<Object> dst)}} đều biên dịch, và trong thân method đọc được phần tử từ {{src}} rồi {{add}} vào {{dst}}. Chữ ký nào đúng?`,
  options: [
    `static <T> void copy(List<T> src, List<T> dst)`,
    `static void copy(List<? super Number> src, List<? extends Number> dst)`,
    `static <T> void copy(List<? extends T> src, List<? super T> dst)`,
    `static void copy(List<Object> src, List<Object> dst)`
  ],
  answer: 2,
  explain: `**Đáp án đúng: {{static <T> void copy(List<? extends T> src, List<? super T> dst)}}.**

### Vì sao đúng
Quy tắc **PECS** (Producer Extends, Consumer Super):
- {{src}} **sản xuất** phần tử để mình đọc → {{? extends T}}: đọc ra chắc chắn là {{T}}.
- {{dst}} **tiêu thụ** phần tử mình ghi vào → {{? super T}}: chắc chắn nhận được {{T}}.
Với lời gọi thứ nhất, compiler suy ra {{T = Integer}} (hoặc Number): {{List<Integer>}} khớp {{? extends Integer}}, {{List<Number>}} khớp {{? super Integer}}. Lời gọi thứ hai tương tự với {{T = Double}}. Đây chính là chữ ký của {{Collections.copy}}.

### Vì sao các phương án còn lại sai
- **List<T> src, List<T> dst**: generics là **invariant**, {{T}} phải vừa là Integer vừa là Number → không suy luận được, lỗi biên dịch.
- **? super Number src, ? extends Number dst**: đảo ngược PECS; đọc từ {{? super}} chỉ được {{Object}}, và không thể {{add}} vào {{List<? extends Number>}} (trừ null). Ngoài ra {{List<Integer>}} không khớp {{? super Number}}.
- **List<Object>**: {{List<Integer>}} **không phải** subtype của {{List<Object>}} (invariance), nên cả hai lời gọi đều lỗi.

> Senior tip: wildcard nên đặt ở **tham số** của API public để caller linh hoạt, nhưng **không** đặt ở kiểu trả về (bắt caller phải xử lý wildcard). Đọc chữ ký {{Stream.flatMap}}, {{Comparator.comparing}} trong JDK là cách học PECS nhanh nhất.`
},
{
  id: 'qz-core-015', topic: 'core',
  q: `Class {{Point}} override {{equals}} nhưng **quên override {{hashCode}}**. Đoạn code sau thường in ra gì?
~~~java
class Point {
    final int x, y;
    Point(int x, int y) { this.x = x; this.y = y; }
    @Override public boolean equals(Object o) {
        return o instanceof Point p && p.x == x && p.y == y;
    }
}
Set<Point> s = new HashSet<>();
s.add(new Point(1, 2));
System.out.println(s.contains(new Point(1, 2)) + " "
    + List.of(new Point(1, 2)).contains(new Point(1, 2)));
~~~`,
  options: [
    `true true`,
    `false false`,
    `Lỗi biên dịch vì override equals bắt buộc phải override hashCode`,
    `Gần như luôn là false true`
  ],
  answer: 3,
  explain: `**Đáp án đúng: gần như luôn là false true.**

### Vì sao đúng
- {{HashSet.contains}} tính {{hashCode()}} để tìm bucket **trước**, sau đó mới so {{equals}} trong bucket đó. Không override thì {{hashCode}} là identity hash (thường khác nhau giữa hai object), nên tìm sai bucket và trả về {{false}} (trừ khi trùng hash ngẫu nhiên, xác suất rất nhỏ).
- {{List.contains}} chỉ duyệt tuần tự và gọi {{equals}} → {{true}}.

Contract: {{a.equals(b)}} ⇒ {{a.hashCode() == b.hashCode()}}. Vi phạm làm mọi cấu trúc dựa trên hash (HashMap, HashSet, cache key, {{distinct()}} của Stream) hoạt động sai một cách âm thầm.

### Vì sao các phương án còn lại sai
- **true true**: chỉ đúng khi có hashCode nhất quán với equals.
- **false false**: List không dùng hashCode nên vẫn tìm thấy.
- **Lỗi biên dịch**: compiler không kiểm tra contract này; chỉ IDE/static analysis cảnh báo.

> Senior tip: dùng {{record}} cho value object để equals/hashCode được sinh tự động và luôn khớp nhau. Với class thường, sinh bằng IDE/Lombok và thêm test bằng EqualsVerifier. Bug này hay lộ ra trên production dưới dạng "cache hit rate 0%" hoặc "dedupe không chạy".`
},
{
  id: 'qz-core-016', topic: 'core',
  q: `Class {{Cache}} (giữ vài trăm MB dữ liệu) tạo các object {{Entry}} là **non-static inner class**, rồi đẩy Entry vào một registry {{static}} sống suốt đời ứng dụng. Heap dump cho thấy hàng trăm instance {{Cache}} không được thu hồi dù code đã bỏ mọi tham chiếu tới chúng. Nguyên nhân khả dĩ nhất?`,
  options: [
    `Mỗi Entry giữ tham chiếu ngầm tới instance Cache bao ngoài (field this$0), registry static giữ Entry nên kéo theo cả Cache`,
    `Registry dùng HashMap không thread-safe nên GC không quét được`,
    `Inner class được lưu trong Metaspace nên object của nó không bao giờ bị GC`,
    `GC không thu hồi object có kích thước lớn hơn region của G1`
  ],
  answer: 0,
  explain: `**Đáp án đúng: inner class giữ tham chiếu ngầm tới outer instance.**

### Vì sao đúng
Non-static inner class luôn được compiler thêm một field ẩn (thường tên {{this$0}}) trỏ tới instance bao ngoài, để code bên trong truy cập field của outer. Chuỗi tham chiếu:
~~~text
GC root (static registry) -> Entry -> this$0 -> Cache (vài trăm MB)
~~~
Chỉ cần một Entry còn sống là cả Cache không được GC. Sửa: khai báo {{static class Entry}} (static nested class không có tham chiếu ngầm), chỉ truyền dữ liệu cần thiết vào.

### Vì sao các phương án còn lại sai
- **HashMap không thread-safe**: thread-safety không liên quan đến khả năng GC; GC chỉ xét reachability.
- **Metaspace**: Metaspace chứa **metadata của class**, còn instance vẫn nằm trên heap và bị GC bình thường khi không reachable.
- **Region của G1**: object lớn là humongous object, vẫn được thu hồi khi không reachable.

> Senior tip: anonymous class và lambda trong method instance có dùng {{this}} (hoặc field) cũng capture outer instance. Trong heap dump (Eclipse MAT), chạy "Path to GC Roots" trên object Cache sẽ thấy ngay {{this$0}}. Quy tắc Effective Java: nested class mặc định nên là {{static}} trừ khi thực sự cần outer instance.`
},
{
  id: 'qz-core-017', topic: 'core', multi: true,
  q: `Code review class sau, được tuyên bố là immutable. Những điểm nào khiến nó **không thực sự bất biến**? (Chọn 3)
~~~java
public final class Order {
    private final String id;
    private final List<String> items;
    private final Date createdAt;
    public Order(String id, List<String> items, Date createdAt) {
        this.id = id;
        this.items = items;
        this.createdAt = createdAt;
    }
    public String id() { return id; }
    public List<String> items() { return Collections.unmodifiableList(items); }
    public Date createdAt() { return createdAt; }
}
~~~`,
  options: [
    `Constructor gán thẳng list của caller; caller sửa list gốc thì items() cũng thay đổi`,
    `Field id kiểu String có thể bị đổi, phải defensive copy bằng new String(id)`,
    `Constructor lưu thẳng tham chiếu Date của caller`,
    `Class khai báo final nên không thể là immutable đúng nghĩa`,
    `Getter createdAt() trả về chính object Date bên trong, caller gọi setTime() được`
  ],
  answer: [0, 2, 4],
  explain: `**Đáp án đúng: list gán thẳng, Date lưu thẳng, và getter trả về Date mutable.**

### Vì sao đúng
Immutable thật cần: class {{final}}, field {{private final}}, **defensive copy ở đầu vào và đầu ra** với mọi thành phần mutable.
- {{this.items = items}}: {{unmodifiableList}} chỉ là **view** chặn ghi qua getter, nhưng caller vẫn giữ list gốc và sửa được → nội dung Order đổi. Sửa: {{this.items = List.copyOf(items)}} (copy và đồng thời chặn null).
- {{this.createdAt = createdAt}}: {{Date}} mutable, caller gọi {{setTime}} trên object gốc là đổi Order. Sửa: {{new Date(createdAt.getTime())}}, tốt hơn là dùng {{Instant}} (immutable).
- Getter trả về {{createdAt}} trực tiếp cũng để lộ object mutable.

### Vì sao các phương án còn lại sai
- **String id**: String immutable, không cần copy (reflection phá được mọi thứ, không phải tiêu chí thiết kế).
- **final class**: ngược lại, {{final}} là một **yêu cầu** để subclass không thêm trạng thái mutable hoặc override getter.

> Senior tip: dùng {{record}} + {{List.copyOf}} trong compact constructor + kiểu thời gian {{java.time}} là cách nhanh nhất để có immutable thật. Nhớ rằng record chỉ bất biến **nông** (shallow): record chứa {{ArrayList}} vẫn bị sửa từ bên ngoài nếu không copy.`
},
{
  id: 'qz-core-018', topic: 'core',
  q: `Job chạy lúc 02:30 hằng ngày theo {{ZoneId.of("America/New_York")}}. Ngày 2025-03-09 là ngày chuyển sang giờ mùa hè (đồng hồ nhảy từ 02:00 lên 03:00). Lời gọi sau trả về gì?
~~~java
ZonedDateTime t = ZonedDateTime.of(
    LocalDate.of(2025, 3, 9), LocalTime.of(2, 30), ZoneId.of("America/New_York"));
~~~`,
  options: [
    `Ném DateTimeException vì 02:30 ngày đó không tồn tại`,
    `2025-03-09T03:30-04:00, giờ được dời tiến thêm đúng độ dài khoảng trống`,
    `2025-03-09T02:30-05:00, giữ nguyên offset mùa đông`,
    `2025-03-09T03:00-04:00, làm tròn tới thời điểm hợp lệ đầu tiên`
  ],
  answer: 1,
  explain: `**Đáp án đúng: 2025-03-09T03:30-04:00.**

### Vì sao đúng
Theo Javadoc của {{ZonedDateTime.of}}/{{ofLocal}}: khi local date-time rơi vào **gap** (khoảng thời gian không tồn tại do đồng hồ nhảy tiến), local time được **dời muộn hơn đúng bằng độ dài gap** (1 giờ) và dùng offset mùa hè. Vì vậy 02:30 trở thành 03:30 EDT (-04:00).
Với **overlap** (mùa thu, 01:30 xuất hiện hai lần), mặc định chọn offset **trước** chuyển đổi; có thể đổi bằng {{withLaterOffsetAtOverlap()}}.

### Vì sao các phương án còn lại sai
- **DateTimeException**: {{ZonedDateTime.of}} không ném lỗi với gap; chỉ {{ZonedDateTime.ofStrict}} mới ném.
- **02:30-05:00**: offset -05:00 không hợp lệ cho thời điểm đó tại New York; java.time luôn trả về tổ hợp hợp lệ.
- **03:00**: không làm tròn mà dời theo độ dài gap.

> Senior tip: scheduler dùng giờ địa phương sẽ **chạy hai lần** hoặc **bỏ lỡ** job ở ngày đổi giờ (Spring {{@Scheduled(cron, zone)}} cũng phải xử lý chuyện này). Với job quan trọng (đối soát, tính lãi), lên lịch theo UTC hoặc chọn giờ ngoài khoảng 01:00–03:00. Lưu thời điểm trong DB dưới dạng {{Instant}}/{{timestamptz}}, chỉ quy đổi sang zone khi hiển thị.`
},
{
  id: 'qz-core-019', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
enum Status { NEW, PAID, SHIPPED }
Map<Status, Integer> m = new EnumMap<>(Status.class);
m.put(Status.SHIPPED, 3);
m.put(Status.NEW, 1);
m.put(Status.PAID, 2);
System.out.println(m.keySet() + " " + Status.valueOf("PAID").ordinal());
~~~`,
  options: [
    `[SHIPPED, NEW, PAID] 1`,
    `[NEW, PAID, SHIPPED] 2`,
    `[NEW, PAID, SHIPPED] 1`,
    `Thứ tự không xác định vì EnumMap dựa trên hash; 1`
  ],
  answer: 2,
  explain: `**Đáp án đúng: [NEW, PAID, SHIPPED] 1.**

### Vì sao đúng
- {{EnumMap}} bên trong là **một mảng** đánh chỉ số theo {{ordinal()}} của enum, nên luôn duyệt theo **thứ tự khai báo** của enum, không phụ thuộc thứ tự put. Nhờ vậy nó rất nhanh và gọn (không có Node, không hash).
- {{ordinal()}} bắt đầu từ 0: NEW = 0, PAID = 1, SHIPPED = 2.

### Vì sao các phương án còn lại sai
- **[SHIPPED, NEW, PAID]**: đó là thứ tự chèn (như LinkedHashMap), EnumMap không giữ thứ tự chèn.
- **ordinal 2**: ordinal tính từ 0.
- **Dựa trên hash**: EnumMap không dùng hash, thứ tự là xác định.

> Senior tip: **không bao giờ lưu {{ordinal()}} xuống DB** (JPA {{EnumType.ORDINAL}} là mặc định của {{@Enumerated}}!). Chỉ cần ai đó chèn hằng mới vào giữa enum là toàn bộ dữ liệu cũ bị hiểu sai nghĩa. Dùng {{@Enumerated(EnumType.STRING)}} hoặc một mã cố định do bạn định nghĩa kèm {{AttributeConverter}}.`
},
{
  id: 'qz-core-020', topic: 'core', multi: true,
  q: `Class {{C}} không biên dịch được vì xung đột default method. Những cách sửa nào hợp lệ? (Chọn 2)
~~~java
interface A { default String hi() { return "A"; } }
interface B { default String hi() { return "B"; } }
class C implements A, B { }
~~~`,
  options: [
    `Override hi() trong C và gọi A.super.hi() để chọn hành vi của A`,
    `Override hi() trong C và gọi super.hi()`,
    `Cho B extends A và override hi() trong B; khi đó C implements A, B biên dịch được và dùng hi() của B`,
    `Chỉ cần đánh dấu C là abstract, không cần override`,
    `Thêm @FunctionalInterface lên A để A được ưu tiên`
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: override và gọi {{A.super.hi()}}; hoặc cho B extends A và override.**

### Vì sao đúng
Quy tắc giải xung đột default method:
1. **Class thắng interface**: method trong class (hoặc superclass) luôn ưu tiên.
2. **Interface cụ thể hơn thắng**: nếu B extends A và override hi(), thì B "cụ thể hơn" nên C dùng B.hi() mà không lỗi.
3. Còn lại (A, B ngang hàng) → class phải **tự override** và có thể chọn một bản bằng cú pháp {{X.super.method()}}.

### Vì sao các phương án còn lại sai
- **super.hi()**: {{super}} trỏ tới superclass ({{Object}}), không có hi() → lỗi biên dịch. Phải ghi rõ tên interface.
- **abstract class C**: JLS vẫn báo lỗi khi một class (kể cả abstract) thừa hưởng hai default method xung đột mà không override.
- **@FunctionalInterface**: annotation chỉ kiểm tra interface có đúng một abstract method, không ảnh hưởng thứ tự ưu tiên; ở đây A còn không có abstract method nào nên sẽ lỗi.

> Senior tip: xung đột này hay xảy ra khi nâng cấp thư viện thêm default method trùng tên, làm code client đột nhiên không biên dịch (ví dụ Java 21 thêm {{getFirst()}}/{{reversed()}} vào List gây xung đột với interface tự viết). Khi thiết kế API, chọn tên default method đủ đặc thù.`
},

// ===================== collections =====================
{
  id: 'qz-collections-007', topic: 'collections',
  q: `Đoạn code sau cho kết quả gì?
~~~java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3, 4));
for (Integer x : list) {
    if (x == 3) list.remove(x);
}
System.out.println(list);
~~~`,
  options: [
    `Ném ConcurrentModificationException`,
    `[1, 2, 3] vì list.remove(x) với x = 3 xoá phần tử ở index 3`,
    `Vòng lặp chạy vô hạn`,
    `[1, 2, 4], không ném exception`
  ],
  answer: 3,
  explain: `**Đáp án đúng: in [1, 2, 4] và không ném exception.**

### Vì sao đúng
For-each dùng {{Iterator}} của ArrayList. Hai cơ chế quan trọng:
- {{hasNext()}} chỉ kiểm tra {{cursor != size}}.
- {{next()}} mới kiểm tra {{modCount}} để ném {{ConcurrentModificationException}}.

Diễn biến: sau khi trả về 3, {{cursor = 3}}. {{list.remove(x)}} xoá phần tử 3, {{size}} còn 3. Lần lặp tiếp, {{hasNext()}} thấy {{cursor == size}} nên trả về {{false}} → vòng lặp kết thúc, **không gọi next()** nên không có CME, và phần tử 4 cũng không được duyệt. Xoá **phần tử áp chót** là trường hợp đặc biệt "lọt lưới" fail-fast.

### Vì sao các phương án còn lại sai
- **CME**: sẽ xảy ra nếu xoá phần tử khác (ví dụ 2), nhưng không xảy ra với phần tử áp chót.
- **Xoá index 3**: {{x}} là {{Integer}} nên gọi overload {{remove(Object)}}, xoá theo giá trị.
- **Vô hạn**: cursor không bao giờ lùi.

> Senior tip: fail-fast là **best-effort**, Javadoc nói rõ không được dựa vào nó để đảm bảo đúng đắn. Code này "chạy được" trong test nhưng sẽ nổ CME khi dữ liệu đổi. Luôn dùng {{list.removeIf(...)}} hoặc {{Iterator.remove()}}.`
},
{
  id: 'qz-collections-008', topic: 'collections',
  q: `Đoạn code sau cho kết quả gì?
~~~java
String[] arr = {"a", "b", "c"};
List<String> l = Arrays.asList(arr);
arr[0] = "z";
l.set(1, "y");
System.out.println(l + " " + arr[1]);
l.add("d");
~~~`,
  options: [
    `In "[z, y, c] y" rồi ném UnsupportedOperationException ở l.add`,
    `In "[a, y, c] b" rồi add thành công`,
    `In "[z, y, c] y", add thành công vì Arrays.asList trả về java.util.ArrayList`,
    `Ném UnsupportedOperationException ngay ở l.set`
  ],
  answer: 0,
  explain: `**Đáp án đúng: in "[z, y, c] y" rồi ném UnsupportedOperationException.**

### Vì sao đúng
{{Arrays.asList}} trả về {{Arrays$ArrayList}} (một class private trùng tên, **không phải** {{java.util.ArrayList}}), là **view fixed-size** bọc trực tiếp mảng gốc:
- Ghi vào mảng ({{arr[0] = "z"}}) → list thấy ngay.
- {{set}} được hỗ trợ và ghi xuyên xuống mảng → {{arr[1]}} thành "y".
- {{add}}/{{remove}} đổi kích thước → {{UnsupportedOperationException}} (kế thừa từ {{AbstractList}}).

### Vì sao các phương án còn lại sai
- **[a, y, c] b**: list không phải bản copy, hai chiều đều thấy nhau.
- **java.util.ArrayList**: tên giống nhưng là class khác, không thay đổi kích thước được.
- **UOE ở set**: set không đổi kích thước nên được phép (khác với {{List.of}} chặn cả set).

> Senior tip: bẫy thứ hai là gọi {{Arrays.asList}} với một mảng {{int[]}} hai phần tử sẽ cho ra {{List<int[]>}} có **1 phần tử** (mảng primitive không được box). Cần list sửa được thì {{new ArrayList<>(Arrays.asList(arr))}}; cần list bất biến thì {{List.of(arr)}}.`
},
{
  id: 'qz-collections-009', topic: 'collections',
  q: `Bạn biết trước sẽ nạp đúng 100.000 entry vào một {{HashMap}} và muốn **không xảy ra lần resize nào**, giữ load factor mặc định. Trên Java 21, cách khai báo nào đúng?`,
  options: [
    `new HashMap<>(100_000)`,
    `HashMap.newHashMap(100_000)`,
    `new HashMap<>(); rồi gọi map.ensureCapacity(100_000)`,
    `new HashMap<>(75_000), vì 75.000 / 0.75 = 100.000`
  ],
  answer: 1,
  explain: `**Đáp án đúng: {{HashMap.newHashMap(100_000)}}.**

### Vì sao đúng
Tham số constructor {{HashMap(int)}} là **capacity của bảng**, không phải số phần tử. Resize xảy ra khi {{size > capacity * loadFactor}}. Factory {{newHashMap(int numMappings)}} (thêm từ **Java 19**) tính sẵn capacity = {{numMappings / 0.75}} rồi làm tròn lên luỹ thừa 2, nên chứa đủ số phần tử mà không resize. Tương tự có {{HashSet.newHashSet}}, {{LinkedHashMap.newLinkedHashMap}}.

### Vì sao các phương án còn lại sai
- **new HashMap<>(100_000)**: capacity làm tròn lên 131.072, threshold = 131.072 × 0.75 = 98.304 < 100.000 → vẫn resize **một lần** ở phần tử thứ 98.305 (copy toàn bộ bảng).
- **ensureCapacity**: HashMap không có method này (đó là của ArrayList) → lỗi biên dịch.
- **75.000**: đi ngược công thức; capacity 131.072 → threshold 98.304, vẫn resize. Muốn tự tính thì phải là {{100_000 / 0.75 + 1}}.

> Senior tip: trước Java 19, Guava có {{Maps.newHashMapWithExpectedSize}}. Pre-size quan trọng khi map rất lớn hoặc tạo liên tục trong hot path; với map nhỏ, lợi ích không đáng kể. Đừng dùng {{loadFactor = 1.0}} để "tiết kiệm": chuỗi va chạm dài hơn, get chậm hơn.`
},
{
  id: 'qz-collections-010', topic: 'collections',
  q: `Đoạn code sau in ra gì?
~~~java
record Emp(String name, int age) {}
Set<Emp> s = new TreeSet<>(Comparator.comparingInt(Emp::age));
s.add(new Emp("An", 30));
s.add(new Emp("Binh", 30));
s.add(new Emp("Chi", 25));
System.out.println(s.size() + " " + s.contains(new Emp("Zed", 30)));
~~~`,
  options: [
    `3 false`,
    `3 true`,
    `2 true`,
    `2 false`
  ],
  answer: 2,
  explain: `**Đáp án đúng: 2 true.**

### Vì sao đúng
{{TreeSet}}/{{TreeMap}} **không dùng equals/hashCode**; chúng xác định "trùng" bằng {{compare(a, b) == 0}}. Comparator chỉ so tuổi:
- "Binh" (30) so với "An" (30) → 0 → bị coi là trùng, {{add}} trả về false và **không thêm**. Size = 2 (An, Chi).
- {{contains(new Emp("Zed", 30))}} → compare với An = 0 → {{true}}, dù record Emp("Zed", 30) không equals Emp("An", 30).

### Vì sao các phương án còn lại sai
- **3 false / 3 true**: chỉ đúng với HashSet (dùng equals của record so cả name và age).
- **2 false**: contains cũng dùng comparator, nên tìm thấy.

> Senior tip: comparator nên **nhất quán với equals**; nếu sort theo trường không unique thì thêm tie-breaker: {{comparingInt(Emp::age).thenComparing(Emp::name)}}. Bug thật: dùng TreeSet để "khử trùng và sắp xếp" giao dịch theo thời gian, hai giao dịch cùng millisecond bị mất một cái mà không có lỗi nào.`
},
{
  id: 'qz-collections-011', topic: 'collections',
  q: `Bạn dựng LRU cache dung lượng 2 bằng {{LinkedHashMap}}. Đoạn code sau in ra gì?
~~~java
Map<String, Integer> lru = new LinkedHashMap<>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<String, Integer> e) {
        return size() > 2;
    }
};
lru.put("a", 1);
lru.put("b", 2);
lru.get("a");
lru.put("c", 3);
System.out.println(lru.keySet());
~~~`,
  options: [
    `[b, c]`,
    `[a, b, c]`,
    `[c, a]`,
    `[a, c]`
  ],
  answer: 3,
  explain: `**Đáp án đúng: [a, c].**

### Vì sao đúng
- Tham số thứ 3 {{accessOrder = true}}: mỗi lần {{get}}/{{put}} một key, entry đó được chuyển xuống **cuối** danh sách liên kết (vị trí "mới dùng nhất"). Đầu danh sách là entry ít dùng gần đây nhất.
- Diễn biến: put a, b → [a, b]; get a → [b, a]; put c → [b, a, c]; sau put, {{removeEldestEntry}} thấy size 3 > 2 → xoá phần tử đầu (b) → [a, c].
- {{keySet()}} duyệt từ cũ đến mới nên in [a, c].

### Vì sao các phương án còn lại sai
- **[b, c]**: đó là kết quả nếu {{accessOrder = false}} (thứ tự chèn), khi đó get không đổi vị trí và a bị xoá.
- **[a, b, c]**: removeEldestEntry trả về true khi vượt 2, nên eldest bị xoá.
- **[c, a]**: thứ tự duyệt là từ ít dùng gần đây đến dùng gần đây nhất, không đảo ngược.

> Senior tip: LinkedHashMap LRU **không thread-safe**, và ở chế độ access-order thì ngay cả {{get}} cũng là thao tác ghi (sửa liên kết), nên bọc {{synchronizedMap}} sẽ thành nút cổ chai. Production nên dùng Caffeine (W-TinyLFU, hit rate tốt hơn LRU, có TTL, metrics).`
},
{
  id: 'qz-collections-012', topic: 'collections',
  q: `Cần lấy **top 100 sản phẩm bán chạy nhất** từ một luồng 50 triệu bản ghi (đọc tuần tự, không vừa bộ nhớ). Cách nào đúng và hiệu quả?`,
  options: [
    `PriorityQueue min-heap giữ tối đa 100 phần tử; vượt 100 thì poll() phần tử nhỏ nhất. Thời gian O(n log 100), bộ nhớ O(100)`,
    `PriorityQueue max-heap chứa toàn bộ bản ghi rồi poll() 100 lần`,
    `Đưa vào TreeSet sắp theo số lượng bán, giữ tối đa 100 phần tử`,
    `PriorityQueue min-heap kích thước 100, cuối cùng duyệt iterator() là ra danh sách đã sắp xếp giảm dần`
  ],
  answer: 0,
  explain: `**Đáp án đúng: min-heap kích thước K = 100.**

### Vì sao đúng
Min-heap giữ **100 phần tử lớn nhất đã thấy**, gốc heap ({{peek()}}) là phần tử nhỏ nhất trong top hiện tại:
~~~java
PriorityQueue<Item> pq = new PriorityQueue<>(Comparator.comparingLong(Item::sold));
for (Item it : stream) {
    pq.offer(it);
    if (pq.size() > 100) pq.poll();   // loại phần tử nhỏ nhất
}
~~~
Mỗi thao tác O(log K) → tổng O(n log K), bộ nhớ chỉ O(K). Có thể tối ưu thêm: chỉ offer khi {{it.sold() > pq.peek().sold()}}.

### Vì sao các phương án còn lại sai
- **Max-heap toàn bộ**: bộ nhớ O(n) = 50 triệu object, không vừa RAM.
- **TreeSet**: hai sản phẩm có cùng số lượng bán bị coi là trùng (compare = 0) và **mất dữ liệu**, trừ khi thêm tie-breaker.
- **iterator() của PriorityQueue**: duyệt theo thứ tự mảng heap, **không** có thứ tự sắp xếp. Phải poll() lần lượt (ra thứ tự tăng dần) rồi đảo.

> Senior tip: ở quy mô phân tán (nhiều partition Kafka), mỗi node tính top-K cục bộ rồi merge K×N ứng viên. Nếu chấp nhận xấp xỉ với dữ liệu vô hạn, dùng Count-Min Sketch + heap (heavy hitters).`
},
{
  id: 'qz-collections-013', topic: 'collections', multi: true,
  q: `Cần xoá mọi đơn hàng có trạng thái {{CANCELLED}} khỏi một {{ArrayList<Order>}} (chỉ một thread truy cập). Những cách nào **đúng**? (Chọn 2)`,
  options: [
    `Duyệt for-each và gọi list.remove(o) khi gặp đơn CANCELLED`,
    `list.removeIf(o -> o.status() == Status.CANCELLED)`,
    `Dùng Iterator tường minh và gọi it.remove() khi gặp đơn CANCELLED`,
    `for (int i = 0; i < list.size(); i++) nếu đơn thứ i bị huỷ thì list.remove(i)`,
    `list.stream().filter(o -> o.status() == Status.CANCELLED).forEach(list::remove)`
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: {{removeIf}} và {{Iterator.remove()}}.**

### Vì sao đúng
- {{removeIf}} của ArrayList đánh dấu các phần tử cần xoá rồi **dồn mảng một lần**: O(n), gọn và an toàn.
- {{Iterator.remove()}} xoá phần tử vừa trả về và cập nhật {{expectedModCount}} của iterator, nên không gây CME. Tuy nhiên mỗi lần remove trên ArrayList dịch mảng O(n), nên tổng có thể O(n²) khi xoá nhiều.

### Vì sao các phương án còn lại sai
- **for-each + list.remove**: sửa list trực tiếp làm lệch {{modCount}}, lần {{next()}} tiếp theo ném {{ConcurrentModificationException}}.
- **for theo index + remove(i)**: sau khi xoá, các phần tử dồn lên một vị trí mà {{i}} vẫn tăng → **bỏ sót** phần tử ngay sau (hai đơn huỷ liền nhau thì chỉ xoá được một). Chỉ đúng khi duyệt ngược từ cuối.
- **stream().forEach(list::remove)**: sửa nguồn trong lúc stream đang duyệt (vi phạm non-interference); spliterator của ArrayList kiểm tra modCount và ném CME.

> Senior tip: trong review, coi "sửa collection khi đang duyệt" là red flag. Nếu cần vừa lọc vừa giữ list gốc, tạo list mới bằng {{stream().filter(...).toList()}}. Với Map: {{map.entrySet().removeIf(e -> ...)}} hoặc {{map.values().removeIf(...)}}.`
},
{
  id: 'qz-collections-014', topic: 'collections', multi: true,
  q: `Code review thấy thuật toán DFS (single-thread) dùng {{Stack<Node>}}. Bạn đề xuất thay bằng {{ArrayDeque<Node>}}. Những lập luận nào **đúng**? (Chọn 2)`,
  options: [
    `Stack kế thừa Vector nên mọi method đều synchronized, tốn chi phí khoá vô ích; ArrayDeque không đồng bộ và nhanh hơn`,
    `ArrayDeque.push()/pop() thao tác ở đầu deque, dùng như stack LIFO được ngay`,
    `ArrayDeque cho phép push(null) để làm phần tử đánh dấu (sentinel)`,
    `Duyệt Stack bằng for-each cho cùng thứ tự với duyệt ArrayDeque đã push cùng dữ liệu`,
    `ArrayDeque thread-safe nên sau này chia sẻ giữa nhiều thread cũng an toàn`
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: Stack synchronized thừa (ArrayDeque nhanh hơn) và push/pop của ArrayDeque là LIFO.**

### Vì sao đúng
- {{Stack extends Vector}}: mọi method {{synchronized}}, lại còn lộ các method của List ({{add(index)}}, {{get(i)}}) cho phép phá vỡ ngữ nghĩa stack. Javadoc của Stack khuyến nghị dùng {{Deque}}.
- {{ArrayDeque}} là mảng vòng (circular buffer), push/pop ở đầu O(1) amortized, cache-friendly, nhanh hơn cả LinkedList (không tạo node).

### Vì sao các phương án còn lại sai
- **push(null)**: ArrayDeque **cấm null** (ném NPE) vì null được dùng để báo deque rỗng ({{poll()}} trả về null).
- **Cùng thứ tự duyệt**: iterator của Stack (Vector) đi từ đáy lên đỉnh (thứ tự push), còn iterator của ArrayDeque dùng làm stack đi từ đỉnh xuống. Code in ra stack sẽ đổi thứ tự sau khi migrate, cần lưu ý.
- **Thread-safe**: ArrayDeque không thread-safe. Cần dùng chung giữa thread thì dùng {{ConcurrentLinkedDeque}} hoặc {{LinkedBlockingDeque}}.

> Senior tip: tương tự, {{Vector}}, {{Hashtable}}, {{StringBuffer}} là di sản đồng bộ thô; trong code mới chọn bản không đồng bộ, và khi cần concurrency thì chọn cấu trúc trong {{java.util.concurrent}} được thiết kế cho việc đó.`
},
{
  id: 'qz-collections-015', topic: 'collections',
  q: `Đoạn code sau in ra gì?
~~~java
List<String> src = new ArrayList<>(List.of("a", "b"));
List<String> view = Collections.unmodifiableList(src);
List<String> copy = List.copyOf(src);
src.add("c");
System.out.println(view.size() + " " + copy.size());
~~~`,
  options: [
    `2 2`,
    `3 2`,
    `3 3`,
    `Ném UnsupportedOperationException ở src.add vì src đã được bọc unmodifiable`
  ],
  answer: 1,
  explain: `**Đáp án đúng: 3 2.**

### Vì sao đúng
- {{Collections.unmodifiableList(src)}} là **view chỉ đọc**: chặn ghi qua chính view, nhưng vẫn phản ánh mọi thay đổi trên list gốc → size 3.
- {{List.copyOf(src)}} tạo **bản copy bất biến thật** (snapshot) → vẫn 2. (Nếu đầu vào đã là list bất biến từ {{List.of}}/{{copyOf}} thì copyOf có thể trả lại chính nó, không copy.)

### Vì sao các phương án còn lại sai
- **2 2**: view không phải snapshot.
- **3 3**: copyOf không liên kết với list gốc.
- **UOE ở src.add**: bọc unmodifiable không làm list gốc mất khả năng ghi; chỉ view bị chặn.

> Senior tip: khi trả collection từ API, {{unmodifiableList}} chỉ đủ nếu bạn kiểm soát list gốc; nếu list gốc nhận từ caller thì phải {{List.copyOf}}. Lưu ý {{List.copyOf}}/{{List.of}} **cấm null** (NPE, kể cả {{contains(null)}}), còn {{unmodifiableList}} chấp nhận null.`
},
{
  id: 'qz-collections-016', topic: 'collections', multi: true,
  q: `Dữ liệu đầu vào có thể chứa {{null}}. Những thao tác nào chạy **không ném exception**? (Chọn 3)`,
  options: [
    `new HashMap<String, Integer>().put(null, 1)`,
    `new ConcurrentHashMap<String, Integer>().put("k", null)`,
    `new TreeMap<String, Integer>().put(null, 1)`,
    `new ArrayList<String>().add(null)`,
    `new ArrayDeque<String>().offer(null)`,
    `new LinkedHashSet<String>().add(null)`
  ],
  answer: [0, 3, 5],
  explain: `**Đáp án đúng: HashMap.put(null, …), ArrayList.add(null), LinkedHashSet.add(null).**

### Vì sao đúng
- {{HashMap}} cho phép **một key null** (hash của null quy ước là 0, nằm ở bucket 0) và nhiều value null.
- {{ArrayList}} chấp nhận null như mọi phần tử.
- {{LinkedHashSet}} dựa trên LinkedHashMap nên chấp nhận một phần tử null.

### Vì sao các phương án còn lại sai
- **ConcurrentHashMap**: cấm cả key lẫn value null (NPE). Lý do thiết kế: trong môi trường concurrent, {{get(k) == null}} phải mang nghĩa duy nhất "không có key"; nếu cho phép value null thì không phân biệt được, và không thể kiểm tra rồi hành động một cách nguyên tử.
- **TreeMap.put(null)** với natural ordering: phải gọi {{compareTo}} trên key → NPE (kể cả khi map rỗng, vì TreeMap gọi compare(key, key) để kiểm tra kiểu).
- **ArrayDeque.offer(null)**: cấm null vì {{poll()}}/{{peek()}} dùng null để báo deque rỗng.

> Senior tip: khi migrate {{HashMap}} sang {{ConcurrentHashMap}} để "sửa lỗi thread-safety", code cũ có {{put(k, null)}} sẽ nổ NPE trên production. Grep trước các chỗ put có thể null và dùng {{Optional}} hoặc sentinel object.`
},
{
  id: 'qz-collections-017', topic: 'collections',
  q: `Service cần giữ **10 triệu id kiểu long** trong bộ nhớ để kiểm tra tồn tại (JVM 64-bit, compressed oops). Dùng {{HashSet<Long>}} tốn khoảng bao nhiêu heap, và lựa chọn tốt hơn là gì?`,
  options: [
    `Khoảng 80 MB vì mỗi long 8 byte, HashSet không tốn thêm đáng kể`,
    `Khoảng 160 MB; chuyển sang LinkedList<Long> để giảm overhead`,
    `Cỡ 600 MB (Node + Long box + bucket); dùng long[] đã sort + Arrays.binarySearch (khoảng 80 MB) hoặc thư viện primitive collection`,
    `Cỡ 600 MB; chuyển sang TreeSet<Long> vì cây gọn hơn bảng băm`
  ],
  answer: 2,
  explain: `**Đáp án đúng: cỡ 600 MB; dùng long[] sort + binarySearch hoặc primitive collection.**

### Vì sao đúng
Ước lượng mỗi phần tử trong {{HashSet<Long>}} (HashSet bọc HashMap):
| Thành phần | Kích thước xấp xỉ |
|---|---|
| {{HashMap.Node}} (header 12 + hash 4 + key/value/next 3×4) | 32 byte |
| Object {{Long}} (header 12 + long 8, căn 8) | 24 byte |
| Slot trong mảng bảng (capacity ~16M × 4 byte / 10M) | ~6–7 byte |
Tổng ~62 byte × 10 triệu ≈ **600 MB**, gấp ~7 lần dữ liệu thật (80 MB). {{long[]}} đã sort chỉ 80 MB, tra cứu O(log n) ≈ 24 bước; hoặc dùng {{LongOpenHashSet}} (fastutil), Eclipse Collections, RoaringBitmap nếu id dày đặc.

### Vì sao các phương án còn lại sai
- **80 MB**: bỏ qua boxing và overhead node/bảng băm.
- **LinkedList<Long>**: mỗi node 24 byte + Long 24 byte, lại tra cứu O(n), tệ hơn mọi mặt.
- **TreeSet<Long>**: mỗi {{TreeMap.Entry}} (key, value, left, right, parent, color) khoảng 40 byte, còn tốn hơn HashSet.

> Senior tip: con số này hay xuất hiện trong heap dump: {{java.lang.Long}} và {{HashMap$Node}} đứng đầu histogram. Trước khi tăng {{-Xmx}}, hãy hỏi "có thể lưu primitive không?". Với tập id cần chia sẻ giữa nhiều instance thì cân nhắc Redis set hoặc Bloom filter (chấp nhận false positive).`
},
{
  id: 'qz-collections-018', topic: 'collections',
  q: `Màn hình bảng xếp hạng cần sắp theo điểm giảm dần, người **chưa có điểm (null)** xếp cuối. Đoạn code sau in ra gì?
~~~java
record P(String name, Integer score) {}
List<P> ps = new ArrayList<>(List.of(
    new P("An", 8), new P("Binh", null), new P("Chi", 9)));
ps.sort(Comparator.comparing(P::score,
        Comparator.nullsLast(Comparator.reverseOrder())));
System.out.println(ps.stream().map(P::name).toList());
~~~`,
  options: [
    `[Binh, Chi, An]`,
    `NullPointerException vì Comparator.comparing không chịu được key null`,
    `[An, Chi, Binh]`,
    `[Chi, An, Binh]`
  ],
  answer: 3,
  explain: `**Đáp án đúng: [Chi, An, Binh].**

### Vì sao đúng
{{Comparator.comparing(keyExtractor, keyComparator)}} trích key (score) rồi so sánh bằng {{keyComparator}}. Ở đây keyComparator là {{nullsLast(reverseOrder())}}: null đứng cuối, còn giá trị khác null so sánh theo thứ tự đảo (giảm dần). Kết quả: Chi (9), An (8), Binh (null).

### Vì sao các phương án còn lại sai
- **[Binh, Chi, An]**: đó là {{nullsFirst}}.
- **NPE**: sẽ xảy ra với {{Comparator.comparing(P::score)}} một tham số (gọi {{compareTo}} trên null), hoặc {{comparing(P::score).reversed()}}. Bản hai tham số với nullsLast xử lý được null.
- **[An, Chi, Binh]**: thứ tự tăng dần, bỏ qua reverseOrder.

> Senior tip: bẫy kinh điển là {{comparing(P::score).reversed().thenComparing(P::name)}} vs {{comparing(P::score, reverseOrder()).thenComparing(P::name)}}: {{reversed()}} đảo **toàn bộ chuỗi comparator phía trước nó**, dễ đảo nhầm tiêu chí phụ. {{List.sort}} dùng TimSort ổn định, nên sắp nhiều lần theo tiêu chí khác nhau vẫn giữ thứ tự tương đối của phần tử bằng nhau.`
},
{
  id: 'qz-collections-019', topic: 'collections',
  q: `Unit test so sánh {{Set.of("a", "b", "c").toString()}} với chuỗi cố định {{"[a, b, c]"}}. Trên máy dev pass, trên CI lúc pass lúc fail dù không đổi code. Nguyên nhân?`,
  options: [
    `Set.of/Map.of cố ý xáo thứ tự duyệt bằng một salt ngẫu nhiên chọn mỗi lần khởi động JVM`,
    `String.hashCode() trả kết quả khác nhau giữa các lần chạy JVM`,
    `GC di chuyển object nên thứ tự trong bảng băm thay đổi`,
    `Set.of là view của mảng tham số nên phụ thuộc thứ tự compiler sắp xếp tham số`
  ],
  answer: 0,
  explain: `**Đáp án đúng: Set.of/Map.of dùng salt ngẫu nhiên mỗi lần chạy JVM.**

### Vì sao đúng
Các immutable collection từ {{Set.of}}/{{Map.of}} (Java 9+) tính vị trí phần tử bằng hash kết hợp một **SALT** sinh ngẫu nhiên khi JVM khởi động. Mục đích có chủ đích: **ngăn code phụ thuộc vào thứ tự duyệt** vốn không được đặc tả. Vì vậy thứ tự ổn định trong một lần chạy nhưng đổi giữa các lần chạy.

### Vì sao các phương án còn lại sai
- **String.hashCode**: là công thức xác định ({{s[0]*31^(n-1) + ...}}), giống nhau mọi lần chạy.
- **GC di chuyển object**: vị trí trong bảng băm phụ thuộc hashCode, không phụ thuộc địa chỉ bộ nhớ; identity hash cũng được giữ cố định khi object di chuyển.
- **View của mảng**: Set.of copy phần tử vào cấu trúc riêng, không phải view.

> Senior tip: HashMap/HashSet thường cho thứ tự ổn định nên test "vô tình" pass, rồi gãy khi nâng JDK hoặc đổi capacity. Test nên so sánh theo ngữ nghĩa: {{assertEquals(Set.of(...), actual)}}, JSONAssert/AssertJ {{containsExactlyInAnyOrder}}; cần thứ tự thì dùng {{LinkedHashMap}}/{{TreeMap}} hoặc Jackson {{ORDER_MAP_ENTRIES_BY_KEYS}}.`
},
{
  id: 'qz-collections-020', topic: 'collections',
  q: `Service đọc 1 triệu dòng vào {{ArrayList<Row>}}, rồi lưu {{bigList.subList(0, 10)}} vào một cache sống lâu để hiển thị "10 dòng mới nhất". Heap cứ tăng sau mỗi lần nạp. Nguyên nhân?`,
  options: [
    `subList copy 10 phần tử nhưng ArrayList gốc không bao giờ tự trimToSize`,
    `subList là view giữ tham chiếu tới list gốc, nên cả 1 triệu Row không được GC`,
    `subList tạo mảng mới có cùng capacity với list gốc`,
    `subList giữ một iterator đang mở khiến ArrayList không giải phóng được`
  ],
  answer: 1,
  explain: `**Đáp án đúng: subList là view giữ tham chiếu list gốc.**

### Vì sao đúng
{{ArrayList.subList}} trả về object {{SubList}} chứa tham chiếu tới list gốc cùng offset và size; mọi thao tác đọc/ghi đi xuyên xuống mảng gốc. Cache giữ SubList → giữ ArrayList gốc → giữ mảng 1 triệu phần tử và toàn bộ Row. Mỗi lần nạp thêm một bản là thêm ~1 triệu object "rò rỉ".
Sửa: {{cache.put(key, List.copyOf(bigList.subList(0, 10)))}} hoặc {{new ArrayList<>(...)}}.

### Vì sao các phương án còn lại sai
- **Copy 10 phần tử**: subList không copy.
- **Mảng mới cùng capacity**: không tạo mảng nào cả.
- **Iterator đang mở**: iterator Java không giữ tài nguyên kiểu "mở/đóng"; vấn đề là tham chiếu, không phải iterator.

> Senior tip: hiện tượng tương tự: {{String.substring}} trước Java 7u6 chia sẻ mảng char gốc, {{ByteBuffer.slice()}}, {{Arrays.asList}}, {{Map.keySet()}}. Trong heap dump, retained size của SubList bất thường lớn so với 10 phần tử là dấu hiệu. Ngoài ra sửa cấu trúc list gốc sau khi lấy subList làm view ném CME khi dùng lại.`
},

// ===================== modern =====================
{
  id: 'qz-modern-007', topic: 'modern',
  q: `Đoạn code sau in ra gì?
~~~java
Stream.of("a", "bb", "ccc", "dddd")
      .peek(s -> System.out.print("p:" + s + " "))
      .filter(s -> s.length() > 1)
      .map(String::toUpperCase)
      .findFirst()
      .ifPresent(s -> System.out.print("r:" + s));
~~~`,
  options: [
    `p:a p:bb p:ccc p:dddd r:BB`,
    `r:BB p:a p:bb`,
    `p:a p:bb r:BB`,
    `Không in gì từ peek vì peek chỉ chạy ở chế độ debug`
  ],
  answer: 2,
  explain: `**Đáp án đúng: p:a p:bb r:BB.**

### Vì sao đúng
Stream là **lazy** và xử lý **từng phần tử đi hết pipeline** (vertical), không phải xong từng bước cho cả danh sách (horizontal):
1. "a" → peek in {{p:a}} → filter loại.
2. "bb" → peek in {{p:bb}} → filter qua → map thành "BB" → {{findFirst}} có kết quả.
3. {{findFirst}} là **short-circuiting** terminal operation nên dừng, "ccc" và "dddd" không bao giờ được kéo ra.
Sau đó {{ifPresent}} in {{r:BB}}.

### Vì sao các phương án còn lại sai
- **In cả 4 phần tử**: hiểu sai rằng mỗi bước xử lý hết danh sách rồi mới sang bước sau (giống vòng lặp nhiều lượt).
- **r:BB đứng đầu**: ifPresent chỉ chạy sau khi terminal operation trả về Optional.
- **peek chỉ chạy khi debug**: peek chạy bình thường khi phần tử đi qua; điều đúng là peek **có thể không chạy** nếu implementation bỏ qua được phần tử (ví dụ {{count()}} trên nguồn biết trước size từ Java 9).

> Senior tip: đừng đặt side effect quan trọng (ghi log audit, cập nhật state) trong {{peek}}/{{map}}: số lần chạy phụ thuộc short-circuit và tối ưu của JDK. Ví dụ {{List.of(1,2,3).stream().peek(log::info).count()}} trên Java 9+ không in gì vì count tính thẳng từ size.`
},
{
  id: 'qz-modern-008', topic: 'modern',
  q: `Record sau dùng compact constructor để chuẩn hoá dữ liệu. Đoạn code in ra gì?
~~~java
record Range(int lo, int hi) {
    Range {
        if (lo > hi) { int t = lo; lo = hi; hi = t; }
    }
}
// main:
System.out.println(new Range(5, 1) + " " + new Range(1, 5).equals(new Range(5, 1)));
~~~`,
  options: [
    `Lỗi biên dịch: không được gán lại tham số trong compact constructor`,
    `Range[lo=5, hi=1] false`,
    `Range[lo=1, hi=5] false vì equals của record so sánh tham chiếu`,
    `Range[lo=1, hi=5] true`
  ],
  answer: 3,
  explain: `**Đáp án đúng: Range[lo=1, hi=5] true.**

### Vì sao đúng
Compact constructor không khai báo danh sách tham số; {{lo}}, {{hi}} bên trong là **tham số ngầm**, được phép gán lại. Compiler tự chèn {{this.lo = lo; this.hi = hi;}} **ở cuối** constructor, nên giá trị sau khi hoán đổi mới là giá trị được lưu vào field. Vì vậy {{new Range(5, 1)}} lưu lo=1, hi=5.
Record sinh {{equals}} so sánh **từng component** → hai Range (1, 5) bằng nhau → {{true}}. {{toString}} sinh dạng {{Range[lo=1, hi=5]}}.

### Vì sao các phương án còn lại sai
- **Lỗi biên dịch**: gán lại tham số là hợp lệ; điều bị cấm là gán trực tiếp {{this.lo = ...}} trong compact constructor.
- **[lo=5, hi=1]**: bỏ qua việc field được gán sau thân compact constructor.
- **equals so tham chiếu**: record tự sinh equals theo giá trị component.

> Senior tip: compact constructor là chỗ đặt validation và normalization ({{Objects.requireNonNull}}, {{List.copyOf}} cho component kiểu collection, trim chuỗi). Nhưng tránh hoán đổi âm thầm như ví dụ trong code nghiệp vụ: ném {{IllegalArgumentException}} thường rõ ràng hơn là "tự sửa" dữ liệu sai.`
},
{
  id: 'qz-modern-009', topic: 'modern',
  q: `Module A khai báo {{sealed interface Payment permits Card, Wallet}}. Module B có {{switch}} pattern matching **exhaustive, không có default** trên Payment. Team thêm {{record Crypto}} vào danh sách permits, build và deploy lại A nhưng **không biên dịch lại B** (vẫn dùng jar cũ). Khi B nhận một Crypto lúc runtime (Java 21), điều gì xảy ra?`,
  options: [
    `B ném MatchException, vì compiler đã chèn một nhánh ngầm cho trường hợp không khớp`,
    `Switch trả về null cho kiểu không khớp`,
    `JVM từ chối load class Crypto vì B không biết đến nó`,
    `Nhánh case đầu tiên được chọn làm mặc định`
  ],
  answer: 0,
  explain: `**Đáp án đúng: ném MatchException.**

### Vì sao đúng
Exhaustiveness được kiểm tra **lúc biên dịch** dựa trên danh sách permits tại thời điểm đó. Vì hierarchy có thể thay đổi sau khi biên dịch (separate compilation), javac luôn sinh thêm một nhánh mặc định **ngầm** ném lỗi nếu không case nào khớp lúc runtime. Với pattern switch (Java 21), lỗi đó là {{java.lang.MatchException}}. (Trước Java 21, switch expression trên enum ném {{IncompatibleClassChangeError}} trong tình huống này; JEP 441 thống nhất thành MatchException.)
Nếu biên dịch lại B, compiler sẽ báo lỗi "the switch expression does not cover all possible input values" — đó là lợi ích chính của sealed: compiler chỉ ra mọi chỗ cần sửa.

### Vì sao các phương án còn lại sai
- **Trả về null**: switch expression không bao giờ âm thầm trả null khi không khớp.
- **Từ chối load Crypto**: class loading không liên quan tới việc switch ở module khác có biết subtype hay không.
- **Chọn case đầu tiên**: không có cơ chế fallback như vậy.

> Senior tip: đó là lý do sealed hierarchy công khai qua ranh giới module/thư viện là một **cam kết API**: thêm subtype là breaking change với mọi consumer dùng switch exhaustive. Trong microservices, đừng chia sẻ sealed type qua thư viện chung nếu các service deploy độc lập; dùng DTO có trường type + default an toàn.`
},
{
  id: 'qz-modern-010', topic: 'modern',
  q: `Đoạn code sau in ra gì?
~~~java
Optional<String> name = Optional.of("  ");
String r = name.filter(s -> !s.isBlank())
               .map(String::trim)
               .or(() -> Optional.of("guest"))
               .orElseThrow();
System.out.println("[" + r + "]");
~~~`,
  options: [
    `[  ]`,
    `[guest]`,
    `[]`,
    `Ném NoSuchElementException ở orElseThrow`
  ],
  answer: 1,
  explain: `**Đáp án đúng: [guest].**

### Vì sao đúng
1. {{Optional.of("  ")}}: có giá trị (chuỗi 2 khoảng trắng, không null).
2. {{filter(s -> !s.isBlank())}}: {{isBlank()}} (Java 11) trả về true với chuỗi chỉ có whitespace, nên điều kiện false → Optional **rỗng**.
3. {{map}} trên Optional rỗng không chạy.
4. {{or(...)}} (Java 9) trả về Optional thay thế khi rỗng → {{Optional.of("guest")}}.
5. {{orElseThrow()}} (Java 10, không tham số) lấy giá trị → "guest".

### Vì sao các phương án còn lại sai
- **[  ]**: filter đã loại chuỗi blank.
- **[]**: map(trim) không được chạy vì Optional đã rỗng sau filter.
- **NoSuchElementException**: {{or}} đã cung cấp giá trị thay thế trước orElseThrow.

> Senior tip: phân biệt {{or}} (trả về Optional, dùng để nối nhiều nguồn: cache → DB → default) với {{orElse}}/{{orElseGet}} (trả về giá trị). Optional hợp làm **kiểu trả về**; không nên làm field của entity, tham số method hay phần tử collection.`
},
{
  id: 'qz-modern-011', topic: 'modern',
  q: `Đoạn code sau in ra gì?
~~~java
record Order(String customer, int amount) {}
List<Order> os = List.of(new Order("B", 5), new Order("A", 10), new Order("A", 7));
Map<String, Integer> m = os.stream().collect(Collectors.groupingBy(
        Order::customer, TreeMap::new, Collectors.summingInt(Order::amount)));
System.out.println(m);
~~~`,
  options: [
    `{A=[10, 7], B=[5]}`,
    `Lỗi biên dịch: groupingBy không nhận tham số map factory`,
    `{A=17, B=5}`,
    `IllegalStateException: Duplicate key A`
  ],
  answer: 2,
  explain: `**Đáp án đúng: {A=17, B=5}.**

### Vì sao đúng
{{groupingBy}} có overload 3 tham số: {{classifier}}, {{mapFactory}} (ở đây {{TreeMap::new}} nên key được sắp xếp: A trước B), và **downstream collector** gom các phần tử cùng nhóm. {{summingInt}} cộng amount trong mỗi nhóm: A = 10 + 7 = 17, B = 5.

### Vì sao các phương án còn lại sai
- **{A=[10, 7], B=[5]}**: đó là kết quả khi downstream mặc định ({{toList()}}) và map giá trị là amount; ở đây downstream là summingInt.
- **Không nhận map factory**: overload {{groupingBy(classifier, mapFactory, downstream)}} có từ Java 8.
- **Duplicate key**: đó là hành vi của {{Collectors.toMap}} không có merge function; groupingBy được thiết kế để gom các phần tử trùng key.

> Senior tip: downstream collector là chỗ tối ưu bộ nhớ: {{groupingBy(.., counting())}}, {{summingLong}}, {{mapping(Order::id, toSet())}}, {{maxBy}} tránh việc tạo List trung gian rồi mới tính. Với dữ liệu lớn từ DB, GROUP BY trong SQL vẫn rẻ hơn kéo cả bảng lên rồi groupingBy.`
},
{
  id: 'qz-modern-012', topic: 'modern',
  q: `Đoạn code sau chạy thế nào (Java 17)?
~~~java
List<String> a = Stream.of("x", null).toList();
List<String> b = Stream.of("x", null).collect(Collectors.toList());
b.add("y");
a.add("y");
~~~`,
  options: [
    `Stream.toList() ném NullPointerException vì có phần tử null`,
    `Cả hai lệnh add đều chạy được vì cả hai đều là ArrayList`,
    `b.add ném UnsupportedOperationException vì Collectors.toList trả về list không sửa được`,
    `Cả a và b đều chứa null; b.add chạy được; a.add ném UnsupportedOperationException`
  ],
  answer: 3,
  explain: `**Đáp án đúng: cả hai chứa null, b.add được, a.add ném UnsupportedOperationException.**

### Vì sao đúng
- {{Stream.toList()}} (Java 16) trả về **list không sửa được** nhưng **cho phép null** (khác {{List.of}}/{{Collectors.toUnmodifiableList()}} cấm null).
- {{Collectors.toList()}}: Javadoc **không đảm bảo** kiểu/khả năng sửa, nhưng implementation hiện tại là {{ArrayList}}, nên {{add}} chạy được.

| Cách | Sửa được? | Cho null? |
|---|---|---|
| {{Stream.toList()}} | Không | Có |
| {{Collectors.toList()}} | Có (thực tế, không đảm bảo) | Có |
| {{Collectors.toUnmodifiableList()}} | Không | Không (NPE) |

### Vì sao các phương án còn lại sai
- **toList ném NPE**: đó là hành vi của toUnmodifiableList, không phải Stream.toList.
- **Cả hai là ArrayList**: Stream.toList trả về list bất biến.
- **b.add ném UOE**: thực tế Collectors.toList trả về ArrayList.

> Senior tip: khi refactor hàng loạt {{collect(Collectors.toList())}} thành {{.toList()}} (IDE gợi ý), code phía sau nào gọi {{add}}/{{sort}}/{{removeIf}} trên kết quả sẽ nổ UOE **lúc runtime**. Rà soát hoặc dùng {{Collectors.toCollection(ArrayList::new)}} khi thật sự cần sửa.`
},
{
  id: 'qz-modern-013', topic: 'modern', multi: true,
  q: `Những đoạn code nào **biên dịch được**? (Chọn 2)`,
  options: [
    `int count = 0; list.forEach(x -> count++);`,
    `int[] count = {0}; list.forEach(x -> count[0]++);`,
    `String prefix = "a"; prefix = "b"; list.forEach(x -> System.out.println(prefix + x));`,
    `AtomicInteger c = new AtomicInteger(); list.forEach(x -> c.incrementAndGet());`,
    `for (int i = 0; i < 3; i++) { executor.submit(() -> System.out.println(i)); }`
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: mảng một phần tử và AtomicInteger.**

### Vì sao đúng
Lambda chỉ được dùng biến local **final hoặc effectively final** (không bị gán lại sau khi khởi tạo). Lý do: lambda **capture giá trị** của biến (copy), có thể chạy ở thread khác, sau khi method đã return và stack frame biến mất; cho phép gán lại sẽ gây hiểu lầm giữa bản copy và biến gốc.
- {{count}} kiểu {{int[]}} và {{c}} kiểu AtomicInteger: **tham chiếu** không đổi, chỉ nội dung object thay đổi → hợp lệ.

### Vì sao các phương án còn lại sai
- **count++**: gán lại biến local bên trong lambda → lỗi "local variables referenced from a lambda expression must be final or effectively final".
- **prefix = "b"**: bị gán lại trước đó nên không còn effectively final, dù lambda chỉ đọc.
- **for (int i ...)**: biến {{i}} bị {{i++}} thay đổi. (Với enhanced for {{for (int v : arr)}} thì mỗi vòng là biến mới, dùng được.)

> Senior tip: mẹo {{int[]}} biên dịch được nhưng **không thread-safe** nếu stream/forEach chạy song song. Code muốn đếm thì dùng {{stream().filter(...).count()}} hoặc reduce, tránh side effect; AtomicInteger/LongAdder chỉ khi thực sự cần đếm từ nhiều thread.`
},
{
  id: 'qz-modern-014', topic: 'modern',
  q: `Đoạn code sau (Java 17) cho kết quả gì?
~~~java
static void print(Object o) {
    if (!(o instanceof String s)) {
        return;
    }
    System.out.println(s.length());
}
// main:
print("abc");
~~~`,
  options: [
    `Biên dịch được và in 3, nhờ flow scoping của pattern variable`,
    `Lỗi biên dịch: biến s chỉ tồn tại bên trong khối if`,
    `Lỗi biên dịch: không được phủ định một instanceof pattern`,
    `In 3, nhưng chỉ khi bật --enable-preview`
  ],
  answer: 0,
  explain: `**Đáp án đúng: biên dịch được và in 3.**

### Vì sao đúng
Pattern variable có **flow scoping**: biến {{s}} có mặt ở mọi chỗ mà compiler chứng minh được pattern **chắc chắn đã khớp**. Ở đây nếu không khớp thì method {{return}}; vậy sau khối if, {{o instanceof String s}} chắc chắn đúng nên {{s}} dùng được. Pattern matching cho instanceof là tính năng chính thức từ **Java 16** (JEP 394).

### Vì sao các phương án còn lại sai
- **Chỉ trong khối if**: scope không theo khối mà theo luồng điều khiển; nếu bỏ {{return}} thì mới lỗi.
- **Không được phủ định**: phủ định hợp lệ; nó chỉ làm {{s}} có scope ở nhánh else/phía sau.
- **--enable-preview**: chỉ cần ở Java 14–15 (preview); Java 16+ là chuẩn.

> Senior tip: dạng "guard clause" này giúp bỏ cast thủ công và giảm lồng if. Kết hợp với {{&&}}: {{if (o instanceof String s && !s.isBlank())}} hợp lệ, còn {{||}} thì không ({{s}} chưa chắc được gán). Trong {{equals}}: {{return o instanceof Point p && x == p.x && y == p.y;}}.`
},
{
  id: 'qz-modern-015', topic: 'modern',
  q: `Đoạn code sau (Java 21) in ra gì?
~~~java
List<Integer> list = new ArrayList<>(List.of(1, 2, 3));
List<Integer> rev = list.reversed();
list.add(4);
rev.addFirst(0);
System.out.println(list + " " + rev.getFirst());
~~~`,
  options: [
    `[1, 2, 3, 4] 4, vì reversed() trả về bản copy`,
    `[1, 2, 3, 4, 0] 0`,
    `[0, 1, 2, 3, 4] 0`,
    `Ném UnsupportedOperationException vì view đảo ngược là chỉ đọc`
  ],
  answer: 1,
  explain: `**Đáp án đúng: [1, 2, 3, 4, 0] 0.**

### Vì sao đúng
Java 21 thêm **Sequenced Collections** (JEP 431): {{List}}, {{Deque}}, {{LinkedHashSet}}, {{SortedSet}}... có {{getFirst/getLast/addFirst/addLast/removeFirst/removeLast/reversed}}.
- {{reversed()}} trả về **view** đảo ngược, ghi xuyên xuống list gốc (nếu list gốc sửa được).
- {{list.add(4)}} → list = [1, 2, 3, 4], view thấy [4, 3, 2, 1].
- {{rev.addFirst(0)}}: đầu của view là **cuối** của list gốc → list = [1, 2, 3, 4, 0].
- {{rev.getFirst()}} = phần tử cuối của list gốc = 0.

### Vì sao các phương án còn lại sai
- **Bản copy**: reversed() là view, thấy cả thay đổi sau khi tạo.
- **[0, 1, 2, 3, 4]**: nhầm addFirst của view với addFirst của list gốc.
- **Chỉ đọc**: view kế thừa khả năng sửa của list gốc; chỉ khi gốc bất biến ({{List.of}}) thì mới UOE.

> Senior tip: trước Java 21 phải viết {{list.get(list.size() - 1)}} hay {{deque.peekLast()}}, {{linkedHashMap.entrySet().iterator().next()}}… mỗi loại một kiểu. Khi nâng cấp, chú ý class tự viết implement List có sẵn method {{getFirst()}} khác kiểu trả về có thể không biên dịch được nữa.`
},
{
  id: 'qz-modern-016', topic: 'modern', multi: true,
  q: `Những phát biểu nào **đúng** về method sau (Java 21)? (Chọn 2)
~~~java
static String classify(Object o) {
    return switch (o) {
        case null -> "null";
        case Integer i when i > 100 -> "big";
        case Integer i -> "int";
        case String s -> "str:" + s.length();
        default -> "other";
    };
}
~~~`,
  options: [
    `classify(null) trả về chuỗi "null" thay vì ném NullPointerException`,
    `classify(500) trả về "big"`,
    `Đổi chỗ để case Integer i đứng trước case Integer i when i > 100 vẫn biên dịch được`,
    `Có thể bỏ nhánh default vì switch đã exhaustive`,
    `classify(150L) trả về "big"`
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: classify(null) trả về "null" và classify(500) trả về "big".**

### Vì sao đúng
- Mặc định switch ném NPE khi selector là null; Java 21 cho phép **{{case null}}** tường minh để xử lý.
- Các case được thử **từ trên xuống**; {{Integer i when i > 100}} là guarded pattern, khớp với 500.

### Vì sao các phương án còn lại sai
- **Đổi chỗ**: {{case Integer i}} (không guard) **dominate** case có guard phía sau (mọi Integer đã bị bắt trước), compiler báo lỗi "this case label is dominated by a preceding case label".
- **Bỏ default**: {{Object}} không phải sealed type, nên chỉ có default (hoặc {{case Object o}}) mới làm switch exhaustive; bỏ đi là lỗi biên dịch.
- **150L**: {{Long}} không phải {{Integer}}, pattern không chuyển đổi kiểu số → rơi vào default "other".

> Senior tip: thứ tự case với pattern là ngữ nghĩa, không chỉ là trình bày: đặt case cụ thể/guard trước, case tổng quát sau. Khi selector là sealed interface, **tránh default** để compiler bắt được khi thêm subtype mới.`
},
{
  id: 'qz-modern-017', topic: 'modern',
  q: `Đoạn code sau cho kết quả gì?
~~~java
Stream<String> s = names.stream().filter(n -> n.startsWith("A"));
long c = s.count();
List<String> l = s.toList();
~~~`,
  options: [
    `l chứa các tên bắt đầu bằng A`,
    `l là list rỗng vì stream đã được tiêu thụ hết`,
    `Ném IllegalStateException ở s.toList()`,
    `Lỗi biên dịch vì không được gán stream vào biến`
  ],
  answer: 2,
  explain: `**Đáp án đúng: ném IllegalStateException ở s.toList().**

### Vì sao đúng
Stream **chỉ dùng được một lần**: sau khi một terminal operation ({{count()}}) chạy, stream bị đánh dấu "linked or consumed". Gọi thêm operation bất kỳ sẽ ném {{IllegalStateException: stream has already been operated upon or closed}}. Stream không lưu dữ liệu, nó là một pipeline mô tả cách kéo dữ liệu từ nguồn.

### Vì sao các phương án còn lại sai
- **Chứa các tên bắt đầu bằng A**: stream không "phát lại" dữ liệu.
- **List rỗng**: JDK chủ động ném lỗi thay vì trả kết quả rỗng gây hiểu lầm.
- **Lỗi biên dịch**: gán stream vào biến hoàn toàn hợp lệ; lỗi chỉ phát hiện lúc runtime.

> Senior tip: cần dùng lại pipeline thì lưu {{Supplier<Stream<String>>}} và gọi {{get()}} mỗi lần, hoặc collect ra List một lần rồi tính {{size()}} từ list. Đừng trả {{Stream}} từ repository/service rồi để nhiều nơi tiêu thụ; và stream từ {{Files.lines}}/JPA {{getResultStream}} cần đóng bằng try-with-resources.`
},
{
  id: 'qz-modern-018', topic: 'modern',
  q: `Bạn tính ngày đến hạn "sau 1 tháng" cho khoản vay giải ngân ngày 31/01/2024. Đoạn code sau in ra gì?
~~~java
LocalDate d = LocalDate.of(2024, 1, 31);
System.out.println(d.plusMonths(1) + " "
    + d.plusMonths(1).plusMonths(1) + " " + d.plusMonths(2));
~~~`,
  options: [
    `2024-03-02 2024-04-02 2024-03-31`,
    `2024-02-29 2024-03-31 2024-03-31`,
    `Ném DateTimeException vì ngày 31/02 không tồn tại`,
    `2024-02-29 2024-03-29 2024-03-31`
  ],
  answer: 3,
  explain: `**Đáp án đúng: 2024-02-29 2024-03-29 2024-03-31.**

### Vì sao đúng
{{plusMonths}} cộng tháng rồi, nếu ngày không hợp lệ, **kẹp về ngày cuối cùng hợp lệ của tháng** (2024 là năm nhuận nên 31/02 → 29/02).
- {{d.plusMonths(1)}} = 2024-02-29.
- {{.plusMonths(1)}} tiếp từ 29/02 → 2024-03-29 (ngày 31 gốc đã mất).
- {{d.plusMonths(2)}} từ 31/01 → 2024-03-31.
Phép cộng tháng **không có tính kết hợp**: cộng 1 hai lần khác cộng 2 một lần.

### Vì sao các phương án còn lại sai
- **03-02 / 04-02**: đó là kiểu "tràn sang tháng sau" của {{java.util.Calendar}} lenient hoặc một số thư viện khác, không phải java.time.
- **03-31 cho lần cộng nối tiếp**: lần cộng thứ hai bắt đầu từ 29/02, không nhớ ngày 31 ban đầu.
- **DateTimeException**: java.time tự kẹp ngày, không ném lỗi với plusMonths.

> Senior tip: lịch trả nợ hằng tháng phải tính **từ ngày gốc**: {{start.plusMonths(k)}} cho kỳ thứ k, không cộng dồn từ kỳ trước, nếu không ngày đến hạn sẽ trôi dần (31 → 29 → 29…). Ghi rõ quy tắc này trong đặc tả nghiệp vụ và test với 31/01, 29/02, 30/11.`
},
{
  id: 'qz-modern-019', topic: 'modern', multi: true,
  q: `Bạn lập kế hoạch nâng 20 service từ Java 17 lên Java 21 (Spring Boot 3.2+). Những phát biểu nào **đúng**? (Chọn 3)`,
  options: [
    `Virtual threads là tính năng chính thức trong Java 21 (JEP 444); Spring Boot 3.2+ bật bằng spring.threads.virtual.enabled=true`,
    `Generational ZGC có trong Java 21, bật bằng -XX:+UseZGC -XX:+ZGenerational`,
    `Java 21 đã xoá hẳn Security Manager nên code gọi System.setSecurityManager sẽ không biên dịch`,
    `Sequenced Collections thêm getFirst()/getLast()/reversed() vào List; class tự viết implement List có method cùng tên nhưng khác kiểu trả về có thể không biên dịch được nữa`,
    `Record patterns và pattern matching cho switch vẫn là preview trong Java 21, phải bật --enable-preview`
  ],
  answer: [0, 1, 3],
  explain: `**Đáp án đúng: virtual threads chính thức, Generational ZGC qua cờ ZGenerational, và rủi ro xung đột Sequenced Collections.**

### Vì sao đúng
- **JEP 444** đưa virtual threads thành chính thức ở Java 21; Spring Boot 3.2 thêm property {{spring.threads.virtual.enabled}} để Tomcat/Jetty, {{@Async}}, scheduler dùng virtual threads.
- **JEP 439** (Java 21) thêm Generational ZGC, cần {{-XX:+UseZGC -XX:+ZGenerational}}. Từ Java 23 chế độ generational thành mặc định, Java 24 bỏ hẳn chế độ non-generational.
- **JEP 431** thêm default method vào List/Deque/...; đây là một trong số ít điểm không tương thích nguồn khi nâng cấp (ví dụ class có {{getFirst()}} trả {{Optional}}).

### Vì sao các phương án còn lại sai
- **Security Manager**: bị deprecated for removal từ Java 17 (JEP 411); ở Java 21 API vẫn còn và biên dịch được (có cảnh báo). JEP 486 (Java 24) mới vô hiệu hoá vĩnh viễn.
- **Preview**: record patterns (JEP 440) và pattern matching cho switch (JEP 441) là **chính thức** ở Java 21.

> Senior tip: nâng LTS theo lộ trình: build bằng JDK mới với {{--release 17}} trước, chạy toàn bộ test, rồi đổi runtime, cuối cùng mới đổi {{--release 21}} và dùng tính năng mới. Kiểm tra các thư viện dùng bytecode (Lombok, Mockito/ByteBuddy, Jacoco, agent APM) vì chúng phải hỗ trợ class file version 65.`
},
{
  id: 'qz-modern-020', topic: 'modern',
  q: `Đoạn code sau cho kết quả gì?
~~~java
class Counter { int n; int next() { return ++n; } }
// main:
Counter c = new Counter();
Supplier<Integer> s = c::next;
c = new Counter();
System.out.println(s.get() + " " + s.get() + " " + c.next());
~~~`,
  options: [
    `In "1 2 1", vì bound method reference chốt receiver ngay khi được tạo`,
    `Lỗi biên dịch: c phải final hoặc effectively final`,
    `In "1 1 1"`,
    `In "1 2 3", vì s gọi trên object mà c đang trỏ tới lúc gọi get()`
  ],
  answer: 0,
  explain: `**Đáp án đúng: biên dịch được và in "1 2 1".**

### Vì sao đúng
Với **bound method reference** {{c::next}}, biểu thức receiver {{c}} được **đánh giá ngay lúc tạo** reference và object đó được lưu lại. Vì vậy:
- JLS **không** yêu cầu {{c}} effectively final (khác với lambda).
- {{s}} luôn gọi trên Counter thứ nhất: 1, rồi 2.
- {{c}} đã trỏ sang Counter mới: {{c.next()}} → 1.

Nếu viết bằng lambda {{() -> c.next()}} thì lỗi biên dịch, vì lambda capture **biến** {{c}} và biến đó bị gán lại.

### Vì sao các phương án còn lại sai
- **Phải effectively final**: quy tắc này áp dụng cho biến local được lambda/inner class tham chiếu, không áp dụng cho receiver của method reference.
- **1 1 1**: cùng một Counter được tăng hai lần qua s.
- **1 2 3**: s không theo dõi biến c; nó giữ object cũ.

> Senior tip: khác biệt thời điểm đánh giá còn ảnh hưởng tới NPE: {{Supplier<String> s = obj::toString}} ném NPE **ngay khi tạo** nếu obj null, còn {{() -> obj.toString()}} chỉ ném khi gọi. Biết điều này giúp đọc stack trace đúng chỗ.`
},

// ===================== concurrency =====================
{
  id: 'qz-concurrency-007', topic: 'concurrency',
  q: `Trên HotSpot, chương trình sau có thể hành xử thế nào?
~~~java
static boolean stop = false;
public static void main(String[] args) throws Exception {
    Thread t = new Thread(() -> {
        while (!stop) { }          // vòng lặp bận, không gọi method nào
        System.out.println("done");
    });
    t.start();
    Thread.sleep(100);
    stop = true;
}
~~~`,
  options: [
    `Luôn in "done" sau khoảng 100 ms vì main đã ghi stop = true`,
    `Có thể chạy mãi không dừng, vì không có happens-before nên JIT được phép đưa việc đọc stop ra ngoài vòng lặp`,
    `Ném IllegalMonitorStateException vì đọc biến static từ thread khác`,
    `Luôn dừng, vì Thread.sleep tạo happens-before với mọi thread khác`
  ],
  answer: 1,
  explain: `**Đáp án đúng: có thể chạy mãi không dừng.**

### Vì sao đúng
Theo Java Memory Model, giữa lệnh ghi {{stop = true}} ở main và lệnh đọc ở thread t **không có quan hệ happens-before**, nên JMM không bắt buộc t phải thấy giá trị mới. Trên thực tế, sau khi vòng lặp nóng lên, JIT (C2) thấy thân vòng lặp không ghi {{stop}} nên **hoist** phép đọc ra ngoài, biến code thành:
~~~java
if (!stop) { while (true) { } }
~~~
Thread t quay mãi dù CPU cache đã có giá trị mới. Sửa: khai báo {{volatile boolean stop}} (hoặc {{AtomicBoolean}}): mỗi lần đọc volatile đều phải đọc thật, và ghi volatile happens-before các lần đọc sau.

### Vì sao các phương án còn lại sai
- **Luôn in done**: chỉ "thường" đúng ở chế độ interpreter; không được JMM đảm bảo.
- **IllegalMonitorStateException**: chỉ ném khi gọi {{wait/notify}} mà không giữ monitor; đọc biến không liên quan.
- **Thread.sleep tạo happens-before**: sleep **không** có ngữ nghĩa đồng bộ nào (JLS 17.3 nói rõ).

> Senior tip: lỗi kiểu này thường chỉ xuất hiện trên production (JIT đã tối ưu) mà không tái hiện trong debug. Cờ dừng giữa thread luôn dùng volatile/Atomic, hoặc tốt hơn dùng cơ chế interrupt/{{ExecutorService.shutdownNow()}}.`
},
{
  id: 'qz-concurrency-008', topic: 'concurrency',
  q: `{{new ThreadPoolExecutor(2, 4, 60, SECONDS, new ArrayBlockingQueue<>(10))}} (rejection policy mặc định). Gần như cùng lúc, bạn submit **20 task chạy rất lâu**. Kết quả?`,
  options: [
    `2 thread chạy, 10 task trong queue, 8 task bị từ chối vì chỉ tạo thêm thread khi queue rỗng`,
    `4 thread chạy, 16 task xếp hàng vì queue tự mở rộng khi đầy`,
    `4 thread chạy, 10 task nằm trong queue, 6 task bị từ chối với RejectedExecutionException`,
    `2 thread chạy, 18 task chờ, không task nào bị từ chối vì maximumPoolSize chỉ là gợi ý`
  ],
  answer: 2,
  explain: `**Đáp án đúng: 4 chạy, 10 xếp hàng, 6 bị từ chối.**

### Vì sao đúng
Thứ tự xử lý khi {{execute}} một task:
1. Số thread < **corePoolSize** → tạo thread mới (task 1–2).
2. Đủ core → **đưa vào queue** (task 3–12, queue đầy 10).
3. Queue đầy và số thread < **maximumPoolSize** → tạo thêm thread (task 13–14, tổng 4 thread).
4. Queue đầy và đã đủ max → **rejection policy**; mặc định {{AbortPolicy}} ném {{RejectedExecutionException}} (task 15–20, 6 task).

### Vì sao các phương án còn lại sai
- **8 bị từ chối**: bỏ qua bước 3, thread vượt core được tạo khi queue **đầy**, không phải khi rỗng.
- **Queue tự mở rộng**: {{ArrayBlockingQueue}} có dung lượng cố định.
- **Không từ chối**: chỉ đúng với queue không giới hạn (như {{LinkedBlockingQueue()}} mặc định), khi đó max bị vô hiệu và không bao giờ có hơn 2 thread.

> Senior tip: thứ tự "core → queue → max" ngược trực giác nhiều người. Với {{Executors.newFixedThreadPool}} (queue không giới hạn), maximumPoolSize vô nghĩa và queue có thể phình tới OOM. Production: queue có giới hạn, đặt tên thread qua ThreadFactory, dùng {{CallerRunsPolicy}} để tạo backpressure, và expose metrics (active, queue size, rejected).`
},
{
  id: 'qz-concurrency-009', topic: 'concurrency',
  q: `Đoạn code sau in ra gì?
~~~java
CompletableFuture<Integer> f = CompletableFuture
    .<Integer>supplyAsync(() -> { throw new IllegalStateException("x"); })
    .thenApply(v -> v + 1)
    .exceptionally(ex -> -1);
System.out.println(f.join());
~~~`,
  options: [
    `Ném CompletionException tại join()`,
    `Ném IllegalStateException tại join()`,
    `In 0 vì thenApply bị bỏ qua và v mặc định bằng 0`,
    `In -1; thenApply bị bỏ qua, exceptionally nhận CompletionException bọc IllegalStateException`
  ],
  answer: 3,
  explain: `**Đáp án đúng: in -1.**

### Vì sao đúng
- {{supplyAsync}} hoàn tất **exceptionally**. Các stage phụ thuộc như {{thenApply}} **không chạy** mà truyền tiếp exception (được bọc trong {{CompletionException}}).
- {{exceptionally}} chỉ chạy khi stage trước lỗi, biến lỗi thành giá trị bình thường (-1). Future cuối cùng hoàn tất bình thường → {{join()}} trả về -1.
- Lưu ý {{ex}} ở đây thường là {{CompletionException}} với {{getCause()}} là IllegalStateException; code xử lý lỗi theo kiểu cần unwrap.

### Vì sao các phương án còn lại sai
- **CompletionException tại join**: chỉ xảy ra nếu không có exceptionally/handle phục hồi.
- **IllegalStateException tại join**: {{join}} bọc trong CompletionException, {{get}} bọc trong ExecutionException; không ném trực tiếp exception gốc.
- **In 0**: không có giá trị mặc định; thenApply hoàn toàn bị bỏ qua.

> Senior tip: {{supplyAsync}} không truyền executor sẽ chạy trên {{ForkJoinPool.commonPool()}}; với I/O luôn truyền executor riêng. Dùng {{handle}}/{{whenComplete}} để log lỗi kèm context, và {{orTimeout}}/{{completeOnTimeout}} (Java 9) để không treo vô hạn khi gọi service ngoài.`
},
{
  id: 'qz-concurrency-010', topic: 'concurrency',
  q: `Service Java 21 bật virtual threads. Một method bọc lời gọi JDBC chậm (200 ms) trong khối {{synchronized}}. Khi tải cao, throughput sụt mạnh, thread dump cho thấy tất cả carrier thread đều bận dù CPU thấp. Nguyên nhân và cách xử lý hợp lý nhất?`,
  options: [
    `Pinning: virtual thread block bên trong synchronized không unmount được khỏi carrier (Java 21–23); thay bằng ReentrantLock hoặc nâng lên Java 24+ (JEP 491)`,
    `Virtual thread không hỗ trợ JDBC; phải chuyển sang R2DBC`,
    `Số virtual thread bị giới hạn bằng số core; cần tăng -Xss`,
    `synchronized trên virtual thread gây deadlock nên JVM tự chuyển sang platform thread`
  ],
  answer: 0,
  explain: `**Đáp án đúng: pinning do synchronized.**

### Vì sao đúng
Virtual thread chạy trên một số ít **carrier thread** (mặc định bằng số core, ForkJoinPool riêng). Khi gặp thao tác block (socket I/O, lock), virtual thread bình thường **unmount** để carrier phục vụ thread khác. Nhưng ở Java 21–23, nếu đang giữ monitor của {{synchronized}} thì nó bị **pin**: carrier bị chiếm suốt 200 ms. Với 8 carrier, hệ thống chỉ còn xử lý được ~8 request I/O cùng lúc → throughput sụt dù CPU rảnh.
Cách xử lý: thay {{synchronized}} quanh I/O bằng {{ReentrantLock}} (không pin), hoặc nâng lên **Java 24 (JEP 491)**, nơi synchronized không còn pin trong hầu hết trường hợp. Phát hiện bằng JFR event {{jdk.VirtualThreadPinned}}.

### Vì sao các phương án còn lại sai
- **Không hỗ trợ JDBC**: JDBC chạy tốt trên virtual thread; vấn đề nằm ở lock (một số driver cũ dùng synchronized bên trong, cần bản mới).
- **Tăng -Xss**: virtual thread không bị giới hạn theo số core, và -Xss chỉnh stack platform thread, không liên quan.
- **Tự chuyển sang platform thread**: JVM không làm vậy; pinning không phải deadlock.

> Senior tip: virtual thread không tăng giới hạn của tài nguyên phía sau: connection pool 20 kết nối vẫn chỉ cho 20 query song song. Hãy giữ pool hợp lý, đo bằng JFR, và nhớ ThreadLocal nặng trên hàng triệu virtual thread sẽ tốn bộ nhớ.`
},
{
  id: 'qz-concurrency-011', topic: 'concurrency',
  q: `Vì sao cài đặt double-checked locking sau **bị lỗi** theo Java Memory Model?
~~~java
class Config {
    private static Config instance;           // thiếu volatile
    private final Map<String, String> props;  // nạp trong constructor
    static Config get() {
        if (instance == null) {
            synchronized (Config.class) {
                if (instance == null) instance = new Config();
            }
        }
        return instance;
    }
}
~~~`,
  options: [
    `Có thể tạo hai instance vì synchronized không chặn được thread thứ hai`,
    `Thread đọc ở lần kiểm tra đầu (ngoài synchronized) có thể thấy instance khác null nhưng các field non-final của object chưa được ghi xong`,
    `Gây deadlock nếu constructor ném exception`,
    `Không lỗi trên x86 nên không cần sửa`
  ],
  answer: 1,
  explain: `**Đáp án đúng: có thể thấy object chưa khởi tạo xong.**

### Vì sao đúng
{{instance = new Config()}} gồm: cấp phát bộ nhớ, chạy constructor (ghi field), gán tham chiếu. Compiler/CPU được phép **sắp xếp lại** sao cho tham chiếu được publish trước khi các ghi trong constructor hiển thị với thread khác. Thread B đọc {{instance}} **ngoài** synchronized nên không có happens-before với thread A → có thể thấy object "nửa vời".
Sửa: khai báo {{private static volatile Config instance}} (ghi volatile happens-before đọc volatile), hoặc dùng holder idiom/enum.
(Ở ví dụ này {{props}} là final nên được JMM bảo đảm nhờ final field semantics; nhưng mọi field non-final và object mà chúng trỏ tới thì không.)

### Vì sao các phương án còn lại sai
- **Hai instance**: lần kiểm tra thứ hai bên trong synchronized đã chặn chuyện này.
- **Deadlock**: exception sẽ thoát khỏi synchronized và nhả lock bình thường.
- **x86 an toàn**: x86 có memory model mạnh hơn nhưng **JIT vẫn được sắp xếp lại** lệnh; và code phải đúng trên ARM (Graviton, Apple Silicon).

> Senior tip: cách đơn giản và đúng nhất là **holder idiom** (một {{private static class Holder}} chứa {{static final Config I = new Config();}}): class init do JVM đảm bảo thread-safe và lazy. Trong Spring, bean singleton đã giải quyết việc này cho bạn.`
},
{
  id: 'qz-concurrency-012', topic: 'concurrency',
  q: `Worker sau xử lý message từ queue. Khi gọi {{executor.shutdownNow()}}, worker **không dừng**. Vì sao và sửa thế nào?
~~~java
while (true) {
    try {
        Task t = queue.take();
        handle(t);
    } catch (InterruptedException e) {
        log.warn("interrupted", e);
    }
}
~~~`,
  options: [
    `shutdownNow chỉ huỷ task chưa chạy, không bao giờ tác động lên task đang chạy`,
    `queue.take() không phản hồi interrupt, phải dùng poll() có timeout`,
    `catch nuốt InterruptedException (cờ interrupt đã bị xoá khi exception được ném) rồi lặp tiếp; phải gọi Thread.currentThread().interrupt() và thoát vòng lặp`,
    `Cần gọi Thread.stop() vì interrupt chỉ là gợi ý`
  ],
  answer: 2,
  explain: `**Đáp án đúng: InterruptedException bị nuốt.**

### Vì sao đúng
{{shutdownNow()}} gọi {{interrupt()}} trên các worker thread. {{queue.take()}} đang block sẽ ném {{InterruptedException}} và **xoá cờ interrupt**. Code catch chỉ log rồi quay lại vòng lặp → {{take()}} block tiếp như chưa có gì xảy ra. Sửa:
~~~java
} catch (InterruptedException e) {
    Thread.currentThread().interrupt(); // khôi phục cờ cho code phía trên
    return;                             // thoát để thread kết thúc
}
~~~

### Vì sao các phương án còn lại sai
- **Không tác động task đang chạy**: shutdownNow interrupt các thread đang chạy task; task có dừng hay không phụ thuộc vào việc nó phản hồi interrupt.
- **take() không phản hồi interrupt**: {{take()}} chính là method có thể bị interrupt (khai báo throws InterruptedException).
- **Thread.stop()**: không an toàn (nhả mọi lock giữa chừng); từ Java 20 nó luôn ném {{UnsupportedOperationException}}.

> Senior tip: quy tắc: hoặc **ném tiếp** InterruptedException, hoặc **khôi phục cờ**; không bao giờ nuốt. Pod Kubernetes không tắt được trong {{terminationGracePeriodSeconds}} rồi bị SIGKILL (mất message đang xử lý) thường do đúng lỗi này.`
},
{
  id: 'qz-concurrency-013', topic: 'concurrency', multi: true,
  q: `Biến đếm số request được **16 thread** cùng tăng, mỗi thread 1 triệu lần; chỉ đọc tổng sau khi mọi thread đã {{join()}}. Những cách nào cho **kết quả đúng** 16.000.000? (Chọn 3)`,
  options: [
    `volatile long count; mỗi thread gọi count++`,
    `AtomicLong count; mỗi thread gọi count.incrementAndGet()`,
    `LongAdder count; mỗi thread gọi count.increment(), cuối cùng đọc count.sum()`,
    `long count; mỗi lần tăng đặt trong synchronized (LOCK) { count++; } với LOCK là một object static dùng chung`,
    `long count; mỗi thread đặt count++ trong synchronized (Thread.currentThread())`,
    `ThreadLocal<Long> count; mỗi thread tăng giá trị của mình, main đọc count.get()`
  ],
  answer: [1, 2, 3],
  explain: `**Đáp án đúng: AtomicLong, LongAdder, synchronized trên một lock chung.**

### Vì sao đúng
{{count++}} gồm 3 bước đọc–cộng–ghi; hai thread xen kẽ sẽ mất cập nhật. Cần **nguyên tử**:
- {{AtomicLong.incrementAndGet}}: vòng CAS (lock-free).
- {{LongAdder}}: chia thành nhiều cell, mỗi thread thường tăng cell riêng nên ít tranh chấp; {{sum()}} sau khi join cho kết quả chính xác. Nhanh nhất khi tranh chấp cao.
- {{synchronized}} trên **cùng một** object: loại trừ lẫn nhau và có happens-before.

### Vì sao các phương án còn lại sai
- **volatile + count++**: volatile chỉ đảm bảo visibility, không làm đọc–cộng–ghi thành nguyên tử → mất cập nhật.
- **synchronized(Thread.currentThread())**: mỗi thread khoá object **khác nhau** nên không loại trừ nhau gì cả.
- **ThreadLocal**: mỗi thread có bản riêng; main chỉ đọc được bản của main (null), các bản kia không được gộp.

> Senior tip: metrics counter (Micrometer) dùng LongAdder-style vì ghi nhiều, đọc ít. Nhưng LongAdder không thay được AtomicLong khi cần giá trị chính xác **ngay sau mỗi lần tăng** (sinh id, rate limit). Và mọi giải pháp này chỉ đúng trong **một JVM**; nhiều instance thì cần DB/Redis INCR.`
},
{
  id: 'qz-concurrency-014', topic: 'concurrency',
  q: `Cache dùng {{ConcurrentHashMap.computeIfAbsent(key, k -> callRemoteApi(k))}}, mỗi lần gọi API mất ~2 giây. Khi tải cao, cả những request với **key khác** (đã có sẵn trong map hoặc chưa) cũng bị chậm theo. Giải thích nào đúng nhất?`,
  options: [
    `ConcurrentHashMap khoá toàn bộ map trong suốt compute`,
    `ConcurrentHashMap chia 16 segment cố định như Java 7, nên 1/16 số key bị chặn`,
    `computeIfAbsent luôn gọi mapping function kể cả khi key đã tồn tại`,
    `Mapping function chạy trong khi giữ lock của bin; các thao tác cập nhật trên cùng bin (và việc resize) phải chờ 2 giây, nên mapping function phải ngắn`
  ],
  answer: 3,
  explain: `**Đáp án đúng: mapping function chạy khi đang giữ lock của bin.**

### Vì sao đúng
Từ Java 8, ConcurrentHashMap khoá ở mức **bin** (synchronized trên node đầu bin, CAS khi bin rỗng). {{computeIfAbsent}} đảm bảo mapping function chạy **nguyên tử, tối đa một lần** cho mỗi key, nên nó phải giữ lock bin trong suốt lúc function chạy. Javadoc ghi rõ: các cập nhật khác có thể bị chặn trong lúc tính, nên function phải **ngắn và đơn giản**. Key khác rơi vào cùng bin, hoặc thao tác resize bảng, đều phải chờ 2 giây.
Sửa: cache {{CompletableFuture}} ({{computeIfAbsent(k, x -> CompletableFuture.supplyAsync(..., ioPool))}}) để function trả về ngay, hoặc dùng Caffeine {{AsyncLoadingCache}}.

### Vì sao các phương án còn lại sai
- **Khoá toàn bộ map**: chỉ bin liên quan bị khoá; đọc ({{get}}) không khoá.
- **16 segment**: đó là thiết kế Java 7, đã bỏ từ Java 8.
- **Luôn gọi function**: function chỉ chạy khi key chưa có (hoặc value null).

> Senior tip: thêm một bẫy: gọi {{computeIfAbsent}} **lồng** trên cùng map trong mapping function có thể ném {{IllegalStateException("Recursive update")}} hoặc treo. Không gọi I/O, không sửa chính map bên trong compute/merge.`
},
{
  id: 'qz-concurrency-015', topic: 'concurrency',
  q: `Một endpoint dùng {{orders.parallelStream().map(this::callRemoteApi)}} (mỗi lời gọi I/O 200 ms). Khi 50 request đồng thời, **toàn bộ ứng dụng** chậm lại, kể cả các chỗ dùng {{CompletableFuture.supplyAsync(...)}} không truyền executor. Vì sao?`,
  options: [
    `Cả hai cùng dùng ForkJoinPool.commonPool (mặc định số core trừ 1 thread), các thread này bị chặn bởi I/O nên mọi tác vụ khác phải xếp hàng`,
    `Parallel stream tạo một thread mới cho mỗi phần tử làm cạn bộ nhớ`,
    `commonPool không giới hạn số thread nên context switch quá nhiều`,
    `parallelStream luôn sắp xếp kết quả theo thứ tự nên giữ một khoá toàn cục`
  ],
  answer: 0,
  explain: `**Đáp án đúng: tranh chấp ForkJoinPool.commonPool.**

### Vì sao đúng
Parallel stream và {{CompletableFuture.*Async}} không có executor đều chạy trên **commonPool** dùng chung toàn JVM, kích thước mặc định {{availableProcessors() - 1}} (trên pod 2 vCPU chỉ còn 1 thread!). Pool này được thiết kế cho tác vụ **CPU-bound** ngắn. Gọi I/O 200 ms trong đó làm các worker bị block, mọi tác vụ khác dùng commonPool phải chờ.

### Vì sao các phương án còn lại sai
- **Một thread mỗi phần tử**: parallel stream chia việc qua work-stealing trên số thread cố định.
- **Không giới hạn**: ngược lại, commonPool rất nhỏ.
- **Khoá toàn cục để giữ thứ tự**: thứ tự được giữ bằng cách ghép kết quả theo cấu trúc chia (split), không cần khoá toàn cục.

> Senior tip: quy tắc: parallel stream chỉ cho tính toán CPU trên dữ liệu lớn, không I/O. Với I/O: executor riêng có giới hạn (hoặc virtual threads trên Java 21) kèm timeout. Có thể chỉnh {{-Djava.util.concurrent.ForkJoinPool.common.parallelism}}, nhưng đó là chữa triệu chứng.`
},
{
  id: 'qz-concurrency-016', topic: 'concurrency', multi: true,
  q: `Team chuẩn bị chuyển service I/O-bound sang virtual threads (Java 21+). Những phát biểu nào **đúng**? (Chọn 3)`,
  options: [
    `Không nên pool virtual thread; tạo mới cho mỗi task, ví dụ Executors.newVirtualThreadPerTaskExecutor()`,
    `Virtual thread giúp tăng tốc tác vụ CPU-bound như mã hoá, nén dữ liệu`,
    `Muốn giới hạn số truy cập đồng thời tới DB hay API đối tác, dùng Semaphore hoặc kích thước connection pool thay vì giới hạn số thread`,
    `Từ Java 24 (JEP 491), virtual thread block bên trong synchronized không còn pin carrier thread trong hầu hết trường hợp`,
    `ThreadLocal bị cấm dùng trong virtual thread`
  ],
  answer: [0, 2, 3],
  explain: `**Đáp án đúng: không pool, giới hạn bằng Semaphore/pool tài nguyên, và JEP 491.**

### Vì sao đúng
- Virtual thread rất rẻ (vài trăm byte đến vài KB stack trên heap), tạo hàng triệu cái được. Pool tồn tại để tiết kiệm thread đắt, điều không còn cần thiết; pool virtual thread còn mang theo ThreadLocal cũ giữa các task.
- Không giới hạn số thread nữa, nên giới hạn đồng thời phải đặt ở **tài nguyên**: {{Semaphore}}, HikariCP {{maximumPoolSize}}, bulkhead.
- JEP 491 (Java 24) cho virtual thread unmount khi block trong {{synchronized}}; vẫn còn pin khi chạy native code/foreign function.

### Vì sao các phương án còn lại sai
- **Tăng tốc CPU-bound**: virtual thread không thêm CPU; chúng chỉ giúp khi thread **chờ** I/O. CPU-bound vẫn bị giới hạn bởi số core.
- **Cấm ThreadLocal**: ThreadLocal vẫn hoạt động; chỉ là tốn bộ nhớ khi có hàng triệu thread. Java 25 có {{ScopedValue}} chính thức làm phương án thay thế.

> Senior tip: đo trước và sau bằng load test: lợi ích lớn nhất là code blocking đơn giản đạt throughput gần reactive. Theo dõi JFR {{jdk.VirtualThreadPinned}} và thư viện còn synchronized quanh I/O khi chạy Java 21.`
},
{
  id: 'qz-concurrency-017', topic: 'concurrency',
  q: `Consumer sau thỉnh thoảng ném {{NoSuchElementException}} ở {{queue.remove()}} khi có nhiều consumer. Nguyên nhân?
~~~java
synchronized (lock) {
    if (queue.isEmpty()) {
        lock.wait();
    }
    Item item = queue.remove();
}
~~~`,
  options: [
    `wait() không nhả lock nên producer không thêm được phần tử`,
    `Dùng if thay vì while: thread có thể thức dậy (spurious wakeup, hoặc consumer khác đã lấy mất phần tử) khi queue vẫn rỗng; phải kiểm tra lại điều kiện trong vòng lặp`,
    `Phải dùng notify() thay cho notifyAll() để chỉ đánh thức đúng một consumer`,
    `Cần khai báo queue là volatile`
  ],
  answer: 1,
  explain: `**Đáp án đúng: dùng if thay vì while.**

### Vì sao đúng
Khi được đánh thức, thread phải **giành lại lock** trước khi chạy tiếp. Trong khoảng đó, một consumer khác có thể đã lấy mất phần tử. Ngoài ra JVM cho phép **spurious wakeup** (thức dậy không có notify). Vì vậy điều kiện phải được kiểm tra lại:
~~~java
while (queue.isEmpty()) lock.wait();
~~~
Javadoc của {{Object.wait}} yêu cầu luôn dùng wait trong vòng lặp.

### Vì sao các phương án còn lại sai
- **wait không nhả lock**: wait **nhả** monitor trong lúc chờ, rồi giành lại khi thức.
- **notify thay notifyAll**: không loại được spurious wakeup, và với nhiều loại thread chờ (producer/consumer chung lock) còn dễ đánh thức nhầm gây treo.
- **volatile**: mọi truy cập đã nằm trong synchronized nên visibility đã được đảm bảo; lỗi nằm ở logic điều kiện.

> Senior tip: trong code mới, hầu như không cần tự viết wait/notify: dùng {{BlockingQueue.take()}}/{{poll(timeout)}} (đã xử lý đúng mọi trường hợp), hoặc {{ReentrantLock}} + {{Condition}} khi cần nhiều điều kiện chờ riêng (notFull/notEmpty).`
},
{
  id: 'qz-concurrency-018', topic: 'concurrency',
  q: `Cấu hình feature flag được đọc khoảng 10.000 lần/giây từ nhiều thread, và chỉ thay đổi vài lần mỗi ngày (reload toàn bộ từ DB). Cách nào **đơn giản và hiệu quả nhất** để đọc luôn thấy bản nhất quán?`,
  options: [
    `Đặt synchronized trên mọi getter và method reload`,
    `ReentrantReadWriteLock fairness = true, mỗi lần đọc lấy read lock`,
    `Giữ một object cấu hình immutable trong biến volatile (hoặc AtomicReference); reload bằng cách tạo object mới rồi thay tham chiếu`,
    `Dùng Collections.synchronizedMap và cập nhật từng key khi reload`
  ],
  answer: 2,
  explain: `**Đáp án đúng: immutable snapshot + volatile reference (copy-on-write).**

### Vì sao đúng
- Đọc chỉ là một lần **đọc volatile**, không khoá, không CAS → gần như miễn phí, scale tuyến tính theo số core.
- Object immutable được publish qua volatile nên thread đọc thấy **trọn vẹn** bản mới hoặc bản cũ, không bao giờ thấy trạng thái nửa cũ nửa mới.
~~~java
private volatile Config current = Config.load();
void reload() { current = Config.load(); } // thay nguyên object
boolean enabled(String f) { return current.flags().contains(f); }
~~~

### Vì sao các phương án còn lại sai
- **synchronized mọi getter**: đúng nhưng mọi lần đọc tranh chấp một monitor, thành nút cổ chai không cần thiết.
- **ReadWriteLock**: read lock vẫn phải CAS trên một bộ đếm dùng chung (cache line nóng), và fairness làm chậm thêm; phức tạp hơn mà chậm hơn.
- **synchronizedMap cập nhật từng key**: thread đọc có thể thấy cấu hình **lẫn lộn** (một số key mới, một số cũ) giữa lúc reload.

> Senior tip: đây là pattern dùng trong nhiều thư viện (routing table, config client). Nếu reload cần dựa trên bản cũ thì dùng {{AtomicReference.updateAndGet}}. Chỉ cân nhắc {{StampedLock}} optimistic read khi dữ liệu lớn không thể copy mỗi lần ghi.`
},
{
  id: 'qz-concurrency-019', topic: 'concurrency',
  q: `Theo Java Memory Model, đoạn code sau in ra gì?
~~~java
int[] data = new int[1];             // không volatile, không synchronized
Thread t = new Thread(() -> data[0] = 42);
t.start();
t.join();
System.out.println(data[0]);
~~~`,
  options: [
    `Có thể in 0 vì data không volatile`,
    `Có thể in 0 khi chạy trên ARM do memory model yếu hơn x86`,
    `Lỗi biên dịch: data phải effectively final`,
    `Luôn in 42, vì mọi hành động trong t happens-before việc t.join() trả về`
  ],
  answer: 3,
  explain: `**Đáp án đúng: luôn in 42.**

### Vì sao đúng
JMM định nghĩa các cạnh **happens-before** cố định, không cần volatile:
- {{t.start()}} happens-before mọi hành động trong t (t thấy mọi thứ main đã làm trước start).
- Mọi hành động trong t happens-before việc **{{t.join()}} trả về** thành công ở thread khác.
Vì vậy sau join, main chắc chắn thấy {{data[0] = 42}}.

### Vì sao các phương án còn lại sai
- **Có thể in 0**: volatile không cần thiết khi đã có happens-before từ join.
- **ARM**: JMM là đặc tả độc lập phần cứng; JVM chèn memory barrier phù hợp để join giữ đúng đảm bảo trên mọi kiến trúc.
- **Effectively final**: biến {{data}} (tham chiếu mảng) không bị gán lại nên effectively final; lambda sửa phần tử mảng là hợp lệ.

> Senior tip: các cạnh happens-before hay dùng: unlock → lock cùng monitor, ghi volatile → đọc volatile, {{start}}, {{join}}, submit task vào executor → task chạy, task hoàn tất → {{Future.get()}} trả về, và đưa vào/lấy ra từ {{BlockingQueue}}. Code dùng các công cụ này không cần thêm volatile cho dữ liệu đi kèm.`
},
{
  id: 'qz-concurrency-020', topic: 'concurrency', multi: true,
  q: `Batch job đối soát chạy nhiều pha, mỗi pha có N worker. Bạn chọn công cụ đồng bộ. Những phát biểu nào **đúng**? (Chọn 2)`,
  options: [
    `CountDownLatch không reset được; đếm về 0 thì dùng xong, cần lượt mới phải tạo latch mới`,
    `CyclicBarrier tái sử dụng được: sau khi đủ parties tới barrier, nó tự reset cho pha tiếp theo và có thể chạy barrierAction`,
    `Semaphore chỉ cho phép đúng thread đã acquire gọi release`,
    `CountDownLatch.await() trả về ngay khi count giảm đi 1`,
    `CyclicBarrier là lựa chọn tốt nhất khi số worker tham gia thay đổi động giữa các pha`
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: CountDownLatch dùng một lần; CyclicBarrier tái sử dụng được.**

### Vì sao đúng
- {{CountDownLatch}}: một hay nhiều thread {{await()}} cho tới khi count về 0; count không thể tăng lại → dùng cho sự kiện **một lần** (chờ N service khởi động, chờ N task xong).
- {{CyclicBarrier(parties, barrierAction)}}: N thread chờ **lẫn nhau** tại điểm hẹn; khi đủ, chạy barrierAction (ví dụ gộp kết quả pha) rồi tự reset cho pha sau.

### Vì sao các phương án còn lại sai
- **Semaphore**: không có khái niệm owner; thread bất kỳ đều release được (vì thế release thừa sẽ làm tăng số permit, một bug thật).
- **await trả về khi giảm 1**: chỉ trả về khi count **bằng 0** (hoặc bị interrupt/timeout).
- **Số worker thay đổi động**: CyclicBarrier có số parties cố định; trường hợp đó dùng {{Phaser}} ({{register}}/{{arriveAndDeregister}}).

> Senior tip: luôn dùng phiên bản có timeout ({{await(30, SECONDS)}}) trong production; một worker chết làm cả barrier treo mãi (barrier chuyển sang trạng thái broken khi một thread bị interrupt/timeout). Với workflow phức tạp, {{CompletableFuture.allOf}} hoặc structured concurrency thường dễ đọc hơn.`
},

// ===================== jvm =====================
{
  id: 'qz-jvm-007', topic: 'jvm',
  q: `Pod Kubernetes có memory limit 2 GiB, JVM chạy với {{-Xmx2g}}. Pod liên tục restart, trạng thái ghi {{OOMKilled}} (exit code 137), nhưng log ứng dụng **không có** OutOfMemoryError và heap used chỉ khoảng 1.5 GB. Nguyên nhân khả dĩ nhất?`,
  options: [
    `Tổng bộ nhớ process (heap + metaspace + thread stack + code cache + direct buffer + cấu trúc GC) vượt limit, kernel OOM killer giết process; nên đặt heap khoảng 70–75% limit`,
    `Heap bị leak; tăng -Xmx lên 2.5g sẽ hết`,
    `Kubernetes giết pod vì GC pause quá dài làm liveness probe thất bại`,
    `JVM không nhận biết container nên đọc RAM của cả node`
  ],
  answer: 0,
  explain: `**Đáp án đúng: RSS của cả process vượt limit, kernel OOM killer can thiệp.**

### Vì sao đúng
{{-Xmx}} chỉ giới hạn **heap**. Process JVM còn dùng bộ nhớ native: metaspace, thread stack (~1 MB × số thread), code cache (JIT), direct ByteBuffer (Netty), cấu trúc của GC (G1 remembered set), malloc của thư viện native. Khi tổng RSS chạm limit của cgroup, **kernel** gửi SIGKILL → exit 137, JVM không có cơ hội ghi OutOfMemoryError hay heap dump.
Sửa: {{-XX:MaxRAMPercentage=70..75}} (để lại headroom 25–30%), giới hạn {{-XX:MaxDirectMemorySize}}, {{-XX:MaxMetaspaceSize}}, và đo bằng Native Memory Tracking.

### Vì sao các phương án còn lại sai
- **Tăng Xmx**: làm tình hình tệ hơn vì để lại ít chỗ hơn cho bộ nhớ native.
- **Liveness probe**: probe thất bại cũng gây restart nhưng trạng thái là liveness failure, không phải {{OOMKilled}}.
- **Không nhận biết container**: JDK 10+ (và 8u191+) đã container-aware; hơn nữa {{-Xmx}} tường minh đã ghi đè mọi tính toán tự động.

> Senior tip: so sánh {{kubectl top pod}} (RSS) với heap used trong Grafana: chênh lệch vài trăm MB tới hơn 1 GB là bình thường. Baseline tốt: limit = request cho memory, heap 70–75%, và alert khi RSS > 90% limit.`
},
{
  id: 'qz-jvm-008', topic: 'jvm',
  q: `App server chạy nhiều ứng dụng, mỗi lần **redeploy nóng** (không restart JVM) thì Metaspace tăng thêm, sau khoảng 10 lần thì gặp {{java.lang.OutOfMemoryError: Metaspace}}. Nguyên nhân khả dĩ nhất?`,
  options: [
    `Heap quá nhỏ; cần tăng -Xmx`,
    `ClassLoader leak: ClassLoader của bản deploy cũ vẫn bị tham chiếu (ThreadLocal, JDBC driver đã đăng ký, thread chưa dừng…) nên toàn bộ class của nó không thể unload`,
    `String pool đầy vì intern quá nhiều chuỗi`,
    `Thread stack quá lớn; cần giảm -Xss`
  ],
  answer: 1,
  explain: `**Đáp án đúng: ClassLoader leak.**

### Vì sao đúng
Một class chỉ được unload khi **ClassLoader** đã load nó không còn reachable. Mỗi lần redeploy, server tạo ClassLoader mới và nạp lại toàn bộ class vào Metaspace. Nếu còn **một tham chiếu** từ bên ngoài tới bất kỳ object/class nào của bản cũ, cả ClassLoader cũ cùng hàng nghìn class bị giữ lại. Thủ phạm hay gặp:
- {{ThreadLocal}} trên thread của server giữ object của app cũ.
- JDBC driver đăng ký vào {{DriverManager}} (nằm ở ClassLoader cha).
- Thread do app tạo (scheduler, timer) không được dừng.
- Shutdown hook, MBean, cache static ở thư viện dùng chung.

### Vì sao các phương án còn lại sai
- **Tăng Xmx**: Metaspace là vùng **native**, tách khỏi heap; Xmx không ảnh hưởng.
- **String pool**: từ Java 7 String pool nằm trên **heap**, đầy thì ra "Java heap space".
- **Giảm -Xss**: stack thread không nằm trong Metaspace; lỗi liên quan sẽ là "unable to create native thread" hay StackOverflowError.

> Senior tip: chẩn đoán: {{jcmd <pid> VM.classloader_stats}}, heap dump → MAT "Duplicate Classes" và Path to GC Roots của ClassLoader cũ. Đặt {{-XX:MaxMetaspaceSize}} để lỗi lộ sớm thay vì ăn hết RAM. Đây là một lý do mô hình container "1 app/1 JVM, deploy = restart" thay thế redeploy nóng.`
},
{
  id: 'qz-jvm-009', topic: 'jvm',
  q: `GC log (JDK 17, G1, {{-Xmx4g}}) của một service trong giờ cao điểm:
~~~text
[120.512s][info][gc] GC(311) Pause Young (Normal) (G1 Evacuation Pause) 3890M->3850M(4096M) 45.123ms
[121.020s][info][gc] GC(312) Pause Young (Normal) (G1 Evacuation Pause) 3990M->3960M(4096M) 52.871ms
[121.433s][info][gc] GC(313) Pause Full (G1 Compaction Pause) 4090M->3980M(4096M) 2843.552ms
~~~
Nhận định nào đúng nhất?`,
  options: [
    `Young GC quá thường xuyên; tăng kích thước young gen là đủ`,
    `Full GC là bình thường với G1 và sẽ tự hết sau khi warm-up`,
    `Live set gần chạm max heap: mỗi lần GC chỉ thu hồi rất ít và dẫn tới Full GC gần 3 giây; nghi memory leak hoặc heap quá nhỏ, cần histogram/heap dump`,
    `Pause 45 ms là quá dài, nên chuyển sang Serial GC`
  ],
  answer: 2,
  explain: `**Đáp án đúng: live set gần chạm max heap.**

### Vì sao đúng
Đọc từng dòng theo dạng {{trước->sau(tổng)}}:
- Young GC chỉ giảm 40 MB và 30 MB: hầu hết object còn sống, heap **sau GC** vẫn ở ~3.85–3.96 GB / 4 GB.
- Full GC (đơn luồng xử lý cả heap, stop-the-world 2.8 giây) cũng chỉ còn 3.98 GB → **live data thật sự** chiếm gần hết heap.
Đây là mẫu hình của **memory leak** (live set tăng dần theo thời gian) hoặc heap không đủ cho tải. Bước tiếp: so sánh {{jcmd <pid> GC.class_histogram}} hai thời điểm, lấy heap dump phân tích bằng MAT. Sắp tới sẽ là OutOfMemoryError: Java heap space.

### Vì sao các phương án còn lại sai
- **Tăng young gen**: vấn đề nằm ở object sống lâu ở old gen, không phải tần suất young GC.
- **Full GC bình thường**: với G1, Full GC là **fallback khi thất bại** (không evacuate được), luôn là tín hiệu xấu.
- **Serial GC**: pause của Serial trên heap 4 GB còn dài hơn nhiều.

> Senior tip: chỉ số quan trọng nhất trong GC log là **heap sau GC** theo thời gian (đường đáy răng cưa). Đường đáy dốc lên là leak; đường đáy phẳng nhưng cao thì cần thêm heap hoặc giảm dữ liệu giữ trong bộ nhớ. Bật luôn {{-XX:+HeapDumpOnOutOfMemoryError}} để có bằng chứng.`
},
{
  id: 'qz-jvm-010', topic: 'jvm',
  q: `Đồng nghiệp viết benchmark bằng vòng {{for}} 1 triệu lần + {{System.nanoTime()}}, kết luận method A nhanh hơn B **100 lần** sau vài nghìn vòng đầu. Trên production không thấy khác biệt. Giải thích khả dĩ nhất?`,
  options: [
    `System.nanoTime không chính xác dưới mili giây trên Linux`,
    `GC chạy trong lúc benchmark làm A nhanh hơn`,
    `Production chạy ở interpreter, không có JIT`,
    `JIT đã tối ưu benchmark: kết quả của A không được dùng nên bị loại bỏ (dead code elimination), cộng với warm-up và OSR khác nhau; phải đo bằng JMH và trả kết quả qua Blackhole`
  ],
  answer: 3,
  explain: `**Đáp án đúng: JIT tối ưu bỏ phép tính (dead code elimination) và lỗi warm-up.**

### Vì sao đúng
Sau khi vòng lặp nóng, C2 biên dịch nó (qua **OSR**, on-stack replacement) và có thể:
- **Dead code elimination**: kết quả của A không được dùng → loại bỏ cả lời gọi → "nhanh" gần như 0.
- **Constant folding/inlining**: input cố định nên tính sẵn.
- Đo cả giai đoạn interpreter/C1 cho B nhưng chỉ đo C2 cho A (thứ tự chạy khác nhau).
**JMH** xử lý các bẫy này: fork JVM riêng, warm-up iterations, {{Blackhole.consume()}} để kết quả không bị loại bỏ, thống kê sai số.

### Vì sao các phương án còn lại sai
- **nanoTime không chính xác**: nanoTime có độ phân giải tốt (cỡ chục ns) trên Linux; sai số không thể tạo ra chênh lệch 100 lần.
- **GC làm A nhanh hơn**: GC chỉ làm chậm phép đo khi nó chạy, không làm code nhanh hơn.
- **Production không có JIT**: HotSpot luôn bật tiered JIT mặc định.

> Senior tip: tối ưu hiệu năng luôn bắt đầu bằng **profiling production** (async-profiler, JFR) để tìm hot path thật, rồi mới viết microbenchmark JMH để so sánh phương án. Kết quả microbenchmark cũng cần kiểm chứng lại bằng load test end-to-end.`
},
{
  id: 'qz-jvm-011', topic: 'jvm',
  q: `Team xây cache nội bộ ~2 GB bằng {{SoftReference}} vì "khi thiếu bộ nhớ GC sẽ tự dọn". Production thấy heap luôn gần đầy, GC chạy liên tục, latency xấu và khó dự đoán. Vì sao?`,
  options: [
    `SoftReference chỉ bị dọn khi heap chịu áp lực cao, nên heap luôn gần đầy và GC phải làm việc liên tục; cache không có chính sách eviction rõ ràng. Nên dùng cache giới hạn kích thước như Caffeine`,
    `SoftReference bị thu hồi ngay ở mỗi lần young GC nên cache luôn rỗng`,
    `SoftReference nằm ngoài heap nên GC không kiểm soát được`,
    `Phải dùng PhantomReference cho cache vì get() nhanh hơn`
  ],
  answer: 0,
  explain: `**Đáp án đúng: soft reference giữ heap luôn đầy, eviction không kiểm soát được.**

### Vì sao đúng
HotSpot chỉ xoá SoftReference khi **cần bộ nhớ**, theo heuristic dựa trên thời gian truy cập gần nhất và lượng heap trống ({{-XX:SoftRefLRUPolicyMSPerMB}}). Hệ quả:
- Cache phình tới lấp đầy heap → GC chạy thường xuyên, mỗi lần lại phải xử lý hàng triệu reference object.
- Khi bị dọn thì dọn **hàng loạt** cùng lúc → hit rate rơi tự do, thundering herd xuống DB.
- Không có TTL, không biết dọn cái nào trước.
Cache giới hạn kích thước/TTL (Caffeine {{maximumSize}}, {{expireAfterWrite}}) cho hành vi ổn định và đo được.

### Vì sao các phương án còn lại sai
- **Bị thu hồi ở mỗi young GC**: đó là hành vi gần với **WeakReference** (bị dọn khi chỉ còn weak reachability).
- **Ngoài heap**: object được trỏ tới vẫn ở trên heap như mọi object khác.
- **PhantomReference**: {{get()}} **luôn trả về null**; phantom dùng để biết khi nào object bị thu hồi (dọn tài nguyên, như {{Cleaner}}), không dùng làm cache.

> Senior tip: WeakReference hợp cho metadata gắn với vòng đời object khác ({{WeakHashMap}} theo key). Với cache dữ liệu, luôn chọn eviction tường minh và theo dõi hit rate, eviction count qua metrics.`
},
{
  id: 'qz-jvm-012', topic: 'jvm',
  q: `Đoạn code sau in ra gì?
~~~java
class Config {
    static final int MAX = 10;          // compile-time constant
    static final Integer BOXED = 20;
    static { System.out.print("init "); }
}
// main:
System.out.print(Config.MAX + " ");
System.out.print(Config.BOXED + " ");
~~~`,
  options: [
    `init 10 20`,
    `10 init 20`,
    `10 20 (static block không bao giờ chạy)`,
    `init 10 init 20`
  ],
  answer: 1,
  explain: `**Đáp án đúng: "10 init 20".**

### Vì sao đúng
- {{MAX}} là **constant variable** (static final kiểu primitive/String, khởi tạo bằng hằng biểu thức). javac **inline** giá trị 10 vào class gọi, nên đọc MAX không chạm tới class Config → không kích hoạt khởi tạo.
- {{BOXED}} kiểu {{Integer}} không phải constant variable; đọc nó là truy cập static field thật ({{getstatic}}), một trong các điều kiện kích hoạt **class initialization** → static block chạy, in "init", rồi in 20.
- Class chỉ được khởi tạo một lần.

### Vì sao các phương án còn lại sai
- **init 10 20**: class không được khởi tạo khi chỉ đọc hằng số đã inline.
- **Không bao giờ chạy**: đọc BOXED có kích hoạt.
- **init hai lần**: static initializer chạy đúng một lần cho mỗi class/ClassLoader.

> Senior tip: inline hằng số có hệ quả thật: sửa {{MAX}} trong thư viện mà **không biên dịch lại** code gọi thì code gọi vẫn dùng giá trị cũ. Hằng số public trong thư viện chia sẻ nên là giá trị thật sự không đổi; giá trị cấu hình hãy đọc qua method.`
},
{
  id: 'qz-jvm-013', topic: 'jvm',
  q: `Thuật toán đệ quy duyệt cây danh mục sâu tới 100.000 tầng (dữ liệu xấu) gây {{StackOverflowError}}. Cách xử lý nào **bền vững nhất**?`,
  options: [
    `Tăng -Xmx để có thêm bộ nhớ cho stack`,
    `Bắt StackOverflowError rồi gọi lại đệ quy`,
    `Chuyển thành vòng lặp với ArrayDeque làm stack tường minh (và kiểm tra chu trình/độ sâu dữ liệu)`,
    `Viết lại theo dạng tail recursion để JIT tối ưu thành vòng lặp`
  ],
  answer: 2,
  explain: `**Đáp án đúng: chuyển sang vòng lặp với stack tường minh.**

### Vì sao đúng
Mỗi lời gọi đệ quy tạo một **stack frame** trên thread stack (kích thước cố định, mặc định ~512 KB–1 MB). 100.000 frame vượt giới hạn. Dùng {{ArrayDeque}} trên **heap** thì độ sâu chỉ bị giới hạn bởi heap, kiểm soát được:
~~~java
Deque<Node> stack = new ArrayDeque<>();
stack.push(root);
while (!stack.isEmpty()) {
    Node n = stack.pop();
    visit(n);
    n.children().forEach(stack::push);
}
~~~
Kèm theo nên kiểm tra **chu trình** (Set đã thăm) vì dữ liệu sâu bất thường thường do vòng lặp parent.

### Vì sao các phương án còn lại sai
- **Tăng -Xmx**: Xmx là heap; stack chỉnh bằng {{-Xss}} (cũng chỉ là hoãn lỗi với dữ liệu lớn hơn và tốn RAM cho mọi thread).
- **Bắt StackOverflowError**: là Error, trạng thái có thể đã hỏng giữa chừng (lock, finally chưa chạy hết); gọi lại vẫn tràn.
- **Tail recursion**: HotSpot **không** có tail-call optimization.

> Senior tip: đệ quy với đầu vào do người dùng/dữ liệu ngoài quyết định là lỗ hổng DoS (JSON lồng sâu, XML entity). Các parser hiện đại có giới hạn độ sâu (Jackson {{StreamReadConstraints.maxNestingDepth}}), hãy làm tương tự cho code của bạn.`
},
{
  id: 'qz-jvm-014', topic: 'jvm',
  q: `Service yêu cầu p99 < 10 ms, heap 32 GB, Java 21. Với G1, GC pause thỉnh thoảng 150–300 ms. Lựa chọn hợp lý nhất?`,
  options: [
    `Chuyển sang Parallel GC vì throughput cao nhất`,
    `Giảm heap xuống 4 GB để G1 pause ngắn hơn`,
    `Đặt -XX:MaxGCPauseMillis=1 cho G1 để pause luôn dưới 1 ms`,
    `Thử Generational ZGC (-XX:+UseZGC -XX:+ZGenerational trên Java 21): pause thường dưới 1 ms, đổi lại tốn thêm CPU và cần dư heap; xác nhận bằng load test`
  ],
  answer: 3,
  explain: `**Đáp án đúng: thử Generational ZGC và đo bằng load test.**

### Vì sao đúng
ZGC làm hầu hết công việc (mark, relocate) **đồng thời** với ứng dụng nhờ load barrier và colored pointer; pause thường dưới 1 ms và **không tăng theo kích thước heap**. Bản generational (JEP 439, Java 21) tách young/old nên thu hồi object ngắn hạn hiệu quả hơn, giảm CPU và rủi ro allocation stall so với ZGC cũ. Java 21 cần {{-XX:+ZGenerational}}; từ Java 23 là mặc định.
Trade-off: tốn CPU hơn cho GC đồng thời, throughput có thể thấp hơn G1 vài phần trăm, cần heap dư để tránh allocation stall.

### Vì sao các phương án còn lại sai
- **Parallel GC**: tối ưu throughput nhưng full GC stop-the-world trên 32 GB có thể mất hàng giây.
- **Giảm heap xuống 4 GB**: có thể không đủ chỗ cho dữ liệu, GC chạy dày hơn hoặc OOM; không giải quyết bản chất.
- **MaxGCPauseMillis=1**: chỉ là **mục tiêu mềm**; G1 vẫn phải evacuate theo kiểu stop-the-world, đặt quá thấp làm young gen bé, GC dày và vẫn vượt mục tiêu.

> Senior tip: trước khi đổi GC, xác nhận latency thật sự do GC (so timestamp pause trong GC log với p99, JFR). Nhiều khi thủ phạm là time-to-safepoint, allocation quá nhiều, hay lock contention. Thay đổi GC theo từng canary, so sánh p99/p999, CPU và RSS.`
},
{
  id: 'qz-jvm-015', topic: 'jvm', multi: true,
  q: `Bạn soạn bộ JVM flags baseline cho service Spring Boot chạy Java 21 trong container. Những flag nào **hợp lý**? (Chọn 3)`,
  options: [
    `-XX:MaxRAMPercentage=75.0`,
    `-XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/dumps`,
    `-Xlog:gc*:file=/logs/gc.log:time,uptime:filecount=5,filesize=20M`,
    `-XX:+UseConcMarkSweepGC`,
    `-XX:PermSize=256m -XX:MaxPermSize=512m`
  ],
  answer: [0, 1, 2],
  explain: `**Đáp án đúng: MaxRAMPercentage, heap dump khi OOM, và GC log xoay vòng.**

### Vì sao đúng
- {{MaxRAMPercentage=75}}: heap tính theo memory limit của container, chừa ~25% cho bộ nhớ native; tự điều chỉnh khi đổi limit, không cần sửa Xmx.
- {{HeapDumpOnOutOfMemoryError}} + path trên volume bền (không phải filesystem tạm của container) để còn bằng chứng sau khi pod restart.
- {{-Xlog:gc*}} (unified logging, JDK 9+) ghi ra file có decorator thời gian và **xoay vòng** 5 file × 20 MB, chi phí rất thấp.

### Vì sao các phương án còn lại sai
- **UseConcMarkSweepGC**: CMS bị xoá ở JDK 14; JVM mới bỏ qua cờ kèm cảnh báo, tạo hiểu lầm về GC đang chạy.
- **PermSize/MaxPermSize**: PermGen bị thay bằng Metaspace từ Java 8; cờ bị bỏ qua (cảnh báo). Tương đương hiện nay là {{MaxMetaspaceSize}}.

> Senior tip: thêm {{-XX:+ExitOnOutOfMemoryError}} để pod restart sạch thay vì chạy tiếp ở trạng thái hỏng, và đặt heap dump vào volume đủ dung lượng (dump bằng cỡ heap). Đọc lại cờ thực tế bằng {{jcmd <pid> VM.flags}} sau mỗi lần nâng JDK.`
},
{
  id: 'qz-jvm-016', topic: 'jvm',
  q: `Sau mỗi lần deploy, p99 latency cao gấp 5–10 lần trong 2–3 phút đầu rồi tự giảm về bình thường. GC log bình thường. Nguyên nhân chính?`,
  options: [
    `Code còn chạy ở interpreter/C1 trước khi C2 biên dịch các hot path (tiered compilation), cộng thêm class loading và cache lạnh; giảm bằng warm-up traffic, CDS/AppCDS, hoặc CRaC`,
    `JVM chạy full GC trên toàn heap ngay khi khởi động`,
    `JVM phải xác minh bytecode lại cho mỗi request`,
    `Metaspace phải resize sau mỗi request`
  ],
  answer: 0,
  explain: `**Đáp án đúng: JIT warm-up và cache lạnh.**

### Vì sao đúng
HotSpot dùng **tiered compilation**: method bắt đầu ở interpreter (chậm nhất), đủ số lần gọi thì C1 biên dịch nhanh kèm profiling, nóng hơn nữa thì C2 biên dịch tối ưu sâu dựa trên profile. Quá trình này mất vài chục giây đến vài phút dưới tải thật. Cùng lúc: class được load lần đầu (Spring, Jackson, Hibernate), connection pool, cache ứng dụng, cache CPU đều lạnh.
Giảm thiểu: gửi warm-up traffic trước khi readiness probe báo sẵn sàng, AppCDS (rút ngắn class loading), Spring AOT, CRaC (khôi phục từ snapshot đã warm), hoặc GraalVM native image (không cần warm-up nhưng peak throughput khác).

### Vì sao các phương án còn lại sai
- **Full GC khi khởi động**: GC log bình thường đã loại trừ điều này.
- **Xác minh bytecode mỗi request**: verification diễn ra **một lần** khi class được link.
- **Metaspace resize mỗi request**: metaspace chỉ tăng khi load class mới, không theo request.

> Senior tip: rolling deploy cùng lúc nhiều pod lạnh có thể làm cả cluster chậm; dùng maxSurge nhỏ, slow start trên load balancer (ALB slow start mode) và readiness probe chỉ OK sau warm-up. Theo dõi JFR event Compilation/Deoptimization nếu latency dao động kéo dài.`
},
{
  id: 'qz-jvm-017', topic: 'jvm',
  q: `Trong Eclipse MAT, một object {{HashMap}} có **shallow heap 48 byte** nhưng **retained heap 1.8 GB**. Ý nghĩa đúng là gì?`,
  options: [
    `Bản thân object HashMap chiếm 1.8 GB`,
    `Nếu HashMap này được GC thu hồi thì khoảng 1.8 GB sẽ được giải phóng (các object chỉ reachable qua nó); bước tiếp theo là xem ai giữ nó bằng Path to GC Roots`,
    `MAT tính sai, vì retained heap luôn nhỏ hơn hoặc bằng shallow heap`,
    `1.8 GB là tổng mọi object HashMap tham chiếu tới, kể cả object đang được nơi khác giữ`
  ],
  answer: 1,
  explain: `**Đáp án đúng: 1.8 GB sẽ được giải phóng nếu object này bị thu hồi.**

### Vì sao đúng
- **Shallow heap**: kích thước của chính object (header + field). HashMap chỉ vài chục byte; mảng bảng và các Node là object riêng.
- **Retained heap**: tổng kích thước tập object **chỉ reachable thông qua object này** (dominator tree). Thu hồi nó thì toàn bộ tập đó được thu hồi theo.
Retained lớn = ứng viên số một cho leak. Bước tiếp: "Path to GC Roots (exclude weak/soft references)" để biết field static hay thread nào giữ HashMap.

### Vì sao các phương án còn lại sai
- **Bản thân chiếm 1.8 GB**: nhầm shallow với retained.
- **Retained ≤ shallow**: ngược lại, retained luôn **≥** shallow vì bao gồm chính nó.
- **Kể cả object nơi khác đang giữ**: object còn được giữ bởi đường khác **không** tính vào retained của HashMap (vì thu hồi HashMap cũng không giải phóng chúng).

> Senior tip: quy trình chuẩn: Leak Suspects report → Dominator Tree sắp theo retained → Path to GC Roots → đọc code nơi giữ tham chiếu. So sánh hai heap dump cách nhau vài giờ (histogram diff) để thấy class nào tăng đều. Heap dump chứa dữ liệu thật (PII, token), cần xử lý như dữ liệu nhạy cảm.`
},
{
  id: 'qz-jvm-018', topic: 'jvm',
  q: `Service dùng Netty, chạy với {{-Xmx3g}}. RSS của process tăng dần tới 6 GB trong khi heap used chỉ khoảng 1 GB. Bước điều tra **hợp lý nhất** là gì?`,
  options: [
    `Lấy heap dump, vì mọi bộ nhớ của Java đều nằm trên heap`,
    `Giảm -Xmx xuống 1 GB để RSS giảm theo`,
    `Bật Native Memory Tracking (-XX:NativeMemoryTracking=summary), lấy baseline rồi jcmd VM.native_memory summary.diff theo thời gian; đồng thời theo dõi BufferPool MXBean để kiểm tra direct buffer`,
    `Tăng -Xss để giảm số thread`
  ],
  answer: 2,
  explain: `**Đáp án đúng: dùng Native Memory Tracking và theo dõi direct buffer.**

### Vì sao đúng
Phần chênh RSS – heap nằm ở bộ nhớ **native**. NMT chia theo hạng mục (Java Heap, Class/Metaspace, Thread, Code, GC, Internal/Other…) và {{summary.diff}} so với baseline cho thấy hạng mục nào **đang tăng**:
~~~bash
jcmd <pid> VM.native_memory baseline
# vài giờ sau
jcmd <pid> VM.native_memory summary.diff
~~~
Với Netty, nghi phạm số một là **direct ByteBuffer** không được release (ByteBuf leak); xem {{BufferPoolMXBean}} "direct" và bật {{-Dio.netty.leakDetection.level=advanced}} ở môi trường test. Lưu ý NMT không thấy bộ nhớ do thư viện native tự malloc; khi đó dùng jemalloc/async-profiler native mode.

### Vì sao các phương án còn lại sai
- **Heap dump**: heap chỉ dùng 1 GB; dump chỉ thấy object {{DirectByteBuffer}} nhỏ xíu chứ không thấy vùng native nó trỏ tới.
- **Giảm Xmx**: không chạm tới phần native đang tăng, còn có thể gây OOM heap.
- **Tăng -Xss**: tăng stack cho mỗi thread, làm RSS tăng thêm và không giảm số thread.

> Senior tip: NMT tốn khoảng 5–10% hiệu năng ở mức summary; bật tạm khi điều tra. Đặt {{-XX:MaxDirectMemorySize}} để leak direct buffer lộ thành OutOfMemoryError rõ ràng thay vì bị OOMKilled âm thầm.`
},
{
  id: 'qz-jvm-019', topic: 'jvm', multi: true,
  q: `Khi phân tích "Path to GC Roots" trong heap dump, những thứ nào là **GC roots** trong HotSpot? (Chọn 3)`,
  options: [
    `Biến local và tham số trong stack frame của các thread đang sống`,
    `Static field của các class đã load (khi class và ClassLoader của nó còn sống)`,
    `Mọi object có override finalize()`,
    `Object chỉ được tham chiếu bởi WeakReference`,
    `JNI global reference do code native tạo ra`,
    `Mọi object nằm ở old generation`
  ],
  answer: [0, 1, 4],
  explain: `**Đáp án đúng: biến trên stack của thread, static field, JNI global reference.**

### Vì sao đúng
GC dùng **reachability**: bắt đầu từ tập GC roots, đi theo tham chiếu mạnh; object nào không tới được là rác. Roots gồm:
- Stack frame của thread đang sống (biến local, tham số, giá trị tạm).
- Static field của class đã load (class được giữ bởi ClassLoader còn sống).
- JNI global/local reference, monitor đang bị giữ, các object nội bộ của JVM.
Vì đi từ roots chứ không đếm tham chiếu, các vòng tham chiếu (A ↔ B) không còn ai giữ vẫn bị thu hồi.

### Vì sao các phương án còn lại sai
- **Object có finalize()**: chỉ bị trì hoãn thu hồi (đưa vào hàng đợi finalizer), không phải root.
- **Chỉ có WeakReference trỏ tới**: chính là định nghĩa của "weakly reachable", sẽ bị dọn ở lần GC tiếp theo.
- **Old generation**: thế hệ chỉ là chiến lược tổ chức bộ nhớ; object ở old gen vẫn bị thu hồi khi không reachable (khi minor GC, card table/remembered set chỉ giúp tìm tham chiếu old → young, không biến old gen thành root theo nghĩa reachability).

> Senior tip: leak thực tế gần như luôn bắt nguồn từ **static field** (cache, registry, listener list) hoặc **thread sống lâu** (ThreadLocal trong thread pool). Trong MAT, root type hiển thị cạnh đường dẫn ("System Class", "Thread", "JNI Global") giúp xác định nhanh loại.`
},
{
  id: 'qz-jvm-020', topic: 'jvm',
  q: `GC log báo pause chỉ khoảng 5 ms, nhưng ứng dụng bị khựng gần 800 ms. Log {{-Xlog:safepoint}} có dòng:
~~~text
Safepoint "G1CollectForAllocation", Time since last: 1803221340 ns, Reaching safepoint: 791204113 ns, Cleanup: 112034 ns, At safepoint: 5120771 ns, Total: 796436918 ns
~~~
Nhận định nào đúng nhất?`,
  options: [
    `GC log ghi sai thời gian pause, pause GC thực tế là 800 ms`,
    `JIT deoptimize toàn bộ code nên mọi thread chạy lại ở interpreter`,
    `ZGC đang chạy phase concurrent chiếm hết CPU`,
    `Time-to-safepoint lớn: JVM chờ ~790 ms để mọi thread dừng tại safepoint (một thread chạy đoạn code đã JIT không có safepoint poll, copy mảng lớn, hoặc bị stall do swap/page fault), GC chỉ bắt đầu sau đó`
  ],
  answer: 3,
  explain: `**Đáp án đúng: time-to-safepoint (TTSP) lớn.**

### Vì sao đúng
Để chạy GC stop-the-world, JVM yêu cầu **mọi thread Java dừng tại safepoint**. Thread đang chạy phải tự kiểm tra (safepoint poll) và dừng lại. Dòng log tách rõ:
- {{Reaching safepoint: 791204113 ns}} ≈ **791 ms** chờ thread cuối cùng tới safepoint. Trong lúc đó, các thread đã dừng đều bị treo.
- {{At safepoint: 5120771 ns}} ≈ 5 ms là thời gian GC làm việc thật, khớp GC log.
Nguyên nhân hay gặp: vòng lặp đã được JIT tối ưu bỏ poll (JDK mới có loop strip mining giảm bớt), {{System.arraycopy}}/khởi tạo mảng rất lớn, thread bị stall do swap hoặc page fault khi heap chưa được touch ({{-XX:+AlwaysPreTouch}} giúp).

### Vì sao các phương án còn lại sai
- **GC log sai**: GC log đúng; nó chỉ đo phần GC chạy, không đo thời gian chờ đạt safepoint.
- **Deoptimize toàn bộ**: deoptimization cũng cần safepoint nhưng log ghi rõ lý do là G1CollectForAllocation.
- **ZGC**: dòng log là của G1, và phase concurrent không làm treo thread ứng dụng.

    > Senior tip: khi latency spike không khớp GC pause, luôn bật {{-Xlog:safepoint}} và so sánh "Total" với "At safepoint". JFR có event {{jdk.SafepointBegin}}, async-profiler có chế độ ttsp để chỉ ra đoạn code đang chặn safepoint.`
  },

// ===================== core =====================
{
  id: 'qz-core-021', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
class Base {
    String name = "base";
    String describe() { return "base:" + name; }
}
class Derived extends Base {
    String name = "derived";
    @Override
    String describe() { return "derived:" + name; }
}
// main:
Base b = new Derived();
System.out.println(b.name + " " + b.describe());
~~~`,
  options: [
    `derived derived:derived`,
    `base base:base`,
    `base derived:derived`,
    `derived base:base`
  ],
  answer: 2,
  explain: `**Đáp án đúng: base derived:derived.**

### Hai quy tắc "binding" khác nhau
- **Field** (biến của object) được chọn theo **kiểu tĩnh** của biến tham chiếu, tức kiểu bạn khai báo ({{Base b}}). Compiler tra {{name}} trong {{Base}} và sinh bytecode đọc đúng field đó. Java **không có khái niệm ghi đè field**: field cùng tên trong {{Derived}} chỉ bị **giấu (hiding)**, và object thật chứa **hai** field {{name}} — một của {{Base}}, một của {{Derived}} (đều tốn heap).
- **Instance method** được chọn theo **kiểu động** của object thật (dynamic dispatch qua bảng method của class) → JVM chạy {{describe()}} của {{Derived}}. Trong method đó, {{name}} đã được biên dịch theo class chứa nó ({{Derived}}) nên đọc ra "derived".

~~~text
b ──> object Derived: [name(Derived)="derived"] + [name(Base)="base"]
      đọc b.name      : theo kiểu biến   (Base)    -> "base"
      gọi b.describe(): theo object thật (Derived) -> "derived:derived"
~~~

### Vì sao các phương án còn lại sai
- **derived derived:derived**: đúng cho method nhưng sai cho field; field không tham gia polymorphism.
- **base base:base**: chỉ đúng nếu method là {{static}}, {{final}} hoặc {{private}} — ba kiểu đó bị "hide" theo kiểu tham chiếu chứ không bị override.
- **derived base:base**: đảo ngược cả hai quy tắc.

> Senior tip: bug thật: hai tầng class cùng khai báo field {{id}}/{{version}}, code đọc {{parentRef.id}} nhận giá trị cũ dù subclass đã gán lại, hoặc object âm thầm mang hai bản field. Phòng bằng cách luôn để field {{private}} + getter (lúc đó không còn truy cập trực tiếp để mà nhầm), bật check {{FieldHidesSuperclass}} của ErrorProne/IDE. Cũng lưu ý: field bị giấu làm heap dump khó đọc vì MAT hiển thị hai entry trùng tên.`
},
{
  id: 'qz-core-022', topic: 'core', multi: true,
  q: `Class sau **không** biên dịch được. Những phát biểu nào **đúng**? (Chọn 2)
~~~java
public class Repo {
    void save(List<String> ids)  { /* ... */ }
    void save(List<Integer> ids) { /* ... */ }

    boolean isStringList(Object o) {
        return o instanceof List<String>;
    }
}
~~~`,
  options: [
    `Chỉ cần đổi tham số của hai method thành List<?> là xung đột biến mất`,
    `Dòng instanceof List<String> là lỗi biên dịch: kiểu của phần tử không tồn tại lúc chạy, và Java 21 với pattern matching cũng không cho phép`,
    `Thêm @SuppressWarnings("unchecked") thì javac sẽ thôi báo lỗi`,
    `Hai method save bị coi là trùng vì sau khi erase, cả hai đều có chữ ký save(List) — javac báo "name clash ... same erasure"`
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: {{instanceof}} với kiểu generic luôn lỗi, và hai overload xung đột vì erasure.**

### Erasure là gì, vì sao nó tồn tại
Generics (thêm vào Java 5) được hiện thực bằng **type erasure**: compiler dùng kiểu để kiểm tra lúc biên dịch, rồi **xoá thông tin kiểu** khỏi bytecode. {{List<String>}} và {{List<Integer>}} đều trở thành {{List}} thô, phần tử được lấy ra bằng {{Object}} cộng một cast ẩn. Mục đích là **tương thích nhị phân**: code viết trước 2005 vẫn chạy với thư viện dùng generics và ngược lại. Hệ quả: JVM không thể hỏi "list này chứa String hay Integer" với một object {{ArrayList}} bình thường.

### Vì sao hai phát biểu đúng
- {{instanceof}} kiểm tra kiểu **của object đang chạy**. Một {{ArrayList}} không mang kiểu phần tử, nên {{o instanceof List<String>}} là câu hỏi vô nghĩa (một list rỗng thì "có phải List của String" không?). javac chặn; chỉ viết được {{o instanceof List}} hoặc {{o instanceof List<?>}}. Java 16+ thêm pattern matching ({{o instanceof List l && l.size() > 0}}) chỉ giúp **bind biến**, không mở khoá kiểm tra element type.
- Trong bytecode, chữ ký của cả hai method đều là {{save(Ljava/util/List;)V}}. Hai method trùng chữ ký trong cùng một class là lỗi **compile-time** ("name clash: ... have the same erasure"), không phải warning.

### Cách sửa đúng
Đổi tên method ({{saveStrings}} / {{saveInts}}), hoặc dùng một method generic {{<T> void save(List<T> ids)}}, hoặc {{List<? extends Number>}} nếu muốn nhận cả hai. Nếu thực sự cần biết element type lúc chạy, hãy truyền thêm {{Class<T>}} (type token) hoặc để caller tự khai báo class cha generic và đọc {{ParameterizedType}} qua reflection.

### Vì sao các phương án còn lại sai
- **Đổi thành {{List<?>}}**: {{List<?>}} cũng bị erase thành {{List}} → vẫn cùng chữ ký, vẫn clash.
- **{{@SuppressWarnings("unchecked")}}**: annotation này chỉ tắt **warning** (thô, unchecked cast); nó không biến một lỗi biên dịch thành code hợp lệ.

> Senior tip: các hệ quả của erasure hay bị hỏi tiếp: {{new T[10]}} không hợp lệ, không có {{List<String>.class}}, {{List<String>}} và {{List<Integer>}} có cùng {{getClass()}}, và một {{List}} raw chứa lẫn kiểu sẽ ném {{ClassCastException}} ở chỗ **đọc** chứ không phải chỗ **thêm** — loại bug "heap pollution" mất vài giờ để lần ra. Vì vậy quy ước team: không dùng raw type, bật {{-Xlint:unchecked}} và coi warning là error trong CI.`
},
{
  id: 'qz-core-023', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
Map<String, Integer> count = new HashMap<>();
count.put("cart", null);              // có key, value chưa có
int a = count.get("cart");            // 1
int b = count.getOrDefault("views", 0);
System.out.println(a + " " + b);
~~~`,
  options: [
    `Ném NullPointerException ở dòng 1, chương trình không in gì`,
    `in "null 0"`,
    `in "0 0"`,
    `Không biên dịch được vì không được gán Integer cho int`
  ],
  answer: 0,
  explain: `**Đáp án đúng: NullPointerException ở dòng gán {{int a}}.**

### Autoboxing và unboxing
{{int}} là **primitive** (chỉ con số, không có method). {{Integer}} là **wrapper**: một object chứa con số đó. **Autoboxing** là compiler tự bọc {{int}} thành {{Integer}}; **unboxing** là tự gọi {{intValue()}} để lấy ngược {{int}}. Dòng {{int a = count.get("cart");}} được biên dịch thành {{int a = count.get("cart").intValue();}} — đó là chỗ nguy hiểm: nếu giá trị lấy về là {{null}} thì {{null.intValue()}} ném {{NullPointerException}}.

### Vì sao đúng
- {{count.put("cart", null)}} tạo một entry **hợp lệ**: key "cart" có tồn tại, chỉ value là {{null}}.
- {{count.get("cart")}} → {{null}}; unboxing {{null}} → NPE ngay dòng 1, nên {{println}} không kịp chạy, không in gì.
- {{getOrDefault("views", 0)}} không chạy tới vì chương trình đã chết ở dòng 1; bản thân nó an toàn vì key "views" **không có** trong map → trả {{0}}.
- Bẫy hay bị hỏi thêm: đổi thành {{int b = count.getOrDefault("cart", 0);}} thì **vẫn NPE**. Theo đặc tả, default chỉ được dùng khi map **không chứa key**; ở đây key có chứa, value là {{null}} nên {{getOrDefault}} trả về {{null}}.

### Vì sao các phương án còn lại sai
- **in "null 0"**: {{System.out.println(count.get("cart"))}} đúng là in "null" (không có unboxing vì nhận {{Object}}), nhưng ở đây giá trị bị ép sang {{int}} ngay khi gán.
- **in "0 0"**: Java không quy ước {{null}} thành 0; chỉ C/C++ con trỏ mới "coi 0 là không có gì".
- **Không biên dịch được**: gán {{Integer}} cho {{int}} hoàn toàn hợp lệ từ Java 5.

> Senior tip: lỗi này nổi tiếng vì stack trace trỏ vào code nghiệp vụ chứ không phải chỗ đọc DB — ví dụ cột {{click_count}} nullable đổ vào {{Map<String,Integer>}} rồi gán cho {{int}}, hoặc {{Integer}} trong DTO bị null sau một lần serialize/migrate. Cách sống chung: giữ kiểu {{Integer}} rồi kiểm tra null tường minh, hoặc dùng {{Objects.requireNonNullElse(v, 0)}}; với bộ đếm thì {{map.merge(k, 1, Integer::sum)}} (key chưa có sẽ được gắn value mới, không bao giờ là null). Quy ước team nên là: **không bao giờ** put null vào map đếm.`
}, 

{
  id: 'qz-core-024', topic: 'core',
  q: `Đoạn code sau in ra gì? ({{MILLIS}} là biến, không phải hằng)
~~~java
int MILLIS = 1000;
long ttlMillis = 30 * 24 * 60 * 60 * MILLIS;   // mong đợi: 30 ngày tính bằng ms
System.out.println(ttlMillis);
~~~`,
  options: [
    `2592000000`,
    `0, vì giá trị vượt quá giới hạn nên bị coi như không hợp lệ`,
    `Lỗi biên dịch vì biểu thức vượt quá phạm vi của int`,
    `-1702967296`
  ],
  answer: 3,
  explain: `**Đáp án đúng: -1702967296.**

### Chỗ cần hiểu: kiểu của biểu thức, không phải kiểu của biến nhận
Tất cả toán hạng ({{30}}, {{24}}, {{60}}, {{MILLIS}}) đều là {{int}}, nên **toàn bộ phép tính chạy bằng {{int}}**. Việc gán kết quả cho {{long}} chỉ là **widening sau khi phép tính đã xong** — nó không mở rộng phạm vi trung gian.
{{int}} dùng 32 bit theo **two's complement**, giá trị tối đa là 2.147.483.647. Kết quả đúng của 30*24*60*60*1000 là 2.592.000.000 > mức đó → số **quanh vòng (wrap)**: 2.592.000.000 − 2^32 = **−1.702.967.296**. Java định nghĩa rõ hành vi này (không phải undefined behaviour như C/C++), và **không có exception nào** được ném.

~~~text
2.592.000.000 (toán học)  >  2.147.483.647 (Integer.MAX_VALUE)
wrap: 2.592.000.000 - 4.294.967.296 = -1.702.967.296   -> vừa khít vào int
~~~

### Cách viết đúng
- Đưa chữ {{L}} vào toán hạng **đầu tiên**: {{long ttl = 30L * 24 * 60 * 60 * 1000;}} (từ đây mọi phép tính đều là {{long}}).
- Dùng API có sẵn đơn vị: {{TimeUnit.DAYS.toMillis(30)}} hoặc {{Duration.ofDays(30).toMillis()}} — các method này tính bằng {{long}} và có kiểm tra tràn.
- Muốn lỗi "nổ" ngay khi tràn (để test bắt được): {{Math.multiplyExact(a, b)}} ném {{ArithmeticException}}.

### Vì sao các phương án còn lại sai
- **2592000000**: chỉ đúng nếu phép nhân chạy bằng {{long}}; ở đây {{long}} chỉ xuất hiện ở chỗ gán.
- **0**: Java không "bão hoà" (saturate) và không có giá trị sentinel cho tràn số.
- **Lỗi biên dịch**: javac không đánh giá tràn số của biểu thức chạy bằng biến; đây là lỗi **logic**, âm thầm chạy được.

> Senior tip: bug thật của kiểu này thường có dạng TTL/hạn dùng: hết hạn tính ra **âm** nên mọi entry cache bị coi là hết hạn ngay (miss 100%, DB bị dồn tải) hoặc token OAuth "hết hạn năm 1970". Dấu hiệu nhận biết: log có {{expiresAt}} nhỏ hơn {{now}} một cách vô lý. Trong CI nên bật ErrorProne {{IntegerDivisionInfiniteLoop}}/{{BadShiftValues}} và Sonar rule "Make sure this value fits into the type"; đồng thời thêm một test tính bằng {{Duration}} rồi so sánh với giá trị mong đợi.`
},

// ===================== collections =====================
{
  id: 'qz-collections-021', topic: 'collections',
  q: `Cache phụ trợ tra theo **instance object**: mỗi request tạo một {{Token}} mới, app ghi {{static final Map<Token, String> META = new HashMap<>();}} rồi {{META.put(token, meta)}}. Chỉ có đường thông mới gọi {{META.remove(token)}}; đường lỗi (exception) thì quên. Sau 6 giờ, heap dump cho thấy hàng triệu {{Token}} không ai dùng nhưng vẫn sống. Yêu cầu: entry phải **tự biến mất** khi object key không còn được tham chiếu ở nơi khác. Lựa chọn nào trong JDK đáp ứng yêu cầu này?`,
  options: [
    `IdentityHashMap, vì cache tra theo đúng instance nên so sánh bằng == là hợp lý`,
    `WeakHashMap, vì key được giữ bằng weak reference nên entry tự rơi khi key chỉ còn cache tham chiếu tới`,
    `ConcurrentHashMap, vì nó tự dọn những entry "yếu" theo mỗi chu kỳ GC`,
    `Collections.synchronizedMap(new HashMap<>()), vì đồng bộ hoá giúp GC nhận biết entry không còn dùng`
  ],
  answer: 1,
  explain: `**Đáp án đúng: {{WeakHashMap}}.**

### Ba loại reference trong JDK (nền tảng để hiểu câu này)
- **Strong reference** — kiểu mặc thường: {{Map<Token, String>}} giữ key bằng strong reference thì GC **không được phép** thu hồi, dù code nghiệp vụ đã "quên" object đó. Đây chính là leak trong tình huống trên.
- **SoftReference** — chỉ bị dọn khi JVM sắp hết bộ nhớ; hợp với cache dung lượng lớn muốn "tự co" (nhưng gây GC liên tục, xem câu hỏi về cache 2 GB {{SoftReference}}).
- **WeakReference** — bị dọn **ngay khi** không còn strong reference nào khác trỏ tới object.
- **PhantomReference** — dùng để biết object đã bị thu hồi, phục vụ giải phóng bộ nhớ native.

### Vì sao {{WeakHashMap}} đúng
{{WeakHashMap}} bọc mỗi key trong một {{WeakReference}} và nhận thông báo từ {{ReferenceQueue}} khi key bị GC, rồi loại entry tương ứng. Kết quả: cache không giữ chân object nữa — key "sống" bao lâu nghiệp vụ còn dùng nó.
Hai giới hạn phải nói được khi phỏng vấn:
1. Việc dọn **lười (lazy)**: entry chỉ được gỡ khi bạn thao tác trên map ({{get}}/{{put}}/{{size}}). Không có thread GC chủ động dọn, nên "heap chết" có thể tồn tại tới lần access kế tiếp.
2. **Value không được tham chiếu ngược lại key** (Javadoc cảnh báo rõ): nếu {{String meta}} / object value giữ reference tới {{Token}}, key luôn còn một đường strong reachable qua entry → entry không bao giờ bị dọn.
3. Nó **không thread-safe** và **không có bound** về dung lượng.

### Vì sao các phương án còn lại sai
- **{{IdentityHashMap}}**: khác ở chỗ dùng {{==}} thay vì {{equals}} cho key, nhưng vẫn giữ key bằng **strong reference** → leak y nguyên.
- **{{ConcurrentHashMap}}**: mạnh về đồng thời, không có khái niệm "weak entry"; muốn cache weak/expire phải dùng Caffeine ({{weakKeys()}}, {{expireAfterAccess()}}).
- **{{synchronizedMap}}**: từ khoá {{synchronized}} chỉ chống race, không ảnh hưởng reachability của GC.

> Senior tip: trong service thật, ưu tiên **Caffeine** (bound số entry + TTL + stats + {{weakKeys}}/{{weakValues}}) hơn {{WeakHashMap}}, vì {{WeakHashMap}} cho bạn đúng một cơ chế "không giữ object" còn dung lượng và hit-rate thì không kiểm soát được — và vì cleanup lazy nên {{size()}} của nó chỉ là con số ước lượng tại thời điểm gọi. Nếu vẫn muốn ở lại JDK: để cache là **instance field** có {{clear()}} theo vòng đời, đừng là {{static}}.`
},
{
  id: 'qz-collections-022', topic: 'collections',
  q: `Đoạn code sau in ra gì?
~~~java
Map<String, Integer> hits = new HashMap<>();
hits.put("home", 1);
hits.merge("home", 5, Integer::sum);
hits.merge("cart", 3, Integer::sum);
hits.merge("home", 7, (oldValue, newValue) -> null);
System.out.println(hits);
~~~`,
  options: [
    `{home=6, cart=3}`,
    `{home=13, cart=3}`,
    `{cart=3}`,
    `{cart=3, home=0}`
  ],
  answer: 2,
  explain: `**Đáp án đúng: {{cart=3}}.**

### {{Map.merge}} làm gì (phần nhiều người dùng thiếu)
{{merge(key, newValue, remappingFunction)}} có ba nhánh xác định theo trạng thái của key:
1. Key **chưa tồn tại** (hoặc value hiện là {{null}}): gắn thẳng {{newValue}}; **hàm remapping không được gọi**.
2. Key **đã có value khác null**: gọi {{remappingFunction.apply(giaTriCu, newValue)}} rồi gán kết quả.
3. Kết quả của hàm remapping là {{null}}: key bị **xoá khỏi map** — đây là hành vi được đặc tả, không phải tác dụng phụ.
{{newValue}} không được là {{null}} (nếu có, {{merge}} ném {{NullPointerException}}).

### Bấm từng dòng
- {{put("home", 1)}} → {{home=1}}.
- {{merge("home", 5, Integer::sum)}}: key đã có → {{1 + 5}} = 6 → {{home=6}}.
- {{merge("cart", 3, Integer::sum)}}: key chưa có → gắn 3, hàm không chạy → {{cart=3}}.
- {{merge("home", 7, (o, n) -> null)}}: hàm trả {{null}} → **xoá home**.
Còn đúng một entry nên kết quả in ra không phụ thuộc thứ tự duyệt của {{HashMap}}.

### Vì sao các phương án còn lại sai
- **{{home=6, cart=3}}**: dừng ở bước 2, quên rằng hàm remapping trả {{null}} ở bước cuối.
- **{{home=13, cart=3}}**: coi merge như "cộng dồn vô điều kiện" (1+5+7) và không biết gì về nhánh 3.
- **{{cart=3, home=0}}**: tưởng trả {{null}} nghĩa là gán 0; merge **gỡ** entry chứ không chèn 0.

> Senior tip: bộ đếm an toàn-đồng-thời gọn nhất là {{hits.merge(path, 1, Integer::sum)}}; với {{ConcurrentHashMap}} thao tác này atomic theo key, trong khi {{map.put(k, map.get(k) + 1)}} là read-modify-write và mất update khi có hai thread cùng tăng. Ở chiều ngược lại, nhánh 3 là một cái bẫy: lambda điều kiện trả {{null}} sẽ **xoá bản ghi** chứ không "giữ nguyên", nên nếu chỉ muốn xoá hãy gọi {{remove}} tường minh và đọc code review thật kỹ những {{merge}} có lambda phức tạp.`
},
{
  id: 'qz-collections-023', topic: 'collections',
  q: `Đoạn code sau in ra gì?
~~~java
Comparator<Integer> ascending = (a, b) -> a - b;
Integer[] ids = { Integer.MAX_VALUE, -1 };
System.out.println(ascending.compare(ids[0], ids[1]) < 0);
~~~`,
  options: [
    `true: comparator khẳng định 2147483647 nhỏ hơn -1, nghĩa là mọi danh sách sắp bằng nó đều có thể sai thứ tự`,
    `false: vì a - b luôn cho hiệu đúng với số nguyên`,
    `Lỗi biên dịch: không được dùng dấu trừ trên hai Integer`,
    `Ném ArithmeticException vì phép trừ vượt phạm vi int`
  ],
  answer: 0,
  explain: `**Đáp án đúng: {{true}} — comparator nói sai.**

### Hợp đồng của Comparator
{{compare(a, b)}} phải trả **số âm** nếu a đứng trước b, **0** nếu ngang, **số dương** nếu a đứng sau. Người viết hay "tối ưu" thành {{a - b}} vì nghĩ hiệu mang đúng dấu.

### Chỗ hỏng: {{int}} tràn số, và Java wrap im lặng
{{Integer.MAX_VALUE - (-1)}} về toán học là 2.147.483.648, lớn hơn {{Integer.MAX_VALUE}} (2.147.483.647). {{int}} có 32 bit nên kết quả **quanh vòng** thành {{Integer.MIN_VALUE}} (-2.147.483.648), tức một số **âm**. Do đó {{compare(MAX, -1) < 0}} là {{true}}: comparator tuyên bố số dương lớn nhất nhỏ hơn -1.
{{a - b}} cũng hợp lệ về cú pháp vì {{Integer}} được **unboxing** thành {{int}} trước khi trừ — không lỗi biên dịch, không exception: Java định nghĩa tràn số là wrap, chỉ {{Math.subtractExact}} mới ném {{ArithmeticException}}.

### Hệ quả thực tế
- {{Arrays.sort}}/{{List.sort}} với comparator "nói dối" trả về danh sách **trông có vẻ** được sắp nhưng sai ở các cặp giá trị xa nhau; kiểu bug này lộ ra rất chậm vì dữ liệu test nhỏ không đủ để tràn số.
- TimSort kiểm tra tính bắc cầu và có thể ném {{IllegalStateException: Comparison method violates its general contract!}} với comparator không nhất quán.
- {{TreeMap}}/{{TreeSet}} dựa hoàn toàn vào comparator, nên phần tử có thể bị đặt sai nhánh, {{get}}/{{contains}} trả về sai.

### Cách viết đúng
{{Integer.compare(a, b)}} (so sánh bằng phép quan hệ, không trừ), hoặc {{Comparator.<Integer>naturalOrder()}}, hoặc dạng field: {{Comparator.comparingInt(Order::getQuantity)}}. Với khoảng cách/epoch millis dùng {{Long.compare}}.

> Senior tip: đây là lỗi kinh điển trong code review; luôn soi {{-}}/{{+}} trong lambda comparator, đặc biệt khi so sánh {{timestamp}}, {{id}}, {{amount}} (giá trị lớn). Test nên có cặp cố cực: {{Integer.MAX_VALUE}} với {{-1}}, {{Long.MIN_VALUE}} với {{1}}. Effective Java (Item 14) nêu đúng điều này: "tránh dùng phép trừ cho comparator".`
},
{
  id: 'qz-collections-024', topic: 'collections', multi: true,
  q: `Service đẩy audit event vào {{ArrayBlockingQueue}} dung lượng 10.000 (đang **đầy**). Producer chạy trên thread xử lý HTTP và **không được phép** block quá 200 ms. Những phát biểu nào **đúng**? (Chọn 2)`,
  options: [
    `offer(e) khi hàng đợi đầy sẽ chờ đến khi có chỗ trống rồi mới trả về true`,
    `add(e) khi hàng đợi đầy sẽ trả về false, giống hệt offer(e)`,
    `put(e) sẽ block thread cho tới khi có chỗ, và thread đó có thể bị interrupt khi đang chờ`,
    `poll() khi hàng đợi rỗng ném NoSuchElementException`,
    `offer(e, 200, TimeUnit.MILLISECONDS) trả về false nếu sau 200 ms vẫn không có chỗ, không ném exception`
  ],
  answer: [2, 4],
  explain: `**Đáp án đúng: {{put}} block (và interrupt được); phiên bản {{offer}} có timeout trả {{false}} khi hết giờ.**

### {{BlockingQueue}} là gì
Là {{Queue}} mà các thao tác có **ngữ nghĩa chờ**: đầu sản xuất và đầu tiêu dùng không cần tự polling hay tự khoá. {{ArrayBlockingQueue}} là vòng đệm bounded (dung lượng cố định lúc tạo), dùng một lock chung cho head và tail.

### Bảng hành vi phải nhớ (cột "khi đầy" / "khi rỗng")
~~~text
add(e)        : ném IllegalStateException khi đầy        |  element()  ném NoSuchElementException khi rỗng
offer(e)      : trả false ngay khi đầy (không chờ)        |  peek()     trả null khi rỗng
offer(e,t,u)  : chờ tối đa t, trả false nếu quá hạn        |  poll()     trả null khi rỗng
put(e)        : chờ vô hạn tới khi có chỗ (Interruptible) |  take()     chờ vô hạn tới khi có phần tử (Interruptible)
~~~

### Vì sao hai phát biểu đúng
- {{put}}: đây là **backpressure** thật sự — thread sản xuất đứng tới khi consumer giải phóng chỗ; vì nó chờ trên {{Condition}} nên {{Thread.interrupt()}} đánh thức và ném {{InterruptedException}}.
- {{offer(e, 200, MILLISECONDS)}}: chờ có giới hạn rồi **báo cáo bằng giá trị trả về**, không ném exception — đúng ràng buộc "không block quá 200 ms" của đề bài (thực tế nếu muốn chắc chắn ≤200 ms kể cả khi đã chờ trước đó, dùng {{offer(e)}} không chờ rồi tự xử lý khi {{false}}).

### Vì sao các phát biểu còn lại sai
- **{{offer}} chờ rồi trả true**: {{offer(e)}} một tham số **không bao giờ chờ**; phiên bản có timeout mới chờ.
- **{{add}} trả false**: {{add}} kế thừa hợp đồng {{Collection.add}} "luôn thành công" nên khi đầy nó **ném** {{IllegalStateException}} — lỗi này thường nổ ở production chứ không im lặng.
- **{{poll}} ném exception**: đó là {{remove()}}; {{poll}} được thiết kế để trả {{null}}, và vì {{null}} bị cấm trong {{BlockingQueue}} nên {{null}} luôn nghĩa là "hết hàng đợi".

> Senior tip: hãy chọn policy khi đầy một cách có ý thức và **đo** nó: {{offer}} + counter "dropped events" (mất dữ liệu nhưng giữ latency), spill ra đĩa/DB, hoặc {{CallerRunsPolicy}} khi dùng qua executor (tự nhiên producer chạy luôn task — backpressure mềm). Đừng {{put}} vô hạn trên thread HTTP: một consumer chậm (Kafka lag, DB treo) sẽ biến thành toàn bộ request pool nằm chờ, triệu chứng là throughput về 0 mà CPU thấp và thread dump toàn WAITING trên {{Condition}}.`
},

// ===================== modern =====================
{
  id: 'qz-modern-021', topic: 'modern',
  q: `Dữ liệu đọc từ file của khách hàng có khoảng trắng kiểu Unicode ở đầu dòng ({{\\u3000}} — IDEOGRAPHIC SPACE). Đoạn code sau in ra gì?
~~~java
String raw = "\\u3000\\torder-42  ";
boolean same = raw.trim().equals(raw.strip());
System.out.println(same + " | " + raw.trim().length() + " | " + raw.strip().length());
~~~`,
  options: [
    `true | 8 | 8`,
    `false | 11 | 8`,
    `false | 10 | 8`,
    `false | 10 | 11`
  ],
  answer: 2,
  explain: `**Đáp án đúng: {{false | 10 | 8}}.**

### Hai API, hai định nghĩa "khoảng trắng"
- {{trim()}} (Java 1): cắt ký tự ở hai đầu miễn là mã của nó **{{<= U+0020}}**. tức chỉ {{space}}, {{\\t}}, {{\\n}}, {{\\r}} và control char ASCII. Gặp {{\\u3000}} (mã 12288) là nó **dừng lại ngay**.
- {{strip()}} (Java 11): cắt theo **{{Character.isWhitespace(codePoint)}}**, tức mở rộng cho khoảng trắng Unicode ({{\\u3000}}, {{\\u2003 EM SPACE}}…). {{isBlank()}} cũng dùng đúng định nghĩa này: một chuỗi chỉ chứa {{\\u3000}} thì {{isEmpty()}} là {{false}} nhưng {{isBlank()}} là {{true}}.
- {{String}} trong Java là mảng **code unit UTF-16**, nên {{\\u3000}} (nằm trong BMP) tính là **1** ký tự; chỉ ký tự ngoài BMP (emoji) mới tính 2.

### Đếm để loại phương án sai
{{raw}} có 12 code unit: {{\\u3000}}, {{\\t}}, {{"order-42"}} (8), 2 {{space}}.
- {{trim()}}: ký tự đầu là {{\\u3000}} → không cắt được gì ở đầu; 2 {{space}} cuối bị cắt → còn {{\\u3000\\torder-42}} = **10**.
- {{strip()}}: cắt {{\\u3000}} và {{\\t}} ở đầu, 2 {{space}} ở cuối → còn {{"order-42"}} = **8**.
- Hai kết quả khác nhau → {{equals}} = {{false}}.

### Vì sao các phương án còn lại sai
- **{{true | 8 | 8}}**: gán cho {{trim}} khả năng Unicode của {{strip}} — đây là nhầm phổ biến nhất vì "hai cái cùng tên ý nghĩa".
- **{{false | 11 | 8}}**: tính {{\\u3000\\t}} là 3 code unit hoặc tưởng 2 {{space}} cuối vẫn còn.
- **{{false | 10 | 11}}**: tưởng {{strip}} chỉ cắt {{space}} ASCII, không cắt {{\\t}}.

> Senior tip: bẫy thật sự còn khó hơn một bậc: {{\\u00A0}} (NBSP — ký tự Excel/Word/Google Docs hay chèn) **không** phải whitespace theo {{Character.isWhitespace}}, nên **cả {{trim}} lẫn {{strip}} đều bỏ qua** — chuỗi in ra trông y hệt mà {{equals}}/{{HashMap.get}} không khớp. Cách chuẩn hoá dữ liệu đầu vào:

~~~java
String normalize(String v) {
    String s = v.replace('\\u00A0', ' ').strip();   // đổi NBSP thành space ASCII trước rồi mới cắt
    return Normalizer.normalize(s, Normalizer.Form.NFC);  // đồng nhất tổ hợp dấu (á kiểu NFC vs NFD)
}
~~~

Khi điều tra loại bug này, đừng in chuỗi — hãy in {{s.codePoints()}} để thấy mã thật của từng ký tự.`
},
{
  id: 'qz-modern-022', topic: 'modern',
  q: `Đoạn code sau in ra gì? (Java 17)
~~~java
String query = """
    SELECT *
    FROM orders
    """;
System.out.print(query.length());
~~~`,
  options: [
    `20`,
    `21`,
    `25`,
    `29`
  ],
  answer: 1,
  explain: `**Đáp án đúng: 21.**

### Text block được biên dịch thành chuỗi thế nào (ba quy tắc đủ để tự tính)
Text block (chính thức từ Java 15) cho phép viết chuỗi nhiều dòng bằng **ba dấu nháy kép** liên tiếp, không cần nối chuỗi thủ công. javac áp ba bước biến đổi **trên source**:
1. Sau {{"""}} mở đầu chỉ được có khoảng trắng rồi xuống dòng; dấu xuống dòng đó **không** đi vào chuỗi.
2. **Incidental indentation**: JVM đo số ký tự thụt đầu của *từng dòng nội dung* **và của dòng chứa {{"""}} đóng**, lấy **min**, rồi cắt bỏ đúng bấy nhiêu ký tự ở đầu mọi dòng. Ở đây cả ba dòng đều thụt 4 → mỗi dòng mất 4 space.
3. **Mỗi dòng nội dung giữ lại dấu xuống dòng của nó** — kể cả dòng cuối: vì {{"""}} đóng nằm trên một dòng riêng nên ngay trước nó có một xuống dòng, và xuống dòng đó **được tính vào chuỗi**.

### Cộng lại
~~~text
SELECT *        ->  8 ký tự
xuống dòng      ->  1
FROM orders     -> 11 ký tự
xuống dòng      ->  1
tổng            -> 21
~~~

### Vì sao các phương án còn lại sai
- **20**: quên mất xuống dòng trước {{"""}} đóng. Kết quả này đúng nếu bạn đặt {{"""}} đóng ngay cuối dòng {{FROM orders}}, hoặc kết thúc dòng cuối bằng {{\\}} (escape nối dòng).
- **25**: chỉ cắt được indentation của một dòng (12 + 1 + 11 + 1).
- **29**: không cắt indentation chút nào: dòng 1 dài 12, dòng 2 dài 15, cộng hai xuống dòng.

> Senior tip: hai thứ hay dùng kèm: {{stripTrailing()}} (Java 15) cắt toàn bộ khoảng trắng cuối chuỗi khi bạn không muốn xuống dòng thừa, và {{formatted(args)}} để tham số hoá template. Muốn **giữ** một dấu cách cuối dòng thì thêm {{\\s}} trước xuống dòng, vì trailing space mặc định bị loại. Với SQL trong text block: luôn giữ placeholder {{?}} và truyền giá trị qua {{PreparedStatement}}, tuyệt đối không nội suy biến người dùng vào chuỗi — text block không làm SQL injection khó hơn chút nào.`
},
{
  id: 'qz-modern-023', topic: 'modern', multi: true,
  q: `{{keyword}} có thể là {{null}} (user không nhập ô tìm kiếm). Những dòng nào **không** ném exception lúc chạy? (Chọn 3)
~~~java
String keyword = request.param("q");            // có thể null

Optional<String> a = Optional.ofNullable(keyword);
Optional<String> b = Optional.of(keyword);
int len1 = keyword.length();
Optional<String> c = Optional.ofNullable(keyword).map(String::trim);
boolean has = Objects.nonNull(keyword);
~~~`,
  options: [
    `Dòng gán a hợp lệ: ofNullable được thiết kế để nhận null`,
    `Dòng gán b hợp lệ: Optional sẽ tự chứa giá trị rỗng khi keyword null`,
    `Dòng gán c không ném exception vì map chỉ chạy khi có giá trị`,
    `Dòng len1 không ném exception vì length() tồn tại trên mọi String`,
    `Dòng has không ném exception`
  ],
  answer: [0, 2, 4],
  explain: `**Đáp án đúng: {{a}}, {{c}} và {{has}} — ba dòng dùng {{ofNullable}}, {{map}} trên Optional rỗng, và {{Objects.nonNull}}.**

### Optional tồn tại để làm gì
{{Optional<T>}} là wrapper nói "kết quả có thể **không có**", buộc caller xử lý thiếu thay vì nhận {{null}}. Nó chỉ có hai trạng thái: chứa giá trị **khác null**, hoặc rỗng.

### Vì sao ba dòng an toàn
- {{Optional.ofNullable(keyword)}}: đây chính là API dành cho giá trị có thể {{null}}; {{null}} → {{Optional.empty()}}.
- {{Optional.ofNullable(keyword).map(String::trim)}}: trên Optional **rỗng**, {{map}}/{{filter}}/{{ifPresent}} là no-op — hàm bên trong **không được gọi**, nên {{String::trim}} không bao giờ chạy trên {{null}}. Đây là "lazy" theo nghĩa pipeline: chỉ phần present mới bị tác động.
- {{Objects.nonNull(keyword)}}: một static method nhận {{Object}}, chỉ so sánh với {{null}} — không dereference gì cả.

### Vì sao hai dòng ném exception
- {{Optional.of(null)}} ném **{{NullPointerException}} ngay tại dòng tạo Optional** (hợp đồng {{Objects.requireNonNull}}). Ý "Optional sẽ tự chứa giá trị rỗng" là sai: nó **không có** trạng thái "chứa null". Bẫy ở đây là exception xảy ra **lúc build**, không phải lúc bạn gọi {{get()}}/{{isPresent()}}, nên stack trace trông như "code null-check lại NPE".
- {{keyword.length()}} là dereference trực tiếp trên {{null}} → {{NullPointerException}}.

> Senior tip: ở ranh giới hệ thống (HTTP param, cột nullable, kết quả RPC) hãy đổi {{null}} thành {{Optional}} **một lần** rồi làm việc với {{Optional}}: {{Optional.ofNullable(v).map(...).orElse("")}} hoặc {{.orElseThrow(() -> new BadRequestException("thiếu q"))}}. Tránh ba anti-pattern: {{Optional.of}} với giá trị có thể null; {{Optional}} làm **tham số method** hoặc **field entity** (không {{Serializable}}, tốn object, không dùng được với JPA/DTO phổ biến); và {{ifPresent(x -> ...)}} rồi {{else throw}} — viết {{ifPresentOrElse}} hoặc {{orElseThrow}} rõ ràng hơn. {{Objects.requireNonNullElse(keyword, "")}} cũng là lựa chọn ngắn gọn khi bạn không cần Optional.`
},
{
  id: 'qz-modern-024', topic: 'modern',
  q: `Đoạn code sau in ra gì? (Java 21)
~~~java
Stream.iterate(1, x -> x < 8, x -> x * 2)
      .forEach(x -> System.out.print(x + " "));
~~~`,
  options: [
    `1 2 4 8 (mỗi phần tử được phát ra rồi mới kiểm tra điều kiện)`,
    `2 4 (seed bị đưa qua next trước khi phát)`,
    `In vô hạn: 1 2 4 8 16 32 ... vì iterate luôn tạo stream vô hạn`,
    `1 2 4 (mỗi số kèm một dấu cách, nên có dấu cách ở cuối)`
  ],
  answer: 3,
  explain: `**Đáp án đúng: {{1 2 4}} (kèm dấu cách cuối).**

### Ba tham số của {{Stream.iterate}} nghĩa là gì
Overload {{iterate(seed, hasNext, next)}} được thêm trong **Java 9**; bản Java 8 chỉ có {{iterate(seed, f)}} và luôn tạo stream **vô hạn** (buộc phải {{limit(n)}}). Hợp đồng của bản ba tham số: {{seed}} được **kiểm tra điều kiện trước**, nếu đạt thì phát; sau đó {{next}} sinh giá trị mới, giá trị mới lại được kiểm tra rồi mới phát — lặp cho đến khi điều kiện trả {{false}}.

### Bấm từng bước
~~~text
x = 1 : hasNext(1) = 1 < 8  -> true   -> phát 1
x = 2 : hasNext(2)          -> true   -> phát 2
x = 4 : hasNext(4)          -> true   -> phát 4
x = 8 : hasNext(8) = 8 < 8  -> false  -> KHÔNG phát, dừng
~~~
Vì {{forEach}} in {{x + " "}} nên kết quả thật là "{{1 2 4 }}" — có một dấu cách cuối, chi tiết hay bị hỏi để kiểm tra bạn có đọc kỹ không.

### Vì sao các phương án còn lại sai
- **{{1 2 4 8}}**: tưởng điều kiện chạy **sau khi** phát (dạng {{do ... while}}); ở đây nó chạy trước, nên 8 bị loại.
- **{{2 4}}**: {{seed}} không bị "ăn"; nó là phần tử đầu tiên được xét.
- **In vô hạn**: chỉ đúng với overload hai tham số; ở đây {{hasNext}} là trần dừng.

> Senior tip: {{hasNext}} không được bảo đảm sẽ bao giờ trả {{false}}. Ví dụ {{Stream.iterate(0L, x -> x != 100L, x -> x + 3L)}} nhảy 0, 3, 6... và **không bao giờ** chạm 100, nên stream chạy vĩnh viễn; các điều kiện kiểu "{{!=}}" hoặc dựa trên tràn số là nguồn treo production khó hiểu. An toàn: luôn thêm {{limit(n)}} như một "cầu dao", hoặc dùng {{IntStream.range}}/{{IntStream.rangeClosed}} khi biết trước số lượng. {{iterate}} cũng **không song song hoá tốt** (mỗi phần tử phụ thuộc phần tử trước, spliterator không ước lượng được kích thước để chia đoạn); cần {{parallel}} thì chuyển sang {{range}}/{{generate}}.`
},

// ===================== concurrency =====================
{
  id: 'qz-concurrency-021', topic: 'concurrency',
  q: `Ứng dụng khởi động 3 adapter song song rồi phải chờ cả 3 sẵn sàng mới nhận traffic. Một adapter thiếu cấu hình nên {{connect()}} ném exception. Điều gì xảy ra?
~~~java
CountDownLatch ready = new CountDownLatch(3);
for (Adapter a : adapters) {
    pool.submit(() -> {
        try {
            a.connect();                 // ném IllegalStateException
            ready.countDown();
        } catch (Exception e) {
            log.error("adapter fail", e);
        }
    });
}
ready.await();
markReady();
~~~
`,
  options: [
    `markReady() chạy sớm hơn dự kiến, vì await() chỉ cần count giảm được 1 là trả về`,
    `pool tự chuyển exception sang main thread nên await() bị hủy theo`,
    `await() chờ 60 giây rồi trả về, vì mọi latch đều có timeout mặc định`,
    `await() treo vĩnh viễn: adapter lỗi không countDown nên count dừng ở 1 và không bao giờ về 0`
  ],
  answer: 3,
  explain: `**Đáp án đúng: await() treo vĩnh viễn vì count không bao giờ về 0.**

### CountDownLatch hoạt động thế nào
Latch là một bộ đếm **chỉ giảm**: {{countDown()}} trừ 1, {{await()}} chặn cho tới khi count về 0 rồi đánh thức mọi thread đang chờ. Count không tăng lại được nên latch dùng **một lần**. Câu hỏi duy nhất nó trả lời là "đã đủ N sự kiện chưa?".

### Bấm từng bước
~~~text
count = 3
adapter A ok  -> countDown -> 2
adapter B ok  -> countDown -> 1
adapter C     -> connect() ném exception -> vào catch, log, KHÔNG countDown -> count vẫn 1
main          -> await(): count != 0 -> park, không có ai đánh thức -> treo vĩnh viễn
~~~
Bug nằm ở chỗ {{countDown()}} đặt **trong try, sau câu có thể ném exception**. Nó phải chạy trên **mọi đường ra** của task:
~~~java
try { a.connect(); }
catch (Exception e) { log.error("adapter fail", e); }
finally { ready.countDown(); }   // kể cả khi throw, kể cả khi return sớm
~~~

### Vì sao các phương án còn lại sai
- **await trả về khi count giảm 1**: nhầm sang {{Semaphore}}/{{CyclicBarrier}}; {{await()}} chỉ thoát khi count **bằng 0**.
- **pool chuyển exception cho main**: {{submit()}} bọc exception vào {{Future}}; nếu không ai gọi {{future.get()}} thì exception **không bao giờ lộ ra** — đây là cái bẫy thứ hai của đoạn code (lỗi bị nuốt, chỉ còn dòng log).
- **Có timeout mặc định**: {{await()}} không tham số chờ vô hạn; muốn có trần phải gọi {{await(10, TimeUnit.SECONDS)}} rồi kiểm tra {{ready.getCount()}} và fail-fast.

> Senior tip: hai quy tắc: (1) {{countDown()}} luôn nằm trong {{finally}}; (2) code khởi động không được có {{await()}} nào thiếu timeout — main thread treo làm app mãi không {{markReady()}}, readiness probe trên Kubernetes báo đỏ vĩnh viễn mà process vẫn "sống" nên không ai restart. Dấu hiệu khi debug: thread dump cho thấy main ở trạng thái WAITING trong {{CountDownLatch$Sync}}. Với bài toán "khởi động N thành phần", {{CompletableFuture.allOf(...)}} hoặc {{invokeAll(...)}} tốt hơn latch vì lấy được exception của **từng** task để báo lỗi cấu hình ngay lúc boot.`
},
{
  id: 'qz-concurrency-022', topic: 'concurrency',
  q: `Job chạy mỗi 60 giây để dọn đơn hàng quá hạn. Lúc 03:00 DB trượt kết nối một lần và {{findExpired()}} ném exception; từ đó job **không bao giờ chạy nữa** và scheduler cũng không log gì. Vì sao?
~~~java
ScheduledExecutorService ses = Executors.newSingleThreadScheduledExecutor();
ScheduledFuture<?> sf = ses.scheduleAtFixedRate(
    () -> orders.findExpired().forEach(o -> rebuild(o)),
    0, 60, TimeUnit.SECONDS);
~~~
`,
  options: [
    `Chỉ lần chạy đó hỏng; các lần sau vẫn được lên lịch bình thường vì period vẫn còn hiệu lực`,
    `Task bị gỡ khỏi lịch vĩnh viễn: mọi lần chạy sau một lần exception thoát ra đều bị hủy, còn exception nằm im trong ScheduledFuture`,
    `Worker thread đã chết nên toàn bộ executor bị vô hiệu; mọi task khác cũng submit thất bại`,
    `JDK tự retry task lỗi 3 lần theo backoff rồi mới hủy lịch`
  ],
  answer: 1,
  explain: `**Đáp án đúng: exception làm task bị gỡ khỏi lịch vĩnh viễn, và không ai đọc exception nên im lặng.**

### Cơ chế
Javadoc của {{ScheduledExecutorService}} nói thẳng: "If any execution of the task encounters an uncaught exception, **subsequent executions are suppressed**". Nghĩa là:
1. Exception thoát ra khỏi {{Runnable}} → {{ScheduledFuture}} được hoàn thành ở trạng thái **exceptionally**.
2. Task định kỳ bị loại khỏi hàng đợi lịch của executor — không có lần chạy thứ hai, vô điều kiện.
3. Exception không in ra đâu cả vì nó được **cất vào Future**. Muốn xem phải gọi {{sf.get()}} (ném {{ExecutionException}}); nếu không gọi thì nó nằm im tới khi GC.
4. {{UncaughtExceptionHandler}} của thread cũng **không** chạy, vì exception đã bị executor bắt lại chứ không truyền tới {{Thread}}.

### Sửa
Bọc **cả** thân task trong try/catch {{Throwable}} để không gì thoát ra ngoài:
~~~java
ses.scheduleAtFixedRate(() -> {
    try { rebuildExpiredOrders(); }
    catch (Throwable t) {                 // Throwable, không phải Exception
        log.error("job failed", t);       // Error như NoClassDefFoundError cũng bị nuốt
        metrics.increment("jobs.expired_rebuild.failures");
    }
}, 0, 60, TimeUnit.SECONDS);
~~~
Có thể biến nó thành wrapper dùng chung cho mọi job ({{Runnable guarded = SafeRunner.wrap(task, name)}}) để không phụ thuộc kỷ luật từng dev.

### Vì sao các phương án còn lại sai
- **Chỉ mất một lần chạy**: sai, mất **tất cả** các lần sau.
- **Cả executor chết**: worker thread được pool tạo lại/tiếp tục phục vụ task khác; chỉ task gây lỗi bị hủy lịch.
- **Tự retry 3 lần**: executor không có khái niệm retry, đó là thứ bạn phải tự viết.

> Senior tip: so sánh để tránh nhầm: {{java.util.Timer}} còn tệ hơn — một exception trong {{TimerTask}} làm **chết cả Timer**, mọi task khác mất luôn; còn Spring {{@Scheduled}} mặc định bọc try/catch và log ERROR nên các lần sau vẫn chạy. Dấu hiệu nhận biết ngoài production: job "biến mất trong im lặng" — vì vậy mỗi job định kỳ phải có **heartbeat metric** ({{last_success_timestamp}}) và alert khi stale quá 2 lần period; hoặc soi JMX {{java.util.concurrent:type=ScheduledThreadPoolExecutor}} thấy {{CompletedTaskCount}} đứng yên. Đừng lấy {{sf.isDone()}} làm nhịp sống chính: sau khi lỗi thì future chuyển sang done thật, nhưng một job chỉ chạy chậm cũng dễ khiến bạn đọc nhầm cờ này.`
},
{
  id: 'qz-concurrency-023', topic: 'concurrency', multi: true,
  q: `Review một class dùng toàn {{synchronized}}. Những phát biểu nào **đúng**? (Chọn 3)
~~~java
public class OrderService {
    private static final String LOCK = "ORDERS";
    public static synchronized void rebuildAll() { ... }
    public synchronized void save(Order o) { ... }
    public void publish(Order o) {
        synchronized (LOCK) { queue.add(o); }
    }
}
~~~
`,
  options: [
    `rebuildAll() khoá trên object OrderService.class, nên hai instance khác nhau vẫn loại trừ lẫn nhau`,
    `Monitor có tính reentrant: thread đang giữ lock vẫn vào được code khác dùng cùng lock mà không tự chặn mình`,
    `Khóa trên LOCK là String literal thì an toàn vì literal đã intern và không bao giờ đổi giá trị`,
    `Thread đang blocked chờ vào một khối synchronized có thể bị đánh thức bằng thread.interrupt()`,
    `Gọi LOCK.wait() khi không giữ monitor của LOCK ném IllegalMonitorStateException`
  ],
  answer: [0, 1, 4],
  explain: `**Đáp án đúng: lock của static method là Class object, monitor reentrant, và wait() bắt buộc phải giữ monitor.**

### Monitor là gì
Mọi object Java đi kèm một **monitor**: một vé loại trừ lẫn nhau (chỉ một thread giữ tại một thời điểm) cộng một **wait set** (danh sách thread đang {{wait()}}). Token của lock chính là **tham chiếu object** được chỉ định.

### Vì sao các đáp án được chọn là đúng
- **{{static synchronized}} → lock trên {{OrderService.class}}**: vì method static không có {{this}}, JVM dùng {{Class}} object làm monitor. Hai thread trên hai instance **vẫn** loại trừ nhau. Ngược lại {{save()}} lock trên {{this}}: hai instance khác nhau chạy **song song**, không chặn nhau — đây là chỗ hay bị hiểu nhầm khi cần invariant toàn cục.
- **Reentrant**: monitor đếm số lần acquire theo thread, nên thread đã giữ lock có thể vào lại vùng cùng lock (method gọi method) mà không tự deadlock. Nhờ vậy code lồng nhau viết đơn giản.
- **{{wait()}} yêu cầu giữ monitor**: nó phải thêm thread vào wait set của chính object đó, nên gọi ngoài {{synchronized}} sẽ ném {{IllegalMonitorStateException}} ngay.

### Vì sao các phương án còn lại sai
- **String literal an toàn**: literal được **intern trong toàn JVM**, nên bất kỳ class nào khác khóa trên chuỗi "ORDERS" y hệt sẽ dùng **chung monitor** với bạn — coupling vô hình, contention khó hiểu, và nếu ai đó truyền tham chiếu này ra ngoài thì họ giữ lock của bạn được. Chuẩn: {{private static final Object LOCK = new Object();}} (object không thể tình cờ bị chia sẻ).
- **Interrupt được khi blocked ở {{synchronized}}**: acquisition của monitor là khối **không interruptible**; {{interrupt()}} chỉ được ghi cờ và thread vẫn chờ tới khi lấy được lock. Cần khả năng hủy thì dùng {{ReentrantLock.lockInterruptibly()}} (hoặc {{tryLock}} có timeout). Lưu ý phân biệt: {{wait()}} thì **có** phản ứng với interrupt (ném {{InterruptedException}}).

> Senior tip: hai hệ quả thực chiến: (1) một {{synchronized}} bọc gọi RPC/DB có thể làm **treo cả pool thread** — mọi request khác queue lại phía sau, và vì không interrupt được nên {{ExecutorService.shutdownNow()}}, timeout của client, hay cancel request đều không cứu được; vì vậy chỉ giữ những dòng thật sự cần nằm trong monitor và không gọi ra ngoài (RPC, DB) trong đó. (2) Trong thread dump, deadlock kiểu này hiện ra là nhóm "waiting to lock" cùng một monitor mà chính holder cũng đang chờ lock khác — JVM in "Found one Java-level deadlock" cho monitor lẫn {{ReentrantLock}}, nhưng **không** phát hiện được deadlock "tự chờ" như upgrade read-lock sang write-lock.`
},
{
  id: 'qz-concurrency-024', topic: 'concurrency',
  q: `Cache dùng {{ReentrantReadWriteLock}}. Hai thread cùng đọc và **cùng** thấy key chưa có. Điều gì xảy ra?
~~~java
rw.readLock().lock();
try {
    if (cache.get(key) == null) {
        rw.writeLock().lock();               // cố "upgrade"
        try { cache.put(key, loadFromDb(key)); }
        finally { rw.writeLock().unlock(); }
    }
    return cache.get(key);
} finally {
    rw.readLock().unlock();
}
~~~
`,
  options: [
    `Cả hai treo vĩnh viễn: write lock không cấp khi còn read lock chưa nhả, mà read lock đó chính hai thread này đang giữ`,
    `T2 lấy được write lock ngay vì read lock tự động nhả khi thread xin write lock`,
    `T2 ném IllegalMonitorStateException vì đang giữ read lock mà xin write lock`,
    `Code đúng, chỉ chậm hơn: write lock sẽ chờ cho tới khi read lock của thread kia hết hạn`
  ],
  answer: 0,
  explain: `**Đáp án đúng: T1 và T2 deadlock lẫn nhau vì không có upgrade read → write.**

### Đọc cơ chế
{{ReentrantReadWriteLock}} cho **nhiều** thread giữ read lock đồng thời, nhưng write lock là độc quyền: nó chỉ được cấp khi **không còn** read lock nào. Javadoc ghi rõ lớp khóa này **không hỗ trợ upgrade** read lock thành write lock — tức là đang giữ read mà xin write thì bạn tự chặn chính mình.

Diễn biến:
~~~text
T1: readLock OK (đếm readers = 2 cùng T2) -> xin writeLock -> blocked, chờ readers nhả
T2: readLock OK                                  -> xin writeLock -> blocked, chờ readers nhả
 readers hiện tại = {T1, T2}, và cả hai đang blocked nên không ai nhả
 -> vòng chờ kín, không timeout, không exception
~~~
Điểm đau: đây là deadlock **không có chủ** (write lock chưa thuộc về ai), nên công cụ dò deadlock kiểu {{ThreadMXBean.findDeadlockedThreads()}} dễ bỏ sót; thread dump chỉ hiện hai thread {{WAITING (parking)}} trong {{writeLock().lock()}} và bạn phải tự nhận ra họ đang giữ read lock ({{getHoldCount()}} của read lock > 0).

### Sửa
Nhả read lock **trước** khi xin write, rồi kiểm tra lại điều kiện sau khi có write (double-check), vì có thể thread khác đã load xong trong lúc mình chờ:
~~~java
rw.readLock().lock();
boolean absent;
try { absent = cache.get(key) == null; }
finally { rw.readLock().unlock(); }
if (absent) {
    rw.writeLock().lock();
    try { if (cache.get(key) == null) cache.put(key, loadFromDb(key)); }
    finally { rw.writeLock().unlock(); }
}
~~~
Sau khi **giữ write** rồi muốn đọc tiếp thì được phép **downgrade** (lấy read, nhả write) — chiều đó JDK hỗ trợ.
Cách gọn hơn cho đúng bài toán "load-once theo key": bỏ hẳn lock, dùng {{ConcurrentHashMap.computeIfAbsent}} (chỉ chạy function khi key thiếu, nguyên tử theo bin — nhưng nhớ mapping function phải ngắn, không I/O chậm) hoặc {{StampedLock}} với {{tryConvertToWriteLock}} / {{tryOptimisticRead}}, hoặc pattern immutable snapshot + {{AtomicReference}}.

### Vì sao các phương án còn lại sai
- **Read lock tự nhả khi xin write**: không có cơ chế đó; nó vẫn được tính là reader đang giữ.
- **Ném exception**: xin lock sai tư thế không ném gì cả, nên lỗi biểu hiện bằng **treo**, không bằng log.
- **Chỉ chậm hơn**: "write lock chờ read lock hết hạn" là vô nghĩa — read lock không có hạn, nó chỉ hết khi {{unlock()}}.

> Senior tip: nếu vẫn muốn dùng RWLock, đừng upgrade mà dùng {{tryLock(timeout)}} cho write: hết thời gian thì trả về "cache miss, đọc trực tiếp từ DB" thay vì treo; có timeout là biến deadlock thành degradation. Và nên nhớ read lock **không** miễn phí: mỗi lần {{lock()}}/{{unlock()}} là một lần CAS trên state dùng chung (cache line nóng), nên với cache nhỏ+đọc nhiều, {{StampedLock}} optimistic read hoặc map concurrent thường nhanh hơn và không có cửa deadlock.`
},

// ===================== jvm =====================
{
  id: 'qz-jvm-021', topic: 'jvm', multi: true,
  q: `Property {{app.timeout}} không được truyền vào container nên {{parseInt}} ném exception. Hai endpoint của **cùng một JVM** đọc {{Config.TIMEOUT}} theo thứ tự, mỗi chỗ đều {{catch (Throwable t)}} rồi log tên class của exception. Những phát biểu nào **đúng**? (Chọn 3)
~~~java
class Config {
    static final int TIMEOUT = Integer.parseInt(System.getProperty("app.timeout", "abc"));
}
~~~
`,
  options: [
    `Lần đọc đầu tiên ném ExceptionInInitializerError, mọi lần đọc sau ném NoClassDefFoundError kèm message "Could not initialize class Config"`,
    `TIMEOUT không phải compile-time constant nên đọc nó kích hoạt initialization; nếu viết static final int TIMEOUT = 30 thì javac đã in hằng số vào caller và không kích hoạt gì cả`,
    `Class.forName("Config") một tham số chỉ load class chứ chưa chạy static initializer`,
    `JVM chỉ chạy <clinit> một lần cho mỗi class trong một classloader; class đã bị đánh dấu lỗi nên mọi lần truy cập sau cũng thất bại, phải khởi động lại process`,
    `int có giá trị mặc định 0 nên lần đọc thứ hai trả về 0, endpoint số hai vẫn chạy bình thường`
  ],
  answer: [0, 1, 3],
  explain: `**Đáp án đúng: ExceptionInInitializerError rồi NoClassDefFoundError, constant mới được in-lined, và static initializer chỉ chạy đúng một lần.**

### Class đi qua những bước nào
1. **Loading**: tìm bytecode, dựng {{Class}} object, chuyển vào metaspace.
2. **Linking**: verify (kiểm tra bytecode), **prepare** (cấp bộ nhớ cho static field và gán **giá trị mặc định của kiểu**: 0, null — chưa chạy code của bạn), resolve.
3. **Initialization**: chạy {{<clinit>}} — tức là các static initializer và static block, **theo đúng thứ tự khai báo trong file**.

{{<clinit>}} chạy **đúng một lần** cho mỗi (class, classloader), dưới một **initialization lock** của riêng class đó (JVMS 5.5). Kết quả được ghi lại: thành công (mark = initialized) hoặc thất bại (mark = erroneous).

### Diễn biến trong tình huống này
~~~text
Endpoint A: getstatic Config.TIMEOUT -> class chưa init -> chạy <clinit>
            -> NumberFormatException -> JVM wrap: ExceptionInInitializerError(cause=NumberFormatException)
            -> Config bị đánh dấu ERRONEOUS
Endpoint B: getstatic -> class erroneous -> NoClassDefFoundError: Could not initialize class Config
            (cause gốc KHÔNG còn trong stack trace!)
~~~
Vì sao các đáp án còn lại sai:
- **{{Class.forName("Config")}}** phiên bản một tham số tương đương {{forName(name, true, loader)}} → **có** initialize. Muốn chỉ load thì phải dùng bản ba tham số với {{initialize = false}}.
- **Trả về 0**: trạng thái "prepare" (mọi static = 0) là **trước** init; khi class erroneous thì không lần đọc nào được phép trả giá trị — nó ném tiếp {{NoClassDefFoundError}} mãi mãi.

### Vì sao "constant" là ngoại lệ
JVMS định nghĩa *constant expression* (primitive/String, chỉ gồm hằng số và phép toán không gọi method). {{static final int TIMEOUT = 30;}} là constant → javac nhét thẳng value vào bytecode của class dùng nó (thuộc tính {{ConstantValue}}), field không còn được đọc bằng {{getstatic}} nên **không** kích hoạt init. {{Integer.parseInt(...)}} là lời gọi method → không phải constant → kích hoạt init, dù field là {{final}}.

> Senior tip: đây là nguồn của incident "endpoint thứ hai lỗi lạ hơn endpoint thứ nhất": stack trace thứ hai **mất cause**, người ta đi debug sai chỗ. Ba phòng ngừa: (1) đừng làm I/O (đọc file, gọi vault, parse config) trong {{<clinit>}} — hãy để nó trong một method {{init()}} gọi tường minh lúc boot để fail-fast và log đủ nguyên nhân; (2) nếu vẫn dùng static init, ở boot hãy "chạm" class và catch {{ExceptionInInitializerError}} rồi in {{getCause()}}; (3) nhớ initialization lock cũng có thể gây **deadlock** khi hai thread ở hai class khởi tạo chéo nhau (A đang chạy {{<clinit>}} cần B, B đang chạy {{<clinit>}} cần A); thread dump hiện {{BLOCKED}}, "waiting to lock" trên một {{java.lang.Class}} — dễ đọc nhầm thành lỗi khóa thông thường.`
},
{
  id: 'qz-jvm-022', topic: 'jvm',
  q: `Bật sampling cấp phát (async-profiler {{-e alloc}} / JFR) trên một method **đang nóng** thì gần như không thấy object nào được tạo, dù code rõ ràng allocate mỗi lần gọi. Chạy lại với {{-Xint}} (chỉ interpreter) thì vòng nào cũng thấy {{Point}} mới. Giải thích khả dĩ nhất?
~~~java
public double distance(Point p) {
    Point copy = new Point(p.x, p.y);   // không thoát ra ngoài method
    return Math.hypot(copy.x, copy.y);
}
~~~
`,
  options: [
    `GC đã dọn hết trước khi profiler kịp ghi mẫu, vì object nhỏ chỉ nằm trong Eden vài ms`,
    `C2 thấy object không thoát ra ngoài nên thay bằng các biến cục bộ (scalar replacement): field nằm trong thanh ghi/stack frame, không có cấp phát trên heap`,
    `JVM tự intern mọi object immutable value class nên chỉ tồn tại một instance dùng chung`,
    `Ở chế độ thường object được lấy sẵn từ TLAB đã chia cho thread, nên chỉ lần gọi đầu tiên là cấp phát thật`
  ],
  answer: 1,
  explain: `**Đáp án đúng: escape analysis + scalar replacement của JIT compiler.**

### "Escape" là gì và cơ chế hoạt động
JIT (C2) phân tích xem **reference** của object vừa tạo có "thoát" khỏi phạm vi compile của method hay không. Nó thoát khi bạn:
- trả object về cho caller, gán vào field của object khác đang sống, cho vào collection/static,
- truyền nó cho method mà C2 **không inline** được,
- công khai cho thread khác (kể cả qua {{BlockingQueue}}).

Nếu không thoát, thì object thực chất chỉ là **tập hợp các giá trị cục bộ**: C2 tách nó ra ("scalar replace") và giữ từng field trong thanh ghi hoặc slot của stack frame. Không có object trên heap → không có gì để GC dọn, và vòng {{for}} của benchmark trông như "miễn phí".
Đi kèm là **lock elision**: {{synchronized}} trên object không thoát bị loại bỏ hẳn, vì không ai khác có thể thấy object đó.

### Vì sao {{-Xint}} lại khác
{{-Xint}} vô hiệu JIT: code chạy interpreter, không có phân tích nào cả nên mỗi vòng đều {{new}} thật. Ở chế độ thường, tối ưu chỉ xuất hiện **sau khi** method đủ nóng để được C2 compile và các callee được inline — vì vậy đo "{{-Xint}} so với bình thường" hay "vòng đầu so với vòng thứ một triệu" cho kết luận khác nhau hoàn toàn.

### Vì sao các phương án còn lại sai
- **GC dọn trước khi kịp ghi**: sampling cấp phát ghi sự kiện tại **thời điểm object được tạo** (khi bump con trỏ TLAB), không phải lúc GC; object chết nhanh vẫn được đếm.
- **Intern object**: chỉ {{String}} intern theo yêu cầu ({{intern()}}, constant pool); không có cơ chế tự share object theo giá trị.
- **TLAB share sẵn**: TLAB là một vùng heap đã xin trước cho thread, mỗi {{new}} vẫn là một lần bump pointer và vẫn sinh event cấp phát; nó không phải object pool.

> Senior tip: hai hệ quả thực dụng. (1) **Đừng viết object pool / tái chế object để "giảm GC"** cho object nhỏ, short-lived: {{new}} trong TLAB chỉ vài nano giây, young GC với object đã chết gần như miễn phí; pool thêm field giữ tham chiếu, dễ gây leak và còn **ngăn** scalar replacement vì object giờ sống lâu và chia sẻ. (2) Tối ưu này là **opportunistic**: thêm một dòng log có placeholder, đổi method thành lớn hơn, hay caller không inline được cũng làm cấp phát **quay lại** giữa hai build. Vì vậy khi tối ưu allocation, hãy đo allocation rate ({{jcmd PID GC.class_histogram}}, async-profiler {{-e alloc}}, JFR {{jdk.ObjectAllocationInNewTLAB}}) trên bản build thật, thay vì tin rằng "object nhỏ thì JVM tự lo". Lưu ý thêm: object **không** escape nhưng quá to, hoặc có field dạng array thay đổi động, cũng thường bị bỏ qua.`
},
{
  id: 'qz-jvm-023', topic: 'jvm',
  q: `Service đọc nguyên file lên bộ nhớ: mỗi request cấp phát một {{byte[]}} khoảng 6 MB. Heap 8 GB, {{-XX:G1HeapRegionSize=4m}}. GC log có dòng {{Pause Young ... (G1 Humongous Allocation)}} và số humongous regions tăng đều, thỉnh thoảng {{Pause Full}}. Điều gì đang xảy ra?
~~~text
[gc] GC(118) Pause Young (Mixed) (G1 Humongous Allocation) 6215M->5980M(8192M) 41.2ms
[gc,heap] GC(118) Humongous regions: 1542->1540
~~~
`,
  options: [
    `Mảng 6 MB lớn hơn young gen nên bị đẩy thẳng vào old gen, đó là hành vi bình thường của G1`,
    `G1 luôn copy mọi object sống nên chỉ là pause dài hơn một chút, không cần quan tâm`,
    `JVM tự tăng region size khi thấy object lớn, các dòng log này thuộc giai đoạn warm-up`,
    `Mảng 6 MB vượt quá nửa region (2 MB) nên bị xếp là humongous: nó chiếm một chuỗi region liên tiếp, nằm ngoài vòng thu gom young thông thường, và việc phải tìm chuỗi region trống liền mạch gây phân mảnh tới mức hết chỗ dù heap còn trống`
  ],
  answer: 3,
  explain: `**Đáp án đúng: object > 50% region size trở thành humongous object.**

### Region và ngưỡng humongous
G1 chia heap thành các **region** bằng nhau (mặc định chọn theo heap, từ 1 MB đến 32 MB; ở đây bạn ép 4 MB). Một region đóng vai trò eden/survivor/old, **hoặc** chứa một **humongous object**. Quy tắc: object có kích thước **lớn hơn 50% region size** (> 2 MB với region 4 MB) không vừa vào một region nên được gọi là humongous.

Nó được cấp phát ngay từ đầu vào một **chuỗi region liên tiếp**: region đầu (head) mang metadata, các region sau chỉ tiếp sức. Hệ quả:
- **Không đi qua young gen**: không được thu hồi "miễn phí" ở young GC như object short-lived bình thường; muốn dọn region humongous phải biết chắc không còn ai tham chiếu (JDK 9+ có eager reclaim cho trường hợp không còn reference, nhưng vẫn phải có cycle đủ thông tin).
- **Cần vùng trống liền mạch**: 6 MB cần **2 region liên tiếp** còn trống. Heap có thể còn 2 GB tự do nhưng xé vụn → không đủ chuỗi → allocation fail. Khi đó G1 hoặc phải bắt một concurrent cycle sớm, hoặc nếu hết cách thì **Full GC** — chính là dòng {{Pause Full}} trong log.
- **Copy đắt**: khi phải di chuyển, nó copy nguyên các region, pause tăng.

Vì vậy {{G1 Humongous Allocation}} xuất hiện thường xuyên = bạn đang tự tạo áp lực old gen và phân mảnh bằng các array lớn.

### Cách sửa (theo thứ tự nên thử)
- **Đừng nạp nguyên file vào RAM**: stream theo lát nhỏ ({{InputStream}}, buffer 64–128 KB), hoặc {{FileChannel.transferTo}} để copy không đi qua heap.
- **Tái sử dụng buffer** theo cách có kiểm soát (pool buffer, {{ArrayDeque}} + clear) hoặc dùng **direct ByteBuffer** (off-heap, không vào region nào).
- **Tăng region size**: {{-XX:G1HeapRegionSize=16m}} → ngưỡng 8 MB, mảng 6 MB thành object thường. Đánh đổi: độ mịn phân vùng giảm, dự báo pause kém chính xác hơn, heap nhỏ không nên dùng.

### Vì sao các phương án còn lại sai
- **Lớn hơn young gen nên bị đẩy vào old**: young gen ở đây lớn hơn 6 MB rất nhiều; vấn đề là **kích thước region**, không phải young gen.
- **Chỉ là pause dài hơn**: log có {{Pause Full}} và heap gần cạn — đó là dấu hiệu sự cố, không phải hành vi bình thường.
- **Tự tăng region size**: region size chốt **một lần lúc khởi động**, không bao giờ đổi khi đang chạy.

> Senior tip: hai chi tiết hay bị hỏi tiếp. (1) Ngưỡng "một nửa region" giải thích vì sao cùng một mảng 6 MB có thể là humongous hoặc không tùy {{-XX:G1HeapRegionSize}} — luôn kiểm tra bằng {{jcmd}} với lệnh {{VM.flags}} hoặc nhìn dòng {{Humongous regions}} trong {{-Xlog:gc+heap}}. (2) {{MaxGCPauseMillis}} quá tham (ví dụ 20 ms) làm G1 thu nhỏ young gen để giữ pause, khiến object còn sống bị đẩy lên old sớm hơn và làm vấn đề thêm nặng; nếu workload của bạn cố tình nhiều object khổng lồ, ZGC (không có mô hình region-copy theo kiểu này và pause không tỉ lệ với heap) thường là lựa chọn hợp lý hơn, nhưng hãy đo allocation rate trước khi đổi GC.`
},
{
  id: 'qz-jvm-024', topic: 'jvm',
  q: `Service Java 21 chạy với {{-Xmx31g}} rất ổn. Để "hết OOM", team nâng lên {{-Xmx48g}} trên cùng một node. Sau đó: RSS tăng **nhiều hơn** đúng tỉ lệ 48/31, throughput giảm khoảng 12–15%, trong khi GC log cho thấy số lần GC và lượng live data gần như không đổi. Nguyên nhân khả dĩ nhất?`,
  options: [
    `Trên 31 GB, G1 tự động chuyển sang thuật toán serial Full GC vì không đủ region để song song hóa`,
    `JVM tắt JIT khi heap vượt 32 GB để dành bộ nhớ cho object, code rơi về interpreter`,
    `Trên ngưỡng 32 GB, HotSpot thôi dùng compressed oops: mỗi field tham chiếu phình từ 4 lên 8 byte, object to ra, ít object nằm vừa một cache line và traffic RAM tăng`,
    `Linux chỉ address được 32 GB cho một tiến trình Java 64-bit, phần vượt bị swap`
  ],
  answer: 2,
  explain: `**Đáp án đúng: vượt ~32 GB thì compressed oops bị tắt, mọi object có tham chiếu đều to hơn.**

### Compressed oops là gì
"oop" = **ordinary object pointer**, cách JVM lưu một **tham chiếu tới object trên heap** trong field của object khác hoặc trong array. Ở JVM 64-bit, thay vì tốn 8 byte, HotSpot lưu có **4 byte** rồi giải mã khi dùng:
~~~text
address = HEAP_BASE + (stored_value << 3)
~~~
Phép dịch trái **3 bit** này hợp lệ vì mọi object được **align 8 byte**, nên 3 bit thấp luôn bằng 0 — nhờ đó 32 bit biểu diễn được vùng heap tới **2^32 × 8 = 32 GB**. Điều kiện: vùng heap (chính xác hơn là khoảng địa chỉ JVM reservation, tính cả phần reserved) nằm trong ngưỡng đó; ergonomics tự tắt compressed oops khi {{-Xmx}} vượt ~32 GB.

### Vì sao vượt ngưỡng lại chậm
| | heap ≤ 32 GB | heap > 32 GB |
|---|---|---|
| field tham chiếu | 4 byte | 8 byte |
| object ví dụ: header 12 + 3 ref | 12 + 12 = 24 byte | 12 + 24 = 36 → pad 40 byte |
| object chứa trong 64-byte cache line | nhiều hơn | ít hơn |
Hậu quả dây chuyền: heap "phình" hơn lượng live data thật, **nhiều bytes phải scan/copy hơn** mỗi lần GC, và **nhiều lần truy cập RAM hơn** vì một cache line chứa ít object sống. Đó là lý do throughput giảm dù số lần GC không đổi — hiện tượng quen tên "32 GB cliff".

### Kiểm chứng và cách xử lý
- Xem cờ thật sự đang bật: {{java -XX:+PrintCommandLineFlags -version}}, hoặc {{jcmd}} với lệnh {{VM.flags}} và tìm {{UseCompressedOops}}; MAT cũng báo "compressed oops" trong heap dump.
- **Giữ heap ≤ ~31 GB và chạy nhiều instance** (thường là đáp án đúng nhất cho service web: young GC nhỏ, blast radius nhỏ).
- {{-XX:ObjectAlignmentInBytes=16}} cho phép compressed oops với heap tới 64 GB, nhưng mọi object bị pad lên bội số 16 byte — thường lỗ cho workload nhiều object nhỏ.
- Đưa dữ liệu lớn ra **off-heap** (direct buffer, cache ngoài, RocksDB) hoặc dùng **ZGC** cho heap rất lớn, và đo lại.

### Vì sao các phương án còn lại sai
- **G1 chuyển sang serial Full GC**: Full GC của G1 đã đa luồng từ JDK 10 và region không phụ thuộc ngưỡng 32 GB.
- **Tắt JIT**: không tồn tại cơ chế đó; {{UseCompressedOops}} cũng không liên quan tới compiled code.
- **Linux chỉ address 32 GB**: tiến trình 64-bit address được hàng trăm TB; 32 GB chỉ là ngưỡng để **ép** tham chiếu còn 4 byte.

> Senior tip: có hai "nén" độc lập hay bị nhầm: **compressed oops** phụ thuộc **kích thước heap**, còn **compressed class pointers** (tham chiếu tới {{Klass}}) phụ thuộc **Metaspace** (mặc định vùng 2 GB) và vẫn bật dù heap lớn. Vì vậy đừng trả lời phỏng vấn "tắt vì heap > 32 GB nên class pointer cũng tắt". Ngoài ra, đây là ví dụ điển hình của việc "tăng {{-Xmx}}" được coi là sửa lỗi mà không hiểu nguyên nhân: nếu live set thực tế 40 GB thì heap 48 GB chỉ mua thời gian, còn nếu live set 20 GB thì nên xem lại vì sao {{-Xmx31g}} báo OOM — thường do fragmentation, do humongous allocation, hoặc do off-heap chứ không phải do heap thiếu.`
},
{
  id: 'qz-core-025', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
String a = "java";
String b = new String("java");
String c = b.intern();
System.out.println((a == b) + " " + (a == c) + " " + (a.equals(b)));
~~~`,
  options: [`true true true`, `false true true`, `false false true`, `true false true`],
  answer: 1,
  explain: `**Đáp án đúng: false true true.**

### Vì sao đúng
- {{a == b}}: {{new String("java")}} luôn tạo object mới trên heap → false.
- {{b.intern()}} trả về bản trong String pool; bản đó chính là object của literal {{a}} → {{a == c}} true.
- {{equals}} so sánh nội dung ký tự → true.

### Vì sao các phương án còn lại sai
- **true true true**: new String không trỏ vào pool.
- **false false true**: intern trả về bản pool.
- **true false true**: đảo ngược hai trường hợp.

> Senior tip: {{intern()}} hữu ích khi đọc rất nhiều chuỗi từ file/network để giảm bộ nhớ và tăng tốc so sánh bằng {{==}}, nhưng gọi intern trên mọi chuỗi là tốn CPU và làm phình pool. Java 7+ pool nằm trên heap và bị GC, nên không còn leak như Java 6 (khi pool ở PermGen).`
},
{
  id: 'qz-core-026', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
String s = "a" + "b" + 1 + 2;
System.out.println(s + " " + ("ab" + (1 + 2)));
~~~`,
  options: [`ab12 ab3`, `ab3 ab3`, `ab12 ab12`, `ab3 ab12`],
  answer: 0,
  explain: `**Đáp án đúng: ab12 ab3.**

### Vì sao đúng
- {{+}} với String là nối chuỗi; với số là cộng số. Phép tính từ trái sang phải: {{"a" + "b"}} = "ab", rồi {{+ 1}} = "ab1", rồi {{+ 2}} = "ab12".
- Ở biểu thức thứ hai, {{(1 + 2)}} được tính trước = 3, nên kết quả "ab3".

### Vì sao các phương án còn lại sai
- **ab3 ab3**: bỏ qua thứ tự tính toán và ưu tiên ngoặc.
- **ab12 ab12**: không tính ngoặc trước.
- **ab3 ab12**: đảo ngược.

> Senior tip: compiler gộp hằng số chuỗi lúc biên dịch (constant folding), nên {{"a" + "b" + "c"}} không tạo object trung gian. Với chuỗi build động trong vòng lặp, dùng {{StringBuilder}} hoặc {{String.join}}/{{Collectors.joining}}; từ Java 9 phép nối runtime dùng {{StringConcatFactory}} (invokedynamic) nên thường không cần tự tối ưu.`
},
{
  id: 'qz-collections-025', topic: 'collections',
  q: `HashMap resize khi nào và chi phí ra sao?`,
  options: [
    `Khi size > capacity * loadFactor (mặc định 0.75); tạo bảng mới gấp đôi, rehash toàn bộ entry, O(n)`,
    `Khi số bucket đầy, thêm bucket mới vào cuối bảng`,
    `Khi một bucket có nhiều hơn 8 phần tử, resize ngay`,
    `Không bao giờ resize nếu dùng new HashMap<>(n)`
  ],
  answer: 0,
  explain: `**Đáp án đúng: resize khi size > capacity * loadFactor.**

### Vì sao đúng
Mặc định capacity 16, load factor 0.75, threshold 12. Khi thêm phần tử thứ 13, HashMap tạo bảng mới capacity 32 và **rehash** mọi entry (tính lại bucket theo capacity mới). Chi phí O(n) và có thể gây pause ngắn trong hot path.

### Vì sao các phương án còn lại sai
- **Thêm bucket cuối bảng**: HashMap là mảng cố định kích thước luỹ thừa 2, không linked list bucket.
- **Treeify khi 8 phần tử**: treeify chuyển linked list thành cây đỏ-đen trong bucket, không resize bảng.
- **new HashMap<>(n) không resize**: constructor nhận capacity, không phải số phần tử; vẫn có thể resize nếu size vượt threshold.

> Senior tip: pre-size bằng {{HashMap.newHashMap(expectedSize)}} (Java 19+) để tránh resize. Treeify threshold 8 và untreeify 6; bucket chuyển cây khi chuỗi va chạm dài, giúp get từ O(n) về O(log n).`
},
{
  id: 'qz-collections-026', topic: 'collections',
  q: `ConcurrentHashMap.putIfAbsent khác gì so với computeIfAbsent về locking?`,
  options: [
    `putIfAbsent không gọi mapping function nên không giữ lock bin trong lúc tính; computeIfAbsent giữ lock bin suốt function`,
    `Cả hai đều khoá toàn bộ map`,
    `putIfAbsent luôn gọi function kể cả khi key có`,
    `computeIfAbsent không nguyên tử`
  ],
  answer: 0,
  explain: `**Đáp án đúng: putIfAbsent không chạy function giữ lock.**

### Vì sao đúng
{{putIfAbsent(k, v)}} chỉ so sánh và gán giá trị đã có sẵn, không chạy function. {{computeIfAbsent(k, mappingFunction)}} phải giữ lock bin để đảm bảo function chạy **tối đa một lần** cho mỗi key, nên function phải ngắn và không I/O.

### Vì sao các phương án còn lại sai
- **Khoá toàn bộ map**: ConcurrentHashMap khoá ở mức bin.
- **putIfAbsent luôn gọi function**: không có function trong putIfAbsent.
- **computeIfAbsent không nguyên tử**: ngược lại, nó nguyên tử.

> Senior tip: để cache giá trị tốn kém, dùng {{computeIfAbsent(k, x -> CompletableFuture.supplyAsync(...))}} hoặc Caffeine AsyncLoadingCache để không block bin.`
},
{
  id: 'qz-modern-025', topic: 'modern',
  q: `Record sau có những đặc điểm nào?
~~~java
public record Money(String currency, long amount) { }
~~~`,
  options: [
    `Là final class, component là private final, có constructor canonical, equals/hashCode/toString tự sinh`,
    `Có thể kế thừa class khác`,
    `Component có thể gán lại`,
    `Không có constructor`
  ],
  answer: 0,
  explain: `**Đáp án đúng: record là final, component final, tự sinh method.**

### Vì sao đúng
Record (Java 16) là **transparent carrier** cho dữ liệu bất biến: class final, component private final, có canonical constructor, và tự sinh equals/hashCode/toString/accessor. Có thể thêm compact constructor để validate/normalize.

### Vì sao các phương án còn lại sai
- **Kế thừa class khác**: record không extends class khác (chỉ implement interface).
- **Component gán lại**: component là final.
- **Không có constructor**: có canonical constructor (có thể viết compact).

> Senior tip: record phù hợp DTO/value object. Nhưng chỉ bất biến nông (shallow): record chứa List mutable vẫn bị sửa từ ngoài nếu không copy trong constructor.`
},
{
  id: 'qz-modern-026', topic: 'modern',
  q: `Sealed interface Payment permits Card, Wallet. Khi nào switch exhaustive không cần default?`,
  options: [
    `Khi tất cả subtype đã được liệt kê và sealed hierarchy không thay đổi`,
    `Khi có default luôn`,
    `Khi interface không sealed`,
    `Khi dùng enum`
  ],
  answer: 0,
  explain: `**Đáp án đúng: khi đã cover hết subtype của sealed type.**

### Vì sao đúng
Sealed (Java 17) giới hạn subtype. Compiler kiểm tra exhaustiveness tại compile-time; nếu đã cover hết permits thì không cần default. Thêm subtype sau sẽ làm switch cũ không biên dịch được (nếu không default), giúp phát hiện chỗ cần sửa.

### Vì sao các phương án còn lại sai
- **Có default**: default làm switch không còn exhaustive-checking khi thêm subtype.
- **Interface không sealed**: compiler không biết tập subtype hữu hạn.
- **Enum**: enum cũng exhaustive, nhưng câu hỏi về sealed interface.

> Senior tip: sealed hierarchy public qua thư viện là cam kết API; thêm subtype là breaking change với consumer dùng switch exhaustive.`
},
{
  id: 'qz-modern-027', topic: 'modern',
  q: `Pattern matching cho instanceof (Java 16) cho phép gì?`,
  options: [
    `Gán biến pattern trong scope luồng điều khiển mà không cần cast thủ công`,
    `Kiểm tra kiểu phần tử của generic`,
    `Tự động unboxing`,
    `Thay thế switch hoàn toàn`
  ],
  answer: 0,
  explain: `**Đáp án đúng: bind biến pattern theo luồng.**

### Vì sao đúng
{{if (o instanceof String s)}} thì {{s}} có thể dùng ngay trong scope mà compiler chứng minh pattern đã khớp, không cần cast. Flow scoping cho phép dùng sau guard clause.

### Vì sao các phương án còn lại sai
- **Kiểm tra kiểu phần tử generic**: erasure vẫn chặn.
- **Tự động unboxing**: không liên quan.
- **Thay thế switch**: pattern matching cho switch là Java 21.

> Senior tip: viết {{return o instanceof Point p && x == p.x && y == p.y;}} trong equals rất gọn. Guarded pattern {{when}} chỉ dùng trong switch.`
},
{
  id: 'qz-modern-028', topic: 'modern',
  q: `Sequenced Collections (Java 21) thêm method nào vào List/Deque?`,
  options: [
    `getFirst/getLast/addFirst/addLast/removeFirst/removeLast/reversed`,
    `sort/shuffle`,
    `stream/parallelStream`,
    `of/copyOf`
  ],
  answer: 0,
  explain: `**Đáp án đúng: getFirst/getLast/.../reversed.**

### Vì sao đúng
JEP 431 thêm các method thống nhất cho collection có thứ tự. {{reversed()}} là view đảo ngược, ghi xuyên xuống collection gốc nếu gốc sửa được.

### Vì sao các phương án còn lại sai
- **sort/shuffle**: đã có từ trước.
- **stream/parallelStream**: đã có.
- **of/copyOf**: factory bất biến, không mới.

> Senior tip: trước Java 21 mỗi loại collection có cách khác nhau ({{get(size-1)}}, {{peekLast()}}). Khi nâng cấp, class tự viết implement List có method cùng tên khác kiểu trả về có thể không biên dịch.`
},
{
  id: 'qz-concurrency-025', topic: 'concurrency',
  q: `Virtual thread trong Java 21 phù hợp nhất cho workload nào?`,
  options: [
    `I/O-bound: nhiều task chờ network/DB/file`,
    `CPU-bound: mã hoá, nén`,
    `Task cần thread pool cố định`,
    `Task cần stack lớn`,
  ],
  answer: 0,
  explain: `**Đáp án đúng: I/O-bound.**

### Vì sao đúng
Virtual thread rất rẻ và unmount khi block I/O, nên throughput tăng khi có nhiều task chờ. CPU-bound vẫn bị giới hạn bởi số core; không pool virtual thread, dùng Semaphore/pool tài nguyên để giới hạn đồng thời.

### Vì sao các phương án còn lại sai
- **CPU-bound**: không thêm CPU.
- **Pool cố định**: pool virtual thread không cần thiết.
- **Stack lớn**: virtual thread stack trên heap, vẫn chịu giới hạn bộ nhớ.

> Senior tip: virtual thread không tăng giới hạn DB connection pool; giới hạn đồng thời đặt ở Semaphore/HikariCP.`
},
{
  id: 'qz-concurrency-026', topic: 'concurrency',
  q: `CompletableFuture.exceptionally nhận exception như thế nào?`,
  options: [
    `Nhận CompletionException bọc exception gốc; thenApply bị bỏ qua`,
    `Nhận trực tiếp IllegalStateException`,
    `Chạy cùng thenApply`,
    `Ném ngay tại join`
  ],
  answer: 0,
  explain: `**Đáp án đúng: nhận CompletionException.**

### Vì sao đúng
Stage phụ thuộc bị bỏ qua và truyền exception (bọc CompletionException). {{exceptionally}} chạy khi stage trước lỗi, có thể khôi phục giá trị. {{join()}} chỉ ném nếu không phục hồi.

### Vì sao các phương án còn lại sai
- **Nhận trực tiếp**: join/get mới bọc; exceptionally nhận CompletionException.
- **Chạy cùng thenApply**: thenApply bị bỏ qua.
- **Ném ngay tại join**: chỉ khi không có exceptionally/handle.

> Senior tip: supplyAsync không truyền executor dùng commonPool; với I/O luôn truyền executor riêng và dùng orTimeout.`
},
{
  id: 'qz-jvm-025', topic: 'jvm',
  q: `Một Spring Boot service chạy Java 21 trong container Kubernetes có memory limit 2 GiB, máy host có 64 GB RAM. Không đặt {{-Xmx}} hay cờ heap nào. Heap tối đa mặc định của JVM là bao nhiêu?`,
  options: [
    `Khoảng 16 GB (25% RAM của máy host), nên pod dễ bị OOMKilled`,
    `Khoảng 512 MB: JVM đọc memory limit của cgroup và mặc định lấy {{MaxRAMPercentage}} = 25% của 2 GiB`,
    `Đúng 2 GiB, JVM dùng toàn bộ limit làm heap`,
    `JVM không khởi động được nếu không đặt {{-Xmx}} trong container`
  ],
  answer: 1,
  explain: `**Đáp án đúng: khoảng 512 MB (25% của limit).**

### Vì sao đúng
Từ JDK 10 (và được backport về 8u191), JVM **nhận biết container**: nó đọc memory limit và CPU quota từ cgroup (v1 hoặc v2) thay vì đọc RAM của máy host. Heap tối đa mặc định bằng {{MaxRAMPercentage}} (mặc định 25%) của bộ nhớ nhìn thấy: 25% × 2 GiB = 512 MB. Phần còn lại dành cho metaspace, thread stack, code cache, direct buffer và bộ nhớ native của GC.

### Vì sao các phương án còn lại sai
- **16 GB theo RAM host**: đó là hành vi của JVM cũ (Java 8 trước 8u191). Hành vi này từng gây OOMKilled hàng loạt.
- **Toàn bộ 2 GiB**: JVM cần bộ nhớ ngoài heap; nếu heap chiếm hết limit thì tổng bộ nhớ của process vượt limit và kernel giết pod.
- **Không khởi động được**: JVM luôn có giá trị mặc định.

### Cấu hình hay dùng
~~~yaml
resources:
  limits:
    memory: 2Gi
env:
  - name: JAVA_TOOL_OPTIONS
    value: "-XX:MaxRAMPercentage=75"   # heap khoảng 1.5 GiB, chừa khoảng 512 MiB cho phần ngoài heap
~~~

> Senior tip: 25% mặc định thường quá thấp cho service chỉ chạy một JVM; 60–75% là mức hay dùng. Nếu pod vẫn bị OOMKilled dù heap chưa đầy, hãy đo bộ nhớ ngoài heap bằng {{-XX:NativeMemoryTracking=summary}} và {{jcmd <pid> VM.native_memory}}.`
},
{
  id: 'qz-jvm-026', topic: 'jvm',
  q: `Một ứng dụng nạp script Groovy và tạo dynamic proxy liên tục. Sau vài ngày nó chết với {{java.lang.OutOfMemoryError: Metaspace}} (có đặt {{-XX:MaxMetaspaceSize=512m}}), trong khi heap còn trống nhiều. Nguyên nhân gốc thường gặp nhất là gì?`,
  options: [
    `Heap quá nhỏ; tăng {{-Xmx}} sẽ hết lỗi`,
    `Metaspace nằm trong heap nên chỉ cần ép Full GC định kỳ`,
    `Rò rỉ ClassLoader: class chỉ được giải phóng khỏi Metaspace khi ClassLoader nạp nó bị GC, mà vẫn còn một tham chiếu giữ ClassLoader (static cache, ThreadLocal, thread chưa dừng)`,
    `Do quá nhiều String intern`
  ],
  answer: 2,
  explain: `**Đáp án đúng: ClassLoader bị giữ lại nên class không unload được.**

### Vì sao đúng
Metaspace (từ Java 8, thay cho PermGen) chứa **metadata của class** và nằm trong bộ nhớ native, ngoài heap. Một class chỉ được gỡ khỏi Metaspace khi **cả ClassLoader** đã nạp nó trở thành rác. Mỗi script Groovy hoặc mỗi loại proxy sinh ra thường đi kèm class mới, đôi khi cả ClassLoader mới. Chỉ cần một đường tham chiếu còn giữ lại một object, thì class của nó, ClassLoader của class đó, và mọi class mà ClassLoader ấy nạp đều bị giữ lại. Đường tham chiếu đó có thể là một cache static, một {{ThreadLocal}} trên thread của pool, hay một thread do code đã nạp tạo ra mà chưa dừng.

### Cách điều tra
- {{jcmd <pid> VM.classloader_stats}} hoặc {{jcmd <pid> VM.metaspace}}: ClassLoader nào giữ nhiều class.
- Heap dump, mở trong Eclipse MAT: tìm nhiều instance của cùng một ClassLoader rồi xem "Path to GC Roots".
- {{-Xlog:class+unload}}: xác nhận class có được unload hay không.

### Vì sao các phương án còn lại sai
- **Tăng -Xmx**: Metaspace không nằm trong heap nên tăng heap không giúp gì.
- **Ép Full GC**: GC vẫn chạy, nhưng không thu hồi được class mà ClassLoader còn được tham chiếu.
- **String intern**: chuỗi intern nằm trên heap (từ Java 7), không nằm trong Metaspace.

> Senior tip: luôn đặt {{MaxMetaspaceSize}} (mặc định không giới hạn) để lỗi lộ ra sớm, thay vì để process ăn hết RAM rồi bị OOMKilled. Với Groovy, nên cache script đã compile thay vì compile lại mỗi lần chạy.`
},
{
  id: 'qz-core-027', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
List<Integer> a = new ArrayList<>(List.of(1,2,3));
List<Integer> b = a.subList(1,3);
b.set(0, 99);
System.out.println(a);
~~~`,
  options: [`[1, 99, 3]`, `[1, 2, 3]`, `[99, 2, 3]`, `UnsupportedOperationException`],
  answer: 0,
  explain: `**Đáp án đúng: [1, 99, 3].**

### Vì sao đúng
subList là view, set ghi xuyên xuống list gốc. Index trong view tương ứng offset trong gốc, nên b.set(0) sửa a[1].

### Vì sao các phương án còn lại sai
- **[1,2,3]**: bỏ qua tính chất view.
- **[99,2,3]**: nhầm index.
- **UOE**: subList view hỗ trợ set.

> Senior tip: lưu subList lâu dài giữ nguyên list gốc, gây memory leak; dùng List.copyOf.`
},
{
  id: 'qz-modern-029', topic: 'modern',
  q: `Text block (Java 15) sau cho kết quả gì?
~~~java
String s = """
    line1
    line2
    """;
System.out.println(s.lines().count());
~~~`,
  options: [`2`, `3`, `1`, `Lỗi biên dịch`],
  answer: 0,
  explain: `**Đáp án đúng: 2.**

### Vì sao đúng
Text block giữ newline; có hai dòng nội dung. Incidental whitespace bị loại bỏ theo common indent.

### Vì sao các phương án còn lại sai
- **3**: trailing newline? Text block kết thúc trước closing delimiter, không có newline thừa.
- **1**: text block không gộp dòng.
- **Lỗi biên dịch**: text block chuẩn từ Java 15.

> Senior tip: text block rất hợp JSON/SQL trong test; dùng stripIndent/translateEscapes khi cần.`
},
{
  id: 'qz-concurrency-027', topic: 'concurrency',
  q: `Khi nào nên dùng ReentrantLock thay vì synchronized?`,
  options: [
    `Khi cần tryLock timeout, lock fairness, hoặc lock quanh I/O với virtual thread`,
    `Luôn luôn vì nhanh hơn`,
    `Khi cần lock trong constructor`,
    `Khi cần lock trên primitive`
  ],
  answer: 0,
  explain: `**Đáp án đúng: khi cần tính năng mở rộng.**

### Vì sao đúng
ReentrantLock hỗ trợ tryLock(timeout), lockInterruptibly, fairness, và không pin virtual thread khi block. synchronized đơn giản và đủ cho lock ngắn.

### Vì sao các phương án còn lại sai
- **Luôn nhanh hơn**: synchronized được tối ưu tốt, often faster cho lock ngắn.
- **Constructor**: không liên quan.
- **Primitive**: lock phải trên object.

> Senior tip: chọn synchronized mặc định; nâng lên ReentrantLock khi cần timeout/backpressure.`
},
{
  id: 'qz-core-028', topic: 'core',
  q: `Đoạn code sau in ra gì?
~~~java
record Box(int v) {}
Box a = new Box(1);
Box b = new Box(1);
System.out.println(a == b);
System.out.println(a.equals(b));
System.out.println(a.hashCode() == b.hashCode());
~~~`,
  options: [
    `false true true`,
    `true true true`,
    `false false false`,
    `true false false`
  ],
  answer: 0,
  explain: `**Đáp án đúng: false true true.**

### Vì sao đúng
record tự sinh equals/hashCode dựa trên các component (ở đây là v), nên hai Box(1) bằng nhau và cùng hash. Nhưng a và b là hai object riêng biệt trên heap, nên a == b là false.

### Vì sao các phương án còn lại sai
- **true true true**: record không tự intern, == vẫn là so tham chiếu.
- **false false false**: equals/hashCode được sinh tự động, không phải identity.
- **true false false**: sai cả hai chiều.

> Senior tip: record là value object bất biến; dùng nó để tránh viết equals/hashCode thủ công và tránh lỗi contract.`
},
{
  id: 'qz-collections-027', topic: 'collections',
  q: `Đoạn code sau in ra gì?
~~~java
Map<String, Integer> m = new HashMap<>();
m.put("a", 1);
m.put("b", 2);
m.merge("a", 10, Integer::sum);
m.computeIfAbsent("c", k -> 3);
System.out.println(m);
~~~`,
  options: [
    `{a=11, b=2, c=3}`,
    `{a=1, b=2, c=3}`,
    `{a=10, b=2, c=3}`,
    `Ném NullPointerException`
  ],
  answer: 0,
  explain: `**Đáp án đúng: {a=11, b=2, c=3}.**

### Vì sao đúng
- merge("a", 10, sum): key "a" đã có giá trị 1, remapping function sum(1,10)=11 → gán 11.
- computeIfAbsent("c", ...): key "c" chưa có → gọi function trả 3 → gán 3.
- "b" không bị chạm.

### Vì sao các phương án còn lại sai
- **{a=1,...}**: merge không bỏ qua key đã tồn tại; nó áp dụng function.
- **{a=10,...}**: merge cộng dồn, không thay thế.
- **NPE**: function không null và key không null, không ném.

> Senior tip: merge/computeIfAbsent/computeIfPresent là cách thay thế pattern "get rồi put" trong concurrent map; chúng nguyên tử trên ConcurrentHashMap.`
},
{
  id: 'qz-concurrency-028', topic: 'concurrency',
  q: `Đoạn code sau có vấn đề gì?
~~~java
CompletableFuture<Integer> f = CompletableFuture.supplyAsync(() -> {
    if (true) throw new IllegalStateException("boom");
    return 1;
});
f.thenApply(x -> x + 1).exceptionally(e -> -1);
System.out.println(f.join());
~~~`,
  options: [
    `In ra -1`,
    `Ném CompletionException bọc IllegalStateException`,
    `In ra 0`,
    `Chương trình treo`
  ],
  answer: 1,
  explain: `**Đáp án đúng: ném CompletionException bọc IllegalStateException.**

### Vì sao đúng
- f là CompletableFuture gốc, chứa exception. thenApply/exceptionally tạo ra một CompletableFuture **mới** (chained), không sửa f.
- f.join() trả về kết quả của f gốc → ném CompletionException bọc exception gốc.
- Để lấy -1 phải gọi join() trên future chained (f.exceptionally(...)).

### Vì sao các phương án còn lại sai
- **-1**: chỉ future chained mới có giá trị -1, không phải f.
- **0**: không có nhánh nào trả về 0.
- **Treo**: join() chờ tới khi f hoàn thành (ở đây là hoàn thành với exception) rồi ném lỗi, không treo. Task chạy trên {{ForkJoinPool.commonPool()}} gồm daemon thread nên JVM vẫn thoát được.

> Senior tip: luôn lưu biến cho future đã nối chuỗi nếu cần xử lý exception, hoặc dùng whenComplete/handle để vừa log vừa trả giá trị. Nếu truyền executor riêng (ví dụ {{Executors.newFixedThreadPool}}) thì nhớ {{shutdown()}}: thread của pool đó không phải daemon, quên shutdown thì JVM không thoát.`
},
{
  id: 'qz-jvm-027', topic: 'jvm',
  q: `Trong một mixed collection của G1, collection set (các region sẽ được dọn trong lần pause này) gồm những gì?`,
  options: [
    `Toàn bộ young region, cộng thêm một số old region được chọn theo thứ tự nhiều rác nhất trước, sao cho vừa với pause target`,
    `Chỉ các old region nhiều rác nhất; young region đợi tới lần young GC sau`,
    `Chỉ các humongous region, vì chúng chiếm nhiều bộ nhớ nhất`,
    `Mọi region của heap, theo thứ tự allocation`
  ],
  answer: 0,
  explain: `**Đáp án đúng: toàn bộ young cộng một phần old nhiều rác nhất.**

### Vì sao đúng
G1 chia heap thành các region cùng kích thước (1–32 MB). Mọi lần pause dọn rác (young hoặc mixed) đều dọn **tất cả** young region (eden và survivor). Sau một chu kỳ concurrent marking, G1 biết mỗi old region còn bao nhiêu dữ liệu sống; trong các mixed collection tiếp theo, nó thêm dần các old region có **nhiều rác nhất** (ít dữ liệu sống nhất nên copy rẻ nhất), trong giới hạn ước lượng sao cho pause không vượt {{MaxGCPauseMillis}}. "Garbage-First" chính là cách chọn old region này.

### Vì sao các phương án còn lại sai
- **Chỉ old region**: young region luôn nằm trong collection set.
- **Chỉ humongous**: humongous region (object lớn hơn nửa region) được thu hồi khi chết, thường từ lúc cleanup hoặc eager reclaim, chứ không phải tiêu chí của mixed collection.
- **Mọi region**: dọn toàn heap chỉ xảy ra ở Full GC, là trường hợp G1 cố tránh.

> Senior tip: các tham số {{G1MixedGCCountTarget}} và {{G1HeapWastePercent}} quyết định số lần mixed GC và lượng rác chấp nhận bỏ lại. Thấy Full GC trong log G1 thường nghĩa là marking bắt đầu quá muộn ({{InitiatingHeapOccupancyPercent}}) hoặc heap quá chật.`
},
{
  id: 'qz-modern-030', topic: 'modern',
  q: `Team chuyển một service I/O-bound sang virtual thread (Java 21). Thực hành nào đúng? (Chọn 2)`,
  options: [
    `Không pool virtual thread: mỗi task một thread mới, ví dụ {{Executors.newVirtualThreadPerTaskExecutor()}}`,
    `Giới hạn truy cập tài nguyên khan hiếm (DB, API đối tác) bằng {{Semaphore}} hoặc kích thước connection pool, thay vì giới hạn số thread`,
    `Đặt pool virtual thread cố định bằng số core CPU để tránh quá tải`,
    `Lưu object nặng (ví dụ buffer lớn) trong {{ThreadLocal}} để tái sử dụng giữa các request như với thread pool thường`,
    `Chuyển cả tác vụ CPU-bound (nén ảnh, mã hoá) sang virtual thread vì chúng nhanh hơn platform thread`
  ],
  multi: true,
  answer: [0, 1],
  explain: `**Đáp án đúng: 0 và 1.**

### Vì sao đúng
- **Không pool**: virtual thread rất rẻ (stack nằm trên heap, chỉ lớn theo nhu cầu), tạo và huỷ gần như không tốn gì. Pool sinh ra để tiết kiệm thread đắt; pool virtual thread chỉ thêm phức tạp và giới hạn vô ích.
- **Giới hạn tài nguyên, không giới hạn thread**: trước đây kích thước thread pool vô tình đóng vai trò giới hạn tải. Khi mỗi request có một thread riêng thì giới hạn đó mất, và 10.000 request có thể cùng đổ vào DB. Hãy đặt giới hạn ngay tại tài nguyên: {{Semaphore}}, connection pool, rate limiter.

### Vì sao các phương án còn lại sai
- **Pool cố định bằng số core**: biến virtual thread thành platform thread đắt tiền; với I/O-bound, throughput bị chặn ở số core.
- **ThreadLocal để tái sử dụng**: mỗi task là một thread mới nên không có gì để tái dùng. Mỗi thread lại tạo object nặng của riêng nó, với hàng trăm nghìn thread thì tốn rất nhiều bộ nhớ. Muốn chia sẻ ngữ cảnh chỉ đọc, xem {{ScopedValue}} (chính thức từ JDK 25).
- **CPU-bound**: virtual thread không làm CPU chạy nhanh hơn; với việc tính toán thuần, platform thread pool cỡ bằng số core vẫn là lựa chọn đúng.

> Senior tip: trên JDK 21–23, nhớ kiểm tra pinning ({{synchronized}} quanh I/O) bằng JFR event {{jdk.VirtualThreadPinned}} trước khi rollout.`
},
{
  id: 'qz-collections-028', topic: 'collections',
  q: `Một class key có {{hashCode()}} viết lỗi, luôn trả về cùng một số. Một {{HashMap}} mới tạo (capacity mặc định 16) lần lượt nhận 9 key khác nhau của class này. Khi put key thứ 9, HashMap làm gì?`,
  options: [
    'Đổi bin đó thành red-black tree ngay, vì bin đã vượt 8 node',
    'Resize table lên 32 thay vì treeify, vì table còn nhỏ hơn 64; mọi key vẫn rơi vào cùng một bin',
    'Ném {{IllegalStateException}} vì có quá nhiều collision trong một bin',
    'Không bao giờ treeify được vì class key không implements {{Comparable}}'
  ],
  answer: 1,
  explain: `**Đáp án đúng: resize lên 32, chưa treeify, vì table chưa đạt {{MIN_TREEIFY_CAPACITY}} = 64.**

### Vì sao đúng
Trong {{putVal}}, khi một bin dạng linked list vượt {{TREEIFY_THRESHOLD}} = 8 node, HashMap gọi {{treeifyBin}}. Nhưng {{treeifyBin}} kiểm tra trước: nếu table còn nhỏ hơn 64 thì nó **resize** thay vì treeify. Lý do thiết kế: bin dài ở table nhỏ thường chỉ là do table quá chật, nên nhân đôi table rẻ hơn và hiệu quả hơn dựng cây.

Với hashCode hằng số, resize không giúp gì: mọi key vẫn cùng hash nên vẫn chung một bin. Các lần put tiếp theo sẽ resize 32 → 64, và chỉ khi table đạt 64 thì bin mới thành tree. Tree lúc đó tìm theo hash trước, sau đó theo {{compareTo}} nếu key là Comparable. Nếu không phải Comparable, HashMap vẫn treeify (dùng {{tieBreakOrder}} để xếp chỗ khi chèn) nhưng khi tìm phải duyệt nhiều nhánh, gần như O(n).

### Vì sao các phương án còn lại sai
- **Treeify ngay**: bỏ qua điều kiện table phải ≥ 64.
- **Ném exception**: HashMap không bao giờ ném lỗi vì collision, nó chỉ chậm đi.
- **Không bao giờ treeify**: sai; key không Comparable vẫn được treeify, chỉ là tìm kiếm kém hiệu quả hơn.

### Ngưỡng cần nhớ
| Hằng số | Giá trị | Ý nghĩa |
|---|---|---|
| TREEIFY_THRESHOLD | 8 | list dài hơn thì xét treeify |
| UNTREEIFY_THRESHOLD | 6 | tree còn ≤ 6 node (khi resize tách bin) thì về lại list |
| MIN_TREEIFY_CAPACITY | 64 | table nhỏ hơn thì resize thay vì treeify |

> Senior tip: treeify là lưới an toàn chống hashCode tệ hoặc tấn công hash-flooding, không phải tính năng để dựa vào. Thấy CPU cao ở {{HashMap.getNode}} trong profile thì kiểm tra hashCode của key trước tiên.`
},
{
  id: 'qz-concurrency-029', topic: 'concurrency', multi: true,
  q: `Hai thread dùng chung object có {{int data}} (thường) và {{volatile boolean ready}}:
~~~java
// Thread A
data = 42;
ready = true;

// Thread B
while (!ready) { }
System.out.println(data);
~~~
Phát biểu nào đúng? (Chọn 2)`,
  options: [
    'B chắc chắn in 42: ghi volatile {{ready}} happens-before lần đọc thấy {{true}}, và {{data = 42}} đứng trước nó theo program order',
    'Nếu bỏ {{volatile}} ở {{ready}}, B có thể lặp mãi hoặc in ra 0',
    'Chỉ cần khai báo {{data}} là volatile, còn {{ready}} để thường cũng đảm bảo B in 42',
    '{{volatile}} cấm mọi reordering trong toàn bộ chương trình',
    'Đảm bảo này chỉ có trên x86; trên ARM, B vẫn có thể in 0'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: 0 và 1.**

### Vì sao đúng
Java Memory Model định nghĩa quan hệ **happens-before (HB)**: nếu X HB Y thì mọi thứ X ghi đều nhìn thấy được ở Y. Có ba mắt xích:
1. Trong thread A: {{data = 42}} HB {{ready = true}} (program order).
2. Ghi volatile {{ready}} HB mọi lần đọc volatile {{ready}} **thấy giá trị đó**.
3. Trong thread B: lần đọc thấy {{true}} HB {{println(data)}}.

HB có tính bắc cầu, nên {{data = 42}} HB lần đọc {{data}} của B, và B in 42. Bỏ volatile thì mất mắt xích 2: JIT được phép đưa {{ready}} ra khỏi vòng lặp (đọc một lần rồi lặp mãi), và CPU hoặc compiler được phép đảo thứ tự hai lệnh ghi của A, nên B có thể in 0.

### Vì sao các phương án còn lại sai
- **Chỉ data volatile**: B đọc {{ready}} không volatile nên không có mắt xích HB nào; vòng lặp vẫn có thể không bao giờ thấy {{true}}.
- **Cấm mọi reordering**: volatile chỉ ràng buộc thứ tự quanh chính các truy cập volatile, không phải toàn chương trình.
- **Chỉ đúng trên x86**: JMM là đặc tả của ngôn ngữ; JVM phải giữ đúng đảm bảo này trên mọi kiến trúc (trên ARM nó chèn thêm memory barrier).

> Senior tip: các nguồn HB khác cũng hay gặp trong phỏng vấn: unlock một monitor HB lần lock sau trên cùng monitor; {{Thread.start()}} HB mọi lệnh trong thread mới; mọi lệnh trong thread HB lúc {{join()}} trả về. Busy-wait như ví dụ chỉ để minh hoạ; code thật dùng {{CountDownLatch}} hoặc {{CompletableFuture}}.`
},
{
  id: 'qz-concurrency-030', topic: 'concurrency',
  q: `Hai thread, mỗi thread chạy {{count++}} 1000 lần trên field {{volatile int count}} (ban đầu 0). Sau khi cả hai {{join()}}, giá trị của {{count}} là gì?`,
  options: [
    'Có thể nhỏ hơn 2000, vì {{count++}} gồm đọc, cộng, ghi; volatile không làm ba bước đó thành nguyên tử',
    'Luôn đúng 2000, vì volatile làm mọi thread thấy giá trị mới nhất',
    'Có thể lớn hơn 2000 do ghi đè lặp',
    'Ném {{ConcurrentModificationException}} khi hai thread ghi cùng lúc'
  ],
  answer: 0,
  explain: `**Đáp án đúng: có thể nhỏ hơn 2000 (lost update).**

### Vì sao đúng
{{count++}} là ba thao tác: đọc {{count}}, cộng 1, ghi lại. Volatile đảm bảo mỗi lần đọc thấy lần ghi gần nhất, nhưng **không** khoá cả ba bước lại với nhau:
~~~text
A đọc 5      B đọc 5
A ghi 6      B ghi 6     → hai lần ++ nhưng chỉ tăng 1
~~~
Mỗi lần xen kẽ như vậy làm mất một lần tăng.

### Cách sửa
| Cách | Khi nào dùng |
|---|---|
| {{AtomicInteger.incrementAndGet()}} | đếm thông thường, dùng CAS |
| {{LongAdder}} | rất nhiều thread cùng tăng, chỉ thỉnh thoảng đọc tổng (metrics) |
| {{synchronized}} / {{ReentrantLock}} | cần cập nhật nhiều biến cùng lúc cho nhất quán |

### Vì sao các phương án còn lại sai
- **Luôn 2000**: nhầm visibility với atomicity.
- **Lớn hơn 2000**: mỗi lần ghi chỉ là giá trị đọc được cộng 1, nên kết quả không thể vượt tổng số lần tăng.
- **ConcurrentModificationException**: exception này do iterator của collection ném ra, không liên quan đến field.

> Senior tip: {{LongAdder}} chia bộ đếm thành nhiều cell để giảm tranh chấp CAS; dưới tải rất cao nó nhanh hơn {{AtomicLong}} nhiều lần, nhưng {{sum()}} không phải snapshot nguyên tử.`
},
{
  id: 'qz-concurrency-031', topic: 'concurrency',
  q: `{{new ReentrantLock()}} (constructor không tham số). Thread T1 đang chờ trong hàng đợi của lock. Đúng lúc chủ lock vừa {{unlock()}}, thread T2 mới tới gọi {{lock()}}. Điều gì có thể xảy ra?`,
  options: [
    'T1 chắc chắn được lock trước, vì ReentrantLock mặc định là fair (FIFO)',
    'T2 sẽ bị ném {{IllegalMonitorStateException}} vì đã có thread đang chờ',
    'T2 có thể giành lock trước T1 (barging), vì mặc định là non-fair: T2 thử CAS lên {{state}} của AQS trước khi xếp hàng',
    'Gọi {{tryLock()}} trên lock fair luôn tôn trọng thứ tự hàng đợi'
  ],
  answer: 2,
  explain: `**Đáp án đúng: mặc định non-fair, T2 có thể chen ngang.**

### Vì sao đúng
{{ReentrantLock}} xây trên **AbstractQueuedSynchronizer (AQS)**: một biến {{volatile int state}} (0 là tự do, lớn hơn 0 là số lần chủ lock đã lock lại) cùng một hàng đợi FIFO các thread đang park. Ở chế độ non-fair (mặc định), {{lock()}} thử CAS {{state}} từ 0 lên 1 **ngay lập tức**, rồi mới xếp hàng nếu thất bại. T1 vừa được unpark còn phải tốn thời gian để chạy lại, nên T2 (đang chạy sẵn trên CPU) thường thắng.

Vì sao mặc định lại non-fair? Đánh thức một thread đang park tốn hàng chục micro giây, còn thread đang chạy lấy được lock thì không mất context switch nào. Nhờ vậy throughput cao hơn đáng kể; cái giá là một thread có thể bị chen ngang nhiều lần (starvation).

### Vì sao các phương án còn lại sai
- **Mặc định fair**: phải gọi {{new ReentrantLock(true)}} mới có fair.
- **IllegalMonitorStateException**: exception này chỉ xảy ra khi unlock một lock mình không giữ.
- **tryLock() tôn trọng fairness**: javadoc ghi rõ {{tryLock()}} không tham số giành lock ngay nếu lock đang trống, kể cả với lock fair. Muốn tôn trọng thứ tự thì dùng {{tryLock(0, TimeUnit.SECONDS)}}.

> Senior tip: fair lock thường chậm hơn nhiều dưới tải cao. Chỉ dùng khi có yêu cầu thật về công bằng (ví dụ không để request nào chờ quá lâu), và đo bằng benchmark trước khi đổi.`
},
{
  id: 'qz-concurrency-032', topic: 'concurrency',
  q: `Service chạy **Java 21** dùng virtual thread cho mỗi request. Mỗi request gọi một method {{synchronized}}, trong đó có một truy vấn JDBC chặn khoảng 200 ms. Máy có 8 core. Dưới tải 5.000 request đồng thời, throughput rơi xuống chỉ khoảng 40 request/giây. Nguyên nhân và cách sửa?`,
  options: [
    'Virtual thread không chạy được JDBC, phải chuyển sang R2DBC',
    'Mỗi virtual thread chiếm 1 MB stack nên hết bộ nhớ',
    '{{Thread.sleep}} và I/O trong virtual thread luôn giữ chặt carrier thread',
    'Chặn I/O bên trong {{synchronized}} làm virtual thread bị **pin** vào carrier (chỉ có 8 carrier), nên chỉ 8 request chạy cùng lúc; sửa bằng {{ReentrantLock}} hoặc lên JDK 24+'
  ],
  answer: 3,
  explain: `**Đáp án đúng: pinning do synchronized trên JDK 21.**

### Vì sao đúng
Virtual thread chạy trên một pool nhỏ các **carrier thread** (mặc định bằng số core). Khi virtual thread chặn I/O, JVM **unmount** nó khỏi carrier để carrier chạy việc khác. Trên JDK 21–23 có một ngoại lệ: nếu nó đang ở trong {{synchronized}} (giữ monitor) hoặc trong native frame thì không unmount được và carrier bị giữ chặt (**pinned**). 8 carrier × (1000 ms / 200 ms) = 40 request/giây, đúng con số quan sát được.

### Cách xử lý
- Thay {{synchronized}} quanh đoạn chặn I/O bằng {{ReentrantLock}}: virtual thread unmount bình thường.
- Lên **JDK 24+**: JEP 491 cho virtual thread unmount được cả khi đang giữ monitor, nên {{synchronized}} không còn gây pin (gọi native và foreign function vẫn pin).
- Phát hiện: dùng event JFR {{jdk.VirtualThreadPinned}}; trên JDK 21–23 có thêm {{-Djdk.tracePinnedThreads=full}}.

### Vì sao các phương án còn lại sai
- **Không chạy được JDBC**: JDBC chặn I/O, vẫn chạy tốt trên virtual thread. Vấn đề ở đây là pinning chứ không phải JDBC.
- **1 MB stack**: stack của virtual thread nằm trên heap và chỉ lớn theo nhu cầu (vài KB), nên 5.000 thread là chuyện nhỏ.
- **sleep/I/O luôn pin**: sai; đây chính là những trường hợp unmount được.

> Senior tip: pool kết nối DB vẫn là giới hạn thật. 5.000 virtual thread cùng chờ một HikariCP 20 connection thì throughput vẫn bị giới hạn bởi 20 connection, nên phải chỉnh pool và timeout cho phù hợp.`
},
{
  id: 'qz-jvm-028', topic: 'jvm',
  q: `GC log cho thấy một lần young GC chỉ tốn 5 ms, nhưng ứng dụng bị đứng gần 800 ms đúng thời điểm đó. Log {{-Xlog:safepoint}} báo phần "Reaching safepoint" khoảng 795 ms và "At safepoint" khoảng 5 ms. Giải thích hợp lý nhất?`,
  options: [
    'Time-to-safepoint dài: một thread chạy rất lâu mà không gặp điểm kiểm tra safepoint (ví dụ vòng lặp đếm lớn trong code đã JIT, hoặc copy mảng khổng lồ), mọi thread khác phải chờ nó',
    'Có một Full GC chạy ngầm mà không ghi log',
    'Thread đang chặn trong native/I/O giữ safepoint lại cho đến khi I/O xong',
    'Safepoint chỉ phục vụ GC nên pause phải đúng bằng thời gian GC; log bị sai'
  ],
  answer: 0,
  explain: `**Đáp án đúng: thời gian chờ để mọi thread tới safepoint (time-to-safepoint, TTSP) quá dài.**

### Vì sao đúng
Nhiều thao tác của JVM (phần stop-the-world của GC, deoptimization, một số lệnh chẩn đoán như thread dump) cần **mọi** thread Java dừng ở trạng thái an toàn, gọi là safepoint. JVM bật cờ yêu cầu, và mỗi thread tự dừng khi chạy tới một **safepoint poll** (JIT chèn poll ở cuối method và ở back-edge của vòng lặp). Pause người dùng thấy bằng thời gian chờ thread cuối cùng tới safepoint cộng với thời gian làm việc tại safepoint:
~~~text
Reaching safepoint ~795 ms   ← chờ thread chậm nhất
At safepoint        ~5 ms    ← GC thật sự chỉ tốn chừng này
~~~
Thủ phạm thường gặp là vòng lặp đếm ({{int i}}) rất dài: C2 từng bỏ poll trong loại vòng lặp này. Từ JDK 10, **loop strip mining** chia vòng lặp thành từng đoạn khoảng 1000 lần lặp và chèn poll giữa các đoạn, nên trường hợp này hiếm hơn nhưng chưa hết (copy mảng rất lớn, một số intrinsic).

### Vì sao các phương án còn lại sai
- **Full GC ngầm**: mọi lần GC đều có trong log GC; ở đây log đã cho thấy chính phần chờ safepoint.
- **Thread trong native/I/O**: thread đang chạy native được coi là đã an toàn (nó không đụng heap Java), nên không làm safepoint phải chờ.
- **Log sai**: safepoint còn dùng cho deopt, revoke lock, thread dump..., và pause luôn bao gồm cả TTSP.

> Senior tip: khi latency spike không khớp với GC pause, hãy bật {{-Xlog:safepoint*}} hoặc xem các event safepoint trong JFR. Async-profiler ở chế độ wall-clock giúp tìm thread chậm tới safepoint.`
},
{
  id: 'qz-jvm-029', topic: 'jvm',
  q: `Interface {{Shape}} lúc đầu chỉ có một implementation được load là {{Circle}}; method nóng {{total(List<Shape>)}} gọi {{shape.area()}} và đã được C2 compile. Vài phút sau, lần đầu tiên một {{Square}} xuất hiện. {{-XX:+PrintCompilation}} in ra "made not entrant" cho {{total}} và latency tăng vọt trong chốc lát. Chuyện gì đã xảy ra?`,
  options: [
    'GC di chuyển object Circle nên code đã compile không còn hợp lệ',
    'C2 compile lỗi nên JVM tự khởi động lại compiler',
    'Deoptimization: C2 đã inline {{Circle.area()}} dựa trên giả định chỉ có một implementation; Square xuất hiện làm giả định sai, code bị bỏ, method quay về interpreter rồi được compile lại',
    'JVM tạm dừng để đọc file Square.class từ đĩa, và đó là toàn bộ chi phí'
  ],
  answer: 2,
  explain: `**Đáp án đúng: deoptimization vì giả định tối ưu bị phá.**

### Vì sao đúng
JIT tối ưu dựa trên những gì nó **quan sát** được, kèm theo các giả định:
1. Class Hierarchy Analysis (CHA) và type profile cho thấy chỉ có Circle, nên C2 **inline** thẳng {{Circle.area()}} (không còn virtual call), rồi tối ưu tiếp quanh đoạn đó.
2. Khi Square được load hoặc xuất hiện tại call site, giả định trên sai. JVM đánh dấu code đó **not entrant** (không cho lần gọi mới vào nữa); các frame đang chạy trong code đó được **deoptimize**, nghĩa là dựng lại trạng thái và chạy tiếp bằng interpreter.
3. Method chạy chậm ở interpreter và tier thấp một lúc, sau đó được compile lại với profile mới (bimorphic: kiểm tra kiểu rồi inline cả hai). Khoảng thời gian này chính là latency spike.

### Vì sao các phương án còn lại sai
- **GC di chuyển object**: GC cập nhật con trỏ trong code đã compile thông qua oop map; việc di chuyển object không làm code mất hiệu lực.
- **Compile lỗi**: đây là cơ chế bình thường, không phải lỗi.
- **Chỉ do đọc file**: load class rất rẻ; chi phí lớn nằm ở deopt và compile lại.

> Senior tip: đây là lý do benchmark phải warm-up với dữ liệu đa dạng như production (JMH), và vì sao call site **megamorphic** (từ 3 kiểu trở lên) không inline được. Ở đường code siêu nóng, giữ ít kiểu tại một call site giúp JIT tối ưu tốt hơn.`
},
{
  id: 'qz-jvm-030', topic: 'jvm',
  q: `Service có heap 64 GB, SLA p99 latency 10 ms. Với G1, các mixed GC gây pause 80–150 ms. Dùng JDK 21. Lựa chọn nào hợp lý nhất?`,
  options: [
    'Giữ G1, đặt {{-XX:MaxGCPauseMillis=10}}; G1 sẽ đảm bảo không pause quá 10 ms',
    'Chuyển sang Parallel GC để tăng throughput',
    'Tăng heap lên 128 GB để G1 chạy ít lần hơn',
    'Chuyển sang Generational ZGC ({{-XX:+UseZGC -XX:+ZGenerational}} trên JDK 21): pause dưới 1 ms gần như không phụ thuộc kích thước heap, đổi lại tốn thêm CPU cho phần việc chạy song song và cần dư heap'
  ],
  answer: 3,
  explain: `**Đáp án đúng: Generational ZGC.**

### Vì sao đúng
G1 chia heap thành region và gom rác theo thế hệ. Phần lớn công việc **di chuyển (evacuate)** object vẫn diễn ra trong pause, nên pause tăng theo lượng dữ liệu sống phải copy. ZGC làm cả việc đánh dấu lẫn di chuyển **song song** với ứng dụng, nhờ **colored pointers** và load barrier: thread nào đọc phải con trỏ cũ sẽ tự sửa nó. Pause chỉ còn vài thao tác ngắn, thường dưới 1 ms kể cả với heap hàng trăm GB.

Phiên bản: JDK 21 có Generational ZGC qua cờ {{-XX:+ZGenerational}}; JDK 23 bật generational mặc định; JDK 24 bỏ hẳn chế độ non-generational.

### Trade-off
| | G1 | Generational ZGC |
|---|---|---|
| Pause | 10–200 ms tuỳ live set | thường dưới 1 ms |
| CPU | ít hơn | tốn thêm CPU cho GC chạy song song |
| Heap | gọn hơn | cần dư heap để GC kịp dọn |
| Throughput | thường cao hơn một chút | thấp hơn một chút |

### Vì sao các phương án còn lại sai
- **MaxGCPauseMillis=10**: chỉ là **mục tiêu**; G1 cố gắng đạt nhưng không đảm bảo, đặt quá thấp còn làm GC chạy dày hơn.
- **Parallel GC**: mọi việc đều stop-the-world, pause với 64 GB sẽ lên tới hàng giây.
- **Tăng heap**: GC ít lần hơn nhưng mỗi lần copy nhiều hơn; không giải quyết được pause.

> Senior tip: trước khi đổi GC, kiểm tra xem pause có thật sự đến từ GC không (xem time-to-safepoint, allocation rate). Khi chuyển sang ZGC, theo dõi "Allocation Stall" trong log: đó là dấu hiệu heap quá chật.`
},
{
  id: 'qz-jvm-031', topic: 'jvm',
  q: `Method nóng sau chạy hàng triệu lần mỗi giây, nhưng JFR gần như không ghi nhận allocation nào của {{Point}}:
~~~java
double dist(int x1, int y1, int x2, int y2) {
    Point p = new Point(x2 - x1, y2 - y1);   // không lưu ra ngoài
    return Math.sqrt(p.x() * p.x() + p.y() * p.y());
}
~~~
Vì sao?`,
  options: [
    'Escape analysis của C2 thấy {{p}} không thoát ra khỏi method, nên dùng scalar replacement: thay object bằng các biến cục bộ hoặc thanh ghi, không cấp phát trên heap',
    'HotSpot cấp phát {{Point}} trên stack của thread thay vì heap',
    'Cấp phát trong TLAB nên JFR không tính là allocation',
    'JVM cache sẵn các {{Point}} nhỏ giống Integer cache'
  ],
  answer: 0,
  explain: `**Đáp án đúng: scalar replacement nhờ escape analysis.**

### Vì sao đúng
C2 phân tích xem object có **thoát** khỏi method không: có được trả về, gán vào field hoặc static, hay truyền cho method không được inline hay không. {{p}} chỉ dùng tại chỗ nên không thoát. Khi đó C2 **phân rã object thành các field** ({{x}}, {{y}} thành hai biến local), xoá hẳn lệnh {{new}}: không có header, không cấp phát, không tạo việc cho GC. Escape analysis còn cho phép **bỏ lock** (lock elision) trên object không thoát.

### Vì sao các phương án còn lại sai
- **Cấp phát trên stack**: đây là hiểu lầm phổ biến. HotSpot không cấp phát cả object trên stack; nó làm scalar replacement, nghĩa là object không còn tồn tại.
- **TLAB**: TLAB chỉ là vùng heap riêng của thread để cấp phát nhanh; object trong TLAB vẫn là allocation thật và JFR vẫn lấy mẫu (event allocation trong và ngoài TLAB).
- **Cache như Integer**: không có cơ chế nào như vậy cho class tự viết.

### Khi nào tối ưu này không xảy ra
- Method chưa được C2 compile (chạy ở interpreter hoặc C1).
- Object được truyền vào một method không inline được (quá lớn, megamorphic).
- Đường code phức tạp làm object thoát ở một nhánh nào đó.

> Senior tip: đừng phá thiết kế hướng đối tượng để "tránh new" khi chưa đo. Dùng JMH với {{-prof gc}} để xem số byte cấp phát mỗi lần gọi; nhiều object tạm thực tế không tốn gì nhờ escape analysis.`
},
{
  id: 'qz-core-029', topic: 'core',
  q: `Class {{A}} có static initializer đọc {{B.X}}, class {{B}} có static initializer đọc {{A.Y}} (X, Y không phải hằng số compile-time). Thread 1 dùng A lần đầu, đúng lúc đó thread 2 dùng B lần đầu. Điều gì có thể xảy ra?`,
  options: [
    'Static initializer của mỗi class chạy hai lần, mỗi thread một lần',
    'Luôn chạy xong, chỉ là một bên thấy giá trị mặc định (0/null) của field bên kia',
    'Deadlock: thread 1 giữ khoá khởi tạo của A và chờ B, thread 2 giữ khoá của B và chờ A; hai thread treo vĩnh viễn',
    'JVM phát hiện vòng lặp và ném {{ExceptionInInitializerError}}'
  ],
  answer: 2,
  explain: `**Đáp án đúng: deadlock khi khởi tạo class.**

### Vì sao đúng
JLS 12.4.2 đảm bảo mỗi class chỉ được khởi tạo **một lần** cho mỗi classloader. Cách làm: thread khởi tạo class giữ một khoá khởi tạo, thread khác muốn dùng class đó phải **chờ** tới khi khởi tạo xong. Quy trình:
~~~text
T1: bắt đầu khởi tạo A  → chạy <clinit> của A → cần B → chờ (T2 đang khởi tạo B)
T2: bắt đầu khởi tạo B  → chạy <clinit> của B → cần A → chờ (T1 đang khởi tạo A)
~~~
Hai thread chờ nhau mãi. Khó chẩn đoán vì không có {{synchronized}} nào trong code. Ở jstack, hai thread cùng kẹt trong {{<clinit>}} và thường không có dòng "Found one Java-level deadlock".

Nếu chỉ có **một** thread, JVM cho phép thread đang khởi tạo A dùng lại A (khởi tạo lồng nhau), nên không treo; khi đó mới xảy ra chuyện thấy giá trị mặc định 0/null.

### Vì sao các phương án còn lại sai
- **Chạy hai lần**: trái với đảm bảo "chỉ một lần" của JLS.
- **Luôn chạy xong**: chỉ đúng khi cùng một thread; với hai thread thì có thể deadlock.
- **JVM phát hiện vòng lặp**: JVM không phát hiện; {{ExceptionInInitializerError}} chỉ xuất hiện khi chính static initializer ném exception.

> Senior tip: giữ static initializer đơn giản, không gọi chéo giữa các class. Idiom lazy holder (một static nested class {{Holder}} chứa {{static final X INSTANCE = new X();}}) dựa đúng vào đảm bảo khởi tạo một lần và thread-safe của JLS.`
},
{
  id: 'qz-jvm-032', topic: 'jvm',
  q: `Heap dump của service parse JSON cho thấy khoảng 30% heap là các String có nội dung trùng nhau ("ACTIVE", "VN", tên thành phố…) và sống lâu. Bật {{-XX:+UseStringDeduplication}} thì điều gì xảy ra?`,
  options: [
    'Các String trùng nội dung được gộp thành cùng một object, nên {{a == b}} trả về true',
    'Mọi String đều được tự động {{intern()}}',
    'Chỉ có tác dụng với String literal trong source code',
    'GC tìm các String sống đủ lâu có cùng nội dung và cho chúng **dùng chung một mảng byte[]**; các object String vẫn khác nhau'
  ],
  answer: 3,
  explain: `**Đáp án đúng: dùng chung mảng byte[] bên dưới, object String vẫn tách biệt.**

### Vì sao đúng
Một String gồm object String (header, hash, coder) và một mảng {{byte[]}} chứa ký tự, thường là phần tốn bộ nhớ nhất. Khi bật deduplication, GC ghi nhận các String đã sống qua một số lần GC (mặc định 3, chỉnh bằng {{StringDeduplicationAgeThreshold}}), rồi một thread nền tra bảng băm: String nào có nội dung trùng thì trỏ field {{value}} sang mảng đã có, và mảng cũ thành rác.
- Ban đầu chỉ G1 hỗ trợ; từ JDK 18 có thêm Serial, Parallel và ZGC.
- Không thay đổi ngữ nghĩa: {{==}} vẫn so sánh hai object khác nhau.

### Vì sao các phương án còn lại sai
- **Gộp object, == true**: chỉ mảng ký tự dùng chung; danh tính object giữ nguyên, nên code không bị đổi hành vi.
- **Tự intern**: intern trả về object canonical trong StringTable và phải gọi tường minh; dedup là cơ chế khác, chạy ngầm và chỉ với String sống lâu.
- **Chỉ với literal**: literal vốn đã được intern sẵn; dedup nhắm vào String tạo lúc chạy (parse JSON, đọc DB).

> Senior tip: dedup tốn thêm CPU nền và chỉ hiệu quả khi String sống lâu. Với dữ liệu tập giá trị nhỏ đã biết trước (status, mã nước), chuyển sang enum hoặc tự chuẩn hoá khi parse (Jackson có {{InternCache}} cho tên field) thường tiết kiệm hơn.`
},
{
  id: 'qz-concurrency-033', topic: 'concurrency', multi: true,
  q: `Class sau được thread A tạo rồi gán vào field dùng chung {{static Config current}} (field thường, không đồng bộ); thread B đọc {{current.timeout()}}:
~~~java
class Config {
    private int timeout;
    Config(int t) { this.timeout = t; }
    int timeout() { return timeout; }
}
~~~
B có thể thấy {{current}} khác null nhưng {{timeout}} bằng 0. Thay đổi nào **đảm bảo** B thấy đúng giá trị? (Chọn 3)`,
  options: [
    'Đánh dấu field {{timeout}} là {{final}} (và constructor không để lộ {{this}} ra ngoài)',
    'Khai báo {{current}} là {{volatile}}',
    'Thay {{current}} bằng {{AtomicReference<Config>}} và dùng {{set}}/{{get}}',
    'Cho B {{Thread.sleep(100)}} trước khi đọc',
    'Đánh dấu {{timeout()}} là {{synchronized}}, còn phép gán {{current}} vẫn không đồng bộ'
  ],
  answer: [0, 1, 2],
  explain: `**Đáp án đúng: 0, 1, 2.**

### Vì sao lỗi xảy ra
Không có quan hệ happens-before giữa A và B, nên compiler hoặc CPU được phép đảo thứ tự: ghi tham chiếu vào {{current}} **trước** khi ghi {{timeout}}. B thấy object rồi nhưng field vẫn là giá trị mặc định. Đây là **unsafe publication**.

### Vì sao đúng
- **final field**: JMM có đảm bảo riêng cho final. Thread nào thấy tham chiếu tới object (sau khi constructor chạy xong) thì chắc chắn thấy giá trị final đã gán trong constructor, kể cả khi bản thân tham chiếu được publish không an toàn. Điều kiện: {{this}} không bị lộ ra ngoài trong lúc constructor đang chạy.
- **volatile current**: ghi volatile happens-before lần đọc volatile thấy giá trị đó, nên mọi lệnh ghi trước nó (kể cả trong constructor) đều được nhìn thấy.
- **AtomicReference**: {{set}}/{{get}} có ngữ nghĩa bộ nhớ của volatile.

### Vì sao các phương án còn lại sai
- **sleep**: không tạo happens-before; chỉ làm lỗi khó tái hiện hơn.
- **synchronized ở getter**: happens-before của monitor chỉ có khi **cả hai bên** dùng cùng một khoá. Phía ghi không giữ khoá đó, nên không có đảm bảo nào.

> Senior tip: các cách publish an toàn khác: gán trong static initializer, đặt vào collection thread-safe ({{ConcurrentHashMap}}, {{BlockingQueue}}), hoặc ghi và đọc trong cùng một khoá. Object immutable (mọi field final) là cách đơn giản nhất để khỏi phải nghĩ tới chuyện này.`
},
{
  id: 'qz-collections-029', topic: 'collections',
  q: `Nhiều thread cùng dùng đoạn code sau để giới hạn cache dựa trên {{ConcurrentHashMap}} ở 1000 phần tử:
~~~java
if (cache.size() < 1000) {
    cache.put(key, value);
}
~~~
Sau một thời gian, cache có 1.180 phần tử. Vì sao?`,
  options: [
    'Kiểm tra rồi mới làm (check-then-act) không nguyên tử: nhiều thread cùng thấy size dưới 1000 rồi cùng put; ngoài ra {{size()}} chỉ là ước lượng khi đang có cập nhật song song',
    '{{size()}} khoá toàn bộ map, nên lỗi phải nằm ở chỗ khác',
    'ConcurrentHashMap tự chặn put khi đạt ngưỡng, nên 1.180 là do bug của JDK',
    'Hai thread put cùng lúc khiến ConcurrentHashMap ném {{ConcurrentModificationException}} và nhân đôi phần tử'
  ],
  answer: 0,
  explain: `**Đáp án đúng: race check-then-act, cộng với size() không phải snapshot.**

### Vì sao đúng
Mỗi thao tác của {{ConcurrentHashMap}} riêng lẻ thì thread-safe, nhưng **chuỗi hai thao tác** thì không:
~~~text
T1: size() = 999 → OK      T2: size() = 999 → OK
T1: put(k1)                T2: put(k2)          → 1001
~~~
Thêm nữa, {{size()}} cộng một bộ đếm chia thành nhiều cell (giống {{LongAdder}}) mà không khoá map. Khi đang có put/remove song song, kết quả chỉ là ước lượng tại thời điểm đọc. Javadoc cũng khuyên dùng {{mappingCount()}} (trả về long) thay cho {{size()}}.

### Cách làm đúng
- Dùng cache có giới hạn sẵn: Caffeine với {{maximumSize(1000)}} (đuổi bớt theo tần suất truy cập), đúng thứ mà đoạn code trên cố tự làm.
- Nếu bắt buộc tự làm: giữ chỗ trước bằng {{AtomicInteger}} hoặc {{Semaphore}}, chỉ put khi giữ được chỗ, rồi trả lại chỗ khi remove.

### Vì sao các phương án còn lại sai
- **size() khoá map**: ConcurrentHashMap (từ Java 8) không có khoá toàn map; {{size()}} không khoá gì cả.
- **Tự chặn ở ngưỡng**: ConcurrentHashMap không có khái niệm giới hạn số phần tử.
- **ConcurrentModificationException**: iterator của ConcurrentHashMap là weakly consistent và không bao giờ ném exception này; key trùng thì bị ghi đè chứ không nhân đôi.

> Senior tip: mọi quyết định kiểu "đọc rồi ghi" trên map dùng chung nên dùng thao tác nguyên tử có sẵn: {{putIfAbsent}}, {{computeIfAbsent}}, {{merge}}. Hàm truyền vào {{compute*}} phải ngắn, vì nó chạy trong lúc giữ khoá của bin.`
},
{
  id: 'qz-jvm-033', topic: 'jvm',
  q: `Với Compact Strings (mặc định từ Java 9), String nào dưới đây được lưu với coder **UTF16** (2 byte cho mỗi ký tự)?`,
  options: [
    '"café"',
    '"Hà Nội"',
    '"ORDER-2026-001"',
    '"Über"'
  ],
  answer: 1,
  explain: `**Đáp án đúng: "Hà Nội".**

### Vì sao đúng
Từ Java 9 (JEP 254), String lưu ký tự trong {{byte[] value}} kèm field {{coder}}:
- **LATIN1**: mọi ký tự nằm trong U+0000–U+00FF → 1 byte mỗi ký tự.
- **UTF16**: chỉ cần **một** ký tự nằm ngoài vùng đó → cả chuỗi dùng 2 byte mỗi ký tự.

"Hà Nội": 'à' (U+00E0) vẫn thuộc Latin-1, nhưng 'ộ' (U+1ED9) thì không, nên cả chuỗi là UTF16. Phần lớn chuỗi tiếng Việt có dấu đều rơi vào trường hợp này, vì dấu thanh tiếng Việt chủ yếu nằm ở vùng U+1Exx.

### Vì sao các phương án còn lại sai
- **"café"**: 'é' là U+00E9, thuộc Latin-1.
- **"ORDER-2026-001"**: toàn ASCII, thuộc Latin-1.
- **"Über"**: 'Ü' là U+00DC, thuộc Latin-1.

### Hệ quả thực tế
- Service chủ yếu giữ chuỗi ASCII (id, mã, JSON key) thường giảm đáng kể dung lượng String khi lên Java 9+.
- Dữ liệu tiếng Việt có dấu vẫn tốn 2 byte mỗi ký tự trong bộ nhớ, khác với lúc mã hoá UTF-8 khi gửi qua mạng.
- Có thể tắt bằng {{-XX:-CompactStrings}}, nhưng hiếm khi cần.

> Senior tip: khi ước lượng heap cho cache chứa nhiều text tiếng Việt, đừng tính theo số byte UTF-8 trong DB; trong JVM mỗi ký tự tốn 2 byte, cộng thêm khoảng 40 byte cho object String và header của mảng.`
},
{
  id: 'qz-core-030', topic: 'core',
  q: `Để "tiết kiệm bộ nhớ", một service gọi {{userId.intern()}} cho mọi request (hàng triệu userId gần như không trùng nhau). Chạy trên Java 17. Đánh giá nào đúng nhất?`,
  options: [
    'Gây OutOfMemoryError: PermGen vì chuỗi intern nằm trong PermGen',
    'Chuỗi đã intern không bao giờ được GC thu hồi, nên heap chắc chắn tràn',
    '{{intern()}} trả về một bản sao mới nên càng tốn bộ nhớ gấp đôi',
    'Gần như không tiết kiệm gì vì userId hiếm khi trùng, còn tốn CPU tra bảng StringTable mỗi request; chuỗi intern nằm trên heap và vẫn được GC khi không còn ai tham chiếu'
  ],
  answer: 3,
  explain: `**Đáp án đúng: lợi ít, hại nhiều; nhưng không có OOM PermGen.**

### Vì sao đúng
{{intern()}} tra chuỗi trong **StringTable** (bảng băm của JVM): đã có chuỗi bằng nội dung thì trả về object có sẵn, chưa có thì thêm vào. Nó chỉ tiết kiệm bộ nhớ khi **rất nhiều chuỗi trùng nhau** cùng sống lâu. Với userId gần như duy nhất:
- Mỗi request tốn thêm một lần tính hash và tra bảng có tranh chấp giữa các thread.
- Bảng phình theo số chuỗi; GC phải dọn các entry chết, làm tăng thời gian GC.
- Hầu như không có chuỗi nào được dùng chung.

Lịch sử: từ Java 7, chuỗi intern nằm trên **heap** (trước đó ở PermGen); Java 8 bỏ hẳn PermGen. Chuỗi intern được GC thu hồi như object thường khi không còn tham chiếu.

### Vì sao các phương án còn lại sai
- **OOM PermGen**: Java 17 không còn PermGen.
- **Không bao giờ được GC**: sai từ Java 7; chuỗi intern không còn ai tham chiếu vẫn được thu hồi.
- **Trả về bản sao mới**: ngược lại, nó trả về bản canonical đã có (hoặc chính chuỗi đó nếu là lần đầu).

> Senior tip: muốn giảm chuỗi trùng thì đo trước bằng heap dump (Eclipse MAT có báo cáo chuỗi trùng). Tập giá trị nhỏ thì dùng enum hoặc một map chuẩn hoá có giới hạn; chuỗi sống lâu và trùng nhiều thì bật {{-XX:+UseStringDeduplication}}. Kích thước bảng chỉnh bằng {{-XX:StringTableSize}} nếu thật sự phải intern nhiều.`
},
{
  id: 'qz-primer-011', topic: 'primer',
  q: 'Một trang quản trị gọi {{GET /reports/generate?month=10}} để tạo báo cáo và gửi email cho quản lý. Browser đôi khi tải trước request này, khiến email gửi hai lần. Thiết kế nào đúng nhất?',
  options: [
    'Giữ GET và chỉ thêm header Cache-Control: no-cache để browser không tải trước',
    'Đổi GET thành PUT vì PUT luôn gửi dữ liệu lên server',
    'Dùng POST để yêu cầu tạo báo cáo; nếu việc tạo cần chạy lâu, trả về mã job rồi dùng GET riêng để xem trạng thái hoặc tải kết quả',
    'Giữ GET nhưng đổi tên tham số month để request không bị cache'
  ],
  answer: 2,
  explain: `**Đáp án đúng: dùng POST cho thao tác tạo báo cáo.**

### Cái gì đang xảy ra?
{{GET}} được thiết kế để đọc tài nguyên, chẳng hạn xem danh sách báo cáo. Một đặc tính quan trọng là GET phải **safe**: chỉ đọc, không gây thay đổi nghiệp vụ như trừ tiền, gửi email hay tạo đơn. Browser, proxy hoặc crawler có thể tải trước GET để trang mở nhanh; cache cũng có thể gửi lại request. Vì thế không được đặt hành động có tác dụng phụ vào GET.

{{POST}} phù hợp khi client yêu cầu server thực hiện một hành động hoặc tạo một tài nguyên mới. Ví dụ, server có thể trả {{202 Accepted}} cùng mã job nếu xử lý chưa xong; sau đó client gọi GET trên đường dẫn trạng thái job. GET lúc này chỉ đọc tiến độ hoặc kết quả.

### Vì sao các phương án còn lại sai
- **Cache-Control: no-cache**: chỉ ảnh hưởng cách cache kiểm tra/tái sử dụng response; không biến GET thành thao tác an toàn và không ngăn mọi client tự gửi lại request.
- **Đổi thành PUT**: PUT thường dùng để tạo hoặc thay thế trạng thái tại một URI đã biết và có ngữ nghĩa idempotent. Nó không phải lựa chọn chung cho hành động tạo job có URI do server cấp.
- **Đổi tên tham số**: request vẫn là GET có tác dụng phụ. Thay URL chỉ né một cache cụ thể, không sửa hợp đồng HTTP.

> Senior tip: thiết kế endpoint theo tác dụng nghiệp vụ, không theo việc frontend tình cờ gửi một lần. GET chỉ nên đọc; khi POST có thể bị retry, thiết kế thêm cơ chế chống tạo trùng phù hợp với nghiệp vụ.`
},
{
  id: 'qz-primer-012', topic: 'primer', multi: true,
  q: 'Java service ghi hai lần vào một TCP socket; server đọc dữ liệu qua {{InputStream}}. Hai phát biểu nào mô tả TCP chính xác? (Chọn 2)',
  options: [
    'TCP cung cấp luồng byte có thứ tự và truyền lại dữ liệu bị mất trong phạm vi kết nối còn hoạt động',
    'Mỗi lần client gọi write() thì server luôn nhận đúng một lần read() tương ứng',
    'TCP tự hiểu cấu trúc JSON và đảm bảo server đã thực hiện giao dịch đúng một lần',
    'TCP là luồng byte: ranh giới giữa hai lần write() không được giữ nguyên, nên giao thức ứng dụng cần quy định cách tách message',
    'Nếu socket connect() thành công thì mọi request nghiệp vụ phía server chắc chắn đã được xử lý'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: TCP đảm bảo luồng byte có thứ tự, nhưng không giữ ranh giới message.**

### TCP giúp gì?
{{TCP}} (Transmission Control Protocol) là giao thức truyền tải tạo kết nối giữa hai đầu. Nó đánh số các byte, xác nhận dữ liệu đã nhận và truyền lại phần bị mất khi có thể. Ứng dụng thường thấy dữ liệu theo đúng thứ tự đã gửi, nhưng chỉ thấy một **luồng byte liên tục**, không thấy từng lần gọi {{write()}} của bên kia.

Ví dụ client ghi {{HELLO}} rồi {{WORLD}}. Server có thể đọc {{HELLOWORLD}} trong một lần, hoặc {{HE}} rồi {{LLOWO}} rồi {{RLD}}. Cả hai đều hợp lệ. Giao thức ứng dụng cần tự định ranh giới, chẳng hạn dùng dấu xuống dòng, độ dài cố định, hoặc gửi độ dài message trước nội dung. HTTP cũng định nghĩa cách tổ chức request/response ở tầng ứng dụng.

### Vì sao từng phương án đúng hoặc sai
- **Đúng: luồng có thứ tự và có truyền lại.** Đây là các đặc tính cốt lõi của TCP trong khi kết nối còn tồn tại; nếu kết nối đứt thì ứng dụng vẫn phải xử lý lỗi.
- **Sai: một write tương ứng một read.** Socket không bảo toàn ranh giới lần ghi; giả định này thường làm parser lỗi khi message bị chia nhỏ hoặc gộp.
- **Sai: TCP hiểu JSON và xử lý đúng một lần.** TCP không biết JSON, đơn hàng hay database. Nó chỉ chuyển byte; tính đúng một lần là trách nhiệm của giao thức và logic ứng dụng.
- **Đúng: ứng dụng phải định khung message.** Nếu không, bên nhận không biết một message kết thúc ở đâu.
- **Sai: connect thành công không chứng minh request đã xử lý.** Kết nối chỉ cho biết bắt tay TCP hoàn tất; server có thể chưa nhận request, đã nhận nhưng chưa xử lý, hoặc xử lý xong nhưng response bị mất.

> Senior tip: khi đọc socket, luôn xử lý trường hợp read trả ít byte hơn mong đợi; đừng giả định một lần đọc lấy đủ một message.`
},
{
  id: 'qz-primer-013', topic: 'primer',
  q: 'Một dịch vụ cần công bố địa chỉ để cả máy chỉ hỗ trợ IPv4 và máy hỗ trợ IPv6 đều tìm được. Loại DNS record nào mô tả đúng địa chỉ mỗi loại?',
  options: [
    'A cho IPv4 và AAAA cho IPv6',
    'CNAME cho IPv4 và MX cho IPv6',
    'AAAA cho IPv4 và A cho IPv6',
    'TXT cho cả IPv4 lẫn IPv6 vì DNS chỉ lưu văn bản'
  ],
  answer: 0,
  explain: `**Đáp án đúng: A ánh xạ tên sang địa chỉ IPv4, AAAA ánh xạ tên sang địa chỉ IPv6.**

### DNS làm nhiệm vụ gì?
{{DNS}} (Domain Name System) giống danh bạ: ứng dụng hỏi địa chỉ gắn với tên như {{api.example.com}} để biết tới đâu cần kết nối. DNS trả về các bản ghi có kiểu khác nhau; kiểu bản ghi cho biết dữ liệu trả về có ý nghĩa gì.

- {{A}} chứa địa chỉ IPv4, ví dụ {{192.0.2.10}}.
- {{AAAA}} chứa địa chỉ IPv6, ví dụ {{2001:db8::10}}.
- Resolver (thành phần đi hỏi DNS thay cho ứng dụng) có thể hỏi cả hai loại; hệ điều hành hoặc client chọn địa chỉ phù hợp với mạng và chính sách kết nối.

### Vì sao các phương án còn lại sai
- **CNAME cho IPv4, MX cho IPv6**: CNAME là bí danh trỏ tới một tên DNS khác, không chứa địa chỉ IP. MX chỉ định máy nhận email cho domain.
- **Đảo A và AAAA**: chữ A gắn với IPv4; AAAA là dạng mở rộng để chứa địa chỉ IPv6 dài hơn.
- **TXT cho địa chỉ**: TXT chứa dữ liệu văn bản phục vụ cấu hình/xác minh, không phải record địa chỉ mà client dùng để kết nối.

> Senior tip: khi một số người dùng truy cập được còn số khác không, kiểm tra cả A và AAAA. Một IPv6 record sai có thể khiến client ưu tiên đường IPv6 lỗi dù IPv4 vẫn hoạt động.`
},
{
  id: 'qz-primer-014', topic: 'primer',
  q: 'Bạn chỉ muốn đưa hai thay đổi trong một file lên commit, còn phần sửa dở khác trong cùng file chưa sẵn sàng. Cách làm nào cho phép chọn từng phần thay đổi?',
  options: [
    '{{git commit -a}} để Git tự chọn các dòng đã hoàn tất',
    '{{git stash}} toàn bộ file rồi commit phần còn lại từ stash',
    '{{git reset --hard}} để bỏ các dòng chưa muốn commit',
    'Dùng {{git add -p}} để chọn từng hunk vào staging area, kiểm tra bằng {{git diff --cached}}, rồi commit'
  ],
  answer: 3,
  explain: `**Đáp án đúng: dùng {{git add -p}} để stage từng phần.**

### Ba vùng cần phân biệt
Git có thể hình dung qua ba vùng: thư mục làm việc chứa nội dung bạn đang sửa; **staging area** (vùng chuẩn bị) chứa chính xác thay đổi dự định đưa vào commit; commit là ảnh chụp lịch sử đã lưu. {{git add -p}} hiển thị từng nhóm dòng thay đổi, gọi là hunk, để bạn chọn nhóm nào được đưa vào staging.

~~~bash
git add -p src/OrderService.java
git diff --cached
git commit -m "Handle order validation"
~~~

### Vì sao các phương án còn lại sai
- **git commit -a**: tự stage thay đổi của file đã được Git theo dõi, thường là toàn bộ thay đổi của file đó; không cho chọn từng hunk.
- **git stash toàn bộ**: cất thay đổi để làm việc sau, nhưng không tự chia đúng hai phần muốn commit; có thể dùng stash -p nhưng thao tác stage tương ứng trực tiếp hơn.
- **git reset --hard**: xoá thay đổi chưa commit trong working tree; đây là thao tác phá huỷ nội dung, không phải cách tách commit.
- **git add -p và diff --cached**: chỉ phần đã chọn vào staging được commit; xem diff staged trước giúp phát hiện lỡ chọn nhầm.

> Senior tip: commit nhỏ, mỗi commit một mục đích giúp review và revert dễ hơn. Trước khi commit, xem cả {{git diff}} (chưa stage) lẫn {{git diff --cached}} (sẽ commit).`
},
{
  id: 'qz-primer-015', topic: 'primer',
  q: 'Máy Linux báo gần hết dung lượng ổ đĩa. Bạn muốn biết filesystem nào đầy và riêng thư mục {{/var/log}} đang chiếm bao nhiêu. Cặp lệnh nào phù hợp?',
  options: [
    '{{du -h}} để xem filesystem đầy, {{df -h /var/log}} để xem kích thước thư mục',
    '{{df -h}} xem mức dùng của filesystem; {{du -sh /var/log}} cộng dung lượng các file trong thư mục',
    '{{free -h}} xem filesystem và {{ps aux}} cộng dung lượng file log',
    '{{ls -l /var/log}} cho tổng dung lượng đĩa còn trống và dung lượng thư mục con'
  ],
  answer: 1,
  explain: `**Đáp án đúng: {{df}} cho filesystem, {{du}} cho thư mục.**

### Khác nhau ở đối tượng được đo
{{df}} viết tắt của disk free, báo dung lượng tổng, đã dùng và còn trống của filesystem (hệ thống file được mount vào một đường dẫn). Dùng {{df -h}} để hiển thị đơn vị dễ đọc như GiB.

{{du}} viết tắt của disk usage, đi qua các file/thư mục để cộng dung lượng chúng chiếm. {{du -sh /var/log}} trả một con số gọn cho cả cây thư mục đó. Hai kết quả có thể lệch: file đã bị xoá nhưng tiến trình vẫn mở file sẽ không còn xuất hiện trong {{du}}, nhưng dung lượng vẫn bị giữ trên filesystem nên {{df}} vẫn báo đã dùng.

### Vì sao các phương án còn lại sai
- **Đảo du và df**: {{du}} không báo tổng chỗ trống của filesystem; {{df}} không tính riêng kích thước mọi file trong thư mục theo cách đó.
- **free và ps**: {{free}} đo bộ nhớ RAM/swap; {{ps}} liệt kê tiến trình. Chúng không cho biết dung lượng filesystem.
- **ls -l**: hiển thị metadata từng mục trong thư mục, không đệ quy cộng kích thước toàn cây và không báo dung lượng còn trống của ổ.

> Senior tip: nếu {{df}} báo đầy nhưng {{du}} không tìm thấy file lớn, kiểm tra file đã xoá nhưng còn được process mở, chẳng hạn bằng {{sudo lsof +L1}}.`
},
{
  id: 'qz-primer-016', topic: 'primer', multi: true,
  q: 'Một hàm xử lý mảng có kích thước {{n}}. Hai nhận định nào về độ phức tạp dưới đây đúng? (Chọn 2)',
  options: [
    'Hai vòng lặp lồng nhau, mỗi vòng chạy n lần, thường có thời gian O(n²)',
    'Ba vòng lặp nối tiếp, mỗi vòng chạy n lần, có thời gian O(n³)',
    'Một vòng chạy 5n + 20 bước có thời gian O(n) khi n tăng lớn',
    'Vòng lặp nhân biến đếm với 2 mỗi lần, từ 1 tới n, có thời gian O(n)',
    'O(n) luôn chạy nhanh hơn O(log n) với mọi kích thước đầu vào'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: vòng lặp lồng nhau là O(n²), còn 5n + 20 là O(n).**

### Big O là gì?
{{O(...)}} (Big O) mô tả tốc độ tăng của lượng công việc khi kích thước đầu vào {{n}} tăng. Đây không phải thời gian chính xác theo mili giây; nó giúp so sánh xu hướng khi dữ liệu lớn hơn. Ta bỏ hằng số và phần tăng chậm hơn: {{5n + 20}} được xem là {{O(n)}}.

- Hai vòng lặp lồng nhau, mỗi vòng chạy n lần, làm khoảng {{n * n}} lượt → {{O(n²)}}.
- Ba vòng lặp nối tiếp mỗi vòng n lần làm khoảng {{3n}} lượt → {{O(n)}}, không phải {{O(n³)}}.
- Vòng lặp tăng gấp đôi 1, 2, 4, 8... cần khoảng {{log2(n)}} lần mới vượt n → {{O(log n)}}.

### Vì sao từng phương án đúng hoặc sai
- **Đúng: hai vòng lặp lồng nhau.** Với mỗi phần tử ở vòng ngoài, vòng trong duyệt n phần tử; tổng số cặp tăng theo bình phương.
- **Sai: ba vòng nối tiếp.** Công việc cộng thành 3n; vì bỏ hằng số 3, độ phức tạp là O(n).
- **Đúng: 5n + 20 là O(n).** Khi n lớn, phần tuyến tính chi phối; 5 và 20 không đổi bậc tăng trưởng.
- **Sai: nhân đôi là O(n).** Số lần nhân đôi tăng theo logarit cơ số 2, không phải theo n.
- **Sai: O(n) luôn nhanh hơn.** Với n rất nhỏ, hằng số và chi phí triển khai có thể khiến thuật toán O(n) chạy nhanh hơn; Big O mô tả xu hướng khi n lớn, không phải thời gian tuyệt đối ở mọi n.

> Senior tip: khi tối ưu API, xác định n thực tế trước. O(n²) có thể ổn với 20 phần tử nhưng thành khoảng một triệu cặp khi n là 1.000.`
},
{
  id: 'qz-primer-017', topic: 'primer',
  q: 'Một endpoint cần tìm mã khách hàng trong một danh sách đã được sắp xếp gồm 1 triệu phần tử. Cách nào giảm số lần so sánh mà vẫn trả lời đúng?',
  options: [
    'Duyệt từ đầu tới cuối; vì danh sách đã sắp xếp nên thời gian luôn O(1)',
    'Xáo trộn danh sách trước rồi tìm; trung bình chỉ cần một lần so sánh',
    'Dùng binary search: so sánh ở giữa rồi bỏ nửa không thể chứa kết quả, với độ phức tạp O(log n)',
    'Dùng binary search trên danh sách chưa sắp xếp; thuật toán tự sắp xếp miễn phí'
  ],
  answer: 2,
  explain: `**Đáp án đúng: binary search trên dữ liệu đã sắp xếp.**

### Từng bước
{{Binary search}} (tìm kiếm nhị phân) so sánh giá trị cần tìm với phần tử ở giữa. Nếu mã nhỏ hơn, bỏ nửa phải; nếu lớn hơn, bỏ nửa trái; nếu bằng thì đã tìm thấy. Mỗi bước giảm vùng cần tìm còn một nửa. Với 1 triệu mục, chỉ cần khoảng 20 bước vì {{2^20}} lớn hơn một triệu; độ phức tạp là {{O(log n)}}.

Điều kiện quan trọng là dữ liệu phải có thứ tự theo cùng quy tắc so sánh. Duyệt tuần tự không cần sắp xếp nhưng có thể phải kiểm tra tới một triệu mục, tức {{O(n)}}.

### Vì sao các phương án còn lại sai
- **Duyệt tuyến tính O(1)**: danh sách sắp xếp không làm mất thời gian duyệt; trường hợp xấu vẫn phải đi qua gần hết danh sách.
- **Xáo trộn**: làm mất thứ tự hữu ích, và không có cách đảm bảo gặp giá trị cần tìm sau một lần so sánh.
- **Binary search đúng điều kiện**: mỗi so sánh loại bỏ một nửa ứng viên; đây là lựa chọn phù hợp khi danh sách đã có thứ tự.
- **Dữ liệu chưa sắp xếp**: binary search có thể bỏ nhầm nửa chứa kết quả. Tự sắp xếp cũng không miễn phí; nó thường tốn O(n log n) và cần cân nhắc nếu chỉ tìm một lần.

> Senior tip: nếu danh sách thay đổi thường xuyên, chi phí giữ thứ tự hoặc tạo index cũng đáng tính; với dữ liệu trong database, index thường phù hợp hơn tự tải toàn bộ danh sách vào Java.`
},
{
  id: 'qz-primer-018', topic: 'primer', multi: true,
  q: 'Bạn cần thêm nhiều cách tính phí vận chuyển có thể thay đổi độc lập theo khách hàng. Hai cách thiết kế nào thể hiện tốt việc ưu tiên composition thay vì inheritance? (Chọn 2)',
  options: [
    'Tạo interface {{ShippingPolicy}} và truyền implementation phù hợp vào dịch vụ đặt hàng',
    'Tạo một subclass cho mọi tổ hợp giữa loại khách hàng, hãng vận chuyển và chương trình khuyến mãi',
    'Để {{OrderService}} kết hợp các collaborator nhỏ, chẳng hạn chính sách vận chuyển và bộ tính giảm giá',
    'Đưa mọi logic vào lớp cha {{OrderService}} rồi buộc lớp con gọi các method protected theo đúng thứ tự',
    'Dùng composition nghĩa là không được dùng interface hoặc đa hình'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: lắp ghép các đối tượng nhỏ qua interface hoặc collaborator.**

### Hai cách tái sử dụng code
{{Inheritance}} (kế thừa) tạo quan hệ kiểu "là một": {{ExpressShipping}} là một dạng {{ShippingPolicy}}. {{Composition}} (kết hợp) tạo đối tượng bằng cách chứa hoặc nhận các thành phần khác, giống một chiếc xe kết hợp động cơ và hộp số. Composition thường linh hoạt hơn khi các hành vi thay đổi độc lập.

Ví dụ, {{OrderService}} nhận một {{ShippingPolicy}} và một bộ tính giảm giá. Khi khách hàng đổi chính sách vận chuyển, ta thay collaborator mà không cần tạo subclass cho mọi tổ hợp. Interface vẫn có thể được dùng trong composition để định nghĩa hợp đồng của thành phần.

### Vì sao từng phương án đúng hoặc sai
- **Đúng: truyền ShippingPolicy.** Service dùng hợp đồng chung, còn implementation có thể được chọn theo cấu hình hoặc loại đơn.
- **Sai: subclass cho mọi tổ hợp.** Số subclass tăng theo tích các biến thể; thay một quy tắc có thể đòi sửa nhiều lớp.
- **Đúng: kết hợp collaborator.** Mỗi thành phần có trách nhiệm rõ ràng và có thể thay thế, kiểm thử riêng.
- **Sai: lớp cha chứa mọi logic.** Lớp con bị buộc phụ thuộc thứ tự gọi và chi tiết nội bộ; kế thừa ở đây chỉ che giấu coupling.
- **Sai: composition không dùng interface.** Interface là cách phổ biến để các thành phần tương tác lỏng lẻo; composition và đa hình bổ trợ nhau.

> Senior tip: không cần cấm kế thừa. Dùng inheritance cho quan hệ "is-a" ổn định; ưu tiên composition khi hành vi cần hoán đổi hoặc kết hợp theo nhiều chiều.`
},
{
  id: 'qz-primer-019', topic: 'primer',
  q: 'Một class {{BankAccount}} có field {{balance}}. Nhiều nơi trong ứng dụng đang sửa trực tiếp số dư và có nơi vô tình đặt số dư âm. Cách sửa nào áp dụng encapsulation tốt nhất?',
  options: [
    'Đổi balance thành public final để mọi code có thể đọc nhưng vẫn đổi được khi cần',
    'Ẩn balance và chỉ cung cấp các thao tác nghiệp vụ như deposit/withdraw có kiểm tra invariant trước khi cập nhật',
    'Giữ balance public nhưng thêm comment yêu cầu lập trình viên không đặt số âm',
    'Tạo getter và setter công khai cho mọi field; setter không cần kiểm tra vì caller phải tự chịu trách nhiệm'
  ],
  answer: 1,
  explain: `**Đáp án đúng: đóng gói trạng thái và chỉ cho phép thay đổi qua thao tác giữ invariant.**

### Encapsulation nghĩa là gì?
{{Encapsulation}} (đóng gói) là giữ trạng thái nội bộ bên trong đối tượng và kiểm soát cách bên ngoài đọc hoặc thay đổi nó. {{Invariant}} là điều kiện luôn phải đúng, ví dụ tài khoản không được âm nếu sản phẩm không cho phép thấu chi.

Thay vì cho mọi class gán {{balance}}, {{BankAccount}} có thể cung cấp {{deposit(amount)}} và {{withdraw(amount)}}. Mỗi method kiểm tra amount hợp lệ và số dư đủ trước khi cập nhật. Khi đó mọi đường thay đổi đều đi qua cùng quy tắc.

### Vì sao các phương án còn lại sai
- **public final**: {{final}} chỉ ngăn gán lại tham chiếu/giá trị sau khởi tạo; nó không phù hợp để số dư thay đổi theo giao dịch, và field vẫn bị lộ.
- **Public kèm comment**: comment không được compiler thực thi; một caller vẫn có thể gán số âm.
- **Setter không kiểm tra**: setter công khai cho phép bỏ qua invariant, chỉ chuyển lỗi từ một nơi sang mọi caller.
- **Ẩn field và thao tác nghiệp vụ**: quyền kiểm soát nằm ở nơi hiểu quy tắc tài khoản; object giữ trạng thái hợp lệ sau mỗi thao tác.

> Senior tip: với tiền, dùng kiểu chính xác như {{BigDecimal}} với quy tắc scale/rounding rõ ràng; đồng thời cập nhật số dư và ghi sổ giao dịch trong cùng transaction phù hợp.`
},
{
  id: 'qz-primer-020', topic: 'primer',
  q: 'Một class {{InvoiceService}} vừa tính thuế, vừa dựng PDF, vừa gửi email. Mỗi lần đổi mẫu PDF đều làm team lo có thể ảnh hưởng phép tính thuế. Hướng refactor nào phù hợp nhất với SRP?',
  options: [
    'Tách phần tính thuế và phần dựng PDF thành trách nhiệm riêng; service điều phối chúng qua các collaborator',
    'Đổi tên class thành {{InvoiceManager}} để tên bao quát hơn, giữ nguyên các method',
    'Tách riêng mọi method vào một class cho mỗi method, kể cả method chỉ có một dòng dùng một lần',
    'Bọc class trong singleton để chỉ có một nơi cần sửa'
  ],
  answer: 0,
  explain: `**Đáp án đúng: tách theo các lý do thay đổi độc lập.**

### SRP là gì?
{{SRP}} (Single Responsibility Principle) thường được diễn đạt là một module nên có một lý do chính để thay đổi. Nó không có nghĩa class chỉ được có đúng một method; ý chính là các quy tắc thuộc những mối quan tâm khác nhau không bị trộn vào nhau.

Trong tình huống này, quy tắc thuế thay đổi theo chính sách tài chính; mẫu PDF thay đổi theo yêu cầu trình bày. Tách {{TaxCalculator}} và {{InvoicePdfRenderer}} giúp thay đổi một phía ít có nguy cơ phá phía kia. {{InvoiceService}} có thể điều phối việc tính, lưu và xuất hóa đơn.

### Vì sao các phương án còn lại sai
- **Tách theo lý do thay đổi**: mỗi thành phần có ranh giới phù hợp với biến động riêng; có thể kiểm thử phép tính mà không cần dựng PDF.
- **Chỉ đổi tên class**: tên không làm giảm phụ thuộc hoặc tách biệt quy tắc.
- **Một class cho mỗi method**: tách quá nhỏ tạo thêm indirection và khó hiểu mà không tạo ranh giới nghiệp vụ hữu ích.
- **Singleton**: giới hạn số instance không tách trách nhiệm; class vẫn có các lý do thay đổi khác nhau.

> Senior tip: tìm dấu hiệu SRP qua lịch sử thay đổi và dependency: nếu một file thường xuyên bị sửa bởi hai nhóm vì hai mục tiêu khác nhau, đó là tín hiệu nên xem lại ranh giới.`
},
{
  id: 'qz-primer-021', topic: 'primer',
  q: 'Một dịch vụ tính phí phụ thuộc trực tiếp vào class {{PostgresPaymentRepository}}. Khi muốn test hoặc chuyển sang kho dữ liệu khác, phải sửa cả logic nghiệp vụ. Cách nào áp dụng Dependency Inversion tốt nhất?',
  options: [
    'Đưa câu SQL vào {{PaymentService}} để bỏ qua dependency repository',
    'Tạo subclass của {{PaymentService}} cho từng database và override mọi method',
    'Để tầng nghiệp vụ phụ thuộc vào abstraction {{PaymentRepository}}; adapter Postgres implement abstraction đó và được cung cấp cho service',
    'Dùng {{static}} để mọi class gọi chung một repository toàn cục'
  ],
  answer: 2,
  explain: `**Đáp án đúng: tầng nghiệp vụ phụ thuộc vào abstraction, adapter cụ thể thực hiện abstraction đó.**

### DIP và dependency injection
{{DIP}} (Dependency Inversion Principle) khuyến nghị cả logic cấp cao lẫn chi tiết cấp thấp phụ thuộc vào abstraction (hợp đồng), thay vì logic nghiệp vụ phụ thuộc trực tiếp vào chi tiết database. {{PaymentService}} cần khả năng lưu payment; nó không cần biết SQL hay Postgres.

Ta định nghĩa {{PaymentRepository}} với các thao tác nghiệp vụ cần thiết. Adapter {{PostgresPaymentRepository}} thực thi hợp đồng đó bằng JDBC hoặc ORM. Một composition root, chẳng hạn cấu hình ứng dụng Spring, tạo adapter rồi truyền vào service. Việc truyền dependency như vậy gọi là dependency injection; nó là kỹ thuật hỗ trợ thiết kế này, không phải chính nguyên tắc DIP.

### Vì sao các phương án còn lại sai
- **SQL trong service**: làm logic nghiệp vụ phụ thuộc chi tiết database, khiến test và thay đổi storage khó hơn.
- **Subclass service cho từng database**: sao chép hoặc override logic cấp cao để thay một chi tiết thấp; cấu trúc phụ thuộc vẫn bị đảo sai chiều.
- **Abstraction do nghiệp vụ dùng**: service chỉ biết hợp đồng; có thể cung cấp fake trong test hoặc adapter cho database khác mà không đổi quy tắc thanh toán.
- **Static toàn cục**: tạo trạng thái dùng chung ẩn, khó thay thế trong test và dễ gây ghép chặt.

> Senior tip: đừng tạo interface cho mọi class một cách máy móc. Tạo abstraction tại ranh giới nơi có biến thể thực sự, như database, HTTP client hoặc hệ thống thanh toán ngoài.`
},
{
  id: 'qz-primer-022', topic: 'primer',
  q: 'Một API Java tự ghép JSON bằng nối chuỗi để trả tên người dùng. Khi tên là {{An "Senior"}}, response không parse được. Cách sửa nào đúng và an toàn nhất?',
  options: [
    'Xoá mọi dấu ngoặc kép khỏi tên trước khi ghép để JSON luôn đơn giản',
    'Đổi response thành chuỗi thường nhưng vẫn đặt Content-Type là application/json',
    'Tự thay dấu ngoặc kép bằng dấu gạch chéo ở một chỗ trong controller',
    'Trả DTO qua thư viện JSON như Jackson để serializer tự escape dấu ngoặc kép, dấu gạch chéo ngược và ký tự điều khiển'
  ],
  answer: 3,
  explain: `**Đáp án đúng: dùng JSON serializer thay vì tự nối chuỗi.**

### Vì sao chuỗi nối bị lỗi?
JSON là định dạng dữ liệu có quy tắc cú pháp. Chuỗi JSON phải nằm trong dấu ngoặc kép; ký tự ngoặc kép nằm bên trong giá trị phải được escape, nghĩa là biểu diễn bằng chuỗi ký tự đặc biệt để parser hiểu đó là nội dung chứ không phải điểm kết thúc. Dấu gạch chéo ngược và một số ký tự điều khiển cũng cần xử lý.

Nếu ghép trực tiếp giá trị {{An "Senior"}}, server có thể tạo JSON lỗi:
~~~json
{"name":"An "Senior""}
~~~
Parser tưởng chuỗi kết thúc trước chữ Senior. Jackson trong Spring Boot serialize DTO và tự xử lý các trường hợp này. JSON đã serialize cần được trả như dữ liệu, không escape thủ công lần nữa.

### Vì sao các phương án còn lại sai
- **Xoá dấu ngoặc kép**: làm sai dữ liệu người dùng; còn các ký tự khác như backslash hoặc newline vẫn có thể phá cú pháp.
- **Gửi text nhưng khai JSON**: header không biến văn bản bất kỳ thành JSON hợp lệ; client parse sẽ thất bại.
- **Thay một loại ký tự bằng tay**: chỉ xử lý một trường hợp và dễ tạo lỗi khi có backslash, tab, newline hoặc Unicode.
- **Serializer**: thực hiện escaping theo quy tắc JSON và giữ nguyên nội dung logic của tên.

> Senior tip: serialize và parse bằng thư viện chuẩn; sau khi tạo response, một test nên parse JSON lại và kiểm tra giá trị sau parse bằng đúng chuỗi đầu vào.`
},
{
  id: 'qz-primer-023', topic: 'primer',
  q: 'Bạn cấu hình {{api.example.com}} làm bí danh của {{edge.vendor.net}}. Nhà cung cấp có thể đổi địa chỉ IP của edge mà không muốn bạn cập nhật IP thủ công. DNS record nào phù hợp nhất?',
  options: [
    'Tạo MX trỏ tới edge.vendor.net vì mọi bí danh đều là máy mail',
    'Tạo CNAME trỏ api.example.com tới edge.vendor.net; DNS sẽ tiếp tục phân giải tên đích sang record địa chỉ của nó',
    'Tạo TXT chứa chuỗi edge.vendor.net; resolver tự hiểu đó là địa chỉ cần kết nối',
    'Tạo A record có giá trị edge.vendor.net vì A record nhận tên miền thay cho IP'
  ],
  answer: 1,
  explain: `**Đáp án đúng: CNAME tạo bí danh từ một tên DNS sang tên khác.**

### CNAME hoạt động ra sao?
{{CNAME}} là canonical name record: nó nói rằng một tên là bí danh của tên đích. Resolver hỏi {{api.example.com}}, nhận được {{edge.vendor.net}}, rồi tiếp tục tra cứu tên đích để lấy địa chỉ A hoặc AAAA. Nếu nhà cung cấp đổi IP nhưng vẫn cập nhật DNS của {{edge.vendor.net}}, client không cần cấu hình IP đó trực tiếp.

{{A}} và {{AAAA}} lưu địa chỉ IP cụ thể (IPv4 và IPv6). {{CNAME}} lưu một tên DNS khác, không phải IP. Vì thế nó phù hợp khi muốn trỏ tới endpoint do nhà cung cấp quản lý.

### Vì sao các phương án còn lại sai
- **MX**: chỉ định máy nhận email cho domain; không phải record bí danh thông thường cho endpoint HTTP.
- **CNAME**: đúng loại record cho alias; resolver cần tiếp tục tra tên đích để lấy IP.
- **TXT**: chứa văn bản phục vụ xác minh/cấu hình; resolver không dùng nội dung TXT làm địa chỉ endpoint.
- **A chứa tên miền**: A yêu cầu giá trị IPv4; nếu nhập tên khác thì record sai định dạng. Muốn bí danh dùng CNAME.

> Senior tip: DNS zone apex (tên gốc như example.com) có quy tắc riêng và thường không cho đặt CNAME chuẩn cùng các record bắt buộc khác; kiểm tra tính năng alias/ANAME của DNS provider khi cần trỏ apex.`
},
{
  id: 'qz-primer-024', topic: 'primer', multi: true,
  q: 'Bạn có ba commit riêng trên nhánh feature chưa chia sẻ với ai; nhánh main trên remote vừa tiến thêm. Hai phát biểu nào đúng về rebase và merge? (Chọn 2)',
  options: [
    'Sau khi fetch, rebase nhánh feature lên origin/main có thể phát lại ba commit trên nền mới để lịch sử tuyến tính hơn',
    'Rebase chỉ đổi vị trí hiển thị của commit, không tạo commit mới nên commit id luôn giữ nguyên',
    'Có thể rebase nhánh main đã chia sẻ mà không ảnh hưởng ai vì commit id cũ không đổi',
    'Merge có thể kết hợp hai nhánh mà giữ nguyên các commit hiện có; nếu lịch sử phân nhánh, merge commit có thể ghi lại điểm kết hợp',
    'Sau mọi lần rebase phải force-push nhánh main để cập nhật commit'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: rebase phát lại commit trên nền mới; merge giữ lịch sử và có thể tạo merge commit.**

### Hai cách kết hợp lịch sử
{{git fetch}} cập nhật thông tin remote-tracking như {{origin/main}} mà không tự thay đổi nhánh hiện tại. {{git rebase origin/main}} trên nhánh feature lấy các commit riêng của feature rồi phát lại chúng trên đỉnh main mới. Vì commit chứa cả nội dung lẫn cha của nó, commit được phát lại thường có commit id mới.

{{git merge origin/main}} kết hợp hai lịch sử; các commit gốc giữ nguyên id. Nếu hai nhánh đã phân kỳ, Git thường tạo merge commit có hai cha để thể hiện điểm hội tụ, trừ khi có fast-forward.

### Vì sao từng phương án đúng hoặc sai
- **Đúng: rebase nhánh riêng**: phù hợp với commit chưa chia sẻ và tạo lịch sử dễ đọc; cần giải quyết conflict nếu thay đổi đụng nhau.
- **Sai: id luôn giữ nguyên**: đổi commit cha làm thay đổi nội dung commit, nên commit id mới được tạo.
- **Sai: rebase nhánh đã chia sẻ không ảnh hưởng**: người khác có thể đang dựa trên commit cũ; viết lại lịch sử gây lệch nhánh và buộc họ đồng bộ lại.
- **Đúng: merge giữ commit hiện có**: merge thể hiện rõ lịch sử phân nhánh; merge commit chỉ xuất hiện khi không thể fast-forward theo cấu hình/thao tác.
- **Sai: force-push main sau mọi rebase**: thường không cần và nguy hiểm trên nhánh chung. Rebase nhánh riêng có thể cần cập nhật nhánh remote của chính nó bằng cách an toàn theo quy trình team, không phải đẩy ghi đè main.

> Senior tip: quy ước thực tế: rebase commit local chưa chia sẻ để làm lịch sử gọn; merge hoặc quy trình đã thống nhất cho nhánh dùng chung. Không force-push nhánh protected.`
},
{
  id: 'qz-primer-025', topic: 'primer', multi: true,
  q: 'Một reverse proxy chuyển request tới backend. Hai tình huống nào thường tương ứng với HTTP 502 và 504? (Chọn 2)',
  options: [
    'Backend trả response hợp lệ trước hạn chờ; proxy ghi nhận 504 vì response đến quá sớm',
    'Proxy không nhận được response kịp thời từ upstream trước timeout; proxy trả 504 Gateway Timeout',
    'Client gửi JSON sai cú pháp trực tiếp tới backend; proxy luôn phải đổi thành 502',
    'Proxy kết nối được upstream nhưng upstream trả response không hợp lệ; proxy có thể trả 502 Bad Gateway',
    'Mọi lỗi trong code backend đều phải thành 502, bất kể proxy có nhận response hay không'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: timeout khi chờ upstream thường là 504; response upstream lỗi/không hợp lệ thường là 502.**

### Vai trò của gateway
{{Reverse proxy}} (proxy ngược) nhận request từ client rồi chuyển tiếp tới một server phía sau, gọi là {{upstream}}. Proxy cần báo lỗi gateway khi không thể cung cấp response hợp lệ từ upstream.

{{504 Gateway Timeout}} thường nghĩa là proxy/gateway không nhận được response kịp thời từ upstream. {{502 Bad Gateway}} thường nghĩa là proxy nhận được phản hồi không hợp lệ hoặc không thể dùng được từ upstream. Cách triển khai cụ thể có thể khác đôi chút giữa proxy, nhưng hai mã giúp phân loại timeout với lỗi gateway-response.

### Vì sao từng phương án đúng hoặc sai
- **Sai: response hợp lệ đến sớm gây 504**: timeout là chờ quá lâu, không phải response đến sớm.
- **Đúng: hết thời gian chờ upstream**: nếu proxy chờ vượt timeout mà không có response, 504 là biểu hiện thường gặp.
- **Sai: JSON client lỗi luôn là 502**: lỗi cú pháp request thuộc phía client/backend validation, thường được ứng dụng trả 4xx; không tự động thành lỗi gateway.
- **Đúng: response upstream không hợp lệ**: proxy không thể chuyển tiếp response hợp lệ nên 502 phù hợp trong trường hợp phổ biến.
- **Sai: mọi lỗi backend là 502**: nếu backend gửi một HTTP 500 hợp lệ, proxy thường chuyển tiếp 500; 502 không đồng nghĩa mọi lỗi nghiệp vụ hoặc lỗi code.

> Senior tip: khi thấy 502/504, so sánh log proxy với log backend theo cùng request id. Backend không có request thường gợi ý vấn đề kết nối/routing; backend ghi nhận xử lý lâu thường hướng tới timeout hoặc phụ thuộc chậm.`
},
);