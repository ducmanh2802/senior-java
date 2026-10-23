/* Bài học track "modern". Schema & markup: AGENTS.md mục 12 (bài mẫu: lessons-collections.js). */
(window.LESSONS = window.LESSONS || []).push(
{
  id: 'lesson-modern-001',
  track: 'modern',
  order: 1,
  title: 'Stream: lazy evaluation, stateless/stateful và Collectors nhóm theo khách hàng, tháng',
  level: 'senior',
  minutes: 30,
  goals: [
    'Nói được Stream chạy lazy ra sao và phân biệt intermediate/terminal operation',
    'Dùng {{Collectors.groupingBy}}, {{toMap}}, {{partitioningBy}} để thống kê dữ liệu',
    'Biết khi nào nên và tránh parallel stream, tránh side-effect trong pipeline',
  ],
  body: `**Tóm tắt:** Stream là pipeline xử lý dữ liệu gồm nguồn, các thao tác trung gian (lazy, chưa chạy) và một thao tác kết thúc (terminal) mới thực thi. Phân biệt stateless/stateful giúp viết stream đúng hiệu năng; Collectors (groupingBy, toMap, partitioningBy) dùng để tổng hợp và nhóm dữ liệu theo khách hàng, tháng; parallel stream chỉ dùng khi dữ liệu lớn và tác vụ không block.

### Stream chạy lazy: nguồn → trung gian → cuối cùng
Một Stream không lưu dữ liệu, nó chỉ mang một pipeline các thao tác. Khi gọi {{filter}} hay {{map}}, Stream chỉ **đăng ký** bước xử lý, chưa duyệt phần tử nào. Chỉ khi có **terminal operation** ({{collect}}, {{forEach}}, {{toList}}, {{count}}, {{anyMatch}}…) dữ liệu mới được kéo qua từng bước.

~~~java
Stream<String> s = names.stream()
    .filter(n -> { System.out.println("loc " + n); return n.length() > 3; })
    .map(String::toUpperCase);   // chưa in dòng nào
List<String> out = s.toList();   // terminal -> mới chạy, mới in "loc ..."
~~~

- Với các thao tác stateless, mỗi phần tử thường đi qua các bước downstream trước khi phần tử kế tiếp được xử lý; thao tác stateful như {{sorted}} có thể cần xử lý/buffer thêm dữ liệu. Cơ chế này cho phép các terminal operation short-circuit dừng sớm.
- {{findFirst}}, {{anyMatch}}, {{limit}} có thể dừng sớm; {{forEach}} duyệt hết.
- Stream **single-use**: gọi terminal hai lần ném {{IllegalStateException}}.
- Không có terminal op ⇒ không chạy gì; đây là lỗi hay gặp khi quên {{collect}}.

### Stateless vs stateful
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}} xử lý từng phần tử độc lập, không cần nhớ phần tử khác. Hiệu quả, dễ parallel.
- **Stateful**: {{distinct}}, {{sorted}}, {{limit}}, {{skip}}, {{takeWhile}}/{{dropWhile}} phải buffer hoặc biết toàn bộ dữ liệu. {{sorted}} trên stream vô hạn không bao giờ kết thúc; {{distinct}} phải nhớ mọi giá trị đã thấy.
- Stateful op làm parallel kém hiệu quả vì phải đồng bộ/merge; {{limit}} trong parallel đặc biệt tốn kém.

### Collectors: nhóm và tổng hợp
| Collector | Dùng khi nào | Kết quả |
|---|---|---|
| {{groupingBy(f)}} | nhóm phần tử theo key | Map<K, List<T>> |
| {{groupingBy(f, groupingBy(g))}} | nhóm hai cấp (khách hàng rồi tháng) | Map<K, Map<K2, List<T>>> |
| {{groupingBy(f, summingDouble(m))}} | nhóm rồi tổng | Map<K, Double> |
| {{toMap(k, v)}} | biến stream thành map | Map<K, V> |
| {{partitioningBy(pred)}} | chia thành đúng/sai | Map<Boolean, List<T>> |

{{toMap}} ném {{IllegalStateException}} nếu key trùng; dùng {{toMap(k, v, (old, newV) -> newV)}} để quy định ghi đè.

Ví dụ nhóm giao dịch theo khách hàng và tháng:
~~~java
Map<String, Map<String, Double>> theoKhachHang = txns.stream()
    .collect(Collectors.groupingBy(
        Transaction::customerId,
        Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount))
    ));
// theoKhachHang.get("KH001").get("2024-03") = tổng tiền tháng 3 của KH001
~~~

### Parallel stream: chỉ dùng khi đủ lớn
Mặc định dùng {{ForkJoinPool.commonPool()}}, pool dùng chung trong JVM. Parallelism mặc định thường dựa trên số processor khả dụng trừ một, nhưng có thể được cấu hình; đừng coi đây là số thread cố định trong mọi môi trường. Có hại khi tác vụ block (DB, HTTP, file), dữ liệu nhỏ, nguồn split kém (LinkedList), hoặc có side-effect không thread-safe. Không có ngưỡng kích thước phổ quát để quyết định parallel: benchmark workload thực tế và kiểm tra mức tranh chấp pool. Trong service web, tránh dùng {{parallelStream}} cho I/O.

> Senior tip: viết stream tuần tự mặc định cho rõ ràng; chỉ bật parallel khi có benchmark chứng minh và dữ liệu đủ lớn. Tiền tệ dùng {{BigDecimal}}, không dùng double trong production.

### Liên hệ phỏng vấn
Interviewer hay hỏi: intermediate/terminal khác nhau ở điểm nào, stream có lưu dữ liệu không, sao sorted stream vô hạn không kết thúc, groupingBy hai cấp viết ra sao, parallel stream dùng chung pool gì và khi nào tránh. Bài tập dưới đây bắt bạn viết Collectors nhóm giao dịch theo khách hàng và tháng.`,
  exercises: [
    {
      title: 'Thống kê giao dịch theo khách hàng và tháng',
      prompt: `Cho {{List<Transaction>}} (Transaction có {{customerId}}, {{month}} dạng "YYYY-MM", {{amount}}). Viết {{TransactionStats.byCustomerAndMonth(txns)}} trả về {{Map<String, Map<String, Double>>}}: khách hàng → (tháng → tổng tiền). Dùng Stream + Collectors, không dùng vòng lặp for thủ công.`,
      starter: `record Transaction(String customerId, String month, double amount) {}

class TransactionStats {
    static Map<String, Map<String, Double>> byCustomerAndMonth(List<Transaction> txns) {
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
        check("empty list", () -> {
            Map<String, Map<String, Double>> r = TransactionStats.byCustomerAndMonth(List.of());
            eq(true, r.isEmpty());
        });
        check("one transaction", () -> {
            List<Transaction> txns = List.of(new Transaction("KH001", "2024-03", 100.0));
            Map<String, Map<String, Double>> r = TransactionStats.byCustomerAndMonth(txns);
            eq(1, r.size());
            eq(1, r.get("KH001").size());
            eq(100.0, r.get("KH001").get("2024-03"));
        });
        check("same customer same month sums", () -> {
            List<Transaction> txns = List.of(
                new Transaction("KH001", "2024-03", 100.0),
                new Transaction("KH001", "2024-03", 250.5),
                new Transaction("KH001", "2024-04", 50.0)
            );
            Map<String, Map<String, Double>> r = TransactionStats.byCustomerAndMonth(txns);
            eq(350.5, r.get("KH001").get("2024-03"));
            eq(50.0, r.get("KH001").get("2024-04"));
            eq(2, r.get("KH001").size());
        });
        check("different customers same month separated", () -> {
            List<Transaction> txns = List.of(
                new Transaction("KH001", "2024-03", 100.0),
                new Transaction("KH002", "2024-03", 200.0)
            );
            Map<String, Map<String, Double>> r = TransactionStats.byCustomerAndMonth(txns);
            eq(100.0, r.get("KH001").get("2024-03"));
            eq(200.0, r.get("KH002").get("2024-03"));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Transaction(String customerId, String month, double amount) {}

class TransactionStats {
    static Map<String, Map<String, Double>> byCustomerAndMonth(List<Transaction> txns) {
        // nhóm theo khách hàng, rồi theo tháng, tổng tiền bằng summingDouble
        return txns.stream()
            .collect(Collectors.groupingBy(
                Transaction::customerId,
                Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount))
            ));
    }
}`,
      hints: [
        'Dùng {{Collectors.groupingBy(Transaction::customerId, Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount)))}}.',
        'Nhập {{java.util.stream.*}} (đã có sẵn) để dùng {{Collectors}}.',
      ],
      explain: `{{groupingBy}} ngoài key còn nhận collector hạ cấp, nên nesting hai lần groupingBy tạo cấu trúc khách hàng → tháng → tổng. {{summingDouble}} trích trường {{amount}} rồi cộng dồn. Kết quả là Map[mid] khách hàng × tháng, thiếu tổ hợp nào sẽ không có key (không tự tạo entry rỗng). Thay double bằng {{BigDecimal}} nếu xử lý tiền thật.

Lỗi hay gặp: quên terminal op (kết quả rỗng), dùng {{toMap}} với key trùng mà không đưa hàm merge (ném exception), và dịch stream sang list rồi vòng lặp for (bỏ mất ý nghĩa Stream).`,
    },
  ],
  check: [
    {
      q: 'Stream intermediate operation (ví dụ {{filter}}, {{map}}) làm gì khi được gọi?',
      options: ['Duyệt ngay toàn bộ dữ liệu', 'Chỉ xây dựng pipeline, chưa xử lý phần tử', 'Gọi terminal operation ngầm định', 'Ném exception nếu không có terminal op'],
      answer: 1,
      explain: 'Intermediate op là lazy: chỉ đăng ký bước xử lý vào pipeline, dữ liệu chưa được duyệt. Chỉ có terminal op mới kéo dữ liệu qua pipeline.',
    },
    {
      q: 'Collectors.groupingBy(f, summingDouble(m)) dùng làm gì?',
      options: ['Lọc phần tử theo f', 'Nhóm theo f rồi tổng giá trị m cho mỗi nhóm', 'Chia stream thành hai phần đúng/sai', 'Sắp xếp theo m'],
      answer: 1,
      explain: 'groupingBy chia theo key f; summingDouble(m) trích trường m rồi cộng dồn mỗi nhóm. Các phương án khác là thao tác khác của Collectors.',
    },
    {
      q: 'Parallel stream không nên dùng khi nào?',
      options: ['Dữ liệu lớn, CPU-bound', 'Tác vụ block như gọi DB/HTTP', 'Nguồn là ArrayList', 'Toán tử stateless'],
      answer: 1,
      explain: 'Tác vụ block cạn thread của ForkJoinPool.commonPool dùng chung, gây đói cho các stream khác. Dữ liệu lớn, CPU-bound, nguồn split tốt, toán tử stateless thì mới phù hợp parallel.',
    },
  ],
  related: ['modern-001', 'modern-011'],
  tags: ['Stream', 'Collectors', 'lazy', 'parallel'],
},
{
  id: 'lesson-modern-002',
  track: 'modern',
  order: 2,
  title: 'Optional trong API: orElse/orElseGet, tránh get()',
  level: 'mid',
  minutes: 25,
  goals: [
    'Nói được Optional biểu đạt kết quả có thể vắng mặt thay vì trả null',
    'Phân biệt {{orElse}} và {{orElseGet}}, {{of}} và {{ofNullable}}',
    'Viết chuỗi xử lý bằng Optional mà không dùng {{get()}}',
  ],
  body: `**Tóm tắt:** Optional thường được dùng làm kiểu trả về để biểu đạt trường hợp "không có" thay vì trả null; dùng {{orElse}}/{{orElseGet}}, tránh {{get()}} trần, và cân nhắc kỹ trước khi dùng làm field, tham số hay phần tử collection.

### Vì sao có Optional
Trả null làm caller quên kiểm tra ⇒ NullPointerException. Optional khiến khả năng vắng mặt hiển thị rõ trong kiểu trả về để caller có thể quyết định cách xử lý. Nó là **tín hiệu ở biên API**, không phải thay mọi null trong code nội bộ.

### Cách tạo
- {{Optional.of(x)}}: x chắc chắn không null, ngược lại ném NPE.
- {{Optional.ofNullable(x)}}: cho phép null → {{Optional.empty()}}.
- {{Optional.empty()}}: biểu diễn không có giá trị, dùng khi biết chắc không có.

### Chuỗi xử lý (không dùng get())
~~~java
Optional<User> opt = findById(id);
String email = opt.map(User::email)
                  .filter(e -> !e.isBlank())
                  .orElse("chưa có email");
~~~
- {{map}} chuyển giá trị nếu có, rỗng nếu rỗng.
- {{filter}} giữ giá trị nếu thỏa điều kiện, không thì rỗng.
- {{orElse(default)}} trả giá trị mặc định (được tính ngay).
- {{orElseGet(supplier)}} chỉ tính mặc định khi rỗng → dùng khi mặc định đắt (đọc DB).
- {{orElseThrow(() -> new NotFoundException())}} biến vắng mặt thành lỗi rõ ràng.
- {{ifPresent}}, {{ifPresentOrElse}} (Java 9), {{stream()}} (Java 9).

### flatMap: xử lý Optional lồng nhau
Nếu hàm trả về {{Optional}} và bạn muốn nối tiếp chuỗi xử lý, dùng {{flatMap}} thay vì {{map}} (map sẽ tạo {{Optional<Optional<T>>}}).

~~~java
Optional<Optional<Address>> addr = opt.map(User::address);   // Optional<Optional<Address>>
Optional<Address> addr2 = opt.flatMap(User::address);         // Optional<Address> phẳng
~~~

### Không nên
- **Field** entity/DTO: {{Optional}} không implement {{Serializable}}; field này cũng thường làm mapping/payload phức tạp hơn. Với Jackson, hỗ trợ phụ thuộc module/configuration, còn JPA entity nên dùng field giá trị thông thường.
- **Tham số method**: thường nhận giá trị có thể null hoặc overload thay vì bắt caller bọc một giá trị trong Optional; chọn theo contract và cách dùng API.
- **Collection**: trả list rỗng thay vì Optional rỗng.
- **{{opt.get()}}**: ném NoSuchElementException, khó debug. Dùng {{orElseThrow}} có message.
- {{opt.isPresent()}} rồi {{get()}} là null-check trá hình.

### orElse vs orElseGet
~~~java
User u1 = opt.orElse(loadFromDb());      // luôn gọi DB
User u2 = opt.orElseGet(() -> loadFromDb());  // chỉ gọi khi rỗng
~~~

> Senior tip: {{Optional}} thường hữu ích làm kiểu trả về để biểu đạt kết quả có thể vắng mặt; với collection, thường trả collection rỗng thay vì bọc {{Optional}}.

### Liên hệ phỏng vấn
Interviewer hỏi: Optional nên dùng ở đâu, không nên ở đâu, orElse vs orElseGet, of vs ofNullable, tại sao tránh get(), sao Optional không làm field JPA. Bài tập dưới đây bắt bạn refactor chuỗi null-check lồng nhau thành Optional mà không dùng get().`,
  exercises: [
    {
      title: 'Refactor chuỗi null-check thành Optional',
      prompt: `Cho {{Order}} có {{customer}}, {{Customer}} có {{address}}, {{Address}} có {{city}}. Viết {{OrderService.cityOf(order)}} trả thành phố hoặc "Chưa biết" nếu bất kỳ đâu trong chuỗi là null. Viết {{cityOfLazy(order, fallback)}} dùng {{orElseGet}} để fallback chỉ tính khi thực sự thiếu. Không được dùng {{get()}}.`,
      starter: `class Order { String code; Customer customer; Order(String code, Customer customer){this.code=code;this.customer=customer;} }
class Customer { String id; Address address; Customer(String id, Address address){this.id=id;this.address=address;} }
class Address { String city; Address(String city){this.city=city;} }
class OrderService {
    static String cityOf(Order order) {
        throw new UnsupportedOperationException("TODO");
    }
    static String cityOfLazy(Order order, java.util.function.Supplier<String> fallback) {
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
        check("đầy đủ thành phố", () -> {
            Order o = new Order("D001", new Customer("C1", new Address("Hà Nội")));
            eq("Hà Nội", OrderService.cityOf(o));
        });
        check("order null", () -> eq("Chưa biết", OrderService.cityOf(null)));
        check("customer null", () -> eq("Chưa biết", OrderService.cityOf(new Order("D001", null))));
        check("address null", () -> eq("Chưa biết", OrderService.cityOf(new Order("D001", new Customer("C1", null)))));
        check("city null", () -> eq("Chưa biết", OrderService.cityOf(new Order("D001", new Customer("C1", new Address(null))))));
        check("fallback chỉ gọi khi thiếu", () -> {
            boolean[] called = { false };
            String r = OrderService.cityOfLazy(null, () -> { called[0] = true; return "X"; });
            eq("X", r); eq(true, called[0]);
        });
        check("fallback không gọi khi có giá trị", () -> {
            boolean[] called = { false };
            Order o = new Order("D001", new Customer("C1", new Address("Hà Nội")));
            String r = OrderService.cityOfLazy(o, () -> { called[0] = true; return "X"; });
            eq("Hà Nội", r); eq(false, called[0]);
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class Order { String code; Customer customer; Order(String code, Customer customer){this.code=code;this.customer=customer;} }
class Customer { String id; Address address; Customer(String id, Address address){this.id=id;this.address=address;} }
class Address { String city; Address(String city){this.city=city;} }
class OrderService {
    static String cityOf(Order order) {
        return Optional.ofNullable(order)
            .map(o -> o.customer)
            .map(c -> c.address)
            .map(a -> a.city)
            .orElse("Chưa biết");
    }
    static String cityOfLazy(Order order, java.util.function.Supplier<String> fallback) {
        return Optional.ofNullable(order)
            .map(o -> o.customer)
            .map(c -> c.address)
            .map(a -> a.city)
            .orElseGet(fallback);
    }
}`,
      hints: [
        'Dùng {{Optional.ofNullable(order)}} rồi {{.map(Order::customer).map(Customer::address).map(Address::city)}}.',
        'Kết thúc bằng {{.orElse("Chưa biết")}} hoặc {{.orElseGet(fallback)}}; không dùng {{get()}}.',
        'Nhập {{import java.util.Optional;}} và {{import java.util.function.Supplier;}}.',
      ],
      explain: `{{Optional.ofNullable(order)}} rỗng nếu order null, rồi {{map}} ngắn mạch: một liên kết null trong chuỗi làm chuỗi rỗng, và {{orElse}} trả giá trị mặc định. Không cần if-null lồng nhau, không dùng {{get()}} nên không bao giờ ném NoSuchElementException. {{orElseGet}} chỉ gọi supplier khi rỗng, thích hợp cho fallback đắt.

Lỗi hay gặp: dùng {{opt.get()}} khi chắc chắn có giá trị nhưng runtime null; viết {{isPresent()}} rồi {{get()}} (trá hình null-check); dùng {{orElse}} với hàm tính mặc định đắt nhưng vẫn chạy dù đã có giá trị.`,
    },
  ],
  check: [
    {
      q: '{{Optional.of(x)}} và {{Optional.ofNullable(x)}} khác nhau ở điểm nào?',
      options: ['Không khác nhau', 'of ném NPE nếu x null; ofNullable cho phép null → empty', 'ofNullable ném NPE nếu x null', 'of chỉ dùng với primitive'],
      answer: 1,
      explain: '{{Optional.of(x)}} ném NullPointerException nếu x null; {{Optional.ofNullable(x)}} chấp nhận null và trả về {{Optional.empty()}}.',
    },
    {
      q: 'Khi nào nên dùng {{orElseGet}} thay vì {{orElse}}?',
      options: ['Luôn, vì nhanh hơn', 'Khi giá trị mặc định đắt và chỉ muốn tính khi Optional rỗng', 'Khi Optional có giá trị', 'Không bao giờ'],
      answer: 1,
      explain: '{{orElse}} tính tham số ngay lập tức kể cả khi Optional có giá trị; {{orElseGet}} chỉ gọi supplier khi rỗng, nên dùng khi mặc định đắt (ví dụ đọc DB).',
    },
    {
      q: 'Tại sao tránh {{opt.get()}}?',
      options: ['Ném NoSuchElementException khi rỗng', 'Chỉ làm việc với primitive', 'Luôn trả null', 'Không có method này'],
      answer: 0,
      explain: '{{get()}} không kiểm tra, ném {{NoSuchElementException}} khi rỗng. Dùng {{orElseThrow}} với thông điệp rõ ràng hơn.',
    },
  ],
  related: ['modern-002'],
  tags: ['Optional', 'orElse', 'orElseGet', 'API design'],
},
{
  id: 'lesson-modern-003',
  track: 'modern',
  order: 3,
  title: 'Record, sealed interface và pattern matching (Java 21)',
  level: 'lead',
  minutes: 30,
  goals: [
    'Nói được record là gì, compact constructor và khi nào dùng làm DTO',
    'Nói được sealed interface giới hạn kiểu con như thế nào và exhaustiveness',
    'Phân biệt instanceof pattern (Java 16) và switch pattern (Java 21)',
  ],
  body: `**Tóm tắt:** record là class **final**, có các component được khai báo final và tự sinh accessor/equals/hashCode/toString; bản thân record không bảo đảm bất biến sâu nếu component trỏ tới object mutable. Sealed interface giới hạn tập class con được phép kế thừa, mô hình hoá algebraic data type; pattern matching (instanceof Java 16, switch Java 21) cho phép rẽ nhánh theo kiểu và compiler kiểm tra tính đầy đủ trong switch expression khi hierarchy sealed.

### Record (Java 16+)
~~~java
record Transaction(String id, long amount) {
    Transaction {
        if (amount < 0) throw new IllegalArgumentException("amount < 0");
    }
}
~~~
- Tự sinh field {{private final}}, accessor {{id()}}/{{amount()}} (không phải getX), {{equals}}/{{hashCode}}/{{toString}}, canonical constructor.
- Không thể kế thừa class khác (đã final), nhưng implement interface được.
- Không có setter; "sửa" bằng cách tạo record mới.
- Compact constructor chạy trước khi field gán, dùng để validate/chuẩn hoá (ví dụ defensive copy collection bằng {{List.copyOf}}).
- Rất hợp làm DTO/value object. Record không phù hợp làm JPA entity chuẩn: entity cần đáp ứng yêu cầu JPA về class không final, constructor không tham số và trạng thái persistent; Hibernate thường cần subclass proxy cho lazy loading.

### Sealed interface (Java 17+)
~~~java
sealed interface Payment permits Card, Transfer, Wallet {
    long amount();
}
record Card(String last4, long amount) implements Payment {}
record Transfer(String bank, long amount) implements Payment {}
record Wallet(String provider, long amount) implements Payment {}
~~~
- {{permits}} liệt kê các kiểu con được phép; mỗi kiểu con phải extends/implement sealed type và khai báo modifier ({{final}}, {{non-sealed}}, hoặc {{sealed}}).
- Ngắn gọn hơn việc kiểm soát kế thừa bằng constructor private, và compiler biết toàn bộ subtype.

### Pattern matching
- **instanceof pattern** (Java 16): {{if (p instanceof Card c)}} gán biến {{c}} đã ép kiểu, không cần cast thủ công.
- **switch pattern** (Java 21): match theo kiểu + guard; với switch expression trên hierarchy sealed, compiler có thể kiểm tra **exhaustive** (không cần default trong một số trường hợp).
~~~java
// Java 21 switch pattern (chỉ dùng trong body minh hoá; bài tập dùng Java 17)
double fee(Payment p) {
    return switch (p) {
        case Card c -> c.amount() * 0.001;
        case Transfer t -> 3000.0;
        case Wallet w -> 0.0;
    };
}
~~~
- Cần xử lý {{null}} (ném NullPointerException trong switch pattern nếu không có null case).
- Thêm subtype mới có thể làm switch không exhaustive ⇒ phải cập nhật mọi switch.

> Senior tip: dùng record cho value object/DTO, entity JPA giữ class thường. Sealed + pattern matching giúp mã phân nhánh an toàn; khi thêm subtype, compiler sẽ chỉ ra switch expression cần cập nhật để vẫn exhaustive.

### Liên hệ phỏng vấn
Interviewer hỏi: record khác class thường ở điểm nào, compact constructor dùng làm gì, sealed giúp gì, exhaustiveness đảm bảo gì, instance-of pattern vs switch pattern khác nhau, sao record không làm JPA entity. Bài tập dưới đây (biên dịch Java 17) bắt bạn mô hình hoá lệnh thanh toán bằng sealed + record và tính phí bằng instanceof pattern.`,
  exercises: [
    {
      title: 'Lệnh thanh toán bằng sealed + record và tính phí',
      prompt: `Mô hình hoá lệnh thanh toán: {{sealed interface Payment}} có thành phần {{Card}}, {{Transfer}}, {{Wallet}} (dùng record, mỗi record có trường {{amount}} bằng VND). Viết {{PaymentFee.fee(Payment)}} tính phí:
- Card: 0.1% số tiền, min 1.000 VND, max 50.000 VND.
- Transfer: phí cố định 3.000 VND.
- Wallet: miễn phí (0).
Dùng {{instanceof}} pattern (Java 16+), compile được bằng Java 17. Không dùng switch pattern (Java 21).`,
      starter: `sealed interface Payment permits Card, Transfer, Wallet {
    long amount();
}
record Card(String last4, long amount) implements Payment {}
record Transfer(String bank, long amount) implements Payment {}
record Wallet(String provider, long amount) implements Payment {}

class PaymentFee {
    double fee(Payment p) {
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
        PaymentFee f = new PaymentFee();
        check("card 1.000.000 -> 1.000 (min)", () -> eq(1000.0, f.fee(new Card("1234", 1_000_000))));
        check("card 500.000 -> 1.000 (min)", () -> eq(1000.0, f.fee(new Card("1234", 500_000))));
        check("card 10.000.000 -> 10.000", () -> eq(10000.0, f.fee(new Card("1234", 10_000_000))));
        check("card 100.000.000 -> 50.000 (max)", () -> eq(50000.0, f.fee(new Card("1234", 100_000_000))));
        check("transfer -> 3.000", () -> eq(3000.0, f.fee(new Transfer("VCB", 5_000_000))));
        check("wallet -> 0", () -> eq(0.0, f.fee(new Wallet("MoMo", 999_999_999))));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `sealed interface Payment permits Card, Transfer, Wallet {
    long amount();
}
record Card(String last4, long amount) implements Payment {}
record Transfer(String bank, long amount) implements Payment {}
record Wallet(String provider, long amount) implements Payment {}

class PaymentFee {
    double fee(Payment p) {
        if (p instanceof Card c) {
            double f = c.amount() * 0.001;   // 0.1%
            return Math.max(1000, Math.min(50000, f));
        }
        if (p instanceof Transfer) return 3000.0;
        if (p instanceof Wallet) return 0.0;
        throw new IllegalArgumentException("unknown: " + p);
    }
}`,
      hints: [
        'Dùng {{instanceof}} pattern: {{if (p instanceof Card c)}} đã ép kiểu và có biến {{c}}.',
        'Card: {{c.amount() * 0.001}} rồi áp dụng min/max bằng {{Math.max}} / {{Math.min}}.',
        'Mỗi record là một subtype của {{Payment}} nên instanceof pattern match theo kiểu.',
      ],
      explain: `{{instanceof}} pattern (Java 16+) kiểm tra kiểu và gán biến đã ép kiểu trong cùng một lệnh, không cần cast thủ công. Sealed interface đảm bảo chỉ Card/Transfer/Wallet là subtype, nên ba nhánh instanceof bao phủ hết mọi trường hợp hợp lệ (thêm default/IllegalArgumentException cho phòng ngừa). Tất cả tính năng này compile được trên Java 17; switch pattern trên biểu thức switch cần Java 21 nên chỉ dạy trong lý thuyết, bài tập dùng instanceof.

Lỗi hay gặp: quên xử lý null / subtype chưa biết; dùng switch pattern (Java 21) mà bắt buộc compile Java 17; tính fee bằng double gây sai số — tiền thật dùng BigDecimal.`,
    },
  ],
  check: [
    {
      q: 'Sealed interface dùng {{permits}} để làm gì?',
      options: ['Cho phép mọi class kế thừa', 'Liệt kê các subtype được phép kế thừa', 'Tự động tạo record', 'Thay thế interface thông thường'],
      answer: 1,
      explain: '{{sealed interface X permits A, B}} chỉ cho phép A, B kế thừa X; mỗi subtype phải khai báo final/non-sealed/sealed. Compiler biết toàn bộ subtype.',
    },
    {
      q: 'instanceof pattern (Java 16) giúp gì so với instanceof thông thường?',
      options: ['Chỉ kiểm tra kiểu', 'Kiểm tra kiểu và gán biến đã ép kiểu, không cần cast thủ công', 'Chỉ dùng với record', 'Ném exception nếu sai kiểu'],
      answer: 1,
      explain: '{{if (p instanceof Card c)}} vừa kiểm tra và tạo biến {{c}} kiểu Card đã được cast, không cần cast thủ công.',
    },
    {
      q: 'Switch pattern (Java 21) trên hierarchy sealed đảm bảo gì?',
      options: ['Chạy nhanh hơn if-else', 'Compiler kiểm tra exhaustive (đủ mọi subtype)', 'Tự động thêm subtype mới', 'Không cần xử lý null'],
      answer: 1,
      explain: 'Khi hierarchy sealed, compiler biết tất cả subtype và kiểm tra switch đã xử lý hết (exhaustive). Còn null vẫn cần xử lý riêng.',
    },
  ],
  related: ['modern-003', 'modern-004'],
  tags: ['record', 'sealed', 'pattern matching', 'Java 21'],
},
{
  id: 'lesson-modern-004',
  track: 'modern',
  order: 4,
  title: 'Lambda, functional interface, method reference và compose',
  level: 'mid',
  minutes: 25,
  goals: [
    'Nói được functional interface là gì và lambda tạo thể hiện như thế nào',
    'Dùng method reference (static, instance, constructor) và compose (andThen/compose, Predicate.and/or)',
    'Viết pipeline kiểm tra hợp lệ bằng Predicate.and/or',
  ],
  body: `**Tóm tắt:** Lambda là hàm ẩn danh gán cho functional interface (một phương thức trừu tượng duy nhất); method reference rút gọn lambda; compose nối hàm, Predicate.and/or/negate ghép điều kiện. Đây là nền tảng của Stream và các API hiện đại.

### Functional interface
Là interface có đúng một phương thức trừu tượng, gắn {{@FunctionalInterface}}. Lambda tạo thể hiện của nó.

~~~java
@FunctionalInterface
interface Check<T> {
    boolean test(T t);
}
Check<Integer> isEven = n -> n % 2 == 0;   // lambda
boolean ok = isEven.test(4);               // true
~~~

JDK sẵn có {{Predicate<T>}}, {{Function<T,R>}}, {{Consumer<T>}}, {{Supplier<T>}} trong {{java.util.function}}.

### Lambda và method reference
- {{Class::instanceMethod}} (ví dụ {{String::isEmpty}})
- {{Class::staticMethod}} (ví dụ {{Objects::isNull}})
- {{object::instanceMethod}} (ví dụ {{this::validate}})
- {{Class::new}} (constructor reference)

### Compose (nối hàm)
{{Function.andThen}} / {{compose}} nối hai function; {{Predicate.and}}, {{or}}, {{negate}} ghép điều kiện.

~~~java
Function<Integer, Integer> plus1 = n -> n + 1;
Function<Integer, Integer> times2 = n -> n * 2;
Function<Integer, Integer> thenTimes2 = plus1.andThen(times2);  // (n+1)*2
Predicate<Integer> adult = n -> n >= 18;
Predicate<Integer> hasId = n -> n > 0;
Predicate<Integer> valid = adult.and(hasId).or(n -> n == 0);
~~~

### Pitfall
- Lambda bắt buộc biến cục bộ là **effectively final** (không gán lại).
- Method reference có dạng {{object::instanceMethod}} giữ receiver {{object}}; dạng {{Class::instanceMethod}} nhận receiver làm đối số đầu tiên. Trong lambda, {{this}} vẫn trỏ theo lexical scope.
- Side effect trong lambda (cập nhật biến ngoài) kém rõ ràng, không an toàn khi parallel.

### Comparator: sắp xếp và ghép điều kiện
{{Comparator}} là functional interface, dùng {{comparing}} rồi {{thenComparing}} để sắp xếp theo nhiều tiêu chuẩn.

~~~java
list.sort(Comparator.comparing(Transaction::month)
        .thenComparing(Comparator.comparing(Transaction::customerId)));
~~~
- {{Comparator.naturalOrder()}} và {{reversed()}} sắp xếp tự nhiên/ngược; {{comparingInt}} tránh autoboxing cho int.

> Senior tip: ưu tiên method reference khi ngắn gọn hơn lambda; tránh lambda lồng quá sâu; cho logic phức tạp thì viết method riêng và tham chiếu tới nó.

### Liên hệ phỏng vấn
Interviewer hỏi: functional interface là gì, lambda khác method reference ở điểm nào, andThen vs compose khác nhau thế nào, Predicate.and/or dùng khi nào, biến bắt trong lambda phải effectively final vì sao. Bài tập dưới đây bắt bạn viết pipeline kiểm tra hợp lệ bằng Predicate.and/or.`,
  exercises: [
    {
      title: 'Pipeline kiểm tra hợp lệ bằng Predicate.and/or',
      prompt: `Cho {{User(String name, int age, String email)}}. Viết {{UserValidator.userValidator()}} trả về {{Predicate<User>}} kiểm tra: tên không rỗng, tuổi >= 18, email có ký tự "@". Dùng {{Predicate.and}} (và có thể dùng {{or}}/{{negate}}). Không dùng vòng lặp if thủ công.`,
      starter: `record User(String name, int age, String email) {}
class UserValidator {
    static java.util.function.Predicate<User> userValidator() {
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
        java.util.function.Predicate<User> v = UserValidator.userValidator();
        check("hợp lệ", () -> eq(true, v.test(new User("An", 20, "an@example.com"))));
        check("tên null", () -> eq(false, v.test(new User(null, 20, "a@b.com"))));
        check("tên trắng", () -> eq(false, v.test(new User("   ", 20, "a@b.com"))));
        check("dưới 18", () -> eq(false, v.test(new User("An", 17, "a@b.com"))));
        check("email không có @", () -> eq(false, v.test(new User("An", 20, "abiemail.com"))));
        check("cả nhiều lỗi", () -> eq(false, v.test(new User(null, 10, ""))));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record User(String name, int age, String email) {}
class UserValidator {
    static java.util.function.Predicate<User> userValidator() {
        java.util.function.Predicate<User> nameNotBlank = u -> u.name() != null && !u.name().isBlank();
        java.util.function.Predicate<User> adult = u -> u.age() >= 18;
        java.util.function.Predicate<User> hasEmail = u -> u.email() != null && u.email().contains("@");
        return nameNotBlank.and(adult).and(hasEmail);
    }
}`,
      hints: [
        'Dùng {{Predicate<User>.and(...)}} để ghép nhiều điều kiện.',
        'Lambda {{u -> u.name() != null && !u.name().isBlank()}} kiểm tra tên; {{u -> u.age() >= 18}} kiểm tra tuổi; {{u -> u.email().contains("@")}} kiểm tra email.',
      ],
      explain: `{{Predicate.and}} trả về predicate mới đúng khi cả hai đúng, nên chuỗi {{nameNotBlank.and(adult).and(hasEmail)}} chỉ nhận user đáp ứng tất cả ba điều kiện. Có thể bổ sung {{or}} (ít nhất một điều kiện) và {{negate}} (phủ định). isBlank là Java 11, sẵn có trên Java 17.

Lỗi hay gặp: nhầm thứ tự hàm trong {{andThen}}/{{compose}}; quên kiểm tra null trước khi gọi method (ném NPE); nhầm {{and}} với {{or}} (and yêu cầu cả hai, or yêu cầu ít nhất một).`,
    },
  ],
  check: [
    {
      q: 'Functional interface là gì?',
      options: ['Interface có nhiều phương thức trừu tượng', 'Interface có đúng một phương thức trừu tượng', 'Interface không có phương thức', 'Class abstract'],
      answer: 1,
      explain: 'Functional interface có đúng một phương thức trừu tượng, cho phép lambda tạo thể hiện. Đánh dấu {{@FunctionalInterface}} để compiler kiểm tra.',
    },
    {
      q: '{{Predicate.and(other)}} trả về predicate đúng khi nào?',
      options: ['Khi ít nhất một predicate đúng', 'Khi cả hai predicate đều đúng', 'Khi predicate đầu tiên đúng', 'Luôn đúng'],
      answer: 1,
      explain: '{{and}} là phép logic AND: kết quả đúng chỉ khi cả hai đều đúng. {{or}} là ít nhất một, {{negate}} phủ định.',
    },
    {
      q: 'Biến cục bộ bắt trong lambda phải là gì?',
      options: ['Có thể gán lại bất cứ khi nào', 'Effectively final (không gán lại sau khi gán)', 'Phải là static', 'Phải là final tuple'],
      answer: 1,
      explain: 'Lambda bắt biến cục bộ chỉ khi biến đó effectively final (gán một lần), đảm bảo tính nhất quán khi lambda thực thi sau này.',
    },
  ],
  related: [],
  tags: ['lambda', 'functional interface', 'method reference', 'Predicate'],
},
{
  id: 'lesson-modern-005',
  track: 'modern',
  order: 5,
  title: 'java.time: Instant, LocalDate, ZonedDateTime, múi giờ và cut-off ngân hàng',
  level: 'senior',
  minutes: 30,
  goals: [
    'Phân biệt Instant, LocalDate, LocalDateTime, ZonedDateTime và khi nào dùng từng cái',
    'Quy đổi múi giờ qua ZoneId và tính toán theo múi giờ thực tế',
    'Xử lý cut-off ngân hàng: bỏ qua cuối tuần, tính ngày giá trị',
  ],
  body: `**Tóm tắt:** java.time thay java.util.Date/Calendar bằng các class bất biến, mỗi class đảm nhận một vai trò: Instant (thời điểm máy), LocalDate/LocalDateTime (lịch không múi giờ), ZonedDateTime (lịch + múi giờ). Chuyển đổi giữa chúng qua ZoneId; xử lý cut-off ngân hàng cần quy đổi sang múi giờ Việt Nam rồi tính ngày làm việc.

### Instant, LocalDate, ZonedDateTime
- {{Instant}}: thời điểm trên trục thời gian UTC (số giây/nano từ epoch), **không múi giờ**. Dùng để lưu vào DB, ghi log, tính khoảng thời gian.
- {{LocalDate}}: ngày (năm-tháng-ngày) không giờ, không múi giờ. Dùng sinh nhật, ngày giá trị.
- {{LocalDateTime}}: ngày + giờ, **chưa gán múi giờ**. Không dùng để xác định thời điểm thực tế vì sự sai lệch múi giờ.
- {{ZonedDateTime}}: ngày + giờ + múi giờ, xác định duy nhất một thời điểm.
- {{ZoneId}}: múi giờ ({{Asia/Ho_Chi_Minh}} = UTC+7, VN không áp daylight saving).
- {{Duration}}: khoảng thời gian dựa trên máy (giây/nano). {{Period}}: khoảng thời gian dựa trên lịch (ngày/tháng/năm).

~~~java
Instant now = Instant.now();                                       // UTC
ZonedDateTime vn = now.atZone(ZoneId.of("Asia/Ho_Chi_Minh"));      // quy đổi sang VN
LocalDate today = vn.toLocalDate();                                // ngày ở VN
~~~

### DateTime formatter
~~~java
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
String s = vn.format(fmt);
ZonedDateTime parsed = ZonedDateTime.parse(s, fmt.withZone(ZoneId.of("Asia/Ho_Chi_Minh")));
~~~

### Cut-off ngân hàng
Giao dịch sau 16:00 giờ Việt Nam sang ngày làm việc tiếp theo; bỏ qua thứ Bảy, Chủ Nhật. Luôn quy đổi về múi giờ giao dịch trước khi so sánh giờ cut-off — đừng so sánh giờ UTC thẳng.

### Lưu ý khi parse và format
{{DateTimeFormatter}} parse/chuẩn hoá theo mẫu; nếu dữ liệu vào không khớp mẫu ném {{DateTimeParseException}}. Luôn chỉ định múi giờ khi parse {{ZonedDateTime}}, đừng để hệ thống chọn múi giờ mặc định của máy chủ (có thể khác giữa dev và production).

> Senior tip: lưu {{Instant}} trong DB, chỉ chuyển sang múi giờ người dùng khi hiển thị. Đừng dùng {{Date}}/{{Calendar}} (có thể biến đổi, khó quản lý múi giờ). Lưu timezone ID ({{Asia/Ho_Chi_Minh}}), không lưu offset cố định (+07) vì quốc gia có thể thay đổi quy định.

### Liên hệ phỏng vấn
Interviewer hỏi: Instant/LocalDateTime/ZonedDateTime dùng khi nào, sao không dùng Date/Calendar, quy đổi múi giờ ra sao, cut-off ngân hàng tính ngày giá trị thế nào, Duration vs Period khác nhau ở điểm nào. Bài tập dưới đây bắt bạn tính ngày giá trị bỏ qua cuối tuần và giờ cắt 16:00 giờ Việt Nam.`,
  exercises: [
    {
      title: 'Tính ngày giá trị (value date) bỏ qua cuối tuần và cut-off',
      prompt: `Viết {{ValueDateCalculator.valueDate(Instant transactionTime)}} trả về {{LocalDate}} ngày giá trị theo quy tắc:
- Quy đổi giao dịch sang múi giờ {{Asia/Ho_Chi_Minh}} (UTC+7).
- Nếu giao dịch sau 16:00 → sang ngày tiếp theo.
- Bỏ qua thứ Bảy và Chủ Nhật (lùi đến thứ hai kế tiếp).
Giao dịch đúng 16:00 vẫn tính cùng ngày.`,
      starter: `class ValueDateCalculator {
    static java.time.LocalDate valueDate(java.time.Instant transactionTime) {
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
    static java.time.Instant vn(int y, int m, int d, int h, int mi) {
        return java.time.LocalDateTime.of(y, m, d, h, mi).atZone(java.time.ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
    }
    public static void main(String[] args) {
        // 2024-01-01 là thứ Hai; 04=Thứ Tư, 05=Thứ Sáu, 06=Thứ Bảy, 07=Chủ Nhật, 08=Thứ Hai, 09=Thứ Ba
        check("thứ tư 10:00 → hôm nay", () -> eq(java.time.LocalDate.of(2024, 1, 4), ValueDateCalculator.valueDate(vn(2024, 1, 4, 10, 0))));
        check("thứ sáu 17:00 sau cut-off → thứ hai", () -> eq(java.time.LocalDate.of(2024, 1, 8), ValueDateCalculator.valueDate(vn(2024, 1, 5, 17, 0))));
        check("thứ bảy → thứ hai", () -> eq(java.time.LocalDate.of(2024, 1, 8), ValueDateCalculator.valueDate(vn(2024, 1, 6, 10, 0))));
        check("chủ nhật → thứ hai", () -> eq(java.time.LocalDate.of(2024, 1, 8), ValueDateCalculator.valueDate(vn(2024, 1, 7, 20, 0))));
        check("thứ sáu 15:00 trước cut-off → thứ sáu", () -> eq(java.time.LocalDate.of(2024, 1, 5), ValueDateCalculator.valueDate(vn(2024, 1, 5, 15, 0))));
        check("thứ sáu 16:00 đúng cut-off → thứ sáu", () -> eq(java.time.LocalDate.of(2024, 1, 5), ValueDateCalculator.valueDate(vn(2024, 1, 5, 16, 0))));
        check("thứ hai 17:00 sau cut-off → thứ ba", () -> eq(java.time.LocalDate.of(2024, 1, 9), ValueDateCalculator.valueDate(vn(2024, 1, 8, 17, 0))));
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `class ValueDateCalculator {
    static java.time.LocalDate valueDate(java.time.Instant transactionTime) {
        java.time.ZoneId vn = java.time.ZoneId.of("Asia/Ho_Chi_Minh");
        java.time.ZonedDateTime zdt = transactionTime.atZone(vn);
        java.time.LocalDate d = zdt.toLocalDate();
        java.time.LocalTime cutOff = java.time.LocalTime.of(16, 0);
        // giao dịch sau 16:00 giờ Việt Nam sang ngày làm việc tiếp theo
        if (zdt.toLocalTime().isAfter(cutOff)) {
            d = d.plusDays(1);
        }
        // bỏ qua cuối tuần
        while (d.getDayOfWeek() == java.time.DayOfWeek.SATURDAY || d.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
            d = d.plusDays(1);
        }
        return d;
    }
}`,
      hints: [
        'Quy đổi Instant sang múi giờ VN bằng {{atZone(ZoneId.of("Asia/Ho_Chi_Minh"))}}.',
        'Nếu giờ sau 16:00 thì {{d = d.plusDays(1)}}; sau đó lặp {{plusDays(1)}} mà vẫn là thứ Bảy/Chủ Nhật.',
        'Giờ đúng 16:00 không được coi là sau cut-off (dùng {{isAfter}} chứ không phải {{isBefore}} ngược).',
      ],
      explain: `{{Instant}} quy đổi sang {{ZonedDateTime}} ở múi giờ VN trước khi lấy ngày và so sánh giờ cut-off. Nếu thời điểm giao dịch sau 16:00 thì ngày giá trị là ngày hôm sau; tiếp tục bỏ qua cuối tuần bằng vòng lặp while. Mọi class trong java.time là bất biến, an toàn khi chia sẻ. Lưu ý: cutoff 16:00 nghĩa là giao dịch đúng 16:00 vẫn xử lý hôm nay, sau 16:00 mới sang ngày tiếp theo.

Lỗi hay gặp: so sánh giờ UTC thay vì giờ VN (gây sai ngày vì VN UTC+7); quên bỏ qua cuối tuần sau khi đẩy ngày do cut-off; dùng {{Date}}/{{Calendar}} có thể biến đổi và khó quản lý múi giờ.`,
    },
  ],
  check: [
    {
      q: 'Lưu {{Instant}} trong DB thì lưu gì?',
      options: ['Thời gian đã quy đổi về múi giờ người dùng', 'Thời điểm UTC (số giây từ epoch)', 'Chuỗi ngày tháng theo múi giờ máy chủ', 'Chỉ lưu ngày, không lưu giờ'],
      answer: 1,
      explain: '{{Instant}} là thời điểm trên trục UTC, không múi giờ, nên lưu vào DB. Quy đổi múi giờ chỉ khi hiển thị cho người dùng.',
    },
    {
      q: 'ZonedDateTime khác LocalDateTime ở điểm nào?',
      options: ['Không khác', 'ZonedDateTime có múi giờ, xác định duy nhất một thời điểm; LocalDateTime chưa gán múi giờ', 'LocalDateTime chính xác hơn', 'ZonedDateTime không tính được khoảng thời gian'],
      answer: 1,
      explain: '{{LocalDateTime}} chỉ là ngày+giờ "trên tường đồng hồ", chưa gán múi giờ nên có thể mập mờ (ví dụ giờ giảm mùa đông). {{ZonedDateTime}} thêm múi giờ, xác định duy nhất một thời điểm.',
    },
  ],
  related: [],
  tags: ['java.time', 'Instant', 'ZonedDateTime', 'timezone'],
}
);
