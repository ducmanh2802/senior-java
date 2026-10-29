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
}
);
