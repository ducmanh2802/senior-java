/* Bài học track "spring". Schema & markup: AGENTS.md mục 12. */
(window.LESSONS = window.LESSONS || []).push(
  {
    id: 'lesson-spring-001', track: 'spring', order: 1,
    title: 'IoC và DI: container quản lý object', level: 'mid', minutes: 30,
    goals: ['Phân biệt IoC với DI', 'Mô tả cách container tạo singleton theo dependency graph', 'Phát hiện circular dependency'],
    body: `**Tóm tắt:** IoC chuyển quyền tạo và nối object từ business code sang container; DI là cách container cung cấp dependency vào bean. Spring tạo bean theo metadata, giải quyết dependency, rồi quản lý vòng đời và scope của chúng.

### Từ tự tạo dependency đến IoC
Nếu {{OrderService}} tự gọi {{new JdbcOrderRepository()}}, service vừa chứa nghiệp vụ vừa quyết định cách tạo persistence. Khi đổi sang repository khác, code phụ thuộc phải sửa và test khó thay thế dependency. IoC đảo chiều quyền điều khiển: ứng dụng khai báo component và quan hệ, container chịu trách nhiệm lắp ráp.

### DI và constructor injection
DI là kỹ thuật đưa dependency từ bên ngoài. Constructor injection làm dependency bắt buộc hiện rõ, giữ object hợp lệ sau khi khởi tạo và dễ tạo unit test bằng fake. Spring Boot 3 dùng component scanning cho stereotype như {{@Component}}, {{@Service}}, {{@Repository}}; {{@Bean}} hữu ích với object cấu hình thủ công. Container chọn constructor phù hợp, resolve tham số theo type và qualifier, rồi gọi constructor. Nếu class chỉ có **một** constructor thì không cần {{@Autowired}} (từ Spring 4.3); có nhiều constructor thì phải đánh dấu constructor nào dùng để inject.

~~~java
@Service
class OrderService {
    private final OrderRepository repository;
    OrderService(OrderRepository repository) { // dependency bắt buộc
        this.repository = repository;
    }
}
~~~

### Singleton và đồ thị phụ thuộc
Mặc định bean trong một Spring ApplicationContext là singleton: một instance được tái sử dụng trong context đó. Container cần phân tích đồ thị A → B → C, tạo dependency trước bean phụ thuộc, rồi giữ instance trong registry. Singleton không đồng nghĩa thread-safe; bean có state mutable dùng chung vẫn cần đồng bộ hoặc thiết kế stateless. Scope cũng thuộc từng context, không phải singleton toàn JVM.

| Cách nối | Điểm mạnh | Rủi ro |
|---|---|---|
| Constructor | Bất biến, dependency rõ, test dễ | Chu trình constructor không thể tạo trực tiếp |
| Setter/field | Có thể nối sau khi tạo | Object tạm thời thiếu dependency; field khó test |
| Service locator | Có thể tra cứu linh hoạt | Dependency ẩn trong method |

### Circular dependency và production
Nếu A cần B trong constructor và B cần A, không tồn tại thứ tự tạo hoàn chỉnh: muốn tạo A phải có B, muốn tạo B phải có A. Spring báo {{BeanCurrentlyInCreationException}} ngay khi khởi động. Với field/setter injection, Spring **có thể** phá vòng bằng cách đưa ra một tham chiếu "sớm" tới bean chưa khởi tạo xong (early singleton reference), nhưng từ **Spring Boot 2.6** tính năng này bị **tắt mặc định** ({{spring.main.allow-circular-references=false}}): mọi vòng phụ thuộc đều làm app fail lúc khởi động. Đừng bật lại cờ đó như một cách sửa; constructor cycle là thiết kế cần sửa. Tách phần chung thành C, hoặc đảo phụ thuộc qua interface/event. Các lỗi thường gặp gồm nhiều bean cùng type không có qualifier, component scan thiếu package, hoặc singleton giữ request-specific state khiến dữ liệu người dùng rò sang request khác.

### Cơ chế từng bước
Đi từng bước một lần Spring khởi động và "lắp ráp" {{OrderService}} (dependency injection = tiêm phụ thuộc, tức container đưa đối tượng cần dùng vào cho bạn thay vì bạn tự {{new}}):

1. **Đọc metadata (siêu dữ liệu, tức mô tả cách tạo bean)**: component scan (quét gói) tìm class có {{@Service}}/{{@Component}}, ghi lại "bean definition" (bản khai báo bean). Chưa có object nào được tạo ở bước này.
2. **Chọn constructor**: nếu class chỉ có một constructor, Spring dùng nó (không cần {{@Autowired}}). Spring nhìn kiểu tham số: {{OrderRepository}}.
3. **Resolve dependency (phân giải phụ thuộc, tức tìm bean phù hợp)**: tìm bean khớp kiểu {{OrderRepository}}. Nếu có đúng 1 → dùng. Nếu có nhiều (ví dụ {{JdbcRepo}} và {{JpaRepo}}) → cần {{@Qualifier}} hoặc {{@Primary}}, không thì ném lỗi mơ hồ.
4. **Tạo theo thứ tự đồ thị**: muốn {{OrderService}} thì phải có {{OrderRepository}} trước. Container tạo {{OrderRepository}} (nếu nó lại phụ thuộc cái khác thì tiếp tục đệ quy), rồi mới gọi {{new OrderService(repo)}}.
5. **Lưu singleton**: instance được cất vào registry của {{ApplicationContext}}. Lần sau ai cần {{OrderService}} cũng nhận đúng instance đó (trong cùng context).
6. **Vì sao lại như vậy?**: tách "tạo" khỏi "dùng" giúp code nghiệp vụ chỉ lo logic, dễ thay implementation (test dùng fake, production dùng thật) mà không sửa {{OrderService}}.

~~~java
// Test đơn vị: không cần Spring, tự "tiêm" fake qua constructor
class FakeRepo implements OrderRepository { /* trả dữ liệu giả */ }
OrderService svc = new OrderService(new FakeRepo()); // DI bằng tay, vẫn là DI
~~~

### Lỗi hay gặp trên production
- **{{NoUniqueBeanDefinitionException}} (nhiều bean cùng kiểu)**: có hai {{PaymentGateway}} implementation nhưng quên {{@Qualifier}}. Triệu chứng: app fail lúc khởi động với thông báo "expected single matching bean but found 2". Cách sửa: đặt {{@Primary}} cho mặc định hoặc {{@Qualifier("momoGateway")}} ở điểm inject.
- **{{BeanCurrentlyInCreationException}} do vòng phụ thuộc**: {{A}} cần {{B}}, {{B}} cần {{A}} qua constructor. Triệu chứng: context không lên được ngay khi deploy. Cách sửa: tách logic chung ra {{C}}, hoặc dùng event/interface để đảo chiều; không bật lại {{allow-circular-references}}.
- **Singleton giữ state của request (rò dữ liệu người dùng)**: đặt {{private User currentUser}} trong {{@Service}} singleton, request A gán, request B đọc nhầm. Triệu chứng: dữ liệu "nhảy" giữa người dùng, khó tái hiện. Cách sửa: service giữ stateless (không state theo request); dữ liệu request truyền qua tham số method hoặc dùng scope {{request}}/context phù hợp.
- **Component scan thiếu package**: class nằm ngoài package gốc của {{@SpringBootApplication}}. Triệu chứng: {{NoSuchBeanDefinitionException}} dù đã gắn annotation. Cách sửa: đặt class trong cây package đúng, hoặc khai báo {{@ComponentScan}} rõ ràng.

### Liên hệ phỏng vấn
1. **IoC và DI khác nhau thế nào? Cho ví dụ.** — IoC (Inversion of Control, đảo ngược điều khiển) là nguyên tắc: không tự tạo/điều phối dependency. DI là một cách thực hiện IoC: container truyền dependency vào (thường qua constructor). Ví dụ {{OrderService}} nhận {{OrderRepository}} qua constructor thay vì {{new JdbcRepo()}}.
2. **Constructor injection tốt hơn field injection ở điểm nào?** — Dependency bắt buộc hiện rõ, field có thể {{final}} (bất biến), object luôn hợp lệ sau khi tạo, và test dễ bằng {{new Service(fake)}} không cần Spring context hay reflection.
3. **Gặp circular dependency bạn xử lý ra sao?** — Đọc stack trace tìm hai bean tạo vòng, tách phần chung ra service thứ ba hoặc đảo phụ thuộc bằng interface/event. Không coi việc bật {{allow-circular-references}} là bản sửa vì nó che lỗi thiết kế.

> Senior tip: Một service singleton nên giữ cấu hình bất biến, không giữ dữ liệu của request trong field. Nếu có nhiều implementation, dùng qualifier có ý nghĩa nghiệp vụ thay vì dựa vào thứ tự scan.`,
    exercises: [{
      title: 'Tạo MiniContainer singleton bằng constructor injection',
      prompt: `Hoàn thiện {{MiniContainer}} — một DI container tí hon mô phỏng cách Spring tạo singleton bằng constructor injection:
- {{register(type)}}: đăng ký class (giống một bean definition).
- {{get(type)}}: nếu đã tạo thì trả **đúng instance cũ** (singleton). Nếu chưa, lấy constructor duy nhất của class qua reflection ({{type.getDeclaredConstructors()[0]}} — giả định mỗi class có đúng một constructor), gọi {{get}} đệ quy cho từng kiểu tham số, rồi gọi constructor. Constructor không tham số cũng phải hoạt động.
- Ném {{IllegalStateException}} khi: type chưa đăng ký (kể cả khi đó là dependency của bean khác), hoặc có circular dependency (A cần B, B cần A).
- Sau khi một lần {{get}} thất bại vì vòng phụ thuộc, container vẫn phải dùng được cho các bean khác.`,
      starter: `
class MiniContainer {
    <T> void register(Class<T> type) { throw new UnsupportedOperationException("TODO"); }
    <T> T get(Class<T> type) { throw new UnsupportedOperationException("TODO"); }
}
class Repo {}
class Service { final Repo repo; Service(Repo repo) { this.repo = repo; } }
class LoopA { LoopA(LoopB b) {} }
class LoopB { LoopB(LoopA a) {} }`,
      tests: `public class Main {
 static int passed=0, total=0;\n static void check(String n, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch(Throwable t) { System.out.println("FAIL " + n + ": " + t); } }
 static void fails(Runnable r) { try { r.run(); throw new AssertionError("expected failure"); } catch(IllegalStateException ok) {} }
 public static void main(String[] x) {
  check("singleton and injection", () -> { MiniContainer c=new MiniContainer(); c.register(Repo.class); c.register(Service.class); Service a=c.get(Service.class); if(a!=c.get(Service.class)||a.repo!=c.get(Repo.class)) throw new AssertionError(); });
  check("unknown", () -> { MiniContainer c=new MiniContainer(); fails(() -> c.get(Repo.class)); });
  check("cycle", () -> { MiniContainer c=new MiniContainer(); c.register(LoopA.class); c.register(LoopB.class); fails(() -> c.get(LoopA.class)); });
  check("no-arg constructor", () -> { MiniContainer c=new MiniContainer(); c.register(Repo.class); Repo r=c.get(Repo.class); if(r==null||r!=c.get(Repo.class)) throw new AssertionError(); });
  check("unregistered dependency", () -> { MiniContainer c=new MiniContainer(); c.register(Service.class); fails(() -> c.get(Service.class)); });
  check("container usable after cycle failure", () -> { MiniContainer c=new MiniContainer(); c.register(LoopA.class); c.register(LoopB.class); c.register(Repo.class); c.register(Service.class); fails(() -> c.get(LoopA.class)); fails(() -> c.get(LoopB.class)); Service s=c.get(Service.class); if(s.repo!=c.get(Repo.class)) throw new AssertionError(); });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `
class MiniContainer {
    private final Set<Class<?>> definitions = new HashSet<>();
    private final Map<Class<?>, Object> singletons = new HashMap<>();
    private final Set<Class<?>> creating = new HashSet<>();
    <T> void register(Class<T> type) { definitions.add(type); }
    @SuppressWarnings("unchecked") <T> T get(Class<T> type) {
        if (singletons.containsKey(type)) return (T) singletons.get(type);
        if (!definitions.contains(type)) throw new IllegalStateException("Unregistered: " + type);
        if (!creating.add(type)) throw new IllegalStateException("Cycle: " + type);
        try {
            java.lang.reflect.Constructor<?> constructor = type.getDeclaredConstructors()[0];
            Object[] args = Arrays.stream(constructor.getParameterTypes()).map(this::get).toArray();
            constructor.setAccessible(true);
            T value = (T) constructor.newInstance(args);
            singletons.put(type, value);
            return value;
        } catch (ReflectiveOperationException e) { throw new IllegalStateException(e); }
        finally { creating.remove(type); }
    }
}
class Repo {}
class Service { final Repo repo; Service(Repo repo) { this.repo = repo; } }
class LoopA { LoopA(LoopB b) {} }
class LoopB { LoopB(LoopA a) {} }`,
      hints: ['Dùng ba cấu trúc: {{Set}} các type đã đăng ký, {{Map}} type → instance đã tạo (cache singleton), và {{Set}} các type **đang được tạo**.', 'Thêm type vào tập "đang tạo" trước khi resolve tham số constructor; nếu {{add}} trả false nghĩa là type đang được tạo dở ở tầng trên — đó là vòng phụ thuộc.', 'Luôn gỡ type khỏi tập "đang tạo" trong {{finally}}, nếu không một lần lỗi sẽ làm container báo vòng phụ thuộc giả cho mọi lần gọi sau.'],
      explain: `Container tối giản giữ ba thứ: danh sách definition, cache singleton, và tập {{creating}}. Khi {{get(Service)}} chạy, nó đánh dấu Service đang tạo, thấy constructor cần Repo nên gọi {{get(Repo)}} đệ quy, tạo Repo, rồi mới gọi constructor của Service — đây chính là duyệt đồ thị phụ thuộc theo chiều sâu (DFS), dependency được tạo trước bean dùng nó.

Tập {{creating}} là "đường đi hiện tại" của DFS: {{get(LoopA)}} đánh dấu LoopA → cần LoopB → đánh dấu LoopB → cần LoopA → LoopA đã có trong tập → phát hiện vòng. Spring làm đúng điều này và báo {{BeanCurrentlyInCreationException}}.

Lỗi hay gặp:
- Quên {{finally}}: sau lần lỗi đầu, LoopA/LoopB còn kẹt trong {{creating}}; test "container usable after cycle failure" bắt lỗi này.
- Đưa instance vào cache **trước** khi constructor chạy xong (hoặc khi constructor ném lỗi): lần {{get}} sau trả về object hỏng.
- Kiểm tra đăng ký sau khi kiểm tra vòng: báo sai loại lỗi, khó debug.

Spring thật còn làm nhiều hơn: chọn constructor khi có nhiều cái, resolve theo {{@Qualifier}}/{{@Primary}} khi nhiều bean cùng type, chạy BeanPostProcessor (nơi tạo AOP proxy) và lifecycle callback.`
    }],
    check: [{ q: 'Vì sao constructor injection thường được ưu tiên?', options: ['Làm dependency bắt buộc rõ và cho phép object bất biến', 'Tự làm bean thread-safe', 'Bỏ qua việc tạo bean', 'Chỉ dùng được với prototype'], answer: 0, explain: `Constructor cho thấy dependency bắt buộc (field final), object chỉ tạo được khi đủ collaborator và test dễ bằng {{new Service(fakeRepo)}}. Nó không tự làm bean thread-safe — state mutable vẫn cần đồng bộ. Container vẫn phải tạo bean, không "bỏ qua" được. Constructor injection dùng được với mọi scope, không riêng prototype.` }, { q: 'App Spring Boot 3 có OrderService inject PaymentService qua field {{@Autowired}}, và PaymentService cũng inject OrderService qua field. Khi khởi động chuyện gì xảy ra?', options: ['Chạy bình thường vì field injection luôn phá được vòng', 'Khởi động thất bại vì từ Spring Boot 2.6 circular reference bị cấm mặc định', 'Spring tự tạo hai instance của mỗi bean', 'Chỉ lỗi khi gọi method lần đầu'], answer: 1, explain: `Từ Spring Boot 2.6, {{spring.main.allow-circular-references}} mặc định là false nên mọi vòng phụ thuộc (kể cả qua field/setter) làm context fail lúc khởi động. Phương án 1 đúng với Spring Boot cũ hoặc khi bật lại cờ, không đúng mặc định hiện nay. Spring không tạo thêm instance để phá vòng. Lỗi xảy ra lúc tạo context, không đợi tới lúc gọi method.` }, { q: 'Có hai class triển khai interface {{PaymentGateway}} đều là {{@Component}}. {{OrderService}} inject {{PaymentGateway}} qua constructor nhưng không dùng {{@Qualifier}} hay {{@Primary}}. Kết quả là gì?', options: ['Spring chọn implementation có tên class theo thứ tự bảng chữ cái', 'Spring chọn ngẫu nhiên một implementation', 'Spring ném {{NoUniqueBeanDefinitionException}} khi khởi động vì có nhiều bean cùng kiểu', 'Spring inject cả hai vào một danh sách tự động'], answer: 2, explain: `Khi resolve dependency theo kiểu và tìm thấy nhiều bean khớp, Spring không đoán: nó ném {{NoUniqueBeanDefinitionException}} (một dạng {{NoSuchBeanDefinitionException}}) lúc tạo context. Không có quy tắc chọn theo tên hay ngẫu nhiên. Muốn inject danh sách phải khai báo tham số là {{List<PaymentGateway>}}; với một tham số đơn bạn phải chỉ rõ bằng {{@Primary}} hoặc {{@Qualifier}}.` }, { q: 'Một {{@Service}} singleton có field {{private String currentUserId}} được gán trong mỗi request. Vì sao đây là lỗi?', options: ['Vì field private không được Spring inject', 'Vì String là immutable nên không gán được nhiều lần', 'Vì singleton chỉ tạo một lần nên field không tồn tại ở request thứ hai', 'Vì singleton dùng chung giữa nhiều thread/request nên các request có thể ghi đè và đọc nhầm dữ liệu của nhau'], answer: 3, explain: `Bean singleton mặc định được tái sử dụng cho mọi request trong cùng {{ApplicationContext}}; nhiều thread có thể chạy đồng thời và cùng chạm vào field đó, gây rò dữ liệu giữa người dùng (request B đọc giá trị request A ghi). Field private hoàn toàn hợp lệ trong Java. String immutable không ngăn việc gán lại tham chiếu {{currentUserId}}. Singleton vẫn tồn tại suốt vòng đời context, không "biến mất" sau request đầu.` }],
    related: ['spring-001'], tags: ['IoC', 'DI', 'container', 'singleton']
  },
  {
    id: 'lesson-spring-002', track: 'spring', order: 2,
    title: 'AOP và proxy: lời gọi nội bộ bỏ qua advice', level: 'senior', minutes: 30,
    goals: ['Mô tả proxy-based AOP', 'Giải thích self-invocation', 'Tạo logging proxy với JDK Proxy'],
    body: `**Tóm tắt:** Spring AOP thường bọc bean bằng proxy để chạy advice trước hoặc sau lời gọi method. Advice chỉ chạy khi lời gọi đi qua proxy; lời gọi {{this.otherMethod()}} bên trong target không quay lại proxy.

### Vì sao cần proxy
Logging, transaction và security là hành vi xuyên suốt nhiều service. Nếu mỗi method tự lặp logging hoặc transaction code, nghiệp vụ bị trộn với hạ tầng và khó áp dụng nhất quán. AOP mô tả điểm cắt và advice; proxy đứng giữa caller với target để thực hiện hành vi bổ sung.

### JDK dynamic proxy
{{java.lang.reflect.Proxy}} tạo object runtime triển khai các interface đã chỉ định. InvocationHandler nhận method và arguments, có thể ghi log, gọi method trên target rồi trả kết quả. Proxy JDK yêu cầu interface. Spring còn có **CGLIB proxy**: sinh một lớp con của class target lúc runtime và override các method để chèn advice. **Spring Boot mặc định dùng CGLIB** cho mọi bean cần proxy (kể cả bean có interface), vì {{spring.aop.proxy-target-class=true}} là mặc định từ Boot 2.0 — nhờ vậy inject theo class cụ thể không bị lỗi kiểu. Dù loại nào, proxy không biến method call tùy ý thành AOP: caller phải giữ và gọi qua reference proxy (chính là bean được inject).

~~~java
Object proxy = Proxy.newProxyInstance(loader, interfaces, (p, method, args) -> {
    long start = System.nanoTime();
    try { return method.invoke(target, args); }
    finally { logger.accept(method.getName(), System.nanoTime() - start); }
});
~~~

### Self-invocation và @Transactional
Giả sử caller gọi {{proxy.outer()}}, proxy chuyển tới target.outer(). Bên trong target, {{this.inner()}} là lời gọi trực tiếp trên cùng target, không qua proxy; do đó advice của inner, bao gồm transaction annotation, không được kích hoạt theo proxy model. Cách sửa theo thứ tự ưu tiên: (1) tách inner sang bean khác để lời gọi đi qua proxy của bean đó; (2) đặt transaction boundary ở method ngoài cho đúng nghiệp vụ; (3) dùng {{TransactionTemplate}} để mở transaction bằng code ngay trong method. Các mẹo như tự inject chính mình ({{@Lazy}} self-injection) hoặc {{AopContext.currentProxy()}} (cần bật {{exposeProxy}}) chạy được nhưng làm luồng khó hiểu, nên tránh.

| Proxy | Cách tạo | Lưu ý |
|---|---|---|
| JDK | Interface + InvocationHandler | Caller phải gọi qua interface proxy |
| Subclass | Tạo lớp con target | Final class/method hạn chế override |

### Cơ chế từng bước
Đi từng bước khi một request gọi service có {{@Transactional}} và bị self-invocation. **Proxy** (đối tượng "đại diện" đứng trước target, chặn lời gọi để chèn hành vi thêm) chỉ hoạt động khi caller giữ tham chiếu tới proxy (chính là bean Spring inject), không phải object thật.

1. **Spring tạo bean và bọc proxy**: khi khởi động, container tạo {{OrderService}} (target), rồi tạo một proxy bọc quanh nó. Bean được đăng ký trong context là **proxy**. Ai {{@Autowired OrderService}} sẽ nhận proxy.
2. **Caller gọi qua proxy**: {{controller}} gọi {{orderService.placeOrder()}} → lời gọi đi vào proxy → proxy chạy advice (ví dụ mở transaction) → proxy gọi {{target.placeOrder()}}.
3. **Self-invocation bên trong target**: trong {{placeOrder()}}, code gọi {{this.audit()}}. {{this}} ở đây là **target thật**, không phải proxy → lời gọi đi thẳng {{target.audit()}}, **không** quay lại proxy → advice trên {{audit()}} ({{@Transactional}}, {{@Async}}, logging AOP) bị bỏ qua.
4. **Vì sao Spring chọn proxy-based AOP?**: không cần sửa bytecode lúc biên dịch hay dùng agent đặc biệt; proxy tạo lúc runtime, dễ hiểu với phần lớn case. Đánh đổi: chỉ chặn lời gọi "từ ngoài vào" qua proxy.

~~~java
@Service
class OrderService {
    public void placeOrder() {
        // this = target thật -> self-invocation, KHÔNG qua proxy
        audit(); // @Transactional trên audit() sẽ KHÔNG mở transaction mới ở đây
    }
    @Transactional
    public void audit() { /* ghi log giao dịch */ }
}
// Cách sửa: tách audit sang bean khác để lời gọi đi qua proxy của bean đó
@Service class AuditService { @Transactional public void audit() { /* ... */ } }
~~~

| Cách xử lý self-invocation | Ưu điểm | Nhược điểm |
|---|---|---|
| Tách method sang bean khác (gọi qua proxy) | Rõ ràng, đúng mô hình Spring | Thêm class, phải cân nhắc ranh giới |
| Đặt boundary ở method ngoài | Đơn giản nếu nghiệp vụ cho phép | Có thể mở transaction rộng hơn cần |
| {{TransactionTemplate}} trong method | Kiểm soát transaction bằng code tại chỗ | Trộn hạ tầng vào nghiệp vụ |
| Tự inject {{AopContext.currentProxy()}} | Giữ nguyên cấu trúc | Khó hiểu, phải bật {{exposeProxy}}, dễ lỗi |

- **{{new Service()}} bỏ qua Spring**: object tạo bằng {{new}} không phải bean, không được inject dependency và không được bọc proxy — mọi annotation ({{@Transactional}}, {{@Async}}) trên nó đều vô hiệu. Triệu chứng: code "chạy" nhưng không có transaction, không log AOP. Cách sửa: luôn lấy bean qua injection/context, không tự {{new}} class có annotation hạ tầng.
- **Proxy không chặn private/final**: method {{private}} không bị proxy override được; với CGLIB (mặc định Spring Boot), method {{final}} cũng vậy. Triệu chứng: {{@Transactional}} gắn trên method private/final nhưng không mở transaction. Cách sửa: dùng method {{public}} (hoặc ít nhất non-private/non-final phù hợp) và đặt annotation ở nơi proxy chặn được.
- **{{@Async}} bị self-invocation nuốt**: gọi {{this.sendEmail()}} có {{@Async}} từ trong cùng bean thì chạy đồng bộ trên thread hiện tại, không ném lỗi. Triệu chứng: request chậm bất thường vì tác vụ "nền" thực ra chạy tuần tự. Cách sửa: tách sang bean khác, hoặc inject chính bean (self-injection) cẩn thận; kiểm tra bằng log thread name.
- **Gọi method trước khi proxy sẵn sàng**: gọi method có AOP từ constructor hoặc từ code chạy quá sớm trong lifecycle có thể chạy trên target chưa được bọc đầy đủ. Triệu chứng: advice thỉnh thoảng không chạy. Cách sửa: tránh logic nặng/AOP trong constructor; dùng {{@PostConstruct}} hoặc {{ApplicationReadyEvent}} khi thực sự cần, và hiểu giới hạn.

### Liên hệ phỏng vấn
1. **Vì sao {{@Transactional}} (hoặc advice AOP) không chạy khi gọi method từ trong cùng bean?** — Đây là self-invocation: {{this.method()}} gọi thẳng vào target, không đi qua proxy; mà proxy mới là nơi chèn advice. Cách sửa: tách method sang bean khác để lời gọi đi qua proxy.
2. **JDK dynamic proxy và CGLIB proxy khác nhau thế nào? Spring Boot mặc định dùng cái nào?** — JDK proxy tạo proxy theo interface (caller phải gọi qua interface). CGLIB sinh lớp con của class target (override method). Spring Boot mặc định dùng CGLIB cho bean cần proxy ({{proxy-target-class=true}}), nên inject theo class cụ thể vẫn được.
3. **Làm sao debug khi nghi ngờ transaction/AOP không chạy?** — Kiểm tra call path có đi qua proxy không (có self-invocation/{{new}} không), method có phải {{private}}/{{final}} không, và log tên class thực tế (proxy thường có tên kiểu {{…$$SpringCGLIB…}}).

> Senior tip: Khi transaction bất ngờ không mở, kiểm tra bean reference và call path trước khi chỉnh propagation. Trace một request qua proxy thường tìm ra nguyên nhân nhanh hơn đọc annotation rời rạc.`,
    exercises: [{
      title: 'Logging proxy và lời gọi nội bộ',
      prompt: `Hoàn thiện {{ProxyFactory.wrap(target, calls)}}: dùng {{java.lang.reflect.Proxy}} tạo proxy cài interface {{Worker}}. InvocationHandler ghi tên method vào {{calls}} **trước** khi gọi method tương ứng trên target, rồi trả kết quả của target.
- Gọi {{proxy.outer()}} chỉ ghi {{["outer"]}}, vì bên trong target, outer gọi {{this.inner()}} trực tiếp — không qua proxy.
- Gọi {{proxy.inner()}} từ bên ngoài thì ghi {{["inner"]}}.
- Nếu target ném exception (ví dụ {{boom()}} ném {{IllegalArgumentException}}), caller của proxy phải nhận **đúng exception đó**, không phải exception bọc của reflection.`,
      starter: `interface Worker { String outer(); String inner(); String boom(); }
class WorkerImpl implements Worker {
 public String outer() { return "outer:" + inner(); }
 public String inner() { return "inner"; }
 public String boom() { throw new IllegalArgumentException("bad input"); }
}
class ProxyFactory {
 static Worker wrap(Worker target, List<String> calls) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed=0, total=0;\n static void check(String n, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch(Throwable t) { System.out.println("FAIL " + n + ": " + t); } }
 public static void main(String[] a) {
  check("self call bypasses proxy", () -> { List<String> l=new ArrayList<>(); Worker w=ProxyFactory.wrap(new WorkerImpl(),l); if(!w.outer().equals("outer:inner")||!l.equals(List.of("outer"))) throw new AssertionError(l); });
  check("external call passes proxy", () -> { List<String> l=new ArrayList<>(); Worker w=ProxyFactory.wrap(new WorkerImpl(),l); w.inner(); if(!l.equals(List.of("inner"))) throw new AssertionError(l); });
  check("proxy implements interface", () -> { Worker w=ProxyFactory.wrap(new WorkerImpl(),new ArrayList<>()); if(!java.lang.reflect.Proxy.isProxyClass(w.getClass())) throw new AssertionError(); });
  check("calls recorded in order", () -> { List<String> l=new ArrayList<>(); Worker w=ProxyFactory.wrap(new WorkerImpl(),l); w.outer(); w.inner(); w.outer(); if(!l.equals(List.of("outer","inner","outer"))) throw new AssertionError(l); });
  check("target exception is unwrapped", () -> { List<String> l=new ArrayList<>(); Worker w=ProxyFactory.wrap(new WorkerImpl(),l); try { w.boom(); throw new AssertionError("expected exception"); } catch (IllegalArgumentException e) { if(!"bad input".equals(e.getMessage())) throw new AssertionError(e); } if(!l.equals(List.of("boom"))) throw new AssertionError(l); });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `interface Worker { String outer(); String inner(); String boom(); }
class WorkerImpl implements Worker {
 public String outer() { return "outer:" + inner(); }
 public String inner() { return "inner"; }
 public String boom() { throw new IllegalArgumentException("bad input"); }
}
class ProxyFactory {
 static Worker wrap(Worker target, List<String> calls) {
  return (Worker) java.lang.reflect.Proxy.newProxyInstance(Worker.class.getClassLoader(), new Class<?>[]{Worker.class}, (proxy, method, args) -> {
   calls.add(method.getName());
   try { return method.invoke(target, args); }
   catch (java.lang.reflect.InvocationTargetException e) { throw e.getCause(); }
  });
 }
}`,
      hints: ['Proxy.newProxyInstance nhận ba tham số: class loader, mảng các interface cần cài và một InvocationHandler.', 'Handler chỉ thấy những lời gọi đi **qua proxy**. Trong {{target.outer()}}, lời gọi {{inner()}} là {{this.inner()}} trên chính target nên handler không thấy.', '{{method.invoke(target, args)}} bọc exception của target trong {{InvocationTargetException}}; bắt nó và ném lại {{e.getCause()}}.'],
      explain: `Test đầu xác nhận proxy nhận outer, sau đó target tự gọi inner nên handler chỉ chạy một lần. Khi gọi inner trực tiếp qua proxy, handler ghi lần thứ hai. Đây là mô hình cốt lõi giải thích vì sao self-invocation không kích hoạt {{@Transactional}} trong Spring AOP dựa trên proxy: annotation trên inner chỉ có tác dụng khi lời gọi tới inner đi qua proxy.

Vì sao phải unwrap {{InvocationTargetException}}? {{Method.invoke}} bọc mọi exception của target trong {{InvocationTargetException}} (một checked exception). Nếu handler ném nguyên nó ra, mà interface {{Worker}} không khai báo checked exception đó, JVM sẽ bọc thêm một lớp nữa thành {{UndeclaredThrowableException}} — caller không bắt được {{IllegalArgumentException}} như khi gọi target trực tiếp. Spring làm đúng việc unwrap này, nên với bạn proxy "trong suốt".

Lỗi hay gặp:
- Gọi {{method.invoke(proxy, args)}} thay vì {{target}}: proxy gọi lại chính nó, đệ quy vô hạn tới {{StackOverflowError}}.
- Ghi log sau khi invoke mà không dùng {{finally}}: lời gọi ném exception sẽ không được ghi.`
    }],
    check: [{ q: 'Trong proxy-based Spring AOP, vì sao this.inner() thường không kích hoạt advice của inner?', options: ['Method private nên JVM không chạy', 'Lời gọi đi thẳng từ target tới target, không qua proxy', 'Transaction manager chỉ theo dõi HTTP', 'AOP chỉ hoạt động khi compile bằng Java 21'], answer: 1, explain: `Advice được proxy áp dụng khi lời gọi đi qua proxy; this.inner() chạy trực tiếp trên target nên proxy không biết. "Method private": inner trong ví dụ là public và vẫn bị bỏ qua, nên visibility không phải nguyên nhân. Transaction không gắn với HTTP. AOP của Spring chạy trên mọi phiên bản Java được hỗ trợ, không cần Java 21.` }, { q: 'Một bean Spring Boot 3 có method {{@Transactional private void saveAll()}}, được gọi từ một method public của chính bean đó. Transaction có được mở không?', options: ['Có, vì Spring quét mọi method có annotation', 'Không: private không bị proxy chặn được, và lời gọi nội bộ không đi qua proxy', 'Có, nếu bật CGLIB proxy', 'Chỉ khi method trả về void'], answer: 1, explain: `Có hai lý do cộng dồn: proxy (JDK hay CGLIB) không override được method private, và lời gọi từ trong bean là this.saveAll() không qua proxy. Spring không "quét rồi tự chạy" annotation, nó chỉ chèn advice tại proxy. CGLIB là mặc định của Spring Boot rồi và vẫn không chặn được private. Kiểu trả về không liên quan.` }, { q: 'Trong service, bạn viết {{OrderService svc = new OrderService(); svc.placeOrder();}} trong đó {{placeOrder()}} có {{@Transactional}}. Điều gì xảy ra với transaction?', options: ['{{@Transactional}} không có tác dụng vì object tạo bằng {{new}} không phải bean do Spring quản lý nên không được bọc proxy', 'Transaction vẫn mở bình thường vì annotation được JVM xử lý', 'Spring tự phát hiện và thay object {{new}} bằng proxy', 'Chỉ lỗi biên dịch, không chạy được'], answer: 0, explain: `AOP dựa trên proxy chỉ áp dụng cho bean nằm trong {{ApplicationContext}} (Spring mới bọc proxy và inject dependency). Object tạo bằng {{new}} nằm ngoài Spring, không có proxy nên annotation hạ tầng như {{@Transactional}}/{{@Async}} bị bỏ qua. JVM không tự xử lý {{@Transactional}}. Spring không can thiệp vào toán tử {{new}}. Code vẫn biên dịch và chạy, chỉ là transaction không mở.` }, { q: 'Spring Boot (mặc định) dùng cơ chế nào để tạo AOP proxy cho bean cần {{@Transactional}}?', options: ['JDK dynamic proxy dựa trên interface cho mọi bean', 'CGLIB proxy (tạo lớp con lúc runtime) cho bean cần proxy, kể cả khi bean có interface', 'Sửa bytecode lúc biên dịch (compile-time weaving) bắt buộc', 'Không dùng proxy, Spring chèn code trực tiếp vào method'], answer: 1, explain: `Từ Spring Boot 2.0, {{spring.aop.proxy-target-class}} mặc định là {{true}}, nên Boot dùng CGLIB tạo proxy dạng lớp con cho mọi bean cần AOP (dù có interface hay không) — giúp inject theo class cụ thể không lỗi kiểu. JDK proxy dựa trên interface vẫn được Spring Framework hỗ trợ nhưng không phải mặc định của Boot. Compile-time/load-time weaving là cách của AspectJ đầy đủ, không bắt buộc với Spring AOP. Spring AOP proxy-based không sửa bytecode method gốc.` }],
    related: ['spring-002'], tags: ['AOP', 'proxy', 'JDK Proxy', 'self-invocation']
  },
  {
    id: 'lesson-spring-003', track: 'spring', order: 3,
    title: '@Transactional: propagation và rollback', level: 'senior', minutes: 35,
    goals: ['Phân biệt REQUIRED và REQUIRES_NEW', 'Nắm rollback mặc định', 'Mô phỏng commit/rollback theo exception'],
    body: `**Tóm tắt:** {{REQUIRED}} tham gia transaction hiện có hoặc tạo transaction mới; {{REQUIRES_NEW}} tạm treo transaction hiện tại và chạy transaction độc lập. Mặc định Spring rollback với unchecked exception và Error, còn checked exception không tự rollback nếu không cấu hình.

### Transaction boundary
Transaction interceptor bao quanh method được gọi qua proxy. Nó lấy hoặc tạo transaction theo propagation, gọi nghiệp vụ, rồi commit khi thành công hoặc rollback theo rule. Vì vậy call path qua proxy và transaction manager đều quan trọng. Annotation chỉ là metadata, không tự biến mọi method call thành transaction.

### REQUIRED và REQUIRES_NEW
Trong một transaction T1, method REQUIRED dùng lại chính T1 (cùng connection). Bẫy kinh điển: method inner (REQUIRED, qua proxy) ném RuntimeException → interceptor của inner đánh dấu T1 là **rollback-only**; method outer bắt exception đó và "nuốt" đi, tưởng là xong; đến khi outer kết thúc và Spring thử commit thì phát hiện cờ rollback-only, rollback toàn bộ và ném {{UnexpectedRollbackException}}. Bắt exception không gỡ được cờ rollback-only. REQUIRES_NEW suspend T1, mở T2 và kết thúc T2 độc lập; nếu T2 commit nhưng T1 rollback, dữ liệu T2 vẫn còn. Khi connection pool nhỏ, transaction suspended vẫn giữ connection trong khi T2 cần connection khác, có thể gây cạn pool dưới tải.

| Propagation | Có transaction ngoài | Kết quả |
|---|---|---|
| REQUIRED | Có | Tham gia transaction ngoài |
| REQUIRED | Không | Tạo transaction |
| REQUIRES_NEW | Có | Suspend ngoài, chạy transaction độc lập |

### Rollback rules
Spring mặc định rollback cho {{RuntimeException}} và {{Error}}. Với **checked exception** (ví dụ {{IOException}}), Spring mặc định **commit** những gì đã ghi rồi mới ném exception tiếp cho caller — hành vi này làm nhiều người bất ngờ (nó kế thừa quy ước của EJB: checked exception được coi là "lỗi nghiệp vụ dự kiến"). Muốn rollback thì khai báo {{rollbackFor = IOException.class}}; rule áp dụng cho cả **lớp con** (ví dụ {{FileNotFoundException}}). Ngược lại, {{noRollbackFor}} giữ commit cho một exception unchecked cụ thể. Không nên nuốt exception rồi kỳ vọng interceptor biết rằng nghiệp vụ thất bại: interceptor chỉ thấy exception thoát ra khỏi method.

~~~java
@Transactional(rollbackFor = IOException.class)
public void importFile() throws IOException {
    repository.save(...); // checked exception cũng rollback theo rule
}
~~~

### Cơ chế từng bước
Đi từng bước một khi một method {{@Transactional}} được gọi qua proxy:

1. **Proxy chặn lời gọi**: caller giữ reference tới proxy (bean được inject), không phải target thật. Lời gọi {{orderService.placeOrder()}} đi vào proxy trước.
2. **TransactionInterceptor lấy/khởi tạo transaction**: interceptor gọi {{PlatformTransactionManager.getTransaction()}} với {{TransactionDefinition}} đọc từ annotation (propagation, isolation, timeout, readOnly, rollbackFor). Nếu propagation là {{REQUIRED}} và có transaction đang hoạt động trên thread → dùng transaction đó; nếu chưa có → tạo mới (lấy connection từ pool, tắt auto-commit). Nếu {{REQUIRES_NEW}} → suspend transaction hiện tại (nếu có) bằng {{TransactionSuspender}}, sau đó tạo transaction mới hoàn toàn.
3. **Gọi target method**: interceptor gọi {{target.placeOrder()}} trên object thật. Code nghiệp vụ chạy, có thể gọi repository, JPA flush, v.v.
4. **Kết thúc method**: nếu method trả về bình thường (không ném exception) → interceptor gọi {{transactionManager.commit(status)}}. Trong JPA, commit là lúc {{EntityManager.flush()}} thực sự đẩy SQL xuống DB, nên constraint violation có thể ném exception ở bước này.
5. **Xử lý exception**: nếu method ném exception, interceptor so khớp exception với rule rollback: unchecked ({{RuntimeException}}, {{Error}}) → luôn rollback; checked exception → chỉ rollback khi khớp {{rollbackFor}} (tính cả subclass). Nếu quyết định rollback → gọi {{transactionManager.rollback(status)}}; nếu quyết định commit → gọi commit (đây là hành vi mặc định với checked exception).
6. **Cleanup**: sau commit/rollback, connection được trả về pool. Nếu dùng {{REQUIRES_NEW}} và suspend transaction ngoài, transaction ngoài được resume.

**Vì sao lại như vậy?** Propagation quyết định **transaction nào** chịu trách nhiệm dữ liệu; rollback rule quyết định **kết thúc** transaction đó thế nào. Tách hai trục giúp bạn kiểm soát ranh giới độc lập: outer có thể muốn commit toàn bộ, inner có thể muốn rollback riêng — khi đó dùng {{REQUIRES_NEW}} cho inner. Nhưng {{REQUIRES_NEW}} tốn thêm connection từ pool, nên chỉ dùng khi thực sự cần tách biệt kết quả.

~~~java
@Service
class OrderService {
    @Transactional(propagation = Propagation.REQUIRED)
    public void placeOrder() {
        orderRepo.save(new Order());      // T1: insert order
        auditService.logAudit();          // inner REQUIRED → dùng chung T1
        paymentService.charge();          // inner REQUIRES_NEW → T2 độc lập
    }
}

@Service
class AuditService {
    @Transactional(propagation = Propagation.REQUIRED)
    public void logAudit() { auditRepo.save(new AuditLog()); } // cùng T1
}

@Service
class PaymentService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void charge() { paymentRepo.save(new Payment()); }  // T2 riêng
}
~~~

### Lỗi hay gặp trên production
- **UnexpectedRollbackException do inner REQUIRED ném exception, outer bắt và nuốt**: inner đánh dấu transaction rollback-only; outer không ném tiếp exception nên interceptor của outer thấy cờ rollback-only lúc commit → rollback toàn bộ và ném {{UnexpectedRollbackException}}. Triệu chứng: log thấy "Transaction rolled back because it has been marked as rollback-only". Cách sửa: **không nuốt exception** từ inner REQUIRED, hoặc dùng {{REQUIRES_NEW}} cho inner nếu muốn tách biệt kết quả, hoặc ném lại exception (có thể bọc) để outer cũng rollback.
- **Cạn connection pool do REQUIRES_NEW lạm dụng**: mỗi transaction suspended giữ connection; T2 cần connection mới. Dưới tải cao, pool HikariCP (mặc định 10) cạn nhanh. Triệu chứng: request timeout chờ connection, log "Pool exhausted". Cách sửa: chỉ dùng {{REQUIRES_NEW}} khi bắt buộc (ghi audit/log phải sống sót khi chính rollback); boundary ngắn, tránh gọi API/http bên trong transaction.
- **Checked exception không rollback mặc định — dữ liệu "nửa vời" commit**: method {{importFile()}} đã {{save()}} 500 dòng rồi gặp {{IOException}} dòng 501. Không có {{rollbackFor}}, 500 dòng đã commit, caller nhận IOException. Triệu chứng: DB có dữ liệu không hoàn chỉnh, không có lỗi nào báo rõ. Cách sửa: thêm {{@Transactional(rollbackFor = Exception.class)}} hoặc ít nhất {{IOException.class}} cho các method xử lý file/IO.
- **Transaction không lan sang thread mới**: dùng {{ExecutorService}} hoặc {{@Async}} bên trong method transactional, code trong thread mới **không** nằm trong transaction gốc. Triệu chứng: repository.save trong thread con không thấy dữ liệu cha vừa ghi, hoặc commit/rollback không ảnh hưởng thread con. Cách sửa: tránh xử lý nặng trong transaction; dùng outbox pattern cho side effect, hoặc {{TransactionTemplate}} truyền context thủ công (phức tạp, ít khuyến khích).

### Liên hệ phỏng vấn
1. **Propagation REQUIRED và REQUIRES_NEW khác nhau ở điểm nào? Khi nào chọn cái nào?** — REQUIRED dùng chung transaction nếu có, không thì tạo mới; REQUIRES_NEW luôn suspend transaction ngoài (nếu có) và tạo transaction hoàn toàn riêng. Chọn REQUIRED cho các thao tác cần cùng thành công/cùng thất bại (atomic). Chọn REQUIRES_NEW khi inner phải commit độc lập (ví dụ ghi audit log, gửi metric) dù outer rollback.
2. **Spring mặc định rollback với exception nào? Checked exception thì sao?** — Mặc định rollback cho {{RuntimeException}} và {{Error}}. Checked exception ({{IOException}}, {{SQLException}}...) thì **commit** transaction rồi mới ném exception. Muốn rollback checked exception phải khai báo {{@Transactional(rollbackFor = IOException.class)}}.
3. **Vì sao gọi @Async bên trong method @Transactional không an toàn?** — @Async chạy trên thread pool riêng, không chia sẻ transaction context với thread cha. Transaction gốc có thể commit/rollback trước khi thread con xong, dẫn đến dữ liệu không nhất quán. Nên dùng outbox pattern: ghi event vào DB trong cùng transaction, process riêng đọc outbox và gửi.

> Senior tip: Đừng dùng REQUIRES_NEW như cách sửa mọi lỗi transaction. Theo dõi connection-pool active/pending cùng thời gian transaction; boundary dài thường là nguyên nhân gây nghẽn trước khi propagation trở thành vấn đề.`,
    exercises: [{
      title: 'Mô phỏng rollback rule của @Transactional',
      prompt: `Mô phỏng phần "commit hay rollback" của transaction interceptor bằng {{TxManager.run(rollbackFor, work)}}:
- {{work}} là {{TxWork}} — giống Runnable nhưng được phép ném checked exception.
- {{work}} chạy xong không lỗi → {{commits++}}.
- {{work}} ném {{RuntimeException}} hoặc {{Error}} → {{rollbacks++}} (mặc định của Spring).
- {{work}} ném checked exception: nếu nó là instance của **một trong các class** trong {{rollbackFor}} (tính cả lớp con) → {{rollbacks++}}; nếu không → {{commits++}} (đúng mặc định của Spring: checked exception vẫn commit).
- Trong mọi trường hợp lỗi, ném lại **chính exception gốc** cho caller (không bọc). Method đã khai báo {{throws Exception}} nên ném lại được mọi loại.`,
      starter: `interface TxWork { void run() throws Exception; }
class TxManager {
 int commits, rollbacks;
 void run(Set<Class<? extends Throwable>> rollbackFor, TxWork work) throws Exception { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed=0, total=0;
 interface Body { void run() throws Exception; }
 static void check(String n, Body r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch(Throwable t) { System.out.println("FAIL " + n + ": " + t); } }
 static void counts(TxManager t, int c, int r) { if (t.commits != c || t.rollbacks != r) throw new AssertionError("commits=" + t.commits + " rollbacks=" + t.rollbacks + ", expected " + c + "/" + r); }
 static Throwable thrown(TxManager t, Set<Class<? extends Throwable>> rules, Throwable ex) {
  try { t.run(rules, () -> { if (ex instanceof Exception) throw (Exception) ex; throw (Error) ex; }); }
  catch (Throwable e) { return e; }
  throw new AssertionError("exception was swallowed");
 }
 public static void main(String[] a) {
  check("success commits", () -> { TxManager t=new TxManager(); t.run(Set.of(), ()->{}); counts(t,1,0); });
  check("runtime exception rolls back and is rethrown as-is", () -> { TxManager t=new TxManager(); IllegalStateException ex=new IllegalStateException("x"); if (thrown(t, Set.of(), ex)!=ex) throw new AssertionError("not same exception"); counts(t,0,1); });
  check("Error rolls back", () -> { TxManager t=new TxManager(); AssertionError ex=new AssertionError("boom"); if (thrown(t, Set.of(), ex)!=ex) throw new AssertionError("not same error"); counts(t,0,1); });
  check("checked exception commits by default", () -> { TxManager t=new TxManager(); java.io.IOException ex=new java.io.IOException("disk"); if (thrown(t, Set.of(), ex)!=ex) throw new AssertionError("not same exception"); counts(t,1,0); });
  check("rollbackFor matches checked exception", () -> { TxManager t=new TxManager(); thrown(t, Set.of(java.io.IOException.class), new java.io.IOException()); counts(t,0,1); });
  check("rollbackFor matches subclasses", () -> { TxManager t=new TxManager(); thrown(t, Set.of(java.io.IOException.class), new java.io.FileNotFoundException()); counts(t,0,1); });
  check("unrelated rule does not apply", () -> { TxManager t=new TxManager(); thrown(t, Set.of(java.sql.SQLException.class), new java.io.IOException()); counts(t,1,0); });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `interface TxWork { void run() throws Exception; }
class TxManager {
 int commits, rollbacks;
 void run(Set<Class<? extends Throwable>> rollbackFor, TxWork work) throws Exception {
  try {
   work.run();
  } catch (RuntimeException | Error unchecked) {
   rollbacks++;                       // mặc định: unchecked luôn rollback
   throw unchecked;
  } catch (Exception checked) {
   boolean rule = false;
   for (Class<? extends Throwable> c : rollbackFor) if (c.isInstance(checked)) rule = true;   // tính cả lớp con
   if (rule) rollbacks++; else commits++;                // checked: commit trừ khi có rollbackFor
   throw checked;                     // ném lại chính exception gốc
  }
  commits++;
 }
}`,
      hints: ['Dùng hai khối catch: {{catch (RuntimeException | Error e)}} trước, rồi {{catch (Exception e)}} cho checked exception.', '{{c.isInstance(e)}} trả true cả khi e là lớp con của c — đúng như cách Spring so khớp {{rollbackFor}}.', 'Đừng bọc exception ({{new RuntimeException(e)}}): caller và Spring cần thấy đúng loại exception gốc.'],
      explain: `Bài tập tái hiện đúng quyết định mà {{TransactionInterceptor}} của Spring đưa ra khi method thoát: không lỗi thì commit; lỗi thì hỏi rule "exception này có rollback không" (mặc định: có với RuntimeException/Error, không với checked), sau đó **luôn** ném exception tiếp cho caller. Rollback hay commit và việc exception có tới tay caller hay không là hai chuyện độc lập.

Ví dụ thật: {{importFile()}} đã {{save()}} 500 dòng rồi gặp {{IOException}} khi đọc dòng 501. Không có {{rollbackFor}}, 500 dòng đó được **commit** và caller vẫn nhận IOException — dữ liệu "nửa vời" nằm trong DB. Đây là bug production rất hay gặp.

Lỗi hay gặp:
- Viết {{catch (Exception e)}} trước rồi mới {{catch (RuntimeException e)}}: không biên dịch được (catch sau không bao giờ tới), hoặc nếu gộp chung thì quên phân biệt checked/unchecked.
- So khớp bằng {{c == e.getClass()}}: bỏ sót lớp con, test {{FileNotFoundException}} bắt lỗi này.
- Bọc exception trước khi ném lại: caller bắt {{IOException}} không còn bắt được.

Propagation (REQUIRED/REQUIRES_NEW) quyết định **transaction nào** được dùng; rollback rule quyết định **kết thúc** nó thế nào — hai trục khác nhau.`
    }],
    check: [{ q: 'Method bên trong chạy REQUIRED khi đã có transaction ngoài thì thường thế nào?', options: ['Luôn tạo transaction mới độc lập', 'Tham gia transaction hiện có', 'Tắt transaction ngoài', 'Chỉ chạy được với checked exception'], answer: 1, explain: `REQUIRED dùng transaction hiện có nếu có, nếu không mới tạo. "Luôn tạo transaction mới" là REQUIRES_NEW. Không propagation nào "tắt" transaction ngoài; NOT_SUPPORTED chỉ tạm treo nó. Propagation không liên quan loại exception.` }, { q: 'Method {{@Transactional public void importFile() throws IOException}} lưu 500 bản ghi rồi ném {{IOException}}. Không cấu hình gì thêm. Kết quả?', options: ['Rollback cả 500 bản ghi', '500 bản ghi được commit, caller vẫn nhận IOException', 'Spring nuốt IOException và commit', 'Spring bọc thành RuntimeException rồi rollback'], answer: 1, explain: `Mặc định Spring chỉ rollback với RuntimeException và Error; IOException là checked nên transaction được commit, sau đó exception vẫn được ném cho caller. Muốn rollback phải thêm rollbackFor = IOException.class. Spring không nuốt exception và cũng không bọc lại thành RuntimeException.` }, { q: 'Outer REQUIRED gọi inner REQUIRES_NEW; inner commit thành công, outer sau đó ném RuntimeException. Dữ liệu của inner bị rollback không?', options: ['Có, vì outer rollback kéo theo inner', 'Không, inner đã commit trong transaction riêng và không bị ảnh hưởng', 'Chỉ rollback nếu inner cũng ném exception', 'Spring ném UnexpectedRollbackException và rollback cả hai'], answer: 1, explain: `REQUIRES_NEW tạo transaction hoàn toàn độc lập (suspend outer). Inner commit xong là dữ liệu đã xuống DB, outer rollback không thể quay ngược transaction đã kết thúc của inner. UnexpectedRollbackException chỉ xảy ra khi inner REQUIRED đánh dấu rollback-only trên transaction chung.` }, { q: 'Method @Transactional có rollbackFor = IOException.class, trong đó gọi repository.save() ném DataIntegrityViolationException (subclass của RuntimeException). Transaction có rollback không?', options: ['Không, vì rollbackFor chỉ áp dụng cho IOException', 'Có, vì RuntimeException luôn rollback mặc định, rollbackFor chỉ mở rộng thêm', 'Chỉ rollback nếu catch IOException và ném lại', 'Không, vì DataIntegrityViolationException không phải IOException'], answer: 1, explain: `Mặc định Spring rollback mọi RuntimeException (kể cả subclass như DataIntegrityViolationException) và Error. rollbackFor = IOException.class chỉ THÊM rule cho checked exception IOException (và subclass), không ghi đè rule mặc định. Vì vậy RuntimeException vẫn rollback như bình thường.` }],
    related: ['spring-003'], tags: ['Transactional', 'propagation', 'rollback', 'JPA']
  },
  {
    id: 'lesson-spring-004', track: 'spring', order: 4,
    title: 'Bean lifecycle và scope', level: 'mid', minutes: 30,
    goals: ['Nêu thứ tự khởi tạo bean', 'Phân biệt singleton và prototype', 'Quản lý init/destroy resource'],
    body: `**Tóm tắt:** Spring tạo bean, inject dependency, chạy callback khởi tạo rồi đưa bean vào sử dụng; khi context đóng, callback hủy được gọi cho bean do context quản lý. Singleton được giữ trong context, còn prototype tạo instance mới mỗi lần yêu cầu và lifecycle destroy không được container tự quản lý như singleton.

### Lifecycle cơ bản
Với một singleton, Spring đi qua các bước theo đúng thứ tự sau:

1. **Tạo instance**: gọi constructor (hoặc factory method {{@Bean}}); constructor injection xảy ra ở đây.
2. **Inject field/setter** ({{@Autowired}} trên field hoặc setter).
3. **Aware callback**: ví dụ {{BeanNameAware}}, {{ApplicationContextAware}} — bean nhận tên của nó, nhận context.
4. **BeanPostProcessor#postProcessBeforeInitialization**: chính ở bước này {{@PostConstruct}} được gọi (do {{CommonAnnotationBeanPostProcessor}} xử lý).
5. **Init callback khác**: {{InitializingBean.afterPropertiesSet()}}, rồi init-method khai báo trong {{@Bean(initMethod = ...)}}.
6. **BeanPostProcessor#postProcessAfterInitialization**: đây là nơi Spring **bọc bean bằng AOP proxy** (cho {{@Transactional}}, {{@Async}}…). Thứ được đưa vào context và inject cho bean khác là proxy này.
7. Bean sẵn sàng sử dụng.

Khi context đóng, singleton được hủy theo thứ tự: {{@PreDestroy}} → {{DisposableBean.destroy()}} → destroy-method. {{@PostConstruct}}/{{@PreDestroy}} thuộc package {{jakarta.annotation}} (Spring Boot 3; bản cũ là {{javax.annotation}}).

Hệ quả quan trọng của bước 6: trong {{@PostConstruct}}, bean **chưa** được bọc proxy, và gọi method của chính nó là self-call — nên {{@Transactional}} trên method được gọi từ {{@PostConstruct}} không có tác dụng. Việc cần transaction lúc khởi động hãy đặt trong listener {{ApplicationReadyEvent}} hoặc gọi qua một bean khác.

Initialization callback phù hợp để kiểm tra cấu hình hoặc chuẩn bị resource nhẹ; không nên làm công việc dài (nạp cache vài phút, gọi API ngoài) vì nó chặn cả quá trình khởi động và lỗi ở đây làm app không lên được.

~~~java
@Component
class Cache {
    @PostConstruct void warmUp() { /* kiểm tra cấu hình, chuẩn bị nhẹ */ }
    @PreDestroy void close() { /* giải phóng resource */ }
}
~~~

### Scope
Singleton là một instance cho mỗi bean definition trong ApplicationContext. Prototype tạo object mới mỗi lần container resolve bean; Spring chạy init callback cho prototype nhưng **không** gọi destroy callback, vì sau khi giao object đi container không giữ nó nữa. Inject prototype vào singleton chỉ resolve **một lần** khi singleton được tạo; nếu cần object mới mỗi lần, inject {{ObjectProvider<T>}} rồi gọi {{getObject()}}, hoặc dùng {{@Lookup}} method. Web app còn có scope {{request}} và {{session}}: inject chúng vào singleton cần một scoped proxy (Spring tự tạo khi dùng {{@RequestScope}}).

| Scope | Tạo | Destroy callback |
|---|---|---|
| Singleton | Thường một lần mỗi context | Context quản lý |
| Prototype | Mỗi lần resolve | Consumer chịu trách nhiệm sau khi nhận |

### Cơ chế từng bước
Đi từng bước một khi Spring khởi tạo một singleton bean {{OrderService}} phụ thuộc vào {{OrderRepository}}:

1. **Đọc bean definition**: component scan tìm {{@Service}} class, tạo {{BeanDefinition}} lưu metadata (class name, scope, constructor args, property values, init/destroy method). Chưa tạo instance nào.
2. **Resolve dependency graph**: container xây dựng đồ thị phụ thuộc. {{OrderService}} cần {{OrderRepository}} → {{OrderRepository}} phải tạo trước.
3. **Instantiation**: gọi constructor của {{OrderRepository}} (không có dependency khác) → instance repo. Sau đó gọi constructor {{OrderService(repo)}} → instance service.
4. **Dependency injection (field/setter)**: nếu có {{@Autowired}} trên field hoặc setter, gán giá trị ngay sau constructor.
5. **Aware callbacks**: nếu bean implements {{BeanNameAware}}, gọi {{setBeanName("orderService")}}; nếu {{ApplicationContextAware}}, gọi {{setApplicationContext(ctx)}}.
6. **PostProcessBeforeInitialization**: các {{BeanPostProcessor}} chạy, trong đó {{CommonAnnotationBeanPostProcessor}} phát hiện {{@PostConstruct}} và gọi method warmUp().
7. **Custom init callbacks**: nếu implements {{InitializingBean}}, gọi {{afterPropertiesSet()}}; nếu có {{@Bean(initMethod="init")}}, gọi method init().
8. **PostProcessAfterInitialization**: {{BeanPostProcessor}} chạy lần 2. **Quan trọng**: {{AnnotationAwareAspectJAutoProxyCreator}} (một {{BeanPostProcessor}}) bọc bean bằng **AOP proxy** tại đây. Bean đăng ký trong context và inject cho bean khác là **proxy**, không phải target gốc.
9. **Bean sẵn sàng**: context trả proxy cho nơi cần inject.

Khi shutdown ({{ConfigurableApplicationContext.close()}}):
1. Gọi {{@PreDestroy}} (qua {{CommonAnnotationBeanPostProcessor}}).
2. Gọi {{DisposableBean.destroy()}}.
3. Gọi destroy-method của {{@Bean}}.
4. Hủy theo thứ tự ngược dependency graph (bean phụ thuộc bị hủy trước dependency của nó).

**Vì sao lại như vậy?** Thứ tự đảm bảo dependency sẵn sàng trước khi bean dùng nó. Proxy được tạo **sau** init callback để init method không bị chặn bởi proxy (self-invocation trong {{@PostConstruct}} không kích hoạt AOP). Hủy ngược thứ tự tránh dùng dependency đã bị đóng.

~~~java
@Service
class OrderService {
    private final OrderRepository repo;
    OrderService(OrderRepository repo) { this.repo = repo; } // 1. constructor inject
    
    @PostConstruct
    void init() { repo.count(); } // 2. @PostConstruct chạy TRƯỚC khi tạo proxy
    
    @Transactional
    public void placeOrder() { repo.save(new Order()); } // 3. @Transactional chỉ hoạt động khi gọi QUA proxy
}
~~~

### Lỗi hay gặp trên production
- **@Transactional trong @PostConstruct không hoạt động**: gọi {{this.placeOrder()}} trong {{@PostConstruct}} là self-call trên target gốc (chưa có proxy). Triệu chứng: method chạy nhưng không mở transaction, không có lock, JPA flush không xảy ra. Cách sửa: chuyển logic khởi động cần transaction sang {{ApplicationReadyEvent}} listener, hoặc tách ra bean riêng và inject.
- **Prototype bean inject vào singleton chỉ tạo một instance**: field prototype được resolve một lần lúc tạo singleton. Triệu chứng: mỗi request dùng chung instance prototype, state bị chia sẻ nhầm (ví dụ request-scoped data rò rỉ giữa user). Cách sửa: inject {{ObjectProvider<PrototypeBean>}} rồi gọi {{getObject()}} mỗi lần cần, hoặc dùng {{@Lookup}} method.
- **Resource rò rỉ trong prototype**: container không gọi destroy cho prototype. Nếu prototype mở {{Connection}}, {{ExecutorService}}, file handle... mà consumer không đóng → leak. Triệu chứng: connection pool cạn, thread count tăng không giảm, "Too many open files". Cách sửa: prototype implement {{AutoCloseable}}, consumer dùng try-with-resources; hoặc tránh để prototype nắm resource dài hạn.
- **Singleton có mutable state gây race condition**: field {{private User currentUser}} trong {{@Service}} singleton, request A gán, request B đọc nhầm. Triệu chứng: dữ liệu user "nhảy" giữa request, khó tái hiện. Cách sửa: service stateless, truyền dữ liệu request qua tham số method; cần state thì dùng scope {{request}} hoặc {{ThreadLocal}} (cẩn thận cleanup).
- **Shutdown callback không chạy khi process bị kill (SIGKILL) hoặc hết timeout**: {{@PreDestroy}} là best-effort, không đảm bảo chạy. Triệu chứng: dữ liệu trong memory chưa flush mất khi container stop gấp. Cách sửa: không dựa vào {{@PreDestroy}} cho dữ liệu quan trọng; dùng transaction DB, outbox pattern, hoặc graceful shutdown với timeout đủ dài ({{spring.lifecycle.timeout-per-shutdown-phase}}).

### Thứ tự và dependency
Nếu A phụ thuộc B, B phải sẵn sàng trước khi A dùng dependency. Hủy bean thường theo thứ tự ngược để consumer giải phóng trước dependency. Không nên phụ thuộc vào thứ tự giữa hai bean không có quan hệ dependency; nếu cần startup ordering, khai báo dependency rõ ràng.

### Pitfall production
Không mở thread hoặc connection trong constructor nếu khởi tạo có thể thất bại một phần. Đảm bảo shutdown graceful đóng executor và resource. Prototype chứa resource dễ rò rỉ vì context không gọi destroy cho từng instance; dùng try/finally hoặc AutoCloseable ở nơi sở hữu. Bean singleton có state mutable dùng chung gây race condition. Với web scope, proxy giúp singleton tham chiếu tới bean request-scoped nhưng cần hiểu lifecycle request.

### Liên hệ phỏng vấn
1. **Bean lifecycle của Spring có những giai đoạn nào? Proxy AOP được tạo ở đâu?** — Tạo instance → inject dependency → Aware callback → @PostConstruct → InitializingBean/afterPropertiesSet → **tạo AOP proxy (postProcessAfterInitialization)** → bean sẵn sàng. Proxy tạo SAU @PostConstruct nên @Transactional trong @PostConstruct không chạy.
2. **Prototype inject vào singleton thì sao? Làm sao để lấy instance mới mỗi lần?** — Chỉ resolve một lần lúc tạo singleton, nên singleton giữ y nguyên instance đó. Muốn instance mới: inject {{ObjectProvider<PrototypeBean>}} và gọi {{getObject()}} mỗi lần, hoặc viết method {{@Lookup PrototypeBean createPrototype()}}.
3. **@PreDestroy có đảm bảo chạy khi app tắt không?** — Không. SIGKILL, crash JVM, hoặc hết {{spring.lifecycle.timeout-per-shutdown-phase}} đều làm callback không kịp chạy. Không dùng @PreDestroy để bảo vệ dữ liệu quan trọng; hãy dùng DB transaction, outbox, hay idempotency.

> Senior tip: Lifecycle callback nên ngắn, idempotent và có log rõ. Không coi @PreDestroy là nơi duy nhất bảo vệ dữ liệu quan trọng; process có thể bị kill hoặc hết thời gian shutdown.`,
    exercises: [{
      title: 'Mô phỏng scope và lifecycle callback',
      prompt: `Viết {{BeanFactory}} mô phỏng hai scope SINGLETON và PROTOTYPE:
- {{get(name, scope)}}: SINGLETON thì chỉ tạo lần đầu, các lần sau trả lại cùng object; PROTOTYPE thì mỗi lần tạo object mới. **Mỗi lần thật sự tạo** một {{Bean}} thì ghi sự kiện {{init:name}} vào {{events}}.
- {{close()}}: ghi {{destroy:name}} cho các **singleton** theo thứ tự **ngược** với thứ tự tạo (bean tạo sau hủy trước). Prototype không được destroy. Gọi {{close()}} lần hai không làm gì.
- Sau khi đã {{close()}}, gọi {{get}} phải ném {{IllegalStateException}}.`,
      starter: `enum Scope { SINGLETON, PROTOTYPE }
class Bean { final String name; Bean(String n) { name=n; } }
class BeanFactory {
 List<String> events = new ArrayList<>();
 Bean get(String name, Scope scope) { throw new UnsupportedOperationException("TODO"); }
 void close() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed=0, total=0;\n static void check(String n, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch(Throwable t) { System.out.println("FAIL " + n + ": " + t); } }
 public static void main(String[] a) {
  check("scope behavior", () -> { BeanFactory f=new BeanFactory(); if(f.get("a",Scope.SINGLETON)!=f.get("a",Scope.SINGLETON)) throw new AssertionError(); if(f.get("p",Scope.PROTOTYPE)==f.get("p",Scope.PROTOTYPE)) throw new AssertionError(); });
  check("reverse singleton destruction", () -> { BeanFactory f=new BeanFactory(); f.get("a",Scope.SINGLETON); f.get("b",Scope.SINGLETON); f.close(); if(!f.events.equals(List.of("init:a","init:b","destroy:b","destroy:a"))) throw new AssertionError(f.events); });
  check("close idempotent and prototype excluded", () -> { BeanFactory f=new BeanFactory(); f.get("p",Scope.PROTOTYPE); f.close(); f.close(); if(!f.events.equals(List.of("init:p"))) throw new AssertionError(f.events); });
  check("init logged once per singleton, every time per prototype", () -> { BeanFactory f=new BeanFactory(); f.get("s",Scope.SINGLETON); f.get("s",Scope.SINGLETON); f.get("p",Scope.PROTOTYPE); f.get("p",Scope.PROTOTYPE); if(!f.events.equals(List.of("init:s","init:p","init:p"))) throw new AssertionError(f.events); });
  check("get after close throws", () -> { BeanFactory f=new BeanFactory(); f.get("a",Scope.SINGLETON); f.close(); try { f.get("a",Scope.SINGLETON); throw new AssertionError("expected IllegalStateException"); } catch (IllegalStateException ok) {} });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `enum Scope { SINGLETON, PROTOTYPE }
class Bean { final String name; Bean(String n) { name=n; } }
class BeanFactory {
 List<String> events = new ArrayList<>();
 private final Map<String,Bean> singletons = new LinkedHashMap<>();
 private boolean closed;
 Bean get(String name, Scope scope) {
  if (closed) throw new IllegalStateException("closed");
  if (scope == Scope.PROTOTYPE) { events.add("init:"+name); return new Bean(name); }
  return singletons.computeIfAbsent(name, n -> { events.add("init:"+n); return new Bean(n); });
 }
 void close() {
  if (closed) return;
  closed=true;
  List<Bean> beans = new ArrayList<>(singletons.values());
  Collections.reverse(beans);
  for (Bean b: beans) events.add("destroy:"+b.name);
 }
}`,
      hints: ['Dùng LinkedHashMap để giữ thứ tự tạo singleton.', 'Prototype không đưa vào registry singleton.', 'Đóng factory lần hai không được lặp callback.'],
      explain: `Ví dụ mô phỏng scope và callback bằng event log. Singleton được cache theo tên trong một {{LinkedHashMap}} (giữ thứ tự chèn), nên khi đóng chỉ cần đảo danh sách để hủy ngược. Prototype không vào cache: container tạo xong là giao đi và quên luôn, vì vậy không thể gọi destroy cho nó — việc dọn dẹp thuộc về code đã lấy nó.

Vì sao hủy **ngược** thứ tự tạo? Nếu A dùng B thì B được tạo trước A. Khi tắt, A phải dừng trước (có thể nó còn đang flush dữ liệu qua B), rồi mới tới B. Spring thật xác định thứ tự này theo đồ thị phụ thuộc giữa các bean, không chỉ theo thứ tự tạo.

Lỗi hay gặp:
- Dùng {{HashMap}}: thứ tự duyệt không theo thứ tự tạo, destroy lộn xộn.
- Ghi {{init}} trước khi kiểm tra cache: singleton bị ghi init nhiều lần dù chỉ tạo một object.
- Không có cờ {{closed}}: gọi close hai lần thì destroy hai lần — với resource thật (connection pool) có thể ném lỗi khi đóng lần hai.`
    }],
    check: [{ q: 'Prototype bean được inject một lần vào singleton thì chuyện gì xảy ra?', options: ['Mỗi lần gọi method singleton tự nhận prototype mới', 'Singleton giữ instance đã resolve lúc inject', 'Prototype chuyển thành request scope', 'Container không tạo prototype'], answer: 1, explain: `Dependency được resolve một lần khi singleton được tạo, nên field đó luôn trỏ tới cùng một object. Container không tự "làm mới" field mỗi lần gọi method; muốn instance mới mỗi lần cần {{ObjectProvider}} hoặc {{@Lookup}}. Scope không tự đổi thành request. Container vẫn tạo prototype — đúng một lần lúc inject.` }, { q: 'Service có method {{@Transactional void loadData()}} và được gọi từ {{@PostConstruct void init()}} của chính service đó. Vì sao transaction không được mở?', options: ['Vì @PostConstruct chạy trước khi bean được bọc proxy (postProcessAfterInitialization), và lời gọi là self-call', 'Vì @PostConstruct luôn chạy trong thread riêng', 'Vì transaction manager chỉ khởi tạo sau khi HTTP server bật', 'Vì @Transactional không hỗ trợ method trả về void'], answer: 0, explain: `@PostConstruct chạy ở bước postProcessBeforeInitialization, trước khi Spring tạo AOP proxy; hơn nữa init() gọi this.loadData() trên chính object gốc, không qua proxy. Cách sửa: chạy trong listener ApplicationReadyEvent hoặc gọi qua bean khác. @PostConstruct chạy trên thread đang tạo context, không phải thread riêng. Transaction manager là bean bình thường, không chờ HTTP server. Kiểu trả về void hoàn toàn được hỗ trợ.` }, { q: 'Bean prototype chứa một ExecutorService và được inject vào singleton qua ObjectProvider.getObject(). Ai chịu trách nhiệm shutdown ExecutorService?', options: ['Spring container tự gọi destroy cho prototype', 'Code nhận instance (consumer) phải tự đóng trong try-with-resources hoặc @PreDestroy của chính nó', 'Singleton cha sẽ tự đóng khi context đóng', 'ExecutorService không cần shutdown, GC sẽ dọn dẹp'], answer: 1, explain: `Spring KHÔNG gọi destroy callback cho prototype bean. Consumer nhận instance qua ObjectProvider.getObject() phải tự quản lý vòng đời: đóng resource trong finally, try-with-resources, hoặc đăng ký shutdown hook riêng. Singleton cha không biết prototype nào đã được tạo. GC không đảm bảo shutdown executor kịp thời.` }, { q: 'Khi Spring Boot shutdown, @PreDestroy callback có chắc chắn chạy không?', options: ['Luôn chạy, Spring đảm bảo', 'Chỉ chạy nếu shutdown graceful (SIGTERM), không chạy nếu SIGKILL hoặc crash JVM', 'Chỉ chạy cho singleton, không chạy cho prototype', 'Chỉ chạy nếu bean implements DisposableBean'], answer: 1, explain: `@PreDestroy là best-effort: chạy khi context.close() được gọi graceful (SIGTERM, timeout đủ). SIGKILL, crash JVM, OutOfMemoryError, hoặc hết spring.lifecycle.timeout-per-shutdown-phase đều làm callback không kịp chạy. Không dùng @PreDestroy để bảo vệ dữ liệu quan trọng (dùng DB transaction, outbox). Prototype từ đầu không có destroy callback.` }],
    related: ['spring-004'], tags: ['lifecycle', 'scope', 'singleton', 'prototype']
  },
  {
    id: 'lesson-spring-005', track: 'spring', order: 5,
    title: 'Spring MVC request flow, validation và ProblemDetail', level: 'senior', minutes: 35,
    goals: ['Lần theo request qua DispatcherServlet', 'Validate dữ liệu ở boundary', 'Trả lỗi có cấu trúc bằng ProblemDetail'],
    body: `**Tóm tắt:** Spring MVC nhận request tại DispatcherServlet, tìm handler phù hợp, chuyển đổi và validate input, gọi controller rồi serialize response. Lỗi validation nên được ánh xạ thành response có schema ổn định; Spring Framework 6 hỗ trợ {{ProblemDetail}} theo RFC 9457.

### Request flow
Đi từng bước với request {{POST /users}} có body JSON:

1. Servlet container (Tomcat) nhận HTTP request, chạy qua các **Filter** (ví dụ Spring Security), rồi giao cho **DispatcherServlet** — servlet duy nhất của Spring MVC.
2. **HandlerMapping** ({{RequestMappingHandlerMapping}}) tìm method controller khớp URL + HTTP method. Không có method nào khớp → 404 (Spring 6 ném {{NoHandlerFoundException}}/{{NoResourceFoundException}}).
3. **HandlerAdapter** chuẩn bị tham số cho method. Với {{@RequestBody}}, một **HttpMessageConverter** (Jackson) đọc JSON thành DTO; JSON sai cú pháp → {{HttpMessageNotReadableException}} → 400.
4. Nếu tham số có {{@Valid}} (cần dependency {{spring-boot-starter-validation}}), Bean Validation kiểm tra constraint như {{@NotBlank}}, {{@Email}}; vi phạm → {{MethodArgumentNotValidException}} → 400. Controller **không hề được gọi**.
5. Controller gọi service, trả về object; converter serialize object đó thành JSON response.
6. Exception ở bất kỳ bước nào được chuyển cho **HandlerExceptionResolver** — trong đó có các method {{@ExceptionHandler}} của bạn (thường đặt trong {{@RestControllerAdvice}}) — để chọn status và body.

~~~java
record CreateUser(@NotBlank String email) {}
@PostMapping("/users")
ResponseEntity<?> create(@Valid @RequestBody CreateUser request) { ... }
~~~

### Cơ chế từng bước
Đi sâu từng bước khi một request {{POST /orders}} đi qua DispatcherServlet:

1. **Filter chain chạy trước**: request vào Tomcat, chạy qua filter chain ({{FilterChainProxy}} của Spring Security nếu có). Filter có thể chặn request sớm (401/403) hoặc gắn thông tin (principal, correlation ID). Filter **không** biết route Spring MVC.
2. **DispatcherServlet nhận request**: {{DispatcherServlet.doDispatch()}} là điểm nhập. Nó lưu trữ các attribute (locale, theme, multipart) và bắt đầu tìm handler.
3. **HandlerMapping tìm handler**: {{RequestMappingHandlerMapping}} dùng {{RequestMappingInfo}} (path, method, consumes, produces, params, headers) để match. Kết quả là {{HandlerExecutionChain}} gồm handler method + interceptors. **Quan trọng**: nếu không match handler nào, ném {{NoHandlerFoundException}} (cần {{spring.mvc.throw-exception-if-no-handler-found=true}} và {{spring.web.resources.add-mappings=false}}) — mặc định Spring 6 trả 404 qua {{DefaultServletHttpRequestHandler}} cho static resource.
4. **HandlerAdapter chuẩn bị tham số**: {{RequestMappingHandlerAdapter}} dùng {{HandlerMethodArgumentResolverComposite}} để resolve từng tham số:
   - {{@RequestBody}} → {{RequestResponseBodyMethodProcessor}} dùng {{HttpMessageConverter}} (Jackson) đọc body → DTO. Lỗi parse → {{HttpMessageNotReadableException}}.
   - {{@Valid}} → {{ValidationArgumentResolver}} chạy Bean Validation (Hibernate Validator). Vi phạm constraint → {{MethodArgumentNotValidException}}.
   - {{@PathVariable}}, {{@RequestParam}}, {{@RequestHeader}} → resolver tương ứng.
   Thứ tự: **message converter → validation → controller**. Controller chỉ được gọi khi TẤT CẢ tham số resolve thành công.
5. **Controller method chạy**: business logic, gọi service, repository. Trả về object (DTO, {{ResponseEntity}}, {{String}}, {{void}}…).
6. **Return value handler**: {{HandlerMethodReturnValueHandlerComposite}} xử lý kết quả:
   - {{ResponseEntity}} → set status/headers/body.
   - {{@ResponseBody}} object → {{RequestResponseBodyMethodProcessor}} dùng converter serialize JSON.
   - {{String}} view name → {{ViewNameMethodReturnValueHandler}} → {{ViewResolver}}.
7. **Response hoàn tất**: converter ghi JSON vào {{ServletOutputStream}}, set {{Content-Type: application/json}}. Filter chain tiếp tục ({{OncePerRequestFilter}} after completion).
8. **Exception flow**: bất kỳ exception nào (validation, business, DB) đều bong lên {{DispatcherServlet.doDispatch}} → DispatcherServlet duyệt từng {{HandlerExceptionResolver}} theo thứ tự:
   - {{ExceptionHandlerExceptionResolver}} ({{@ExceptionHandler}} trong {{@RestControllerAdvice}}).
   - {{ResponseStatusExceptionResolver}} ({{@ResponseStatus}} trên exception).
   - {{DefaultHandlerExceptionResolver}} (exception chuẩn Spring MVC → status code).
   - Cuối cùng {{ResponseEntityExceptionHandler}} fallback.
   Kết quả là {{ModelAndView}} hoặc response body → ghi ra client.

**Vì sao lại như vậy?** Tách routing (HandlerMapping), argument resolution (HandlerAdapter), return value handling, và exception resolution thành các component riêng biệt giúp Spring MVC mở rộng được: thêm converter mới cho protobuf, thêm argument resolver cho custom annotation, thêm exception handler cho domain exception — không sửa core DispatcherServlet.

### Validation boundary
Validate syntax và invariant đơn giản ngay tại API boundary, ví dụ field bắt buộc, range, format email/phone. Quy tắc nghiệp vụ cần dữ liệu hiện tại như email đã tồn tại phải được kiểm tra ở service/domain và vẫn cần database constraint để chống race. Không trả stack trace hay nội dung exception nội bộ cho client.

### Custom ArgumentResolver: mở rộng Spring MVC
Khi cần logic resolve phức tạp (ví dụ lấy user từ JWT, parse multi-tenant header), hãy viết {{HandlerMethodArgumentResolver}} và đăng ký qua {{WebMvcConfigurer.addArgumentResolvers}}. Resolver được gọi trong {{HandlerMethodArgumentResolverComposite}} theo thứ tự đăng ký, trước validation.

~~~java
@Component
class CurrentUserResolver implements HandlerMethodArgumentResolver {
    @Override public boolean supportsParameter(MethodParameter p) {
        return p.hasParameterAnnotation(CurrentUser.class) && p.getParameterType().equals(User.class);
    }
    @Override public Object resolveArgument(MethodParameter p, ModelAndViewContainer m, NativeWebRequest w, WebDataBinderFactory f) {
        return w.getUserPrincipal() != null ? userService.findByEmail(w.getUserPrincipal().getName()) : null;
    }
}
~~~

### ProblemDetail
{{ProblemDetail}} biểu diễn lỗi theo RFC 9457 (bản thay thế RFC 7807) với các field {{type}}, {{title}}, {{status}}, {{detail}}, {{instance}} và properties mở rộng; content type của response là {{application/problem+json}}. Hai cách dùng: trả {{ProblemDetail}} từ method {{@ExceptionHandler}} của bạn, hoặc trong Spring Boot 3 bật {{spring.mvc.problemdetails.enabled=true}} để các exception chuẩn của Spring MVC (400 validation, 404, 405…) tự trả về dạng ProblemDetail.

~~~java
@ExceptionHandler(EmailTakenException.class)
ProblemDetail handle(EmailTakenException e) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Email đã được dùng");
    pd.setType(URI.create("https://api.example.com/errors/email-taken")); // client phân loại theo type
    return pd;
}
~~~
Giữ {{type}} ổn định để client phân loại; {{detail}} nên hữu ích nhưng không lộ dữ liệu nhạy cảm. Validation error nên có danh sách field/message đã chuẩn hóa, thứ tự ổn định nếu client hoặc snapshot test phụ thuộc.

### ExceptionResolver: so sánh các resolver chuẩn

| Resolver | Xử lý exception nào | Ưu tiên |
|---|---|---|
| {{ExceptionHandlerExceptionResolver}} | {{@ExceptionHandler}} trong {{@RestControllerAdvice}} | Cao nhất |
| {{ResponseStatusExceptionResolver}} | Exception có {{@ResponseStatus}} | Cao |
| {{DefaultHandlerExceptionResolver}} | Exception chuẩn Spring MVC ({{MethodArgumentNotValidException}}, {{HttpMessageNotReadableException}}, {{NoHandlerFoundException}}…) | Trung bình |
| {{ResponseEntityExceptionHandler}} | Fallback cho các exception còn lại | Thấp |

Bạn thường chỉ cần viết {{@RestControllerAdvice}} với các method {{@ExceptionHandler}} cho domain exception; Spring MVC lo phần còn lại.

### Lỗi hay gặp trên production
- **Validation exception trả 500 thay vì 400**: thiếu {{spring-boot-starter-validation}} hoặc quên {{@Valid}} → {{MethodArgumentNotValidException}} không được ném, validation không chạy, dữ liệu sai lọt vào service → exception ở layer dưới (constraint violation) thành 500. Triệu chứng: log thấy {{DataIntegrityViolationException}} hoặc {{ConstraintViolationException}} từ Hibernate. Cách sửa: đảm bảo dependency validation có mặt, {{@Valid}} ở đúng chỗ, và bật {{spring.mvc.problemdetails.enabled=true}} để có response chuẩn.
- **JSON sai cú pháp trả 400 (không phải 500)**: Jackson bọc JsonParseException vào {{HttpMessageNotReadableException}}, và {{DefaultHandlerExceptionResolver}} ánh xạ ngoại lệ này thành 400 Bad Request — đây là mặc định kể cả Spring Boot 3.1. Nếu ứng dụng trả 500, nguyên nhân thường là exception đã bị bắt/bọc lại ở interceptor hoặc {{@ControllerAdvice}} khác, ghi đè hành vi mặc định. Cách xử lý: đừng thêm {{@ExceptionHandler(JsonParseException.class)}} kỳ vọng bắt lỗi thô (lỗi đã được bọc); nếu muốn body chuẩn, bật {{spring.mvc.problemdetails.enabled=true}} (Boot 3.2+) để body là ProblemDetail, status vẫn là 400.
- **Validation field errors thứ tự không ổn định**: {{MethodArgumentNotValidException.getBindingResult()}} trả {{FieldError}} theo thứ tự xác thực của Bean Validation, có thể khác thứ tự mà client hoặc snapshot test mong đợi → client/snapshot test fail ngẫu nhiên. Triệu chứng: test pass rồi fail không đổi code. Cách sửa: tự map {{BindingResult}} thành danh sách {{FieldErrorDTO}} sort theo tên field trước khi set vào {{ProblemDetail.setProperty("errors", sortedList)}}.
- **Lộ stack trace/internal detail trong error response**: {{@ExceptionHandler(Exception.class)}} trả về {{ex.getMessage()}} hoặc {{ex.toString()}} chứa SQL, class name, line number. Triệu chứng: response body có {{org.hibernate.exception.ConstraintViolationException}} hoặc đường dẫn file. Cách sửa: chỉ trả {{ProblemDetail}} với {{detail}} do bạn tự viết, {{type}} ổn định, không bao giờ set {{detail}} từ exception gốc.
- **Constraint DB trùng lặp với validation controller tạo race condition**: controller check {{email.exists()}} → OK → service {{save()}} → DB unique constraint violation (hai request cùng lúc). Triệu chứng: 500 {{DataIntegrityViolationException}} giữa validation đã pass. Cách sửa: validation controller chỉ check syntax/format; invariant nghiệp vụ (unique email) bắt buộc có DB unique constraint + catch {{DataIntegrityViolationException}} map thành {{ProblemDetail}} 409.
- **Thiếu idempotency key cho thao tác ghi**: client retry request POST tạo đơn hàng khi timeout mạng → tạo trùng đơn. Triệu chứng: dữ liệu trùng lặp, đối soát khó. Cách sửa: client sinh {{Idempotency-Key}} (UUID) mỗi thao tác ghi; server dùng key đó làm khóa duy nhất (DB unique index hoặc cache Redis TTL 24h) để loại bỏ request trùng.

### Liên hệ phỏng vấn
1. **DispatcherServlet xử lý request như thế nào? Nêu các component chính.** — DispatcherServlet delegates tới HandlerMapping (tìm handler), HandlerAdapter (resolve argument, gọi controller), HandlerMethodReturnValueHandler (xử lý kết quả), HandlerExceptionResolver (xử lý lỗi). Filter chain chạy trước và sau DispatcherServlet.
2. **Vì sao validation @Valid chạy trước khi controller được gọi? Exception nào được ném?** — HandlerAdapter dùng ValidationArgumentResolver resolve tham số có @Valid; nếu vi phạm, MethodArgumentNotValidException được ném. Controller không bao giờ được invoke — đây là thiết kế "fail fast" ở boundary.
3. **ProblemDetail (RFC 9457) có những field gì? Khi nào nên bật spring.mvc.problemdetails.enabled?** — Các field: type (URI phân loại lỗi), title (tóm tắt), status (HTTP code), detail (mô tả cho dev), instance (URI request cụ thể), properties (mở rộng). Bật flag trong Boot 3.2+ để exception chuẩn (400, 404, 405…) tự trả ProblemDetail thay vì HTML/body mặc định, giúp client parse nhất quán.
4. **Làm sao xử lý unique constraint violation (race condition) mà không trả 500?** — Validation controller không thay thế DB constraint. Bắt DataIntegrityViolationException trong @RestControllerAdvice, kiểm tra constraint name hoặc SQLState, map thành ProblemDetail 409 CONFLICT với type ổn định. Không dùng select-then-insert vì race condition.

> Senior tip: Một error response tốt giúp client quyết định retry hay sửa request. Đừng retry 400; với 409/5xx hãy định nghĩa semantics rõ và dùng idempotency cho thao tác có side effect. Luôn có correlation ID trong log để trace request end-to-end.`,
    exercises: [{
      title: 'Dispatcher nhỏ với validation và ProblemDetail',
      prompt: `Cài {{MiniDispatcher.dispatch(path, email)}} mô phỏng thứ tự xử lý của Spring MVC cho {{POST /users}} ({{Response}} chỉ giữ {{status}} và {{type}} — phần quan trọng nhất của một ProblemDetail):
1. **Routing trước**: path khác {{/users}} → {{Response(404, "not-found")}}, bất kể email ra sao (giống HandlerMapping không tìm thấy handler thì validation không bao giờ chạy).
2. **Validation sau**: email hợp lệ khi khác null, chứa **đúng một** dấu {{@}}, và cả phần trước lẫn phần sau {{@}} đều không rỗng. Không hợp lệ → {{Response(400, "validation-error")}}.
3. Hợp lệ → {{Response(201, "created")}}.`,
      starter: `class Response { final int status; final String type; Response(int s,String t){status=s;type=t;} }
class MiniDispatcher {
 Response dispatch(String path, String email) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed=0, total=0;\n static void check(String n, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch(Throwable t) { System.out.println("FAIL " + n + ": " + t); } }
 public static void main(String[] a) {
  check("valid route", () -> { Response r=new MiniDispatcher().dispatch("/users","a@b"); if(r.status!=201||!r.type.equals("created")) throw new AssertionError(); });
  check("validation error", () -> { Response r=new MiniDispatcher().dispatch("/users","bad"); if(r.status!=400||!r.type.equals("validation-error")) throw new AssertionError(); });
  check("not found", () -> { Response r=new MiniDispatcher().dispatch("/missing","a@b"); if(r.status!=404||!r.type.equals("not-found")) throw new AssertionError(); });
  check("malformed email", () -> { Response r=new MiniDispatcher().dispatch("/users","a@@b"); if(r.status!=400) throw new AssertionError(); });
  check("empty local or domain part", () -> { MiniDispatcher d=new MiniDispatcher(); for (String e : new String[]{"@b", "a@", "@", ""}) { Response r=d.dispatch("/users", e); if(r.status!=400||!r.type.equals("validation-error")) throw new AssertionError(e); } });
  check("null email is a validation error", () -> { Response r=new MiniDispatcher().dispatch("/users", null); if(r.status!=400) throw new AssertionError(); });
  check("routing happens before validation", () -> { Response r=new MiniDispatcher().dispatch("/orders", null); if(r.status!=404||!r.type.equals("not-found")) throw new AssertionError(r.status + " " + r.type); });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `class Response { final int status; final String type; Response(int s,String t){status=s;type=t;} }
class MiniDispatcher {
 Response dispatch(String path, String email) {
  if (!"/users".equals(path)) return new Response(404,"not-found");
  if (email==null) return new Response(400,"validation-error");
  int at=email.indexOf('@');
  if (at<=0 || at!=email.lastIndexOf('@') || at==email.length()-1) return new Response(400,"validation-error");
  return new Response(201,"created");
 }
}`,
      hints: ['Route matching trước validation payload.', 'Một @ duy nhất phải có ký tự hai phía.', 'Dùng type ổn định cho client thay vì câu lỗi tự do.'],
      explain: `Dispatcher tách routing, validation và tạo response thành ba bước theo đúng thứ tự của Spring MVC: không tìm thấy handler thì trả 404 ngay, tham số của handler (và validation của nó) chưa bao giờ được xét. Vì vậy {{/orders}} với email null vẫn là 404, không phải 400.

Kiểm tra email bằng {{indexOf('@')}} và {{lastIndexOf('@')}}: hai giá trị bằng nhau nghĩa là chỉ có một dấu @; {{at > 0}} nghĩa là phần trước không rỗng; {{at < length - 1}} nghĩa là phần sau không rỗng. Ở dự án thật hãy dùng {{@Email}} của Bean Validation thay vì tự viết.

Lỗi hay gặp:
- Validate trước rồi mới route: request sai URL lại nhận 400, client hiểu nhầm là dữ liệu sai.
- Quên null: {{email.indexOf}} ném {{NullPointerException}} → server trả 500 cho một lỗi đáng lẽ là 400.
- Trả {{type}} là câu lỗi tự do ("Email không hợp lệ!"): client không thể phân loại ổn định; {{type}} phải là mã cố định, câu chữ để trong {{detail}}.`
    }],
    check: [{ q: 'Validation cho email chưa tồn tại nên nằm ở đâu?', options: ['Chỉ trong regex ở controller', 'Service/domain và constraint DB khi cần chống race', 'Trong serializer JSON', 'Trong DispatcherServlet'], answer: 1, explain: `Kiểm tra "email đã tồn tại chưa" cần đọc dữ liệu hiện tại, nên thuộc service/domain; thêm unique constraint ở DB vì hai request đồng thời có thể cùng vượt qua bước kiểm tra trong code. Regex chỉ kiểm tra hình dạng email, không biết DB có gì. Serializer chỉ chuyển JSON ↔ object. DispatcherServlet chỉ điều phối request, không chứa nghiệp vụ.` }, { q: 'Controller có {{create(@Valid @RequestBody CreateUser req)}}, client gửi email rỗng vi phạm {{@NotBlank}}. Điều gì xảy ra?', options: ['Controller được gọi với req.email() rỗng, tự kiểm tra lấy', 'Spring ném MethodArgumentNotValidException trước khi gọi controller, mặc định trả 400', 'Spring trả 500 vì validation lỗi', 'Jackson từ chối parse JSON và trả 415'], answer: 1, explain: `Validation chạy khi HandlerAdapter chuẩn bị tham số, nên controller không được gọi; MethodArgumentNotValidException được ExceptionResolver chuyển thành 400 (dạng ProblemDetail nếu bật). Phương án 1 chỉ đúng khi thiếu @Valid hoặc thiếu starter-validation. 500 dành cho lỗi phía server. Jackson parse JSON hợp lệ bình thường; 415 là lỗi Content-Type không được hỗ trợ.` }, { q: 'Client gửi JSON sai cú pháp (thiếu dấu ngoặc) tới endpoint {{@PostMapping}} có {{@RequestBody}}. Mặc định Spring Boot 3.1 trả status gì?', options: ['400 Bad Request', '500 Internal Server Error', '415 Unsupported Media Type', '422 Unprocessable Entity'], answer: 0, explain: `Jackson bọc JsonParseException vào {{HttpMessageNotReadableException}}; {{DefaultHandlerExceptionResolver}} ánh xạ ngoại lệ này thành 400 Bad Request — mặc định kể cả Boot 3.1. {{spring.mvc.problemdetails.enabled=true}} (Boot 3.2+) chỉ đổi body thành ProblemDetail, không đổi status. 500 chỉ xảy ra nếu exception đã bị bắt/bọc lại ở layer khác.` }, { q: 'Khi nào nên dùng {{@ExceptionHandler(DataIntegrityViolationException.class)}} trong {{@RestControllerAdvice}}?', options: ['Bắt mọi lỗi validation Bean Validation', 'Bắt unique constraint violation từ DB để map thành ProblemDetail 409', 'Bật ProblemDetail cho toàn app', 'Xử lý JSON parse error'], answer: 1, explain: `DataIntegrityViolationException là exception cha của các lỗi DB (unique constraint, FK, not null). Dùng nó để map lỗi DB thành ProblemDetail 409 CONFLICT thay vì để thành 500. Bean Validation ném MethodArgumentNotValidException, không phải DataIntegrityViolationException. ProblemDetail bật bằng property config, không phải exception handler.` }],
    related: ['spring-005'], tags: ['Spring MVC', 'validation', 'ProblemDetail', 'HTTP']
  },
  {
    id: 'lesson-spring-006', track: 'spring', order: 6,
    title: 'Migration runner kiểu Flyway: versioned, repeatable và checksum', level: 'senior', minutes: 50,
    goals: ['Mô tả cách Flyway theo dõi migration đã áp dụng', 'Phân biệt migration versioned và repeatable', 'Tự viết runner kiểm tra checksum, thứ tự và out-of-order'],
    body: `**Tóm tắt:** Flyway ghi nhận migration đã chạy trong bảng lịch sử schema, rồi áp các file versioned theo thứ tự tăng dần và các file repeatable khi checksum thay đổi. Runner tự viết trong bài tập mô phỏng cơ chế này: mỗi migration có tên, checksum và thời điểm áp dụng; checksum lệch với bản đã ghi thì runner từ chối để ngăn sửa lén file đã chạy.

### Migration versioned và repeatable
Flyway phân biệt hai nhóm. Migration versioned có tên kiểu {{V1__create_user.sql}}, {{V2__add_email.sql}}: mỗi phiên bản chỉ được áp một lần, theo thứ tự số phiên bản. Migration repeatable có tên kiểu {{R__refresh_view.sql}}: không mang số phiên bản, được chạy lại mỗi khi checksum thay đổi. Repeatable thường dùng cho view, stored procedure hoặc dữ liệu tham chiếu có thể tái tạo. Phân loại dựa vào tiền tố tên: {{V}} theo sau là số và hai dấu gạch dưới; {{R__}} cho repeatable.

### Checksum và schema history
Bảng lịch sử lưu version, checksum, trạng thái success và thời điểm. Checksum bảo vệ khỏi tình huống developer sửa file migration sau khi đã chạy trên production: nếu checksum hiện tại khác bản đã ghi, runner ném {{IllegalStateException}} với thông điệp checksum mismatch. Đây là lỗi có chủ ý để buộc người sửa tạo migration mới thay vì chỉnh migration cũ. Mỗi bản ghi lịch sử là một bằng chứng bất biến của trạng thái schema tại một thời điểm.

| Trường | Ý nghĩa | Ghi chú |
|---|---|---|
| version | Số phiên bản, 0 cho repeatable | Dùng để sắp xếp versioned |
| name | Tên file migration | Định danh repeatable |
| checksum | Dấu vân tay nội dung | Phát hiện sửa lén |
| success | Migration đã hoàn tất | Dùng để retry an toàn |
| ts | Thời điểm áp dụng | Clock inject để test |

### Thứ tự, khoảng trống và out-of-order
Versioned phải chạy theo số thứ tự tăng dần. Khi một migration có số nhỏ hơn phiên bản lớn nhất đã áp dụng xuất hiện sau này, Flyway mặc định từ chối vì out of order. Cờ {{allowOutOfOrder}} cho phép trường hợp đặc biệt, ví dụ thêm migration bị bỏ sót trong quá khứ. Dùng cờ này phải có lý do rõ ràng và kiểm soát thay đổi. Migration đã áp với cùng checksum thì lần sau bỏ qua, nên runner idempotent.

### Idempotency và production
Clock được truyền vào để ghi thời điểm deterministic trong test; production dùng đồng hồ tin cậy. Migration nên ngắn, transactional khi DB hỗ trợ, và không chứa logic phụ thuộc dữ liệu không kiểm soát. Với nhiều instance chạy cùng lúc, cần khóa migration table để tránh hai pod cùng áp một phiên bản. Nếu migration thất bại giữa chừng, bản ghi success false giúp lần chạy sau biết trạng thái và retry đúng chỗ.

### Cơ chế từng bước
Đi từng bước khi {{MigrationRunner.applyAll()}} được gọi với danh sách migration hỗn hợp:

1. **Phân loại**: duyệt danh sách đầu vào, tách thành hai nhóm — versioned (tên bắt đầu {{V}} + số + {{__}}) và repeatable (tên bắt đầu {{R__}}). Mỗi migration versioned được parse số phiên bản qua regex {{^V(\\d+)__}}.
2. **Sắp xếp versioned**: sắp xếp nhóm versioned theo số phiên bản tăng dần; nếu trùng version thì sắp theo tên file để đảm bảo thứ tự xác định.
3. **Sắp xếp repeatable**: sắp xếp nhóm repeatable theo tên file (alphabetical) để thứ tự chạy ổn định.
4. **Áp versioned theo thứ tự**: với mỗi migration versioned:
   - Tra {{schemaHistory}} từ cuối lên để tìm bản ghi cùng version. Nếu tìm thấy và checksum khớp → **bỏ qua** (idempotent). Nếu checksum khác → ném {{IllegalStateException("checksum mismatch ...")}}.
   - Tính {{maxApplied}} = version lớn nhất đã có trong {{schemaHistory}}.
   - Nếu {{allowOutOfOrder == false}} và version hiện tại < {{maxApplied}} → ném {{IllegalStateException("out of order ...")}}.
   - Ghi bản ghi mới vào {{schemaHistory}} với {{success=true}}, timestamp từ {{clock.millis()}}.
5. **Áp repeatable**: với mỗi migration repeatable:
   - Tra {{schemaHistory}} từ cuối lên tìm bản ghi cùng tên. Nếu tìm thấy và checksum khớp → **bỏ qua**. Nếu checksum khác → ghi bản ghi mới (chạy lại).
6. **Kết thúc**: {{schemaHistory}} chứa toàn bộ lịch sử, bao gồm cả bản ghi bị bỏ qua (không ghi) và bản ghi mới.

**Vì sao lại như vậy?** Tách versioned/repeatable rồi sắp xếp đảm bảo thứ tự bất biến bất kể thứ tự file trong filesystem. Kiểm tra checksum trước khi quyết định skip bảo vệ tính toàn vẹn: migration đã chạy trên production không được sửa lén. Out-of-order được chặn mặc định vì phá vỡ giả định "version lớn hơn = sau hơn".

### Lỗi hay gặp trên production
- **Checksum mismatch sau khi sửa file migration đã chạy**: developer sửa {{V3__add_index.sql}} trên production thay vì tạo {{V4__...}}. Lần deploy sau runner ném {{IllegalStateException}} checksum mismatch, app không lên được. Triệu chứng: log rõ "checksum mismatch V3__add_index.sql". Cách sửa: **không bao giờ sửa migration đã áp**; tạo migration mới {{V4__fix_index.sql}} để sửa.
- **Out-of-order khi thêm migration bỏ sót**: production đã chạy tới {{V10}}, team phát hiện thiếu {{V5}} và thêm file {{V5__late.sql}} vào code. Runner mặc định từ chối vì {{5 < 10}}. Triệu chứng: "out of order V5__late.sql". Cách sửa: chỉ bật {{allowOutOfOrder=true}} khi có quy trình review chặt, hoặc tạo {{V11__patch.sql}} thay vì chèn số cũ.
- **Race condition giữa nhiều instance**: hai pod K8s cùng khởi động, cùng đọc {{schemaHistory}} thấy chưa có {{V1}}, cùng chạy {{V1}} → duplicate key hoặc lock timeout. Triệu chứng: deadlock hoặc unique constraint violation trên bảng {{flyway_schema_history}}. Cách sửa: Flyway dùng advisory lock (PostgreSQL) hoặc row lock; tự viết runner cần {{SELECT ... FOR UPDATE}} hoặc lock phân tán (Redis/ZooKeeper).
- **Migration repeatable không chạy lại khi mong đợi**: view {{R__daily_summary.sql}} đổi logic nhưng quên đổi nội dung → checksum giữ nguyên, runner bỏ qua. Triệu chứng: view cũ vẫn chạy, báo cáo sai. Cách sửa: luôn đổi checksum khi sửa repeatable (thêm comment, đổi format), hoặc xóa bản ghi lịch sử repeatable đó trước khi deploy.

### Liên hệ phỏng vấn
1. **Vì sao sửa file migration đã chạy là sai? Flyway phát hiện như nào?** — Checksum của file hiện tại được so với bản ghi lịch sử. Nếu lệch, migration cũ đã chạy trên DB không còn khớp với file, nên runner báo lỗi để buộc tạo migration mới. Đây là cơ chế bảo vệ tính toàn vẹn schema.
2. **Khi nào cờ out-of-order được phép bật?** — Chỉ khi bổ sung migration bị bỏ sót có số phiên bản nhỏ hơn max đã áp (ví dụ production đang ở V10, phát hiện thiếu V5). Bật mặc định sẽ che giấu thứ tự và làm khó truy vết; cần quy trình review chặt.
3. **Phân biệt migration schema, seed data và dữ liệu tham chiếu.** — Migration schema (V/R) thay đổi cấu trúc bảng (DDL), chạy transactional, không rollback dễ. Seed data (dữ liệu khởi tạo bắt buộc) nên dùng migration versioned. Dữ liệu tham chiếu (loại tiền tệ, mã quốc gia…) dùng repeatable (R__) để có thể cập nhật lại khi checksum thay đổi.

> Senior tip: migration là phần không thể rollback dễ dàng trên production. Hãy coi mỗi file migration như một commit không thể sửa; thêm migration mới để thay đổi, và luôn có kế hoạch forward-fix thay vì downgrade thủ công.`,
    exercises: [{
      title: 'Migration runner với checksum và out-of-order',
      prompt: `Cài {{MigrationRunner}} mô phỏng Flyway với API:
- {{Migration(name, checksum)}}: name kiểu {{V1__a.sql}} hoặc {{R__sp.sql}}.
- {{MigrationRunner(List<Migration> migrations, Clock clock)}} và overload có cờ {{allowOutOfOrder}}.
- {{void applyAll()}} áp dụng migration, ghi vào {{schemaHistory}}.
- {{List<HistoryEntry> schemaHistory}} mỗi phần tử có {{version}}, {{name}}, {{checksum}}, {{success}}, {{ts}}.

Quy tắc: versioned chạy theo số thứ tự tăng dần; cùng version nhưng checksum khác thì ném {{IllegalStateException("checksum mismatch ...")}}; repeatable chỉ chạy lại khi checksum khác lần trước; nếu không cho phép out-of-order thì migration có version nhỏ hơn max đã áp sẽ bị ném {{IllegalStateException("out of order ...")}}; danh sách rỗng không làm gì.`,
      starter: `import java.time.*;
import java.util.*;

class Migration {
    final String name;
    final String checksum;
    final int version;
    final boolean repeatable;
    Migration(String name, String checksum) { throw new UnsupportedOperationException("TODO"); }
}

class HistoryEntry {
    final int version;
    final String name;
    final String checksum;
    final boolean success;
    final long ts;
    HistoryEntry(int version, String name, String checksum, boolean success, long ts) { throw new UnsupportedOperationException("TODO"); }
}

class MigrationRunner {
    List<Migration> migrations;
    final Clock clock;
    final boolean allowOutOfOrder;
    List<HistoryEntry> schemaHistory = new ArrayList<>();
    MigrationRunner(List<Migration> migrations, Clock clock) { throw new UnsupportedOperationException("TODO"); }
    MigrationRunner(List<Migration> migrations, Clock clock, boolean allowOutOfOrder) { throw new UnsupportedOperationException("TODO"); }
    void applyAll() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.time.*;
import java.util.*;
public class Main {
  static int p=0,t=0;
  static void ck(String n, Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
  public static void main(String[] x){
    ck("apply in version order", () -> {
      Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
      List<Migration> ms = new ArrayList<>();
      ms.add(new Migration("V2__b.sql","c2"));
      ms.add(new Migration("V1__a.sql","c1"));
      ms.add(new Migration("V3__c.sql","c3"));
      MigrationRunner r = new MigrationRunner(ms, clock);
      r.applyAll();
      eq(3, r.schemaHistory.size());
      eq(1, r.schemaHistory.get(0).version);
      eq(2, r.schemaHistory.get(1).version);
      eq(3, r.schemaHistory.get(2).version);
      if (!r.schemaHistory.get(0).success) throw new AssertionError("success");
      eq(clock.millis(), r.schemaHistory.get(0).ts);
    });
    ck("checksum mismatch throws", () -> {
      Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
      List<Migration> ms = new ArrayList<>();
      ms.add(new Migration("V1__a.sql","old"));
      ms.add(new Migration("V1__a.sql","new"));
      MigrationRunner r = new MigrationRunner(ms, clock);
      try { r.applyAll(); throw new AssertionError("expected"); }
      catch (IllegalStateException e) { if (!e.getMessage().contains("checksum mismatch")) throw e; }
    });
    ck("repeatable reruns on checksum change", () -> {
      Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
      MigrationRunner r = new MigrationRunner(new ArrayList<>(), clock);
      r.migrations.add(new Migration("R__sp.sql","a"));
      r.applyAll();
      eq(1, r.schemaHistory.size());
      r.migrations.clear();
      r.migrations.add(new Migration("R__sp.sql","b"));
      r.applyAll();
      eq(2, r.schemaHistory.size());
    });
    ck("repeatable skips when unchanged", () -> {
      Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
      MigrationRunner r = new MigrationRunner(new ArrayList<>(), clock);
      r.migrations.add(new Migration("R__sp.sql","a"));
      r.applyAll();
      r.migrations.clear();
      r.migrations.add(new Migration("R__sp.sql","a"));
      r.applyAll();
      eq(1, r.schemaHistory.size());
    });
    ck("out-of-order policy", () -> {
      Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
      MigrationRunner strict = new MigrationRunner(new ArrayList<>(), clock, false);
      strict.migrations.add(new Migration("V3__c.sql","c3"));
      strict.applyAll();
      strict.migrations.clear();
      strict.migrations.add(new Migration("V2__b.sql","c2"));
      try { strict.applyAll(); throw new AssertionError("expected"); }
      catch (IllegalStateException e) { if (!e.getMessage().contains("out of order")) throw e; }
      MigrationRunner loose = new MigrationRunner(new ArrayList<>(), clock, true);
      loose.schemaHistory = strict.schemaHistory;
      loose.migrations.add(new Migration("V2__b.sql","c2"));
      loose.applyAll();
      eq(2, strict.schemaHistory.size());
    });
    ck("zero migrations", () -> {
      Clock clock = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
      MigrationRunner r = new MigrationRunner(new ArrayList<>(), clock);
      r.applyAll();
      eq(0, r.schemaHistory.size());
    });
    System.out.println("RESULT "+p+"/"+t);
  }
}`,
      reference: `import java.time.*;
import java.util.*;
import java.util.regex.*;

class Migration {
    final String name;
    final String checksum;
    final int version;
    final boolean repeatable;
    Migration(String name, String checksum) {
        this.name = name;
        this.checksum = checksum;
        if (name.startsWith("R__")) {
            this.repeatable = true;
            this.version = 0;
        } else {
            this.repeatable = false;
            java.util.regex.Matcher mt = java.util.regex.Pattern.compile("^V(\\\\d+)__").matcher(name);
            if (!mt.find()) throw new IllegalArgumentException("bad migration name: " + name);
            this.version = Integer.parseInt(mt.group(1));
        }
    }
}

class HistoryEntry {
    final int version;
    final String name;
    final String checksum;
    final boolean success;
    final long ts;
    HistoryEntry(int version, String name, String checksum, boolean success, long ts) {
        this.version = version;
        this.name = name;
        this.checksum = checksum;
        this.success = success;
        this.ts = ts;
    }
}

class MigrationRunner {
    List<Migration> migrations;
    final Clock clock;
    final boolean allowOutOfOrder;
    List<HistoryEntry> schemaHistory = new ArrayList<>();
    MigrationRunner(List<Migration> migrations, Clock clock) { this(migrations, clock, false); }
    MigrationRunner(List<Migration> migrations, Clock clock, boolean allowOutOfOrder) {
        this.migrations = migrations;
        this.clock = clock;
        this.allowOutOfOrder = allowOutOfOrder;
    }
    void applyAll() {
        List<Migration> versioned = new ArrayList<>();
        List<Migration> repeatable = new ArrayList<>();
        for (Migration m : migrations) {
            if (m.repeatable) repeatable.add(m); else versioned.add(m);
        }
        versioned.sort((a, b) -> a.version != b.version ? Integer.compare(a.version, b.version) : a.name.compareTo(b.name));
        repeatable.sort((a, b) -> a.name.compareTo(b.name));
        for (Migration m : versioned) applyVersioned(m);
        for (Migration m : repeatable) applyRepeatable(m);
    }
    private void applyVersioned(Migration m) {
        HistoryEntry existing = null;
        for (int i = schemaHistory.size() - 1; i >= 0; i--) {
            if (schemaHistory.get(i).version == m.version) { existing = schemaHistory.get(i); break; }
        }
        if (existing != null) {
            if (!existing.checksum.equals(m.checksum)) throw new IllegalStateException("checksum mismatch " + m.name);
            return;
        }
        int maxApplied = 0;
        for (HistoryEntry h : schemaHistory) if (h.version > maxApplied) maxApplied = h.version;
        if (!allowOutOfOrder && m.version < maxApplied) throw new IllegalStateException("out of order " + m.name);
        schemaHistory.add(new HistoryEntry(m.version, m.name, m.checksum, true, clock.millis()));
    }
    private void applyRepeatable(Migration m) {
        HistoryEntry last = null;
        for (int i = schemaHistory.size() - 1; i >= 0; i--) {
            if (schemaHistory.get(i).name.equals(m.name)) { last = schemaHistory.get(i); break; }
        }
        if (last != null && last.checksum.equals(m.checksum)) return;
        schemaHistory.add(new HistoryEntry(0, m.name, m.checksum, true, clock.millis()));
    }
}`,
      hints: ['Dùng regex {{^V(\\\\d+)__}} để tách số phiên bản; tên bắt đầu {{R__}} là repeatable.', 'Duyệt {{schemaHistory}} từ cuối để tìm bản đã áp cùng version hoặc cùng tên.', 'Kiểm tra checksum trước khi quyết định skip; max version đã áp dùng cho quy tắc out-of-order.', 'Repeatable không có version; chỉ so checksum với lần chạy trước cùng tên.'],
      explain: `Runner mô phỏng Flyway ở mức tối giản nhưng giữ được các bất biến quan trọng. Versioned được sắp xếp trước khi áp, nên thứ tự gọi applyAll không phụ thuộc thứ tự trong list. Checksum mismatch được phát hiện bằng cách tìm bản ghi cùng version; nếu lệch, runner từ chối ngay và không ghi thêm bản ghi sai. Repeatable dùng tên làm khóa và chỉ chạy khi checksum khác, nên gọi applyAll nhiều lần không tạo hiệu ứng phụ. Out-of-order được kiểm soát bằng max version đã áp và cờ allowOutOfOrder. Clock inject giúp ts deterministic trong test; production nên dùng đồng hồ tin cậy và khóa bảng migration khi chạy nhiều instance.`,
    }],
    check: [{ q: 'Vì sao không nên sửa file migration đã áp dụng trên production?', options: ['Vì checksum sẽ lệch và runner từ chối để ngăn thay đổi lén', 'Vì Java không compile được file SQL', 'Vì migration chỉ chạy một lần trong JVM', 'Vì Flyway tự động xóa bảng lịch sử'], answer: 0, explain: `Checksum của file hiện tại được so với bản ghi lịch sử. Nếu lệch, migration cũ đã chạy trên DB không còn khớp với file, nên runner báo lỗi để buộc tạo migration mới.` }, { q: 'Khi nào cờ out-of-order nên được bật?', options: ['Khi thêm migration bị bỏ sót có số phiên bản nhỏ hơn max đã áp', 'Mọi trường hợp để đơn giản', 'Khi checksum thay đổi', 'Khi chạy trên môi trường dev'], answer: 0, explain: `out-of-order cho phép áp migration có version nhỏ hơn max đã áp trong trường hợp đặc biệt như bổ sung migration bị bỏ sót. Bật mặc định sẽ che giấu thứ tự và làm khó truy vết.` }, { q: 'Repeatable migration chạy lại trong trường hợp nào?', options: ['Khi checksum khác lần trước', 'Mỗi lần applyAll', 'Khi version tăng', 'Khi bảng lịch sử rỗng'], answer: 0, explain: `Repeatable không có version; checksum là tiêu chí duy nhất. Nếu checksum giữ nguyên, runner bỏ qua để tránh chạy lại view hoặc procedure không cần thiết.` }, { q: 'Hai pod K8s cùng khởi động, cùng áp migration V1 lần đầu. Vấn đề gì xảy ra và cách phòng?', options: ['Không có vấn đề, Flyway tự xử lý song song', 'Race condition: cả hai cùng insert vào flyway_schema_history → duplicate key hoặc deadlock; cần advisory lock hoặc lock phân tán', 'Migration V1 chỉ chạy một lần nhờ idempotency', 'Pod thứ hai sẽ đợi pod đầu xong nhờ checkpoint'], answer: 1, explain: `Flyway dùng advisory lock (PostgreSQL) hoặc row lock trên bảng lịch sử để serialize việc áp migration. Tự viết runner cần SELECT ... FOR UPDATE hoặc lock phân tán (Redis/ZooKeeper). Idempotency chỉ giúp khi chạy lại lần sau, không giải quyết race lúc chạy cùng lúc.` }],
      related: ['spring-001', 'spring-002'], tags: ['Flyway', 'migration', 'checksum', 'schema history', 'out-of-order']
    },
  {
    id: 'lesson-spring-007', track: 'spring', order: 7,
    title: 'Mapper JSON kiểu Jackson: reflection, annotation và chế độ strict chống mất field im lặng', level: 'senior', minutes: 50,
    goals: ['Dùng reflection để serialize object theo annotation', 'Hiểu quy tắc visibility: vì sao field private không getter, không annotation bị bỏ qua im lặng', 'Tự viết chế độ strict để phát hiện field bị bỏ sót, và biết các cờ tương ứng của Jackson thật'],
    body: `**Tóm tắt:** Jackson dùng reflection để tìm các "property" của object (field public, getter public, hoặc thứ có {{@JsonProperty}}) và annotation để quyết định tên JSON. Field private không có getter và không có annotation thì **bị bỏ qua im lặng** — JSON thiếu dữ liệu mà không có lỗi nào. Bài này tự viết một mapper nhỏ để hiểu cơ chế, kèm một chế độ strict biến việc bỏ sót đó thành exception.

### Reflection và annotation runtime
Annotation chỉ đọc được lúc runtime qua reflection nếu khai báo {{@Retention(RetentionPolicy.RUNTIME)}} (mặc định là {{CLASS}}: có trong file .class nhưng reflection không thấy). {{@Target(ElementType.FIELD)}} chỉ giới hạn chỗ được gắn annotation. Mapper duyệt {{getDeclaredFields()}}, đọc {{@JsonProperty}} và {{@JsonIgnore}}, rồi {{setAccessible(true)}} để đọc được cả field không public.

Lưu ý: Javadoc của {{getDeclaredFields()}} nói rõ mảng trả về **không theo thứ tự nào cụ thể**. Trên HotSpot thực tế nó theo thứ tự khai báo (bài tập dựa vào điều này), nhưng code production cần thứ tự cố định thì phải tự sắp xếp — Jackson có {{@JsonPropertyOrder}} cho việc này.

### Jackson thật quyết định property thế nào?
Mặc định (visibility mặc định của {{ObjectMapper}}):

| Thành phần | Được nhận là property khi |
|---|---|
| Field | là **public**, hoặc có {{@JsonProperty}} |
| Getter {{getX()}} / {{isX()}} | là **public** |
| Bất kỳ | có {{@JsonIgnore}} thì bị loại |

Ví dụ: {{private String nick;}} **có** {{public String getNick()}} → vẫn được serialize qua getter. Nhưng {{private String nick;}} không getter, không annotation → biến mất khỏi JSON mà không ai hay. Đó là lỗi hay gặp khi dùng Lombok mà quên {{@Getter}}, hoặc khi đổi tên getter.

### Quy tắc của mapper trong bài tập
Đơn giản hoá: chỉ xét field. Có {{@JsonProperty("name")}} thì dùng tên đó. Không annotation nhưng field public thì dùng tên field. Không annotation và field không public thì bỏ qua im lặng (giống Jackson khi không có getter). {{@JsonIgnore}} luôn thắng: bỏ qua an toàn hơn lỡ serialize dữ liệu nhạy cảm như số CCCD, mật khẩu.

### Chế độ strict
Jackson **không** có cờ nào tên "FAIL_ON_MISSING". Các cờ gần nhất:
- {{DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES}} (mặc định bật): khi **đọc** JSON có field lạ thì ném lỗi — Jackson bật mặc định; Spring Boot **giữ** mặc định này (có thể tắt qua {{spring.jackson.deserialization.fail-on-unknown-properties=false}}).
- {{SerializationFeature.FAIL_ON_EMPTY_BEANS}} (mặc định bật): khi **ghi** một object không có property nào thì ném lỗi thay vì trả về một object JSON rỗng.

Chế độ strict của bài tập là một kiểm tra tự viết: không đổi output khi mọi field đều hợp lệ, nhưng gặp field không public mà không annotation thì ném exception — buộc developer quyết định rõ: đánh {{@JsonProperty}} hay {{@JsonIgnore}}.

### Giá trị và object rỗng
String phải escape dấu nháy kép, backslash và ký tự điều khiển (xuống dòng, tab). Số và boolean ghi trực tiếp. Null ghi thành null. Object lồng nhau serialize đệ quy, nhưng phải chống vòng tham chiếu (A trỏ B, B trỏ A) — Jackson có {{@JsonManagedReference}}/{{@JsonBackReference}} hoặc {{@JsonIdentityInfo}}. Mapper của bài trả object JSON rỗng (cặp ngoặc nhọn mở rồi đóng) cho object không có field hợp lệ (khác mặc định của Jackson nói ở trên).

### Pitfall production
- Field bị bỏ im lặng: API trả thiếu dữ liệu, client hiển thị trống, không có log lỗi nào.
- Reflection tốn chi phí: cache metadata theo class (Jackson cache serializer cho từng class).
- {{setAccessible(true)}} bị chặn bởi module system (Java 16+ mặc định đóng các package nội bộ của JDK) với class nằm trong module không {{opens}} package cho mapper.
- Tự nối chuỗi JSON mà không escape: dữ liệu người dùng chứa dấu nháy kép làm vỡ JSON hoặc chèn thêm field (JSON injection).

### Liên hệ phỏng vấn
Hãy mô tả cách Jackson tìm property (field public, getter public, annotation), vì sao bỏ sót im lặng nguy hiểm, và cách phòng: test snapshot JSON, chú ý Lombok/getter, các cờ {{FAIL_ON_UNKNOWN_PROPERTIES}} / {{FAIL_ON_EMPTY_BEANS}}. Nêu trade-off giữa reflection (linh hoạt, chậm lúc khởi động) và sinh code lúc compile (nhanh, ít "phép màu" hơn).

> Senior tip: Trong API contract, thiếu field thường nghiêm trọng hơn thừa field. Hãy có test snapshot JSON và bật strict validation trong môi trường dev/test để phát hiện regression sớm.`,
    exercises: [{
      title: 'SimpleJsonMapper với @JsonProperty và strict mode',
      prompt: `Cài {{SimpleJsonMapper}} dùng reflection và annotation tự định nghĩa:
- {{@JsonProperty("name")}} đặt tên JSON.
- {{@JsonIgnore}} luôn bỏ qua.
- Field không public và không có {{@JsonProperty}} bị bỏ qua im lặng ở chế độ thường; gọi {{strict(true)}} làm mapper ném {{IllegalStateException}} khi gặp field như vậy.
- {{String toJson(Object value)}} serialize object thành JSON.

Objects mẫu: class {{User}} với các field {{long id}}, {{@JsonProperty("full_name") String name}}, {{@JsonIgnore String ssn}} và {{String nick}}. Ở chế độ thường chỉ {{full_name}} xuất hiện; ở strict thì ném lỗi vì {{id}} và {{nick}}.`,
      starter: `import java.lang.annotation.*;
import java.lang.reflect.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface JsonProperty { String value(); }

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface JsonIgnore {}

class User {
    long id;
    @JsonProperty("full_name") String name;
    @JsonIgnore String ssn;
    String nick;
}

class SimpleJsonMapper {
    SimpleJsonMapper strict(boolean strict) { throw new UnsupportedOperationException("TODO"); }
    String toJson(Object value) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.lang.annotation.*;
import java.lang.reflect.*;
import java.util.*;
public class Main {
  static int p=0,t=0;
  static void ck(String n, Runnable r){t++;try{r.run();p++;System.out.println("PASS "+n);}catch(Throwable e){System.out.println("FAIL "+n+": "+e);}}
  static void eq(Object a,Object b){if(!Objects.equals(a,b))throw new AssertionError(a+" != "+b);}
  public static void main(String[] x){
    class Safe { @JsonProperty("id") long id; @JsonProperty("name") String name; }
    class Mixed { public int count; @JsonProperty("label") String title; }
    class Empty {}
    ck("annotation name is used", () -> {
      User u = new User(); u.id=1; u.name="Alice"; u.ssn="secret"; u.nick="bob";
      String json = new SimpleJsonMapper().toJson(u);
      if (!json.equals("{\\"full_name\\":\\"Alice\\"}")) throw new AssertionError(json);
    });
    ck("ssn is ignored", () -> {
      User u = new User(); u.id=1; u.name="Alice"; u.ssn="secret"; u.nick="bob";
      String json = new SimpleJsonMapper().toJson(u);
      if (json.contains("ssn") || json.contains("secret")) throw new AssertionError(json);
    });
    ck("nick is dropped in lenient mode", () -> {
      User u = new User(); u.id=1; u.name="Alice"; u.ssn="secret"; u.nick="bob";
      String json = new SimpleJsonMapper().toJson(u);
      if (json.contains("nick") || json.contains("bob")) throw new AssertionError(json);
    });
    ck("strict throws on non-public unannotated field", () -> {
      User u = new User(); u.id=1; u.name="Alice"; u.ssn="secret"; u.nick="bob";
      SimpleJsonMapper m = new SimpleJsonMapper().strict(true);
      try { m.toJson(u); throw new AssertionError("expected throw"); }
      catch (RuntimeException e) { }
    });
    ck("strict does not throw for annotated fields", () -> {
      Safe s = new Safe(); s.id=2; s.name="Bob";
      String json = new SimpleJsonMapper().strict(true).toJson(s);
      if (!json.equals("{\\"id\\":2,\\"name\\":\\"Bob\\"}")) throw new AssertionError(json);
    });
    ck("renaming and keeping names", () -> {
      Mixed mx = new Mixed(); mx.count=5; mx.title="x";
      String json = new SimpleJsonMapper().toJson(mx);
      if (!json.equals("{\\"count\\":5,\\"label\\":\\"x\\"}")) throw new AssertionError(json);
    });
    ck("empty object serializes to {}", () -> {
      String json = new SimpleJsonMapper().toJson(new Empty());
      if (!json.equals("{}")) throw new AssertionError(json);
    });
    System.out.println("RESULT "+p+"/"+t);
  }
}`,
      reference: `import java.lang.annotation.*;
import java.lang.reflect.*;

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface JsonProperty { String value(); }

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.FIELD)
@interface JsonIgnore {}

class User {
    long id;
    @JsonProperty("full_name") String name;
    @JsonIgnore String ssn;
    String nick;
}

class SimpleJsonMapper {
    private boolean strict;
    SimpleJsonMapper strict(boolean strict) { this.strict = strict; return this; }
    String toJson(Object value) {
        if (value == null) return "null";
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (java.lang.reflect.Field f : value.getClass().getDeclaredFields()) {
            int mod = f.getModifiers();
            if (java.lang.reflect.Modifier.isStatic(mod) || java.lang.reflect.Modifier.isTransient(mod)) continue;
            if (f.getAnnotation(JsonIgnore.class) != null) continue;
            JsonProperty prop = f.getAnnotation(JsonProperty.class);
            String name;
            boolean annotated = prop != null;
            if (annotated) name = prop.value();
            else if (java.lang.reflect.Modifier.isPublic(mod)) name = f.getName();
            else {
                if (strict) throw new IllegalStateException("non-public field without @JsonProperty: " + f.getName());
                continue;
            }
            f.setAccessible(true);
            Object v;
            try { v = f.get(value); }
            catch (IllegalAccessException e) { throw new RuntimeException(e); }
            if (!first) sb.append(",");
            first = false;
            sb.append("\\"").append(escape(name)).append("\\":");
            sb.append(toJsonValue(v));
        }
        sb.append("}");
        return sb.toString();
    }
    private String toJsonValue(Object v) {
        if (v == null) return "null";
        if (v instanceof String) return "\\"" + escape((String) v) + "\\"";
        if (v instanceof Character) return "\\"" + escape(String.valueOf(v)) + "\\"";
        if (v instanceof Boolean || v instanceof Number) return String.valueOf(v);
        if (v.getClass().isArray()) {
            StringBuilder sb = new StringBuilder("[");
            int len = java.lang.reflect.Array.getLength(v);
            for (int i = 0; i < len; i++) {
                if (i > 0) sb.append(",");
                sb.append(toJsonValue(java.lang.reflect.Array.get(v, i)));
            }
            sb.append("]");
            return sb.toString();
        }
        return toJson(v);
    }
    private String escape(String s) {
        return s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"").replace("\\n", "\\\\n").replace("\\r", "\\\\r").replace("\\t", "\\\\t");
    }
}`,
      hints: ['Dùng {{getDeclaredFields()}} và {{getAnnotation(...)}} để đọc metadata runtime.', '{{JsonIgnore}} được kiểm tra trước {{JsonProperty}}.', 'Field public không annotation vẫn được include theo tên field.', 'strict chỉ kiểm tra trước khi append, không đổi output của object hợp lệ.'],
      explain: `Mapper mô phỏng ý tưởng cốt lõi của Jackson: annotation quyết định tên, reflection đọc giá trị, và chế độ strict (tự viết, Jackson không có cờ này) phát hiện field bị drop. Ở chế độ thường, field non-public không annotation bị bỏ qua im lặng, nên output của User chỉ còn {{full_name}}. Ở strict, mapper ném exception ngay khi gặp {{id}} hoặc {{nick}}, giúp test phát hiện regression. {{JsonIgnore}} luôn thắng để tránh serialize dữ liệu nhạy cảm. Escape đúng là bắt buộc để không tạo JSON injection. Trong production, nên cache metadata per class và cân nhắc code generation để giảm chi phí reflection.`,
    }],
    check: [{ q: 'Vì sao field {{long id;}} trong User bị bỏ qua ở chế độ thường?', options: ['Vì không public và không có @JsonProperty', 'Vì kiểu long không serialize được', 'Vì @JsonIgnore áp dụng cho cả class', 'Vì mapper chỉ đọc getter'], answer: 0, explain: `Mapper chỉ include field public hoặc có @JsonProperty; id là package-private và không annotation nên bị drop im lặng — đúng loại bug strict mode sinh ra để bắt. Kiểu long serialize bình thường (số). @JsonIgnore chỉ gắn trên field ssn, không áp cho cả class. Mapper của bài không đọc getter; và User cũng không có getter nào.` }, { q: 'Chế độ strict thay đổi điều gì?', options: ['Biến field bị drop thành exception, output hợp lệ không đổi', 'Tự động thêm getter', 'Bỏ qua @JsonIgnore', 'Sắp xếp field theo tên'], answer: 0, explain: `strict không thay đổi JSON của object hợp lệ; nó chỉ kiểm tra và ném exception khi gặp field không public mà không annotation. Nó không sinh code hay getter. @JsonIgnore vẫn được tôn trọng (field bị ignore không làm strict ném lỗi). Thứ tự field giữ nguyên như khai báo.` }, { q: 'Với ObjectMapper mặc định của Jackson, class có {{private String nick;}} và {{public String getNick()}}. Khi serialize, nick có xuất hiện không?', options: ['Có, vì getter public được nhận là property', 'Không, vì field private luôn bị bỏ qua', 'Chỉ khi thêm @JsonProperty lên field', 'Chỉ khi bật FAIL_ON_EMPTY_BEANS'], answer: 0, explain: `Jackson tìm property từ field public, getter public và annotation; getNick() public nên nick được serialize qua getter dù field private. "Field private luôn bị bỏ qua" sai vì bỏ qua field không có nghĩa là bỏ qua property — getter vẫn mang nó ra. @JsonProperty là cách khác để lộ field, không bắt buộc ở đây. FAIL_ON_EMPTY_BEANS chỉ quyết định có ném lỗi khi object không có property nào.` }],
      related: ['spring-005', 'spring-006'], tags: ['Jackson', 'reflection', 'annotation', 'JSON', 'visibility']
  },
  {
    id: 'lesson-spring-008', track: 'spring', order: 8,
    title: 'Auto-configuration và @Conditional: vì sao bean mặc định nhường bean của bạn', level: 'senior', minutes: 45,
    goals: ['Mô tả cách @Conditional lọc bean definition lúc khởi động', 'Giải thích vì sao bean tự khai báo thắng bean mặc định của Boot', 'Đọc CONDITIONS EVALUATION REPORT để tìm điều kiện đã chặn bean', 'Viết một auto-configuration có điều kiện OnClass/OnProperty/OnMissingBean'],
    body: `**Tóm tắt:** Auto-configuration là cách Spring Boot **tự đăng ký bean hộ bạn** khi hội đủ điều kiện: class cần thiết có trên classpath, property được bật, và chưa có bean cùng loại. Mỗi điều kiện là một {{@Conditional...}} được đánh giá **một lần lúc khởi động**, lúc container mới đọc *bean definition* (bản mô tả bean: tên, kiểu, cách tạo) chứ chưa tạo instance. Bean bạn tự khai báo luôn thắng bean mặc định, vì definition của bạn được ghi vào container **trước** khi Boot chạy các lớp auto-configuration, nên {{@ConditionalOnMissingBean}} đã thấy bean của bạn và điều kiện "missing" thất bại.

### Vấn đề auto-configuration giải quyết
Trước Spring Boot, dựng một app web có JPA + JSON + connection pool nghĩa là viết hàng chục dòng cấu hình tay: khai báo {{DataSource}}, {{PlatformTransactionManager}}, {{ObjectMapper}}, đăng ký filter, map error page… Boot đảo bài toán: bạn chỉ khai **ý định** bằng cách thêm dependency ({{spring-boot-starter-data-jpa}}), còn việc **nối các bean với nhau** do các lớp {{*AutoConfiguration}} trong jar {{spring-boot-autoconfigure}} lo. Câu chốt của cơ chế: "nếu class cần thiết có trên classpath và người dùng chưa tự định nghĩa bean, hãy tạo giúp họ một bean có cấu hình hợp lý".
Hai từ khoá dùng suốt bài: **starter** = gói dependency gom sẵn cho một tính năng (kèm mọi jar nó cần); **classpath** = tập jar mà JVM nhìn thấy lúc chạy. Class không có trên classpath thì lệnh nạp class bằng {{Class.forName}} sẽ ném {{ClassNotFoundException}} — và đó đúng là cách Boot "thấy" hay "không thấy" một công nghệ để quyết định có cấu hình nó hay không.

### @Conditional: bộ lọc chạy lúc đăng ký definition
{{@Conditional}} nhận một class triển khai interface {{Condition}}, chỉ có một method là {{matches(context, metadata)}}, trả về true/false và **kèm lý do** ghi vào báo cáo. Đây là điểm quan trọng: điều kiện là một **câu hỏi boolean**, nó chạy lúc Spring đọc annotation, tức là **trước khi bean nào được tạo**. Bốn điều kiện hay gặp nhất:

| Điều kiện | Đọc từ đâu | Dùng để làm gì |
|---|---|---|
| {{@ConditionalOnClass(name = "org.h2.Driver")}} | classpath (thử load class) | chỉ cấu hình khi có jar cần thiết |
| {{@ConditionalOnMissingBean(DataSource.class)}} | danh sách bean definition đã có | chừa đường cho user tự định nghĩa |
| {{@ConditionalOnProperty(prefix = "app.mail", name = "host")}} | Environment (application.yml, biến môi trường) | bật tính năng theo cấu hình |
| {{@ConditionalOnWebApplication}} | kiểu ứng dụng đang chạy | chỉ tạo filter/handler khi app là web |

Quy tắc của {{@ConditionalOnProperty}} — hay bị hỏi và hay bị hiểu sai:
- Chỉ có {{name}}, không có {{havingValue}}: khớp khi property **tồn tại** và giá trị **khác** "false" (không phân biệt hoa thường). Property vắng mặt = **không** khớp.
- Có {{havingValue = "kafka"}}: chỉ khớp khi giá trị property bằng đúng chuỗi đó (phân biệt hoa thường).
- Có {{matchIfMissing = true}}: property vắng mặt được coi là khớp — biến tính năng thành mặc định **bật**.

> Lưu ý: property được đọc qua *relaxed binding*, nên {{app.id-strategy}}, {{app.idStrategy}} và biến môi trường {{APP_ID_STRATEGY}} cùng trỏ về một thuộc tính. Điều kiện chỉ thấy giá trị **có lúc khởi động**: đổi config trên server rồi hot-reload không làm bean xuất hiện hay biến mất.

### Thứ tự đăng ký: vì sao bean của bạn thắng
~~~seq
title: Thu tu dang ky bean luc khoi dong
actors: App | UserConfig | BootJar | CondEval | BeanFactory
App -> UserConfig: component scan nang @Service va @Bean cua ban
UserConfig -> BeanFactory: dang ky definition cua ban (buoc 1)
App -> BootJar: EnableAutoConfiguration doc file AutoConfiguration.imports
BootJar -> CondEval: do @ConditionalOnClass tung auto-config
BootJar -> BeanFactory: dang ky definition mac dinh (buoc 2)
BeanFactory -> CondEval: @ConditionalOnMissingBean da thay bean cua ban
CondEval --> BootJar: khong khop -> bo bean mac dinh
note App..BeanFactory: dieu kien danh tren definition, chua tao instance
~~~

{{@SpringBootApplication}} chứa {{@EnableAutoConfiguration}}; annotation này gắn {{AutoConfigurationImportSelector}}, một class đọc toàn bộ tên lớp auto-config từ file {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, loại những lớp bị {{@Conditional}} chặn, sắp thứ tự rồi submit các lớp còn lại sang container. Vì cấu hình của bạn được xử lý ở pha "user configuration" — trước pha auto-configuration — nên lúc {{@ConditionalOnMissingBean}} chạy, bean của bạn đã nằm trong danh sách definition. Hai hệ quả:
1. Bạn **không** cần {{@Primary}} và cũng không cần bật {{spring.main.allow-bean-definition-overriding}} để thắng một bean mặc định: chỉ cần khai báo bean đúng **kiểu** (hoặc đúng tên) mà auto-config định tạo.
2. Ngược lại, {{@ConditionalOnBean}} / {{@ConditionalOnMissingBean}} đặt trong config **của riêng bạn** thì mong manh, vì nó chỉ thấy những definition đã được đăng ký **tính tới thời điểm đánh giá**. Tài liệu Boot vì thế khuyên chỉ dùng cặp điều kiện này trong lớp auto-config, kèm {{@AutoConfigureAfter}} để chốt thứ tự.

### Ví dụ: auto-configuration của một starter nội bộ
~~~java
@AutoConfiguration                                // Boot 3: thay cho @Configuration(proxyBeanMethods = false) khai tay
@ConditionalOnClass(MailerClient.class)           // không có jar mailer -> cả lớp này bị bỏ qua
public class MailerAutoConfiguration {
    @Bean
    @ConditionalOnProperty(prefix = "app.mail", name = "enabled")  // phải bật rõ ràng
    @ConditionalOnMissingBean                     // user đã tự có Mailer? -> nhường
    Mailer mailer(MailerProperties props) {       // props bind từ app.mail.*
        return new SmtpMailer(props.getHost(), props.getPort());
    }
}
~~~
Không có dòng đăng ký dưới đây thì class trên chỉ là code chết, không ai nạp:
~~~text
src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
    com.acme.mailer.MailerAutoConfiguration
~~~
(Trước Boot 2.7 đăng ký bằng key {{EnableAutoConfiguration}} trong {{META-INF/spring.factories}}; từ Boot 3 dùng file {{.imports}}.)

### Đọc báo cáo --debug
Chạy {{java -jar app.jar --debug}} (hoặc {{--logging.level.org.springframework.boot.autoconfigure=DEBUG}}) sẽ in ra báo cáo liệt kê **từng** auto-config và **từng** điều kiện, kể cả lý do thất bại:
~~~text
============================
CONDITIONS EVALUATION REPORT
============================

Positive matches:
-----------------
   MailerAutoConfiguration matched:
      - @ConditionalOnClass found required class 'com.acme.mailer.MailerClient' (OnClassCondition)
   MailerAutoConfiguration#mailer matched:
      - @ConditionalOnProperty (app.mail.enabled) matched (OnPropertyCondition)
      - @ConditionalOnMissingBean (types: com.acme.mailer.Mailer; SearchStrategy: all) did not find any beans

Negative matches:
-----------------
   DataSourceAutoConfiguration#dataSource:
      - @ConditionalOnMissingBean (types: javax.sql.DataSource; SearchStrategy: all) found bean 'myDataSource'

Exclusions:
-----------
    None
~~~
"Positive matches" = lớp/bean được nạp kèm lý do khớp; "Negative matches" = bị chặn, ghi rõ **điều kiện nào** và **thấy gì**. Báo cáo ghi theo từng method, nên bạn biết chính xác bean nào trong một lớp config bị loại chứ không chỉ "cả lớp". Cùng nội dung đó có ở endpoint {{/actuator/conditions}} của Actuator — endpoint đã bật sẵn nhưng chưa được expose qua HTTP, phải thêm {{management.endpoints.web.exposure.include=conditions}}; đọc từ endpoint tiện hơn vì không cần khởi động lại app. Muốn loại hẳn một auto-config: khai {{spring.autoconfigure.exclude}} trong yml hoặc {{@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)}}.

### Bẫy production
- **Một typo property làm bean biến mất trong im lặng.** {{app.mail.enabled: FALSE}} thì còn hiểu được, nhưng {{app.mail.enable: true}} thì không: property "không tồn tại" nên điều kiện fail, app vẫn khởi động OK và lỗi chỉ lộ ra khi có request gọi tới bean đó. Phòng: bind cấu hình bằng {{@ConfigurationProperties}} + {{@Validated}} để thiếu/sai tên là fail ngay lúc khởi động, thay vì đọc property rời rạc bằng {{@Value}} ở mười chỗ khác nhau.
- **{{@ConditionalOnMissingBean}} xét theo kiểu trả về của method** và dùng quan hệ "có thể gán", nên bean của bạn là **subclass** của kiểu đó cũng làm auto-config nhường. Ngược lại, nếu bean của bạn **khác kiểu mà trùng tên** với bean mặc định thì đó là bean definition trùng tên: Boot 2+ mặc định cấm ghi đè và ném {{BeanDefinitionOverrideException}} ngay lúc khởi động.
- **Điều kiện chỉ chạy một lần.** "Tôi đổi property rồi mà bean không xuất hiện" là hành vi đúng, không phải bug — phải khởi động lại context.
- **Cần bean do auto-config khác tạo** thì phải khai {{@AutoConfigureBefore}}/{{@AutoConfigureAfter}}; nếu không, Boot sắp thứ tự mặc định gần như theo tên class và thứ tự đó có thể đổi khi nâng cấp phiên bản.
- **Test auto-config** nên dùng {{ApplicationContextRunner}} thay vì {{@SpringBootTest}}: chạy nhanh và assert được chính xác hai nhánh "user tự định nghĩa bean thì auto-config phải nhường" và "user không định nghĩa thì bean mặc định phải có".

### Liên hệ phỏng vấn
Khung trả lời: (1) auto-config là các lớp {{@Configuration}} nạp từ file {{.imports}} và lọc bằng {{@Conditional}}; (2) điều kiện đánh giá trên bean definition lúc khởi động, không trên instance; (3) bean của bạn thắng vì nó được đăng ký trước, {{@ConditionalOnMissingBean}} thấy nên nhường; (4) khi bean "mất", bật {{--debug}} hoặc {{/actuator/conditions}} đọc negative match thay vì đoán. Nếu bị hỏi "viết starter nội bộ thế nào", nhấn mạnh: mọi bean phải có {{@ConditionalOnMissingBean}}, property phải có mặc định hợp lý, và phải có test cho cả hai nhánh.

> Senior tip: Hãy coi auto-configuration của starter nội bộ là **API công khai**. Một lần quên {{@ConditionalOnMissingBean}} khiến cả công ty không override được và phải fork starter. Ngược lại, khi tiếp nhận code người khác, đừng vội kết luận "Bean X không được tạo" — chạy một lần với {{--debug}} thường tiết kiệm nửa ngày debug, và nên bật báo cáo điều kiện ở môi trường staging.`,
    exercises: [{
      title: 'Mini auto-config container với điều kiện OnProperty và OnMissingBean',
      prompt: `Hoàn thiện {{AutoConfig}} — một auto-configuration container tí hon mô phỏng {{@ConditionalOnProperty}} và {{@ConditionalOnMissingBean}} của Spring Boot. Lớp {{Cond}} và ba nhà máy điều kiện đã có sẵn, bạn chỉ viết ba method:
- {{register(bean, conds)}}: ghi lại tên bean cùng mảng điều kiện **theo đúng thứ tự đăng ký** (mỗi lần register giống một method {{@Bean}} trong lớp auto-config). Không có điều kiện nào thì luôn được chấp nhận.
- {{resolve(props, userBeans)}}: trả về danh sách tên bean cuối cùng có trong container. Danh sách **bắt đầu bằng toàn bộ userBeans theo đúng thứ tự được truyền vào** (đây là "bean của người dùng", đăng ký trước auto-config). Sau đó duyệt từng spec **theo thứ tự đã đăng ký**: nếu **mọi** điều kiện của spec đều thoả thì thêm tên bean của spec vào cuối danh sách.
  - {{onProperty(key)}} thoả khi {{props}} chứa key và giá trị **không phải** "false" (bỏ qua hoa thường).
  - {{onPropertyValue(key, value)}} thoả khi {{props}} chứa key và giá trị bằng đúng {{value}} (phân biệt hoa thường).
  - {{onMissingBean(name)}} thoả khi tên {{name}} **chưa** xuất hiện trong danh sách bean đã đăng ký **tính tới lúc đó**, gồm bean của người dùng và bean của các spec đã được chấp nhận trước nó.
- Mỗi spec, dù được chấp nhận hay bị bỏ, đều ghi một dòng vào báo cáo: {{REGISTERED ten}} hoặc {{SKIPPED ten MA_LOI}}. {{MA_LOI}} là lý do của điều kiện **thất bại đầu tiên** trong mảng điều kiện, lấy theo bảng: thiếu property → {{NO_PROPERTY}}; property có nhưng giá trị là false → {{PROPERTY_FALSE}}; giá trị khác với value mong muốn → {{VALUE_MISMATCH}}; bean đã tồn tại → {{ALREADY_PRESENT}}. Riêng {{onPropertyValue}} mà property vắng mặt thì vẫn báo {{NO_PROPERTY}}.
- {{report()}}: trả báo cáo của **lần resolve gần nhất** — ghi đè mỗi lần gọi resolve, không cộng dồn, và là danh sách rỗng nếu chưa resolve lần nào.`,
      starter: `
class AutoConfig {
    static final class Cond {
        final String kind, key, value;
        private Cond(String kind, String key, String value) { this.kind = kind; this.key = key; this.value = value; }
        static Cond onProperty(String key) { return new Cond("PROPERTY", key, ""); }
        static Cond onPropertyValue(String key, String value) { return new Cond("PROPERTY_VALUE", key, value); }
        static Cond onMissingBean(String bean) { return new Cond("MISSING_BEAN", bean, ""); }
    }
    private final List<String> beans = new ArrayList<>();
    private final List<List<Cond>> specs = new ArrayList<>();
    private List<String> lastReport = new ArrayList<>();
    void register(String bean, Cond... conds) { throw new UnsupportedOperationException("TODO"); }
    List<String> resolve(Map<String, String> props, List<String> userBeans) { throw new UnsupportedOperationException("TODO"); }
    List<String> report() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed=0, total=0;
 static void check(String n, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch (Throwable t) { System.out.println("FAIL " + n + ": " + t); } }
 static void eq(Object got, Object want) { if (!Objects.equals(got, want)) throw new AssertionError("got " + got + " want " + want); }
 static AutoConfig one(String bean, AutoConfig.Cond... cs) { AutoConfig a = new AutoConfig(); a.register(bean, cs); return a; }
 public static void main(String[] x) {
  check("property present registers the bean", () -> {
    AutoConfig a = one("h2Console", AutoConfig.Cond.onProperty("spring.h2.console.enabled"));
    eq(a.resolve(Map.of("spring.h2.console.enabled", "true"), List.of()), List.of("h2Console"));
    eq(a.report(), List.of("REGISTERED h2Console"));
  });
  check("property absent reports NO_PROPERTY", () -> {
    AutoConfig a = one("h2Console", AutoConfig.Cond.onProperty("spring.h2.console.enabled"));
    eq(a.resolve(Map.of(), List.of()), List.of());
    eq(a.report(), List.of("SKIPPED h2Console NO_PROPERTY"));
  });
  check("property false differs from absent property", () -> {
    AutoConfig a = one("h2Console", AutoConfig.Cond.onProperty("spring.h2.console.enabled"));
    eq(a.resolve(Map.of("spring.h2.console.enabled", "false"), List.of()), List.of());
    eq(a.report(), List.of("SKIPPED h2Console PROPERTY_FALSE"));
  });
  check("FALSE in any case is PROPERTY_FALSE", () -> {
    AutoConfig a = one("h2Console", AutoConfig.Cond.onProperty("spring.h2.console.enabled"));
    eq(a.resolve(Map.of("spring.h2.console.enabled", "FALSE"), List.of()), List.of());
    eq(a.report(), List.of("SKIPPED h2Console PROPERTY_FALSE"));
  });
  check("spec without conditions is unconditional", () -> {
    AutoConfig a = one("jsonMapper");
    eq(a.resolve(Map.of(), List.of()), List.of("jsonMapper"));
    eq(a.report(), List.of("REGISTERED jsonMapper"));
  });
  check("havingValue compares the value exactly", () -> {
    AutoConfig a = one("uuidId", AutoConfig.Cond.onPropertyValue("app.id-strategy", "uuid"));
    eq(a.resolve(Map.of("app.id-strategy", "uuid"), List.of()), List.of("uuidId"));
    AutoConfig b = one("uuidId", AutoConfig.Cond.onPropertyValue("app.id-strategy", "uuid"));
    eq(b.resolve(Map.of("app.id-strategy", "sequence"), List.of()), List.of());
    eq(b.report(), List.of("SKIPPED uuidId VALUE_MISMATCH"));
    AutoConfig c = one("uuidId", AutoConfig.Cond.onPropertyValue("app.id-strategy", "uuid"));
    eq(c.resolve(Map.of("app.id-strategy", "UUID"), List.of()), List.of());
    eq(c.report(), List.of("SKIPPED uuidId VALUE_MISMATCH"));
  });
  check("havingValue with missing property reports NO_PROPERTY", () -> {
    AutoConfig a = one("uuidId", AutoConfig.Cond.onPropertyValue("app.id-strategy", "uuid"));
    eq(a.resolve(Map.of(), List.of()), List.of());
    eq(a.report(), List.of("SKIPPED uuidId NO_PROPERTY"));
  });
  check("user bean blocks the default bean", () -> {
    AutoConfig a = one("mailSender", AutoConfig.Cond.onProperty("app.mail.host"), AutoConfig.Cond.onMissingBean("mailSender"));
    eq(a.resolve(Map.of("app.mail.host", "smtp.acme.com"), List.of("mailSender")), List.of("mailSender"));
    eq(a.report(), List.of("SKIPPED mailSender ALREADY_PRESENT"));
  });
  check("default bean applies when user defines nothing", () -> {
    AutoConfig a = one("mailSender", AutoConfig.Cond.onProperty("app.mail.host"), AutoConfig.Cond.onMissingBean("mailSender"));
    eq(a.resolve(Map.of("app.mail.host", "smtp.acme.com"), List.of()), List.of("mailSender"));
    eq(a.report(), List.of("REGISTERED mailSender"));
  });
  check("first failing condition is the reported reason", () -> {
    AutoConfig a = one("cache", AutoConfig.Cond.onMissingBean("cache"), AutoConfig.Cond.onProperty("app.cache.redis"));
    eq(a.resolve(Map.of(), List.of("cache")), List.of("cache"));
    eq(a.report(), List.of("SKIPPED cache ALREADY_PRESENT"));
    AutoConfig b = one("cache", AutoConfig.Cond.onProperty("app.cache.redis"), AutoConfig.Cond.onMissingBean("cache"));
    eq(b.resolve(Map.of(), List.of("cache")), List.of("cache"));
    eq(b.report(), List.of("SKIPPED cache NO_PROPERTY"));
  });
  check("earlier auto-config bean wins over a later default", () -> {
    AutoConfig a = new AutoConfig();
    a.register("cacheManager", AutoConfig.Cond.onProperty("app.cache.hazelcast"));
    a.register("cacheManager", AutoConfig.Cond.onProperty("app.cache.simple"), AutoConfig.Cond.onMissingBean("cacheManager"));
    eq(a.resolve(Map.of("app.cache.hazelcast", "true", "app.cache.simple", "true"), List.of()), List.of("cacheManager"));
    eq(a.report(), List.of("REGISTERED cacheManager", "SKIPPED cacheManager ALREADY_PRESENT"));
  });
  check("later default runs when the earlier one is off", () -> {
    AutoConfig a = new AutoConfig();
    a.register("cacheManager", AutoConfig.Cond.onProperty("app.cache.hazelcast"));
    a.register("cacheManager", AutoConfig.Cond.onProperty("app.cache.simple"), AutoConfig.Cond.onMissingBean("cacheManager"));
    eq(a.resolve(Map.of("app.cache.hazelcast", "false", "app.cache.simple", "true"), List.of()), List.of("cacheManager"));
    eq(a.report(), List.of("SKIPPED cacheManager PROPERTY_FALSE", "REGISTERED cacheManager"));
  });
  check("user beans keep their order and come first", () -> {
    AutoConfig a = one("health", AutoConfig.Cond.onProperty("management.health.db.enabled"));
    eq(a.resolve(Map.of("management.health.db.enabled", "true"), List.of("dataSource", "jdbcTemplate")), List.of("dataSource", "jdbcTemplate", "health"));
  });
  check("report reflects only the last resolve", () -> {
    AutoConfig a = one("job", AutoConfig.Cond.onProperty("app.jobs"));
    a.resolve(Map.of("app.jobs", "true"), List.of());
    eq(a.resolve(Map.of(), List.of()), List.of());
    eq(a.report(), List.of("SKIPPED job NO_PROPERTY"));
  });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `
class AutoConfig {
    static final class Cond {
        final String kind, key, value;
        private Cond(String kind, String key, String value) { this.kind = kind; this.key = key; this.value = value; }
        static Cond onProperty(String key) { return new Cond("PROPERTY", key, ""); }
        static Cond onPropertyValue(String key, String value) { return new Cond("PROPERTY_VALUE", key, value); }
        static Cond onMissingBean(String bean) { return new Cond("MISSING_BEAN", bean, ""); }
    }
    private final List<String> beans = new ArrayList<>();
    private final List<List<Cond>> specs = new ArrayList<>();
    private List<String> lastReport = new ArrayList<>();
    void register(String bean, Cond... conds) {
        beans.add(bean);
        specs.add(Arrays.asList(conds));
    }
    List<String> resolve(Map<String, String> props, List<String> userBeans) {
        List<String> registered = new ArrayList<>(userBeans);
        List<String> report = new ArrayList<>();
        for (int i = 0; i < beans.size(); i++) {
            String bean = beans.get(i);
            String failure = firstFailure(specs.get(i), props, registered);
            if (failure == null) {
                registered.add(bean);
                report.add("REGISTERED " + bean);
            } else {
                report.add("SKIPPED " + bean + " " + failure);
            }
        }
        lastReport = report;
        return registered;
    }
    List<String> report() { return lastReport; }
    private String firstFailure(List<Cond> conds, Map<String, String> props, List<String> registered) {
        for (Cond c : conds) {
            String actual = props.get(c.key);
            if (c.kind.equals("PROPERTY")) {
                if (actual == null) return "NO_PROPERTY";
                if (actual.equalsIgnoreCase("false")) return "PROPERTY_FALSE";
            } else if (c.kind.equals("PROPERTY_VALUE")) {
                if (actual == null) return "NO_PROPERTY";
                if (!actual.equals(c.value)) return "VALUE_MISMATCH";
            } else if (c.kind.equals("MISSING_BEAN")) {
                if (registered.contains(c.key)) return "ALREADY_PRESENT";
            }
        }
        return null;
    }
}`,
      hints: ['Giữ hai danh sách song song theo thứ tự đăng ký ({{beans}} và {{specs}}), hoặc một danh sách các spec gồm tên + điều kiện. {{register}} chỉ việc append, nó **không** đánh giá điều kiện nào cả — đây chính là điểm "điều kiện chạy lúc resolve, không chạy lúc khai báo".', '{{resolve}} tạo một {{List}} bắt đầu bằng {{userBeans}}, rồi duyệt spec theo thứ tự. Bean của spec được chấp nhận phải được append vào **chính danh sách đó**, để {{onMissingBean}} của spec sau nhìn thấy bean do spec trước tạo ra.', 'Điều kiện là AND và báo lý do của điều kiện fail **đầu tiên**: viết một hàm trả về {{null}} khi mọi điều kiện thoả, ngược lại trả đúng một trong bốn mã lỗi. Dùng {{equalsIgnoreCase("false")}} cho PROPERTY nhưng {{equals}} cho PROPERTY_VALUE — hai quy tắc khác nhau, test sẽ bắt chỗ lẫn.', 'Gán {{lastReport = report}} ở **cuối** mỗi lần resolve để báo cáo bị ghi đè, và trả chính danh sách đó từ {{report()}}.'],
      explain: `Mô hình trên dựng lại đúng ba quyết định thiết kế của Spring Boot.

**Thứ nhất**, {{register}} chỉ ghi metadata. Trong Spring, {{@ConditionalOnMissingBean}} được {{ConfigurationClassPostProcessor}} đánh giá lúc nó đọc class config và tạo bean definition, **trước** khi bean được instantiate. Vì vậy điều kiện không "chờ" bean tồn tại, nó chỉ nhìn danh sách definition — giống {{resolve}} của ta nhìn {{registered}} chứ không tạo object.

**Thứ hai**, danh sách bean khởi tạo bằng user bean rồi mới duyệt spec theo thứ tự đăng ký. Đây là lý do bean của bạn thắng: definition của bạn có mặt trước, nên {{onMissingBean}} trả về "đã có" và bean mặc định bị bỏ. Trong container thật, điều này đến từ việc Boot submit user configuration trước auto-configuration.

**Thứ ba**, bean được chấp nhận phải được append vào danh sách đang duyệt, nên hai spec cùng tên bean chỉ một spec thắng, và thắng thua phụ thuộc **thứ tự đăng ký**. Boot mô tả đúng hành vi này bằng {{@AutoConfigureBefore}}/{{@AutoConfigureAfter}}: thứ tự giữa các auto-config là thứ bạn phải khai báo, không phải thứ Spring tự suy ra.

Lỗi hay gặp khi làm bài:
- Dùng {{Set}} cho bean đã đăng ký: mất thứ tự, test "user beans keep their order" fail.
- Quên append bean được chấp nhận: {{ALREADY_PRESENT}} không bao giờ xuất hiện, cả hai spec cùng tạo bean trùng tên.
- So sánh {{equals("false")}} thay vì {{equalsIgnoreCase}}: bỏ sót {{enabled: FALSE}} trong yaml thật.
- Dùng một biến property chung cho cả hai loại {{onProperty}} và {{onPropertyValue}}: sai mã lỗi, vì giá trị vắng mặt phải là NO_PROPERTY còn giá trị khác phải là VALUE_MISMATCH.
- {{report}} cộng dồn qua các lần resolve: Spring cũng giữ báo cáo của **một** lần khởi động, mỗi lần refresh context là đánh giá lại từ đầu.

Nâng cấp bài tập (nếu muốn gần production hơn): cho {{onMissingBean}} xét theo **kiểu** thay vì tên, bằng cách lưu thêm {{Class}} vào {{Cond}} và dùng {{isAssignableFrom}} — đó chính xác là cách {{OnBeanCondition}} so sánh.`
    }],
    check: [
        { q: 'Với {{@ConditionalOnProperty(name = "app.export.enabled")}} và không có {{havingValue}}, trường hợp nào bean **được tạo**?', options: ['Trong yaml có {{app.export.enabled: true}}', 'Không khai báo property đó ở bất kỳ đâu', 'Trong yaml có {{app.export.enabled: false}}', 'Property đó nằm trong một profile không được kích hoạt'], answer: 0, explain: `Không có {{havingValue}} thì điều kiện khớp khi property **tồn tại** và giá trị khác "false". Trường hợp 1: property tồn tại và bằng true nên khớp. Trường hợp 2 và 4 đều tương đương "property vắng mặt" nên không khớp (muốn khớp phải thêm {{matchIfMissing = true}}). Trường hợp 3 là giá trị false nên thất bại — và trong báo cáo --debug, hai ca 2/4 và ca 3 có lý do khác nhau, đó là manh mối debug hữu ích.` },
        { q: 'Bạn khai {{@Bean DataSource myDataSource()}} trong class {{@Configuration}} của mình. Boot có {{DataSourceAutoConfiguration}} tạo bean {{dataSource}} với {{@ConditionalOnMissingBean}}. Chuyện gì xảy ra?', options: ['Bean mặc định thắng vì auto-configuration luôn có độ ưu tiên cao hơn', 'App fail vì có hai bean cùng kiểu DataSource', 'Cả hai bean đều được tạo và Spring chọn ngẫu nhiên theo tên', 'Bean của bạn thắng: definition của bạn được đăng ký trước pha auto-config, nên điều kiện missing thất bại'], answer: 3, explain: `Đúng thứ tự: user configuration trước, auto-configuration sau; khi OnMissingBean được đánh giá thì {{myDataSource}} đã có trong danh sách definition nên bean mặc định bị bỏ — không cần {{@Primary}}, không cần bật {{spring.main.allow-bean-definition-overriding}}. Boot không hề "ưu tiên" auto-config. Hai bean cùng kiểu chỉ xảy ra nếu bean của bạn khác kiểu còn auto-config xét theo một kiểu khác, hoặc bạn trùng tên bean dẫn tới {{BeanDefinitionOverrideException}}. Không có chuyện chọn ngẫu nhiên.` },
        { q: 'Auto-config của bạn dùng {{@ConditionalOnBean(MetricRegistry.class)}}, mà bean đó do một auto-config khác tạo. Thỉnh thoảng điều kiện fail dù registry chắc chắn sẽ tồn tại. Vì sao?', options: ['Vì @ConditionalOnBean chỉ thấy bean đã được instantiate xong', 'Vì điều kiện đánh giá trên bean definition theo thứ tự xử lý; auto-config kia có thể chưa được xử lý tại thời điểm đó', 'Vì MetricRegistry luôn có scope prototype', 'Vì thiếu @Lazy trên bean registry'], answer: 1, explain: `Đây là lý do tài liệu Boot khuyên chỉ dùng OnBean/OnMissingBean trong lớp auto-config và phải chốt thứ tự bằng {{@AutoConfigureAfter}}. Khi registry chắc chắn sẽ được tạo, vấn đề duy nhất là **thời điểm** đánh giá điều kiện so với thứ tự nạp config. Điều kiện chạy trên definition chứ không cần instance nên phương án "chỉ thấy bean đã instantiate" là sai. Scope và @Lazy không phải nguyên nhân ở đây.` },
        { q: 'Một bean bạn mong đợi không được tạo. Cách nào cho biết chính xác điều kiện nào đã chặn nó mà không phải đọc code auto-config?', options: ['Bật logging.level.root=TRACE và đọc hết log', 'Gọi context.getBeanDefinitionNames() sau khi khởi động', 'Chạy app với cờ --debug rồi đọc CONDITIONS EVALUATION REPORT, hoặc gọi /actuator/conditions', 'Xoá thư mục target rồi build lại cho sạch cache'], answer: 2, explain: `Báo cáo điều kiện liệt kê positive và negative matches **kèm lý do và giá trị tìm thấy**, theo từng bean method. TRACE làm log phình hàng trăm MB mà vẫn không nói lý do điều kiện; {{getBeanDefinitionNames()}} chỉ cho biết kết quả (bean nào có), không cho biết vì sao bean khác bị loại; build lại không liên quan.`
      }
    ],
    related: ['spring-007'], tags: ['auto-configuration', '@Conditional', 'starter', 'boot', 'debug']
  },
  {
    id: 'lesson-spring-009', track: 'spring', order: 9,
    title: 'Spring Events và @TransactionalEventListener: gửi email lúc nào mới đúng', level: 'senior', minutes: 45,
    goals: ['Mô tả thời điểm @EventListener chạy so với transaction', 'Giải thích các phase của @TransactionalEventListener và fallbackExecution', 'Nêu được vì sao AFTER_COMMIT vẫn mất event và khi nào bắt buộc dùng outbox', 'Mô phỏng bus event có transaction giả bằng Java thuần'],
    body: `**Tóm tắt:** {{ApplicationEventPublisher}} + {{@EventListener}} là cơ chế pub/sub **trong một process và đồng bộ**: lệnh publish gọi handler ngay trên chính thread gọi nó. Vì listener chạy **tại thời điểm publish**, nó chạy **bên trong** transaction đang mở — email, SMS, gọi API đã bay ra thế giới trước khi commit, và rollback không kéo chúng về. {{@TransactionalEventListener}} thì khác: lúc có event, Spring không gọi handler mà **đăng ký một callback** (interface {{TransactionSynchronization}}) với transaction đang hoạt động; transaction manager sẽ gọi callback ở đúng phase, mặc định là {{AFTER_COMMIT}}, và **bỏ hẳn** nếu transaction rollback. Cả hai vẫn **không bền vững**: process chết sau commit nhưng trước khi gửi thì event mất vĩnh viễn — side effect liên quan tới tiền phải dùng **transactional outbox**.

### Event, publisher, listener là gì
Tình huống điển hình: sau khi tạo đơn hàng, hệ thống phải gửi email xác nhận, cộng điểm tích luỹ, và cập nhật chỉ mục tìm kiếm. Viết thẳng thì {{OrderService}} phải có ba dependency, và mỗi lần thêm một side effect lại phải sửa {{OrderService}}. Pattern pub/sub đảo việc đó: service chỉ thông báo "**đơn hàng đã tạo**", ai quan tâm thì tự đăng ký nghe.
Ba khái niệm: **event object** = một object thường chứa dữ liệu ({{new OrderCreatedEvent(orderId, total)}}; từ Spring 4.2 không cần kế thừa {{ApplicationEvent}}); **publisher** = bean inject {{ApplicationEventPublisher}} rồi gọi {{publishEvent(event)}} (chính {{ApplicationContext}} cũng là một publisher); **listener** = method đánh dấu {{@EventListener}}, được khớp theo **kiểu tham số** — listener khai báo tham số {{OrderEvent}} sẽ nhận cả subclass của {{OrderEvent}}, và {{@Order}} dùng để xếp thứ tự nhiều listener cùng nhận một event.
Điểm bị hiểu sai nhiều nhất: **mặc định listener chạy đồng bộ, trên thread của người publish, ngay trong lệnh publish**. Muốn listener chạy chỗ khác phải {{@Async}} + {{@EnableAsync}} — và khi đó listener **không còn** transaction của người publish, toàn bộ phần dưới đây đổi ý nghĩa.

### Gửi email trong transaction: chuyện gì xảy ra
~~~seq
title: @EventListener chạy ngay trong transaction đang mở
actors: API | OrderService | DB | MailListener | SMTP
API -> OrderService: POST /orders
OrderService -> DB: insert order (chua commit)
OrderService -> MailListener: publishEvent(OrderCreatedEvent)
MailListener -> SMTP: gửi email xác nhận (2 giây)
MailListener --> OrderService: quay lai, transaction van dang mo
OrderService -> DB: rollback vi tru kho that bai
DB --> API: loi 500
note API..SMTP: email đã gửi, đơn hàng thì không tồn tại
~~~

Bốn hệ quả đều rất thực tế:
1. **Side effect "ma"**: khách nhận email "đã đặt hàng thành công" cho một đơn không tồn tại. Không cách nào rollback một lệnh SMTP hay một message đã vào Kafka.
2. **Giữ connection và lock lâu hơn mức cần thiết**: transaction giữ một kết nối của pool ({{HikariCP}} mặc định tối đa 10) và lock các row đã sửa. Listener gọi SMTP mất 1–2 giây hoặc gọi service khác timeout 5 giây → kết nối bị giữ suốt thời gian đó. Traffic tăng là pool cạn, cả app chờ {{connection-timeout}} chứ không riêng gì luồng gửi email.
3. **Lỗi phụ làm hỏng nghiệp vụ chính**: listener ném exception thì exception lan ngược lên {{publishEvent}}, đang ở trong transaction nên transaction rollback. "Không gửi được email" biến thành "không tạo được đơn hàng".
4. **Retry nhân bản side effect**: client thấy 500 rồi bấm lại, nhưng email lần trước đã gửi.

### @TransactionalEventListener hoạt động thế nào
{{@TransactionalEventListener}} không phải là "event chạy async". Nó là {{@EventListener}} + một bước đăng ký callback: listener adapter kiểm tra annotation, rồi gọi {{TransactionSynchronizationManager.registerSynchronization}} — nghĩa là **ghi tên mình vào danh sách callback của transaction hiện có**. Khi transaction kết thúc, {{AbstractPlatformTransactionManager}} gọi từng callback đúng lúc:
- {{BEFORE_COMMIT}}: ngay trước khi commit (vẫn còn trong transaction, ghi DB ở đây nằm trọn trong transaction đó).
- {{AFTER_COMMIT}} — **mặc định**: sau khi commit thành công. Rollback thì callback này **không bao giờ chạy**.
- {{AFTER_ROLLBACK}}: chỉ khi rollback.
- {{AFTER_COMPLETION}}: luôn chạy sau khi transaction kết thúc, bất kể commit hay rollback (dùng cho dọn dẹp, đo metric).
Bốn chi tiết phải nhớ khi phỏng vấn:
- {{fallbackExecution}} mặc định **false**: nếu lúc publish **không có transaction nào đang mở**, Spring bỏ event và chỉ ghi một dòng log ở mức debug. Listener "tự nhiên không chạy" thường đúng vì lý do này — ví dụ kinh điển là publish từ một method chỉ {{@Transactional}} ở lớp caller khác, hoặc publish trong unit test không có transaction.
- Callback chạy **sau** commit nên transaction cũ đã xong. Nếu listener **ghi** DB, phải mở transaction mới: {{@Transactional(propagation = Propagation.REQUIRES_NEW)}}; không có gì bảo đảm thao tác ghi đó được commit. Đọc thì ổn, vì dữ liệu đã commit và hiển thị với mọi kết nối.
- **Không nhét entity lazy vào event**: sau commit, session Hibernate đã đóng; listener chạm vào {{order.getItems()}} sẽ ăn {{LazyInitializationException}}. Gửi {{id}} hoặc một DTO đã copy sẵn field.
- **Listener ném exception ở AFTER_COMMIT không làm rollback** (đã commit rồi) nhưng exception vọng ra lệnh gọi commit, nên API trả 500 trong khi dữ liệu đã lưu — client retry có thể tạo đơn trùng. Vì vậy listener kiểu này phải tự bắt lỗi, log và phát metric, đừng để exception toả ra ngoài.

### Khi AFTER_COMMIT vẫn chưa đủ: transactional outbox
Vấn đề còn lại là **nguyên tử hoá hai việc ở hai hệ thống**: "biến đổi trong DB" và "thông báo ra ngoài" nằm ở hai hệ thống khác nhau, không có transaction nào bao cả hai ({{Two-Phase Commit}} giữa Postgres và Kafka gần như không tồn tại trong thực tế). Outbox giải quyết bằng cách biến việc gửi thành một phần của chính transaction:
~~~seq
title: Outbox dua event ra Kafka ma khong mat tin hieu
actors: App | DB | Poller | Kafka | Consumer
App -> DB: insert don hang (mot transaction)
App -> DB: insert outbox_row (event id, payload)
DB --> App: committed
Poller -> DB: select outbox_row where sent = false
Poller -> Kafka: publish payload theo dung thu tu
Poller -> DB: danh dau sent = true
Kafka --> Consumer: email, diem thuong, tim kiem
note App..Kafka: process chet sau commit van con row de gui lai
~~~
Tính chất: **at-least-once** (một event có thể được gửi hai lần khi poller chết giữa chừng), nên consumer phải **idempotent** — thường bằng cách lưu {{event_id}} vào bảng đã-xử-lý với unique constraint, hoặc dùng upstream topic compaction. So với {{@TransactionalEventListener}} thuần, outbox thêm độ trễ (poll mỗi 100 ms – 1 s, hoặc dùng CDC như Debezium đọc WAL để gần real-time) và thêm một thành phần phải monitor, nhưng đổi lại: không mất signal, gửi lại được, và có audit log.

| Cách | Thời điểm chạy | Khi rollback | Khi process chết sau commit | Dùng cho |
|---|---|---|---|---|
| {{@EventListener}} | ngay lúc publish, trong transaction | vẫn đã chạy | đã chạy | việc nội bộ thuần tính toán, không side effect |
| {{@TransactionalEventListener}} AFTER_COMMIT | sau khi commit | bị bỏ | **mất signal** | thông báo nội bộ, cache eviction, email "nice to have" |
| Outbox + queue | sau commit, độ trễ polling | row không tồn tại | **còn row, gửi lại được** | email giao dịch, cộng tiền, message cho service khác |

### Bẫy hay gặp
- **Test có {{@Transactional}}**: TestContext mặc định rollback sau mỗi test, nên listener {{AFTER_COMMIT}} không bao giờ chạy và bạn tưởng code sai. Bỏ annotation, hoặc dùng {{TransactionTemplate}} rồi assert sau commit, hoặc {{TestTransaction.setCommit(true)}}.
- **{{fallbackExecution = true}}** làm listener chạy cả khi không có transaction — tức là quay lại hành vi "side effect trước commit". Chỉ bật khi bạn biết chắc listener không có side effect nguy hiểm.
- **{{@Async}} + {{@TransactionalEventListener}}**: callback được submit xuống executor sau commit; request trả về nhanh nhưng lỗi của listener không còn ai nhận → bắt buộc log + metric + cảnh báo.
- **Cấu hình {{taskExecutor}} cho {{ApplicationEventMulticaster}}** sẽ biến *mọi* listener thành async một cách im lặng — một thay đổi tưởng vô hại ở config làm hỏng tính nhất quán mà {{@EventListener}} đang dựa vào.
- **Nhiều listener cùng phase** chạy tuần tự theo {{@Order}}; chúng vẫn chia sẻ một kết nối/thread nên listener chậm thứ nhất làm listener thứ hai chậm theo.
- **Poller outbox**: đừng {{SELECT ... FOR UPDATE}} rồi gửi Kafka ngay trong transaction (giữ lock và biến broker thành dependency của DB transaction); đọc row, gửi, rồi đánh dấu bằng {{event_id}} unique để gửi trùng không sao.

### Liên hệ phỏng vấn
Khung trả lời bốn bước: (1) event của Spring là in-process và **đồng bộ**, listener chạy trong transaction của người publish; (2) nên {{@EventListener}} chỉ dùng cho tính toán nội bộ, còn side effect ra bên ngoài phải trì tới sau commit; (3) {{@TransactionalEventListener(phase = AFTER_COMMIT)}} đăng ký callback với transaction, bị bỏ khi rollback, nhưng listener muốn ghi DB thì cần transaction mới và phải tự bắt exception của chính mình; (4) vẫn chưa đủ khi yêu cầu là "chắc chắn gửi được" → outbox + queue + idempotency, hoặc CDC. Kết bằng một câu chứng minh đã gặp thực tế: "listener của tôi từng bị bỏ vì test bọc {{@Transactional}}, sau này tôi chuyển sang {{TransactionTemplate}} để test đúng pha commit".

> Senior tip: Quy tắc chọn gọn: side effect **mất cũng không sao** → {{@TransactionalEventListener}}; side effect **liên quan tiền, hợp đồng, hoặc vượt ra hệ thống khác** → outbox. Và luôn đo thời gian giữ connection: một listener gọi SMTP 2 giây trong transaction là đủ để pool 10 connection sập khi traffic tăng gấp ba — lỗi biểu hiện thành "app treo" chứ không phải "email chậm".`,
    exercises: [{
      title: 'EventBus có transaction giả: IMMEDIATE, AFTER_COMMIT, AFTER_COMPLETION',
      prompt: `Hoàn thiện {{EventBus}} — mô hình thu nhỏ của {{ApplicationEventPublisher}} + {{@TransactionalEventListener}}, với một transaction giả (không DB, không thread). Các class {{Handler}}, {{OrderEvent}}, {{PaidEvent}} (subclass của {{OrderEvent}}), {{RefundEvent}} đã có sẵn.
- {{subscribe(eventType, phase, handler)}}: thêm listener vào danh sách **theo thứ tự đăng ký**. Chỉ chấp nhận ba giá trị phase {{"IMMEDIATE"}}, {{"AFTER_COMMIT"}}, {{"AFTER_COMPLETION"}}; giá trị khác phải ném {{IllegalArgumentException}}.
- {{publish(event)}}: duyệt listener theo thứ tự đăng ký, bỏ qua listener có {{eventType}} **không phải** kiểu của event (lưu ý listener đăng ký {{OrderEvent}} phải nhận cả {{PaidEvent}}). Listener {{IMMEDIATE}} → gọi handler **ngay**, và nếu handler ném exception thì {{publish}} ném lại exception đó. Listener {{AFTER_COMMIT}}/{{AFTER_COMPLETION}}: nếu đang có transaction mở thì **xếp vào hàng đợi callback** (kèm object event của lần publish đó); nếu **không** có transaction thì bỏ qua, không gọi và cũng không xếp hàng (đây là {{fallbackExecution = false}} mặc định của Spring).
- {{beginTx()}}: mở transaction. Nếu đã có transaction mở thì ném {{IllegalStateException}} (không mô phỏng transaction lồng nhau).
- {{commit()}}: nếu không có transaction đang mở thì ném {{IllegalStateException}}. Đóng transaction trước ({{inTransaction()}} phải trả false), rồi chạy các callback {{AFTER_COMMIT}} đang xếp hàng theo thứ tự đăng ký, **sau đó** chạy {{AFTER_COMPLETION}}. Hai hàng đợi phải được **lấy ra và xoá** trước khi gọi callback. Nếu callback {{AFTER_COMMIT}} ném exception: exception phải vọng ra {{commit()}}, transaction vẫn được coi là đã commit, và các callback {{AFTER_COMPLETION}} **vẫn** phải chạy (đúng như Spring làm).
- {{rollback()}}: nếu không có transaction đang mở thì ném {{IllegalStateException}}. Đóng transaction, **bỏ** toàn bộ callback {{AFTER_COMMIT}}, vẫn chạy {{AFTER_COMPLETION}} theo thứ tự đăng ký; exception từ callback {{AFTER_COMPLETION}} vọng ra {{rollback()}}.
- {{inTransaction()}}: true từ lúc {{beginTx()}} cho tới khi {{commit()}}/{{rollback()}} kết thúc. Test không kiểm tra giá trị của nó **bên trong** callback, nên bạn không cần bắt chước chính xác chi tiết đó của Spring.`,
      starter: `
interface Handler { void handle(Object event); }
class OrderEvent {}
class PaidEvent extends OrderEvent {}
class RefundEvent {}
class EventBus {
    void subscribe(Class<?> eventType, String phase, Handler handler) { throw new UnsupportedOperationException("TODO"); }
    void publish(Object event) { throw new UnsupportedOperationException("TODO"); }
    void beginTx() { throw new UnsupportedOperationException("TODO"); }
    void commit() { throw new UnsupportedOperationException("TODO"); }
    void rollback() { throw new UnsupportedOperationException("TODO"); }
    boolean inTransaction() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed=0, total=0;
 static void check(String n, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch (Throwable t) { System.out.println("FAIL " + n + ": " + t); } }
 static void eq(Object got, Object want) { if (!Objects.equals(got, want)) throw new AssertionError("got " + got + " want " + want); }
 static void expect(Class<? extends RuntimeException> kind, Runnable r) {
   try { r.run(); } catch (RuntimeException e) { if (!kind.isInstance(e)) throw new AssertionError("wrong type: " + e); return; }
   throw new AssertionError("expected " + kind.getSimpleName());
 }
 public static void main(String[] x) {
  check("immediate listener runs at publish time inside the transaction", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "IMMEDIATE", e -> trace.add("now:" + bus.inTransaction()));
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("after"));
    bus.beginTx();
    bus.publish(new OrderEvent());
    eq(trace, List.of("now:true"));
  });
  check("AFTER_COMMIT fires only after commit", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "IMMEDIATE", e -> trace.add("now"));
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("after"));
    bus.beginTx();
    bus.publish(new OrderEvent());
    eq(trace, List.of("now"));
    bus.commit();
    eq(trace, List.of("now", "after"));
    if (bus.inTransaction()) throw new AssertionError("transaction must be closed after commit");
  });
  check("rollback drops AFTER_COMMIT and fires AFTER_COMPLETION", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "IMMEDIATE", e -> trace.add("now"));
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("after"));
    bus.subscribe(OrderEvent.class, "AFTER_COMPLETION", e -> trace.add("done"));
    bus.beginTx();
    bus.publish(new OrderEvent());
    bus.rollback();
    eq(trace, List.of("now", "done"));
  });
  check("AFTER_COMPLETION also runs on commit, after AFTER_COMMIT", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("after"));
    bus.subscribe(OrderEvent.class, "AFTER_COMPLETION", e -> trace.add("done"));
    bus.beginTx();
    bus.publish(new OrderEvent());
    bus.commit();
    eq(trace, List.of("after", "done"));
  });
  check("callbacks are grouped by phase and ordered by subscription", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("a1"));
    bus.subscribe(OrderEvent.class, "AFTER_COMPLETION", e -> trace.add("c1"));
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("a2"));
    bus.beginTx();
    bus.publish(new OrderEvent());
    bus.commit();
    eq(trace, List.of("a1", "a2", "c1"));
  });
  check("phase listeners without an open transaction are dropped", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "IMMEDIATE", e -> trace.add("now"));
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("after"));
    bus.subscribe(OrderEvent.class, "AFTER_COMPLETION", e -> trace.add("done"));
    bus.publish(new OrderEvent());
    eq(trace, List.of("now"));
    bus.beginTx();
    bus.commit();
    eq(trace, List.of("now"));
  });
  check("listeners match by type including subclasses", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "IMMEDIATE", e -> trace.add("order:" + e.getClass().getSimpleName()));
    bus.subscribe(PaidEvent.class, "IMMEDIATE", e -> trace.add("paid"));
    bus.subscribe(RefundEvent.class, "IMMEDIATE", e -> trace.add("refund"));
    bus.publish(new PaidEvent());
    bus.publish(new RefundEvent());
    eq(trace, List.of("order:PaidEvent", "paid", "refund"));
  });
  check("exception in immediate listener escapes publish and lets the caller rollback", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "IMMEDIATE", e -> { throw new RuntimeException("smtp down"); });
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("after"));
    bus.beginTx();
    expect(RuntimeException.class, () -> bus.publish(new OrderEvent()));
    bus.rollback();
    eq(trace, List.of());
  });
  check("exception in AFTER_COMMIT escapes commit but AFTER_COMPLETION still runs", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> { throw new RuntimeException("template missing"); });
    bus.subscribe(OrderEvent.class, "AFTER_COMPLETION", e -> trace.add("done"));
    bus.beginTx();
    bus.publish(new OrderEvent());
    expect(RuntimeException.class, () -> bus.commit());
    eq(trace, List.of("done"));
    if (bus.inTransaction()) throw new AssertionError("data was already committed");
    expect(IllegalStateException.class, () -> bus.commit());
  });
  check("queued callbacks fire only once, not on the next transaction", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add("after"));
    bus.subscribe(OrderEvent.class, "AFTER_COMPLETION", e -> trace.add("done"));
    bus.beginTx();
    bus.publish(new OrderEvent());
    bus.commit();
    bus.beginTx();
    bus.commit();
    eq(trace, List.of("after", "done"));
  });
  check("each queued callback receives the event it was queued with", () -> {
    List<String> trace = new ArrayList<>();
    EventBus bus = new EventBus();
    bus.subscribe(OrderEvent.class, "AFTER_COMMIT", e -> trace.add(e.getClass().getSimpleName()));
    bus.beginTx();
    bus.publish(new PaidEvent());
    bus.publish(new OrderEvent());
    bus.commit();
    eq(trace, List.of("PaidEvent", "OrderEvent"));
  });
  check("unknown phase is rejected at subscribe time", () -> {
    EventBus bus = new EventBus();
    expect(IllegalArgumentException.class, () -> bus.subscribe(OrderEvent.class, "BEFORE_COMMIT", e -> {}));
  });
  check("beginTx rejects a second open transaction", () -> {
    EventBus bus = new EventBus();
    bus.beginTx();
    expect(IllegalStateException.class, () -> bus.beginTx());
  });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `
interface Handler { void handle(Object event); }
class OrderEvent {}
class PaidEvent extends OrderEvent {}
class RefundEvent {}
class EventBus {
    private static final class Sub {
        final Class<?> type; final String phase; final Handler handler;
        Sub(Class<?> type, String phase, Handler handler) { this.type = type; this.phase = phase; this.handler = handler; }
    }
    private record Pending(Sub sub, Object event) {}
    private final List<Sub> subs = new ArrayList<>();
    private final List<Pending> commitQueue = new ArrayList<>();
    private final List<Pending> completionQueue = new ArrayList<>();
    private boolean tx;
    void subscribe(Class<?> eventType, String phase, Handler handler) {
        if (!phase.equals("IMMEDIATE") && !phase.equals("AFTER_COMMIT") && !phase.equals("AFTER_COMPLETION")) {
            throw new IllegalArgumentException("unknown phase: " + phase);
        }
        subs.add(new Sub(eventType, phase, handler));
    }
    void publish(Object event) {
        for (Sub s : subs) {
            if (!s.type.isInstance(event)) continue;
            if (s.phase.equals("IMMEDIATE")) {
                s.handler.handle(event);
            } else if (tx) {
                if (s.phase.equals("AFTER_COMMIT")) commitQueue.add(new Pending(s, event));
                else completionQueue.add(new Pending(s, event));
            }
        }
    }
    void beginTx() {
        if (tx) throw new IllegalStateException("transaction already active");
        tx = true;
    }
    void commit() {
        if (!tx) throw new IllegalStateException("no active transaction");
        tx = false;
        List<Pending> commit = new ArrayList<>(commitQueue);
        List<Pending> completion = new ArrayList<>(completionQueue);
        commitQueue.clear();
        completionQueue.clear();
        try {
            fire(commit);
        } finally {
            fire(completion);
        }
    }
    void rollback() {
        if (!tx) throw new IllegalStateException("no active transaction");
        tx = false;
        commitQueue.clear();
        List<Pending> completion = new ArrayList<>(completionQueue);
        completionQueue.clear();
        fire(completion);
    }
    boolean inTransaction() { return tx; }
    private void fire(List<Pending> items) {
        for (Pending p : items) p.sub().handler.handle(p.event());
    }
}`,
      hints: ['Cấu trúc tối thiểu: một {{List}} listener ({{eventType}}, {{phase}}, {{handler}}), một cờ {{boolean tx}}, và hai hàng đợi callback cho {{AFTER_COMMIT}} và {{AFTER_COMPLETION}}. Mỗi phần tử hàng đợi phải lưu **cả listener lẫn object event**, vì hai lần publish trong cùng một transaction sẽ cho ra hai callback khác event nhau.', 'So khớp kiểu bằng {{eventType.isInstance(event)}} — đúng bằng cách Spring khớp listener theo kiểu tham số, nên listener đăng ký super class nhận cả subclass.', 'Xếp hàng chứ không gọi: trong {{publish}}, với phase không phải {{IMMEDIATE}} mà {{tx}} đang false thì **không làm gì cả** (đừng ném lỗi, đừng gọi handler). Đây là hành vi {{fallbackExecution = false}}.', 'Trong {{commit}}, sao chép rồi xoá hai hàng đợi **trước khi** chạy callback, và đặt vòng {{AFTER_COMPLETION}} trong {{finally}} của vòng {{AFTER_COMMIT}} để callback completion vẫn chạy khi callback commit ném lỗi — đúng như {{AbstractPlatformTransactionManager.processCommit}}.'],
      explain: `Bài tập này dựng lại đúng ba quyết định trong Spring.

**Thứ nhất**, listener {{IMMEDIATE}} được gọi trong vòng {{publish}}. Trong Spring, {{publishEvent}} đi qua {{ApplicationEventMulticaster}} và gọi listener **ngay trên thread hiện tại**, lúc transaction còn mở. Đó là lý do email đã gửi mà đơn hàng còn có thể rollback, và cũng là lý do listener chậm làm transaction giữ connection lâu hơn.

**Thứ hai**, listener theo phase không chạy mà được **xếp hàng**. Spring làm việc đó bằng {{TransactionSynchronizationManager.registerSynchronization}}, tức gắn callback vào transaction đang mở; {{commit}}/{{rollback}} của transaction manager là nơi quyết định callback nào được gọi. Vì callback gắn với transaction, nếu lúc publish không có transaction thì chẳng có gì để gắn — event bị bỏ, đó là {{fallbackExecution = false}}.

**Thứ ba**, {{AFTER_COMPLETION}} chạy trong {{finally}} sau {{AFTER_COMMIT}}. Spring làm gần như y hệt trong {{processCommit}}: exception từ callback afterCommit **vọng ra ngoài** cho caller, nhưng transaction thì đã commit thật; sau đó afterCompletion vẫn được trigger. Hệ quả thực tế rất đau: API trả 500 dù dữ liệu đã lưu, và client retry tạo đơn trùng — vì thế listener AFTER_COMMIT phải tự bắt lỗi, log và đo metric.

Lỗi hay gặp khi làm bài:
- Hàng đợi chỉ lưu listener mà quên lưu event: test "each queued callback receives the event it was queued with" fail.
- Quên xoá hàng đợi sau khi chạy: callback bị gọi lại ở transaction kế tiếp.
- Chạy {{AFTER_COMMIT}} và {{AFTER_COMPLETION}} trộn theo thứ tự đăng ký thay vì theo phase: test "grouped by phase" fail. Spring cũng chạy theo nhóm phase trước/sau như bài này.
- Gọi callback sau khi đã mở lại transaction mới, hoặc quên đặt {{tx}} = false trước khi chạy callback: các assert về {{inTransaction()}} sai.
- Cho {{rollback}} chạy cả callback {{AFTER_COMMIT}}: mất ý nghĩa của cả pattern.
Nâng cấp để gần production hơn: bắt {{beginTx}}/{{commit}} hỗ trợ {{propagation}} ({{REQUIRES_NEW}} tạm treo transaction ngoài), hoặc cho {{AFTER_COMMIT}} callback quyền publish tiếp — và bạn sẽ thấy event phát lúc đó **bị bỏ** vì không còn transaction nào mở. Chính chỗ đó là lý do người ta chuyển sang outbox.`
    }],
    check: [
        { q: 'Test của bạn bọc trong {{@Transactional}} (Spring Test rollback sau mỗi test) và listener {{@TransactionalEventListener}} không bao giờ chạy. Vì sao?', options: ['Listener chỉ chạy trong production build', 'Spring Test vô hiệu hoá mọi application event', 'Transaction của test bị rollback, nên phase AFTER_COMMIT không bao giờ xảy ra', 'Vì listener thiếu @Async'], answer: 2, explain: `{{@TransactionalEventListener}} đăng ký callback cho transaction hiện tại; khi transaction kết thúc bằng rollback thì callback AFTER_COMMIT bị bỏ — mà TestContext mặc định luôn rollback sau mỗi test. Fix: đừng bọc test bằng {{@Transactional}}, dùng {{TransactionTemplate}} rồi assert sau commit, hoặc {{TestTransaction.setCommit(true)}}. Annotation không phụ thuộc môi trường build, test context vẫn phát event bình thường, và {{@Async}} không liên quan tới việc callback bị bỏ.` },
        { q: 'Code gọi {{publishEvent(e)}} khi **không** có transaction đang mở, listener là {{@TransactionalEventListener}} mặc định. Chuyện gì xảy ra?', options: ['Listener chạy ngay như @EventListener', 'Listener bị bỏ qua và chỉ có log; phải đặt fallbackExecution = true để nó chạy cả ngoài transaction', 'Spring ném IllegalStateException', 'Listener chạy sau khi Spring tự mở một transaction mới'], answer: 1, explain: `Mặc định {{fallbackExecution = false}}: không có transaction để gắn callback thì event bị bỏ, Spring chỉ ghi log ở mức debug. Đây là nguồn của rất nhiều bug "sao listener không chạy". Nó không tự mở transaction (publisher không quyết định ranh giới nghiệp vụ), không hành xử như {{@EventListener}} thường, và cũng không ném lỗi.` },
        { q: 'Listener {{AFTER_COMMIT}} ném RuntimeException. Điều nào đúng?', options: ['Transaction bị rollback vì listener là một phần của transaction', 'Spring tự retry listener ba lần', 'Lỗi bị nuốt hoàn toàn, caller không thấy gì', 'Dữ liệu đã commit rồi; exception vọng ra caller của lệnh commit, API có thể trả 500 dù đơn hàng đã tạo'], answer: 3, explain: `Callback chạy **sau** doCommit, nên không còn gì để rollback; exception được truyền lên caller của lệnh commit — hệ quả là client nhận 500 và retry, sinh đơn trùng. Spring không retry listener. Lỗi cũng không bị nuốt (chỉ callback ở afterCompletion là Spring ghi log rồi đi tiếp). Vì vậy listener AFTER_COMMIT nên tự bắt lỗi và phát metric.` },
        { q: 'Vì sao {{@TransactionalEventListener}} một mình nó chưa đủ để "chắc chắn gửi được email", và outbox thêm được gì?', options: ['Vì process có thể chết sau commit nhưng trước khi kịp gửi; outbox ghi event vào DB trong chính transaction đó để gửi lại sau', 'Vì listener AFTER_COMMIT chạy trước commit', 'Vì outbox làm email được gửi nhanh hơn', 'Vì Spring event chỉ cho phép tối đa một listener'], answer: 0, explain: `Spring event chỉ tồn tại trong bộ nhớ của một process: commit xong, mà JVM chết trước khi callback gửi email (deploy, OOM, pod bị drain) thì signal mất vĩnh viễn và không log nào cho biết. Outbox ghi một row event **trong chính transaction đó**, nên "commit" đồng nghĩa "message đã được lưu"; một poller hoặc CDC đọc row chưa gửi rồi đẩy vào queue, và consumer phải idempotent vì việc gửi lại có thể trùng. AFTER_COMMIT chạy sau commit chứ không trước, outbox tăng độ trễ chứ không giảm, và số listener không bị giới hạn một.`
      }
    ],
    related: ['spring-016'], tags: ['event', '@TransactionalEventListener', 'AFTER_COMMIT', 'outbox', 'transaction']
  },
  {
    id: 'lesson-spring-010', track: 'spring', order: 10,
    title: '@Transactional không chạy khi gọi nội bộ: bản đồ proxy và cách sửa', level: 'senior', minutes: 45,
    goals: [
      'Phân biệt ba thứ: target bạn viết, proxy Spring tạo, và reference bạn đang cầm',
      'Giải thích từng bước vì sao {{this.method()}} không bao giờ chạy advice',
      'Kể được năm cách sửa self-invocation và trade-off của từng cách',
      'Tự dựng proxy transaction bằng {{java.lang.reflect.Proxy}} và đếm begin/join/commit',
    ],
    body: `**Tóm tắt:** {{@Transactional}} không tự mở transaction khi code chạy. Nó chỉ là **metadata** để Spring quyết định bọc bean bằng một **proxy** (object đứng giữa, chạy thêm hành vi trước và sau lời gọi). Bean bạn inject vào nơi khác thật ra là proxy; instance lớp bạn viết (**target**) nằm giấu bên trong. Khi code bên trong target gọi {{this.saveOther()}}, lời gọi đi thẳng từ target tới target, không chạm proxy, nên phần "mở transaction - commit - rollback" của advice không có cơ hội chạy.

### Có ba object, nhưng bạn chỉ cầm một
Lúc khởi động, Spring làm ba việc tách biệt với một bean có method {{@Transactional}}:

1. **Tạo target**: gọi constructor của {{OrderService}} được **một** instance. Instance này là object thô, chưa có gì bọc ngoài.
2. **Bọc bằng proxy**: một {{BeanPostProcessor}} (nói gọn là "auto proxy creator" — bộ máy quét annotation rồi sinh proxy) thấy bean này có transaction annotation nên tạo proxy trỏ vào target.
3. **Đưa proxy vào cache bean**: từ đây mọi {{@Autowired OrderService}} trong ứng dụng nhận **proxy**, không nhận target.

~~~text
   caller                PROXY (thứ bạn inject)          TARGET (instance bạn viết)
     │  service.create()      │                              │
     ├──────────────────────▶ │ TxInterceptor:               │
     │                        │   begin tx                   │
     │                        ├────────────────────────────▶ │ create(): ...
     │                        │                              │   this.saveOther()  ✗
     │                        │   ◀── return ────────────────┤   (đi trong nội bộ target,
     │  ◀── return ────────── │ commit tx                    │    không quay lại proxy)
~~~

Chìa khoá: **{{this}} luôn là target**, mà advice nằm ở proxy. Target không biết mình đang được bọc, nên Java không có cách nào "tự nhảy" về proxy. Đây không phải lỗi của Spring — tài liệu chính thức coi đây là giới hạn hiển nhiên của mô hình proxy AOP.

### JDK proxy và CGLIB: hai cách tạo, cùng một giới hạn
{{java.lang.reflect.Proxy}} (JDK dynamic proxy) sinh một class **cài các interface** bạn liệt kê; mọi lời gọi đi qua một {{InvocationHandler}}. CGLIB/ByteBuddy thì sinh **lớp con** của class target và override method để chèn advice. Spring Boot mặc định dùng CGLIB ({{spring.aop.proxy-target-class=true}}), nên inject theo class cụ thể vẫn chạy.

| Cách | Điều kiện | Hệ quả khi gọi nội bộ |
|---|---|---|
| JDK proxy | bean phải có interface, caller inject theo interface | như nhau: advice chỉ chạy ở proxy |
| CGLIB (subclass) | class và method không được **final** | như nhau; method private/static không override được |
| AspectJ weaving | sửa **bytecode của chính target** (lúc compile hoặc load) | self-call **có** bị chèn advice — nhưng build phức tạp hơn |

Điểm dễ hiểu sai: CGLIB tạo lớp con, nên người mới nghĩ "proxy là chính object đó, {{this}} là proxy". Không phải: Spring vẫn tạo target riêng rồi để proxy **ủy quyền** (delegate) sang target. Chỉ khi dùng AspectJ weaving thì lời gọi nội bộ mới đi qua advice.

### Vì sao "không có transaction" nguy hiểm hơn "có transaction sai"
- {{REQUIRES_NEW}} trên method inner + self-call: inner chạy **trong** transaction ngoài. Audit log lẽ ra phải còn sau khi nghiệp vụ rollback thì lại bị cuộn mất theo.
- {{readOnly = true}} trên method đọc + self-call: connection không được đánh dấu read-only, query đọc vẫn về primary, không route sang replica được.
- Chỉ method inner có annotation, method ngoài không có và gọi nội bộ: **không có transaction nào cả**. Mỗi {{repository.save()}} là một auto-commit riêng. Vòng 10.000 dòng thành 10.000 commit — chậm hơn hàng chục lần, và nếu dòng 7.000 lỗi thì 6.999 dòng đầu vẫn nằm lại trong DB.
- Cùng cơ chế nên {{@Cacheable}}, {{@Async}}, {{@Retryable}}, {{@PreAuthorize}} cũng hỏng y hệt khi gọi nội bộ. Một bug, bốn hậu quả.

### Chẩn đoán trong năm phút
~~~java
@Transactional
public void handle(Command c) {
    // in ra ngay đầu method: false nghĩa là lời gọi này không đi qua proxy
    log.info("tx active = {}, bean = {}",
        TransactionSynchronizationManager.isActualTransactionActive(),  // "giao dịch có đang mở trên thread này không?"
        AopUtils.isAopProxy(this));                                     // this là target nên luôn false
}
~~~

Ba mẹo thực tế: bật log {{org.springframework.transaction.interceptor}} mức TRACE để thấy interceptor có chạy không; gọi {{TransactionAspectSupport.currentTransactionStatus()}} — nó ném {{NoTransactionException}} khi không có transaction; và kiểm tra bean thực sự là proxy bằng {{bean.getClass().getName()}} (tên chứa "{{$$SpringCGLIB$$0}}"). Trường hợp hay gặp nhất: service được tạo bằng {{new ...}} trong test hoặc trong code tay chứ không phải bean Spring — object thô thì vĩnh viễn không có advice.

### Năm cách sửa, theo thứ tự nên dùng
1. **Tách method inner sang bean khác** (khuyến nghị): call path đi ra ngoài bean, do đó đi qua proxy của bean kia. Nó cũng buộc bạn nghĩ lại ranh giới trách nhiệm.
2. **Đặt boundary ở method ngoài cùng**: nếu inner chỉ là helper, đừng đánh dấu nó. Transaction của outer đã đủ.
3. **{{TransactionTemplate}}** — mở transaction bằng code, không cần proxy:

~~~java
@Service
class ImportService {
    private final TransactionTemplate tx;          // Boot tự cấu hình khi có PlatformTransactionManager
    ImportService(TransactionTemplate tx) { this.tx = tx; }

    void run(List<Row> rows) {
        for (Row r : rows) {
            tx.executeWithoutResult(status -> repository.save(r));  // transaction THẬT, mỗi dòng một lần
        }
    }
}
~~~

    Bẫy: {{TransactionTemplate}} là object **mutable** và thường là bean dùng chung. Gọi {{tx.setPropagationBehavior(...)}} đổi luôn hành vi của mọi nơi khác dùng cùng template. Muốn REQUIRES_NEW một chỗ thì khai báo một template riêng (một {{@Bean}}) hoặc tạo {{new TransactionTemplate(transactionManager)}} trong constructor.
4. **Tự xin proxy của chính mình**: {{@Lazy OrderService self}} ({{@Lazy}} = "đưa một proxy con rùa, chỉ resolve khi lần đầu dùng"), hoặc {{ObjectProvider<OrderService>.getObject()}}, hoặc {{AopContext.currentProxy()}} với {{exposeProxy = true}}. Chạy được, nhưng call graph thành tối nghĩa và unit test gọi {{new OrderService(...)}} thì {{self}} null.
5. **AspectJ weaving** khi yêu cầu "mọi lời gọi đều được bọc" là chính đáng (hiếm). Đánh đổi: build/load-time agent, khó debug, không còn là Spring AOP.

### Liên hệ phỏng vấn
Trả lời theo bốn nhịp để thể hiện bạn hiểu cơ chế chứ không thuộc triệu chứng: (1) mô tả ba object và vẽ đường đi caller → proxy → target; (2) nói vì sao {{this}} là target nên advice bị bỏ; (3) nêu hậu quả thật (REQUIRES_NEW, readOnly, batch auto-commit) và cách chẩn đoán bằng {{isActualTransactionActive()}}; (4) đưa hai ba cách sửa kèm lý do chọn, và chủ động nói {{@Cacheable}}/{{@Async}} cùng chung bệnh. Câu đào sâu thường gặp: "annotation đặt trên interface thì có được không?" (có — Spring còn tìm annotation ở method khai báo trong interface), "method private thì sao?" (proxy không chặn được, kể cả khi gọi từ ngoài), "làm sao chứng minh trong test?" (dùng {{@SpringBootTest}} và assert trạng thái transaction, hoặc như bài tập dưới đây).

> Senior tip: Trong code review, thấy một method {{@Transactional}} được gọi từ method khác **trong cùng class** thì hỏi lại ngay: ranh giới nghiệp vụ ở đâu. Đặt boundary ở tầng use case, đừng đặt ở helper. Trên production, hai chỉ số tố cáo self-invocation nhanh nhất là **số commit/giây tăng vọt** khi chạy import hàng loạt và **dữ liệu nửa vời** sau một lỗi giữa chừng — trong khi log transaction của method ngoài vẫn "bình thường".`,
    exercises: [{
      title: 'Dựng proxy transaction bằng JDK Proxy: đếm begin/join/commit và thấy self-invocation bị bỏ qua',
      prompt: `Viết lại phần cốt lõi của Spring transaction bằng {{java.lang.reflect.Proxy}}. {{TxSim.wrap(target, iface, log)}} trả về một proxy cài {{iface}} và ủy quyền cho {{target}}. {{log}} (type {{TxLog}} cho sẵn) là nơi ghi số liệu **và** đóng vai "transaction đang mở của thread" ({{log.active}}), dùng chung cho mọi proxy trong cùng bài test — giống {{TransactionSynchronizationManager}}.

Quy tắc handler phải làm, mô phỏng {{TransactionInterceptor}}:
- **Transaction attribute**: method được coi là có transaction nếu {{@Tx}} nằm trên method của **class target** *hoặc* trên method **khai báo ở interface**. Không có ở cả hai → chỉ gọi target, trả kết quả, không ghi gì vào {{log}}.
- **Transaction ngoài cùng** ({{log.active == false}}): {{begins++}}, đặt {{active = true}} và {{rollbackOnly = false}}, ghi sự kiện {{"begin:" + tên method}}. Rồi chạy target:
  - trả về bình thường: nếu {{rollbackOnly}} đã bật bởi một lời gọi lồng nhau thì {{rollbacks++}} và ghi {{"rollback:" + tên}}, ngược lại {{commits++}} và ghi {{"commit:" + tên}};
  - ném {{RuntimeException}} hoặc {{Error}}: {{rollbacks++}}, ghi {{"rollback:" + tên}}, **ném lại chính exception gốc**;
  - ném checked {{Exception}}: vẫn tính như thành công theo mặc định của Spring ({{commits++}}, {{"commit:" + tên}}) rồi ném tiếp.
  - Dù thành công hay lỗi, trước khi thoát phải đặt {{active = false}} (và xoá {{rollbackOnly}}).
- **Tham gia transaction đang mở** ({{log.active == true}}, tức REQUIRED): {{joins++}}, ghi {{"join:" + tên}}, chạy target, **không** begin/commit/rollback ở tầng này. Nếu target ném {{RuntimeException}} hoặc {{Error}}: bật {{rollbackOnly = true}} rồi ném tiếp — transaction ngoài cùng mới là nơi quyết định.
- Lời gọi {{method.invoke(target, args)}} bọc exception của target trong {{InvocationTargetException}}; handler phải ném lại {{getCause()}}.

Fixture đã có sẵn trong file: {{TxWorker}}, {{WorkerImpl}} ({{outer()}} gọi {{this.inner()}} — self-invocation; {{delegated()}} và {{swallow()}} gọi qua {{Helper}} **đã được bọc bằng proxy**), {{MarkedApi}}, {{MarkedImpl}} ({{@Tx}} chỉ nằm trên interface). Bạn không cần sửa fixture.`,
      starter: `@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME) @interface Tx {}

class TxLog {
    int begins, commits, rollbacks, joins;
    boolean active, rollbackOnly;
    final List<String> events = new ArrayList<>();
}

interface TxWorker {
    String outer(); String inner(); String delegated(); String plain();
    String boom(); String io() throws java.io.IOException; String swallow();
}
interface Helper { String work(); String failing(); }
class HelperImpl implements Helper {
    @Tx public String work() { return "w"; }
    @Tx public String failing() { throw new IllegalStateException("insert into audit_log failed"); }
}
class WorkerImpl implements TxWorker {
    private final Helper helper;                                   // bean khác, được inject dưới dạng proxy
    WorkerImpl(Helper helper) { this.helper = helper; }
    @Tx public String outer() { return "outer|" + inner(); }       // self-invocation: không qua proxy
    @Tx public String inner() { return "inner"; }
    @Tx public String delegated() { return "d|" + helper.work(); } // đi ra bean khác: có qua proxy
    @Tx public String swallow() {
        try { return "d|" + helper.failing(); }
        catch (IllegalStateException swallowed) { return "swallowed"; }   // bug "nuốt lỗi" kinh điển
    }
    public String plain() { return "plain"; }                      // không annotation
    @Tx public String boom() { throw new IllegalStateException("bad state"); }
    @Tx public String io() throws java.io.IOException { throw new java.io.IOException("disk full"); }
}
interface MarkedApi { @Tx String work(); }
class MarkedImpl implements MarkedApi { public String work() { return "marked"; } }

class TxSim {
    static Object wrap(Object target, Class<?> iface, TxLog log) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed = 0, total = 0;
 interface Body { void run() throws Exception; }
 static void check(String name, Body body) { total++; try { body.run(); passed++; System.out.println("PASS " + name); } catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); } }
 static void eq(Object a, Object b) { if (!java.util.Objects.equals(a, b)) throw new AssertionError("expected [" + b + "] but was [" + a + "]"); }
 static Throwable thrown(Body body) { try { body.run(); } catch (Throwable t) { return t; } throw new AssertionError("caller không nhận được exception"); }
 static TxWorker worker(TxLog log, Helper helper) { return (TxWorker) TxSim.wrap(new WorkerImpl(helper), TxWorker.class, log); }
 static Helper helper(TxLog log) { return (Helper) TxSim.wrap(new HelperImpl(), Helper.class, log); }
 public static void main(String[] args) {
  check("proxy cài đúng interface", () -> {
    Object p = TxSim.wrap(new WorkerImpl(null), TxWorker.class, new TxLog());
    if (!(p instanceof TxWorker)) throw new AssertionError("proxy phải cài TxWorker");
    if (!java.lang.reflect.Proxy.isProxyClass(p.getClass())) throw new AssertionError("phải là JDK dynamic proxy");
  });
  check("self-invocation: advice không chạy cho inner", () -> {
    TxLog log = new TxLog(); TxWorker w = worker(log, null);
    eq(w.outer(), "outer|inner");                       // nghiệp vụ vẫn chạy
    eq(log.events, List.of("begin:outer", "commit:outer"));   // nhưng chỉ outer được advice
    eq(log.begins, 1); eq(log.joins, 0);
  });
  check("cùng method inner, gọi từ ngoài qua proxy thì có advice", () -> {
    TxLog log = new TxLog(); TxWorker w = worker(log, null);
    eq(w.inner(), "inner");
    eq(log.events, List.of("begin:inner", "commit:inner"));
    eq(log.begins, 1);
  });
  check("đẩy công việc sang bean thứ hai: REQUIRED tham gia transaction ngoài", () -> {
    TxLog log = new TxLog(); Helper h = helper(log); TxWorker w = worker(log, h);
    eq(w.delegated(), "d|w");
    eq(log.events, List.of("begin:delegated", "join:work", "commit:delegated"));
    eq(log.begins, 1); eq(log.joins, 1); eq(log.commits, 1);
  });
  check("method không annotation thì không mở gì cả", () -> {
    TxLog log = new TxLog(); TxWorker w = worker(log, null);
    eq(w.plain(), "plain");
    eq(log.events, List.of()); eq(log.begins, 0);
  });
  check("RuntimeException rollback và tới caller nguyên vẹn", () -> {
    TxLog log = new TxLog(); TxWorker w = worker(log, null);
    Throwable t = thrown(() -> w.boom());
    if (!(t instanceof IllegalStateException) || !"bad state".equals(t.getMessage())) throw new AssertionError("sai exception: " + t);
    eq(log.events, List.of("begin:boom", "rollback:boom"));
    eq(log.commits, 0); eq(log.rollbacks, 1); eq(log.active, false);
  });
  check("checked exception vẫn commit (mặc định của Spring)", () -> {
    TxLog log = new TxLog(); TxWorker w = worker(log, null);
    Throwable t = thrown(() -> w.io());
    if (!(t instanceof java.io.IOException)) throw new AssertionError("sai exception: " + t);
    eq(log.events, List.of("begin:io", "commit:io")); eq(log.commits, 1); eq(log.rollbacks, 0);
  });
  check("lỗi bị nuốt ở ngoài vẫn đánh dấu transaction rollback-only", () -> {
    TxLog log = new TxLog(); Helper h = helper(log); TxWorker w = worker(log, h);
    eq(w.swallow(), "swallowed");
    eq(log.events, List.of("begin:swallow", "join:failing", "rollback:swallow"));
    eq(log.commits, 0); eq(log.rollbacks, 1);
  });
  check("@Tx khai báo trên interface vẫn có hiệu lực", () -> {
    TxLog log = new TxLog(); MarkedApi m = (MarkedApi) TxSim.wrap(new MarkedImpl(), MarkedApi.class, log);
    eq(m.work(), "marked");
    eq(log.begins, 1); eq(log.events, List.of("begin:work", "commit:work"));
  });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `@java.lang.annotation.Retention(java.lang.annotation.RetentionPolicy.RUNTIME) @interface Tx {}

class TxLog {
    int begins, commits, rollbacks, joins;
    boolean active, rollbackOnly;
    final List<String> events = new ArrayList<>();
}

interface TxWorker {
    String outer(); String inner(); String delegated(); String plain();
    String boom(); String io() throws java.io.IOException; String swallow();
}
interface Helper { String work(); String failing(); }
class HelperImpl implements Helper {
    @Tx public String work() { return "w"; }
    @Tx public String failing() { throw new IllegalStateException("insert into audit_log failed"); }
}
class WorkerImpl implements TxWorker {
    private final Helper helper;
    WorkerImpl(Helper helper) { this.helper = helper; }
    @Tx public String outer() { return "outer|" + inner(); }
    @Tx public String inner() { return "inner"; }
    @Tx public String delegated() { return "d|" + helper.work(); }
    @Tx public String swallow() {
        try { return "d|" + helper.failing(); }
        catch (IllegalStateException swallowed) { return "swallowed"; }
    }
    public String plain() { return "plain"; }
    @Tx public String boom() { throw new IllegalStateException("bad state"); }
    @Tx public String io() throws java.io.IOException { throw new java.io.IOException("disk full"); }
}
interface MarkedApi { @Tx String work(); }
class MarkedImpl implements MarkedApi { public String work() { return "marked"; } }

class TxSim {
    static Object wrap(Object target, Class<?> iface, TxLog log) {
        return java.lang.reflect.Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[] { iface }, (proxy, method, args) -> {
            String name = method.getName();
            if (!transactional(target, method)) return call(target, method, args);   // không có advice
            if (log.active) {                                        // REQUIRED: đã có tx ngoài -> tham gia
                log.joins++;
                log.events.add("join:" + name);
                try { return call(target, method, args); }
                catch (RuntimeException | Error unchecked) { log.rollbackOnly = true; throw unchecked; }
            }
            log.begins++;
            log.active = true;
            log.rollbackOnly = false;
            log.events.add("begin:" + name);
            try {
                Object out = call(target, method, args);
                finish(log, name);                                   // thành công: commit, trừ khi rollback-only
                return out;
            } catch (RuntimeException | Error unchecked) {
                log.rollbacks++;
                log.events.add("rollback:" + name);
                throw unchecked;
            } catch (Exception checked) {                            // checked: Spring commit theo mặc định
                finish(log, name);
                throw checked;
            } finally {
                log.active = false;                                  // Spring gỡ ThreadLocal đúng ở chỗ này
            }
        });
    }
    static void finish(TxLog log, String name) {
        if (log.rollbackOnly) { log.rollbacks++; log.events.add("rollback:" + name); }
        else { log.commits++; log.events.add("commit:" + name); }
    }
    static boolean transactional(Object target, java.lang.reflect.Method proxyMethod) {
        if (proxyMethod.isAnnotationPresent(Tx.class)) return true;  // annotation trên interface
        try {
            return target.getClass().getMethod(proxyMethod.getName(), proxyMethod.getParameterTypes())
                         .isAnnotationPresent(Tx.class);             // hoặc trên class thật
        } catch (NoSuchMethodException missing) { return false; }
    }
    static Object call(Object target, java.lang.reflect.Method proxyMethod, Object[] args) throws Throwable {
        try { return proxyMethod.invoke(target, args); }
        catch (java.lang.reflect.InvocationTargetException wrapped) { throw wrapped.getCause(); }
    }
}`,
      hints: [
        'Proxy.newProxyInstance(loader, interfaces, handler): loader lấy từ iface.getClassLoader(), interfaces là một mảng chỉ gồm iface, handler là lambda trả kết quả của lời gọi. Trong handler, method là method của interface, không phải của class target.',
        'Handler chỉ thấy những lời gọi đi qua proxy. target.outer() gọi inner() tức this.inner() trên target nên không lần nào handler được hỏi về inner.',
        'Coi {{log.active}} như {{TransactionSynchronizationManager}}: bật khi vào transaction ngoài cùng, không cho phép một transaction ngoài cùng thứ hai chồng lên, và luôn hạ xuống trong {{finally}}.{{rollbackOnly}} là cờ mà lời gọi lồng nhau bật lên khi nó lỗi; người kết thúc transaction ngoài cùng mới đọc cờ đó.',
        'Đừng bắt {{Exception}} rồi ném {{new RuntimeException(e)}}: test so **đúng instance** exception gốc. Quên unwrap {{InvocationTargetException}} thì caller sẽ nhận exception lạ thay vì {{IllegalStateException}}.'
      ],
      explain: `Bài tập dựng lại nguyên văn ba quyết định của Spring trong {{TransactionInterceptor}} + {{AbstractPlatformTransactionManager}}.

**Một: advice chỉ chạy ở proxy.** Test "self-invocation" assert {{outer}} sinh đúng {{["begin:outer", "commit:outer"]}} dù nghiệp vụ của {{inner}} vẫn chạy (kết quả là "outer|inner"). Trong Spring thật, {{inner}} khi đó không có transaction riêng: nó chạy nhờ transaction của {{outer}}, và mọi annotation của nó ({{REQUIRES_NEW}}, {{readOnly}}, {{Propagation}}...) bị bỏ qua hoàn toàn. Test "cùng method inner gọi từ ngoài" cho thấy vấn đề không nằm ở annotation hay ở method, mà nằm ở **đường đi của lời gọi**.

**Hai: REQUIRED tham gia, không mở lần hai.** Test "delegated" có {{begins == 1}} nhưng {{joins == 1}}: một connection, một commit. Đây chính là bảng propagation trong bài lesson-spring-003, chỉ khác là lần này bạn nhìn nó bằng số liệu. Đây cũng là lý do "tách bean" (cách sửa số 1) có tác dụng: nó không thay đổi propagation, nó chỉ đưa lời gọi **đi qua proxy** để advice được hỏi.

**Ba: rollback-only và exception.** Test "swallow" mô tả đúng bug {{UnexpectedRollbackException}}: lời gọi lồng nhau báo lỗi, interceptor của nó đánh dấu transaction "chỉ rollback được", method ngoài bắt và nuốt exception rồi tưởng mình thành công — nhưng khi commit, Spring thấy cờ nên rollback toàn bộ và ném lỗi cho caller. {{commits == 0}} ở đây là bài học đáng giá nhất của bài tập: nuốt exception không cứu được transaction.

Bốn chi tiết dễ sai khi làm bài:
- Quên tìm annotation trên **interface**: test "annotation khai báo trên interface" fail. Spring cũng làm đủ hai bước này.
- Đặt {{active = false}} mà không dùng {{finally}}: một lần lỗi khiến mọi lời gọi sau bị coi là transaction ngoài cùng mới.
- Tăng {{commits}} trong nhánh lồng nhau: sẽ có hai commit cho một transaction, không khớp test.
- Bọc exception khi ném lại: caller không bắt được loại exception gốc, và transaction của method ngoài (nếu có) không nhìn đúng loại lỗi.

Nâng cấp để gần Spring hơn: cho {{wrap}} hỗ trợ {{REQUIRES_NEW}} bằng cách lưu {{active}} cũ, đặt {{active = false}} tạm, rồi khôi phục trong {{finally}} (Spring gọi là "suspend"); hoặc cho {{@Tx}} thuộc tính {{rollbackFor}} để tested behaviour giống lesson-spring-003. Sau đó bạn sẽ tự thấy: vấn đề của self-invocation **không phải** do transaction manager, mà do proxy chỉ có một cửa vào.`
    }],
    check: [
        { q: '{{ImportService.run()}} mang {{@Transactional}} và gọi {{this.saveOther()}}; {{saveOther()}} mang {{@Transactional(propagation = REQUIRES_NEW)}}. Kết quả thực tế?', options: ['{{saveOther}} chạy trong transaction mới độc lập vì nó có annotation riêng', '{{saveOther}} chạy ngay trong transaction của {{run}}: lời gọi nội bộ không đi qua proxy nên interceptor của nó không bao giờ được gọi', 'Spring ném lỗi vì {{REQUIRES_NEW}} không được nesting', 'Không có transaction nào được mở, kể cả của {{run}}'], answer: 1, explain: `Annotation chỉ có tác dụng khi lời gọi tới **proxy**. {{this.saveOther()}} là lời gọi nội bộ trên target nên interceptor của nó không chạy, và transaction của {{run}} vẫn bao trọn — {{REQUIRES_NEW}} bị phớt lờ một cách im lặng. {{run}} thì vẫn có transaction vì caller gọi {{run}} qua proxy. Không có lỗi nesting nào cả; đây đúng là kiểu lỗi "nhìn code rất hợp lý" nguy hiểm nhất.` },
        { q: 'Bạn cần method inner thực sự mở transaction riêng, nhưng không muốn tách bean. Cách nào **ít** gây ngạc nhiên cho người đọc nhất?', options: ['Dùng {{TransactionTemplate}} để mở transaction bằng code ngay trong method', 'Bật {{exposeProxy = true}} rồi gọi {{((ImportService) AopContext.currentProxy()).saveOther()}}', 'Đánh dấu {{saveOther}} là private để Spring tự inner', 'Đặt {{@Transactional}} ở cấp class và mong Spring chặn mọi lời gọi'], answer: 0, explain: `{{TransactionTemplate}} nói thẳng "ở đây có một transaction" ngay tại chỗ cần nó, không phụ thuộc proxy, và unit test vẫn chạy được. {{AopContext.currentProxy}} chạy được nhưng là **cơ chế của Spring** rò vào business code, và nổ {{IllegalStateException}} khi object không phải proxy (ví dụ trong test). Private thì proxy không chặn nổi. Class-level annotation cũng vẫn chỉ áp dụng cho lời gọi đi qua proxy.` },
        { q: 'Đâu là cách nhanh nhất để **chứng minh** một method đang không có transaction?', options: ['Đọc log build xem có dòng "Created proxy" không', 'In {{TransactionSynchronizationManager.isActualTransactionActive()}} ngay đầu method, hoặc gọi {{TransactionAspectSupport.currentTransactionStatus()}} và xem nó có ném {{NoTransactionException}} không', 'Đổi method sang {{REQUIRED}} rồi chạy lại test', 'Kiểm tra {{spring.datasource.autocommit}} trong application.yaml'], answer: 1, explain: `{{isActualTransactionActive()}} trả lời đúng câu hỏi "thread này đang có transaction chưa" tại chính dòng code đó — nếu nó false bên trong method có {{@Transactional}} thì lời gọi không đi qua proxy. {{currentTransactionStatus()}} ném {{NoTransactionException}} trong cùng tình huống. Log "Created proxy" chỉ cho biết bean **có** proxy, không cho biết lời gọi cụ thể đi đường nào; đổi propagation không sửa được self-invocation; autocommit là chuyện của connection, không phải của Spring transaction.` },
        { q: 'Method {{@Transactional private void flush()}} được gọi từ method public cùng bean. Transaction có mở không?', options: ['Có, vì Spring quét bytecode của mọi method', 'Không: private không bị proxy chặn, và lời gọi nội bộ cũng không qua proxy', 'Có, nếu chuyển sang JDK proxy', 'Chỉ khi {{flush}} trả về non-void'], answer: 1, explain: `Hai lớp lỗi cộng dồn: lớp con CGLIB không override được method private (JDK proxy thì càng không), nên kể cả gọi từ bean khác cũng vô ích; đồng thời đây còn là self-call nên không có proxy nào đứng giữa. Spring không "quét rồi tự chạy" annotation. JDK proxy không khá hơn — nó còn yêu cầu interface. Kiểu trả về không liên quan.` }
    ],
    related: ['spring-004', 'spring-028', 'spring-006'], tags: ['@Transactional', 'AOP', 'proxy', 'self-invocation', 'TransactionTemplate']
  },
  {
    id: 'lesson-spring-011', track: 'spring', order: 11,
    title: 'Vòng phụ thuộc bean: early reference, ba cấp cache và cách thiết kế lại', level: 'senior', minutes: 45,
    goals: [
      'Giải thích vì sao constructor cycle vô phương cứu, còn field cycle thì container phá được',
      'Mô tả ba cấp singleton cache và lý do Spring lưu {{ObjectFactory}} thay vì object',
      'Bốn kỹ thuật xoá vòng kèm trade-off, và cách đọc thông báo cycle của Spring Boot 2.6+',
      'Viết mini container phát hiện cycle và in ra đúng đường đi {{A -> B -> C -> A}}',
    ],
    body: `**Tóm tắt:** vòng phụ thuộc là một **chu trình** trong đồ thị bean: A cần B, B cần A. Container chỉ phá được chu trình khi nó đưa ra được một object **chưa hoàn chỉnh** (early reference) cho bean khác đang được tạo — điều chỉ làm được với field/setter injection. Với constructor injection thì không tồn tại thứ tự tạo hợp lệ, nên Spring báo lỗi ngay lúc khởi động. Từ Spring Boot 2.6, khả năng "tự phá vòng" bị **tắt mặc định**.

### Vòng constructor: bài toán không có lời giải
Vấn đề không phải Spring lười, mà là **logic**. Muốn chạy {{new A(b)}} thì phải có {{b}} **xong trước**; muốn có {{b}} xong trước thì phải chạy {{new B(a)}} — cần {{a}} đã xong. Không tồn tại điểm bắt đầu.

~~~text
getBean(A)  ->  new A(??)  cần B hoàn chỉnh
                     getBean(B)  ->  new B(??)  cần A hoàn chỉnh
                          getBean(A)  ->  A đang được tạo, chưa có gì để đưa   X
~~~

Ví dụ đời thường: hai người ký giấy cho nhau, ai cũng "chỉ ký sau khi thấy giấy kia đã ký". Field/setter injection thì khác: {{new A()}} không cần gì cả, tạo được ngay một object **có địa chỉ bộ nhớ** dù các field còn null. Java cho phép hai object tham chiếu lẫn nhau, chỉ cần địa chỉ đã tồn tại — đó là toàn bộ cơ chế phá vòng.

### Spring làm việc đó thế nào: ba cấp cache
Bean registry của {{DefaultSingletonBeanRegistry}} có ba bản đồ, sắp theo mức "hoàn chỉnh":

| Cấp | Bản đồ | Chứa gì | Ai đọc |
|---|---|---|---|
| 1 | {{singletonObjects}} | bean **đã hoàn chỉnh** | mọi {{getBean}} thông thường |
| 2 | {{earlySingletonObjects}} | early reference, **có thể đã là proxy** | bean khác đang cần A giữa chừng |
| 3 | {{singletonFactories}} | {{ObjectFactory}} — "công thức" tạo early reference, **chưa chạy** | chỉ chạy khi thật sự có người xin |

Đường đi của một bean đơn (rút gọn từ {{doCreateBean}}):

1. {{getSingleton(type)}} — kiểm tra cấp 1. Chưa có?
2. Đánh dấu bean đang được tạo ({{singletonsCurrentlyInCreation}} — đây là nơi sinh ra {{BeanCurrentlyInCreationException}} khi phát hiện cycle).
3. {{createBeanInstance}} — gọi constructor (các dependency **đã phải xong**, nên cycle ở đây chết).
4. {{addSingletonFactory}} — ghi vào **cấp 3**: "nếu ai cần tham chiếu sớm của A thì gọi lambda này".
5. {{populateBean}} — inject field/setter; nếu gặp B và B lại cần A, Spring gọi {{getSingleton(A, true)}} → chạy factory cấp 3 → bean ra **cấp 2** rồi trả về.
6. {{initializeBean}} ({{@PostConstruct}}, {{afterPropertiesSet}}) rồi đẩy kết quả vào **cấp 1**, xoá cấp 2 và cấp 3.

Vì sao phải có cấp 3 (factory) chứ không nhét thẳng instance vào cấp 2? Vì bean có AOP ({{@Transactional}}, {{@Cacheable}}...) **không được** lộ ra dưới dạng object thô. Spring muốn hoãn việc tạo proxy tới lúc **thực sự** có người xin tham chiếu sớm. Factory ở cấp 3 cho phép "chưa quyết định gì cả" và không tốn chi phí; chỉ khi bean khác xin, {{SmartInstantiationAwareBeanPostProcessor}} mới tạo proxy một lần và bỏ vào cấp 2, để mọi bên sau đó nhận **cùng một** object. Đây là chỗ nối trực tiếp với lesson-spring-010: nếu early reference là object thô mà proxy được tạo sau, bạn sẽ có hai identity khác nhau trong đồ thị — và bug kiểu "field null khó hiểu" là hậu quả của việc sai ở bước này.

~~~seq
title: Spring phá vòng qua field injection
actors: App | Container | Order | Payment
App -> Container: getBean(Order)
Container -> Order: new Order() (field còn null)
Container -> Container: ghi ObjectFactory của Order
Order -> Container: populate: cần Payment
Container -> Payment: new Payment()
Payment -> Container: populate: cần Order
Container -> Order: trả early reference
Payment --> Container: Payment hoàn tất
Order --> App: Order hoàn tất
note Order..Payment: cả hai trỏ đúng instance thật
~~~

### Spring Boot 2.6+ tắt khả năng đó, và vì sao nên để nó tắt
{{SpringApplication}} có cờ {{setAllowCircularReferences(false)}} — nay là mặc định, biểu hiện qua {{spring.main.allow-circular-references=false}}. Khởi động fail sớm và in ra **đường đi** của vòng, dạng:

~~~text
The dependencies of some of two beans in the container form a cycle;
the application context could not be started. We found the following cycle:
  Bean 'orderService' - field 'payment' with required bean 'paymentService'
  Bean 'paymentService' - field 'order' with required bean 'orderService'
Action:
  Break the cycle, or switch to constructor injection with @Lazy...
~~~

Lý do đổi mặc định rất thực dụng: (1) early reference là object **chưa chạy** {{@PostConstruct}} và chưa validate gì, nên B nhận về một A "nửa vời" và lỗi lộ ra ở thì tương lai, rất khó truy; (2) thứ tự khởi tạo proxy/lifecycle dễ sai như đoạn trên; (3) quan trọng nhất — chu trình thường là dấu hiệu **ranh giới class chưa tách đúng**, mà một lá cờ thì che bệnh đi thay vì chữa. Bật cờ là hợp lệ khi bạn cần nâng cấp gấp để chạy tiếp, nhưng phải xem nó như giải pháp tạm có thời hạn.

### Bốn cách xoá vòng một cách đàng hoàng
1. **Tách phần chung ra bean thứ ba.** A và B hay cãi nhau vì cả hai đều muốn dùng chung một logic; đặt logic đó ở C thì A → C và B → C, hết chu trình.
2. **Đảo chiều phụ thuộc (Dependency Inversion).** Nếu A chỉ cần "đọc số dư" từ B, cho A phụ thuộc một interface {{BalanceReader}} mà B cài đặt. Mũi tên nghiệp vụ quay ngược lại, đồ thị thành DAG.
3. **Biến lời gọi thành sự kiện.** A phát hành {{OrderPaidEvent}}, B là listener. Cạnh A → B biến mất, chỉ còn A → publisher. Nhớ đọc lesson-spring-009: {{AFTER_COMMIT}} và outbox quyết định event có bị mất hay không.
4. **Làm dependency thành lười.** {{@Lazy}} trên **tham số constructor** bơm vào một proxy lười (lazy proxy): bean được tạo ngay, chu trình bị cắt, và B chỉ resolve khi A gọi method đầu tiên. Cùng mục đích nhưng tường minh hơn: {{ObjectProvider<PaymentService>}}, gọi {{.getObject()}} khi cần.

~~~java
@Service
class OrderService {
    private final ObjectProvider<PaymentService> payments;   // không resolve lúc khởi tạo

    OrderService(ObjectProvider<PaymentService> payments) { this.payments = payments; }

    void refund(String id) {
        payments.getObject().refund(id);                      // resolve lần đầu tại đây
    }
}
~~~

| Cách | Khi nào chọn | Đánh đổi |
|---|---|---|
| Tách bean thứ ba | hai service trùng một trách nhiệm | thêm một class, nhưng thiết kế thật sự sạch |
| Đảo chiều qua interface | phụ thuộc "ngược tầng" (service gọi lại controller/adapter) | phải định nghĩa abstraction ổn định |
| Sự kiện | A không cần **kết quả** của B ngay | bất đồng bộ, cần suy nghĩ về mất event |
| {{@Lazy}} / {{ObjectProvider}} | cycle do lịch sử để lại, chưa refactor được ngay | vẫn còn cycle trong đồ thị, chỉ không nổ lúc boot |

### Vòng phụ thuộc hay "tự lộ" khi bạn không ngờ tới
Thêm **một** tham số constructor vào một bean giữa chuỗi A → B → C cũng đủ biến đồ thị thành chu trình — vì vậy code đang chạy tốt có thể fail khởi động sau một commit trông rất vô hại. Constructor injection giúp bạn trả giá **lúc khởi động** (tốt) thay vì lúc 2h sáng với {{NullPointerException}} ở field chưa inject (rất xấu). Ở tầng kiến trúc, quy tắc "service không được phụ thuộc repository của feature khác" nên được kiểm bằng test kiến trúc ({{beFreeOfCycles}}) hoặc tối thiểu là code review, vì container chỉ báo cycle **cấp bean**, không báo cycle **cấp package/module** (thứ gây ra vòng trong microservice khi hai team gọi nhau).

### Liên hệ phỏng vấn
Cấu trúc trả lời được đánh giá cao: (1) phân loại cycle — constructor thì vô phương, field/setter thì container **có thể** phá bằng early reference; (2) nói được cơ chế ba cấp cache và lý do cần {{ObjectFactory}} (proxy); (3) nêu mặc định Boot 2.6+ và vì sao; (4) đưa ít nhất hai cách sửa, xếp theo độ "đàng hoàng": tách bean / đảo chiều / event, rồi {{@Lazy}} như lựa chọn cuối. Câu đào sâu: "vòng tự reference {{A}} inject {{A}} thì sao?" (cũng là cycle; và nếu mục đích là gọi qua proxy để có {{@Transactional}} thì đã có cách khác: {{TransactionTemplate}}); "gọi {{getBean}} thủ công có phá được cycle không?" (về kỹ thuật được, nhưng đó là service locator — dependency bị ẩn trong method).

> Senior tip: Khi gặp báo cycle, đừng nhìn hai bean cãi nhau — hãy nhìn **trách nhiệm** nào đang bị xẻ đôi giữa chúng. Chín trên mười lần, refactor đúng (tách bean thứ ba hoặc đưa xuống tầng domain) vừa xoá vòng vừa làm cả hai class dễ test hơn. Và khi code review, hãy nghi một class có hơn 6–7 dependency trong constructor: đó thường là thứ sẽ tạo cycle ở commit kế tiếp.`,
    exercises: [{
      title: 'Mini container báo đúng đường đi của vòng phụ thuộc',
      prompt: `Hoàn thiện {{CycleContainer}} — mô phỏng {{DefaultSingletonBeanRegistry}} ở mức tối giản. Cờ {{allowCircularReferences}} trong constructor tương ứng {{spring.main.allow-circular-references}}.

API ({{type}} luôn là class có **đúng một** constructor):
- {{define(Class<T> type)}}: đăng ký bean chỉ có dependency qua constructor (suy từ tham số constructor).
- {{define(Class<T> type, Class<?>... fieldDeps)}}: đăng ký bean và khai báo thêm các type nó sẽ nhận **qua field** sau khi đã tạo xong instance.
- {{get(Class<T> type)}}: trả về singleton — tạo nếu chưa tạo, và **đúng instance cũ** nếu đã tạo.

Hành vi cần mô phỏng:
1. **Constructor dependency**: được resolve **trước** khi gọi constructor. Nếu type đang được tạo dở (có mặt trong "stack đang tạo") thì đó là vòng constructor, **không có early reference nào cứu được** — dù {{allowCircularReferences}} là {{true}}.
2. **Field dependency**: resolve **sau** khi đã tạo instance, và instance đó phải được ghi nhớ như "early reference" **trước khi** populate field. Nhờ vậy một vòng **qua field** giải được khi {{allowCircularReferences == true}}: bean đang tạo dở được trả ra ngay (cùng instance), hai bean tham chiếu nhau hợp lệ.
3. Nếu {{allowCircularReferences == false}} thì vòng qua field **cũng bị từ chối** (đúng mặc định Spring Boot 2.6+).
4. Type chưa đăng ký (kể cả khi nó là dependency của bean khác) → ném {{IllegalStateException}} với message đúng bằng {{"Unregistered: " + simpleName}}.
5. Mọi trường hợp cycle → ném {{IllegalStateException}} với message **chứa** {{"Circular dependency: "}} rồi tới đường đi, các simple name nối bằng {{" -> "}}, bắt đầu từ bean **lặp lại** và kết thúc bằng chính nó. Ví dụ {{get(Ctor1.class)}} với Ctor1 → Ctor2 → Ctor3 → Ctor1 phải cho {{"Circular dependency: Ctor1 -> Ctor2 -> Ctor3 -> Ctor1"}}; vòng tự reference cho {{"Mirror -> Mirror"}}.
6. Một lần {{get}} thất bại **không** làm hỏng container: {{finally}} phải gỡ khỏi stack đang tạo để bean khác vẫn tạo được, và lần {{get}} lại cùng vòng phải báo **lại đúng** cycle.
7. Khi gán field, chỉ gán nếu field tương ứng còn {{null}} và bean có field đó; dùng reflection như {{MiniContainer}} bài trước dùng với constructor.

Fixture có sẵn: {{Audit}}, {{Ledger}} (constructor), {{Ctor1}}, {{Ctor2}}, {{Ctor3}} (vòng constructor), {{Order}}, {{Payment}} (vòng field), {{Mirror}} (tự reference qua field).`,
      starter: `class CycleContainer {
    private final boolean allowCircularReferences;

    CycleContainer(boolean allowCircularReferences) { this.allowCircularReferences = allowCircularReferences; }

    <T> void define(Class<T> type) { throw new UnsupportedOperationException("TODO"); }
    <T> void define(Class<T> type, Class<?>... fieldDeps) { throw new UnsupportedOperationException("TODO"); }
    <T> T get(Class<T> type) { throw new UnsupportedOperationException("TODO"); }
}

class Audit {}
class Ledger { final Audit audit; Ledger(Audit audit) { this.audit = audit; } }

class Ctor1 { Ctor2 dep; Ctor1(Ctor2 dep) {} }
class Ctor2 { Ctor3 dep; Ctor2(Ctor3 dep) {} }
class Ctor3 { Ctor1 dep; Ctor3(Ctor1 dep) {} }

class Order { Payment payment; }        // field được container gán sau khi tạo instance
class Payment { Order order; }
class Mirror { Mirror self; }`,
      tests: `public class Main {
 static int passed = 0, total = 0;
 interface Body { void run() throws Exception; }
 static void check(String name, Body body) { total++; try { body.run(); passed++; System.out.println("PASS " + name); } catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); } }
 static void eq(Object a, Object b) { if (!java.util.Objects.equals(a, b)) throw new AssertionError("expected [" + b + "] but was [" + a + "]"); }
 static void same(Object a, Object b) { if (a != b) throw new AssertionError("hai instance khác nhau: " + a + " vs " + b); }
 static void cycle(Body body, String path) {
  Throwable thrown = null;
  try { body.run(); } catch (Throwable t) { thrown = t; }
  if (!(thrown instanceof IllegalStateException)) throw new AssertionError("không báo cycle bằng IllegalStateException: " + thrown);
  eq(thrown.getMessage(), "Circular dependency: " + path);
 }
 static CycleContainer lenient() { CycleContainer c = new CycleContainer(true); register(c); return c; }
 static CycleContainer strict() { CycleContainer c = new CycleContainer(false); register(c); return c; }
 static void register(CycleContainer c) {
  c.define(Audit.class); c.define(Ledger.class);
  c.define(Ctor1.class); c.define(Ctor2.class); c.define(Ctor3.class);
  c.define(Order.class, Payment.class); c.define(Payment.class, Order.class);
  c.define(Mirror.class, Mirror.class);
 }
 public static void main(String[] args) {
  check("constructor injection and singleton cache", () -> {
    CycleContainer c = lenient();
    Ledger l = c.get(Ledger.class);
    same(l.audit, c.get(Audit.class));
    same(l, c.get(Ledger.class));
  });
  check("type chưa đăng ký thì báo Unregistered", () -> {
    CycleContainer c = new CycleContainer(true);
    try { c.get(Ledger.class); throw new AssertionError("đã tự tạo bean chưa đăng ký"); }
    catch (IllegalStateException e) { eq(e.getMessage(), "Unregistered: Ledger"); }
    c.define(Ledger.class);                       // đăng ký thiếu Audit: lỗi phải chỉ ra Audit
    try { c.get(Ledger.class); throw new AssertionError("không báo thiếu dependency"); }
    catch (IllegalStateException e) { eq(e.getMessage(), "Unregistered: Audit"); }
  });
  check("vòng constructor không phá được, báo cả đường đi", () -> {
    cycle(() -> lenient().get(Ctor1.class), "Ctor1 -> Ctor2 -> Ctor3 -> Ctor1");
    cycle(() -> strict().get(Ctor1.class), "Ctor1 -> Ctor2 -> Ctor3 -> Ctor1");
  });
  check("vòng field dùng early reference khi được phép", () -> {
    CycleContainer c = lenient();
    Order o = c.get(Order.class);
    Payment p = c.get(Payment.class);
    same(p, o.payment); same(o, p.order); same(o, c.get(Order.class));
  });
  check("vòng field bị từ chối theo mặc định, kèm đường đi", () -> {
    cycle(() -> strict().get(Order.class), "Order -> Payment -> Order");
    cycle(() -> strict().get(Payment.class), "Payment -> Order -> Payment");
  });
  check("tự reference qua field", () -> {
    CycleContainer c = lenient();
    Mirror m = c.get(Mirror.class);
    same(m, m.self);
    cycle(() -> strict().get(Mirror.class), "Mirror -> Mirror");
  });
  check("container vẫn dùng được sau khi một lần tạo thất bại", () -> {
    CycleContainer c = lenient();
    cycle(() -> c.get(Ctor1.class), "Ctor1 -> Ctor2 -> Ctor3 -> Ctor1");
    Ledger l = c.get(Ledger.class);
    same(l.audit, c.get(Audit.class));
    cycle(() -> c.get(Ctor1.class), "Ctor1 -> Ctor2 -> Ctor3 -> Ctor1");
    cycle(() -> c.get(Ctor2.class), "Ctor2 -> Ctor3 -> Ctor1 -> Ctor2");
  });
  check("early reference giữ đúng identity của bean", () -> {
    CycleContainer c = lenient();
    Payment p = c.get(Payment.class);              // Payment xin Order trong lúc Order đang tạo
    Order o = c.get(Order.class);
    same(o, p.order); same(o, c.get(Order.class)); eq(p, o.payment);
  });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `class Audit {}
class Ledger { final Audit audit; Ledger(Audit audit) { this.audit = audit; } }
class Ctor1 { Ctor2 dep; Ctor1(Ctor2 dep) {} }
class Ctor2 { Ctor3 dep; Ctor2(Ctor3 dep) {} }
class Ctor3 { Ctor1 dep; Ctor3(Ctor1 dep) {} }
class Order { Payment payment; }
class Payment { Order order; }
class Mirror { Mirror self; }

class CycleContainer {
    private final boolean allowCircularReferences;
    private final Map<Class<?>, List<Class<?>>> fieldDeps = new HashMap<>();
    private final Map<Class<?>, Object> singletons = new LinkedHashMap<>();   // cấp 1
    private final Map<Class<?>, Object> early = new HashMap<>();              // cấp 2 (early reference)
    private final Set<Class<?>> creating = new LinkedHashSet<>();             // stack "đang tạo", có giữ thứ tự

    CycleContainer(boolean allowCircularReferences) { this.allowCircularReferences = allowCircularReferences; }

    <T> void define(Class<T> type) { define(type, new Class<?>[0]); }
    <T> void define(Class<T> type, Class<?>... deps) { fieldDeps.put(type, List.of(deps)); }

    @SuppressWarnings("unchecked") <T> T get(Class<T> type) { return (T) create(type, false); }

    private Object create(Class<?> type, boolean fromField) {
        if (singletons.containsKey(type)) return singletons.get(type);
        if (creating.contains(type)) {                       // cycle: A đang dở mà cần lại chính A
            if (fromField && allowCircularReferences && early.containsKey(type)) return early.get(type);
            throw new IllegalStateException("Circular dependency: " + pathOf(type));
        }
        List<Class<?>> deps = fieldDeps.get(type);
        if (deps == null) throw new IllegalStateException("Unregistered: " + type.getSimpleName());
        creating.add(type);
        try {
            java.lang.reflect.Constructor<?> ctor = type.getDeclaredConstructors()[0];
            Object[] args = Arrays.stream(ctor.getParameterTypes()).map(t -> create(t, false)).toArray();
            ctor.setAccessible(true);
            Object bean = ctor.newInstance(args);            // constructor dependency bắt buộc phải xong trước
            early.put(type, bean);                           // cấp 2: cho phép vòng qua field
            for (Class<?> dep : deps) wire(bean, dep, create(dep, true));
            singletons.put(type, bean);                      // xong: đưa lên cấp 1
            return bean;
        } catch (ReflectiveOperationException e) { throw new IllegalStateException(type + ": " + e, e); }
        finally { creating.remove(type); early.remove(type); }
    }

    private String pathOf(Class<?> repeat) {
        List<String> names = new ArrayList<>();
        boolean started = false;
        for (Class<?> c : creating) {
            if (c == repeat) started = true;
            if (started) names.add(c.getSimpleName());
        }
        names.add(repeat.getSimpleName());                   // lặp lại để đóng vòng
        return String.join(" -> ", names);
    }

    private static void wire(Object bean, Class<?> dep, Object value) {
        for (java.lang.reflect.Field field : bean.getClass().getDeclaredFields()) {
            if (java.lang.reflect.Modifier.isStatic(field.getModifiers())) continue;
            if (!field.getType().isAssignableFrom(dep)) continue;
            field.setAccessible(true);
            try {
                if (field.get(bean) == null) { field.set(bean, value); return; }
            } catch (IllegalAccessException e) { throw new IllegalStateException(e); }
        }
    }
}`,
      hints: [
        'Cần bốn cấu trúc: một {{Map}} type → danh sách field deps đã đăng ký, {{Map}} singleton (cấp 1), {{Map}} early reference (cấp 2), và một {{Set}} **giữ thứ tự** các type đang tạo ({{LinkedHashSet}}) để in được đường đi. Hàm {{create}} nên nhận thêm cờ {{boolean fromField}} để phân biệt hai loại cycle.',
        'Thứ tự quyết định hành vi: {{singletons}} trước, rồi {{creating}}, rồi mới kiểm tra đã đăng ký chưa. Vòng constructor ném lỗi ngay ở bước 2 vì {{fromField == false}}; vòng field thì {{fromField == true}} nên được trả {{early}} instance (nếu {{allowCircularReferences}}).',
        'Ghi {{early}} **ngay sau khi gọi constructor** và **trước khi** populate field — đó chính là {{addSingletonFactory}}. Nếu ghi sau khi populate xong thì vòng không bao giờ phá được.',
        'Đường đi: duyệt {{creating}} theo thứ tự chèn, tìm phần tử đầu tiên trùng type bị lặp, in từ đó tới hết rồi lặp lại tên đó lần cuối. {{creating.remove(type)}}, {{early.remove(type)}} phải nằm trong {{finally}}, nếu không một lần lỗi sẽ khiến các Bean khác bị báo cycle giả.',
        'Gán field bằng {{getDeclaredFields()}}, lọc field không static có {{getType().isAssignableFrom(dep)}} và đang {{null}}, rồi {{setAccessible(true)}} + {{set}}.'
      ],
      explain: `Bài tập này tái hiện đúng ba quyết định trong {{AbstractAutowireCapableBeanFactory.doCreateBean}}.

**Constructor vs field là hai thế giới khác nhau.** Test "vòng constructor không phá được" chạy với {{allowCircularReferences == true}} mà vẫn lỗi: tại thời điểm cần tham số, bean kia **chưa tồn tại** nên không có gì để đưa. Test "vòng field" thì qua, vì instance đã được tạo và ghi vào {{early}} trước khi populate — đó chính là early reference. Spring Boot 2.6+ quyết định không dùng cơ chế này nữa mặc định, nên cùng một đồ thị, app cũ chạy, app mới fail khởi động: hai assert "{{vòng field bị từ chối theo mặc định}}" mô phỏng đúng thay đổi đó, và thông báo có **đường đi** là thứ giúp bạn định vị trong 30 giây.

**{{finally}} là bài học thật.** Test "container vẫn dùng được sau khi một lần tạo thất bại" bắt lỗi quên gỡ {{creating}}/{{early}}. Không gỡ {{creating}} thì bean kế tiếp ({{Ledger}}) bị báo cycle giả; gỡ nhưng xoá bằng {{clear()}} thì lại phá cả stack của caller ở tầng trên. Spring cũng làm vậy: {{DefaultSingletonBeanRegistry.getSingleton}} có {{try/finally}} để gỡ dấu "đang tạo" cho riêng bean đó.

**Identity, không phải bản sao.** Test "early reference giữ đúng identity" bắt đầu từ {{Payment}} để buộc Order được tạo làm early reference, rồi assert {{c.get(Order.class)}} **là đúng cái** {{Payment}} đã nhận. Nếu implementation của bạn trả về instance mới mỗi lần xin early reference thì {{o.payment != p}} — đây chính xác là loại bug "field null lúc 2h sáng" mà early reference + proxy tạo ra trong Spring thật khi cấp 2 và cấp 3 không nhất quán.

Bốn chỗ dễ sai khác:
- Quên cờ {{fromField}} và đồng nhất mọi cycle thành một loại → vòng field bị báo sai, hoặc ngược lại vòng constructor "chạy được" (sai hoàn toàn bản chất).
- {{List.of(deps)}} cho varargs rỗng → list trống, fine; nhưng đừng {{null}} để rồi NPE.
- {{field.set}} trên field {{final}} ({{Ledger.audit}}): với object vừa tạo bằng reflection thì hợp lệ, nhưng nếu bạn gán {{Ledger.audit}} qua wire thì test singleton fail — field deps chỉ dành cho type đã khai báo.
- Báo "{{Circular dependency:}}" **kèm** tên bean ở cả hai phía nhưng không có "{{->}}" → assert chuỗi không khớp; format là một phần của đặc tả, vì nó chính là thứ bạn dán vào ticket.

Muốn gần Spring hơn: đổi {{early}} thành {{Map<Class<?>, Supplier<Object>>}} (cấp 3 thật sự là {{ObjectFactory}}), và khi bean có "AOP" — ví dụ implement một interface {{Proxied}} — thì factory trả về proxy của instance thay vì instance thô. Bạn sẽ thấy ngay vì sao cấp 3 cần thiết chứ không phải thừa.`
    }],
    check: [
        { q: 'Ứng dụng Spring Boot 3 có {{A(B b)}} trong constructor và {{B(A a)}}, không cấu hình gì thêm. Kết quả?', options: ['Chạy bình thường, vì Spring luôn giải được vòng', 'Khởi động thất bại với thông báo mô tả đường đi của vòng: constructor cycle không phá được bằng early reference', 'Spring tạo hai instance cho mỗi bean để phá vòng', 'Chỉ lỗi khi có request đầu tiên đi qua {{A}}'], answer: 1, explain: `{{new A(b)}} đòi {{b}} đã hoàn chỉnh và ngược lại, nên không tồn tại thứ tự tạo; container báo {{BeanCurrentlyInCreationException}} (Boot in thành thông báo "form a cycle" kèm đường đi) ngay lúc refresh context. Trường hợp "chạy bình thường" chỉ đúng với vòng **qua field/setter** và khi {{allow-circular-references = true}} (mặc định cũ, trước Boot 2.6). Spring không nhân bản bean để phá vòng, và lỗi xảy ra lúc khởi động chứ không chờ request.` },
        { q: 'Vòng {{Order}} ↔ {{Payment}} qua field injection, {{spring.main.allow-circular-references=true}}. Điều nào ĐÚNG?', options: ['{{Payment}} nhận một bản sao khác của {{Order}}', 'Một trong hai bean nhận tham chiếu tới object **chưa chạy** {{@PostConstruct}} và chưa được populate đầy đủ', 'Spring tự chuyển hai bean sang scope {{prototype}}', 'Bean được inject muộn hơn, ngay lần gọi đầu tiên'], answer: 1, explain: `Early reference được lấy ra ở cấp 2 **sau bước tạo instance, trước initializeBean**, nên bean nhận về thấy field chưa gán và callback khởi tạo chưa chạy. Đó chính là lý do mặc định mới tắt cơ chế này. Hai bean vẫn là singleton duy nhất (không bản sao), không có đổi scope, và việc inject xảy ra lúc khởi tạo chứ không đợi lần gọi đầu.` },
        { q: 'Bạn nâng app từ Spring Boot 2.5 lên 2.7 mà **không sửa code**, app fail khởi động vì circular reference. Cách xử lý nào đúng tinh thần nhất?', options: ['Đặt {{spring.main.allow-circular-references=true}} để như cũ', 'Đọc đường đi trong thông báo rồi phá vòng: tách bean thứ ba, đảo chiều phụ thuộc qua interface, hoặc đẩy sang event; {{@Lazy}} chỉ là giải pháp tạm', 'Chuyển hết field injection sang constructor injection', 'Xoá một trong hai bean'], answer: 1, explain: `Mặc định 2.6+ phản ánh một quyết định thiết kế: cycle là nợ kỹ thuật, thông báo đã chỉ rõ đường đi để bạn sửa đúng chỗ. Bật lại cờ thì app chạy nhưng giữ nguyên cấu trúc vòng và nhận thêm early reference "nửa vời". Chuyển **hết** sang constructor injection làm cycle lộ ra ngay cả với những vòng trước đó từng phá được — không phải cách sửa. Xoá bean là thay đổi hành vi.` },
        { q: '{{ObjectProvider<X>}} và {{@Lazy}} trên tham số constructor giúp gì cho vòng phụ thuộc?', options: ['Làm container tạo thêm một instance X nữa', 'Cắt chu trình lúc khởi tạo: dependency chỉ được resolve khi **lần đầu sử dụng**, nên đồ thị ban đầu không cần X hoàn chỉnh', 'Tự động phá cycle mà không cần chú ý tới thứ tự khởi tạo nữa', 'Chuyển bean X sang scope {{request}}'], answer: 1, explain: `{{@Lazy}} inject một proxy chưa resolve; {{ObjectProvider}} là "cái núm xoay chậm": cả hai đều hoãn {{getBean(X)}} tới lúc gọi {{getObject()}}, đủ để {{A}} được tạo xong mà không cần {{B}} hoàn chỉnh. Không có instance thừa, scope không đổi. Và cycle vẫn còn trong thiết kế — đồ thị thật chỉ được cắt ở thì khởi động, nên nếu {{B}} chưa init xong thì lỗi vẫn có thể xuất hiện về sau.` }
    ],
    related: ['spring-008', 'spring-001', 'spring-028'], tags: ['circular dependency', 'DI', 'early reference', 'BeanCurrentlyInCreationException', '@Lazy']
  },
  {
    id: 'lesson-spring-012', track: 'spring', order: 12,
    title: 'Spring Security: filter chain xác thực và phân quyền', level: 'senior', minutes: 45,
    goals: [
      'Vẽ được đường đi request qua DelegatingFilterProxy, FilterChainProxy và SecurityFilterChain',
      'Phân biệt xác thực và phân quyền; biết 401 khác 403 và xử lý như thế nào',
      'Cấu hình nhiều chain cho các path khác nhau và xếp thứ tự bằng {{@Order}}'
    ],
    body: `**Tóm tắt:** Spring Security không để controller tự kiểm tra bảo mật. Thay vào đó, nó đặt một chuỗi **Servlet Filter** (bộ lọc — thành phần của tiêu chuẩn server web Java như Tomcat, chạy trước khi request tới controller) trước mọi request. Request đi qua {{DelegatingFilterProxy}} (cầu nối giữa Tomcat và Spring), rồi {{FilterChainProxy}} chọn chain phù hợp với đường dẫn và chạy lần lượt các filter: xác thực trước, phân quyền sau. Chưa chứng minh danh tính → {{401 Unauthorized}}; đã chứng minh nhưng không đủ quyền → {{403 Forbidden}}.

### Servlet Filter là gì
Filter là thành phần của Servlet specification (chuẩn của server web Java). Nó ngồi trước controller: request đến Tomcat → Tomcat chạy filter → mới giao cho controller. Mỗi filter có thể (1) đọc request, (2) chuyển request xuống filter kế tiếp, hoặc (3) dừng và trả phản hồi ngay (ví dụ {{401}}). Ví dụ đời thường: như bảo vệ kiểm tra vé trước khi để khách vào sân thi đấu. Không có vé → bảo vệ chặn ngay, không cần để khách vào sân rồi mới hỏi.

### FilterChainProxy và SecurityFilterChain
Spring Security đăng ký một filter duy nhất tên {{DelegatingFilterProxy}} với Tomcat. Lớp này không tự xử lý bảo mật — nó tìm bean {{FilterChainProxy}} trong Spring context và ủy quyền hết cho nó. {{FilterChainProxy}} giữ danh sách nhiều {{SecurityFilterChain}}; mỗi chain gồm một đường dẫn khớp (ví dụ {{/api/**}}) và một danh sách filter đã xếp thứ tự. FilterChainProxy chọn chain **đầu tiên** có đường dẫn khớp request — giống danh sách quy tắc đọc từ trên xuống, quy tắc đầu tiên thắng. Bên trong chain được chọn, các filter chạy theo thứ tự cố định của Spring Security: filter xác thực chạy trước filter phân quyền, vì để biết bạn được vào hệ thống, nó phải biết bạn là ai trước.

Browser
  │
  ▼
Tomcat (Servlet container)
  │
  ▼
DelegatingFilterProxy ──┐  (cầu nối sang Spring)
  │                     │
  ▼                     │
FilterChainProxy        │
  Chain A (order 1):    │
    path /**            │
    [SessionFilter, …]  │──▶ khớp /** → chạy chain A, chain B không đến lượt
  Chain B (order 2):    │
    path /api/**        │
    [BearerTokenAuthFilter, AuthorizationFilter, …]
  │
  ▼
Controller (nếu mọi filter đều cho qua)

### Các filter quan trọng
- {{BearerTokenAuthenticationFilter}}: đọc header {{Authorization: Bearer <token>}}. Token là chuỗi minh định danh tính (như chứng minh thư tạm thời). Thiếu header hoặc token sai → ném ngoại lệ xác thực. Filter này **xác thực**: trả lời "bạn là ai".
- {{AuthorizationFilter}}: kiểm tra quyền dựa trên danh tính đã biết (ví dụ role {{ADMIN}}). **Phân quyền**: trả lời "bạn được vào nơi nào".
- {{ExceptionTranslationFilter}}: bắt ngoại lệ từ các filter trên và chuyển thành mã HTTP: ngoại lệ xác thực → {{401 Unauthorized}} (chưa chứng minh danh tính); ngoại lệ phân quyền → {{403 Forbidden}} (đã chứng minh nhưng không đủ quyền).

Thứ tự trong chain: xác thực trước, phân quyền sau.

### 401 và 403 khác nhau ở điểm nào
- {{401 Unauthorized}}: request chưa chứng minh được danh tính (chưa có token, token sai, token hết hạn). Hành động đúng: đăng nhập lại, cung cấp token đúng.
- {{403 Forbidden}}: hệ thống biết bạn là ai (token hợp lệ), nhưng tài khoản không được phép truy cập tài nguyên này (ví dụ user thường vào URL {{/admin}}). Hành động đúng: không phải đăng nhập lại — là yêu cầu cấp quyền hoặc liên hệ admin.

Ví dụ: khách mang vé tham dự sân quà nhưng vào khu VVIP → {{403}} (có vé, không được vào khu đó); khách không mang vé → {{401}} (không được vào sân).

### Nhiều chain và thứ tự {{@Order}}
Hệ thống thực tế cần rule khác nhau theo nhóm path: {{/api/**}} dùng JWT stateless (không tạo session), {{/admin/**}} dùng form login + session. Mỗi rule = một {{SecurityFilterChain}} riêng, khai báo bằng {{@Bean}} trong class {{@Configuration}}, gắn {{securityMatcher}} để chỉ khớp đúng path, và {{@Order}} để xếp thứ tự.

Quan trọng: chain tổng quát (khớp {{/**}}) phải đặt **sau** chain cụ thể (khớp {{/api/**}}). Nếu ngược lại, chain {{/**}} chạy trước và "nuốt" mọi request, chain {{/api/**}} không bao giờ được chọn. Triệu chứng thực tế: nhiều request API trả {{401}} dù JWT đúng vì filter đọc JWT của chain API không bao giờ chạy.

~~~java
@Bean
@Order(2)
SecurityFilterChain apiChain(HttpSecurity http) { /* /api/**, JWT, stateless */ }

@Bean
@Order(1)
SecurityFilterChain webChain(HttpSecurity http) { /* /admin/**, form login, session */ }
~~~

### Cơ chế từng bước
Giả sử request {{GET /api/orders}} kèm header {{Authorization: Bearer abc123}}:

1. **Tomcat nhận request**, gửi qua filter chain của container, tìm {{DelegatingFilterProxy}} (đã đăng ký khi thêm dependency spring-boot-starter-security).
2. **DelegatingFilterProxy** tìm bean {{FilterChainProxy}} trong Spring context, gọi nó.
3. **FilterChainProxy** duyệt danh sách {{SecurityFilterChain}} theo thứ tự {{@Order}}: chain {{/**}} (tổng quát) xem xong, sau đó chain {{/api/**}} khớp đường dẫn → chọn chain này.
4. **Chạy filter theo thứ tự**: {{BearerTokenAuthenticationFilter}} đọc header, thấy Bearer abc123, validate hợp lệ → gắn danh tính (principal) vào ngữ cảnh bảo mật; {{AuthorizationFilter}} thấy role {{USER}}, endpoint cần {{USER}} → cho qua; {{ExceptionTranslationFilter}} không bắt ngoại lệ nào.
5. **Request đến controller**, controller trả dữ liệu đơn hàng.
6. Nếu thiếu header → {{BearerTokenAuthenticationFilter}} ném ngoại lệ xác thực → {{ExceptionTranslationFilter}} bắt → trả **{{401}}**. Nếu token hợp lệ nhưng role {{GUEST}} cần {{ADMIN}} → {{AuthorizationFilter}} ném ngoại lệ phân quyền → **{{403}}**.

### Lỗi hay gặp trên production
- **Thứ tự chain sai**: chain {{/**}} đặt trước chain {{/api/**}} → mọi request vào chain tổng quát → API trả {{401}}. Cách sửa: đặt chain cụ thể {{@Order}} nhỏ hơn (ưu tiên hơn), dùng {{securityMatcher}} rõ ràng.
- **Xác thực sau phân quyền**: đặt {{AuthorizationFilter}} trước {{BearerTokenAuthenticationFilter}} → hệ thống chưa biết là ai mà đã kiểm tra quyền → {{403}} sai hoặc lỗi.
- **Token không gửi kèm mỗi request**: JWT stateless, server không nhớ session, nên mỗi request phải mang token trong header {{Authorization}}.
- **Nhầm {{401}} với {{403}} ở client**: client retry vĩnh viễn khi nhận {{403}} (sai: {{403}} không khôi phục bằng đăng nhập lại).

### Liên hệ phỏng vấn
1. **Request đi qua những thành phần nào trong Spring Security, và filter xác thực chạy trước hay sau filter phân quyền?** — Tomcat → {{DelegatingFilterProxy}} → {{FilterChainProxy}} chọn {{SecurityFilterChain}} → các filter. Xác thực trước, phân quyền sau, vì phân quyền cần biết danh tính.
2. **{{401}} và {{403}} khác nhau thế nào, client xử lý ra sao?** — {{401}} chưa chứng minh danh tính (đăng nhập lại); {{403}} đã chứng minh nhưng không đủ quyền (không nên retry đăng nhập, yêu cầu cấp quyền).
3. **Sao hệ thống cần nhiều {{SecurityFilterChain}}, và thứ tự quan trọng như thế nào?** — Các nhóm path khác nhau cần rule khác nhau (JWT cho API, form login cho trang quản trị). {{FilterChainProxy}} chọn chain đầu tiên khớp, nên chain cụ thể phải có {{@Order}} cao hơn (số nhỏ hơn) và đứng trước chain tổng quát.

> Senior tip: Khi debug Spring Security, đừng đoán — bật {{logging.level.org.springframework.security=DEBUG}} (hoặc TRACE) và đọc log của {{FilterChainProxy}}: nó in chính xác chain nào được chọn và dãy filter chạy cho từng request. Nếu endpoint bạn nghĩ đã mở mà vẫn {{401}}, 90% là do chain/matcher không khớp hoặc filter đọc token không chạy; 10% còn lại là filter CSRF từ chối do thiếu token. Luôn viết test {{MockMvc}} cho đủ ba ca: đúng quyền → {{200}}, sai quyền → {{403}}, chưa đăng nhập → {{401}}.`,
    exercises: [{
      title: 'Mô phỏng filter chain xác thực token rồi phân quyền theo role',
      prompt: `Hoàn thiện {{FilterChain}} — một bộ lọc Servlet tí hon mô phỏng cách Spring Security chạy chain xác thực rồi phân quyền:

- {{Request}}: có {{path}} (String), {{authorization}} (header Authorization, null nếu không có), {{principal}} (đối tượng danh tính sau khi xác thực, ban đầu null).
- {{Response}}: có {{status}} (mã HTTP, mặc định 200), {{committed}} (boolean, true khi một filter đã dừng chain và trả lỗi), {{body}} (thông điệp).
- {{Handler}} (endpoint/controller): interface một method {{handle(Request, Response)}}.
- {{Filter}}: interface một method {{doFilter(Request, Response, FilterChain)}}.
- {{FilterChain.apply(req, filters, handler)}}: chạy các filter theo thứ tự trong danh sách. Một filter gọi {{chain.doFilter(req, res)}} để sang filter kế tiếp; nếu filter **không** gọi (ví dụ trả {{401}}/{{403}}) thì chain dừng, các filter sau không chạy. Sau khi chạy hết các filter mà response chưa bị dừng, gọi {{handler.handle(req, res)}} (trả 200).
- {{AuthFilter}}: đọc {{req.authorization}}. Nếu null hoặc không bắt đầu bằng {{Bearer }} → status {{401}}, committed = true, không gọi chain. Nếu token là {{admin-token}} → principal là object có role {{ADMIN}}; nếu {{user-token}} → role {{USER}}; token khác → {{401}}. Token hợp lệ → gọi chain.
- {{RoleFilter}}: có constructor nhận {{requiredRole}} (String). Nếu {{req.principal}} null hoặc role của principal khác {{requiredRole}} → status {{403}}, committed = true, không gọi chain. Ngược lại gọi chain.`,
      starter: `import java.util.*;

class User {
    final String role;
    User(String role) { this.role = role; }
}

class Request {
    final String path;
    String authorization;
    Object principal;
    Request(String path) { this.path = path; }
}

class Response {
    int status = 200;
    boolean committed;
    String body;
}

interface Handler {
    void handle(Request req, Response res);
}

interface Filter {
    void doFilter(Request req, Response res, FilterChain chain);
}

class FilterChain {
    private final List<Filter> filters;
    private final Handler handler;
    private int pc;
    FilterChain(List<Filter> filters, Handler handler) { throw new UnsupportedOperationException("TODO"); }
    void doFilter(Request req, Response res) { throw new UnsupportedOperationException("TODO"); }
    static Response apply(Request req, List<Filter> filters, Handler handler) { throw new UnsupportedOperationException("TODO"); }
}

class AuthFilter implements Filter {
    public void doFilter(Request req, Response res, FilterChain chain) { throw new UnsupportedOperationException("TODO"); }
}

class RoleFilter implements Filter {
    final String requiredRole;
    RoleFilter(String requiredRole) { this.requiredRole = requiredRole; }
    public void doFilter(Request req, Response res, FilterChain chain) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.util.*;
public class Main {
    static int p=0, t=0;
    static void ck(String n, Runnable r) { t++; try { r.run(); p++; System.out.println("PASS " + n); } catch (Throwable e) { System.out.println("FAIL " + n + ": " + e); } }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    public static void main(String[] x) {
        ck("token hop le va role ADMIN vao /admin tra 200", () -> {
            Request req = new Request("/admin"); req.authorization = "Bearer admin-token";
            List<Filter> filters = new ArrayList<>();
            filters.add(new AuthFilter());
            filters.add(new RoleFilter("ADMIN"));
            Response res = FilterChain.apply(req, filters, (r, s) -> { s.body = "ok"; });
            eq(200, res.status);
        });
        ck("token user vao /admin can role ADMIN tra 403", () -> {
            Request req = new Request("/admin"); req.authorization = "Bearer user-token";
            List<Filter> filters = new ArrayList<>();
            filters.add(new AuthFilter());
            filters.add(new RoleFilter("ADMIN"));
            Response res = FilterChain.apply(req, filters, (r, s) -> { s.body = "ok"; });
            eq(403, res.status);
        });
        ck("khong co token tra 401", () -> {
            Request req = new Request("/api"); req.authorization = null;
            List<Filter> filters = new ArrayList<>();
            filters.add(new AuthFilter());
            filters.add(new RoleFilter("USER"));
            Response res = FilterChain.apply(req, filters, (r, s) -> { s.body = "ok"; });
            eq(401, res.status);
        });
        ck("token sai tra 401", () -> {
            Request req = new Request("/api"); req.authorization = "Bearer bad-token";
            List<Filter> filters = new ArrayList<>();
            filters.add(new AuthFilter());
            filters.add(new RoleFilter("USER"));
            Response res = FilterChain.apply(req, filters, (r, s) -> { s.body = "ok"; });
            eq(401, res.status);
        });
        ck("thứ tự filter quan trọng: role chạy trước auth, mặc dù token đúng", () -> {
            Request req = new Request("/admin"); req.authorization = "Bearer admin-token";
            List<Filter> filters = new ArrayList<>();
            filters.add(new RoleFilter("ADMIN"));
            filters.add(new AuthFilter());
            Response res = FilterChain.apply(req, filters, (r, s) -> { s.body = "ok"; });
            eq(403, res.status);
        });
        ck("chi co auth filter khong co role filter thi handler chay tra 200", () -> {
            Request req = new Request("/public"); req.authorization = "Bearer user-token";
            List<Filter> filters = new ArrayList<>();
            filters.add(new AuthFilter());
            Response res = FilterChain.apply(req, filters, (r, s) -> { s.body = "ok"; });
            eq(200, res.status);
        });
        System.out.println("RESULT " + p + "/" + t);
    }
}`,
      reference: `import java.util.*;

class User {
    final String role;
    User(String role) { this.role = role; }
}

class Request {
    final String path;
    String authorization;
    Object principal;
    Request(String path) { this.path = path; }
}

class Response {
    int status = 200;
    boolean committed;
    String body;
}

interface Handler {
    void handle(Request req, Response res);
}

interface Filter {
    void doFilter(Request req, Response res, FilterChain chain);
}

class FilterChain {
    private final List<Filter> filters;
    private final Handler handler;
    private int pc;
    FilterChain(List<Filter> filters, Handler handler) { this.filters = filters; this.handler = handler; }
    void doFilter(Request req, Response res) {
        if (res.committed) return;
        if (pc < filters.size()) {
            int i = pc++;
            filters.get(i).doFilter(req, res, this);
        } else {
            handler.handle(req, res);
        }
    }
    static Response apply(Request req, List<Filter> filters, Handler handler) {
        FilterChain chain = new FilterChain(filters, handler);
        Response res = new Response();
        chain.doFilter(req, res);
        return res;
    }
}

class AuthFilter implements Filter {
    public void doFilter(Request req, Response res, FilterChain chain) {
        String auth = req.authorization;
        if (auth == null || !auth.startsWith("Bearer ")) {
            res.status = 401;
            res.committed = true;
            res.body = "missing or malformed token";
            return;
        }
        String token = auth.substring(7);
        if ("admin-token".equals(token)) req.principal = new User("ADMIN");
        else if ("user-token".equals(token)) req.principal = new User("USER");
        else {
            res.status = 401;
            res.committed = true;
            res.body = "invalid token";
            return;
        }
        chain.doFilter(req, res);
    }
}

class RoleFilter implements Filter {
    final String requiredRole;
    RoleFilter(String requiredRole) { this.requiredRole = requiredRole; }
    public void doFilter(Request req, Response res, FilterChain chain) {
        String userRole = req.principal == null ? null : ((User) req.principal).role;
        if (!requiredRole.equals(userRole)) {
            res.status = 403;
            res.committed = true;
            res.body = "forbidden";
            return;
        }
        chain.doFilter(req, res);
    }
}`,
      hints: ['Dùng trường {{pc}} (program counter): tăng trước khi gọi filter, nên mỗi filter chỉ chạy một lần trên một request.', 'Filter gọi {{chain.doFilter(req, res)}} để nhầm qua filter kế tiếp. Nếu filter dừng (trả {{401}}/{{403}}) thì gán {{committed = true}} và không gọi {{chain.doFilter}}; các filter sau và handler không chạy.', 'Handler chỉ chạy khi mọi filter đều cho qua và {{!res.committed}} — tương tự controller chỉ chạy khi mọi filter bảo mật đều qua.'],
      explain: `Bài tập dựng lại đúng mô hình của Spring Security ở mức Servlet thuần túy.
- {{FilterChain.apply}} giữ bộ đếm {{pc}}: mỗi lần chạy, tăng {{pc}} rồi gọi filter ở vị trí đó, nên mỗi filter chỉ chạy một lần trên một request.
- Filter gọi {{chain.doFilter(req, res)}} để nhầm qua filter kế tiếp. Nếu filter quyết định dừng (ví dụ {{AuthFilter}} thấy thiếu token → {{401}}, {{RoleFilter}} thấy thiếu quyền → {{403}}) thì gán {{committed = true}} và **không** gọi {{chain.doFilter}}; các filter sau và handler đều không chạy.
- Handler (controller) chỉ chạy khi mọi filter đều cho qua và {{!res.committed}}.
Thứ tự filter quyết định kết quả: test "role chạy trước auth" cho thấy nếu phân quyền chạy trước xác thực thì {{principal}} vẫn là {{null}} và request bị chặn sai — giống rủi ro thực tế khi sắp xếp filter sai thứ tự trong Spring Security.`,
    }],
    check: [
      { q: 'FilterChainProxy chọn chain nào cho một request?', options: ['Chain có đường dẫn khớp và {{@Order}} cao hơn (số nhỏ hơn) đứng đầu danh sách', 'Chain cuối cùng trong danh sách', 'Chain ngẫu nhiên', 'Chain có nhiều filter nhất'], answer: 0, explain: `{{FilterChainProxy}} chọn chain đầu tiên có đường dẫn khớp theo thứ tự {{@Order}}, nên chain cụ thể (ví dụ {{/api/**}}) phải đặt trước chain tổng quát ({{/**}}).` },
      { q: 'Request không có token gọi API cần xác thực. Spring Security trả mã gì?', options: ['{{403 Forbidden}}', '{{401 Unauthorized}}', '{{200 OK}}', '{{500 Internal Server Error}}'], answer: 1, explain: `{{401}} có nghĩa là chưa chứng minh danh tính (chưa có token hoặc token sai); {{403}} có nghĩa là đã chứng minh nhưng không đủ quyền.` },
      { q: 'Hai filter trong một chain: filter A kiểm tra token, filter B kiểm tra role. Đặt B trước A gây gì?', options: ['Không ảnh hưởng vì Spring tự sắp xếp lại', 'B chạy trước khi biết danh tính ({{principal}} vẫn null) nên có thể chặn sai hoặc lỗi', 'Controller chạy hai lần', 'Request bị chặn bằng {{404}}'], answer: 1, explain: `Phân quyền cần biết danh tính. Nếu role filter chạy trước auth filter, {{principal}} vẫn là {{null}} nên request bị chặn sai — cùng nguy cơ khi sắp xếp filter sai thứ tự trong Spring Security.` },
      { q: '{{@Order}} trong {{SecurityFilterChain}} dùng để gì?', options: ['Xếp thứ tự các chain; chain {{@Order}} nhỏ hơn được xét trước khi khớp đường dẫn', 'Xếp thứ tự method trong controller', 'Bật/tắt CSRF', 'Thiết lập timeout session'], answer: 0, explain: `{{@Order}} quyết định thứ tự duyệt danh sách chain trong {{FilterChainProxy}}. Chain cụ thể cần {{@Order}} nhỏ hơn (ưu tiên hơn) để đứng trước chain tổng quát.` }
    ],
    related: ['security-042'], tags: ['Spring Security', 'filter chain', 'authentication', 'authorization', '401', '403']
  },
  {
    id: 'lesson-spring-013', track: 'spring', order: 13,
    title: 'Cache với @Cacheable: TTL, invalidation và phòng cache stampede', level: 'senior', minutes: 45,
    goals: ['Vẽ được cách @Cacheable kiểm tra cache trước khi chạy method và khi nào bỏ qua cache', 'Hiểu TTL, hit rate và cache stampede, cùng cách phòng bằng khoá theo key', 'Biết khi nào dùng invalidation (@CacheEvict) và khi nào không nên cache'],
    body: `**Tóm tắt:** Cache (bộ nhớ đệm) lưu bản sao dữ liệu gần nơi xử lý để lần sau đọc nhanh hơn, không phải truy vấn cơ sở dữ liệu (nơi lưu dữ liệu chính thức, thường chậm hơn bộ nhớ) lại — như tách giá bo trên quầy hàng thay vào đi kho hàng đếm lại mỗi khi khách hỏi. Spring Cache ({{@Cacheable}}, {{@CacheEvict}}, {{@CachePut}}) là lớp trừu tượng (giao diện thống nhất cho nhiều engine cache như Caffeine hoặc Redis) giúp đánh dấu method cần cache mà không viết mã quản lý cache tay. {{@Cacheable}} lưu kết quả method theo key; {{@CacheEvict}} xóa cache khi dữ liệu đổi. Cần hiểu TTL (thời gian tồn tại của một bản cache, như hạn sử dụng trên bao thực phẩm), tỉ lệ hit (cache hit rate, phần lần đọc được lấy từ cache), và cache stampede (nhiều request cùng miss một key được truy cập nhiều → cùng truy vấn cơ sở dữ liệu, có thể làm sập cơ sở dữ liệu). Khoá theo key (per-key lock) phòng stampede: chỉ một request tính toán, các request khác cùng key chờ đợi kết quả đầu tiên.

### Cache là gì và ví dụ đời thường
Cache là bộ nhớ đệm lưu dữ liệu đã đọc một lần để đọc lần sau nhanh hơn. Ví dụ đời thường: quán bánh ghi số lượng bánh còn lại trên bảng ván đen (cache) thay vào vào kho đếm lại mỗi khi khách hỏi. Bản sao này có thể cũ so với kho thực (dữ liệu stale, nghĩa là cũ không đồng bộ), nên cần TTL hoặc xóa khi nhập bánh mới (invalidation, nghĩa là làm hết hạn hoặc xóa cache).

### Spring Cache và {{@Cacheable}}
{{@Cacheable}} là annotation của Spring Cache (không phải Hibernate, không phải Redis trực tiếp — Spring Cache là lớp abstract, Redis/Caffeine là engine thực tế). Đánh dấu trên method: Spring bọc bean bằng proxy (lớp vỏ chặn lời gọi, giống lesson về AOP). Lần đầu gọi method với tham số X → proxy chạy method thật, lưu kết quả vào cache dưới key lấy từ tham số. Lần sau gọi cùng X → proxy trả kết quả từ cache, **không chạy method** (cache hit). Vì là proxy, gọi method trong cùng class ({{this.method()}}) không qua proxy → không được cache, không có cảnh báo. Đây là cùng nguyên nhân khiến {{@Transactional}} và {{@Async}} bị bỏ qua khi gọi nội bộ.

{{@Cacheable}} cần bật caching: Spring Boot với starter cache bật sẵn, hoặc khai {{@EnableCaching}}.

### Cache key và TTL
Key mặc định gộp các tham số method. Nên dùng SpEL (ngôn ngữ biểu thức Spring, viết như {{key = "#customerId + ':' + #tenantId"}}) để key phản ánh **mọi** điều kiện ảnh hưởng kết quả. Nếu thiếu {{tenantId}}, khách hàng B có thể đọc cache của khách hàng A — lỗi rò rỉ dữ liệu, nghiêm trọng hơn lỗi chậm.

TTL (time-to-live, thời gian tồn tại): mỗi bản cache tự hết hạn sau một khoảng thời gian, như sữa trong tủ lạnh có hạn sử dụng. Hết hạn → đọc lại là miss → tính toán mới. TTL cấu hình tùy engine: Caffeine ({{expireAfterWrite}}), Redis ({{RedisCacheConfiguration}}). TTL quá ngắn → cache gần như vô ích; quá dài → dữ liệu cũ nguy hiểm (giá sai, số dư sai).

### Tỉ lệ hit và khi nào dùng cache
Hit rate = số lần đọc trùng cache chia tổng số lần đọc. Dùng cache cho dữ liệu đọc nhiều, ít thay đổi, tính toán đắt (danh mục sản phẩm, cấu hình, phí ship). Không dùng cache cho dữ liệu phải chính xác từng đồng (số dư ví điện tử) hoặc bị hệ thống khác sửa (ETL, script SQL) nếu không có cơ chế invalidation đồng bộ.

### Cache invalidation và cache stampede
Khi dữ liệu thay đổi, cache cũ phải bị xóa ({{@CacheEvict}}) hoặc ghi mới ({{@CachePut}}), nếu không khách hàng đọc dữ liệu cũ (stale cache).

Cache stampede: một key hot hết hạn đúng lúc nhiều người cùng đọc → tất cả miss → cùng truy vấn cơ sở dữ liệu → cơ sở dữ liệu spike (tải vọt). Phòng bằng per-key lock (khoá theo từng key): chỉ một request được phép tính toán và ghi cache, các request khác cùng key chờ đợi kết quả đầu tiên thay vì cùng xuống cơ sở dữ liệu. Hoặc jitter TTL (thêm thời gian ngẫu nhiên vào mỗi bản để hạn sử dụng khác nhau lúc).

### Cơ chế từng bước (một lần gọi {{@Cacheable}})
1. Caller gọi method trên bean (thực ra đang gọi proxy, Spring tạo proxy khi khởi động).
2. Proxy kiểm tra cache có key từ tham số method và chưa hết TTL hay không.
3. Có (hit) → trả kết quả từ cache, **không chạy method**.
4. Không (miss) → proxy chạy method thật, lấy kết quả, lưu vào cache với TTL, trả về caller.
5. Method có {{@CacheEvict}} → sau khi chạy thành công, xóa key (hoặc toàn bộ cache) khỏi cache.

~~~java
@Cacheable(value = "showtimes", key = "#movieId + ':' + #showDate")
public List<Showtime> showtimes(String movieId, LocalDate showDate) {
    // truy vấn cơ sở dữ liệu, đắt
    return showtimeRepo.findByMovieAndDate(movieId, showDate);
}

@CacheEvict(value = "showtimes", key = "#movieId + ':' + #showDate")
public void updateShowtime(Showtime showtime) {
    showtimeRepo.save(showtime);
}
~~~

### Lỗi hay gặp trên production
- **Gọi nội bộ không được cache**: method {{@Cacheable}} gọi method {{@Cacheable}} khác trong cùng class qua {{this}} → bỏ qua proxy → không cache. Cách sửa: tách method sang bean khác để lời gọi đi qua proxy.
- **Key thiếu điều kiện phân biệt**: cache theo {{customerId}} nhưng thiếu {{tenantId}} → khách B đọc được cache của khách A.
- **Quên invalidation**: cập nhật cơ sở dữ liệu nhưng không xóa cache → khách hàng thấy giá đã đổi lâu.
- **Cache miss liên tục với key không tồn tại (cache penetration)**: mỗi lần đọc key không có đều xuống cơ sở dữ liệu. Phòng bằng cache giá trị null với TTL ngắn, hoặc kiểm tra đầu vào.
- **Không phòng cache stampede**: key hot hết hạn cùng lúc → hàng nghìn request cùng xuống cơ sở dữ liệu. Phòng bằng per-key lock hoặc jitter TTL.

### Ví dụ đời thực
Hệ thống bán vé phim: lịch chiếu thay đổi ít, nhưng đọc mỗi giây hàng ngàn lần. Team gắn {{@Cacheable}} TTL 5 phút vào method tra lịch chiếu với key chứa mã phim và ngày. Tỉ lệ hit tăng từ 40% lên 98%, truy vấn cơ sở dữ liệu giảm từ 12.000 lần/phút xuống 200 lần/phút. Lúc thêm suất chiếu mới, quên {{@CacheEvict}} → khách hàng không thấy suất mới trong 5 phút. Sự cố lớn hơn: suất hot hết hạn đúng lúc khuyến mãi giảm giá 50%, 2.000 request/giây cùng miss → cơ sở dữ liệu CPU 100%. Sửa: khoá theo mã suất (per-key lock) + TTL có jitter. Kết quả: cơ sở dữ liệu ổn định, khách hàng vẫn thấy dữ liệu đúng sau khi invalidate.

### Liên hệ phỏng vấn
1. **{{@Cacheable}} hoạt động thế nào, và sao gọi method trong cùng class không được cache?** — {{@Cacheable}} là advice AOP qua proxy: proxy kiểm tra cache trước khi chạy method. {{this.method()}} gọi thẳng target, bỏ qua proxy → không kiểm tra cache.
2. **Cache key phải chứa những gì, TTL cấu hình như thế nào?** — Key phải chứa mọi tham số ảnh hưởng kết quả (ví dụ {{customerId}} + {{tenantId}}), nếu không sẽ rò rỉ dữ liệu hoặc trả kết quả sai. TTL cấu hình theo engine (Caffeine {{expireAfterWrite}}, Redis {{RedisCacheConfiguration}}), chọn sao cho dữ liệu cũ vẫn chấp nhận được.
3. **Cache stampede là gì, phòng bằng cách nào?** — Nhiều request cùng miss key hot → cùng xuống cơ sở dữ liệu → sập. Phòng bằng per-key lock (chỉ một request tính toán, các request khác chờ) hoặc jitter TTL.

> Senior tip: Không bật cache cho dữ liệu về tiền nếu bạn chưa trả lời được "khi nào xóa cache" và "dữ liệu cũ bao lâu thì chấp nhận được". Cache nhầm là tạo ra sự cố dữ liệu, không chỉ làm chậm vài mili giây. Luôn theo dõi cache hit rate như một metric, và viết test cho cả ca hit lẫn miss.`,
    exercises: [{
      title: 'Lập cache đơn giản có TTL, invalidation và phòng cache stampede',
      prompt: `Hoàn thiện {{SimpleCache<K, V>}} — một cache tự viết mô phỏng ý tưởng cốt lõi của Spring Cache (đếm hit/miss, hết hạn theo TTL, xóa theo key) và phòng cache stampede bằng khoá theo từng key:

- {{SimpleCache(long ttlMs, Clock clock)}}: {{ttlMs}} là thời gian tồn tại của mỗi bản cache (milliseconds, tương tự TTL của Redis/Caffeine), {{clock}} cung cấp thời gian hiện tại để test xác định (deterministic).
- {{V get(K key, Loader<K, V> loader)}}: nếu cache có key và chưa hết hạn → hit, tăng bộ đếm hit, trả giá trị. Nếu miss (không có hoặc đã hết hạn) → tăng miss, lấy khoá theo key (per-key lock), kiểm tra lại trong khoá, nếu vẫn miss thì gọi {{loader.load(key)}} để tính, lưu kết quả với thời gian hết hạn = now + ttlMs, trả kết quả. Các truy cập cùng key khi đang miss chỉ được tính toán một lần, các request khác chờ đợi kết quả của lần đầu — đây chính là phòng cache stampede.
- {{void put(K key, V value)}}: ghi giá trị trực tiếp, đặt hết hạn = now + ttlMs, không đổi bộ đếm hit/miss.
- {{void evict(K key)}}: xóa bản cache của key (invalidation, làm hết hạn theo yêu cầu).
- {{long hits()}}, {{long misses()}}, {{double hitRate()}}: hitRate = hits chia (hits + misses); nếu tổng bằng 0 thì trả 0.0.
- {{Loader<K, V>}}: interface một method {{V load(K key)}}.`,
      starter: `import java.time.*;
import java.util.*;

interface Loader<K, V> {
    V load(K key);
}

class SimpleCache<K, V> {
    final long ttlMs;
    Clock clock;
    SimpleCache(long ttlMs, Clock clock) { throw new UnsupportedOperationException("TODO"); }
    V get(K key, Loader<K, V> loader) { throw new UnsupportedOperationException("TODO"); }
    void put(K key, V value) { throw new UnsupportedOperationException("TODO"); }
    void evict(K key) { throw new UnsupportedOperationException("TODO"); }
    long hits() { throw new UnsupportedOperationException("TODO"); }
    long misses() { throw new UnsupportedOperationException("TODO"); }
    double hitRate() { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `import java.time.*;
import java.util.*;
public class Main {
    static int p=0, t=0;
    static void ck(String n, Runnable r) { t++; try { r.run(); p++; System.out.println("PASS " + n); } catch (Throwable e) { System.out.println("FAIL " + n + ": " + e); } }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError(a + " != " + b); }
    static void eqd(double a, double b) { if (Math.abs(a - b) > 1e-9) throw new AssertionError(a + " != " + b); }
    public static void main(String[] x) {
        ck("miss sau do hit", () -> {
            Clock c = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
            SimpleCache<String,String> cache = new SimpleCache<>(60_000, c);
            int[] loads = {0};
            String v1 = cache.get("k", k -> { loads[0]++; return "v"; });
            String v2 = cache.get("k", k -> { loads[0]++; return "v2"; });
            eq("v", v1); eq("v", v2); eq(1, loads[0]);
            eq(1L, cache.hits()); eq(1L, cache.misses()); eqd(0.5, cache.hitRate());
        });
        ck("qua TTL thi tinh lai", () -> {
            Clock c = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
            SimpleCache<String,String> cache = new SimpleCache<>(1000, c);
            int[] loads = {0};
            cache.get("k", k -> { loads[0]++; return "v"; });
            eq(0L, cache.hits()); eq(1L, cache.misses()); eq(1, loads[0]);
            cache.clock = Clock.fixed(Instant.parse("2026-01-01T00:00:01.001Z"), ZoneOffset.UTC);
            cache.get("k", k -> { loads[0]++; return "v2"; });
            eq(2, loads[0]); eq(0L, cache.hits()); eq(2L, cache.misses()); eqd(0.0, cache.hitRate());
        });
        ck("evict xoa ban cache", () -> {
            Clock c = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
            SimpleCache<String,String> cache = new SimpleCache<>(60_000, c);
            int[] loads = {0};
            cache.get("k", k -> { loads[0]++; return "v"; });
            cache.evict("k");
            cache.get("k", k -> { loads[0]++; return "v2"; });
            eq(2, loads[0]); eq(0L, cache.hits()); eq(2L, cache.misses());
        });
        ck("put giap tiep roi get la hit", () -> {
            Clock c = Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC);
            SimpleCache<String,String> cache = new SimpleCache<>(60_000, c);
            int[] loads = {0};
            cache.put("k", "v");
            String v = cache.get("k", k -> { loads[0]++; return "v2"; });
            eq("v", v); eq(0, loads[0]); eq(1L, cache.hits()); eq(0L, cache.misses());
        });
        ck("hitRate bang 0 khi chua co lan doc nao", () -> {
            SimpleCache<String,String> cache = new SimpleCache<>(60_000, Clock.fixed(Instant.parse("2026-01-01T00:00:00Z"), ZoneOffset.UTC));
            eqd(0.0, cache.hitRate());
        });
        System.out.println("RESULT " + p + "/" + t);
    }
}`,
      reference: `import java.time.*;
import java.util.*;

interface Loader<K, V> {
    V load(K key);
}

class SimpleCache<K, V> {
    private static class Entry<V> {
        V value;
        long expiryMs;
        Entry(V value, long expiryMs) { this.value = value; this.expiryMs = expiryMs; }
    }
    private final long ttlMs;
    Clock clock;
    private final Map<Object, Entry<Object>> store = new HashMap<>();
    private final Map<Object, Object> locks = new HashMap<>();
    private long hits;
    private long misses;
    SimpleCache(long ttlMs, Clock clock) { this.ttlMs = ttlMs; this.clock = clock; }
    @SuppressWarnings("unchecked")
    V get(K key, Loader<K, V> loader) {
        long now = clock.millis();
        Entry<Object> entry = store.get(key);
        if (entry != null && entry.expiryMs > now) { hits++; return (V) entry.value; }
        misses++;
        Object lock = locks.computeIfAbsent(key, k -> new Object());
        synchronized (lock) {
            entry = store.get(key);
            if (entry != null && entry.expiryMs > now) { return (V) entry.value; }
            V value = loader.load(key);
            store.put(key, new Entry<>(value, now + ttlMs));
            return value;
        }
    }
    @SuppressWarnings("unchecked")
    void put(K key, V value) {
        store.put(key, new Entry<>(value, clock.millis() + ttlMs));
    }
    void evict(K key) {
        store.remove(key);
    }
    long hits() { return hits; }
    long misses() { return misses; }
    double hitRate() {
        long total = hits + misses;
        return total == 0 ? 0.0 : (double) hits / total;
    }
}`,
      hints: ['Dùng {{HashMap}} lưu giá trị cùng thời điểm hết hạn ({{now + ttlMs}}); bản còn hạn khi {{expiryMs > now}}.', 'Khoá theo key: {{Map<K, Object> locks}} với {{computeIfAbsent}}, rồi {{synchronized (lock)}}; kiểm tra lại cache trong khoá để tránh tính toán trùng.', 'Hit/miss chỉ tính trong {{get}}; {{put}} và {{evict}} không đổi bộ đếm; {{hitRate}} chia cho tổng, tránh chia cho không.'],
      explain: `Bài tập dựng lại đúng ý tưởng cốt lõi của Spring Cache ở mức Java thuần.
- Mỗi bản cache là {{Entry}} gồm giá trị và thời điểm hết hạn ({{now + ttlMs}}), tương tự TTL của Redis hoặc {{expireAfterWrite}} của Caffeine.
- {{get}} đọc cache trước (hit), mới tính toán (miss) — chính hành vi của {{@Cacheable}}.
- Khoá theo từng key trong {{locks}} ngăn cache stampede: chỉ một request tính toán cho một key, các request khác cùng key chờ đợi thay vì cùng xuống cơ sở dữ liệu. Đây là mô hình đơn giản của lock phân tán thực tế (ví dụ Redis Redlock), chỉ chạy trong một JVM như {{@Cacheable(sync = true)}} của Spring.
- Hit/miss bộ đếm và {{hitRate}} giúp team biết cache thật sự giúp ích hay chỉ chiếm bộ nhớ — metric nên theo dõi trên production.`,
    }],
    check: [
      { q: '{{@Cacheable}} lưu gì vào cache?', options: ['Kết quả trả về của method theo key built từ tham số method', 'Toàn bộ class bean', 'Chỉ kết quả là null', 'Câu lệnh SQL của method'], answer: 0, explain: `{{@Cacheable}} lưu kết quả trả về của method dưới key lấy từ tham số (mặc định gộp tất cả tham số, hoặc ghi đè bằng SpEL như {{key = "#id"}}). Nó không lưu class bean, không chỉ lưu null, và method Java không chứa câu lệnh SQL.` },
      { q: 'Gọi method {{@Cacheable}} từ method khác trong cùng class qua {{this}} có được cache không?', options: ['Có, Spring tự hiểu', 'Không: lời gọi không qua proxy nên annotation bị bỏ qua', 'Chỉ khi method là static', 'Chỉ khi class có interface'], answer: 1, explain: `{{@Cacheable}} là advice AOP, chỉ chạy khi lời gọi đi qua proxy (bean được Spring inject). {{this.method()}} gọi thẳng target, bỏ qua proxy → không kiểm tra cache, cũng không có cảnh báo. Cách sửa: tách method sang bean khác. static và interface không thay đổi việc này.` },
      { q: 'TTL trong cache có nghĩa là gì?', options: ['Số lần tối đa được đọc trước khi xóa', 'Thời gian tồn tại của một bản cache trước khi hết hạn và phải tính lại', 'Thời gian chờ giữa hai request', 'Thời gian transaction giữ kết nối cơ sở dữ liệu'], answer: 1, explain: `TTL (time-to-live) là thời gian tồn tại của một bản cache, như hạn sử dụng trên bao thực phẩm. Hết hạn → đọc lại là miss → tính toán mới và lưu lại với hạn mới. TTL không phải số lần đọc, không phải thời gian chờ giữa request, cũng không phải thời gian giữ kết nối DB.` },
      { q: 'Cache stampede là gì và phòng bằng cách nào?', options: ['Nhiều request cùng miss một key hot → cùng truy vấn cơ sở dữ liệu có thể làm sập; phòng bằng khoá theo từng key (chỉ một request tính toán, các request khác chờ) hoặc jitter TTL', 'Cache bị xóa nhầm do {{@CacheEvict}}', 'Cache chỉ lưu được một giá trị', 'Cache stampede không thể phòng được'], answer: 0, explain: `Cache stampede xảy ra khi một key phổ biến hết hạn đúng lúc nhiều người cùng đọc: tất cả miss, cùng truy vấn cơ sở dữ liệu, tải vọt. Phòng bằng per-key lock (chỉ một request tính toán, các request khác cùng key chờ đợi kết quả đầu tiên) hoặc jitter TTL (giới hạn sử dụng khác nhau theo từng bản). {{@CacheEvict}} chỉ xóa cache, không phải nguyên nhân hay cách phòng stampede.` }
    ],
    related: ['spring-020'], tags: ['Spring Cache', '@Cacheable', 'TTL', 'cache stampede', 'invalidation']
  },
{
  id: 'lesson-spring-014', track: 'spring', order: 14,
  title: 'AOP proxy: chuỗi advisor, thứ tự advice và vì sao Boot dùng CGLIB', level: 'senior', minutes: 50,
  goals: [
    'Phân biệt target, proxy, advisor, pointcut, advice và interceptor',
    'Mô tả container chọn JDK proxy hay CGLIB ở bước nào của vòng đời bean',
    'Giải thích thứ tự advisor ({{@Order}}, {{Ordered}}) và hệ quả với transaction',
    'Tự dựng chuỗi advice bằng {{java.lang.reflect.Proxy}} và chứng minh self-invocation bị bỏ qua',
  ],
  body: `**Tóm tắt:** Spring AOP không sửa code của bạn. Nó tạo một **proxy** — object đứng giữa caller và bean thật (**target**) — rồi chạy một **chuỗi advisor** quanh lời gọi. Một advisor gồm **pointcut** (chọn method nào) và **advice** (làm gì: mở transaction, đo thời gian, kiểm tra hạn mức). Proxy chỉ có một cửa vào, nên {{this.method()}} trong cùng bean đi thẳng target và bỏ qua advisor: đó là self-invocation. Bài này đi vào phần ít được giải thích: container chọn JDK proxy hay CGLIB, dựng chuỗi advisor theo thứ tự nào, và vì sao một dòng {{@Order}} có thể quyết định transaction mở trước hay sau khi kiểm tra hạn mức.

### Từ nhu cầu tới ba khái niệm dễ lẫn
Hãy tưởng tượng một cổng soát vé ở nhà ga. **Target** là hành khách (code nghiệp vụ của bạn). **Proxy** là nhân viên soát vé đứng ở cổng. **Advice** là việc nhân viên làm thêm: kiểm tra vé, đếm lượt, ghi thời gian. **Pointcut** là quy tắc "soát ai": chỉ soát vé tàu, không soát vé xe buýt. **Advisor** là cặp (quy tắc, việc làm thêm) đó. Còn **interceptor** là cách Spring cài advice dưới dạng một object có method {{invoke(MethodInvocation)}}: nó nhận lời gọi, có thể làm việc trước, gọi {{proceed()}} để đi tiếp, rồi làm việc sau.

Vì sao cần tách ba thứ này? Nếu bạn viết {{if (phảiLog) log(...)}} trong mọi method, nghiệp vụ bị trộn với hạ tầng và quên một chỗ là thiếu nhất quán. AOP cho phép khai báo một lần "mọi method trong package service đều được đo thời gian", rồi container tự áp dụng. Điểm mạnh cũng là điểm yếu: nó chỉ áp dụng khi lời gọi đi qua proxy.

Ba thuật ngữ hay bị dùng lẫn:
- **Advice**: đoạn hành vi thêm (before, after returning, around, after throwing). Trong Spring, {{@Transactional}} tạo ra một advice dạng around; {{@Cacheable}} cũng vậy.
- **Pointcut**: biểu thức chọn method. Ví dụ {{execution(* com.acme.order..*.*(..))}} nghĩa là "mọi method public trong package com.acme.order và các package con".
- **Advisor**: pointcut + advice. Spring có sẵn {{TransactionAttributeSourceAdvisor}} (pointcut tìm method có {{@Transactional}}, advice là {{TransactionInterceptor}}).

### Container tạo proxy ở bước nào
Spring không tạo proxy lúc bạn viết code, cũng không sửa bytecode. Lúc khởi động, một **BeanPostProcessor** tên là {{AbstractAutoProxyCreator}} (lớp cha của {{AnnotationAwareAspectJAutoProxyCreator}}) được chạy cho **từng bean**, ở hook {{postProcessAfterInitialization}} — tức sau khi bean đã được tạo, inject dependency xong và đã chạy callback khởi tạo.

Cơ chế bên trong, theo thứ tự:

1. {{postProcessAfterInitialization}} gọi {{wrapIfNecessary(bean, beanName, cacheKey)}}.
2. {{getAdvicesAndAdvisorsForBean}} hỏi tất cả advisor đã đăng ký: pointcut của bạn có khớp class/method này không? Nếu không advisor nào khớp, trả về bean **nguyên bản**, không tạo proxy.
3. Nếu có advisor khớp, {{createProxy}} tạo một {{ProxyFactory}}, gắn target và danh sách advisor, rồi gọi {{DefaultAopProxyFactory.createAopProxy}}.
4. {{DefaultAopProxyFactory}} chọn **JDK dynamic proxy** hay **CGLIB** dựa trên cấu hình và bản chất của target (bảng dưới).
5. Proxy được trả về thay cho bean gốc. Từ đây, mọi nơi inject bean này đều nhận proxy; {{target}} thật nằm bên trong, chỉ proxy giữ tham chiếu.

Vì proxy được tạo ở bước cuối, có một hệ quả rất thực tế: trong {{@PostConstruct}}, bean **chưa** được bọc proxy, và nếu {{@PostConstruct}} gọi method của chính nó thì đó là self-call — {{@Transactional}} trên method đó không có tác dụng. Muốn chạy logic cần transaction lúc khởi động, hãy dùng {{ApplicationReadyEvent}} hoặc gọi qua một bean khác.

Spring cũng cố tình **không** proxy một số bean hạ tầng: các {{BeanPostProcessor}}, các bean đã là proxy, các class {{@Aspect}} (chính chúng là nơi khai báo advice). Nếu không loại trừ, container sẽ tự proxy chính cái máy tạo proxy và rơi vào vòng lặp.

### JDK proxy và CGLIB: khác nhau ở đâu
Có hai cách tạo lớp vỏ, và chúng khác nhau ở **cách lớp vỏ nhìn giống bean**:

| Tiêu chí | JDK dynamic proxy | CGLIB (subclass) |
|---|---|---|
| Bản chất | Sinh một class **cài các interface** bạn liệt kê | Sinh một **lớp con** của class target lúc runtime |
| Điều kiện | Target phải có interface, caller phải biết interface đó | Target không được {{final}}; method cần chèn không được {{private}}/{{final}}/{{static}} |
| Đối tượng được inject | Proxy chỉ là instance của interface | Proxy là instance của lớp con, nên inject theo class cụ thể vẫn được |
| Tạo instance | Gọi constructor của bạn | Dùng Objenesis để tạo instance **không gọi constructor** (Spring 4+), tránh side effect lúc khởi tạo proxy |
| Khi target không có interface | Không dùng được | Spring tự chuyển sang CGLIB |
| Cast về class cụ thể | Ném {{ClassCastException}} | Được |

Spring Framework mặc định {{proxyTargetClass = false}} (ưu tiên JDK proxy nếu target có interface). Spring Boot đặt {{spring.aop.proxy-target-class=true}} mặc định từ Boot 2.0, nên **mọi** bean cần AOP đều dùng CGLIB, kể cả bean có interface. Đó là lý do bạn có thể {{@Autowired PaymentService}} (class cụ thể) mà không lỗi kiểu. Nếu muốn quay lại hành vi cũ, đặt {{spring.aop.proxy-target-class=false}}; muốn tắt hẳn auto-proxy, đặt {{spring.aop.auto=false}} (lúc đó {{@Transactional}} không còn tác dụng qua proxy nữa).

Cần phân biệt với {{@Configuration(proxyBeanMethods = true)}}: đó là CGLIB cho **class cấu hình** để {{@Bean}} gọi nhau vẫn trả về singleton, không phải cơ chế AOP cho mọi bean. Hai thứ dùng cùng công nghệ nhưng khác mục đích.

### Thứ tự advisor: số nhỏ chạy ngoài
Một bean có thể có nhiều advisor: transaction, cache, rate limit, metrics, security. Thứ tự không phải trang trí — nó quyết định **transaction mở trước hay sau** khi kiểm tra hạn mức, và **exception nào được advice nào thấy**.

Quy tắc của Spring: advisor được sắp theo {{Ordered}} / {{@Order}}; giá trị **nhỏ hơn có độ ưu tiên cao hơn và nằm ngoài**. Chuỗi chạy từ ngoài vào trong:

~~~text
caller
  → metrics (order 10)
    → rate limit (order 50)
      → transaction (order LOWEST_PRECEDENCE)
        → target.save()
      ← commit / rollback
    ← rate limit trả về
  ← metrics dừng đồng hồ
~~~

Mỗi interceptor chỉ đi tiếp khi gọi {{proceed()}}. Nếu rate limit ném exception và **không** gọi {{proceed()}}, transaction bên trong chưa từng mở — đó là điều bạn muốn: request bị chặn thì đừng giữ connection. Nếu thứ tự ngược lại (transaction ngoài, rate limit trong), mỗi request bị chặn vẫn mở transaction, chiếm một connection Hikari trong lúc kiểm tra, và phải rollback.

Transaction advisor mặc định có order {{Ordered.LOWEST_PRECEDENCE}} (lớn nhất). Một aspect tự viết không khai {{@Order}} cũng có order mặc định thấp nhất, nên nó **thường** nằm trong transaction hoặc cùng mức — đừng dựa vào thứ tự ngẫu nhiên đó. Muốn aspect chạy ngoài transaction, hãy khai {{@Order(50)}} lên class aspect (giá trị nhỏ hơn LOWEST_PRECEDENCE). Cũng có thể đổi order của hạ tầng transaction bằng {{@EnableTransactionManagement(order = 50)}}, nhưng đừng làm nếu chưa hiểu hệ quả: mọi method {{@Transactional}} sẽ nằm trong aspect đó.

Hai advisor **cùng order** thì thứ tự không được đảm bảo; đừng dựa vào thứ tự khai báo. Nếu nghiệp vụ cần một trật tự tuyệt đối, hãy gán order tường minh.

### Self-invocation: proxy chỉ có một cửa vào
Nhắc lại đúng chỗ: proxy là object được inject, target là object thật bên trong. Khi caller gọi {{proxy.outer()}}, proxy chạy advisor rồi gọi {{target.outer()}}. Bên trong {{outer()}}, {{this}} là **target**, nên {{this.inner()}} đi thẳng target → advisor của {{inner()}} không chạy. Không có cách nào để target "tự nhảy" về proxy: nó không biết mình đang được bọc.

Ba cách sửa, theo thứ tự nên dùng:
1. **Tách method sang bean khác**: lời gọi đi ra ngoài bean, qua proxy của bean kia. Đây cũng là cách buộc bạn nghĩ lại ranh giới trách nhiệm.
2. **Đặt boundary ở method ngoài cùng**: nếu inner chỉ là helper, đừng đánh dấu nó; transaction của outer đã đủ.
3. **{{TransactionTemplate}}** mở transaction bằng code ngay tại chỗ, không phụ thuộc proxy.

Các mẹo {{AopContext.currentProxy()}} (cần {{exposeProxy = true}}) hoặc tự inject chính mình bằng {{@Lazy}} chạy được nhưng làm luồng khó đọc và dễ vỡ trong unit test gọi {{new}}. Chỉ dùng khi không còn lựa chọn.

### Bốn lỗi hay gặp trên production
- **{{final class}} + {{@Transactional}}**: CGLIB không tạo được lớp con → app **không boot**, log kiểu {{BeanCreationException: Cannot subclass final class ...}}. Sửa: bỏ {{final}} (giữ class mở cho proxy) hoặc chuyển sang interface + JDK proxy nếu thật sự cần. Nhớ: {{final}} ở đây là {{final}} class, không phải {{final}} field.
- **Method {{private}}/{{static}} có {{@Transactional}}**: proxy không chặn được → annotation im lặng vô hiệu. Triệu chứng: code chạy, không có transaction, không log lỗi. Sửa: đưa method lên {{public}} non-final, hoặc đặt boundary ở method public được gọi từ ngoài.
- **Cast proxy sang class cụ thể khi dùng JDK proxy**: {{((PaymentServiceImpl) paymentService)}} ném {{ClassCastException}} vì proxy chỉ cài interface. Boot mặc định CGLIB nên ít gặp; nếu bạn tắt {{proxy-target-class}}, lỗi này xuất hiện ở những chỗ inject theo class.
- **Double proxy**: vừa tự tạo proxy bằng {{ProxyFactory}} trong code, vừa để auto-proxy bọc thêm → hai lớp {{TransactionInterceptor}}. Triệu chứng: transaction lồng nhau ngoài ý muốn, metrics đếm hai lần, log begin/commit lặp. Sửa: chọn một cơ chế; nếu cần thêm hành vi, viết một advisor và để Spring quản lý.

### Ví dụ đời thực
Một hệ thống thanh toán có {{PaymentService}} với {{@Transactional}} và một aspect {{RateLimitAspect}} giới hạn 50 request/phút cho mỗi merchant. Ban đầu aspect không khai {{@Order}}, nên nó nằm trong transaction (transaction advisor có order thấp nhất). Khi merchant vượt hạn mức, aspect ném {{TooManyRequestsException}}; lúc này transaction đã mở, phải rollback, và mỗi request bị chặn vẫn giữ một connection Hikari trong 20–80 ms.

Cao điểm 1.200 request/phút, pool 20 connection có lúc cạn: request hợp lệ phải chờ {{connectionTimeout = 30s}}, p99 tăng từ 180 ms lên 4,2 giây, và 37 request/phút timeout connection. Đội đặt {{@Order(50)}} cho aspect để nó chạy **ngoài** transaction và kiểm tra hạn mức trước khi vào service. Đo lại: p99 còn 90 ms, số lần timeout connection về 0, số transaction rollback do rate limit giảm từ 600/phút xuống 0. Bài học: thứ tự advisor không phải chi tiết cú pháp, nó thay đổi tài nguyên bị chiếm khi request bị từ chối.

### Liên hệ phỏng vấn
1. **Spring AOP hoạt động thế nào, proxy được tạo ở đâu?** — Một {{BeanPostProcessor}} ({{AbstractAutoProxyCreator}}) bọc bean ở {{postProcessAfterInitialization}}, sau khi bean đã inject xong và chạy init. Nó chỉ tạo proxy khi có advisor khớp pointcut; proxy thay thế bean trong context.
2. **JDK proxy và CGLIB khác nhau thế nào, Boot mặc định dùng cái nào?** — JDK proxy sinh class cài interface, caller phải biết interface, cast về class cụ thể lỗi. CGLIB sinh lớp con của target, cần class/method không {{final}}, không chặn được {{private}}. Boot 3 mặc định {{spring.aop.proxy-target-class=true}} → CGLIB; Framework mặc định là JDK nếu target có interface.
3. **Vì sao {{@Transactional}} không chạy khi gọi nội bộ, và làm sao sửa?** — {{this.method()}} gọi thẳng target, không qua proxy, nên advisor không chạy. Sửa bằng cách tách bean, đặt boundary ở method ngoài, hoặc {{TransactionTemplate}}. {{AopContext.currentProxy()}}/self-injection là con dao hai lưỡi.
4. **Làm sao để aspect đo thời gian không bao gồm thời gian transaction?** — Đặt order của aspect **nhỏ hơn** order của transaction advisor để nó nằm ngoài; hoặc đo ở tầng controller. Nếu aspect nằm trong, đồng hồ sẽ tính cả thời gian mở connection, flush và commit.

> Senior tip: Khi thấy một bean có nhiều annotation hạ tầng ({{@Transactional}}, {{@Cacheable}}, {{@Retryable}}, aspect tự viết), hãy hỏi "thứ tự nào đúng" trước khi hỏi "annotation nào thiếu". Một aspect đặt sai chỗ có thể biến một request bị từ chối thành một connection bị giữ, và đó là loại sự cố không hiện ra trong log nghiệp vụ.`,
  exercises: [{
    title: 'MiniAop: chuỗi advisor, thứ tự, pointcut và self-invocation',
    prompt: `Hoàn thiện {{MiniAop.wrap(target, iface, advisors)}} bằng {{java.lang.reflect.Proxy}} để mô phỏng phần lõi của Spring AOP: một chuỗi advisor chạy quanh method thật.

Hợp đồng:
- {{Advice.invoke(MethodCall)}} nhận một lời gọi và trả về kết quả (hoặc ném exception).
- {{MethodCall}} có {{methodName()}}, {{args()}} và {{proceed()}}. {{proceed()}} chạy advice kế tiếp trong chuỗi; nếu là advice cuối, nó gọi method thật trên target.
- {{Advisor(pattern, order, advice)}}: {{pattern}} là tên method chính xác ({{"save"}}) hoặc tiền tố có dấu {{*}} ({{"save*"}} khớp {{save}} và {{saveAll}}). {{matches(name)}} đã được viết sẵn.
- {{MiniAop.wrap}} trả về proxy cài {{iface}}, ủy quyền cho {{target}}. Handler phải:
  1. Lọc các advisor có {{matches(methodName)}}.
  2. Sắp theo {{order}} tăng dần: order **nhỏ hơn nằm ngoài**, chạy trước.
  3. Dựng chuỗi: mỗi advice gọi {{proceed()}} để đi tiếp; advice cuối gọi {{method.invoke(target, args)}}.
  4. {{Method.invoke}} bọc exception của target trong {{InvocationTargetException}}; handler phải ném lại {{getCause()}} để caller nhận đúng exception gốc.
  5. Không advisor nào khớp thì gọi thẳng target, không ghi log.

Fixture có sẵn: {{TxLog}} (đếm begin/commit/rollback/join và ghi {{events}}), {{TxAdvice}} (mô phỏng {{TransactionInterceptor}}), {{MetricsAdvice}}, {{BlockAdvice}} (không gọi {{proceed()}}), {{UpperAdvice}} (đổi kết quả), {{Worker}}/{{WorkerImpl}} ({{outer()}} gọi {{this.inner()}} — self-invocation; {{delegated()}} gọi sang {{Helper}} đã được bọc proxy), {{Helper}}/{{HelperImpl}}.

Các test sẽ kiểm tra: proxy đúng interface, transaction mở/commit, thứ tự advisor, pointcut không khớp, self-invocation, gọi bean khác thì join, RuntimeException rollback và tới caller nguyên vẹn, advice chặn không cho target chạy, advice đổi kết quả, và JDK proxy không cast được sang class cụ thể (lý do cần CGLIB).`,
    starter: `import java.lang.reflect.*;
import java.util.*;

interface Advice {
    Object invoke(MethodCall call) throws Throwable;
}

interface MethodCall {
    String methodName();
    Object[] args();
    Object proceed() throws Throwable;
}

final class Advisor {
    final String pattern;
    final int order;
    final Advice advice;
    Advisor(String pattern, int order, Advice advice) {
        this.pattern = pattern;
        this.order = order;
        this.advice = advice;
    }
    boolean matches(String name) {
        if (pattern.endsWith("*")) return name.startsWith(pattern.substring(0, pattern.length() - 1));
        return pattern.equals(name);
    }
}

class TxLog {
    int begins, commits, rollbacks, joins;
    boolean active;
    final List<String> events = new ArrayList<>();
}

class TxAdvice implements Advice {
    private final TxLog log;
    TxAdvice(TxLog log) { this.log = log; }
    public Object invoke(MethodCall call) throws Throwable {
        if (log.active) {
            log.joins++;
            log.events.add("join:" + call.methodName());
            return call.proceed();
        }
        log.begins++;
        log.active = true;
        log.events.add("begin:" + call.methodName());
        try {
            Object out = call.proceed();
            log.commits++;
            log.events.add("commit:" + call.methodName());
            return out;
        } catch (RuntimeException | Error e) {
            log.rollbacks++;
            log.events.add("rollback:" + call.methodName());
            throw e;
        } finally {
            log.active = false;
        }
    }
}

class MetricsAdvice implements Advice {
    private final TxLog log;
    MetricsAdvice(TxLog log) { this.log = log; }
    public Object invoke(MethodCall call) throws Throwable {
        log.events.add("metrics:start");
        try { return call.proceed(); }
        finally { log.events.add("metrics:end"); }
    }
}

class BlockAdvice implements Advice {
    private final TxLog log;
    BlockAdvice(TxLog log) { this.log = log; }
    public Object invoke(MethodCall call) {
        log.events.add("blocked");
        return "blocked";
    }
}

class UpperAdvice implements Advice {
    public Object invoke(MethodCall call) throws Throwable {
        Object out = call.proceed();
        return out instanceof String ? ((String) out).toUpperCase() : out;
    }
}

interface Worker {
    String outer();
    String inner();
    String delegated();
    String save();
    String plain();
    String boom();
}

class WorkerImpl implements Worker {
    private final Helper helper;
    WorkerImpl(Helper helper) { this.helper = helper; }
    public String outer() { return "outer|" + inner(); }
    public String inner() { return "inner"; }
    public String delegated() { return "delegated|" + helper.save(); }
    public String save() { return "saved"; }
    public String plain() { return "plain"; }
    public String boom() { throw new IllegalStateException("db down"); }
}

interface Helper { String save(); }
class HelperImpl implements Helper { public String save() { return "helper-saved"; } }

class MiniAop {
    static Object wrap(Object target, Class<?> iface, List<Advisor> advisors) {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `import java.lang.reflect.*;
import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    interface Body { void run() throws Throwable; }
    static void check(String name, Body body) { total++; try { body.run(); passed++; System.out.println("PASS " + name); } catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); } }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError("expected [" + b + "] but was [" + a + "]"); }
    static Worker worker(TxLog log, Helper helper) {
        return (Worker) MiniAop.wrap(new WorkerImpl(helper), Worker.class, List.of(new Advisor("*", 100, new TxAdvice(log))));
    }
    public static void main(String[] args) {
        check("proxy cai dung interface", () -> {
            Worker w = (Worker) MiniAop.wrap(new WorkerImpl(null), Worker.class, List.of());
            if (!Proxy.isProxyClass(w.getClass())) throw new AssertionError("phai la JDK proxy");
        });
        check("transaction mo va commit", () -> {
            TxLog log = new TxLog();
            Worker w = worker(log, null);
            eq(w.save(), "saved");
            eq(log.events, List.of("begin:save", "commit:save"));
            eq(log.begins, 1); eq(log.commits, 1); eq(log.rollbacks, 0);
        });
        check("advisor order nho chay ngoai", () -> {
            TxLog log = new TxLog();
            List<Advisor> advisors = List.of(
                new Advisor("save*", 100, new TxAdvice(log)),
                new Advisor("save*", 10, new MetricsAdvice(log))
            );
            Worker w = (Worker) MiniAop.wrap(new WorkerImpl(null), Worker.class, advisors);
            eq(w.save(), "saved");
            eq(log.events, List.of("metrics:start", "begin:save", "commit:save", "metrics:end"));
        });
        check("pointcut khong khop thi goi thang", () -> {
            TxLog log = new TxLog();
            Worker w = (Worker) MiniAop.wrap(new WorkerImpl(null), Worker.class, List.of(new Advisor("other*", 10, new TxAdvice(log))));
            eq(w.plain(), "plain");
            eq(log.events, List.of()); eq(log.begins, 0);
        });
        check("self-invocation bo qua proxy", () -> {
            TxLog log = new TxLog();
            Worker w = worker(log, null);
            eq(w.outer(), "outer|inner");
            eq(log.events, List.of("begin:outer", "commit:outer"));
            eq(log.begins, 1); eq(log.joins, 0);
        });
        check("goi bean khac thi join transaction ngoai", () -> {
            TxLog log = new TxLog();
            Helper h = (Helper) MiniAop.wrap(new HelperImpl(), Helper.class, List.of(new Advisor("*", 100, new TxAdvice(log))));
            Worker w = worker(log, h);
            eq(w.delegated(), "delegated|helper-saved");
            eq(log.events, List.of("begin:delegated", "join:save", "commit:delegated"));
            eq(log.begins, 1); eq(log.joins, 1);
        });
        check("RuntimeException rollback va toi caller nguyen ven", () -> {
            TxLog log = new TxLog();
            Worker w = worker(log, null);
            try { w.boom(); throw new AssertionError("phai nem exception"); }
            catch (IllegalStateException e) { eq(e.getMessage(), "db down"); }
            eq(log.events, List.of("begin:boom", "rollback:boom"));
            eq(log.commits, 0); eq(log.rollbacks, 1); eq(log.active, false);
        });
        check("advice khong goi proceed thi chan target", () -> {
            TxLog log = new TxLog();
            Worker w = (Worker) MiniAop.wrap(new WorkerImpl(null), Worker.class, List.of(
                new Advisor("save*", 1, new BlockAdvice(log)),
                new Advisor("save*", 100, new TxAdvice(log))
            ));
            eq(w.save(), "blocked");
            eq(log.events, List.of("blocked")); eq(log.begins, 0);
        });
        check("advice doi duoc ket qua", () -> {
            Worker w = (Worker) MiniAop.wrap(new WorkerImpl(null), Worker.class, List.of(new Advisor("save*", 10, new UpperAdvice())));
            eq(w.save(), "SAVED");
        });
        check("JDK proxy khong cast duoc sang class cu the", () -> {
            Worker w = (Worker) MiniAop.wrap(new WorkerImpl(null), Worker.class, List.of());
            try { Object bad = (WorkerImpl) w; throw new AssertionError("phai nem ClassCastException, nhan " + bad); }
            catch (ClassCastException expected) { }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `import java.lang.reflect.*;
import java.util.*;

interface Advice {
    Object invoke(MethodCall call) throws Throwable;
}

interface MethodCall {
    String methodName();
    Object[] args();
    Object proceed() throws Throwable;
}

final class Advisor {
    final String pattern;
    final int order;
    final Advice advice;
    Advisor(String pattern, int order, Advice advice) {
        this.pattern = pattern;
        this.order = order;
        this.advice = advice;
    }
    boolean matches(String name) {
        if (pattern.endsWith("*")) return name.startsWith(pattern.substring(0, pattern.length() - 1));
        return pattern.equals(name);
    }
}

class TxLog {
    int begins, commits, rollbacks, joins;
    boolean active;
    final List<String> events = new ArrayList<>();
}

class TxAdvice implements Advice {
    private final TxLog log;
    TxAdvice(TxLog log) { this.log = log; }
    public Object invoke(MethodCall call) throws Throwable {
        if (log.active) {
            log.joins++;
            log.events.add("join:" + call.methodName());
            return call.proceed();
        }
        log.begins++;
        log.active = true;
        log.events.add("begin:" + call.methodName());
        try {
            Object out = call.proceed();
            log.commits++;
            log.events.add("commit:" + call.methodName());
            return out;
        } catch (RuntimeException | Error e) {
            log.rollbacks++;
            log.events.add("rollback:" + call.methodName());
            throw e;
        } finally {
            log.active = false;
        }
    }
}

class MetricsAdvice implements Advice {
    private final TxLog log;
    MetricsAdvice(TxLog log) { this.log = log; }
    public Object invoke(MethodCall call) throws Throwable {
        log.events.add("metrics:start");
        try { return call.proceed(); }
        finally { log.events.add("metrics:end"); }
    }
}

class BlockAdvice implements Advice {
    private final TxLog log;
    BlockAdvice(TxLog log) { this.log = log; }
    public Object invoke(MethodCall call) {
        log.events.add("blocked");
        return "blocked";
    }
}

class UpperAdvice implements Advice {
    public Object invoke(MethodCall call) throws Throwable {
        Object out = call.proceed();
        return out instanceof String ? ((String) out).toUpperCase() : out;
    }
}

interface Worker {
    String outer();
    String inner();
    String delegated();
    String save();
    String plain();
    String boom();
}

class WorkerImpl implements Worker {
    private final Helper helper;
    WorkerImpl(Helper helper) { this.helper = helper; }
    public String outer() { return "outer|" + inner(); }
    public String inner() { return "inner"; }
    public String delegated() { return "delegated|" + helper.save(); }
    public String save() { return "saved"; }
    public String plain() { return "plain"; }
    public String boom() { throw new IllegalStateException("db down"); }
}

interface Helper { String save(); }
class HelperImpl implements Helper { public String save() { return "helper-saved"; } }

class MiniAop {
    static Object wrap(Object target, Class<?> iface, List<Advisor> advisors) {
        List<Advisor> sorted = new ArrayList<>(advisors);
        sorted.sort(Comparator.comparingInt(a -> a.order));
        return Proxy.newProxyInstance(iface.getClassLoader(), new Class<?>[] { iface }, (proxy, method, args) -> {
            List<Advisor> chain = new ArrayList<>();
            for (Advisor a : sorted) if (a.matches(method.getName())) chain.add(a);
            return invokeChain(target, method, args, chain, 0);
        });
    }
    private static Object invokeChain(Object target, Method method, Object[] args, List<Advisor> chain, int index) throws Throwable {
        if (index == chain.size()) {
            try { return method.invoke(target, args); }
            catch (InvocationTargetException e) { throw e.getCause(); }
        }
        int next = index + 1;
        MethodCall call = new MethodCall() {
            public String methodName() { return method.getName(); }
            public Object[] args() { return args; }
            public Object proceed() throws Throwable { return invokeChain(target, method, args, chain, next); }
        };
        return chain.get(index).advice.invoke(call);
    }
}`,
    hints: [
      'Proxy.newProxyInstance(loader, interfaces, handler): loader lấy từ iface.getClassLoader(), interfaces chỉ gồm iface. Trong handler, method là method của interface; muốn gọi code thật phải invoke trên target.',
      'Sắp advisor theo order tăng dần rồi dựng chain bằng chỉ số: advice thứ i nhận một MethodCall mà proceed() gọi advice thứ i+1. Khi chỉ số bằng kích thước chain thì invoke target.',
      'Bắt InvocationTargetException và ném getCause(): nếu không, caller nhận UndeclaredThrowableException thay vì IllegalStateException. Dùng finally để hạ cờ active giống Spring gỡ ThreadLocal.',
    ],
    explain: `Bài tập dựng lại ba quyết định cốt lõi của Spring AOP: chọn method theo pointcut, sắp advisor theo order, và chạy chuỗi bằng proceed().

**Thứ tự là hành vi, không phải cú pháp.** Test "order nhỏ chạy ngoài" cho thấy metrics (order 10) bọc ngoài transaction (order 100): đồng hồ đo cả thời gian mở transaction và commit. Nếu bạn muốn đo thời gian thuần nghiệp vụ, hãy đặt metrics **trong** transaction (order lớn hơn). Cùng một đoạn code, hai order khác nhau, hai ý nghĩa khác nhau.

**Self-invocation không phải bug của bạn.** Test "self-invocation" cho kết quả "outer|inner" (nghiệp vụ vẫn chạy) nhưng events chỉ có begin/commit của outer. {{this.inner()}} đi thẳng target; handler không được hỏi. Trong Spring thật, inner khi đó chạy nhờ transaction của outer, và mọi annotation của inner ({{REQUIRES_NEW}}, {{readOnly}}, {{@Cacheable}}) bị bỏ qua im lặng.

**Gọi bean khác thì advice chạy.** Test "join" cho begin:delegated, join:save, commit:delegated: một transaction, một commit. Đây chính là lý do "tách bean" là cách sửa self-invocation hiệu quả nhất — nó không đổi propagation, nó chỉ đưa lời gọi đi qua proxy.

**Advice có thể chặn hoặc đổi kết quả.** BlockAdvice không gọi proceed nên target không chạy; UpperAdvice gọi proceed rồi đổi kết quả. Đây là sức mạnh của around advice, cũng là nơi dễ viết sai: nếu advice không gọi proceed trong một nhánh, mọi logic phía sau bị bỏ qua.

**JDK proxy không thay thế được class.** Test cast cho thấy proxy chỉ là interface. Trong Spring Boot 3, CGLIB là mặc định nên bạn thường không gặp; nhưng nếu tắt proxy-target-class, những chỗ inject theo class cụ thể sẽ nổ ClassCastException. Đây là lý do "inject theo interface" vẫn là thói quen tốt, kể cả khi dùng CGLIB.`,
  }],
  check: [
    { q: 'Trong Spring AOP, thứ tự advisor được xác định thế nào và ý nghĩa của order nhỏ?', options: ['Thứ tự khai báo trong file cấu hình; order nhỏ chạy sau', 'Theo {{Ordered}}/{{@Order}}; giá trị nhỏ hơn có độ ưu tiên cao hơn và nằm ngoài chuỗi', 'Theo thứ tự alphabet của tên method', 'Theo thứ tự bean được tạo; order không có tác dụng'], answer: 1, explain: `Spring sắp advisor bằng {{Ordered}}/{{@Order}} (và {{PriorityOrdered}} cho một số hạ tầng). Giá trị **nhỏ hơn** có độ ưu tiên cao hơn, tức nằm **ngoài** và chạy trước. Transaction advisor mặc định có order {{LOWEST_PRECEDENCE}}, nên aspect không khai order thường nằm trong hoặc cùng mức. Thứ tự khai báo không được đảm bảo; tên method và thứ tự tạo bean cũng không quyết định.` },
    { q: 'Bean {{final class PaymentService}} có method {{@Transactional}}. Spring Boot 3 khởi động thì điều gì xảy ra?', options: ['Vẫn chạy bình thường vì Spring dùng JDK proxy', 'App không boot: CGLIB không tạo được lớp con của class final, ném lỗi kiểu Cannot subclass final class', 'Transaction vẫn mở nhưng bị bỏ qua cảnh báo', 'Chỉ mất AOP cho method đó, app vẫn boot'], answer: 1, explain: `Boot mặc định {{spring.aop.proxy-target-class=true}}, nên Spring tạo CGLIB proxy bằng cách sinh lớp con. Class {{final}} không cho phép subclass → lỗi lúc tạo proxy, app không boot. Cách sửa: bỏ {{final}} hoặc chuyển sang JDK proxy bằng interface. JDK proxy không cần subclass nên không gặp lỗi này, nhưng nó không phải mặc định của Boot.` },
    { q: 'Một aspect khai {{@Order(50)}}, còn transaction advisor mặc định dùng {{Ordered.LOWEST_PRECEDENCE}}. Aspect nằm ở đâu?', options: ['Trong transaction, vì 50 lớn hơn LOWEST_PRECEDENCE', 'Ngoài transaction, vì 50 nhỏ hơn LOWEST_PRECEDENCE nên aspect chạy trước', 'Cùng mức, thứ tự hoàn toàn ngẫu nhiên', 'Aspect không bao giờ chạy khi có transaction'], answer: 1, explain: `Order nhỏ hơn có độ ưu tiên cao hơn và nằm ngoài. {{@Order(50)}} nhỏ hơn {{Integer.MAX_VALUE}} (LOWEST_PRECEDENCE), nên aspect chạy trước transaction: nếu nó ném exception và không gọi proceed, transaction chưa mở. Nếu aspect không khai order, nó cũng có order mặc định thấp nhất, nên đừng dựa vào thứ tự; hãy gán order tường minh.` },
    { q: 'Vì sao proxy JDK không cast được sang class cụ thể, và Spring Boot xử lý thế nào?', options: ['Vì proxy JDK chỉ cài interface, không phải lớp con của class; Boot mặc định dùng CGLIB nên inject theo class vẫn được', 'Vì JDK proxy không hỗ trợ method có tham số', 'Vì class cụ thể phải khai báo non-static', 'Vì Boot luôn tắt AOP mặc định'], answer: 0, explain: `JDK dynamic proxy sinh một class **cài interface**, không phải lớp con của class target, nên {{((PaymentServiceImpl) proxy)}} ném {{ClassCastException}}. CGLIB sinh lớp con nên proxy là instance của class target. Spring Boot đặt {{spring.aop.proxy-target-class=true}} mặc định, nên inject theo class cụ thể vẫn chạy; Spring Framework thuần mặc định JDK nếu target có interface.` }
  ],
  related: ['spring-006', 'spring-028'], tags: ['AOP', 'proxy', 'CGLIB', 'advisor', '@Order', 'self-invocation']
},
{
  id: 'lesson-spring-015', track: 'spring', order: 15,
  title: 'BeanPostProcessor: hook can thiệp vào mọi bean và vì sao nó tạo ra proxy', level: 'senior', minutes: 45,
  goals: [
    'Phân biệt BeanFactoryPostProcessor và BeanPostProcessor theo thời điểm và phạm vi',
    'Nêu đúng thứ tự {{postProcessBeforeInitialization}}, {{@PostConstruct}}, {{afterPropertiesSet}}, init-method, {{postProcessAfterInitialization}}',
    'Giải thích vì sao BeanPostProcessor phải được tạo sớm và vì sao không nên inject bean vào nó',
    'Tự viết container DI mini có chuỗi post-processor, thay thế bean và quản lý destroy',
  ],
  body: `**Tóm tắt:** {{BeanPostProcessor}} (BPP) là callback mà container gọi cho **mỗi bean vừa được tạo**, trước và sau khi bean chạy callback khởi tạo. Nó là cách Spring cài đặt những thứ "xuyên suốt": {{@Autowired}}, {{@PostConstruct}}, {{@ConfigurationProperties}}, và cả AOP proxy. BPP thấy **instance** của bean; {{BeanFactoryPostProcessor}} (BFPP) thấy **định nghĩa** bean trước khi instance tồn tại. Hiểu đúng hai hook của BPP và thứ tự của chúng là chìa khoá để đọc được vòng đời bean, debug một proxy xuất hiện "không ai tạo", và tránh làm chậm khởi động.

### Vì sao container cần một hook như vậy
Container biết cách tạo object, nhưng không biết object đó cần được "trang trí" gì. Ví dụ đời thường: một nhà máy sản xuất linh kiện. Container là dây chuyền tạo ra linh kiện thô. BPP là **trạm kiểm định** đặt trên dây chuyền: mỗi linh kiện đi qua đều được kiểm tra, dán nhãn, bọc hộp. Trạm kiểm định không sửa bản thiết kế (đó là việc của BFPP), nó tác động lên **sản phẩm thật** trước khi sản phẩm được đưa vào kho (context).

Nếu không có hook, Spring phải viết sẵn mọi thứ trong lõi: biết trước bean nào cần {{@Autowired}}, bean nào cần proxy, bean nào cần đăng ký listener. BPP biến những thứ đó thành **mixin**: ai cần thì đăng ký một processor, không cần thì không trả giá.

### Hai hook, hai thời điểm
Giao diện BPP có hai method:

~~~java
public interface BeanPostProcessor {
    Object postProcessBeforeInitialization(Object bean, String beanName) throws BeansException;
    Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException;
}
~~~

- **Before**: chạy ngay sau khi bean được tạo và inject dependency, **trước** các callback khởi tạo ({{@PostConstruct}}, {{afterPropertiesSet}}, init-method). Đây là nơi {{CommonAnnotationBeanPostProcessor}} gọi {{@PostConstruct}}, {{ApplicationContextAwareProcessor}} gọi các {{*Aware}}, và {{ConfigurationPropertiesBindingPostProcessor}} bind cấu hình.
- **After**: chạy **sau** init. Đây là nơi {{AbstractAutoProxyCreator}} bọc AOP proxy ({{@Transactional}}, {{@Cacheable}}, {{@Async}}), nơi {{ScheduledAnnotationBeanPostProcessor}} đăng ký method {{@Scheduled}}, nơi {{ApplicationListenerDetector}} phát hiện listener.

Cả hai method nhận bean và trả về bean. Nếu trả về một object khác, container **dùng object đó** cho các bước sau: đó là cách AOP proxy thay thế target. Nếu trả về chính bean, không có gì thay đổi. Hợp đồng của Spring là trả về bean (gốc hoặc bản bọc). Trong bài tập dưới đây, trả về null được hiểu là giữ nguyên bean cho đơn giản; ở code thật, đừng dựa vào quy ước đó — hãy luôn trả về bean.

Thứ tự đầy đủ của một singleton:

~~~text
tạo instance (constructor)
  → inject dependency (AutowiredAnnotationBeanPostProcessor, ở giai đoạn populate)
  → postProcessBeforeInitialization của mọi BPP (theo thứ tự)
  → @PostConstruct
  → afterPropertiesSet (InitializingBean)
  → init-method
  → postProcessAfterInitialization của mọi BPP (theo thứ tự)
  → bean sẵn sàng
~~~

Hệ quả quan trọng: trong {{@PostConstruct}}, bean **chưa** được bọc proxy (proxy tạo ở bước sau). Vì vậy gọi {{this.method()}} có {{@Transactional}} từ {{@PostConstruct}} là self-call và không có transaction. Đây là cùng một cái bẫy đã gặp ở AOP, nhưng nhìn từ góc độ vòng đời.

### Thứ tự giữa các BPP
Container không chạy BPP theo thứ tự bạn viết {{@Bean}}. Nó sắp xếp: các BPP cài {{PriorityOrdered}} trước, rồi {{Ordered}}, rồi các BPP còn lại; trong mỗi nhóm dùng {{@Order}}/{{Ordered}}. BPP có order nhỏ chạy trước. Vì cả hai hook (before và after) dùng cùng danh sách đã sắp, một BPP có order 10 sẽ chạy before thứ 10 và after thứ 10 — không có chuyện "before theo thứ tự này, after theo thứ tự ngược".

Điều này có nghĩa: nếu bạn đặt BPP của mình trước {{CommonAnnotationBeanPostProcessor}}, nó thấy bean **trước khi** {{@PostConstruct}} chạy; nếu đặt sau, nó thấy bean sau khi {{@PostConstruct}} đã chạy. Thứ tự không chỉ là "cho đẹp": nó quyết định dữ liệu nào đã sẵn sàng.

### Vì sao BPP phải được tạo sớm, và cái giá của việc inject bean vào BPP
BPP là hạ tầng: container phải có chúng **trước** khi tạo các bean nghiệp vụ, vì chúng tham gia vào việc tạo bean. Vì vậy container instantiate BPP rất sớm, trước cả khi hoàn tất đăng ký các BPP khác. Nếu một BPP khai báo {{@Autowired MyService}}, container buộc phải tạo {{MyService}} ngay lúc đó — khi chưa phải tất cả BPP đã sẵn sàng. Các BPP đăng ký sau sẽ không áp dụng cho {{MyService}}. Spring cảnh báo "not eligible for getting processed by all BeanPostProcessors" và bean đó có thể thiếu proxy, thiếu {{@PostConstruct}}, hoặc không được đo metrics.

Vì lý do tương tự, khi khai báo một BPP bằng {{@Bean}} trong class cấu hình, method đó nên là **static**: nếu không, container phải khởi tạo cả class cấu hình để gọi method, kéo theo class cấu hình bị tạo sớm và không được các BPP khác xử lý đầy đủ.

### BeanFactoryPostProcessor khác gì BeanPostProcessor
| Tiêu chí | BeanFactoryPostProcessor | BeanPostProcessor |
|---|---|---|
| Thời điểm | Sau khi đọc xong định nghĩa bean, **trước** khi tạo instance | Sau khi tạo instance, trước/sau init |
| Đối tượng | {{ConfigurableListableBeanFactory}}: sửa {{BeanDefinition}}, thêm bean definition | Instance bean cụ thể |
| Ví dụ | {{ConfigurationClassPostProcessor}} (xử lý {{@Configuration}}), {{PropertySourcesPlaceholderConfigurer}} (thay placeholder cấu hình) | {{AutowiredAnnotationBeanPostProcessor}}, {{CommonAnnotationBeanPostProcessor}}, {{AbstractAutoProxyCreator}} |
| Thấy bean nghiệp vụ | Chưa, chỉ thấy "công thức" | Có, thấy object thật |
| Có được inject bean | Không nên: sẽ tạo bean quá sớm | Có, nhưng phải cẩn thận như trên |

Ghi nhớ một câu: **BFPP sửa bản thiết kế, BPP sửa sản phẩm.** Nếu bạn cần thay đổi class được dùng cho một bean, hoặc thêm một bean definition mới, đó là BFPP. Nếu bạn cần bọc bean bằng proxy, đo thời gian, kiểm tra trạng thái sau init, đó là BPP.

### Bốn lỗi hay gặp
- **{{@Bean}} trả về BPP không static**: class cấu hình bị tạo sớm, log "not eligible for getting processed by all BeanPostProcessors"; BPP của bạn không áp dụng cho chính class đó và có thể cho các bean khác. Sửa: thêm {{static}} vào method {{@Bean}}.
- **BPP trả về wrapper khác kiểu**: bean bị thay bằng một object không cài interface/lớp của bean gốc → chỗ inject theo kiểu gốc ném {{ClassCastException}} hoặc không tìm thấy bean. Nếu bọc, wrapper phải giữ đúng kiểu (hoặc ít nhất các interface mà caller cần).
- **BPP làm việc nặng (gọi HTTP, đọc file, kết nối DB) cho mỗi bean**: chi phí nhân với số bean. 400 bean × 50 ms = 20 giây startup; nếu dịch vụ ngoài chậm 2 giây, app không boot. Sửa: đọc cấu hình một lần vào một map, BPP chỉ tra map; hoặc chuyển việc nặng sang {{ApplicationReadyEvent}}.
- **Double wrapping**: hai BPP cùng bọc bean bằng proxy (một của bạn, một của AOP) → hai lớp advice, metrics đếm hai lần, transaction lồng nhau. Sửa: chỉ dùng một cơ chế; nếu cần thêm hành vi, viết một advisor thay vì tự bọc.

### Ví dụ đời thực
Một team muốn tối ưu thời gian khởi động (startup từ 38 giây). Họ thêm một BPP để đo thời gian tạo từng bean và ghi vào log. BPP này, để biết bean thuộc tenant nào, gọi một API cấu hình từ xa cho **mỗi** bean. Ứng dụng có 480 bean: 480 × 25 ms = 12 giây, startup tăng lên 50 giây; tệ hơn, khi API chậm 2 giây, một số pod không kịp readiness probe và bị restart.

Đội sửa bằng cách đọc cấu hình một lần lúc context refresh, lưu vào {{ConcurrentHashMap}}, rồi BPP chỉ tra map. Startup về 39 giây, không còn phụ thuộc API ngoài. Bài học: BPP chạy cho **mọi** bean, nên mọi chi phí trong BPP bị nhân với số bean; và BPP là hạ tầng, không phải nơi gọi dịch vụ mạng.

Một lỗi khác cùng chủ đề: một BPP bọc mọi {{@Service}} bằng JDK proxy theo interface. Những service có interface thì bị bọc, nhưng chỗ khác inject theo class cụ thể nhận proxy chỉ cài interface → {{ClassCastException}} lúc khởi động. Cách sửa đúng là dùng AOP của Spring (CGLIB mặc định của Boot) thay vì tự viết BPP bọc proxy.

### Liên hệ phỏng vấn
1. **BeanPostProcessor chạy ở đâu trong vòng đời bean, và nó khác BeanFactoryPostProcessor thế nào?** — BPP chạy sau khi bean được tạo và inject, ở hai hook trước/sau init; nó thấy instance. BFPP chạy trước khi tạo instance, sửa BeanDefinition. BFPP sửa bản thiết kế, BPP sửa sản phẩm.
2. **Vì sao AOP proxy được tạo ở postProcessAfterInitialization mà không phải trước đó?** — Vì proxy phải bọc một bean đã hoàn chỉnh (đã inject dependency, đã chạy init). Nếu bọc sớm, proxy sẽ trỏ tới một target thiếu dependency. Đây cũng là lý do {{@Transactional}} trong {{@PostConstruct}} không chạy: lúc đó proxy chưa tồn tại.
3. **Vì sao không nên inject bean nghiệp vụ vào một BeanPostProcessor?** — BPP được tạo rất sớm; inject bean sẽ buộc bean đó tạo sớm, trước khi các BPP khác sẵn sàng, nên bean mất một phần xử lý (proxy, {{@PostConstruct}}, metrics). Spring cảnh báo "not eligible for getting processed by all BeanPostProcessors".
4. **Làm sao biết một bean đã bị BPP bọc?** — In {{bean.getClass().getName()}}: nếu là CGLIB sẽ thấy hậu tố kiểu {{$$SpringCGLIB$$0}}; nếu là JDK proxy sẽ thấy {{com.sun.proxy.$Proxy...}} và {{AopUtils.isAopProxy(bean)}} là true. Nhưng đừng dùng cách này để quyết định logic nghiệp vụ.

> Senior tip: BPP là con dao hai lưỡi: nó cho bạn quyền thay đổi **mọi** bean, nên một dòng code sai trong BPP ảnh hưởng toàn bộ ứng dụng. Hãy giữ BPP mỏng, không I/O, không inject bean nghiệp vụ, và luôn trả về bean (gốc hoặc bản bọc). Khi nghi ngờ một proxy "không biết từ đâu ra", đọc danh sách BPP và thứ tự của chúng trước khi đọc code nghiệp vụ.`,
  exercises: [{
    title: 'MiniContainer: DI mini có chuỗi BeanPostProcessor, thay thế bean và destroy',
    prompt: `Hoàn thiện {{MiniContainer}} — một container DI tối giản mô phỏng vòng đời singleton/prototype và hai hook của {{BeanPostProcessor}}.

API:
- {{register(name, factory)}}: đăng ký singleton. {{factory}} nhận container để resolve dependency (ví dụ {{c -> new Service(c.getBean("repo"))}}).
- {{registerPrototype(name, factory)}}: đăng ký prototype. Mỗi lần {{getBean}} tạo object mới, chạy BPP và init mỗi lần, không lưu singleton, không destroy.
- {{addProcessor(p)}}: thêm BPP. Container sắp xếp theo {{order()}} tăng dần (nhỏ chạy trước); cả before và after dùng cùng thứ tự.
- {{init(name, runnable)}} / {{destroy(name, runnable)}}: callback khởi tạo và hủy.
- {{getBean(name)}}: nếu singleton đã tạo thì trả lại; nếu đang tạo mà bị gọi lại → ném {{IllegalStateException}} có chữ "circular dependency"; tạo bằng factory; chạy mọi BPP {{postProcessBeforeInitialization}}; chạy init; chạy mọi BPP {{postProcessAfterInitialization}}; lưu singleton.
- BPP trả về object khác thì **thay thế** bean cho các bước sau (đây là cách AOP proxy hoạt động). Trả về null được hiểu là giữ nguyên bean.
- {{close()}}: gọi {{destroy}} cho singleton theo thứ tự **ngược** với thứ tự tạo; gọi lần hai không làm gì; sau {{close}}, {{getBean}} ném {{IllegalStateException}}.

Ghi sự kiện vào {{container.events}} theo đúng định dạng để test so sánh:
- {{create:<name>}} sau khi factory trả về,
- {{before:<label>:<name>}} và {{after:<label>:<name>}} từ BPP,
- {{init:<name>}} sau callback init (container tự ghi, callback không cần ghi),
- {{ready:<name>}} sau khi lưu singleton (prototype không có ready),
- {{destroy:<name>}} khi close.

Fixture có sẵn: {{Service}}/{{ServiceImpl}}/{{Wrapper}}, {{RecordingProcessor}} (ghi before/after), {{ClassRecordingProcessor}} (ghi class của bean để chứng minh thứ tự thay thế), {{BeforeReplaceProcessor}} (before trả về Wrapper), {{AfterReplaceProcessor}} (after trả về Wrapper).

Test sẽ kiểm tra: thứ tự before/after theo order, before thay thế bean và các bước sau thấy bản thay thế, after thay thế bean, dependency được tạo xong trước bean phụ thuộc, prototype tạo mới mỗi lần và không destroy, circular dependency bị phát hiện, init lỗi không cache bean, và close idempotent.`,
    starter: `import java.util.*;
import java.util.function.*;

interface BeanPostProcessor {
    int order();
    Object postProcessBeforeInitialization(Object bean, String beanName);
    Object postProcessAfterInitialization(Object bean, String beanName);
}

final class BeanDefinition {
    final String name;
    final Function<MiniContainer, Object> factory;
    final boolean singleton;
    Runnable init;
    Runnable destroy;
    BeanDefinition(String name, Function<MiniContainer, Object> factory, boolean singleton) {
        this.name = name;
        this.factory = factory;
        this.singleton = singleton;
    }
}

class MiniContainer implements AutoCloseable {
    final List<String> events = new ArrayList<>();
    private final Map<String, BeanDefinition> defs = new LinkedHashMap<>();
    private final Map<String, Object> singletons = new LinkedHashMap<>();
    private final Set<String> creating = new HashSet<>();
    private final List<BeanPostProcessor> processors = new ArrayList<>();
    private boolean closed;

    MiniContainer register(String name, Function<MiniContainer, Object> factory) {
        throw new UnsupportedOperationException("TODO");
    }

    MiniContainer registerPrototype(String name, Function<MiniContainer, Object> factory) {
        throw new UnsupportedOperationException("TODO");
    }

    MiniContainer addProcessor(BeanPostProcessor processor) {
        throw new UnsupportedOperationException("TODO");
    }

    MiniContainer init(String name, Runnable init) {
        throw new UnsupportedOperationException("TODO");
    }

    MiniContainer destroy(String name, Runnable destroy) {
        throw new UnsupportedOperationException("TODO");
    }

    Object getBean(String name) {
        throw new UnsupportedOperationException("TODO");
    }

    @Override public void close() {
        throw new UnsupportedOperationException("TODO");
    }
}`,
    tests: `import java.util.*;

public class Main {
    static int passed = 0, total = 0;
    interface Body { void run() throws Throwable; }
    static void check(String name, Body body) { total++; try { body.run(); passed++; System.out.println("PASS " + name); } catch (Throwable t) { System.out.println("FAIL " + name + ": " + t); } }
    static void eq(Object a, Object b) { if (!Objects.equals(a, b)) throw new AssertionError("expected [" + b + "] but was [" + a + "]"); }
    static int count(List<String> list, String item) { int n = 0; for (String s : list) if (s.equals(item)) n++; return n; }

    interface Service { String hello(); }
    static class ServiceImpl implements Service {
        public String hello() { return "hello"; }
    }
    static class Wrapper implements Service {
        final Service delegate;
        Wrapper(Service delegate) { this.delegate = delegate; }
        public String hello() { return "wrapped:" + delegate.hello(); }
    }
    static class RecordingProcessor implements BeanPostProcessor {
        final String label; final int order; final MiniContainer c;
        RecordingProcessor(String label, int order, MiniContainer c) { this.label = label; this.order = order; this.c = c; }
        public int order() { return order; }
        public Object postProcessBeforeInitialization(Object bean, String beanName) { c.events.add("before:" + label + ":" + beanName); return bean; }
        public Object postProcessAfterInitialization(Object bean, String beanName) { c.events.add("after:" + label + ":" + beanName); return bean; }
    }
    static class ClassRecordingProcessor implements BeanPostProcessor {
        final MiniContainer c; final int order; final String label;
        ClassRecordingProcessor(MiniContainer c, int order, String label) { this.c = c; this.order = order; this.label = label; }
        public int order() { return order; }
        public Object postProcessBeforeInitialization(Object bean, String beanName) { c.events.add("before:" + label + ":" + bean.getClass().getSimpleName()); return bean; }
        public Object postProcessAfterInitialization(Object bean, String beanName) { c.events.add("after:" + label + ":" + bean.getClass().getSimpleName()); return bean; }
    }
    static class BeforeReplaceProcessor implements BeanPostProcessor {
        public int order() { return 1; }
        public Object postProcessBeforeInitialization(Object bean, String beanName) { return bean instanceof Service ? new Wrapper((Service) bean) : bean; }
        public Object postProcessAfterInitialization(Object bean, String beanName) { return bean; }
    }
    static class AfterReplaceProcessor implements BeanPostProcessor {
        public int order() { return 1; }
        public Object postProcessBeforeInitialization(Object bean, String beanName) { return bean; }
        public Object postProcessAfterInitialization(Object bean, String beanName) { return bean instanceof Service ? new Wrapper((Service) bean) : bean; }
    }

    public static void main(String[] args) {
        check("thu tu before/after theo order", () -> {
            MiniContainer c = new MiniContainer();
            c.register("svc", x -> new ServiceImpl());
            c.init("svc", () -> { });
            c.addProcessor(new RecordingProcessor("p10", 10, c));
            c.addProcessor(new RecordingProcessor("p20", 20, c));
            Object bean = c.getBean("svc");
            eq(bean.getClass(), ServiceImpl.class);
            eq(c.events, List.of("create:svc", "before:p10:svc", "before:p20:svc", "init:svc", "after:p10:svc", "after:p20:svc", "ready:svc"));
        });
        check("before thay the bean va cac buoc sau thay ban thay the", () -> {
            MiniContainer c = new MiniContainer();
            c.register("svc", x -> new ServiceImpl());
            c.addProcessor(new BeforeReplaceProcessor());
            c.addProcessor(new ClassRecordingProcessor(c, 0, "first"));
            c.addProcessor(new ClassRecordingProcessor(c, 5, "second"));
            Object bean = c.getBean("svc");
            eq(bean.getClass(), Wrapper.class);
            eq(((Service) bean).hello(), "wrapped:hello");
            eq(c.events, List.of("create:svc", "before:first:ServiceImpl", "before:second:Wrapper", "after:first:Wrapper", "after:second:Wrapper", "ready:svc"));
        });
        check("after thay the bean", () -> {
            MiniContainer c = new MiniContainer();
            c.register("svc", x -> new ServiceImpl());
            c.addProcessor(new AfterReplaceProcessor());
            c.addProcessor(new ClassRecordingProcessor(c, 5, "second"));
            Object bean = c.getBean("svc");
            eq(bean.getClass(), Wrapper.class);
            eq(c.events, List.of("create:svc", "before:second:ServiceImpl", "after:second:Wrapper", "ready:svc"));
        });
        check("dependency tao xong truoc bean phu thuoc", () -> {
            MiniContainer c = new MiniContainer();
            c.register("dep", x -> "DEP");
            c.register("svc", x -> { x.getBean("dep"); return "SVC"; });
            c.addProcessor(new RecordingProcessor("p", 10, c));
            c.getBean("svc");
            int depReady = c.events.indexOf("ready:dep");
            int svcCreate = c.events.indexOf("create:svc");
            if (depReady < 0 || svcCreate < 0 || depReady > svcCreate) throw new AssertionError(c.events);
        });
        check("prototype moi lan mot instance, khong destroy", () -> {
            MiniContainer c = new MiniContainer();
            c.registerPrototype("p", x -> new ServiceImpl());
            c.addProcessor(new RecordingProcessor("p", 10, c));
            Object a = c.getBean("p");
            Object b = c.getBean("p");
            if (a == b) throw new AssertionError("prototype phai tao moi lan");
            eq(c.events, List.of("create:p", "before:p:p", "after:p:p", "create:p", "before:p:p", "after:p:p"));
            c.register("s", x -> "S");
            c.destroy("s", () -> { });
            c.getBean("s");
            c.close();
            if (count(c.events, "destroy:s") != 1) throw new AssertionError(c.events);
            if (count(c.events, "destroy:p") != 0) throw new AssertionError(c.events);
        });
        check("circular dependency bi phat hien", () -> {
            MiniContainer c = new MiniContainer();
            c.register("a", x -> { x.getBean("b"); return "A"; });
            c.register("b", x -> { x.getBean("a"); return "B"; });
            try { c.getBean("a"); throw new AssertionError("phai nem IllegalStateException"); }
            catch (IllegalStateException e) { if (!e.getMessage().contains("circular")) throw new AssertionError(e.getMessage()); }
        });
        check("init loi khong cache bean", () -> {
            int[] calls = {0};
            MiniContainer c = new MiniContainer();
            c.register("bad", x -> { calls[0]++; return "BAD"; });
            c.init("bad", () -> { throw new IllegalStateException("init failed"); });
            try { c.getBean("bad"); throw new AssertionError("phai nem"); }
            catch (IllegalStateException e) { eq(e.getMessage(), "init failed"); }
            try { c.getBean("bad"); throw new AssertionError("phai nem lan hai"); }
            catch (IllegalStateException e) { eq(e.getMessage(), "init failed"); }
            eq(calls[0], 2);
            if (c.events.contains("ready:bad")) throw new AssertionError(c.events);
        });
        check("close idempotent va getBean sau close nem loi", () -> {
            MiniContainer c = new MiniContainer();
            c.register("s", x -> "S");
            c.destroy("s", () -> { });
            c.getBean("s");
            c.close();
            c.close();
            eq(count(c.events, "destroy:s"), 1);
            try { c.getBean("s"); throw new AssertionError("phai nem IllegalStateException"); }
            catch (IllegalStateException expected) { }
        });
        System.out.println("RESULT " + passed + "/" + total);
    }
}`,
    reference: `import java.util.*;
import java.util.function.*;

interface BeanPostProcessor {
    int order();
    Object postProcessBeforeInitialization(Object bean, String beanName);
    Object postProcessAfterInitialization(Object bean, String beanName);
}

final class BeanDefinition {
    final String name;
    final Function<MiniContainer, Object> factory;
    final boolean singleton;
    Runnable init;
    Runnable destroy;
    BeanDefinition(String name, Function<MiniContainer, Object> factory, boolean singleton) {
        this.name = name;
        this.factory = factory;
        this.singleton = singleton;
    }
}

class MiniContainer implements AutoCloseable {
    final List<String> events = new ArrayList<>();
    private final Map<String, BeanDefinition> defs = new LinkedHashMap<>();
    private final Map<String, Object> singletons = new LinkedHashMap<>();
    private final Set<String> creating = new HashSet<>();
    private final List<BeanPostProcessor> processors = new ArrayList<>();
    private boolean closed;

    MiniContainer register(String name, Function<MiniContainer, Object> factory) {
        defs.put(name, new BeanDefinition(name, factory, true));
        return this;
    }

    MiniContainer registerPrototype(String name, Function<MiniContainer, Object> factory) {
        defs.put(name, new BeanDefinition(name, factory, false));
        return this;
    }

    MiniContainer addProcessor(BeanPostProcessor processor) {
        processors.add(processor);
        processors.sort(Comparator.comparingInt(BeanPostProcessor::order));
        return this;
    }

    MiniContainer init(String name, Runnable init) {
        def(name).init = init;
        return this;
    }

    MiniContainer destroy(String name, Runnable destroy) {
        def(name).destroy = destroy;
        return this;
    }

    private BeanDefinition def(String name) {
        BeanDefinition d = defs.get(name);
        if (d == null) throw new IllegalArgumentException("no bean definition " + name);
        return d;
    }

    Object getBean(String name) {
        if (closed) throw new IllegalStateException("container closed");
        BeanDefinition d = defs.get(name);
        if (d == null) throw new IllegalArgumentException("no bean definition " + name);
        if (d.singleton) {
            Object cached = singletons.get(name);
            if (cached != null) return cached;
        }
        if (!creating.add(name)) throw new IllegalStateException("circular dependency detected at " + name);
        try {
            Object bean = d.factory.apply(this);
            events.add("create:" + name);
            bean = applyBefore(name, bean);
            if (bean == null) throw new IllegalStateException("post-processor returned null for " + name);
            if (d.init != null) { d.init.run(); events.add("init:" + name); }
            bean = applyAfter(name, bean);
            if (d.singleton) { singletons.put(name, bean); events.add("ready:" + name); }
            return bean;
        } finally {
            creating.remove(name);
        }
    }

    private Object applyBefore(String name, Object bean) {
        Object result = bean;
        for (BeanPostProcessor p : processors) {
            Object current = p.postProcessBeforeInitialization(result, name);
            if (current != null) result = current;
        }
        return result;
    }

    private Object applyAfter(String name, Object bean) {
        Object result = bean;
        for (BeanPostProcessor p : processors) {
            Object current = p.postProcessAfterInitialization(result, name);
            if (current != null) result = current;
        }
        return result;
    }

    @Override public void close() {
        if (closed) return;
        closed = true;
        List<String> names = new ArrayList<>(singletons.keySet());
        Collections.reverse(names);
        for (String name : names) {
            BeanDefinition d = defs.get(name);
            if (d != null && d.destroy != null) { d.destroy.run(); events.add("destroy:" + name); }
        }
        singletons.clear();
    }
}`,
    hints: [
      'Giữ danh sách bean definition trong {{LinkedHashMap}} để nhớ thứ tự tạo; {{singletons}} là map cache cho singleton. Prototype không được đưa vào cache.',
      'Trước khi gọi factory, thêm tên vào {{creating}}; nếu tên đã có trong {{creating}} thì đó là vòng phụ thuộc. Nhớ {{creating.remove(name)}} trong {{finally}} để lần sau còn thử lại.',
      'Duyệt {{processors}} hai lần: once cho before, once cho after. Gán kết quả trả về cho biến bean sau mỗi processor; nếu trả null thì giữ nguyên bean hiện tại.',
    ],
    explain: `Bài tập dựng lại vòng đời bean ở mức tối giản, đủ để thấy ba điều quan trọng.

**Thứ tự before → init → after là bất biến.** Test đầu tiên so sánh nguyên danh sách sự kiện: mọi BPP before chạy trước init, mọi BPP after chạy sau init. Đây là lý do {{@PostConstruct}} (một BPP before) luôn thấy bean trước khi proxy AOP được tạo (một BPP after), và vì thế {{@Transactional}} gọi từ {{@PostConstruct}} không có tác dụng.

**BPP có thể thay thế bean.** Test "before thay thế" cho thấy processor order 0 thấy {{ServiceImpl}}, processor order 5 thấy {{Wrapper}}: container dùng object trả về của processor trước cho processor sau. Test "after thay thế" cho thấy bean cuối cùng là {{Wrapper}}. Trong Spring, đây chính là cách {{AbstractAutoProxyCreator}} thay target bằng proxy. Nếu wrapper không giữ đúng kiểu, các chỗ inject theo kiểu gốc sẽ lỗi.

**Prototype và singleton khác nhau ở vòng đời.** Prototype không vào cache, nên mỗi {{getBean}} tạo mới và chạy BPP/init mỗi lần; {{close}} chỉ destroy singleton. Điều này khớp với Spring: container không giữ prototype sau khi giao đi, nên không thể gọi destroy cho nó.

**Lỗi phải thất bại sớm và rõ ràng.** Circular dependency bị phát hiện bằng tập {{creating}} trước khi đệ quy vô hạn; init lỗi không được cache, lần gọi sau thử lại. Trong Spring, constructor injection làm vòng phụ thuộc lộ ra ngay lúc khởi động; field injection có thể che nó cho tới khi chạy.

**Mở rộng để gần Spring hơn:** thêm {{InstantiationAwareBeanPostProcessor}} để inject field (giống {{@Autowired}}), thêm BFPP để sửa {{BeanDefinition}} trước khi tạo instance, và thêm scope {{prototype}} có destroy do consumer tự gọi. Khi đó bạn sẽ thấy vì sao Spring cần nhiều loại callback chứ không chỉ một.`,
  }],
  check: [
    { q: 'BeanPostProcessor khác BeanFactoryPostProcessor ở điểm nào?', options: ['BPP sửa BeanDefinition trước khi tạo instance; BFPP thấy instance sau init', 'BFPP sửa BeanDefinition trước khi tạo instance; BPP thấy instance và chạy trước/sau init', 'Cả hai đều chỉ chạy sau khi context đã sẵn sàng', 'BPP chỉ chạy cho singleton, BFPP chỉ chạy cho prototype'], answer: 1, explain: `BFPP (BeanFactoryPostProcessor) chạy sau khi đọc định nghĩa, trước khi tạo instance; nó sửa {{BeanDefinition}} hoặc thêm định nghĩa mới. BPP (BeanPostProcessor) chạy sau khi instance được tạo, ở hai hook trước/sau init, và có thể thay thế bean bằng object khác. BPP không giới hạn ở singleton; BFPP cũng không giới hạn ở prototype.` },
    { q: 'Thứ tự đúng của các bước khởi tạo singleton là gì?', options: ['constructor → postProcessAfterInitialization → @PostConstruct → postProcessBeforeInitialization → init-method', 'constructor → inject → postProcessBeforeInitialization → @PostConstruct → afterPropertiesSet → init-method → postProcessAfterInitialization', 'constructor → @PostConstruct → inject → proxy → init-method', 'inject → postProcessAfterInitialization → @PostConstruct → constructor'], answer: 1, explain: `Thứ tự chuẩn: tạo instance bằng constructor, inject dependency (populate), chạy BPP before, rồi {{@PostConstruct}}, {{afterPropertiesSet}}, init-method, cuối cùng là BPP after (nơi tạo AOP proxy). Vì proxy nằm ở bước cuối, {{@PostConstruct}} không có proxy và self-call trong đó không có transaction.` },
    { q: 'Vì sao không nên inject một bean nghiệp vụ vào BeanPostProcessor?', options: ['Vì BPP không được phép có dependency', 'Vì BPP được tạo rất sớm; bean nghiệp vụ sẽ bị tạo sớm, trước khi các BPP khác sẵn sàng, nên mất một phần xử lý', 'Vì bean nghiệp vụ luôn là prototype', 'Vì BPP chỉ chạy cho bean không có dependency'], answer: 1, explain: `Container phải tạo BPP trước khi tạo bean nghiệp vụ. Nếu BPP inject một bean, bean đó bị kéo lên tạo sớm; các BPP đăng ký sau không áp dụng cho nó, nên nó có thể thiếu proxy, thiếu {{@PostConstruct}} hoặc không được đo metrics. Spring cảnh báo "not eligible for getting processed by all BeanPostProcessors". BPP vẫn có thể có dependency hạ tầng, nhưng không nên phụ thuộc bean nghiệp vụ.` },
    { q: 'Một BPP trả về một object không cài interface của bean gốc. Hậu quả là gì?', options: ['Không ảnh hưởng, Spring tự cast', 'Chỗ inject theo interface/kiểu gốc có thể ném ClassCastException hoặc không tìm thấy bean', 'Bean tự động chuyển thành prototype', 'Container bỏ qua BPP đó'], answer: 1, explain: `Container dùng đúng object mà BPP trả về cho các bước sau. Nếu object đó không cài interface hoặc không phải lớp của bean gốc, việc inject theo kiểu gốc sẽ lỗi lúc khởi động hoặc lúc gọi. Khi bọc bean, wrapper phải giữ đúng kiểu (hoặc ít nhất các interface mà caller cần).` }
  ],
  related: ['spring-002', 'spring-039'], tags: ['BeanPostProcessor', 'bean lifecycle', 'BeanFactoryPostProcessor', 'AOP proxy', 'DI']
},
);