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
- **Thread pinning**: {{synchronized}}, {{Object.wait/notify}} và một số lời gọi native có thể giữ chặn carrier thread của virtual thread (Java 21). Nên dùng {{ReentrantLock}} thay {{synchronized}} trong code I/O-bound. (JEP 491 ở Java 24 đã sửa phần lớn trường hợp này.)
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

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleInvalid(MethodArgumentNotValidException ex) {
        ProblemDetail pd = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        pd.setProperty("errors", ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + " " + e.getDefaultMessage())
                .toList());
        return pd;
    }
}
~~~

### Vì sao nên kế thừa ResponseEntityExceptionHandler
Lớp này đã xử lý sẵn các lỗi do Spring MVC sinh ra (400 do body sai, 404, 405, 415…) và trả về đúng format. Kế thừa để bạn chỉ cần chuẩn hoá lỗi nghiệp vụ, tránh mỗi endpoint tự bắt lỗi.

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
  tags: ['ControllerAdvice', 'ProblemDetail', 'RFC 7807', 'exception handling']
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
);
