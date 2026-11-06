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
~~~
Giữ {{type}} ổn định để client phân loại; {{detail}} nên hữu ích nhưng không lộ dữ liệu nhạy cảm. Validation error nên có danh sách field/message đã chuẩn hóa, thứ tự ổn định nếu client hoặc snapshot test phụ thuộc.

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
title: @EventListener chay ngay trong transaction dang mo
actors: API | OrderService | DB | MailListener | SMTP
API -> OrderService: POST /orders
OrderService -> DB: insert order (chua commit)
OrderService -> MailListener: publishEvent(OrderCreatedEvent)
MailListener -> SMTP: gui email xac nhan (2 giay)
MailListener --> OrderService: quay lai, transaction van dang mo
OrderService -> DB: rollback vi tru kho that bai
DB --> API: loi 500
note API..SMTP: email da gui, don hang thi khong ton tai
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
  }
);
