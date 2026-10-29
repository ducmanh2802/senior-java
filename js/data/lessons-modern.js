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

- Stream xử lý **theo chiều dọc**: từng phần tử đi hết các bước rồi phần tử kế tiếp mới vào, chứ không phải filter xong cả danh sách rồi mới map. Với {{names = [Ann, Bob, Carol]}}, đoạn code trên in "loc Ann", "loc Bob", "loc Carol" xen kẽ với việc map từng phần tử; không có list trung gian nào được tạo ra.
- Riêng thao tác stateful như {{sorted}} là "rào chắn": nó phải nhận hết phần tử rồi mới đẩy phần tử đầu tiên xuống bước sau.
- Nhờ xử lý theo chiều dọc mà {{findFirst}}, {{anyMatch}}, {{limit}} có thể **dừng sớm** (short-circuit): {{names.stream().filter(...).findFirst()}} dừng ngay khi gặp phần tử đầu tiên khớp, phần còn lại không bị duyệt. {{forEach}}, {{collect}}, {{count}} thì duyệt hết.
- Stream **single-use**: gọi terminal hai lần ném {{IllegalStateException}}.
- Không có terminal op ⇒ không chạy gì; đây là lỗi hay gặp khi quên {{collect}}.

### Stateless vs stateful
- **Stateless**: {{filter}}, {{map}}, {{flatMap}}, {{peek}} xử lý từng phần tử độc lập, không cần nhớ phần tử khác. Hiệu quả, dễ parallel.
- **Stateful**: kết quả của một phần tử phụ thuộc vào các phần tử khác, nên phải giữ trạng thái.
  - {{sorted}} phải buffer **toàn bộ** dữ liệu trước khi trả phần tử đầu tiên, nên {{sorted}} trên stream vô hạn ({{Stream.iterate}}, {{Stream.generate}}) không bao giờ kết thúc.
  - {{distinct}} phải nhớ mọi giá trị đã thấy (một {{HashSet}} bên trong), tốn bộ nhớ theo số giá trị khác nhau.
  - {{limit}}, {{skip}}, {{takeWhile}}, {{dropWhile}} chỉ cần nhớ một bộ đếm hoặc một cờ, rẻ khi chạy tuần tự.
- Stateful op làm parallel kém hiệu quả: các luồng phải phối hợp để giữ đúng thứ tự gặp (encounter order). Ví dụ {{limit(10)}} trên parallel stream có thứ tự phải biết đâu là 10 phần tử **đầu tiên**, nên phải buffer và đồng bộ giữa các luồng; nếu không cần thứ tự, gọi {{unordered()}} sẽ rẻ hơn.

### Collectors: nhóm và tổng hợp
| Collector | Dùng khi nào | Kết quả |
|---|---|---|
| {{groupingBy(f)}} | nhóm phần tử theo key | Map<K, List<T>> |
| {{groupingBy(f, groupingBy(g))}} | nhóm hai cấp (khách hàng rồi tháng) | Map<K, Map<K2, List<T>>> |
| {{groupingBy(f, summingDouble(m))}} | nhóm rồi tổng | Map<K, Double> |
| {{toMap(k, v)}} | biến stream thành map | Map<K, V> |
| {{partitioningBy(pred)}} | chia thành đúng/sai | Map<Boolean, List<T>> |

{{toMap}} ném {{IllegalStateException}} nếu key trùng; dùng {{toMap(k, v, (old, newV) -> newV)}} để quy định ghi đè. {{groupingBy}} mặc định trả về {{HashMap}} (không có thứ tự); muốn key được sắp xếp thì truyền map factory: {{groupingBy(f, TreeMap::new, downstream)}}.

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
Parallel stream chia nguồn thành nhiều phần (qua {{Spliterator}}), xử lý các phần trên {{ForkJoinPool.commonPool()}} rồi gộp kết quả. Pool này **dùng chung cho cả JVM** (kể cả {{CompletableFuture.supplyAsync}} không truyền executor). Số worker mặc định là số CPU khả dụng trừ một (luồng gọi stream cũng tham gia làm việc), có thể đổi bằng {{-Djava.util.concurrent.ForkJoinPool.common.parallelism}}. Trong container, số CPU khả dụng lấy theo giới hạn CPU của container.

Parallel có hại khi:
- tác vụ **block** (DB, HTTP, file): vài worker bị treo là cả pool chung bị nghẽn, mọi parallel stream khác trong JVM chậm theo;
- dữ liệu nhỏ: chi phí chia việc và gộp kết quả lớn hơn phần tiết kiệm được;
- nguồn **chia kém**: {{LinkedList}}, {{Stream.iterate}}, I/O stream; còn {{ArrayList}}, mảng, {{IntStream.range}} chia rất tốt;
- có side-effect không thread-safe, ví dụ {{forEach(list::add)}} vào một {{ArrayList}} thường: mất phần tử hoặc ném exception ngẫu nhiên. Dùng {{collect}} thay vì tự cộng dồn ra biến ngoài.

Không có ngưỡng kích thước phổ quát: đo bằng benchmark (JMH) trên workload thật. Trong service web, tránh dùng {{parallelStream}} cho I/O; dùng executor riêng có giới hạn (hoặc virtual thread từ Java 21) thay thế.

> Senior tip: viết stream tuần tự mặc định cho rõ ràng; chỉ bật parallel khi có benchmark chứng minh và dữ liệu đủ lớn. Tiền tệ dùng {{BigDecimal}}, không dùng double trong production.

### Liên hệ phỏng vấn
Interviewer hay hỏi: intermediate/terminal khác nhau ở điểm nào, stream có lưu dữ liệu không, sao sorted stream vô hạn không kết thúc, groupingBy hai cấp viết ra sao, parallel stream dùng chung pool gì và khi nào tránh. Bài tập dưới đây bắt bạn viết Collectors nhóm giao dịch theo khách hàng và tháng, có sắp xếp key.`,
  exercises: [
    {
      title: 'Thống kê giao dịch theo khách hàng và tháng',
      prompt: `Cho {{List<Transaction>}} (Transaction có {{customerId}}, {{month}} dạng "YYYY-MM", {{amount}}). Viết {{TransactionStats.byCustomerAndMonth(txns)}} trả về {{Map<String, Map<String, Double>>}}: khách hàng → (tháng → tổng tiền).

Yêu cầu:
- Dùng Stream + Collectors, không dùng vòng lặp for thủ công.
- Cả map ngoài (khách hàng) và map trong (tháng) phải **sắp xếp key tăng dần** khi duyệt (để báo cáo in ra theo thứ tự), tức là dùng {{TreeMap}}.
- Khách hàng/tháng không có giao dịch thì không xuất hiện trong kết quả.`,
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
        check("key khách hàng và tháng được sắp xếp tăng dần", () -> {
            List<Transaction> txns = List.of(
                new Transaction("KH300", "2024-12", 1.0),
                new Transaction("KH007", "2024-05", 2.0),
                new Transaction("KH150", "2024-01", 3.0),
                new Transaction("KH007", "2024-01", 4.0),
                new Transaction("KH007", "2023-11", 5.0),
                new Transaction("KH099", "2024-02", 6.0)
            );
            Map<String, Map<String, Double>> r = TransactionStats.byCustomerAndMonth(txns);
            eq(List.of("KH007", "KH099", "KH150", "KH300"), new ArrayList<>(r.keySet()));
            eq(List.of("2023-11", "2024-01", "2024-05"), new ArrayList<>(r.get("KH007").keySet()));
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
      reference: `record Transaction(String customerId, String month, double amount) {}

class TransactionStats {
    static Map<String, Map<String, Double>> byCustomerAndMonth(List<Transaction> txns) {
        // nhóm theo khách hàng, rồi theo tháng; TreeMap::new để key được sắp xếp
        return txns.stream()
            .collect(Collectors.groupingBy(
                Transaction::customerId,
                TreeMap::new,
                Collectors.groupingBy(
                    Transaction::month,
                    TreeMap::new,
                    Collectors.summingDouble(Transaction::amount))  // cộng amount trong mỗi nhóm
            ));
    }
}`,
      hints: [
        'Bắt đầu từ {{Collectors.groupingBy(Transaction::customerId, Collectors.groupingBy(Transaction::month, Collectors.summingDouble(Transaction::amount)))}}: nhóm hai cấp, cấp trong cộng tiền.',
        '{{groupingBy}} có bản ba tham số {{groupingBy(classifier, mapFactory, downstream)}}; truyền {{TreeMap::new}} làm mapFactory ở **cả hai** cấp để key được sắp xếp.',
        '{{Collectors}}, {{TreeMap}} đã được import sẵn ({{java.util.*}}, {{java.util.stream.*}}).',
      ],
      explain: `{{groupingBy}} nhận ba thứ: hàm lấy key (classifier), loại map muốn dùng (mapFactory, mặc định {{HashMap::new}}) và một collector hạ cấp (downstream, mặc định {{toList()}}) quyết định làm gì với các phần tử cùng key. Lồng hai lần groupingBy tạo cấu trúc khách hàng → tháng → tổng; {{summingDouble}} lấy {{amount}} của từng giao dịch rồi cộng dồn. Kết quả chỉ có những cặp khách hàng/tháng thực sự có giao dịch, không tự tạo entry rỗng.

Vì sao cần {{TreeMap::new}}: {{HashMap}} không đảm bảo thứ tự duyệt, báo cáo in ra sẽ lộn xộn và có thể đổi thứ tự giữa các phiên bản JDK. Tháng dạng "YYYY-MM" sắp xếp theo chuỗi cũng đúng theo thời gian, vì năm đứng trước và tháng có đủ 2 chữ số.

Lỗi hay gặp:
- Chỉ truyền {{TreeMap::new}} cho cấp ngoài, quên cấp trong.
- Dùng {{toMap}} khi key trùng mà không đưa hàm merge: ném {{IllegalStateException}}.
- Dùng {{forEach}} cộng vào một map bên ngoài: chạy được khi tuần tự nhưng sai khi chuyển sang parallel; {{collect}} mới là cách đúng.
- Tiền thật nên dùng {{BigDecimal}} vì double cộng dồn có sai số làm tròn (0.1 + 0.2 ra 0.30000000000000004). Khi {{amount}} là {{BigDecimal}}, downstream đổi thành {{Collectors.reducing(BigDecimal.ZERO, Transaction::amount, BigDecimal::add)}}.`,
    },
  ],
  check: [
    {
      q: 'Stream intermediate operation (ví dụ {{filter}}, {{map}}) làm gì khi được gọi?',
      options: ['Duyệt ngay toàn bộ dữ liệu', 'Chỉ xây dựng pipeline, chưa xử lý phần tử', 'Gọi terminal operation ngầm định', 'Ném exception nếu không có terminal op'],
      answer: 1,
      explain: 'Intermediate op là lazy: chỉ đăng ký bước xử lý vào pipeline, dữ liệu chưa được duyệt. Chỉ có terminal op mới kéo dữ liệu qua pipeline. "Duyệt ngay" sai vì chính sự lazy cho phép short-circuit; Java không tự gọi terminal op ngầm định; và thiếu terminal op cũng không ném exception, pipeline chỉ đơn giản là không bao giờ chạy (lỗi im lặng).',
    },
    {
      q: 'Collectors.groupingBy(f, summingDouble(m)) dùng làm gì?',
      options: ['Lọc phần tử theo f', 'Nhóm theo f rồi tổng giá trị m cho mỗi nhóm', 'Chia stream thành hai phần đúng/sai', 'Sắp xếp theo m'],
      answer: 1,
      explain: 'groupingBy chia theo key f; summingDouble(m) là collector hạ cấp, lấy giá trị m của từng phần tử rồi cộng dồn trong mỗi nhóm, kết quả là Map từ key tới tổng. Lọc là việc của filter; chia đúng/sai là partitioningBy; sắp xếp là sorted hoặc Comparator, không phải groupingBy.',
    },
    {
      q: 'Parallel stream không nên dùng khi nào?',
      options: ['Dữ liệu lớn, CPU-bound', 'Tác vụ block như gọi DB/HTTP', 'Nguồn là ArrayList', 'Toán tử stateless'],
      answer: 1,
      explain: 'Tác vụ block giữ chặt các worker của ForkJoinPool.commonPool (chỉ khoảng số CPU trừ một thread, dùng chung cả JVM), làm mọi parallel stream và CompletableFuture khác bị đói. Ba phương án còn lại đều là điều kiện **thuận lợi** cho parallel: dữ liệu lớn và CPU-bound, ArrayList chia đôi rất rẻ, toán tử stateless không cần phối hợp giữa các luồng.',
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
- {{map(f)}}: nếu có giá trị thì áp {{f}}; Optional rỗng thì bỏ qua {{f}} và vẫn rỗng. Điểm quan trọng: nếu {{f}} trả về **null**, {{map}} tự biến kết quả thành {{Optional.empty()}}. Nhờ vậy một chuỗi {{map}} thay được cả loạt {{if (x != null)}} lồng nhau.
- {{filter(p)}}: giữ giá trị nếu thoả điều kiện, không thì rỗng.
- {{orElse(default)}}: trả giá trị bên trong, hoặc {{default}} nếu rỗng.
- {{orElseGet(supplier)}}: chỉ gọi {{supplier}} khi rỗng, dùng khi giá trị mặc định đắt (đọc DB, gọi API).
- {{orElseThrow(() -> new NotFoundException(...))}}: biến vắng mặt thành lỗi nghiệp vụ rõ ràng. Bản không tham số {{orElseThrow()}} (Java 10) ném {{NoSuchElementException}}, giống {{get()}} nhưng tên gọi nói rõ ý định.
- Java 9 thêm {{ifPresentOrElse}}, {{or(supplier)}} (thử nguồn khác khi rỗng) và {{stream()}}; Java 11 thêm {{isEmpty()}}.

### flatMap: xử lý Optional lồng nhau
Nếu hàm trả về {{Optional}} và bạn muốn nối tiếp chuỗi xử lý, dùng {{flatMap}} thay vì {{map}} (map sẽ tạo {{Optional<Optional<T>>}}).

~~~java
Optional<Optional<Address>> addr = opt.map(User::address);   // Optional<Optional<Address>>
Optional<Address> addr2 = opt.flatMap(User::address);         // Optional<Address> phẳng
~~~

### Không nên
- **Field** entity/DTO: {{Optional}} không implement {{Serializable}}; field này cũng thường làm mapping/payload phức tạp hơn. Với Jackson, hỗ trợ phụ thuộc module/configuration, còn JPA entity nên dùng field giá trị thông thường.
- **Tham số method**: thường nhận giá trị có thể null hoặc overload thay vì bắt caller bọc một giá trị trong Optional; chọn theo contract và cách dùng API.
- **Collection**: trả list rỗng thay vì {{Optional<List<T>>}}; caller duyệt list rỗng không cần kiểm tra gì.
- **{{opt.get()}}**: ném {{NoSuchElementException: No value present}}, message không nói thiếu cái gì nên khó debug. Dùng {{orElseThrow}} với exception có message nghiệp vụ.
- Gọi {{opt.isPresent()}} rồi {{opt.get()}} trong if: chỉ là null-check viết dài hơn, không tận dụng được gì của Optional.
- Không bao giờ trả về {{null}} từ method có kiểu trả về {{Optional}}: caller tin rằng không cần kiểm tra null và sẽ dính NPE.

### orElse vs orElseGet
~~~java
User u1 = opt.orElse(loadFromDb());      // luôn gọi DB
User u2 = opt.orElseGet(() -> loadFromDb());  // chỉ gọi khi rỗng
~~~

Vì sao {{orElse}} luôn gọi DB? Không phải do Optional, mà do quy tắc của Java: **mọi đối số được tính xong trước khi method được gọi**. Ở dòng đầu, {{loadFromDb()}} chạy trước, kết quả mới được truyền vào {{orElse}}, rồi {{orElse}} mới xem Optional có giá trị không. Ở dòng hai, đối số là một lambda (một "công thức" chưa chạy), {{orElseGet}} chỉ gọi nó khi thật sự cần.

Hệ quả production: {{orElse(createDefaultUser())}} mà hàm đó có side-effect (insert DB, gửi email) sẽ chạy **ở mọi lần gọi**, kể cả khi đã tìm thấy user. Quy tắc nhớ: giá trị mặc định là hằng số hoặc biến sẵn có thì dùng {{orElse}}; cần tính toán hoặc có side-effect thì dùng {{orElseGet}}.

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
        'Bắt đầu bằng {{Optional.ofNullable(order)}} vì chính order cũng có thể null ({{Optional.of}} sẽ ném NPE).',
        'Các class ở đây dùng field, không có getter, nên viết lambda: {{.map(o -> o.customer).map(c -> c.address).map(a -> a.city)}}. Mỗi bước trả null thì chuỗi tự thành rỗng.',
        'Kết thúc bằng {{.orElse("Chưa biết")}} hoặc {{.orElseGet(fallback)}}; không dùng {{get()}}. {{Optional}} và {{Supplier}} đã được import sẵn.',
      ],
      explain: `{{Optional.ofNullable(order)}} rỗng nếu order null. Mỗi {{map}} chỉ chạy lambda khi đang có giá trị, và nếu lambda trả null thì kết quả thành rỗng; từ đó các {{map}} phía sau bị bỏ qua. Vì vậy chỉ cần một mắt xích null bất kỳ (order, customer, address hay city) là cả chuỗi rỗng, và {{orElse}} trả giá trị mặc định. Không cần if-null lồng nhau, không dùng {{get()}} nên không bao giờ ném NoSuchElementException. {{orElseGet}} chỉ gọi supplier khi rỗng, thích hợp cho fallback đắt.

Lỗi hay gặp: dùng {{opt.get()}} khi chắc chắn có giá trị nhưng runtime null; viết {{isPresent()}} rồi {{get()}} (trá hình null-check); dùng {{orElse}} với hàm tính mặc định đắt nhưng vẫn chạy dù đã có giá trị.`,
    },
  ],
  check: [
    {
      q: '{{Optional.of(x)}} và {{Optional.ofNullable(x)}} khác nhau ở điểm nào?',
      options: ['Không khác nhau', 'of ném NPE nếu x null; ofNullable cho phép null → empty', 'ofNullable ném NPE nếu x null', 'of chỉ dùng với primitive'],
      answer: 1,
      explain: '{{Optional.of(x)}} ném NullPointerException ngay nếu x null (dùng khi chắc chắn có giá trị, lỗi lộ sớm); {{Optional.ofNullable(x)}} chấp nhận null và trả về {{Optional.empty()}}. Hai method khác nhau thật nên "không khác" sai; ofNullable chính là bản không ném NPE; Optional chỉ chứa object, primitive dùng OptionalInt/OptionalLong/OptionalDouble.',
    },
    {
      q: 'Khi nào nên dùng {{orElseGet}} thay vì {{orElse}}?',
      options: ['Luôn, vì nhanh hơn', 'Khi giá trị mặc định đắt và chỉ muốn tính khi Optional rỗng', 'Khi Optional có giá trị', 'Không bao giờ'],
      answer: 1,
      explain: 'Đối số của {{orElse}} được Java tính trước khi gọi method, kể cả khi Optional có giá trị; {{orElseGet}} nhận một supplier và chỉ gọi nó khi rỗng, nên dùng khi mặc định đắt (đọc DB) hoặc có side-effect. "Luôn dùng" sai: với hằng số, orElseGet chỉ thêm một lambda vô ích. "Khi Optional có giá trị" sai vì lúc đó cả hai đều trả giá trị bên trong. "Không bao giờ" sai vì bỏ qua đúng trường hợp quan trọng nhất.',
    },
    {
      q: 'Tại sao tránh {{opt.get()}}?',
      options: ['Ném NoSuchElementException khi rỗng', 'Chỉ làm việc với primitive', 'Luôn trả null', 'Không có method này'],
      answer: 0,
      explain: '{{get()}} ném {{NoSuchElementException}} khi rỗng, nghĩa là caller vẫn phải tự nhớ kiểm tra, mất đúng lợi ích của Optional. Dùng {{orElse}}/{{orElseGet}} hoặc {{orElseThrow}} với exception có thông điệp nghiệp vụ. Các phương án khác sai: get() làm việc với mọi kiểu object, không bao giờ trả null, và method này có thật (chỉ là không nên dùng trần).',
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
- **Compact constructor** (constructor không có danh sách tham số như ví dụ trên) chạy **trước** khi các field được gán: compiler tự thêm các lệnh {{this.id = id; this.amount = amount;}} vào cuối nó. Vì vậy trong compact constructor bạn validate hoặc gán lại **tham số** để chuẩn hoá, ví dụ {{items = List.copyOf(items);}} (defensive copy), chứ không gán {{this.items}}.
- **Bất biến nông**: field là final nhưng nếu component là {{List}} mutable mà bạn không copy, bên ngoài vẫn sửa được nội dung list, và {{hashCode}} của record đổi theo, làm hỏng HashSet/HashMap đang chứa nó.
- Rất hợp làm DTO/value object. Record không phù hợp làm JPA **entity**: entity cần class không final (Hibernate tạo subclass proxy cho lazy loading), constructor không tham số và field có thể gán lại khi load/dirty checking. Record vẫn dùng tốt làm DTO projection trong query, và từ Hibernate 6.2 làm {{@Embeddable}}.

### Sealed interface (Java 17+)
~~~java
sealed interface Payment permits Card, Transfer, Wallet {
    long amount();
}
record Card(String last4, long amount) implements Payment {}
record Transfer(String bank, long amount) implements Payment {}
record Wallet(String provider, long amount) implements Payment {}
~~~
- {{permits}} liệt kê các kiểu con được phép; class/interface khác implement {{Payment}} sẽ bị compiler báo lỗi.
- Mỗi kiểu con phải chọn một trong ba: {{final}} (đóng hẳn), {{sealed}} (tiếp tục giới hạn) hoặc {{non-sealed}} (mở lại cho ai cũng kế thừa). Record ngầm định là final nên không cần ghi gì.
- Các kiểu con phải nằm cùng module (nếu không dùng module thì cùng package) với sealed type. Nếu tất cả nằm trong cùng một file thì có thể bỏ {{permits}}, compiler tự suy ra.
- Lợi ích thật sự: compiler biết **toàn bộ** subtype, nên có thể kiểm tra một switch đã xử lý đủ mọi trường hợp hay chưa. Đây là cách Java mô hình hoá "một giá trị là A **hoặc** B **hoặc** C" (sum type / algebraic data type).

### Pattern matching
- **instanceof pattern** (Java 16): {{if (p instanceof Card c)}} gán biến {{c}} đã ép kiểu, không cần cast thủ công.
- **switch pattern** (Java 21, JEP 441): {{case}} match theo kiểu, có thể kèm điều kiện {{when}} (guard), ví dụ {{case Card c when c.amount() > 1_000_000 -> ...}}. Switch dùng pattern **bắt buộc exhaustive** (phủ hết mọi giá trị có thể). Với hierarchy sealed, liệt kê đủ các subtype là đủ, không cần {{default}}.
- **Record pattern** (Java 21, JEP 440) còn bóc luôn component: {{case Card(String last4, long amount) -> ...}}.
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
- {{null}}: nếu không có {{case null}} thì switch ném {{NullPointerException}} khi {{p}} null (Java 21 cho phép viết {{case null ->}}).
- Thêm subtype mới (ví dụ {{Crypto}}) vào {{permits}}: mọi switch không có {{default}} trên {{Payment}} sẽ **lỗi biên dịch** cho tới khi bạn xử lý {{Crypto}}. Đó chính là lợi ích: compiler chỉ ra mọi chỗ cần sửa. Nếu bạn lỡ thêm {{default}}, lợi ích này mất, vì default nuốt luôn subtype mới.
- So với if-else bằng {{instanceof}}: chạy đúng như nhau, nhưng if-else không được compiler kiểm tra đủ hay thiếu.

> Senior tip: dùng record cho value object/DTO, entity JPA giữ class thường. Sealed + pattern matching giúp mã phân nhánh an toàn; khi thêm subtype, compiler sẽ chỉ ra switch expression cần cập nhật để vẫn exhaustive.

### Liên hệ phỏng vấn
Interviewer hỏi: record khác class thường ở điểm nào, compact constructor dùng làm gì, sealed giúp gì, exhaustiveness đảm bảo gì, instance-of pattern vs switch pattern khác nhau, sao record không làm JPA entity. Bài tập dưới đây (biên dịch Java 17) bắt bạn mô hình hoá lệnh thanh toán bằng sealed + record và tính phí bằng instanceof pattern.`,
  exercises: [
    {
      title: 'Lệnh thanh toán bằng sealed + record và tính phí',
      prompt: `Mô hình hoá lệnh thanh toán: {{sealed interface Payment}} có ba kiểu con {{Card}}, {{Transfer}}, {{Wallet}} (dùng record, mỗi record có trường {{amount}} bằng VND). Viết {{PaymentFee.fee(Payment)}} tính phí:
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
        check("card 1.000.000 -> 1.000 (vừa đúng mức min)", () -> eq(1000.0, f.fee(new Card("1234", 1_000_000))));
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
      explain: '{{sealed interface X permits A, B}} chỉ cho phép A, B kế thừa X; mỗi subtype phải khai báo final/non-sealed/sealed. Compiler biết toàn bộ subtype. "Cho phép mọi class" là ngược lại với sealed; sealed không sinh ra record; và nó không thay thế interface thường mà chỉ thêm giới hạn kế thừa cho interface đó.',
    },
    {
      q: 'instanceof pattern (Java 16) giúp gì so với instanceof thông thường?',
      options: ['Chỉ kiểm tra kiểu', 'Kiểm tra kiểu và gán biến đã ép kiểu, không cần cast thủ công', 'Chỉ dùng với record', 'Ném exception nếu sai kiểu'],
      answer: 1,
      explain: '{{if (p instanceof Card c)}} vừa kiểm tra kiểu vừa tạo biến {{c}} kiểu Card đã được cast, không cần viết {{(Card) p}}. "Chỉ kiểm tra kiểu" là instanceof cũ; pattern dùng được với mọi class chứ không riêng record; và instanceof (cả cũ lẫn mới) trả false khi sai kiểu hoặc khi p null, không ném exception.',
    },
    {
      q: 'Switch pattern (Java 21) trên hierarchy sealed đảm bảo gì?',
      options: ['Chạy nhanh hơn if-else', 'Compiler kiểm tra exhaustive (đủ mọi subtype)', 'Tự động thêm subtype mới', 'Không cần xử lý null'],
      answer: 1,
      explain: 'Khi hierarchy sealed, compiler biết tất cả subtype và báo lỗi biên dịch nếu switch thiếu nhánh (exhaustive). Nó không hứa chạy nhanh hơn if-else; không tự thêm subtype (ngược lại, thêm subtype làm switch cũ lỗi biên dịch để bạn sửa); và null vẫn ném NullPointerException nếu không có {{case null}}.',
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
Là interface có **đúng một phương thức trừu tượng** (SAM: single abstract method). Default method, static method và các method trùng với method public của {{Object}} (như {{equals}} trong {{Comparator}}) không tính. Annotation {{@FunctionalInterface}} là tuỳ chọn: lambda vẫn dùng được với interface không gắn nó, nhưng gắn vào thì compiler báo lỗi nếu ai đó lỡ thêm method trừu tượng thứ hai.

Lambda không có kiểu riêng: compiler nhìn vào **kiểu đích** (biến, tham số nhận lambda) để biết nó implement interface nào. Lúc chạy, JVM tạo object implement interface đó qua {{invokedynamic}} + {{LambdaMetafactory}}, không sinh file {{.class}} riêng như anonymous class.

~~~java
@FunctionalInterface
interface Check<T> {
    boolean test(T t);
}
Check<Integer> isEven = n -> n % 2 == 0;   // lambda
boolean ok = isEven.test(4);               // true
~~~

JDK có sẵn trong {{java.util.function}}:

| Interface | Method | Ý nghĩa |
|---|---|---|
| {{Predicate<T>}} | {{boolean test(T)}} | kiểm tra điều kiện |
| {{Function<T,R>}} | {{R apply(T)}} | biến T thành R |
| {{Consumer<T>}} | {{void accept(T)}} | nhận và xử lý, không trả gì |
| {{Supplier<T>}} | {{T get()}} | không nhận gì, trả ra giá trị |
| {{BiFunction<T,U,R>}}, {{UnaryOperator<T>}} | ... | hai tham số; T thành T |

Ngoài ra có bản cho primitive như {{IntPredicate}}, {{ToIntFunction}} để tránh boxing.

### Method reference: 4 dạng
Method reference là cách viết ngắn của một lambda chỉ gọi đúng một method có sẵn.

| Dạng | Ví dụ | Lambda tương đương |
|---|---|---|
| {{Class::staticMethod}} | {{Objects::isNull}} | {{x -> Objects.isNull(x)}} |
| {{Class::instanceMethod}} | {{String::isEmpty}} | {{s -> s.isEmpty()}} (tham số đầu là receiver) |
| {{object::instanceMethod}} | {{this::validate}}, {{list::add}} | {{x -> this.validate(x)}} |
| {{Class::new}} | {{ArrayList::new}} | {{() -> new ArrayList<>()}} |

### Compose (nối hàm)
{{Function.andThen}} / {{compose}} nối hai function; {{Predicate.and}}, {{or}}, {{negate}} ghép điều kiện.

~~~java
Function<Integer, Integer> plus1 = n -> n + 1;
Function<Integer, Integer> times2 = n -> n * 2;
Function<Integer, Integer> a = plus1.andThen(times2);  // plus1 trước: (n+1)*2, a.apply(3) = 8
Function<Integer, Integer> b = plus1.compose(times2);  // times2 trước: n*2+1, b.apply(3) = 7

Predicate<String> notBlank = s -> s != null && !s.isBlank();
Predicate<String> isVip = s -> s.startsWith("VIP");
Predicate<String> isAdmin = s -> s.equals("admin");
Predicate<String> canEnter = notBlank.and(isVip.or(isAdmin));  // không rỗng VÀ (VIP HOẶC admin)
Predicate<String> guest = canEnter.negate();
~~~

Cách nhớ: {{f.andThen(g)}} đọc "f rồi tới g"; {{f.compose(g)}} giống toán học f(g(x)), g chạy trước. {{and}}/{{or}} của Predicate short-circuit giống {{&&}}/{{||}}: nếu {{notBlank}} sai thì {{isVip}} không được gọi, nhờ vậy đặt kiểm tra null ở đầu là an toàn.

### Pitfall
- Lambda chỉ được dùng biến cục bộ **effectively final** (gán đúng một lần, không gán lại). Lý do: lambda **copy giá trị** của biến lúc được tạo, còn biến cục bộ nằm trên stack và biến mất khi method kết thúc, trong khi lambda có thể chạy sau đó, trên thread khác. Nếu cho phép gán lại, lambda và method sẽ nhìn thấy hai giá trị khác nhau, gây bug khó hiểu. Field ({{this.count}}) thì không bị giới hạn này vì lambda giữ tham chiếu tới {{this}}.
- {{object::instanceMethod}} tính {{object}} **ngay lúc tạo** method reference: {{obj::foo}} với {{obj}} null ném NPE ngay dòng đó, còn lambda {{() -> obj.foo()}} chỉ ném khi được gọi.
- Trong lambda, {{this}} là object của class bao ngoài; trong anonymous class, {{this}} là chính anonymous class đó.
- Side effect trong lambda (cộng dồn vào list hay biến bên ngoài) khó đọc và sai khi chạy parallel; ưu tiên trả kết quả qua {{map}}/{{collect}}.

### Comparator: sắp xếp và ghép điều kiện
{{Comparator}} là functional interface, dùng {{comparing}} rồi {{thenComparing}} để sắp xếp theo nhiều tiêu chuẩn.

~~~java
list.sort(Comparator.comparing(Transaction::month)       // theo tháng trước
        .thenComparing(Transaction::customerId)              // cùng tháng thì theo khách hàng
        .thenComparing(Transaction::amount, Comparator.reverseOrder()));  // rồi số tiền giảm dần
~~~
- {{Comparator.naturalOrder()}}/{{reverseOrder()}} là thứ tự tự nhiên/ngược; {{reversed()}} đảo **toàn bộ** comparator đứng trước nó, nên đặt sai vị trí sẽ đảo cả tiêu chí đầu.
- {{comparingInt}}/{{comparingLong}}/{{comparingDouble}} tránh autoboxing.
- {{Comparator.nullsFirst(...)}}/{{nullsLast(...)}} khi key có thể null, nếu không sẽ NPE lúc so sánh.

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
        'Khai báo từng điều kiện thành một biến {{Predicate<User>}} riêng, rồi ghép bằng {{p1.and(p2).and(p3)}}.',
        'Lambda {{u -> u.name() != null && !u.name().isBlank()}} kiểm tra tên; {{u -> u.age() >= 18}} kiểm tra tuổi; {{u -> u.email() != null && u.email().contains("@")}} kiểm tra email (đừng quên null).',
      ],
      explain: `{{Predicate.and}} trả về predicate mới đúng khi cả hai đúng, nên chuỗi {{nameNotBlank.and(adult).and(hasEmail)}} chỉ nhận user đáp ứng tất cả ba điều kiện. {{and}} short-circuit: user có tên null thì hai predicate sau không được gọi. Có thể bổ sung {{or}} (ít nhất một điều kiện) và {{negate}} (phủ định). {{isBlank()}} có từ Java 11: chuỗi rỗng hoặc chỉ toàn khoảng trắng đều là blank, khác {{isEmpty()}} chỉ kiểm tra độ dài 0, nên test "tên trắng" sẽ fail nếu bạn dùng isEmpty.

Ưu điểm so với một khối if dài: mỗi luật là một giá trị đặt tên được, test riêng được, và tái sử dụng/ghép lại theo ngữ cảnh (ví dụ luật cho admin = {{nameNotBlank.and(hasEmail)}}, bỏ luật tuổi).

Lỗi hay gặp: quên kiểm tra null trong từng lambda (NPE với email null); dùng {{isEmpty}} thay vì {{isBlank}}; nhầm {{and}} với {{or}}; nhầm thứ tự khi dùng {{andThen}}/{{compose}} của Function.`,
    },
  ],
  check: [
    {
      q: 'Functional interface là gì?',
      options: ['Interface có nhiều phương thức trừu tượng', 'Interface có đúng một phương thức trừu tượng', 'Interface không có phương thức', 'Class abstract'],
      answer: 1,
      explain: 'Functional interface có đúng một phương thức trừu tượng (default/static method không tính), nên compiler biết lambda đang implement method nào. Có nhiều method trừu tượng thì lambda không biết chọn cái nào; interface không có method nào thì không có gì để implement; abstract class không dùng được với lambda dù chỉ có một method trừu tượng. {{@FunctionalInterface}} là tuỳ chọn, giúp compiler kiểm tra.',
    },
    {
      q: '{{Predicate.and(other)}} trả về predicate đúng khi nào?',
      options: ['Khi ít nhất một predicate đúng', 'Khi cả hai predicate đều đúng', 'Khi predicate đầu tiên đúng', 'Luôn đúng'],
      answer: 1,
      explain: '{{and}} là phép logic AND (giống {{&&}}, có short-circuit): kết quả đúng chỉ khi cả hai đều đúng. "Ít nhất một đúng" là {{or}}; "chỉ cần predicate đầu đúng" bỏ qua predicate thứ hai, sai; "luôn đúng" không phải nghĩa của and.',
    },
    {
      q: 'Biến cục bộ bắt trong lambda phải là gì?',
      options: ['Có thể gán lại bất cứ khi nào', 'Effectively final (không gán lại sau khi gán)', 'Phải là static', 'Phải khai báo bằng từ khoá volatile'],
      answer: 1,
      explain: 'Lambda copy giá trị của biến cục bộ lúc được tạo, và có thể chạy sau khi method đã kết thúc hoặc trên thread khác. Bắt buộc effectively final (không cần ghi chữ final, chỉ cần không gán lại) để giá trị mà lambda thấy luôn giống giá trị trong method. Gán lại thì compiler báo lỗi; biến cục bộ không thể là static; volatile chỉ dùng cho field, không dùng cho biến cục bộ.',
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
- {{LocalDateTime}}: ngày + giờ, **chưa gán múi giờ**. "2024-03-01 09:00" ở Hà Nội và ở London là hai thời điểm cách nhau 7 tiếng, nên một mình {{LocalDateTime}} không đủ để biết sự kiện xảy ra lúc nào. Chỉ dùng cho giờ "trên đồng hồ treo tường" khi múi giờ đã rõ từ ngữ cảnh.
- {{ZonedDateTime}}: ngày + giờ + múi giờ ({{ZoneId}}), xác định duy nhất một thời điểm và biết luật đổi giờ của vùng đó. {{OffsetDateTime}} chỉ có offset cố định (+07:00), không biết luật đổi giờ.
- {{ZoneId}}: múi giờ theo vùng, ví dụ {{Asia/Ho_Chi_Minh}} (hiện là UTC+7, Việt Nam không đổi giờ mùa hè).
- {{Duration}}: khoảng thời gian tính bằng giây/nano ("đúng 24 giờ"). {{Period}}: khoảng thời gian theo lịch ("1 ngày", "1 tháng"). Ở vùng có đổi giờ mùa hè, {{zdt.plusDays(1)}} giữ nguyên giờ đồng hồ (có thể chỉ là 23 hoặc 25 giờ thật), còn {{zdt.plus(Duration.ofHours(24))}} cộng đúng 24 giờ nên giờ đồng hồ có thể lệch 1 tiếng.

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

Chuỗi {{s}} không chứa thông tin múi giờ, nên phải gắn múi giờ bằng {{withZone}} thì mới parse được thành {{ZonedDateTime}}; nếu không sẽ ném {{DateTimeParseException}}.

### Bẫy kinh điển khi format
- {{YYYY}} là **năm theo tuần** (week-based year), không phải năm lịch. Ngày 30/12/2024 rơi vào tuần 1 của 2025, nên mẫu {{dd/MM/YYYY}} in ra "30/12/2025". Luôn dùng {{yyyy}} (hoặc {{uuuu}}).
- {{MM}} là tháng, {{mm}} là phút; {{HH}} là giờ 0–23, {{hh}} là giờ 1–12 (cần kèm {{a}} AM/PM).
- {{DateTimeFormatter}} bất biến và thread-safe, khai báo một hằng {{static final}} dùng chung được; {{SimpleDateFormat}} cũ thì **không** thread-safe, dùng chung giữa các thread sẽ ra ngày sai ngẫu nhiên.

### Cut-off ngân hàng
Quy tắc ví dụ: giao dịch sau 16:00 **giờ Việt Nam** được ghi nhận vào ngày làm việc tiếp theo; thứ Bảy, Chủ Nhật không phải ngày làm việc. Luôn quy đổi về múi giờ của nghiệp vụ trước khi so sánh với giờ cut-off. Server thường chạy giờ UTC: 16:30 giờ VN là 09:30 UTC, nếu so sánh giờ UTC với 16:00 bạn sẽ kết luận sai là "trước cut-off". Thực tế còn phải trừ ngày lễ (Tết, 30/4…), thường lưu trong một bảng lịch nghỉ.

### Đừng gọi now() trực tiếp trong logic nghiệp vụ
{{Instant.now()}}, {{LocalDate.now()}} dùng đồng hồ hệ thống và múi giờ mặc định của máy chủ ({{ZoneId.systemDefault()}}), có thể khác giữa máy dev và production. Hai cách làm đúng:
- Nhận thời điểm làm tham số (như bài tập dưới đây nhận {{Instant}}), hoặc
- Inject một {{java.time.Clock}} và gọi {{Instant.now(clock)}}; trong test dùng {{Clock.fixed(...)}} để "đóng băng" thời gian, test chạy lúc nào cũng ra cùng kết quả.

> Senior tip: với sự kiện **đã xảy ra** (giao dịch, log, audit), lưu {{Instant}} (PostgreSQL: cột {{timestamptz}}), chỉ chuyển sang múi giờ người dùng khi hiển thị. Với sự kiện **trong tương lai** theo giờ địa phương (lịch họp 9:00 sáng tháng sau), lưu {{LocalDateTime}} + timezone ID ({{Asia/Ho_Chi_Minh}}), vì quốc gia có thể đổi luật giờ trước ngày đó. Không lưu offset cố định (+07:00) thay cho timezone ID. Đừng dùng {{Date}}/{{Calendar}} trong code mới: chúng mutable và API múi giờ rất dễ dùng sai.

### Liên hệ phỏng vấn
Interviewer hỏi: Instant/LocalDateTime/ZonedDateTime dùng khi nào, sao không dùng Date/Calendar, quy đổi múi giờ ra sao, cut-off ngân hàng tính ngày giá trị thế nào, Duration vs Period khác nhau ở điểm nào. Bài tập dưới đây bắt bạn tính ngày giá trị bỏ qua cuối tuần và giờ cắt 16:00 giờ Việt Nam.`,
  exercises: [
    {
      title: 'Tính ngày giá trị (value date) bỏ qua cuối tuần và cut-off',
      prompt: `Viết {{ValueDateCalculator.valueDate(Instant transactionTime)}} trả về {{LocalDate}} ngày giá trị theo quy tắc:
- Quy đổi giao dịch sang múi giờ {{Asia/Ho_Chi_Minh}} (UTC+7).
- Nếu giao dịch sau 16:00 → sang ngày tiếp theo.
- Nếu ngày tính được rơi vào thứ Bảy hoặc Chủ Nhật thì dời tới thứ Hai kế tiếp.
- Giao dịch đúng 16:00:00 vẫn tính cùng ngày; từ 16:00:01 trở đi mới sang ngày sau.
- Không cần xử lý ngày lễ.

Lưu ý: tham số là {{Instant}} (giờ UTC), nên phải quy đổi sang giờ Việt Nam trước khi so sánh. Ví dụ {{2024-01-04T09:30:00Z}} là 16:30 thứ Năm giờ VN, tức đã sau cut-off.`,
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
        // 2024-01-01 là thứ Hai; 03=Thứ Tư, 04=Thứ Năm, 05=Thứ Sáu, 06=Thứ Bảy, 07=Chủ Nhật, 08=Thứ Hai, 09=Thứ Ba
        check("thứ năm 10:00 → hôm nay", () -> eq(java.time.LocalDate.of(2024, 1, 4), ValueDateCalculator.valueDate(vn(2024, 1, 4, 10, 0))));
        check("09:30 UTC = 16:30 giờ VN thứ năm → thứ sáu (phải quy đổi múi giờ)", () -> eq(java.time.LocalDate.of(2024, 1, 5), ValueDateCalculator.valueDate(java.time.Instant.parse("2024-01-04T09:30:00Z"))));
        check("20:00 UTC thứ sáu = 03:00 thứ bảy giờ VN → thứ hai", () -> eq(java.time.LocalDate.of(2024, 1, 8), ValueDateCalculator.valueDate(java.time.Instant.parse("2024-01-05T20:00:00Z"))));
        check("16:00:01 đã sau cut-off", () -> eq(java.time.LocalDate.of(2024, 1, 5), ValueDateCalculator.valueDate(java.time.Instant.parse("2024-01-04T09:00:01Z"))));
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
        'Đúng 16:00 không tính là sau cut-off: dùng {{time.isAfter(LocalTime.of(16, 0))}}. {{isAfter}} trả false khi bằng nhau, đúng ý đề.',
      ],
      explain: `Thứ tự các bước là điểm mấu chốt:
1. Quy đổi {{Instant}} sang {{ZonedDateTime}} ở múi giờ VN, rồi mới lấy ngày ({{toLocalDate}}) và giờ ({{toLocalTime}}). Lấy ngày trước khi quy đổi sẽ sai với mọi giao dịch từ 17:00 UTC trở đi (đã sang ngày mới ở VN).
2. Xét cut-off: sau 16:00 thì cộng 1 ngày.
3. **Sau cùng** mới dời qua cuối tuần, bằng vòng lặp while (thứ Bảy cần dời 2 ngày, Chủ Nhật 1 ngày). Nếu dời cuối tuần trước rồi mới cộng cut-off, giao dịch thứ Sáu 17:00 sẽ ra thứ Bảy, sai.

Mọi class trong java.time đều bất biến: {{d.plusDays(1)}} trả về object mới chứ không sửa {{d}}, nên phải gán lại {{d = d.plusDays(1)}}. Quên gán lại là lỗi rất hay gặp, code vẫn biên dịch nhưng ngày không đổi.

Lỗi hay gặp khác: so sánh giờ UTC thay vì giờ VN (test 09:30 UTC sẽ fail); dùng {{!isBefore}} khiến đúng 16:00 bị tính sang ngày sau; dùng {{ZoneId.systemDefault()}} thay cho múi giờ cố định của nghiệp vụ, chạy trên server UTC sẽ sai.`,
    },
  ],
  check: [
    {
      q: 'Lưu {{Instant}} trong DB thì lưu gì?',
      options: ['Thời gian đã quy đổi về múi giờ người dùng', 'Thời điểm UTC (số giây từ epoch)', 'Chuỗi ngày tháng theo múi giờ máy chủ', 'Chỉ lưu ngày, không lưu giờ'],
      answer: 1,
      explain: '{{Instant}} là một thời điểm tuyệt đối (số giây + nano tính từ 1970-01-01T00:00Z), không phụ thuộc múi giờ, nên mọi server ở mọi nơi đọc ra cùng một thời điểm. Lưu giờ đã quy đổi theo người dùng hoặc theo máy chủ thì phải biết thêm múi giờ nào mới hiểu được, và đổi server/người dùng là sai. Chỉ lưu ngày thì mất giờ, không dùng cho giao dịch được.',
    },
    {
      q: 'ZonedDateTime khác LocalDateTime ở điểm nào?',
      options: ['Không khác', 'ZonedDateTime có múi giờ, xác định duy nhất một thời điểm; LocalDateTime chưa gán múi giờ', 'LocalDateTime chính xác hơn', 'ZonedDateTime không tính được khoảng thời gian'],
      answer: 1,
      explain: '{{LocalDateTime}} chỉ là ngày + giờ "trên đồng hồ treo tường", chưa gắn múi giờ nên chưa xác định được thời điểm thật (09:00 ở Hà Nội và 09:00 ở London cách nhau 7 tiếng). {{ZonedDateTime}} thêm múi giờ nên xác định duy nhất một thời điểm, và biết cả luật đổi giờ: ở vùng có giờ mùa hè, có giờ địa phương không tồn tại (khi vặn kim lên) hoặc xuất hiện hai lần (khi vặn kim lùi). Hai kiểu khác nhau rõ ràng nên "không khác" sai; LocalDateTime không chính xác hơn (cùng độ chính xác nano giây); ZonedDateTime tính khoảng thời gian được bằng {{Duration.between}}.',
    },
    {
      q: 'Báo cáo cuối năm in ngày 30/12/2024 ra thành "30/12/2025". Nguyên nhân nhiều khả năng nhất là gì?',
      options: [
        'Server đặt sai múi giờ',
        'Mẫu format dùng {{YYYY}} (năm theo tuần) thay vì {{yyyy}}',
        '{{LocalDate}} cộng thêm một năm khi format',
        'Dùng {{Instant}} thay vì {{LocalDate}}',
      ],
      answer: 1,
      explain: '{{YYYY}} là week-based year: ngày 30/12/2024 thuộc tuần 1 của năm 2025, nên in ra 2025. Lỗi này chỉ lộ ở vài ngày cuối tháng 12, rất dễ lọt qua test. Sai múi giờ chỉ làm lệch vài giờ (tối đa sang ngày bên cạnh), không nhảy cả một năm; LocalDate bất biến và format không bao giờ cộng thêm gì; còn Instant không format được bằng mẫu có năm nếu không gắn múi giờ (ném exception chứ không ra năm sai).',
    },
  ],
  related: [],
  tags: ['java.time', 'Instant', 'ZonedDateTime', 'timezone'],
}
);
