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
}
);
