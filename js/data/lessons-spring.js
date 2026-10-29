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

### Liên hệ phỏng vấn
Hãy giải thích sự khác nhau giữa IoC và DI bằng một ví dụ, rồi lần theo cách container resolve constructor. Khi debug, kiểm tra bean definition, type ambiguity và dependency cycle trước khi thêm annotation tùy tiện. Với Spring Boot 3, ưu tiên constructor injection; dùng setter cho dependency thực sự optional.

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
    check: [{ q: 'Vì sao constructor injection thường được ưu tiên?', options: ['Làm dependency bắt buộc rõ và cho phép object bất biến', 'Tự làm bean thread-safe', 'Bỏ qua việc tạo bean', 'Chỉ dùng được với prototype'], answer: 0, explain: `Constructor cho thấy dependency bắt buộc (field final), object chỉ tạo được khi đủ collaborator và test dễ bằng {{new Service(fakeRepo)}}. Nó không tự làm bean thread-safe — state mutable vẫn cần đồng bộ. Container vẫn phải tạo bean, không "bỏ qua" được. Constructor injection dùng được với mọi scope, không riêng prototype.` }, { q: 'App Spring Boot 3 có OrderService inject PaymentService qua field {{@Autowired}}, và PaymentService cũng inject OrderService qua field. Khi khởi động chuyện gì xảy ra?', options: ['Chạy bình thường vì field injection luôn phá được vòng', 'Khởi động thất bại vì từ Spring Boot 2.6 circular reference bị cấm mặc định', 'Spring tự tạo hai instance của mỗi bean', 'Chỉ lỗi khi gọi method lần đầu'], answer: 1, explain: `Từ Spring Boot 2.6, {{spring.main.allow-circular-references}} mặc định là false nên mọi vòng phụ thuộc (kể cả qua field/setter) làm context fail lúc khởi động. Phương án 1 đúng với Spring Boot cũ hoặc khi bật lại cờ, không đúng mặc định hiện nay. Spring không tạo thêm instance để phá vòng. Lỗi xảy ra lúc tạo context, không đợi tới lúc gọi method.` }],
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

### Lỗi production
Method **private** không bao giờ được proxy chặn (lớp con không override được private); method **final** cũng vậy với CGLIB. Từ Spring Framework 6.0, {{@Transactional}} trên method protected/package-private có hiệu lực với CGLIB proxy, nhưng public vẫn là cách an toàn và dễ hiểu nhất. Một lỗi phổ biến khác là gọi qua reference được tạo bằng {{new}} thay vì bean do Spring quản lý. Khi đo thời gian, dùng finally để ghi cả thành công và lỗi, nhưng tránh log payload nhạy cảm. Proxy cũng có overhead; hãy dùng metric có cardinality kiểm soát thay vì tag theo user ID.

### Liên hệ phỏng vấn
Vẽ luồng caller → proxy → target để giải thích self-invocation. Nêu rõ đây là giới hạn của proxy-based AOP, không phải transaction manager tự phát hiện mọi method call. Với yêu cầu cross-cutting cần bao cả self-call, cân nhắc đổi ranh giới bean hoặc giải pháp weaving phù hợp.

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
      hints: ['{{Proxy.newProxyInstance}} nhận ba tham số: class loader (ví dụ {{Worker.class.getClassLoader()}}), mảng các interface cần cài (chỉ gồm {{Worker.class}}) và một InvocationHandler (lambda {{(proxy, method, args) -> ...}}).', 'Handler chỉ thấy những lời gọi đi **qua proxy**. Trong {{target.outer()}}, lời gọi {{inner()}} là {{this.inner()}} trên chính target nên handler không thấy.', '{{method.invoke(target, args)}} bọc exception của target trong {{InvocationTargetException}}; bắt nó và ném lại {{e.getCause()}}.'],
      explain: `Test đầu xác nhận proxy nhận outer, sau đó target tự gọi inner nên handler chỉ chạy một lần. Khi gọi inner trực tiếp qua proxy, handler ghi lần thứ hai. Đây là mô hình cốt lõi giải thích vì sao self-invocation không kích hoạt {{@Transactional}} trong Spring AOP dựa trên proxy: annotation trên inner chỉ có tác dụng khi lời gọi tới inner đi qua proxy.

Vì sao phải unwrap {{InvocationTargetException}}? {{Method.invoke}} bọc mọi exception của target trong {{InvocationTargetException}} (một checked exception). Nếu handler ném nguyên nó ra, mà interface {{Worker}} không khai báo checked exception đó, JVM sẽ bọc thêm một lớp nữa thành {{UndeclaredThrowableException}} — caller không bắt được {{IllegalArgumentException}} như khi gọi target trực tiếp. Spring làm đúng việc unwrap này, nên với bạn proxy "trong suốt".

Lỗi hay gặp:
- Gọi {{method.invoke(proxy, args)}} thay vì {{target}}: proxy gọi lại chính nó, đệ quy vô hạn tới {{StackOverflowError}}.
- Ghi log sau khi invoke mà không dùng {{finally}}: lời gọi ném exception sẽ không được ghi.`
    }],
    check: [{ q: 'Trong proxy-based Spring AOP, vì sao this.inner() thường không kích hoạt advice của inner?', options: ['Method private nên JVM không chạy', 'Lời gọi đi thẳng từ target tới target, không qua proxy', 'Transaction manager chỉ theo dõi HTTP', 'AOP chỉ hoạt động khi compile bằng Java 21'], answer: 1, explain: `Advice được proxy áp dụng khi lời gọi đi qua proxy; this.inner() chạy trực tiếp trên target nên proxy không biết. "Method private": inner trong ví dụ là public và vẫn bị bỏ qua, nên visibility không phải nguyên nhân. Transaction không gắn với HTTP. AOP của Spring chạy trên mọi phiên bản Java được hỗ trợ, không cần Java 21.` }, { q: 'Một bean Spring Boot 3 có method {{@Transactional private void saveAll()}}, được gọi từ một method public của chính bean đó. Transaction có được mở không?', options: ['Có, vì Spring quét mọi method có annotation', 'Không: private không bị proxy chặn được, và lời gọi nội bộ không đi qua proxy', 'Có, nếu bật CGLIB proxy', 'Chỉ khi method trả về void'], answer: 1, explain: `Có hai lý do cộng dồn: proxy (JDK hay CGLIB) không override được method private, và lời gọi từ trong bean là this.saveAll() không qua proxy. Spring không "quét rồi tự chạy" annotation, nó chỉ chèn advice tại proxy. CGLIB là mặc định của Spring Boot rồi và vẫn không chặn được private. Kiểu trả về không liên quan.` }],
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

### Production pitfalls
Transaction thường gắn với thread hiện tại; tự chuyển sang executor không tự mang transaction sang thread mới. Trong JPA, commit còn là lúc flush SQL nên constraint violation có thể xuất hiện cuối method. Gọi external API lâu bên trong transaction giữ connection và lock lâu. Đặt boundary quanh thao tác dữ liệu cần nguyên tử, giữ ngắn, và dùng outbox/idempotency khi phối hợp database với message broker.

### Liên hệ phỏng vấn
Với ghi audit cần tồn tại dù nghiệp vụ chính rollback, REQUIRES_NEW có thể phù hợp nhưng cần cân nhắc tính nhất quán và pool. Với thao tác nghiệp vụ cần cùng commit, REQUIRED thường đúng hơn. Luôn hỏi exception là checked hay unchecked, method có đi qua proxy không, và SQL flush xảy ra lúc nào.

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
    check: [{ q: 'Method bên trong chạy REQUIRED khi đã có transaction ngoài thì thường thế nào?', options: ['Luôn tạo transaction mới độc lập', 'Tham gia transaction hiện có', 'Tắt transaction ngoài', 'Chỉ chạy được với checked exception'], answer: 1, explain: `REQUIRED dùng transaction hiện có nếu có, nếu không mới tạo. "Luôn tạo transaction mới" là REQUIRES_NEW. Không propagation nào "tắt" transaction ngoài; NOT_SUPPORTED chỉ tạm treo nó. Propagation không liên quan loại exception.` }, { q: 'Method {{@Transactional public void importFile() throws IOException}} lưu 500 bản ghi rồi ném {{IOException}}. Không cấu hình gì thêm. Kết quả?', options: ['Rollback cả 500 bản ghi', '500 bản ghi được commit, caller vẫn nhận IOException', 'Spring nuốt IOException và commit', 'Spring bọc thành RuntimeException rồi rollback'], answer: 1, explain: `Mặc định Spring chỉ rollback với RuntimeException và Error; IOException là checked nên transaction được commit, sau đó exception vẫn được ném cho caller. Muốn rollback phải thêm rollbackFor = IOException.class. Spring không nuốt exception và cũng không bọc lại thành RuntimeException.` }],
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

### Thứ tự và dependency
Nếu A phụ thuộc B, B phải sẵn sàng trước khi A dùng dependency. Hủy bean thường theo thứ tự ngược để consumer giải phóng trước dependency. Không nên phụ thuộc vào thứ tự giữa hai bean không có quan hệ dependency; nếu cần startup ordering, khai báo dependency rõ ràng.

### Pitfall production
Không mở thread hoặc connection trong constructor nếu khởi tạo có thể thất bại một phần. Đảm bảo shutdown graceful đóng executor và resource. Prototype chứa resource dễ rò rỉ vì context không gọi destroy cho từng instance; dùng try/finally hoặc AutoCloseable ở nơi sở hữu. Bean singleton có state mutable dùng chung gây race condition. Với web scope, proxy giúp singleton tham chiếu tới bean request-scoped nhưng cần hiểu lifecycle request.

### Liên hệ phỏng vấn
Hãy nêu ai sở hữu vòng đời và ai chịu trách nhiệm đóng resource. Nếu prototype được inject vào singleton, giải thích vì sao vẫn chỉ thấy một instance đã inject và đề xuất factory/provider. Với shutdown, phân biệt callback best-effort với bảo đảm hoàn tất trước giới hạn thời gian dừng của nền tảng.

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
    check: [{ q: 'Prototype bean được inject một lần vào singleton thì chuyện gì xảy ra?', options: ['Mỗi lần gọi method singleton tự nhận prototype mới', 'Singleton giữ instance đã resolve lúc inject', 'Prototype chuyển thành request scope', 'Container không tạo prototype'], answer: 1, explain: `Dependency được resolve một lần khi singleton được tạo, nên field đó luôn trỏ tới cùng một object. Container không tự "làm mới" field mỗi lần gọi method; muốn instance mới mỗi lần cần {{ObjectProvider}} hoặc {{@Lookup}}. Scope không tự đổi thành request. Container vẫn tạo prototype — đúng một lần lúc inject.` }, { q: 'Service có method {{@Transactional void loadData()}} và được gọi từ {{@PostConstruct void init()}} của chính service đó. Vì sao transaction không được mở?', options: ['Vì @PostConstruct chạy trước khi bean được bọc proxy (postProcessAfterInitialization), và lời gọi là self-call', 'Vì @PostConstruct luôn chạy trong thread riêng', 'Vì transaction manager chỉ khởi tạo sau khi HTTP server bật', 'Vì @Transactional không hỗ trợ method trả về void'], answer: 0, explain: `@PostConstruct chạy ở bước postProcessBeforeInitialization, trước khi Spring tạo AOP proxy; hơn nữa init() gọi this.loadData() trên chính object gốc, không qua proxy. Cách sửa: chạy trong listener ApplicationReadyEvent hoặc gọi qua bean khác. @PostConstruct chạy trên thread đang tạo context, không phải thread riêng. Transaction manager là bean bình thường, không chờ HTTP server. Kiểu trả về void hoàn toàn được hỗ trợ.` }],
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

### Validation boundary
Validate syntax và invariant đơn giản ngay tại API boundary, ví dụ field bắt buộc hoặc range. Quy tắc nghiệp vụ cần dữ liệu hiện tại như email đã tồn tại phải được kiểm tra ở service/domain và vẫn cần database constraint để chống race. Không trả stack trace hay nội dung exception nội bộ cho client.

### ProblemDetail
{{ProblemDetail}} biểu diễn lỗi theo RFC 9457 (bản thay thế RFC 7807) với các field {{type}}, {{title}}, {{status}}, {{detail}}, {{instance}} và properties mở rộng; content type của response là {{application/problem+json}}. Hai cách dùng: trả {{ProblemDetail}} từ method {{@ExceptionHandler}} của bạn, hoặc trong Spring Boot 3 bật {{spring.mvc.problemdetails.enabled=true}} để các exception chuẩn của Spring MVC (400 validation, 404, 405…) tự trả về dạng ProblemDetail.

~~~java
@ExceptionHandler(EmailTakenException.class)
ProblemDetail handle(EmailTakenException e) {
    ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "Email đã được dùng");
    pd.setType(URI.create("https://api.example.com/errors/email-taken")); // client phân loại theo type
    return pd;
}
~~~ Giữ {{type}} ổn định để client phân loại; {{detail}} nên hữu ích nhưng không lộ dữ liệu nhạy cảm. Validation error nên có danh sách field/message đã chuẩn hóa, thứ tự ổn định nếu client hoặc snapshot test phụ thuộc.

| Lỗi | HTTP thường dùng | Xử lý |
|---|---|---|
| JSON/validation sai | 400 | Trả field errors có cấu trúc |
| Không tìm thấy tài nguyên | 404 | ProblemDetail nhất quán |
| Conflict nghiệp vụ | 409 | Nêu cách xử lý phù hợp |

### Production pitfalls
Đừng coi mọi exception là 500 hoặc trả 200 với error object. Tránh lộ stack trace, SQL và token. Validation ở controller không thay thế constraint trong DB khi có concurrent request. Cân nhắc correlation ID trong log thay vì nhồi toàn bộ context vào response. API versioning và schema lỗi cần ổn định để client không phụ thuộc câu chữ tự do.

### Liên hệ phỏng vấn
Mô tả request từ servlet tới handler và ngược lại qua converter. Phân biệt validation cấu trúc với invariant nghiệp vụ. Khi thiết kế error contract, chọn status, type/code ổn định, field errors và thông tin correlation; kiểm thử cả JSON sai cú pháp lẫn dữ liệu hợp lệ về hình thức nhưng sai nghiệp vụ.

> Senior tip: Một error response tốt giúp client quyết định retry hay sửa request. Đừng retry 400; với 409/5xx hãy định nghĩa semantics rõ và dùng idempotency cho thao tác có side effect.`,
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
    check: [{ q: 'Validation cho email chưa tồn tại nên nằm ở đâu?', options: ['Chỉ trong regex ở controller', 'Service/domain và constraint DB khi cần chống race', 'Trong serializer JSON', 'Trong DispatcherServlet'], answer: 1, explain: `Kiểm tra "email đã tồn tại chưa" cần đọc dữ liệu hiện tại, nên thuộc service/domain; thêm unique constraint ở DB vì hai request đồng thời có thể cùng vượt qua bước kiểm tra trong code. Regex chỉ kiểm tra hình dạng email, không biết DB có gì. Serializer chỉ chuyển JSON ↔ object. DispatcherServlet chỉ điều phối request, không chứa nghiệp vụ.` }, { q: 'Controller có {{create(@Valid @RequestBody CreateUser req)}}, client gửi email rỗng vi phạm {{@NotBlank}}. Điều gì xảy ra?', options: ['Controller được gọi với req.email() rỗng, tự kiểm tra lấy', 'Spring ném MethodArgumentNotValidException trước khi gọi controller, mặc định trả 400', 'Spring trả 500 vì validation lỗi', 'Jackson từ chối parse JSON và trả 415'], answer: 1, explain: `Validation chạy khi HandlerAdapter chuẩn bị tham số, nên controller không được gọi; MethodArgumentNotValidException được ExceptionResolver chuyển thành 400 (dạng ProblemDetail nếu bật). Phương án 1 chỉ đúng khi thiếu @Valid hoặc thiếu starter-validation. 500 dành cho lỗi phía server. Jackson parse JSON hợp lệ bình thường; 415 là lỗi Content-Type không được hỗ trợ.` }],
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

### Liên hệ phỏng vấn
Hãy giải thích vì sao sửa file migration đã chạy là sai, cách Flyway phát hiện, và khi nào out-of-order được phép. Nêu cách xử lý migration thất bại giữa chừng và cách khôi phục. Cuối cùng, phân biệt migration schema với seed data và dữ liệu tham chiếu.

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
    check: [{ q: 'Vì sao không nên sửa file migration đã áp dụng trên production?', options: ['Vì checksum sẽ lệch và runner từ chối để ngăn thay đổi lén', 'Vì Java không compile được file SQL', 'Vì migration chỉ chạy một lần trong JVM', 'Vì Flyway tự động xóa bảng lịch sử'], answer: 0, explain: `Checksum của file hiện tại được so với bản ghi lịch sử. Nếu lệch, migration cũ đã chạy trên DB không còn khớp với file, nên runner báo lỗi để buộc tạo migration mới.` }, { q: 'Khi nào cờ out-of-order nên được bật?', options: ['Khi thêm migration bị bỏ sót có số phiên bản nhỏ hơn max đã áp', 'Mọi trường hợp để đơn giản', 'Khi checksum thay đổi', 'Khi chạy trên môi trường dev'], answer: 0, explain: `out-of-order cho phép áp migration có version nhỏ hơn max đã áp trong trường hợp đặc biệt như bổ sung migration bị bỏ sót. Bật mặc định sẽ che giấu thứ tự và làm khó truy vết.` }, { q: 'Repeatable migration chạy lại trong trường hợp nào?', options: ['Khi checksum khác lần trước', 'Mỗi lần applyAll', 'Khi version tăng', 'Khi bảng lịch sử rỗng'], answer: 0, explain: `Repeatable không có version; checksum là tiêu chí duy nhất. Nếu checksum giữ nguyên, runner bỏ qua để tránh chạy lại view hoặc procedure không cần thiết.` }],
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
- {{DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES}} (mặc định bật): khi **đọc** JSON có field lạ thì ném lỗi — Spring Boot tắt cờ này mặc định.
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
  }
);
