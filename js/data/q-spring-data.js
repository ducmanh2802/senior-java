/* Topics: spring, jpa, db — owner: task T3. Format: see AGENTS.md */
(window.QUESTIONS = window.QUESTIONS || []).push(
{
  id: 'spring-001',
  topic: 'spring',
  level: 'mid',
  q: 'IoC/DI trong Spring hoạt động thế nào? Constructor injection và field injection khác nhau ở chỗ nào, khi nào nên chọn cái nào?',
  a: `**Tóm tắt:** IoC (Inversion of Control) đảo chiều quyền khởi tạo: thay vì class tự tạo dependency, Spring container (ApplicationContext) chịu trách nhiệm tạo object và "tiêm" dependency vào. DI (Dependency Injection) là cách hiện thực cụ thể của IoC. Trong Spring, **constructor injection là lựa chọn mặc định**: dependency hiển nhiên, test được bằng {{new}}, và lỗi thiếu dependency lộ ra lúc start app chứ không phải lúc chạy production.

### Ba kiểu tiêm dependency
1. **Constructor injection** – Spring chọn constructor; từ Spring Framework 4.3, nếu class chỉ có một constructor thì không cần {{@Autowired}}.
2. **Setter injection** – dành cho dependency không bắt buộc, hoặc cần gán lại sau khi tạo.
3. **Field injection** – Spring gán thẳng vào field bằng reflection, không đi qua constructor.

### So sánh
| Tiêu chí | Constructor | Field |
|---|---|---|
| Dependency bắt buộc | Có, thiếu là fail lúc start | Không, có thể null |
| Unit test | Dễ: truyền mock qua constructor | Cần reflection / framework mock |
| Circular dependency | Bị phát hiện sớm | Che giấu, dễ tạo vòng xoáy |
| Field final | Dùng được | Không dùng được |
| Tính bất biến | Rõ ràng | Dễ bị sửa ngoài ý muốn |

### Ví dụ
~~~java
@Service
@RequiredArgsConstructor          // Lombok sinh constructor cho các field final
public class OrderService {
    private final OrderRepository repo;      // bắt buộc
    private final PaymentGateway gateway;
}

// Cách này không tốt
@Service
public class BadOrderService {
    @Autowired private OrderRepository repo;  // ẩn dependency, không final, khó test
}
~~~

### Khi nào vẫn dùng field/setter injection
- Bean của thư viện bên thứ ba bắt buộc setter (một số property của framework legacy).
- Optional dependency: {{@Autowired(required = false)}} hoặc {{Optional<T>}}.
- Trường hợp buộc phải tránh circular dependency bằng {{@Lazy}} – đây là nợ kỹ thuật, nên refactor.

### Pitfall production
- Constructor dài 10–15 tham số là dấu hiệu class vi phạm SRP. Cách xử lý: tách service theo use case, hoặc gom các thuộc tính cùng nghiệp vụ thành một command object.
- Dùng Lombok {{@Data}} sẽ sinh cả {{@RequiredArgsConstructor}} nhưng cũng sinh {{equals}}/{{hashCode}} theo **mọi** field → với JPA entity sẽ gây N+1 và lỗi logic (xem câu về equals/hashCode của entity).
- Nên inject **interface** khi đang có một implementation, để sau dễ thay bằng mock hoặc implementation thứ hai mà không sửa call site.

> Senior tip: quy tắc thực tế cho team nên đưa vào code review: cấm {{@Autowired}} trên field, bắt buộc constructor injection. Lý do không chỉ ở "style" – field injection làm biến mất danh sách dependency khi đọc code và là nguồn gốc phổ biến nhất của circular dependency mà Spring phải che bằng proxy. Một repo có thể chặn bằng Checkstyle rule {{IllegalAnnotation}} hoặc ArchUnit test.`,
  follow: [
    'Tại sao Spring Framework 4.3 bỏ yêu cầu {{@Autowired}} khi class chỉ có một constructor?',
    'Constructor injection có làm app khởi động chậm hơn không, vì sao?'
  ],
  tags: ['IoC', 'DI', 'constructor injection', 'field injection']
},
{
  id: 'spring-002',
  topic: 'spring',
  level: 'mid',
  q: 'Mô tả vòng đời của một bean trong Spring container: {{@PostConstruct}}, {{BeanPostProcessor}}, {{InitializingBean}} và {{SmartLifecycle}} chạy ở thời điểm nào?',
  a: `**Tóm tắt:** Vòng đời bean đi theo thứ tự: đọc {{BeanDefinition}} → khởi tạo instance → nạp dependency → {{BeanPostProcessor.postProcessBeforeInitialization}} → {{@PostConstruct}} → {{InitializingBean.afterPropertiesSet}} → init-method → {{BeanPostProcessor.postProcessAfterInitialization}} (đây là lúc Spring bọc proxy AOP) → bean sẵn sàng → {{SmartLifecycle.start}} khi context refresh. Lúc shutdown: {{SmartLifecycle.stop}} chạy trước (theo phase ngược), sau đó mới destroy bean: {{@PreDestroy}} → {{DisposableBean.destroy}} → destroy-method.

### Các "móc" khác nhau
| Móc | Thời điểm | Dùng để làm gì |
|---|---|---|
| {{BeanFactoryPostProcessor}} | Trước khi tạo bean, chỉ thấy {{BeanDefinition}} | Sửa/thêm {{BeanDefinition}}, đọc property |
| {{BeanPostProcessor}} | Mỗi lần bean được tạo | Biến đổi bean sau khi khởi tạo (proxy AOP, metrics) |
| {{@PostConstruct}} | Sau khi inject xong, 1 lần | Chuẩn bị tài nguyên, validate |
| {{InitializingBean}} | Sau {{@PostConstruct}} | Tương đương init-method |
| {{SmartLifecycle}} | Sau khi context refresh | Bật/tắt theo vòng đời app, có thứ tự theo phase |

### Ví dụ
~~~java
@Component
class CacheWarmup implements InitializingBean, DisposableBean {
    @PostConstruct
    void init() { /* đã inject xong, chạy 1 lần */ }

    @Override public void afterPropertiesSet() { /* giống init-method */ }

    @PreDestroy
    void shutdown() { /* giải phóng tài nguyên */ }

    @Override public void destroy() { }
}

@Component
class ServerLifecycle implements SmartLifecycle {
    private volatile boolean running;
    @Override public void start() { running = true; }    // sẵn sàng phục vụ
    @Override public void stop()  { running = false; }   // ngừng nhận việc
    @Override public boolean isRunning() { return running; }
}
~~~

### Vì sao proxy AOP nằm ở postProcessAfterInitialization
Các tính năng dựa trên proxy như {{@Transactional}}, {{@Async}}, {{@Cacheable}} đều cần một "lớp vỏ" quanh bean. Spring tạo lớp vỏ đó trong {{postProcessAfterInitialization}} (lớp {{AbstractAutoProxyCreator}}), vì chỉ tới lúc đó bean mới đã đủ dependency để bị đóng gói.

### Pitfall production
- Không làm việc cần ghi DB nặng trong {{@PostConstruct}}: nó chạy trong lúc context đang khởi tạo, giữ transaction chưa sẵn sàng và làm app start chậm, dễ fail. Nếu cần warm-up dữ liệu thì dùng {{ApplicationReadyEvent}} hoặc {{CommandLineRunner}}.
- {{@Bean}} trả về {{BeanPostProcessor}} phải là **static**, nếu không Spring sẽ phải khởi tạo sớm configuration class đó và log cảnh báo "not eligible for getting processed by all BeanPostProcessors".
- Bean phải là singleton thì việc destroy mới xảy ra đúng một lần; bean prototype không được quản lý vòng đời kiểu này.

> Senior tip: khi debug Spring, hãy bật {{--debug}} để xem điều kiện auto-config, và dùng {{ApplicationContext}} + {{getBeanDefinitionNames()}} khi cần hiểu vì sao một bean không được tạo. Với cơ chế vòng đời, nguyên tắc nhớ: **mọi thứ bạn ghi trong {{@PostConstruct}} phải idempotent**, vì app restart / devtools reload sẽ gọi lại nó.`,
  follow: [
    'Sự khác biệt giữa {{BeanFactoryPostProcessor}} và {{BeanPostProcessor}} về thời điểm và phạm vi?',
    'Tại sao {{@PostConstruct}} không chạy trên bean tạo bằng {{new}} thủ công?'
  ],
  tags: ['bean lifecycle', 'BeanPostProcessor', 'PostConstruct', 'SmartLifecycle']
},
{
  id: 'spring-003',
  topic: 'spring',
  level: 'mid',
  q: 'Các bean scope trong Spring khác nhau thế nào? Inject một bean {{prototype}} vào một bean {{singleton}} gây ra vấn đề gì và cách nào khắc phục?',
  a: `**Tóm tắt:** {{singleton}} là mặc định (1 instance cho mỗi ApplicationContext), {{prototype}} tạo instance mới mỗi lần được yêu cầu, còn {{request}}/{{session}}/{{application}} gắn với web scope. Vấn đề kinh điển: singleton giữ **một** tham chiếu tới prototype, nên mọi lần dùng đều nhận lại đúng instance đầu tiên – sai ngữ nghĩa "mỗi lần một instance". Lời giải chuẩn là {{ObjectProvider<T>}} hoặc {{@Lookup}}.

### Bảng scope
| Scope | Số instance | Quản lý vòng đời bởi Spring |
|---|---|---|
| {{singleton}} | 1 / context | Có, {{@PreDestroy}} được gọi |
| {{prototype}} | Mới mỗi lần yêu cầu | Không, không tự gọi destroy callback |
| {{request}} | 1 / HTTP request | Có, gắn với request |
| {{session}} | 1 / HTTP session | Có |
| {{application}} | 1 / ServletContext | Có |

### Vì sao prototype trong singleton là bug
Spring chỉ gọi container để tạo prototype **một lần** – tại thời điểm singleton được khởi tạo. Từ đó singleton giữ reference tới instance đó suốt đời, nên "prototype" bị biến thành singleton theo hành vi. Ví dụ điển hình: bean xử lý task cần **state sạch** mỗi lần (counter, buffer) nhưng lại dùng chung instance.

### Cách khắc phục
~~~java
@Service
public class ReportRunner {
    // ObjectProvider: lấy instance MỚI mỗi lần gọi getObject()
    private final ObjectProvider<ReportTask> tasks;

    public ReportRunner(ObjectProvider<ReportTask> tasks) { this.tasks = tasks; }

    public void run() {
        ReportTask task = tasks.getObject();  // prototype mới mỗi lần
        task.execute();
    }
}
~~~

Các lựa chọn khác:
- {{jakarta.inject.Provider<T>}} (chuẩn JSR-330): tương đương {{ObjectProvider}} nhưng không phụ thuộc API Spring, gọi {{get()}} là ra instance mới.
- {{@Lookup}}: method trả về kiểu prototype, Spring sinh proxy để mỗi lần gọi tạo instance mới (yêu cầu proxy của chính bean chủ, nên class phải proxy được).
- {{@Scope(value = "prototype", proxyMode = ScopedProxyMode.TARGET_CLASS)}}: inject **proxy**, mỗi lần gọi method trên proxy sẽ tạo instance thật.

### Pitfall production
- Bean prototype **không** được Spring quản lý vòng đời theo cách của singleton: callback {{@PreDestroy}} theo mặc định không chạy, connection/thread mở trong đó sẽ rò rỉ. Nếu cần dọn dẹp, hãy tự quản lý (try-with-resources) hoặc dùng cơ chế đăng ký destroy callback của Spring 6.
- Prototype chứa dependency singleton thì vẫn an toàn; ngược lại singleton chứa prototype thì phải dùng {{ObjectProvider}}.
- Singleton chứa state (biến đếm, cache không đồng bộ) là nguồn gốc của rất nhiều bug race condition – mọi bean mặc định nên là stateless.

> Senior tip: trong review code, hãy soi xem bean nào giữ state và bean nào được inject vào singleton. Quy tắc đơn giản: **bean mặc định phải stateless và thread-safe**; nếu cần state thì scope hẹp hơn (request/session) hoặc dùng cấu trúc chia sẻ an toàn (Atomic, ConcurrentHashMap).`,
  follow: [
    'Tại sao Spring không gọi {{@PreDestroy}} cho bean prototype? Làm sao xử lý tài nguyên trong trường hợp đó?',
    'Sự khác biệt giữa {{ObjectProvider}} và {{@Lookup}} khi nào nên dùng cái nào?'
  ],
  tags: ['bean scope', 'prototype', 'singleton', 'ObjectProvider']
},
{
  id: 'spring-004',
  topic: 'spring',
  level: 'senior',
  q: '{{@Transactional}} hoạt động qua proxy ra sao? Vì sao gọi method {{@Transactional}} từ chính class đó lại không có transaction, và quy tắc rollback với checked exception là gì?',
  a: `**Tóm tắt:** {{@Transactional}} không "đánh dấu" rồi được tự động kích hoạt – Spring tạo một **proxy** bao quanh bean, và {{TransactionInterceptor}} chỉ chạy khi method được gọi **qua proxy**. Vì vậy self-invocation ({{this.method()}}) không qua proxy → không có transaction. Về rollback: mặc định chỉ {{RuntimeException}} và {{Error}} làm rollback; checked exception sẽ **commit** trừ khi khai báo {{rollbackFor}}.

### Cơ chế proxy
1. Container tạo bean target (thường là class thật, không có annotation gì).
2. Vì có {{@Transactional}}, {{AbstractAutoProxyCreator}} bọc target trong proxy (CGLIB mặc định ở Spring Boot, JDK proxy mặc định ở Spring Framework).
3. Khi code gọi {{service.placeOrder()}}, lời gọi đi vào proxy → interceptor mở hoặc tham gia transaction → gọi xuống method thật → commit/rollback.

### Self-invocation – lỗi phổ biến nhất
~~~java
@Service
public class OrderService {
    public void placeOrder() {     // KHÔNG có @Transactional
        saveOrder();               // SAI: thực chất là this.saveOrder() -> không qua proxy
    }                              // -> saveOrder chạy KHÔNG có transaction

    @Transactional
    public void saveOrder() { /* ... */ }
}
// Tương tự: placeOrder có @Transactional(REQUIRED) gọi this.audit() có
// @Transactional(REQUIRES_NEW) -> REQUIRES_NEW bị bỏ qua, audit chạy chung tx ngoài.
~~~
Cách khắc phục:
- Tách sang **service khác** (đúng nhất – mỗi service một trách nhiệm).
- Inject chính nó qua {{@Lazy}} để có proxy: {{private final OrderService self;}} → gọi {{self.saveOrder()}}.
- Dùng {{TransactionTemplate}} khi cần điều khiển thủ công.

### Quy tắc rollback
| Loại exception | Mặc định | Cần khai báo gì để rollback |
|---|---|---|
| {{RuntimeException}}, {{Error}} | Rollback | — |
| Checked exception (vd {{IOException}}) | **Commit** | {{rollbackFor = Exception.class}} |
| Lỗi SQL/Hibernate | Rollback | đã là {{RuntimeException}} |

~~~java
@Transactional(rollbackFor = Exception.class)
public void importFile(InputStream in) throws IOException { /* ... */ }
~~~

### Pitfall production
- Exception phải **thoát ra khỏi** method để kích hoạt rollback. Bắt lỗi rồi nuốt (không rethrow) sẽ khiến transaction commit dù code trong đó đã lỗi.
- Method {{private}}, {{final}} hoặc {{static}} không thể bị proxy → {{@Transactional}} im lặng không có tác dụng.
- Đặt {{@Transactional}} ở tầng service, không đặt ở controller hay repository (repository thường đã có transaction mặc định).
- {{readOnly = true}} giúp Hibernate không dirty-check và có thể tối ưu ở DB; dùng cho query.
- Nếu proxy theo interface (JDK proxy) thì phải inject qua interface, không được inject kiểu class cụ thể.

> Senior tip: khi debug transaction, hãy kiểm tra 3 thứ theo thứ tự: (1) method có {{public}} và class không {{final}} không, (2) lời gọi có đi qua proxy hay là self-invocation, (3) exception có bị nuốt không. Thêm {{logging.level.org.springframework.transaction=DEBUG}} để xem transaction đang bắt đầu/commit hay rollback.`,
  follow: [
    'Tại sao {{@Transactional}} trên method {{private}} bị bỏ qua một cách âm thầm?',
    'Khi nào nên dùng {{TransactionTemplate}} thay vì {{@Transactional}}?'
  ],
  tags: ['Transactional', 'proxy', 'self-invocation', 'rollback', 'transaction']
},
{
  id: 'spring-005',
  topic: 'spring',
  level: 'senior',
  q: 'So sánh các propagation của {{@Transactional}} ({{REQUIRED}}, {{REQUIRES_NEW}}, {{NESTED}}…): mỗi propagation hành xử thế nào khi đã có transaction bên ngoài, và khi nào nên dùng?',
  a: `**Tóm tắt:** Propagation quy định cách một transaction lồng trong transaction khác cư xử. {{REQUIRED}} (mặc định) – join transaction đang có, nếu chưa có thì tạo mới. {{REQUIRES_NEW}} – **treo** (suspend) transaction ngoài, tạo transaction hoàn toàn mới với connection khác, commit độc lập. {{NESTED}} – tạo **savepoint** bên trong transaction hiện tại, rollback chỉ về savepoint chứ không rollback cả transaction.

### Bảng so sánh
| Propagation | Đã có tx cha | Hành vi |
|---|---|---|
| {{REQUIRED}} | Có | Join vào tx cha |
| {{REQUIRES_NEW}} | Có | Suspend tx cha, tạo tx mới (commit độc lập) |
| {{NESTED}} | Có | Tạo savepoint trong tx hiện tại |
| {{SUPPORTS}} | Có | Join nếu có, không tạo nếu không |
| {{NOT_SUPPORTED}} | Có | Tạm dừng tx cha, chạy không transaction |
| {{MANDATORY}} | Bắt buộc có | Không có tx thì báo lỗi |
| {{NEVER}} | Bắt buộc không có | Có tx thì báo lỗi |

### Ví dụ REQUIRES_NEW
~~~java
// Ghi log audit: phải tồn tại dù transaction nghiệp vụ rollback
@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeLog(String message) { /* commit riêng */ }
}
~~~

### Khi nào dùng gì
- **REQUIRED**: mặc định, đúng cho hầu hết service method. Transaction cha và con là một – thành công thì cùng thành công.
- **REQUIRES_NEW**: ghi log/audit bắt buộc phải tồn tại; hoặc cần công việc độc lập với transaction chính. Lưu ý tx mới **không** thấy dữ liệu chưa commit của tx ngoài, và nếu nó cập nhật dòng mà tx ngoài đang khoá thì sẽ tự chờ chính mình (treo tới lock timeout).
- **NESTED**: cần rollback một phần nhưng vẫn giữ phần việc khác của transaction. Chỉ hoạt động khi nền tảng hỗ trợ **savepoint** (PostgreSQL, MySQL InnoDB có; một số DB khác không). Trên JPA, hỗ trợ còn hạn chế.

### Pitfall production
- {{REQUIRES_NEW}} cần **thêm một connection** từ pool (tx cha đang giữ 1 connection). Với HikariCP pool nhỏ, đủ số thread đồng thời là pool cạn → lỗi "Connection is not available".
- {{REQUIRES_NEW}} tạo ra tính không nhất quán: transaction trong commit trước, transaction ngoài rollback sau ⇒ dữ liệu đã ghi vẫn còn. Chỉ dùng khi nghiệp vụ chấp nhận điều đó (log, notification).
- {{NESTED}} trên JPA có thể không hoạt động như kỳ vọng vì provider hỗ trợ hạn chế; hãy test trên đúng DB của bạn.
- Propagation chỉ có tác dụng khi lời gọi **qua proxy** – self-invocation sẽ phá luôn cả propagation.

> Senior tip: trước khi thêm {{REQUIRES_NEW}}, hãy hỏi "transaction con có thật sự cần sống sót khi transaction cha rollback không?". Nếu câu trả lời là không, dùng {{REQUIRED}}. Khi đã dùng {{REQUIRES_NEW}}, luôn kiểm tra kích thước connection pool và đặt timeout cho phần chờ connection.`,
  follow: [
    'Transaction con dùng {{REQUIRES_NEW}} commit thành công nhưng transaction cha rollback – dữ liệu sẽ ra sao?',
    'Tại sao {{NESTED}} không hoạt động trên mọi database?'
  ],
  tags: ['Transactional', 'propagation', 'REQUIRES_NEW', 'NESTED']
},
{
  id: 'spring-006',
  topic: 'spring',
  level: 'senior',
  q: 'Spring AOP tạo proxy bằng JDK dynamic proxy và CGLIB khác nhau thế nào? Hạn chế nào của AOP bạn hay gặp trong production?',
  a: `**Tóm tắt:** Spring tạo proxy ở thời điểm bean được khởi tạo qua {{BeanPostProcessor}}. Có hai cơ chế: **JDK dynamic proxy** (proxy theo interface) và **CGLIB** (sinh subclass). Spring Framework mặc định dùng JDK proxy nếu class có interface; Spring Boot mặc định dùng CGLIB ({{spring.aop.proxy-target-class=true}}). Cả hai đều **không** proxy được method {{private}}, {{final}} và {{static}}, và đều bị "vô hiệu" bởi self-invocation.

### So sánh
| Đặc điểm | JDK dynamic proxy | CGLIB |
|---|---|---|
| Cơ chế | Proxy của interface, class thật làm target | Sinh subclass của class |
| Phạm vi method | Chỉ method khai báo trong interface | Cả method public/protected của class |
| Class final / method final | Không vướng | **Không proxy được** |
| Method private/static | Không proxy | Không proxy |
| Inject kiểu | Phải inject qua interface | Inject được cả kiểu class |
| Yêu cầu constructor | Không | Không cần constructor không tham số (Spring dùng Objenesis để tạo proxy mà không gọi constructor) |

### Ví dụ cấu hình
~~~java
@Aspect
@Component
public class LoggingAspect {
    @Around("execution(* com.acme.service..*.*(..))")
    public Object log(ProceedingJoinPoint pjp) throws Throwable {
        long t = System.currentTimeMillis();
        try { return pjp.proceed(); }
        finally { log.info("{} took {}ms", pjp.getSignature(), System.currentTimeMillis() - t); }
    }
}
~~~

### Hạn chế hay gặp trong production
1. **Self-invocation**: {{this.method()}} không qua proxy → advice, {{@Transactional}}, {{@Async}}, {{@Cacheable}} đều không chạy.
2. **Method private/final/static**: không thể intercept bằng proxy.
3. **Class final** khi dùng CGLIB → phải bỏ final hoặc chuyển sang proxy theo interface.
4. **Nhiều aspect**: Spring sẽ chồng các proxy lại thành chain; thứ tự do {{@Order}} quyết định, và advice {{@Around}} phải gọi {{pjp.proceed()}} đúng một lần.
5. **Proxy + equals/hashCode**: proxy CGLIB có thể làm {{equals}} so sánh khác với entity thật.

### Khi nào không dùng AOP
Khi logic cần chạy ở nhiều nơi mà không phải "cross-cutting" (ví dụ nghiệp vụ cụ thể), hãy dùng composition – một service gọi service khác – rõ ràng và test được hơn.

> Senior tip: AOP rất dễ tạo cảm giác "ma thuật". Quy tắc an toàn trong team: dùng AOP cho **cross-cutting concern rõ ràng** (log, metrics, retry, security, audit), luôn khai báo {{@Order}} để tránh mơ hồ thứ tự, và viết test chứng minh advice thực sự chạy (nhiều bug AOP lọt qua review chỉ vì không có test nào chạm vào nó).`,
  follow: [
    'Khi nào nên chọn JDK proxy thay vì CGLIB trong dự án Spring Boot?',
    'Tại sao {{@Async}} và {{@Cacheable}} cũng chịu cùng hạn chế self-invocation với AOP?'
  ],
  tags: ['AOP', 'CGLIB', 'JDK proxy', 'aspect']
},
{
  id: 'spring-007',
  topic: 'spring',
  level: 'mid',
  q: 'Spring Boot auto-configuration hoạt động thế nào? Cách đăng ký một auto-config riêng và debug điều kiện khi bean không được tạo?',
  a: `**Tóm tắt:** Auto-configuration là cơ chế "cấu hình khi có điều kiện": Spring Boot đọc danh sách class trong {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, rồi chỉ đăng ký bean nếu các điều kiện {{@Conditional...}} thỏa mãn. Công thức vàng: **{{@ConditionalOnMissingBean}}** để không đè lên cấu hình của người dùng, **{{@ConditionalOnClass}}** để không yêu cầu thư viện không có trong classpath. Debug bằng cờ {{--debug}} hoặc endpoint {{/actuator/conditions}}.

### Ba điều kiện thường dùng nhất
| Annotation | Ý nghĩa |
|---|---|
| {{@ConditionalOnMissingBean}} | Chỉ đăng ký nếu chưa có bean cùng type do user define |
| {{@ConditionalOnClass}} | Chỉ đăng ký nếu class có trong classpath |
| {{@ConditionalOnProperty}} | Bật/tắt theo property, ví dụ {{matchIfMissing = true}} |
| {{@ConditionalOnBean}} | Chỉ đăng ký nếu đã có bean khác (thứ tự phụ thuộc) |
| {{@ConditionalOnWebApplication}} | Chỉ áp dụng cho ứng dụng web |

### Ví dụ một auto-configuration
~~~java
@AutoConfiguration
@ConditionalOnClass(Flyway.class)
@EnableConfigurationProperties(FlywayProperties.class)
public class FlywayAutoConfiguration {

    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "spring.flyway.enabled", matchIfMissing = true)
    Flyway flyway(DataSource dataSource) {
        return Flyway.configure().dataSource(dataSource).load();
    }
}
~~~

Và file đăng ký (mỗi dòng một tên class đầy đủ):
~~~text
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.acme.config.FlywayAutoConfiguration
~~~

**Lưu ý phiên bản:** Spring Boot 3.x dùng file {{.imports}}; trước Boot 2.7 dùng key {{EnableAutoConfiguration}} trong {{META-INF/spring.factories}}.

### Thứ tự auto-configuration
Dùng {{@AutoConfigureBefore}} / {{@AutoConfigureAfter}} để ép thứ tự, và {{@AutoConfigureOrder}} để sắp xếp theo số. Nếu không khai báo, Boot sắp theo tên class (alphabet) – nó **không** tự suy ra thứ tự từ dependency giữa các bean.

### Debug
1. Chạy app với {{--debug}}: log startup in ra "Condition evaluation report" liệt kê từng auto-config và điều kiện đã khớp hay không.
2. Actuator: thêm {{management.endpoints.web.exposure.include=health,info,conditions}} rồi xem {{/actuator/conditions}} – JSON cho biết chính xác điều kiện nào fail.
3. {{/actuator/env}} xem property đã resolve thành gì.

### Pitfall production
- Đặt {{@Bean}} trong auto-configuration mà không có {{@ConditionalOnMissingBean}} → đè lên cấu hình của user, gây khó debug.
- {{@ConditionalOnClass(X.class)}} ở **class-level** là an toàn (Spring đọc annotation bằng ASM, không nạp class). Nhưng đặt trên **method {{@Bean}}** với class literal thì có thể ném {{ClassNotFoundException}}/{{NoClassDefFoundError}} khi X vắng mặt. Cách an toàn: tách nested {{@Configuration}} riêng có điều kiện ở class-level, hoặc dùng {{name = "com.x.X"}} dạng String.
- Thiếu {{@AutoConfigureAfter}} / {{@AutoConfigureOrder}} → auto-config của bạn có thể chạy trước khi bean của thư viện khác sẵn sàng.

> Senior tip: khi viết auto-config cho đội ngũ, hãy nghĩ nó là **API công khai**: mọi bean đều phải có {{@ConditionalOnMissingBean}}, phải tôn trọng property có mặc định hợp lý, và phải có test kiểm tra "user tự định nghĩa bean thì auto-config nhường đường". Đó là 3 test tối thiểu của một auto-config đạt chuẩn.`,
  follow: [
    'Sự khác biệt giữa {{@ConditionalOnMissingBean}} và {{@ConditionalOnMissingClass}} là gì?',
    'Làm sao biết auto-config nào đã được nạp mà không cần bật {{--debug}}?'
  ],
  tags: ['auto-configuration', 'Conditional', 'actuator', 'debug']
},
{
  id: 'spring-008',
  topic: 'spring',
  level: 'lead',
  q: 'Vì sao Spring Boot 2.6+ cấm circular dependency mặc định? Bạn sẽ phân tích và refactor một vòng phụ thuộc A → B → A thế nào?',
  a: `**Tóm tắt:** Circular dependency (A phụ thuộc B, B phụ thuộc A) bị Spring Boot 2.6+ chặn mặc định bằng {{spring.main.allow-circular-references=false}} (Boot 3 giữ nguyên). Lý do: Spring **chỉ có thể** giải quyết cycle bằng "early reference" + proxy (chỉ với field/setter injection), còn cycle qua constructor là bế tắc thật sự. Quan trọng hơn, cycle là triệu chứng của thiết kế sai – nó làm các class phụ thuộc lẫn nhau, không test được độc lập và khó mở rộng.

### Spring xử lý cycle thế nào
Với field/setter injection, container có thể: tạo A (chưa inject B) → đưa "early reference" của A vào B → inject B vào A → sau đó thay early reference bằng proxy. Cách này **không** hoạt động với constructor injection (constructor cần B ngay từ đầu), và dễ vỡ với các proxy không hỗ trợ early reference như {{@Async}} (lỗi "has been injected into other beans in its raw version"); proxy AOP thông thường thì Spring vẫn tạo sớm được.

### Vì sao Boot cấm
- Che giấu design smell: hai class biết rõ nhau, vi phạm SRP và DIP.
- Phụ thuộc vào chi tiết triển khai (early reference + proxy) – dễ vỡ khi thêm {{@Async}}, {{@Transactional}} hay khi class trở nên final.
- Trước Boot 2.6, mặc định là **cho phép**, nên nhiều dự án cũ đang vô tình dựa vào cơ chế early reference. Khi nâng cấp lên Boot 2.6+/3.x, app sẽ **fail lúc start** – đây là lý do upgrade Boot hay bị "gãy" ngoài dự kiến.

### Quy trình phân tích khi gặp lỗi
1. Đọc chuỗi lỗi: Boot in ra đường dẫn phụ thuộc đầy đủ (A → B → A), đánh số từng bean. Xác định đâu là **điểm giao** – thường là interface bị cả hai cùng implement hoặc một service vừa gọi vừa được gọi.
2. Vẽ lại sơ đồ phụ thuộc và hỏi: "A có thật sự cần B ngay lúc khởi tạo, hay chỉ cần B khi xử lý request?".
3. Kiểm tra {{@Lazy}} đang được dùng ở đâu để "giấu" cycle.

### Các cách refactor (xếp theo mức độ ưu tiên)
1. **Tách abstraction**: để B phụ thuộc vào interface do A định nghĩa (Dependency Inversion). Cycle thường tan ngay khi đảo chiều sở hữu interface.
2. **Đảo chiều phụ thuộc theo use case**: service "cao cấp" (application service) gọi cả hai service "thấp" – ông trung gian không cần logic, chỉ điều phối.
3. **Event-driven**: thay lời gọi trực tiếp bằng {{ApplicationEventPublisher}} + {{@TransactionalEventListener}} ở phía nhận. Lưu ý event chạy **sau commit** nếu dùng {{@TransactionalEventListener}}, nên dữ liệu phải được đọc lại.
4. **Lazy injection** ({{@Lazy}} hoặc {{ObjectProvider<T>}}): tạo proxy trì hoãn, phá cycle về mặt kỹ thuật. Đây là **workaround**, dùng khi cần fix nhanh trên hệ thống cũ.
5. **Tách module/service**: nếu cycle xuyên qua ranh giới module, đó là dấu hiệu thiếu event bus hoặc thiếu một module "shared".

### Pitfall production
- {{@Lazy}} làm che mất vấn đề: lỗi tạo bean (nếu có) chỉ lộ ra ở lần gọi đầu tiên qua lazy proxy lúc runtime, thay vì lỗi lúc start.
- Event-driven: nếu phát event trong cùng transaction mà listener dùng {{@EventListener}} (không {{@TransactionalEventListener}}), listener chạy **trước commit** – đọc được dữ liệu chưa commit và có thể gây deadlock.
- Cycle với bean scope {{prototype}} cũng không giải quyết được; còn cycle giữa các bean của cùng thư viện bên thứ ba thì không sửa được, phải đổi cách tích hợp.

> Senior tip: hãy coi circular dependency là **cảnh báo thiết kế**, không phải lỗi cấu hình. Trong review, câu hỏi đáng đặt ra là: "module này có đang biết quá nhiều về module kia không?". Với hệ thống ngân hàng nhiều layer (controller → service → repository → integration), cycle thường xuất hiện ở chỗ tầng dưới cần gọi ngược lên tầng trên – lúc đó đúng phải tách abstraction hoặc dùng event.`,
  follow: [
    'Có trường hợp nào nên chấp nhận circular dependency bằng {{@Lazy}} không?',
    'Làm sao phát hiện cycle trong project lớn ngoài việc chờ app fail lúc start?'
  ],
  tags: ['circular dependency', 'bean lifecycle', 'refactor', 'design']
},
{
  id: 'spring-009',
  topic: 'spring',
  level: 'lead',
  q: 'Trong Spring Security, filter chain hoạt động thế nào? Xác thực JWT stateless cho REST API và cấu hình OAuth2 Resource Server như thế nào?',
  a: `**Tóm tắt:** Spring Security là kiến trúc **filter-based**: mỗi request đi qua {{FilterChainProxy}}, gọi lần lượt các filter (đọc token, dựng {{SecurityContext}}, kiểm tra quyền, xử lý lỗi). Với API stateless dùng JWT: tắt session, tắt CSRF, và xác thực bằng {{BearerTokenAuthenticationFilter}}. Spring Boot cấu hình gần như tự động khi bạn thêm starter {{oauth2-resource-server}} và khai báo {{spring.security.oauth2.resourceserver.jwt.issuer-uri}}.

### Thứ tự filter quan trọng
| Filter | Vai trò |
|---|---|
| {{SecurityContextHolderFilter}} | Nạp {{SecurityContext}} (không tự lưu session) |
| {{CsrfFilter}} | Chống CSRF cho request dùng cookie |
| {{BearerTokenAuthenticationFilter}} | Đọc header {{Authorization: Bearer ...}}, xác thực token |
| {{UsernamePasswordAuthenticationFilter}} | Đăng nhập bằng form (REST thường không dùng) |
| {{ExceptionTranslationFilter}} | Chuyển lỗi 401/403 sang entry point |
| {{AuthorizationFilter}} | Kiểm tra quyền theo rule đã cấu hình |

### Cấu hình API stateless
~~~java
@Bean
SecurityFilterChain apiChain(HttpSecurity http, JwtAuthenticationConverter converter)
        throws Exception {
    return http
        .csrf(AbstractHttpConfigurer::disable)          // không dùng cookie -> không cần CSRF
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(a -> a
            .requestMatchers("/actuator/health", "/api/public/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated())
        .oauth2ResourceServer(o -> o
            .jwt(j -> j.jwtAuthenticationConverter(converter)))
        .build();
}
~~~

### Cơ chế xác thực JWT (Resource Server)
- Resource server **không** phát token, chỉ xác thực token do Authorization Server (Keycloak, Spring Authorization Server, Cognito) cấp.
- Khai báo {{issuer-uri}} → Boot tự lấy {{/.well-known/openid-configuration}}, tải **JWK Set** để xác thực chữ ký, và cache bằng {{NimbusJwtDecoder}}.
- Token phải kiểm tra: chữ ký hợp lệ, {{iss}} đúng, {{exp}} chưa hết hạn (chấp nhận clock skew mặc định 60s), {{aud}} đúng với API của bạn (cần cấu hình thêm {{audience}} validator).
- Authorities: mặc định scope {{read:orders}} → {{SCOPE_read:orders}}. Nếu token mang claim {{roles}} cần khai báo {{JwtAuthenticationConverter}} tùy chỉnh.

### Pitfall production
- Tắt CSRF phải đi kèm việc **không dùng cookie/session** để xác thực. Nếu app vừa có web session vừa có API, tách filter chain riêng cho từng phần.
- Chỉ dựa vào {{exp}} mà không kiểm tra {{aud}} là lỗ hổng kinh điển: token cấp cho dịch vụ khác vẫn dùng được.
- Refresh token: cần cơ chế rotation, lưu hash phía server, phát hiện reuse.
- Không log token/header {{Authorization}}; redact trong log filter.
- Cần rate limiting và cơ chế chặn brute force ở tầng gateway.

> Senior tip: khi tách hệ thống sang nhiều service, chuẩn phổ biến nhất là **OAuth2 Resource Server + JWT** ký bất đối xứng (RS256/ES256, service chỉ giữ public key lấy từ JWKS – không dùng shared secret HS256, vì service nào giữ secret cũng tự ký được token): mỗi service tự xác thực, không cần gọi auth server mỗi request (latency + single point of failure). Nhớ rằng đó là **trust boundary**: chỉ service nào thực sự cần mới nhận token, và luôn kiểm tra {{aud}} cùng scope tối thiểu cần thiết.`,
  follow: [
    'Sự khác biệt giữa Resource Server và Authorization Server trong OAuth2 là gì?',
    'Làm sao hỗ trợ cả API không token (public) và API cần token trong cùng ứng dụng?'
  ],
  tags: ['Spring Security', 'JWT', 'OAuth2', 'filter chain', 'stateless']
},
{
  id: 'spring-010',
  topic: 'spring',
  level: 'senior',
  q: '{{@Async}} có những cái bẫy nào: exception bị nuốt, executor mặc định, transaction và thread-local không được truyền sang?',
  a: `**Tóm tắt:** {{@Async}} chạy method ở thread khác do một {{TaskExecutor}} quản lý. Nó cũng dựa trên **proxy**, nên chịu đúng hạn chế của AOP: self-invocation, method {{private}}/{{final}} → không chạy async. Ba cái bẫy lớn nhất: (1) **exception bị nuốt** – task chạy nền, lỗi không trả về cho caller; (2) **transaction không truyền sang** thread mới; (3) **ThreadLocal không truyền** (MDC, {{SecurityContext}}).

### Bật và cấu hình executor
~~~java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    @Bean("reportExecutor")
    ThreadPoolTaskExecutor reportExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(500);          // có backpressure
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setThreadNamePrefix("report-");
        ex.initialize();
        return ex;
    }

    @Override public Executor getAsyncExecutor() { return reportExecutor(); }
}
~~~

### Executor mặc định là gì
- Nếu có **đúng một** bean {{TaskExecutor}}, Spring dùng bean đó cho {{@Async}}.
- Spring Boot tự động cấu hình bean {{applicationTaskExecutor}} (core size 8, queue rất lớn, prefix {{task-}}).
- Nếu **không** có bean nào, Spring rơi về {{SimpleAsyncTaskExecutor}}: **mỗi task một thread mới, không giới hạn** → chạy tải cao sẽ sinh hàng nghìn thread và làm chết máy. Luôn khai báo executor tường minh.

### Bẫy 1 – exception bị nuốt
Method {{void}}: exception đi vào {{AsyncUncaughtExceptionHandler}} (mặc định chỉ log), caller không hề biết. Method trả {{Future}}/{{CompletableFuture}}: exception nằm trong Future, không ai đọc là mất. Muốn xử lý lỗi: trả {{CompletableFuture<Void>}} và dùng {{whenComplete}} / {{exceptionally}}, và cài {{AsyncUncaughtExceptionHandler}} riêng (alert/metrics) cho method void.

### Bẫy 2 – transaction
Transaction gắn với thread (qua {{TransactionSynchronizationManager}}), nên thread mới **không có** transaction. Đừng mong {{@Transactional}} ở method gọi được kế thừa. Hãy đặt {{@Transactional}} ngay trên chính method async (chạy trong thread mới) để có transaction riêng.

### Bẫy 3 – ThreadLocal
{{MDC}} (trace id) và {{SecurityContext}} không tự truyền sang thread mới. Dùng {{TaskDecorator}} để copy context:
~~~java
ex.setTaskDecorator(runnable -> {
    var ctx = MDC.getCopyOfContextMap();
    return () -> { MDC.setContextMap(ctx); try { runnable.run(); } finally { MDC.clear(); } };
});
~~~

### Pitfall production
- Queue không giới hạn + producer nhanh hơn consumer → memory tăng cho tới khi OOM; luôn đặt queue capacity và rejection policy.
- {{@Async}} trên method {{private}} hoặc lời gọi nội bộ {{this.x()}} → chạy đồng bộ, không báo lỗi.
- Không dùng {{@Async}} để che giấu một luồng nghiệp vụ quan trọng: nếu task thất bại, không có gì retry. Hãy dùng hàng đợi bền vững (RabbitMQ/Kafka/SQS) khi cần đảm bảo giao.
- Spring Boot 3.2 trở đi có thể dùng **virtual thread executor** với {{spring.threads.virtual.enabled=true}} – phù hợp khi tác vụ I/O nhiều.

> Senior tip: định nghĩa rõ trong team: {{@Async}} chỉ dùng cho **tác vụ không quan trọng** (gửi email, ghi log, cập nhật thống kê). Với tác vụ nghiệp vụ cần đảm bảo không mất, hãy đẩy vào message broker và có cơ chế retry/dead-letter. Nhớ thêm metrics đếm số task async đang chờ và số task lỗi – không có visibility thì rất khó phát hiện task chết âm thầm.`,
  follow: [
    'Làm sao truyền {{SecurityContext}} hoặc trace id sang thread async một cách an toàn?',
    'Khi nào nên dùng message broker thay vì {{@Async}}?'
  ],
  tags: ['Async', 'executor', 'ThreadPoolTaskExecutor', 'CompletableFuture']
},
{
  id: 'spring-011',
  topic: 'spring',
  level: 'senior',
  q: '{{@Scheduled}} cần lưu ý gì về timezone, nhiều instance chạy cùng lúc, task chạy lâu và xử lý exception?',
  a: `**Tóm tắt:** {{@Scheduled}} cần {{@EnableScheduling}} và có 3 kiểu trigger: {{fixedRate}} (định kỳ tính từ lúc bắt đầu), {{fixedDelay}} (chờ thêm X sau khi xong) và {{cron}}. Bốn cái bẫy lớn: timezone mặc định theo server, chạy trùng khi deploy nhiều instance, task dài chặn các task khác, và task chết vì exception.

### Ba kiểu trigger
~~~java
@Scheduled(fixedRate = 60_000)                 // mỗi phút, tính từ lúc bắt đầu
@Scheduled(fixedDelay = 60_000)                // chờ 60s sau khi task trước xong
@Scheduled(cron = "0 0 2 * * *", zone = "Asia/Ho_Chi_Minh")
public void rebuildReport() { }
~~~

### Bẫy 1 – timezone
Mặc định cron dùng timezone của **máy chạy app**. Nếu server ở UTC mà nghiệp vụ VN mong đợi 02:00 giờ VN, job sẽ chạy lúc 09:00 VN. Luôn chỉ định {{zone = "Asia/Ho_Chi_Minh"}} cho job theo lịch nghiệp vụ.

### Bẫy 2 – chạy trùng trên nhiều instance
Khi deploy 3 pod, job sẽ chạy 3 lần cùng lúc. Cách xử lý:
- **ShedLock** (thư viện phổ biến): khoá theo lịch trên DB, chỉ một instance chạy.
~~~java
@Scheduled(cron = "0 0 2 * * *")
@SchedulerLock(name = "rebuildReport", lockAtMostFor = "30m", lockAtLeastFor = "5m")
public void rebuildReport() { }
~~~
- Tách riêng một "scheduler instance" duy nhất, hoặc đẩy job sang message broker / batch framework.

### Bẫy 3 – task dài làm nghẽn scheduler
Spring dùng {{ThreadPoolTaskScheduler}} mặc định **pool size = 1** → task chạy 2 phút sẽ chặn task kế tiếp đến 2 phút. Giải pháp: cấu hình pool lớn hơn, tách scheduler riêng cho job nặng, hoặc cho method đó gọi xuống một executor bất đồng bộ.

### Bẫy 4 – exception
Với task lặp lại ({{fixedRate}}/{{fixedDelay}}/{{cron}}), Spring bọc task bằng error handler mặc định "log rồi bỏ qua" → lần chạy sau vẫn diễn ra, job không chết. Nhưng lỗi chỉ nằm trong log ở mức ERROR, không ai được báo → nên tự bắt exception, đếm metric lỗi và alert để không mất visibility.

### Pitfall production
- Job phải **idempotent**: có thể chạy lại do retry, deploy giữa chừng, hoặc clock lệch.
- Dùng {{Clock}} bean thay vì {{LocalDateTime.now()}} để test được và không phụ thuộc timezone máy.
- Với job dài: tách phần "lấy dữ liệu" và "ghi kết quả", ghi theo lô (batch) để không giữ transaction mở quá lâu.
- Job ghi file/xuất báo cáo: ghi ra file tạm rồi rename để không ai đọc được file dở dang.

> Senior tip: hãy coi mọi scheduled job là **distributed system** thu nhỏ: nó có thể chạy song song (nhiều instance), chạy lại (retry), và chạy trễ (deploy, GC pause). Thiết kế theo hướng "at-least-once + idempotent" sẽ khiến hệ thống chịu được cả ba. Nếu job quan trọng, hãy dùng batch framework (Quartz, Spring Batch) thay vì {{@Scheduled}}.`,
  follow: [
    'Tại sao {{fixedRate}} có thể khiến các lần chạy bị dồn lại (fixed rate so với fixed delay)?',
    'Làm sao đảm bảo một scheduled job là idempotent?'
  ],
  tags: ['Scheduled', 'cron', 'timezone', 'ShedLock', 'scheduler']
},
{
  id: 'spring-012',
  topic: 'spring',
  level: 'senior',
  q: 'Spring MVC và Spring WebFlux khác nhau thế nào? Khi nào nên chọn WebFlux, và virtual threads của Java 21 có làm thay đổi lựa chọn này không?',
  a: `**Tóm tắt:** Spring MVC là mô hình **blocking** – mỗi request chiếm một thread trong suốt thời gian xử lý. WebFlux là mô hình **reactive non-blocking** – event loop xử lý hàng nghìn request đồng thời nhờ backpressure. Với hệ thống dùng JDBC/JPA (blocking), WebFlux không giúp gì, và lựa chọn hiện đại là **MVC + virtual threads (Java 21)**.

### So sánh
| Tiêu chí | Spring MVC | Spring WebFlux |
|---|---|---|
| Mô hình thread | Thread-per-request (blocking) | Event loop + non-blocking |
| Ngưỡng đồng thời | Bị giới hạn bởi số thread của container | Rất cao, nhưng chỉ khi I/O thực sự non-blocking |
| DB driver | JDBC/JPA (blocking) | R2DBC (non-blocking) |
| Blocking code | Bình thường | **Chặn event loop → rất nguy hiểm** |
| Backpressure | Không có (dựa vào số thread) | Có, giới hạn tốc độ producer |
| Streaming/SSE/WebSocket | Có (không tối ưu) | Rất tốt |

### Vì sao WebFlux "không nhanh hơn" khi dùng JPA
WebFlux chỉ hay khi **toàn bộ** chuỗi I/O không chặn: R2DBC, WebClient, Kafka reactive, SSE. Nếu bạn vẫn dùng JPA/Hibernate trong handler, các lệnh query blocking sẽ giữ event loop → mất đúng lợi thế của WebFlux, thêm độ phức tạp. Kết hợp "WebFlux + JPA" là dấu hiệu thiết kế sai.

### Virtual threads thay đổi bức tranh thế nào
Java 21 (JEP 444) cho phép tạo hàng triệu thread nhẹ. Spring Boot 3.2+ hỗ trợ:
~~~yaml
spring:
  threads:
    virtual:
      enabled: true
~~~
Khi đó Tomcat xử lý mỗi request bằng một virtual thread: **code blocking vẫn viết như MVC thông thường**, nhưng không còn giới hạn "số thread = số request đồng thời". Đây là lựa chọn mặc định rất hợp lý cho hệ thống CRUD dùng JPA.

### Pitfall production
- **Thread pinning**: trên Java 21, virtual thread có thể pin carrier khi blocking trong một số vùng {{synchronized}} hoặc native method. Tránh giữ monitor qua thao tác I/O blocking dài; không cần thay mọi {{synchronized}} bằng {{ReentrantLock}}. JEP 491 (Java 24) loại bỏ pinning do monitor trong các trường hợp này.
- ThreadLocal trong virtual thread vẫn hoạt động nhưng bộ nhớ phụ thuộc số thread đang sống → tránh giữ dữ liệu lớn trong ThreadLocal.
- Với virtual thread, **connection pool phải nhỏ lại** (pool là tài nguyên hữu hạn của DB), không phải lớn lên.
- Kiểm thử: MVC dùng {{MockMvc}}, WebFlux dùng {{WebTestClient}} – test sai loại là nguồn lỗi phổ biến.

### Câu hỏi phỏng vấn đáng nhớ
"Khi nào bạn **không** dùng WebFlux?" – Câu trả lời tốt: khi toàn bộ I/O là blocking (JPA/JDBC), khi hệ thống cần độ trễ thấp cho request đơn giản, hoặc khi đội ngũ không đủ kinh nghiệm reactive – lúc đó MVC + virtual thread cho hiệu năng tốt hơn với chi phí phát triển thấp hơn nhiều.

> Senior tip: đừng chọn WebFlux chỉ vì nghe "reactive là xu hướng". Hãy đo: nếu hệ thống bị nghẽn vì thread bị chặn I/O (DB, HTTP client), chuyển sang virtual thread là thay đổi nhỏ, hiệu quả cao. Chuyển sang WebFlux là viết lại toàn bộ tầng I/O – chi phí lớn, chỉ đáng làm khi thực sự cần backpressure và streaming.`,
  follow: [
    'Tại sao dùng WebFlux cùng JPA là một anti-pattern?',
    'Virtual thread ảnh hưởng thế nào đến việc sizing connection pool?'
  ],
  tags: ['Spring MVC', 'WebFlux', 'reactive', 'virtual threads']
},
{
  id: 'spring-013',
  topic: 'spring',
  level: 'senior',
  q: 'Xử lý exception tập trung trong Spring Boot như thế nào? {{@ControllerAdvice}} và {{ProblemDetail}} (RFC 7807/9457) dùng ra sao, và bẫy nào cần tránh?',
  a: `**Tóm tắt:** Xử lý lỗi tập trung bằng {{@RestControllerAdvice}} + {{@ExceptionHandler}}. Từ Spring Framework 6, Spring hỗ trợ **{{ProblemDetail}}** theo RFC 9457 (trước đây là RFC 7807): chỉ cần trả về {{ProblemDetail}} là framework tự sinh response {{application/problem+json}} với {{type}}, {{title}}, {{status}}, {{detail}} và các property mở rộng.

### Cấu trúc một advice
~~~java
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    @ExceptionHandler(OrderNotFoundException.class)
    ProblemDetail handleNotFound(OrderNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Order not found");
        pd.setProperty("code", "ORDER_NOT_FOUND");
        pd.setProperty("timestamp", Instant.now());
        return pd;
    }

    // Với lỗi validation, override handleMethodArgumentNotValid nếu cần format riêng.
}
~~~

### Khi nào kế thừa ResponseEntityExceptionHandler
Lớp này xử lý nhiều lỗi do Spring MVC sinh ra như 400, 405 và 415. Nếu kế thừa, hãy override các hook tương ứng (ví dụ {{handleMethodArgumentNotValid}}) thay vì khai báo một {{@ExceptionHandler}} trùng với exception đã được lớp cha ánh xạ. Lỗi 404 không được bảo đảm đi qua advice; việc xử lý phụ thuộc cấu hình resource/dispatcher.

### Định dạng response chuẩn
~~~json
{
  "type": "https://errors.acme.com/order-not-found",
  "title": "Order not found",
  "status": 404,
  "detail": "Order 123 does not exist",
  "code": "ORDER_NOT_FOUND",
  "timestamp": "2026-01-20T02:15:00Z"
}
~~~

### Bẫy cần tránh
1. **Catch-all im lặng**: {{@ExceptionHandler(Exception.class)}} trả 500 với {{ex.getMessage()}} sẽ làm lộ chi tiết nội bộ (câu SQL, đường dẫn file) ra ngoài. Phải log lỗi gốc ở server và trả về client thông điệp trung tính.
2. **Mất stack trace trong log**: nếu chỉ trả về ProblemDetail mà không log, sự cố production sẽ rất khó truy.
3. **Bắt rộng quá**: bắt {{Exception.class}} sẽ nuốt cả lỗi hệ thống nghiêm trọng, che mất bug.
4. **Lỗi ngoài dispatcher**: exception trong filter, interceptor, hay trong async task không đi qua {{@ControllerAdvice}} – phải xử lý riêng.
5. **Không có correlation id**: client báo lỗi mà không có mã định danh để tra log.

### Pitfall production
- Cân nhắc phân quyền theo vai trò: client có quyền xem thông báo chi tiết, client khác chỉ thấy mã lỗi.
- Nội dung {{ProblemDetail}} có thể được cache lại bởi CDN/proxy – nhớ đặt header chặn cache cho response lỗi.
- Không đưa thông tin nội bộ vào {{detail}} khi lỗi do người dùng gây ra; đặt thông tin chi tiết vào log kèm {{traceId}}.

> Senior tip: hãy chuẩn hoá lỗi của cả hệ thống theo **mã lỗi nghiệp vụ** ({{code}}) thay vì chuỗi message tiếng Anh – client hiển thị theo mã, còn bạn đổi message trong code mà không phá vỡ client. Kèm theo đó, luôn trả về {{traceId}} để tra log trong 30 giây khi user gọi báo lỗi.`,
  follow: [
    'Sự khác biệt giữa {{@ExceptionHandler}} và {{@ResponseStatus}} là gì?',
    'Tại sao lỗi phát sinh trong filter không được xử lý bởi {{@ControllerAdvice}}?'
  ],
  tags: ['ControllerAdvice', 'ProblemDetail', 'RFC 7807', 'exception handling'],
  refs: [
    { type: 'doc', title: 'Spring Framework REST Exceptions', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html' },
    { type: 'doc', title: 'Spring Problem Details', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html' },
    { type: 'doc', title: 'RFC 9457 Problem Details', url: 'https://www.rfc-editor.org/rfc/rfc9457.html' }
  ]
},
{
  id: 'spring-014',
  topic: 'spring',
  level: 'lead',
  q: 'Quản lý cấu hình trong Spring Boot như thế nào: {{@ConfigurationProperties}}, profile, externalized config và bí mật (secret)?',
  a: `**Tóm tắt:** Dùng {{@ConfigurationProperties}} để bind cấu hình theo kiểu (type-safe) kèm validation, dùng **profile** để tách cấu hình theo môi trường, và đưa cấu hình ra ngoài ứng dụng (biến môi trường, tham số JVM, command line, config server) để deploy **cùng một artifact** cho mọi môi trường. Bí mật không bao giờ nằm trong repo hay trong image – lấy từ secret manager (Vault, AWS Secrets Manager) và chỉ inject vào runtime.

### Ràng buộc type-safe
~~~java
@ConfigurationProperties("payment")
@Validated
public record PaymentProperties(
        @NotBlank String provider,
        @Min(1) @Max(60) int timeoutSeconds,
        @NotNull Duration retryDelay,
        @DefaultValue("https://api.sandbox.vn") URI endpoint) { }
~~~

- Dùng **record** + constructor binding (Spring Boot 3 tự động, không cần {{@ConstructorBinding}}).
- Kiểu thời gian/kích thước: {{Duration}}, {{DataSize}}, {{Period}} – viết {{30s}}, {{512KB}} rất rõ ràng.
- Bật scan: {{@ConfigurationPropertiesScan}} trên class chính, hoặc {{@EnableConfigurationProperties(PaymentProperties.class)}}.
- Validation bắt buộc: {{@Validated}} + {{@NotNull/@Min/...}} → app **fail lúc start** nếu config sai, thay vì lỗi lúc chạy.

### Profile
~~~yaml
# application.yml
spring:
  profiles:
    active: dev
---
# application-prod.yml
payment:
  provider: vnpay
  timeout-seconds: 15
~~~
- Profile có thể kích hoạt bằng {{SPRING_PROFILES_ACTIVE}}, {{--spring.profiles.active=prod}}; còn {{spring.config.activate.on-profile}} dùng để gắn một khối cấu hình vào profile (không phải để kích hoạt profile).
- Thứ tự ưu tiên (rút gọn, cao → thấp): command line args → system properties → biến môi trường OS → file theo profile (application-*.yml) → {{application.yml}} → {{@PropertySource}} → default properties.

### Externalized config
- Biến môi trường theo **relaxed binding**: {{payment.provider}} ↔ {{PAYMENT_PROVIDER}}.
- Config Server: {{spring.config.import=optional:configserver:}} để lấy config tập trung, có thư mục theo profile, label theo version.
- File ngoài: {{spring.config.import=optional:file:/etc/app/}}.

### Quản lý bí mật
- Tuyệt đối không commit secret; dùng biến môi trường, file mount (Kubernetes Secret), hoặc secret manager.
- Xoay vòng (rotation) định kỳ và hỗ trợ 2 phiên bản để deploy không gián đoạn.
- Actuator phải **sanitize** giá trị nhạy cảm: {{management.endpoint.env.show-values=NEVER}} (đây là mặc định từ Boot 3 – che toàn bộ giá trị; Boot 2 chỉ che các key như {{password}}, {{secret}}, {{key}}, {{token}}). Đừng đổi sang {{ALWAYS}} trên production.

### Pitfall production
- Đổi tên property mà quên cập nhật chỗ dùng → app start với giá trị mặc định, lỗi lúc chạy. Luôn có {{@Validated}} + **không đặt default cho property bắt buộc**.
- Profile "active" bị set nhầm trong môi trường thật là nguyên nhân rất phổ biến của sự cố cấu hình.
- Secret nằm trong log khởi động (ví dụ in cấu hình) là lỗ hổng phổ biến – kiểm tra log ở môi trường thật.

> Senior tip: hãy coi cấu hình là **hợp đồng giữa app và môi trường**: mỗi property nên có kiểu rõ ràng, có validation, và mặc định an toàn. Một mẹo hay: đặt toàn bộ config vào một package riêng và viết test khẳng định app **start được** với từng profile – bắt được lỗi config ngay trong CI thay vì lúc deploy.`,
  follow: [
    'Relaxed binding quy định việc map từ tên biến môi trường sang property như thế nào?',
    'Vì sao nên dùng record cho {{@ConfigurationProperties}} thay vì class có setter?'
  ],
  tags: ['ConfigurationProperties', 'profile', 'secrets', 'externalized config']
},
{
  id: 'spring-015',
  topic: 'spring',
  level: 'senior',
  q: 'Giám sát và vận hành service Spring Boot: Actuator, Micrometer, distributed tracing và graceful shutdown nên cấu hình thế nào?',
  a: `**Tóm tắt:** Bộ ba vận hành là **Actuator** (endpoint quản trị: health, metrics, env), **Micrometer** (lớp đo lường, xuất ra Prometheus/CloudWatch) và **Micrometer Tracing + OpenTelemetry** (distributed tracing, truyền {{traceparent}} theo chuẩn W3C). **Graceful shutdown** đảm bảo khi pod nhận SIGTERM, nó ngừng nhận request mới, chờ request đang chạy xong rồi mới đóng pool và connection.

### Cấu hình gợi ý
~~~yaml
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      probes:
        enabled: true
      show-details: when-authorized
  tracing:
    sampling:
      probability: 0.1          # 10% request được trace
server:
  shutdown: graceful
spring:
  lifecycle:
    timeout-per-shutdown-phase: 30s
~~~

### Endpoint nào dùng cho việc gì
| Endpoint | Dùng để |
|---|---|
| {{/actuator/health}} | Kiểm tra sống; tách {{liveness}} và {{readiness}} cho Kubernetes |
| {{/actuator/prometheus}} | Scrape số liệu |
| {{/actuator/metrics}} | Xem metric chi tiết tại thời điểm đang lỗi |
| {{/actuator/env}}, {{/actuator/configprops}} | Debug cấu hình |
| {{/actuator/threaddump}}, {{/actuator/heapdump}} | Chẩn đoán khi app bị treo |

### Metric nên theo dõi
- **RED**: Rate, Error, Duration của HTTP request – Micrometer tự động ghi cho web server ({{http.server.requests}}).
- **Các metric nghiệp vụ**: số đơn/ngày, số task thất bại, độ trễ hàng đợi.
- **HikariCP**: {{hikaricp.connections.pending}}, {{hikaricp.connections.usage}} → phát hiện sớm pool cạn.
- Cảnh báo theo **SLO** (ví dụ: p95 latency > 500ms trong 10 phút) thay vì cảnh báo từng ngưỡng máy.

### Distributed tracing
- Micrometer Tracing bọc OpenTelemetry; tự động thêm trace id vào log (pattern có {{traceId}}) và truyền header {{traceparent}} qua HTTP client.
- Chọn tỉ lệ sample: 100% khi lỗi (dùng tail-based sampling), 1–10% khi bình thường để giảm chi phí.
- Luôn ghi **correlation id** vào log để join log của nhiều service.

### Graceful shutdown
Khi bật {{server.shutdown=graceful}}, quy trình nhận SIGTERM là: server ngừng nhận connection mới → chờ các request đang xử lý (tối đa {{timeout-per-shutdown-phase}}) → đóng {{@PreDestroy}}, đóng connection pool. Kubernetes phải cấu hình {{terminationGracePeriodSeconds}} lớn hơn thời gian shutdown của app, và nên có {{preStop}} hook (sleep 5–10s) vì Kubernetes gỡ pod khỏi endpoints **song song** với việc gửi SIGTERM – không có preStop, vài request vẫn bị route tới pod đang tắt. Boot tự chuyển readiness sang {{REFUSING_TRAFFIC}} khi bắt đầu shutdown.

### Pitfall production
- Expose actuator ra Internet là lỗ hổng (bạn có thể lộ cấu hình, còn {{heapdump}} chứa cả dữ liệu trong bộ nhớ) → chỉ mở trên cổng nội bộ, có authentication.
- {{show-details: always}} sẽ lộ chi tiết DB connection → luôn để {{when-authorized}}.
- Metric có **cardinality cao** (gắn {{userId}}, {{path}} động) sẽ làm Prometheus nổ tung → chỉ tag với giá trị có số lượng hữu hạn.
- Health check sâu (kiểm tra DB) dùng cho **readiness**; nếu dùng cho **liveness** thì DB chậm sẽ khiến Kubernetes restart lại toàn bộ pod.

> Senior tip: hãy coi Actuator là **giao diện vận hành chính thức** của service. Trước khi lên production, kiểm tra danh sách endpoint đang mở, bật authentication cho chúng, và dựng dashboard "vàng": request rate, error rate, p95 latency, độ dài hàng đợi, tỉ lệ lỗi job nền. Khi có sự cố, 5 phút đầu tiên quyết định 80% kết quả, và dashboard quyết định bạn có đủ thông tin để phản ứng hay không.`,
  follow: [
    'Phân biệt liveness probe và readiness probe, gán endpoint nào cho probe nào?',
    'Tại sao metric có cardinality cao lại gây sự cố cho Prometheus?'
  ],
  tags: ['Actuator', 'Micrometer', 'tracing', 'graceful shutdown', 'observability']
},
{
  id: 'jpa-001',
  topic: 'jpa',
  level: 'senior',
  q: 'N+1 query là gì, làm sao phát hiện và xử lý? Bạn sẽ xử lý một truy vấn trả về danh sách kèm collection con bằng cách nào?',
  a: `**Tóm tắt:** N+1 xảy ra khi truy vấn chính trả về N dòng, rồi mỗi dòng lại phát sinh **một** câu truy vấn con (do lazy loading trong vòng lặp) → tổng số query = 1 + N. Triệu chứng: thời gian response tăng tuyến tính theo số bản ghi, log SQL lặp lại hàng trăm lần. Cách xử lý phổ biến nhất: **fetch join**, kế đến **{{@EntityGraph}}**, **batch fetching**, và **DTO projection**.

### Cơ chế gây ra
~~~java
List<Order> orders = orderRepo.findAll();      // 1 query
for (Order o : orders) {
    System.out.println(o.getItems().size());    // mỗi order: 1 query thêm
}
// tổng: 1 + N query
~~~

### Phát hiện
1. Bật log SQL: {{spring.jpa.show-sql=true}} và {{spring.jpa.properties.hibernate.format_sql=true}} → thấy query lặp.
2. Bật thống kê Hibernate: {{spring.jpa.properties.hibernate.generate_statistics=true}} → đếm số query mỗi request.
3. Dùng proxy để đếm query theo request (datasource-proxy, p6spy) hoặc tracing với span cho mỗi SQL.
4. Bật {{spring.jpa.open-in-view=false}}: thay vì che lỗi, nó làm {{LazyInitializationException}} xuất hiện sớm – lúc đó bạn phát hiện ngay chỗ truy cập lazy ngoài transaction.
5. Đọc code: thấy truy cập {{getXxx()}} của collection bên trong vòng lặp là dấu hiệu.

### Cách xử lý
| Cách | Khi nào dùng |
|---|---|
| {{join fetch}} trong JPQL | Truy vấn cần dữ liệu con, số lượng bản ghi vừa phải |
| {{@EntityGraph(attributePaths = ...)}} | Cần fetch nhiều quan hệ mà không viết JPQL |
| {{@BatchSize}} / {{default_batch_fetch_size}} | Nhiều collection nhỏ, gộp N query thành 1 query {{IN}} |
| DTO projection | Chỉ cần vài cột – giảm tải và loại bỏ hẳn vấn đề |
| Dùng subquery thay vì load collection | Cần đếm/thống kê con mà không cần object con |

~~~java
@Query("select o from Order o join fetch o.items where o.customerId = :cid")
List<Order> findWithItems(@Param("cid") Long customerId);

@EntityGraph(attributePaths = {"items", "items.product"})
List<Order> findByCustomerId(Long customerId);
~~~

~~~java
// DTO projection: không tạo entity, không có lazy nào
interface OrderSummary { Long getId(); String getStatus(); int getItemCount(); }
@Query("select new com.acme.dto.OrderRow(o.id, o.status, size(o.items)) from Order o")
List<OrderRow> summary();
~~~

### Pitfall production
- **Fetch join + phân trang** → Hibernate báo cảnh báo {{HHH000104}}: {{firstResult/maxResults}} được thực hiện trong bộ nhớ. Cách xử lý: query lấy danh sách **id** theo trang, rồi query thứ hai fetch theo danh sách id (kèm {{@BatchSize}}).
- Fetch 2 collection kiểu {{List}} cùng lúc → {{MultipleBagFetchException}}. Dùng {{Set}} hoặc tách query.
- {{FetchType.EAGER}} là mặc định của {{@ManyToOne}} và {{@OneToOne}} (còn {{@OneToMany}}/{{@ManyToMany}} mặc định LAZY) → rất dễ tạo N+1 ngầm; nên khai báo {{fetch = FetchType.LAZY}} tường minh.
- Bật {{hibernate.default_batch_fetch_size}} (ví dụ 50) là một "lưới an toàn" rẻ tiền và hiệu quả cho hầu hết collection lazy.

> Senior tip: khi thấy N+1, đừng vội sửa bằng {{join fetch}} cho mọi thứ – join fetch nhiều collection làm SQL phình to và dễ vỡ. Quy trình tốt hơn: (1) đo query count trước/sau, (2) ưu tiên **DTO projection** cho màn hình danh sách vì không ai cần cả entity con, (3) đặt {{default_batch_fetch_size}} làm lưới an toàn, (4) chỉ fetch join khi thực sự cần dữ liệu con để render.`,
  follow: [
    'Vì sao {{join fetch}} kết hợp {{Pageable}} lại gây cảnh báo {{HHH000104}}?',
    'Sự khác biệt giữa {{@BatchSize}} và {{default_batch_fetch_size}} là gì?'
  ],
  tags: ['N+1', 'fetch join', 'EntityGraph', 'lazy loading', 'DTO projection']
},
{
  id: 'jpa-002',
  topic: 'jpa',
  level: 'senior',
  q: 'Persistence context hoạt động thế nào? Các trạng thái của entity, dirty checking và flush mode ảnh hưởng ra sao đến việc ghi dữ liệu?',
  a: `**Tóm tắt:** Persistence context (tức {{EntityManager}}/Session của Hibernate) là **cache cấp 1** và **identity map** của Hibernate: trong một transaction, mỗi entity được load chỉ tồn tại **một** object Java, và mọi thay đổi trên object đó được Hibernate so sánh với ảnh chụp (snapshot) lúc flush để sinh {{UPDATE}} – đó là **dirty checking**. Bốn trạng thái entity: transient, persistent (managed), detached, removed.

### Bốn trạng thái
| Trạng thái | Ý nghĩa | Thay đổi field có được ghi không |
|---|---|---|
| Transient | Mới {{new}}, chưa gắn vào context | Không |
| Persistent / Managed | Đã được load hoặc persist trong context | **Có** – dirty checking |
| Detached | Đã bị {{detach}} hoặc session đã đóng | Không (phải {{merge}}) |
| Removed | Đã đánh dấu xóa | Xóa khi flush |

### Dirty checking
~~~java
@Transactional
public void rename(Long id, String name) {
    Customer c = customerRepo.findById(id).orElseThrow();  // persistent
    c.setName(name);   // KHÔNG cần cập nhật, không cần save()
    // khi commit -> Hibernate so snapshot -> UPDATE
}
~~~
Hai điều kiện để dirty checking chạy đúng:
1. Entity phải được quản lý (managed) trong context.
2. Field phải **không** là {{final}} – Hibernate không gán được final field qua reflection.

### Flush là gì
Flush = đẩy các thay đổi trong context xuống DB (ghi {{INSERT}}/{{UPDATE}}/{{DELETE}} và {{flush}} dirty). Hibernate flush:
- trước khi **commit** transaction;
- trước khi chạy một **JPQL query** có liên quan tới bảng đang bị thay đổi (auto-flush) – để query thấy dữ liệu mới nhất.

Các flush mode:
| FlushMode | Hành vi |
|---|---|
| {{AUTO}} (mặc định) | Flush khi cần (như trên) |
| {{COMMIT}} | Chỉ flush lúc commit → query trong **chính** transaction đó có thể đọc dữ liệu **cũ** (thay đổi chưa flush) |
| {{MANUAL}} | Không tự flush, phải gọi {{session.flush()}} |

### Pitfall production
- **Entity bị "bẩn" sau khi rollback**: transaction rollback trên DB, nhưng object trong context vẫn mang thay đổi. Nếu tái sử dụng context (ví dụ trong một luồng dài), hãy {{clear}} sau khi xử lý lỗi.
- Dùng {{merge}} trên entity detached sẽ tạo **bản sao** managed; nếu bạn giữ tham chiếu tới bản gốc, thay đổi sau đó sẽ không được ghi.
- {{equals}}/{{hashCode}} dựa trên {{getId()}}: trước khi persist, {{getId()}} là {{null}} → entity có thể bị "mất" trong {{HashSet}}.
- Đừng dùng entity làm DTO trả về API: kích hoạt lazy loading ngầm, rò rỉ field nhạy cảm và dễ sinh N+1 khi serialize.

> Senior tip: hãy nhớ quy tắc "**managed = thay đổi được tự động lưu**". Khi debug, nếu sửa field mà DB không đổi, hãy kiểm tra ngay: object có còn managed không (session còn mở không, có bị {{detach}} không), field có {{final}} không, và transaction có commit thật không.`,
  follow: [
    'Vì sao {{merge}} trên entity detached có thể tạo ra bản sao và gây hiểu lầm?',
    'Auto-flush xảy ra trong những trường hợp nào và ảnh hưởng thế nào tới kết quả truy vấn?'
  ],
  tags: ['persistence context', 'dirty checking', 'flush', 'entity states']
},
{
  id: 'jpa-003',
  topic: 'jpa',
  level: 'mid',
  q: '{{LazyInitializationException}} xảy ra khi nào? Open Session In View nên bật hay tắt, và lý do?',
  a: `**Tóm tắt:** Lazy loading chỉ tạo **proxy**; query thật chạy khi bạn truy cập field của proxy. Nếu truy cập đó xảy ra **sau khi session đã đóng** (transaction kết thúc), Hibernate không còn connection để query → {{LazyInitializationException}}. Open Session In View (OSIV) giữ session mở suốt vòng đời HTTP request nên che lỗi này, nhưng lại giữ connection DB lâu và làm N+1 nổ rõ. **Khuyến nghị: tắt OSIV.**

### Khi nào ném LazyInitializationException
~~~text
service.getOrder(id)   -> @Transactional: load order, session đóng khi method kết thúc
controller trả về DTO -> gọi order.getItems() để map -> KHÔNG còn session -> boom
~~~

Ba nguyên nhân thường gặp:
1. Truy cập lazy collection **ngoài** transaction.
2. Truy cập lazy ở tầng view/template (Thymeleaf) sau khi transaction đã đóng.
3. Serialize entity ra JSON bằng Jackson **ngoài** transaction → Jackson gọi getter → chạm lazy.

### OSIV là gì
{{spring.jpa.open-in-view}} mặc định là **true** trong Spring Boot: Spring mở một {{EntityManager}} trước khi xử lý request và đóng sau khi render xong. Nhờ đó các lỗi lazy ở tầng view "biến mất".

### Vì sao nên tắt
| Vấn đề | Giải thích |
|---|---|
| Giữ connection lâu | Session mở suốt request ⇒ connection bị giữ cả khi không dùng query |
| Che lỗi | Bug N+1, lỗi mapping bị che tới lúc chạy production |
| Phụ thuộc ẩn | Method không có {{@Transactional}} vẫn "chạy được" ở dev, nhưng lỗi khi deploy cấu hình khác |
| Transaction semantics | Không có transaction bao quanh → mất tính nhất quán |

### Cách làm đúng
~~~yaml
spring:
  jpa:
    open-in-view: false
~~~
Sau đó phải sửa code cho đúng:
1. Dùng **DTO projection** cho API (chỉ lấy cần dùng) – không có lazy nào.
2. Dùng **fetch join / {{@EntityGraph}}** trong repository khi thực sự cần dữ liệu con.
3. Đặt {{@Transactional}} ở tầng service và **map sang DTO bên trong** transaction.
4. Bật {{spring.jpa.properties.hibernate.default_batch_fetch_size}} để giảm N+1.

### Pitfall production
- Tắt OSIV là thay đổi **hành vi**, không chỉ là config: nhiều chỗ truy cập lazy ngoài transaction sẽ nổ lên lúc chạy. Hãy bật cờ này ở môi trường test trước khi lên production.
- Nếu dùng view template (JPA + Thymeleaf), cách sạch là: fetch dữ liệu đủ trong query, rồi render – đừng để template tự kích hoạt lazy.
- Với entity có lazy {{@ManyToMany}}, {{toString}}/{{equals}} mặc định cũng có thể chạm proxy và gây lỗi hoặc query lạ.

> Senior tip: bật {{spring.jpa.open-in-view=false}} ngay từ đầu project, rồi thêm test tích hợp cho các API chính. Nếu team chưa sẵn sàng, hãy bật cờ này ở profile {{test}} để lộ lỗi sớm. Đây là một trong những thay đổi cấu hình có ROI cao nhất trong dự án Spring Boot: ít giữ connection hơn, lỗi rõ ràng hơn, hiệu năng ổn định hơn.`,
  follow: [
    'Vì sao {{@Transactional}} ở tầng service đôi khi không đủ để tránh {{LazyInitializationException}}?',
    'Tắt OSIV ảnh hưởng thế nào tới các template Thymeleaf?'
  ],
  tags: ['lazy loading', 'LazyInitializationException', 'open-in-view', 'OSIV']
},
{
  id: 'jpa-004',
  topic: 'jpa',
  level: 'lead',
  q: 'Optimistic locking ({{@Version}}) và pessimistic locking khác nhau thế nào? Xử lý {{OptimisticLockException}} như thế nào trong thực tế?',
  a: `**Tóm tắt:** **Optimistic** giả định xung đột hiếm: thêm cột {{version}}, mỗi lần {{UPDATE}} kèm điều kiện {{WHERE version = ?}}; nếu không có dòng nào được update thì Hibernate ném {{OptimisticLockException}}. **Pessimistic** khóa hàng ngay trong DB bằng {{SELECT ... FOR UPDATE}}, giữ khoá tới hết transaction – chắc chắn không xung đột nhưng giảm throughput và có nguy cơ deadlock.

### So sánh
| Tiêu chí | Optimistic ({{@Version}}) | Pessimistic ({{@Lock}}) |
|---|---|---|
| Cơ chế | So sánh version khi update | Khoá dòng trong DB |
| Xung đột | Phát hiện **sau** khi ghi | Chặn **trước** khi ghi |
| Hiệu năng | Tốt cho đọc nhiều, ghi ít | Giảm khi tranh chấp |
| Deadlock | Không | Có |
| Dùng cho | Profile, số dư, cấu hình, counter | Hàng sản xuất, kho hàng, tài khoản ngân hàng |

### Optimistic locking
~~~java
@Entity
public class Account {
    @Id private Long id;
    @Version private Long version;     // Hibernate tự tăng version mỗi lần update
    private BigDecimal balance;
}
~~~
Lệnh SQL sinh ra sẽ là:
~~~sql
UPDATE account SET balance = ?, version = ? WHERE id = ? AND version = ?
~~~
Nếu {{version}} trong DB đã khác (người khác vừa sửa), số dòng update = 0 → Hibernate ném {{OptimisticLockException}}. Spring Data JPA bọc lại thành {{ObjectOptimisticLockingFailureException}}.

### Xử lý xung đột
1. **Retry có backoff**: đọc lại trạng thái, tính toán lại, thử lại (giới hạn số lần, có jitter).
2. **Trả lỗi 409 Conflict** cho client nếu nghiệp vụ không chấp nhận retry.
3. **Đồng thời dùng optimistic + idempotency key** để tránh tạo giao dịch trùng.

~~~java
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
           maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2))
@Transactional
public void transfer(Long from, Long to, BigDecimal amount) { /* ... */ }
~~~

### Pessimistic locking
~~~java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@Query("select a from Account a where a.id = :id")
Optional<Account> findForUpdate(@Param("id") Long id);
~~~

### Pitfall production
- **Retry phải chạy trong transaction mới**: sau khi {{OptimisticLockException}}, transaction đã bị đánh dấu rollback; retry bên trong cùng transaction sẽ không ăn.
- Pessimistic lock giữ khoá cả khi bạn gọi HTTP service khác trong transaction → giữ lock lâu, tăng deadlock. Nên giữ transaction ngắn và không gọi I/O ngoài.
- Với nhiều bảng, thống nhất thứ tự khoá để tránh deadlock.
- Không dùng pessimistic lock cho truy vấn chỉ đọc – hãy dùng {{LockModeType.PESSIMISTIC_READ}} hoặc snapshot.

> Senior tip: chọn optimistic trước, vì nó rẻ hơn và không gây bottleneck. Chỉ chuyển sang pessimistic khi nghiệp vụ **bắt buộc** phải tuần tự hoá (ví dụ trừ tiền trong hệ thống thanh toán cũ, nơi business key là số tiền theo số dư chứ không phải version). Với ngân hàng, nguyên tắc là: đọc cân nhắc optimistic, ghi tranh chấp trên số dư thì cân nhắc pessimistic hoặc hàng đợi theo khóa tài khoản.`,
  follow: [
    'Tại sao retry {{OptimisticLockException}} phải dùng transaction mới?',
    'Làm thế nào để tránh deadlock khi dùng pessimistic lock trên nhiều bảng?'
  ],
  tags: ['optimistic locking', 'pessimistic locking', 'Version', 'OptimisticLockException']
},
{
  id: 'jpa-005',
  topic: 'jpa',
  level: 'senior',
  q: 'Tại sao {{GenerationType.IDENTITY}} lại vô hiệu hoá JDBC batching? Cách sinh id hiệu quả cho batch insert và batch update là gì?',
  a: `**Tóm tắt:** Với {{GenerationType.IDENTITY}}, cơ sở dữ liệu sinh id (identity/auto-increment) và **Hibernate phải lấy generated key ngay sau mỗi lần insert** để đặt vào entity → không thể gom lệnh thành batch, mỗi dòng là một round-trip. Muốn batching hiệu quả, phải **sinh id trước ở phía ứng dụng**: dùng {{SEQUENCE}} kèm **pooled optimizer** (PostgreSQL) hoặc {{TABLE}} generator (MySQL).

### Vì sao IDENTITY chặn batching
Luồng của Hibernate: gọi {{INSERT}} ngay cho từng entity để lấy {{@GeneratedValue}} → driver phải trả về key → phải làm round-trip. Batching yêu cầu gom nhiều {{INSERT}} rồi gửi **một** lần, nhưng Hibernate không biết id trước khi insert ⇒ không gom được.

### Cấu hình batching
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 50
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
~~~

### Sinh id trước bằng sequence
~~~java
@Entity
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
    @SequenceGenerator(name = "order_seq", sequenceName = "order_id_seq", allocationSize = 50)
    private Long id;
}
~~~
Với {{allocationSize = 50}}, Hibernate lấy **một lần 50 giá trị** từ sequence rồi cấp phát trong bộ nhớ (pooled optimizer) → gần như không còn round-trip cho sequence. Hibernate 6 dùng pooled optimizer cho {{@SequenceGenerator}} khi {{allocationSize > 1}}; có thể chọn biến thể ({{pooled}}/{{pooled-lo}}) bằng {{hibernate.id.optimizer.pooled.preferred}}. Lưu ý {{INCREMENT BY}} của sequence trong DB phải bằng {{allocationSize}}.

### Lựa chọn theo database
| Database | Nên dùng |
|---|---|
| PostgreSQL | {{SEQUENCE}} + pooled optimizer (sequence gọn, không lock) |
| MySQL | Không có sequence → {{TABLE}} generator (có contention) hoặc {{IDENTITY}} (chấp nhận không batch) |
| Cần id phân tán nhiều node | {{UUID}} – nhưng id random làm phân mảnh index |

### Batch update và {{@Version}}
Bản thân {{UPDATE}} với {{@Version}} cũng bị chia nhỏ nếu Hibernate không biết trước version → bật {{hibernate.jdbc.batch_versioned_data=true}} để gom được các {{UPDATE}} của cùng entity trong một batch.

### Pitfall production
- Batch chỉ có ý nghĩa nếu **cùng loại statement** được gom liền nhau → bật {{order_inserts}} và {{order_updates}} để Hibernate sắp xếp theo loại.
- Với batch lớn, hãy {{flush()}} + {{clear()}} định kỳ (ví dụ mỗi 50–100 entity) để persistence context không phình to và để cây transaction không giữ quá nhiều bộ nhớ.
- Đo trước/sau: số round-trip giảm từ N xuống N/50 là cải thiện rất lớn ở môi trường có độ trễ mạng.
- Dùng {{@GeneratedValue(strategy = GenerationType.AUTO)}}: Hibernate sẽ chọn sequence cho PostgreSQL nhưng có thể chọn identity cho MySQL – hãy chỉ định rõ chiến lược để tránh hành vi không mong muốn.

> Senior tip: batching là một trong những nút thắt hiệu năng bị bỏ quên nhiều nhất khi import dữ liệu lớn. Nếu bạn insert 100 nghìn dòng và thấy thời gian tăng tuyến tính, hãy kiểm tra ngay: {{batch_size}} có bật không, id có dùng {{IDENTITY}} không, và có {{flush/clear}} định kỳ không. Ba thứ đó thường giải quyết 90% vấn đề.`,
  follow: [
    'Tại sao {{@GeneratedValue(strategy = GenerationType.AUTO)}} có thể tạo hành vi khác nhau giữa PostgreSQL và MySQL?',
    'Vì sao cần {{flush}} và {{clear}} định kỳ khi batch insert với số lượng lớn?'
  ],
  tags: ['batch insert', 'IDENTITY', 'SEQUENCE', 'pooled optimizer', 'Hibernate']
},
{
  id: 'jpa-006',
  topic: 'jpa',
  level: 'senior',
  q: 'Trong mapping quan hệ JPA, owning side và inverse side khác nhau thế nào? {{orphanRemoval}} và {{cascade}} dùng khi nào, và nguy hiểm ra sao?',
  a: `**Tóm tắt:** Quan hệ 1-N và N-N đều có **owning side** (phía giữ khóa ngoại hoặc bảng join) và **inverse side** (phía {{mappedBy}}). Chỉ thay đổi ở owning side mới được Hibernate nhận ra và sinh SQL. {{orphanRemoval = true}} dùng để xóa con khi nó bị gỡ khỏi collection; {{cascade}} quyết định hành động nào được nhân bản xuống entity liên kết – và {{cascade = REMOVE}} là nguồn mất dữ liệu kinh điển.

### Owning side và inverse side
~~~java
@Entity
public class Order {                       // inverse side (có mappedBy)
    @Id private Long id;
    @OneToMany(mappedBy = "order", cascade = CascadeType.PERSIST)
    private List<Item> items = new ArrayList<>();
}

@Entity
public class Item {                        // owning side: giữ khóa ngoại order_id
    @Id private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;
}
~~~
- Sửa {{item.setOrder(order)}} (owning side) → Hibernate ghi {{order_id}} của item ({{INSERT}}/{{UPDATE item SET order_id = ?}}).
- Chỉ {{order.getItems().add(item)}} (inverse side) mà không set {{item.order}} → **khóa ngoại không được ghi**, Hibernate bỏ qua thay đổi từ phía inverse. Vì vậy nên viết helper {{addItem()}} cập nhật **cả hai phía**.
- Quan hệ N-N mặc định sinh bảng join; khi cần thuộc tính riêng trên quan hệ (số lượng, giá tại thời điểm đặt), hãy dùng **join entity** có ý nghĩa nghiệp vụ thay vì bảng join thuần.

### orphanRemoval
~~~java
@OneToMany(mappedBy = "order", orphanRemoval = true)
private List<Item> items;
~~~
Khi {{order.getItems().remove(item)}}, Hibernate gọi {{DELETE}} cho {{item}}. Khai báo ở phía cha ({{@OneToMany}} – thường là phía {{mappedBy}}) hoặc {{@OneToOne}}; **không có cho {{@ManyToMany}}**.

### Cascade
| Cascade | Ý nghĩa | Rủi ro |
|---|---|---|
| {{PERSIST}} | Lưu cha thì lưu con | Nên dùng cho aggregate root |
| {{REMOVE}} | Xóa cha thì xóa con | **Nguy hiểm**: xóa hàng loạt là mất dữ liệu |
| {{MERGE}}, {{REFRESH}}, {{DETACH}} | Đồng bộ trạng thái | Thường an toàn |
| {{ALL}} | Gộp tất cả | Không nên dùng mặc định |

### Pitfall production
- {{cascade = REMOVE}} kết hợp với việc xóa entity cha ở nghiệp vụ "hủy đơn" sẽ **xoá luôn các bản ghi con tham chiếu ở module khác** nếu quan hệ được map. Nhiều sự cố mất dữ liệu trong hệ thống thực tế đến từ đây.
- Bật {{cascade = ALL}} trên {{@ManyToMany}} có thể gây {{StackOverflow}} khi đối tượng tham chiếu lẫn nhau.
- Xóa bằng {{entityManager.remove()}} sẽ xóa con theo cascade; nếu chỉ muốn "bỏ liên kết", dùng {{orphanRemoval}} và gỡ khỏi collection.
- Quan hệ đệ quy (parent-child tự tham chiếu) với cascade có thể gây lỗi khi xóa cả nhánh.

> Senior tip: hãy dùng **aggregate root** làm ranh giới nhất quán: đối tượng con chỉ được tạo/sửa/xoá thông qua cha. Khi đó {{cascade = PERSIST}} trên cha là hợp lý, còn {{REMOVE}} nên được thay bằng {{orphanRemoval}} cùng quy tắc nghiệp vụ rõ ràng. Nếu một entity bị tham chiếu từ nhiều nơi, nó **không nên** nằm trong cascade graph của bất kỳ bean nào.`,
  follow: [
    'Khi nào nên dùng {{orphanRemoval}} thay vì {{cascade = REMOVE}}?',
    'Vì sao nên dùng join entity thay vì {{@ManyToMany}} thuần?'
  ],
  tags: ['owning side', 'mappedBy', 'orphanRemoval', 'cascade', 'mapping']
},
{
  id: 'jpa-007',
  topic: 'jpa',
  level: 'senior',
  q: 'First-level cache và second-level cache của Hibernate khác nhau ra sao? Khi nào đáng bật second-level cache?',
  a: `**Tóm tắt:** **First-level cache** chính là persistence context – tồn tại trong phạm vi một transaction/session, luôn bật, không cấu hình. **Second-level cache** là cache của Hibernate ở cấp SessionFactory (phạm vi toàn ứng dụng, có thể chia sẻ nhiều instance), phải bật cấu hình và gắn cache cho từng entity. Ngoài ra còn có **Spring Cache** ({{@Cacheable}}) ở tầng service – một abstraction khác, thường dễ dùng hơn L2.

### So sánh
| Đặc điểm | L1 | L2 |
|---|---|---|
| Phạm vi | 1 session / transaction | SessionFactory (toàn app, có thể chung cluster) |
| Bật mặc định | Có | Không – phải cấu hình |
| Cấu hình | – | {{hibernate.cache.use_second_level_cache}} + region factory |
| Gắn cho entity | Tự động | {{@Cacheable}} trên class entity |
| Tự invalidate | Khi update entity trong cùng session | Khi update entity qua cùng SessionFactory |
| Hợp với dữ liệu bị ghi từ nhiều nơi | – | **Không** – dễ đọc dữ liệu cũ |

### Bật L2
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          region:
            factory_class: jcache     # hibernate-jcache + provider JCache (Ehcache 3, Caffeine jcache...)
        javax:
          cache:
            provider: org.ehcache.jsr107.EhcacheCachingProvider
~~~
~~~java
@Entity
@Cacheable
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
@Table(name = "products")
public class Product { /* ... */ }
~~~

### Spring Cache – lựa chọn thực tế thường dùng hơn
~~~java
@EnableCaching
@Service
public class ProductService {
    @Cacheable(value = "products", key = "#id")
    public Product findById(Long id) { return repo.findById(id).orElseThrow(); }

    @CacheEvict(value = "products", key = "#product.id")
    @Transactional
    public void update(Product product) { repo.save(product); }
}
~~~
Ưu điểm: cache ở tầng service, có thể cache **cả kết quả DTO**, dễ kiểm soát TTL và key, và tương thích với nhiều backend (Caffeine, Redis).

### Khi nào nên bật L2
- Dữ liệu **đọc nhiều, ghi ít**, thay đổi hiếm (danh mục, cấu hình, tham số).
- Nhiều instance ứng dụng cùng đọc một nguồn dữ liệu và có thể chia sẻ cache (Redis/Hazelcast) để giảm tải DB.
- Bảng có tuổi thọ dài, không nhạy cảm (không chứa dữ liệu cá nhân).

### Khi nào **không** nên bật
- Dữ liệu bị ghi từ **nhiều hệ thống khác** (ETL, script SQL, service khác không dùng Hibernate) → cache sẽ phục vụ dữ liệu cũ.
- Dữ liệu nhạy cảm, thay đổi liên tục (số dư, trạng thái đơn hàng).
- Đội ngũ không kiểm soát được vòng đời invalidation → lỗi rất khó truy.

### Pitfall production
- L2 dùng chung region cho nhiều entity → cache không có key phân biệt rõ; luôn dùng region riêng cho entity đặc biệt.
- {{@Cacheable}} trên method trả về entity có **quan hệ lazy** → cache lưu cả proxy, khi đọc lại có thể lỗi hoặc rò rỉ session. Nên cache DTO.
- Cache không tự hết hạn theo thời gian trong L2 mặc định → dữ liệu có thể "đóng băng" nhiều giờ. Hãy cấu hình TTL cho Spring Cache.

> Senior tip: trước khi bật bất kỳ tầng cache nào, hãy trả lời được ba câu: **(1) dữ liệu này có thể bị ghi bởi hệ thống khác không? (2) dữ liệu cũ bao lâu thì chấp nhận được? (3) khi có sự cố, ai invalidates và bằng cách nào?** Nếu không trả lời được câu 3, hãy chưa bật cache – bạn sẽ tạo ra sự cố dữ liệu khó hơn nhiều lần so với việc chậm thêm vài mili giây.`,
  follow: [
    'L2 cache được invalidate như thế nào khi entity được update?',
    'Khi nào nên dùng Spring Cache thay vì Hibernate second-level cache?'
  ],
  tags: ['first-level cache', 'second-level cache', 'Caffeine', 'Spring Cache']
},
{
  id: 'jpa-008',
  topic: 'jpa',
  level: 'lead',
  q: 'Khi nào bạn nên bỏ JPA để dùng JDBC template, jOOQ hoặc native query? Rủi ro khi trộn JPA và SQL thủ công là gì?',
  a: `**Tóm tắt:** JPA thắng ở CRUD theo domain model và tránh viết SQL, nhưng yếu ở query phức tạp (nhiều tầng aggregation, window function, CTE đệ quy) và ở việc kiểm soát hiệu năng tuyệt đối. Khi cần SQL kiểm soát tuyệt đối, hãy dùng **jOOQ** (type-safe, sinh code từ schema) cho query phức tạp và **JdbcTemplate** cho batch/streaming, còn giữ JPA cho phần CRUD.

### Khi nào nên rời khỏi JPA
| Tình huống | Công cụ nên dùng |
|---|---|
| Báo cáo, dashboard tổng hợp nhiều bảng | jOOQ hoặc JDBC template |
| Query phân tích, window function, CTE đệ quy | jOOQ (Hibernate 6 hỗ trợ nhưng API rườm rà) |
| Import/insert hàng triệu dòng | JDBC template + batch |
| Đọc dữ liệu lớn theo dòng (streaming) | JDBC template + {{ResultSet}} fetchSize |
| Truy vấn đơn giản, chuẩn CRUD | JPA vẫn là lựa chọn tốt |

### jOOQ – gợi ý cách dùng
~~~java
// SQL được sinh ra từ schema (code-gen), không có string SQL thủ công
List<CustomerDTO> rows = ctx.select(
        CUSTOMER.ID, CUSTOMER.NAME, ORDER.AMOUNT.sum())
    .from(CUSTOMER)
    .leftJoin(ORDER).on(ORDER.CUSTOMER_ID.eq(CUSTOMER.ID))
    .groupBy(CUSTOMER.ID, CUSTOMER.NAME)
    .fetchInto(CustomerDTO.class);
~~~
jOOQ cho type-safety (compile-time kiểm tra tên cột), hỗ trợ tốt window function/CTE, và vẫn chạy trên JDBC thông thường.

### JdbcTemplate cho bulk
~~~java
jdbcTemplate.batchUpdate(
    "insert into order_item(order_id, sku, qty) values (?, ?, ?)",
    items, 1000, (ps, it) -> {
        ps.setLong(1, it.orderId());
        ps.setString(2, it.sku());
        ps.setInt(3, it.qty());
    });
~~~

### Rủi ro khi trộn JPA và SQL thủ công
1. **Auto-flush không luôn kích hoạt**: Hibernate flush trước JPQL query, nhưng **native query / JDBC** không chắc chắn được flush ⇒ bạn có thể đọc ra dữ liệu cũ trong cùng transaction. Gọi {{entityManager.flush()}} trước khi cần dữ liệu vừa sửa.
2. **Hai nguồn mapping cho cùng bảng**: entity và DTO tự viết sẽ trôi lệch theo thời gian.
3. **Transaction boundary phải chung**: dùng {{@Transactional}} của Spring cho cả hai, nếu không sẽ mất tính nhất quán.
4. **Hibernate có thể ghi đè thay đổi của bạn**: nếu bạn sửa bằng native query rồi Hibernate flush entity cũ ở commit → mất dữ liệu.
5. **Lock và deadlock khó kiểm soát** khi trộn hai kiểu truy cập trong cùng transaction.

### Pitfall production
- Đừng dùng native query {{select *}} rồi map thủ công vào entity – hãy map ra DTO.
- Với batch lớn, nhớ chia lô và commit theo lô để tránh transaction quá dài và undo log phình to.
- Đo trước/sau bằng {{EXPLAIN ANALYZE}}; đừng đoán.

> Senior tip: có một câu hỏi hay trong phỏng vấn: "Ở dự án của bạn, có bao giờ phải bỏ JPA không – và vì sao?". Câu trả lời tốt là bạn biết rõ **ranh giới**: JPA cho aggregate và CRUD, SQL/jOOQ cho truy vấn đọc phức tạp, và bạn đã kiểm soát được vấn đề flush khi trộn hai thế giới. Trộn mù là nơi phát sinh bug "đọc được dữ liệu cũ" khó tìm nhất.`,
  follow: [
    'Vì sao Hibernate không tự flush trước khi chạy native query?',
    'jOOQ khác JPA Criteria API ở điểm nào về an toàn compile-time?'
  ],
  tags: ['jOOQ', 'JdbcTemplate', 'native query', 'flush', 'performance']
},
{
  id: 'jpa-009',
  topic: 'jpa',
  level: 'mid',
  q: 'Entity JPA cần {{equals}} và {{hashCode}} như thế nào? Vì sao dùng Lombok {{@Data}} cho entity là rủi ro?',
  a: `**Tóm tắt:** Entity thường nằm trong {{HashSet}}/{{HashMap}} (collection của quan hệ, cache tự viết) → cần {{equals}}/{{hashCode}} **ổn định suốt vòng đời**. Dùng {{getId()}} là rủi ro vì id {{null}} trước khi persist và có thể đổi; nên dùng **business key** (mã nghiệp vụ bất biến) hoặc trả về hằng số theo class. Lombok {{@Data}} sinh {{equals}} theo **mọi field**, kể cả collection lazy → gây N+1, vòng lặp và lỗi logic.

### Vì sao phải cẩn thận
- Trước khi persist, {{id}} là {{null}} ⇒ entity có thể "mất" khỏi {{HashSet}} sau khi persist (id được gán) → {{contains()}} trả false, {{remove()}} không hoạt động.
- Nếu {{id}} được gán lại (vd merge entity từ DTO), hash code thay đổi ⇒ mất khả năng tra cứu trong map.
- {{equals}} theo collection sẽ **kích hoạt lazy loading** mỗi lần so sánh: vừa tốn query, vừa có thể ném {{LazyInitializationException}}.

### Cách làm đúng
~~~java
@Entity
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "customer_code", nullable = false, unique = true)
    private String code;          // business key, bất biến

    @Override public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof Customer other)) return false;
        return code != null && code.equals(other.code);
    }

    @Override public int hashCode() { return Objects.hash(code); }
}
~~~

### Với Lombok
~~~java
@Entity
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "code")     // chỉ so sánh business key
@ToString(exclude = {"items"})       // tránh vòng lặp parent <-> child
public class Customer { /* ... */ }
~~~
- Tốt hơn nữa: để Lombok **không** sinh {{equals}}/{{hashCode}} cho entity, hoặc dùng {{@Entity}} + record? (Record không phải lựa chọn mặc định cho entity vì cần entity mutable và proxyable.)
- Luôn kiểm tra **thuộc tính định danh phải là {{@Id}}** và không final.

### Pitfall production
- {{@ToString}} mặc định của Lombok in toàn bộ field, gồm cả collection và quan hệ ngược (cha – con – cha…) ⇒ **stack overflow** khi log, hoặc log khổng lồ và tự gọi query.
- {{@Data}} còn sinh {{@RequiredArgsConstructor}} và {{@Getter/@Setter}} cho mọi field – với JPA, non-arg constructor là bắt buộc, nên dùng {{@NoArgsConstructor}} + {{@AllArgsConstructor(access = AccessLevel.PROTECTED)}} thay vì {{@Data}}.
- Nếu dùng {{@Data}} trên entity có {{@OneToMany}}, {{equals}} sẽ gọi {{List.equals}} → so sánh từng phần tử → kích hoạt lazy → rất tệ.

> Senior tip: quy tắc đơn giản cho team: **entity dùng {{@Getter}} + {{@Setter}}, không dùng {{@Data}}**; {{equals}}/{{hashCode}} dựa trên business key nếu có, nếu không thì để Hibernate quản lý (identity) và tuyệt đối không đặt entity vào {{HashSet}} dựa trên {{equals}} tùy ý. Đồng thời luôn để {{@ToString}} chỉ in id và vài field an toàn.`,
  follow: [
    'Vì sao Hibernate khuyến nghị không override {{equals}}/{{hashCode}} theo quan hệ?',
    'Lombok {{@Data}} sinh những gì có thể gây lỗi cho JPA entity?'
  ],
  tags: ['equals', 'hashCode', 'Lombok', 'entity', 'Data']
},
{
  id: 'db-001',
  topic: 'db',
  level: 'senior',
  q: 'B-tree index hoạt động thế nào? Composite index và covering index khác nhau ra sao, và những trường hợp index không được dùng?',
  a: `**Tóm tắt:** Index B-tree là cấu trúc cân bằng giúp tìm dòng khớp trong O(log n) thay vì full scan O(n), đổi lại mỗi lần {{INSERT}}/{{UPDATE}}/{{DELETE}} phải cập nhật cây. **Composite index** chỉ dùng được theo **leftmost prefix** (cột đầu tiên phải xuất hiện trong điều kiện lọc), và **covering index** cho phép đọc chỉ từ index (index-only scan) nên không cần chạm vào bảng.

### Cấu trúc B-tree
Các node lá chứa key + pointer tới hàng, được liên kết thành **danh sách nối** theo thứ tự key. Nhờ vậy cả truy vấn **range** ({{WHERE ts BETWEEN ...}}) cũng hiệu quả. B-tree giữ node lá ở cùng độ sâu, tối ưu cho đĩa (ít lần đọc block) – đây là lý do MySQL/InnoDB dùng B+tree thay vì B-tree "chuẩn".

### Composite index và leftmost prefix
Với index {{(a, b, c)}}:
| Truy vấn | Dùng được index? |
|---|---|
| {{WHERE a = 1}} | Có (dùng cột a) |
| {{WHERE a = 1 AND b = 2}} | Có (dùng a, b) |
| {{WHERE b = 2}} | **Thường không** – thiếu cột a (ngoại lệ: skip scan của MySQL 8.0.13+ / PostgreSQL 18 khi a có ít giá trị) |
| {{WHERE a = 1 AND c = 3}} | Seek theo a; c chỉ được lọc trong index (không seek được vì thiếu b) |
| {{ORDER BY a, b}} | Có, không cần sort |

Nguyên tắc thiết kế: cột đứng đầu phải là cột **hay được lọc bằng** và có **selectivity cao**; các cột sau là cột lọc/sort theo thứ tự truy vấn.

### Covering index
Index chứa đủ cột mà query cần ⇒ DB chỉ đọc index, không đọc bảng (index-only scan). Ở PostgreSQL 11+ dùng {{INCLUDE (col)}}; ở MySQL/InnoDB, index gồm cả cột phụ cũng tạo covering index (secondary index đã chứa PK).

~~~sql
CREATE INDEX idx_order_cust_date ON orders (customer_id, created_at) INCLUDE (amount);
-- SELECT customer_id, created_at, amount ... -> đọc được từ index
~~~

### Khi nào index **không** được dùng
1. **Hàm bao quanh cột**: {{WHERE DATE(created_at) = '2026-01-01'}} → dùng index trên {{created_at}} không được; giải pháp: viết lại thành range ({{created_at >= '2026-01-01' AND created_at < '2026-01-02'}}) hoặc tạo index trên biểu thức.
2. **Leading wildcard**: {{WHERE name LIKE '%abc'}} → không dùng được B-tree.
3. **{{OR}} không có index bao phủ** toàn bộ nhánh.
4. **Selectivity thấp**: cột có 2–3 giá trị (vd {{status}}) → index ít giá trị, optimizer thường chọn seq scan.
5. **Sai kiểu dữ liệu**: so sánh cột {{varchar}} với số → index bị bỏ qua (ép kiểu ngược lại).
6. **Thống kê lệch** (stale statistics) → optimizer ước tính sai và chọn sai plan; chạy {{ANALYZE}}.
7. **Cột ít phân biệt ở đầu composite index** → không đạt leftmost prefix.
8. **Bảng nhỏ** (vài nghìn dòng) → seq scan rẻ hơn.

### Pitfall production
- **Quá nhiều index làm chậm ghi**: mỗi {{INSERT}}/{{UPDATE}} phải cập nhật mọi index của bảng. Index thừa còn làm tăng kích thước backup và thời gian vacuum.
- Index trên cột có **cardinality thấp** ở vị trí đầu gần như vô dụng.
- Index dùng bởi query cũ không còn chạy vẫn tốn tài nguyên → cần review và drop định kỳ.
- Với UUID làm PK, thứ tự ghi ngẫu nhiên gây phân mảnh trang; dùng UUIDv7 hoặc khóa tăng dần.

> Senior tip: trước khi thêm index, hãy **đo** bằng {{EXPLAIN (ANALYZE, BUFFERS)}} trên chính dữ liệu production-like. Một index thừa không chỉ tốn disk mà còn làm {{UPDATE}} chậm hơn đáng kể trên bảng giao dịch lớn. Nguyên tắc: index là đánh đổi, mỗi index cần một lý do đo được.`,
  follow: [
    'Vì sao index trên cột {{status}} (chỉ vài giá trị) thường không được optimizer dùng?',
    'Covering index hoạt động thế nào ở MySQL/InnoDB so với PostgreSQL?'
  ],
  tags: ['index', 'B-tree', 'composite index', 'covering index', 'EXPLAIN']
},
{
  id: 'db-002',
  topic: 'db',
  level: 'senior',
  q: 'Các mức isolation level của SQL ngăn chặn những hiện tượng nào (dirty read, non-repeatable read, phantom)? MVCC của PostgreSQL và MySQL InnoDB khác nhau ra sao?',
  a: `**Tóm tắt:** Bốn mức isolation chuẩn tăng dần: {{READ UNCOMMITTED}} → {{READ COMMITTED}} → {{REPEATABLE READ}} → {{SERIALIZABLE}}. Mỗi mức chặn thêm một hiện tượng. **PostgreSQL** mặc định {{READ COMMITTED}} và theo MVCC "statement-level"; **MySQL InnoDB** mặc định {{REPEATABLE READ}} và theo MVCC "transaction-level" (read view giữ suốt transaction).

### Bốn mức isolation và hiện tượng
| Mức | Dirty read | Non-repeatable read | Phantom read |
|---|---|---|---|
| READ UNCOMMITTED | Có | Có | Có |
| READ COMMITTED | Không | Có | Có |
| REPEATABLE READ | Không | Không | Có (theo SQL chuẩn) |
| SERIALIZABLE | Không | Không | Không |

- **Dirty read**: đọc được dữ liệu chưa commit của transaction khác.
- **Non-repeatable read**: đọc cùng một dòng hai lần trong transaction nhưng giá trị khác nhau (do người khác đã commit sửa).
- **Phantom read**: một lần {{SELECT}} thấy 5 dòng, lần sau thấy 6 dòng (do có thêm dòng mới khớp điều kiện).

### MVCC là gì
Thay vì khoá cả bảng khi đọc, MVCC giữ **nhiều phiên bản** của mỗi dòng. Mỗi transaction nhìn thấy một ảnh chụp (snapshot) nhất quán → đọc không chặn ghi, ghi không chặn đọc. Cơ chế: version chain + {{xmin}}/{{xmax}} (PostgreSQL) hoặc undo log (InnoDB).

### PostgreSQL
- Mặc định **READ COMMITTED**: mỗi **statement** lấy snapshot mới ⇒ hai lần {{SELECT}} cùng câu trong cùng transaction có thể thấy dữ liệu khác nhau.
- **REPEATABLE READ** trong PostgreSQL = snapshot isolation cố định cho cả transaction: ngăn dirty read, non-repeatable read và **cả phantom read** (chặt hơn SQL chuẩn yêu cầu). Cái nó **không** chặn là **write skew** (serialization anomaly) – chỉ SERIALIZABLE mới chặn. Nếu ghi vào dòng đã bị transaction khác sửa và commit, PostgreSQL báo {{could not serialize access due to concurrent update}}.
- Ở mức SERIALIZABLE, PostgreSQL dùng SSI (serializable snapshot isolation) và có thể báo lỗi {{could not serialize access}} → client phải retry.

### MySQL InnoDB
- Mặc định **REPEATABLE READ**: read view được tạo ở câu lệnh đầu tiên và giữ tới hết transaction ⇒ cùng một câu {{SELECT}} trong transaction luôn trả cùng kết quả.
- Ở RR, InnoDB chặn phantom cho các lệnh {{UPDATE}}/{{DELETE}} bằng **gap lock** và next-key lock – đây là nguồn gốc nhiều deadlock.

### Pitfall production
- Ở PostgreSQL READ COMMITTED, câu {{UPDATE ... WHERE status = 'PENDING'}} có thể **không cập nhật dòng nào** nếu đối tác đã đổi status trước đó (đọc-modify-ghi không an toàn). Hãy thêm điều kiện trạng thái vào {{WHERE}} và kiểm tra số dòng đã update.
- Đọc số dư rồi trừ ở mức READ COMMITTED là race condition kinh điển → dùng {{SELECT ... FOR UPDATE}} hoặc optimistic lock.
- Ở mức isolation cao, hiệu năng giảm (nhiều lock, nhiều conflict) và deadlock tăng.
- Chọn isolation không cứu được lỗi logic: luôn thiết kế constraint ở tầng database (unique, check, foreign key) là lớp phòng thủ cuối.

> Senior tip: luôn đặt **isolation level rõ ràng** trong cấu hình ứng dụng thay vì để mặc định của DB, vì mặc định khác nhau giữa PostgreSQL và MySQL – cùng một code chạy được trên cả hai nhưng hành vi khác nhau. Kèm theo đó, hãy chuẩn bị cơ chế **retry với backoff + jitter** cho lỗi serialization/deadlock: đây là giải pháp chuẩn của cả PostgreSQL lẫn CockroachDB cho các tranh chấp hiếm.`,
  follow: [
    'Vì sao REPEATABLE READ của PostgreSQL không có phantom nhưng vẫn có write skew?',
    'Write skew xảy ra như thế nào và cách xử lý ra sao?'
  ],
  tags: ['isolation level', 'MVCC', 'dirty read', 'phantom', 'snapshot']
},
{
  id: 'db-003',
  topic: 'db',
  level: 'mid',
  q: 'Đọc {{EXPLAIN ANALYZE}} và tối ưu một query chậm theo quy trình nào? Những dấu hiệu nào trong execution plan chỉ ra nguyên nhân?',
  a: `**Tóm tắt:** {{EXPLAIN}} chỉ cho plan **dự kiến**; {{EXPLAIN ANALYZE}} chạy query thật và trả về plan **thực tế** kèm thời gian từng node. Quy trình tối ưu đúng là: **đo baseline → đọc plan → tìm node tốn kém → giải thích bằng index/thống kê/dữ liệu → sửa → đo lại**, lặp lại. Dấu hiệu quan trọng nhất: **số dòng ước tính lệch mạnh với số dòng thực tế**.

### Lệnh đọc plan
~~~sql
-- PostgreSQL
EXPLAIN (ANALYZE, BUFFERS, VERBOSE) SELECT ...;

-- MySQL 8.0.18+
EXPLAIN ANALYZE SELECT ...;
EXPLAIN FORMAT=JSON SELECT ...;
~~~

### Các dấu hiệu đáng chú ý
| Dấu hiệu | Nguyên nhân thường gặp |
|---|---|
| Seq Scan trên bảng lớn | Thiếu index, hoặc selectivity thấp |
| Rows Removed by Filter lớn | Lọc quá nhiều dòng – index không phù hợp |
| Estimated rows khác thực tế gấp 10 lần | **Statistics lỗi thời** → chạy {{ANALYZE}} |
| Nested Loop với inner bị quét nhiều lần | Thiếu index ở vế inner, hoặc join sai thứ tự |
| Sort: external merge (disk) | Thiếu index theo thứ tự {{ORDER BY}}, hoặc {{work_mem}} quá nhỏ |
| Rows Removed by Join Filter | Filter đặt sai chỗ trong join |
| Buffer reads cao | Truy vấn quét nhiều trang, thiếu index hoặc index không được cover |

### Quy trình tối ưu
1. **Đo trước**: thời gian thực tế, số dòng trả về, số lần gọi, {{EXPLAIN (ANALYZE)}}.
2. **Xác định phần tốn kém**: nhìn từ node gốc xuống, tìm node có thời gian lớn nhất, đừng dừng ở node đầu.
3. **Tìm nguyên nhân**: thiếu index? thống kê lỗi? join sai? dữ liệu phân bố lệch? câu query viết sai?
4. **Sửa**: thêm index phù hợp, viết lại query, đổi cấu trúc bảng, giảm dữ liệu quét.
5. **Đo lại** và so sánh; lặp lại nếu chưa đạt.

### Pitfall production
- Chạy {{EXPLAIN ANALYZE}} trên query {{UPDATE}}/{{DELETE}} **thật** sẽ thực thi thay đổi → hãy bọc trong {{BEGIN}} + {{ROLLBACK}}.
- Đừng tối ưu theo "đẹp của plan" mà theo **số liệu thực tế**; một plan trông lạ lùng vẫn có thể nhanh hơn.
- Index thêm mà không được dùng vẫn làm chậm ghi.
- Kiểm tra **parameter sniffing**: plan tốt với một bộ tham số có thể rất tệ với bộ khác (PostgreSQL dùng generic plan sau 5 lần, MySQL có {{optimizer_switch}}).
- Với truy vấn chạy theo lịch, hãy lưu lại plan theo thời gian để phát hiện **plan regression** sau khi deploy.

> Senior tip: hãy lưu {{EXPLAIN ANALYZE}} của các query quan trọng vào CI hoặc theo dõi bằng {{pg_stat_statements}} / {{auto_explain}} để **phát hiện plan regression trước khi lên production**. Một thay đổi nhỏ về index hoặc thống kê có thể làm query chậm gấp 100 lần mà không đổi một dòng code.`,
  follow: [
    'Sự khác biệt giữa plan dự kiến và plan thực tế nói lên điều gì?',
    'Tại sao {{EXPLAIN ANALYZE}} trên câu {{UPDATE}} rất nguy hiểm?'
  ],
  tags: ['EXPLAIN', 'query optimization', 'execution plan', 'index', 'statistics']
},
{
  id: 'db-004',
  topic: 'db',
  level: 'senior',
  q: 'Deadlock trong database do nguyên nhân gì và xử lý ra sao? Bạn sẽ làm gì khi gặp lỗi deadlock trong production?',
  a: `**Tóm tắt:** Deadlock xảy ra khi hai transaction mỗi transaction giữ một lock mà transaction kia cần, tạo thành vòng chờ. Database phát hiện vòng này (InnoDB kiểm tra ngay khi một lock phải chờ nếu {{innodb_deadlock_detect=ON}}; PostgreSQL kiểm tra sau {{deadlock_timeout}}, mặc định 1s) và **rollback một transaction** (victim) để giải phóng tài nguyên; transaction còn lại tiếp tục. Client nhận lỗi và **phải retry** – đây là hành vi bình thường, không phải sự cố hệ thống.

### Khi nào deadlock xảy ra
1. **Thứ tự khoá khác nhau**: transaction A khoá bảng 1 rồi bảng 2, transaction B khoá bảng 2 rồi bảng 1.
2. **Thiếu index**: {{WHERE status = 'X'}} không có index ⇒ DB quét và khoá nhiều dòng hơn cần thiết ⇒ vùng khoá chồng nhau.
3. **Transaction giữ lâu**: gọi HTTP service, đọc file, hoặc xử lý nặng **bên trong** transaction.
4. **Isolation level thấp + nhiều transaction** cùng tranh chấp một tập bản ghi.
5. **Bảng lớn, cập nhật hàng loạt theo thứ tự không xác định**.

### Xử lý trong code
~~~java
@Transactional
public void transfer(Long from, Long to, BigDecimal amount) {
    // luôn khoá theo cùng thứ tự (theo id) để tránh vòng chờ
    Account a = accountRepo.findByIdForUpdate(min(from, to)).orElseThrow();
    Account b = accountRepo.findByIdForUpdate(max(from, to)).orElseThrow();
    a.debit(amount);
    b.credit(amount);
}
~~~

- **Retry với backoff + jitter**: sau deadlock, transaction đã rollback → phải **bắt đầu transaction mới** rồi chạy lại. Spring Retry hoặc vòng {{try-catch}} với backoff ngẫu nhiên.
- **Transaction phải ngắn**: không gọi HTTP/SDK bên ngoài, không xử lý file trong transaction.
- **Luôn có index** cho mọi điều kiện lọc liên quan tới khoá ⇒ giảm số dòng bị khoá.
- **Thống nhất thứ tự khoá** giữa các luồng ghi (ví dụ luôn theo id tăng dần).
- Với hàng đợi job: {{SELECT ... FOR UPDATE SKIP LOCKED}} để worker không chờ nhau.

### Nhận biết trong log
- PostgreSQL: lỗi {{deadlock detected}} với SQLSTATE **40P01**.
- MySQL: lỗi **1213** ({{Deadlock found when trying to get lock}}).
- Cả hai thuộc SQLSTATE class **40** (transaction rollback): PostgreSQL deadlock là **40P01**, serialization failure ({{REPEATABLE READ}}/{{SERIALIZABLE}}) là **40001**; MySQL 1213 trả SQLSTATE **40001**. Vì vậy logic retry thường bắt chung class 40 (Spring dịch thành {{PessimisticLockingFailureException}}/{{CannotAcquireLockException}}).

### Pitfall production
- **Retry sai cách**: retry lại trong cùng transaction đã rollback là vô nghĩa – phải tạo transaction mới.
- Retry không có **jitter** sẽ khiến nhiều client cùng retry đúng một thời điểm và tái tạo deadlock.
- Deadlock do một đoạn code "xấu" sẽ tái diễn liên tục: hãy **cảnh báo theo tỉ lệ** chứ không chỉ log, và điều tra khi tỉ lệ tăng.
- PostgreSQL ghi chi tiết deadlock vào server log ({{pg_stat_database.deadlocks}} chỉ là bộ đếm); MySQL xem {{SHOW ENGINE INNODB STATUS}} (mục LATEST DETECTED DEADLOCK) hoặc bật {{innodb_print_all_deadlocks}} để xác định câu query nào gây deadlock.

> Senior tip: deadlock **không phải là bug của DB** – nó là hệ quả của việc nhiều transaction cùng tranh chấp tài nguyên theo thứ tự khác nhau. Hãy xem nó như tín hiệu về thiết kế giao dịch: transaction của bạn đang làm quá nhiều việc, đang khoá theo thứ tự không ổn định, hoặc đang quét bảng không có index. Mục tiêu là giảm **tần suất** deadlock, không phải chỉ "bắt và retry".`,
  follow: [
    'Vì sao phải retry bằng transaction mới sau khi gặp deadlock?',
    'Làm thế nào để tránh deadlock khi cập nhật nhiều bảng liên quan?'
  ],
  tags: ['deadlock', 'lock', 'retry', 'transaction', '40001']
},
{
  id: 'db-005',
  topic: 'db',
  level: 'mid',
  q: 'Phân trang bằng {{OFFSET}} và bằng keyset (seek) khác nhau thế nào? Với bảng hàng chuỗi triệu dòng, bạn chọn cách nào?',
  a: `**Tóm tắt:** {{OFFSET n}} bắt DB phải **đọc và bỏ qua n dòng** trước ⇒ trang càng sâu càng chậm (tổng chi phí O(n²) nếu người dùng lướt hết các trang). **Keyset (seek) pagination** dùng điều kiện trên cột sort: {{WHERE (created_at, id) < (:lastCreatedAt, :lastId)}} kèm {{LIMIT}} ⇒ index range scan, thời gian gần như **hằng** bất kể trang bao nhiêu.

### So sánh
| Cách | Truy vấn | Độ sâu trang | Ghi chú |
|---|---|---|---|
| Offset | {{LIMIT 20 OFFSET 100000}} | Chậm dần | DB phải đọc 100020 dòng rồi bỏ 100000 |
| Keyset | {{WHERE id < :lastId ORDER BY id LIMIT 20}} | Hằng | Chỉ đọc vùng index cần dùng |

### Cách làm keyset pagination
~~~java
// Spring Data JPA repository
@Query("select o from Order o " +
       "where o.createdAt < :t or (o.createdAt = :t and o.id < :id) " +
       "order by o.createdAt desc, o.id desc")
List<Order> findNext(@Param("t") Instant lastCreatedAt,
                     @Param("id") Long lastId,
                     Pageable page);   // gọi với PageRequest.of(0, 20): chỉ LIMIT, không OFFSET

// cần index khớp thứ tự sort: (created_at DESC, id DESC)
~~~

### Điều kiện quan trọng
1. Cột sort phải **lập chỉ mục** và thứ tự index phải khớp thứ tự sort.
2. Cần một **cột phá thế hoàn hảo** (tie-breaker) như {{id}} – nếu không, các dòng có cùng {{created_at}} có thể bị bỏ sót hoặc lặp lại.
3. Phải truyền cursor (giá trị {{created_at}} + {{id}} của dòng cuối) về client dưới dạng token mã hoá.
4. Truy vấn phải **ổn định về thứ tự** – thêm {{id}} vào {{ORDER BY}} để chắc chắn.

### Đánh đổi của keyset
- Không hỗ trợ "nhảy tới trang 50" (jump to page) – phải lần lượt đi từ cursor.
- Đếm tổng số bản ghi ({{COUNT}}) cũng tốn khi bảng lớn; cần cache số đếm hoặc bỏ hẳn.
- Người dùng muốn sắp xếp theo cột khác sẽ phá vỡ cursor ⇒ thường giới hạn các kiểu sắp xếp được hỗ trợ.

### Khi nào vẫn dùng OFFSET
- Bảng nhỏ, vài nghìn dòng (offset không tốn nhiều).
- Cần "trang N" ngẫu nhiên hoặc cần hiển thị tổng số trang.
- Xuất báo cáo cố định theo lô, chạy định kỳ ngoài giờ cao điểm.

> Senior tip: với danh sách "xem thêm" (infinite scroll) – feed, danh sách đơn hàng – keyset là lựa chọn mặc định vì người dùng thực tế chỉ đi tới vài trang đầu, đúng nơi offset tốn kém nhất. Với bảng hàng trăm triệu dòng, chuyển từ offset sang keyset thường giảm thời gian response từ hàng giây xuống dưới 50ms, miễn là có index khớp với cột sort + tie-breaker.`,
  follow: [
    'Tại sao cần cột tie-breaker như {{id}} khi phân trang bằng keyset?',
    'Làm thế nào lưu cursor an toàn khi client có thể sửa/thao túng giá trị?'
  ],
  tags: ['pagination', 'offset', 'keyset', 'cursor', 'performance']
},
{
  id: 'db-006',
  topic: 'db',
  level: 'lead',
  q: 'Replication, partitioning và sharding khác nhau thế nào? Bạn chọn shard key bằng cách nào, và những vấn đề nào sẽ phát sinh?',
  a: `**Tóm tắt:** **Replication** nhân bản dữ liệu để đọc scale/tính sẵn sàng (một primary ghi, nhiều replica đọc) – giải quyết tải đọc, **không** giải quyết tải ghi. **Partitioning** chia một bảng lớn thành nhiều phân vùng **trong cùng** instance – giúp quản lý và bảo trì, không scale ngang. **Sharding** chia dữ liệu ra nhiều **instance** độc lập – scale được cả tải ghi, nhưng đổi lại là độ phức tạp vận hành.

### So sánh
| Tiêu chí | Replication | Partitioning | Sharding |
|---|---|---|---|
| Phạm vi | Nhiều bản sao dữ liệu | Nhiều phân vùng trong 1 DB | Nhiều DB độc lập |
| Giải quyết | Tải đọc, HA | Quản lý bảng lớn, vacuum/drop nhanh | Tải ghi và đọc, mở rộng dung lượng |
| Truy vấn xuyên đơn vị | Dễ (đọc replica) | Dễ nếu có partition key | Khó (scatter-gather) |
| Transaction | Đơn vị gốc | Đơn vị gốc | Cần Saga/2PC |
| Join | Đơn vị gốc | Đơn vị gốc | Khó, thường phải denormalize |

### Partitioning
PostgreSQL hỗ trợ declarative partitioning (range/list/hash) – truy vấn có điều kiện trên cột partition sẽ được **partition pruning** (chỉ quét các partition liên quan). Lợi ích lớn nhất: bảng lịch sử khổng lồ được chia theo tháng ⇒ xóa dữ liệu cũ bằng {{DROP PARTITION}} thay vì {{DELETE}} hàng triệu dòng. MySQL 8 cũng có partitioning RANGE/LIST/HASH/KEY và partition pruning, nhưng ràng buộc chặt hơn: mọi unique key (kể cả PK) phải chứa cột partition và bảng partition không hỗ trợ foreign key. (PostgreSQL cũng yêu cầu unique constraint chứa partition key.)

### Chọn shard key
Tiêu chí theo thứ tự ưu tiên:
1. **Phần lớn truy vấn phải chứa shard key** – tránh scatter-gather trải rộng.
2. **Cân bằng tải**: số dòng và tần suất ghi phải đều giữa các shard.
3. **Tăng trưởng đều** – shard theo thời gian tạo ra "shard mới rỗng" và skew theo thời gian.
4. **Tránh hot shard**: một khách hàng lớn, một sản phẩm viral hay tạo điểm nóng.

Ví dụ thực tế: sharding theo {{tenant_id}} hoặc {{customer_id}} cho hệ thống multi-tenant; sharding theo {{order_id}} (theo hash range) cho bảng giao dịch vốn không có truy vấn theo khách hàng.

### Vấn đề phải giải quyết khi shard
- **Tính nhất quán chéo shard**: dùng Saga (chuỗi bù lỗi) thay vì 2PC; chấp nhận eventual consistency.
- **Truy vấn toàn cục**: đưa dữ liệu vào search engine/OLAP hoặc thiết kế đọc từ bản sao read-only.
- **Phân bổ lại (resharding)**: cần double-write, backfill rồi chuyển traffic.
- **ID toàn cục duy nhất**: snowflake, UUIDv7, hay cấp dải id từ trung tâm.
- **Truy vấn đếm tổng số** rất tốn khi phải fan-out.

### Pitfall production
- Chọn shard key theo "dễ chia" mà bỏ qua truy vấn thực tế là nguyên nhân phổ biến nhất khiến hệ thống shard phải viết lại.
- **Resharding** giữa lúc traffic cao là dự án riêng, cần kế hoạch và công cụ (double-write + backfill + cutover).
- Read replica có **replication lag**: đọc ngay sau khi ghi có thể không thấy dữ liệu ⇒ dùng "read-your-writes" bằng cách đọc primary hoặc sticky routing.
- Sharding không tự động tăng hiệu năng nếu truy vấn phải fan-out.

> Senior tip: trước khi shard, hãy cân nhắc theo thứ tự: **tối ưu index và query → đọc từ replica → partition → cache → cuối cùng mới shard**. Sharding là quyết định gần như không đảo ngược: nó ảnh hưởng mọi truy vấn, mọi transaction và cả tổ chức. Với hệ thống ngân hàng, sharding theo **chi nhánh/tenant** thường khớp với ranh giới nghiệp vụ và giải quyết cả yêu cầu pháp lý về dữ liệu địa phương.`,
  follow: [
    'Vì sao replication lag gây vấn đề "đọc không thấy dữ liệu vừa ghi"?',
    'So sánh Saga và 2PC khi thiết kế transaction xuyên nhiều shard?'
  ],
  tags: ['replication', 'partitioning', 'sharding', 'shard key', 'scalability']
},
{
  id: 'db-007',
  topic: 'db',
  level: 'mid',
  q: 'Connection pool HikariCP: sizing thế nào, các timeout quan trọng ra sao, và làm sao phát hiện connection bị rò rỉ (leak detection)?',
  a: `**Tóm tắt:** HikariCP là pool mặc định của Spring Boot. Nguyên tắc sizing: **số connection của một ứng dụng không được vượt quá khả năng phục vụ của DB**; tổng connection của toàn hệ thống phải nhỏ hơn {{max_connections}} của DB. Quy tắc thực tế: pool mỗi instance khoảng **10–20**, và **nhỏ hơn nhiều** nếu dùng virtual threads.

### Cấu hình tham khảo
~~~yaml
spring:
  datasource:
    hikari:
      pool-name: app-pool
      maximum-pool-size: 15
      minimum-idle: 5
      connection-timeout: 3000      # ms - chờ tối đa bao lâu để có connection
      max-lifetime: 1800000         # 30 phút - đóng connection cũ trước khi DB ngắt
      idle-timeout: 600000
      leak-detection-threshold: 60000
      validation-timeout: 5000
~~~

### Ý nghĩa từng tham số
- {{maximum-pool-size}}: trần số connection mở cùng lúc. Vượt quá ⇒ DB tranh chấp CPU/I/O và latency tăng; quá nhỏ ⇒ request phải chờ.
- {{connection-timeout}}: thời gian chờ lấy connection. **Quá dài** ⇒ request treo (giữ cả connection downstream); **quá ngắn** ⇒ lỗi hàng loạt "Connection is not available, request timed out".
- {{max-lifetime}}: nên nhỏ hơn thời gian idle timeout của DB/firewall để tránh dùng connection đã bị đóng từ phía server.
- {{leak-detection-threshold}}: nếu một connection bị giữ **quá lâu** (ví dụ > 60s), Hikari log stack trace của nơi đã lấy connection. Đây là công cụ **phát hiện rò rỉ** quan trọng nhất.

### Cách sizing
1. Xem {{max_connections}} của DB và số instance ứng dụng: {{maximum-pool-size × số instance}} (tính cả lúc rolling deploy/autoscale tối đa) phải nhỏ hơn {{max_connections}} (thường để lại ~20% cho admin, replication, công cụ).
2. Tính theo **số core CPU của DB**: DB chỉ thực sự chạy song song khoảng bằng số core; công thức tham khảo của HikariCP: pool ~ (số core của DB × 2) + số disk hiệu dụng.
3. Bắt đầu với 10–20 rồi **đo**: thời gian chờ (pool wait time), tỉ lệ timeout, throughput của DB.

### Pitfall production
- **Rò rỉ connection**: giữ connection lâu khi gọi HTTP service bên ngoài trong transaction, hoặc quên đóng stream/ResultSet. Hãy bật {{leak-detection-threshold}} trong production (nhiều app để tắt vì log nhiễu – nhưng đó là đánh đổi sai).
- **Transaction giữ connection suốt thời gian xử lý** ⇒ pool cạn khi tải tăng. Rút ngắn transaction, tách phần không cần DB ra ngoài.
- **Pool quá lớn** khiến DB chậm: nhiều connection đồng thời chỉ làm tăng contention, không tăng throughput.
- Với **virtual threads**, số thread có thể rất lớn nhưng connection vẫn là tài nguyên hữu hạn ⇒ đặt pool nhỏ (thường 5–10) và theo dõi {{hikaricp.connections.pending}}.
- Nhiều ứng dụng nhỏ dùng chung một DB ⇒ cân nhắc **PgBouncer** (transaction pooling) thay vì mở rộng pool.

> Senior tip: metric quan trọng nhất của connection pool là **thời gian chờ** và **số connection đang chờ (pending)**. Nếu pending > 0 thường xuyên, đừng tăng pool ngay – hãy tìm query chậm giữ transaction mở, vì tăng pool chỉ biến tắc nghẽn từ app xuống DB. Còn nếu DB CPU không vượt 50% mà vẫn chậm, lúc đó mới cân nhắc tăng pool.`,
  follow: [
    'Làm thế nào phát hiện connection bị rò rỉ trong production?',
    'Tại sao virtual threads không nên đi kèm connection pool lớn?'
  ],
  tags: ['HikariCP', 'connection pool', 'timeout', 'leak detection']
},
{
  id: 'db-008',
  topic: 'db',
  level: 'lead',
  q: 'Thay đổi schema trên bảng hàng trăm triệu dòng mà không gây downtime thế nào? So sánh expand/contract với Flyway và Liquibase.',
  a: `**Tóm tắt:** Nguyên tắc là **expand/contract** (mở rộng trước, thu hẹp sau) để mọi phiên bản ứng dụng đang chạy đều hoạt động đúng trong suốt quá trình triển khai. Quy trình: (1) **Expand** – thêm cột mới **nullable** hoặc có default không tốn kém; (2) **Backfill** dữ liệu theo lô nhỏ; (3) **Migrate** – code đọc/ghi cả cột cũ và cột mới; (4) **Contract** – xoá cột cũ ở một bản phát hành sau, khi không còn phiên bản cũ nào chạy.

### Ví dụ: đổi tên cột {{status}} thành {{order_status}}
~~~sql
-- 1. Expand: thêm cột mới, KHÔNG có NOT NULL (để tránh rewrite bảng)
ALTER TABLE orders ADD COLUMN order_status varchar(32);

-- 2. Backfill theo lô, mỗi lô vài nghìn dòng, có điều kiện để chạy lại được
UPDATE orders SET order_status = status
WHERE id BETWEEN :from AND :to AND order_status IS NULL;

-- 3. Đồng bộ: trigger hoặc dual-write trong app trong giai đoạn chuyển tiếp
-- 4. Contract (bản phát hành sau, khi app cũ đã hết):
ALTER TABLE orders DROP COLUMN status;
~~~

### Mẹo tránh khóa lâu trên bảng lớn
- **PostgreSQL 11+**: {{ADD COLUMN ... DEFAULT}} không còn rewrite toàn bảng (chỉ ghi giá trị default vào metadata, đọc sau thì mới materialize) – có thể dùng default an toàn.
- **Tạo index**: {{CREATE INDEX CONCURRENTLY}} (PostgreSQL) chạy lâu nhưng **không khóa ghi**; bắt buộc chạy ngoài transaction. MySQL 8 dùng online DDL: {{ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE}}.
- **Backfill theo lô** + giới hạn tốc độ để không chiếm I/O và không làm replication lag tăng.
- **Không dùng {{NOT NULL}} ngay** khi thêm cột trên bảng lớn: cần thêm nullable, backfill, rồi mới set NOT NULL (thao tác này cũng cần quét bảng – hãy kiểm tra chi phí trước).

### Flyway vs Liquibase
| Tiêu chí | Flyway | Liquibase |
|---|---|---|
| Định dạng | File SQL thuần trong resources | XML/YAML/JSON/SQL |
| Kiểm soát | Bản vá (patch) theo phiên bản | Snapshot/changelog có thể tính checksum |
| Rollback | Thủ công viết script rollback | Có khái niệm rollback declarative |
| Hợp với | Quy trình review SQL rõ ràng | Nhiều môi trường, nhiều biến thể schema |
| Điểm mạnh | Đơn giản, dễ review, dễ đọc diff | Quản lý được môi trường phức tạp |

Cả hai đều chạy **trước khi app khởi động** (hoặc qua init container / migration job tách riêng cho production).

### Pitfall production
- **Deploy rolling nhiều instance**: lúc này **đồng thời** tồn tại app cũ và app mới ⇒ schema phải tương thích cả hai. Đây là lý do không được xoá cột ngay trong bản phát hành đầu tiên.
- Thêm cột {{NOT NULL}} có default trên MySQL bản cũ sẽ **copy toàn bảng** và khóa lâu.
- Trigger tạm thời để đồng bộ 2 cột có thể giảm hiệu năng ghi đáng kể – nhớ gỡ trigger ở bước contract.
- Với bảng cực lớn, hãy cân nhắc công cụ chuyên dụng: {{gh-ost}}, {{pt-online-schema-change}}, Vitess.

> Senior tip: hãy coi **migration script là code** và cần review như code: không được chạy trực tiếp lên production, phải có bản chạy thử trên dữ liệu giống hệt production và đo thời gian. Với bảng hàng trăm triệu dòng, chênh lệch giữa "chạy 2 phút trên staging 1 triệu dòng" và "chạy 6 tiếng trên production" là chuyện thường ngày. Ngoài ra, luôn chuẩn bị kế hoạch **rollback** dựa trên việc code cũ vẫn chạy được với schema mới.`,
  follow: [
    'Tại sao thêm cột NOT NULL DEFAULT có thể khóa bảng lâu trên MySQL?',
    'Khi nào cần dùng {{CREATE INDEX CONCURRENTLY}} và rủi ro của nó là gì?'
  ],
  tags: ['schema migration', 'zero downtime', 'expand contract', 'Flyway', 'Liquibase']
},
{
  id: 'db-009',
  topic: 'db',
  level: 'senior',
  q: 'SQL và NoSQL chọn thế nào? Với Redis, MongoDB, Cassandra và Elasticsearch, mỗi loại phù hợp với bài toán gì?',
  a: `**Tóm tắt:** SQL (PostgreSQL/MySQL/Oracle) thắng ở **tính nhất quán, transaction, join và schema rõ ràng**; NoSQL thắng ở **khả năng scale ngang, schema linh hoạt và độ trễ thấp** cho các mô hình truy cận đặc thù. Câu hỏi đúng không phải "SQL hay NoSQL" mà là: **mô hình dữ liệu, mô hình truy vấn và yêu cầu nhất quán của bài toán là gì?**

### Khi nào chọn SQL
- Dữ liệu có quan hệ rõ ràng, cần transaction nhiều bảng (chuyển tiền, đơn hàng + kho).
- Cần truy vấn ad-hoc, báo cáo tổng hợp, join nhiều bảng.
- Yêu cầu ACID là bắt buộc.
- Quy mô vừa đủ để một instance (và replica) gánh.

### Từng loại NoSQL
| Hệ thống | Mô hình | Phù hợp với | Cảnh báo |
|---|---|---|---|
| **Redis** | Key-value trong bộ nhớ | Cache, session, rate limit, hàng đợi, khóa phân tán | Dữ liệu trong RAM, cần eviction policy; không nên là nguồn dữ liệu duy nhất |
| **MongoDB** | Document JSON | Dữ liệu phân cấp, catalog, event log, schema thay đổi liên tục | Document tối đa 16MB; embed quá sâu gây phình dữ liệu |
| **Cassandra** | Wide-column, partition key | Write-heavy, multi-region, luôn sẵn sàng, dữ liệu chuỗi thời gian | Truy vấn phải có partition key; không có ad-hoc query; consistency tunable |
| **Elasticsearch** | Inverted index | Full-text search, gợi ý, tìm kiếm gần thời gian thực, aggregation | Là hệ thống **phái sinh** từ DB (near-real-time, dữ liệu trùng lặp) |

### Mô hình thực tế phổ biến
Hệ thống thường **kết hợp**: PostgreSQL là nguồn dữ liệu chuẩn (system of record), Redis cache đọc nhiều, Elasticsearch phục vụ tìm kiếm, Kafka để đồng bộ và giảm tải ghi. Mỗi bước sao chép đều tạo ra độ trễ và khả năng lệch dữ liệu – cần nói rõ với stakeholder.

### Cách trả lời trong phỏng vấn
Hãy đi từ **ràng buộc đo được**:
1. Yêu cầu nhất quán: cần transaction chéo nhiều bảng không?
2. Mô hình truy vấn: truy vấn theo khóa, theo phạm vi, hay full-text?
3. Quy mô và tốc độ ghi: bao nhiêu read/s và write/s?
4. Yêu cầu pháp lý: dữ liệu phải ở vùng nào, có cần xoá/ẩn danh (GDPR)?
5. Vận hành: ai chịu trách nhiệm backup, failover, monitoring?

### Pitfall production
- Dùng Redis làm nguồn dữ liệu duy nhất khi chưa cấu hình persistence ⇒ mất dữ liệu khi restart.
- Cassandra mà truy vấn không có partition key ⇒ quét toàn bảng, cực kỳ tốn kém.
- Elasticsearch đồng bộ bằng CDC có độ trễ vài giây – đừng dùng nó làm nguồn quyết định.
- Đưa dữ liệu vào nhiều hệ thống mà không có quy trình đồng bộ là nguồn gốc của bất nhất quán dữ liệu kinh điển.
- "Không có SQL" là một loại fanatism: hầu hết hệ thống thành công dùng cả hai theo đúng vai trò.

> Senior tip: đừng trả lời "chúng tôi dùng PostgreSQL vì nó mạnh". Câu trả lời mạnh là: "chúng tôi chọn PostgreSQL vì nghiệp vụ cần transaction chéo bảng và join; phần tìm kiếm toàn văn tách sang Elasticsearch để không ảnh hưởng write latency; Redis chỉ cache những gì chịu được việc mất để rebuild". Mỗi lựa chọn đều gắn với một ràng buộc cụ thể – đó là tư duy của kỹ sư 4–8 năm.`,
  follow: [
    'Vì sao Elasticsearch không nên là nguồn dữ liệu chuẩn?',
    'Khi nào NoSQL "ngon hơn" SQL cho hệ thống multi-tenant?'
  ],
  tags: ['NoSQL', 'Redis', 'MongoDB', 'Cassandra', 'Elasticsearch']
},
{
  id: 'db-010',
  topic: 'db',
  level: 'senior',
  q: 'Dùng {{SELECT ... FOR UPDATE SKIP LOCKED}} để làm hàng đợi job trong database thế nào, và những điểm nào cần lưu ý?',
  a: `**Tóm tắt:** {{FOR UPDATE SKIP LOCKED}} cho phép nhiều worker **lấy job khác nhau song song** mà không chờ nhau: worker A khoá dòng job 1, worker B thấy dòng đó bị khoá nên **bỏ qua** và lấy dòng tiếp theo. Đây là cách làm job queue đơn giản, không cần broker, và tận dụng chính transaction của DB để đảm bảo tính nhất quán.

### Câu SQL lấy job
~~~sql
WITH picked AS (
    SELECT id
    FROM jobs
    WHERE status = 'PENDING' AND run_at <= now()
    ORDER BY run_at
    LIMIT 10
    FOR UPDATE SKIP LOCKED
)
UPDATE jobs
SET status = 'RUNNING', locked_at = now(), attempts = attempts + 1
WHERE id IN (SELECT id FROM picked)
RETURNING id, payload;
~~~
Cách chạy:
1. Mở transaction, chạy câu trên (khoá dòng được chọn).
2. **Commit ngay** để giải phóng khoá – không giữ transaction khi xử lý job.
3. Xử lý job **ngoài** transaction.
4. Cập nhật trạng thái sang {{DONE}} (hoặc {{FAILED}} + retry) trong transaction riêng.

### Vì sao phải commit ngay
Với {{SKIP LOCKED}}, worker khác không bị chặn mà chỉ bỏ qua các dòng đang khoá. Vấn đề của việc giữ transaction mở trong lúc xử lý job (ví dụ gọi API ngoài) là: mỗi worker ôm một DB connection suốt thời gian xử lý (pool cạn), transaction dài cản VACUUM dọn dead tuple (bảng job phình, query lấy job chậm dần), và các lệnh cần lock dòng đó (huỷ job, admin update) phải chờ. Nguyên tắc: **khoá ngắn, xử lý ngoài transaction** – trạng thái {{RUNNING}} + {{locked_at}} đóng vai trò "lease".

### Những điểm phải lưu ý
- **At-least-once, không phải exactly-once**: worker có thể chết sau khi commit lấy job nhưng trước khi xử lý xong ⇒ job phải **idempotent**.
- **Thu hồi job chết**: cột {{locked_at}} + một job định kỳ quét các job {{RUNNING}} quá hạn để trả lại {{PENDING}}.
- **Cần index đúng**: {{(status, run_at)}} để việc lấy job không quét toàn bảng.
- **Giới hạn số job lấy mỗi lần** (ví dụ 10–50) để không giữ quá nhiều lock và transaction không bị kéo dài.
- **Tính cạnh tranh**: dùng {{FOR UPDATE SKIP LOCKED}} cần DB hỗ trợ (PostgreSQL 9.5+, MySQL 8.0+, Oracle; SQL Server không có cú pháp này mà dùng hint {{WITH (READPAST, UPDLOCK, ROWLOCK)}}). Câu SQL mẫu ở trên là cú pháp PostgreSQL ({{UPDATE ... RETURNING}} không có trên MySQL). Đọc {{FOR UPDATE}} thuần (không {{SKIP LOCKED}}) sẽ khiến worker thứ hai **chờ** → giảm throughput.

### Khi nào nên dùng và khi nào không
| Dùng | Không dùng |
|---|---|
| Lưu lượng vừa phải, cần đảm bảo giao dịch với DB | Tải rất lớn, cần độ trễ thấp và phân phối rộng |
| Muốn giảm hạ tầng (không thêm broker) | Cần retry phức tạp, dead-letter, routing theo key |
| Job gắn với transaction nghiệp vụ | Xử lý job lâu (hàng giờ) |

Khi tải lớn, hãy chuyển sang Kafka/RabbitMQ/SQS: độ trễ thấp hơn, có sẵn cơ chế retry và dead-letter.

### Pitfall production
- Quên cơ chế thu hồi job ⇒ sau một sự cố, các job bị kẹt ở trạng thái {{RUNNING}} **mãi mãi**.
- Worker "chết" giữa chừng cũng xảy ra với mọi hệ thống queue; hãy thiết kế job idempotent và có timeout.
- Giữ transaction mở trong khi xử lý job ⇒ giảm throughput và tăng deadlock.
- Query lấy job phải dùng **index** phù hợp, nếu không sẽ quét toàn bảng mỗi vòng poll.

> Senior tip: {{SKIP LOCKED}} là ví dụ đẹp của việc "dùng đúng nguyên lý của hệ quản trị cơ sở dữ liệu thay vì dựng thêm hạ tầng". Trước khi chọn, hãy hỏi: lưu lượng job có đủ lớn để cần broker không, và đội ngũ có chịu vận hành thêm RabbitMQ/Kafka không? Nếu câu trả lời là "chưa cần", hãy bắt đầu với DB – và thiết kế API để sau này đổi sang broker mà không phải viết lại nghiệp vụ.`,
  follow: [
    'Tại sao phải commit ngay sau khi lấy job thay vì xử lý job trong cùng transaction?',
    'Làm thế nào thu hồi job bị kẹt do worker chết?'
  ],
  tags: ['SKIP LOCKED', 'job queue', 'FOR UPDATE', 'concurrency', 'PostgreSQL']
},
{
  id: 'db-011',
  topic: 'db',
  level: 'lead',
  q: 'So sánh Oracle và PostgreSQL: những khác biệt nào dev Java cần biết, đặc biệt khi làm việc với hệ thống dùng Oracle (rất phổ biến tại ngân hàng Việt Nam)?',
  a: `**Tóm tắt:** Cả hai đều là RDBMS mạnh với transaction, partition và optimizer tốt. Khác biệt quan trọng nhất với dev Java: **sequence và cách sinh id**, **xử lý chuỗi rỗng và NULL**, **cú pháp phân trang và hàm ngày**, **driver và cách đọc execution plan**. Nhiều hệ thống ngân hàng VN chạy Oracle, nên hiểu khác biệt này giúp bạn đọc code cũ và debug nhanh hơn nhiều.

### Bảng so sánh
| Tiêu chí | Oracle | PostgreSQL |
|---|---|---|
| Sequence | Object riêng, có {{CACHE}}, {{NOORDER}}/{{CYCLE}}; có {{IDENTITY}} từ 12c | Sequence cũng là object riêng (có thể {{OWNED BY}} một cột), có {{CACHE}}; {{serial}}/{{identity}} |
| Chuỗi rỗng | **{{''}} được coi là NULL** | Phân biệt {{''}} và NULL |
| Phân trang | {{OFFSET ... FETCH NEXT}} (12c+), {{ROWNUM}} cho bản cũ | {{LIMIT/OFFSET}}, keyset cursor |
| Kiểu ngày | {{DATE}} có cả giờ; {{TIMESTAMP}} | {{TIMESTAMP}}, {{TIMESTAMPTZ}} |
| Kiểu số | {{NUMBER}} | {{NUMERIC}}, {{BIGINT}}, {{SERIAL}} |
| JSON | {{JSON}} (12c+) | {{JSONB}} – rất mạnh, index được |
| UUID | {{RAW(16)}} / {{SYS_GUID()}} | {{UUID}} native, {{gen_random_uuid()}} |
| Truy vấn execution plan | {{DBMS_XPLAN}}, adaptive plan (12c), SQL Plan Baselines | {{EXPLAIN (ANALYZE, BUFFERS)}}, {{auto_explain}} |
| PL/SQL | PL/SQL (riêng, mạnh) | PL/pgSQL |
| Đọc consistency | MVCC dựa trên undo; mặc định READ COMMITTED (snapshot theo statement), có SERIALIZABLE; không có dirty read | MVCC theo version dòng ({{xmin}}/{{xmax}}); mặc định READ COMMITTED, có REPEATABLE READ/SERIALIZABLE |
| Driver JDBC | {{ojdbc11}} (JDK 11+), {{ojdbc17}} cho JDK 17 | {{org.postgresql:postgresql}} |
| Phân vùng | Range/list/hash, partition exchange, reference partitioning | Declarative partitioning, declarative sharding (Citus) |

### Những khác biệt "gây bug" nếu không biết
1. **Chuỗi rỗng**: trên Oracle, insert {{''}} vào cột {{VARCHAR2}} biến thành NULL. Code Java so sánh {{"".equals(value)}} cho kết quả khác giữa hai DB.
2. **Phân trang**: {{LIMIT 20 OFFSET 100}} là cú pháp PostgreSQL/MySQL; Oracle dùng {{OFFSET 100 ROWS FETCH NEXT 20 ROWS ONLY}}. Cùng một native query không chạy được trên cả hai.
3. **Ngày**: Oracle {{SYSDATE}} trả thời gian hệ thống theo timezone của server; PostgreSQL nên dùng {{now()}} (theo timezone session). Với {{TIMESTAMPTZ}}, PostgreSQL lưu UTC và hiển thị theo timezone của session – hành vi này gần với Oracle hơn là với {{TIMESTAMP}}.
4. **So sánh null**: cả hai đều dùng {{IS NULL}}; {{NOT IN}} với một giá trị NULL trong tập kết quả sẽ trả về **không dòng nào** (cả hai DB đều vậy – đây là lỗi kinh điển).
5. **Identifier**: Oracle ghi tên cột không phân biệt hoa thường (đọc là chữ hoa); cần quote khi dùng tên nhạy cảm.
6. **Hàm ngày cộng**: Oracle {{date + 1}} = thêm 1 ngày; PostgreSQL cần {{date + interval '1 day'}}.
7. **Nối chuỗi với NULL**: Oracle {{||}} bỏ qua NULL ({{'abc' || NULL}} = {{'abc'}}), còn PostgreSQL {{'abc' || NULL}} = NULL – muốn bỏ qua NULL trên PostgreSQL dùng {{concat()}} hoặc {{coalesce}}. Query port từ Oracle sang hay bị NULL bất ngờ ở chỗ này.

### Về vận hành và chi phí
- **Oracle** có hệ sinh thái enterprise mạnh (RAC, Data Guard, GoldenGate), nhưng **chi phí license cao** và vận hành phức tạp; nhiều tính năng cần license riêng.
- **PostgreSQL** miễn phí, mã nguồn mở, HA thường dùng Patroni + streaming replication; JSONB, partitioning declarative và extension (PostGIS, pgvector) là lợi thế lớn.
- Nhiều tổ chức chọn PostgreSQL vì chi phí và độ linh hoạt, giữ Oracle cho hệ thống nghiệp vụ lõi đã có nhiều năm.

### Pitfall production
- Cùng một câu SQL viết cho một DB sẽ hỏng khi chuyển sang DB khác → giữ SQL trong **file migration riêng theo dialect** và có integration test chạy trên cả hai nếu hệ thống cần portability.
- Chuyển schema từ Oracle sang PostgreSQL: cần map kiểu dữ liệu, sequence, index, và **constraint đặc thù Oracle** (virtual column, function-based index).
- Đọc execution plan: Oracle dùng {{V$SQL}} + {{DBMS_XPLAN}}; PostgreSQL dùng {{pg_stat_statements}} – hai bộ công cụ hoàn toàn khác nhau.
- Cẩn thận với {{NUMBER}} không có scale của Oracle: so sánh số tiền dạng số thực có thể sai số ở ranh giới.

> Senior tip: ở môi trường ngân hàng VN, câu hỏi "bạn từng làm việc với Oracle chưa, khác biệt gì so với PostgreSQL?" xuất hiện rất thường xuyên. Câu trả lời tốt là nhắc 2–3 khác biệt **có tác động thật** (chuỗi rỗng bị coi là NULL, cú pháp phân trang, cách sinh id bằng sequence và {{CACHE}} khiến gap trong id) và nói rõ bạn đã xử lý nó thế nào trong code. Nhớ kiểm tra câu lệnh SQL của hệ thống cũ: rất nhiều câu dùng {{NVL}}, {{SYSDATE}}, {{ROWNUM}} – đó là dấu hiệu rõ của Oracle.`,
  follow: [
    'Vì sao chuỗi rỗng bị coi là NULL trên Oracle lại gây bug, và ảnh hưởng thế nào tới code Java?',
    'Khi chuyển hệ thống từ Oracle sang PostgreSQL, những gì cần kiểm tra?'
  ],
  tags: ['Oracle', 'PostgreSQL', 'sequence', 'JDBC', 'compatibility']
},
{
  id: 'spring-016',
  topic: 'spring',
  level: 'senior',
  q: 'Sau khi đơn hàng được commit, hệ thống cần gửi email xác nhận và cộng điểm thưởng. Bạn dùng {{@EventListener}} và {{@TransactionalEventListener}} khác nhau thế nào? Vì sao event có thể bị mất khi service crash, và khi nào bắt buộc phải dùng outbox pattern?',
  a: `**Tóm tắt:** Spring event là cơ chế **in-process, đồng bộ, không bền vững**. {{@EventListener}} chạy **trước khi commit** nên side effect có thể đã xảy ra rồi transaction mới rollback; {{@TransactionalEventListener(phase = AFTER_COMMIT)}} được đăng ký như callback của transaction nên chỉ chạy **sau khi commit thành công**, bị bỏ qua nếu rollback. Cả hai đều **không bền vững** – process chết giữa chừng thì event mất, nên side effect có giá trị tiền phải dùng **transactional outbox**.

### So sánh hai kiểu listener
| Tiêu chí | {{@EventListener}} | {{@TransactionalEventListener}} |
|---|---|---|
| Thời điểm chạy | Ngay lúc publish, trong transaction hiện tại | Theo phase: BEFORE_COMMIT, AFTER_COMMIT, AFTER_ROLLBACK, AFTER_COMPLETION |
| Transaction | Chạy chung transaction đang mở | BEFORE_COMMIT vẫn trong transaction; AFTER_* thì transaction đã commit, muốn ghi DB phải mở transaction mới ({{REQUIRES_NEW}}) |
| Khi tx rollback | Đã chạy rồi, side effect sai | **Không chạy** với phase AFTER_COMMIT |
| Publish ngoài transaction | Chạy bình thường | **Không chạy** trừ khi bật {{fallbackExecution = true}} |

### Vì sao event bị mất khi crash
1. **Không có persistence**: event chỉ tồn tại trong RAM của một instance. Pod bị kill, OOM hay deploy giữa chừng là mất vĩnh viễn.
2. **Listener chạy đồng bộ trong request thread**: làm việc nặng sẽ kéo dài request, và nếu process chết đúng lúc đó thì event mất.
3. **Rollback chủ đích**: phase AFTER_COMMIT bỏ qua event khi transaction rollback.
4. **Không broadcast**: trong hệ thống nhiều instance, event chỉ được xử lý bởi instance nhận request.

Cơ chế bên trong: {{@TransactionalEventListener}} không tự đăng ký listener toàn cục. Khi event được publish trong một transaction đang chạy, Spring tạo một {{TransactionSynchronization}} và đăng ký vào {{TransactionSynchronizationManager}}; khi commit xong, framework gọi {{afterCommit()}} rồi listener mới chạy.

### Outbox pattern: khi nào bắt buộc
Ghi event vào **bảng outbox trong cùng transaction** với dữ liệu nghiệp vụ, nên "có dữ liệu thì chắc chắn có event". Một job đọc outbox (thường dùng {{FOR UPDATE SKIP LOCKED}}) rồi publish sang Kafka hoặc RabbitMQ.

~~~java
@Component
@RequiredArgsConstructor
public class OrderMailListener {

    private final MailSender mail;
    private final OrderRepository orderRepo;

    // chỉ chạy sau khi transaction commit thành công
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW) // transaction riêng để đọc DB
    public void on(OrderCreated event) {
        // truyền id qua event rồi load lại, tránh dùng entity có thể stale
        Order order = orderRepo.findById(event.orderId()).orElseThrow();
        mail.send(order.getEmail(), "Xac nhan don " + order.getId());
    }
}
~~~

### Pitfall production
- {{fallbackExecution}} mặc định là {{false}}. Publish event ngoài transaction (ví dụ trong {{@Scheduled}} job) thì listener **không chạy và không có cảnh báo** – lỗi âm thầm rất dễ gặp.
- Với AFTER_COMMIT, transaction gốc **đã commit** nhưng resource vẫn còn gắn với thread ⇒ đọc DB vẫn được, còn **ghi DB sẽ không được commit** (mất âm thầm) nếu không dùng {{REQUIRES_NEW}}. Từ Spring 6.1, đặt {{@Transactional}} mặc định (REQUIRED) lên listener này còn bị báo lỗi lúc khởi động.
- Đừng truyền entity trong event: sau commit nó có thể đã detached hoặc mang dữ liệu cũ. Truyền **id** rồi load lại.
- Nhiều listener cùng xử lý một event: thứ tự do {{@Order}} quyết định, listener không nên phụ thuộc thứ tự của nhau.

> Senior tip: quy tắc cho team – event dùng cho việc phụ **không quyết định kết quả nghiệp vụ**, outbox dùng cho việc phụ **có hậu quả với khách hàng hoặc tiền**. Đã dùng outbox thì phải đo độ trễ end-to-end (ghi xong đến lúc consumer xử lý xong) và coi như một SLO, vì không có visibility thì outbox chỉ là một bảng tích luỹ ngầm.`,
  follow: [
    'Vì sao {{@TransactionalEventListener}} mặc định không chạy khi event được publish ngoài transaction?',
    'Bạn thiết kế idempotency cho consumer outbox bằng cách nào khi message có thể được gửi lặp?'
  ],
  tags: ['TransactionalEventListener', 'Spring events', 'outbox', 'AFTER_COMMIT']
},
{
  id: 'spring-017',
  topic: 'spring',
  level: 'senior',
  q: 'Bạn dùng {{@Cacheable}} để cache danh mục sản phẩm và thông số phí. Cache key, TTL với Redis, việc cache giá trị null, self-invocation và cache stampede xử lý ra sao?',
  a: `**Tóm tắt:** {{@Cacheable}} là **advice AOP**, chỉ hoạt động khi method được gọi **qua proxy** – self-invocation sẽ không được cache. Cache key mặc định gộp các tham số method; TTL cấu hình qua {{RedisCacheConfiguration}}; null có được cache hay không tuỳ cấu hình cache manager; stampede cần lock hoặc jitter vì {{sync = true}} chỉ khoá trong một JVM.

### Vì sao phải qua proxy
{{@Cacheable}} là advice AOP nên chỉ chạy khi lời gọi đi qua proxy. Method được gọi bởi **method khác trong cùng bean** (self-invocation) không qua proxy ⇒ không có cache, transaction hay async.

### Cache key
- Mặc định: key gồm các tham số method. Với method không có tham số thì dùng {{SimpleKey.EMPTY}}.
- Ghi đè bằng SpEL: {{key = "#id"}}, {{key = "#p0"}}, {{key = "#root.args[0]"}}.
- **Nguyên tắc quan trọng**: key phải phản ánh **mọi** điều kiện ảnh hưởng kết quả. Method {{findByCustomerId(customerId)}} được gọi từ nhiều module với cùng customerId nhưng khác tenant thì key phải chứa cả tenant, nếu không user của tenant B sẽ đọc được cache của tenant A – đây là lỗi **rò rỉ dữ liệu theo tenant**, không phải lỗi hiệu năng.
- Nên dùng **cache name riêng cho từng loại dữ liệu** để tránh key collision khi hai method cùng id trùng tên cache.

### TTL với Redis
~~~java
@Bean
RedisCacheManager cacheManager(RedisConnectionFactory cf) {
    RedisCacheConfiguration cfg = RedisCacheConfiguration.defaultCacheConfig()
        .entryTtl(Duration.ofMinutes(10))   // TTL cố định cho mọi key
        .disableCachingNullValues();        // mặc định defaultCacheConfig() CHO PHÉP cache null
    return RedisCacheManager.builder(cf).cacheDefaults(cfg).build();
}
~~~
- Vấn đề của TTL cố định: key "nóng" và key "lạnh" cùng sống 10 phút. Muốn TTL theo từng entry, từ Spring Data Redis 3.2 có thể truyền {{RedisCacheWriter.TtlFunction}} vào {{entryTtl(...)}} để tính TTL theo từng key/value.

### Cache null (cache penetration)
Nếu method trả về {{null}} mà cache **không cho phép null** (ví dụ đã gọi {{disableCachingNullValues()}}, hoặc dùng {{unless = "#result == null"}}), Spring Cache **không ghi gì** vào cache. Hậu quả: key không tồn tại bị gọi liên tục, mỗi lần đều xuống DB – đúng mẫu tấn công cache penetration.
- Với Redis: giữ mặc định cho phép null (lưu dạng {{NullValue}}), nên đặt TTL ngắn hơn cho các key này;
- Với Caffeine: {{CaffeineCacheManager.setAllowNullValues(true)}} (mặc định đã là true).
- Lưu ý với {{Optional<T>}}: Spring tự unwrap Optional, {{Optional.empty()}} được lưu như null – nên vẫn cần cache manager cho phép null.

### Cache stampede
Một key rất hot hết TTL, 500 request cùng đến trong 200ms, tất cả đều miss và cùng query DB. Cách xử lý:
1. **Jitter TTL**: TTL ngẫu nhiên trong một khoảng để các key hết hạn lệch nhau (cần hỗ trợ TTL theo từng entry).
2. **Distributed lock**: chỉ một thread gọi DB, các thread khác chờ hoặc nhận giá trị cũ. Lock phải dùng Redis, không dùng {{synchronized}} vì app chạy nhiều instance.
3. **{{@Cacheable(sync = true)}}**: Spring dùng {{Cache.get(key, Callable)}} với khoá **cục bộ trong JVM**, nên chỉ chống stampede trong một instance; với Redis và N instance vẫn có tới N lần query DB cho cùng một key.

### Pitfall production
- **Xoá cache không đúng thời điểm**: {{@CacheEvict}} không bảo đảm chạy sau commit.
- **Cache entity có quan hệ lazy**: cache lưu cả proxy, đọc lại có thể lỗi. Hãy cache **DTO**.
- **Key không có tenant/user** khi phân quyền theo người dùng – lỗi **rò rỉ dữ liệu**, không phải lỗi cache miss.
- Redis là single-threaded: nhiều key lớn làm tăng độ trễ. Không dùng lệnh KEYS trên production (nó chặn server), dùng SCAN.
- Cần metric: cache hit ratio, số lần gọi DB do miss, thời gian build cache.

> Senior tip: trước khi bật cache, trả lời được ba câu: **(1) dữ liệu này có bị hệ thống khác ghi không? (2) dữ liệu cũ bao lâu thì chấp nhận được? (3) khi có sự cố, ai invalidate và bằng cách nào?** Không trả lời được câu 3 thì đừng bật cache – sự cố dữ liệu khó hơn nhiều so với vài mili giây chậm.`,
  follow: [
    'Vì sao {{@Cacheable(sync = true)}} không giải quyết được cache stampede khi dùng Redis?',
    'Bạn thiết kế cache key thế nào để không rò rỉ dữ liệu giữa các tenant?'
  ],
  tags: ['Cacheable', 'Redis', 'cache stampede', 'cache null', 'TTL']
},
{
  id: 'spring-018',
  topic: 'spring',
  level: 'senior',
  q: 'Service của bạn cần gọi 5 API bên ngoài (cổng thanh toán, địa chỉ, thông báo). Với Spring Boot 3, bạn chọn {{RestClient}}, {{WebClient}} hay HTTP interface ({{@HttpExchange}}) thế nào? Timeout và connection pool cấu hình ra sao để không bị treo request?',
  a: `**Tóm tắt:** Spring Boot 3 cho ba lựa chọn: {{RestClient}} (đồng bộ, fluent, là hướng mới thay cho {{RestTemplate}}), {{WebClient}} (non-blocking, trả {{Mono}}/{{Flux}}), và **HTTP interface** – khai báo client như một interface có {{@HttpExchange}}, {{@GetExchange}}, {{@PostExchange}}, Spring sinh proxy implementation.

### Ba lựa chọn
| Tiêu chí | {{RestClient}} | {{WebClient}} | HTTP interface |
|---|---|---|---|
| Mô hình | Đồng bộ, blocking | Reactive, non-blocking | Tuỳ adapter |
| Trả về | {{T}} | {{Mono<T>}}/{{Flux<T>}} | {{T}} hoặc {{Mono<T>}} tuỳ adapter |
| Hợp với MVC + JPA | Rất tốt | Kém, gọi {{block()}} là mất lợi thế | Tốt |
| Cấu hình | Dùng chung factory | Dùng chung {{ConnectionProvider}} | Gọn, test dễ với mock server |

### HTTP interface
~~~java
public interface PaymentGatewayClient {

    @PostExchange("/api/v1/payments")
    PaymentResponse create(@RequestBody PaymentRequest request);

    @GetExchange("/api/v1/payments/{id}")
    PaymentResponse get(@PathVariable("id") String id);
}
~~~
Cấu hình bằng {{HttpServiceProxyFactory}} với adapter tương ứng ({{WebClientAdapter}} cho reactive, {{RestClientAdapter}} hoặc {{RestTemplateAdapter}} cho client đồng bộ). HTTP interface ({{@HttpExchange}}) có từ Spring Framework 6.0; {{RestClientAdapter}} được bổ sung từ 6.1.

### Timeout: bốn tầng phải cấu hình
1. **Connect timeout**: thời gian tối đa để thiết lập kết nối tới host đích. Không đặt thì một host treo sẽ giữ thread vô thời hạn.
2. **Response/read timeout**: thời gian tối đa chờ dữ liệu. Đây là timeout quan trọng nhất khi gọi API chậm.
3. **Pool acquire timeout**: thời gian chờ có connection trong pool.
4. **Timeout ở tầng gọi**: circuit breaker, bulkhead, deadline của request cha truyền xuống.

~~~java
@Bean
RestClient restClient(RestClient.Builder builder) {
    var factory = new JdkClientHttpRequestFactory(
        HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
    factory.setReadTimeout(Duration.ofSeconds(5));   // read timeout
    return builder
        .baseUrl("https://api.vn")
        .requestFactory(factory)
        .defaultStatusHandler(HttpStatusCode::isError, (req, res) -> {
            throw new PaymentApiException(res.getStatusCode());  // KHÔNG nuốt lỗi
        })
        .build();
}
~~~
Với Spring Boot 3.4+ có thể dùng property sẵn có: {{spring.http.client.connect-timeout}} và {{spring.http.client.read-timeout}}; với bản cũ hơn thì dùng {{RestClientCustomizer}}.

### Connection pool
- {{SimpleClientHttpRequestFactory}} dùng {{HttpURLConnection}}: **không có pool**, mỗi request tạo connection mới, không tái sử dụng keep-alive. Chỉ nên dùng cho prototype.
- {{JdkClientHttpRequestFactory}} dùng {{java.net.http.HttpClient}} của JDK 11+: có pool nội bộ và hỗ trợ HTTP/2, nhưng **không** cho phép cấu hình trực tiếp các tham số pool.
- {{HttpComponentsClientHttpRequestFactory}} dùng Apache HttpClient 5: kiểm soát đầy đủ {{maxTotal}}, {{maxPerRoute}}, thời gian sống connection.
- {{WebClient}} dùng Reactor Netty với {{ConnectionProvider}}: cần đặt {{maxConnections}}, {{pendingAcquireMaxCount}}, {{pendingAcquireTimeout}}, {{maxIdleTime}}.

### Pitfall production
- **Không đặt timeout** là nguyên nhân số một của sự cố "API treo": thread bị giữ, connection bị giữ, pool cạn, lỗi lan toả. Luôn đặt cả connect timeout và read timeout.
- **Tạo client mới mỗi lần gọi**: mỗi instance có connection pool riêng, tạo trong vòng lặp sẽ rò rỉ socket. Luôn khai báo bean singleton.
- **Circuit breaker và bulkhead**: cần cô lập để một API bên ngoài chết không kéo sập toàn hệ thống (Resilience4j).
- Với **virtual thread**, connection pool vẫn là tài nguyên hữu hạn: đặt {{maxConnections}} nhỏ hơn nhiều so với số thread.

> Senior tip: hãy đặt cho mỗi client ngoài một **"timeout budget"** tương ứng với SLO của endpoint của bạn: nếu API đồng vị phải trả trong 300ms thì read timeout 1 giây là quá lỏng, còn nếu bạn đặt 30 giây thì một đối tác treo sẽ giữ 30 giây thread của bạn.`,
  follow: [
    'Khi nào chọn {{WebClient}} thay vì {{RestClient}} khi ứng dụng dùng JPA?',
    'Bạn cấu hình retry cho lời gọi tới cổng thanh toán như thế nào để không tạo giao dịch trùng?'
  ],
  tags: ['RestClient', 'WebClient', 'HttpExchange', 'timeout', 'connection pool']
},
{
  id: 'spring-019',
  topic: 'spring',
  level: 'mid',
  q: 'Bean Validation trong Spring: {{@Valid}} và {{@Validated}} khác nhau thế nào, validation group dùng để làm gì, và bạn validate ở tầng nào trong một ứng dụng có cả REST API lẫn job nội bộ?',
  a: `**Tóm tắt:** Cả hai đều kích hoạt validation theo chuẩn Jakarta Bean Validation, nhưng vai trò khác nhau: {{@Valid}} là **cờ kích hoạt validate lồng nhau** (validate các field/collection bên trong) và không hỗ trợ group; {{@Validated}} là annotation của Spring, dùng ở **mức class** để bật **method validation** và cho phép chỉ định **group**. Về tầng validate: controller kiểm tra **hình dạng** của input để fail sớm; **tầng service/domain** kiểm tra quy tắc nghiệp vụ và phải dùng được cả khi gọi từ job nội bộ, không phải từ HTTP.

### So sánh {{@Valid}} và {{@Validated}}
| Tiêu chí | {{@Valid}} | {{@Validated}} |
|---|---|---|
| Package | {{jakarta.validation.Valid}} | {{org.springframework.validation.annotation.Validated}} |
| Vị trí dùng | Tham số method, field | Chủ yếu ở **mức class** |
| Validate lồng nhau | Có – kích hoạt validate cho field con có {{@Valid}} | Không tự kích hoạt |
| Method validation | Không | **Có** – nhờ {{MethodValidationPostProcessor}} |
| Hỗ trợ group | Không | Có: {{groups = X.class}} |
| Lỗi trả về | {{MethodArgumentNotValidException}} | {{ConstraintViolationException}} (method) |

Điểm dễ nhầm nhất: {{@Valid}} **không** tự động validate các field con. Muốn validate lồng nhau, field con phải có {{@Valid}} (hoặc khai báo type-use như {{List<@Valid OrderItemDto> items}}).

### Validation group
Group là **interface marker** dùng để tách bộ luật theo ngữ cảnh sử dụng.
~~~java
public interface OnCreate {}
public interface OnUpdate {}

public record CreateUserRequest(
    @NotNull(groups = OnCreate.class)   // bắt buộc khi tạo
    @NotBlank @Size(max = 64)           // không khai báo group -> thuộc group Default
    String username,
    @NotBlank String displayName) { }
~~~
Vài quy tắc quan trọng:
- Khi khai báo group cụ thể (ví dụ {{groups = OnCreate.class}}), các constraint **không** khai báo group sẽ **không** được validate.

### Custom constraint
~~~java
@Documented
@Constraint(validatedBy = ValidCardNumberValidator.class)
@Target({ FIELD, PARAMETER })
@Retention(RUNTIME)
public @interface ValidCardNumber {
    String message() default "So the khong hop le";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}

public class ValidCardNumberValidator implements ConstraintValidator<ValidCardNumber, String> {
    @Override
    public boolean isValid(String value, ConstraintValidatorContext ctx) {
        if (value == null || value.isBlank()) return true;   // de @NotNull lo phan rong
        return value.matches("[0-9]{12,19}");
    }
}
~~~
Đừng viết lại những thứ đã có sẵn: {{@NotNull}}, {{@NotEmpty}}, {{@NotBlank}}, {{@Size}}, {{@Pattern}}, {{@Email}}, {{@AssertTrue}}.

### Validate ở tầng nào
1. **Controller (biên)**: kiểm tra hình dạng input – null, độ dài, định dạng, enum hợp lệ. Trả 400 ngay, không tốn tài nguyên xử lý nghiệp vụ.
2. **Service (hợp đồng của API trong nội bộ)**: dùng {{@Validated}} ở mức class cùng group, để **cả job nội bộ** gọi vào service cũng được kiểm tra.
3. **Domain (quy tắc nghiệp vụ)**: điều kiện như "đơn phải có ít nhất một dòng hàng", "số tiền chuyển phải dưới hạn mức" nên nằm ở **domain model** và dùng exception nghiệp vụ, không phải Bean Validation.

### Pitfall production
- Bean Validation **không tự dừng luồng**: nếu không có {{@ExceptionHandler}} xử lý {{MethodArgumentNotValidException}} hoặc {{ConstraintViolationException}}, client sẽ nhận 500 thay vì 400.
- Constraint ở tầng DB (unique, foreign key, check) vẫn là lớp phòng thủ cuối cùng: hai request song song có thể cùng vượt qua validation trong ứng dụng.
- {{@Validated}} trên class service kích hoạt proxy; nếu method được gọi bởi method khác trong cùng bean (self-invocation) thì validation bị bỏ qua im lặng.
- Group không đúng sẽ tạo cảm giác "có validate nhưng không bắt lỗi" – hãy viết test cho từng group.

> Senior tip: hãy chia rõ ranh giới trong team bằng một câu đơn giản: **"Cấu trúc thì validate ở biên, quy tắc nghiệp vụ thì validate ở domain"**.`,
  follow: [
    'Vì sao {{@Valid}} trên {{@RequestBody}} không tự động validate các object con?',
    'Khi nào nên dùng validation group thay vì tạo hai DTO khác nhau?'
  ],
  tags: ['Bean Validation', 'Valid', 'Validated', 'groups', 'constraint']
},
{
  id: 'spring-020',
  topic: 'spring',
  level: 'lead',
  q: 'Bạn xây một job Spring Batch để nhập 50 triệu bản ghi từ hệ thống cũ, chạy được nhiều instance và phải khởi động lại an toàn khi lỗi. Chunk-oriented processing hoạt động thế nào, skip/retry cấu hình ra sao, và khi nào nên partitioning?',
  a: `**Tóm tắt:** Spring Batch xử lý job theo mô hình **chunk-oriented**: đọc {{chunkSize}} item, xử lý toàn bộ chunk trong **một transaction**, rồi ghi checkpoint vào {{JobRepository}} rồi commit. Nhờ vậy job **restart được**: sau khi crash, batch resume từ chunk đã commit gần nhất. Lỗi được xử lý bằng {{faultTolerant()}}: **retry** cho lỗi tạm thời (deadlock, timeout) và **skip** cho dữ liệu rác, có giới hạn số lần và backoff. Khi job quá lớn cho một instance, **partitioning** chia dữ liệu theo mô hình manager/worker để chạy song song.

### Chunk-oriented: transaction là checkpoint
~~~java
@Bean
Job importJob(JobRepository repo, Step importStep) {
    return new JobBuilder("importJob", repo).start(importStep).build();
}

@Bean
Step importStep(JobRepository repo, PlatformTransactionManager tx,
                ItemReader<Row> reader,
                ItemProcessor<Row, Staging> processor,
                ItemWriter<Staging> writer) {
    return new StepBuilder("importStep", repo)
        .<Row, Staging>chunk(1000, tx)     // 1 transaction cho 1000 item
        .reader(reader)
        .processor(processor)
        .writer(writer)
        .faultTolerant()
            .skipLimit(100)                            // bo toi da 100 dong rac
            .skip(DataIntegrityViolationException.class)
            .retry(TransientDataAccessException.class)  // chi retry loi tam thoi
            .retryLimit(3)
            .backOffPolicy(exponentialBackOff())        // ExponentialBackOffPolicy 1s x2, max 10s
        .build();
}
~~~
Ba thứ cần nhớ:
- **Chunk là vừa transaction vừa đơn vị checkpoint**. Chunk nhỏ (10) thì nhiều transaction, overhead lớn; chunk lớn (10000) thì giữ lock lâu, một lỗi rollback cả chunk, và mất nhiều công sức khi restart.
- **Xử lý item không nên mở transaction riêng**: {{@Transactional}} (REQUIRED) trên processor/writer chỉ join transaction của chunk nên vô nghĩa; còn {{REQUIRES_NEW}} sẽ commit độc lập, khi chunk rollback thì phần đó không rollback theo – phá vỡ checkpoint.
- **Restart chỉ an toàn ở mức chunk**: chunk đã commit không chạy lại; chunk đang xử lý lúc crash sẽ chạy lại **từ đầu** → vậy nên thao tác phải **idempotent** (upsert chứ không insert, hoặc có cột trạng thái để phân biệt).

### Restartability
- Trạng thái job lưu trong {{JobRepository}} (bảng {{BATCH_*}} với JDBC). Mỗi bộ identifying job parameters ứng với một **JobInstance**; mỗi lần chạy (kể cả restart) tạo một **JobExecution** mới thuộc JobInstance đó.
- {{ExecutionContext}} của step lưu trạng thái của reader (ví dụ {{<tên reader>.read.count}} với các reader kế thừa {{AbstractItemCountingItemStreamItemReader}}), giúp batch biết đã đọc tới đâu khi restart.

### Skip và retry
- **Retry** chỉ hiệu quả với lỗi **tạm thời**: deadlock, timeout, lỗi mạng. Retry lỗi logic (violate constraint do dữ liệu sai) chỉ làm job kéo dài vô tận.
- Khi cấu hình **cả retry lẫn skip** cho cùng exception, Spring Batch áp dụng **retry trước**; chỉ khi hết số lần retry thì item mới bị skip.
- **Skip phải có visibility**: dùng {{SkipListener}} để ghi lại dòng bị bỏ vào file hoặc bảng, để không mất dữ liệu trong im lặng.

### Partitioning cho job quy lớn
~~~java
@Bean
Step managerStep(JobRepository repo, Step workerStep, TaskExecutor batchExecutor) {
    return new StepBuilder("managerStep", repo)
        .partitioner("workerStep", new IdRangePartitioner())
        .step(workerStep)
        .gridSize(8)                 // 8 partition
        .taskExecutor(batchExecutor) // chay song song bang thread pool
        .build();
}

@Bean
Step workerStep(JobRepository repo, PlatformTransactionManager tx,
                ItemReader<Row> reader, ItemWriter<Staging> writer) {
    return new StepBuilder("workerStep", repo)
        .<Row, Staging>chunk(500, tx)
        .reader(reader).writer(writer)
        .build();
}
~~~
- {{Partitioner}} chia dữ liệu theo một khoá (thường là dải {{id}}): partition 0 lấy id 1-1.000.000, partition 1 lấy 1.000.001-2.000.000...
- Mỗi partition là một **StepExecution** riêng → restart được độc lập, một partition lỗi không làm hỏng các partition đã xong.

### Pitfall production
- **Chunk transaction chứa cả việc nặng** (gọi API, sinh file lớn): giữ transaction mở quá lâu, giữ lock, connection pool cạn, tăng khả năng deadlock.
- **Không bật skip cho lỗi dữ liệu** mà không lưu lại danh sách dòng lỗi: dữ liệu bị mất mà không ai biết.
- **Thiếu listener quan sát**: không có {{JobExecutionListener}} và {{StepExecutionListener}} thì khi job fail giữa đêm, bạn không biết nó fail ở partition nào, chunk nào, dòng nào.

> Senior tip: với job nhập dữ liệu lớn, hãy coi **idempotency và checkpoint là thiết kế chính**, còn code xử lý chỉ là phần dễ.`,
  follow: [
    'Vì sao Spring Batch áp dụng retry trước rồi mới skip, và hậu quả khi cấu hình sai là gì?',
    'Bạn thiết kế partition cho bảng giao dịch 200 triệu dòng theo tiêu chí nào?'
  ],
  tags: ['Spring Batch', 'chunk', 'restartability', 'retry', 'partitioning']
},
{
  id: 'spring-021',
  topic: 'spring',
  level: 'lead',
  q: 'Một SPA React (lưu access token trong memory) gọi API ngân hàng qua Spring Security. Bạn tổ chức phân quyền bằng {{@PreAuthorize}}, xác thực OAuth2 resource server, và xử lý CORS với CSRF ra sao?',
  a: `**Tóm tắt:** Nên chia quyền thành ba lớp: **filter chain** phân quyền ở mức URL (thô), **method security** với {{@PreAuthorize}} phân quyền ở mức **use case** (tinh), và phân quyền ở mức dữ liệu (row-level, theo tenant). CORS và CSRF là **hai cơ chế khác nhau**: CORS là quyền cho **trình duyệt** đọc response từ origin khác, còn CSRF chống việc trang khác **tự động** gửi request bằng cookie của người dùng. SPA giữ token trong memory và gửi qua header {{Authorization}} thì gần như không có rủi ro CSRF nên có thể tắt – nhưng **chỉ khi** chắc chắn không dùng cookie để xác thực.

### Ba lớp phân quyền
1. **URL security** trong filter chain: {{requestMatchers("/api/admin/**").hasRole("ADMIN")}} – rất thô, dễ sót nếu có nhiều endpoint.
2. **Method security**: quyết định quyền gắn với **hành động nghiệp vụ**, không phụ thuộc URL. Đây là lớp nên là nguồn sự thật cho quyền nghiệp vụ.
3. **Row-level**: truy vấn phải luôn lọc theo tenant/customer của principal – không phụ thuộc vào tầng trên.

### Method security
~~~java
// Can @EnableMethodSecurity tren mot class @Configuration (Spring Boot KHONG tu bat)
@Service
public class TransferService {

    @PreAuthorize("hasAuthority('SCOPE_transfer.write')")
    public Transfer transfer(String accountId, BigDecimal amount) { ... }

    // SpEL goi method tren bean khac: quyet dinh theo du lieu nghiep vu
    @PreAuthorize("@accountAccess.canAccess(#accountId, authentication)")
    public Statement getStatement(String accountId) { ... }
}
~~~
- {{hasRole('ADMIN')}} tương đương {{hasAuthority('ROLE_ADMIN')}}; scope của OAuth2 được Spring đổi thành {{SCOPE_xxx}}.

### CORS cho SPA
SPA ở {{https://app.vn}} gọi API ở {{https://api.vn}} là **khác origin** → trình duyệt gửi request preflight {{OPTIONS}} trước khi gọi request thật.
- CORS **không phải cơ chế bảo mật**: nó chỉ quyết định trình duyệt có được đọc response hay không. Request vẫn có thể đã tới server nếu là "simple request".
- Cấu hình:
~~~java
@Bean
CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration cfg = new CorsConfiguration();
    cfg.setAllowedOrigins(List.of("https://app.vn"));   // khong dung "*" khi allowCredentials
    cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
    cfg.setAllowedHeaders(List.of("Authorization", "Content-Type", "X-XSRF-TOKEN"));
    cfg.setAllowCredentials(true);
    cfg.setMaxAge(3600L);                              // cache preflight 1 gio
    UrlBasedCorsConfigurationSource src = new UrlBasedCorsConfigurationSource();
    src.registerCorsConfiguration("/api/**", cfg);
    return src;
}
~~~

### CSRF cho SPA
- **Tấn công CSRF** dựa trên việc trình duyệt **tự động** gửi cookie của domain (session cookie, hoặc cookie chứa access token) khi bạn truy cập một trang khác.
- Nếu access token nằm trong **memory** của SPA và được gửi qua header {{Authorization}} → trình duyệt **không tự động** gửi header này → không có đường tấn công CSRF → có thể **disable CSRF**.
- Nếu token nằm trong **cookie** (kể cả httpOnly) → cần CSRF token theo mẫu double-submit cookie:
~~~java
@Bean
SecurityFilterChain apiChain(HttpSecurity http, CorsConfigurationSource cors) throws Exception {
    CookieCsrfTokenRepository repo = CookieCsrfTokenRepository.withHttpOnlyFalse();
    repo.setCookieCustomizer(c -> c.sameSite("Strict").secure(true).path("/"));
    return http
        .cors(c -> c.configurationSource(cors))
        .csrf(c -> c.csrfTokenRepository(repo)
                    .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
        .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .oauth2ResourceServer(o -> o.jwt(Customizer.withDefaults()))
        .build();
}
~~~
SPA đọc cookie {{XSRF-TOKEN}} rồi gửi lại trong header {{X-XSRF-TOKEN}} cho mọi request thay đổi dữ liệu.

### Pitfall production
- {{allowedOrigins("*")}} cùng {{allowCredentials(true)}} là **không hợp lệ**: Spring ném {{IllegalArgumentException}} khi xử lý request CORS (dùng {{allowedOriginPatterns}} nếu thật sự cần wildcard).
- **Tắt CSRF nhưng vẫn dùng cookie/session** là lỗ hổng kinh điển. Trước khi tắt, hãy chắc chắn không có cookie nào mang thông tin xác thực.
- Lưu token trong {{localStorage}}: mọi lỗi XSS đều đánh cắp được token. Nếu buộc phải dùng, cần CSP nghiêm và sanitize input.
- Sai mapping authorities (scope không được đổi thành {{SCOPE_}}) → 403 hàng loạt mà không rõ nguyên nhân.

> Senior tip: khi rà soát security của một SPA, đi theo thứ tự: **(1) token nằm ở đâu?** Nằm trong cookie thì cần CSRF; nằm trong memory thì cần CSP chặt. **(2) preflight có được trả lời đúng không?** **(3) endpoint nhạy cảm có method security không?** **(4) dữ liệu nhiều tenant có được lọc ở tầng truy vấn không?** Phần lớn sự cố bảo mật không nằm ở mã hoá hay token, mà ở việc **tin rằng filter chain đã đủ**.`,
  follow: [
    'Vì sao {{hasRole("ADMIN")}} không hoạt động với scope của OAuth2 token?',
    'Khi nào bạn buộc phải dùng cookie và bật lại CSRF cho ứng dụng SPA?'
  ],
  tags: ['PreAuthorize', 'method security', 'OAuth2', 'CORS', 'CSRF']
},
{
  id: 'jpa-010',
  topic: 'jpa',
  level: 'senior',
  q: 'Một API trả về đơn hàng kèm danh sách sản phẩm và lịch sử thanh toán. Bạn chọn chiến lược fetch nào: {{JOIN FETCH}}, {{@EntityGraph}} hay {{@BatchSize}}? Vì sao fetch hai collection kiểu {{List}} cùng lúc lại gây {{MultipleBagFetchException}}, và xử lý thế nào?',
  a: `**Tóm tắt:** Ba chiến lược fetch khác nhau ở **thời điểm** và **cách sinh SQL**. {{JOIN FETCH}} và {{@EntityGraph}} đều tạo **một** câu SQL có {{LEFT JOIN}}, nên Hibernate đã biết trước dữ liệu con và không sinh query nào thêm – nhưng SQL phình to và **không** dùng được cùng lúc với phân trang. {{@BatchSize}} giữ quan hệ ở trạng thái lazy, nhưng khi truy cập collection sẽ gom nhiều lần tải thành query {{IN}} theo lô (N collection cần khoảng N / batch size query thay vì N). {{MultipleBagFetchException}} xảy ra vì khi join **hai** collection kiểu {{List}} (bag), tập kết quả là **tích Descartes** – một đơn có 3 sản phẩm và 2 lần thanh toán thành 6 dòng – mà Hibernate không thể ánh xạ 6 dòng đó về 2 collection {{List}} cùng lúc.

### Ba chiến lược
| Tiêu chí | {{JOIN FETCH}} | {{@EntityGraph}} | {{@BatchSize}} |
|---|---|---|---|
| Số SQL | 1 (có {{LEFT JOIN}}) | 1 (tương đương join fetch) | 1 cho mỗi nhóm {{IN}} |
| Dùng được với {{Pageable}} | **Không** (bị giới hạn bộ nhớ) | Không | Có |
| Collection tải cùng lúc | Có thể nhiều | Có thể nhiều | Tải theo lô khi truy cập |
| SQL độ rộng | Rộng, dễ trùng dữ liệu | Rộng | Hẹp, không cần join |
| Ưu tiên | Cần dữ liệu con chắc chắn dùng | Nhiều quan hệ, muốn tránh viết JPQL | Nhiều collection nhỏ, không biết trước cần cái nào |

### Vì sao fetch 2 collection {{List}} lại lỗi
SQL thực tế:
~~~sql
select o.id, i.id, pay.id
from orders o
left join order_item i on i.order_id = o.id
left join payment pay on pay.order_id = o.id
~~~
Một đơn có 3 item và 2 payment sẽ ra 6 dòng. Nếu chỉ fetch một collection, Hibernate gom các dòng trùng nhau về một đối tượng cha và điền vào collection – chuyện bình thường. Với **hai bag** ({{List}} không có {{@OrderColumn}}), Hibernate không phân biệt được bản sao do tích Descartes với phần tử trùng hợp lệ của List, nên nó từ chối ngay khi dựng query bằng {{MultipleBagFetchException}} thay vì trả về collection sai.

### Cách xử lý
1. **Tách thành 2 query**: một query lấy đơn (kèm 1 collection), một query lấy collection còn lại theo danh sách id. Đây là lựa chọn mặc định, dễ kiểm soát.
2. **Dùng {{Set}}** thay cho {{List}} nếu ngữ nghĩa collection cho phép (thường là con, không trùng). Vẫn phải cẩn thận với tích Descartes.
3. **Dùng {{@BatchSize}}** hoặc {{default_batch_fetch_size}}: giữ lazy, khi code truy cập collection nào thì load collection đó bằng query {{IN}}. Cách này giải quyết được cả vấn đề phân trang.
4. **Fetch collection thứ hai bằng query riêng** với subquery: {{select o from Order o where o.id in (select ...)}} rồi gọi {{em.createQuery("select i from OrderItem i where i.order.id in :ids", OrderItem.class)}}.
5. **DTO projection**: nếu API chỉ cần vài field của collection, hãy trả DTO – không cần load cả collection.

### Chọn gì trong tình huống đầu bài
- Danh sách đơn hàng (phân trang): **không** fetch collection trong query chính.
- Chi tiết một đơn: dùng {{@EntityGraph}} với cả {{items}} và {{payments}} nếu chấp nhận SQL rộng, hoặc tách 2 query nếu cần kiểm soát.
- Báo cáo tổng hợp: **DTO projection** – không cần entity.

### Pitfall production
- {{@EntityGraph}} của Spring Data mặc định {{type = EntityGraphType.FETCH}}: thuộc tính không được chỉ định được coi là LAZY; còn {{LOAD}} giữ fetch type khai báo trong mapping, nên các {{@ManyToOne}} (mặc định EAGER) vẫn bị kéo theo. Thêm collection vào graph của query phân trang là làm hỏng phân trang.
- Fetch join làm **dữ liệu trùng** ở mức SQL: Hibernate 5 cần {{distinct}} để không trả cùng một đơn nhiều lần; Hibernate 6 tự loại trùng entity gốc, nhưng nếu bạn select DTO/scalar từ join thì vẫn bị nhân dòng.
- {{@BatchSize}} chỉ hiệu quả khi số collection cần load nằm gọn trong batch size. Với collection rất lớn (vài nghìn phần tử), câu {{IN}} sẽ nặng.

> Senior tip: hãy coi lựa chọn fetch là một **phân tích chi phí**, không phải một lựa chọn "đúng/sai". Một câu SQL có join 3 collection trả về 100 dòng cho 10 đơn có thể nhanh hơn 3 câu query riêng khi dữ liệu nhỏ; nhưng khi collection phình to, chính câu SQL đó lại là thứ làm OOM.`,
  follow: [
    'Vì sao Hibernate không thể gộp kết quả join của hai collection {{List}} cùng lúc?',
    'Khi nào chọn {{@BatchSize}} thay vì {{@EntityGraph}} cho một API lấy danh sách?'
  ],
  tags: ['fetch plan', 'EntityGraph', 'BatchSize', 'MultipleBagFetchException', 'fetch join']
},
{
  id: 'jpa-011',
  topic: 'jpa',
  level: 'senior',
  q: 'API phân trang đơn hàng dùng {{@EntityGraph}} để lấy kèm sản phẩm. Từ 10.000 trang trở đi, service báo lỗi và SQL trả về hàng trăm nghìn dòng. Cảnh báo {{HHH90003004}} là gì và bạn sửa thế nào?',
  a: `**Tóm tắt:** Cảnh báo {{HHH90003004}} (Hibernate 6; ở Hibernate 5 là {{HHH000104}}) nói rằng "firstResult/maxResults specified with collection fetch; applying in memory". Nguyên nhân: khi SQL có {{LEFT JOIN}} một collection, tập kết quả bị nhân lên nên {{LIMIT}}/{{OFFSET}} áp lên **số dòng SQL** sẽ cắt sai đơn hàng ⇒ Hibernate buộc tải **toàn bộ** tập kết quả về bộ nhớ rồi mới cắt. Cách sửa chuẩn là **tách 2 query**: query 1 lấy danh sách {{id}} theo trang, query 2 fetch collection theo danh sách id đó.

### Vì sao LIMIT trên SQL lại sai
~~~sql
-- Hibernate sinh ra (hiểu theo ý nghĩa):
select o.*, i.* from orders o left join order_item i on i.order_id = o.id
order by o.created_at desc
limit 20 offset 1000;
~~~
Ở trang đầu, 20 dòng SQL này có thể chỉ chứa **2 đơn** (mỗi đơn 10 sản phẩm). Hibernate thấy "phải lấy 20 đơn" nên không thể dùng LIMIT của SQL ⇒ bỏ LIMIT, tải hết rồi gom và cắt trong bộ nhớ. Với 1 triệu đơn, đây là OOM.

### Cách sửa: 2 query
~~~java
public class OrderRepositoryImpl implements OrderRepositoryCustom {

    @PersistenceContext private EntityManager em;

    @Override
    public Page<Order> findPageWithItems(Specification<Order> spec, Pageable pageable) {
        // Query 1: chi lay ID theo trang, KHONG join collection
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery<Long> cq = cb.createQuery(Long.class);
        Root<Order> root = cq.from(Order.class);
        cq.select(root.get("id"));
        cq.where(spec.toPredicate(root, cq, cb));
        cq.orderBy(cb.desc(root.get("createdAt")), cb.desc(root.get("id")));
        List<Long> ids = em.createQuery(cq)
            .setFirstResult((int) pageable.getOffset())
            .setMaxResults(pageable.getPageSize())
            .getResultList();

        if (ids.isEmpty()) return new PageImpl<>(List.of(), pageable, 0);

        // Query 2: fetch collection theo danh sach id vua lay
        List<Order> orders = em.createQuery(
                "select distinct o from Order o left join fetch o.items where o.id in :ids", Order.class)
            .setParameter("ids", ids)
            .getResultList();

        // sap xep lai dung thu tu da phan trang
        Map<Long, Order> byId = orders.stream()
            .collect(Collectors.toMap(Order::getId, Function.identity()));
        List<Order> ordered = ids.stream().map(byId::get).filter(Objects::nonNull).toList();

        // Query 3: dem tong so dong - KHONG join collection
        // (rut gon; thuc te phai ap cung spec nhu query 1)
        long total = em.createQuery("select count(o) from Order o", Long.class).getSingleResult();
        return new PageImpl<>(ordered, pageable, total);
    }
}
~~~
Ba điểm cần chú ý trong đoạn trên:
1. **Query 1 chỉ lấy id**, và có {{ORDER BY}} ổn định (thêm {{id}} làm tie-breaker) để phân trang không bị trùng/mất dòng giữa các lần gọi.
2. **Query 2 phải sắp xếp lại theo thứ tự id** đã lấy: thứ tự trả về của query 2 không đảm bảo giống thứ tự phân trang.
3. **Query đếm tổng phải tách riêng**, không được join collection – cùng lý do tích Descartes.

### Cách khác
- Dùng {{@EntityGraph}} + {{Pageable}}: vẫn dính lỗi, vì bản chất là collection fetch + phân trang.
- Dùng **subquery** để lấy id đã lọc theo collection: {{select o.id from Order o where o.id in (select i.order.id from OrderItem i where ...)}}.
- **DTO projection** cho API danh sách: nếu chỉ cần tên sản phẩm và số lượng, trả DTO với {{@Query}} constructor expression – không cần load collection, không cần 2 query.
- **Keyset pagination** thay cho offset: xem câu về phân trang keyset – vừa nhanh hơn, vừa tránh được phần lớn vấn đề offset.

### Pitfall production
- {{hibernate.query.fail_on_pagination_over_collection_fetch}} mặc định là **false** (chỉ log cảnh báo). Nên bật **true** ở mọi môi trường để lỗi được ném ra sớm thay vì âm thầm OOM trên production.
- Nâng cấp Hibernate hay Spring Data không xoá được vấn đề này: collection fetch + phân trang offset về bản chất luôn phải phân trang trong bộ nhớ.
- **Đếm tổng số bản ghi** trên bảng lớn rất tốn. Nếu UI không cần "trang 5 / 120 trang", dùng {{Slice}} hoặc trả về {{hasNext}} để khỏi query count.

> Senior tip: cảnh báo {{HHH90003004}} thực chất là một **phát hiện quý**: nó cho biết ứng dụng đang âm thầm tải toàn bộ bảng về bộ nhớ. Trong production, chỉ cần bảng 5 triệu đơn là vài GB heap rồi.`,
  follow: [
    'Vì sao Hibernate không thể áp dụng LIMIT của SQL khi có collection fetch?',
    'Bạn xử lý thứ tự dữ liệu giữa query lấy id và query fetch collection như thế nào?'
  ],
  tags: ['HHH90003004', 'pagination', 'fetch join', 'EntityGraph', 'in-memory pagination']
},
{
  id: 'jpa-012',
  topic: 'jpa',
  level: 'senior',
  q: 'Bạn cần đóng hàng loạt 500.000 đơn hàng quá hạn bằng một câu {{@Modifying}}. Vì sao dữ liệu trong persistence context trở nên sai, và {{clearAutomatically}} cùng {{flushAutomatically}} khác nhau thế nào?',
  a: `**Tóm tắt:** Câu {{@Modifying}} dùng JPQL bulk ({{update}}/{{delete}}) được gửi thẳng xuống DB, **không** đi qua persistence context ⇒ entity đang managed **không** được cập nhật và cũng **không** bị đánh dấu bẩn. Hậu quả nặng nhất là **dirty checking ghi đè**: sửa entity đã load trong cùng transaction sẽ sinh {{UPDATE}} với giá trị cũ khi commit. {{flushAutomatically}} buộc flush trước khi chạy câu bulk, còn {{clearAutomatically}} xoá persistence context sau đó – cái giá là mất identity map.

### Cơ chế
Khi gọi method có {{@Modifying}}, Spring Data thực thi câu update/delete rồi **không** đồng bộ ngược lại context. Hibernate có evict **toàn bộ region** second-level cache của entity bị ảnh hưởng (đúng nhưng thô), còn Spring Cache ({{@Cacheable}}) thì hoàn toàn không biết gì.

~~~java
@Modifying(flushAutomatically = true, clearAutomatically = true)
@Query("update Order o set o.status = 'EXPIRED', o.updatedAt = :now " +
       "where o.status = 'PENDING' and o.createdAt < :cutoff")
int expireOldOrders(@Param("cutoff") Instant cutoff, @Param("now") Instant now);
~~~

### Ba cờ, ba hậu quả
| Cờ | Tác dụng | Khi nên bật |
|---|---|---|
| {{flushAutomatically}} | Flush các thay đổi chưa ghi xuống DB **trước** khi chạy câu bulk | Luôn bật khi trong transaction có thay đổi chưa flush |
| {{clearAutomatically}} | Xoá persistence context **sau** khi chạy câu bulk | Bật nếu không còn entity nào cần dùng; **rất đắt** vì mất identity map |
| {{@Query}} có {{@Modifying}} | Bắt buộc, nếu không Spring Data coi method là select | Bắt buộc |

Mặc định cả hai cờ là {{false}}, nên phải bật tường minh khi cần.

### Vì sao đây là bug nguy hiểm
Tình huống kinh điển:
1. Transaction bắt đầu.
2. Bạn load đơn hàng A (status {{PENDING}}).
3. Bạn gọi bulk update đóng tất cả đơn {{PENDING}} → trong DB, A đã là {{EXPIRED}}, nhưng snapshot trong context vẫn là {{PENDING}}.
4. Sau đó bạn sửa một field khác của A (ví dụ {{note}}). Khi commit, dirty checking sinh {{UPDATE}} cho **mọi cột** (mặc định không có {{@DynamicUpdate}}) → {{status='PENDING'}} bị ghi lại → **ghi đè** kết quả của bulk update.

Thêm nữa, entity A trong context vẫn hiển thị {{PENDING}} trong khi DB đã là {{EXPIRED}}, nên code đọc tiếp sẽ xử lý sai.

### Cách làm an toàn
1. **Tách transaction**: chạy bulk update trong một transaction riêng, sau đó mới xử lý entity. Đây là cách rõ ràng nhất.
2. **Dùng {{@Modifying(clearAutomatically = true)}}** rồi **load lại** entity cần dùng. Chấp nhận mất identity map (nếu trong transaction đó có nhiều entity thì đừng dùng cách này).
3. **Viết lại bằng query cập nhật có điều kiện trạng thái** ({{where o.status = 'PENDING'}}) và kiểm tra số dòng được update.
4. **Không dùng bulk update cho dữ liệu còn được quản lý bởi entity khác trong cùng transaction**.

### Bulk delete
~~~java
@Modifying
@Query("delete from AuditLog a where a.createdAt < :cutoff")
int deleteOldAuditLogs(@Param("cutoff") Instant cutoff);
~~~
- Bulk delete **bỏ qua** {{cascade = REMOVE}} và {{orphanRemoval}} của JPA, và **không** xoá các entity con (chỉ {{ON DELETE CASCADE}} ở tầng DB, kể cả sinh từ {{@OnDelete}}, vẫn chạy). Nếu bảng con có foreign key tham chiếu mà không có ON DELETE, câu delete sẽ vi phạm constraint.
- Xoá hàng loạt bằng bulk trên bảng lớn sẽ tạo rất nhiều dead tuple và làm bloat – cân nhắc xoá theo lô, partition theo thời gian rồi drop partition, hoặc {{TRUNCATE}} khi xoá cả bảng (trên PostgreSQL TRUNCATE có transaction nhưng cần lock ACCESS EXCLUSIVE; trên MySQL/Oracle nó là DDL, tự commit).

### Pitfall production
- **Không invalidate Spring Cache**: bulk update không xoá entry trong {{@Cacheable}}/Redis (L2 cache của Hibernate thì bị evict cả region). Phải evict thủ công, nếu không sẽ phục vụ dữ liệu cũ.
- **Bỏ qua {{@Version}}**: bulk update JPQL thường không tăng version ⇒ luồng khác đang giữ version cũ vẫn ghi đè được. Tự tăng trong câu update ({{set o.version = o.version + 1}}) hoặc dùng {{update versioned}} của HQL.
- **Trigger và entity listener**: các trigger ở tầng DB vẫn chạy (đây là điểm tốt), nhưng {{@PreUpdate}} và Spring Data auditing thì **không** chạy.
- **Audit trail**: bulk update làm mất thông tin về ai đã sửa; với dữ liệu tài chính cần bảng lịch sử riêng.

> Senior tip: quy tắc đơn giản và hữu ích nhất là "**bulk update là một câu SQL độc lập, hãy để nó độc lập**": chạy ở đầu transaction hoặc trong transaction riêng, và luôn **kiểm tra số dòng ảnh hưởng**. Một câu bulk sai điều kiện có thể đóng hàng chục nghìn đơn chưa thanh toán, và phát hiện ra điều đó còn khó hơn nhiều so với việc viết lại câu update cho chuẩn.`,
  follow: [
    'Vì sao bulk update có thể bị dirty checking ghi đè, và làm sao chứng minh điều đó?',
    'Khi nào nên dùng bulk update thay vì xoá hàng loạt entity?'
  ],
  tags: ['Modifying', 'bulk update', 'clearAutomatically', 'flushAutomatically', 'persistence context']
},
{
  id: 'jpa-013',
  topic: 'jpa',
  level: 'senior',
  q: 'Bạn phải nhập 1 triệu dòng lịch sử giao dịch từ file CSV. Với Hibernate, bạn chọn chiến lược ghi hàng loạt nào: {{jdbc.batch_size}}, {{StatelessSession}}, hay bỏ hẳn JPA? Các cấu hình và bẫy cần thiết là gì?',
  a: `**Tóm tắt:** Với 1 triệu dòng, mục tiêu là **giảm số round-trip** và **không để persistence context phình to**. Bộ cấu hình bắt buộc là {{hibernate.jdbc.batch_size}}, {{hibernate.order_inserts}} và {{hibernate.jdbc.batch_versioned_data}} (nếu entity có {{@Version}}), cộng {{flush()}} + {{clear()}} định kỳ. Với quy mô này, {{StatelessSession}} là lựa chọn tốt: nó **bỏ qua persistence context**, không dirty-check, không cascade. Nếu dữ liệu còn cần đọc lại để kiểm tra thì hãy dùng {{JdbcTemplate}} hoặc công cụ COPY của PostgreSQL.

### So sánh các lựa chọn
| Cách | Tốc độ | Bỏ qua persistence context | Ghi chú |
|---|---|---|---|
| {{save()}} + flush/clear | Trung bình | Không | Vẫn tốn overhead dirty checking |
| {{StatelessSession}} | Nhanh | **Có** | Không cascade, không dirty check, không có L1 cache |
| {{JdbcTemplate.batchUpdate}} | Rất nhanh | Không liên quan | Bỏ qua Hibernate hoàn toàn |
| COPY của PostgreSQL | Nhanh nhất | – | Cần quyền và xử lý đặc biệt |
| Spring Batch chunk | Phụ thuộc | Tuỳ | Có checkpoint, restart được |

### Cấu hình batching
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        jdbc:
          batch_size: 100
          batch_versioned_data: true
        order_inserts: true
        order_updates: true
~~~
- {{batch_size}} chỉ có tác dụng khi **nhiều statement giống nhau** được gom liền nhau. Đó là lý do {{order_inserts}} quan trọng: nếu bạn insert xen kẽ {{Transaction}} và {{TransactionItem}}, không có {{order_inserts}} thì Hibernate phải gửi lệnh luân phiên và batching gần như vô hiệu.
- **Sinh id trước** để batch được: {{IDENTITY}} buộc Hibernate phải lấy generated key sau mỗi lần insert ⇒ mất batching.
- {{batch_size}} không phải con số ma thuật: tăng dần và đo. Giá trị 50-500 là điểm khởi đầu phổ biến; quá lớn sẽ giữ nhiều statement trong bộ nhớ.

### StatelessSession
~~~java
StatelessSession session = sessionFactory.openStatelessSession();
Transaction tx = session.beginTransaction();
try (BufferedReader reader = Files.newBufferedReader(path)) {
    reader.readLine();                 // bo dong header
    String line;
    while ((line = reader.readLine()) != null) {   // streaming tung dong, khong nap het vao RAM
        TxHistory row = mapper.toEntity(line);
        session.insert(row);           // insert truc tiep, khong qua context
        // khong co persistence context nen khong can flush/clear dinh ky
    }
    tx.commit();
} catch (Exception e) {
    tx.rollback();
    throw e;
} finally {
    session.close();
}
~~~
Đặc điểm của {{StatelessSession}} cần nhớ:
- **Không có persistence context**: {{session.get(...)}} luôn truy vấn DB, không có identity map, không dirty checking.
- **Không hỗ trợ cascade**: phải tự insert các entity con theo thứ tự.
- **Không hỗ trợ lazy loading**: mọi thứ phải được set tay.
- **Hibernate 6 hỗ trợ JDBC batching** cho StatelessSession (theo {{hibernate.jdbc.batch_size}} hoặc {{setJdbcBatchSize()}}) – hãy bật log SQL/JDBC để xác nhận batching thực sự xảy ra với phiên bản bạn dùng.

### Pitfall production
- **Đọc hết file vào RAM** rồi mới ghi: với file 1 triệu dòng sẽ gây OOM. Hãy stream từng dòng, dùng {{BufferedReader}} hoặc streaming CSV parser.
- **Transaction quá dài**: giữ 1 triệu dòng trong một transaction làm undo log/WAL phình to, chặn vacuum, và kéo dài thời gian commit.
- **Retry không idempotent**: nếu job fail giữa chừng và chạy lại, sẽ sinh bản ghi trùng. Dùng upsert theo khoá nghiệp vụ, hoặc bảng staging + cờ trạng thái.
- **Index trên bảng đích**: mỗi index là thêm chi phí cho từng dòng insert. Với lần nạp lớn vào bảng mới, có thể drop index phụ rồi tạo lại sau khi nạp; nhưng giữ unique index cần cho upsert/chống trùng.

> Senior tip: với 1 triệu dòng, câu hỏi quan trọng nhất không phải "dùng thư viện nào" mà là **"dữ liệu này còn cần đọc lại trong quá trình ghi không?"**.`,
  follow: [
    'Vì sao {{@GeneratedValue(strategy = GenerationType.IDENTITY)}} làm mất hiệu quả của JDBC batching?',
    '{{StatelessSession}} khác {{EntityManager}} thông thường ở những điểm nào và hậu quả ra sao?'
  ],
  tags: ['batch insert', 'StatelessSession', 'jdbc.batch_size', 'order_inserts', 'flush clear']
},
{
  id: 'jpa-014',
  topic: 'jpa',
  level: 'mid',
  q: 'Khi nào nên trả DTO thay vì entity cho API, và cách dùng interface projection, DTO record với {{@Query}} constructor expression khác nhau ra sao?',
  a: `**Tóm tắt:** Entity là mô hình **lưu trữ và nghiệp vụ**, không phải hợp đồng API. Trả entity trực tiếp cho API có ba hậu quả: kích hoạt lazy loading khi Jackson serialize (dễ gây N+1 hoặc {{LazyInitializationException}}), nguy cơ **lộ field nhạy cảm** (ví dụ {{passwordHash}}) khi ai đó thêm field mới, và gắn API vào cấu trúc bảng (đổi schema là vỡ API). Với Spring Data JPA có ba cách lấy DTO: **constructor expression** trong {{@Query}} (SQL chỉ chọn đúng cột cần), **interface projection** và **native query**.

### Ba cách lấy DTO
~~~java
// 1. Constructor expression: SQL chi chon cot can dung
@Query("select new com.acme.dto.OrderRow(o.id, o.code, o.status, o.totalAmount, o.createdAt) " +
       "from Order o where o.customerId = :cid")
List<OrderRow> findRows(@Param("cid") Long customerId);

// 2. Interface projection (closed): Spring tao proxy
interface OrderView {
    Long getId();
    String getCode();
    String getStatus();
    BigDecimal getTotalAmount();
}
List<OrderView> findByCustomerId(Long customerId);

// 3. Native query + interface projection
@Query(value = "select id, code, status, total_amount as totalAmount from orders where customer_id = :cid",
       nativeQuery = true)
List<OrderView> findNative(@Param("cid") Long customerId);
~~~

### So sánh
| Tiêu chí | Constructor expression | Interface projection | Native + interface |
|---|---|---|---|
| SQL chỉ chọn cột cần | **Có** | Có với closed projection; open projection ({{@Value}} SpEL) thì load cả entity | Có |
| Cần viết đúng kiểu tham số | Có, phải khớp chính xác | Không | Không |
| Dùng cho query phức tạp | Hạn chế (chỉ biểu thức JPQL) | Hạn chế | Tốt nhất |
| Rủi ro khi đổi schema | Thấp | Thấp | Cao (alias phải khớp) |

Lưu ý quan trọng về **constructor expression**: kiểu tham số phải khớp **chính xác** với kiểu trong DTO.

### Khi nào thay entity bằng DTO
- **Nên dùng DTO**: API đọc (danh sách, chi tiết, báo cáo), màn hình danh sách không cần mọi field, dữ liệu nhạy cảm, và khi endpoint cần tính toán hoặc gộp dữ liệu.
- **Nên dùng entity**: trong tầng service khi cần nghiệp vụ và quan hệ đầy đủ, khi cần update/merge, khi dùng làm input của các API nội bộ giữa các module.

### Ví dụ cần cẩn thận
~~~java
@Query("select new com.acme.dto.OrderRow(o.id, o.code, o.status, size(o.items)) " +
       "from Order o where o.customerId = :cid")
List<OrderRow> countItems(@Param("cid") Long customerId);
~~~
- {{size(o.items)}} sinh subquery đếm, **không** load collection ⇒ không gây N+1.
- Nhưng nhớ: đó là **subquery tương quan**, chạy cho từng dòng kết quả; với tập lớn, cân nhắc {{left join o.items i ... group by}} kèm {{count(i)}}, và kiểm tra plan.
- {{size()}} trả 0 cho collection rỗng (không trả null); kiểu tham số trong constructor DTO phải khớp kiểu Hibernate trả về cho {{size()}}.

### Pitfall production
- **Interface projection vẫn có thể gây N+1**: với open projection (getter có {{@Value}} dùng SpEL trên {{target}}) hoặc projection lồng nhau trên collection, Spring load entity rồi đọc getter; nếu getter chạm tới collection thì collection đó lại bị lazy load.
- **Đổi tên cột trong native query** mà không sửa alias → kết quả trả về null im lặng, không báo lỗi.
- **DTO thiếu field mới**: khi domain thêm trạng thái mới, DTO phải được cập nhật – đây là cái giá của việc tách lớp, và nó là cái giá **đáng trả**.
- **Trả entity kèm {{@JsonIgnore}}** rồi thêm mọi thứ cần thiết là cách dễ quên nhất: mọi field mới của entity sẽ tự động lộ ra API.

> Senior tip: hãy coi DTO là **hợp đồng API** và viết test khẳng định hợp đồng đó (snapshot test hoặc kiểm tra danh sách field).`,
  follow: [
    'Khi nào interface projection vẫn load cả entity thay vì chỉ select các cột cần?',
    'Bạn xử lý việc entity mới có thêm field khi API đã dùng DTO như thế nào?'
  ],
  tags: ['DTO projection', 'interface projection', 'constructor expression', 'Query']
},
{
  id: 'jpa-015',
  topic: 'jpa',
  level: 'mid',
  q: 'Mô hình dữ liệu có {{Customer}} là {{Individual}} hoặc {{Company}}. Bạn chọn chiến lược kế thừa nào trong JPA – {{SINGLE_TABLE}}, {{JOINED}} hay {{TABLE_PER_CLASS}} – và trade-off của từng chiến lược ra sao?',
  a: `**Tóm tắt:** Có ba chiến lược kế thừa trong JPA và mỗi cái trả về một dạng vật lý khác nhau. {{SINGLE_TABLE}}: **một** bảng chứa cột của cả lớp cha và lớp con, phân biệt bằng cột **discriminator** – nhanh nhất, truy vấn đơn giản nhưng bảng rộng và nhiều cột nullable. {{JOINED}}: **mỗi lớp một bảng**, lớp con có khoá ngoại trỏ lên bảng cha – chuẩn hoá tốt, constraint riêng cho từng nhánh, nhưng đọc phải join và ghi phải insert nhiều bảng. {{TABLE_PER_CLASS}}: **mỗi lớp một bảng độc lập**, không có bảng cha – truy vấn đa hình phải {{UNION ALL}} nên rất chậm và phân trang gần như không dùng được. Với hầu hết hệ thống nghiệp vụ, {{SINGLE_TABLE}} là lựa chọn mặc định; chuyển sang {{JOINED}} khi mỗi nhánh có nhiều thuộc tính riêng hoặc cần constraint riêng.

### Ba chiến lược
| Tiêu chí | {{SINGLE_TABLE}} | {{JOINED}} | {{TABLE_PER_CLASS}} |
|---|---|---|---|
| Số bảng | 1 | 1 + số lớp con | 1 mỗi lớp |
| Truy vấn đọc | 1 bảng, nhanh | Join bảng cha – con (truy vấn đa hình: outer join mọi bảng con) | {{UNION ALL}} giữa các bảng |
| Ghi | 1 {{INSERT}} | {{INSERT}} vào bảng cha + bảng con | {{INSERT}} vào 1 bảng |
| Constraint theo nhánh | Khó (áp dụng cho cả bảng) | Dễ (mỗi bảng một constraint) | Dễ |
| Bảng rộng / nullable | Rộng, nhiều cột null | Hẹp, chuẩn hoá | Hẹp, trùng cột |
| Phân trang đa hình | Dễ | Được, nhưng nhiều join | Gần như không dùng được |
| Polymorphic query | Dễ (lọc discriminator) | Chậm hơn (outer join tất cả bảng con) | Phải union |

### Ví dụ
~~~java
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
@DiscriminatorColumn(name = "customer_type")
@Table(name = "customer")
public abstract class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false) private String fullName;
}

@Entity
public class Individual extends Customer {
    @Column private String idNumber;        // chi ap dung cho khach le
    private LocalDate birthDate;
}

@Entity
public class Company extends Customer {
    @Column private String taxCode;
    private Instant registeredAt;
}
~~~
Với {{SINGLE_TABLE}}, bảng {{customer}} có cột {{customer_type}} và các cột {{id_number}}, {{birth_date}}, {{tax_code}}, {{registered_at}}. Khi insert một {{Individual}}, các cột của {{Company}} mang giá trị NULL.

Lưu ý: {{@DiscriminatorValue}} cho phép đặt mã discriminator riêng (ví dụ {{"INDIVIDUAL"}} thay vì tên class) – nên dùng mã ngắn và **ổn định**, vì đổi discriminator sau khi đã có dữ liệu sẽ phá hỏng dữ liệu cũ.

### Polymorphic query
~~~java
// JPQL khong co "instanceof"; dung type()
List<Customer> all = em.createQuery("select c from Customer c", Customer.class).getResultList();

List<Customer> companies = em.createQuery(
    "select c from Customer c where type(c) = Company.class", Customer.class).getResultList();
~~~

### Khi nào chọn gì
- {{SINGLE_TABLE}}: cây kế thừa **phẳng**, tổng số cột của tất cả nhánh không lớn (dưới vài chục), đọc nhiều ghi ít. Đây là lựa chọn mặc định.
- {{JOINED}}: mỗi nhánh có **nhiều thuộc tính riêng** và cần constraint riêng (ví dụ {{Company.taxCode}} phải NOT NULL và unique), hoặc cần phân quyền/phân vùng theo từng nhánh.
- {{TABLE_PER_CLASS}}: rất hiếm khi dùng. Chỉ hợp lý khi các lớp con gần như **không liên quan** với nhau và hầu như **không truy vấn đa hình**. Lưu ý: chiến lược này không dùng được {{GenerationType.IDENTITY}} (id phải duy nhất trên mọi bảng, dùng sequence).
- {{@MappedSuperclass}}: không phải kế thừa thật – dùng để gom field chung (địa chỉ, thông tin audit) vào một lớp base mà **không** tạo bảng riêng.

### Pitfall production
- {{SINGLE_TABLE}} với nhiều nhánh tạo ra bảng rộng với nhiều cột NULL – đây là dạng "sparse table". Khi cây kế thừa phình to, cân nhắc tách lại.
- Thêm một cột mới vào lớp con sẽ ảnh hưởng **tất cả** các lớp khác trong bảng. Trên bảng lớn, thêm cột NOT NULL có default cần thao tác cẩn thận (xem câu về schema migration).
- Constraint ở cấp lớp cha áp dụng cho **cả** các lớp con: khai báo {{@NotNull}} trên trường của lớp cha nghĩa là mọi nhánh đều phải có.
- Với {{JOINED}}, đọc một đối tượng cần join 2-3 bảng; nếu thiếu index trên khoá ngoại thì tốn I/O. Bảo đảm index trên các cột khoá ngoại.

> Senior tip: quyết định giữa {{SINGLE_TABLE}} và {{JOINED}} nên dựa trên câu hỏi "**nhánh nào có constraint riêng mà tôi cần DB bảo vệ?**".`,
  follow: [
    'Vì sao {{@MappedSuperclass}} không phải là kế thừa bảng trong JPA?',
    'Khi nào bạn phải chuyển từ {{SINGLE_TABLE}} sang {{JOINED}} và việc đó tốn kém ra sao?'
  ],
  tags: ['inheritance', 'SINGLE_TABLE', 'JOINED', 'TABLE_PER_CLASS', 'MappedSuperclass']
},
{
  id: 'jpa-016',
  topic: 'jpa',
  level: 'senior',
  q: '{{@Transactional(readOnly = true)}} thực sự làm gì với Hibernate và với connection? Nếu bạn muốn đọc từ read replica, cơ chế định tuyến trong Spring hoạt động ra sao?',
  a: `**Tóm tắt:** {{readOnly = true}} là **gợi ý cho 2 lớp khác nhau**. Với Hibernate, nó đặt session ở {{FlushMode.MANUAL}} ⇒ **tắt dirty checking**, không sinh {{UPDATE}} thừa – đây là phần lớn lợi ích. Với JDBC, nó gọi {{Connection.setReadOnly(true)}}; việc server có tôn trọng hay không phụ thuộc hệ thống, nên phải kiểm chứng bằng log SQL ở server. Điều {{readOnly = true}} **không** làm là tự định tuyến sang read replica – cơ chế đó phải xây riêng bằng {{AbstractRoutingDataSource}}.

### Hibernate làm gì
1. Đặt {{FlushMode.MANUAL}}: Hibernate **không** flush tự động. Hệ quả trực tiếp: không có {{UPDATE}} do dirty checking ⇒ giảm CPU và traffic ghi.
2. Bỏ qua cơ chế flush trước query ⇒ nhưng cũng nghĩa là **thay đổi trong bộ nhớ sẽ không được đẩy xuống DB**.
3. Một số tối ưu hoá khác: bỏ qua việc tạo snapshot phục vụ dirty checking, và với PostgreSQL driver, có thể được ánh xạ thành transaction read-only ở mức server.

### JDBC làm gì
- {{Connection.setReadOnly(true)}} là **gợi ý**. Với PostgreSQL, driver có thể dịch nó thành transaction read-only; với MySQL Connector/J nó cũng có thể được đẩy xuống server ({{SET SESSION TRANSACTION READ ONLY}}) tuỳ cấu hình driver.
- Lợi ích thật sự khi server enforce read-only: truy vấn ghi sẽ **bị từ chối** ⇒ đây là một "lưới an toàn" phát hiện bug, không phải tối ưu hiệu năng.

### Spring Data JPA đã làm gì sẵn
Trong Spring Data JPA, {{SimpleJpaRepository}} đánh dấu các method đọc là read-only và method ghi là read-write. Vấn đề: đặt {{@Transactional}} (mặc định read-write) ở tầng service sẽ **ghi đè** cờ read-only của repository ⇒ mất luôn lợi ích.

### Bẫy lớn nhất: flush MANUAL nuốt mất thay đổi
Vì {{FlushMode.MANUAL}}, nếu trong transaction read-only có ai đó gọi {{save()}}, thay đổi **không được flush** ⇒ commit xong mà dữ liệu vẫn là dữ liệu cũ, **không có lỗi nào**. Đây là loại bug rất đáng sợ vì nó im lặng.
- Quy ước trong team: method read-only **không bao giờ** ghi.
- Dùng {{@Transactional(readOnly = true)}} kèm kiểm thử: nếu DB enforce read-only, lỗi sẽ lộ ra ngay.
- Không bật read-only ở tầng repository dùng chung (vì có cả method ghi); chỉ bật ở **service** hoặc ở các repository chỉ đọc.

### Định tuyến sang read replica
~~~java
public class RoutingDataSource extends AbstractRoutingDataSource {
    @Override
    protected Object determineCurrentLookupKey() {
        // chi doc trong transaction read-only -> sang replica
        return TransactionSynchronizationManager.isCurrentTransactionReadOnly() ? "replica" : "primary";
    }
}

@Bean
DataSource dataSource() {
    Map<Object, Object> targets = Map.of(
        "primary",  primaryDataSource,
        "replica", replicaDataSource);
    RoutingDataSource routing = new RoutingDataSource();
    routing.setTargetDataSources(targets);
    routing.setDefaultTargetDataSource(primaryDataSource);
    // LazyConnectionDataSourceProxy: de connection thuc su duoc mo sau khi da quyet dinh routing
    return new LazyConnectionDataSourceProxy(routing);
}
~~~
Ba điểm kỹ thuật cần nhớ:
- Phải bọc bằng {{LazyConnectionDataSourceProxy}}, nếu không connection sẽ bị mở quá sớm (lúc khởi tạo transaction) trước khi cờ read-only được xác định.
- {{determineCurrentLookupKey()}} được gọi **mỗi lần** lấy connection.
- Với **JPA**, mọi thao tác phải nằm trong transaction để cờ read-only có hiệu lực.
- **Hibernate có thể mở connection riêng** cho một số thao tác (ví dụ đọc metadata lúc khởi động, {{TableGenerator}} sinh id trong transaction riêng) – cần kiểm tra rằng chúng đi về primary.
- Cần **pool riêng** cho replica: primary và replica là hai hệ thống khác nhau, dùng chung một pool là sai.

### Pitfall production
- **Đọc từ replica sau khi ghi** sẽ không thấy dữ liệu vừa ghi (replication lag). Với dữ liệu tài chính (số dư, trạng thái giao dịch), hãy đọc từ primary.
- **Chuyển truy vấn đọc nặng** (báo cáo, xuất file) để đọc replica, nhưng **không** để luồng nghiệp vụ chính phụ thuộc replica.
- Nếu cache ở tầng ứng dụng được điền từ replica, dữ liệu sẽ cũ hơn – phải ghi nhận điều này khi thiết kế TTL.
- Bật read-only trên **mọi** method đọc có thể làm hỏng chỗ cần đọc rồi ghi trong cùng transaction (ví dụ đọc để validate rồi update). Hãy chỉ bật ở method thực sự chỉ đọc.

> Senior tip: hãy tách hai quyết định: **"câu query này có cần ghi không?"** (dùng {{readOnly}} để tiết kiệm CPU) và **"dữ liệu này có được phép đọc bản cũ không?"** (quyết định định tuyến replica). Với hệ thống ngân hàng, số dư, hạn mức và trạng thái giao dịch luôn phải đọc từ primary.`,
  follow: [
    'Vì sao {{@Transactional(readOnly = true)}} có thể làm mất thay đổi dữ liệu mà không báo lỗi?',
    'Bạn xử lý việc đọc từ replica ngay sau khi ghi như thế nào để bảo đảm read-your-writes?'
  ],
  tags: ['readOnly', 'FlushMode', 'routing datasource', 'read replica', 'lazy connection']
},
{
  id: 'jpa-017',
  topic: 'jpa',
  level: 'lead',
  q: 'Bạn cần audit ai đã sửa dữ liệu khách hàng và không được xoá hẳn bản ghi. Spring Data auditing, Hibernate Envers và soft delete với {{@SQLDelete}}/{{@SQLRestriction}} khác nhau thế nào, và chọn gì cho hệ thống ngân hàng?',
  a: `**Tóm tắt:** Đây là ba nhu cầu khác nhau, hay bị gộp làm một. **Spring Data JPA auditing** ghi vào chính bảng dữ liệu ({{createdDate}}, {{lastModifiedBy}}) – chỉ lưu trạng thái **hiện tại**, rất nhẹ. **Hibernate Envers** ghi vào bảng audit riêng, lưu **toàn bộ lịch sử** mỗi lần insert/update/delete – nặng hơn nhưng là thứ auditor cần. **Soft delete** không xoá dữ liệu vật lý mà chuyển trạng thái, với {{@SQLDelete}} để đổi lệnh {{DELETE}} thành {{UPDATE}} và {{@SQLRestriction}} để loại bản ghi đã xoá khỏi mọi truy vấn.

### 1. Spring Data JPA auditing
~~~java
@Entity
@EntityListeners(AuditingEntityListener.class)
public class Customer {
    @CreatedDate @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate @Column(nullable = false)
    private Instant updatedAt;

    @CreatedBy @Column(updatable = false, length = 64)
    private String createdBy;

    @LastModifiedBy
    private String updatedBy;
}
~~~
- Bật bằng {{@EnableJpaAuditing}} và cung cấp bean {{AuditorAware}} để Spring biết "ai là user hiện tại" (thường đọc từ {{SecurityContextHolder}}).
- Chạy qua JPA lifecycle callback ({{@PrePersist}}/{{@PreUpdate}}), nên hoạt động với repository lẫn {{entityManager.persist()}}/dirty checking; nhưng raw SQL, native query và JPQL bulk update thì **không** được ghi nhận.
- **Không có lịch sử**: sửa 10 lần thì chỉ còn dấu vết của lần sửa cuối.
- Ứng dụng đa tenant: nên thêm cột {{tenant_id}} vào bảng audit thay vì chỉ lưu user id.

### 2. Hibernate Envers
~~~java
@Entity
@Audited(withModifiedFlag = true)
@Table(name = "customer")
public class Customer { ... }
~~~
- Bật bằng cách thêm dependency {{hibernate-envers}} và đánh {{@Audited}}; bảng audit mặc định có hậu tố {{_AUD}} (đổi qua {{hibernate.envers.audit_table_suffix}}) cùng bảng {{REVINFO}}, tạo bằng migration.
- Mỗi lần insert/update/delete tạo một **revision** trong bảng audit, lưu ảnh chụp các field được audit.
- Có thể truy vấn lịch sử bằng {{AuditReader}} của Envers, hoặc dùng native query vào bảng audit.
- Tuỳ chọn hữu ích: {{@Audited(withModifiedFlag = true)}} để biết field nào thay đổi; {{@NotAudited}} để loại trừ field nhạy cảm (ví dụ {{passwordHash}}) khỏi bảng audit.
- **Chi phí**: mỗi lần update = 1 câu ghi bảng audit; bảng audit phình rất nhanh và cần chính sách lưu trữ riêng.
- Với entity có **quan hệ**, entity đích cũng phải {{@Audited}}, hoặc khai báo {{targetAuditMode = RelationTargetAuditMode.NOT_AUDITED}} – nếu không Envers báo lỗi khi khởi động.

### 3. Soft delete
~~~java
@Entity
@SQLDelete(sql = "UPDATE customer SET deleted = true, deleted_at = now() " +
                 "WHERE id = ? AND deleted = false")
@SQLRestriction("deleted = false")     // Hibernate 6.3+ thay the @Where da bi deprecated
@Table(name = "customer")
public class Customer {
    @Id private Long id;
    private boolean deleted;
    private Instant deletedAt;
}
~~~
- {{@SQLDelete}}: khi gọi {{entityManager.remove()}}, Hibernate **ghi lệnh UPDATE** thay vì {{DELETE}}.
- {{@SQLRestriction}}: mọi truy vấn JPQL/Criteria của entity đó **tự động** thêm điều kiện {{deleted = false}}.
- **Bẫy nguy hiểm**: JPQL bulk delete (xem câu về bulk update) **không** dùng {{@SQLDelete}} ⇒ nó sẽ xoá thật, còn xoá thường thì chỉ ẩn đi.
- **Unique constraint vẫn chiếm**: email của khách hàng đã xoá vẫn không cho đăng ký lại. Cách xử lý: unique index **partial** trên PostgreSQL: {{CREATE UNIQUE INDEX ux_customer_email ON customer(email) WHERE deleted = false}}.
- Dữ liệu tích luỹ: bảng chỉ lớn dần, cần chính sách archive và định kỳ chuyển sang bảng lịch sử.
- Nếu cần lọc theo điều kiện chạy lúc (ví dụ "chỉ hiện dữ liệu của chi nhánh X"), dùng {{@Filter}} và {{@FilterDef}} để bật/tắt filter theo tham số.

### Ba lớp nên dùng kết hợp
| Tầng | Công cụ | Lưu giữ | Dùng cho |
|---|---|---|---|
| Bảng chính | Spring Data auditing | Trạng thái hiện tại | Biết ai sửa lần cuối, lọc theo ngày |
| Bảng audit | Hibernate Envers | Toàn bộ lịch sử | Đối chiếu, audit, truy vết |
| Bảng chính | Soft delete | Bản ghi "đã xoá" vẫn còn | Đáp ứng quy định không xoá vật lý |

### Pitfall production
- **Bật auditing nhưng quên {{AuditorAware}}** ⇒ trường {{createdBy}} luôn null.
- Dùng chung với Envers: các cột {{updatedAt}}/{{updatedBy}} cũng nằm trong mỗi revision (thường có ích); ngoài ra nên dùng custom revision entity ({{@RevisionEntity}}) để lưu user vào {{REVINFO}}.
- **Envers + soft delete** không tương thích tự nhiên: xoá mềm là {{UPDATE}} nên Envers sẽ ghi một revision dạng UPDATE, không phải DELETE ⇒ lịch sử không ghi nhận "đã xoá".
- **Xoá mềm làm hỏng foreign key semantics**: dòng "đã xoá" vẫn còn và vẫn được tham chiếu. Nếu nghiệp vụ coi dòng đã xoá là không tồn tại thì phải xử lý ở tầng ứng dụng.

> Senior tip: bắt đầu từ câu hỏi **"ai cần đọc lại lịch sử này, vào lúc nào, để làm gì?"**. Chỉ cần xem cập nhật gần nhất thì Spring Data auditing là đủ. Cần dựng lại trạng thái tại thời điểm T thì cần Envers. Dữ liệu không được xoá vì quy định thì cần soft delete. Cái sai lầm phổ biến là bật cả ba "cho an toàn" rồi phát hiện bảng audit phình to và làm chậm hệ thống.`,
  follow: [
    'Vì sao JPQL bulk delete không dùng {{@SQLDelete}} và hậu quả là gì?',
    'Làm sao cho khách hàng đăng ký lại email đã xoá mềm mà vẫn giữ unique constraint?'
  ],
  tags: ['auditing', 'Envers', 'SQLDelete', 'SQLRestriction', 'soft delete']
},
{
  id: 'jpa-018',
  topic: 'jpa',
  level: 'mid',
  q: 'JPA, Hibernate và Spring Data JPA: mối quan hệ giữa ba cái này là gì, và mỗi cái chịu trách nhiệm gì?',
  a: `**Tóm tắt:** Ba cái này là **ba tầng khác nhau**. **JPA (Jakarta Persistence)** là **chuẩn (specification/interface)** – định nghĩa API ({{EntityManager}}, {{Entity}}, {{@Entity}}, {{@Table}}, JPQL, Criteria API). **Hibernate** là **provider (implementation)** phổ biến nhất của JPA – triển khai đầy đủ JPA và thêm tính năng riêng ({{@Filter}}, {{@BatchSize}}, Envers, custom type, L2 cache). **Spring Data JPA** là **abstraction tầng trên** – sinh repository interface, derived query method, {{@Query}}, paging, auditing – nó **dùng Hibernate làm provider mặc định**.
 
### Mối quan hệ
~~~text
Spring Data JPA (Repository abstraction)
       │
       ▼
Hibernate (JPA Provider + extensions)
       │
       ▼
JPA Spec (Jakarta Persistence API)
~~~

### Ai làm gì
| Tầng | Trách nhiệm | Ví dụ |
|---|---|---|
| **JPA Spec** | Định nghĩa annotation, interface, JPQL | {{@Entity}}, {{EntityManager}}, {{@NamedQuery}} |
| **Hibernate** | Triển khai JPA, quản lý session, cache, SQL generation | {{Session}}, {{HibernateCriteriaBuilder}}, {{@BatchSize}}, Envers |
| **Spring Data JPA** | Giảm boilerplate, repository interface, query derivation | {{JpaRepository}}, {{findByNameLike}}, {{@Query}}, {{Pageable}} |

### Khi nào dùng cái nào
- **JPA API trực tiếp** ({{EntityManager}}): cần kiểm soát tinh vi (flush, clear, lock mode, native query phức tạp).
- **Hibernate API** ({{Session}}, {{StatelessSession}}): cần tính năng Hibernate-only ({{@Filter}}, {{@Formula}}, Envers, custom type).
- **Spring Data JPA** ({{JpaRepository}}): 90% trường hợp CRUD, query thông thường – code ngắn, test dễ.

### Pitfall production
- Gọi {{entityManager.unwrap(Session.class)}} để dùng API Hibernate – làm code gắn chặt vào Hibernate, khó đổi provider sau này.
- Dùng Spring Data JPA mà không hiểu JPQL/Hibernate sinh ra SQL gì ⇒ N+1, query chậm, fetch plan sai.
- Spring Data JPA **không** thay thế Hibernate – nó là lớp vỏ. Hiểu được Hibernate mới debug được sự cố hiệu năng.

> Senior tip: trong phỏng vấn, câu trả lời tốt là: "JPA là interface, Hibernate là implementation, Spring Data JPA là repository abstraction dùng Hibernate. Tôi code chủ yếu Spring Data JPA, nhưng khi cần tối ưu hiệu năng tôi dùng {{EntityManager}} hoặc Hibernate {{Session}} trực tiếp, và luôn đọc SQL sinh ra bằng {{show-sql}} hoặc {{p6spy}}."`,
  follow: [
    'Có thể dùng Spring Data JPA với provider khác Hibernate không (ví dụ EclipseLink)?',
    'Tại sao Spring Data JPA gọi là "abstraction" chứ không phải "implementation"?'
  ],
  tags: ['JPA', 'Hibernate', 'Spring Data JPA', 'spec', 'provider', 'abstraction']
},
{
  id: 'jpa-019',
  topic: 'jpa',
  level: 'senior',
  q: '{{save}}, {{saveAndFlush}}, {{persist}}, {{merge}} khác nhau thế nào? {{findById}} và {{getReferenceById}} có gì khác biệt?',
  a: `**Tóm tắt:** Đây là năm method khiến nhiều dev nhầm lẫn. {{save}} (Spring Data) = {{persist}} nếu entity mới (id null) hoặc {{merge}} nếu entity đã có id – **luôn trả về entity managed**. {{saveAndFlush}} = {{save}} + {{flush}} ngay. {{persist}} (JPA) chỉ dành cho entity **mới (transient)**, ném exception nếu id đã tồn tại. {{merge}} (JPA) sao chép state từ entity detached sang managed instance – **trả về bản sao**, entity gốc vẫn detached. {{findById}} trả {{Optional}} và **load ngay** (SELECT). {{getReferenceById}} trả **proxy** (không query DB) – dùng khi chỉ cần set FK, không cần dữ liệu entity.
 
### So sánh chi tiết
| Method | Nguồn | Entity mới (transient) | Entity đã có id (detached) | Trả về | Flush |
|---|---|---|---|---|---|
| {{save}} | Spring Data | persist | merge | Managed entity | Không (tuỳ transaction) |
| {{saveAndFlush}} | Spring Data | persist + flush | merge + flush | Managed entity | **Có** (ngay) |
| {{persist}} | JPA | **OK** | **Lỗi** (EntityExistsException) | void | Không |
| {{merge}} | JPA | persist (như mới) | **Sao chép state -> bản sao managed** | **Bản sao managed** | Không |

### {{findById}} vs {{getReferenceById}}
~~~java
// findById: SELECT * FROM ... WHERE id = ? -> trả Optional<Entity>
Optional<Order> opt = orderRepo.findById(id);  // load ngay, có thể trả Optional.empty()

// getReferenceById: KHÔNG query DB, trả proxy (chỉ có id)
Order ref = orderRepo.getReferenceById(id);    // ném EntityNotFoundException khi DÙNG proxy (gọi method)
~~~
- Dùng {{getReferenceById}} khi **chỉ cần set khóa ngoại** (ví dụ: {{item.setOrder(orderRepo.getReferenceById(orderId))}}) – tiết kiệm 1 query SELECT.
- Proxy chỉ query DB (và ném exception nếu không tồn tại) **khi được khởi tạo** – tức lúc gọi getter khác {{getId()}} – không phải lúc trả về.

### Pitfall production
- **{{save}} trên entity detached có id** -> gọi {{merge}} -> tạo bản sao -> entity gốc không được cập nhật nữa -> bug "lưu mà không thấy thay đổi".
- **{{merge}} trả về bản sao** – nếu bạn giữ tham chiếu entity gốc và tiếp tục sửa, thay đổi sẽ **không** được lưu.
- **{{getReferenceById}} dùng sai chỗ** (cần đọc dữ liệu) -> ném exception lúc render view/serialize JSON.
- {{saveAndFlush}} dùng để lấy generated id ngay (ví dụ IDENTITY) – nhưng với IDENTITY thì {{save}} đã thực thi INSERT ngay để lấy id (dù không flush các thay đổi khác).

> Senior tip: quy tắc đơn giản: **mặc định dùng {{save}}** (Spring Data). Chỉ dùng {{saveAndFlush}} khi cần id generated ngay hoặc cần xem lỗi constraint ngay. Không dùng {{persist}}/{{merge}} trực tiếp trừ khi viết custom repository. Với FK, dùng {{getReferenceById}} để tránh SELECT thừa.`,
  follow: [
    'Vì sao {{merge}} trả về bản sao mà không cập nhật entity gốc?',
    'Khi nào {{getReferenceById}} ném exception, và exception đó là loại gì?'
  ],
  tags: ['save', 'saveAndFlush', 'persist', 'merge', 'findById', 'getReferenceById']
},
{
  id: 'jpa-020',
  topic: 'jpa',
  level: 'senior',
  q: 'CascadeType các loại (PERSIST, MERGE, REMOVE, REFRESH, DETACH, ALL) và bẫy REMOVE trên ManyToMany. FetchType mặc định của @OneToMany, @ManyToOne, @OneToOne, @ManyToMany là gì?',
  a: `**Tóm tắt:** {{CascadeType}} quyết định thao tác nào trên entity cha được **nhân bản** xuống entity con. {{FetchType}} quyết định quan hệ được load **EAGER** (ngay) hay **LAZY** (khi truy cập). Mặc định: {{@ManyToOne}} và {{@OneToOne}} là **EAGER**; {{@OneToMany}} và {{@ManyToMany}} là **LAZY**. Bẫy lớn nhất: {{cascade = REMOVE}} trên {{@ManyToMany}} sẽ xoá entity con được tham chiếu bởi nhiều cha – mất dữ liệu.
 
### CascadeType
| Cascade | Khi cha persist/merge/remove/refresh/detach thì con... |
|---|---|
| {{PERSIST}} | Được persist theo |
| {{MERGE}} | Được merge theo |
| {{REMOVE}} | **Được xoá theo** (nguy hiểm!) |
| {{REFRESH}} | Được refresh theo |
| {{DETACH}} | Được detach theo |
| {{ALL}} | Tất cả trên |

### Mặc định FetchType
| Quan hệ | Mặc định | Khuyến nghị |
|---|---|---|
| {{@ManyToOne}} | **EAGER** | Luôn đặt {{fetch = FetchType.LAZY}} tường minh |
| {{@OneToOne}} | **EAGER** | Đặt LAZY ở owning side (có FK); phía {{mappedBy}} thì LAZY thường không có tác dụng – dùng {{@MapsId}} hoặc map một chiều |
| {{@OneToMany}} | **LAZY** | Giữ LAZY, dùng {{@BatchSize}} |
| {{@ManyToMany}} | **LAZY** | Giữ LAZY |

### Bẫy REMOVE trên ManyToMany
~~~java
@Entity
public class Student {
    @ManyToMany(cascade = {CascadeType.PERSIST, CascadeType.REMOVE})  // SAI!
    @JoinTable(name = "student_course",
        joinColumns = @JoinColumn(name = "student_id"),
        inverseJoinColumns = @JoinColumn(name = "course_id"))
    private Set<Course> courses = new HashSet<>();
}
~~~
Khi xoá một {{Student}}, Hibernate sẽ **cố xoá luôn các {{Course}}** trong tập hợp – dù {{Course}} vẫn được tham chiếu bởi {{Student}} khác: nhẹ thì lỗi vi phạm FK ở bảng join, nặng thì mất dữ liệu dùng chung (nếu FK có ON DELETE CASCADE)! Đúng là chỉ xoá quan hệ (xóa dòng trong bảng join), không xoá entity con.

### Cách đúng
- **Không bao giờ** dùng {{CascadeType.REMOVE}} trên {{@ManyToMany}}.
- Muốn xoá quan hệ: gọi {{student.getCourses().clear()}} trên **owning side** – Hibernate tự xoá các dòng trong bảng join ({{@ManyToMany}} không hỗ trợ {{orphanRemoval}}).
- Với {{@OneToMany}} (cha - con sở hữu): {{orphanRemoval = true}} là an toàn vì con chỉ thuộc về một cha.

### Pitfall production
- Mặc định EAGER của {{@ManyToOne}}/{{@OneToOne}} là nguyên nhân hàng đầu của N+1 "ngầm" – luôn override thành LAZY.
- {{cascade = ALL}} trên quan hệ có nhiều cha (ManyToMany, hoặc ManyToOne dùng chung entity con) sẽ gây xoá lan man hoặc merge trùng lặp.
- {{@OneToOne}} LAZY hoạt động bình thường ở **owning side** (giá trị FK cho biết null hay không). Ở **phía {{mappedBy}}**, bảng không có FK nên Hibernate phải query để biết có bản ghi hay không ⇒ vẫn load ngay; giải pháp: {{@MapsId}} (chia sẻ PK), bytecode enhancement, hoặc chỉ map một chiều.

> Senior tip: trong review, hãy soi mọi {{@ManyToOne}} và {{@OneToOne}}: nếu không có {{fetch = FetchType.LAZY}} thì là bug tiềm ẩn. Với {{cascade}}, chỉ dùng {{PERSIST}} và {{MERGE}} cho aggregate root; {{REMOVE}} chỉ dùng cho quan hệ sở hữu thực sự (OneToMany với orphanRemoval).`,
  follow: [
    'Vì sao @OneToOne mặc định EAGER lại gây N+1 nhiều hơn @ManyToOne?',
    'Khi nào nên dùng CascadeType.DETACH?'
  ],
  tags: ['CascadeType', 'FetchType', 'EAGER', 'LAZY', 'orphanRemoval', 'ManyToMany']
},
{
  id: 'jpa-021',
  topic: 'jpa',
  level: 'senior',
  q: 'Derived query method, {{@Query}} JPQL vs native SQL, và phân trang với {{Pageable}} – câu count được sinh ra như thế nào?',
  a: `**Tóm tắt:** Spring Data JPA cho ba cách viết query: **derived method** (tên method quy ước -> JPQL), **{{@Query}} JPQL** (type-safe, DTO projection), **native SQL** (tận dụng tính năng DB). Với {{Pageable}}, Spring Data sinh **hai câu query**: một câu data (có LIMIT/OFFSET) và một câu **count** ({{SELECT count(*)}}) – count query **không** có ORDER BY nhưng **giữ WHERE/JOIN**.
 
### Ba cách viết query
| Cách | Ví dụ | Ưu | Nhược |
|---|---|---|---|
| Derived method | {{List<Order> findByCustomerIdAndStatus(Long customerId, OrderStatus status);}} | Không viết JPQL, được kiểm tra lúc khởi động (sai tên field là app không start) | Tên method dài, khó đọc khi phức tạp |
| {{@Query}} JPQL | {{@Query("select o from Order o where o.customer.id = :cid and o.status = :st")}} | DTO projection, join fetch, flexible | JPQL chuẩn hạn chế; HQL của Hibernate 6 đã có window function, CTE nhưng vẫn không phủ hết SQL |
| Native SQL | {{@Query(value = "select * from orders where customer_id = ?1", nativeQuery = true)}} | Toàn quyền SQL, hint DB-specific | Mất type-safe, khóa chặt dialect |

### Derived method - từ khóa phổ biến
| Từ khóa | JPQL sinh ra |
|---|---|
| {{findBy...}} | {{WHERE ... = ?}} |
| {{findBy...Like}} | {{WHERE ... LIKE ?}} |
| {{findBy...Between}} | {{WHERE ... BETWEEN ? AND ?}} |
| {{findBy...In}} | {{WHERE ... IN ?}} |
| {{findBy...IsNull / IsNotNull}} | {{WHERE ... IS NULL}} |
| {{findTop10By...}} | {{LIMIT 10}} |
| {{findFirstBy...}} | {{LIMIT 1}} |

### Pageable và câu count
~~~java
Page<Order> findByCustomerId(Long customerId, Pageable pageable);
~~~
Khi gọi {{repo.findByCustomerId(1L, PageRequest.of(0, 20))}}, Spring Data sinh:
1. **Data query**: {{SELECT * FROM orders WHERE customer_id = 1 LIMIT 20 OFFSET 0}} (chỉ có ORDER BY khi {{Pageable}} có {{Sort}} – không sort thì thứ tự giữa các trang không được bảo đảm)
2. **Count query**: {{SELECT count(*) FROM orders WHERE customer_id = 1}} (không ORDER BY, không LIMIT)

### Tối ưu count query
- Trên bảng lớn, count query chậm. Cách giảm tải:
  - Dùng {{Slice}} thay {{Page}}: chỉ trả {{hasNext}}, **không chạy count query**.
  - {{@Query(value = "...", countQuery = "select count(o) from Order o where o.customerId = :cid")}}: tuỳ chỉnh count query cho gọn hơn (bỏ join/fetch không làm thay đổi số dòng). Điều kiện lọc phải **giống hệt** data query, nếu không tổng số trang sẽ sai.
  - Cache count với Redis (TTL ngắn) cho báo cáo không cần real-time.

### Pitfall production
- Derived method tên quá dài -> khó bảo trì, refactor entity làm vỡ method name.
- {{@Query}} JPQL với {{LEFT JOIN FETCH}} + {{Pageable}} -> lỗi in-memory pagination (xem câu HHH90003004).
- Native query + {{Pageable}}: Spring Data vẫn thêm LIMIT/OFFSET, nhưng việc tự suy ra count query từ SQL phức tạp dễ sai – nên khai báo {{countQuery}} tường minh; {{Sort}} phải dùng tên cột thật.
- Count query kế thừa JOIN từ data query -> nếu data query join nhiều bảng, count query cũng join -> chậm. Viết countQuery tùy chỉnh khi cần.

> Senior tip: với API phân trang danh sách, **mặc định dùng {{Slice}}** (trả hasNext, không count) – nhanh hơn hẳn trên bảng lớn. Chỉ dùng {{Page}} khi UI thực sự cần "trang 5/120".`,
  follow: [
    'Vì sao count query không có ORDER BY?',
    'Khi nào nên viết countQuery tùy chỉnh cho @Query?'
  ],
  tags: ['derived query', 'Query', 'JPQL', 'native SQL', 'Pageable', 'count query']
},
{
  id: 'db-012',
  topic: 'db',
  level: 'senior',
  q: 'PostgreSQL dùng MVCC: một {{UPDATE}} tạo ra một phiên bản dòng mới thì điều gì xảy ra với dữ liệu cũ? VACUUM, bloat và transaction ID wraparound liên quan gì đến nhau, và transaction dài gây hại ra sao?',
  a: `**Tóm tắt:** Trong MVCC của PostgreSQL, mỗi dòng mang {{xmin}} (transaction id tạo ra nó) và {{xmax}} (transaction id xoá/cập nhật nó). Mỗi lần {{UPDATE}} tạo **một tuple mới** và đánh dấu tuple cũ bằng {{xmax}} – dữ liệu cũ **không bị xoá ngay**, nó thành **dead tuple** và chỉ được dọn khi {{VACUUM}} chạy. Tích luỹ dead tuple tạo ra **bloat**. Song song, transaction id là 32 bit (~4,3 tỷ); nếu vòng sắp hết mà tuple cũ chưa được "đóng băng" thì xảy ra **wraparound** và PostgreSQL có thể **từ chối nhận lệnh ghi**. **Transaction dài là thủ phạm của cả hai**.

### Tuple version hoạt động thế nào
~~~sql
-- Ban dau
BEGIN;                        -- xid = 100
UPDATE account SET balance = 200 WHERE id = 1;
-- ket qua: tuple moi (xmin=100, xmax=0), tuple cu (xmin=90, xmax=100)

-- Transaction khac doc
BEGIN;                        -- snapshot se khong thay tuple cu
SELECT balance FROM account WHERE id = 1;   -- 200
COMMIT;

~~~
Chuỗi phiên bản được nối bằng {{xmin}}/{{xmax}}. Đọc không chặn ghi và ghi không chặn đọc – đó là ưu điểm lớn của MVCC. Cái giá là **dead tuple** và **bloat**.

### VACUUM làm gì
| Lệnh | Tác dụng | Rủi ro |
|---|---|---|
| {{VACUUM}} | Dọn dead tuple, cập nhật free space map, đóng băng tuple đủ cũ | Không trả dung lượng cho OS; rẻ |
| {{VACUUM FULL}} | Viết lại toàn bộ bảng vào file mới, thu gọn file | Khoá **ACCESS EXCLUSIVE**, chặn mọi truy vấn |
| {{ANALYZE}} | Cập nhật thống kê cho optimizer | Rất rẻ, nên chạy thường xuyên |

- {{VACUUM}} thường (không FULL) **không** giải phóng dung lượng cho hệ điều hành; nó chỉ đánh dấu khoảng trống để lần ghi sau dùng lại.
- {{VACUUM}} có xoá các entry chết trong index, nhưng **không** gộp trang hay thu nhỏ index ⇒ index đã bloat vẫn to; cần {{REINDEX CONCURRENTLY}} cho index bị bloat nặng.

### Bloat và autovacuum
Autovacuum kích hoạt khi số dead tuple vượt ngưỡng: {{autovacuum_vacuum_threshold}} (mặc định 50) cộng {{autovacuum_vacuum_scale_factor}} (mặc định 0,2) lần số dòng của bảng.
- Với bảng **1 tỷ dòng**, ngưỡng là 200 triệu dead tuple trước khi autovacuum chạy ⇒ bloat khổng lồ và query chậm dần trong nhiều tuần.
- Cách xử lý chuẩn: đặt tham số **theo từng bảng** cho bảng lớn:
~~~sql
ALTER TABLE transaction_log SET (
    autovacuum_vacuum_scale_factor = 0.02,
    autovacuum_vacuum_threshold  = 1000,
    autovacuum_analyze_scale_factor = 0.01

);
~~~
- Đo bloat: {{pg_stat_user_tables.n_dead_tup}} (ước tính), hoặc extension {{pgstattuple}}; tiến trình vacuum đang chạy xem ở {{pg_stat_progress_vacuum}}.

### Transaction ID wraparound
- Transaction id là 32 bit (~4,29 tỷ giá trị) và được so sánh theo vòng tròn, nên tại một thời điểm chỉ ~2,1 tỷ xid là "quá khứ". Với hệ thống ghi nhiều, có thể chạm ngưỡng trong vài tuần đến vài tháng nếu không freeze.
- Vì vậy VACUUM **đóng băng (freeze)** các tuple đủ cũ: đánh dấu tuple là frozen (cờ trong header tuple) để nó được coi là "cũ hơn mọi transaction", không cần so sánh {{xmin}} nữa.
- Tham số {{autovacuum_freeze_max_age}} (mặc định 200 triệu) quyết định khi nào bắt buộc đóng băng, bảo đảm còn dư chừa trước khi wrap.
- **Nguy hiểm**: nếu transaction còn giữ {{xmin}} cũ thì tuple cũ không thể đóng băng, wraparound tiến sát và PostgreSQL có thể từ chối mọi lệnh ghi để tránh mất dữ liệu.

### Transaction dài gây hại thế nào
1. **Giữ snapshot cũ** ⇒ dead tuple không thể dọn ⇒ bloat tích luỹ nhanh nhất khi có update/delete lớn.
2. **Giữ xmin cũ** ⇒ chặn đóng băng ⇒ đẩy wraparound về gần ⇒ rủi ro DB ngừng nhận ghi.
3. **Giữ lock** ⇒ chặn mọi DDL trên bảng đó; tệ hơn, DDL đang chờ lock lại chặn mọi query xếp hàng sau nó.
4. **Tốn connection** trong pool ứng dụng ⇒ giảm throughput toàn hệ thống.
5. Thủ phạm thường gặp nhất là **{{idle in transaction}}** – connection đã trả kết quả nhưng transaction chưa commit.

Cách phòng tránh:
~~~sql
-- Dat o cap session/app
SET idle_in_transaction_session_timeout = '60s';
SET statement_timeout = '30s';
SET lock_timeout = '5s';
~~~
({{transaction_timeout}} xuất hiện từ PostgreSQL 17 để giới hạn cả thời gian toàn transaction.)

### Pitfall production
- **Tắt autovacuum** để "tránh gián đoạn" là một sai lầm rất phổ biến: bảng sẽ phình to kinh khủng, và anti-wraparound vacuum cuối cùng vẫn sẽ chạy cưỡng bức vào lúc tệ nhất.
- **Index bloat** không được {{VACUUM}} thu gọn; phải {{REINDEX CONCURRENTLY}} (chạy ngoài transaction) theo lịch.
- **Bảng tăng trưởng nhanh**: với bảng append-only, hãy partition theo thời gian để xoá dữ liệu cũ bằng {{DROP TABLE}} partition (hoặc DETACH rồi DROP) thay vì {{DELETE}} hàng triệu dòng.
- **Bảng tạm (temp table)**: autovacuum không xử lý được temp table; với connection pool, session gần như không bao giờ kết thúc nên temp table không bị drop, tích dead tuple và giữ tuổi XID – luôn drop (hoặc {{ON COMMIT DROP}}).

> Senior tip: hãy theo dõi **tỉ lệ dead tuple và tuổi transaction** như hai metric hàng ngày. Kinh nghiệm thực tế: phần lớn sự cố "database chậm không rõ nguyên nhân" đều truy vết ngược lại được tới một hoặc vài session {{idle in transaction}} kéo dài. Một câu lệnh giám sát đơn giản – {{SELECT count(*) FROM pg_stat_activity WHERE state = 'idle in transaction'}} – đã có thể cứu một sự cố nghiêm trọng.`,
  follow: [
    'Vì sao {{VACUUM}} không giải phóng dung lượng đĩa cho hệ điều hành?',
    'Một transaction đang chạy 3 tiếng có thể gây ra những hậu quả nào cho cả hệ thống?'
  ],
  tags: ['MVCC', 'VACUUM', 'bloat', 'wraparound', 'autovacuum']
},
{
  id: 'db-013',
  topic: 'db',
  level: 'senior',
  q: 'PostgreSQL có nhiều loại index: B-tree, partial, expression, GIN, BRIN. Mỗi loại giải quyết bài toán gì, khi nào optimizer không dùng được, và bạn chọn loại nào cho bảng log giao dịch khổng lồ?',
  a: `**Tóm tắt:** B-tree là mặc định và giải quyết tốt equality, range và {{ORDER BY}}. Các loại index khác làm được những điều B-tree không làm: **partial index** chỉ lập chỉ mục một phần dữ liệu (nhỏ, rẻ, hợp với trạng thái "chờ xử lý"); **expression index** lập chỉ mục theo **biểu thức** nên query phải viết **đúng biểu thức đó**; **GIN** là inverted index cho JSONB, mảng, full-text; **BRIN** là index cực nhỏ dựa trên **tương quan vật lý**, dành cho bảng append-only tăng dần theo thời gian. Điểm cần nhớ nhất: **optimizer chỉ dùng được index khi chứng minh được điều kiện query bao hàm điều kiện của index**.

### Các loại index
| Loại | Dùng cho | Lưu ý |
|---|---|---|
| B-tree | Equality, range, {{ORDER BY}}, prefix | Mặc định, đa năng |
| Partial | Query có điều kiện cố định | Nhỏ và rẻ, nhưng điều kiện phải khớp |
| Expression | Hàm/biểu thức trên cột | Query phải viết đúng biểu thức |
| GIN | JSONB, array, full-text | Ghi (insert/update) chậm hơn đáng kể |
| BRIN | Dữ liệu tăng dần theo thời gian | Cực nhỏ, nhưng cần correlation cao |
| GiST / SP-GiST | Hình học, range type, tìm gần nhất | Cho PostGIS, {{pg_trgm}}, {{cube}} |

### Partial index
~~~sql
CREATE INDEX idx_orders_pending ON orders (created_at)
WHERE status = 'PENDING';
~~~
- Index chỉ chứa dòng {{status = 'PENDING'}} ⇒ nhỏ hơn nhiều, cập nhật cũng rẻ hơn, và index scan trả về ít dòng thừa hơn.
- **Điều kiện của index phải được planner suy ra từ câu query.** Query viết {{WHERE status = 'PENDING'}} thì dùng được; viết {{WHERE status = ?}} thì planner có thể không chứng minh được và **không dùng** index.
- Partial index còn dùng để giải quyết vấn đề unique constraint khi soft delete: {{CREATE UNIQUE INDEX uq_customer_email ON customer (email) WHERE deleted_at IS NULL}}.

### Expression index
~~~sql
CREATE INDEX idx_cust_lower_email ON customers (lower(email));
CREATE INDEX idx_order_day ON orders (date_trunc('day', created_at));
CREATE INDEX idx_payload_order ON orders ((payload->>'orderId'));
~~~
- Query **phải dùng đúng biểu thức** để index được chọn: {{WHERE lower(email) = ?}}. Viết {{WHERE email = lower(?)}} thì index không dùng.
- Rất hữu ích khi cột JSONB cần truy vấn thường xuyên theo một key cụ thể – nhanh hơn nhiều so với index GIN toàn bộ document.

### GIN
~~~sql
CREATE INDEX idx_order_payload ON orders USING gin (payload jsonb_path_ops);
CREATE INDEX idx_doc_fts ON documents USING gin (to_tsvector('simple', body));
~~~
- Với JSONB, biến thể {{jsonb_path_ops}} nhỏ hơn và nhanh hơn cho toán tử {{@>}}, nhưng **không** hỗ trợ toán tử kiểm tra tồn tại key.
- Full-text: thường nên tạo cột {{tsvector}} riêng (generated column hoặc trigger) thay vì đặt index expression trực tiếp – query không phải lặp đúng biểu thức, và khi recheck không phải tính lại {{to_tsvector}}.
- **Đánh đổi**: GIN (khi bật {{fastupdate}}, mặc định) có **pending list** – bản ghi mới vào danh sách chờ và chỉ được hợp nhất vào index chính khi {{VACUUM}}/autoanalyze chạy, khi danh sách vượt {{gin_pending_list_limit}} (mặc định 4MB), hoặc gọi {{gin_clean_pending_list()}}.

### BRIN – lựa chọn cho bảng log khổng lồ
~~~sql
CREATE INDEX idx_log_created_brin ON transaction_log USING brin (created_at)
    WITH (pages_per_range = 32);
~~~
- BRIN lưu **tóm tắt giá trị min/max cho mỗi nhóm trang** (mặc định 128 trang, tức khoảng 1MB) thay vì lưu từng giá trị ⇒ index chỉ vài KB cho bảng hàng triệu dòng.
- Điều kiện tiên quyết: giá trị phải **tương quan theo thứ tự vật lý** với vị trí dòng. Bảng append-only ghi {{created_at}} tăng dần là trường hợp lý tưởng; dữ liệu ghi ngẫu nhiên thì BRIN **không dùng được**.

### Khi nào optimizer **không** dùng index
1. Điều kiện query không bao hàm điều kiện của partial index.
2. Query dùng biểu thức khác biểu thức trong expression index.
3. Bảng nhỏ: seq scan rẻ hơn.
4. Cột có **selectivity thấp** (chỉ 2-3 giá trị).
5. **Thống kê lệch** → ước tính sai số dòng ⇒ planner chọn sai plan. Chạy {{ANALYZE}}.
6. Index **bị bloat** nên planner ước tính chi phí quá cao.

### Pitfall production
- **Index thừa làm chậm ghi**: mỗi index phải được cập nhật khi {{INSERT}}/{{UPDATE}}/{{DELETE}}. Với GIN trên JSONB, cái giá còn nặng hơn nhiều.
- Kiểm tra index không dùng: {{SELECT relname, indexrelname, idx_scan FROM pg_stat_user_indexes WHERE idx_scan = 0;}} – nhưng cẩn thận, index có thể chỉ dùng khi có sự cố.
- **Index đơn trên cột ít giá trị** (low cardinality, ví dụ boolean) gần như vô dụng – trừ khi dùng partial index cho giá trị hiếm.
- Với **UUID ngẫu nhiên** làm khoá chính, B-tree bị phân mảnh ⇒ độ trễ ghi tăng. Dùng UUIDv7 hoặc khoá tăng dần.
- **Index GIN + vacuum bị bỏ sót** ⇒ pending list phình ⇒ query chậm dần mà không có cảnh báo rõ ràng. Hãy theo dõi {{pgstatginindex}} và cấu hình autovacuum cho các bảng đó.

> Senior tip: chọn loại index nên bắt đầu từ **hình dạng dữ liệu và câu query thực tế**. Ba phát hiện hay bị bỏ qua: bảng log khổng lồ thường **không cần** B-tree mà BRIN là đủ và rẻ hơn hàng trăm lần; truy vấn JSONB theo **một key cụ thể** thường được phục vụ tốt hơn bằng expression index; partial index theo trạng thái nghiệp vụ giảm rất nhiều I/O.`,
  follow: [
    'Vì sao partial index thường không được dùng khi câu query dùng tham số thay vì giá trị cụ thể?',
    'Khi nào BRIN là lựa chọn tốt hơn B-tree cho bảng giao dịch?'
  ],
  tags: ['index', 'partial index', 'expression index', 'GIN', 'BRIN']
},
{
  id: 'db-014',
  topic: 'db',
  level: 'senior',
  q: 'Bảng giao dịch của bạn đã 800 triệu dòng và bạn muốn chia theo tháng, xoá dữ liệu cũ bằng cách drop partition. Partition pruning hoạt động thế nào, quản lý partition hằng ngày ra sao, và những ràng buộc nào của PostgreSQL có thể làm bạn phải thiết kế lại khoá chính?',
  a: `**Tóm tắt:** Partitioning theo khoảng thời gian là câu trả lời kinh điển cho bảng giao dịch lớn: dữ liệu chia theo {{RANGE}} trên cột thời gian, mỗi partition là một bảng con. Khi truy vấn có điều kiện trên cột partition, planner **pruning** – bỏ hẳn các partition không liên quan. Lợi ích lớn nhất không phải tốc độ đọc mà là **xoá dữ liệu cũ gần như tức thời** bằng {{DROP TABLE partition}} thay vì {{DELETE}} hàng chục triệu dòng. Cái giá: mọi **unique constraint** phải **chứa cột partition**.

### Khai báo
~~~sql
CREATE TABLE transaction_log (
    id          bigint      NOT NULL,
    created_at  timestamptz NOT NULL,
    account_id  bigint      NOT NULL,
    amount      numeric(18,2) NOT NULL,
    PRIMARY KEY (id, created_at)      -- bat buoc chua cot partition
) PARTITION BY RANGE (created_at);

CREATE TABLE transaction_log_2026_01 PARTITION OF transaction_log
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- partition mac dinh: du phong khi quen tao partition
CREATE TABLE transaction_log_default PARTITION OF transaction_log DEFAULT;
~~~

### Partition pruning
~~~sql
-- Chi doc partition 2026_01
SELECT sum(amount) FROM transaction_log
WHERE created_at >= '2026-01-01' AND created_at < '2026-02-01';
~~~
Để pruning hoạt động, điều kiện trên cột partition phải **nằm trong query**. Kiểm tra bằng {{EXPLAIN}} – plan sẽ chỉ liệt kê các partition liên quan.
- Với **prepared statement**, planner có thể chọn "generic plan" sau nhiều lần execute; khi đó không prune được lúc lập plan, nhưng PostgreSQL 11+ vẫn prune lúc thực thi (runtime pruning – plan hiện {{Subplans Removed}}). Điều kiện dùng hàm như {{now()}} cũng chỉ prune được lúc thực thi.

### Quản lý partition hằng ngày
- **Tạo trước**: luôn tạo partition cho tháng tới bằng một cron job. Nếu không có partition chứa dữ liệu mới và cũng không có partition {{DEFAULT}}, mọi lệnh {{INSERT}} sẽ **fail**.
- **Tách/gắn partition** (PostgreSQL 14+):
~~~sql
-- tach partition de xu ly du lieu cu (nhanh, khong khoa lau)
ALTER TABLE transaction_log DETACH PARTITION transaction_log_2025_01 CONCURRENTLY;

-- gian lai partition da duoc xu ly xong
ALTER TABLE transaction_log ATTACH PARTITION transaction_log_2025_01
    FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
~~~
Lưu ý: {{DETACH ... CONCURRENTLY}} không chạy được trong transaction block và **không dùng được khi bảng có partition DEFAULT**. Lệnh {{ATTACH PARTITION}} (PG 12+) chỉ lấy {{SHARE UPDATE EXCLUSIVE}} trên bảng cha, nhưng khoá bảng được gắn và phải quét nó để kiểm tra ràng buộc (cùng quét partition DEFAULT nếu có). Mẹo: tạo trước một {{CHECK}} constraint khớp với khoảng giá trị để PostgreSQL bỏ qua bước quét.
- **Xoá dữ liệu cũ**: {{DROP TABLE transaction_log_2024_01;}} – gần như tức thời vì chỉ unlink file, không ghi vào hàng triệu dòng.
- **Vá lỗi dữ liệu sai năm**: có thể {{ATTACH}} một bảng đã chứa dữ liệu vào partition tương ứng (lưu ý phải có index trùng cấu trúc, và lệnh sẽ khoá).

### Ràng buộc quan trọng
1. **Unique constraint phải chứa cột partition**. Đây là điểm hay gây đau nhất:
   - Nếu bảng gốc dùng {{PRIMARY KEY (id)}}, bạn **không** thể partition theo {{created_at}}.
   - Giải pháp phổ biến: đổi thành {{PRIMARY KEY (id, created_at)}}. Nhưng khi đó, ứng dụng không thể tìm một bản ghi chỉ bằng {{id}} mà không biết {{created_at}} ⇒ phải thiết kế lại toàn bộ đường truy cập.
   - Giải pháp khác: partition theo **hash** của {{id}} thay vì theo thời gian – giữ được unique trên {{id}}, nhưng mất lợi ích drop theo thời gian.
2. **Foreign key tới bảng partitioned**: PostgreSQL 12+ đã hỗ trợ, nhưng cần kiểm tra phiên bản thực tế của bạn.
3. **Index**: tạo index trên bảng partitioned sẽ tự tạo index con trên **mọi** partition. Với bảng nhiều partition, số index nhỏ tăng nhanh và overhead khi ghi tăng theo.
4. **Partition {{DEFAULT}}**: nguy hiểm vì nếu dữ liệu lọt vào đó, nó sẽ phình to, nhiều truy vấn phải đọc nó, và mỗi lần tạo partition mới PostgreSQL phải quét DEFAULT để chắc không có dòng thuộc khoảng mới (có dòng trùng thì lệnh tạo fail). Cần cảnh báo khi partition mặc định có dữ liệu.

### MySQL khác PostgreSQL thế nào
- MySQL 8 hỗ trợ {{PARTITION BY RANGE}} và {{RANGE COLUMNS}}, cũng có partition pruning.
- Ràng buộc chặt hơn: **mọi** unique key (kể cả khoá chính) phải chứa **toàn bộ** các cột của partition key, và bảng partitioned **không hỗ trợ foreign key**.
- MySQL **không có** {{DETACH}}/{{ATTACH}} như PostgreSQL; thay vào đó dùng {{ALTER TABLE ... EXCHANGE PARTITION}} hoặc {{DROP PARTITION}}, đều là DDL cần metadata lock.
- MySQL 8 chỉ hỗ trợ partition với InnoDB (native partitioning); mỗi partition vẫn là một file tablespace {{.ibd}} riêng.

### Pitfall production
- **Quên tạo partition trước** ⇒ toàn bộ lệnh ghi của bảng fail. Hãy có cảnh báo khi partition cho tháng tới chưa tồn tại.
- **Truy vấn không có điều kiện partition key** sẽ đọc tất cả partition ⇒ hiệu năng tệ hơn bảng thường. Với bảng log, hãy luôn bắt buộc có khoảng thời gian trong API.
- **Partition bị phình** (skew): nếu dữ liệu không phân bố đều theo tháng (ví dụ chương trình khuyến mãi), partition đó sẽ rất lớn.
- **Bảng partitioned có overhead**: mỗi câu lệnh phải đi qua "append node" của partition ⇒ có chi phí nhỏ so với bảng thường. Với bảng nhỏ, partitioning có thể làm chậm.

> Senior tip: trước khi partition, trả lời ba câu: **(1) tôi xoá dữ liệu cũ theo chu kỳ nào?** (đây mới là lý do chính để partition) **(2) unique constraint có chứa được cột partition không?** Nếu không, bạn phải đổi thiết kế khoá – thay đổi rất tốn kém nên phải quyết định sớm. **(3) sau 3 năm sẽ có bao nhiêu partition?**`,
  follow: [
    'Vì sao unique constraint phải chứa cột partition và điều đó ảnh hưởng gì tới khoá chính?',
    'Bạn xử lý dữ liệu của tháng chưa tạo partition như thế nào để không làm sập hệ thống?'
  ],
  tags: ['partitioning', 'partition pruning', 'RANGE', 'DROP PARTITION', 'ATTACH PARTITION']
},
{
  id: 'db-015',
  topic: 'db',
  level: 'mid',
  q: 'Ba thuật toán join của PostgreSQL (nested loop, hash join, merge join) khác nhau thế nào? Đọc execution plan và tìm ra lý do optimizer chọn sai thuật toán là việc gì?',
  a: `**Tóm tắt:** Có ba thuật toán join chính. **Nested loop**: lấy từng dòng của bảng ngoài rồi tìm dòng khớp trong bảng trong bằng index – rẻ khi bảng ngoài nhỏ, đắt nếu bảng trong không có index. **Hash join**: dựng bảng băm từ bảng nhỏ hơn rồi quét bảng lớn – tốt cho join lớn không có index, nhưng cần **bộ nhớ** (vượt {{work_mem}} thì spill ra đĩa). **Merge join**: cả hai bảng đã sort thì trỏ hai danh sách song song – tốt khi cả hai lớn và có index đúng thứ tự. Optimizer chọn sai phần lớn **không phải vì thuật toán**, mà vì **thống kê sai**.

### So sánh
| Thuật toán | Cơ chế | Tốt khi | Xấu khi |
|---|---|---|---|
| Nested Loop | Vòng lặp, index lookup ở bảng trong | Bảng ngoài rất nhỏ, có index ở bảng trong | Bảng trong không có index, bảng ngoài lớn |
| Hash Join | Build hash table rồi probe | Cả hai bảng lớn, không có index | Bảng build quá lớn ⇒ spill; thiếu memory |
| Merge Join | Merge hai danh sách đã sort | Cả hai lớn, có index theo thứ tự join, cần output sorted | Không có thứ tự sort ⇒ phải sort tốn kém |

### Đọc plan
~~~sql
EXPLAIN (ANALYZE, BUFFERS) SELECT ...;
~~~
Các dấu hiệu đáng chú ý:
| Dấu hiệu trong plan | Ý nghĩa |
|---|---|
| {{Rows Removed by Join Filter}} lớn | Điều kiện join đặt sai chỗ, hoặc thiếu index ở vế trong |
| {{Hash Cond}} kèm {{Batches}} > 1 | Hash join **spill** xuống đĩa – rất chậm |
| {{Sort Method: external merge}} | Sort vượt {{work_mem}}, spill xuống đĩa |
| Số dòng ước tính lệch mạnh với số dòng thực tế | **Statistics sai** – nguyên nhân gốc của hầu hết trường hợp chọn sai |
| {{Heap Fetches}} cao trên index-only scan | Visibility map chưa cập nhật (VACUUM chưa chạy kịp) ⇒ vẫn phải đọc heap |

### Vì sao optimizer chọn sai
1. **Thống kê lỗi thời**: sau bulk insert lớn, thống kê chưa cập nhật ⇒ ước tính sai. Chạy {{ANALYZE}}.
2. **Độ phân giải thấp**: mặc định {{default_statistics_target}} là 100. Với cột có phân bố phức tạp (nhiều giá trị phổ biến), hãy tăng: {{ALTER TABLE t ALTER COLUMN c SET STATISTICS 1000;}} rồi {{ANALYZE t;}}.
3. **Tương quan giữa các cột**: optimizer không biết cột {{country}} và {{city}} có tương quan. Dùng **extended statistics**: {{CREATE STATISTICS st_c (dependencies, ndistinct) ON country, city FROM customers;}}
4. **{{work_mem}} quá nhỏ** khiến planner tránh hash join.
5. **Prepared statement dùng generic plan**: plan được lưu cho tham số chung nên mất lợi thế của plan chuyên biệt. Với query quan trọng: {{SET LOCAL plan_cache_mode = force_custom_plan;}}
6. **Dữ liệu lệch (skew)**: dữ liệu mới nằm ở đuôi index, optimizer dựa trên lịch sử phân bố cũ.

### Quy trình xử lý
1. Chạy {{ANALYZE}} và xem lại plan.
2. Nếu vẫn lệch, tăng {{default_statistics_target}} cho cột liên quan hoặc tạo extended statistics.
3. Kiểm tra index ở vế trong của join.
4. Tăng {{work_mem}} cho session nếu thấy {{Batches}} > 1.
5. Tạm để kiểm chứng: {{SET LOCAL enable_hashjoin = off;}} rồi xem plan thay đổi thế nào – nếu tốt hơn, đó là manh mối.
6. Nếu tối ưu đã hết mà vẫn chậm, cân nhắc **materialized view** hoặc **index trên materialized view** cho các báo cáo lặp lại.

### Pitfall production
- **Chạy {{EXPLAIN ANALYZE}} trên câu {{UPDATE}}/{{DELETE}} thật** sẽ thực thi thay đổi – hãy bọc trong {{BEGIN}} + {{ROLLBACK}}.
- **Generic plan** của prepared statement có thể tốt khi dữ liệu phân bố đều và rất tệ khi dữ liệu lệch ⇒ đừng chỉ tối ưu câu literal rồi đưa vào code dùng tham số.
- **Tăng {{work_mem}} toàn cục** có thể làm hỏng máy chủ khi nhiều session cùng dùng. Hãy đặt theo session/role, và nhớ rằng nó bị tính cho **mỗi** node của plan.
- **Tối ưu theo "đẹp của plan"** thay vì theo số đo thực tế là sai lầm phổ biến: một plan trông lạ lùng vẫn có thể nhanh hơn.

> Senior tip: hãy lưu {{EXPLAIN (ANALYZE)}} của các query quan trọng vào CI hoặc lưu theo thời gian để phát hiện **plan regression** trước khi lên production.`,
  follow: [
    'Hash join spill xuống đĩa xảy ra khi nào và ảnh hưởng thế nào tới hiệu năng?',
    'Extended statistics giải quyết vấn đề gì mà thống kê cột đơn lẻ không giải quyết được?'
  ],
  tags: ['join', 'nested loop', 'hash join', 'merge join', 'execution plan']
},
{
  id: 'db-016',
  topic: 'db',
  level: 'lead',
  q: 'Bạn thêm read replica để giảm tải đọc, nhưng khách hàng báo "vừa chuyển tiền xong không thấy giao dịch". Replication lag đo thế nào, các nguyên nhân gây lag ra sao, và bạn giải quyết read-your-writes bằng cách nào trong Spring?',
  a: `**Tóm tắt:** Read replica chỉ nhận được các thay đổi đã **commit** trên primary và phải **replay** WAL để có dữ liệu tương ứng. Khoảng thời gian giữa lúc commit trên primary và lúc replica có dữ liệu đó gọi là **replication lag** – chính nó gây ra "đọc không thấy dữ liệu vừa ghi". Với PostgreSQL, lag đo bằng cột {{replay_lsn}} trong {{pg_stat_replication}} so với {{pg_current_wal_lsn()}}. Giải pháp read-your-writes: **đọc từ primary sau khi ghi**, **chờ replica bắt kịp** (theo LSN), **đọc từ cache** vừa ghi, hoặc **kiểm tra phiên bản** dòng đọc được.

### Replica lag đo thế nào
~~~sql
-- Do do lech byte giua primary va replica
SELECT client_addr, state, sent_lsn, write_lsn, flush_lsn, replay_lsn,
       pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn) AS replay_lag_bytes,
       write_lag, flush_lag, replay_lag
FROM pg_stat_replication;
~~~
- **Byte lag** (số byte WAL chưa replay) là đại lượng đáng tin nhất vì không phụ thuộc đồng hồ.
- **Time lag** ({{replay_lag}}) dễ bị hiểu sai: nó là thời gian đo **trên primary** từ lúc WAL được flush cục bộ tới lúc standby báo đã replay xong – không phải thời gian dự kiến để replay nốt phần tồn đọng. Khi primary không có ghi mới, giá trị này có thể giữ nguyên hoặc về NULL. Trên replica có thể xem thêm {{now() - pg_last_xact_replay_timestamp()}} (phụ thuộc đồng hồ hai máy).

### Vì sao replica bị lag
1. **Primary ghi quá nhiều**: mỗi giao dịch đều tạo WAL, replica phải nhận và replay bằng I/O.
2. **Replica yếu hơn primary**: CPU/I/O của replica không đủ để replay kịp.
3. **Mạng**: băng thông hoặc độ trễ giữa hai vùng.
4. **Replay bị chặn bởi query dài chạy trên replica**: khi một câu {{SELECT}} dài đang đọc một trang cũ, replay của WAL tương ứng bị trì hoãn để bảo đảm tính nhất quán snapshot.
5. **Thao tác nặng trên primary** ({{VACUUM}} lớn, {{REINDEX}}, {{CREATE INDEX}}, bulk update) sinh lượng WAL đột biến mà replica phải replay (replica không tự chạy VACUUM/REINDEX).
6. **Bảng lớn, index bloat** khiến việc apply WAL chậm.

### Bốn cách giải quyết read-your-writes
1. **Đọc từ primary sau khi ghi** (sticky read): đơn giản nhất. Hệ thống dùng cho nghiệp vụ nhạy cảm (số dư, trạng thái giao dịch) nên gần như **luôn** phải đọc từ primary.
2. **Chờ replica bắt kịp**: sau khi ghi, poll trạng thái replica cho tới khi lag dưới ngưỡng (ví dụ 100ms) rồi mới đọc. Phù hợp khi độ trễ chấp nhận được và cần đọc dữ liệu "lớn".
3. **Đọc từ cache** vừa ghi: ghi kết quả vào Redis/Caffeine với TTL ngắn, đọc ưu tiên cache. Hợp với dữ liệu **idempotent, không đổi** (danh mục).
4. **Ghi phiên bản**: thêm cột {{version}}, đọc từ replica với điều kiện {{WHERE version >= version_vua_ghi}} và retry cho tới khi thấy.

### Định tuyến đọc/ghi trong Spring
Spring không có sẵn cơ chế read replica; cần tự xây bằng {{AbstractRoutingDataSource}} (chi tiết kỹ thuật đã nêu ở câu về {{readOnly}}):
- {{determineCurrentLookupKey()}} kiểm tra {{TransactionSynchronizationManager.isCurrentTransactionReadOnly()}}: true thì đi replica, false thì đi primary.
- Phải bọc bằng {{LazyConnectionDataSourceProxy}} để connection được mở **sau** khi quyết định routing.
- Cần **pool riêng** cho primary và replica – chúng là hai hệ thống khác nhau.
- Nếu một transaction vừa đọc vừa ghi mà đổi routing giữa chừng, sẽ có 2 connection khác nhau trong cùng transaction.
- Với JPA, mọi truy vấn phải nằm trong transaction để cờ read-only có hiệu lực.

### Vì sao hệ thống ngân hàng phải hạn chế đọc replica
- Số dư, hạn mức, trạng thái giao dịch là dữ liệu quyết định – đọc bản cũ có thể cho phép chi tiêu vượt hạn mức.
- Dữ liệu đọc từ replica cũ có thể vi phạm yêu cầu đối soát, báo cáo tài chính và quy định lưu trữ.
- Quy tắc thực tế: **chỉ truy vấn dữ liệu tham chiếu** (danh mục, tham số phí) mới đọc từ replica; mọi thứ liên quan quyết định tài chính đọc từ primary.

### Pitfall production
- **Failover có thể mất dữ liệu**: khi promote một replica lên primary, các giao dịch đã commit nhưng chưa kịp replicate sẽ mất ⇒ RPO khác 0.
- **Bộ đệm ứng dụng** điền từ replica sẽ chứa dữ liệu cũ hơn ⇒ phải tính đến điều này khi thiết kế TTL và khi invalidate.
- **Hai connection pool** ⇒ tổng số connection của ứng dụng tăng lên; replica có {{max_connections}} riêng (và với hot standby phải không nhỏ hơn primary), cần tính lại sizing cho cả hai.
- **Báo cáo chạy trên replica** có thể tạo tải nặng làm lag tăng, kéo theo việc đọc của người dùng cũng bị ảnh hưởng gián tiếp.

> Senior tip: coi **replication lag là một SLO có cảnh báo**. Ngưỡng nên theo tác động nghiệp vụ: nếu nghiệp vụ chấp nhận dữ liệu cũ tối đa 1 giây thì cảnh báo khi lag vượt 1 giây. Hãy có **đường lùi tự động về primary**, vì hệ thống đọc replica mà không có lưới an toàn sẽ biểu hiện sự cố thành "khách hàng không thấy giao dịch" – rất khó chẩn đoán.`,
  follow: [
    'Vì sao replay WAL trên replica có thể bị chặn bởi một câu SELECT dài?',
    'Làm sao đo replication lag một cách đáng tin cậy khi đồng hồ hai máy lệch nhau?'
  ],
  tags: ['read replica', 'replication lag', 'read-your-writes', 'routing', 'WAL']
},
{
  id: 'db-017',
  topic: 'db',
  level: 'mid',
  q: 'Bạn cần báo cáo số dư chạy (running balance) và top-3 giao dịch lớn nhất của mỗi khách hàng. Window function giải quyết thế nào, và những bẫy nào khiến kết quả tính sai?',
  a: `**Tóm tắt:** Window function tính một giá trị **theo một tập hàng** (partition) mà **không gom nhóm**, nên vẫn giữ được từng dòng của bảng gốc. Ba ứng dụng phổ biến: **running balance** dùng {{SUM(...) OVER (PARTITION BY ... ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)}}, **xếp hạng** dùng {{RANK}}/{{DENSE_RANK}}/{{ROW_NUMBER}}, và **top-N mỗi nhóm** dùng {{ROW_NUMBER() OVER (PARTITION BY ... ORDER BY ...)}} rồi lọc ở lớp ngoài. Bẫy lớn nhất: chọn sai **frame** và quên **tie-breaker** trong {{ORDER BY}}.

### Running balance
~~~sql
SELECT t.account_id,
       t.created_at,
       t.amount,
       SUM(t.amount) OVER (
           PARTITION BY t.account_id
           ORDER BY t.created_at, t.id          -- id la tie-breaker
           ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
       ) AS running_balance
FROM transaction t
WHERE t.created_at >= '2026-01-01'
ORDER BY t.account_id, t.created_at, t.id;
~~~
- {{PARTITION BY}} chia dữ liệu thành các nhóm độc lập: mỗi khách hàng có running balance riêng.
- {{ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}} nghĩa là "cộng từ đầu partition đến dòng hiện tại".

### Vì sao {{ROWS}} chứ không phải {{RANGE}}
- Với {{ROWS}}, mỗi dòng là một đơn vị riêng. Nếu hai dòng có cùng {{created_at}}, chúng vẫn được cộng dần.
- Với {{RANGE}}, các dòng có **cùng giá trị ORDER BY** bị gộp thành một nhóm và cùng nhận **cùng** tổng.
- Frame **mặc định** khi có {{ORDER BY}} mà không khai báo frame là {{RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}}.

### Xếp hạng
| Hàm | Kết quả với giá trị 100, 100, 80 |
|---|---|
| {{ROW_NUMBER()}} | 1, 2, 3 (luôn liên tục, không quan tâm trùng) |
| {{RANK()}} | 1, 1, 3 (nhảy số khi trùng) |
| {{DENSE_RANK()}} | 1, 1, 2 (không nhảy số) |
| {{NTILE(4)}} | chia partition thành 4 nhóm gần bằng nhau, dùng để xếp nhóm phân định giá trị |

### Top-N mỗi nhóm
~~~sql
WITH ranked AS (
    SELECT t.*,
           ROW_NUMBER() OVER (PARTITION BY t.account_id ORDER BY t.amount DESC, t.id) AS rn
    FROM transaction t
    WHERE t.created_at >= '2026-01-01'
)
SELECT * FROM ranked WHERE rn <= 3 ORDER BY account_id, amount DESC;
~~~
- **Phải bọc trong CTE/subquery** rồi mới lọc, vì window function **không** được dùng trong {{WHERE}} của cùng một mức truy vấn.
- Với PostgreSQL còn có {{DISTINCT ON}}, thường nhanh hơn nhưng **chỉ lấy được top-1** mỗi nhóm, và biểu thức {{DISTINCT ON}} phải khớp các cột đầu của {{ORDER BY}}.
- Nếu cần "3 giao dịch lớn nhất **và các giao dịch cùng giá trị**" thì dùng {{RANK()}} thay vì {{ROW_NUMBER()}} – hai giao dịch bằng nhau có thể chiếm hết 3 suất.

### Các hàm hay dùng khác
- {{LAG(amount) OVER (ORDER BY created_at)}} và {{LEAD}}: so sánh với giao dịch liền trước/sau (tăng trưởng so với kỳ trước).
- {{FIRST_VALUE}}/{{LAST_VALUE}}: lưu ý {{LAST_VALUE}} mặc định lấy giá trị của frame hiện tại, nên phải khai báo frame {{ROWS BETWEEN UNBOUNDED PRECEDING AND UNBOUNDED FOLLOWING}} mới lấy đúng giá trị cuối.
- {{EXCLUDE CURRENT ROW}} (PostgreSQL 11+), {{EXCLUDE GROUP}}, {{EXCLUDE TIES}}: loại bỏ dòng hiện tại khỏi frame – rất tiện khi tính "so với giao dịch ngay trước".

### Pitfall production
- **Window function không dùng được trong {{WHERE}}** cùng mức – phải dùng subquery. Đây là lỗi cú pháp phổ biến nhất.
- **Thiếu tie-breaker** ⇒ kết quả không ổn định giữa hai lần chạy, và có thể tính sai số dư chạy.
- **Hiệu năng**: window function cần dữ liệu đã sort theo {{PARTITION BY}} + {{ORDER BY}}; không có index phù hợp thì phải sort toàn bộ ⇒ tốn memory và I/O (spill khi vượt {{work_mem}}).
- **Lọc trước, tính sau**: {{WHERE}} chạy trước window function, nên lọc {{WHERE created_at >= ...}} thì chỉ các dòng thoả điều kiện mới tham gia tính ⇒ running balance ở ví dụ trên **thiếu số dư đầu kỳ**. Phải cộng thêm opening balance, hoặc tính trên toàn bộ lịch sử rồi lọc ở lớp ngoài.

> Senior tip: khi viết báo cáo bằng window function, luôn thêm **tie-breaker** vào {{ORDER BY}} và **chọn frame tường minh** ({{ROWS ...}} thay vì để mặc định).`,
  follow: [
    'Vì sao {{SUM(x) OVER (ORDER BY y)}} lại tính running total mà {{SUM(x) OVER ()}} lại là tổng cả bảng?',
    'Khi nào dùng {{RANK()}} thay vì {{ROW_NUMBER()}} trong báo cáo top-N?'
  ],
  tags: ['window function', 'running balance', 'RANK', 'ROW_NUMBER', 'PARTITION BY']
},
{
  id: 'db-018',
  topic: 'db',
  level: 'lead',
  q: 'Một team khác đề nghị đưa logic tính lãi và biểu phí vào stored procedure trong database. Bạn đánh giá ưu/nhược thế nào, và khi nào nên đưa logic lên tầng Java thay vì để trong DB?',
  a: `**Tóm tắt:** Stored procedure chạy **ngay trong DB**, tiếp cận dữ liệu trực tiếp và giảm số round-trip mạng – hiệu quả cho thao tác hàng loạt. Nhưng cái giá là **khả năng kiểm thử, versioning, review và vận hành** đều kém hơn hẳn. Quy tắc thực tế cho hệ thống ngân hàng: **giữ logic nghiệp vụ ở tầng Java**, chỉ để procedure cho thao tác **dữ liệu hàng loạt** không cần kiểm thử đơn vị (tổng hợp, xoá dữ liệu cũ, tính lại tổng).

### Ưu điểm
- **Hiệu năng theo lô**: một lệnh gọi xử lý hàng triệu dòng mà không đưa dữ liệu về ứng dụng.
- **Ít round-trip**: logic nhiều bước chạy bên trong DB thay vì mỗi bước là một lượt qua mạng.
- **Tập trung quy tắc**: quy tắc nằm gần dữ liệu, dễ áp dụng cho mọi đường truy cập.
- **Bảo mật**: có thể cấp quyền {{EXECUTE}} cho ứng dụng mà không cấp quyền ghi trực tiếp lên bảng.

### Nhược điểm
- **Khó test**: có framework như pgTAP (PostgreSQL) hay utPLSQL (Oracle) nhưng ít team dùng, khó mock, phải chạy thật trên DB.
- **Khó review**: diff SQL procedure khó đọc hơn code Java; thay đổi khó phát hiện ảnh hưởng.
- **Khó versioning**: phải quản lý bằng Flyway/Liquibase; nhiều môi trường dễ lệch phiên bản.
- **Phụ thuộc DB**: PL/pgSQL và PL/SQL khác nhau, chuyển đổi giữa PostgreSQL và Oracle là viết lại.
- **Ẩn logic khỏi ứng dụng**: người đọc code Java không thấy quy tắc nghiệp vụ đang chạy.
- **Không scale**: logic chạy trong DB không mở rộng được khi tách DB, không tái dùng được cho các kênh khác.
- **Bảo mật**: nối chuỗi tham số trong procedure dễ dính SQL injection.

### Khi nào nên để trong DB
| Tình huống | Nên để trong DB |
|---|---|
| Xoá dữ liệu cũ hàng chục triệu dòng | Có |
| Tổng hợp lại dữ liệu từ nhiều bảng | Có |
| Quy tắc nghiệp vụ thay đổi theo sản phẩm/tuỳ chế | **Không** |
| Logic cần unit test và coverage cao | **Không** |
| Logic cần tái dùng cho nhiều kênh (API, batch, worker) | **Không** |

### Ví dụ một procedure được làm đúng
~~~sql
CREATE OR REPLACE FUNCTION recalc_daily_balance(p_account bigint, p_day date)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER            -- mac dinh: chay voi quyen cua nguoi goi
SET search_path = public, pg_temp
AS $fn$
BEGIN
    UPDATE account_balance
       SET balance = sub.total
      FROM (SELECT account_id, sum(amount) AS total
              FROM transaction_entry
             WHERE account_id = p_account
               AND posted_on <= p_day
             GROUP BY account_id) AS sub
     WHERE account_balance.account_id = p_account;
END;
$fn$;
~~~
Điểm an toàn đáng chú ý: luôn đặt {{SET search_path}} tường minh. Khi {{search_path}} chứa schema do người dùng kiểm soát được, kẻ tấn công có thể tạo hàm giả cùng tên để bị gọi nhầm – với {{SECURITY DEFINER}} thì rủi ro này nghiêm trọng hơn nhiều.

### Khi nào đưa logic lên Java
1. **Quy tắc nghiệp vụ** (biểu phí, lãi suất theo sản phẩm, điều kiện duyệt) – thay đổi liên tục, cần test, cần audit rõ ai đổi gì khi nào.
2. **Cần tích hợp hệ thống khác** (gọi cổng thanh toán, gửi thông báo) – DB không làm được.
3. **Cần tái dùng** cho nhiều kênh xử lý (API đồng bộ, job batch, consumer message).
4. **Cần scale** khi tách DB thành nhiều shard – logic trong DB không chia theo.
5. **Cần quan sát**: metric, trace, log có ngữ cảnh.

Quy trình đề xuất khi vẫn phải dùng procedure:
- Quản lý bằng **Flyway/Liquibase** cùng các migration khác – không bao giờ sửa tay trên production.
- **Test thật** trên DB (dùng transaction + rollback cho mỗi test case).
- Ghi rõ **comment** ở đầu procedure: mục đích, tham số, tác động, ai sở hữu.
- **Versioning theo tên**: tạo hàm mới (ví dụ {{recalc_daily_balance_v2}}) và đổi hàm cũ sang gọi hàm mới, để có đường quay lui.
- Giới hạn quyền: cấp {{EXECUTE}} cho role ứng dụng, không cấp quyền ghi bảng.
- **Timeout và giới hạn tài nguyên** cho các procedure chạy lâu.

### Pitfall production
- **Procedure gọi procedure** tạo chuỗi phụ thuộc khó truy vết và khó test.
- **Không có transaction rõ ràng** giữa các bước trong procedure khiến việc retry trở nên mơ hồ – phải xác định rõ procedure có idempotent không.
- **Logic ẩn trong DB** không xuất hiện trong quy trình review code ⇒ một lần sửa sai có thể ảnh hưởng hàng triệu bản ghi mà không ai phát hiện.
- **Quyền {{EXECUTE}}** trên procedure có thể bị cấp quá rộng; hãy theo nguyên tắc đặc quyền tối thiểu.
- **Khi chuyển từ 1 DB lên nhiều DB**, logic trong DB không scale theo ⇒ phải viết lại. Đây là lý do đáng để đặt logic ở tầng Java từ đầu.

> Senior tip: câu hỏi nên tự hỏi là: "**Nếu logic này ở trong DB, ai sẽ viết test cho nó, và test sẽ chạy trong CI của team ứng dụng không?**". Nếu câu trả lời là "không" thì đó là tín hiệu mạnh cho thấy procedure sẽ trở thành "logic ma" – không ai dám sửa, không ai hiểu, và sự cố sẽ được gọi bằng cái tên "lỗi stored procedure" trong khi nguyên nhân thật là thiếu test và thiếu sở hữu.`,
  follow: [
    'Khi nào việc đưa logic lên tầng Java lại làm hệ thống chậm đi?',
    'Làm thế nào quản lý phiên bản và rollback cho stored procedure trong production?'
  ],
  tags: ['stored procedure', 'PL/pgSQL', 'logic trong DB', 'versioning', 'testability']
},
{
  id: 'db-019',
  topic: 'db',
  level: 'senior',
  q: 'Bạn cần khôi phục dữ liệu tới đúng thời điểm trước khi một câu {{DELETE}} sai chạy. PITR hoạt động thế nào, WAL archiving đóng vai trò gì, và bạn chọn RPO/RTO ra sao cho hệ thống giao dịch?',
  a: `**Tóm tắt:** **PITR** là khả năng khôi phục database tới **thời điểm bất kỳ trong quá khứ**, không chỉ tới thời điểm có bản sao lưu. Cơ chế: **base backup** cộng với **WAL archive** liên tục (mọi thay đổi sau thời điểm backup). Khi khôi phục, PostgreSQL đọc base backup rồi replay các file WAL đã lưu cho tới khi đạt {{recovery_target_time}} rồi dừng. **RPO** quyết định tần suất lưu WAL; **RTO** quyết định kiến trúc HA. Điểm không thể bỏ qua: **backup chưa bao giờ được khôi phục thì không phải backup**.

### Các loại backup
| Loại | Nội dung | Ưu | Nhược |
|---|---|---|---|
| Physical ({{pg_basebackup}}, snapshot đĩa) | Bản sao file dữ liệu tại một thời điểm | Khôi phục nhanh, làm nền cho PITR | Chỉ khôi phục cả cluster, cùng major version |
| Physical + WAL archive | Base backup + mọi WAL sau đó | **Có PITR** | Cần quản lý kho WAL, theo dõi archive |
| Logical ({{pg_dump}}) | Dữ liệu dạng câu lệnh | Có thể đọc, xem được, chọn lọc bảng | Chậm với DB lớn, không có PITR |

Với PostgreSQL, {{pg_basebackup}} tạo **physical backup** có thể dùng cho PITR, chạy online mà không cần downtime.

### WAL archiving
~~~sql
-- primary: ship WAL lien tuc sang kho luu tru
ALTER SYSTEM SET archive_mode = on;           -- can RESTART server moi co hieu luc
ALTER SYSTEM SET archive_command = 'aws s3 cp %p s3://my-backup/wal/%f';
ALTER SYSTEM SET archive_timeout = '60s';     -- ep chuyen segment WAL toi da moi 60s
SELECT pg_reload_conf();                      -- du cho archive_command/archive_timeout
~~~
Trên production nên dùng công cụ chuyên dụng (pgBackRest, WAL-G, Barman) thay vì lệnh copy tự viết: chúng xử lý retry, nén, kiểm tra toàn vẹn và quản lý retention.
- Mọi thay đổi đã commit đều được ghi vào WAL. Nếu WAL được archive **liên tục**, bạn có thể khôi phục tới bất kỳ thời điểm nào mà file WAL còn tồn tại.
- **RPO = khoảng thời gian tối đa mà một transaction đã commit nhưng chưa được archive**. Archive chậm 5 phút ⇒ RPO tối đa 5 phút. Lưu ý một segment WAL (mặc định 16MB) chỉ được archive khi đầy, nên lúc ít ghi phải đặt {{archive_timeout}} để giới hạn RPO.
- Phải có **quyền ghi vào kho backup** riêng biệt, có **versioning/object lock** để chống xoá nhầm hoặc mã hoá tống tiền.
- Nếu mất archive ⇒ không thể khôi phục tới thời điểm quanh đó. Vì vậy phải **theo dõi** độ trễ archive và **cảnh báo** khi nó vượt ngưỡng.

### Khôi phục tới một thời điểm
~~~bash
# 1. Dua base backup vao thu muc du lieu
# 2. Tao file recovery.signal
touch $PGDATA/recovery.signal

# 3. Cau hinh trong postgresql.conf
restore_command = 'aws s3 cp s3://my-backup/wal/%f %p'
recovery_target_time = '2026-03-15 09:20:00+07'
recovery_target_action = 'promote'      # pause (mac dinh) | shutdown | promote
~~~
- Các tham số đích: {{recovery_target_time}} (theo thời gian), {{recovery_target_xid}} (theo transaction id), {{recovery_target_lsn}} (theo vị trí byte trong WAL), {{recovery_target_name}} (theo tên restore point do bạn đặt).
- {{recovery_target_action = 'promote'}} khiến server tiếp tục hoạt động đọc-ghi sau khi đạt mục tiêu; {{'shutdown'}} thì dừng luôn để bạn kiểm tra trước khi đưa vào vận hành.
- Bạn cũng có thể đặt **restore point** bằng {{pg_create_restore_point('name')}} trước khi chạy một thao tác rủi ro, để sau này khôi phục chính xác tới thời điểm đó.

### Chọn RPO và RTO
| Yêu cầu | RPO | RTO | Kiến trúc cần |
|---|---|---|---|
| Mất tối đa 1 giờ dữ liệu, phục hồi trong 8 giờ | 1 giờ | 8 giờ | Backup đêm + WAL archive |
| Mất tối đa 5 phút, phục hồi trong 1 giờ | 5 phút | 1 giờ | WAL archive liên tục + standby |
| Mất gần như không, phục hồi trong 15 phút | ≈ 0 | 15 phút | **Synchronous replication** sang vùng khác + tự động failover |

- RPO nhỏ ⇒ WAL phải ship liên tục (chi phí băng thông, I/O và lưu trữ tăng).
- RTO nhỏ ⇒ cần một bản sao **đứng sẵn** (warm standby) để failover trong vài phút, cộng với quy trình tự động hoá (ví dụ Patroni cho PostgreSQL) và diễn tập failover định kỳ.
- Trên AWS RDS: có sẵn automated backup với PITR (retention tối đa 35 ngày), read replica và Multi-AZ. RDS tự quản lý WAL nên bạn không cấu hình {{archive_command}} được – thay vào đó dựa vào PITR của RDS, AWS Backup, và copy snapshot sang region/tài khoản khác.

### Kiểm thử khôi phục
Đây là phần bị bỏ qua nhiều nhất và cũng là phần nguy hiểm nhất:
- **Định kỳ** (ít nhất hàng quý) khôi phục bản backup vào môi trường tách biệt, đo **thời gian khôi phục thực tế** và cập nhật lại cam kết RTO.
- Kiểm tra backup **không bị hỏng** và có thể **mở khoá giải mã** (nếu có mã hoá) bằng đúng khoá dự phòng.
- Lưu số liệu: kích thước backup, thời gian backup, thời gian restore, RPO đo được.

### Pitfall production
- **Backup cùng tài khoản/region** với database ⇒ một sự cố ở tầng hạ tầng xoá sạch cả hai.
- **Không kiểm thử khôi phục** ⇒ bạn chỉ biết backup hỏng khi cần nó nhất.
- **Backup và WAL lệch phiên bản**: sau khi nâng major version, base backup cũ không replay được WAL mới ⇒ phải tạo base backup mới ngay sau upgrade.
- **Quyền xoá trong kho backup**: rủi ro insider hoặc mã hoá tống tiền. Dùng **object lock (WORM)**, versioning, và khoá truy cập riêng không dùng cho ứng dụng.
- **Chỉ backup database mà không có WAL archive** ⇒ không có PITR, chỉ có "khôi phục về đêm hôm đó".
- **Mất khoá mã hoá backup** (hoặc chỉ lưu khoá ở cùng chỗ với hệ thống bị sự cố) ⇒ không khôi phục được.

> Senior tip: hãy nói với stakeholder bằng **con số**, không bằng thuật ngữ: "Nếu ổ cứng chết lúc 10:05, chúng ta mất tối đa 5 phút dữ liệu giao dịch và cần 20 phút để dựng lại từ bản sao lưu gần nhất". Rất nhiều tổ chức tuyên bố RPO "không mất dữ liệu" trong khi thực tế backup đêm và không có WAL archive – đó không phải PITR, đó là mất một ngày dữ liệu.`,
  follow: [
    'RPO và RTO khác nhau thế nào, và cái nào quyết định kiến trúc HA?',
    'Bạn thiết kế quy trình kiểm thử khôi phục backup định kỳ như thế nào?'
  ],
  tags: ['PITR', 'WAL archive', 'backup', 'RPO', 'RTO']
},
{
  id: 'spring-022',
  topic: 'spring',
  level: 'mid',
  q: '{{@Component}}, {{@Service}}, {{@Repository}}, {{@Controller}} khác nhau ở chỗ nào? {{@Repository}} còn bổ sung khả năng gì cho exception?',
  a: `**Tóm tắt:** Cả bốn đều là **stereotype annotation** để Spring component scan nhận diện bean, về mặt kỹ thuật chúng là **alias** của {{@Component}} và hành vi giống hệt nhau. Khác biệt chỉ nằm ở **ý nghĩa ngữ nghĩa (semantic)**: {{@Component}} chung, {{@Service}} tầng nghiệp vụ, {{@Repository}} tầng dữ liệu, {{@Controller}} tầng web. Điểm quan trọng nhất: {{@Repository}} kích hoạt **exception translation** – Hibernate/JPA exception (unchecked) được bọc thành {{DataAccessException}} hierarchy của Spring để tầng trên bắt được mà không phụ thuộc JPA.

### So sánh
| Annotation | Layer | Use case |
|---|---|---|
| {{@Component}} | Generic | Utility, config, shared bean |
| {{@Service}} | Business logic | Orchestration, transaction boundary |
| {{@Repository}} | Data access | JPA repo, custom DAO, **exception translation** |
| {{@Controller}} | Web MVC | @RequestMapping, trả view (Thymeleaf) |
| {{@RestController}} | Web REST | {{@Controller}} + {{@ResponseBody}} |

### Exception translation của {{@Repository}}
Khi bean được đánh dấu {{@Repository}}, Spring đăng ký một {{PersistenceExceptionTranslationPostProcessor}} tự động bọc các exception của JPA/Hibernate ({{NoResultException}}, {{OptimisticLockException}}, {{ConstraintViolationException}} của Hibernate…) thành các subclass của {{DataAccessException}} ({{EmptyResultDataAccessException}}, {{OptimisticLockingFailureException}}, {{DataIntegrityViolationException}}…). Spring Boot tự đăng ký post-processor này; Spring thuần phải tự khai báo bean. Nhờ đó service chỉ cần bắt {{DataAccessException}} thay vì import JPA exception.

~~~java
@Repository
public class JpaOrderRepository implements OrderRepository {
    // getSingleResult() ném NoResultException -> Spring dịch thành EmptyResultDataAccessException
}

@Service
public class OrderService {
    public Order get(Long id) {
        try { return repo.findById(id).orElseThrow(() -> new OrderNotFoundException(id)); }
        catch (DataAccessException ex) { throw new RepositoryException("DB error", ex); }
    }
}
~~~

### Pitfall production
- Dùng {{@Component}} cho mọi thứ làm mất ý nghĩa kiến trúc – reviewer không biết bean nào là service, repo hay controller.
- Quên {{@Repository}} trên DAO tuỳ chỉnh ⇒ exception JPA rò rỉ ra tầng service, gắn chặt service với JPA.
- {{@Controller}} dùng cho REST API sẽ trả view name thay vì JSON – phải dùng {{@RestController}} hoặc thêm {{@ResponseBody}}.

> Senior tip: quy tắc review đơn giản: **bean nào chạm DB thì phải có {{@Repository}}**. Nếu team dùng Spring Data JPA interface thì interface đó đã được proxy bằng {{@Repository}} ngầm, nhưng DAO class tuỳ chỉnh thì phải tự thêm.`,
  follow: [
    'Tại sao Spring không gộp {{@Service}} và {{@Repository}} thành một annotation duy nhất?',
    'Làm sao bật exception translation cho bean không dùng {{@Repository}}?'
  ],
  tags: ['Component', 'Service', 'Repository', 'Controller', 'exception translation']
},
{
  id: 'spring-023',
  topic: 'spring',
  level: 'senior',
  q: '{{@Bean}} và {{@Component}} khác nhau ra sao? {{@Configuration}} có {{proxyBeanMethods}} làm gì, và khi nào nên tắt nó?',
  a: `**Tóm tắt:** {{@Component}} dùng **component scan** để Spring tự khám phá và đăng ký bean; {{@Bean}} dùng trong class có {{@Configuration}} để **khai báo bean thủ công** – thường cho thư viện bên thứ ba, object không do bạn viết, hoặc cần logic phức tạp để tạo instance. {{@Configuration(proxyBeanMethods = true)}} (mặc định) tạo proxy CGLIB cho class config để gọi method {{@Bean}} nhiều lần vẫn trả về **cùng một instance** (singleton scope). Tắt {{proxyBeanMethods = false}} khi class config **không tự gọi method {{@Bean}} khác** – giúp giảm overhead proxy và cho phép class là final.

### So sánh
| Đặc điểm | {{@Component}} | {{@Bean}} |
|---|---|---|
| Cách đăng ký | Component scan (tự động) | Khai báo tường minh trong {{@Configuration}} |
| Dùng cho | Class do bạn viết, kiểm soát được | Thư viện thứ ba, logic tạo phức tạp, multiple instance |
| Scope | Singleton mặc định, đổi bằng {{@Scope}} | Singleton mặc định, đổi bằng {{@Scope}} trên method |
| Đa instance | Khó (cần {{@Qualifier}}) | Dễ: viết nhiều method {{@Bean}} khác tên |

### {{proxyBeanMethods}} là gì
Khi {{@Configuration}} có method {{@Bean}} A gọi method {{@Bean}} B:
~~~java
@Configuration
public class AppConfig {
    @Bean
    DataSource dataSource() { return new HikariDataSource(); }

    @Bean
    JdbcTemplate jdbcTemplate() { return new JdbcTemplate(dataSource()); } // gọi method dataSource()
}
~~~
Nếu {{proxyBeanMethods = true}} (mặc định), Spring bọc class trong proxy CGLIB. Lúc gọi {{dataSource()}}, proxy kiểm tra context: đã có bean DataSource chưa? Nếu có thì trả bean đó, không chạy code method nữa ⇒ **singleton được bảo toàn**. Nếu {{false}}, {{dataSource()}} chạy code thật ⇒ tạo **DataSource mới** mỗi lần gọi ⇒ vi phạm singleton.

### Khi nào tắt
- Class config **không** tự gọi method {{@Bean}} khác (không có lời gọi chéo).
- Muốn class config là {{final}} (CGLIB không proxy được class final).
- Muốn hiệu năng khởi động nhanh hơn một chút (không tạo proxy).

~~~java
@Configuration(proxyBeanMethods = false)  // "lite" mode
public class LiteConfig {
    @Bean DataSource dataSource() { ... }  // không gọi bean khác
    @Bean JdbcTemplate jdbcTemplate(DataSource ds) { return new JdbcTemplate(ds); } // inject qua tham số
}
~~~
Ứng dụng Spring Boot 3.x khuyến khích dùng **lite mode** ({{proxyBeanMethods = false}}) và inject dependency qua tham số method thay vì gọi method bean khác.

### Pitfall production
- Tắt {{proxyBeanMethods}} mà vẫn gọi method {{@Bean}} khác ⇒ tạo instance trùng lặp, mất singleton, connection pool bị nhân đôi.
- Dùng {{@Bean}} cho class do mình viết mà có thể dùng {{@Component}} ⇒ code dài hơn, component scan không thấy, dễ quên khai báo.

> Senior tip: mặc định dùng {{@Component}} cho class mình viết; chỉ dùng {{@Bean}} khi bắt buộc (thư viện, logic tạo instance). Với {{@Configuration}}, hãy để {{proxyBeanMethods = false}} và inject qua tham số – đó là phong cách Spring Boot 3 hiện đại.`,
  follow: [
    'Vì sao Spring Boot 3 khuyến khích {{proxyBeanMethods = false}}?',
    'Nếu một class có {{@Configuration(proxyBeanMethods = false)}} mà vẫn gọi method {{@Bean}} khác thì hành vi là gì?'
  ],
  tags: ['Bean', 'Component', 'Configuration', 'proxyBeanMethods', 'lite mode']
},
{
  id: 'spring-024',
  topic: 'spring',
  level: 'senior',
  q: 'Khi có nhiều bean cùng kiểu, {{@Autowired}} resolve thế nào? {{@Qualifier}}, {{@Primary}} và inject {{List}}/{{Map}} hoạt động ra sao?',
  a: `**Tóm tắt:** Khi nhiều bean cùng kiểu, Spring mặc định **báo lỗi** {{NoUniqueBeanDefinitionException}}. Ba cách giải quyết: (1) {{@Primary}} trên bean ưu tiên – tự động chọn khi không có qualifier; (2) {{@Qualifier("beanName")}} tại chỗ inject – chỉ định rõ bean nào; (3) inject **{{List<Type>}}** hoặc **{{Map<String, Type>}}** – nhận **tất cả** bean cùng kiểu (kể cả bean không {{@Primary}}), map key là tên bean. {{@Qualifier}} có ưu tiên cao hơn {{@Primary}}.
 
### Cơ chế resolution
1. Nếu có **duy nhất** một bean kiểu T → inject luôn.
2. Nếu có nhiều bean kiểu T:
   - Có {{@Qualifier}} tại injection point → dùng bean khớp qualifier.
   - Không qualifier, có bean {{@Primary}} → dùng bean primary (tiếp theo là {{@Priority}} cao nhất nếu có).
   - Vẫn chưa chọn được → Spring thử khớp **tên tham số/field với tên bean** (Spring Boot biên dịch với {{-parameters}}).
   - Không khớp gì → **lỗi** {{NoUniqueBeanDefinitionException}} khi khởi động.

### {{@Primary}} vs {{@Qualifier}}
~~~java
@Configuration
public class PaymentConfig {
    @Bean @Primary
    PaymentGateway vnpayGateway() { return new VNPayGateway(); }

    @Bean
    PaymentGateway momoGateway() { return new MoMoGateway(); }
}

@Service
public class PaymentService {
    private final PaymentGateway gateway;           // tự động inject vnpayGateway (primary)
    private final PaymentGateway momoGateway;       // nhận momoGateway nhờ @Qualifier

    public PaymentService(PaymentGateway gateway,
                          @Qualifier("momoGateway") PaymentGateway momo) {
        this.gateway = gateway;
        this.momoGateway = momo;
    }
}
~~~

### Inject List và Map
~~~java
@Service
public class NotificationDispatcher {
    private final List<Notifier> notifiers;                    // tất cả bean implements Notifier
    private final Map<String, Notifier> notifierByName;        // key = bean name

    public NotificationDispatcher(List<Notifier> notifiers, Map<String, Notifier> byName) {
        this.notifiers = notifiers;
        this.notifierByName = byName;
    }

    public void sendAll(String msg) {
        notifiers.forEach(n -> n.notify(msg));
    }
}
~~~
- {{List}} sắp theo {{@Order}}/{{Ordered}}/{{@Priority}}, không có thì theo thứ tự đăng ký bean; {{Map}} key là tên bean (tên class viết thường chữ đầu, hoặc tên method {{@Bean}}).
- Bean {{@Primary}} **vẫn nằm trong List/Map** – không bị loại.
- Cách này dùng cho **strategy pattern** hoặc **chain of responsibility** (ví dụ: danh sách validator, processor).

### Pitfall production
- Dùng {{@Qualifier}} chuỗi string cứng dễ typo – nên định nghĩa hằng số hoặc dùng {{@Qualifier}} trên bean definition.
- Quên {{@Primary}} khi thêm implementation thứ hai cho interface cũ ⇒ tất cả chỗ inject interface đó bị lỗi {{NoUniqueBeanDefinitionException}} lúc khởi động (không phải lỗi compile).
- Inject {{Map}} mà quên key là tên bean (không phải qualifier) ⇒ tra cứu sai key.

> Senior tip: trong review, nếu thấy interface có 2+ implementation, hãy hỏi: "bean nào là default (primary)?" Nếu không có primary và không dùng qualifier ở mọi chỗ inject, code sẽ vỡ khi thêm implementation mới.`,
  follow: [
    'Tại sao Spring không tự chọn bean đầu tiên theo alphabet thay vì ném lỗi ambiguity?',
    'Khi inject {{Map<String, T>}}, bean nào có {{@Primary}} có key là gì?'
  ],
  tags: ['Autowired', 'Qualifier', 'Primary', 'List injection', 'Map injection']
},
{
  id: 'spring-025',
  topic: 'spring',
  level: 'mid',
  q: '{{@SpringBootApplication}} bao gồm những annotation nào? Spring Boot starter là gì, và nó khác Spring thuần ở đâu?',
  a: `**Tóm tắt:** {{@SpringBootApplication}} là annotation gộp 3 annotation cốt lõi: {{@SpringBootConfiguration}} (đánh dấu class config, cho phép {{@Bean}}), {{@EnableAutoConfiguration}} (kích hoạt auto-configuration – "ma thuật" của Boot), và {{@ComponentScan}} (quét component từ package của class chính). **Starter** là dependency Maven/Gradle gom sẵn một tập thư viện phù hợp cho một tác vụ (web, data-jpa, security…) kèm auto-configuration – khác Spring thuần ở chỗ **không phải tự khai báo bean, version, hay dependency transit**.
 
### Ba annotation trong {{@SpringBootApplication}}
| Annotation | Vai trò |
|---|---|
| {{@SpringBootConfiguration}} | Giống {{@Configuration}}, cho phép {{@Bean}}; Boot dùng để tìm class chính |
| {{@EnableAutoConfiguration}} | Đọc {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, nạp auto-config theo điều kiện |
| {{@ComponentScan}} | Quét {{@Component}}, {{@Service}}, {{@Repository}}, {{@Controller}} từ package của class main trở xuống |

Có thể tách ra dùng riêng:
~~~java
@SpringBootConfiguration
@EnableAutoConfiguration
@ComponentScan("com.acme")
public class MyApp { }
~~~

### Spring Boot Starter
Starter là một **dependency descriptor** (gần như chỉ có pom) gom các thư viện cần cho một tác vụ; version do BOM {{spring-boot-dependencies}} quản lý, còn auto-configuration nằm trong {{spring-boot-autoconfigure}} và kích hoạt theo điều kiện classpath:
- **spring-boot-starter-web**: Tomcat, Spring MVC, Jackson (validation phải thêm {{spring-boot-starter-validation}} từ Boot 2.3).
- **spring-boot-starter-data-jpa**: Hibernate, Spring Data JPA, HikariCP, transaction.
- **spring-boot-starter-security**: Spring Security (OAuth2 resource server là starter riêng {{spring-boot-starter-oauth2-resource-server}}).

Version của các thư viện được BOM của Boot quản lý và đã test tương thích – hạn chế version conflict.

### Khác Spring thuần ở đâu
| Khía cạnh | Spring thuần (XML/Java config) | Spring Boot |
|---|---|---|
| Khai báo bean | Tự viết {{@Bean}}, {{@ComponentScan}}, {{@EnableTransactionManagement}}… | Auto-configuration làm sẵn |
| Version dependency | Tự quản lý {{<version>}} trong pom | Starter + BOM quản lý version |
| Chạy | Deploy WAR lên Tomcat/JBoss | **Fat JAR** nhúng Tomcat/Jetty/Undertow, chạy {{java -jar}} |
| Cấu hình | {{web.xml}}, {{applicationContext.xml}}, property file | {{application.yml}}, externalized config, profile |
| Health/Metrics | Tự dựng | Actuator sẵn sàng |

### Pitfall production
- **Quét quá rộng**: {{@ComponentScan}} không chỉ định package sẽ quét từ package của class khai báo nó trở xuống; nếu đặt class main ở package quá chung (ví dụ {{com}}) hoặc default package thì sẽ quét cả thư viện ⇒ start chậm, register bean rác. Đặt class main ở root package riêng của ứng dụng.
- **Tắt auto-config không cần**: {{@SpringBootApplication(exclude = DataSourceAutoConfiguration.class)}} khi không dùng DB.
- **Starter kéo dependency thừa**: có cả starter-web và starter-webflux thì Boot chọn Spring MVC (servlet), WebFlux chỉ còn là client – muốn reactive hoàn toàn thì bỏ starter-web. Xem dependency tree: {{mvn dependency:tree}}.

> Senior tip: hãy coi {{@SpringBootApplication}} là **điểm vào ứng dụng** – package của class này quyết định boundary của component scan. Nếu project multi-module, hãy để class main ở module gốc và chỉ scan module đó; các module con dùng {{@ComponentScan}} riêng hoặc export bean qua {{@Bean}}.`,
  follow: [
    'Vì sao Spring Boot dùng fat JAR thay vì WAR deploy lên server ngoài?',
    'Làm sao biết starter nào đang kéo dependency nào, và version là bao nhiêu?'
  ],
  tags: ['SpringBootApplication', 'EnableAutoConfiguration', 'ComponentScan', 'starter', 'fat jar']
},
{
  id: 'spring-026',
  topic: 'spring',
  level: 'senior',
  q: '{{@Transactional}}: rollback mặc định chỉ xảy ra với unchecked exception. {{rollbackFor}} dùng thế nào, và try-catch "nuốt" exception làm hỏng transaction ra sao?',
  a: `**Tóm tắt:** Mặc định {{@Transactional}} chỉ rollback khi ném **unchecked exception** ({{RuntimeException}}, {{Error}}). Checked exception ({{IOException}}, {{SQLException}}, custom checked exception) sẽ **commit** transaction trừ khi khai báo {{rollbackFor}}. Cái bẫy nguy hiểm nhất: **bắt exception rồi không rethrow** (nuốt exception) – transaction sẽ commit bình thường dù logic nghiệp vụ đã lỗi.
 
### Quy tắc rollback
| Exception type | Mặc định | Muốn rollback thì khai báo |
|---|---|---|
| {{RuntimeException}}, {{Error}} | Rollback | — |
| Checked exception | **Commit** | {{@Transactional(rollbackFor = Exception.class)}} |
| {{SQLException}} | **Commit** (là checked) – nhưng thường đã được Spring dịch thành {{DataAccessException}} (unchecked) | {{rollbackFor}} nếu tự ném ra |
| JPA {{PersistenceException}}, {{DataAccessException}} | Rollback (unchecked) | — |

~~~java
@Transactional(rollbackFor = Exception.class)
public void importFile(InputStream in) throws IOException {
    // IOException là checked -> cần rollbackFor mới rollback
    parseAndSave(in);
}
~~~

### Try-catch nuốt exception
~~~java
@Transactional
public void transfer(Account from, Account to, BigDecimal amount) {
    try {
        from.debit(amount);
        to.credit(amount);
    } catch (InsufficientFundsException e) {
        log.warn("Khong du tien");  // NUỐT EXCEPTION - KHÔNG rethrow
        // Transaction VẪN COMMIT vì không có exception thoát ra!
    }
}
~~~
Sửa: phải **rethrow** hoặc ném {{RuntimeException}}:
~~~java
catch (InsufficientFundsException e) {
    throw new TransferFailedException(e);  // unchecked -> rollback
}
~~~

### Pitfall production
- **Checked exception không khai báo rollbackFor** ⇒ dữ liệu ghi dở dang vẫn commit (ví dụ: import file lỗi giữa chừng nhưng nửa đầu đã lưu).
- **Catch log rồi không throw** là bug phổ biến nhất – code review phải soi chặt: mọi {{catch}} trong method {{@Transactional}} đều phải có {{throw}}.
- Ngược lại: nếu exception được ném từ một method {{@Transactional}} **khác bean** (REQUIRED, join chung transaction) rồi bị bắt ở method ngoài, transaction đã bị đánh dấu rollback-only ⇒ lúc commit nhận {{UnexpectedRollbackException}}. Nuốt exception không "cứu" được transaction.
- {{@Transactional}} trên method {{private}}, {{final}}, {{static}} **không có tác dụng** (không proxy được) – Spring im lặng bỏ qua.
- Đặt {{@Transactional}} ở **tầng service**, không phải controller hay repository.

> Senior tip: quy tắc code review bắt buộc: **method có {{@Transactional}} không được có try-catch không rethrow**. Nếu bắt lỗi để xử lý, hãy wrap thành unchecked exception và ném lại. Ngoài ra, luôn bật log DEBUG cho {{org.springframework.transaction}} khi debug transaction.`,
  follow: [
    'Tại sao Spring mặc định không rollback cho checked exception?',
    'Làm sao phát hiện method {{@Transactional}} bị nuốt exception trong code review?'
  ],
  tags: ['Transactional', 'rollback', 'rollbackFor', 'checked exception', 'try-catch']
},
{
  id: 'spring-027',
  topic: 'spring',
  level: 'mid',
  q: '{{@RestController}} và {{@Controller}} khác nhau thế nào? {{ResponseEntity}} dùng để làm gì, và Jackson serialize JSON ra sao?',
  a: `**Tóm tắt:** {{@RestController}} = {{@Controller}} + {{@ResponseBody}} – mọi method trả về object được **tự động serialize thành JSON** (hoặc XML) và ghi vào response body. {{@Controller}} truyền thống trả về **view name** (string) để view resolver (Thymeleaf, JSP) render HTML. {{ResponseEntity<T>}} cho phép kiểm soát **status code**, **header** và **body** một cách tường minh. Jackson (mặc định) serialize bằng getter hoặc field, hỗ trợ {{@JsonProperty}}, {{@JsonIgnore}}, {{@JsonFormat}}.
 
### So sánh
| Đặc điểm | {{@Controller}} | {{@RestController}} |
|---|---|---|
| Trả về | View name ({{String}}) | Object -> JSON/XML |
| Cần {{@ResponseBody}} | Có, trên từng method | Đã có ngầm |
| Dùng cho | Server-side rendering (Thymeleaf) | REST API, SPA backend |

### {{ResponseEntity}} – kiểm soát response
~~~java
@GetMapping("/orders/{id}")
public ResponseEntity<OrderDto> getOrder(@PathVariable Long id) {
    return orderService.findById(id)
        .map(ResponseEntity::ok)                           // 200 OK + body
        .orElse(ResponseEntity.notFound().build());        // 404 Not Found, no body
}

@PostMapping("/orders")
public ResponseEntity<OrderDto> create(@RequestBody CreateOrderRequest req) {
    OrderDto created = orderService.create(req);
    return ResponseEntity
        .status(HttpStatus.CREATED)                        // 201
        .header("Location", "/orders/" + created.getId())  // header tuỳ chỉnh
        .body(created);
}
~~~

### Jackson serialize
- Mặc định: serialize các **getter public** và **field public**; field private chỉ xuất hiện khi có getter (hoặc có annotation như {{@JsonProperty}}). Record được serialize theo các component.
- Tuỳ chỉnh phổ biến:
  - {{@JsonProperty("ten_moi")}}: đổi tên field trong JSON.
  - {{@JsonIgnore}}: không serialize field này (dùng cho password, internal field).
  - {{@JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")}}: format date.
  - {{@JsonInclude(JsonInclude.Include.NON_NULL)}}: bỏ field null ra JSON.
- Cấu hình toàn cục:
~~~yaml
spring:
  jackson:
    serialization:
      WRITE_DATES_AS_TIMESTAMPS: false  # ISO-8601 string thay vì epoch millis
    default-property-inclusion: non_null
~~~

### Pitfall production
- **Trả entity JPA trực tiếp** cho API ⇒ Jackson kích hoạt lazy loading (N+1), lộ field nhạy cảm ({{passwordHash}}), và gắn API vào cấu trúc bảng.
- **Quên {{@JsonIgnore}} trên field nhạy cảm** – ai thêm field mới vào entity thì field đó tự động lộ ra API.
- **Status 204 thì không có body**: dùng {{ResponseEntity.noContent().build()}}, đừng trả object kèm 204 (client sẽ bỏ qua body).
- Jackson thuần ghi date thành timestamp (số); Spring Boot đã tắt sẵn {{WRITE_DATES_AS_TIMESTAMPS}} cho {{ObjectMapper}} được auto-config. Bẫy là tự {{new ObjectMapper()}} ở chỗ khác ⇒ mất cấu hình này và mất cả module {{JavaTimeModule}}.

> Senior tip: **luôn trả DTO cho API**, không bao giờ trả entity. DTO là hợp đồng API – bạn quyết định field nào lộ, tên gì, format ra sao. Entity là nội bộ – đổi schema không được phép vỡ API.`,
  follow: [
    'Vì sao trả entity JPA trực tiếp cho REST API là anti-pattern?',
    'Jackson xử lý {{LocalDateTime}} như thế nào khi không cấu hình {{WRITE_DATES_AS_TIMESTAMPS}}?'
  ],
  tags: ['RestController', 'Controller', 'ResponseEntity', 'Jackson', 'JSON']
},
{
  id: 'db-020',
  topic: 'db',
  level: 'senior',
  q: 'ACID giải thích bằng ví dụ chuyển tiền: mỗi chữ cái (Atomicity, Consistency, Isolation, Durability) được DB đảm bảo bằng cơ chế nào?',
  a: `**Tóm tắt:** ACID là bốn thuộc tính của transaction. **Atomicity (tính nguyên tử)**: transaction hoặc hoàn tất toàn bộ hoặc không làm gì – DB dùng **undo log** để rollback. **Consistency (tính nhất quán)**: dữ liệu luôn thỏa mãn ràng buộc (FK, unique, check) – DB enforce **constraint** ngay ở mỗi câu lệnh (hoặc lúc commit nếu khai báo DEFERRABLE). **Isolation (tính cô lập)**: các transaction đồng thời không can thiệp nhau – DB dùng **MVCC + lock** (row lock, gap lock). **Durability (tính bền vững)**: dữ liệu commit không mất khi crash – DB dùng **WAL (Write-Ahead Logging)** + **fsync**.
 
### Ví dụ chuyển tiền 100 từ tài khoản A sang B
~~~sql
BEGIN;
UPDATE account SET balance = balance - 100 WHERE id = 'A';
UPDATE account SET balance = balance + 100 WHERE id = 'B';
COMMIT;
~~~

### Mỗi chữ cái được đảm bảo như thế nào
| Chữ cái | Cơ chế DB | Điều gì xảy ra nếu lỗi |
|---|---|---|
| **A - Atomicity** | Undo log (InnoDB, Oracle); PostgreSQL dùng phiên bản tuple + trạng thái transaction | Nếu UPDATE B lỗi (ví dụ vi phạm CHECK, mất kết nối), thay đổi trên A bị huỷ |
| **C - Consistency** | Constraint (FK, CHECK, UNIQUE, NOT NULL) | Nếu balance < 0 vi phạm CHECK -> rollback, dữ liệu không bao giờ ở trạng thái sai |
| **I - Isolation** | MVCC (snapshot) + Lock (row, gap, next-key) | Transaction khác đọc A/B thấy số dư cũ cho đến khi commit; lock ngăn sửa đồng thời |
| **D - Durability** | WAL (redo log) + fsync | Commit = WAL đã ghi đĩa; crash sau đó replay WAL để khôi phục |

### Chi tiết cơ chế
- **Undo log** (InnoDB, Oracle): lưu giá trị cũ trước khi sửa, dùng cho rollback và MVCC read view. PostgreSQL **không có undo log**: tuple cũ nằm ngay trong bảng, rollback chỉ là đánh dấu transaction aborted nên các tuple mới của nó trở thành vô hình.
- **WAL (Write-Ahead Logging)**: **ghi log trước, sửa data sau**. Mọi thay đổi đều append vào WAL buffer -> flush ra đĩa (fsync) tại commit. Crash recovery: đọc WAL từ checkpoint gần nhất và redo; InnoDB còn dùng undo log để huỷ các transaction chưa commit, còn PostgreSQL chỉ cần coi chúng là aborted.
- **Lock**: Row lock ({{FOR UPDATE}}), gap lock (ngăn phantom insert), next-key lock (row + gap). Deadlock detection tự động rollback victim.
- **Constraint**: Kiểm tra tại **commit** (deferred) hoặc ngay lập tức (immediate).

### Pitfall production
- **Tắt fsync** ({{fsync = off}}) để nhanh hơn -> mất Durability, crash = mất dữ liệu commit.
- **Isolation level thấp** (READ COMMITTED) -> non-repeatable read, phantom read -> logic sai (ví dụ đọc số dư rồi trừ mà không lock).
- **Constraint không được define ở DB** mà chỉ check ở app -> race condition vượt qua check, dữ liệu hỏng.

> Senior tip: khi design schema, **luôn define constraint ở DB** (FK, CHECK, UNIQUE) – đó là lớp phòng thủ cuối cùng. App có thể bug, race condition có thể xảy ra, nhưng DB constraint áp dụng cho mọi đường ghi (app, script, batch) – trừ khi ai đó chủ động tắt nó.`,
  follow: [
    'Vì sao WAL gọi là "Write-Ahead" – ý nghĩa của việc ghi log trước khi sửa data?',
    'Isolation level READ COMMITTED có đảm bảo Atomicity không?'
  ],
  tags: ['ACID', 'transaction', 'WAL', 'undo log', 'MVCC', 'lock', 'constraint']
},
{
  id: 'db-021',
  topic: 'db',
  level: 'mid',
  q: 'Chuẩn hoá 1NF, 2NF, 3NF là gì? Khi nào nên denormalize (phi chuẩn hoá) để đổi hiệu năng?',
  a: `**Tóm tắt:** Chuẩn hoá loại bỏ **dư thừa dữ liệu** và **anomaly** (insert/update/delete anomaly) bằng cách tách bảng theo dependency. **1NF**: giá trị nguyên tử, không có cột lặp/mảng. **2NF**: đạt 1NF + mọi cột non-key **phụ thuộc hoàn toàn** vào PK (không phụ thuộc một phần PK composite). **3NF**: đạt 2NF + không có **phụ thuộc bắc cầu** (non-key -> non-key). **Denormalize** khi: đọc nhiều ghi ít, cần tránh join phức tạp, báo cáo OLAP, hoặc cache derived data.
 
### Ba dạng chuẩn
| Dạng | Yêu cầu | Vi phạm điển hình |
|---|---|---|
| **1NF** | Mỗi ô một giá trị, không hàng lặp, không cột mảng | Cột {{tags}} lưu {{\"tag1,tag2\"}}, bảng {{order_items}} lặp trong {{orders}} |
| **2NF** | Non-key phụ thuộc **toàn bộ** PK (nếu PK composite) | Bảng {{student_course(student_id, course_id, student_name)}} -> {{student_name}} chỉ phụ thuộc {{student_id}} |
| **3NF** | Không **phụ thuộc bắc cầu** (A -> B -> C, trong đó A là PK) | Bảng {{employee(emp_id, dept_id, dept_name)}} -> {{dept_name}} phụ thuộc {{dept_id}} (non-key) |

### Khi nào denormalize
1. **Đọc nhiều, ghi ít**: danh mục, cấu hình, báo cáo – join tốn kém.
2. **Tránh join sâu**: lưu {{customer_name}} ngay trong {{orders}} thay vì join {{customers}}.
3. **Derived/aggregate data**: {{order.item_count}}, {{order.total_amount}} tính sẵn.
4. **OLAP / Data warehouse**: star schema (fact + dimension) là denormalized by design.
5. **Cache tại application**: Redis lưu JSON đã denormalize sẵn cho màn hình đọc.

### Ví dụ denormalize an toàn
~~~sql
-- Gốc (3NF)
orders(id, customer_id, created_at)
customers(id, name, email)

-- Denormalized: thêm customer_name vào orders để tránh join khi hiển thị danh sách
orders(id, customer_id, customer_name, created_at)
~~~
Cần **trigger / application logic** đồng bộ {{customer_name}} khi {{customers}} đổi tên.

### Pitfall production
- Denormalize **chưa có chiến lược sync** -> dữ liệu lệch (customer đổi tên nhưng orders vẫn tên cũ).
- Quên **unique constraint** trên bảng denormalized -> duplicate data.
- Over-denormalize: bảng phình to, ghi chậm, index to, backup lớn.

> Senior tip: mặc định **chuẩn hoá 3NF** cho OLTP. Chỉ denormalize khi **đo được** join là bottleneck và có kế hoạch sync rõ ràng (trigger, CDC, hoặc app-level sync). Đừng denormalize "dự phòng".`,
  follow: [
    'Sự khác biệt giữa 2NF và 3NF là gì? Cho ví dụ vi phạm 3NF nhưng đạt 2NF.',
    'Làm sao giữ dữ liệu denormalized nhất quán khi bảng gốc thay đổi?'
  ],
  tags: ['normalization', '1NF', '2NF', '3NF', 'denormalize', 'anomaly']
},
{
  id: 'db-022',
  topic: 'db',
  level: 'senior',
  q: 'Clustered index và non-clustered index (InnoDB, Oracle, PostgreSQL) khác nhau ra sao? PRIMARY KEY trong InnoDB là clustered index, còn PostgreSQL/Oracle dùng heap table – ý nghĩa thực tế là gì?',
  a: `**Tóm tắt:** **Clustered index** (InnoDB): dữ liệu dòng **lưu ngay trong B-tree của PRIMARY KEY** – leaf node chứa toàn bộ cột. **Non-clustered index** (secondary index): leaf node chứa **PK value** trỏ về clustered index. **PostgreSQL/Oracle** mặc định dùng **heap table**: dữ liệu lưu riêng, **tất cả index đều non-clustered** (leaf chứa TID/ROWID trỏ đến heap). Oracle có thêm **Index-Organized Table (IOT)** – tương đương clustered. Hệ quả: InnoDB PK lookup nhanh (1 B-tree), secondary index cần 2 B-tree; PostgreSQL mọi index đều 1 B-tree + heap lookup.
 
### InnoDB (MySQL) - Clustered index
- Bảng **luôn** có clustered index: PK nếu có, Unique not-null nếu không, hoặc hidden row_id 6 byte.
- **Secondary index** leaf node lưu **PK value** (không lưu con trỏ vật lý) -> trỏ về clustered index.
- Lookup by PK: **1 B-tree traversal**.
- Lookup by secondary index: **2 B-tree** (secondary -> PK -> clustered).
- **PK nên ngắn** (BIGINT/AUTO_INCREMENT) vì PK value được lặp trong mọi secondary index.

### PostgreSQL / Oracle - Heap table
- Dữ liệu lưu trong **heap** (không theo thứ tự), mỗi dòng có địa chỉ vật lý: {{ctid}} = (block, offset) trong PostgreSQL; {{ROWID}} của Oracle gồm cả file.
- **Tất cả index** (kể cả PK) đều non-clustered: leaf node lưu **TID** -> trỏ đến heap.
- Lookup by PK: 1 B-tree + 1 heap fetch.
- Lookup by secondary index: 1 B-tree + 1 heap fetch (giống PK).
- **Heap tuple update** (MVCC) tạo tuple mới -> **tất cả index** phải thêm entry trỏ TID mới (index bloat) – **trừ** khi là **HOT update**: không cột nào có index bị đổi và trang hiện tại còn chỗ, khi đó không index nào phải cập nhật.

### So sánh thực tế
| Thao tác | InnoDB (Clustered PK) | PostgreSQL (Heap) |
|---|---|---|
| PK lookup | 1 B-tree | 1 B-tree + heap fetch |
| Secondary index lookup | 2 B-tree | 1 B-tree + heap fetch |
| INSERT | Append vào cuối PK (nếu PK tăng) | Append vào heap, cập nhật tất cả index |
| UPDATE non-PK | In-place + undo log; chỉ sửa secondary index chứa cột bị đổi | Tạo tuple mới (MVCC); HOT update thì không đụng index, không thì cập nhật tất cả index |
| UPDATE PK | **Xoá + insert mới** (đắt) | Giống UPDATE non-PK |
| Index size | Secondary index chứa PK value | Tất cả index chứa TID (cố định) |

### Pitfall production
- **InnoDB: PK ngẫu nhiên (UUID)** -> B-tree phân mảnh, insert chậm, secondary index to. Dùng **UUIDv7** hoặc **BIGINT AUTO_INCREMENT**.
- **InnoDB: UPDATE PK** rất đắt (xoá + insert) -> tránh đổi PK.
- **PostgreSQL: UPDATE bất kỳ cột nào** cũng tạo tuple mới; nếu không đạt điều kiện HOT thì tất cả index cập nhật -> bloat nhanh. Với bảng update nhiều: đặt {{FILLFACTOR}} thấp (chừa chỗ cho HOT), tránh index trên cột hay đổi, autovacuum aggressive; theo dõi {{n_tup_hot_upd}} trong {{pg_stat_user_tables}}.
- **PostgreSQL: {{CLUSTER}} command** có thể sắp xếp heap theo một index (giống clustered) nhưng **không duy trì** sau insert/update.

> Senior tip: khi migrate từ MySQL sang PostgreSQL, đừng giữ tư duy "PK clustered = nhanh nhất". PostgreSQL heap + index đều non-clustered, mỗi UPDATE tạo một phiên bản dòng mới – workload update nhiều phải được thiết kế để tận dụng HOT update và vacuum kịp. Hãy benchmark thực tế trên dữ liệu production.`,
  follow: [
    'Vì sao InnoDB secondary index lưu PK value thay vì con trỏ vật lý?',
    'PostgreSQL có hỗ trợ clustered index thật sự không?'
  ],
  tags: ['clustered index', 'non-clustered index', 'InnoDB', 'PostgreSQL', 'heap table', 'B-tree']
},
{
  id: 'db-023',
  topic: 'db',
  level: 'senior',
  q: 'Khi nào index không được dùng: hàm trên cột, LIKE bắt đầu bằng %, OR, ép kiểu ngầm, selectivity thấp?',
  a: `**Tóm tắt:** Index B-tree chỉ dùng được khi điều kiện query **bao hàm** điều kiện của index. Năm trường hợp phổ biến khiến optimizer **bỏ qua index**: (1) **Hàm/biểu thức trên cột** ({{WHERE UPPER(name) = 'A'}}), (2) **LIKE '%abc'** (leading wildcard), (3) **OR** không có index bao phủ cả hai nhánh, (4) **Ép kiểu ngầm** (cột varchar so với số), (5) **Selectivity thấp** (cột ít giá trị riêng biệt như status, gender).
 
### 1. Hàm trên cột
~~~sql
-- KHÔNG dùng index trên created_at
WHERE DATE(created_at) = '2026-01-01'
WHERE YEAR(created_at) = 2026

-- Sửa: viết thành range
WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'
~~~
Giải pháp khác: **expression index** – MySQL 8.0.13+: {{CREATE INDEX idx_day ON orders ((DATE(created_at)))}}; PostgreSQL: {{CREATE INDEX ON orders ((created_at::date))}} (chỉ với cột {{timestamp}}; với {{timestamptz}} biểu thức phụ thuộc timezone, không IMMUTABLE nên không tạo được). Query phải dùng đúng biểu thức đó.

### 2. LIKE leading wildcard
~~~sql
WHERE name LIKE '%abc'   -- Không dùng B-tree
WHERE name LIKE 'abc%'   -- Dùng được (prefix)
~~~
Lưu ý PostgreSQL: prefix LIKE chỉ dùng được B-tree khi collation là {{C}} hoặc index tạo với {{text_pattern_ops}}/{{varchar_pattern_ops}}.
Giải pháp cho {{%abc%}}: **trigram index** ({{pg_trgm}} với GIN/GiST) hỗ trợ {{LIKE}}/{{ILIKE}} chứa chuỗi; tìm kiếm ngôn ngữ tự nhiên thì dùng full-text ({{tsvector}}) hoặc search engine.

### 3. OR không có index bao phủ
~~~sql
-- Chỉ dùng index nếu CẢ HAI cột đều có index
-- (PostgreSQL: BitmapOr, MySQL: index_merge)
WHERE status = 'ACTIVE' OR priority = 1

-- Thay thế: UNION ALL (mỗi nhánh dùng index riêng)
SELECT * FROM orders WHERE status = 'ACTIVE'
UNION ALL
SELECT * FROM orders WHERE priority = 1
  AND status IS DISTINCT FROM 'ACTIVE'   -- tránh trùng; != sẽ bỏ sót dòng status NULL
~~~

### 4. Ép kiểu ngầm (implicit cast)
~~~sql
-- Cột phone VARCHAR(20)
WHERE phone = 123456789  -- MySQL/Oracle ép cột thành số -> index không dùng

-- Sửa: so sánh đúng kiểu
WHERE phone = '123456789'
~~~
PostgreSQL nghiêm ngặt hơn: so sánh {{varchar = integer}} báo lỗi {{operator does not exist}} thay vì ép ngầm. Từ Java, bẫy hay gặp là bind tham số sai kiểu (ví dụ {{setString}} vào cột số, hoặc NVARCHAR với VARCHAR trên Oracle/SQL Server).

### 5. Selectivity thấp
- Cột {{status}} chỉ có 3 giá trị ({{PENDING}}, {{DONE}}, {{CANCELLED}}) -> selectivity ~33%.
- Optimizer ước tính: seq scan đọc 33% bảng nhanh hơn index scan (phải đọc index + heap fetch cho từng dòng).
- **Partial index** giải quyết: {{CREATE INDEX ON orders (created_at) WHERE status = 'PENDING'}} – index chỉ chứa dòng cần truy vấn.

### Kiểm tra index có được dùng không
~~~sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE status = 'PENDING';
-- Xem: Index Scan vs Seq Scan, rows removed by filter
~~~

### Pitfall production
- **Function-based index** (expression index) query phải dùng **cùng biểu thức** (cùng hàm, cùng kiểu tham số, cùng collation) – khác dấu cách thì không sao, nhưng {{lower(email)}} và {{upper(email)}}, hoặc khác kiểu do cast, là index không được dùng.
- **OR** với nhiều điều kiện phức tạp -> UNION ALL thường nhanh hơn.
- **Selectivity thay đổi theo thời gian** (ví dụ status {{PENDING}} từ 1% lên 50% khi hệ thống nghẽn) -> plan cache (prepared statement) có thể chọn sai plan. Dùng {{force_custom_plan}} hoặc re-prepare.

> Senior tip: trước khi thêm index, hãy **đo bằng EXPLAIN ANALYZE** trên dữ liệu production-like. Một index thừa không chỉ tốn disk mà còn làm UPDATE chậm hơn đáng kể. Nguyên tắc: mỗi index phải có một lý do đo được.`,
  follow: [
    'Vì sao LIKE "%abc" không dùng được B-tree nhưng "abc%" được?',
    'Partial index giúp gì cho cột selectivity thấp?'
  ],
  tags: ['index', 'B-tree', 'LIKE', 'wildcard', 'OR', 'implicit cast', 'selectivity', 'partial index']
},
{
  id: 'db-024',
  topic: 'db',
  level: 'senior',
  q: 'Redis các cấu trúc dữ liệu (String, Hash, List, Set, Sorted Set, Bitmap, HyperLogLog, Stream) dùng cho use case nào: cache, rate limit, leaderboard, distributed lock, session?',
  a: `**Tóm tắt:** Redis là **in-memory data structure store** – không chỉ key-value đơn giản mà cung cấp nhiều cấu trúc dữ liệu gốc, mỗi cái giải quyết một bài toán đặc thù. Hiểu đúng cấu trúc tránh việc "dùng búa đập đinh" (ví dụ: dùng String + JSON cho session phức tạp thay vì Hash).
 
### Các cấu trúc và use case điển hình
| Cấu trúc | Lệnh mẫu | Use case thực tế |
|---|---|---|
| **String** | {{SET}}, {{GET}}, {{INCR}} | Cache đơn giản, counter, distributed lock ({{SET NX EX}}), rate limit fixed window ({{INCR}} + {{EXPIRE}}) |
| **Hash** | {{HSET}}, {{HGET}}, {{HGETALL}} | **Session** (field = attribute), object cache (user profile), shopping cart |
| **List** | {{LPUSH}}, {{RPOP}}, {{LRANGE}} | Queue đơn giản (FIFO), recent items ({{LTRIM}} giữ 100 item gần nhất) |
| **Set** | {{SADD}}, {{SREM}}, {{SISMEMBER}}, {{SUNION}} | Tagging, unique visitor ({{SADD}} user_id), friend recommendation (intersection) |
| **Sorted Set (ZSet)** | {{ZADD}}, {{ZRANGE}}, {{ZRANK}} | **Leaderboard** (score = điểm), delay queue (score = timestamp), rate limit sliding window |
| **Bitmap** | {{SETBIT}}, {{GETBIT}}, {{BITCOUNT}} | Daily active user (DAU), retention, permission bitset |
| **HyperLogLog** | {{PFADD}}, {{PFCOUNT}} | Ước lượng cardinality (unique count) với bộ nhớ cố định ~12KB – unique IP, unique search term |
| **Stream** | {{XADD}}, {{XREAD}}, {{XGROUP}} | **Message queue** (consumer group, acknowledgment, replay) – thay thế Kafka nhẹ |

### Ví dụ điển hình
- **Rate limit sliding window**: Sorted Set với score = timestamp, {{ZREMRANGEBYSCORE}} xoá entry cũ, {{ZCARD}} đếm request trong cửa sổ.
- **Distributed lock**: {{SET lock:order:123 "owner1" NX EX 10}} – atomic, auto-expire. Cần Lua script để unlock an toàn (chỉ unlock nếu value khớp owner). Lock trên một master với replication async có thể mất khi failover – với tác vụ quan trọng, kết hợp fencing token hoặc ràng buộc ở DB.
- **Leaderboard**: {{ZADD leaderboard 1500 "user:1"}}, {{ZREVRANGE leaderboard 0 9}} lấy top 10.
- **Session**: Hash {{session:abc123}} với field {{user_id}}, {{role}}, {{last_seen}} – {{HGETALL}} lấy toàn bộ, {{HINCRBY}} cập nhật counter.

### Pitfall production
- **Dùng String + JSON cho session** -> mỗi lần cập nhật một field phải GET -> deserialize -> modify -> serialize -> SET (race condition, tốn CPU). Hash cho phép {{HSET}} field đơn lẻ.
- **List làm queue** không có consumer group, không ack -> mất message khi worker crash. Dùng **Stream** cho queue production.
- **Big key** (Hash/List/Set/ZSet lớn) -> block Redis single thread khi {{DEL}}, {{HGETALL}}, {{ZRANGE}}. Dùng {{UNLINK}} (async delete), {{SCAN}}/{{HSCAN}}/{{ZSCAN}} duyệt theo cursor.
- **Lua script** cho atomic compound operation (check-then-act) – tránh race condition trong lock, rate limit.

> Senior tip: Redis không phải "cache thôi". Nắm vững 8 cấu trúc dữ liệu và biết khi nào dùng cái nào là dấu hiệu dev senior. Ví dụ: rate limit dùng Sorted Set (sliding window) hoặc String (fixed window/token bucket); leaderboard dùng Sorted Set; session thường dùng Hash (Spring Session Redis cũng lưu session dạng Hash); queue cần ack thì dùng Stream.`,
  follow: [
    'Tại sao không nên dùng Redis List để làm message queue production?',
    'Làm sao xử lý big key trong Redis (Hash/ZSet lớn) để không block main thread?'
  ],
  tags: ['Redis', 'String', 'Hash', 'List', 'Set', 'Sorted Set', 'Stream', 'rate limit', 'leaderboard', 'lock', 'session']
},
{
  id: 'db-025',
  topic: 'db',
  level: 'senior',
  q: 'Redis single-threaded nhưng vì sao nhanh? Persistence RDB vs AOF khác nhau ra sao, và Redis có mất dữ liệu không?',
  a: `**Tóm tắt:** Redis nhanh nhờ **I/O multiplexing** (epoll/kqueue) + **single-threaded event loop** (không context switch, không lock contention) + **data structure đơn giản** (O(1) hoặc O(log n)) + **toàn bộ dữ liệu trong RAM**. **RDB** (snapshot) nhanh, compact, phục hồi nhanh nhưng **mất dữ liệu** từ lần snapshot cuối. **AOF** (append-only log) bền vững hơn, configurable fsync ({{always}}/{{everysec}}/{{no}}), file lớn hơn, phục hồi chậm hơn. Redis **có thể mất dữ liệu** tùy cấu hình persistence và failure scenario.
 
### Vì sao single-thread vẫn nhanh
1. **Không context switch**: một thread xử lý tất cả command tuần tự.
2. **I/O multiplexing**: {{epoll}} (Linux) / {{kqueue}} (BSD) cho phép một thread quản lý hàng nghìn connection đồng thời – chỉ đọc/write khi socket ready.
3. **Cấu trúc dữ liệu tối ưu**: Hash table (O(1)), Skiplist (O(log n) cho ZSet), SDS string (binary safe, O(1) length).
4. **Pipelining**: client gửi nhiều command trong một round-trip, giảm chi phí mạng và syscall.
5. **Không lock contention** – single thread truy cập memory -> không cần mutex.

*Lưu ý*: Redis 6+ hỗ trợ **threaded I/O** cho network read/write (parsing, socket), nhưng command execution vẫn single-thread.

### RDB vs AOF
| Đặc điểm | RDB (Snapshot) | AOF (Append-Only File) |
|---|---|---|
| Cơ chế | Fork child process, dump memory ra đĩa | Ghi nối tiếp mọi write command |
| Tần suất | {{save 900 1}} (900s nếu 1 key thay đổi) | Mỗi write command |
| Kích thước file | Nhỏ (compressed, binary) | Lớn (text protocol); rewrite định kỳ để thu gọn |
| Phục hồi | **Nhanh** (load binary) | Chậm hơn (replay command); {{aof-use-rdb-preamble}} (mặc định bật) giúp phần nền load nhanh như RDB |
| Mất dữ liệu | Từ snapshot cuối tới crash | Tuỳ {{appendfsync}}: {{always}} ≈ 0, {{everysec}} ≈ 1s (tệ nhất ~2s), {{no}} = tuỳ OS flush |
| Tốn CPU/Disk | Fork + dump (có thể gây latency spike) | Ghi liên tục, fsync cost |

### Redis có mất dữ liệu không?
**Có**, trong các trường hợp:
1. **Chỉ dùng RDB**: crash giữa hai snapshot -> mất dữ liệu từ snapshot cuối.
2. **AOF {{appendfsync = everysec}}** (mặc định khi bật AOF): crash máy -> mất khoảng 1 giây dữ liệu (tệ nhất ~2 giây) còn trong OS cache chưa fsync.
3. **AOF {{appendfsync = no}}**: mất dữ liệu trong OS page cache (có thể nhiều giây).
4. **Replication async**: master crash trước khi replica sync -> mất write chưa replicate.
5. **OOM / OOM killer**: process bị kill -> mất toàn bộ memory (nếu không có persistence).

### Cấu hình bền vững khuyến nghị
~~~conf
# Bật cả hai
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec        # cân bằng hiệu năng/bền vững
no-appendfsync-on-rewrite yes
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
~~~
Với dữ liệu tài chính/critical: {{appendfsync always}} + replica + backup định kỳ.

### Pitfall production
- **Tắt persistence** ({{save ""}} + {{appendonly no}}) -> Redis thành pure cache, restart = mất sạch.
- **RDB fork() latency spike** trên instance memory lớn (>10GB) -> lời gọi fork chặn main thread (có thể từ hàng chục tới hàng trăm ms, nhất là trên VM). Giảm {{save}} frequency hoặc dùng AOF.
- **AOF rewrite** (compaction) cũng fork -> tương tự. Theo dõi {{aof_rewrite_in_progress}} metric.
- **Replication lag**: master write nhanh, replica chậm -> failover mất dữ liệu. Dùng {{min-replicas-to-write}} + {{min-replicas-max-lag}} để master từ chối write nếu replica quá chậm – chỉ giới hạn cửa sổ mất dữ liệu, không loại bỏ hoàn toàn.

> Senior tip: không có "miễn phí" – muốn tốc độ tối đa (sub-ms) thì chấp nhận rủi ro mất dữ liệu (chỉ RDB hoặc AOF everysec). Muốn hạn chế mất dữ liệu -> {{appendfsync always}} + replica + lệnh {{WAIT}} (Redis không có replication đồng bộ thật sự) -> latency tăng; dữ liệu tuyệt đối không được mất thì nguồn sự thật nên là DB. Hãy quy ước **SLO rõ ràng**: "rate limit/session/cache chấp nhận mất", "billing/inventory/idempotency key KHÔNG được mất".`,
  follow: [
    'Tại sao Redis 6+ thêm threaded I/O mà vẫn giữ command execution single-thread?',
    'Khi nào nên chọn RDB only, AOF only, hay cả hai?'
  ],
  tags: ['Redis', 'single-threaded', 'RDB', 'AOF', 'persistence', 'durability', 'fsync']
},
{
  id: 'db-026',
  topic: 'db',
  level: 'senior',
  q: 'Một nghiệp vụ Oracle chỉ được cung cấp qua PL/SQL package/procedure trả về REF CURSOR. Bạn gọi từ Spring JDBC thế nào, quản lý transaction và mapping kết quả ra sao?',
  a: `**Tóm tắt:** Với procedure Oracle, giữ ranh giới DB rõ ràng: khai báo đúng parameter, gọi qua Spring JDBC, consume cursor khi connection còn mở và map sang DTO. {{SimpleJdbcCall}} hỗ trợ khai báo procedure/function và metadata, nhưng package, overload, REF CURSOR thường cần khai báo tường minh để tránh phụ thuộc metadata driver.

### Luồng gọi
1. Xác định package, tên procedure, thứ tự/kiểu IN và OUT, kiểu cursor, quyền EXECUTE.
2. Dùng {{JdbcTemplate}} hoặc {{SimpleJdbcCall}} cùng {{SqlOutParameter}} có kiểu cursor phù hợp Oracle JDBC; cấu hình package name và bỏ qua metadata discovery nếu schema phức tạp.
3. Thực thi trong transaction Spring phù hợp. ResultSet/cursor tiêu thụ trước khi đóng connection; không trả cursor ra khỏi DAO.

~~~java
var call = new SimpleJdbcCall(jdbcTemplate)
    .withSchemaName("BANK_APP")
    .withCatalogName("ACCOUNT_PKG") // Oracle package
    .withProcedureName("find_entries")
    .withoutProcedureColumnMetaDataAccess()
    .declareParameters(
        new SqlParameter("p_account_id", Types.NUMERIC),
        new SqlOutParameter("p_rows", OracleTypes.CURSOR,
            (rs, row) -> new Entry(rs.getLong("ID"), rs.getBigDecimal("AMOUNT"))));
var result = call.execute(Map.of("p_account_id", accountId));
~~~

### Trade-off
| Cách | Hợp khi | Lưu ý |
|---|---|---|
| JdbcTemplate | Cần kiểm soát bind và mapping | Ít abstraction, code tường minh |
| SimpleJdbcCall | Procedure ổn định, nhiều OUT param | Metadata có thể sai với package/overload |
| JPA native call | Tích hợp entity đơn giản | Cursor/bulk result thường kém tự nhiên |

### Pitfall production
- Oracle package không tương đương schema name trong mọi abstraction; kiểm tra generated call trên đúng Oracle JDBC version.
- Đừng đưa {{ResultSet}} hoặc vendor cursor ra khỏi callback: transaction/connection có thể đã đóng.
- Bind parameter, không nối chuỗi SQL. Đo thời gian DB riêng với thời gian mapping.
- Procedure lỗi có thể trả vendor error code; chuyển thành exception nghiệp vụ ổn định, nhưng giữ SQLState/code trong telemetry đã lọc dữ liệu nhạy cảm.

> Senior tip: viết integration test trên Oracle tương thích môi trường thật cho REF CURSOR và overload; H2 không xác nhận được semantics Oracle.
`,
  follow: ['Khi nào SimpleJdbcCall cần khai báo parameter tường minh?', 'Bạn kiểm thử procedure Oracle trong pipeline CI thế nào?'],
  tags: ['Oracle', 'PL/SQL', 'SimpleJdbcCall', 'REF CURSOR']
},
{
  id: 'db-027',
  topic: 'db',
  level: 'senior',
  q: 'Procedure Oracle trả hàng trăm nghìn dòng để Java xử lý. Khi nào dùng REF CURSOR, BULK COLLECT/FORALL hoặc JDBC fetch batching, và kiểm soát bộ nhớ thế nào?',
  a: `**Tóm tắt:** Chọn nơi xử lý theo dữ liệu và nghiệp vụ: cursor streaming/JDBC fetch size khi Java cần đọc tuần tự với bộ nhớ giới hạn; {{BULK COLLECT}}/{{FORALL}} khi phép biến đổi nên chạy gần dữ liệu. Không tải vô hạn vào collection hoặc List chỉ để giảm số round trip.

### Cơ chế và lựa chọn
- REF CURSOR trả một result set; JDBC fetch size gợi ý số dòng lấy mỗi lượt, không đảm bảo mọi driver triển khai giống nhau.
- {{BULK COLLECT ... LIMIT}} gom từng lô PL/SQL để giảm context switch giữa PL/SQL và SQL mà vẫn giới hạn bộ nhớ.
- {{FORALL}} bind một collection cho DML hàng loạt, giảm round trip; exception theo từng phần cần thiết kế rõ (ví dụ SAVE EXCEPTIONS).

~~~sql
LOOP
  FETCH c_entries BULK COLLECT INTO l_entries LIMIT 500;
  EXIT WHEN l_entries.COUNT = 0;
  FORALL i IN 1 .. l_entries.COUNT
    INSERT INTO archive_entry(id, amount) VALUES (l_entries(i).id, l_entries(i).amount);
  COMMIT; -- chỉ nếu ranh giới commit theo lô được nghiệp vụ cho phép
END LOOP;
~~~

### Trade-off
| Phương án | Round trip | Bộ nhớ | Dùng khi |
|---|---:|---:|---|
| Java đọc cursor theo fetch size | Theo lô | Thấp | Java cần xử lý/đẩy downstream |
| BULK COLLECT giới hạn | Ít hơn PL/SQL từng dòng | Giới hạn bởi LIMIT | Logic và DML nằm trong Oracle |
| BULK COLLECT toàn bộ | Ít | Có thể rất lớn | Chỉ tập nhỏ, giới hạn được |

### Pitfall production
- Fetch size không phải kích thước trang nghiệp vụ; driver có thể buffer khác kỳ vọng. Đo heap và network với driver thật.
- Commit từng lô đổi semantics atomicity: job lỗi giữa chừng để lại phần đã commit. Cần checkpoint/idempotency và quy trình resume.
- DML hàng loạt bỏ qua một số hành vi ORM/callback; cập nhật version/audit/counter theo thiết kế rõ.
- Cursor mở lâu giữ session, snapshot và tài nguyên DB; đóng ResultSet/statement bằng try-with-resources và đặt timeout.

> Senior tip: đo rows/sec, PGA/heap, round trips và thời gian lock trên batch đại diện; tăng LIMIT/fetch size chỉ khi phép đo cho thấy round trip là nút thắt.
`,
  follow: ['Vì sao BULK COLLECT LIMIT tốt hơn gom toàn bộ?', 'Commit theo chunk ảnh hưởng khả năng chạy lại ra sao?'],
  tags: ['Oracle', 'BULK COLLECT', 'FORALL', 'JDBC', 'batch']
},
{
  id: 'db-028',
  topic: 'db',
  level: 'mid',
  q: 'Một bảng Oracle cần khóa chính sinh tự động và có thể triển khai cả Oracle lẫn PostgreSQL. Bạn chọn sequence hay identity thế nào, đặc biệt với insert batch và thứ tự ID?',
  a: `**Tóm tắt:** Sequence là object độc lập, cấp giá trị trước insert và linh hoạt cho nhiều bảng; identity gắn generator với cột, đơn giản cho một bảng. Sequence/identity thường có khoảng trống khi rollback, cache hoặc restart; ID không phải số thứ tự nghiệp vụ và không đảm bảo thứ tự commit.

### Cách hoạt động
Oracle hỗ trợ identity column và sequence; PostgreSQL identity cũng dựa trên sequence. Sequence cấp số độc lập transaction nên rollback không trả số đã lấy. Cache tăng throughput nhưng có thể tạo gap sau sự cố. Với sequence, ứng dụng có thể lấy ID trước khi insert; identity thường lấy qua generated keys/returning theo driver.

~~~sql
-- Oracle: dùng sequence tường minh khi cần tương thích/multiple consumers
CREATE SEQUENCE payment_seq CACHE 100;
INSERT INTO payment(id, amount) VALUES (payment_seq.NEXTVAL, :amount);

-- PostgreSQL: identity cho khóa kỹ thuật gắn với một cột
CREATE TABLE payment (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  amount numeric(19,2) NOT NULL
);
~~~

### Trade-off
| Tiêu chí | Sequence | Identity |
|---|---|---|
| Dùng chung nhiều bảng | Có | Không trực tiếp |
| Lấy ID trước insert | Thuận tiện | Thường lấy khi insert |
| DDL đơn giản | Thêm object | Gắn với cột |
| Portability | Syntax/cấu hình khác DB | Syntax khác DB, ý nghĩa gần nhau |

### Khi migrate
- Không giả định sequence name, cách lấy generated key hay cú pháp DDL giống nhau. Dùng migration riêng theo dialect và test driver.
- JPA {{GenerationType.IDENTITY}} có thể làm Hibernate phải insert sớm để lấy ID, ảnh hưởng batching; sequence generator cho phép cấp trước và batch thuận lợi hơn tùy dialect.
- Không expose ID để suy ra thời điểm giao dịch; dùng timestamp có semantics phù hợp hoặc business sequence được serialize riêng nếu thật sự cần.

### Pitfall production
- Gap không phải bằng chứng mất giao dịch. Không dùng ID làm số hóa đơn liên tục nếu yêu cầu đánh số pháp lý/nghiệp vụ riêng.
- Sequence cache lớn tăng hiệu năng nhưng restart/failover có thể bỏ qua vùng cache; không hạ cache nếu chỉ vì thấy gap.
- Bulk import: cấu hình allocation size của ORM phải tương thích increment của sequence.

> Senior tip: khóa chính là định danh kỹ thuật. Thiết kế số tham chiếu khách hàng riêng, có unique constraint và quy trình cấp số được audit.
`,
  follow: ['Vì sao rollback làm sequence có gap?', 'IDENTITY ảnh hưởng JDBC batching và Hibernate thế nào?'],
  tags: ['Oracle', 'PostgreSQL', 'sequence', 'identity', 'migration']
},
{
  id: 'db-029',
  topic: 'db',
  level: 'senior',
  q: 'Query Oracle chậm sau khi dữ liệu tăng mạnh. Bạn đọc execution plan và đánh giá optimizer hint thế nào trước khi sửa SQL hoặc thêm index?',
  a: `**Tóm tắt:** Bắt đầu từ plan thực tế, bind values và thống kê: so sánh estimated rows với actual rows, access path, join order, predicate và I/O. Hint chỉ là chỉ dẫn có điều kiện, không thay thế mô hình dữ liệu hay thống kê; ép plan có thể chữa một bind nhưng làm các bind khác chậm.

### Quy trình
1. Thu SQL, bind, elapsed/CPU, logical reads và số dòng thực tế; xác nhận cùng SQL_ID/cursor.
2. Xem actual plan (ví dụ DBMS_XPLAN.DISPLAY_CURSOR với thống kê phù hợp), không chỉ explain plan ước lượng.
3. Tìm nơi estimated rows lệch actual, full scan không hợp lý, implicit conversion, join nổ cardinality, sort/hash spill.
4. Kiểm tra stats/histogram, phân bố skew, index leading columns, partition pruning; thử sửa và đo trên dữ liệu đại diện.

### Hint và index
| Biện pháp | Có ích khi | Rủi ro |
|---|---|---|
| Cập nhật stats | Estimate cũ/sai | Stats mới gây plan khác, cần quan sát |
| Index | Predicate chọn lọc, truy cập lặp | Tốn storage và làm chậm ghi |
| Hint | Có bằng chứng optimizer chọn sai ổn định | Dính version/data/bind, khó bảo trì |
| SQL rewrite | Biểu thức che cột/logic khó tối ưu | Cần giữ semantics |

~~~sql
-- Tránh hàm trên cột nếu cần index thường
SELECT id, amount FROM txn
WHERE account_id = :account_id
  AND booked_at >= :from_ts AND booked_at < :to_ts;
-- Chỉ cân nhắc function-based index nếu biểu thức là yêu cầu ổn định
~~~

### Pitfall production
- Bind peeking/adaptive cursor sharing khiến một plan không tối ưu cho mọi giá trị bind; kiểm tra nhiều account với cardinality khác nhau.
- Hint có thể bị bỏ qua hoặc diễn giải khác theo phiên bản; ghi lại lý do, plan baseline/giám sát regression và cách gỡ.
- Đừng tạo index chỉ dựa trên một query; xem write rate, locking, storage, thống kê và workload tổng thể.

> Senior tip: lưu plan hash, buffer gets và p95 trước/sau; mục tiêu là giảm công việc DB cho workload thật, không phải làm plan trông đẹp.
`,
  follow: ['Estimated rows sai thường gợi ý vấn đề gì?', 'Khi nào function-based index đáng dùng?'],
  tags: ['Oracle', 'execution plan', 'optimizer', 'hint', 'index']
},
{
  id: 'db-030',
  topic: 'db',
  level: 'lead',
  q: 'Migrate ứng dụng ngân hàng từ Oracle sang PostgreSQL nhưng vẫn phải chạy song song và đối soát. Bạn lập kế hoạch xử lý khác biệt SQL, transaction và dữ liệu thế nào?',
  a: `**Tóm tắt:** Không coi migration là đổi JDBC URL. Lập inventory schema, SQL, procedure, sequence, kiểu dữ liệu, isolation và workload; chạy chuyển đổi theo expand/contract, backfill có checkpoint, CDC hoặc dual-read có kiểm soát, rồi đối soát trước cutover và giữ đường rollback.

### Khác biệt cần kiểm kê
| Vùng | Ví dụ rủi ro | Cách xác minh |
|---|---|---|
| SQL | {{NVL}}/{{DECODE}}, {{ROWNUM}}, package, hint | Static scan + test kết quả |
| Kiểu dữ liệu | NUMBER, DATE/TIMESTAMP, empty string/NULL | Mapping và boundary test |
| Sinh ID | sequence/identity, allocation | Test concurrency và batch |
| Transaction | isolation, locking, deadlock code | Contract test dưới tải |
| Tìm kiếm/sort | collation, case, timezone | Bộ dữ liệu ký tự/ngày thực tế |

### Chiến lược chuyển đổi
1. Chia workload theo bounded context; xác định nguồn dữ liệu có thẩm quyền tại từng giai đoạn.
2. Tạo schema mới, backfill theo khóa ổn định và checkpoint; ghi thay đổi phát sinh qua CDC/outbox hoặc dual-write có cơ chế phát hiện lệch.
3. So sánh count, tổng tiền theo partition, hash/canonical rows và các invariant ledger. Mọi mismatch phải có queue xử lý, không chỉ báo cáo tổng.
4. Canary read/write theo cohort; cutover có tiêu chí lag, error rate, reconciliation và rollback window.

### Pitfall production
- Oracle treats empty string as NULL cho kiểu ký tự; PostgreSQL phân biệt. Kiểm tra dữ liệu và predicate.
- Sequence values không đồng nghĩa bản ghi commit; CDC order, retry và thời điểm snapshot phải được thiết kế.
- Một lượt tổng checksum có thể che hai sai lệch bù trừ; đối soát theo khóa, ngày, currency và trạng thái.
- Không để hai DB cùng ghi độc lập mà không có quy tắc conflict; dual-write không atomic giữa hai hệ.

> Senior tip: với ledger, cutover chỉ sau khi cân bằng debit/credit và reconcile được theo từng partition/ngày; đặt ngưỡng mismatch bằng zero cho dữ liệu tài chính cốt lõi.
`,
  follow: ['Bạn xử lý khác biệt empty string và NULL ra sao?', 'Làm sao dual-write tránh tạo hai nguồn sự thật?'],
  tags: ['Oracle', 'PostgreSQL', 'migration', 'CDC', 'reconciliation']
},
{
  id: 'spring-028', topic: 'spring', level: 'senior',
  q: 'Vì sao gọi method {{@Transactional}} từ method khác trong cùng bean thường không mở transaction? Bạn xử lý self-invocation thế nào, và JDK proxy với CGLIB có khác gì?',
  a: `**Tóm tắt:** Spring transaction thường được áp dụng qua AOP proxy: caller gọi proxy, interceptor mở transaction rồi mới delegate vào target. Khi method trong target gọi {{this.otherMethod()}}, lời gọi đi thẳng vào object thật nên bỏ qua proxy; annotation trên method được gọi không được interceptor xử lý. JDK proxy chỉ expose interface, còn CGLIB tạo subclass để override method, nhưng cả hai đều không sửa được self-invocation.

### Luồng gọi
Với lời gọi bên ngoài, luồng là Controller → proxy → transaction interceptor → service target. Interceptor đọc metadata, lấy transaction manager, quyết định join/tạo transaction, rồi commit hoặc rollback theo exception. Trong nội bộ target, {{this.saveAudit()}} không quay lại proxy nên propagation, isolation hay timeout của method đó không được áp dụng độc lập.

### JDK proxy và CGLIB
| | JDK dynamic proxy | CGLIB subclass |
|---|---|---|
| Proxy type | Interface | Subclass của class cụ thể |
| Điều kiện | Có interface | Class không final, method không final/private |
| Gọi qua interface | Có | Có thể |
| Tự gọi nội bộ | Bypass interceptor | Bypass interceptor |

Boot mặc định thường dùng CGLIB cho Spring AOP, nhưng không nên dựa vào loại proxy để chữa self-call. Final class/method và private method vẫn không thể override để advice.

### Cách sửa có thể bảo trì
Tách phần cần transaction thành bean riêng, để lời gọi đi qua dependency proxy. Hoặc đặt transaction ở public entry point bao trọn use case. Self-injection hoặc {{AopContext.currentProxy()}} có thể làm proxy được gọi lại nhưng tạo coupling và làm flow khó đọc; chỉ dùng khi ranh giới class không thể thay đổi.

### Pitfall production
Test gọi method trực tiếp trên object tạo bằng {{new}} không có transaction proxy. Cũng vậy, gọi annotated method qua private method hoặc constructor không kích hoạt advice. Kiểm tra bằng integration test có transaction manager thật và quan sát commit/rollback, không chỉ assert annotation tồn tại.

> Senior tip: coi transaction boundary là ranh giới use case công khai. Một service method ngắn, được gọi qua bean proxy, thường an toàn hơn việc rải annotation lên helper nội bộ.`,
  follow: ['Vì sao {{@Transactional}} trên method private không có tác dụng với proxy?', 'Nếu tách bean không phù hợp, bạn kiểm chứng proxy thực tế của bean bằng cách nào?'],
  tags: ['@Transactional', 'AOP', 'JDK proxy', 'CGLIB', 'self-invocation']
},
{
  id: 'spring-029', topic: 'spring', level: 'senior',
  q: 'Một service dùng {{Propagation.REQUIRES_NEW}} để ghi audit trong lúc transaction ngoài cập nhật đơn hàng. Vì sao connection pool có thể cạn, và bạn định lượng rủi ro ra sao?',
  a: `**Tóm tắt:** {{REQUIRES_NEW}} suspend transaction hiện tại và chạy transaction độc lập. Nếu transaction ngoài đang giữ connection, transaction mới cần một connection khác; nhiều request đồng thời có thể giữ gần hết pool ở transaction ngoài rồi cùng chờ connection thứ hai, gây pool starvation hoặc timeout.

### Connection và transaction
Với {{REQUIRED}}, method trong cùng thread thường tham gia transaction đang chạy, nên không cần connection thứ hai. Với {{REQUIRES_NEW}}, Spring giữ resource transaction ngoài trong trạng thái suspended, bind resource mới cho transaction trong, rồi khôi phục resource ngoài khi transaction trong kết thúc. Transaction độc lập có thể commit audit dù outer rollback, nhưng trả giá bằng connection đồng thời và semantics tách rời.

Giả sử pool có 20 connection và 20 request đều đã lấy mỗi request một connection cho outer transaction. Nếu mỗi request gọi {{REQUIRES_NEW}}, không còn connection nào cho inner transaction; tất cả chờ và không thể giải phóng outer connection cho đến khi inner xong. Đây là deadlock tài nguyên ở cấp ứng dụng dù DB không có deadlock lock graph.

### Đánh giá và lựa chọn
- Ước lượng số request đồng thời tối đa nhân với số connection giữ ở outer scope; cân nhắc các luồng có lồng nhiều {{REQUIRES_NEW}}.
- Giữ transaction ngắn, không gọi dịch vụ chậm hoặc network khi đang giữ connection.
- Nếu audit phải cùng commit với nghiệp vụ, dùng cùng transaction; nếu chấp nhận eventual consistency, cân nhắc outbox được ghi trong outer transaction rồi worker chuyển tiếp.
- Nếu thực sự cần independent transaction, đặt timeout, theo dõi active/idle/pending của pool và load test với pool size giới hạn.

### Pitfall production
Tăng pool vô hạn chỉ chuyển nghẽn sang DB, nơi số session, memory và lock contention cũng hữu hạn. Một transaction ngoài đã suspend vẫn giữ connection, không có nghĩa connection được trả về pool. Cũng cần nhớ inner commit không rollback theo outer transaction, nên audit có thể ghi nhận hành động mà đơn hàng cuối cùng không được commit.

> Senior tip: dùng metric pending borrowers, acquisition latency và transaction duration để phát hiện trước khi timeout. Nếu pool cỡ N và mọi request có thể nested một tầng, kiểm tra kịch bản đồng thời gần N; headroom phải được thiết kế và thử tải, không đoán theo traffic trung bình.`,
  follow: ['Khi nào audit nên cùng transaction với dữ liệu nghiệp vụ?', 'Outbox giải quyết bài toán ghi event sau commit thế nào?'],
  tags: ['transaction propagation', 'REQUIRES_NEW', 'connection pool', 'HikariCP']
},
{
  id: 'spring-030', topic: 'spring', level: 'senior',
  q: 'Spring Boot 3 tìm auto-configuration từ đâu, và bạn lần theo một bean bất ngờ xuất hiện hoặc không xuất hiện thế nào?',
  a: `**Tóm tắt:** Spring Boot 3 khám phá auto-configuration qua metadata {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}} trong các jar trên classpath. Các class được import vẫn phải qua điều kiện như {{@ConditionalOnClass}}, {{@ConditionalOnMissingBean}} hay {{@ConditionalOnProperty}}; vì vậy dependency, property và bean do ứng dụng định nghĩa cùng quyết định kết quả.

### Cơ chế
{{@SpringBootApplication}} bao gồm component scan, auto-configuration enablement và configuration. Auto-configuration không phải magic quét mọi class: danh sách ứng viên được import, sau đó các condition đánh giá môi trường lúc tạo context. Ví dụ cấu hình datasource chỉ phù hợp khi có class JDBC cần thiết, cấu hình property hợp lệ và ứng dụng chưa cung cấp bean thay thế. Thứ tự/quan hệ {{before}} và {{after}} giúp các cấu hình phối hợp.

### Debug có hệ thống
1. Xác nhận dependency thực sự nằm trên runtime classpath, không chỉ compile scope.
2. Chạy ứng dụng với {{--debug}} để xem condition evaluation report: matched và negative match kèm lý do.
3. Kiểm tra property, profile active, classpath và bean cùng kiểu được định nghĩa thủ công.
4. Nếu viết starter nội bộ, khai báo class trong {{AutoConfiguration.imports}}, dùng điều kiện hẹp và cung cấp {{@ConditionalOnMissingBean}} để cho phép override.

Không dùng component scan để đăng ký auto-configuration từ thư viện như component thông thường. Boot 3 chuyển khỏi file {{spring.factories}} cho danh sách auto-configuration; file imports là cơ chế cần kiểm tra khi migrate starter cũ.

### Pitfall production
{{@ConditionalOnProperty}} mặc định cần property tồn tại và giá trị không phải false; cấu hình {{matchIfMissing}} thay đổi mặc định này. Điều kiện dựa trên class có thể khác giữa test và production do dependency transitively khác nhau. Exclude một auto-config để chữa triệu chứng có thể làm mất cả nhóm bean liên quan.

> Senior tip: khi bean thiếu, tìm negative match đầu tiên trong report thay vì thêm một {{@Bean}} nữa. Với starter dùng chung, viết context test cho cả trường hợp dependency có/không và bean ứng dụng override để hợp đồng auto-config được kiểm tra rõ.`,
  follow: ['Vì sao Boot 3 starter không nên đăng ký auto-configuration bằng component scan?', 'Bạn thiết kế điều kiện để app override bean mặc định ra sao?'],
  tags: ['Spring Boot 3', 'AutoConfiguration.imports', 'ConditionalOn', 'starter']
},
{
  id: 'spring-031', topic: 'spring', level: 'senior',
  q: 'Bạn thiết kế observability cho một request đi qua nhiều service thế nào để nối log, metric và distributed trace bằng Micrometer Tracing?',
  a: `**Tóm tắt:** Dùng Micrometer Observation làm abstraction cho instrumentation, Micrometer Tracing để tạo và truyền trace/span context, cùng registry/exporter phù hợp để gửi dữ liệu đến backend. Trace trả lời một request đã đi qua đâu và chậm ở span nào; metric cho biết xu hướng tổng thể, còn log chứa chi tiết sự kiện và nên mang trace ID để tra cứu liên kết.

### Trace context
Một inbound request tạo hoặc tiếp tục trace, mỗi lời gọi outbound tạo child span. HTTP instrumentation truyền context qua header chuẩn như W3C Trace Context; consumer message cần propagate context qua message metadata riêng. Nếu một service không instrument hoặc header bị proxy loại bỏ, trace bị đứt. Micrometer Tracing hỗ trợ bridge sang tracer như OpenTelemetry hoặc Brave tùy dependency.

### Thiết kế tín hiệu
- **Metrics:** latency histogram, request/error count, saturation; label phải có cardinality thấp.
- **Traces:** instrument boundary quan trọng như HTTP, DB và messaging; sampling cân bằng chi phí với khả năng điều tra.
- **Logs:** structured fields, trace/span ID; không ghi token, PII hoặc payload nhạy cảm.
- **Baggage:** chỉ truyền metadata nhỏ, đã kiểm soát; không dùng làm nơi chứa dữ liệu nghiệp vụ lớn.

### Pitfall production
Gắn userId, orderId hoặc URL đầy đủ làm metric tag sẽ tạo cardinality nổ và tăng bộ nhớ/chi phí. Sampling thấp có thể bỏ mất lỗi hiếm; tail-based sampling cần pipeline tương thích. Trace export đồng bộ hoặc queue exporter đầy có thể ảnh hưởng app, nên theo dõi drop và exporter health. Instrument thủ công lặp lại cùng span còn làm trace nhiễu.

Đo latency giữa các service cần đồng bộ clock tương đối tốt, nhưng duration của span cục bộ đáng tin hơn so timestamp tuyệt đối. Không xem trace là audit log: sampling và retention khiến trace không đảm bảo lưu mọi request.

> Senior tip: bắt đầu với RED metrics (rate, errors, duration), rồi trace các đường đi có giá trị điều tra. Theo dõi cả chi phí ingest và cardinality; dashboard đẹp nhưng tag không giới hạn sẽ biến observability thành sự cố vận hành.`,
  follow: ['Khi nào chọn head sampling và tail sampling?', 'Vì sao không nên đặt orderId làm label của metric?'],
  tags: ['Micrometer', 'Tracing', 'Observation', 'OpenTelemetry', 'observability']
},
{
  id: 'spring-032', topic: 'spring', level: 'senior',
  q: 'Ứng dụng Spring Boot 3 chạy workload blocking muốn bật virtual thread bằng {{spring.threads.virtual.enabled}}. Bạn đánh giá lợi ích, giới hạn và kế hoạch rollout thế nào?',
  a: `**Tóm tắt:** Trên Java 21+, cấu hình {{spring.threads.virtual.enabled=true}} yêu cầu Spring Boot dùng virtual thread ở các integration được hỗ trợ. Virtual thread giảm chi phí thread cho nhiều tác vụ blocking đồng thời, nhưng không làm CPU nhanh hơn, không tăng giới hạn connection hay tự biến code blocking thành non-blocking; cần kiểm tra version Boot, pinning và tài nguyên downstream.

### Mô hình
Platform thread gắn với OS thread, nên lượng lớn thread chờ I/O tốn stack và scheduling resource. Virtual thread được runtime mount lên carrier thread khi chạy, thường unmount khi blocking operation tương thích. Khi hoàn thành, nó trả kết quả như thread thông thường, giúp code imperative dễ giữ. Nó hữu ích khi số tác vụ đồng thời lớn và phần lớn thời gian chờ I/O.

### Giới hạn và rollout
- CPU-bound workload vẫn bị giới hạn bởi core; hàng triệu virtual thread không tăng throughput tính toán.
- JDBC pool, remote API quota, file descriptor và memory vẫn là giới hạn. Throttle bằng semaphore/bulkhead và pool phù hợp.
- Pinning có thể xảy ra trong một số vùng synchronized/native khi virtual thread blocking; kiểm tra tài liệu JDK và diagnostic JFR của runtime.
- Xác minh Boot version và component nào dùng executor virtual thread; không giả định mọi scheduler/third-party library tự chuyển đổi.
- Benchmark latency, throughput, heap, carrier utilization và downstream saturation trước/sau dưới tải đại diện.

### Pitfall production
Tối ưu thread count nhưng bỏ qua connection pool có thể tạo hàng chục nghìn tác vụ cùng chờ lấy connection và làm latency đuôi tăng. Thread-local cache có thể nhân memory theo virtual thread nếu tạo quá nhiều task. Không dùng synchronized block dài quanh I/O mà không đánh giá runtime/JDK cụ thể.

> Senior tip: virtual thread giúp mở rộng concurrency của blocking I/O, không phải nút tăng tốc tổng quát. Rollout theo canary, giữ giới hạn concurrency ở biên phụ thuộc và so p95/p99 cùng pool wait time, không chỉ nhìn CPU thấp hơn.`,
  follow: ['Virtual thread khác reactive programming ở điểm nào?', 'Làm sao phát hiện virtual thread bị pinning trong môi trường thật?'],
  tags: ['Java 21', 'virtual threads', 'Spring Boot', 'concurrency']
},
{
  id: 'spring-033', topic: 'spring', level: 'lead',
  q: 'Khi deploy phiên bản mới, bạn thiết kế graceful shutdown cho Spring Boot để không làm mất request đang xử lý và vẫn đáp ứng thời hạn của orchestrator thế nào?',
  a: `**Tóm tắt:** Graceful shutdown ngừng nhận request mới, cho request đang xử lý một khoảng thời gian hoàn tất, rồi đóng các resource theo thứ tự. Spring Boot hỗ trợ graceful shutdown cho embedded web server; cần phối hợp readiness/load balancer, timeout của nền tảng và việc dừng consumer/job để giới hạn tổng thời gian thoát.

### Trình tự
Khi nhận tín hiệu shutdown, instance phải sớm rời khỏi endpoint nhận traffic (readiness false), load balancer cần thời gian cập nhật, sau đó server ngừng nhận kết nối/request mới theo cơ chế graceful. Request đang chạy được drain trong thời hạn cấu hình. Bean lifecycle dừng các worker và giải phóng tài nguyên; cuối cùng process thoát trước khi orchestrator gửi SIGKILL.

### Thiết kế
- Bật graceful shutdown của Boot và đặt shutdown phase timeout dựa trên thời lượng request thực tế.
- Tổng grace period của orchestrator phải lớn hơn readiness propagation + drain window + dừng consumer/cleanup, có buffer.
- Với queue consumer, pause nhận message, hoàn tất hoặc nack để broker redeliver; xử lý idempotent để tránh duplicate.
- Dừng scheduled jobs và executor có timeout; tránh cleanup gọi dịch vụ ngoài không giới hạn.
- Theo dõi termination reason, request bị cắt, thời gian drain và số message in-flight.

### Pitfall production
Readiness chỉ đổi sau khi process bắt đầu tắt có thể khiến load balancer tiếp tục gửi traffic một khoảng ngắn. Timeout quá ngắn làm request bị kill; quá dài giữ rollout treo hoặc vượt ngân sách deployment. Web server drain không tự xử lý transaction đang chạy ở background executor hay message listener. Shutdown hook không đảm bảo chạy khi process bị SIGKILL hoặc host mất điện.

> Senior tip: lấy p99 thời lượng request và thời gian deregistration thực tế để đặt grace period, sau đó diễn tập rolling deploy dưới tải. Graceful shutdown giảm gián đoạn, nhưng retry an toàn và idempotency vẫn là lớp bảo vệ cuối cho client.`,
  follow: ['Kubernetes readiness và Spring graceful shutdown cần thứ tự phối hợp ra sao?', 'Consumer đang xử lý message khi shutdown thì đảm bảo không mất message thế nào?'],
  tags: ['graceful shutdown', 'Spring Boot', 'Kubernetes', 'readiness']
},
{
  id: 'spring-034', topic: 'spring', level: 'senior',
  q: 'Lần deploy gần nhất service không boot được: log dừng ở Flyway, một instance báo "Flyway validate failed" và các pod còn lại không sẵn sàng. Flyway lấy khoá schema ra sao khi 2 instance boot cùng lúc, vì sao một migration nặng treo cả rollout, và bạn xử lý thế nào?',
  a: `**Tóm tắt:** Flyway cần khoá schema độc quyền trước khi migrate/validate: instance đầu tiên lấy khoá, các instance khác chờ trong số lần retry cho phép rồi báo lỗi, pod không boot. Migration nặng (CREATE INDEX trên bảng lớn) giữ khoá và kéo dài startup, khiến rollout đứng. Xử lý ngắn hạn: tăng số lần retry; dài hạn: chỉ một nơi một lúc migrate, hoặc tách migration thành bước riêng trước khi app mới nhận traffic.

### Khoá schema của Flyway
Flyway không chỉ đọc bảng {{flyway_schema_history}} rồi chạy SQL. Trước khi migrate, nó phải đảm bảo đúng một instance thao tác trên database, nên cần một khoá schema (cơ chế khác nhau theo DB: metadata lock, bảng khoá riêng hoặc advisory lock). Instance thứ hai phải chờ khoá; tham số {{lockRetryCount}} - cấu hình {{spring.flyway.lock-retry-count}} trên Boot 3 - quy định số lần thử trước khi bỏ cuộc, mặc định thấp nên chưa tới lúc migration xong là instance chờ đã báo lỗi. Log thường hiện "could not acquire schema lock" hoặc "Flyway validate failed" tùy bước nào vấp.

### Vì sao migration nặng treo cả rollout
1. Pod mới boot: Flyway chạy trước web server nhận request và trước readiness.
2. Migration nặng (index trên bảng hàng chục triệu dòng, backfill) giữ khoá đủ lâu.
3. Các pod còn lại boot đồng loạt, chờ khoá, cạn retry, khởi động lỗi.
4. Orchestrator đuổi pod cũ theo rollout; pod cũ chết trước khi pod mới sẵn sàng, có khoảng thời gian cả cụm không có pod sẵn.

Kết luận: nơi và thời điểm chạy migration phải được thiết kế, không để nó tự lo theo mặc định.

### Cấu hình và tổ chức
~~~yaml
spring:
  flyway:
    enabled: true
    validate-on-migrate: true      # schema lệch thì boot fail nhanh, dễ thấy
    lock-retry-count: 10           # chờ instance khác migrate xong
    baseline-on-migrate: false     # chỉ bật đúng một thời điểm adopt schema cũ
~~~

- Cụm nhiều instance: chạy migration ở một bước riêng (job/init container hoặc pipeline trước khi deploy app), hoặc giữ trong app nhưng quy định chỉ một instance migrate rồi mới scale-out.
- Dùng user DB riêng cho Flyway với quyền tối thiểu (DDL/DML cần thiết), không dùng chung user runtime của app.
- Giữ migration nhỏ và tương thích với cả code cũ lẫn code mới (expand/contract) để rollback version app vẫn chạy được schema mới.

### Pitfall production
- Bật {{baseline-on-migrate}} để "cho qua" trên mọi env khiến Flyway coi nguyên schema cũ là hợp lệ, che đi sự lệch thật mà mỗi nơi lệch một kiểu.
- Trên PostgreSQL, migration chờ metadata lock khi các query của pod cũ còn chạy; giám sát bằng {{pg_stat_activity}} để phân biệt "chờ khoá" với "chính nó chậm".
- Orchestrator kill pod giữa migration nếu grace period quá ngắn; dừng hoàn tất migration lành lặn hay không phụ thuộc vào DB có transactional DDL (PostgreSQL có; MySQL DDL tự commit nên cần bước sau tiếp tục).

> Senior tip: đo thời lượng từng migration qua cột {{installed_on}} của bảng history và alert khi vượt 60 giây; trước release, chạy thử trên dữ liệu staging kích thước thật để biết trước migration nào nặng, đừng để prod là nơi thử lần đầu.`,
  follow: ['Vì sao CREATE INDEX CONCURRENTLY không chạy được trong transaction mà Flyway mặc định mở?', 'Khi nào baseline-on-migrate hợp lý và rủi ro của nó là gì?'],
  tags: ['Flyway', 'schema lock', 'lockRetryCount', 'deployment', 'migration']
},
{
  id: 'spring-035', topic: 'spring', level: 'senior',
  q: 'Flyway phân biệt versioned (V__) và repeatable (R__) migration thế nào? Checksum trong bảng history có tác dụng gì, bạn xử lý lỗi "checksum mismatch" ra sao, và có bao giờ được sửa lại file migration đã chạy?',
  a: `**Tóm tắt:** Versioned (V__) chạy đúng một lần theo thứ tự phiên bản; repeatable (R__) chạy lại khi nội dung thay đổi và luôn sau các versioned còn thiếu. Checksum ghi vào bảng {{flyway_schema_history}}; lỗi "checksum mismatch" nghĩa là file đã đổi sau khi đã chạy - cách xử lý chuẩn là **thêm migration mới**, không sửa file cũ; {{repair}} chỉ dùng khi có chủ ý và review.

### Hai kiểu và checksum
- **Versioned** {{V1__create_order.sql}}, {{V1.2__add_outbox.sql}}: mỗi phiên bản chạy tối đa một lần, đánh dấu vào history; trạng thái schema được tóm trong một phiên bản duy nhất - "DB đã đến Vx" đủ cho cả team hiểu.
- **Repeatable** {{R__refresh_views.sql}}: chạy lại khi nội dung thay đổi và luôn sau cùng các versioned, sắp theo description; dùng cho các đối tượng phụ thuộc nhiều thứ khác: view, function/trigger, seed danh mục ít đổi. Description (phần sau dấu __) là tên của nó, đổi tên file là đổi đối tượng theo nghĩa Flyway.

Checksum là **hash nội dung file**, lưu lúc migration chạy. Validate đối chiếu file trên disk với dòng history: cơ chế này bảo đảm nội dung đang khởi động đúng như nội dung đã được review và chạy trước đó. Lỗi mismatch nghĩa là có người đã sửa file - đây là cơ chế bảo vệ, không phải Flyway khó tính vô cớ.

### Xử lý theo tình huống
| Tình huống | Xử lý |
|---|---|
| V__ đã chạy ở prod | Thêm V mới để sửa; tuyệt đối không đụng file cũ |
| File chưa đến prod, sửa nhỏ trước release | Được, nhưng mọi env đã chạy file cũ sẽ lệch checksum → phải đồng thời baseline lại các env đó |
| History lệch do restore/copy DB tay | {{repair}} canh chỉnh checksum/pending, kèm review và backup |
| Feature branch merge trễ sau V12 | Bật {{out-of-order}} để V11 bổ sung sau V12, có chính sách rõ |

### Semantics đáng nhớ
- Flyway chạy từng migration trong transaction riêng trên DB hỗ trợ (PostgreSQL); MySQL DDL tự commit, nên migration nhiều bước fail giữa chừng để schema "nửa vời" - cần biết trước và có migration sửa tiếp theo.
- {{out-of-order}} chỉ nên bật kèm chính sách: dùng cho nhánh merge trễ ở staging, ghi rõ ai thêm migration nào trước cái nào; bật vô thức trên prod làm thứ tự giữa các branch khó tái hiện.
- Repeatable không thay thế versioned cho thay đổi cấu trúc bảng: mọi thay đổi DDL nên versioned để câu chuyện lịch sử nhất quán trên mỗi env.

### Pitfall production
- Sửa file đã chạy chỉ để dọn comment/format: prod không đổi ngay, nhưng boot tiếp theo nổ checksum - thường đúng giờ cao điểm.
- Tập thói quen gọi repair mỗi khi validate lỗi khiến checksum mất vai trò cảnh báo; repair phải là quyết định có review, không là thuốc xịt.
- Ghép migration từ nhiều service cùng schema chung: các V tăng dần có thể đụng cùng một version; quy ước khoảng version riêng cho từng service hoặc thư mục vị trí riêng theo service.

> Senior tip: khoá policy bằng CI: định kỳ chạy {{flyway validate}} trên một DB dựng từ đầu từ V1 tới bản mới nhất và trên snapshot staging; bất kỳ file nào drift khỏi hai đường đó sẽ lộ ra trước khi tới prod.
`,
  follow: ['Flyway repair làm gì và khi nào dùng nó là an toàn?', 'Vì sao migration nhiều bước trên MySQL cần nhớ implicit commit của DDL?'],
  tags: ['Flyway', 'checksum', 'versioned migration', 'repeatable', 'out-of-order']
},
{
  id: 'spring-036', topic: 'spring', level: 'mid',
  q: 'Bạn thêm một field mới vào DTO nhưng response JSON vẫn không thấy field đó; một endpoint khác lại nổ "Java 8 date/time type not supported by default". Những bẫy Jackson nào khiến JSON âm thầm sai, và bạn cấu hình ObjectMapper đúng thế nào với Spring Boot?',
  a: `**Tóm tắt:** Jackson mặc định serialise qua getter/property public: field private không getter bị bỏ qua, không exception nào báo. Ngày giờ java.time cần module JSR-310 - chỉ ObjectMapper do Boot auto-cấu hình là được nạp sẵn, còn một {{new ObjectMapper()}} tự chế thì trắng tinh mọi cấu hình. Cách đúng: để Boot quản ObjectMapper ({{spring.jackson.*}}) hoặc khai bean JsonMapper tường minh, kèm vài cờ fail-loud để lỗi lộ sớm.

### Visibility: cái gì được serialise
~~~java
public record OrderFee(String code, BigDecimal amount) {}   // record: tự nhận accessor

public class OrderDto {
    private String orderId;                    // không getter  -> KHÔNG có trong JSON
    private boolean paid;
    public boolean isPaid() { return paid; }   // -> property "paid" (isX cho boolean)
}
~~~

Vì getter quyết định mọi thứ, nhiều điều kỳ quái bắt nguồn từ tên method: getter gõ nhầm {{getSatus}} sinh key {{satus}} gửi ra client; thêm field mới nhưng quên thêm getter; hoặc client chờ field mới mà JSON vẫn không thay đổi - không có exception nào báo, chỉ thiếu một cách im lặng. Hướng phòng: {{@JsonProperty}} cố định tên property, dùng record cho DTO mới để accessor tự rõ, và có test assert key tồn tại.

### Java time: lỗi rõ và drift im lặng
- ObjectMapper **không** có {{JavaTimeModule}}: Jackson 2 nổ {{InvalidDefinitionException}} (Java 8 date/time type not supported by default) - lỗi rõ, dễ tra.
- Có module nhưng vẫn còn default: {{WRITE_DATES_AS_TIMESTAMPS}} không tắt → {{LocalDate}} trả dạng array như [2026,5,1], {{Instant}} trả epoch giây; JSON có vẻ hợp lệ nhưng khác ISO-8601 - lệch phía client, im lặng phía server.

Boot auto-cấu hình ObjectMapper có sẵn {{JavaTimeModule}} và tắt {{WRITE_DATES_AS_TIMESTAMPS}}. Vì vậy quy tắc: mọi ObjectMapper trong app xuất phát từ một nguồn cấu hình chung và được inject; new ObjectMapper() rải rác là nguồn drift phổ biến nhất. Khi nâng lên Jackson 3 (Boot 4): package đổi sang tools.jackson, hỗ trợ java.time đã tích hợp trong databind - đọc release notes, không chép cấu hình theo thói quen Jackson 2.

### Cấu hình tay đúng chỗ
~~~java
@Bean
JsonMapper jsonMapper() {
  return JsonMapper.builder()
      .addModule(new JavaTimeModule())
      .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
      .enable(SerializationFeature.FAIL_ON_EMPTY_BEANS)   // DTO không có property -> exception, không trả {}
      .build();
}
~~~
Không cần bean riêng thì chỉnh yaml: {{spring.jackson.serialization.*}}, {{spring.jackson.default-property-inclusion}}. ObjectMapper sau khi cấu hình là **thread-safe**: tạo một lần trong vòng đời app.

### Pitfall production
- {{@JsonInclude(NON_NULL)}} làm field giá trị null mất hẳn khỏi JSON; client phân biệt "key không tồn tại" với "key = null", nên đổi cấu hình này là thay đổi hợp đồng API.
- Tắt {{FAIL_ON_EMPTY_BEANS}} để cho yên tĩnh sẽ che hẳn lớp DTO quên getter toàn bộ, output thành {{}} rỗng; kiểm tra cấu hình hiện hành của ObjectMapper trước khi quyết định tắt.
- Một util tĩnh new ObjectMapper() chảy từ service cũ sang nhiều đường gọi: trong cùng một app, khu này trả ISO, khu kia trả timestamp - hai ObjectMapper hai cấu hình.
- Tạo ObjectMapper mới mỗi request là lãng phí và dễ lệch; cấu hình một lần hoặc qua một bean duy nhất.

> Senior tip: contract test nhẹ: dùng chính ObjectMapper của app serialise DTO đại diện (đầy đủ java.time, null, list rỗng) rồi assert key và format; vài phút mỗi DTO nhưng bắt được cả visibility, date drift lẫn việc đổi tên getter.`,
  follow: ['Vì sao một ObjectMapper tự new lại mất cấu hình JavaTimeModule?', 'NON_NULL thay đổi hợp đồng API với client ra sao?'],
  tags: ['Jackson', 'ObjectMapper', 'JavaTimeModule', 'visibility', 'DTO']
},
{
  id: 'spring-037', topic: 'spring', level: 'senior',
  q: 'Serialise một entity Hibernate ra JSON: một endpoint trả response có thêm "hibernateLazyInitializer", endpoint khác nổ StackOverflowError vì quan hệ hai chiều. Proxy Hibernate tương tác với Jackson ra sao, cấu hình lớp an toàn nào cần thiết, và vì sao DTO projection vẫn là lựa chọn bền?',
  a: `**Tóm tắt:** Relation LAZY chưa fetch là một proxy Hibernate (subclass sinh runtime); Jackson serialise qua getter nên gọi lên proxy: hoặc kích hoạt lazy load khi session còn mở (N+1 ngay lúc serialise), hoặc {{LazyInitializationException}} khi session đã đóng, hoặc lộ property nội bộ {{hibernateLazyInitializer}}/{{handler}}. Quan hệ hai chiều không cắt một phía tạo vòng đệ quy vô hạn - StackOverflowError. JSON nên do DTO mô tả; annotation trên entity chỉ là lớp mạng an toàn.

### Proxy gặp Jackson ra sao
Hibernate trả proxy chỉ mang id; fetch thật xảy ra ở lần đầu gọi getter nếu persistence context còn mở. Serialization thường chạy sau khi service đóng transaction (trong Controller, ở HTTP message writer), nên kết thúc có ba kết quả:
- proxy chưa init + session đã đóng → {{LazyInitializationException}};
- proxy đã init → JSON thêm data không chủ đích, và một vài query N+1 xảy ra ngay bước serialise;
- property runtime của proxy không được ẩn → output dính {{hibernateLazyInitializer}} và {{handler}} vì Jackson dò mọi getter public trên proxy.

### Phòng tuyến khi buộc phải trả entity
~~~java
@Entity
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})   // ẩn property runtime của proxy
class Order {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JsonIgnore                        // cắt MỘT phía của vòng hai chiều
  private Customer customer;

  @OneToMany(mappedBy = "order")
  private List<OrderLine> lines;     // phía lines được serialise, phía Line.order bị cắt
}
~~~
Vòng đệ quy hai chiều trên entity cũ có thể dùng {{@JsonManagedReference}}/{{@JsonBackReference}} đánh dấu parent/child, nhưng chỉ hợp một quan hệ một chiều đích thực và vẫn trói API vào model - quan hệ phức tạp thì DTO sạch hơn. Hoặc thêm module jackson-datatype-hibernate6 (chọn artifact khớp Hibernate 6 đang chạy) để proxy chưa init chỉ serialise id, không cần rải annotation từng entity.

### Vì sao DTO projection bền hơn
- Hợp đồng API không buộc vào model lưu trữ: đổi schema không vỡ client.
- Fetch plan được chọn rõ cho từng use case (JOIN FETCH, {{@EntityGraph}}, constructor expression), serialization không bao giờ ngẫu nhiên kích hoạt lazy.
- Không dính property proxy nội bộ, không vòng đệ quy bẩm sinh: một mapper (MapStruct hoặc record constructor) là đủ, không cần đội annotation trên từng entity.

### Pitfall production
- {{@JsonIgnore}} đặt cho quan hệ để cứu một endpoint, sau đó thêm endpoint khác cần chính field đó → dữ liệu bị cắt một cách im lặng; {{@JsonView}} phân lớp được nhưng cần quy tắc rõ trong team.
- Serialise chạy sau commit: các query lúc serialise không nằm trong transaction nghiệp vụ của endpoint; không theo dõi query count thì không thấy N+1 kiểu này.
- Dùng bytecode enhancement cho entity khiến lớp proxy sinh ra khác biệt theo cấu hình; khi cấu hình lazy fetch giữa dev và prod khác nhau, hành vi serialise đã kiểm chứng ở dev sẽ lệch trên prod - giữ cùng một cấu hình ở mọi môi trường.

> Senior tip: quy tắc thực dụng: JSON luôn qua DTO; trên entity chỉ giữ một cấu hình ẩn {{hibernateLazyInitializer}} như mạng an toàn chung, không coi là chiến lược chính; theo dõi số query mỗi endpoint để thấy N+1 phát sinh ngay lúc serialise.`,
  follow: ['{{@JsonManagedReference}}/{{@JsonBackReference}} giải vòng đệ quy thế nào, khi nào không đủ?', 'Vì sao N+1 lúc serialise khó phát hiện hơn N+1 trong service?'],
  tags: ['Jackson', 'Hibernate proxy', 'hibernateLazyInitializer', 'infinite recursion', 'DTO']
},
{
  id: 'spring-038', topic: 'spring', level: 'lead',
  q: 'Service chạy ổn ở local nhưng ở prod, lần boot sau nổ "Migration checksum mismatch", còn một vài route ít dùng báo "column does not exist". Schema prod đã trôi lệch khỏi các file migration: drift hình thành ra sao, bạn xử lý thế nào khi nó lộ ra, và chính sách nào ngăn nó lặp lại?',
  a: `**Tóm tắt:** Schema drift là khi DB thật của một môi trường khác với cái các file migration mô tả: một ALTER chạy tay để dập sự cố, script của service khác, merge trễ, hay restore cũ. Nó lộ theo hai bản mặt: boot fail tại validate (checksum mismatch) hoặc lỗi runtime "column does not exist" trên một đường API ít đi. Tôi xử lý bằng quy trình so-diff - forward-fix - repair có review, và ngăn lặp bằng chính sách "schema chỉ đi qua migration" kèm flyway validate trong CI.

### Drift hình thành theo đường nào
1. **Sự cố ngoài giờ**: DBA ALTER prod cho nhanh (thêm index, đổi kiểu, thêm cột) mà không có migration tương ứng - prod chạy ngay, mọi env khác không có.
2. **Schema dùng chung nhiều service**: một service khác thêm cột/bảng "của riêng nó" trong cùng database.
3. **Nhánh sống lâu**: file V được edit sau khi đã chạy ở một env nào đó, hoặc merge trễ khiến thứ tự version lộn - kết hợp với checksum mismatch lúc boot.
4. **Restore/snapshot**: schema được khôi phục về thời điểm cũ, bảng Flyway history đi theo trạng thái cũ hoặc mất đồng bộ.

Prod "chạy tốt ngay lúc đó" chính là lý do kéo dài thời gian drift ẩn nấp - lỗi nổ ở lần boot kế, hoặc chỉ với đường API ít được gọi sau vài ngày.

### Quy trình xử lý khi drift lộ ra
1. **Đóng băng thay đổi schema** cho tới khi có kế hoạch; dừng các deploy đang chờ.
2. **So khác biệt**: dump schema prod (pg_dump --schema-only) và dựng một schema sạch từ V1 tới bản mới nhất, rồi diff từng bảng, cột, index, constraint; liệt kê từng đối tượng lệch và nguồn gốc của nó.
3. **Forward-fix**: những thay đổi cần giữ được chuẩn hoá thành migration mới; những mảnh dư cũng được dọn qua migration - tuyệt đối không ALTER tay "cho nhanh" lần nữa.
4. **Repair có review** nếu checksum lệch do file đã bị sửa: sau khi quyết định bước 3, dùng repair để đóng dấu lại history, kèm backup. Không dùng repair để "phục hồi đồng bộ" mà chưa biết lệch bao nhiêu.
5. **Quay về quy ước**: từ đó mọi env dùng cùng chuỗi migration; nếu môi trường nào phải giữ schema đặc biệt, phần khác biệt đó phải được mô tả bằng migration riêng chứ không nằm ngoài hệ thống.

### Ngăn lặp lại
- **Chính sách**: mọi thay đổi schema phải qua PR chứa file migration; user DBA hay "operator" không có quyền DDL tự do, yêu cầu ALTER phải qua ticket và dẫn tới một migration.
- **CI hai đường**: flyway validate trên một DB dựng từ đầu từ V1 (bắt file hỏng, thứ tự, conflict), và validate định kỳ (nightly) trên snapshot staging/prod để bắt drift ngoài code.
- **Giám sát history**: bảng {{flyway_schema_history}} có dòng mới không từ deploy pipeline là red flag; đặt alert cho event đó.

### Pitfall production
- Hai team cùng schema nhưng không phân vùng version/thư mục: ai đó sửa file của team khác, checksum nổ ở chỗ không ai ngờ.
- Repair dùng như thuốc tẩy mỗi khi nổ: cơ chế checksum mất vai trò cảnh báo "đã có thứ gì đổi ngoài quy trình".
- Bật baseline-on-migrate để dập lỗi: mỗi env được coi là hợp lệ với schema thật khác nhau - drift không được sửa mà được niêm yết thành trạng thái chính thức.

> Senior tip: đừng đo drift bằng "bao nhiêu cột lệch" - hãy đo bằng thời gian từ lúc drift xuất hiện đến lúc CI cảnh báo. Với chính sách validate nightly trên snapshot, một ALTER tay đêm khuya bị thấy lại vào sáng hôm sau; không có nó, drift có thể sống hàng tuần và nổ đúng lúc release lớn.`,
  follow: ['{{flyway repair}} sửa những gì trong bảng history?', 'Bạn dựng schema diff giữa prod và migration code bằng công cụ nào?'],
  tags: ['schema drift', 'Flyway', 'validate', 'CI', 'baseline-on-migrate']
},
{
  id: 'jpa-022', topic: 'jpa', level: 'senior',
  q: 'Persistence context của Hibernate theo dõi entity thế nào, dirty checking diễn ra lúc nào, và flush order có ý nghĩa gì khi một transaction vừa insert vừa update?',
  a: `**Tóm tắt:** Persistence context là identity map và đơn vị theo dõi entity managed trong một transaction/session. Hibernate giữ trạng thái ban đầu (snapshot), dirty checking so sánh entity khi flush để tạo SQL; flush đồng bộ thay đổi xuống DB nhưng không đồng nghĩa commit. Hibernate dùng thứ tự action xác định, không nhất thiết đúng thứ tự câu lệnh Java.

### Vòng đời và dirty checking
Entity transient chưa được quản lý; sau {{persist}} trở thành managed. Khi load entity, Hibernate lưu snapshot cùng entry trong persistence context. Thay đổi field Java chưa lập tức phát SQL; tại flush (thường trước query cần đồng bộ hoặc trước commit), Hibernate phát hiện khác biệt, tạo update và bind giá trị. Entity detached không còn được tự theo dõi.

Một context chỉ có một instance cho mỗi entity type và primary key: hai lần load cùng khóa trả về cùng object managed. Điều này đảm bảo identity nhất quán trong transaction nhưng làm context lớn giữ nhiều object và snapshot.

### Flush order
Hibernate thực thi action queue theo nhóm (ví dụ insert, update, collection actions, delete) thay vì giữ nguyên thứ tự source code. Constraint DB vẫn là nguồn sự thật. Nếu cần thứ tự phụ thuộc, thiết kế FK/association đúng, flush có chủ đích hoặc tách transaction theo nghiệp vụ; đừng dựa vào thứ tự gọi repository.

### Pitfall production
Bulk JPQL update/delete chạy trực tiếp ở DB và bỏ qua dirty checking của entity đang nằm trong context, nên object managed có thể stale; clear/refresh phù hợp sau bulk operation. Flush không làm dữ liệu durable: rollback vẫn hoàn tác SQL. Thay đổi collection lớn có thể tạo nhiều snapshot/SQL và tăng heap.

> Senior tip: với batch lớn, flush rồi clear theo chunk để giới hạn persistence context; kiểm tra SQL thực phát và transaction log thay vì suy ra từ số lần gọi {{save}}.`,
  follow: ['Query auto-flush xảy ra khi nào và có thể gây bất ngờ gì?', 'Bulk update ảnh hưởng entity đang managed ra sao?'],
  tags: ['persistence context', 'dirty checking', 'flush', 'Hibernate']
},
{
  id: 'jpa-023', topic: 'jpa', level: 'senior',
  q: 'Bạn gặp {{LazyInitializationException}} sau khi trả entity từ service. Open Session in View giải quyết triệu chứng thế nào, và vì sao thường nên thay bằng fetch plan rõ ràng?',
  a: `**Tóm tắt:** Lazy association chỉ tải khi truy cập trong lúc persistence context còn mở. Nếu service kết thúc transaction và entity detached trước khi serializer đọc association, Hibernate không thể query thêm và ném {{LazyInitializationException}}. Open Session in View giữ session trong suốt request để truy cập lazy vẫn chạy, nhưng dễ phát sinh SQL ngoài service và N+1 không nhìn thấy.

### Nguyên nhân theo luồng
Repository load entity cùng association lazy chưa khởi tạo. Transaction service commit, persistence context đóng hoặc entity detached. Controller/Jackson serialize quan hệ; proxy cần session để query, nhưng session không còn. Đây không phải lỗi mapping ngẫu nhiên mà là fetch plan không khớp với nơi dữ liệu được tiêu thụ.

### Lựa chọn
- Dùng DTO projection cho response API: chỉ lấy cột cần thiết, tránh để serialization quyết định SQL.
- Dùng fetch join hoặc {{@EntityGraph}} cho use case cụ thể, kiểm tra số query và pagination.
- Khởi tạo association bên trong transaction nếu logic thực sự cần nó.
- Open Session in View có thể hữu ích ở ứng dụng server-rendered đơn giản, nhưng nên hiểu rõ query phát sinh ở view và kiểm soát bằng metric/log.

### Pitfall production
Bật OSIV không đảm bảo transaction nghiệp vụ kéo dài; nó chỉ giữ persistence context mở, nên lazy query có thể chạy sau commit với transaction khác/autocommit tùy cấu hình. Serialize danh sách 100 entity rồi đọc mỗi collection có thể tạo 101 query. Trả entity cũng làm lộ cấu trúc nội bộ và nguy cơ recursion trong hai chiều association.

> Senior tip: API service nên trả DTO với fetch plan được review. Bật thống kê SQL hoặc datasource proxy trong test để phát hiện N+1; việc hết exception chưa chứng minh endpoint hiệu quả.`,
  follow: ['OSIV có giữ transaction DB mở suốt HTTP request không?', 'Bạn phát hiện N+1 phát sinh trong quá trình JSON serialization thế nào?'],
  tags: ['LazyInitializationException', 'Open Session in View', 'N+1', 'DTO']
},
{
  id: 'jpa-024', topic: 'jpa', level: 'senior',
  q: 'Hai request cùng sửa một entity có {{@Version}}. Optimistic locking hoạt động ra sao, và retry nên đặt ở đâu để không ghi đè dữ liệu mới?',
  a: `**Tóm tắt:** Hibernate dùng cột version trong câu update: update chỉ thành công nếu version DB vẫn bằng version entity đã đọc. Nếu request khác commit trước, row count bằng 0 và Hibernate báo optimistic lock conflict. Retry phải chạy lại toàn bộ use case trong transaction mới, đọc lại dữ liệu mới và quyết định nghiệp vụ; không chỉ gửi lại câu update cũ.

### Ví dụ cơ chế
Hai transaction cùng đọc số dư version 7. T1 cập nhật với điều kiện {{where id=? and version=7}}, tăng version lên 8 và commit. T2 cũng update version 7; điều kiện không match, Hibernate phát hiện conflict thay vì âm thầm overwrite. Version có thể là số nguyên hoặc timestamp; numeric version thường biểu đạt thứ tự rõ hơn.

### Retry an toàn
- Chỉ retry lỗi transient/conflict có giới hạn lần, backoff có jitter.
- Bắt exception ở ranh giới ngoài transaction để transaction lỗi đã rollback; mỗi lần thử mở transaction mới.
- Đọc lại state và kiểm tra invariant nghiệp vụ trước khi áp dụng lại lệnh.
- Với lệnh không idempotent (trừ tiền, cộng điểm), cần idempotency key hoặc ghi nhận command để retry không nhân đôi tác dụng.

### Pitfall production
Retry bên trong cùng transaction đã marked rollback-only thường không cứu được transaction. Retry mù có thể tạo livelock khi nhiều client tranh cùng hot row; cần giới hạn và phản hồi conflict cho caller khi không thể tự hòa giải. Bulk update/native SQL thường không tự áp dụng version semantics như entity update.

> Senior tip: dùng optimistic lock khi conflict tương đối hiếm; nếu một row nóng bị tranh chấp liên tục, đo tỷ lệ conflict và cân nhắc serialize theo key hoặc atomic update có điều kiện thay vì retry vô hạn.`,
  follow: ['Vì sao retry cần transaction mới?', 'Khi nào pessimistic lock hợp lý hơn optimistic locking?'],
  tags: ['@Version', 'optimistic locking', 'retry', 'concurrency']
},
{
  id: 'jpa-025', topic: 'jpa', level: 'senior',
  q: 'Bulk insert bằng Hibernate không đạt throughput mong muốn. Bạn cấu hình batching thế nào, và vì sao generation strategy {{IDENTITY}} thường phá JDBC insert batching?',
  a: `**Tóm tắt:** Hibernate JDBC batching gom nhiều prepared statement cùng dạng để gửi theo batch; cấu hình {{hibernate.jdbc.batch_size}} và flush/clear theo chunk giúp giảm round trip và memory. Với {{IDENTITY}}, DB phải tạo row để trả generated key cho từng insert, khiến Hibernate thường phải insert ngay để lấy ID, nên batching insert bị hạn chế hoặc vô hiệu.

### Cấu hình và ghi dữ liệu
Đặt batch size phù hợp (thường bắt đầu khoảng vài chục, sau đó đo), đảm bảo driver hỗ trợ batch rewrite nếu có, và tránh SQL statement shape thay đổi liên tục. Persistence context vẫn giữ entity nên xử lý theo chunk: persist N entity, flush, clear rồi tiếp tục. Hibernate có thể sắp xếp insert/update theo entity để tăng batch tương thích; kiểm tra config và SQL log trên DB/driver thật.

### ID generation
Sequence cho phép lấy ID trước insert, nên Hibernate có thể gom insert; sequence allocation/block size cần cân đối round trip và khoảng trống ID. {{IDENTITY}} cần giá trị do DB sinh sau từng row insert để gán vào entity, vì thế thường buộc insert sớm. Không đổi strategy chỉ vì batch: cân nhắc portability, schema và semantics ID.

### Pitfall production
Batching giảm network round trip nhưng không giảm số index update, WAL hay constraint check. Batch quá lớn tăng transaction duration, lock và khả năng rollback tốn kém. Mixed inserts cho nhiều entity type có thể chia nhỏ batch. Batching không hoạt động như mong đợi nếu code gọi query giữa chừng gây flush hoặc cấu hình driver không hỗ trợ.

> Senior tip: đo batch execution count, heap, transaction time và DB write latency; so với insert thường ở cùng dữ liệu. Luôn thử trên đúng JDBC driver/version và xác nhận generated IDs đúng, vì benchmark H2 không đại diện production database.`,
  follow: ['Tại sao phải clear persistence context khi import hàng triệu dòng?', 'Sequence allocation ảnh hưởng round trip và khoảng trống ID ra sao?'],
  tags: ['hibernate.jdbc.batch_size', 'JDBC batching', 'IDENTITY', 'sequence']
},
{
  id: 'jpa-026', topic: 'jpa', level: 'senior',
  q: 'Một màn hình cần danh sách entity có quan hệ lazy và phân trang. Bạn chọn {{@EntityGraph}} hay JOIN FETCH thế nào, và xử lý cảnh báo HHH000104 ra sao?',
  a: `**Tóm tắt:** {{@EntityGraph}} khai báo fetch plan theo use case, còn JOIN FETCH viết trực tiếp join trong JPQL; cả hai có thể giảm N+1 nhưng collection fetch join kết hợp pagination làm row SQL nhân bản. Hibernate có thể lấy toàn bộ result rồi phân trang trong memory, phát cảnh báo HHH000104, gây tải lớn thay vì giới hạn ở DB.

### Cách chọn
EntityGraph phù hợp khi muốn giữ query repository dễ đọc và chọn association cần fetch ở runtime; kiểm tra graph là fetch hay load semantics theo mapping. JOIN FETCH hữu ích khi query cần điều kiện/sắp xếp gắn với association, nhưng không thể fetch nhiều bag collection một cách tùy ý do duplicate/cartesian explosion.

### Pagination an toàn
1. Page ID của root entity bằng query có giới hạn và thứ tự ổn định.
2. Query thứ hai fetch các association cần thiết cho tập ID đó, dùng IN.
3. Khôi phục thứ tự trang nếu query thứ hai không giữ thứ tự, và cân nhắc count query riêng.

Có thể cấu hình Hibernate fail khi pagination collection fetch thay vì âm thầm paginate memory. Với to-many, batch fetching hoặc DTO projection cũng là lựa chọn tùy shape response.

### Pitfall production
Một trang 20 root có thể thành hàng nghìn SQL rows nếu mỗi root có nhiều child; phân trang trên rows không đồng nghĩa phân trang root. Cảnh báo bị bỏ qua trong môi trường dữ liệu nhỏ nhưng production heap/latency tăng đột biến. Sorting theo cột child cũng cần định nghĩa rõ một root có nhiều giá trị thì thứ tự tính thế nào.

> Senior tip: test với volume và fan-out gần production, assert query count lẫn SQL có LIMIT/OFFSET ở DB. Khi thấy HHH000104, xử lý fetch plan trước khi tăng heap hoặc tắt cảnh báo.`,
  follow: ['Vì sao fetch join một collection vẫn có thể làm page sai?', 'Bạn thiết kế count query cho trang dữ liệu có quan hệ to-many thế nào?'],
  tags: ['@EntityGraph', 'JOIN FETCH', 'pagination', 'HHH000104']
},
{
  id: 'jpa-027', topic: 'jpa', level: 'lead',
  q: 'Second-level cache Hibernate có thể giảm tải database, nhưng khi nào bạn quyết định không bật hoặc chỉ cache một số entity?',
  a: `**Tóm tắt:** Second-level cache sống ngoài persistence context, chia sẻ cache entity/collection giữa các Session. Nó phù hợp với dữ liệu đọc nhiều, ít thay đổi và có chiến lược invalidation nhất quán; không nên bật rộng cho dữ liệu mutable/hot hoặc yêu cầu consistency nghiêm ngặt nếu chi phí đồng bộ và stale read lớn hơn lợi ích.

### Phân biệt cache
First-level cache là persistence context của một Session và luôn gắn với identity map. Second-level cache thuộc SessionFactory và có provider/configuration riêng. Query cache lưu kết quả truy vấn (thường tham chiếu ID), không thay thế entity cache và phải invalidate khi dữ liệu liên quan thay đổi. Cache hit vẫn cần kiểm tra mapping, version và provider semantics.

### Khi nên cân nhắc
- Danh mục tham chiếu nhỏ, được đọc thường xuyên và cập nhật ít.
- Có thể chấp nhận freshness theo chính sách rõ ràng, hoặc provider hỗ trợ coherence phù hợp topology.
- Đo được cache hit ratio, eviction, heap/network cost và DB load giảm.

Tránh hoặc rất thận trọng với số dư, trạng thái đơn hàng thay đổi liên tục, dữ liệu tenant nhạy cảm, entity có payload lớn, hoặc nhiều node không có invalidation đáng tin. Cache vùng phân tán thêm network hop và vận hành; cache local từng node có thể trả dữ liệu khác nhau.

### Pitfall production
Bulk SQL hoặc cập nhật từ ứng dụng khác có thể làm cache stale nếu Hibernate không biết invalidation. Cache stampede khi key hết hạn đồng loạt tạo tải DB đột biến. Entity cache không tự làm query nhanh nếu query vẫn quét DB để tìm ID. Không cache để che một query thiếu index hoặc N+1 chưa được sửa.

> Senior tip: bắt đầu bằng một entity danh mục có SLA freshness cụ thể, bật statistics và thử invalidate khi ghi từ mọi đường đi. Nếu không thể mô tả ai invalidate, khi nào stale được chấp nhận và cách đo hit ratio, chưa nên bật cache đó.`,
  follow: ['Bulk update/native SQL ảnh hưởng second-level cache thế nào?', 'Local cache và distributed cache khác nhau ra sao khi chạy nhiều node?'],
  tags: ['second-level cache', 'Hibernate', 'cache invalidation', 'consistency']
},

{
  id: 'jpa-028', topic: 'jpa', level: 'mid',
  q: 'Bạn thêm file data.sql để seed dữ liệu nhưng app không nạp; một lần khác script chạy trước Flyway nên lỗi bảng chưa tồn tại. Script SQL init của Boot (schema.sql/data.sql, {{spring.sql.init.mode}}) chạy khi nào, {{spring.jpa.defer-datasource-initialization}} giải quyết gì, và vì sao với hệ thật nên chọn một đường duy nhất cho schema?',
  a: `**Tóm tắt:** Boot có ba cơ chế dựng schema/seed chồng nhau: Hibernate {{ddl-auto}}, script init ({{schema.sql}}/{{data.sql}}) và công cụ migration (Flyway). Trộn cả ba là nguồn lỗi thứ tự kinh điển. Hai điểm mấu chốt: {{spring.sql.init.mode}} mặc định embedded nên trên DB thật data.sql không chạy cho tới khi bật {{always}}; còn {{spring.jpa.defer-datasource-initialization}} dời script chạy sau schema của Hibernate. Khi có Flyway, schema và seed cần nhất quán thuộc về migration.

### Mỗi cơ chế chạy lúc nào
- {{spring.sql.init.mode}} mặc định **embedded**: script chỉ tự chạy trên DB nhúng (H2/HSQL). Trên PostgreSQL thật, không set {{always}} thì data.sql bị bỏ qua hoàn toàn - nguyên nhân "thêm seed mà không thấy gì" phổ biến nhất, và nó bỏ qua một cách im lặng chứ không báo lỗi.
- {{spring.jpa.defer-datasource-initialization=true}}: dời script init chạy **sau** khi Hibernate tạo schema ({{ddl-auto}}) thay vì trước; hợp với luồng Hibernate dựng schema rồi seed bằng SQL thô. Nhưng khi Flyway có mặt, Hibernate không nên đóng vai tạo schema ({{ddl-auto}} để none/validate), nên defer dần trở nên dư thừa trừ khi cố ý trộn.
- Thứ tự tương đối giữa script init và Flyway/Liquibase đã thay đổi giữa các phiên bản Boot; nếu buộc hai cơ chế cùng sống, kiểm chứng bằng integration test trên đúng phiên bản Boot đang chạy.

### Chọn một đường
| Đường | Ưu | Nhược |
|---|---|---|
| Flyway duy nhất (schema + seed là migration) | mọi env giống nhau, có checksum và audit | seed lớn phải viết migration |
| {{ddl-auto}} + data.sql | demo/test nhanh | prod không kiểm soát, schema drift |
| Thêm script.sql cạnh Flyway | tiện nạp nhanh khi cần | thêm một nguồn thứ tự phải maintain |

### Pitfall production
- Script chạy trước migration → INSERT vào bảng chưa tạo, boot nổ; hoặc ngược lại lặng lẽ bị bỏ qua ở prod (mode embedded) trong khi test H2 vẫn chạy: dữ liệu "sống" ở dev, "chết" ở prod mà không exception nào.
- Để {{ddl-auto=update}} trên prod vì schema lệch migration: Hibernate tự thêm cột làm schema trôi khỏi Flyway, và validate chỉ soi các file migration - drift kiểu này nằm ngoài radar.
- Seed dữ liệu tham chiếu (danh mục, vai trò, cấu hình) qua data.sql: prod cần cùng bản định danh nhưng script không được bảo đảm chạy; id lệch giữa env làm quan hệ FK gãy. Đặt seed vào migration - versioned cho một lần, repeatable cho nội dung idempotent.

> Senior tip: chính sách ba dòng phải thuộc: schema chỉ đến từ migration, script init gắn profile dev/test qua {{spring.sql.init.mode}}, mọi seed xuyên môi trường nằm trong Flyway; và integration test chạy PostgreSQL thật (testcontainers) thay vì để H2 che thứ tự thực tế.`,
  follow: ['Vì sao {{spring.sql.init.mode}} mặc định embedded trên DB thật?', 'Vì sao seed dữ liệu tham chiếu nên qua migration thay vì script init?'],
  tags: ['data.sql', 'schema.sql', 'spring.sql.init', 'defer-datasource-initialization', 'Flyway']
},
{
  id: 'jpa-029', topic: 'jpa', level: 'senior',
  q: 'Bảng có cột JSONB lưu thuộc tính linh hoạt của sản phẩm. Bạn map cột JSON với Hibernate 6 bằng {{@JdbcTypeCode(SqlTypes.JSON)}} thế nào, so với con đường AttributeConverter cũ, và những bẫy snapshot cùng query vào JSON là gì?',
  a: `**Tóm tắt:** Hibernate 6 map cột JSON vào kiểu Java (record/POJO hoặc Map) nhờ {{@JdbcTypeCode(SqlTypes.JSON)}}, thường kèm {{@Column(columnDefinition = "jsonb")}} trên PostgreSQL; serialize/deserialize dựa vào JSON mapper trên classpath (mặc định Jackson). Con đường cũ dùng {{AttributeConverter}} chuyển String: phải cast thủ công khi query với jsonb, và snapshot so sánh theo chuỗi. Bẫy đáng nhớ: chi phí snapshot/so sánh tăng theo kích thước payload, còn query theo key JSON phải qua native query với toán tử jsonb.

### Mapping trong Hibernate 6
~~~java
@Entity
public class Product {
    @Id Long id;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private ProductAttributes attributes;   // record/POJO; hoặc Map<String,Object>
}
~~~
- Hibernate chọn JSON mapper từ classpath; thiếu dependency thì lỗi lộ ở runtime khi bind.
- {{columnDefinition}} phát tác dụng trên đường DDL của Hibernate; với Flyway, cột jsonb được khai trong migration và khai báo trên entity phải khớp kiểu.
- Chọn {{jsonb}} thay vì {{json}} của PostgreSQL: jsonb phân tích cấu trúc và hỗ trợ toán tử/index, json chỉ lưu nguyên văn.

### Snapshot và chi phí
Hibernate coi thuộc tính JSON là mutable: nó chép giá trị khi entity load và so khi flush, nên chỉnh sâu bên trong ({{attributes.tags.add(...)}}) vẫn được nhận ra và phát UPDATE đúng lúc. Giá phải trả: mỗi flush phải serialize/so sánh toàn bộ document - object vài trăm KB trên hàng nghìn row nóng làm flush chậm thấy rõ. Giữ payload nhỏ; phần nội dung nặng để nơi khác.

Giữ kiểu immutable (record + copy-on-write) không bắt buộc nhưng giúp mọi chỗ ghi chỉ qua method có chủ đích, dễ test hơn mutate âm thầm.

### Query theo key JSON
JPQL không hiểu cấu trúc JSON; khi cần điều kiện theo key, dùng native query với toán tử jsonb:
~~~java
@Query(value = "select p.* from product p where p.attributes ->> 'brand' = :brand", nativeQuery = true)
List<Product> findByBrand(@Param("brand") String brand);
~~~
Index GIN tạo trong migration cho những mẫu query thật sự cần; mỗi GIN khiến mọi INSERT/UPDATE nặng thêm, nên chỉ tạo theo tần suất query đã đo, không tạo "phòng hờ".

### Trade-off
| Tiêu chí | Cột JSONB | Bảng con quan hệ |
|---|---|---|
| Tính linh hoạt schema | cao, thêm thuộc tính không đổi DDL | mỗi loại mới cần migration |
| Query theo điều kiện | cần toán tử jsonb + GIN | index b-tree tự nhiên |
| Ràng buộc dữ liệu | yếu, tự validate ở app | FK/CHECK có sẵn |
| Nên khi nào | thuộc tính tuỳ biến theo loại hàng | dữ liệu lõi query thường xuyên |

### Pitfall production
- Không có ràng buộc bên trong jsonb: thêm field "required" rồi im lặng để bản ghi cũ thiếu; validate shape khi decode hoặc backfill bằng migration.
- UPDATE cột jsonb phát lại toàn bộ giá trị (MVCC ghi row mới): payload lớn trên row nóng gây bloat, thêm việc cho vacuum.
- GIN index bừa cho "phòng khi": đo {{pg_stat_user_indexes}}; index không ai dùng chỉ tốn write và storage.

> Senior tip: jsonb là chỗ cho dữ liệu "hình dạng thay đổi"; khi một key bắt đầu được query nóng hoặc ràng buộc nghiệp vụ chặt dần, hãy tách nó thành cột thật (hoặc generated column) và giữ jsonb cho phần mở thực sự.`,
  follow: ['Chi phí snapshot của cột JSON tăng ra sao theo payload?', 'Khi nào nên tách key JSON thành cột thật hoặc bảng con?'],
  tags: ['@JdbcTypeCode', 'JSONB', 'Hibernate 6', 'AttributeConverter'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide', url: 'https://docs.jboss.org/hibernate/orm/6.6/userguide/html_single/Hibernate_User_Guide.html' }
  ]
},
{
  id: 'db-031', topic: 'db', level: 'senior',
  q: 'Một job chạy mỗi 5 phút trên 3 pod phải chạy đúng một instance. Team định dùng file lock trên volume chung; bạn đề xuất Postgres advisory lock: {{pg_try_advisory_lock}} khác {{pg_advisory_xact_lock}} thế nào, rủi ro gì với connection pool, và so với SKIP LOCKED queue hay ShedLock thì chọn khi nào?',
  a: `**Tóm tắt:** Advisory lock là khoá không gắn vào bảng nào, Postgres cấp theo key số 64-bit bạn tự chọn (ví dụ hash tên job). Session-level ({{pg_advisory_lock}}/{{pg_try_advisory_lock}}) giữ đến khi unlock hoặc connection đóng; transaction-level ({{pg_advisory_xact_lock}}) tự nhả khi COMMIT/ROLLBACK. Với connection pool, rủi ro lớn nhất là lấy và nhả khoá trên hai connection khác nhau - gói phần công việc trong một transaction là cách né cả hai. File lock trên volume chung không đáng tin cho môi trường nhiều pod.

### Các loại advisory lock
| API | Phạm vi | Tự nhả khi |
|---|---|---|
| {{pg_try_advisory_lock(key)}} | session | unlock hoặc connection đóng |
| {{pg_advisory_lock(key)}} | session, chờ đến khi lấy được | unlock hoặc connection đóng |
| {{pg_advisory_xact_lock(key)}} | transaction | COMMIT/ROLLBACK |

### Vì sao xact-level khớp Spring
~~~java
@Transactional
public void runSolo() {
    Boolean got = jdbc.queryForObject(
        "select pg_try_advisory_xact_lock(71801)", Boolean.class);
    if (!got) throw new SkipRunException();   // pod khác đang chạy - bỏ qua vòng này
    // toàn bộ công việc nằm trong cùng transaction:
    // - Spring giữ đúng một connection cho mọi statement
    // - COMMIT/ROLLBACK tự nhả advisory lock, không cần unlock thủ công
    jdbc.update("update run_state set last_run_at = now() where job = 'daily_report'");
}
~~~
Bẫy của session-level trong Spring: mỗi statement của JdbcTemplate là một lần mượn connection; statement unlock có thể rơi vào connection khác connection đã lock, unlock khi đó vô hiệu và khoá "treo" đến khi connection đóng thật. Bọc trong một Spring transaction ép cùng connection; đổi lại transaction phải đủ ngắn vì connection và khoá được giữ cả lúc chạy.

Với {{pg_advisory_lock}} dạng blocking, caller chưa lấy được khoá sẽ chờ vô hạn - hiện tượng dễ nhầm thành "service treo". Cho quy tắc "chạy đúng một", dùng pg_try và bỏ qua vòng là đủ.

### Vì sao file lock kém
- Volume chung giữa các pod đi qua NFS/network volume: ngữ nghĩa khoá file (flock/fcntl) không được bảo đảm nhất quán trên mọi filesystem như vậy; file khoá "chết" sau crash còn phải dọn tay.
- Postgres tự dọn: process chết, connection đóng, backend nhả mọi khoá session-level - không còn "khoá ma".

### So với các pattern khác
| Cách | Khi hợp |
|---|---|
| Advisory lock | chỉ cần "một runner" cho từng job, đã có PostgreSQL |
| ShedLock (bảng lock, TTL) | cần TTL, audit, nhiều scheduler |
| SKIP LOCKED queue | phân phối việc cho N worker, không phải single-run |
| Redis lock (SETNX + TTL) | hạ tầng Redis có sẵn, chấp nhận thêm thành phần phụ |

Advisory lock không có TTL: job treo bên trong (connection còn sống) giữ khoá cho tới khi xong; idempotency và watchdog nội bộ vẫn cần.

### Pitfall production
- Key trùng giữa hai job khác nhau vì đặt số tay: dẫn xuất key từ tên job (hash 63-bit) và ghi mapping trên file/code.
- Dùng phiên bản blocking mà tưởng là try: pod xếp hàng chờ "vô hạn" nhìn như treo; dùng pg_try, hoặc đặt statement_timeout để tự thoát.
- Unlock chạy ngoài transaction chứa lock: hai connection khác nhau, khoá treo đến khi pool thu hồi connection - lỗi rất khó tái hiện vì phụ thuộc thời điểm borrow.

> Senior tip: giám sát {{pg_locks}} với locktype = advisory theo key để biết instance nào đang giữ; một advisory lock "sống sót" sau deploy là dấu hiệu job cũ chưa nhả - cảnh báo trước khi vòng chạy kế tiếp lặng lẽ skip.`,
  follow: ['{{pg_advisory_lock}} dạng blocking có thể khiến pod xếp hàng thế nào?', 'Advisory lock không có TTL - bạn xử lý job treo ra sao?'],
  tags: ['advisory lock', 'PostgreSQL', 'scheduling', 'ShedLock', 'SKIP LOCKED'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Advisory Locks', url: 'https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS' },
    { type: 'doc', title: 'ShedLock on GitHub', url: 'https://github.com/lukas-krecan/ShedLock' }
  ]
},
);
