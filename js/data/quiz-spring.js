/* Multiple-choice bank (exam pool spring) - owner: Claude quiz task. Format: see AGENTS.md section 4 */
(window.QUIZ = window.QUIZ || []).push(
{
  id: 'qz-spring-007',
  topic: 'spring',
  q: `Method sau được gọi từ một bean khác (đi qua proxy). File không tồn tại nên {{Files.readAllBytes}} ném {{IOException}} sau khi {{orderRepo.save}} đã chạy. Kết quả với dữ liệu đã save là gì?
~~~java
@Transactional
public void importOrder(Path file) throws IOException {
    orderRepo.save(new Order("PENDING"));
    byte[] data = Files.readAllBytes(file); // ném IOException
}
~~~`,
  options: [
    'Transaction vẫn commit, order PENDING được lưu, vì mặc định Spring chỉ rollback khi gặp RuntimeException hoặc Error',
    'Transaction rollback, vì mọi exception thoát khỏi method @Transactional đều gây rollback',
    'Spring bọc IOException thành UnexpectedRollbackException rồi rollback',
    'Không compile được, vì method @Transactional không được khai báo throws checked exception'
  ],
  answer: 0,
  explain: `**Đáp án đúng: transaction vẫn commit, vì mặc định Spring chỉ rollback với RuntimeException và Error.**

### Vì sao đúng
{{TransactionInterceptor}} khi bắt exception sẽ hỏi {{TransactionAttribute.rollbackOn(ex)}}. Cấu hình mặc định ({{DefaultTransactionAttribute}}) trả về {{true}} chỉ khi exception là **unchecked** ({{RuntimeException}} hoặc {{Error}}). {{IOException}} là checked exception nên interceptor **commit** transaction rồi mới ném exception tiếp lên caller. Kết quả: caller thấy lỗi, nhưng order PENDING đã nằm trong DB, một trạng thái "nửa vời" rất khó phát hiện.

Quy ước này kế thừa từ EJB: checked exception được coi là "kết quả nghiệp vụ dự kiến", không phải lỗi hệ thống.

### Vì sao các phương án còn lại sai
- **Mọi exception đều rollback**: sai, đây là hiểu lầm phổ biến nhất. Chỉ unchecked mới rollback mặc định.
- **Bọc thành UnexpectedRollbackException**: exception này chỉ xuất hiện khi transaction đã bị đánh dấu rollback-only nhưng code vẫn cố commit, không liên quan ở đây.
- **Không compile được**: sai, khai báo {{throws}} trên method có {{@Transactional}} hoàn toàn hợp lệ.

### Cách sửa
~~~java
@Transactional(rollbackFor = Exception.class) // rollback cả checked exception
public void importOrder(Path file) throws IOException { ... }
~~~

> Senior tip: nhiều team đặt quy ước "luôn khai báo {{rollbackFor = Exception.class}}" hoặc bọc checked exception thành unchecked ngay tại biên I/O. Ngoài ra, nên đọc file **trước** khi mở transaction: giữ transaction (và connection DB) trong lúc làm I/O chậm là cách nhanh nhất để cạn connection pool.`
},
{
  id: 'qz-spring-008',
  topic: 'spring',
  q: `{{OrderService.place()}} có {{@Transactional}} và gọi {{auditService.log()}} (bean khác, cũng {{@Transactional}} với propagation mặc định REQUIRED). {{log()}} ném {{RuntimeException}}, {{place()}} bắt exception đó bằng try/catch rồi return bình thường. Điều gì xảy ra?`,
  options: [
    'Chỉ phần audit bị rollback, phần order vẫn được commit bình thường',
    'Khi place() kết thúc và Spring cố commit, nó phát hiện transaction đã bị đánh dấu rollback-only, rollback toàn bộ và ném UnexpectedRollbackException',
    'Cả hai commit bình thường vì exception đã được bắt trong place()',
    'Spring tự động tạo savepoint cho log() nên chỉ rollback về savepoint'
  ],
  answer: 1,
  explain: `**Đáp án đúng: transaction bị đánh dấu rollback-only, khi commit Spring rollback toàn bộ và ném UnexpectedRollbackException.**

### Vì sao đúng
Với REQUIRED, {{log()}} **tham gia** vào transaction vật lý của {{place()}}, không có transaction riêng. Khi exception đi qua proxy của {{auditService}}, interceptor không thể rollback ngay (nó không sở hữu transaction) nên chỉ **đánh dấu rollback-only** trên transaction chung. {{place()}} nuốt exception và return, proxy của {{place()}} gọi commit, {{AbstractPlatformTransactionManager}} thấy cờ rollback-only, rollback thật và ném {{UnexpectedRollbackException}} để báo cho caller biết "bạn tưởng đã commit nhưng thực ra không".

~~~text
place() [mở TX] -> log() [tham gia TX] -> RuntimeException
                   proxy log(): setRollbackOnly()
place() catch -> return -> commit() -> thấy rollback-only -> rollback + UnexpectedRollbackException
~~~

### Vì sao các phương án còn lại sai
- **Chỉ audit rollback**: muốn vậy phải dùng {{REQUIRES_NEW}} (transaction vật lý riêng) hoặc {{NESTED}}.
- **Cả hai commit**: bắt exception ở caller không xoá được cờ rollback-only đã đặt trên transaction chung.
- **Tự tạo savepoint**: chỉ propagation {{NESTED}} mới dùng savepoint, REQUIRED thì không.

> Senior tip: audit log thường được tách bằng {{REQUIRES_NEW}} để lỗi audit không giết nghiệp vụ chính, nhưng nhớ REQUIRES_NEW giữ **2 connection** cùng lúc. Dưới tải cao, pool nhỏ có thể deadlock chính pool (mọi thread đều giữ 1 connection và chờ connection thứ 2).`
},
{
  id: 'qz-spring-009',
  topic: 'spring',
  multi: true,
  q: 'Phát biểu nào về method {{@PostConstruct}} của một singleton bean là đúng? (Chọn 2)',
  options: [
    'Nó chạy trước constructor để chuẩn bị dữ liệu cho constructor',
    'Nó chạy sau khi constructor xong và mọi dependency (field, setter) đã được inject',
    'Nó được gọi lại mỗi lần getBean() trả về bean đó',
    'Nếu trong đó gọi this.method() có @Transactional thì không có transaction nào được mở',
    'Nó luôn chạy sau khi proxy AOP của chính bean đó đã được tạo, nên các advice đã có hiệu lực'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: chạy sau khi inject xong dependency; gọi this.method() có @Transactional trong đó không mở transaction.**

### Vì sao đúng
Thứ tự khởi tạo một bean:
~~~text
1. constructor (inject qua constructor)
2. inject field / setter (@Autowired)
3. BeanPostProcessor.postProcessBeforeInitialization  -> @PostConstruct chạy ở đây
4. InitializingBean.afterPropertiesSet(), init-method
5. BeanPostProcessor.postProcessAfterInitialization   -> proxy AOP (transaction, async...) tạo ở đây
~~~
- Ở bước 3 mọi dependency đã sẵn sàng nên {{@PostConstruct}} dùng được chúng.
- Gọi {{this.method()}} là gọi trực tiếp object gốc (self-invocation), không qua proxy. Hơn nữa lúc đó proxy còn chưa tồn tại (bước 5). Vì vậy {{@Transactional}} không có tác dụng.

### Vì sao các phương án còn lại sai
- **Chạy trước constructor**: không thể, object phải được tạo ra trước thì mới có method để gọi.
- **Gọi lại mỗi lần getBean()**: singleton chỉ khởi tạo một lần, {{@PostConstruct}} chạy đúng một lần.
- **Proxy đã được tạo**: ngược lại, proxy được tạo sau (bước 5).

> Senior tip: logic khởi động cần transaction (warm cache từ DB, seed dữ liệu) nên đặt trong listener {{ApplicationReadyEvent}} hoặc {{ApplicationRunner}} của một bean khác, lúc đó mọi proxy đã sẵn sàng. Tránh việc nặng trong {{@PostConstruct}}: nó chặn startup và làm readiness probe trên Kubernetes fail.`
},
{
  id: 'qz-spring-010',
  topic: 'spring',
  q: 'Trong Spring Boot 3, {{AService}} nhận {{BService}} qua constructor, còn {{BService}} cũng nhận {{AService}} qua constructor. Không có cấu hình gì thêm. Khi khởi động ứng dụng thì sao?',
  options: [
    'Spring tự giải quyết bằng cách tạo proxy trung gian cho một trong hai bean',
    'Ứng dụng chạy bình thường nhưng một trong hai field sẽ là null',
    'Ứng dụng không khởi động được, Spring báo lỗi vòng phụ thuộc (BeanCurrentlyInCreationException, kèm sơ đồ cycle)',
    'Spring tạo hai instance của mỗi bean để phá vòng'
  ],
  answer: 2,
  explain: `**Đáp án đúng: ứng dụng không khởi động được và báo lỗi circular dependency.**

### Vì sao đúng
Để tạo A, Spring phải gọi constructor của A, mà constructor cần B đã hoàn chỉnh; để tạo B lại cần A. Với constructor injection, không có thời điểm nào object "tồn tại nhưng chưa xong" để đưa ra trước, nên Spring không thể phá vòng. Spring ném {{BeanCurrentlyInCreationException}} và Spring Boot in báo cáo "The dependencies of some of the beans in the application context form a cycle" kèm sơ đồ.

Từ Spring Boot 2.6, ngay cả vòng phụ thuộc dùng field/setter injection (vốn Spring giải được bằng early reference) cũng **bị cấm mặc định** ({{spring.main.allow-circular-references=false}}).

### Vì sao các phương án còn lại sai
- **Tự tạo proxy trung gian**: Spring chỉ làm vậy khi bạn đánh dấu {{@Lazy}} lên tham số constructor; mặc định thì không.
- **Một field là null**: Spring không bao giờ âm thầm inject null cho dependency bắt buộc; nó fail fast.
- **Tạo hai instance**: singleton không bao giờ bị nhân đôi để phá vòng.

### Cách sửa
- Tốt nhất: tách phần dùng chung ra service thứ ba, hoặc dùng event ({{ApplicationEventPublisher}}) để đảo chiều phụ thuộc.
- Tạm thời: {{@Lazy}} trên một tham số constructor.

> Senior tip: vòng phụ thuộc là triệu chứng thiết kế (hai service cùng ôm một trách nhiệm). Khi review, đừng bật lại {{allow-circular-references=true}} cho "chạy được", đó là nợ kỹ thuật làm khó cả việc test lẫn tách module sau này.`
},
{
  id: 'qz-spring-011',
  topic: 'spring',
  q: 'Thuộc tính {{spring.datasource.url}} được khai báo ở 4 nơi: {{application.yml}}, {{application-prod.yml}} (profile prod đang active), biến môi trường {{SPRING_DATASOURCE_URL}} và tham số dòng lệnh {{--spring.datasource.url=...}}. Giá trị nào được dùng?',
  options: [
    'Giá trị trong application-prod.yml vì profile-specific luôn ưu tiên cao nhất',
    'Giá trị trong application.yml vì nó được nạp đầu tiên',
    'Biến môi trường SPRING_DATASOURCE_URL vì môi trường OS luôn thắng',
    'Tham số dòng lệnh --spring.datasource.url'
  ],
  answer: 3,
  explain: `**Đáp án đúng: tham số dòng lệnh.**

### Vì sao đúng
Spring Boot xếp các {{PropertySource}} theo thứ tự ưu tiên, nguồn sau ghi đè nguồn trước. Rút gọn từ thấp đến cao:
~~~text
application.yml (trong jar)
application-{profile}.yml (trong jar)
application.yml / application-{profile}.yml bên ngoài jar
biến môi trường OS
Java system properties (-D...)
SPRING_APPLICATION_JSON
tham số dòng lệnh (--key=value)        <- cao nhất trong 4 nguồn của câu hỏi
(test: @TestPropertySource, @DynamicPropertySource còn cao hơn)
~~~
Biến {{SPRING_DATASOURCE_URL}} được map sang {{spring.datasource.url}} nhờ relaxed binding, nhưng vẫn thua tham số dòng lệnh.

### Vì sao các phương án còn lại sai
- **application-prod.yml cao nhất**: file profile chỉ thắng file không profile; mọi file config đều thua biến môi trường và dòng lệnh.
- **application.yml vì nạp đầu tiên**: nạp đầu tiên nghĩa là ưu tiên **thấp nhất**.
- **Biến môi trường luôn thắng**: thắng file config nhưng thua system properties và tham số dòng lệnh.

> Senior tip: khi debug "sao config không ăn", gọi {{/actuator/env/spring.datasource.url}} (cần expose endpoint env và chỉ bật ở môi trường an toàn) để xem giá trị cuối cùng và nó đến từ property source nào. Trên Kubernetes, quy ước tốt là để mặc định trong file, còn khác biệt theo môi trường đưa vào env/ConfigMap/Secret.`
},
{
  id: 'qz-spring-012',
  topic: 'spring',
  q: 'Bạn khai báo một {{@Bean}} trả về {{new ObjectMapper()}} trong một class {{@Configuration}}. Sau đó các thuộc tính {{spring.jackson.*}} trong application.yml "không còn tác dụng". Vì sao?',
  options: [
    'Vì ObjectMapper tự tạo này thay thế bean của auto-configuration (điều kiện @ConditionalOnMissingBean), nên các cấu hình spring.jackson.* không còn được áp dụng lên nó',
    'Vì Spring Boot 3 đã bỏ hỗ trợ spring.jackson.* và bắt buộc cấu hình bằng code',
    'Vì có hai bean ObjectMapper và Spring chọn ngẫu nhiên một bean',
    'Vì spring.jackson.* chỉ áp dụng cho WebFlux, không áp dụng cho Spring MVC'
  ],
  answer: 0,
  explain: `**Đáp án đúng: auto-configuration "lùi lại" vì đã có bean ObjectMapper do bạn định nghĩa.**

### Vì sao đúng
{{JacksonAutoConfiguration}} khai báo bean ObjectMapper với {{@ConditionalOnMissingBean}}: chỉ tạo khi context **chưa có** ObjectMapper nào. Bean của Boot được build từ {{Jackson2ObjectMapperBuilder}}, và builder này mới là chỗ đọc {{spring.jackson.*}} (date format, naming strategy, module JavaTimeModule...). Khi bạn tự {{new ObjectMapper()}}, bean của Boot không được tạo và object của bạn không đi qua builder, nên mất toàn bộ cấu hình đó, kể cả module mặc định. Triệu chứng điển hình: {{LocalDateTime}} serialize thành mảng hoặc lỗi.

### Vì sao các phương án còn lại sai
- **Boot 3 bỏ spring.jackson.***: sai, các thuộc tính này vẫn được hỗ trợ đầy đủ trong Boot 3.x.
- **Chọn ngẫu nhiên giữa hai bean**: không có hai bean; bean của Boot không được tạo. Và Spring không bao giờ chọn ngẫu nhiên, có hai ứng viên thì báo lỗi {{NoUniqueBeanDefinitionException}} trừ khi có {{@Primary}}.
- **Chỉ cho WebFlux**: sai, nó áp dụng cho ObjectMapper dùng chung ở cả MVC và WebFlux.

### Cách đúng
~~~java
@Bean
Jackson2ObjectMapperBuilderCustomizer customizer() {
    // chỉ chỉnh thêm, giữ nguyên mọi cấu hình của Boot
    return b -> b.featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
}
~~~

> Senior tip: quy tắc chung với auto-configuration là **customize, đừng replace**. Hầu hết starter đều có Customizer hoặc thuộc tính. Muốn biết vì sao một auto-config bật/tắt, chạy app với {{--debug}} để in Condition Evaluation Report.`
},
{
  id: 'qz-spring-013',
  topic: 'spring',
  q: 'Service dùng {{@Async}} để gửi email, dựa vào executor mặc định do Spring Boot 3 auto-config (không bật virtual threads). Giờ cao điểm có 5.000 lời gọi/giây, mỗi lần gửi mất 300 ms. Điều gì xảy ra?',
  options: [
    'Spring tự tăng số thread lên không giới hạn nên mọi email được gửi ngay',
    'Pool mặc định có 8 core thread và hàng đợi không giới hạn: task dồn ứ trong queue, độ trễ tăng dần và heap có thể bị đầy',
    'Khi pool đầy, @Async tự chuyển sang chạy đồng bộ trên thread của caller',
    'Mỗi lời gọi @Async tạo một platform thread mới rồi huỷ đi'
  ],
  answer: 1,
  explain: `**Đáp án đúng: 8 core thread + queue không giới hạn, task dồn ứ, latency và heap tăng.**

### Vì sao đúng
Boot auto-config một {{ThreadPoolTaskExecutor}} tên {{applicationTaskExecutor}} với mặc định: core size 8, queue capacity {{Integer.MAX_VALUE}}, max size {{Integer.MAX_VALUE}}. Với {{ThreadPoolExecutor}}, thread vượt core **chỉ được tạo khi queue đầy**, mà queue gần như không bao giờ đầy, nên thực tế luôn chỉ có 8 thread.

Tính nhanh: 8 thread / 0,3 s = khoảng 27 email/giây, trong khi đến 5.000/giây. Queue tăng gần 5.000 task mỗi giây, email gửi trễ hàng giờ, và mỗi task giữ tham chiếu tới dữ liệu nên heap phình dần tới OOM.

### Vì sao các phương án còn lại sai
- **Tự tăng thread không giới hạn**: max size lớn nhưng vô nghĩa khi queue không bao giờ đầy.
- **Tự chuyển sang chạy đồng bộ**: đó là hành vi của {{CallerRunsPolicy}}, chỉ xảy ra khi bạn tự cấu hình queue có giới hạn và policy đó.
- **Mỗi lời gọi một thread mới**: đó là {{SimpleAsyncTaskExecutor}}, executor Boot dùng khi bật {{spring.threads.virtual.enabled=true}} (với virtual thread), không phải mặc định.

### Cấu hình hợp lý
~~~yaml
spring.task.execution.pool:
  core-size: 16
  max-size: 64
  queue-capacity: 1000   # có giới hạn để còn backpressure
~~~

> Senior tip: việc gửi email/notification khối lượng lớn nên đi qua message queue (SQS, Kafka) thay vì {{@Async}} trong bộ nhớ: restart pod là mất toàn bộ task trong queue. Nếu vẫn dùng {{@Async}}, hãy expose metric {{executor.queued}} qua Micrometer và đặt alert.`
},
{
  id: 'qz-spring-014',
  topic: 'spring',
  multi: true,
  q: 'Với Spring Boot 3 + Hibernate ({{JpaTransactionManager}}), đặt {{@Transactional(readOnly = true)}} trên method đọc dữ liệu mang lại tác dụng nào? (Chọn 2)',
  options: [
    'Isolation level tự động nâng lên SERIALIZABLE để đọc nhất quán',
    'Hibernate không dirty-check và không flush khi kết thúc (session ở chế độ read-only, flush mode MANUAL), giảm CPU và bộ nhớ snapshot',
    'Mọi query trong method tự động được lưu vào second-level cache',
    'Method có thể chạy song song mà không cần connection từ pool',
    'Connection JDBC được đánh dấu read-only, cho phép driver/DB tối ưu hoặc cho routing datasource chuyển sang read replica'
  ],
  answer: [1, 4],
  explain: `**Đáp án đúng: Hibernate bỏ dirty checking/flush; connection được đánh dấu read-only (có thể route sang replica).**

### Vì sao đúng
- Khi transaction là read-only, {{HibernateJpaDialect}} đặt session sang default read-only và flush mode MANUAL. Entity load ra không cần giữ bản snapshot để so sánh, khi commit không có bước dirty checking duyệt qua từng entity. Với method đọc hàng nghìn entity, tiết kiệm đáng kể CPU và heap.
- Spring gọi {{Connection.setReadOnly(true)}}. Driver có thể tối ưu (PostgreSQL JDBC chuyển transaction sang {{READ ONLY}}), và một {{AbstractRoutingDataSource}} có thể dựa vào {{TransactionSynchronizationManager.isCurrentTransactionReadOnly()}} để chọn replica.

### Vì sao các phương án còn lại sai
- **Nâng lên SERIALIZABLE**: readOnly không đổi isolation; muốn thì phải đặt {{isolation}} riêng.
- **Tự dùng second-level cache**: cache L2 và query cache phải bật và cấu hình riêng cho từng entity/query.
- **Không cần connection**: transaction read-only vẫn lấy một connection từ pool và giữ nó tới hết method.

> Senior tip: pattern phổ biến là đặt {{@Transactional(readOnly = true)}} ở mức class service, rồi ghi đè {{@Transactional}} trên các method ghi. Khi dùng routing sang replica, nhớ replication lag: luồng "ghi xong đọc lại ngay" phải đọc từ primary, nếu không người dùng thấy dữ liệu cũ.`
},
{
  id: 'qz-spring-015',
  topic: 'spring',
  q: `Trong method {{@Transactional}} tạo đơn hàng, code gọi {{publisher.publishEvent(new OrderCreated(id))}}. Listener như sau. Phát biểu nào đúng?
~~~java
@TransactionalEventListener
public void sendEmail(OrderCreated e) { mailClient.send(e.id()); }
~~~`,
  options: [
    'Listener chạy ngay khi publishEvent được gọi, trước khi transaction commit',
    'Listener chạy cả khi transaction rollback, để báo lỗi cho khách',
    'Listener chỉ chạy sau khi transaction commit thành công (phase mặc định AFTER_COMMIT); nếu rollback thì email không được gửi',
    'Listener chạy trong cùng transaction nên nếu gửi mail lỗi, đơn hàng sẽ bị rollback'
  ],
  answer: 2,
  explain: `**Đáp án đúng: listener chỉ chạy sau khi commit thành công (AFTER_COMMIT).**

### Vì sao đúng
{{@TransactionalEventListener}} không gọi listener ngay. Spring đăng ký một {{TransactionSynchronization}} gắn với transaction hiện tại; phase mặc định là {{AFTER_COMMIT}}, nên listener chỉ chạy khi commit thành công. Đây chính là cách tránh lỗi kinh điển "gửi email xác nhận cho đơn hàng rồi transaction lại rollback".

### Vì sao các phương án còn lại sai
- **Chạy ngay khi publish**: đó là hành vi của {{@EventListener}} thường (đồng bộ, trong transaction).
- **Chạy cả khi rollback**: chỉ khi khai báo {{phase = AFTER_ROLLBACK}} hoặc {{AFTER_COMPLETION}}.
- **Lỗi mail rollback đơn hàng**: lúc listener chạy, transaction đã commit xong; exception của listener không thể rollback dữ liệu nữa.

### Bẫy cần nhớ
- Nếu publish khi **không có transaction**, listener mặc định bị bỏ qua (trừ khi {{fallbackExecution = true}}).
- Trong AFTER_COMMIT, ghi DB thêm sẽ không được commit nếu không mở transaction mới ({{REQUIRES_NEW}}).

> Senior tip: AFTER_COMMIT vẫn có khe hở: commit xong mà pod chết trước khi gửi mail thì event mất. Khi event bắt buộc phải tới nơi (thanh toán, tồn kho), dùng **transactional outbox**: ghi event vào bảng outbox trong cùng transaction, một relay (polling hoặc Debezium CDC) đẩy sang broker.`
},
{
  id: 'qz-spring-016',
  topic: 'spring',
  q: 'Bạn thêm {{spring-boot-starter-actuator}} vào ứng dụng Spring Boot 3 và không cấu hình gì thêm. Những endpoint nào truy cập được qua HTTP?',
  options: [
    'Tất cả endpoint: env, beans, heapdump, metrics... vì actuator dành cho vận hành',
    'health và info',
    'Không endpoint nào, phải bật thủ công từng cái',
    'Chỉ /actuator/health (và trang index /actuator liệt kê nó)'
  ],
  answer: 3,
  explain: `**Đáp án đúng: chỉ health được expose qua HTTP.**

### Vì sao đúng
Actuator tách hai khái niệm: endpoint **enabled** (tồn tại) và endpoint **exposed** (truy cập được qua web hay JMX). Mặc định, hầu hết endpoint đều enabled, nhưng qua HTTP chỉ expose {{health}} ({{management.endpoints.web.exposure.include=health}}). Muốn thêm phải khai báo, ví dụ:
~~~yaml
management.endpoints.web.exposure.include: health,info,prometheus
~~~

### Vì sao các phương án còn lại sai
- **Tất cả endpoint**: nếu vậy {{/actuator/env}} và {{/actuator/heapdump}} sẽ lộ secret và dữ liệu trong bộ nhớ, rủi ro bảo mật nghiêm trọng; Boot cố ý không làm thế.
- **health và info**: đây là mặc định ở Boot 2.0 đến 2.4; từ 2.5 {{info}} đã bị bỏ khỏi danh sách expose mặc định.
- **Không có endpoint nào**: health có sẵn để phục vụ load balancer và Kubernetes probe.

> Senior tip: tách actuator sang cổng riêng ({{management.server.port=8081}}) và không mở cổng đó ra internet. Trên Kubernetes dùng {{/actuator/health/liveness}} và {{/actuator/health/readiness}} (tự bật khi chạy trên k8s); đừng nhét kiểm tra DB vào liveness, nếu không DB chậm sẽ khiến k8s restart hàng loạt pod.`
},
{
  id: 'qz-spring-017',
  topic: 'spring',
  q: 'Ứng dụng Spring Boot 3 chạy trên Kubernetes, đã đặt {{server.shutdown=graceful}}. Khi pod nhận SIGTERM trong lúc đang xử lý request, điều gì xảy ra?',
  options: [
    'Web server ngừng nhận request mới, chờ các request đang chạy xử lý xong trong tối đa spring.lifecycle.timeout-per-shutdown-phase (mặc định 30 giây), rồi mới đóng context',
    'JVM dừng ngay lập tức, các request đang chạy bị cắt',
    'Spring chờ vô thời hạn tới khi mọi request xong, bất kể Kubernetes',
    'Spring chuyển các request đang chạy sang pod khác'
  ],
  answer: 0,
  explain: `**Đáp án đúng: ngừng nhận request mới, chờ request đang chạy tối đa timeout-per-shutdown-phase (30 giây mặc định), rồi đóng context.**

### Vì sao đúng
SIGTERM kích hoạt shutdown hook của JVM, Spring đóng {{ApplicationContext}}. Với graceful shutdown, web server (Tomcat, Jetty, Undertow, Netty) ngừng nhận kết nối mới, sau đó chờ request đang xử lý. Phase này bị giới hạn bởi {{spring.lifecycle.timeout-per-shutdown-phase}}, quá hạn thì tiếp tục đóng các bean (connection pool, Kafka consumer...).

### Vì sao các phương án còn lại sai
- **Dừng ngay lập tức**: chỉ xảy ra với SIGKILL (kill -9), hoặc khi Kubernetes hết {{terminationGracePeriodSeconds}} (mặc định 30 giây) và gửi SIGKILL.
- **Chờ vô thời hạn**: có timeout của Spring, và trên hết là grace period của Kubernetes.
- **Chuyển request sang pod khác**: request đang xử lý không thể "di chuyển"; việc định tuyến request **mới** sang pod khác là việc của Service/Ingress.

### Bẫy thực tế
Kubernetes gỡ pod khỏi Endpoints **song song** với việc gửi SIGTERM, nên vài giây đầu vẫn có request mới bay tới pod đang tắt và nhận lỗi. Cách xử lý: thêm {{preStop}} sleep 5–10 giây, và đặt {{terminationGracePeriodSeconds}} lớn hơn tổng preStop + timeout của Spring.

> Senior tip: với Kafka consumer hay job nền, graceful shutdown của web server không đủ; hãy kiểm tra listener container cũng dừng đúng cách (commit offset xong) trong cùng khung thời gian, nếu không mỗi lần deploy sẽ có message bị xử lý lại.`
},
{
  id: 'qz-spring-018',
  topic: 'spring',
  multi: true,
  q: 'Khi review code, bạn đề xuất chuyển từ field injection ({{@Autowired private X x;}}) sang constructor injection. Lợi ích nào là đúng? (Chọn 2)',
  options: [
    'Bean được khởi tạo lazy nên ứng dụng khởi động nhanh hơn',
    'Dependency có thể khai báo final, object luôn ở trạng thái đầy đủ ngay sau khi tạo',
    'Constructor bắt buộc phải gắn @Autowired, giúp code rõ ràng hơn',
    'Giúp Spring giải quyết được vòng phụ thuộc giữa các bean',
    'Unit test có thể tạo object bằng new và truyền mock vào mà không cần Spring hay reflection'
  ],
  answer: [1, 4],
  explain: `**Đáp án đúng: dependency final, object luôn đầy đủ; unit test dễ dàng bằng new + mock.**

### Vì sao đúng
- Constructor injection cho phép field {{final}}: không thể quên inject, không thể bị gán lại, và object không bao giờ tồn tại ở trạng thái "thiếu dependency".
- Test thuần không cần Spring context:
~~~java
var service = new OrderService(mock(OrderRepository.class), fixedClock);
~~~
Với field injection, bạn phải dùng {{@InjectMocks}} hoặc reflection để nhét mock vào field private.

### Vì sao các phương án còn lại sai
- **Khởi tạo lazy**: kiểu injection không ảnh hưởng thời điểm tạo bean; lazy là {{@Lazy}} hoặc {{spring.main.lazy-initialization}}.
- **Bắt buộc @Autowired**: từ Spring 4.3, class có **một** constructor thì không cần {{@Autowired}}.
- **Giải quyết vòng phụ thuộc**: ngược lại, constructor injection làm vòng phụ thuộc lộ ra ngay lúc khởi động (không thể giải), đó là ưu điểm "fail fast" chứ không phải giải quyết.

> Senior tip: constructor có quá 5–6 tham số là tín hiệu class đang làm quá nhiều việc. Field injection che giấu tín hiệu đó, constructor injection làm nó "đau mắt" ngay, đây là lý do thực sự để ưu tiên constructor injection.`
},
{
  id: 'qz-spring-019',
  topic: 'spring',
  q: 'Test {{@WebMvcTest(OrderController.class)}} fail ngay khi load context với lỗi "No qualifying bean of type OrderService". {{OrderController}} nhận {{OrderService}} qua constructor. Nguyên nhân và cách sửa đúng?',
  options: [
    'Phải dùng @SpringBootTest vì @WebMvcTest không hỗ trợ controller có constructor injection',
    '@WebMvcTest chỉ nạp các thành phần web (controller, advice, filter, converter...), không nạp @Service; cần cung cấp mock bằng @MockitoBean (Spring 6.2+) hoặc @MockBean',
    'OrderService thiếu @Component nên Spring không quét được, kể cả khi chạy thật',
    'Cần thêm @ComponentScan vào class test để quét toàn bộ package'
  ],
  answer: 1,
  explain: `**Đáp án đúng: @WebMvcTest là test slice chỉ nạp tầng web, nên phải mock OrderService.**

### Vì sao đúng
Test slice tạo một context **thu nhỏ**: với {{@WebMvcTest}} chỉ có {{@Controller}}, {{@ControllerAdvice}}, {{Filter}}, {{WebMvcConfigurer}}, converter, Jackson... và {{MockMvc}}. Bean {{@Service}}, {{@Repository}} bị loại có chủ đích, để test chạy nhanh và chỉ kiểm tra mapping, validation, serialization, status code.
~~~java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mvc;
    @MockitoBean OrderService orderService; // Spring Framework 6.2+ (Boot 3.4+)
}
~~~
{{@MockBean}} của Boot vẫn chạy nhưng đã deprecated từ Boot 3.4.

### Vì sao các phương án còn lại sai
- **Không hỗ trợ constructor injection**: sai, constructor injection hoạt động bình thường, chỉ thiếu bean.
- **Thiếu @Component**: lỗi chỉ xảy ra trong test slice, app thật vẫn chạy được, nên không phải do thiếu annotation.
- **Thêm @ComponentScan**: phá đi mục đích của slice (nạp cả service, repository, rồi lại đòi DataSource), test chậm và giòn.

> Senior tip: kim tự tháp test cho Spring: nhiều unit test thuần (không context), một lớp slice test ({{@WebMvcTest}}, {{@DataJpaTest}} + Testcontainers), và ít {{@SpringBootTest}}. Mỗi tổ hợp {{@MockitoBean}} khác nhau tạo ra một context cache riêng, nên thống nhất bộ mock để context được tái sử dụng giữa các test.`
},
{
  id: 'qz-spring-020',
  topic: 'spring',
  multi: true,
  q: 'Service có hai method {{@Scheduled}}: {{syncInventory()}} (fixedRate 1 phút, đôi khi chạy 5 phút) và {{sendReminders()}} (cron mỗi phút). Ứng dụng chạy 3 pod, Spring Boot 3, không cấu hình scheduler. Phát biểu nào đúng? (Chọn 2)',
  options: [
    'Spring tự bầu một pod làm leader nên mỗi job chỉ chạy trên một pod',
    'Mỗi job chạy trên cả 3 pod, nên reminder có thể bị gửi 3 lần nếu không có distributed lock (ví dụ ShedLock)',
    'Khi syncInventory() chạy 5 phút, Spring chạy chồng thêm 4 lần syncInventory() song song để giữ đúng nhịp 1 phút',
    'Scheduler mặc định chỉ có 1 thread, nên trong lúc syncInventory() chạy lâu thì sendReminders() bị trễ theo',
    'Mỗi method @Scheduled tự có một thread riêng nên chúng không bao giờ ảnh hưởng nhau'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: job chạy trên mọi pod; scheduler mặc định 1 thread nên job chậm làm trễ job khác.**

### Vì sao đúng
- {{@Scheduled}} hoàn toàn cục bộ trong JVM. 3 pod nghĩa là 3 scheduler độc lập, mỗi job chạy 3 lần. Cần distributed lock (ShedLock dựa trên bảng DB hoặc Redis), hoặc chuyển job sang một nơi chạy duy nhất (Kubernetes CronJob, worker riêng).
- Boot auto-config {{ThreadPoolTaskScheduler}} với {{spring.task.scheduling.pool.size=1}}. Mọi job xếp hàng trên một thread duy nhất, nên {{syncInventory()}} chạy 5 phút sẽ chặn {{sendReminders()}} suốt 5 phút đó.

### Vì sao các phương án còn lại sai
- **Tự bầu leader**: Spring core không có leader election (Spring Integration có, nhưng phải tự cấu hình).
- **Chạy chồng song song**: với fixedRate, một task không chạy chồng lên chính nó; lần chạy kế tiếp chỉ bắt đầu (muộn) sau khi lần trước xong.
- **Mỗi method một thread riêng**: sai, mặc định chỉ có 1 thread dùng chung.

~~~yaml
spring.task.scheduling.pool.size: 4   # cho các job không chặn nhau
~~~

> Senior tip: với job quan trọng, ngoài lock còn cần **idempotency** (đánh dấu reminder đã gửi trong DB) vì lock có TTL: job chạy lâu hơn {{lockAtMostFor}} thì pod khác vẫn có thể chạy chồng. Thêm metric thời gian chạy và lần chạy thành công cuối cùng để biết job "chết im lặng".`
},
{
  id: 'qz-jpa-007',
  topic: 'jpa',
  q: `Entity {{Order}} dùng id SEQUENCE, đã tồn tại trong DB. Method sau sinh ra bao nhiêu câu SQL (bỏ qua câu lấy sequence)?
~~~java
@Transactional
public void addNote(Long id) {
    Order o = orderRepo.findById(id).orElseThrow();
    o.setNote("Giao giờ hành chính");
    orderRepo.save(o);
}
~~~`,
  options: [
    '3 câu: SELECT, SELECT (do save gọi merge), UPDATE',
    '1 câu: chỉ UPDATE, vì findById lấy từ cache',
    '2 câu: một SELECT khi findById và một UPDATE khi flush lúc commit',
    '2 câu: SELECT và UPDATE ngay tại dòng save()'
  ],
  answer: 2,
  explain: `**Đáp án đúng: 2 câu, SELECT khi findById và UPDATE khi flush lúc commit.**

### Vì sao đúng
1. {{findById}} gọi {{em.find}}: persistence context chưa có entity nên chạy SELECT, entity trở thành **managed** và Hibernate giữ một snapshot.
2. {{setNote}} chỉ đổi field trong bộ nhớ.
3. {{save(o)}}: {{SimpleJpaRepository}} thấy entity không mới nên gọi {{em.merge(o)}}. Vì {{o}} đang managed, merge chỉ trả về chính nó, **không** query gì thêm.
4. Khi commit, Hibernate flush: dirty checking so sánh với snapshot, thấy {{note}} đổi nên sinh một UPDATE.

### Vì sao các phương án còn lại sai
- **3 câu (merge thêm SELECT)**: merge chỉ SELECT khi entity **detached** và chưa có trong persistence context.
- **1 câu (lấy từ cache)**: persistence context trống lúc đầu; cache L2 không bật mặc định.
- **UPDATE ngay tại save()**: save không flush; UPDATE chỉ chạy khi flush (lúc commit hoặc trước một query cần dữ liệu mới).

> Senior tip: {{save()}} trên entity managed là thừa, xoá đi code vẫn chạy y hệt nhờ dirty checking. Bật {{spring.jpa.properties.hibernate.generate_statistics=true}} ở môi trường dev hoặc dùng datasource-proxy để assert số query trong integration test: đây là cách bắt N+1 và query thừa trước khi lên production.`
},
{
  id: 'qz-jpa-008',
  topic: 'jpa',
  q: 'Khi thêm một {{OrderItem}} cho đơn hàng có id đã biết, bạn chỉ cần gán khoá ngoại, không cần dữ liệu của {{Order}}. Cách nào tránh được câu SELECT order không cần thiết?',
  options: [
    'orderRepo.findById(orderId).get(), vì Hibernate tự bỏ SELECT khi thấy chỉ dùng id',
    'Tạo new Order(), setId(orderId) rồi gán vào item và gọi save(order) trước',
    'Dùng native query INSERT cho mọi trường hợp',
    'item.setOrder(orderRepo.getReferenceById(orderId)), vì nó trả về proxy chỉ chứa id, không chạy SELECT'
  ],
  answer: 3,
  explain: `**Đáp án đúng: getReferenceById (em.getReference) trả về proxy chưa khởi tạo, không chạy SELECT.**

### Vì sao đúng
{{getReferenceById}} gọi {{EntityManager.getReference}}: Hibernate tạo một proxy chỉ biết id. Khi gán vào {{item.setOrder(...)}} rồi persist item, Hibernate chỉ cần id để ghi cột {{order_id}}, nên chỉ có một câu INSERT. Proxy chỉ chạy SELECT khi bạn gọi getter khác id.

### Vì sao các phương án còn lại sai
- **findById**: luôn chạy SELECT (nếu chưa có trong persistence context), Hibernate không suy luận "chỉ cần id".
- **new Order() + setId + save**: object mới với id có sẵn bị coi là detached, save sẽ merge, tức là SELECT rồi có thể UPDATE đè các cột khác thành null. Rất nguy hiểm.
- **Native INSERT cho mọi trường hợp**: được nhưng bỏ qua lifecycle, cascade, persistence context; dùng dao mổ trâu cho một việc mà JPA đã hỗ trợ sẵn.

### Pitfall
Nếu id không tồn tại, getReference không báo lỗi ngay; lỗi xuất hiện lúc flush (vi phạm FK) hoặc lúc truy cập proxy ({{EntityNotFoundException}}). Proxy dùng ngoài transaction thì gặp {{LazyInitializationException}}.

> Senior tip: trong batch import hàng triệu dòng con, đổi findById sang getReference có thể cắt một nửa số round-trip tới DB. Đây là tối ưu đơn giản nhưng hay bị bỏ qua khi review.`
},
{
  id: 'qz-jpa-009',
  topic: 'jpa',
  multi: true,
  q: 'Theo đặc tả JPA, phát biểu nào về FetchType mặc định là đúng? (Chọn 2)',
  options: [
    '@ManyToOne mặc định EAGER',
    '@OneToOne mặc định LAZY',
    '@ElementCollection mặc định EAGER',
    '@OneToMany mặc định LAZY',
    'Mọi association đều mặc định LAZY'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: @ManyToOne mặc định EAGER; @OneToMany mặc định LAZY.**

### Vì sao đúng
Quy tắc dễ nhớ của đặc tả JPA: **phía "to-one" mặc định EAGER, phía "to-many" mặc định LAZY**.

| Annotation | Mặc định |
|---|---|
| @ManyToOne, @OneToOne | EAGER |
| @OneToMany, @ManyToMany, @ElementCollection | LAZY |

### Vì sao các phương án còn lại sai
- **@OneToOne LAZY**: sai, nó là to-one nên EAGER.
- **@ElementCollection EAGER**: sai, nó là collection nên LAZY.
- **Mọi association LAZY**: sai, to-one là EAGER. Đây là hiểu lầm gây ra nhiều N+1 ẩn nhất.

### Vì sao quan trọng
EAGER trên {{@ManyToOne}} nghĩa là query JPQL {{select i from OrderItem i}} trả về 100 item sẽ kéo theo tới 100 câu SELECT order (nếu order khác nhau), vì JPQL không tự JOIN cho association EAGER mà Hibernate phải load bù sau đó.

~~~java
@ManyToOne(fetch = FetchType.LAZY) // nên khai báo tường minh
private Order order;
~~~

> Senior tip: quy ước an toàn ở hầu hết dự án lớn là **mọi association đều LAZY**, rồi fetch đúng thứ cần cho từng use case bằng {{JOIN FETCH}} hoặc {{@EntityGraph}}. Lưu ý {{@OneToOne}} phía không sở hữu (mappedBy) thường vẫn bị load ngay dù khai báo LAZY, vì Hibernate cần biết có null hay không.`
},
{
  id: 'qz-jpa-010',
  topic: 'jpa',
  q: 'Repository có {{@Query("select o from Order o join fetch o.items")}} kèm tham số {{Pageable}} (page size 20). Bảng có 200.000 order. Hibernate 6 xử lý thế nào?',
  options: [
    'Hibernate log cảnh báo HHH90003004 (firstResult/maxResults specified with collection fetch; applying in memory): nó tải toàn bộ kết quả rồi cắt trang trong bộ nhớ',
    'Hibernate thêm LIMIT 20 vào SQL nên trả về đúng 20 order với đầy đủ items',
    'Hibernate ném exception ngay khi khởi động ứng dụng',
    'Hibernate tự chuyển thành hai query: lấy id phân trang trước rồi fetch items'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Hibernate cảnh báo HHH90003004 và phân trang trong bộ nhớ.**

### Vì sao đúng
JOIN FETCH collection tạo ra **mỗi dòng cho một item**, không phải cho một order. Nếu Hibernate đặt LIMIT 20 vào SQL, nó sẽ cắt ngang giữa các item của một order, trả về order thiếu items. Vì vậy Hibernate bỏ LIMIT khỏi SQL, tải **toàn bộ** kết quả join (200.000 order nhân số item) vào bộ nhớ, rồi mới lấy 20 order. Dữ liệu đúng nhưng chậm và có thể gây OOM.

### Vì sao các phương án còn lại sai
- **Thêm LIMIT 20 vào SQL**: chính là điều Hibernate tránh làm vì sẽ cho kết quả sai.
- **Ném exception khi khởi động**: chỉ khi bật {{hibernate.query.fail_on_pagination_over_collection_fetch=true}}, và lúc đó lỗi xảy ra khi chạy query, không phải lúc khởi động. Nên bật cờ này để biến cảnh báo thành lỗi.
- **Tự tách hai query**: Hibernate không tự làm; bạn phải tự viết.

### Cách đúng: hai bước
~~~java
Page<Long> ids = repo.findIds(pageable);               // select o.id ... order by ... (có LIMIT)
List<Order> orders = repo.findWithItems(ids.getContent()); // join fetch ... where o.id in :ids
~~~
Hoặc dùng {{@BatchSize}}/{{hibernate.default_batch_fetch_size}} để load items theo lô.

> Senior tip: grep log production theo mã HHH90003004 (Hibernate 5 là HHH000104), đây là "quả bom hẹn giờ" thường chỉ nổ khi bảng đủ lớn.`
},
{
  id: 'qz-jpa-011',
  topic: 'jpa',
  q: 'Entity {{Post}} có hai collection {{List<Comment> comments}} và {{List<Tag> tags}}. Query {{select p from Post p join fetch p.comments join fetch p.tags}} ném exception ngay khi chạy. Đó là gì và vì sao?',
  options: [
    'LazyInitializationException vì fetch hai collection cần hai transaction',
    'MultipleBagFetchException: Hibernate không cho fetch đồng thời nhiều "bag" (List không có index) vì tích Descartes làm nhân bản phần tử không phân biệt được',
    'NonUniqueResultException vì kết quả có nhiều dòng trùng Post',
    'QuerySyntaxException vì JPQL chỉ cho phép một JOIN FETCH mỗi query'
  ],
  answer: 1,
  explain: `**Đáp án đúng: MultipleBagFetchException.**

### Vì sao đúng
{{List}} không có {{@OrderColumn}} được Hibernate ánh xạ thành **bag** (cho phép trùng, không có vị trí). Fetch hai collection cùng lúc tạo tích Descartes: post có 10 comment và 5 tag sinh ra 50 dòng. Với bag, Hibernate không thể biết comment xuất hiện 5 lần là do join hay do dữ liệu thật trùng lặp, nên nó từ chối ngay.

### Vì sao các phương án còn lại sai
- **LazyInitializationException**: chỉ xảy ra khi truy cập lazy ngoài session, không liên quan.
- **NonUniqueResultException**: xảy ra khi gọi getSingleResult mà có nhiều kết quả; ở đây lỗi xảy ra trước đó.
- **Chỉ một JOIN FETCH**: sai, JPQL cho phép nhiều JOIN FETCH (ví dụ fetch nhiều to-one hoặc to-one + một collection).

### Cách sửa
1. **Fetch từng collection bằng query riêng** (khuyến nghị): query 1 fetch comments, query 2 fetch tags cho cùng danh sách post; persistence context tự ghép.
2. Đổi sang {{Set}}: hết exception nhưng **vẫn** tích Descartes 50 dòng, với dữ liệu lớn sẽ cực chậm.

> Senior tip: đổi List sang Set chỉ để "hết lỗi" là cách sửa sai phổ biến nhất. 1.000 post x 50 comment x 20 tag = 1 triệu dòng trả về từ DB. Hai query riêng chỉ trả về 70.000 dòng.`
},
{
  id: 'qz-jpa-012',
  topic: 'jpa',
  q: `Entity dùng id tự sinh và tự viết {{equals/hashCode}} dựa trên {{id}}. Kết quả của dòng cuối là gì?
~~~java
Set<Item> set = new HashSet<>();
Item item = new Item("Bút");   // id = null
set.add(item);
em.persist(item);              // id được gán, ví dụ 101
em.flush();
System.out.println(set.contains(item));
~~~`,
  options: [
    'true, vì là cùng một object',
    'Ném NullPointerException tại set.add vì id null',
    'false, vì hashCode đổi sau khi id được gán nên HashSet tìm sai bucket',
    'true, vì Hibernate tự rehash các collection chứa entity khi persist'
  ],
  answer: 2,
  explain: `**Đáp án đúng: false.**

### Vì sao đúng
Lúc {{add}}, hashCode tính từ id null (ví dụ {{Objects.hashCode(null) = 0}}), object nằm ở bucket ứng với 0. Sau persist, id = 101 nên hashCode thay đổi. {{contains}} tính hashCode mới, nhìn vào bucket khác, không thấy gì, trả về false, dù object vẫn nằm trong set. Đây là vi phạm hợp đồng: hashCode của object trong HashSet không được đổi.

### Vì sao các phương án còn lại sai
- **true vì cùng object**: HashSet kiểm tra hashCode (bucket) trước khi so sánh equals/==, nên bucket sai là không tìm thấy.
- **NullPointerException**: {{Objects.hashCode(null)}} trả 0, {{Objects.equals}} xử lý null an toàn; không ném NPE (trừ khi bạn gọi id.hashCode() trực tiếp).
- **Hibernate rehash**: Hibernate không đụng tới HashSet tự tạo của bạn.

### Cách viết an toàn
~~~java
@Override public boolean equals(Object o) {
    if (this == o) return true;
    if (!(o instanceof Item other)) return false;
    return id != null && id.equals(other.getId());   // entity mới không bằng nhau
}
@Override public int hashCode() { return getClass().hashCode(); } // hằng số, không đổi
~~~
Hoặc dùng natural/business key bất biến (mã SKU, UUID tự sinh trong constructor).

> Senior tip: bug này hay xuất hiện với {{@OneToMany Set<Item>}} có cascade: thêm item mới vào set, save, rồi {{remove(item)}} không xoá được. Lưu ý dùng {{getClass()}} có thể sai khi so với Hibernate proxy, nên nhiều team so {{Hibernate.getClass(this)}}.`
},
{
  id: 'qz-jpa-013',
  topic: 'jpa',
  q: '{{Order}} có {{@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true) List<OrderItem> items}}. Trong transaction, code gọi {{order.getItems().remove(item)}} rồi commit. Điều gì xảy ra với dòng order_item tương ứng?',
  options: [
    'Không có gì xảy ra vì không gọi itemRepo.delete',
    'Cột order_id của dòng đó được set NULL',
    'Ném exception vì không được sửa collection của entity managed',
    'Hibernate sinh câu DELETE cho dòng order_item đó khi flush'
  ],
  answer: 3,
  explain: `**Đáp án đúng: Hibernate DELETE dòng order_item khi flush.**

### Vì sao đúng
{{orphanRemoval = true}} nghĩa là: con bị gỡ khỏi collection của cha là "mồ côi" và phải bị xoá. Khi flush, Hibernate so collection với snapshot, thấy item biến mất nên lên lịch DELETE item đó.

So sánh:
| Cấu hình | remove khỏi collection | xoá cha |
|---|---|---|
| cascade REMOVE (không orphanRemoval) | không làm gì | xoá cả con |
| orphanRemoval = true | DELETE con | xoá cả con |

### Vì sao các phương án còn lại sai
- **Không có gì xảy ra**: đúng nếu **không** có orphanRemoval, vì phía sở hữu (owning side) là {{OrderItem.order}}; chỉ sửa collection phía mappedBy thì Hibernate không cập nhật gì.
- **Set order_id = NULL**: hành vi của @OneToMany **một chiều** có join column (không mappedBy, không orphanRemoval), không phải ở đây.
- **Ném exception**: sửa collection của entity managed là hoàn toàn hợp lệ. (Chỉ có lỗi khi bạn **gán** collection mới bằng setItems(new ArrayList()) với orphanRemoval, Hibernate báo "A collection with cascade=all-delete-orphan was no longer referenced".)

> Senior tip: orphanRemoval chỉ dùng cho quan hệ **composition** thật sự (item không tồn tại ngoài order). Đừng dùng cho quan hệ có thể chuyển cha, ví dụ nhân viên chuyển phòng ban, vì "gỡ khỏi phòng cũ" sẽ xoá luôn nhân viên.`
},
{
  id: 'qz-jpa-014',
  topic: 'jpa',
  q: `Quan hệ hai chiều: {{Order.items}} là {{@OneToMany(mappedBy = "order", cascade = CascadeType.ALL)}}, còn {{OrderItem.order}} là {{@ManyToOne}}. Code sau lưu gì vào cột order_item.order_id?
~~~java
Order order = new Order();
OrderItem item = new OrderItem("SKU-1");
order.getItems().add(item);   // không gọi item.setOrder(order)
orderRepo.save(order);
~~~`,
  options: [
    'NULL (hoặc lỗi nếu cột NOT NULL), vì phía sở hữu quan hệ là OrderItem.order mà field đó không được gán',
    'id của order, vì Hibernate tự đồng bộ hai phía của quan hệ',
    'Item không được lưu vì cascade chỉ áp dụng khi gọi itemRepo.save',
    'Hibernate ném exception vì quan hệ hai chiều bị lệch'
  ],
  answer: 0,
  explain: `**Đáp án đúng: order_id là NULL (hoặc lỗi constraint nếu NOT NULL).**

### Vì sao đúng
Trong quan hệ hai chiều, chỉ **owning side** (phía không có mappedBy, ở đây là {{OrderItem.order}}) quyết định giá trị khoá ngoại. Phía {{mappedBy}} chỉ là "gương" để đọc. Cascade ALL khiến item được persist cùng order, nhưng khi ghi cột order_id, Hibernate đọc {{item.getOrder()}}, thấy null, nên ghi NULL.

### Vì sao các phương án còn lại sai
- **Tự đồng bộ hai phía**: Hibernate không làm (trừ khi bật bytecode enhancement với association management, ít dùng). Đồng bộ là trách nhiệm của code.
- **Item không được lưu**: cascade ALL từ order sang items vẫn persist item.
- **Ném exception vì lệch**: Hibernate không kiểm tra tính nhất quán hai phía.

### Cách đúng: helper method
~~~java
public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);   // cập nhật owning side
}
~~~

> Senior tip: luôn khai báo order_id NOT NULL ở DB (migration Flyway/Liquibase) để bug kiểu này nổ ngay lúc test thay vì âm thầm sinh dữ liệu mồ côi trên production.`
},
{
  id: 'qz-jpa-015',
  topic: 'jpa',
  multi: true,
  q: 'Job import 1 triệu dòng CSV vào bảng {{product}} bằng Spring Data JPA chạy rất chậm và cuối cùng OutOfMemoryError. Những thay đổi nào giải quyết đúng vấn đề? (Chọn 3)',
  options: [
    'Bật hibernate.jdbc.batch_size (ví dụ 50) và hibernate.order_inserts=true',
    'Gọi saveAndFlush() cho từng entity để giải phóng bộ nhớ ngay',
    'Cứ mỗi batch thì gọi em.flush() rồi em.clear() để persistence context không phình ra',
    'Dùng id GenerationType.SEQUENCE (với allocationSize phù hợp) thay vì IDENTITY',
    'Đổi mọi association sang FetchType.EAGER để giảm số query'
  ],
  answer: [0, 2, 3],
  explain: `**Đáp án đúng: bật JDBC batching; flush + clear theo lô; dùng SEQUENCE thay vì IDENTITY.**

### Vì sao đúng
- **OOM**: persistence context giữ mọi entity đã persist (kèm snapshot) tới hết transaction. 1 triệu entity nằm trong heap, dirty checking lúc flush duyệt cả 1 triệu. {{flush()}} + {{clear()}} mỗi 50–1000 dòng giữ bộ nhớ ổn định.
- **Chậm**: không batching thì mỗi INSERT là một round-trip. {{batch_size}} gom nhiều INSERT vào một lần gửi; {{order_inserts}} sắp xếp để INSERT cùng bảng đứng cạnh nhau, tăng hiệu quả batch.
- **IDENTITY phá batching**: Hibernate phải INSERT ngay để lấy id. SEQUENCE với pooled optimizer ({{allocationSize = 50}}) lấy 50 id bằng một lần gọi sequence.

~~~java
for (int i = 0; i < rows.size(); i++) {
    em.persist(toEntity(rows.get(i)));
    if (i % 50 == 49) { em.flush(); em.clear(); } // khớp với batch_size
}
~~~

### Vì sao các phương án còn lại sai
- **saveAndFlush từng entity**: flush mỗi dòng giết batching (mỗi lần chỉ 1 INSERT), và không clear nên vẫn giữ entity trong bộ nhớ.
- **EAGER**: chỉ làm tăng dữ liệu bị load, không liên quan tới insert, còn làm tình hình tệ hơn.

> Senior tip: với PostgreSQL thêm {{reWriteBatchedInserts=true}} vào JDBC URL để driver gộp thành INSERT nhiều VALUES, thường nhanh thêm 2–3 lần. Với hàng chục triệu dòng, bỏ JPA hẳn, dùng {{JdbcTemplate.batchUpdate}} hoặc {{COPY}}: nhanh hơn một bậc độ lớn.`
},
{
  id: 'qz-jpa-016',
  topic: 'jpa',
  q: `Entity {{Product}} có id kiểu {{Long}} không tự sinh (gán tay), không có {{@Version}}. Đoạn code sau chạy trong một transaction. Dòng {{p.setName("B")}} có được lưu không?
~~~java
Product p = new Product();
p.setId(5L);          // dòng id 5 đã tồn tại trong DB
p.setName("A");
productRepo.save(p);
p.setName("B");
~~~`,
  options: [
    'Có, vì p đã trở thành managed sau khi save',
    'Không: save() thấy id khác null nên gọi merge(), merge trả về một instance managed KHÁC; p vẫn detached nên thay đổi sau đó bị bỏ qua (DB lưu "A")',
    'Không, vì save() ném EntityExistsException do id 5 đã tồn tại',
    'Có, vì Spring Data tự đồng bộ object truyền vào với object được trả về'
  ],
  answer: 1,
  explain: `**Đáp án đúng: không; merge trả về một instance khác, p vẫn detached.**

### Vì sao đúng
{{SimpleJpaRepository.save}} quyết định bằng {{isNew}}: với id kiểu wrapper và không có @Version, entity được coi là mới khi id == null. Ở đây id = 5 nên gọi {{em.merge(p)}}. Merge **load** dòng id 5 (SELECT), chép trạng thái của {{p}} vào instance managed đó, rồi **trả về instance managed**. {{p}} không bao giờ được gắn vào persistence context. Lúc flush, chỉ instance managed (name = "A") được UPDATE.

~~~java
Product saved = productRepo.save(p); // luôn dùng giá trị trả về
saved.setName("B");                  // được lưu
~~~

### Vì sao các phương án còn lại sai
- **p trở thành managed**: chỉ đúng nếu save gọi persist (entity mới). Với merge thì không.
- **EntityExistsException**: đó là hành vi của persist với id trùng; save chọn merge nên không ném.
- **Spring Data tự đồng bộ**: không có cơ chế như vậy.

> Senior tip: entity có id gán tay (UUID, mã nghiệp vụ) khiến mọi save đều tốn thêm một SELECT do merge. Cách xử lý: implement {{Persistable<ID>}} với {{isNew()}} dựa trên một cờ transient, hoặc thêm {{@Version}} (version null nghĩa là mới).`
},
{
  id: 'qz-jpa-017',
  topic: 'jpa',
  q: 'Trên PostgreSQL, repository có {{@Lock(LockModeType.PESSIMISTIC_WRITE) Optional<Account> findById(Long id)}}. Hai transaction cùng gọi method này với id = 7 gần như đồng thời. Điều gì xảy ra?',
  options: [
    'Cả hai đọc được ngay; transaction commit sau sẽ nhận OptimisticLockException',
    'Transaction thứ hai nhận lỗi ngay lập tức vì dòng đang bị khoá',
    'Hibernate sinh SELECT ... FOR UPDATE; transaction thứ hai bị chặn ở câu SELECT cho tới khi transaction thứ nhất commit hoặc rollback (hoặc tới khi hết lock timeout nếu có cấu hình)',
    'Hibernate khoá toàn bộ bảng account bằng LOCK TABLE'
  ],
  answer: 2,
  explain: `**Đáp án đúng: SELECT ... FOR UPDATE, transaction thứ hai chờ tới khi lock được nhả.**

### Vì sao đúng
{{PESSIMISTIC_WRITE}} được Hibernate dịch sang {{SELECT ... FOR UPDATE}} trên PostgreSQL. Lock này giữ ở mức **dòng** tới hết transaction. Transaction thứ hai chạy cùng câu lệnh sẽ **chờ**. Khi T1 commit, T2 nhận được dòng với dữ liệu mới nhất. Đây là cách tuần tự hoá thao tác read-modify-write, ví dụ trừ số dư.

Có thể giới hạn thời gian chờ:
~~~java
@Lock(LockModeType.PESSIMISTIC_WRITE)
@QueryHints(@QueryHint(name = "jakarta.persistence.lock.timeout", value = "3000"))
Optional<Account> findById(Long id);
~~~

### Vì sao các phương án còn lại sai
- **OptimisticLockException**: thuộc về optimistic locking ({{@Version}}), không phải pessimistic.
- **Lỗi ngay lập tức**: chỉ khi dùng NOWAIT (lock timeout = 0); mặc định là chờ.
- **Khoá cả bảng**: FOR UPDATE chỉ khoá các dòng mà câu SELECT trả về.

> Senior tip: pessimistic lock phải đi kèm transaction ngắn. Đừng gọi API bên ngoài khi đang giữ lock. Luôn khoá theo **cùng một thứ tự** (ví dụ id tăng dần khi chuyển tiền giữa hai tài khoản) để tránh deadlock, và đặt lock timeout để lỗi nhanh thay vì treo cả thread pool.`
},
{
  id: 'qz-jpa-018',
  topic: 'jpa',
  multi: true,
  q: 'Màn hình danh sách chỉ cần {{id}} và {{status}} của 10.000 order, trong khi entity {{Order}} có 40 cột. Cách nào chỉ SELECT đúng các cột cần và không đưa entity vào persistence context? (Chọn 2)',
  options: [
    'findAll() rồi stream().map(o -> new OrderRow(o.getId(), o.getStatus()))',
    'Interface projection đóng: interface OrderRow { Long getId(); String getStatus(); } làm kiểu trả về của query method',
    'JPQL constructor expression: select new com.shop.OrderRow(o.id, o.status) from Order o',
    'Thêm @Transactional(readOnly = true) cho findAll()',
    'Đánh dấu 38 cột còn lại là @Basic(fetch = FetchType.LAZY)'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: interface projection đóng và JPQL constructor expression (DTO).**

### Vì sao đúng
- **Interface projection đóng** (closed projection: chỉ có getter ánh xạ thẳng tới thuộc tính): Spring Data sinh query chỉ chọn các cột tương ứng và trả về proxy hoặc tuple, không phải entity managed.
- **Constructor expression**: {{select new ...}} tạo DTO trực tiếp từ kết quả; Hibernate không quản lý DTO, không snapshot, không dirty checking. Với Java record thì càng gọn.

### Vì sao các phương án còn lại sai
- **findAll rồi map**: vẫn SELECT đủ 40 cột và nạp 10.000 entity vào persistence context; map chỉ xảy ra sau đó.
- **readOnly = true**: bớt dirty checking nhưng vẫn SELECT đủ 40 cột và vẫn tạo entity.
- **@Basic(fetch = LAZY)**: với Hibernate, lazy cho cột thường chỉ có hiệu lực khi bật bytecode enhancement; nếu không thì bị bỏ qua. Mà kể cả có hiệu lực, vẫn tạo entity managed.

> Senior tip: quy tắc thực dụng: **đọc để hiển thị thì dùng projection/DTO, ghi thì dùng entity**. Trên bảng rộng có cột TEXT/JSONB lớn, chuyển màn hình danh sách sang projection thường giảm vài lần cả thời gian query lẫn lượng heap.`
},
{
  id: 'qz-jpa-019',
  topic: 'jpa',
  q: 'Entity có {{@Enumerated private OrderStatus status;}} (không chỉ định kiểu). Enum hiện là {{NEW, PAID, SHIPPED}}. Một dev thêm {{CANCELLED}} vào giữa, thành {{NEW, CANCELLED, PAID, SHIPPED}}. Chuyện gì xảy ra với dữ liệu cũ?',
  options: [
    'Không ảnh hưởng gì vì Hibernate lưu tên enum',
    'Hibernate tự migrate dữ liệu khi khởi động với ddl-auto=update',
    'Ứng dụng không khởi động được vì enum không khớp với DB',
    'Dữ liệu cũ bị hiểu sai: mặc định là EnumType.ORDINAL, các dòng lưu 1 (PAID) giờ được đọc thành CANCELLED, lưu 2 (SHIPPED) thành PAID'
  ],
  answer: 3,
  explain: `**Đáp án đúng: dữ liệu cũ bị hiểu sai vì mặc định ORDINAL.**

### Vì sao đúng
Theo đặc tả JPA, {{@Enumerated}} không tham số (hoặc enum không có annotation) dùng {{EnumType.ORDINAL}}: lưu vị trí 0, 1, 2. Chèn hằng mới vào giữa làm dịch vị trí của mọi hằng sau nó. Dữ liệu trong DB không đổi, nhưng ý nghĩa thì đổi: đơn đã thanh toán (1) giờ thành đã huỷ. Không có lỗi nào được báo, đây là kiểu bug âm thầm nguy hiểm nhất.

### Vì sao các phương án còn lại sai
- **Lưu tên enum**: chỉ khi khai báo {{@Enumerated(EnumType.STRING)}}.
- **ddl-auto tự migrate**: ddl-auto chỉ đổi schema, không bao giờ sửa dữ liệu; và không nên dùng {{update}} trên production.
- **Không khởi động được**: Hibernate không kiểm tra nội dung dữ liệu khi khởi động; ORDINAL 1 vẫn hợp lệ.

### Cách an toàn
~~~java
@Enumerated(EnumType.STRING)
@Column(length = 20)
private OrderStatus status;
~~~
Hoặc dùng {{AttributeConverter}} ánh xạ sang mã cố định, để đổi tên hằng enum trong code cũng không ảnh hưởng DB.

> Senior tip: thêm ArchUnit rule hoặc checklist review "cấm @Enumerated không có STRING". Với dữ liệu lớn, STRING tốn thêm vài byte mỗi dòng, cái giá rất nhỏ so với một sự cố sai trạng thái thanh toán.`
},
{
  id: 'qz-jpa-020',
  topic: 'jpa',
  q: 'Flash sale: một sản phẩm "hot" nhận khoảng 3.000 request trừ tồn kho mỗi giây, tất cả cùng vào một dòng {{stock}}. Hiện code làm: load entity có {{@Version}}, giảm {{quantity}}, save, retry khi xung đột. Tỉ lệ lỗi và độ trễ rất cao. Cách xử lý ở tầng DB nào hợp lý nhất?',
  options: [
    'Câu UPDATE nguyên tử có điều kiện: update stock set quantity = quantity - 1 where product_id = ? and quantity >= 1, kiểm tra số dòng bị ảnh hưởng (1 là thành công, 0 là hết hàng)',
    'Tăng số lần retry optimistic lên 50 lần',
    'Dùng isolation SERIALIZABLE cho transaction trừ tồn kho',
    'Load entity bằng PESSIMISTIC_WRITE rồi gọi API thanh toán trong lúc giữ lock'
  ],
  answer: 0,
  explain: `**Đáp án đúng: một câu UPDATE nguyên tử có điều kiện và kiểm tra số dòng bị ảnh hưởng.**

### Vì sao đúng
Câu UPDATE gộp cả đọc, kiểm tra và ghi vào **một** câu lệnh thực hiện bên trong DB. DB khoá dòng chỉ trong thời gian chạy câu đó (cộng phần còn lại của transaction nếu bạn giữ nó ngắn), không có vòng đọc-sửa-ghi qua mạng và không có xung đột version phải retry. Điều kiện {{quantity >= 1}} chặn bán quá số lượng.
~~~java
@Modifying
@Query("update Stock s set s.quantity = s.quantity - 1 where s.productId = :id and s.quantity >= 1")
int decrement(@Param("id") Long id);   // trả 0 nghĩa là hết hàng
~~~

### Vì sao các phương án còn lại sai
- **Tăng retry**: với 3.000 request cùng tranh một version, hầu hết đều thua; retry nhiều hơn chỉ nhân tải lên DB (retry storm).
- **SERIALIZABLE**: trên PostgreSQL sẽ sinh hàng loạt serialization failure phải retry, cùng vấn đề như optimistic.
- **PESSIMISTIC_WRITE + gọi API thanh toán**: giữ lock trong lúc gọi mạng chậm, mọi request khác xếp hàng, thông lượng sụp.

> Senior tip: ở mức 3.000 rps trên một dòng, ngay cả UPDATE nguyên tử cũng chạm giới hạn của row lock. Các hệ thống thật đẩy việc "giữ chỗ" lên Redis ({{DECR}} hoặc Lua script), hoặc chia tồn kho thành nhiều bucket (10 dòng, mỗi dòng 1/10 số lượng), rồi ghi đơn qua hàng đợi. Nhớ chú ý: bulk update qua @Modifying bỏ qua persistence context, nên đừng đọc entity Stock cũ sau đó.`
},
{
  id: 'qz-db-007',
  topic: 'db',
  q: 'Bảng {{users}} (PostgreSQL, 5 triệu dòng) có B-tree index trên cột {{email}}. Query {{SELECT * FROM users WHERE lower(email) = lower(?)}} vẫn chạy Seq Scan. Cách sửa đúng là gì?',
  options: [
    'Chạy ANALYZE để planner nhận ra index',
    'Tạo expression index: CREATE INDEX ON users (lower(email))',
    'Thêm hint USE INDEX vào câu query',
    'Đổi index sang kiểu HASH vì hash index hỗ trợ hàm'
  ],
  answer: 1,
  explain: `**Đáp án đúng: tạo expression index trên lower(email).**

### Vì sao đúng
Index trên {{email}} lưu giá trị gốc đã sắp xếp. Điều kiện {{lower(email) = ...}} so sánh **kết quả của hàm**, mà index không chứa các giá trị đó, nên planner không dùng được, buộc phải đọc từng dòng, tính lower() rồi so. Expression index lưu sẵn {{lower(email)}} nên điều kiện khớp chính xác với nội dung index:
~~~sql
CREATE INDEX CONCURRENTLY idx_users_email_lower ON users (lower(email));
~~~
Query phải viết **đúng biểu thức** đã index thì planner mới dùng.

### Vì sao các phương án còn lại sai
- **ANALYZE**: cập nhật thống kê, nhưng index trên email vốn không thể phục vụ điều kiện trên lower(email), thống kê tốt mấy cũng vậy.
- **Hint USE INDEX**: là cú pháp MySQL; PostgreSQL không có hint chuẩn (chỉ có qua extension pg_hint_plan), và kể cả ép cũng không dùng được index không khớp biểu thức.
- **HASH index**: hash index chỉ phục vụ phép bằng trên đúng giá trị đã index, không tự hiểu hàm; vấn đề vẫn y nguyên.

> Senior tip: cách khác là kiểu {{citext}} hoặc chuẩn hoá email về chữ thường ngay khi ghi (và đặt UNIQUE trên cột đã chuẩn hoá). MySQL 8.0.13+ cũng có functional index với cú pháp hai ngoặc: {{CREATE INDEX idx ON users ((lower(email)))}}. Quy tắc chung: **không bọc cột đã index trong hàm** ở mệnh đề WHERE.`
},
{
  id: 'qz-db-008',
  topic: 'db',
  q: 'MySQL: cột {{phone VARCHAR(20)}} có index. Query {{SELECT * FROM customers WHERE phone = 912345678}} (so với số, không có nháy) chạy full scan và còn trả về cả dòng {{"0912345678"}}. Vì sao?',
  options: [
    'Vì index trên VARCHAR không dùng được cho phép so sánh bằng',
    'Vì MySQL tự thêm số 0 ở đầu khi so sánh',
    'So sánh chuỗi với số khiến MySQL chuyển giá trị cột sang số cho từng dòng (implicit conversion), nên index trên chuỗi không dùng được, và "0912345678" đổi thành 912345678 nên khớp',
    'Vì bảng chưa được ANALYZE nên planner chọn sai'
  ],
  answer: 2,
  explain: `**Đáp án đúng: implicit type conversion biến cột chuỗi thành số cho từng dòng.**

### Vì sao đúng
Khi so sánh chuỗi với số, MySQL quy cả hai về số (floating point). Nghĩa là nó phải tính {{CAST(phone AS number)}} cho **mỗi dòng**, giống như bọc cột trong hàm, nên index (sắp xếp theo thứ tự chuỗi) vô dụng. Nhiều chuỗi khác nhau ra cùng một số: "0912345678", "912345678", " 912345678" đều thành 912345678, nên kết quả còn **sai về nghiệp vụ**.

~~~sql
SELECT * FROM customers WHERE phone = '0912345678'; -- dùng được index
~~~

### Vì sao các phương án còn lại sai
- **VARCHAR không dùng index cho phép bằng**: sai, so sánh chuỗi với chuỗi dùng index bình thường.
- **Tự thêm số 0**: không có cơ chế đó; ngược lại, số 0 ở đầu chuỗi bị mất khi chuyển sang số.
- **Chưa ANALYZE**: thống kê không thể sửa việc index không áp dụng được cho biểu thức đã bị chuyển kiểu.

> Senior tip: bug này thường đến từ ORM/JDBC bind sai kiểu (setLong cho cột VARCHAR), hoặc join hai bảng có cột cùng nghĩa nhưng khác kiểu/collation. Dấu hiệu trong EXPLAIN của MySQL là {{type: ALL}} dù có index, kèm cảnh báo "Cannot use ref access on index due to type or collation conversion" khi chạy SHOW WARNINGS.`
},
{
  id: 'qz-db-009',
  topic: 'db',
  q: 'PostgreSQL: bảng {{sessions}} bị UPDATE liên tục. Một tuần nay kích thước bảng tăng gấp 5 trong khi số dòng không đổi, query chậm dần. {{pg_stat_activity}} cho thấy một connection ở trạng thái {{idle in transaction}} từ 6 ngày trước. Nguyên nhân gốc là gì?',
  options: [
    'Autovacuum bị tắt mặc định trên PostgreSQL',
    'Index bị hỏng nên phải REINDEX',
    'Bảng thiếu primary key nên PostgreSQL không ghi đè được dòng cũ',
    'Transaction mở lâu giữ snapshot cũ, VACUUM không được dọn các dead tuple mà snapshot đó còn có thể thấy, nên bảng phình (bloat)'
  ],
  answer: 3,
  explain: `**Đáp án đúng: transaction mở lâu chặn VACUUM dọn dead tuple, gây bloat.**

### Vì sao đúng
PostgreSQL dùng MVCC: UPDATE không ghi đè mà tạo **phiên bản dòng mới**, bản cũ thành dead tuple. VACUUM chỉ được xoá dead tuple khi **không còn transaction nào** có snapshot cần thấy nó. Một transaction mở từ 6 ngày trước giữ "xmin horizon" ở thời điểm đó, nên mọi phiên bản cũ phát sinh sau đó đều không dọn được. Bảng và index phình ra, query phải đọc nhiều trang hơn.

~~~sql
SELECT pid, state, xact_start, query
FROM pg_stat_activity
WHERE state = 'idle in transaction' ORDER BY xact_start;
~~~

### Vì sao các phương án còn lại sai
- **Autovacuum tắt mặc định**: sai, autovacuum bật mặc định; nó vẫn chạy nhưng không dọn được.
- **Index hỏng**: REINDEX chỉ làm gọn index tạm thời, bảng vẫn phình tiếp chừng nào transaction kia còn mở.
- **Thiếu primary key**: MVCC tạo phiên bản mới với mọi bảng, có PK hay không cũng vậy.

### Cách xử lý
- Kết thúc session đó ({{pg_terminate_backend(pid)}}), sửa code quên commit/rollback.
- Đặt {{idle_in_transaction_session_timeout}} (ví dụ 5 phút) để chặn từ gốc.

> Senior tip: nguồn "transaction treo" hay gặp: code gọi API ngoài giữa transaction, debugger dừng breakpoint trên môi trường chung, replication slot không còn ai đọc, hoặc standby bật hot_standby_feedback. Đặt alert khi tuổi transaction cũ nhất vượt vài phút.`
},
{
  id: 'qz-db-010',
  topic: 'db',
  multi: true,
  q: 'So sánh mức isolation REPEATABLE READ trên PostgreSQL và MySQL InnoDB. Phát biểu nào đúng? (Chọn 2)',
  options: [
    'PostgreSQL REPEATABLE READ: nếu transaction cố UPDATE một dòng mà transaction khác đã sửa và commit sau khi snapshot được lấy, nó nhận lỗi "could not serialize access due to concurrent update" và phải retry',
    'MySQL mặc định dùng READ COMMITTED, giống PostgreSQL',
    'PostgreSQL REPEATABLE READ vẫn để xảy ra phantom read như chuẩn SQL cho phép',
    'InnoDB REPEATABLE READ: SELECT thường đọc snapshot, nhưng UPDATE/DELETE và SELECT ... FOR UPDATE đọc bản commit mới nhất (current read)',
    'PostgreSQL SERIALIZABLE được hiện thực bằng cách khoá cả bảng'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: PostgreSQL RR báo serialization failure khi cập nhật dòng đã bị sửa; InnoDB RR đọc snapshot cho SELECT nhưng current read cho UPDATE/locking read.**

### Vì sao đúng
- **PostgreSQL RR** là snapshot isolation thật sự: mọi câu lệnh thấy cùng một snapshot. Nếu dòng bạn sắp UPDATE đã bị transaction khác sửa và commit sau snapshot của bạn, PostgreSQL không cho ghi đè mà báo lỗi SQLSTATE 40001. Nhờ vậy lost update bị chặn, đổi lại ứng dụng phải retry.
- **InnoDB RR**: SELECT thường dùng consistent read (snapshot từ lần đọc đầu). Nhưng UPDATE/DELETE/SELECT ... FOR UPDATE là **current read**, đọc bản mới nhất và đặt lock. Vì vậy InnoDB không báo lỗi, và mẫu "SELECT rồi tính rồi UPDATE giá trị tuyệt đối" vẫn có thể mất cập nhật.

### Vì sao các phương án còn lại sai
- **MySQL mặc định READ COMMITTED**: sai, mặc định của InnoDB là REPEATABLE READ; PostgreSQL mặc định READ COMMITTED.
- **PostgreSQL RR có phantom**: chuẩn SQL cho phép, nhưng hiện thực của PostgreSQL ở mức RR không để phantom xảy ra (snapshot cố định).
- **SERIALIZABLE khoá cả bảng**: PostgreSQL dùng SSI (Serializable Snapshot Isolation), theo dõi phụ thuộc đọc-ghi bằng predicate lock nhẹ, không khoá bảng; xung đột được báo bằng lỗi 40001.

> Senior tip: cùng một đoạn code chạy trên hai DB có thể cho kết quả khác nhau về đồng thời. Khi dùng RR hoặc SERIALIZABLE trên PostgreSQL, bắt buộc có cơ chế retry cho SQLSTATE 40001 (Spring Retry quanh method {{@Transactional}}, không phải bên trong nó).`
},
{
  id: 'qz-db-011',
  topic: 'db',
  q: 'Query chạy rất thường xuyên: {{SELECT status FROM orders WHERE customer_id = ?}}. Bảng có 40 cột. Index nào cho phép PostgreSQL trả kết quả bằng Index Only Scan (không cần đọc dòng trong bảng, khi visibility map đã cập nhật)?',
  options: [
    'CREATE INDEX ON orders (customer_id) INCLUDE (status)',
    'CREATE INDEX ON orders (status)',
    'Hai index riêng: (customer_id) và (status)',
    'CREATE INDEX ON orders (customer_id) WHERE status IS NOT NULL'
  ],
  answer: 0,
  explain: `**Đáp án đúng: index (customer_id) INCLUDE (status), một covering index.**

### Vì sao đúng
Index Only Scan chỉ khả thi khi **mọi cột** query cần (cả WHERE lẫn SELECT) đều nằm trong index. {{customer_id}} là key để tìm, {{status}} nằm trong phần INCLUDE (lưu ở lá, không tham gia sắp xếp). PostgreSQL đọc index là đủ, chỉ phải ghé bảng với các trang chưa được đánh dấu all-visible trong visibility map (vì thế cần VACUUM đều đặn). Index {{(customer_id, status)}} cũng làm được việc này.

### Vì sao các phương án còn lại sai
- **Index trên status**: không hỗ trợ tìm theo customer_id.
- **Hai index riêng**: planner có thể kết hợp bằng BitmapAnd, nhưng vẫn phải đọc bảng; và index status độ chọn lọc thấp, gần như vô dụng.
- **Partial index trên customer_id**: tìm nhanh nhưng index không chứa giá trị status, nên vẫn phải đọc bảng (Index Scan, không phải Index Only Scan).

> Senior tip: kiểm chứng bằng {{EXPLAIN (ANALYZE, BUFFERS)}}: dòng "Heap Fetches" cho biết số lần vẫn phải đọc bảng. Heap Fetches cao nghĩa là visibility map lạc hậu, cần chỉnh autovacuum cho bảng đó. Đừng INCLUDE quá nhiều cột: index to ra, mỗi INSERT/UPDATE tốn thêm I/O.`
},
{
  id: 'qz-db-012',
  topic: 'db',
  q: 'Bảng {{jobs}} làm hàng đợi công việc trong PostgreSQL, 10 worker cùng lấy việc. Hiện mỗi worker chạy {{SELECT ... WHERE status = \'NEW\' ORDER BY id LIMIT 1 FOR UPDATE}} và các worker xếp hàng chờ nhau. Sửa thế nào để các worker lấy song song các job khác nhau?',
  options: [
    'Bỏ FOR UPDATE để không còn lock',
    'Thêm SKIP LOCKED: SELECT ... FOR UPDATE SKIP LOCKED, dòng đang bị worker khác khoá sẽ được bỏ qua',
    'Dùng FOR UPDATE NOWAIT để worker nhận lỗi và thử lại ngay',
    'Đổi isolation sang SERIALIZABLE'
  ],
  answer: 1,
  explain: `**Đáp án đúng: FOR UPDATE SKIP LOCKED.**

### Vì sao đúng
Không có SKIP LOCKED, cả 10 worker cùng nhắm vào job có id nhỏ nhất: worker đầu khoá được, 9 worker còn lại **chờ** chính dòng đó, nên hệ thống chỉ xử lý tuần tự. Với SKIP LOCKED, worker thứ hai bỏ qua dòng đang bị khoá và lấy dòng kế tiếp, nên 10 worker lấy 10 job khác nhau ngay lập tức.
~~~sql
UPDATE jobs SET status = 'RUNNING', worker = :w
WHERE id = (
  SELECT id FROM jobs WHERE status = 'NEW'
  ORDER BY id LIMIT 1
  FOR UPDATE SKIP LOCKED
)
RETURNING id, payload;
~~~

### Vì sao các phương án còn lại sai
- **Bỏ FOR UPDATE**: hai worker có thể đọc cùng một job và cùng xử lý, gây trùng lặp (ví dụ gửi email hai lần).
- **NOWAIT**: worker nhận lỗi thay vì chờ, nhưng vẫn tranh nhau đúng dòng đầu; vòng lỗi rồi thử lại tốn tài nguyên mà không tăng thông lượng.
- **SERIALIZABLE**: tạo thêm serialization failure, không giải quyết việc mọi worker cùng nhắm một dòng.

> Senior tip: SKIP LOCKED (có trên PostgreSQL 9.5+ và MySQL 8.0+) đủ cho hàng đợi vài trăm job/giây. Cần có index phù hợp (partial index {{WHERE status = 'NEW'}}), dọn job xong định kỳ để tránh bloat, và có cơ chế thu hồi job RUNNING quá lâu (worker chết giữa chừng).`
},
{
  id: 'qz-db-013',
  topic: 'db',
  q: 'MySQL InnoDB, isolation mặc định. Transaction T1 chạy {{SELECT * FROM orders WHERE id BETWEEN 10 AND 20 FOR UPDATE}} (id là primary key, hiện chỉ có id 10, 12, 20) và chưa commit. T2 chạy {{INSERT INTO orders (id, ...) VALUES (15, ...)}}. Chuyện gì xảy ra với T2?',
  options: [
    'T2 insert thành công ngay vì dòng 15 chưa tồn tại nên không bị khoá',
    'T2 nhận lỗi duplicate key',
    'T2 bị chặn chờ, vì T1 giữ next-key lock (record lock + gap lock) trên khoảng 10..20, ngăn chèn vào khoảng đó cho tới khi T1 kết thúc',
    'T2 thành công nhưng T1 sẽ nhận lỗi khi commit'
  ],
  answer: 2,
  explain: `**Đáp án đúng: T2 bị chặn vì next-key lock / gap lock của T1.**

### Vì sao đúng
Ở REPEATABLE READ, locking read theo khoảng trên InnoDB không chỉ khoá các dòng đang có (10, 12, 20) mà còn khoá **khoảng trống** giữa chúng (gap lock). Tổ hợp record lock + gap lock trước nó gọi là next-key lock. Mục đích: chặn phantom, để nếu T1 chạy lại câu SELECT đó thì vẫn thấy đúng tập dòng cũ. INSERT id 15 rơi vào gap (12, 20) nên phải chờ insert intention lock tới khi T1 commit/rollback (hoặc tới {{innodb_lock_wait_timeout}}, mặc định 50 giây).

### Vì sao các phương án còn lại sai
- **Insert thành công vì dòng chưa tồn tại**: đúng là không có record lock trên 15, nhưng gap lock chính là để chặn trường hợp này.
- **Duplicate key**: id 15 chưa tồn tại nên không trùng.
- **T1 lỗi khi commit**: InnoDB dùng lock để chặn trước, không phát hiện xung đột lúc commit như optimistic.

> Senior tip: gap lock là nguồn deadlock "bí ẩn" phổ biến trên MySQL, nhất là với mẫu "SELECT ... FOR UPDATE kiểm tra không tồn tại rồi INSERT" chạy song song: hai transaction cùng giữ gap lock rồi cùng chờ nhau khi insert. Đọc mục LATEST DETECTED DEADLOCK trong {{SHOW ENGINE INNODB STATUS}}. Chuyển sang READ COMMITTED sẽ tắt phần lớn gap lock (trừ kiểm tra foreign key và duplicate key).`
},
{
  id: 'qz-db-014',
  topic: 'db',
  multi: true,
  q: 'Bạn cần migration trên bảng {{orders}} 200 triệu dòng (PostgreSQL 15) mà không downtime, app phiên bản cũ và mới chạy song song khi rolling deploy. Thao tác nào an toàn? (Chọn 2)',
  options: [
    'CREATE INDEX CONCURRENTLY idx_orders_created ON orders (created_at), chạy ngoài transaction block',
    'ALTER TABLE orders ALTER COLUMN amount TYPE bigint, vì đổi kiểu int sang bigint là thao tác tức thời',
    'ALTER TABLE orders ADD COLUMN source text DEFAULT \'web\', vì từ PostgreSQL 11 default hằng số chỉ ghi vào metadata, không rewrite bảng',
    'ALTER TABLE orders RENAME COLUMN note TO remark, vì rename chỉ đổi metadata nên app cũ không bị ảnh hưởng',
    'Thêm FOREIGN KEY trực tiếp, vì kiểm tra khoá ngoại không khoá bảng'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: CREATE INDEX CONCURRENTLY; ADD COLUMN với default hằng số.**

### Vì sao đúng
- **CREATE INDEX CONCURRENTLY**: build index qua nhiều lượt quét mà không giữ lock chặn ghi, nên INSERT/UPDATE vẫn chạy. Đổi lại: chậm hơn, không chạy được trong transaction block (cần tắt transaction của tool migration cho bước này), và nếu fail sẽ để lại index INVALID phải drop rồi tạo lại.
- **ADD COLUMN ... DEFAULT hằng số**: từ PostgreSQL 11, default không đổi được lưu trong catalog, các dòng cũ "ảo" mang giá trị đó, nên không rewrite 200 triệu dòng. Vẫn cần lock ACCESS EXCLUSIVE trong chốc lát, nên đặt {{lock_timeout}} ngắn để tránh xếp hàng sau một query dài.

### Vì sao các phương án còn lại sai
- **Đổi int sang bigint**: phải rewrite toàn bảng dưới ACCESS EXCLUSIVE lock, có thể khoá hàng giờ. Cách an toàn: thêm cột mới, backfill theo lô, dùng trigger đồng bộ, rồi swap.
- **RENAME COLUMN**: nhanh về DB nhưng app phiên bản cũ vẫn đang query cột {{note}} sẽ lỗi ngay. Phải dùng expand/contract: thêm cột mới, ghi cả hai, chuyển đọc, rồi mới xoá cột cũ.
- **FOREIGN KEY trực tiếp**: phải quét toàn bảng để kiểm tra trong lúc giữ lock chặn ghi. Cách an toàn: {{ADD CONSTRAINT ... NOT VALID}} rồi {{VALIDATE CONSTRAINT}} ở bước sau (validate chỉ cần lock nhẹ hơn).

> Senior tip: luôn đặt {{SET lock_timeout = '3s'}} cho migration trên bảng nóng. ALTER chờ lock sẽ chặn mọi query đến sau nó, nên một migration "chỉ mất 1 ms" vẫn có thể làm sập hệ thống nếu đứng sau một query báo cáo chạy 10 phút.`
},
{
  id: 'qz-db-015',
  topic: 'db',
  q: 'Bảng {{customers}} có 10 dòng: 3 dòng có {{email}} NULL, 7 dòng còn lại có email trong đó 2 dòng trùng nhau. Kết quả của {{SELECT COUNT(*), COUNT(email), COUNT(DISTINCT email) FROM customers}} là gì?',
  options: [
    '10, 10, 9',
    '7, 7, 6',
    '10, 7, 7',
    '10, 7, 6'
  ],
  answer: 3,
  explain: `**Đáp án đúng: 10, 7, 6.**

### Vì sao đúng
- {{COUNT(*)}} đếm **số dòng**, không quan tâm giá trị cột: 10.
- {{COUNT(email)}} đếm các giá trị **khác NULL**: 10 - 3 = 7.
- {{COUNT(DISTINCT email)}} đếm giá trị khác NULL và khác nhau: 7 giá trị, trong đó 2 cái trùng nhau gộp thành 1, còn 6.

### Vì sao các phương án còn lại sai
- **10, 10, 9**: coi NULL như một giá trị được đếm, sai với mọi hàm aggregate trừ COUNT(*).
- **7, 7, 6**: COUNT(*) không bỏ qua dòng chứa NULL.
- **10, 7, 7**: quên rằng DISTINCT gộp hai email trùng.

### Liên quan
Mọi aggregate ({{SUM}}, {{AVG}}, {{MIN}}, {{MAX}}) đều bỏ qua NULL. {{AVG(score)}} trên cột có NULL là trung bình của các giá trị có, không phải chia cho tổng số dòng. Muốn coi NULL là 0 thì {{AVG(COALESCE(score, 0))}}.

> Senior tip: trong PostgreSQL, {{COUNT(*)}} trên bảng lớn vẫn phải quét (do MVCC, không có bộ đếm sẵn). Với dashboard chỉ cần số ước lượng, dùng {{reltuples}} trong {{pg_class}}; với phân trang, cân nhắc bỏ hẳn "tổng số trang".`
},
{
  id: 'qz-db-016',
  topic: 'db',
  q: 'Muốn tìm khách hàng chưa từng đặt hàng: {{SELECT * FROM customers WHERE id NOT IN (SELECT customer_id FROM orders)}}. Bảng orders có vài dòng {{customer_id}} NULL (đơn của khách vãng lai). Query trả về gì?',
  options: [
    'Không trả về dòng nào, vì NOT IN gặp NULL trong danh sách thì mọi phép so sánh cho ra UNKNOWN',
    'Đúng danh sách khách chưa đặt hàng, NULL bị bỏ qua',
    'Báo lỗi vì subquery trả về NULL',
    'Trả về toàn bộ customers'
  ],
  answer: 0,
  explain: `**Đáp án đúng: không trả về dòng nào.**

### Vì sao đúng
{{x NOT IN (a, b, NULL)}} tương đương {{x <> a AND x <> b AND x <> NULL}}. Theo logic ba giá trị của SQL, {{x <> NULL}} luôn là UNKNOWN. TRUE AND UNKNOWN cho ra UNKNOWN, mà WHERE chỉ giữ dòng có kết quả TRUE, nên **mọi dòng đều bị loại**. Không lỗi, không cảnh báo: query chỉ "âm thầm" trả về rỗng.

### Vì sao các phương án còn lại sai
- **NULL bị bỏ qua**: đó là hành vi mà người viết mong đợi, nhưng NOT IN không làm vậy (IN thì không bị ảnh hưởng theo cách này).
- **Báo lỗi**: subquery trả NULL là hợp lệ.
- **Trả về toàn bộ**: điều kiện không bao giờ là TRUE, nên ngược lại hoàn toàn.

### Cách viết đúng
~~~sql
SELECT c.* FROM customers c
WHERE NOT EXISTS (SELECT 1 FROM orders o WHERE o.customer_id = c.id);
~~~
NOT EXISTS không bị NULL ảnh hưởng, và PostgreSQL/MySQL thường tối ưu nó thành anti-join hiệu quả.

> Senior tip: thêm vào checklist review SQL: "NOT IN với subquery là red flag". Bug này thường chỉ xuất hiện khi dữ liệu thật có NULL lần đầu tiên, tức là sau khi đã lên production lâu, nên test với dữ liệu sạch không bắt được.`
},
{
  id: 'qz-db-017',
  topic: 'db',
  q: 'PostgreSQL chạy trên máy 8 vCPU. Service có 20 pod, mỗi pod HikariCP {{maximumPoolSize = 50}}. Khi tải cao, DB CPU 100%, latency tăng vọt, đôi khi lỗi "too many clients already". Hướng xử lý nào đúng nhất?',
  options: [
    'Tăng max_connections của PostgreSQL lên 2000 và pool mỗi pod lên 100',
    'Giảm pool mỗi pod (ví dụ 5–10) để tổng connection thực sự chạy song song gần với khả năng của DB, cân nhắc thêm PgBouncer ở chế độ transaction pooling',
    'Tắt connection pool để mỗi request tự mở connection riêng',
    'Bật autoscaling để tăng số pod khi tải cao'
  ],
  answer: 1,
  explain: `**Đáp án đúng: giảm kích thước pool mỗi pod, cân nhắc PgBouncer.**

### Vì sao đúng
20 x 50 = 1.000 connection tới một DB 8 vCPU. Mỗi connection PostgreSQL là một **process** riêng, tốn RAM và context switch. Chỉ khoảng vài chục query thật sự chạy song song hiệu quả được trên 8 core; phần còn lại tranh CPU, tranh lock, làm **mọi** query chậm đi. Công thức tham khảo của HikariCP: {{connections = core_count * 2 + effective_spindle_count}}, tức khoảng 20 cho toàn DB. Giảm pool khiến request chờ ở pool phía app (rẻ) thay vì chen nhau trong DB (đắt), throughput thường **tăng** và latency giảm.

### Vì sao các phương án còn lại sai
- **Tăng max_connections và pool**: đổ thêm dầu vào lửa, thêm process cạnh tranh CPU, có thể hết RAM.
- **Tắt pool**: mỗi connection PostgreSQL mất vài ms để thiết lập (fork process, TLS, auth), còn không có giới hạn nào nên DB bị quá tải nhanh hơn.
- **Autoscale thêm pod**: mỗi pod mới thêm 50 connection, càng làm DB tệ hơn. Nút cổ chai là DB chứ không phải app.

> Senior tip: khi dùng PgBouncer transaction mode, lưu ý server-side prepared statement (cần PgBouncer 1.21+ hoặc tắt prepared statement ở driver), session-level SET và advisory lock không còn đúng ngữ nghĩa. Theo dõi metric {{hikaricp_connections_pending}}: pending cao trong khi DB rảnh mới là lúc tăng pool.`
},
{
  id: 'qz-db-018',
  topic: 'db',
  q: 'Bạn chuyển bảng {{events}} (PostgreSQL) sang declarative partitioning theo RANGE trên {{created_at}} (mỗi tháng một partition). Phát biểu nào đúng?',
  options: [
    'Mọi query đều nhanh hơn vì dữ liệu đã được chia nhỏ',
    'Có thể giữ PRIMARY KEY (id) như cũ trên bảng cha mà không cần đổi gì',
    'Primary key hoặc unique constraint trên bảng partitioned phải chứa cột partition key, ví dụ PRIMARY KEY (id, created_at); và query không lọc theo created_at sẽ phải quét mọi partition',
    'Partitioning tự động phân tán dữ liệu ra nhiều server'
  ],
  answer: 2,
  explain: `**Đáp án đúng: PK/unique phải chứa partition key; query không lọc partition key sẽ quét mọi partition.**

### Vì sao đúng
PostgreSQL không có index toàn cục cho bảng partitioned, mỗi partition có index riêng. Để đảm bảo uniqueness chỉ bằng index cục bộ, constraint phải chứa partition key (khi đó hai dòng trùng key chắc chắn rơi cùng partition). Nên {{PRIMARY KEY (id)}} sẽ bị từ chối, phải là {{(id, created_at)}}.

Partition pruning chỉ hoạt động khi WHERE có điều kiện trên {{created_at}}. Query {{WHERE user_id = ?}} không có created_at phải quét index của **từng** partition (36 partition là 36 lần index scan).

### Vì sao các phương án còn lại sai
- **Mọi query đều nhanh hơn**: chỉ query có pruning mới hưởng lợi; query không lọc partition key có thể chậm hơn bảng thường.
- **Giữ PK (id)**: bị PostgreSQL từ chối như giải thích trên.
- **Phân tán ra nhiều server**: partitioning nằm trong một instance; phân tán là sharding (Citus, tầng ứng dụng).

> Senior tip: lợi ích lớn nhất của partition theo thời gian thường là **vòng đời dữ liệu**: xoá dữ liệu cũ bằng {{DETACH PARTITION}} rồi {{DROP TABLE}} trong vài ms, thay cho DELETE hàng trăm triệu dòng sinh bloat. Dùng pg_partman hoặc job tạo trước partition cho các tháng tới, nếu không INSERT sẽ lỗi khi không có partition phù hợp (hoặc rơi hết vào DEFAULT partition).`
},
{
  id: 'qz-db-019',
  topic: 'db',
  q: 'Bảng {{documents}} 20 triệu dòng, cột {{is_deleted boolean}}, 99,5% dòng là false. Query hay chạy: {{SELECT ... WHERE is_deleted = true AND deleted_at < now() - interval \'30 days\'}} (job dọn rác). Index nào hợp lý nhất?',
  options: [
    'B-tree trên is_deleted, vì cột nằm trong WHERE thì nên có index',
    'Không cần index vì cột boolean không thể đánh index',
    'Hash index trên is_deleted',
    'Partial index: CREATE INDEX ON documents (deleted_at) WHERE is_deleted = true'
  ],
  answer: 3,
  explain: `**Đáp án đúng: partial index chỉ chứa các dòng is_deleted = true.**

### Vì sao đúng
Partial index chỉ lưu các dòng thoả điều kiện WHERE của nó: khoảng 100.000 dòng thay vì 20 triệu. Index nhỏ, nằm gọn trong RAM, và việc ghi các dòng is_deleted = false (99,5% thao tác) không tốn công cập nhật index. Query có điều kiện {{is_deleted = true}} khớp với điều kiện của index nên planner dùng được, rồi lọc tiếp theo {{deleted_at}}.

### Vì sao các phương án còn lại sai
- **B-tree trên is_deleted**: index 20 triệu entry chỉ có 2 giá trị. Planner có thể dùng nó cho giá trị hiếm (true), nhưng index rất to so với lợi ích, mọi INSERT/UPDATE đều phải cập nhật nó, và không hỗ trợ điều kiện deleted_at.
- **Boolean không thể index**: sai, PostgreSQL cho phép index trên bất kỳ cột nào có operator class phù hợp, boolean có.
- **Hash index**: cũng chứa đủ 20 triệu entry và không hỗ trợ so sánh khoảng trên deleted_at.

> Senior tip: partial index rất hợp với mẫu "trạng thái hiếm": {{WHERE status = 'PENDING'}}, {{WHERE processed_at IS NULL}}. Lưu ý query phải viết điều kiện khớp được với predicate của index (planner phải chứng minh được), và tham số bind kiểu {{is_deleted = ?}} có thể khiến generic plan không dùng được partial index.`
},
{
  id: 'qz-db-020',
  topic: 'db',
  q: 'Bảng {{posts}} có index B-tree tăng dần trên {{created_at}}. Query {{SELECT * FROM posts ORDER BY created_at DESC LIMIT 20}} có dùng index để tránh sort không?',
  options: [
    'Có: B-tree có thể quét ngược (Index Scan Backward), lấy 20 dòng mới nhất mà không cần sort',
    'Không, phải tạo thêm index created_at DESC',
    'Không, ORDER BY ... DESC luôn buộc DB sort toàn bảng',
    'Chỉ dùng được nếu bảng có ít hơn 1 triệu dòng'
  ],
  answer: 0,
  explain: `**Đáp án đúng: có, B-tree quét ngược được.**

### Vì sao đúng
Các trang lá của B-tree liên kết hai chiều, nên DB có thể đi từ cuối index về đầu. Với một cột, index ASC phục vụ cả ORDER BY ASC lẫn DESC. EXPLAIN của PostgreSQL hiện {{Index Scan Backward using idx_posts_created_at}}, đọc đúng 20 entry rồi dừng (nhờ LIMIT), không có node Sort. InnoDB (MySQL 8) cũng đọc ngược được index.

### Vì sao các phương án còn lại sai
- **Phải tạo index DESC**: chỉ cần khi ORDER BY **nhiều cột với hướng trộn lẫn**, ví dụ {{ORDER BY category ASC, created_at DESC}}; index (category, created_at) quét ngược sẽ cho category DESC nên không khớp, lúc đó mới cần index {{(category, created_at DESC)}}.
- **DESC luôn sort**: sai như đã giải thích.
- **Giới hạn 1 triệu dòng**: không có giới hạn như vậy; ngược lại, bảng càng lớn thì lợi ích của việc tránh sort càng rõ.

> Senior tip: khi query có thêm điều kiện lọc, ví dụ {{WHERE author_id = ? ORDER BY created_at DESC LIMIT 20}}, index đúng là {{(author_id, created_at)}}: cột so sánh bằng đứng trước, cột sắp xếp đứng sau. Thiếu cột author_id, planner có thể quét ngược cả index created_at và lọc dần, rất chậm với tác giả ít bài.`
},
{
  id: 'qz-api-009',
  topic: 'api',
  q: '{{POST /users}} nhận body JSON đúng cú pháp, đúng Content-Type, nhưng trường {{email}} không hợp lệ và {{age}} âm. Theo RFC 9110, mã trạng thái nào diễn tả chính xác nhất tình huống này?',
  options: [
    '415 Unsupported Media Type',
    '422 Unprocessable Content',
    '409 Conflict',
    '500 Internal Server Error'
  ],
  answer: 1,
  explain: `**Đáp án đúng: 422 Unprocessable Content.**

### Vì sao đúng
RFC 9110 (mục 15.5.21) định nghĩa 422: server hiểu kiểu nội dung, cú pháp đúng, nhưng **không xử lý được các chỉ thị chứa trong đó**, đúng với lỗi validation nội dung. (Mã này có từ WebDAV với tên "Unprocessable Entity", RFC 9110 đưa vào chuẩn chung và đổi tên.)

Trong thực tế, 400 Bad Request cũng được dùng rộng rãi cho lỗi validation; Spring mặc định trả 400 khi {{@Valid}} fail ({{MethodArgumentNotValidException}}). Điều quan trọng là thống nhất trong toàn API và kèm danh sách lỗi theo từng field.

### Vì sao các phương án còn lại sai
- **415**: dành cho Content-Type mà server không hỗ trợ; ở đây Content-Type đúng.
- **409**: dành cho xung đột với **trạng thái hiện tại** của resource (ví dụ email đã tồn tại, version cũ), không phải dữ liệu đầu vào sai định dạng.
- **500**: lỗi phía client không bao giờ nên trả 5xx; nó làm sai lệch alert và khiến client retry vô ích.

> Senior tip: trả lỗi theo RFC 9457 (Problem Details) với extension {{errors}} (mảng gồm field và message) để frontend gắn lỗi đúng ô nhập. Và phân biệt rõ 4xx/5xx vì SLO, alert, retry policy của client và gateway đều dựa vào đó.`
},
{
  id: 'qz-api-010',
  topic: 'api',
  multi: true,
  q: 'Theo RFC 9110, những method nào là **idempotent**? (Chọn 2)',
  options: [
    'POST',
    'PUT',
    'PATCH',
    'DELETE'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: PUT và DELETE.**

### Vì sao đúng
Idempotent nghĩa là gửi một request **nhiều lần** có cùng **hiệu ứng dự định lên server** như gửi một lần (response có thể khác). RFC 9110 xác định các method idempotent: GET, HEAD, OPTIONS, TRACE (vì chúng safe) và **PUT, DELETE**.
- PUT thay toàn bộ trạng thái resource bằng nội dung gửi lên: gửi 3 lần, kết quả vẫn là trạng thái đó.
- DELETE: lần đầu xoá, các lần sau resource vẫn ở trạng thái "đã xoá" (status code có thể khác, ví dụ 404, nhưng hiệu ứng không đổi).

### Vì sao các phương án còn lại sai
- **POST**: không idempotent; mỗi lần có thể tạo một resource mới (đơn hàng trùng). Muốn retry an toàn phải thêm Idempotency-Key.
- **PATCH**: không được đảm bảo idempotent (RFC 5789). Patch kiểu "tăng counter thêm 1" hay JSON Patch thao tác "add" vào mảng sẽ cho kết quả khác mỗi lần. Một số patch cụ thể có thể idempotent, nhưng method không cam kết điều đó.

> Senior tip: tính idempotent quyết định **ai được phép retry tự động**. HTTP client, service mesh, load balancer thường chỉ tự retry method idempotent. Nếu PUT của bạn có side effect không idempotent (gửi email mỗi lần gọi), bạn đang phá hợp đồng mà hạ tầng dựa vào.`
},
{
  id: 'qz-api-011',
  topic: 'api',
  q: 'API public có giới hạn 100 request/phút cho mỗi API key. Một client vượt giới hạn. Response nào đúng chuẩn và hữu ích nhất cho client?',
  options: [
    '403 Forbidden với message "quota exceeded"',
    '503 Service Unavailable để client biết server đang quá tải',
    '429 Too Many Requests kèm header Retry-After cho biết sau bao lâu thử lại',
    '400 Bad Request vì client gửi quá nhiều'
  ],
  answer: 2,
  explain: `**Đáp án đúng: 429 Too Many Requests kèm Retry-After.**

### Vì sao đúng
429 (RFC 6585) được định nghĩa đúng cho trường hợp "client gửi quá nhiều request trong một khoảng thời gian". Header {{Retry-After}} (RFC 9110, dạng số giây hoặc HTTP-date) cho client biết khi nào thử lại, giúp client backoff hợp lý thay vì dội liên tục.
~~~text
HTTP/1.1 429 Too Many Requests
Retry-After: 30
RateLimit-Policy / RateLimit: (draft IETF, nhiều API dùng X-RateLimit-Remaining)
~~~

### Vì sao các phương án còn lại sai
- **403**: nghĩa là không có quyền, retry vô ích. Client không biết chỉ cần chờ là được.
- **503**: báo lỗi **phía server**, sẽ kích hoạt alert, và đổ lỗi sai chỗ: server vẫn khoẻ, chỉ client này vượt hạn mức. (503 + Retry-After hợp lý khi chính server quá tải hoặc bảo trì.)
- **400**: request hoàn toàn hợp lệ về cú pháp và nội dung.

> Senior tip: trả về số request còn lại ngay cả khi chưa bị chặn, để client tự điều tiết. Ở phía client, kết hợp Retry-After với exponential backoff + jitter; nếu không, hàng nghìn client cùng retry đúng giây thứ 30 sẽ tạo đợt spike mới.`
},
{
  id: 'qz-api-012',
  topic: 'api',
  q: 'Feed {{GET /notifications?page=3&size=20}} sắp xếp mới nhất trước. Trong lúc người dùng cuộn, có thông báo mới liên tục chèn vào đầu danh sách. Người dùng thấy thông báo bị lặp lại giữa các trang. Thiết kế nào giải quyết tận gốc?',
  options: [
    'Tăng size lên 100 để giảm số lần gọi',
    'Cache toàn bộ danh sách ở client ngay lần đầu',
    'Dùng page bắt đầu từ 0 thay vì 1',
    'Cursor (keyset) pagination: response trả nextCursor mã hoá vị trí phần tử cuối (created_at, id); trang sau lấy các phần tử "cũ hơn" cursor đó'
  ],
  answer: 3,
  explain: `**Đáp án đúng: cursor (keyset) pagination.**

### Vì sao đúng
Offset pagination định nghĩa trang theo **vị trí**: trang 3 là phần tử thứ 41–60. Khi có 5 thông báo mới chèn lên đầu, mọi phần tử bị đẩy xuống 5 vị trí, nên 5 phần tử cuối trang 2 xuất hiện lại ở đầu trang 3 (ngược lại, khi có phần tử bị xoá thì bị **bỏ sót**). Cursor định nghĩa trang theo **giá trị**: "các phần tử cũ hơn (created_at, id) của phần tử cuối đã thấy", không bị ảnh hưởng bởi dữ liệu chèn thêm phía trước.
~~~text
GET /notifications?limit=20
-> { items: [...], nextCursor: "eyJ0IjoiMjAyNi0xMC0yOVQwODo..." }
GET /notifications?limit=20&cursor=eyJ0IjoiMjAyNi0xMC0yOVQwODo...
~~~
Thêm id vào cursor để phân định thứ tự khi nhiều phần tử trùng created_at.

### Vì sao các phương án còn lại sai
- **Tăng size**: chỉ giảm tần suất, không bỏ được việc dịch vị trí.
- **Cache toàn bộ ở client**: không khả thi với feed dài và bỏ lỡ dữ liệu mới.
- **Page bắt đầu từ 0**: chỉ đổi cách đánh số, vấn đề vẫn nguyên.

> Senior tip: cursor nên **opaque** (base64 của JSON, có thể ký HMAC) để sau này đổi cách sắp xếp mà không phá client. Đánh đổi: không nhảy tới "trang 57" được, nhưng với feed/infinite scroll thì không ai cần điều đó. Ở DB, cursor tương ứng với điều kiện {{(created_at, id) < (?, ?)}} trên index composite.`
},
{
  id: 'qz-api-013',
  topic: 'api',
  multi: true,
  q: 'API {{/v1/orders}} đang có nhiều mobile app phiên bản cũ sử dụng. Thay đổi nào là **breaking change** cần phiên bản mới hoặc giai đoạn chuyển tiếp? (Chọn 2)',
  options: [
    'Đổi tên trường response totalPrice thành total',
    'Thêm trường mới discount (có thể null) vào response',
    'Biến query param optional "currency" thành bắt buộc',
    'Thêm endpoint mới GET /v1/orders/{id}/invoice',
    'Thêm query param optional "status" để lọc'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: đổi tên trường response; biến param optional thành bắt buộc.**

### Vì sao đúng
Breaking change là thay đổi khiến **client cũ đang đúng** trở nên sai:
- **Đổi tên trường response**: app cũ vẫn đọc {{totalPrice}}, giờ không thấy nữa, hiển thị trống hoặc crash.
- **Optional thành bắt buộc**: app cũ không gửi {{currency}}, giờ nhận 400.

Quy tắc dễ nhớ (Postel): **request chỉ được nới lỏng, response chỉ được thêm**.

### Vì sao các phương án còn lại sai
- **Thêm trường response**: client tuân thủ "tolerant reader" bỏ qua trường lạ. (Cần chắc client không deserialize nghiêm ngặt, ví dụ Jackson {{FAIL_ON_UNKNOWN_PROPERTIES}}; Spring Boot đã tắt cờ này mặc định.)
- **Thêm endpoint mới**: không ảnh hưởng gì tới các endpoint cũ.
- **Thêm param optional**: client cũ không gửi thì hành vi giữ như trước.

### Cách đổi tên an toàn (expand/contract)
1. Trả **cả hai** trường totalPrice và total.
2. Đánh dấu totalPrice deprecated (tài liệu, header {{Deprecation}}/{{Sunset}}).
3. Theo dõi số lượng client còn dùng, rồi mới xoá ở v2.

> Senior tip: với mobile app, phiên bản cũ có thể sống thêm vài năm. Hãy chạy **contract test** (Spring Cloud Contract, Pact) trong CI để phát hiện breaking change trước khi merge, thay vì đợi crash report.`
},
{
  id: 'qz-api-014',
  topic: 'api',
  q: '{{POST /orders}} tạo đơn hàng thành công, server sinh id {{981}}. Response nào đúng ngữ nghĩa HTTP nhất?',
  options: [
    '201 Created, header Location: /orders/981, body là representation của đơn vừa tạo (tuỳ chọn)',
    '200 OK với body {"success": true}',
    '202 Accepted với Location: /orders/981',
    '204 No Content kèm id trong header X-Order-Id'
  ],
  answer: 0,
  explain: `**Đáp án đúng: 201 Created kèm Location.**

### Vì sao đúng
RFC 9110: 201 nghĩa là request đã hoàn tất và **một hoặc nhiều resource mới được tạo**; resource chính được chỉ ra bởi header {{Location}} (hoặc URI của request nếu không có Location). Client (và gateway, SDK sinh tự động) biết ngay địa chỉ của resource mới để GET sau này. Trả kèm body chứa đơn vừa tạo giúp client khỏi phải gọi thêm một lần.
~~~java
URI uri = ServletUriComponentsBuilder.fromCurrentRequest()
        .path("/{id}").buildAndExpand(order.getId()).toUri();
return ResponseEntity.created(uri).body(OrderDto.from(order));
~~~

### Vì sao các phương án còn lại sai
- **200 + success: true**: client vẫn chạy được nhưng mất thông tin "đã tạo mới" và vị trí resource; trường success lặp lại điều status code đã nói.
- **202 Accepted**: dành cho việc **chưa** xử lý xong (bất đồng bộ); ở đây đơn đã tạo xong.
- **204 + header tự chế**: 204 nghĩa là không có nội dung, dùng header riêng để truyền id là phát minh lại thứ Location đã chuẩn hoá.

> Senior tip: nếu tạo đơn xong nhưng việc xử lý tiếp (thanh toán, kho) chạy bất đồng bộ, vẫn trả 201 cho resource "order" với {{status: PENDING}}, rồi client theo dõi trạng thái. Đừng lẫn "resource đã tạo" với "quy trình nghiệp vụ đã xong".`
},
{
  id: 'qz-api-015',
  topic: 'api',
  q: 'Endpoint {{GET /me/profile}} trả dữ liệu cá nhân. Bạn muốn: browser được giữ bản sao nhưng **mỗi lần dùng phải hỏi lại server** (có thể nhận 304 nếu chưa đổi), và CDN/proxy dùng chung không được lưu. Header nào phù hợp nhất?',
  options: [
    'Cache-Control: no-store',
    'Cache-Control: private, no-cache (kèm ETag)',
    'Cache-Control: public, max-age=0',
    'Pragma: no-cache'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Cache-Control: private, no-cache kèm ETag.**

### Vì sao đúng
- {{no-cache}} **không** có nghĩa "không cache". Nó cho phép lưu nhưng bắt buộc **revalidate** với server trước mỗi lần dùng. Kết hợp ETag, client gửi {{If-None-Match}}, server trả 304 (không body) nếu chưa đổi, tiết kiệm băng thông mà vẫn luôn mới.
- {{private}}: chỉ cache riêng của người dùng (browser) được lưu; cache dùng chung (CDN, proxy) không được lưu, tránh lộ dữ liệu người này cho người khác.

### Vì sao các phương án còn lại sai
- **no-store**: cấm lưu ở bất kỳ đâu, mỗi lần đều tải đầy đủ, không tận dụng được 304. Hợp với dữ liệu cực nhạy cảm (số thẻ), nhưng không đúng yêu cầu ở đây.
- **public, max-age=0**: {{public}} cho phép CDN lưu dữ liệu cá nhân, vi phạm yêu cầu, rủi ro rò rỉ.
- **Pragma: no-cache**: header của HTTP/1.0, chỉ có ý nghĩa trong request, RFC 9111 đã đánh dấu deprecated; không thay được Cache-Control.

> Senior tip: sự cố kinh điển là CDN cache nhầm response cá nhân (do thiếu private hoặc cấu hình cache theo path) và trả trang của người A cho người B. Với endpoint có Authorization, hãy đặt Cache-Control tường minh thay vì tin vào mặc định của CDN. Spring Security mặc định thêm {{Cache-Control: no-cache, no-store, max-age=0, must-revalidate}} cho response, nên muốn bật 304 phải chủ động cấu hình lại.`
},
{
  id: 'qz-api-016',
  topic: 'api',
  q: 'Endpoint {{POST /api/v1/payments}} chuyển vĩnh viễn sang {{/api/v2/payments}}. Bạn muốn client cũ được chuyển hướng tự động mà **giữ nguyên method POST và body**. Dùng mã nào?',
  options: [
    '301 Moved Permanently',
    '302 Found',
    '308 Permanent Redirect',
    '303 See Other'
  ],
  answer: 2,
  explain: `**Đáp án đúng: 308 Permanent Redirect.**

### Vì sao đúng
308 (RFC 9110) là chuyển hướng vĩnh viễn và **cấm** client đổi method: POST vẫn là POST, body được gửi lại. Cặp tương ứng cho chuyển hướng tạm thời là 307.

| Mã | Vĩnh viễn? | Giữ method? |
|---|---|---|
| 301 | có | không đảm bảo (POST thường thành GET) |
| 302 | không | không đảm bảo |
| 303 | không | luôn chuyển thành GET |
| 307 | không | có |
| 308 | có | có |

### Vì sao các phương án còn lại sai
- **301**: vì lý do lịch sử, browser và nhiều client đổi POST thành GET khi theo 301, nên body thanh toán bị mất. RFC 9110 cho phép hành vi đó.
- **302**: tạm thời, và cũng có vấn đề đổi POST thành GET như 301.
- **303**: được thiết kế để **cố ý** đổi sang GET (mẫu Post/Redirect/Get), ngược hẳn yêu cầu.

> Senior tip: với API thanh toán, đừng phụ thuộc vào redirect: nhiều HTTP client không tự follow redirect cho POST (vì lý do an toàn), có client còn bỏ header Authorization khi redirect. Redirect chỉ là lưới an toàn; hãy thông báo deprecation, dùng header {{Sunset}}, và theo dõi traffic tới endpoint cũ.`
},
{
  id: 'qz-api-017',
  topic: 'api',
  q: 'Team thống nhất trả lỗi theo RFC 9457 (Problem Details for HTTP APIs). Phát biểu nào đúng?',
  options: [
    'Các trường type, title, status, detail, instance đều bắt buộc',
    'Không được thêm trường nào ngoài 5 trường chuẩn',
    'Content-Type phải là application/json như các response khác',
    'type là URI định danh loại lỗi (mặc định "about:blank") và là thứ client nên dựa vào để xử lý; có thể thêm extension member như errors, balance; Content-Type là application/problem+json'
  ],
  answer: 3,
  explain: `**Đáp án đúng: type là định danh chính (mặc định about:blank), cho phép extension, media type application/problem+json.**

### Vì sao đúng
RFC 9457 (thay RFC 7807):
- {{type}}: URI xác định **loại** lỗi; client nên phân nhánh theo type, không parse {{title}}/{{detail}} (dành cho người đọc, có thể được dịch). Không có type thì coi như {{"about:blank"}}.
- Mọi trường đều **tuỳ chọn**; extension member được phép để mang thêm dữ liệu máy đọc được.
~~~json
{
  "type": "https://api.shop.vn/problems/insufficient-funds",
  "title": "Số dư không đủ",
  "status": 422,
  "detail": "Số dư 30.000 nhỏ hơn số tiền 50.000",
  "instance": "/payments/abc123",
  "balance": 30000
}
~~~

### Vì sao các phương án còn lại sai
- **5 trường bắt buộc**: sai, tất cả đều tuỳ chọn.
- **Không được thêm trường**: sai, extension member là tính năng chính thức; client phải bỏ qua extension mà nó không hiểu.
- **application/json**: RFC đăng ký media type riêng {{application/problem+json}} (và {{application/problem+xml}}).

> Senior tip: Spring 6 có {{ProblemDetail}} và {{ErrorResponse}}; bật {{spring.mvc.problemdetails.enabled=true}} để các lỗi mặc định của Spring MVC cũng theo format này. Đừng đưa stack trace hay câu SQL vào {{detail}}, hãy log chúng kèm trace id rồi trả trace id cho client.`
},
{
  id: 'qz-api-018',
  topic: 'api',
  q: 'Bạn thiết kế giao tiếp giữa 2 service nội bộ (đều Java): khoảng 20.000 lời gọi/giây, cần latency thấp, hợp đồng kiểu chặt, và có một luồng server đẩy cập nhật giá liên tục. API public cho đối tác và web frontend vẫn giữ REST. Lựa chọn nào hợp lý nhất cho phần nội bộ?',
  options: [
    'gRPC trên HTTP/2 với Protocol Buffers: binary nhỏ gọn, sinh code từ file .proto, hỗ trợ server streaming',
    'SOAP vì có WSDL định nghĩa hợp đồng chặt',
    'REST/JSON qua HTTP/1.1 với polling mỗi giây cho luồng cập nhật giá',
    'GraphQL vì client có thể chọn trường cần lấy'
  ],
  answer: 0,
  explain: `**Đáp án đúng: gRPC (HTTP/2 + Protobuf).**

### Vì sao đúng
- **Hiệu năng**: Protobuf là binary, nhỏ hơn và parse nhanh hơn JSON; HTTP/2 multiplex nhiều lời gọi trên một connection, giảm chi phí kết nối ở 20.000 rps.
- **Hợp đồng chặt**: file {{.proto}} là nguồn sự thật duy nhất, sinh stub cho cả client lẫn server; quy tắc tiến hoá rõ ràng (không tái sử dụng số field).
- **Streaming**: gRPC hỗ trợ server streaming, client streaming và bidirectional, nên luồng đẩy giá là tính năng có sẵn.

### Vì sao các phương án còn lại sai
- **SOAP**: hợp đồng chặt nhưng XML nặng, chậm, hệ sinh thái lỗi thời, không có streaming tự nhiên.
- **REST + polling**: polling mỗi giây vừa trễ vừa lãng phí, và JSON/HTTP 1.1 tốn hơn ở thông lượng cao. REST vẫn là lựa chọn tốt cho API public.
- **GraphQL**: mạnh khi nhiều client cần hình dạng dữ liệu khác nhau (BFF cho frontend), nhưng thêm chi phí parse/resolve và không nhắm tới RPC nội bộ thông lượng cao.

> Senior tip: gRPC có cái giá vận hành: load balancer L4 không cân bằng được vì connection HTTP/2 sống lâu (cần L7 như Envoy, hoặc client-side LB), khó debug bằng curl (dùng grpcurl), browser không gọi trực tiếp được (cần gRPC-Web). Hãy đặt deadline cho mọi lời gọi.`
},
{
  id: 'qz-api-019',
  topic: 'api',
  q: 'Bạn cung cấp webhook gửi sự kiện thanh toán tới server của đối tác. Đối tác cần xác minh request đúng là do bạn gửi, chưa bị sửa, và không bị gửi lại (replay) bởi kẻ tấn công. Thiết kế nào đúng?',
  options: [
    'Chỉ cần dùng HTTPS là đủ cả ba yêu cầu',
    'Ký HMAC-SHA256 trên timestamp + raw body bằng secret riêng cho từng đối tác, gửi trong header; phía nhận tính lại, so sánh constant-time và từ chối nếu timestamp lệch quá vài phút',
    'Whitelist IP nguồn của bạn ở phía đối tác',
    'Đặt API key cố định trong query string của URL webhook'
  ],
  answer: 1,
  explain: `**Đáp án đúng: chữ ký HMAC trên timestamp + raw body, so sánh constant-time, kiểm tra timestamp.**

### Vì sao đúng
- **Xác thực nguồn và toàn vẹn**: chỉ bạn và đối tác biết secret; sửa một byte body là chữ ký sai.
- **Chống replay**: timestamp nằm trong phần được ký, phía nhận từ chối nếu lệch quá cửa sổ (ví dụ 5 phút), kết hợp lưu event id đã xử lý để chống trùng trong cửa sổ đó.
- **Tính trên raw body**: parse JSON rồi serialize lại có thể đổi thứ tự hay khoảng trắng, làm chữ ký không khớp.
~~~java
Mac mac = Mac.getInstance("HmacSHA256");
mac.init(new SecretKeySpec(secret, "HmacSHA256"));
byte[] expected = mac.doFinal((timestamp + "." + rawBody).getBytes(UTF_8));
boolean ok = MessageDigest.isEqual(expected, HexFormat.of().parseHex(sigHeader)); // constant-time
~~~

### Vì sao các phương án còn lại sai
- **Chỉ HTTPS**: mã hoá đường truyền, nhưng bất kỳ ai biết URL webhook cũng gửi được request giả, và không chống replay.
- **Whitelist IP**: hữu ích như lớp phụ, nhưng IP cloud thay đổi, có thể bị dùng chung, và không bảo vệ toàn vẹn hay chống replay.
- **API key trong query string**: lộ trong log của proxy/server, không bảo vệ body, không chống replay.

> Senior tip: hỗ trợ **nhiều secret cùng lúc** để xoay vòng (rotate) không downtime, ký và gửi kèm id của secret. Phía gửi cần retry với backoff và đánh id sự kiện để phía nhận xử lý idempotent, vì webhook về bản chất là at-least-once.`
},
{
  id: 'qz-api-020',
  topic: 'api',
  q: 'Hệ thống dùng JWT access token tự chứa (stateless), TTL 24 giờ. Một nhân viên nghỉ việc, admin vô hiệu hoá tài khoản nhưng người đó vẫn gọi API được thêm nhiều giờ. Thiết kế lại thế nào là hợp lý nhất?',
  options: [
    'Đổi thuật toán ký từ HS256 sang RS256',
    'Xoá token khỏi localStorage của trình duyệt người đó từ phía server',
    'Access token ngắn hạn (5–15 phút) + refresh token lưu phía server có thể thu hồi (rotation); với thao tác nhạy cảm thì kiểm tra thêm danh sách thu hồi (denylist theo jti/user)',
    'Mã hoá payload JWT bằng JWE'
  ],
  answer: 2,
  explain: `**Đáp án đúng: access token ngắn hạn + refresh token có thể thu hồi, kèm denylist cho thao tác nhạy cảm.**

### Vì sao đúng
JWT tự chứa được server xác minh chỉ bằng chữ ký và {{exp}}, **không hỏi DB**; đó vừa là ưu điểm (scale) vừa là nhược điểm: không có cách "thu hồi" token đã phát. Cách cân bằng phổ biến:
- Access token sống ngắn, nên thời gian "lọt lưới" sau khi khoá tài khoản tối đa vài phút.
- Refresh token lưu phía server (hoặc có trạng thái), khi khoá tài khoản thì thu hồi ngay; rotation (mỗi lần refresh đổi token mới, phát hiện token cũ bị dùng lại) chống đánh cắp.
- Với hành động nhạy cảm (chuyển tiền, đổi quyền), kiểm tra thêm denylist trong Redis theo {{jti}} hoặc "token phát trước thời điểm X của user thì từ chối".

### Vì sao các phương án còn lại sai
- **HS256 sang RS256**: chỉ đổi cách ký/xác minh (khoá đối xứng hay bất đối xứng), không giải quyết việc thu hồi.
- **Xoá localStorage từ server**: server không thể điều khiển storage của client; kẻ giữ token có thể đã copy nó.
- **JWE**: mã hoá nội dung để giấu claim, token vẫn hợp lệ tới khi hết hạn.

> Senior tip: đây là câu hỏi "stateless có giá của nó". Trả lời tốt phải nêu đánh đổi: denylist khiến mỗi request lại phải tra cứu, nên chỉ áp dụng cho endpoint nhạy cảm, hoặc dùng opaque token + introspection (có cache ngắn) khi yêu cầu thu hồi tức thì là bắt buộc.`
},
{
  id: 'qz-api-021',
  topic: 'api',
  q: 'Endpoint {{POST /orders}} chỉ chấp nhận JSON. Một client gửi body XML với header {{Content-Type: application/xml}}. Theo RFC 9110, server nên trả mã nào?',
  options: [
    '406 Not Acceptable',
    '400 Bad Request',
    '501 Not Implemented',
    '415 Unsupported Media Type'
  ],
  answer: 3,
  explain: `**Đáp án đúng: 415 Unsupported Media Type.**

### Vì sao đúng
415 nghĩa là server từ chối vì **định dạng nội dung client gửi lên** (Content-Type, hoặc Content-Encoding) không được hỗ trợ cho resource này. RFC 9110 khuyến nghị kèm header {{Accept}} (trong response) để cho biết server chấp nhận định dạng nào, hoặc {{Accept-Encoding}} nếu vấn đề là encoding. Spring MVC tự trả 415 ({{HttpMediaTypeNotSupportedException}}) khi không có message converter nào đọc được Content-Type đó cho {{@RequestBody}}.

### Vì sao các phương án còn lại sai
- **406 Not Acceptable**: liên quan tới **response**: client yêu cầu qua header {{Accept}} một định dạng mà server không trả được (ví dụ Accept: application/xml trong khi server chỉ có JSON). Dễ nhầm với 415.
- **400**: quá chung chung; có mã chính xác hơn thì nên dùng.
- **501**: dành cho trường hợp server không hỗ trợ **method** đó cho bất kỳ resource nào, lỗi phía server.

> Senior tip: mẹo nhớ: **415 là về thứ client gửi lên (Content-Type), 406 là về thứ client muốn nhận (Accept)**. Kiểm tra cả hai trong contract test, vì gateway hoặc WAF đôi khi viết đè mã lỗi khiến client nhận 400 chung chung khó debug.`
},
{
  id: 'qz-api-022',
  topic: 'api',
  q: 'Bạn chọn thuật toán rate limit cho API gateway: giới hạn trung bình 10 request/giây cho mỗi client, nhưng vẫn cho phép **burst** ngắn tới 50 request (ví dụ app mở màn hình gọi nhiều API cùng lúc). Thuật toán nào đáp ứng tự nhiên nhất?',
  options: [
    'Token bucket: dung lượng 50 token, nạp 10 token/giây; mỗi request tiêu 1 token, hết token thì trả 429',
    'Fixed window counter: tối đa 10 request trong mỗi giây theo đồng hồ',
    'Leaky bucket dạng hàng đợi xả đều 10 request/giây',
    'Giới hạn số connection đồng thời tối đa 10'
  ],
  answer: 0,
  explain: `**Đáp án đúng: token bucket.**

### Vì sao đúng
Token bucket tách bạch hai tham số: **tốc độ nạp** (trung bình dài hạn = 10/giây) và **dung lượng** (burst tối đa = 50). Client im lặng 5 giây tích đủ 50 token và có thể dùng một lúc; sau đó bị giới hạn về đúng 10/giây. Cài đặt chỉ cần lưu (số token, thời điểm cập nhật cuối), dễ làm nguyên tử trên Redis bằng Lua script. Đây là thuật toán mà nhiều gateway (AWS API Gateway, Bucket4j, Envoy local rate limit) dùng.

### Vì sao các phương án còn lại sai
- **Fixed window 10/giây**: không cho phép burst 50; còn có lỗi biên cửa sổ: 10 request cuối giây trước + 10 request đầu giây sau tạo ra 20 request trong khoảng rất ngắn.
- **Leaky bucket dạng hàng đợi**: làm đầu ra **đều đặn**, burst bị xếp hàng và trễ thay vì được phục vụ ngay; hợp với bảo vệ downstream nhạy cảm, không hợp với yêu cầu ở đây.
- **Giới hạn connection đồng thời**: kiểm soát concurrency, không phải tốc độ; request nhanh có thể vượt xa 10/giây, request chậm thì bị chặn oan.

> Senior tip: trong hệ thống nhiều instance, rate limit cục bộ ở từng pod sẽ nhân giới hạn lên theo số pod; cần store chung (Redis) hoặc chia giới hạn theo số instance. Khi Redis lỗi, quyết định trước là fail-open (cho qua) hay fail-closed (chặn) tuỳ mức độ quan trọng của API.`
},
{
  id: 'qz-spring-021',
  topic: 'spring',
  q: 'Bạn gọi method {{@Transactional}} của cùng bean qua {{this}} (self-invocation). Method có rollbackFor? Kết quả transaction?',
  options: [
    'Transaction vẫn mở và rollback nếu exception',
    'Không có proxy nên không có transaction, exception propagate bình thường',
    'Spring tự động tạo proxy cho self-call',
    'Compile lỗi'
  ],
  answer: 1,
  explain: `**Đáp án đúng: self-invocation không qua proxy, nên không có transaction.**

### Vì sao đúng
Spring AOP proxy bọc bean; chỉ lời gọi từ bên ngoài qua proxy mới kích hoạt advice. Gọi {{this.method()}} là gọi trực tiếp object gốc, proxy bị bỏ qua, nên @Transactional không có tác dụng. Exception propagate bình thường mà không rollback.

### Vì sao khác sai
- **Vẫn mở transaction**: chỉ đúng nếu gọi qua proxy (bean khác).
- **Tự tạo proxy**: Spring không tự tạo cho self-call.
- **Compile lỗi**: không có lỗi compile.

> Senior tip: tránh self-invocation; tách logic vào bean khác hoặc dùng ApplicationEventPublisher.`
},
{
  id: 'qz-spring-022',
  topic: 'spring',
  multi: true,
  q: 'Spring bean scope nào là mặc định và nào tạo instance mới mỗi request? (Chọn 2)',
  options: [
    'singleton mặc định',
    'prototype tạo mới mỗi lần getBean',
    'request scope tạo mới mỗi HTTP request',
    'session scope tạo mới mỗi session',
    'application scope tạo mới mỗi ServletContext'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: singleton mặc định; request scope tạo mới mỗi HTTP request.**

### Vì sao đúng
- Singleton là scope mặc định, một instance cho toàn context.
- Request scope tạo mới instance mỗi HTTP request (trong web context).

### Vì sao khác sai
- Prototype tạo mới mỗi lần getBean (đúng nhưng không phải HTTP request).
- Session/application không phải mặc định cho câu hỏi này.

> Senior tip: dùng request scope cẩn thận với proxy; inject scoped bean vào singleton cần proxy.`
},
{
  id: 'qz-spring-023',
  topic: 'spring',
  q: 'Spring Boot auto-configuration bật khi nào?',
  options: [
    'Luôn bật khi có dependency',
    'Khi classpath có class và không có bean do user định nghĩa (@ConditionalOnMissingBean)',
    'Chỉ khi profile prod active',
    'Khi property spring.boot.enable-autoconfig=true'
  ],
  answer: 1,
  explain: `**Đáp án đúng: khi classpath có class và không có bean do user định nghĩa.**

### Vì sao đúng
Auto-config dùng @ConditionalOnClass và @ConditionalOnMissingBean để chỉ bật khi dependency có và user chưa tự định nghĩa bean.

### Vì sao khác sai
- Không luôn bật; có điều kiện.
- Không phụ thuộc profile mặc định.
- Property không phải điều kiện chính.

> Senior tip: dùng --debug để xem condition evaluation report.`
},
{
  id: 'qz-spring-024',
  topic: 'spring',
  multi: true,
  q: 'TransactionalEventListener phase nào chạy sau commit thành công? (Chọn 2)',
  options: [
    'AFTER_COMMIT',
    'AFTER_ROLLBACK',
    'AFTER_COMPLETION',
    'BEFORE_COMMIT',
    'IMMEDIATE'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: AFTER_COMMIT và AFTER_COMPLETION.**

### Vì sao đúng
- AFTER_COMMIT chạy sau commit thành công.
- AFTER_COMPLETION chạy sau khi transaction kết thúc (commit hoặc rollback).

### Vì sao khác sai
- AFTER_ROLLBACK chỉ sau rollback.
- BEFORE_COMMIT chưa có.
- IMMEDIATE không phải phase.

> Senior tip: AFTER_COMMIT vẫn có khe hở pod chết; dùng outbox cho event bắt buộc.`
},
{
  id: 'qz-jpa-021',
  topic: 'jpa',
  q: 'Batch insert với IDENTITY strategy có vấn đề gì?',
  options: [
    'Không có vấn đề',
    'Hibernate phải INSERT ngay để lấy id, phá batching',
    'Sequence phải allocationSize=1',
    'Không compile'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Hibernate phải INSERT ngay để lấy id, phá batching.**

### Vì sao đúng
IDENTITY bắt buộc INSERT ngay để lấy id, nên JDBC batching không thể gom insert.

### Vì sao khác sai
- Có vấn đề rõ ràng.
- Sequence allocationSize không liên quan IDENTITY.
- Compile được.

> Senior tip: dùng SEQUENCE với pooled optimizer cho batch insert lớn.`
},
{
  id: 'qz-jpa-022',
  topic: 'jpa',
  multi: true,
  q: 'Bulk update qua @Modifying có tác dụng gì? (Chọn 2)',
  options: [
    'Bỏ qua persistence context',
    'Cập nhật nhiều dòng bằng một câu UPDATE',
    'Tự động flush trước',
    'Tự động clear sau',
    'Tự động rollback nếu lỗi'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: bỏ qua persistence context và cập nhật nhiều dòng bằng một câu UPDATE.**

### Vì sao đúng
@Modifying thực thi bulk update trực tiếp trên DB, bỏ qua persistence context; cập nhật nhiều dòng trong một câu.

### Vì sao khác sai
- Không tự flush/clear/rollback mặc định (clearAutomatically optional).

> Senior tip: sau bulk update, clear persistence context để tránh stale entity.`
},
{
  id: 'qz-jpa-023',
  topic: 'jpa',
  q: 'DTO projection trong Spring Data JPA là gì?',
  options: [
    'Entity đầy đủ',
    'Interface hoặc class chỉ chứa subset cột, query chỉ SELECT các cột đó',
    'Native query bắt buộc',
    'Cache L2'
  ],
  answer: 1,
  explain: `**Đáp án đúng: interface hoặc class chỉ chứa subset cột.**

### Vì sao đúng
Projection định nghĩa tập con cột; Spring Data sinh query chỉ SELECT các cột đó, không có managed entity.

### Vì sao khác sai
- Không phải entity đầy đủ.
- Không bắt buộc native.
- Không liên quan cache.

> Senior tip: dùng projection cho màn hình đọc để giảm I/O và heap.`
},
{
  id: 'qz-jpa-024',
  topic: 'jpa',
  multi: true,
  q: 'Optimistic lock với @Version hoạt động thế nào? (Chọn 2)',
  options: [
    'Kiểm tra version khi UPDATE',
    'Ném OptimisticLockException nếu version mismatch',
    'Khoá dòng DB',
    'Tự retry',
    'Dùng cho read-heavy'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: kiểm tra version khi UPDATE và ném OptimisticLockException nếu mismatch.**

### Vì sao đúng
@Version thêm cột version; UPDATE có WHERE version = ?; nếu không có dòng nào cập nhật thì ném OptimisticLockException.

### Vì sao khác sai
- Không khoá dòng DB (pessimistic mới khoá).
- Không tự retry.

> Senior tip: retry ở tầng service, không trong transaction.`
},
{
  id: 'qz-db-021',
  topic: 'db',
  q: 'MVCC trong PostgreSQL nghĩa là gì?',
  options: [
    'Mỗi UPDATE tạo phiên bản mới, readers không block writers',
    'Khoá bảng khi write',
    'Không có snapshot',
    'Chỉ dùng cho SELECT'
  ],
  answer: 0,
  explain: `**Đáp án đúng: mỗi UPDATE tạo phiên bản mới, readers không block writers.**

### Vì sao đúng
MVCC giữ nhiều phiên bản; reader thấy snapshot, writer tạo phiên bản mới, không chặn nhau.

### Vì sao khác sai
- Không khoá bảng.
- Có snapshot.
- Áp dụng mọi operation.

> Senior tip: autovacuum dọn dead tuple; transaction treo chặn cleanup.`
},
{
  id: 'qz-db-022',
  topic: 'db',
  multi: true,
  q: 'Isolation level nào ngăn lost update? (Chọn 2)',
  options: [
    'READ COMMITTED với SELECT FOR UPDATE',
    'REPEATABLE READ (PostgreSQL)',
    'READ UNCOMMITTED',
    'SERIALIZABLE',
    'READ COMMITTED plain'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: REPEATABLE READ (PostgreSQL) và SERIALIZABLE.**

### Vì sao đúng
PostgreSQL RR chặn update đồng thời trên cùng dòng; SERIALIZABLE phát hiện xung đột.

### Vì sao khác sai
- READ COMMITTED plain có thể lost update.
- READ UNCOMMITTED không an toàn.

> Senior tip: dùng UPDATE atomic hoặc lock để tránh lost update.`
},
{
  id: 'qz-db-023',
  topic: 'db',
  q: 'Index nào giúp query WHERE lower(email)=? nhanh?',
  options: [
    'Index thường trên email',
    'Expression index trên lower(email)',
    'Hash index',
    'Partial index'
  ],
  answer: 1,
  explain: `**Đáp án đúng: expression index trên lower(email).**

### Vì sao đúng
Expression index stores computed value; query must match expression exactly.

### Vì sao khác sai
- Index thường không chứa lower().
- Hash/partial không giải quyết hàm.

> Senior tip: chuẩn hoá dữ liệu khi ghi để tránh hàm trong WHERE.`
},
{
  id: 'qz-db-024',
  topic: 'db',
  multi: true,
  q: 'Deadlock xảy ra khi nào? (Chọn 2)',
  options: [
    'Hai transaction cùng chờ lock của nhau',
    'Lock theo thứ tự khác nhau',
    'Isolation READ COMMITTED',
    'Index thiếu',
    'Transaction quá ngắn'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: hai transaction cùng chờ lock của nhau; lock theo thứ tự khác nhau.**

### Vì sao đúng
Deadlock là cycle wait; lock ordering khác nhau gây cycle.

### Vì sao khác sai
- Isolation không trực tiếp gây deadlock.
- Transaction ngắn giảm rủi ro.

> Senior tip: luôn lock theo cùng thứ tự (id tăng dần).`
},
{
  id: 'qz-api-023',
  topic: 'api',
  q: 'Idempotency key dùng để làm gì?',
  options: [
    'Mã hoá payload',
    'Đảm bảo retry cùng request không tạo duplicate',
    'Xác thực user',
    'Rate limit'
  ],
  answer: 1,
  explain: `**Đáp án đúng: đảm bảo retry cùng request không tạo duplicate.**

### Vì sao đúng
Idempotency key định danh request; server trả response đã cache cho key trùng.

### Vì sao khác sai
- Không mã hoá/xác thực/rate limit.

> Senior tip: lưu key với TTL và response để replay.`
},
{
  id: 'qz-api-024',
  topic: 'api',
  multi: true,
  q: 'Response 429 nên kèm gì? (Chọn 2)',
  options: [
    'Retry-After',
    'RateLimit headers',
    'Set-Cookie',
    'Location',
    'ETag'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: Retry-After và RateLimit headers.**

### Vì sao đúng
429 nghĩa là quá nhiều request; Retry-After cho biết khi nào retry; RateLimit headers hiển thị quota.

### Vì sao khác sai
- Cookie/Location/ETag không liên quan.

> Senior tip: client backoff + jitter để tránh spike.`
},
{
  id: 'qz-api-025',
  topic: 'api',
  q: 'API versioning an toàn nhất thường dùng gì?',
  options: [
    'URL path /v1/',
    'Query param version',
    'Header Accept version',
    'Không version'
  ],
  answer: 0,
  explain: `**Đáp án đúng: URL path /v1/.**

### Vì sao đúng
URL path versioning rõ ràng, dễ cache, dễ route; phổ biến nhất.

### Vì sao khác sai
- Query/header cũng dùng nhưng kém rõ ràng/cache.
- Không version gây breaking.

> Senior tip: dùng expand/contract khi deprecate.`
},
{
  id: 'qz-spring-025',
  topic: 'spring',
  q: 'Hai class @Component đều implements {{BeanPostProcessor}} và {{Ordered}}: {{BPPA.getOrder()}} trả về 10, {{BPPB.getOrder()}} trả về 100. Cả hai ghi log trong {{postProcessBeforeInitialization}} và trả về đối tượng bean không thay đổi. Bean mục tiêu có {{@PostConstruct}}. Thứ tự Spring xử lý là gì?',
  options: [
    'Log của BPPA, rồi log của BPPB, sau đó mới chạy {{@PostConstruct}} của bean',
    'Log của BPPB, rồi log của BPPA, sau đó mới chạy {{@PostConstruct}} của bean',
    '{{@PostConstruct}} chạy trước cả hai log',
    'Thứ tự không đảm bảo, phụ thuộc vào tên class'
  ],
  answer: 0,
  explain: `**Đáp án đúng: BPPA (order 10) trước, BPPB (order 100) sau, rồi mới tới {{@PostConstruct}}.**

### Vì sao đúng
Khi refresh context, Spring đăng ký các {{BeanPostProcessor}} theo 3 nhóm, xét bằng **interface**: nhóm {{PriorityOrdered}}, rồi nhóm {{Ordered}}, rồi nhóm còn lại. Trong mỗi nhóm có thứ tự, số {{getOrder()}} nhỏ hơn chạy trước. Vòng đời khởi tạo một bean:
~~~text
1. postProcessBeforeInitialization của từng BPP, theo thứ tự đã đăng ký
   (@PostConstruct được gọi ở bước này, bởi CommonAnnotationBeanPostProcessor)
2. InitializingBean.afterPropertiesSet, rồi init-method
3. postProcessAfterInitialization (proxy AOP như @Transactional được tạo ở đây)
~~~
{{@PostConstruct}} không phải bước riêng: nó do {{CommonAnnotationBeanPostProcessor}} gọi. Đây là BPP nội bộ, Spring đăng ký lại ở **cuối chuỗi** sau các BPP của bạn, nên log của BPPA và BPPB in ra trước. {{@PostConstruct}} chạy trên bean gốc, **trước khi** proxy AOP tồn tại. Vì vậy gọi một method {{@Transactional}} của chính bean bên trong {{@PostConstruct}} sẽ không mở transaction.

### Vì sao các phương án còn lại sai
- **BPPB trước**: sai, order 100 lớn hơn nên chạy sau.
- **@PostConstruct trước**: sai, BPP nội bộ gọi {{@PostConstruct}} nằm cuối chuỗi.
- **Không đảm bảo**: sai khi BPP implements {{Ordered}}. Nhưng lưu ý: nếu chỉ gắn {{@Order}} hoặc {{@Priority}} lên class BPP mà **không** implements {{Ordered}}, Spring xếp nó vào nhóm "không thứ tự" và chạy theo thứ tự đăng ký bean definition. Khi đó phương án này mới gần đúng.

> Senior tip: với {{BeanPostProcessor}} và {{BeanFactoryPostProcessor}}, muốn chắc thứ tự thì implements {{Ordered}} hoặc {{PriorityOrdered}}, đừng dựa vào annotation. Đây là lỗi hay gặp khi hai thư viện cùng bọc proxy lên một bean.`
},
{
  id: 'qz-spring-026',
  topic: 'spring',
  q: `Auto-configuration của một thư viện khai báo:
~~~java
@Configuration
@ConditionalOnClass(name = "org.springframework.data.redis.core.RedisTemplate")
@ConditionalOnProperty(prefix = "app.feature", name = "enabled", havingValue = "true", matchIfMissing = true)
public class FeatureAutoConfiguration {
    @Bean
    public FeatureService featureService() { return new FeatureService(); }
}
~~~
Environment **không** có property {{app.feature.enabled}} nào, nhưng class {{RedisTemplate}} có trên classpath. Bean {{FeatureService}} được tạo không?`,
  options: [
    'Không, vì thiếu property nên @ConditionalOnProperty không match',
    'Có, vì {{matchIfMissing = true}} coi việc thiếu property là match, và class RedisTemplate có trên classpath',
    'Có, dù class RedisTemplate có trên classpath hay không',
    'Không, vì @ConditionalOnClass và @ConditionalOnProperty không dùng cùng nhau được'
  ],
  answer: 1,
  explain: `**Đáp án đúng: được tạo, vì matchIfMissing = true khiến thiếu property được coi như match.**

### Vì sao đúng
Các điều kiện của auto-configuration được **AND** lại: @ConditionalOnClass kiểm tra classpath (class RedisTemplate phải có), @ConditionalOnProperty kiểm tra environment. Mặc định matchIfMissing = false, nghĩa là thiếu property thì điều kiện fail. Với matchIfMissing = true, thiếu property được coi là match, nên bean vẫn được tạo. Nếu thiếu class RedisTemplate thì auto-configuration này bị bỏ qua hoàn toàn.

### Vì sao các phương án còn lại sai
- **Thiếu property nên không match**: sai khi matchIfMissing = true; đây chính là điểm khác biệt so với mặc định.
- **Dù có class hay không**: sai, @ConditionalOnClass vẫn bắt buộc class phải có trên classpath.
- **Hai điều kiện mâu thuẫn**: sai, chúng phối hợp nhau, điều kiện nào fail thì auto-config không áp dụng.

> Senior tip: khi viết auto-configuration cho thư viện của riêng mình, hãy kết hợp @ConditionalOnClass (thư viện có trên classpath), @ConditionalOnMissingBean (người dùng chưa định nghĩa bean) và @ConditionalOnProperty (bật/tắt bằng thuộc tính), để Boot tự lùi lại khi người dùng muốn kiểm soát bằng tay.`
},
{
  id: 'qz-spring-027',
  topic: 'spring',
  multi: true,
  q: 'Method {{A.placeOrder()}} có {{@Transactional}} (mặc định REQUIRED) và gọi {{B.logAudit()}} có {{@Transactional(propagation = Propagation.REQUIRES_NEW)}}. {{B}} ghi log vào cùng DB rồi commit. Phát biểu nào đúng? (Chọn 2)',
  options: [
    '{{B.logAudit}} chạy trong transaction vật lý riêng; commit hay rollback của {{B}} không làm thay đổi kết quả của transaction {{A}}',
    'Khi {{B}} bắt đầu, transaction của {{A}} bị tạm ngưng (suspend) nhưng vẫn giữ connection của nó; {{B}} lấy thêm một connection thứ hai từ pool',
    'Nếu {{B}} ném exception và rollback, transaction {{A}} cũng bị đánh dấu rollback-only',
    '{{REQUIRES_NEW}} không cần kết nối DB vì chỉ lưu nhật ký trong bộ nhớ',
    'Gọi this.logAudit() trong cùng class {{A}} vẫn áp dụng {{REQUIRES_NEW}}'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: B có transaction vật lý riêng; A bị tạm ngưng nhưng vẫn giữ connection, B dùng connection thứ hai.**

### Vì sao đúng
Propagation {{REQUIRES_NEW}} tạo một transaction vật lý mới, riêng biệt. Transaction của {{A}} bị **suspend**: Spring gỡ resource của A (connection đang mở transaction) khỏi thread hiện tại, nhưng **không** đóng hay trả connection đó về pool, vì A còn phải commit sau này. B lấy một connection khác từ pool, chạy, commit, rồi Spring gắn lại connection của A vào thread. Commit hay rollback của {{B}} không đổi kết quả của {{A}}, và ngược lại.

### Vì sao các phương án còn lại sai
- **B rollback thì A bị đánh dấu rollback-only**: sai, hai transaction độc lập nên rollback của B không đặt cờ rollback-only cho A. Lưu ý: nếu exception của B lan ra và A **không** bắt lại, A vẫn rollback, nhưng đó là do exception chứ không phải do cờ.
- **Không cần kết nối DB**: sai, REQUIRES_NEW vẫn cần một connection JDBC cho transaction riêng của nó.
- **this.logAudit() vẫn REQUIRES_NEW**: sai, gọi this() bỏ qua proxy, advice @Transactional không được kích hoạt (self-invocation).

> Senior tip: REQUIRES_NEW hợp cho audit log phải lưu dù nghiệp vụ chính rollback, nhưng nhớ nó giữ **2 connection cùng lúc** (1 của A đang suspend, 1 của B). Pool nhỏ dưới tải cao có thể tự chặn chính mình: mọi thread giữ 1 connection và chờ connection thứ 2.`
},
{
  id: 'qz-spring-028',
  topic: 'spring',
  q: `Method sau trong service:
~~~java
@Transactional(noRollbackFor = {RuntimeException.class})
public void process() {
    orderRepo.save(new Order("PENDING"));
    throw new RuntimeException("lỗi nghiệp vụ");
}
~~~
Exception được caller bắt lại và không tiếp tục ném. Trạng thái đơn hàng trong DB sau khi method kết thúc là gì?`,
  options: [
    'Rollback, đơn hàng không được lưu, vì RuntimeException luôn gây rollback',
    'Commit, đơn hàng PENDING được lưu, vì noRollbackFor loại trừ RuntimeException khỏi quy tắc rollback',
    'Rollback, rồi Spring tự retry method một lần',
    'Không compile được, vì noRollbackFor không cho phép chứa RuntimeException'
  ],
  answer: 1,
  explain: `**Đáp án đúng: commit, đơn hàng PENDING được lưu.**

### Vì sao đúng
Mặc định Spring rollback khi gặp RuntimeException hoặc Error. Thuộc tính {{noRollbackFor}} ghi đè quy tắc đó: các exception liệt kê trong {{noRollbackFor}} **không** gây rollback. Ở đây RuntimeException nằm trong danh sách nên transaction vẫn commit; exception vẫn được ném ra để caller bắt, nhưng dữ liệu đã lưu vào DB. {{rollbackFor}} là thuộc tính ngược lại: liệt kê các exception **bắt buộc** gây rollback (ví dụ checked exception).

### Vì sao các phương án còn lại sai
- **RuntimeException luôn rollback**: đúng với quy tắc mặc định, nhưng bị noRollbackFor ghi đè ở đây.
- **Tự retry**: Spring không tự retry method khi transaction rollback hoặc commit.
- **Không compile**: noRollbackFor hoàn toàn hợp lệ và có thể chứa bất kỳ lớp exception nào.

> Senior tip: noRollbackFor hiếm khi dùng, nhưng hữu ích khi một lỗi nghiệp vụ (ví dụ hàng hết hàng) được ném dưới dạng RuntimeException mà bạn vẫn muốn lưu log đơn hàng vào DB. Nếu muốn rollback cả checked exception, dùng {{rollbackFor = Exception.class}} như câu qz-spring-007.`
},
{
  id: 'qz-spring-029',
  topic: 'spring',
  multi: true,
  q: 'Gọi method {{@Transactional}} của chính bean đó qua {{this}} (self-invocation) không có transaction. Cách khắc phục nào đúng? (Chọn 2)',
  options: [
    'Tách method cần transaction ra một bean khác, inject bean đó vào bean gốc, gọi qua bean đó',
    'Bật {{@EnableAspectJAutoProxy(exposeProxy = true)}} rồi gọi {{AopContext.currentProxy()}}.method() thay vì this.method()',
    'Đặt {{@Transactional}} trên constructor của bean',
    'Gọi this.method() bên trong {{@PostConstruct}} thì proxy đã sẵn sàng'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: tách ra bean khác, hoặc dùng AopContext.currentProxy() sau khi bật exposeProxy.**

### Vì sao đúng
Spring AOP bọc bean bằng proxy; chỉ lời gọi từ **ngoài** qua proxy mới kích hoạt advice. Gọi {{this.method()}} là gọi trực tiếp đối tượng gốc, bỏ qua proxy, nên {{@Transactional}} không có tác dụng. Hai cách sửa:
- Tách logic sang bean khác, inject bean đó, gọi qua proxy của bean khác (cách sạch nhất).
- Bật {{@EnableAspectJAutoProxy(exposeProxy = true)}}, lấy proxy hiện tại bằng {{(AopContext.currentProxy())}} và gọi method trên nó. Cần ép kiểu class hiện tại implements {{AopContextAware}}.

### Vì sao các phương án còn lại sai
- **@Transactional trên constructor**: constructor chạy khi object mới tạo, chưa có proxy, annotation không có nghĩa.
- **this.method() trong @PostConstruct**: sai, lúc chạy {{@PostConstruct}} proxy chưa được tạo (proxy tạo ở postProcessAfterInitialization, xem câu qz-spring-025).

> Senior tip: ưu tiên tách bean khác thay vì AopContext.currentProxy(), vì code sẽ rõ ràng hơn, dễ unit test và không phụ thuộc vào cơ chế proxy của Spring.`
},
{
  id: 'qz-jpa-025',
  topic: 'jpa',
  q: `Trong một transaction, code lưu cha mới rồi con mới có khoá ngoại tham chiếu cha:
~~~java
Order order = new Order();
orderRepo.save(order);
OrderItem item = new OrderItem();
item.setOrder(order);
itemRepo.save(item);
// commit
~~~
Hibernate flush câu SQL nào trước?`,
  options: [
    'INSERT order_item trước, sau đó mới INSERT order',
    'INSERT order trước, sau đó mới INSERT order_item (vì khoá ngoại phải trỏ đến hàng đã có)',
    'Cả hai INSERT cùng một câu lệnh (multi-row INSERT)',
    'Thứ tự không chắc chắn, phụ thuộc vào driver DB'
  ],
  answer: 1,
  explain: `**Đáp án đúng: INSERT order trước, sau đó mới INSERT order_item.**

### Vì sao đúng
Khi flush, Hibernate sắp xếp thứ tự câu SQL: insert entity trước, insert collection sau. Trong các insert entity, hàng được tham chiếu bởi khoá ngoại (cha) được insert trước hàng tham chiếu (con), để không vi phạm ràng buộc FK khi insert con. Nên câu SQL thực tế là INSERT order rồi mới INSERT order_item. Delete ngược lại: xóa entity sau cùng, xóa collection cuối cùng.

### Vì sao các phương án còn lại sai
- **Insert order_item trước**: sẽ vi phạm FK nếu order_item.order_id bắt buộc phải trỏ đến hàng order đã tồn tại.
- **Cả hai cùng một câu lệnh**: Hibernate không gộp các bảng khác nhau thành multi-row INSERT mặc định (cần JDBC batching với cùng bảng).
- **Không chắc chắn**: Hibernate có thứ tự cố định, tuân thủ ràng buộc FK.

> Senior tip: thứ tự flush này là lý do tại sao bạn có thể lưu cha rồi con mà không cần flush giữa hai bước; Hibernate tự xử lý đúng thứ tự khi commit. Nếu dùng IDENTITY, Hibernate bị ép phải insert ngay để lấy id, nên phá batching (xem câu qz-jpa-021).`
},
{
  id: 'qz-jpa-026',
  topic: 'jpa',
  q: `Code sau chạy trong một transaction. Sau khi commit, bảng Order có dòng mới được thêm không?
~~~java
Order o = new Order();
o.setCode("X");
em.persist(o);
em.flush();      // o đã có id sau flush
em.detach(o);    // loại o khỏi persistence context
o.setCode("Y");  // sửa sau khi detach
~~~`,
  options: [
    'Có, mã Y, vì o vẫn là object đã persist',
    'Không có dòng nào, vì detach hủy đi việc persist',
    'Có, mã X, vì detach làm Hibernate ngừng theo dõi o; sửa sau đó không được flush',
    'Ném Exception vì không được sửa entity sau khi detach'
  ],
  answer: 2,
  explain: `**Đáp án đúng: có dòng mới, mã X; sửa sau detach không được lưu.**

### Vì sao đúng
{{em.persist(o)}} đánh dấu o là managed và lên lịch INSERT; INSERT thực sự chạy khi flush (lúc gọi flush() rõ ràng, hoặc khi commit) → hàng được lưu với mã X. {{em.detach(o)}} loại o khỏi persistence context, o trở thành **detached**. Hibernate không theo dõi detached entity, nên {{setCode("Y")}} không sinh UPDATE nào, và commit cũng không đẩy thay đổi này. Hàng trong DB vẫn giữ mã X.

### Vì sao các phương án còn lại sai
- **Mã Y**: detach đã ngắt liên kết o với persistence context, Hibernate không biết o đã đổi.
- **Không có dòng nào**: detach chỉ ngừng theo dõi, không xoá hàng đã insert.
- **Ném Exception**: sửa detached entity hoàn toàn hợp lệ, chỉ đơn giản không được lưu.

> Senior tip: cần cập nhật detached entity thì dùng {{em.merge(o)}} (merge load hàng hiện có, chép trạng thái vào, trả về managed instance) hoặc dùng managed entity trong suốt transaction. detach thích hợp khi muốn tách object khỏi session, ví dụ gửi entity qua cache hoặc về phía client.`
},
{
  id: 'qz-jpa-027',
  topic: 'jpa',
  multi: true,
  q: 'Entity {{Order}} có {{@OneToMany(fetch = FetchType.LAZY) @BatchSize(20) List<OrderItem> items}}. Truy vấn lấy 35 order rồi duyệt items của từng order. Cách Hibernate xử lý là gì? (Chọn 2)',
  options: [
    'Khi truy cập items của order đầu tiên, Hibernate load items của đúng 20 order cùng lúc bằng câu SELECT ... WHERE order_id IN (...)',
    '@BatchSize chỉ có hiệu quả khi FetchType.EAGER, vì EAGER đã load kèm items trong truy vấn chính',
    '{{hibernate.default_batch_fetch_size}} áp dụng cho collection/entity nào chưa có @BatchSize',
    'Batch fetch luôn tạo ra ít câu SQL hơn {{JOIN FETCH}} items'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: Hibernate gom ids thành các lô tối đa 20 và load bằng câu SELECT ... IN; default_batch_fetch_size là cấu hình toàn cục.**

### Vì sao đúng
Batch fetching dùng khi khởi tạo lazy collection: thay vì mỗi order chạy 1 câu SELECT items (35 câu = N+1), Hibernate gom ids của các order đang cần load, chia thành lô tối đa 20 id, chạy 2 câu SELECT ... WHERE order_id IN (...) (20 + 15). {{hibernate.default_batch_fetch_size}} áp dụng cho mọi entity/collection không có @BatchSize riêng.

### Vì sao các phương án còn lại sai
- **Chỉ hiệu quả với EAGER**: sai, EAGER đã load items kèm query chính, không còn lazy để batch fetch nữa.
- **Luôn ít câu SQL hơn JOIN FETCH**: sai, JOIN FETCH chỉ 1 câu duy nhất (nhưng gặp vấn đề tích Descartes khi fetch nhiều collection và phải phân trang trong bộ nhớ, mã HHH90003004). Batch fetch chạy nhiều câu IN nhưng an toàn hơn với nhiều collection.

> Senior tip: đặt @BatchSize trên collection lớn được truy cập lẻ lẻ, hoặc đặt hibernate.default_batch_fetch_size = 20–50 cho toàn ứng dụng. Giá trị quá lớn làm câu IN quá dài và tải nhiều dữ liệu thừa vào bộ nhớ.`
},
{
  id: 'qz-jpa-028',
  topic: 'jpa',
  multi: true,
  q: 'Thuộc tính {{spring.jpa.open-in-view}} điều khiển Open Session In View (OSIV). Phát biểu nào đúng? (Chọn 2)',
  options: [
    'Mặc định là true: persistence context mở tới khi view (Thymeleaf/HTML) render xong, nên truy cập lazy field trong template vẫn hoạt động',
    'Đặt false: truy cập lazy field sau khi transaction/controller kết thúc ném {{LazyInitializationException}}',
    'false làm giảm tổng số câu SQL vì Hibernate không thể lazy-load thêm',
    'Khi false, JPA tự động load tất cả lazy field trong transaction để tránh lỗi'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: OSIV giữ session mở trong lúc render view; tắt thì truy cập lazy sau transaction bị lỗi.**

### Vì sao đúng
Mặc định true, Spring gán EntityManager vào luồng request và chỉ đóng sau khi view render xong. Như vậy template Thymeleaf có thể truy cập lazy field (ví dụ {{order.getItems()}}) sau khi controller trả về. Với false, persistence context đóng khi transaction/controller kết thúc, truy cập lazy field sau đó ném {{LazyInitializationException}}.

### Vì sao các phương án còn lại sai
- **false giảm tổng số SQL**: sai, OSIV không có nghĩa là ít query hơn; ngược lại việc lazy-load trong template có thể sinh thêm query không ngờ, và connection DB bị giữ trông suốt quá trình render (nguy cơ cạn pool nếu template chậm).
- **JPA tự load tất cả lazy field**: sai, JPA không biết bạn cần field nào; khi OSIV tắt, bạn phải tự fetch đủ dữ liệu trong service bằng {{JOIN FETCH}}, {{@EntityGraph}} hoặc dùng DTO/projection.

> Senior tip: OSIV bật đơn giản hóa code nhưng làm mờ chi phí truy vấn và giữ connection lâu. Dự án lớn thường tắt (spring.jpa.open-in-view=false), bắt buộc fetching rõ ràng ở service layer, và dùng projection cho màn hình đọc.`
},
{
  id: 'qz-jpa-029',
  topic: 'jpa',
  q: `Entity {{Product}} dùng {{@Cache(usage = CacheConcurrencyStrategy.READ_ONLY)}} và đã bật second-level cache ({{hibernate.cache.use_second_level_cache=true}} plus provider). Hai lần gọi {{em.find(Product.class, id)}} trong hai transaction khác nhau. Điều gì xảy ra lần thứ hai?`,
  options: [
    'Lại chạy SELECT từ DB vì second-level cache chỉ giữ trong một transaction',
    'Có thể đọc từ second-level cache, không query DB, vì cache nằm ở mức SessionFactory chia sẻ các transaction',
    'Ném NonUniqueRequestException vì cùng entity được truy cập hai lần',
    'Chỉ dùng cache nếu hai transaction có cùng isolation level'
  ],
  answer: 1,
  explain: `**Đáp án đúng: lần thứ hai có thể đọc từ second-level cache, không query DB.**

### Vì sao đúng
Hibernate có hai mức cache: level-1 là persistence context (mỗi EntityManager/transaction) và level-2 ở mức SessionFactory, **chia sẻ giữa các transaction**. Lần đầu findProduct sinh SELECT và đưa vào L2. Lần thứ hai (transaction khác) Hibernate kiểm tra L2 trước, nếu có bản READ_ONLY thì trả về luôn, không query DB. READ_ONLY phù hợp dữ liệu tham khảo gần như không đổi, không cần invalidation.

### Vì sao các phương án còn lại sai
- **Chỉ giữ trong một transaction**: đó là level-1, không phải level-2.
- **NonUniqueRequestException**: không phải lỗi hợp lệ trong trường hợp này.
- **Cùng isolation level**: isolation level liên quan đến transaction DB, không ảnh hưởng việc đọc L2.

> Senior tip: L2 không tự biết DB bị sửa bởi ứng dụng khác; dữ liệu thay đổi ngoài Hibernate sẽ làm L2 lỗi thời. Dùng READ_ONLY cho dữ liệu genuinely không đổi, hoặc cấu hình invalidation/TTL; tránh cache dữ liệu thay đổi thường xuyên nếu không có cơ chế đồng bộ.`
},
{
  id: 'qz-db-025',
  topic: 'db',
  multi: true,
  q: `Bảng {{orders}} có index:
~~~sql
CREATE INDEX ON orders (customer_id, created_at);
~~~
Phát biểu nào đúng? (Chọn 2)`,
  options: [
    '{{WHERE customer_id = ? ORDER BY created_at}} có thể quét index và trả về đã theo thứ tự, không cần node Sort',
    '{{WHERE created_at = ?}} có thể dùng index như thể index chỉ có cột created_at',
    '{{WHERE customer_id = ? AND created_at > ?}} dùng được index: bằng trên cột đầu, khoảng trên cột thứ hai',
    'Thứ tự cột trong index không quan trọng, PostgreSQL tự tối ưu lại'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: cột bằng đứng đầu, cột khoảng/sắp xếp đứng sau.**

### Vì sao đúng
B-tree index được sắp xếp theo thứ tự (customer_id, created_at).
- {{WHERE customer_id = ? ORDER BY created_at}}: các hàng cùng customer_id đã nằm liền nhau và theo thứ tự created_at trong index, nên quét index là đủ, không cần Sort.
- {{WHERE customer_id = ? AND created_at > ?}}: bằng trên cột đầu lùi về đúng nhóm customer, rồi khoảng trên cột thứ hai được quét liên tục trong index.

### Vì sao các phương án còn lại sai
- **WHERE created_at = ? dùng index như cột duy nhất**: sai, PostgreSQL không có index skip scan hiệu quả; không có giá trị customer_id thì không thể định vị trong index, thường phải Seq Scan.
- **Thứ tự cột không quan trọng**: sai, nó quyết định index dùng cho điều kiện nào và tránh Sort khi nào. Quy tắc thực dụng: cột dùng phép bằng đứng trước, cột dùng khoảng hoặc ORDER BY đứng sau.

> Senior tip: nếu truy vấn thường xuyên lọc theo created_at duy nhất, hãy tạo index riêng (created_at) hoặc đổi thứ tự index. Xem EXPLAIN để xác nhận có node Sort hay không.`
},
{
  id: 'qz-db-026',
  topic: 'db',
  q: `Bảng {{orders}} có index {{CREATE INDEX ON orders (status)}} (status có nhiều giá trị NULL). Query:
~~~sql
SELECT * FROM orders WHERE status IS NULL;
~~~
PostgreSQL xử lý thế nào?`,
  options: [
    'Không dùng index được vì B-tree không lưu giá trị NULL',
    'Có thể dùng Index Scan vì PostgreSQL B-tree lưu cả mục NULL, điều này khác Oracle',
    'Phải dùng expression index {{CREATE INDEX ON orders (status IS NULL)}}',
    'Chỉ dùng index được khi cột có NOT NULL'
  ],
  answer: 1,
  explain: `**Đáp án đúng: PostgreSQL B-tree lưu mục NULL, nên WHERE status IS NULL có thể dùng Index Scan.**

### Vì sao đúng
Không giống Oracle, PostgreSQL B-tree index chứa các mục NULL. Do đó {{IS NULL}} và {{IS NOT NULL}} đều có thể sử dụng index; ORDER BY cột cũng có thể tránh Sort nhờ thứ tự trong index. Mặc định NULL xếp sau cùng trong ASC (trước cùng trong DESC), nên {{ORDER BY status ASC NULLS FIRST}} sẽ không khớp thứ tự index và phải thêm node Sort (có thể tạo index {{status ASC NULLS FIRST}} để khớp).

### Vì sao các phương án còn lại sai
- **B-tree không lưu NULL**: đúng với Oracle, sai với PostgreSQL.
- **Phải dùng expression index**: không bắt buộc; expression index chỉ cần khi bạn bọc cột trong hàm (ví dụ lower(status)).
- **Chỉ khi NOT NULL**: không bắt buộc; index lưu NULL bình thường.

> Senior tip: nếu cột có rất ít NULL và query hay tìm NULL, partial index {{WHERE status IS NULL}} sẽ nhỏ gọn hơn index đầy đủ. Lưu ý vị trí NULL trong ORDER BY phải khớp với định nghĩa index để tránh Sort.`
},
{
  id: 'qz-db-027',
  topic: 'db',
  q: 'Query join bảng {{orders}} (10 triệu dòng) và {{order_items}} (50 triệu dòng) trên cột {{order_id}}, không có index phù hợp trên order_items. PostgreSQL có thể chọn cách nào và điều gì làm chậm nó?',
  options: [
    'Hash join: xây bảng băm từ bảng nhỏ hơn, quét bảng lớn hơn để tra băm; nếu bảng băm vượt quá {{work_mem}}, PostgreSQL ghi spill ra disk và truy vấn chậm rõ',
    'Nested loop luôn được chọn vì hai bảng đều lớn',
    'Merge join yêu cầu cả hai bảng đã có index trên cột join, nếu không PostgreSQL báo lỗi',
    'PostgreSQL chỉ có nested loop, không hỗ trợ hash join'
  ],
  answer: 0,
  explain: `**Đáp án đúng: hash join, và work_mem quá nhỏ gây spill ra disk làm chậm.**

### Vì sao đúng
PostgreSQL có ba thuật toán join:
- **Nested loop**: lấy từng hàng của bảng ngoài, tìm trong bảng trong bằng index. Hiệu quả khi bảng ngoài nhỏ và bảng trong có index trên cột join.
- **Hash join**: không cần index. Xây bảng băm từ đầu vào nhỏ hơn (hash table trong bộ nhớ), quét đầu vào lớn hơn và tra băm. Giới hạn bộ nhớ là {{work_mem}}; vượt ngưỡng thì ghi spill ra disk, truy vấn chậm mạnh.
- **Merge join**: yêu cầu cả hai đầu vào đã được sắp xếp theo cột join (có thể thêm node Sort nếu chưa có index).

Planner chọn dựa trên thống kê (ANALYZE), chi phí ước tính và work_mem. Hash join spill ra disk là "ngã ngừ" hiệu năng phổ biến trên join bảng lớn.

### Vì sao các phương án còn lại sai
- **Nested loop luôn được chọn**: sai, nested loop dễ chậm trên hai bảng lớn nếu không có index.
- **Merge join yêu cầu index**: sai, yêu cầu dữ liệu đã sắp xếp, có thể sắp xếp tạm, không báo lỗi.
- **Chỉ có nested loop**: sai, PostgreSQL hỗ trợ cả ba thuật toán trên.

> Senior tip: khi join bảng lớn mà chậm, xem EXPLAIN (ANALYZE, BUFFERS) xem planner chọn join nào và có node Sort hay không; cần thiết thì tăng work_mem cho session hoặc thêm index phù hợp cho nested loop.`
},
{
  id: 'qz-db-028',
  topic: 'db',
  q: `Index: {{CREATE INDEX ON orders (created_at ASC)}}. Query:
~~~sql
SELECT * FROM orders ORDER BY created_at ASC NULLS FIRST LIMIT 20;
~~~
PostgreSQL có thể dùng index để tránh Sort không?`,
  options: [
    'Có, B-tree quét ngược/lui đều được nên vị trí NULL không quan trọng',
    'Không: index ASC mặc định trả các giá trị NULL sau cùng (NULLS LAST), conflict với NULLS FIRST, nên PostgreSQL thêm node Sort',
    'Có, nhưng chỉ khi cột declared NOT NULL',
    'Phải tạo index {{created_at DESC}} mới dùng được'
  ],
  answer: 1,
  explain: `**Đáp án đúng: không khớp vị trí NULL nên PostgreSQL phải thêm node Sort.**

### Vì sao đúng
Quy ước mặc định của PostgreSQL: index ASC quét về phía trước trả hàng NULL sau cùng (NULLS LAST); index ASC quét ngược (DESC) trả NULL trước cùng. Query yêu cầu {{NULLS FIRST}} nhưng index ASC mặc định là {{NULLS LAST}}, thứ tự không khớp, nên planner không dùng index để sắp xếp và thêm node Sort. Cách khắc phục: tạo index khớp đúng, ví dụ {{CREATE INDEX ON orders (created_at ASC NULLS FIRST)}}. Luôn kiểm tra bằng EXPLAIN xem có node Sort hay không.

### Vì sao các phương án còn lại sai
- **Quét ngược/lui đều được**: sai, vị trí NULL trong kết quả sắp xếp phải khớp với index.
- **Chỉ khi NOT NULL**: NOT NULL giúp nhưng planner không tự giả sử cột không NULL trừ khi có ràng buộc.
- **Phải tạo DESC**: không đủ; vấn đề là vị trí NULL, không phải hướng ASC/DESC đơn thuần.

> Senior tip: khi dùng ORDER BY ... NULLS FIRST/LAST, hãy xem EXPLAIN. Nếu thấy Sort chỉ do vị trí NULL, tạo index với định dạng NULLS tương ứng.`
},
{
  id: 'qz-db-029',
  topic: 'db',
  q: `EXPLAIN ANALYZE query trên bảng {{orders}}:
~~~text
Index Scan using idx_orders_status on orders
  Index Cond: (status = 'NEW')
  Filter: (created_at > '2026-01-01')
~~~
Mệnh đề {{Filter}} có tác dụng gì?`,
  options: [
    'Lọc các hàng đã lấy từ heap; nó không làm giảm số trang index phải quét',
    'Gộp nhiều phạm vi index thành một quét liên tục',
    'Thay thế Index Cond khi index không đủ chọn lọc',
    'Chỉ được hiển thị khi dùng Index Only Scan'
  ],
  answer: 0,
  explain: `**Đáp án đúng: Filter lọc hàng đã lấy từ heap, không giảm số trang index phải quét.**

### Vì sao đúng
- **Index Cond**: điều kiện được dùng bên trong quét index để thu hẹp các mục index cần thăm (ở đây chỉ quét mục status = 'NEW').
- **Filter**: điều kiện áp dụng lên từng hàng (tuple) sau khi lấy từ heap (bảng chính). Nó không làm giảm số trang index phải đọc; nếu rất nhiều mục khớp Index Cond nhưng lại bị Filter loại bỏ, truy vấn vẫn đọc nhiều heap page và chậm.

Cách cải thiện: chỉ số composite (status, created_at) hoặc INCLUDE (created_at) để điều kiện created_at cũng thu hẹp quét index, hoặc dùng Index Only Scan nếu mọi cột cần nằm trong index và visibility map đã cập nhật.

### Vì sao các phương án còn lại sai
- **Gộp phạm vi index**: không phải vai trò của Filter.
- **Thay thế Index Cond**: hai mệnh đề cùng tồn tại, mỗi một vai trò khác nhau.
- **Chỉ hiển thị với Index Only Scan**: Filter xuất hiện trên Index Scan thông thường lẫn Index Only Scan.

> Senior tip: đọc EXPLAIN (ANALYZE, BUFFERS): Shared Hit là đọc từ bộ nhớ đệm, Shared Read là đọc từ disk. Nếu Filter loại bỏ phần lớn hàng sau Index Cond, hãy xem xét chỉ số phù hợp hơn thay vì hy vọng index hiện tại cứu được truy vấn.`
},
{
  id: 'qz-api-026',
  topic: 'api',
  q: 'Ứng dụng bán vé cần cho khách hủy một đơn hàng. Việc hủy có thể bị từ chối nếu vé đã phát hành, đồng thời hệ thống cần lưu thời điểm và lý do hủy. Thiết kế endpoint nào phù hợp nhất?',
  options: [
    'Dùng {{GET /orders/{id}/cancel}} để hủy và trả về đơn hàng đã đổi trạng thái',
    'Dùng {{POST /orders/{id}/cancellations}} để gửi yêu cầu hủy, kiểm tra quy tắc nghiệp vụ rồi trả kết quả',
    'Dùng {{DELETE /orders/{id}}} trong mọi trường hợp, vì hủy đơn luôn đồng nghĩa xóa dữ liệu',
    'Dùng {{GET /orders/{id}}?cancel=true}} để giữ URL đọc đơn hàng hiện có'
  ],
  answer: 1,
  explain: `**Đáp án đúng: POST /orders/{id}/cancellations.** Đây là lệnh làm thay đổi trạng thái và tạo thông tin nghiệp vụ mới là yêu cầu hủy; nó không phải thao tác đọc đơn hàng hay xóa dấu vết đơn đã mua.

### Vì sao đúng
Endpoint con {{cancellations}} mô hình hóa một tài nguyên/yêu cầu hủy. Server có thể kiểm tra đơn thuộc ai, vé đã phát hành chưa, lưu lý do và thời điểm, rồi trả {{201 Created}} nếu đã tạo yêu cầu hủy hoặc mã lỗi nghiệp vụ phù hợp nếu không thể hủy. Tên route thể hiện tài nguyên; không có quy tắc REST bắt mọi thao tác phải là CRUD thuần.

### Vì sao các phương án còn lại sai
- **GET có tác dụng hủy**: GET được xem là safe, nghĩa là client có thể gọi để đọc mà không gây thay đổi nghiệp vụ. Trình duyệt, proxy hoặc crawler có thể tự gửi lại GET; không dùng nó cho lệnh ghi.
- **DELETE đơn hàng**: DELETE có thể phù hợp nếu hợp đồng thật sự xóa tài nguyên, nhưng đơn hàng thường cần lưu cho kế toán và kiểm toán. Hủy là đổi trạng thái, không nhất thiết xóa đơn.
- **Query cancel=true trên GET**: vẫn là GET có side effect; query parameter không biến thao tác đọc thành thao tác ghi.

> Senior tip: thiết kế endpoint theo kết quả nghiệp vụ cần lưu, không cố ép mọi hành động thành động từ trong URL. Kiểm tra quyền sở hữu và trạng thái đơn trong cùng luồng xử lý để tránh hai request hủy đồng thời cùng tạo hai bản ghi.`
},
{
  id: 'qz-api-027',
  topic: 'api',
  q: 'API tạo báo cáo mất khoảng 40 giây vì phải đọc nhiều dữ liệu. Client gửi yêu cầu, server đã nhận việc nhưng chưa có kết quả. Phản hồi HTTP nào phù hợp nhất để client không phải giữ kết nối chờ?',
  options: [
    '200 OK kèm file báo cáo rỗng để giữ đúng kiểu response',
    '201 Created chỉ vì server đã nhận một HTTP request',
    '202 Accepted, kèm cách tra cứu trạng thái xử lý như URI của job',
    '204 No Content để báo rằng báo cáo đã tạo xong nhưng không cần nội dung'
  ],
  answer: 2,
  explain: `**Đáp án đúng: 202 Accepted kèm địa chỉ tra cứu job.** Mã này nói server đã chấp nhận xử lý nhưng công việc chưa hoàn tất; nó không hứa rằng công việc chắc chắn thành công.

### Vì sao đúng
Server có thể trả {{202}} cùng {{Location: /report-jobs/abc}} và trạng thái ban đầu {{PENDING}}. Client gọi GET địa chỉ đó để xem {{PENDING}}, {{SUCCEEDED}} hoặc {{FAILED}}, rồi tải kết quả khi sẵn sàng. Cách này giải phóng kết nối HTTP ban đầu, nhưng vẫn cho client một cơ chế theo dõi.

### Vì sao các phương án còn lại sai
- **200 với file rỗng**: 200 thường biểu thị request đã được xử lý thành công; file rỗng làm client không phân biệt báo cáo thật với placeholder.
- **201 chỉ vì nhận request**: 201 nói một tài nguyên mới đã được tạo. Nếu API tạo tài nguyên job ngay, 201 có thể hợp lệ với URI job; nhưng mô tả chỉ khẳng định công việc được nhận, nên 202 là ý nghĩa chính xác hơn.
- **204 báo đã xong**: 204 biểu thị xử lý thành công không có response body; nó không thể diễn tả trạng thái đang chạy.

> Senior tip: job bất đồng bộ nên có timeout, trạng thái lỗi có thể đọc được và chính sách giữ kết quả. Đừng để client retry POST tạo báo cáo khi timeout mà không có cơ chế chống tạo job trùng.`
},
{
  id: 'qz-api-028',
  topic: 'api',
  q: 'Mobile app chỉ muốn đổi số điện thoại của khách hàng. Khi gửi request, các trường khác như tên và địa chỉ không có trong body và phải được giữ nguyên. Thiết kế nào đúng nhất?',
  options: [
    'Dùng PUT với body chỉ có số điện thoại; server tự hiểu các trường thiếu là giữ nguyên',
    'Dùng PATCH để cập nhật riêng số điện thoại, với quy tắc rõ ràng cho trường bị bỏ qua',
    'Dùng GET rồi ghi số điện thoại vào query string để tránh gửi body',
    'Dùng POST tạo khách hàng mới có cùng ID rồi hy vọng DB thay bản ghi cũ'
  ],
  answer: 1,
  explain: `**Đáp án đúng: PATCH với quy tắc cập nhật từng phần được mô tả rõ.** PATCH biểu diễn thay đổi trên một tài nguyên; trường không được gửi có thể được giữ nguyên theo định dạng patch mà API chọn.

### Vì sao đúng
Client gửi {{PATCH /customers/42}} với phần thay đổi số điện thoại. Server xác thực người dùng, kiểm tra dữ liệu, chỉ cập nhật trường được nêu và trả representation mới hoặc 204. Hợp đồng phải nói rõ cách biểu diễn giá trị null: trong JSON Merge Patch, null thường có nghĩa xóa trường, còn trường bị bỏ qua nghĩa là không đổi.

### Vì sao các phương án còn lại sai
- **PUT với body một trường**: PUT thường biểu diễn thay thế toàn bộ trạng thái của tài nguyên. Body thiếu tên và địa chỉ có thể khiến chúng bị xóa hoặc đặt mặc định; không nên dựa vào một quy ước ngầm trái với ý nghĩa thay thế.
- **GET ghi query**: GET là safe và query string thường xuất hiện trong log, lịch sử trình duyệt hoặc cache. Nó không thích hợp cho thay đổi dữ liệu cá nhân.
- **POST tạo cùng ID**: POST thường tạo hoặc xử lý tài nguyên theo contract riêng; ghi đè ngầm gây xung đột và có thể tạo bản ghi trùng.

> Senior tip: PUT có thể được retry an toàn về ngữ nghĩa khi cùng một representation được gửi lại; PATCH không mặc nhiên idempotent vì mọi thứ phụ thuộc patch document. Thiết kế retry dựa trên contract cụ thể, không chỉ dựa vào tên method.`
},
{
  id: 'qz-api-029',
  topic: 'api',
  q: 'Một endpoint danh sách cho phép {{GET /events?size=5000000}}. Sau khi một client gửi giá trị này, heap và thời gian truy vấn tăng vọt. Cách sửa nào xử lý đúng ở phía API?',
  options: [
    'Áp giới hạn size tối đa ở server, ví dụ 100, và trả lỗi validation rõ ràng hoặc giới hạn theo contract',
    'Tin client sẽ tự gửi size nhỏ hơn sau khi nhận cảnh báo trong tài liệu',
    'Tăng heap cho mọi instance để request lớn luôn thành công',
    'Cho phép mọi kích thước nhưng chỉ trả 100 phần tử mà không nói cho client biết'
  ],
  answer: 0,
  explain: `**Đáp án đúng: áp mức tối đa ở server và công bố hành vi đó trong contract.** Client không đáng tin để bảo vệ tài nguyên của server; giới hạn phải được thực thi tại nơi xử lý request.

### Vì sao đúng
Server đặt mặc định hợp lý và giới hạn trên, chẳng hạn {{size <= 100}}. Giá trị vượt mức có thể bị từ chối bằng lỗi validation, hoặc bị clamp xuống 100 nếu API công bố rõ cách làm. Trong Spring, cấu hình bộ phân giải {{Pageable}} để có maximum page size; chỉ đặt {{@PageableDefault}} là đặt giá trị mặc định, không phải giới hạn tối đa.

### Vì sao các phương án còn lại sai
- **Chỉ cảnh báo client**: client cũ, lỗi lập trình hoặc người dùng độc hại vẫn gửi giá trị lớn; tài liệu không phải biện pháp bảo vệ tài nguyên.
- **Chỉ tăng heap**: mỗi request vẫn có thể cấp phát rất nhiều object và tạo áp lực lên GC, database, rồi làm ảnh hưởng mọi request khác.
- **Trả 100 nhưng không nói**: server che giấu việc đã áp giới hạn nên client có thể tưởng dữ liệu đầy đủ; hành vi mơ hồ khó phân trang và khó debug.

> Senior tip: giới hạn số dòng chưa đủ nếu mỗi dòng chứa payload lớn hoặc query không có index. Theo dõi độ trễ theo kích thước trang và đặt giới hạn dựa trên tải DB thực tế.`
},
{
  id: 'qz-api-030',
  topic: 'api',
  q: 'Hai team cùng sửa API: team server đổi schema response còn team Android dùng OpenAPI để sinh client. Lỗi chỉ bị phát hiện sau khi deploy vì mô tả API đã cũ. Quy trình nào giúp chặn vấn đề sớm nhất?',
  options: [
    'Chỉ dựa vào Swagger UI; nếu trang mở được thì response thực tế chắc chắn khớp',
    'Tắt kiểm tra schema để các team triển khai độc lập',
    'Cập nhật OpenAPI như hợp đồng có version và chạy kiểm tra tương thích trong CI cùng contract test',
    'Sinh lại client Android sau mỗi lần deploy production, không cần review thay đổi'
  ],
  answer: 2,
  explain: `**Đáp án đúng: quản lý OpenAPI như hợp đồng có version, kiểm tra thay đổi trong CI và xác minh hành vi bằng contract test.** OpenAPI mô tả đường dẫn, method, schema, status code và bảo mật; nó giúp các team thống nhất trước khi tích hợp.

### Vì sao đúng
CI có thể so sánh spec mới với spec đã phát hành để phát hiện thay đổi có nguy cơ phá client, chẳng hạn xóa field bắt buộc. Contract test tiếp tục kiểm tra server thật có trả đúng schema và status đã hứa hay không. Client được sinh từ spec mới chỉ đáng tin khi spec và runtime đồng bộ.

### Vì sao các phương án còn lại sai
- **Swagger UI mở được**: trang có thể render spec hợp lệ nhưng spec vẫn sai hoặc đã cũ; UI không tự đối chiếu mọi response production.
- **Tắt kiểm tra**: giúp thay đổi lọt qua nhanh hơn chứ không giảm rủi ro; lỗi được chuyển sang người dùng.
- **Sinh client sau deploy**: client mới có thể phản ánh thay đổi, nhưng client đã phát hành vẫn có thể hỏng; kiểm tra quá muộn để bảo vệ họ.

> Senior tip: gắn spec với artifact build và phát hành cùng phiên bản service. Kiểm tra schema bổ sung rất hữu ích, nhưng vẫn cần test các quy tắc nghiệp vụ mà OpenAPI không thể biểu diễn đầy đủ.`
},
{
  id: 'qz-api-031',
  topic: 'api',
  q: 'Hai nhân viên cùng mở hồ sơ phiên bản 7. Người thứ nhất lưu thành phiên bản 8; vài giây sau người thứ hai ghi dữ liệu cũ lên và vô tình xóa thay đổi mới. API nên dùng cơ chế HTTP nào để phát hiện lần ghi cũ?',
  options: [
    'Trả 429 Too Many Requests cho lần ghi thứ hai',
    'Dùng ETag phiên bản hiện tại và yêu cầu client gửi If-Match khi cập nhật; trả 412 nếu giá trị không còn khớp',
    'Luôn trả 200 rồi ghi đè, vì server không thể biết dữ liệu nào mới hơn',
    'Dùng Retry-After để client thử lại cùng payload cũ'
  ],
  answer: 1,
  explain: `**Đáp án đúng: ETag kết hợp If-Match; nếu điều kiện không còn đúng thì trả 412 Precondition Failed.** Đây là optimistic concurrency, tức phát hiện xung đột khi ghi mà không khóa hồ sơ trong suốt thời gian người dùng chỉnh sửa.

### Vì sao đúng
GET trả {{ETag: "v7"}}. Khi lưu, client gửi {{If-Match: "v7"}}. Server chỉ cập nhật nếu phiên bản hiện tại vẫn là v7; nếu đã thành v8, điều kiện sai nên trả 412 và client tải lại để hợp nhất thay đổi. Phần so sánh và ghi cần nguyên tử ở DB, thường bằng câu lệnh cập nhật có điều kiện trên version.

### Vì sao các phương án còn lại sai
- **429**: dùng cho vượt giới hạn request, không phải xung đột phiên bản.
- **Ghi đè và trả 200**: đây chính là hành vi gây mất cập nhật; mã thành công che giấu xung đột.
- **Retry-After**: chỉ gợi ý thời gian chờ trước khi retry, không làm payload cũ trở nên mới hoặc giải quyết xung đột dữ liệu.

> Senior tip: 412 phù hợp khi một HTTP precondition như If-Match thất bại; 409 thường dùng cho xung đột trạng thái nghiệp vụ không biểu diễn bằng precondition. Đừng tự động retry lần ghi bị xung đột mà chưa hợp nhất dữ liệu.`
},
{
  id: 'qz-api-032',
  topic: 'api',
  q: 'Một client gửi {{Accept: application/xml}} tới endpoint chỉ tạo được response JSON. Body request là JSON hợp lệ và Content-Type cũng đúng. Mã trạng thái nào diễn tả đúng việc server không thể cung cấp định dạng client yêu cầu?',
  options: [
    '406 Not Acceptable',
    '415 Unsupported Media Type',
    '413 Content Too Large',
    '401 Unauthorized'
  ],
  answer: 0,
  explain: `**Đáp án đúng: 406 Not Acceptable.** Header Accept nói client muốn nhận định dạng nào; server không có representation phù hợp để trả theo yêu cầu này.

### Vì sao đúng
Trong tình huống này request body là JSON hợp lệ và {{Content-Type}} mô tả đúng body. Không khớp nằm ở định dạng response được chỉ định bằng {{Accept: application/xml}}. API JSON-only có thể trả 406 và giải thích các media type được hỗ trợ, hoặc bỏ qua Accept chỉ khi contract của API quy định như vậy.

### Vì sao các phương án còn lại sai
- **415**: liên quan định dạng nội dung client gửi lên, tức Content-Type, không phải định dạng client muốn nhận.
- **413**: dùng khi nội dung request vượt giới hạn kích thước; đề bài không có payload quá lớn.
- **401**: chỉ ra client chưa xác thực hợp lệ; không liên quan khả năng thương lượng định dạng.

> Senior tip: viết test riêng cho Accept và Content-Type. Các gateway đôi khi gom lỗi content negotiation thành 400, khiến client sửa nhầm body trong khi vấn đề thật là định dạng response.`
},
{
  id: 'qz-api-033',
  topic: 'api',
  q: 'Web app gọi API từ origin khác. Sau khi thêm header Authorization, trình duyệt gửi OPTIONS trước request thật rồi báo lỗi CORS vì header này không được cho phép. Cách xử lý nào đúng?',
  options: [
    'Cho phép mọi origin, mọi header và credentials=true để tránh lỗi trên tất cả môi trường',
    'Tắt kiểm tra xác thực cho API vì request OPTIONS không có token',
    'Cấu hình CORS cho origin tin cậy, method và header cần thiết; xử lý preflight OPTIONS mà không coi đó là request nghiệp vụ',
    'Bắt frontend gửi token trong query string thay cho Authorization'
  ],
  answer: 2,
  explain: `**Đáp án đúng: cấu hình CORS có giới hạn và cho phép preflight OPTIONS.** CORS là cơ chế của trình duyệt kiểm soát trang web origin nào được đọc response; nó không thay thế xác thực hay phân quyền API.

### Vì sao đúng
Với một số request cross-origin, browser gửi preflight OPTIONS trước, nêu method và header dự định dùng. Server cần trả các Access-Control-Allow-* phù hợp, trong đó cho phép Authorization nếu cần. Trong Spring Boot, cấu hình CORS tại lớp MVC/Security theo origin, method và header cụ thể; OPTIONS không được xử lý như lệnh tạo hay sửa dữ liệu.

### Vì sao các phương án còn lại sai
- **Mở mọi thứ kèm credentials**: wildcard origin không hợp lệ khi cho phép credentials theo chuẩn browser, và mở rộng như vậy làm tăng bề mặt truy cập.
- **Tắt xác thực API**: preflight không mang token như request thật trong nhiều tình huống, nhưng điều đó không phải lý do bỏ bảo vệ endpoint nghiệp vụ.
- **Đưa token vào URL**: URL thường bị ghi vào log, lịch sử và hệ thống phân tích; đổi vị trí token không giải quyết cấu hình CORS đúng cách.

> Senior tip: CORS chủ yếu bảo vệ trình duyệt, không ngăn curl hay server khác gọi API. Luôn giữ authentication và authorization trên request thật, kể cả khi CORS đã cấu hình đúng.`
},
{
  id: 'qz-api-034',
  topic: 'api',
  q: 'API {{GET /invoices/123}} nhận thêm {{ownerId}} từ query string. Người dùng đổi ownerId sang tài khoản khác và đọc được hóa đơn của người đó. Cách sửa cốt lõi nào ngăn lỗi này?',
  options: [
    'Chỉ dựa vào ownerId do client gửi vì client đã đăng nhập',
    'Ẩn invoice ID bằng UUID dài hơn để người dùng không đoán được',
    'Kiểm tra quyền ở giao diện rồi vẫn trả dữ liệu đầy đủ từ API',
    'Lấy danh tính từ principal đã xác thực và kiểm tra quyền sở hữu hoặc quyền truy cập trên từng hóa đơn ở server'
  ],
  answer: 3,
  explain: `**Đáp án đúng: quyết định quyền truy cập ở server dựa trên principal đã xác thực và tài nguyên cụ thể.** Đây là kiểm soát truy cập ở cấp đối tượng: không chỉ hỏi người gọi là ai mà còn hỏi họ có quyền với hóa đơn này không.

### Vì sao đúng
Token sau khi xác thực cung cấp principal đáng tin cậy. Server truy vấn hóa đơn theo cả ID lẫn phạm vi quyền, ví dụ {{findByIdAndOwnerId(invoiceId, principalId)}}, hoặc kiểm tra quan hệ quyền trước khi trả dữ liệu. Quy tắc này phải áp dụng cho từng thao tác đọc, sửa và xóa, không chỉ ở màn hình frontend.

### Vì sao các phương án còn lại sai
- **Tin ownerId từ query**: người dùng kiểm soát query string nên có thể thay nó; đã đăng nhập không chứng minh họ sở hữu mọi tài khoản.
- **UUID khó đoán**: giảm khả năng đoán ID nhưng không phải kiểm soát quyền. ID bị lộ qua log, link hoặc email vẫn có thể bị dùng.
- **Chỉ kiểm tra giao diện**: người dùng có thể gọi API trực tiếp và bỏ qua UI; server vẫn đang tiết lộ dữ liệu.

> Senior tip: thống nhất phản hồi 403 hoặc 404 theo chính sách che giấu sự tồn tại của tài nguyên, nhưng luôn giữ kiểm tra quyền ở backend. Viết test với hai principal và cùng một invoice ID để bắt lỗi truy cập chéo.`
},
{
  id: 'qz-api-035',
  topic: 'api',
  multi: true,
  q: 'API có nhiều client cũ đang chạy. Nếu chỉ xét các thay đổi thông thường ít có nguy cơ phá client hơn, thay đổi nào phù hợp? (Chọn 2)',
  options: [
    'Thêm một field response không bắt buộc, không làm đổi ý nghĩa các field hiện có',
    'Đổi tên field {{customerName}} thành {{name}} và ngừng trả field cũ',
    'Thêm một endpoint mới mà client cũ không cần gọi',
    'Đổi kiểu {{amount}} từ số nguyên sang chuỗi có đơn vị tiền tệ'
  ],
  answer: [0, 2],
  explain: `**Đáp án đúng: thêm field response tùy chọn và thêm endpoint mới độc lập.** Hai thay đổi này thường giữ nguyên hợp đồng mà client cũ đang dùng, miễn là client xử lý JSON theo cách tương thích.

### Vì sao đúng
- **Field response tùy chọn**: client cũ thường tiếp tục đọc các field quen thuộc và bỏ qua field lạ. Field mới không được biến thành bắt buộc trong request hoặc làm thay đổi ý nghĩa dữ liệu cũ.
- **Endpoint mới**: client cũ không gọi đường dẫn mới nên hành vi hiện tại không đổi; client mới có thể dùng chức năng bổ sung.

### Vì sao các phương án còn lại sai
- **Đổi tên và xóa field**: client cũ còn đọc {{customerName}} sẽ nhận thiếu dữ liệu hoặc lỗi nếu field là bắt buộc. Nên thêm field mới, chạy song song một thời gian rồi mới deprecate field cũ.
- **Đổi kiểu amount**: JSON number và string là hai kiểu khác nhau. Client sinh từ schema hoặc parser nghiêm ngặt có thể không deserialize được; thêm đơn vị vào chuỗi còn trộn dữ liệu với cách trình bày.

> Senior tip: additive không đồng nghĩa luôn an toàn: một số client từ chối field không biết hoặc có switch exhaustive trên enum. Kiểm tra tập client thật và contract test trước thay đổi có ảnh hưởng rộng.`
},
{
  id: 'qz-api-036',
  topic: 'api',
  multi: true,
  q: 'Team muốn OpenAPI thực sự giúp frontend tích hợp endpoint thanh toán mới, thay vì chỉ tạo tài liệu nhìn đẹp. Hai việc nào nên làm? (Chọn 2)',
  options: [
    'Khai báo schema request/response, field required, status code lỗi và cơ chế bảo mật đúng với hành vi thật',
    'Ghi mật khẩu production vào ví dụ để frontend có thể thử gọi API ngay',
    'Coi việc sinh OpenAPI thành công là bằng chứng runtime đã validate mọi request',
    'Dùng spec trong CI để sinh tài liệu/client hoặc kiểm tra hợp đồng và đối chiếu với response thực tế'
  ],
  answer: [0, 3],
  explain: `**Đáp án đúng: mô tả hợp đồng chính xác và dùng spec trong quy trình tích hợp/kiểm tra.** OpenAPI hữu ích khi các trường, kiểu dữ liệu, status code và yêu cầu xác thực phản ánh đúng những gì service thật làm.

### Vì sao đúng
- **Khai báo schema và lỗi**: frontend biết field nào bắt buộc, response nào có thể nhận và cách xác thực. Mô tả security scheme giúp công cụ hiển thị đúng cách gửi credential mà không cần lộ bí mật.
- **Dùng spec trong CI**: có thể sinh tài liệu/client, kiểm tra diff tương thích và chạy contract test giữa client với server. Cần xác minh runtime vì spec chỉ là mô tả nếu không được nối với kiểm thử.

### Vì sao các phương án còn lại sai
- **Đưa mật khẩu production vào ví dụ**: bí mật có thể bị lộ qua repository, tài liệu, log hoặc client. Ví dụ nên dùng dữ liệu giả và hướng dẫn lấy token an toàn.
- **Sinh spec thành công đồng nghĩa runtime đúng**: công cụ có thể sinh tài liệu từ mô tả sai; việc compile spec không chứng minh controller trả đúng status hay schema.

> Senior tip: ví dụ request/response nên đủ thực tế để frontend dùng, nhưng không chứa thông tin cá nhân hay credential. Hãy xem spec như API công khai có version, không phải file phụ để sinh Swagger UI.`
},
{
  id: 'qz-api-037',
  topic: 'api',
  multi: true,
  q: 'Công ty chuẩn bị ngừng API v1 nhưng chưa biết còn bao nhiêu client đang dùng. Những bước nào giúp chuyển client sang v2 an toàn hơn? (Chọn 2)',
  options: [
    'Tắt v1 ngay khi v2 deploy để buộc mọi client cập nhật cùng lúc',
    'Vận hành v1 và v2 song song trong giai đoạn chuyển đổi, đồng thời đo traffic theo client/endpoint',
    'Giữ nguyên v1 mãi mãi nhưng không thông báo lịch hỗ trợ hoặc chi phí vận hành',
    'Thông báo kế hoạch ngừng hỗ trợ và thời điểm dự kiến bằng tài liệu cùng header deprecation/sunset phù hợp'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: duy trì hai phiên bản trong giai đoạn chuyển đổi, đo mức sử dụng và thông báo kế hoạch ngừng v1 rõ ràng.** Việc chuyển đổi là quá trình phối hợp với chủ sở hữu client, không chỉ là đổi route trên server.

### Vì sao đúng
- **Chạy song song và đo traffic**: server có thể tiếp tục phục vụ client cũ trong khi dashboard/log cho biết ai còn gọi v1. Dữ liệu thực tế giúp liên hệ đúng team và đánh giá mức sẵn sàng.
- **Thông báo deprecation/sunset**: tài liệu và header như {{Deprecation}} hoặc {{Sunset}} có thể chỉ ra trạng thái và thời điểm dự kiến. Client cần đủ thời gian nâng cấp và kiểm thử.

### Vì sao các phương án còn lại sai
- **Tắt ngay**: client cũ có thể lỗi production trước khi chủ sở hữu biết hoặc có thời gian triển khai v2.
- **Giữ mãi không kế hoạch**: tránh sự cố trước mắt nhưng làm tăng chi phí bảo trì và khiến cam kết hỗ trợ không rõ ràng; nó không phải chiến lược chuyển đổi.

> Senior tip: ngừng phiên bản chỉ khi metrics cho thấy traffic đã về 0 hoặc có ngoại lệ được phê duyệt. Header thông báo không tự di chuyển client; cần liên hệ trực tiếp với đối tác quan trọng và có ngày rollback.`
},
{
  id: 'qz-api-038',
  topic: 'api',
  multi: true,
  q: 'API chạy trên 8 pod sau load balancer, giới hạn mỗi API key là 100 request/phút. Khi bộ đếm đặt trong bộ nhớ từng pod, một client có thể vượt quota. Hai thay đổi nào khắc phục đúng vấn đề thiết kế? (Chọn 2)',
  options: [
    'Dùng bộ đếm cục bộ trên mỗi pod nhưng đặt quota 100 cho từng pod',
    'Dùng kho dùng chung như Redis với thao tác tăng/kiểm tra quota nguyên tử giữa các pod',
    'Dùng khóa rate limit có phạm vi đúng, chẳng hạn API key và cửa sổ thời gian, thay vì một bộ đếm chung cho mọi client',
    'Bật sticky session để client luôn về một pod và không cần giới hạn trong kho dùng chung'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: chia sẻ bộ đếm có cập nhật nguyên tử và định danh quota theo client/cửa sổ phù hợp.** Bộ nhớ của một pod không được chia sẻ với các pod khác, nên mỗi instance tự cho phép quota riêng.

### Vì sao đúng
- **Kho dùng chung và nguyên tử**: Redis hoặc một kho tương đương cho mọi pod cùng nhìn thấy trạng thái. Tăng bộ đếm và quyết định cho phép phải là một thao tác nguyên tử, thường dùng script/primitive phù hợp, để hai request đồng thời không cùng vượt giới hạn.
- **Key theo API key và cửa sổ**: mỗi client có quota riêng. Cửa sổ có thể là fixed, sliding hoặc token bucket; chọn theo yêu cầu burst và độ chính xác, đồng thời đặt TTL để dọn dữ liệu cũ.

### Vì sao các phương án còn lại sai
- **Quota cục bộ 100 mỗi pod**: request phân tán qua 8 pod có thể đạt gần 800 mỗi phút, không phải 100.
- **Sticky session**: load balancer có thể đổi pod khi deploy hoặc lỗi; nếu client đổi đường đi, bộ đếm khác lại cho thêm quota. Nó cũng làm giảm khả năng cân bằng tải.

> Senior tip: xác định trước hành vi khi Redis lỗi: fail-open bảo vệ tính sẵn sàng nhưng có thể vượt quota, fail-closed bảo vệ quota nhưng chặn request hợp lệ. Ghi rõ lựa chọn theo mức độ nhạy cảm của API.`
},
{
  id: 'qz-api-039',
  topic: 'api',
  multi: true,
  q: 'Client gọi {{POST /payments}} với Idempotency-Key khi mạng timeout rồi gửi lại request. Có thể hai request đến đồng thời. Những biện pháp nào cần có để tránh thu tiền hai lần một cách đáng tin cậy? (Chọn 2)',
  options: [
    'Chỉ lưu key sau khi charge hoàn tất; nếu hai request chạy cùng lúc thì cả hai vẫn có thể charge trước khi lưu',
    'Ràng buộc duy nhất key trong phạm vi phù hợp và claim key nguyên tử trước khi thực hiện nghiệp vụ',
    'Nếu key trùng thì luôn trả 200, kể cả request mới gửi payload khác với request ban đầu',
    'Gắn key với fingerprint của request; cùng key nhưng nội dung khác bị từ chối, còn request lặp cùng nội dung nhận lại kết quả đã lưu'
  ],
  answer: [1, 3],
  explain: `**Đáp án đúng: claim key nguyên tử và gắn key với nội dung request để phát hiện dùng lại sai.** Chỉ kiểm tra key bằng thao tác đọc rồi mới ghi là không đủ nếu hai request chạy đồng thời.

### Vì sao đúng
- **Ràng buộc duy nhất và claim nguyên tử**: unique constraint trong DB hoặc thao tác atomic ở kho key chọn ra đúng một request thắng. Request còn lại chờ kết quả hoặc nhận trạng thái đang xử lý thay vì thực hiện charge lần nữa.
- **Fingerprint và lưu kết quả**: server so sánh nội dung quan trọng như account, amount, currency. Cùng key/cùng request có thể nhận lại response đã lưu; cùng key nhưng payload khác phải bị từ chối, thường bằng 409.

### Vì sao các phương án còn lại sai
- **Chỉ ghi key sau charge**: hai request đồng thời đều có thể thấy chưa có key và cùng gọi payment provider trước lúc một request lưu key.
- **Trả 200 cho payload khác**: client có thể tưởng khoản tiền mới đã được xử lý, trong khi server trả kết quả của request cũ; điều này che giấu lỗi nghiêm trọng.

> Senior tip: thiết kế trạng thái key như IN_PROGRESS, SUCCEEDED và FAILED, có thời hạn lưu phù hợp. Nếu payment provider cũng hỗ trợ idempotency, truyền cùng một định danh xuyên suốt để giảm rủi ro khi service timeout giữa các bước.`
},
{
  id: 'qz-api-040',
  topic: 'api',
  q: 'Một client gọi {{GET /products?category=rare}}. Không có sản phẩm nào thuộc danh mục đó, nhưng bộ lọc hợp lệ và endpoint danh sách hoạt động bình thường. Response nào hợp lý nhất?',
  options: [
    '404 Not Found vì kết quả truy vấn có zero phần tử',
    '200 OK với danh sách rỗng và metadata phân trang nhất quán',
    '204 No Content trong mọi trường hợp danh sách không có phần tử',
    '500 Internal Server Error vì server không tìm thấy dữ liệu'
  ],
  answer: 1,
  explain: `**Đáp án đúng: 200 OK với collection rỗng.** Tài nguyên collection đã tồn tại và truy vấn hợp lệ; kết quả không có phần tử không có nghĩa endpoint hoặc collection bị mất.

### Vì sao đúng
Response có thể là {{200}} với {{items: []}}, {{page: 0}} và metadata nhất quán theo hợp đồng. Client vẫn nhận được cấu trúc mong đợi và có thể hiển thị trạng thái không có sản phẩm. Nếu API không trả metadata, body là mảng rỗng cũng phù hợp.

### Vì sao các phương án còn lại sai
- **404 vì zero kết quả**: 404 phù hợp hơn khi client yêu cầu một tài nguyên riêng không tồn tại, ví dụ {{GET /products/42}}. Nó không cần biểu thị collection filter rỗng.
- **204 cho mọi danh sách rỗng**: 204 không có body, nên client không thể nhận mảng rỗng hay metadata. Dùng nó chỉ khi contract chủ động chọn response không body.
- **500**: 500 là lỗi xử lý ngoài dự kiến phía server; không có kết quả phù hợp là trạng thái hợp lệ của truy vấn.

> Senior tip: thống nhất response cho danh sách rỗng và tài nguyên đơn không tồn tại. Sự nhất quán giúp frontend tránh phải đoán liệu 404 là dữ liệu rỗng hay lỗi route.`
},
{
  id: 'qz-jpa-030',
  topic: 'jpa',
  q: `Endpoint danh sách trả về 200 order. Log cho thấy 1 câu lấy order rồi 200 câu SELECT vào bảng order_item. Code repository và entity như sau (mặc định của JPA):
~~~java
@Entity
class Order {
    @Id Long id;
    @OneToMany(mappedBy = "order")
    List<OrderItem> items;   // không khai báo fetch
}
~~~`,
  options: [
    'N+1 do @OneToMany mặc định EAGER, nên Hibernate load toàn bộ items ngay khi lấy order',
    'Do thiếu index trên cột order_id của order_item, chỉ cần thêm index là hết N+1',
    'Do OSIV: tắt spring.jpa.open-in-view là số câu SELECT giảm ngay',
    'N+1 select: do bên @OneToMany mặc định là LAZY, nên mỗi order phải chạy thêm một câu SELECT để nạp items; sửa bằng JOIN FETCH, @EntityGraph hoặc @BatchSize'
  ],
  answer: 3,
  explain: `**Đáp án đúng: N+1 select do @OneToMany mặc định LAZY, sửa bằng JOIN FETCH, @EntityGraph hoặc @BatchSize.**

### Vì sao đúng
- "1 + N" nghĩa là: 1 câu lấy danh sách order, rồi **N** câu nữa, mỗi câu nạp items của một order.
- Theo đặc tả JPA, phía "to-many" ({{@OneToMany}}, {{@ManyToMany}}, {{@ElementCollection}}) mặc định **LAZY**. LAZY nghĩa là lúc load order, Hibernate chỉ chạy câu SELECT cho bảng order; danh sách items là một "hàng chờ", chưa có dữ liệu.
- Khi code gọi {{o.getItems()}} cho từng order, Hibernate mới chạy một câu SELECT cho **từng** order: 1 + 200 = 201 câu. Đó là N+1: chậm vì mỗi câu là một lần đi lại qua mạng (round-trip), nhân với số dòng.
- Ba cách sửa: {{join fetch o.items}} (một câu SQL), {{@EntityGraph}} (khai báo đồ thị tải kèm), hoặc {{@BatchSize}} (gom nhiều id vào một câu SELECT ... WHERE order_id IN (...)).

### Vì sao các phương án còn lại sai
- **EAGER**: nếu EAGER thì đã load items ngay trong câu đầu, không có N+1 kiểu này (nhưng EAGER trên JPQL cũng gây N+1 khi Hibernate phải load bù từng order — xem câu qz-jpa-009).
- **Thiếu index**: index làm **một** câu SELECT nhanh hơn, không làm giảm **số** câu. Vẫn 201 lần đi lại mạng.
- **OSIV**: tắt OSIV làm session đóng sớm; khi template gọi getItems() sẽ ném LazyInitializationException, tức là vẫn N+1 nếu bạn load lười từng order trong service. OSIV không phải nguyên nhân.

### Cách đo
~~~text
spring.jpa.properties.hibernate.generate_statistics=true
logging.level.org.hibernate.SQL=DEBUG   # chỉ bật ở dev/staging
~~~

> Senior tip: N+1 hầu như luôn là nguyên nhân số 1 của "API chậm mà DB không tải". Hãy assert số câu query trong integration test, đừng chờ đọc log production.`
},
{
  id: 'qz-jpa-031',
  topic: 'jpa',
  q: `Service sau đọc hoá đơn để đưa ra màn hình (không gọi setData):
~~~java
@Transactional
public InvoiceView view(Long id) {
    Invoice inv = invoiceRepo.findById(id).orElseThrow();
    return new InvoiceView(inv.getNumber(), inv.getCustomer().getName());
}
~~~`,
  options: [
    '@Transactional(readOnly = true) là bắt buộc: thiếu nó Hibernate sẽ ghi đè bản ghi dù ta không sửa gì',
    'Method không có câu UPDATE nào, vì chỉ có SELECT và không có thay đổi state nào so với snapshot lúc load',
    'Một câu UPDATE luôn chạy ở commit, vì mọi entity managed đều được ghi lại toàn bộ cột khi commit',
    'Ném TransactionRequiredException vì không gọi save'
  ],
  answer: 1,
  explain: `**Đáp án đúng: không có câu UPDATE nào, vì persistence context chỉ thấy các entity không đổi so với snapshot.**

### Vì sao đúng
- {{findById}} chạy một câu SELECT và đưa Invoice vào **persistence context** (sổ tay của Hibernate trong session này), kèm một **snapshot** (bản chụp trạng thái lúc load).
- {{getNumber()}}, {{getCustomer().getName()}} chỉ **đọc**: không setter nào được gọi, nên không có field nào khác snapshot. Lúc commit, Hibernate flush: dirty checking so từng entity với snapshot, không thấy khác → **không sinh UPDATE**.
- {{@Transactional}} (không readOnly) chỉ đảm bảo có transaction và session mở suốt method; nó không tự tạo câu ghi.

### Vì sao các phương án còn lại sai
- **Thiếu readOnly là bị ghi đè**: readOnly là **lưới an toàn**, không phải điều kiện để "không ghi". Với readOnly = true, Spring đặt FlushMode **MANUAL**: chỉ {{em.flush()}} gọi tay mới đẩy thay đổi xuống DB. Không có gì dirty thì MANUAL hay AUTO đều không sinh UPDATE.
- **Mọi entity managed đều UPDATE toàn bộ cột khi commit**: sai hai lần — chỉ entity **dirty** mới được UPDATE, và Hibernate 6 chỉ đưa **cột đã đổi** vào câu UPDATE, không phải cả 40 cột.
- **TransactionRequiredException**: lỗi này xuất hiện khi chạy câu JPQL bulk {{@Modifying}} hoặc repository write method ngoài transaction, không phải khi đọc.

> Senior tip: readOnly không làm query nhanh hơn; nó chỉ bỏ dirty checking/snapshot và đánh dấu connection read-only (có thể route sang replica). Muốn giảm số câu SELECT thì dùng DTO projection (xem qz-jpa-018), không phải readOnly.`
},
{
  id: 'qz-jpa-032',
  topic: 'jpa',
  multi: true,
  q: 'Trong một transaction, persistence context đã có entity Invoice (managed). Bạn chạy bulk update xoá hàng loạt dòng invoice_item của hoá đơn đó rồi gọi itemRepo.findAllByInvoiceId(id). Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Câu bulk update đi thẳng xuống DB, bỏ qua persistence context; entity đã load trước đó vẫn giữ giá trị cũ trong bộ nhớ',
    'Nếu entity đó bị dirty và commit sau bulk update, dirty checking có thể ghi đè lại giá trị cũ lên dữ liệu vừa bulk update',
    'Nếu câu bulk update nằm trước lệnh find trong cùng transaction, find sẽ thấy dữ liệu mới vì bulk update ghi ngay xuống DB',
    '@Modifying luôn tự clear persistence context trước khi chạy câu bulk',
    'Bulk update không được phép chạy trong transaction'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: bulk update bỏ qua persistence context (entity cũ giữ giá trị cũ) và dirty checking sau đó có thể ghi đè.**

### Vì sao đúng
- Câu bulk ({{@Modifying @Query("update ...")}} hoặc {{delete ...}}) được Hibernate gửi **thẳng** xuống DB, không cập nhật các object đang nằm trong persistence context. Bạn update 500 dòng trong DB, nhưng 500 entity đã load trong session vẫn giữ snapshot cũ.
- Nguy hiểm nhất là **ghi đè ngược**: nếu một entity trong session đang dirty (khác snapshot), lúc flush Hibernate sinh UPDATE với giá trị trong bộ nhớ và **đè** lên giá trị DB vừa bị bulk update. Kết quả: thay đổi âm thầm biến mất.
- Cách phòng ngừa: {{@Modifying(clearAutomatically = true, flushAutomatically = true)}} — flush các thay đổi đang chờ **trước** khi chạy bulk, clear session **sau** đó để lần đọc sau lấy dữ liệu mới từ DB.

### Vì sao các phương án còn lại sai
- **Bulk nằm trước find thì find thấy dữ liệu mới**: trong **cùng** transaction, câu bulk đã chạy và đã ghi xuống DB, nên find sau đó đọc đúng dữ liệu mới; nhưng nếu entity đã có trong persistence context, Hibernate trả về **bản trong bộ nhớ** (first-level cache) chứ không query DB. Vì vậy phát biểu này không đúng trong trường hợp entity đã được load.
- **@Modifying luôn tự clear**: mặc định **không**; {{clearAutomatically = true}} mới bật. Tương tự {{flushAutomatically}}.
- **Không được chạy trong transaction**: ngược lại, {{@Modifying}} thiếu {{@Transactional}} sẽ ném TransactionRequiredException.

> Senior tip: quy tắc thực dụng — bulk update chỉ dùng cho hàng nghìn dòng trở lên, và luôn bật clearAutomatically. Với vài chục dòng, load entity rồi sửa bằng setter an toàn và dễ đọc hơn nhiều.`
},
{
  id: 'qz-jpa-033',
  topic: 'jpa',
  q: `Trong một transaction, code thay đổi trạng thái của một entity managed rồi commit:
~~~java
Order o = orderRepo.findById(7L).orElseThrow();   // SELECT
o.setStatus(OrderStatus.PAID);                    // KHÔNG gọi save
// transaction commit
~~~
Điều gì xảy ra khi commit?`,
  options: [
    'Không có gì: thiếu orderRepo.save(o) nên thay đổi không được lưu',
    'Một câu UPDATE chạy lúc commit (dirty checking), vì flush mode mặc định là AUTO và UPDATE chỉ gồm các cột thực sự đổi',
    'Một câu UPDATE chạy ngay tại dòng setStatus',
    'Ném TransactionRequiredException vì không gọi save'
  ],
  answer: 1,
  explain: `**Đáp án đúng: một câu UPDATE lúc commit, do dirty checking; flush mode mặc định AUTO và chỉ cột đổi mới nằm trong câu UPDATE.**

### Vì sao đúng
- **Persistence context** (còn gọi là first-level cache) là "sổ tay" của Hibernate trong một session: nó giữ các entity đã load kèm một **snapshot** (bản chụp trạng thái lúc load).
- {{findById}} chạy SELECT, đưa entity vào sổ tay và đánh dấu **managed** (Hibernate theo dõi).
- {{setStatus}} chỉ sửa field trong bộ nhớ, chưa có SQL nào.
- Lúc commit, Hibernate **flush**: so sánh từng entity managed với snapshot, thấy khác → sinh UPDATE. Flush mode mặc định của Hibernate là **AUTO**: flush trước khi commit và trước những query cần dữ liệu mới. Nếu method là {{@Transactional(readOnly = true)}}, Spring đặt MANUAL nên sẽ không có UPDATE.
- Hibernate 6 chỉ đưa **cột đã đổi** vào câu UPDATE (dynamic update mặc định theo cột thay đổi), không phải toàn bộ 40 cột.

### Vì sao các phương án còn lại sai
- **Thiếu save thì không lưu**: với entity **managed**, dirty checking đủ; {{save()}} chỉ cần cho entity mới hoặc detached.
- **UPDATE ngay tại setStatus**: setter chỉ đổi bộ nhớ; không có SQL cho tới khi flush.
- **TransactionRequiredException**: lỗi đó xảy ra khi thực thi câu JPQL bulk hoặc gọi repository write method ngoài transaction, không phải khi sửa field của entity managed.

> Senior tip: vì dirty checking chạy trên toàn bộ entity managed, một method {{readOnly = false}} vô tình sửa field sẽ âm thầm ghi DB. Dùng readOnly cho method đọc để biến "quên" thành an toàn.`
},
{
  id: 'qz-jpa-034',
  topic: 'jpa',
  q: `Service (không có @Transactional) gọi repo.findById(id) trả về Order, rồi ở controller gọi order.getItems().count() để tính số sản phẩm. Exception nào xuất hiện?`,
  options: [
    'Ném TransactionRequiredException ngay tại findById',
    'Ném EntityNotFoundException vì items chưa được load',
    'Không có exception nào, vì mọi quan hệ đều được load kèm trong cùng câu SELECT',
    'Ném LazyInitializationException khi controller truy cập items, vì transaction đã kết thúc và session đóng khi repo.findById trả về; sửa bằng cách load items trong service đang mở transaction'
  ],
  answer: 3,
  explain: `**Đáp án đúng: LazyInitializationException khi truy cập collection lazy ngoài session.**

### Vì sao đúng
- Không có {{@Transactional}}, mỗi lần gọi repository method Spring mở một transaction ngắn, mở session, chạy SELECT rồi **đóng session**. Entity trả về là **detached**: nó có dữ liệu nhưng không còn "người theo dõi" để nạp thêm.
- {{items}} là collection lazy (mặc định to-many LAZY). Lúc load Order, items chưa được nạp. Khi controller gọi {{getItems().count()}}, Hibernate cần chạy một câu SELECT nữa nhưng session đã đóng → ném LazyInitializationException.
- Cách sửa: load đủ trong service đang có transaction — {{@EntityGraph(attributePaths = "items")}} trên method, hoặc {{join fetch}}, hoặc trả về DTO/projection đã tính sẵn số lượng.

### Vì sao các phương án còn lại sai
- **TransactionRequiredException**: chỉ xuất hiện khi chạy câu lệnh ghi/bulk ngoài transaction.
- **EntityNotFoundException**: xảy ra khi truy cập một proxy (getReference) mà hàng không tồn tại, không phải khi session đóng.
- **Không exception vì đã load kèm**: chỉ đúng nếu quan hệ EAGER hoặc đã fetch; ở đây là LAZY mặc định.

> Senior tip: LazyInitializationException thường xuất hiện **sau khi** tắt OSIV (spring.jpa.open-in-view=false) — đó là dấu hiệu bạn đang đọc dữ liệu ở tầng sai. Hãy chuyển việc "đếm/hiển thị" vào service, đừng để controller chạm vào collection.`
},
{
  id: 'qz-jpa-035',
  topic: 'jpa',
  q: `Entity Account có @Version. Hai request cùng sửa số dư:
~~~java
// T1 (đọc version = 7)            // T2 (đọc version = 7)
a.setBalance(90);                  b.setBalance(80);
aRepo.save(a);                     bRepo.save(b);
// T1 commit trước                // T2 commit sau
~~~
Kết quả của T2 là gì?`,
  options: [
    'T2 bị chặn (block) cho tới khi T1 commit rồi mới đọc được bản ghi mới nhất',
    'T2 ném StaleObjectStateException ngay khi gọi save vì version trong bộ nhớ đã cũ',
    'T2 nhận OptimisticLockException (thường được Spring bọc thành ObjectOptimisticLockingFailureException): câu UPDATE kèm WHERE version = 7 không khớp vì version đã là 8',
    'T2 commit thành công và ghi đè balance của T1, vì Hibernate không so sánh version khi save'
  ],
  answer: 2,
  explain: `**Đáp án đúng: T2 nhận OptimisticLockException khi flush, vì điều kiện version không khớp.**

### Vì sao đúng
- {{@Version}} thêm một cột version. Lúc load, entity giữ version = 7. Câu UPDATE của Hibernate có dạng {{update account set balance = ?, version = 8 where id = ? and version = 7}}.
- T1 commit trước: UPDATE khớp (DB version = 7) → 1 dòng bị thay đổi, DB version thành 8.
- T2 commit sau: DB version đã là 8, nhưng câu UPDATE vẫn mang điều kiện version = 7 → **0 dòng** bị ảnh hưởng → Hibernate ném OptimisticLockException (Spring bọc thành ObjectOptimisticLockingFailureException, thường map sang HTTP 409).
- Lỗi xảy ra ở **flush lúc commit**, không phải lúc gọi save: save chỉ đưa entity vào hàng chờ. Đó là lý do bạn cần bọc retry ở tầng service, **ngoài** transaction.

### Vì sao các phương án còn lại sai
- **Ghi đè bản T1**: đó là "last write wins" — chính thứ @Version sinh ra để chặn.
- **Bị chặn (block)**: đó là pessimistic lock (SELECT ... FOR UPDATE, xem câu qz-jpa-017), không phải optimistic.
- **Ném ngay tại save**: save không chạy UPDATE; chỉ flush mới thực thi. (Một số provider có thể ném sớm hơn, nhưng mặc định Hibernate là lúc flush.)

### Cách retry đúng
~~~java
@Retryable(retryFor = ObjectOptimisticLockingFailureException.class, maxAttempts = 3)
@Transactional(propagation = Propagation.REQUIRES_NEW)
public void updateBalance(Long id, BigDecimal amount) { ... }
~~~

> Senior tip: optimistic hợp với tranh chấp thấp (form sửa hồ sơ). Với tranh chấp cao như trừ tồn kho flash sale, retry liên tục sẽ thừa — dùng câu UPDATE có điều kiện hoặc pessimistic lock. Đừng retry bên trong cùng transaction: entity cũ vẫn nằm trong session.`
},
{
  id: 'qz-jpa-036',
  topic: 'jpa',
  multi: true,
  q: 'Entity dùng @GeneratedValue(strategy = GenerationType.IDENTITY). Bạn import 200.000 dòng bằng saveAll, đã bật hibernate.jdbc.batch_size=50 nhưng log vẫn cho thấy 200.000 câu INSERT riêng lẻ. Những phát biểu nào đúng? (Chọn 2)',
  options: [
    'Batch size bị bỏ qua vì mỗi INSERT phải chạy một câu SELECT lấy id trước',
    'Batch chỉ có tác dụng với UPDATE và DELETE, không áp dụng cho INSERT',
    'Chỉ cần tăng batch_size lên 5.000 là IDENTITY batch được',
    'IDENTITY bắt buộc Hibernate lấy generated key ngay sau mỗi INSERT nên phải insert ngay tại persist; muốn batch được thì đổi sang SEQUENCE (hoặc TABLE generator)',
    'Với SEQUENCE + allocationSize = 50 (pooled optimizer), Hibernate lấy một khối 50 id bằng một lần gọi sequence rồi mới gom INSERT'
  ],
  answer: [3, 4],
  explain: `**Đáp án đúng: IDENTITY buộc insert ngay để lấy key (mất batch); SEQUENCE + pooled optimizer cấp id theo khối nên batch được.**

### Vì sao đúng
- Với IDENTITY, DB sinh id khi INSERT chạy (auto_increment / identity column). Hibernate cần id để đưa entity vào persistence context (id là khoá của first-level cache), nên nó **phải** thực thi INSERT ngay tại {{persist()}} rồi đọc generated key. Không thể hoãn để gom batch → mỗi dòng một round-trip.
- Với SEQUENCE, Hibernate gọi sequence một lần lấy **một khối** id (allocationSize = 50, pooled optimizer) và cấp dần trong bộ nhớ. Vì đã biết id trước, entity có thể nằm chờ trong session và INSERT được gom thành batch lúc flush.
- Kèm theo: {{hibernate.order_inserts=true}} để các INSERT cùng bảng nằm cạnh nhau, và {{flush()}} + {{clear()}} mỗi lô để session không phình.

### Vì sao các phương án còn lại sai
- **Mỗi INSERT có một SELECT lấy id**: đó là hành vi của generator cũ (SELECT max(id)), không phải IDENTITY và không phải SEQUENCE.
- **Batch chỉ cho UPDATE/DELETE**: {{hibernate.jdbc.batch_size}} áp dụng cho INSERT, UPDATE và DELETE.
- **Tăng batch_size là batch được**: con số không giải quyết được nguyên nhân gốc; Hibernate vẫn phải insert ngay từng dòng vì IDENTITY.

> Senior tip: trên PostgreSQL dùng SEQUENCE + allocationSize (nhớ để INCREMENT BY khớp allocationSize); MySQL không có sequence thì dùng TABLE generator. Với hàng chục triệu dòng, cân nhắc bỏ JPA hẳn: JdbcTemplate.batchUpdate hoặc COPY nhanh hơn một bậc.`
},
{
  id: 'qz-jpa-037',
  topic: 'jpa',
  q: `Danh sách 200 book, mỗi book có khoảng 5 author. Method sau chạy trên một danh sách như vậy:
~~~java
@Transactional(readOnly = true)
public Map<Long, Integer> countAuthors(List<Long> bookIds) {
    Map<Long, Integer> result = new HashMap<>();
    for (Long id : bookIds) {
        Book b = bookRepo.findById(id).orElseThrow();
        result.put(id, b.getAuthors().size());
    }
    return result;
}
~~~`,
  options: [
    '400 câu SELECT: mỗi book chạy 1 câu findById + 1 câu nạp authors (N+1 nhân đôi); sửa bằng JOIN FETCH, @EntityGraph hoặc @BatchSize',
    '201 câu SELECT, vì @ManyToMany mặc định EAGER nên Hibernate đã nạp sẵn authors trong câu SELECT book đầu tiên',
    '400 câu SELECT, nhưng nguyên nhân là readOnly = true: readOnly khiến Hibernate phải query lại từng quan hệ',
    '400 câu SELECT, nhưng vì getAuthors().size() luôn chạy một câu SELECT COUNT cho từng phần tử'
  ],
  answer: 0,
  explain: `**Đáp án đúng: N+1 select nhân đôi — to-many mặc định LAZY nên mỗi book chạy 1 câu findById + 1 câu nạp authors.**

### Vì sao đúng
- Vòng lặp gọi {{findById}} cho **từng** id: 200 câu SELECT cho bảng book.
- {{authors}} là quan hệ **to-many** nên mặc định **LAZY**: lúc load book, danh sách author chưa được nạp.
- {{b.getAuthors()}} buộc Hibernate khởi tạo collection: một câu SELECT vào bảng nối + bảng author cho **từng** book → 200 câu nữa.
- Tổng: 200 + 200 = 400 câu. Đây là biến thể N+1: N câu cho entity chính + N câu cho collection.
- Ba cách sửa: {{@Query("select b from Book b join fetch b.authors where b.id in :ids")}}, {{@EntityGraph(attributePaths = "authors")}} trên method, hoặc {{@BatchSize(size = 50)}} để gom 50 book vào một câu SELECT ... WHERE book_id IN (...).

### Vì sao các phương án còn lại sai
- **EAGER**: to-many mặc định là LAZY, không phải EAGER. Nếu là EAGER thì Hibernate vẫn phải nạp bù **từng** book khi chạy JPQL → vẫn N+1, chỉ khác cách load (xem qz-jpa-009).
- **readOnly**: chỉ đặt flush mode MANUAL; không liên quan tới việc nạp quan hệ.
- **size() chạy COUNT cho từng phần tử**: Hibernate nạp collection rồi trả về size trong bộ nhớ; không có COUNT cho từng phần tử.

> Senior tip: đếm số lượng thì đừng nạp cả collection — dùng projection hoặc câu {{select b.id, count(a) from Book b join b.authors a where b.id in :ids group by b.id}}. Nạp 200 book × 5 author chỉ để lấy con số là lãng phí heap và round-trip.`
},
{
  id: 'qz-jpa-038',
  topic: 'jpa',
  q: `Entity Order có:
~~~java
@OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
private List<OrderItem> items = new ArrayList<>();

public void addItem(OrderItem item) {
    items.add(item);      // thiếu item.setOrder(this)
}
~~~
Trong một transaction, code tạo order mới, gọi addItem(item) rồi orderRepo.save(order) và commit. Cột order_item.order_id nhận giá trị nào?`,
  options: [
    'NULL (hoặc lỗi constraint nếu cột NOT NULL), vì phía sở hữu quan hệ là OrderItem.order và nó không được gán',
    'id của order, vì cascade ALL đã cập nhật khoá ngoại giúp',
    'Item không được lưu, vì cascade chỉ áp dụng khi gọi itemRepo.save(item)',
    'id của order, vì Hibernate tự đồng bộ hai phía của quan hệ hai chiều'
  ],
  answer: 0,
  explain: `**Đáp án đúng: order_id = NULL (hoặc vi phạm NOT NULL), vì owning side là OrderItem.order không được gán.**

### Vì sao đúng
- Trong quan hệ hai chiều, chỉ **owning side** (phía **không** có {{mappedBy}}, ở đây là {{OrderItem.order}}) quyết định giá trị khoá ngoại. Phía {{mappedBy}} chỉ là "gương" để đọc.
- {{cascade = ALL}} khiến item được persist cùng order, nhưng khi ghi cột order_id, Hibernate đọc {{item.getOrder()}} — đang null → ghi NULL.
- orphanRemoval không liên quan: nó chỉ quyết định "gỡ khỏi collection thì con có bị xoá không".
- Cách đúng là helper đồng bộ hai phía: {{items.add(item); item.setOrder(this);}}.

### Vì sao các phương án còn lại sai
- **Tự đồng bộ**: Hibernate không tự làm (trừ khi bật bytecode enhancement với association management, ít dùng).
- **Cascade cập nhật khoá ngoại**: cascade chỉ lan toả thao tác persist/remove, không ghi cột.
- **Item không được lưu**: cascade ALL từ order vẫn persist item; chỉ cột order_id sai.

### Cách đúng: helper đồng bộ hai phía
~~~java
public void addItem(OrderItem item) {
    items.add(item);
    item.setOrder(this);   // owning side phải được gán
}
~~~

> Senior tip: luôn để cột khoá ngoại NOT NULL ở DB (Flyway/Liquibase) để bug kiểu này nổ ngay trong test, thay vì âm thầm tạo dữ liệu mồ côi. Và đặt helper addItem/removeItem ở một chỗ duy nhất, đừng rải setOrder khắp service.`
},
{
  id: 'qz-jpa-039',
  topic: 'jpa',
  multi: true,
  q: 'Entity Inventory có @Version và @OneToMany(mappedBy = "inventory", cascade = ALL, orphanRemoval = true) List<StockMovement> movements. Bạn cần trừ tồn kho 1 đơn vị dưới tải 5.000 request/giây trên **cùng** một dòng. Những cách nào xử lý đúng? (Chọn 2)',
  options: [
    'Gọi quantity-- rồi save trong transaction dài, dùng @Version để đảm bảo đúng',
    'Dùng pessimistic lock (SELECT ... FOR UPDATE) rồi gọi API thanh toán bên ngoài trong lúc vẫn giữ lock',
    ' Optimistic lock: load entity có @Version, trừ quantity rồi save, retry nhiều lần khi OptimisticLockException',
    'Câu UPDATE nguyên tử có điều kiện: update inventory set quantity = quantity - 1 where sku = ? and quantity >= 1, kiểm tra số dòng ảnh hưởng (1 là thành công, 0 là hết hàng)',
    'Đẩy phần "giữ chỗ" sang Redis (DECR hoặc Lua script), sau đó ghi bản ghi tồn kho chính thức qua hàng đợi'
  ],
  answer: [3, 4],
  explain: `**Đáp án đúng: UPDATE nguyên tử có điều kiện ở DB, hoặc đẩy việc giữ chỗ sang Redis rồi ghi sổ qua hàng đợi.**

### Vì sao đúng
- **UPDATE nguyên tử**: cả đọc, kiểm tra và ghi diễn ra trong một câu lệnh bên trong DB, không có vòng "đọc qua mạng → sửa trong JVM → ghi lại". Điều kiện {{quantity >= 1}} chặn bán quá tồn. Kiểm tra số dòng ảnh hưởng: 1 = thành công, 0 = hết hàng.
- **Redis + hàng đợi**: ở mức vài nghìn request/giây trên một khoá nóng, row lock của DB cũng là điểm nghẽn. Các hệ thống thật giữ "suất" bằng {{DECR}} hoặc Lua script (nguyên tử trong Redis), rồi ghi kho chính thức bất đồng bộ qua Kafka/SQS. Đổi lại: phải xử lý bù trừ, đối soát và idempotency khi ghi sổ.
- Cả hai đều tránh vòng read-modify-write qua JVM.

### Vì sao các phương án còn lại sai
- **Optimistic + retry nhiều lần**: 5.000 request cùng tranh một version → hầu hết đều thua, retry chỉ nhân tải (retry storm). Tỉ lệ lỗi và p99 tăng vọt.
- **Transaction dài giữ entity**: giữ lock và connection rất lâu, thông lượng sụp.
- **PESSIMISTIC_WRITE + gọi API thanh toán trong lúc giữ lock**: giữ lock trong lúc gọi mạng chậm → mọi request khác xếp hàng; timeout thanh toán có thể làm treo cả cụm.

### Bài học
> Senior tip: khoá nóng là bài toán "một dòng, nhiều writer". Giải pháp luôn là **giảm thời gian giữ lock** (một câu UPDATE nguyên tử) hoặc **giảm số writer tranh một khoá** (chia bucket tồn kho, hàng đợi, Redis). Đừng cố "tăng retry" để chữa nghẽn.`
},
{
  id: 'qz-jpa-040',
  topic: 'jpa',
  q: `Export báo cáo cần khoảng 20 trang, mỗi trang 20 order, kèm toàn bộ danh sách dòng sản phẩm (mỗi order khoảng 8 item). Code hiện tại:
~~~java
@Query("select o from Order o join fetch o.items")
List<Order> findAllWithItems(Pageable pageable);   // pageable size = 20
~~~
Bảng order có 5 triệu dòng, order_item 30 triệu dòng. Log cảnh báo HHH90003004. Vấn đề là gì?`,
  options: [
    'Cần thêm INDEX trên order_item.order_id để Hibernate áp dụng LIMIT đúng',
    'JOIN FETCH trên collection làm mỗi item thành một dòng, nên Hibernate bỏ LIMIT và tải toàn bộ kết quả rồi phân trang trong bộ nhớ; sửa bằng hai bước: phân trang id trước rồi fetch theo danh sách id',
    'JOIN FETCH với Pageable luôn ném exception, phải bỏ Pageable',
    'Hibernate tự chuyển thành hai query nên không có vấn đề gì'
  ],
  answer: 1,
  explain: `**Đáp án đúng: Hibernate không thể LIMIT trên SQL khi fetch collection nên tải hết rồi phân trang trong bộ nhớ.**

### Vì sao đúng
- {{join fetch o.items}} làm mỗi order_item thành một dòng kết quả. Nếu đặt LIMIT 20 vào SQL, DB cắt sau 20 dòng — có thể cắt ngang giữa các item của một order, trả về order thiếu item. Sai dữ liệu.
- Vì vậy Hibernate **bỏ** LIMIT khỏi SQL, tải toàn bộ 5 triệu order × số item vào bộ nhớ, rồi mới lấy 20 order. Kết quả đúng nhưng chậm, tốn heap, và cảnh báo HHH90003004 chính là để nhắc bạn.
- Cách đúng là **hai bước**: (1) SELECT id có phân trang + ORDER BY; (2) SELECT ... WHERE order_id IN (:ids) kèm join fetch. Hoặc bỏ JPA cho báo cáo, dùng DTO projection + JDBC.

### Vì sao các phương án còn lại sai
- **Luôn ném exception**: chỉ khi bật {{hibernate.query.fail_on_pagination_over_collection_fetch=true}}, và lúc đó lỗi xảy ra khi chạy query chứ không phải luôn luôn.
- **Thêm index**: index giúp truy vấn nhanh hơn, không cho phép LIMIT đúng trên kết quả join.
- **Hibernate tự tách hai query**: Hibernate không tự làm; bạn phải viết.

> Senior tip: bật cờ fail_on_pagination_over_collection_fetch=true ở môi trường dev để biến cảnh báo im lặng thành lỗi thấy được. Với báo cáo lớn, DTO projection + JDBC (hoặc chỉ SELECT các cột cần) gần như luôn nhanh hơn entity + join fetch.`
},
{
  id: 'qz-jpa-041',
  topic: 'jpa',
  multi: true,
  q: 'Entity dùng Lombok @Data (sinh equals/hashCode trên toàn bộ field, kể cả quan hệ) và được thêm vào HashSet. Những rủi ro nào có thể xảy ra? (Chọn 3)',
  options: [
    '@Data thêm @Entity giúp cho entity, nên không cần khai báo @Entity nữa',
    '@Data làm entity không thể compile với JPA vì thiếu equals do framework quản lý',
    'equals gọi getter của quan hệ lazy → có thể kích hoạt LazyInitializationException hoặc thêm câu SELECT khi so sánh',
    'Quan hệ hai chiều Order ↔ OrderItem có thể khiến equals/hashCode đệ quy vô hạn (StackOverflowError)',
    'hashCode đổi sau khi entity thay đổi (ví dụ id được gán sau persist) → entity đã nằm trong HashSet không tìm lại được bằng contains'
  ],
  answer: [2, 3, 4],
  explain: `**Đáp án đúng: lazy khi so sánh, đệ quy vô hạn, và hashCode đổi sau khi thay đổi trạng thái.**

### Vì sao đúng
- **Lazy khi so sánh**: {{@Data}} sinh equals/hashCode trên **mọi** field non-static, gồm cả quan hệ. So sánh hai entity sẽ gọi getter của collection/proxy → chạy SELECT hoặc ném LazyInitializationException nếu session đã đóng. Đây là N+1 ẩn trong lúc so sánh.
- **Đệ quy vô hạn**: quan hệ hai chiều Order.items ↔ OrderItem.order khiến equals gọi lẫn nhau qua getter; với collection, so sánh từng phần tử lại quay lại cha → StackOverflowError.
- **hashCode đổi**: nếu hashCode tính từ field thay đổi được (hoặc từ id null → có giá trị sau persist), object đã nằm trong HashSet sẽ rơi vào bucket cũ; contains/get sau đó không tìm thấy vì hashCode tính lại đã khác.
- Cách an toàn: dùng @Getter/@Setter (không @Data), hoặc @EqualsAndHashCode(onlyExplicitlyIncluded = true) chỉ include khoá nghiệp vụ **bất biến** (ví dụ mã SKU), và cân nhắc dùng {{getClass().hashCode()}} hằng số (xem qz-jpa-012).

### Vì sao các phương án còn lại sai
- **Không compile**: @Data không xung đột với JPA ở mức biên dịch; vấn đề là hành vi lúc chạy.
- **@Data thêm @Entity**: @Data là của Lombok, không liên quan JPA; vẫn phải khai báo @Entity và @Id.

> Senior tip: entity là model cho DB, DTO là model cho API. Đừng đưa entity vào HashSet/HashMap làm key; nếu bắt buộc, dùng khoá nghiệp vụ bất biến hoặc id kèm hashCode hằng. Và luôn viết test so sánh equals cho entity có quan hệ hai chiều.`
},
{
  id: 'qz-spring-030',
  topic: 'spring',
  q: `Ứng dụng khai báo **hai** bean {{SecurityFilterChain}}, mỗi bean đều gọi {{http.authorizeHttpRequests(...)}} nhưng khác {{securityMatcher}}:
~~~java
@Bean @Order(1)
SecurityFilterChain api(HttpSecurity http) throws Exception {
    return http.securityMatcher("/api/**").authorizeHttpRequests(a -> a.requestMatchers("/api/public/**").permitAll().anyRequest().authenticated()).build();
}
@Bean @Order(2)
SecurityFilterChain web(HttpSecurity http) throws Exception {
    return http.securityMatcher("/admin/**").authorizeHttpRequests(a -> a.anyRequest().hasRole("ADMIN")).build();
}
~~~
Một request {{GET /api/orders}} đi qua chuỗi nào?`,
  options: [
    'Chỉ chuỗi {{@Order(2)}} (web), vì nó được khai báo sau nên được ưu tiên',
    'Cả hai chuỗi nối tiếp nhau: đi hết chuỗi 1 rồi tiếp tục chuỗi 2',
    'Chuỗi {{@Order(1)}} (api) xử lý; chuỗi web không được áp dụng cho request này',
    'Spring báo lỗi vì không được khai báo nhiều SecurityFilterChain'
  ],
  answer: 2,
  explain: `**Đáp án đúng: request chỉ đi qua chuỗi {{@Order(1)}} (api), vì matcher của nó khớp {{/api/**}} và chuỗi được sắp theo {{@Order}} tăng dần.**

### Vì sao đúng
Trong Spring Security 6, mỗi {{SecurityFilterChain}} là một bộ lọc độc lập gắn với một {{securityMatcher}}. Khi request đến, Spring duyệt các chuỗi theo thứ tự {{@Order}} tăng dần và **chọn chuỗi đầu tiên** mà {{securityMatcher}} khớp. {{/api/orders}} khớp {{/api/**}} nên chuỗi 1 xử lý và dừng; request không bao giờ rơi xuống chuỗi 2. Đây là lý do thứ tự {{@Order}} rất quan trọng: nếu chuỗi 1 khai báo matcher rộng (ví dụ {{/**}}) đặt trước, nó sẽ "ăn" mọi request và các chuỗi sau thành vô dụng.

### Vì sao các phương án còn lại sai
- **Chuỗi @Order(2) vì khai báo sau**: sai, thứ tự tăng dần nghĩa là số nhỏ xử lý trước; hơn nữa matcher {{/admin/**}} không khớp {{/api/orders}}.
- **Nối tiếp hai chuỗi**: mỗi chuỗi có bộ filter riêng; một request chỉ đi qua **một** chuỗi, không nối tiếp.
- **Báo lỗi khi khai báo nhiều**: hoàn toàn hợp lệ; đây là cách chuẩn để tách cấu hình API và web (ví dụ API stateless dùng JWT, web dùng form login).

> Senior tip: khi có nhiều matcher, hãy đặt chuỗi **cụ thể** (matcher hẹp) lên trước, chuỗi **chung** ({{/**}}) xuống sau cùng. Thêm kiểm tra bằng {{spring-security-test}}'s {{MockMvc}} để chắc mỗi đường dẫn đi đúng chuỗi, tránh lỗ hổng "quên route" do matcher lỡ tay rộng.`
},
{
  id: 'qz-spring-031',
  topic: 'spring',
  q: `Class cấu hình sau, ứng dụng khởi động với {{app.cache.ttl=30}} trong application.yml nhưng **không** có {{app.cache.max-entries}}:
~~~java
@ConfigurationProperties(prefix = "app.cache")
public record CacheProps(int ttl, Integer maxEntries) {}
~~~
Class này được đăng ký bằng cách nào để giá trị được inject và binding xảy ra?`,
  options: [
    'Chỉ cần đánh dấu {{@ConfigurationProperties}} là đủ, Spring tự quét mọi package',
    'Cần một trong ba: {{@EnableConfigurationProperties(CacheProps.class)}}, hoặc {{@ConfigurationPropertiesScan}}, hoặc khai báo {{@Bean}} trả về {{CacheProps}}; nếu chỉ có annotation mà không đăng ký, bean sẽ không tồn tại',
    '{{@ConfigurationProperties}} chỉ hoạt động trên class {{@Component}}, record không được hỗ trợ',
    'Thiếu {{max-entries}} nên khởi động fail với lỗi binding bắt buộc'
  ],
  answer: 1,
  explain: `**Đáp án đúng: cần đăng ký bean bằng @EnableConfigurationProperties, @ConfigurationPropertiesScan, hoặc @Bean; chỉ đánh dấu annotation mà không đăng ký thì không có bean.**

### Vì sao đúng
{{@ConfigurationProperties}} chỉ là **metadata** mô tả cách bind, nó không tự tạo bean. Spring cần một trong ba cách để biết class này tồn tại:
~~~java
@EnableConfigurationProperties(CacheProps.class)   // cách tường minh, khuyên dùng
// hoặc @ConfigurationPropertiesScan trên class chính
// hoặc @Bean CacheProps cacheProps() { ... }
~~~
Thiếu {{max-entries}} không gây lỗi, vì record binding cho phép giá trị null khi property không có (khác với primitive {{int}}). Nếu là {{int}} thì thiếu property mới fail.

### Vì sao các phương án còn lại sai
- **Chỉ annotation là đủ**: sai, đây là hiểu lầm phổ biến nhất; quên bước đăng ký là lỗi "bean not found" kinh điển.
- **Record không hỗ trợ**: sai, từ Spring Boot 2.6+ record binding được hỗ trợ đầy đủ (constructor binding), còn là cách **khuyên dùng** vì immutable.
- **Thiếu max-entries nên fail**: sai, {{Integer}} nhận null khi thiếu; chỉ primitive hoặc field có validation {{@NotNull}} mới fail.

> Senior tip: dùng constructor binding (record) + {{@Validated}} để validate ngay lúc khởi động, biến lỗi cấu hình thành "fail fast" thay vì NPE lúc chạy. Đặt thuộc tính qua biến môi trường trên Kubernetes để không phải build lại image khi đổi cấu hình.`
},
{
  id: 'qz-spring-032',
  topic: 'spring',
  multi: true,
  q: 'Thứ tự khởi tạo một singleton bean trong Spring Boot 3 (không có AOP proxy, không có @PostConstruct tranh chấp). Phát biểu nào đúng? (Chọn 2)',
  options: [
    'Constructor chạy trước, sau đó inject field/setter, rồi mới tới các callback khởi tạo',
    '{{@PostConstruct}} chạy trước {{InitializingBean.afterPropertiesSet()}}, và cả hai đều chạy trước khi bean được đưa vào sử dụng',
    '{{@PostConstruct}} chạy trước constructor để chuẩn bị dependency',
    '{{DisposableBean.destroy()}} chạy khi context đóng, sau khi bean không còn được dùng',
    'Thứ tự giữa @PostConstruct và afterPropertiesSet là ngẫu nhiên, không xác định'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: constructor → inject → @PostConstruct → afterPropertiesSet/init-method; destroy() chạy khi context đóng.**

### Vì sao đúng
Thứ tự chuẩn của vòng đời bean (không tính BeanPostProcessor):
~~~text
1. Constructor (constructor injection)
2. Inject field/setter (@Autowired)
3. @PostConstruct          <- CommonAnnotationBeanPostProcessor xử lý
4. afterPropertiesSet()    <- InitializingBean
5. init-method khai báo trong @Bean
6. bean sẵn sàng dùng
...
7. @PreDestroy / destroy() / close() khi context tắt
~~~
{{@PostConstruct}} luôn chạy **trước** {{afterPropertiesSet()}}: cả hai được gọi trong pha khởi tạo, và thứ tự này là cố định trong Spring, không ngẫu nhiên.

### Vì sao các phương án còn lại sai
- **@PostConstruct chạy trước constructor**: bất khả thi, object phải tồn tại trước thì mới gọi được method của nó.
- **@PreDestroy chạy ngẫu nhiên so với afterPropertiesSet**: sai, thứ tự là cố định như bảng trên.
- **destroy() giữa lúc chạy**: sai, nó chỉ chạy khi context đóng (ví dụ shutdown hook).

> Senior tip: đừng dùng cả @PostConstruct lẫn afterPropertiesSet cho cùng một việc, dễ gây khó hiểu. Với logic cần transaction lúc khởi động (warm cache), dùng ApplicationRunner/ApplicationReadyEvent — lúc đó mọi proxy đã sẵn sàng, khác với @PostConstruct (xem qz-spring-009).`
},
{
  id: 'qz-spring-033',
  topic: 'spring',
  q: `Bạn thêm file {{src/main/resources/app-extra.properties}} chứa {{app.name=from-file}} và muốn nạp nó vào Environment. Bạn viết:
~~~java
@PropertySource("classpath:app-extra.properties")
@Configuration
class ExtraConfig { /* ... */ }
~~~
Property source này có **thấp hơn** hay **cao hơn** {{application.yml}} do Spring Boot quản lý?`,
  options: [
    'Thấp hơn: @PropertySource thêm vào sau, và nguồn thêm bằng API luôn có ưu tiên thấp hơn các nguồn mặc định của Boot (application.yml, env, dòng lệnh)',
    'Cao hơn application.yml vì nó được nạp tường minh',
    'Bằng nhau, Spring gộp rồi chọn giá trị dài hơn',
    'Báo lỗi vì @PropertySource không đọc được .properties'
  ],
  answer: 0,
  explain: `**Đáp án đúng: thấp hơn, vì @PropertySource thêm vào cuối danh sách property source, và các nguồn của Boot (application.yml, biến môi trường, dòng lệnh) có ưu tiên cao hơn.**

### Vì sao đúng
Boot nạp các nguồn theo thứ tự ưu tiên giảm dần (cao → thấp): tham số dòng lệnh > system properties > biến môi trường > application-{profile}.yml ngoài jar > application-{profile}.yml trong jar > application.yml > ... {{@PropertySource}} mặc định chèn vào **sau** các nguồn lõi đó (qua {{ConfigurationClassPostProcessor}}), nên nếu cùng key, giá trị của Boot thắng. Lưu ý quan trọng: {{@PropertySource}} **không** biết profile, nó nạp file bất kể profile nào, nên không thay thế được file application-{profile}.yml.

### Vì sao các phương án còn lại sai
- **Cao hơn vì nạp tường minh**: "nạp tường minh" không đồng nghĩa ưu tiên cao; thứ tự phụ thuộc vị trí chèn vào danh sách.
- **Gộp rồi chọn giá trị dài hơn**: không có logic chọn chuỗi dài; key trùng thì một nguồn thắng theo thứ tự.
- **Không đọc được .properties**: sai, .properties là định dạng mặc định và được hỗ trợ đầy đủ.

> Senior tip: để @PropertySource thắng, dùng {{@PropertySource(..., ignoreResourceNotFound = true)}} và kiểm tra bằng {{/actuator/env/app.name}}. Nhưng tốt hơn là dùng {{spring.config.import}} (Boot 2.4+) để nạp thêm file config mà vẫn tôn trọng profile và thứ tự chuẩn.`
},
{
  id: 'qz-spring-034',
  topic: 'spring',
  q: `Ứng dụng có **hai** class {{@ControllerAdvice}} cùng bắt {{IllegalStateException}}:
~~~java
@ControllerAdvice @Order(1)
class AdviceA { @ExceptionHandler(IllegalStateException.class) ... }

@ControllerAdvice   // không khai báo @Order
class AdviceB { @ExceptionHandler(IllegalStateException.class) ... }
~~~
Khi controller ném {{IllegalStateException}}, exception handler nào được chọn?`,
  options: [
    'AdviceB, vì nó không có @Order nên được Spring ưu tiên',
    'Cả hai handler cùng chạy, kết quả gộp lại',
    'Spring báo lỗi vì trùng handler',
    'AdviceA, vì nó có @Order(1) ưu tiên cao hơn; @ControllerAdvice không @Order được coi là LOWEST_PRECEDENCE'
  ],
  answer: 3,
  explain: `**Đáp án đúng: AdviceA được chọn vì nó có @Order(1) ưu tiên cao hơn; advice không khai báo @Order rơi về LOWEST_PRECEDENCE.**

### Vì sao đúng
Spring xếp các {{@ControllerAdvice}} theo {{@Order}} (hoặc implements {{Ordered}}), giá trị nhỏ = ưu tiên cao. Advice không khai báo {{@Order}} nhận mặc định {{Ordered.LOWEST_PRECEDENCE}} (là {{Integer.MAX_VALUE}}), nên xếp sau mọi advice có @Order cụ thể. Với cùng một exception, Spring chọn handler của advice ưu tiên cao nhất; advice khác không chạy. Đây là cách bạn kiểm soát "advice nào bắt exception nào trước".

### Vì sao các phương án còn lại sai
- **AdviceB vì không có @Order**: ngược lại, không @Order là ưu tiên **thấp nhất**.
- **Cả hai cùng chạy**: chỉ một handler xử lý một exception, không gộp kết quả.
- **Báo lỗi vì trùng**: hợp lệ; @Order chính là cơ chế phân xử khi nhiều advice cùng bắt một exception.

> Senior tip: đặt advice "bắt rộng" (ví dụ Exception.class) ở @Order thấp (số lớn), advice "bắt hẹp" (ví dụ validation) ở @Order cao. Nếu không, một advice bắt Exception chung sẽ nuốt mọi exception trước khi handler cụ thể kịp chạy.`
},
{
  id: 'qz-spring-035',
  topic: 'spring',
  multi: true,
  q: 'Method {{sendMail()}} của service có {{@Async}}. Phát biểu nào đúng? (Chọn 2)',
  options: [
    'Gọi {{this.sendMail()}} từ method khác trong cùng bean vẫn chạy bất đồng bộ',
    'Gọi {{sendMail()}} qua bean khác (đã inject) mới chạy bất đồng bộ, vì @Async cần đi qua proxy',
    '@Async dùng executor {{applicationTaskExecutor}} mặc định của Boot (thread pool) khi không khai báo executor riêng',
    '@Async chạy đồng bộ nếu bean không có executor nào được cấu hình',
    'Return type của method @Async nên là void hoặc Future/CompletableFuture; trả về giá trị thường sẽ bị bỏ'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: @Async cần gọi qua proxy (từ bean khác); mặc định dùng applicationTaskExecutor.**

### Vì sao đúng
- {{@Async}} hoạt động nhờ một {{AsyncAnnotationBeanPostProcessor}} tạo proxy quanh bean. Chỉ lời gọi từ **bên ngoài qua proxy** mới bị bọc để chạy trên executor khác. Gọi {{this.sendMail()}} là self-invocation, bỏ qua proxy, nên method chạy **đồng bộ** trên thread của caller (cùng lỗi như @Transactional tự gọi, xem qz-spring-029).
- Mặc định Boot auto-config {{ThreadPoolTaskExecutor}} tên {{applicationTaskExecutor}} (8 core thread, queue không giới hạn — xem qz-spring-013). Bạn có thể khai báo executor riêng và chỉ định bằng {{@Async("executorName")}}.

### Vì sao các phương án còn lại sai
- **this.sendMail() vẫn async**: sai, self-invocation bỏ qua proxy nên chạy đồng bộ.
- **Chạy đồng bộ nếu không có executor**: sai, luôn có executor mặc định; chỉ khi executor không tồn tại mới có lỗi, không phải tự chuyển đồng bộ.
- **Trả về giá trị thường sẽ bị bỏ**: trả về void/Future là **khuyến nghị**, nhưng trả về kiểu khác không "bị bỏ" — nó chỉ không mang ý nghĩa bất đồng bộ; phát biểu này quá tuyệt đối nên không chọn.

> Senior tip: nếu method @Async trả về giá trị, hãy dùng {{CompletableFuture}}; với việc gửi mail/notification khối lượng lớn, đừng dùng @Async trong bộ nhớ mà đẩy sang message queue, vì restart pod là mất toàn bộ task đang xếp hàng trong queue (xem qz-spring-013).`
},
{
  id: 'qz-spring-036',
  topic: 'spring',
  q: `Service sau, method {{process()}} là {{private}} và được gọi từ method public cùng class:
~~~java
@Transactional
private void process() { orderRepo.save(new Order("PENDING")); }

public void handle() { process(); }
~~~
Hành vi transaction của {{process()}} khi {{handle()}} được gọi từ controller?`,
  options: [
    'Vẫn có transaction đầy đủ vì @Transactional áp dụng cho cả class',
    'Không có transaction nào được mở cho process(), vì proxy không thể can thiệp vào method private và lời gọi this.process() là self-invocation',
    'Transaction mở nhưng chỉ read-only vì method private',
    'Compile lỗi vì @Transactional không được đặt trên method private'
  ],
  answer: 1,
  explain: `**Đáp án đúng: không có transaction, vì proxy không bao bọc được method private và self-invocation bỏ qua proxy.**

### Vì sao đúng
Spring AOP dùng proxy (JDK dynamic proxy hoặc CGLIB). Cả hai đều chỉ can thiệp được method **public/protected** (CGLIB subclass không thể override method private; JDK proxy chỉ làm việc qua interface). Method {{private}} nằm ngoài tầm với của proxy. Hơn nữa, {{handle()}} gọi {{this.process()}} là self-invocation, không đi qua proxy. Kết quả: {{@Transactional}} trên {{process()}} **hoàn toàn vô hiệu**, không có transaction nào được mở.

### Vì sao các phương án còn lại sai
- **Áp dụng cho cả class**: @Transactional đặt trên method chỉ áp dụng method đó; đặt trên class mới áp dụng mọi method public. Và kể cả đặt trên class, method private vẫn không được proxy.
- **Transaction read-only**: không có transaction nào cả, không nói tới readOnly.
- **Compile lỗi**: code compile bình thường; annotation chỉ đơn giản là bị bỏ qua lúc chạy — đây là bẫy nguy hiểm vì không có cảnh báo.

> Senior tip: quy tắc an toàn là **chỉ đặt @Transactional trên method public** của bean được gọi từ bean khác. Nếu cần transaction cho logic private, hãy để method public gọi một bean khác có @Transactional, hoặc tự quản lý bằng {{TransactionTemplate}} (không phụ thuộc proxy).`
},
{
  id: 'qz-spring-037',
  topic: 'spring',
  q: `Controller nhận request body qua {{@Valid @RequestBody OrderRequest req}}. Client gửi thiếu trường {{email}} (đã khai báo {{@NotBlank}}). Không có {{@ControllerAdvice}} nào. Response trả về là gì?`,
  options: [
    'HTTP 200 với body rỗng, lỗi bị bỏ qua',
    'HTTP 400 Bad Request, body chứa thông tin lỗi validation (MethodArgumentNotValidException được xử lý bởi ResponseEntityExceptionHandler mặc định)',
    'HTTP 500 Internal Server Error',
    'HTTP 422 Unprocessable Entity do Spring Boot 3 mặc định'
  ],
  answer: 1,
  explain: `**Đáp án đúng: HTTP 400, body chứa lỗi validation.**

### Vì sao đúng
Khi {{@Valid}} thất bại, Spring ném {{MethodArgumentNotValidException}} trong lúc bind request body. Nếu bạn không tự viết {{@ControllerAdvice}}, Spring cung cấp một {{ResponseEntityExceptionHandler}} mặc định (qua {{ ResponseEntityExceptionHandler}}) biến exception này thành **HTTP 400** với body JSON mô tả lỗi từng field (mặc định Boot 3 tắt phần "message" chi tiết trong một số cấu hình, nhưng status vẫn là 400). Đây là hành vi "bảo vệ" mặc định, không phải 500.

### Vì sao các phương án còn lại sai
- **200 body rỗng**: sai, validation fail là lỗi phía client, Spring không nuốt im lặng.
- **500**: 500 dành cho lỗi hệ thống (NullPointerException, DB lỗi). Validation sai dữ liệu đầu vào là lỗi 4xx.
- **422 mặc định**: Spring **không** mặc định dùng 422 cho validation; 422 thường do bạn tự cấu hình hoặc do framework khác (ví dụ JAX-RS). Boot mặc định là 400.

> Senior tip: đừng dựa vào body lỗi mặc định (nó thay đổi giữa các phiên bản và có thể lộ chi tiết nội bộ). Hãy tự viết một {{@RestControllerAdvice}} bắt {{MethodArgumentNotValidException}} trả về DTO lỗi ổn định: mã lỗi, field, thông điệp đã i18n. Đây là điểm phỏng vấn hay hỏi về "consistent error contract".`
},
{
  id: 'qz-spring-038',
  topic: 'spring',
  multi: true,
  q: 'API REST stateless dùng JWT, không dùng session, FE gọi từ domain khác. Cấu hình Spring Security 6 nào là hợp lý? (Chọn 3)',
  options: [
    '{{http.csrf(csrf -> csrf.disable())}} khi dùng JWT stateless, vì không có session cookie để bảo vệ',
    '{{http.cors(...)}} để cho phép domain của FE gọi API',
    'Bật lại CSRF token trong header để an toàn hơn cho JWT',
    '{{http.sessionManagement(s -> s.sessionCreationPolicy(STATELESS))}} để không tạo session',
    'Dùng {{authorizeHttpRequests}} với {{requestMatchers("/actuator/**").permitAll()}} cho mọi endpoint actuator'
  ],
  answer: [0, 1, 3],
  explain: `**Đáp án đúng: tắt CSRF (stateless JWT), bật CORS, đặt session STATELESS.**

### Vì sao đúng
- CSRF (Cross-Site Request Forgery) khai thác việc trình duyệt **tự động gửi cookie** session. API stateless dùng JWT (thường gửi trong header Authorization) không có cookie để kẻ tấn công lợi dụng, nên tắt CSRF là chuẩn.
- CORS (Cross-Origin Resource Sharing) là cơ chế của **trình duyệt**, cần cấu hình để domain FE khác được phép gọi. Đây là việc của Spring Security hoặc WebMvc, không phải "tắt bảo mật".
- {{sessionCreationPolicy(STATELESS)}}: Spring không tạo và không dùng HttpSession, phù hợp API thuần JWT.

### Vì sao các phương án còn lại sai
- **Bật lại CSRF cho JWT**: không cần và gây rắc rối; JWT không dựa vào cookie. (Nếu sau này bạn chuyển sang cookie httpOnly thì mới cần bật lại.)
- **permitAll mọi /actuator/**: rất nguy hiểm, /actuator/env và /actuator/heapdump có thể lộ secret và dữ liệu bộ nhớ. Chỉ permitAll đúng endpoint cần (thường là /actuator/health cho probe) và tách cổng actuator riêng (xem qz-spring-016).

> Senior tip: nguyên tắc là **tắt cái không cần, mở đúng cái cần**. Với JWT, hãy để token trong Authorization header (không phải cookie) và đặt chính sách CORS whitelist rõ ràng thay vì {{allowedOrigins("*")}} khi dùng credentials.`
},
{
  id: 'qz-spring-039',
  topic: 'spring',
  q: `Class cấu hình sau, application.yml có {{app.pool.max-size: 20}} và {{app.pool.min-idle: 5}}, nhưng {{app.pool.timeout-ms}} bị thiếu:
~~~java
@ConfigurationProperties(prefix = "app.pool")
@Validated
public class PoolProps {
    @NotNull @Min(1) private Integer maxSize = 10;
    @NotNull private Integer minIdle = 2;
    @NotNull private Long timeoutMs;
    // getter/setter
}
~~~
Ứng dụng khởi động với cấu hình này thì sao?`,
  options: [
    'Khởi động bình thường, timeoutMs = 0 vì là Long',
    'Khởi động bình thường, mọi field dùng giá trị mặc định đã khai báo',
    'Khởi động bình thường, binding bỏ qua field thiếu',
    'Khởi động fail với lỗi validation, vì timeoutMs là @NotNull nhưng không được cung cấp (giá trị mặc định không gán cho nó)'
  ],
  answer: 3,
  explain: `**Đáp án đúng: khởi động fail vì timeoutMs là @NotNull nhưng không có giá trị nào được cung cấp.**

### Vì sao đúng
{{@Validated}} trên class {{@ConfigurationProperties}} kích hoạt validation bằng Jakarta Bean Validation ngay khi binding xong. {{timeoutMs}} không có giá trị mặc định (khác maxSize=10, minIdle=2 đã gán sẵn) và không được cung cấp trong yml, nên sau binding nó là null. {{@NotNull}} fail, Spring ném lỗi binding và **chặn khởi động** — đây chính là "fail fast" mong muốn. Lưu ý: giá trị mặc định chỉ "cứu" field không bị validate null; nếu field có @NotNull mà mặc định là null thì vẫn fail.

### Vì sao các phương án còn lại sai
- **timeoutMs = 0 vì Long**: Long null vẫn là null, không tự thành 0.
- **Mọi field dùng mặc định**: timeoutMs không có mặc định, nên không thể "dùng giá trị mặc định".
- **Binding bỏ qua field thiếu**: binding không bỏ qua field thiếu khi có validation; @NotNull biến nó thành lỗi.

> Senior tip: luôn khai báo giá trị mặc định hợp lý **hoặc** @NotNull, đừng để field nullable mà không có mặc định. Trong hồ sơ phỏng vấn, đây là minh chứng bạn dùng cấu hình "fail fast" thay vì để lỗi cấu hình nổ ra lúc production chạy.`
},
{
  id: 'qz-spring-040',
  topic: 'spring',
  q: `Method {{A.report()}} có {{@Transactional(propagation = Propagation.SUPPORTS)}} và được gọi từ controller (hiện **không** có transaction nào đang mở). {{report()}} chỉ đọc dữ liệu. Điều gì xảy ra?`,
  options: [
    'Spring mở một transaction mới vì SUPPORTS luôn mở',
    'Method chạy **không** có transaction, vì SUPPORTS tham gia transaction nếu có, còn không thì chạy không transaction',
    'Spring ném exception vì SUPPORTS cần transaction',
    'Method chạy với transaction read-only mặc định'
  ],
  answer: 1,
  explain: `**Đáp án đúng: chạy không có transaction, vì SUPPORTS = "có thì tham gia, không có thì chạy không transaction".**

### Vì sao đúng
Propagation {{SUPPORTS}} nghĩa là: nếu đã có transaction đang chạy thì method **tham gia** vào đó; nếu không có thì method thực thi **bình thường không transaction**. Đây khác với {{REQUIRED}} (luôn có: tham gia nếu có, mở mới nếu không), {{REQUIRES_NEW}} (luôn mở transaction mới), {{MANDATORY}} (bắt buộc phải có transaction, không có thì ném exception). Với một method đọc thuần, SUPPORTS là lựa chọn hợp lý vì không ép mở transaction tốn connection khi caller không cần.

### Vì sao các phương án còn lại sai
- **Luôn mở mới**: đó là REQUIRED, không phải SUPPORTS.
- **Ném exception**: đó là MANDATORY.
- **Transaction read-only mặc định**: SUPPORTS không tạo transaction, nên không có readOnly; readOnly chỉ có nghĩa khi có transaction (xem qz-spring-014).

> Senior tip: SUPPORTS và REQUIRED khác nhau ở "khi không có transaction". Trên thực tế hầu hết method service dùng REQUIRED (mặc định). SUPPORTS/NOT_SUPPORTED chỉ dùng ở method có thể nằm trong hoặc ngoài transaction tùy caller — hãy chọn có ý thức, đừng để mặc định "nuốt" mọi thứ.`
},
{
  id: 'qz-spring-041',
  topic: 'spring',
  q: `Bạn viết một {{BeanPostProcessor}}:
~~~java
public class AuditPostProcessor implements BeanPostProcessor {
    @Override
    public Object postProcessAfterInitialization(Object bean, String name) {
        return bean; // (giả sử bọc proxy ở đây)
    }
}
~~~
Vấn đề nào là thật khi bean này áp dụng lên chính nó hoặc lên một bean {{@Configuration}} khác trong cùng context?`,
  options: [
    'BeanPostProcessor chạy quá sớm, trước khi bean được tạo',
    'BeanPostProcessor áp dụng cho mọi bean, kể cả chính nó và các BeanPostProcessor khác, dễ gây vòng lặp hoặc proxy bị bọc nhiều lớp; Spring xử lý bằng cách bỏ qua một số loại bean (ví dụ chính các BeanPostProcessor)',
    'BeanPostProcessor không bao giờ áp dụng cho bean @Configuration',
    'BeanPostProcessor chỉ chạy khi khởi động app lần đầu rồi bị xoá'
  ],
  answer: 1,
  explain: `**Đáp án đúng: BeanPostProcessor áp dụng cho mọi bean trong context, kể cả chính nó và các BeanPostProcessor khác; Spring có cơ chế tránh tự bọc chính nó.**

### Vì sao đúng
{{BeanPostProcessor}} được Spring gọi với **mọi** bean đi qua, không trừ ai. Nếu nó bọc proxy cho mọi bean, thì chính nó và các BeanPostProcessor khác cũng bị bọc, dễ gây vòng lặp vô hạn hoặc bọc nhiều lớp. Spring xử lý bằng cách: (1) bỏ qua chính instance của BeanPostProcessor khi gọi callback, (2) tạo BeanPostProcessor sớm hơn các bean thường. Vì BeanPostProcessor phải sẵn sàng trước, nó không thể phụ thuộc vào bean thường (nếu inject bean thường vào BeanPostProcessor, Spring sẽ tạo bean đó sớm và bỏ qua bước post-process, gây lỗi).

### Vì sao các phương án còn lại sai
- **Chạy trước khi bean được tạo**: sai, nó chạy **sau** khi bean đã được tạo và inject (postProcessAfterInitialization), trước khi bean đưa vào dùng.
- **Không áp dụng cho @Configuration**: sai, @Configuration cũng là bean thường, vẫn bị post-process (đây là lý do @Configuration có thể bị CGLIB proxy).
- **Chỉ chạy lần đầu rồi xoá**: sai, nó là singleton sống suốt vòng đời context, không bị xoá.

> Senior tip: nếu BeanPostProcessor của bạn bọc proxy lên mọi bean, hãy kiểm tra {{bean instanceof AopInfrastructureBean}} hoặc tên bean để tránh bọc chính hạ tầng AOP. Và đừng inject bean nghiệp vụ vào BeanPostProcessor — nó sẽ bị tạo quá sớm, làm mất tác dụng của các post-processor khác.`
},
{
  id: 'qz-spring-042',
  topic: 'spring',
  q: `Bạn viết auto-configuration cho một thư viện nội bộ:
~~~java
@AutoConfiguration
@ConditionalOnClass(RedisTemplate.class)
public class MyCacheAutoConfiguration {
    @Bean
    @ConditionalOnMissingBean
    public MyCacheClient myCacheClient(RedisTemplate<String, String> redis) { return new MyCacheClient(redis); }
}
~~~
Điều gì xảy ra nếu bạn **quên** {{@ConditionalOnMissingBean}} trên method {{myCacheClient}}?`,
  options: [
    'Người dùng tự khai báo một {{@Bean MyCacheClient}} của riêng họ: context có 2 bean cùng kiểu và fail lúc inject với {{NoUniqueBeanDefinitionException}}',
    'Auto-configuration tự ghi đè bean của người dùng vì nó luôn được nạp sau',
    'Bean của người dùng bị bỏ qua một cách im lặng, không có lỗi nào',
    'Ứng dụng không khởi động vì thiếu {{@ConditionalOnMissingBean}} là lỗi cú pháp'
  ],
  answer: 0,
  explain: `**Đáp án đúng: có hai bean cùng kiểu, và mọi chỗ inject {{MyCacheClient}} sẽ fail vì không biết chọn bean nào.**

### Vì sao đúng
- "Auto-configuration" (tự động cấu hình) là cách Spring Boot đoán giúp bạn các bean thường dùng (DataSource, ObjectMapper, RedisTemplate...) dựa trên classpath và thuộc tính. Mỗi bean do Boot tạo đều được bọc bằng {{@ConditionalOnMissingBean}}: "chỉ tạo nếu người dùng chưa tự tạo bean cùng loại".
- Thiếu điều kiện đó, bean của Boot **vẫn được tạo** kể cả khi người dùng đã khai báo bean riêng. Kết quả là context có 2 bean cùng kiểu {{MyCacheClient}}.
- Spring chỉ báo lỗi khi có chỗ cần **inject** (hoặc khi bạn gọi {{getBean(MyCacheClient.class)}}): lúc đó nó thấy 2 ứng viên, không có {{@Primary}} để phân xử, nên ném {{NoUniqueBeanDefinitionException}}. Đây là lỗi lúc khởi động nếu có bean phụ thuộc vào nó, nhưng nguyên nhân là "hai ứng viên", không phải "thiếu điều kiện".
- Một biến thể hay gặp nữa: nếu inject bằng {{List<MyCacheClient>}} thì không có lỗi nào — ứng dụng chạy với 2 bean, và có thể dùng cả hai mà không hề biết.

### Vì sao các phương án còn lại sai
- **Boot ghi đè bean người dùng**: auto-configuration không ghi đè bean khai báo thủ công; nó chỉ thêm bean còn thiếu.
- **Bean người dùng bị bỏ im lặng**: ngược lại, bean thủ công luôn được giữ; chính bean của Boot mới là bean "dư".
- **Lỗi cú pháp**: annotation là tuỳ chọn, không có nó thì code vẫn hợp lệ.

### Cách đúng
~~~java
@Bean
@ConditionalOnMissingBean        // Boot lùi lại khi người dùng đã có bean riêng
public MyCacheClient myCacheClient(RedisTemplate<String, String> redis) { ... }
~~~

> Senior tip: xem báo cáo bằng {{--debug}} (Condition Evaluation Report) hoặc bật {{logging.level.org.springframework.boot.autoconfigure=DEBUG}}. Quy tắc chung khi viết starter: customize thì dùng Customizer/thuộc tính, còn {{@ConditionalOnMissingBean}} dùng cho mọi bean có thể thay thế.`
},
{
  id: 'qz-spring-043',
  topic: 'spring',
  q: `Service khai báo một field {{prototype}} và inject vào một singleton:
~~~java
@Service
public class ReportService {
    @Autowired private ReportData data;   // ReportData scope = prototype

    public void render() { data.reset(); data.load(); }
}
~~~
{{ReportData}} được tạo bao nhiêu lần?`,
  options: [
    'Hai lần: một lần lúc khởi động ứng dụng, một lần mỗi lần gọi {{render()}}',
    'Một lần mỗi lần gọi {{render()}} vì prototype luôn tạo mới khi được dùng',
    'Một lần duy nhất lúc khởi động: singleton chỉ nhận đúng một instance prototype lúc nó được tạo, nên mọi lời gọi {{render()}} dùng chung một object',
    'Hai instance được luân phiên giữa các lần gọi'
  ],
  answer: 2,
  explain: `**Đáp án đúng: một lần duy nhất, lúc singleton được tạo; sau đó mọi lời gọi dùng lại chính object đó.**

### Vì sao đúng
- "Scope" (phạm vi sống) quyết định bean được tạo bao nhiêu lần. {{singleton}} = một instance cho cả context; {{prototype}} = **mỗi lần có ai yêu cầu** thì tạo một instance mới.
- Chữ "yêu cầu" ở đây là lúc **dependency được giải quyết**, không phải mỗi lần method chạy. Khi Spring tạo {{ReportService}} (một singleton, tạo đúng một lần lúc khởi động), nó phải inject field {{data}}: nó gọi {{getBean}} một lần, nhận một instance prototype, rồi **giữ tham chiếu đó trong field** suốt đời bean.
- Vì vậy trong ví dụ, {{render()}} dùng **cùng một** {{data}} ở mọi request. Nếu {{render()}} chạy đồng thời trên nhiều thread (mỗi request một thread), hai request sẽ cùng sửa state của một object → dữ liệu lẫn lộn. Đây là bug "prototype inject vào singleton" kinh điển.
- Cách đúng: không giữ prototype trong field, mà lấy mới mỗi lần dùng:
~~~java
@Service
public class ReportService {
    private final ObjectProvider<ReportData> provider;   // hoặc ApplicationContext / @Lookup
    public ReportData newData() { return provider.getObject(); }  // mỗi lần một instance mới
}
~~~

### Vì sao các phương án còn lại sai
- **Hai lần (khởi động + mỗi render)**: Spring không "làm mới" field; nó chỉ inject một lần.
- **Mỗi lần render một instance mới**: chỉ đúng nếu bạn chủ động lấy bean qua {{ObjectProvider}}/{{ApplicationContext}}/{{@Lookup}} hoặc khai báo method {{@Bean}} trong class cấu hình.
- **Luân phiên hai instance**: không có cơ chế như vậy.

### Cách kiểm tra nhanh
Đặt một field id tăng dần trong {{ReportData}} và log nó trong {{render()}}: sẽ thấy cùng một id ở mọi request.

> Senior tip: singleton giữ state per-request (danh sách kết quả, biến tạm, EntityManager) là một trong các nguyên nhân hàng đầu của lỗi "dữ liệu của user A hiện cho user B". Hãy để state đó ở biến local của method hoặc ở bean scope {{request}}/{{prototype}} lấy qua provider, và dùng {{@Scope(proxyMode = ...)}} khi cần inject trực tiếp.`
},
{
  id: 'qz-spring-044',
  topic: 'spring',
  multi: true,
  q: 'Bạn viết một class {{@Configuration}} và inject bean {{auditService}} vào field của chính nó rồi gọi từ trong method. Phát biểu nào đúng? (Chọn 2)',
  options: [
    'Class {{@Configuration}} được Spring bọc bằng một subclass CGLIB, nhờ đó gọi {{this.myBean()}} trả về đúng singleton đang được quản lý chứ không tạo bean mới mỗi lần',
    'Không nên inject bean nghiệp vụ vào field của class {{@Configuration}}: nó làm các bean bị tạo sớm, trước khi các BeanPostProcessor kịp chạy, dẫn tới bean thiếu proxy hoặc vòng phụ thuộc',
    'Class {{@Configuration}} luôn là bean thường, không bao giờ bị proxy',
    'Cách tốt nhất để dùng lại logic trong class cấu hình là tự gọi method cấu hình bằng {{this}} thay vì qua Spring'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: @Configuration bị CGLIB subclass nên this.myBean() vẫn đi qua lớp proxy đó; nhưng không nên inject bean nghiệp vụ vào field của class cấu hình vì nó tạo bean quá sớm.**

### Vì sao đúng
- **CGLIB proxy cho @Configuration**: để bảo đảm mỗi method {{@Bean}} chỉ tạo bean **một lần**, Spring bọc class cấu hình bằng một **subclass** (CGLIB) ghi đè các method {{@Bean}}. Trong subclass đó, method {{@Bean}} kiểm tra "bean đã tồn tại trong context chưa" rồi mới quyết định trả về instance cũ hay tạo mới. Vì vậy gọi {{this.myBean()}} từ method khác trong cùng class vẫn đi qua subclass và vẫn trả về đúng singleton (khác với self-invocation của bean thường).
- **Không inject bean nghiệp vụ vào field cấu hình**: class cấu hình được xử lý **rất sớm**. Nếu bạn {{@Autowired}} một bean nghiệp vụ vào field của nó, Spring phải tạo bean đó ngay để tiêm, tức là bean đó được tạo **trước** khi các BeanPostProcessor (AOP, @Transactional, @Async) sẵn sàng → bean có thể mất proxy, hoặc sinh vòng phụ thuộc. Thay vào đó hãy nhận bean làm **tham số của method @Bean**, hoặc dùng {{ObjectProvider}}.

### Vì sao các phương án còn lại sai
- **@Configuration luôn là bean thường**: chỉ khi khai báo {{@Configuration(proxyBeanMethods = false)}} để tắt proxy (thường dùng cho các class cấu hình thuần hàm, muốn nhẹ hơn).
- **Tự gọi this để dùng lại logic**: với method @Bean thì this là đúng, nhưng kết luận "cách tốt nhất là tự gọi this" không đúng cho mọi tình huống; logic dùng lại nên nằm ở service riêng, còn class cấu hình chỉ khai báo bean.

### Cách đúng
~~~java
@Configuration
class CacheConfig {
    @Bean
    MyCacheClient client(RedisTemplate<String, String> redis, ObjectProvider<Metrics> metrics) {
        return new MyCacheClient(redis, metrics.getIfAvailable());  // nhận qua tham số, không inject field
    }
}
~~~

> Senior tip: dấu hiệu "cấu hình bị tạo quá sớm" là log kiểu "Bean X is not eligible for getting processed by all BeanPostProcessors". Khi thấy nó, hãy bỏ field injection khỏi class @Configuration, hoặc cân nhắc tách phần logic ra @Component riêng.`
},
{
  id: 'qz-spring-045',
  topic: 'spring',
  q: `Service có method {{importFile}} (mất 2 giây đọc file) rồi mới ghi DB bằng một câu INSERT, cả method đều {{@Transactional}}. Vấn đề nghiêm trọng nhất của cách viết này là gì?`,
  options: [
    'Giữ transaction mở trong lúc đọc file làm connection DB bị chiếm 2 giây; tải cao sẽ cạn HikariCP và request khác phải chờ lấy connection',
    '{{@Transactional}} làm method chậm hơn đáng kể vì phải bắt đầu transaction trước khi vào code',
    'Nên đổi sang {{REQUIRES_NEW}} cho {{importFile}} để nó không giữ connection lâu',
    'Đọc file xong mới ghi DB nên hai thao tác không cùng transaction, dữ liệu có thể lệch'
  ],
  answer: 0,
  explain: `**Đáp án đúng: transaction mở lâu chiếm connection; nên tách I/O ra khỏi transaction.**

### Vì sao đúng
- Transaction không phải "miễn phí về tài nguyên": khi một method {{@Transactional}} bắt đầu, Spring lấy một connection từ HikariCP và **giữ nó tới khi commit/rollback**. Connection là tài nguyên hữu hạn (mặc định {{maximumPoolSize = 10}}).
- Nếu transaction kéo dài 2 giây vì đọc file, mỗi request giữ 1 connection suốt 2 giây. Với 20 request đồng thời, pool 10 sẽ cạn ngay: các request còn lại xếp hàng chờ connection ({{connectionTimeout}} mặc định 30 giây rồi ném {{SQLTransientConnectionException}}). Đây là cách một tính năng "chỉ đọc file" làm sập cả API.
- Cách đúng: đọc/validate file **ngoài** transaction (biến local), chỉ bọc đoạn ghi DB trong một transaction ngắn:
~~~java
public void importFile(Path file) throws IOException {
    List<Row> rows = parse(Files.readAllBytes(file));   // không có connection nào bị giữ
    saveAll(rows);                                      // @Transactional, chỉ vài trăm ms
}
~~~
- Quy tắc: transaction nên tính bằng **mili giây**, chỉ chứa thao tác DB. Không gọi HTTP, không đọc file, không gửi email, không {{Thread.sleep}} bên trong {{@Transactional}}.

### Vì sao các phương án còn lại sai
- **@Transactional làm code chậm hơn đáng kể**: chi phí bắt đầu transaction là nhỏ (vài micro giây); vấn đề là **thời gian giữ connection**, không phải tốc độ chạy câu lệnh.
- **REQUIRES_NEW cho importFile**: {{REQUIRES_NEW}} tạo transaction thứ hai, vẫn giữ connection trong suốt 2 giây — thậm chí còn giữ **hai** connection nếu caller đã có transaction (xem qz-spring-027). Không giải quyết vấn đề.
- **Hai thao tác không cùng transaction**: sai, cả method đang nằm trong một transaction nên đọc và ghi vẫn cùng một đơn vị công việc (đọc file chỉ là I/O, không tham gia rollback).

> Senior tip: theo dõi metric {{hikaricp_connections_pending}} và {{hikaricp_connections_usage_seconds}}. Nếu pending cao mà DB vẫn rảnh, gần như chắc chắn có transaction dài do I/O hoặc gọi service ngoài nằm bên trong.`
},
{
  id: 'qz-spring-046',
  topic: 'spring',
  q: 'Ứng dụng Spring Boot 3 (Spring Framework 6.2) không khai báo cấu hình gì thêm. Bean {{PaymentService}} có constructor nhận {{PaymentClient}} và cả {{PaymentService}} lẫn {{PaymentClient}} đều nhận nhau qua constructor. Khi khởi động thì sao?',
  options: [
    'Boot tự động bật lại {{spring.main.allow-circular-references=true}} nên ứng dụng chạy được',
    'Ứng dụng không khởi động được: constructor injection không thể phá vòng, Spring ném {{BeanCurrentlyInCreationException}} và Boot in báo cáo "The dependencies of some of the beans in the application context form a cycle"',
    'Spring tạo một instance thứ hai của một trong hai bean để phá vòng',
    'Ứng dụng khởi động được nhưng một trong hai bean là null'
  ],
  answer: 1,
  explain: `**Đáp án đúng: khởi động fail với lỗi vòng phụ thuộc.**

### Vì sao đúng
- Constructor injection nghĩa là dependency phải sẵn sàng **trước khi** object được tạo. Để tạo A cần B, để tạo B cần A → không có điểm bắt đầu. Đây là lý do constructor injection "fail fast": vòng phụ thuộc bị phát hiện ngay lúc khởi động, kèm sơ đồ chuỗi bean.
- Từ Spring Boot 2.6, vòng phụ thuộc **bị cấm mặc định** ({{spring.main.allow-circular-references=false}}), kể cả với field/setter injection (vốn Spring giải được bằng "early reference": tạo object A chưa xong, đưa tham chiếu sớm cho B, rồi hoàn thiện A sau). Bật lại cờ này chỉ là lùi về hành vi cũ, không phải cách sửa.
- Cách sửa đúng: tách phần dùng chung ra bean thứ ba, hoặc đảo chiều phụ thuộc bằng event ({{ApplicationEventPublisher}}), hoặc dùng {{@Lazy}} trên một tham số constructor như giải pháp tạm.

### Vì sao các phương án còn lại sai
- **Boot tự bật lại cờ**: Boot không tự bật; mặc định là chặn. Bạn phải tự đặt thuộc tính (và không nên).
- **Tạo instance thứ hai**: singleton không bao giờ được nhân đôi để phá vòng.
- **Một bean null**: Spring không bao giờ âm thầm inject null cho dependency bắt buộc.

### Cấu hình "chạy được" (không khuyến nghị)
~~~yaml
spring.main.allow-circular-references: true   # chỉ là băng keo, xem qz-spring-010
~~~

> Senior tip: khi phỏng vấn hỏi về vòng phụ thuộc, câu trả lời tốt nhất là "tôi coi nó là lỗi thiết kế, không phải lỗi cấu hình". Hãy chỉ ra hai class đang ôm cùng một trách nhiệm và đề xuất tách.`
},
{
  id: 'qz-spring-047',
  topic: 'spring',
  multi: true,
  q: 'Bạn muốn chạy một đoạn logic ngay sau khi ứng dụng đã sẵn sàng nhận request (ví dụ warm cache từ DB). Những cách nào phù hợp? (Chọn 2)',
  options: [
    '{{@PostConstruct}} trên một bean được khởi tạo sớm',
    'Bean implements {{ApplicationRunner}} (hoặc {{CommandLineRunner}})',
    '{{@EventListener(ApplicationReadyEvent.class)}} trên một method',
    'Bắt đầu một thread mới ngay trong static initializer của class'
  ],
  answer: [1, 2],
  explain: `**Đáp án đúng: ApplicationRunner/CommandLineRunner và listener của ApplicationReadyEvent.**

### Vì sao đúng
- {{ApplicationRunner}}/{{CommandLineRunner}}: Boot gọi {{run()}} sau khi context đã refresh xong, ngay trước khi ứng dụng "báo đã sẵn sàng". Đây là chỗ tiêu chuẩn cho việc khởi tạo dữ liệu hay warm cache.
- {{ApplicationReadyEvent}}: sự kiện được phát **sau cùng** khi ứng dụng đã sẵn sàng (sau khi các runner chạy xong). Dùng {{@EventListener}} để xử lý; nếu cần transaction thì mở {{@Transactional}} bình thường — lúc này mọi proxy đã tồn tại.
- Cả hai đều chạy trên thread chính lúc khởi động. Nếu việc warm cache mất 30 giây, hãy cân nhắc chạy bất đồng bộ (có executor riêng) hoặc chuyển sang job nền, vì readiness probe của Kubernetes có thể fail trong lúc chờ.

### Vì sao các phương án còn lại sai
- **@PostConstruct**: chạy quá sớm. Lúc đó proxy AOP (transaction, async) còn chưa được tạo, các bean khác có thể chưa sẵn sàng, và connection pool có thể chưa "ấm". Gọi method {{@Transactional}} trong đó cũng không có transaction (self-invocation, xem qz-spring-009).
- **Thread trong static block**: không có context, không có transaction, không có cách báo lỗi gọn gàng; lỗi trong đó chỉ in ra log rồi mất. Khởi tạo hạ tầng không nên trốn trong static.

### Ví dụ
~~~java
@Component
class Warmup {
    private final PriceCache cache;
    Warmup(PriceCache cache) { this.cache = cache; }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional(readOnly = true)
    public void warm() { cache.reload( findAllLatestPrices() ); }
}
~~~

> Senior tip: đặt timeout cho warm-up và log thời gian thực hiện. Nếu warm-up quá lâu, dùng {{management.endpoint.health.group.readiness}} hoặc tách probe để Kubernetes không đưa traffic vào pod chưa sẵn sàng.`
},
{
  id: 'qz-spring-048',
  topic: 'spring',
  q: '{{OrderService.create()}} có {{@Transactional}}, bên trong publish {{OrderCreated}}. Bean {{AuditListener}} có hai method: {{onOrder}} ({{@EventListener}}) và {{onOrderTx}} ({{@TransactionalEventListener}}, không khai báo phase). Hỏi: nếu {{create()}} được gọi từ một method **không có** transaction thì điều gì xảy ra?',
  options: [
    '{{onOrder}} chạy đồng bộ ngay trong lúc publish; {{onOrderTx}} mặc định cũng chạy ngay vì nó là @EventListener',
    '{{onOrder}} không chạy vì không có transaction; {{onOrderTx}} chạy ngay',
    '{{onOrder}} chạy bình thường, còn {{onOrderTx}} bị bỏ qua hoàn toàn (im lặng) vì mặc định fallbackExecution = false',
    'Cả hai đều ném exception vì thiếu transaction'
  ],
  answer: 2,
  explain: `**Đáp án đúng: @EventListener vẫn chạy; @TransactionalEventListener bị bỏ qua im lặng vì fallbackExecution = false.**

### Vì sao đúng
- {{@EventListener}} là listener đồng bộ, đơn giản: method được gọi ngay tại thời điểm {{publishEvent}}, trên **cùng thread**, trong cùng transaction (nếu có). Nó không cần transaction, nên vẫn chạy bình thường.
- {{@TransactionalEventListener}} không gọi listener ngay. Nó đăng ký một {{TransactionSynchronization}} gắn với transaction hiện tại; phase mặc định là {{AFTER_COMMIT}}, nên listener chỉ chạy khi commit **thành công**. Nếu **không có** transaction nào, Spring không có gì để đăng ký, và mặc định {{fallbackExecution = false}} khiến listener **bị bỏ qua hoàn toàn** — không lỗi, không log, event biến mất. Đây là cái bẫy nguy hiểm nhất của cơ chế này.
- Sau commit, transaction đã kết thúc: nếu listener cần ghi DB, nó phải tự mở transaction mới ({{@Transactional(propagation = REQUIRES_NEW)}} hoặc để method có {{@Transactional}} trên một bean khác).

### Vì sao các phương án còn lại sai
- **onOrderTx chạy ngay vì là @EventListener**: nó là {{@TransactionalEventListener}}, không phải {{@EventListener}}; và kể cả có transaction thì nó cũng chờ tới sau commit.
- **onOrder không chạy khi không có transaction**: {{@EventListener}} không liên quan tới transaction.
- **Cả hai ném exception**: không có exception nào; listener bị bỏ qua là hành vi im lặng.

### Hai cái bẫy cần nhớ
~~~text
1. publish khi không có transaction  -> onOrderTx KHÔNG chạy (im lặng!)
2. AFTER_COMMIT + ghi DB          -> phải mở transaction mới, nếu không sẽ không được commit
~~~

> Senior tip: AFTER_COMMIT vẫn có khe hở: commit xong mà pod chết trước khi gửi mail thì event mất. Khi event bắt buộc phải tới nơi (thanh toán, tồn kho), dùng transactional outbox: ghi event vào bảng outbox trong cùng transaction, một relay đẩy sang broker (xem qz-spring-015).`
},
{
  id: 'qz-spring-049',
  topic: 'spring',
  q: '{{CatalogService}} cần gọi chính method {{@Async}} của nó từ một method {{@Transactional}} khác trong cùng class, để việc index diễn ra sau khi transaction commit. Bạn đề xuất cách nào?',
  options: [
    'Đặt {{@Async}} lên method rồi gọi {{this.index()}} ở cuối method {{@Transactional}}',
    'Dùng {{TransactionSynchronizationManager.registerSynchronization(...)}} với {{afterCommit}} để gọi một bean khác có method {{@Async}} (hoặc gọi trong {{@TransactionalEventListener(AFTER_COMMIT)}})',
    'Đặt {{@Async}} lên **class** thay vì method, như vậy self-invocation sẽ được áp dụng',
    'Gọi {{this.index()}} ngay đầu method {{@Transactional}}, trước khi có exception nào'
  ],
  answer: 1,
  explain: `**Đáp án đúng: đăng ký callback afterCommit, và gọi executor/bean khác ở thời điểm đó.**

### Vì sao đúng
Cần đồng thời hai thứ:
1. **Thời điểm đúng**: công việc chỉ nên chạy sau khi commit (nếu không, thread async có thể đọc dữ liệu chưa commit hoặc đọc dữ liệu đã bị rollback).
2. **Proxy đúng**: {{@Async}} chỉ có tác dụng khi lời gọi đi qua proxy, tức là từ **bean khác**. Gọi {{this.index()}} là self-invocation, chạy đồng bộ trên thread của caller (xem qz-spring-035).

Cách làm:
~~~java
@Service
public class CatalogService {
    private final Indexer indexer;   // bean khác, có @Async

    @Transactional
    public void create(Catalog c) {
        catalogRepo.save(c);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override public void afterCommit() { indexer.indexAsync(c.id()); }  // qua proxy
        });
    }
}
~~~
Hoặc gọn hơn: publish event và để listener dùng {{@TransactionalEventListener(phase = AFTER_COMMIT)}} + {{@Async}} trên method của listener (lúc đó listener là một bean riêng, nên proxy hoạt động).

### Vì sao các phương án còn lại sai
- **this.index() ở cuối method @Transactional**: chạy **trước** commit, và chạy đồng bộ — sai cả thời điểm lẫn cơ chế.
- **@Async trên class**: @Async vẫn là AOP dựa trên proxy; self-invocation vẫn bỏ qua proxy dù annotation đặt ở class. (Đặt trên class chỉ có nghĩa "mọi method public đều async", không thay đổi cách proxy hoạt động.)
- **Gọi đầu method**: chạy trước cả khi save, và vẫn là self-invocation.

> Senior tip: nếu thứ tự "commit rồi mới gửi" quan trọng, hãy nghĩ tới outbox: ghi một dòng công việc vào DB trong cùng transaction, một scheduler/Debezium đọc và đẩy đi. Callback afterCommit mất tác dụng nếu pod chết ngay sau commit — điều rất dễ xảy ra khi deploy.`
},
{
  id: 'qz-spring-050',
  topic: 'spring',
  multi: true,
  q: 'Bạn thêm một starter mới vào ứng dụng Spring Boot 3 và một bean của bạn "biến mất" sau khi nâng cấp. Cách nào giúp chẩn đoán nhanh vì sao auto-configuration của starter không áp dụng (hoặc áp dụng sai)? (Chọn 2)',
  options: [
    'Chạy ứng dụng với {{--debug}} để xem Condition Evaluation Report (báo cáo điều kiện) và phần "Negative matches" giải thích vì sao từng auto-config bị loại',
    'Bật {{logging.level.org.springframework.boot.autoconfigure=DEBUG}} để thấy chi tiết điều kiện',
    'Xoá sạch {{target}} và build lại, vì mọi lỗi auto-config đều do file cũ',
    'Thêm {{@ComponentScan}} thủ công để quét lại package của starter'
  ],
  answer: [0, 1],
  explain: `**Đáp án đúng: Condition Evaluation Report (--debug) và log DEBUG của package autoconfigure.**

### Vì sao đúng
- {{--debug}} (hoặc {{java -jar app.jar --debug}}) bật Condition Evaluation Report. Nó liệt kê từng auto-configuration kèm "Positive matches" (điều kiện thoả, bean đã được tạo) và "Negative matches" (điều kiện không thoả, kèm lý do cụ thể như "Did not find 'some.Class' on the classpath" hay "None of the beans matched").
- {{logging.level.org.springframework.boot.autoconfigure=DEBUG}} cho thông tin tương tự ngay trong log thường, hữu ích khi chạy trên Kubernetes (dễ hơn là phải thêm tham số khởi động).
- Với lỗi "bean của tôi biến mất", thường là do @ConditionalOnMissingBean của chính bạn (bạn đã tự khai báo bean trùng nên bean kia bị loại), hoặc do thiếu class/property. Báo cáo điều kiện chỉ thẳng nguyên nhân.

### Vì sao các phương án còn lại sai
- **Xoá target rồi build lại**: không phải nguyên nhân của lỗi auto-config (và cũng không chẩn đoán được gì).
- **Thêm @ComponentScan thủ công**: auto-configuration không nằm trong package của bạn, nó được nạp từ {{META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports}}. Quét lại package không giúp gì, còn có thể vô tình bật những thứ không mong muốn.

### Câu lệnh hữu ích
~~~bash
java -jar app.jar --debug | grep -A 3 "Negative matches" | head -50
~~~

> Senior tip: nếu bạn tự viết starter, hãy đặt tên class theo quy ước ({{XxxAutoConfiguration}}), khai báo trong file imports, và viết test {{ApplicationContextRunner}} để khẳng định bean được tạo khi có điều kiện và **không** được tạo khi thiếu — đây là cách duy nhất chắc chắn starter không "chết im lặng".`
},
{
  id: 'qz-spring-051',
  topic: 'spring',
  q: '{{ReportService}} có hai dependency: {{JasperReportService}} đánh dấu {{@Lazy}} trên tham số constructor, và {{PdfRenderer}} (bean thường). Khi khởi động, điều gì xảy ra?',
  options: [
    'Cả hai bean đều được tạo ngay lúc khởi động như bình thường',
    'Bean được {{@Lazy}} nhận một proxy: nó chưa được tạo lúc khởi động, chỉ được tạo ở lần gọi method đầu tiên; còn {{PdfRenderer}} vẫn được tạo ngay',
    '{{@Lazy}} làm ứng dụng khởi động chậm hơn vì phải tạo proxy',
    '{{@Lazy}} chỉ có tác dụng trên {{@Bean}} method, không dùng trên tham số constructor'
  ],
  answer: 1,
  explain: `**Đáp án đúng: @Lazy trên tham số constructor khiến Spring inject một proxy; bean thật chỉ được tạo ở lần dùng đầu tiên.**

### Vì sao đúng
- {{@Lazy}} (Spring 4.3+ hỗ trợ trên tham số constructor) làm Spring không tạo bean đó lúc khởi động. Thay vào đó nó inject một **proxy** cùng kiểu; proxy sẽ gọi {{getBean}} và khởi tạo bean thật ở **lần gọi method đầu tiên** (hoặc lần truy cập field đầu tiên).
- Đây là công cụ chính thức để phá vòng phụ thuộc: một trong hai bean không cần tồn tại ngay, nên chuỗi "tạo A cần B, tạo B cần A" không còn là vòng.
- Giá trị khác: khởi động nhanh hơn, và nếu bean đó có lỗi cấu hình thì lỗi chỉ nổ ra khi thực sự dùng (đánh đổi: "fail fast" bị hoãn lại). Vì vậy {{@Lazy}} là giải pháp **cho vòng phụ thuộc**, không phải cách tăng tốc chung — nó làm chậm lần gọi đầu (và có thể gây "lần đầu request bị chậm" nếu khởi tạo nặng).
- {{@Lazy}} cũng dùng được trên {{@Bean}} method, trên field {{@Autowired}}, và trên {{@Configuration}} class.

### Vì sao các phương án còn lại sai
- **Cả hai tạo ngay**: chỉ đúng với bean không có @Lazy.
- **@Lazy làm khởi động chậm hơn vì tạo proxy**: tạo proxy là chi phí nhỏ; khởi động thường **nhanh hơn** vì không phải tạo bean.
- **Chỉ dùng trên @Bean method**: sai, @Lazy dùng được ở nhiều vị trí như trên.

### Lưu ý khi test
~~~java
@Lazy @Autowired private PaymentClient client;   // proxy, chưa khởi tạo
// client.doSomething();                           // lần gọi đầu -> bean thật được tạo
~~~

> Senior tip: đừng lạm dụng @Lazy để "chữa" mọi vấn đề khởi động. Nếu một bean @Lazy hoá ra luôn được dùng trong 5 phút đầu, bạn chỉ dời chi phí khởi tạo sang request của khách hàng. Vòng phụ thuộc thật sự thì nên tách bean hoặc dùng event.`
},
{
  id: 'qz-spring-052',
  topic: 'spring',
  q: 'Một ứng dụng Spring Boot 3 (Spring 6.2) dùng field injection: {{@Autowired private OrderRepository repo;}}. Điều gì xảy ra nếu không có bean {{OrderRepository}} nào trong context?',
  options: [
    'Vẫn hoạt động bình thường, field nhận null và lỗi chỉ xuất hiện khi gọi method',
    'Spring tự tạo một instance {{OrderRepository}} rỗng để ứng dụng chạy được',
    'Field injection làm bean được tạo hai lần (một cho field, một cho class)',
    'Ứng dụng fail lúc khởi động với {{NoSuchBeanDefinitionException}} (bọc trong {{UnsatisfiedDependencyException}}), vì {{required = true}} là mặc định'
  ],
  answer: 3,
  explain: `**Đáp án đúng: fail lúc khởi động, vì @Autowired(required = true) là mặc định.**

### Vì sao đúng
- Mặc định {{@Autowired(required = true)}}: nếu không tìm thấy bean nào phù hợp, Spring ném {{NoSuchBeanDefinitionException}} (bọc trong {{UnsatisfiedDependencyException}}) và **chặn khởi động**. Đây là "fail fast": lỗi cấu hình nổ ra lúc boot, không phải lúc khách hàng gọi API.
- Muốn cho phép thiếu thì {{@Autowired(required = false)}} hoặc dùng {{Optional<T>}}/{{ObjectProvider<T>}} — nhưng khi đó bạn phải tự xử lý trường hợp null.
- Field injection vẫn chạy được, chỉ bất tiện: field không thể {{final}} (Spring set giá trị sau khi constructor chạy), unit test thuần phải dùng reflection hoặc {{@InjectMocks}}, và class dễ phình mà không ai để ý (không thấy dependency trong constructor).

### Vì sao các phương án còn lại sai
- **Field nhận null**: chỉ khi {{required = false}}; mặc định là fail.
- **Spring tự tạo instance rỗng**: Spring không bao giờ tự tạo bean không được khai báo.
- **Bean được tạo hai lần**: injection chỉ **tham chiếu** tới một bean đã tồn tại; số lần tạo bean do scope quyết định (singleton tạo một lần).

### So sánh nhanh
~~~java
// field injection: test phải dùng reflection
@Service class A { @Autowired private B b; }

// constructor injection: test bằng new, dependency final
@Service class A { private final B b; A(B b) { this.b = b; } }
~~~

> Senior tip: constructor injection là mặc định ngầm định của các dự án Spring hiện đại (Spring 4.3+ không cần @Autowired khi chỉ có một constructor). Khi review, một constructor dài 6–7 tham số là tín hiệu tách class.`
},
{
  id: 'qz-spring-053',
  topic: 'spring',
  q: '{{PaymentService.applyRefund}} là method {{public}} có {{@Transactional}}, được gọi từ {{OrderController}} qua bean {{paymentService}} (đi qua proxy). Câu nào mô tả đúng thứ tự các bước Spring thực hiện?',
  options: [
    'Mở transaction → chạy method → commit/rollback; exception RuntimeException làm rollback, checked exception mặc định vẫn commit',
    'Chạy method trước, nếu có exception thì mở transaction rồi rollback',
    'Spring mở transaction khi bean được khởi tạo, không phải khi gọi method',
    'Spring commit trước khi method kết thúc để dữ liệu sẵn sàng cho các listener AFTER_COMMIT'
  ],
  answer: 0,
  explain: `**Đáp án đúng: mở transaction trước khi vào method, commit/rollback sau khi method trả về hoặc ném exception.**

### Vì sao đúng
Trình tự thực tế của một lời gọi {{@Transactional}} đi qua proxy:
~~~text
1. Proxy chặn lời gọi từ controller (đi qua bean paymentService)
2. TransactionInterceptor mở transaction: lấy connection từ pool, setAutoCommit(false)
3. Gọi method thật
   - nếu ném RuntimeException/Error  -> đánh dấu rollback, rollback khi ra khỏi method
   - nếu ném checked exception        -> mặc định vẫn COMMIT, rồi mới ném tiếp lên caller
   - nếu return bình thường           -> commit
4. Trả connection về pool, trả kết quả (hoặc ném exception) cho caller
~~~
Điểm quan trọng cho phỏng vấn: exception **không** tự động rollback như bạn nghĩ — mặc định chỉ unchecked. Đây là lý do câu qz-spring-007 và thuộc tính {{rollbackFor = Exception.class}} tồn tại.
Và vì transaction mở ở **proxy** (bên ngoài), mọi lời gọi {{this.method()}} đều không có bước 1–4: đó là self-invocation (qz-spring-021, qz-spring-036).

### Vì sao các phương án còn lại sai
- **Chạy method trước rồi mới mở transaction**: bất khả thi; transaction phải tồn tại trước khi câu SQL đầu tiên chạy.
- **Mở transaction lúc bean khởi tạo**: transaction gắn với **lời gọi method** (thread hiện tại), không phải với vòng đời bean.
- **Commit trước khi method kết thúc để listener chạy**: ngược lại, AFTER_COMMIT chạy **sau** commit, tức sau khi method đã kết thúc.

> Senior tip: đặt một log ở đầu và cuối method có @Transactional, so với log trong một {{TransactionSynchronization.beforeCommit/afterCommit}}: bạn sẽ thấy rõ thứ tự này. Đây là bài kiểm tra nhỏ nhưng rất hiệu quả để chứng minh bạn hiểu proxy chứ không chỉ học thuộc annotation.`
},
);
