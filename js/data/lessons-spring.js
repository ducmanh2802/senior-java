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
DI là kỹ thuật đưa dependency từ bên ngoài. Constructor injection làm dependency bắt buộc hiện rõ, giữ object hợp lệ sau khi khởi tạo và dễ tạo unit test bằng fake. Spring Boot 3 dùng component scanning cho stereotype như {{@Component}}, {{@Service}}, {{@Repository}}; {{@Bean}} hữu ích với object cấu hình thủ công. Container chọn constructor phù hợp, resolve tham số theo type và qualifier, rồi gọi constructor.

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
Nếu A cần B trong constructor và B cần A, không tồn tại thứ tự tạo hoàn chỉnh. Spring có một số cơ chế xử lý tham chiếu vòng trong tình huống cụ thể, nhưng constructor cycle là thiết kế cần sửa, không nên dựa vào workaround. Tách phần chung thành C, hoặc đảo phụ thuộc qua interface/event. Các lỗi thường gặp gồm nhiều bean cùng type không có qualifier, component scan thiếu package, hoặc singleton giữ request-specific state khiến dữ liệu người dùng rò sang request khác.

### Liên hệ phỏng vấn
Hãy giải thích sự khác nhau giữa IoC và DI bằng một ví dụ, rồi lần theo cách container resolve constructor. Khi debug, kiểm tra bean definition, type ambiguity và dependency cycle trước khi thêm annotation tùy tiện. Với Spring Boot 3, ưu tiên constructor injection; dùng setter cho dependency thực sự optional.

> Senior tip: Một service singleton nên giữ cấu hình bất biến, không giữ dữ liệu của request trong field. Nếu có nhiều implementation, dùng qualifier có ý nghĩa nghiệp vụ thay vì dựa vào thứ tự scan.`,
    exercises: [{
      title: 'Tạo MiniContainer singleton bằng constructor injection',
      prompt: `Hoàn thiện {{MiniContainer}}. {{register(type)}} đăng ký class; {{get(type)}} tạo singleton đúng một lần và inject constructor qua reflection khi các tham số đã đăng ký. Constructor không tham số được hỗ trợ. Báo {{IllegalStateException}} cho type chưa đăng ký và circular dependency; {{get}} lặp lại phải trả cùng instance.`,
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
      hints: ['Tách registry definition, registry singleton và tập type đang tạo.', 'Đánh dấu type trước khi gọi supplier; luôn gỡ dấu trong finally để lỗi tạo bean không làm container kẹt.', 'Kiểm tra singleton bằng containsKey vì giá trị null không nên bị nhầm với chưa tạo.'],
      explain: `Container tối giản quản lý definition và cache singleton. Supplier đại diện bước dựng bean, có thể gọi get() cho dependency. Tập {{creating}} là đường đi hiện tại của DFS; gặp lại cùng type trước khi hoàn tất nghĩa là có chu trình. Bài tập đóng gói constructor injection bên trong supplier để tập trung vào registry; Spring còn introspect constructor, chọn candidate, resolve qualifier và thực hiện lifecycle callback. Trong ứng dụng thật, tạo bean có thể thất bại giữa chừng, nên cache chỉ sau khi supplier thành công. Test cycle bắt trường hợp hai supplier gọi lồng nhau và unknown type xác nhận lỗi rõ ràng.`
    }],
    check: [{ q: 'Vì sao constructor injection thường được ưu tiên?', options: ['Làm dependency bắt buộc rõ và cho phép object bất biến', 'Tự làm bean thread-safe', 'Bỏ qua việc tạo bean', 'Chỉ dùng được với prototype'], answer: 0, explain: `Constructor cho thấy dependency bắt buộc và object chỉ được tạo khi có đủ collaborator. Nó không tự bảo đảm thread-safety và vẫn cần container tạo bean; mọi scope đều có thể dùng constructor injection.` }, { q: 'Trong thiết kế này, ranh giới nào giúp kiểm soát lỗi dễ hơn?', options: ['Ranh giới rõ theo trách nhiệm', 'Một method khổng lồ', 'Nuốt mọi exception', 'Chia sẻ mutable state toàn cục'], answer: 0, explain: `Ranh giới rõ theo trách nhiệm giúp thay đổi và kiểm thử từng phần độc lập.` }],
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
{{java.lang.reflect.Proxy}} tạo object runtime triển khai các interface đã chỉ định. InvocationHandler nhận method và arguments, có thể ghi log, gọi method trên target rồi trả kết quả. Proxy JDK yêu cầu interface; Spring cũng có thể dùng subclass proxy tùy cấu hình và loại bean. Proxy không biến method call tùy ý thành AOP: caller phải giữ và gọi reference proxy.

~~~java
Object proxy = Proxy.newProxyInstance(loader, interfaces, (p, method, args) -> {
    long start = System.nanoTime();
    try { return method.invoke(target, args); }
    finally { logger.accept(method.getName(), System.nanoTime() - start); }
});
~~~

### Self-invocation và @Transactional
Giả sử caller gọi {{proxy.outer()}}, proxy chuyển tới target.outer(). Bên trong target, {{this.inner()}} là lời gọi trực tiếp trên cùng target, không qua proxy; do đó advice của inner, bao gồm transaction annotation, không được kích hoạt theo proxy model. Tách inner method sang bean khác để lời gọi đi qua bean proxy, hoặc đặt transaction boundary ở method ngoài phù hợp với nghiệp vụ. Self injection/call-through hack làm luồng khó hiểu và nên tránh.

| Proxy | Cách tạo | Lưu ý |
|---|---|---|
| JDK | Interface + InvocationHandler | Caller phải gọi qua interface proxy |
| Subclass | Tạo lớp con target | Final class/method hạn chế override |

### Lỗi production
Private method thường không phải điểm cắt hữu ích với proxy; method final không override được bằng subclass proxy. Một lỗi phổ biến khác là gọi qua reference được tạo bằng {{new}} thay vì bean do Spring quản lý. Khi đo thời gian, dùng finally để ghi cả thành công và lỗi, nhưng tránh log payload nhạy cảm. Proxy cũng có overhead; hãy dùng metric có cardinality kiểm soát thay vì tag theo user ID.

### Liên hệ phỏng vấn
Vẽ luồng caller → proxy → target để giải thích self-invocation. Nêu rõ đây là giới hạn của proxy-based AOP, không phải transaction manager tự phát hiện mọi method call. Với yêu cầu cross-cutting cần bao cả self-call, cân nhắc đổi ranh giới bean hoặc giải pháp weaving phù hợp.

> Senior tip: Khi transaction bất ngờ không mở, kiểm tra bean reference và call path trước khi chỉnh propagation. Trace một request qua proxy thường tìm ra nguyên nhân nhanh hơn đọc annotation rời rạc.`,
    exercises: [{
      title: 'Logging proxy và lời gọi nội bộ',
      prompt: `Dùng {{Proxy}} tạo proxy cho {{Worker}}. Handler ghi tên method vào list trước khi invoke target. Gọi {{proxy.outer()}} phải ghi một lần vì outer gọi {{this.inner()}} trực tiếp; gọi {{proxy.inner()}} riêng phải ghi thêm một lần.`,
      starter: `interface Worker { String outer(); String inner(); }
class WorkerImpl implements Worker {
 public String outer() { return "outer:" + inner(); }
 public String inner() { return "inner"; }
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
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `interface Worker { String outer(); String inner(); }
class WorkerImpl implements Worker {
 public String outer() { return "outer:" + inner(); }
 public String inner() { return "inner"; }
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
      hints: ['Proxy.newProxyInstance recibe class loader, interfaces y InvocationHandler.', 'El handler ve llamadas realizadas sobre proxy; target.outer() ejecuta inner dentro del target.', 'Method.invoke envuelve la excepción del target en InvocationTargetException.'],
      explain: `Test đầu xác nhận proxy nhận outer, sau đó target tự gọi inner nên handler chỉ được chạy một lần. Khi gọi inner trực tiếp qua proxy, handler ghi lần thứ hai. Đây là mô hình cốt lõi giải thích vì sao self-invocation không kích hoạt {{@Transactional}} trong proxy-based Spring AOP. InvocationTargetException cần unwrap để caller nhìn thấy lỗi gốc thay vì wrapper reflection.`
    }],
    check: [{ q: 'Trong proxy-based Spring AOP, vì sao this.inner() thường không kích hoạt advice của inner?', options: ['Method private nên JVM không chạy', 'Lời gọi đi thẳng từ target tới target, không qua proxy', 'Transaction manager chỉ theo dõi HTTP', 'AOP chỉ hoạt động khi compile bằng Java 21'], answer: 1, explain: `Advice được proxy áp dụng khi lời gọi đi qua proxy. this.inner() chạy trực tiếp trên target. Visibility không phải nguyên nhân tổng quát; transaction không giới hạn ở HTTP và Java 21 không phải điều kiện.` }, { q: 'Trong thiết kế này, ranh giới nào giúp kiểm soát lỗi dễ hơn?', options: ['Ranh giới rõ theo trách nhiệm', 'Một method khổng lồ', 'Nuốt mọi exception', 'Chia sẻ mutable state toàn cục'], answer: 0, explain: `Ranh giới rõ theo trách nhiệm giúp thay đổi và kiểm thử từng phần độc lập.` }],
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
Trong một transaction T1, method REQUIRED thường dùng lại T1. Nếu method tham gia đánh dấu rollback-only, outer commit cuối cùng có thể báo unexpected rollback. REQUIRES_NEW suspend T1, mở T2 và kết thúc T2 độc lập; nếu T2 commit nhưng T1 rollback, dữ liệu T2 vẫn còn. Khi connection pool nhỏ, transaction suspended vẫn giữ connection trong khi T2 cần connection khác, có thể gây cạn pool dưới tải.

| Propagation | Có transaction ngoài | Kết quả |
|---|---|---|
| REQUIRED | Có | Tham gia transaction ngoài |
| REQUIRED | Không | Tạo transaction |
| REQUIRES_NEW | Có | Suspend ngoài, chạy transaction độc lập |

### Rollback rules
Spring mặc định rollback cho {{RuntimeException}} và {{Error}}. Checked exception mặc định không buộc rollback. Có thể khai báo rollback rule phù hợp trên {{@Transactional}}, nhưng rule cụ thể và rule tổng quát cần thiết kế cẩn thận để không vô tình đổi hành vi. Không nên nuốt exception rồi kỳ vọng interceptor biết rằng nghiệp vụ thất bại.

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
      title: 'Mô phỏng transaction rollback rule',
      prompt: `Mô phỏng rollback rule bằng {{TxManager.run(work)}}: successful work commit tăng bộ đếm commit; {{RuntimeException}} và {{Error}} rollback; một exception marker được rollback chỉ khi {{rollbackMarker}} là true. Truyền exception về caller. Exception marker này chỉ mô phỏng nhánh cấu hình, không phải checked exception Java.`,
      starter: `class MarkerFailure extends RuntimeException {}\nclass TxManager {
 int commits, rollbacks;
 void run(boolean rollbackMarker, Runnable work) { throw new UnsupportedOperationException("TODO"); }
}`,
      tests: `public class Main {
 static int passed=0, total=0;\n static void check(String n, Runnable r) { total++; try { r.run(); passed++; System.out.println("PASS " + n); } catch(Throwable t) { System.out.println("FAIL " + n + ": " + t); } }

 public static void main(String[] a) {
  check("success commits", () -> { TxManager t=new TxManager(); t.run(false,()->{}); if(t.commits!=1||t.rollbacks!=0) throw new AssertionError(); });
  check("runtime rolls back", () -> { TxManager t=new TxManager(); try { t.run(false,()->{throw new IllegalStateException();}); } catch(IllegalStateException e) {} if(t.rollbacks!=1||t.commits!=0) throw new AssertionError(); });
  check("configured marker policy", () -> { TxManager t=new TxManager(); try { t.run(false,()->{throw new MarkerFailure();}); } catch(MarkerFailure e) {} if(t.commits!=1||t.rollbacks!=0) throw new AssertionError(); TxManager u=new TxManager(); try { u.run(true,()->{throw new MarkerFailure();}); } catch(MarkerFailure e) {} if(u.rollbacks!=1) throw new AssertionError(); });
  System.out.println("RESULT " + passed + "/" + total);
 }
}`,
      reference: `class MarkerFailure extends RuntimeException {}\nclass TxManager {
 int commits, rollbacks;
 void run(boolean rollbackMarker, Runnable work) {
  try { work.run(); commits++; }
  catch (Throwable failure) {
   if (!(failure instanceof MarkerFailure) || rollbackMarker) rollbacks++;
   else commits++;
   if (failure instanceof RuntimeException) throw (RuntimeException) failure;
   if (failure instanceof Error) throw (Error) failure;
   throw new IllegalStateException(failure);
  }
 }
}`,
      hints: ['Phân loại exception trước khi cập nhật bộ đếm.', 'Dù không rollback theo policy, exception vẫn được ném lại.', 'MarkerFailure là RuntimeException dùng riêng để kiểm tra rule cấu hình; không gọi nó là checked exception.'],
      explain: `Harness mô phỏng rollback rule chứ không mở database transaction thật. MarkerFailure kế thừa RuntimeException để có thể truyền qua Runnable; nó chỉ đại diện cho một exception được policy cấu hình riêng, không đại diện cho checked exception của Java. Trong Spring, checked exception không rollback mặc định, nhưng vẫn có thể được ném cho caller; rollback policy và exception propagation là hai quyết định khác nhau. RuntimeException và Error rollback mặc định. REQUIRED/REQUIRES_NEW chọn transaction context, độc lập với phân loại exception.`
    }],
    check: [{ q: 'Method bên trong chạy REQUIRED khi đã có transaction ngoài thì thường thế nào?', options: ['Luôn tạo transaction mới độc lập', 'Tham gia transaction hiện có', 'Tắt transaction ngoài', 'Chỉ chạy được với checked exception'], answer: 1, explain: `REQUIRED dùng transaction hiện có nếu có, nếu không mới tạo. REQUIRES_NEW mới suspend transaction ngoài và mở transaction độc lập.` }, { q: 'Trong thiết kế này, ranh giới nào giúp kiểm soát lỗi dễ hơn?', options: ['Ranh giới rõ theo trách nhiệm', 'Một method khổng lồ', 'Nuốt mọi exception', 'Chia sẻ mutable state toàn cục'], answer: 0, explain: `Ranh giới rõ theo trách nhiệm giúp thay đổi và kiểm thử từng phần độc lập.` }],
    related: ['spring-003'], tags: ['Transactional', 'propagation', 'rollback', 'JPA']
  },
  {
    id: 'lesson-spring-004', track: 'spring', order: 4,
    title: 'Bean lifecycle và scope', level: 'mid', minutes: 30,
    goals: ['Nêu thứ tự khởi tạo bean', 'Phân biệt singleton và prototype', 'Quản lý init/destroy resource'],
    body: `**Tóm tắt:** Spring tạo bean, inject dependency, chạy callback khởi tạo rồi đưa bean vào sử dụng; khi context đóng, callback hủy được gọi cho bean do context quản lý. Singleton được giữ trong context, còn prototype tạo instance mới mỗi lần yêu cầu và lifecycle destroy không được container tự quản lý như singleton.

### Lifecycle cơ bản
Container tạo instance từ constructor hoặc factory method, inject dependency, gọi các callback trước khi bean sẵn sàng, rồi công bố bean. Trong Spring có nhiều extension point như BeanPostProcessor; callback phổ biến gồm {{@PostConstruct}} và {{@PreDestroy}} (Jakarta). Initialization callback phù hợp kiểm tra cấu hình hoặc chuẩn bị resource, nhưng không nên thực hiện công việc startup dài khó retry.

~~~java
@Component
class Cache {
    @PostConstruct void warmUp() { /* kiểm tra cấu hình, chuẩn bị nhẹ */ }
    @PreDestroy void close() { /* giải phóng resource */ }
}
~~~

### Scope
Singleton là một instance cho mỗi bean definition trong ApplicationContext. Prototype tạo object mới mỗi lần container resolve bean. Inject prototype vào singleton chỉ resolve một lần khi singleton được tạo; nếu cần object mới mỗi lần, dùng provider/factory hoặc lookup phù hợp.

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
      prompt: `Viết {{BeanFactory}} hỗ trợ SINGLETON và PROTOTYPE. Mỗi lần tạo bean ghi {{init:name}}; {{close()}} gọi destroy cho singleton theo thứ tự ngược tạo và ghi {{destroy:name}}. Prototype mỗi lần lấy là object mới.`,
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
      explain: `Ví dụ mô phỏng scope và callback bằng event log. Singleton cache theo tên; prototype luôn tạo object mới. Factory giữ thứ tự tạo để hủy ngược. Spring lifecycle phức tạp hơn do post processor và dependency graph; destroy ordering dựa trên quan hệ bean, không chỉ thứ tự đăng ký. Prototype cleanup thuộc về consumer vì container không giữ quyền sở hữu sau khi cấp instance.`
    }],
    check: [{ q: 'Prototype bean được inject một lần vào singleton thì chuyện gì xảy ra?', options: ['Mỗi lần gọi method singleton tự nhận prototype mới', 'Singleton giữ instance đã resolve lúc inject', 'Prototype chuyển thành request scope', 'Container không tạo prototype'], answer: 1, explain: `Dependency được resolve khi singleton được tạo, nên reference đó giữ nguyên. Muốn instance mới mỗi lần cần provider/factory hoặc cơ chế lookup.` }, { q: 'Trong thiết kế này, ranh giới nào giúp kiểm soát lỗi dễ hơn?', options: ['Ranh giới rõ theo trách nhiệm', 'Một method khổng lồ', 'Nuốt mọi exception', 'Chia sẻ mutable state toàn cục'], answer: 0, explain: `Ranh giới rõ theo trách nhiệm giúp thay đổi và kiểm thử từng phần độc lập.` }],
    related: ['spring-004'], tags: ['lifecycle', 'scope', 'singleton', 'prototype']
  },
  {
    id: 'lesson-spring-005', track: 'spring', order: 5,
    title: 'Spring MVC request flow, validation và ProblemDetail', level: 'senior', minutes: 35,
    goals: ['Lần theo request qua DispatcherServlet', 'Validate dữ liệu ở boundary', 'Trả lỗi có cấu trúc bằng ProblemDetail'],
    body: `**Tóm tắt:** Spring MVC nhận request tại DispatcherServlet, tìm handler phù hợp, chuyển đổi và validate input, gọi controller rồi serialize response. Lỗi validation nên được ánh xạ thành response có schema ổn định; Spring Framework 6 hỗ trợ {{ProblemDetail}} theo RFC 9457.

### Request flow
Servlet container chuyển request tới DispatcherServlet. HandlerMapping chọn controller/method; HandlerAdapter gọi handler. HttpMessageConverter đọc JSON thành DTO, Bean Validation kiểm tra constraint khi cấu hình validation phù hợp, rồi controller/service thực hiện nghiệp vụ. Converter serialize object trả về thành response. ExceptionResolver xử lý exception xuyên suốt pipeline và chọn status/body.

~~~java
record CreateUser(@NotBlank String email) {}
@PostMapping("/users")
ResponseEntity<?> create(@Valid @RequestBody CreateUser request) { ... }
~~~

### Validation boundary
Validate syntax và invariant đơn giản ngay tại API boundary, ví dụ field bắt buộc hoặc range. Quy tắc nghiệp vụ cần dữ liệu hiện tại như email đã tồn tại phải được kiểm tra ở service/domain và vẫn cần database constraint để chống race. Không trả stack trace hay nội dung exception nội bộ cho client.

### ProblemDetail
{{ProblemDetail}} biểu diễn lỗi theo RFC 9457 với status, title, detail, instance và properties mở rộng. Có thể tạo response tại exception handler hoặc dùng cơ chế hỗ trợ của Spring MVC. Giữ {{type}} ổn định để client phân loại; {{detail}} nên hữu ích nhưng không lộ dữ liệu nhạy cảm. Validation error nên có danh sách field/message đã chuẩn hóa, thứ tự ổn định nếu client hoặc snapshot test phụ thuộc.

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
      prompt: `Cài {{MiniDispatcher.dispatch(path, email)}}: {{POST /users}} hợp lệ khi email chứa đúng một dấu @ và hai vế không rỗng, trả {{Response(201,"created")}}. Email sai trả 400 với body kiểu ProblemDetail có type {{validation-error}}. URL khác trả 404 với type {{not-found}}.`,
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
      explain: `Dispatcher tách routing, validation và response mapping thành ba nhánh dễ kiểm thử. Đây là mô phỏng luồng MVC: Spring dùng DispatcherServlet/HandlerMapping/HandlerAdapter và converter thay vì if path trực tiếp. ProblemDetail chuẩn hóa metadata lỗi; trong API thật nên thêm field errors có cấu trúc và không tiết lộ exception nội bộ. Validation format email ở ví dụ chỉ minh họa boundary, không thay thế validator chuẩn hoặc nghiệp vụ.`
    }],
    check: [{ q: 'Validation cho email chưa tồn tại nên nằm ở đâu?', options: ['Chỉ trong regex ở controller', 'Service/domain và constraint DB khi cần chống race', 'Trong serializer JSON', 'Trong DispatcherServlet'], answer: 1, explain: `Kiểm tra tồn tại phụ thuộc dữ liệu và là invariant nghiệp vụ, nên xử lý ở service/domain; unique constraint DB bảo vệ race condition. Regex chỉ kiểm tra hình dạng.` }, { q: 'Trong thiết kế này, ranh giới nào giúp kiểm soát lỗi dễ hơn?', options: ['Ranh giới rõ theo trách nhiệm', 'Một method khổng lồ', 'Nuốt mọi exception', 'Chia sẻ mutable state toàn cục'], answer: 0, explain: `Ranh giới rõ theo trách nhiệm giúp thay đổi và kiểm thử từng phần độc lập.` }],
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
    title: 'Annotation-driven mapper kiểu Jackson: reflection và FAIL_ON_MISSING', level: 'senior', minutes: 50,
    goals: ['Dùng reflection để serialize object theo annotation', 'Hiểu vì sao field non-public không annotation bị bỏ qua im lặng', 'Bật chế độ strict để phát hiện field bị thiếu trong JSON'],
    body: `**Tóm tắt:** Mapper kiểu Jackson dùng reflection để đọc field và annotation quyết định tên JSON. Nếu field không public và không có {{@JsonProperty}}, mapper mặc định bỏ qua im lặng; chế độ strict biến lỗi này thành exception để phát hiện field bị thiếu trong JSON.

### Reflection và annotation runtime
Annotation chỉ có tác dụng ở runtime nếu khai báo {{@Retention(RUNTIME)}} và target field. Mapper duyệt {{getDeclaredFields()}}, đọc {{@JsonProperty}} và {{@JsonIgnore}}, rồi {{setAccessible(true)}} để lấy giá trị. Thứ tự field theo khai báo trong class. Cache metadata theo class trong production để tránh lặp reflection.

### Quy tắc đặt tên
Có {{@JsonProperty("name")}} thì dùng tên đó. Không annotation nhưng field public thì dùng tên field. Không annotation và field không public thì bị bỏ qua im lặng; đây là bug thường gặp khi port từ Jackson sang mapper tự viết hoặc khi field thiếu getter. {{@JsonIgnore}} luôn bỏ qua, kể cả khi có {{@JsonProperty}} nếu cả hai cùng xuất hiện, vì bỏ qua an toàn hơn serialize nhầm dữ liệu nhạy cảm.

### FAIL_ON_MISSING
Chế độ strict không thay đổi output khi mọi field đều hợp lệ; nó chỉ kiểm tra trước khi serialize: gặp field non-public/không annotation thì ném exception. Điều này giúp phát hiện field bị drop. Trong Jackson thật, FAIL_ON_UNKNOWN_PROPERTIES và visibility rules phức tạp hơn; bài tập mô phỏng ý tưởng cốt lõi: silent drop là nguy hiểm vì không có lỗi nào được ném.

### Empty object và giá trị
Object không có field hợp lệ serialize thành {{}}. String phải escape quote, backslash và ký tự điều khiển. Số và boolean serialize trực tiếp. Null serialize thành null. Object lồng nhau có thể serialize đệ quy, nhưng phải tránh vòng tham chiếu trong production.

### Pitfall production
- Bỏ qua field im lặng gây thiếu dữ liệu mà không lỗi.
- Reflection chậm; cache metadata per class trong production.
- Field mutable và setAccessible có thể bị chặn bởi module system hoặc SecurityManager.
- JSON injection nếu không escape đúng.
- Thứ tự field không ổn định nếu dùng map; giữ declared order để snapshot test ổn định.

### Liên hệ phỏng vấn
Hãy mô tả cách Jackson quyết định property, visibility và unknown property handling. Giải thích vì sao silent drop là nguy hiểm và cách bật strict mode. Nêu trade-off reflection so với code generation và bean introspection.

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
      explain: `Mapper mô phỏng ý tưởng cốt lõi của Jackson: annotation quyết định tên, reflection đọc giá trị, và chế độ strict phát hiện field bị drop. Ở chế độ thường, field non-public không annotation bị bỏ qua im lặng, nên output của User chỉ còn {{full_name}}. Ở strict, mapper ném exception ngay khi gặp {{id}} hoặc {{nick}}, giúp test phát hiện regression. {{JsonIgnore}} luôn thắng để tránh serialize dữ liệu nhạy cảm. Escape đúng là bắt buộc để không tạo JSON injection. Trong production, nên cache metadata per class và cân nhắc code generation để giảm chi phí reflection.`,
    }],
    check: [{ q: 'Vì sao field {{long id;}} trong User bị bỏ qua ở chế độ thường?', options: ['Vì không public và không có @JsonProperty', 'Vì kiểu long không serialize được', 'Vì @JsonIgnore áp dụng cho cả class', 'Vì mapper chỉ đọc getter'], answer: 0, explain: `Mapper chỉ include field public hoặc có @JsonProperty. Field long id không public và không annotation nên bị drop im lặng, đây là bug cần strict mode để phát hiện.` }, { q: 'Chế độ strict thay đổi điều gì?', options: ['Biến field bị drop thành exception, output hợp lệ không đổi', 'Tự động thêm getter', 'Bỏ qua @JsonIgnore', 'Sắp xếp field theo tên'], answer: 0, explain: `strict không thay đổi JSON của object hợp lệ; nó chỉ kiểm tra và ném exception khi gặp field non-public không annotation. @JsonIgnore vẫn được tôn trọng và thứ tự field giữ nguyên.` }, { q: 'Trong thiết kế này, ranh giới nào giúp kiểm soát lỗi dễ hơn?', options: ['Ranh giới rõ theo trách nhiệm', 'Một method khổng lồ', 'Nuốt mọi exception', 'Chia sẻ mutable state toàn cục'], answer: 0, explain: `Ranh giới rõ theo trách nhiệm giúp thay đổi và kiểm thử từng phần độc lập.` }],
      related: ['spring-005', 'spring-006'], tags: ['Jackson', 'reflection', 'annotation', 'JSON', 'FAIL_ON_MISSING']
  }
);
