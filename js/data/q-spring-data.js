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

### Bên trong: container dựng bean theo thứ tự nào
Lúc khởi động, Spring (1) quét và đọc cấu hình thành các **BeanDefinition** (công thức tạo bean, chưa có object), (2) chạy {{BeanFactoryPostProcessor}} (ví dụ thay các placeholder cấu hình bằng giá trị thật), (3) với mỗi singleton: chọn constructor → **resolve dependency theo kiểu** (cùng kiểu có nhiều bean thì xét {{@Primary}}, {{@Qualifier}}, tên tham số) → tạo object → tiêm field/setter → gọi callback khởi tạo → cho {{BeanPostProcessor}} bọc proxy (AOP, transaction). Với constructor injection, dependency phải có **trước** khi object tồn tại, nên vòng phụ thuộc lộ ra ngay lúc khởi động; với field injection, object được tạo rỗng rồi mới gán field qua reflection — đó là lý do field injection "che" được vòng phụ thuộc và làm object có thể tồn tại ở trạng thái thiếu dependency.

### Ví dụ đời thực
Một service có class {{OrderService}} với 14 field {{@Autowired}}. Unit test phải dựng cả Spring context (40 giây) vì không có cách nào truyền mock ngoài reflection; một test quên mock một field → NPE trong test khác. Chuyển sang constructor injection (Lombok {{@RequiredArgsConstructor}} với field final): constructor 14 tham số **lộ ra** rằng class làm quá nhiều việc, team tách thành 3 service; unit test chạy không cần Spring (từ 40 giây xuống dưới 1 giây cho cả lớp test). Cùng đợt, một vòng phụ thuộc {{OrderService ↔ PaymentService}} bị lộ ngay lúc khởi động — trước đó field injection che nó.

### Trả lời mẫu khi phỏng vấn
"IoC nghĩa là tôi không tự tạo dependency mà để container tạo và tiêm vào. Spring đọc cấu hình thành BeanDefinition, rồi với mỗi bean chọn constructor, tìm dependency theo kiểu, xét Primary hay Qualifier khi có nhiều ứng viên, tạo object, tiêm, chạy các callback khởi tạo, và cho BeanPostProcessor bọc proxy như transaction. Tôi dùng constructor injection làm mặc định: field có thể final, object không bao giờ ở trạng thái thiếu dependency, unit test chỉ cần new với mock mà không cần Spring, và vòng phụ thuộc lộ ra ngay lúc khởi động. Constructor quá nhiều tham số còn là tín hiệu class làm quá nhiều việc. Field injection chỉ còn chấp nhận được trong code test; setter injection cho dependency thật sự tuỳ chọn."

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

### Ví dụ đời thực
Một hệ thống giao dịch cần warm-up cache Redis khi khởi động: team viết {{@PostConstruct}} trong {{CacheService}} để load toàn bộ danh sách cấu hình từ DB vào Redis. App chạy tốt trong dev (1 instance), nhưng khi deploy lên staging với 2 instance cùng chạy, cả hai instance đồng thời ghi vào cùng key cache → Redis báo lỗi hoặc ghi chồng dữ liệu; mỗi lần deploy lại là một lần cache bị lỗi. Điều tra: log Spring cho thấy {{@PostConstruct}} chạy trong lúc context đang khởi tạo, transaction chưa được mở (vì {{CacheService}} không có {{@Transactional}}) → truy vấn DB ngoài transaction vẫn chạy nhưng không có rollback khi lỗi; và hai instance cùng warm-up không có cơ chế lock. Nguyên nhân gốc: warm-up là công việc **một lần** sau khi app sẵn sàng, không phải việc cần làm trong {{@PostConstruct}}. Sửa: chuyển sang {{ApplicationRunner}}/{{CommandLineRunner}} (vẫn chạy early nhưng sau khi context hoàn tất) hoặc dùng {{@ApplicationEventListener(ApplicationReadyEvent.class)}}; thêm distributed lock (Redisson) nếu nhiều instance cùng warm-up. Kết quả: deploy staging không còn lỗi cache, và thời gian warm-up giảm 30% vì không còn chạy song song.

### Trả lời mẫu khi phỏng vấn
"Vòng đời bean trong Spring đi qua nhiều giai đoạn: container đọc BeanDefinition, tạo instance, inject dependency, rồi qua các hook theo thứ tự BeanPostProcessor.postProcessBeforeInitialization → @PostConstruct → InitializingBean.afterPropertiesSet → init-method → BeanPostProcessor.postProcessAfterInitialization – đây là nơi Spring bọc proxy AOP – và cuối cùng bean sẵn sàng. SmartLifecycle.start chạy sau khi context refresh để bean có thể bắt đầu phục vụ, và khi shutdown, SmartLifecycle.stop chạy trước (theo phase) để dọn dẹp trước khi destroy bean: @PreDestroy → DisposableBean → destroy-method. Trong thực tế, điều tôi quan tâm nhất là không ghi công việc nặng vào @PostConstruct vì nó chạy trong lúc context đang khởi tạo, chưa có transaction, và làm chậm app start; thay vào đó tôi dùng ApplicationReadyEvent hoặc CommandLineRunner. Ngoài ra, @Bean trả về BeanPostProcessor phải static, và mọi code trong @PostConstruct nên idempotent vì devtools reload có thể gọi lại nó."

### Cơ chế từng bước: thứ tự các hook chi tiết
Khi Spring container khởi tạo một bean singleton, thứ tự các hook chạy như sau:

1. **BeanFactoryPostProcessor**: Spring đọc file cấu hình (XML, component scan, imports) và biến đổi **BeanDefinition** trước khi tạo bean. Ví dụ: {{PropertySourcesPlaceholderProcessor}} thay \${...} bằng giá trị thật từ file config. Bước này chạy **chưa có bean nào**.

2. **BeanDefinitionRegistryPostProcessor**: biến thể của BeanFactoryPostProcessor, thêm/xóa BeanDefinition động (ví dụ {{ConfigurationClassPostProcessor}} – Spring tự dùng để quét các class {{@Configuration}} và {{@ComponentScan}}; hoặc {{@MapperScan}} của MyBatis thêm bean mapper vào registry).

3. **BeanPostProcessor.postProcessBeforeInitialization**: chạy ngay sau khi bean được tạo và inject dependency xong, trước khi gọi init. Dùng để biến đổi bean (ví dụ {{@RequiredAnnotationPostProcessor}} xử lý {{@Required}}, hoặc InjectAnnotationBeanPostProcessor cho {{@Autowired}}).

4. **@PostConstruct**: annotation standard (JSR-250), chạy sau khi inject xong, chỉ một lần. Đây là nơi **an toàn** nhất để ghi log, validate config, nhưng **không** nên làm việc nặng.

5. **InitializingBean.afterPropertiesSet**: interface của Spring, chạy ngay sau {{@PostConstruct}}. Tương đương với attribute {{init-method}} trong XML.

6. **init-method**: phương thức được khai báo explicit ({{@Bean(initMethod = "init")}} hoặc XML {{init-method}}), chạy sau {{afterPropertiesSet}}.

7. **BeanPostProcessor.postProcessAfterInitialization**: bước **quan trọng nhất** – đây là nơi {{AbstractAutoProxyCreator}} tạo proxy AOP (cho {{@Transactional}}, {{@Async}}, {{@Cacheable}}), và {{ApplicationListenerDetector}} thêm bean vào danh sách listeners. Sau bước này bean đã "hoàn chỉnh" và sẵn sàng.

8. **SmartLifecycle.start()**: chỉ chạy khi {{ApplicationContext}} refresh xong (tất cả bean đã tạo). Dùng để bắt đầu các dịch vụ nền (kết nối message broker, chạy scheduler, warm-up cache).

Khi shutdown:
- {{SmartLifecycle.stop()}} chạy trước (theo phase, phase thấp hơn chạy sau), cho phép dọn dẹp theo thứ tự đúng.
- {{@PreDestroy}} → {{DisposableBean.destroy()}} → destroy-method.
- Bean prototype không được quản lý vòng đời này – Spring không tự gọi destroy callback cho chúng.

**Lưu ý quan trọng về thứ tự**: {{@PostConstruct}} và {{InitializingBean}} chỉ khác nhau về nguồn gốc (JSR-250 vs Spring interface), nhưng thứ tự chạy là PostConstruct trước, sau đó là afterPropertiesSet. Nếu một bean implement cả hai, PostConstruct luôn chạy trước. Không nên implement cả hai trong cùng một bean – chỉ chọn một.

**Tại sao proxy AOP phải nằm ở postProcessAfterInitialization**: Spring cần tạo proxy **sau** khi bean đã được inject đầy đủ dependency, vì proxy phải bọc object đã hoàn chỉnh. Nếu proxy tạo sớm hơn (trước khi inject xong), proxy sẽ bóc một bean thiếu dependency → method call trên proxy sẽ đi đến target không đủ dữ liệu.

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

### Bên trong: scoped proxy hoạt động thế nào
Khi khai báo {{@Scope(value = "request", proxyMode = ScopedProxyMode.TARGET_CLASS)}} (hoặc dùng {{@RequestScope}}), Spring tiêm vào singleton **một proxy** (lớp con CGLIB) thay vì object thật. Mỗi lần gọi method trên proxy, nó hỏi scope hiện tại ("request đang xử lý là request nào?") để lấy **đúng instance** của request đó rồi chuyển lời gọi sang. Với {{prototype}}, không có "scope hiện tại" nên proxy tạo instance mới **mỗi lần gọi method** — thường không phải điều bạn muốn; dùng {{ObjectProvider<T>.getObject()}} để chủ động lấy instance mới đúng lúc cần.

### Ví dụ đời thực
Một bean {{PriceCalculator}} giữ trạng thái tạm (danh sách khuyến mãi đã áp dụng) được khai báo {{prototype}} để "mỗi lần một bản mới", nhưng lại được inject vào {{CheckoutService}} singleton → thực tế chỉ có **một** instance dùng chung cho mọi request. Dưới tải, khuyến mãi của khách này lẫn sang hoá đơn khách khác (khoảng 0,2% đơn giờ cao điểm). Sửa: bỏ trạng thái khỏi bean (truyền context qua tham số), các chỗ còn cần object có trạng thái thì tạo bằng {{ObjectProvider}} trong method. Thêm test gọi đồng thời 50 request với dữ liệu khác nhau và kiểm tra không lẫn.

### Trả lời mẫu khi phỏng vấn
"Singleton là một instance cho cả container và là mặc định; prototype tạo instance mới mỗi lần container được yêu cầu; request và session gắn với vòng đời HTTP. Vấn đề khi tiêm prototype vào singleton là việc tiêm chỉ xảy ra một lần lúc tạo singleton, nên singleton giữ mãi một instance prototype duy nhất, và nếu nó có trạng thái thì trạng thái bị chia sẻ giữa mọi request. Cách khắc phục là lấy instance khi cần bằng ObjectProvider hoặc @Lookup, hoặc với request scope thì dùng scoped proxy, là một proxy tra đúng instance của request hiện tại mỗi lần gọi. Nhưng cách tốt nhất thường là thiết kế bean singleton không có trạng thái, truyền dữ liệu theo request qua tham số."

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

### Ví dụ đời thực
Service đặt vé có method {{public void bookAll(List<Seat> seats)}} lặp và gọi {{this.bookOne(seat)}} — {{bookOne}} có {{@Transactional(propagation = REQUIRES_NEW)}} để "mỗi ghế một transaction, ghế lỗi không ảnh hưởng ghế khác". Thực tế gọi qua {{this}} bỏ qua proxy: không có transaction riêng nào, mọi ghế chạy trong transaction của {{bookAll}} (hoặc không có transaction nếu bookAll không có annotation) → một ghế lỗi làm rollback cả đơn, hoặc ngược lại ghế đã ghi không được rollback. Một bug khác cùng service: {{SeatTakenException extends Exception}} (checked) ném ra nhưng transaction vẫn **commit** vì Spring mặc định chỉ rollback với unchecked. Sửa: tách {{bookOne}} sang bean riêng {{SeatBookingService}}, đổi exception thành unchecked (hoặc {{rollbackFor = SeatTakenException.class}}), thêm test tích hợp kiểm tra dữ liệu sau khi lỗi.

### Trả lời mẫu khi phỏng vấn
"@Transactional hoạt động nhờ proxy: Spring tạo một proxy bọc bean, và lời gọi đi qua proxy thì proxy mở transaction, gọi method thật, rồi commit hoặc rollback. Khi một method trong cùng class gọi method khác qua this, lời gọi không đi qua proxy nên annotation trên method được gọi bị bỏ qua hoàn toàn, kể cả propagation hay readOnly. Cách sửa là tách method sang một bean khác, hoặc tự inject chính bean qua proxy, hoặc dùng TransactionTemplate cho phần cần transaction riêng. Method private hay final cũng không được proxy. Về rollback, mặc định Spring chỉ rollback với RuntimeException và Error; checked exception thì vẫn commit, trừ khi khai báo rollbackFor. Vì vậy tôi dùng exception nghiệp vụ unchecked, và luôn có test tích hợp kiểm tra dữ liệu sau khi lỗi."

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

### Ví dụ đời thực
Service thanh toán ghi audit log bằng {{REQUIRES_NEW}} để audit vẫn còn dù thanh toán rollback — đúng mục đích. Nhưng audit được gọi **trong vòng lặp** xử lý 200 giao dịch của một lô, mỗi lần REQUIRES_NEW **tạm treo** transaction ngoài (vẫn giữ connection của nó) và **lấy thêm connection thứ hai**. Với 20 thread xử lý lô song song và pool 20 connection, mỗi thread giữ 1 connection rồi chờ connection thứ hai → toàn bộ treo (pool deadlock), log Hikari báo "Connection is not available". Sửa: audit gom lại, ghi một lần sau khi transaction chính kết thúc ({{@TransactionalEventListener(phase = AFTER_COMPLETION)}} hoặc bảng outbox), pool đặt tối thiểu bằng số thread × số connection mỗi luồng cần cộng dự phòng. Không còn treo.

### Trả lời mẫu khi phỏng vấn
"REQUIRED là mặc định: có transaction thì tham gia, không có thì tạo mới; nếu method bên trong ném lỗi thì cả transaction bị đánh dấu rollback-only. REQUIRES_NEW tạm treo transaction ngoài và mở một transaction độc lập với connection riêng, commit hay rollback riêng, hợp cho audit log hoặc ghi nhận lỗi phải giữ lại dù nghiệp vụ chính rollback; cái giá là cần hai connection cùng lúc, dễ cạn pool nếu dùng trong vòng lặp hay khi nhiều thread. NESTED dùng savepoint trong cùng transaction và connection, cho phép rollback một phần, cần driver và transaction manager hỗ trợ như JDBC, không hỗ trợ với JPA thông thường. SUPPORTS, NOT_SUPPORTED, MANDATORY, NEVER ít dùng hơn. Tôi dùng REQUIRED cho hầu hết, REQUIRES_NEW thật tiết kiệm, và thường thay bằng sự kiện sau commit."

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

### Bên trong: hai loại proxy được tạo thế nào
- **JDK dynamic proxy**: tạo lúc chạy một lớp mới **implements các interface** của bean, mọi lời gọi đi vào {{InvocationHandler}}. Chỉ proxy được method có trong interface; inject theo **lớp cụ thể** sẽ lỗi vì proxy không phải lớp đó.
- **CGLIB**: tạo **lớp con** của bean (sinh bytecode), override các method để chèn advice. Không override được method {{final}}, {{private}}, {{static}}; class {{final}} không proxy được. Spring Boot mặc định dùng CGLIB ({{spring.aop.proxy-target-class=true}}) để tránh lỗi inject theo lớp cụ thể.
Advice chỉ chạy khi lời gọi **đi qua proxy** — gọi nội bộ qua {{this}} thì không.

### Ví dụ đời thực
Team viết aspect {{@Timed}} tự chế để đo thời gian các method repository custom. Dashboard cho thấy một nửa method "không bao giờ được gọi". Nguyên nhân: các method đó là {{final}} (do một quy ước code cũ "method không override thì để final") và một số được gọi nội bộ trong cùng class — CGLIB không chặn được. Ngoài ra một aspect logging dùng pointcut {{execution(* com.shop..*(..))}} quá rộng, bọc cả các bean nhỏ gọi hàng triệu lần mỗi phút → CPU tăng 9%. Sửa: dùng Micrometer {{@Observed}}/{{@Timed}} có sẵn, bỏ final ở method cần đo, thu hẹp pointcut theo annotation. CPU trở về mức cũ.

### Trả lời mẫu khi phỏng vấn
"Spring AOP dùng proxy. JDK dynamic proxy tạo lớp mới implements các interface của bean nên chỉ chặn được method trong interface, và inject theo lớp cụ thể sẽ lỗi. CGLIB tạo lớp con của bean nên chặn được cả method không thuộc interface, nhưng không override được method final, private, static, và không proxy được class final; Spring Boot mặc định dùng CGLIB. Hạn chế hay gặp nhất trên production là self-invocation: gọi method qua this không đi qua proxy nên transaction, cache, async hay aspect của bạn đều không chạy. Ngoài ra là pointcut quá rộng làm tốn CPU, và thứ tự giữa nhiều aspect như transaction với retry cần đặt Order rõ ràng. Với những gì cần chặn cả lời gọi nội bộ hoặc hiệu năng cao, tôi viết code tường minh thay vì AOP."

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

### Ví dụ đời thực
Một team viết auto-config {{DbMetricsAutoConfiguration}} để expose metric số lượng connection đang dùng từ HikariCP. Auto-config đặt {{@Bean}} {{HikariDataSource}} mà **không** có {{@ConditionalOnMissingBean}} → khi user tự định nghĩa {{DataSource}} bean (ví dụ test với embedded database), auto-config vẫn tạo bean thứ hai → hai pool cùng kết nối DB, metric báo sai số connection, và một số test fail vì bean conflict. Điều tra: logSpring Boot in "Condition evaluation report" cho thấy {{DbMetricsAutoConfiguration}} vẫn chạy dù user đã define bean. Nguyên nhân: thiếu {{@ConditionalOnMissingBean}}. Sửa: thêm {{@ConditionalOnMissingBean}} lên {{@Bean}} và thay {{@ConditionalOnClass(X.class)}} trên method bằng class-level hoặc string name để tránh {{ClassNotFoundException}}. Kết quả: test với embedded DB không còn bean conflict, metric phản ánh đúng pool thực tế.

### Trả lời mẫu khi phỏng vấn
"Auto-configuration trong Spring Boot là cơ chế đăng ký bean có điều kiện: Boot đọc danh sách auto-config từ file {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}, rồi với mỗi auto-config kiểm tra các {{@Conditional...}} – {{@ConditionalOnMissingBean}} để không overriding bean của user, {{@ConditionalOnClass}} để không yêu cầu thư viện vắng mặt, {{@ConditionalOnProperty}} để toggle theo config. Debug bằng cờ {{--debug}} (log in ra điều kiện từng auto-config) hoặc endpoint {{/actuator/conditions}}. Trong thực tế, khi viết auto-config, tôi luôn thinking nó là API công khai: mọi bean phải có {{@ConditionalOnMissingBean}}, phải có default value hợp lý cho property, và phải có test khẳng định user tự define bean thì auto-config nhường đường. Đây là 3 test tối thiểu."

### Cơ chế từng bước: auto-config được nạp và sắp xếp thế nào
1. **Phát hiện**: Spring Boot đọc file {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}} (Spring Boot 3) – mỗi dòng một class name đầy đủ. Boot 2.7 trở xuống dùng key {{EnableAutoConfiguration}} trong {{META-INF/spring.factories}}.

2. **Lọc điều kiện**: Với mỗi auto-config class, Spring kiểm tra các annotation {{@Conditional...}} ở class-level:
   - {{@ConditionalOnClass}}: ASM đọc annotation, **không nạp class** – an toàn khi class vắng mặt.
   - {{@ConditionalOnMissingBean}}: kiểm tra xem bean cùng type đã được user define chưa.
   - {{@ConditionalOnProperty}}: đọc property, {{matchIfMissing = true}} để có default.
   - Nếu bất kỳ điều kiện nào fail → toàn bộ auto-config bị loại.

3. **Sắp xếp thứ tự**: {{@AutoConfigureBefore}} / {{@AutoConfigureAfter}} ép thứ tự, {{@AutoConfigureOrder}} sắp xếp theo số. Nếu không khai báo, Boot sắp theo tên class alphabet – **không** tự suy ra thứ tự từ dependency giữa các bean.

4. **Tạo bean**: Các {{@Bean}} trong auto-config được đăng ký như bean thường, với điều kiện method-level nếu có.

**Lưu ý quan trọng**: {{@ConditionalOnClass(X.class)}} ở **class-level** là an toàn (Spring đọc bằng ASM, không nạp class). Nhưng đặt trên **method {{@Bean}}** với class literal thì có thể ném {{ClassNotFoundException}} khi X vắng mặt – vì lúc đó Spring phải nạp class để đọc annotation. Cách an toàn: tách nested {{@Configuration}} riêng có điều kiện ở class-level, hoặc dùng {{name = "com.x.X"}} dạng String.

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

### Ví dụ đời thực
Hệ thống thanh toán có {{PaymentService}} (ghi số dư, gửi email) và {{NotificationService}} (gửi email, đọc cấu hình từ {{PaymentService}}). Hai service này inject vào nhau: {{PaymentService → NotificationService}} (để gửi email khi thanh toán) và {{NotificationService → PaymentService}} (để đọc số dư còn lại cho email). App chạy tốt trên Boot 2.5 (mặc định cho phép circular dependency). Khi nâng cấp lên Boot 2.6, app **fail lúc start** với chuỗi lỗi: "The dependency of PaymentService -> NotificationService and NotificationService -> PaymentService is unresolvable". Điều tra: Boot in ra đường dẫn đầy đủ {{PaymentService → NotificationService → PaymentService}}. Kiểm tra code: {{NotificationService}} chỉ cần {{PaymentService}} để **đọc** số dư khi gửi email – không cần ngay lúc khởi tạo. Nguyên nhân gốc: design smell – {{NotificationService}} biết quá nhiều về {{PaymentService}}, và hai service cùng thực hiện việc liên thông. Sửa theo thứ tự ưu tiên: (1) tách abstraction – {{NotificationService}} inject {{BalanceService}} interface (do {{PaymentService}} implement) → cycle tan; (2) nếu cần nhanh, dùng {{@Lazy}} trên {{NotificationService}} để tạo proxy trễ – nhưng team nhận ra đây là workaround; (3) dài hạn: {{PaymentService}} phát {{PaymentCompletedEvent}} khi xong, {{NotificationService}} listen bằng {{@TransactionalEventListener}} → event-driven. Kết quả: app start được trên Boot 2.6+, unit test của {{NotificationService}} không cần Spring context anymore.

### Trả lời mẫu khi phỏng vấn
"Circular dependency là A phụ thuộc B, B phụ_depend A. Spring Boot 2.6+ cấm nó mặc định bằng {{spring.main.allow-circular-references=false}} vì cycle là triệu chứng của thiết kế sai: hai class phụ thuộc lẫn nhau, không test được độc lập, và chỉ giải quyết được bằng early reference + proxy (chỉ với field/setter injection) – không hoạt động với constructor injection. Khi gặp cycle, tôi phân tích theo 3 bước: (1) đọc chuỗi lỗi của Boot để xác định điểm giao, (2) hỏi 'A có thật sự cần B ngay lúc khởi tạo hay chỉ cần khi xử lý request?', (3) tìm {{@Lazy}} đang dùng để giấu cycle. Sau đó refactor theo thứ tự: tách abstraction (Dependency Inversion – để interface do A định nghĩa), event-driven (ApplicationEventPublisher + @TransactionalEventListener), hoặc dùng ObjectProvider/@Lazy như workaround cuối cùng. Trong review, câu hỏi đáng đặt là: 'module này có đang biết quá nhiều về module kia không?'."

### Cơ chế từng bước: Spring xử lý cycle và quy trình refactor chi tiết
**Spring xử lý cycle thế nào (chỉ với field/setter injection)**:
1. Container tạo A (chưa inject B) → đưa "early reference" của A vào B.
2. Inject B vào A → sau đó thay early reference bằng proxy.
3. **Tại sao không hoạt động với constructor injection**: constructor cần B ngay từ đầu, nhưng B cũng cần A → bế tắc.
4. **Tại sao {{@Async}} dễ vỡ**: proxy AOP không hỗ trợ early reference → lỗi "has been injected into other beans in its raw version".

**Quy trình phân tích khi gặp cycle**:
1. Đọc chuỗi lỗi: Boot in ra đường dẫn phụ thuộc đầy đủ (A → B → A), đánh số từng bean.
2. Vẽ lại sơ đồ phụ thuộc và hỏi: "A có thật sự cần B ngay lúc khởi tạo, hay chỉ cần B khi xử lý request?".
3. Kiểm tra {{@Lazy}} đang được dùng ở đâu để "giấu" cycle.

**Các cách refactor (xếp theo mức độ ưu tiên)**:
1. **Tách abstraction**: để B phụ thuộc vào interface do A định nghĩa (Dependency Inversion). Cycle thường tan ngay khi inversion chiều sở hữu interface.
2. **Đảo chiều phụ thuộc theo use case**: service "cao cấp" (application service) gọi cả hai service "thấp" – ông trung gian không cần logic, chỉ điều phối.
3. **Event-driven**: thay lời gọi trực tiếp bằng {{ApplicationEventPublisher}} + {{@TransactionalEventListener}} ở phía nhận. Lưu ý event chạy **sau commit** nếu dùng {{@TransactionalEventListener}}, nên dữ liệu phải được đọc lại.
4. **Lazy injection** ({{@Lazy}} hoặc {{ObjectProvider<T>}}): tạo proxy trễ hoãn, phá cycle về mặt kỹ thuật. Đây là **workaround**, dùng khi cần fix nhanh trên hệ thống cũ.
5. **Tách module/service**: nếu cycle xuyên qua ranh giới module, đó là dấu hiệu thiếu event bus hoặc thiếu một module "shared".

**Pitfall production thêm**:
- {{@Lazy}} làm che vấn đề: lỗi tạo bean (nếu có) chỉ lộ ra ở lần gọi đầu tiên qua lazy proxy lúc runtime, thay vì lỗi lúc start.
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

### Ví dụ đời thực
Một API gateway nội bộ dùng JWT để xác thực: mỗi service nhận token từ header {{Authorization: Bearer ...}}, kiểm tra chữ ký bằng public key từ JWKS. Đội ngũ quyết định dùng HS256 (shared secret) vì đơn giản và latency thấp hơn – cả auth server và 5 service đều giữ secret. Vấn đề: một developer commit secret lên GitHub (được phát hiện sau 3 ngày) → **tất cả** token đã cấp có thể được tạo lại bởi bất kỳ ai có secret, và service nào giữ secret đều tự ký được token. Điều tra: audit log cho thấy token được tạo từ IP nội bộ không phải auth server. Sửa: chuyển sang RS256 (bất đối xứng) – auth server giữ private key (không bao giờ ra ngoài), các service lấy public key từ JWKS endpoint {{/.well-known/jwks.json}}. Kết quả: ngay sau khi rotate key, 5 service tự động load JWKS mới, không cần deploy lại; và thêm {{aud}} validator để token cấp cho service A không dùng được ở service B. Việc kiểm tra {{aud}} đã ngăn một token test được dùng ở staging – là lỗ hổng thực tế.

### Trả lời mẫu khi phỏng vấn
"Spring Security là filter-based: mỗi request đi qua FilterChainProxy, gọi lần lượt các filter – nạp SecurityContext, kiểm tra CSRF, đọc Bearer token, kiểm tra quyền, xử lý lỗi. Với API stateless, tôi tắt session (SessionCreationPolicy.STATELESS) và CSRF, dùng BearerTokenAuthenticationFilter để đọc header Authorization. Spring Boot tự động cấu hình OAuth2 Resource Server khi thêm starter oauth2-resource-server và khai báo issuer-uri – nó tự lấy /.well-known/openid-configuration, tải JWKS để xác thực chữ ký. Resource server không phát token, chỉ xác thực token do Authorization Server (Keycloak, Cognito) cấp. Trong thực tế, tôi luôn kiểm tra 4 thứ: chữ ký, iss, exp (với clock skew 60s), và aud – vì chỉ dựa vào exp là lỗ hổng: token cấp cho service khác vẫn dùng được. Authority: scope read:orders → SCOPE_read:orders, nếu token mang claim roles thì cần JwtAuthenticationConverter tùy chỉnh."

### Cơ chế từng bước: filter chain và JWT verification chi tiết
**Thứ tự filter quan trọng**:
1. {{SecurityContextHolderFilter}}: nạp {{SecurityContext}} (không tự lưu session).
2. {{CsrfFilter}}: chống CSRF cho request dùng cookie.
3. {{BearerTokenAuthenticationFilter}}: đọc header {{Authorization: Bearer ...}}, xác thực token.
4. {{UsernamePasswordAuthenticationFilter}}: đăng nhập bằng form (REST thường không dùng).
5. {{ExceptionTranslationFilter}}: chuyển lỗi 401/403 sang entry point.
6. {{AuthorizationFilter}}: kiểm tra quyền theo rule đã cấu hình.

**Cơ chế xác thực JWT (Resource Server)**:
- Resource server **không** phát token, chỉ xác thực token do Authorization Server (Keycloak, Spring Authorization Server, Cognito) cấp.
- Khai báo {{issuer-uri}} → Boot tự lấy {{/.well-known/openid-configuration}}, tải **JWK Set** để xác thực chữ ký, và cache bằng {{NimbusJwtDecoder}}.
- Token phải kiểm tra: chữ ký hợp lệ, {{iss}} đúng, {{exp}} chưa hết hạn (chấp nhận clock skew mặc định 60s), {{aud}} đúng với API của bạn (cần cấu hình thêm {{audience}} validator).
- Authorities: mặc định scope {{read:orders}} → {{SCOPE_read:orders}}. Nếu token mang claim {{roles}} cần khai báo {{JwtAuthenticationConverter}} tùy chỉnh.

**Pitfall production thêm**:
- Tắt CSRF phải đi kèm việc **không dùng cookie/session** để xác thực. Nếu app vừa có web session vừa có API, tách filter chain riêng cho từng phần.
- Chỉ dựa vào {{exp}} mà không kiểm tra {{aud}} là lỗ hổng kinh điển: token cấp cho dịch vụ khác vẫn dùng được.
- Refresh token: cần cơ chế rotation, lưu hash phía server, phát hiện reuse.
- Không log token/header {{Authorization}}; redact trong log filter.
- Cần rate limiting và cơ chế ngăn brute force ở tầng gateway.

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

### Ví dụ đời thực
Một service gửi email thông báo sau khi đơn hàng được xác nhận: team dùng {{@Async}} trên {{EmailService.sendConfirmation()}} để không làm chậm response. App chạy tốt trên 1 instance, nhưng khi scale lên 10 pod, mỗi pod nhận hàng trăm email mỗi phút – {{SimpleAsyncTaskExecutor}} (mặc định vì không có bean TaskExecutor nào) tạo **một thread mới cho mỗi email** → 10 pod × 500 email/phút = 5.000 thread/pod, CPU 80%, GC liên tục, và một số email bị mất do thread bị kill khi pod scale down. Điều tra: thread dump cho thấy hàng nghìn thread {{SimpleAsyncTaskExecutor-1}}, {{SimpleAsyncTaskExecutor-2}}…; metric HikariCP cũng báo pool cạn vì async task cũng dùng connection. Sửa: khai báo {{ThreadPoolTaskExecutor}} với core=4, max=8, queue=500, rejection policy {{CallerRunsPolicy}} (backpressure); thêm metrics đếm số task đang chờ và số task lỗi; với email quan trọng, chuyển sang RabbitMQ + retry/dead-letter. Kết quả: CPU xuống 20%, không còn thread bùng nổ, và email không bị mất khi scale down (graceful shutdown + queue).

### Trả lời mẫu khi phỏng vấn
"{{@Async}} chạy method ở thread khác do một TaskExecutor quản lý, và nó cũng dựa trên proxy – nên chịu đúng hạn chế của AOP: self-invocation, method private/final → không chạy async. Ba cái bẫy lớn nhất: thứ nhất, exception bị nuốt – task chạy nền, lỗi không trả về cho caller; method void thì exception chỉ vào AsyncUncaughtExceptionHandler (mặc định chỉ log), method trả Future thì exception nằm trong Future, không ai đọc là mất. thứ hai, transaction không truyền sang thread mới – TransactionSynchronizationManager gắn với thread, nên thread mới không có transaction; phải đặt {{@Transactional}} ngay trên chính method async. thứ ba, ThreadLocal không truyền – MDC (trace id) và SecurityContext không tự sang thread mới; phải dùng TaskDecorator để copy context. Trong thực tế, tôi luôn khai báo executor tường minh (không dùng SimpleAsyncTaskExecutor), đặt queue capacity và rejection policy, và chỉ dùng {{@Async}} cho tác vụ không quan trọng – với tác vụ nghiệp vụ cần đảm bảo, dùng message broker."

### Cơ chế từng bước: executor và các bẫy chi tiết
**Executor mặc định là gì**:
- Nếu có **đúng một** bean {{TaskExecutor}}, Spring dùng bean đó cho {{@Async}}.
- Spring Boot tự động cấu hình bean {{applicationTaskExecutor}} (core size 8, queue rất lớn, prefix {{task-}}).
- Nếu **không** có bean nào, Spring rơi về {{SimpleAsyncTaskExecutor}}: **mỗi task một thread mới, không giới hạn** → chạy tải cao sẽ sinh hàng nghìn thread và làm chết máy. Luôn khai báo executor tường minh.

**Bẫy 1 – exception bị nuốt**:
Method {{void}}: exception đi vào {{AsyncUncaughtExceptionHandler}} (mặc định chỉ log), caller không biết. Method trả {{Future}}/{{CompletableFuture}}: exception nằm trong Future, không ai đọc là mất. Muốn xử lý lỗi: trả {{CompletableFuture<Void>}} và dùng {{whenComplete}} / {{exceptionally}}, và cài {{AsyncUncaughtExceptionHandler}} riêng (alert/metrics) cho method void.

**Bẫy 2 – transaction**:
Transaction gắn với thread (qua {{TransactionSynchronizationManager}}), nên thread mới **không có** transaction. Đừng mong {{@Transactional}} ở method gọi được kế thừa. Hãy đặt {{@Transactional}} ngay trên chính method async (chạy trong thread mới) để có transaction riêng.

**Bẫy 3 – ThreadLocal**:
{{MDC}} (trace id) và {{SecurityContext}} không tự truyền sang thread mới. Dùng {{TaskDecorator}} để copy context:
~~~java
ex.setTaskDecorator(runnable -> {
    var ctx = MDC.getCopyOfContextMap();
    return () -> { MDC.setContextMap(ctx); try { runnable.run(); } finally { MDC.clear(); } };
});
~~~

**Pitfall production thêm**:
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

### Ví dụ đời thực
Service chạy 3 pod có {{@Scheduled(cron = "0 0 2 * * *")}} gửi email nhắc nợ. Sau khi scale lên 3 pod, khách nhận **3 email giống nhau** mỗi sáng — 18.000 email trùng, nhà cung cấp email cảnh báo spam. Cùng lúc, job chạy lúc 9 giờ sáng giờ Việt Nam thay vì 2 giờ vì container dùng UTC. Một job khác ({{fixedRate}} 1 phút) có lần chạy lâu 7 phút do DB chậm; vì scheduler mặc định chỉ có **một thread**, mọi job khác trong service bị trễ 7 phút. Sửa:
- {{@Scheduled(cron = "0 0 2 * * *", zone = "Asia/Ho_Chi_Minh")}};
- ShedLock ({{@SchedulerLock(name = "debtReminder", lockAtMostFor = "30m", lockAtLeastFor = "5m")}}) với bảng khoá trong DB để chỉ một pod chạy;
- {{spring.task.scheduling.pool.size=4}};
- job tự bắt và log exception, kèm metric số lần thành công/thất bại để cảnh báo khi job không chạy.

### Trả lời mẫu khi phỏng vấn
"Với @Scheduled tôi kiểm tra bốn điều. Timezone: cron chạy theo múi giờ của JVM, container thường là UTC, nên tôi khai báo zone tường minh. Nhiều instance: mỗi pod đều chạy job, nên với job chỉ được chạy một lần tôi dùng ShedLock với khoá trong DB, hoặc chuyển sang scheduler riêng như Kubernetes CronJob hay Quartz cluster, và vẫn thiết kế job idempotent. Task chạy lâu: scheduler mặc định chỉ có một thread nên một job chậm làm trễ mọi job khác; tôi tăng pool size hoặc đẩy việc nặng sang executor riêng, và phân biệt fixedRate với fixedDelay. Exception: lỗi trong job chỉ được log và job chạy lại lần sau, nên tôi tự bắt, log có ngữ cảnh, và đặt metric cùng cảnh báo khi job không chạy thành công trong khoảng thời gian dự kiến."

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

### Ví dụ đời thực
Một team chuyển API gateway nội bộ sang WebFlux vì "nhanh hơn", nhưng các service phía sau vẫn gọi JPA. Họ bọc repository bằng {{Mono.fromCallable(...)}} mà quên {{subscribeOn(Schedulers.boundedElastic())}} → các lời gọi JDBC chặn chạy ngay trên **event loop** (chỉ vài thread bằng số core) → dưới tải vừa phải, p99 tăng lên 4 giây, mọi request khác cũng đứng. BlockHound (công cụ phát hiện lời gọi chặn trong reactive thread) bắt được 23 chỗ. Cuối cùng team quay lại Spring MVC + virtual thread ({{spring.threads.virtual.enabled=true}}, Java 21): code đơn giản lại, throughput tương đương bản WebFlux đã sửa, p99 ổn định 180ms. WebFlux được giữ cho một service streaming SSE với hàng chục nghìn kết nối mở lâu — nơi nó thật sự phát huy.

### Trả lời mẫu khi phỏng vấn
"Spring MVC chạy mỗi request trên một thread và code blocking quen thuộc; WebFlux dùng mô hình non-blocking trên số ít thread event loop, mạnh khi phần lớn thời gian là chờ I/O và toàn bộ đường đi đều non-blocking. WebFlux không làm từng request nhanh hơn; nó giúp phục vụ nhiều kết nối đồng thời với ít thread. Nếu phía sau vẫn là JDBC hay JPA blocking thì lợi ích gần như mất, và lỡ chạy lời gọi chặn trên event loop thì còn tệ hơn MVC. Virtual thread của Java 21 thay đổi bức tranh: Spring MVC bật virtual thread phục vụ được rất nhiều request đồng thời mà giữ code blocking dễ đọc và debug. Nên giờ tôi mặc định chọn MVC kèm virtual thread, và chỉ chọn WebFlux cho streaming, rất nhiều kết nối mở lâu, hoặc khi cần backpressure end to end với driver reactive như R2DBC."

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
Lớp này xử lý nhiều lỗi do Spring MVC sinh ra như 400, 405 và 415. Nếu kế thừa, hãy override các hook tương ứng (ví dụ {{handleMethodArgumentNotValid}}) thay vì khai báo một {{@ExceptionHandler}} trùng với exception đã được lớp cha ánh xạ. Với 404: từ Spring Framework 6.1 (Boot 3.2), URL không khớp handler nào rơi vào static resource handler và ném {{NoResourceFoundException}}, lớp cha đã map nó thành ProblemDetail 404 nên advice của bạn xử lý được (override {{handleNoResourceFoundException}} nếu cần format riêng). Ở bản cũ hơn, 404 mặc định đi thẳng tới error page của Boot ({{/error}}) chứ không qua advice.

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

### Ví dụ đời thực
Một hệ thống đặt hàng có API GET /api/orders/{id} trả về HTTP 500 khi đơn hàng không tồn tại, nhưng body trả về chứa stack trace đầy đủ: câu SQL, tên class, đường dẫn source code trên server. Attacker có thể dùng thông tin này để ánh xạ cấu trúc cơ sở dữ liệu. Đội ngũ điều tra log API và thấy response body có org.springframework... kèm query SQL đầy đủ. Nguyên nhân: controller ném OrderNotFoundException (chủ riêng extends RuntimeException) nhưng không có @RestControllerAdvice nào bắt nó, nên Spring Boot dùng DefaultErrorResponse mặc định với các trường error, message, trace đầy đủ. Sửa: thêm @RestControllerAdvice bắt OrderNotFoundException, trả về ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Không tìm thấy đơn hàng") kèm setProperty("code", "ORDER_NOT_FOUND"); log stack trace gốc ở server. Đồng thời tắt trường nhạy cảm trong response lỗi (server.error.include-stacktrace=never, server.error.include-message=never). Kết quả: client chỉ nhận {"status":404,"title":"Order not found","detail":"Không tìm thấy đơn hàng","code":"ORDER_NOT_FOUND"}, không còn lộ SQL hay đường dẫn file; theo log WAF, số lượt quét lỗi từ bên ngoài giảm xuống 0 sau 2 tuần.

### Trả lời mẫu khi phỏng vấn
"Tôi xử lý lỗi tập trung bằng @RestControllerAdvice kết hợp @ExceptionHandler, để một chỗ duy nhất quản lý tất cả exception thay vì bắt tại mỗi controller. Từ Spring Framework 6, tôi trả về ProblemDetail theo chuẩn RFC 9457: type, title, status, detail và các thuộc tính mở rộng như mã lỗi nghiệp vụ. Với các exception do Spring MVC sinh ra (400, 405, 415), tôi kế thừa ResponseEntityExceptionHandler và override hook tương ứng. Tôi tránh các bẫy phổ biến: không bắt Exception.class rồi trả ex.getMessage() ra client vì sẽ lộ câu SQL, đường dẫn file; luôn log stack trace gốc ở server và chỉ trả về thông điệp trung tính; thêm correlation id vào mỗi response để tra log. Mỗi response lỗi đều kèm mã lỗi nghiệp vụ và traceId, giúp client hiển thị theo mã, và đội vận hành tra cứu log trong 30 giây khi người dùng phản ánh lỗi."

> Senior tip: hãy chuẩn hoá lỗi của cả hệ thống theo **mã lỗi nghiệp vụ** ({{code}}) thay vì chuỗi message tiếng Anh – client hiển thị theo mã, còn bạn đổi message trong code mà không phá vỡ client. Kèm theo đó, luôn trả về {{traceId}} để tra log trong 30 giây khi user gọi báo lỗi.`,
  follow: [
    'Sự khác biệt giữa {{@ExceptionHandler}} và {{@ResponseStatus}} là gì?',
    'Tại sao lỗi phát sinh trong filter không được xử lý bởi {{@ControllerAdvice}}?'
  ],
  tags: ['ControllerAdvice', 'ProblemDetail', 'RFC 7807', 'exception handling'],
  refs: [
    { type: 'doc', title: 'Spring Framework REST Exceptions', url: 'https://docs.spring.io/spring-framework/reference/web/webmvc/mvc-ann-rest-exceptions.html' },
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

### Ví dụ đời thực
Hệ thống thanh toán của một công ty tài chính dùng {{spring.profiles.active}} bằng biến môi trường {{APP_PROFILE}}. Ở staging, biến này bị set nhầm thành {{prod}} (do một script deploy cũ không được ghi override) → app khởi động với profile prod, load config thanh toán thật (provider VNPay với API key thật, không phải sandbox). Job test hàng ngày chạy tự động, mỗi job tạo một giao dịch thật khoảng 500.000 VNĐ. Sau 30 phút, team nhận ra khi xem báo cáo doanh thu: có 12 giao dịch thật (~6 triệu VNĐ) nhưng không có đơn hàng nào tương ứng. Điều tra: log khởi động in ra {{The following profiles are active: prod}} – team so sánh với deploy staging thì thấy {{APP_PROFILE=staging}} trong CI, nhưng một env var khác {{SPRING_PROFILES_ACTIVE=prod}} (cũ, từ một script thử nghiệm) vẫn tồn tại và Spring ưu tiên system properties cao hơn biến môi trường OS theo thứ tự externalized config. Nguyên nhân gốc: profile "active" bị set nhầm – thứ tự ưu tiên là command line args → system properties → biến môi trường OS → file theo profile. Sửa: (1) xoá biến {{SPRING_PROFILES_ACTIVE}} cũ, chỉ dùng một biến duy nhất {{APP_PROFILE}}; (2) thêm sanity check ở {{@PostConstruct}} hoặc {{ApplicationRunner}}: nếu profile active là {{prod}} mà app đang chạy trong một hostname staging (có thể check theo {{HOSTNAME}} hoặc một env var {{DEPLOY_ENV=staging}}), app fail ngay lúc khởi động thay vì chạy nhầm 30 phút; (3) thêm log WARN khi khởi động in rõ danh sách profile active và source của chúng; (4) với bí mật, phát hiện thêm: API key của VNPay xuất hiện trong log vì một câu log in toàn bộ object PaymentProperties – dù {{@ConfigurationProperties}} đã che field nhạy cảm, nhưng toString của record in tất cả field. Sửa: dùng {{@ToString(exclude = ...)}} hoặc không log toàn bộ config; đồng thời kiểm tra {{management.endpoint.env.show-values=NEVER}} (mặc định Boot 3) đã bật chưa. Kết quả: deploy staging không còn nhầm profile, và log không còn lộ API key.

### Trả lời mẫu khi phỏng vấn
  "Với cấu hình Spring Boot, tôi coi nó là hợp đồng giữa app và môi trường. Dùng {{@ConfigurationProperties}} để bind type-safe kèm {{@Validated}} – app fail ngay lúc start nếu config sai, thay vì lỗi lúc chạy. Profile dùng để tách theo môi trường, nhưng thứ tự ưu tiên là command line → system properties → biến môi trường → file – nên một biến môi trường cũ trong shell có thể phủ nhận biến mới. Bí mật không bao giờ trong repo hay image: lấy từ secret manager, inject vào runtime, và actuator phải che toàn bộ giá trị ({{show-values=NEVER}}). Trong thực tế, tôi luôn thêm sanity check khi profile active là prod mà deploy env là staging, và không log toàn bộ config object vì toString của record có thể lộ secret. Một mẹo: đặt toàn bộ config vào một package riêng và viết test khẳng định app start được với từng profile – bắt được lỗi config ngay trong CI thay vì lúc deploy."

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

### Ví dụ đời thực
Một công ty vận hành 50 pod service, mỗi pod expose /actuator/prometheus và Prometheus scrape mỗi 30s. Khi một service bắt đầu mất dữ liệu (giao dịch bị rollback thầm lặng), team không biết vì dashboard chỉ hiển thị request rate và error rate – không có metric về số transaction rollback. Điều tra: Prometheus scrape 50 pod, mỗi pod mỗi 30s → 100 scrape/phút, mỗi scrape trả về khoảng 2.000 metric series. Khi team thêm metric nghiệp vụ (số đơn thành công/thất bại, số task async đang chờ, số connection pool pending) và gán tag endpoint + status cho mọi HTTP metric, số series tăng lên 2.000.000 – Prometheus bị OOM (bộ nhớ tăng từ 4GB lên 16GB rồi crash) và scrape timeout tăng từ 2s lên 30s, dashboard "biến mất" trong 10 phút. Nguyên gốc: metric cardinality cao – tag endpoint động (mỗi request path là một giá trị) và status kết hợp tạo hàng nghìn series chỉ từ một metric http.server.requests. Sửa: (1) loại bỏ tag endpoint động, chỉ giữ uri được chuẩn hóa (bỏ id số) hoặc dùng outcome + status 4 giá trị; (2) thay metric nghiệp vụ chi tiết bằng aggregate (đếm theo ngày, không theo từng đơn); (3) thêm cardinality_limit trong Prometheus hoặc dùng relabeling ở scrape config để drop tag không cần; (4) với tracing, tăng sampling probability lên 100% khi có alert (tail-based sampling) thay vì sample 10% mọi lúc. Kết quả: số series giảm xuống 50.000, scrape về 1s, dashboard phản hồi lại. Đồng thời, team thêm metric transaction.rollback.count từ Hibernate statistic và alert khi tỉ lệ rollback > 5% – phát hiện ngay một service đang rollback 30% giao dịch do deadlock, sửa xong tỉ lệ về 0,2%.

### Trả lời mẫu khi phỏng vấn
  "Ba thành phần vận hành của tôi là Actuator, Micrometer và tracing. Actuator là giao diện vận hành chính: /actuator/health để kiểm tra sống (tách liveness và readiness cho Kubernetes), /actuator/prometheus để scrape số liệu, /actuator/metrics để xem chi tiết khi đang lỗi, /actuator/threaddump khi app bị treo. Micrometer là lớp abstraction: tự động ghi RED metrics (Rate, Error, Duration) cho HTTP, và tôi thêm metric nghiệp vụ như số đơn/ngày, số task thất bại. Distributed tracing dùng Micrometer Tracing + OpenTelemetry: tự động thêm trace id vào log và truyền header traceparent qua HTTP client – chọn sample 10% bình thường, 100% khi có alert. Graceful shutdown: server.shutdown=graceful và timeout-per-shutdown-phase=30s – khi pod nhận SIGTERM, nó ngừng nhận request mới, chờ request đang chạy, rồi đóng pool. Kubernetes phải có terminationGracePeriodSeconds lớn hơn thời gian shutdown và preStop hook sleep 5–10s vì K8s gỡ endpoint song song với việc gửi SIGTERM. Pitfall lớn nhất là metric cardinality cao: gắn userId hoặc path động sẽ làm Prometheus nổ tung – chỉ tag với giá trị có số lượng hữu hạn. Health check sâu (kiểm tra DB) chỉ dùng cho readiness, không dùng cho liveness vì DB chậm sẽ restart toàn bộ pod."

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

### Ví dụ đời thực
Một màn hình danh sách đơn hàng hiển thị 50 đơn/trang, mỗi đơn có danh sách sản phẩm (collection {{items}}). Code repository dùng {{orderRepo.findAll()}}, sau đó service lặp qua từng đơn để lấy {{order.getItems()}} gán vào DTO. Khi deploy lên staging với dữ liệu 20.000 đơn, API phản hồi 2,8 giây; log SQL cho thấy 1 query lấy 20.000 đơn + 20.000 query con lấy items (mỗi query 1 đơn). CPU DB lên 85%, connection pool HikariCP cạn (30/30). Điều tra: bật {{spring.jpa.properties.hibernate.generate_statistics=true}} thấy 20.001 query/execution; EXPLAIN ANALYZE từng query items tốn 0,3ms nhưng 20.000 lần cộng lại > 6 giây CPU. Nguyên nhân: N+1 do lazy loading trong vòng lặp. Sửa: thay {{findAll()}} bằng JPQL {{join fetch o.items}}, thêm {{@BatchSize(size = 50)}} cho collection items trong entity, và chuyển sang DTO projection {{OrderRow(id, status, itemCount)}} cho màn hình danh sách (chỉ cần số lượng item, không cần chi tiết). Kết quả: API từ 2,8 giây xuống 45ms, số query từ 20.001 xuống 1, CPU DB < 10%, connection pool ổn định 5/30.

### Trả lời mẫu khi phỏng vấn
"N+1 xảy ra khi lấy danh sách N bản ghi rồi lặp qua từng bản ghi để truy cập collection lazy, sinh ra 1 + N query. Tôi phát hiện bằng log SQL (show-sql), Hibernate statistics, hoặc datasource-proxy đếm query theo request. Cách xử lý: ưu tiên DTO projection cho màn hình danh sách vì không cần entity con; nếu cần entity thì dùng join fetch hoặc @EntityGraph; bật default_batch_fetch_size = 50 làm lưới an toàn cho các collection lazy còn lại. Pitfall: join fetch + Pageable gây HHH000104 (phân trang trong bộ nhớ), fix bằng cách lấy id trước rồi fetch sau. Thực tế tôi đã từng giảm API danh sách đơn hàng từ 2,8s xuống 45ms bằng cách chuyển sang DTO projection và bật batch fetching."

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

### Ví dụ đời thực
Một job cập nhật giá cho 300.000 sản phẩm trong **một** transaction: {{findAll()}} rồi sửa từng entity. Persistence context giữ cả 300.000 entity **cùng bản sao snapshot** để dirty checking → heap tăng 3,5GB, và lúc flush Hibernate phải so sánh từng entity với snapshot → mất 11 phút, GC full liên tục. Sửa: xử lý theo lô 1.000 entity, sau mỗi lô {{flush()}} rồi {{clear()}} để giải phóng persistence context, bật JDBC batch ({{hibernate.jdbc.batch_size=50}}, {{order_updates=true}}); với cập nhật hàng loạt cùng một công thức thì dùng câu {{UPDATE}} bulk (lưu ý bulk update bỏ qua persistence context, phải clear). Thời gian còn 40 giây, heap tối đa khoảng 300MB. Một lỗi khác cùng job: đọc entity với {{@Transactional(readOnly = true)}} rồi gọi setter để "chuẩn hoá hiển thị" — với readOnly, Hibernate (Spring 5.1+) đặt flush mode MANUAL nên không ghi; nhưng trước đó, ở method không readOnly, cùng thao tác đã vô tình ghi xuống DB.

### Trả lời mẫu khi phỏng vấn
"Persistence context là bộ nhớ đệm cấp một gắn với EntityManager, thường là một transaction. Entity có bốn trạng thái: transient là object mới chưa liên quan; managed là đang được context theo dõi; detached là đã rời context, ví dụ sau khi transaction kết thúc; removed là đã đánh dấu xoá. Với entity managed, Hibernate giữ một snapshot lúc nạp, và khi flush thì so sánh để tự sinh UPDATE, đó là dirty checking, nên gọi setter là đủ, không cần save. Flush mặc định là AUTO, xảy ra trước commit và trước query có thể bị ảnh hưởng. Hệ quả thực tế: xử lý hàng trăm nghìn entity trong một transaction làm phình bộ nhớ và chậm flush, nên tôi chia lô, flush và clear sau mỗi lô, bật JDBC batch; và cẩn thận với setter trên entity managed vì nó sẽ được ghi xuống DB."

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

### Ví dụ đời thực
Một API trả danh sách đơn hàng chạy tốt khi Open Session In View đang bật (mặc định của Spring Boot, kèm cảnh báo lúc khởi động). Nhưng mỗi request mở session suốt từ đầu tới khi serialize JSON xong: Jackson duyệt {{order.items}}, {{order.customer}} → **lazy load** hàng trăm query trong lúc render, connection bị giữ suốt cả request kể cả khi gọi API ngoài 2 giây. Dưới tải, pool 30 connection cạn. Tắt OSIV ({{spring.jpa.open-in-view=false}}) → hàng loạt {{LazyInitializationException}} lộ ra ở 17 endpoint — chính là 17 chỗ đang ngầm chạy N+1. Sửa từng endpoint bằng DTO projection hoặc {{@EntityGraph}} trong service; số query của API danh sách từ khoảng 210 xuống 3, thời gian giữ connection trung bình mỗi request từ 1,4 giây xuống 35ms.

### Trả lời mẫu khi phỏng vấn
"LazyInitializationException xảy ra khi truy cập một quan hệ lazy chưa được nạp sau khi persistence context đã đóng, thường là khi entity được trả ra khỏi service rồi controller hay Jackson chạm vào quan hệ đó. Open Session In View giữ session mở tới hết request nên exception biến mất, Spring Boot bật mặc định. Tôi tắt nó, vì nó che giấu vấn đề: lazy loading xảy ra rải rác trong lúc render JSON gây N+1 khó thấy, và connection bị giữ suốt cả request, kể cả lúc gọi API ngoài, nên pool dễ cạn dưới tải. Cách làm đúng là service quyết định rõ dữ liệu cần lấy: trả DTO hoặc projection, dùng JOIN FETCH hay EntityGraph cho các quan hệ cần, và không trả entity thẳng ra controller. Khi tắt OSIV trên hệ thống có sẵn, mỗi exception lộ ra chính là một chỗ N+1 cần sửa."

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

### Ví dụ đời thực
Màn hình quản lý tồn kho cho phép nhiều nhân viên sửa cùng một sản phẩm. Không có khoá: nhân viên A sửa giá, nhân viên B (mở form từ trước) sửa mô tả rồi lưu → **ghi đè giá cũ** lên giá A vừa sửa; 46 sản phẩm bán sai giá trong đợt khuyến mãi. Thêm {{@Version}}: lần lưu thứ hai nhận {{ObjectOptimisticLockingFailureException}} → API trả 409, giao diện báo "Sản phẩm đã được người khác cập nhật, tải lại?". Với API trừ tồn kho từ đơn hàng (hàng trăm request/giây vào cùng mã hot) thì optimistic gây retry liên tục, nên team dùng UPDATE có điều kiện ({{qty = qty - :n WHERE qty >= :n}}) cho phần đó. Quy tắc chốt: form người dùng → optimistic + 409; đếm/trừ số lượng nóng → câu lệnh nguyên tử; luồng ngắn cần chắc chắn thứ tự → {{PESSIMISTIC_WRITE}} có timeout.

### Trả lời mẫu khi phỏng vấn
"Optimistic locking giả định xung đột hiếm: entity có cột version, UPDATE kèm điều kiện version bằng giá trị đã đọc và tăng version; nếu không có dòng nào được cập nhật nghĩa là người khác đã sửa, Hibernate ném OptimisticLockException, Spring dịch thành ObjectOptimisticLockingFailureException. Không khoá gì trong DB nên đọc không bị chặn. Pessimistic locking thì khoá dòng ngay khi đọc bằng SELECT FOR UPDATE, người khác phải chờ, hợp khi xung đột thường xuyên và thao tác ngắn, cần lock timeout và thứ tự khoá để tránh deadlock. Xử lý OptimisticLockException tuỳ ngữ cảnh: với form người dùng, trả 409 và yêu cầu tải lại, kèm version gửi xuống client; với xử lý tự động, đọc lại và thử lại vài lần có backoff. Với tăng giảm số lượng trên dữ liệu rất nóng, tôi dùng UPDATE nguyên tử thay vì cả hai."

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

### Ví dụ đời thực
Một job import đơn hàng hàng ngày đọc file CSV 150.000 dòng, map thành entity {{Order}} và lưu bằng {{orderRepo.saveAll(list)}}. Entity dùng {{@GeneratedValue(strategy = GenerationType.IDENTITY)}} (MySQL auto_increment). Mặc dù đã cấu hình {{hibernate.jdbc.batch_size=50}}, log SQL cho thấy 150.000 câu {{INSERT}} riêng lẻ, job chạy 22 phút. Điều tra: bật {{spring.jpa.properties.hibernate.generate_statistics=true}} thấy batch size thực tế = 1; Hibernate log cảnh báo "Batching disabled for identity identifier". Nguyên nhân: IDENTITY bắt buộc Hibernate phải lấy generated key ngay sau mỗi INSERT → không gom batch được. Sửa: đổi sang {{TABLE}} generator (MySQL không có sequence) với {{allocationSize = 50}}, cấu hình {{hibernate.jdbc.batch_size=50}}, {{hibernate.order_inserts=true}}, {{hibernate.order_updates=true}}. Job chạy lại: 150.000 dòng chỉ mất 3,5 phút (tăng tốc 6,3x), số round-trip từ 150.000 xuống 3.000, CPU DB từ 80% xuống 25%.

### Trả lời mẫu khi phỏng vấn
"IDENTITY vô hiệu batching vì DB sinh id và Hibernate phải lấy generated key ngay sau mỗi INSERT → không gom được lệnh. Để batching hiệu quả, phải sinh id trước ở ứng dụng: PostgreSQL dùng SEQUENCE + pooled optimizer (allocationSize = 50), MySQL dùng TABLE generator. Cấu hình hibernate.jdbc.batch_size=50, order_inserts=true, order_updates=true, và flush/clear định kỳ mỗi 50–100 entity. Thực tế tôi import 150k dòng từ 22 phút xuống 3,5 phút chỉ bằng cách bỏ IDENTITY sang TABLE generator và bật batch size."

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

### Bên trong: Hibernate chỉ nhìn owning side
Khi flush, Hibernate sinh câu SQL cho khoá ngoại **dựa trên phía sở hữu** (phía có {{@JoinColumn}}, thường là {{@ManyToOne}}). Phía {{mappedBy}} ({{@OneToMany(mappedBy = "order")}}) chỉ là "gương" cho tiện đọc: thêm phần tử vào {{order.getItems()}} mà không gán {{item.setOrder(order)}} thì khoá ngoại **không được ghi** (cột order_id NULL hoặc giữ giá trị cũ). Vì vậy cần helper method đồng bộ hai phía ({{order.addItem(item)}} gán cả hai). {{orphanRemoval = true}}: phần tử bị gỡ khỏi collection thì bị **DELETE**; {{cascade = REMOVE}}: xoá cha thì xoá con. {{CascadeType.ALL}} trên {{@ManyToOne}} (con → cha) là cái bẫy: xoá một dòng con có thể xoá luôn cha và mọi con khác.

### Ví dụ đời thực
Màn hình sửa đơn hàng gửi lên danh sách dòng hàng mới; code viết {{order.setItems(newItems)}} (thay cả collection) trên quan hệ có {{orphanRemoval = true}}. Hibernate ném "A collection with cascade=all-delete-orphan was no longer referenced" ở một số request; ở bản sửa vội trước đó, dev bỏ orphanRemoval → các dòng hàng bị gỡ khỏi đơn vẫn nằm trong DB với order_id cũ, báo cáo doanh thu cộng cả những dòng đã xoá (lệch khoảng 1,5% trong 2 tuần). Sửa đúng: giữ orphanRemoval, cập nhật **trên chính collection** ({{items.clear(); items.addAll(...)}} hoặc so khớp theo id), dùng helper đồng bộ hai phía; thêm test kiểm tra số dòng trong DB sau khi sửa đơn.

### Trả lời mẫu khi phỏng vấn
"Trong quan hệ hai chiều, owning side là phía giữ khoá ngoại, thường là ManyToOne có JoinColumn; inverse side là phía mappedBy. Hibernate chỉ dựa vào owning side để ghi khoá ngoại, nên chỉ thêm vào collection của phía mappedBy mà không gán phía kia thì không có gì được ghi. Tôi luôn viết helper method đồng bộ cả hai phía. Cascade lan truyền thao tác như persist, remove từ cha sang con, hợp với quan hệ thành phần như đơn hàng và dòng hàng; orphanRemoval xoá con khi nó bị gỡ khỏi collection. Nguy hiểm là đặt cascade ALL hay REMOVE sai chiều, ví dụ trên ManyToOne từ con lên cha, có thể xoá dữ liệu dùng chung; và thay cả collection bằng setter trên quan hệ orphanRemoval gây lỗi, phải sửa trên chính collection đó."

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

### Ví dụ đời thực
Hệ thống thương mại điện tử có bảng {{Category}} (1.200 bản ghi, ít khi thay đổi) và {{Product}} (2 triệu bản ghi, cập nhật thường xuyên). Team bật L2 cho cả hai entity với Ehcache, dùng chung region factory mặc định. Vấn đề: khi cập nhật giá sản phẩm ({{Product}}), L2 invalidate cache {{Product}} nhưng do chung region, một số key {{Category}} cũng bị xóa ngẫu nhiên. Frontend gọi API danh mục liên tục, 15% request bị cache miss → query DB tăng 3x, latency p99 từ 12ms lên 180ms. Điều tra: log Ehcache thấy {{Category}} region bị evict khi {{Product}} update; statistics cache hit rate giảm từ 98% xuống 85%. Nguyên nhân: chung region làm invalidation lan sang entity không liên quan. Sửa: tách region riêng cho mỗi entity ({{region = "category"}}, {{region = "product"}}), {{Category}} dùng {{READ_ONLY}} strategy, {{Product}} dùng Spring Cache ({{@Cacheable}} ở service, TTL 5 phút, backend Caffeine) thay vì L2 vì dữ liệu thay đổi thường xuyên. Kết quả: cache hit rate {{Category}} 99,9%, {{Product}} 92%, latency p99 ổn định 15ms.

### Trả lời mẫu khi phỏng vấn
"First-level cache là persistence context, phạm vi transaction, luôn bật. Second-level cache là cache SessionFactory, chia sẻ giữa nhiều instance, phải bật cấu hình và gắn @Cacheable trên entity. Ngoài ra có Spring Cache (@Cacheable) ở tầng service – thường dễ dùng hơn L2 vì cache được DTO, dễ điều khiển TTL. L2 phù hợp dữ liệu đọc nhiều ghi ít, ít thay đổi, không bị hệ thống khác ghi (danh mục, cấu hình). Không dùng L2 cho dữ liệu nhạy cảm, thay đổi liên tục, hoặc bị ETL/script SQL ghi ra. Pitfall: L2 chung region gây invalidation lan, cache entity có lazy loading rò rỉ session. Tôi ưu tiên Spring Cache, chỉ bật L2 khi thật sự cần chia sẻ cache giữa nhiều instance app."

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

### Ví dụ đời thực
Báo cáo "doanh thu theo kênh theo ngày, có tỉ lệ so với cùng kỳ" viết bằng JPQL + xử lý trong Java: tải 1,2 triệu entity đơn hàng vào bộ nhớ để gom nhóm → 4 phút, heap 5GB. Viết lại bằng một câu SQL native dùng window function ({{SUM(...) OVER (PARTITION BY channel ORDER BY day)}}, {{LAG}}) map thẳng vào DTO record qua {{JdbcClient}} (Spring 6.1+): 1,8 giây. Nhưng cùng tuần, một job dùng {{JdbcTemplate}} cập nhật {{status}} đơn hàng trong khi một transaction JPA khác đang giữ các entity đó trong persistence context → entity "cũ" ghi đè lại trạng thái mới khi flush. Quy tắc team chốt: SQL thủ công cho đọc báo cáo và bulk; ghi vào bảng mà JPA đang quản lý thì qua JPA, hoặc làm trong transaction riêng và {{clear()}}/{{refresh()}} context, có {{@Version}} để phát hiện ghi đè.

### Trả lời mẫu khi phỏng vấn
"JPA rất tốt cho CRUD và nghiệp vụ trên từng aggregate, nhưng tôi rời JPA khi truy vấn là báo cáo phức tạp với window function, CTE, gom nhóm nhiều chiều, khi xử lý hàng loạt hàng trăm nghìn dòng, hoặc khi cần tính năng riêng của DB như ON CONFLICT hay JSONB. Lúc đó tôi dùng JdbcClient hay JdbcTemplate map thẳng vào DTO, hoặc jOOQ nếu muốn SQL kiểm tra kiểu lúc biên dịch. Rủi ro khi trộn là persistence context không biết dữ liệu đã bị SQL thủ công thay đổi: entity cũ trong bộ nhớ có thể ghi đè dữ liệu mới khi flush, và cache cấp hai trở nên lỗi thời. Nên tôi tách rõ: SQL thủ công cho đọc báo cáo và bulk, ghi vào bảng do JPA quản lý thì qua JPA hoặc trong transaction riêng có clear, kèm @Version để phát hiện ghi đè."

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

### Ví dụ đời thực
Entity {{Customer}} dùng Lombok {{@Data}} có quan hệ hai chiều với {{Address}}. Ba sự cố trong một tháng: (1) log {{customer.toString()}} gây {{StackOverflowError}} vì Customer in Address, Address in lại Customer; (2) {{toString}} trong log debug kích hoạt **lazy loading** hàng trăm query khi bật DEBUG trên production; (3) một {{HashSet<Customer>}} dùng để gom khách không trùng mất phần tử vì {{hashCode}} sinh từ mọi field (kể cả field thay đổi sau khi add). Sửa: bỏ {{@Data}} trên entity, chỉ dùng {{@Getter}}/{{@Setter}} cần thiết; {{equals}} theo id (khi khác null) hoặc business key, {{hashCode}} là hằng số theo class; {{toString}} tự viết chỉ in id; thêm ArchUnit rule cấm {{@Data}}/{{@EqualsAndHashCode}} trên class có {{@Entity}}.

### Trả lời mẫu khi phỏng vấn
"equals và hashCode của entity phải ổn định qua cả vòng đời, kể cả khi id được sinh lúc persist và khi đối tượng là proxy của Hibernate. Tôi dùng business key bất biến nếu có; nếu không thì equals so id khi id khác null, hashCode là hằng số theo class. Lombok @Data rất rủi ro trên entity: nó sinh equals và hashCode từ mọi field, gồm cả field thay đổi và quan hệ, nên phá vỡ HashSet và có thể kích hoạt lazy loading; toString in mọi field nên gây lazy loading hàng loạt hoặc StackOverflowError với quan hệ hai chiều. Trên entity tôi chỉ dùng Getter, Setter có chọn lọc, tự viết equals, hashCode, toString, và đặt ArchUnit rule để cấm @Data trên entity."

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

### Hiểu nhanh
Hãy tưởng tượng một cuốn sách 1000 trang không có mục lục: muốn tìm chữ "deadlock" bạn phải lật từng trang (full scan). Index giống **mục lục cuối sách**: các từ được xếp theo thứ tự chữ cái, mỗi từ ghi số trang, nên bạn mở đúng trang sau vài lần lật. B-tree là mục lục **nhiều tầng**: tầng trên chỉ ghi "A–F ở quyển 1, G–M ở quyển 2…", tầng dưới mới ghi chi tiết. Composite index giống danh bạ xếp theo **họ rồi tên**: tìm theo họ thì nhanh, chỉ biết tên thì phải lật cả cuốn. Covering index là khi mục lục ghi luôn cả nội dung bạn cần, khỏi phải lật vào trang sách.

### Thuật ngữ
- **Page (trang)**: đơn vị đọc/ghi đĩa của DB, 8KB ở PostgreSQL và 16KB ở InnoDB; mỗi node của cây là một page.
- **B+tree**: biến thể B-tree mà dữ liệu/pointer chỉ nằm ở lá, các lá nối với nhau để quét theo khoảng.
- **Fan-out**: số con của một node; page 8–16KB chứa hàng trăm key nên cây rất "thấp".
- **Clustered index**: index mà lá chứa chính dòng dữ liệu (InnoDB: theo PK); PostgreSQL không có, bảng là heap riêng.
- **Selectivity / cardinality**: tỉ lệ dòng mà điều kiện giữ lại / số giá trị khác nhau của cột; selectivity cao = lọc được ít dòng.
- **Index-only scan**: trả kết quả chỉ từ index, không đọc bảng (heap).
- **Seq scan**: quét tuần tự toàn bộ bảng.
- **Page split**: khi chèn vào page đã đầy, DB tách đôi page – tốn I/O và để lại page rỗng một nửa.

### Tìm một dòng qua B-tree, từng bước
~~~text
                [ root: ... | 5000 | 9000 | ... ]          <- tầng 1 (luôn nằm trong RAM)
                 /              |
      [ ... 4100 | 4500 ... ]  [ 5000 | 6200 ... ]          <- tầng 2 (branch)
              |                      |
  [4500 4501 4502 ...] <-> [4600 4601 ...] <-> ...           <- lá: key + TID/PK, nối hai chiều
~~~
1. **Đọc root**: so sánh key cần tìm (ví dụ 4501) với các mốc trong root để biết đi xuống nhánh nào. Vì sao nhanh: root gần như luôn nằm sẵn trong buffer cache.
2. **Đi xuống branch**: lặp lại phép so sánh ở mỗi tầng. Vì sao ít tầng: mỗi page chứa vài trăm mốc, nên 3 tầng đã đủ cho ~ 500 × 500 × 500 ≈ 125 triệu key, 4 tầng cho hàng chục tỉ.
3. **Tới lá**: lấy được TID (PostgreSQL) hoặc PK (InnoDB secondary). Với range ({{BETWEEN}}), DB đi tiếp sang lá kế bên nhờ danh sách nối, không phải quay lại root.
4. **Đọc dòng thật**: PostgreSQL nhảy vào heap theo TID; InnoDB tra clustered index theo PK. Vì sao covering index có lợi: bỏ được chính bước này.
5. **Khi ghi**: {{INSERT}} phải chèn key vào đúng lá của **mọi** index; lá đầy thì page split. Đó là cái giá bạn trả cho đọc nhanh.

So sánh số liệu: bảng 100 triệu dòng, full scan đọc khoảng 1–2 triệu page; tìm qua index chỉ đọc 4–5 page.

### Cấu trúc B-tree
Các node lá chứa key + "đường dẫn" tới hàng, được liên kết thành **danh sách nối** theo thứ tự key. Cụ thể: ở **PostgreSQL**, lá chứa key + **TID** (số trang, vị trí trong trang của heap); ở **InnoDB**, bảng chính là **clustered index** (lá chứa **cả dòng dữ liệu**, sắp theo PK), còn **secondary index** chứa key + **giá trị PK** – đọc dòng đầy đủ phải tra thêm một lần vào clustered index. Nhờ vậy cả truy vấn **range** ({{WHERE ts BETWEEN ...}}) cũng hiệu quả. B-tree giữ node lá ở cùng độ sâu, tối ưu cho đĩa (ít lần đọc block) – đây là lý do MySQL/InnoDB dùng B+tree thay vì B-tree "chuẩn".

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

### Lỗi hay gặp
- **Index (b, a) trong khi query lọc theo a**: triệu chứng – EXPLAIN vẫn Seq Scan dù "đã có index". Cách tránh: đặt cột lọc bằng (=) lên đầu, cột range/sort sau, kiểm tra lại bằng EXPLAIN.
- **Bọc cột trong hàm hoặc ép kiểu ngầm**: {{WHERE lower(email) = ?}} hay so {{varchar}} với số. Triệu chứng – query chậm đột ngột sau khi "chỉ sửa một chút". Cách tránh: viết lại thành điều kiện trên cột gốc hoặc tạo expression index ({{CREATE INDEX ... ON users (lower(email))}}).
- **Thêm index cho mọi cột "cho chắc"**: triệu chứng – INSERT/UPDATE chậm dần, bảng index to hơn cả bảng. Cách tránh: dùng {{pg_stat_user_indexes}} (cột {{idx_scan}} = 0) hoặc {{sys.schema_unused_indexes}} của MySQL để tìm và xoá index không dùng.
- **PK là UUIDv4 ngẫu nhiên trên InnoDB**: triệu chứng – ghi chậm, page split nhiều, buffer pool đầy nhanh. Cách tránh: dùng khoá tăng dần (BIGINT sequence) hoặc UUIDv7 có thứ tự theo thời gian.

### Ví dụ đời thực
Một bảng {{orders}} 80 triệu dòng (PostgreSQL 15) có index {{idx_orders_cust_date (customer_id, created_at)}}. API lịch sử đơn hàng của khách lọc {{WHERE customer_id = ? AND created_at >= '2026-01-01'}} chạy 1,2 giây. EXPLAIN ANALYZE cho thấy Index Scan dùng cả hai cột, nhưng phải đọc 45.000 dòng từ heap vì select {{*}} (không phải covering index). Team thêm {{INCLUDE (status, total_amount)}} vào index để thành covering index cho query này. Lần chạy sau: 45ms (giảm 27x), index-only scan không đọc heap, I/O giảm 98%. Đồng thời, một query khác {{WHERE DATE(created_at) = '2026-06-15'}} (bọc hàm DATE) không dùng index, Seq Scan mất 8 giây. Viết lại thành range {{created_at >= '2026-06-15' AND created_at < '2026-06-16'}} → Index Scan 12ms. Kết quả: p95 API lịch sử từ 1,2s xuống 50ms, CPU DB giảm 40%.

### Trả lời miệng 1 phút
"Index B-tree giống mục lục nhiều tầng: các key được sắp xếp, mỗi node là một page nên cây chỉ cao 3–4 tầng, tìm một dòng trong hàng trăm triệu dòng chỉ tốn vài lần đọc page thay vì quét cả bảng. Lá được nối với nhau nên range query và ORDER BY cũng tận dụng được. Composite index tuân theo leftmost prefix: index (a, b, c) dùng tốt cho điều kiện trên a hoặc a, b, còn chỉ lọc b thì thường không dùng được. Covering index chứa đủ cột cho query nên DB không phải quay lại bảng. Cái giá là ghi chậm hơn và tốn disk, nên tôi chỉ thêm index khi EXPLAIN chứng minh nó được dùng. Lỗi tôi gặp nhiều nhất là bọc cột trong hàm, ví dụ DATE(created_at), làm index bị bỏ qua – viết lại thành range là hết."

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

### Hiểu nhanh
Tưởng tượng một bảng tính Excel dùng chung cho cả phòng. **Dirty read** là bạn nhìn thấy con số đồng nghiệp đang gõ dở, rồi họ bấm Undo. **Non-repeatable read** là bạn đọc ô A1 hai lần, ở giữa có người sửa và lưu, nên hai lần thấy hai giá trị. **Phantom** là bạn đếm "các dòng có trạng thái MỚI" được 5, lát sau đếm lại thành 6 vì có người thêm dòng. Isolation level là "luật" quyết định bạn được nhìn thấy những thay đổi nào. MVCC là cách DB thực thi luật đó mà không bắt mọi người xếp hàng: mỗi người được một **ảnh chụp** bảng tính tại một thời điểm.

### Thuật ngữ
- **Transaction**: nhóm thao tác hoặc thành công hết (commit) hoặc huỷ hết (rollback).
- **Isolation level**: mức độ một transaction bị "che" khỏi thay đổi của transaction khác đang chạy song song.
- **MVCC (Multi-Version Concurrency Control)**: giữ nhiều phiên bản của một dòng để người đọc thấy bản cũ nhất quán trong khi người ghi tạo bản mới.
- **Snapshot / read view**: danh sách "transaction nào đã commit tại thời điểm chụp", dùng để quyết định phiên bản nào nhìn thấy được.
- **xmin / xmax**: hai cột ẩn của mỗi dòng trong PostgreSQL – id transaction đã tạo và đã xoá/thay thế phiên bản đó.
- **Undo log**: nơi InnoDB lưu giá trị cũ của dòng để rollback và để dựng lại phiên bản cũ cho người đọc.
- **Gap lock / next-key lock**: khoá InnoDB đặt lên "khoảng trống" giữa các key trong index để chặn insert dòng mới vào khoảng đó.
- **Write skew**: hai transaction đọc cùng dữ liệu, mỗi bên sửa một dòng khác nhau, kết hợp lại vi phạm ràng buộc nghiệp vụ.

### MVCC chạy thế nào, từng bước
~~~text
Thời gian ->  t1              t2                     t3
Tx A:         BEGIN; SELECT balance (=100)           SELECT balance (= ?)
Tx B:                         UPDATE balance=50; COMMIT
READ COMMITTED      : lần 2 thấy 50  (snapshot mới cho mỗi statement)
REPEATABLE READ     : lần 2 thấy 100 (giữ snapshot từ statement đầu)
~~~
1. **Ghi tạo phiên bản mới, không ghi đè**: PostgreSQL chèn một tuple mới (xmin = id Tx B) và đánh dấu tuple cũ xmax = id Tx B; InnoDB ghi đè dòng trong page nhưng đẩy giá trị cũ vào undo log, dòng mới mang {{DB_TRX_ID}} và con trỏ tới bản cũ. Vì sao: người đọc cũ vẫn cần thấy bản trước.
2. **Đọc lấy snapshot**: transaction ghi nhận danh sách transaction đang chạy tại thời điểm chụp. Vì sao: mọi thay đổi của transaction chưa commit tại lúc chụp đều phải vô hình.
3. **Chọn phiên bản nhìn thấy được**: DB đi theo chuỗi phiên bản (PostgreSQL: so xmin/xmax với snapshot; InnoDB: lần ngược undo log) tới bản mới nhất mà snapshot cho phép.
4. **Dọn rác**: bản cũ không còn ai cần được dọn – PostgreSQL bằng **VACUUM**, InnoDB bằng **purge thread** xoá undo. Vì sao transaction dài nguy hiểm: nó giữ snapshot cũ nên rác không dọn được, bảng/undo phình to.

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

### Lỗi hay gặp
- **Tưởng REPEATABLE READ của InnoDB bảo vệ read-modify-write**: {{SELECT}} thường đọc snapshot cũ, nhưng {{UPDATE}}/{{SELECT ... FOR UPDATE}} là **current read** – đọc bản commit mới nhất và khoá nó. Triệu chứng – số dư tính từ giá trị cũ ghi đè lên giá trị mới (lost update). Cách tránh: {{UPDATE ... SET balance = balance - ?}} nguyên tử, hoặc {{FOR UPDATE}} ngay từ lần đọc, hoặc optimistic lock với cột {{version}}.
- **Viết code giả định PostgreSQL REPEATABLE READ chạy giống MySQL**: PostgreSQL ném lỗi {{40001}} khi hai bên cùng sửa một dòng, còn InnoDB thì chờ khoá rồi ghi tiếp. Triệu chứng – lỗi serialization "lạ" sau khi đổi DB. Cách tránh: có retry cho class 40.
- **Write skew trong bài toán "ít nhất một bác sĩ trực"**: hai transaction cùng thấy còn 2 người trực, mỗi bên rút một người, kết quả 0 người. Cách tránh: SERIALIZABLE, hoặc khoá tường minh các dòng liên quan bằng {{FOR UPDATE}}, hoặc ràng buộc ở tầng DB.
- **Transaction mở hàng giờ (quên commit, batch dài)**: triệu chứng – PostgreSQL bloat, InnoDB "History list length" tăng vọt, query chậm dần. Cách tránh: đặt {{idle_in_transaction_session_timeout}}, chia batch nhỏ.

### Ví dụ đời thực
**Triệu chứng:** Dịch vụ ví điện tử chạy PostgreSQL 14 (mặc định {{READ COMMITTED}}) ghi nhận trung bình 2–3 ca số dư âm mỗi ngày trên tài khoản khách, dù logic ứng dụng luôn kiểm tra {{balance >= amount}} trước khi trừ. Lưu lượng giờ cao điểm ~1.200 giao dịch rút/giây, cùng tài khoản hiếm khi bị trùng nhưng vẫn xảy ra.

**Điều tra:** Bật {{pg_stat_statements}} và log các transaction có {{rows_affected}} bất thường; tái hiện bằng hai phiên {{psql}} chạy song song: cả hai {{SELECT balance}} thấy 100.000đ, mỗi bên trừ 80.000đ rồi {{UPDATE balance}} thành 20.000đ. Query thực tế chỉ làm {{SELECT}} rồi {{UPDATE ... SET balance = ?}} (ghi đè bằng giá trị tính ở ứng dụng) nên lần ghi sau ghi đè lên lần ghi trước (lost update), không phải cộng dồn.

**Nguyên nhân gốc:** Pattern đọc-sửa-ghi tách rời ở mức {{READ COMMITTED}}: mỗi transaction tính số dư mới từ snapshot riêng, transaction commit sau thắng mà không biết bên kia đã trừ.

**Cách xử lý:** Đổi sang cập nhật nguyên tử {{UPDATE account SET balance = balance - :amount WHERE id = :id AND balance >= :amount}} và kiểm tra số dòng cập nhật; với luồng cần đọc nhiều bước rồi quyết định, dùng {{SELECT ... FOR UPDATE}} để khoá dòng. Thêm ràng buộc {{CHECK (balance >= 0)}} làm lưới an toàn cuối.

**Kết quả đo được:** Sau deploy, ca số dư âm giảm về 0 trong 30 ngày theo dõi; p95 thời gian giao dịch rút tăng không đáng kể (~1ms) do khoá chỉ giữ trong transaction ngắn.

### Trả lời miệng 1 phút
"Chuẩn SQL có bốn mức isolation, mỗi mức chặn thêm một hiện tượng: READ COMMITTED chặn dirty read, REPEATABLE READ chặn thêm non-repeatable read, SERIALIZABLE chặn cả phantom và các bất thường khác. Cả PostgreSQL và InnoDB đều dùng MVCC: ghi tạo phiên bản mới, đọc nhìn một snapshot nên đọc không chặn ghi. Khác biệt chính là PostgreSQL mặc định READ COMMITTED, snapshot mới cho mỗi câu lệnh, và REPEATABLE READ của nó chặn cả phantom nhưng vẫn có write skew; InnoDB mặc định REPEATABLE READ, giữ read view cả transaction, chặn phantom khi ghi bằng gap lock nên dễ deadlock hơn. Trade-off là mức càng cao càng nhiều conflict và retry. Kinh nghiệm của tôi là đặt isolation tường minh, dùng update nguyên tử hoặc khoá cho read-modify-write, và luôn có retry cho lỗi serialization."

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

### Hiểu nhanh
Execution plan giống **lộ trình Google Maps** mà DB vạch ra trước khi đi: đi đường cao tốc (index) hay đường làng (quét bảng), rẽ ở đâu (join), có phải dừng xếp hàng (sort) không. {{EXPLAIN}} chỉ cho bạn xem lộ trình dự kiến; {{EXPLAIN ANALYZE}} thật sự lái xe và ghi lại mỗi đoạn mất bao lâu. Nếu Maps ước tính "đoạn này 2 phút" mà thực tế mất 40 phút, nghĩa là bản đồ (thống kê) đã cũ – đó chính là dấu hiệu "estimated rows lệch actual rows". Tối ưu query là tìm đoạn đường kẹt nhất rồi sửa đúng chỗ đó.

### Thuật ngữ
- **Execution plan**: cây các bước (node) DB dùng để chạy câu SQL; node con chạy trước, đưa kết quả lên node cha.
- **Optimizer (planner)**: thành phần chọn plan rẻ nhất dựa trên **cost** ước tính.
- **Statistics**: số liệu mẫu về bảng (số dòng, phân bố giá trị) mà optimizer dùng để ước tính; cập nhật bằng {{ANALYZE}}.
- **Seq Scan / Index Scan / Bitmap Heap Scan**: quét cả bảng / đi qua index lấy từng dòng / gom vị trí từ index rồi đọc bảng theo lô.
- **Nested Loop / Hash Join / Merge Join**: ba cách join – lặp lồng nhau, dựng bảng băm, trộn hai dãy đã sắp xếp.
- **Buffers shared hit / read**: số page lấy từ cache / phải đọc từ đĩa (hoặc OS cache).
- **work_mem**: bộ nhớ mỗi thao tác sort/hash được dùng trước khi phải tràn ra đĩa.
- **Plan regression**: query đang nhanh bỗng chậm vì optimizer đổi sang plan tệ hơn.

### Đọc một plan cụ thể
~~~text
Nested Loop  (cost=0.43..9120.5 rows=12 width=48) (actual time=0.05..842.1 rows=48210 loops=1)
  -> Seq Scan on orders o  (rows=12) (actual rows=48210 loops=1)
       Filter: (status = 'NEW')   Rows Removed by Filter: 1951790
  -> Index Scan using customers_pkey on customers c (actual time=0.01..0.01 rows=1 loops=48210)
Buffers: shared hit=150321 read=22012
~~~
1. **Đọc từ trong ra ngoài, từ dưới lên**: node thụt sâu nhất chạy trước. Vì sao: node cha chỉ nhận dòng do con trả về.
2. **So estimated với actual**: ước 12 dòng, thực tế 48210 – lệch 4000 lần. Vì sao quan trọng: vì tưởng chỉ 12 dòng nên optimizer chọn Nested Loop; với 48 nghìn dòng, Hash Join mới hợp lý.
3. **Nhân thời gian với loops**: inner index scan 0.01ms nhưng chạy 48210 lần ≈ 480ms. Vì sao: con số "actual time" là **mỗi lần lặp**.
4. **Nhìn Rows Removed by Filter**: bỏ 1,95 triệu dòng để giữ 48 nghìn – thiếu index trên {{status}} (hoặc index composite phù hợp).
5. **Nhìn Buffers**: {{read=22012}} page ≈ 172MB đọc từ đĩa – giải thích vì sao lần chạy đầu chậm hơn lần sau.
6. **Sửa và đo lại**: chạy {{ANALYZE orders}}, thêm index phù hợp, rồi so thời gian trước/sau.

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
- Kiểm tra **parameter sniffing**: plan tốt với một bộ tham số có thể rất tệ với bộ khác (PostgreSQL với prepared statement: 5 lần đầu lập **custom plan** theo giá trị cụ thể, từ lần thứ 6 có thể chuyển sang **generic plan** nếu ước tính không đắt hơn – chỉnh bằng {{plan_cache_mode}}; MySQL không cache plan theo cách này mà tối ưu lại mỗi lần chạy, nhưng plan vẫn thay đổi theo giá trị tham số và thống kê).
- Với truy vấn chạy theo lịch, hãy lưu lại plan theo thời gian để phát hiện **plan regression** sau khi deploy.

### Lỗi hay gặp
- **Chỉ chạy EXPLAIN (không ANALYZE)**: triệu chứng – plan trông ổn nhưng query vẫn chậm, vì bạn chỉ thấy ước tính. Cách tránh: dùng {{EXPLAIN (ANALYZE, BUFFERS)}} trên môi trường có dữ liệu giống production.
- **Đo trên dữ liệu dev 1000 dòng**: optimizer chọn plan hoàn toàn khác so với production 50 triệu dòng. Cách tránh: test trên bản sao dữ liệu đã ẩn danh, hoặc ít nhất có cùng phân bố.
- **Đo một lần rồi kết luận**: lần đầu đọc đĩa (cold cache), lần sau đọc RAM. Cách tránh: chạy vài lần, so cả cột Buffers hit/read.
- **Thêm index nhưng query vẫn bọc cột trong hàm**: index không được dùng. Cách tránh: đọc lại plan sau khi sửa, đừng giả định.

### Ví dụ đời thực
**Triệu chứng:** API danh sách đơn hàng {{GET /orders?status=NEW}} trên PostgreSQL 14, bảng {{orders}} ~12 triệu dòng, bắt đầu vượt SLA 500ms vào giờ cao điểm; p95 tăng từ 80ms lên 2,4s sau khi traffic gấp đôi, trong khi CPU DB chỉ ~35%.

**Điều tra:** Kiểm tra {{pg_stat_statements}} thấy query này chiếm ~40% tổng thời gian DB. Chạy {{EXPLAIN (ANALYZE, BUFFERS)}} trên bản sao dữ liệu production: node gốc là {{Nested Loop}} với {{Seq Scan on orders}} ước lượng 12 dòng nhưng thực tế trả 48.210 dòng ({{Rows Removed by Filter}} ~1,95 triệu), inner {{Index Scan}} lặp 48.210 lần, tổng {{Buffers: shared read=22012}}.

**Nguyên nhân gốc:** Thống kê cột {{status}} lỗi thời sau đợt import lớn nên optimizer đánh giá thấp số dòng {{NEW}} và chọn {{Nested Loop}} sai; đồng thời thiếu index phù hợp cho điều kiện lọc nên phải quét và loại bỏ rất nhiều dòng.

**Cách xử lý:** Chạy {{ANALYZE orders}} để cập nhật thống kê, tạo index {{(status, created_at)}} khớp truy vấn phổ biến, kiểm tra lại plan thấy chuyển sang {{Index Scan}}/join hợp lý hơn và giảm số vòng lặp.

**Kết quả đo được:** Trên cùng dữ liệu, thời gian query giảm từ ~2,4s xuống ~35ms, {{shared read}} giảm mạnh nhờ đọc đúng vùng index; p95 API ổn định dưới 120ms ở tải cao điểm.

### Trả lời miệng 1 phút
"EXPLAIN cho tôi plan dự kiến, còn EXPLAIN ANALYZE chạy thật và cho thời gian, số dòng thực tế của từng node. Quy trình của tôi: đo baseline, đọc plan từ node trong cùng ra, tìm node tốn thời gian nhất – nhớ nhân với số loops – rồi giải thích vì sao nó chậm: thiếu index, thống kê cũ, join sai kiểu, hay sort tràn đĩa. Dấu hiệu quan trọng nhất là estimated rows lệch xa actual rows, vì khi đó optimizer chọn sai thuật toán join. Sửa xong tôi đo lại để chắc chắn. Lưu ý thực tế: EXPLAIN ANALYZE với UPDATE sẽ thật sự ghi dữ liệu nên phải bọc trong BEGIN và ROLLBACK, và tôi dùng pg_stat_statements để tìm query tốn nhất tổng thể chứ không chỉ query chậm nhất một lần."

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

### Hiểu nhanh
Hai xe gặp nhau trên một cây cầu hẹp chỉ đủ một làn: xe A đã lên nửa cầu bên trái và chờ xe B lùi, xe B đã lên nửa bên phải và chờ xe A lùi – không ai đi được. Đó là deadlock. DB đóng vai cảnh sát giao thông: phát hiện hai xe chờ nhau thành vòng tròn, rồi bắt một xe (victim) quay đầu (rollback) để xe kia đi. Xe bị bắt quay đầu chỉ cần chạy lại từ đầu là qua được. Cách phòng tốt nhất là luật "mọi xe đi theo cùng một chiều" – tức là khoá tài nguyên theo cùng thứ tự.

### Thuật ngữ
- **Row lock**: khoá trên một dòng, {{UPDATE}}/{{DELETE}}/{{SELECT ... FOR UPDATE}} tự đặt và giữ đến khi commit/rollback.
- **Wait-for graph**: đồ thị "transaction nào đang chờ transaction nào"; có vòng tròn nghĩa là deadlock.
- **Victim**: transaction bị DB chọn để rollback (InnoDB chọn transaction "nhỏ" hơn – ít dòng bị sửa/khoá hơn).
- **deadlock_timeout**: (PostgreSQL) thời gian chờ khoá trước khi chạy kiểm tra deadlock, mặc định 1s.
- **innodb_lock_wait_timeout**: (MySQL) thời gian tối đa chờ một row lock, mặc định 50s – khác với deadlock.
- **SQLSTATE**: mã lỗi chuẩn 5 ký tự; class {{40}} nghĩa là transaction đã bị rollback.
- **Jitter**: thêm độ trễ ngẫu nhiên vào thời gian chờ retry để các client không retry cùng lúc.

### Deadlock diễn ra từng bước
~~~text
Tx1: UPDATE account SET .. WHERE id=1   -- giữ lock dòng 1
Tx2: UPDATE account SET .. WHERE id=2   -- giữ lock dòng 2
Tx1: UPDATE account SET .. WHERE id=2   -- CHỜ Tx2
Tx2: UPDATE account SET .. WHERE id=1   -- CHỜ Tx1  => vòng tròn
      Tx1 ---chờ---> Tx2
       ^              |
       +-----chờ------+
DB: chọn Tx2 làm victim -> ROLLBACK Tx2 (lỗi 40P01 / 1213), Tx1 chạy tiếp
~~~
1. **Mỗi transaction lấy khoá dần dần** trong lúc chạy, không lấy hết từ đầu. Vì sao: DB không biết trước bạn sẽ đụng dòng nào.
2. **Khoá giữ tới cuối transaction**. Vì sao: để rollback được và để người khác không thấy/sửa dữ liệu dở dang.
3. **Khi phải chờ**, DB ghi nhận một cạnh trong wait-for graph. InnoDB kiểm tra vòng ngay; PostgreSQL đợi {{deadlock_timeout}} rồi mới kiểm tra (vì đa số lần chờ tự hết, kiểm tra ngay thì tốn CPU).
4. **Phát hiện vòng** → chọn victim, rollback toàn bộ transaction đó, trả lỗi cho client. Vì sao rollback cả transaction: khoá của nó cần được nhả hết để phá vòng.
5. **Client retry** bằng transaction mới; lúc này Tx1 đã xong nên lần chạy lại thường thành công.

Trong ví dụ chuyển tiền: nếu cả hai luồng luôn khoá id nhỏ trước (như đoạn code dưới), Tx2 sẽ chờ ở bước khoá dòng 1 ngay từ đầu – chỉ chờ, không có vòng.

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

### Lỗi hay gặp
- **Dùng {{@Retryable}} trên cùng method {{@Transactional}} nhưng thứ tự proxy sai**: retry chạy **bên trong** transaction đã hỏng. Triệu chứng – retry luôn thất bại. Cách tránh: đặt retry ở lớp gọi bên ngoài (một bean khác), mỗi lần retry mở transaction mới.
- **Nhầm lock wait timeout với deadlock**: MySQL lỗi 1205 (chờ quá 50s) không phải deadlock – nghĩa là có transaction giữ khoá quá lâu. Cách tránh: tìm transaction dài trong {{information_schema.innodb_trx}} / {{pg_stat_activity}}.
- **Foreign key không có index**: xoá dòng cha khiến DB quét và khoá bảng con rộng hơn cần thiết. Cách tránh: luôn index cột FK (PostgreSQL không tự tạo).
- **Batch update không sắp xếp**: hai job cùng cập nhật danh sách id theo thứ tự khác nhau. Cách tránh: sort id trước khi update.

### Ví dụ đời thực
**Triệu chứng:** Ứng dụng chuyển tiền nội bộ trên MySQL 8.0 (InnoDB) ghi log lỗi {{Deadlock found when trying to get lock; try restarting transaction}} (1213) khoảng 30–50 lần/giờ, tăng lên ~300 lần/giờ vào khung 18h–20h. Tỉ lệ giao dịch thất bại sau 1 lần thử ~0,4%, một số yêu cầu của người dùng phải bấm lại.

**Điều tra:** Bật {{innodb_print_all_deadlocks}} tạm thời và xem {{SHOW ENGINE INNODB STATUS}} (mục LATEST DETECTED DEADLOCK). Log cho thấy Tx1 cập nhật {{account}} id=101 rồi id=205, trong khi Tx2 cập nhật id=205 rồi id=101; cả hai đến từ API chuyển tiền hai chiều gần như đồng thời.

**Nguyên nhân gốc:** Hai luồng khoá hai dòng tài khoản theo **thứ tự khác nhau** (theo tham số {{from}}, {{to}} của request) tạo vòng chờ. Transaction đủ ngắn nhưng thứ tự khoá không ổn định.

**Cách xử lý:** Chuẩn hoá thứ tự khoá trong code: luôn khoá {{min(from,to)}} trước rồi {{max(from,to)}} bằng {{SELECT ... FOR UPDATE}}; giữ transaction chỉ gồm các bước DB. Thêm retry với backoff + jitter (tối đa 3 lần) ở tầng service bên ngoài {{@Transactional}} để xử lý các tranh chấp hiếm còn lại.

**Kết quả đo được:** Sau deploy, deadlock giảm xuống 0–3 lần/giờ (chủ yếu từ luồng batch khác, được xử lý tiếp), tỉ lệ yêu cầu phải thử lại thủ công về ~0%, p95 API chuyển tiền không đổi đáng kể.

### Trả lời miệng 1 phút
"Deadlock là khi hai transaction giữ khoá mà bên kia cần, tạo thành vòng chờ. DB phát hiện vòng đó – InnoDB kiểm tra ngay, PostgreSQL sau deadlock_timeout một giây – rồi rollback một transaction làm victim, client nhận lỗi 40P01 hoặc MySQL 1213. Cách xử lý của tôi có hai lớp: phòng ngừa bằng việc khoá theo thứ tự cố định, giữ transaction ngắn, có index cho mọi điều kiện ghi; và chịu lỗi bằng retry với transaction mới, có backoff và jitter. Trên production tôi đọc server log của PostgreSQL hoặc SHOW ENGINE INNODB STATUS để biết hai câu query nào tham gia, rồi sửa thứ tự khoá. Tôi theo dõi tỉ lệ deadlock theo thời gian: tăng đột biến sau deploy thường là dấu hiệu thay đổi code gây ra."

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

### Hiểu nhanh
Đọc sách bằng OFFSET giống như mỗi lần muốn đọc trang 500, bạn phải **lật từ trang 1 và đếm** tới 500 – càng về cuối càng mệt. Keyset giống **kẹp bookmark**: lần sau mở sách, bạn mở ngay chỗ kẹp và đọc tiếp. "Bookmark" ở đây là giá trị cột sắp xếp của dòng cuối trang trước (ví dụ {{created_at}} + {{id}}). Nhờ index đã sắp xếp sẵn, DB nhảy thẳng tới vị trí bookmark rồi đọc tiếp 20 dòng.

### Thuật ngữ
- **OFFSET / LIMIT**: bỏ qua n dòng đầu / chỉ lấy tối đa k dòng.
- **Keyset (seek) pagination**: lọc "các dòng đứng sau dòng cuối đã thấy" theo thứ tự sort, thay vì đếm vị trí.
- **Cursor**: giá trị đánh dấu vị trí (vd {{created_at}} + {{id}} của dòng cuối), thường mã hoá base64 gửi cho client.
- **Tie-breaker**: cột duy nhất thêm vào cuối ORDER BY để thứ tự luôn xác định khi cột sort bị trùng.
- **Row value comparison**: so sánh bộ {{(a, b) < (x, y)}} theo thứ tự từ điển; PostgreSQL và MySQL 8 đều hỗ trợ cú pháp này.
- **Index range scan**: đi theo index từ một điểm bắt đầu và đọc tuần tự các lá kế tiếp.

### Vì sao OFFSET chậm dần, từng bước
~~~text
OFFSET 100000 LIMIT 20:
index: [1][2][3]......[100000][100001..100020]
        ^---- đọc rồi BỎ 100000 dòng ----^  ^-- trả 20 dòng
Keyset WHERE id < 100000 LIMIT 20 (sort id desc):
index:                     [99999..99980]
                            ^-- nhảy thẳng tới đây qua B-tree, đọc 20 dòng
~~~
1. **OFFSET không có "địa chỉ"**: DB không biết dòng thứ 100000 nằm ở đâu, phải đếm từ đầu. Vì sao: B-tree biết vị trí theo **giá trị key**, không theo số thứ tự dòng.
2. **Mỗi dòng bị bỏ vẫn tốn công**: đọc page, kiểm tra điều kiện, (thường) đọc cả dòng từ bảng. Số liệu điển hình: trang 1 mất 2ms, trang 5000 mất 1–3 giây.
3. **Keyset biến bài toán thành tìm theo giá trị**: {{WHERE (created_at, id) < (:t, :id)}} là điều kiện mà B-tree trả lời bằng một lần đi từ root xuống lá (vài page).
4. **Đọc tiếp 20 lá kế bên** theo danh sách nối rồi dừng nhờ {{LIMIT}}. Vì sao thời gian gần như hằng: số page đọc không phụ thuộc trang thứ mấy.
5. **Bonus về tính đúng**: với OFFSET, nếu có dòng mới chèn vào đầu trong lúc người dùng lướt, trang sau sẽ lặp lại dòng cũ; keyset không bị vì nó bám theo giá trị.

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

### Lỗi hay gặp
- **Không có tie-breaker**: nhiều đơn hàng cùng {{created_at}} (import theo lô). Triệu chứng – người dùng thấy trùng hoặc mất dòng ở ranh giới trang. Cách tránh: luôn {{ORDER BY created_at DESC, id DESC}} và cursor gồm cả hai.
- **Index không khớp hướng sort hoặc thiếu cột id**: triệu chứng – plan có thêm node Sort, chậm lại khi bảng lớn. Cách tránh: index {{(created_at, id)}} (B-tree đọc ngược được nên DESC/DESC vẫn dùng được; chỉ cần index riêng khi trộn chiều ASC/DESC).
- **Viết {{Page}} trong Spring Data cho keyset**: {{Page}} chạy thêm câu {{COUNT(*)}} mỗi lần – trên bảng lớn tốn ngang query chính. Cách tránh: trả về {{Slice}} hoặc {{List}}; Spring Data 3.1+ còn có {{Window}} + {{ScrollPosition}} hỗ trợ keyset sẵn.
- **Cột sort có NULL**: so sánh với NULL luôn không đúng nên dòng NULL biến mất. Cách tránh: cột sort NOT NULL hoặc xử lý NULLS FIRST/LAST tường minh.

### Ví dụ đời thực
**Triệu chứng:** Màn hình lịch sử giao dịch (infinite scroll) của ứng dụng ví dùng MySQL 8.0, bảng {{transactions}} ~18 triệu dòng. Trang đầu tải ~40ms, nhưng khi người dùng kéo sâu (tương đương offset ~200.000) thời gian phản hồi tăng lên 3–5s và DB CPU tăng vọt theo lưu lượng lướt; khiếu nại "app đứng" xuất hiện giờ cao điểm.

**Điều tra:** Chạy {{EXPLAIN ANALYZE}} cho query {{SELECT ... ORDER BY created_at DESC, id DESC LIMIT 20 OFFSET 200000}} thấy engine phải đọc và bỏ 200.020 dòng theo index rồi mới trả 20 dòng. {{pg_stat_statements}} tương đương (trên bản sao PostgreSQL dùng để so sánh) và slow query log MySQL đều cho thấy thời gian tăng tuyến tính theo offset; thêm câu {{COUNT(*)}} của {{Page}} tốn thêm ~400ms.

**Nguyên nhân gốc:** OFFSET buộc DB duyệt tuần tự qua phần đầu kết quả mỗi lần; càng sâu càng tốn. COUNT trên bảng lớn quét nhiều dữ liệu dù client chỉ cần "còn trang tiếp không".

**Cách xử lý:** Chuyển sang keyset pagination với điều kiện {{WHERE (created_at < :t) OR (created_at = :t AND id < :id)}} và index {{(created_at, id)}}, trả cursor mã hoá và dùng {{Slice}} thay vì {{Page}} để bỏ {{COUNT(*)}}. Màn admin nhỏ vẫn giữ OFFSET vì cần nhảy trang.

**Kết quả đo được:** Thời gian tải ổn định 25–45ms dù người dùng cuộn rất sâu; p99 API lịch sử giảm từ ~4,2s xuống ~60ms, CPU DB giảm rõ trong giờ cao điểm.

### Trả lời miệng 1 phút
"OFFSET bắt DB đọc rồi bỏ n dòng nên trang càng sâu càng chậm; keyset thì lưu giá trị sort của dòng cuối và hỏi 'các dòng sau giá trị này', nên DB đi thẳng tới đó qua index và thời gian gần như không đổi. Với bảng hàng triệu dòng tôi chọn keyset, ORDER BY created_at, id với id làm tie-breaker, có index khớp, cursor mã hoá trả cho client. Trade-off là không nhảy được tới trang N và khó đổi kiểu sort tuỳ ý, nên với màn hình admin nhỏ cần số trang tôi vẫn dùng OFFSET. Kinh nghiệm thực tế: chuyển API danh sách giao dịch sang keyset và bỏ COUNT(*) giảm p99 từ vài giây xuống vài chục mili giây."

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

### Hiểu nhanh
Hãy nghĩ về một thư viện. **Replication** là photo nguyên bộ sách ra nhiều phòng đọc: nhiều người đọc cùng lúc được, nhưng sách mới chỉ được nhập ở một quầy chính rồi mới chuyển sang các phòng. **Partitioning** là chia kệ sách trong **cùng một** phòng theo năm xuất bản: tìm sách năm 2025 thì chỉ ra kệ 2025, dọn sách cũ thì bê cả kệ đi. **Sharding** là mở nhiều **chi nhánh thư viện**, mỗi chi nhánh giữ một phần sách (ví dụ theo vần tên tác giả): tổng sức chứa và số quầy nhập sách tăng lên, nhưng muốn tìm "mọi sách về Java" phải hỏi tất cả chi nhánh.

### Thuật ngữ
- **Primary / replica**: node nhận ghi / bản sao chỉ đọc nhận thay đổi từ primary.
- **Replication lag**: độ trễ từ lúc primary commit tới lúc replica thấy thay đổi.
- **Partition pruning**: optimizer loại bỏ các partition chắc chắn không chứa dữ liệu khớp điều kiện.
- **Shard key**: cột dùng để quyết định một dòng nằm ở shard nào.
- **Scatter-gather (fan-out)**: gửi query tới mọi shard rồi gộp kết quả – chậm và tốn.
- **Hot shard**: một shard nhận tải lớn hơn hẳn các shard khác.
- **Resharding**: chia lại dữ liệu khi thêm/bớt shard.
- **Saga / 2PC**: chuỗi bước có bước bù khi lỗi / giao thức commit hai pha khoá mọi bên tới khi tất cả đồng ý.

### Ba kỹ thuật trong một hình
~~~text
Replication            Partitioning (1 instance)      Sharding (nhiều instance)
 [Primary] --WAL-->     orders                         router: hash(customer_id) % 3
   |   |   [Replica]     |- orders_2026_01             [DB0] cust 0,3,6..
  ghi  |                 |- orders_2026_02             [DB1] cust 1,4,7..
       +--> [Replica]    |- orders_2026_03             [DB2] cust 2,5,8..
~~~
### Một request đi qua hệ thống shard, từng bước
1. **Ứng dụng xác định shard key** trong request (vd {{customer_id = 42}}). Vì sao: không có key thì không biết gửi đi đâu, phải fan-out.
2. **Router tính shard**: dùng hash hoặc bảng tra (directory) ánh xạ key → shard. Vì sao hay dùng bảng tra/consistent hashing thay vì {{% N}} đơn giản: đổi N thì gần như mọi key đổi chỗ.
3. **Query chạy trên một shard** như một DB bình thường – index, transaction, join đều nguyên vẹn **trong** shard.
4. **Thao tác chạm nhiều shard** (chuyển tiền giữa hai khách ở hai shard) phải dùng Saga hoặc outbox, vì không còn một transaction chung.
5. **Báo cáo toàn cục** đọc từ kho phái sinh (data warehouse, Elasticsearch) được đổ dữ liệu qua CDC, không fan-out lên các shard đang phục vụ online.

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

### Lỗi hay gặp
- **Đọc từ replica ngay sau khi ghi**: người dùng vừa đổi tên, F5 thấy tên cũ. Cách tránh: đọc primary cho dữ liệu của chính user trong vài giây sau khi ghi, hoặc định tuyến theo transaction ({{@Transactional(readOnly = true)}} → replica, còn lại → primary) có cân nhắc.
- **Partition theo cột mà query không lọc tới**: triệu chứng – query quét **tất cả** partition, còn chậm hơn bảng thường. Cách tránh: mọi query nóng phải có điều kiện trên partition key; kiểm tra pruning bằng EXPLAIN.
- **Shard theo thời gian**: toàn bộ ghi hôm nay dồn vào một shard mới nhất (hot shard). Cách tránh: shard theo khoá phân tán đều (tenant, customer) và chỉ partition theo thời gian **bên trong** shard.
- **Quá nhiều partition nhỏ**: hàng nghìn partition làm planning chậm và tốn bộ nhớ. Cách tránh: giữ số partition vừa phải (vài chục đến vài trăm), chọn độ hạt theo tháng thay vì ngày nếu đủ.

### Ví dụ đời thực
**Triệu chứng:** Nền tảng SaaS B2B (PostgreSQL 14) dùng một primary + 2 replica, bảng {{events}} tăng ~120 triệu dòng/tháng. Sau 10 tháng, câu truy vấn báo cáo theo tenant chạy 40–90s, job xoá dữ liệu cũ bằng {{DELETE}} gây lock và IO spike; {{pg_stat_replication}} cho thấy replica lag tăng lên 8–15s giờ cao điểm, người dùng than "vừa tạo xong không thấy trong danh sách".

**Điều tra:** {{EXPLAIN (ANALYZE, BUFFERS)}} cho thấy quét gần như toàn bộ bảng sự kiện dù chỉ cần 30 ngày gần nhất; {{pg_stat_activity}} ghi nhận câu {{DELETE}} giữ transaction lâu. Ứng dụng định tuyến đọc theo {{@Transactional(readOnly=true)}} nên một số request đọc ngay sau ghi bị gửi sang replica đang trễ.

**Nguyên nhân gốc:** Bảng lớn đơn khối không partition theo thời gian nên không prune và không thể dọn nhanh; replication giải quyết đọc nhưng có lag; tải ghi và dung lượng tập trung một instance.

**Cách xử lý:** Chuyển {{events}} sang declarative partitioning theo tháng (range trên {{created_at}}) để prune và {{DROP}} partition cũ; áp dụng "read-your-writes" (đọc primary vài giây sau ghi cho chính user). Chuẩn bị kế hoạch shard theo {{tenant_id}} trong tương lai khi primary không chịu nổi ghi, nhưng chưa shard ngay.

**Kết quả đo được:** Báo cáo 30 ngày giảm còn 3–6s nhờ pruning; xoá dữ liệu cũ thành thao tác {{DROP PARTITION}} tức thì, lag replica giảm còn < 2s khi bớt IO nền.

### Trả lời miệng 1 phút
"Ba khái niệm giải quyết ba vấn đề khác nhau. Replication tạo bản sao để scale đọc và HA, mọi ghi vẫn đi qua một primary và có replication lag. Partitioning chia một bảng lớn thành nhiều phần trong cùng instance, lợi ích chính là partition pruning và xoá dữ liệu cũ bằng drop partition. Sharding chia dữ liệu ra nhiều DB độc lập nên scale được cả ghi, đổi lại mất transaction và join xuyên shard. Shard key tôi chọn theo truy vấn thực tế: phần lớn query phải chứa key, phân bố đều và không tạo hot shard – thường là tenant hoặc customer id. Kinh nghiệm của tôi là đi theo thứ tự tối ưu query, replica, partition, cache rồi mới shard, vì shard gần như không quay lại được."

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

### Hiểu nhanh
Connection pool giống **bãi xe taxi trước sân bay**: thay vì mỗi khách tự gọi một chiếc xe mới (mở connection tốn 20–100ms: TCP, TLS, xác thực), có sẵn 15 chiếc đậu chờ, khách tới lấy xe, đi xong trả lại bãi. Nếu cả 15 xe đều đang chạy, khách mới phải **xếp hàng** – chờ quá {{connection-timeout}} thì bỏ cuộc (lỗi). Nghe có vẻ cứ thêm xe là tốt, nhưng con đường dẫn ra thành phố (CPU, ổ đĩa của DB) chỉ có vài làn: 200 xe cùng chạy chỉ gây kẹt. Leak detection là camera ghi lại "xe nào ra bãi quá 60 giây chưa về và ai đã lấy nó".

### Thuật ngữ
- **Connection pool**: tập connection DB mở sẵn và được tái sử dụng giữa các request.
- **HikariCP**: thư viện pool JDBC mặc định của Spring Boot, nổi tiếng nhanh và gọn.
- **max_connections**: (PostgreSQL) số connection tối đa server chấp nhận; mỗi connection là một process tốn vài MB RAM.
- **Pending threads**: số thread đang chờ lấy connection – dấu hiệu pool không đủ hoặc connection bị giữ quá lâu.
- **Connection leak**: lấy connection mà không trả lại pool (hoặc giữ cực lâu).
- **Little's Law**: số việc đang xử lý = tốc độ đến × thời gian xử lý; dùng để ước số connection cần.
- **PgBouncer**: proxy đứng trước PostgreSQL, gom nhiều connection client vào ít connection thật.

### Đời sống của một connection, từng bước
~~~text
request -> getConnection() --có sẵn--> dùng ~5ms -> close() = TRẢ LẠI POOL
                 |
                 +--hết--> chờ (pending) ... quá 3000ms -> SQLTransientConnectionException
Hikari housekeeping: connection sống > max-lifetime -> đóng và tạo mới
                     bị mượn > leak-detection-threshold -> log WARN kèm stack trace
~~~
1. **Khởi động**: Hikari mở sẵn {{minimum-idle}} connection. Vì sao: request đầu tiên không phải trả phí mở kết nối.
2. **Mượn**: {{getConnection()}} lấy một connection rảnh; Spring làm việc này khi vào {{@Transactional}} hoặc khi Repository chạy query.
3. **Trả**: {{close()}} trên connection của pool **không đóng socket** mà trả về pool. Vì sao quên trả = leak: pool tưởng nó vẫn đang được dùng.
4. **Chờ khi hết**: thread bị block tới {{connection-timeout}}. Vì sao nên để ngắn (2–5s): fail nhanh tốt hơn để request treo 30s kéo theo cả hệ thống.
5. **Thay mới định kỳ**: quá {{max-lifetime}} thì connection được đóng khi rảnh và thay bằng cái mới. Vì sao: firewall/NAT/DB có thể cắt kết nối im lặng; Hikari khuyên đặt nhỏ hơn giới hạn đó vài chục giây.

**Ví dụ tính bằng Little's Law**: 400 request/s, mỗi request giữ connection trung bình 20ms ⇒ cần trung bình 400 × 0,02 = **8 connection** bận cùng lúc. Pool 15 là dư cho đỉnh tải; pool 100 chỉ thêm tranh chấp ở DB.

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

### Lỗi hay gặp
- **Bật {{spring.jpa.open-in-view}} (mặc định true)**: connection bị giữ suốt cả lúc render JSON/view. Triệu chứng – pool cạn dù query rất nhanh. Cách tránh: đặt {{spring.jpa.open-in-view=false}} và load đủ dữ liệu trong service.
- **Gọi API ngoài bên trong {{@Transactional}}**: API chậm 5s thì connection cũng bị giữ 5s. Triệu chứng – "Connection is not available, request timed out after 3000ms" khi đối tác chậm. Cách tránh: gọi API trước/sau transaction.
- **{{max-lifetime}} dài hơn timeout của firewall/DB**: triệu chứng – lỗi "connection reset" ngẫu nhiên sau giờ thấp điểm. Cách tránh: đặt max-lifetime ngắn hơn giới hạn hạ tầng (vd 30 phút so với 60 phút).
- **Autoscale 50 pod × pool 20 = 1000 connection** vào PostgreSQL {{max_connections=500}}: triệu chứng – "too many clients already" khi scale. Cách tránh: tính tổng ở số pod tối đa, dùng PgBouncer/RDS Proxy.

### Ví dụ đời thực
**Triệu chứng:** Dịch vụ đặt hàng Spring Boot 3 (HikariCP) trên PostgreSQL, 8 pod × {{maximum-pool-size=20}}. Giờ cao điểm xuất hiện lỗi hàng loạt {{SQLTransientConnectionException: Connection is not available, request timed out after 3000ms}}, p95 API tăng từ 120ms lên > 5s dù CPU DB chỉ ~40%.

**Điều tra:** Theo dõi metric {{hikaricp.connections.pending}} và {{hikaricp.connections.active}}: active chạm 20/20 liên tục trên nhiều pod, pending tăng. Bật {{leak-detection-threshold=60000}} thấy log "Apparent connection leak detected" trỏ vào method {{OrderService.createOrder}}; trong method này có {{@Transactional}} bao quanh cả lời gọi HTTP sang cổng thanh toán (timeout đối tác 8–10s khi nghẽn).

**Nguyên nhân gốc:** Connection DB bị giữ suốt thời gian chờ HTTP bên ngoài nên pool cạn dù query DB chỉ vài mili giây; connection-timeout 3s khiến request fail nhanh nhưng tích tụ lỗi.

**Cách xử lý:** Tách lời gọi HTTP ra khỏi transaction (gọi thanh toán trước, chỉ mở transaction để ghi kết quả), tắt {{spring.jpa.open-in-view=false}}, giữ {{connection-timeout=3000}} và xác nhận {{leak-detection-threshold}} trong production. Đánh giá lại sizing: 8 pod × 15 connection vẫn trong giới hạn {{max_connections}} của DB.

**Kết quả đo được:** Pending về 0 ổn định, lỗi timeout lấy connection biến mất; p95 API về ~150ms ở tải tương đương, active connections dao động 4–8 thay vì kẹt trần.

### Trả lời miệng 1 phút
"HikariCP giữ sẵn một số connection để tái sử dụng vì mở connection mới rất đắt. Tôi sizing theo khả năng của DB chứ không theo số thread của app: tổng pool của mọi instance phải nhỏ hơn max_connections, mỗi instance thường 10–20, và dùng Little's Law – request/s nhân thời gian giữ connection – để kiểm tra. Các timeout quan trọng: connection-timeout ngắn vài giây để fail nhanh, max-lifetime ngắn hơn giới hạn của firewall, và leak-detection-threshold để log stack trace nơi mượn connection quá lâu. Trade-off là pool lớn không làm DB nhanh hơn mà chỉ tăng contention. Khi thấy pending tăng, việc đầu tiên tôi làm là tìm transaction giữ connection lâu – thường là open-in-view hoặc gọi API ngoài trong transaction – chứ không tăng pool."

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

### Hiểu nhanh
Đổi schema trên bảng lớn giống **sửa đường khi xe vẫn đang chạy**: bạn không thể đóng cả con đường (downtime), nên làm làn mới bên cạnh trước (expand), cho xe chạy được cả hai làn trong thời gian chuyển (dual-write, backfill), khi chắc chắn không còn xe nào dùng làn cũ thì mới phá nó (contract). Lý do phải làm vậy: khi deploy rolling, bản app cũ và bản app mới **chạy cùng lúc** vài phút đến vài giờ, cả hai phải hiểu được schema. Flyway và Liquibase là "sổ nhật ký thi công": ghi lại bước nào đã làm trên DB nào, để mọi môi trường đi cùng một lộ trình.

### Thuật ngữ
- **DDL**: câu lệnh đổi cấu trúc ({{CREATE}}, {{ALTER}}, {{DROP}}).
- **Table rewrite**: DB chép toàn bộ bảng sang file mới khi ALTER – giữ khoá mạnh suốt thời gian chép.
- **ACCESS EXCLUSIVE lock**: khoá mạnh nhất của PostgreSQL, chặn cả đọc lẫn ghi; hầu hết {{ALTER TABLE}} cần nó dù chỉ trong tích tắc.
- **Online DDL**: DDL cho phép đọc/ghi đồng thời (MySQL {{ALGORITHM=INPLACE/INSTANT, LOCK=NONE}}).
- **Backfill**: điền dữ liệu cho cột mới trên các dòng cũ, chạy theo lô.
- **Dual-write**: trong giai đoạn chuyển, app ghi cùng lúc vào cột cũ và cột mới.
- **Rolling deploy**: thay từng instance một, nên có lúc hai phiên bản app chạy song song.
- **lock_timeout**: (PostgreSQL) thời gian tối đa một câu lệnh chờ để lấy khoá rồi bỏ cuộc.

### Dòng thời gian một lần đổi tên cột
~~~text
Release N   : schema có status + order_status(null) | app ghi CẢ HAI, đọc status
Backfill    : UPDATE theo lô 5000 dòng, nghỉ 100ms, theo dõi replication lag
Release N+1 : app ghi CẢ HAI, đọc order_status    (app N vẫn chạy đúng)
Release N+2 : app chỉ dùng order_status
Release N+3 : DROP COLUMN status                   (không còn ai đọc nó)
~~~
1. **Expand bằng thao tác rẻ**: thêm cột nullable chỉ sửa metadata. Vì sao: tránh rewrite và tránh khoá lâu.
2. **Dual-write trước khi backfill**: để dòng mới sinh ra trong lúc backfill không bị sót.
3. **Backfill theo lô có điều kiện {{IS NULL}}**: chạy lại được nếu bị ngắt; lô nhỏ để mỗi transaction ngắn, không giữ khoá lâu, không làm replica trễ. Ví dụ 200 triệu dòng, lô 5000 dòng ~ 50ms ⇒ khoảng 40 nghìn lô, vài giờ chạy nền.
4. **Chuyển đọc sang cột mới** ở release sau khi backfill xong và đã kiểm tra số dòng NULL = 0.
5. **Contract** chỉ khi chắc chắn không còn instance nào của release cũ (kể cả bản rollback).

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
- **PostgreSQL 11+**: {{ADD COLUMN ... DEFAULT}} với default **không volatile** (hằng số, không phải {{random()}}/{{clock_timestamp()}}) không còn rewrite toàn bảng (chỉ ghi giá trị default vào catalog, dòng cũ trả về giá trị này khi đọc) – có thể dùng default an toàn.
- **MySQL 8.0.12+**: {{ALTER TABLE ... ADD COLUMN ..., ALGORITHM=INSTANT}} chỉ sửa metadata, xong gần như tức thì (từ 8.0.29 thêm được cột ở bất kỳ vị trí nào).
- **Tạo index**: {{CREATE INDEX CONCURRENTLY}} (PostgreSQL) chạy lâu nhưng **không khóa ghi**; bắt buộc chạy ngoài transaction. MySQL 8 dùng online DDL: {{ALTER TABLE ... ALGORITHM=INPLACE, LOCK=NONE}}.
- **Backfill theo lô** + giới hạn tốc độ để không chiếm I/O và không làm replication lag tăng.
- **Không dùng {{NOT NULL}} ngay** khi thêm cột trên bảng lớn: cần thêm nullable, backfill, rồi mới set NOT NULL (thao tác này cũng cần quét bảng – hãy kiểm tra chi phí trước). Mẹo PostgreSQL 12+: thêm {{CHECK (order_status IS NOT NULL) NOT VALID}}, chạy {{VALIDATE CONSTRAINT}} (chỉ khoá nhẹ, không chặn ghi), sau đó {{SET NOT NULL}} sẽ dùng CHECK đã validate mà không quét lại bảng.

### Flyway vs Liquibase
| Tiêu chí | Flyway | Liquibase |
|---|---|---|
| Định dạng | File SQL thuần trong resources | XML/YAML/JSON/SQL |
| Kiểm soát | Migration đánh số phiên bản (V1, V2…), lưu checksum trong {{flyway_schema_history}} | Changeset (id + author) trong changelog, lưu checksum trong {{DATABASECHANGELOG}} |
| Rollback | Bản miễn phí: tự viết migration "đi tiếp" để sửa; undo migration chỉ có ở bản trả phí | Có khối rollback trong changeset (một số lệnh tự sinh được rollback) |
| Hợp với | Quy trình review SQL rõ ràng | Nhiều môi trường, nhiều biến thể schema |
| Điểm mạnh | Đơn giản, dễ review, dễ đọc diff | Quản lý được môi trường phức tạp |

Cả hai đều chạy **trước khi app khởi động** (hoặc qua init container / migration job tách riêng cho production).

### Pitfall production
- **Deploy rolling nhiều instance**: lúc này **đồng thời** tồn tại app cũ và app mới ⇒ schema phải tương thích cả hai. Đây là lý do không được xoá cột ngay trong bản phát hành đầu tiên.
- Thêm cột {{NOT NULL}} có default trên MySQL bản cũ sẽ **copy toàn bảng** và khóa lâu.
- Trigger tạm thời để đồng bộ 2 cột có thể giảm hiệu năng ghi đáng kể – nhớ gỡ trigger ở bước contract.
- Với bảng cực lớn, hãy cân nhắc công cụ chuyên dụng: {{gh-ost}}, {{pt-online-schema-change}}, Vitess.

### Lỗi hay gặp
- **ALTER chờ khoá phía sau một transaction dài**: ALTER xếp hàng chờ ACCESS EXCLUSIVE, và **mọi câu SELECT tới sau cũng xếp hàng sau ALTER**. Triệu chứng – cả bảng "đơ" dù ALTER rất nhanh. Cách tránh: {{SET lock_timeout = '3s'}} trước DDL và retry, kiểm tra không có transaction dài.
- **{{CREATE INDEX CONCURRENTLY}} thất bại giữa chừng**: để lại index trạng thái INVALID vẫn làm chậm ghi. Cách tránh: kiểm tra {{pg_index.indisvalid}}, drop và tạo lại; nhớ Flyway phải chạy lệnh này ngoài transaction.
- **Gộp expand và contract vào một release**: triệu chứng – lỗi "column does not exist" trên các pod cũ trong lúc rolling. Cách tránh: tách ít nhất hai release.
- **Sửa file migration đã chạy**: checksum lệch, Flyway/Liquibase từ chối khởi động. Cách tránh: không bao giờ sửa migration đã apply, luôn tạo migration mới.

### Trả lời miệng 1 phút
"Tôi dùng expand/contract: thêm cấu trúc mới theo cách không khoá bảng, cho app ghi cả cũ lẫn mới, backfill theo lô nhỏ, chuyển đọc sang cột mới, và chỉ xoá cột cũ ở một release sau. Lý do là khi rolling deploy, app cũ và app mới chạy cùng lúc nên schema phải tương thích cả hai. Về cơ chế, tôi tránh mọi thao tác rewrite bảng, dùng CREATE INDEX CONCURRENTLY hoặc online DDL của MySQL, và đặt lock_timeout để ALTER không làm nghẽn cả bảng. Flyway đơn giản, SQL thuần, dễ review; Liquibase mạnh hơn khi cần nhiều DB và rollback khai báo. Kinh nghiệm: luôn chạy thử migration trên bản sao dữ liệu thật để đo thời gian trước khi lên production."

### Ví dụ đời thực
Hệ thống đơn hàng của sàn thương mại điện tử có bảng {{orders}} hơn 200 triệu dòng, cần đổi tên cột {{status}} sang {{order_status}}. Triệu chứng: chạy {{ALTER TABLE orders DROP COLUMN status}} trên staging, toàn bảng "đơ" trong 10 phút vì PostgreSQL giữ khoá {{ACCESS EXCLUSIVE}} khi xóa cột, mọi SELECT khác xếp hàng đợi khoá. Điều tra qua {{pg_stat_activity}} thấy hàng chục query chờ, nguyên nhân là DDL cần khoá mạnh và chụp toàn bộ bảng. Xử lý theo expand/contract: release trước thêm cột {{order_status}} nullable (chỉ sửa metadata, xong tức thì); app ghi cả hai cột; backfill dữ liệu cũ theo lô 5000 dòng, điều kiện {{order_status IS NULL}}, mỗi lô commit riêng để không chồng kết nối và không làm replication lag vượt 5 giây. Sau khi số dòng NULL = 0, release sau chuyển đọc sang cột mới, release sau đó mới {{DROP COLUMN status}}. Kết quả: không có downtime, latency chọn đơn hàng không tăng, và code cũ vẫn chạy được nên rollback an toàn.

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

### Hiểu nhanh
Chọn database giống chọn **phương tiện chở hàng**. SQL như xe tải có thùng chia ngăn, có sổ kế toán đi kèm: chở được mọi thứ, kiểm đếm chặt (transaction, ràng buộc), hỏi kiểu gì cũng trả lời được (join, báo cáo). Redis như **xe máy giao hàng**: cực nhanh cho món nhỏ, nhưng chở ít và không phải kho lưu trữ. MongoDB như **thùng carton đóng sẵn theo đơn**: mỗi đơn gói gọn trong một thùng, lấy ra là đủ. Cassandra như **mạng lưới kho tổng ở nhiều thành phố**: nhập hàng liên tục cực nhanh, nhưng chỉ tìm được theo mã kho. Elasticsearch như **cuốn danh bạ tra từ khoá**: tìm "áo khoác đỏ" trong tích tắc, nhưng không phải nơi giữ hàng gốc.

### Thuật ngữ
- **ACID**: Atomicity, Consistency, Isolation, Durability – bốn bảo đảm của transaction.
- **Scale ngang (horizontal)**: thêm máy để tăng năng lực, thay vì nâng cấp một máy (scale dọc).
- **Eventual consistency**: các bản sao sẽ khớp nhau "sau một lúc", không phải ngay lập tức.
- **Partition key** (Cassandra): khoá quyết định dữ liệu nằm ở node nào; mọi truy vấn hiệu quả đều phải có nó.
- **Tunable consistency**: Cassandra cho chọn mỗi query cần bao nhiêu replica xác nhận ({{ONE}}, {{QUORUM}}, {{ALL}}).
- **Inverted index**: bảng tra "từ → danh sách tài liệu chứa từ đó", nền tảng của full-text search.
- **System of record**: nơi giữ bản dữ liệu "chính thức"; các hệ khác là bản phái sinh.
- **CDC (Change Data Capture)**: đọc log thay đổi của DB (WAL/binlog) để đẩy sang hệ thống khác, ví dụ qua Debezium.

### Một kiến trúc điển hình
~~~text
             ghi            CDC (Debezium) / outbox
 App ----> [PostgreSQL] ----------> [Kafka] ----> [Elasticsearch]  (search, trễ ~1-5s)
  |   đọc nhiều  ^                          +---> [Data warehouse] (báo cáo)
  +---> [Redis cache] (miss -> đọc PostgreSQL, TTL 5 phút)
~~~
### Cách quyết định, từng bước
1. **Liệt kê truy vấn chính** trước khi chọn DB (ví dụ: "lấy đơn theo id", "đơn của khách trong 30 ngày", "tìm sản phẩm theo từ khoá"). Vì sao: NoSQL được thiết kế theo truy vấn, chọn sai là phải viết lại.
2. **Xác định yêu cầu nhất quán**: tiền, tồn kho cần ACID → SQL; lượt xem, gợi ý chấp nhận trễ → có thể NoSQL.
3. **Ước lượng tải**: 2000 ghi/s một PostgreSQL tốt vẫn gánh được; 200 nghìn ghi/s liên tục, nhiều region mới thật sự cần Cassandra.
4. **Chọn system of record** (thường là SQL), các hệ khác là bản phái sinh nhận dữ liệu qua CDC/outbox. Vì sao: một nguồn sự thật duy nhất giúp rebuild được khi hệ phái sinh hỏng.
5. **Tính chi phí vận hành**: mỗi hệ thêm vào là thêm backup, monitoring, nâng cấp, người trực.

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

### Lỗi hay gặp
- **Chọn MongoDB "vì không cần schema"** rồi sau đó cần join và transaction nhiều document. Triệu chứng – code app tự join, dữ liệu lệch. Cách tránh: nếu dữ liệu quan hệ chặt, dùng SQL; PostgreSQL {{JSONB}} đã đủ cho phần linh hoạt.
- **Cache Redis không có TTL và không có chiến lược invalidation**: triệu chứng – người dùng thấy giá cũ hàng giờ. Cách tránh: TTL + xoá key khi ghi (cache-aside), chấp nhận và nói rõ độ trễ.
- **Thiết kế bảng Cassandra theo kiểu SQL**: triệu chứng – phải dùng {{ALLOW FILTERING}}, query chậm và làm nặng cluster. Cách tránh: mỗi truy vấn một bảng, denormalize theo partition key.
- **Ghi vào DB và Elasticsearch trong cùng request (dual-write)**: một bên lỗi là lệch vĩnh viễn. Cách tránh: ghi DB, đồng bộ sang ES bằng CDC/outbox, có job reindex.

### Trả lời miệng 1 phút
"Tôi không chọn theo 'SQL hay NoSQL' mà theo mô hình truy vấn và yêu cầu nhất quán. Dữ liệu có quan hệ, cần transaction như tiền và đơn hàng thì tôi chọn PostgreSQL làm nguồn dữ liệu chính. Redis tôi dùng cho cache, session, rate limit – những thứ mất được và rebuild được. MongoDB hợp với document tự chứa, đọc nguyên khối. Cassandra cho ghi rất lớn, nhiều region, truy vấn luôn theo partition key. Elasticsearch cho full-text search, là bản phái sinh đồng bộ qua CDC. Trade-off là mỗi hệ thêm vào làm tăng độ trễ đồng bộ và chi phí vận hành. Kinh nghiệm của tôi: một PostgreSQL được tối ưu tốt gánh được nhiều hơn mọi người nghĩ, nên tôi chỉ thêm hệ mới khi có số liệu chứng minh."

### Ví dụ đời thực
Hệ thống bán lẻ có 5000 đơn/giờ, khách thường tìm sản phẩm bằng từ khoá. PostgreSQL giữ đơn hàng và kho (cần transaction, join) — đây là system of record, nơi dữ liệu chính thức. Redis cache danh mục sản phẩm với TTL 5 phút, giảm đọc DB từ 2000 đọc/giây xuống vài trăm. Elasticsearch nhận dữ liệu từ PostgreSQL qua CDC (đọc log thay đổi, ví dụ qua Debezium), độ trễ 2–5 giây, chỉ dùng để tìm kiếm, không dùng để quyết định thanh toán. Sự cố: khách thấy sản phẩm "hết hàng" trên trang tìm kiếm nhưng vẫn đặt hàng được → do Elasticsearch bị lệch 3 giây so với kho thật. Xử lý: thông báo "số lượng có thể thay đổi" và xác nhận kho lại trước khi thanh toán. Kết quả: latency tìm kiếm từ 2 giây xuống dưới 100ms, ghi đơn hàng không bị ảnh hưởng, và mọi rủi ro được truyền đạt rõ ràng cho bộ phận sản phẩm.

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

### Hiểu nhanh
Hãy tưởng tượng một **bảng phân công việc dán trên tường** và 5 nhân viên. Mỗi người đi tới, tìm tờ việc chưa ai nhận, dán tên mình lên rồi mang đi làm. Nếu dùng {{FOR UPDATE}} thường, khi hai người cùng nhắm vào tờ đầu tiên, người thứ hai phải **đứng chờ** người kia dán tên xong. Với {{SKIP LOCKED}}, người thứ hai thấy tờ đó "đang có người cầm" thì **lấy luôn tờ kế tiếp** – không ai phải chờ ai. Dán tên xong (commit) thì rời bảng ngay để làm việc, không đứng ôm bảng.

### Thuật ngữ
- **Row lock (FOR UPDATE)**: khoá dòng để không ai khác sửa hay khoá nó tới khi transaction kết thúc.
- **SKIP LOCKED**: khi gặp dòng đang bị khoá, bỏ qua thay vì chờ – kết quả cố ý không nhất quán, chỉ hợp cho hàng đợi.
- **CTE ({{WITH ... AS}})**: truy vấn con đặt tên, dùng như một bảng tạm trong câu lệnh.
- **Lease**: "hợp đồng thuê" có hạn – job thuộc về worker tới thời điểm {{locked_at + timeout}}, quá hạn thì người khác được lấy lại.
- **At-least-once**: mỗi job chắc chắn được xử lý ít nhất một lần, có thể nhiều hơn một lần.
- **Idempotent**: chạy lại nhiều lần cho kết quả như chạy một lần.
- **Dead tuple**: phiên bản dòng cũ trong PostgreSQL chờ VACUUM dọn; bảng job update liên tục sinh rất nhiều.
- **Dead-letter**: nơi chứa job lỗi quá số lần retry để người xem xét.

### Vòng đời một job
~~~text
PENDING --(worker lấy + commit)--> RUNNING --(xong)--> DONE
   ^                                 |  |
   |  (lỗi, attempts < 5, run_at = now()+backoff)
   +---------------------------------+  +--(attempts >= 5)--> FAILED (dead-letter)
   ^
   +--(reaper: RUNNING mà locked_at < now() - 10 phút)
Worker A: lấy job 1..10   Worker B: bỏ qua 1..10 (đang khoá) -> lấy 11..20
~~~
Điểm mấu chốt: khoá dòng chỉ sống trong **vài mili giây** của transaction lấy job; sau commit, "quyền sở hữu" job được thể hiện bằng trạng thái {{RUNNING}} + {{locked_at}} lưu trong dòng, nên worker chết thì reaper vẫn nhận ra được.

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

### Lỗi hay gặp
- **Không có index cho điều kiện lấy job**: bảng job có 10 triệu dòng DONE, mỗi lần poll quét lại hết. Triệu chứng – CPU DB cao dù chỉ có vài job PENDING. Cách tránh: partial index {{CREATE INDEX ON jobs (run_at) WHERE status = 'PENDING'}} (PostgreSQL), và chuyển/xoá job DONE cũ định kỳ.
- **Poll quá dày từ nhiều worker**: 50 worker poll mỗi 100ms = 500 query/s chỉ để hỏi "có việc không". Cách tránh: poll có backoff khi rỗng, hoặc dùng {{LISTEN/NOTIFY}} của PostgreSQL để đánh thức worker.
- **Reaper đặt timeout ngắn hơn thời gian xử lý thật**: job đang chạy bị trả về PENDING, worker khác chạy trùng. Cách tránh: timeout dư so với p99, worker gia hạn {{locked_at}} (heartbeat) với job dài, và job idempotent.
- **Ghi kết quả không kiểm tra chủ sở hữu**: worker cũ (đã bị reaper thu hồi) vẫn cập nhật DONE đè lên. Cách tránh: {{UPDATE ... WHERE id = ? AND locked_by = ? AND status = 'RUNNING'}} và kiểm tra số dòng cập nhật.

### Trả lời miệng 1 phút
"FOR UPDATE SKIP LOCKED cho phép nhiều worker cùng lấy job từ một bảng mà không chờ nhau: dòng nào đang bị worker khác khoá thì bỏ qua và lấy dòng tiếp theo. Tôi làm theo kiểu lấy một lô nhỏ, đổi trạng thái sang RUNNING kèm locked_at rồi commit ngay, xử lý job ngoài transaction, và cập nhật DONE hoặc FAILED trong transaction riêng. Vì là at-least-once nên job phải idempotent, và cần một reaper trả các job RUNNING quá hạn về PENDING. Trade-off: đơn giản, không cần thêm broker, ghi job cùng transaction với nghiệp vụ, nhưng không hợp cho tải rất lớn hay cần routing phức tạp. Tôi từng dùng nó cho gửi email và đồng bộ đối tác vài trăm job mỗi giây, chạy ổn định với partial index trên job PENDING."

### Ví dụ đời thực
Hệ thống gửi email xác nhận đơn hàng ở mức 300 email/giây, bảng {{jobs}} trên PostgreSQL có 10 triệu dòng. Ban đầu 5 worker mỗi 100ms chạy {{SELECT ... WHERE status = 'PENDING'}} và quét toàn bảng ⇒ CPU DB ở 80%, mỗi worker chờ lâu. Điều tra qua {{pg_stat_activity}} và metric CPU, thấy câu lệnh lấy job chiếm phần lớn thời gian. Xử lý: tạo chỉ mục một phần {{CREATE INDEX ON jobs (run_at) WHERE status = 'PENDING'}}, mỗi worker lấy lô 10 job bằng {{FOR UPDATE SKIP LOCKED}}, commit ngay, xử lý ngoài transaction, và có reaper trả job {{RUNNING}} quá 10 phút về {{PENDING}}. Mỗi job idempotent (gửi lại email không tạo email trùng). Kết quả: CPU DB xuống 15%, lấy job dưới 100ms, không còn job kẹt mãi mãi sau sự cố, throughput đáp ứng 300 email/giây.

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

### Hiểu nhanh
Oracle và PostgreSQL giống hai hãng ô tô cùng hạng sang: đều có vô lăng, phanh, túi khí (transaction, index, MVCC), nhưng **vị trí nút bấm khác nhau** – lái quen xe này sang xe kia dễ bật nhầm cần gạt nước thay vì xi-nhan. Với dev Java, "nút bấm" là: cách sinh id, cách đối xử với chuỗi rỗng, cú pháp phân trang, kiểu ngày giờ và công cụ xem plan. Code JPA thuần ít bị ảnh hưởng, nhưng native query, stored procedure và dữ liệu hiện có thì dính trực tiếp. Hiểu khác biệt giúp bạn đọc code cũ của ngân hàng và tránh bug "chạy local PostgreSQL ổn, lên Oracle thì lỗi".

### Thuật ngữ
- **Sequence**: object sinh số tăng dần độc lập với bảng; {{CACHE n}} cấp sẵn n số trong bộ nhớ nên nhanh nhưng có thể nhảy số (gap) khi restart.
- **VARCHAR2**: kiểu chuỗi chính của Oracle; chuỗi rỗng lưu vào sẽ thành NULL.
- **ROWNUM**: số thứ tự Oracle gán cho dòng khi trả kết quả, dùng để phân trang ở bản cũ.
- **PL/SQL / PL/pgSQL**: ngôn ngữ thủ tục chạy trong DB (stored procedure, trigger) của Oracle / PostgreSQL.
- **Undo segment**: nơi Oracle lưu dữ liệu cũ để rollback và cho đọc nhất quán (tương tự undo log InnoDB).
- **RAC / Data Guard**: cụm nhiều node dùng chung storage / bản sao dự phòng ở site khác của Oracle.
- **DBMS_XPLAN**: package Oracle để hiển thị execution plan.
- **allocationSize**: tham số JPA của {{@SequenceGenerator}}, Hibernate lấy trước bao nhiêu id mỗi lần gọi sequence (mặc định 50).

### Sinh id bằng sequence với JPA, từng bước
~~~text
DB:  CREATE SEQUENCE order_seq START WITH 1 INCREMENT BY 50 CACHE 20;
JPA: @SequenceGenerator(name="ord", sequenceName="order_seq", allocationSize=50)
 Lần 1: Hibernate gọi nextval -> 1   => tự cấp id 1..50 trong bộ nhớ
 Lần 2: gọi nextval -> 51            => cấp 51..100
~~~
1. **Hibernate gọi sequence một lần cho cả lô id**. Vì sao: giảm số round-trip, insert hàng loạt nhanh hơn nhiều so với identity.
2. **INCREMENT BY của sequence phải bằng allocationSize**. Vì sao: Hibernate 6 đọc metadata sequence lúc khởi động và mặc định báo lỗi khi lệch (cấu hình {{hibernate.id.sequence.increment_size_mismatch_strategy}}); nếu tắt kiểm tra mà vẫn lệch, hai instance có thể sinh trùng id hoặc nhảy số lớn.
3. **Gap là bình thường**: restart app bỏ phí phần id chưa dùng, Oracle {{CACHE}} bỏ phí số đã cache khi instance tắt. Vì sao không sao: id chỉ cần duy nhất, không cần liên tục; số chứng từ liên tục phải sinh bằng cơ chế khác.
4. **Trên Oracle RAC**, sequence {{NOORDER}} + {{CACHE}} khiến id từ các node không tăng đúng theo thời gian. Vì sao quan trọng: đừng sort "theo thời gian tạo" bằng id.

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
| Phân vùng | Range/list/hash, partition exchange, reference partitioning | Declarative partitioning; sharding qua extension Citus |

### Những khác biệt "gây bug" nếu không biết
1. **Chuỗi rỗng**: trên Oracle, insert {{''}} vào cột {{VARCHAR2}} biến thành NULL. Code Java so sánh {{"".equals(value)}} cho kết quả khác giữa hai DB.
2. **Phân trang**: {{LIMIT 20 OFFSET 100}} là cú pháp PostgreSQL/MySQL; Oracle dùng {{OFFSET 100 ROWS FETCH NEXT 20 ROWS ONLY}}. Cùng một native query không chạy được trên cả hai.
3. **Ngày**: Oracle {{SYSDATE}} trả thời gian hệ thống theo timezone của server; PostgreSQL nên dùng {{now()}} (theo timezone session). Với {{TIMESTAMPTZ}}, PostgreSQL lưu UTC và hiển thị theo timezone của session – tương đương gần nhất bên Oracle là {{TIMESTAMP WITH LOCAL TIME ZONE}}; còn {{DATE}}/{{TIMESTAMP}} của Oracle không lưu múi giờ, giống {{timestamp}} (without time zone) của PostgreSQL.
4. **So sánh null**: cả hai đều dùng {{IS NULL}}; {{NOT IN}} với một giá trị NULL trong tập kết quả sẽ trả về **không dòng nào** (cả hai DB đều vậy – đây là lỗi kinh điển).
5. **Identifier**: tên không quote không phân biệt hoa thường, nhưng Oracle gập về **chữ HOA** còn PostgreSQL gập về **chữ thường**; tên được tạo trong dấu nháy kép ("OrderId") thì phải quote đúng y hệt mỗi lần dùng.
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

### Lỗi hay gặp
- **Validate chuỗi rỗng bằng DB**: trên Oracle, cột {{NOT NULL}} nhận {{''}} sẽ báo lỗi ORA-01400 vì {{''}} thành NULL. Triệu chứng – form có ô để trống chạy tốt trên PostgreSQL, lỗi trên Oracle. Cách tránh: chuẩn hoá ở tầng Java (chuỗi rỗng → null hoặc bắt buộc nhập) và test với Oracle thật (Testcontainers có image Oracle Free).
- **Dùng {{java.util.Date}} / {{LocalDateTime}} với cột Oracle {{DATE}} mà quên múi giờ**: dữ liệu lệch 7 giờ khi server đặt UTC. Cách tránh: thống nhất lưu UTC, dùng {{Instant}}/{{OffsetDateTime}} và đặt {{hibernate.jdbc.time_zone}}.
- **Biểu thức {{IN}} quá dài**: Oracle giới hạn 1000 phần tử trong danh sách {{IN}} (ORA-01795). Triệu chứng – batch lớn lỗi bất ngờ. Cách tránh: chia lô hoặc dùng bảng tạm/join.
- **Lệch allocationSize với INCREMENT BY**: id trùng hoặc lỗi khởi động sau khi đổi DB. Cách tránh: khai báo tường minh cả hai và kiểm tra trong migration.

### Trả lời miệng 1 phút
"Oracle và PostgreSQL đều là RDBMS đầy đủ với MVCC và mặc định READ COMMITTED, nên logic transaction gần giống nhau. Khác biệt gây bug nhiều nhất mà tôi gặp: Oracle coi chuỗi rỗng là NULL, cú pháp phân trang khác – ROWNUM hoặc FETCH NEXT so với LIMIT OFFSET –, nối chuỗi với NULL cho kết quả khác, và kiểu DATE của Oracle có cả giờ. Về id, cả hai dùng sequence; tôi luôn để INCREMENT BY khớp allocationSize của Hibernate và chấp nhận gap. Trade-off khi chọn: Oracle mạnh về hệ sinh thái enterprise như RAC, Data Guard nhưng license đắt; PostgreSQL miễn phí, JSONB và extension rất mạnh. Khi làm hệ thống ngân hàng, tôi giữ native query theo từng dialect và chạy integration test trên đúng loại DB của production."

### Ví dụ đời thực
Hệ thống ngân hàng vận hành trên Oracle, phát triển chạy PostgreSQL local. Sự cố: form cho để trống trường "mã chi nhánh", Java gửi chuỗi rỗng {{''}}. Trên PostgreSQL insert thành công, nhưng trên Oracle {{''}} được coi là NULL ⇒ lỗi ORA-01400 "cannot insert NULL", đơn hàng bị chặn vào buổi cao điểm. Điều tra qua log ứng dụng và {{V$SQL}} / {{DBMS_XPLAN}}, xác định nguyên nhân là xử lý chuỗi rỗng khác nhau giữa hai DB. Xử lý: chuẩn hoá ở tầng Java — chuỗi rỗng chuyển thành {{null}} trước khi lưu, kiểm tra ràng buộc NOT NULL sớm. Thêm integration test chạy trên Oracle Free image qua Testcontainers. Kết quả: không còn lỗi insert trên production, code local PostgreSQL và Oracle nhất quán, team tự tin triển khai tính năng mới lên hệ thống ngân hàng.

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

### Ví dụ đời thực
Hệ thống đơn hàng cần gửi email xác nhận và cộng điểm thưởng ngay sau khi commit. Ban đầu dùng {{@EventListener}} cho cả hai, nhưng sự cố xảy ra: process crash sau khi commit đơn hàng thì email đã đi, đơn hàng lại bị rollback ⇒ khách nhận email xác nhận đơn hàng không tồn tại. Điều tra qua log pod và metric error rate, thấy event chỉ sống trong RAM, crash là mất vĩnh viễn. Xử lý: chuyển email sang {{@TransactionalEventListener(phase = AFTER_COMMIT)}} nên chỉ gửi sau commit thành công. Cộng điểm thưởng (liên quan tiền) dùng outbox: ghi sự kiện vào bảng outbox trong cùng transaction với đơn hàng, rồi job đọc outbox bằng {{FOR UPDATE SKIP LOCKED}} và publish sang Kafka. Kết quả: không mất email, độ trễ end-to-end dưới 5 giây, side effect nào có hậu quả với tiền đều đi qua outbox với metric được theo dõi như SLO.

### Trả lời mẫu khi phỏng vấn
"Tôi phân biệt hai loại tác dụng phụ. Gửi email chỉ là thông báo nên dùng {{@TransactionalEventListener}} với phase AFTER_COMMIT: nó chạy sau khi transaction commit thành công, nên không gửi email cho đơn hàng bị rollback. Nhưng cộng điểm thưởng liên quan trực tiếp đến tiền của khách, không được mất → tôi dùng outbox pattern: ghi sự kiện vào bảng outbox trong cùng transaction với đơn hàng, rồi job đọc outbox và publish vào Kafka. Event trong Spring chỉ tồn tại trong RAM, pod crash là mất, nên outbox là bắt buộc cho tác dụng phụ có giá trị. Tôi chỉ truyền id vào event rồi load lại, không truyền entity, và tránh listener phụ thuộc thứ tự nhau. Nếu event publish ngoài transaction, listener mặc định sẽ không chạy và không cảnh báo, nên tôi hạn chế dùng fallbackExecution. Cuối cùng, tôi đo độ trễ end-to-end của outbox như một SLO để biết chậm ở đâu."

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

### Ví dụ đời thực
Hệ thống bán lẻ cache danh mục sản phẩm bằng Redis, đọc 2000 lần/giây, TTL 10 phút. Sự cố: khi key hết hạn, 500 request cùng tới trong 200ms, tất cả miss và cùng query DB ⇒ CPU DB tăng gấp 5 lần. Điều tra qua metric cache hit ratio và slow query log, xác định đây là cache stampede. Xử lý: thêm jitter vào TTL để các key hết hạn lệch nhau, và dùng lock phân tán qua Redis để chỉ một thread truy vấn DB, các thread khác nhận giá trị cũ hoặc chờ. Đồng thời cho phép cache giá trị null với TTL ngắn (tránh cache quá lâu) để chặn cache penetration — nếu không cache null thì mỗi lần miss với key không tồn tại đều xuống DB. Lỗi khác: cache key thiếu tenantId ⇒ khách hàng B xem được danh sách sản phẩm của khách hàng A (rò rỉ dữ liệu, không phải cache miss). Kết quả: hit ratio 95%, tải DB giảm 90%, không còn sự cố rò rỉ dữ liệu.

### Trả lời mẫu khi phỏng vấn
"Tôi dùng {{@Cacheable}} cho danh mục sản phẩm vì dữ liệu đọc nhiều và ít thay đổi. Cache key phải chứa mọi điều kiện ảnh hưởng kết quả, ví dụ tenantId, nếu không khách hàng B sẽ đọc được dữ liệu của khách hàng A — đây là rò rỉ dữ liệu. TTL tôi đặt 10 phút qua {{RedisCacheConfiguration}}. Để tránh cache penetration, tôi cho phép cache giá trị null nhưng đặt TTL ngắn cho các key này, vì nếu tắt cache null thì mỗi lần miss với key không tồn tại đều xuống DB. Việc gọi method trong cùng bean (self-invocation) không qua proxy nên không được cache. Đối với cache stampede, tôi dùng jitter TTL hoặc lock phân tán qua Redis, vì {{sync = true}} chỉ hoạt động trong một JVM. Cache lưu DTO, không lưu entity để tránh lỗi quan hệ lazy. Tôi cũng theo dõi cache hit ratio để biết cache thật sự giúp ích hay chỉ chiếm RAM. Redis single-threaded nên tôi không dùng KEYS trên production, chỉ SCAN."

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

### Ví dụ đời thực
Tình huống: màn hình thanh toán đơn hàng gọi 3 API bên ngoài theo thứ tự — cổng thanh toán, dịch vụ xác thực địa chỉ, dịch vụ gửi thông báo. Mỗi API dùng một RestClient mới tạo trong controller, không đặt timeout, dùng HttpURLConnection (không có kết nối pool).

Triệu chứng: lúc cao điểm 500 đơn/phút, trang thanh toán chờ hơn 30 giây rồi trả 504; các màn hình khác của cùng hệ thống cũng bị chậm theo.

Điều tra: thread dump cho thấy 200 thread Tomcat đang chặn tại Sun.nio.ch.SocketChannelImpl.connect, log ghi 'connect timed out'. Metric tomcat.threads.busy đạt 199/200, pool kết nối cạn.

Nguyên nhân gốc: cổng thanh toán phản hồi chậm trung bình 12 giây vì đối tác đang bảo trì; không có timeout nên mỗi request giữ thread Tomcat suốt 12 giây, pool cạn, các request khác không còn thread xử lý.

Xử lý: khai báo RestClient bean singleton cho mỗi đối tác, đặt connect timeout 2 giây và read timeout 5 giây, dùng JdkClientHttpRequestFactory để tái sử dụng connection qua keep-alive, bật circuit breaker trên cổng thanh toán (fail nhanh sau 5 lần lỗi liên tiếp).

Kết quả: p95 thời gian phản hồi trang thanh toán giảm từ hơn 30 giây xuống dưới 800 miligiây, tỷ lệ lỗi 5xx giảm từ 12% xuống dưới 0,1%, các màn hình khác không còn bị lan truyền.

### Trả lời mẫu khi phỏng vấn
"Tôi sẽ chọn {{RestClient}} đồng bộ vì controller chạy Spring MVC và gọi 3 API bên ngoài tuần tự, không cần dữ liệu reactive stream. Mỗi client tôi khai báo thành bean singleton, đặt connect timeout 2 giây để không bỏ thời gian vào việc kết nối, và read timeout 5 giây để một đối tác chậm không giữ thread mãi. Pool kết nối tôi dùng HttpClient của JDK hoặc Apache HttpClient 5 để tái sử dụng connection qua keep-alive, chứ không tạo client mới mỗi lần gọi. Nếu một API bên ngoài chậm hay treo, tôi dùng circuit breaker (Resilience4j) để fail nhanh, bảo vệ toàn hệ thống thay vì để thread pool cạn kiệt. Với 5 đối tác, tôi thiết lập timeout budget theo SLO: nếu API tổng phải trả về dưới 1 giây, mỗi đối tác chỉ được đợi khoảng 200-300 miligiây. Cuối cùng, tôi log mỗi lần gọi với mã đối tác và thời gian phản hồi, để khi xảy ra sự cố biết rõ bottleneck nằm ở đâu."
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

### Ví dụ đời thực
Tình huống: API đăng ký khách hàng nhận tên, email, mật khẩu. Ban đầu dev chỉ đánh {{@Valid}} lên DTO ở controller, và để kiểm tra 'email chưa tồn tại' trong service.

Triệu chứng: job nhập khách hàng từ file CSV vào đêm không kiểm tra trùng email, tạo hàng trăm tài khoản trùng; khách hàng gọi API đăng ký với email sai định dạng, do thiếu {{@ExceptionHandler}} cho {{MethodArgumentNotValidException}}, hệ thống trả 500 thay vì 400.

Điều tra: log cho thấy exception {{ConstraintViolationException}} bị ném lên khi job gọi trực tiếp service, không có controller nên không có handler của Spring MVC. Truy vấn COUNT(*) trên CSDL thấy 342 email trùng.

Nguyên nhân gốc: quy tắc nghiệp vụ 'email duy nhất' nằm ở controller, nên job nội bộ bỏ qua; lỗi hình dạng không được bắt lại ở biên vì không có handler.

Xử lý: chuyển {{@Validated}} lên class service với group OnCreate, thêm {{@ExceptionHandler}} trả 400 cho {{MethodArgumentNotValidException}} và {{ConstraintViolationException}}, job gọi trực tiếp service nên vẫn được kiểm tra.

Kết quả: API trả 400 ngay khi dữ liệu sai, job đêm không tạo tài khoản trùng nữa, số ticket lỗi '500 đăng ký' giảm về 0.

### Trả lời mẫu khi phỏng vấn
"{{@Valid}} là cờ kiểm tra các field lồng nhau, dùng ở tham số method, còn {{@Validated}} là annotation của Spring đặt ở mức class để bật method validation và chọn validation group. Tôi sẽ đánh {{@Valid}} lên {{@RequestBody}} ở controller để fail nhanh với 400 khi dữ liệu sai định dạng. Quy tắc nghiệp vụ, ví dụ 'email chưa tồn tại' hoặc 'số dư đủ', tôi đặt trong service và đánh {{@Validated}} ở mức class, vì cả job nội bộ lẫn API HTTP đều gọi service và đều phải được kiểm tra. Group dùng khi cùng một DTO có quy tắc khác nhau giữa tạo và cập nhật, ví dụ mật khẩu bắt buộc khi tạo nhưng không bắt buộc khi cập nhật. Nếu không có {{@ExceptionHandler}}, client nhận 500 thay vì 400. Lỗi hay gặp là đặt validation chỉ ở controller thì job nội bộ bỏ qua hết. Tôi cũng viết test riêng cho mỗi group."
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

### Ví dụ đời thực
Tình huống: job nhập 2 triệu dòng giao dịch từ hệ thống héritage mỗi tối, chunk 10.000 dòng, chạy trên 1 instance.

Triệu chứng: một dòng có mã vận chuyển sai làm fail toàn bộ chunk 10.000 dòng; job bị dừng giữa đêm, sáng hôm sau restart lại từ đầu và mất 6 giờ thay vì 1 giờ. Lượt chạy trước đã ghi 1,8 triệu dòng nhưng vì không idempotent, chạy lại tạo bản ghi trùng.

Điều tra: bảng BATCH_STEP_EXECUTION cho thấy STATUS = FAILED, EXIT_CODE = DataIntegrityViolationException ở gần dòng 1.850.000; không có SkipListener nên không ai biết mấy dòng rác nào bị bỏ.

Nguyên nhân gốc: chunk quá lớn, một lỗi rollback cả 10.000 dòng; processor không idempotent (insert thay vì upsert) nên restart tạo trùng; thiếu skip limit và listener ghi lại dòng lỗi.

Xử lý: giảm chunk xuống 500, cấu hình skip limit 100 với SkipListener ghi dòng lỗi vào bảng, dùng upsert (INSERT ... ON CONFLICT) cho idempotent, partition theo khoảng id vào 8 worker chạy song song.

Kết quả: job chạy dưới 45 phút, restart tiếp tục từ chunk lỗi chứ không từ đầu, số dòng thất bại được ghi rõ và kiểm tra hàng ngày.

### Trả lời mẫu khi phỏng vấn
"Spring Batch xử lý theo kiểu chunk-oriented: đọc một lô item, xử lý, rồi ghi toàn bộ lô trong một transaction và lưu checkpoint vào JobRepository, nên crash có thể restart từ lô gần nhất. Lỗi tạm thời như deadlock hay timeout tôi dùng retry với backoff lặp dần; dữ liệu rác tôi dùng skip có giới hạn và kèm SkipListener để không mất dữ liệu trong im lặng. Chunk nhỏ làm nhiều transaction và chậm, chunk lớn rollback tốn kém, tôi thường chọn 500-1.000. Khi job quá lớn cho một máy, tôi dùng partitioning: một manager chia khoảng id thành 8 partition, mỗi partition là một StepExecution riêng, restart độc lập. Nhớ rằng processor phải idempotent (upsert chứ không insert) để restart an toàn."
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

### Ví dụ đời thực
Tình huống: SPA React tại app.nganhang.vn gọi API api.nganhang.vn, lưu access token trong memory và gửi qua header Authorization. Ban đầu dev bật CORS với allowedOrigins('*') và allowCredentials(true), đồng thời để bật CSRF mặc định.

Triệu chứng: trình duyệt báo lỗi 'The value of the Access-Control-Allow-Origin header in the response must not be the wildcard * when the request's credentials mode is include'; gọi API từ trình duyệt thất bại 100%.

Điều tra: log Spring ném IllegalArgumentException khi xử lý yêu cầu OPTIONS; F12 Network thấy yêu cầu trước không được trả lời.

Nguyên nhân gốc: không thể dùng '*' cùng allowCredentials(true); CSRF dựa trên cookie nhưng SPA không dùng cookie cho token nên không cần CSRF.

Xử lý: CORS chỉ cho origin app.nganhang.vn, allowCredentials(true), cache preflight 1 giờ; tắt CSRF vì token trong memory không được trình duyệt gửi tự động; bật @EnableMethodSecurity và dùng hasAuthority('SCOPE_transfer.write').

Kết quả: gọi API từ trình duyệt thành công, p95 yêu cầu trước dưới 50 miligiây (được cache), không còn lỗi 403 do sai mapping scope.

### Trả lời mẫu khi phỏng vấn
"Phân quyền tôi chia thành 3 lớp: filter chain phân quyền thô theo URL, method security với {{@PreAuthorize}} phân quyền theo hành động nghiệp vụ, và row-level luôn lọc theo tenant của người dùng trong truy vấn. OAuth2 resource server xác thực JWT, và Spring đổi scope thành SCOPE_xxx nên dùng hasAuthority('SCOPE_transfer.write') chứ không phải hasRole. CORS cho phép trình duyệt đọc phản hồi từ origin khác, không phải cơ chế bảo mật; tôi chỉ liệt kê origin của SPA, không dùng '*' khi cho phép credentials. CSRF dựa trên trình duyệt tự động gửi cookie; access token nằm trong memory và gửi qua header Authorization nên không có đường tấn công CSRF, tôi tắt CSRF. Nếu token nằm trong cookie thì mới bật lại CSRF theo kiểu double-submit."
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

### Ví dụ đời thực
Tình huống: API chi tiết đơn hàng lấy kèm danh sách sản phẩm và danh sách lịch sử thanh toán bằng {{@EntityGraph}} với attributePaths = {'items', 'payments'}.

Triệu chứng: sau khi deploy, mỗi lần mở chi tiết đơn có nhiều sản phẩm và nhiều lần thanh toán, ứng dụng ném {{MultipleBagFetchException}} và trả 500 cho khách hàng.

Điều tra: log Hibernate ném exception ngay khi dựng câu lệnh SQL; kiểm tra đơn bị lỗi có 4 sản phẩm và 3 giao dịch thanh toán.

Nguyên nhân gốc: hai collection {{List}} cùng được LEFT JOIN trong một câu SQL tạo ra tích Descartes (4 × 3 = 12 dòng); Hibernate không thể gộp 12 dòng thành 2 collection {{List}} khác nhau nên từ chối truy vấn.

Xử lý: tách thành 2 truy vấn — truy vấn 1 lấy đơn kèm items, truy vấn 2 lấy payments theo danh sách id đơn; hoặc thay {{List}} bằng {{Set}} nếu ngữ nghĩa cho phép; hoặc dùng DTO projection khi chỉ cần vài trường.

Kết quả: API chi tiết đơn ổn định, không còn 500, thời gian phản hồi ổn định dưới 200 miligiây cho đơn có hàng trăm dòng lịch sử.

### Trả lời mẫu khi phỏng vấn
"{{JOIN FETCH}} và {{@EntityGraph}} đều sinh một câu SQL có LEFT JOIN, nên không có truy vấn thêm sau này, nhưng SQL phình to và không dùng được với phân trang. {{@BatchSize}} giữ quan hệ lazy, khi code truy cập collection thì gom nhiều lần tải thành query IN theo lô, nên N collection chỉ cần khoảng N chia batch size truy vấn. Với hai collection List, tôi không join cùng lúc vì sẽ bị {{MultipleBagFetchException}} do tích Descartes: một đơn có 3 sản phẩm và 2 lần thanh toán join ra 6 dòng, Hibernate không biết dòng nào là bản sao tích Cartesian hay phần tử hợp lệ của List. Tôi tách thành 2 truy vấn hoặc dùng DTO projection. Nếu API danh sách phải phân trang, tôi không fetch collection trong query chính, mà lấy id trước rồi fetch collection theo id đã lấy."
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

### Ví dụ đời thực
Tình huống: API danh sách đơn hàng dùng {{@EntityGraph}} để lấy kèm sản phẩm, kết hợp Spring Data {{Pageable}} (trang 20, mỗi trang 20 đơn).

Triệu chứng: đến trang 10.000 trở đi API phản hồi hơn 30 giây, sau đó ném OutOfMemoryError; logs Hibernate ném cảnh báo {{HHH90003004}} 'firstResult/maxResults specified with collection fetch; applying in memory'.

Điều tra: truy vấn chậm trong log Hibernate không có LIMIT/OFFSET, truy vấn lấy toàn bộ hàng triệu đơn rồi gom trong bộ nhớ; heap dump cho thấy các đối tượng Order chiếm 4 GB heap.

Nguyên nhân gốc: LEFT JOIN collection nhân các dòng, LIMIT áp trên số dòng SQL sai số lượng đơn, Hibernate buộc tải toàn bộ tập kết quả về bộ nhớ rồi mới cắt.

Xử lý: truy vấn 1 chỉ lấy id theo trang (có LIMIT, có ORDER BY ổn định), truy vấn 2 fetch sản phẩm theo danh sách id đã lấy, truy vấn 3 đếm tổng không join collection; hoặc dùng DTO projection, hoặc phân trang keyset thay cho offset.

Kết quả: trang 10.000 phản hồi dưới 1 giây, heap ổn định, không còn OutOfMemoryError.

### Trả lời mẫu khi phỏng vấn
"Cảnh báo {{HHH90003004}} có nghĩa Hibernate không thể áp dụng LIMIT của SQL khi câu lệnh có join collection, vì join nhân số dòng ra và LIMIT sẽ cắt sai số lượng đơn. Hibernate chọn cách tải toàn bộ tập kết quả về bộ nhớ rồi cắt, nên với hàng triệu đơn là OutOfMemoryError. Cách sửa chuẩn là tách thành 2 truy vấn: truy vấn 1 chỉ lấy id theo trang với LIMIT và ORDER BY ổn định, truy vấn 2 fetch collection theo danh sách id đã lấy, rồi sắp xếp lại theo thứ tự phân trang. Truy vấn đếm tổng cũng phải tách ra, không join collection, sao cho không bị tích Descartes. Nếu UI không cần hiển thị 'trang 5 của 120 trang', tôi dùng Slice để không cần truy vấn đếm."
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

### Ví dụ đời thực
Triệu chứng: job đóng hàng loạt 500.000 đơn quá hạn chạy mỗi đêm. Sáng hôm sau, CSKH báo một số đơn đã đóng lại "sống dậy" trạng thái {{PENDING}} trên hệ thống, dù trong bảng {{orders}} từng thấy {{EXPIRED}}.
Điều tra: bật {{logging.level.org.hibernate.SQL=DEBUG}} và {{org.springframework.transaction=DEBUG}}, so sánh log lúc job chạy. Thấy sequence: (1) load entity Order A để ghi note, (2) gọi {{@Modifying}} bulk update set {{status='EXPIRED'}}, (3) sửa {{note}} của A trong cùng transaction, (4) commit sinh {{UPDATE orders SET status='PENDING', note='...', ... WHERE id=?}} do dirty checking dùng snapshot cũ (lúc load A vẫn {{PENDING}}).
Nguyên nhân gốc: bulk JPQL đi thẳng xuống DB, không đồng bộ persistence context; entity managed giữ snapshot cũ nên dirty checking ghi đè kết quả bulk.
Cách xử lý: tách bulk update sang transaction riêng (chạy trước), hoặc bật {{@Modifying(flushAutomatically = true, clearAutomatically = true)}} rồi load lại entity cần dùng sau đó. Bổ sung metric đếm {{rowsAffected}} và log cảnh báo nếu khác kỳ vọng.
Kết quả đo được: sau khi tách transaction, không còn đơn "sống dậy"; job 500k dòng chạy ổn định ~12 giây, {{rowsAffected}} khớp số đơn quá hạn.

### Trả lời mẫu khi phỏng vấn
"Tôi hiểu {{@Modifying}} với JPQL bulk update/delete là câu lệnh gửi thẳng xuống DB, không đi qua persistence context. Nghĩa là các entity đang được quản lý trong bộ nhớ không được cập nhật và Hibernate cũng không biết dữ liệu đã đổi. Rủi ro lớn nhất là dirty checking: nếu tôi load một entity, chạy bulk update rồi sửa entity đó trong cùng transaction, lúc commit Hibernate so sánh snapshot cũ và sinh UPDATE ghi đè kết quả bulk. Vì vậy tôi luôn tách bulk update ra transaction riêng hoặc bật {{flushAutomatically}} để đẩy thay đổi chưa ghi trước khi bulk chạy, và {{clearAutomatically}} để xoá context sau đó rồi load lại nếu còn cần dùng entity. Tôi cũng kiểm tra {{rowsAffected}} trả về, invalidate cache thủ công vì Spring Cache không tự biết, và nhớ rằng bulk update không tăng {{@Version}} cũng không chạy {{@PreUpdate}} hay auditing callback."

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

### Ví dụ đời thực
Triệu chứng: job nhập 1 triệu dòng lịch sử giao dịch từ CSV chạy mỗi cuối tháng. Lần đầu chạy bằng {{repository.save()}} trong vòng lặp, job mất hơn 40 phút rồi {{OutOfMemoryError: Java heap space}}; DB connection bị giữ suốt, p95 API giao dịch tăng gấp 3 lần.
Điều tra: bật metric heap và {{hibernate.generate_statistics}}, thấy persistence context giữ ~800k entity managed, số JDBC statement gần 1 triệu (insert từng dòng), GC liên tục. {{EXPLAIN}} không phải vấn đề vì insert đơn giản.
Nguyên nhân gốc: dùng {{EntityManager}} thông thường nên mỗi entity được track để dirty-check, không batching (id {{IDENTITY}}), và không flush/clear định kỳ.
Cách xử lý: chuyển sang {{StatelessSession}} đọc CSV streaming bằng {{BufferedReader}}, insert theo lô 500, commit theo chunk 50k dòng, tắt index phụ trước khi nạp và tạo lại sau; dùng id do ứng dụng sinh ({{UUID}}) hoặc sequence để không bị chặn batching. Có bảng checkpoint để job chạy lại idempotent.
Kết quả đo được: thời gian nạp giảm còn ~3 phút, heap ổn định dưới 512 MB, không ảnh hưởng latency API vì commit ngắn và không giữ connection dài.

### Trả lời mẫu khi phỏng vấn
"Khi nhập khoảng 1 triệu dòng, tôi tối ưu theo hai trục: giảm round-trip và không để persistence context phình to. Nếu vẫn dùng JPA/Hibernate, tôi bật {{hibernate.jdbc.batch_size}} (ví dụ 50-100), {{order_inserts}}, {{order_updates}}, và đảm bảo không dùng {{GenerationType.IDENTITY}} vì nó buộc lấy id sau mỗi insert làm mất batching; đồng thời flush/clear sau mỗi lô. Nhưng với khối lượng lớn và không cần đọc lại entity, tôi ưu tiên {{StatelessSession}} vì nó bỏ qua persistence context, không dirty-check, không cascade nên nhẹ hơn hẳn. Nếu chỉ là nạp dữ liệu thuần, {{JdbcTemplate.batchUpdate}} hoặc COPY của PostgreSQL còn nhanh hơn. Tôi cũng chú ý stream file thay vì load hết vào RAM, commit theo chunk để tránh transaction dài, và thiết kế retry idempotent bằng khoá nghiệp vụ hoặc bảng staging."

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

### Ví dụ đời thực
Triệu chứng: endpoint {{GET /orders?customerId=...}} trả danh sách đơn hàng bắt đầu ném {{LazyInitializationException}} ngẫu nhiên sau khi tắt {{open-in-view}}; khi bật lại OSIV thì response time tăng từ 120 ms lên 1,8 s ở giờ cao điểm.
Điều tra: bật {{hibernate.show_sql}} và đếm query, thấy 1 query lấy {{orders}} + N query load {{items}} cho từng đơn khi Jackson serialize entity. Kiểm tra payload phát hiện field {{internalNote}} và {{discountReason}} (nhạy cảm nội bộ) bị lộ ra client.
Nguyên nhân gốc: controller trả thẳng entity {{Order}} có collection {{@OneToMany}} lazy; serialization kích hoạt lazy load ngoài transaction (lỗi) hoặc trong OSIV (N+1). Entity gắn với schema nên mọi field mới cũng tự lộ.
Cách xử lý: tạo {{OrderRow}} record và dùng constructor expression trong {{@Query}} chỉ chọn cột cần; bỏ OSIV; viết test snapshot JSON để khoá hợp đồng API.
Kết quả đo được: endpoint ổn định 1 query, p95 giảm còn ~90 ms, payload nhỏ hơn 60%, không còn lộ field nội bộ.

### Trả lời mẫu khi phỏng vấn
"Tôi ưu tiên trả DTO thay vì entity cho API vì entity là mô hình persistence, không phải hợp đồng API. Trả entity dễ gây N+1 hoặc {{LazyInitializationException}} khi serialize quan hệ lazy, lộ field nhạy cảm khi schema đổi, và làm API phụ thuộc cấu trúc bảng. Với Spring Data JPA, tôi thường dùng constructor expression trong {{@Query}} để DB chỉ select đúng cột cần và map thẳng vào record DTO, hoặc interface projection dạng closed khi truy vấn đơn giản; native query chỉ dùng khi JPQL không đủ và tôi chấp nhận rủi ro alias. Trong service nội bộ cần nghiệp vụ và update thì tôi vẫn dùng entity. Tôi cũng tắt OSIV và có test snapshot để đảm bảo DTO là hợp đồng ổn định."

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

### Ví dụ đời thực
Triệu chứng: module khách hàng ban đầu dùng {{SINGLE_TABLE}} cho {{Customer}} ({{Individual}}/{{Company}}). Sau 2 năm thêm 4 nhánh con nữa ({{VIP}}, {{Agent}}...), bảng {{customer}} phình lên 60 cột, trong đó ~40% giá trị NULL; truy vấn đọc danh sách khách hàng chậm dần, migration thêm cột {{NOT NULL}} cho nhánh {{Company}} gây lock lâu.
Điều tra: {{EXPLAIN (ANALYZE)}} cho thấy scan bảng rộng, nhiều cột không dùng; kiểm tra schema thấy constraint {{tax_code NOT NULL}} không đặt được vì ảnh hưởng nhánh {{Individual}}. Log deploy ghi nhận ALTER TABLE mất ~8 phút trên bảng 5 triệu dòng.
Nguyên nhân gốc: chọn {{SINGLE_TABLE}} khi cây kế thừa còn phẳng, nhưng về sau mỗi nhánh có nhiều thuộc tính và ràng buộc riêng khiến mô hình "bảng rộng, nhiều NULL" không còn phù hợp.
Cách xử lý: thiết kế lại sang {{JOINED}} cho các nhánh có dữ liệu/constraint riêng: bảng {{customer}} giữ trường chung, {{company}} giữ {{tax_code}} với {{UNIQUE NOT NULL}}, {{individual}} giữ {{id_number}}; migrate dữ liệu bằng job theo batch, thêm index FK.
Kết quả đo được: truy vấn đa hình chậm hơn ~15% (do join) nhưng truy vấn theo từng nhánh nhanh hơn 30%, ràng buộc dữ liệu được DB bảo vệ, migration sau này chỉ ảnh hưởng bảng nhánh liên quan.

### Trả lời mẫu khi phỏng vấn
"Với kế thừa trong JPA tôi cân nhắc ba chiến lược. {{SINGLE_TABLE}} dùng một bảng có cột discriminator, đọc/ghi nhanh và đơn giản nên là mặc định khi cây kế thừa phẳng và ít cột riêng. {{JOINED}} tách mỗi lớp thành một bảng, chuẩn hoá tốt và cho phép constraint riêng từng nhánh, đổi lại truy vấn đa hình phải join nên tốn hơn. {{TABLE_PER_CLASS}} gần như tôi tránh vì truy vấn đa hình phải {{UNION ALL}}, khó phân trang và không dùng được {{IDENTITY}}. Khi chọn, tôi hỏi: nhánh nào cần constraint DB riêng, tần suất truy vấn đa hình so với truy vấn theo nhánh, và chi phí migrate sau này ra sao. Với case {{Customer}} chỉ có {{Individual}}/{{Company}} và khác biệt ít, tôi bắt đầu bằng {{SINGLE_TABLE}}; nếu nhánh phình to và cần ràng buộc mạnh, tôi chuyển sang {{JOINED}} và chấp nhận chi phí join."

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

### Ví dụ đời thực
Triệu chứng: API xem lịch sử giao dịch chạy chậm giờ cao điểm (p95 ~900 ms) và thỉnh thoảng DB primary CPU 85%. Team bật {{@Transactional(readOnly = true)}} và cấu hình read replica, nhưng sau khi chuyển tiền xong, người dùng refresh thấy số dư cũ trong ~2 giây.
Điều tra: log Hibernate cho thấy với {{readOnly}} dirty-checking đã tắt (ít {{UPDATE}} ngầm), song metric replication lag của replica dao động 1-3 giây. Một luồng khác "đọc để validate rồi update" bị đặt nhầm read-only nên {{save()}} không flush, dữ liệu không đổi mà không có lỗi.
Nguyên nhân gốc: nhầm lẫn hai mục tiêu: read-only giúp Hibernate/JDBC tối ưu, còn định tuyến replica là chuyện khác; replica có độ trễ tự nhiên; {{FlushMode.MANUAL}} nuốt thay đổi im lặng.
Cách xử lý: tách rõ service chỉ đọc (read-only, route replica) và service đọc-ghi (primary). Với luồng "read-your-writes" (số dư, trạng thái giao dịch ngay sau ghi) ép đọc từ primary hoặc chờ lag; bỏ read-only ở method có ghi.
Kết quả đo được: p95 API lịch sử giảm còn ~220 ms, CPU primary xuống ~55%, không còn bug "save nhưng không lưu", và luồng số dư luôn đọc đúng từ primary.

### Trả lời mẫu khi phỏng vấn
"Tôi xem {{@Transactional(readOnly = true)}} là gợi ý cho hai lớp. Với Hibernate nó đặt {{FlushMode.MANUAL}}, tắt dirty checking và bỏ snapshot nên tiết kiệm CPU, tránh {{UPDATE}} ngầm. Với JDBC nó gọi {{Connection.setReadOnly(true)}}, tuỳ driver/DB có enforce hay không nên tôi coi đó là lưới an toàn chứ không phải tối ưu chắc chắn. Điều nó không làm là tự route sang read replica: để đọc replica tôi dùng {{AbstractRoutingDataSource}} dựa trên {{TransactionSynchronizationManager.isCurrentTransactionReadOnly()}} và bọc {{LazyConnectionDataSourceProxy}} để quyết định sau khi có transaction. Tôi cũng tách hai câu hỏi: query này có cần ghi không, và dữ liệu này có chấp nhận đọc trễ không. Với số dư hay trạng thái giao dịch ngân hàng tôi luôn đọc từ primary để đảm bảo read-your-writes, còn báo cáo/lịch sử mới cho đi replica."

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

### Ví dụ đời thực
Triệu chứng: hệ thống ngân hàng bị audit yêu cầu giải trình "ai đã đổi địa chỉ và hạn mức của khách hàng X vào ngày 12/10, giá trị trước/sau là gì" và đồng thời phải "không xoá" dữ liệu khách hàng. Thiết kế ban đầu chỉ dùng Spring Data auditing ({{updatedBy}}, {{updatedAt}}) và soft delete.
Điều tra: tra bảng {{customer}} chỉ thấy trạng thái cuối cùng và người sửa lần cuối, không dựng lại được lịch sử 5 lần thay đổi trước đó. Một số bản ghi "đã xoá" vẫn bị query JPQL bulk delete xoá hẳn trong job dọn dữ liệu vì bulk delete bỏ qua {{@SQLDelete}}.
Nguyên nhân gốc: nhầm lẫn ba nhu cầu: auditing hiện tại (ai sửa lần cuối), lịch sử thay đổi (mọi phiên bản), và không xoá vật lý.
Cách xử lý: giữ Spring Data auditing cho trường hiện tại; bật Hibernate Envers cho entity {{Customer}} ({{@Audited}}, bảng {{customer_aud}} + {{revinfo}}) để lưu lịch sử; dùng {{@SQLDelete}}/{{@SQLRestriction}} cho soft delete và cấm bulk delete trên entity này, thay bằng job archive. Thêm unique index partial {{WHERE deleted = false}} cho email.
Kết quả đo được: truy vấn {{AuditReader}} dựng lại được đầy đủ lịch sử tại thời điểm T trong vài giây, vượt qua đợt audit; không còn mất bản ghi do bulk delete, và khách hàng xoá mềm đăng ký lại email được.

### Trả lời mẫu khi phỏng vấn
"Tôi tách ba nhu cầu. Spring Data JPA auditing rất nhẹ, chỉ lưu {{createdBy/Date, lastModifiedBy/Date}} trên chính bảng nên biết ai sửa lần cuối nhưng không có lịch sử. Hibernate Envers ghi mỗi revision vào bảng audit riêng, lưu ảnh chụp qua các lần insert/update/delete nên dựng lại được trạng thái tại thời điểm T, đánh đổi là chi phí ghi và dung lượng bảng audit. Soft delete với {{@SQLDelete}} và {{@SQLRestriction}} đảm bảo không xoá vật lý, nhưng phải cẩn thận: JPQL bulk delete bỏ qua {{@SQLDelete}} sẽ xoá thật, unique constraint vẫn chiếm chỗ, và dữ liệu chỉ lớn dần. Với hệ thống ngân hàng tôi thường dùng kết hợp: auditing cho trạng thái hiện tại, Envers cho entity nhạy cảm cần truy vết, và soft delete kèm index partial, chính sách archive; đồng thời loại trừ field nhạy cảm khỏi audit và dùng {{AuditorAware}} để gắn đúng người thực hiện."

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

### Ví dụ đời thực
Một dev mới viết {{interface OrderRepository extends JpaRepository<Order, Long>}} và method {{findByCustomerEmailAndStatusOrderByCreatedAtDesc}} — Spring Data **tự sinh** JPQL từ tên method lúc khởi động; JPQL được **Hibernate** dịch thành SQL cho PostgreSQL; JPA chỉ là bộ chuẩn API ({{EntityManager}}, annotation) mà Hibernate triển khai. Khi query chậm, dev chỉnh "Spring Data" mà không biết phải nhìn SQL do Hibernate sinh ra: bật {{spring.jpa.show-sql}} (hoặc tốt hơn, log {{org.hibernate.SQL}} + datasource-proxy) mới thấy query JOIN 3 bảng thiếu index. Thêm index {{(customer_email, status, created_at)}}: 2,1 giây → 12ms. Bài học cho team mới: lỗi query thì xem tầng Hibernate (SQL sinh ra), lỗi cấu hình repository thì xem tầng Spring Data, còn hành vi persistence context là tầng JPA/Hibernate.

### Trả lời mẫu khi phỏng vấn
"JPA, nay là Jakarta Persistence, là bộ đặc tả: định nghĩa annotation như Entity, Id, OneToMany, giao diện EntityManager, JPQL và quy tắc vòng đời entity, nhưng không có code chạy. Hibernate là một bản triển khai JPA: nó làm việc thật như sinh SQL theo dialect của DB, persistence context, dirty checking, cache, lazy loading, và có thêm tính năng riêng ngoài chuẩn. Spring Data JPA là lớp trên cùng giúp viết ít code: interface repository, tự sinh query từ tên method, phân trang, projection, và tích hợp transaction của Spring; bên dưới nó vẫn gọi EntityManager của Hibernate. Khi gỡ lỗi, tôi biết lỗi nằm ở tầng nào: query chậm thì xem SQL Hibernate sinh ra, repository hành xử lạ thì xem Spring Data, còn chuyện entity, flush, lazy thì là JPA và Hibernate."

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

### Ví dụ đời thực
Một API tạo bình luận cần gắn với bài viết: code gọi {{postRepository.findById(postId).orElseThrow()}} chỉ để lấy tham chiếu cho {{comment.setPost(post)}} → mỗi request thừa một SELECT lấy cả bài viết (có cột nội dung lớn), 4.000 request/phút. Đổi sang {{getReferenceById(postId)}}: Hibernate trả proxy chỉ có id, INSERT bình luận dùng luôn id đó, không SELECT nào. Một lỗi ngược lại ở chỗ khác: dùng {{getReferenceById}} cho id không tồn tại rồi đọc {{post.getTitle()}} ngoài transaction → {{EntityNotFoundException}}/{{LazyInitializationException}} lúc truy cập, khó hiểu hơn nhiều so với kiểm tra tồn tại ngay. Ngoài ra, một import gọi {{save()}} cho 50.000 entity có id gán sẵn (không sinh tự động): Spring Data coi là entity "không mới" nên gọi {{merge}} → mỗi entity một SELECT trước INSERT. Thêm {{@Version}} (hoặc implement {{Persistable.isNew()}}) để Spring Data dùng {{persist}}: thời gian import từ 6 phút xuống 50 giây.

### Trả lời mẫu khi phỏng vấn
"persist đưa một entity mới vào persistence context, chính object đó trở thành managed, INSERT xảy ra khi flush. merge copy trạng thái của một object, thường là detached, vào một bản managed và trả về bản managed đó; object truyền vào vẫn không được quản lý, và với entity chưa có trong context, merge thường phải SELECT trước. save của Spring Data gọi persist nếu entity được coi là mới, ngược lại gọi merge; với id gán sẵn, Spring Data không biết là mới nên gọi merge kèm SELECT thừa, sửa bằng @Version hoặc Persistable. saveAndFlush thì flush ngay, hữu ích khi cần lỗi constraint lộ ra tại chỗ. findById truy vấn DB và trả Optional; getReferenceById trả proxy chỉ có id, không truy vấn, rất hợp để gán quan hệ, nhưng truy cập field của id không tồn tại sẽ lỗi muộn."

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

### Ví dụ đời thực
- **Triệu chứng:** Sau khi deploy tính năng "xoá học viên khỏi khoá học", buổi tối có báo cáo hàng loạt khoá học của người khác biến mất trong hệ thống đào tạo nội bộ (khoảng 120 khoá, 3.500 học viên bị ảnh hưởng hiển thị). Log ứng dụng không có exception rõ ràng, nhưng bảng {{course}} giảm đột ngột so với bản sao lưu đêm.
- **Điều tra:** Bật {{spring.jpa.show-sql=true}} trên môi trường staging và lặp lại thao tác xoá {{Student}}. Quan sát Hibernate sinh {{DELETE FROM course WHERE id=?}} sau khi xoá dòng trong bảng nối {{student_course}}. Kiểm tra entity {{Student}} thấy {{@ManyToMany}} khai báo cascade gồm {{PERSIST}} và {{REMOVE}}; {{Course}} còn được tham chiếu bởi nhiều {{Student}} khác.
- **Nguyên nhân gốc:** {{CascadeType.REMOVE}} lan thao tác xoá từ {{Student}} sang các entity {{Course}} trong tập hợp. Hibernate phát ra câu {{DELETE}} trực tiếp lên bảng {{course}} (không chỉ xoá dòng trong bảng nối). Ràng buộc khoá ngoại ở bảng nối chỉ ngăn việc tạo dòng **mồ côi (orphan)** trong bảng nối, không ngăn việc xoá bản thân entity {{Course}} – nên entity dùng chung bị xoá theo một học viên duy nhất.
- **Cách xử lý:** Bỏ {{CascadeType.REMOVE}} khỏi quan hệ {{@ManyToMany}}, chỉ giữ {{PERSIST}} và {{MERGE}} nếu thực sự cần. Đổi thao tác "rời khoá" thành {{student.getCourses().remove(course)}} trên owning side để Hibernate chỉ xoá bản ghi trong bảng nối. Khôi phục dữ liệu từ bản sao lưu và chạy script đối chiếu.
- **Kết quả đo được:** Kiểm thử tích hợp xác nhận xoá {{Student}} không còn phát sinh câu {{DELETE}} trên {{course}}. Sự cố không tái diễn, thời gian khôi phục khoảng 40 phút nhờ có quy trình sao lưu rõ ràng.

### Trả lời mẫu khi phỏng vấn
"Em hiểu CascadeType là cơ chế lan thao tác từ entity cha xuống entity con, còn FetchType quyết định nạp quan hệ ngay hay trì hoãn. Mặc định thì ManyToOne và OneToOne là EAGER, OneToMany và ManyToMany là LAZY, nên em luôn đặt LAZY tường minh cho ManyToOne để tránh N+1 ngầm. Bẫy nguy hiểm nhất là cascade REMOVE trên ManyToMany: khi xoá một bản ghi cha, Hibernate có thể cố xoá entity con vốn đang được nhiều cha khác tham chiếu, dẫn đến mất dữ liệu dùng chung hoặc lỗi ràng buộc khoá ngoại. Cách đúng là không dùng REMOVE ở ManyToMany, chỉ thao tác trên tập hợp để Hibernate xoá dòng trong bảng nối; với quan hệ OneToMany sở hữu thực sự thì mới cân nhắc orphanRemoval. Trong thực tế em từng xử lý sự cố xoá nhầm dữ liệu do cascade sai, từ đó team quy ước chỉ dùng PERSIST và MERGE cho aggregate root và review kỹ mọi cascade trong code."

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

### Ví dụ đời thực
- **Triệu chứng:** Trang danh sách đơn hàng của khách hàng lớn (khoảng 2 triệu đơn trong bảng) phản hồi chậm, P95 từ 200 ms tăng lên 3,8 giây vào giờ cao điểm. CPU cơ sở dữ liệu (database – nơi lưu dữ liệu) tăng rõ dù số request không đổi nhiều.
- **Điều tra:** Bật log SQL và quan sát mỗi lần gọi API phân trang sinh hai câu: câu lấy dữ liệu có {{LIMIT/OFFSET}} và một câu {{SELECT count(*) ...}} kèm nhiều {{JOIN}} giống hệt truy vấn chính. Dùng {{EXPLAIN ANALYZE}} thấy câu count quét và join hàng triệu dòng chỉ để trả về tổng số.
- **Nguyên nhân gốc:** Repository trả về {{Page}} nên Spring Data tự sinh count query; truy vấn gốc dùng {{@Query}} với join phức tạp và count query kế thừa các join không cần thiết cho việc đếm.
- **Cách xử lý:** Đổi kiểu trả về sang {{Slice}} cho màn hình "xem thêm" vì giao diện chỉ cần biết còn trang tiếp hay không. Với màn hình quản trị thực sự cần tổng số trang, viết {{countQuery}} tường minh bỏ bớt join không ảnh hưởng kết quả đếm và bổ sung index phù hợp cho điều kiện lọc.
- **Kết quả đo được:** API danh sách chính giảm còn khoảng 220 ms P95 và không còn câu count nặng; màn hình quản trị dùng count tuỳ chỉnh giảm từ 3,2 giây xuống còn 450 ms trên cùng tập dữ liệu.

### Trả lời mẫu khi phỏng vấn
"Với Spring Data JPA em phân biệt ba cách: derived query method nhanh và được kiểm tra lúc khởi động, @Query JPQL linh hoạt cho projection và join fetch, còn native SQL dùng khi cần tính năng riêng của cơ sở dữ liệu. Khi dùng Pageable, Spring Data thường chạy hai câu: một câu lấy dữ liệu có LIMIT OFFSET và một câu count để tính tổng. Điểm cần lưu ý là count query không có ORDER BY nhưng vẫn giữ WHERE và JOIN, nên trên bảng lớn nó có thể rất chậm. Trong thực tế em ưu tiên trả Slice cho danh sách kiểu cuộn vì chỉ cần hasNext và không tốn count; nếu bắt buộc dùng Page thì em viết countQuery tường minh, bỏ join thừa nhưng giữ đúng điều kiện lọc, và kiểm tra bằng EXPLAIN ANALYZE. Cách tiếp cận này giúp cân bằng giữa trải nghiệm người dùng và chi phí truy vấn."

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

### Hiểu nhanh
Hãy hình dung một cuốn sổ ghi chép mà bạn **không bao giờ tẩy**: muốn sửa số dư, bạn gạch dòng cũ và viết dòng mới bên dưới, vì có người khác có thể vẫn đang đọc dòng cũ. Theo thời gian, sổ đầy những dòng bị gạch (dead tuple) – sổ dày lên dù thông tin thật không nhiều hơn (bloat). VACUUM là người dọn dẹp: xoá những dòng gạch mà không còn ai đọc, để chỗ trống cho dòng mới. Mỗi dòng còn ghi "số hiệu người viết" (xid), nhưng sổ chỉ có 4 tỷ số hiệu rồi phải quay lại từ đầu – nên những dòng rất cũ phải được đóng dấu "cũ vĩnh viễn" (freeze) trước khi số hiệu quay vòng. Một người đọc chậm chạp giữ sổ hàng giờ (transaction dài) sẽ khiến không dòng nào được dọn hay đóng dấu.

### Thuật ngữ
- **Tuple**: một phiên bản vật lý của một dòng trong bảng PostgreSQL.
- **Dead tuple**: phiên bản đã bị xoá/thay thế và không còn transaction nào nhìn thấy, chờ VACUUM dọn.
- **Bloat**: dung lượng bảng/index lớn hơn nhiều so với dữ liệu thật vì chứa dead tuple hoặc khoảng trống.
- **xid (transaction id)**: số 32 bit cấp cho mỗi transaction có ghi.
- **Freeze**: đánh dấu tuple đủ cũ là "thấy được với mọi transaction" để không phải so xid nữa.
- **Wraparound**: khi xid quay vòng, tuple cũ chưa freeze bị hiểu nhầm là "của tương lai" và biến mất khỏi kết quả đọc.
- **Autovacuum**: tiến trình nền tự chạy VACUUM/ANALYZE khi bảng vượt ngưỡng thay đổi.
- **xmin horizon**: xid nhỏ nhất mà một snapshot còn sống cần; VACUUM không dọn được gì mới hơn mốc này.

### Một UPDATE đi qua vòng đời, từng bước
~~~text
t0  UPDATE id=1 (xid 100):  [v1 xmin=90 xmax=100 (dead)] [v2 xmin=100 xmax=0 (live)]
t1  Session X đang mở transaction từ trước xid 100 -> vẫn cần v1 -> VACUUM bỏ qua v1
t2  Session X commit -> xmin horizon tiến lên -> VACUUM đánh dấu chỗ của v1 là trống
t3  INSERT/UPDATE sau tái dùng chỗ trống đó (file không nhỏ đi, chỉ không to thêm)
age(datfrozenxid): 0 ... 200 triệu (autovacuum ép freeze) ... ~2,1 tỷ (dừng nhận ghi)
~~~
1. **UPDATE ghi phiên bản mới**, không sửa tại chỗ. Vì sao: người đọc đang dùng snapshot cũ vẫn phải thấy v1.
2. **v1 thành dead** khi mọi snapshot còn sống đều mới hơn xid 100. Vì sao phải chờ: dọn sớm sẽ làm người đọc cũ mất dữ liệu.
3. **VACUUM dọn và ghi vào free space map**. Vì sao file không co lại: trả chỗ cho OS phải viết lại file (VACUUM FULL), quá đắt khi bảng đang chạy.
4. **VACUUM freeze tuple cũ**, đẩy {{datfrozenxid}} lên. Vì sao bắt buộc: chỉ ~2,1 tỷ xid là "quá khứ", không freeze thì tới lúc DB phải dừng ghi để tự bảo vệ.
5. **Transaction dài chặn cả bước 2 và 4**: xmin horizon đứng yên nên dead tuple không dọn, tuple không freeze được.

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

### Lỗi hay gặp
- **Ứng dụng quên commit (idle in transaction)** sau một exception bị nuốt. Triệu chứng – bảng update nhiều phình gấp 5–10 lần, query chậm dần qua vài ngày. Cách tránh: {{idle_in_transaction_session_timeout}}, cảnh báo transaction mở quá 5 phút qua {{pg_stat_activity.xact_start}}.
- **Replication slot bị bỏ rơi** (consumer CDC đã tắt): slot giữ xmin/WAL cũ. Triệu chứng – đĩa đầy WAL, vacuum không dọn. Cách tránh: theo dõi {{pg_replication_slots}}, xoá slot không dùng, đặt {{max_slot_wal_keep_size}}.
- **Chạy VACUUM FULL giờ cao điểm để "giải phóng đĩa"**: khoá ACCESS EXCLUSIVE, cả bảng đứng. Cách tránh: dùng extension {{pg_repack}} (viết lại online), hoặc chấp nhận bloat và chỉnh autovacuum.
- **Bỏ qua cảnh báo tuổi xid**: triệu chứng – log "database must be vacuumed within N transactions". Cách tránh: theo dõi {{age(datfrozenxid)}} trong {{pg_database}}, cảnh báo ở mốc vài trăm triệu.

### Trả lời miệng 1 phút
"Trong PostgreSQL, UPDATE không sửa tại chỗ mà tạo tuple mới, tuple cũ được đánh xmax và thành dead tuple khi không còn snapshot nào cần nó. VACUUM dọn dead tuple để chỗ trống được tái dùng, đồng thời freeze tuple cũ vì xid chỉ có 32 bit – không freeze kịp thì tới gần wraparound PostgreSQL sẽ ngừng nhận ghi. Bloat là hệ quả khi dọn không kịp. Transaction dài là thủ phạm chung: nó giữ xmin horizon nên chặn cả dọn rác lẫn freeze, lại giữ lock và connection. Trade-off của MVCC là đọc không chặn ghi nhưng phải trả bằng việc dọn dẹp. Trong thực tế tôi chỉnh autovacuum theo từng bảng lớn, đặt idle_in_transaction_session_timeout và cảnh báo trên transaction dài, replication slot và tuổi xid."

### Ví dụ đời thực
- **Triệu chứng:** Bảng {{transaction_log}} (khoảng 300 triệu dòng, cập nhật trạng thái liên tục) tăng dung lượng từ 120 GB lên 380 GB trong 10 ngày, truy vấn đọc chậm dần từ 40 ms lên 600 ms dù lượng dữ liệu logic không đổi. Giám sát cũng thấy {{n_dead_tup}} tăng liên tục.
- **Điều tra:** Kiểm tra {{pg_stat_activity}} thấy một phiên ở trạng thái {{idle in transaction}} (giao dịch treo chưa kết thúc) đã mở hơn 6 giờ do job báo cáo quên commit; {{pg_stat_user_tables}} cho thấy autovacuum chạy nhưng {{n_dead_tup}} không giảm. Theo dõi {{age(datfrozenxid)}} trong {{pg_database}} tăng nhanh.
- **Nguyên nhân gốc:** Giao dịch dài giữ {{xmin}} horizon thấp, khiến VACUUM không thể dọn dead tuple mới hơn mốc đó và cũng không freeze được; dead tuple tích luỹ gây bloat, file dữ liệu phình và index kém hiệu quả.
- **Cách xử lý:** Kết thúc phiên treo an toàn sau khi phối hợp, đặt {{idle_in_transaction_session_timeout = '5min'}} và {{statement_timeout}} cho ứng dụng; tinh chỉnh autovacuum cho bảng lớn (giảm scale factor, tăng tốc độ dọn). Chạy {{VACUUM (ANALYZE)}} trong giờ thấp điểm và lên kế hoạch {{pg_repack}} để thu gọn bảng nếu cần.
- **Kết quả đo được:** Sau 2 giờ dọn dẹp, {{n_dead_tup}} giảm hơn 85%, truy vấn đọc ổn định lại quanh 50-70 ms; cảnh báo tuổi giao dịch giảm dần và dung lượng tái sử dụng được mà không cần {{VACUUM FULL}} gây khoá dài.

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

### Hiểu nhanh
Mỗi loại index là một kiểu **sổ tra cứu** khác nhau. B-tree là mục lục sắp xếp theo chữ cái – tra từ chính xác hoặc một khoảng đều nhanh. Partial index là **sổ chỉ ghi các đơn chưa xử lý** – mỏng, tra cực nhanh, nhưng vô dụng nếu bạn tìm đơn đã xong. Expression index là mục lục theo **tên viết thường** – bạn phải tra bằng tên viết thường mới thấy. GIN là **bảng tra từ khoá cuối sách**: mỗi từ chỉ ra mọi trang có nó, hợp với JSON, mảng, full-text. BRIN là **nhãn trên gáy từng thùng hồ sơ** "tháng 1/2026": không chỉ đúng tờ, nhưng cho biết khỏi mở thùng nào – hiệu quả khi hồ sơ được xếp theo thời gian.

### Thuật ngữ
- **Partial index**: index có mệnh đề {{WHERE}}, chỉ chứa các dòng thoả điều kiện.
- **Expression index**: index trên kết quả của một biểu thức/hàm thay vì cột thô.
- **GIN (Generalized Inverted Index)**: index ngược, ánh xạ từng phần tử (key JSON, từ, phần tử mảng) tới các dòng chứa nó.
- **BRIN (Block Range Index)**: lưu min/max cho mỗi dải page liên tiếp.
- **Correlation**: mức độ thứ tự giá trị cột khớp với thứ tự vật lý của dòng trên đĩa ({{pg_stats.correlation}} gần 1 là tốt cho BRIN).
- **Recheck / lossy**: index chỉ trả "có thể khớp", DB phải đọc dòng thật để kiểm tra lại.
- **Pending list**: vùng đệm của GIN chứa entry mới chưa được gộp vào cấu trúc chính.
- **Generic plan**: plan dùng chung cho mọi giá trị tham số của prepared statement.

### Chọn index cho bảng log, từng bước
~~~text
transaction_log: 2 tỷ dòng, ~400GB, chỉ INSERT, created_at tăng dần
B-tree(created_at): ~45GB, mỗi INSERT cập nhật cây
BRIN(created_at)  : vài trăm KB, query 1 giờ dữ liệu -> chỉ đọc vài dải page
 page range: [0-127] 01/01 00:00-00:07 | [128-255] 00:07-00:15 | ...
~~~
1. **Liệt kê query thật**: "log của tài khoản X trong 7 ngày", "tổng theo giờ". Vì sao: index phục vụ query, không phục vụ bảng.
2. **Kiểm tra correlation** của {{created_at}}: ~1 vì chỉ append. Vì sao: BRIN chỉ có ích khi mỗi dải page chứa một khoảng giá trị hẹp.
3. **Cột thời gian dùng BRIN**, cột tra cứu chính xác như {{account_id}} vẫn cần B-tree (thường composite {{(account_id, created_at)}}). Vì sao: BRIN không tìm được một giá trị rải rác khắp bảng.
4. **Trạng thái nghiệp vụ hiếm** ("FAILED cần đối soát") dùng partial index. Vì sao: chỉ chứa vài nghìn dòng thay vì hàng tỷ.
5. **Đo bằng EXPLAIN** – với BRIN nhìn "Rows Removed by Index Recheck" và số "lossy heap blocks" để biết độ chính xác.

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

### Lỗi hay gặp
- **Tạo BRIN cho cột không tương quan** (ví dụ {{customer_id}} hay dữ liệu có UPDATE nhiều làm dòng di chuyển). Triệu chứng – index tồn tại nhưng plan vẫn đọc gần hết bảng. Cách tránh: xem {{pg_stats.correlation}} trước khi tạo.
- **Expression index với hàm không IMMUTABLE**: PostgreSQL từ chối tạo (ví dụ {{to_tsvector}} một tham số phụ thuộc cấu hình). Cách tránh: dùng phiên bản có tham số cố định như {{to_tsvector('simple', body)}}.
- **GIN trên cả JSONB lớn chỉ để tra một key**: index to, ghi chậm. Cách tránh: expression B-tree trên {{(payload->>'orderId')}}.
- **Partial index với điều kiện tham số hoá**: ORM sinh {{status = ?}}, sau 5 lần chạy có thể chuyển sang generic plan và bỏ qua partial index. Cách tránh: viết literal trong query (giá trị cố định, không phải input người dùng) hoặc kiểm tra plan với tham số.

### Trả lời miệng 1 phút
"B-tree là mặc định cho equality, range và sort. Partial index chỉ lập chỉ mục phần dữ liệu có điều kiện, ví dụ đơn PENDING, nên nhỏ và rẻ, nhưng planner phải chứng minh được điều kiện query bao hàm điều kiện index. Expression index lập theo biểu thức như lower(email), query phải viết đúng biểu thức đó. GIN là index ngược cho JSONB, mảng, full-text, đọc rất nhanh nhưng ghi đắt hơn. BRIN chỉ lưu min max theo dải page, cực nhỏ, hợp với dữ liệu append-only theo thời gian. Với bảng log khổng lồ tôi dùng BRIN cho created_at, B-tree composite cho account_id cộng thời gian, partial index cho trạng thái hiếm, và thường kết hợp partition theo tháng. Luôn kiểm tra bằng EXPLAIN chứ không đoán."

### Ví dụ đời thực
- **Triệu chứng:** Bảng {{transaction_log}} chỉ ghi thêm (append-only – chỉ thêm dòng mới, không sửa), khoảng 2 tỷ dòng và 400 GB, truy vấn "xem log theo khoảng 1 giờ" mất 12-15 giây; dung lượng index B-tree trên {{created_at}} chiếm gần 45 GB và thời gian ghi tăng nhẹ.
- **Điều tra:** Chạy {{EXPLAIN (ANALYZE, BUFFERS)}} thấy index scan trên B-tree lớn nhưng vẫn đọc nhiều page; kiểm tra {{pg_stats.correlation}} của cột {{created_at}} gần 1 (dữ liệu ghi theo thời gian). Đánh giá truy vấn thực tế: đa số lọc theo khoảng thời gian và một số ít theo {{account_id}}.
- **Nguyên nhân gốc:** Dùng B-tree cho cột thời gian tăng dần trên bảng khổng lồ tốn rất nhiều dung lượng và chi phí cập nhật, trong khi tính chất dữ liệu có tương quan vật lý cao phù hợp hơn với BRIN (Block Range Index – index tóm tắt min/max theo dải trang).
- **Cách xử lý:** Tạo {{BRIN}} trên {{created_at}} với {{pages_per_range}} phù hợp, giữ B-tree composite {{(account_id, created_at)}} cho truy vấn tra cứu theo tài khoản, và thêm partial index cho trạng thái hiếm cần xử lý. Thử nghiệm trên môi trường giống production trước khi áp dụng.
- **Kết quả đo được:** Dung lượng index thời gian giảm từ ~45 GB xuống còn vài MB; truy vấn theo khoảng 1 giờ giảm còn khoảng 0,8-1,2 giây nhờ đọc ít dải trang hơn, tốc độ ghi cải thiện do bớt cập nhật B-tree lớn.

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

### Hiểu nhanh
Partition giống việc lưu **hoá đơn theo từng hộp tháng** thay vì dồn chung một kho. Khi cần hoá đơn tháng 3, bạn chỉ mở hộp tháng 3 (pruning). Khi hết hạn lưu trữ 5 năm, bạn **vứt cả hộp** của tháng cũ nhất (drop partition) thay vì ngồi rút từng tờ (DELETE). Nhưng có một luật: muốn đảm bảo "số hoá đơn không trùng", mỗi hộp chỉ tự kiểm tra trong hộp của mình – nên khoá duy nhất phải chứa cả **tháng**, vì DB không có sổ chung để kiểm tra xuyên hộp.

### Thuật ngữ
- **Partitioned table (bảng cha)**: bảng logic không chứa dữ liệu, chỉ định tuyến dòng vào các partition.
- **Partition key**: cột (hoặc biểu thức) quyết định dòng thuộc partition nào, ở đây {{created_at}}.
- **Partition pruning**: loại bỏ partition không thể chứa dữ liệu khớp điều kiện – lúc lập plan hoặc lúc thực thi.
- **DEFAULT partition**: partition hứng mọi dòng không thuộc khoảng nào.
- **ATTACH / DETACH**: gắn một bảng có sẵn thành partition / tách partition ra thành bảng độc lập.
- **Global index**: index duy nhất trải qua mọi partition – PostgreSQL **không có**, mỗi partition có index riêng.
- **Metadata lock**: (MySQL) khoá trên định nghĩa bảng, DDL cần nó và sẽ chặn query nếu phải chờ.

### Một ngày vận hành bảng partition, từng bước
~~~text
transaction_log (cha, PARTITION BY RANGE created_at)
 |- _2024_01 ... _2026_03   (cũ, chỉ đọc)       -> sau 24 tháng: DETACH CONCURRENTLY, archive S3, DROP
 |- _2026_04                (tháng hiện tại, ghi ~27 triệu dòng)
 |- _2026_05, _2026_06      (tạo trước 2 tháng bởi job hằng ngày)
 '- _default                (phải luôn rỗng - có dòng là cảnh báo)
800 triệu dòng / 30 tháng ≈ 27 triệu dòng mỗi partition
~~~
1. **Job hằng ngày tạo partition cho 1–2 tháng tới** (pg_partman hoặc cron tự viết). Vì sao: INSERT vào khoảng chưa có partition sẽ fail.
2. **Query luôn kèm điều kiện thời gian**: planner prune xuống 1–2 partition. Vì sao: mỗi partition 27 triệu dòng, index nhỏ, nằm gọn trong RAM.
3. **Partition cũ có thể chuyển sang tablespace rẻ** hoặc nén, vì chỉ đọc. Vì sao: dữ liệu nóng/lạnh tách bạch.
4. **Hết hạn lưu trữ thì DETACH rồi DROP**: xong trong mili giây, không sinh WAL hàng triệu dòng, không tạo dead tuple. Vì sao so với DELETE: DELETE 27 triệu dòng sinh hàng chục GB WAL, làm replica lag và để lại bloat.
5. **Giám sát partition DEFAULT** và việc "đã có partition tháng sau chưa" bằng cảnh báo.

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
- **Vá lỗi dữ liệu sai năm**: có thể {{ATTACH}} một bảng đã chứa dữ liệu vào partition tương ứng (nếu bảng chưa có index khớp với index của bảng cha, PostgreSQL sẽ tự tạo trong lúc attach – tốn thời gian và giữ khoá, nên tạo sẵn index trước).

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

### Lỗi hay gặp
- **Tìm theo {{id}} mà không có {{created_at}}**: plan quét index của mọi partition (30+ lần index lookup). Triệu chứng – API "lấy giao dịch theo id" chậm sau khi partition. Cách tránh: đưa {{created_at}} vào khoá API/URL, hoặc encode thời gian trong id (UUIDv7/snowflake) để suy ra partition.
- **Hibernate entity với PK composite mới**: quên đổi mapping thành {{@IdClass}}/{{@EmbeddedId}}. Cách tránh: đổi mapping cùng lúc với migration, hoặc giữ {{@Id}} trên id nhưng hiểu rằng tính duy nhất chỉ còn do sequence bảo đảm.
- **Tạo index trên bảng cha khi đã có hàng chục partition lớn**: lệnh khoá ghi rất lâu ({{CONCURRENTLY}} không dùng được trực tiếp trên bảng cha). Cách tránh: tạo index {{ON ONLY}} bảng cha, tạo {{CONCURRENTLY}} trên từng partition, rồi {{ALTER INDEX ... ATTACH PARTITION}}.

### Trả lời miệng 1 phút
"Với bảng giao dịch 800 triệu dòng, tôi partition theo RANGE trên created_at, mỗi tháng một partition. Khi query có điều kiện thời gian, planner prune và chỉ đọc partition liên quan, kể cả runtime pruning với tham số. Lợi ích lớn nhất là xoá dữ liệu cũ bằng detach và drop partition, gần như tức thời, không sinh WAL và bloat như DELETE. Vận hành hằng ngày gồm tạo partition trước bằng job, cảnh báo nếu partition DEFAULT có dữ liệu. Ràng buộc đau nhất là unique và primary key phải chứa cột partition, nên PK thành (id, created_at) và mọi đường truy cập theo id phải biết thời gian. Kinh nghiệm của tôi là quyết định thiết kế khoá này trước khi bảng lớn, vì đổi về sau rất tốn kém."

### Ví dụ đời thực
- **Triệu chứng:** Bảng {{orders}} tích luỹ 800 triệu dòng sau 3 năm, job xoá dữ liệu cũ hơn 24 tháng bằng {{DELETE}} chạy mỗi đêm mất 4-5 giờ, tạo nhiều WAL (write-ahead log – nhật ký ghi trước để đảm bảo an toàn dữ liệu) khiến replica (bản sao) trễ 20 phút và bảng bị bloat.
- **Điều tra:** Theo dõi {{pg_stat_statements}} và log thấy câu {{DELETE}} quét và xoá hàng chục triệu dòng mỗi lần; {{EXPLAIN}} cho truy vấn báo cáo theo tháng vẫn quét nhiều dữ liệu không cần thiết. Kiểm tra dung lượng cho thấy chỉ mục và bảng phình sau các đợt xoá lớn.
- **Nguyên nhân gốc:** Lưu toàn bộ dữ liệu trong một bảng lớn khiến việc dọn dữ liệu theo chu kỳ và truy vấn theo khoảng thời gian đều tốn kém; {{DELETE}} hàng loạt sinh dead tuple và ghi nhật ký lớn.
- **Cách xử lý:** Thiết kế lại bảng theo partition {{RANGE}} trên {{created_at}} (mỗi tháng một partition – bảng con), đổi khoá chính thành {{(id, created_at)}} để thoả ràng buộc unique phải chứa cột partition. Thiết lập job tạo partition trước, chuyển lưu trữ dữ liệu cũ bằng {{DETACH}} rồi {{DROP}} partition.
- **Kết quả đo được:** Việc loại bỏ dữ liệu tháng cũ hoàn tất trong dưới 1 giây thay vì nhiều giờ, replica không còn trễ do xoá lớn; truy vấn báo cáo theo tháng giảm từ 6 giây xuống còn khoảng 400 ms nhờ partition pruning (bộ tối ưu bỏ qua các partition không liên quan).

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

### Hiểu nhanh
Ghép danh sách 1000 đơn hàng với danh sách khách hàng có ba cách. **Nested loop**: cầm từng đơn, tra danh bạ (index) tìm khách – nhanh nếu chỉ có 10 đơn, mệt nếu có 1 triệu. **Hash join**: chép danh sách khách vào một cuốn sổ chia ngăn theo chữ cái đầu (bảng băm), rồi lướt qua các đơn, mỗi đơn mở đúng ngăn – nhanh cho khối lượng lớn nhưng cần bàn đủ rộng để bày sổ (bộ nhớ). **Merge join**: cả hai danh sách đều đã xếp theo mã khách, bạn dò hai ngón tay song song từ trên xuống. Optimizer chọn cách nào dựa trên **ước đoán số dòng** – đoán sai thì chọn sai.

### Thuật ngữ
- **Outer / inner (build / probe)**: vế được duyệt ngoài vòng lặp / vế bị tra cứu; với hash join, vế build dựng bảng băm, vế probe đi dò.
- **Cardinality estimate**: số dòng optimizer dự đoán mỗi node sẽ trả về.
- **work_mem**: bộ nhớ cho mỗi thao tác sort/hash; PostgreSQL 13+ cho hash dùng {{work_mem × hash_mem_multiplier}} (mặc định 2.0 từ bản 15).
- **Spill / Batches**: dữ liệu không vừa bộ nhớ phải ghi tạm ra đĩa, chia thành nhiều lô.
- **default_statistics_target**: số mẫu/khoảng histogram thu thập cho mỗi cột khi ANALYZE.
- **Extended statistics**: thống kê nhiều cột cùng lúc để optimizer biết các cột phụ thuộc nhau.
- **Visibility map**: bản đồ đánh dấu page mà mọi tuple đều visible, cho phép index-only scan bỏ qua heap.

### Optimizer chọn sai như thế nào, từng bước
~~~text
WHERE country = 'VN' AND city = 'Hanoi'
ước tính: P(VN)=0.1 x P(Hanoi)=0.05 x 1.000.000 = 5.000 dòng (giả định độc lập)
thực tế : mọi Hanoi đều là VN -> 50.000 dòng (lệch 10 lần)
=> chọn Nested Loop cho 5.000 dòng, thực tế chạy 50.000 lần index lookup
~~~
1. **Ước số dòng mỗi node** từ thống kê cột. Vì sao dễ sai: mặc định optimizer coi các cột là **độc lập** và nhân xác suất.
2. **Tính cost từng thuật toán** với số dòng đó: nested loop ~ rows_outer × cost_lookup; hash join ~ build + probe tuyến tính; merge join ~ sort (nếu chưa có thứ tự) + merge. Vì sao: với ít dòng ngoài, nested loop thắng; nhiều dòng thì hash thắng.
3. **Chọn plan cost thấp nhất**. Khi ước 5.000 mà thật 50.000, cost của nested loop bị đánh giá thấp 10 lần.
4. **Sửa ở gốc**: {{CREATE STATISTICS ... (dependencies)}} trên {{(country, city)}} rồi {{ANALYZE}} → ước tính về gần 50.000 → planner tự chọn hash join.

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

### Lỗi hay gặp
- **Dùng {{enable_nestloop = off}} trên production để "sửa" plan**: cứu một query nhưng làm hỏng các query khác dùng chung session/role. Cách tránh: chỉ dùng để chẩn đoán, sửa bằng thống kê/index; nếu buộc phải ép plan thì dùng {{SET LOCAL}} trong đúng transaction.
- **Batch insert lớn rồi query ngay**: autoanalyze chưa kịp chạy, thống kê nghĩ bảng còn rỗng. Triệu chứng – job ETL chậm bất thường ở bước ngay sau load. Cách tránh: gọi {{ANALYZE table}} tường minh sau khi load.
- **Join trên cột khác kiểu** ({{bigint}} với {{varchar}}, hoặc {{numeric}} với {{int}}): index không dùng được, phải ép kiểu từng dòng. Cách tránh: thống nhất kiểu dữ liệu của FK và PK.

### Trả lời miệng 1 phút
"Nested loop duyệt từng dòng vế ngoài và tra vế trong qua index, tốt khi vế ngoài nhỏ. Hash join dựng bảng băm từ vế nhỏ rồi quét vế lớn, tốt cho join lớn không có index nhưng cần work_mem, thiếu thì spill ra đĩa với Batches lớn hơn 1. Merge join trộn hai dãy đã sắp xếp, tốt khi cả hai lớn và có sẵn thứ tự. Khi đọc plan, tôi so estimated rows với actual rows ở từng node: lệch lớn gần như luôn là nguyên nhân optimizer chọn sai thuật toán, thường do thống kê cũ, các cột tương quan, hoặc generic plan. Tôi sửa bằng ANALYZE, tăng statistics target, extended statistics, còn tắt enable_hashjoin chỉ để chẩn đoán. Kinh nghiệm: sửa ước lượng thì planner tự chọn đúng, ép plan chỉ là băng dán tạm."

### Ví dụ đời thực
- **Triệu chứng:** Truy vấn báo cáo doanh thu theo khu vực (join {{orders}} ~5 triệu dòng với {{customers}} ~1 triệu dòng) sau một đợt nhập dữ liệu tăng từ 1,2 giây lên 25 giây, trong khi code không thay đổi.
- **Điều tra:** Chạy {{EXPLAIN (ANALYZE, BUFFERS)}} thấy planner chọn Nested Loop với ước lượng 2.000 dòng ở vế ngoài nhưng thực tế trả về 80.000 dòng, dẫn đến hàng chục nghìn lần tra cứu index. Kiểm tra thống kê cột {{country}} và {{city}} cho thấy chưa phản ánh dữ liệu mới và hai cột có tương quan mạnh.
- **Nguyên nhân gốc:** Thống kê lỗi thời sau bulk insert và optimizer giả định các cột độc lập, ước lượng cardinality (số dòng ước tính) sai lệch lớn nên đánh giá chi phí Nested Loop thấp hơn Hash Join.
- **Cách xử lý:** Chạy {{ANALYZE}} cho các bảng liên quan, tăng {{default_statistics_target}} cho cột phân bố phức tạp và tạo extended statistics {{(dependencies)}} trên {{(country, city)}}. Kiểm tra lại plan và điều chỉnh {{work_mem}} ở mức phiên khi cần để tránh spill.
- **Kết quả đo được:** Ước lượng dòng tiệm cận thực tế, planner chuyển sang Hash Join phù hợp; thời gian truy vấn giảm còn khoảng 1,4 giây và ổn định qua các lần chạy tiếp theo.

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

### Hiểu nhanh
Primary giống **văn phòng chính** nơi mọi hợp đồng được ký; replica là **chi nhánh nhận bản photo** hợp đồng qua bưu điện. Bản photo luôn tới sau bản gốc một chút – vài mili giây khi bình thường, vài giây hoặc vài phút khi bưu điện tắc. Khách vừa ký hợp đồng ở văn phòng chính rồi chạy sang chi nhánh hỏi "hợp đồng của tôi đâu?" sẽ nhận câu trả lời "chưa có". Read-your-writes là luật "ai vừa ký thì trong ít phút tới hãy hỏi ở văn phòng chính", hoặc chi nhánh phải chờ bản photo về rồi mới trả lời.

### Thuật ngữ
- **WAL (Write-Ahead Log)**: nhật ký mọi thay đổi; replica nhận WAL qua streaming và áp dụng lại (replay).
- **LSN (Log Sequence Number)**: vị trí byte trong WAL, tăng dần – dùng để so replica đã theo kịp tới đâu.
- **Replication lag**: khoảng cách (byte hoặc thời gian) giữa primary và replica.
- **Hot standby**: replica cho phép chạy query đọc trong khi đang replay.
- **Asynchronous / synchronous replication**: primary trả commit không chờ / có chờ replica xác nhận.
- **Read-your-writes**: bảo đảm người dùng luôn thấy dữ liệu chính mình vừa ghi.
- **AbstractRoutingDataSource**: DataSource của Spring chọn DataSource đích theo một key ở mỗi lần lấy connection.
- **RPO**: lượng dữ liệu tối đa chấp nhận mất khi sự cố.

### Đường đi của một giao dịch chuyển tiền
~~~text
t=0ms   App -> PRIMARY: INSERT transfer; COMMIT (LSN 0/5A00010)
t=1ms   App trả 200 OK, client chuyển màn hình
t=3ms   Client GET /transactions -> REPLICA (replay_lsn = 0/59FFF00 < 0/5A00010)
        => KHÔNG THẤY giao dịch
t=40ms  REPLICA replay tới 0/5A00010 -> giờ mới thấy
Lúc tải cao/VACUUM lớn: lag 40ms -> 8s => lỗi thành "thường xuyên"
~~~
1. **Commit trên primary** ghi WAL và flush; với async replication, primary trả OK ngay. Vì sao: không chờ mạng để giữ latency ghi thấp.
2. **WAL sender gửi WAL** sang replica, replica ghi rồi replay. Vì sao có lag: mạng + I/O + replay đơn luồng.
3. **Query đọc tới replica** trước khi replay xong LSN của giao dịch → không thấy dữ liệu.
4. **Giải pháp đọc-sau-ghi**: lưu LSN (hoặc thời điểm) lần ghi cuối vào session; trong N giây sau đó, hoặc khi {{pg_last_wal_replay_lsn()}} của replica còn nhỏ hơn LSN đó, định tuyến đọc về primary.

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
4. **Replay bị chặn bởi query dài chạy trên replica**: khi WAL sắp xoá những phiên bản dòng mà một câu {{SELECT}} dài trên replica vẫn cần (ví dụ do VACUUM trên primary dọn dead tuple), replay bị trì hoãn tối đa {{max_standby_streaming_delay}} (mặc định 30s) rồi PostgreSQL **huỷ query** đó ("canceling statement due to conflict with recovery"). Bật {{hot_standby_feedback}} giảm huỷ query nhưng đổi lại gây bloat trên primary.
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

### Lỗi hay gặp
- **{{@Transactional(readOnly = true)}} ở service gọi từ trong một transaction ghi**: transaction ngoài đã giữ connection primary, routing không đổi – đây là hành vi đúng, nhưng dev tưởng đã đọc replica. Ngược lại, gọi method readOnly **ngay sau** method ghi (hai transaction riêng) thì lại đọc replica và dính lag. Cách tránh: đánh dấu rõ màn hình nào cần read-your-writes và để chúng đọc primary.
- **Không có giới hạn lag**: replica trễ 10 phút vẫn nhận query. Triệu chứng – báo cáo sai số, khách hàng khiếu nại. Cách tránh: health check loại replica khỏi pool khi lag vượt ngưỡng.
- **Query báo cáo bị huỷ trên replica** với lỗi conflict with recovery. Cách tránh: replica riêng cho báo cáo với {{max_standby_streaming_delay}} cao hơn, chấp nhận lag ở replica đó.

### Trả lời miệng 1 phút
"Replica chỉ thấy dữ liệu sau khi nhận và replay WAL từ primary, nên luôn có replication lag – đó là lý do khách vừa chuyển tiền xong mà không thấy giao dịch. Tôi đo lag bằng byte qua pg_stat_replication, so LSN với pg_current_wal_lsn, đáng tin hơn đo theo thời gian. Lag tăng khi primary ghi đột biến, replica yếu hơn, mạng chậm, hoặc replay bị chặn bởi query dài trên replica. Trong Spring tôi dùng AbstractRoutingDataSource bọc LazyConnectionDataSourceProxy, readOnly đi replica, ghi đi primary, và với dữ liệu nhạy cảm như số dư hay giao dịch vừa tạo thì luôn đọc primary, hoặc đọc primary trong vài giây sau lần ghi của chính user. Kinh nghiệm: coi lag là SLO có cảnh báo và tự động rút replica khỏi routing khi lag vượt ngưỡng."

### Ví dụ đời thực
Hệ thống ví điện tử xử lý 5.000 giao dịch/giây giờ cao điểm. Sau khi thêm 2 read replica (cùng zone AWS) để giảm tải báo cáo, khách hàng bắt đầu khiếu nại "chuyển tiền xong không thấy lịch sử" – trung bình 40 vụ/ngày. Điều tra:
- **Triệu chứng**: Client POST /transfer nhận 200 OK, ngay sau đó GET /transactions (đọc từ replica) trả danh sách rỗng. Sau 5–30 giây refresh lại thì thấy.
- **Metric**: {{pg_wal_lsn_diff(pg_current_wal_lsn(), replay_lsn)}} trên primary trung bình 15 MB (≈ 200 ms) bình thường, nhưng lúc 11:00–13:00 tăng tới 120 MB (≈ 2,5 s) do job đối soát sinh bulk UPDATE.
- **Nguyên nhân**: Job đối soát hàng ngày chạy {{UPDATE account SET balance = ...}} hàng triệu dòng, sinh WAL đột biến. Replica chỉ có 2 vCPU replay đơn luồng không kịp. Hơn nữa, query báo cáo dài trên replica (full scan 50 GB) khiến {{max_standby_streaming_delay}} (30 s) bị chạm, PostgreSQL huỷ query báo cáo để ưu tiên replay – nhưng lúc đó lag đã tăng vọt.
- **Cách xử lý**: (1) Tạo replica thứ 3 chuyên cho báo cáo, đặt {{max_standby_streaming_delay = 5min}}, chấp nhận lag cao ở replica này. (2) Chuyển job đối soát sang chạy ban đêm, chia batch 10.000 dòng mỗi transaction, thêm {{pg_sleep(0.01)}} giữa các batch để replica kịp replay. (3) Trong Spring, màn hình "Lịch sử giao dịch" sau khi vừa chuyển tiền dùng **sticky read**: lưu {{lastCommitLsn}} vào session, 5 giây sau POST thì buộc đọc primary; các màn hình khác (danh mục, tham số) vẫn đọc replica.
- **Kết quả đo được**: Lag giờ cao điểm giảm từ 2,5 s xuống 300 ms; khiếu nại "không thấy giao dịch" về 0; pool connection replica báo cáo tách biệt không ảnh hưởng replica phục vụ user.

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

### Hiểu nhanh
GROUP BY giống **gộp sổ cuối tháng**: mỗi khách chỉ còn một dòng tổng. Window function giống **viết thêm một cột bên lề** của sổ chi tiết: mỗi dòng giao dịch vẫn còn nguyên, nhưng bên cạnh có thêm "số dư tính tới dòng này" hoặc "giao dịch này xếp hạng mấy của khách". "Window" (cửa sổ) là nhóm dòng mà phép tính được phép nhìn vào: {{PARTITION BY}} quyết định nhóm (mỗi khách một nhóm), {{ORDER BY}} quyết định thứ tự, còn **frame** quyết định nhìn từ đâu tới đâu (từ đầu nhóm tới dòng hiện tại).

### Thuật ngữ
- **Window function**: hàm tính trên một tập dòng liên quan tới dòng hiện tại mà không gộp các dòng lại.
- **PARTITION BY**: chia dòng thành các nhóm độc lập để tính (khác với partition bảng).
- **Frame**: phạm vi dòng trong partition được dùng cho phép tính ở dòng hiện tại.
- **ROWS vs RANGE**: frame đếm theo từng dòng vật lý / theo giá trị ORDER BY (dòng cùng giá trị là "peer", vào frame cùng nhau).
- **Peer rows**: các dòng có cùng giá trị ORDER BY trong partition.
- **Tie-breaker**: cột duy nhất thêm vào ORDER BY để thứ tự xác định.
- **CTE**: truy vấn con đặt tên bằng {{WITH}}.

### SQL chạy theo thứ tự nào, từng bước
~~~text
FROM/JOIN -> WHERE -> GROUP BY -> HAVING -> WINDOW -> SELECT -> DISTINCT -> ORDER BY -> LIMIT
Ví dụ account 7 (ORDER BY created_at, id):
 created_at  id  amount | ROWS running | RANGE (không tie-breaker) running
 09:00       11   +500  |   500        |   500
 10:00       12   -200  |   300        |   400   <- 12 và 13 cùng 10:00 là peer
 10:00       13   +100  |   400        |   400      nên cùng nhận tổng của cả nhóm
~~~
1. **WHERE lọc trước**: window chỉ thấy dòng còn lại sau WHERE. Vì sao quan trọng: lọc tháng 1 thì mất số dư đầu kỳ.
2. **Chia partition và sort** theo PARTITION BY + ORDER BY. Vì sao tốn: không có index khớp thì phải sort toàn bộ dữ liệu.
3. **Tính hàm trên frame** của từng dòng. Vì sao ROWS: mỗi giao dịch là một bước số dư riêng, không gộp peer.
4. **SELECT nhận giá trị window** – nên muốn lọc theo {{rn <= 3}} phải bọc thêm một tầng truy vấn bên ngoài.

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

### Lỗi hay gặp
- **Để frame mặc định (RANGE) cho running balance**: hai giao dịch cùng giây hiển thị cùng một số dư. Triệu chứng – khách thấy sao kê "nhảy cóc". Cách tránh: {{ROWS BETWEEN ...}} tường minh + tie-breaker {{id}}.
- **Dùng {{ROW_NUMBER}} rồi mong "top 3 kể cả hoà"**: giao dịch bằng tiền nhau bị cắt ngẫu nhiên. Cách tránh: chọn {{RANK}}/{{DENSE_RANK}} theo đúng yêu cầu nghiệp vụ và ghi rõ trong spec.
- **Tính trên cả bảng 1 tỷ dòng không có index**: sort spill ra đĩa hàng chục GB. Cách tránh: index {{(account_id, created_at, id)}}, lọc phạm vi khách hàng trước, hoặc lưu sẵn số dư đầu kỳ (snapshot theo ngày) để chỉ tính phần mới.

### Trả lời miệng 1 phút
"Window function tính trên một nhóm dòng liên quan mà không gộp dòng như GROUP BY, nên mỗi giao dịch vẫn giữ nguyên và có thêm cột tính toán. Running balance tôi viết SUM amount OVER PARTITION BY account ORDER BY created_at, id với frame ROWS từ đầu tới dòng hiện tại. Top-3 mỗi khách thì dùng ROW_NUMBER trong CTE rồi lọc rn nhỏ hơn hoặc bằng 3 ở tầng ngoài, vì window không dùng được trong WHERE. Bẫy chính: frame mặc định là RANGE nên các dòng trùng thời gian bị gộp, thiếu tie-breaker làm kết quả không ổn định, và WHERE chạy trước nên phải cộng số dư đầu kỳ. Trên dữ liệu lớn tôi luôn có index khớp partition và order để tránh sort tràn đĩa."

### Ví dụ đời thực
Hệ thống ngân hàng cần xuất sao kê 500.000 tài khoản/tháng, mỗi tài khoản trung bình 200 giao dịch. Yêu cầu: tính số dư chạy chính xác cho từng dòng và lấy top-3 giao dịch lớn nhất của mỗi tài khoản trong tháng.
- **Triệu chứng**: Query chạy 18 phút, sort spill 12 GB ra đĩa tạm (vượt {{work_mem}} 256 MB), memory PostgreSQL tăng tới 8 GB. Top-3 đôi khi sai khi 2 giao dịch cùng số tiền và cùng timestamp.
- **Nguyên nhân**: Query dùng {{RANGE}} frame mặc định và không có tie-breaker; {{PARTITION BY account_id ORDER BY created_at}} không khớp index (index chỉ có {{(account_id, created_at)}} thiếu {{id}}). PostgreSQL phải sort toàn bộ 100 triệu dòng.
- **Cách xử lý**: (1) Thêm index {{(account_id, created_at, id)}} khớp đúng partition + order + tie-breaker. (2) Đổi frame thành {{ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW}} tường minh. (3) Thêm cột {{opening_balance}} pre-computed hàng ngày (materialized view refresh mỗi 00:05) để query chỉ tính window trên giao dịch tháng hiện tại (giảm từ 100M xuống 10M dòng). (4) Top-3 dùng {{ROW_NUMBER() OVER (PARTITION BY account_id ORDER BY amount DESC, id)}} trong CTE.
- **Kết quả đo được**: Query giảm từ 18 phút xuống 2 phút 30 giây; sort không còn spill; top-3 ổn định giữa các lần chạy.

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

### Hiểu nhanh
Đặt logic tính phí trong stored procedure giống **giao công thức nấu ăn cho người giữ kho**: họ nấu ngay trong kho nên khỏi khuân nguyên liệu ra bếp (ít round-trip), rất nhanh khi nấu số lượng lớn. Nhưng công thức nằm trong kho thì đầu bếp chính (team Java) không thấy, không kiểm thử được bằng công cụ quen thuộc, mỗi lần sửa phải nhờ người giữ kho, và đổi sang kho khác (Oracle → PostgreSQL) là phải viết lại. Vì vậy quy tắc thường là: **việc khuân vác hàng loạt** để kho làm, **công thức nghiệp vụ** để bếp chính giữ.

### Thuật ngữ
- **Stored procedure / function**: đoạn chương trình lưu và chạy bên trong DB; PostgreSQL 11+ có {{CREATE PROCEDURE}} (được commit giữa chừng) bên cạnh {{FUNCTION}}.
- **PL/pgSQL / PL/SQL**: ngôn ngữ thủ tục của PostgreSQL / Oracle.
- **Round-trip**: một lượt gửi lệnh từ app tới DB và nhận kết quả, thường 0,2–1ms trong cùng data center.
- **SECURITY DEFINER / INVOKER**: hàm chạy với quyền người tạo hàm / người gọi hàm.
- **search_path**: danh sách schema PostgreSQL dò theo thứ tự khi gặp tên không ghi schema.
- **pgTAP / utPLSQL**: framework unit test cho PostgreSQL / Oracle.
- **Set-based**: xử lý cả tập dòng bằng một câu SQL thay vì lặp từng dòng.

### Đánh giá đề xuất, từng bước
~~~text
Batch tính lãi 2 triệu tài khoản:
 Java đọc từng tài khoản : 2.000.000 round-trip x 0,5ms ≈ 17 phút chỉ cho mạng
 Java set-based theo lô  : 2.000 lô x 1.000 dòng, mỗi lô 1 SELECT + 1 batch UPDATE ≈ vài phút
 Procedure set-based     : 1 lệnh UPDATE ... FROM (...)   ≈ 1-2 phút
~~~
1. **Phân loại logic**: quy tắc nghiệp vụ hay biến đổi dữ liệu hàng loạt? Vì sao: chỉ loại thứ hai được lợi rõ rệt khi chạy trong DB.
2. **Đo chi phí round-trip thật**: nhiều khi chậm là vì code Java xử lý từng dòng, không phải vì ở tầng Java. Vì sao: chuyển sang batch/set-based trong Java thường đã đủ nhanh.
3. **Hỏi về vòng đời**: ai viết test, CI có chạy không, version và rollback thế nào. Vì sao: chi phí lớn nhất của procedure là bảo trì nhiều năm.
4. **Quyết định lai**: công thức lãi/phí ở Java (một nơi, có unit test), phần "áp dụng hàng loạt" là một câu SQL set-based do Java gọi, hoặc procedure mỏng không chứa quy tắc.

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

### Lỗi hay gặp
- **Procedure chạy vòng lặp từng dòng (cursor loop)** thay vì set-based: mất luôn lợi thế hiệu năng duy nhất. Cách tránh: viết thành một câu UPDATE/INSERT ... SELECT.
- **Cùng một công thức phí tồn tại ở cả Java và procedure**: hai nơi lệch nhau sau vài lần sửa. Triệu chứng – phí trên màn hình khác phí bị trừ. Cách tránh: một nguồn sự thật duy nhất.
- **Gọi procedure dài từ {{@Transactional}} Java**: transaction mở 20 phút, giữ lock và connection. Cách tránh: chia lô, mỗi lô một transaction, có điểm tiếp tục khi lỗi.

### Trả lời miệng 1 phút
"Stored procedure chạy sát dữ liệu nên rất nhanh cho xử lý hàng loạt và giảm round-trip, có thể cấp quyền EXECUTE thay vì quyền ghi bảng. Nhưng nó khó unit test, khó review, khó version, ẩn logic khỏi team Java và trói chặt vào một loại DB. Với tính lãi và biểu phí – là quy tắc nghiệp vụ thay đổi theo sản phẩm, cần audit và test – tôi giữ ở tầng Java. Procedure tôi chỉ dùng cho thao tác dữ liệu set-based như dọn dữ liệu, tổng hợp, và khi đó quản lý bằng Flyway, có test chạy trên DB thật trong CI. Kinh nghiệm: phần lớn 'Java chậm' là do xử lý từng dòng; chuyển sang batch theo lô thường đủ nhanh mà vẫn giữ logic ở chỗ dễ bảo trì."

### Ví dụ đời thực
Hệ thống thanh toán cần áp dụng biểu phí mới: 0,5% giá trị giao dịch, tối thiểu 1.000 VNĐ, tối đa 50.000 VNĐ, miễn phí cho khách hàng VIP, và phí giảm dần theo bậc tháng (tháng 1: 100%, tháng 2: 80%, tháng 3: 60%). Team đề xuất viết stored procedure PL/pgSQL để "chạy nhanh".
- **Triệu chứng**: Mỗi lần thay đổi chính sách phí (trung bình 4 lần/năm) phải nhờ DBA deploy procedure, review code PL/pgSQL mất 3 ngày, không có unit test tự động. Một lần sửa sai điều kiện VIP (quên cast kiểu dữ liệu) làm 12.000 giao dịch bị trừ phí nhầm, phải rollback thủ công 4 tiếng. CI của team Java không chạy test procedure.
- **Nguyên nhân**: Logic nghiệp vụ phức tạp, thay đổi thường xuyên, cần audit trail rõ ràng – tất cả đều nghịch lý với stored procedure.
- **Cách xử lý**: Chuyển công thức phí sang Java domain service ({{FeeCalculator}}), có unit test 45 case bao gồm biên, VIP, bậc tháng. Phần "áp dụng hàng loạt" (tính phí cho 2 triệu giao dịch đêm) dùng một câu SQL set-based {{UPDATE ... FROM (SELECT ...)}} do Java gọi, không chứa quy tắc. Procedure chỉ còn lại {{recalc_daily_balance}} (tổng hợp số dư) – logic đơn lẻ, ít đổi, có test pgTAP trong CI.
- **Kết quả đo được**: Thay đổi chính sách phí từ 3 ngày (cần DBA) xuống 2 giờ (deploy Java bình thường); 0 sự cố phí sai sau 6 tháng; coverage unit test phí đạt 98%.

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

### Hiểu nhanh
Base backup giống **ảnh chụp toàn bộ căn nhà** lúc nửa đêm; WAL archive giống **camera ghi hình liên tục** mọi thay đổi sau đó. Muốn đưa căn nhà về đúng 09:19 sáng – ngay trước khi ai đó lỡ tay vứt đồ (câu DELETE sai) – bạn dựng lại từ ảnh nửa đêm rồi **tua băng camera** tới 09:19 và dừng. Không có băng camera thì chỉ quay về được nửa đêm. **RPO** là "tối đa mất bao nhiêu phút băng hình", **RTO** là "mất bao lâu để dựng lại nhà".

### Thuật ngữ
- **PITR (Point-In-Time Recovery)**: khôi phục DB về một thời điểm bất kỳ trong khoảng còn WAL.
- **Base backup**: bản sao vật lý toàn bộ thư mục dữ liệu, chụp online.
- **WAL segment**: file WAL, mặc định 16MB; được archive khi đầy hoặc khi {{archive_timeout}} ép chuyển.
- **archive_command / restore_command**: lệnh copy WAL ra kho / lấy WAL về khi khôi phục.
- **Restore point**: mốc có tên trong WAL để khôi phục chính xác tới đó.
- **RPO (Recovery Point Objective)**: lượng dữ liệu tối đa được phép mất, đo bằng thời gian.
- **RTO (Recovery Time Objective)**: thời gian tối đa để hệ thống hoạt động trở lại.
- **Object lock (WORM)**: chế độ lưu trữ không cho sửa/xoá trong thời hạn quy định.

### Khôi phục sau câu DELETE sai, từng bước
~~~text
00:00  base backup (pg_basebackup)  ---> S3
00:00 - 09:20  WAL 000..0A3 archive liên tục ---> S3
09:20:13  DELETE FROM payment WHERE ... (thiếu điều kiện) -- xid 8812345
Khôi phục: base 00:00 + replay WAL tới 09:20:00 (hoặc recovery_target_xid = 8812345 với recovery_target_inclusive = false)
~~~
1. **Xác định thời điểm/xid của lệnh sai** từ log ứng dụng, audit log hoặc {{pg_waldump}}. Vì sao: khôi phục quá muộn sẽ dính lệnh sai, quá sớm thì mất giao dịch đúng.
2. **Dựng instance mới** từ base backup gần nhất **trước** thời điểm đó – không ghi đè production. Vì sao: production vẫn có dữ liệu mới hơn cần giữ.
3. **Cấu hình restore_command + recovery_target** rồi khởi động; PostgreSQL tải và replay WAL lần lượt. Vì sao lâu: replay bị giới hạn bởi I/O, khoảng vài trăm MB tới vài GB WAL mỗi phút tuỳ phần cứng.
4. **Dừng ở đích với {{recovery_target_action = 'pause'}}**, kiểm tra dữ liệu. Vì sao: còn lùi thêm/đi tiếp được nếu chọn sai mốc.
5. **Trích các dòng bị xoá** từ instance khôi phục và chèn lại vào production (qua {{pg_dump}} bảng đó hoặc script). Vì sao không thay cả DB: giữ được các giao dịch hợp lệ sau 09:20.

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

### Lỗi hay gặp
- **archive_command lỗi âm thầm**: WAL không đẩy được, tích trong {{pg_wal}} tới khi đầy đĩa. Triệu chứng – {{pg_stat_archiver.failed_count}} tăng, đĩa đầy rồi DB dừng. Cách tránh: cảnh báo trên {{last_failed_time}} và độ tuổi WAL chưa archive.
- **Khôi phục đè lên production** thay vì instance riêng: mất luôn dữ liệu hợp lệ sau thời điểm khôi phục. Cách tránh: luôn khôi phục ra chỗ khác rồi trích dữ liệu cần thiết.
- **Chỉ dựa vào replica** để chống xoá nhầm: replica replay câu DELETE gần như tức thời nên cũng mất. Cách tránh: replica dùng cho HA, PITR dùng cho lỗi logic; có thể thêm delayed replica ({{recovery_min_apply_delay}}).

### Trả lời miệng 1 phút
"PITR cho phép khôi phục tới bất kỳ thời điểm nào, dựa trên base backup cộng với WAL archive liên tục. Khi có câu DELETE sai, tôi dựng một instance riêng từ base backup trước đó, đặt restore_command và recovery_target_time ngay trước lệnh sai, để PostgreSQL replay WAL rồi pause, kiểm tra, sau đó trích dữ liệu bị xoá đưa lại production. RPO phụ thuộc WAL được archive nhanh tới đâu – archive_timeout, hoặc synchronous replication nếu cần gần bằng không; RTO phụ thuộc kích thước backup, lượng WAL cần replay và có standby sẵn hay không. Trade-off là RPO và RTO càng nhỏ thì chi phí càng lớn. Kinh nghiệm quan trọng nhất của tôi: backup chưa từng được khôi phục thử thì chưa phải backup, nên tôi diễn tập restore định kỳ và đo thời gian thật."

### Ví dụ đời thực
Hệ thống core banking PostgreSQL 15, DB 2 TB, WAL 150 GB/ngày. 14:05 một developer chạy nhầm {{DELETE FROM transaction_log WHERE created_at < '2026-01-01'}} thiếu điều kiện {{AND status = 'ARCHIVED'}} – xoá 45 triệu dòng (3 tháng giao dịch) trong 2 phút.
- **Triệu chứng**: Application log báo {{ERROR: DELETE 45000000}}; monitoring thấy disk usage giảm bất ngờ; replica lag nhảy từ 50 MB lên 8 GB do replay DELETE.
- **Quy trình khôi phục**: (1) 14:07 xác định {{xid = 1847291}} từ {{pg_waldump}} của WAL segment đang chạy. (2) 14:10 dựng instance mới từ base backup 00:00 hôm đó (pgBackRest, 2 TB restore 22 phút). (3) 14:32 cấu hình {{recovery_target_xid = '1847291'}}, {{recovery_target_inclusive = false}}, {{recovery_target_action = 'pause'}}. (4) 14:32–15:10 replay 850 GB WAL (I/O bottleneck, 200 MB/s). (5) 15:10 pause, {{pg_dump -t transaction_log --where="created_at >= '2026-01-01'"}} ra 45 triệu dòng, import ngược lên production (18 phút). (6) 15:30 verify checksum, mở lại ứng dụng.
- **RPO/RTO thực tế**: RPO = 0 (vì synchronous replication sang AZ khác, WAL không mất); RTO thực tế = 1h25p (restore 22p + replay 38p + extract/import 18p + verify 7p). Cam kết SLA RTO 2h – đạt.
- **Bài học**: (a) Luôn đặt {{pg_create_restore_point('pre_migration_...')}} trước thao tác rủi ro – khôi phục tới LSN nhanh hơn replay theo xid. (b) Cần instance standby chuyên dụng cho PITR (không chia sẻ với read replica) để không tranh I/O khi replay. (c) Diễn tập restore hàng quý phát hiện pgBackRest config thiếu {{--repo1-retention-full=2}} làm backup cũ bị xoá – đã sửa trước khi sự cố thật xảy ra.

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

### Bên trong: exception translation làm gì
{{@Repository}} được {{PersistenceExceptionTranslationPostProcessor}} bọc proxy: exception riêng của công nghệ ({{SQLException}} với mã lỗi của PostgreSQL, {{PersistenceException}} của Hibernate) được dịch sang cây **{{DataAccessException}}** chung của Spring — {{DuplicateKeyException}}, {{DataIntegrityViolationException}}, {{CannotAcquireLockException}}, {{QueryTimeoutException}}… Nhờ đó tầng service bắt lỗi theo **ý nghĩa** ("trùng khoá") mà không phụ thuộc DB hay ORM. Spring Data JPA repository đã có sẵn cơ chế này. {{@Service}}, {{@Controller}} không thêm hành vi đặc biệt (ngoài {{@Controller}} được Spring MVC nhận diện làm handler) — chủ yếu là ngữ nghĩa và mục tiêu cho pointcut.

### Ví dụ đời thực
API đăng ký tài khoản bắt {{catch (SQLException e)}} rồi kiểm tra {{e.getSQLState().equals("23505")}} để báo "email đã tồn tại". Sau khi chuyển một phần sang JPA, exception đến là {{DataIntegrityViolationException}} (đã được dịch) nên nhánh catch không chạy → người dùng thấy lỗi 500 thay vì "email đã được đăng ký" (khoảng 300 lượt/ngày). Sửa: bắt {{DuplicateKeyException}}/{{DataIntegrityViolationException}} ở service, map sang 409 trong {{@RestControllerAdvice}}; đồng thời vẫn kiểm tra tồn tại trước để có thông báo thân thiện, unique constraint là lớp bảo vệ cuối cho trường hợp hai request đồng thời.

### Trả lời mẫu khi phỏng vấn
"Bốn annotation đều là @Component nên đều được component scan đăng ký thành bean; khác nhau ở ngữ nghĩa tầng và một số hành vi đi kèm. @Controller được Spring MVC nhận diện làm handler, @RestController thêm ResponseBody. @Service chủ yếu đánh dấu tầng nghiệp vụ, tiện cho đọc code và pointcut. @Repository có thêm exception translation: một post processor bọc proxy để dịch exception riêng của JDBC hay Hibernate sang cây DataAccessException của Spring, như DuplicateKeyException hay CannotAcquireLockException. Nhờ đó tầng service xử lý lỗi theo ý nghĩa mà không phụ thuộc vào DB hay ORM cụ thể. Spring Data repository đã có sẵn việc này. Thực tế tôi bắt các exception đã dịch đó và map sang mã HTTP phù hợp ở controller advice."

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

### Bên trong: vì sao gọi @Bean method trong @Configuration lại trả cùng một object
Với {{@Configuration}} (mặc định {{proxyBeanMethods = true}}), Spring tạo **lớp con CGLIB** của class cấu hình; mỗi lời gọi tới method {{@Bean}} từ bên trong class bị chặn: nếu bean đã có trong container thì trả về bean đó thay vì chạy lại method. Nhờ vậy {{dataSource()}} gọi hai lần vẫn chỉ có một pool. Với {{proxyBeanMethods = false}} ("lite mode"), không có proxy: gọi {{dataSource()}} trực tiếp sẽ **tạo object mới** mỗi lần — phải nhận dependency qua tham số method {{@Bean}} thay vì gọi method. Spring Boot dùng {{false}} cho hầu hết auto-configuration để khởi động nhanh hơn và hỗ trợ native image.

### Ví dụ đời thực
Một lớp cấu hình viết {{@Configuration(proxyBeanMethods = false)}} (copy từ ví dụ trên mạng) và trong đó {{orderClient()}} gọi {{httpClient()}}, {{paymentClient()}} cũng gọi {{httpClient()}} → hai {{HttpClient}} riêng, mỗi cái một pool connection 200 → số connection tới gateway gấp đôi giới hạn, gateway từ chối 5% request giờ cao điểm. Sửa: nhận {{HttpClient}} qua tham số method ({{@Bean OrderClient orderClient(HttpClient http)}}). Quy tắc của team: luôn nhận dependency qua tham số method @Bean — đúng trong cả hai chế độ.

### Trả lời mẫu khi phỏng vấn
"@Component đặt trên class của chính mình để component scan tạo bean; @Bean là method trong class cấu hình trả về object, dùng khi tạo bean từ thư viện bên ngoài hoặc cần logic khởi tạo tuỳ chỉnh. Với @Configuration mặc định, Spring tạo lớp con CGLIB chặn các lời gọi giữa các method @Bean, nên gọi dataSource hai lần vẫn chỉ nhận một bean singleton. proxyBeanMethods bằng false bỏ proxy đó, khởi động nhanh hơn và hợp với native image, Spring Boot dùng cho auto-configuration; nhưng khi đó gọi method @Bean trực tiếp sẽ tạo object mới mỗi lần. Vì vậy quy tắc an toàn của tôi là luôn nhận dependency qua tham số của method @Bean thay vì gọi method khác, đúng trong cả hai chế độ."

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

### Cơ chế resolution chi tiết: @Priority và fallback theo tên
Spring 4.1+ hỗ trợ {{@Priority}} (JSR-330) trên bean definition để quyết định ưu tiên khi có nhiều candidate và không có {{@Primary}} hay {{@Qualifier}}. Giá trị số **nhỏ hơn = ưu tiên cao hơn** (nghịch với @Order). Thứ tự ưu tiên đầy đủ:
1. {{@Qualifier}} tại injection point (cao nhất)
2. {{@Primary}} trên bean definition
3. {{@Priority}} trên bean definition (giá trị nhỏ hơn thắng)
4. Khớp tên tham số/field với tên bean (cần compile với {{-parameters}})
5. Báo lỗi {{NoUniqueBeanDefinitionException}}

~~~java
@Configuration
public class PriorityConfig {
    @Bean @Priority(10)  // ưu tiên cao hơn mặc định
    PaymentGateway gatewayA() { return new GatewayA(); }

    @Bean @Priority(100) // ưu tiên thấp
    PaymentGateway gatewayB() { return new GatewayB(); }
}
~~~
Khi inject {{PaymentGateway}} không qualifier, Spring chọn {{gatewayA}} nhờ {{@Priority(10)}}.

### Inject collection và array
Ngoài {{List}} và {{Map}}, Spring hỗ trợ inject **array** ({{Notifier[]}}) và {{Set<Notifier>}} (từ Spring 4.3). Array/Set/List hành vi y hệt {{List}} (sắp theo {{@Order}}/{{@Priority}}). {{Set}} loại bỏ trùng lặp theo bean instance (không bao giờ trùng vì mỗi bean là singleton riêng). Collection inject **luôn** nhận tất cả bean khớp kiểu, kể cả {{@Primary}} – không bị lọc bỏ.

### Ví dụ đời thực
Hệ thống thanh toán tích hợp 4 cổng: VNPAY (mặc định), MoMo, ZaloPay, ShopeePay. Mỗi cổng là một implementation của {{PaymentGateway}}.
- **Triệu chứng**: Deploy thêm ShopeePayGateway (implementation thứ 4) → app **không start được**, log {{NoUniqueBeanDefinitionException}} tại 12 chỗ inject {{PaymentGateway}}.
- **Nguyên nhân**: Chỉ có {{VNPAY}} có {{@Primary}}. Các chỗ inject cũ không dùng {{@Qualifier}} vì trước đó chỉ có 2 cổng và VNPAY là primary. Thêm cổng thứ 3, 4 làm vỡ assumption.
- **Cách xử lý**: (1) Giữ {{@Primary}} trên VNPAY (cổng mặc định). (2) Tạo {{PaymentGatewayRegistry}} inject {{List<PaymentGateway>}} để duyệt tất cả cổng khi cần hiển thị danh sách cho user chọn. (3) Các service nghiệp vụ cần cổng cụ thể dùng {{@Qualifier("momoGateway")}} tường minh. (4) Thêm integration test kiểm tra app start OK với 5 cổng giả lập.
- **Kết quả đo được**: App start bình thường; thêm cổng mới chỉ cần viết class implement + {{@Bean}} + {{@Qualifier}}, không sửa code sẵn có; test coverage 100% các đường inject.

### Trả lời mẫu khi phỏng vấn
"Khi nhiều bean cùng kiểu, Spring ném NoUniqueBeanDefinitionException. Ba cách giải quyết: @Primary đánh dấu bean mặc định, @Qualifier chỉ định rõ bean name tại chỗ inject, và inject List/Map để nhận tất cả bean cùng kiểu. @Qualifier thắng @Primary. Spring cũng thử khớp tên tham số với tên bean nếu compile với -parameters. Collection inject nhận tất cả bean, sắp theo @Order/@Priority, @Primary không bị loại. Mình dùng List cho strategy pattern (danh sách validator, processor), Map để lookup theo tên bean. Trong review, nếu thấy interface có 2+ implementation, mình luôn hỏi: bean nào là default? Nếu không có @Primary và không dùng @Qualifier khắp nơi, code sẽ vỡ khi thêm implementation mới."

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

### Cơ chế auto-configuration chi tiết
{{@EnableAutoConfiguration}} đọc file {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}} (Spring Boot 3) – mỗi dòng là một class auto-configuration. Với mỗi class, Spring kiểm tra các điều kiện {{@Conditional...}} ở class-level:
- {{@ConditionalOnClass}}: ASM đọc annotation, **không nạp class** – an toàn khi class vắng mặt.
- {{@ConditionalOnMissingBean}}: kiểm tra xem bean cùng type đã được user define chưa.
- {{@ConditionalOnProperty}}: đọc property, {{matchIfMissing = true}} để có default.
- Nếu bất kỳ điều kiện nào fail → toàn bộ auto-config bị loại.

Thứ tự auto-configuration: {{@AutoConfigureBefore}} / {{@AutoConfigureAfter}} ép thứ tự, {{@AutoConfigureOrder}} sắp xếp theo số. Nếu không khai báo, Boot sắp theo tên class alphabet – **không** tự suy ra thứ tự từ dependency giữa các bean.

### Fat JAR và embedded server
Spring Boot đóng gói ứng dụng thành **fat JAR** (uber JAR) chứa cả code ứng dụng, dependency, và embedded server (Tomcat mặc định, hoặc Jetty/Undertow). Chạy bằng {{java -jar app.jar}} – không cần cài đặt server riêng. Lợi ích: môi trường dev/staging/prod giống hệt nhau (cùng JAR), dễ containerize (Docker COPY app.jar), rollback chỉ cần deploy JAR cũ. Spring thuần truyền thống đóng WAR và deploy lên Tomcat/JBoss ngoài – version server, config server, classpath đều là biến số gây "works on my machine".

### Ví dụ đời thực
Team mới chuyển từ Spring thuần (WAR deploy lên Tomcat 9) sang Spring Boot 3.2.
- **Triệu chứng**: Dev máy local chạy {{mvn spring-boot:run}} OK, nhưng build Docker image {{java -jar app.jar}} báo {{NoClassDefFoundError: jakarta/servlet/ServletContext}} lúc runtime. Staging deploy WAR lên Tomcat 10 cũng báo lỗi tương tự.
- **Nguyên nhân**: Project còn phụ thuộc {{javax.servlet:javax.servlet-api}} (Servlet 4) từ Spring thuần, nhưng Spring Boot 3 dùng Jakarta EE 10 (Servlet 6, package {{jakarta.servlet.*}}). Fat JAR của Boot đã bundle Tomcat 10 (Jakarta), nhưng code vẫn import {{javax.servlet}} → conflict khi classloader nạp.
- **Cách xử lý**: (1) Xoá mọi dependency {{javax.servlet}} khỏi pom, để Boot quản lý qua BOM. (2) Thay import {{javax.servlet.*}} → {{jakarta.servlet.*}} trong code (IDE refactor hỗ trợ). (3) Dockerfile đổi sang base image {{eclipse-temurin:21-jre}} + {{COPY app.jar /app.jar}} + {{ENTRYPOINT ["java","-jar","/app.jar"]}}. (4) Staging bỏ Tomcat ngoài, deploy JAR trực tiếp qua systemd.
- **Kết quả đo được**: Build time giảm 40% (không cần assemble WAR + deploy riêng); startup time từ 12s (Tomcat deploy WAR) xuống 3.2s (fat JAR); 0 lỗi "works on my machine" sau 3 tháng.

### Trả lời mẫu khi phỏng vấn
"@SpringBootApplication gộp 3 annotation: @SpringBootConfiguration (cho phép @Bean), @EnableAutoConfiguration (đọc file imports, nạp auto-config có điều kiện), @ComponentScan (quét component từ package main). Starter là dependency descriptor gom thư viện + version do BOM quản lý + auto-config kích hoạt theo classpath. Khác Spring thuần: không tự khai báo bean/version, chạy fat JAR nhúng server thay vì WAR deploy ngoài, config tập trung application.yml, Actuator sẵn sàng health/metrics. Auto-config dùng @ConditionalOnClass/MissingBean/Property để quyết định bean nào nạp, thứ tự do @AutoConfigureOrder/@AutoConfigureBefore/After kiểm soát. Fat JAR nhúng Tomcat/Jetty giúp dev/staging/prod cùng một artifact, dễ containerize."

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

### Ví dụ đời thực
Service chuyển khoản viết:
~~~java
@Transactional
public void transfer(...) {
    debit(from, amount);
    try {
        credit(to, amount);            // ném DataIntegrityViolationException
    } catch (Exception e) {
        log.error("credit failed", e); // "nuốt" lỗi để trả kết quả đẹp cho client
    }
}
~~~
Kết quả: tiền đã trừ ở tài khoản nguồn **được commit**, tài khoản đích không được cộng — 23 khoản tiền "biến mất" trước khi đối soát phát hiện. Một biến thể khác: {{credit}} nằm ở bean khác có {{@Transactional}} (REQUIRED), lỗi bên trong đánh dấu transaction **rollback-only**; outer bắt và nuốt exception rồi kết thúc bình thường → Spring ném {{UnexpectedRollbackException}} lúc commit, client nhận 500 dù code "đã xử lý lỗi". Sửa: không bắt exception trong method transactional trừ khi xử lý được thật sự; nếu cần trả kết quả thân thiện thì để exception đi ra và map ở {{@RestControllerAdvice}}; checked exception nghiệp vụ dùng {{rollbackFor}}.

### Trả lời mẫu khi phỏng vấn
"Mặc định Spring chỉ rollback khi method ném RuntimeException hoặc Error; checked exception thì vẫn commit. Muốn rollback với checked exception thì khai báo rollbackFor, hoặc dùng exception nghiệp vụ unchecked như tôi thường làm. Bẫy lớn hơn là try-catch nuốt exception bên trong method transactional: proxy không thấy lỗi nên commit mọi thứ đã làm, ví dụ đã trừ tiền nhưng chưa cộng tiền. Biến thể khó hiểu là lỗi xảy ra trong một bean transactional khác cùng transaction: nó đã đánh dấu rollback-only, outer nuốt lỗi rồi kết thúc bình thường, và lúc commit Spring ném UnexpectedRollbackException. Nguyên tắc của tôi: chỉ bắt exception trong method transactional khi thật sự xử lý được, còn lại để exception đi ra và map ở controller advice."

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

### Ví dụ đời thực
Trên hệ thống đặt hàng, màn hình chi tiết đơn hàng đôi khi load chậm và client báo lỗi 500. Triệu chứng: API /orders/{id} trả JSON lớn, kèm cả lịch sử thay đổi của đơn (lazy loading). Điều tra qua log ứng dụng thấy lỗi {{org.hibernate.LazyInitializationException}} khi Jackson serialize entity, và bảo mật phát hiện JSON chứa {{passwordHash}} của nhân viên xử lý đơn. Nguyên nhân gốc: controller trả trực tiếp entity {{Order}} (mapping khóa ngoài Customer, fetch LAZY) thay vì DTO; Jackson kích hoạt lazy loading khi duyệt getter → N+1 query và lộ field nhạy cảm. Cách xử lý: tạo {{OrderDto}} chỉ chứa trường cần hiển thị (id, mã đơn, tổng tiền, trạng thái, ngày tạo), controller trả {{ResponseEntity.ok(dto)}}, và gắn {{@JsonIgnore}} lên field nhạy cảm của entity. Kết quả đo được: response giảm từ khoảng 150KB xuống dưới 10KB, không còn lỗi lazy loading, và field nhạy cảm không bao giờ ra API.

### Trả lời mẫu khi phỏng vấn
"{{@RestController}} là kết hợp của {{@Controller}} và {{@ResponseBody}}, nên mọi phương thức trả về object được Jackson tự động serialize thành JSON vào response body – thích hợp cho REST API. {{@Controller}} truyền thống dùng cho server-side rendering: trả về tên view, rồi Thymeleaf hay JSP render HTML gửi về trình duyệt. {{ResponseEntity<T>}} cho tôi kiểm soát chính xác status code, header và body, ví dụ trả 201 kèm header Location khi tạo đơn mới. Jackson theo mặc định serialize getter public và field public, nên tôi dùng DTO thay vì entity – tránh lộ field nhạy cảm như {{passwordHash}} và tránh Jackson kích hoạt lazy loading gây N+1 query. Tôi cũng hạn chế tự new ObjectMapper ở nhiều nơi, để giữ cấu hình date ISO-8601 và JavaTimeModule mà Spring Boot đã chuẩn bị sẵn. Mỗi lần phỏng vấn, tôi nhấn mạnh điểm này vì đây là anti-pattern gặp nhiều nhất trên production. Trade-off: viết DTO tốn thêm class nhưng là hợp đồng API ổn định, đổi schema bên trong không làm vỡ API cho client."

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

### Hiểu nhanh
Chuyển 100 nghìn từ A sang B giống một **giao dịch tại quầy ngân hàng**. **Atomicity**: giao dịch viên hoặc làm xong cả hai bước (trừ A, cộng B) hoặc huỷ hết – không bao giờ "trừ rồi mà chưa cộng". **Consistency**: sổ sách luôn đúng luật (số dư không âm, tài khoản phải tồn tại) – luật do DB kiểm tra. **Isolation**: hai khách cùng chuyển tiền một lúc không làm rối sổ của nhau. **Durability**: một khi đã đưa biên lai "thành công", dù cúp điện ngay sau đó, giao dịch vẫn còn – vì đã được ghi vào **nhật ký** trước khi đưa biên lai.

### Thuật ngữ
- **Transaction**: một đơn vị công việc gồm nhiều câu lệnh, kết thúc bằng {{COMMIT}} hoặc {{ROLLBACK}}.
- **Undo log**: bản lưu giá trị cũ để huỷ thay đổi (InnoDB, Oracle).
- **WAL / redo log**: nhật ký thay đổi ghi **trước** khi sửa file dữ liệu, dùng để làm lại khi crash.
- **fsync**: lệnh buộc hệ điều hành ghi dữ liệu từ bộ nhớ đệm xuống đĩa thật.
- **Checkpoint**: thời điểm DB đảm bảo mọi page đã sửa trước đó đã được ghi xuống file dữ liệu, WAL cũ hơn có thể bỏ.
- **Constraint**: luật dữ liệu khai báo ở DB (PK, FK, UNIQUE, CHECK, NOT NULL).
- **DEFERRABLE**: constraint được hoãn kiểm tra tới lúc commit thay vì sau từng câu lệnh.
- **Crash recovery**: quá trình DB tự sửa trạng thái khi khởi động lại sau sự cố.

### Commit diễn ra thế nào, từng bước
~~~text
UPDATE A (-100) --> page A sửa trong RAM (buffer), ghi bản ghi WAL #1 vào WAL buffer
UPDATE B (+100) --> page B sửa trong RAM,        ghi bản ghi WAL #2
COMMIT          --> ghi bản ghi COMMIT, fsync WAL xuống đĩa (~0,1-2ms SSD) --> trả "OK"
(sau đó)        --> checkpoint/background writer mới ghi page A, B xuống file dữ liệu
CRASH trước fsync: không có COMMIT trong WAL -> coi như chưa xảy ra (A)
CRASH sau fsync  : replay WAL #1, #2 -> A và B đúng như đã commit (D)
~~~
1. **Sửa trong bộ nhớ, ghi nhật ký trước**. Vì sao: ghi tuần tự vào cuối file WAL nhanh hơn nhiều so với ghi ngẫu nhiên từng page dữ liệu.
2. **Kiểm tra constraint ở mỗi câu lệnh**: CHECK {{balance >= 0}} vi phạm thì câu lệnh lỗi, transaction phải rollback. Vì sao ở DB: mọi đường ghi (app, script, batch) đều qua đây.
3. **Giữ row lock trên A và B tới commit**. Vì sao: transaction khác không được sửa chồng; người chỉ đọc thì thấy phiên bản cũ nhờ MVCC.
4. **COMMIT = fsync WAL**. Vì sao chỉ cần WAL: có WAL là dựng lại được page; page dữ liệu ghi sau cũng không sao.
5. **Rollback hoặc crash giữa chừng**: InnoDB dùng undo trả giá trị cũ; PostgreSQL đánh dấu transaction aborted nên phiên bản mới thành vô hình.

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

### Lỗi hay gặp
- **Nới các tham số durability để benchmark đẹp rồi quên trả lại**: MySQL {{innodb_flush_log_at_trx_commit = 2}} (hoặc 0) và PostgreSQL {{synchronous_commit = off}} có thể mất các giao dịch của khoảng một giây gần nhất khi crash (PostgreSQL vẫn không làm hỏng dữ liệu, chỉ mất commit gần nhất; {{fsync = off}} thì còn có thể hỏng dữ liệu). Cách tránh: giữ mặc định ({{1}} / {{on}}) cho dữ liệu tiền, chỉ nới cho dữ liệu chịu mất được.
- **Kiểm tra số dư ở Java rồi mới UPDATE** mà không có CHECK ở DB: hai request song song cùng qua được kiểm tra, số dư âm. Cách tránh: {{UPDATE ... SET balance = balance - ? WHERE id = ? AND balance >= ?}} và kiểm tra số dòng cập nhật, cộng thêm CHECK constraint.
- **Gọi API ngoài trong transaction rồi rollback**: DB huỷ được thay đổi của nó nhưng không "huỷ" được email đã gửi. Cách tránh: ACID chỉ áp dụng trong DB; side effect ngoài dùng outbox.

### Trả lời miệng 1 phút
"ACID là bốn bảo đảm của transaction, lấy ví dụ chuyển tiền A sang B. Atomicity: hai lệnh trừ và cộng hoặc cùng thành công hoặc cùng huỷ, InnoDB dùng undo log, PostgreSQL đánh dấu transaction aborted. Consistency: các constraint như CHECK số dư không âm, FK, UNIQUE được DB kiểm tra nên dữ liệu không bao giờ sai luật. Isolation: MVCC cho người đọc thấy snapshot cũ, row lock ngăn hai người sửa chồng. Durability: commit chỉ trả OK sau khi WAL đã fsync xuống đĩa, crash thì replay WAL. Trade-off: durability tốn một lần fsync mỗi commit, có thể nới bằng synchronous_commit nhưng không cho dữ liệu tiền. Kinh nghiệm: tôi luôn đặt constraint ở DB vì kiểm tra ở Java không chống được race condition."

### Ví dụ đời thực
Trên ứng dụng ví điện tử, khách hàng báo trường hợp trừ tiền hai lần nhưng số dư lại âm. Triệu chứng: log thấy hai request {{transfer}} cùng lúc đối với cùng một tài khoản, mỗi request đọc số dư 100.000, thấy đủ, rồi đều trừ 120.000. Điều tra qua log DB và code thấy code Java chỉ kiểm tra {{balance >= amount}} trong ứng dụng rồi mới UPDATE, không có CHECK constraint và không khóa hàng. Nguyên nhân gốc: race condition – hai giao dịch đọc số dư cũ cùng lúc, cả hai đều vượt qua kiểm tra, ghi đè lên nhau, và DB không có ràng buộc ngăn số dư âm nên lưu thành âm. Cách xử lý: thêm {{CHECK (balance >= 0)}} ở DB, viết {{UPDATE account SET balance = balance - ? WHERE id = ? AND balance >= ?}}, kiểm tra số dòng cập nhật (phải là 1), tất cả trong một transaction. Kết quả đo được: sau khi triển khai, không còn trường hợp số dư âm, và các yêu cầu đồng thời được xử lý đúng – chỉ một giao dịch thành công, kia bị từ chối do số dư không đủ.

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

### Hiểu nhanh
Chuẩn hoá giống **sắp xếp danh bạ công ty** sao cho mỗi thông tin chỉ ghi ở **một chỗ**. Nếu tên phòng ban được chép vào hồ sơ của từng nhân viên, khi phòng đổi tên bạn phải sửa 200 hồ sơ – sót một cái là dữ liệu mâu thuẫn (update anomaly). Chuẩn hoá tách "phòng ban" ra bảng riêng, nhân viên chỉ ghi mã phòng. Denormalize là cố ý **chép lại** một ít thông tin để đọc nhanh hơn – giống dán tên phòng lên cửa từng văn phòng cho khách khỏi tra – chấp nhận việc phải cập nhật nhiều chỗ khi đổi tên.

### Thuật ngữ
- **Functional dependency (A → B)**: biết A thì xác định duy nhất được B (biết {{emp_id}} thì biết {{dept_id}}).
- **Anomaly**: bất thường khi thêm/sửa/xoá do dữ liệu bị lặp (thêm không được, sửa sót, xoá mất thông tin khác).
- **Composite key**: khoá chính gồm nhiều cột.
- **Phụ thuộc bộ phận (partial dependency)**: cột phụ thuộc vào một phần của khoá composite – vi phạm 2NF.
- **Phụ thuộc bắc cầu (transitive)**: khoá → cột X → cột Y, Y không phụ thuộc trực tiếp vào khoá – vi phạm 3NF.
- **OLTP / OLAP**: hệ thống giao dịch nhiều ghi nhỏ / hệ thống phân tích đọc khối lớn.
- **Star schema**: mô hình kho dữ liệu gồm bảng fact ở giữa và các bảng dimension xung quanh.

### Chuẩn hoá một bảng thật, từng bước
~~~text
Bảng thô: order_line(order_id, product_id, qty, product_name, customer_id, customer_name, tags="a,b")
1NF: tách tags thành bảng order_tag(order_id, tag)            -- mỗi ô một giá trị
2NF: khoá (order_id, product_id); product_name chỉ phụ thuộc product_id,
     customer_* chỉ phụ thuộc order_id -> tách product(...), orders(order_id, customer_id, ...)
3NF: orders: order_id -> customer_id -> customer_name (bắc cầu) -> tách customer(...)
Kết quả: orders, order_line(order_id, product_id, qty), product, customer, order_tag
~~~
1. **1NF – mỗi ô một giá trị**. Vì sao: chuỗi "a,b" không index được, không đặt FK được, tìm "tag = b" phải dùng LIKE.
2. **2NF – bỏ phụ thuộc vào một phần khoá**. Vì sao: {{product_name}} lặp trên mọi dòng đơn hàng có sản phẩm đó; đổi tên phải sửa hàng triệu dòng.
3. **3NF – bỏ phụ thuộc bắc cầu**. Vì sao: xoá đơn hàng cuối cùng của khách không được làm mất luôn tên khách (delete anomaly).
4. **Cân nhắc giữ lại bản sao có chủ đích**: giá bán tại thời điểm mua ({{order_line.unit_price}}) **không** phải denormalize sai – nó là sự thật lịch sử, giá sản phẩm sau này đổi cũng không được ảnh hưởng.

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

### Lỗi hay gặp
- **Lưu danh sách id trong một cột chuỗi** ("1,5,9"): triệu chứng – query bằng LIKE, không có FK, xoá phần tử phải parse chuỗi. Cách tránh: bảng liên kết; nếu thật sự cần mảng, PostgreSQL có kiểu array/JSONB kèm GIN index.
- **Nhầm "snapshot lịch sử" với dữ liệu lặp**: chuẩn hoá cả địa chỉ giao hàng về bảng {{customer}}, khách đổi địa chỉ là đơn cũ hiển thị sai. Cách tránh: dữ liệu phải giữ nguyên theo thời điểm (giá, địa chỉ, tên trên hoá đơn) được lưu ngay trong đơn.
- **Cột tổng tính sẵn ({{total_amount}}) không cập nhật cùng transaction** với dòng chi tiết. Triệu chứng – tổng khác tổng các dòng. Cách tránh: cập nhật trong cùng transaction, hoặc dùng job đối soát định kỳ.

### Trả lời miệng 1 phút
"Chuẩn hoá nhằm mỗi sự thật chỉ lưu một chỗ để tránh anomaly khi thêm, sửa, xoá. 1NF yêu cầu mỗi ô một giá trị nguyên tử. 2NF yêu cầu cột không khoá phụ thuộc toàn bộ khoá chính, không phụ thuộc một phần khoá composite. 3NF bỏ phụ thuộc bắc cầu, ví dụ dept_name phụ thuộc dept_id chứ không phụ thuộc trực tiếp emp_id. Với OLTP tôi mặc định thiết kế tới 3NF. Denormalize là đánh đổi: đọc nhanh hơn, ít join hơn, nhưng phải có cơ chế đồng bộ – cùng transaction, trigger hoặc CDC. Tôi chỉ denormalize khi đo được join là nút thắt, và phân biệt rõ với dữ liệu lịch sử như giá tại thời điểm mua, thứ vốn phải được chép vào đơn hàng."

### Ví dụ đời thực
Trên hệ thống bán hàng, bảng {{orders}} chứa cột {{customer_name}} để tránh join với {{customers}} khi hiển thị danh sách đơn. Triệu chứng: sau khi khách hàng đổi tên từ "Nguyen Van A" thành "Nguyen Van B", toàn bộ đơn hàng cũ của khách đó trên màn hình quản trị cũng hiển thị tên mới, và báo cáo doanh thu theo khách bị trộn lẫn. Điều tra bằng truy vấn so sánh {{orders.customer_name}} và {{customers.name}} thấy hàng trăm đơn không khớp. Nguyên nhân gốc: denormalize (chép lại tên khách vào đơn) mà không có cơ chế đồng bộ khi bảng gốc thay đổi, đồng thời quên rằng tên khách trên đơn phải là "sự thật lịch sử" tại thời điểm mua. Cách xử lý: giữ tên khách trong đơn hàng (snapshot) và không cập nhật nó khi khách đổi hồ sơ; nếu cần hiển thị tên mới, hãy join bảng {{customers}} khi truy vấn. Kết quả: đơn hàng cũ hiển thị đúng tên lúc đặt, báo cáo doanh thu khớp thực tế, và không còn dữ liệu lệch giữa hai bảng.

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

### Hiểu nhanh
**Clustered index (InnoDB)** giống **cuốn từ điển**: chính nội dung được xếp theo thứ tự từ (PK), tra tới từ là thấy luôn định nghĩa. Muốn tra theo nghĩa khác (secondary index), bạn dùng một bảng tra phụ, nó chỉ cho bạn "từ" (PK), rồi bạn lại tra từ điển lần nữa. **Heap table (PostgreSQL/Oracle)** giống **kho hàng xếp theo thứ tự nhập**: món mới để vào chỗ trống bất kỳ; mọi bảng tra (kể cả theo mã chính) chỉ ghi "kệ số mấy, ô số mấy" (TID/ROWID), tra xong đi thẳng tới ô đó.

### Thuật ngữ
- **Clustered index**: index mà lá chứa toàn bộ dòng, dữ liệu được sắp vật lý theo khoá index.
- **Secondary (non-clustered) index**: index phụ, lá chứa con trỏ tới dòng (InnoDB: giá trị PK; PostgreSQL: TID).
- **Heap**: vùng lưu dòng không theo thứ tự khoá nào.
- **TID / ctid / ROWID**: địa chỉ vật lý của dòng (block, vị trí trong block).
- **HOT update (Heap-Only Tuple)**: UPDATE trong PostgreSQL không đổi cột có index và tuple mới vừa trong cùng page → không phải thêm entry index.
- **FILLFACTOR**: tỉ lệ lấp đầy page khi ghi, để dành chỗ trống cho update sau.
- **IOT (Index-Organized Table)**: bảng Oracle lưu theo dạng clustered index.

### Tra cứu một dòng, từng bước
~~~text
InnoDB: SELECT * FROM orders WHERE email = 'a@x.vn'
 idx_email (B-tree)  --> lá: ('a@x.vn', PK=42)
 clustered PK        --> 3-4 page --> lá: [42 | toàn bộ cột]
PostgreSQL: cùng query
 idx_email (B-tree)  --> lá: ('a@x.vn', TID=(1050, 7))
 heap                --> đọc page 1050, ô 7 (1 page)
PK 8 byte (BIGINT) vs 36 byte (UUID dạng chuỗi): 5 secondary index x 100 triệu dòng
 -> chênh khoảng 5 x 100tr x 28 byte ≈ 14GB chỉ vì cỡ PK
~~~
1. **Đi secondary index tới lá**. Vì sao lá InnoDB chứa PK chứ không chứa địa chỉ: khi page split làm dòng dời chỗ, không phải sửa mọi secondary index.
2. **InnoDB: tra tiếp clustered index bằng PK** (thêm 3–4 page, thường đã nằm trong buffer pool). PostgreSQL: nhảy thẳng tới heap theo TID (1 page).
3. **Nếu index đã chứa đủ cột** (covering), bỏ được bước 2 – InnoDB tự động có PK trong mọi secondary index nên {{SELECT id, email}} là covering sẵn.
4. **Khi UPDATE**: InnoDB sửa dòng tại chỗ trong clustered index và chỉ sửa secondary index có cột đổi; PostgreSQL tạo tuple mới, nếu không HOT thì phải thêm entry vào **mọi** index.

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

### Lỗi hay gặp
- **Bảng InnoDB không khai báo PK**: InnoDB dùng row id ẩn 6 byte – không truy vấn được, và replication theo dòng (row-based) trên replica có thể rất chậm khi UPDATE/DELETE nhiều dòng vì không có khoá để tìm dòng. Cách tránh: luôn khai báo PK (MySQL 8.0.30+ có {{sql_generate_invisible_primary_key}}).
- **Đánh index lên cột cập nhật liên tục ({{last_seen_at}}) trên PostgreSQL**: mất HOT update, mỗi lần cập nhật ghi vào mọi index. Triệu chứng – {{n_tup_hot_upd}} gần 0, index bloat nhanh. Cách tránh: bỏ index đó hoặc tách cột "nóng" sang bảng riêng.
- **Tin rằng {{CLUSTER}} làm PostgreSQL thành clustered index**: chỉ sắp xếp một lần, giữ khoá ACCESS EXCLUSIVE suốt quá trình. Cách tránh: dùng BRIN/partition theo thời gian nếu cần dữ liệu gần nhau, hoặc {{pg_repack}} để sắp xếp online.

### Trả lời miệng 1 phút
"Trong InnoDB, primary key chính là clustered index: lá của B-tree PK chứa toàn bộ dòng, còn secondary index chứa giá trị PK, nên tra theo secondary là hai lần duyệt cây. PostgreSQL và Oracle mặc định dùng heap: dữ liệu nằm riêng, mọi index kể cả PK chỉ chứa địa chỉ vật lý TID hay ROWID. Hệ quả thực tế: với InnoDB, PK phải ngắn và tăng dần, vì nó lặp trong mọi secondary index và PK ngẫu nhiên gây page split; với PostgreSQL, mỗi UPDATE tạo tuple mới, nên cần thiết kế để tận dụng HOT update bằng fillfactor và tránh index trên cột hay đổi. Kinh nghiệm: khi chuyển từ MySQL sang PostgreSQL, workload update nhiều cần theo dõi n_tup_hot_upd và autovacuum ngay từ đầu."

### Ví dụ đời thực
Trên hệ thống đơn hàng MySQL InnoDB, bảng {{orders}} dùng cột {{id}} kiểu UUID (36 ký tự) làm primary key. Triệu chứng: khi tải cao, INSERT mới chậm hơn và dung lượng bảng tăng nhanh bất thường. Điều tra qua {{SHOW TABLE STATUS}} và xem kích thước index thấy các secondary index to hơn dự kiến, và buffer pool bị áp lực. Nguyên nhân gốc: UUID ngẫu nhiên làm clustered index (B-tree của PK) liên tục tách trang (page split) vì các giá trị mới không nằm liền nhau; hơn nữa, giá trị PK (36 byte) được lặp lại trong mỗi secondary index, khiến index phình to. Cách xử lý: đổi PK thành {{BIGINT AUTO_INCREMENT}} tăng dần, hoặc dùng UUIDv7 có tính chất thời gian tăng dần; giữ UUID làm cột business key với unique index riêng. Kết quả đo được: thời gian INSERT giảm đáng kể, kích thước secondary index thu hẹp khoảng một nửa, và buffer pool hiệu quả hơn.

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
  a: `**Tóm tắt:** Index B-tree giống mục lục sách: nó giúp DB tìm theo giá trị theo thứ tự, nhưng chỉ khi điều kiện trong câu lệnh WHERE "khớp với" thứ tự của index. Năm trường hợp phổ biến khiến optimizer bỏ qua index: (1) hàm/biểu thức bao bọc cột, (2) LIKE bắt đầu bằng %, (3) OR mà không có index phủ cả hai bên, (4) so sánh kiểu khác gây ép kiểu ngầm, (5) cột có ít giá trị riêng biệt (selectivity thấp). Trong các trường hợp này DB thường quét toàn bộ bảng (seq scan), chậm khi bảng lớn.

### Hiểu nhanh
Hãy tưởng tượng index giống mục lục ở cuối cuốn sách: mục lục được sắp theo từ khoá, bạn tra chữ "Java" rất nhanh vì chữ nằm theo thứ tự alphabet. Nhưng nếu yêu cầu "tìm sách có chữ 'Java' nằm ở đâu đó trong mô tả" — tương đương hàm hoặc wildcard ở đầu — mục lục đã không giúp gì, vì mục lục chỉ tra theo từ đầu của mỗi mục. Tương tự, nếu bạn hỏi "sách màu đỏ hoặc xanh" nhưng chỉ có mục lục theo màu, DB phải đọc cả hai mục lục hoặc quét cả cuốn sách. Khi một cột chỉ có hai giá trị (nam/nữ), mục lục cũng không ích nhiều, vì gần như mọi trang sách cũng có cả hai giới. Vậy index hữu ích nhất khi điều kiện khớp giá trị cột thực tế và lọc ra ít dòng.

### Thuật ngữ
- **B-tree index**: cấu trúc mục lục theo thứ tự trong DB, hỗ trợ tìm kiếm, dải giá trị và prefix nhanh.
- **Seq scan / full table scan**: quét từng dòng của bảng từ đầu đến cuối; chậm khi bảng lớn.
- **Expression index**: index tạo trên kết quả của hàm/biểu thức (ví dụ DATE(cột)); chỉ dùng khi query viết đúng biểu thức đó.
- **Implicit cast**: DB tự chuyển kiểu dữ liệu (ví dụ varchar thành số) để so sánh, làm mất khả năng dùng index trên cột gốc.
- **Selectivity**: tỷ lệ dòng khớp điều kiện so với tổng số dòng; càng ít dòng khớp, index càng hữu ích.
- **Partial index**: index chỉ chứa tập con các dòng thỏa mãn điều kiện, thích hợp cho cột ít giá trị riêng biệt.

### 1. Hàm (biểu thức) trên cột
DB tra index theo giá trị thực tế của cột, không theo kết quả của hàm. Khi viết DATE(created_at), giá trị trong index vẫn là datetime đầy đủ, nên DB không biết trang nào chứa các ngày khớp.

Cách hoạt động từng bước:
1. Optimizer xem điều kiện WHERE DATE(created_at) = '2026-01-01'.
2. Cột trong index là created_at (timestamp), còn điều kiện áp hàm DATE() lên cột.
3. Do giá trị index khác giá trị sau hàm, optimizer không thể ánh xạ điều kiện vào index -> bỏ qua index, quét toàn bộ bảng.

Ví dụ số liệu: bảng orders có 1 triệu dòng. Query DATE(created_at) = '2026-01-01' với seq scan đọc cả 1 triệu dòng; viết lại dưới dạng range chỉ đọc vài trăm dòng của ngày đó.

~~~sql
-- KHÔNG dùng index trên created_at (hàm bao bọc cột)
WHERE DATE(created_at) = '2026-01-01'
WHERE YEAR(created_at) = 2026

-- Sửa: viết dưới dạng range trên cột thuần
WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'
~~~

Giải pháp khác: **expression index** – tạo index trên chính biểu thức. MySQL 8.0.13+: {{CREATE INDEX idx_day ON orders ((DATE(created_at)))}}; PostgreSQL: {{CREATE INDEX ON orders ((created_at::date))}} (chỉ với cột {{timestamp}}; với {{timestamptz}} biểu thức phụ thuộc múi giờ, không IMMUTABLE nên không tạo được). Query phải dùng **cùng biểu thức** (cùng hàm, cùng kiểu, cùng collation) mới được dùng index.

### 2. LIKE bắt đầu bằng wildcard (leading wildcard)
B-tree index lưu giá trị theo thứ tự từ trái sang phải, nên nó chỉ hỗ trợ tra theo "đầu từ" (prefix).

Cách hoạt động:
1. WHERE name LIKE 'abc%' có prefix abc -> optimizer dùng index để nhảy đến đoạn abc và quét theo thứ tự.
2. WHERE name LIKE '%abc' hoặc LIKE '%abc%' không có prefix xác định -> không biết điểm bắt đầu trong index -> quét toàn bộ.

Ví dụ đời thường: mục lục sách tra theo chữ cái đầu. Nếu bạn chỉ nhớ từ kết thúc bằng "phim", mục lục không giúp.

~~~sql
WHERE name LIKE '%abc'   -- không dùng B-tree
WHERE name LIKE 'abc%'   -- dùng được (prefix)
~~~

Lưu ý PostgreSQL: prefix LIKE chỉ dùng được B-tree khi collation là {{C}} hoặc index tạo với {{text_pattern_ops}}/{{varchar_pattern_ops}}. Giải pháp cho '%abc%': **trigram index** ({{pg_trgm}} với GIN/GiST) hỗ trợ {{LIKE}}/{{ILIKE}} chứa chuỗi; tìm kiếm ngôn ngữ tự nhiên thì dùng full-text ({{tsvector}}) hoặc search engine.

### 3. OR không có index bao phủ cả hai nhánh
Cách hoạt động:
1. WHERE status = 'ACTIVE' OR priority = 1: nếu chỉ cột status có index, nhánh priority = 1 không thể dùng index đó.
2. Optimizer thường chọn quét toàn bộ bảng thay vì kết hợp hai plan khác nhau.
3. PostgreSQL có BitmapOr (kết hợp bitmap từ hai index), MySQL có index_merge, nhưng không phải lúc nào cũng chọn được.

Thay thế: dùng UNION ALL, mỗi nhánh dùng index riêng, và lọc trùng nếu cần.

~~~sql
-- Chỉ dùng index nếu CẢ HAI cột đều có index
WHERE status = 'ACTIVE' OR priority = 1

-- Thay thế: UNION ALL (mỗi nhánh dùng index riêng)
SELECT * FROM orders WHERE status = 'ACTIVE'
UNION ALL
SELECT * FROM orders WHERE priority = 1
  AND status IS DISTINCT FROM 'ACTIVE'   -- tránh trùng; != sẽ bỏ sót dòng status NULL
~~~

### 4. Ép kiểu ngầm (implicit cast)
Cách hoạt động:
1. Cột phone là VARCHAR(20), nhưng query so sánh WHERE phone = 123456789 (số).
2. DB không thể so sánh trực tiếp kiểu khác, nên ép cột về số (hoặc báo lỗi) trước khi so sánh.
3. Sau khi ép, giá trị trong index (chuỗi) không còn khớp điều kiện -> index bị bỏ qua.

~~~sql
-- Cột phone VARCHAR(20)
WHERE phone = 123456789  -- ép ngầm: index không dùng

-- Sửa: so sánh đúng kiểu
WHERE phone = '123456789'
~~~

PostgreSQL nghiêm ngặt hơn: so sánh {{varchar = integer}} báo lỗi {{operator does not exist}} thay vì ép ngầm. Từ Java, bẫy hay gặp là bind tham số sai kiểu (ví dụ {{setString}} vào cột số, hoặc NVARCHAR với VARCHAR trên Oracle/SQL Server).

### 5. Selectivity thấp
Cách hoạt động:
1. Cột {{status}} chỉ có 3 giá trị ({{PENDING}}, {{DONE}}, {{CANCELLED}}), selectivity khoảng 33%.
2. Optimizer ước tính: quét 33% bảng bằng seq scan nhanh hơn dùng index scan (phải đọc index rồi lấy từng dòng từ heap).
3. Vì vậy optimizer bỏ qua index trên cột này.

**Partial index** giải quyết: chỉ index một tập con cần truy vấn. {{CREATE INDEX ON orders (created_at) WHERE status = 'PENDING'}}.

### Kiểm tra index có được dùng không
Dùng EXPLAIN (ANALYZE, BUFFERS) để xem access path thực tế.

~~~sql
EXPLAIN (ANALYZE, BUFFERS) SELECT * FROM orders WHERE status = 'PENDING';
-- Xem: Index Scan vs Seq Scan, rows removed by filter
~~~

### Lỗi hay gặp
1. **Thêm index trên cột selectivity thấp mà không đo**: query vẫn seq scan, index chỉ tốn dung lượng và làm chậm UPDATE. Cách tránh: dùng EXPLAIN ANALYZE trên dữ liệu production-like trước khi thêm.
2. **Viết hàm trên cột cho mục đích báo cáo và để nguyên ở production**: mỗi lần chạy quét toàn bảng. Cách tránh: viết lại dưới dạng range, hoặc tạo expression index nếu biểu thức ổn định và query dùng đúng nó.
3. **Dùng LIKE '%abc' cho tìm kiếm lớn**: quét hết bảng, chậm theo kích thước bảng. Cách tránh: dùng prefix LIKE, hoặc trigram index / full-text search cho tìm kiếm chứa chuỗi.
4. **Giả định plan tĩnh khi selectivity thay đổi theo thời gian**: status {{PENDING}} từ 1% lên 50% khi hệ thống nghẽn, plan cache (prepared statement) có thể chọn sai plan. Cách tránh: dùng {{force_custom_plan}} hoặc re-prepare, và theo dõi plan định kỳ.

### Trả lời miệng 1 phút
"Index B-tree giống như mục lục sách: nó chỉ giúp bạn tra nhanh khi bạn biết từ đầu của mục lục. Nếu bạn gói cột trong hàm, dùng wildcard ở đầu LIKE, viết OR mà chỉ một bên có index, so sánh kiểu khác gây ép kiểu ngầm, hoặc cột chỉ có ít giá trị riêng biệt, optimizer thường không dùng index mà quét toàn bộ bảng. Giải pháp cơ bản là viết điều kiện trực tiếp trên cột (ví dụ range thay vì hàm), và nếu thực sự cần thì dùng expression index hoặc partial index. Trước khi thêm index, tôi luôn đo bằng EXPLAIN ANALYZE trên dữ liệu gần production để tránh thêm index thừa làm chậm ghi."

### Ví dụ đời thực
Trên hệ thống đơn hàng có bảng {{orders}} hơn 1 triệu dòng, màn hình báo cáo doanh thu theo ngày chạy quá 10 giây. Triệu chứng: truy vấn {{WHERE DATE(created_at) = '2026-01-01'}} chậm kéo dài. Điều tra bằng {{EXPLAIN (ANALYZE, BUFFERS)}} thấy plan là {{Seq Scan}} đọc cả 1 triệu dòng, không dùng index trên {{created_at}}. Nguyên nhân gốc: hàm {{DATE()}} bao bọc cột trong WHERE, nên giá trị trong index (datetime đầy đủ) không khớp giá trị sau hàm, optimizer bỏ qua index. Cách xử lý: viết lại dưới dạng range trên cột thuần: {{WHERE created_at >= '2026-01-01' AND created_at < '2026-01-02'}}. Kết quả đo được: cùng truy vấn chỉ đọc vài trăm dòng của ngày đó, thời gian chạy từ hơn 10 giây xuống dưới 100 miligiây.

> Senior tip: trước khi thêm index, hãy **đo bằng EXPLAIN ANALYZE** trên dữ liệu production-like. Một index thừa không chỉ tốn disk mà còn làm UPDATE chậm hơn đáng kể. Nguyên tắc: mỗi index phải có một lý do đo được.
`,
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
  a: `**Tóm tắt:** Redis là **cửa hàng cấu trúc dữ liệu trong bộ nhớ** (in-memory data structure store): không chỉ lưu key-value đơn giản, mà cung cấp các cấu trúc gốc như String, Hash, List, Set, Sorted Set, Bitmap, HyperLogLog, Stream, mỗi cái giải quyết một bài toán riêng. Chọn sai cấu trúc (ví dụ: dùng String + JSON cho session phức tạp) sẽ khiến mỗi lần cập nhật phải đọc toàn bộ đối tượng, Parse JSON, sửa, ghi lại — chậm và dễ bị lỗi đồng thời.

### Hiểu nhanh
Hãy tưởng tượng Redis như một quầy thuốc tiên tiến: String giống một chiếc phôi thuốc đơn giản (một giá trị duy nhất), Hash giống một tờ phiếu với nhiều trường (mã bệnh nhân, tuổi, chỉ số), List giống hàng đợi đón thuốc theo thứ tự, Set giống danh sách bệnh nhân không trùng lặp, Sorted Set giống bảng xếp hạng sắp theo điểm, Bitmap giống bảng chấm điểm đúng/sai từng ngày, HyperLogLog giống máy ước lượng số khách độc lập mà không cần ghi từng tên, Stream giống hàng đợi tin nhắn có ghi nhận đã đọc. Mỗi cấu trúc dùng đúng mục đích sẽ nhanh, dùng sai sẽ chậm và phức tạp.

### Thuật ngữ
- **Redis**: cửa hàng dữ liệu trong bộ nhớ (RAM), dùng làm cache hoặc cơ sở dữ liệu nhẹ.
- **In-memory**: dữ liệu nằm toàn bộ trong RAM, nên truy xuất cực nhanh nhưng mất nếu mất điện (trừ khi bật persistence).
- **Key-value**: mô hình lưu cặp "khóa - giá trị", ví dụ key "user:123" và giá trị "Nguyen Van A".
- **Hash table**: cấu trúc tra cứu theo khóa trong O(1), Redis dùng để lưu Hash.
- **O(1) / O(log n)**: thời gian thực hiện thao tác không phụ thuộc vào số phần tử (O(1)) hoặc phụ thuộc lũy tiến (O(log n)).
- **TTL**: thời gian tồn tại của một khóa, sau đó Redis tự xóa (dùng cho cache, session).
- **Fencing token**: mã số tăng dần dùng để ngăn worker cũ ghi dữ liệu sau khi mất khoá (tránh ghi đè nhầm).

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
- **Rate limit sliding window**: Sorted Set với score = timestamp. Ví dụ 100 request/phút: mỗi request chạy {{ZADD limit:user:1 <ts> <ts>}}, sau đó {{ZREMRANGEBYSCORE limit:user:1 -inf <ts-60s>}} xoá entry cũ và {{ZCARD limit:user:1}} đếm số request còn lại. Nếu > 100 thì từ chối.
- **Distributed lock**: {{SET lock:order:123 "owner1" NX EX 10}} – nguyên tử, tự hết hạn sau 10 giây. Cần Lua script để unlock an toàn (chỉ unlock nếu value khớp owner). Lock trên master với replication async có thể mất khi failover – với tác vụ quan trọng, kết hợp fencing token hoặc ràng buộc ở DB.
- **Leaderboard**: {{ZADD leaderboard 1500 "user:1"}}, {{ZREVRANGE leaderboard 0 9}} lấy top 10.
- **Session**: Hash {{session:abc123}} với field {{user_id}}, {{role}}, {{last_seen}} – {{HGETALL}} lấy toàn bộ, {{HINCRBY}} cập nhật counter một trường duy nhất mà không đọc lại toàn bộ đối tượng.

### Lỗi hay gặp
1. **Dùng String + JSON cho session**: mỗi lần cập nhật một trường phải GET -> deserialize -> modify -> serialize -> SET (dễ race condition, tốn CPU). Cách tránh: dùng Hash và {{HSET}} trường đơn lẻ.
2. **List làm queue không có consumer group, không ack**: mất message khi worker crash. Cách tránh: dùng **Stream** cho queue production (có consumer group + acknowledgment).
3. **Big key** (Hash/List/Set/ZSet lớn): lệnh như {{DEL}}, {{HGETALL}}, {{ZRANGE}} chặn luồng đơn của Redis. Cách tránh: dùng {{UNLINK}} (xóa bất đồng bộ), {{SCAN}}/{{HSCAN}}/{{ZSCAN}} duyệt theo cursor.
4. **Lua script** dùng sai: thao tác phức hợp không nguyên tử gây race condition trong lock, rate limit. Cách tránh: gói check-then-act vào Lua script thực thi nguyên tử.

### Trả lời miệng 1 phút
"Redis không chỉ là key-value đơn giản, mà là cửa hàng cấu trúc dữ liệu trong bộ nhớ. Mỗi cấu trúc giải quyết một bài toán: String dùng cho cache đơn giản và counter, Hash dùng cho session và object cache, List dùng cho hàng đợi đơn giản, Set dùng cho tagging và khách độc lập, Sorted Set dùng cho bảng xếp hạng và giới hạn tốc độ trượt, Bitmap dùng cho chấm điểm, HyperLogLog dùng cho ước lượng số lượng duy nhất, Stream dùng cho hàng đợi tin nhắn có xác nhận. Tôi chọn cấu trúc theo yêu cầu: session thường dùng Hash để cập nhật từng trường, leaderboard dùng Sorted Set, rate limit sliding window dùng Sorted Set, queue cần xác nhận dùng Stream. Tránh dùng String + JSON cho session vì mỗi cập nhật phải đọc-ghi toàn bộ đối tượng."

### Ví dụ đời thực
Trên hệ thống đăng nhập, thông tin session ({{user_id}}, {{role}}, {{last_seen}}) được lưu dưới dạng String dưới dạng JSON. Triệu chứng: khi nhiều tab cùng hoạt động, trường {{last_seen}} bị ghi đè và thời gian hoạt động cuối cùng sai; đôi khi session bị mất một trường sau khi cập nhật. Điều tra qua code thấy mỗi lần cập nhật một trường phải {{GET}} toàn bộ JSON, deserialize, sửa, {{serialize}}, {{SET}} lại – hai request cùng làm sẽ ghi đè lẫn nhau (race condition). Nguyên nhân gốc: String lưu toàn bộ đối tượng làm một giá trị, không thể cập nhật từng trường một. Cách xử lý: chuyển sang Hash {{session:<id>}} với các field {{user_id}}, {{role}}, {{last_seen}}, dùng {{HSET}} cập nhật một trường duy nhất và {{HGETALL}} khi cần toàn bộ. Kết quả: cập nhật {{last_seen}} không đọc lại toàn bộ đối tượng, không còn race condition trên trường đó, và giảm lưu lượng Redis mỗi request.

> Senior tip: Redis không phải "cache thôi". Nắm vững 8 cấu trúc dữ liệu và biết khi nào dùng cái nào là dấu hiệu dev senior. Ví dụ: rate limit dùng Sorted Set (sliding window) hoặc String (fixed window/token bucket); leaderboard dùng Sorted Set; session thường dùng Hash (Spring Session Redis cũng lưu session dạng Hash); queue cần ack thì dùng Stream.
`,
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
  a: `**Tóm tắt:** Redis nhanh nhờ **I/O multiplexing** (epoll/kqueue) + **single-threaded event loop** (không context switch, không lock contention) + **cấu trúc dữ liệu đơn giản** (O(1) hoặc O(log n)) + **toàn bộ dữ liệu trong RAM**. **RDB** (snapshot) nhanh, compact, phục hồi nhanh nhưng **mất dữ liệu** từ lần snapshot cuối. **AOF** (append-only log) bền vững hơn, configurable fsync ({{always}}/{{everysec}}/{{no}}), file lớn hơn, phục hồi chậm hơn. Redis **có thể mất dữ liệu** tùy cấu hình persistence và failure scenario.

### Hiểu nhanh
Hãy tưởng tượng Redis như một nhà vô địch chạy nước rút: mặc dù chỉ có một đôi chân (thread), nhưng anh ta có thể quản lý hàng nghìn việc cùng lúc nhờ cơ chế I/O multiplexing (giống như đồng thời mở nhiều cửa và chỉ làm việc khi cửa đó sẵn sàng) và cấu trúc dữ liệu siêu tối ưu. Persistence giống như hai cách sao lưu: snapshot (chụp ảnh toàn bộ dữ liệu theo lịch) và nhật ký ghi liên tục (ghi từng thao tác). Mất dữ liệu xảy ra khi crash giữa các lần sao lưu hoặc replication chưa kịp cập nhật.

### Thuật ngữ
- **I/O multiplexing**: một cơ chế cho phép một thread quản lý nhiều socket, chỉ xử lý các socket sẵn sàng (ví dụ epoll trên Linux).
- **Event loop**: vòng lặp không ngừng lấy công việc từ hàng đợi và thực hiện; đơn thread, không có context switch.
- **Child process**: tiến trình phụ được fork từ main process để ghi RDB, hoàn toàn độc lập.
- **Append-only file (AOF)**: file văn bản ghi tuần tự mọi write command, sau đó có thể được rewrite để nén.
- **fsync**: lệnh đảm bảo dữ liệu ghi vào disk, có các chế độ always, everysec, no.
- **Snapshot**: trạng thái persisted của Redis ghi ra đĩa theo thời gian định kỳ (ví dụ save 900 1).
- **Replication lag**: độ trễ giữa master và replica khi replication diễn ra bất đồng bộ.

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
| Mất dữ liệu | Từ snapshot cuối tới crash | Tuỳ {{appendfsync}}: {{always}} ≈ 0, {{everysec}} ≈ 1s (tệ nhất ~2s), {{no}} = tuỳ OS cache |
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
no-appendfsync-on-rewrite no   # yes giảm latency lúc rewrite nhưng có thể mất tới ~30s dữ liệu
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
~~~
Với dữ liệu tài chính/critical: {{appendfsync always}} + replica + backup định kỳ.

### Lỗi hay gặp
- **Tắt persistence** ({{save ""}} + {{appendonly no}}) -> Redis thành pure cache, restart = mất sạch.
- **RDB fork() latency spike** trên instance memory lớn (>10GB) -> lời gọi fork chặn main thread (có thể từ hàng chục tới hàng trăm ms, nhất là trên VM). Giảm {{save}} frequency hoặc dùng AOF.
- **AOF rewrite** (compaction) cũng fork -> tương tự. Theo dõi {{aof_rewrite_in_progress}} metric.
- **Replication lag**: master write nhanh, replica chậm -> failover mất dữ liệu. Dùng {{min-replicas-to-write}} + {{min-replicas-max-lag}} để master từ chối write nếu replica quá chậm – chỉ giới hạn cửa sổ mất dữ liệu, không loại bỏ hoàn toàn.

### Trả lời miệng 1 phút
"Redis là cửa hàng dữ liệu trong bộ nhớ (RAM) có single-threaded event loop và I/O multiplexing, giúp nó xử lý hàng nghìn kết nối mà không cần context switch. Persistence có hai chế độ: snapshot (chụp ảnh nhanh) và nhật ký ghi (ghi từng thao tác). Mất dữ liệu xảy ra khi crash giữa các lần sao lưu hoặc replication chưa kịp cập nhật. Tôi chọn cấu hình bền vững dựa trên SLO: cache chấp nhận mất vài giây, còn billing thì phải có appendfsync always + replica."

### Ví dụ đời thực
Một trang thương mại điện tử dùng Redis làm cache danh sách sản phẩm (keyspace hits 95%). Sau lần restart máy chủ, toàn bộ cache biến mất: dashboard DB cho thấy query SELECT sản phẩm nhảy từ 200 lên 15.000 query/giây, CPU DB lên 80% trong 10 phút. Điều tra file {{redis.conf}} thấy {{save ""}} và {{appendonly no}} → Redis không persistence, restart = mất sạch. Nguyên nhân gốc: Redis được coi là pure cache mà không sao lưu. Xử lý: bật lại {{save 900 1}}, {{appendonly yes}}, {{appendfsync everysec}}, và thêm replica đọc cache. Sau đó restart lần sau chỉ mất dữ liệu mới ghi trong 1 giây (AOF everysec), replica giữ 90% hit rate ngay khi master restart. Kết quả: query DB về sản phẩm giảm từ 15.000 xuống 1.200 query/giây sau mỗi restart.

> Senior tip: không có "miễn phí" – muốn tốc độ tối đa (sub-ms) thì chấp nhận rủi ro mất dữ liệu (chỉ RDB hoặc AOF everysec). Muốn hạn chế mất dữ liệu -> {{appendfsync always}} + replica + lệnh {{WAIT}} (Redis không có replication đồng bộ thật sự) -> latency tăng; dữ liệu tuyệt đối không được mất thì nguồn sự thật nên là DB. Hãy quy ước **SLO rõ ràng**: "rate limit/session/cache chấp nhận mất", "billing/inventory/idempotency key KHÔNG được mất".",
`,
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

### Hiểu nhanh
Gọi một procedure Oracle trả REF CURSOR giống **gọi điện tới kho và được đưa một "tấm vé lấy hàng"** thay vì hàng: tấm vé (cursor) chỉ có giá trị khi đường dây (connection) còn mở – bạn phải theo vé ra lấy hàng ngay, từng xe một (fetch), rồi mới cúp máy. Nếu bạn cúp máy rồi mới đưa vé cho người khác đi lấy, vé vô hiệu. Spring JDBC lo phần gọi điện, giữ máy, đọc hàng ra và đóng máy giúp bạn – việc của bạn là **khai báo đúng** tham số vào/ra và **chuyển hàng sang DTO** ngay trong lúc còn giữ máy.

### Thuật ngữ
- **PL/SQL package**: nhóm procedure/function/kiểu dữ liệu của Oracle dưới một tên, gồm phần spec (khai báo) và body (cài đặt).
- **REF CURSOR**: con trỏ tới một result set mở trên server, trả về qua tham số OUT.
- **IN / OUT parameter**: tham số truyền vào / tham số procedure ghi kết quả ra.
- **SimpleJdbcCall**: lớp Spring giúp gọi procedure/function, tự sinh câu {{call}} và map tham số.
- **Metadata discovery**: Spring đọc định nghĩa tham số từ dictionary của DB qua driver; với package/overload dễ sai, nên khai báo tường minh.
- **Overload**: nhiều procedure cùng tên trong package nhưng khác danh sách tham số.
- **OracleTypes.CURSOR**: hằng số kiểu của driver Oracle ({{oracle.jdbc.OracleTypes}}) để đăng ký tham số OUT là cursor.
- **RowMapper**: hàm chuyển một dòng ResultSet thành object Java.

### Một lần gọi đi qua các lớp, từng bước
~~~text
Service (@Transactional(readOnly = true))
  -> DAO: call.execute(Map.of("p_account_id", 42))
       Spring: lấy connection (đã gắn với transaction)
       JDBC  : { call BANK_APP.ACCOUNT_PKG.FIND_ENTRIES(?, ?) }
               bind IN = 42, registerOutParameter(2, OracleTypes.CURSOR)
       Oracle: mở cursor, trả handle
       Spring: đọc ResultSet theo fetch size, RowMapper -> List<Entry>, đóng ResultSet
  <- Map {"p_rows" -> List<Entry>}
Service: dùng List<Entry> (cursor đã đóng, an toàn)
~~~
1. **Khai báo schema, package (catalog), procedure** đúng như trên DB. Vì sao: Oracle tìm theo tên đầy đủ; thiếu package sẽ báo PLS-00201 hoặc gọi nhầm procedure.
2. **Khai báo tham số tường minh và tắt metadata** ({{withoutProcedureColumnMetaDataAccess}}). Vì sao: tránh lỗi khi có overload, synonym hoặc user ứng dụng không có quyền đọc dictionary.
3. **Đăng ký OUT cursor kèm RowMapper**. Vì sao: Spring đọc hết cursor ngay trong {{execute}} và đóng nó, nên kết quả trả về là List bình thường.
4. **Bọc trong transaction phù hợp** ({{readOnly}} cho truy vấn, transaction ghi nếu procedure có DML). Vì sao: procedure ghi dữ liệu thì commit/rollback phải do Spring điều khiển, không để procedure tự {{COMMIT}} bên trong.
5. **Lấy kết quả từ Map theo đúng tên tham số** và ép kiểu an toàn ({{@SuppressWarnings("unchecked")}} hoặc một hàm helper).

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

### Lỗi hay gặp
- **Procedure tự {{COMMIT}} bên trong**: Spring rollback không còn tác dụng với phần đã commit. Triệu chứng – lỗi ở bước Java sau đó nhưng dữ liệu vẫn được lưu nửa vời. Cách tránh: thoả thuận với team DB để procedure không commit, ranh giới transaction thuộc về ứng dụng.
- **Tên cột trong RowMapper sai hoa thường hoặc alias**: Oracle trả tên cột chữ HOA; đổi alias trong procedure là RowMapper lỗi "invalid column name" lúc chạy. Cách tránh: integration test gọi procedure thật, tên cột là hợp đồng có version.
- **Gọi procedure trả hàng trăm nghìn dòng vào List**: OutOfMemoryError. Cách tránh: dùng {{JdbcTemplate.execute(CallableStatementCallback)}} để tự đọc ResultSet theo luồng (streaming) và xử lý từng lô (xem thêm câu về fetch size/BULK COLLECT).

### Trả lời miệng 1 phút
"Với procedure Oracle trả REF CURSOR, tôi dùng SimpleJdbcCall khai báo schema, package là catalog, tên procedure, và tắt metadata discovery để khai báo tham số tường minh: IN là account id, OUT là OracleTypes.CURSOR kèm RowMapper. Spring đọc hết cursor ngay trong lúc execute khi connection còn mở, map sang DTO rồi đóng, nên tôi không bao giờ trả ResultSet ra khỏi DAO. Transaction do Spring quản lý, procedure không được tự commit. Trade-off: JdbcTemplate thuần cho kiểm soát tối đa, SimpleJdbcCall gọn khi có nhiều OUT param, còn JPA native thì vụng với cursor. Kinh nghiệm: luôn có integration test trên Oracle thật, vì H2 không mô phỏng được package, cursor hay tên cột chữ hoa."

### Ví dụ đời thực
Một báo cáo ngân hàng gọi gói PL/SQL {{BANK_APP.REPORT_PKG}} trả REF CURSOR qua Spring JDBC. Lần đầu chạy trên dữ liệu thật ném lỗi "invalid column name" ở hàng thứ 3.000. Điều tra: trong Java RowMapper dùng tên cột viết thường (ví dụ {{entry_id}}), còn Oracle trả tên cột chữ HOA ({{ENTRY_ID}}). Nguyên nhân gốc: tên cột Oracle viết hoa theo mặc định, và alias trong procedure không khớp tên dùng trong RowMapper. Xử lý: đổi RowMapper đọc tên cột viết hoa (hoặc thêm alias trong SQL của procedure), rồi chạy integration test trên Oracle thật với dữ liệu lớn. Kết quả: báo cáo chạy đúng, không còn lỗi "invalid column name", và team giữ test này trong CI để phát hiện sớm khi procedure thay đổi tên cột.

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

### Hiểu nhanh
Chuyển 500 nghìn thùng hàng từ kho (Oracle) sang xưởng (Java) giống **chở bằng xe tải**: chở từng thùng một (fetch từng dòng) thì tốn 500 nghìn chuyến; dồn cả 500 nghìn thùng lên một xe khổng lồ (đọc hết vào List) thì xe sập (hết heap). Cách đúng là **xe vừa phải, chạy nhiều chuyến** – fetch size 500 dòng mỗi lượt, xưởng xử lý xong lô này rồi mới nhận lô sau. Còn nếu việc cần làm chỉ là "chuyển thùng từ kệ A sang kệ B trong cùng kho", đừng chở ra xưởng làm gì: để kho tự làm bằng **BULK COLLECT/FORALL** theo từng lô.

### Thuật ngữ
- **Fetch size**: số dòng driver JDBC lấy từ server trong mỗi round-trip; driver Oracle mặc định chỉ 10.
- **Round-trip**: một lượt hỏi–đáp qua mạng giữa app và DB.
- **Context switch PL/SQL ↔ SQL**: chi phí mỗi lần engine PL/SQL chuyển một câu lệnh sang engine SQL và nhận kết quả.
- **BULK COLLECT ... LIMIT n**: lấy n dòng mỗi lần vào một collection PL/SQL.
- **FORALL**: gửi cả collection vào một câu DML trong một lần chuyển ngữ cảnh.
- **SAVE EXCEPTIONS**: cho FORALL chạy tiếp khi một phần tử lỗi, gom lỗi vào {{SQL%BULK_EXCEPTIONS}}.
- **PGA**: vùng nhớ riêng của mỗi session Oracle, nơi chứa collection PL/SQL.
- **Streaming**: xử lý dữ liệu theo dòng/lô khi nó tới, không giữ toàn bộ trong bộ nhớ.

### Con số giúp chọn, từng bước
~~~text
500.000 dòng, RTT mạng 1ms
 fetch size 10   (mặc định Oracle) : 50.000 round-trip ≈ 50s chỉ để chờ mạng
 fetch size 500                     :  1.000 round-trip ≈ 1s
 fetch size 50.000                  :     10 round-trip, nhưng mỗi lô ~ vài chục MB heap
PL/SQL từng dòng: 500.000 INSERT = 500.000 lần chuyển ngữ cảnh
FORALL lô 500   : 1.000 lần chuyển ngữ cảnh
~~~
1. **Hỏi: Java có cần thấy dữ liệu không?** Nếu chỉ biến đổi/sao chép trong DB, làm trong Oracle. Vì sao: dữ liệu không phải đi qua mạng hai lần.
2. **Nếu Java cần**: đọc REF CURSOR theo luồng, {{setFetchSize(500)}}, xử lý và ghi xuống downstream từng lô. Vì sao: bộ nhớ chỉ giữ một lô, round-trip giảm 50 lần so với mặc định.
3. **Nếu làm trong Oracle**: {{BULK COLLECT ... LIMIT}} + {{FORALL}}. Vì sao LIMIT: collection nằm trong PGA, không giới hạn thì 500 nghìn dòng có thể chiếm hàng trăm MB mỗi session.
4. **Quyết định ranh giới commit**: một transaction cho cả job (dễ rollback, nhưng giữ undo lâu) hay commit theo lô (nhẹ hơn nhưng phải có checkpoint để chạy tiếp). Vì sao quan trọng: nó đổi ý nghĩa "thành công/thất bại" của job.
5. **Đo**: rows/giây, heap Java, PGA, số round-trip; tăng fetch size/LIMIT chỉ khi số đo chỉ ra mạng là nút thắt.

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
- {{COMMIT}} bên trong vòng lặp đang fetch từ cursor (fetch across commit) làm tăng nguy cơ lỗi ORA-01555 snapshot too old: cursor vẫn cần undo cũ để đọc nhất quán, còn commit cho phép Oracle tái sử dụng vùng undo đó. Job dài nên chia theo khoảng khóa và mở cursor mới cho mỗi khoảng.

### Lỗi hay gặp
- **Để fetch size mặc định 10** khi đọc báo cáo lớn từ Oracle: triệu chứng – query trên DB chỉ mất 2s nhưng Java mất 1 phút. Cách tránh: {{jdbcTemplate.setFetchSize(500)}} hoặc {{hibernate.jdbc.fetch_size}}, hoặc {{defaultRowPrefetch}} của driver.
- **Mang thói quen sang PostgreSQL**: driver PostgreSQL chỉ dùng cursor phía server (fetch theo lô) khi **autocommit tắt** và có fetch size; nếu không, nó tải hết kết quả vào bộ nhớ. Cách tránh: đọc trong {{@Transactional}} và đặt fetch size.
- **Commit theo lô mà không có checkpoint**: job chết ở lô 600/1000, chạy lại thì xử lý trùng 600 lô đầu. Cách tránh: lưu "khoá cuối đã xử lý" sau mỗi lô, thiết kế ghi idempotent (MERGE thay vì INSERT).
- **Mở cursor lâu trên bảng đang bị sửa nhiều**: Oracle báo ORA-01555 "snapshot too old" vì undo cũ đã bị ghi đè. Cách tránh: rút ngắn thời gian đọc, chia theo khoảng khoá, tăng undo retention có cân nhắc.

### Trả lời miệng 1 phút
"Tôi chọn theo câu hỏi dữ liệu có cần ra Java hay không. Nếu Java phải xử lý hay đẩy sang hệ khác, tôi đọc REF CURSOR theo luồng với fetch size vài trăm dòng – mặc định của Oracle chỉ 10 nên rất tốn round-trip – và xử lý từng lô để heap không phình. Nếu chỉ là biến đổi dữ liệu trong DB, tôi để PL/SQL làm bằng BULK COLLECT có LIMIT và FORALL, giảm chuyển ngữ cảnh mà vẫn giới hạn bộ nhớ PGA. Trade-off lớn nhất là ranh giới commit: commit theo lô nhẹ hơn nhưng đổi ngữ nghĩa atomic, nên cần checkpoint và ghi idempotent để chạy tiếp được. Kinh nghiệm: chỉ riêng việc tăng fetch size từ 10 lên 500 từng giúp tôi giảm một job từ vài phút xuống vài giây."

### Ví dụ đời thực
Một batch job đọc 500.000 dòng từ bảng giao dịch Oracle vào Java để xuất file đối soát. Job chạy 5 phút và heap Java nhảy lên 2 GB. Điều tra: JDBC driver dùng fetch size mặc định là 10 → 50.000 round-trip qua mạng, mỗi round-trip khoảng 1ms nên chỉ chờ mạng đã 50 giây; đồng thời Java giữ toàn bộ result set trong bộ nhớ. Nguyên nhân gốc: không set fetch size và đọc hết vào List. Xử lý: set {{jdbcTemplate.setFetchSize(500)}}, đọc REF CURSOR theo luồng và ghi từng lô 500 dòng vào file, không giữ toàn bộ trong heap. Kết quả: job xuống còn khoảng 30 giây, heap ổn định dưới 300 MB, và có thể chạy trên pod nhỏ hơn.

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

### Hiểu nhanh
Sequence giống **máy lấy số thứ tự đặt giữa sảnh ngân hàng**: ai cần cũng bấm lấy được, kể cả nhiều quầy (nhiều bảng) dùng chung, và bạn cầm số trong tay **trước khi** tới quầy. Identity giống **máy lấy số gắn liền vào từng quầy**: tiện, không phải quản lý riêng, nhưng chỉ khi đứng ở quầy (insert) mới biết số của mình. Cả hai đều có thể **nhảy số**: người lấy số rồi bỏ về (rollback), hay máy in sẵn một xấp số rồi mất điện (cache) – nên số thứ tự không bao giờ được dùng làm số hoá đơn liên tục.

### Thuật ngữ
- **Sequence**: object sinh số tăng dần, độc lập với transaction.
- **Identity column**: cột tự sinh giá trị khi insert ({{GENERATED ... AS IDENTITY}}); Oracle 12c+ và PostgreSQL 10+ đều có, bên dưới vẫn là sequence.
- **GENERATED ALWAYS / BY DEFAULT**: luôn tự sinh (cấm tự chèn giá trị) / chỉ sinh khi không truyền giá trị.
- **CACHE**: số giá trị sequence cấp sẵn trong bộ nhớ; Oracle mặc định 20.
- **Gap**: khoảng trống trong dãy id do rollback, cache bị bỏ hoặc restart.
- **allocationSize / pooled optimizer**: Hibernate gọi sequence một lần rồi tự cấp một dải id trong bộ nhớ.
- **JDBC batching**: gom nhiều câu INSERT gửi một lần để giảm round-trip.
- **getGeneratedKeys / RETURNING**: cách lấy giá trị id vừa sinh sau khi insert.

### Insert 10.000 bản ghi bằng Hibernate, từng bước
~~~text
GenerationType.IDENTITY:
  persist #1 -> INSERT ngay (phải lấy id) -> getGeneratedKeys -> ... x10.000
  => 10.000 round-trip, Hibernate tắt JDBC insert batching
GenerationType.SEQUENCE (allocationSize = 50, INCREMENT BY 50):
  persist #1  -> SELECT nextval -> 1   (cấp 1..50 trong RAM)
  persist #51 -> SELECT nextval -> 51  (cấp 51..100)
  flush       -> INSERT gom theo lô 50 (hibernate.jdbc.batch_size = 50)
  => 200 lần lấy sequence + 200 batch, nhanh hơn nhiều lần
~~~
1. **Quyết định id cần có trước hay sau insert**. Vì sao: Hibernate cần id ngay khi {{persist}} để đưa entity vào persistence context; identity buộc phải insert ngay để biết id.
2. **Với sequence, đặt allocationSize = INCREMENT BY**. Vì sao: Hibernate tính dải id dựa trên giả định đó; lệch sẽ trùng id hoặc lỗi khởi động (Hibernate 6 kiểm tra).
3. **Bật {{hibernate.jdbc.batch_size}} và {{order_inserts}}**. Vì sao: chỉ khi id có sẵn thì batching mới phát huy.
4. **Chấp nhận gap, không dùng id cho nghiệp vụ**. Vì sao: sequence không tham gia transaction (rollback không trả số), cache bị bỏ khi restart/failover; số chứng từ liên tục phải có cơ chế riêng (bảng counter khoá theo dòng, chấp nhận chậm hơn).
5. **Viết migration theo từng dialect** cho DDL sequence/identity. Vì sao: cú pháp và tên sequence ngầm định khác nhau giữa Oracle và PostgreSQL.

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

### Lỗi hay gặp
- **Import dữ liệu với id có sẵn rồi quên chỉnh sequence**: insert mới báo lỗi trùng khoá chính. Triệu chứng – "duplicate key value violates unique constraint" ngay sau khi migrate. Cách tránh: PostgreSQL {{SELECT setval('payment_id_seq', (SELECT max(id) FROM payment))}}; Oracle (cột identity) {{ALTER TABLE ... MODIFY id GENERATED ... AS IDENTITY (START WITH LIMIT VALUE)}} hoặc tạo lại sequence với START WITH lớn hơn.
- **Dùng IDENTITY rồi thắc mắc batch insert chậm**: Hibernate âm thầm tắt batching. Cách tránh: dùng SEQUENCE cho bảng ghi nhiều.
- **Sắp xếp "theo thời gian tạo" bằng id**: trên Oracle RAC với sequence NOORDER, hoặc khi transaction id nhỏ commit sau id lớn, thứ tự sai. Cách tránh: cột {{created_at}} riêng; consumer đọc theo id (polling "id > last_id") có thể bỏ sót dòng commit muộn.

### Trả lời miệng 1 phút
"Sequence là object độc lập, cấp số trước khi insert và dùng chung được nhiều bảng; identity gắn generator với cột, gọn hơn nhưng chỉ biết id sau khi insert – và cả hai bên dưới đều là sequence. Với JPA, tôi chọn SEQUENCE với allocationSize bằng INCREMENT BY cho bảng ghi nhiều, vì Hibernate cấp id trong bộ nhớ và giữ được JDBC batching; IDENTITY buộc insert từng dòng và tắt batching. Cả hai đều có gap do rollback, cache và restart, và không đảm bảo thứ tự commit, nên id chỉ là định danh kỹ thuật. Khi chạy cả Oracle lẫn PostgreSQL, tôi viết migration theo dialect và test batch insert thật. Kinh nghiệm: số hoá đơn liên tục luôn phải là một cơ chế nghiệp vụ riêng có audit."

### Ví dụ đời thực
Sau khi migrate dữ liệu lịch sử sang Oracle (có cột id sinh bằng sequence), team nhập lại 2 triệu bản ghi với id có sẵn nhưng quên điều chỉnh sequence. Lần insert đơn hàng mới sau migrate ngay bị lỗi "duplicate key" vì sequence vẫn cấp số từ 1. Điều tra: {{SELECT payment_seq.NEXTVAL FROM DUAL}} trả số nhỏ hơn max(id) trong bảng. Nguyên nhân gốc: sequence độc lập transaction và không tự theo dõi max id đã nhập. Xử lý: chạy {{DROP SEQUENCE payment_seq}} rồi {{CREATE SEQUENCE payment_seq START WITH <max(id) + 1>}} (Oracle) hoặc {{SELECT setval('payment_id_seq', (SELECT max(id) FROM payment))}} (PostgreSQL) để sequence bắt đầu sau id lớn nhất. Kết quả: insert mới không còn trùng khoá chính, và team thêm sanity check trong migration: sequence value phải lớn hơn max(id) hiện tại.

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

### Hiểu nhanh
Optimizer của Oracle giống **người lập kế hoạch giao hàng dựa trên số liệu thống kê** về các con đường. Khi dữ liệu tăng mạnh mà thống kê vẫn là của năm ngoái, nó tưởng "khách hàng này chỉ có 10 giao dịch" nên chọn lộ trình dành cho đơn nhỏ – thực tế là 2 triệu giao dịch. **Hint** giống bạn viết lên phiếu "bắt buộc đi đường X": có thể cứu chuyến hôm nay, nhưng mai đường X kẹt thì xe vẫn phải đi đường X. Vì vậy trước khi ép, hãy sửa **thông tin đầu vào** (thống kê, câu SQL, index) để người lập kế hoạch tự chọn đúng.

### Thuật ngữ
- **SQL_ID / child cursor**: định danh của câu SQL trong shared pool / các biến thể plan của cùng câu SQL.
- **Estimated vs actual rows (E-Rows / A-Rows)**: số dòng optimizer đoán / số dòng thật khi chạy.
- **DBMS_XPLAN.DISPLAY_CURSOR**: hiển thị plan thật của cursor trong bộ nhớ; với {{'ALLSTATS LAST'}} cho cả số liệu thực thi.
- **Histogram**: thống kê phân bố giá trị của một cột, giúp ước tính đúng khi dữ liệu lệch (skew).
- **Bind peeking**: optimizer nhìn giá trị bind lần parse đầu để chọn plan, rồi tái dùng plan đó.
- **Adaptive cursor sharing**: Oracle 11g+ phát hiện bind khác nhau cần plan khác và tạo thêm child cursor.
- **Hint**: chú thích {{/*+ ... */}} trong SQL hướng dẫn optimizer (INDEX, LEADING, USE_HASH...).
- **SQL Plan Baseline**: cơ chế SPM của Oracle lưu các plan đã được chấp nhận để tránh plan regression.

### Chẩn đoán một query chậm, từng bước
~~~text
SELECT /*+ gather_plan_statistics */ ... ;     -- chạy với bind thật
SELECT * FROM table(DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST'));
| Id | Operation                    | Name        | E-Rows | A-Rows | Buffers |
|  1 |  NESTED LOOPS                |             |     12 |  1.8M  |  4.2M   |
|  2 |   INDEX RANGE SCAN           | TXN_ACC_IDX |     12 |  1.8M  |  9.1K   |
|  3 |   TABLE ACCESS BY INDEX ROWID| TXN         |      1 |      1 |  4.1M   |
=> E-Rows 12 vs A-Rows 1.8 triệu: thống kê cũ/thiếu histogram trên account_id
~~~
1. **Lấy đúng câu SQL và bind thật** (từ AWR/ASH hoặc {{V$SQL}}). Vì sao: plan phụ thuộc bind; test với một giá trị "đẹp" sẽ không tái hiện được.
2. **Xem plan thực tế, không phải EXPLAIN PLAN**. Vì sao: EXPLAIN PLAN không nhìn bind peeking, có thể khác plan đang chạy.
3. **Tìm dòng E-Rows lệch A-Rows nhiều nhất** – thường là gốc rễ. Ở ví dụ, 1,8 triệu lần TABLE ACCESS BY ROWID tốn 4,1 triệu buffer.
4. **Sửa đầu vào trước**: {{DBMS_STATS.GATHER_TABLE_STATS}} (kèm histogram cho cột lệch), viết lại predicate cho sargable, cân nhắc index composite {{(account_id, booked_at)}} để giảm số dòng phải lấy.
5. **Chỉ khi optimizer vẫn chọn sai một cách ổn định** mới dùng hint hoặc tốt hơn là SQL Plan Baseline – có ghi lý do và cách gỡ. Vì sao: baseline quản lý ngoài code, gỡ được mà không cần deploy.

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

### Lỗi hay gặp
- **Thêm hint {{INDEX}} vào code để "sửa nhanh"**: chạy tốt với khách nhỏ, cực chậm với khách có hàng triệu giao dịch. Cách tránh: test nhiều bind có cardinality khác nhau; ưu tiên thống kê đúng.
- **Gather stats giữa giờ cao điểm mà không theo dõi**: plan của hàng loạt câu SQL đổi cùng lúc. Triệu chứng – nhiều query chậm "không lý do" ngay sau job thống kê. Cách tránh: theo dõi plan hash trước/sau, có SQL Plan Baseline cho câu quan trọng, chạy ngoài giờ cao điểm.
- **Tên alias trong hint sai** (đổi alias bảng nhưng quên sửa hint): Oracle **im lặng bỏ qua** hint không hợp lệ. Cách tránh: kiểm tra phần "Hint Report" của DBMS_XPLAN (Oracle 19c+) để biết hint có được dùng không.

### Trả lời miệng 1 phút
"Tôi bắt đầu bằng plan thực tế của đúng SQL_ID với bind thật, dùng DBMS_XPLAN.DISPLAY_CURSOR với ALLSTATS LAST, không dùng EXPLAIN PLAN vì nó có thể khác plan đang chạy. Tôi tìm node có E-Rows lệch A-Rows nhiều nhất, xem access path, join order, buffers. Sau khi dữ liệu tăng mạnh, nguyên nhân thường là thống kê cũ hoặc thiếu histogram cho cột lệch, bind peeking, hay predicate không sargable. Tôi sửa đầu vào trước: gather stats, viết lại SQL, index composite phù hợp. Hint hoặc SQL Plan Baseline chỉ là biện pháp cuối khi có bằng chứng optimizer sai ổn định, vì hint gắn chặt với dữ liệu và phiên bản. Kinh nghiệm: tôi luôn lưu plan hash, buffer gets và p95 trước sau để chứng minh cải thiện."

### Ví dụ đời thực
Báo cáo đối soát ngày chậm từ 2 giây lên 30 giây sau khi bảng giao dịch tăng từ 2 triệu sang 20 triệu dòng. Điều tra: chạy câu SQL với bind thật, rồi dùng {{DBMS_XPLAN.DISPLAY_CURSOR(NULL, NULL, 'ALLSTATS LAST')}}. Plan cho thấy E-Rows (dự kiến) 12 dòng nhưng A-Rows (thực tế) 1,8 triệu dòng tại bước TABLE ACCESS BY INDEX ROWID → optimizer dùng index sai do thống kê cũ. Nguyên nhân gốc: sau khi dữ liệu tăng mạnh, thống kê cột {{account_id}} chưa được thu lại và thiếu histogram cho cột lệch. Xử lý: chạy {{DBMS_STATS.GATHER_TABLE_STATS}} với histogram cho cột đó, thêm index composite {{(account_id, booked_at)}} để giảm số dòng lấy ra. Kết quả: báo cáo chạy lại khoảng 2 giây; team lưu plan hash và buffer gets trước/sau để chứng minh cải thiện.

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

### Hiểu nhanh
Chuyển hệ thống ngân hàng từ Oracle sang PostgreSQL giống **chuyển cả một siêu thị sang toà nhà mới mà không đóng cửa ngày nào**. Bạn không thể khiêng hết hàng trong một đêm; bạn dựng kệ ở toà mới, chuyển hàng dần (backfill), mọi hàng mới nhập phải đồng thời ghi ở cả hai nơi hoặc được chép tự động sang (CDC), rồi **kiểm kê đối chiếu** hai bên từng kệ. Chỉ khi số liệu khớp tới từng đồng, bạn mới mở cửa toà mới cho một nhóm khách nhỏ trước (canary), và vẫn giữ toà cũ hoạt động để quay về nếu có sự cố (rollback).

### Thuật ngữ
- **Inventory**: danh sách đầy đủ mọi thứ phải chuyển (bảng, SQL native, procedure, job, kiểu dữ liệu).
- **CDC (Change Data Capture)**: đọc redo log của Oracle (ví dụ Debezium với LogMiner, GoldenGate) để chép thay đổi sang hệ mới gần thời gian thực.
- **Dual-write**: ứng dụng ghi vào cả hai DB; không atomic nên cần cơ chế phát hiện lệch.
- **Backfill**: chép dữ liệu lịch sử sang hệ mới theo lô có checkpoint.
- **Reconciliation (đối soát)**: so khớp dữ liệu hai bên theo khoá, tổng tiền, hash.
- **Canary / cohort**: chuyển một nhóm nhỏ người dùng/nghiệp vụ trước để kiểm chứng.
- **Cutover**: thời điểm chuyển nguồn sự thật sang hệ mới.
- **Ledger invariant**: quy tắc sổ cái luôn đúng, ví dụ tổng nợ = tổng có cho mỗi bút toán.

### Kế hoạch theo giai đoạn
~~~text
Giai đoạn 0: Inventory + dịch SQL/PLSQL + test tương đương   (Oracle là nguồn sự thật)
Giai đoạn 1: Backfill lịch sử -> PostgreSQL; CDC chép thay đổi mới (lag < 5s)
Giai đoạn 2: Shadow read: đọc cả hai, so kết quả, ghi log lệch (người dùng vẫn thấy Oracle)
Giai đoạn 3: Đối soát hằng ngày: count, sum(amount) theo ngày/currency/status, hash từng dòng
Giai đoạn 4: Canary 1% -> 10% -> 50% -> 100% nghiệp vụ ghi sang PostgreSQL
             CDC đảo chiều PostgreSQL -> Oracle để giữ đường rollback
Giai đoạn 5: Hết rollback window -> tắt Oracle (contract)
~~~
1. **Inventory và dịch**: quét mã nguồn tìm {{NVL}}, {{DECODE}}, {{ROWNUM}}, {{SYSDATE}}, {{CONNECT BY}}, {{MERGE}}, outer join kiểu {{(+)}}, gọi package. Vì sao: đây là chỗ hỏng khi chạy trên PostgreSQL (nhiều thứ có tương đương: {{coalesce}}, {{CASE}}, {{LIMIT}}, {{now()}}, {{WITH RECURSIVE}}, {{INSERT ... ON CONFLICT}} hoặc {{MERGE}} từ PostgreSQL 15).
2. **Tại mọi thời điểm chỉ có một nguồn sự thật**. Vì sao: hai DB cùng nhận ghi độc lập thì không có cách nào tự giải quyết xung đột.
3. **Đối soát theo khoá, không chỉ tổng**. Vì sao: hai sai lệch +100 và −100 cho tổng vẫn khớp.
4. **Chuyển theo cohort với tiêu chí dừng rõ ràng** (lag, error rate, mismatch = 0). Vì sao: rủi ro được giới hạn trong nhóm nhỏ.
5. **Giữ đường quay lui** bằng replication ngược trong rollback window. Vì sao: sau cutover, dữ liệu mới chỉ có ở PostgreSQL, quay về Oracle mà không có chúng là mất giao dịch.

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
- Oracle coi chuỗi rỗng {{''}} là NULL với kiểu VARCHAR2/CHAR; PostgreSQL phân biệt {{''}} và NULL, nên {{WHERE col IS NULL}} và unique constraint cho kết quả khác. Kiểm tra dữ liệu và predicate.
- Sequence values không đồng nghĩa bản ghi commit; CDC order, retry và thời điểm snapshot phải được thiết kế.
- Một lượt tổng checksum có thể che hai sai lệch bù trừ; đối soát theo khóa, ngày, currency và trạng thái.
- Không để hai DB cùng ghi độc lập mà không có quy tắc conflict; dual-write không atomic giữa hai hệ.

### Lỗi hay gặp
- **Kiểu {{NUMBER}} không có precision map sang {{double precision}}**: số tiền lệch vài đồng ở hàng triệu bản ghi. Cách tránh: map sang {{numeric(p,s)}} khớp nghiệp vụ, so khớp tổng theo từng ngày/currency.
- **{{DATE}} của Oracle có giờ phút giây** nhưng được map sang {{date}} của PostgreSQL: mất phần giờ, đối soát lệch ngày. Cách tránh: map sang {{timestamp}} (hoặc {{timestamptz}} khi đã xác định múi giờ nguồn).
- **Collation khác nhau làm thứ tự sắp xếp và so sánh chuỗi khác**: báo cáo "top khách hàng theo tên" khác thứ tự, keyset pagination sai. Cách tránh: chọn collation tường minh (ví dụ ICU hoặc {{C}}) và test với dữ liệu tiếng Việt có dấu.

### Trả lời miệng 1 phút
"Tôi không coi đây là đổi JDBC URL. Bước đầu là inventory: schema, SQL native, PL/SQL, sequence, kiểu dữ liệu, isolation và workload, rồi dịch và viết test tương đương. Sau đó backfill dữ liệu lịch sử có checkpoint, dùng CDC chép thay đổi mới, chạy shadow read để so kết quả hai bên, và đối soát hằng ngày theo khoá, tổng tiền theo ngày và currency, cùng các invariant của sổ cái. Cutover theo cohort, mỗi bước có tiêu chí lag, error rate và mismatch bằng không, kèm replication ngược để giữ đường rollback. Nguyên tắc cứng là mọi thời điểm chỉ có một nguồn sự thật. Kinh nghiệm: những lỗi tốn công nhất thường nằm ở chuỗi rỗng thành NULL, DATE có giờ và NUMBER không precision, nên tôi test biên các kiểu này từ sớm."

### Ví dụ đời thực
Một ứng dụng ngân hàng migrate từ Oracle sang PostgreSQL và chạy song song hai hệ trong hai tuần để đối soát. Sau tuần đầu, báo cáo tổng tiền hằng ngày khác nhau vài tỷ đồng giữa hai hệ, dù tổng số dòng khớp. Điều tra: đối soát theo từng ngày, tiền tệ và trạng thái tìm ra hai sai lệch bù trừ (+100 và −100) trên cột số tiền. Nguyên nhân gốc: kiểu {{NUMBER}} của Oracle bị map sang {{double precision}} của PostgreSQL → số tiền lệch vài đồng mỗi dòng, tổng lên hàng triệu dòng mới thấy. Xử lý: đổi mapping sang {{numeric(p,s)}} khớp nghiệp vụ, và đối soát theo khoá, ngày, tiền tệ, trạng thái chứ không chỉ tổng. Kết quả: sai lệch về số, mismatch = 0, và cutover được phê duyệt sau khi cân bằng nợ/có theo từng partition/ngày.

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
| Gọi qua interface | Có | Có (subclass cũng implement interface) |
| Tự gọi nội bộ | Bypass interceptor | Bypass interceptor |

Boot mặc định thường dùng CGLIB cho Spring AOP, nhưng không nên dựa vào loại proxy để chữa self-call. Final class/method và private method vẫn không thể override để advice.

### Cách sửa có thể bảo trì
Tách phần cần transaction thành bean riêng, để lời gọi đi qua dependency proxy. Hoặc đặt transaction ở public entry point bao trọn use case. Self-injection hoặc {{AopContext.currentProxy()}} có thể làm proxy được gọi lại nhưng tạo coupling và làm flow khó đọc; chỉ dùng khi ranh giới class không thể thay đổi.

### Pitfall production
Test gọi method trực tiếp trên object tạo bằng {{new}} không có transaction proxy. Cũng vậy, gọi annotated method qua private method hoặc constructor không kích hoạt advice. Kiểm tra bằng integration test có transaction manager thật và quan sát commit/rollback, không chỉ assert annotation tồn tại.

### Ví dụ đời thực
Self-invocation không chỉ ảnh hưởng {{@Transactional}}. Một service catalog có {{getProduct(id)}} gắn {{@Cacheable("products")}} và method {{getProducts(ids)}} gọi {{this.getProduct(id)}} trong vòng lặp → cache **không bao giờ** được dùng cho đường này; mỗi trang danh sách 50 sản phẩm tạo 50 query, DB CPU 70% giờ cao điểm dù dashboard cache báo hit rate 95% (chỉ tính các lời gọi trực tiếp từ controller). Tương tự, {{@Async}} gọi nội bộ chạy **đồng bộ** trên thread request. Sửa: tách {{ProductCacheFacade}} thành bean riêng chứa method {{@Cacheable}}, các method gọi qua bean đó; viết test tích hợp đếm query để chứng minh cache có tác dụng. DB CPU giờ cao điểm giảm xuống 30%.

### Trả lời mẫu khi phỏng vấn
"Spring áp dụng transaction, cache, async thông qua proxy bọc bean. Khi controller gọi service, lời gọi đi qua proxy nên advice chạy; nhưng khi một method trong service gọi method khác của chính nó qua this, lời gọi đi thẳng vào object thật, không qua proxy, nên mọi annotation như Transactional, Cacheable, Async trên method được gọi đều bị bỏ qua. Điều này đúng với cả JDK proxy lẫn CGLIB, vì cả hai đều chỉ chặn lời gọi từ bên ngoài đi vào proxy. Cách sửa dễ bảo trì nhất là tách phần cần advice sang một bean riêng; có thể tự inject chính bean qua proxy hoặc dùng TransactionTemplate, nhưng những cách đó khó đọc hơn. Tôi luôn có test tích hợp chứng minh annotation thật sự có tác dụng, như đếm query hay kiểm tra rollback."

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

### Định lượng rủi ro bằng con số
Mỗi request dùng REQUIRES_NEW cần **2 connection cùng lúc** (một bị treo của transaction ngoài, một cho transaction mới). Nếu pool có P connection và có T thread xử lý đồng thời mà mỗi thread đều có thể vào nhánh REQUIRES_NEW, điều kiện **có thể deadlock pool** là khi T ≥ P: tất cả P connection bị các transaction ngoài giữ, không thread nào lấy được connection thứ hai, mọi thread chờ tới timeout. Quy tắc tham khảo (HikariCP wiki): pool tối thiểu = T × (số connection đồng thời mỗi luồng cần − 1) + 1. Với T = 40 thread Tomcat bận cùng lúc, mỗi luồng cần 2 connection → pool ≥ 41, trong khi DB chỉ cho mỗi pod 30 connection — bất khả thi, phải đổi thiết kế.

### Ví dụ đời thực
Hệ thống đơn hàng ghi audit bằng REQUIRES_NEW, pool 20, Tomcat 200 thread. Bình thường chỉ khoảng 10 request đồng thời nên ổn; ngày khuyến mãi lên 60 request đồng thời → 20 transaction ngoài giữ hết 20 connection và cùng chờ connection thứ hai → service đứng 30 giây (timeout của Hikari) rồi lỗi hàng loạt, lặp lại theo từng đợt. Thay audit REQUIRES_NEW bằng ghi audit vào bảng **outbox trong cùng transaction** (audit chỉ cần khi nghiệp vụ thành công), còn audit cho trường hợp thất bại ghi bằng {{@TransactionalEventListener(phase = AFTER_ROLLBACK)}} chạy sau khi đã trả connection. Đồng thời giới hạn số request đồng thời vào luồng đặt hàng. Không còn đứng hệ thống.

### Trả lời mẫu khi phỏng vấn
"REQUIRES_NEW tạm treo transaction ngoài nhưng connection của transaction ngoài vẫn bị giữ, và transaction mới cần thêm một connection nữa, nên mỗi request đi qua nhánh này cần hai connection cùng lúc. Khi số thread đồng thời bằng hoặc vượt kích thước pool, có thể xảy ra tình huống mọi connection bị transaction ngoài giữ và không ai lấy được connection thứ hai, cả service đứng tới khi timeout. Tôi định lượng bằng công thức kích thước pool tối thiểu bằng số thread nhân với số connection mỗi luồng cần trừ một, cộng một, rồi so với giới hạn connection DB cho phép. Thường kết quả cho thấy nên đổi thiết kế: ghi audit vào outbox trong cùng transaction, hoặc dùng sự kiện sau commit hay sau rollback, và giới hạn đồng thời ở tầng vào thay vì chỉ tăng pool."

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

### Bên trong: điều kiện của auto-configuration được đánh giá thế nào
Spring Boot 3 đọc danh sách lớp auto-configuration từ {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}} trong mọi jar. Mỗi lớp có các điều kiện {{@ConditionalOnClass}} (lớp có trên classpath không), {{@ConditionalOnMissingBean}} (bạn đã tự khai báo bean cùng loại chưa — nếu có thì Boot **lùi lại**), {{@ConditionalOnProperty}}, {{@ConditionalOnWebApplication}}… Các lớp được sắp theo {{@AutoConfiguration(before/after)}}. Công cụ xem kết quả: chạy với {{--debug}} (hoặc {{debug=true}}) để in **Condition Evaluation Report** — danh sách "Positive matches" và "Negative matches" kèm lý do; Actuator {{/actuator/conditions}} và {{/actuator/beans}} cho cùng thông tin lúc chạy.

### Ví dụ đời thực
Sau khi thêm một thư viện nội bộ, service bỗng dùng {{ObjectMapper}} serialize ngày tháng thành số timestamp thay vì chuỗi ISO — app mobile hiển thị sai ngày. {{/actuator/beans}} cho thấy có một bean {{ObjectMapper}} đến từ lớp cấu hình trong thư viện mới; Condition Evaluation Report ghi {{JacksonAutoConfiguration... Did not match: @ConditionalOnMissingBean found bean 'objectMapper'}}, tức Boot đã lùi lại và mọi cấu hình {{spring.jackson.*}} trong application.yml **không còn tác dụng**. Sửa: thư viện nội bộ đổi sang cung cấp {{Jackson2ObjectMapperBuilderCustomizer}} (tuỳ biến thêm vào cấu hình của Boot) thay vì tự tạo ObjectMapper.

### Trả lời mẫu khi phỏng vấn
"Spring Boot 3 tìm danh sách auto-configuration trong file AutoConfiguration.imports của mỗi jar, thay cho spring.factories ở Boot 2. Mỗi lớp auto-configuration có điều kiện: ConditionalOnClass, ConditionalOnProperty, và quan trọng nhất là ConditionalOnMissingBean, nghĩa là nếu tôi đã tự khai báo bean cùng loại thì Boot lùi lại. Khi một bean bất ngờ xuất hiện hoặc không xuất hiện, tôi chạy với debug để xem Condition Evaluation Report, liệt kê điều kiện nào khớp, điều kiện nào không và lý do, hoặc xem actuator conditions và beans khi ứng dụng đang chạy. Lỗi hay gặp là một thư viện tự khai báo ObjectMapper hay DataSource làm cấu hình của Boot bị tắt im lặng; cách đúng là dùng các customizer mà Boot cung cấp thay vì thay thế cả bean."

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

### Bên trong: một request mang ngữ cảnh đi qua các service thế nào
Micrometer Observation API là lớp chung: một lần {{Observation}} sinh ra **cả** metric (timer) lẫn span (qua Micrometer Tracing với bridge OpenTelemetry hoặc Brave). Spring Boot 3 tự instrument HTTP server, RestClient/WebClient/RestTemplate (khi tạo từ builder của Spring), Kafka (khi bật observation), JDBC qua thư viện bổ sung. Header W3C {{traceparent}} mang traceId sang service tiếp theo; traceId và spanId được đưa vào **MDC** để log tự có. **Exemplar**: metric dạng histogram có thể đính kèm traceId của một request mẫu, từ biểu đồ p99 trên Grafana bấm thẳng sang trace của một request chậm.

### Ví dụ đời thực
Khách báo "thanh toán treo 10 giây" kèm thời điểm. Trước đây team phải grep log trên 5 service theo thời gian, mất trung bình 45 phút mỗi lần. Sau khi chuẩn hoá: mọi service Spring Boot 3 dùng Micrometer Tracing + OTLP gửi về Tempo, log JSON có traceId, response lỗi trả traceId cho client, Prometheus bật exemplar. Lần sau, bộ phận hỗ trợ gửi traceId từ màn hình lỗi; trace cho thấy 9,2 giây nằm ở span gọi dịch vụ chống gian lận (retry 3 lần với timeout 3 giây). Thời gian điều tra còn khoảng 5 phút; team giảm timeout và thêm circuit breaker.

### Trả lời mẫu khi phỏng vấn
"Tôi thiết kế để ba tín hiệu nối được với nhau bằng traceId. Trong Spring Boot 3, Micrometer Observation sinh cả metric lẫn span cho mỗi thao tác được instrument; tôi dùng Micrometer Tracing với bridge OpenTelemetry, xuất qua OTLP về Tempo hoặc Jaeger. Context đi qua các service bằng header traceparent, nên client HTTP phải tạo từ builder của Spring, Kafka phải bật observation, và executor bất đồng bộ phải bọc context propagation. traceId được đưa vào MDC nên log JSON tự có trường này, tôi trả traceId trong response lỗi để hỗ trợ gửi lại. Metric dùng histogram kèm exemplar để từ biểu đồ p99 bấm thẳng sang trace của request chậm. Sampling thì cân bằng chi phí, giữ đủ trace lỗi và chậm."

> Senior tip: bắt đầu với RED metrics (rate, errors, duration), rồi trace các đường đi có giá trị điều tra. Theo dõi cả chi phí ingest và cardinality; dashboard đẹp nhưng tag không giới hạn sẽ biến observability thành sự cố vận hành.`,
  follow: ['Khi nào chọn head sampling và tail sampling?', 'Vì sao không nên đặt orderId làm label của metric?'],
  tags: ['Micrometer', 'Tracing', 'Observation', 'OpenTelemetry', 'observability']
},
{
  id: 'spring-032', topic: 'spring', level: 'senior',
  q: 'Ứng dụng Spring Boot 3 chạy workload blocking muốn bật virtual thread bằng {{spring.threads.virtual.enabled}}. Bạn đánh giá lợi ích, giới hạn và kế hoạch rollout thế nào?',
  a: `**Tóm tắt:** Từ Spring Boot 3.2 và chạy trên Java 21+, cấu hình {{spring.threads.virtual.enabled=true}} yêu cầu Spring Boot dùng virtual thread ở các integration được hỗ trợ (Tomcat/Jetty xử lý request, {{@Async}}/task executor, scheduler, một số listener messaging). Virtual thread giảm chi phí thread cho nhiều tác vụ blocking đồng thời, nhưng không làm CPU nhanh hơn, không tăng giới hạn connection hay tự biến code blocking thành non-blocking; cần kiểm tra version Boot, pinning và tài nguyên downstream.

### Mô hình
Platform thread gắn với OS thread, nên lượng lớn thread chờ I/O tốn stack và scheduling resource. Virtual thread được runtime mount lên carrier thread khi chạy, thường unmount khi blocking operation tương thích. Khi hoàn thành, nó trả kết quả như thread thông thường, giúp code imperative dễ giữ. Nó hữu ích khi số tác vụ đồng thời lớn và phần lớn thời gian chờ I/O.

### Giới hạn và rollout
- CPU-bound workload vẫn bị giới hạn bởi core; hàng triệu virtual thread không tăng throughput tính toán.
- JDBC pool, remote API quota, file descriptor và memory vẫn là giới hạn. Throttle bằng semaphore/bulkhead và pool phù hợp.
- Pinning: trên Java 21–23, virtual thread blocking bên trong {{synchronized}} hoặc native frame sẽ giữ luôn carrier thread; phát hiện bằng JFR event {{jdk.VirtualThreadPinned}}. JEP 491 (Java 24) bỏ pinning do {{synchronized}}, nhưng native frame vẫn pin.
- Xác minh Boot version và component nào dùng executor virtual thread; không giả định mọi scheduler/third-party library tự chuyển đổi.
- Benchmark latency, throughput, heap, carrier utilization và downstream saturation trước/sau dưới tải đại diện.

### Pitfall production
Tối ưu thread count nhưng bỏ qua connection pool có thể tạo hàng chục nghìn tác vụ cùng chờ lấy connection và làm latency đuôi tăng. Thread-local cache có thể nhân memory theo virtual thread nếu tạo quá nhiều task. Không dùng synchronized block dài quanh I/O mà không đánh giá runtime/JDK cụ thể.

### Ví dụ đời thực
Service tra cứu hồ sơ (Spring MVC, JDBC, gọi 3 API nội bộ) chạy Tomcat 200 thread; giờ cao điểm 400 request đồng thời → hàng đợi Tomcat dài, p99 2,3 giây dù CPU 35%. Rollout virtual thread theo bước:
1. Nâng Java 21, chạy {{-Djdk.tracePinnedThreads=full}} trên staging + load test → phát hiện pinning ở một thư viện client cũ dùng {{synchronized}} quanh I/O và ở {{synchronized}} trong code cache tự viết (đổi sang {{ReentrantLock}}).
2. Kiểm tra giới hạn phía sau: pool Hikari 30 — với virtual thread, 400 request đồng thời sẽ cùng tranh 30 connection; đặt {{connectionTimeout}} hợp lý và giới hạn đồng thời ở các API ngoài bằng semaphore.
3. Bật {{spring.threads.virtual.enabled=true}} cho 1 pod (canary) 2 ngày, so p99 và lỗi.
Kết quả: p99 2,3 giây → 420ms, không tăng lỗi; điểm nghẽn mới lộ ra là pool DB (đúng như dự đoán), giải quyết bằng tối ưu 2 query nặng.

### Trả lời mẫu khi phỏng vấn
"Bật spring.threads.virtual.enabled trên Java 21 và Spring Boot 3.2 trở lên làm Tomcat và các executor của Spring chạy mỗi request trên một virtual thread, nên khi chờ I/O thread nhả carrier và ta phục vụ được rất nhiều request đồng thời mà giữ nguyên code blocking. Lợi ích lớn với workload chờ I/O như JDBC, HTTP; không giúp gì cho CPU-bound. Giới hạn: trên Java 21, synchronized quanh I/O gây pinning, đã được khắc phục từ Java 24; và virtual thread không tăng tài nguyên phía sau, nên pool DB và rate limit của API ngoài thành điểm nghẽn mới, cần giới hạn đồng thời. Kế hoạch rollout của tôi: phát hiện pinning bằng JFR hoặc tracePinnedThreads trên staging, load test, rà lại pool và ThreadLocal nặng, rồi bật cho một pod canary và so p99, lỗi trước khi bật toàn bộ."

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
- Graceful shutdown của web server: {{server.shutdown=graceful}} (từ Boot 3.4 đây là mặc định; bản cũ hơn mặc định {{immediate}}). Thời gian chờ mỗi phase là {{spring.lifecycle.timeout-per-shutdown-phase}} (mặc định 30s); đặt theo p99 thời lượng request thực tế.
- Trên Kubernetes, việc gỡ pod khỏi Endpoints chạy song song với SIGTERM, nên thường thêm {{preStop}} sleep vài giây để load balancer kịp ngừng gửi traffic trước khi server ngừng nhận request.
- Tổng grace period của orchestrator phải lớn hơn readiness propagation + drain window + dừng consumer/cleanup, có buffer.
- Với queue consumer, pause nhận message, hoàn tất hoặc nack để broker redeliver; xử lý idempotent để tránh duplicate.
- Dừng scheduled jobs và executor có timeout; tránh cleanup gọi dịch vụ ngoài không giới hạn.
- Theo dõi termination reason, request bị cắt, thời gian drain và số message in-flight.

### Pitfall production
Readiness chỉ đổi sau khi process bắt đầu tắt có thể khiến load balancer tiếp tục gửi traffic một khoảng ngắn. Timeout quá ngắn làm request bị kill; quá dài giữ rollout treo hoặc vượt ngân sách deployment. Web server drain không tự xử lý transaction đang chạy ở background executor hay message listener. Shutdown hook không đảm bảo chạy khi process bị SIGKILL hoặc host mất điện.

### Bên trong: trình tự khi Kubernetes dừng pod
1. Pod bị đánh dấu Terminating; **song song**: kubelet gửi SIGTERM cho container **và** endpoint controller gỡ pod khỏi Service/Endpoints — việc gỡ lan tới mọi node (kube-proxy, ingress) mất vài giây.
2. Nếu ứng dụng dừng nhận request ngay khi nhận SIGTERM, các request đang được định tuyến tới pod trong mấy giây đó sẽ lỗi "connection refused". Vì vậy thêm **{{preStop}} sleep 5–10 giây** để chờ việc gỡ endpoint lan xong.
3. Spring Boot với {{server.shutdown=graceful}}: ngừng nhận request mới, chờ request đang xử lý xong trong {{spring.lifecycle.timeout-per-shutdown-phase}} (mặc định 30 giây), rồi đóng context (dừng consumer Kafka, scheduler, đóng pool).
4. Tổng thời gian (preStop + shutdown) phải nhỏ hơn {{terminationGracePeriodSeconds}} (mặc định 30 giây), nếu không pod bị SIGKILL.

### Ví dụ đời thực
Mỗi lần deploy (rolling update 12 pod), service thanh toán có khoảng 0,8% request lỗi 502 trong 1–2 phút. Đã bật {{server.shutdown=graceful}} nhưng không có preStop: ingress vẫn gửi request tới pod đã ngừng nhận. Thêm {{preStop: sleep 10}}, {{terminationGracePeriodSeconds: 60}}, timeout shutdown 40 giây, readiness probe dùng {{/actuator/health/readiness}} (Spring tự chuyển sang REFUSING_TRAFFIC khi bắt đầu tắt). Consumer Kafka được dừng sớm và commit offset trước khi đóng. Lỗi khi deploy giảm về 0 trong 20 lần deploy liên tiếp.

### Trả lời mẫu khi phỏng vấn
"Khi Kubernetes dừng pod, nó gửi SIGTERM và đồng thời gỡ pod khỏi endpoints, nhưng việc gỡ lan tới ingress và kube-proxy mất vài giây, nên trong khoảng đó pod vẫn nhận request mới. Tôi thêm preStop sleep khoảng mười giây để chờ việc gỡ lan xong. Spring Boot bật server.shutdown bằng graceful: ngừng nhận request mới, chờ request đang chạy xong trong thời hạn timeout-per-shutdown-phase, rồi đóng context theo thứ tự, gồm dừng consumer và commit offset, dừng scheduler, đóng pool. Readiness probe dùng nhóm readiness của Actuator để báo không nhận traffic khi bắt đầu tắt. Quan trọng là tổng preStop cộng thời gian shutdown phải nhỏ hơn terminationGracePeriodSeconds, nếu không pod bị kill cứng. Tôi kiểm chứng bằng load test chạy liên tục trong lúc rolling update."

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

### Ví dụ đời thực
  Một dịch vụ giao dịch được deploy lên cụm 3 pod với cùng một database PostgreSQL. Lần deploy mới thêm migration {{V042__add_index_orders_created_at.sql}}: {{CREATE INDEX idx_orders_created_at ON orders(created_at)}} trên bảng orders có 80 triệu dòng. Deployment bắt đầu theo strategy RollingUpdate: orchestrator khởi động pod mới trước khi tắt pod cũ. Pod mới boot: Flyway chạy validate và migrate. Migration này không dùng {{CONCURRENTLY}} (vì Flyway chạy trong transaction), nên nó giữ **metadata lock** trên bảng orders trong khoảng 30 giây (thời gian build index). Trong khi đó, 2 pod còn lại cũng boot đồng thời và Flyway của chúng cố gắng lấy schema lock → chờ rồi fail sau {{lockRetryCount}} lần (mặc định là 0 hoặc rất nhỏ trên một số cấu hình cũ), log hiện {{Flyway validate failed: could not acquire schema lock}}. Cả 3 pod đều không sẵn sàng: pod mới đang migrate, 2 pod kia fail boot → orchestrator không có pod nào để chuyển traffic, dịch vụ downtime khoảng 45 giây. Điều tra: log Spring Boot của từng pod cho thấy chuỗi {{Flyway validate failed}} và {{could not acquire schema lock}}; kiểm tra {{pg_stat_activity}} thấy 3 backend đang chờ lock trên cùng một relation, trong đó backend của pod mới là người giữ lock (và đang chạy {{CREATE INDEX}}). Nguyên nhân gốc: migration nặng giữ schema lock lâu, các instance khác không đủ patience để chờ. Sửa: (1) tăng {{spring.flyway.lock-retry-count}} lên 10–20 để instance khác chờ đến khi migration xong; (2) **tách migration nặng ra khỏi app boot**: chạy {{CREATE INDEX CONCURRENTLY}} trong một script riêng trước khi deploy app (với điều kiện index không tồn tại rồi mới tạo, idempotent); (3) thêm sanity check: nếu migration quá 60 giây, alert trước khi rollout. Kết quả: lần deploy sau, index được tạo trước khi boot app (chạy ngoài transaction, không giữ lock trong app startup), các pod boot nhanh trong 8 giây, không có pod nào fail vì schema lock; và thêm constraint {{CHECK}} để CI không cho phép migration không dùng CONCURRENTLY trên bảng lớn.

### Trả lời mẫu khi phỏng vấn
  "Flyway cần một schema lock để đảm bảo chỉ có một instance thực hiện migrate hoặc validate. Khi nhiều instance boot cùng lúc, instance đầu tiên lấy lock, các instance khác phải chờ trong số lần retry cho phép – nếu migration nặng (như CREATE INDEX trên bảng lớn) thì lock được giữ lâu, các instance kia cạn retry và fail boot, làm rollout đứng. Để xử lý, tôi tăng {{lock-retry-count}} để instance khác chờ đủ lâu, và với migration nặng, tôi tách nó ra khỏi app boot: chạy {{CREATE INDEX CONCURRENTLY}} trong một script riêng trước khi deploy, vì Flyway default chạy trong transaction nên không thể dùng CONCURRENTLY. Ngoài ra, tôi luôn đo thời lượng từng migration và alert khi vượt 60 giây, và chạy thử trên staging với dữ liệu thật trước khi release. Nguyên tắc chung: migration nặng không được chạy trong lúc app boot – nó phải là một bước riêng, trước hoặc sau deploy, với cơ chế retry và idempotent.",


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

### Ví dụ đời thực
Một dev sửa trực tiếp file {{V12__add_index.sql}} đã chạy trên staging (thêm {{CONCURRENTLY}} cho "an toàn hơn"). Lần deploy production sau, ứng dụng không khởi động: {{Validate failed: Migration checksum mismatch for migration version 12}} — trên production V12 chạy bản cũ, file giờ khác. Team xử lý: (1) **hoàn tác** file V12 về đúng nội dung đã chạy; (2) tạo {{V13}} cho thay đổi mới; (3) chỉ những môi trường dev cá nhân mới dùng {{flyway repair}}. Một bài học khác: index {{CREATE INDEX CONCURRENTLY}} không chạy được trong transaction — với PostgreSQL, Flyway cần migration đó chạy ngoài transaction (Flyway tự nhận diện một số lệnh; nếu không, tách file và cấu hình phù hợp với phiên bản Flyway đang dùng). Quy ước sau sự cố: CI chạy {{flyway validate}} trên bản sao schema production cho mọi PR có file migration.

### Trả lời mẫu khi phỏng vấn
"Versioned migration có tiền tố V và số phiên bản, chạy đúng một lần theo thứ tự, dùng cho thay đổi schema và dữ liệu. Repeatable migration có tiền tố R, chạy lại mỗi khi nội dung đổi, sau các versioned, hợp cho view, function, stored procedure. Flyway lưu checksum của mỗi file đã chạy trong bảng flyway_schema_history; khi khởi động, validate so checksum với file hiện tại để phát hiện ai đó sửa migration đã chạy, vì môi trường khác nhau sẽ có schema khác nhau. Khi gặp checksum mismatch, tôi không sửa bảng history mà tìm vì sao file bị đổi: thường là hoàn tác file về nội dung cũ và đưa thay đổi mới vào một migration mới. repair chỉ dùng có chủ đích, như ở môi trường dev. Nguyên tắc là không bao giờ sửa migration đã chạy ở môi trường dùng chung."

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
- Tắt {{FAIL_ON_EMPTY_BEANS}} để cho yên tĩnh sẽ che hẳn lớp DTO quên getter toàn bộ, output thành {} rỗng; kiểm tra cấu hình hiện hành của ObjectMapper trước khi quyết định tắt.
- Một util tĩnh new ObjectMapper() chảy từ service cũ sang nhiều đường gọi: trong cùng một app, khu này trả ISO, khu kia trả timestamp - hai ObjectMapper hai cấu hình.
- Tạo ObjectMapper mới mỗi request là lãng phí và dễ lệch; cấu hình một lần hoặc qua một bean duy nhất.

### Ví dụ đời thực
  Một dịch vụ cung cấp API đơn hàng ở công ty logistics, chạy trên 5 instance. Đội ngũ vừa thêm field {{shippingWeight}} vào {{OrderDto}} để hiển thị cân nặng trên mobile. Developer thêm field và getter {{getShippingWeight()}} vào record, deploy, và sau đó nhận được ticket từ client: "App không hiện cân nặng". Điều tra: frontend dev trả về JSON từ staging, so sánh với production – production **không có** key {{shippingWeight}}. Lény do: team deploy staging đúng, nhưng production deploy được từ một nhánh cũ hơn (merge trễ) – code mới chưa lên production. Tuy nhiên, cũng trên staging, một developer khác phát hiện {{OrderDto}} dùng class (không phải record) với field private {{shippingWeight}} và **quên thêm getter** – Jackson serialise qua getter nên field bị bỏ qua hoàn toàn, không có exception nào. Thêm nữa, một endpoint khác trả {{ZonedDateTime}} từ một {{new ObjectMapper()}} tự chế trong util static: nó không có {{JavaTimeModule}} → nổ {{InvalidDefinitionException}} (lỗi rõ, dễ bắt). Endpoint thứ ba trả {{LocalDate}} nhưng với {{WRITE_DATES_AS_TIMESTAMPS}} không tắt → serialise thành array [2026,5,1] thay vì "2026-05-01", client parse fail im lặng. Điều tra chung: không có contract test nào serialise DTO để kiểm tra key tồn tại. Sửa: (1) thêm getter (hoặc dùng record); (2) loại bỏ {{new ObjectMapper()}} rải rác, chỉ dùng bean do Boot auto-cấu hình (đã có {{JavaTimeModule}} và {{WRITE_DATES_AS_TIMESTAMPS=false}}); (3) thêm contract test: dùng ObjectMapper của app serialise DTO với mọi field null/empty/list rỗng/java.time, assert key và format ISO-8601; (4) thêm {{FAIL_ON_EMPTY_BEANS}} để DTO quên getter hiện thành exception thay vì trả về {} im lặng. Kết quả: sau 1 tuần, 3 DTO mới đều có contract test, không còn field bị bỏ qua, và format date nhất quán.

### Trả lời mẫu khi phỏng vấn
  "Jackson serialise qua getter/property public – field private không getter bị bỏ qua một cách im lặng, không exception nào. Vì vậy tôi luôn dùng {{@JsonProperty}} để cố định tên property, hoặc dùng record cho DTO mới (accessor tự rõ). Với java.time: ObjectMapper không có {{JavaTimeModule}} thì nổ {{InvalidDefinitionException}} – lỗi rõ; nhưng có module mà không tắt {{WRITE_DATES_AS_TIMESTAMPS}} thì {{LocalDate}} trả dạng array, im silent phía client. Spring Boot đã tự cấu hình ObjectMapper đúng (có module, tắt timestamp) – quy tắc của tôi là chỉ dùng ObjectMapper do Boot inject, không tự {{new}} ở bất kỳ đâu. Luôn thêm contract test: serialise DTO đại diện rồi assert key và format; vài phút mỗi DTO nhưng bắt cả visibility, date drift lẫn việc đổi tên getter. {{@JsonInclude(NON_NULL)}} là thay đổi hợp đồng API – client phải phân biệt 'key không tồn tại' với 'key = null'.",
  
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

### Ví dụ đời thực
  Một nền tảng giao dịch có endpoint GET /api/orders/{id} trả Order kèm {{lines}} (chi tiết dòng hàng). Service load Order với {{@ManyToOne}} EAGER/LAZY, rồi controller trả entity trực tiếp. Ở staging với dữ liệu nhỏ (order có 2 lines), mọi thứ ổn. Khi lên production với đơn hàng trung bình 15 lines: mỗi request serialise proxy {{lines}} → Hibernate lazy load từng dòng một (1 query mỗi collection) → 1 query cho Order + 15 query cho lines = 16 query mỗi request. P99 latency tăng từ 120ms lên 1.2s, connection pool (HikariCP 20 connection) bị cạn vì mỗi request giữ connection lâu trong lúc serialise. Điều tra: Hibernate SQL statistics hiện 16 query/request; log không có exception nào – chỉ là proxy được kích hoạt ngay lúc Jackson gọi {{getLines()}}. Nguyên nhân gốc: fetch plan không rõ ràng – association {{lines}} được để LAZY và không được fetch trước khi transaction đóng. Sửa: (1) endpoint trả {{OrderDto}} (record) với {{@EntityGraph}} chỉ fetch {{lines}}; (2) query dùng {{JOIN FETCH o.lines}} trong repository; (3) thêm test tích hợp kiểm tra số query ≤ 2 cho endpoint đó (dùng {{sqlLogger}} hoặc {{datasource-proxy}}). Kết quả: mỗi request còn 2 query, p99 xuống 180ms, connection pool từ 90% xuống 25%. Đồng thời, một endpoint khác (GET /api/orders/{id}/admin} trả entity trực tiếp với quan hệ hai chiều {{Order ↔ OrderLine}} – nổ {{StackOverflowError}} vì Jackson lặp vô hạn (Order → lines → Order → lines…). Sửa: thêm {{@JsonIgnoreProperties}} trên entity và {{@JsonIgnore}} một phía của {{OrderLine.order}}, hoặc dùng DTO.

### Trả lời mẫu khi phỏng vấn
  "Khi Hibernate trả entity cho Jackson, proxy lazy sẽ bị kích hoạt khi serializer gọi getter: nếu session đã đóng thì {{LazyInitializationException}}, nếu còn mở thì N+1 ngay lúc serialise, và property proxy nội bộ như {{hibernateLazyInitializer}} có thể lộ ra trong JSON. Với quan hệ hai chiều, không cắt một phía sẽ gây StackOverflowError do vòng recurs vô hạn. Cách an toàn nhất là JSON luôn qua DTO – chỉ lấy field cần thiết, fetch plan được chọn rõ cho từng use case (JOIN FETCH, {{@EntityGraph}}, constructor expression). Trên entity chỉ giữ một lớp mạng an toàn: {{@JsonIgnoreProperties}} và cắt một phía của quan hệ hai chiều bằng {{@JsonIgnore}} hoặc {{@JsonManagedReference}}/{{@JsonBackReference}}. Tôi luôn thêm test kiểm tra số query mỗi endpoint để thấy N+1 phát sinh ngay lúc serialise – không chỉ dùng {{hibernate.format_sql}}.",
  
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

### Ví dụ đời thực
  Một công ty fintech vận hành 3 service chia sẻ database {{payments}}. Đội A phát triển thanh toán, đội B phát triển báo cáo. Một tối, đội B cần thêm cột {{risk_score}} vào bảng {{transactions}} để filter gian lận. Thay vì viết migration, một dev của đội B chạy {{ALTER TABLE transactions ADD COLUMN risk_score decimal(5,2)}} trực tiếp trên production lúc 22h để test nhanh – và forget. Prod chạy fine, không có migration tương ứng. 3 ngày sau, đội A release một service mới với Flyway migration {{V015__add_index_fx_rate.sql}}. App boot nổ: {{Validate failed: Migration checksum mismatch for migration version 15}} – trên staging thì V15 đã chạy, trên production V15 chưa từng chạy (do một restore từ 1 tuần trước) và bảng history không có dòng V15. Điều tra: team so diff schema prod ({{pg_dump --schema-only}}) với schema được dựng từ V1..V14 → thấy cột {{risk_score}} không có trong code, và bảng history thiếu V15. Nguyên nhân gốc: drift – một ALTER tay ngoài quy trình, và restore cũ làm history mất đồng bộ. Xử lý: (1) đóng băng schema; (2) diff từng bảng, cột, index; (3) forward-fix: tạo {{V015__add_risk_score.sql}} (idempotent: {{ADD COLUMN IF NOT EXISTS}}) và {{V016__add_index_fx_rate.sql}}; (4) repair có review và backup; (5) áp dụng chính policy: mọi DDL qua PR + migration, và CI chạy {{flyway validate}} nightly trên snapshot staging. Kết quả: drift được gom lại thành 2 migration, CI phát hiện ngay lần sau khi có thay đổi schema ngoài quy trình, và thời gian từ drift đến cảnh báo giảm từ 3 ngày xuống còn 1 ngày.

### Trả lời mẫu khi phỏng vấn
  "Schema drift là khi database thật khác với các file migration: một ALTER chạy tay để dập sự cố, script của service khác, merge trễ, hay restore cũ. Nó lộ theo hai mặt: boot fail tại validate (checksum mismatch) hoặc lỗi runtime 'column does not exist' trên một đường API ít được gọi. Khi drift lộ ra, tôi dùng quy trình: đóng băng schema → so khác biệt (dump prod vs schema từ V1) → forward-fix (chuyển thay đổi cần giữ thành migration mới, dọn mảnh dư) → repair có review và backup → quay về quy ước. Để ngăn lặp: chính sách mọi thay đổi schema phải qua PR chứa file migration, CI hai đường (validate trên DB dựng từ đầu + nightly trên snapshot staging), và alert khi bảng history có dòng mới không từ deploy pipeline. Đừng dùng repair như thuốc tẩy – nó làm mất vai trò cảnh báo của checksum. Đừng dùng baseline-on-migrate để dập lỗi – mỗi env được coi là hợp lệ với schema thật khác nhau thì drift không được sửa mà được niêm yết thành trạng thái chính thức.",
  
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
Hibernate thực thi action queue theo nhóm (ví dụ insert, update, collection actions, delete) thay vì giữ nguyên thứ tự source code. Ví dụ kinh điển: trong cùng transaction bạn {{remove}} một row có {{code = 'VIP'}} rồi {{persist}} row mới cùng {{code = 'VIP'}} (cột unique). Khi flush, INSERT chạy trước DELETE nên DB báo vi phạm unique constraint dù code Java "xoá trước, thêm sau". Cách sửa: gọi {{flush()}} ngay sau {{remove}}, hoặc update row cũ thay vì xoá rồi tạo lại. Constraint DB vẫn là nguồn sự thật. Nếu cần thứ tự phụ thuộc, thiết kế FK/association đúng, flush có chủ đích hoặc tách transaction theo nghiệp vụ; đừng dựa vào thứ tự gọi repository.

### Pitfall production
Bulk JPQL update/delete chạy trực tiếp ở DB và bỏ qua dirty checking của entity đang nằm trong context, nên object managed có thể stale; clear/refresh phù hợp sau bulk operation. Flush không làm dữ liệu durable: rollback vẫn hoàn tác SQL. Thay đổi collection lớn có thể tạo nhiều snapshot/SQL và tăng heap.

### Ví dụ đời thực
Một transaction vừa **xoá** bản ghi cấu hình cũ rồi **thêm** bản ghi mới cùng khoá duy nhất ({{tenant_id, key}}). Code: {{repo.delete(old); repo.save(newOne);}} → lỗi {{duplicate key value violates unique constraint}}. Nguyên nhân: Hibernate flush theo **thứ tự loại thao tác** cố định — INSERT trước, rồi UPDATE, rồi xoá phần tử collection, rồi DELETE — không theo thứ tự bạn gọi. Nên câu INSERT bản mới chạy khi bản cũ chưa bị xoá. Cách sửa: gọi {{flush()}} ngay sau {{delete}} (ép DELETE chạy trước), hoặc **cập nhật** bản ghi cũ thay vì xoá rồi thêm. Một lỗi tương tự: {{@Transactional(readOnly = true)}} ở service đọc rồi gọi setter để "chuẩn hoá hiển thị" — với readOnly, Spring đặt flush mode MANUAL cho Hibernate nên không ghi; nhưng khi ai đó bỏ readOnly, thay đổi "chỉ để hiển thị" bị ghi xuống DB.

### Trả lời mẫu khi phỏng vấn
"Persistence context giữ mỗi entity managed kèm một snapshot giá trị lúc nạp. Dirty checking diễn ra khi flush: Hibernate so từng entity với snapshot và sinh UPDATE cho phần thay đổi; flush xảy ra trước commit, trước một query có thể bị ảnh hưởng nếu flush mode là AUTO, hoặc khi gọi flush tường minh. Flush order là điểm hay bị bỏ qua: Hibernate thực thi theo loại thao tác, INSERT trước, UPDATE, rồi DELETE, chứ không theo thứ tự tôi gọi trong code. Hệ quả kinh điển là xoá rồi thêm bản ghi cùng khoá duy nhất trong một transaction sẽ lỗi duplicate key, vì INSERT chạy trước DELETE. Tôi xử lý bằng cách flush sau khi xoá, hoặc tốt hơn là cập nhật bản ghi hiện có thay vì xoá rồi thêm."

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

### Bước giải thích cho người mới
- Persistence context (Session/EntityManager) là vùng nhớ tạm giữ entity đang managed trong một transaction. Association lazy được biểu diễn bằng proxy; proxy chỉ thực sự query DB khi bạn gọi getter và context còn mở.
- Khi transaction kết thúc, entity chuyển sang detached. Proxy mất quyền truy cập session; gọi getter ném {{LazyInitializationException}}.
- OSIV (trong Spring Boot là {{OpenEntityManagerInViewInterceptor}}, một web request interceptor; ứng dụng không dùng Boot có thể dùng filter tương đương) mở EntityManager từ đầu request đến khi response hoàn tất, nên proxy vẫn query được trong quá trình render JSON. Nó giải quyết triệu chứng chứ không giải quyết fetch plan.

### Lựa chọn
- Dùng DTO projection cho response API: chỉ lấy cột cần thiết, tránh để serialization quyết định SQL.
- Dùng fetch join hoặc {{@EntityGraph}} cho use case cụ thể, kiểm tra số query và pagination.
- Khởi tạo association bên trong transaction nếu logic thực sự cần nó ({{Hibernate.initialize}}).
- OSIV có thể hữu ích ở ứng dụng server-rendered đơn giản, nhưng nên hiểu rõ query phát sinh ở view và kiểm soát bằng metric/log.

### Ví dụ đời thực
Endpoint /orders/{id} trả Order kèm items. Ban đầu service load Order rồi controller serialize; items lazy → LIE. Bật OSIV: hết lỗi nhưng mỗi request serialize 50 order items tạo 51 query, p99 latency 480ms. Chuyển sang DTO projection với JOIN FETCH items: 1 query, p99 35ms. Test với 200 order đồng thời: connection pool từ 80% xuống 12%.

### Pitfall production
Spring Boot **bật OSIV mặc định** ({{spring.jpa.open-in-view=true}}) và in cảnh báo lúc khởi động; với REST API nên đặt {{false}} để lỗi fetch plan lộ ra sớm. OSIV không kéo dài transaction nghiệp vụ; lazy query có thể chạy sau commit với autocommit tùy cấu hình. Serialize danh sách 100 entity rồi đọc mỗi collection tạo 101 query. Trả entity lộ cấu trúc nội bộ và nguy cơ recursion trong association hai chiều.

### Trả lời mẫu khi phỏng vấn
Tôi gặp LIE khi service trả entity detached rồi serializer đọc association lazy. Nguyên nhân là fetch plan không khớp nơi tiêu thụ dữ liệu. OSIV giữ session mở suốt request nên proxy vẫn query được, nhưng đó là vá triệu chứng: SQL phát sinh trong view, N+1 khó thấy, transaction không còn bao phủ. Với REST API tôi tắt OSIV, trả DTO projection với fetch plan rõ ràng, và bật SQL statistics trong test để bắt N+1. Hết exception chưa chứng minh endpoint hiệu quả; phải đo query count và latency.

> Senior tip: API service nên trả DTO với fetch plan được review. Bật thống kê SQL hoặc datasource proxy trong test để phát hiện N+1; việc hết exception chưa chứng minh endpoint hiệu quả.`,
  follow: ['OSIV có giữ transaction DB mở suốt HTTP request không?', 'Bạn phát hiện N+1 phát sinh trong quá trình JSON serialization thế nào?'],
  tags: ['LazyInitializationException', 'Open Session in View', 'N+1', 'DTO']
},
{
  id: 'jpa-024', topic: 'jpa', level: 'senior',
  q: 'Hai request cùng sửa một entity có {{@Version}}. Optimistic locking hoạt động ra sao, và retry nên đặt ở đâu để không ghi đè dữ liệu mới?',
  a: `**Tóm tắt:** Hibernate dùng cột version trong câu update: update chỉ thành công nếu version DB vẫn bằng version entity đã đọc. Nếu request khác commit trước, row count bằng 0 và Hibernate báo optimistic lock conflict. Retry phải chạy lại toàn bộ use case trong transaction mới, đọc lại dữ liệu mới và quyết định nghiệp vụ; không chỉ gửi lại câu update cũ.

### Cơ chế theo ví dụ
Hai transaction cùng đọc số dư version 7. T1 cập nhật với điều kiện {{where id=? and version=7}}, tăng version lên 8 và commit. T2 cũng update version 7; điều kiện không match (update trả về 0 row), Hibernate ném {{StaleObjectStateException}} / JPA {{OptimisticLockException}}, Spring dịch thành {{ObjectOptimisticLockingFailureException}}, thay vì âm thầm overwrite. Version có thể là số nguyên hoặc timestamp; numeric version thường biểu đạt thứ tự rõ hơn.

### Bước giải thích cho người mới
- Optimistic locking giả định conflict hiếm, không khóa DB row khi đọc. Nó thêm điều kiện version vào UPDATE.
- Khi hai transaction đọc cùng version rồi cùng ghi, transaction commit sau sẽ thất bại vì version DB đã đổi.
- Lỗi được ném ở flush/commit, transaction bị đánh dấu rollback-only; không có partial write.

### Retry an toàn
- Chỉ retry lỗi transient/conflict có giới hạn lần, backoff có jitter.
- Bắt exception ở ranh giới ngoài transaction để transaction lỗi đã rollback; mỗi lần thử mở transaction mới.
- Đọc lại state và kiểm tra invariant nghiệp vụ trước khi áp dụng lại lệnh.
- Với lệnh không idempotent (trừ tiền, cộng điểm), cần idempotency key hoặc ghi nhận command để retry không nhân đôi tác dụng.

### Ví dụ đời thực
Hai cashier cùng sửa cùng đơn hàng ORD-999 version 12. Cashier A commit trước → version 13. Cashier B flush → OptimisticLockException. Hệ thống retry: đọc lại ORD-999 (version 13), áp dụng thay đổi của B trên state mới, commit. Nếu conflict liên tục 3 lần → trả 409 cho người dùng. Đo: 0.3% request conflict, 99.7% retry thành công lần đầu.

### Pitfall production
Retry bên trong cùng transaction đã marked rollback-only thường không cứu được transaction. Retry mù có thể tạo livelock khi nhiều client tranh cùng hot row; cần giới hạn và phản hồi conflict cho caller khi không thể tự hòa giải. Bulk update/native SQL thường không tự áp dụng version semantics như entity update.

### Trả lời mẫu khi phỏng vấn
Optimistic locking dùng cột version trong UPDATE với điều kiện where version bằng giá trị đã đọc. Transaction commit sau sẽ thất bại với OptimisticLockException thay vì ghi đè. Retry phải ở ngoài transaction, mở transaction mới, đọc lại state mới và áp dụng lại logic; với thao tác không idempotent cần idempotency key. Tôi giới hạn số lần retry có backoff, và trả conflict cho caller khi không hòa giải được. Optimistic lock phù hợp conflict hiếm; row nóng liên tục thì cân nhắc pessimistic lock hoặc atomic update có điều kiện.

> Senior tip: dùng optimistic lock khi conflict tương đối hiếm; nếu một row nóng bị tranh chấp liên tục, đo tỷ lệ conflict và cân nhắc serialize theo key hoặc atomic update có điều kiện thay vì retry vô hạn.`,
  follow: ['Vì sao retry cần transaction mới?', 'Khi nào pessimistic lock hợp lý hơn optimistic locking?'],
  tags: ['@Version', 'optimistic locking', 'retry', 'concurrency']
},
{
  id: 'jpa-025', topic: 'jpa', level: 'senior',
  q: 'Bulk insert bằng Hibernate không đạt throughput mong muốn. Bạn cấu hình batching thế nào, và vì sao generation strategy {{IDENTITY}} thường phá JDBC insert batching?',
  a: `**Tóm tắt:** Hibernate JDBC batching gom nhiều prepared statement cùng dạng để gửi theo batch; cấu hình {{hibernate.jdbc.batch_size}} và flush/clear theo chunk giúp giảm round trip và memory. Với {{IDENTITY}}, DB phải tạo row để trả generated key cho từng insert, khiến Hibernate thường phải insert ngay để lấy ID, nên batching insert bị hạn chế hoặc vô hiệu.

### Cấu hình và ghi dữ liệu
Đặt batch size phù hợp (thường bắt đầu khoảng vài chục, sau đó đo), bật {{hibernate.order_inserts=true}}/{{hibernate.order_updates=true}} để gom statement cùng bảng, và bật batch rewrite của driver nếu có ({{reWriteBatchedInserts=true}} với PostgreSQL JDBC, {{rewriteBatchedStatements=true}} với MySQL Connector/J). Persistence context vẫn giữ entity nên xử lý theo chunk: persist N entity, flush, clear rồi tiếp tục. Hibernate có thể sắp xếp insert/update theo entity để tăng batch tương thích.

### Bước giải thích cho người mới
- Mặc định mỗi persist + flush sinh 1 INSERT và 1 round-trip mạng tới DB. 100k dòng = 100k RTT.
- Batching gom N statement cùng dạng vào 1 executeBatch, giảm RTT và parse overhead.
- order_inserts sắp xếp entity theo type để statement cùng dạng nằm liên tiếp, tăng khả năng gom.

### ID generation
Sequence cho phép lấy ID trước insert, nên Hibernate có thể gom insert; sequence allocation/block size cần cân đối round trip và khoảng trống ID. {{IDENTITY}} cần giá trị do DB sinh sau từng row insert để gán vào entity, vì thế thường buộc insert sớm. Không đổi strategy chỉ vì batch: cân nhắc portability, schema và semantics ID.

### Ví dụ đời thực
Import 100k user với batch_size=50, order_inserts=true, sequence allocationSize=50: 2000 batch, thời gian 4.2s thay vì 48s (mỗi insert round-trip 0.5ms). Heap ổn định ~120MB nhờ flush/clear mỗi 1000. Với IDENTITY: 100k round-trip, 52s, heap tăng dần.

### Pitfall production
Batching giảm network round trip nhưng không giảm số index update, WAL hay constraint check. Batch quá lớn tăng transaction duration, lock và khả năng rollback tốn kém. Mixed inserts cho nhiều entity type có thể chia nhỏ batch. Batching không hoạt động như mong đợi nếu code gọi query giữa chừng gây flush hoặc cấu hình driver không hỗ trợ.

### Trả lời mẫu khi phỏng vấn
Hibernate batching gom statement cùng dạng qua JDBC executeBatch; cấu hình batch_size, order_inserts/updates và batch rewrite của driver. IDENTITY phá batching vì DB sinh ID sau insert, Hibernate phải insert ngay để lấy key. Dùng sequence với allocationSize hoặc pooled optimizer để cấp phát ID trước, cho phép gom. Xử lý theo chunk flush+clear để giới hạn persistence context. Đo batch count, heap, transaction time và DB latency; test trên đúng driver/version, không tin benchmark H2.

### Cơ chế từng bước: Hibernate batching và tại sao IDENTITY phá batch

1. Gọi {{session.persist()}} hoặc {{repository.save()}} chưa ghi ngay – Hibernate đưa entity vào persistence context.
2. Lúc flush (trước commit hoặc trước query cần đồng bộ), Hibernate duyệt entity đã thay đổi, nhóm các câu INSERT cùng dạng, và gọi JDBC {{executeBatch}} để gửi nhiều statement trong một round-trip mạng.
3. {{hibernate.jdbc.batch_size}} quy định số statement tối đa mỗi batch. batch_size = 50 có nghĩa 1000 insert thành khoảng 20 batch thay vì 1000 lần đi lại mạng.
4. {{order_inserts=true}} sắp xếp entity theo loại để INSERT cùng bảng nằm liền nhau, tăng khả năng gom batch.
5. Với {{IDENTITY}}, DB mới sinh ID sau mỗi INSERT (cột auto-increment). Hibernate cần ID trước khi gán vào entity và trước khi flush, nên thường phải flush ngay từng insert → **không thể gom batch**. Sequence (hoặc pooled optimizer) cho phép Hibernate cấp ID trước, do đó có thể gom nhiều insert vào một batch.

> Senior tip: đo batch execution count, heap, transaction time và DB write latency; so với insert thường ở cùng dữ liệu. Luôn thử trên đúng JDBC driver/version và xác nhận generated IDs đúng.`,
  follow: ['Tại sao phải clear persistence context khi import hàng triệu dòng?', 'Sequence allocation ảnh hưởng round trip và khoảng trống ID ra sao?'],
  tags: ['hibernate.jdbc.batch_size', 'JDBC batching', 'IDENTITY', 'sequence']
},
{
  id: 'jpa-026', topic: 'jpa', level: 'senior',
  q: 'Một màn hình cần danh sách entity có quan hệ lazy và phân trang. Bạn chọn {{@EntityGraph}} hay JOIN FETCH thế nào, và xử lý cảnh báo HHH000104 ra sao?',
  a: `**Tóm tắt:** {{@EntityGraph}} khai báo fetch plan theo use case, còn JOIN FETCH viết trực tiếp join trong JPQL; cả hai có thể giảm N+1 nhưng collection fetch join kết hợp pagination làm row SQL nhân bản. Hibernate có thể lấy toàn bộ result rồi phân trang trong memory, phát cảnh báo HHH000104 (Hibernate 5; Hibernate 6 đổi mã thành HHH90003004 với nội dung "applying in memory"), gây tải lớn thay vì giới hạn ở DB.

### Cách chọn
EntityGraph phù hợp khi muốn giữ query repository dễ đọc và chọn association cần fetch theo từng method. Spring Data mặc định dùng {{EntityGraphType.FETCH}} (attribute không liệt kê trong graph coi như LAZY); {{LOAD}} giữ fetch type khai báo trong mapping cho attribute không liệt kê. JOIN FETCH hữu ích khi query cần điều kiện/sắp xếp gắn với association, nhưng fetch đồng thời hai collection kiểu {{List}} (bag) sẽ gặp {{MultipleBagFetchException}}, và kể cả dùng {{Set}} thì vẫn tạo tích Đề-các (cartesian product) rất nhiều row.

### Bước giải thích cho người mới
- Fetch plan quyết định association nào được load cùng query root, tránh N+1.
- Collection fetch join nhân số row SQL theo số child; DB trả nhiều row cho cùng root.
- Hibernate phân trang trên row SQL; nếu row nhân bản, page size không còn tương ứng số root entity.

### Pagination an toàn
1. Page ID của root entity bằng query có giới hạn và thứ tự ổn định.
2. Query thứ hai fetch các association cần thiết cho tập ID đó, dùng IN.
3. Khôi phục thứ tự trang nếu query thứ hai không giữ thứ tự, và cân nhắc count query riêng.

Có thể đặt {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} để Hibernate ném exception thay vì âm thầm paginate trong memory. Với to-many, batch fetching hoặc DTO projection cũng là lựa chọn tùy shape response.

### Ví dụ đời thực
Màn hình danh sách đơn hàng 20 root, mỗi đơn 15 item. JOIN FETCH items → 300 row SQL, Hibernate cảnh báo HHH000104 và load toàn bộ vào memory để page. Chuyển sang two-query pagination: query ID page 20 row, query items WHERE order_id IN (...) → 2 query, p99 40ms, heap ổn định.

### Pitfall production
Một trang 20 root có thể thành hàng nghìn SQL rows nếu mỗi root có nhiều child; phân trang trên rows không đồng nghĩa phân trang root. Cảnh báo bị bỏ qua trong môi trường dữ liệu nhỏ nhưng production heap/latency tăng đột biến. Sorting theo cột child cũng cần định nghĩa rõ một root có nhiều giá trị thì thứ tự tính thế nào.

### Trả lời mẫu khi phỏng vấn
EntityGraph khai báo fetch plan theo use case và giữ repository dễ đọc; JOIN FETCH đặt join trực tiếp trong JPQL, hữu ích khi cần điều kiện/sort theo association. Cả hai giảm N+1 nhưng collection fetch join nhân row SQL và pagination có thể thành HHH000104: Hibernate load toàn bộ result vào memory. Tôi dùng two-query pagination: page ID root trước, sau đó fetch association cho tập ID bằng IN, giữ thứ tự và count query riêng. Bật fail_on_pagination_over_collection_fetch để fail sớm thay vì âm thầm.

> Senior tip: test với volume và fan-out gần production, assert query count lẫn SQL có LIMIT/OFFSET ở DB. Khi thấy HHH000104, xử lý fetch plan trước khi tăng heap hoặc tắt cảnh báo.`,
  follow: ['Vì sao fetch join một collection vẫn có thể làm page sai?', 'Bạn thiết kế count query cho trang dữ liệu có quan hệ to-many thế nào?'],
  tags: ['@EntityGraph', 'JOIN FETCH', 'pagination', 'HHH000104']
},
{
  id: 'jpa-027', topic: 'jpa', level: 'lead',
  q: 'Second-level cache Hibernate có thể giảm tải database, nhưng khi nào bạn quyết định không bật hoặc chỉ cache một số entity?',
  a: `**Tóm tắt:** Second-level cache sống ngoài persistence context, chia sẻ cache entity/collection giữa các Session. Nó phù hợp với dữ liệu đọc nhiều, ít thay đổi và có chiến lược invalidation nhất quán; không nên bật rộng cho dữ liệu mutable/hot hoặc yêu cầu consistency nghiêm ngặt nếu chi phí đồng bộ và stale read lớn hơn lợi ích.

### Phân biệt cache
First-level cache là persistence context của một Session và luôn gắn với identity map. Second-level cache thuộc SessionFactory và có provider/configuration riêng. Query cache lưu kết quả truy vấn (danh sách ID), không thay thế entity cache; Hibernate tự vô hiệu hoá mọi kết quả của một bảng mỗi khi có ghi vào bảng đó qua Hibernate (theo timestamp của bảng), nên với bảng ghi thường xuyên, query cache gần như luôn miss. Cache hit vẫn cần kiểm tra mapping, version và provider semantics.

### Khi nên cân nhắc
- Danh mục tham chiếu nhỏ, được đọc thường xuyên và cập nhật ít.
- Có thể chấp nhận freshness theo chính sách rõ ràng, hoặc provider hỗ trợ coherence phù hợp topology.
- Đo được cache hit ratio, eviction, heap/network cost và DB load giảm.

Tránh hoặc rất thận trọng với số dư, trạng thái đơn hàng thay đổi liên tục, dữ liệu tenant nhạy cảm, entity có payload lớn, hoặc nhiều node không có invalidation đáng tin. Cache vùng phân tán thêm network hop và vận hành; cache local từng node có thể trả dữ liệu khác nhau.

### Ví dụ đời thực
Bảng Country 250 dòng, đọc 50k lần/phút, cập nhật 1 lần/tuần. Bật L2 cache READ_WRITE: DB load giảm 92%, p99 8ms→2ms. Ngược lại, bảng Order status cập nhật liên tục: query cache hit ratio 3%, overhead serialization làm p99 tăng 15ms → tắt cache, chỉ giữ index.

### Pitfall production
Bulk SQL hoặc cập nhật từ ứng dụng khác có thể làm cache stale nếu Hibernate không biết invalidation. Cache stampede khi key hết hạn đồng loạt tạo tải DB đột biến. Entity cache không tự làm query nhanh nếu query vẫn quét DB để tìm ID. Không cache để che một query thiếu index hoặc N+1 chưa được sửa.

### Trả lời mẫu khi phỏng vấn
Second-level cache chia sẻ entity/collection giữa các Session, phù hợp dữ liệu đọc nhiều ghi ít với invalidation rõ ràng. First-level cache là persistence context per session. Query cache lưu danh sách ID và phụ thuộc entity cache; Hibernate invalidate theo timestamp bảng khi ghi qua Hibernate, nên bảng ghi thường xuyên thì query cache miss liên tục. Tôi bắt đầu với một entity danh mục có SLA freshness, bật statistics, đo hit ratio và eviction. Nếu không mô tả được ai invalidate, khi nào stale chấp nhận và cách đo hit ratio, chưa bật cache đó.

### Cơ chế từng bước: Second-level cache hoạt động ra sao

1. First-level cache là persistence context của một Session, chỉ sống trong một transaction/request.
2. Second-level cache (L2) thuộc SessionFactory, chia sẻ giữa nhiều Session – entity đã load và đóng gói vào L2 có thể được lấy từ cache mà không truy vấn DB.
3. Hibernate lưu entity vào L2 theo cấu trúc "tách biệt": entity cache không tự làm query nhanh – query vẫn phải quét DB để tìm ID, rồi mới lấy entity từ cache.
4. Query cache lưu danh sách ID kết quả của một query, kèm timestamp của bảng. Khi có ghi (INSERT/UPDATE/DELETE) qua Hibernate, Hibernate đánh dấu kết quả query liên quan là cũ (invalidate).
5. Nếu dữ liệu được ghi bằng SQL thô (native SQL/bulk update) không đi qua Hibernate, L2 không biết invalidate → cache bị stale. Do đó chỉ nên bật L2 cho dữ liệu đọc nhiều, ghi ít, và có chiến lược invalidation rõ ràng.

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

### Ví dụ đời thực
Team thêm {{data.sql}} seed danh mục tỉnh thành; chạy local với H2 thì có dữ liệu, lên PostgreSQL thì không — vì từ Spring Boot 2.5, script init chỉ chạy mặc định với **DB nhúng** ({{spring.sql.init.mode=embedded}}). Một dev đặt {{mode=always}} và {{spring.jpa.defer-datasource-initialization=true}} → trên production, {{data.sql}} chạy **mỗi lần khởi động**, INSERT trùng gây lỗi khởi động ở lần deploy thứ hai; trước đó trên staging, script chạy **trước** Flyway nên báo bảng chưa tồn tại. Quyết định cuối: production và staging chỉ dùng **Flyway** cho cả schema lẫn dữ liệu tham chiếu (migration {{V20__seed_provinces.sql}} dùng {{INSERT ... ON CONFLICT DO NOTHING}}), {{spring.sql.init.mode=never}}, Hibernate {{ddl-auto=validate}}; dữ liệu test nạp trong test bằng {{@Sql}} hoặc Testcontainers.

### Trả lời mẫu khi phỏng vấn
"Spring Boot có ba cơ chế có thể tạo schema hay dữ liệu: script init schema.sql và data.sql, Hibernate ddl-auto, và công cụ migration như Flyway hay Liquibase. Script init mặc định chỉ chạy với DB nhúng, muốn chạy với DB thật phải đặt spring.sql.init.mode bằng always; nó chạy mỗi lần khởi động và mặc định trước khi Hibernate khởi tạo, trừ khi bật defer-datasource-initialization. Flyway thì chạy trước khi EntityManagerFactory sẵn sàng. Trộn các cơ chế dễ gây lỗi thứ tự và chạy lặp. Nguyên tắc của tôi là chọn một đường: production dùng Flyway cho cả schema và dữ liệu tham chiếu, viết idempotent, ddl-auto đặt validate, script init tắt; dữ liệu test nạp trong test bằng @Sql hoặc Testcontainers."

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

### Ví dụ đời thực
  Một sàn TMĐT có bảng product với cột attributes jsonb lưu danh sách tag, brand, warranty_months. Ban đầu team dùng AttributeConverter<String> để convert thành JSON string; khi query "tìm sản phẩm theo brand" phải dùng native query với jsonb_extract_path_text, và khi Hibernate snapshot so sánh thì so sánh toàn bộ chuỗi JSON – mỗi lần update attribute làm Hibernate serialize lại cả document. Khi có 500k sản phẩm và tần suất update attributes là 200 lần/giờ, team thấy CPU của application tăng 9% vào giờ cao điểm và database write latency lên 20ms. Điều tra: Hibernate log cho thấy mỗi update attributes đều phát sinh UPDATE toàn bộ cột jsonb (MVCC ghi row mới), và snapshot comparison so sánh chuỗi JSON dài 2-3KB. Nguyên nhân: AttributeConverter lưu dưới dạng text, không có cấu trúc; không có index cho brand query. Chuyển sang @JdbcTypeCode(SqlTypes.JSON) + columnDefinition jsonb: Hibernate serialize ProductAttributes (record) bằng Jackson, snapshot so sánh object graph (vẫn serialize nhưng có thể tối ưu). Thêm GIN index trên attributes->'brand' cho query thường xuyên; các key chỉ query 1-2 lần/tuần thì không cần index. Kết quả: CPU giảm 6%, write latency xuống 8ms; truy vấn brand nhanh hơn 30 lần nhờ GIN index. Tuy nhiên, mỗi update attributes vẫn phát UPDATE toàn bộ row (không thể tránh với jsonb), nên payload giữ dưới 5KB; nếu lớn hơn thì tách cột.

### Trả lời mẫu khi phỏng vấn
  "Khi cần lưu thuộc tính linh hoạt, tôi dùng @JdbcTypeCode(SqlTypes.JSON) trên PostgreSQL với columnDefinition jsonb – Hibernate sẽ serialize object bằng Jackson trên classpath, và object graph sẽ được snapshot so sánh khi entity dirty-check. So với AttributeConverter cũ, cách mới cho phép query với toán tử jsonb trực tiếp và không cần cast thủ công; nhược điểm là snapshot chi phí theo payload, và update jsonb luôn ghi lại toàn bộ giá trị do MVCC. Với các key cần query, tôi dùng native query với ->> và tạo GIN index theo tần suất thực tế – không tạo index cho mọi key vì mỗi GIN làm insert/update nặng thêm. Khi một key bắt đầu được query nóng hoặc cần ràng buộc, tôi tách ra cột thật hoặc generated column. Trong production, tôi đo pg_stat_user_indexes để loại bỏ index không ai dùng, và giữ payload jsonb nhỏ – dưới 5KB nếu update thường xuyên."

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

### Hiểu nhanh
Advisory lock giống **chiếc chìa khoá phòng họp treo ở quầy lễ tân** (PostgreSQL): ba nhân viên (3 pod) cùng muốn dùng phòng lúc 9 giờ, ai tới quầy trước lấy được chìa, hai người kia thấy móc trống thì quay về – không chạy job vòng này. Chìa không gắn với đồ vật nào trong phòng (không gắn với bảng), chỉ là một con số mà mọi người thống nhất ý nghĩa. Loại **session-level** thì bạn phải tự mang chìa trả lại; loại **transaction-level** thì chìa tự quay về móc khi bạn kết thúc cuộc họp (commit/rollback). Nếu người cầm chìa ngất xỉu (connection đóng), lễ tân tự thu lại chìa.

### Thuật ngữ
- **Advisory lock**: khoá "tư vấn" do ứng dụng tự định nghĩa ý nghĩa, PostgreSQL chỉ quản lý việc ai đang giữ key nào.
- **Session-level / transaction-level**: khoá thuộc về connection (giữ tới unlock/đóng) / thuộc về transaction (tự nhả khi kết thúc).
- **pg_try_***: biến thể không chờ – trả về true/false ngay lập tức.
- **Connection pool**: tập connection tái sử dụng; hai statement liên tiếp ngoài transaction có thể đi qua hai connection khác nhau.
- **ShedLock**: thư viện Java khoá job {{@Scheduled}} bằng một bảng lock (hoặc Redis, Mongo...) có thời hạn {{lockAtMostFor}}.
- **Leader election**: chọn một instance làm "người chạy" trong cụm.
- **pg_locks**: view hệ thống liệt kê các khoá đang được giữ/chờ.

### Một vòng chạy job trên 3 pod, từng bước
~~~text
09:00:00.000  pod-A: BEGIN; SELECT pg_try_advisory_xact_lock(71801) -> true
09:00:00.002  pod-B: BEGIN; SELECT pg_try_advisory_xact_lock(71801) -> false -> ROLLBACK, bỏ vòng
09:00:00.003  pod-C: ... -> false -> bỏ vòng
09:00:00 - 09:00:40  pod-A chạy job trong transaction (giữ 1 connection, 1 khoá)
09:00:40.010  pod-A: COMMIT -> khoá 71801 tự nhả
Nếu pod-A bị kill lúc 09:00:20 -> TCP đóng -> backend kết thúc -> khoá được nhả
(nếu mạng "treo" thay vì đóng, chỉ nhả khi TCP keepalive/timeout phát hiện)
~~~
1. **Mở transaction và thử lấy khoá không chờ**. Vì sao try: quy tắc là "đúng một", không cần xếp hàng; pod thua bỏ qua vòng này.
2. **Làm việc trong cùng transaction**. Vì sao: Spring gắn một connection cho cả transaction, khoá và công việc đi cùng một session.
3. **Commit/rollback nhả khoá tự động**. Vì sao an toàn: không có đường nào quên unlock, kể cả khi exception.
4. **Process chết thì khoá theo connection mất đi**. Vì sao tốt hơn file lock: không có "khoá ma" cần dọn tay.
5. **Trade-off**: transaction mở suốt thời gian job – job dài 40 phút sẽ giữ connection và snapshot cũ (cản VACUUM). Với job dài, cân nhắc lấy khoá trên một connection riêng giữ ngoài pool, hoặc ShedLock với {{lockAtMostFor}}.

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

### Lỗi hay gặp
- **Gọi {{pg_try_advisory_lock}} (session) qua JdbcTemplate không có transaction**: lock trên connection #3, unlock chạy trên connection #7 trả false, khoá vẫn treo trên #3 nằm trong pool. Triệu chứng – từ đó job không bao giờ chạy lại ở mọi pod. Cách tránh: dùng biến thể {{xact}} trong {{@Transactional}}, kiểm tra kết quả của {{pg_advisory_unlock}}.
- **Đi qua PgBouncer ở chế độ transaction pooling** với session-level lock: các transaction kế tiếp có thể chạy trên server connection khác. Cách tránh: chỉ dùng transaction-level lock, hoặc connection trực tiếp/session pooling cho job.
- **Job chạy lâu hơn chu kỳ**: vòng sau ở pod khác thấy khoá đang bị giữ và bỏ qua liên tục – job "không chạy" mà không có lỗi. Cách tránh: log/metric cho mỗi lần skip, cảnh báo khi skip liên tiếp, đo thời gian chạy so với chu kỳ.

### Trả lời miệng 1 phút
"Advisory lock là khoá theo một key số 64-bit do ứng dụng tự định nghĩa, PostgreSQL chỉ đảm bảo tại một thời điểm có một session giữ key đó. pg_try_advisory_lock là session-level, giữ tới khi unlock hoặc connection đóng; pg_advisory_xact_lock gắn với transaction và tự nhả khi commit hay rollback. Với Spring và connection pool, tôi dùng pg_try_advisory_xact_lock trong một @Transactional: lấy được thì chạy job, không được thì bỏ vòng, và không bao giờ phải unlock thủ công trên một connection khác. Rủi ro là transaction mở suốt thời gian job, nên chỉ hợp với job ngắn. So sánh: SKIP LOCKED để chia việc cho nhiều worker, ShedLock khi cần TTL và audit, file lock trên volume chung thì không đáng tin. Kinh nghiệm: luôn có metric cho số lần skip để phát hiện job bị kẹt."

### Ví dụ đời thực
Hệ thống chốt báo cáo hôm qua gửi email mỗi lúc 08:00 trên 3 replica (pod) chạy cùng code. Code ban đầu chỉ dùng {{@Scheduled}}, nên mỗi pod đều tự quyết định chạy → vào 08:00 cả 3 pod cùng gửi, khách hàng nhận 3 email trùng lặp và phàn nàn. Điều tra: truy vấn {{SELECT * FROM pg_stat_activity}} thấy 3 session cùng chạy hàm gửi báo cùng lúc, và truy vấn pg_locks không có advisory lock nào bảo vệ job. Nguyên nhân: không có cơ chế đảm bảo "chỉ một instance chạy"; mỗi pod chạy độc lập, không hay biết pod khác cũng đang chạy. Sửa: bọc việc gửi báo trong một {{@Transactional}}, lấy khoá bằng {{pg_try_advisory_xact_lock(71801)}} trước khi gửi; lấy được thì gửi email, không được thì ghi log "pod khác đang chạy" và bỏ vòng này. Kết quả: mỗi ngày chỉ 1 pod thực thi, email từ 3 về 1, không còn phiền khách hàng. Gắn metric số lần bỏ vòng để phát hiện kịp khi job bị treo liên tục (dấu hiệu pod đang treo hoặc khoá chưa nhả).

> Senior tip: giám sát {{pg_locks}} với locktype = advisory theo key để biết instance nào đang giữ; một advisory lock "sống sót" sau deploy là dấu hiệu job cũ chưa nhả - cảnh báo trước khi vòng chạy kế tiếp lặng lẽ skip.`,
  follow: ['{{pg_advisory_lock}} dạng blocking có thể khiến pod xếp hàng thế nào?', 'Advisory lock không có TTL - bạn xử lý job treo ra sao?'],
  tags: ['advisory lock', 'PostgreSQL', 'scheduling', 'ShedLock', 'SKIP LOCKED'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Advisory Locks', url: 'https://www.postgresql.org/docs/current/explicit-locking.html#ADVISORY-LOCKS' },
  ]
},
{
  id: 'db-032', topic: 'db', level: 'senior',
  q: 'Bảng {{orders}} trên MySQL InnoDB đang dùng {{CHAR(36)}} UUIDv4 làm PRIMARY KEY; khi lên 200 triệu dòng, insert chậm dần và buffer pool hit rate tụt. Vì sao kiểu ID lại ảnh hưởng tới hiệu năng ghi như vậy, và bạn chọn giữa auto-increment, UUIDv4, UUIDv7/ULID, Snowflake thế nào?',
  a: `**Tóm tắt:** Trong InnoDB, PRIMARY KEY chính là clustered index: dòng dữ liệu nằm trong lá B+tree, sắp theo PK. ID tăng dần thì mọi insert dồn vào trang cuối (ghi tuần tự, trang đầy ~15/16); UUIDv4 ngẫu nhiên thì mỗi insert rơi vào một trang bất kỳ, gây page split, trang chỉ đầy 1/2 đến 15/16, và cần cả index nằm trong RAM. Thêm nữa, mọi secondary index đều chứa PK, nên PK 36 byte làm mọi index phình ra. Chọn ID có thứ tự theo thời gian (BIGINT, UUIDv7, Snowflake), lưu dạng nhị phân gọn.

### Bước 1: clustered index lưu dữ liệu thế nào
InnoDB lưu bảng theo đơn vị **page** (mặc định {{innodb_page_size}} = 16KB). Các page tổ chức thành B+tree theo PK:
~~~text
                [root: 1..5000 | 5001..10000 | ...]
               /                |                 \\
   [leaf: id 1..120]   [leaf: id 121..240]  ...  [leaf: id 9881..10000]  <- lá chứa cả dòng
~~~
Mỗi lá chứa các dòng đầy đủ, sắp theo PK, và có con trỏ sang lá kế tiếp. Secondary index ({{idx_customer}}) có lá chứa {{(customer_id, PK)}}; muốn lấy dòng thì lấy PK rồi tra tiếp clustered index.

### Bước 2: insert tuần tự và insert ngẫu nhiên khác nhau ra sao
- **ID tăng dần (AUTO_INCREMENT, UUIDv7, Snowflake):** mọi dòng mới có key lớn nhất nên luôn ghi vào lá ngoài cùng bên phải. Lá đầy thì InnoDB mở lá mới, không phải dời dữ liệu cũ. Tài liệu MySQL ghi rõ: insert tuần tự cho trang đầy khoảng 15/16. Chỉ vài trang "nóng" cần nằm trong buffer pool.
- **UUIDv4:** key ngẫu nhiên nên dòng mới phải chen vào giữa một lá bất kỳ. Lá đã đầy thì **page split**: cấp trang mới, chuyển khoảng một nửa số dòng sang, sửa trang cha. Kết quả: trang chỉ đầy từ 1/2 đến 15/16, tốn nhiều đĩa hơn; và mỗi insert chạm một lá ngẫu nhiên, nên khi index lớn hơn buffer pool thì gần như insert nào cũng phải đọc đĩa trước.

Ví dụ ước lượng: 200 triệu dòng, mỗi dòng 200 byte thì clustered index khoảng 40GB (chưa tính trang không đầy). Buffer pool 16GB: với ID tuần tự, insert gần như luôn trúng RAM; với UUIDv4, xác suất lá cần ghi đang ở RAM chỉ khoảng 16/40, phần còn lại là random I/O.

### Bước 3: kích thước secondary index
Mỗi entry của secondary index chứa bản sao PK:
| Kiểu PK | Byte/entry cho phần PK | 5 secondary index x 200 triệu dòng |
|---|---|---|
| BIGINT | 8 | ~8GB |
| BINARY(16) (UUID nhị phân) | 16 | ~16GB |
| CHAR(36) utf8mb4 | ≥ 36 | ≥ 36GB |
(chỉ tính phần PK, chưa tính overhead). Index to hơn thì ít vừa RAM hơn, query đọc nhiều trang hơn.

### Bước 4: so sánh các lựa chọn
| Kiểu | Thứ tự | Kích thước | Sinh ở đâu | Điểm yếu |
|---|---|---|---|---|
| AUTO_INCREMENT BIGINT | tuần tự | 8B | DB | lộ số lượng/đoán được ID, khó gộp dữ liệu nhiều DB, phải insert mới biết ID |
| UUIDv4 | ngẫu nhiên | 16B | app | page split, random I/O như trên |
| UUIDv7 (RFC 9562) / ULID | tăng theo ms | 16B | app | lộ thời điểm tạo; vẫn gấp đôi BIGINT |
| Snowflake (41 bit ms + 10 bit máy + 12 bit sequence) | tăng theo thời gian | 8B | app | phải cấp worker id duy nhất, phụ thuộc đồng hồ |

Gợi ý chọn: hệ thống một DB → BIGINT AUTO_INCREMENT hoặc sequence, cộng thêm một cột mã công khai nếu không muốn lộ ID. Cần sinh ID ở client/nhiều service, hoặc đồng bộ offline → UUIDv7. Cần 64 bit và throughput lớn → Snowflake.

~~~sql
-- MySQL: lưu UUID dạng 16 byte thay vì CHAR(36)
CREATE TABLE orders (
  id BINARY(16) PRIMARY KEY,          -- UUIDv7 sinh từ app
  customer_id BIGINT NOT NULL,
  KEY idx_customer (customer_id)
);
SELECT BIN_TO_UUID(id) FROM orders LIMIT 1;  -- đổi về dạng chữ khi debug
~~~

### PostgreSQL thì sao
PostgreSQL lưu bảng dạng heap (dòng không sắp theo PK), nên UUIDv4 chỉ làm khổ **index PK**: lá B-tree ngẫu nhiên, nhiều page split, và sau mỗi checkpoint, lần sửa đầu tiên của một trang phải ghi nguyên trang vào WAL (full-page write), nên ghi ngẫu nhiên nhiều trang làm WAL phình to. PostgreSQL có kiểu {{uuid}} 16 byte sẵn; từ PostgreSQL 18 có hàm {{uuidv7()}}.

### Pitfall production
- Đổi CHAR(36) sang BINARY(16) mà quên các cột khoá ngoại ở bảng khác: join giữa hai kiểu khác nhau làm index không được dùng.
- Snowflake ID là số lớn hơn 2^53: trả JSON dạng số thì JavaScript làm tròn sai, nên serialize thành chuỗi.
- Dùng {{UUID_TO_BIN(uuid, 1)}} (cờ swap) tưởng là sửa được UUIDv4: cờ này chỉ đảo các phần thời gian của UUIDv1, UUIDv4 vẫn ngẫu nhiên.

### Ví dụ đời thực
  Một hệ thống giao dịch có bảng orders đang dùng CHAR(36) UUIDv4 làm PK, sau 2 năm tích lũy được 180 triệu dòng. Vấn đề: mỗi insert bị page split vì key ngẫu nhiên, trang chỉ đầy khoảng 60%, và buffer pool 16GB không đủ – {{Innodb_buffer_pool_reads}} tăng 40% so với kỳ vọng. Điều tra: {{SHOW ENGINE INNODB STATUS}} cho thấy trang lá (leaf) liên tục bị tách; mỗi secondary index (5 index) đều chứa PK 36 byte, nên mỗi index khoảng 30GB. Team thử chuyển UUIDv4 sang UUIDv7 (RFC 9562) dạng BINARY(16): key tăng theo milliseconds, mọi insert dồn vào trang cuối, trang đầy 15/16, dung lượng clustered index giảm từ 45GB xuống 28GB, và buffer pool hit rate tăng 7%. Đồng thời thêm cột public_id (UUIDv4) cho client, giữ PK nội bộ là UUIDv7. Kết quả: insert throughput tăng 2,5 lần, và không cần mở rộng phần cứng. Bài học: UUIDv7 vẫn là 16 byte (gấp đôi BIGINT) nhưng lại có thứ tự thời gian, phù hợp khi cần sinh ID ở nhiều service/offline.

### Trả lời mẫu khi phỏng vấn
  "Trong InnoDB, PRIMARY KEY chính là clustered index – dữ liệu nằm trong lá B+tree sắp theo PK. ID tăng dần thì mọi insert dồn vào trang cuối, trang đầy 15/16, và chỉ vài trang nóng cần nằm trong buffer pool; UUIDv4 ngẫu nhiên thì mỗi insert rơi vào một trang bất kỳ, gây page split, trang chỉ đầy 1/2 đến 15/16, và khi index lớn hơn buffer pool thì gần như insert nào cũng phải đọc đĩa. Ngoài ra, mọi secondary index đều chứa PK, nên PK 36 byte làm mọi index phình ra – BIGINT 8 byte, UUID nhị phân 16 byte, CHAR(36) ≥ 36 byte. Tôi chọn UUIDv7 khi cần sinh ID ở client/nhiều service/offline, vì nó tăng theo milliseconds; cần 64 bit và throughput lớn thì Snowflake; một DB thì BIGINT AUTO_INCREMENT là đơn giản nhất, thêm cột public_id nếu không muốn lộ ID. Trên PostgreSQL, UUIDv4 chỉ làm khổ index PK, và từ PG 18 có uuidv7(). Trong production, tôi đo {{Innodb_buffer_pool_reads}} trước sau để chứng minh, và không bao giờ dùng CHAR(36) cho PK."

  > Senior tip: trước khi kết luận "UUID chậm", đo {{Innodb_buffer_pool_reads}} (đọc đĩa vì miss) so với {{Innodb_buffer_pool_read_requests}} trước và sau đợt ghi cao điểm. Tôi từng thấy một bảng log chuyển từ UUIDv4 sang UUIDv7 giảm hơn một nửa dung lượng index chỉ nhờ trang đầy hơn; không cần đổi phần cứng.`,
  follow: ['Vì sao UUIDv7 vẫn có thể gây tranh chấp ở trang cuối khi ghi rất cao, và InnoDB xử lý hotspot đó thế nào?', 'Nếu đã có hàng tỷ dòng UUIDv4, bạn migrate sang khoá mới ra sao mà không downtime?', 'Cột mã công khai (public id) và PK nội bộ nên thiết kế thế nào?'],
  tags: ['UUID', 'UUIDv7', 'Snowflake', 'InnoDB', 'clustered index', 'page split', 'buffer pool'],
  refs: [
    { type: 'doc', title: 'MySQL: The Physical Structure of an InnoDB Index', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-physical-structure.html' },
    { type: 'doc', title: 'MySQL: Clustered and Secondary Indexes', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html' },
    { type: 'doc', title: 'RFC 9562: Universally Unique IDentifiers (UUIDs)', url: 'https://www.rfc-editor.org/rfc/rfc9562' },
    { type: 'article', title: 'ZemIT: Chọn kiểu ID cho hệ thống', url: 'https://zemit.substack.com/p/chon-kieu-id-cho-he-thong-hien-ai' }
  ]
},
{
  id: 'db-033', topic: 'db', level: 'senior',
  q: 'Trên MySQL InnoDB (REPEATABLE READ), hai request đặt cùng một ghế chạy: {{SELECT ... WHERE seat_id = 15 FOR UPDATE}}, không thấy dòng nào, rồi {{INSERT}}. Thỉnh thoảng một request bị lỗi 1213 Deadlock. Giải thích gap lock / next-key lock gây ra deadlock này, đọc {{SHOW ENGINE INNODB STATUS}} thế nào, và sửa ra sao?',
  a: `**Tóm tắt:** Ở REPEATABLE READ, khi locking read tìm một key không tồn tại, InnoDB khoá **khoảng trống (gap)** quanh vị trí đó để chặn phantom. Gap lock của hai transaction không xung đột nhau, nên cả hai cùng giữ được; nhưng INSERT cần **insert intention lock**, mà khoá này xung đột với gap lock của bên kia. Hai bên chờ nhau thì deadlock. Sửa bằng cách INSERT thẳng và bắt lỗi duplicate key (dựa vào unique index), hoặc dùng READ COMMITTED, và luôn có retry.

### Bước 1: InnoDB có những loại khoá dòng nào
| Khoá | Khoá cái gì | Ý nghĩa |
|---|---|---|
| Record lock | đúng một bản ghi trong index | khoá dòng đã tồn tại |
| Gap lock | khoảng trống giữa hai bản ghi | cấm chèn vào khoảng đó |
| Next-key lock | bản ghi + gap ngay trước nó | mặc định cho locking read/UPDATE/DELETE ở RR |
| Insert intention | một loại gap lock đặc biệt do INSERT xin | xung đột với gap/next-key lock của người khác |

Gap lock "chỉ để ngăn": hai transaction có thể cùng giữ gap lock trên cùng một khoảng. Đây chính là mấu chốt.

### Bước 2: dựng lại deadlock
Bảng {{booking}} có unique index {{seat_id}}, đang có các giá trị 10 và 20.
~~~text
T1: SELECT * FROM booking WHERE seat_id = 15 FOR UPDATE;  -- không có 15 -> gap lock (10, 20)
T2: SELECT * FROM booking WHERE seat_id = 15 FOR UPDATE;  -- gap lock (10, 20), KHÔNG bị chặn
T1: INSERT INTO booking(seat_id, ...) VALUES (15, ...);    -- xin insert intention, chờ gap lock của T2
T2: INSERT INTO booking(seat_id, ...) VALUES (15, ...);    -- chờ gap lock của T1 -> vòng chờ
InnoDB phát hiện vòng, rollback một bên: ERROR 1213 (40001): Deadlock found ...
~~~
Code kiểu "kiểm tra chưa có thì thêm" rất phổ biến trong Java, và chỉ lộ ra khi có tải đồng thời.

### Bước 3: đọc SHOW ENGINE INNODB STATUS
Phần {{LATEST DETECTED DEADLOCK}} (rút gọn; trong output thật, tên bảng nằm trong dấu nháy ngược):
~~~text
*** (1) TRANSACTION:
TRANSACTION 5021, ACTIVE 3 sec inserting
*** (1) HOLDS THE LOCK(S):
RECORD LOCKS ... index uk_seat of table shop.booking trx id 5021 lock_mode X locks gap before rec
*** (1) WAITING FOR THIS LOCK TO BE GRANTED:
RECORD LOCKS ... index uk_seat of table shop.booking trx id 5021 lock_mode X locks gap before rec insert intention waiting
*** (2) TRANSACTION:
TRANSACTION 5022, ACTIVE 2 sec inserting
*** (2) HOLDS THE LOCK(S):
... lock_mode X locks gap before rec
*** (2) WAITING FOR THIS LOCK TO BE GRANTED:
... lock_mode X locks gap before rec insert intention waiting
*** WE ROLL BACK TRANSACTION (2)
~~~
Cách đọc: {{lock_mode X}} = next-key lock; {{locks rec but not gap}} = record lock; {{locks gap before rec}} = gap lock; {{insert intention waiting}} = INSERT đang chờ. Cả hai bên giữ gap và chờ insert intention: đúng kịch bản trên. Bản này chỉ giữ deadlock gần nhất; bật {{innodb_print_all_deadlocks = ON}} để ghi mọi deadlock vào error log. Khoá đang giữ lúc chạy xem ở {{performance_schema.data_locks}} (MySQL 8.0).

### Bước 4: các cách sửa
1. **Để unique index làm việc:** bỏ SELECT FOR UPDATE, INSERT luôn; bắt lỗi duplicate key (Spring dịch thành {{DuplicateKeyException}}) và trả "ghế đã có người đặt".
2. **INSERT ... ON DUPLICATE KEY UPDATE / INSERT IGNORE** khi nghiệp vụ là upsert.
3. **READ COMMITTED:** InnoDB tắt gap lock cho tìm kiếm và quét index (vẫn dùng cho kiểm tra khoá ngoại và duplicate key). Đổi isolation phải kiểm tra lại các chỗ dựa vào RR.
4. **Khoá dòng cha có thật:** ví dụ {{SELECT ... FROM show_time WHERE id = ? FOR UPDATE}} để tuần tự hoá theo suất chiếu.
5. **Luôn retry** lỗi 1213 (SQLSTATE 40001) vài lần với backoff, ở tầng ngoài transaction.

### Pitfall production
- Range query trên cột không có index ({{UPDATE ... WHERE status = 'NEW'}}) ở RR: InnoDB quét và khoá next-key **mọi dòng đã quét**, gần như khoá cả bảng.
- Khoá trên gap cuối cùng (sau giá trị lớn nhất) được ghi là khoá trên "supremum": mọi insert ID lớn hơn đều bị chặn, hay gặp với bảng ID tăng dần.
- Tăng {{innodb_lock_wait_timeout}} không chữa được deadlock: deadlock bị phát hiện ngay, timeout chỉ áp dụng cho chờ khoá thông thường (lỗi 1205).

> Senior tip: khi review code có chuỗi "SELECT FOR UPDATE rồi INSERT nếu không thấy", tôi hỏi ngay "unique index nào đang bảo vệ?". Hầu hết trường hợp xoá SELECT, để constraint quyết định, vừa hết deadlock vừa bớt một round-trip.

### Ví dụ đời thực
  Ứng dụng đặt vé xem phim có bảng booking với unique index (show_time_id, seat_id). Code Java làm: SELECT ... WHERE show_time_id = ? AND seat_id = 15 FOR UPDATE; nếu không thấy dòng nào thì INSERT. Ban đầu dường như chạy tốt, nhưng vào cuối tuần, khi hai request cùng đặt ghế 15 của suất chiếu 20h đồng thời, một request bị lỗi 1213 Deadlock. Điều tra: {{SHOW ENGINE INNODB STATUS}} → phần LATEST DETECTED DEADLOCK cho thấy cả hai transaction đều giữ {{lock_mode X locks gap before rec}} (gap lock trên khoảng (10, 20) của uk_seat) và đều đang chờ {{insert intention waiting}}. Nguyên nhân: ở REPEATABLE READ, SELECT FOR UPDATE tìm key không tồn tại → lock khoảng trống (gap); hai transaction cùng giữ gap lock được (gap lock không xung đột nhau), nhưng khi cả hai cùng INSERT vào vị trí 15, insert intention lock xung đột với gap lock của bên kia → vòng chờ. Sửa: bỏ SELECT FOR UPDATE, INSERT thẳng; Spring bắt DuplicateKeyException → trả "ghế đã có người đặt". Thêm retry 3 lần với backoff ngẫu nhiên cho trường hợp còn lại (ví dụ row bị xoá giữa chừng). Kết quả: không còn deadlock, và thời gian xử lý giảm 20% vì bớt một round-trip SELECT. Nếu cần upsert thì dùng INSERT ... ON DUPLICATE KEY UPDATE; nếu phải dùng SELECT FOR UPDATE thì chọn một row có thật (ví dụ show_time_id) để lock record thay vì gap.

### Trả lời mẫu khi phỏng vấn
  "Ở REPEATABLE READ, InnoDB dùng next-key lock – kết hợp record lock và gap lock – để ngăn phantom. Khi locking read tìm một key không tồn tại, InnoDB lock khoảng trống xung quanh nó, và đây là nguyên nhân gây deadlock kinh điển: hai transaction cùng giữ gap lock được vì gap lock không xung đột nhau, nhưng khi cả hai cùng INSERT vào vị trí đó, insert intention lock xung đột với gap lock của bên kia → vòng chờ. Đọc SHOW ENGINE INNODB STATUS, tôi tìm phần LATEST DETECTED DEADLOCK: {{lock_mode X locks gap before rec}} là gap lock, {{insert intention waiting}} là INSERT đang chờ; nếu cả hai đều giữ gap và chờ insert intention thì chính là kịch bản này. Cách sửa tốt nhất là để unique index làm việc: bỏ SELECT FOR UPDATE, INSERT thẳng, bắt duplicate key; hoặc dùng INSERT ... ON DUPLICATE KEY UPDATE cho upsert; hoặc đổi READ COMMITTED để tắt gap lock; hoặc lock một row có thật để tuần tự hóa. Luôn có retry cho lỗi 40001. Tăng innodb_lock_wait_timeout không chữa được deadlock vì deadlock bị phát hiện ngay."

  > Senior tip: khi review code có chuỗi "SELECT FOR UPDATE rồi INSERT nếu không thấy", tôi hỏi ngay "unique index nào đang bảo vệ?". Hầu hết trường hợp xoá SELECT, để constraint quyết định, vừa hết deadlock vừa bớt một round-trip.`,
  follow: ['Vì sao PostgreSQL không gặp đúng deadlock này với cùng đoạn code?', 'Chuyển sang READ COMMITTED thì binlog format phải là gì?', 'Khi nào next-key lock trên unique index thu gọn thành record lock?'],
  tags: ['InnoDB', 'gap lock', 'next-key lock', 'deadlock', 'REPEATABLE READ', 'MySQL'],
  refs: [
    { type: 'doc', title: 'MySQL: InnoDB Locking', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html' },
    { type: 'doc', title: 'MySQL: Locks Set by Different SQL Statements in InnoDB', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-locks-set.html' },
    { type: 'doc', title: 'MySQL: An InnoDB Deadlock Example', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlock-example.html' }
  ]
},
{
  id: 'db-034', topic: 'db', level: 'senior',
  q: 'Trên PostgreSQL mặc định READ COMMITTED, code Java đọc số dư, tính trong app rồi {{UPDATE account SET balance = :newBalance}}, và thỉnh thoảng mất tiền. Khi hai transaction cùng sửa một dòng, PostgreSQL xử lý thế nào ở READ COMMITTED, REPEATABLE READ và SERIALIZABLE? Bạn sửa và retry ra sao?',
  a: `**Tóm tắt:** Ở READ COMMITTED, UPDATE gặp dòng đang bị người khác sửa sẽ **chờ**, rồi khi bên kia commit thì **đánh giá lại điều kiện WHERE trên phiên bản mới** và cập nhật tiếp. Nó không kiểm tra lại giá trị bạn đã đọc trước đó trong app, nên "đọc, tính, ghi" bị lost update. Sửa bằng UPDATE nguyên tử ({{balance = balance - 100}}), khoá dòng ({{FOR UPDATE}}), optimistic version, hoặc isolation cao hơn; hai mức cao hơn báo lỗi SQLSTATE 40001 và **bắt buộc retry cả transaction**.

### Bước 1: lost update xảy ra thế nào
~~~text
T1: SELECT balance FROM account WHERE id = 1;   -- 1000
T2: SELECT balance FROM account WHERE id = 1;   -- 1000
T1: UPDATE account SET balance = 900 WHERE id = 1;   -- app tính 1000 - 100
T2: UPDATE account SET balance = 700 WHERE id = 1;   -- chờ T1 (khoá dòng)
T1: COMMIT
T2: tiếp tục, ghi 700 -> COMMIT                       -- đúng ra phải là 600
~~~
Khoá dòng có hoạt động: T2 đúng là chờ T1. Nhưng giá trị 700 đã tính từ con số 1000 cũ trong RAM của Java, nên DB không thể biết.

### Bước 2: READ COMMITTED đánh giá lại thế nào
Theo tài liệu PostgreSQL, với UPDATE/DELETE/SELECT FOR UPDATE ở READ COMMITTED:
1. Tìm dòng thoả WHERE theo snapshot của câu lệnh.
2. Nếu dòng đang bị transaction khác sửa thì chờ nó kết thúc.
3. Bên kia rollback: dùng dòng cũ. Bên kia commit: lấy **phiên bản mới nhất** của dòng, chạy lại WHERE trên nó (bên trong PostgreSQL gọi là EvalPlanQual). Vẫn thoả thì cập nhật dựa trên phiên bản mới; không thoả hoặc dòng đã bị xoá thì bỏ qua.

Vì vậy câu này an toàn dù chạy song song:
~~~sql
-- trừ tiền nguyên tử: biểu thức tính trên phiên bản mới nhất
UPDATE account SET balance = balance - 100
WHERE id = 1 AND balance >= 100;   -- trả về 0 dòng nghĩa là không đủ tiền
~~~
Hoặc khoá trước khi đọc: {{SELECT balance FROM account WHERE id = 1 FOR UPDATE}} (T2 chờ ngay ở bước đọc và đọc được 900).

### Bước 3: REPEATABLE READ và SERIALIZABLE
| Mức | Hai bên cùng sửa một dòng | Bắt được write skew (hai bên sửa hai dòng khác nhau dựa trên cùng dữ liệu đọc)? |
|---|---|---|
| READ COMMITTED | chờ rồi đánh giá lại, không lỗi | không |
| REPEATABLE READ | bên sau lỗi {{could not serialize access due to concurrent update}} | không |
| SERIALIZABLE (SSI) | như RR | có: lỗi {{could not serialize access due to read/write dependencies among transactions}} |

SERIALIZABLE trong PostgreSQL dùng **SSI**: ghi nhận ai đã đọc gì (khoá SIRead, không chặn ai) và phát hiện cấu trúc phụ thuộc đọc/ghi nguy hiểm giữa các transaction đồng thời, rồi huỷ một bên. Ví dụ write skew kinh điển: quy định "luôn có ít nhất 1 bác sĩ trực"; hai bác sĩ cùng đọc "đang có 2 người trực", mỗi người tự xin nghỉ, sửa hai dòng khác nhau, nên RR không phát hiện được. SSI phát hiện được. Đổi lại: có thể báo lỗi "dư" (false positive) và phải retry nhiều hơn.

### Bước 4: retry đúng cách trong Spring
Mọi lỗi SQLSTATE 40001 (và deadlock 40P01) phải retry **toàn bộ transaction** từ đầu, kể cả các SELECT, vì dữ liệu đọc trước đó đã cũ.
~~~java
// retry nằm NGOÀI @Transactional: mỗi lần thử là một transaction mới
public void transfer(long from, long to, BigDecimal amt) {
    for (int attempt = 1; ; attempt++) {
        try {
            txService.transferInTx(from, to, amt); // @Transactional(isolation = SERIALIZABLE)
            return;
        } catch (ConcurrencyFailureException e) {   // Spring dịch 40001/40P01 về nhóm này
            if (attempt == 3) throw e;
            sleepWithJitter(attempt);               // backoff ngẫu nhiên tránh va chạm lại
        }
    }
}
~~~

### Pitfall production
- Đặt retry bên trong method {{@Transactional}}: transaction đã bị đánh dấu rollback, retry vô nghĩa.
- Gửi email/gọi API bên ngoài trong transaction có thể retry: retry thì gửi hai lần. Đưa side effect ra sau commit (outbox).
- Bật SERIALIZABLE cho cả ứng dụng: transaction dài làm tỉ lệ lỗi tăng; chỉ dùng cho nghiệp vụ cần bất biến phức tạp, và giữ transaction ngắn.

> Senior tip: với nghiệp vụ tiền, tôi ưu tiên "UPDATE có điều kiện + kiểm tra số dòng bị ảnh hưởng" vì nó đúng ở mọi isolation và không cần retry. SERIALIZABLE để dành cho bất biến trải trên nhiều dòng; khi bật, theo dõi tỉ lệ lỗi 40001 trên tổng transaction và cảnh báo nếu vượt vài phần trăm.

### Ví dụ đời thực
  Hệ thống ví điện tử có bảng account với cột balance (DECIMAL). Code Java đọc số dư: SELECT balance FROM account WHERE id = 1 → 1000; tính 1000 - 100 = 900; UPDATE account SET balance = 900 WHERE id = 1. Khi hai người dùng cùng gửi yêu cầu chuyển tiền từ tài khoản này đồng thời, thường xuyên xảy ra hiện tượng mất tiền: cả hai request đều đọc 1000, một request ghi 900, request kia ghi 700 → số dư còn 700 thay vì 600. Điều tra: PostgreSQL log cho thấy UPDATE của request thứ hai phải chờ request thứ nhất (khoá dòng row lock), nhưng khi request thứ nhất commit, request thứ hai **đánh giá lại WHERE** trên phiên bản mới (900) – nó vẫn thoả (id = 1), nên UPDATE balance = 700 dựa trên giá trị 1000 cũ trong RAM của app. Lost update. Sửa: đổi UPDATE thành UPDATE account SET balance = balance - 100 WHERE id = 1 AND balance >= 100 – biểu thức tính trên phiên bản mới nhất, nguyên tử. Đồng thời kiểm tra số dòng bị ảnh hưởng (affectedRows == 0 → không đủ tiền). Kết quả: không còn mất tiền, và không cần retry. Với nghiệp vụ cần bất biến phức tạp (ví dụ quy định "luôn có ít nhất 1 bác sĩ trực"), dùng SERIALIZABLE + retry 3 lần với backoff ngẫu nhiên; tỉ lệ lỗi 40001 khoảng 0,5% – thấp nhưng phải theo dõi.

### Trả lời mẫu khi phỏng vấn
  "Ở READ COMMITTED, PostgreSQL dùng MVCC: UPDATE tìm dòng theo snapshot, nếu dòng đang bị sửa thì chờ, rồi khi bên kia commit thì lấy phiên bản mới nhất và chạy lại điều kiện WHERE trên đó – nó không kiểm tra lại giá trị bạn đã đọc trước đó trong app, nên 'đọc, tính, ghi' bị lost update. Sửa bằng UPDATE nguyên tử: balance = balance - 100, hoặc khóa dòng trước khi đọc bằng SELECT FOR UPDATE, hoặc optimistic version. REPEATABLE READ báo lỗi could not serialize access due to concurrent update khi hai bên cùng sửa một dòng; SERIALIZABLE dùng SSI – ghi nhận ai đã đọc gì và phát hiện write skew – nhưng có thể báo lỗi dư (false positive) và bắt buộc retry. mọi lỗi SQLSTATE 40001 phải retry toàn bộ transaction từ đầu, kể cả các SELECT, và retry phải nằm ngoài @Transactional. Với nghiệp vụ tiền, tôi ưu tiên UPDATE có điều kiện + kiểm tra số dòng bị ảnh hưởng vì nó đúng ở mọi isolation và không cần retry."

  > Senior tip: với nghiệp vụ tiền, tôi ưu tiên "UPDATE có điều kiện + kiểm tra số dòng bị ảnh hưởng" vì nó đúng ở mọi isolation và không cần retry. SERIALIZABLE để dành cho bất biến trải trên nhiều dòng; khi bật, theo dõi tỉ lệ lỗi 40001 trên tổng transaction và cảnh báo nếu vượt vài phần trăm.`,
  follow: ['Optimistic locking bằng cột version khác gì so với UPDATE có điều kiện?', 'Vì sao transaction read-only có thể dùng SERIALIZABLE READ ONLY DEFERRABLE để không bao giờ bị huỷ?', 'MySQL InnoDB ở REPEATABLE READ xử lý cùng kịch bản lost update thế nào?'],
  tags: ['PostgreSQL', 'READ COMMITTED', 'SERIALIZABLE', 'SSI', 'lost update', 'write skew', 'retry'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Transaction Isolation', url: 'https://www.postgresql.org/docs/current/transaction-iso.html' },
    { type: 'doc', title: 'PostgreSQL: Serialization Failure Handling', url: 'https://www.postgresql.org/docs/current/mvcc-serialization-failure-handling.html' }
  ]
},
{
  id: 'db-035', topic: 'db', level: 'senior',
  q: 'Đĩa của PostgreSQL primary đầy dần dù dữ liệu không tăng; thư mục {{pg_wal}} chiếm 400GB. Team từng dùng Debezium (CDC) nhưng đã tắt connector tuần trước. WAL hoạt động thế nào, vì sao replication slot giữ WAL lại, và bạn xử lý, phòng ngừa ra sao?',
  a: `**Tóm tắt:** Mọi thay đổi được ghi vào WAL trước khi ghi vào file dữ liệu; sau checkpoint, segment WAL cũ được xoá/tái dùng, **trừ khi** còn ai đó cần nó. Replication slot là lời hứa "giữ WAL cho tới khi consumer xác nhận đã đọc". Consumer chết (Debezium tắt, replica bị gỡ) mà slot vẫn còn thì WAL tích luỹ mãi tới khi đầy đĩa và primary ngừng hoạt động. Xử lý: tìm slot inactive, drop; phòng ngừa: đặt {{max_slot_wal_keep_size}} và cảnh báo theo lượng WAL bị giữ.

### Bước 1: WAL là gì và vì sao cần
~~~text
UPDATE -> (1) ghi record vào WAL buffer -> (2) COMMIT: flush WAL xuống đĩa (fsync)
       -> (3) trang dữ liệu sửa trong shared_buffers, ghi xuống file sau
       -> (4) CHECKPOINT: đẩy mọi trang bẩn xuống đĩa
       -> WAL trước checkpoint không còn cần để crash recovery -> segment (16MB) được tái dùng/xoá
~~~
Nhờ WAL, commit chỉ cần ghi tuần tự một file log thay vì ghi ngẫu nhiên nhiều trang; crash thì phát lại WAL từ checkpoint gần nhất. Replica (streaming replication) và CDC (logical decoding) cũng chỉ là "người đọc WAL".

### Bước 2: replication slot giữ WAL thế nào
Không có slot, primary xoá WAL theo lịch, nên replica chậm quá có thể mất đoạn WAL cần và phải dựng lại. Slot khắc phục điều đó: primary nhớ vị trí {{restart_lsn}} của từng consumer và **không xoá WAL sau vị trí đó**. Cái giá: consumer biến mất thì slot vẫn giữ. Ví dụ: hệ thống sinh 60GB WAL/ngày, connector tắt 7 ngày, thì khoảng 400GB WAL bị giữ.

### Bước 3: chẩn đoán
~~~sql
SELECT slot_name, slot_type, active, wal_status,
       pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained_wal
FROM pg_replication_slots
ORDER BY pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn) DESC;
-- slot active = false và retained_wal lớn là thủ phạm
~~~
Các nguyên nhân khác cũng làm WAL bị giữ, kiểm tra luôn:
| Nguyên nhân | Dấu hiệu |
|---|---|
| Slot inactive / consumer chậm | {{pg_replication_slots}} như trên |
| {{archive_command}} lỗi liên tục | {{pg_stat_archiver.failed_count}} tăng, file {{.ready}} dồn trong {{pg_wal/archive_status}} |
| {{wal_keep_size}} đặt quá lớn | cấu hình |
| Ghi rất nhiều giữa hai checkpoint | {{max_wal_size}} chỉ là giới hạn mềm |

### Bước 4: xử lý
1. Xác nhận slot không còn ai dùng (Debezium đã gỡ hẳn chưa, replica nào còn sống).
2. {{SELECT pg_drop_replication_slot('debezium_orders');}} WAL sẽ được dọn ở checkpoint tiếp theo.
3. Nếu CDC còn cần: dựng lại connector, chấp nhận snapshot lại dữ liệu vì đoạn WAL đã mất.
4. **Không** xoá tay file trong {{pg_wal}}: làm hỏng cluster.

### Phòng ngừa
- {{max_slot_wal_keep_size}} (PostgreSQL 13+, mặc định -1 tức không giới hạn): vượt ngưỡng thì slot bị đánh dấu {{wal_status = 'lost'}}; mất CDC/replica nhưng primary sống. Chọn ngưỡng nhỏ hơn dung lượng trống của đĩa với biên an toàn.
- Cảnh báo theo {{retained_wal}} và theo {{active = false}} kéo dài. Trên Amazon RDS: metric {{OldestReplicationSlotLag}} và {{TransactionLogsDiskUsage}}.
- Quy trình gỡ CDC/replica phải có bước drop slot.
- Logical slot còn giữ {{catalog_xmin}}: VACUUM không dọn được bảng hệ thống; slot vật lý với {{hot_standby_feedback = on}} giữ xmin nên gây bloat bảng người dùng. Slot bỏ quên vừa đầy đĩa vừa bloat.

### Liên hệ replica lag
Replica dùng slot sẽ không mất WAL, nhưng replica lag lớn đồng nghĩa primary giữ nhiều WAL. Theo dõi {{pg_stat_replication}} ({{write_lag}}, {{flush_lag}}, {{replay_lag}}) song song với kích thước WAL bị giữ.

> Senior tip: tôi coi "retained WAL > 20% dung lượng trống" là cảnh báo cấp trang (page) chứ không phải email. Sự cố đầy đĩa vì slot bỏ quên rất phổ biến sau các PoC CDC; cách rẻ nhất là đặt {{max_slot_wal_keep_size}} ngay khi tạo cluster.

### Ví dụ đời thực
  Một hệ thống phân tích dữ liệu dùng PostgreSQL primary để ingest dữ liệu từ sensor, đồng thời dùng Debezium CDC để publish sự kiện vào Kafka. Sau khi team tắt connector Debezium (không cần nữa), không ai xoá replication slot. Vài tuần sau, {{pg_wal}} chiếm 400GB và đĩa primary gần đầy dù dữ liệu bảng chỉ 50GB. Điều tra: {{SELECT slot_name, active, wal_status, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) FROM pg_replication_slots}} → slot {{debezium_orders}} có active = false và retained_wal = 412GB – slot vẫn giữ WAL từ lúc connector còn chạy. Sửa: {{SELECT pg_drop_replication_slot('debezium_orders')}} → WAL được dọn ở checkpoint tiếp theo; thêm {{max_slot_wal_keep_size = 10GB}} và cảnh báo khi retained_wal > 8GB. Kết quả: đĩa giảm về 60GB, và sau đó không còn tăng phiền toái. Nếu CDC vẫn cần, phải dựng lại connector và chấp nhận snapshot lại dữ liệu vì đoạn WAL đã mất.

### Trả lời mẫu khi phỏng vấn
  "WAL là log ghi trước: mọi UPDATE/DELETE/INSERT đều ghi record vào WAL trước khi ghi vào file dữ liệu; sau checkpoint, segment WAL cũ được tái dùng, trừ khi còn ai đó cần nó. Replication slot là lời hứa 'giữ WAL cho tới khi consumer xác nhận đã đọc' – primary nhớ vị trí restart_lsn của từng consumer và không xoá WAL sau vị trí đó. Khi consumer biến mất (Debezium tắt, replica bị gỡ) mà slot vẫn còn thì WAL tích luỹ mãi tới khi đầy đĩa. Chẩn đoán bằng {{pg_replication_slots}}: slot active = false và retained_wal lớn là thủ phạm; cũng kiểm tra {{pg_stat_archiver.failed_count}} (archive_command lỗi) và {{wal_keep_size}} đặt quá lớn. Xác nhận không còn ai dùng thì {{pg_drop_replication_slot}}; **không** xoá tay file trong pg_wal vì làm hỏng cluster. Phòng ngừa: đặt {{max_slot_wal_keep_size}} nhỏ hơn dung lượng trống với biên an toàn, cảnh báo theo retained_wal và active = false kéo dài, và quy trình gỡ CDC/replica phải có bước drop slot. Trên Amazon RDS, theo dõi metric OldestReplicationSlotLag và TransactionLogsDiskUsage. Tôi coi retained WAL > 20% dung lượng trống là cảnh báo cấp trang chứ không phải email."

  > Senior tip: tôi coi "retained WAL > 20% dung lượng trống" là cảnh báo cấp trang (page) chứ không phải email. Sự cố đầy đĩa vì slot bỏ quên rất phổ biến sau các PoC CDC; cách rẻ nhất là đặt {{max_slot_wal_keep_size}} ngay khi tạo cluster.`,
  follow: ['Đặt max_slot_wal_keep_size thì đánh đổi gì với Debezium?', 'synchronous_commit và synchronous_standby_names ảnh hưởng tới độ trễ commit thế nào?', 'Vì sao query dài trên hot standby có thể bị huỷ, và hot_standby_feedback giải quyết đổi lại cái gì?'],
  tags: ['PostgreSQL', 'WAL', 'replication slot', 'Debezium', 'CDC', 'disk full'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Write-Ahead Logging (WAL)', url: 'https://www.postgresql.org/docs/current/wal-intro.html' },
    { type: 'doc', title: 'PostgreSQL: pg_replication_slots', url: 'https://www.postgresql.org/docs/current/view-pg-replication-slots.html' },
    { type: 'doc', title: 'PostgreSQL: Replication settings', url: 'https://www.postgresql.org/docs/current/runtime-config-replication.html' }
  ]
},
{
  id: 'db-036', topic: 'db', level: 'lead',
  q: 'Bạn chạy {{ALTER TABLE orders ADD COLUMN note VARCHAR(255)}} (online DDL, ALGORITHM=INSTANT) trên MySQL 8 lúc 10 giờ sáng. Câu lệnh treo, và trong vài giây mọi API đọc/ghi bảng {{orders}} đều treo theo, connection pool cạn. Chuyện gì đã xảy ra, bạn cứu sự cố thế nào, và đặt timeout gì để không lặp lại?',
  a: `**Tóm tắt:** Một transaction dài (thường là phiên "Sleep" quên commit) đang giữ **metadata lock (MDL)** dạng shared trên bảng. ALTER TABLE, dù INSTANT, vẫn cần MDL exclusive trong chốc lát nên phải chờ; và vì yêu cầu exclusive đang xếp hàng, **mọi câu lệnh mới trên bảng cũng xếp hàng sau nó**. Cứu: tìm và KILL phiên đang giữ transaction (hoặc huỷ ALTER). Phòng: {{lock_wait_timeout}} ngắn cho phiên DDL, cảnh báo transaction dài, timeout ở tầng app và DB.

### Bước 1: metadata lock là gì
MDL bảo vệ **cấu trúc** bảng (không phải dữ liệu). Mọi câu lệnh chạm bảng, kể cả SELECT thường, lấy MDL shared; quan trọng là MDL được giữ **tới khi transaction kết thúc**, không phải khi câu lệnh xong. DDL cần MDL exclusive.
~~~text
10:00:00  phiên 41: BEGIN; SELECT * FROM orders WHERE id = 1;   -- giữ MDL shared, rồi "Sleep" không commit
10:00:05  phiên 77: ALTER TABLE orders ...                        -- chờ MDL exclusive
10:00:06  phiên 80..300 (API): SELECT/INSERT orders               -- xếp hàng SAU yêu cầu exclusive
          -> SHOW PROCESSLIST: "Waiting for table metadata lock" hàng trăm dòng, Hikari báo timeout
~~~
Hàng đợi khoá công bằng theo thứ tự: không cho shared mới "chen ngang" yêu cầu exclusive đang chờ (để DDL không bị bỏ đói mãi). Vì vậy một phiên quên commit + một DDL là đủ làm treo bảng.

### Bước 2: cứu sự cố
1. Nhanh nhất: huỷ ALTER ({{KILL 77}}), hàng đợi giải phóng ngay, API sống lại.
2. Tìm phiên giữ khoá:
~~~sql
-- MySQL 8: sys schema chỉ ra ai chặn ai
SELECT waiting_pid, blocking_pid, sql_kill_blocking_connection
FROM sys.schema_table_lock_waits WHERE object_name = 'orders';
-- transaction mở lâu nhất
SELECT trx_mysql_thread_id, trx_started, trx_state
FROM information_schema.innodb_trx ORDER BY trx_started LIMIT 5;
~~~
3. {{KILL QUERY 41}} vô dụng ở đây: nó chỉ huỷ **câu lệnh đang chạy**, mà phiên 41 đang Sleep, không có câu lệnh nào. Phải {{KILL 41}} (tức KILL CONNECTION): đóng kết nối và rollback transaction, nhả mọi khoá.
4. Transaction lớn bị kill phải rollback, có thể mất nhiều phút (trạng thái killed/rolling back): đừng restart MySQL để "nhanh hơn", recovery khi khởi động cũng phải rollback y như vậy.

| Lệnh | MySQL | PostgreSQL |
|---|---|---|
| Huỷ câu lệnh, giữ phiên | {{KILL QUERY id}} | {{pg_cancel_backend(pid)}} |
| Đóng phiên, rollback transaction | {{KILL id}} | {{pg_terminate_backend(pid)}} |

### Bước 3: transaction dài còn gây hại gì
- InnoDB không purge được undo log cũ hơn read view mở lâu nhất: {{History list length}} trong {{SHOW ENGINE INNODB STATUS}} tăng, query chậm dần vì phải lần qua nhiều phiên bản.
- PostgreSQL: VACUUM không dọn được dead tuple, bảng bloat; ALTER TABLE lấy ACCESS EXCLUSIVE và gây đúng hiện tượng xếp hàng như MySQL.
- Giữ row lock: request khác chờ tới {{innodb_lock_wait_timeout}} (mặc định 50 giây).

Nguồn gốc thường gặp phía Java: {{@Transactional}} bao cả lời gọi HTTP chậm; connection bị leak khỏi pool; người dùng mở tool SQL ở chế độ manual commit rồi đi họp.

### Bước 4: timeout nên đặt
| Ở đâu | Tham số | Gợi ý |
|---|---|---|
| Phiên chạy DDL (MySQL) | {{SET SESSION lock_wait_timeout = 5}} | mặc định là 31536000 giây (1 năm) |
| Phiên chạy DDL (PostgreSQL) | {{SET lock_timeout = '3s'}} | thất bại nhanh rồi retry, thay vì chặn cả bảng |
| PostgreSQL toàn cục | {{idle_in_transaction_session_timeout}}, {{statement_timeout}}, {{transaction_timeout}} (PG 17+) | ví dụ 60s / 30s cho user của app |
| MySQL | {{max_execution_time}} (chỉ SELECT, ms), {{wait_timeout}} cho phiên idle | |
| App | Hikari {{leakDetectionThreshold}}, transaction timeout của Spring | phát hiện code giữ connection lâu |

~~~sql
-- quy trình DDL an toàn: chờ khoá tối đa 5s, thất bại thì thử lại sau
SET SESSION lock_wait_timeout = 5;
ALTER TABLE orders ADD COLUMN note VARCHAR(255), ALGORITHM=INSTANT;
~~~

### Pitfall production
- Tin rằng "INSTANT/online DDL thì không khoá": phần copy/rebuild không khoá, nhưng lúc bắt đầu và kết thúc vẫn cần MDL exclusive.
- Kill bừa phiên của job batch đang ghi dở: rollback lâu và có thể làm sai lệch nghiệp vụ; luôn xem {{trx_started}}, {{trx_rows_modified}} trước khi kill.
- Đặt timeout DB mà không có retry ở script migration: deploy thất bại ngẫu nhiên. Script DDL phải có vòng thử lại với backoff.

### Ví dụ đời thực
  Một hệ thống giao dịch chạy trên MySQL 8 với 30 pod, mỗi pod giữ khoảng 20 connection trong pool. Vào lúc 10:00 sáng, team triển khai một migration: {{ALTER TABLE orders ADD COLUMN note VARCHAR(255), ALGORITHM=INSTANT}}. Lệnh INSTANT được chọn vì nó không cần copy bảng, chỉ cập nhật metadata. Tuy nhiên, ngay sau khi migration bắt đầu, toàn bộ API đọc/ghi bảng orders đều treo. Dashboard hiện connection pool cạn: 30 pod × 20 connection = 600 connection, tất cả đều ở trạng thái "Waiting for table metadata lock". API timeout sau 30 giây, người dùng thấy 502. Điều tra: {{SHOW PROCESSLIST}} cho thấy hàng trăm thread đang chờ, trong đó một thread (id 77) đang chạy ALTER, và một thread khác (id 41) đang giữ transaction đã mở từ 10:00:00 (khoảng 5 giây trước) với câu lệnh {{SELECT * FROM orders WHERE id = 1}} rồi "Sleep" không commit. Đây là một phiên debug của developer đang chạy tool SQL ở chế độ manual commit, quên gõ COMMIT. Lệnh ALTER cần MDL exclusive để thay đổi cấu trúc bảng, nhưng MDL shared của phiên 41 vẫn giữ tới khi transaction kết thúc; và vì hàng đợi MDL là FIFO theo thứ tự, mọi câu lệnh mới (SELECT/INSERT từ 600 connection) đều xếp hàng sau yêu cầu exclusive → bảng bị khóa toàn bộ. Cứu: {{KILL 41}} (đóng kết nối, rollback transaction) → MDL shared được giải phóng → ALTER có thể lấy exclusive → xong, hàng đợi giải phóng, API sống lại sau khoảng 30 giây. Kết quả đo: thời gian downtime khoảng 45 giây, không có dữ liệu mất. Sau đó team đặt {{SET SESSION lock_wait_timeout = 5}} trước mỗi DDL (mặc định là 31536000 giây = 1 năm), thêm script kiểm tra {{information_schema.innodb_trx}} có transaction nào mở quá 60 giây không trước khi chạy migration, và đặt {{HikariCP.leakDetectionThreshold = 60000}} để phát hiện connection rò rỉ. Lần deploy tiếp theo, DDL thất bại sau 5 giây thay vì treo cả bảng, và team retry khi không có transaction nào mở lâu.

### Trả lời mẫu khi phỏng vấn
  "Khi một DDL như ALTER TABLE trên MySQL bị treo, tôi nghĩ ngay đến metadata lock. MDL bảo vệ cấu trúc bảng, và nó được giữ tới khi transaction kết thúc, không phải khi câu lệnh xong. Nếu có một transaction nào đó đang Sleep mà chưa commit, dù là do developer hay code giữ connection lâu, thì DDL—even một lệnh INSTANT—vẫn phải chờ MDL exclusive. Háy là mọi câu lệnh mới trên bảng đều xếp hàng sau yêu cầu exclusive, nên không chỉ DDL bị treo mà toàn bộ API đọc/ghi bảng cũng bị khóa. Tôi cứu bằng cách tìm phiên giữ MDL—in MySQL dùng sys.schema_table_lock_waits, trong PostgreSQL dùng pg_locks—and nếu đó là transaction forgotten, tôi kill connection đó (KILL id trên MySQL, pg_terminate_backend trên PostgreSQL), không kill câu lệnh (KILL QUERY chỉ huỷ lệnh đang chạy, còn phiên đang Sleep thì vô dụng). Phòng ngừa: đặt lock_wait_timeout hoặc lock_timeout vài giây cho phiên DDL để nó thất bại nhanh thay vì chờ 1 năm (mặc định), kiểm tra không có transaction nào mở quá 60 giây trước khi chạy migration, và retry với backoff. Với app, đặt leakDetectionThreshold để bắt connection rò rỉ—the source của nhiều transaction dài."

  > Senior tip: checklist trước mọi DDL trên production của tôi: (1) xem {{information_schema.innodb_trx}} có transaction nào mở quá 60 giây không, (2) đặt {{lock_wait_timeout}}/{{lock_timeout}} vài giây, (3) chạy giờ thấp điểm có người trực. Ba bước này tốn 2 phút và đã tránh cho team tôi nhiều sự cố "DDL 1 giây làm sập API 10 phút".`,
  follow: ['gh-ost tránh được vấn đề MDL ở mức nào, và bước cut-over của nó vẫn cần khoá gì?', 'Làm sao phát hiện tự động transaction mở quá lâu và cảnh báo trước khi có sự cố?', 'Trên PostgreSQL, thêm cột có DEFAULT có rewrite bảng không, và khi nào thì có?'],
  tags: ['MySQL', 'metadata lock', 'long transaction', 'online DDL', 'KILL', 'lock_timeout', 'PostgreSQL'],
  refs: [
    { type: 'doc', title: 'MySQL: Metadata Locking', url: 'https://dev.mysql.com/doc/refman/8.0/en/metadata-locking.html' },
    { type: 'doc', title: 'MySQL: KILL Statement', url: 'https://dev.mysql.com/doc/refman/8.0/en/kill.html' },
    { type: 'doc', title: 'PostgreSQL: Client Connection Defaults (timeouts)', url: 'https://www.postgresql.org/docs/current/runtime-config-client.html' },
    { type: 'doc', title: 'PostgreSQL: Server Signaling Functions', url: 'https://www.postgresql.org/docs/current/functions-admin.html' }
  ]
},
{
  id: 'db-037', topic: 'db', level: 'mid',
  q: 'Màn hình "đơn hàng gần đây" chạy {{SELECT ... FROM orders WHERE customer_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20}} mất 800ms dù đã có index trên {{customer_id}}. Bạn thiết kế index thế nào cho query có ORDER BY + LIMIT, thứ tự cột quyết định ra sao, và kiểm chứng bằng EXPLAIN thế nào?',
  a: `**Tóm tắt:** Index chỉ trên {{customer_id}} giúp tìm đúng khách hàng, nhưng DB vẫn phải đọc **mọi** đơn của khách đó, lọc status rồi **sắp xếp** mới lấy 20 dòng. Index ghép {{(customer_id, status, created_at)}} đặt cột so sánh bằng trước, cột sắp xếp sau, nên DB đi thẳng tới đúng đoạn index đã có sẵn thứ tự, đọc 20 entry rồi dừng. Quy tắc: **bằng (=) trước, sắp xếp sau, khoảng (range) cuối**.

### Bước 1: vì sao index một cột chưa đủ
Giả sử khách VIP có 50.000 đơn. Với index {{(customer_id)}}:
~~~text
1. Tìm trong index: 50.000 entry của customer 42
2. Với mỗi entry, đọc dòng trong bảng để kiểm tra status   -> 50.000 lần đọc ngẫu nhiên
3. Còn 12.000 dòng đúng status -> SORT theo created_at
4. Lấy 20 dòng đầu
~~~
Bước 2 và 3 là nơi tốn 800ms. LIMIT 20 không giúp được gì vì phải sắp xếp xong mới biết 20 dòng nào mới nhất.

### Bước 2: index ghép, B-tree sắp theo nhiều cột
Index {{(customer_id, status, created_at)}} sắp theo customer_id, trong cùng customer thì theo status, rồi theo created_at:
~~~text
(42, 'NEW',  2024-01-01) (42, 'NEW', 2024-03-05) ... (42, 'PAID', 2023-12-30) (42, 'PAID', 2024-02-11) ...
                                                     |<------- đoạn customer=42, status=PAID: đã sắp theo created_at ------->|
~~~
Hai cột đầu là so sánh bằng, nên đoạn khớp là một dải liền, và bên trong dải đó created_at **đã có thứ tự**. DB nhảy tới cuối dải, đọc ngược 20 entry, xong. Không có bước sort; chi phí gần như không phụ thuộc khách có bao nhiêu đơn. B-tree đọc ngược được, nên không cần khai báo DESC cho trường hợp chỉ một chiều sắp xếp.

### Bước 3: leftmost prefix và thứ tự cột
Index {{(a, b, c)}} dùng hiệu quả cho điều kiện trên {{a}}, {{a, b}}, {{a, b, c}}; điều kiện chỉ trên {{b}} thì thường không (MySQL 8.0.13+ và PostgreSQL 18 có skip scan, nhưng chỉ có lợi khi cột đầu ít giá trị khác nhau).
| Query | Index tốt | Lý do |
|---|---|---|
| {{customer_id = ? AND status = ? ORDER BY created_at}} | {{(customer_id, status, created_at)}} | bằng, bằng, sắp xếp |
| {{customer_id = ? AND created_at > ? ORDER BY created_at}} | {{(customer_id, created_at)}} | range trùng cột sắp xếp: vẫn có thứ tự |
| {{customer_id IN (...) ORDER BY created_at}} | khó tránh sort | nhiều dải, mỗi dải có thứ tự riêng |
| {{created_at > ? AND customer_id = ?}} | {{(customer_id, created_at)}} | cột bằng phải đứng trước cột range |

Đặt cột range trước cột sắp xếp (ví dụ {{(customer_id, total, created_at)}} với {{total > 100}}) thì phần sau range mất thứ tự, DB lại phải sort.

### Bước 4: kiểm chứng bằng EXPLAIN
PostgreSQL, trước và sau:
~~~text
-- trước
Limit -> Sort (Sort Method: top-N heapsort) -> Bitmap Heap Scan on orders
           Recheck Cond: (customer_id = 42)  Filter: (status = 'PAID')  Rows Removed by Filter: 38000
-- sau
Limit (actual rows=20) -> Index Scan Backward using idx_cust_status_created on orders
~~~
MySQL: trước có {{Using filesort}} trong cột Extra; sau là {{Backward index scan}}, không còn filesort. Nếu index còn chứa đủ các cột SELECT cần (covering index, hoặc {{INCLUDE}} trong PostgreSQL) thì Extra hiện {{Using index}} / plan là Index Only Scan, không phải đọc bảng.

### Pitfall production
- **Bẫy LIMIT với index sắp xếp:** query {{WHERE status = 'FRAUD' ORDER BY created_at DESC LIMIT 20}} chỉ có index {{(created_at)}}. Planner nghĩ "đọc ngược theo thời gian, sớm gặp 20 dòng FRAUD", nhưng FRAUD rất hiếm nên phải quét hàng triệu entry. Sửa bằng index {{(status, created_at)}} hoặc partial index.
- Thêm index ghép mới mà quên index cũ {{(customer_id)}} giờ đã thừa (là prefix của index mới): tốn ghi và RAM vô ích.
- Thứ tự ORDER BY trộn chiều ({{a ASC, b DESC}}) cần index khai báo đúng chiều (MySQL 8 và PostgreSQL đều hỗ trợ index DESC).

### Ví dụ đời thực
  Một app bán hàng có màn hình "Đơn hàng gần đây" hiển thị 20 đơn mới nhất của khách hàng hiện tại. Query là {{SELECT id, status, total FROM orders WHERE customer_id = ? AND status = ? ORDER BY created_at DESC LIMIT 20}}, đã có index đơn lẻ trên {{customer_id}}. Khi khách VIP (có 50.000 đơn trong 2 năm) mở màn hình này vào giờ cao điểm, API mất 800ms, trong khi khách có 50 đơn thì 50ms. Điều tra: log SQL thấy query chạy xong nhưng DB phải đọc 50.000 entry trong index customer_id, rồi với mỗi entry đọc dòng trong bảng để kiểm tra status (50.000 lần đọc ngẫu nhiên), còn 12.000 dòng đúng status phải được SORT theo created_at trước khi lấy 20 dòng. EXPLAIN trên PostgreSQL hiện node "Bitmap Heap Scan ... Rows Removed by Filter: 38000" và "Sort Method: top-N heapsort". Sửa: tạo index ghép {{CREATE INDEX idx_cust_status_created ON orders (customer_id, status, created_at DESC)}}. Với index này, DB nhảy tới phần của customer 42, tìm dải status='PAID' (đã sắp xếp theo created_at DESC), đọc ngược 20 entry rồi dừng—không có node Sort. Kết quả: API từ 800ms xuống 8ms, số dòng đọc từ 50.000 xuống 20. Sau đó phát hiện index cũ {{(customer_id)}} đã thừa (là prefix của index mới), DROP để không tốn ghi và RAM.

### Trả lời mẫu khi phỏng vấn
  "Với một query có WHERE bằng, WHERE bằng thứ hai, ORDER BY và LIMIT, tôi lập tức nghĩ đến index ghép 3 cột. Nguyên tắc là cột so sánh bằng phải đứng trước cột sắp xếp: {{(customer_id, status, created_at)}}. Với index này, B-tree đã sắp xếp thứ tự trong cùng một customer và một status, nên DB chỉ cần tìm tới dải tương ứng rồi đọc ngược 20 entry—không cần sort. Kiểm chứng bằng EXPLAIN: trước là Bitmap Heap Scan + Sort Method top-N heapsort, sau là Index Scan Backward, không còn node Sort. Nếu có thêm cột range (ví dụ total > 100) thì cột range phải đứng cuối vì nó làm mất thứ tự ở phần sau. Một bẫy hay: query {{WHERE status = 'FRAUD' ORDER BY created_at DESC LIMIT 20}} với index {{(created_at)}}—planner nghĩ đọc ngược thời gian sẽ sớm gặp 20 dòng FRAUD, nhưng FRAUD rất hiếu nên phải quét hàng triệu entry; fix bằng {{(status, created_at)}} hoặc partial index WHERE status = 'FRAUD'. Cuối cùng, nếu index mới là mở rộng của index cũ thì hãy DROP index cũ để không tốn chi phí bảo trì."

  > Senior tip: khi nhận một query chậm, tôi viết ra ba nhóm cột: cột so sánh bằng, cột sắp xếp, cột range, rồi dựng index đúng thứ tự đó, sau đó mới xem EXPLAIN. Với màn hình danh sách có LIMIT, mục tiêu là plan không có node Sort và số dòng đọc xấp xỉ LIMIT.`,
  follow: ['Phân trang trang thứ 500 của màn hình này thì index trên còn giúp được không?', 'Index Only Scan phụ thuộc visibility map thế nào?', 'Khi nào nên dùng partial index thay vì thêm cột status vào index?'],
  tags: ['index', 'composite index', 'ORDER BY', 'LIMIT', 'EXPLAIN', 'filesort', 'leftmost prefix'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Indexes and ORDER BY', url: 'https://www.postgresql.org/docs/current/indexes-ordering.html' },
    { type: 'doc', title: 'PostgreSQL: Multicolumn Indexes', url: 'https://www.postgresql.org/docs/current/indexes-multicolumn.html' },
    { type: 'doc', title: 'MySQL: ORDER BY Optimization', url: 'https://dev.mysql.com/doc/refman/8.0/en/order-by-optimization.html' },
    { type: 'article', title: 'ZemIT: Đánh index cho query thực tế', url: 'https://zemit.substack.com/p/phan-lon-dev-chi-anh-index-en-dau' }
  ]
},
{
  id: 'db-038', topic: 'db', level: 'senior',
  q: 'Job đồng bộ cần ghi 2 triệu dòng giá sản phẩm mỗi đêm (dòng nào có rồi thì cập nhật) và đang chạy mất 3 giờ bằng vòng lặp {{save()}} từng dòng. Bạn tăng tốc thế nào ở tầng JDBC/SQL: batch, multi-row insert, COPY, upsert {{ON CONFLICT}} / {{ON DUPLICATE KEY UPDATE}}, và những bẫy nào cần biết?',
  a: `**Tóm tắt:** Thời gian chủ yếu mất vào **round-trip mạng và commit từng dòng**, không phải vào việc ghi. Gom thành batch (JDBC {{addBatch}}), bật driver viết lại thành multi-row insert ({{reWriteBatchedInserts}} cho PostgreSQL, {{rewriteBatchedStatements}} cho MySQL), commit theo lô vài nghìn dòng, và dùng upsert một câu thay cho "SELECT rồi INSERT/UPDATE". Với nạp thô số lượng rất lớn, {{COPY}} (PostgreSQL) là nhanh nhất.

### Bước 1: tiền đi đâu
Mỗi {{save()}} trong vòng lặp thường gồm: SELECT kiểm tra tồn tại, rồi INSERT hoặc UPDATE, mỗi câu một round-trip; nếu mỗi dòng một transaction thì thêm một lần fsync WAL/redo log khi commit.
~~~text
2.000.000 dòng x 2 câu x 1ms round-trip  = 4.000 giây (~67 phút) chỉ để chờ mạng
+ 2.000.000 commit x ~1-2ms fsync        = thêm 30-60 phút
~~~
Cùng dữ liệu, batch 1.000 dòng/round-trip và commit mỗi 5.000 dòng thì phần chờ mạng và fsync giảm hàng nghìn lần; còn lại chủ yếu là chi phí ghi dữ liệu và cập nhật index.

### Bước 2: JDBC batch + để driver viết lại
~~~java
String sql = "INSERT INTO product_price(sku, price, updated_at) VALUES (?, ?, now()) "
           + "ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price, updated_at = now() "
           + "WHERE product_price.price IS DISTINCT FROM EXCLUDED.price"; // bỏ qua dòng không đổi
try (PreparedStatement ps = conn.prepareStatement(sql)) {
    conn.setAutoCommit(false);
    int n = 0;
    for (PriceRow r : rows) {
        ps.setString(1, r.sku()); ps.setBigDecimal(2, r.price());
        ps.addBatch();
        if (++n % 1000 == 0) ps.executeBatch();   // 1 round-trip cho 1000 dòng
        if (n % 5000 == 0) conn.commit();         // transaction vừa phải, không giữ khoá quá lâu
    }
    ps.executeBatch(); conn.commit();
}
~~~
URL JDBC: PostgreSQL thêm {{reWriteBatchedInserts=true}}, MySQL Connector/J thêm {{rewriteBatchedStatements=true}}. Không có cờ này, driver vẫn gửi từng câu INSERT (dù trong một lần gửi); có cờ thì gộp thành {{INSERT ... VALUES (...), (...), ...}}, server parse và thực thi ít câu hơn. Nếu dùng Hibernate: ID {{IDENTITY}} làm Hibernate tắt batch insert, nên dùng sequence (xem câu về batching của JPA).

### Bước 3: upsert khác nhau giữa hai DB
| | PostgreSQL {{ON CONFLICT}} | MySQL {{ON DUPLICATE KEY UPDATE}} |
|---|---|---|
| Xác định trùng | chỉ định rõ cột/constraint | bất kỳ unique key nào (nhiều unique key thì khó đoán dòng nào bị sửa) |
| Tham chiếu giá trị mới | {{EXCLUDED.col}} | alias dòng: {{VALUES (...) AS new ... col = new.col}} (8.0.19+); {{VALUES(col)}} đã deprecated |
| Kết quả đếm | số dòng insert + update | 1 = insert, 2 = update, 0 = không đổi |
| Bẫy | một câu không được đụng một dòng hai lần: lỗi {{ON CONFLICT DO UPDATE command cannot affect row a second time}} | dòng trùng vẫn "tiêu" một giá trị AUTO_INCREMENT, ID nhảy cóc |

Bẫy PostgreSQL ở trên xảy ra khi một multi-row insert chứa hai dòng cùng sku: khử trùng lặp trong lô trước khi gửi.

### Bước 4: COPY cho nạp thô
~~~java
// PostgreSQL JDBC: stream CSV thẳng vào bảng tạm, rồi một câu upsert từ bảng tạm
CopyManager copy = conn.unwrap(PGConnection.class).getCopyAPI();
copy.copyIn("COPY price_staging (sku, price) FROM STDIN WITH (FORMAT csv)", csvReader);
// sau đó: INSERT INTO product_price SELECT ... FROM price_staging ON CONFLICT (sku) DO UPDATE ...
~~~
COPY bỏ qua gần như toàn bộ chi phí từng câu lệnh. MySQL tương đương là {{LOAD DATA LOCAL INFILE}} (phải bật {{local_infile}} ở server và {{allowLoadLocalInfile}} ở driver, cân nhắc bảo mật).

### Pitfall production
- Commit một lô 2 triệu dòng: transaction khổng lồ, giữ khoá lâu, undo/WAL phình, lỗi ở dòng cuối thì rollback cả đêm. Lô vài nghìn dòng + checkpoint để chạy lại được.
- Upsert song song từ nhiều luồng với thứ tự khoá khác nhau sinh deadlock: sắp xếp dòng theo khoá (sku) trong mỗi lô.
- Nạp lần đầu vào bảng trống có nhiều index: tạo index **sau** khi nạp nhanh hơn nhiều so với cập nhật index từng dòng.
- UPDATE dòng không thay đổi vẫn tạo phiên bản dòng mới trong PostgreSQL: lọc bằng {{IS DISTINCT FROM}} như ví dụ để bớt bloat và WAL.

### Ví dụ đời thực
  Một hệ thống bán lẻ cần đồng bộ bảng giá sản phẩm từ hệ thống ERP mỗi đêm: 2 triệu dòng, dòng nào có sẵn thì cập nhật giá, dòng nào chưa có thì thêm. Phiên bản hiện tại dùng {{priceRepo.save(row)}} trong một vòng lặp—for each row, Hibernate chạy SELECT kiểm tra tồn tại rồi INSERT hoặc UPDATE, mỗi câu một round-trip, và mỗi dòng một transaction (commit). Job mất 3 giờ mỗi đêm, và vào một đêm, DB crash do WAL phình vì 2 triệu commit. Điều tra: log SQL thấy 4 triệu câu (2 SELECT + 2 INSERT/UPDATE per row), và {{SHOW ENGINE INNODB STATUS}} cho thấy history list length tăng dần do undo log không được purge vì transaction mở lâu. Sửa: viết JDBC batch với upsert—{{PreparedStatement}} + {{addBatch}}, mỗi 1.000 dòng {{executeBatch}}, commit mỗi 5.000 dòng; thêm {{reWriteBatchedInserts=true}} trong URL JDBC để driver viết lại thành multi-row INSERT; dùng {{ON CONFLICT (sku) DO UPDATE SET price = EXCLUDED.price}} để một câu thay cho SELECT + INSERT/UPDATE; lọc {{WHERE product_price.price IS DISTINCT FROM EXCLUDED.price}} để bỏ qua dòng không đổi. Kết quả: job từ 3 giờ xuống 9 phút, round-trip từ 4 triệu xuống 4.000, WAL không còn phình. Một bẫy xảy ra khi một lô chứa hai dòng cùng sku: PostgreSQL ném {{ON CONFLICT DO UPDATE command cannot affect row a second time}}, nên team thêm bước khử trùng lặp trong lô trước khi gửi.

### Trả lời mẫu khi phỏng vấn
  "Khi cần ghi hàng triệu dòng, thời gian chủ yếu mất vào round-trip mạng và commit từng dòng, không phải vào việc ghi. Cách tôi xử lý là gom thành batch—JDBC {{addBatch}} + {{executeBatch}}—và bật driver viết lại thành multi-row insert: {{reWriteBatchedInserts=true}} cho PostgreSQL, {{rewriteBatchedStatements=true}} cho MySQL. Với upsert, tôi dùng {{ON CONFLICT (sku) DO UPDATE SET ... EXCLUDED.col}} trên PostgreSQL—một câu thay cho SELECT rồi INSERT/UPDATE—và {{ON DUPLICATE KEY UPDATE}} trên MySQL. Commit theo lô vài nghìn dòng để transaction vừa phải, không giữ lock lâu. Với nạp thô rất lớn, {{COPY}} (PostgreSQL) hoặc {{LOAD DATA LOCAL INFILE}} (MySQL) là nhanh nhất. Pitfall cần biết: commit cả 2 triệu dòng sẽ làm transaction khổng lồ, upsert song song từ nhiều luồng với thứ tự khóa khác nhau sinh deadlock—và UPDATE dòng không thay đổi vẫn tạo phiên bản dòng mới trong PostgreSQL, nên lọc bằng {{IS DISTINCT FROM}} để bớt bloat và WAL."

  > Senior tip: trước khi tối ưu, tôi in hai con số: số round-trip và số commit cho mỗi 1.000 dòng. Job đồng bộ của một hệ thống bán lẻ tôi từng xử lý giảm từ vài giờ xuống dưới 10 phút chỉ bằng batch + rewrite + upsert, không cần đổi kiến trúc.`,
  follow: ['Khi batch thất bại ở giữa, làm sao biết dòng nào lỗi và chạy lại phần còn lại?', 'Bulk upsert từ nhiều worker song song thì chia dữ liệu thế nào để tránh deadlock?', 'Vì sao GenerationType.IDENTITY làm Hibernate tắt batch insert?'],
  tags: ['bulk insert', 'JDBC batch', 'COPY', 'ON CONFLICT', 'ON DUPLICATE KEY UPDATE', 'upsert', 'reWriteBatchedInserts'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Populating a Database', url: 'https://www.postgresql.org/docs/current/populate.html' },
    { type: 'doc', title: 'PostgreSQL: INSERT (ON CONFLICT)', url: 'https://www.postgresql.org/docs/current/sql-insert.html' },
    { type: 'doc', title: 'MySQL: INSERT ... ON DUPLICATE KEY UPDATE', url: 'https://dev.mysql.com/doc/refman/8.0/en/insert-on-duplicate.html' }
  ]
},
{
  id: 'db-039', topic: 'db', level: 'lead',
  q: 'Bạn cần export 5 triệu dòng giao dịch từ PostgreSQL mỗi đêm cho bộ phận đối soát. Phiên bản hiện tại dùng {{LIMIT 1000 OFFSET n}} và càng về cuối càng chậm, có đêm chết giữa chừng phải chạy lại từ đầu. Ở tầng database và JDBC, bạn thiết kế lại thế nào: keyset, streaming cursor, checkpoint/resume, đọc từ replica?',
  a: `**Tóm tắt:** OFFSET buộc DB đọc rồi **vứt bỏ** n dòng mỗi trang, nên tổng chi phí tăng theo bình phương. Thay bằng **keyset** ({{WHERE (created_at, id) > (?, ?) ORDER BY created_at, id LIMIT 5000}}): mỗi trang là một lần nhảy index, chi phí gần như hằng số, và khoá cuối của trang chính là **checkpoint** để chạy tiếp sau sự cố. Streaming cursor (fetchSize) cho một query duy nhất nhưng giữ transaction mở suốt quá trình; đọc từ replica để không ảnh hưởng primary nhưng phải xử lý xung đột recovery.

### Bước 1: vì sao OFFSET chậm dần
DB không "nhảy" được tới dòng thứ n; nó phải đi qua n dòng đầu theo thứ tự rồi bỏ đi.
~~~text
trang 1:     đọc 1.000 dòng
trang 2:     đọc 2.000 dòng (bỏ 1.000)
trang 5000:  đọc 5.000.000 dòng (bỏ 4.999.000)
tổng ≈ 5.000 trang x trung bình 2,5 triệu = ~12,5 tỷ lượt đọc dòng cho 5 triệu dòng hữu ích
~~~
Thêm nữa, dữ liệu bị insert/xoá giữa hai trang thì OFFSET lệch: dòng bị lặp hoặc bị sót.

### Bước 2: keyset pagination
~~~sql
-- index (created_at, id); id phá hoà khi trùng created_at
SELECT id, created_at, amount FROM txn
WHERE created_at >= :from AND created_at < :to
  AND (created_at, id) > (:lastCreatedAt, :lastId)   -- PostgreSQL so sánh row value dùng được index
ORDER BY created_at, id
LIMIT 5000;
~~~
Mỗi trang: một lần tìm trên B-tree tới vị trí {{(lastCreatedAt, lastId)}} rồi đọc 5.000 entry kế tiếp. Trang 1 và trang 1.000 tốn như nhau. Với MySQL, viết dạng tách {{created_at > ? OR (created_at = ? AND id > ?)}} và kiểm tra EXPLAIN để chắc index được dùng.

### Bước 3: checkpoint và resume
~~~java
// mỗi lô: đọc trang -> ghi file -> lưu checkpoint; crash thì đọc checkpoint chạy tiếp
Cursor cur = jobRepo.loadCheckpoint(jobId).orElse(Cursor.start(from));
while (true) {
    List<Txn> page = txnDao.nextPage(cur, 5000);        // query keyset ở trên, transaction ngắn
    if (page.isEmpty()) break;
    writer.append(page);                                // ghi part file / multipart upload
    cur = Cursor.after(page.get(page.size() - 1));
    jobRepo.saveCheckpoint(jobId, cur, writer.partNo()); // ghi SAU khi dữ liệu đã an toàn
}
~~~
Ghi checkpoint sau khi phần dữ liệu đã được lưu bền (part file đã flush/upload); nếu ngược lại, crash sẽ làm mất một lô. Chạy lại một lô thì có thể trùng, nên đầu ra theo part (ghi đè part cùng số) hoặc phía nhận khử trùng theo id.

### Bước 4: streaming cursor, khi nào dùng
Một query duy nhất, driver kéo dần từng mẻ thay vì nạp hết vào RAM:
| Môi trường | Cách bật |
|---|---|
| PostgreSQL JDBC | {{setAutoCommit(false)}} + {{setFetchSize(5000)}}, ResultSet forward-only; thiếu autoCommit=false thì driver vẫn tải hết |
| MySQL Connector/J | {{setFetchSize(Integer.MIN_VALUE)}} (stream từng dòng) hoặc {{useCursorFetch=true}} + fetchSize |
| Hibernate 6 | {{query.setFetchSize(5000).scroll(ScrollMode.FORWARD_ONLY)}} hoặc {{getResultStream()}}; dùng {{StatelessSession}} hoặc {{clear()}} định kỳ để persistence context không giữ 5 triệu entity |
| Spring Data JPA | method trả {{Stream}} phải chạy trong {{@Transactional(readOnly = true)}} và đóng stream (try-with-resources) |

Đánh đổi: cả quá trình là **một transaction dài**: giữ snapshot nên VACUUM không dọn được dead tuple của các bảng bị cập nhật nhiều, giữ connection hàng chục phút, và đứt giữa chừng thì phải chạy lại từ đầu (trừ khi kết hợp với khoá cuối đã xử lý). Ưu điểm: thấy một snapshot nhất quán duy nhất.

| | Keyset theo lô | Streaming cursor |
|---|---|---|
| Transaction | nhiều transaction ngắn | một transaction dài |
| Resume | tự nhiên qua checkpoint | khó |
| Nhất quán | mỗi lô một snapshot | một snapshot cho cả export |
| Ảnh hưởng VACUUM | thấp | cao nếu chạy lâu |

Với đối soát theo ngày, dữ liệu trong khoảng {{[from, to)}} đã "đóng" nên keyset theo lô vừa nhất quán vừa resume được; đó là lựa chọn mặc định của tôi.

### Bước 5: đọc từ replica
Chuyển export sang hot standby để primary không bị tranh I/O. Bẫy: query dài trên standby có thể bị huỷ với lỗi {{canceling statement due to conflict with recovery}} khi primary VACUUM dọn những dòng mà query còn cần. Các lựa chọn: lô ngắn (keyset lại thắng), tăng {{max_standby_streaming_delay}} (replica trễ hơn), hoặc {{hot_standby_feedback = on}} (an toàn cho query nhưng gây bloat trên primary).

Với đối sát theo ngày, dữ liệu trong khoảng {{[from, to)}} đã "đóng" nên keyset theo lô vừa nhất quán vừa resume được; đó là lựa chọn mặc định của tôi.

### Ví dụ đời thực
  Một công ty tài chính cần export 5 triệu dòng giao dịch mỗi đêm cho bộ phận đối chiếu, file CSV được upload lên S3. Phiên bản hiện tại dùng {{SELECT ... FROM txn ORDER BY id LIMIT 1000 OFFSET n}} trong một script Java—in mỗi trang, OFFSET tăng 1.000, và script chạy mất 4 giờ. Đêm thứ 7, script bị kill giữa chừng do timeout của cron; phải chạy lại từ đầu, và đến sáng mới xong. Điều tra: log PostgreSQL thấy mỗi trang cuối phải đọc hàng triệu dòng rồi bỏ đi—trang 5.000 đọc 5.000.000 dòng để bỏ 4.999.900. Tổng số dòng đọc ước tính 12,5 tỷ cho 5 triệu dòng hữu ích. Sửa: thay bằng keyset pagination—{{SELECT id, created_at, amount FROM txn WHERE (created_at, id) > (:lastCreatedAt, :lastId) ORDER BY created_at, id LIMIT 5000}} với index {{(created_at, id)}}. Mỗi trang là một lần nhảy index, chi phí gần như hằng số. Thêm checkpoint: mỗi lô xong, lưu {{(lastCreatedAt, lastId)}} và số part file vào DB; crash thì đọc checkpoint và chạy tiếp, ghi overwrite part file cùng số (phía nhận khử trùng theo id). Kết quả: export từ 4 giờ xuống 18 phút, và lần sau crash thì chỉ mất 2 phút để resume. Một bonus: vì mỗi lô là transaction ngắn, VACUUM có thể dọn dead tuple bình thường, không còn bị ảnh hưởng như streaming cursor.

### Trả lời mẫu khi phỏng vấn
  "Khi cần export hàng triệu dòng, OFFSET là một bẫy vì DB phải đọc rồi bỏ đi n dòng mỗi trang—tổng chi phí tăng theo bình phương. Thay vào đó, tôi dùng keyset pagination: WHERE (created_at, id) > (?, ?) ORDER BY created_at, id LIMIT 5000, với index (created_at, id). Mỗi trang là một lần nhảy index, chi phí gần như hằng số, và khóa cuối của trang là checkpoint để resume sau crash. Với một query duy nhất, streaming cursor (setFetchSize + autoCommit=false) giúp driver kéo dần từng mẻ mà không nạp hết vào RAM, nhưng giữ transaction mở suốt—heo cả VACUUM và connection—nên chỉ dùng khi không thể chia lô. Đọc từ replica để không ảnh hưởng primary, nhưng lưu ý query dài trên standby có thể bị huỷ khi primary VACUUM—và keyset lô ngắn là giải pháp. Đối chiếu theo ngày, dữ liệu đã đóng nên keyset theo lô vừa nhất quán vừa resume được; đó là lựa chọn mặc định của tôi."

  > Senior tip: tôi đặt mục tiêu "mỗi lô < 1 giây, checkpoint mỗi lô" và đo thời gian từng lô. Nếu thời gian lô tăng dần theo tiến độ, gần như chắc chắn còn OFFSET hoặc thiếu index cho khoá keyset ở đâu đó.`,
  follow: ['Nếu export cần một snapshot nhất quán tuyệt đối trên nhiều bảng, bạn dùng REPEATABLE READ hay pg_export_snapshot thế nào?', 'Chia 5 triệu dòng cho 4 worker song song bằng keyset thế nào?', 'Khi nào nên dùng COPY TO STDOUT thay vì đọc qua JDBC ResultSet?'],
  tags: ['export', 'keyset pagination', 'OFFSET', 'fetchSize', 'ScrollableResults', 'checkpoint', 'read replica'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: LIMIT and OFFSET', url: 'https://www.postgresql.org/docs/current/queries-limit.html' },
    { type: 'doc', title: 'PostgreSQL: Hot Standby', url: 'https://www.postgresql.org/docs/current/hot-standby.html' },
    { type: 'doc', title: 'PgJDBC: Issuing a Query and Processing the Result', url: 'https://jdbc.postgresql.org/documentation/query/' },
    { type: 'article', title: 'ZemIT: Export 5 triệu dòng mà không giết hệ thống', url: 'https://zemit.substack.com/p/export-5-trieu-dong-ma-khong-giet' }
  ]
},
{
  id: 'jpa-030',
  topic: 'jpa',
  level: 'senior',
  q: 'Batch insert 100 nghìn dòng với Hibernate: cấu hình hibernate.jdbc.batch_size thế nào, vì sao dùng IDENTITY làm chiến lược sinh ID thì batching bị tắt, và pooled optimizer giải quyết gì?',
  a: `**Tóm tắt:** Bật {{hibernate.jdbc.batch_size}} (20–50) cùng {{order_inserts}}/{{order_updates}}, xử lý theo lô với {{flush()}} + {{clear()}}, và bật chế độ rewrite batch của JDBC driver. Điều kiện tiên quyết: ID phải biết **trước** khi INSERT. Với {{GenerationType.IDENTITY}}, ID do database sinh lúc INSERT, nên Hibernate phải chạy từng INSERT ngay khi {{persist()}} để lấy ID, và batching insert bị tắt. Dùng {{SEQUENCE}} với {{allocationSize}} lớn (pooled optimizer) thì Hibernate lấy một khối ID bằng một lần gọi sequence và gom insert được.

### Vì sao batching quan trọng
Mặc định mỗi entity là một câu INSERT và một round-trip tới DB. 100.000 dòng với round-trip 0,5 ms đã tốn 50 giây chỉ để chờ mạng. Batching gom N câu cùng dạng vào một lần {{executeBatch()}}; driver PostgreSQL với {{reWriteBatchedInserts=true}} (MySQL: {{rewriteBatchedStatements=true}}) còn gộp thành một câu INSERT nhiều VALUES.

### Cấu hình
~~~yaml
spring:
  jpa:
    properties:
      hibernate.jdbc.batch_size: 50
      hibernate.order_inserts: true     # gom INSERT cùng bảng đứng liền nhau
      hibernate.order_updates: true
  datasource:
    url: jdbc:postgresql://db:5432/app?reWriteBatchedInserts=true
~~~
~~~java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq")
@SequenceGenerator(name = "user_seq", sequenceName = "user_seq", allocationSize = 50)
private Long id;   // DB: CREATE SEQUENCE user_seq INCREMENT BY 50 (phải khớp allocationSize)

@Transactional
public void importUsers(List<UserRow> rows) {
    for (int i = 0; i < rows.size(); i++) {
        em.persist(toEntity(rows.get(i)));
        if (i % 1000 == 999) { em.flush(); em.clear(); }   // giữ persistence context nhỏ
    }
}
~~~

### Vì sao IDENTITY tắt batching
Sau {{persist()}}, entity phải có ID (để vào persistence context, để entity khác tham chiếu). Với IDENTITY, cách duy nhất có ID là chạy INSERT và đọc giá trị DB trả về, nên Hibernate thực thi INSERT ngay, từng câu một. Đây là giới hạn của cơ chế sinh ID, không phải của cấu hình batch.

### pooled và pooled-lo
Với {{allocationSize = 50}}, mỗi lần gọi {{nextval}} Hibernate có 50 ID để dùng trong bộ nhớ. Hai optimizer khác nhau ở cách hiểu giá trị sequence trả về: **pooled** coi đó là đầu trên của khối, **pooled-lo** coi đó là đầu dưới. Cả hai đều cho phép hệ thống khác cùng gọi {{nextval}} trên sequence đó mà không sinh ID trùng (khác với thuật toán hi/lo cũ). Điều quan trọng thực tế là increment của sequence trong DB phải khớp {{allocationSize}}, nếu không ID sẽ trùng hoặc nhảy cóc.

### Ví dụ đời thực
Job import 100.000 khách hàng chạy 52 giây và heap tăng dần tới gần 1 GB. Nguyên nhân: entity dùng IDENTITY (không batch được) và không clear persistence context. Đổi sang SEQUENCE với allocationSize 50 (migration tạo sequence {{INCREMENT BY 50}} và đặt giá trị bắt đầu lớn hơn ID hiện có), bật batch_size 50, reWriteBatchedInserts và flush/clear mỗi 1.000 dòng: job còn 4,2 giây, heap ổn định khoảng 120 MB. Hibernate statistics xác nhận 2.000 batch thay vì 100.000 statement.

### Trả lời mẫu khi phỏng vấn
"Để batch insert nhanh tôi bật hibernate.jdbc.batch_size khoảng 50, order_inserts để các INSERT cùng bảng đứng liền nhau, bật rewrite batch của driver, và xử lý theo lô với flush rồi clear để persistence context không phình to. Điều kiện bắt buộc là Hibernate phải biết ID trước khi INSERT. Với IDENTITY, ID chỉ có sau khi DB chạy INSERT, nên Hibernate phải chạy từng câu ngay lúc persist và batching bị tắt. Tôi dùng SEQUENCE với allocationSize 50, khi đó pooled optimizer lấy một khối 50 ID bằng một lần gọi sequence, vừa gom được INSERT vừa ít round-trip. Nhớ cho increment của sequence trong DB khớp allocationSize. Cuối cùng tôi kiểm chứng bằng Hibernate statistics: số batch phải xấp xỉ số dòng chia batch size."

> Senior tip: đừng tin cấu hình, hãy đo: bật {{hibernate.generate_statistics}} hoặc datasource-proxy trong test và assert số statement. Lỗi hay gặp nhất là batch "đã bật" nhưng vẫn một statement mỗi entity vì một entity cha dùng IDENTITY, hoặc vì code gọi query giữa vòng lặp làm Hibernate flush sớm.`,
  follow: ['Vì sao phải flush và clear persistence context khi import hàng triệu dòng?', 'Bạn kiểm chứng batching thật sự hoạt động bằng cách nào?', 'allocationSize lệch với increment của sequence trong DB thì chuyện gì xảy ra?'],
  tags: ['jpa', 'batch', 'hibernate', 'IDENTITY', 'sequence', 'pooled optimizer'],
},
{
  id: 'jpa-031',
  topic: 'jpa',
  level: 'senior',
  q: 'Second-level cache và query cache trong Hibernate 6: khi nào bật, khi nào gây hại, và invalidation hoạt động thế nào?',
  a: `**Tóm tắt:** First-level cache là persistence context của từng Session. Second-level cache (L2) dùng chung giữa các Session, lưu dữ liệu entity theo ID; query cache lưu kết quả query (danh sách ID) và vô hiệu theo timestamp của bảng. Bật L2 cho dữ liệu **đọc nhiều, ghi ít, chấp nhận được độ trễ cập nhật** (danh mục, cấu hình). Tránh với dữ liệu ghi thường xuyên, dữ liệu bị sửa ngoài Hibernate, hoặc khi chạy nhiều node mà không có cơ chế invalidation đáng tin.

### Ba tầng cache
| Tầng | Phạm vi | Lưu gì |
|---|---|---|
| L1 (persistence context) | Một Session/transaction | Object entity, luôn bật |
| L2 | Toàn SessionFactory (một JVM, hoặc phân tán tuỳ provider) | Dữ liệu entity đã "tháo rời" theo ID, collection |
| Query cache | Toàn SessionFactory | Kết quả query (ID), cần L2 cho entity tương ứng mới có lợi |

### Invalidation hoạt động thế nào
- Update/delete entity qua Hibernate: cập nhật hoặc vô hiệu entry tương ứng trong L2 theo chiến lược ({{READ_WRITE}} dùng soft lock trong lúc transaction chưa commit).
- Query cache: mỗi bảng có một timestamp "lần ghi cuối". Bất kỳ ghi nào vào bảng qua Hibernate làm **mọi** kết quả query cache liên quan bảng đó hết hạn. Bảng ghi thường xuyên thì query cache gần như luôn miss.
- Bulk JPQL/HQL ({{UPDATE}}/{{DELETE}}): Hibernate evict **toàn bộ region** của entity bị ảnh hưởng. Native SQL chạy qua Hibernate mà không khai báo bảng bị ảnh hưởng ({{addSynchronizedEntityClass}}) thì Hibernate evict toàn bộ L2 cho an toàn.
- Ghi từ ứng dụng khác, script SQL tay, hoặc service khác cùng DB: Hibernate **không biết**, cache stale tới khi hết hạn.

### Cấu hình tối thiểu
~~~yaml
spring.jpa.properties.hibernate.cache.use_second_level_cache: true
spring.jpa.properties.hibernate.cache.region.factory_class: jcache   # JCache, provider ví dụ Caffeine/Ehcache
~~~
~~~java
@Entity
@Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Country { ... }

// Query cache: bật hibernate.cache.use_query_cache rồi đánh dấu từng query
@QueryHints(@QueryHint(name = "org.hibernate.cacheable", value = "true"))
List<Country> findByRegion(String region);
~~~

### Chọn chiến lược
- {{READ_ONLY}}: dữ liệu không bao giờ sửa, nhanh nhất.
- {{NONSTRICT_READ_WRITE}}: chấp nhận đọc dữ liệu cũ trong khoảnh khắc ngắn, ghi hiếm.
- {{READ_WRITE}}: an toàn với cập nhật đồng thời nhờ soft lock, tốn hơn.
- Nhiều node: cache local (Caffeine) mỗi node có bản riêng, update ở node A không làm hết hạn ở node B; cần provider phân tán/có invalidation (Infinispan, Hazelcast, Redis qua Redisson) hoặc chấp nhận TTL ngắn.

### Ví dụ đời thực
Bảng Country 250 dòng, đọc 50.000 lần/phút, sửa một lần mỗi tuần: bật L2 {{READ_WRITE}} giảm 92% số query tới DB, p99 từ 8 ms xuống 2 ms. Cùng đợt, team bật query cache cho màn hình danh sách đơn hàng: bảng orders ghi hàng trăm lần mỗi phút nên hit ratio chỉ 3%, overhead làm p99 tăng 15 ms; tắt query cache, thay bằng index phù hợp. Một sự cố sau đó: job đối soát cập nhật giá trực tiếp bằng SQL tay, ứng dụng hiển thị giá cũ 30 phút vì L2 không biết thay đổi; giải pháp là job gọi API nội bộ để evict region sau khi chạy.

### Trả lời mẫu khi phỏng vấn
"First-level cache là persistence context của một Session, luôn có. Second-level cache dùng chung giữa các Session, tôi chỉ bật cho entity đọc nhiều ghi ít như danh mục, cấu hình. Hibernate tự cập nhật hoặc vô hiệu L2 khi ghi qua Hibernate, kể cả bulk HQL thì nó evict cả region; nhưng nếu dữ liệu bị sửa bằng SQL tay hay ứng dụng khác thì Hibernate không biết và cache bị cũ. Query cache lưu danh sách ID và hết hạn mỗi khi bảng liên quan có ghi, nên bảng ghi thường xuyên thì gần như vô dụng. Khi chạy nhiều node tôi cân nhắc invalidation giữa các node hoặc TTL ngắn. Tôi luôn bật statistics để đo hit ratio trước khi giữ một cache."

> Senior tip: mỗi region cache phải trả lời được ba câu: ai làm nó hết hạn, dữ liệu cũ tối đa bao lâu thì chấp nhận được, và hit ratio đo ở đâu. Không trả lời được thì chưa nên bật. Và đừng dùng cache để che một query thiếu index.`,
  follow: ['Bulk HQL và native SQL ảnh hưởng second-level cache thế nào?', 'Cache local (Caffeine) và cache phân tán khác nhau ra sao khi chạy nhiều node?', 'Vì sao query cache gần như vô dụng với bảng ghi thường xuyên?'],
  tags: ['jpa', 'second-level cache', 'query cache', 'invalidation', 'Hibernate 6'],
},
{
  id: 'jpa-032',
  topic: 'jpa',
  level: 'senior',
  q: 'Bulk update/delete bằng JPQL: vì sao bỏ qua persistence context, và rủi ro dữ liệu cũ (stale) xảy ra thế nào?',
  a: `**Tóm tắt:** {{UPDATE}}/{{DELETE}} bằng JPQL (bulk operation) chạy thẳng một câu SQL trên database: không load entity, không chạy callback {{@PreUpdate}}/{{@PreRemove}}, không cascade, không tự tăng {{@Version}}. Quan trọng nhất: **persistence context hiện tại không được cập nhật**, các entity đã load trước đó vẫn mang giá trị cũ và có thể ghi đè ngược kết quả bulk khi flush. Cách dùng an toàn: chạy bulk ở đầu transaction hoặc {{clear()}} persistence context ngay sau đó (Spring Data: {{@Modifying(clearAutomatically = true, flushAutomatically = true)}}).

### Bulk khác cập nhật từng entity ở đâu
| | Load rồi set từng entity | Bulk JPQL |
|---|---|---|
| Số câu SQL | Một SELECT + N UPDATE | Một UPDATE |
| Callback, Envers, listener | Có | Không |
| Cascade, orphanRemoval | Có | Không |
| {{@Version}} | Tự kiểm tra và tăng | Không, trừ khi tự viết {{SET version = version + 1}} |
| Persistence context | Luôn đúng | **Không được cập nhật** |
| L2 cache | Cập nhật theo entity | Hibernate evict cả region của entity đó |

### Rủi ro stale trong cùng transaction
~~~java
@Transactional
public void expireAndTouch(Long orderId, Instant cutoff) {
    Order o = em.find(Order.class, orderId);          // status = PENDING, nằm trong persistence context
    em.createQuery("UPDATE Order o SET o.status = :s WHERE o.createdAt < :c")
      .setParameter("s", Status.EXPIRED)
      .setParameter("c", cutoff)
      .executeUpdate();                                // DB: EXPIRED; object o vẫn PENDING
    o.setNote("checked");                              // dirty -> flush ghi lại cả status = PENDING!
}
~~~
Hibernate mặc định cập nhật mọi cột của entity bị dirty, nên câu UPDATE khi flush ghi lại status cũ: kết quả bulk bị mất mà không có lỗi nào.

### Cách dùng an toàn
1. Chạy bulk trước khi load entity liên quan, hoặc trong transaction riêng.
2. {{em.flush()}} trước bulk (đẩy thay đổi đang chờ xuống DB), {{em.clear()}} sau bulk (bỏ object cũ). Trong Spring Data dùng {{@Modifying(flushAutomatically = true, clearAutomatically = true)}}.
3. Cần optimistic lock: tự thêm {{version = version + 1}} vào SET (Hibernate có cú pháp {{UPDATE VERSIONED}} cho HQL).
4. Cần callback/audit: hoặc cập nhật từng entity theo lô, hoặc ghi audit bằng chính câu SQL/trigger.

### Ví dụ đời thực
Job hết hạn đơn chờ thanh toán dùng {{@Modifying}} bulk update sang EXPIRED, rồi trong cùng transaction duyệt danh sách đơn đã load trước đó để gửi thông báo và gắn ghi chú. Khoảng 0,5% đơn "sống lại" thành PENDING vì flush ghi đè. Ngoài ra, bảng lịch sử trạng thái (ghi bằng {{@PreUpdate}} listener) không có dòng nào cho các đơn hết hạn, gây khó đối soát. Sửa: bulk chạy trong transaction riêng với clearAutomatically, sau đó transaction thứ hai đọc lại và gửi thông báo; lịch sử trạng thái ghi bằng câu {{INSERT ... SELECT}} trong cùng transaction bulk.

### Trả lời mẫu khi phỏng vấn
"Bulk update hay delete bằng JPQL chạy thẳng một câu SQL, nên rất nhanh nhưng bỏ qua toàn bộ cơ chế của persistence context: không callback, không cascade, không tăng version. Nguy hiểm nhất là các entity đã load trước đó trong cùng transaction vẫn giữ giá trị cũ, và nếu chúng bị sửa rồi flush thì có thể ghi đè ngược kết quả bulk. Tôi luôn flush trước và clear sau bulk, trong Spring Data là Modifying với flushAutomatically và clearAutomatically, hoặc tách bulk ra transaction riêng. Nếu cần version thì tự tăng trong câu SET, cần audit thì ghi bằng SQL trong cùng transaction. Về L2 cache, Hibernate tự evict region khi chạy bulk HQL, nhưng native SQL thì nên khai báo bảng bị ảnh hưởng."

> Senior tip: coi bulk JPQL như SQL thuần có kiểm tra kiểu. Quy tắc review của tôi: mọi {{@Modifying}} phải có {{clearAutomatically = true}} trừ khi có lý do ghi rõ trong comment, và phải có test đọc lại entity sau bulk trong cùng transaction.`,
  follow: ['Vì sao nên dùng @Modifying(clearAutomatically = true) trong Spring Data?', 'Làm sao kết hợp bulk update với optimistic lock?', 'Bulk delete không cascade thì bạn xử lý bảng con thế nào?'],
  tags: ['jpa', 'bulk update', 'bulk delete', 'persistence context', 'stale', 'Hibernate 6'],
},
{
  id: 'jpa-033',
  topic: 'jpa',
  level: 'mid',
  q: 'DTO projection trong Spring Data JPA: interface projection, record/constructor projection và Tuple khác nhau thế nào, khi nào chọn cái nào?',
  a: `**Tóm tắt:** Spring Data JPA có ba cách trả về dữ liệu dạng "chỉ đọc vài cột": **interface projection** (Spring tạo proxy, dễ viết, hỗ trợ lồng nhau), **class/record projection** (gọi constructor, kiểu rõ ràng, nhẹ nhất), và **Tuple** (truy cập theo alias, linh hoạt nhưng không an toàn kiểu). Mặc định tôi dùng record cho response API; interface khi cần view lồng nhau đơn giản; Tuple cho query động hiếm gặp. Cẩn thận với **open projection** (interface có {{@Value}} SpEL): Spring phải load cả entity, mất lợi ích chỉ chọn cột.

### Ba loại
~~~java
// 1) Interface projection (closed): Spring sinh SELECT chỉ cột cần
public interface OrderSummary {
    Long getId();
    BigDecimal getTotal();
    CustomerView getCustomer();          // lồng nhau
    interface CustomerView { String getName(); }
}
List<OrderSummary> findByStatus(Status status);

// 2) Record/class projection: constructor expression
public record OrderRow(Long id, BigDecimal total, String customerName) {}
@Query("select new com.shop.OrderRow(o.id, o.total, c.name) from Order o join o.customer c where o.status = :s")
List<OrderRow> findRows(@Param("s") Status s);

// 3) Tuple: linh hoạt, phải đọc theo alias
@Query("select o.id as id, sum(i.price) as amount from Order o join o.items i group by o.id")
List<Tuple> totals();
~~~
Spring Data còn hỗ trợ derived query trả record trực tiếp ({{List<OrderRow> findByStatus(Status s)}}), với điều kiện tên tham số constructor khớp tên thuộc tính của entity.

### So sánh
| Tiêu chí | Interface (closed) | Record/class | Tuple |
|---|---|---|---|
| Chỉ chọn cột cần | Có | Có | Có |
| An toàn kiểu | Tốt | Tốt | Kém (cast theo alias) |
| Lồng nhau | Có | Phải tự join và phẳng hoá | Tự xử lý |
| Overhead | Proxy, nhỏ | Thấp nhất | Thấp |
| Dùng tốt cho | View nội bộ, lồng đơn giản | Response API, báo cáo | Query động, ad-hoc |

### Bẫy hay gặp
- **Open projection**: interface có getter gắn {{@Value}} với biểu thức SpEL dựa trên {{target}} (ví dụ ghép firstName và lastName) làm Spring load toàn bộ entity rồi tính, không còn là "chỉ chọn cột".
- **Projection lồng collection** ({{List<ItemView> getItems()}}): có thể sinh thêm query hoặc join nhân bản dòng; với to-many nên tách query.
- **Constructor expression** phải dùng tên class đầy đủ và thứ tự, kiểu tham số khớp đúng select.
- Projection không phải entity: không có dirty checking, không lazy loading, sửa object không lưu gì xuống DB (đó chính là ưu điểm).

### Ví dụ đời thực
API danh sách đơn hàng trả entity {{Order}} cho Jackson: mỗi request load 50 đơn kèm customer, items (lazy) và address; tổng cộng 151 query, payload 380 KB vì lộ cả trường nội bộ. Đổi sang record projection với một câu join chỉ lấy 6 cột cần hiển thị: 1 query, payload 22 KB, p99 từ 620 ms xuống 45 ms. Một màn hình admin vẫn dùng interface projection lồng {{CustomerView}} vì tiện và chỉ có quan hệ to-one.

### Trả lời mẫu khi phỏng vấn
"Với màn hình chỉ đọc, tôi không trả entity mà dùng projection để chỉ lấy cột cần. Spring Data có ba kiểu: interface projection, Spring tạo proxy và sinh câu select chỉ các cột trong getter, hỗ trợ lồng nhau; record hoặc class projection qua constructor expression, kiểu rõ ràng và nhẹ nhất; và Tuple khi query động, đổi lại phải đọc theo alias, không an toàn kiểu. Mặc định tôi dùng record cho response API. Bẫy cần tránh là open projection với SpEL, vì Spring phải load cả entity, và projection lồng collection to-many có thể sinh thêm query. Lợi ích đo được rất rõ: ít query, ít cột, không dirty checking, payload nhỏ hơn."

> Senior tip: quy ước cho team: entity chỉ dùng trong luồng ghi; mọi luồng đọc trả về API dùng record projection, có test assert số query. Quy ước đơn giản này loại bỏ phần lớn N+1, LazyInitializationException và rò rỉ trường nội bộ ra JSON.`,
  follow: ['Open projection khác closed projection thế nào và vì sao nó làm mất lợi ích?', 'Khi nào dùng projection, khi nào dùng @EntityGraph?', 'Dynamic projection (truyền Class<T>) dùng khi nào?'],
  tags: ['jpa', 'projection', 'DTO', 'record', 'interface projection', 'Tuple'],
},
{
  id: 'jpa-034',
  topic: 'jpa',
  level: 'senior',
  q: 'Optimistic lock với @Version trong JPA: retry an toàn thế nào khi gặp ObjectOptimisticLockingFailureException?',
  a: `**Tóm tắt:** {{@Version}} biến mỗi câu UPDATE thành "chỉ cập nhật nếu version chưa đổi"; khi người khác đã commit trước, UPDATE ảnh hưởng 0 dòng và Spring ném {{ObjectOptimisticLockingFailureException}}. Retry đúng nghĩa là **chạy lại cả use case trong một transaction mới**: đọc lại dữ liệu mới nhất, áp dụng lại ý định ban đầu của người dùng (không phải ghi lại object cũ), giới hạn số lần thử, có backoff. Lớp retry phải nằm **ngoài** transaction; side effect (gửi email, gọi API thanh toán) không được nằm trong phần được retry trừ khi idempotent.

### Cơ chế
~~~sql
-- Hibernate sinh câu này khi flush entity có @Version
UPDATE orders SET status = ?, version = 8 WHERE id = ? AND version = 7
-- 0 dòng bị ảnh hưởng => có người đã commit version 8 trước => ném exception
~~~
Không có khoá nào được giữ khi đọc; xung đột chỉ được phát hiện lúc flush/commit, và transaction hiện tại bị rollback toàn bộ.

### Đặt retry ở đâu
~~~java
@Service
class OrderFacade {                                  // lớp ngoài: retry, KHÔNG có @Transactional
    private final OrderService orderService;
    OrderFacade(OrderService orderService) { this.orderService = orderService; }

    @Retryable(retryFor = ObjectOptimisticLockingFailureException.class,
               maxAttempts = 3, backoff = @Backoff(delay = 50, multiplier = 2, random = true))
    public void changeStatus(long id, Status target) {
        orderService.changeStatus(id, target);        // mỗi lần thử là một transaction mới
    }
}

@Service
class OrderService {
    @Transactional
    public void changeStatus(long id, Status target) {
        Order o = repo.findById(id).orElseThrow();   // đọc lại version mới nhất
        o.transitionTo(target);                       // áp lại ý định, có kiểm tra luật chuyển trạng thái
    }
}
~~~
Tách hai bean bảo đảm thứ tự proxy: retry bọc bên ngoài transaction. Đặt {{@Retryable}} và {{@Transactional}} trên cùng một method phụ thuộc thứ tự advice, dễ thành retry bên trong transaction đã bị đánh dấu rollback. (Spring Retry cần {{@EnableRetry}}; từ Spring Framework 7 có sẵn {{@Retryable}} trong core.)

### Khi nào không retry tự động
- Người dùng sửa form dựa trên dữ liệu cũ (sửa giá, sửa địa chỉ): trả **409 Conflict** kèm dữ liệu mới để họ quyết định; retry tự động sẽ ghi đè lên thay đổi của người khác.
- Thay đổi tương đối (trừ kho 1, cộng điểm) thì retry an toàn vì áp lại trên giá trị mới.
- Conflict rate cao trên một dòng nóng (số dư ví, tồn kho flash sale): retry sinh livelock; dùng câu UPDATE nguyên tử có điều kiện ({{SET stock = stock - 1 WHERE stock > 0}}), pessimistic lock ({{@Lock(PESSIMISTIC_WRITE)}} với lock timeout ngắn) hoặc xếp hàng theo key.

### Ví dụ đời thực
Màn hình xử lý đơn: hai nhân viên cùng mở đơn và bấm "Xác nhận" và "Huỷ" gần như cùng lúc. Trước khi có {{@Version}}, đơn bị huỷ nhưng kho vẫn xuất hàng (lost update). Sau khi thêm version, một trong hai nhận lỗi 500. Bước tiếp theo: retry tự động 3 lần cho thao tác hệ thống (job đồng bộ trạng thái vận chuyển), còn thao tác của người dùng trả 409 kèm trạng thái hiện tại. Metric: tỉ lệ conflict 0,3% tổng số update, 99,7% retry thành công ở lần thứ hai.

### Trả lời mẫu khi phỏng vấn
"Với @Version, câu UPDATE có điều kiện where version bằng giá trị đã đọc; nếu ai đó đã commit trước thì không dòng nào được cập nhật và Spring ném ObjectOptimisticLockingFailureException, transaction hiện tại rollback. Retry đúng là chạy lại cả use case trong transaction mới: đọc lại bản mới nhất rồi áp lại ý định của người dùng, không phải ghi lại object cũ. Tôi đặt retry ở một bean bọc bên ngoài service có Transactional, giới hạn khoảng ba lần với backoff ngẫu nhiên, và không để side effect như gửi email hay gọi thanh toán nằm trong phần retry. Với chỉnh sửa do người dùng thực hiện trên dữ liệu cũ, tôi không retry mà trả 409 để họ xem lại. Nếu một dòng bị tranh chấp liên tục, tôi chuyển sang update nguyên tử có điều kiện hoặc pessimistic lock."

> Senior tip: theo dõi số lần {{ObjectOptimisticLockingFailureException}} theo entity và theo endpoint. Tỉ lệ dưới 1% là optimistic lock đang làm đúng việc; tỉ lệ tăng dần theo tải là dấu hiệu có dòng nóng, cần đổi thiết kế chứ không phải tăng số lần retry.`,
  follow: ['Vì sao retry phải nằm ngoài transaction?', 'Khi nào nên trả 409 cho người dùng thay vì tự retry?', 'Dòng bị tranh chấp liên tục thì bạn đổi thiết kế thế nào?'],
  tags: ['jpa', 'optimistic lock', '@Version', 'retry', 'idempotency'],
},
{
  id: 'jpa-035',
  topic: 'jpa',
  level: 'senior',
  q: 'Soft delete trong Hibernate 6 (@SoftDelete, @SQLDelete + @SQLRestriction): thiết kế thế nào và có những pitfall gì?',
  a: `**Tóm tắt:** Soft delete là đánh dấu dòng "đã xoá" thay vì xoá vật lý, để khôi phục hoặc giữ lịch sử. Hibernate có {{@SoftDelete}} từ **6.4**: {{remove()}} thành UPDATE và mọi query tự lọc dòng đã xoá; mặc định dùng cột boolean {{deleted}}, còn chiến lược lưu thời điểm xoá ({{SoftDeleteType.TIMESTAMP}}) có từ Hibernate 7. Trước đó dùng {{@SQLDelete}} + {{@SQLRestriction}} (tên mới của {{@Where}} từ 6.3). Phần khó không nằm ở annotation mà ở **ràng buộc unique, khoá ngoại, báo cáo và dữ liệu cá nhân**.

### Hai cách cài đặt
~~~java
// Hibernate 6.4+: cột boolean "deleted"
@Entity
@SoftDelete
public class Customer { @Id Long id; String email; }

// Cách tự viết, chạy được ở mọi bản 6.x, lưu thời điểm xoá
@Entity
@SQLDelete(sql = "UPDATE customer SET deleted_at = now() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class Customer { @Id Long id; String email; Instant deletedAt; }
~~~
Cả hai đều chỉ áp dụng cho truy cập qua Hibernate. Native query, view báo cáo, ETL đọc thẳng DB phải tự thêm điều kiện lọc.

### Pitfall và cách xử lý
| Vấn đề | Hậu quả | Cách xử lý |
|---|---|---|
| Unique email | Khách đã xoá không đăng ký lại được | PostgreSQL partial unique index: {{CREATE UNIQUE INDEX ... ON customer(email) WHERE deleted_at IS NULL}} |
| Khoá ngoại | Đơn hàng vẫn trỏ tới khách "đã xoá"; FK không báo lỗi vì dòng còn tồn tại | Quyết định nghiệp vụ: chặn xoá khi còn đơn mở, hoặc soft delete theo dây chuyền |
| Quan hệ lazy | Load đơn hàng rồi gọi {{getCustomer()}} có thể ném lỗi hoặc trả null vì dòng bị lọc | Thiết kế rõ khi nào được nhìn thấy dữ liệu đã xoá |
| Màn hình admin, báo cáo | Cần xem cả dòng đã xoá | Query riêng (native/view) hoặc {{@Filter}} bật tắt được thay cho restriction cứng |
| Hiệu năng | Mọi query thêm điều kiện, bảng phình | Partial index trên dòng còn hiệu lực; archive dòng xoá lâu |
| Dữ liệu cá nhân | Soft delete **không** đáp ứng yêu cầu xoá dữ liệu cá nhân | Ẩn danh hoá hoặc xoá thật các cột PII, giữ khoá kỹ thuật |

### Ví dụ đời thực
Ứng dụng thương mại điện tử dùng {{@SQLRestriction("deleted = false")}} cho bảng customer. Ba tuần sau go-live, 2% khách đăng ký lại bằng email cũ bị lỗi "email đã tồn tại" vì unique index vẫn tính các dòng đã xoá; đồng thời báo cáo doanh thu (viết bằng SQL thuần) cộng cả đơn của khách đã xoá nên lệch với màn hình quản trị. Sửa: chuyển unique sang partial index, tạo view {{active_customer}} cho mọi báo cáo, thêm job ẩn danh hoá PII sau 30 ngày kể từ khi xoá.

### Trả lời mẫu khi phỏng vấn
"Soft delete đánh dấu dòng đã xoá thay vì xoá vật lý. Hibernate có annotation SoftDelete từ bản 6.4, remove biến thành update và query tự lọc; mặc định là cột boolean, còn lưu thời điểm xoá thì có từ Hibernate 7, trước đó tôi dùng SQLDelete kết hợp SQLRestriction. Phần khó là hệ quả: unique index phải chuyển thành partial index chỉ trên dòng còn hiệu lực, khoá ngoại không bảo vệ nữa nên phải quyết định chặn hay xoá theo dây chuyền, báo cáo và native query phải tự lọc, và soft delete không đáp ứng yêu cầu xoá dữ liệu cá nhân nên cần ẩn danh hoá hoặc xoá thật phần PII. Tôi luôn có partial index và một view chuẩn cho dữ liệu còn hiệu lực."

> Senior tip: trước khi bật soft delete cho một bảng, liệt kê mọi nơi đọc bảng đó ngoài Hibernate (báo cáo, ETL, service khác). Thường đó mới là nơi sinh bug, không phải code JPA.`,
  follow: ['Bạn cài đặt chức năng khôi phục (undo delete) trong 30 ngày thế nào?', 'Partial unique index giải quyết vấn đề gì?', 'Soft delete có đáp ứng yêu cầu xoá dữ liệu cá nhân không?'],
  tags: ['jpa', 'soft delete', '@SoftDelete', '@SQLRestriction', 'Hibernate 6'],
},
{
  id: 'jpa-036',
  topic: 'jpa',
  level: 'lead',
  q: 'Multitenancy trong Hibernate: database riêng, schema riêng hay cột tenant_id (discriminator)? So sánh và khi nào chọn cách nào?',
  a: `**Tóm tắt:** Có ba mức tách tenant: **database riêng**, **schema riêng** trong cùng database, và **chung bảng có cột {{tenant_id}}** (discriminator). Tách càng mạnh thì cô lập dữ liệu, backup/restore theo tenant và tuân thủ càng dễ, nhưng chi phí vận hành (migration, connection pool) tăng theo số tenant. Discriminator rẻ và scale tới hàng nghìn tenant, đổi lại rủi ro lớn nhất là **quên lọc tenant và lộ dữ liệu**, nên phải có lớp bảo vệ: {{@TenantId}} của Hibernate 6 và Row-Level Security của PostgreSQL.

### So sánh
| Tiêu chí | Database riêng | Schema riêng | Cột tenant_id |
|---|---|---|---|
| Cô lập dữ liệu | Mạnh nhất | Mạnh | Chỉ ở tầng ứng dụng (+ RLS) |
| Backup/restore một tenant | Dễ | Khá dễ | Khó (phải lọc) |
| Migration | Chạy N lần | Chạy N lần | Một lần |
| Connection pool | Mỗi tenant một pool | Chung pool, đổi {{search_path}} mỗi lần lấy connection | Chung pool |
| Số tenant hợp lý | Vài chục | Vài trăm | Hàng nghìn trở lên |
| Tenant "ồn ào" ảnh hưởng tenant khác | Không | Có (chung DB) | Có |

### Cài đặt trong Hibernate 6
- **Schema/database riêng:** cài {{CurrentTenantIdentifierResolver}} (lấy tenant từ request) và {{MultiTenantConnectionProvider}} (trả connection đúng DB hoặc đặt {{search_path}}/schema trước khi dùng, nhớ reset khi trả về pool).
- **Discriminator:** đánh dấu cột bằng {{@TenantId}}; Hibernate tự gán tenant khi insert và tự thêm điều kiện vào mọi query JPQL/HQL.
~~~java
@Entity
public class Invoice {
    @Id Long id;
    @TenantId String tenantId;   // Hibernate 6: tự gán và tự lọc theo tenant hiện tại
    BigDecimal amount;
}
~~~
- **Lớp bảo vệ thứ hai** (bắt buộc với discriminator): PostgreSQL RLS với policy {{USING (tenant_id = current_setting('app.tenant_id'))}}, ứng dụng {{SET LOCAL app.tenant_id}} đầu mỗi transaction. Native query, báo cáo, script tay quên lọc vẫn bị DB chặn.

### Pitfall
- Native query, JdbcTemplate, view báo cáo không đi qua {{@TenantId}}: nguồn lộ dữ liệu số một.
- Cache (L2, Redis) dùng key không có tenant: tenant A đọc dữ liệu của tenant B.
- Job nền chạy không có tenant context: hoặc lỗi, hoặc chạy trên tenant mặc định.
- Index phải bắt đầu bằng {{tenant_id}} để mọi query lọc tenant dùng được index.
- Schema riêng: một tenant migration lỗi làm cả đợt deploy dở dang; cần chạy migration theo tenant có theo dõi và chạy lại được.

### Ví dụ đời thực
SaaS kế toán 1.200 tenant nhỏ dùng discriminator. Một developer viết báo cáo bằng native query quên điều kiện tenant, và một khách hàng thấy hoá đơn của công ty khác trên môi trường staging với dữ liệu thật đã ẩn danh. Team thêm PostgreSQL RLS cho mọi bảng nghiệp vụ, kiểm thử tự động gọi mọi endpoint với tenant A và assert không có dữ liệu tenant B. Ba khách hàng doanh nghiệp lớn yêu cầu cô lập theo hợp đồng được tách sang database riêng, dùng cùng code qua {{MultiTenantConnectionProvider}}.

### Trả lời mẫu khi phỏng vấn
"Tôi chọn mức tách tenant theo số lượng tenant và yêu cầu cô lập. Database hoặc schema riêng cho cô lập mạnh, backup và restore theo tenant dễ, nhưng migration phải chạy cho từng tenant và connection pool phức tạp, hợp với vài chục tới vài trăm tenant hoặc khách doanh nghiệp có yêu cầu hợp đồng. Chung bảng với cột tenant_id rẻ và scale tới hàng nghìn tenant, Hibernate 6 có TenantId tự gán và tự lọc, nhưng rủi ro là native query hay báo cáo quên lọc. Vì vậy tôi luôn thêm Row-Level Security của PostgreSQL làm lớp bảo vệ thứ hai, đưa tenant vào mọi cache key, và có test tự động kiểm tra không lộ chéo dữ liệu. Thực tế hay kết hợp: đa số tenant dùng chung, vài khách lớn tách database riêng."

> Senior tip: lộ dữ liệu giữa tenant là sự cố mất khách hàng, không phải bug thường. Hãy thiết kế để lỗi của một developer (quên một điều kiện WHERE) không đủ gây sự cố: tức là luôn có lớp bảo vệ ở database.`,
  follow: ['@TenantId của Hibernate 6 hoạt động thế nào và không bảo vệ được chỗ nào?', 'PostgreSQL Row-Level Security kết hợp với JPA ra sao?', 'Bạn chạy migration cho hàng trăm schema tenant thế nào?'],
  tags: ['jpa', 'multitenancy', 'schema-per-tenant', 'discriminator', 'Hibernate 6', 'lead'],
},
{
  id: 'jpa-037',
  topic: 'jpa',
  level: 'lead',
  q: '(Lead) Khi nào nên bổ sung hoặc thay JPA/Hibernate bằng jOOQ hay JdbcTemplate? Tiêu chí quyết định là gì?',
  a: `**Tóm tắt:** Không cần "bỏ" JPA mà dùng **đúng công cụ cho từng loại việc** trong cùng ứng dụng. JPA/Hibernate mạnh ở luồng ghi theo aggregate: dirty checking, cascade, optimistic lock, quan hệ. jOOQ (SQL an toàn kiểu, sinh code từ schema) hoặc JdbcTemplate mạnh ở luồng đọc phức tạp: báo cáo, window function, CTE, bulk/ETL, nơi bạn cần kiểm soát chính xác câu SQL. Khi trộn, phải dùng chung **một transaction manager** ({{JpaTransactionManager}}, vốn chia sẻ connection JDBC cho JdbcTemplate/jOOQ cùng DataSource) và nhớ **flush** trước khi đọc bằng JDBC.

### Tiêu chí quyết định
| Tình huống | Công cụ hợp |
|---|---|
| CRUD theo aggregate, luật nghiệp vụ khi ghi, optimistic lock | JPA |
| Báo cáo, tổng hợp, window function, CTE, LATERAL | jOOQ hoặc SQL thuần |
| Bulk insert/update hàng triệu dòng, ETL | JDBC batch, COPY, jOOQ batch |
| Query động nhiều điều kiện, cần an toàn kiểu | jOOQ (hoặc Criteria/Querydsl nếu đã dùng JPA) |
| Truy vấn đơn giản, ít dependency | JdbcTemplate/JdbcClient (Spring 6.1+) |

Dấu hiệu nên bổ sung công cụ khác: JPQL không diễn đạt được, phải viết native query dài trong annotation; persistence context phình to vì load entity chỉ để đọc; team mất nhiều thời gian "dỗ" Hibernate sinh đúng SQL hơn là viết SQL.

### jOOQ và JdbcTemplate
- **jOOQ**: sinh class từ schema thật, query viết bằng DSL được compiler kiểm tra (đổi tên cột là lỗi biên dịch). Bản mã nguồn mở dùng cho database mã nguồn mở (PostgreSQL, MySQL); Oracle, SQL Server cần giấy phép thương mại.
- **JdbcTemplate/JdbcClient**: không sinh code, tự viết SQL và map kết quả; đơn giản, phù hợp số lượng query ít.

### Trộn trong cùng transaction
~~~java
@Transactional                                       // JpaTransactionManager quản lý
public BigDecimal closeMonth(long accountId) {
    Account acc = accountRepo.findById(accountId).orElseThrow();
    acc.lock();                                      // thay đổi đang nằm trong persistence context
    entityManager.flush();                           // đẩy xuống DB trước khi đọc bằng jOOQ
    return dsl.select(sum(LEDGER.AMOUNT))            // jOOQ dùng cùng connection, cùng transaction
              .from(LEDGER).where(LEDGER.ACCOUNT_ID.eq(accountId))
              .fetchOne(0, BigDecimal.class);
}
~~~
- Ghi bằng JDBC/jOOQ thì persistence context **không biết**: entity đã load vẫn giữ giá trị cũ. Ghi bằng JDBC rồi đọc lại entity thì cần {{refresh()}} hoặc {{clear()}}.
- L2 cache của Hibernate cũng không biết thay đổi qua JDBC.
- Không map cùng một bảng vào hai mô hình ghi khác nhau; tách rõ: JPA cho ghi, jOOQ/JDBC cho đọc (CQRS nhẹ).

### Ví dụ đời thực
Hệ thống bảo hiểm có 40 báo cáo viết bằng native query trong {{@Query}}, mỗi lần đổi schema là vài báo cáo hỏng chỉ phát hiện lúc chạy. Team giữ JPA cho luồng hợp đồng, chuyển báo cáo sang jOOQ với code sinh từ schema trong pipeline CI: đổi tên cột làm build đỏ ngay. Báo cáo nặng nhất viết lại bằng window function chạy từ 14 giây còn 1,8 giây vì không còn load entity rồi tính trong Java. Một bug ban đầu: báo cáo trong cùng transaction không thấy dữ liệu vừa sửa, sửa bằng {{flush()}} trước khi gọi jOOQ.

### Trả lời mẫu khi phỏng vấn
"Tôi không coi đây là chuyện bỏ JPA mà là chọn công cụ theo loại việc. JPA mạnh ở luồng ghi theo aggregate, với dirty checking, cascade, optimistic lock. Với báo cáo, window function, CTE hay bulk ETL, tôi dùng jOOQ vì SQL được kiểm tra kiểu từ schema thật, hoặc JdbcTemplate nếu chỉ vài query đơn giản. Khi trộn trong một ứng dụng, tôi dùng JpaTransactionManager để JDBC và jOOQ chạy cùng connection và cùng transaction, nhớ flush persistence context trước khi đọc bằng JDBC, và hiểu rằng ghi bằng JDBC thì persistence context lẫn L2 cache không biết. Cách tách hay dùng là JPA cho luồng ghi, jOOQ cho luồng đọc."

> Senior tip: quyết định dựa trên chi phí bảo trì, không dựa trên sở thích. Đếm số native query dài trong {{@Query}} và số lần bug do Hibernate sinh SQL bất ngờ: khi con số đó lớn, bổ sung jOOQ cho phần đọc thường trả lại vốn trong vài tháng.`,
  follow: ['Làm sao chia sẻ transaction giữa JPA và jOOQ?', 'CQRS nhẹ trong một ứng dụng Spring Boot thiết kế thế nào?', 'Ghi bằng JDBC trong cùng transaction ảnh hưởng gì tới persistence context?'],
  tags: ['jpa', 'jOOQ', 'JdbcTemplate', 'architecture', 'lead', 'CQRS'],
},

{
  id: 'spring-039',
  topic: 'spring',
  level: 'senior',
  q: 'Mô tả chi tiết vòng đời bean từ BeanDefinition đến bean sẵn sàng: BeanFactoryPostProcessor, instantiate, populate, Aware, BeanPostProcessor before/after (proxy AOP tạo ở đây), init, SmartInitializingSingleton.',
  a: `**Tóm tắt:** Spring không "tạo bean" trong một bước mà đi qua một pipeline có thứ tự cố định: đọc BeanDefinition → BeanFactoryPostProcessor chỉnh sửa definition → instantiate (constructor) → populate properties (DI) → Aware callbacks → BeanPostProcessor.before → init (@PostConstruct/afterPropertiesSet/init-method) → BeanPostProcessor.after (AOP proxy bọc ở đây) → đăng ký singleton → SmartInitializingSingleton sau khi context refresh xong. Proxy AOP chỉ được tạo ở bước after, vì phải đợi bean đã đủ dependency.

### Pipeline từng bước
1. **BeanDefinition** – metadata: class name, scope, constructor args, property values, init/destroy method, lazy flag. Đây là "bản vẽ", chưa có object.
2. **BeanFactoryPostProcessor (BFPP)** – chạy trước khi tạo bất kỳ bean nào (trừ BFPP/BeanPostProcessor). Có thể sửa BeanDefinition (ví dụ PropertySourcesPlaceholderConfigurer thay \${...}), thêm definition. BFPP phải là static @Bean để tránh early init.
3. **Instantiate** – constructor được gọi (Objenesis có thể bỏ qua constructor cho proxy). Factory method @Bean cũng ở đây.
4. **Populate** – inject dependency theo constructor/setter/field. AutowiredAnnotationBeanPostProcessor xử lý @Autowired.
5. **Aware** – nếu bean implement BeanNameAware, BeanFactoryAware, ApplicationContextAware → gọi callback. Đây là cách bean "biết" về container.
6. **BeanPostProcessor.beforeInitialization** – ví dụ ApplicationContextAwareProcessor, CommonAnnotationBeanPostProcessor (@PostConstruct sẽ được gọi trong init phase bởi InitDestroyAnnotationBeanPostProcessor, nhưng BPP before có thể chuẩn bị).
7. **Init** – @PostConstruct → InitializingBean.afterPropertiesSet → custom init-method.
8. **BeanPostProcessor.afterInitialization** – AbstractAutoProxyCreator tạo proxy AOP tại đây (CGLIB/JDK). Bean trả về cho container là proxy, không phải target.
9. **Singleton registration** – put vào singletonObjects (ConcurrentHashMap). Từ giờ getBean trả proxy.
10. **SmartInitializingSingleton.afterSingletonsInstantiated** – chạy sau khi tất cả singleton non-lazy đã tạo xong; dùng để warm-up, preload cache, đăng ký listener.

### Vì sao proxy ở after, không before
Proxy cần bao quanh object đã hoàn chỉnh (đủ dependency, đã init). Nếu proxy tạo trước init, các init callback chạy trên target nhưng proxy chưa wrap → lời gọi từ bên ngoài không qua interceptor. Spring chọn after để đảm bảo mọi hook init đã xong trên target trước khi "đóng gói".

### Early reference & circular dependency
Khi có cycle qua field/setter, Spring expose "early reference" (có thể là proxy nếu bean cần AOP) trước khi init xong, để bean khác inject. Đây là lý do cycle chỉ giải quyết được với field/setter, không với constructor. Boot 2.6+ cấm mặc định vì early reference + proxy dễ vỡ (ví dụ @Async proxy không hỗ trợ early reference → "raw version").

### Pitfall production
- BFPP/BeanPostProcessor bean phải static @Bean, nếu không Spring phải init sớm config class → log "not eligible for getting processed by all BeanPostProcessors" và BPP có thể bị bỏ qua.
- @PostConstruct chạy trong lúc context đang refresh: DB chưa sẵn sàng, transaction chưa có → không làm I/O nặng; dùng ApplicationReadyEvent hoặc CommandLineRunner cho warm-up.
- Bean prototype không đi qua SmartInitializingSingleton và không gọi destroy callback.
- getBean trong @PostConstruct của bean A có thể trigger tạo bean B sớm → thứ tự không như mong đợi.

### Ví dụ đời thực
Một team viết bean {{CacheWarmer}}, trong @PostConstruct gọi {{orderService.placeOrder()}} (có {{@Transactional}}) để seed dữ liệu mẫu khi deploy. Chạy đúng trên local, nhưng lên staging một số đơn bị tạo nửa vừa: bảng đơn hàng có dòng, bảng chi tiết đơn hàng lại thiếu → dữ liệu không nhất quán. Điều tra: không có exception, nhưng transaction không chạy. Nguyên nhân: theo pipeline, @PostConstruct chạy ở bước 7 (init), còn proxy AOP (bao gồm {{@Transactional}}) chỉ tạo ở bước 8 (afterInitialization). Lúc @PostConstruct chạy, bean chưa được bọc proxy, nên lời gọi nội bộ không qua interceptor → chạy không transaction. Sửa: chuyển việc seed sang {{SmartInitializingSingleton.afterSingletonsInstantiated}} (chạy sau khi mọi singleton và proxy sẵn sàng) hoặc {{ApplicationReadyEvent}}. Kết quả: seed chạy trong transaction, thành công hoặc rollback toàn bộ, không còn dữ liệu nửa vừa.

### Trả lời mẫu khi phỏng vấn
"Vòng đời bean trong Spring là một pipeline cố định: container đọc {{BeanDefinition}}, qua {{BeanFactoryPostProcessor}} để chỉnh sửa định nghĩa, rồi instantiate (gọi constructor), populate (tiêm dependency), gọi các callback {{Aware}}, chạy {{BeanPostProcessor}} trước init, rồi đến init (@PostConstruct, afterPropertiesSet, init-method). Sau init, {{BeanPostProcessor}} sau init tạo proxy AOP — đây lúc {{@Transactional}}, {{@Async}} được áp dụng — rồi bean đăng ký vào singleton pool. Cuối cùng {{SmartInitializingSingleton}} chạy sau khi mọi singleton xong. Tôi nhớ rằng proxy chỉ tồn tại sau bước init, nên không gọi method có {{@Transactional}} từ @PostConstruct vì lúc đó bean chưa được bọc proxy, transaction sẽ không chạy. Nếu cần warm-up sau khi app sẵn sàng, tôi dùng {{SmartInitializingSingleton}} hoặc {{ApplicationReadyEvent}}. Tôi cũng tránh gọi {{getBean}} trong @PostConstruct vì có thể tạo bean khác sớm, làm thay đổi thứ tự khởi tạo không như mong đợi. Trong review, tôi luôn hỏi đoạn gọi có đang dùng AOP ngay trong giai đoạn khởi tạo không, vì đó là nơi proxy chưa sẵn sàng."

> Senior tip: khi debug "bean không được tạo / proxy không chạy", hãy in beanDefinitionNames và kiểm tra xem class có bị final, method private, hay lời gọi self-invocation không. Hiểu pipeline này là nền tảng để debug mọi "ma thuật" Spring.`,
  follow: [
    'Sự khác biệt giữa BeanFactoryPostProcessor và BeanPostProcessor về thời điểm và phạm vi tác động?',
    'Tại sao proxy AOP phải được tạo ở afterInitialization chứ không phải before?'
  ],
  tags: ['bean lifecycle', 'BeanDefinition', 'BeanPostProcessor', 'SmartInitializingSingleton', 'internals']
},
{
  id: 'spring-040',
  topic: 'spring',
  level: 'lead',
  q: 'Auto-configuration trong Spring Boot: file AutoConfiguration.imports, @Conditional*, thứ tự, và cách đọc condition evaluation report (--debug) để biết vì sao bean không được tạo.',
  a: `**Tóm tắt:** Auto-configuration là "cấu hình có điều kiện": Boot đọc danh sách class trong META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports, rồi chỉ đăng ký bean nếu các @Conditional* thỏa mãn. Debug bằng --debug (condition evaluation report) hoặc /actuator/conditions. Công thức vàng: @ConditionalOnMissingBean để nhường user, @ConditionalOnClass để không yêu cầu thư viện không có.

### File đăng ký
Mỗi dòng một tên class đầy đủ:
~~~text
META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports
com.acme.config.FlywayAutoConfiguration
~~~
Lưu ý phiên bản: Boot 3.x dùng file .imports; trước Boot 2.7 dùng key EnableAutoConfiguration trong META-INF/spring.factories.

### Các điều kiện thường dùng
| Annotation | Ý nghĩa |
|---|---|
| @ConditionalOnMissingBean | Chỉ đăng ký nếu chưa có bean cùng type do user define |
| @ConditionalOnClass | Chỉ đăng ký nếu class có trong classpath |
| @ConditionalOnProperty | Bật/tắt theo giá trị property; matchIfMissing quyết định kết quả khi property không được khai báo (mặc định false) |
| @ConditionalOnBean | Chỉ đăng ký nếu đã có bean khác (phụ thuộc thứ tự) |
| @ConditionalOnWebApplication | Chỉ áp dụng cho ứng dụng web |

### Ví dụ
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

### Thứ tự
Dùng @AutoConfigureBefore / @AutoConfigureAfter để ép thứ tự, @AutoConfigureOrder để sắp xếp theo số. Nếu không khai báo, Boot sắp theo tên class (alphabet) – nó không tự suy ra thứ tự từ dependency giữa các bean. Thiếu @AutoConfigureAfter → auto-config của bạn có thể chạy trước khi bean của thư viện khác sẵn sàng.

### Debug
1. Chạy app với --debug: log startup in "Condition evaluation report" liệt kê từng auto-config và điều kiện đã khớp hay không (matched/unmatched, lý do cụ thể).
2. Actuator: management.endpoints.web.exposure.include=health,info,conditions rồi xem /actuator/conditions – JSON cho biết chính xác điều kiện nào fail.
3. /actuator/env xem property đã resolve thành gì.

### Pitfall production
- @Bean trong auto-config mà không có @ConditionalOnMissingBean → đè lên cấu hình user, khó debug.
- @ConditionalOnClass(X.class) ở class-level an toàn (Spring đọc annotation bằng ASM, không nạp class). Nhưng đặt trên method @Bean với class literal thì có thể ném ClassNotFoundException/NoClassDefFoundError khi X vắng mặt. Cách an toàn: tách nested @Configuration riêng có điều kiện ở class-level, hoặc dùng name = "com.x.X" dạng String.
- Thiếu @AutoConfigureAfter/@AutoConfigureOrder → thứ tự sai.

### Ví dụ đời thực
Một team viết auto-config {{PaymentClientAutoConfiguration}} để tạo bean {{PaymentClient}} gọi cổng thanh toán, inject vào nhiều service. Vào một sprint, dev khác tự định nghĩa bean {{PaymentClient}} riêng để đặt timeout cao hơn trong môi trường thử nghiệm. App khởi động nhưng có **hai** bean cùng kiểu {{PaymentClient}}. Lúc một service @Autowired {{PaymentClient}}, Spring ném {{NoUniqueBeanDefinitionException}}, toàn bộ API thanh toán trả 500, deploy bị stall. Điều tra: class auto-config có @Bean {{PaymentClient}} nhưng **thiếu** {{@ConditionalOnMissingBean}}, nên Spring không nhường đường cho bean do user định nghĩa. Sửa: thêm {{@ConditionalOnMissingBean}} lên @Bean, dùng {{@ConditionalOnClass}} ở cấp class (hoặc chuỗi tên class) để tránh {{NoClassDefFoundError}} khi thư viện vắng mặt, và thêm {{@AutoConfigureAfter}} đảm bảo auto-config chạy sau khi {{DataSource}} sẵn sàng. Kết quả: deploy không còn conflict bean, và team viết test khẳng định "khi user định nghĩa bean thì auto-config nhường đường" để bắt lỗi ngay trong CI.

### Trả lời mẫu khi phỏng vấn
"Auto-configuration trong Spring Boot là cơ chế đăng ký bean có điều kiện: Boot đọc danh sách class trong file META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports, rồi với mỗi class kiểm tra các {{@Conditional*}}. {{@ConditionalOnMissingBean}} để không ghi đè bean của người dùng, {{@ConditionalOnClass}} để không yêu cầu thư viện không có trong classpath, {{@ConditionalOnProperty}} để bật/tắt theo cấu hình. Nếu điều kiện nào không khớp, toàn bộ auto-config đó bị bỏ qua. Thứ tự tạo bean được điều khiển bởi {{@AutoConfigureBefore}}, {{@AutoConfigureAfter}} và {{@AutoConfigureOrder}}; nếu không khai báo, Boot sắp theo tên class. Debug bằng cờ {{--debug}} (log condition evaluation report) hoặc endpoint {{/actuator/conditions}}. Khi viết auto-config, tôi coi nó như API công khai: mọi bean phải có {{@ConditionalOnMissingBean}}, property cần mặc định hợp lý, và phải có test kiểm tra user tự định nghĩa bean thì auto-config nhường đường. Đó là ba test tối thiểu. Tôi cũng viết test khởi động app với từng profile để bắt lỗi cấu hình sớm trong CI, chứ không chờ đến lúc deploy."

> Senior tip: hãy nghĩ auto-config là API công khai: mọi bean phải có @ConditionalOnMissingBean, tôn trọng property có mặc định hợp lý, và có test kiểm tra "user tự định nghĩa bean thì auto-config nhường đường". Đó là 3 test tối thiểu của auto-config đạt chuẩn.`,
  follow: [
    'Sự khác biệt giữa @ConditionalOnMissingBean và @ConditionalOnMissingClass là gì?',
    'Làm sao biết auto-config nào đã được nạp mà không cần bật --debug?'
  ],
  tags: ['auto-configuration', 'Conditional', 'actuator', 'debug', 'internals']
},
{
  id: 'spring-041',
  topic: 'spring',
  level: 'senior',
  q: 'Transaction propagation thực tế: REQUIRES_NEW giữ 2 connection cùng lúc → cạn pool; rollback-only khi exception bị nuốt (UnexpectedRollbackException).',
  a: `**Tóm tắt:** Propagation quy định cách transaction lồng trong transaction khác cư xử. REQUIRES_NEW treo (suspend) transaction ngoài và tạo transaction hoàn toàn mới với connection khác → giữ cùng lúc 2 connection. Khi exception bị bắt và nuốt bên trong, transaction ngoài vẫn bị đánh dấu rollback-only → commit sẽ ném UnexpectedRollbackException.

### Bảng so sánh
| Propagation | Đã có tx cha | Hành vi |
|---|---|---|
| REQUIRED | Có | Join vào tx cha |
| REQUIRES_NEW | Có | Suspend tx cha, tạo tx mới (commit độc lập) |
| NESTED | Có | Tạo savepoint trong tx hiện tại |
| SUPPORTS | Có | Join nếu có, không tạo nếu không |
| NOT_SUPPORTED | Có | Tạm dừng tx cha, chạy không transaction |
| MANDATORY | Bắt buộc có | Không có tx thì báo lỗi |
| NEVER | Bắt buộc không có | Có tx thì báo lỗi |

### REQUIRES_NEW giữ 2 connection
Ghi log audit phải tồn tại dù transaction nghiệp vụ rollback:
~~~java
@Service
public class AuditService {
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void writeLog(String message) { /* commit riêng */ }
}
~~~
Tx cha giữ connection #1, REQUIRES_NEW lấy connection #2. Với HikariCP pool nhỏ, đủ số thread đồng thời là pool cạn → lỗi "Connection is not available". Tx mới không thấy dữ liệu chưa commit của tx ngoài, và nếu nó cập nhật dòng mà tx ngoài đang khoá thì sẽ tự chờ chính mình (treo tới lock timeout).

### Rollback-only / UnexpectedRollbackException
Khi method A (REQUIRED) gọi method B (REQUIRED) và B ném RuntimeException, Spring đánh dấu tx cha rollback-only. Nếu code bắt exception ở A và không rethrow, A tiếp tục chạy và cố commit → Spring ném UnexpectedRollbackException vì tx đã bị đánh dấu rollback-only. Đây là lỗi kinh điển khi "nuốt exception".

Cách xử lý: nếu muốn nuốt exception, phải tách transaction (REQUIRES_NEW) cho phần có thể fail, hoặc rõ ràng rollback/commit. Không nuốt exception trong cùng transaction.

### Pitfall production
- REQUIRES_NEW tạo tính không nhất quán: transaction con commit trước, transaction ngoài rollback sau ⇒ dữ liệu đã ghi vẫn còn. Chỉ dùng khi nghiệp vụ chấp nhận (log, notification).
- NESTED chỉ hoạt động khi nền tảng hỗ trợ savepoint (PostgreSQL, MySQL InnoDB có; một số DB không). Trên JPA hỗ trợ còn hạn chế.
- Propagation chỉ có tác dụng khi lời gọi qua proxy – self-invocation phá propagation.
- REQUIRES_NEW cần kiểm tra kích thước connection pool và đặt timeout cho phần chờ connection.

### Ví dụ đời thực
Job đối soát cuối ngày xử lý 10.000 giao dịch trong **một** transaction ngoài; với mỗi giao dịch lệch, gọi {{discrepancyService.record()}} có REQUIRES_NEW để "ghi lại kể cả khi job lỗi". Một ngày dữ liệu đối tác lỗi khiến 4.000 giao dịch bị lệch: 4.000 transaction con mở và đóng tuần tự, mỗi cái lấy thêm một connection — job chậm gấp 6 lần nhưng chưa sập. Tệ hơn: một giao dịch ném exception trong {{matchService.match()}} (REQUIRED, cùng transaction), job **bắt và bỏ qua** để chạy tiếp → transaction ngoài đã bị đánh dấu rollback-only; đến cuối, commit ném {{UnexpectedRollbackException}} và **toàn bộ** kết quả đối soát của ngày bị rollback, chỉ còn lại các bản ghi chênh lệch (do REQUIRES_NEW). Thiết kế lại: chia lô 500 giao dịch mỗi transaction ({{TransactionTemplate}}), lỗi của một giao dịch được xử lý trong transaction riêng của lô đó, chênh lệch ghi theo lô.

### Trả lời mẫu khi phỏng vấn
"Hai bẫy propagation tôi gặp nhiều nhất. Thứ nhất, REQUIRES_NEW tạm treo transaction ngoài nhưng connection vẫn bị giữ, nên mỗi luồng cần hai connection; dưới tải, khi số luồng đạt kích thước pool, có thể mọi luồng cùng chờ connection thứ hai và hệ thống đứng. Thứ hai là rollback-only: khi một method REQUIRED tham gia cùng transaction ném exception qua proxy, transaction bị đánh dấu chỉ được rollback; nếu bên ngoài bắt và nuốt exception rồi kết thúc bình thường, lúc commit Spring ném UnexpectedRollbackException và mọi thứ bị rollback, gây bất ngờ. Cách tôi xử lý là giữ transaction ngắn, chia lô xử lý bằng TransactionTemplate để lỗi một phần không phá cả lô lớn, dùng REQUIRES_NEW tiết kiệm hoặc thay bằng sự kiện sau commit, và không nuốt exception trong transaction."

> Senior tip: trước khi thêm REQUIRES_NEW, hãy hỏi "transaction con có thật sự cần sống sót khi transaction cha rollback không?". Nếu không, dùng REQUIRED. Khi đã dùng REQUIRES_NEW, luôn kiểm tra pool size và đặt connection timeout.`,
  follow: [
    'Transaction con dùng REQUIRES_NEW commit thành công nhưng transaction cha rollback – dữ liệu sẽ ra sao?',
    'Tại sao NESTED không hoạt động trên mọi database?'
  ],
  tags: ['Transactional', 'propagation', 'REQUIRES_NEW', 'UnexpectedRollbackException', 'connection pool']
},
{
  id: 'spring-042',
  topic: 'spring',
  level: 'senior',
  q: '@Async/@Scheduled: executor mặc định ở Boot 3, mất context (MDC, SecurityContext, transaction) và cách truyền (TaskDecorator).',
  a: `**Tóm tắt:** @Async chạy method ở thread khác do TaskExecutor quản lý, dựa trên proxy nên chịu hạn chế AOP. Ba cái bẫy lớn: exception bị nuốt; transaction không truyền sang thread mới; ThreadLocal không truyền (MDC, SecurityContext). Dùng TaskDecorator để copy context. @Scheduled mặc định dùng ThreadPoolTaskScheduler pool size = 1.

### Executor mặc định Boot 3
- Nếu có đúng một bean TaskExecutor, Spring dùng bean đó cho @Async.
- Spring Boot tự động cấu hình bean applicationTaskExecutor (core size 8, queue rất lớn, prefix task-).
- Nếu không có bean nào, Spring rơi về SimpleAsyncTaskExecutor: mỗi task một thread mới, không giới hạn → chạy tải cao sinh hàng nghìn thread và làm chết máy. Luôn khai báo executor tường minh.

### Cấu hình executor
~~~java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    @Bean("reportExecutor")
    ThreadPoolTaskExecutor reportExecutor() {
        var ex = new ThreadPoolTaskExecutor();
        ex.setCorePoolSize(4);
        ex.setMaxPoolSize(8);
        ex.setQueueCapacity(500);
        ex.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        ex.setThreadNamePrefix("report-");
        ex.initialize();
        return ex;
    }
    @Override public Executor getAsyncExecutor() { return reportExecutor(); }
}
~~~

### Bẫy 1 – exception bị nuốt
Method void: exception đi vào AsyncUncaughtExceptionHandler (mặc định chỉ log), caller không biết. Method trả Future/CompletableFuture: exception nằm trong Future, không ai đọc là mất. Muốn xử lý lỗi: trả CompletableFuture<Void> và dùng whenComplete/exceptionally, và cài AsyncUncaughtExceptionHandler riêng (alert/metrics) cho method void.

### Bẫy 2 – transaction
Transaction gắn với thread (qua TransactionSynchronizationManager), nên thread mới không có transaction. Đừng mong @Transactional ở method gọi được kế thừa. Hãy đặt @Transactional ngay trên chính method async (chạy trong thread mới) để có transaction riêng.

### Bẫy 3 – ThreadLocal
MDC (trace id) và SecurityContext không tự truyền sang thread mới. Dùng TaskDecorator để copy context:
~~~java
ex.setTaskDecorator(runnable -> {
    var ctx = MDC.getCopyOfContextMap();
    return () -> { MDC.setContextMap(ctx); try { runnable.run(); } finally { MDC.clear(); } };
});
~~~

### @Scheduled
- Cần @EnableScheduling; 3 kiểu trigger: fixedRate (định kỳ tính từ lúc bắt đầu), fixedDelay (chờ thêm X sau khi xong), cron.
- Timezone mặc định theo máy chạy app; luôn chỉ định zone = "Asia/Ho_Chi_Minh" cho job theo lịch nghiệp vụ.
- Chạy trùng trên nhiều instance: dùng ShedLock (@SchedulerLock) hoặc tách scheduler instance duy nhất.
- Task dài làm nghẽn scheduler: pool size = 1 mặc định → task 2 phút chặn task kế tiếp. Cấu hình pool lớn hơn hoặc đẩy xuống executor async.
- Exception: Spring bọc task bằng error handler mặc định "log rồi bỏ qua" → lần chạy sau vẫn diễn ra; phải tự bắt exception, đếm metric lỗi và alert.

### Pitfall production
- Queue không giới hạn + producer nhanh hơn consumer → memory tăng tới OOM; luôn đặt queue capacity và rejection policy.
- @Async trên method private hoặc lời gọi nội bộ this.x() → chạy đồng bộ, không báo lỗi.
- Job phải idempotent: at-least-once + idempotent để chịu được retry, deploy, clock lệch.
- Spring Boot 3.2+ có thể dùng virtual thread executor với spring.threads.virtual.enabled=true – phù hợp I/O nhiều.

> Senior tip: định nghĩa rõ trong team: @Async chỉ dùng cho tác vụ không quan trọng (gửi email, ghi log, cập nhật thống kê). Với tác vụ nghiệp vụ cần đảm bảo không mất, đẩy vào message broker và có retry/dead-letter. Nhớ thêm metrics đếm số task async đang chờ và số task lỗi.`,
  follow: [
    'Làm sao truyền SecurityContext hoặc trace id sang thread async một cách an toàn?',
    'Khi nào nên dùng message broker thay vì @Async?'
  ],
  tags: ['Async', 'Scheduled', 'executor', 'TaskDecorator', 'MDC', 'ThreadPoolTaskExecutor']
},
{
  id: 'spring-043',
  topic: 'spring',
  level: 'lead',
  q: 'Khởi động nhanh Spring Boot: lazy init, CDS (Boot 3.3+), AOT + GraalVM native image, CRaC — trade-off.',
  a: `**Tóm tắt:** Spring Boot 3 cung cấp nhiều cách giảm thời gian khởi động: lazy initialization (tạo bean khi cần), CDS (Class Data Sharing – chia sẻ metadata class đã xử lý), AOT + GraalVM native image (biên dịch ahead-of-time thành binary), và CRaC (checkpoint/restore JVM). Mỗi cách đánh đổi giữa thời gian start, throughput, memory và khả năng debug.

### Lazy init
spring.main.lazy-initialization=true: bean chỉ được tạo khi lần đầu được yêu cầu. Giảm thời gian start và memory ban đầu, nhưng lỗi cấu hình (missing bean, sai property) chỉ lộ ra lúc runtime thay vì lúc start, và request đầu tiên sẽ chậm. Phù hợp cho dev/local; production thường muốn fail-fast.

### CDS (Boot 3.3+)
CDS cho phép JVM lưu class metadata đã parse/verify vào archive (.jsa), dùng lại giữa các lần start → giảm thời gian class loading. Boot 3.3 hỗ trợ tạo CDS archive bằng một lần chạy huấn luyện (training run): giải nén jar bằng {{java -Djarmode=tools -jar app.jar extract}}, chạy {{java -XX:ArchiveClassesAtExit=app.jsa -Dspring.context.exit=onRefresh -jar app.jar}} để ứng dụng khởi động xong rồi thoát, sau đó chạy thật với {{-XX:SharedArchiveFile=app.jsa}}. Từ JDK 24, Project Leyden thêm AOT cache (JEP 483) lưu cả class đã nạp và link sẵn, tăng tốc mạnh hơn CDS. Giới hạn: phải chạy cùng JDK version, cùng classpath; không hỗ trợ mọi agent; lợi ích vừa phải (thường 20-40% start nhanh hơn) nhưng không thay đổi throughput.

### AOT + GraalVM native image
AOT xử lý Spring tại build time: bean definition, proxy, reflection metadata được sinh sẵn. GraalVM native image biên dịch thành binary native → start cực nhanh (ms), memory footprint thấp, nhưng build lâu (phút), binary lớn, và reflection/dynamic proxy phải khai báo rõ (reachability metadata). Spring Boot 3 hỗ trợ native image qua spring-boot-maven-plugin (native profile). Pitfall: code dùng reflection không khai báo sẽ fail runtime; test coverage phải cao vì lỗi chỉ lộ khi chạy native.

### CRaC (Coordinated Restore at Checkpoint)
CRaC cho phép JVM checkpoint toàn bộ trạng thái (heap + threads) vào file, rồi restore cực nhanh. Spring Boot 3.2+ (Spring Framework 6.1) hỗ trợ checkpoint tự động khi khởi động bằng {{-Dspring.context.checkpoint=onRefresh}}, hoặc chụp thủ công lúc đang chạy bằng {{jcmd <pid> JDK.checkpoint}}; cần JDK có hỗ trợ CRaC (ví dụ Azul Zulu, BellSoft Liberica bản CRaC) và chỉ chạy trên Linux. Khác với native image: vẫn chạy trên JVM nên throughput và tương thích tốt hơn, nhưng checkpoint file lớn, restore phải cùng môi trường, và resource (socket, file handle) phải đóng/mở lại qua Resource interface của CRaC.

### Bảng trade-off
| Phương pháp | Start | Throughput | Build time | Tương thích |
|---|---|---|---|---|
| Lazy init | nhanh hơn | không đổi | không đổi | cao |
| CDS | nhanh hơn vừa | không đổi | build archive | trung bình |
| Native image | rất nhanh | thường thấp hơn | rất lâu | thấp (cần metadata) |
| CRaC | rất nhanh | như JVM | checkpoint runtime | trung bình (resource handling) |

### Pitfall production
- Native image: thiếu reflection metadata → ClassNotFoundException/NoSuchMethodError lúc runtime; dùng tracing agent để sinh metadata.
- CRaC: socket/file handle không tự restore; phải implement Resource và đóng/mở lại; database connection pool phải recreate.
- Lazy init che lỗi config; native image che lỗi reflection.
- Đo start time thực tế (time to first request) chứ không chỉ "JVM started".

> Senior tip: đừng chọn native image chỉ vì "start nhanh". Nếu workload là serverless/short-lived (Lambda, scale-to-zero), native image/CRaC đáng giá. Nếu là long-running service, JVM tuning (G1/ZGC, heap sizing) thường cho throughput tốt hơn với chi phí thấp hơn. Luôn đo trên workload thật trước khi quyết định.`,
  follow: [
    'Khi nào nên chọn CRaC thay vì GraalVM native image?',
    'Native image ảnh hưởng thế nào đến reflection và dynamic proxy trong Spring?'
  ],
  tags: ['startup', 'lazy init', 'CDS', 'GraalVM', 'native image', 'CRaC', 'AOT']
},
{
  id: 'spring-044',
  topic: 'spring',
  level: 'lead',
  q: 'Spring MVC trên virtual threads (spring.threads.virtual.enabled) vs WebFlux: khi nào còn cần reactive?',
  a: `**Tóm tắt:** Spring MVC là blocking (thread-per-request); WebFlux là reactive non-blocking (event loop + backpressure). Với hệ thống dùng JDBC/JPA (blocking), WebFlux không giúp gì, và lựa chọn hiện đại là MVC + virtual threads (Java 21). WebFlux vẫn cần khi cần backpressure, streaming/SSE/WebSocket, hoặc toàn bộ I/O non-blocking.

### So sánh
| Tiêu chí | Spring MVC | Spring WebFlux |
|---|---|---|
| Mô hình thread | Thread-per-request (blocking) | Event loop + non-blocking |
| Ngưỡng đồng thời | Bị giới hạn bởi số thread | Rất cao, nhưng chỉ khi I/O thực sự non-blocking |
| DB driver | JDBC/JPA (blocking) | R2DBC (non-blocking) |
| Blocking code | Bình thường | Chặn event loop → rất nguy hiểm |
| Backpressure | Không có (dựa vào số thread) | Có, giới hạn tốc độ producer |
| Streaming/SSE/WebSocket | Có (không tối ưu) | Rất tốt |

### Vì sao WebFlux "không nhanh hơn" khi dùng JPA
WebFlux chỉ hay khi toàn bộ chuỗi I/O không chặn: R2DBC, WebClient, Kafka reactive, SSE. Nếu bạn vẫn dùng JPA/Hibernate trong handler, các lệnh query blocking sẽ giữ event loop → mất đúng lợi thế của WebFlux, thêm độ phức tạp. Kết hợp "WebFlux + JPA" là dấu hiệu thiết kế sai.

### Virtual threads thay đổi bức tranh
Java 21 (JEP 444) cho phép tạo hàng triệu thread nhẹ. Spring Boot 3.2+ hỗ trợ:
~~~yaml
spring:
  threads:
    virtual:
      enabled: true
~~~
Khi đó Tomcat xử lý mỗi request bằng một virtual thread: code blocking vẫn viết như MVC thông thường, nhưng không còn giới hạn "số thread = số request đồng thời". Đây là lựa chọn mặc định rất hợp lý cho hệ thống CRUD dùng JPA.

### Pitfall production
- Thread pinning: trên Java 21, virtual thread có thể pin carrier khi blocking trong một số vùng synchronized hoặc native method. Tránh giữ monitor qua thao tác I/O blocking dài. JEP 491 (Java 24) loại bỏ pinning do monitor trong các trường hợp này.
- ThreadLocal trong virtual thread vẫn hoạt động nhưng bộ nhớ phụ thuộc số thread đang sống → tránh giữ dữ liệu lớn trong ThreadLocal.
- Với virtual thread, connection pool phải nhỏ lại (pool là tài nguyên hữu hạn của DB), không phải lớn lên.
- Kiểm thử: MVC dùng MockMvc, WebFlux dùng WebTestClient – test sai loại là nguồn lỗi phổ biến.

### Khi nào còn cần WebFlux
- Cần backpressure (producer nhanh hơn consumer).
- Streaming/SSE/WebSocket với nhiều kết nối đồng thời.
- Toàn bộ I/O non-blocking (R2DBC, WebClient, reactive Kafka).
- Gateway/proxy với throughput cực cao và latency thấp.

### Ví dụ đời thực
Một nhóm đang viết lại service thông báo đẩy (push notification) — phải giữ **50.000 kết nối SSE** mở cùng lúc tới app, mỗi kết nối gần như im lặng, thỉnh thoảng có sự kiện. Thử nghiệm: Spring MVC + virtual thread giữ được nhưng mỗi kết nối vẫn chiếm một virtual thread và bộ đệm của Tomcat, bộ nhớ khoảng 3,2GB; WebFlux (Netty) với {{Flux}} cho mỗi kết nối và backpressure từ nguồn Kafka: khoảng 1,1GB, CPU thấp hơn 30%. Team chọn WebFlux cho service này, còn 14 service CRUD khác chuyển sang MVC + virtual thread vì code đơn giản và dùng JPA. Tiêu chí được ghi thành ADR: "WebFlux khi có streaming hoặc rất nhiều kết nối mở lâu và toàn bộ đường đi non-blocking; còn lại MVC + virtual thread".

### Trả lời mẫu khi phỏng vấn
"Với Java 21, Spring MVC bật virtual thread giải quyết được phần lớn lý do trước đây khiến người ta chọn WebFlux: phục vụ nhiều request đồng thời chờ I/O mà không cạn thread, trong khi giữ code blocking dễ viết, dễ debug, dùng được JPA và JDBC. Tôi vẫn chọn WebFlux trong vài trường hợp: streaming như SSE hay WebSocket với rất nhiều kết nối mở lâu, cần backpressure end to end từ nguồn dữ liệu tới client, hoặc gateway, proxy mà toàn bộ đường đi đã non-blocking với driver reactive. WebFlux không làm từng request nhanh hơn, và nếu phía sau là JDBC blocking thì lợi ích gần như mất, còn dễ chặn event loop. Nên mặc định của tôi là MVC kèm virtual thread, WebFlux là lựa chọn có chủ đích cho bài toán streaming."

> Senior tip: đừng chọn WebFlux chỉ vì nghe "reactive là xu hướng". Nếu hệ thống bị nghẽn vì thread bị chặn I/O (DB, HTTP client), chuyển sang virtual thread là thay đổi nhỏ, hiệu quả cao. Chuyển sang WebFlux là viết lại toàn bộ tầng I/O – chi phí lớn, chỉ đáng làm khi thực sự cần backpressure và streaming.`,
  follow: [
    'Tại sao dùng WebFlux cùng JPA là một anti-pattern?',
    'Virtual thread ảnh hưởng thế nào đến việc sizing connection pool?'
  ],
  tags: ['Spring MVC', 'WebFlux', 'reactive', 'virtual threads', 'backpressure']
},
{
  id: 'spring-045',
  topic: 'spring',
  level: 'senior',
  q: 'Spring context refresh phases: prepareRefresh, obtainFreshBeanFactory, invokeBeanFactoryPostProcessors, registerBeanPostProcessors, finishBeanFactoryInitialization, finishRefresh và SmartInitializingSingleton.',
  a: `**Tóm tắt:** ApplicationContext.refresh() đi qua 12 bước theo thứ tự cố định (AbstractApplicationContext.refresh). Hiểu các phase giúp debug "bean không được tạo", "BPP bị bỏ qua", và biết khi nào SmartInitializingSingleton / ApplicationReadyEvent chạy. Các phase quan trọng: prepareRefresh → obtainFreshBeanFactory → prepareBeanFactory → postProcessBeanFactory → invokeBeanFactoryPostProcessors → registerBeanPostProcessors → initMessageSource → initApplicationEventMulticaster → onRefresh → registerListeners → finishBeanFactoryInitialization → finishRefresh.

### Các phase chính
1. **prepareRefresh** – đánh dấu started, validate environment, init property sources.
2. **obtainFreshBeanFactory** – tạo bean factory mới (DefaultListableBeanFactory), load bean definitions từ XML/JavaConfig.
3. **prepareBeanFactory** – đăng ký các bean đặc biệt (environment, systemProperties, systemEnvironment), thêm BeanPostProcessor (ApplicationContextAwareProcessor), ignore dependency interface.
4. **postProcessBeanFactory** – hook cho subclass (ví dụ WebApplicationContext thêm ServletContext).
5. **invokeBeanFactoryPostProcessors** – chạy BFPP (ConfigurationClassPostProcessor parse @Configuration/@ComponentScan/@Import; PropertySourcesPlaceholderConfigurer resolve \${...}). Đây là lúc @Configuration classes được xử lý.
6. **registerBeanPostProcessors** – tìm và đăng ký tất cả BeanPostProcessor bean vào bean factory (sắp xếp theo PriorityOrdered/Ordered). Sau bước này BPP mới hoạt động cho các bean tạo sau.
7. **initMessageSource** – i18n.
8. **initApplicationEventMulticaster** – event bus.
9. **onRefresh** – hook subclass (web: tạo theme resolver, v.v.).
10. **registerListeners** – đăng ký ApplicationListener bean.
11. **finishBeanFactoryInitialization** – pre-instantiate tất cả singleton non-lazy (gọi getBean cho từng definition). Đây là lúc @PostConstruct, BPP, AOP proxy chạy. SmartInitializingSingleton.afterSingletonsInstantiated chạy ở cuối bước này.
12. **finishRefresh** – publish ContextRefreshedEvent, start SmartLifecycle (phase thấp trước), log startup info.

### Vì sao thứ tự này quan trọng
- BFPP (phase 5) phải chạy trước BPP registration (phase 6) và trước instantiate (phase 11), vì BFPP có thể thêm/sửa bean definitions (ví dụ @ComponentScan thêm definition). Nếu BPP được đăng ký trước BFPP, BPP có thể bị bỏ qua cho các bean do BFPP thêm.
- BeanPostProcessor bean phải được instantiate sớm (trong phase 6) để xử lý các bean sau. Đó là lý do @Bean trả về BeanPostProcessor phải static.
- SmartInitializingSingleton chạy sau khi tất cả singleton đã tạo xong → an toàn để làm warm-up phụ thuộc vào nhiều bean.

### Pitfall production
- Lỗi "BeanPostProcessor ... not eligible" xuất hiện khi BPP bean được tạo quá muộn (sau khi nó cần xử lý bean khác) → thường do @Bean non-static.
- ContextRefreshedEvent có thể fire nhiều lần (parent/child context) → listener phải idempotent.
- finishRefresh start SmartLifecycle theo phase tăng dần khi start, và phase giảm dần khi stop → thứ tự shutdown ngược với startup.
- ApplicationReadyEvent fire sau finishRefresh (và sau CommandLineRunner) → đây là thời điểm an toàn để warm-up và health check.

> Senior tip: khi app start chậm, cấu hình {{BufferingApplicationStartup}} ({{app.setApplicationStartup(new BufferingApplicationStartup(2048))}}) rồi xem {{/actuator/startup}} để có timeline từng bước và từng bean, hoặc ghi JFR với {{FlightRecorderApplicationStartup}}. Phase 11 (pre-instantiate) thường là chỗ tốn thời gian nhất – lazy init có thể giúp nhưng đánh đổi fail-fast.`,
  follow: [
    'Tại sao BeanPostProcessor bean phải là static @Bean?',
    'Sự khác biệt giữa ContextRefreshedEvent và ApplicationReadyEvent là gì?'
  ],
  tags: ['context refresh', 'ApplicationContext', 'SmartLifecycle', 'ApplicationReadyEvent', 'internals']
},
{
  id: 'spring-046',
  topic: 'spring',
  level: 'lead',
  q: 'Spring Boot test slices (@WebMvcTest, @DataJpaTest, @JsonTest...): cơ chế, @MockBean/@SpyBean, và bẫy khi dùng chung với @SpringBootTest.',
  a: `**Tóm tắt:** Test slices là các annotation tự động cấu hình chỉ một "lát cắt" của app (web layer, JPA layer, JSON layer...) thay vì toàn bộ context, giúp test nhanh và cô lập. @MockBean/@SpyBean thay thế bean thật bằng mock/spy trong context. Bẫy phổ biến: dùng @MockBean trong @SpringBootTest làm context cache bị invalidate, và mixing slice với full context.

### Các slice phổ biến
| Annotation | Lát cắt |
|---|---|
| @WebMvcTest | Spring MVC + controller, mock service layer |
| @WebFluxTest | WebFlux controller |
| @DataJpaTest | JPA + repository + embedded DB (auto rollback) |
| @DataJdbcTest | Spring Data JDBC |
| @JsonTest | Jackson/Gson serialization |
| @RestClientTest | RestTemplate/WebClient client |
| @AutoConfigureMockMvc | Thêm MockMvc vào @SpringBootTest |

### Cơ chế
Slice annotation dùng @ImportAutoConfiguration để chỉ nạp auto-config liên quan đến lát cắt, và @TypeExcludeFilters để loại bỏ các @Component khác. Kết quả: context nhỏ, start nhanh, và chỉ test đúng layer.

### @MockBean / @SpyBean
- @MockBean: thay bean thật bằng Mockito mock trong context; mọi bean phụ thuộc vào nó sẽ nhận mock.
- @SpyBean: spy (gọi thật trừ khi stub).
- Phải khai báo ở class level hoặc field; mock được reset giữa các test method (Mockito.reset) nhưng bean definition vẫn là mock.
- @MockBean làm context cache key thay đổi → nếu nhiều test class dùng @MockBean khác nhau, Spring phải tạo context mới → chậm. Dùng @MockBean ở base class chung hoặc @TestConfiguration để giảm.

### Bẫy khi dùng chung với @SpringBootTest
1. @SpringBootTest load toàn bộ context; thêm @MockBean sẽ invalidate cache giữa các test class → test suite chậm.
2. Slice test không có @Service/@Repository bean thật → nếu controller gọi service mà không mock, test fail. Phải @MockBean service.
3. @DataJpaTest mặc định dùng embedded DB và rollback mỗi test; nếu dùng @Transactional trên test method, rollback theo test. Với @SpringBootTest + @AutoConfigureTestDatabase, cần cấu hình rõ.
4. Test slice không scan @ComponentScan của app → bean custom ở package khác không có; dùng @Import để thêm.
5. @MockBean trên interface vs class: phải khớp với bean definition thực tế (proxy type).

### Pitfall production
- Quá nhiều @MockBean làm test "pass" nhưng không kiểm tra integration thật → cần @SpringBootTest cho smoke test.
- Mock repository trong @WebMvcTest rồi test logic nghiệp vụ → test sai layer.
- Context cache: đặt @DirtiesContext cẩn thận; lạm dụng làm suite chậm.
- Flaky test do shared state (static, singleton) giữa các test method.

### Bên trong: context cache và vì sao test chậm
Spring TestContext **cache** application context theo "khoá cấu hình" (lớp cấu hình, profile, properties, danh sách {{@MockBean}}/{{@MockitoBean}}, initializer…). Hai lớp test có khoá giống hệt nhau dùng chung một context; chỉ cần **khác một mock** là tạo context mới (5–20 giây mỗi lần). {{@DirtiesContext}} buộc tạo lại. Từ Spring Boot 3.4 / Spring Framework 6.2, {{@MockBean}}/{{@SpyBean}} bị deprecated, thay bằng {{@MockitoBean}}/{{@MockitoSpyBean}} của Spring Framework. Test slice ({{@WebMvcTest}}, {{@DataJpaTest}}) chỉ nạp một phần auto-configuration nên nhanh hơn, nhưng bean ngoài slice (service, repository khác) phải mock hoặc {{@Import}}.

### Ví dụ đời thực
Suite 900 test mất 24 phút. Log cho thấy context được khởi tạo **63 lần**: mỗi lớp {{@SpringBootTest}} mock một tổ hợp bean khác nhau, cộng 9 lớp có {{@DirtiesContext}}. Team gom thành 4 lớp cơ sở có cùng bộ mock (bean nào không cần thì vẫn mock giống nhau), chuyển phần lớn test controller sang {{@WebMvcTest}}, test repository sang {{@DataJpaTest}} + Testcontainers dùng chung, bỏ {{@DirtiesContext}} bằng cách dọn dữ liệu sau test. Context còn khởi tạo 7 lần, suite còn 6 phút 30 giây.

### Trả lời mẫu khi phỏng vấn
"Test slice chỉ nạp phần cấu hình cần cho một tầng: WebMvcTest nạp controller, advice, converter, Jackson, MockMvc mà không nạp service hay repository; DataJpaTest nạp JPA, repository, và mặc định mỗi test chạy trong transaction được rollback; JsonTest chỉ kiểm tra serialize. Bean ngoài slice thì mock bằng MockBean, từ Boot 3.4 là MockitoBean. Điều quan trọng là Spring cache application context theo cấu hình của lớp test, và mỗi tổ hợp mock khác nhau tạo một context mới tốn vài giây đến vài chục giây; DirtiesContext cũng buộc tạo lại. Vì vậy tôi gom các lớp test dùng chung một bộ cấu hình và mock, ưu tiên slice cho test từng tầng, chỉ dùng SpringBootTest cho vài luồng xuyên tầng, và theo dõi số lần context khởi động trong CI."

> Senior tip: chiến lược test hợp lý: slice test cho logic từng layer (nhanh, nhiều), @SpringBootTest cho 1-2 smoke test integration, và Testcontainers cho DB thật. Đừng mock repository rồi gọi là "test integration" – đó chỉ là unit test với Spring context.`,
  follow: [
    'Khi nào nên dùng @MockBean thay vì mock thủ công trong unit test thuần?',
    'Làm sao tránh context cache bị invalidate khi dùng @MockBean ở nhiều test class?'
  ],
  tags: ['testing', 'test slices', 'MockBean', 'WebMvcTest', 'DataJpaTest']
}
,
{
  id: 'jpa-038',
  topic: 'jpa',
  level: 'senior',
  q: 'Dirty checking (cơ chế tự phát hiện thay đổi) trong Hibernate hoạt động bên trong như thế nào: snapshot được lưu ở đâu, so sánh diễn ra lúc nào, chi phí với persistence context lớn ra sao? Bytecode enhancement và read-only hint giúp gì?',
  a: `**Tóm tắt:** Dirty checking (kiểm tra "bẩn" - tự phát hiện entity nào đã bị sửa) hoạt động dựa trên **snapshot** (ảnh chụp trạng thái lúc load): khi Hibernate nạp một entity vào persistence context (ngữ cảnh bền vững - vùng nhớ tạm của một phiên làm việc với DB, giống "sổ nháp" theo dõi mọi object đang quản lý), nó lưu một bản sao mảng giá trị các trường. Lúc flush (đồng bộ thay đổi xuống DB), Hibernate duyệt từng entity managed (đang được quản lý), so sánh giá trị hiện tại với snapshot từng trường; nếu khác thì sinh câu {{UPDATE}}. Persistence context càng lớn thì duyệt và so sánh càng tốn CPU/bộ nhớ. **Bytecode enhancement** (cải tiến bytecode - Hibernate sửa mã đã biên dịch của entity để gắn cơ chế theo dõi) cho phép dirty tracking (theo dõi thay đổi) trực tiếp, giảm so sánh; **read-only hint** báo Hibernate bỏ snapshot/không dirty-check cho truy vấn chỉ đọc.

### Bước 1: "Cái gì" - snapshot và identity map
- **Entity** (thực thể): object Java ánh xạ một dòng trong bảng DB (ví dụ {{Order}} ↔ bảng {{orders}}).
- **Persistence context** (bộ nhớ đệm cấp 1 - L1 cache): cấu trúc dạng map, khóa là {{EntityKey}} (loại entity + id), giá trị là **EntityEntry** chứa: tham chiếu entity, trạng thái (managed/deleted/...), và **loadedState** - mảng snapshot các giá trị thuộc tính lúc nạp.
- Ví dụ đời thường: giống nhân viên kho chụp ảnh món hàng lúc nhận (snapshot); lúc trả hàng họ so ảnh với hiện trạng để biết món nào bị đổi.

### Bước 2: "Vì sao cần" - Hibernate chọn dirty checking
- Nếu không có cơ chế này, lập trình viên phải tự gọi {{update()}} và chỉ rõ cột nào đổi - dễ quên, dễ sai.
- Trade-off (đánh đổi) người thiết kế chọn: Hibernate chấp nhận **chi phí so sánh lúc flush** để đổi lấy **trải nghiệm lập trình tự nhiên** (sửa field Java rồi commit là xong). Ngược lại, các ORM khác (như jOOQ) thiên về SQL tường minh, ít "ma thuật" hơn nhưng nhiều code hơn.

### Bước 3: Hoạt động từng bước
1. **Load**: {{em.find(Order.class, 42L)}} hoặc query trả entity → Hibernate đọc dòng DB, tạo object {{Order}}, điền giá trị, lưu {{EntityEntry}} với {{loadedState = [42, "NEW", 100000, ...]}} vào persistence context.
2. **Sửa trong bộ nhớ**: {{order.setStatus("PAID")}} → chỉ đổi field Java, **chưa có SQL**.
3. **Flush** (xảy ra trước commit, hoặc trước query cần dữ liệu nhất quán, hoặc khi gọi {{flush()}}): Hibernate duyệt mọi EntityEntry managed → với mỗi entity, lấy {{currentState}} (đọc lại các field qua getter/field access) và so sánh với {{loadedState}} từng phần tử → nếu khác, đánh dấu dirty và tạo {{EntityUpdateAction}} trong **ActionQueue** (hàng đợi hành động).
4. **Thực thi SQL**: ActionQueue chạy, sinh {{UPDATE orders SET status=? WHERE id=? AND version=?}} (nếu có {{@Version}}).

~~~java
@Transactional
public void pay(Long id) {
    Order o = em.find(Order.class, id); // (1) load: snapshot lưu [id, "NEW", 100k]
    o.setStatus("PAID");                // (2) chỉ đổi field Java
    // (3) trước commit: Hibernate so snapshot vs current -> sinh UPDATE status
}
~~~

### Bước 4: Chi phí khi persistence context lớn
- Độ phức tạp xấp xỉ **O(N * F)** mỗi lần flush: N = số entity managed, F = số field so sánh. Ví dụ xử lý 50.000 entity, mỗi entity 20 field → 1.000.000 phép so sánh/flush; nếu flush ngầm nhiều lần (do auto-flush trước query) chi phí nhân lên.
- Bộ nhớ: mỗi entity giữ thêm mảng snapshot (bản sao giá trị). 50.000 entity * (object + snapshot + entry overhead) có thể lên hàng trăm MB → nguy cơ {{OutOfMemoryError}}.
- Cách giảm: xử lý theo lô nhỏ (ví dụ 500), gọi {{em.flush(); em.clear();}} sau mỗi lô; dùng **StatelessSession** (phiên không trạng thái - không giữ snapshot, không dirty check) cho batch/import.

### Bước 5: Bytecode enhancement (dirty tracking)
- **Bytecode enhancement**: cơ chế Hibernate (Maven plugin {{org.hibernate.orm.tooling:hibernate-enhance-maven-plugin}}, hoặc Gradle plugin {{org.hibernate.orm}}) chèn mã vào class entity lúc build để entity tự "báo" field nào đổi (thay vì Hibernate phải quét hết).
- Lợi ích: bỏ qua so sánh field không đổi; kết hợp {{enableLazyInitialization}} có thể cải thiện lazy loading thuộc tính.
- Đánh đổi: thêm bước build, mã sinh ra khó debug hơn, cần cấu hình nhất quán giữa môi trường.

### Bước 6: Read-only hint
~~~java
// JPA hint: Hibernate KHÔNG giữ snapshot, KHÔNG dirty-check
List<Order> rows = em.createQuery("select o from Order o", Order.class)
    .setHint("org.hibernate.readOnly", true)
    .getResultList();

// Spring Data: tương đương
@QueryHints(@QueryHint(name = "org.hibernate.readOnly", value = "true"))
List<Order> findReport();
~~~
- Lưu ý: với Spring 5.1+ và Hibernate, {{@Transactional(readOnly = true)}} vừa đặt {{FlushMode.MANUAL}} (tắt auto-flush), vừa gọi {{session.setDefaultReadOnly(true)}}: mọi entity load trong transaction đó đều ở chế độ read-only, không giữ snapshot. Vì vậy với transaction chỉ đọc, readOnly = true đã đủ; hint {{org.hibernate.readOnly}} dùng khi chỉ muốn một query cụ thể là read-only bên trong transaction có ghi.

### Trên production
- **Triệu chứng:** CPU spike trên app server khi xử lý batch; GC nhiều; thời gian flush tăng tuyến tính theo kích thước job; heap dump thấy hàng chục nghìn {{EntityEntry}} và mảng {{loadedState}}.
- **Cách đo:** bật {{hibernate.generate_statistics=true}} (chỉ dev/staging hoặc sampling) và xem {{EntityInsertCount/UpdateCount/EntityLoadCount}}, {{FlushCount}}; dùng profiler (Java Flight Recorder - JFR) tìm thời gian trong {{DefaultFlushEntityEventListener}}; log SQL để phát hiện UPDATE không mong muốn.
- **Cấu hình/tuning có thật:** {{spring.jpa.properties.hibernate.jdbc.batch_size}} (gom INSERT/UPDATE), {{hibernate.order_updates=true}}, xử lý theo chunk + {{clear()}}, dùng read-only hint cho truy vấn báo cáo, cân nhắc bytecode enhancement với {{enableDirtyTracking=true}}.

| Chiến lược | Snapshot | Dirty check | Phù hợp |
|---|---|---|---|
| Mặc định (managed) | Có | Quét tất cả field khi flush | CRUD thông thường |
| Read-only hint | Không/không dùng để so sánh | Bỏ qua | Báo cáo, truy vấn chỉ đọc |
| {{StatelessSession}} | Không | Không | Batch/import lớn |
| Bytecode enhancement (dirty tracking) | Tùy cấu hình | Chỉ field bị đánh dấu đổi | Entity nhiều field, cần tối ưu |

> Senior tip: Nếu một job đọc 100k dòng để xuất báo cáo mà không sửa gì, đừng dùng Session thường - hãy đặt read-only hint hoặc dùng projection/StatelessSession; tôi từng thấy job xuất CSV giảm 40% thời gian chỉ nhờ bỏ snapshot không cần thiết. Luôn đo bằng statistics/JFR trước khi tối ưu.`,
  follow: [
    'Khi nào {{@Transactional(readOnly = true)}} đủ và khi nào cần thêm hint {{org.hibernate.readOnly}}?',
    'Nếu bạn gọi {{em.detach(entity)}} hoặc {{em.clear()}} giữa chừng, dirty checking với entity đó thay đổi thế nào?',
    'Bytecode enhancement có rủi ro gì khi deploy nhiều môi trường (dev/staging/prod) với cấu hình build khác nhau?'
  ],
  tags: ['dirty checking', 'persistence context', 'snapshot', 'bytecode enhancement', 'readOnly', 'internals'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide: Bytecode Enhancement', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#BytecodeEnhancement' },
    { type: 'doc', title: 'Hibernate ORM User Guide: Fetching (read-only)', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#fetching-strategies-dynamic-fetching' }
  ]
}

,
{
  id: 'jpa-039',
  topic: 'jpa',
  level: 'senior',
  q: 'Flush (đồng bộ persistence context xuống DB) và ActionQueue (hàng đợi hành động) trong Hibernate hoạt động thế nào? FlushMode AUTO nghĩa là gì, và vì sao thứ tự insert → update → delete trong ActionQueue có thể gây lỗi unique constraint khi bạn xoá rồi thêm lại cùng key trong một transaction?',
  a: `**Tóm tắt:** Flush (đồng bộ) là lúc Hibernate chuyển các thay đổi trong persistence context (vùng nhớ quản lý entity) thành câu SQL theo **ActionQueue** (hàng đợi hành động nội bộ). Với {{FlushMode.AUTO}} (mặc định), Hibernate tự flush trước commit và trước một số query cần kết quả nhất quán. ActionQueue thực thi theo thứ tự cố định: **insert → update → (collection) → delete** (theo nhóm hành động); nếu trong cùng transaction bạn xóa một dòng rồi tạo dòng mới có **cùng unique key** (khóa duy nhất, ví dụ email unique), INSERT có thể chạy trước DELETE → DB báo vi phạm unique constraint dù về logic bạn "đã xóa trước".

### Bước 1: Thuật ngữ nền tảng
- **Persistence context**: "sổ nháp" của {{EntityManager}}/Session - theo dõi entity thêm/sửa/xóa.
- **Flush**: "chốt sổ nháp xuống DB" - sinh SQL (INSERT/UPDATE/DELETE) nhưng chưa chắc commit (commit mới xác nhận transaction).
- **ActionQueue**: hàng đợi bên trong Hibernate gom {{EntityInsertAction}}, {{EntityUpdateAction}}, {{EntityDeleteAction}}, collection actions rồi thực thi theo thứ tự định sẵn để giảm lỗi phụ thuộc (ví dụ insert cha trước con).
- **Unique constraint**: ràng buộc DB đảm bảo cột/nhóm cột không trùng, ví dụ {{UNIQUE(email)}}.

### Bước 2: Vì sao Hibernate dùng thứ tự cố định (trade-off)
- Nếu thực thi SQL theo đúng thứ tự bạn gọi {{persist/remove}} trong Java, logic dễ hiểu hơn nhưng Hibernate khó tối ưu (batch, gom câu lệnh) và dễ vướng lỗi FK. Nếu dùng hàng đợi với thứ tự "an toàn mặc định" (ưu tiên insert để có id/FK, delete sau), tối ưu tốt hơn nhưng tạo ca góc "xóa rồi thêm lại cùng unique key".
- Ví dụ đời thường: giống thủ thư cập nhật sổ theo loại việc (nhập sách mới trước, hủy sách sau); nếu bạn "hủy mã A rồi nhập lại mã A", làm theo loại việc sẽ gây trùng mã tạm thời.

### Bước 3: FlushMode hoạt động thế nào
| FlushMode | Khi flush | Ghi chú |
|---|---|---|
| {{AUTO}} (mặc định) | Trước commit; và trước query JPQL/Criteria/Native nếu Hibernate xác định query có thể đọc bảng bị ảnh hưởng | Cân bằng đúng dữ liệu và hiệu năng |
| {{COMMIT}} | Chỉ trước commit | Query có thể thấy dữ liệu cũ trong cùng persistence context |
| {{MANUAL}} (chỉ có ở Hibernate; JPA chỉ định nghĩa AUTO và COMMIT; thay cho NEVER đã deprecated) | Chỉ khi gọi {{flush()}} | Dùng cho read-only/batch; Spring đặt chế độ này khi transaction readOnly |

~~~java
@Transactional
public void swapEmail(Long userId, String email) {
    User u = em.find(User.class, userId); // managed
    em.remove(u);                         // ghi nhận delete action
    em.flush(); // ép DELETE chạy xuống DB trong transaction
    User n = new User(email);
    em.persist(n);                        // INSERT sau -> an toàn với unique
}
~~~

### Bước 4: Từng bước gây lỗi unique constraint
Giả sử {{users}} có {{UNIQUE(email)}} và đang có {{id=10, email='a@x.com'}}:
1. {{remove()}} user id=10 → ghi nhận delete action (chưa SQL).
2. {{persist()}} user mới với {{email='a@x.com'}} → ghi nhận insert action.
3. Flush (không có flush giữa chừng): ActionQueue thực thi nhóm **INSERT trước** → DB kiểm tra unique: email vẫn tồn tại (DELETE chưa chạy) → **vi phạm unique constraint**.

~~~text
-- Thứ tự SQL thực tế (minh họa):
INSERT INTO users(id,email) VALUES (11,'a@x.com'); -- FAIL: duplicate key (email)
DELETE FROM users WHERE id=10;                    -- chưa kịp chạy
~~~

### Bước 5: Cách xử lý đúng
- **Flush tường minh giữa delete và insert:** {{em.remove(u); em.flush(); em.persist(n);}} - phù hợp khi thực sự phải thay thế.
- **Update thay vì delete+insert:** nếu chỉ đổi dữ liệu, {{u.setEmail(newEmail)}} giữ id và tránh vấn đề thứ tự.
- **Thiết kế tránh hoán đổi natural key** trong cùng unit of work (đơn vị công việc).
- Tránh dùng {{hibernate.flush_before_completion}} như "cứu cánh" mà không hiểu thứ tự action.

### Trên production
- **Triệu chứng:** {{ConstraintViolationException}} / SQLState {{23505}} (PostgreSQL) chỉ ở luồng "đổi key", khó tái hiện nếu test không flush giống production hoặc dùng DB khác.
- **Cách đo:** bật {{org.hibernate.SQL}} (DEBUG) để xem thứ tự câu lệnh; viết integration test với DB thật (Testcontainers) vì H2 đôi khi khác hành vi constraint/timing.
- **Cấu hình:** {{hibernate.order_inserts=true}}/{{hibernate.order_updates=true}} giúp gom batch nhưng **không đổi** thứ tự insert/update/delete giữa các loại hành động; PostgreSQL {{DEFERRABLE INITIALLY DEFERRED}} có thể dời kiểm tra unique đến cuối transaction (trade-off: phát hiện lỗi muộn, phức tạp hơn).

| Ca sử dụng | Rủi ro | Hướng xử lý |
|---|---|---|
| Tạo entity mới | Thấp | {{persist}} |
| Sửa field (không đổi unique key) | Thấp | Dirty checking |
| Xóa rồi thêm lại cùng unique key | **Cao** | {{flush()}} giữa hai bước hoặc update |
| Thay thế bản ghi có FK phức tạp | Cao | Thiết kế migration logic, cân nhắc soft delete |

> Senior tip: Khi review code JPA, tôi tìm pattern {{remove()}} rồi {{persist()}} cùng business key - đó là mìn hẹn giờ với unique constraint. Nếu id nghiệp vụ không đổi, hãy update; nếu phải thay thế, flush sau delete và viết test tích hợp trên đúng loại DB production.`,
  follow: [
    'Sự khác nhau giữa {{flush()}} và {{commit()}} là gì, và flush fail nhưng chưa commit thì transaction ở trạng thái nào?',
    'Constraint {{DEFERRABLE}} của PostgreSQL giúp gì trong ca này và đánh đổi là gì?',
    'Tại sao {{hibernate.order_inserts=true}} không giải quyết được lỗi unique khi delete+insert cùng key?'
  ],
  tags: ['flush', 'FlushMode', 'ActionQueue', 'unique constraint', 'internals'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide: Flushing', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#flushing' }
  ]
}
,
{
  id: 'jpa-042',
  topic: 'jpa',
  level: 'senior',
  q: 'FlushMode (chế độ flush) AUTO hoạt động thế nào, đặc biệt là auto-flush trước khi chạy JPQL/HQL? Persistence context có thể gây "thấy dữ liệu mình vừa sửa trong bộ nhớ" ra sao, và vì sao đôi khi bạn gặp flush ngoài ý muốn làm chậm request?',
  a: `**Tóm tắt:** {{FlushMode.AUTO}} (mặc định của Hibernate/JPA trong nhiều cấu hình) cho phép Hibernate **tự flush** trước commit và **trước khi thực thi JPQL/HQL** nếu thay đổi trong persistence context có thể ảnh hưởng kết quả truy vấn (thường xét theo bảng/không gian entity liên quan). Điều này giúp query nhìn thấy thay đổi chưa commit trong cùng unit of work, nhưng có thể gây flush tốn kém hoặc lỗi ràng buộc sớm. {{FlushMode.COMMIT}} chỉ flush lúc commit, còn {{MANUAL}} (chỉ có ở Hibernate) chỉ flush khi gọi {{flush()}}; cả hai — nhanh hơn cho luồng đọc nhưng dễ trả kết quả "cũ" so với thay đổi trong bộ nhớ.

### Bước 1: Thuật ngữ
- **FlushMode**: chính sách "khi nào đồng bộ context xuống DB".
- **Auto-flush**: Hibernate tự quyết định flush để đảm bảo tính nhất quán đọc-trong-transaction giữa bộ nhớ managed và câu query JPQL.
- **JPQL (Java Persistence Query Language)**: ngôn ngữ query trên entity; Hibernate phải dịch ra SQL và chạy trên DB — DB không biết object bạn vừa sửa trong RAM nếu chưa flush.

### Bước 2: Chuyện gì xảy ra theo thứ tự
1. Trong transaction bạn load {{Order}} (managed) và đổi {{status = "PAID"}} (chưa flush).
2. Bạn chạy {{select o from Order o where o.status = 'PAID'}} (JPQL).
3. Với {{FlushMode.AUTO}}, Hibernate kiểm tra: thay đổi pending có thể ảnh hưởng {{Order}} không? → **flush** các thay đổi liên quan trước khi gửi SQL.
4. SQL chạy trên DB và thấy dữ liệu đã được {{UPDATE}} (trong cùng transaction DB).
5. Nếu dùng {{COMMIT}} mode, bước 3 có thể bị bỏ qua → query DB có thể **không** thấy {{PAID}} bạn vừa set trong RAM (tùy trạng thái DB/context).

~~~java
Order o = em.find(Order.class, 1L);
o.setStatus("PAID"); // dirty trong context
// AUTO: có thể flush Order trước JPQL dưới đây
Long c = em.createQuery(
    "select count(o) from Order o where o.status = :s", Long.class)
  .setParameter("s", "PAID").getSingleResult();
~~~

### Bước 3: Vì sao thiết kế vậy (trade-off)
Hibernate ưu tiên **tính đúng** cho unit of work: lập trình viên kỳ vọng query phản ánh thay đổi họ vừa làm. Đánh đổi: flush có thể chạy nhiều lần, tốn dirty check + SQL + lock DB sớm. Ở luồng đọc-nhiều, flush ngoài ý muốn là nguồn độ trễ khó thấy.

### FlushMode và cách kiểm soát
| Chế độ | Khi flush (khái quát) | Ưu | Nhược |
|---|---|---|---|
| {{AUTO}} | Commit + trước query khi cần | Nhất quán trong UoW | Có thể flush tốn kém |
| {{COMMIT}} | Chủ yếu lúc commit | Ít flush bất ngờ | Query có thể bỏ lỡ thay đổi RAM |
| {{MANUAL}} (Hibernate) | Chỉ khi gọi {{flush()}} | Kiểm soát tối đa | Dễ quên, dễ sai |

- Có thể đặt per query bằng API chuẩn: {{query.setFlushMode(FlushModeType.COMMIT)}}, hoặc cho cả EntityManager: {{em.setFlushMode(FlushModeType.COMMIT)}}. Spring Data: {{@QueryHints(@QueryHint(name = "org.hibernate.flushMode", value = "COMMIT"))}}.
- Với {{@Transactional(readOnly=true)}}, Spring/Hibernate thường hướng tới {{MANUAL}} semantics — phù hợp đọc.

### Tương tác với native SQL
Native SQL không đi qua mô hình entity của JPQL theo cùng cách; Hibernate có cơ chế synchronization (vùng bảng) nhưng bạn vẫn cần hiểu: nếu bạn sửa entity rồi chạy native query chạm cùng bảng, hãy đảm bảo flush phù hợp.

### Trên production
- **Triệu chứng**: request đơn giản có thêm {{UPDATE}} lạ trước {{SELECT}}; p95 tăng khi có query JPQL trong luồng sửa nhiều entity; deadlock/constraint lỗi xuất hiện "sớm" tại thời điểm query.
- **Cách đo**: bật log SQL ({{org.hibernate.SQL}}) và statistics; quan sát thứ tự statement; so sánh với/không có flush hint.
- **Tuning**: tách luồng đọc thuần (read-only, DTO), giảm số entity managed trước query, dùng {{COMMIT}} hint cho query báo cáo trong transaction phù hợp, chunk batch + {{clear()}}.

> Senior tip: Đừng coi auto-flush là "ma thuật miễn phí". Trong code review, mỗi JPQL chạy giữa chừng một transaction có nhiều entity dirty là một điểm cần hỏi: "flush này có cần thiết không, có ảnh hưởng index/lock không?"`,
  follow: [
    'Làm sao chứng minh auto-flush đã xảy ra (log, statistics, breakpoint) và query nào kích hoạt nó?',
    'FlushMode.COMMIT có an toàn khi bạn vừa {{persist()}} entity mới rồi JPQL tìm lại chính entity đó không?',
    'Khác biệt thực tế giữa flush tự động và {{entityManager.flush()}} thủ công về xử lý lỗi ràng buộc DB?'
  ],
  tags: ['FlushMode', 'AUTO', 'auto-flush', 'JPQL', 'persistence context', 'Hibernate internals']
}
,
{
  id: 'jpa-043',
  topic: 'jpa',
  level: 'lead',
  q: 'Ở quy mô lớn, bạn thiết kế chiến lược fetch (nạp dữ liệu quan hệ) thế nào: khi nào dùng EntityGraph ({{jakarta.persistence.fetchgraph}} vs {{loadgraph}}), khi nào chấp nhận tách query/batch, và vì sao {{hibernate.query.fail_on_pagination_over_collection_fetch}} là "công tắc an toàn"? Làm sao xử lý 2 collection dạng bag mà không che giấu lỗi dữ liệu?',
  a: `**Tóm tắt:** Fetch strategy (chiến lược nạp) tốt là **đúng dữ liệu + kiểm soát số query + kiểm soát bộ nhớ**, không có một nút "fetch all". {{EntityGraph}} cho phép khai báo thuộc tính cần nạp theo từng use case: **fetchgraph** chỉ nạp những gì graph chỉ định (các attribute khác thường trở về LAZY theo spec semantics, nhưng cần kiểm chứng với provider/version), **loadgraph** nạp những gì chỉ định và vẫn tôn trọng fetch type còn lại theo mặc định — thực tế Hibernate có chi tiết tinh tế nên phải test. Với collection join + phân trang, {{hibernate.query.fail_on_pagination_over_collection_fetch}} buộc Hibernate ném lỗi thay vì âm thầm phân trang trong bộ nhớ (gây OOM/latency). Hai bag cùng fetch join gây {{MultipleBagFetchException}}; đổi sang {{Set}} chỉ an toàn khi bạn thiết kế {{equals/hashCode}} đúng cho entity và chấp nhận ngữ nghĩa không trùng/thứ tự.

### Bước 1: Thuật ngữ
- **EntityGraph**: bản đồ thuộc tính cần "kéo theo" khi load entity gốc — tránh N+1 mà không hard-code fetch join khắp JPQL.
- **fetchgraph / loadgraph**: hai hint chuẩn JPA ({{jakarta.persistence.fetchgraph}} / {{loadgraph}}) truyền graph vào query.
- **Pagination over collection fetch**: phân trang ({{setFirstResult/setMaxResults}}) trên query fetch join collection — SQL trả nhiều dòng/cha do join, DB phân trang theo dòng, không theo "số cha" như bạn nghĩ.
- **Bag**: collection kiểu {{List}} không có {{@OrderColumn}} và không ràng buộc unique — Hibernate khó khử trùng dòng join khi có 2 bag.

### Bước 2: Ví dụ cụ thể và hành vi
~~~java
@EntityGraph(attributePaths = {"items", "items.product"})
@Query("select o from Order o where o.customerId = :cid")
Page<Order> findPage(@Param("cid") Long cid, Pageable p);
// Nguy hiểm: join collection + paging -> có thể HHH000104 / in-memory paging
~~~

Bật chặn sớm (tùy môi trường cấu hình):
~~~text
spring.jpa.properties.hibernate.query.fail_on_pagination_over_collection_fetch=true
~~~
Khi bật, Hibernate ném exception thay vì kéo cả tập kết quả về RAM để phân trang — **đúng** vì buộc bạn sửa thiết kế (2-step: lấy id trang rồi fetch join theo id; hoặc DTO).

### fetchgraph vs loadgraph (thực hành)
| Hint | Ý đồ | Lưu ý |
|---|---|---|
| {{fetchgraph}} | Chỉ load theo graph | Các attribute không trong graph: spec hướng LAZY; kiểm tra hành vi thực tế với Hibernate 6.x |
| {{loadgraph}} | Load graph + giữ mặc định EAGER còn lại | Dễ "kéo thêm" hơn dự kiến |

Luôn viết test integration đo số query ({{datasource-proxy}}, {{generate_statistics}}) vì hành vi chi tiết có thể khác giữa provider/version.

### Xử lý 2 bag
1. **Tách query**: load cha + load từng collection bằng {{IN}} batch hoặc 2 query trong cùng persistence context — Hibernate gộp qua identity map.
2. **Đổi 1 bag thành {{Set}}**: chỉ khi phần tử có {{equals/hashCode}} ổn định theo **business key bất biến** (không dùng id sinh sau persist một cách bừa bãi, không dùng field mutable). Sai {{equals/hashCode}} → mất phần tử, duplicate logic, lỗi khó tái hiện.
3. **DTO/projection**: bỏ hẳn đồ thị entity khi trả API danh sách.

~~~java
// 2-step paging an toàn
List<Long> ids = em.createQuery(
  "select o.id from Order o where o.status=:s order by o.id", Long.class)
  .setParameter("s","NEW").setFirstResult(0).setMaxResults(50).getResultList();
List<Order> rows = em.createQuery(
  "select distinct o from Order o left join fetch o.items where o.id in :ids", Order.class)
  .setParameter("ids", ids).getResultList();
~~~

### Trên production
- **Triệu chứng**: OutOfMemoryError khi endpoint phân trang; latency tăng tuyến tính theo offset; Hibernate log {{HHH000104}}; dữ liệu collection sai/thiếu sau khi đổi {{List}}→{{Set}}.
- **Cách đo**: đếm {{PrepareStatementCount}}; log số dòng JDBC trả về; heap dump; so sánh kế hoạch query DB.
- **Cấu hình/tuning**: {{hibernate.query.fail_on_pagination_over_collection_fetch=true}} (fail-fast), {{hibernate.default_batch_fetch_size}} (ví dụ 50) làm lưới an toàn, giới hạn độ sâu EntityGraph, API list trả DTO.

> Senior tip: Ở cấp lead, tôi yêu cầu mọi PR có fetch join collection + {{Pageable}} phải có bằng chứng: hoặc dùng 2-step, hoặc DTO, hoặc tắt paging — và có test đo số query. "Chạy được trên 10 dòng staging" không phải là tiêu chuẩn.`,
  follow: [
    'Tại sao {{distinct}} trong JPQL không giải quyết được phân trang trên collection fetch ở mức SQL/DB?',
    'Thiết kế {{equals/hashCode}} cho entity dùng trong {{Set}} quan hệ cần tuân thủ quy tắc nào để tránh mất phần tử?',
    'Khi nào bạn chọn batch fetching toàn cục ({{default_batch_fetch_size}}) thay vì EntityGraph theo từng endpoint?'
  ],
  tags: ['EntityGraph', 'fetchgraph', 'loadgraph', 'pagination', 'MultipleBagFetchException', 'fetch strategy', 'Hibernate internals'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide: Fetching', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#fetching' }
  ]
}
,
{
  id: 'jpa-044',
  topic: 'jpa',
  level: 'senior',
  q: 'Open Session in View (OSIV - mở Session trong suốt View) là gì ở mức cơ chế, vì sao Spring Boot bật mặc định, nó giữ connection DB (kết nối cơ sở dữ liệu) như thế nào, và bạn tắt {{spring.jpa.open-in-view}} an toàn theo từng bước ra sao?',
  a: `**Tóm tắt:** OSIV (thường qua {{OpenEntityManagerInViewInterceptor/Filter}}) giữ {{EntityManager}}/Hibernate {{Session}} mở từ đầu request HTTP đến sau khi view/JSON render xong. Lợi ích là tránh {{LazyInitializationException}} khi template/serializer chạm thuộc tính LAZY (nạp trễ). Hậu quả: **kéo dài thời gian giữ connection** (hoặc ít nhất giữ tài nguyên persistence) vượt ra ngoài transaction nghiệp vụ, che giấu N+1, làm khó kiểm soát boundary transaction, và có thể gây cạn pool dưới tải. Tắt an toàn: chuyển fetch cần thiết vào service (transaction), dùng DTO/projection, EntityGraph/batch fetch có chủ đích, bật cảnh báo sớm, test toàn API.

### Bước 1: Thuật ngữ
- **EntityManager/Session**: ngữ cảnh JPA/Hibernate quản lý entity managed và (với Hibernate) thường gắn với JDBC connection khi cần thực thi SQL.
- **Transaction (giao dịch)**: phạm vi {{@Transactional}} — nơi DB đảm bảo ACID; OSIV **không** đồng nghĩa transaction mở suốt request (transaction thường đóng ở service), nhưng Session vẫn mở.
- **Lazy loading (LAZY)**: chỉ load quan hệ khi truy cập; cần Session mở để chạy query bổ sung.

### Bước 2: Luồng theo thứ tự (request điển hình)
1. Request vào web layer → interceptor/filter OSIV **bind** EntityManager vào thread.
2. Controller gọi service {{@Transactional}}: mở transaction, lấy connection, chạy nghiệp vụ, **commit/rollback → đóng transaction**, nhưng EntityManager vẫn gắn thread (Session vẫn mở). Với cấu hình mặc định của Spring cho Hibernate (chế độ giữ connection {{DELAYED_ACQUISITION_AND_HOLD}}), connection đã lấy **không** trả về pool sau commit mà bị giữ tới khi EntityManager đóng, tức là tới cuối request.
3. Controller trả entity hoặc view render: serializer/template truy cập {{order.getItems()}} (LAZY) → Hibernate kích hoạt lazy load → **cần thực thi SQL** → có thể phải lấy connection (ngoài transaction cũ) → chạy query.
4. Sau khi response hoàn tất → OSIV **close** EntityManager.

~~~text
[HTTP request]----open EM------------------------------------close EM---->
   [@Transactional tx1]  commit
                 (LAZY touch here?) -> SQL chạy sau tx1 -> giữ/tạo connection muộn
~~~

### Bước 3: Vì sao Boot bật mặc định (trade-off)
Spring Boot ưu tiên "ứng dụng chạy được nhanh" với template/controller đơn giản: tránh lỗi LAZY bất ngờ cho người mới. Đánh đổi: che thiết kế kém (entity rò rỉ ra web), và chi phí tài nguyên không rõ ràng. Đó là lý do nhiều hệ thống production **tắt**.

### Hậu quả giữ connection/tài nguyên
- **Cạn connection pool** (HikariCP): connection bị giữ suốt phần còn lại của request, kể cả lúc gọi API bên ngoài, render JSON hay chờ client chậm; dưới tải cao pool cạn → timeout, dù DB gần như rảnh.
- **N+1 ẩn**: vòng lặp serialize list entity kích hoạt hàng trăm query.
- **Boundary mờ**: query chạy ngoài {{@Transactional}} → khó lý luận isolation/locking.
- **Hiệu năng đo sai**: thời gian service nhanh nhưng tổng thời gian DB kéo dài ở tầng render.

### Cách tắt an toàn (từng bước)
1. **Đặt cấu hình**: {{spring.jpa.open-in-view=false}} (Boot 2+/3.x đều dùng property này).
2. **Sửa API**: trả **DTO** (Data Transfer Object - object chỉ mang dữ liệu cần thiết), không trả entity JPA trực tiếp.
3. **Fetch đúng chỗ**: trong service {{@Transactional(readOnly=true)}} dùng {{join fetch}} có kiểm soát, {{@EntityGraph}}, hoặc query projection; với collection lớn dùng batch/subselect/2-step.
4. **Bật quan sát**: log SQL, {{datasource-proxy}}/p6spy đếm query; bật thống kê Hibernate ở staging.
5. **Test**: chạy integration test serialize response; tìm {{LazyInitializationException}} và sửa gốc (thiếu fetch) thay vì bật lại OSIV.
6. **Triển khai dần**: feature flag hoặc theo module nếu codebase lớn.

~~~yaml
spring:
  jpa:
    open-in-view: false
~~~

### Trên production
- **Triệu chứng**: Hikari báo timeout lấy connection dù CPU DB thấp; log query xuất hiện sau dòng "service done"; APM thấy DB time phân tán ở controller/view.
- **Cách đo**: metric {{hikaricp.connections.active/pending}}, thời gian giữ connection, số query/request; so sánh trước/sau tắt OSIV.
- **Cấu hình/cờ**: {{spring.jpa.open-in-view=false}}; tune pool ({{maximum-pool-size}}, {{max-lifetime}}) theo thực đo; cân nhắc {{hibernate.enable_lazy_load_no_trans}} **không khuyến nghị** vì che lỗi và mở session ngầm.

| Phương án | Ưu | Nhược |
|---|---|---|
| OSIV bật | Ít lỗi LAZY ban đầu | Giữ tài nguyên, che N+1 |
| OSIV tắt + DTO/fetch có chủ đích | Rõ boundary, dễ tối ưu | Cần sửa code |
| {{enable_lazy_load_no_trans}} | Tránh exception | Hành vi khó đoán, chống pattern |

> Senior tip: Tôi coi OSIV là "nợ kỹ thuật có phí lãi". Ở service mới, tắt ngay từ ngày 1; ở hệ cũ, đo số query/request và pool trước, rồi tắt theo từng vertical slice (một nhóm API) có DTO đầy đủ.`,
  follow: [
    'Vì sao {{LazyInitializationException}} thường chỉ xuất hiện sau khi tắt OSIV, và bạn phân biệt thiếu fetch vs bug serialize thế nào?',
    'Transaction có còn mở khi OSIV đang giữ Session không? Giải thích khác nhau giữa session boundary và transaction boundary.',
    'DTO projection giúp gì ngoài việc tránh LAZY, và khi nào nó làm code repository phình ra?'
  ],
  tags: ['OSIV', 'Open Session in View', 'spring.jpa.open-in-view', 'LazyInitializationException', 'connection pool', 'Hibernate internals'],
  refs: [
    { type: 'doc', title: 'Spring Boot Reference: spring.jpa.open-in-view', url: 'https://docs.spring.io/spring-boot/reference/data/sql.html#data.sql.jpa-and-spring-data.open-entity-manager-in-view' },
    { type: 'doc', title: 'Hibernate ORM User Guide: Fetching (lazy)', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#fetching' }
  ]
}
,
{
  id: 'jpa-045',
  topic: 'jpa',
  level: 'lead',
  q: '(Lead) Second-level cache (bộ nhớ đệm cấp 2, dùng chung giữa các session của một SessionFactory) và query cache của Hibernate hoạt động thế nào, vì sao trong cluster nhiều instance chúng có thể hại nhiều hơn lợi, và bạn thiết kế invalidation ra sao?',
  a: `**Tóm tắt:** L2 cache lưu **trạng thái entity theo id** (hoặc dữ liệu disassembled) để tránh đọc DB lặp lại; query cache lưu **danh sách id/khóa kết quả** của một query (thường phải đi kèm L2 entity regions để hữu ích). Khi có nhiều node, dữ liệu bị sửa ở node A thì cache node B **stale** (cũ) nếu không đồng bộ; query cache còn nhạy với mọi thay đổi bảng liên quan → invalidation ồn, hit rate thấp. Thực tế nhiều hệ thống ưu tiên cache tầng ứng dụng (Redis/Caffeine) với khóa nghiệp vụ rõ ràng, TTL/invalid event, và chỉ dùng L2 cho dữ liệu tham chiếu đọc cực nhiều, gần như bất biến.

### Bước 1: Thuật ngữ
- **L1 cache**: persistence context — tự động, per session/transaction.
- **L2 cache**: gắn {{SessionFactory}}, có thể dùng provider (Ehcache, Infinispan, v.v.) — chia sẻ giữa session trên cùng JVM; cluster cần replication/distributed.
- **Query cache**: cache mapping (query + params + region) → kết quả; Hibernate phải invalidate vùng khi entity thuộc không gian bảng thay đổi — chi phí cao.
- **Stale read**: đọc giá trị cũ dù DB đã đổi.

### Bước 2: Cơ chế từng bước (đơn giản hóa)
1. {{em.find(Entity, id)}}: kiểm tra L1 → kiểm tra L2 region của entity → nếu miss đọc DB → đưa vào L2/L1.
2. Update entity qua Hibernate trong transaction: khi commit/flush phù hợp, Hibernate **update/invalidate** entry L2 tương ứng (tùy chiến lược concurrency).
3. Query cache: lần đầu chạy query cacheable → lưu kết quả (thường id list) vào query region; lần sau trả id và hydrate entity từ L2/L1/DB.
4. **Bulk JPQL {{update/delete}}** ({{@Modifying}}) đi thẳng DB: Hibernate thường **invalidate region** liên quan (có thể thô) — nhưng dữ liệu thay đổi ngoài Hibernate (script SQL, service khác) thì **không** tự biết.

~~~java
@Entity
@Cacheable
@org.hibernate.annotations.Cache(usage = CacheConcurrencyStrategy.READ_WRITE)
public class Country { @Id Long id; String code; }
~~~

~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        cache:
          use_second_level_cache: true
          use_query_cache: false   # cân nhắc kỹ
          region:
            factory_class: jcache
~~~
(Cấu hình chính xác phụ thuộc provider; kiểm tra tài liệu Hibernate 6 + Spring Boot version bạn dùng.)

### Bước 3: Vì sao cluster thường hại nhiều hơn lợi
- **Coherence (tính nhất quán)**: node B giữ bản cũ; cần replication đồng bộ (chậm) hoặc async (stale window) hoặc invalidation message.
- **Invalidation storm**: bảng hay ghi → query cache/regions bị xóa liên tục → hit rate thấp, overhead cao hơn cả không cache.
- **Hiệu ứng "cache cho dữ liệu sai nhịp"**: entity có quan hệ LAZY, dữ liệu nhạy thời gian (giá, tồn kho, hạn mức) → stale gây lỗi nghiệp vụ nghiêm trọng.
- **Độ phức tạp vận hành**: debug "sao local đúng mà prod sai" rất khó.

| Dữ liệu | L2/query cache? | Gợi ý |
|---|---|---|
| Danh mục quốc gia, cấu hình hiếm đổi | Có thể (READ_ONLY/NONSTRICT nếu phù hợp) | TTL dài, invalidate khi deploy/config đổi |
| Giỏ hàng, số dư, đơn đang xử lý | Thường **không** | Source of truth = DB, cache có chủ đích nếu cần |
| Báo cáo query nặng lặp lại | Query cache thường **không** | Cache kết quả DTO ở tầng app + key rõ |

### Invalidation trong cluster — hướng thực tế
1. **Hạn chế phạm vi**: chỉ cache entity reference data; tắt query cache toàn cục trừ khi đo được lợi.
2. **Chiến lược concurrency**: {{READ_ONLY}} cho dữ liệu bất biến; {{READ_WRITE}}/NONSTRICT có đánh đổi lock/stale — chọn theo provider.
3. **Kênh invalidation**: nếu dùng distributed cache (Infinispan, Redis-backed) dùng pub/sub invalidate; sau bulk update chạy {{evict}}/{{evictAll}} region hoặc version hóa key.
4. **Luồng ghi ngoài Hibernate**: mọi đường ghi (batch job, SQL thủ công) phải phát sự kiện invalidation hoặc chấp nhận TTL ngắn.
5. **Đo lường**: hit/miss, latency p95, tỷ lệ stale incident; tắt cache khi hit rate thấp.

### Trên production
- **Triệu chứng**: user thấy dữ liệu cũ sau khi admin sửa; node A/B trả kết quả khác; spike DB khi cache bùng nổ bị xóa; memory cache phình.
- **Cách đo**: metric của cache provider (hits, misses, evictions), Hibernate statistics {{SecondLevelCacheHitCount}}, log region.
- **Cấu hình/cờ (tên thật, kiểm tra version)**: {{hibernate.cache.use_second_level_cache}}, {{hibernate.cache.use_query_cache}}, {{hibernate.cache.region.factory_class}} ({{jcache}}), {{jakarta.persistence.sharedCache.mode}}; annotation {{@Cache}}, {{@Cacheable}} (JPA).

> Senior tip: Ở phỏng vấn lead, câu trả lời mạnh là: "Tôi mặc định tắt query cache, chỉ cân nhắc L2 cho reference data có owner rõ và đường invalidation rõ; nghiệp vụ tiền/tồn kho dùng DB + optimistic locking + cache ứng dụng có TTL ngắn nếu cần."`,
  follow: [
    'Tại sao query cache phụ thuộc L2 entity cache và khi nào nó trở nên vô dụng?',
    'Bulk update JPQL ảnh hưởng L2 cache thế nào và bạn xử lý sau job batch ra sao?',
    'So sánh L2 Hibernate cache với Spring {{@Cacheable}} + Redis cho bài toán danh mục dùng chung nhiều service?'
  ],
  tags: ['second-level cache', 'query cache', 'invalidation', 'cluster', 'Hibernate internals', 'stale read'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide: Caching', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#caching' }
  ]
}
,
{
  id: 'jpa-046',
  topic: 'jpa',
  level: 'senior',
  q: 'Hibernate 6 xử lý query thế nào qua SQM (Semantic Query Model - mô hình ngữ nghĩa truy vấn) và query plan cache (cache kế hoạch truy vấn)? {{hibernate.query.in_clause_parameter_padding}} giải quyết vấn đề gì, và bạn cần lưu ý gì khi bật?',
  a: `**Tóm tắt:** Từ Hibernate 6, HQL/Criteria được phân tích thành **SQM** (cây ngữ nghĩa gắn với model entity), sau đó chuyển thành **SQL AST** và SQL cuối cùng; kế hoạch biên dịch (plan) có thể được **cache** để tránh parse/translate lặp lại. Vấn đề thực tế: câu {{IN (:ids)}} với số lượng tham số thay đổi tạo ra **nhiều SQL text khác nhau** → nhiều plan/statement cache entry (ở Hibernate và/hoặc DB) → tốn bộ nhớ, giảm hiệu quả. {{hibernate.query.in_clause_parameter_padding}} (mặc định **tắt**, phải bật tường minh) **đệm** số tham số {{IN}} lên các kích thước "bậc" (power-of-two hoặc mức padding) để tái dùng SQL/plan.

### Bước 1: Thuật ngữ
- **SQM (Semantic Query Model)**: biểu diễn truy vấn ở mức "ý nghĩa" (entity, attribute, join) thay vì chuỗi SQL thô — giúp Hibernate 6 hiểu và tối ưu tốt hơn.
- **Query plan cache**: cache kế hoạch thực thi/biên dịch query trong Hibernate (khác với cache kết quả). Nếu cùng hình dạng query, Hibernate có thể bỏ qua bước dựng plan nặng.
- **Parameter padding**: thêm tham số "đệm" (thường lặp giá trị hoặc giá trị trung tính theo cách Hibernate xử lý) để số dấu {{?}} ổn định theo bậc.
- **Prepared statement cache (DB/driver)**: DB cũng cache plan theo SQL text; SQL text thay đổi liên tục → cache miss.

### Bước 2: Ví dụ {{IN}} nổ plan
~~~java
// ids có 3 phần tử: IN (?, ?, ?)
// ids có 4 phần tử: IN (?, ?, ?, ?)
// ids có 100 phần tử: IN (...100 ?...)
repo.findAllByIdIn(ids);
~~~
Mỗi kích thước sinh SQL text khác → Hibernate có thể tạo plan khác; DB có thể parse/plan lại. Với API nhận danh sách id linh hoạt, số biến thể rất lớn.

Bật padding (Spring Boot {{application.yml}}, kiểm tra tên property đúng phiên bản Hibernate 6.x):
~~~yaml
spring:
  jpa:
    properties:
      hibernate:
        query:
          in_clause_parameter_padding: true
~~~
Khi bật, Hibernate có thể mở rộng danh sách tham số tới bậc đệm (ví dụ 3 → 4, 5 → 8…) để tái dùng cùng SQL shape. (Cơ chế đệm cụ thể thuộc implementation Hibernate; cần kiểm chứng bằng log SQL.)

### Bước 3: Vì sao thiết kế SQM/plan cache
- **Đúng ngữ nghĩa**: SQM gắn với metamodel, hỗ trợ tính năng mới và kiểm tra tốt hơn.
- **Hiệu năng**: cache plan giảm CPU parse cho query lặp lại. Trade-off: plan cache cũng tốn RAM; query shape quá đa dạng làm cache kém hiệu quả.

### Rủi ro và lưu ý khi bật padding
- **Kích thước {{IN}} rất lớn**: padding không giải quyết giới hạn DB (Oracle giới hạn số phần tử {{IN}} trong một số ngữ cảnh; SQL Server có giới hạn tham số) — vẫn phải chunk (ví dụ 500-1000 id/lần).
- **Kế hoạch DB**: cùng SQL shape nhưng phân bố giá trị khác vẫn có thể cần plan khác; padding giúp cache, không đảm bảo plan tối ưu tuyệt đối.
- **Tương thích**: kiểm tra log SQL thực tế sau khi bật; một số truy vấn đặc biệt cần xác nhận không đổi nghĩa.
- **Bảo mật**: vẫn dùng parameter binding (Hibernate làm sẵn), không nối chuỗi id.

| Vấn đề | Triệu chứng | Hướng xử lý |
|---|---|---|
| {{IN}} biến thiên mạnh | RAM plan cache tăng, parse CPU cao | Bật {{in_clause_parameter_padding}}, chunk id |
| Query string khác nhau | L2 statement cache miss | Chuẩn hóa query, tránh nối JPQL động bừa bãi |
| Plan cache quá lớn | GC/metaspace áp lực | Tune kích thước cache (property Hibernate, kiểm tra tài liệu), rà query shape |

### Trên production
- **Triệu chứng**: throughput giảm khi traffic có nhiều biến thể filter {{IN}}; DB thấy nhiều hard parse/plan; heap/metaspace tăng.
- **Cách đo**: Hibernate statistics (query plan cache metrics nếu exposed), log {{org.hibernate.orm.query}}, DB view ({{pg_stat_statements}} đếm số queryid/plan), APM.
- **Cấu hình có thật (kiểm tra version)**: {{hibernate.query.in_clause_parameter_padding=true}}; các cấu hình query plan cache của Hibernate 6 (tên property có thể nằm dưới {{hibernate.query.*}} — tra tài liệu ORM 6.x bạn deploy); giới hạn batch size {{IN}} ở tầng repository.

> Senior tip: Khi API nhận mảng id từ client, tôi luôn có "max ids per query" (ví dụ 500) + chunk + padding. Đó là bộ ba: bảo vệ DB, bảo vệ plan cache, và giữ latency ổn định.`,
  follow: [
    'Làm sao xác minh padding đang hoạt động (log SQL, số lượng {{?}}) và có thay đổi kết quả truy vấn không?',
    'Khác biệt giữa query plan cache của Hibernate và prepared statement/plan cache của PostgreSQL/driver là gì?',
    'Khi nào bạn nên dùng bảng tạm/temp table hoặc {{unnest(array)}} thay vì {{IN}} rất lớn?'
  ],
  tags: ['Hibernate 6', 'SQM', 'query plan cache', 'in_clause_parameter_padding', 'IN clause', 'performance'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide: Query Plan Cache', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#caching-query-plan' },
    { type: 'doc', title: 'Hibernate ORM User Guide: IN predicate padding', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#settings-query' }
  ]
}
,
{
  id: 'jpa-047',
  topic: 'jpa',
  level: 'lead',
  q: 'Batch insert (ghi hàng loạt) trong Hibernate 6: vì sao id {{IDENTITY}} (DB tự tăng) phá batching, cách dùng {{SEQUENCE}} + pooled/pooled-lo optimizer (bộ tối ưu cấp id theo "bể") hoạt động thế nào, và bạn kiểm chứng/tuning trên production ra sao khi có quan hệ cha-con và ràng buộc?',
  a: `**Tóm tắt:** JDBC batching chỉ hiệu quả khi Hibernate gửi được **nhiều statement cùng loại liên tiếp**. Với {{GenerationType.IDENTITY}}, DB sinh id **sau INSERT** nên Hibernate phải {{insert}} từng row để lấy generated key → **không gom batch** theo cách mong muốn. Với {{SEQUENCE}}, Hibernate lấy id **trước** (gọi sequence), có thể gán id vào entity và gom nhiều {{INSERT}}; **pooled optimizer** ({{@SequenceGenerator}} với {{allocationSize > 1}}, Hibernate dùng pooled strategy phù hợp) xin DB một "bể" giá trị (increment step) và cấp phát trong bộ nhớ, giảm round-trip gọi sequence. Trên production cần đo round-trip, thứ tự insert ({{order_inserts}}), cascade cha-con, và thống nhất {{allocationSize}} với {{INCREMENT BY}} của sequence.

### Bước 1: Thuật ngữ
- **JDBC batch**: gom nhiều {{addBatch()}} rồi {{executeBatch()}} — giảm số lần đi-về (round-trip) giữa app và DB.
- **IDENTITY**: cột {{AUTO_INCREMENT}}/{{IDENTITY}} — id do DB quyết định lúc ghi.
- **SEQUENCE**: object DB sinh số tăng; Hibernate có thể gọi {{nextval}}.
- **Pooled optimizer**: thuật toán cấp id: DB tăng sequence theo bước {{allocationSize}}; Hibernate coi như "mua sỉ" một khoảng, cấp dần trong JVM → ít {{select nextval}}.

### Bước 2: Luồng bên trong
**IDENTITY (vấn đề):**
1. {{persist(child)}} → Hibernate cần id để đưa vào context/cascade/FK → buộc {{INSERT}} ngay.
2. DB trả generated key → entity có id.
3. Lặp row 2 → lại {{INSERT}} ngay → không còn "nhiều insert chờ gom".

**SEQUENCE + pooled:**
1. {{allocationSize=50}} và sequence DB {{INCREMENT BY 50}}.
2. Hibernate gọi {{nextval}} (hoặc cơ chế tương đương) để lấy biên bể, tính được dải id cấp phát cục bộ.
3. {{persist}} 1000 entity: Hibernate gán id từ bể (thỉnh thoảng xin bể mới) → có thể gom {{INSERT}} theo {{hibernate.jdbc.batch_size}}.

~~~java
@Id
@GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "order_seq")
@SequenceGenerator(name = "order_seq", sequenceName = "order_id_seq",
  allocationSize = 50) // phải khớp INCREMENT BY của sequence DB
private Long id;
~~~

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

### Bước 3: Vì sao thiết kế vậy (trade-off)
IDENTITY đơn giản cho DB nhưng khóa chặt thứ tự "phải insert mới biết id". SEQUENCE tách việc cấp id khỏi insert, đổi lại phải quản lý sequence và đồng bộ {{allocationSize}}. Pooled giảm contention/round-trip nhưng có "lỗ hổng" id nếu JVM crash (bể đã xin nhưng chưa dùng hết) — chấp nhận được cho surrogate key.

### Quan hệ cha-con và bẫy batch
- **Thứ tự**: insert cha trước con; {{order_inserts=true}} giúp Hibernate nhóm theo entity type — nhưng đồ thị phức tạp vẫn cần kiểm tra.
- **{{@Version}}**: update versioned cần {{hibernate.jdbc.batch_versioned_data=true}} để batch update hiệu quả hơn.
- **{{IDENTITY}} trên MySQL**: nếu bắt buộc IDENTITY, chấp nhận không batch hoặc chuyển chiến lược (TABLE generator có chi phí lock; thường kém hơn SEQUENCE trên Postgres) — quyết định theo DB.
- **{{merge()}}** trong batch lớn: có thể gây {{select}} thêm; ưu tiên {{persist()}} cho đối tượng mới.

| Mục | IDENTITY | SEQUENCE + pooled |
|---|---|---|
| Batch insert | Bị hạn chế nặng | Tốt nếu cấu hình đúng |
| Round-trip cấp id | Gắn với insert | Ít hơn nhờ bể |
| Id gap | Ít do gap kiểu bể | Có thể gap khi crash/restart |
| Portability | Mọi DB hỗ trợ identity | Cần sequence (Postgres/Oracle tốt) |

### Trên production
- **Triệu chứng**: import 100k dòng chậm, p95 DB time cao, mỗi row một insert; hoặc duplicate key/sequence lỗi khi migration.
- **Cách đo**: {{datasource-proxy}} đếm statement và batch size thực; {{generate_statistics}}; so sánh thời gian với/không batch.
- **Tuning/cấu hình có thật**: {{hibernate.jdbc.batch_size}}, {{hibernate.order_inserts}}, {{hibernate.order_updates}}, {{hibernate.jdbc.batch_versioned_data}}; {{allocationSize}} khớp DDL {{CREATE SEQUENCE ... INCREMENT BY 50}}; chunk {{persist/flush/clear}} mỗi 50-200 row; dùng {{reWriteBatchedInserts}} (PostgreSQL JDBC driver) khi phù hợp — kiểm tra driver.

> Senior tip: Khi ai đó nói "Hibernate chậm", tôi hỏi ngay: "Id strategy là gì, batch_size bao nhiêu, và bạn có đo executeBatch thực sự gom được mấy câu không?" Ba câu trả lời đó thường tìm ra gốc vấn đề.`,
  follow: [
    'Làm sao kiểm tra sequence DB {{INCREMENT BY}} có khớp {{allocationSize}} không, và hậu quả nếu lệch là gì?',
    'Pooled-lo/pooled khác nhau thế nào và khi nào Hibernate chọn? (nêu theo hành vi tổng quát và khuyên kiểm tra tài liệu version)',
    'Với batch insert có quan hệ {{@OneToMany(cascade=PERSIST)}}, bạn kiểm soát thứ tự SQL và tránh N+1/select ngầm thế nào?'
  ],
  tags: ['batch insert', 'IDENTITY', 'SEQUENCE', 'pooled optimizer', 'hibernate.jdbc.batch_size', 'Hibernate 6'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide: Batch processing', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#batch' },
    { type: 'doc', title: 'Hibernate ORM User Guide: Identifiers', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#identifiers-generators' }
  ]
}
,
{
  id: 'jpa-048',
  topic: 'jpa',
  level: 'senior',
  q: 'ActionQueue (hàng đợi hành động) của Hibernate flush theo thứ tự insert→update→delete: ngoài case {{remove()}}+{{persist()}} cùng unique key, những biến thể "góc sâu" nào gây vi phạm unique/FK (thay thế phần tử {{orphanRemoval}} collection, đổi natural key, soft delete với partial unique index, constraint {{DEFERRABLE}} trên PostgreSQL), và bạn xử lý đúng cách thế nào?',
  a: `**Tóm tắt:** Hibernate gom thay đổi managed rồi flush theo **ActionQueue** (nhóm insert, update, collection, delete… theo quy tắc nội bộ nhằm an toàn FK và tối ưu). Thứ tự thực thi **không** bám theo thứ tự bạn gọi method Java; một hệ quả nổi tiếng là **INSERT có thể chạy trước DELETE**, nên "xóa rồi thêm lại" cùng **unique constraint** (ràng buộc duy nhất - DB cấm trùng giá trị) có thể fail trong cùng transaction. Góc sâu: (1) {{orphanRemoval}} collection thay phần tử cùng business key, (2) đổi **natural key** (khóa nghiệp vụ như mã/email) khi còn tham chiếu, (3) soft delete ({{@SQLDelete}}/cờ {{deleted_at}}) biến "DELETE SQL" thành UPDATE nhưng unique thường vẫn áp cho cả dòng đã xóa mềm nếu index thiết kế sai, (4) PostgreSQL {{DEFERRABLE INITIALLY DEFERRED}} dời kiểm tra unique đến cuối transaction (giúp case hiếm) nhưng đổi thời điểm lỗi và tăng độ phức tạp. Xử lý chuẩn: {{flush()}} tường minh đúng điểm, ưu tiên UPDATE/merge theo id ổn định, thiết kế partial unique index cho soft delete, và viết integration test trên DB thật.

### Bước 1: Thuật ngữ (từ gốc)
- **ActionQueue**: giống "hàng việc" nội bộ — Hibernate xếp "thêm/sửa/xóa" thành nhóm để gửi DB hiệu quả. Ví dụ đời thường: bưu cục gom thư gửi đi theo chuyến, không phải đưa từng lá ngay khi bạn viết.
- **Unique constraint**: luật "không được trùng" (email, số chứng từ). DB kiểm tra khi INSERT/UPDATE chạy (hoặc khi commit nếu DEFERRABLE).
- **Natural key vs surrogate key**: natural key có nghĩa nghiệp vụ ({{invoice_no}}); surrogate key là id kỹ thuật ({{BIGINT}}). Trộn lẫn chiến lược "replace theo natural key" với quản lý entity theo id dễ gây lỗi ActionQueue.
- **orphanRemoval**: xóa phần tử khỏi collection cha → Hibernate coi con là "mồ côi" và xóa row con khi flush.

### Bước 2: Cơ chế ActionQueue (ý chính) và vì sao có insert→delete
Hibernate ưu tiên **INSERT** để đảm bảo entity mới có hàng trong DB trước khi các bước khác cần tham chiếu (giảm lỗi FK trong nhiều đồ thị). **DELETE** thường chạy muộn. Điều này tối ưu cho case phổ biến nhưng phá case tái sử dụng unique key.
~~~text
Unit of Work: remove(old: email=a) ; persist(new: email=a)
Code order:   [remove, persist]
Flush order:  (có thể) [INSERT new(a)] -> FAIL unique -> [DELETE old] chưa chạy
~~~

### Bước 3: Biến thể góc sâu

**(A) orphanRemoval collection — thay thế phần tử cùng mã nghiệp vụ**
~~~java
@Entity class Contract {
  @OneToMany(mappedBy="contract", orphanRemoval=true, cascade=CascadeType.ALL)
  private Set<ContractLine> lines = new HashSet<>();
}
// replace: lines.clear(); lines.add(newLine có lineNo trùng)
~~~
{{clear()}} tạo orphan removes, {{add()}} tạo inserts. Cùng {{UNIQUE(contract_id, line_no)}}, flush có thể insert line mới trước khi xóa line cũ → duplicate key. Xử lý: cập nhật entity line hiện có theo id/lineNo thay vì replace; hoặc {{flush()}} sau clear; hoặc merge theo khóa nghiệp vụ.

**(B) Đổi natural key "bằng replace"**
Tạo entity mới cùng natural key thay vì {{setNaturalKey()}} trên entity đang managed làm rối identity và ActionQueue. Nếu natural key **phải** đổi, ưu tiên UPDATE trên cùng row (kiểm tra unique target chưa bị dùng).

**(C) Soft delete + unique index**
{{@SQLDelete(sql="update users set deleted_at=now() where id=?")}} (Hibernate annotation — kiểm tra module/version) khiến {{remove()}} phát UPDATE, không DELETE. Nhưng {{UNIQUE(email)}} toàn bảng vẫn chặn tạo lại email dù bản cũ "đã xóa mềm". Hướng đúng (DB-specific): PostgreSQL partial unique index:
~~~sql
CREATE UNIQUE INDEX uq_users_email_active
  ON users(email) WHERE deleted_at IS NULL;
~~~
Như vậy email trùng chỉ bị cấm khi cả hai đều "active".

**(D) PostgreSQL {{DEFERRABLE INITIALLY DEFERRED}}**
~~~sql
ALTER TABLE users
  ADD CONSTRAINT uq_users_email UNIQUE (email) DEFERRABLE INITIALLY DEFERRED;
~~~
Kiểm tra unique bị dời đến **cuối transaction** (hoặc lúc {{SET CONSTRAINTS}}). Có thể cho phép pattern insert-trước/delete-sau trong cùng transaction nếu kết quả cuối cùng hợp lệ. Trade-off: lỗi phát hiện muộn, khó biết câu nào gây lỗi; không phải DB nào cũng hỗ trợ như nhau (MySQL khác); cần migration cẩn thận.

| Biến thể | Cơ chế gây lỗi | Hướng xử lý |
|---|---|---|
| {{remove}}+{{persist}} cùng unique | INSERT trước DELETE | {{flush()}} giữa, hoặc UPDATE |
| {{orphanRemoval}} replace | orphan delete vs insert | update phần tử, {{flush()}} sau clear |
| Soft delete + unique thường | unique vẫn chặn row đã xóa mềm | partial unique index ({{WHERE deleted_at IS NULL}}) |
| Muốn dời check | DB check sớm | DEFERRABLE (chỉ khi chấp nhận trade-off) |

### Trên production
- **Triệu chứng**: {{ConstraintViolationException}} (SQLState {{23505}} Postgres, {{1062}} MySQL) ngẫu nhiên theo timing; chỉ xảy ra ở luồng "đổi mã/đổi email"; test H2 pass nhưng Postgres fail.
- **Cách đo**: log {{org.hibernate.SQL}} xem thứ tự DML; integration test với Testcontainers (Postgres thật) tái hiện clear+add hoặc remove+persist; kiểm tra DDL index/constraint.
- **Tuning/cấu hình**: {{hibernate.order_inserts/order_updates}} **không** giải quyết insert-vs-delete unique; dùng {{em.flush()}} có chủ đích; với soft delete dùng partial index (Postgres) — kiểm tra tương thích DB.

> Senior tip: Khi code review thấy "xóa phần tử cũ rồi thêm phần tử mới có cùng mã nghiệp vụ", tôi coi là bug tiềm ẩn cho đến khi có (1) {{flush()}} tách pha, (2) chiến lược update-in-place, hoặc (3) bằng chứng constraint/index thiết kế đúng cho soft delete. Đừng tin thứ tự method Java.`,
  follow: [
    'Làm sao viết test Testcontainers tái hiện chắc chắn lỗi ActionQueue+unique thay vì flaky (ép flush/transaction boundary)?',
    'Partial unique index cho soft delete tương tác thế nào với {{@Where}}/{{@SQLRestriction}} (Hibernate 6) và với query native?',
    'DEFERRABLE constraint ảnh hưởng debugging và retry transaction thế nào (lỗi ném ở commit)?'
  ],
  tags: ['ActionQueue', 'flush', 'unique constraint', 'orphanRemoval', 'soft delete', 'DEFERRABLE', 'Hibernate internals'],
  refs: [
    { type: 'doc', title: 'Hibernate ORM User Guide: Flushing', url: 'https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#flushing' },
    { type: 'doc', title: 'PostgreSQL: Constraints (DEFERRABLE)', url: 'https://www.postgresql.org/docs/current/sql-createtable.html' }
  ]
}

,
{
  id: 'jpa-040',
  topic: 'jpa',
  level: 'senior',
  q: "Khi fetch quan hệ trong JPA/Hibernate, {{MultipleBagFetchException}} là gì, vì sao xảy ra, và bạn so sánh số query giữa {{@BatchSize}}/{{hibernate.default_batch_fetch_size}}, fetch {{SUBSELECT}}, và {{EntityGraph}} như thế nào?",
  a: `**Tóm tắt:** **Bag** trong Hibernate là collection không có chỉ số và không ràng buộc duy nhất phần tử (thường là {{List}} không {{@OrderColumn}}). Khi fetch join **hai bag** cùng lúc, SQL tạo tích Descartes (Cartesian product - mỗi tổ hợp dòng con nhân lên) và Hibernate không thể khử trùng chính xác cho cả hai {{List}} → ném {{MultipleBagFetchException}}. Để tránh N+1 (1 query cha + N query con), ba hướng chính: {{@BatchSize}}/batch_fetch_size (gom id vào {{IN}}, ≈ 1 + ceil(N/batch) query), {{SUBSELECT}} (1 query con dùng subselect id cha), {{EntityGraph}}/fetch join (thường 1 query nhưng cẩn thận row explosion và phân trang).

### Bước 1: Thuật ngữ (giải thích từ gốc)
- **N+1 problem** (vấn đề N+1): lấy 100 {{Order}} (1 query) rồi chạm {{order.getItems()}} từng order → thêm 100 query. Ví dụ đời thường: đi chợ 1 lần lấy danh sách 100 món, rồi quay lại 100 lần lấy từng món.
- **Fetch join** (JPQL {{join fetch o.items}}): ép Hibernate lấy dữ liệu quan hệ trong cùng câu SQL.
- **EntityGraph** (đồ thị thực thể): bản khai báo "lần query này hãy load thêm thuộc tính nào" - Hibernate sinh fetch plan tương ứng.
- **Bag vs Set**: {{Set}} (tập hợp) loại trùng theo {{equals/hashCode}}; {{List}} dạng bag cho phép trùng và khó tách dòng khi có hai bag nhân chéo.

### Bước 2: Vì sao {{MultipleBagFetchException}} xảy ra
~~~java
@Entity class Order {
  @OneToMany(mappedBy="order") List<OrderItem> items;   // bag 1
  @OneToMany(mappedBy="order") List<Payment> payments;  // bag 2
}
// JPQL: select o from Order o join fetch o.items join fetch o.payments
// -> Hibernate ném: MultipleBagFetchException
~~~
1. 1 order có 3 items và 2 payments → {{LEFT JOIN}} tạo 3 * 2 = **6 dòng**.
2. Hibernate phải gộp 6 dòng về 1 {{Order}} với 3 items và 2 payments.
3. Với **hai bag** song song, Hibernate không phân biệt được "dòng trùng do tích Descartes" với "phần tử trùng hợp lệ" → từ chối để bảo toàn tính đúng.
4. **Cách xử lý:** đổi một (hoặc cả hai) sang {{Set}} nếu nghiệp vụ cho phép ({{equals/hashCode}} đúng); hoặc tách 2 query trong cùng persistence context (Hibernate ghép nhờ L1 cache); hoặc {{@BatchSize}}/SUBSELECT.

### Bước 3: So sánh số query (ví dụ cụ thể)
Giả sử load **100 Order**; {{@BatchSize(size=25)}} hoặc {{hibernate.default_batch_fetch_size=25}}:
- **N+1:** 1 + 100 = **101 query**.
- **{{@BatchSize(size=25)}}:** 1 + ceil(100/25)=4 = **5 query**.
- **{{SUBSELECT}}:** 1 + 1 query con {{where order_id in (select o.id from orders ... subquery gốc)}} = **2 query**. Rủi ro: subquery gốc nặng.
- **JOIN FETCH 1 collection:** thường **1 query**. Join collection + phân trang có thể gây {{HHH000104}} (phân trang trong bộ nhớ).

| Chiến lược | Số query (100 cha) | Phân trang DB an toàn? | Row explosion | Ghi chú |
|---|---|---|---|---|
| N+1 | 101 | Có (query cha) | Không | Tránh |
| {{@BatchSize}}=25 | 5 | Có | Không | Lưới an toàn |
| SUBSELECT | 2 | Thường ổn | Không | Subquery nặng |
| JOIN FETCH 1 collection | 1 | **Rủi ro** | Có | Không kèm paging |
| EntityGraph | 1 hoặc theo plan | Tùy | Có nếu join | Linh hoạt |

### Trên production
- **Triệu chứng:** endpoint chậm tăng theo số bản ghi; log đầy {{select ... where id=?}}; {{HHH000104}}.
- **Cách đo:** {{spring.jpa.properties.hibernate.generate_statistics=true}} xem {{PrepareStatementCount}}; datasource-proxy/p6spy.
- **Cấu hình:** {{spring.jpa.properties.hibernate.default_batch_fetch_size: 50}} (khởi đầu 16-100, cần đo); danh sách phân trang dùng DTO/projection hoặc 2 bước (lấy id trang → fetch join theo id).

> Senior tip: Với API danh sách phân trang, tôi dùng DTO/projection hoặc 2 bước, tránh {{join fetch}} collection trực tiếp với paging. Bật {{default_batch_fetch_size}} là lưới an toàn, nhưng vẫn phải đo.`,
  follow: ["Tại sao đổi {{List}} sang {{Set}} có thể sửa {{MultipleBagFetchException}} nhưng lại tạo rủi ro nghiệp vụ (equals/hashCode, thứ tự)?", "Bạn xử lý thế nào khi cần load Order + Items có phân trang đúng ở DB (không phân trang trong bộ nhớ)?", "Sự khác nhau giữa {{FetchType.EAGER}} cố định và EntityGraph theo truy vấn về bảo trì lâu dài?"],
  tags: ["MultipleBagFetchException", "bag", "BatchSize", "default_batch_fetch_size", "subselect", "EntityGraph", "N+1"],
  refs: [{"type": "doc", "title": "Hibernate ORM User Guide: Fetching", "url": "https://docs.jboss.org/hibernate/orm/6.4/userguide/html_single/Hibernate_User_Guide.html#fetching"}]
},
{
  id: 'db-040',
  topic: 'db',
  level: 'senior',
  q: 'Chỉ mục B-tree hoạt động bên trong thế nào: trang (page), fan-out, chiều cao cây, quét chỉ mục (index-only scan) và visibility map của PostgreSQL? Tại sao khóa chính UUID v4 ngẫu nhiên làm chỉ mục phình to và chậm hơn so với UUID v7 hay khóa tăng dần?',
  a: `**Tóm tắt:** Chỉ mục B-tree (hiện đại thường là biến thể B+tree) là cây cân bằng, mỗi nút của cây là một trang dữ liệu (page) – 8KB ở PostgreSQL, 16KB ở InnoDB/MySQL. Mỗi trang chứa vài trăm khóa nên cây chỉ cao 3–4 tầng cho hàng trăm triệu dòng, và tìm một dòng chỉ tốn vài lần đọc trang thay vì quét bảng. Nút lá được nối thành danh sách nên truy vấn khoảng (BETWEEN) và sắp xếp cũng tận dụng được chỉ mục. Composite index tuân theo quy tắc "cột trái nhất trước" (leftmost prefix): index (a, b, c) giúp khi lọc theo a, hoặc a và b, nhưng thường không giúp khi chỉ lọc theo b. Covering index chứa đủ cột mà câu hỏi cần nên cơ sở dữ liệu trả kết quả chỉ từ chỉ mục, không đọc bảng (index-only scan). PostgreSQL dùng visibility map (bản đồ đánh dấu trang heap mà mọi dòng đều hiển thị) để biết một trang chỉ mục có thể trả lời mà không nhìn vào bảng heap. UUID v4 ngẫu nhiên ghi vào các trang khắp nơi → tách trang (page split), chỉ mục phình lớn, hiệu quả bộ nhớ đệm kém; UUID v7 có thứ tự theo thời gian và khóa BIGINT tăng dần ghi liền kề ở mép phải → nhỏ gọn, ghi nhanh.

### Trang, fan-out, chiều cao cây
- **Trang (page)**: đơn vị đọc/ghi đĩa nhỏ nhất của cơ sở dữ liệu; một nút của cây B-tree là một trang. PostgreSQL dùng 8KB, InnoDB dùng 16KB.
- **Fan-out**: số lượng nhánh con của một nút. Trang 8–16KB chứa vài trăm khóa, nên mỗi nút có vài trăm nhánh.
- **Chiều cao**: nhờ fan-out lớn, 3 tầng đã chứa khoảng 500 × 500 × 500 ≈ 125 triệu khóa, 4 tầng chứa hàng chục tỷ khóa. Nút gốc gần như luôn nằm trong bộ nhớ đệm (buffer cache/buffer pool), nên tìm kiếm bắt đầu ngay trong RAM.
- **B+tree**: dữ liệu/con trỏ chỉ nằm ở nút lá, các nút lá nối liền nhau theo thứ tự khóa → quét khoảng và ORDER BY không quay lại gốc.

Ví dụ số liệu: bảng 100 triệu dòng, quét toàn bộ bảng (seq scan) đọc khoảng 1–2 triệu trang; tìm qua chỉ mục chỉ đọc 4–5 trang (gốc → nhánh → lá, rồi duyệt lá liền kề nếu là truy vấn khoảng).

### PostgreSQL: heap, TID và chỉ mục phụ
PostgreSQL lưu bảng dưới dạng heap (đống dữ liệu không bắt buộc sắp xếp). Chỉ mục lưu khóa cộng TID (số trang và vị trí dòng trong trang) để tìm lại dòng. Do đó chỉ mục phụ thường mất hai lần đọc: một lần vào chỉ mục, một lần vào heap lấy hàng. InnoDB khác: bảng chính là chỉ mục nhóm (clustered index) theo khóa chính, lá chứa toàn bộ dòng; chỉ mục phụ lưu khóa cộng giá trị khóa chính, nên đọc qua chỉ mục phụ cũng phải tra thêm một lần vào clustered index.

### Index-only scan và visibility map
Index-only scan xảy ra khi câu chọn chỉ các cột có trong chỉ mục, nên cơ sở dữ liệu không cần bước đọc heap. Ở PostgreSQL, điều này còn phụ thuộc visibility map: mỗi trang dữ liệu có một bit đánh dấu "tất cả dòng trên trang này đều nhìn thấy được đối với mọi giao dịch". Bit này được VACUUM cập nhật. Nếu bit chưa được cập nhật (giao dịch dài chặn vacuum, hoặc trang vừa được cập nhật nhiều lần), index-only scan vẫn phải vào heap kiểm tra tính nhìn thấy → cột Heap Fetches trong EXPLAIN (ANALYZE) sẽ cao thay vì bằng 0.

### UUID v4 so với UUID v7 và khóa tăng dần
| Loại khóa | Thứ tự ghi | Trang bị ảnh hưởng | Kích thước chỉ mục | Phù hợp |
|---|---|---|---|---|
| BIGINT sequence / identity | Tăng dần | Mép phải (liền kề) | Nhỏ gọn | Khóa chính phổ thông |
| UUID v7 | Theo thời gian | Nhóm theo thời gian | Nhỏ gọn | Hệ thống phân tán, cần thứ tự |
| UUID v4 | Ngẫu nhiên | Khắp cây | Phình to (page split) | Tránh làm khóa chính |

Ví dụ: chèn 10 triệu dòng UUID v4 vào khóa chính InnoDB. Mỗi dòng mới rơi vào một trang ngẫu nhiên; trang đầy thì InnoDB tách đôi, để lại khoảng nửa trang trống → chỉ mục có thể lớn gấp 2 lần so với khóa tăng dần, buffer pool đỡ chứa ít trang hơn, truy vấn đọc nhiều trang hơn. Khuyên dùng UUID v7 (tiêu chuẩn RFC 9562, có thông tin thời gian để sắp xếp) hoặc khóa BIGINT tăng dần; số chứng từ liên tục vẫn nên sinh riêng, không dùng khóa chính làm số chứng từ.

### Trên production
- Triệu chứng chỉ mục phình: chèn chậm dần, buffer pool hit rate tụt, chỉ mục lớn hơn bảng dữ liệu đáng kể.
- Cách đo: pg_stat_user_indexes (cột idx_scan = 0 trong thời gian dài → chỉ mục không dùng, hãy xóa), bộ mở rộng pgstattuple xem bloat, EXPLAIN xem Heap Fetches cao trên index-only scan.
- Khắc phục: đổi khóa chính sang UUID v7 hoặc khóa tăng dần (cần migration dữ liệu), hoặc đặt fillfactor thấp hơn (ví dụ 80) để để chỗ trong trang cho ghi ngẫu nhiên (chỉ PostgreSQL). REINDEX CONCURRENTLY để thu gom chỉ mục bị phình mà không khóa bảng đọc/ghi.

> Senior tip: khi nhận khiếu nại "insert chậm dần nhưng schema không đổi", hãy đo kích thước chỉ mục và tỉ lệ lấp đầy của trang trước khi đổ lỗi cho phần cứng hay mã ứng dụng. Một chỉ mục không dùng đến (idx_scan = 0 trong thời gian dài) vừa chiếm đĩa vừa làm chậm mọi câu ghi – hãy xóa nó.`,
  follow: [
    'Tại sao chỉ mục trên cột có ít giá trị khác nhau (cardinality thấp) thường không được dùng?',
    'Visibility map bị cũ thì index-only scan bị ảnh hưởng như thế nào, và VACUUM vai trò gì?',
    'UUID v7 khác UUID v1 ở điểm nào, và tại sao UUID v7 phù hợp làm khóa chính hơn UUID v4?'
  ],
  tags: ['B-tree', 'index-only scan', 'visibility map', 'UUID', 'page split', 'fan-out'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' },
    { type: 'doc', title: 'MySQL: InnoDB Index Types', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html' },
    { type: 'doc', title: 'RFC 9562: UUID Version 7', url: 'https://www.rfc-editor.org/rfc/rfc9562.html' }
  ]
},
{
  id: 'db-041',
  topic: 'db',
  level: 'lead',
  q: 'Commit trong cơ sở dữ liệu được bền vững thế nào: WAL, fsync và checkpoint? Tham số synchronous_commit và full_page_writes nghĩa gì, và vì sao nhiều giao dịch ghi lại làm checkpoint spikes (biến cố ghi ổ đĩa)?',
  a: `**Tóm tắt:** Khi ứng dụng lệnh COMMIT, cơ sở dữ liệu không trả "thành công" trước khi nhật ký thay đổi (WAL – Write-Ahead Log, hay redo log ở MySQL) đã được ghi xuống ổ cứng qua fsync; trang dữ liệu thực sự được ghi chậm sau bởi quy trình nền. Đây là lý do commit bền vững: mất điện sau khi nhận thông báo thành công, dữ liệu đã an toàn trong WAL và có thể replay lại khi khởi động. synchronous_commit quyết định commit chờ đến đâu: on (chờ fsync trên primary, an toàn nhất, chậm nhất), remote_write (chờ replica nhận WAL), remote_apply (chờ replica áp dụng xong, chậm nhất nhưng đọc replica ngay sau commit không lạc), off (không chờ, nhanh nhất nhưng có thể mất giao dịch vừa commit khi mất điện). full_page_writes ghi toàn bộ ảnh chụp trang vào WAL lần đầu trang bị sửa sau mỗi checkpoint, để phòng trang bị "rách" (torn page) khi hệ thống ngừng đột ngột giữa lúc ghi trang 8KB. Checkpoint spikes là hiện tượng nhiều trang đã sửa cùng lúc bị đẩy xuống đĩa trong khoảng thời gian ngắn → ổ đĩa bị ép, latency truy vấn nhảy cao.

### WAL và fsync, từng bước
1. Ứng dụng gửi COMMIT.
2. Cơ sở dữ liệu viết bản ghi WAL chứa mọi thay đổi của giao dịch.
3. Gọi fsync để buộc hệ điều hành ghi WAL từ bộ nhớ đệm xuống ổ cứng và đợi xác nhận.
4. Chỉ sau đó mới trả kết quả thành công cho ứng dụng. Vì sao: nếu mất điện vào thời điểm này, WAL vẫn an toàn trên đĩa.
5. Trang dữ liệu được ghi vào file dữ liệu sau đó bởi background writer và checkpoint, không phải ngay khi commit.

### synchronous_commit: các mức chính
Lưu ý: ngoài bốn mức trong bảng còn có {{local}} (chỉ chờ fsync trên primary, kể cả khi có replica đồng bộ). Khi đã cấu hình {{synchronous_standby_names}}, mức {{on}} còn chờ replica đồng bộ ghi WAL xuống đĩa của nó.
| Giá trị | Chờ đợi | Mất dữ liệu khi hỏng | Độ trễ commit |
|---|---|---|---|
| on (mặc định PostgreSQL) | fsync WAL trên primary | Giao dịch chưa fsync | Trung bình |
| remote_write | Replica đã nhận WAL | Cả primary và replica hỏng | Cao hơn |
| remote_apply | Replica đã áp dụng WAL | Cả primary và replica hỏng | Cao nhất |
| off | Không chờ | Giao dịch vừa commit chưa fsync (tối đa khoảng 3 lần wal_writer_delay) | Thấp nhất |

MySQL InnoDB tương đương: innodb_flush_log_at_trx_commit = 1 (fsync mỗi commit, an toàn), 2 (ghi vào bộ nhớ đệm hệ điều hành, fsync mỗi giây), 0 (không chờ, nhanh nhất, có thể mất 1 giây dữ liệu khi mất điện).

### full_page_writes và trang bị rách
Khi ghi một trang 8KB, hệ thống có thể ghi nửa mới nửa cũ nếu mất điện giữa chừng (trang rách – torn page), làm hỏng chỉ mục. PostgreSQL giảm rủi ro bằng cách, lần đầu một trang được sửa sau mỗi checkpoint, ghi toàn bộ ảnh chụp trang vào WAL (full_page_writes = on). Chi phí: WAL lớn hơn nhiều khi ghi nhiều. Có thể tắt nếu hệ thống file đảm bảo ghi nguyên trang (ví dụ ZFS), nhưng đối với hệ thống thường dùng nên để bật và không tắt mà không thử nghiệm kỹ.

### Checkpoint và tại sao spike
Checkpoint là quá trình đẩy trang đã sửa từ bộ nhớ đệm xuống file dữ liệu, rồi ghi vị trí bắt đầu replay WAL (điểm checkpoint) để crash recovery sau này chỉ cần replay WAL từ điểm đó. Điều khiển bởi checkpoint_timeout (mặc định 5 phút, checkpoint định kỳ), max_wal_size (mặc định 1GB, WAL quá lớn buộc checkpoint sớm), checkpoint_completion_target (mặc định 0.9 từ PostgreSQL 14, trước đó 0.5: trải việc ghi của checkpoint qua 90% khoảng thời gian giữa hai checkpoint). Khi hệ thống ghi nhiều: trang đã sửa dồn lên nhanh → checkpoint phải giải phóng lượng lớn trong ít thời gian → ổ đĩa bị ép, các truy vấn đọc/ghi bị chờ → latency nhảy (checkpoint spike). WAL cũng tăng cho đến khi checkpoint xong; nếu có replication slot bị treo, WAL không được xóa → thư mục pg_wal đầy (liên quan câu về WAL/slot CDC).

### Trên production
- Theo dõi: pg_stat_bgwriter đến PostgreSQL 16 (checkpoints_timed là định kỳ, checkpoints_req là do WAL đầy – nhiều checkpoints_req là dấu hiệu ghi quá nhiều; buffers_checkpoint là số trang checkpoint đã ghi); từ PostgreSQL 17 các cột này chuyển sang view pg_stat_checkpointer (num_timed, num_requested, buffers_written). Theo dõi thêm kích thước pg_wal và bật log_checkpoints.
- Nếu thấy spike: chia nhỏ batch ghi, tránh cập nhật cùng hàng lớn đồng thời, xem xét tăng max_wal_size (dùng nhiều dung lượng WAL để ít checkpoint hơn) và kiểm tra checkpoint_completion_target đang ở 0.9 (trên bản cũ hơn 14 thường cần đặt lại).
- Không bao giờ tắt fsync (PostgreSQL fsync = off) trên production: commit sẽ được báo thành công trước khi dữ liệu xuống đĩa, mất điện có thể làm hỏng dữ liệu, không chỉ mất giao dịch gần nhất.

> Senior tip: commit bền vững có giá tiền (mỗi commit chờ ổ cứng ghi, thường vài đến mười miligiây). Hãy nhóm nhiều thao tác vào một giao dịch thay vì commit từng dòng, và đặt synchronous_commit = off chỉ cho chức năng chịu được mất vài giao dịch gần nhất (ví dụ sự kiện theo dõi lượt nhấp, log hành vi) – không bao giờ dùng cho dữ liệu tiền tệ.`,
  follow: [
    'Tại sao commit chưa fsync lại có thể mất dữ liệu khi mất điện, và fsync = off nguy hiểm hơn thế nào?',
    'full_page_writes làm WAL tăng bao nhiêu, và khi nào có thể tắt một cách an toàn?',
    'checkpoints_req cao liên tục nói lên điều gì, và bạn xử lý ra sao?'
  ],
  tags: ['WAL', 'fsync', 'checkpoint', 'synchronous_commit', 'full_page_writes', 'PostgreSQL', 'MySQL'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Write-Ahead Logging (WAL)', url: 'https://www.postgresql.org/docs/current/wal-intro.html' },
    { type: 'doc', title: 'PostgreSQL: Runtime Config WAL', url: 'https://www.postgresql.org/docs/current/runtime-config-wal.html' },
    { type: 'doc', title: 'MySQL: InnoDB Redo Log', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-redo-log.html' }
  ]
},
{
  id: 'db-042',
  topic: 'db',
  level: 'senior',
  q: 'Trong MySQL InnoDB, tại sao chỉ mục phụ luôn dẫn trở lại chỉ mục nhóm, và gap lock / next-key lock ở mức REPEATABLE READ lại gây deadlock khi nhiều yêu cầu chèn dữ liệu cùng lúc? Đọc SHOW ENGINE INNODB STATUS thế nào để tìm nguyên nhân, và sửa thế nào?',
  a: `**Tóm tắt:** InnoDB lưu bảng dưới dạng chỉ mục nhóm (clustered index): nút lá của chỉ mục theo khóa chính chứa toàn bộ dữ liệu dòng, nên tìm theo khóa chính chỉ cần đi qua một cây. Chỉ mục phụ lưu các khóa của nó kèm giá trị khóa chính, nên đọc qua chỉ mục phụ mất hai bước: tìm trong chỉ mục phụ để có khóa chính, rồi tra clustered index để lấy toàn bộ dòng. Ở mức REPEATABLE READ (mặc định MySQL), InnoDB dùng khoá khoảng (gap lock) để chặn các dòng mới chèn vào khoảng đã đọc, và khoá next-key lock (khoá khoảng cộng bản ghi) để chặn cả bản ghi hiện tại. Deadlock khi chèn thường đến từ hai mẫu: (1) nhiều giao dịch cùng chèn một khóa duy nhất mà giao dịch giữ khóa đó rollback, các giao dịch đang chờ cùng giữ shared lock rồi cùng xin exclusive lock; (2) hai batch chèn/cập nhật các khóa theo thứ tự ngược nhau. MySQL chọn một giao dịch làm bị thương (victim), rollback và trả lỗi 1213 (SQLSTATE 40001); ứng dụng phải bắt lỗi và thử lại bằng giao dịch mới.

### Chỉ mục nhóm và chỉ mục phụ
- Chỉ mục nhóm: theo khóa chính (nếu không khai báo, InnoDB tạo khóa ẩn 6 byte). Lá chứa toàn bộ cột của dòng. Ứng dụng đọc theo khóa chính = một lần đi từ gốc xuống lá.
- Chỉ mục phụ: ví dụ chỉ mục trên cột customer_id. Lá chứa customer_id cộng giá trị id (khóa chính). Đọc đơn hàng của khách qua chỉ mục này: lần 1 tìm customer_id trong chỉ mục phụ lấy id; lần 2 tra clustered index theo id để lấy toàn bộ dòng. Vì vậy khóa chính nên gọn (BIGINT tăng dần), tránh UUID dài (khóa chính dài làm mọi chỉ mục phụ to thêm) – xem chi tiết câu về chỉ mục B-tree.
- Số liệu: truy vấn qua chỉ mục phụ thường tốn khoảng hai lần đọc trang so với truy vấn trực tiếp theo khóa chính.

### Khoá gap và next-key lock
InnoDB khoá hàng trên các bản ghi đã đọc/sửa, giữ tới khi commit. Ở REPEATABLE READ, để chặn "phantom" (dòng mới chèn vào khoảng đã đọc), InnoDB thêm:
- Khoá khoảng (gap lock): khoá khoảng trống giữa hai giá trị khóa trong chỉ mục, chặn chèn dòng mới vào khoảng đó.
- Khoá next-key lock: khoảng cộng bản ghi đầu tiên sau khoảng.
- Khoá chèn mục đích (insert intention lock): loại khoá đặc biệt khi chèn, không xung đột với nhau trong cùng khoảng, nhưng khi kiểm tra trùng khóa duy nhất mỗi giao dịch phải lấy khoá trên bản ghi đang được chèn của bên kia.

Deadlock ví dụ (ba yêu cầu cùng đặt mã đơn 'ORD-100', ví dụ có trong tài liệu MySQL):
~~~
T1: INSERT ... VALUES ('ORD-100')   -- chèn được, giữ X lock trên bản ghi mới (chưa commit)
T2: INSERT ... VALUES ('ORD-100')   -- phát hiện trùng khóa -> xin S lock trên bản ghi đó, CHỜ T1
T3: INSERT ... VALUES ('ORD-100')   -- tương tự, xin S lock, CHỜ T1
T1: ROLLBACK                         -- bản ghi biến mất, T2 và T3 cùng được cấp S lock
T2: muốn chèn -> cần X lock, nhưng T3 đang giữ S lock -> chờ T3
T3: muốn chèn -> cần X lock, nhưng T2 đang giữ S lock -> chờ T2   => VÒNG CHỜ
MySQL: phát hiện vòng, rollback một bên (victim), trả lỗi 1213, bên kia chèn thành công
~~~
Mẫu hay gặp không kém: T1 chèn khóa A rồi B, T2 chèn khóa B rồi A trong cùng transaction; sắp xếp khóa trước khi ghi là đủ để loại bỏ.

### Đọc SHOW ENGINE INNODB STATUS
Chạy SHOW ENGINE INNODB STATUS; và xem mục LATEST DETECTED DEADLOCK. Trong đó:
- TRANSACTION ... ACTIVE ... sec hai bên, với mysql tables in use 1, 2 lock struct(s).
- Mỗi bên liệt kê LOCK WAIT (đang chờ khoá nào) và LOCK (đã giữ khoá nào), kèm câu SQL đang chạy.
- WE ROLL BACK TRANSACTION (2) cho biết transaction nào là victim.
Dựa vào hai câu SQL và hai chỉ mục liên quan, bạn biết deadlock do khoá thứ tự gì (ví dụ hai INSERT cùng mã duy nhất) và sửa ở chỗ đúng.

### Cách sửa
1. Bắt lỗi và thử lại: deadlock là hiện tượng bình thường trong hệ thống tranh chấp. Bắt mã 1213 / SQLSTATE 40001 (Spring dịch thành PessimisticLockingFailureException hoặc CannotAcquireLockException), thử lại toàn bộ giao dịch mới với backoff + jitter, số lần tối đa 3–5.
2. Tránh chèn trùng khóa duy nhất: sinh mã duy nhất từ sequence/bộ đếm tập trung thay vì ngẫu nhiên, hoặc kiểm tra tồn tại trước khi chèn (luôn giữ thử lại vì có cuộc đua).
3. Giao dịch ngắn: không gọi API khác hay xử lý nặng bên trong giao dịch.
4. Nhiều dòng: sắp xếp theo khóa trước khi chèn batch để thứ tự khoá ổn định.

### Trên production
- Triệu chứng: lỗi 1213 bursts khi nhiều người cùng đặt hàng hoặc đăng ký mã duy nhất.
- Cách theo dõi: SHOW ENGINE INNODB STATUS khi cần chi tiết; information_schema.innodb_trx xem giao dịch mở lâu.
- Không khắc phục bằng cách tắt gap lock (đặt isolation READ COMMITTED) một cách tuỳ tiện: sẽ mất tính nhất quán phantom; chỉ đổi khi nghiệp vụ chấp nhận và đã hiểu hậu quả.

> Senior tip: deadlock không phải lỗi của cơ sở dữ liệu, mà là tín hiệu hai giao dịch đang tranh chấp tài nguyên theo thứ tự không ổn định. Mục tiêu không phải "không bao giờ deadlock" (không thể với ghi song song), mà là giảm tần suất và đảm bảo ứng dụng biết bắt lỗi và thử lại đúng cách.`,
  follow: [
    'Tại sao chỉ mục phụ của InnoDB luôn chứa giá trị khóa chính, và điều đó ảnh hưởng thế nào đến việc chọn khóa chính?',
    'Khi nào gap lock gây deadlock mà insert intention lock không đủ để phòng được?',
    'Làm sao phân biệt deadlock (1213) và lock wait timeout (1205) trong log MySQL?'
  ],
  tags: ['InnoDB', 'clustered index', 'gap lock', 'next-key lock', 'deadlock', 'REPEATABLE READ'],
  refs: [
    { type: 'doc', title: 'MySQL: InnoDB Index Types', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-index-types.html' },
    { type: 'doc', title: 'MySQL: InnoDB Locking', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-locking.html' },
    { type: 'doc', title: 'MySQL: InnoDB Deadlocks', url: 'https://dev.mysql.com/doc/refman/8.0/en/innodb-deadlocks.html' }
  ]
},
{
  id: 'db-043',
  topic: 'db',
  level: 'lead',
  q: 'Sizing pool kết nối HikariCP nên dựa trên công thức nào, và tại sao pool lớn hơn lại chậm hơn? maxLifetime nên quan hệ như thế nào với timeout của cơ sở dữ liệu và cân bằng tải?',
  a: `**Tóm tắt:** Kích thước pool nên dựa trên công việc thực tế, không phải số luồng của ứng dụng. Theo quy tắc Little's Law, số kết nối bận trung bình = số yêu cầu mỗi giây × thời gian giữ trung bình mỗi kết nối (giây). Ví dụ 400 yêu cầu/giây × 0,02 giây ≈ 8 kết nối bận cùng lúc; pool 15 trên mỗi instance là đủ cho đỉnh tải, pool 100 chỉ thêm tranh chấp trên cơ sở dữ liệu. Công thức tham khảo của HikariCP: pool ≈ (số lõi CPU của cơ sở dữ liệu × 2) + ổ đĩa hiệu dụng, bắt đầu 10–20 trên mỗi instance, và tổng pool của tất cả instance (tính cả lúc mở rộng tự động) phải nhỏ hơn max_connections của cơ sở dữ liệu (để lại khoảng 20% cho quản trị, replication, công cụ). Pool lớn hơn lại chậm hơn vì lý do hàng chờ: khi sử dụng gần 100%, thời gian chờ tăng vọt (hệ M/M/c); đồng thời quá nhiều truy vấn đồng thời làm chuyển đổi ngữ cảnh tăng, khóa trên cơ sở dữ liệu tranh chấp, và bộ nhớ đệm trang (buffer pool) bị xáo trộn vì từng truy vấn xóa trang của truy vấn khác. maxLifetime phải ngắn hơn thời gian ngắt kết nối im lặng của tường lửa/cơ sở dữ liệu (ví dụ 30 phút so với 60 phút) để Hikari tự thay mới kết nối trước khi bị cắt im lặng; nếu không, ứng dụng gặp lỗi "connection reset" ngẫu nhiên sau giờ thấp điểm.

### Công thức tham khảo
1. Xem max_connections của cơ sở dữ liệu và số instance: maximum-pool-size × số instance (tính cả pod tối đa khi mở rộng tự động) phải nhỏ hơn max_connections.
2. Tính theo lõi CPU của cơ sở dữ liệu: pool tham khảo ≈ (số lõi × 2) + số ổ đĩa hiệu dụng.
3. Bắt đầu với 10–20, rồi đo: thời gian chờ lấy kết nối, tỉ lệ timeout, throughput của cơ sở dữ liệu.
Ví dụ số liệu: 400 request/giây, mỗi request giữ kết nối 20ms → cần trung bình 8 kết nối bận (400 × 0,02).

### Tại sao pool lớn lại chậm
- Hàng chờ: sử dụng gần 100% thì thời gian chờ tăng phi tuyến, không tuyến tính.
- Chuyển đổi ngữ cảnh: cơ sở dữ liệu xử lý mỗi kết nối bằng một luồng/quá trình (PostgreSQL một quá trình mỗi kết nối), quá nhiều kết nối làm hệ điều hành liên tục chuyển ngữ cảnh, tốn CPU.
- Tranh chấp khóa và buffer pool: nhiều truy vấn cùng chạy xóa trang của nhau trong buffer pool, mức lỗi đọc từ đĩa tăng.
- Bộ nhớ: mỗi kết nối PostgreSQL chiếm vài megabyte RAM ngay cả khi không làm gì.

### Các timeout quan trọng
| Tham số | Ý nghĩa | Gợi ý |
|---|---|---|
| connection-timeout | Chờ tối đa bao lâu để có kết nối từ pool | Ngắn, 2–5 giây, fail nhanh |
| max-lifetime | Thời gian tối đa kết nối tồn tại trước khi bị đóng thay mới | Ngắn hơn giới hạn tường lửa/DB, ví dụ 30 phút so với 60 phút |
| idle-timeout | Thời gian kết nối rỗi mới được đóng (tối thiểu 10 giây) | 10 phút |
| leak-detection-threshold | Giữ kết nối quá lâu thì ghi stack trace nơi mượn | Bật, ví dụ 60 giây |

maxLifetime ngẫu nhiên hóa một chút (Hikari tự làm) để tránh hàng chục instance cùng thay mới kết nối cùng một lúc (thundering herd). maxLifetime cũng phải ngắn hơn wait_timeout của MySQL (mặc định 28.800 giây) và idle_session_timeout nếu PostgreSQL (14+) có đặt, để không giữ kết nối đã bị phía server đóng.

### Đo trên production
Theo dõi chỉ số HikariCP: hikaricp.connections.pending (số luồng đang chờ lấy kết nối), connections.usage (tỷ lệ sử dụng), connections.acquire (thời gian chờ). Nếu pending > 0 thường xuyên, không nên tăng pool ngay – hãy tìm giao dịch giữ kết nối lâu (Open Session In View, gọi API khác bên trong @Transactional), vì tăng pool chỉ đưa tắc nghẽn từ ứng dụng xuống cơ sở dữ liệu.

### Trên production
- Với luồng ảo (Java 21+): số luồng có thể rất lớn nhưng kết nối cơ sở dữ liệu vẫn hữu hạn → đặt pool nhỏ (thường 5–10), theo dõi pending; nhiều instance chia sẻ một cơ sở dữ liệu hãy cân nhắc PgBouncer hoặc RDS Proxy thay vì tăng pool ở mỗi instance.
- spring.jpa.open-in-view = true (mặc định) giữ kết nối suốt khi render JSON → pool cạn dù truy vấn nhanh. Hãy đặt false và load đủ dữ liệu trong dịch vụ.

> Senior tip: chỉ số quan trọng nhất của pool kết nối là thời gian chờ và số luồng đang chờ, không phải số kết nối hiện có. Pool lớn không làm cơ sở dữ liệu nhanh hơn; nó chỉ chia nhỏ thời gian CPU của cơ sở dữ liệu cho nhiều yêu cầu hơn. Khi thấy chờ kết nối, việc đầu tiên là tìm truy vấn giữ giao dịch lâu.`,
  follow: [
    'Theo quy tắc Little, 200 request/giây và giữ kết nối 50ms cần bao nhiêu kết nối trung bình?',
    'Tại sao maxLifetime phải ngắn hơn wait_timeout của DB và idle timeout của cân bằng tải?',
    'Virtual threads có nên dẫn đến pool kết nối lớn hơn không?'
  ],
  tags: ['HikariCP', 'connection pool', 'sizing', 'Quy tac Little', 'maxLifetime', 'leak detection'],
  refs: [
    { type: 'doc', title: 'HikariCP: About Pool Sizing', url: 'https://github.com/brettwooldridge/HikariCP/wiki/About-Pool-Sizing' },
    { type: 'doc', title: 'PostgreSQL: max_connections', url: 'https://www.postgresql.org/docs/current/runtime-config-connection.html#GUC-MAX-CONNECTIONS' },
    { type: 'doc', title: 'MySQL: max_connections', url: 'https://dev.mysql.com/doc/refman/8.0/en/server-system-variables.html#sysvar_max_connections' }
  ]
},
{
  id: 'db-044',
  topic: 'db',
  level: 'senior',
  q: 'Replication lag là gì, và sao sau khi ghi xong ứng dụng đọc replica lại không thấy dữ liệu vừa ghi? Bạn đo lag thế nào, và đảm bảo "đọc lại chính dữ liệu mình vừa ghi" (read-your-writes) trong Spring thế nào?',
  a: `**Tóm tắt:** Replication lag là khoảng thời gian giữa khi giao dịch commit trên primary (node ghi) và khi dữ liệu đó được ghi vào replica (node chỉ đọc). Vì nó, người dùng vừa chuyển tiền xong làm mới màn hình mà không thấy giao dịch – bản ghi chưa kịp được dẫn truyền từ primary sang replica. Dẫn truyền vật lý (streaming replication, mặc định PostgreSQL/MySQL) hoạt động bất đồng bộ: primary viết WAL/redo log, rồi đưa các bản ghi WAL qua mạng cho replica replay. Vì vậy commit trên primary trả thành công ngay, không cần chờ replica; lag có thể là vài miligiây đến vài phút tùy tải và tốc độ ổ đĩa replica. Đảm bảo đọc lại chính dữ liệu mình vừa ghi (read-your-writes) bằng ba cách: đọc từ primary ngay sau khi ghi của chính người dùng đó, route dính session (sticky routing) trong một thời gian nhẹ sau khi ghi, hoặc chờ replica phát sinh đến vị trí WAL (LSN) đã ghi trước khi cho đọc replica. Dữ liệu tài chính (số dư, trạng thái đơn) nên luôn đọc primary.

### Dẫn truyền từng bước
1. Ứng dụng commit trên primary.
2. Primary viết thay đổi vào WAL và fsync, rồi trả thành công cho ứng dụng.
3. WAL sender trên primary gửi bản ghi WAL qua mạng cho WAL receiver trên replica.
4. Replica viết WAL nhận được vào ổ cứng của mình (flush), sau đó replay vào dữ liệu (trang dữ liệu được cập nhật).
5. Khoảng thời gian giữa bước 2 và bước 4 là replication lag.

### Đo lag thế nào
PostgreSQL: xem cột write_lsn, flush_lsn, replay_lsn trong view pg_stat_replication, so với pg_current_wal_lsn() trên primary (vị trí WAL hiện tại). Khoảng cách byte (hoặc pg_last_wal_replay_lsn() trên replica so với LSN đã ghi) cho biết lag. MySQL 8.0.22+: chạy SHOW REPLICA STATUS; trên replica, xem Seconds_Behind_Source (giây chậm so với primary) và so sánh Read_Source_Log_Pos với Exec_Source_Log_Pos (bản cũ: SHOW SLAVE STATUS với các trường *_Master_*). Seconds_Behind_Source chỉ là ước lượng; đo chính xác hơn bằng bảng heartbeat (ví dụ pt-heartbeat).

### Ba cách đảm bảo read-your-writes
1. Đọc primary sau khi ghi: đối với dữ liệu của chính người dùng (hồ sơ, số dư), luôn đọc primary trong vài giây sau khi ghi. Đơn giản và an toàn nhất.
2. Sticky routing: sau khi người dùng ghi, gán session của người đó đến primary trong khoảng thời gian (ví dụ 30 giây–5 phút), các request đọc của session này đi primary, hết khoảng thời gian đó mới về replica.
3. Cổng LSN: sau commit trên primary, ứng dụng lưu LSN vừa ghi (pg_current_wal_lsn()). Các đọc sau đó chỉ được route sang replica khi pg_last_wal_replay_lsn() trên replica lớn hơn hoặc bằng LSN đã lưu; nếu chưa, đọc primary. Triển khai trong Spring qua AbstractRoutingDataSource: chọn primary cho @Transactional ghi và các đọc kèm theo, replica cho @Transactional(readOnly = true) khi cổng LSN mở.

### Khi dùng dẫn truyền đồng bộ
synchronous_standby_names + synchronous_commit = remote_apply làm commit chờ replica áp dụng xong, do đó đọc replica ngay sau commit không bị lạc. Cái giá: latency commit tăng (chờ vòng qua mạng), và nếu không có replica đồng bộ sẵn sàng, commit có thể bị chặn.

### Trên production
- Triệu chứng lag: khiếu nại "vừa cập nhật không thấy", bản ghi mới trên primary chưa có trên replica khi báo cáo chạy replica.
- Nguyên nhân lag: replica chậm replay (CPU/ổ đĩa yếu hơn), mạng, giao dịch lớn giữ WAL, truy vấn dài trên replica bị hủy do tranh chấp recovery (canceling statement due to conflict with recovery), replication slot bị treo giữ WAL không được xóa (thư mục pg_wal tăng, liên quan câu về WAL/slot CDC).
- Cách khắc phục: nâng cấp replica, chia nhỏ giao dịch lớn, bật hot_standby_feedback = on nếu chấp nhận replica trễ hơn để bảo vệ truy vấn dài, theo dõi pg_replication_slots và xóa slot không dùng.

> Senior tip: đừng để mọi đọc đều đi replica theo kiểu "mất dữ liệu vài giây cũng được" mà không hỏi stakeholder. Dữ liệu tài chính và thao tác ngay sau khi ghi của chính người dùng phải đọc primary; phần phân tích, báo cáo, dashboard nội bộ thì đọc replica kèm thông báo "dữ liệu có thể trễ vài phút". Trong Spring, hãy xác định rõ nguồn dữ liệu bằng AbstractRoutingDataSource thay vì để mỗi dịch vụ tự đoán.`,
  follow: [
    'Tại sao commit trên primary trả thành công ngay dù replica chưa có dữ liệu, và điều đó có vấn đề gì?',
    'pg_last_wal_replay_lsn() và pg_current_wal_lsn() dùng để làm gì khi đo lag?',
    'Khi nào nên chọn dẫn truyền đồng bộ (synchronous_commit = remote_apply) thay vì bất đồng bộ?'
  ],
  tags: ['replication lag', 'read-your-writes', 'streaming replication', 'LSN', 'pg_stat_replication', 'AbstractRoutingDataSource'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Streaming Replication', url: 'https://www.postgresql.org/docs/current/warm-standby.html#STREAMING-REPLICATION' },
    { type: 'doc', title: 'PostgreSQL: pg_stat_replication', url: 'https://www.postgresql.org/docs/current/monitoring-stats.html#PG-STAT-REPLICATION-VIEW' },
    { type: 'doc', title: 'MySQL: Replication', url: 'https://dev.mysql.com/doc/refman/8.0/en/replication.html' }
  ]
},
{
  id: 'db-045',
  topic: 'db',
  level: 'lead',
  q: 'Phân vùng theo thời gian (range partitioning) giúp gì và khi nào lại không giúp? Hãy nói về partition pruning, xóa dữ liệu cũ, và những ràng buộc trên khóa chính/chỉ mục duy nhất.',
  a: `**Tóm tắt:** Phân vùng chia một bảng lớn thành nhiều phân vùng nhỏ, mỗi phân vùng chứa một phạm vi dữ liệu (ví dụ bảng đơn hàng 800 triệu dòng, mỗi tháng một phân vùng theo created_at). Khi câu truy vấn có điều kiện trên cột phân vùng, trình lập kế hoạch thực hiện partition pruning (cắt phân vùng): loại bỏ các phân vùng chắc chắn không chứa dữ liệu khớp, chỉ quét các phân vùng liên quan. Lợi ích lớn nhất là xóa dữ liệu cũ bằng DROP hoặc DETACH phân vùng (milli giây, không ghi WAL hàng triệu dòng, không làm bloat bảng) thay vì DELETE hàng triệu dòng. Mỗi phân vùng nhỏ hơn nên chỉ mục vừa vào bộ nhớ đệm, vacuum sớm xong. Phân vùng không giúp khi truy vấn không có cột phân vùng (phải quét tất cả phân vùng, thường kém hơn bảng thông thường), khi quá nhiều phân vùng nhỏ (thời gian lên kế hoạch và bộ nhớ tăng), hoặc khi phân vùng mặc định (DEFAULT) trở thành bệ chứa mọi thứ. Ràng buộc quan trọng: khóa chính và chỉ mục duy nhất phải chứa cột phân vùng, nên khóa chính thành (id, created_at), và mọi truy cập theo id độc lập cần biết thời gian hoặc quét tất cả phân vùng.

### Phân vùng và partition pruning
Ví dụ bảng đơn hàng phân vùng theo tháng:
~~~
orders_2026_01  orders_2026_02  ...  orders_2026_06
(created_at 01/2026) (02/2026) ... (06/2026)
~~~
Câu SELECT * FROM orders WHERE created_at >= '2026-05-01' AND created_at < '2026-06-01' chỉ quét phân vùng tháng 5 (PostgreSQL còn có runtime pruning khi tham số chỉ được biết lúc chạy, ví dụ prepared statement). Câu không có điều kiện thời gian, ví dụ WHERE customer_id = ?, phải quét tất cả phân vùng.

### Khi phân vùng giúp
- Xóa dữ liệu cũ: DETACH PARTITION rồi DROP TABLE mất vài mili giây cho hàng trăm triệu dòng, không sinh WAL hàng triệu dòng và không làm replica trễ; tương đương DELETE có thể mất vài giờ, sinh WAL khổng lồ và để lại bloat.
- Chỉ mục vừa bộ nhớ: chỉ mục mỗi phân vùng nhỏ, nhiều khả năng nằm trong buffer pool → truy vấn nhanh hơn.
- Vacuum và bảo trì nhỏ gọn: từng phân vùng một, không khóa toàn bảng lâu.
- Partition-wise join/aggregate (PostgreSQL 11+): join hai bảng phân vùng theo cùng khóa có thể thực hiện từng cặp phân vùng.

### Khi phân vùng không giúp (và có thể hại)
| Tình huống | Tại sao |
|---|---|
| Truy vấn không có cột phân vùng | Quét tất cả phân vùng, có thêm chi phí mở từng phân vùng |
| Quá nhiều phân vùng nhỏ (vài nghìn) | Thời gian lên kế hoạch tăng, bộ nhớ dùng nhiều, plan kém |
| Phân vùng DEFAULT nhận dư | Các giá trị không khớp nào cũng rơi vào DEFAULT, bảng này lớn không kiểm soát |
| Truy cập theo khóa chính không kèm thời gian | Khóa chính phải chứa cột phân vùng → truy cập theo id đơn lẻ quét nhiều phân vùng |
| Join phân vùng với bảng không phân vùng | Tối ưu hóa kém, có thể không dùng partition-wise |

### Điều vận hành
- Tạo phân vùng sẵn cho tháng tới bằng công việc định kỳ, đừng đợi dữ liệu mới tạo phân vùng ngay lúc ghi (tránh chờ khóa schema).
- Theo dõi số dòng trong phân vùng DEFAULT; nếu lớn, nghĩa là thiết kế cột phân vùng sai hoặc có giá trị ngoài dự kiến.
- Trước khi DROP, hãy DETACH và giữ bảng tách ra một thời gian để rollback nếu cần.
- MySQL 8 phân vùng gốc (native partitioning): mỗi phân vùng là một file tablespace riêng, khóa duy nhất/khóa chính cũng phải chứa cột phân vùng, và bảng phân vùng không hỗ trợ khóa ngoại (foreign key).

### Trên production
- Triệu chứng phân vùng sai: truy vấn theo customer_id trên bảng 800 triệu dòng chậm hơn sau khi phân vùng (vì quét 72 phân vùng).
- Cách kiểm chứng: EXPLAIN (ANALYZE, BUFFERS) xem plan có node Append với ít phân vùng (đúng) hay quét toàn bộ (sai).
- Khi nào không nên phân vùng: bảng dưới vài chục triệu dòng, truy vấn chủ yếu theo khóa ngẫu nhiên, hoặc đội chưa sẵn sàng vận hành thêm phân vùng.

> Senior tip: phân vùng là công cụ vận hành (xóa dữ liệu cũ, chia chỉ mục) nhiều hơn là công cụ làm truy vấn nhanh. Hãy chỉ phân vùng khi bảng lớn đến mức DELETE dữ liệu cũ hằng tháng làm replica trễ hay vacuum không kịp, và khi phần lớn truy vấn nóng đều lọc theo cột thời gian. Nếu không chắc, hãy bắt đầu bằng chỉ mục tốt và lưu trữ bảng lịch sử sang bảng phân vùng riêng sau.`,
  follow: [
    'Tại sao khóa chính của bảng phân vùng phải chứa cột phân vùng, và hậu quả của điều đó là gì?',
    'Partition pruning chạy ở thời điểm lập kế hoạch hay khi chạy truy vấn, và khác nhau thế nào?',
    'Phân vùng DEFAULT là gì, và tại sao nó có thể trở thành bẫy hiệu năng?'
  ],
  tags: ['partitioning', 'range partitioning', 'partition pruning', 'DETACH PARTITION', 'DEFAULT partition', 'PostgreSQL', 'MySQL'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Partitioning', url: 'https://www.postgresql.org/docs/current/ddl-partitioning.html' },
    { type: 'doc', title: 'PostgreSQL: ALTER TABLE', url: 'https://www.postgresql.org/docs/current/sql-altertable.html' },
    { type: 'doc', title: 'MySQL: Partitioning', url: 'https://dev.mysql.com/doc/refman/8.0/en/partitioning.html' }
  ]
},
{
  id: 'db-046',
  topic: 'db',
  level: 'senior',
  q: 'Index-only scan là gì, và sao đôi khi EXPLAIN vẫn cho thấy đọc heap (Heap Fetches cao)? Visibility map và VACUUM liên quan thế nào, và index bloat được xử lý ra sao?',
  a: `**Tóm tắt:** Index-only scan trả kết quả trực tiếp từ chỉ mục, không đọc bảng dữ liệu (heap). Để xảy ra, hai điều kiện: (1) mọi cột câu lệnh cần đều nằm trong chỉ mục (covering index; PostgreSQL 11+ dùng INCLUDE, InnoDB secondary index đã chứa khóa chính), và (2) ở PostgreSQL, tất cả dòng trên trang heap đều được đánh dấu "hết hạn nhìn thấy cho mọi giao dịch" trong visibility map (VM). VM được VACUUM cập nhật; giao dịch dài chặn VACUUM → VM cũ → index-only scan vẫn phải vào heap kiểm tra (cột Heap Fetches trong EXPLAIN ANALYZE cao thay vì bằng 0). Index bloat: các entry trỏ tới phiên bản dòng cũ chưa được dọn làm chỉ mục lớn hơn cần thiết, quét chậm và tốn RAM. Khắc phục: autovacuum đúng mức, VACUUM FULL (dùng khoá bảng, cần downtime), pg_repack (trực tuyến), REINDEX CONCURRENTLY (chỉ mục), và fillfactor để để chỗ trong trang cho cập nhật (HOT update không sửa chỉ mục).

### Index-only scan là gì
Thay vì chỉ mục → heap → trả dòng, cơ sở dữ liệu chỉ đọc chỉ mục và trả ngay. Ví dụ chỉ mục (customer_id, created_at) INCLUDE (amount) cho câu SELECT customer_id, created_at, amount FROM orders WHERE customer_id = ? trả lời hoàn toàn từ chỉ mục. Ở MySQL/InnoDB, chỉ mục phụ đã chứa giá trị khóa chính, nên nếu câu chọn chỉ các cột trong chỉ mục phụ cộng khóa chính, cũng có thể index-only scan.

### Visibility map (PostgreSQL)
Mỗi trang heap có một bit trong visibility map đánh dấu "mọi dòng trên trang này đều nhìn thấy được cho mọi giao dịch hiện tại và sau này". Bit này được đặt bởi VACUUM khi xác định các phiên bản dòng trên trang đã đủ cũ (không có giao dịch nào chạy lâu hơn cần xem chúng).
- Nếu VM mới: index-only scan bỏ qua heap, Heap Fetches = 0.
- Nếu VM cũ (trang vừa được cập nhật, hoặc giao dịch dài chặn VACUUM dọn trang): index-only scan vẫn phải đọc heap xem từng dòng có nhìn thấy được không → Heap Fetches cao.
Ví dụ số liệu: bảng 50 triệu dòng, index-only scan lý tưởng đọc 2.000 trang chỉ mục; nếu VM cũ, hệ thống đọc thêm 2.000 trang heap → latency gấp đôi.

### Index bloat và VACUUM
PostgreSQL không ghi đè dòng cũ khi cập nhật: nó chèn bản mới và đánh dấu bản cũ "chết" (dead tuple). Các bản chết trong chỉ mục vẫn được quét cho đến khi VACUUM dọn. Index bloat xảy ra khi:
- Giao dịch dài giữ snapshot cũ → VACUUM không dọn được bản chết liên quan.
- Cập nhật (không phải HOT) tạo phiên bản dòng mới nên mọi chỉ mục đều có thêm entry mới, entry cũ phải chờ VACUUM dọn.
- pg_stat_user_tables cột n_dead_tup cho biết số bản chết chờ dọn.

### Xử lý trên production
- VACUUM (không khoá đọc/ghi): dọn bản chết, có thể tái sử dụng không gian trong file nhưng không thu nhỏ file.
- VACUUM FULL: viết lại toàn bảng, thu nhỏ file, nhưng cần khoá ACCESS EXCLUSIVE (không đọc/ghi được trong suốt thời gian chạy) → thường chạy giờ thấp điểm.
- pg_repack: viết lại bảng và chỉ mục trực tuyến, không khoá lâu, cần thêm không gian đĩa bằng kích thước bảng.
- REINDEX CONCURRENTLY: xây lại chỉ mục bị bloat mà không khóa đọc/ghi chỉ mục (chỉ PostgreSQL), cần nhiều CPU/I/O trong thời gian xây.
- fillfactor: đặt thấp hơn 100 (ví dụ 80) trên bảng có cập nhật thường xuyên để để chỗ trong trang; cập nhật không đổi cột chỉ mục thì dùng HOT (Heap-Only Tuple), không phải cập nhật chỉ mục → ít bloat hơn.

### Trên production
- Triệu chứng bloat: bảng 50GB nhưng dữ liệu thực 30GB; chỉ mục quét chậm; Heap Fetches cao trên index-only scan.
- Cách đo: pg_stat_user_tables (n_dead_tup, last_vacuum, last_autovacuum), bộ mở rộng pgstattuple xem bloat chính xác.
- Phòng ngừa: điều chỉnh autovacuum_vacuum_scale_factor (giảm xuống 0,02–0,05 cho bảng cập nhật nhiều) và autovacuum_vacuum_insert_scale_factor cho bảng chỉ chèn không cập nhật.

> Senior tip: index-only scan nhanh chứ không phải miễn phí tĩnh – nó phụ thuộc VACUUM chạy kịp. Khi thấy "index-only scan vẫn đọc heap nhiều", hãy kiểm tra transaction dài (pg_stat_activity, xact_start) chặn vacuum trước khi đổ lỗi cho chỉ mục.`,
  follow: [
    'Tại sao index-only scan có thể vẫn đọc heap mặc dù chỉ mục chứa đủ cột cần thiết?',
    'VACUUM FULL và pg_repack khác nhau ở điểm nào, và khi nào dùng cái nào?',
    'HOT (Heap-Only Tuple) là gì và giúp giảm index bloat như thế nào?'
  ],
  tags: ['index-only scan', 'visibility map', 'VACUUM', 'index bloat', 'REINDEX CONCURRENTLY', 'fillfactor', 'PostgreSQL'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' },
    { type: 'doc', title: 'PostgreSQL: Routine Vacuuming', url: 'https://www.postgresql.org/docs/current/routine-vacuuming.html' }
  ]
},
{
  id: 'db-047',
  topic: 'db',
  level: 'senior',
  q: 'Transaction ID wraparound là gì, và sao PostgreSQL có thể ép cơ sở dữ liệu về chế độ chỉ đọc nếu không vacuum kịp? MySQL có vấn đề tương tự không, và phòng ngừa như thế nào?',
  a: `**Tóm tắt:** PostgreSQL dùng mã giao dịch (XID) 32-bit (khoảng 2 tỷ giá trị) để đánh dấu phiên bản mỗi dòng (cột ẩn xmin, xmax). Trước khi XID vòng quay về đầu, mọi phiên bản dòng cũ phải được "đóng băng" (freeze) bằng XID đặc biệt, nếu không cơ sở dữ liệu sẽ không biết phiên bản nào cũ, phiên bản nào mới, và để bảo vệ dữ liệu nó ép toàn bộ cơ sở dữ liệu về chế độ chỉ đọc cho đến khi vacuum xong – sự cố nghiêm trọng. VACUUM và autovacuum freeze là cơ chế phòng ngừa, nhưng giao dịch dài giữ XID cũ làm tiến độ freeze bị kẹt. MySQL không có vấn đề XID vòng quay; thay vào đó, các bản cũ được lưu trong undo log và dọn bởi luồng purge, nên giao dịch dài làm lịch sử purge (History list length) tăng và có thể khống chế ghi (innodb_max_purge_lag). Phòng ngừa chung: giữ giao dịch ngắn, đặt thời gian ngắt kết nối im lặng, theo dõi oldest_xid (PostgreSQL) và History list length (MySQL).

### XID và tại sao 2 tỷ là ngưỡng hiểm
Mỗi phiên bản dòng trong PostgreSQL lưu xmin (giao dịch tạo ra) và xmax (giao dịch xóa/thay thế). XID là số 32-bit, khoảng 2 tỷ giao dịch. Khi hệ thống chạy đủ 2 tỷ giao dịch, XID quay lại giá trị ban đầu. Nếu chưa freeze, hệ thống không phân biệt được phiên bản cũ và mới → dữ liệu có thể bị hiểu nhầm. Do đó PostgreSQL bắt buộc freeze (đặt xmin/xmax thành XID đặc biệt "frozen") cho các phiên bản cũ đủ lâu trước khi wraparound xảy ra.

### Vacuum freeze và sự cố chỉ đọc
VACUUM quét bảng, freeze các phiên bản cũ, và cập nhật datfrozenxid của cơ sở dữ liệu (XID cũ nhất chưa freeze). Các ngưỡng quan trọng:
- autovacuum_freeze_max_age (mặc định 200 triệu giao dịch): bắt đầu autovacuum freeze tập trung.
- vacuum_failsafe_age (PostgreSQL 14+, mặc định 1,6 tỷ): autovacuum chuyển sang chế độ khẩn cấp, bỏ qua giới hạn tốc độ để freeze cho kịp.
- Khi chỉ còn khoảng 40 triệu XID trước điểm wraparound, PostgreSQL ghi cảnh báo vào log ở mỗi giao dịch; khi chỉ còn khoảng 3 triệu, nó từ chối mọi lệnh cấp XID mới (không ghi được) cho tới khi VACUUM freeze xong.
- Giao dịch dài (ví dụ @Transactional mở hàng giờ, công cụ SQL để mở ở chế độ manual commit) giữ xmin cũ → VACUUM không freeze được bản cần → oldest_xid dừng lại, tiến gần ngưỡng wraparound.

### MySQL đường khác: purge lag
MySQL InnoDB không dùng XID 32-bit cho phiên bản dòng theo cách đó, nên không có wraparound ép chỉ đọc. Thay vào đó:
- Bản cũ lưu trong undo log; luồng purge dọn undo log khi không còn giao dịch nào cần.
- Giao dịch dài → purge không kịp → History list length trong SHOW ENGINE INNODB STATUS tăng (số bản undo chờ dọn).
- Nếu quá cao, InnoDB khống chế các câu ghi (innodb_max_purge_lag, mặc định 0 = không khống chế), và các truy vấn đọc phải lần qua nhiều phiên bản undo → chậm dần.

### Phòng ngừa và theo dõi
PostgreSQL:
- Giữ giao dịch ngắn, tránh @Transactional bao các lời gọi HTTP chậm.
- Đặt idle_in_transaction_session_timeout (ví dụ 60 giây) để ngắt session quên commit.
- Theo dõi SELECT datname, age(datfrozenxid) FROM pg_database; (cảnh báo khi vượt khoảng 500 triệu và tăng đều) và pg_stat_activity tìm giao dịch chạy lâu, cùng replication slot và prepared transaction bị bỏ quên (cũng giữ XID cũ).
- Vacuum thường xuyên cho bảng cập nhật nhiều; có thể giảm autovacuum_vacuum_scale_factor xuống 0,02–0,05.

MySQL:
- Giữ giao dịch ngắn; information_schema.innodb_trx xem giao dịch mở lâu.
- Theo dõi SHOW ENGINE INNODB STATUS mục History list length; nếu cao liên tục, xem xét innodb_max_purge_lag và tối ưu hóa truy vấn dài.

### Trên production
- Triệu chứng PostgreSQL: lỗi "database is not accepting commands to avoid wraparound data loss", ứng dụng viết bị từ chối.
- Cách cứu: chạy VACUUM (hoặc VACUUM FREEZE) trên các bảng bị kẹt; sau sự cố, sửa giao dịch dài là nguyên nhân gốc.
- Triệu chứng MySQL: History list length tăng lên hàng nghìn, throughput ghi giảm, truy vấn đọc chậm dần.

> Senior tip: wraparound không xảy ra do dữ liệu quá lớn, mà do "giao dịch chạy quá lâu". Một phiên SQL mở transaction rồi bỏ quên (công cụ quản trị để chế độ manual commit, code quên commit) có thể chặn freeze suốt nhiều ngày và đẩy cả hệ thống tới nguy cơ ngừng ghi. Quy tắc vàng: mọi transaction trong code ứng dụng phải ngắn, và có cảnh báo tự động khi transaction mở quá 60 giây.`,
  follow: [
    'Tại sao PostgreSQL buộc phải freeze các phiên bản dòng cũ trước khi XID vòng quay?',
    'Giao dịch dài (@Transactional mở hàng giờ) ảnh hưởng thế nào đến oldest_xid và vacuum?',
    'MySQL không có wraparound, nhưng giao dịch dài vẫn gây vấn đề gì ở InnoDB?'
  ],
  tags: ['XID wraparound', 'freeze', 'VACUUM', 'oldest_xid', 'purge lag', 'History list length', 'PostgreSQL', 'MySQL'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Routine Vacuuming', url: 'https://www.postgresql.org/docs/current/routine-vacuuming.html' },
    { type: 'doc', title: 'PostgreSQL: pg_database View', url: 'https://www.postgresql.org/docs/current/monitoring-stats.html#PG-DATABASE-VIEW' },
    { type: 'doc', title: 'MySQL: SHOW ENGINE', url: 'https://dev.mysql.com/doc/refman/8.0/en/show-engine.html' }
  ]
},
{
  id: 'db-048',
  topic: 'db',
  level: 'senior',
  q: 'Database chậm nhưng không ai biết query nào cần tối ưu trước. Bạn dùng pg_stat_statements, slow query log, auto_explain và APM thế nào để tìm đúng thủ phạm?',
  a: `**Tóm tắt:** Không tối ưu theo cảm giác. Tôi tìm query tốn **tổng thời gian DB** nhiều nhất (không phải query chậm nhất một lần) bằng **pg_stat_statements**, lấy **kế hoạch thực tế** của câu chậm bằng **auto_explain** hoặc {{EXPLAIN (ANALYZE, BUFFERS)}} trên bản sao, nối với **trace APM** để biết API nào gọi nó và gọi bao nhiêu lần mỗi request, rồi ưu tiên theo **tác động** (thời gian × tần suất × mức quan trọng của API).

### Vì sao "tổng thời gian" quan trọng hơn "chậm nhất"
| Query | Thời gian mỗi lần | Số lần/giờ | Tổng/giờ |
|---|---|---|---|
| Báo cáo tháng | 4 giây | 6 | 24 giây |
| Đếm giỏ hàng | 3 ms | 2.000.000 | 6.000 giây |
Query thứ hai "nhanh" nhưng chiếm DB gấp 250 lần. Tối ưu nó (cache, index) có tác động lớn nhất.

### Công cụ và cách dùng
- **pg_stat_statements** (extension, nạp qua {{shared_preload_libraries}}): thống kê gộp theo dạng câu lệnh (tham số được chuẩn hoá thành $1, $2).
~~~sql
SELECT left(query, 80) AS q, calls,
       round(total_exec_time) AS total_ms, round(mean_exec_time, 1) AS mean_ms,
       rows, shared_blks_read                     -- block phải đọc từ đĩa
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;
~~~
Chụp lại định kỳ (hoặc {{pg_stat_statements_reset()}} đầu kỳ) để so trước/sau một release.
- **Slow query log**: {{log_min_duration_statement = 500}} ghi câu chạy lâu hơn 500ms kèm tham số thật — để tái hiện.
- **auto_explain**: ghi luôn **kế hoạch thực thi** của câu chậm ({{auto_explain.log_min_duration}}, {{log_analyze}} cẩn thận vì tốn chi phí) — rất quý vì kế hoạch trên production có thể khác staging.
- **APM / tracing**: cho biết API nào sinh ra query, mỗi request gọi bao nhiêu lần (lộ ra N+1), và query chiếm bao nhiêu phần trăm thời gian request.
- **pg_stat_activity, pg_locks**: lúc đang sự cố — ai đang chạy, ai đang chờ khoá, transaction nào treo.
- Với MySQL: Performance Schema / sys schema, slow query log + pt-query-digest. AWS RDS: Performance Insights cho bức tranh "DB load" theo câu lệnh và loại chờ.

### Quy trình
1. Lấy top 10–20 theo tổng thời gian.
2. Với mỗi câu: ai gọi (APM), gọi bao nhiêu lần, kế hoạch thực tế, số dòng ước lượng vs thực tế.
3. Phân loại nguyên nhân: thiếu index / điều kiện mất index / thống kê sai / N+1 / đọc thừa dữ liệu / khoá.
4. Sửa, đo lại cùng chỉ số; ghi lại kết quả.

### Ví dụ đời thực
DB của một sàn thương mại điện tử chạy CPU 85% giờ cao điểm; đội định nâng cấp instance (thêm khoảng 2.000 USD/tháng). Top pg_stat_statements: câu đếm sản phẩm trong giỏ 3ms nhưng gọi 1,8 triệu lần/giờ (37% tổng thời gian DB) — APM cho thấy header của mọi trang gọi nó; câu thứ hai là truy vấn danh sách đơn có Seq Scan. Cache số lượng giỏ hàng 30 giây ở Redis và thêm index composite cho câu thứ hai: CPU giờ cao điểm còn 40%, không cần nâng cấp.

### Trả lời mẫu khi phỏng vấn
"Tôi không đoán query nào chậm mà đo. Tôi dùng pg_stat_statements để lấy top câu lệnh theo tổng thời gian DB, vì câu vài mili giây gọi hàng triệu lần thường tốn hơn câu vài giây hiếm khi chạy. Với các câu đứng đầu, tôi lấy kế hoạch thực tế bằng auto_explain trên production hoặc EXPLAIN ANALYZE với BUFFERS trên bản sao, và dùng trace APM để biết API nào gọi nó, mỗi request gọi bao nhiêu lần, vì đó là cách lộ ra N+1. Slow query log cho tôi tham số thật để tái hiện. Sau đó tôi phân loại nguyên nhân, sửa, và đo lại đúng chỉ số đó. Tôi chụp top pg_stat_statements định kỳ để so trước và sau mỗi release, phát hiện câu vừa trở nên tệ hơn."

> Senior tip: thêm vào checklist release: so sánh top 20 pg_stat_statements trước và sau deploy một ngày. Đây là cách rẻ nhất phát hiện một câu ORM mới vô tình quét cả bảng trước khi nó thành sự cố.`,
  follow: [
    'Vì sao query nhanh trên staging lại chậm trên production?',
    'auto_explain với log_analyze bật có ảnh hưởng hiệu năng thế nào?',
    'Performance Insights trên RDS cho bạn thêm thông tin gì?'
  ],
  tags: ['performance', 'pg_stat_statements', 'auto_explain', 'observability', 'PostgreSQL']
},
{
  id: 'db-049',
  topic: 'db',
  level: 'senior',
  q: 'Có 60 pod Spring Boot, mỗi pod pool 20 connection, nhưng PostgreSQL chỉ chịu được khoảng 300 connection. Bạn dùng PgBouncer hoặc RDS Proxy thế nào, và những tính năng nào bị ảnh hưởng ở chế độ transaction pooling?',
  a: `**Tóm tắt:** 60 × 20 = 1.200 connection tiềm năng trong khi mỗi connection PostgreSQL là **một process** tốn RAM và CPU chuyển ngữ cảnh. Đặt **connection pooler** (PgBouncer, RDS Proxy) giữa ứng dụng và DB: ứng dụng mở nhiều connection "rẻ" tới pooler, pooler dùng **ít connection thật** tới DB. Ở chế độ **transaction pooling**, một connection DB chỉ thuộc về client trong **một transaction**, nên các tính năng gắn với **phiên (session)** bị ảnh hưởng: {{SET}} không có LOCAL, advisory lock theo phiên, {{LISTEN/NOTIFY}}, bảng tạm qua nhiều transaction, và prepared statement (tuỳ phiên bản pooler).

### Ba chế độ của PgBouncer
| Chế độ | Connection DB gắn với client trong | Tiết kiệm | Tương thích |
|---|---|---|---|
| session | Cả phiên | Ít | Đầy đủ |
| transaction | Một transaction | Nhiều | Mất tính năng theo phiên |
| statement | Một câu lệnh | Nhiều nhất | Không dùng được transaction nhiều câu |
Thực tế hầu như dùng **transaction**.

### Những gì cần sửa ở ứng dụng Java
- {{SET search_path}}, {{SET statement_timeout}} theo phiên → dùng {{SET LOCAL}} trong transaction, hoặc đặt ở mức role/database ({{ALTER ROLE app SET statement_timeout = '5s'}}).
- Advisory lock theo phiên ({{pg_advisory_lock}}) → dùng bản theo transaction ({{pg_advisory_xact_lock}}).
- Prepared statement phía server: driver pgjdbc tự chuyển sang server-side prepared sau vài lần thực thi ({{prepareThreshold}}, mặc định 5); với PgBouncer cũ cần {{prepareThreshold=0}}. PgBouncer từ 1.21 hỗ trợ prepared statement ở chế độ transaction ({{max_prepared_statements}}) — kiểm tra phiên bản bạn dùng.
- Pool phía ứng dụng (HikariCP) vẫn giữ nhưng nhỏ hơn; đặt {{maxLifetime}} ngắn hơn timeout của pooler.

### RDS Proxy
Dịch vụ quản lý của AWS: gộp connection, giữ connection khi failover (giảm thời gian ứng dụng mất kết nối), tích hợp IAM/Secrets Manager — đặc biệt hữu ích cho **Lambda** (mỗi lần gọi mở connection). Khi client dùng tính năng theo phiên, RDS Proxy **pin** (ghim) connection cho client đó → mất lợi ích gộp; theo dõi metric pinning.

### Kích thước
- Connection thật tới DB: bắt đầu từ khoảng **(số core × 2) + số đĩa** theo kinh nghiệm cộng đồng PostgreSQL, rồi đo. Nhiều connection hơn không có nghĩa nhanh hơn — vượt điểm bão hoà thì latency tăng.
- {{max_connections}} chừa chỗ cho admin, replication, job.

### Ví dụ đời thực
Sau khi scale lên 60 pod cho đợt khuyến mãi, PostgreSQL báo "too many connections" và RAM tăng vọt (mỗi backend vài MB, cộng work_mem khi truy vấn). Đặt PgBouncer chế độ transaction với 120 connection thật, Hikari mỗi pod 10. Hai lỗi lộ ra khi chuyển: một job dùng {{pg_advisory_lock}} (khoá theo phiên) bị "rò" khoá sang client khác — đổi sang {{pg_advisory_xact_lock}}; một service đặt {{SET statement_timeout}} khi lấy connection — đổi sang cấu hình theo role. Kết quả: p99 giảm 30% nhờ DB không còn quá tải process, không còn lỗi kết nối khi scale.

### Trả lời mẫu khi phỏng vấn
"Mỗi connection PostgreSQL là một process, nên 60 pod nhân 20 connection vượt xa khả năng của DB. Tôi đặt một connection pooler như PgBouncer hoặc RDS Proxy ở giữa: ứng dụng mở connection tới pooler, pooler dùng một số ít connection thật tới DB, đo để chọn kích thước gần điểm bão hoà. Tôi dùng chế độ transaction pooling, nghĩa là connection thật chỉ thuộc về client trong một transaction, nên phải bỏ các tính năng theo phiên: SET thường thay bằng SET LOCAL hoặc cấu hình theo role, advisory lock theo phiên đổi sang theo transaction, LISTEN NOTIFY cần đường riêng, và prepared statement phải cấu hình theo phiên bản PgBouncer và driver. Với Lambda hoặc cần failover nhanh trên AWS thì RDS Proxy là lựa chọn tự nhiên, nhưng phải theo dõi pinning."

> Senior tip: trước khi bật transaction pooling, grep toàn bộ code tìm {{SET }}, {{pg_advisory_lock}}, {{LISTEN}}, {{TEMP TABLE}}. Mỗi chỗ tìm thấy là một lỗi sẽ xuất hiện ngẫu nhiên sau khi chuyển — sửa trước rẻ hơn nhiều.`,
  follow: [
    'Vì sao tăng max_connections không phải là cách giải quyết?',
    'RDS Proxy pinning là gì và bạn giảm nó thế nào?',
    'Tính kích thước pool HikariCP khi đã có PgBouncer phía sau ra sao?'
  ],
  tags: ['PgBouncer', 'RDS Proxy', 'connection pooling', 'PostgreSQL', 'scalability']
},
{
  id: 'db-050',
  topic: 'db',
  level: 'mid',
  q: 'Một câu báo cáo chạy 40 phút và một transaction bị bỏ quên đã giữ khoá suốt đêm, làm chậm cả hệ thống. Bạn đặt các "rào chắn" timeout nào ở PostgreSQL và ở ứng dụng để chuyện này không lặp lại?',
  a: `**Tóm tắt:** Đặt giới hạn ở **nhiều tầng** để không câu lệnh hay transaction nào chiếm tài nguyên vô hạn: {{statement_timeout}} (thời gian tối đa của một câu), {{lock_timeout}} (thời gian tối đa chờ khoá), {{idle_in_transaction_session_timeout}} (cắt phiên mở transaction rồi bỏ đó); PostgreSQL 17 có thêm {{transaction_timeout}}. Đặt theo **role** cho từng loại ứng dụng (API ngắn, báo cáo dài hơn), kèm timeout ở **pool** và **HTTP client** phía ứng dụng, và cảnh báo khi có transaction dài.

### Mỗi timeout chặn loại sự cố nào
| Tham số | Chặn | Gợi ý |
|---|---|---|
| statement_timeout | Câu lệnh chạy quá lâu (quét cả bảng, báo cáo nặng trên DB chính) | API: 2–5 giây; báo cáo: vài phút trên replica |
| lock_timeout | Chờ khoá vô hạn, đặc biệt DDL xếp hàng chặn mọi truy vấn sau nó | 2–5 giây cho migration; ngắn cho API |
| idle_in_transaction_session_timeout | Ứng dụng mở transaction rồi quên (lỗi code, debug) — giữ khoá, chặn vacuum | 30–60 giây |
| transaction_timeout (PG17+) | Tổng thời gian một transaction | Theo nhu cầu |

### Đặt ở đâu
~~~sql
ALTER ROLE api_user    SET statement_timeout = '3s';
ALTER ROLE api_user    SET idle_in_transaction_session_timeout = '30s';
ALTER ROLE report_user SET statement_timeout = '10min';   -- chạy trên replica
-- migration: đặt trong chính script
SET lock_timeout = '3s';
~~~
Đặt theo role thay vì toàn cục để job hợp lệ chạy lâu không bị cắt nhầm. Trong Spring có thể đặt thêm {{@Transactional(timeout = 5)}} hoặc query hint timeout của JPA cho từng truy vấn.

### Phía ứng dụng
- HikariCP {{connectionTimeout}} (chờ lấy connection), {{maxLifetime}}.
- Timeout HTTP client: không gọi dịch vụ ngoài khi đang giữ transaction.
- Khi câu lệnh bị huỷ do timeout, ứng dụng nhận lỗi rõ ràng (SQLState 57014) → trả lỗi có kiểm soát thay vì treo.

### Giám sát
~~~sql
SELECT pid, state, now() - xact_start AS xact_age, left(query, 60)
FROM pg_stat_activity
WHERE xact_start < now() - interval '5 minutes' ORDER BY xact_age DESC;
~~~
Cảnh báo khi có transaction dài hơn 5 phút hoặc phiên "idle in transaction".

### Ví dụ đời thực
Một dev chạy câu báo cáo trên DB chính bằng tài khoản ứng dụng lúc 9 giờ sáng: quét 200 triệu dòng, 40 phút, DB CPU 100%. Cùng tuần, một lỗi code để transaction mở khi gặp exception ở nhánh hiếm — phiên "idle in transaction" giữ khoá trên bảng đơn hàng suốt đêm, autovacuum không dọn được, sáng hôm sau migration xếp hàng sau nó và chặn mọi truy vấn 6 phút. Sau đó: role riêng cho API (statement_timeout 3s, idle_in_transaction 30s), role báo cáo chỉ được kết nối replica, migration luôn có lock_timeout + retry, cảnh báo transaction dài. Hai loại sự cố không lặp lại.

### Trả lời mẫu khi phỏng vấn
"Tôi đặt rào chắn ở nhiều tầng. Ở PostgreSQL: statement_timeout giới hạn thời gian một câu, lock_timeout giới hạn thời gian chờ khoá, đặc biệt quan trọng với migration vì DDL xếp hàng có thể chặn mọi truy vấn phía sau, và idle_in_transaction_session_timeout cắt các phiên mở transaction rồi bỏ quên, vốn giữ khoá và chặn vacuum; PostgreSQL 17 có thêm transaction_timeout. Tôi đặt theo role cho từng loại ứng dụng: API ngắn, báo cáo dài hơn và chạy trên replica. Phía ứng dụng có timeout của pool, của transaction và của HTTP client, không gọi dịch vụ ngoài trong transaction. Cuối cùng là cảnh báo khi có transaction dài hơn vài phút."

> Senior tip: tách **tài khoản DB theo mục đích** (API, job, báo cáo, migration, người) ngay từ đầu. Nó cho phép đặt timeout và quyền khác nhau, và khi có sự cố nhìn pg_stat_activity là biết ngay ai đang làm gì.`,
  follow: [
    'Vì sao lock_timeout đặc biệt quan trọng với migration?',
    'Phiên idle in transaction ảnh hưởng tới autovacuum thế nào?',
    'Bạn xử lý lỗi bị huỷ do statement_timeout trong Spring ra sao?'
  ],
  tags: ['PostgreSQL', 'timeout', 'locking', 'guardrails', 'operations']
},
{
  id: 'db-051',
  topic: 'db',
  level: 'senior',
  q: 'Những mẫu viết lại query nào bạn hay dùng để tăng tốc mà không đổi kết quả? Giải thích NOT IN và NOT EXISTS, OR và UNION ALL, subquery tương quan và JOIN/LATERAL, CTE và COUNT(*) trên bảng lớn.',
  a: `**Tóm tắt:** Nhiều query chậm không cần index mới mà cần **viết lại** để planner chọn kế hoạch tốt hơn hoặc để đọc ít dữ liệu hơn. Các mẫu hay dùng: {{NOT EXISTS}} thay {{NOT IN}} (còn sửa cả lỗi NULL), {{UNION ALL}} thay {{OR}} giữa các cột có index khác nhau, {{JOIN}}/{{LATERAL}} thay subquery chạy lại cho từng dòng, kiểm soát CTE có bị "vật chất hoá" hay không, và tránh {{COUNT(*)}} chính xác trên bảng khổng lồ khi chỉ cần ước lượng. Luôn kiểm chứng bằng {{EXPLAIN ANALYZE}} và so kết quả.

### NOT IN và NOT EXISTS
~~~sql
-- Sai khi subquery có NULL: NOT IN trả về rỗng hoàn toàn
SELECT * FROM customers c WHERE c.id NOT IN (SELECT o.customer_id FROM orders o);
-- Đúng và thường nhanh hơn (anti-join)
SELECT * FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
~~~
{{x NOT IN (1, 2, NULL)}} cho kết quả UNKNOWN với mọi x → không dòng nào được trả. {{NOT EXISTS}} không có bẫy này và planner chuyển thành anti-join hiệu quả.

### OR giữa các cột khác nhau
{{WHERE email = $1 OR phone = $2}} với hai index riêng: PostgreSQL có thể dùng BitmapOr, nhưng thường kém hơn tách:
~~~sql
SELECT * FROM users WHERE email = $1
UNION ALL
SELECT * FROM users WHERE phone = $2 AND email IS DISTINCT FROM $1;   -- tránh trùng dòng
~~~

### Subquery tương quan → JOIN / LATERAL
Subquery trong {{SELECT}} chạy lại cho từng dòng. Với "đơn hàng mới nhất của mỗi khách":
~~~sql
SELECT c.id, o.*
FROM customers c
CROSS JOIN LATERAL (
  SELECT * FROM orders o WHERE o.customer_id = c.id
  ORDER BY o.created_at DESC LIMIT 1                     -- dùng index (customer_id, created_at DESC)
) o;
~~~
Hoặc {{DISTINCT ON (customer_id)}} của PostgreSQL, hoặc window function — chọn theo số nhóm và index sẵn có.

### CTE
Từ PostgreSQL 12, CTE không đệ quy, không có tác dụng phụ và chỉ dùng một lần sẽ được **gộp vào** câu chính (planner tối ưu xuyên qua nó). Có thể ép bằng {{WITH x AS MATERIALIZED (...)}} (tính một lần, dùng nhiều lần) hoặc {{NOT MATERIALIZED}}. Trước PG12, CTE luôn là "hàng rào tối ưu" — query cũ viết bằng CTE có thể chậm vì lý do này.

### COUNT(*) trên bảng lớn
Vì MVCC, PostgreSQL phải kiểm tra từng dòng có hiển thị với transaction hiện tại không, nên {{COUNT(*)}} trên 500 triệu dòng rất tốn. Lựa chọn:
- Hiển thị "khoảng 2,3 triệu" từ ước lượng ({{SELECT reltuples FROM pg_class WHERE relname = 'orders'}}) hoặc từ {{EXPLAIN}}.
- Đếm có điều kiện dùng index nhỏ (index-only scan nếu visibility map tốt).
- Bảng đếm duy trì riêng (cập nhật theo sự kiện) cho con số cần chính xác.
- Giao diện phân trang không cần tổng số (keyset + "trang tiếp").

### Ví dụ đời thực
Một màn hình CRM "khách chưa từng mua hàng" dùng {{NOT IN}} — sau khi bảng orders có vài dòng {{customer_id}} NULL (dữ liệu import lỗi), màn hình trả về **rỗng** và đội marketing gửi nhầm chiến dịch; đổi sang {{NOT EXISTS}} vừa đúng vừa nhanh hơn 6 lần. Cùng dự án, trang danh sách hiển thị "Tổng: 48.213.004 bản ghi" chạy {{COUNT(*)}} 9 giây mỗi lần mở; đổi sang ước lượng và keyset, trang mở trong 80ms.

### Trả lời mẫu khi phỏng vấn
"Tôi có vài mẫu viết lại hay dùng, luôn kiểm chứng bằng EXPLAIN ANALYZE và so kết quả trước và sau. NOT IN với subquery tôi đổi thành NOT EXISTS, vừa tránh bẫy NULL làm kết quả rỗng, vừa để planner làm anti-join. OR giữa các cột có index khác nhau thì tách thành UNION ALL, xử lý trùng dòng cẩn thận. Subquery tương quan trong SELECT tôi đổi sang JOIN, hoặc LATERAL với LIMIT cho bài toán bản ghi mới nhất mỗi nhóm, dựa trên index đúng thứ tự. Với CTE, từ PostgreSQL 12 chúng thường được gộp vào câu chính, còn có thể ép MATERIALIZED khi cần tính một lần. Và tôi tránh COUNT chính xác trên bảng rất lớn khi giao diện chỉ cần ước lượng, vì MVCC buộc phải kiểm tra từng dòng."

> Senior tip: giữ một file "các câu truy vấn mẫu nhanh" của team (top-N mỗi nhóm, anti-join, upsert, phân trang keyset) có kèm index cần thiết. Phần lớn query chậm trong code review là biến thể của vài mẫu này được viết theo cách chậm.`,
  follow: [
    'Vì sao NOT IN với NULL trả về rỗng — giải thích bằng logic ba giá trị?',
    'DISTINCT ON, window function và LATERAL: chọn cách nào cho top-1 mỗi nhóm?',
    'Khi nào bạn cố ý dùng CTE MATERIALIZED?'
  ],
  tags: ['SQL', 'query rewrite', 'NOT EXISTS', 'LATERAL', 'CTE', 'performance']
},
{
  id: 'db-052',
  topic: 'db',
  level: 'senior',
  q: 'Bộ đếm lượt thích, số tồn kho của một sản phẩm hot hay một dòng "tổng doanh thu hôm nay" bị hàng nghìn request cập nhật cùng lúc, gây chờ khoá và deadlock. Bạn xử lý "hot row" thế nào?',
  a: `**Tóm tắt:** Mỗi {{UPDATE}} khoá dòng tới khi transaction kết thúc, nên một dòng bị cập nhật hàng nghìn lần mỗi giây trở thành **điểm tuần tự hoá** của cả hệ thống. Cách xử lý theo mức độ: **rút ngắn transaction** giữ khoá dòng nóng (đặt cập nhật dòng nóng cuối transaction), **chia nhỏ bộ đếm** thành N dòng con (sharded counter) rồi cộng khi đọc, **ghi thêm thay vì sửa** (append-only + tổng hợp định kỳ), hoặc **đưa bộ đếm ra Redis** ({{INCRBY}}) và đồng bộ về DB theo lô — tuỳ mức độ cần chính xác tức thời.

### Vì sao hot row nghẽn
Transaction A {{UPDATE stats SET total = total + 1 WHERE day = today}} giữ khoá dòng đó tới khi commit. Nếu A còn làm việc khác 50ms sau đó, mọi transaction khác cập nhật cùng dòng phải **xếp hàng**: tối đa khoảng 20 lần/giây cho dòng đó, bất kể DB mạnh thế nào. Thêm nhiều dòng nóng được cập nhật theo thứ tự khác nhau → deadlock.

### Các cách xử lý
| Cách | Ý tưởng | Đánh đổi |
|---|---|---|
| Cập nhật dòng nóng cuối transaction | Giữ khoá trong thời gian ngắn nhất | Vẫn tuần tự, chỉ đỡ hơn |
| Sharded counter | N dòng {{(key, shard)}}, mỗi request cộng vào shard ngẫu nhiên; đọc = SUM | Đọc tốn hơn một chút |
| Append-only | INSERT mỗi sự kiện, job tổng hợp mỗi phút | Tổng có độ trễ |
| Redis INCRBY | Bộ đếm nguyên tử trong bộ nhớ, đồng bộ về DB theo lô | Có thể mất vài giây dữ liệu nếu Redis lỗi (bật AOF, đối soát) |
| Tồn kho chia "khoang" | Chia tồn kho thành nhiều dòng (ví dụ 10 dòng × 100 sản phẩm) | Logic chọn dòng còn hàng |

~~~sql
-- Sharded counter: 16 dòng con cho mỗi bài viết
INSERT INTO post_likes_counter (post_id, shard, cnt) VALUES ($1, floor(random() * 16), 1)
ON CONFLICT (post_id, shard) DO UPDATE SET cnt = post_likes_counter.cnt + 1;
-- Đọc
SELECT sum(cnt) FROM post_likes_counter WHERE post_id = $1;
~~~

### Chọn theo yêu cầu chính xác
- **Tiền, tồn kho bán** cần chính xác tại thời điểm quyết định: dùng cập nhật có điều kiện trên DB, chia khoang nếu quá nóng, giữ transaction cực ngắn.
- **Lượt thích, lượt xem, thống kê**: chấp nhận trễ vài giây → Redis hoặc append-only + tổng hợp.

### Ví dụ đời thực
Bảng {{daily_revenue}} có một dòng mỗi ngày được mọi giao dịch thanh toán cập nhật trong cùng transaction với việc ghi giao dịch. Giờ cao điểm 1.500 giao dịch/giây: p99 thanh toán lên 2,4 giây, deadlock xuất hiện khi kết hợp với cập nhật số dư. Đổi sang append-only: mỗi giao dịch INSERT dòng doanh thu riêng (không tranh chấp), job mỗi phút tổng hợp vào {{daily_revenue}}; dashboard trễ tối đa 1 phút (nghiệp vụ chấp nhận). p99 thanh toán còn 140ms, deadlock biến mất.

### Trả lời mẫu khi phỏng vấn
"Một dòng bị cập nhật liên tục trở thành điểm tuần tự hoá, vì mỗi UPDATE giữ khoá dòng tới khi transaction kết thúc; thông lượng của dòng đó bị giới hạn bởi độ dài transaction chứ không phải sức mạnh DB. Tôi xử lý tuỳ yêu cầu chính xác. Với tiền hay tồn kho cần đúng tại thời điểm quyết định, tôi giữ cập nhật có điều kiện trên DB, đặt nó cuối transaction và giữ transaction cực ngắn, nếu vẫn quá nóng thì chia tồn kho thành nhiều dòng. Với bộ đếm và thống kê chấp nhận trễ vài giây, tôi dùng sharded counter, nhiều dòng con cộng khi đọc, hoặc ghi append-only rồi tổng hợp định kỳ, hoặc dùng Redis INCRBY đồng bộ về DB theo lô."

> Senior tip: tìm hot row bằng {{pg_locks}} và {{pg_stat_activity}} trong lúc tải cao — nhiều phiên chờ khoá trên cùng một dòng là dấu hiệu rõ nhất. Một bảng "thống kê tổng" được cập nhật trong transaction nghiệp vụ là nguyên nhân phổ biến hơn bạn nghĩ.`,
  follow: [
    'Sharded counter đọc thế nào cho nhanh khi có hàng triệu khoá?',
    'Bạn đồng bộ bộ đếm từ Redis về DB thế nào để không mất hoặc đếm trùng?',
    'Vì sao đặt cập nhật dòng nóng ở cuối transaction giúp giảm tranh chấp?'
  ],
  tags: ['hot row', 'contention', 'locking', 'counter', 'scalability']
},
{
  id: 'db-053',
  topic: 'db',
  level: 'mid',
  q: 'Dashboard tổng hợp doanh thu theo ngày, theo cửa hàng chạy truy vấn GROUP BY trên hàng trăm triệu dòng mỗi lần mở. Bạn dùng materialized view hay bảng tổng hợp tăng dần thế nào?',
  a: `**Tóm tắt:** Thay vì tính lại từ dữ liệu thô mỗi lần đọc, **tính trước** kết quả tổng hợp. **Materialized view** lưu kết quả một truy vấn thành bảng, làm mới bằng {{REFRESH MATERIALIZED VIEW}} (tính lại toàn bộ; {{CONCURRENTLY}} để không chặn người đọc, cần unique index). Khi dữ liệu lớn và cần mới hơn, dùng **bảng tổng hợp tăng dần**: chỉ cộng thêm phần dữ liệu mới từ lần chạy trước (theo thời gian hoặc id), upsert vào bảng tổng hợp.

### Materialized view
~~~sql
CREATE MATERIALIZED VIEW daily_store_revenue AS
SELECT date_trunc('day', paid_at) AS day, store_id, sum(amount) AS revenue, count(*) AS orders
FROM payments GROUP BY 1, 2;
CREATE UNIQUE INDEX ON daily_store_revenue (day, store_id);     -- bắt buộc cho CONCURRENTLY
REFRESH MATERIALIZED VIEW CONCURRENTLY daily_store_revenue;      -- người đọc không bị chặn
~~~
Ưu: đơn giản, khai báo bằng SQL. Nhược: mỗi lần refresh tính lại **toàn bộ** — với dữ liệu nhiều năm sẽ ngày càng lâu; PostgreSQL không có refresh tăng dần sẵn.

### Bảng tổng hợp tăng dần
~~~sql
-- Chạy mỗi 5 phút: chỉ xử lý ngày bị ảnh hưởng bởi dữ liệu mới
INSERT INTO daily_store_revenue_t (day, store_id, revenue, orders)
SELECT date_trunc('day', paid_at), store_id, sum(amount), count(*)
FROM payments
WHERE paid_at >= date_trunc('day', now()) - interval '1 day'   -- tính lại hôm qua và hôm nay
GROUP BY 1, 2
ON CONFLICT (day, store_id) DO UPDATE
  SET revenue = EXCLUDED.revenue, orders = EXCLUDED.orders;
~~~
Tính lại cửa sổ gần (hôm nay, hôm qua) bao được dữ liệu đến muộn; ngày cũ không đổi thì không tính lại. Nếu dữ liệu cũ có thể bị sửa (hoàn tiền), cần cơ chế đánh dấu ngày bị ảnh hưởng để tính lại.

### So sánh
| | Materialized view | Bảng tổng hợp tăng dần | Kho phân tích (Redshift, ClickHouse) |
|---|---|---|---|
| Độ mới | Theo lịch refresh | Vài phút | Giây–phút (qua CDC) |
| Chi phí mỗi lần cập nhật | Tính lại toàn bộ | Chỉ phần mới | Hạ tầng riêng |
| Độ phức tạp | Thấp | Trung bình | Cao |
| Hợp với | Dữ liệu vừa, dashboard cập nhật theo giờ/ngày | Dữ liệu lớn, cần mới hơn | Nhiều nguồn, truy vấn tuỳ ý |

### Ví dụ đời thực
Dashboard điều hành của một chuỗi bán lẻ chạy GROUP BY trên 320 triệu dòng thanh toán: 25 giây mỗi lần mở, 40 người mở vào 8 giờ sáng làm DB chính quá tải. Bước 1: materialized view refresh mỗi giờ — dashboard mở trong 50ms nhưng refresh mất 6 phút và ngày càng lâu. Bước 2: chuyển sang bảng tổng hợp tăng dần chạy mỗi 5 phút (tính lại 2 ngày gần nhất, mất khoảng 8 giây), cộng một bảng "ngày bị ảnh hưởng" để tính lại khi có hoàn tiền vào ngày cũ. Dashboard dữ liệu trễ tối đa 5 phút, DB chính không còn bị tải buổi sáng.

### Trả lời mẫu khi phỏng vấn
"Với dashboard tổng hợp trên dữ liệu rất lớn, tôi tính trước kết quả thay vì GROUP BY mỗi lần mở. Cách đơn giản là materialized view, làm mới bằng REFRESH CONCURRENTLY có unique index để không chặn người đọc; nhược điểm là mỗi lần refresh tính lại toàn bộ nên càng lâu khi dữ liệu tăng. Khi dữ liệu lớn hoặc cần mới hơn, tôi dùng bảng tổng hợp tăng dần: job định kỳ chỉ tính lại cửa sổ gần như hôm nay và hôm qua rồi upsert, có cơ chế tính lại ngày cũ khi dữ liệu cũ bị sửa như hoàn tiền. Nếu nhu cầu phân tích nhiều chiều và nhiều nguồn, tôi đưa dữ liệu sang kho phân tích qua CDC thay vì làm trên DB giao dịch."

> Senior tip: ghi rõ trên dashboard **"dữ liệu cập nhật lúc …"**. Chỉ một dòng chữ đó ngăn được phần lớn tranh cãi "số liệu sai" khi người dùng so với hệ thống giao dịch thời gian thực.`,
  follow: [
    'Vì sao REFRESH CONCURRENTLY cần unique index?',
    'Bạn xử lý dữ liệu đến muộn trong bảng tổng hợp thế nào?',
    'Khi nào nên chuyển từ bảng tổng hợp sang kho phân tích riêng?'
  ],
  tags: ['materialized view', 'aggregation', 'reporting', 'PostgreSQL', 'performance']
},
{
  id: 'db-054',
  topic: 'db',
  level: 'senior',
  q: 'Bảng orders được cập nhật trạng thái liên tục: dung lượng tăng gấp 3 so với dữ liệu thật và truy vấn chậm dần dù không thêm dòng mới. Bạn chẩn đoán bloat và tuning autovacuum, fillfactor, HOT update thế nào?',
  a: `**Tóm tắt:** Trong PostgreSQL, mỗi {{UPDATE}} tạo **phiên bản dòng mới**, phiên bản cũ thành "dead tuple" chờ **VACUUM** dọn. Bảng cập nhật nhiều mà autovacuum chạy không kịp (ngưỡng mặc định theo **20%** số dòng — quá thưa với bảng lớn) sẽ **phình (bloat)**: nhiều trang hơn phải đọc, index cũng phình. Xử lý: **tuning autovacuum theo từng bảng** (ngưỡng nhỏ hơn, chạy nhanh hơn), tận dụng **HOT update** bằng {{fillfactor}} và tránh cập nhật cột có index không cần thiết, loại bỏ **transaction dài** chặn vacuum, và thu hồi dung lượng đã phình bằng **pg_repack** (không khoá lâu) khi cần.

### Vì sao bảng phình
1. {{UPDATE orders SET status = 'SHIPPED'}} ghi dòng mới, dòng cũ đánh dấu chết.
2. Autovacuum chỉ chạy khi số dòng chết vượt {{autovacuum_vacuum_threshold + autovacuum_vacuum_scale_factor × số dòng}} — mặc định 50 + 20%. Bảng 100 triệu dòng phải có 20 triệu dòng chết mới được dọn.
3. VACUUM không dọn được phiên bản mà **transaction cũ hơn vẫn có thể nhìn thấy** — một transaction dài (hoặc replication slot bị bỏ quên, replica với hot_standby_feedback) chặn việc dọn trên toàn DB.
4. VACUUM thường đánh dấu chỗ trống để tái sử dụng, **không trả dung lượng** cho hệ điều hành.

### Chẩn đoán
~~~sql
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, n_tup_upd, n_tup_hot_upd
FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 10;
~~~
- Tỉ lệ dead/live cao, {{last_autovacuum}} lâu rồi → autovacuum không theo kịp.
- {{n_tup_hot_upd}} thấp so với {{n_tup_upd}} → ít HOT update.
- Ước lượng bloat bằng extension {{pgstattuple}} hoặc các truy vấn ước lượng phổ biến.
- Kiểm tra transaction dài và replication slot không hoạt động.

### Xử lý
~~~sql
-- Tuning riêng cho bảng cập nhật nhiều
ALTER TABLE orders SET (autovacuum_vacuum_scale_factor = 0.01,   -- 1% thay vì 20%
                        autovacuum_vacuum_threshold = 10000,
                        fillfactor = 85);                          -- chừa 15% trang cho HOT update
~~~
- **HOT update** (Heap-Only Tuple): khi cập nhật **không đổi cột nào có index** và trang còn chỗ, PostgreSQL ghi phiên bản mới ngay trên cùng trang mà **không phải cập nhật index** → ít ghi, ít bloat index. {{fillfactor}} thấp hơn 100 chừa chỗ cho việc này (fillfactor chỉ áp dụng cho dữ liệu ghi sau khi đổi).
- Tránh index thừa trên cột hay đổi (ví dụ index trên {{updated_at}} khiến mọi update mất HOT).
- Tăng tài nguyên autovacuum toàn cục nếu nhiều bảng cần ({{autovacuum_vacuum_cost_limit}}, số worker).
- Thu hồi dung lượng đã phình: **pg_repack** (dựng lại bảng trực tuyến, khoá ngắn) thay vì {{VACUUM FULL}} (khoá độc quyền suốt quá trình).

### Ví dụ đời thực
Bảng {{orders}} 60 triệu dòng, mỗi đơn đổi trạng thái 6–8 lần. Dung lượng 180GB trong khi dữ liệu thật khoảng 55GB; truy vấn danh sách đơn chậm dần từ 40ms lên 400ms. Chẩn đoán: 41 triệu dead tuple, autovacuum lần cuối 9 ngày trước (ngưỡng 20% quá thưa), HOT update chỉ 12% vì có index trên {{updated_at}}. Xử lý: scale_factor 0,01, fillfactor 85, bỏ index {{updated_at}} (thay bằng index trên cột thật sự được lọc), chạy pg_repack một lần ngoài giờ cao điểm. Dung lượng còn 68GB, HOT update lên 78%, truy vấn về 35ms.

### Trả lời mẫu khi phỏng vấn
"Trong PostgreSQL mỗi UPDATE tạo phiên bản dòng mới, phiên bản cũ chờ VACUUM dọn. Với bảng lớn cập nhật liên tục, ngưỡng mặc định của autovacuum là khoảng 20% số dòng nên quá thưa, dead tuple tích luỹ và bảng cùng index phình ra, truy vấn phải đọc nhiều trang hơn. Tôi chẩn đoán bằng pg_stat_user_tables: số dead tuple, lần autovacuum gần nhất, tỉ lệ HOT update, và kiểm tra transaction dài hay replication slot bỏ quên vì chúng chặn việc dọn. Xử lý gồm: đặt autovacuum riêng cho bảng đó với scale factor nhỏ như 1%; giảm fillfactor để chừa chỗ cho HOT update và bỏ index trên cột hay thay đổi mà không ai lọc; loại bỏ transaction dài. Dung lượng đã phình thì thu hồi bằng pg_repack để không khoá bảng lâu như VACUUM FULL."

> Senior tip: đặt cảnh báo cho **tuổi của transaction cũ nhất** và **replication slot không hoạt động**. Phần lớn sự cố bloat nghiêm trọng (và cả transaction ID wraparound) bắt nguồn từ một thứ duy nhất đang chặn vacuum mà không ai để ý.`,
  follow: [
    'HOT update hoạt động thế nào và khi nào không xảy ra?',
    'Vì sao VACUUM FULL nguy hiểm trên production và pg_repack khác gì?',
    'Transaction ID wraparound liên quan gì tới autovacuum?'
  ],
  tags: ['PostgreSQL', 'VACUUM', 'bloat', 'autovacuum', 'HOT update', 'fillfactor']
},
{
  id: 'db-055',
  topic: 'db',
  level: 'lead',
  q: '(Bản đồ) Tối ưu database và query: có những cách nào, theo thứ tự nào, và mỗi cách áp dụng khi nào? (Câu tổng hợp, dẫn tới các câu chi tiết trong ngân hàng)',
  a: `**Tóm tắt:** Tối ưu DB có **8 tầng**, từ rẻ và an toàn đến tốn kém và phức tạp: (1) viết lại query, (2) index, (3) thống kê và planner, (4) tầng ứng dụng và ORM, (5) kết nối, timeout, cấu hình server, (6) cache và tách tải đọc, (7) thiết kế dữ liệu, (8) kiến trúc khi một DB không còn đủ. Nguyên tắc: **đo trước** (tìm query tốn tổng thời gian nhiều nhất), sửa ở tầng rẻ nhất giải quyết được, **đo lại**. Mỗi mục dưới đây ghi mã câu hỏi chi tiết trong ngân hàng — gõ mã đó vào ô tìm kiếm để mở.

### 0. Đo trước khi sửa
- Tìm thủ phạm: pg_stat_statements, slow log, auto_explain, APM → {{db-048}}
- Đọc kế hoạch thực thi → {{db-003}}, {{sql-033}}; ba thuật toán join và work_mem → {{db-015}}, {{sql-032}}

### 1. Viết lại query
- NOT EXISTS thay NOT IN, OR → UNION ALL, LATERAL, CTE, COUNT(*) lớn → {{db-051}}
- Điều kiện làm mất index (hàm trên cột, ép kiểu, LIKE '%x') → {{db-023}}, {{sql-036}}
- Phân trang keyset thay OFFSET → {{db-005}}, {{sql-034}}; window function → {{db-017}}
- Upsert và ghi theo lô → {{db-038}}

### 2. Index
- B-tree bên trong, composite, covering → {{db-001}}, {{db-040}}, {{sql-035}}
- Partial, expression, GIN, BRIN, GiST → {{db-013}}; index-only scan → {{db-046}}
- Clustered vs non-clustered (InnoDB) → {{db-022}}, {{db-042}}; khoá chính UUID → {{db-032}}
- Tạo index không chặn ghi → {{scenario-003}}

### 3. Thống kê và planner
- Selectivity, histogram, CREATE STATISTICS → {{sql-031}}
- Execution plan trên Oracle → {{db-029}}

### 4. Ứng dụng và ORM
- N+1 và cách sửa → {{jpa-001}}; bài tập sửa bug N+1 ở mục "Sửa bug thật"
- Persistence context, flush, xử lý lô → {{jpa-002}}; lost update và khoá → {{jpa-004}}, {{scenario-119}}
- Export/stream dữ liệu lớn → {{db-039}}, {{scenario-010}}

### 5. Kết nối, timeout, cấu hình
- HikariCP sizing → {{db-007}}, {{db-043}}; pool cạn → {{scenario-006}}
- PgBouncer / RDS Proxy → {{db-049}}
- statement_timeout, lock_timeout, idle in transaction → {{db-050}}
- MVCC, VACUUM, bloat, HOT update → {{db-012}}, {{db-054}}; wraparound → {{db-047}}

### 6. Cache và tách tải đọc
- Read replica và đọc lại dữ liệu vừa ghi → {{db-016}}, {{db-044}}
- Cache stampede, Redis → {{scenario-018}}, {{db-024}}
- Materialized view, bảng tổng hợp → {{db-053}}; tách báo cáo khỏi DB chính → {{scenario-004}}

### 7. Thiết kế dữ liệu
- Chuẩn hoá và denormalize có chủ đích → {{db-021}}
- Partition theo thời gian → {{db-014}}, {{db-045}}; dọn dữ liệu cũ → {{scenario-007}}
- Hot row và bộ đếm nóng → {{db-052}}
- Multi-tenant → {{sql-037}}

### 8. Kiến trúc
- Replication, partition, sharding → {{db-006}}
- SQL vs NoSQL, chọn đúng loại store → {{db-009}}
- CDC sang kho phân tích → {{aws-059}}

### Thứ tự khi gặp một query chậm
~~~text
Đo (top theo tổng thời gian) → đọc EXPLAIN (ANALYZE, BUFFERS)
→ ước lượng lệch?        → sửa thống kê (tầng 3)
→ quét thừa / sort lớn?  → viết lại query, thêm/đổi index (tầng 1–2)
→ gọi quá nhiều lần?     → sửa N+1, cache (tầng 4, 6)
→ chờ khoá / pool?       → transaction ngắn, timeout, pooler (tầng 5)
→ dữ liệu quá lớn?       → partition, tổng hợp trước, tách kho (tầng 7–8)
~~~

### Ví dụ đời thực
Một hệ thống thanh toán có p99 API 1,9 giây. Đo: 3 câu chiếm 70% thời gian DB. Câu 1 (N+1 trong danh sách giao dịch, 400 query mỗi request) — sửa bằng một truy vấn gộp; câu 2 lọc {{DATE(created_at)}} mất index — viết lại theo khoảng thời gian; câu 3 cập nhật dòng "tổng hôm nay" trong mọi transaction (hot row) — chuyển sang append-only + tổng hợp mỗi phút. Không thêm phần cứng, p99 còn 180ms. Partition và tách kho phân tích được lên kế hoạch cho năm sau dựa trên tốc độ tăng dữ liệu.

### Trả lời mẫu khi phỏng vấn
"Tôi tối ưu theo thứ tự từ rẻ đến đắt và luôn đo trước. Đầu tiên tìm query tốn tổng thời gian nhiều nhất bằng pg_stat_statements và APM, đọc EXPLAIN ANALYZE với BUFFERS để biết vấn đề là ước lượng sai, quét thừa, sort lớn, gọi quá nhiều lần hay chờ khoá. Sau đó sửa ở tầng rẻ nhất giải quyết được: viết lại query cho đúng mẫu, thêm hoặc đổi index composite, sửa thống kê; ở tầng ứng dụng thì sửa N+1, xử lý theo lô, giữ transaction ngắn. Tiếp đến là kết nối và timeout: pool đúng cỡ, PgBouncer, statement và lock timeout. Khi tải đọc lớn thì cache, read replica, bảng tổng hợp. Chỉ khi dữ liệu thật sự vượt khả năng một DB mới đến partition, tách kho phân tích hay sharding. Sau mỗi thay đổi tôi đo lại đúng chỉ số ban đầu."

> Senior tip: phần lớn hệ thống không cần tầng 7–8. Trước khi đề xuất sharding hay đổi database, hãy chứng minh bằng số liệu rằng tầng 1–6 đã được làm hết — trong đa số trường hợp, ba query hàng đầu là toàn bộ vấn đề.`,
  follow: [
    'Bạn chứng minh với quản lý rằng cần partition hoặc sharding bằng số liệu nào?',
    'Khi index mới làm chậm thao tác ghi, bạn cân nhắc thế nào?',
    'Tầng nào bạn kiểm tra đầu tiên khi p99 tăng đột ngột sau deploy?'
  ],
  tags: ['performance', 'database', 'query optimization', 'roadmap', 'PostgreSQL'],
  refs: [
    { type: 'doc', title: 'PostgreSQL: Performance Tips', url: 'https://www.postgresql.org/docs/current/performance-tips.html' },
    { type: 'doc', title: 'PostgreSQL: Indexes', url: 'https://www.postgresql.org/docs/current/indexes.html' },
    { type: 'doc', title: 'PostgreSQL: pg_stat_statements', url: 'https://www.postgresql.org/docs/current/pgstatstatements.html' },
    { type: 'doc', title: 'PostgreSQL: Routine Vacuuming', url: 'https://www.postgresql.org/docs/current/routine-vacuuming.html' },
    { type: 'article', title: 'Use The Index, Luke', url: 'https://use-the-index-luke.com/' }
  ]
},
);
